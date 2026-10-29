/*
 * views/tools/plan90.js - the 30-60-90 day plan builder (#/tools/plan90).
 *
 * The start date (day 1) gives each phase its days: 1 to 30, 31 to 60 and 61 to 90. Each phase ends
 * with a review with your manager on its last day, moved back to the Friday before when that is a
 * weekend, so it stays inside the phase. Items come from the bank in data/plan90.js or are your own;
 * each has a kind (learn, people, deliver, improve), what "done" means, and a tick.
 *
 * Checks (data/tool-checks.js): no start date, no manager, a phase with nothing in it, more than six
 * items in a phase, an item with no "done means" or one that describes activity (the "delegate"
 * wording rules: "look into", "work on", "improve"), and days 1 to 30 with nothing to learn or
 * nothing about the people.
 *
 * Kept in "lelt.tool.plan90": {start, role, manager, p1, p2, p3: [{what, kind, measure, done, from}]}.
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { start: '', role: '', manager: '', p1: [], p2: [], p3: [] };
  var RULES = ['p9-no-start', 'p9-no-manager', 'p9-empty-phase', 'p9-too-many', 'p9-no-measure', 'p9-vague', 'p9-learn-first', 'p9-people-first'];
  var MAX = 6;
  var PHASES = [
    { n: 1, title: 'Days 1 to 30', focus: 'Learn and meet', hint: 'Listen before you change: the people, the system, the work. One early win, chosen with the team.', kind: 'learn' },
    { n: 2, title: 'Days 31 to 60', focus: 'Contribute', hint: 'Deliver the early win, set your rhythms, and start handing over what only you know.', kind: 'deliver' },
    { n: 3, title: 'Days 61 to 90', focus: 'Lead', hint: 'Own the plan for next quarter, grow each person, and make the team\'s results visible.', kind: 'deliver' }
  ];

  function str(v) { return String(v === undefined || v === null ? '' : v).trim(); }
  function list(s, n) { return Array.isArray(s['p' + n]) ? s['p' + n] : []; }
  function itemsOf(s, n) { return list(s, n).filter(function (x) { return x && (str(x.what) || str(x.measure)); }); }
  function kinds() { return (U.data.plan90Kinds || []).map(function (k) { return [k.id, k.title]; }); }
  function kindTitle(id) { var k = (U.data.plan90Kinds || []).filter(function (x) { return x.id === id; })[0]; return k ? k.title : id; }
  function phaseName(n) { return PHASES[n - 1].title; }

  /** The last day of a phase, moved back to the Friday before when it falls on a weekend. */
  function review(d) { while (!P.isWorkday(d)) d = P.plusDays(d, -1); return d; }

  function compute(s) {
    var start = P.parseDay(s.start), total = 0, done = 0;
    var phases = PHASES.map(function (ph) {
      var from = start ? P.plusDays(start, 30 * (ph.n - 1)) : null, to = start ? P.plusDays(start, 30 * ph.n - 1) : null;
      var items = itemsOf(s, ph.n);
      total += items.length;
      done += items.filter(function (x) { return x.done; }).length;
      return { n: ph.n, from: from ? U.localDate(from) : '', to: to ? U.localDate(to) : '', review: to ? U.localDate(review(to)) : '',
        items: items.length, done: items.filter(function (x) { return x.done; }).length };
    });
    return { phases: phases, reviews: phases.map(function (p) { return p.review; }), items: total, done: done };
  }

  function check(s) {
    var out = [], rules = (U.data.lintRules || {}).delegate || [];
    if (!P.parseDay(s.start)) out.push({ rule: 'p9-no-start', where: 'Start date', key: 'start' });
    if (!str(s.manager)) out.push({ rule: 'p9-no-manager', where: 'Your manager', key: 'manager' });
    PHASES.forEach(function (ph) {
      var items = itemsOf(s, ph.n);
      if (!items.length) out.push({ rule: 'p9-empty-phase', where: ph.title, key: 'p' + ph.n });
      if (items.length > MAX) out.push({ rule: 'p9-too-many', where: ph.title + ': ' + items.length + ' items', key: 'p' + ph.n });
      list(s, ph.n).forEach(function (x, i) {
        if (!x || (!str(x.what) && !str(x.measure))) return;
        if (!str(x.measure)) out.push({ rule: 'p9-no-measure', where: ph.title + ': ' + (str(x.what) || 'item ' + (i + 1)), key: 'p' + ph.n, row: i });
        U.lint.find(x.measure, rules).forEach(function (f) {
          out.push({ rule: 'p9-vague', where: ph.title + ': ' + (str(x.what) || 'item ' + (i + 1)), key: 'p' + ph.n, row: i, detail: f.text });
        });
      });
    });
    var first = itemsOf(s, 1);
    if (first.length && !first.some(function (x) { return x.kind === 'learn'; })) out.push({ rule: 'p9-learn-first', where: phaseName(1), key: 'p1' });
    if (first.length && !first.some(function (x) { return x.kind === 'people'; })) out.push({ rule: 'p9-people-first', where: phaseName(1), key: 'p1' });
    return out;
  }

  function day(iso) { var d = P.parseDay(iso); return d ? P.day(d) : ''; }
  function first(name) { return str(name).split(/[\s(,]/)[0]; }

  /** "Mon 2 Nov to Tue 1 Dec · review with Priya on the last day" (or on the Friday it moved to). */
  function span(x, who) {
    return day(x.from) + ' to ' + day(x.to) + ' · review with ' + who + (x.review === x.to ? ' on the last day' : ' on ' + day(x.review));
  }

  /** The plan, in Markdown, with a checklist per phase. */
  function compose(s) {
    var c = compute(s), start = P.parseDay(s.start), who = str(s.manager);
    var head = ['# 30-60-90 day plan' + (str(s.role) ? ': ' + str(s.role) : ''),
      (start ? 'Starting ' + P.day(start) + ' ' + start.getFullYear() : 'Starting [the day you start as lead]') + ' · Manager: ' + (who || '[your manager]')];
    PHASES.forEach(function (ph, k) {
      var x = c.phases[k], items = itemsOf(s, ph.n);
      head.push('', '## ' + ph.title + ': ' + ph.focus.toLowerCase(),
        x.from ? span(x, first(who) || 'your manager') : '[Dates once the start date is set]');
      if (!items.length) head.push('- [ ] [What you will do, and what "done" means]');
      items.forEach(function (it) {
        head.push('- [' + (it.done ? 'x' : ' ') + '] ' + (str(it.what) || '[What you will do]') + ' (' + kindTitle(it.kind) + '). Done means: ' + (str(it.measure) || '[how you will both know it is done]'));
      });
    });
    return head.join('\n');
  }

  /** The message asking your manager to agree the plan. */
  function message(s) {
    var c = compute(s), who = first(s.manager);
    var lines = ['Hi ' + (who || '[your manager]') + ',', '',
      'Here is my plan for my first 90 days' + (str(s.role) ? ' as ' + str(s.role) : ' as lead') + '. I would like to agree it with you in our next 1:1, and to check it with you at three points:'];
    var why = ['what I have learned, and the early win I have picked', 'what I have changed, and how delivery is going', 'the results, and the goals for the next 90 days'];
    PHASES.forEach(function (ph, k) { lines.push('- ' + (day(c.phases[k].review) || '[date]') + ' (day ' + (30 * ph.n) + '): ' + why[k]); });
    lines.push('');
    PHASES.forEach(function (ph) {
      var items = itemsOf(s, ph.n);
      lines.push('By day ' + (30 * ph.n) + ': ' + (items.length ? items.map(function (x) { return str(x.what); }).filter(Boolean).join('; ') : '[what you will have done]') + '.');
    });
    lines.push('', 'What would you add or change? And what would make you say, at day 90, that this went well?');
    return lines.join('\n');
  }

  function blank(n) { return { what: '', kind: PHASES[n - 1].kind, measure: '', done: false }; }
  function fromBank(b) { return { what: b.what, kind: b.kind, measure: b.measure, done: false, from: b.id }; }

  function sample() {
    var bank = U.data.plan90Bank || [];
    function pick(ids) { return ids.map(function (id) { return fromBank(bank.filter(function (b) { return b.id === id; })[0]); }); }
    return { start: U.localDate(P.addWorkdays(P.today(), 1)), role: 'lead of the Payments team', manager: 'Priya',
      p1: pick(['p1-oneonones', 'p1-manager-success', 'p1-architecture', 'p1-incidents', 'p1-pick-win']),
      p2: pick(['p2-early-win', 'p2-status-rhythm', 'p2-delegate', 'p2-release']),
      p3: pick(['p3-plan', 'p3-outcome-note', 'p3-growth', 'p3-review']) };
  }

  U.tools.plan90 = {
    EMPTY: EMPTY, rules: RULES, check: check, compute: compute, compose: compose, message: message, sample: sample,
    render: function (root) {
      var s = K.load('plan90', EMPTY);
      [1, 2, 3].forEach(function (n) { if (!Array.isArray(s['p' + n])) s['p' + n] = []; });
      var f = K.form(s, function () { refresh(); });
      var editors = {}, dates = {}, banks = {};
      var checks = K.checksCard('plan90', 'A plan your manager can agree: learning first, a result for every item, and a review at each step.', function (x) {
        if (x.key === 'start' || x.key === 'manager') return K.focus(U.$('#p9-' + x.key));
        var id = 'p9-items-' + x.key.slice(1);
        K.focus(x.row !== undefined ? K.cell(id, x.row, 'measure') : (U.$('#' + id + ' input') || U.$('#' + id + '-add')));
      });
      var progress = h('p', { class: 'p9-progress', id: 'p9-progress' });
      var out = K.outputCard({ id: 'p9-output', title: 'The plan', note: 'Markdown with a checklist: keep it where you and your manager can both see it.',
        prompt: function (text) {
          return 'I am a new lead engineer (recently promoted from senior engineer). Here is my 30-60-90 day plan. ' +
            'Check that the first 30 days are about learning and people rather than changes, that every item has a result I could check, ' +
            'and that the plan is small enough to finish. Suggest what to add, cut or reword, and one question to ask my manager about it.\n\n' + text;
        } });
      var msg = K.outputCard({ id: 'p9-message-output', copyId: 'p9-message-copy', title: 'The message to your manager', note: 'Send it before your next 1:1, with the plan attached.' });

      var phaseBoxes = PHASES.map(function (ph) {
        var n = ph.n;
        editors[n] = K.rows({
          id: 'p9-items-' + n, noun: 'item', list: function () { return s['p' + n]; }, changed: function () { refresh(); },
          blank: function () { return blank(n); },
          cols: [
            { key: 'what', label: 'What you will do', type: 'textarea', rows: 1, full: 'top', ph: n === 1 ? 'A first 1:1 with everyone' : 'Land the next release' },
            { key: 'kind', label: 'Kind', type: 'select', options: kinds(), size: '3fr' },
            { key: 'done', label: 'Done', type: 'check', size: '1fr' },
            { key: 'measure', label: 'Done means', type: 'textarea', rows: 1, full: true, ph: 'Every person met by day 15, with notes' }
          ]
        });
        dates[n] = h('p', { class: 'p9-dates faint' });
        banks[n] = h('ul', { class: 'p9-bank', 'data-phase': n }, (U.data.plan90Bank || []).filter(function (b) { return b.phase === n; }).map(function (b) {
          var link = /^(\w+):(.+)$/.exec(b.link || '');
          return h('li', { 'data-id': b.id },
            h('div', { class: 'p9-bank-text' },
              h('b', null, b.what), ' ', h('span', { class: 'badge' }, kindTitle(b.kind)),
              h('small', null, 'Done means: ' + b.measure),
              h('small', { class: 'faint' }, b.why, link ? [' ', h('a', { href: U.linkFor(link[1], link[2]), html: U.labelFor(link[1], link[2]) })] : null)),
            h('button', { class: 'btn btn-small p9-add', type: 'button', onclick: function () {
              s['p' + n].push(fromBank(b));
              editors[n].draw();
              refresh();
            } }, '+ Add'));
        }));
        return h('section', { class: 'p9-phase', 'data-phase': n },
          h('h3', null, ph.title + ': ' + ph.focus), dates[n],
          h('p', { class: 'muted p9-hint' }, ph.hint),
          editors[n].el,
          U.section('Suggestions for ' + ph.title.toLowerCase(), banks[n], n === 1));
      });

      root.appendChild(h('div', { class: 'tool-layout' },
        h('div', { class: 'card st-form' },
          K.samples([['p9-sample', 'Load the example', function () { K.replace(s, sample()); f.fill(); drawAll(); refresh(); }]],
            'p9-clear', function () { K.replace(s, EMPTY); f.fill(); drawAll(); refresh(); }),
          h('div', { class: 'field-row three p9-head' },
            K.field('p9-start', 'Day 1', 'Your first day as lead', f.input('start', { id: 'p9-start', type: 'date' })),
            K.field('p9-role', 'Your role', null, f.input('role', { id: 'p9-role', placeholder: 'lead of the Payments team' })),
            K.field('p9-manager', 'Your manager', null, f.input('manager', { id: 'p9-manager', placeholder: 'Priya' }))),
          phaseBoxes),
        h('div', { class: 'st-side' }, checks.el, h('div', { class: 'card' }, h('h2', null, 'Progress'), progress), out.el, msg.el)));
      root.appendChild(guide());

      function drawAll() { [1, 2, 3].forEach(function (n) { editors[n].draw(); }); }

      function refresh() {
        U.store.set('tool.plan90', s);
        var c = compute(s), who = first(s.manager) || 'your manager';
        PHASES.forEach(function (ph, k) {
          var x = c.phases[k];
          dates[ph.n].textContent = x.from ? span(x, who) : 'Set day 1 to see the dates.';
          var used = {};
          [1, 2, 3].forEach(function (n) { list(s, n).forEach(function (it) { if (it && it.from) used[it.from] = true; }); });
          U.$$('li[data-id]', banks[ph.n]).forEach(function (li) {
            var btn = U.$('.p9-add', li), on = !!used[li.getAttribute('data-id')];
            btn.disabled = on;
            btn.textContent = on ? 'Added' : '+ Add';
          });
        });
        progress.textContent = c.items ? c.done + ' of ' + c.items + ' done' + (c.done === c.items ? '. All done: time for the day-90 review.' : '') : 'No items yet.';
        checks.show(check(s));
        out.set(compose(s));
        msg.set(message(s));
      }
      f.fill();
      refresh();
    }
  };

  function guide() {
    return U.section('How to use a 30-60-90 day plan', h('div', { html: U.md([
      '1. **Draft it in your first week**, from what you know, then change it after your first 1:1s.',
      '2. **Agree it with your manager.** Ask what would make day 90 a success, and make sure the plan answers it.',
      '3. **Keep it small:** three to five items a phase, each with a result you could check.',
      '4. **Learn first.** Days 1 to 30 are for the people, the system and the work; one early win the team asked for, no big changes.',
      '5. **Review it at each step** with your manager: what is done, what changed, what comes next.',
      '',
      (U.data.plan90Kinds || []).map(function (k) { return '- **' + k.title + ':** ' + k.why; }).join('\n'),
      '',
      'More in [[lesson:first-90-days]]; practise it in [[scenario:first-week-as-lead]].'
    ].join('\n')) }), false);
  }
})(window.LELT);
