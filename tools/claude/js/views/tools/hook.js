/*
 * tools/hook.js - the hook builder and tester (#/tools/hook).
 *
 * Build: pick an event, a matcher, an optional "if" filter and a handler (a Node, PowerShell or bash
 * script, or one command), or start from one of the kit's hooks; get the settings.json "hooks" block
 * and the script. The tester says whether a call would make the hook run, and what the script's exit
 * code and output would then do. Check: paste a settings.json and every hook in it is checked.
 * The rules come from js/hooks.js (the hook engine, proven against the docs' examples) and
 * js/perm.js (the "if" filter uses permission rule syntax). The checks' messages are data
 * (data/tool-checks.js, "hook"). The tool never edits a settings file. The draft is kept in "clt.tool.hook".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit;
  var ID = 'hook';
  var NEEDS = { command: 'command', http: 'url', mcp_tool: 'tool', prompt: 'prompt', agent: 'prompt' };
  var EXT = { node: '.js', powershell: '.ps1', bash: '.sh' };

  var EMPTY = { mode: 'build', scope: 'project', event: 'PreToolUse', matcher: '', ifRule: '', type: 'command', lang: 'node', scriptName: '', script: '',
    command: '', shell: '', url: '', prompt: '', timeout: '', onFailure: '', async: '', statusMessage: '',
    testTool: 'Bash', testInput: '', testValue: '', testExit: '0', testStdout: 'none', pasted: '' };

  function trim(s) { return String(s === undefined || s === null ? '' : s).trim(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- the kit's hooks as templates ---------- */

  function fromKit(k) {
    var st = clone(EMPTY), frag = k.files.filter(function (f) { return /settings\.json$/.test(f.path); })[0];
    var script = k.files.filter(function (f) { return !/settings\.json$/.test(f.path); })[0];
    var obj = JSON.parse(frag.text), ev = Object.keys(obj.hooks)[0], g = obj.hooks[ev][0], hd = g.hooks[0];
    st.scope = /^~/.test(frag.install) ? 'user' : 'project';
    st.event = ev;
    st.matcher = g.matcher || '';
    st.ifRule = hd['if'] || '';
    st.type = hd.type;
    st.timeout = hd.timeout === undefined ? '' : String(hd.timeout);
    st.onFailure = hd.onFailure || '';
    st.async = hd.async ? 'true' : '';
    st.statusMessage = hd.statusMessage || '';
    if (script) {
      st.scriptName = script.path.split('/').pop();
      st.script = script.text;
      st.lang = /\.ps1$/.test(st.scriptName) ? 'powershell' : /\.sh$/.test(st.scriptName) ? 'bash' : 'node';
    } else { st.lang = 'inline'; st.command = hd.command || ''; st.shell = hd.shell || ''; }
    // a call each template acts on, and what its script then does, so the tester opens on a real case
    var ex = { 'block-env-edits': ['Edit', '.env', '0', 'json'], 'format-on-edit': ['Edit', 'src/app.ts', '0', 'none'],
      'tests-on-stop': ['Bash', 'pnpm test', '2', 'none'] }[k.id] || ['Bash', 'pnpm test', '0', 'none'];
    st.testTool = ex[0];
    st.testInput = ex[1];
    st.testExit = ex[2];
    st.testStdout = ex[3];
    st.testValue = (U.hooks.event(ev) || {}).values ? (U.hooks.event(ev).values[0] || '') : '';
    return st;
  }
  var TEMPLATES = {};
  (U.data.kit || []).filter(function (k) { return k.kind === 'hook'; }).forEach(function (k) {
    try { TEMPLATES[k.id] = fromKit(k); } catch (e) { console.error('hook template ' + k.id + ': ' + e.message); }
  });

  var WEAK = JSON.stringify({ hooks: {
    Stop: [{ matcher: 'Bash', hooks: [{ type: 'command', 'if': 'Bash(git *)', command: 'node .claude/hooks/check.js' }] }],
    PreToolUse: [
      { matcher: 'Bash', hooks: [{ type: 'command', shell: 'powershell', command: 'powershell -File $CLAUDE_PROJECT_DIR/.claude/hooks/guard.ps1', once: true }] },
      { matcher: 'mcp__github', hooks: [{ type: 'command', command: 'npx', args: ['eslint', '.'] }] },
      { matcher: 'Edit.*', hooks: [{ type: 'command' }] }]
  } }, null, 2);
  var SAMPLES = { weak: Object.assign(clone(EMPTY), { mode: 'check', pasted: WEAK }) };

  /** A script to start from, for this event and language. */
  function starter(lang, evName) {
    var ev = U.hooks.event(evName) || U.hooks.event('PreToolUse');
    var exit = ev.block ? 'Exit 0 to carry on, or exit 2 to block (' + ev.exit2.toLowerCase() + '; stderr is the reason).' :
      evName + ' cannot block: ' + ev.exit2.toLowerCase() + '. Exit 0.';
    var fields = ev.tool ? 'tool_name, tool_input.command, tool_input.file_path (absolute, backslashes on Windows)' : 'the fields listed for ' + evName + ' in the hooks reference';
    if (lang === 'powershell') {
      return ['# ' + evName + ' hook. Claude Code sends the event as JSON on stdin.', '# ' + exit, '# Fields: ' + fields + '.', '',
        '$event = [Console]::In.ReadToEnd() | ConvertFrom-Json', '', '# your check here', '', 'exit 0', ''].join('\n');
    }
    if (lang === 'bash') {
      return ['#!/usr/bin/env bash', '# ' + evName + ' hook. Claude Code sends the event as JSON on stdin (jq reads it).', '# ' + exit, '# Fields: ' + fields + '.', '',
        'input=$(cat)', ev.tool ? 'file=$(jq -r \'.tool_input.file_path // empty\' <<<"$input")' : 'echo "$input" > /dev/null', '', '# your check here', '', 'exit 0', ''].join('\n');
    }
    return ['#!/usr/bin/env node', '// ' + evName + ' hook. Claude Code sends the event as JSON on stdin.', '// ' + exit, '// Fields: ' + fields + '.',
      '\'use strict\';', 'const input = JSON.parse(require(\'fs\').readFileSync(0, \'utf8\'));', '', '// your check here', '', 'process.exit(0);', ''].join('\n');
  }

  /* ---------- the settings the fields describe ---------- */

  function scriptName(st) { return trim(st.scriptName) || ('my-hook' + (EXT[st.lang] || '.js')); }
  function commandFor(st) {
    var n = scriptName(st), user = st.scope === 'user';
    if (st.lang === 'inline') return { command: trim(st.command), shell: trim(st.shell) || undefined };
    if (st.lang === 'powershell') {
      return user ? { shell: 'powershell', command: 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$HOME\\.claude\\hooks\\' + n + '"' }
        : { command: 'powershell.exe', args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '${CLAUDE_PROJECT_DIR}/.claude/hooks/' + n] };
    }
    if (st.lang === 'bash') return { shell: 'bash', command: 'bash "' + (user ? '$HOME' : '${CLAUDE_PROJECT_DIR}') + '/.claude/hooks/' + n + '"' };
    return user ? { command: 'node "$HOME/.claude/hooks/' + n + '"' } : { command: 'node', args: ['${CLAUDE_PROJECT_DIR}/.claude/hooks/' + n] };
  }
  function handler(st) {
    var hd = { type: st.type };
    if (st.type === 'command') {
      var c = commandFor(st);
      if (c.shell) hd.shell = c.shell;
      hd.command = c.command;
      if (c.args) hd.args = c.args;
    } else if (st.type === 'http') hd.url = trim(st.url);
    else hd.prompt = trim(st.prompt);
    if (trim(st.ifRule)) hd['if'] = trim(st.ifRule);
    if (trim(st.timeout)) hd.timeout = /^\d+$/.test(trim(st.timeout)) ? +trim(st.timeout) : trim(st.timeout);
    if (st.async === 'true' && st.type === 'command') hd.async = true;
    if (st.onFailure && (st.type === 'command' || st.type === 'http')) hd.onFailure = st.onFailure;
    if (trim(st.statusMessage)) hd.statusMessage = trim(st.statusMessage);
    return hd;
  }
  function config(st) {
    var group = {};
    if (trim(st.matcher)) group.matcher = trim(st.matcher);
    group.hooks = [handler(st)];
    var hooks = {};
    hooks[st.event] = [group];
    return { hooks: hooks };
  }
  function settingsJson(st) {
    if (st.mode !== 'check') return JSON.stringify(config(st), null, 2);
    try { return JSON.stringify(JSON.parse(st.pasted), null, 2); } catch (e) { return String(st.pasted || ''); }
  }
  function usesScript(st) { return st.mode !== 'check' && st.type === 'command' && st.lang !== 'inline'; }

  /* ---------- checks ---------- */

  var RULES = ['bad-json', 'unknown-event', 'matcher-ignored', 'if-never-runs', 'mcp-matcher-needs-star', 'regex-overmatch', 'bash-only-matcher',
    'missing-command', 'empty-script', 'relative-script-path', 'ps-bare-project-dir', 'ps-no-bypass', 'cmd-shim-exec-form', 'once-outside-skill',
    'async-cannot-block', 'policy-exit-1', 'stop-loop', 'guard-no-onfailure'];

  /** A shell command's words, quotes removed. */
  function words(cmd) {
    var out = [], re = /"([^"]*)"|'([^']*)'|(\S+)/g, m;
    while ((m = re.exec(String(cmd || '')))) out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
    return out;
  }
  var ROOTED = /^(?:\$\{?(?:CLAUDE_PROJECT_DIR|CLAUDE_PLUGIN_ROOT|CLAUDE_PLUGIN_DATA|HOME)(?::-[^}]*)?\}?|\$env:(?:CLAUDE_PROJECT_DIR|USERPROFILE|HOME)|~|[A-Za-z]:[\\/]|\/|\\\\)/;
  function scriptRefs(hd) {
    return words(hd.command).concat((hd.args || []).map(String)).filter(function (w) {
      return /\.claude[\\/]hooks[\\/]/.test(w) || /^\.{1,2}[\\/]/.test(w) || /^(?:scripts|hooks|tools)[\\/]\S+\.(?:sh|js|mjs|cjs|ts|py|ps1|rb)$/.test(w);
    });
  }
  var BLOCKS = /exit\s*\(?\s*2\b|process\.exit\(\s*2\s*\)|permissionDecision|['"]?decision['"]?\s*[:=]\s*['"]block/i;

  function validate(obj, script) {
    var out = [];
    if (!obj || typeof obj !== 'object' || Array.isArray(obj) || !obj.hooks || typeof obj.hooks !== 'object') {
      out.push({ rule: 'bad-json', detail: 'no "hooks" object' });
      return out;
    }
    Object.keys(obj.hooks).forEach(function (evName) {
      var ev = U.hooks.event(evName);
      if (!ev) {
        var near = U.hooks.EVENTS.filter(function (e) { return e.name.toLowerCase() === evName.toLowerCase(); })[0];
        out.push({ rule: 'unknown-event', where: evName, detail: evName + (near ? ' (did you mean ' + near.name + '?)' : '') });
        return;
      }
      var groups = obj.hooks[evName];
      if (!Array.isArray(groups)) { out.push({ rule: 'bad-json', where: evName, detail: evName + ' must be a list of matcher groups' }); return; }
      groups.forEach(function (g) {
        var m = g && g.matcher !== undefined && g.matcher !== null ? String(g.matcher) : '';
        if (m && m !== '*' && ev.matcher === null) out.push({ rule: 'matcher-ignored', where: evName, detail: 'matcher: ' + m });
        if (ev.tool && m && m !== '*') {
          var mode = U.hooks.matches(evName, m, '').mode;
          if (mode === 'exact') {
            m.split(/[|,]/).map(function (x) { return x.trim(); }).forEach(function (alt) {
              if (/^mcp__/.test(alt) && alt.split('__').length < 3) out.push({ rule: 'mcp-matcher-needs-star', where: evName, detail: alt });
            });
          }
          if (mode === 'regex') {
            var hit = U.hooks.toolsMatched(m), lit = U.hooks.TOOLS.filter(function (t) { return m.indexOf(t) >= 0; });
            var extra = hit.filter(function (u) { return lit.indexOf(u) < 0 && lit.some(function (t) { return u !== t && u.indexOf(t) >= 0; }); });
            if (extra.length) out.push({ rule: 'regex-overmatch', where: evName, detail: m + ' also matches ' + extra.join(', ') });
          }
          if (U.hooks.matches(evName, m, 'Bash').match && !U.hooks.matches(evName, m, 'PowerShell').match) out.push({ rule: 'bash-only-matcher', where: evName, detail: 'matcher: ' + m });
        }
        var handlers = g && g.hooks;
        if (!Array.isArray(handlers) || !handlers.length) { out.push({ rule: 'missing-command', where: evName, detail: 'a matcher group with no "hooks" list' }); return; }
        handlers.forEach(function (hd) {
          if (!hd || !NEEDS[hd.type]) { out.push({ rule: 'missing-command', where: evName, detail: 'type ' + JSON.stringify(hd && hd.type) + ' is not command, http, mcp_tool, prompt or agent' }); return; }
          if (!trim(hd[NEEDS[hd.type]])) out.push({ rule: 'missing-command', where: evName, detail: 'a ' + hd.type + ' handler needs "' + NEEDS[hd.type] + '"' });
          if (trim(hd['if']) && !ev.tool) out.push({ rule: 'if-never-runs', where: evName, detail: 'if: ' + hd['if'] });
          if (hd.once === true) out.push({ rule: 'once-outside-skill', where: evName });
          if (hd.async === true && ev.block) out.push({ rule: 'async-cannot-block', where: evName });
          if (hd.type !== 'command' || !trim(hd.command)) return;
          var cmd = String(hd.command), args = Array.isArray(hd.args) ? hd.args.map(String) : null, all = cmd + ' ' + (args || []).join(' ');
          scriptRefs(hd).forEach(function (w) { if (!ROOTED.test(w)) out.push({ rule: 'relative-script-path', where: evName, detail: w }); });
          if (hd.shell === 'powershell' && !args && /\$CLAUDE_PROJECT_DIR\b/.test(cmd.replace(/\$\{CLAUDE_PROJECT_DIR\}/g, ''))) {
            out.push({ rule: 'ps-bare-project-dir', where: evName, detail: '$CLAUDE_PROJECT_DIR' });
          }
          if (/\b(?:powershell|pwsh)(?:\.exe)?\b/i.test(all) && /(?:^|\s)-File\b/i.test(all) && !/-ExecutionPolicy\s+Bypass/i.test(all)) out.push({ rule: 'ps-no-bypass', where: evName });
          if (args && /(?:^|[\\/])(?:npx|npm|pnpm|yarn|eslint|prettier|tsc|jest|vitest|biome)(?:\.cmd|\.bat)?$|\.(?:cmd|bat)$/i.test(cmd.trim())) {
            out.push({ rule: 'cmd-shim-exec-form', where: evName, detail: cmd.trim() });
          }
          if (script !== undefined) {
            if (!trim(script)) { out.push({ rule: 'empty-script', where: evName }); return; }
            if (ev.block && /\bexit\s*\(?\s*1\b|process\.exit\(\s*1\s*\)/.test(script) && !BLOCKS.test(script)) out.push({ rule: 'policy-exit-1', where: evName });
            if ((evName === 'Stop' || evName === 'SubagentStop') && BLOCKS.test(script) && !/stop_hook_active/.test(script)) out.push({ rule: 'stop-loop', where: evName });
            if (evName === 'PreToolUse' && BLOCKS.test(script) && hd.onFailure !== 'block') out.push({ rule: 'guard-no-onfailure', where: evName });
          }
        });
      });
    });
    return out;
  }
  function check(st) {
    if (st.mode === 'check') {
      if (!trim(st.pasted)) return [];
      var obj;
      try { obj = JSON.parse(st.pasted); } catch (e) { return [{ rule: 'bad-json', detail: e.message.replace(/^JSON\.parse: /, '') }]; }
      return validate(obj);
    }
    return validate(config(st), usesScript(st) ? String(st.script || '') : undefined);
  }

  function compute(st) {
    var obj;
    try { obj = st.mode === 'check' ? JSON.parse(st.pasted || '{}') : config(st); } catch (e) { obj = {}; }
    var n = 0;
    Object.keys((obj && obj.hooks) || {}).forEach(function (k) { (obj.hooks[k] || []).forEach(function (g) { n += ((g && g.hooks) || []).length; }); });
    return { events: Object.keys((obj && obj.hooks) || {}).length, handlers: n };
  }

  /** Would this call make the hook run, and what would the exit code then do? */
  function simulate(st) {
    var ev = U.hooks.event(st.event) || U.hooks.event('PreToolUse');
    var value = ev.tool ? st.testTool : trim(st.testValue);
    var m = U.hooks.matches(ev.name, st.matcher, value);
    var f = U.hooks.ifRuns(ev.name, st.ifRule, { tool: st.testTool, input: st.testInput });
    var runs = m.match && f.runs;
    var o = U.hooks.outcome(ev.name, st.testExit, st.testStdout, { onFailure: st.onFailure });
    return { runs: runs, steps: [m.why, f.why], outcome: o };
  }

  function where(st) {
    var n = scriptName(st), file = { project: '<repo>\\.claude\\settings.json', local: '<repo>\\.claude\\settings.local.json', user: '%USERPROFILE%\\.claude\\settings.json' }[st.scope];
    var dir = st.scope === 'user' ? '%USERPROFILE%\\.claude\\hooks\\' : '<repo>\\.claude\\hooks\\';
    return 'Merge the "hooks" block into ' + file + ' (keep the events you already have).' + (usesScript(st) ? ' Save the script as ' + dir + n + '.' : '') +
      ' Then run /hooks in Claude Code to see it listed.';
  }
  function prompt(st) {
    var defs = (U.data.toolChecks || {})[ID] || [];
    var found = check(st).map(function (f) {
      var d = defs.filter(function (x) { return x.id === f.rule; })[0];
      return '- ' + (d ? d.msg : f.rule) + (f.detail ? ' (' + f.detail + ')' : '');
    });
    return ['Review this Claude Code hook against code.claude.com/docs/en/hooks. I am on Windows; hooks may run in Git Bash or PowerShell.',
      'Check that the event and matcher fire when I expect; that the script reads its JSON from stdin, handles Windows backslash paths, ' +
        'uses exit 2 (or a JSON decision with exit 0) to block, never exit 1; that a guard sets "onFailure": "block"; and that it is fast enough to run every time.',
      'Then give me the exact command to test it by piping sample JSON into it, and the expected exit code. Do not edit my settings files.',
      found.length ? '\nThe checker found:\n' + found.join('\n') : '',
      '', 'settings.json:', settingsJson(st), usesScript(st) ? '\n' + scriptName(st) + ':\n' + String(st.script || '') : '']
      .filter(function (x, i, all) { return x !== '' || all[i - 1] !== ''; }).join('\n');
  }

  var tool = U.tools[ID] = { EMPTY: EMPTY, TEMPLATES: TEMPLATES, SAMPLES: SAMPLES, rules: RULES, check: check, compute: compute, validate: validate,
    config: config, settingsJson: settingsJson, simulate: simulate, starter: starter, fromKit: fromKit, prompt: prompt, state: null };

  tool.render = function (root) {
    var st = tool.state = K.load(ID, EMPTY);
    var form = K.form(st, changed);
    var el = {
      mode: form.select('mode', [['build', 'Build a hook'], ['check', 'Check a settings.json I paste']], { id: 'hk-mode' }),
      scope: form.select('scope', [['project', 'Project: .claude/settings.json'], ['local', 'Local: .claude/settings.local.json'], ['user', 'User: ~/.claude/settings.json']], { id: 'hk-scope' }),
      event: form.select('event', U.hooks.EVENTS.map(function (e) { return [e.name, e.name]; }), { id: 'hk-event' }),
      matcher: form.input('matcher', { id: 'hk-matcher', placeholder: 'Edit|Write', spellcheck: 'false' }),
      ifRule: form.input('ifRule', { id: 'hk-if', placeholder: 'Bash(git push *)', spellcheck: 'false' }),
      type: form.select('type', [['command', 'command: run a script or command'], ['http', 'http: POST the event to a URL'], ['prompt', 'prompt: ask a model'], ['agent', 'agent: a subagent checks']], { id: 'hk-type' }),
      lang: form.select('lang', [['node', 'Node script (.js)'], ['powershell', 'PowerShell script (.ps1)'], ['bash', 'bash script (.sh, Git Bash)'], ['inline', 'One command, no script']], { id: 'hk-lang' }),
      scriptName: form.input('scriptName', { id: 'hk-script-name', placeholder: 'my-hook.js', spellcheck: 'false' }),
      script: form.textarea('script', { id: 'hk-script', rows: 12, spellcheck: 'false', placeholder: 'The script. Press "Start the script" for a skeleton.' }),
      command: form.input('command', { id: 'hk-command', placeholder: 'node -e "process.exit(0)"', spellcheck: 'false' }),
      shell: form.select('shell', [['', '(bash; PowerShell if no Git Bash)'], ['bash', 'bash'], ['powershell', 'powershell']], { id: 'hk-shell' }),
      url: form.input('url', { id: 'hk-url', placeholder: 'http://localhost:8080/hooks', spellcheck: 'false' }),
      prompt: form.textarea('prompt', { id: 'hk-prompt', rows: 3, placeholder: 'Check that every test passes before stopping. $ARGUMENTS is the event JSON.' }),
      timeout: form.input('timeout', { id: 'hk-timeout', placeholder: '600', inputmode: 'numeric' }),
      onFailure: form.select('onFailure', [['', '(default: the action goes ahead)'], ['block', 'block: a crash or timeout blocks'], ['continue', 'continue']], { id: 'hk-onfailure' }),
      async: form.select('async', [['', 'No: wait for it'], ['true', 'Yes: run in the background (cannot block)']], { id: 'hk-async' }),
      statusMessage: form.input('statusMessage', { id: 'hk-status', placeholder: 'Formatting the file' }),
      testTool: form.select('testTool', [['Bash', 'Bash'], ['PowerShell', 'PowerShell'], ['Edit', 'Edit'], ['Write', 'Write'], ['Read', 'Read'], ['WebFetch', 'WebFetch'], ['NotebookEdit', 'NotebookEdit']], { id: 'hk-test-tool' }),
      testInput: form.input('testInput', { id: 'hk-test-input', placeholder: 'git push origin main, or src/app.ts', spellcheck: 'false' }),
      testValue: form.input('testValue', { id: 'hk-test-value', placeholder: 'idle_prompt', spellcheck: 'false' }),
      testExit: form.select('testExit', [['0', 'exits 0'], ['2', 'exits 2'], ['1', 'exits 1 (or crashes)']], { id: 'hk-test-exit' }),
      testStdout: form.select('testStdout', [['none', 'prints nothing'], ['text', 'prints plain text'], ['json', 'prints a JSON decision'], ['bad-json', 'prints broken JSON']], { id: 'hk-test-stdout' }),
      pasted: form.textarea('pasted', { id: 'hk-paste', rows: 16, spellcheck: 'false', placeholder: 'Paste a settings.json (or just its "hooks" part, inside { }). Nothing leaves this browser.' })
    };
    var jsonPre = h('pre', { class: 'st-output', id: 'hk-json-output' });
    var scriptPre = h('pre', { class: 'st-output', id: 'hk-script-output' });
    var whereP = h('p', { class: 'faint', id: 'hk-where', style: { margin: '6px 0 0' } });
    var eventNote = h('p', { class: 'faint hk-event-note', id: 'hk-event-note', style: { margin: '-4px 0 10px' } });
    var runsBox = h('div', { class: 'pmx-result', id: 'hk-runs' });
    var steps = h('ol', { class: 'pmx-steps', id: 'hk-steps' });
    var outcomeBox = h('div', { class: 'pmx-result hk-outcome', id: 'hk-outcome' });
    var checks = K.checksCard(ID, 'It will fire when you expect, and do what it says.', function (f) {
      if (st.mode === 'check') return K.focus(el.pasted);
      var map = { 'unknown-event': el.event, 'matcher-ignored': el.matcher, 'mcp-matcher-needs-star': el.matcher, 'regex-overmatch': el.matcher, 'bash-only-matcher': el.matcher,
        'if-never-runs': el.ifRule, 'missing-command': el.command, 'empty-script': el.script, 'policy-exit-1': el.script, 'stop-loop': el.script,
        'guard-no-onfailure': el.onFailure, 'async-cannot-block': el.async };
      K.focus(map[f.rule] || el.event);
    });
    var promptOut = K.outputCard({ id: 'hk-prompt-output', title: 'Ask Claude to review it', copyId: 'hk-prompt-copy',
      note: 'Paste this into Claude: it reviews the script itself and gives you a command to test it.' });

    var templateButtons = Object.keys(TEMPLATES).map(function (id) { return ['hk-template-' + id, 'Kit: ' + id, function () { load(TEMPLATES[id]); }]; });
    var testTool = K.field('hk-test-tool', 'Tool', null, el.testTool), testInput = K.field('hk-test-input', 'Command or path', null, el.testInput);
    var testValue = K.field('hk-test-value', 'What the matcher sees', null, el.testValue);
    var scriptBox = h('div', { class: 'hk-script-box' },
      K.field('hk-script-name', 'Script file', 'Saved in .claude/hooks/.', el.scriptName),
      K.field('hk-script', 'Script', null, el.script),
      h('div', { class: 'row', style: { marginBottom: '12px' } }, h('button', { class: 'btn btn-small', type: 'button', id: 'hk-starter', onclick: function () {
        st.script = starter(st.lang, st.event);
        if (!trim(st.scriptName)) st.scriptName = 'my-hook' + EXT[st.lang];
        form.fill();
        changed();
      } }, 'Start the script for this event'), h('span', { class: 'faint' }, 'Replaces the script with a skeleton for the event and language.')));
    var inlineBox = h('div', { class: 'field-row' }, K.field('hk-command', 'Command', 'Runs in a shell: Git Bash, or PowerShell when Git Bash is missing.', el.command), K.field('hk-shell', 'shell', null, el.shell));
    var commandBox = h('div', null, K.field('hk-lang', 'Runs', null, el.lang), scriptBox, inlineBox);
    var httpBox = K.field('hk-url', 'url', 'The event JSON is POSTed here.', el.url);
    var promptBox = K.field('hk-prompt', 'prompt', null, el.prompt);
    var buildBox = h('div', { class: 'cm-build' },
      h('div', { class: 'field-row' }, K.field('hk-event', 'Event', null, el.event), K.field('hk-scope', 'Which settings file', null, el.scope)),
      eventNote,
      h('div', { class: 'field-row' }, K.field('hk-matcher', 'matcher', 'Exact names with | or a regular expression. Empty: everything.', el.matcher),
        K.field('hk-if', 'if (tool events only)', 'A permission rule, such as Bash(git push *).', el.ifRule)),
      K.field('hk-type', 'Handler', null, el.type),
      commandBox, httpBox, promptBox,
      h('details', { class: 'fold' }, h('summary', null, 'More fields'),
        h('div', { class: 'field-row' }, K.field('hk-timeout', 'timeout (seconds)', null, el.timeout), K.field('hk-onfailure', 'onFailure', 'For a guard: "block".', el.onFailure)),
        h('div', { class: 'field-row' }, K.field('hk-async', 'async', null, el.async), K.field('hk-status', 'statusMessage', 'Shown while it runs.', el.statusMessage))));
    var checkBox = h('div', { class: 'cm-check' }, K.field('hk-paste', 'Your settings.json', 'Every hook in it is checked.', el.pasted));
    var testerCard = h('div', { class: 'card', id: 'hk-tester' },
      h('h2', null, 'Test it'),
      h('div', { class: 'field-row' }, testTool, testInput), testValue,
      runsBox, steps,
      h('div', { class: 'field-row' }, K.field('hk-test-exit', 'If the script then', null, el.testExit), K.field('hk-test-stdout', 'and', null, el.testStdout)),
      outcomeBox);

    root.appendChild(h('div', { class: 'tool-layout' },
      h('div', { class: 'card' },
        K.samples(templateButtons.concat([['hk-sample-weak', 'Example: hooks with problems', function () { load(SAMPLES.weak); }]]), 'hk-clear', function () { load(EMPTY); }),
        K.field('hk-mode', 'What to do', null, el.mode),
        buildBox, checkBox),
      h('div', { class: 'st-side' },
        testerCard,
        checks.el,
        h('div', { class: 'card' },
          h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'settings.json'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small', id: 'hk-download-json', type: 'button', onclick: function () { U.download('settings.json', jsonPre.textContent, 'application/json'); } }, 'Download'),
            h('button', { class: 'btn btn-small btn-primary', id: 'hk-copy-json', type: 'button', onclick: function () { U.copy(jsonPre.textContent); } }, 'Copy')),
          whereP, jsonPre),
        h('div', { class: 'card', id: 'hk-script-card' },
          h('div', { class: 'row' }, h('h2', { style: { margin: 0 }, id: 'hk-script-title' }, 'The script'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small', id: 'hk-download-script', type: 'button', onclick: function () { U.download(scriptName(st), scriptPre.textContent, 'text/plain'); } }, 'Download'),
            h('button', { class: 'btn btn-small btn-primary', id: 'hk-copy-script', type: 'button', onclick: function () { U.copy(scriptPre.textContent); } }, 'Copy')),
          scriptPre),
        promptOut.el)));

    function load(next) {
      K.replace(st, next);
      form.fill();
      changed();
    }
    function changed() {
      U.store.set('tool.' + ID, st);
      var check_ = st.mode === 'check', ev = U.hooks.event(st.event) || U.hooks.event('PreToolUse');
      buildBox.hidden = check_;
      checkBox.hidden = !check_;
      testerCard.hidden = check_;
      commandBox.hidden = st.type !== 'command';
      httpBox.hidden = st.type !== 'http';
      promptBox.hidden = st.type !== 'prompt' && st.type !== 'agent';
      scriptBox.hidden = st.lang === 'inline';
      inlineBox.hidden = st.lang !== 'inline';
      testTool.hidden = testInput.hidden = !ev.tool;
      testValue.hidden = ev.tool || ev.matcher === null;
      eventNote.innerHTML = U.mdInline('**' + ev.name + '**: ' + ev.when + '. ' + (ev.matcher ? 'Its matcher filters the ' + ev.matcher + '.' : 'It has no matcher: it fires every time.') +
        ' ' + (ev.block ? 'Can block: ' + ev.exit2.charAt(0).toLowerCase() + ev.exit2.slice(1) + '.' : 'Cannot block.'));
      checks.show(check(st));
      jsonPre.textContent = settingsJson(st);
      whereP.textContent = check_ ? 'The file as pasted, pretty-printed when it parses.' : where(st);
      U.$('#hk-script-card', root).hidden = !usesScript(st);
      U.$('#hk-script-title', root).textContent = scriptName(st);
      scriptPre.textContent = String(st.script || '');
      var sim = simulate(st);
      runsBox.setAttribute('data-runs', sim.runs ? 'yes' : 'no');
      runsBox.setAttribute('data-decision', sim.runs ? 'allow' : 'deny');
      runsBox.innerHTML = '';
      runsBox.appendChild(h('b', null, sim.runs ? 'The hook runs.' : 'The hook does not run.'));
      steps.innerHTML = '';
      sim.steps.forEach(function (s) { steps.appendChild(h('li', { html: U.mdInline(s) })); });
      outcomeBox.setAttribute('data-kind', sim.runs ? sim.outcome.kind : 'not-run');
      outcomeBox.innerHTML = '';
      if (sim.runs) {
        outcomeBox.appendChild(h('b', null, { success: 'It goes ahead.', decision: 'The JSON decides.', blocked: 'Blocked.', error: 'A non-blocking error: it goes ahead.',
          feedback: 'Too late to block: stderr is shown.', ignored: 'The exit code is ignored.', context: 'stdout is added for Claude.' }[sim.outcome.kind] || sim.outcome.kind));
        outcomeBox.appendChild(h('span', { class: 'muted', html: ' ' + U.mdInline(sim.outcome.text + (sim.outcome.claude ? ' ' + sim.outcome.claude : '')) }));
      } else outcomeBox.appendChild(h('span', { class: 'muted' }, 'It does not run for this call, so its exit code does not matter.'));
      promptOut.set(prompt(st));
    }
    form.fill();
    changed();
  };
})(window.CLT);
