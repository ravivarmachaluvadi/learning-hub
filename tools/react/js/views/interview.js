/*
 * views/interview.js - Interview Q&A (#/interview, #/interview/<id>, #/interview/cards).
 *
 * The questions (data/interview.js) come from your notes, 18_React_QA.md in java-interview-practice,
 * each with how often interviews ask it (★ to ★★★), the answer to give in 30 seconds, the full answer,
 * and the follow-ups an interviewer asks next.
 *
 * Flashcards: a round shows up to 10 cards, the ones due first, then ones you have not seen. You
 * answer out loud, reveal the answer, and grade yourself. The grade moves the card between boxes
 * (kept in localStorage "rlt.cards.review" as {questionId: {box, due}}):
 *
 *   Didn't know  -> box 0, due at once (it is in your next round)
 *   Shaky        -> stays in its box, due tomorrow
 *   Knew it      -> the next box: box 1 is due in a day, box 2 in 3 days, box 3 in a week, box 4 in
 *                   three weeks (and it stays in box 4 while you keep knowing it)
 *
 * The lesson quizzes have boxes of their own (views/quiz.js): those test one fact with choices;
 * these ask you to explain, as an interview does.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var DAY = 24 * 60 * 60 * 1000;
  var WAIT = [0, DAY, 3 * DAY, 7 * DAY, 21 * DAY];
  var TOP = WAIT.length - 1;
  var ROUND = 10;

  function all() { return U.data.questions || []; }
  function state() { return U.store.get('cards.review', {}); }
  function stars(n) { return '★★★'.slice(0, n) + '<span class="stars-off">' + '★★★'.slice(n) + '</span>'; }
  function trackTitle(id) { var t = U.find('tracks', id); return t ? t.title : id; }

  /** The cards due now (seen before, due time passed), soonest first. */
  function due() {
    var s = state(), now = Date.now();
    return all().filter(function (q) { return s[q.id] && s[q.id].due <= now; })
      .sort(function (a, b) { return s[a.id].due - s[b.id].due; });
  }
  function unseen() { var s = state(); return all().filter(function (q) { return !s[q.id]; }); }

  /** Move a card after a grade: 'known', 'shaky' or 'missed' (see the top of this file). */
  function grade(id, g) {
    var s = state(), cur = s[id], now = Date.now();
    var box = cur ? cur.box : 0;
    if (g === 'missed') s[id] = { box: 0, due: now };
    else if (g === 'shaky') s[id] = { box: box, due: now + DAY };
    else {
      var next = cur ? Math.min(box + 1, TOP) : 1;
      s[id] = { box: next, due: now + WAIT[next] };
    }
    U.store.set('cards.review', s);
  }

  function matches(q, f) {
    return (!f.track || q.track === f.track) && (!f.weight || q.weight === +f.weight);
  }
  /** The next round: due cards first, then unseen ones, filtered. */
  function deck(f) {
    f = f || {};
    return due().concat(unseen()).filter(function (q) { return matches(q, f); }).slice(0, ROUND);
  }

  function filterQuery(f) {
    var q = [f.track ? 'track=' + f.track : '', f.weight ? 'weight=' + f.weight : ''].filter(Boolean).join('&');
    return q ? '?' + q : '';
  }

  /* ---------- the list (#/interview) ---------- */

  function list(root, query) {
    var s = state(), qs = all();
    var f = { track: U.find('tracks', query.track) ? query.track : '', weight: /^[123]$/.test(query.weight || '') ? query.weight : '' };
    var known = qs.filter(function (q) { return s[q.id] && s[q.id].box >= 2; }).length;
    var seen = qs.filter(function (q) { return s[q.id]; }).length;
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Interview Q&A'),
      h('p', null, qs.length + ' React questions from your notes (18_React_QA.md), each with the answer to give in 30 seconds, the full answer, and the follow-ups ' +
        'an interviewer asks next. ★★★ means asked in almost every React round. Practise them as flashcards: say the answer out loud, reveal it, and grade yourself honestly.')));
    var startBtn = h('a', { class: 'btn btn-primary', id: 'fc-start', href: '#/interview/cards' }, 'Start flashcards');
    root.appendChild(h('div', { class: 'card narrow' },
      h('div', { class: 'row' },
        h('b', null, seen + ' of ' + qs.length + ' practised · ' + known + ' known well · ' + due().length + ' due now'),
        h('span', { class: 'spacer' }), startBtn),
      h('div', { class: 'progress', style: { marginTop: '8px' } }, h('span', { style: { width: (qs.length ? known / qs.length * 100 : 0) + '%' } }))));
    var fast = qs.filter(function (q) { return q.weight === 3; }).length;
    root.appendChild(h('div', { class: 'card narrow fast-card', style: { marginTop: '12px' } },
      h('div', { class: 'row' },
        h('span', null, h('b', null, '★★★ fast track: '), fast + ' questions asked in almost every React round. Short on time? Practise these first.'),
        h('span', { class: 'spacer' }),
        h('a', { class: 'btn', id: 'fc-fast', href: '#/interview/cards?weight=3' }, 'Practise the ' + fast + ' →'))));

    var seg = h('span', { class: 'seg', role: 'group', 'aria-label': 'How often it is asked' });
    [['', 'Every weight'], ['3', '★★★'], ['2', '★★'], ['1', '★']].forEach(function (w) {
      seg.appendChild(h('button', { class: 'seg-btn', type: 'button', 'data-weight': w[0], onclick: function () { f.weight = w[0]; apply(); } }, w[1]));
    });
    var pick = h('select', { class: 'select', id: 'q-track', 'aria-label': 'Track' },
      h('option', { value: '' }, 'Every track'),
      (U.data.tracks || []).map(function (t) {
        var n = qs.filter(function (q) { return q.track === t.id; }).length;
        return n ? h('option', { value: t.id }, t.title + ' (' + n + ')') : null;
      }));
    pick.value = f.track;
    pick.addEventListener('change', function () { f.track = pick.value; apply(); });
    root.appendChild(h('div', { class: 'practice-filters' }, seg, pick));
    var empty = h('p', { class: 'muted', hidden: true }, 'No question matches both filters.');
    root.appendChild(empty);

    var rows = [], sections = [];
    (U.data.tracks || []).forEach(function (t) {
      var tq = qs.filter(function (q) { return q.track === t.id; });
      if (!tq.length) return;
      var sec = h('section', null, h('h2', { class: 'level-title' }, t.title));
      sections.push(sec);
      root.appendChild(sec);
      tq.forEach(function (q) {
        var st = s[q.id];
        var row = h('a', { class: 'lesson-row q-row', href: '#/interview/' + q.id },
          h('span', { class: 'q-stars', title: q.weight + ' of 3: how often interviews ask it', html: stars(q.weight) }),
          h('span', { class: 'lesson-row-text' }, h('b', null, q.q), h('small', { html: U.mdInline(q.short) })),
          st ? h('span', { class: 'badge' + (st.box >= 2 ? ' badge-ok' : st.box === 0 ? ' badge-warn' : ''), title: 'Flashcard box ' + st.box + ' of ' + TOP },
            st.box >= 2 ? 'known' : st.box === 0 ? 'practise' : 'learning') : null);
        sec.appendChild(row);
        rows.push({ el: row, q: q });
      });
    });

    function apply() {
      var shown = 0;
      rows.forEach(function (r) { r.el.hidden = !matches(r.q, f); if (!r.el.hidden) shown++; });
      sections.forEach(function (sec) { sec.hidden = !U.$$('a.q-row', sec).some(function (a) { return !a.hidden; }); });
      empty.hidden = shown > 0;
      U.$$('.seg-btn', seg).forEach(function (b) {
        var on = b.getAttribute('data-weight') === f.weight;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var n = deck(f).length;
      startBtn.textContent = n ? 'Start flashcards (' + n + ')' : 'Nothing due - practise anyway';
      startBtn.setAttribute('href', '#/interview/cards' + filterQuery(f) + (n ? '' : (filterQuery(f) ? '&' : '?') + 'all=1'));
      try { history.replaceState(null, '', '#/interview' + filterQuery(f)); } catch (e) { /* the filter still works */ }
    }
    apply();
  }

  /* ---------- one question (#/interview/<id>) ---------- */

  function questionPage(root, q) {
    var qs = all(), idx = qs.indexOf(q), prev = qs[idx - 1], next = qs[idx + 1];
    var st = state()[q.id];
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/interview' }, 'Interview Q&A'), ' › ', trackTitle(q.track) + ' · question ' + (idx + 1) + ' of ' + qs.length));
    var page = h('div', { class: 'q-page' });
    root.appendChild(page);
    page.appendChild(h('div', { class: 'kata-meta' },
      h('span', { class: 'q-stars', html: stars(q.weight) }), h('span', { class: 'faint' }, ['', 'Asked occasionally', 'Asked often', 'Asked in almost every React round'][q.weight]),
      st ? h('span', { class: 'badge' }, 'Flashcard box ' + st.box + ' of ' + TOP) : null));
    page.appendChild(h('h1', null, q.q));
    page.appendChild(U.enhance(U.callout('tip', 'Say it in 30 seconds', U.md(q.short))));
    U.$('.callout-body', page).classList.add('q-short');
    page.appendChild(h('h2', null, 'The full answer'));
    page.appendChild(U.enhance(h('div', { class: 'q-answer lesson-body', html: U.md(q.answer) })));
    page.appendChild(h('h2', null, 'What they ask next'));
    page.appendChild(U.enhance(h('ul', { class: 'q-followups' }, q.followups.map(function (x) { return h('li', { html: U.mdInline(x) }); }))));
    if ((q.related || []).length) {
      page.appendChild(h('div', { class: 'row see-also' }, h('span', { class: 'faint' }, 'Learn it in:'),
        q.related.map(function (r) {
          var m = /^(\w+):(.+)$/.exec(r);
          return h('a', { class: 'btn btn-small', href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
        })));
    }
    var track = U.find('tracks', q.track);
    if (track && !(U.data.lessons || []).some(function (l) { return l.track === q.track; })) {
      page.appendChild(h('p', { class: 'faint' }, 'This question arrived early, on the ★★★ fast track. The lessons of its track, ' + track.title + ', come in batch ' + track.batch + '.'));
    }
    page.appendChild(h('p', { class: 'faint' }, 'From your notes: ' + q.source.replace('#', ', question ') + ' (java-interview-practice/AAScratches/miscellaneous Interview QAs).'));
    page.appendChild(h('div', { class: 'row lesson-nav' },
      prev ? h('a', { class: 'btn', href: '#/interview/' + prev.id }, '← Previous') : null,
      h('span', { class: 'spacer' }),
      h('a', { class: 'btn', href: '#/interview/cards?track=' + q.track }, 'Flashcards for this track'),
      next ? h('a', { class: 'btn btn-primary', href: '#/interview/' + next.id }, 'Next question →') : null));
  }

  /* ---------- flashcards (#/interview/cards) ---------- */

  function cardsPage(root, query) {
    var f = { track: U.find('tracks', query.track) ? query.track : '', weight: /^[123]$/.test(query.weight || '') ? query.weight : '' };
    var cards = deck(f);
    if (!cards.length && query.all) cards = all().filter(function (q) { return matches(q, f); }).slice(0, ROUND);
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/interview' + filterQuery(f) }, 'Interview Q&A'), ' › Flashcards'));
    root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Flashcards'),
      h('p', null, 'Read the question and answer it out loud, as you would to an interviewer. Then reveal the answer and grade yourself. ' +
        'Keys: Space reveals; 1 = Didn\'t know, 2 = Shaky, 3 = Knew it.' + (f.track ? ' Track: ' + trackTitle(f.track) + '.' : '') + (f.weight ? ' Only ' + '★★★'.slice(0, f.weight) + '.' : ''))));
    var stage = h('div', { class: 'fc-stage' });
    root.appendChild(stage);
    if (!cards.length) {
      stage.appendChild(h('div', { class: 'card' }, h('p', { style: { marginTop: 0 } }, h('b', null, 'Nothing is due right now.')),
        h('p', { class: 'muted' }, 'Every card you have practised is resting until a later day.'),
        h('div', { class: 'row' }, h('a', { class: 'btn btn-primary', href: '#/interview/cards' + filterQuery(f) + (filterQuery(f) ? '&' : '?') + 'all=1' }, 'Practise anyway'),
          h('a', { class: 'btn', href: '#/interview' }, '← Back to the questions'))));
      return;
    }
    var i = 0, tally = { known: 0, shaky: 0, missed: 0 }, revealed = false;
    var reveal, answer;

    function show() {
      stage.innerHTML = '';
      revealed = false;
      if (i >= cards.length) { summary(); return; }
      var q = cards[i], st = state()[q.id];
      answer = h('div', { class: 'fc-answer', hidden: true },
        U.callout('tip', 'Say it in 30 seconds', U.md(q.short)),
        h('details', { class: 'fc-more' }, h('summary', null, 'The full answer and follow-ups'),
          h('div', { class: 'lesson-body', html: U.md(q.answer) }),
          h('ul', { class: 'q-followups' }, q.followups.map(function (x) { return h('li', { html: U.mdInline(x) }); })),
          h('a', { href: '#/interview/' + q.id }, 'Open this question →')),
        h('div', { class: 'fc-grades row' },
          h('span', { class: 'faint' }, 'How did you do?'),
          gradeBtn('missed', '1 · Didn\'t know'), gradeBtn('shaky', '2 · Shaky'), gradeBtn('known', '3 · Knew it')));
      reveal = h('button', { class: 'btn btn-primary', id: 'fc-reveal', type: 'button', onclick: doReveal }, 'Reveal the answer (Space)');
      stage.appendChild(U.enhance(h('div', { class: 'card flashcard', 'data-qid': q.id },
        h('div', { class: 'fc-meta row' }, h('span', { class: 'q-stars', html: stars(q.weight) }), h('span', { class: 'faint' }, trackTitle(q.track)),
          h('span', { class: 'spacer' }), h('span', { class: 'faint' }, 'Card ' + (i + 1) + ' of ' + cards.length + (st ? ' · box ' + st.box : ' · new'))),
        h('div', { class: 'fc-q' }, q.q),
        reveal, answer)));
    }
    function gradeBtn(g, label) {
      return h('button', { class: 'btn' + (g === 'known' ? ' btn-primary' : ''), type: 'button', 'data-grade': g, onclick: function () { doGrade(g); } }, label);
    }
    function doReveal() {
      if (revealed || i >= cards.length) return;
      revealed = true;
      answer.hidden = false;
      reveal.hidden = true;
    }
    function doGrade(g) {
      if (!revealed || i >= cards.length) return;
      grade(cards[i].id, g);
      tally[g]++;
      i++;
      show();
    }
    function summary() {
      var again = deck(f).length;
      stage.appendChild(h('div', { class: 'card fc-summary' },
        h('h2', { style: { marginTop: 0 } }, 'Round done'),
        h('p', null, 'Knew it: ' + tally.known + ' · Shaky: ' + tally.shaky + ' · Didn\'t know: ' + tally.missed + '.'),
        h('p', { class: 'muted' }, tally.missed ? 'The ones you did not know are due again now: one more round fixes them better than rereading.' :
          'Cards you knew rest for a day or more; they come back just before you would forget them.'),
        h('div', { class: 'row' },
          again ? h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { U.render(); } }, 'Another round (' + again + ')') : null,
          h('a', { class: 'btn', href: '#/interview' }, '← Back to the questions'))));
    }
    function onKey(e) {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      if (e.key === ' ' && !revealed) { e.preventDefault(); doReveal(); }
      else if (revealed && (e.key === '1' || e.key === '2' || e.key === '3')) doGrade(['missed', 'shaky', 'known'][+e.key - 1]);
    }
    document.addEventListener('keydown', onKey);
    U.views.interview._unbind = function () { document.removeEventListener('keydown', onKey); };
    show();
  }

  U.views.interview = {
    render: function (root, params, query) {
      if (params[0] === 'cards') { cardsPage(root, query || {}); return; }
      var q = params[0] && U.find('questions', params[0]);
      if (q) questionPage(root, q); else list(root, query || {});
    },
    destroy: function () { if (U.views.interview._unbind) { U.views.interview._unbind(); U.views.interview._unbind = null; } }
  };
  U.cards = { state: state, due: due, deck: deck, grade: grade };
  U.route('interview', U.views.interview);
})(window.RLT);
