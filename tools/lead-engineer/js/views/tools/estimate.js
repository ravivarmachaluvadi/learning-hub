/*
 * views/tools/estimate.js - the estimation workbench (#/tools/estimate).
 *
 * Break the work into tasks, give each three numbers in days of focused work (optimistic, most
 * likely, pessimistic), include the work people forget (reviews, testing, release, meetings,
 * waiting on other teams), say how many people work on it and how much of their day they really
 * have (the focus factor). The tool then
 *
 *   - works out the PERT expected value for each task and the total (the hand method);
 *   - runs 10,000 simulated projects with a fixed seed (js/plan.js) and reads off P50 (half the
 *     simulated projects finished by then) and P85, as working days and as dates;
 *   - writes a message with the range, what it includes, the assumptions and how it will narrow.
 *
 * Waiting on others is calendar time that more people don't shorten, so it is added after the work
 * is shared out. The draft is kept in "lelt.tool.estimate"; the deadline negotiator can read it.
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var KINDS = [['build', 'Build (code)'], ['review', 'Review and rework'], ['test', 'Testing'], ['deploy', 'Release and deployment'],
    ['meet', 'Meetings, coordination'], ['wait', 'Waiting on others']];
  var WORDS = { build: 'coding', review: 'reviews and rework', test: 'testing', deploy: 'release and deployment', meet: 'meetings',
    wait: 'waiting on other teams' };
  var FORGOTTEN = [
    { kind: 'review', name: 'Code review and rework' },
    { kind: 'test', name: 'Testing: integration and regression' },
    { kind: 'deploy', name: 'Release: deployment, smoke tests, release notes' },
    { kind: 'meet', name: 'Meetings and coordination' },
    { kind: 'wait', name: 'Waiting on another team (name it)' }
  ];
  var SEED = 42, TRIALS = 10000;

  var EMPTY = { feature: '', start: '', people: '3', focus: '0.6', tasks: [], assumptions: '', narrow: '' };

  function nextMonday() {
    var d = new Date();
    while (d.getDay() !== 1) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return U.localDate(d);
  }
  function task(name, kind, o, m, p) { return { name: name, kind: kind, o: o, m: m, p: p }; }

  var SAMPLES = {
    strong: function () {
      return {
        feature: 'Customer refunds', start: nextMonday(), people: '3', focus: '0.6',
        tasks: [
          task('Refund API and ledger entries', 'build', 4, 6, 10),
          task('Bank refund integration', 'build', 3, 5, 12),
          task('Admin refund screen', 'build', 2, 3, 5),
          task('Code review and rework', 'review', 2, 3, 5),
          task('Testing: integration and regression', 'test', 3, 4, 7),
          task('Release and deployment', 'deploy', 1, 1, 2),
          task('Meetings and coordination', 'meet', 2, 3, 4),
          task('Security team review', 'wait', 2, 3, 6),
          task('Bank sandbox access', 'wait', 2, 3, 8)
        ],
        assumptions: 'Sameer, Divya and Arjun work on refunds and nothing else\nThe bank gives us sandbox access within a week of asking\n' +
          'Finance does not change the refund rules after signing them off\nThe security team can review in week 3',
        narrow: 'A 2-day spike on the bank\'s refund API this week: it is the widest part (3 to 12 days). After it, the range should shrink to about a week.'
      };
    },
    weak: function () {
      return { feature: 'Loyalty points', start: nextMonday(), people: '2', focus: '0.9',
        tasks: [task('Backend', 'build', 15, 15, 15), task('UI', 'build', 5, 5, 5)], assumptions: '', narrow: '' };
    }
  };

  /* ---------- arithmetic ---------- */

  function named(s) { return (s.tasks || []).filter(function (t) { return String(t.name || '').trim(); }); }
  function nums(t) { return { o: P.num(t.o), m: P.num(t.m), p: P.num(t.p) }; }
  function usable(t) { var n = nums(t); return isFinite(n.o) && isFinite(n.m) && isFinite(n.p) && n.o >= 0 && n.o <= n.m && n.m <= n.p; }
  function people(s) { var n = P.num(s.people); return n > 0 ? n : 1; }
  function focus(s) { var f = P.num(s.focus); return f > 0 ? Math.min(1, f) : 1; }

  /** Everything the screen shows: PERT, the simulation, the dates, the widest task. */
  function compute(s) {
    var ok = named(s).filter(usable).map(function (t) { var n = nums(t); return { name: t.name.trim(), kind: t.kind || 'build', o: n.o, m: n.m, p: n.p }; });
    var ppl = people(s), f = focus(s);
    var work = P.pertTotal(ok.filter(function (t) { return t.kind !== 'wait'; }));
    var wait = P.pertTotal(ok.filter(function (t) { return t.kind === 'wait'; }));
    var start = P.parseDay(s.start) || P.today();
    var sim = ok.length ? P.simulate(ok, { seed: SEED, trials: TRIALS, people: ppl, focus: f }) : null;
    var widest = ok.slice().sort(function (a, b) { return (b.p - b.o) - (a.p - a.o); })[0] || null;
    return {
      tasks: ok, people: ppl, focus: f, start: start, widest: widest,
      pert: { work: work, wait: wait, days: ok.length ? work.mean / (ppl * f) + wait.mean : NaN },
      sim: sim,
      p50Date: sim ? P.addWorkdays(start, Math.ceil(sim.p50)) : null,
      p85Date: sim ? P.addWorkdays(start, Math.ceil(sim.p85)) : null
    };
  }

  var RULES = ['no-tasks', 'task-no-numbers', 'task-order', 'single-point', 'huge-task', 'coding-only', 'focus-high', 'no-assumptions'];

  /** What to fix: [{rule, where, task}] (the messages are in data/tool-checks.js). */
  function check(s) {
    var out = [], tasks = named(s);
    if (!tasks.length) out.push({ rule: 'no-tasks', where: 'Tasks' });
    (s.tasks || []).forEach(function (t, i) {
      if (!String(t.name || '').trim()) return;
      var n = nums(t), where = 'Task ' + (i + 1);
      if (!isFinite(n.o) || !isFinite(n.m) || !isFinite(n.p)) out.push({ rule: 'task-no-numbers', where: where, task: i });
      else if (!(n.o >= 0 && n.o <= n.m && n.m <= n.p)) out.push({ rule: 'task-order', where: where, task: i });
      else {
        if (n.o === n.p && n.m >= 2) out.push({ rule: 'single-point', where: where, task: i });
        if (n.m > 10) out.push({ rule: 'huge-task', where: where, task: i });
      }
    });
    if (tasks.length && tasks.every(function (t) { return (t.kind || 'build') === 'build'; })) out.push({ rule: 'coding-only', where: 'Tasks' });
    if (focus(s) > 0.8) out.push({ rule: 'focus-high', where: 'Focus' });
    if (tasks.length && !String(s.assumptions || '').trim()) out.push({ rule: 'no-assumptions', where: 'Assumptions' });
    return out;
  }

  function lines(text) { return String(text || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }

  /** The message to send: the range as dates, what it includes, the assumptions, how it will narrow. */
  function message(s, r) {
    if (!r.sim) return 'Add at least one task with three numbers (optimistic, likely, pessimistic) to get an estimate.';
    var out = [], kinds = [];
    KINDS.forEach(function (k) { if (r.tasks.some(function (t) { return t.kind === k[0]; })) kinds.push(WORDS[k[0]]); });
    out.push((String(s.feature || '').trim() || 'This work') + ': estimate');
    out.push('Most likely done by ' + P.day(r.p50Date) + ' (a 50% chance); I would plan on ' + P.day(r.p85Date) + ' (an 85% chance).');
    out.push('That is ' + Math.ceil(r.sim.p50) + ' to ' + Math.ceil(r.sim.p85) + ' working days from ' + P.day(r.start) + ', with ' +
      U.plural(r.people, 'developer') + ' spending about ' + Math.round(r.focus * 100) + '% of their day on it.');
    out.push('It includes ' + (kinds.length > 1 ? kinds.slice(0, -1).join(', ') + ' and ' + kinds[kinds.length - 1] : kinds[0]) + '.');
    var as = lines(s.assumptions);
    if (as.length) { out.push('', 'Assumptions:'); as.forEach(function (a) { out.push('- ' + a); }); }
    out.push('', 'How it will narrow:');
    var narrow = String(s.narrow || '').trim();
    if (narrow) out.push(narrow);
    else if (r.widest) out.push('The widest part is ' + r.widest.name + ' (' + r.widest.o + ' to ' + r.widest.p + ' days). A short spike on it is the quickest way to narrow the range.');
    if (!U.lint.hasDate(narrow)) out.push('I will send a narrower range by ' + P.day(P.addWorkdays(r.start, 5)) + '.');
    return out.join('\n');
  }

  function claudePrompt(s, text) {
    return 'I am a lead engineer. Below is my estimate breakdown and the message I plan to send to my manager. Please check: ' +
      '1) is any work missing (reviews, testing, release, meetings, waiting on other teams, on-call)? 2) does any number look optimistic? ' +
      '3) will a non-engineer understand the message, and what follow-up question will they ask?\n\nTasks (optimistic / likely / pessimistic, in days of focused work):\n' +
      named(s).map(function (t) { return '- ' + t.name + ' [' + t.kind + ']: ' + t.o + ' / ' + t.m + ' / ' + t.p; }).join('\n') +
      '\n\nDevelopers: ' + s.people + ', focus factor: ' + s.focus + '\n\nMessage:\n' + text;
  }

  /* ---------- the screen ---------- */

  U.tools.estimate = {
    EMPTY: EMPTY, rules: RULES, compute: compute, check: check, message: message,
    render: function (root) {
      var s = K.load('estimate', EMPTY);
      if (!s.start) s.start = U.localDate(new Date());
      var f = K.form(s, changed);
      var focusOut = h('b', { class: 'es-focus-val' });
      var taskList = K.rows({
        id: 'es-tasks', noun: 'task', list: function () { return s.tasks; }, changed: changed,
        blank: function () { return task('', 'build', '', '', ''); },
        cols: [
          { key: 'name', label: 'Task', type: 'textarea', rows: 1, ph: 'What has to be done', size: '2fr' },
          { key: 'kind', label: 'Kind', type: 'select', options: KINDS, size: '2.6fr' },
          { key: 'o', label: 'Best', type: 'number', ph: 'days', size: '.65fr' },
          { key: 'm', label: 'Likely', type: 'number', ph: 'days', size: '.65fr' },
          { key: 'p', label: 'Worst', type: 'number', ph: 'days', size: '.65fr' }
        ],
        extra: h('button', { class: 'btn btn-small', id: 'es-add-forgotten', type: 'button', onclick: addForgotten }, '+ Add the work people forget')
      });
      var checks = K.checksCard('estimate', 'No warnings. The estimate has ranges, the work people forget, and its assumptions.', function (x) {
        K.focus(x.task !== undefined ? K.cell('es-tasks', x.task, 'name') : { Focus: U.$('#es-focus'), Assumptions: U.$('#es-assumptions') }[x.where] || U.$('#es-tasks-add'));
      });
      var result = h('div', { class: 'es-result' });
      var output = K.outputCard({ id: 'es-output', title: 'Your message', prompt: function (text) { return claudePrompt(s, text); },
        note: 'Paste it into chat or email. The dates count working days (Monday to Friday) and ignore public holidays.' });
      var pertBox = h('div');

      var form = h('div', { class: 'card st-form' },
        K.samples([['es-sample-weak', 'Load a weak example', function () { load(SAMPLES.weak()); }],
          ['es-sample-strong', 'Load a strong example', function () { load(SAMPLES.strong()); }]], 'es-clear', function () { load(Object.assign(K.clone(EMPTY), { start: U.localDate(new Date()) })); }),
        K.field('es-feature', 'What are you estimating?', null, f.input('feature', { id: 'es-feature', placeholder: 'Customer refunds' })),
        h('div', { class: 'field-row three' },
          K.field('es-start', 'Work starts', null, f.input('start', { id: 'es-start', type: 'date' })),
          K.field('es-people', 'Developers on it', null, f.input('people', { id: 'es-people', inputmode: 'decimal' })),
          h('div', { class: 'field' }, h('label', { for: 'es-focus' }, 'Focus: ', focusOut),
            f.input('focus', { id: 'es-focus', type: 'range', min: '0.3', max: '1', step: '0.05', class: 'range' }),
            h('small', { class: 'faint' }, 'The share of a day spent on this work, after meetings, reviews for others and support'))),
        h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Tasks'),
          h('small', { class: 'faint' }, 'Days of focused work for one person: best case, most likely, worst case. Waiting is calendar days.'),
          taskList.el),
        K.field('es-assumptions', 'Assumptions', 'One per line: what has to stay true for these numbers to hold',
          f.textarea('assumptions', { id: 'es-assumptions', rows: 3, placeholder: 'Three developers on this and nothing else' })),
        K.field('es-narrow', 'How it will narrow', 'What you will do to make the range smaller, and when (left empty, the tool names the widest task)',
          f.textarea('narrow', { id: 'es-narrow', rows: 2, placeholder: 'A 2-day spike on the bank API this week' })));
      root.appendChild(h('div', { class: 'tool-layout' }, form, h('div', { class: 'st-side' }, checks.el,
        h('div', { class: 'card' }, h('h2', null, 'The estimate'), result), output.el)));
      root.appendChild(U.section('How the numbers are worked out', pertBox, false));

      function addForgotten() {
        var have = s.tasks.map(function (t) { return t.kind; });
        FORGOTTEN.forEach(function (x) { if (have.indexOf(x.kind) < 0) s.tasks.push(task(x.name, x.kind, '', '', '')); });
        taskList.draw();
        changed();
      }
      function load(next) { K.replace(s, next); f.fill(); taskList.draw(); changed(); }

      function changed() {
        U.store.set('tool.estimate', s);
        focusOut.textContent = Math.round(focus(s) * 100) + '%';
        checks.show(check(s));
        var r = compute(s);
        drawResult(r);
        drawPert(r);
        output.set(message(s, r));
      }

      function drawResult(r) {
        result.innerHTML = '';
        if (!r.sim) { result.appendChild(h('p', { class: 'muted' }, 'Add tasks with three numbers each, and the range appears here.')); return; }
        result.appendChild(h('div', { class: 'es-tiles' },
          h('div', { class: 'stat' }, h('span', null, 'P50: half the time by'), h('b', { id: 'es-p50-date' }, P.day(r.p50Date)),
            h('span', null, h('span', { id: 'es-p50-days' }, P.fixed(r.sim.p50)), ' working days')),
          h('div', { class: 'stat' }, h('span', null, 'P85: plan on'), h('b', { id: 'es-p85-date' }, P.day(r.p85Date)),
            h('span', null, h('span', { id: 'es-p85-days' }, P.fixed(r.sim.p85)), ' working days'))));
        result.appendChild(K.histogram(r.sim.days, r.sim.p50, r.sim.p85, 'days', 'es-hist', K.chartWidth(result)));
        result.appendChild(h('p', { class: 'faint', style: { margin: '6px 0 0' } },
          TRIALS.toLocaleString('en-IN') + ' simulated projects (seed ' + SEED + '). PERT, the hand method, gives ', h('b', { id: 'es-pert-days' }, P.fixed(r.pert.days)),
          ' working days: the middle of the range, before the long tail of things going wrong. See ', h('a', { href: '#/explain/monte-carlo' }, 'a Monte Carlo estimate'), '.'));
      }

      function drawPert(r) {
        pertBox.innerHTML = '';
        pertBox.appendChild(h('div', { html: U.md([
          'Each task has three numbers: best case **O**, most likely **M**, worst case **P**. PERT, a method from the 1950s, turns them into an expected value **(O + 4M + P) / 6** and a spread **(P − O) / 6**.',
          'The work is shared between the developers and slowed by the focus factor: **days = work ÷ (developers × focus) + waiting**. Waiting is added on top because more people don\'t make another team faster.',
          'The simulation then plays the project ' + TRIALS.toLocaleString('en-IN') + ' times, drawing each task from a curve between O and P that peaks at M, and reads off the day by which 50% (P50) and 85% (P85) of the simulated projects finished. A fixed seed makes it repeatable: the same tasks always give the same answer.'
        ].join('\n\n')) }));
        if (!r.tasks.length) return;
        pertBox.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table es-pert' },
          h('thead', null, h('tr', null, ['Task', 'O / M / P', 'PERT', 'Spread'].map(function (x) { return h('th', null, x); }))),
          h('tbody', null, r.tasks.map(function (t) {
            var x = P.pert(t.o, t.m, t.p);
            return h('tr', null, h('td', null, t.name, t.kind === 'wait' ? h('span', { class: 'faint' }, ' (waiting)') : null),
              h('td', null, t.o + ' / ' + t.m + ' / ' + t.p), h('td', null, P.fixed(x.mean, 2)), h('td', null, '± ' + P.fixed(x.sd, 2)));
          }),
          h('tr', { class: 'es-total' }, h('td', null, 'Work, in days of focused work'), h('td'), h('td', null, P.fixed(r.pert.work.mean, 2)), h('td', null, '± ' + P.fixed(r.pert.work.sd, 2))),
          h('tr', { class: 'es-total' }, h('td', null, 'Waiting, in calendar days'), h('td'), h('td', null, P.fixed(r.pert.wait.mean, 2)), h('td', null, '± ' + P.fixed(r.pert.wait.sd, 2))),
          h('tr', { class: 'es-total' }, h('td', null, 'Working days: ' + P.fixed(r.pert.work.mean, 2) + ' ÷ (' + r.people + ' × ' + r.focus + ') + ' + P.fixed(r.pert.wait.mean, 2)),
            h('td'), h('td', null, P.fixed(r.pert.days, 2)), h('td'))))));
      }

      f.fill();
      changed();
    }
  };
})(window.LELT);
