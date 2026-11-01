/*
 * views/mock.js - the mock interview (#/mock): the React Learning Tool's, for Java concurrency. Interview questions
 * answered out loud against a clock with a follow-up after each, "what does this print?" predictions, then
 * a kata against its own clock, and a scorecard.
 *
 *   Quick        5 questions (about 12 minutes)
 *   Standard     6 questions, 3 predictions, then a Medium kata (about 55 minutes)
 *   Coding only  one kata, at the level chosen
 *
 * A track, or every track, and "only ★★★" choose the questions. Each question has 2 minutes: answer it out
 * loud, then Reveal (Space) shows the 30-second answer and one of the follow-ups an interviewer asks next,
 * and you grade yourself: 1 Missed it, 2 Partly, 3 Nailed it. The grade also moves the question's
 * flashcard (views/interview.js: missed, shaky, known). Each prediction has 90 seconds and is marked as on
 * the Predict page (views/predict.js); a miss goes into that page's review. The kata is its checked
 * challenge (js/challenge.js) with hints and no "Show solution", in an editor of its own
 * ("jclt.mock.work.<id>"), so the kata's own page and its record are left alone; all checks green ends the
 * mock. Its clock (Easy 15 minutes, Medium 25, Hard 40) sits above the code, beside Full screen
 * (js/layout.js), so hiding the text cannot hide it. The kata needs jclearn: opened from disk, it says how
 * to start it, and "End the round" scores the mock without it.
 *
 * The scorecard scores 0, 1 or 2 per question and right or wrong per prediction, says how long each took,
 * and lists the lessons to revise (those of the questions missed or half known, the predictions missed,
 * and a kata not solved). The mock in progress is kept in "jclt.mock.current", so a reload resumes it;
 * finished ones go into "jclt.mock.history" (the last 20). The questions and predictions of the last mock go
 * to the back of the next deck. ?seed=<n> makes a deck repeatable (the tests use it).
 * For the tests: JCLT.mock = {deal, current, history}; in the kata round JCLT.currentChallenge =
 * {kind: 'mock', id, challenge, editor, check}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var Q_SECS = 120, P_SECS = 90;   // the time for one answer, and for one prediction
  var HISTORY = 20;
  var MINUTES = { Easy: 15, Medium: 25, Hard: 40 };
  var FORMATS = {
    quick: { label: 'Quick', questions: 5, predictions: 0, kata: null, about: '5 questions, about 12 minutes' },
    standard: { label: 'Standard', questions: 6, predictions: 3, kata: 'Medium', about: '6 questions, 3 "what does this print?" predictions, then a Medium kata: about 55 minutes' },
    coding: { label: 'Coding only', questions: 0, predictions: 0, kata: 'chosen', about: 'one kata against its clock: Easy 15 minutes, Medium 25, Hard 40' }
  };
  var GRADES = { missed: { points: 0, label: 'Missed it', card: 'missed' }, partly: { points: 1, label: 'Partly', card: 'shaky' }, nailed: { points: 2, label: 'Nailed it', card: 'known' } };
  var ORDER = ['missed', 'partly', 'nailed'];
  var ticker = null, onKey = null;

  function current() { return U.store.get('mock.current', null); }
  function save(m) { U.store.set('mock.current', m); }
  function history() { return U.store.get('mock.history', []); }
  /** The list with the ids in `back` moved to its end (the last mock's, so a new mock asks others first). */
  function toBack(list, back) {
    return list.filter(function (x) { return back.indexOf(x.id) < 0; }).concat(list.filter(function (x) { return back.indexOf(x.id) >= 0; }));
  }

  /** A new mock (nothing is saved): {seed, format, track, stars, level, deck, follow, predict, kata, i, phase, …}.
   *  o: {format, track, stars, level (Coding only), seed, avoid (question ids for the back; the last mock's by default)}. */
  function deal(o) {
    var f = FORMATS[o.format] || FORMATS.quick;
    var seed = o.seed || (Date.now() % 2147483647);
    var rand = U.rng(seed);
    var last = history()[0] || {};
    var avoid = o.avoid || last.questions || [];
    var pool = (U.data.questions || []).filter(function (q) { return (!o.track || q.track === o.track) && (!o.stars || q.weight === 3); });
    var deck = toBack(U.shuffled(pool, rand), avoid).slice(0, f.questions);
    var follow = deck.map(function (q) { return Math.floor(rand() * q.followups.length); });
    var predict = f.predictions ? toBack(U.shuffled(U.data.predictions || [], rand), o.avoid ? [] : last.predict || []).slice(0, f.predictions) : [];
    var level = f.kata === 'chosen' ? (MINUTES[o.level] ? o.level : 'Medium') : f.kata;
    var kata = null;
    if (level) {
      var picks = U.shuffled((U.data.katas || []).filter(function (k) { return k.level === level; }), rand);
      var lastKata = last.coding && last.coding.id;
      kata = ((picks.filter(function (k) { return k.id !== lastKata; })[0] || picks[0]) || {}).id || null;
    }
    var now = Date.now();
    return { seed: seed, format: o.format in FORMATS ? o.format : 'quick', track: o.track || '', stars: !!o.stars, level: level || '',
      deck: deck.map(function (q) { return q.id; }), follow: follow, predict: predict.map(function (p) { return p.id; }), kata: kata,
      i: 0, p: 0, phase: deck.length ? 'questions' : predict.length ? 'predict' : 'coding', revealed: false, qStart: now,
      pStart: deck.length ? null : now, codingStart: deck.length || predict.length ? null : now,
      grades: [], pResults: [], coding: null, hints: 0, startedAt: now };
  }
  /** The same questions, predictions and kata again, from the start. */
  function again(m) {
    var now = Date.now();
    if (m.kata) U.store.del('mock.work.' + m.kata);
    return Object.assign({}, m, { i: 0, p: 0, phase: m.deck.length ? 'questions' : m.predict.length ? 'predict' : 'coding', revealed: false, qStart: now,
      pStart: m.deck.length ? null : now, codingStart: m.deck.length || m.predict.length ? null : now, grades: [], pResults: [], coding: null, hints: 0,
      startedAt: now, endedAt: null });
  }
  function start(m) {
    if (m.kata) U.store.del('mock.work.' + m.kata);   // a new mock starts the kata from its starter, not from the last mock's work
    save(m);
    U.render();
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
  function score(m) { return m.grades.reduce(function (n, g) { return n + GRADES[g.grade].points; }, 0); }
  function predRight(m) { return m.pResults.filter(function (x) { return x && x.right; }).length; }

  /** The mock is over: score it, keep it in the history, and show the scorecard. */
  function finish(m) {
    m.phase = 'done';
    m.endedAt = Date.now();
    var hist = history();
    hist.unshift({ at: new Date().toISOString(), format: m.format, track: m.track, stars: m.stars, seed: m.seed,
      questions: m.grades.map(function (g) { return g.qid; }), grades: m.grades.map(function (g) { return g.grade; }),
      score: score(m), max: m.grades.length * 2, predict: m.predict, predRight: predRight(m), predTotal: m.pResults.length,
      coding: m.kata ? m.coding || { id: m.kata, solved: false } : null, secs: Math.round((m.endedAt - m.startedAt) / 1000) });
    U.store.set('mock.history', hist.slice(0, HISTORY));
    save(m);
  }
  function endButton(m, id, label, armed) {
    return h('button', { class: 'btn btn-small btn-ghost', id: id, type: 'button', onclick: function (e) {
      var b = e.currentTarget;
      if (!b.getAttribute('data-armed')) { b.setAttribute('data-armed', '1'); b.textContent = armed; return; }
      finish(current() || m);
      U.render();
    } }, label);
  }
  function head(m, where) {
    return [h('div', { class: 'crumbs' }, h('a', { href: '#/mock' }, 'Mock interview'), ' › ', (FORMATS[m.format] || {}).label || m.format, where ? ' › ' + where : ''),
      h('h1', { class: 'pr-h1' }, 'Mock interview')];
  }

  /* ---------- the start page ---------- */

  function setup(root, query) {
    var o = { format: 'quick', track: '', stars: false, level: 'Medium' };
    root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Mock interview'),
      h('p', null, 'A rehearsal of a Java concurrency interview. Each question gets two minutes: answer it out loud, as you would to an interviewer, then reveal the model answer ' +
        'and the follow-up they would ask next, and grade yourself honestly. The Standard mock then asks you what three short programs print, and gives you a kata ' +
        'against the clock, checked as on the Practice page. The scorecard tells you what to revise.')));
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
    var level = h('select', { class: 'select', id: 'mock-level', 'aria-label': 'The kata\'s level' },
      Object.keys(MINUTES).map(function (lv) { return h('option', { value: lv }, lv + ' (' + MINUTES[lv] + ' minutes)'); }));
    level.value = o.level;
    level.addEventListener('change', function () { o.level = level.value; });
    var questionsRow = h('div', { class: 'row', style: { marginTop: '8px' } }, h('b', null, 'Questions from'), track,
      h('label', { class: 'row', style: { gap: '6px' } }, stars, 'only ★★★'));
    var levelRow = h('div', { class: 'row', style: { marginTop: '8px' } }, h('b', null, 'The kata'), level);
    var go = h('button', { class: 'btn btn-primary', id: 'mock-start', type: 'button', onclick: function () {
      start(deal({ format: o.format, track: o.track, stars: o.stars, level: o.level, seed: +query.seed || 0 }));
    } }, 'Start the mock →');
    box.appendChild(h('div', { class: 'row' }, h('b', null, 'Length'), seg));
    box.appendChild(about);
    box.appendChild(questionsRow);
    box.appendChild(levelRow);
    box.appendChild(h('div', { class: 'row', style: { marginTop: '12px' } }, go,
      h('span', { class: 'faint' }, 'Keys: Space reveals the answer; 1, 2, 3 grade it; Ctrl+Enter checks a prediction.')));
    function paint() {
      U.$$('.seg-btn', seg).forEach(function (b) {
        var on = b.getAttribute('data-format') === o.format;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      about.textContent = FORMATS[o.format].about + '.';
      questionsRow.hidden = !FORMATS[o.format].questions;
      levelRow.hidden = FORMATS[o.format].kata !== 'chosen';
    }
    paint();

    var hist = history();
    root.appendChild(h('h2', null, 'Your mocks'));
    if (!hist.length) root.appendChild(h('p', { class: 'muted' }, 'None yet. Your scorecards are kept here, the last ' + HISTORY + '.'));
    else {
      root.appendChild(h('ul', { class: 'card narrow mock-history' }, hist.map(function (x) {
        var k = x.coding && U.find('katas', x.coding.id);
        return h('li', null, h('b', null, new Date(x.at).toLocaleString()), ' · ', (FORMATS[x.format] || {}).label || x.format,
          x.max ? ' · ' + x.score + ' of ' + x.max : '', x.predTotal ? ' · predictions ' + x.predRight + ' of ' + x.predTotal : '',
          k ? ' · ' + k.title + (x.coding.solved ? ' solved in ' + U.clock(x.coding.secs) : ' not solved') : '');
      })));
    }
  }

  /* ---------- a question ---------- */

  function questionStage(root, m) {
    var q = U.find('questions', m.deck[m.i]);
    if (!q) { m.i++; next(m); return; }
    var clock = h('span', { class: 'mock-clock', role: 'timer', 'aria-label': 'Time left for this answer' });
    head(m).forEach(function (x) { root.appendChild(x); });
    var answer = h('div', { class: 'mock-answer fc-answer', hidden: !m.revealed },
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
    root.appendChild(h('div', { class: 'card mock-q flashcard', 'data-qid': q.id },
      h('div', { class: 'row fc-meta' },
        h('span', { class: 'mock-progress' }, 'Question ' + (m.i + 1) + ' of ' + m.deck.length),
        h('span', { class: 'faint' }, (U.find('tracks', q.track) || {}).title || q.track),
        h('span', { class: 'spacer' }), clock),
      h('div', { class: 'fc-q' }, q.q),
      reveal, answer));
    root.appendChild(h('div', { class: 'row mock-foot' }, h('span', { class: 'spacer' }), endButton(m, 'mock-end', 'End the mock', 'Click again to end the mock now')));
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
  /** After a question or a prediction: the next one, the next round, or the scorecard. */
  function next(m) {
    var now = Date.now();
    m.revealed = false;
    if (m.phase === 'questions') {
      if (m.i < m.deck.length) m.qStart = now;
      else if (m.predict.length) { m.phase = 'predict'; m.pStart = now; }
      else if (m.kata) { m.phase = 'coding'; m.codingStart = now; }
      else finish(m);
    } else if (m.phase === 'predict') {
      if (m.p < m.predict.length) m.pStart = now;
      else if (m.kata) { m.phase = 'coding'; m.codingStart = now; }
      else finish(m);
    }
    save(m);
    U.render();
  }

  /* ---------- a prediction ---------- */

  function predictStage(root, m) {
    var p = U.find('predictions', m.predict[m.p]);
    if (!p) { m.p++; next(m); return; }
    var done = m.pResults[m.p];
    var clock = h('span', { class: 'mock-clock', role: 'timer', 'aria-label': 'Time left for this prediction' });
    head(m, 'What does it print?').forEach(function (x) { root.appendChild(x); });
    var nextBtn = h('button', { class: 'btn btn-primary', id: 'mock-pred-next', type: 'button', onclick: function () {
      var cur = current();
      if (!cur || cur.phase !== 'predict' || !cur.pResults[cur.p]) return;
      cur.p++;
      next(cur);
    } }, m.p === m.predict.length - 1 ? (m.kata ? 'On to the kata →' : 'See the scorecard →') : 'Next prediction →');
    root.appendChild(h('div', { class: 'pr-stage' }, U.predict.card(p, {
      cls: 'mock-pred', inputId: 'mock-pred-answer', checkId: 'mock-pred-check', skipId: 'mock-pred-skip',
      head: [h('span', { class: 'mock-progress' }, 'Prediction ' + (m.p + 1) + ' of ' + m.predict.length), clock],
      answered: done ? done.answer : null, next: nextBtn,
      onAnswer: function (text, mk) {
        var cur = current();
        if (!cur || cur.phase !== 'predict' || cur.pResults[cur.p]) return;
        cur.pResults[cur.p] = { id: p.id, right: mk.right, answer: text, secs: Math.round((Date.now() - cur.pStart) / 1000) };
        U.predict.record(p.id, mk.right);
        save(cur);
        stopClock();
      }
    })));
    root.appendChild(h('div', { class: 'row mock-foot' }, h('span', { class: 'spacer' }), endButton(m, 'mock-end', 'End the mock', 'Click again to end the mock now')));
    if (done) paintClock(clock, P_SECS - done.secs, P_SECS); else runClock(clock, m.pStart, P_SECS);
  }

  /* ---------- the kata ---------- */

  function codingStage(root, m) {
    var k = U.find('katas', m.kata);
    if (!k) { finish(m); U.render(); return; }
    var minutes = MINUTES[k.level] || 25;
    var clock = h('span', { class: 'mock-clock', role: 'timer', 'aria-label': 'Time left for the kata' });
    head(m, 'The kata').forEach(function (x) { root.appendChild(x); });
    var text = h('div', { class: 'lesson-text' }), work = h('div', { class: 'lesson-work' });
    var layout = h('div', { class: 'lesson-layout' }, text, work);
    root.appendChild(h('div', { class: 'mock-coding', 'data-kata': k.id }, layout));
    U.layout.split(layout, { key: 'lesson', def: 49, minLeft: 260, minRight: 380, label: 'Resize the kata and the code' });
    var fs = U.layout.full(layout, { kind: 'work', text: text, work: work });
    work.appendChild(h('div', { class: 'ed-tabs' }, h('b', null, 'Your solution'), h('span', { class: 'spacer' }), clock, fs.hideBtn, fs.btn));
    var note = h('div');
    work.appendChild(note);
    U.run.ready().then(function () { if (!U.run.available() && note.isConnected) note.appendChild(U.serverNote('#/mock')); });
    text.appendChild(h('h2', { class: 'mock-kata-title' }, k.title));
    text.appendChild(h('div', { class: 'kata-meta' }, h('span', { class: 'badge badge-accent' }, k.level), h('span', { class: 'badge' }, minutes + ' minutes'),
      k.kind === 'rewrite' ? h('span', { class: 'badge badge-accent' }, 'The old way to Java 25') : null));
    text.appendChild(h('div', { class: 'task' }, h('div', { class: 'task-title' }, 'The task'), U.enhance(h('div', { html: U.md(k.task) }))));
    if (k.original && U.kataOriginal) text.appendChild(U.enhance(U.kataOriginal(k)));
    text.appendChild(h('p', { class: 'faint' }, 'Talk through your plan before you type, as in the room. Hints are there, as an interviewer\'s nudge would be; the solution is not.'));
    text.appendChild(h('div', { class: 'row' }, h('button', { class: 'btn', id: 'mock-finish', type: 'button', onclick: function (e) {
      var btn = e.currentTarget;
      if (!btn.getAttribute('data-armed')) { btn.setAttribute('data-armed', '1'); btn.textContent = 'Click again: end without solving it'; return; }
      var cur = current() || m;
      cur.coding = { id: k.id, solved: false, secs: Math.round((Date.now() - cur.codingStart) / 1000), hints: cur.hints };
      finish(cur);
      U.render();
    } }, 'End the round')));
    var area = U.challenge(work, {
      challenge: k, storeKey: 'mock.work.' + k.id, showTask: false, noSolution: true,
      onHint: function (n) { var cur = current(); if (cur) { cur.hints = n; save(cur); } },
      onPass: function () {
        var cur = current() || m;
        var secs = Math.round((Date.now() - cur.codingStart) / 1000);
        cur.coding = { id: k.id, solved: true, secs: secs, hints: cur.hints };
        finish(cur);
        stopClock();
        setTimeout(function () { U.render(); }, 600);   // a moment to see the ticks, then the scorecard
        return '🎉 Solved in ' + U.clock(secs) + '. The scorecard is next.';
      }
    });
    U.currentChallenge = { kind: 'mock', id: k.id, challenge: k, editor: area.editor, check: area.run };
    runClock(clock, m.codingStart, minutes * 60);
  }

  /* ---------- the scorecard ---------- */

  function summary(root, m) {
    var k = m.kata && U.find('katas', m.kata);
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/mock' }, 'Mock interview'), ' › Scorecard'));
    var card = h('div', { class: 'card mock-summary' });
    root.appendChild(card);
    card.appendChild(h('h1', { style: { marginTop: 0 } }, 'Your scorecard'));
    var parts = [];
    if (m.grades.length) parts.push('Score: ' + score(m) + ' of ' + m.grades.length * 2 + ' (Nailed it 2, Partly 1, Missed it 0)');
    if (m.pResults.length) parts.push('Predictions: ' + predRight(m) + ' of ' + m.pResults.length);
    parts.push('took ' + U.clock(Math.round(((m.endedAt || Date.now()) - m.startedAt) / 1000)));
    card.appendChild(h('p', { class: 'mock-score' }, h('b', null, parts[0]), parts.length > 1 ? ' · ' + parts.slice(1).join(' · ') : ''));
    if (m.grades.length) {
      card.appendChild(h('h2', null, 'The questions'));
      card.appendChild(h('ol', { class: 'mock-rows' }, m.grades.map(function (g) {
        var q = U.find('questions', g.qid) || { q: g.qid };
        return h('li', { class: 'mock-row', 'data-qid': g.qid, 'data-grade': g.grade },
          h('a', { href: '#/interview/' + g.qid }, q.q), ' ',
          h('span', { class: 'badge' + (g.grade === 'nailed' ? ' badge-ok' : g.grade === 'missed' ? ' badge-warn' : '') }, GRADES[g.grade].label),
          h('span', { class: 'faint' + (g.secs > Q_SECS ? ' mock-over' : '') }, ' ' + U.clock(g.secs) + (g.secs > Q_SECS ? ', over the 2 minutes' : '')));
      })));
    }
    if (m.pResults.length) {
      card.appendChild(h('h2', null, 'What does it print?'));
      card.appendChild(h('ol', { class: 'mock-preds' }, m.pResults.map(function (x) {
        var p = U.find('predictions', x.id) || { topic: x.id };
        return h('li', { 'data-pid': x.id, 'data-result': x.right ? 'right' : 'wrong' },
          (U.predict.topics[p.topic] || p.topic) + ' ',
          h('span', { class: 'badge' + (x.right ? ' badge-ok' : ' badge-warn') }, x.right ? 'Right' : 'Missed'),
          h('span', { class: 'faint' }, ' ' + U.clock(x.secs) + (x.secs > P_SECS ? ', over the 90 seconds' : '')));
      })));
    }
    if (k) {
      var c = m.coding || { solved: false };
      var minutes = MINUTES[k.level] || 25;
      card.appendChild(h('p', { class: 'mock-coding-result' }, h('b', null, k.title + ': '),
        c.solved ? 'Solved in ' + U.clock(c.secs) + (c.secs > minutes * 60 ? ', over the ' + minutes + ' minutes' : ', inside the ' + minutes + ' minutes') : 'Not solved',
        c.hints ? ' · ' + U.plural(c.hints, 'hint', 'hints') + ' used' : '', ' · ', h('a', { href: '#/practice/' + k.id }, 'open it in Practice')));
    }
    // what to revise: the lessons of the questions not nailed, of the predictions missed, and of an unsolved kata
    var refs = [];
    function add(r) { if (/^(lesson|explain):/.test(r) && refs.indexOf(r) < 0) refs.push(r); }
    m.grades.forEach(function (g) { if (g.grade !== 'nailed') ((U.find('questions', g.qid) || {}).related || []).forEach(add); });
    m.pResults.forEach(function (x) { if (!x.right) ((U.find('predictions', x.id) || {}).learn || []).forEach(add); });
    if (k && !(m.coding && m.coding.solved)) (k.learn || []).forEach(add);
    if (refs.length) {
      card.appendChild(h('h2', null, 'Revise these'));
      card.appendChild(h('div', { class: 'row mock-revise' }, refs.map(function (r) {
        var x = /^(\w+):(.+)$/.exec(r);
        return h('a', { class: 'btn btn-small', href: U.linkFor(x[1], x[2]), html: U.labelFor(x[1], x[2]) });
      })));
    } else card.appendChild(h('p', { class: 'muted' }, 'Nothing to revise from this one: every answer right. Try a longer mock, or only the ★★★ questions.'));
    if (m.grades.length) card.appendChild(h('p', { class: 'faint' }, 'Your grades also moved the questions\' flashcards: the ones you missed come back in your next flashcard round.'));
    card.appendChild(h('div', { class: 'row' },
      h('button', { class: 'btn btn-primary', id: 'mock-new', type: 'button', onclick: function () { U.store.del('mock.current'); U.go('#/mock'); } }, 'New mock'),
      h('button', { class: 'btn', id: 'mock-again', type: 'button', onclick: function () { save(again(m)); U.render(); } }, 'The same questions again'),
      h('a', { class: 'btn', href: '#/interview/cards' }, 'Flashcards')));
  }

  /* ---------- the page ---------- */

  U.views.mock = {
    render: function (root, params, query) {
      stopClock();
      var m = current();
      if (!m) setup(root, query || {});
      else if (m.phase === 'questions') questionStage(root, m);
      else if (m.phase === 'predict') predictStage(root, m);
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
  U.mock = { deal: deal, current: current, history: history, formats: FORMATS };
  U.route('mock', U.views.mock);
})(window.JCLT);
