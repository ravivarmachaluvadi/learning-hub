/*
 * tools/skill.js - the skill builder and checker (#/tools/skill).
 *
 * Build: fill in the fields (or start from the "deploy" or "reference" preset) and get a SKILL.md
 * whose frontmatter YAML reads back exactly (CLT.yaml writes it). Check: paste a SKILL.md. Either way
 * it is checked the way Claude Code reads it (code.claude.com/docs/en/skills, 2.1.309): frontmatter on
 * the first line, YAML that parses, only the documented fields, a description Claude can match, who
 * may run a skill with side effects, allowed-tools that are not a blank cheque, paths that are globs.
 * The checks' messages are data (data/tool-checks.js, "skill"). The draft is kept in "clt.tool.skill".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit;
  var ID = 'skill';
  var LISTING_LIMIT = 1536, BODY_LIMIT = 500;

  var EMPTY = { mode: 'build', scope: 'project', folder: '', name: '', description: '', whenToUse: '', argumentHint: '', args: '',
    invocation: 'both', allowedTools: '', context: 'inline', agent: '', model: '', effort: '', paths: '', shell: '', body: '', pasted: '' };

  var PRESETS = {
    deploy: Object.assign({}, EMPTY, { folder: 'deploy', name: 'deploy',
      description: 'Deploys the current branch to staging and checks that it came up. Use when the user says deploy, ship it to staging, or release to staging.',
      argumentHint: '[environment, default staging]', invocation: 'user',
      allowedTools: 'Bash(pnpm test *) Bash(pnpm build *) Bash(git status *)',
      body: 'Deploy the current branch to $ARGUMENTS (staging when no environment is given).\n\n' +
        '1. Run `git status`. Stop and ask if there are uncommitted changes.\n' +
        '2. Run `pnpm test` and `pnpm build`. Stop on the first failure and show it.\n' +
        '3. Run `pnpm deploy:staging` and wait for it to finish.\n' +
        '4. Open the health URL it prints and confirm it answers 200.\n' +
        '5. Report: the commit deployed, the URL, and the health check result. Never say it worked without the health check.\n' }),
    reference: Object.assign({}, EMPTY, { folder: 'api-conventions', name: 'api-conventions',
      description: 'The orders API\'s conventions for routes, validation, errors and tests. Use when writing or changing code under src/api/, or reviewing an API change.',
      paths: 'src/api/**/*.ts',
      body: '# Orders API conventions\n\n' +
        '- Every route lives in `src/api/routes/<resource>.ts` and is registered in `src/api/router.ts`.\n' +
        '- Validate every request body with the zod schema in `src/api/schemas/`; never trust `req.body` directly.\n' +
        '- Errors are `ApiError` (`src/api/errors.ts`), returned as `{ error: { code, message } }`.\n' +
        '- Each route has an integration test in `src/api/routes/<resource>.test.ts` using `testClient()`.\n' +
        '- Money is integer cents (`amountCents`), never a float.\n' })
  };
  var SAMPLES = {
    weak: Object.assign({}, EMPTY, { mode: 'check', folder: 'release', pasted: [
      '---', 'name: release', 'description: Release helper', 'allowed_tools: Bash', 'allowed-tools: Bash', 'agent: Explore', '---', '',
      'Release the current version: bump the version, tag it and publish it to npm.', ''].join('\n') })
  };

  // the frontmatter fields Claude Code reads; any other is ignored without a word
  var FIELDS = ['name', 'description', 'when_to_use', 'argument-hint', 'arguments', 'disable-model-invocation', 'user-invocable', 'allowed-tools',
    'disallowed-tools', 'model', 'effort', 'context', 'agent', 'background', 'hooks', 'paths', 'shell', 'metadata', 'license', 'compatibility'];
  var EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
  var MODELS = ['sonnet', 'opus', 'haiku', 'fable', 'inherit', 'opusplan', 'default'];
  var SIDE_EFFECTS = /\b(?:deploy|deploys|deploying|release|releases|publish|publishes|push|pushes|commit|commits|merge|merges|delete|deletes|drop|drops|send|sends|post|posts|migrate|migrates|rollback|ship|email|emails)\b/i;
  var TRIGGER = /\b(?:use (?:it |this |me )?(?:when|for|after|before|whenever|if|to|on|while|in)|when (?:the user|you|asked|someone|a user|working|writing|editing|changing|reviewing)|whenever|trigger(?:s|ed)? (?:on|by|when)|use proactively)\b/i;

  function trim(s) { return String(s === undefined || s === null ? '' : s).trim(); }
  function list(s) { return String(s || '').split(/[\n,]/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function truthy(v) { return v === true || /^(?:true|yes|on|1)$/i.test(String(v === undefined || v === null ? '' : v)); }
  function norm(k) { return String(k).toLowerCase().replace(/[-_\s]/g, ''); }
  /** The documented field a misspelt one most likely meant. */
  function nearest(k, fields) {
    var n = norm(k);
    var same = fields.filter(function (f) { return norm(f) === n; })[0];
    if (same) return same;
    var best = null, bestD = 3;
    fields.forEach(function (f) {
      var d = lev(n, norm(f));
      if (d < bestD) { bestD = d; best = f; }
    });
    return best;
  }
  function lev(a, b) {
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) d[i] = [i];
    for (j = 1; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return d[a.length][b.length];
  }

  /** The frontmatter the build fields describe, in the order the docs list them. */
  function fields(st) {
    var f = {};
    var folder = trim(st.folder);
    f.name = trim(st.name) || folder || '<skill-name>';
    if (trim(st.description)) f.description = trim(st.description);
    if (trim(st.whenToUse)) f.when_to_use = trim(st.whenToUse);
    if (trim(st.argumentHint)) f['argument-hint'] = trim(st.argumentHint);
    if (trim(st.args)) f.arguments = trim(st.args);
    if (st.invocation === 'user') f['disable-model-invocation'] = true;
    if (st.invocation === 'claude') f['user-invocable'] = false;
    if (trim(st.allowedTools)) f['allowed-tools'] = trim(st.allowedTools);
    if (st.context === 'fork') f.context = 'fork';
    if (trim(st.agent)) f.agent = trim(st.agent);
    if (trim(st.model)) f.model = trim(st.model);
    if (trim(st.effort)) f.effort = trim(st.effort);
    var paths = list(st.paths);
    if (paths.length) f.paths = paths;
    if (trim(st.shell)) f.shell = trim(st.shell);
    return f;
  }
  function generate(st) {
    var body = String(st.body || '').replace(/^\n+/, '');
    return '---\n' + U.yaml.dump(fields(st)) + '---\n\n' + (body || '<What Claude should do or know when this skill loads.>\n');
  }
  function text(st) { return st.mode === 'check' ? String(st.pasted || '') : generate(st); }

  /** What Claude Code reads from the text: {fm, fields, body, firstLineProblem}. */
  function read(st) {
    var t = text(st).replace(/^﻿/, '');
    var fm = U.yaml.frontmatter(t);
    var late = !fm.found && /^\s*\n---[ \t]*\n/.test(t) || (!fm.found && /^[ \t]+---/.test(t));
    return { fm: fm, fields: fm.fields || {}, body: fm.found ? fm.body : t, late: late };
  }
  function commandName(st, f) {
    return trim(f.name) || trim(st.folder) || '<skill-name>';
  }

  var RULES = ['frontmatter-not-first-line', 'yaml-error', 'no-description', 'description-too-long', 'description-no-trigger', 'side-effects-auto',
    'unknown-field', 'agent-without-fork', 'fork-needs-task', 'broad-allowed-tools', 'paths-no-glob', 'bad-value', 'reserved-name', 'too-long', 'empty-body'];

  function check(st) {
    var out = [];
    if (st.mode === 'check' && !trim(st.pasted)) return out;
    var r = read(st), f = r.fields, body = String(r.body || '');
    if (r.late) out.push({ rule: 'frontmatter-not-first-line' });
    if (r.fm.found && r.fm.error) out.push({ rule: 'yaml-error', where: 'line ' + r.fm.line, detail: r.fm.error });
    var userOnly = truthy(f['disable-model-invocation']);
    var listing = trim(f.description) + (f.when_to_use ? ' ' + trim(f.when_to_use) : '');
    if (!r.fm.error) {
      if (!trim(f.description)) out.push({ rule: 'no-description' });
      if (listing.length > LISTING_LIMIT) out.push({ rule: 'description-too-long', detail: listing.length + ' characters' });
      if (trim(f.description) && !userOnly && !TRIGGER.test(listing)) out.push({ rule: 'description-no-trigger' });
      var hit = SIDE_EFFECTS.exec([commandName(st, f), f.description || ''].join(' '));
      if (hit && !userOnly) out.push({ rule: 'side-effects-auto', detail: hit[0] });
      Object.keys(f).forEach(function (k) {
        if (FIELDS.indexOf(k) < 0) {
          var near = nearest(k, FIELDS);
          out.push({ rule: 'unknown-field', detail: k + (near ? ' (did you mean ' + near + '?)' : '') });
        }
      });
      if ((trim(f.agent) || f.background !== undefined) && f.context !== 'fork') out.push({ rule: 'agent-without-fork', detail: trim(f.agent) ? 'agent: ' + f.agent : 'background' });
      if (f.context === 'fork' && !/^\s*\d+[.)]\s/m.test(body) && !/\$(?:ARGUMENTS|\d)/.test(body) && !/your task|## task/i.test(body)) out.push({ rule: 'fork-needs-task' });
      tools(f['allowed-tools']).forEach(function (t) {
        if (/^(?:Bash|PowerShell)(?:\(\s*\*?\s*\))?$/.test(t)) out.push({ rule: 'broad-allowed-tools', detail: t });
      });
      pathList(f.paths).forEach(function (p) {
        if (!/[*?{[]/.test(p) && !/\.[A-Za-z0-9]+$/.test(p)) out.push({ rule: 'paths-no-glob', detail: p });
      });
      if (f.context !== undefined && f.context !== null && f.context !== 'fork') out.push({ rule: 'bad-value', where: 'context', detail: 'context: ' + f.context });
      if (f.shell !== undefined && f.shell !== null && ['bash', 'powershell'].indexOf(String(f.shell)) < 0) out.push({ rule: 'bad-value', where: 'shell', detail: 'shell: ' + f.shell });
      if (f.effort !== undefined && f.effort !== null && EFFORTS.indexOf(String(f.effort)) < 0) out.push({ rule: 'bad-value', where: 'effort', detail: 'effort: ' + f.effort });
      if (f.model !== undefined && f.model !== null && MODELS.indexOf(String(f.model)) < 0 && !/^claude-/.test(String(f.model))) out.push({ rule: 'bad-value', where: 'model', detail: 'model: ' + f.model });
    }
    [trim(f.name), trim(st.folder)].filter(Boolean).forEach(function (n) {
      if (/^synced$/i.test(n) || /^anthropic-skills(?::|$)/i.test(n) || /[<>\u0000-\u001f​-‏‪-‮]/.test(n) || /\s{2}|^\s|\s$/.test(n)) {
        if (!out.some(function (x) { return x.rule === 'reserved-name'; })) out.push({ rule: 'reserved-name', detail: n });
      }
    });
    if (body.split('\n').length >= BODY_LIMIT) out.push({ rule: 'too-long', detail: body.split('\n').length + ' lines' });
    if (!r.fm.error && !trim(body)) out.push({ rule: 'empty-body' });
    return out;
  }
  /** allowed-tools as a list: space- or comma-separated, or a YAML list; spaces inside ( ) belong to the rule. */
  function tools(v) {
    if (Array.isArray(v)) return v.map(String);
    var s = String(v || ''), out = [], cur = '', depth = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === '(') depth++;
      if (c === ')') depth = Math.max(0, depth - 1);
      if (!depth && (c === ' ' || c === ',')) { if (cur.trim()) out.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function pathList(v) { return Array.isArray(v) ? v.map(String) : list(v); }

  function compute(st) {
    var r = read(st), f = r.fields;
    var listing = trim(f.description) + (f.when_to_use ? ' ' + trim(f.when_to_use) : '');
    return { listing: listing.length, bodyLines: String(r.body || '').trim() ? String(r.body).split('\n').length : 0, fields: Object.keys(f).length };
  }

  function where(st) {
    var r = read(st), name = commandName(st, r.fields), folder = trim(st.folder) || name;
    var path = st.scope === 'personal' ? '%USERPROFILE%\\.claude\\skills\\' + folder + '\\SKILL.md' : '<repo>\\.claude\\skills\\' + folder + '\\SKILL.md';
    return 'Save it as ' + path + '. It runs as /' + name + (st.scope === 'personal' ? ' in every project on this PC.' : ' in this repo; commit it so the team has it too.');
  }

  function prompt(st) {
    var t = text(st), defs = (U.data.toolChecks || {})[ID] || [];
    var found = check(st).map(function (f) {
      var d = defs.filter(function (x) { return x.id === f.rule; })[0];
      return '- ' + (d ? d.msg : f.rule) + (f.detail ? ' (' + f.detail + ')' : '');
    });
    return ['Review this Claude Code skill against code.claude.com/docs/en/skills.',
      'Check that the description says what it does and when to use it, with the words a user would actually type; that a skill with side effects ' +
        '(deploy, commit, send) sets disable-model-invocation: true; that allowed-tools grants only what the steps need; and that the steps are concrete enough to follow. ' +
        'Keep SKILL.md short: move reference material into supporting files it links to.',
      'Show the corrected SKILL.md. Do not write it to disk; I will.',
      found.length ? '\nThe checker found:\n' + found.join('\n') : '',
      '', 'SKILL.md:', t.trim()].filter(function (x, i, all) { return x !== '' || all[i - 1] !== ''; }).join('\n');
  }

  var tool = U.tools[ID] = { EMPTY: EMPTY, PRESETS: PRESETS, SAMPLES: SAMPLES, FIELDS: FIELDS, rules: RULES, check: check, compute: compute,
    text: text, generate: generate, fields: fields, read: read, prompt: prompt, nearest: nearest, state: null };

  tool.render = function (root) {
    var st = tool.state = K.load(ID, EMPTY);
    var form = K.form(st, changed);
    var el = {
      mode: form.select('mode', [['build', 'Build one from fields'], ['check', 'Check one I paste']], { id: 'sk-mode' }),
      scope: form.select('scope', [['project', 'This repo: .claude/skills/'], ['personal', 'Every project: ~/.claude/skills/']], { id: 'sk-scope' }),
      folder: form.input('folder', { id: 'sk-folder', placeholder: 'deploy', spellcheck: 'false' }),
      name: form.input('name', { id: 'sk-name', placeholder: 'the folder name', spellcheck: 'false' }),
      description: form.textarea('description', { id: 'sk-description', rows: 3, placeholder: 'What it does. Use when the user says … or asks …' }),
      whenToUse: form.textarea('whenToUse', { id: 'sk-when', rows: 2, placeholder: 'Optional: more trigger phrases or example requests' }),
      argumentHint: form.input('argumentHint', { id: 'sk-hint', placeholder: '[issue-number]' }),
      args: form.input('args', { id: 'sk-args', placeholder: 'issue branch', spellcheck: 'false' }),
      invocation: form.select('invocation', [['both', 'You or Claude'], ['user', 'Only you, with /name (side effects)'], ['claude', 'Only Claude (background knowledge)']], { id: 'sk-invocation' }),
      allowedTools: form.input('allowedTools', { id: 'sk-allowed', placeholder: 'Bash(git add *) Bash(git commit *)', spellcheck: 'false' }),
      context: form.select('context', [['inline', 'In this conversation'], ['fork', 'In a subagent (context: fork)']], { id: 'sk-context' }),
      agent: form.input('agent', { id: 'sk-agent', placeholder: 'Explore, Plan or your agent', spellcheck: 'false' }),
      model: form.input('model', { id: 'sk-model', placeholder: 'inherit, sonnet, opus…', spellcheck: 'false' }),
      effort: form.select('effort', [['', '(session effort)'], ['low', 'low'], ['medium', 'medium'], ['high', 'high'], ['xhigh', 'xhigh'], ['max', 'max']], { id: 'sk-effort' }),
      paths: form.input('paths', { id: 'sk-paths', placeholder: 'src/api/**/*.ts, src/**/*.tsx', spellcheck: 'false' }),
      shell: form.select('shell', [['', '(bash, the default)'], ['powershell', 'powershell']], { id: 'sk-shell' }),
      body: form.textarea('body', { id: 'sk-body', rows: 10, placeholder: 'The instructions: steps for a task, or the knowledge for a reference skill.' }),
      pasted: form.textarea('pasted', { id: 'sk-paste', rows: 16, placeholder: 'Paste a SKILL.md here. Nothing leaves this browser.', spellcheck: 'false' })
    };
    var outPre = h('pre', { class: 'st-output', id: 'sk-output' });
    var whereP = h('p', { class: 'faint', id: 'sk-where', style: { margin: '6px 0 0' } });
    var stats = h('div', { class: 'cr-stats', id: 'sk-stats' });
    var checks = K.checksCard(ID, 'Claude Code will read every field, and Claude can tell when to use it.', function (f) {
      if (st.mode === 'check') return K.focus(el.pasted);
      var map = { 'no-description': el.description, 'description-too-long': el.description, 'description-no-trigger': el.description,
        'side-effects-auto': el.invocation, 'agent-without-fork': el.context, 'fork-needs-task': el.body, 'broad-allowed-tools': el.allowedTools,
        'paths-no-glob': el.paths, 'reserved-name': el.folder, 'too-long': el.body, 'empty-body': el.body };
      K.focus(map[f.rule] || el.description);
    });
    var promptOut = K.outputCard({ id: 'sk-prompt-output', title: 'Ask Claude to review it', copyId: 'sk-prompt-copy',
      note: 'Paste this into Claude: it checks the wording and the steps, which no rule can.' });

    var buildBox = h('div', { class: 'cm-build' },
      h('div', { class: 'field-row' }, K.field('sk-folder', 'Folder name', 'The folder name is also a /command.', el.folder), K.field('sk-scope', 'Where it lives', null, el.scope)),
      h('div', { class: 'field-row' }, K.field('sk-name', 'name (optional)', 'The /command; defaults to the folder.', el.name), K.field('sk-invocation', 'Who can run it', null, el.invocation)),
      K.field('sk-description', 'description', 'Claude matches requests against this: what it does, then when to use it. The first ' + LISTING_LIMIT + ' characters count.', el.description),
      h('details', { class: 'fold' }, h('summary', null, 'More fields'),
        K.field('sk-when', 'when_to_use', 'Added to the description in the listing.', el.whenToUse),
        h('div', { class: 'field-row' }, K.field('sk-hint', 'argument-hint', null, el.argumentHint), K.field('sk-args', 'arguments', 'Names for $name placeholders, in order.', el.args)),
        K.field('sk-allowed', 'allowed-tools', 'Runs without asking during the turn that invokes the skill. Keep it narrow.', el.allowedTools),
        h('div', { class: 'field-row' }, K.field('sk-context', 'Runs', null, el.context), K.field('sk-agent', 'agent', 'Only with context: fork.', el.agent)),
        h('div', { class: 'field-row' }, K.field('sk-model', 'model', null, el.model), K.field('sk-effort', 'effort', null, el.effort)),
        h('div', { class: 'field-row' }, K.field('sk-paths', 'paths', 'Globs: Claude loads it on its own only for matching files.', el.paths), K.field('sk-shell', 'shell', 'For !`command` lines.', el.shell))),
      K.field('sk-body', 'Instructions', 'State what to do. It stays in context once loaded, so every line costs tokens.', el.body));
    // check mode shares the folder field with build mode: changed() moves it between the two boxes
    var checkBox = h('div', { class: 'cm-check' },
      K.field('sk-paste', 'Your SKILL.md', 'The frontmatter counts only when --- is the very first line.', el.pasted));

    root.appendChild(h('div', { class: 'tool-layout' },
      h('div', { class: 'card' },
        K.samples([['sk-preset-deploy', 'Preset: a deploy task', function () { load(PRESETS.deploy); }],
          ['sk-preset-reference', 'Preset: API conventions', function () { load(PRESETS.reference); }],
          ['sk-sample-weak', 'Example: a weak skill', function () { load(SAMPLES.weak); }]], 'sk-clear', function () { load(EMPTY); }),
        K.field('sk-mode', 'What to do', null, el.mode),
        buildBox, checkBox),
      h('div', { class: 'st-side' },
        h('div', { class: 'card' }, h('h2', null, 'Size'), stats),
        checks.el,
        h('div', { class: 'card' },
          h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'SKILL.md'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small', id: 'sk-download', type: 'button', onclick: function () { U.download('SKILL.md', outPre.textContent, 'text/markdown'); } }, 'Download'),
            h('button', { class: 'btn btn-small btn-primary', id: 'sk-copy', type: 'button', onclick: function () { U.copy(outPre.textContent); } }, 'Copy')),
          whereP, outPre),
        promptOut.el)));

    function load(next) {
      K.replace(st, next);
      form.fill();
      changed();
    }
    function stat(key, value, label, bad) {
      return h('div', { class: 'stat' + (bad ? ' stat-bad' : ''), 'data-stat': key }, h('b', null, String(value)), h('span', null, label));
    }
    function changed() {
      U.store.set('tool.' + ID, st);
      buildBox.hidden = st.mode === 'check';
      checkBox.hidden = st.mode !== 'check';
      var folderField = el.folder.closest('.field');
      if (st.mode === 'check' && folderField.parentNode !== checkBox) checkBox.insertBefore(folderField, checkBox.firstChild);
      if (st.mode !== 'check' && folderField.parentNode === checkBox) buildBox.querySelector('.field-row').insertBefore(folderField, buildBox.querySelector('.field-row').firstChild);
      var c = compute(st);
      stats.innerHTML = '';
      stats.appendChild(stat('listing', c.listing, 'description characters (cut at ' + LISTING_LIMIT + ')', c.listing > LISTING_LIMIT));
      stats.appendChild(stat('lines', c.bodyLines, 'lines of instructions (aim: under ' + BODY_LIMIT + ')', c.bodyLines >= BODY_LIMIT));
      checks.show(check(st));
      outPre.textContent = text(st);
      whereP.textContent = st.mode === 'check' && !trim(st.pasted) ? 'Paste a SKILL.md to check it.' : where(st);
      promptOut.set(text(st).trim() ? prompt(st) : '');
    }
    form.fill();
    changed();
  };
})(window.CLT);
