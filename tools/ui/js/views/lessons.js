/*
 * views/lessons.js - the guided course (#/lessons and #/lessons/<id>).
 *
 * A lesson has an explanation, an editable example and a challenge. The challenge's checks run
 * inside the preview (through the preview bridge): "is .box display: flex?", "is the button
 * clickable and does it add an item?". Checks re-run as you type; all green marks the lesson done.
 *
 * Check shapes (see the bridge in preview.js): {exists}, {count, min/max/eq}, {computed, prop,
 * equals/oneOf/match/min/max}, {attr, name, ...}, {text, ...}, {prop, sel, ...}, {centered, within},
 * {rect, side, ...}, {any: [...]}, {fn: 'function (doc, win, t) {...}'}. Two are handled here in the
 * app: {source: 'html'|'css'|'js', match: 'regex'} and {width: 400, check: {...}} (resize first).
 * Every check also has a `label` shown in the checklist.
 *
 * Each lesson ends with a quiz (views/quiz.js); #/lessons/review is the review of missed questions.
 * The line between the text and the code can be dragged, the grip under the editor sets its height,
 * and Full screen puts the two across the whole window, the text hideable (js/layout.js).
 */
(function (U) {
  'use strict';
  var h = U.h;
  var TRACKS = ['HTML', 'CSS', 'JavaScript'];

  function lessons() { return U.data.lessons || []; }
  function done() { return U.store.get('lessons.done', {}); }
  function markDone(id) { var d = done(); d[id] = new Date().toISOString(); U.store.set('lessons.done', d); }

  /* ---------- a small editor + preview workspace ---------- */

  /**
   * Lessons, recipes and the JavaScript topics all use it. A grip between the editors and the preview
   * sets the editors' height (js/layout.js): the height chosen is where every such editor starts.
   */
  function workspace(container, snippet, opts) {
    opts = opts || {};
    var modes = opts.modes || ['html', 'css', 'js'];
    var current = { html: snippet.html || '', css: snippet.css || '', js: snippet.js || '' };
    var tabs = h('div', { class: 'ed-tabs', role: 'tablist' });
    var edBox = h('div');
    var editors = {};
    var active = modes[0];
    var edHeight = U.layout.editorHeight('work', opts.height || 220);
    // in the page before the editors exist: CodeMirror measures itself when it is created, and one
    // made off-page stays blank until something refreshes it
    var stack = h('div', { class: 'stack' }, tabs, edBox);
    container.appendChild(stack);
    modes.forEach(function (m) {
      var b = h('button', { class: 'btn btn-small' + (m === active ? ' active' : ''), type: 'button', role: 'tab', 'data-mode': m }, U.editor.LABELS[m]);
      b.addEventListener('click', function () { show(m); });
      tabs.appendChild(b);
      var wrap = h('div', { hidden: m !== active });
      edBox.appendChild(wrap);
      editors[m] = {
        wrap: wrap,
        ed: U.editor.create(wrap, {
          mode: m, value: current[m], height: edHeight, onChange: changed,
          lint: m === 'css' || m === 'js',
          onTry: m === 'js' ? null : function (text) { tryRender(m, text); }
        })
      };
    });
    function show(m) {
      active = m;
      U.$$('button', tabs).forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-mode') === m); });
      modes.forEach(function (k) { editors[k].wrap.hidden = k !== m; });
      editors[m].ed.refresh();
    }
    var con = U.preview.console(null);
    var conWrap = h('div', { hidden: modes.indexOf('js') < 0 }, con.el);
    var preview = U.preview.create(null, {
      height: opts.previewHeight || 260, title: opts.title || 'Lesson preview',
      onConsole: function (e) { con.add(e); }, onReload: function () { con.clear(); },
      onReady: function () { lintSoon(); }
    });
    // trying a value from the autocomplete list: preview only, never saved or checked
    var trying = false;
    function tryRender(kind, text) {
      if (text === null) { trying = false; render(); return; }
      trying = true;
      var s = get();
      s[kind] = text;
      preview.render(s);
    }
    var lintSoon = U.debounce(function () {
      if (trying || !U.editorAssist) return;
      if (editors.css) {
        var css = editors.css.ed.get();
        U.editorAssist.lintCss(preview, css).then(function (list) {
          if (!trying && editors.css.ed.get() === css) editors.css.ed.setLint(list);
        });
      }
      if (editors.js) {
        var js = editors.js.ed.get();
        U.editorAssist.lintJs(preview, js).then(function (list) {
          if (!trying && editors.js.ed.get() === js) editors.js.ed.setLint(list);
        });
      }
    }, 500);
    stack.appendChild(U.layout.grip({ kind: 'work', editors: modes.map(function (m) { return editors[m].ed; }), preview: preview, def: opts.height || 220 }).el);
    stack.appendChild(h('div', null, h('div', { class: 'preview-label' }, h('span', { class: 'live-dot' }), 'Live preview'), preview.wrap));
    stack.appendChild(conWrap);

    var renderSoon = U.debounce(function () { render(); }, 300);
    function get() {
      var s = { html: current.html, css: current.css, js: current.js };
      modes.forEach(function (m) { s[m] = editors[m].ed.get(); });
      return s;
    }
    function changed() { renderSoon(); if (opts.onChange) opts.onChange(get()); }
    function render(force) { return preview.render(get(), { force: !!force }); }
    function set(s) {
      current = { html: s.html || '', css: s.css || '', js: s.js || '' };
      modes.forEach(function (m) { editors[m].ed.set(current[m], true); });
      return render(true);
    }
    render(true);
    return {
      get: get, set: set, render: render, preview: preview, show: show,
      refresh: function () { modes.forEach(function (m) { editors[m].ed.refresh(); }); },
      editors: editors
    };
  }

  /* ---------- running checks ---------- */

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /**
   * Run a lesson's checks against the workspace. Resolves with [{ok, got}] in the same order.
   * Runs are queued, never overlapping: a second run reloading the preview mid-check would make the
   * first one measure a half-loaded page. If something else reloads the preview during a run (the
   * learner kept typing), the run starts over, so a result always describes one consistent page.
   */
  var queue = Promise.resolve();
  function runChecks(checks, ws) {
    var job = queue.then(function () { return runOnce(checks, ws, 0); });
    queue = job.catch(function () { /* the caller reports it */ });
    return job;
  }

  function runOnce(checks, ws, attempt) {
    var snap = ws.get();
    var results = [];
    var fresh = true;
    var mine = -1;
    function rerender() {
      var p = ws.preview.render(snap, { force: true });
      mine = ws.preview.epoch;
      return p;
    }
    return rerender().then(function () {
      return checks.reduce(function (prev, c) {
        return prev.then(function () {
          if (c.source) {
            var ok = new RegExp(c.match, c.flags || 'i').test(snap[c.source] || '');
            results.push({ ok: c.negate ? !ok : ok, got: '' });
            return null;
          }
          var before = (c.fn && !fresh) ? rerender() : Promise.resolve();
          return before.then(function () {
            if (c.fn) fresh = false;
            if (c.width) {
              ws.preview.setWidth(c.width);
              return wait(150).then(function () { return ws.preview.ask({ type: 'checks', checks: [c.check] }); })
                .then(function (r) { ws.preview.setWidth(null); results.push((r && r[0]) || { ok: false, got: 'no answer from the preview' }); });
            }
            return ws.preview.ask({ type: 'checks', checks: [c] }).then(function (r) {
              results.push((r && r[0]) || { ok: false, got: 'no answer from the preview' });
            });
          });
        });
      }, Promise.resolve());
    }).then(function () {
      return fresh ? null : rerender(); // leave the learner a clean, un-clicked preview
    }).then(function () {
      if (ws.preview.epoch !== mine && attempt < 2) return runOnce(checks, ws, attempt + 1);
      return results;
    });
  }

  /* ---------- the list (#/lessons) ---------- */

  function list(root) {
    var d = done();
    var total = lessons().length, finished = lessons().filter(function (l) { return d[l.id]; }).length;
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Lessons'),
      h('p', null, 'A guided path from your first HTML page to an interactive page with JavaScript, written for a Java developer. ' +
        'Each lesson explains one idea, shows a working example you can edit, and ends with a small challenge that the tool checks for you as you type.')));
    root.appendChild(h('div', { class: 'card', style: { maxWidth: '640px' } },
      h('div', { class: 'row' }, h('b', null, finished + ' of ' + total + ' lessons done'), h('span', { class: 'spacer' }),
        finished ? h('button', {
          class: 'btn btn-small btn-ghost', type: 'button',
          onclick: function (e) {
            var b = e.currentTarget;
            if (b.getAttribute('data-armed')) { U.store.del('lessons.done'); U.render(); }
            else { b.setAttribute('data-armed', '1'); b.textContent = 'Click again to clear all progress'; }
          }
        }, 'Reset progress') : null),
      h('div', { class: 'progress', style: { marginTop: '8px' } }, h('span', { style: { width: (total ? finished / total * 100 : 0) + '%' } }))));
    var review = U.quiz.reviewCard();
    if (review) { review.style.maxWidth = '640px'; review.style.marginTop = '12px'; root.appendChild(review); }
    var scores = U.store.get('quiz.scores', {});
    var n = 0;
    TRACKS.forEach(function (t) {
      var ls = lessons().filter(function (l) { return l.track === t; });
      if (!ls.length) return;
      root.appendChild(h('div', { class: 'track-title' }, h('h2', { style: { margin: 0 } }, t), h('span', { class: 'badge' }, ls.length + ' lessons')));
      ls.forEach(function (l) {
        n++;
        var s = scores[l.id];
        root.appendChild(h('a', { class: 'lesson-row' + (d[l.id] ? ' done' : ''), href: '#/lessons/' + l.id },
          h('span', { class: 'lesson-num', 'aria-label': d[l.id] ? 'done' : 'lesson ' + n }, d[l.id] ? '✓' : String(n)),
          h('span', { class: 'lesson-row-text' }, h('b', null, l.title), h('small', null, l.summary)),
          s ? h('span', { class: 'badge quiz-badge' + (s.right === s.total ? ' badge-ok' : ''), title: 'Your last quiz score' }, 'Quiz ' + s.right + '/' + s.total) : null));
      });
    });
  }

  /* ---------- one lesson (#/lessons/<id>) ---------- */

  function lessonPage(root, lesson) {
    var all = lessons();
    var idx = all.indexOf(lesson);
    var prev = all[idx - 1], next = all[idx + 1];
    var ch = lesson.challenge;
    U.store.set('lessons.last', lesson.id);

    var text = h('div', { class: 'lesson-text' });
    var work = h('div', { class: 'lesson-work' });
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/lessons' }, 'Lessons'), ' › ', lesson.track + ' · lesson ' + (idx + 1) + ' of ' + all.length));
    var layout = h('div', { class: 'lesson-layout' }, text, work);
    root.appendChild(layout);
    U.layout.split(layout, { key: 'lesson', minLeft: 260, minRight: 380, label: 'Resize the lesson and the code' });
    var fs = U.layout.full(layout, { kind: 'work', text: text, work: work, fit: 'trade', panes: true });

    text.appendChild(h('h1', null, lesson.title));
    text.appendChild(h('p', { class: 'entry-summary' }, lesson.summary));
    text.appendChild(U.enhance(h('div', { html: U.md(lesson.body) })));
    if (lesson.java) text.appendChild(U.callout('java', 'Java analogy', U.md(lesson.java)));
    text.appendChild(h('h2', null, 'Your challenge'));
    text.appendChild(h('div', { class: 'task' }, h('div', { class: 'task-title' }, ch.title || 'Challenge'), U.enhance(h('div', { html: U.md(ch.task) }))));
    if (lesson.related && lesson.related.length) {
      text.appendChild(h('h3', null, 'Look these up in the reference'));
      text.appendChild(h('div', { class: 'related' }, lesson.related.map(function (r) {
        var m = /^(\w+):(.+)$/.exec(r);
        return h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
      })));
    }
    // the quiz, plus up to two questions missed in other lessons that are due for review
    var quiz = U.quiz.forLesson(lesson.id);
    if (quiz.length) {
      var again = U.quiz.due().filter(function (q) { return q.lesson !== lesson.id; }).slice(0, 2);
      text.appendChild(h('h2', { id: 'quiz' }, 'Check your understanding'));
      text.appendChild(h('p', { class: 'muted' }, 'Click an answer: you see at once whether it is right, and why.' +
        (again.length ? ' The last ' + (again.length === 1 ? 'question is one' : again.length + ' are ones') + ' you missed in another lesson.' : '')));
      U.quiz.render(text, quiz.concat(again), { lesson: lesson.id });
    }
    text.appendChild(h('div', { class: 'row', style: { marginTop: '24px' } },
      prev ? h('a', { class: 'btn', href: '#/lessons/' + prev.id }, '← ' + prev.title) : null,
      h('span', { class: 'spacer' }),
      next ? h('a', { class: 'btn btn-primary', href: '#/lessons/' + next.id }, next.title + ' →') : h('a', { class: 'btn btn-primary', href: '#/playground' }, 'Done! Go build something →')));

    // --- work area: Example | Challenge
    var modes = lesson.modes || ['html', 'css', 'js'];
    var tabEx = h('button', { class: 'btn', type: 'button' }, 'Example');
    var tabCh = h('button', { class: 'btn', type: 'button' }, 'Challenge');
    work.appendChild(h('div', { class: 'ed-tabs' }, tabEx, tabCh, h('span', { class: 'spacer' }),
      h('span', { class: 'faint' }, 'Edit the code - the preview follows.'), fs.hideBtn, fs.btn));
    var exBox = h('div'), chBox = h('div');
    work.appendChild(exBox); work.appendChild(chBox);

    var exWs = null, chWs = null;
    function showTab(which) {
      tabEx.classList.toggle('active', which === 'example');
      tabCh.classList.toggle('active', which === 'challenge');
      exBox.hidden = which !== 'example';
      chBox.hidden = which !== 'challenge';
      if (which === 'example' && !exWs) {
        exWs = workspace(exBox, lesson.example, { modes: modes, title: 'Example preview' });
        if (lesson.example.note) exBox.appendChild(h('p', { class: 'faint', html: U.md(lesson.example.note) }));
        exBox.appendChild(h('div', { class: 'row', style: { marginTop: '8px' } },
          h('button', { class: 'btn btn-small', type: 'button', onclick: function () { exWs.set(lesson.example); } }, 'Reset example'),
          h('button', { class: 'btn btn-small', type: 'button', onclick: function () { var s = exWs.get(); U.openInPlayground({ title: lesson.title, html: s.html, css: s.css, js: s.js }); } }, 'Open in Playground')));
      }
      if (which === 'challenge' && !chWs) buildChallenge();
      U.layout.refresh(work);   // the workspace now on show: fit it (in full screen) and redraw its editors
      U.store.set('lessons.tab.' + lesson.id, which);
    }
    tabEx.addEventListener('click', function () { showTab('example'); });
    tabCh.addEventListener('click', function () { showTab('challenge'); });

    function buildChallenge() {
      var saved = U.store.get('lessons.work.' + lesson.id, null);
      var checklist = h('ul', { class: 'checklist', 'aria-live': 'polite' });
      var status = h('div');
      var hintBox = h('div');
      var hintsShown = 0;
      chBox.appendChild(h('div', { class: 'task', style: { marginBottom: '10px' } }, h('div', { class: 'task-title' }, ch.title || 'Challenge'), U.enhance(h('div', { html: U.md(ch.task) }))));
      var checkSoon = U.debounce(check, 900);
      chWs = workspace(chBox, saved || ch.starter, {
        modes: modes, title: 'Challenge preview',
        onChange: function (s) { U.store.set('lessons.work.' + lesson.id, s); checkSoon(); }
      });
      var solBtn = h('button', { class: 'btn btn-small btn-ghost', type: 'button' }, 'Show solution');
      solBtn.addEventListener('click', function () {
        if (!solBtn.getAttribute('data-armed')) { solBtn.setAttribute('data-armed', '1'); solBtn.textContent = 'Click again to replace your code with the solution'; return; }
        solBtn.removeAttribute('data-armed'); solBtn.textContent = 'Show solution';
        U.store.set('lessons.work.' + lesson.id, ch.solution);
        chWs.set(ch.solution).then(check);
      });
      var hintBtn = h('button', { class: 'btn btn-small', type: 'button' }, 'Hint');
      hintBtn.addEventListener('click', function () {
        if (hintsShown >= (ch.hints || []).length) return;
        hintBox.appendChild(U.callout('tip', 'Hint ' + (hintsShown + 1), U.md(ch.hints[hintsShown])));
        hintsShown++;
        if (hintsShown >= ch.hints.length) hintBtn.disabled = true;
      });
      if (!(ch.hints || []).length) hintBtn.disabled = true;
      chBox.appendChild(h('div', { class: 'row', style: { margin: '10px 0' } },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: check }, 'Check my answer'),
        hintBtn,
        h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: function () { U.store.del('lessons.work.' + lesson.id); chWs.set(ch.starter).then(check); } }, 'Reset'),
        solBtn));
      chBox.appendChild(checklist);
      chBox.appendChild(status);
      chBox.appendChild(hintBox);

      var running = false, again = false;
      function check() {
        if (running) { again = true; return; }
        running = true;
        runChecks(ch.checks, chWs).then(function (results) {
          checklist.innerHTML = '';
          var passed = 0;
          ch.checks.forEach(function (c, i) {
            var r = results[i] || { ok: false };
            if (r.ok) passed++;
            checklist.appendChild(h('li', { class: r.ok ? 'ok' : 'fail' },
              h('span', { class: 'mark', 'aria-hidden': 'true' }, r.ok ? '✓' : '✗'),
              h('span', null, h('span', { html: U.md(c.label).replace(/^<p>|<\/p>$/g, '') }), !r.ok && r.got ? h('span', { class: 'got' }, 'Now: ' + r.got) : null)));
          });
          var allOk = passed === ch.checks.length;
          chBox.setAttribute('data-result', allOk ? 'pass' : 'fail');
          status.innerHTML = '';
          if (allOk) {
            markDone(lesson.id);
            status.appendChild(h('div', { class: 'celebrate' }, '🎉 All checks pass - lesson complete!' + (next ? ' Next: ' + next.title : '')));
          } else {
            status.appendChild(h('p', { class: 'faint' }, passed + ' of ' + ch.checks.length + ' checks pass.'));
          }
        }).catch(function (err) {
          status.innerHTML = '';
          status.appendChild(h('p', { class: 'console-error' }, 'The checker failed: ' + (err && err.message || err)));
        }).then(function () {
          running = false;
          if (again) { again = false; check(); }
        });
      }
      check();
      U.currentLesson = { lesson: lesson, workspace: chWs, check: check, checklist: checklist };
    }

    showTab(U.store.get('lessons.tab.' + lesson.id, 'example'));
  }

  U.views.lessons = {
    render: function (root, params) {
      if (params[0] === 'review') { U.quiz.reviewPage(root); return; }
      var lesson = params[0] && U.find('lessons', params[0]);
      if (lesson) lessonPage(root, lesson); else list(root);
    },
    destroy: function () { U.currentLesson = null; }
  };
  U.lessonTools = { runChecks: runChecks, workspace: workspace };
  U.route('lessons', U.views.lessons);
})(window.UILT);
