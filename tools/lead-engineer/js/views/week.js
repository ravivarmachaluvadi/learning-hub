/*
 * views/week.js - "A week as a lead" (#/week, under the Scenarios tab): twelve scenarios from every
 * part of the job, spread over Monday to Friday and scored per track.
 *
 * Picking: one scenario from each of the 7 tracks; after a self-assessment, two more from each of the
 * two weakest tracks, and the rest from the tracks in turn. In each track, scenarios not played yet
 * come first, then the ones played longest ago. The twelve are shuffled and spread 3, 2, 3, 2, 2 over
 * the days.
 *
 * Each one is played in the normal player (#/scenarios/<id>?week=1), which shows the day and records
 * the first play: as at work, you do not get Tuesday again.
 *
 * Scoring: in each track, a strong move counts 1, a workable one 0.5 and a risky one 0, over all the
 * decisions in that track's scenarios. The practice score is 1 + 4 x that share, so it sits on the
 * self-assessment's 1-to-5 scale and is drawn as a second shape on the radar (Start here, Progress).
 *
 * Kept in "lelt.week": {current: {id, startedAt, picks: [{id, day}], results: {scenarioId: {path,
 * best, ok, poor, decisions, meters, at}}, finishedAt}, history: [finished weeks, newest first]}.
 */
(function (U) {
  'use strict';
  var h = U.h;

  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  var PER_DAY = [3, 2, 3, 2, 2];
  var SIZE = 12;
  var KEEP = 12;   // finished weeks kept in the history
  var METERS = [['trust', 'Trust'], ['delivery', 'Delivery'], ['team', 'Team']];
  var POINTS = { best: 1, ok: 0.5, poor: 0 };

  function trackIds() { return (U.data.tracks || []).map(function (t) { return t.id; }); }

  function shuffled(list, rand) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /** The day (0 = Monday) of the n-th scenario of the week. */
  function dayOf(n) {
    for (var d = 0, upto = 0; d < PER_DAY.length; d++) { upto += PER_DAY[d]; if (n < upto) return d; }
    return PER_DAY.length - 1;
  }

  /**
   * Twelve scenarios for a week: [{id, day}] in the order they are played.
   * o: {rng: a random function (a seeded one in the tests), weak: the two weakest track ids or null,
   *     done: "lelt.scenarios.done", so unplayed scenarios come first}
   */
  function pick(o) {
    o = o || {};
    var rand = o.rng || Math.random, done = o.done || {}, tracks = trackIds(), pools = {}, chosen = [];
    tracks.forEach(function (t) {
      var list = (U.data.scenarios || []).filter(function (s) { return s.track === t; }).map(function (s) { return { s: s, r: rand() }; });
      list.sort(function (a, b) {
        var da = done[a.s.id], db = done[b.s.id];
        if (!da !== !db) return da ? 1 : -1;
        var aa = da ? String(da.at || '') : '', bb = db ? String(db.at || '') : '';
        return aa < bb ? -1 : aa > bb ? 1 : a.r - b.r;
      });
      pools[t] = list.map(function (x) { return x.s; });
    });
    function take(t) { var s = (pools[t] || []).shift(); if (s) chosen.push(s); return !!s; }
    tracks.forEach(take);
    (o.weak || []).filter(function (t) { return pools[t]; }).slice(0, 2).forEach(function (t) { take(t); take(t); });
    var order = shuffled(tracks, rand);
    for (var i = 0, guard = 0; chosen.length < SIZE && guard < 200; i++, guard++) take(order[i % order.length]);
    return shuffled(chosen, rand).map(function (s, n) { return { id: s.id, day: dayOf(n) }; });
  }

  function state() {
    var st = U.store.get('week', null);
    if (!st || typeof st !== 'object') st = {};
    if (!Array.isArray(st.history)) st.history = [];
    if (!st.current || !Array.isArray(st.current.picks)) st.current = null;
    else if (!st.current.results || typeof st.current.results !== 'object') st.current.results = {};
    return st;
  }

  /** The two weakest tracks in the latest self-assessment (ties keep the tracks' order), or null. */
  function weakest() {
    var hist = U.store.get('assess', { history: [] }).history || [];
    if (!hist.length || !U.views.start) return null;
    var sc = U.views.start.scores(hist[hist.length - 1].answers || {}), tracks = trackIds();
    return tracks.slice().sort(function (a, b) { return sc[a] - sc[b] || tracks.indexOf(a) - tracks.indexOf(b); }).slice(0, 2);
  }

  /** Start a new week: a finished one goes into the history, an unfinished one is dropped. */
  function start(o) {
    o = o || {};
    var st = state();
    if (st.current && st.current.finishedAt) {
      st.history.unshift(st.current);
      st.history = st.history.slice(0, KEEP);
    }
    st.current = { id: 'w' + Date.now().toString(36), startedAt: new Date().toISOString(),
      picks: pick({ rng: o.rng, weak: weakest(), done: U.store.get('scenarios.done', {}) }), results: {} };
    U.store.set('week', st);
    return st.current;
  }

  /** Record the first play of a scenario in this week (the player calls this). -> true if recorded. */
  function record(id, path) {
    var st = state(), w = st.current, s = U.find('scenarios', id);
    if (!w || w.finishedAt || !s || w.results[id] || !w.picks.some(function (p) { return p.id === id; })) return false;
    var r = { path: [], best: 0, ok: 0, poor: 0, decisions: 0, meters: { trust: 0, delivery: 0, team: 0 }, at: new Date().toISOString() };
    (path || []).forEach(function (p) {
      var o = ((s.steps[p.step] || {}).options || [])[p.opt];
      if (!o) return;
      r.path.push({ step: p.step, opt: p.opt, grade: o.grade });
      r[o.grade]++;
      r.decisions++;
      METERS.forEach(function (m) { r.meters[m[0]] += (o.meters || {})[m[0]] || 0; });
    });
    w.results[id] = r;
    if (w.picks.every(function (p) { return w.results[p.id]; })) w.finishedAt = new Date().toISOString();
    U.store.set('week', st);
    return true;
  }

  /** The scores of a week: per track and in total. practice is 1 to 5, or null with no decisions. */
  function score(w) {
    var out = { tracks: {}, meters: { trust: 0, delivery: 0, team: 0 }, best: 0, decisions: 0, played: 0, total: (w.picks || []).length, finished: !!w.finishedAt };
    trackIds().forEach(function (t) { out.tracks[t] = { scenarios: 0, played: 0, decisions: 0, best: 0, points: 0, practice: null }; });
    (w.picks || []).forEach(function (p) {
      var s = U.find('scenarios', p.id), r = (w.results || {})[p.id];
      if (!s || !out.tracks[s.track]) return;
      var t = out.tracks[s.track];
      t.scenarios++;
      if (!r) return;
      t.played++;
      out.played++;
      t.decisions += r.decisions;
      t.best += r.best;
      t.points += r.best * POINTS.best + r.ok * POINTS.ok;
      out.best += r.best;
      out.decisions += r.decisions;
      METERS.forEach(function (m) { out.meters[m[0]] += (r.meters || {})[m[0]] || 0; });
    });
    Object.keys(out.tracks).forEach(function (k) { var t = out.tracks[k]; if (t.decisions) t.practice = 1 + 4 * t.points / t.decisions; });
    return out;
  }

  /** The most recent finished week, or null. */
  function latest() {
    var st = state();
    return st.current && st.current.finishedAt ? st.current : st.history[0] || null;
  }

  /** {trackId: practice score 1..5} from the latest finished week, or null. */
  function practice() {
    var w = latest();
    if (!w) return null;
    var sc = score(w).tracks, out = {};
    Object.keys(sc).forEach(function (k) { out[k] = sc[k].practice || 0; });
    return out;
  }

  /** Where a scenario sits in the current week, for the player's banner, or null. */
  function info(id) {
    var w = state().current;
    if (!w) return null;
    var at = -1;
    w.picks.forEach(function (p, i) { if (p.id === id) at = i; });
    if (at < 0) return null;
    return { day: DAYS[w.picks[at].day], n: at + 1, total: w.picks.length, recorded: !!w.results[id], finished: !!w.finishedAt };
  }

  function signed(v) { return v > 0 ? '+' + v : String(v); }
  function fmt(x) { return x ? x.toFixed(1) : '-'; }
  function when(iso) { var d = new Date(iso); return isNaN(d) ? '' : U.plan.day(d); }

  /** The track with the lowest practice score, or null when no track is below the others (all level). */
  function lowestOf(sc) {
    var tracks = U.data.tracks || [];
    var scored = tracks.filter(function (t) { return sc.tracks[t.id].practice; });
    var shown = function (t) { return Math.round(10 * sc.tracks[t.id].practice); };
    var sorted = scored.slice().sort(function (a, b) { return shown(a) - shown(b) || tracks.indexOf(a) - tracks.indexOf(b); });
    return sorted.length > 1 && shown(sorted[0]) < shown(sorted[sorted.length - 1]) ? sorted[0] : null;
  }

  /* ---------- the page ---------- */

  function intro(root, st) {
    var weak = weakest();
    root.appendChild(h('div', { class: 'card wk-intro' },
      h('h2', null, 'How it works'),
      h('ul', null,
        h('li', null, 'Twelve situations from a lead\'s week, Monday to Friday, at least one from each of the seven areas of the job.'),
        h('li', null, weak ? ['It leans towards your two weakest areas in the self-assessment: ', h('b', null, weak.map(function (t) { return U.track(t).name; }).join(' and ')), '.']
          : ['Take the ', h('a', { href: '#/start' }, 'self-assessment'), ' first and the week leans towards your two weakest areas.']),
        h('li', null, 'Scenarios you have not played yet come first.'),
        h('li', null, 'Your first answer in each one counts, as it would at work. At the end you see, area by area, how often you made the strong move, and how that compares with how you rated yourself.')),
      h('div', { class: 'row' }, h('button', { class: 'btn btn-primary', id: 'wk-start', type: 'button', onclick: function () { start(); U.render(); } }, 'Start a week'))));
    history(root, st);
  }

  function results(root, w) {
    var sc = score(w), hist = U.store.get('assess', { history: [] }).history || [];
    var self = hist.length && U.views.start ? U.views.start.scores(hist[hist.length - 1].answers || {}) : null;
    var tracks = U.data.tracks || [];
    var box = h('section', { class: 'wk-results', id: 'wk-results', 'aria-label': 'Your week' });
    box.appendChild(h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'Your week'),
      h('span', { class: 'faint' }, when(w.startedAt) + (w.finishedAt && when(w.finishedAt) !== when(w.startedAt) ? ' to ' + when(w.finishedAt) : ''))));
    box.appendChild(h('div', { class: 'wk-tiles' },
      h('div', { class: 'stat' }, h('b', null, sc.best + ' of ' + sc.decisions), h('span', null, 'strong moves')),
      METERS.map(function (m) {
        var v = sc.meters[m[0]];
        return h('div', { class: 'stat wk-meter', 'data-meter': m[0] }, h('b', { class: v > 0 ? 'up' : v < 0 ? 'down' : '' }, v ? signed(v) : '0'), h('span', null, m[1] + ', over the week'));
      })));

    var practiceScores = {};
    tracks.forEach(function (t) { practiceScores[t.id] = sc.tracks[t.id].practice || 0; });
    var shapes = [{ scores: practiceScores, cls: 'practice', dots: true }];
    if (self) shapes.unshift({ scores: self, cls: 'now' });
    var legend = h('div', { class: 'row radar-legend' },
      self ? h('span', null, h('span', { class: 'swatch now' }), ' How you rated yourself') : null,
      h('span', null, h('span', { class: 'swatch practice' }), ' What you chose this week'));
    var rows = tracks.map(function (t) {
      var x = sc.tracks[t.id], gap = self && x.practice ? x.practice - self[t.id] : null;
      return h('tr', { 'data-track': t.id },
        h('td', null, t.name),
        h('td', { class: 'wk-strong', 'data-label': 'Strong moves' }, x.best + ' of ' + x.decisions),
        h('td', { class: 'wk-practice', 'data-label': 'Practice' }, fmt(x.practice)),
        h('td', { class: 'wk-self', 'data-label': 'You rated yourself' }, self ? fmt(self[t.id]) : '-'),
        h('td', { class: gap > 0 ? 'up' : gap < 0 ? 'down' : '', 'data-label': 'Gap' }, gap === null ? '-' : (gap > 0 ? '+' : '') + gap.toFixed(1)));
    });
    box.appendChild(h('div', { class: 'as-grid' },
      h('div', { class: 'card as-chart' }, U.views.start.radar(shapes), legend),
      h('div', null,
        h('div', { class: 'table-wrap' }, h('table', { class: 'table stack-table', id: 'wk-tracks' },
          h('thead', null, h('tr', null, ['Area', 'Strong moves', 'Practice (1 to 5)', 'You rated yourself', 'Gap'].map(function (x) { return h('th', null, x); }))),
          h('tbody', null, rows))),
        h('p', { class: 'faint' }, 'Practice: a strong move counts 1, a workable one half, a risky one nothing, scaled from 1 to 5 like the self-assessment. Twelve scenarios is a small sample: read it as a hint, not a grade.'))));
    box.appendChild(gapCard(sc, self));
    root.appendChild(box);
  }

  /** The biggest difference between how you rated yourself and what you chose, with what to do next. */
  function gapCard(sc, self) {
    var tracks = U.data.tracks || [];
    var withScore = tracks.filter(function (t) { return sc.tracks[t.id].practice; });
    var card = h('div', { class: 'card wk-gap', id: 'wk-gap' });
    var lowest = lowestOf(sc);
    // every area scored the same: say so instead of naming one of them the lowest
    var level = !lowest && withScore.length ? fmt(sc.tracks[withScore[0].id].practice) : null;
    var levelText = level ? 'Every area scored ' + level + ' this week' + (level === '5.0' ? ': you made the strong move every time. ' : ', so none stands out. ') : null;
    if (!self) {
      card.appendChild(h('h3', null, 'Where to look next'));
      card.appendChild(h('p', null, lowest ? ['Your lowest area this week was ', h('b', null, lowest.name), ' (' + fmt(sc.tracks[lowest.id].practice) + '). '] : levelText,
        'Take the ', h('a', { href: '#/start' }, 'self-assessment'), ' to compare how you rate yourself with what you chose.'));
      if (lowest) card.appendChild(next(lowest.id));
      return card;
    }
    var big = withScore.slice().sort(function (a, b) {
      return Math.abs(sc.tracks[b.id].practice - self[b.id]) - Math.abs(sc.tracks[a.id].practice - self[a.id]) || tracks.indexOf(a) - tracks.indexOf(b);
    })[0];
    if (!big) return card;
    var p = sc.tracks[big.id].practice, s = self[big.id], d = p - s;
    card.appendChild(h('h3', null, 'Your biggest gap: ' + big.name));
    card.appendChild(h('p', null, 'You rated yourself ' + fmt(s) + ' here, and your choices this week score ' + fmt(p) + '. ' +
      (Math.abs(d) < 0.5 ? 'Close: your picture of yourself matches what you do.'
        : d > 0 ? 'You may be doing better than you think. Look at the strong moves you made, and trust them in the real situation.'
          : 'Under pressure you chose differently from how you see yourself. That is common, and it is the most useful thing a practice week can show.')));
    card.appendChild(h('p', { class: 'muted' }, lowest ? ['Your lowest area in practice: ', h('b', null, lowest.name), ' (' + fmt(sc.tracks[lowest.id].practice) + ').'] : levelText));
    card.appendChild(next((lowest || big).id));
    return card;
  }

  /** A scenario not played yet and a lesson not done yet in a track. */
  function next(track) {
    var done = U.store.get('scenarios.done', {}), scores = U.quiz.scores();
    var s = (U.data.scenarios || []).filter(function (x) { return x.track === track && !done[x.id]; })[0];
    var l = (U.data.lessons || []).filter(function (x) { return x.track === track && !scores[x.id]; })[0];
    return h('ul', { class: 'wk-next-steps' },
      s ? h('li', null, 'Play ', h('a', { href: '#/scenarios/' + s.id }, s.title)) : null,
      l ? h('li', null, 'Read ', h('a', { href: '#/lessons/' + l.id }, l.title)) : null);
  }

  function days(root, w) {
    var sc = score(w);
    var upNext = w.picks.filter(function (p) { return !w.results[p.id]; })[0];
    var confirm = h('div', { class: 'row wk-confirm', hidden: true },
      h('span', null, 'This week is not finished. Start a new one anyway?'),
      h('button', { class: 'btn btn-small btn-primary', id: 'wk-new-confirm', type: 'button', onclick: function () { start(); U.render(); } }, 'Yes, start a new week'),
      h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: function () { confirm.hidden = true; } }, 'Cancel'));
    root.appendChild(h('div', { class: 'card wk-bar' },
      h('div', { class: 'row' },
        h('b', null, sc.played + ' of ' + sc.total + ' played'),
        h('span', { class: 'spacer' }),
        upNext ? h('a', { class: 'btn btn-primary', id: 'wk-next', href: '#/scenarios/' + upNext.id + '?week=1' }, 'Play the next one →') : null,
        h('button', { class: 'btn', id: 'wk-new', type: 'button', onclick: function () {
          if (w.finishedAt) { start(); U.render(); } else confirm.hidden = false;
        } }, 'Start a new week')),
      h('span', { class: 'wk-progress', 'aria-hidden': 'true' }, h('span', { style: { width: Math.round(100 * sc.played / (sc.total || 1)) + '%' } })),
      confirm));
    var grid = h('div', { class: 'wk-days' });
    DAYS.forEach(function (name, d) {
      var mine = w.picks.filter(function (p) { return p.day === d; });
      grid.appendChild(h('section', { class: 'wk-day', 'data-day': d, 'aria-label': name },
        h('h3', null, name),
        mine.map(function (p) {
          var s = U.find('scenarios', p.id), r = w.results[p.id];
          if (!s) return null;
          return h('a', { class: 'card wk-item' + (r ? ' played' : ''), href: '#/scenarios/' + s.id + '?week=1', 'data-id': s.id, 'data-state': r ? 'done' : 'todo' },
            h('div', { class: 'row' }, U.trackBadge(s.track), h('span', { class: 'spacer' }),
              r ? h('span', { class: 'badge ' + (r.best === r.decisions ? 'badge-ok' : 'badge-warn') }, 'Strong ' + r.best + ' of ' + r.decisions) : h('span', { class: 'faint' }, 'To play')),
            h('b', null, s.title));
        })));
    });
    root.appendChild(grid);
  }

  function history(root, st) {
    if (!st.history.length) return;
    root.appendChild(h('h2', null, 'Earlier weeks'));
    root.appendChild(h('ul', { class: 'wk-history', id: 'wk-history' }, st.history.map(function (w) {
      var sc = score(w), low = lowestOf(sc);
      return h('li', null, h('b', null, when(w.startedAt)), ' · strong ' + sc.best + ' of ' + sc.decisions + (low ? ' · lowest: ' + low.name + ' (' + fmt(sc.tracks[low.id].practice) + ')' : ''));
    })));
  }

  U.views.week = {
    render: function (root) {
      var st = state();
      root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/scenarios' }, 'Scenarios'), ' › A week as a lead'));
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'A week as a lead'),
        h('p', null, 'Twelve situations from one working week, mixed the way real weeks are: a stand-up that goes wrong on Monday, an estimate on Tuesday, a hard 1:1 on Thursday. ' +
          'It shows how you lead when you cannot pick the topic, and how that compares with how you see yourself.')));
      if (!st.current) return intro(root, st);
      if (st.current.finishedAt) results(root, st.current);
      days(root, st.current);
      history(root, st);
    }
  };

  U.week = { DAYS: DAYS, SIZE: SIZE, pick: pick, state: state, start: start, record: record, score: score, latest: latest, practice: practice, info: info };
  U.route('week', U.views.week);
})(window.LELT);
