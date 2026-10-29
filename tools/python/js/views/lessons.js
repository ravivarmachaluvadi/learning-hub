/*
 * views/lessons.js - the course (#/lessons, #/lessons/<id>, #/lessons/review).
 *
 * The list groups the lessons by level (Beginner, Intermediate, Advanced) and track. A lesson page
 * has the explanation on the left; on the right an Example tab (an editor you can change and run) and
 * a Challenge tab. "Check my answer" (Ctrl+Enter) runs your program, then the challenge's checks
 * (Python asserts, see py/checker.py), and ticks each one; all green marks the lesson done.
 * Each lesson ends with a quiz (views/quiz.js); #/lessons/review is the review of missed questions.
 * The challenge itself (editor, checks, hints) is U.challenge, from js/challenge.js. A divider between
 * the two columns resizes them, and Full screen puts the text beside the code across the whole window,
 * the text hideable (js/layout.js).
 *
 * Lesson shape (data/lessons-*.js): {id, track, title, summary, keywords, body, java, js?, docs,
 * example: {code, stdin?, note?}, challenge: {title, task, starter, solution, stdin?, hints, checks:
 * [{label, code}]}, runtimes?: ['server'] for a lesson that cannot run in the browser, runtimeWhy?}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

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
      h('p', null, 'A path from your first line of Python to advanced topics, written for a Java developer. ' +
        'Each lesson explains one idea next to the Java you know, gives you a working example to change and run, ' +
        'and ends with a challenge the tool checks for you and a short quiz.')));
    root.appendChild(h('div', { class: 'card narrow' },
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
          var serverOnly = l.runtimes && l.runtimes.indexOf('browser') < 0;
          root.appendChild(h('a', { class: 'lesson-row' + (d[l.id] ? ' done' : ''), href: '#/lessons/' + l.id },
            h('span', { class: 'lesson-num', 'aria-label': d[l.id] ? 'done' : 'lesson ' + n }, d[l.id] ? '✓' : String(n)),
            h('span', { class: 'lesson-row-text' }, h('b', null, l.title), h('small', null, l.summary)),
            serverOnly ? h('span', { class: 'badge', title: 'Runs only with Python on your PC (pylearn)' }, 'your PC') : null,
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
    var allowed = U.run.supports(lesson);
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
    text.appendChild(U.enhance(h('div', { class: 'lesson-body', html: U.md(lesson.body) })));
    if (lesson.java) text.appendChild(U.enhance(U.callout('java', 'Coming from Java', U.md(lesson.java))));
    if (lesson.js) text.appendChild(U.enhance(U.callout('info', 'And in JavaScript', U.md(lesson.js))));
    if (lesson.docs) {
      text.appendChild(h('p', { class: 'faint' }, 'More in the official documentation: ',
        h('a', { href: lesson.docs, target: '_blank', rel: 'noopener' }, 'docs.python.org ↗')));
    }
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
      next ? h('a', { class: 'btn btn-primary', href: '#/lessons/' + next.id }, next.title + ' →') : h('a', { class: 'btn btn-primary', href: '#/playground' }, 'Done! Open the Playground →')));

    // --- work area: Example | Challenge
    var tabEx = h('button', { class: 'btn', type: 'button' }, 'Example');
    var tabCh = h('button', { class: 'btn', type: 'button' }, 'Challenge');
    work.appendChild(h('div', { class: 'ed-tabs' }, tabEx, tabCh, h('span', { class: 'spacer' }),
      h('span', { class: 'faint' }, 'Ctrl+Enter runs'), fs.hideBtn, fs.btn));
    if (!allowed) work.appendChild(U.serverNote('This lesson needs Python on your PC', lesson.runtimeWhy, '#/lessons/' + lesson.id));
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
      ex = U.codeArea(exBox, {
        value: e.code, stdin: e.stdin, height: 300, allowed: function () { return allowed; },
        extraButtons: [
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: function () { ex.editor.set(e.code); if (ex.stdin) ex.stdin.set(e.stdin); } }, 'Reset'),
          h('button', { class: 'btn btn-small', type: 'button', title: 'Step through this example and see its names and objects',
            onclick: function () { U.openInVisualize({ title: lesson.title, code: ex.editor.get(), stdin: ex.stdin ? ex.stdin.get() : '' }); } }, 'Visualize'),
          h('button', { class: 'btn btn-small', type: 'button', onclick: function () { U.openInPlayground({ title: lesson.title, code: ex.editor.get(), stdin: ex.stdin ? ex.stdin.get() : '' }); } }, 'Open in Playground')
        ]
      });
      if (e.note) exBox.appendChild(h('p', { class: 'faint', html: U.md(e.note) }));
    }

    function buildChallenge() {
      chArea = U.challenge(chBox, {
        challenge: ch, storeKey: 'lessons.work.' + lesson.id, allowed: function () { return allowed; },
        onPass: function () {
          markDone(lesson.id);
          return '🎉 All checks pass - lesson complete!' + (next ? ' Next: ' + next.title : '');
        }
      });
      U.currentLesson = { lesson: lesson, editor: chArea.editor, check: chArea.run };
    }

    showTab(U.store.get('lessons.tab.' + lesson.id, 'example'));
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
    destroy: function () { U.currentLesson = null; }
  };
  U.route('lessons', U.views.lessons);
})(window.PYLT);
