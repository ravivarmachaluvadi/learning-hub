/*
 * views/tools/delegate.js - the delegation planner (#/tools/delegate).
 *
 * The task, the person, why them, what "done" means and the deadline; how much they decide, as one
 * of the seven delegation levels (data/delegation.js), with a level suggested from their experience
 * of this kind of work, and a level of its own for any decision inside the task; check-ins at a
 * rhythm that fits their experience; help, and what to tell you straight away. The brief always
 * names the level and every check-in date.
 *
 * Check-ins: every k working days from the start (new to the work: every 2; some experience: once a
 * week; done it before: once, halfway), each strictly before the deadline, which is always the last
 * check-in. A start on a weekend counts from the Monday.
 *
 * Checks (data/tool-checks.js): a missing part, a vague outcome (the "delegate" wording rules in
 * data/lint-rules.js), a deadline before the start, no check-in before a deadline more than three
 * working days away, level 6 or 7 for someone new to the work, level 1 or 2 for someone who has done
 * it before, and no reason why them. Kept in "lelt.tool.delegate".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { task: '', who: '', why: '', outcome: '', start: '', deadline: '', experience: 'some', level: '', cadence: 'auto', decisions: [], help: '', tripwires: '' };
  var RULES = ['dl-missing', 'dl-vague-outcome', 'dl-deadline-past', 'dl-no-checkin', 'dl-level-high', 'dl-level-low', 'dl-no-why'];
  var EXPERIENCE = [['new', 'New to this kind of work'], ['some', 'Has done similar work'], ['done', 'Has done exactly this before']];
  var SUGGEST = { 'new': 3, some: 5, done: 6 };
  var AUTO = { 'new': '2', some: '5', done: 'mid' };
  var CADENCE = [['auto', 'Suggested for their experience'], ['1', 'Every working day'], ['2', 'Every two working days'], ['5', 'Once a week'],
    ['mid', 'Once, halfway'], ['end', 'Only at the deadline']];

  function str(v) { return String(v === undefined || v === null ? '' : v).trim(); }
  function lines(t) { return str(t).split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
  function first(name) { return str(name).split(/[\s(]/)[0]; }
  function level(n) { return (U.data.delegationLevels || [])[n - 1] || { n: n, name: '', means: '', say: '' }; }
  function levelText(n) { var l = level(n); return 'level ' + n + ' of 7, ' + l.name + '. ' + l.say; }

  /** The check-in days (YYYY-MM-DD) strictly between the start and the deadline. */
  function checkins(start, deadline, cadence) {
    var out = [];
    if (!deadline || deadline <= start || cadence === 'end') return out;
    if (cadence === 'mid') {
      var mid = P.addWorkdays(start, 1 + Math.floor((P.workdaysBetween(start, deadline) - 1) / 2));
      if (mid > start && mid < deadline) out.push(U.localDate(mid));
      return out;
    }
    var k = +cadence > 0 ? +cadence : 5;
    for (var i = 1; i <= 260; i++) {
      var d = P.addWorkdays(start, 1 + i * k);
      if (d >= deadline) break;
      out.push(U.localDate(d));
    }
    return out;
  }

  function compute(s) {
    var today = P.today(s), start = P.parseDay(s.start) || today, deadline = P.parseDay(s.deadline);
    var exp = SUGGEST[s.experience] ? s.experience : 'some', chosen = +s.level;
    var cadence = s.cadence && s.cadence !== 'auto' ? s.cadence : AUTO[exp];
    return {
      start: U.localDate(start), deadline: deadline ? U.localDate(deadline) : null,
      span: deadline && deadline >= start ? P.workdaysBetween(start, deadline) : 0,
      experience: exp, suggested: SUGGEST[exp], level: chosen >= 1 && chosen <= 7 ? chosen : SUGGEST[exp],
      cadence: cadence, checkins: checkins(start, deadline, cadence)
    };
  }

  function check(s) {
    var out = [], r = compute(s);
    [['task', 'The task'], ['who', 'Who'], ['outcome', 'Done means']].forEach(function (x) { if (!str(s[x[0]])) out.push({ rule: 'dl-missing', where: x[1], key: x[0] }); });
    if (!P.parseDay(s.deadline)) out.push({ rule: 'dl-missing', where: 'Deadline', key: 'deadline' });
    var hit = U.lint.find(s.outcome, (U.data.lintRules || {}).delegate || [])[0];
    if (hit) out.push({ rule: 'dl-vague-outcome', where: 'Done means', key: 'outcome', detail: hit.text, msg: hit.rule.msg, fix: hit.rule.fix });
    if (r.deadline && r.deadline < r.start) out.push({ rule: 'dl-deadline-past', where: 'Deadline', key: 'deadline' });
    if (r.span > 3 && !r.checkins.length) out.push({ rule: 'dl-no-checkin', where: 'Check-ins', key: 'cadence' });
    if (r.experience === 'new' && r.level >= 6) out.push({ rule: 'dl-level-high', where: 'Level ' + r.level, key: 'level' });
    if (r.experience === 'done' && r.level <= 2) out.push({ rule: 'dl-level-low', where: 'Level ' + r.level, key: 'level' });
    if (!str(s.why)) out.push({ rule: 'dl-no-why', where: 'Why them', key: 'why' });
    return out;
  }

  /** The brief for the person: the outcome, the date, the level, the decisions, the help and every check-in. */
  function brief(s) {
    var r = compute(s), name = first(s.who), deadline = P.parseDay(r.deadline), task = str(s.task) || '[the task]';
    var out = ['Hi' + (name ? ' ' + name : '') + ',', '', 'I would like you to own this: ' + task + (/[.!?]$/.test(task) ? '' : '.')];
    if (str(s.why)) out.push('Why you: ' + str(s.why));
    out.push('', 'Done means: ' + (str(s.outcome) || '[what is true when it is finished]'), 'Deadline: ' + (deadline ? P.day(deadline) : '[a day]') + '.');
    out.push('', 'How much you decide: ' + levelText(r.level));
    var ds = (s.decisions || []).filter(function (d) { return str(d.what); });
    if (ds.length) {
      out.push('Some decisions inside it work differently:');
      ds.forEach(function (d) { var n = +d.level >= 1 && +d.level <= 7 ? +d.level : r.level; out.push('- ' + str(d.what) + ': ' + levelText(n)); });
    }
    if (str(s.help)) out.push('', 'Help you can count on: ' + lines(s.help).join(' '));
    out.push('', r.checkins.length ? 'Check-ins, 15 minutes each, to look at it together:' : 'Check-ins: none before the deadline.');
    r.checkins.forEach(function (d) { out.push('- ' + P.day(P.parseDay(d))); });
    out.push('- ' + (deadline ? P.day(deadline) : '[the deadline]') + ': the deadline. We look at the result together.');
    var trips = lines(s.tripwires);
    if (trips.length === 1) out.push('', 'Tell me straight away if ' + trips[0].charAt(0).toLowerCase() + trips[0].slice(1).replace(/\.?$/, '.'));
    else if (trips.length) { out.push('', 'Tell me straight away if:'); trips.forEach(function (t) { out.push('- ' + t); }); }
    out.push('', 'Does this work for you? Tell me what is missing, or what you would change.');
    return out.join('\n');
  }

  function sample() {
    var today = P.today();
    return { task: 'Fix the GST totals on multi-state invoices', who: 'Anil',
      why: 'You want to learn the invoice service, and this bug is a contained way in.',
      outcome: 'Multi-state invoices total correctly, with tests, deployed to staging.',
      start: U.localDate(today), deadline: U.localDate(P.addWorkdays(today, 10)), experience: 'new', level: '5', cadence: 'auto',
      decisions: [{ what: 'How to fix it, and which tests to write', level: '6' }, { what: 'Changing the invoice format that customers see', level: '2' }],
      help: 'A 20-minute walkthrough of the invoice code today. Divya knows the GST rules for orders across states.',
      tripwires: 'The fix needs a change to the invoice format.\nYou are stuck for more than half a day.' };
  }

  U.tools.delegate = {
    EMPTY: EMPTY, rules: RULES, check: check, compute: compute, brief: brief, sample: sample, checkins: checkins,
    render: function (root) {
      var s = K.load('delegate', EMPTY);
      if (!Array.isArray(s.decisions)) s.decisions = [];
      var f = K.form(s, function () { refresh(); });
      var levels = h('div', { class: 'dl-levels', role: 'group', 'aria-label': 'Delegation level' });
      var means = h('p', { class: 'dl-level-means', id: 'dl-level-means' });
      var suggested = h('p', { class: 'faint dl-suggested', id: 'dl-suggested' });
      var useSuggested = h('button', { class: 'btn btn-small btn-ghost', id: 'dl-use-suggested', type: 'button', onclick: function () { s.level = ''; refresh(); } }, 'Use the suggestion');
      var list = h('ul', { class: 'dl-checkins', id: 'dl-checkins' });
      var decisions = K.rows({
        id: 'dl-decisions', noun: 'decision', list: function () { return s.decisions; }, changed: function () { refresh(); },
        blank: function () { return { what: '', level: '3' }; },
        cols: [
          { key: 'what', label: 'Decision', type: 'textarea', rows: 1, ph: 'Changing the invoice format that customers see', size: '3fr' },
          { key: 'level', label: 'Level', type: 'select', options: (U.data.delegationLevels || []).map(function (l) { return [String(l.n), l.n + ' · ' + l.name]; }), size: '1.3fr' }
        ]
      });
      var checks = K.checksCard('delegate', 'A clear result, a level that fits their experience, and check-ins agreed up front.', function (x) {
        K.focus(x.key === 'level' ? U.$('.dl-level.selected') : U.$('#dl-' + x.key));
      });
      var out = K.outputCard({ id: 'dl-output', title: 'The brief', note: 'Talk it through with them first; send this afterwards, so you both have the same version.',
        prompt: function (text) {
          return 'I am a lead engineer delegating a piece of work to someone on my team. Here is my brief. ' +
            'Check that the outcome is clear and testable, that the authority level fits someone with this experience, and that the check-ins support without micromanaging. ' +
            'Suggest what is missing, and how they might hear it.\n\n' + text;
        } });

      root.appendChild(h('div', { class: 'tool-layout' },
        h('div', { class: 'card st-form' },
          K.samples([['dl-sample', 'Load the example', function () { K.replace(s, sample()); f.fill(); decisions.draw(); refresh(); }]],
            'dl-clear', function () { K.replace(s, EMPTY); f.fill(); decisions.draw(); refresh(); }),
          K.field('dl-task', 'The task', null, f.input('task', { id: 'dl-task', placeholder: 'Fix the GST totals on multi-state invoices' })),
          h('div', { class: 'field-row' },
            K.field('dl-who', 'Who', null, f.input('who', { id: 'dl-who', placeholder: 'Anil' })),
            K.field('dl-experience', 'Their experience of this work', null, f.select('experience', EXPERIENCE, { id: 'dl-experience' }))),
          K.field('dl-why', 'Why them', 'Written to them: what they will learn, or why they are the right person', f.input('why', { id: 'dl-why', placeholder: 'You want to learn the invoice service, and this is a contained way in.' })),
          K.field('dl-outcome', 'Done means', 'What is true when it is finished, so both of you can tell', f.textarea('outcome', { id: 'dl-outcome', rows: 2, placeholder: 'Multi-state invoices total correctly, with tests, deployed to staging.' })),
          h('div', { class: 'field-row' },
            K.field('dl-start', 'Starts', 'Today if empty', f.input('start', { id: 'dl-start', type: 'date' })),
            K.field('dl-deadline', 'Deadline', null, f.input('deadline', { id: 'dl-deadline', type: 'date' }))),
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'How much they decide'), levels, means, h('div', { class: 'row' }, suggested, useSuggested)),
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Decisions inside it at a different level (optional)'), decisions.el),
          K.field('dl-cadence', 'Check-ins', null, f.select('cadence', CADENCE, { id: 'dl-cadence' })),
          K.field('dl-help', 'Help you will give', 'Optional: a walkthrough, a person to ask, a document', f.textarea('help', { id: 'dl-help', rows: 2, placeholder: 'A 20-minute walkthrough of the invoice code today.' })),
          K.field('dl-tripwires', 'Tell me straight away if', 'Optional, one per line: the moments you want to hear about at once', f.textarea('tripwires', { id: 'dl-tripwires', rows: 2, placeholder: 'The fix needs a change to the invoice format.' }))),
        h('div', { class: 'st-side' },
          checks.el,
          h('div', { class: 'card' }, h('h2', null, 'Check-ins'), list),
          out.el)));
      root.appendChild(guide());

      function drawLevels(r) {
        levels.innerHTML = '';
        (U.data.delegationLevels || []).forEach(function (l) {
          levels.appendChild(h('button', { class: 'dl-level' + (l.n === r.level ? ' selected' : '') + (l.n === r.suggested ? ' suggested' : ''), type: 'button',
            'data-n': String(l.n), 'aria-pressed': l.n === r.level ? 'true' : 'false', title: l.means,
            onclick: function () { s.level = String(l.n); refresh(); } }, h('b', null, String(l.n)), h('span', null, l.name)));
        });
        var l = level(r.level);
        means.innerHTML = '';
        means.appendChild(h('b', null, 'Level ' + r.level + ', ' + l.name + ': '));
        means.appendChild(document.createTextNode(l.means));
        var exp = EXPERIENCE.filter(function (x) { return x[0] === r.experience; })[0];
        suggested.textContent = 'Suggested for someone who ' + { 'new': 'is new to this kind of work', some: 'has done similar work', done: 'has done exactly this before' }[r.experience] +
          ': level ' + r.suggested + ', ' + level(r.suggested).name + '.' + (exp && +s.level && +s.level !== r.suggested ? ' You chose level ' + r.level + '.' : '');
        useSuggested.hidden = !(+s.level && +s.level !== r.suggested);
      }

      function refresh() {
        U.store.set('tool.delegate', s);
        var r = compute(s);
        drawLevels(r);
        list.innerHTML = '';
        r.checkins.forEach(function (d) { list.appendChild(h('li', { 'data-date': d }, h('b', null, P.day(P.parseDay(d))), h('span', { class: 'faint' }, ' · 15 minutes'))); });
        list.appendChild(h('li', { 'data-date': r.deadline || '', class: 'dl-deadline' }, h('b', null, r.deadline ? P.day(P.parseDay(r.deadline)) : 'The deadline'),
          h('span', { class: 'faint' }, ' · the deadline: look at the result together')));
        checks.show(check(s));
        out.set(brief(s));
      }

      f.fill();
      refresh();
    }
  };

  function guide() {
    return U.section('How to delegate without hovering or rescuing', h('div', { html: U.md([
      '1. **Hand over a result, not an activity.** "Look into the GST bug" never finishes; "multi-state invoices total correctly, with tests" does.',
      '2. **Say how much they decide.** Most delegation fails on an unspoken level: they think it is theirs, you think they should have asked. Appelo\'s seven levels give it a name.',
      '3. **Match the level to their experience of this task**, not to how senior they are. Raise it as they show they can.',
      '4. **Agree the check-ins up front.** A check-in you both planned is support; one you call because you got nervous feels like distrust.',
      '5. **Do not take it back** when it gets hard. Ask what they need instead.',
      '',
      'More in [[lesson:delegation-levels]] and [[explainer:situational-leadership]]; practise it in [[scenario:doing-it-myself]] and [[scenario:delegated-task-wrong]].'
    ].join('\n')) }), false);
  }
})(window.LELT);
