/*
 * tools/automation.js - the headless and GitHub Action builder (#/tools/automation).
 *
 * Three modes. Headless: a claude -p command for PowerShell 7, Windows PowerShell 5.1 or bash, with
 * its mode, allowed tools, caps and output format (code.claude.com/docs/en/headless). Workflow: a
 * .github/workflows file for anthropics/claude-code-action@v1, for @claude mentions, pull requests,
 * a schedule or new issues (code.claude.com/docs/en/github-actions); the "kit" preset writes the
 * kit's claude.yml exactly. Check: paste a workflow you already have and see what is out of date or
 * unsafe. The draft is kept in "clt.tool.automation".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit;
  var ID = 'automation';

  var EMPTY = { mode: 'headless', prompt: '', stdin: '', shell: 'pwsh', perm: '', allowed: '', output: 'text', maxTurns: '', maxBudget: '', model: '', bare: false,
    trigger: 'mention', cron: '0 9 * * 1-5', auth: 'api-key', timeout: '30', githubToken: false, pasted: '' };

  var MODES = [['headless', 'A command: claude -p'], ['workflow', 'A GitHub workflow'], ['check', 'Check a workflow I have']];
  var SHELLS = [['pwsh', 'PowerShell 7 (pwsh)'], ['powershell', 'Windows PowerShell 5.1'], ['bash', 'bash (CI runners, WSL, Git Bash)']];
  var PERMS = [['', 'Not set: your settings, else Manual'], ['default', 'Manual (default)'], ['acceptEdits', 'Accept edits'], ['plan', 'Plan'],
    ['auto', 'Auto (a classifier decides)'], ['dontAsk', 'Don\'t ask (only what is allowed)'], ['bypassPermissions', 'Bypass permissions']];
  var OUTPUTS = [['text', 'Text'], ['json', 'JSON (result, cost, session)'], ['stream-json', 'Streamed JSON events']];
  var TRIGGERS = [['mention', '@claude mentions in issues and PRs'], ['pr', 'Every pull request that opens or changes'], ['schedule', 'On a schedule (cron)'], ['issues', 'Every new issue']];
  var AUTHS = [['api-key', 'API key (ANTHROPIC_API_KEY)'], ['oauth', 'Subscription token (CLAUDE_CODE_OAUTH_TOKEN)']];

  var PR_PROMPT = 'Write a pull request description for the diff on stdin: what changed and why, how it was tested, what is not done yet. Use only the diff.';
  var OLD_WORKFLOW = 'name: Claude\non:\n  issue_comment:\n    types: [created]\njobs:\n  claude:\n    runs-on: ubuntu-latest\n    permissions:\n' +
    '      contents: write\n      pull-requests: write\n      issues: write\n    steps:\n      - uses: actions/checkout@v4\n' +
    '      - uses: anthropics/claude-code-action@beta\n        with:\n          anthropic_api_key: sk-ant-api03-EXAMPLEEXAMPLEEXAMPLE\n' +
    '          github_token: ${{ secrets.GITHUB_TOKEN }}\n          mode: tag\n          direct_prompt: Review this pull request\n          max_turns: 5\n';
  function preset(o) { return Object.assign(JSON.parse(JSON.stringify(EMPTY)), o); }
  var PRESETS = {
    'pr-summary': preset({ mode: 'headless', prompt: PR_PROMPT, stdin: 'git diff main...HEAD', shell: 'pwsh', perm: 'dontAsk', output: 'json', maxTurns: '3', maxBudget: '0.50' }),
    kit: preset({ mode: 'workflow', trigger: 'mention', auth: 'api-key', maxTurns: '15', timeout: '30' }),
    daily: preset({ mode: 'workflow', trigger: 'schedule', cron: '0 9 * * 1-5', auth: 'api-key', maxTurns: '10', timeout: '15', allowed: 'mcp__github__list_issues',
      prompt: 'Summarise the open issues labelled bug: what each one is about, and which look like duplicates.' })
  };
  var SAMPLES = {
    weak: preset({ mode: 'headless', prompt: 'Fix the failing tests and reply "done"', shell: 'powershell', perm: 'bypassPermissions', allowed: 'Bash, Bash(npm test*)' }),
    weakWorkflow: preset({ mode: 'workflow', trigger: 'schedule', prompt: '', githubToken: true, maxTurns: '', timeout: '' }),
    old: preset({ mode: 'check', pasted: OLD_WORKFLOW })
  };

  function trim(s) { return String(s || '').trim(); }
  function list(s) { return String(s || '').split(',').map(trim).filter(Boolean); }

  /** Quote one argument for the chosen shell: single quotes, which keep $ and backticks literal. */
  function quote(st, s) {
    return st.shell === 'bash' ? "'" + String(s).replace(/'/g, "'\\''") + "'" : "'" + String(s).replace(/'/g, "''") + "'";
  }

  /** The claude -p command line. --allowedTools takes several values, so it goes last, after the prompt. */
  function command(st) {
    var parts = ['claude', '-p', quote(st, trim(st.prompt) || '<what to do>')];
    if (st.bare) parts.push('--bare');
    if (trim(st.model)) parts.push('--model', trim(st.model));
    if (st.output === 'json') parts.push('--output-format', 'json');
    if (st.output === 'stream-json') parts.push('--output-format', 'stream-json', '--verbose');
    if (trim(st.maxTurns)) parts.push('--max-turns', trim(st.maxTurns));
    if (trim(st.maxBudget)) parts.push('--max-budget-usd', trim(st.maxBudget));
    if (st.perm) parts.push('--permission-mode', st.perm);
    var allowed = list(st.allowed);
    if (allowed.length) parts.push('--allowedTools', quote(st, allowed.join(',')));
    var cmd = parts.join(' ');
    return trim(st.stdin) ? trim(st.stdin) + ' | ' + cmd : cmd;
  }

  var MENTION_IF = [
    "      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||",
    "      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||",
    "      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude')) ||",
    "      (github.event_name == 'issues' && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')))"];

  /** The .github/workflows file. The mention trigger with a 15-turn cap and a 30-minute timeout is the kit's claude.yml. */
  function workflow(st) {
    var trig = st.trigger || 'mention';
    var secret = st.auth === 'oauth' ? 'CLAUDE_CODE_OAUTH_TOKEN' : 'ANTHROPIC_API_KEY';
    var input = st.auth === 'oauth' ? 'claude_code_oauth_token' : 'anthropic_api_key';
    var head = { mention: '# Answers @claude in issues, pull request comments and reviews.',
      pr: '# Runs a prompt on every pull request that opens or changes; results go to the run log unless the prompt posts them.',
      schedule: '# Runs a prompt on a schedule (cron times are UTC); results go to the run log unless the prompt posts them.',
      issues: '# Runs a prompt on every new issue; results go to the run log unless the prompt posts them.' }[trig];
    var name = { mention: 'Claude Code', pr: 'Claude Code (pull requests)', schedule: 'Claude Code (scheduled)', issues: 'Claude Code (new issues)' }[trig];
    var out = [head, '# Needs the Claude GitHub App on the repository and the ' + secret + ' repository secret.',
      '# See code.claude.com/docs/en/github-actions. Claude reads CLAUDE.md on every run: keep it short.', 'name: ' + name, '', 'on:'];
    if (trig === 'mention') out.push('  issue_comment:', '    types: [created]', '  pull_request_review_comment:', '    types: [created]',
      '  issues:', '    types: [opened, assigned]', '  pull_request_review:', '    types: [submitted]');
    if (trig === 'pr') out.push('  pull_request:', '    types: [opened, synchronize, ready_for_review, reopened]');
    if (trig === 'schedule') out.push('  schedule:', '    - cron: "' + trim(st.cron).replace(/"/g, '') + '"', '  workflow_dispatch:');
    if (trig === 'issues') out.push('  issues:', '    types: [opened]');
    out.push('', 'jobs:', '  claude:');
    if (trig === 'mention') out.push('    if: |'), out.push.apply(out, MENTION_IF);
    out.push('    runs-on: ubuntu-latest');
    if (trim(st.timeout)) out.push('    timeout-minutes: ' + trim(st.timeout));
    out.push('    permissions:');
    var perms = { mention: ['contents: write', 'pull-requests: write', 'issues: write', 'id-token: write', 'actions: read'],
      pr: ['contents: read', 'pull-requests: read', 'issues: read', 'id-token: write'],
      schedule: ['contents: read', 'issues: read', 'id-token: write'],
      issues: ['contents: read', 'issues: write', 'id-token: write'] }[trig];
    perms.forEach(function (p) { out.push('      ' + p); });
    out.push('    steps:', '      - uses: actions/checkout@v6', '        with:', '          fetch-depth: 1',
      '      - uses: anthropics/claude-code-action@v1', '        with:', '          ' + input + ': ${{ secrets.' + secret + ' }}');
    if (st.githubToken) out.push('          github_token: ${{ secrets.GITHUB_TOKEN }}');
    if (trig !== 'mention' && trim(st.prompt)) {
      out.push('          prompt: |');
      String(st.prompt).replace(/\s+$/, '').split('\n').forEach(function (l) { out.push(l.trim() ? '            ' + l.replace(/\s+$/, '') : ''); });
    }
    var args = [];
    if (trim(st.maxTurns)) args.push('--max-turns ' + trim(st.maxTurns));
    if (trim(st.model)) args.push('--model ' + trim(st.model));
    if (list(st.allowed).length) args.push('--allowedTools "' + list(st.allowed).join(',') + '"');
    if (args.length) { out.push('          claude_args: |'); args.forEach(function (a) { out.push('            ' + a); }); }
    return out.join('\n') + '\n';
  }

  var RULES = ['no-prompt', 'no-limit', 'bypass-unattended', 'bash-broad', 'rule-no-space', 'ps51-quotes', 'ps51-pipe', 'manual-no-allowed', 'bare-skill', 'bad-number',
    'wf-no-prompt', 'wf-prompt-no-tools', 'wf-github-token', 'wf-no-max-turns', 'wf-bad-cron',
    'paste-not-claude', 'paste-beta', 'paste-old-inputs', 'paste-literal-key', 'paste-no-id-token', 'paste-github-token', 'paste-no-if'];
  var ACTION = /\b(?:fix|edit|change|write|update|refactor|run|test|commit|create|delete|install|migrate|rename|remove)\w*\b/i;

  function check(st) {
    var out = [];
    function f(rule, where, detail) { out.push({ rule: rule, where: where, detail: detail }); }
    var allowed = list(st.allowed);
    if (st.mode === 'check') {
      var t = String(st.pasted || '');
      if (!t.trim()) return out;
      var uses = /anthropics\/claude-code-action/.test(t);
      if (!uses) f('paste-not-claude', 'workflow');
      var old = /anthropics\/claude-code-action@(?!v1\b)([\w.-]+)/.exec(t);
      if (old) f('paste-beta', 'workflow', '@' + old[1]);
      var inputs = t.match(/^\s+(?:mode|direct_prompt|override_prompt|custom_instructions|max_turns|model|allowed_tools|disallowed_tools)\s*:/gm);
      if (inputs) f('paste-old-inputs', 'workflow', inputs.map(function (x) { return x.trim().replace(/\s*:$/, ''); }).join(', '));
      if (/sk-ant-[\w-]{8,}/.test(t)) f('paste-literal-key', 'workflow');
      if (uses && !/id-token:\s*write/.test(t)) f('paste-no-id-token', 'workflow');
      if (/github_token:\s*\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}/.test(t)) f('paste-github-token', 'workflow');
      if (/\b(?:issue_comment|pull_request_review_comment)\b/.test(t) && !/contains\([^)]*['"]@claude/.test(t)) f('paste-no-if', 'workflow');
      return out;
    }
    if (st.mode === 'workflow') {
      if (st.trigger !== 'mention' && !trim(st.prompt)) f('wf-no-prompt', 'prompt');
      if (st.trigger !== 'mention' && trim(st.prompt) && !/^\s*\//.test(st.prompt) && !allowed.length) f('wf-prompt-no-tools', 'allowed');
      if (st.githubToken) f('wf-github-token', 'githubToken');
      if (!trim(st.maxTurns)) f('wf-no-max-turns', 'maxTurns');
      if (st.trigger === 'schedule' && trim(st.cron).split(/\s+/).length !== 5) f('wf-bad-cron', 'cron', trim(st.cron));
      if (trim(st.maxTurns) && !/^\d+$/.test(trim(st.maxTurns))) f('bad-number', 'maxTurns', trim(st.maxTurns));
      return out;
    }
    if (!trim(st.prompt)) f('no-prompt', 'prompt');
    if (!trim(st.maxTurns) && !trim(st.maxBudget)) f('no-limit', 'maxTurns');
    if (st.perm === 'bypassPermissions') f('bypass-unattended', 'perm');
    var broad = allowed.filter(function (a) { return /^(?:Bash|PowerShell)(?:\(\*\))?$/.test(a); });
    if (broad.length) f('bash-broad', 'allowed', broad.join(', '));
    var glued = allowed.filter(function (a) { var m = /^(?:Bash|PowerShell)\((.*)\)$/.exec(a); return m && m[1] !== '*' && /\S\*$/.test(m[1]); });
    if (glued.length) f('rule-no-space', 'allowed', glued.join(', '));
    if (st.shell === 'powershell' && /"/.test(st.prompt || '')) f('ps51-quotes', 'shell');
    if (st.shell === 'powershell' && trim(st.stdin)) f('ps51-pipe', 'shell');
    if ((st.perm === '' || st.perm === 'default') && !allowed.length && ACTION.test(st.prompt || '')) f('manual-no-allowed', 'perm');
    if (st.bare && /^\s*\//.test(st.prompt || '')) f('bare-skill', 'bare');
    var bad = [];
    if (trim(st.maxTurns) && !/^\d+$/.test(trim(st.maxTurns))) bad.push(trim(st.maxTurns));
    if (trim(st.maxBudget) && !/^\d+(?:\.\d+)?$/.test(trim(st.maxBudget))) bad.push(trim(st.maxBudget));
    if (bad.length) f('bad-number', 'maxTurns', bad.join(', '));
    return out;
  }

  var tool = U.tools[ID] = { EMPTY: EMPTY, rules: RULES, check: check, command: command, workflow: workflow, PRESETS: PRESETS, state: null };

  tool.render = function (root) {
    var st = tool.state = K.load(ID, EMPTY);
    var form = K.form(st, changed);
    var el = {
      mode: form.select('mode', MODES, { id: 'au-mode' }),
      prompt: form.textarea('prompt', { id: 'au-prompt', rows: 3, placeholder: 'What the run should do, and what it should return' }),
      stdin: form.input('stdin', { id: 'au-stdin', placeholder: 'git diff main...HEAD' }),
      shell: form.select('shell', SHELLS, { id: 'au-shell' }),
      perm: form.select('perm', PERMS, { id: 'au-perm' }),
      allowed: form.input('allowed', { id: 'au-allowed', placeholder: 'Read, Bash(git diff *), Bash(pnpm test *)' }),
      output: form.select('output', OUTPUTS, { id: 'au-output' }),
      maxTurns: form.input('maxTurns', { id: 'au-max-turns', inputmode: 'numeric', placeholder: '5' }),
      maxBudget: form.input('maxBudget', { id: 'au-max-budget', inputmode: 'decimal', placeholder: '0.50' }),
      model: form.input('model', { id: 'au-model', placeholder: 'sonnet (default: your usual model)' }),
      trigger: form.select('trigger', TRIGGERS, { id: 'au-trigger' }),
      cron: form.input('cron', { id: 'au-cron', placeholder: '0 9 * * 1-5' }),
      auth: form.select('auth', AUTHS, { id: 'au-auth' }),
      timeout: form.input('timeout', { id: 'au-timeout', inputmode: 'numeric', placeholder: '30' }),
      pasted: form.textarea('pasted', { id: 'au-pasted', rows: 14, spellcheck: 'false', placeholder: 'Paste a .github/workflows file that runs Claude' })
    };
    function box(key, id, text) {
      var c = h('input', { type: 'checkbox', id: id, onchange: function () { st[key] = c.checked; changed(); } });
      return { el: h('label', { class: 'au-check' }, c, ' ', text), fill: function () { c.checked = !!st[key]; } };
    }
    var bare = box('bare', 'au-bare', 'Bare mode (--bare): no hooks, skills, plugins, MCP or CLAUDE.md; needs ANTHROPIC_API_KEY');
    var ghToken = box('githubToken', 'au-github-token', 'Pass github_token: ${{ secrets.GITHUB_TOKEN }}');
    var checks = K.checksCard(ID, 'Nothing to fix: the run has a mode, the tools it needs, caps, and no secret in sight.', function (f) {
      var target = { prompt: el.prompt, maxTurns: el.maxTurns, perm: el.perm, allowed: el.allowed, shell: el.shell, bare: U.$('#au-bare'),
        githubToken: U.$('#au-github-token'), cron: el.cron, workflow: el.pasted }[f.where];
      if (target) K.focus(target);
    });
    var cmdOut = K.outputCard({ id: 'au-command-output', title: 'The command', copyId: 'au-copy',
      note: 'Run it from the repo. In a script, check the exit code; with JSON output, read result and is_error.' });
    var yamlPre = h('pre', { class: 'st-output', id: 'au-yaml-output' });
    var yamlCard = h('div', { class: 'card' },
      h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'claude.yml'), h('span', { class: 'spacer' }),
        h('button', { class: 'btn btn-small', id: 'au-download', type: 'button', onclick: function () { U.download('claude.yml', yamlPre.textContent, 'text/yaml'); } }, 'Download'),
        h('button', { class: 'btn btn-small btn-primary', id: 'au-yaml-copy', type: 'button', onclick: function () { U.copy(yamlPre.textContent); } }, 'Copy')),
      h('p', { class: 'faint', style: { margin: '6px 0 0' } }, 'Commit it as .github/workflows/claude.yml, after the Claude GitHub App and the secret are in place.'),
      yamlPre);

    var head = h('div', { class: 'au-section', 'data-modes': 'headless workflow' },
      K.field('au-prompt', 'Prompt', null, el.prompt));
    var headless = h('div', { class: 'au-section', 'data-modes': 'headless' },
      h('div', { class: 'field-row' },
        K.field('au-stdin', 'Pipe in (optional)', 'A command whose output Claude reads on stdin.', el.stdin),
        K.field('au-shell', 'Shell', null, el.shell)),
      h('div', { class: 'field-row' },
        K.field('au-perm', 'Permission mode', null, el.perm),
        K.field('au-output', 'Output', null, el.output)),
      h('div', { class: 'field-row' },
        K.field('au-max-budget', 'Max budget (USD)', 'Print mode only.', el.maxBudget),
        h('div', { class: 'field au-bare-field' }, bare.el)));
    var wf = h('div', { class: 'au-section', 'data-modes': 'workflow' },
      h('div', { class: 'field-row' },
        K.field('au-trigger', 'Runs on', 'On @claude mentions there is no prompt: the comment is the request.', el.trigger),
        K.field('au-cron', 'Cron (UTC)', 'minute hour day month weekday', el.cron)),
      h('div', { class: 'field-row' },
        K.field('au-timeout', 'Job timeout (minutes)', null, el.timeout),
        K.field('au-auth', 'Credential', null, el.auth)),
      ghToken.el);
    // the caps and the tools: on the command line, or in the workflow's claude_args
    var shared = h('div', { class: 'au-section', 'data-modes': 'headless workflow' },
      h('div', { class: 'field-row' },
        K.field('au-max-turns', 'Max turns', null, el.maxTurns),
        K.field('au-model', 'Model', null, el.model)),
      K.field('au-allowed', 'Allowed tools', 'Comma-separated, in permission rule syntax, with a space before each *.', el.allowed));
    var pasteSec = h('div', { class: 'au-section', 'data-modes': 'check' }, K.field('au-pasted', 'Your workflow', null, el.pasted));

    root.appendChild(h('div', { class: 'tool-layout' },
      h('div', { class: 'card' },
        h('div', { class: 'row st-samples' },
          h('button', { class: 'btn btn-small', id: 'au-preset-pr-summary', type: 'button', onclick: function () { load(PRESETS['pr-summary']); } }, 'A PR description from the diff'),
          h('button', { class: 'btn btn-small', id: 'au-preset-kit', type: 'button', onclick: function () { load(PRESETS.kit); } }, 'The kit\'s @claude workflow'),
          h('button', { class: 'btn btn-small', id: 'au-preset-daily', type: 'button', onclick: function () { load(PRESETS.daily); } }, 'A daily bug summary')),
        h('div', { class: 'row st-samples' },
          h('button', { class: 'btn btn-small', id: 'au-sample-weak', type: 'button', onclick: function () { load(SAMPLES.weak); } }, 'Example: a risky command'),
          h('button', { class: 'btn btn-small', id: 'au-sample-weak-workflow', type: 'button', onclick: function () { load(SAMPLES.weakWorkflow); } }, 'Example: a weak workflow'),
          h('button', { class: 'btn btn-small', id: 'au-sample-old', type: 'button', onclick: function () { load(SAMPLES.old); } }, 'Example: an old beta workflow'),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small btn-ghost', id: 'au-clear', type: 'button', onclick: function () { load(EMPTY); } }, 'Clear')),
        K.field('au-mode', 'What to build', null, el.mode),
        head, headless, wf, shared, pasteSec),
      h('div', { class: 'st-side' }, checks.el,
        h('div', { class: 'au-section', 'data-modes': 'headless' }, cmdOut.el),
        h('div', { class: 'au-section', 'data-modes': 'workflow' }, yamlCard))));

    function showMode() {
      U.$$('.au-section', root).forEach(function (s) { s.hidden = s.getAttribute('data-modes').split(' ').indexOf(st.mode) < 0; });
      // a workflow on @claude mentions has no prompt, and only a schedule has a cron line
      if (st.mode === 'workflow' && st.trigger === 'mention') head.hidden = true;
      el.cron.parentNode.hidden = st.trigger !== 'schedule';
    }
    function load(next) {
      K.replace(st, next);
      form.fill();
      bare.fill();
      ghToken.fill();
      changed();
    }
    function changed() {
      U.store.set('tool.' + ID, st);
      showMode();
      checks.show(check(st));
      cmdOut.set(command(st));
      yamlPre.textContent = workflow(st);
    }
    form.fill();
    bare.fill();
    ghToken.fill();
    changed();
  };
})(window.CLT);
