/*
 * views/tools/techdebt.js - the tech-debt business case (#/tools/techdebt).
 *
 * Items: what slows the team down, the developer-hours it loses a sprint, the developer-days to fix
 * it, the risk of leaving it, and whether it is in the plan. Each item pays back in
 * fix days / (hours lost / 8) sprints. The plan spends a share of the team's developer-days each
 * sprint on the items in payback order; an item's saving starts the sprint after it is fixed. The
 * plan is paid back in the first sprint at whose end the time saved so far is at least the time
 * spent so far. Then the message for the person who decides.
 *
 * Checks (data/tool-checks.js): no items, an item with no cost or no fix estimate, a payback of more
 * than 13 sprints on an item that is not high risk, engineering jargon (the "debt" wording rules in
 * data/lint-rules.js), and no ask (nobody who decides, or no share). Kept in "lelt.tool.techdebt".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { items: [], capacity: '', share: '20', decider: '', why: '', rate: '' };
  var RULES = ['debt-no-items', 'debt-no-cost', 'debt-no-fix', 'debt-slow-payback', 'debt-jargon', 'debt-no-ask'];
  var RISKS = [['high', 'High'], ['medium', 'Medium'], ['low', 'Low']];
  var SLOW = 13;        // sprints: about six months of two-week sprints
  var HORIZON = 104;    // sprints the plan looks ahead: four years

  function str(v) { return String(v === undefined || v === null ? '' : v).trim(); }
  function n1(x) { return String(Math.round(x * 10) / 10); }
  function rupees(x) { return '₹' + Math.round(x).toLocaleString('en-IN'); }
  function named(s) { return (s.items || []).filter(function (it) { return str(it.what); }); }

  function compute(s) {
    var cap = P.num(s.capacity), share = P.num(s.share);
    var budget = cap > 0 && share > 0 ? cap * share / 100 : 0;
    var items = named(s).map(function (it) {
      var hours = P.num(it.hours), fix = P.num(it.fix), cost = hours > 0 ? hours / 8 : 0;
      return { what: str(it.what), hours: hours, fix: fix, cost: cost, risk: it.risk || 'medium', include: it.include !== false,
        payback: cost > 0 && fix > 0 ? fix / cost : null };
    });
    var rank = { high: 0, medium: 1, low: 2 };
    var order = items.filter(function (x) { return x.include && x.payback !== null; })
      .sort(function (a, b) { return a.payback - b.payback || rank[a.risk] - rank[b.risk]; });
    var r = { budget: budget, items: items, order: order, left: items.filter(function (x) { return !x.include; }),
      saving: order.reduce(function (t, x) { return t + x.cost; }, 0), spent: 0, done: null, breakEven: null, series: [{ sprint: 0, spent: 0, saved: 0 }] };
    if (!budget || !order.length) return r;
    var remaining = order.map(function (x) { return x.fix; }), at = 0, saving = 0, spent = 0, saved = 0;
    for (var sprint = 1; sprint <= HORIZON; sprint++) {
      saved += saving;                       // what the items fixed before this sprint save in it
      var left = budget, fixed = 0;
      while (at < order.length && left > 1e-9) {
        var take = Math.min(left, remaining[at]);
        remaining[at] -= take; left -= take; spent += take;
        if (remaining[at] <= 1e-9) { fixed += order[at].cost; at++; }
      }
      saving += fixed;                       // from the next sprint on
      if (at === order.length && r.done === null) r.done = sprint;
      r.series.push({ sprint: sprint, spent: spent, saved: saved });
      if (r.breakEven === null && saved > 0 && saved >= spent - 1e-9) r.breakEven = sprint;
      if (r.done !== null && r.breakEven !== null && sprint >= Math.max(r.breakEven + 2, 10)) break;
    }
    r.spent = spent;
    return r;
  }

  function check(s) {
    var out = [], r = compute(s), rules = (U.data.lintRules || {}).debt || [];
    var inPlan = r.items.filter(function (x) { return x.include; });
    if (!inPlan.length) out.push({ rule: 'debt-no-items', where: 'Items', key: 'items' });
    inPlan.forEach(function (x) {
      if (!(x.hours > 0)) out.push({ rule: 'debt-no-cost', where: x.what, key: 'items' });
      if (!(x.fix > 0)) out.push({ rule: 'debt-no-fix', where: x.what, key: 'items' });
      if (x.payback !== null && x.payback > SLOW && x.risk !== 'high') out.push({ rule: 'debt-slow-payback', where: x.what, key: 'items', detail: 'pays back in ' + n1(x.payback) + ' sprints' });
    });
    r.items.forEach(function (x) {
      U.lint.find(x.what, rules).forEach(function (m) { out.push({ rule: 'debt-jargon', where: x.what, key: 'items', detail: m.text, msg: m.rule.msg, fix: m.rule.fix }); });
    });
    U.lint.find(s.why, rules).forEach(function (m) { out.push({ rule: 'debt-jargon', where: 'For the business', key: 'why', detail: m.text, msg: m.rule.msg, fix: m.rule.fix }); });
    if (!str(s.decider)) out.push({ rule: 'debt-no-ask', where: 'Who decides', key: 'decider' });
    else if (!r.budget) out.push({ rule: 'debt-no-ask', where: 'Share of each sprint', key: P.num(s.capacity) > 0 ? 'share' : 'capacity' });
    return out;
  }

  /** The message for the person who decides. */
  function message(s) {
    var r = compute(s), rate = P.num(s.rate), who = str(s.decider) || '[who decides]';
    var cost = r.saving > 0 ? 'Today they cost us about ' + n1(r.saving) + ' developer-days every sprint' + (rate > 0 ? ', about ' + rupees(r.saving * rate) + ' of the team\'s time' : '') + '.' : '';
    var out = ['Subject: Tech debt: ' + n1(r.budget) + ' developer-days a sprint' + (r.breakEven ? ', paid back by sprint ' + r.breakEven : ''), '', 'Hi ' + who + ',', '',
      'I would like to spend ' + n1(r.budget) + ' of the team\'s ' + (str(s.capacity) || '[n]') + ' developer-days in each sprint (' + (str(s.share) || '[n]') + '%) on ' +
        U.plural(r.order.length, 'problem') + ' that slow down our work. ' + cost];
    if (r.order.length) {
      out.push('', 'In the order I would fix them, fastest payback first:');
      r.order.forEach(function (x, i) {
        out.push((i + 1) + '. ' + x.what + ': about ' + n1(x.hours) + ' hours lost a sprint, ' + U.plural(+n1(x.fix), 'day') + ' to fix, pays back in ' +
          U.plural(+n1(x.payback), 'sprint') + '. Risk if we leave it: ' + (x.risk === 'high' ? 'high' : x.risk === 'low' ? 'low' : 'medium') + '.');
      });
    }
    if (r.left.length) out.push('', 'Left out for now: ' + r.left.map(function (x) { return x.what + (x.payback !== null ? ' (pays back in ' + U.plural(+n1(x.payback), 'sprint') + ')' : ''); }).join('; ') + '.');
    if (r.done !== null) {
      out.push('', 'The plan: all done by the end of sprint ' + r.done + '. ' + (r.breakEven
        ? 'By sprint ' + r.breakEven + ' the time saved has paid back the time spent; after that the team gains about ' + n1(r.saving) + ' developer-days a sprint for features.'
        : 'At this share it does not pay back within ' + HORIZON + ' sprints, so I would fix fewer items or make the case on risk.'));
    }
    if (str(s.why)) out.push('', 'What it means for you: ' + str(s.why));
    out.push('', 'Can we agree this before the next Sprint Planning? I will show the hours saved at every Sprint Review, so you can see whether it is working, and stop it if it is not.');
    return out.join('\n');
  }

  function sample() {
    return {
      items: [
        { what: 'Flaky tests in the payments suite', hours: '12', fix: '3', risk: 'high', include: true },
        { what: 'Manual steps in every deployment', hours: '10', fix: '5', risk: 'medium', include: true },
        { what: 'Only Sameer can change the settlement job', hours: '6', fix: '8', risk: 'high', include: true },
        { what: 'The old PDF library for invoices', hours: '2', fix: '10', risk: 'low', include: false }
      ],
      capacity: '40', share: '20', decider: 'Neha', rate: '8000',
      why: 'Payment changes reach customers in days instead of weeks, releases stop needing an evening of manual steps, and the settlement job no longer stops when one person is on leave.'
    };
  }

  function chart(box, r) {
    box.innerHTML = '';
    if (r.series.length < 2) { box.appendChild(h('p', { class: 'faint' }, 'Add items with their cost and fix estimate, and the share of each sprint, to see the plan.')); return; }
    var S = K.svg, W = K.chartWidth(box), H = 210, L = 40, R = 14, T = 26, B = 34;
    var last = r.series[r.series.length - 1], top = Math.max(last.spent, last.saved) || 1, n = last.sprint;
    function x(i) { return L + i / n * (W - L - R); }
    function y(v) { return T + (1 - v / top) * (H - T - B); }
    function line(key) { return r.series.map(function (p) { return x(p.sprint) + ',' + y(p[key]); }).join(' '); }
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'td-svg', role: 'img',
      'aria-label': 'Time spent fixing and time saved, by sprint' + (r.breakEven ? ': paid back in sprint ' + r.breakEven : '') },
      S('line', { class: 'hist-axis', x1: L, x2: W - R, y1: y(0), y2: y(0) }),
      S('text', { class: 'hist-tick', x: L - 6, y: y(top) + 4, 'text-anchor': 'end' }, n1(top)),
      S('text', { class: 'hist-tick', x: L - 6, y: y(0) + 4, 'text-anchor': 'end' }, '0'),
      S('polyline', { class: 'td-spent', points: line('spent') }),
      S('polyline', { class: 'td-saved', points: line('saved') }),
      S('text', { class: 'hist-tick', x: L, y: H - 10 }, 'sprint 0'),
      S('text', { class: 'hist-tick', x: W - R, y: H - 10, 'text-anchor': 'end' }, 'sprint ' + n));
    if (r.breakEven) {
      var bx = x(r.breakEven);
      svg.appendChild(S('line', { class: 'td-break hist-mark', x1: bx, x2: bx, y1: T - 6, y2: y(0) }));
      svg.appendChild(S('text', { class: 'hist-label', x: bx + (bx > W - 150 ? -6 : 6), y: T - 10, 'text-anchor': bx > W - 150 ? 'end' : 'start' }, 'Paid back: sprint ' + r.breakEven));
    }
    box.appendChild(svg);
    box.appendChild(h('p', { class: 'td-legend faint' }, h('span', { class: 'td-key td-key-spent' }), ' developer-days spent fixing, so far   ',
      h('span', { class: 'td-key td-key-saved' }), ' developer-days saved, so far'));
  }

  U.tools.techdebt = {
    EMPTY: EMPTY, rules: RULES, check: check, compute: compute, message: message, sample: sample,
    render: function (root) {
      var s = K.load('techdebt', EMPTY);
      if (!Array.isArray(s.items)) s.items = [];
      var f = K.form(s, function () { refresh(); });
      var items = K.rows({
        id: 'td-items', noun: 'item', list: function () { return s.items; }, changed: function () { refresh(); },
        blank: function () { return { what: '', hours: '', fix: '', risk: 'medium', include: true }; },
        cols: [
          { key: 'what', label: 'What slows us down', type: 'textarea', rows: 1, ph: 'Flaky tests in the payments suite', size: '2.6fr' },
          { key: 'hours', label: 'Hours lost a sprint', type: 'number', ph: '12', size: '.8fr' },
          { key: 'fix', label: 'Days to fix', type: 'number', ph: '3', size: '.75fr' },
          { key: 'risk', label: 'Risk if left', type: 'select', options: RISKS, size: '1fr' },
          { key: 'include', label: 'In plan', type: 'check', size: '.55fr' }
        ]
      });
      var summary = h('div', { class: 'td-summary', id: 'td-summary' });
      var table = h('div', { class: 'table-wrap' });
      var chartBox = h('div', { class: 'td-chart', id: 'td-chart' });
      var checks = K.checksCard('techdebt', 'A case in time and money, with a clear ask and items that pay back.', function (x) {
        K.focus(x.key === 'items' ? (U.$('#td-items input') || U.$('#td-items-add')) : U.$('#td-' + x.key));
      });
      var out = K.outputCard({ id: 'td-output', title: 'The ask', note: 'Say it in the conversation first; send this afterwards, so the numbers are in writing.',
        prompt: function (text) {
          return 'I am a lead engineer asking my Product Owner for time to fix technical debt. Here is my message. ' +
            'Make it more convincing to someone who thinks in features, money and risk, without overstating the numbers, and tell me which objection to prepare for.\n\n' + text;
        } });

      root.appendChild(h('div', { class: 'tool-layout' },
        h('div', { class: 'card st-form' },
          K.samples([['td-sample', 'Load the example', function () { K.replace(s, sample()); f.fill(); items.draw(); refresh(); }]],
            'td-clear', function () { K.replace(s, EMPTY); f.fill(); items.draw(); refresh(); }),
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'What slows the team down'), items.el,
            h('small', { class: 'faint' }, 'Hours lost a sprint: re-runs, workarounds, manual steps, time on the incidents it causes. A rough number beats none.')),
          h('div', { class: 'field-row three' },
            K.field('td-capacity', 'Team developer-days a sprint', null, f.input('capacity', { id: 'td-capacity', inputmode: 'decimal', placeholder: '40' })),
            K.field('td-share', 'Share for debt, %', '20% is common', f.input('share', { id: 'td-share', inputmode: 'decimal', placeholder: '20' })),
            K.field('td-rate', 'Cost of a developer-day, ₹', 'Optional', f.input('rate', { id: 'td-rate', inputmode: 'decimal', placeholder: '8000' }))),
          K.field('td-decider', 'Who decides', 'Usually the Product Owner', f.input('decider', { id: 'td-decider', placeholder: 'Neha' })),
          K.field('td-why', 'What it means for the business', 'In their words: speed, money, risk, customers', f.textarea('why', { id: 'td-why', rows: 3, grow: true,
            placeholder: 'Payment changes reach customers in days instead of weeks.' }))),
        h('div', { class: 'st-side' },
          checks.el,
          h('div', { class: 'card' }, h('h2', null, 'The plan'), summary, table, chartBox),
          out.el)));
      root.appendChild(guide());

      function refresh() {
        U.store.set('tool.techdebt', s);
        var r = compute(s);
        summary.innerHTML = '';
        summary.dataset.breakEven = r.breakEven === null ? '' : String(r.breakEven);
        summary.dataset.done = r.done === null ? '' : String(r.done);
        if (r.order.length && r.budget) {
          summary.appendChild(h('div', { class: 'cp-stats td-stats' },
            tile(n1(r.budget), 'developer-days a sprint'), tile(r.done === null ? '-' : 'sprint ' + r.done, 'all fixed'),
            tile(r.breakEven === null ? 'not in ' + HORIZON : 'sprint ' + r.breakEven, 'paid back'), tile(n1(r.saving), 'days a sprint saved after')));
        }
        table.innerHTML = '';
        if (r.order.length) {
          table.appendChild(h('table', { class: 'table td-plan', id: 'td-plan' },
            h('thead', null, h('tr', null, h('th', null, 'Item and its risk'), h('th', null, 'Lost a sprint'), h('th', null, 'To fix'), h('th', null, 'Pays back in'))),
            h('tbody', null, r.order.map(function (x) {
              return h('tr', { 'data-payback': n1(x.payback), class: x.payback > SLOW && x.risk !== 'high' ? 'td-slow' : null },
                h('td', null, x.what, ' ', h('span', { class: 'badge td-risk-' + x.risk }, x.risk + ' risk')), h('td', null, n1(x.hours) + ' h'),
                h('td', null, U.plural(+n1(x.fix), 'day')), h('td', null, U.plural(+n1(x.payback), 'sprint')));
            }))));
        }
        chart(chartBox, r);
        checks.show(check(s));
        out.set(message(s));
      }
      function tile(big, small) { return h('div', { class: 'stat' }, h('b', null, big), h('span', null, small)); }
      f.fill();
      refresh();
    }
  };

  function guide() {
    return U.section('How to get time for tech debt', h('div', { html: U.md([
      '1. **Measure before you ask.** Two weeks of noting the hours lost to flaky tests, manual steps and workarounds is the best argument you will ever have.',
      '2. **Speak in their currency:** days, money, risk, speed. "Refactor" and "clean code" lose to every feature; "pays back in two sprints" wins.',
      '3. **Fix the fast paybacks first**, and leave the slow ones unless the risk is high. A plan that pays back early earns the next one.',
      '4. **Ask for a steady share of each sprint** (20% is common), not "a tech-debt sprint someday", which never comes.',
      '5. **Show the result** at each Sprint Review: the hours saved, the incidents gone. That is what keeps the share.',
      '',
      'More in [[lesson:tech-debt]]; practise it in [[scenario:no-time-for-tech-debt]] and [[scenario:flaky-builds-ignored]].'
    ].join('\n')) }), false);
  }
})(window.LELT);
