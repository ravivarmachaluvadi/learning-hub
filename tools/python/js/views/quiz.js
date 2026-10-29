/*
 * views/quiz.js - the quiz at the end of every lesson, and the review of missed questions
 * (#/lessons/review).
 *
 * The questions live in data/quizzes.js. A question you miss goes into the review and comes back
 * until you know it: on the review page, and at the end of the next lessons' quizzes. It works like
 * flash cards moved between boxes (a Leitner system), kept in localStorage "pylt.quiz.review" as
 * {questionId: {box, due}}:
 *
 *   a wrong answer, anywhere          -> box 0, due at once
 *   a right answer to a due question  -> the next box: box 1 is due a day later, box 2 three days
 *                                        later, and after box 2 the question is learned and leaves
 *
 * A question answered right the first time never enters the review. Lesson scores are kept in
 * "pylt.quiz.scores" as {lessonId: {right, total, at}}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var DAY = 24 * 60 * 60 * 1000;
  var WAIT = [0, DAY, 3 * DAY]; // how long a question rests in each box
  var LEARNED = WAIT.length;    // the box after the last one: learned

  var list = null;
  /** Every question, in lesson order, with its id ("<lessonId>/<position>") and lesson id. */
  function questions() {
    if (list) return list;
    list = [];
    var byLesson = U.data.quizzes || {};
    (U.data.lessons || []).forEach(function (l) {
      (byLesson[l.id] || []).forEach(function (q, i) {
        list.push(Object.assign({ id: l.id + '/' + (i + 1), lesson: l.id }, q));
      });
    });
    return list;
  }
  function byId(id) { return questions().filter(function (q) { return q.id === id; })[0] || null; }
  function forLesson(id) { return questions().filter(function (q) { return q.lesson === id; }); }

  function reviewState() { return U.store.get('quiz.review', {}); }
  /** The questions waiting for review now. */
  function due() {
    var r = reviewState(), now = Date.now();
    return questions().filter(function (q) { return r[q.id] && r[q.id].due <= now; });
  }
  /** The questions in review that are resting until a later day. */
  function later() {
    var r = reviewState(), now = Date.now();
    return questions().filter(function (q) { return r[q.id] && r[q.id].due > now; });
  }

  /** Move a question between boxes after an answer (see the top of this file). */
  function record(q, right) {
    var r = reviewState(), s = r[q.id], now = Date.now();
    if (!right) r[q.id] = { box: 0, due: now };
    else if (s && s.due <= now) {
      var box = s.box + 1;
      if (box >= LEARNED) delete r[q.id]; else r[q.id] = { box: box, due: now + WAIT[box] };
    } else return; // right the first time, or not due yet: nothing changes
    U.store.set('quiz.review', r);
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function inline(md) { return U.md(md).replace(/^<p>|<\/p>$/g, ''); }
  function plain(md) { return String(md).replace(/`/g, '').replace(/\*\*/g, ''); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /**
   * Draw a quiz. Each question shows its choices in a random order; the first click locks it,
   * marks the right answer (and the wrong pick), and explains why.
   * opts: {lesson: id - questions from other lessons are labelled, and this lesson's score is saved;
   *        showLesson: label every question with its lesson (the review page)}
   */
  function render(container, qs, opts) {
    opts = opts || {};
    var box = h('div', { class: 'quiz' });
    container.appendChild(box);

    function draw() {
      box.innerHTML = '';
      var answered = 0, right = 0;
      var own = qs.filter(function (q) { return q.lesson === opts.lesson; });
      var ownAnswered = 0, ownRight = 0;
      var summary = h('div', { class: 'quiz-summary', hidden: true, 'aria-live': 'polite' });

      qs.forEach(function (q, i) {
        var lesson = U.find('lessons', q.lesson);
        var labelled = lesson && (opts.showLesson || (opts.lesson && q.lesson !== opts.lesson));
        var choices = h('div', { class: 'quiz-choices', role: 'group', 'aria-label': 'Answers to question ' + (i + 1) });
        var why = h('div', { class: 'quiz-why', 'aria-live': 'polite' });
        var card = h('div', { class: 'quiz-q', 'data-qid': q.id },
          h('div', { class: 'quiz-q-head' },
            h('span', null, 'Question ' + (i + 1) + ' of ' + qs.length),
            labelled ? h('a', { class: 'quiz-from badge badge-warn', href: '#/lessons/' + lesson.id }, (opts.showLesson ? 'From ' : 'Review · from ') + lesson.title) : null),
          h('div', { class: 'quiz-text', html: U.md(q.q) }),
          choices, why);
        shuffle(q.choices.map(function (c, k) { return k; })).forEach(function (k) {
          choices.appendChild(h('button', { class: 'quiz-choice', type: 'button', 'data-choice': k, html: inline(q.choices[k]), onclick: function () { pick(k); } }));
        });
        U.enhance(card);

        function pick(k) {
          var ok = k === q.answer;
          U.$$('.quiz-choice', choices).forEach(function (b) {
            var c = +b.getAttribute('data-choice');
            b.disabled = true;
            if (c === q.answer) b.classList.add('is-right');
            else if (c === k) b.classList.add('is-wrong');
          });
          card.classList.add(ok ? 'quiz-ok' : 'quiz-missed');
          why.appendChild(U.callout(ok ? 'tip' : 'warn', ok ? 'Right' : 'Not quite. The answer is: ' + plain(q.choices[q.answer]), U.md(q.why)));
          record(q, ok);
          answered++;
          if (ok) right++;
          if (q.lesson === opts.lesson) {
            ownAnswered++;
            if (ok) ownRight++;
            if (ownAnswered === own.length) {
              var scores = U.store.get('quiz.scores', {});
              scores[opts.lesson] = { right: ownRight, total: own.length, at: new Date().toISOString() };
              U.store.set('quiz.scores', scores);
            }
          }
          if (answered === qs.length) finish();
        }
        box.appendChild(card);
      });
      box.appendChild(summary);

      function finish() {
        var missed = qs.length - right;
        summary.hidden = false;
        summary.innerHTML = '';
        summary.appendChild(h('p', null, h('b', null, right + ' of ' + qs.length + ' right. '),
          missed ? (missed === 1 ? 'The one you missed comes back in your review later, until you know it.' : 'The ' + missed + ' you missed come back in your review later, until you know them.') :
            'Well done.'));
        var waiting = due().length;
        summary.appendChild(h('div', { class: 'row' },
          h('button', { class: 'btn btn-small', type: 'button', onclick: draw }, 'Try again'),
          waiting && !opts.showLesson ? h('a', { class: 'btn btn-small btn-ghost', href: '#/lessons/review' }, 'Open the review (' + waiting + ') →') : null));
      }
    }
    draw();
    return box;
  }

  /** "N questions are waiting for review" with a button, or null when nothing is due. */
  function reviewCard() {
    var n = due().length;
    if (!n) return null;
    return h('div', { class: 'card review-card' },
      h('div', { class: 'row' },
        h('b', null, plural(n, 'question is', 'questions are') + ' waiting for review'),
        h('span', { class: 'spacer' }),
        h('a', { class: 'btn btn-primary btn-small', href: '#/lessons/review' }, 'Review now →')),
      h('p', { class: 'faint', style: { margin: '6px 0 0' } }, 'Questions you missed in the lesson quizzes come back until you know them.'));
  }

  /** The review page (#/lessons/review): every due question, at most 10 at a time. */
  function reviewPage(root) {
    var now = due(), rest = later();
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/lessons' }, 'Lessons'), ' › Review'));
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Review your missed quiz questions'),
      h('p', null, 'Questions you missed in a lesson quiz come back here. Answer one right and it rests for a day, then for three days; ' +
        'right a third time and it is learned. A wrong answer starts it over. Short, spaced reviews like this are how facts move into long-term memory.')));
    var main = h('div', { class: 'review-main' });
    root.appendChild(main);
    if (!now.length) {
      var next = rest.map(function (q) { return reviewState()[q.id].due; }).sort()[0];
      main.appendChild(h('div', { class: 'card' },
        h('p', { style: { marginTop: 0 } }, h('b', null, 'Nothing to review right now. ')),
        h('p', { class: 'muted' }, rest.length ?
          plural(rest.length, 'question rests', 'questions rest') + ' until a later day; the next one is due ' + new Date(next).toLocaleString() + '.' :
          'When you miss a question in a lesson quiz, it will come back here.'),
        h('a', { class: 'btn', href: '#/lessons' }, '← Back to the lessons')));
      return;
    }
    main.appendChild(h('p', { class: 'muted' }, plural(now.length, 'question is', 'questions are') + ' due' +
      (now.length > 10 ? '; here are the first 10' : '') +
      (rest.length ? ', and ' + rest.length + ' more ' + (rest.length === 1 ? 'rests' : 'rest') + ' until a later day' : '') + '.'));
    render(main, now.slice(0, 10), { showLesson: true });
  }

  U.quiz = {
    questions: questions, byId: byId, forLesson: forLesson, due: due, later: later, record: record,
    render: render, reviewCard: reviewCard, reviewPage: reviewPage
  };
})(window.PYLT);
