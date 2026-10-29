/*
 * tools/claudemd.js - the CLAUDE.md builder and checker (#/tools/claudemd).
 *
 * Build: fill in the commands, layout and rules (or start from the TypeScript or Rust preset) and get
 * a short project CLAUDE.md in the shape the docs recommend. Check: paste an existing CLAUDE.md.
 * Either way the text is checked two ways:
 *   - wording: vague rules, secrets, and "every time" instructions that belong in a hook, marked in
 *     the text (data/lint-rules.js, the "claudemd" set);
 *   - shape: over 200 lines, no test command, style rules a formatter already enforces, too much
 *     emphasis, dense paragraphs, a file-by-file tour (data/tool-checks.js, "claudemd").
 * HTML comments are left out of both, because Claude Code strips them before Claude sees the file.
 * The draft is kept in "clt.tool.claudemd".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit;
  var ID = 'claudemd';
  var LINE_LIMIT = 200, PARAGRAPH_LIMIT = 300, EMPHASIS_LIMIT = 3, PATH_BULLET_LIMIT = 12;

  var EMPTY = { mode: 'build', name: '', purpose: '', install: '', build: '', test: '', testOne: '', lint: '', typecheck: '', format: '', run: '',
    layout: '', conventions: '', never: '', gotchas: '', imports: '', compact: 'yes', pasted: '' };

  var PRESETS = {
    typescript: { mode: 'build', name: 'orders-web', purpose: 'The customer-facing order pages: Next.js and TypeScript, calling orders-api over REST.',
      install: 'pnpm install', build: 'pnpm build', test: 'pnpm test', testOne: 'pnpm vitest run src/cart/cart.test.ts', lint: 'pnpm lint',
      typecheck: 'pnpm tsc --noEmit', format: 'pnpm prettier --write .', run: 'pnpm dev',
      layout: '`src/app/`: Next.js routes, one folder per page\n`src/api/`: the client for orders-api; every request goes through `src/api/client.ts`\n`src/components/`: shared UI; page-only components stay next to their page',
      conventions: 'Server components by default; add "use client" only for interactive parts\nData fetching only in server components, through `src/api/client.ts`\nAPI errors are `ApiError` (`src/api/errors.ts`), shown with `<ErrorBanner>`\nTests sit next to the code: `cart.ts` and `cart.test.ts`',
      never: 'Never edit `src/api/generated/`; run `pnpm codegen` when the OpenAPI spec changes\nNever commit `.env.local`',
      gotchas: 'The e2e tests (`pnpm e2e`) need orders-api running on http://localhost:8080\nNode 20 and pnpm 9 are required (see `packageManager` in package.json)',
      imports: 'docs/architecture.md', compact: 'yes', pasted: '' },
    rust: { mode: 'build', name: 'orders-api', purpose: 'The order service: Rust (axum and sqlx) over Postgres, serving REST to orders-web.',
      install: '', build: 'cargo build --workspace', test: 'cargo test --workspace', testOne: 'cargo test -p orders-api cart::tests',
      lint: 'cargo clippy --workspace --all-targets -- -D warnings', typecheck: 'cargo check --workspace', format: 'cargo fmt --all', run: 'cargo run -p orders-api',
      layout: '`crates/orders-api/`: the HTTP service; axum routes in `src/routes/`\n`crates/orders-core/`: domain types and rules; no I/O\n`migrations/`: sqlx migrations, applied with `sqlx migrate run`',
      conventions: 'Errors: `thiserror` enums in library crates, `anyhow` only in binaries and tests\nHandlers return `Result<Json<T>, ApiError>`; errors are mapped in `crates/orders-api/src/error.rs`\nDatabase access only through the repositories in `orders_core::repo`\nNew endpoints get an integration test in `crates/orders-api/tests/`',
      never: 'No `unwrap()` or `expect()` outside tests\nNever edit a migration that is merged; add a new one',
      gotchas: 'Tests need Postgres: run `docker compose up -d db` first (`DATABASE_URL` is in `.env`)\nsqlx checks queries at compile time: after changing SQL, run `cargo sqlx prepare`',
      imports: 'docs/architecture.md', compact: 'yes', pasted: '' }
  };

  var WEAK = [
    '# Project',
    '',
    'IMPORTANT: Always write clean code and follow best practices.',
    'IMPORTANT: Be careful with the database.',
    'IMPORTANT: NEVER commit to main.',
    'IMPORTANT: Use 2-space indentation and single quotes.',
    'MUST: Keep files organized and make sure everything works properly.',
    '',
    'We use prettier and eslint. This project is a web application for managing customer orders that was built over several years by several teams, ' +
      'with a frontend in React and a backend in Node and a Postgres database, and many parts of it are old while some are new, so you should look around a lot ' +
      'before you change anything and add tests where appropriate.',
    '',
    'API key for staging: sk-ant-api03-AbCdEfGh1234567890',
    '',
    '## Files',
    '- `src/index.ts`: entry point', '- `src/app.ts`: the app', '- `src/routes.ts`: routes', '- `src/db.ts`: the database', '- `src/auth.ts`: login',
    '- `src/cart.ts`: the cart', '- `src/orders.ts`: orders', '- `src/payments.ts`: payments', '- `src/email.ts`: emails', '- `src/logger.ts`: logging',
    '- `src/config.ts`: configuration', '- `src/utils.ts`: helpers', '- `src/types.ts`: types'
  ].join('\n');
  var SAMPLES = { weak: Object.assign({}, EMPTY, { mode: 'check', pasted: WEAK }) };

  function trim(s) { return String(s || '').trim(); }
  function bullets(s) {
    return String(s || '').split('\n').map(function (l) { return l.replace(/^\s*[-*]\s+/, '').trim(); }).filter(Boolean).map(function (l) { return '- ' + l; });
  }
  function formatterOf(cmd) {
    if (/prettier/.test(cmd)) return 'prettier';
    if (/cargo fmt|rustfmt/.test(cmd)) return 'rustfmt';
    if (/biome/.test(cmd)) return 'biome';
    if (/\bruff\b/.test(cmd)) return 'ruff';
    if (/\bblack\b/.test(cmd)) return 'black';
    return 'the formatter';
  }

  /** The CLAUDE.md the build fields describe. */
  function generate(st) {
    var out = ['# ' + (trim(st.name) || '<project name>'), ''];
    if (trim(st.purpose)) out.push(trim(st.purpose), '');
    var cmds = [];
    function cmd(label, v, note) { if (trim(v)) cmds.push('- ' + label + ': `' + trim(v) + '`' + (note ? ' (' + note + ')' : '')); }
    cmd('Install', st.install);
    cmd('Build', st.build);
    cmd('Test everything', st.test);
    cmd('One test', st.testOne, 'prefer this while working');
    cmd('Lint', st.lint);
    cmd('Type check', st.typecheck, 'run after a series of changes');
    cmd('Format', st.format, formatterOf(st.format) + ' owns formatting; do not hand-format');
    cmd('Run locally', st.run);
    if (cmds.length) out = out.concat(['## Commands'], cmds, ['']);
    [['Layout', st.layout], ['Conventions', st.conventions], ['Never', st.never], ['Gotchas', st.gotchas]].forEach(function (s) {
      var b = bullets(s[1]);
      if (b.length) out = out.concat(['## ' + s[0]], b, ['']);
    });
    var imports = String(st.imports || '').split('\n').map(function (l) { return l.replace(/^\s*[-*]?\s*@?/, '').trim(); }).filter(Boolean);
    if (imports.length) out = out.concat(['## More context'], imports.map(function (p) { return '- @' + p; }), ['']);
    if (st.compact !== 'no') out.push('# Compact instructions', 'When compacting, keep: the current task and its done-means, failing test names, files changed, open questions.', '');
    return out.join('\n');
  }

  /** The text being checked: the generated file, or the pasted one. */
  function text(st) { return st.mode === 'check' ? String(st.pasted || '') : generate(st); }

  /** The text Claude sees: HTML comments are stripped before it reaches Claude. */
  function stripComments(t) { return String(t || '').replace(/<!--[\s\S]*?-->/g, ''); }
  /** Lines outside fenced code blocks. */
  function outsideCode(t) {
    var inFence = false;
    return t.split('\n').filter(function (l) {
      if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; return false; }
      return !inFence;
    });
  }

  var TEST_CMD = /\b(?:(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test|vitest|jest|playwright\s+test|cargo\s+(?:test|nextest)|pytest|go\s+test|dotnet\s+test|mvn\s+test|gradlew?\s+test|make\s+test|deno\s+test|nx\s+test)\b/i;
  var FORMATTER = /\b(?:prettier|eslint|biome|rustfmt|cargo\s+fmt|clippy|black|ruff|gofmt|dprint|stylelint)\b/i;
  var STYLE = /\b(?:\d+[- ]space|tabs? (?:for|not|instead|over)|indent(?:ation|ing)? (?:with|of|by)|semicolons?|single quotes|double quotes|trailing commas?|max(?:imum)? line length|lines? (?:under|shorter than|no longer than|at most) \d+ (?:characters|chars|columns)|import order|sort(?:ed)? imports|brace style)\b/i;
  var EMPHASIS = /\b(?:IMPORTANT|MUST|NEVER|ALWAYS|CRITICAL)\b/;
  var PATH_BULLET = /^\s*[-*]\s+`?[\w@.-]+(?:\/[\w@.[\]-]+)*\.[A-Za-z0-9]{1,6}`?\s*(?::|—|–|-\s)/;
  var LIST_OR_HEAD = /^\s*(?:#|[-*+]\s|\d+[.)]\s|\||>)/;

  var RULES = ['no-name', 'too-long', 'no-test-command', 'formatter-style', 'too-much-emphasis', 'dense-paragraph', 'file-by-file'];

  function check(st) {
    var out = [];
    if (st.mode !== 'check' && !trim(st.name)) out.push({ rule: 'no-name' });
    var raw = text(st);
    if (st.mode === 'check' && !raw.trim()) return out;
    var all = stripComments(raw), lines = all.split('\n'), prose = outsideCode(all);
    if (lines.length > LINE_LIMIT) out.push({ rule: 'too-long', detail: lines.length + ' lines' });
    if (!TEST_CMD.test(all)) out.push({ rule: 'no-test-command' });
    if (FORMATTER.test(all)) {
      var styled = prose.filter(function (l) { return STYLE.test(l); })[0];
      if (styled) out.push({ rule: 'formatter-style', detail: styled.trim() });
    }
    var loud = prose.filter(function (l) { return EMPHASIS.test(l); });
    if (loud.length > EMPHASIS_LIMIT) out.push({ rule: 'too-much-emphasis', detail: loud.length + ' lines' });
    var dense = prose.filter(function (l) { return l.trim().length > PARAGRAPH_LIMIT && !LIST_OR_HEAD.test(l); })[0];
    if (dense) out.push({ rule: 'dense-paragraph', detail: dense.trim().slice(0, 60) + '…' });
    var tour = prose.filter(function (l) { return PATH_BULLET.test(l); });
    if (tour.length > PATH_BULLET_LIMIT) out.push({ rule: 'file-by-file', detail: tour.length + ' lines' });
    return out;
  }

  /** The wording findings, leaving out anything inside an HTML comment. */
  function wording(t) {
    var rules = (U.data.lintRules || {})[ID] || [], hidden = [], re = /<!--[\s\S]*?-->/g, m;
    while ((m = re.exec(t))) hidden.push([m.index, m.index + m[0].length]);
    return U.lint.find(t, rules).filter(function (x) { return !hidden.some(function (r) { return x.start >= r[0] && x.end <= r[1]; }); });
  }

  function compute(st) {
    var t = text(st);
    return { lines: t ? t.split('\n').length : 0, words: t.split(/\s+/).filter(Boolean).length, phrases: wording(t).length };
  }

  /** The prompt that asks Claude to review the file against the docs. */
  function prompt(st) {
    var t = text(st), rules = (U.data.toolChecks || {})[ID] || [];
    var found = check(st).map(function (f) {
      var r = rules.filter(function (x) { return x.id === f.rule; })[0];
      return r ? '- ' + r.msg + (f.detail ? ' (' + f.detail + ')' : '') : null;
    }).filter(Boolean);
    var seen = {}, words = [];
    wording(t).forEach(function (x) { if (!seen[x.rule.id]) { seen[x.rule.id] = true; words.push('- "' + x.text + '": ' + x.rule.msg); } });
    return [
      'Review this CLAUDE.md against the official guidance (code.claude.com/docs/en/best-practices and /memory).',
      'Keep it under 200 lines. Keep only what you cannot work out from the code: commands, conventions that differ from the defaults, gotchas. ' +
        'Make each rule concrete enough to check. No secrets. No style rules the formatter or linter already enforces. ' +
        'Move rules that matter for one kind of file into .claude/rules/ with paths frontmatter, and multi-step procedures into skills.',
      'First list what to cut and why, then what is missing, then show the new file. Ask me before you write down a command you cannot find in the repo.',
      found.length ? '\nThe checker found:\n' + found.join('\n') : '',
      words.length ? '\nWording to fix:\n' + words.join('\n') : '',
      '',
      'CLAUDE.md:',
      t.trim()
    ].filter(function (x, i, all) { return x !== '' || all[i - 1] !== ''; }).join('\n');
  }

  var tool = U.tools[ID] = { EMPTY: EMPTY, PRESETS: PRESETS, rules: RULES, check: check, compute: compute, text: text, generate: generate, prompt: prompt, state: null };

  tool.render = function (root) {
    var st = tool.state = K.load(ID, EMPTY);
    var form = K.form(st, changed);
    var el = {
      mode: form.select('mode', [['build', 'Build one from fields'], ['check', 'Check one I paste']], { id: 'cm-mode' }),
      name: form.input('name', { id: 'cm-name', placeholder: 'orders-web' }),
      purpose: form.input('purpose', { id: 'cm-purpose', placeholder: 'What the repo is, in one line' }),
      install: form.input('install', { id: 'cm-install', placeholder: 'pnpm install' }),
      build: form.input('build', { id: 'cm-build', placeholder: 'pnpm build' }),
      test: form.input('test', { id: 'cm-test', placeholder: 'pnpm test' }),
      testOne: form.input('testOne', { id: 'cm-testone', placeholder: 'pnpm vitest run <file>' }),
      lint: form.input('lint', { id: 'cm-lint-cmd', placeholder: 'pnpm lint' }),
      typecheck: form.input('typecheck', { id: 'cm-typecheck', placeholder: 'pnpm tsc --noEmit' }),
      format: form.input('format', { id: 'cm-format', placeholder: 'pnpm prettier --write .' }),
      run: form.input('run', { id: 'cm-run', placeholder: 'pnpm dev' }),
      layout: form.textarea('layout', { id: 'cm-layout', rows: 3, placeholder: 'One folder per line: `src/api/`: the client for the backend' }),
      conventions: form.textarea('conventions', { id: 'cm-conventions', rows: 4, placeholder: 'Rules that differ from the defaults, one per line' }),
      never: form.textarea('never', { id: 'cm-never', rows: 2, placeholder: 'Never edit `src/api/generated/`' }),
      gotchas: form.textarea('gotchas', { id: 'cm-gotchas', rows: 2, placeholder: 'What is not obvious: a service that must run, a version' }),
      imports: form.textarea('imports', { id: 'cm-imports', rows: 2, placeholder: 'docs/architecture.md (one path per line)' }),
      compact: form.select('compact', [['yes', 'Yes'], ['no', 'No']], { id: 'cm-compact' }),
      pasted: form.textarea('pasted', { id: 'cm-paste', rows: 16, placeholder: 'Paste your CLAUDE.md here. Nothing leaves this browser.' })
    };
    var marked = h('div', { class: 'st-check-out cm-marked', id: 'cm-marked' });
    var lintList = h('ul', { class: 'st-findings', id: 'cm-lint' });
    var stats = h('div', { class: 'cr-stats', id: 'cm-stats' });
    var checks = K.checksCard(ID, 'The shape is right: short, with commands, no noise.', function (f) {
      if (st.mode === 'check') return K.focus(el.pasted);
      K.focus(f.rule === 'no-name' ? el.name : f.rule === 'no-test-command' ? el.test : el.conventions);
    });
    var outPre = h('pre', { class: 'st-output', id: 'cm-output' });
    var promptOut = K.outputCard({ id: 'cm-prompt-output', title: 'Ask Claude to review it', copyId: 'cm-prompt-copy',
      note: 'Paste this into Claude in the repo: it checks the file against the code and the docs\' guidance.' });

    var buildBox = h('div', { class: 'cm-build' },
      K.field('cm-name', 'Project name', null, el.name),
      K.field('cm-purpose', 'What it is', null, el.purpose),
      h('div', { class: 'field-label' }, 'Commands'),
      h('p', { class: 'faint', style: { margin: '2px 0 8px' } }, 'The ones Claude cannot guess. Leave out what the repo does not have.'),
      h('div', { class: 'field-row' }, K.field('cm-install', 'Install', null, el.install), K.field('cm-build', 'Build', null, el.build)),
      h('div', { class: 'field-row' }, K.field('cm-test', 'Test everything', null, el.test), K.field('cm-testone', 'One test', null, el.testOne)),
      h('div', { class: 'field-row' }, K.field('cm-lint-cmd', 'Lint', null, el.lint), K.field('cm-typecheck', 'Type check', null, el.typecheck)),
      h('div', { class: 'field-row' }, K.field('cm-format', 'Format', 'The formatter owns style; no style rules needed.', el.format), K.field('cm-run', 'Run locally', null, el.run)),
      K.field('cm-layout', 'Layout', 'Only folders Claude would otherwise search for. No file-by-file tour.', el.layout),
      K.field('cm-conventions', 'Conventions', 'Each one concrete enough to check.', el.conventions),
      K.field('cm-never', 'Never', null, el.never),
      K.field('cm-gotchas', 'Gotchas', null, el.gotchas),
      h('div', { class: 'field-row' }, K.field('cm-imports', 'Import (@path)', 'They load in full: organisation, not savings.', el.imports),
        K.field('cm-compact', 'Compact instructions', 'What every compaction keeps.', el.compact)));
    var checkBox = h('div', { class: 'cm-check' }, K.field('cm-paste', 'Your CLAUDE.md', 'Comments (<!-- -->) are skipped, as Claude Code strips them.', el.pasted));

    root.appendChild(h('div', { class: 'tool-layout' },
      h('div', { class: 'card' },
        K.samples([['cm-preset-typescript', 'Preset: TypeScript', function () { load(PRESETS.typescript); }],
          ['cm-preset-rust', 'Preset: Rust', function () { load(PRESETS.rust); }],
          ['cm-sample-weak', 'Example: a weak CLAUDE.md', function () { load(SAMPLES.weak); }]], 'cm-clear', function () { load(EMPTY); }),
        K.field('cm-mode', 'What to do', null, el.mode),
        buildBox, checkBox,
        h('h2', null, 'The file, checked'),
        h('p', { class: 'faint', style: { margin: '0 0 6px' } }, 'Wording to fix is marked; hover a mark to see why.'),
        marked),
      h('div', { class: 'st-side' },
        h('div', { class: 'card' }, h('h2', null, 'Size'), stats),
        checks.el,
        h('div', { class: 'card' }, h('h2', null, 'Wording'), lintList),
        h('div', { class: 'card' },
          h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'CLAUDE.md'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small', id: 'cm-download', type: 'button', onclick: function () { U.download('CLAUDE.md', outPre.textContent, 'text/markdown'); } }, 'Download'),
            h('button', { class: 'btn btn-small btn-primary', id: 'cm-copy', type: 'button', onclick: function () { U.copy(outPre.textContent); } }, 'Copy')),
          h('p', { class: 'faint', style: { margin: '6px 0 0' } }, 'Save it in the repo root and commit it. Under 200 lines; trim what Claude can read from the code.'),
          outPre),
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
      var t = text(st), hits = wording(t), c = compute(st);
      marked.innerHTML = t.trim() ? U.lint.highlight(t, hits) : '<span class="faint">Your CLAUDE.md appears here, with the wording to fix marked.</span>';
      stats.innerHTML = '';
      stats.appendChild(stat('lines', c.lines, 'lines (aim: under ' + LINE_LIMIT + ')', c.lines > LINE_LIMIT));
      stats.appendChild(stat('phrases', c.phrases, 'phrases to fix', c.phrases > 0));
      checks.show(check(st));
      lintList.innerHTML = '';
      var seen = {};
      hits.forEach(function (x) {
        if (seen[x.rule.id]) return;
        seen[x.rule.id] = true;
        lintList.appendChild(h('li', { 'data-rule': x.rule.id },
          h('mark', { class: 'lint-mark' }, x.text), ' ', h('span', null, x.rule.msg), h('span', { class: 'st-fix' }, x.rule.fix)));
      });
      if (!hits.length) lintList.appendChild(h('li', { class: 'st-ok' }, t.trim() ? '✓ No vague rules, secrets or hook-shaped instructions.' : 'Nothing to check yet.'));
      outPre.textContent = t;
      promptOut.set(t.trim() ? prompt(st) : '');
    }
    form.fill();
    changed();
  };
})(window.CLT);
