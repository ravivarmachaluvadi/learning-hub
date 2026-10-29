/*
 * views/explainers.js - the explainers (#/explain, #/explain/<id>): an idea taken apart one move at
 * a time, then the same code run in real React to compare.
 *
 * An explainer's page has its examples (data/explainers.js) as chips. For the chosen one: Reset,
 * Back, Step, Play and End move through its steps; the code shows the line each step is on; the
 * picture shows the render React is in and the state's value there, React's queue of updates, what
 * is running, what waits to run (timers, and effects waiting for the paint), the cleanups React keeps,
 * the screen and the console. stateAt(example, k) works the picture out from the first k steps'
 * operations (listed at the top of data/explainers.js).
 *
 * Under it, "Now in real React" runs the example's code in a preview with its console (inside
 * <StrictMode> when the example says strict: true). Picking an example runs it afresh.
 * tests/test_ui.py ("explain") clicks its button once and checks that the screen and the console end
 * exactly where the last step does.
 * The line between the steps and the picture can be dragged, and Full screen puts the whole page
 * across the window (js/layout.js).
 */
(function (U) {
  'use strict';
  var h = U.h;
  var PLAY_EVERY = 1600;      // ms between steps while playing
  var REAL_CSS = 'button { font-size: 18px; padding: 8px 18px; border-radius: 8px; border: 1px solid #b5c0cf; background: #eef2f7; cursor: pointer; }';
  var playing = null;

  function explainers() { return U.data.explainers || []; }

  function fresh() { return { render: 0, snap: null, screen: '', running: '', queue: [], log: [], waiting: [], kept: [] }; }

  /** The picture after the first k steps of an example. */
  function stateAt(ex, k) {
    var st = fresh();
    for (var i = 0; i < k; i++) {
      ex.steps[i][1].forEach(function (op) {
        var sp = op.indexOf(' '), kind = sp < 0 ? op : op.slice(0, sp), arg = sp < 0 ? '' : op.slice(sp + 1);
        if (kind === 'render') { st.render = +arg; st.snap = null; }
        else if (kind === 'snap') st.snap = arg;
        else if (kind === 'screen') st.screen = arg;
        else if (kind === 'run') st.running = arg;
        else if (kind === 'queue') st.queue.push({ text: arg, result: null });
        else if (kind === 'apply') {
          var next = st.queue.filter(function (q) { return q.result === null; })[0];
          if (next) next.result = arg;
        }
        else if (kind === 'clear') st.queue = [];
        else if (kind === 'log') st.log.push(arg);
        else if (kind === 'wait' || kind === 'every') st.waiting.push({ text: arg, every: kind === 'every' });
        else if (kind === 'fire') {
          var first = st.waiting.shift();
          if (first && first.every) st.waiting.push(first);   // an interval waits again
        }
        else if (kind === 'cancel') {
          var at = st.waiting.map(function (w) { return w.text; }).indexOf(arg);
          if (at >= 0) st.waiting.splice(at, 1);
        }
        else if (kind === 'keep') st.kept.push(arg);
        else if (kind === 'drop') {
          var k2 = st.kept.indexOf(arg);
          if (k2 >= 0) st.kept.splice(k2, 1);
        }
      });
    }
    return st;
  }

  function stop() { if (playing) { clearInterval(playing.timer); playing.button.textContent = '▶ Play'; playing = null; } }

  /* ---------- the list (#/explain) ---------- */

  function list(root) {
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Explainers'),
      h('p', null, 'The ideas that trip people up, taken apart one move at a time: what React holds, what it queues, what it draws. ' +
        'Each one then runs the same code in real React, so you can check every step against the real thing.')));
    root.appendChild(h('div', { class: 'cards' }, explainers().map(function (x) {
      var t = U.find('tracks', x.track);
      return h('a', { class: 'card', href: '#/explain/' + x.id },
        h('div', { class: 'card-kicker' }, (t ? t.title + ' · ' : '') + x.examples.length + ' examples'),
        h('h3', null, x.title),
        h('p', { class: 'muted', style: { margin: 0 } }, x.summary));
    })));
  }

  /* ---------- one explainer (#/explain/<id>) ---------- */

  function page(root, x) {
    var t = U.find('tracks', x.track);
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/explain' }, 'Explainers'), ' › ', t ? t.title : x.track));
    root.appendChild(h('h1', null, x.title));
    root.appendChild(U.enhance(h('div', { class: 'lesson-body xp-intro', html: U.md(x.intro) })));

    var cur = { ex: x.examples[0], step: 0 };

    // --- left: the example, the buttons, the code
    var chips = h('div', { class: 'xp-examples', role: 'group', 'aria-label': 'Example' }, x.examples.map(function (e) {
      return h('button', { class: 'xp-chip', type: 'button', 'data-example': e.id, onclick: function () { pick(e); } }, e.label);
    }));
    var desc = h('p', { class: 'faint xp-desc' });
    function btn(act, label, title) { return h('button', { class: 'btn btn-small', type: 'button', 'data-act': act, title: title }, label); }
    var bReset = btn('reset', '⏮ Reset', 'Back to the start'), bBack = btn('back', '◀ Back', 'One step back');
    var bStep = btn('step', 'Step ▶', 'One step on'), bPlay = btn('play', '▶ Play', 'Step by itself'), bEnd = btn('end', 'End ⏭', 'Jump to the last step');
    bStep.classList.add('btn-primary');
    var stepEl = h('span', { class: 'xp-step faint', 'aria-live': 'polite' });
    var codeBox = h('pre', { class: 'xp-code cm-s-rlt', 'aria-label': 'The example code' });
    var buttons = h('div', { class: 'xp-buttons' }, bReset, bBack, bStep, bPlay, bEnd, stepEl, h('span', { class: 'spacer' }));
    var left = h('div', { class: 'xp-left' }, chips, desc, buttons, codeBox);

    // --- right: what happens, and the picture
    var say = h('div', { class: 'callout callout-info xp-say', 'aria-live': 'polite' });
    function panel(key, title, sub) {
      var body = h('div', { class: 'xp-panel-body' });
      var el = h('div', { class: 'xp-panel', 'data-panel': key }, h('div', { class: 'xp-panel-head' }, h('b', null, title), h('span', null, sub)), body);
      return { el: el, body: body };
    }
    var P = {
      render: panel('render', 'This render', 'its own fixed values'),
      queue: panel('queue', 'React\'s queue', 'updates for the next render'),
      screen: panel('screen', 'The screen', 'what the page shows'),
      log: panel('log', 'Console', 'what the code printed'),
      wait: panel('wait', 'Waiting to run', 'timers, and effects waiting for the paint'),
      kept: panel('kept', 'Kept by React', 'cleanups, for the next run or the unmount')
    };
    P.log.body.classList.add('xp-log');
    var right = h('div', { class: 'xp-right' }, say,
      h('div', { class: 'xp-panels' }, P.render.el, P.queue.el, P.screen.el, P.log.el, P.wait.el, P.kept.el));
    var layout = h('div', { class: 'xp-layout' }, left, right);
    root.appendChild(layout);
    U.layout.split(layout, { key: 'explain', def: 50, minLeft: 300, minRight: 340, label: 'Resize the steps and the picture' });
    buttons.appendChild(U.layout.full(layout, { kind: 'explain', root: root }).btn);

    // --- the same code in real React
    var con = U.preview.console(null);
    var hl = U.preview.highlighter();
    // a screen of several lines (a list) needs a taller preview than a single button
    var tall = x.examples.some(function (e) { return e.steps.some(function (s) { return s[1].some(function (op) { return /^screen [^]*\n/.test(op); }); }); });
    var real = U.preview.create(null, { height: tall ? 150 : 90, title: 'The example, in real React', onConsole: function (e) { con.add(e); },
      onReload: function () { con.clear(); hl.clear(); }, onRenders: hl.onRenders });
    var strictNote = h('p', { class: 'faint xp-strict', hidden: true }, 'This example runs inside <StrictMode>, in development, as a new React project does: React calls the component twice and runs each effect, its cleanup and the effect again when it first appears.');
    var again = h('button', { class: 'btn btn-small', type: 'button', onclick: runReal }, 'Run it again');
    var toPlayground = h('button', { class: 'btn btn-small', type: 'button', onclick: function () {
      U.openInPlayground({ title: x.title + ': ' + cur.ex.label, code: cur.ex.code, css: REAL_CSS });
    } }, 'Open in Playground');
    root.appendChild(h('section', { class: 'xp-real' },
      h('h2', null, 'Now in real React'),
      h('p', { class: 'muted' }, 'The same code, running on React ' + U.react.VERSION + '. Click the button once, then compare the screen and the console with the last step above. "Run it again" starts it afresh.'),
      h('div', { class: 'preview-label' }, h('span', { class: 'live-dot', 'aria-hidden': 'true' }), 'Preview', h('span', { class: 'spacer' }), hl.toggle, again, toPlayground),
      strictNote, real.wrap, hl.line, con.el));

    if (x.outro) root.appendChild(U.enhance(h('div', { class: 'lesson-body xp-outro', html: U.md(x.outro) })));
    if ((x.related || []).length) {
      root.appendChild(h('div', { class: 'row see-also' }, h('span', { class: 'faint' }, 'See also:'),
        x.related.map(function (r) {
          var m = /^(\w+):(.+)$/.exec(r);
          return h('a', { class: 'btn btn-small', href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
        })));
    }

    function runReal() {
      real.opts.strict = !!cur.ex.strict;
      strictNote.hidden = !cur.ex.strict;
      real.render({ code: cur.ex.code, css: REAL_CSS }, { force: true });
    }

    function drawCode() {
      codeBox.innerHTML = '';
      cur.ex.code.replace(/\n$/, '').split('\n').forEach(function (text, i) {
        var codeEl = h('span', { class: 'xp-text' });
        if (window.CodeMirror && window.CodeMirror.runMode) window.CodeMirror.runMode(text, 'jsx', codeEl); else codeEl.textContent = text;
        codeBox.appendChild(h('div', { class: 'xp-line', 'data-line': i + 1 }, h('span', { class: 'xp-ln', 'aria-hidden': 'true' }, String(i + 1)), codeEl));
      });
    }

    function items(p, list, isNew, empty) {
      p.body.innerHTML = '';
      if (!list.length) { p.body.appendChild(h('span', { class: 'xp-empty' }, empty)); return; }
      list.forEach(function (el, i) { if (isNew(i)) el.classList.add('xp-new'); p.body.appendChild(el); });
    }

    function draw() {
      var ex = cur.ex, k = cur.step, total = ex.steps.length;
      var st = stateAt(ex, k), old = stateAt(ex, Math.max(0, k - 1));
      var line = k ? ex.steps[k - 1][0] : 0;

      // this render
      P.render.body.innerHTML = '';
      if (!st.render) P.render.body.appendChild(h('span', { class: 'xp-empty' }, 'Nothing has rendered yet.'));
      else {
        P.render.body.appendChild(h('div', { class: 'xp-snap' + (st.render !== old.render || st.snap !== old.snap ? ' xp-new' : '') },
          'Render ' + st.render + ': ', h('code', null, ex.state || 'count'), ' = ', st.snap === null ? h('i', { class: 'faint' }, 'being worked out…') : h('b', null, st.snap)));
      }
      if (st.running) P.render.body.appendChild(h('div', { class: 'xp-running' }, 'Running: ', h('code', null, st.running)));

      // the queue
      items(P.queue, st.queue.map(function (q) {
        return h('div', { class: 'xp-item' + (q.result !== null ? ' xp-applied' : '') }, q.text, q.result !== null ? h('span', { class: 'xp-result' }, ' → ' + q.result) : null);
      }), function (i) { var o = old.queue[i]; return !o || o.result !== st.queue[i].result; }, '(empty)');

      // the screen
      P.screen.body.innerHTML = '';
      P.screen.body.appendChild(st.screen ? h('span', { class: 'xp-screen' + (st.screen !== old.screen ? ' xp-new' : '') }, st.screen) : h('span', { class: 'xp-empty' }, '(blank)'));

      // the console, and what waits
      items(P.log, st.log.map(function (l) { return h('div', { class: 'xp-item' }, l); }), function (i) { return i >= old.log.length; }, '(nothing printed yet)');
      function uses(kinds) { return ex.steps.some(function (s) { return s[1].some(function (op) { return kinds.indexOf(op.split(' ')[0]) >= 0; }); }); }
      P.wait.el.hidden = !uses(['wait', 'every']);
      items(P.wait, st.waiting.map(function (w) {
        return h('div', { class: 'xp-item' }, w.text, w.every ? h('span', { class: 'xp-every', title: 'An interval: it runs again and again until it is cleared' }, ' ↻') : null);
      }), function (i) { var o = old.waiting[i]; return !o || o.text !== st.waiting[i].text; }, '(nothing)');
      P.kept.el.hidden = !uses(['keep']);
      items(P.kept, st.kept.map(function (c) { return h('div', { class: 'xp-item' }, c); }), function (i) { return old.kept.indexOf(st.kept[i]) < 0; }, '(nothing)');

      U.$$('.xp-line', codeBox).forEach(function (l) { l.classList.toggle('xp-line-on', +l.getAttribute('data-line') === line); });
      say.innerHTML = '';
      say.appendChild(h('div', { class: 'callout-title' }, k ? 'Step ' + k + ' of ' + total : 'Before the first render'));
      say.appendChild(U.enhance(h('div', { class: 'callout-body', html: U.md(k ? ex.steps[k - 1][2] : ex.desc + ' Press **Step** to go one move at a time, or **Play** to watch it run.') })));
      stepEl.textContent = 'Step ' + k + ' of ' + total;
      stepEl.setAttribute('data-step', k);
      stepEl.setAttribute('data-total', total);
      bReset.disabled = bBack.disabled = k === 0;
      bStep.disabled = bEnd.disabled = k === total;
      U.$$('.xp-chip', chips).forEach(function (c) {
        var on = c.getAttribute('data-example') === ex.id;
        c.classList.toggle('active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      desc.textContent = ex.desc;
    }

    function go(k) { cur.step = Math.max(0, Math.min(cur.ex.steps.length, k)); draw(); }
    function pick(e) { stop(); cur.ex = e; cur.step = 0; drawCode(); draw(); runReal(); }
    bReset.addEventListener('click', function () { stop(); go(0); });
    bBack.addEventListener('click', function () { stop(); go(cur.step - 1); });
    bStep.addEventListener('click', function () { stop(); go(cur.step + 1); });
    bEnd.addEventListener('click', function () { stop(); go(cur.ex.steps.length); });
    bPlay.addEventListener('click', function () {
      if (playing) { stop(); return; }
      if (cur.step >= cur.ex.steps.length) go(0);
      bPlay.textContent = '⏸ Pause';
      go(cur.step + 1);
      playing = { button: bPlay, timer: setInterval(function () {
        if (!bPlay.isConnected || cur.step >= cur.ex.steps.length) { stop(); return; }
        go(cur.step + 1);
      }, PLAY_EVERY) };
    });
    pick(cur.ex);
  }

  U.views.explain = {
    render: function (root, params) {
      var x = params[0] && U.find('explainers', params[0]);
      if (x) page(root, x); else list(root);
    },
    destroy: function () { stop(); }
  };
  U.route('explain', U.views.explain);
})(window.RLT);
