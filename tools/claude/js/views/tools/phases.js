/*
 * tools/phases.js - the phase planner (#/tools/phases).
 *
 * Enter the feature, the test command and the phases (what each delivers, what proves it is done).
 * The planner writes ROADMAP.md in the shape the /phase-* skills read, plus, for every phase, the
 * prompt to start it in a fresh session and the prompt to close it before /clear. The draft is kept
 * in "clt.tool.phases".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit;
  var ID = 'phases';
  var MAX_PHASES = 8;

  function blank() { return { name: '', delivers: '', done: '' }; }
  var EMPTY = { feature: '', goal: '', prd: '', repos: '', test: '', phases: [blank(), blank(), blank()] };

  var SAMPLES = {
    strong: { feature: 'Saved search', goal: 'Let users save a search and re-run it from the sidebar.', prd: 'docs/prd-saved-search.md (PRD-142)',
      repos: 'web-app (TypeScript), search-api (Rust)', test: 'pnpm test && cargo test -p search-api',
      phases: [
        { name: 'Save one search end to end', delivers: 'API to save a query (search-api); Save button on the results page and the sidebar list (web-app)',
          done: 'cargo test -p search-api passes with the new save and list tests; a Playwright test saves a search and sees it in the sidebar' },
        { name: 'Re-run and rename', delivers: 'Clicking a saved search re-runs it; rename inline',
          done: 'Playwright test re-runs and renames a saved search; the API returns 404 for another user\'s search' },
        { name: 'Limits and errors', delivers: 'At most 50 saved searches per user; clear error messages; an empty state',
          done: 'The API returns 409 on the 51st save; tests cover empty, duplicate and over-limit cases' },
        { name: 'Hardening and release', delivers: 'Feature flag, metrics and docs',
          done: 'Flag off by default; the dashboard shows saves per day; docs/saved-search.md merged' }] },
    weak: { feature: 'Saved search', goal: '', prd: '', repos: '', test: '',
      phases: [
        { name: 'Setup', delivers: 'Project setup and research', done: 'Everything set up' },
        { name: 'Build it', delivers: 'The whole feature', done: '' },
        { name: 'Polish', delivers: 'Fix bugs', done: 'Users are happy' }] }
  };

  // a "done means" someone can check names a test, a command, a result or a number
  var VERIFIABLE = /\b(?:tests?|pass(?:es|ing)?|green|runs?|returns?|shows?|screenshot|curl|command|merged|deployed|responds?|logs?|ci|cargo|npm|pnpm|yarn|pytest|playwright|vitest|jest|status|http)\b|\d/i;
  var SETUP = /\b(?:set ?up|scaffold(?:ing)?|boilerplate|research|investigat\w*|explor\w*|analysis|spike|skeleton|infrastructure|config(?:uration)?)\b/i;
  var USABLE = /\b(?:end[- ]to[- ]end|works?|working|usable|users? can|thin slice|slice|demo)\b/i;

  function trim(s) { return String(s || '').trim(); }
  function named(st) { return (st.phases || []).filter(function (p) { return trim(p.name); }); }
  function cell(s) { return trim(s).replace(/\|/g, '\\|').replace(/\n+/g, ' '); }
  function testCmd(st) { return trim(st.test) ? '`' + trim(st.test) + '`' : 'the tests'; }

  /** ROADMAP.md for the plan. */
  function roadmap(st) {
    var ps = named(st), feature = trim(st.feature) || '<feature>';
    var out = ['# Roadmap: ' + feature, ''];
    if (trim(st.goal)) out.push(trim(st.goal), '');
    if (trim(st.prd)) out.push('- PRD: ' + trim(st.prd));
    if (trim(st.repos)) out.push('- Repos: ' + trim(st.repos));
    if (trim(st.prd) || trim(st.repos)) out.push('');
    out.push('Each phase runs in a fresh Claude Code session (/clear first), so every session stays short. To start a phase, say: ' +
      '"Build phase N of ' + feature + '; read ROADMAP.md first." or type /phase-next.', '');
    out.push('| Phase | What it delivers | Status |', '|---|---|---|');
    ps.forEach(function (p, i) { out.push('| ' + (i + 1) + ' ' + cell(p.name) + ' | ' + cell(p.delivers) + ' | planned |'); });
    ps.forEach(function (p, i) {
      out.push('', '## Phase ' + (i + 1) + ': ' + trim(p.name), '', '**Delivers:** ' + trim(p.delivers), '', '**Done means:** ' + trim(p.done));
    });
    out.push('', '## Decisions and open questions', '', '- (add decisions here as they are made, with who made them)', '',
      '## How every phase is done', '',
      '1. Read this file; restate the phase\'s "done means"; plan it and wait for approval.',
      '2. Write the tests first and watch them fail.',
      '3. Build until they pass; run ' + testCmd(st) + '.',
      '4. Update this file: mark the phase done and add "What phase N delivered" (built, changed from the plan, not checked).',
      '5. Commit following the repo\'s conventions, then /clear before the next phase.', '');
    return out.join('\n');
  }

  /** The prompt that starts phase n (1-based) in a fresh session. */
  function startPrompt(st, n) {
    var ps = named(st), p = ps[n - 1], feature = trim(st.feature) || '<feature>';
    return 'Build phase ' + n + ' of ' + feature + ': ' + trim(p.name) + '. Read ROADMAP.md first (and README.md and HANDOFF.md if they exist).\n' +
      'Done means: ' + trim(p.done) + '\n' +
      'Plan this phase and wait for my approval. Then write the tests first and show them failing, and build until they pass. ' +
      'Run ' + testCmd(st) + ' and show me the real output. ' +
      (n < ps.length ? 'Do not start phase ' + (n + 1) + '.' : 'This is the last phase.');
  }

  /** The prompt that closes phase n before /clear. */
  function closePrompt(st, n) {
    var ps = named(st), p = ps[n - 1];
    var lines = ['Phase ' + n + ' (' + trim(p.name) + ') is finished. Run ' + testCmd(st) + ', show me the real summary lines, ' +
      'and for each part of the "done means" name the test or output that proves it.',
      'Then update ROADMAP.md: mark phase ' + n + ' done and add "What phase ' + n + ' delivered" (built, changed from the plan, not checked). ' +
      'Commit as "Phase ' + n + ': ' + trim(p.name) + '".'];
    if (n < ps.length) lines.push('Finally print the exact prompt to start phase ' + (n + 1) + ' (' + trim(ps[n].name) + ') in a fresh session. I will /rename and /clear before pasting it.');
    else lines.push('This was the last phase: say so, and draft the pull request description instead of a next-phase prompt.');
    return lines.join('\n');
  }

  var RULES = ['no-feature', 'too-few-phases', 'too-many-phases', 'phase-no-delivers', 'phase-no-done', 'done-not-verifiable', 'first-only-setup', 'no-test-command'];

  function check(st) {
    var out = [], ps = named(st);
    if (!trim(st.feature)) out.push({ rule: 'no-feature', where: 'feature' });
    if (ps.length < 2) out.push({ rule: 'too-few-phases', where: 'phases' });
    if (ps.length > MAX_PHASES) out.push({ rule: 'too-many-phases', where: 'phases' });
    ps.forEach(function (p, i) {
      var where = 'Phase ' + (i + 1);
      if (!trim(p.delivers)) out.push({ rule: 'phase-no-delivers', where: where });
      if (!trim(p.done)) out.push({ rule: 'phase-no-done', where: where });
      else if (!VERIFIABLE.test(p.done)) out.push({ rule: 'done-not-verifiable', where: where, detail: trim(p.done) });
    });
    if (ps.length && SETUP.test(ps[0].name + ' ' + ps[0].delivers) && !USABLE.test(ps[0].name + ' ' + ps[0].delivers)) out.push({ rule: 'first-only-setup', where: 'Phase 1' });
    if (!trim(st.test)) out.push({ rule: 'no-test-command', where: 'test' });
    return out;
  }

  var tool = U.tools[ID] = { EMPTY: EMPTY, rules: RULES, check: check, roadmap: roadmap, startPrompt: startPrompt, closePrompt: closePrompt, state: null };

  tool.render = function (root) {
    var st = tool.state = K.load(ID, EMPTY);
    var form = K.form(st, changed);
    var el = {
      feature: form.input('feature', { id: 'pp-feature', placeholder: 'Saved search' }),
      goal: form.textarea('goal', { id: 'pp-goal', rows: 2, placeholder: 'The goal in one or two lines' }),
      prd: form.input('prd', { id: 'pp-prd', placeholder: 'docs/prd-saved-search.md or a ticket link' }),
      repos: form.input('repos', { id: 'pp-repos', placeholder: 'web-app (TypeScript), search-api (Rust)' }),
      test: form.input('test', { id: 'pp-test', placeholder: 'pnpm test && cargo test --workspace' })
    };
    var rows = K.rows({ id: 'pp-rows', noun: 'phase', list: function () { return st.phases; }, blank: blank, changed: changed, cols: [
      { key: 'name', label: 'Phase', ph: 'Save one search end to end' },
      { key: 'delivers', label: 'What it delivers', type: 'textarea', full: true, ph: 'What a user or a test can see when it is done' },
      { key: 'done', label: 'Done means', type: 'textarea', full: true, ph: 'A test, a command or a result that proves it' }] });
    var checks = K.checksCard(ID, 'Every phase is usable and provable, and there is a test command.', function (f) {
      if (el[f.where]) K.focus(el[f.where]);
      else if (/^Phase (\d+)$/.test(f.where || '')) {
        var i = st.phases.indexOf(named(st)[+/\d+/.exec(f.where)[0] - 1]);
        K.focus(K.cell('pp-rows', i, f.rule === 'phase-no-delivers' ? 'delivers' : f.rule === 'first-only-setup' ? 'name' : 'done'));
      }
    });
    var roadPre = h('pre', { class: 'st-output', id: 'pp-roadmap-output' });
    var prompts = h('div', { id: 'pp-prompts', class: 'pp-prompts' });

    root.appendChild(h('div', { class: 'tool-layout' },
      h('div', { class: 'card' },
        K.samples([['pp-sample-strong', 'Example: a good plan', function () { load(SAMPLES.strong); }],
          ['pp-sample-weak', 'Example: a weak plan', function () { load(SAMPLES.weak); }]], 'pp-clear', function () { load(EMPTY); }),
        K.field('pp-feature', 'Feature', null, el.feature),
        K.field('pp-goal', 'Goal', null, el.goal),
        h('div', { class: 'field-row' },
          K.field('pp-prd', 'PRD or ticket', null, el.prd),
          K.field('pp-repos', 'Repos', null, el.repos)),
        K.field('pp-test', 'Test command', 'The command every phase must pass.', el.test),
        h('div', { class: 'field-label' }, 'Phases'),
        h('p', { class: 'faint', style: { margin: '2px 0 8px' } }, '3 to 6 is usual. Each one leaves something usable and fits in one session.'),
        rows.el),
      h('div', { class: 'st-side' },
        checks.el,
        h('div', { class: 'card' },
          h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'ROADMAP.md'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small', id: 'pp-download', type: 'button', onclick: function () { U.download('ROADMAP.md', roadPre.textContent, 'text/markdown'); } }, 'Download'),
            h('button', { class: 'btn btn-small btn-primary', id: 'pp-roadmap-copy', type: 'button', onclick: function () { U.copy(roadPre.textContent); } }, 'Copy')),
          h('p', { class: 'faint', style: { margin: '6px 0 0' } }, 'Save it in the repo root and commit it: it is what the next session reads.'),
          roadPre))));
    root.appendChild(h('h2', null, 'The prompt for each phase'));
    root.appendChild(h('p', { class: 'muted' }, 'Start each phase in a fresh session with its start prompt. When it is done, paste its close prompt, then /rename and /clear. ' +
      'With the kit installed, /phase-next and /phase-close do the same.'));
    root.appendChild(prompts);

    function promptCard(n) {
      var p = named(st)[n - 1];
      var start = startPrompt(st, n), close = closePrompt(st, n);
      return h('section', { class: 'card pp-prompt', 'data-phase': n },
        h('h3', null, 'Phase ' + n + ': ' + trim(p.name)),
        h('div', { class: 'row' }, h('span', { class: 'ph-label' }, 'Start (in a fresh session)'), h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small pp-copy-start', type: 'button', onclick: function () { U.copy(start); } }, 'Copy')),
        h('pre', { class: 'st-output pp-start' }, start),
        h('div', { class: 'row' }, h('span', { class: 'ph-label' }, 'Close (before /clear)'), h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small pp-copy-close', type: 'button', onclick: function () { U.copy(close); } }, 'Copy')),
        h('pre', { class: 'st-output pp-close' }, close));
    }

    function load(next) {
      K.replace(st, next);
      form.fill();
      rows.draw();
      changed();
    }
    function changed() {
      U.store.set('tool.' + ID, st);
      checks.show(check(st));
      roadPre.textContent = roadmap(st);
      prompts.innerHTML = '';
      var n = named(st).length;
      if (!n) prompts.appendChild(h('p', { class: 'faint' }, 'Name a phase to see its prompts.'));
      for (var i = 1; i <= n; i++) prompts.appendChild(promptCard(i));
    }
    form.fill();
    changed();
  };
})(window.CLT);
