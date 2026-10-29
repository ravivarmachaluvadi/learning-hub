/*
 * views/explainers/eng.js - the picture for the engineering explainer (the text is in
 * data/explainers.js): WIP and Little's law. Registers LELT.explainers[id] = {render(container)}.
 *
 * Cycle time = work in progress / throughput. With "the cost of switching" on, throughput drops by
 * Gerald Weinberg's rule of thumb for the time a person keeps for real work when juggling items:
 * 1 item 100%, 2 items 80%, 3 items 60%, 4 items 40%, 5 or more 25% (straight lines between).
 */
(function (U) {
  'use strict';
  var h = U.h, S = U.toolKit.svg;
  U.explainers = U.explainers || {};

  var USEFUL = [1, 1, 0.8, 0.6, 0.4, 0.25];
  function useful(each) {
    if (each <= 1) return 1;
    if (each >= 5) return USEFUL[5];
    var lo = Math.floor(each);
    return USEFUL[lo] + (USEFUL[lo + 1] - USEFUL[lo]) * (each - lo);
  }
  function fmt(v) { return String(Math.round(v * 100) / 100); }
  function slider(id, label, min, max, value) {
    var input = h('input', { type: 'range', class: 'range', id: id, min: String(min), max: String(max), step: '1' });
    input.value = String(value);
    var out = h('b', { class: 'll-value' });
    return { input: input, out: out, el: h('div', { class: 'field' }, h('label', { for: id }, label, ': ', out), input) };
  }

  U.explainers['littles-law'] = {
    render: function (box) {
      var wip = slider('ll-wip', 'Items in progress', 1, 40, 20);
      var tp = slider('ll-tp', 'Items finished a week', 1, 20, 5);
      var people = slider('ll-people', 'People on the team', 1, 12, 5);
      var sw = h('input', { type: 'checkbox', id: 'll-switch' });
      var result = h('div', { class: 'll-result callout callout-info' });
      var pic = h('div', { class: 'll-pic' }), table = h('div', { class: 'table-wrap' });
      box.appendChild(h('div', { class: 'field-row' }, wip.el, tp.el));
      box.appendChild(h('label', { class: 'pb-check ll-switch-row' }, sw, h('span', null, 'Count the cost of switching between items (Weinberg\'s rule of thumb)')));
      var peopleRow = h('div', { class: 'll-people' }, people.el);
      box.appendChild(peopleRow);
      box.appendChild(result);
      box.appendChild(pic);
      box.appendChild(table);

      function cycle(w, t, n, on) {
        var each = w / n, keep = on ? useful(each) : 1;
        return { each: each, keep: keep, throughput: t * keep, weeks: w / (t * keep) };
      }

      function draw() {
        var w = +wip.input.value, t = +tp.input.value, n = +people.input.value, on = sw.checked;
        wip.out.textContent = String(w);
        tp.out.textContent = String(t);
        people.out.textContent = String(n);
        peopleRow.hidden = !on;
        var c = cycle(w, t, n, on);
        result.innerHTML = '';
        result.appendChild(h('div', { class: 'callout-title' }, 'Each item takes about'));
        result.appendChild(h('p', { class: 'll-big' }, h('b', { id: 'll-cycle', 'data-weeks': fmt(c.weeks) }, fmt(c.weeks) + (c.weeks === 1 ? ' week' : ' weeks')),
          h('span', { class: 'faint', id: 'll-days' }, ' · about ' + Math.round(c.weeks * 5) + ' working days from start to finish')));
        result.appendChild(h('p', null, w + ' in progress ÷ ' + fmt(c.throughput) + ' finished a week = ' + fmt(c.weeks) + ' weeks.' +
          (on ? ' With ' + fmt(c.each) + ' items each, people keep about ' + Math.round(c.keep * 100) + '% of their time for the work, so the team finishes ' +
            fmt(c.throughput) + ' a week instead of ' + t + '.' : '')));

        // the board: one card per item in progress, and the time each one takes as a bar
        var W = U.toolKit.chartWidth(pic, 640), per = Math.min(10, Math.max(5, Math.floor((W - 20) / 28))), rows = Math.ceil(w / per);
        var cw = 22, gap = 6, top = 26, H = top + rows * (cw + gap) + 58, maxWeeks = Math.max(8, Math.ceil(c.weeks));
        var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'll-svg', role: 'img', 'aria-label': w + ' items in progress; each takes about ' + fmt(c.weeks) + ' weeks' },
          S('text', { class: 'hist-label', x: 10, y: 16 }, 'In progress: ' + w));
        for (var i = 0; i < w; i++) {
          svg.appendChild(S('rect', { class: 'll-card', x: 10 + (i % per) * (cw + gap), y: top + Math.floor(i / per) * (cw + gap), width: cw, height: cw, rx: 4 }));
        }
        var by = top + rows * (cw + gap) + 14, bw = W - 20;
        svg.appendChild(S('text', { class: 'hist-label', x: 10, y: by }, 'Time each item takes'));
        svg.appendChild(S('rect', { class: 'll-track', x: 10, y: by + 8, width: bw, height: 14, rx: 7 }));
        svg.appendChild(S('rect', { class: 'll-bar', x: 10, y: by + 8, width: Math.max(4, bw * Math.min(1, c.weeks / maxWeeks)), height: 14, rx: 7 }));
        svg.appendChild(S('text', { class: 'hist-tick', x: 10, y: by + 38 }, '0'));
        svg.appendChild(S('text', { class: 'hist-tick', x: 10 + bw, y: by + 38, 'text-anchor': 'end' }, maxWeeks + ' weeks'));
        pic.innerHTML = '';
        pic.appendChild(svg);

        // what halving or doubling the work in progress would do
        table.innerHTML = '';
        table.appendChild(h('table', { class: 'table ll-table' },
          h('thead', null, h('tr', null, h('th', null, 'In progress'), h('th', null, 'Finished a week'), h('th', null, 'Each item takes'))),
          h('tbody', null, [Math.max(1, Math.round(w / 2)), w, Math.min(80, w * 2)].map(function (x) {
            var r = cycle(x, t, n, on);
            return h('tr', { class: x === w ? 'is-now' : null }, h('td', null, String(x)), h('td', null, fmt(r.throughput)), h('td', null, fmt(r.weeks) + ' weeks'));
          }))));
      }
      [wip, tp, people].forEach(function (x) { x.input.addEventListener('input', draw); });
      sw.addEventListener('change', draw);
      draw();
    }
  };
})(window.LELT);
