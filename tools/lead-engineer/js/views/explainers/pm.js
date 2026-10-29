/*
 * views/explainers/pm.js - the pictures for the project management explainers (the text is in
 * data/explainers.js): the cone of uncertainty, the iron triangle, Brooks's law, a Monte Carlo
 * estimate and reading a burn-down. Each registers LELT.explainers[id] = {render(container)}.
 */
(function (U) {
  'use strict';
  var h = U.h, S = U.toolKit.svg, P = U.plan;
  U.explainers = U.explainers || {};

  function fmt(v) { return String(Math.round(v * 10) / 10); }
  function slider(id, label, min, max, step, value) {
    var input = h('input', { type: 'range', class: 'range', id: id, min: String(min), max: String(max), step: String(step) });
    input.value = String(value);
    return { input: input, el: h('div', { class: 'field' }, h('label', { for: id }, label), input) };
  }

  /* ---------- the cone of uncertainty ---------- */

  // McConnell, Software Estimation (2006), table 4-1: the best-case range at each phase
  var PHASES = [
    { name: 'Initial concept', lo: 0.25, hi: 4 },
    { name: 'Approved product definition', lo: 0.5, hi: 2 },
    { name: 'Requirements complete', lo: 0.67, hi: 1.5 },
    { name: 'User interface design complete', lo: 0.8, hi: 1.25 },
    { name: 'Detailed design complete', lo: 0.9, hi: 1.1 }
  ];

  U.explainers['cone-of-uncertainty'] = {
    render: function (box) {
      var base = h('input', { class: 'input', id: 'cone-base', inputmode: 'decimal', value: '10' });
      var phase = slider('cone-phase', 'Where the project is', 0, PHASES.length - 1, 1, 0);
      var range = h('p', { class: 'cone-range' });
      var chart = h('div'), table = h('div');
      box.appendChild(h('div', { class: 'field-row' },
        h('div', { class: 'field' }, h('label', { for: 'cone-base' }, 'Your estimate, in weeks'), base), phase.el));
      box.appendChild(range);
      box.appendChild(chart);
      box.appendChild(table);

      function draw() {
        var b = P.num(base.value) > 0 ? P.num(base.value) : 10, at = +phase.input.value, ph = PHASES[at];
        range.innerHTML = '';
        range.appendChild(h('b', null, ph.name + ': '));
        range.appendChild(document.createTextNode(fmt(b * ph.lo) + ' to ' + fmt(b * ph.hi) + ' weeks (' + ph.lo + '× to ' + ph.hi + '× your estimate)'));
        // the chart: phases across, the multiplier up, on a log scale so 0.25x and 4x are equally far from 1x
        var W = U.toolKit.chartWidth(chart), H = 240, L = 46, R = 70, T = 14, B = 46;
        function x(i) { return L + i / (PHASES.length - 1) * (W - L - R); }
        function y(m) { return T + (2 - Math.log(m) / Math.LN2) / 4 * (H - T - B); }
        var up = PHASES.map(function (p, i) { return x(i) + ',' + y(p.hi); }), down = PHASES.map(function (p, i) { return x(i) + ',' + y(p.lo); }).reverse();
        var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'cone-chart', role: 'img', 'aria-label': 'The cone of uncertainty: the range narrows from 0.25 to 4 times down to 0.9 to 1.1 times' },
          S('polygon', { class: 'cone-area', points: up.concat(down).join(' ') }),
          [4, 2, 1, 0.5, 0.25].map(function (m) {
            return [S('line', { class: m === 1 ? 'cone-one' : 'cone-grid', x1: L, x2: W - R, y1: y(m), y2: y(m) }),
              S('text', { class: 'hist-tick', x: L - 6, y: y(m) + 4, 'text-anchor': 'end' }, m + '×')];
          }),
          S('line', { class: 'cone-now', x1: x(at), x2: x(at), y1: y(ph.hi), y2: y(ph.lo) }),
          S('circle', { class: 'cone-dot', cx: x(at), cy: y(ph.hi), r: 5 }), S('circle', { class: 'cone-dot', cx: x(at), cy: y(ph.lo), r: 5 }),
          S('text', { class: 'hist-label', x: x(at) + 10, y: y(ph.hi) + 4 }, fmt(b * ph.hi) + ' wk'),
          S('text', { class: 'hist-label', x: x(at) + 10, y: y(ph.lo) + 4 }, fmt(b * ph.lo) + ' wk'),
          PHASES.map(function (p, i) { return S('text', { class: 'hist-tick' + (i === at ? ' cone-tick-now' : ''), x: x(i), y: H - 22, 'text-anchor': i === 0 ? 'start' : i === PHASES.length - 1 ? 'end' : 'middle' }, String(i + 1)); }),
          S('text', { class: 'hist-tick', x: (W + L) / 2, y: H - 4, 'text-anchor': 'middle' }, 'phase of the project (1 to 5) →'));
        chart.innerHTML = '';
        chart.appendChild(svg);
        table.innerHTML = '';
        table.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
          h('thead', null, h('tr', null, h('th', null, 'Phase'), h('th', null, 'Range'), h('th', null, 'For ' + fmt(b) + ' weeks'))),
          h('tbody', null, PHASES.map(function (p, i) {
            return h('tr', { class: i === at ? 'is-now' : null }, h('td', null, (i + 1) + '. ' + p.name), h('td', null, p.lo + '× to ' + p.hi + '×'),
              h('td', null, fmt(b * p.lo) + ' to ' + fmt(b * p.hi) + ' weeks'));
          })))));
      }
      base.addEventListener('input', draw);
      phase.input.addEventListener('input', draw);
      draw();
    }
  };

  /* ---------- the iron triangle ---------- */

  var CORNERS = [
    { id: 'scope', name: 'Scope', lever: 'Scope is your lever: deliver the most valuable slice by the date, the rest after. Usually the cheapest move.' },
    { id: 'date', name: 'Date', lever: 'The date is your lever: give a later date as a range, and say what it depends on.' },
    { id: 'people', name: 'People', lever: 'People are your lever, but read Brooks\'s law first: new people slow the team before they speed it up, so this works only early and on work that splits cleanly.' }
  ];

  U.explainers['iron-triangle'] = {
    render: function (box) {
      var st = { scope: 'flex', date: 'fixed', people: 'fixed' };
      var toggles = h('div', { class: 'it-toggles' });
      var pic = h('div', { class: 'it-pic' }), verdict = h('div', { class: 'it-verdict callout' });
      box.appendChild(h('div', { class: 'it-layout' }, h('div', null, toggles, verdict), pic));

      function draw() {
        toggles.innerHTML = '';
        CORNERS.forEach(function (c) {
          toggles.appendChild(h('div', { class: 'it-row' }, h('b', null, c.name),
            [['fixed', 'Fixed'], ['flex', 'Flexible']].map(function (v) {
              return h('button', { class: 'btn btn-small it-toggle' + (st[c.id] === v[0] ? ' btn-primary' : ''), type: 'button', 'data-corner': c.id, 'data-v': v[0],
                'aria-pressed': st[c.id] === v[0] ? 'true' : 'false', onclick: function () { st[c.id] = v[0]; draw(); } }, v[1]);
            })));
        });
        var flex = CORNERS.filter(function (c) { return st[c.id] === 'flex'; });
        var kind = ['all-fixed', 'one-lever', 'two-levers', 'nothing-fixed'][flex.length];
        verdict.dataset.verdict = kind;
        verdict.className = 'it-verdict callout callout-' + (kind === 'all-fixed' ? 'warn' : kind === 'nothing-fixed' ? 'info' : 'tip');
        verdict.innerHTML = '';
        verdict.appendChild(h('div', { class: 'callout-title' }, {
          'all-fixed': 'All three fixed: quality gives, quietly',
          'one-lever': 'One corner can move',
          'two-levers': 'Two corners can move',
          'nothing-fixed': 'Nothing is fixed'
        }[kind]));
        verdict.appendChild(h('div', { class: 'callout-body', html: U.md({
          'all-fixed': 'Something still has to give, and it will be what nobody wrote down: tests, reviews, the security check, the team\'s evenings. Say it out loud: *"With scope, date and team all fixed, what gives is quality. Which of these can move?"*',
          'one-lever': flex.map(function (c) { return c.lever; }).join(' '),
          'two-levers': 'You have room. Agree which one moves first: ' + flex.map(function (c) { return c.lever; }).join(' '),
          'nothing-fixed': 'Without a fixed corner, plans drift. Ask what matters most: a date (an event, a regulation), a scope (a must-have feature), or a budget. Fix that one; let the others flex.'
        }[kind]) }));
        pic.innerHTML = '';
        var pts = { scope: [160, 52], date: [40, 240], people: [280, 240] };
        var svg = S('svg', { viewBox: '0 0 320 290', class: 'it-svg', role: 'img', 'aria-label': 'The triangle: ' + CORNERS.map(function (c) { return c.name + ' ' + (st[c.id] === 'fixed' ? 'fixed' : 'flexible'); }).join(', ') },
          S('polygon', { class: 'it-tri' + (kind === 'all-fixed' ? ' strained' : ''), points: [pts.scope, pts.date, pts.people].map(function (p) { return p.join(','); }).join(' ') }),
          S('text', { class: 'it-quality' + (kind === 'all-fixed' ? ' strained' : ''), x: 160, y: 182, 'text-anchor': 'middle' }, 'Quality'));
        CORNERS.forEach(function (c) {
          var p = pts[c.id], fixed = st[c.id] === 'fixed';
          svg.appendChild(S('circle', { class: 'it-corner' + (fixed ? ' fixed' : ''), cx: p[0], cy: p[1], r: 15 }));
          svg.appendChild(S('text', { class: 'it-mark', x: p[0], y: p[1] + 5, 'text-anchor': 'middle' }, fixed ? '■' : '↔'));
          svg.appendChild(S('text', { class: 'it-label', x: p[0], y: c.id === 'scope' ? p[1] - 24 : p[1] + 36, 'text-anchor': 'middle' }, c.name));
        });
        pic.appendChild(svg);
      }
      draw();
    }
  };

  /* ---------- Brooks's law ---------- */

  U.explainers['brooks-law'] = {
    render: function (box) {
      var n = slider('br-n', 'People on the team', 2, 15, 1, 5);
      var paths = h('b', { id: 'br-paths' }), graph = h('div');
      var left = h('input', { class: 'input', id: 'br-left', inputmode: 'decimal', value: '6' });
      var add = h('input', { class: 'input', id: 'br-add', inputmode: 'numeric', value: '3' });
      var ramp = h('input', { class: 'input', id: 'br-ramp', inputmode: 'decimal', value: '3' });
      var bars = h('div'), note = h('p', { class: 'muted' });
      box.appendChild(h('div', { class: 'br-layout' },
        h('div', null, n.el, h('p', { class: 'br-count' }, paths, ' pairs who may need to talk'), graph),
        h('div', null, h('h3', { style: { marginTop: 0 } }, 'Add people to a late project'),
          h('div', { class: 'field-row three' },
            h('div', { class: 'field' }, h('label', { for: 'br-left' }, 'Weeks of work left'), left),
            h('div', { class: 'field' }, h('label', { for: 'br-add' }, 'People added'), add),
            h('div', { class: 'field' }, h('label', { for: 'br-ramp' }, 'Ramp-up weeks'), ramp)),
          bars, note)));

      function draw() {
        var k = +n.input.value;
        paths.textContent = String(P.paths(k));
        var W = 300, cx = 150, cy = 150, r = 112, pts = [];
        for (var i = 0; i < k; i++) pts.push([cx + r * Math.sin(2 * Math.PI * i / k), cy - r * Math.cos(2 * Math.PI * i / k)]);
        var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + W, class: 'br-svg', id: 'br-graph', role: 'img', 'aria-label': k + ' people, ' + P.paths(k) + ' pairs' });
        for (var a = 0; a < k; a++) for (var b = a + 1; b < k; b++) svg.appendChild(S('line', { class: 'br-path', x1: pts[a][0], y1: pts[a][1], x2: pts[b][0], y2: pts[b][1] }));
        pts.forEach(function (p) { svg.appendChild(S('circle', { class: 'br-node', cx: p[0], cy: p[1], r: 9 })); });
        graph.innerHTML = '';
        graph.appendChild(svg);

        var w = P.num(left.value) > 0 ? P.num(left.value) : 6, more = Math.max(0, Math.round(P.num(add.value) || 0)), rw = P.num(ramp.value) >= 0 ? P.num(ramp.value) : 3;
        var res = P.brooks(k, more, w, rw), max = Math.max(w, res.weeks) || 1;
        bars.innerHTML = '';
        [['Without them', w, 'br-bar'], ['With ' + more + ' more', res.weeks, 'br-bar ' + (res.helps ? 'better' : 'worse')]].forEach(function (x) {
          bars.appendChild(h('div', { class: 'br-bar-row' }, h('span', null, x[0]),
            h('span', { class: 'br-track' }, h('span', { class: x[2], style: { width: (x[1] / max * 100) + '%' } })), h('b', null, fmt(x[1]) + ' wk')));
        });
        note.textContent = !more ? 'Add someone to see the effect.' : res.helps
          ? 'It helps, a little: ' + fmt(w - res.weeks) + ' weeks sooner, and the pairs go from ' + res.pathsBefore + ' to ' + res.pathsAfter + '. The model is generous: it assumes newcomers work at full speed once they are up to speed.'
          : 'It makes it later: ' + fmt(res.weeks - w) + ' weeks more. The newcomers are still learning when the work would have been done, and teaching them slowed everyone down. The pairs go from ' + res.pathsBefore + ' to ' + res.pathsAfter + '.';
      }
      [n.input, left, add, ramp].forEach(function (el) { el.addEventListener('input', draw); });
      draw();
    }
  };

  /* ---------- a Monte Carlo estimate ---------- */

  var MC_TASKS = [{ name: 'Refund API', o: 2, m: 4, p: 8 }, { name: 'Admin screen', o: 1, m: 2, p: 3 }, { name: 'Tests and release', o: 3, m: 5, p: 13 }];

  U.explainers['monte-carlo'] = {
    render: function (box) {
      var rand, totals, last;
      var count = h('b', { id: 'mc-count' }), p50 = h('b', { id: 'mc-p50' }), p85 = h('b', { id: 'mc-p85' });
      var lastBox = h('div', { class: 'mc-last' }), chart = h('div', { class: 'mc-chart' });
      box.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null, ['Task', 'Best', 'Likely', 'Worst'].map(function (x) { return h('th', null, x); }))),
        h('tbody', null, MC_TASKS.map(function (t) { return h('tr', null, h('td', null, t.name), h('td', null, U.plural(t.o, 'day')), h('td', null, U.plural(t.m, 'day')), h('td', null, U.plural(t.p, 'day'))); })))));
      box.appendChild(h('div', { class: 'row mc-buttons' },
        h('button', { class: 'btn btn-primary', id: 'mc-once', type: 'button', onclick: function () { roll(1); } }, 'Roll once'),
        h('button', { class: 'btn', id: 'mc-hundred', type: 'button', onclick: function () { roll(100); } }, 'Roll 100 times'),
        h('button', { class: 'btn', id: 'mc-many', type: 'button', onclick: function () { roll(10000); } }, 'Roll 10,000 times'),
        h('span', { class: 'spacer' }),
        h('button', { class: 'btn btn-ghost', id: 'mc-reset', type: 'button', onclick: reset }, 'Start over')));
      box.appendChild(h('div', { class: 'mc-stats' },
        h('div', { class: 'stat' }, count, h('span', null, 'projects played')),
        h('div', { class: 'stat' }, p50, h('span', null, 'P50: half finished by')),
        h('div', { class: 'stat' }, p85, h('span', null, 'P85: 85% finished by'))));
      box.appendChild(lastBox);
      box.appendChild(chart);

      function roll(n) {
        for (var i = 0; i < n; i++) {
          last = MC_TASKS.map(function (t) { return P.betaPert(rand, t.o, t.m, t.p); });
          totals.push(last.reduce(function (a, b) { return a + b; }, 0));
        }
        draw();
      }
      function reset() { rand = P.rng(42); totals = []; last = null; draw(); }

      function draw() {
        count.textContent = String(totals.length);
        var sorted = totals.slice().sort(function (a, b) { return a - b; }), enough = totals.length >= 20;
        p50.textContent = enough ? fmt(P.percentile(sorted, 0.5)) + ' days' : '-';
        p85.textContent = enough ? fmt(P.percentile(sorted, 0.85)) + ' days' : '-';
        lastBox.innerHTML = '';
        if (last) {
          lastBox.appendChild(h('p', null, h('b', null, 'The last project played: '), MC_TASKS.map(function (t, i) {
            return [i ? ' + ' : '', h('span', { class: 'mc-draw' }, t.name + ' ' + fmt(last[i]))];
          }), ' = ', h('b', null, fmt(last.reduce(function (a, b) { return a + b; }, 0)) + ' days')));
        } else lastBox.appendChild(h('p', { class: 'muted' }, 'Roll once to play one possible project: each task draws a time between its best and worst case, most often near the likely one.'));
        chart.innerHTML = '';
        if (enough) chart.appendChild(U.toolKit.histogram(sorted, P.percentile(sorted, 0.5), P.percentile(sorted, 0.85), 'days', 'mc-hist', U.toolKit.chartWidth(chart, 640)));
        else chart.appendChild(S('svg', { viewBox: '0 0 520 170', class: 'hist mc-hist', role: 'img', 'aria-label': 'An empty chart: roll at least 20 times' },
          S('line', { class: 'hist-axis', x1: 8, x2: 512, y1: 136, y2: 136 }),
          S('text', { class: 'hist-tick', x: 260, y: 80, 'text-anchor': 'middle' }, totals.length ? 'A few more rolls: the shape appears from 20.' : 'Roll to see how long the project takes, again and again.')));
      }
      reset();
    }
  };

  /* ---------- reading a burn-down ---------- */

  var PATTERNS = [
    { id: 'healthy', name: 'Close to the line', left: [40, 37, 33, 30, 27, 22, 18, 14, 10, 5, 0],
      means: 'Work is being finished, a bit at a time, all through the Sprint. The wobbles are normal.',
      ask: 'Nothing special. Keep asking what is left and what is in the way.' },
    { id: 'cliff', name: 'Flat, then a cliff', left: [40, 40, 39, 39, 38, 38, 37, 36, 20, 8, 2],
      means: 'Work is happening but not finishing: stories are too big, or they are closed only at the end (often because testing happens at the end). Until the cliff, nobody can tell how the Sprint is going.',
      ask: '"What would it take to finish one story today?" At refinement: split stories so each can be finished in a day or two.' },
    { id: 'scope', name: 'Goes up in the middle', left: [40, 36, 32, 29, 38, 35, 31, 27, 22, 17, 12],
      means: 'Work was added during the Sprint. Sometimes that is right (a production bug); often it is "just one small thing".',
      ask: '"What came in, and what goes out to make room?" Check it against the Sprint Goal with the Product Owner. A burn-up chart shows added work as its own line.' },
    { id: 'stalled', name: 'Above the line, flattening', left: [40, 39, 37, 36, 34, 33, 32, 31, 30, 29, 28],
      means: 'The team took on more than it can finish, or something is blocking several items at once (an environment, a dependency, interruptions).',
      ask: 'By the middle of the Sprint: "Which items do we drop, and does the Sprint Goal still hold?" Talk to the Product Owner then, not on the last day.' },
    { id: 'tail', name: 'Fast, then stuck near zero', left: [40, 32, 25, 18, 12, 8, 6, 6, 6, 6, 6],
      means: 'Most items finished early, and the last few are stuck: waiting for a review, another team, a decision, or a test environment.',
      ask: '"What is blocking the last items, and who can unblock them today?" Then make it the first topic, not the last.' }
  ];

  U.explainers['burn-down'] = {
    render: function (box) {
      var current = 'cliff';
      var buttons = h('div', { class: 'row bd-buttons' }), chart = h('div'), explain = h('div', { class: 'bd-explain callout callout-info' });
      box.appendChild(buttons);
      box.appendChild(h('div', { class: 'bd-layout' }, chart, explain));

      function draw() {
        var p = PATTERNS.filter(function (x) { return x.id === current; })[0];
        buttons.innerHTML = '';
        PATTERNS.forEach(function (x) {
          buttons.appendChild(h('button', { class: 'btn btn-small bd-pattern' + (x.id === current ? ' btn-primary' : ''), type: 'button', 'data-pattern': x.id,
            'aria-pressed': x.id === current ? 'true' : 'false', onclick: function () { current = x.id; draw(); } }, x.name));
        });
        var W = U.toolKit.chartWidth(chart, 520), H = 250, L = 40, R = 24, T = 14, B = 40, max = 44;
        function x(d) { return L + d / 10 * (W - L - R); }
        function y(v) { return T + (1 - v / max) * (H - T - B); }
        var line = p.left.map(function (v, d) { return (d ? 'L' : 'M') + x(d).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
        var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'bd-chart', role: 'img', 'aria-label': 'Burn-down: ' + p.name },
          [0, 10, 20, 30, 40].map(function (v) {
            return [S('line', { class: 'cone-grid', x1: L, x2: W - R, y1: y(v), y2: y(v) }), S('text', { class: 'hist-tick', x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, String(v))];
          }),
          S('path', { class: 'bd-ideal', d: 'M' + x(0) + ' ' + y(40) + ' L' + x(10) + ' ' + y(0) }),
          S('path', { class: 'bd-actual', d: line }),
          p.left.map(function (v, d) { return S('circle', { class: 'bd-dot', cx: x(d), cy: y(v), r: 3.5 }); }),
          [0, 2, 4, 6, 8, 10].map(function (d) { return S('text', { class: 'hist-tick', x: x(d), y: H - 20, 'text-anchor': d === 0 ? 'start' : d === 10 ? 'end' : 'middle' }, 'day ' + d); }),
          S('text', { class: 'hist-tick', x: L, y: T - 2 }, 'points left'),
          S('text', { class: 'bd-legend', x: W - R, y: T + 10, 'text-anchor': 'end' }, 'dashed: the ideal pace'));
        chart.innerHTML = '';
        chart.appendChild(svg);
        explain.dataset.pattern = p.id;
        explain.innerHTML = '';
        explain.appendChild(h('div', { class: 'callout-title' }, p.name));
        explain.appendChild(h('p', null, h('b', null, 'What it usually means: '), p.means));
        explain.appendChild(h('p', null, h('b', null, 'What to ask: '), p.ask));
      }
      draw();
    }
  };
})(window.LELT);
