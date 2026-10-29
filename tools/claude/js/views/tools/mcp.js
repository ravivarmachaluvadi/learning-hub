/*
 * tools/mcp.js - the MCP command builder (#/tools/mcp).
 *
 * Build: pick a preset (Playwright, Chrome DevTools, Context7, GitHub, Jira through Atlassian's
 * server) or describe a server, and get the `claude mcp add` command for PowerShell and the entry it
 * makes. Check: paste a .mcp.json. The presets follow each vendor's own Claude Code instructions,
 * changed only to put the server's command after --, quote values for PowerShell, and keep tokens in
 * environment variables (Claude Code expands ${VAR} in a server's url, headers, command, args and
 * env; checked on this PC on 24 Oct 2026). Rules: code.claude.com/docs/en/mcp, 2.1.309. The checks'
 * messages are data (data/tool-checks.js, "mcp"). The draft is kept in "clt.tool.mcp".
 *
 * `claude mcp add` is used rather than `claude mcp add-json`: Windows PowerShell 5.1 strips the
 * double quotes inside a JSON argument before claude sees it (checked on this PC), so add-json fails there.
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit;
  var ID = 'mcp';

  function kv(key, value) { return { key: key || '', value: value || '' }; }
  var EMPTY = { mode: 'build', name: '', transport: 'stdio', scope: 'local', url: '', command: '', args: '', env: [], headers: [], pasted: '' };
  var PRESETS = {
    playwright: Object.assign({}, EMPTY, { name: 'playwright', transport: 'stdio', scope: 'local', command: 'npx', args: '@playwright/mcp@latest' }),
    'chrome-devtools': Object.assign({}, EMPTY, { name: 'chrome-devtools', transport: 'stdio', scope: 'user', command: 'npx', args: 'chrome-devtools-mcp@latest' }),
    context7: Object.assign({}, EMPTY, { name: 'context7', transport: 'http', scope: 'user', url: 'https://mcp.context7.com/mcp',
      headers: [kv('Authorization', 'Bearer ${CONTEXT7_API_KEY}')] }),
    github: Object.assign({}, EMPTY, { name: 'github', transport: 'http', scope: 'user', url: 'https://api.githubcopilot.com/mcp/',
      headers: [kv('Authorization', 'Bearer ${GITHUB_PAT}')] }),
    atlassian: Object.assign({}, EMPTY, { name: 'atlassian', transport: 'http', scope: 'user', url: 'https://mcp.atlassian.com/v2/mcp' })
  };
  var PRESET_NOTES = {
    playwright: 'Microsoft\'s browser automation server: Claude opens pages, clicks, fills forms and reads the page. Local to this project, as the vendor shows.',
    'chrome-devtools': 'Google\'s Chrome DevTools server: performance traces, network requests, console messages. Every project. It can also be installed as a plugin with its skills.',
    context7: 'Up-to-date library docs. Set CONTEXT7_API_KEY first (a free key from context7.com/dashboard): [Environment]::SetEnvironmentVariable(\'CONTEXT7_API_KEY\', \'<key>\', \'User\'), then open a new terminal.',
    github: 'GitHub\'s remote server: issues, pull requests, code search. Set GITHUB_PAT to a fine-grained personal access token for the repos you want, then open a new terminal.',
    atlassian: 'Atlassian\'s remote server for Jira and Confluence. No token: run /mcp in a session and sign in through the browser.'
  };
  var SAMPLES = {
    weak: Object.assign({}, EMPTY, { name: 'my server', transport: 'sse', scope: 'project', url: 'http://mcp.example.com/sse',
      headers: [kv('Authorization', 'Bearer ghp_abcdefghijklmnopqrstuvwxyz0123456789'), kv('X-Claude-Key', '${ANTHROPIC_API_KEY}')] })
  };
  var RESERVED = ['workspace', 'claude-in-chrome', 'computer-use', 'Claude Preview', 'Claude Browser'];
  // variables Claude Code reads as empty in a remote server's url and headers (code.claude.com/docs/en/mcp)
  var CREDENTIAL_VARS = /\$\{(?:ANTHROPIC_API_KEY|ANTHROPIC_AUTH_TOKEN|CLAUDE_CODE_OAUTH_TOKEN|AWS_BEARER_TOKEN_BEDROCK|AWS_SECRET_ACCESS_KEY|AWS_SESSION_TOKEN|NPM_TOKEN|HTTPS_PROXY|HTTP_PROXY)(?::-[^}]*)?\}/;
  var SECRET = /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9-]{16,}|xox[abpr]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|glpat-[A-Za-z0-9_-]{16,})\b|^(?:Bearer|Basic|token)\s+[A-Za-z0-9._~+/=-]{20,}$|^[A-Fa-f0-9]{32,}$/;

  function trim(s) { return String(s === undefined || s === null ? '' : s).trim(); }
  function rows(list) { return (list || []).filter(function (r) { return trim(r.key); }); }
  function argList(s) {
    var out = [], re = /"([^"]*)"|'([^']*)'|(\S+)/g, m;
    while ((m = re.exec(String(s || '')))) out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
    return out;
  }
  /** A value as PowerShell passes it on untouched: bare when it is safe, otherwise in single quotes ($ stays literal). */
  function ps(s) {
    s = String(s);
    return /^[\w@.\/:=,+%-]+$/.test(s) ? s : '\'' + s.replace(/'/g, '\'\'') + '\'';
  }
  function remote(st) { return st.transport === 'http' || st.transport === 'sse'; }

  function command(st) {
    var name = trim(st.name) || '<name>', scope = st.scope && st.scope !== 'local' ? ' --scope ' + st.scope : '';
    if (remote(st)) {
      return 'claude mcp add --transport ' + st.transport + ' ' + ps(name) + scope + ' ' + ps(trim(st.url) || '<url>') +
        rows(st.headers).map(function (r) { return ' --header ' + ps(trim(r.key) + ': ' + trim(r.value)); }).join('');
    }
    return 'claude mcp add ' + ps(name) + scope + rows(st.env).map(function (r) { return ' --env ' + ps(trim(r.key) + '=' + trim(r.value)); }).join('') +
      ' -- ' + [trim(st.command) || '<command>'].concat(argList(st.args)).map(ps).join(' ');
  }
  /** The entry the command writes, as it reads in .mcp.json (project scope) or ~/.claude.json (local and user). */
  function entry(st) {
    var e;
    if (remote(st)) {
      e = { type: st.transport, url: trim(st.url) };
      var hs = rows(st.headers);
      if (hs.length) { e.headers = {}; hs.forEach(function (r) { e.headers[trim(r.key)] = trim(r.value); }); }
    } else {
      e = { type: 'stdio', command: trim(st.command), args: argList(st.args) };
      var en = rows(st.env);
      if (en.length) { e.env = {}; en.forEach(function (r) { e.env[trim(r.key)] = trim(r.value); }); }
    }
    return e;
  }
  function json(st) {
    if (st.mode === 'check') {
      try { return JSON.stringify(JSON.parse(st.pasted), null, 2); } catch (e) { return String(st.pasted || ''); }
    }
    var servers = {};
    servers[trim(st.name) || '<name>'] = entry(st);
    return JSON.stringify({ mcpServers: servers }, null, 2);
  }

  var RULES = ['bad-json', 'no-name', 'bad-name', 'reserved-name', 'missing-target', 'url-without-type', 'stdio-url', 'sse-deprecated', 'not-https',
    'secret-in-shared-file', 'credential-var', 'project-dir-no-default'];

  /** Findings for one server entry (as in .mcp.json). shared: the file is committed (project scope). */
  function checkEntry(name, e, shared, out) {
    function add(rule, detail) { out.push({ rule: rule, where: name, detail: detail }); }
    if (!trim(name)) add('no-name');
    else if (RESERVED.indexOf(name) >= 0) add('reserved-name', name);
    else if (!/^[A-Za-z0-9_-]+$/.test(name)) add('bad-name', name);
    if (!e || typeof e !== 'object') { add('missing-target', 'not an object'); return; }
    var type = e.type === 'streamable-http' ? 'http' : e.type;
    if (e.url && !type) add('url-without-type', name);
    if ((type === 'http' || type === 'sse' || type === 'ws') && !trim(e.url)) add('missing-target', 'no url');
    if ((!type || type === 'stdio') && !e.url && !trim(e.command)) add('missing-target', 'no command');
    if ((!type || type === 'stdio') && /^https?:\/\//.test(trim(e.command))) add('stdio-url', e.command);
    if (type === 'sse') add('sse-deprecated');
    var url = trim(e.url);
    if (url && /^http:\/\//i.test(url) && !/^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(url)) add('not-https', url);
    var values = [], key;
    for (key in (e.headers || {})) values.push([key, String(e.headers[key])]);
    for (key in (e.env || {})) values.push([key, String(e.env[key])]);
    if (shared) values.forEach(function (v) { if (!/\$\{/.test(v[1]) && SECRET.test(v[1].trim())) add('secret-in-shared-file', v[0]); });
    var remoteText = [url].concat(Object.keys(e.headers || {}).map(function (k) { return String(e.headers[k]); })).join(' ');
    var cv = CREDENTIAL_VARS.exec(remoteText);
    if (cv) add('credential-var', cv[0]);
    var local = [String(e.command || '')].concat((e.args || []).map(String)).join(' ');
    if (/\$\{CLAUDE_PROJECT_DIR\}/.test(local)) add('project-dir-no-default', '${CLAUDE_PROJECT_DIR}');
  }
  function check(st) {
    var out = [];
    if (st.mode === 'check') {
      if (!trim(st.pasted)) return out;
      var obj;
      try { obj = JSON.parse(st.pasted); } catch (e) { return [{ rule: 'bad-json', detail: e.message }]; }
      var servers = obj && (obj.mcpServers || null);
      if (!servers || typeof servers !== 'object') return [{ rule: 'bad-json', detail: 'no "mcpServers" object' }];
      Object.keys(servers).forEach(function (n) { checkEntry(n, servers[n], true, out); });
      return out;
    }
    checkEntry(trim(st.name), entry(st), st.scope === 'project', out);
    return out;
  }
  function compute(st) { return { headers: rows(st.headers).length, env: rows(st.env).length }; }

  function where(st) {
    return { local: 'Writes to your ~/.claude.json, for this project only (the default). Nothing goes into the repo.',
      project: 'Writes .mcp.json in the project root: commit it, and each teammate approves the server once. Keep tokens in ${VAR}s.',
      user: 'Writes to your ~/.claude.json, for every project on this PC.' }[st.scope] +
      ' Check it with claude mcp get ' + (trim(st.name) || '<name>') + ', or /mcp in a session.';
  }
  function prompt(st) {
    var defs = (U.data.toolChecks || {})[ID] || [];
    var found = check(st).map(function (f) {
      var d = defs.filter(function (x) { return x.id === f.rule; })[0];
      return '- ' + (d ? d.msg : f.rule) + (f.detail ? ' (' + f.detail + ')' : '');
    });
    return ['Help me add this MCP server to Claude Code (code.claude.com/docs/en/mcp). I am on Windows, in PowerShell.',
      'Check the server\'s own setup page for the right command, the tools it gives Claude, and what it can reach. ' +
        'Tell me which scope fits (local, project or user), how to keep its token out of git, and how to check it connected.',
      'Do not run the command yourself; show it to me.',
      found.length ? '\nThe checker found:\n' + found.join('\n') : '',
      '', st.mode === 'check' ? '.mcp.json:\n' + json(st) : 'The command:\n' + command(st)].filter(function (x, i, all) { return x !== '' || all[i - 1] !== ''; }).join('\n');
  }

  var tool = U.tools[ID] = { EMPTY: EMPTY, PRESETS: PRESETS, SAMPLES: SAMPLES, rules: RULES, check: check, compute: compute,
    command: command, json: json, entry: entry, prompt: prompt, state: null };

  tool.render = function (root) {
    var st = tool.state = K.load(ID, EMPTY);
    var form = K.form(st, changed);
    var el = {
      mode: form.select('mode', [['build', 'Build a command'], ['check', 'Check a .mcp.json I paste']], { id: 'mc-mode' }),
      name: form.input('name', { id: 'mc-name', placeholder: 'orders-db', spellcheck: 'false' }),
      transport: form.select('transport', [['stdio', 'stdio: a program on this PC'], ['http', 'http: a remote URL'], ['sse', 'sse (old remote servers)']], { id: 'mc-transport' }),
      scope: form.select('scope', [['local', 'Local: you, this project (default)'], ['project', 'Project: .mcp.json, shared'], ['user', 'User: you, every project']], { id: 'mc-scope' }),
      url: form.input('url', { id: 'mc-url', placeholder: 'https://mcp.example.com/mcp', spellcheck: 'false' }),
      command: form.input('command', { id: 'mc-command', placeholder: 'npx', spellcheck: 'false' }),
      args: form.input('args', { id: 'mc-args', placeholder: '-y @example/mcp-server --port 8080', spellcheck: 'false' }),
      pasted: form.textarea('pasted', { id: 'mc-paste', rows: 14, spellcheck: 'false', placeholder: 'Paste a .mcp.json. Nothing leaves this browser.' })
    };
    var envRows = K.rows({ id: 'mc-env', noun: 'variable', list: function () { return st.env; }, blank: function () { return kv(); }, changed: changed,
      cols: [{ key: 'key', label: 'Name', ph: 'API_KEY', size: '1fr' }, { key: 'value', label: 'Value', ph: '${API_KEY}', size: '2fr' }] });
    var headerRows = K.rows({ id: 'mc-headers', noun: 'header', list: function () { return st.headers; }, blank: function () { return kv(); }, changed: changed,
      cols: [{ key: 'key', label: 'Header', ph: 'Authorization', size: '1fr' }, { key: 'value', label: 'Value', ph: 'Bearer ${TOKEN}', size: '2fr' }] });
    var cmdPre = h('pre', { class: 'st-output', id: 'mc-command-output' });
    var jsonPre = h('pre', { class: 'st-output', id: 'mc-json-output' });
    var whereP = h('p', { class: 'faint', id: 'mc-where', style: { margin: '6px 0 0' } });
    var noteP = h('p', { class: 'muted', id: 'mc-note' });
    var checks = K.checksCard(ID, 'The command is complete, and nothing secret goes into a shared file.', function (f) {
      if (st.mode === 'check') return K.focus(el.pasted);
      var map = { 'no-name': el.name, 'bad-name': el.name, 'reserved-name': el.name, 'missing-target': remote(st) ? el.url : el.command,
        'stdio-url': el.transport, 'sse-deprecated': el.transport, 'not-https': el.url, 'secret-in-shared-file': el.scope };
      K.focus(map[f.rule] || el.name);
    });
    var promptOut = K.outputCard({ id: 'mc-prompt-output', title: 'Ask Claude to help', copyId: 'mc-prompt-copy',
      note: 'Paste this into Claude: it checks the server\'s own page, which this tool cannot.' });

    var remoteBox = h('div', null, K.field('mc-url', 'URL', null, el.url), h('div', { class: 'field-label' }, 'Headers'), headerRows.el);
    var stdioBox = h('div', null, h('div', { class: 'field-row' }, K.field('mc-command', 'Command', 'The program that starts the server.', el.command),
      K.field('mc-args', 'Arguments', 'Passed to it after --, untouched.', el.args)), h('div', { class: 'field-label' }, 'Environment variables'), envRows.el);
    var buildBox = h('div', { class: 'cm-build' },
      noteP,
      h('div', { class: 'field-row' }, K.field('mc-name', 'Name', 'Letters, numbers, - and _.', el.name), K.field('mc-transport', 'Transport', null, el.transport)),
      K.field('mc-scope', 'Scope', null, el.scope),
      remoteBox, stdioBox);
    var checkBox = h('div', { class: 'cm-check' }, K.field('mc-paste', 'Your .mcp.json', 'A project file: everyone who clones the repo gets it.', el.pasted));

    root.appendChild(h('div', { class: 'tool-layout' },
      h('div', { class: 'card' },
        K.samples(Object.keys(PRESETS).map(function (id) { return ['mc-preset-' + id, id, function () { load(PRESETS[id], id); }]; })
          .concat([['mc-sample-weak', 'Example: a risky server', function () { load(SAMPLES.weak); }]]), 'mc-clear', function () { load(EMPTY); }),
        K.field('mc-mode', 'What to do', null, el.mode),
        buildBox, checkBox),
      h('div', { class: 'st-side' },
        checks.el,
        h('div', { class: 'card', id: 'mc-command-card' },
          h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'Run this in PowerShell'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small btn-primary', id: 'mc-copy', type: 'button', onclick: function () { U.copy(cmdPre.textContent); } }, 'Copy')),
          whereP, cmdPre),
        h('div', { class: 'card' },
          h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, '.mcp.json'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small btn-primary', id: 'mc-copy-json', type: 'button', onclick: function () { U.copy(jsonPre.textContent); } }, 'Copy')),
          h('p', { class: 'faint', style: { margin: '6px 0 0' } }, 'The entry as Claude Code stores it. For project scope this is the whole file to commit.'),
          jsonPre),
        promptOut.el)));

    var lastPreset = '';
    function load(next, preset) {
      lastPreset = preset || '';
      K.replace(st, next);
      form.fill();
      envRows.draw();
      headerRows.draw();
      changed();
    }
    function changed() {
      U.store.set('tool.' + ID, st);
      var check_ = st.mode === 'check';
      buildBox.hidden = check_;
      checkBox.hidden = !check_;
      remoteBox.hidden = !remote(st);
      stdioBox.hidden = remote(st);
      U.$('#mc-command-card', root).hidden = check_;
      noteP.textContent = PRESET_NOTES[lastPreset] && trim(st.name) === lastPreset ? PRESET_NOTES[lastPreset] : '';
      noteP.hidden = !noteP.textContent;
      checks.show(check(st));
      cmdPre.textContent = command(st);
      jsonPre.textContent = json(st);
      whereP.textContent = where(st);
      promptOut.set(prompt(st));
    }
    form.fill();
    changed();
  };
})(window.CLT);
