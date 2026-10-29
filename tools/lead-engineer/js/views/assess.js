/*
 * views/assess.js - "Start here" (#/start): a self-assessment of 30 behaviours of a lead engineer.
 *
 * You rate each behaviour from 1 (rarely) to 5 (almost always), as you are today. Each track's score
 * is the average of its behaviours. The results show a radar chart (this time and the time before),
 * the two weakest tracks with scenarios and lessons to start with, and your five lowest-rated
 * behaviours. Every assessment is kept in "lelt.assess" as {history: [{at, answers: {id: 1..5}}]}.
 * Once a week of scenarios is finished (js/views/week.js), its practice scores are a third shape.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var SVG = 'http://www.w3.org/2000/svg';
  var SCALE = ['Rarely', 'Sometimes', 'Often', 'Usually', 'Almost always'];

  function state() { return U.store.get('assess', { history: [] }); }

  /** {trackId: average 1..5} for one set of answers. */
  function scores(answers) {
    var sum = {}, n = {};
    (U.data.assessment || []).forEach(function (a) {
      if (!answers[a.id]) return;
      sum[a.track] = (sum[a.track] || 0) + answers[a.id];
      n[a.track] = (n[a.track] || 0) + 1;
    });
    var out = {};
    (U.data.tracks || []).forEach(function (t) { out[t.id] = n[t.id] ? sum[t.id] / n[t.id] : 0; });
    return out;
  }

  function svg(tag, attrs) {
    var el = document.createElementNS(SVG, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  /**
   * A radar chart: one axis per track, rings at 1..5, and a shape for each of
   * shapes: [{scores: {trackId: 1..5}, cls: 'now'|'prev'|'practice', dots: true to mark its corners}].
   */
  function radar(shapes) {
    var tracks = U.data.tracks || [];
    var W = 460, H = 400, cx = 230, cy = 200, R = 140, n = tracks.length;
    function at(i, r) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }
    var root = svg('svg', { class: 'radar', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Your scores by track, from 1 to 5' });
    for (var ring = 1; ring <= 5; ring++) {
      root.appendChild(svg('polygon', { class: 'radar-ring', points: tracks.map(function (t, i) { return at(i, R * ring / 5).join(','); }).join(' ') }));
    }
    tracks.forEach(function (t, i) {
      var end = at(i, R), lab = at(i, R + 22);
      root.appendChild(svg('line', { class: 'radar-axis', x1: cx, y1: cy, x2: end[0], y2: end[1] }));
      var text = svg('text', { class: 'radar-label', x: lab[0], y: lab[1] + 4,
        'text-anchor': Math.abs(lab[0] - cx) < 8 ? 'middle' : lab[0] < cx ? 'end' : 'start' });
      text.textContent = t.short;
      root.appendChild(text);
    });
    shapes.forEach(function (s) {
      root.appendChild(svg('polygon', { class: 'radar-shape ' + s.cls,
        points: tracks.map(function (t, i) { return at(i, R * (s.scores[t.id] || 0) / 5).join(','); }).join(' ') }));
      if (s.dots) tracks.forEach(function (t, i) {
        var p = at(i, R * (s.scores[t.id] || 0) / 5);
        root.appendChild(svg('circle', { class: 'radar-dot ' + s.cls, cx: p[0], cy: p[1], r: 3.5 }));
      });
    });
    return root;
  }

  function fmt(x) { return x ? x.toFixed(1) : '-'; }

  function results(root, st) {
    var hist = st.history;
    var latest = hist[hist.length - 1], before = hist[hist.length - 2];
    var now = scores(latest.answers), prev = before ? scores(before.answers) : null;
    var tracks = U.data.tracks || [];
    root = root.appendChild(h('section', { class: 'as-results', 'aria-label': 'Your results' }));

    root.appendChild(h('div', { class: 'row as-head' },
      h('h2', { style: { margin: 0 } }, 'Your results'),
      h('span', { class: 'faint' }, 'taken ' + new Date(latest.at).toLocaleDateString() + (hist.length > 1 ? ' · assessment ' + hist.length : '')),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-primary', id: 'as-retake', type: 'button', onclick: function () { U.go('#/start?retake=1'); } }, 'Retake it')));

    var practice = U.week ? U.week.practice() : null;
    var shapes = (prev ? [{ scores: prev, cls: 'prev' }] : []).concat([{ scores: now, cls: 'now', dots: true }], practice ? [{ scores: practice, cls: 'practice' }] : []);
    var chart = h('div', { class: 'card as-chart' }, radar(shapes),
      h('div', { class: 'row radar-legend' },
        h('span', null, h('span', { class: 'swatch now' }), ' This time'),
        prev ? h('span', null, h('span', { class: 'swatch prev' }), ' The time before') : null,
        practice ? h('span', null, h('span', { class: 'swatch practice' }), ' What you chose in ', h('a', { href: '#/week' }, 'A week as a lead')) : null));
    var table = h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('thead', null, h('tr', null, h('th', null, 'Track'), h('th', null, 'Score (1 to 5)'), prev ? h('th', null, 'Change') : null)),
      h('tbody', null, tracks.map(function (t) {
        var diff = prev ? now[t.id] - prev[t.id] : 0;
        return h('tr', null, h('td', null, t.name), h('td', null, fmt(now[t.id])),
          prev ? h('td', { class: diff > 0 ? 'up' : diff < 0 ? 'down' : '' }, diff ? (diff > 0 ? '+' : '') + diff.toFixed(1) : '0') : null);
      }))));
    root.appendChild(h('div', { class: 'as-grid' }, chart, h('div', null, table,
      h('p', { class: 'faint' }, 'Retake it every month or two. A lower score after a retake often means you became more honest, not worse.'),
      h('p', { class: 'faint' }, practice ? ['The dotted shape is how you chose in your last ', h('a', { href: '#/week' }, 'week as a lead'), ': a check on how you see yourself.']
        : ['Play ', h('a', { href: '#/week' }, 'A week as a lead'), ' to compare how you rate yourself with what you choose under pressure.']),
      h('p', null, h('a', { href: '#/progress' }, 'See all your progress →')))));

    // the two weakest tracks (ties keep the tracks' own order), with what to do first
    var weakest = tracks.slice().sort(function (a, b) { return now[a.id] - now[b.id] || tracks.indexOf(a) - tracks.indexOf(b); }).slice(0, 2);
    var suggest = h('div', { class: 'as-suggest' });
    weakest.forEach(function (t) {
      var sc = (U.data.scenarios || []).filter(function (s) { return s.track === t.id; }).slice(0, 3);
      var ls = (U.data.lessons || []).filter(function (l) { return l.track === t.id; }).slice(0, 2);
      var low = (U.data.assessment || []).filter(function (a) { return a.track === t.id; })
        .sort(function (a, b) { return latest.answers[a.id] - latest.answers[b.id]; }).slice(0, 2);
      suggest.appendChild(h('div', { class: 'card', 'data-track': t.id },
        h('div', { class: 'row' }, U.trackBadge(t.id), h('span', { class: 'faint' }, 'score ' + fmt(now[t.id]))),
        h('h3', null, t.name),
        h('p', { class: 'muted' }, 'Your lowest here: ', low.map(function (a, i) { return [i ? '; ' : '', '"' + a.text.replace(/\.$/, '') + '"']; }), '.'),
        sc.length ? [h('b', null, 'Play'), h('ul', null, sc.map(function (s) { return h('li', null, h('a', { href: '#/scenarios/' + s.id }, s.title)); }))] : null,
        ls.length ? [h('b', null, 'Read'), h('ul', null, ls.map(function (l) { return h('li', null, h('a', { href: '#/lessons/' + l.id }, l.title)); }))] : null,
        !sc.length && !ls.length ? h('p', { class: 'faint' }, 'Scenarios and lessons for this track arrive in a later batch. Meanwhile, the ',
          h('a', { href: '#/phrases' }, 'Phrasebook'), ' has words for most situations.') : null));
    });
    root.appendChild(h('h2', null, 'Where to grow first'));
    root.appendChild(suggest);

    var lowest = (U.data.assessment || []).slice().sort(function (a, b) { return latest.answers[a.id] - latest.answers[b.id]; }).slice(0, 5);
    root.appendChild(h('h2', null, 'Your five lowest-rated behaviours'));
    root.appendChild(h('p', { class: 'muted' }, 'Pick one and practise it on purpose this week. One habit at a time sticks; five at once do not.'));
    root.appendChild(h('ol', { class: 'as-lowest' }, lowest.map(function (a) {
      return h('li', null, a.text, ' ', h('span', { class: 'faint' }, '(' + SCALE[latest.answers[a.id] - 1].toLowerCase() + ')'));
    })));
  }

  function form(root, st) {
    var last = st.history[st.history.length - 1];
    var answers = last ? Object.assign({}, last.answers) : {};
    var items = U.data.assessment || [];
    var missingBox = h('div');

    root.appendChild(h('p', { class: 'muted' }, 'Rate each behaviour as you are today, not as you want to be. Nobody else sees this. It takes about five minutes.'));
    (U.data.tracks || []).forEach(function (t) {
      var mine = items.filter(function (a) { return a.track === t.id; });
      if (!mine.length) return;
      root.appendChild(h('div', { class: 'track-title' }, U.trackBadge(t.id), h('h2', null, t.name)));
      mine.forEach(function (a) {
        root.appendChild(h('fieldset', { class: 'as-item', 'data-id': a.id },
          h('legend', null, a.text),
          h('div', { class: 'as-scale' }, SCALE.map(function (label, i) {
            var input = h('input', { type: 'radio', name: 'as-' + a.id, value: i + 1, onchange: function () { answers[a.id] = i + 1; } });
            if (answers[a.id] === i + 1) input.checked = true;
            return h('label', { class: 'as-choice' }, input, h('span', null, (i + 1) + ' · ' + label));
          }))));
      });
    });
    root.appendChild(missingBox);
    root.appendChild(h('div', { class: 'row' },
      h('button', { class: 'btn btn-primary', id: 'as-save', type: 'button', onclick: save }, 'See my results'),
      last ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { U.go('#/start'); } }, 'Cancel') : null));

    function save() {
      var missing = items.filter(function (a) { return !answers[a.id]; });
      missingBox.innerHTML = '';
      U.$$('.as-item.missing', root).forEach(function (el) { el.classList.remove('missing'); });
      if (missing.length) {
        missing.forEach(function (a) { var el = U.$('.as-item[data-id="' + a.id + '"]', root); if (el) el.classList.add('missing'); });
        missingBox.appendChild(h('p', { class: 'as-missing callout callout-warn' }, U.plural(missing.length, 'behaviour') + ' still unanswered (marked). Answer every one for a fair score.'));
        var first = U.$('.as-item.missing', root);
        if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      var s = state();
      s.history.push({ at: new Date().toISOString(), answers: answers });
      U.store.set('assess', s);
      U.go('#/start');
    }
  }

  U.views.start = {
    render: function (root, params, query) {
      var st = state();
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Start here: where are you strong, and where to grow?'),
        h('p', null, 'A lead engineer is judged on seven areas, and most new leads are strong in one or two. Rate 30 everyday behaviours, ' +
          'see your profile on a radar chart, and get the scenarios and lessons to start with.')));
      if (st.history.length && !query.retake) results(root, st);
      else form(root, st);
    }
  };
  U.views.start.scores = scores;
  U.views.start.radar = radar;
  U.route('start', U.views.start);
})(window.LELT);
