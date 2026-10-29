/*
 * views/assess.js - the self-assessment (#/assess, under the Practice tab): 32 everyday habits of
 * someone who uses Claude Code well, 4 per track. Adapted from the Lead Engineer Learning Tool.
 *
 * You rate each habit from 1 (rarely) to 5 (almost always), as you are today. A track's score is the
 * average of its 4 habits. The results show a radar chart with up to three shapes: this time, the time
 * before, and your scenario choices (U.practice, once every track has a played scenario); the two
 * weakest tracks with scenarios and lessons to start with; and your five lowest-rated habits. Every
 * assessment is kept in "clt.assess" as {history: [{at, answers: {id: 1..5}}]}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var SVG = 'http://www.w3.org/2000/svg';
  var SCALE = ['Rarely', 'Sometimes', 'Often', 'Usually', 'Almost always'];

  function state() { return U.store.get('assess', { history: [] }) || { history: [] }; }

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

  /** Up to 3 scenarios (unplayed first) and 2 lessons for a track; tools and playbooks where it has no lessons. */
  function startWith(t) {
    var done = U.store.get('scenarios.done', {}) || {};
    var sc = (U.data.scenarios || []).filter(function (s) { return s.track === t.id; })
      .sort(function (a, b) { return (done[a.id] ? 1 : 0) - (done[b.id] ? 1 : 0); }).slice(0, 3);
    var ls = (U.data.lessons || []).filter(function (l) { return l.track === t.id; }).slice(0, 2)
      .map(function (l) { return { href: '#/lessons/' + l.id, title: l.title }; });
    if (!ls.length) {
      ls = (U.data.tools || []).filter(function (x) { return x.track === t.id; }).map(function (x) { return { href: '#/tools/' + x.id, title: x.title }; })
        .concat((U.data.playbooks || []).filter(function (x) { return x.track === t.id; }).map(function (x) { return { href: '#/playbooks/' + x.id, title: x.title }; }))
        .slice(0, 2);
    }
    return { scenarios: sc, reads: ls };
  }

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
      h('button', { class: 'btn btn-primary', id: 'as-retake', type: 'button', onclick: function () { U.go('#/assess?retake=1'); } }, 'Retake it')));

    var practice = U.practice.complete(), cover = U.practice.coverage();
    var shapes = (prev ? [{ scores: prev, cls: 'prev' }] : []).concat([{ scores: now, cls: 'now', dots: true }], practice ? [{ scores: practice, cls: 'practice' }] : []);
    var chart = h('div', { class: 'card as-chart' }, radar(shapes),
      h('div', { class: 'row radar-legend' },
        h('span', null, h('span', { class: 'swatch now' }), ' This time'),
        prev ? h('span', null, h('span', { class: 'swatch prev' }), ' The time before') : null,
        practice ? h('span', null, h('span', { class: 'swatch practice' }), ' Your scenario choices') : null));
    var table = h('div', { class: 'table-wrap' }, h('table', { class: 'table as-scores' },
      h('thead', null, h('tr', null, h('th', null, 'Track'), h('th', null, 'Score (1 to 5)'), prev ? h('th', null, 'Change') : null,
        practice ? h('th', null, 'Scenarios') : null)),
      h('tbody', null, tracks.map(function (t) {
        var diff = prev ? now[t.id] - prev[t.id] : 0;
        return h('tr', { 'data-track': t.id }, h('td', null, t.name), h('td', null, fmt(now[t.id])),
          prev ? h('td', { class: diff > 0 ? 'up' : diff < 0 ? 'down' : '' }, diff ? (diff > 0 ? '+' : '') + diff.toFixed(1) : '0') : null,
          practice ? h('td', null, fmt(practice[t.id])) : null);
      }))));
    root.appendChild(h('div', { class: 'as-grid' }, chart, h('div', null, table,
      h('p', { class: 'faint' }, 'Retake it every month or two. A lower score after a retake often means you became more honest, not worse.'),
      h('p', { class: 'faint as-practice-note' }, practice
        ? 'The dotted shape is how you chose in the scenarios (strong 5, workable 3, risky 1, on your last play of each): a check on how you see yourself.'
        : ['Play a scenario in each of the 8 tracks to add your choices to the radar as a third shape (' + cover.played + ' of ' + cover.total + ' tracks so far). ',
          h('a', { href: '#/scenarios' }, 'The scenarios →')]),
      h('p', null, h('a', { href: '#/progress' }, 'See all your progress →')))));

    // the two weakest tracks (ties keep the tracks' own order), with what to do first
    var weakest = tracks.slice().sort(function (a, b) { return now[a.id] - now[b.id] || tracks.indexOf(a) - tracks.indexOf(b); }).slice(0, 2);
    var suggest = h('div', { class: 'as-suggest' });
    weakest.forEach(function (t) {
      var w = startWith(t);
      var low = (U.data.assessment || []).filter(function (a) { return a.track === t.id; })
        .sort(function (a, b) { return latest.answers[a.id] - latest.answers[b.id]; }).slice(0, 2);
      suggest.appendChild(h('div', { class: 'card', 'data-track': t.id },
        h('div', { class: 'row' }, U.trackBadge(t.id), h('span', { class: 'faint' }, 'score ' + fmt(now[t.id]))),
        h('h3', null, t.name),
        h('p', { class: 'muted' }, 'Your lowest here: ', low.map(function (a, i) { return [i ? '; ' : '', h('span', { html: '"' + U.mdInline(a.text.replace(/\.$/, '')) + '"' })]; }), '.'),
        w.scenarios.length ? [h('b', null, 'Play'), h('ul', null, w.scenarios.map(function (s) { return h('li', null, h('a', { href: '#/scenarios/' + s.id }, s.title)); }))] : null,
        w.reads.length ? [h('b', null, 'Read or use'), h('ul', null, w.reads.map(function (x) { return h('li', null, h('a', { href: x.href }, x.title)); }))] : null));
    });
    root.appendChild(h('h2', null, 'Where to grow first'));
    root.appendChild(suggest);

    var lowest = (U.data.assessment || []).slice().sort(function (a, b) { return latest.answers[a.id] - latest.answers[b.id]; }).slice(0, 5);
    root.appendChild(h('h2', null, 'Your five lowest-rated habits'));
    root.appendChild(h('p', { class: 'muted' }, 'Pick one and practise it on purpose this week. One habit at a time sticks; five at once do not.'));
    root.appendChild(h('ol', { class: 'as-lowest' }, lowest.map(function (a) {
      return h('li', null, h('span', { html: U.mdInline(a.text) }), ' ', h('span', { class: 'faint' }, '(' + SCALE[latest.answers[a.id] - 1].toLowerCase() + ')'));
    })));
  }

  function form(root, st) {
    var last = st.history[st.history.length - 1];
    var answers = last ? Object.assign({}, last.answers) : {};
    var items = U.data.assessment || [];
    var missingBox = h('div');

    root.appendChild(h('p', { class: 'muted' }, 'Rate each habit as you are today, not as you want to be. Nobody else sees this; it stays in this browser. About five minutes.'));
    (U.data.tracks || []).forEach(function (t) {
      var mine = items.filter(function (a) { return a.track === t.id; });
      if (!mine.length) return;
      root.appendChild(h('div', { class: 'track-title' }, U.trackBadge(t.id), h('h2', null, t.name)));
      mine.forEach(function (a) {
        root.appendChild(h('fieldset', { class: 'as-item', 'data-id': a.id },
          h('legend', { html: U.mdInline(a.text) }),
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
      last ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { U.go('#/assess'); } }, 'Cancel') : null));

    function save() {
      var missing = items.filter(function (a) { return !answers[a.id]; });
      missingBox.innerHTML = '';
      U.$$('.as-item.missing', root).forEach(function (el) { el.classList.remove('missing'); });
      if (missing.length) {
        missing.forEach(function (a) { var el = U.$('.as-item[data-id="' + a.id + '"]', root); if (el) el.classList.add('missing'); });
        missingBox.appendChild(h('p', { class: 'as-missing callout callout-warn' }, U.plural(missing.length, 'habit') + ' still unanswered (marked). Answer every one for a fair score.'));
        var first = U.$('.as-item.missing', root);
        if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      var s = state();
      s.history.push({ at: new Date().toISOString(), answers: answers });
      U.store.set('assess', s);
      U.go('#/assess');
    }
  }

  U.views.assess = {
    render: function (root, params, query) {
      var st = state();
      root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/scenarios' }, 'Practice'), ' › Self-assessment'));
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Self-assessment: where are you strong, and where to grow?'),
        h('p', null, 'Using Claude Code well is eight kinds of habit, and most people are strong in two or three. Rate 32 everyday habits, ' +
          'see your profile on a radar chart beside the choices you make in the scenarios, and get the scenarios and lessons to start with.')));
      if (st.history.length && !query.retake) results(root, st);
      else form(root, st);
    }
  };
  U.views.assess.scores = scores;
  U.views.assess.radar = radar;
  U.route('assess', U.views.assess);
})(window.CLT);
