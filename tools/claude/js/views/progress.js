/*
 * views/progress.js - your progress (#/progress, under the Practice tab): everything this browser
 * holds about what you have done, read back from storage and shown by track, with what to do next.
 * Adapted from the Lead Engineer Learning Tool.
 *
 *   scenarios   "clt.scenarios.done": played, and strong moves on the last play of each
 *   lessons     "clt.quiz.scores": a lesson with a score is done; quiz answers right of all answered
 *   review      questions due in "clt.quiz.review"
 *   self        the latest self-assessment ("clt.assess"); practice: U.practice, from the scenarios
 *
 * Activity counts dated events in each of the last 8 weeks (rolling 7-day windows, the newest on the
 * right): the last play of each scenario, each finished lesson and each self-assessment.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var DAY = 86400000, WEEKS = 8;

  function pct(a, b) { return b ? Math.round(100 * a / b) + '%' : '-'; }
  function fmt(x) { return x ? x.toFixed(1) : '-'; }

  function gather() {
    var d = U.data, done = U.store.get('scenarios.done', {}) || {}, scores = U.quiz.scores() || {};
    var assess = (U.store.get('assess', { history: [] }) || {}).history || [];
    var played = (d.scenarios || []).filter(function (s) { return done[s.id]; });
    var lessonsDone = (d.lessons || []).filter(function (l) { return scores[l.id]; });
    return {
      done: done, scores: scores, played: played, lessonsDone: lessonsDone,
      best: played.reduce(function (n, s) { return n + (done[s.id].best || 0); }, 0),
      decisions: played.reduce(function (n, s) { return n + (done[s.id].total || 0); }, 0),
      right: lessonsDone.reduce(function (n, l) { return n + (scores[l.id].right || 0); }, 0),
      answered: lessonsDone.reduce(function (n, l) { return n + (scores[l.id].total || 0); }, 0),
      due: U.quiz.due().length,
      assess: assess, self: assess.length ? U.views.assess.scores(assess[assess.length - 1].answers || {}) : null,
      practice: U.practice.scores(), practiceAll: U.practice.complete(),
      empty: !played.length && !lessonsDone.length && !assess.length
    };
  }

  /** Dated events per rolling week: [{ago: 0..7, count}], oldest first. */
  function activity(g) {
    var now = Date.now(), counts = [];
    for (var i = 0; i < WEEKS; i++) counts.push(0);
    function at(t) {
      var ms = Date.parse(t);
      if (isNaN(ms)) return;
      var k = Math.floor((now - ms) / DAY / 7);
      if (k >= 0 && k < WEEKS) counts[k]++;
    }
    Object.keys(g.done).forEach(function (id) { at(g.done[id] && g.done[id].at); });
    Object.keys(g.scores).forEach(function (id) { at(g.scores[id] && g.scores[id].at); });
    g.assess.forEach(function (a) { at(a.at); });
    return counts.map(function (c, k) { return { ago: k, count: c }; }).reverse();
  }

  /** Drawn at the card's own width (up to 1200), so its labels stay at their real size. */
  function chart(bars, box) {
    var K = U.toolKit;   // js/views/tools.js loads after this file
    var W = Math.max(280, Math.min(1200, Math.round(box.clientWidth - 34) || 600)), H = 150, padB = 26, top = 18, gap = 8;
    var max = Math.max.apply(null, bars.map(function (b) { return b.count; })) || 1;
    var bw = (W - gap * (bars.length + 1)) / bars.length;
    var svg = K.svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'pg-chart', id: 'pg-activity', role: 'img',
      'aria-label': 'What you did in each of the last 8 weeks, the newest on the right' });
    bars.forEach(function (b, i) {
      var x = gap + i * (bw + gap), bh = b.count / max * (H - padB - top);
      svg.appendChild(K.svg('rect', { class: 'pg-bar' + (b.ago === 0 ? ' now' : ''), x: x, y: H - padB - bh, width: bw, height: Math.max(bh, b.count ? 2 : 0),
        'data-ago': b.ago, 'data-count': b.count }));
      if (b.count) svg.appendChild(K.svg('text', { class: 'pg-count', x: x + bw / 2, y: H - padB - bh - 4, 'text-anchor': 'middle' }, String(b.count)));
    });
    svg.appendChild(K.svg('line', { class: 'hist-axis', x1: gap, x2: W - gap, y1: H - padB, y2: H - padB }));
    svg.appendChild(K.svg('text', { class: 'hist-tick', x: gap, y: H - 8 }, '8 weeks ago'));
    svg.appendChild(K.svg('text', { class: 'hist-tick', x: W - gap, y: H - 8, 'text-anchor': 'end' }, 'this week'));
    return svg;
  }

  /** The track to work on: lowest in the scenarios, else in the self-assessment, else least practised. */
  function focusTrack(g) {
    var tracks = U.data.tracks || [];
    function by(f) { return tracks.slice().sort(function (a, b) { return f(a) - f(b) || tracks.indexOf(a) - tracks.indexOf(b); })[0]; }
    if (g.practiceAll) return by(function (t) { return g.practiceAll[t.id] || 9; });
    if (g.self) return by(function (t) { return g.self[t.id] || 9; });
    return by(function (t) {
      var all = (U.data.scenarios || []).filter(function (s) { return s.track === t.id; });
      return all.length ? all.filter(function (s) { return g.done[s.id]; }).length / all.length : 9;
    });
  }

  function nextSteps(g) {
    var out = [];
    if (g.due) out.push(['#/lessons/review', 'Review the ' + U.plural(g.due, 'quiz question') + ' you missed', 'They come back until you know them.']);
    if (!g.assess.length) out.push(['#/assess', 'Take the self-assessment', 'Five minutes; it points you at your two weakest tracks.']);
    var t = focusTrack(g);
    if (t) {
      var s = (U.data.scenarios || []).filter(function (x) { return x.track === t.id && !g.done[x.id]; })[0];
      var l = (U.data.lessons || []).filter(function (x) { return x.track === t.id && !g.scores[x.id]; })[0];
      if (s) out.push(['#/scenarios/' + s.id, 'Play "' + s.title + '"', 'A ' + t.name + ' scenario you have not played: your focus for now.']);
      if (l) out.push(['#/lessons/' + l.id, 'Read "' + l.title + '"', t.name + ', ' + l.minutes + ' minutes.']);
    }
    var retry = (U.data.scenarios || []).filter(function (x) { var r = g.done[x.id]; return r && r.best < r.total; })[0];
    if (retry) out.push(['#/scenarios/' + retry.id, 'Play "' + retry.title + '" again', 'Last time: strong ' + g.done[retry.id].best + ' of ' + g.done[retry.id].total + '.']);
    var last = g.assess[g.assess.length - 1];
    if (last && (Date.now() - Date.parse(last.at)) / DAY > 30) {
      out.push(['#/assess?retake=1', 'Retake the self-assessment', 'Last taken ' + Math.floor((Date.now() - Date.parse(last.at)) / DAY) + ' days ago.']);
    }
    out.push(['#/current', 'Check the facts are still current', 'After a Claude Code update: what changed in the docs this tool cites.']);
    return out.slice(0, 6);
  }

  function stat(key, value, label) {
    return h('div', { class: 'stat', 'data-stat': key }, h('b', null, value), h('span', null, label));
  }

  U.views.progress = {
    render: function (root) {
      var g = gather(), d = U.data;
      root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/scenarios' }, 'Practice'), ' › Your progress'));
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Your progress'),
        h('p', null, 'Everything this browser holds about what you have practised, by track, and what to do next. ' +
          'It is read from this browser only; back it up from the home page.')));
      if (g.empty) {
        root.appendChild(h('div', { class: 'card pg-empty' },
          h('h2', null, 'Nothing here yet'),
          h('p', null, 'Your progress appears here as you go. Three good places to begin:'),
          h('ol', null,
            h('li', null, h('a', { href: '#/assess' }, 'Take the self-assessment'), ': five minutes, and it shows your two weakest tracks.'),
            h('li', null, h('a', { href: '#/scenarios/context-85' }, 'Play "Context at 85% in the middle of a phase"'), ', the situation the phase loop was built for.'),
            h('li', null, h('a', { href: '#/lessons/first-session' }, 'Read the first lesson'), ' and take its quiz.'))));
        return;
      }
      root.appendChild(h('div', { class: 'pg-tiles' },
        stat('scenarios', g.played.length + ' of ' + (d.scenarios || []).length, 'scenarios played'),
        stat('strong', pct(g.best, g.decisions), 'strong moves, on your last play of each'),
        stat('lessons', g.lessonsDone.length + ' of ' + (d.lessons || []).length, 'lessons done'),
        stat('quiz', pct(g.right, g.answered), 'quiz answers right'),
        stat('due', String(g.due), 'quiz questions due for review'),
        stat('assess', String(g.assess.length), g.assess.length === 1 ? 'self-assessment taken' : 'self-assessments taken')));

      root.appendChild(h('h2', null, 'What to do next'));
      root.appendChild(h('ol', { class: 'pg-next', id: 'pg-next' }, nextSteps(g).map(function (x) {
        return h('li', null, h('a', { href: x[0] }, x[1]), h('span', { class: 'faint' }, ' · ' + x[2]));
      })));

      root.appendChild(h('h2', null, 'By track'));
      var tracks = d.tracks || [];
      var table = h('div', { class: 'table-wrap' }, h('table', { class: 'table stack-table', id: 'pg-tracks' },
        h('thead', null, h('tr', null, ['Track', 'Scenarios', 'Lessons', 'Self-assessment', 'Scenario choices'].map(function (x) { return h('th', null, x); }))),
        h('tbody', null, tracks.map(function (t) {
          var all = (d.scenarios || []).filter(function (s) { return s.track === t.id; });
          var mine = all.filter(function (s) { return g.done[s.id]; });
          var b = mine.reduce(function (n, s) { return n + (g.done[s.id].best || 0); }, 0), n = mine.reduce(function (k, s) { return k + (g.done[s.id].total || 0); }, 0);
          var ls = (d.lessons || []).filter(function (l) { return l.track === t.id; });
          return h('tr', { 'data-track': t.id },
            h('td', null, h('a', { href: '#/scenarios?track=' + t.id }, t.name)),
            h('td', { class: 'pg-scen', 'data-label': 'Scenarios' }, mine.length + ' of ' + all.length + (n ? ' · ' + pct(b, n) + ' strong' : '')),
            h('td', { class: 'pg-lessons', 'data-label': 'Lessons' }, ls.length ? ls.filter(function (l) { return g.scores[l.id]; }).length + ' of ' + ls.length : 'none in this track'),
            h('td', { class: 'pg-self', 'data-label': 'Self-assessment' }, g.self ? fmt(g.self[t.id]) : '-'),
            h('td', { class: 'pg-practice', 'data-label': 'Scenario choices' }, fmt(g.practice[t.id])));
        }))));
      var shapes = [];
      if (g.self) shapes.push({ scores: g.self, cls: 'now', dots: true });
      if (g.practiceAll) shapes.push({ scores: g.practiceAll, cls: 'practice' });
      root.appendChild(h('div', { class: 'as-grid' },
        shapes.length ? h('div', { class: 'card as-chart pg-radar' }, U.views.assess.radar(shapes),
          h('div', { class: 'row radar-legend' },
            g.self ? h('span', null, h('span', { class: 'swatch now' }), ' Your self-assessment') : null,
            g.practiceAll ? h('span', null, h('span', { class: 'swatch practice' }), ' Your scenario choices') : null))
          : h('div', { class: 'card' }, h('p', { class: 'muted', style: { margin: 0 } }, 'Take the ', h('a', { href: '#/assess' }, 'self-assessment'),
            ', or play a scenario in every track, to see your profile as a radar chart.')),
        h('div', null, table,
          h('p', { class: 'faint' }, 'Scenarios: played of all, with the strong moves on your last play of each. Self-assessment: how you rated yourself, 1 to 5. ' +
            'Scenario choices: the same scale from what you chose (strong 5, workable 3, risky 1).'))));

      root.appendChild(h('h2', null, 'Activity, the last 8 weeks'));
      var box = h('div', { class: 'card pg-activity-card' });
      root.appendChild(box);
      box.appendChild(chart(activity(g), box));
      box.appendChild(h('p', { class: 'faint', style: { margin: '6px 0 0' } }, 'Each scenario and lesson counts once, on the day you last finished it; so does each self-assessment.'));
    }
  };
  U.route('progress', U.views.progress);
})(window.CLT);
