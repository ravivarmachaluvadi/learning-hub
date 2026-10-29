/*
 * views/lessons.js - the lesson list (#/lessons, #/lessons?track=scrum), one lesson
 * (#/lessons/<id>) and the review of missed quiz questions (#/lessons/review).
 *
 * A lesson is read top to bottom: the idea, the engineer's analogy, common mistakes, what to say,
 * where to practise it, the sources, and a short quiz. Finishing the quiz marks the lesson done.
 */
(function (U) {
  'use strict';
  var h = U.h;

  function lessonsOf(track) { return (U.data.lessons || []).filter(function (l) { return l.track === track; }); }

  function listPage(root, query) {
    var scores = U.quiz.scores();
    var tracks = (U.data.tracks || []).filter(function (t) { return lessonsOf(t.id).length; });
    var only = query.track && U.track(query.track) ? query.track : null;
    var done = (U.data.lessons || []).filter(function (l) { return scores[l.id]; }).length;

    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Lessons'),
      h('p', null, 'Short lessons, each with the idea, an analogy from engineering, the common mistakes, the words to use, and a 3-question quiz. ' +
        'Explainers (▶) show an idea with a picture you can change. ' +
        'Questions you miss come back later until you know them. ' + done + ' of ' + (U.data.lessons || []).length + ' done.')));
    var card = U.quiz.reviewCard();
    if (card) root.appendChild(card);
    root.appendChild(h('a', { class: 'card rl-promo', href: '#/reading' },
      h('b', null, 'The reading list: '), (U.data.reading || []).length + ' books, articles and guides behind the lessons, five of them marked "start here" →'));

    root.appendChild(h('div', { class: 'chips filter-chips', role: 'group', 'aria-label': 'Show lessons from' },
      h('a', { class: 'chip' + (only ? '' : ' selected'), href: '#/lessons' }, 'All'),
      tracks.map(function (t) {
        return h('a', { class: 'chip' + (only === t.id ? ' selected' : ''), href: '#/lessons?track=' + t.id }, t.name);
      })));

    var shown = only ? tracks.filter(function (t) { return t.id === only; }) : tracks;
    if (!shown.length) root.appendChild(h('p', { class: 'muted' }, 'This track has no lessons yet; they arrive in a later batch.'));
    shown.forEach(function (t) {
      root.appendChild(h('div', { class: 'track-title' }, U.trackBadge(t.id), h('h2', null, t.name)));
      root.appendChild(h('p', { class: 'muted track-summary' }, t.summary));
      lessonsOf(t.id).forEach(function (l, i) {
        var s = scores[l.id];
        root.appendChild(h('a', { class: 'lesson-row' + (s ? ' done' : ''), href: '#/lessons/' + l.id, 'data-id': l.id, 'data-track': l.track },
          h('span', { class: 'lesson-num', 'aria-hidden': 'true' }, s ? '✓' : String(i + 1)),
          h('span', { class: 'lesson-row-text' }, h('b', null, l.title), h('small', null, l.summary)),
          h('span', { class: 'faint lesson-row-meta' }, s ? 'Quiz ' + s.right + '/' + s.total : l.minutes + ' min')));
      });
      // the track's explainers: an idea with a picture you can change
      (U.data.explainers || []).filter(function (x) { return x.track === t.id; }).forEach(function (x) {
        root.appendChild(h('a', { class: 'lesson-row explainer-row', href: '#/explain/' + x.id, 'data-id': x.id, 'data-track': x.track },
          h('span', { class: 'lesson-num', 'aria-hidden': 'true' }, '▶'),
          h('span', { class: 'lesson-row-text' }, h('b', null, x.title), h('small', null, x.summary)),
          h('span', { class: 'faint lesson-row-meta' }, 'Explainer')));
      });
    });
    var missing = (U.data.tracks || []).filter(function (t) { return !lessonsOf(t.id).length; });
    if (missing.length && !only) {
      root.appendChild(h('p', { class: 'faint later-note' }, 'Lessons for ' + missing.map(function (t) { return t.name; }).join(', ') +
        ' arrive in later batches. Their scenarios and phrases are already here.'));
    }
  }

  function lessonPage(root, l) {
    var siblings = lessonsOf(l.track);
    var at = siblings.indexOf(l);
    var prev = siblings[at - 1], next = siblings[at + 1];
    var t = U.track(l.track);

    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/lessons' }, 'Lessons'), ' › ',
      h('a', { href: '#/lessons?track=' + l.track }, t ? t.name : l.track)));
    var text = h('article', { class: 'lesson-text' },
      h('div', { class: 'row' }, U.trackBadge(l.track), h('span', { class: 'faint' }, l.minutes + ' min read')),
      h('h1', null, l.title),
      h('p', { class: 'lesson-summary' }, l.summary),
      h('div', { class: 'lesson-body', html: U.md(l.body) }),
      U.callout('analogy', 'The engineer\'s analogy', U.md(l.analogy)),
      h('h2', null, 'Common mistakes'),
      h('ul', { class: 'lesson-mistakes' }, l.mistakes.map(function (m) { return h('li', { html: U.mdInline(m) }); })),
      h('h2', null, 'What to say'),
      h('ul', { class: 'lesson-say' }, l.say.map(function (s) {
        return h('li', null, h('span', { html: U.mdInline(s) }),
          h('button', { class: 'btn btn-small btn-ghost', type: 'button', title: 'Copy', 'aria-label': 'Copy this line', onclick: function () { U.copy(U.phraseText(s)); } }, 'Copy'));
      })),
      (l.related || []).length ? [h('h2', null, 'Practise it'), h('ul', { class: 'lesson-related' }, l.related.map(function (r) {
        var m = /^(\w+):(.+)$/.exec(r);
        return h('li', null, h('span', { class: 'badge' }, kindLabel(m[1])), ' ', h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) }));
      }))] : null,
      h('h2', null, 'Sources'),
      h('ul', { class: 'lesson-sources' }, l.sources.map(function (s) { return h('li', { html: U.mdInline(s) }); })),
      h('h2', null, 'Check yourself'));
    root.appendChild(text);

    // the quiz, plus up to two due review questions from other lessons
    var own = U.quiz.forLesson(l.id);
    var extra = U.quiz.due().filter(function (q) { return q.lesson !== l.id; }).slice(0, 2);
    U.quiz.render(text, own.concat(extra), { lesson: l.id });

    text.appendChild(h('div', { class: 'row lesson-nav' },
      prev ? h('a', { class: 'btn', href: '#/lessons/' + prev.id }, '← ' + prev.title) : null,
      h('span', { class: 'spacer' }),
      next ? h('a', { class: 'btn btn-primary', href: '#/lessons/' + next.id }, next.title + ' →') : h('a', { class: 'btn', href: '#/lessons' }, 'All lessons')));
  }

  var kindLabel = U.kindLabel;

  U.views.lessons = {
    render: function (root, params, query) {
      if (!params[0]) return listPage(root, query);
      if (params[0] === 'review') return U.quiz.reviewPage(root);
      var l = U.find('lessons', params[0]);
      if (!l) {
        root.appendChild(h('div', { class: 'card' }, h('h1', null, 'Lesson not found'),
          h('p', null, 'There is no lesson called "' + params[0] + '". '), h('a', { class: 'btn', href: '#/lessons' }, '← All lessons')));
        return;
      }
      lessonPage(root, l);
    }
  };
  U.route('lessons', U.views.lessons);
})(window.LELT);
