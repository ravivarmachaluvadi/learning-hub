/*
 * views/tools/deadline.js - the deadline negotiator (#/tools/deadline).
 *
 * Someone asks for work by a date. You enter the ask, your estimate as a range (likely and safe, in
 * weeks; or take it from the estimation workbench) and the parts of the work in order of
 * importance. The tool says where the ask sits (fits, risky, unlikely) and lays out the options:
 *
 *   A  a smaller slice by the date: the parts that fit, keeping the same safety margin as your
 *      estimate (the budget is the time to the date x likely / safe)
 *   B  everything, later: the likely and the safe date
 *   C  more people: Brooks's law, modelled in js/plan.js (ramp-up time, teaching cost, paths)
 *   D  pause other work: people who already know the code, so no ramp-up
 *   and what is not an option: cutting testing or reviews.
 *
 * Then it writes the reply with the options, a recommendation and a question. The draft is kept in
 * "lelt.tool.deadline".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { who: '', what: '', why: '', start: '', ask: '', likely: '', safe: '', team: '5', parts: [], add: '0', ramp: '3', pause: '', pauseFrees: '0' };

  function nextMonday() {
    var d = new Date();
    while (d.getDay() !== 1) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return d;
  }
  function sample() {
    var start = nextMonday();
    return {
      who: 'Priya', what: 'customer refunds', why: 'the festive sale', start: U.localDate(start), ask: U.localDate(P.addWorkdays(start, 5)),
      likely: '6', safe: '8', team: '5', add: '3', ramp: '3', pause: 'the loyalty points work', pauseFrees: '2',
      parts: [
        { name: 'Support agents refund orders under ₹5,000 from the admin screen', weeks: '0.6', must: true },
        { name: 'Self-service refunds in the customer app', weeks: '1.5', must: false },
        { name: 'Bank refund API for all orders', weeks: '2', must: false },
        { name: 'Reconciliation report for Finance', weeks: '1', must: false },
        { name: 'Security review and release', weeks: '0.9', must: false }
      ]
    };
  }

  function weeksText(w) { return (Math.round(w * 10) / 10) + (Math.round(w * 10) / 10 === 1 ? ' week' : ' weeks'); }
  function dateAfterWeeks(start, w) { return P.addWorkdays(start, Math.max(1, Math.ceil(w * 5 - 1e-9))); }

  /** Where the ask sits, the parts that fit, and each option's numbers. */
  function compute(s) {
    var start = P.parseDay(s.start) || P.today(), ask = P.parseDay(s.ask);
    var likely = P.num(s.likely), safe = P.num(s.safe), team = P.num(s.team) > 0 ? P.num(s.team) : 1;
    var askWeeks = ask ? P.workdaysBetween(start, ask) / 5 : NaN;
    var known = likely > 0 && safe > 0;
    var verdict = !ask || !known ? null : askWeeks >= safe ? 'fits' : askWeeks >= likely ? 'risky' : 'unlikely';
    var parts = (s.parts || []).filter(function (p) { return String(p.name || '').trim(); })
      .map(function (p) { return { name: p.name.trim(), weeks: P.num(p.weeks), must: !!p.must }; });
    var budget = known && ask ? askWeeks * likely / Math.max(likely, safe) : 0, used = 0, fit = [], rest = [];
    parts.forEach(function (p) {
      if (p.weeks > 0 && used + p.weeks <= budget + 1e-9) { fit.push(p); used += p.weeks; } else rest.push(p);
    });
    var add = Math.max(0, Math.round(P.num(s.add) || 0)), ramp = P.num(s.ramp) >= 0 ? P.num(s.ramp) : 3;
    var frees = Math.max(0, P.num(s.pauseFrees) || 0);
    var people = known && add ? P.brooks(team, add, likely, ramp) : null;
    var pauseWeeks = known && frees && String(s.pause || '').trim() ? likely * team / (team + frees) : NaN;
    var mustMissing = rest.filter(function (p) { return p.must; });
    var recommend = !verdict ? null : verdict === 'fits' ? 'date' : fit.length && !mustMissing.length ? 'scope'
      : pauseWeeks <= askWeeks ? 'pause' : people && people.weeks <= askWeeks ? 'people' : 'date';
    return {
      start: start, ask: ask, askWeeks: askWeeks, likely: likely, safe: safe, team: team, verdict: verdict,
      likelyDate: known ? dateAfterWeeks(start, likely) : null, safeDate: known ? dateAfterWeeks(start, safe) : null,
      parts: parts, partsTotal: parts.reduce(function (n, p) { return n + (p.weeks > 0 ? p.weeks : 0); }, 0),
      budget: budget, fit: fit, rest: rest, mustMissing: mustMissing,
      add: add, ramp: ramp, people: people, peopleDate: people ? dateAfterWeeks(start, people.weeks) : null,
      pauseWeeks: pauseWeeks, pauseDate: isFinite(pauseWeeks) ? dateAfterWeeks(start, pauseWeeks) : null, frees: frees,
      recommend: recommend
    };
  }

  var RULES = ['no-ask-date', 'no-estimate', 'safe-below-likely', 'no-parts', 'parts-mismatch', 'must-not-fit'];

  function check(s) {
    var r = compute(s), out = [];
    if (!r.ask) out.push({ rule: 'no-ask-date', where: 'By when', field: 'dl-ask-date' });
    if (!(r.likely > 0) || !(r.safe > 0)) out.push({ rule: 'no-estimate', where: 'Estimate', field: 'dl-likely' });
    else if (r.safe < r.likely) out.push({ rule: 'safe-below-likely', where: 'Estimate', field: 'dl-safe' });
    if (!r.parts.length) out.push({ rule: 'no-parts', where: 'Parts', field: 'dl-parts-add' });
    else if (r.likely > 0 && Math.abs(r.partsTotal - r.likely) / r.likely > 0.25) out.push({ rule: 'parts-mismatch', where: 'Parts', field: 'dl-likely' });
    if (r.verdict && r.verdict !== 'fits' && r.mustMissing.length) out.push({ rule: 'must-not-fit', where: 'Parts', detail: r.mustMissing[0].name, field: 'dl-parts-add' });
    return out;
  }

  /** The options, in the order the reply lists them: [{id, title, body, inReply}]. */
  function options(s, r) {
    var ask = P.day(r.ask), out = [];
    out.push({ id: 'scope', title: 'A smaller first slice by ' + (ask || 'the date'),
      body: !r.parts.length ? 'List the parts of the work, most important first, to see which fit by the date.'
        : (r.fit.length ? 'Fits by the date: ' + r.fit.map(function (p) { return p.name; }).join('; ') + '. ' : 'Nothing on your list fits by the date. ') +
          (r.rest.length ? 'The rest follows by ' + P.day(r.safeDate) + '.' : '') +
          (r.mustMissing.length ? ' A must-have does not fit: ' + r.mustMissing.map(function (p) { return p.name; }).join('; ') + '. Say so plainly.' : ''),
      inReply: r.fit.length > 0 });
    out.push({ id: 'date', title: 'Everything, later', body: r.likelyDate ? 'Most likely ' + P.day(r.likelyDate) + '; safe to promise ' + P.day(r.safeDate) + '.' : 'Enter your estimate to see the dates.', inReply: !!r.safeDate });
    out.push({ id: 'people', title: 'More people',
      body: !r.people ? 'If someone offers more developers, enter how many could join to see the effect. New people need time before they help.'
        : (r.people.helps ? 'With ' + r.add + ' more: about ' + weeksText(r.people.weeks) + ' (' + P.day(r.peopleDate) + ') at best, instead of ' + weeksText(r.likely) + '. '
          : 'With ' + r.add + ' more, it would not finish sooner: about ' + weeksText(r.people.weeks) + ' instead of ' + weeksText(r.likely) + '. ') +
          'New people need about ' + weeksText(r.ramp) + ' before they help, and teaching them slows the team; the paths for keeping each other informed go from ' +
          r.people.pathsBefore + ' to ' + r.people.pathsAfter + ' (Brooks\'s law: adding people to a late project makes it later).',
      inReply: !!r.people });
    out.push({ id: 'pause', title: 'Pause other work',
      body: isFinite(r.pauseWeeks) ? 'Pausing ' + s.pause.trim() + ' frees ' + U.plural(r.frees, 'developer') + ' who already know the code: about ' +
        weeksText(r.pauseWeeks) + ' (' + P.day(r.pauseDate) + ').' : 'Is there work that could pause to free people who already know the code? Enter it and how many people it frees.',
      inReply: isFinite(r.pauseWeeks) });
    out.push({ id: 'quality', title: 'Not an option: cutting testing or reviews',
      body: 'Skipping tests, reviews or the security check to hit the date doesn\'t remove the work. It comes back as incidents: later, bigger and in front of customers.', inReply: false });
    return out;
  }

  /** The reply: the short answer, the options, a recommendation and a question. */
  function reply(s, r) {
    if (!r.verdict) return 'Fill in the date they asked for and your estimate (likely and safe), and the reply appears here.';
    var who = String(s.who || '').trim(), what = String(s.what || '').trim() || 'this', why = String(s.why || '').trim();
    var out = ['Hi' + (who ? ' ' + who : '') + ', thanks for waiting while we broke it down.', ''];
    if (r.verdict === 'fits') {
      out.push('Good news: ' + what + ' fits. We can promise it by ' + P.day(r.safeDate) + ', before the ' + P.day(r.ask) + ' you asked for (most likely ' + P.day(r.likelyDate) + ').');
      out.push('I will flag it the same day if anything puts that at risk.');
      return out.join('\n');
    }
    out.push('Short answer: all of ' + what + ' by ' + P.day(r.ask) + ' is ' + (r.verdict === 'risky' ? 'possible but risky, about a coin flip' : 'unlikely') +
      '. Our estimate for all of it is ' + r.likely + ' to ' + weeksText(r.safe) + ': most likely ' + P.day(r.likelyDate) + ', safe to promise ' + P.day(r.safeDate) + '.');
    out.push('', 'The options:');
    var letters = 'ABCD', n = 0, names = {};
    options(s, r).filter(function (o) { return o.inReply; }).forEach(function (o) {
      var L = letters[n++];
      names[o.id] = L;
      if (o.id === 'scope') out.push(L + ') By ' + P.day(r.ask) + ': ' + r.fit.map(function (p) { return p.name; }).join('; ') + '.' + (r.rest.length ? ' The rest follows by ' + P.day(r.safeDate) + '.' : ''));
      if (o.id === 'date') out.push(L + ') Everything by ' + P.day(r.safeDate) + '.');
      if (o.id === 'people') out.push(L + ') ' + (r.people.helps ? 'Add ' + r.add + ' people: about ' + weeksText(r.people.weeks) + ' at best, because new people need time to get up to speed.'
        : 'Adding ' + r.add + ' people would not get there sooner: they need about ' + weeksText(r.ramp) + ' to get up to speed, and the team slows down while it teaches them.'));
      if (o.id === 'pause') out.push(L + ') Pause ' + s.pause.trim() + ': everything by ' + P.day(r.pauseDate) + '.');
    });
    var rec = { scope: 'the smaller first slice by your date, then the rest', date: 'everything by the safe date', people: 'adding people', pause: 'pausing ' + String(s.pause || '').trim() }[r.recommend];
    out.push('', 'My recommendation is ' + (names[r.recommend] ? names[r.recommend] + ': ' : '') + rec + '.');
    out.push('Which matters most' + (why ? ' for ' + why : '') + '? I can walk you through the breakdown today.');
    return out.join('\n');
  }

  U.tools.deadline = {
    EMPTY: EMPTY, rules: RULES, compute: compute, check: check, reply: reply,
    render: function (root) {
      var s = K.load('deadline', EMPTY);
      if (!s.start) s.start = U.localDate(new Date());
      var f = K.form(s, changed);
      var parts = K.rows({
        id: 'dl-parts', noun: 'part', list: function () { return s.parts; }, changed: changed,
        blank: function () { return { name: '', weeks: '', must: false }; },
        cols: [
          { key: 'name', label: 'Part of the work', ph: 'Most important first', size: '3fr' },
          { key: 'weeks', label: 'Weeks', type: 'number', ph: 'likely', size: '.8fr' },
          { key: 'must', label: 'Must have', type: 'check', size: '.8fr' }
        ]
      });
      var checks = K.checksCard('deadline', 'No warnings. The reply can offer real options.', function (x) { K.focus(U.$('#' + x.field)); });
      var verdictBox = h('div', { class: 'card dl-verdict-card' });
      var optionsBox = h('div', { class: 'dl-options' });
      var output = K.outputCard({ id: 'dl-output', title: 'Your reply',
        prompt: function (text) { return 'I am a lead engineer. My manager asked for work by a date my estimate says is ' + (compute(s).verdict || 'unclear') +
          '. Here is the reply I plan to send. Make it shorter and more confident without hiding the risk, and tell me the hardest follow-up question I should prepare for.\n\n' + text; } });

      var form = h('div', { class: 'card st-form' },
        K.samples([['dl-sample', 'Load an example', function () { load(sample()); }],
          ['dl-from-estimate', 'Use my estimate from the workbench', fromEstimate]], 'dl-clear', function () { load(Object.assign(K.clone(EMPTY), { start: U.localDate(new Date()) })); }),
        h('div', { class: 'field-row' },
          K.field('dl-who', 'Who is asking?', null, f.input('who', { id: 'dl-who', placeholder: 'Priya' })),
          K.field('dl-what', 'What do they want?', null, f.input('what', { id: 'dl-what', placeholder: 'customer refunds' }))),
        K.field('dl-why', 'Why does the date matter to them?', 'Your reply asks which option serves this best', f.input('why', { id: 'dl-why', placeholder: 'the festive sale' })),
        h('div', { class: 'field-row' },
          K.field('dl-start', 'Work can start', null, f.input('start', { id: 'dl-start', type: 'date' })),
          K.field('dl-ask-date', 'They want it by', null, f.input('ask', { id: 'dl-ask-date', type: 'date' }))),
        h('div', { class: 'field-row three' },
          K.field('dl-likely', 'Likely (weeks)', '50% chance', f.input('likely', { id: 'dl-likely', inputmode: 'decimal', placeholder: '6' })),
          K.field('dl-safe', 'Safe (weeks)', '85% chance', f.input('safe', { id: 'dl-safe', inputmode: 'decimal', placeholder: '8' })),
          K.field('dl-team', 'Developers now', null, f.input('team', { id: 'dl-team', inputmode: 'decimal' }))),
        h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'The parts of the work'),
          h('small', { class: 'faint' }, 'Most important first, each in weeks of the current team\'s time. Tick what is essential for the date.'), parts.el),
        h('div', { class: 'field-row three' },
          K.field('dl-add-people', 'People who could join', null, f.input('add', { id: 'dl-add-people', inputmode: 'numeric' })),
          K.field('dl-ramp', 'Ramp-up, in weeks', 'Before a newcomer helps', f.input('ramp', { id: 'dl-ramp', inputmode: 'decimal' })),
          K.field('dl-pause-people', 'Developers freed', 'If the work below pauses', f.input('pauseFrees', { id: 'dl-pause-people', inputmode: 'numeric' }))),
        K.field('dl-pause', 'Work that could pause', 'Something your team does now that could wait', f.input('pause', { id: 'dl-pause', placeholder: 'the loyalty points work' })));
      root.appendChild(h('div', { class: 'tool-layout' }, form, h('div', { class: 'st-side' }, checks.el, verdictBox, output.el)));
      root.appendChild(h('h2', null, 'The options'));
      root.appendChild(optionsBox);

      function load(next) { K.replace(s, next); f.fill(); parts.draw(); changed(); }

      function fromEstimate() {
        var e = U.store.get('tool.estimate', null), r = e && U.tools.estimate.compute(Object.assign(K.clone(U.tools.estimate.EMPTY), e));
        if (!r || !r.sim) { U.toast('Fill in the estimation workbench first'); return; }
        s.likely = String(Math.round(r.sim.p50 / 5 * 10) / 10);
        s.safe = String(Math.round(r.sim.p85 / 5 * 10) / 10);
        if (!String(s.what || '').trim() && e.feature) s.what = e.feature;
        f.fill();
        changed();
        U.toast('Took P50 and P85 from the workbench, in weeks');
      }

      function changed() {
        U.store.set('tool.deadline', s);
        var r = compute(s);
        checks.show(check(s));
        drawVerdict(r);
        optionsBox.innerHTML = '';
        options(s, r).forEach(function (o) {
          optionsBox.appendChild(h('div', { class: 'card dl-option' + (o.id === r.recommend ? ' recommended' : '') + (o.id === 'quality' ? ' not-option' : ''), 'data-option': o.id },
            h('div', { class: 'row' }, h('h3', null, o.title), o.id === r.recommend ? h('span', { class: 'badge badge-ok' }, 'Recommended') : null),
            h('p', null, o.body)));
        });
        output.set(reply(s, r));
      }

      function drawVerdict(r) {
        verdictBox.innerHTML = '';
        var v = r.verdict || 'none';
        var text = {
          none: 'Enter the date they asked for and your estimate.',
          fits: 'It fits: ' + P.day(r.ask) + ' is after your safe date (' + P.day(r.safeDate) + '). Say yes, and give the safe date.',
          risky: 'Possible but risky: ' + P.day(r.ask) + ' is between your likely date (' + P.day(r.likelyDate) + ') and your safe date (' + P.day(r.safeDate) + '). Roughly a 50 to 85% chance.',
          unlikely: 'Unlikely: ' + P.day(r.ask) + ' is before even your likely date (' + P.day(r.likelyDate) + '). Less than a 50% chance.'
        }[v];
        verdictBox.appendChild(h('h2', null, 'Where the ask sits'));
        verdictBox.appendChild(h('p', { class: 'dl-verdict dl-' + v, 'data-verdict': v }, text));
        if (r.verdict) verdictBox.appendChild(timeline(r));
      }

      function timeline(r) {
        var W = 520, H = 76, end = Math.max(r.safe, r.askWeeks) * 1.08 || 1;
        function x(w) { return 10 + w / end * (W - 20); }
        var svg = K.svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'dl-timeline', role: 'img', 'aria-label': 'The ask against your likely and safe dates' },
          K.svg('rect', { class: 'dl-band', x: x(r.likely), y: 30, width: Math.max(1, x(r.safe) - x(r.likely)), height: 14, rx: 3 }),
          K.svg('line', { class: 'hist-axis', x1: 10, x2: W - 10, y1: 44, y2: 44 }));
        [[0, 'Start', 'start'], [r.likely, 'Likely', 'mid'], [r.safe, 'Safe', 'mid']].forEach(function (m) {
          svg.appendChild(K.svg('line', { class: 'hist-mark', x1: x(m[0]), x2: x(m[0]), y1: 26, y2: 48 }));
          svg.appendChild(K.svg('text', { class: 'hist-tick', x: x(m[0]), y: 64, 'text-anchor': m[2] === 'start' ? 'start' : 'middle' }, m[1]));
        });
        svg.appendChild(K.svg('path', { class: 'dl-ask-mark', d: 'M' + x(r.askWeeks) + ' 28 l-6 -10 h12 z' }));
        svg.appendChild(K.svg('text', { class: 'hist-label', x: x(r.askWeeks), y: 12, 'text-anchor': x(r.askWeeks) > W - 50 ? 'end' : 'middle' }, 'The ask'));
        return svg;
      }

      f.fill();
      changed();
    }
  };
})(window.LELT);
