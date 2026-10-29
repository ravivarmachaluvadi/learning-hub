/*
 * views/lessons.js - the course (#/lessons, #/lessons/<id>, #/lessons/review).
 *
 * The list groups the lessons by level (Beginner, Intermediate, Advanced) and track, under a card for
 * JavaScript for React. A lesson page has the explanation on the left, opening with a "New JavaScript
 * in this lesson" box when the lesson is the first to use a shorthand (the entries of
 * data/javascript.js whose `first` it is); on the right an Example tab (a component you can change, with
 * its live preview) and a Challenge tab. "Check my answer" (Ctrl+Enter) renders your component and
 * runs the challenge's checks in the preview, ticking each one; all green marks the lesson done.
 * Each lesson ends with a quiz (views/quiz.js); #/lessons/review is the review of missed questions.
 * The challenge itself (editor, preview, checks, hints) is U.challenge, from js/challenge.js.
 * The line between the text and the code can be dragged, and Full screen puts the two across the
 * whole window, the text hideable (js/layout.js).
 *
 * Lesson shape (data/lessons-*.js): {id, track, title, summary, keywords, docs (react.dev), body,
 * plainjs (the "Coming from plain JavaScript" box), uilt? (the id of the UI Learning Tool lesson to
 * revise the plain-JS side in), example: {code, css?, note?, strict?}, challenge: {title, task, starter,
 * solution, css?, hints, checks, strict?}}. strict: true runs that preview inside <StrictMode>.
 * For the tests: RLT.currentExample is the Example tab's workbench (its .result is the last run),
 * RLT.currentChallenge = {kind: 'lesson', id, challenge, editor, check}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
  // the UI Learning Tool sits next to this folder in the github folder; it opens from disk too
  var UILT = '../UILearningTool/index.html#/lessons/';

  function lessons() { return U.data.lessons || []; }
  function done() { return U.store.get('lessons.done', {}); }
  function markDone(id) { var d = done(); d[id] = new Date().toISOString(); U.store.set('lessons.done', d); }

  /* ---------- the list (#/lessons) ---------- */

  function list(root) {
    var d = done();
    var all = lessons();
    var finished = all.filter(function (l) { return d[l.id]; }).length;
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Lessons'),
      h('p', null, 'A path from your first component to React 19, for someone who already knows HTML, CSS and plain JavaScript. ' +
        'Each lesson explains one idea next to the plain-JS way you know, gives you a live example to change, ' +
        'and ends with a challenge the tool checks for you and a short quiz.')));
    var js = U.data.javascript || [];
    if (js.length) {
      root.appendChild(h('a', { class: 'card narrow js-card', href: '#/javascript' },
        h('div', { class: 'card-kicker' }, 'Before you start, or beside the lessons'),
        h('h3', null, 'Coming from Java, or rusty on modern JavaScript?'),
        h('p', { class: 'muted', style: { margin: 0 }, html: U.mdInline('React code is full of shorthand: `=>`, `const [a, b] =`, `...`, `?.`. **JavaScript for React** takes ' + js.length +
          ' of them apart, each next to the same thing written out and the nearest Java. A lesson that uses one for the first time links it.') })));
    }
    root.appendChild(h('div', { class: 'card narrow', style: js.length ? { marginTop: '12px' } : null },
      h('div', { class: 'row' }, h('b', null, finished + ' of ' + all.length + ' lessons done'), h('span', { class: 'spacer' }),
        finished ? h('button', {
          class: 'btn btn-small btn-ghost', type: 'button',
          onclick: function (e) {
            var b = e.currentTarget;
            if (b.getAttribute('data-armed')) { U.store.del('lessons.done'); U.render(); }
            else { b.setAttribute('data-armed', '1'); b.textContent = 'Click again to clear all progress'; }
          }
        }, 'Reset progress') : null),
      h('div', { class: 'progress', style: { marginTop: '8px' } }, h('span', { style: { width: (all.length ? finished / all.length * 100 : 0) + '%' } }))));
    var review = U.quiz.reviewCard();
    if (review) { review.classList.add('narrow'); review.style.marginTop = '12px'; root.appendChild(review); }
    var scores = U.store.get('quiz.scores', {});
    var n = 0;
    LEVELS.forEach(function (level) {
      var tracks = (U.data.tracks || []).filter(function (t) { return t.level === level; });
      if (!tracks.length) return;
      root.appendChild(h('h2', { class: 'level-title' }, level));
      tracks.forEach(function (t) {
        var ls = all.filter(function (l) { return l.track === t.id; });
        root.appendChild(h('div', { class: 'track-title', id: 'track-' + t.id },
          h('h3', null, t.title),
          h('span', { class: 'badge' + (ls.length ? '' : ' badge-warn') }, ls.length ? ls.length + ' lessons' : 'coming in batch ' + t.batch)));
        root.appendChild(h('p', { class: 'muted track-summary' }, t.summary));
        ls.forEach(function (l) {
          n++;
          var s = scores[l.id];
          root.appendChild(h('a', { class: 'lesson-row' + (d[l.id] ? ' done' : ''), href: '#/lessons/' + l.id },
            h('span', { class: 'lesson-num', 'aria-label': d[l.id] ? 'done' : 'lesson ' + n }, d[l.id] ? '✓' : String(n)),
            h('span', { class: 'lesson-row-text' }, h('b', null, l.title), h('small', null, l.summary)),
            s ? h('span', { class: 'badge quiz-badge' + (s.right === s.total ? ' badge-ok' : ''), title: 'Your last quiz score' }, 'Quiz ' + s.right + '/' + s.total) : null));
        });
      });
    });
  }

  /* ---------- one lesson (#/lessons/<id>) ---------- */

  function lessonPage(root, lesson) {
    var all = lessons();
    var idx = all.indexOf(lesson);
    var prev = all[idx - 1], next = all[idx + 1];
    var track = U.find('tracks', lesson.track);
    var ch = lesson.challenge;
    U.store.set('lessons.last', lesson.id);

    var text = h('div', { class: 'lesson-text' });
    var work = h('div', { class: 'lesson-work' });
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/lessons' }, 'Lessons'), ' › ',
      (track ? track.title : lesson.track) + ' · lesson ' + (idx + 1) + ' of ' + all.length));
    var layout = h('div', { class: 'lesson-layout' }, text, work);
    root.appendChild(layout);
    U.layout.split(layout, { key: 'lesson', def: 49, minLeft: 260, minRight: 380, label: 'Resize the lesson and the code' });
    var fs = U.layout.full(layout, { kind: 'work', text: text, work: work });

    text.appendChild(h('h1', null, lesson.title));
    text.appendChild(h('p', { class: 'entry-summary' }, lesson.summary));
    // the JavaScript shorthand this lesson is the first to use: the entries name their lesson (data/javascript.js)
    var newJs = (U.data.javascript || []).filter(function (e) { return e.first === lesson.id; });
    if (newJs.length) {
      text.appendChild(h('aside', { class: 'callout callout-info js-new' },
        h('div', { class: 'callout-title' }, 'New JavaScript in this lesson'),
        h('p', { class: 'js-new-text' }, 'This lesson is the first to use the shorthand below. Each is taken apart next to the same thing written out and the nearest Java:'),
        h('div', { class: 'row js-new-links' }, newJs.map(function (e) {
          return h('a', { class: 'btn btn-small', href: '#/javascript/' + e.id }, e.title);
        }))));
    }
    text.appendChild(U.enhance(h('div', { class: 'lesson-body', html: U.md(lesson.body) })));
    if (lesson.plainjs) text.appendChild(U.enhance(U.callout('java', 'Coming from plain JavaScript', U.md(lesson.plainjs))));
    var questions = (U.data.questions || []).filter(function (q) { return (q.related || []).indexOf('lesson:' + lesson.id) >= 0; });
    text.appendChild(h('p', { class: 'faint lesson-links' },
      h('a', { href: lesson.docs, target: '_blank', rel: 'noopener' }, 'react.dev on this ↗'),
      lesson.uilt ? [' · ', h('a', { href: UILT + lesson.uilt, title: 'Opens the UI Learning Tool, if it sits next to this folder' }, 'Revise the plain-JS side in the UI Learning Tool ↗')] : null,
      questions.length ? [' · Interview questions on this: ', questions.map(function (q, i) {
        return [i ? ', ' : '', h('a', { href: '#/interview/' + q.id }, q.q)];
      })] : null));
    text.appendChild(h('h2', null, 'Your challenge'));
    text.appendChild(h('div', { class: 'task' }, h('div', { class: 'task-title' }, ch.title || 'Challenge'), U.enhance(h('div', { html: U.md(ch.task) }))));
    var quiz = U.quiz.forLesson(lesson.id);
    if (quiz.length) {
      var again = U.quiz.due().filter(function (q) { return q.lesson !== lesson.id; }).slice(0, 2);
      text.appendChild(h('h2', { id: 'quiz' }, 'Check your understanding'));
      text.appendChild(h('p', { class: 'muted' }, 'Click an answer: you see at once whether it is right, and why.' +
        (again.length ? ' The last ' + (again.length === 1 ? 'question is one' : again.length + ' are ones') + ' you missed in another lesson.' : '')));
      U.quiz.render(text, quiz.concat(again), { lesson: lesson.id });
    }
    text.appendChild(h('div', { class: 'row lesson-nav' },
      prev ? h('a', { class: 'btn', href: '#/lessons/' + prev.id }, '← ' + prev.title) : null,
      h('span', { class: 'spacer' }),
      next ? h('a', { class: 'btn btn-primary', href: '#/lessons/' + next.id }, next.title + ' →') : h('a', { class: 'btn btn-primary', href: '#/build' }, 'Track done! Try a machine-coding problem →')));

    // --- work area: Example | Challenge
    var tabEx = h('button', { class: 'btn', type: 'button' }, 'Example');
    var tabCh = h('button', { class: 'btn', type: 'button' }, 'Challenge');
    work.appendChild(h('div', { class: 'ed-tabs' }, tabEx, tabCh, h('span', { class: 'spacer' }),
      h('span', { class: 'faint' }, 'Ctrl+Enter runs'), fs.hideBtn, fs.btn));
    var exBox = h('div', { class: 'stack-tight' }), chBox = h('div', { class: 'stack-tight' });
    work.appendChild(exBox);
    work.appendChild(chBox);

    var ex = null, chArea = null;
    function showTab(which) {
      tabEx.classList.toggle('active', which === 'example');
      tabCh.classList.toggle('active', which === 'challenge');
      exBox.hidden = which !== 'example';
      chBox.hidden = which !== 'challenge';
      if (which === 'example' && !ex) buildExample();
      if (which === 'challenge' && !chArea) buildChallenge();
      U.layout.refresh(work);   // the editor now on show: fit it (in full screen) and redraw it
      U.store.set('lessons.tab.' + lesson.id, which);
    }
    tabEx.addEventListener('click', function () { showTab('example'); });
    tabCh.addEventListener('click', function () { showTab('challenge'); });

    function buildExample() {
      var e = lesson.example;
      ex = U.workbench(exBox, {
        code: e.code, css: e.css || '', height: 300, strict: !!e.strict,
        extraButtons: [
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: function () { ex.editor.set(e.code); ex.run(); } }, 'Reset'),
          h('button', { class: 'btn btn-small', type: 'button', onclick: function () { U.openInPlayground({ title: lesson.title, code: ex.editor.get(), css: e.css || '' }); } }, 'Open in Playground')
        ]
      });
      if (e.note) exBox.appendChild(U.enhance(h('div', { class: 'faint example-note', html: U.md(e.note) })));
      U.currentExample = ex;
    }

    function buildChallenge() {
      chArea = U.challenge(chBox, {
        challenge: ch, storeKey: 'lessons.work.' + lesson.id, showTask: false,
        onPass: function () {
          markDone(lesson.id);
          return '🎉 All checks pass - lesson complete!' + (next ? ' Next: ' + next.title : '');
        }
      });
      U.currentChallenge = { kind: 'lesson', id: lesson.id, challenge: ch, editor: chArea.editor, check: chArea.check };
    }

    // the example always renders (it is what the page teaches); the Challenge tab may be the one shown
    var tab = U.store.get('lessons.tab.' + lesson.id, 'example');
    showTab('example');
    if (tab === 'challenge') showTab('challenge');
  }

  U.views.lessons = {
    render: function (root, params, query) {
      if (params[0] === 'review') { U.quiz.reviewPage(root); return; }
      var lesson = params[0] && U.find('lessons', params[0]);
      if (lesson) { lessonPage(root, lesson); return; }
      list(root);
      if (query && query.track) {
        var el = document.getElementById('track-' + query.track);
        if (el) setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 0);
      }
    },
    destroy: function () { U.currentLesson = null; U.currentExample = null; U.currentChallenge = null; }
  };
  U.route('lessons', U.views.lessons);
})(window.RLT);
