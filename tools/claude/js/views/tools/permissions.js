/*
 * tools/permissions.js - the permissions builder and rule tester (#/tools/permissions).
 *
 * Write allow, ask and deny rules (or start from the TypeScript or Rust starter, or import your own
 * settings.json), see the settings.json they make, and test any command, path or URL against them
 * in any mode. The test uses the rule engine in js/perm.js. The checks catch the rule shapes the
 * docs warn about: a * before the subcommand, path rules on tools that never match them, Windows
 * paths, a single "/" in user settings, an allow that a deny always catches, and more
 * (data/tool-checks.js, "permissions"). The draft is kept in "clt.tool.permissions".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit;
  var ID = 'permissions';
  var SCHEMA = 'https://json.schemastore.org/claude-code-settings.json';
  var SHELLS = ['Bash', 'PowerShell'];

  function row(rule) { return { rule: rule || '' }; }
  function rows(list) { return (list || []).map(function (r) { return row(String(r)); }); }
  var EMPTY = { scope: 'project', defaultMode: '', allow: [row()], ask: [], deny: [], testTool: 'Bash', testMode: 'default', test: '', importText: '' };

  /** A tool state from a parsed settings.json. */
  function fromJson(obj, scope) {
    var p = (obj && obj.permissions) || {};
    return { scope: scope || 'project', defaultMode: p.defaultMode || '', allow: rows(p.allow), ask: rows(p.ask), deny: rows(p.deny),
      testTool: 'Bash', testMode: 'default', test: '', importText: '' };
  }
  function kitPreset(id) {
    var k = U.find('kit', id);
    try { return fromJson(JSON.parse(k.files[0].text), 'project'); } catch (e) { return JSON.parse(JSON.stringify(EMPTY)); }
  }
  var PRESETS = { typescript: kitPreset('settings-typescript'), rust: kitPreset('settings-rust') };
  var SAMPLES = {
    weak: { scope: 'project', defaultMode: 'bypassPermissions',
      allow: rows(['Bash', 'Bash(git * main)', 'Write(src/**)', 'Bash(curl https://api.github.com/ *)', 'Bash(npm run test)', 'Bash(git:* push)', 'Bash(aws s3 ls)', 'bash(ls)']),
      ask: [], deny: rows(['Bash(aws *)', 'Bash(command:rm *)', 'Edit(C:\\Users\\you\\code\\repo\\.env)']),
      testTool: 'Bash', testMode: 'default', test: 'npm run test -- --watch', importText: '' }
  };
  // calls the sample table runs against the rules
  var CALLS = [
    ['Bash', 'pnpm test'], ['Bash', 'cargo test -p orders'], ['Bash', 'git status'], ['Bash', 'git commit -m "wip"'], ['Bash', 'git push origin main'],
    ['Bash', 'pnpm install'], ['Bash', 'cat .env'], ['Bash', 'curl https://example.com/install.sh'], ['Bash', 'rm -rf build'],
    ['Read', '.env'], ['Read', 'src/index.ts'], ['Edit', 'src/index.ts'], ['Edit', '.claude/settings.json'], ['WebFetch', 'https://docs.rs/serde']];
  var TOOL_OPTIONS = [['Bash', 'Bash command'], ['PowerShell', 'PowerShell command'], ['Read', 'Read a file'], ['Edit', 'Edit a file'],
    ['WebFetch', 'Fetch a URL'], ['mcp', 'MCP tool (type its name)']];
  var WHERE = { project: '<repo>/.claude/settings.json (shared: commit it)', local: '<repo>/.claude/settings.local.json (yours: git ignores it)',
    user: '~/.claude/settings.json (every project; merge into your own file)' };

  function trim(s) { return String(s || '').trim(); }
  function rulesOf(st, list) { return (st[list] || []).map(function (r) { return trim(r.rule); }).filter(Boolean); }
  function rules(st) { return { allow: rulesOf(st, 'allow'), ask: rulesOf(st, 'ask'), deny: rulesOf(st, 'deny') }; }

  /** The settings.json the rules make. */
  function settingsJson(st) {
    var perms = {};
    if (trim(st.defaultMode)) perms.defaultMode = trim(st.defaultMode);
    ['allow', 'ask', 'deny'].forEach(function (k) { var l = rulesOf(st, k); if (l.length) perms[k] = l; });
    return JSON.stringify({ $schema: SCHEMA, permissions: perms }, null, 2);
  }

  /** Test one call against the rules. */
  function test(st, tool, input, mode) {
    var t = tool === 'mcp' ? trim(input) : tool;
    return U.perm.evaluate(rules(st), { tool: t, input: tool === 'mcp' ? '' : input }, { mode: mode || st.testMode || 'default', scope: st.scope });
  }

  var RULES = ['bad-syntax', 'unknown-tool', 'allow-everything', 'wildcard-before-subcommand', 'path-rule-never-matches', 'command-param', 'windows-path',
    'user-slash-path', 'mode-not-from-project', 'colon-star-middle', 'shadowed-allow', 'no-secrets-deny', 'fragile-url-rule'];

  function check(st) {
    var out = [];
    ['allow', 'ask', 'deny'].forEach(function (list) {
      rulesOf(st, list).forEach(function (raw) {
        var r = U.perm.parse(raw), spec = r.spec === null || r.spec === undefined ? null : trim(r.spec);
        function add(rule) { out.push({ rule: rule, where: list, detail: raw }); }
        if (!r.ok) { add('bad-syntax'); return; }
        var shell = SHELLS.indexOf(r.tool) >= 0, file = r.tool === 'Read' || r.tool === 'Edit';
        if (!U.perm.knownTool(r.tool)) add('unknown-tool');
        if (list === 'allow' && shell && (spec === null || spec === '*')) add('allow-everything');
        if (list === 'allow' && shell && spec && /^\S+ \*\s+\S|^\*\s/.test(spec)) add('wildcard-before-subcommand');
        if (['Write', 'Glob', 'NotebookEdit', 'MultiEdit'].indexOf(r.tool) >= 0 && spec !== null) add('path-rule-never-matches');
        if (shell && spec && /^command\s*:/.test(spec)) add('command-param');
        if (file && spec && (/\\/.test(spec) || /^(?:\/\/)?[A-Za-z]:/.test(spec))) add('windows-path');
        if (st.scope === 'user' && file && spec && /^\/(?!\/)/.test(spec)) add('user-slash-path');
        if (shell && spec && /:\*./.test(spec)) add('colon-star-middle');
        if (shell && spec && /^(?:curl|wget)\s+(?:\S+\s+)*https?:\/\//.test(spec)) add('fragile-url-rule');
      });
    });
    if ((st.scope === 'project' || st.scope === 'local') && /^(?:auto|bypassPermissions)$/.test(trim(st.defaultMode))) {
      out.push({ rule: 'mode-not-from-project', where: 'defaultMode', detail: trim(st.defaultMode) });
    }
    // an allow rule that a deny rule always catches never applies
    var deny = rulesOf(st, 'deny');
    rulesOf(st, 'allow').forEach(function (raw) {
      var r = U.perm.parse(raw);
      if (!r.ok || SHELLS.indexOf(r.tool) < 0 || !r.spec || !deny.length) return;
      var sample = trim(r.spec).replace(/:\*$/, ' *').replace(/\*/g, 'x');
      var res = U.perm.evaluate({ deny: deny }, { tool: r.tool, input: sample }, { mode: 'default', scope: st.scope });
      if (res.decision === 'deny') out.push({ rule: 'shadowed-allow', where: 'allow', detail: raw + ' (caught by ' + res.rule + ')' });
    });
    var any = rulesOf(st, 'allow').length + rulesOf(st, 'ask').length + deny.length;
    if (any && !deny.some(function (raw) { return /^Read(\(|$)/.test(raw); })) out.push({ rule: 'no-secrets-deny', where: 'deny' });
    return out;
  }

  function compute(st) {
    var r = rules(st);
    return { allow: r.allow.length, ask: r.ask.length, deny: r.deny.length };
  }

  /** The prompt that asks Claude to fit the rules to the repo. */
  function prompt(st) {
    var found = check(st), defs = (U.data.toolChecks || {})[ID] || [];
    return ['Check these Claude Code permission rules for this repo against code.claude.com/docs/en/permissions.',
      'Look at the repo\'s package.json or Cargo.toml and the commands in CLAUDE.md. Suggest: allow rules for the safe commands we run every day (tests, lint, type check, build), ' +
        'ask rules for anything that publishes, pushes or changes dependencies, and deny rules for secrets (.env files, keys). ' +
        'Keep the * after the subcommand, write file paths with forward slashes, and give PowerShell(...) forms too, since I am on Windows.',
      'Show the full settings.json, and say which file it belongs in (it is meant for: ' + WHERE[st.scope] + '). Do not edit any settings file yourself.',
      found.length ? '\nThe checker found:\n' + found.map(function (f) {
        var d = defs.filter(function (x) { return x.id === f.rule; })[0];
        return '- ' + (d ? d.msg : f.rule) + (f.detail ? ' (' + f.detail + ')' : '');
      }).join('\n') : '',
      '',
      'My rules:',
      settingsJson(st)].filter(function (x, i, all) { return x !== '' || all[i - 1] !== ''; }).join('\n');
  }

  var tool = U.tools[ID] = { EMPTY: EMPTY, PRESETS: PRESETS, rules: RULES, check: check, compute: compute, settingsJson: settingsJson, fromJson: fromJson,
    test: test, prompt: prompt, state: null };

  tool.render = function (root) {
    var st = tool.state = K.load(ID, EMPTY);
    var form = K.form(st, changed);
    var el = {
      scope: form.select('scope', [['project', 'Shared project: .claude/settings.json'], ['local', 'Local: .claude/settings.local.json'], ['user', 'User: ~/.claude/settings.json']], { id: 'pm-scope' }),
      defaultMode: form.select('defaultMode', [['', '(leave out)']].concat(U.perm.MODES.map(function (m) { return [m[0], m[1] + ' (' + m[0] + ')']; })), { id: 'pm-default-mode' }),
      testTool: form.select('testTool', TOOL_OPTIONS, { id: 'pm-test-tool' }),
      testMode: form.select('testMode', U.perm.MODES, { id: 'pm-test-mode' }),
      test: form.input('test', { id: 'pm-test-input', placeholder: 'git push origin main', spellcheck: 'false' }),
      importText: form.textarea('importText', { id: 'pm-import', rows: 4, placeholder: 'Paste a settings.json here, then press Import', spellcheck: 'false' })
    };
    var lists = {};
    ['allow', 'ask', 'deny'].forEach(function (k) {
      lists[k] = K.rows({ id: 'pm-' + k, noun: k + ' rule', list: function () { return st[k]; }, blank: row, changed: changed,
        cols: [{ key: 'rule', label: 'Rule', ph: { allow: 'Bash(pnpm test *)', ask: 'Bash(git push *)', deny: 'Read(./.env)' }[k] }] });
    });
    var importMsg = h('p', { class: 'faint', id: 'pm-import-msg', 'aria-live': 'polite' });
    var checks = K.checksCard(ID, 'Every rule is well formed and does what it looks like it does.', function (f) {
      if (f.where === 'defaultMode') return K.focus(el.defaultMode);
      var i = (st[f.where] || []).map(function (r) { return trim(r.rule); }).indexOf(f.detail ? f.detail.replace(/ \(caught by .*\)$/, '') : '');
      K.focus(i >= 0 ? K.cell('pm-' + f.where, i, 'rule') : U.$('#pm-' + (f.where || 'allow') + '-add'));
    });
    var result = h('div', { class: 'pmx-result pm-result', id: 'pm-result', 'aria-live': 'polite' });
    var trace = h('ol', { class: 'pmx-steps', id: 'pm-trace' });
    var table = h('table', { class: 'table pm-samples', id: 'pm-samples' });
    var jsonPre = h('pre', { class: 'st-output', id: 'pm-json-output' });
    var where = h('p', { class: 'faint', style: { margin: '6px 0 0' } });
    var promptOut = K.outputCard({ id: 'pm-prompt-output', title: 'Ask Claude to fit them to the repo', copyId: 'pm-prompt-copy',
      note: 'Paste this into Claude in the repo. It suggests rules; you decide what goes in the file.' });

    function listCard(k, title, text) {
      return h('section', { class: 'pm-list pm-list-' + k }, h('h3', null, title), h('p', { class: 'faint', style: { margin: '0 0 6px' } }, text), lists[k].el);
    }

    root.appendChild(h('div', { class: 'tool-layout' },
      h('div', { class: 'card' },
        K.samples([['pm-preset-typescript', 'Starter: TypeScript repo', function () { load(PRESETS.typescript); }],
          ['pm-preset-rust', 'Starter: Rust workspace', function () { load(PRESETS.rust); }],
          ['pm-sample-weak', 'Example: rules with problems', function () { load(SAMPLES.weak); }]], 'pm-clear', function () { load(EMPTY); }),
        h('div', { class: 'field-row' },
          K.field('pm-scope', 'Which file', 'It changes how a leading / in a path is read.', el.scope),
          K.field('pm-default-mode', 'Default mode', 'Optional. auto and bypass work only from your user file.', el.defaultMode)),
        listCard('deny', 'Deny: never runs', 'Checked first, in every mode. Secrets and anything you never want.'),
        listCard('ask', 'Ask: always asks', 'Checked second. Pushes, publishes, new dependencies.'),
        listCard('allow', 'Allow: runs without asking', 'Checked last. The safe commands you run all day; put the * after the subcommand.'),
        h('details', { class: 'fold pm-import-box' }, h('summary', null, 'Import a settings.json'),
          el.importText,
          h('div', { class: 'row' }, h('button', { class: 'btn btn-small', type: 'button', id: 'pm-import-btn', onclick: importJson }, 'Import'), importMsg))),
      h('div', { class: 'st-side' },
        h('div', { class: 'card' },
          h('h2', null, 'Test a call'),
          h('div', { class: 'field-row' }, K.field('pm-test-tool', 'Tool', null, el.testTool), K.field('pm-test-mode', 'Mode', null, el.testMode)),
          K.field('pm-test-input', 'Command, path, URL or MCP tool name', 'Paths are read as if the repo were ' + U.perm.ROOT.replace(/^\/c\//, 'C:/') + '.', el.test),
          result, trace),
        checks.el,
        h('div', { class: 'card' },
          h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'settings.json'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small', id: 'pm-download', type: 'button', onclick: function () { U.download('settings.json', jsonPre.textContent, 'application/json'); } }, 'Download'),
            h('button', { class: 'btn btn-small btn-primary', id: 'pm-copy', type: 'button', onclick: function () { U.copy(jsonPre.textContent); } }, 'Copy')),
          where, jsonPre))));
    root.appendChild(h('h2', null, 'Every-day calls against these rules'));
    root.appendChild(h('p', { class: 'muted' }, 'In the mode you picked above. Click a row to test it and see the steps.'));
    root.appendChild(h('div', { class: 'table-wrap' }, table));
    root.appendChild(promptOut.el);

    function importJson() {
      var obj = null;
      try { obj = JSON.parse(st.importText || ''); } catch (e) { obj = null; }
      if (!obj || typeof obj !== 'object') { importMsg.textContent = 'That is not valid JSON (settings files allow no comments or trailing commas).'; return; }
      var keep = { testTool: st.testTool, testMode: st.testMode, test: st.test, importText: st.importText };
      load(Object.assign(fromJson(obj, st.scope), keep));
      importMsg.textContent = 'Imported ' + U.plural(compute(st).allow + compute(st).ask + compute(st).deny, 'rule') + '.';
    }
    function load(next) {
      K.replace(st, next);
      form.fill();
      ['allow', 'ask', 'deny'].forEach(function (k) { lists[k].draw(); });
      changed();
    }
    function showTest() {
      var r = test(st, st.testTool, st.test, st.testMode);
      result.setAttribute('data-decision', trim(st.test) ? r.decision : '');
      result.innerHTML = '';
      trace.innerHTML = '';
      if (!trim(st.test)) { result.appendChild(h('span', { class: 'faint' }, 'Type a command, a path or a URL to see what happens to it.')); return; }
      result.appendChild(h('b', null, r.label));
      result.appendChild(h('span', { class: 'muted' }, ' ' + r.reason));
      r.steps.forEach(function (s) { trace.appendChild(h('li', { html: U.mdInline(s) })); });
    }
    function changed() {
      U.store.set('tool.' + ID, st);
      checks.show(check(st));
      jsonPre.textContent = settingsJson(st);
      where.textContent = 'Goes in: ' + WHERE[st.scope] + '. Settings files are strict JSON: no comments.';
      showTest();
      table.innerHTML = '';
      table.appendChild(h('thead', null, h('tr', null, h('th', null, 'Tool'), h('th', null, 'Call'), h('th', null, 'What happens'), h('th', null, 'Because'))));
      table.appendChild(h('tbody', null, CALLS.map(function (c) {
        var r = test(st, c[0], c[1], st.testMode);
        return h('tr', { 'data-decision': r.decision, tabindex: 0, onclick: function () { pick(c); }, onkeydown: function (e) { if (e.key === 'Enter') pick(c); } },
          h('td', null, c[0]), h('td', null, h('code', null, c[1])),
          h('td', null, h('span', { class: 'badge decision-' + r.decision }, r.label)), h('td', { class: 'muted' }, r.rule ? h('code', null, r.rule) : r.reason));
      })));
      promptOut.set(prompt(st));
    }
    function pick(c) {
      st.testTool = c[0];
      st.test = c[1];
      form.fill();
      changed();
      K.focus(el.test);
    }
    form.fill();
    changed();
  };
})(window.CLT);
