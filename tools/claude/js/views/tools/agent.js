/*
 * tools/agent.js - the subagent builder and checker (#/tools/agent).
 *
 * Build: fill in the fields, or start from one of the kit's subagents (repo-explorer, flow-tracer,
 * test-runner), and get the agent file for .claude/agents/ plus a `claude --agents` command that
 * tries the same agent for one session without saving anything. Check: paste an agent file. Both are
 * checked the way Claude Code reads them (code.claude.com/docs/en/sub-agents, 2.1.309): files it
 * skips without a word (no name, no description, a colon in the name, YAML that does not parse),
 * fields it ignores (only camelCase names count), tools that resolve to nothing, a reviewer that can
 * edit, values out of range. The checks' messages are data (data/tool-checks.js, "agent").
 * The draft is kept in "clt.tool.agent".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit;
  var ID = 'agent';

  var EMPTY = { mode: 'build', scope: 'project', name: '', description: '', tools: '', disallowedTools: '', model: '', permissionMode: '',
    skills: '', memory: '', isolation: '', maxTurns: '', background: '', color: '', effort: '', omitClaudeMd: '', autoCompactWindow: '', prompt: '', pasted: '' };

  var FIELDS = ['name', 'description', 'tools', 'disallowedTools', 'model', 'permissionMode', 'maxTurns', 'autoCompactWindow', 'skills', 'mcpServers',
    'hooks', 'memory', 'background', 'omitClaudeMd', 'effort', 'isolation', 'color', 'initialPrompt', 'experimental'];
  var MODELS = ['sonnet', 'opus', 'haiku', 'fable', 'inherit'];
  var MODES = ['default', 'manual', 'acceptEdits', 'auto', 'dontAsk', 'bypassPermissions', 'plan'];
  var COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
  var EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
  // tools a subagent can be given (code.claude.com/docs/en/tools-reference and /sub-agents); MCP tools are mcp__<server>__<tool>
  var TOOLS = ['Read', 'Grep', 'Glob', 'LSP', 'Bash', 'PowerShell', 'Edit', 'Write', 'NotebookEdit', 'MultiEdit', 'WebFetch', 'WebSearch', 'TodoWrite',
    'Skill', 'ToolSearch', 'EnterWorktree', 'ExitWorktree', 'Monitor', 'TaskStop', 'SendMessage', 'Artifact', 'Agent', 'Task', 'Workflow',
    'TaskCreate', 'TaskGet', 'TaskList', 'TaskUpdate', 'CronCreate', 'CronDelete', 'CronList', 'ExitPlanMode', 'ListAgents'];
  var WRITE_TOOLS = ['Edit', 'Write', 'NotebookEdit', 'MultiEdit'];
  var READ_ONLY_JOB = /\b(?:review(?:s|er|ing)?|explor(?:e|es|er|ing)|research(?:es|er|ing)?|read-only|audit(?:s|or|ing)?|analy[sz](?:e|es|er|ing)|map(?:s|per|ping)?|trac(?:e|es|er|ing)|investigat(?:e|es|or|ing)|inspect(?:s|or|ing)?)\b/i;
  var TRIGGER = /\b(?:use (?:it |this )?(?:proactively|when|for|after|before|whenever|if|to|on)|when (?:the user|you|asked|someone|a user|working|writing|changing|reviewing|starting)|whenever|after (?:code|changes|edits|writing|every)|must be used)\b/i;

  function trim(s) { return String(s === undefined || s === null ? '' : s).trim(); }
  /** "Read, Grep" or a YAML list, as a list; commas inside ( ) belong to the entry. */
  function toolList(v) {
    if (Array.isArray(v)) return v.map(function (x) { return String(x).trim(); }).filter(Boolean);
    var s = String(v === undefined || v === null ? '' : v), out = [], cur = '', depth = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === '(') depth++;
      if (c === ')') depth = Math.max(0, depth - 1);
      if (!depth && (c === ',' || c === '\n')) { if (cur.trim()) out.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function numberOrText(v) { var s = trim(v); return /^\d+$/.test(s) ? parseInt(s, 10) : s; }
  function boolOrText(v) { var s = trim(v); return s === 'true' ? true : s === 'false' ? false : s; }

  /** A state from an agent file's text (for the presets and for "edit this one"). */
  function fromText(md) {
    var fm = U.yaml.frontmatter(md), f = fm.fields || {}, st = JSON.parse(JSON.stringify(EMPTY));
    ['name', 'description', 'model', 'permissionMode', 'memory', 'isolation', 'color', 'effort'].forEach(function (k) { if (f[k] !== undefined && f[k] !== null) st[k] = String(f[k]); });
    if (f.tools !== undefined) st.tools = toolList(f.tools).join(', ');
    if (f.disallowedTools !== undefined) st.disallowedTools = toolList(f.disallowedTools).join(', ');
    if (f.skills !== undefined) st.skills = toolList(f.skills).join(', ');
    ['maxTurns', 'autoCompactWindow', 'background', 'omitClaudeMd'].forEach(function (k) { if (f[k] !== undefined && f[k] !== null) st[k] = String(f[k]); });
    st.prompt = String(fm.body || '').replace(/^\n+/, '');
    return st;
  }
  var PRESETS = {};
  (U.data.kit || []).filter(function (k) { return k.kind === 'agent'; }).forEach(function (k) { PRESETS[k.id] = fromText(k.files[0].text); });
  var SAMPLES = {
    weak: Object.assign({}, EMPTY, { mode: 'check', pasted: ['---', 'name: team:code-reviewer', 'description: Reviews code.', 'max_turns: 10', 'model: gpt-4',
      'disallowedTools: Bash(git push *)', 'autoCompactWindow: 200k', '---', '', 'You review code and fix what you find.', ''].join('\n') })
  };

  /** The frontmatter the build fields describe, in the order the docs list them. */
  function fields(st) {
    var f = {};
    f.name = trim(st.name) || '<agent-name>';
    f.description = trim(st.description) || '<what it does, and when Claude should use it>';
    if (trim(st.tools)) f.tools = toolList(st.tools).join(', ');
    if (trim(st.disallowedTools)) f.disallowedTools = toolList(st.disallowedTools).join(', ');
    if (trim(st.model)) f.model = trim(st.model);
    if (trim(st.permissionMode)) f.permissionMode = trim(st.permissionMode);
    if (trim(st.maxTurns)) f.maxTurns = numberOrText(st.maxTurns);
    if (trim(st.skills)) f.skills = toolList(st.skills);
    if (trim(st.memory)) f.memory = trim(st.memory);
    if (trim(st.background)) f.background = boolOrText(st.background);
    if (trim(st.isolation)) f.isolation = trim(st.isolation);
    if (trim(st.effort)) f.effort = trim(st.effort);
    if (trim(st.color)) f.color = trim(st.color);
    if (trim(st.omitClaudeMd)) f.omitClaudeMd = boolOrText(st.omitClaudeMd);
    if (trim(st.autoCompactWindow)) f.autoCompactWindow = numberOrText(st.autoCompactWindow);
    return f;
  }
  function generate(st) {
    var body = String(st.prompt || '').replace(/^\n+/, '');
    return '---\n' + U.yaml.dump(fields(st)) + '---\n' + (body || '<The system prompt: who the agent is, how it works, and exactly what it returns.>\n');
  }
  function text(st) { return st.mode === 'check' ? String(st.pasted || '') : generate(st); }
  function read(st) {
    var t = text(st).replace(/^﻿/, ''), fm = U.yaml.frontmatter(t);
    return { fm: fm, fields: fm.fields || {}, body: fm.found ? fm.body : t, late: !fm.found && /^\s+---[ \t]*\n/.test(t) };
  }

  /** The same agent as a `claude --agents` command: JSON in a PowerShell here-string, for one session only. */
  function agentsCommand(st) {
    var r = read(st), f = r.fields, def = {};
    if (!trim(f.name)) return '';
    Object.keys(f).forEach(function (k) {
      if (k === 'name' || k === 'color' || k === 'experimental') return;   // --agents ignores color and experimental
      def[k] = (k === 'tools' || k === 'disallowedTools' || k === 'skills') ? toolList(f[k]) : f[k];
    });
    def.prompt = String(r.body || '').trim();
    var obj = {};
    obj[String(f.name)] = def;
    return 'claude --agents @\'\n' + JSON.stringify(obj, null, 2) + '\n\'@';
  }

  var RULES = ['no-name', 'no-description', 'bad-name', 'frontmatter-not-first-line', 'yaml-error', 'unknown-field', 'unknown-tool',
    'specifier-in-disallowed', 'readonly-with-write', 'bad-model', 'bad-value', 'bypass-ignored', 'autocompact-suffix', 'description-no-trigger', 'empty-prompt'];

  function check(st) {
    var out = [];
    if (st.mode === 'check' && !trim(st.pasted)) return out;
    if (st.mode === 'build' && !trim(st.name)) out.push({ rule: 'no-name' });
    if (st.mode === 'build' && !trim(st.description)) out.push({ rule: 'no-description' });
    var r = read(st), f = r.fields;
    if (r.late) out.push({ rule: 'frontmatter-not-first-line' });
    if (r.fm.found && r.fm.error) { out.push({ rule: 'yaml-error', where: 'line ' + r.fm.line, detail: r.fm.error }); return out; }
    if (st.mode === 'check' && (!r.fm.found || !trim(f.name))) out.push({ rule: 'no-name' });
    if (st.mode === 'check' && r.fm.found && trim(f.name) && !trim(f.description)) out.push({ rule: 'no-description' });
    var name = trim(st.mode === 'build' ? st.name : f.name);
    if (name && (/^-/.test(name) || /:/.test(name) || name.length > 256)) out.push({ rule: 'bad-name', detail: name.length > 256 ? name.length + ' characters' : name });
    Object.keys(f).forEach(function (k) {
      if (FIELDS.indexOf(k) < 0) {
        var near = U.tools.skill ? U.tools.skill.nearest(k, FIELDS) : null;
        if (k === 'allowed-tools' || k === 'allowedTools') near = 'tools';
        out.push({ rule: 'unknown-field', detail: k + (near ? ' (did you mean ' + near + '?)' : '') });
      }
    });
    var tools = toolList(f.tools), denied = toolList(f.disallowedTools);
    function known(t) { var base = t.replace(/\(.*$/, '').trim(); return TOOLS.indexOf(base) >= 0 || /^mcp__/.test(base); }
    tools.filter(function (t) { return !known(t); }).forEach(function (t) { out.push({ rule: 'unknown-tool', detail: t }); });
    denied.filter(function (t) { return /\(/.test(t) && !/^Agent\(/.test(t); }).forEach(function (t) { out.push({ rule: 'specifier-in-disallowed', detail: t }); });
    var job = READ_ONLY_JOB.exec([name, f.description || ''].join(' '));
    if (job) {
      var canWrite = (!tools.length || tools.some(function (t) { return WRITE_TOOLS.indexOf(t.replace(/\(.*$/, '')) >= 0; })) &&
        !WRITE_TOOLS.filter(function (w) { return w === 'Edit' || w === 'Write'; }).every(function (w) { return denied.indexOf(w) >= 0; });
      if (canWrite) out.push({ rule: 'readonly-with-write', detail: job[0] + (tools.length ? '' : ' (no tools field: it gets every tool)') });
    }
    if (f.model !== undefined && f.model !== null && MODELS.indexOf(String(f.model)) < 0 && !/^claude-[a-z0-9.-]+(?:\[1m\])?$/.test(String(f.model))) out.push({ rule: 'bad-model', detail: String(f.model) });
    function bad(k, ok) { if (f[k] !== undefined && f[k] !== null && !ok(f[k])) out.push({ rule: 'bad-value', where: k, detail: k + ': ' + f[k] }); }
    bad('permissionMode', function (v) { return MODES.indexOf(String(v)) >= 0; });
    bad('memory', function (v) { return ['user', 'project', 'local'].indexOf(String(v)) >= 0; });
    bad('isolation', function (v) { return String(v) === 'worktree'; });
    bad('color', function (v) { return COLORS.indexOf(String(v)) >= 0; });
    bad('effort', function (v) { return EFFORTS.indexOf(String(v)) >= 0; });
    bad('background', function (v) { return typeof v === 'boolean' || /^(?:true|false|yes|no|on|off|1|0)$/i.test(String(v)); });
    bad('maxTurns', function (v) { return /^\d+$/.test(String(v)) && +v > 0; });
    if (String(f.permissionMode) === 'bypassPermissions') out.push({ rule: 'bypass-ignored' });
    if (f.autoCompactWindow !== undefined && f.autoCompactWindow !== null) {
      var w = String(f.autoCompactWindow);
      if (!/^\d+$/.test(w) || +w < 100000 || +w > 1000000) out.push({ rule: 'autocompact-suffix', detail: 'autoCompactWindow: ' + w });
    }
    if (trim(f.description) && !TRIGGER.test(String(f.description))) out.push({ rule: 'description-no-trigger' });
    if (r.fm.found && !trim(r.body)) out.push({ rule: 'empty-prompt' });
    return out;
  }

  function compute(st) {
    var r = read(st);
    return { tools: toolList(r.fields.tools).length, promptLines: trim(r.body) ? String(r.body).trim().split('\n').length : 0 };
  }
  function fileName(st) { var n = trim(st.mode === 'check' ? read(st).fields.name : st.name) || 'agent'; return n.replace(/[^\w.-]+/g, '-') + '.md'; }
  function where(st) {
    var file = fileName(st);
    return st.scope === 'user' ? 'Save it as %USERPROFILE%\\.claude\\agents\\' + file + ': every project on this PC. Restart Claude Code if that folder is new.'
      : 'Save it as <repo>\\.claude\\agents\\' + file + ' and commit it, so the team has it too.';
  }
  function prompt(st) {
    var defs = (U.data.toolChecks || {})[ID] || [];
    var found = check(st).map(function (f) {
      var d = defs.filter(function (x) { return x.id === f.rule; })[0];
      return '- ' + (d ? d.msg : f.rule) + (f.detail ? ' (' + f.detail + ')' : '');
    });
    return ['Review this Claude Code subagent against code.claude.com/docs/en/sub-agents.',
      'Check that the description says when Claude should delegate to it; that its tools are the fewest the job needs (read-only jobs get no Edit or Write); ' +
        'that the system prompt says exactly what to return, in what shape and how long; and that it does not depend on our conversation, which it never sees.',
      'Show the corrected file. Do not write it to disk; I will.',
      found.length ? '\nThe checker found:\n' + found.join('\n') : '',
      '', 'The agent file:', text(st).trim()].filter(function (x, i, all) { return x !== '' || all[i - 1] !== ''; }).join('\n');
  }

  var tool = U.tools[ID] = { EMPTY: EMPTY, PRESETS: PRESETS, SAMPLES: SAMPLES, FIELDS: FIELDS, TOOLS: TOOLS, rules: RULES, check: check, compute: compute,
    text: text, generate: generate, fields: fields, fromText: fromText, agentsCommand: agentsCommand, toolList: toolList, prompt: prompt, state: null };

  tool.render = function (root) {
    var st = tool.state = K.load(ID, EMPTY);
    var form = K.form(st, changed);
    function sel(key, id, opts) { return form.select(key, [['', '(leave out)']].concat(opts.map(function (o) { return Array.isArray(o) ? o : [o, o]; })), { id: id }); }
    var el = {
      mode: form.select('mode', [['build', 'Build one from fields'], ['check', 'Check one I paste']], { id: 'ag-mode' }),
      scope: form.select('scope', [['project', 'This repo: .claude/agents/'], ['user', 'Every project: ~/.claude/agents/']], { id: 'ag-scope' }),
      name: form.input('name', { id: 'ag-name', placeholder: 'code-reviewer', spellcheck: 'false' }),
      description: form.textarea('description', { id: 'ag-description', rows: 3, placeholder: 'What it does. Use proactively when … / Use after …' }),
      tools: form.input('tools', { id: 'ag-tools', placeholder: 'Read, Grep, Glob (leave empty for every tool)', spellcheck: 'false' }),
      disallowedTools: form.input('disallowedTools', { id: 'ag-disallowed', placeholder: 'Write, Edit', spellcheck: 'false' }),
      model: sel('model', 'ag-model', ['inherit', 'sonnet', 'opus', 'haiku', 'fable']),
      permissionMode: sel('permissionMode', 'ag-permission', [['default', 'default (Manual)'], 'acceptEdits', 'auto', 'dontAsk', 'plan', 'bypassPermissions']),
      skills: form.input('skills', { id: 'ag-skills', placeholder: 'api-conventions, error-handling', spellcheck: 'false' }),
      memory: sel('memory', 'ag-memory', ['project', 'user', 'local']),
      isolation: sel('isolation', 'ag-isolation', [['worktree', 'worktree (its own copy of the repo)']]),
      maxTurns: form.input('maxTurns', { id: 'ag-maxturns', placeholder: '20', inputmode: 'numeric' }),
      background: sel('background', 'ag-background', [['true', 'true (always in the background)']]),
      color: sel('color', 'ag-color', COLORS),
      effort: sel('effort', 'ag-effort', EFFORTS),
      omitClaudeMd: sel('omitClaudeMd', 'ag-omit', [['true', 'true (start without CLAUDE.md)']]),
      autoCompactWindow: form.input('autoCompactWindow', { id: 'ag-autocompact', placeholder: '200000', inputmode: 'numeric' }),
      prompt: form.textarea('prompt', { id: 'ag-prompt', rows: 12, placeholder: 'You are … When invoked: 1. … Return: …' }),
      pasted: form.textarea('pasted', { id: 'ag-paste', rows: 16, placeholder: 'Paste an agent file (.claude/agents/<name>.md). Nothing leaves this browser.', spellcheck: 'false' })
    };
    var outPre = h('pre', { class: 'st-output', id: 'ag-output' });
    var whereP = h('p', { class: 'faint', id: 'ag-where', style: { margin: '6px 0 0' } });
    var jsonOut = K.outputCard({ id: 'ag-json-output', title: 'Try it for one session', copyId: 'ag-json-copy',
      note: 'Paste into PowerShell 7 (pwsh): Claude Code starts with this agent for this session only, and saves nothing. Windows PowerShell 5.1 strips the JSON\'s quotes, so it fails there.' });
    var checks = K.checksCard(ID, 'Claude Code will load it, read every field, and know when to delegate to it.', function (f) {
      if (st.mode === 'check') return K.focus(el.pasted);
      var map = { 'no-name': el.name, 'bad-name': el.name, 'no-description': el.description, 'description-no-trigger': el.description,
        'unknown-tool': el.tools, 'readonly-with-write': el.tools, 'specifier-in-disallowed': el.disallowedTools, 'bad-model': el.model,
        'bypass-ignored': el.permissionMode, 'autocompact-suffix': el.autoCompactWindow, 'empty-prompt': el.prompt };
      K.focus(map[f.rule] || el.description);
    });
    var promptOut = K.outputCard({ id: 'ag-prompt-output', title: 'Ask Claude to review it', copyId: 'ag-prompt-copy',
      note: 'Paste this into Claude: it checks the system prompt itself, which no rule can.' });

    var presetButtons = Object.keys(PRESETS).map(function (id) { return ['ag-preset-' + id, 'Kit: ' + id, function () { load(Object.assign({}, PRESETS[id], { scope: st.scope })); }]; });
    var buildBox = h('div', { class: 'cm-build' },
      h('div', { class: 'field-row' }, K.field('ag-name', 'name', 'Lowercase and hyphens; no colon.', el.name), K.field('ag-scope', 'Where it lives', null, el.scope)),
      K.field('ag-description', 'description', 'Claude delegates by matching this. Say when: "Use proactively after code changes".', el.description),
      h('div', { class: 'field-row' }, K.field('ag-tools', 'tools', 'An allowlist. Empty: every tool the session has.', el.tools), K.field('ag-disallowed', 'disallowedTools', 'Removed from the list.', el.disallowedTools)),
      h('div', { class: 'field-row' }, K.field('ag-model', 'model', 'inherit uses your session\'s model.', el.model), K.field('ag-permission', 'permissionMode', 'Ignored when your session is in auto, accept edits or bypass.', el.permissionMode)),
      h('details', { class: 'fold' }, h('summary', null, 'More fields'),
        h('div', { class: 'field-row' }, K.field('ag-skills', 'skills', 'Loaded in full when it starts.', el.skills), K.field('ag-memory', 'memory', 'A folder it keeps notes in, across sessions.', el.memory)),
        h('div', { class: 'field-row' }, K.field('ag-isolation', 'isolation', null, el.isolation), K.field('ag-maxturns', 'maxTurns', null, el.maxTurns)),
        h('div', { class: 'field-row' }, K.field('ag-background', 'background', null, el.background), K.field('ag-color', 'color', null, el.color)),
        h('div', { class: 'field-row' }, K.field('ag-effort', 'effort', null, el.effort), K.field('ag-omit', 'omitClaudeMd', null, el.omitClaudeMd)),
        K.field('ag-autocompact', 'autoCompactWindow', 'A plain number from 100000 to 1000000: 200k is read as 200.', el.autoCompactWindow)),
      K.field('ag-prompt', 'System prompt', 'It replaces the Claude Code system prompt for this agent, and it never sees your conversation.', el.prompt));
    var checkBox = h('div', { class: 'cm-check' }, K.field('ag-paste', 'Your agent file', 'Claude Code skips it without a word if it has no name or no description.', el.pasted));

    root.appendChild(h('div', { class: 'tool-layout' },
      h('div', { class: 'card' },
        K.samples(presetButtons.concat([['ag-sample-weak', 'Example: a weak agent', function () { load(SAMPLES.weak); }]]), 'ag-clear', function () { load(EMPTY); }),
        K.field('ag-mode', 'What to do', null, el.mode),
        buildBox, checkBox),
      h('div', { class: 'st-side' },
        checks.el,
        h('div', { class: 'card' },
          h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'The agent file'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small', id: 'ag-download', type: 'button', onclick: function () { U.download(fileName(st), outPre.textContent, 'text/markdown'); } }, 'Download'),
            h('button', { class: 'btn btn-small btn-primary', id: 'ag-copy', type: 'button', onclick: function () { U.copy(outPre.textContent); } }, 'Copy')),
          whereP, outPre),
        jsonOut.el,
        promptOut.el)));

    function load(next) {
      K.replace(st, next);
      form.fill();
      changed();
    }
    function changed() {
      U.store.set('tool.' + ID, st);
      buildBox.hidden = st.mode === 'check';
      checkBox.hidden = st.mode !== 'check';
      checks.show(check(st));
      outPre.textContent = text(st);
      whereP.textContent = st.mode === 'check' && !trim(st.pasted) ? 'Paste an agent file to check it.' : where(st);
      jsonOut.set(agentsCommand(st));
      promptOut.set(text(st).trim() ? prompt(st) : '');
    }
    form.fill();
    changed();
  };
})(window.CLT);
