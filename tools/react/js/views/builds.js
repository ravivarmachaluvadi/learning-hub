/*
 * views/builds.js - Machine coding (#/build, #/build/<id>): the UI components interviews ask you to
 * build in 30 to 60 minutes, in React. Most are the React version of a plain-JS page in
 * java-interview-practice (AAScratches/11-UI-Practice), so you can compare the two ways; a
 * React-first problem (plainjs: null) shows its plainjsNote, how it is done without React, instead.
 *
 * A problem page has an interview timer (Start / Pause, kept across reloads in
 * "rlt.builds.time.<id>" as {secs}), the task, the follow-ups an interviewer asks once it works, and
 * a challenge (U.challenge, js/challenge.js) whose checks click and type in your component the way
 * a user would. All green records the solve in "rlt.builds.done" as {id: {at, secs, best}}: secs is
 * this solve's time and best the fastest timed solve, both null while the timer never ran (a best of
 * 0, saved before that rule, counts as no time). A pass with the solution shown records nothing
 * (js/challenge.js).
 *
 * The line between the problem and the code can be dragged, and Full screen puts the two across the
 * whole window (js/layout.js), as on a lesson.
 * The problem shape is described at the top of data/builds.js.
 * For the tests: RLT.currentChallenge = {kind: 'build', id, challenge, editor, check}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var LEVELS = ['Easy', 'Medium', 'Hard'];
  var PLAIN = 'java-interview-practice/AAScratches/11-UI-Practice/01-Components/';

  function builds() { return U.data.builds || []; }
  function done() { return U.store.get('builds.done', {}); }

  /* ---------- the list (#/build) ---------- */

  function list(root) {
    var d = done(), all = builds();
    var solved = all.filter(function (b) { return d[b.id]; }).length;
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Machine coding'),
      h('p', null, 'The UI components a front-end interview asks you to build against the clock: a counter, a star rating, an accordion, and harder ones as the tracks grow. ' +
        'Each has a timer, the follow-ups an interviewer asks once it works, and checks that click and type in your component the way a user would. ' +
        'Most are the React version of a plain-JS page you have in java-interview-practice, so you can compare the two; the few that are React-first say how the same thing is done without React.')));
    root.appendChild(h('div', { class: 'card narrow' },
      h('div', { class: 'row' }, h('b', null, solved + ' of ' + all.length + ' solved')),
      h('div', { class: 'progress', style: { marginTop: '8px' } }, h('span', { style: { width: (all.length ? solved / all.length * 100 : 0) + '%' } }))));
    var n = 0;
    LEVELS.forEach(function (level) {
      var bs = all.filter(function (b) { return b.level === level; });
      if (!bs.length) return;
      root.appendChild(h('h2', { class: 'level-title' }, level));
      bs.forEach(function (b) {
        n++;
        var rec = d[b.id];
        root.appendChild(h('a', { class: 'lesson-row build-row' + (rec ? ' done' : ''), href: '#/build/' + b.id },
          h('span', { class: 'lesson-num', 'aria-label': rec ? 'solved' : 'problem ' + n }, rec ? '✓' : String(n)),
          h('span', { class: 'lesson-row-text' }, h('b', null, b.title), h('small', null, b.summary)),
          h('span', { class: 'kata-badges' },
            h('span', { class: 'badge' }, b.minutes + ' min'),
            rec ? (rec.best ? h('span', { class: 'badge badge-ok', title: 'Your best time' }, 'best ' + U.clock(rec.best)) :
              h('span', { class: 'badge badge-ok', title: 'Solved with the timer off: start it to record a time' }, 'solved')) : null)));
      });
    });
  }

  /* ---------- the interview timer ---------- */

  function timer(id) {
    var key = 'builds.time.' + id;
    var secs = (U.store.get(key, {}) || {}).secs || 0;
    var startedAt = null, ticker = null;
    var time = h('span', { class: 'timer-time', 'aria-live': 'off' }, U.clock(secs));
    var toggle = h('button', { class: 'btn btn-small btn-primary', id: 'timer-toggle', type: 'button' }, '▶ Start');
    var reset = h('button', { class: 'btn btn-small btn-ghost', id: 'timer-reset', type: 'button' }, 'Reset');
    var el = h('div', { class: 'timer row', role: 'timer', 'aria-label': 'Interview timer' }, h('span', { class: 'faint' }, 'Timer'), time, toggle, reset);
    function now() { return secs + (startedAt ? (Date.now() - startedAt) / 1000 : 0); }
    function paint() { time.textContent = U.clock(now()); }
    function save() { U.store.set(key, { secs: Math.floor(now()) }); }
    function start() {
      if (startedAt) return;
      startedAt = Date.now();
      toggle.textContent = '❚❚ Pause';
      el.classList.add('running');
      ticker = setInterval(function () { paint(); save(); }, 250);
    }
    function pause() {
      if (!startedAt) return;
      secs = now();
      startedAt = null;
      clearInterval(ticker);
      toggle.textContent = '▶ Start';
      el.classList.remove('running');
      paint();
      save();
    }
    toggle.addEventListener('click', function () { if (startedAt) pause(); else start(); });
    reset.addEventListener('click', function () {
      if (!reset.getAttribute('data-armed')) { reset.setAttribute('data-armed', '1'); reset.textContent = 'Click again to reset'; return; }
      reset.removeAttribute('data-armed'); reset.textContent = 'Reset';
      pause();
      secs = 0;
      U.store.del(key);
      paint();
    });
    return { el: el, secs: function () { return Math.floor(now()); }, pause: pause, stop: function () { pause(); } };
  }

  /* ---------- one problem (#/build/<id>) ---------- */

  function buildPage(root, b) {
    var all = builds(), idx = all.indexOf(b);
    var prev = all[idx - 1], next = all[idx + 1];
    var rec = done()[b.id];
    var text = h('div', { class: 'lesson-text' });
    var work = h('div', { class: 'lesson-work' });
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/build' }, 'Machine coding'), ' › ', b.level + ' · problem ' + (idx + 1) + ' of ' + all.length));
    var layout = h('div', { class: 'lesson-layout' }, text, work);
    root.appendChild(layout);
    U.layout.split(layout, { key: 'lesson', def: 49, minLeft: 260, minRight: 380, label: 'Resize the problem and the code' });
    var fs = U.layout.full(layout, { kind: 'work', text: text, work: work });

    text.appendChild(h('h1', null, b.title));
    text.appendChild(h('div', { class: 'kata-meta' },
      h('span', { class: 'badge badge-accent' }, b.level),
      h('span', { class: 'badge' }, 'aim for ' + b.minutes + ' minutes'),
      rec ? h('span', { class: 'badge badge-ok' }, '✓ solved' + (rec.best ? ' · best ' + U.clock(rec.best) : ', no time yet')) : null));
    text.appendChild(h('p', { class: 'entry-summary' }, b.summary));
    text.appendChild(h('div', { class: 'task' }, h('div', { class: 'task-title' }, 'The task'), U.enhance(h('div', { html: U.md(b.task) }))));
    text.appendChild(h('h2', null, 'Once it works, the interviewer asks'));
    text.appendChild(U.enhance(h('ul', { class: 'q-followups' }, b.followups.map(function (x) { return h('li', { html: U.mdInline(x) }); }))));
    if ((b.learn || []).length) {
      text.appendChild(h('div', { class: 'row see-also' }, h('span', { class: 'faint' }, 'What it needs is taught in:'),
        b.learn.map(function (r) {
          var m = /^(\w+):(.+)$/.exec(r);
          return h('a', { class: 'btn btn-small', href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
        })));
    }
    var side = b.plainjs ? U.callout('java', 'The same problem in plain JavaScript', U.md(
      'You have it in `' + PLAIN + b.plainjs + '` (open it in Code Viewer). Compare: there, every handler changes a variable and then calls `render()` by hand; ' +
      'here, `useState` is the variable, and React calls your component again for you.')) :
      U.enhance(U.callout('java', 'Without React', U.md(b.plainjsNote)));   // a React-first problem: no plain-JS page, a note instead
    side.classList.add('plainjs-box');
    text.appendChild(side);
    text.appendChild(h('div', { class: 'row lesson-nav' },
      prev ? h('a', { class: 'btn', href: '#/build/' + prev.id }, '← ' + prev.title) : null,
      h('span', { class: 'spacer' }),
      next ? h('a', { class: 'btn btn-primary', href: '#/build/' + next.id }, next.title + ' →') : null));

    var t = timer(b.id);
    work.appendChild(h('div', { class: 'ed-tabs' }, h('b', null, 'Your component'), h('span', { class: 'spacer' }), t.el, fs.hideBtn, fs.btn));
    var area = U.challenge(work, {
      challenge: b, storeKey: 'builds.work.' + b.id, showTask: false,
      onPass: function () {
        t.stop();
        var secs = t.secs(), timed = secs > 0, d = done(), old = d[b.id];
        var oldBest = old && old.best > 0 ? old.best : null;
        d[b.id] = { at: new Date().toISOString(), secs: timed ? secs : null, best: timed ? Math.min(oldBest || secs, secs) : oldBest };
        U.store.set('builds.done', d);
        if (!timed) return '🎉 All checks pass. The timer was not running, so no time is recorded: start it next time to see how you do against the ' + b.minutes + ' minutes. Now answer the follow-ups out loud.';
        return '🎉 All checks pass in ' + U.clock(secs) + (secs <= b.minutes * 60 ? ', inside the ' + b.minutes + ' minutes.' : '. Next time, aim for ' + b.minutes + ' minutes.') +
          ' Now answer the follow-ups out loud.';
      }
    });
    U.currentChallenge = { kind: 'build', id: b.id, challenge: b, editor: area.editor, check: area.check };
    U.views.builds._timer = t;
  }

  U.views.builds = {
    render: function (root, params) {
      var b = params[0] && U.find('builds', params[0]);
      if (b) buildPage(root, b); else list(root);
    },
    destroy: function () {
      if (U.views.builds._timer) { U.views.builds._timer.pause(); U.views.builds._timer = null; }
      U.currentChallenge = null;
    }
  };
  U.route('build', U.views.builds);
})(window.RLT);
