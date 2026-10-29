/*
 * views/tools/prioritise.js - the prioritisation tool (#/tools/prioritise).
 *
 * List the competing asks: who asked, how many weeks of the team's time each takes, what a week of
 * delay costs, whether it is urgent and important, and its MoSCoW category. Three views:
 *
 *   Eisenhower     urgent x important: do first, schedule, delegate or batch, drop or park
 *   MoSCoW         must, should, could, won't; must-haves above 60% of the effort leave no room
 *                  for surprises (DSDM's guideline)
 *   cost of delay  CD3 = cost of a week's delay / weeks of work; doing the highest first loses the
 *                  least money while the others wait. The total is sum(cost per week x week done).
 *
 * The message compares two asks: "If A goes first, A is done by..., B moves to..." The draft is kept
 * in "lelt.tool.prioritise".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { start: '', decider: '', a: '', b: '', items: [] };
  var MOSCOW = [['must', 'Must have'], ['should', 'Should have'], ['could', 'Could have'], ['wont', 'Won\'t have (this time)']];
  var QUADS = [
    { id: 'do', title: 'Do first', what: 'Urgent and important' },
    { id: 'schedule', title: 'Schedule', what: 'Important, not urgent: give it a date, or it never happens' },
    { id: 'delegate', title: 'Delegate or batch', what: 'Urgent, not important: someone else, or one slot a week' },
    { id: 'drop', title: 'Drop or park', what: 'Neither: say no, kindly' }
  ];

  function item(name, who, weeks, cod, urgent, important, moscow) {
    return { name: name, who: who, weeks: weeks, cod: cod, urgent: urgent, important: important, moscow: moscow };
  }
  function sample() {
    var d = new Date();
    while (d.getDay() !== 1) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return {
      start: U.localDate(d), decider: 'Priya (engineering manager)', a: '', b: '',
      items: [
        item('Fix failed-refund retries', 'Anil (Support)', '1', '8', true, true, 'must'),
        item('Marketplace partner API', 'Meera (Sales)', '4', '10', true, true, 'should'),
        item('Dark mode in the admin app', 'Tanvi (Design)', '2', '1', false, false, 'could'),
        item('Spring Boot 2 to 3 upgrade (support ends)', 'Kiran (Platform)', '3', '3', false, true, 'must'),
        item('Quarterly audit export', 'Deepa (Finance)', '1', '2', true, false, 'should')
      ]
    };
  }

  /** Every view's numbers. Items keep their position in the list as their id. */
  function compute(s) {
    var start = P.parseDay(s.start) || P.today();
    var items = (s.items || []).map(function (x, i) {
      var w = P.num(x.weeks), c = P.num(x.cod);
      return { i: i, name: String(x.name || '').trim(), who: String(x.who || '').trim(), weeks: w, cod: c,
        urgent: !!x.urgent, important: !!x.important, moscow: x.moscow || 'should', cd3: w > 0 && c >= 0 ? c / w : -Infinity };
    }).filter(function (x) { return x.name; });
    var order = items.slice().sort(function (a, b) { return b.cd3 - a.cd3 || a.i - b.i; });
    function cost(list) {
      var t = 0, total = 0;
      list.forEach(function (x) { if (x.weeks > 0 && x.cod >= 0) { t += x.weeks; total += x.cod * t; } });
      return Math.round(total * 100) / 100;
    }
    var t = 0, done = {};
    order.forEach(function (x) { if (x.weeks > 0) { t += x.weeks; done[x.i] = { weeks: t, date: P.addWorkdays(start, Math.ceil(t * 5)) }; } });
    var quads = {}, cols = {};
    QUADS.forEach(function (q) { quads[q.id] = []; });
    MOSCOW.forEach(function (m) { cols[m[0]] = []; });
    items.forEach(function (x) {
      quads[x.urgent && x.important ? 'do' : x.important ? 'schedule' : x.urgent ? 'delegate' : 'drop'].push(x.i);
      (cols[x.moscow] || cols.should).push(x.i);
    });
    var weeksOf = function (list) { return list.reduce(function (n, x) { return n + (x.weeks > 0 ? x.weeks : 0); }, 0); };
    var total = weeksOf(items), must = weeksOf(items.filter(function (x) { return x.moscow === 'must'; }));
    var pick = function (v, fallback) { var n = parseInt(v, 10); return items.some(function (x) { return x.i === n; }) ? n : fallback; };
    var a = pick(s.a, order[0] ? order[0].i : null), b = pick(s.b, (order.filter(function (x) { return x.i !== a; })[0] || {}).i);
    return { start: start, items: items, order: order.map(function (x) { return x.i; }), done: done, quads: quads, cols: cols,
      totalWeeks: total, mustWeeks: must, mustShare: total ? must / total : 0,
      bestCost: cost(order), listedCost: cost(items), a: a, b: b === undefined ? null : b };
  }

  var RULES = ['all-urgent', 'too-many-musts', 'no-cost', 'no-weeks', 'no-decider'];

  function check(s) {
    var r = compute(s), out = [];
    if (r.items.length >= 3 && r.items.every(function (x) { return x.urgent; })) out.push({ rule: 'all-urgent', where: 'Asks' });
    if (r.totalWeeks && r.mustShare > 0.6) out.push({ rule: 'too-many-musts', where: 'MoSCoW', detail: Math.round(r.mustShare * 100) + '% must' });
    r.items.forEach(function (x) {
      if (!(x.weeks > 0)) out.push({ rule: 'no-weeks', where: 'Ask ' + (x.i + 1), row: x.i, key: 'weeks' });
      if (!(x.cod >= 0)) out.push({ rule: 'no-cost', where: 'Ask ' + (x.i + 1), row: x.i, key: 'cod' });
    });
    if (r.items.length >= 2 && !String(s.decider || '').trim()) out.push({ rule: 'no-decider', where: 'Who decides' });
    return out;
  }

  /** "If A goes first... if B goes first..." with dates and a recommendation. */
  function message(s, r) {
    var A = r.items.filter(function (x) { return x.i === r.a; })[0], B = r.items.filter(function (x) { return x.i === r.b; })[0];
    if (!A || !B) return 'Add at least two asks to compare.';
    if (!(A.weeks > 0) || !(B.weeks > 0)) return 'Give both asks a number of weeks to compare them.';
    function by(w) { return P.day(P.addWorkdays(r.start, Math.ceil(w * 5))); }
    function label(x) { return '"' + x.name + '"' + (x.who ? ' from ' + x.who : ''); }
    var first = A.cd3 >= B.cd3 ? A : B, second = first === A ? B : A;
    var out = ['Both ' + label(A) + ' and ' + label(B) + ' need the same people, so one has to go first.', '',
      '- If ' + A.name + ' goes first: it is done by ' + by(A.weeks) + ', and ' + B.name + ' moves to ' + by(A.weeks + B.weeks) + '.',
      '- If ' + B.name + ' goes first: it is done by ' + by(B.weeks) + ', and ' + A.name + ' moves to ' + by(A.weeks + B.weeks) + '.', ''];
    if (A.cod >= 0 && B.cod >= 0) {
      out.push('A week of waiting costs about ' + A.cod + ' for ' + A.name + ' and ' + B.cod + ' for ' + B.name + '. For each week of the team\'s time, ' +
        first.name + ' loses more while it waits, so I suggest ' + first.name + ' first and ' + second.name + ' straight after.');
    }
    var decider = String(s.decider || '').trim();
    out.push((decider ? decider + ', can' : 'Can') + ' you confirm the order by ' + P.day(P.addWorkdays(P.today(s), 3)) + '? Until then we continue with ' + first.name + '.');
    return out.join('\n');
  }

  U.tools.prioritise = {
    EMPTY: EMPTY, rules: RULES, compute: compute, check: check, message: message,
    render: function (root) {
      var s = K.load('prioritise', EMPTY);
      if (!s.start) s.start = U.localDate(new Date());
      var f = K.form(s, changed);
      var list = K.rows({
        id: 'pr-items', noun: 'ask', list: function () { return s.items; }, changed: changed,
        blank: function () { return item('', '', '', '', false, false, 'should'); },
        cols: [
          { key: 'name', label: 'The ask', ph: 'What they want', size: '2.4fr' },
          { key: 'who', label: 'Asked by', ph: 'Name (team)', size: '1.4fr' },
          { key: 'weeks', label: 'Weeks', type: 'number', ph: 'of work', size: '.7fr' },
          { key: 'cod', label: 'Cost of a week\'s delay', type: 'number', ph: 'per week', size: '1fr' },
          { key: 'urgent', label: 'Urgent', type: 'check', size: '.6fr' },
          { key: 'important', label: 'Important', type: 'check', size: '.75fr' },
          { key: 'moscow', label: 'MoSCoW', type: 'select', options: MOSCOW, size: '1.3fr' }
        ]
      });
      var checks = K.checksCard('prioritise', 'No warnings. The asks are sized and costed, and someone owns the decision.', function (x) {
        K.focus(x.row !== undefined ? K.cell('pr-items', x.row, x.key) : x.where === 'Who decides' ? U.$('#pr-decider') : U.$('#pr-items-add'));
      });
      var pickA = h('select', { class: 'select', id: 'pr-a', 'aria-label': 'First ask to compare' });
      var pickB = h('select', { class: 'select', id: 'pr-b', 'aria-label': 'Second ask to compare' });
      pickA.addEventListener('change', function () { s.a = pickA.value; changed(); });
      pickB.addEventListener('change', function () { s.b = pickB.value; changed(); });
      var eisen = h('div', { class: 'pr-grid' }), moscow = h('div', { class: 'pr-cols' }), mustShare = h('p', { class: 'pr-must-share' });
      var cd3 = h('div'), output = K.outputCard({ id: 'pr-output', title: 'Your message: A or B first?',
        prompt: function (text) { return 'I am a lead engineer with two competing requests and one team. Here is the message I plan to send to the person who decides. ' +
          'Make it shorter and neutral (I must not sound like I am taking sides), and check the reasoning.\n\n' + text; } });

      root.appendChild(h('div', { class: 'tool-stack' },
        h('div', { class: 'card st-form' },
          K.samples([['pr-sample', 'Load an example', function () { load(sample()); }]], 'pr-clear', function () { load(Object.assign(K.clone(EMPTY), { start: U.localDate(new Date()) })); }),
          h('div', { class: 'field-row' },
            K.field('pr-start', 'The team is free from', null, f.input('start', { id: 'pr-start', type: 'date' })),
            K.field('pr-decider', 'Who decides between them?', 'The person who owns both priorities, usually your manager or the Product Owner',
              f.input('decider', { id: 'pr-decider', placeholder: 'Priya (engineering manager)' }))),
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'The asks'),
            h('small', { class: 'faint' }, 'Cost of a week\'s delay: any unit, used the same way for every ask (₹ lakh, customers lost, a 1 to 10 score). ' +
              'Urgent: a real date or a cost if it waits. Important: it moves a goal the team or company has.'), list.el)),
        checks.el,
        h('div', { class: 'pr-views' },
          h('div', { class: 'card' }, h('h2', null, 'Eisenhower: urgent and important'), eisen),
          h('div', { class: 'card' }, h('h2', null, 'MoSCoW'), mustShare, moscow)),
        h('div', { class: 'card' }, h('h2', null, 'Cost of delay: which order loses least'), cd3),
        h('div', { class: 'card' }, h('div', { class: 'row pr-picks' }, h('b', null, 'Compare'), pickA, h('span', null, 'with'), pickB)),
        output.el));

      function load(next) { K.replace(s, next); f.fill(); list.draw(); changed(); }

      function chip(r, i) {
        var x = r.items.filter(function (y) { return y.i === i; })[0];
        return h('span', { class: 'pr-chip', 'data-item': i, title: x.who ? 'Asked by ' + x.who : null }, x.name);
      }

      function changed() {
        U.store.set('tool.prioritise', s);
        var r = compute(s);
        checks.show(check(s));
        eisen.innerHTML = '';
        eisen.appendChild(h('span', { class: 'pr-axis pr-axis-top' }, 'Urgent'));
        eisen.appendChild(h('span', { class: 'pr-axis pr-axis-top' }, 'Not urgent'));
        [['do', 'schedule'], ['delegate', 'drop']].forEach(function (row) {
          row.forEach(function (id) {
            var q = QUADS.filter(function (x) { return x.id === id; })[0];
            // the grid reads: row 1 important (do | schedule), row 2 not important (delegate | drop)
            eisen.appendChild(h('div', { class: 'pr-quad pr-q-' + id, 'data-group': id },
              h('b', null, q.title), h('small', null, q.what), h('div', { class: 'pr-chips' }, r.quads[id].map(function (i) { return chip(r, i); }))));
          });
        });
        moscow.innerHTML = '';
        MOSCOW.forEach(function (m) {
          var ids = r.cols[m[0]], weeks = r.items.filter(function (x) { return ids.indexOf(x.i) >= 0 && x.weeks > 0; }).reduce(function (n, x) { return n + x.weeks; }, 0);
          moscow.appendChild(h('div', { class: 'pr-col pr-m-' + m[0], 'data-group': m[0] }, h('b', null, m[1]), h('small', null, weeks ? weeks + ' wk' : '–'),
            h('div', { class: 'pr-chips' }, ids.map(function (i) { return chip(r, i); }))));
        });
        mustShare.className = 'pr-must-share' + (r.mustShare > 0.6 ? ' bad' : '');
        mustShare.textContent = r.totalWeeks ? 'Must-haves: ' + r.mustWeeks + ' of ' + r.totalWeeks + ' weeks (' + Math.round(r.mustShare * 100) + '%). ' +
          'Keep them at or under about 60%, so the should and could items absorb surprises.' : 'Size the asks in weeks to see the split.';
        cd3.innerHTML = '';
        cd3.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table', id: 'pr-cd3' },
          h('thead', null, h('tr', null, ['Ask, in this order', 'Weeks', 'Cost per week', 'CD3', 'Done by'].map(function (x) { return h('th', null, x); }))),
          h('tbody', null, r.order.map(function (i) {
            var x = r.items.filter(function (y) { return y.i === i; })[0], d = r.done[i];
            return h('tr', { 'data-item': i }, h('td', null, x.name), h('td', null, isFinite(x.weeks) ? String(x.weeks) : '–'),
              h('td', null, isFinite(x.cod) ? String(x.cod) : '–'), h('td', null, isFinite(x.cd3) ? P.fixed(x.cd3, 2) : '–'), h('td', null, d ? P.day(d.date) : '–'));
          })))));
        cd3.appendChild(h('p', { class: 'muted', style: { margin: '10px 0 0' } }, r.items.length > 1
          ? 'CD3 is the cost of a week\'s delay divided by the weeks of work: the highest goes first. In this order, the total cost of waiting is ' + r.bestCost +
            '; in the order they are listed, ' + r.listedCost + '.' : 'Add asks to see the order.'));
        [pickA, pickB].forEach(function (sel, k) {
          sel.innerHTML = '';
          r.items.forEach(function (x) { sel.appendChild(h('option', { value: String(x.i) }, x.name)); });
          sel.value = String(k ? r.b : r.a);
        });
        output.set(message(s, r));
      }

      f.fill();
      changed();
    }
  };
})(window.LELT);
