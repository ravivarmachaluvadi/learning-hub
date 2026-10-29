/*
 * views/mock.js - the mock interview (#/mock): the interview questions answered out loud against a
 * clock, a follow-up after each, then a machine-coding problem against its own clock, and a scorecard.
 *
 *   Quick        5 questions
 *   Standard     8 questions, then a machine-coding problem (a Medium one, when the track has one)
 *   Coding only  one machine-coding problem
 *
 * A track, or every track, and "only ★★★" choose the questions. Each question has 2 minutes: answer it
 * out loud, then Reveal (Space) shows the 30-second answer and one of the follow-ups an interviewer
 * asks next, and you grade yourself: 1 Missed it, 2 Partly, 3 Nailed it. The grade also moves the
 * question's flashcard (views/interview.js: missed, shaky, known). The coding round is the problem's
 * checked challenge (js/challenge.js) with hints and no "Show solution", in an editor of its own
 * ("rlt.mock.work.<id>"): the problem's own page and its record are left alone. All checks green
 * ends the mock. Its clock sits above the code, beside Full screen (js/layout.js), so hiding the text
 * cannot hide it.
 *
 * The scorecard scores 0, 1 or 2 per question, says how long each took, and lists the lessons to
 * revise (those of the questions missed or half-known, and of an unsolved problem). The mock in
 * progress is kept in "rlt.mock.current", so a reload resumes it; finished ones go into
 * "rlt.mock.history" (the last 20). The questions of the last mock go to the back of the next deck.
 * ?seed=<n> makes a deck repeatable (the tests use it).
 * For the tests: RLT.currentChallenge = {kind: 'mock', id, challenge, editor, check} in the coding round.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var Q_SECS = 120;            // the time for one answer
  var HISTORY = 20;
  var FORMATS = {
    quick: { label: 'Quick', questions: 5, coding: false, about: '5 questions, about 12 minutes' },
    standard: { label: 'Standard', questions: 8, coding: true, about: '8 questions, then a machine-coding problem: about an hour' },
    coding: { label: 'Coding only', questions: 0, coding: true, about: 'one machine-coding problem against its clock' }
  };
  var GRADES = { missed: { points: 0, label: 'Missed it', card: 'missed' }, partly: { points: 1, label: 'Partly', card: 'shaky' }, nailed: { points: 2, label: 'Nailed it', card: 'known' } };
  var ORDER = ['missed', 'partly', 'nailed'];
  var ticker = null, onKey = null;

  function current() { return U.store.get('mock.current', null); }
  function save(m) { U.store.set('mock.current', m); }
  function history() { return U.store.get('mock.history', []); }

  /* a small seeded random number generator (mulberry32), so the same seed deals the same deck */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(list, rand) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /** A new mock: {seed, format, track, stars, deck, follow (which follow-up each question gets), build, i, phase, …}. */
  function deal(o) {
    var f = FORMATS[o.format] || FORMATS.quick;
    var seed = o.seed || (Date.now() % 2147483647);
    var rand = rng(seed);
    var last = history()[0] || {};
    var pool = (U.data.questions || []).filter(function (q) { return (!o.track || q.track === o.track) && (!o.stars || q.weight === 3); });
    var mixed = shuffle(pool, rand);
    var asked = last.questions || [];
    mixed = mixed.filter(function (q) { return asked.indexOf(q.id) < 0; }).concat(mixed.filter(function (q) { return asked.indexOf(q.id) >= 0; }));
    var deck = mixed.slice(0, f.questions);
    var follow = deck.map(function (q) { return Math.floor(rand() * q.followups.length); });
    var build = null;
    if (f.coding) {
      var all = U.data.builds || [];
      var bs = all.filter(function (b) { return !o.track || b.track === o.track; });
      if (!bs.length) bs = all;
      var pref = o.format === 'standard' ? bs.filter(function (b) { return b.level === 'Medium'; }) : bs;
      if (!pref.length) pref = bs;
      var lastBuild = last.coding && last.coding.id;
      var picks = shuffle(pref, rand);
      build = (picks.filter(function (b) { return b.id !== lastBuild; })[0] || picks[0] || {}).id || null;
      if (build) U.store.del('mock.work.' + build);   // a new mock starts from the starter, not from the last mock's work
    }
    var now = Date.now();
    return { seed: seed, format: o.format, track: o.track || '', stars: !!o.stars, deck: deck.map(function (q) { return q.id; }), follow: follow,
      build: build, i: 0, phase: deck.length ? 'questions' : 'coding', revealed: false, qStart: now, codingStart: deck.length ? null : now,
      grades: [], coding: null, hints: 0, startedAt: now };
  }

  function clockText(left) { return left >= 0 ? U.clock(left) : '+' + U.clock(-left) + ' over'; }
  function paintClock(el, left, total) {
    el.textContent = clockText(left);
    el.classList.toggle('warn', left >= 0 && left < Math.min(30, total / 4));
    el.classList.toggle('over', left < 0);
  }
  function stopClock() { if (ticker) { clearInterval(ticker); ticker = null; } }
  function runClock(el, since, total) {
    stopClock();
    function paint() { paintClock(el, Math.ceil(total - (Date.now() - since) / 1000), total); }
    paint();
    ticker = setInterval(function () { if (!el.isConnected) { stopClock(); return; } paint(); }, 250);
  }

  /** The mock is over: score it, keep it in the history, and show the scorecard. */
  function finish(m) {
    m.phase = 'done';
    m.endedAt = Date.now();
    var score = m.grades.reduce(function (n, g) { return n + GRADES[g.grade].points; }, 0);
    var hist = history();
    hist.unshift({ at: new Date().toISOString(), format: m.format, track: m.track, stars: m.stars, seed: m.seed,
      questions: m.grades.map(function (g) { return g.qid; }), grades: m.grades.map(function (g) { return g.grade; }),
      score: score, max: m.grades.length * 2, coding: m.build ? m.coding || { id: m.build, solved: false } : null,
      secs: Math.round((m.endedAt - m.startedAt) / 1000) });
    U.store.set('mock.history', hist.slice(0, HISTORY));
    save(m);
  }

  /* ---------- the start page ---------- */

  function setup(root, query) {
    var o = { format: 'quick', track: '', stars: false };
    root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Mock interview'),
      h('p', null, 'A rehearsal of a React interview. Each question gets two minutes: answer it out loud, as you would to an interviewer, then reveal the model answer ' +
        'and the follow-up they would ask next, and grade yourself honestly. Then build a component against the clock, checked as on the Machine coding page. ' +
        'The scorecard tells you what to revise.')));
    var box = h('div', { class: 'card narrow mock-setup' });
    root.appendChild(box);
    var seg = h('span', { class: 'seg', role: 'group', 'aria-label': 'Length' });
    var about = h('p', { class: 'faint mock-about' });
    Object.keys(FORMATS).forEach(function (k) {
      seg.appendChild(h('button', { class: 'seg-btn', type: 'button', 'data-format': k, onclick: function () { o.format = k; paint(); } }, FORMATS[k].label));
    });
    var track = h('select', { class: 'select', id: 'mock-track', 'aria-label': 'Track' }, h('option', { value: '' }, 'Every track'),
      (U.data.tracks || []).map(function (t) { return h('option', { value: t.id }, t.title); }));
    track.addEventListener('change', function () { o.track = track.value; });
    var stars = h('input', { type: 'checkbox', id: 'mock-stars' });
    stars.addEventListener('change', function () { o.stars = stars.checked; });
    var start = h('button', { class: 'btn btn-primary', id: 'mock-start', type: 'button', onclick: function () {
      save(deal({ format: o.format, track: o.track, stars: o.stars, seed: +query.seed || 0 }));
      U.render();
    } }, 'Start the mock →');
    box.appendChild(h('div', { class: 'row' }, h('b', null, 'Length'), seg));
    box.appendChild(about);
    box.appendChild(h('div', { class: 'row', style: { marginTop: '8px' } }, h('b', null, 'Questions from'), track,
      h('label', { class: 'row', style: { gap: '6px' } }, stars, 'only ★★★')));
    box.appendChild(h('div', { class: 'row', style: { marginTop: '12px' } }, start,
      h('span', { class: 'faint' }, 'Keys: Space reveals the answer; 1, 2, 3 grade it.')));
    function paint() {
      U.$$('.seg-btn', seg).forEach(function (b) {
        var on = b.getAttribute('data-format') === o.format;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      about.textContent = FORMATS[o.format].about + '.';
    }
    paint();

    var hist = history();
    root.appendChild(h('h2', null, 'Your mocks'));
    if (!hist.length) root.appendChild(h('p', { class: 'muted' }, 'None yet. Your scorecards are kept here, the last ' + HISTORY + '.'));
    else {
      root.appendChild(h('ul', { class: 'card narrow mock-history' }, hist.map(function (x) {
        var b = x.coding && U.find('builds', x.coding.id);
        return h('li', null, h('b', null, new Date(x.at).toLocaleString()), ' · ', (FORMATS[x.format] || {}).label || x.format,
          x.max ? ' · ' + x.score + ' of ' + x.max : '',
          b ? ' · ' + b.title + (x.coding.solved ? ' solved in ' + U.clock(x.coding.secs) : ' not solved') : '');
      })));
    }
  }

  /* ---------- a question ---------- */

  function questionStage(root, m) {
    var q = U.find('questions', m.deck[m.i]);
    if (!q) { m.i++; next(m); return; }
    var clock = h('span', { class: 'mock-clock', role: 'timer', 'aria-label': 'Time left for this answer' });
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/mock' }, 'Mock interview'), ' › ', (FORMATS[m.format] || {}).label || m.format));
    var answer = h('div', { class: 'mock-answer', hidden: !m.revealed },
      U.enhance(U.callout('tip', 'Say it in 30 seconds', U.md(q.short))),
      h('p', { class: 'mock-followup-head' }, h('b', null, 'They follow up with: ')),
      U.enhance(h('p', { class: 'mock-followup', html: U.mdInline(q.followups[m.follow[m.i]] || q.followups[0]) })),
      h('details', { class: 'fc-more' }, h('summary', null, 'The full answer'), U.enhance(h('div', { class: 'lesson-body', html: U.md(q.answer) }))),
      h('div', { class: 'fc-grades row' }, h('span', { class: 'faint' }, 'How did you do, follow-up included?'),
        ORDER.map(function (g, k) {
          return h('button', { class: 'btn' + (g === 'nailed' ? ' btn-primary' : ''), type: 'button', 'data-grade': g, onclick: function () { grade(g); } }, (k + 1) + ' · ' + GRADES[g].label);
        })));
    U.$('.callout-body', answer).classList.add('q-short');
    var reveal = h('button', { class: 'btn btn-primary', id: 'mock-reveal', type: 'button', hidden: m.revealed, onclick: function () { doReveal(); } }, 'I have answered: reveal (Space)');
    root.appendChild(h('div', { class: 'card mock-q', 'data-qid': q.id },
      h('div', { class: 'row fc-meta' },
        h('span', { class: 'mock-progress' }, 'Question ' + (m.i + 1) + ' of ' + m.deck.length),
        h('span', { class: 'faint' }, (U.find('tracks', q.track) || {}).title || q.track),
        h('span', { class: 'spacer' }), clock),
      h('div', { class: 'fc-q' }, q.q),
      reveal, answer));
    root.appendChild(h('div', { class: 'row mock-foot' }, h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-small btn-ghost', id: 'mock-end', type: 'button', onclick: function (e) {
        var b = e.currentTarget;
        if (!b.getAttribute('data-armed')) { b.setAttribute('data-armed', '1'); b.textContent = 'Click again to end the mock now'; return; }
        finish(current() || m); U.render();
      } }, 'End the mock')));
    runClock(clock, m.qStart, Q_SECS);
  }
  /* Reveal and grade read the mock from storage each time: the buttons and the keys must act on the same state. */
  function doReveal() {
    var m = current();
    if (!m || m.phase !== 'questions' || m.revealed) return;
    m.revealed = true;
    save(m);
    var a = U.$('.mock-answer'), b = U.$('#mock-reveal');
    if (a) a.hidden = false;
    if (b) b.hidden = true;
  }
  function grade(g) {
    var m = current();
    if (!m || m.phase !== 'questions' || !m.revealed) return;
    var qid = m.deck[m.i];
    m.grades.push({ qid: qid, grade: g, secs: Math.round((Date.now() - m.qStart) / 1000) });
    if (U.cards) U.cards.grade(qid, GRADES[g].card);
    m.i++;
    next(m);
  }
  function next(m) {
    m.revealed = false;
    if (m.i < m.deck.length) m.qStart = Date.now();
    else if (m.build && m.phase === 'questions') { m.phase = 'coding'; m.codingStart = Date.now(); }
    else if (m.phase !== 'coding') { finish(m); }
    save(m);
    U.render();
  }

  /* ---------- the machine-coding round ---------- */

  function codingStage(root, m) {
    var b = U.find('builds', m.build);
    if (!b) { finish(m); U.render(); return; }
    var clock = h('span', { class: 'mock-clock', role: 'timer', 'aria-label': 'Time left for the problem' });
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/mock' }, 'Mock interview'), ' › Machine coding'));
    var text = h('div', { class: 'lesson-text' }), work = h('div', { class: 'lesson-work' });
    var layout = h('div', { class: 'lesson-layout' }, text, work);
    root.appendChild(h('div', { class: 'mock-coding', 'data-build': b.id }, layout));
    U.layout.split(layout, { key: 'lesson', def: 49, minLeft: 260, minRight: 380, label: 'Resize the problem and the code' });
    var fs = U.layout.full(layout, { kind: 'work', text: text, work: work });
    work.appendChild(h('div', { class: 'ed-tabs' }, h('b', null, 'Your component'), h('span', { class: 'spacer' }), clock, fs.hideBtn, fs.btn));
    text.appendChild(h('h1', null, b.title));
    text.appendChild(h('div', { class: 'kata-meta' }, h('span', { class: 'badge badge-accent' }, b.level), h('span', { class: 'badge' }, b.minutes + ' minutes')));
    text.appendChild(h('div', { class: 'task' }, h('div', { class: 'task-title' }, 'The task'), U.enhance(h('div', { html: U.md(b.task) }))));
    text.appendChild(h('h2', null, 'Once it works, they ask'));
    text.appendChild(U.enhance(h('ul', { class: 'q-followups' }, b.followups.map(function (x) { return h('li', { html: U.mdInline(x) }); }))));
    text.appendChild(h('p', { class: 'faint' }, 'Talk through your plan before you type, as in the room. Hints are there, as an interviewer\'s nudge would be; the solution is not.'));
    text.appendChild(h('div', { class: 'row' }, h('button', { class: 'btn', id: 'mock-finish', type: 'button', onclick: function (e) {
      var btn = e.currentTarget;
      if (!btn.getAttribute('data-armed')) { btn.setAttribute('data-armed', '1'); btn.textContent = 'Click again: end without solving it'; return; }
      m.coding = { id: b.id, solved: false, secs: Math.round((Date.now() - m.codingStart) / 1000), hints: m.hints };
      finish(m);
      U.render();
    } }, 'End the round')));
    var area = U.challenge(work, {
      challenge: b, storeKey: 'mock.work.' + b.id, showTask: false, noSolution: true,
      onHint: function (n) { m.hints = n; save(m); },
      onPass: function () {
        var secs = Math.round((Date.now() - m.codingStart) / 1000);
        m.coding = { id: b.id, solved: true, secs: secs, hints: m.hints };
        finish(m);
        setTimeout(function () { U.render(); }, 600);   // a moment to see the ticks, then the scorecard
        return '🎉 Solved in ' + U.clock(secs) + '. The scorecard is next.';
      }
    });
    U.currentChallenge = { kind: 'mock', id: b.id, challenge: b, editor: area.editor, check: area.check };
    runClock(clock, m.codingStart, b.minutes * 60);
  }

  /* ---------- the scorecard ---------- */

  function summary(root, m) {
    var score = m.grades.reduce(function (n, g) { return n + GRADES[g.grade].points; }, 0);
    var b = m.build && U.find('builds', m.build);
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/mock' }, 'Mock interview'), ' › Scorecard'));
    var card = h('div', { class: 'card mock-summary' });
    root.appendChild(card);
    card.appendChild(h('h1', { style: { marginTop: 0 } }, 'Your scorecard'));
    card.appendChild(h('p', { class: 'mock-score' }, m.grades.length ? h('b', null, 'Score: ' + score + ' of ' + m.grades.length * 2) : null,
      m.grades.length ? ' (Nailed it 2, Partly 1, Missed it 0) · ' : '', 'took ' + U.clock(Math.round(((m.endedAt || Date.now()) - m.startedAt) / 1000))));
    if (m.grades.length) {
      card.appendChild(h('ol', { class: 'mock-rows' }, m.grades.map(function (g) {
        var q = U.find('questions', g.qid) || { q: g.qid };
        return h('li', { class: 'mock-row', 'data-qid': g.qid, 'data-grade': g.grade },
          h('a', { href: '#/interview/' + g.qid }, q.q), ' ',
          h('span', { class: 'badge' + (g.grade === 'nailed' ? ' badge-ok' : g.grade === 'missed' ? ' badge-warn' : '') }, GRADES[g.grade].label),
          h('span', { class: 'faint' + (g.secs > Q_SECS ? ' mock-over' : '') }, ' ' + U.clock(g.secs) + (g.secs > Q_SECS ? ', over the 2 minutes' : '')));
      })));
    }
    if (b) {
      var c = m.coding || { solved: false };
      card.appendChild(h('p', { class: 'mock-coding-result' }, h('b', null, b.title + ': '),
        c.solved ? 'Solved in ' + U.clock(c.secs) + (c.secs > b.minutes * 60 ? ', over the ' + b.minutes + ' minutes' : ', inside the ' + b.minutes + ' minutes') : 'Not solved',
        c.hints ? ' · ' + U.plural(c.hints, 'hint', 'hints') + ' used' : ''));
    }
    // what to revise: the lessons of the questions not nailed, and of an unsolved problem
    var refs = [];
    m.grades.forEach(function (g) {
      if (g.grade === 'nailed') return;
      ((U.find('questions', g.qid) || {}).related || []).forEach(function (r) { if (/^(lesson|explain):/.test(r) && refs.indexOf(r) < 0) refs.push(r); });
    });
    if (b && !(m.coding && m.coding.solved)) (b.learn || []).forEach(function (r) { if (refs.indexOf(r) < 0) refs.push(r); });
    if (refs.length) {
      card.appendChild(h('h2', null, 'Revise these'));
      card.appendChild(h('div', { class: 'row mock-revise' }, refs.map(function (r) {
        var x = /^(\w+):(.+)$/.exec(r);
        return h('a', { class: 'btn btn-small', href: U.linkFor(x[1], x[2]), html: U.labelFor(x[1], x[2]) });
      })));
    } else if (m.grades.length || b) card.appendChild(h('p', { class: 'muted' }, 'Nothing to revise from this one: every answer nailed. Try a longer mock, or only the ★★★ questions.'));
    card.appendChild(h('p', { class: 'faint' }, 'Your grades also moved the questions\' flashcards: the ones you missed come back in your next flashcard round.'));
    card.appendChild(h('div', { class: 'row' },
      h('button', { class: 'btn btn-primary', id: 'mock-new', type: 'button', onclick: function () { U.store.del('mock.current'); U.go('#/mock'); } }, 'New mock'),
      h('button', { class: 'btn', id: 'mock-again', type: 'button', onclick: function () {
        save(deal({ format: m.format, track: m.track, stars: m.stars, seed: m.seed }));
        U.render();
      } }, 'The same questions again'),
      h('a', { class: 'btn', href: '#/interview/cards' }, 'Flashcards')));
  }

  /* ---------- the page ---------- */

  U.views.mock = {
    render: function (root, params, query) {
      stopClock();
      var m = current();
      if (!m) setup(root, query || {});
      else if (m.phase === 'questions') questionStage(root, m);
      else if (m.phase === 'coding') codingStage(root, m);
      else summary(root, m);
      if (!onKey) {
        onKey = function (e) {
          var cur = current(), a = document.activeElement;
          if (!cur || cur.phase !== 'questions' || !U.$('.mock-q')) return;
          if (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || (a.closest && a.closest('.CodeMirror'))) return;
          if (e.key === ' ' && !cur.revealed) { e.preventDefault(); doReveal(); }
          else if (cur.revealed && (e.key === '1' || e.key === '2' || e.key === '3')) grade(ORDER[+e.key - 1]);
        };
        document.addEventListener('keydown', onKey);
      }
    },
    destroy: function () {
      stopClock();
      if (onKey) { document.removeEventListener('keydown', onKey); onKey = null; }
      U.currentChallenge = null;
    }
  };
  U.route('mock', U.views.mock);
})(window.RLT);
