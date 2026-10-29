/*
 * challenge.js - the parts every page with a React editor shares (the Python Learning Tool's
 * challenge.js, with a live preview instead of an output panel).
 *
 *   U.workbench(container, opts)  a JSX editor, Run (Ctrl+Enter), a live preview of the component
 *                                 and a console; the preview runs again a moment after you stop
 *                                 typing. A runtime error marks its line in the editor.
 *                                 opts: {code, css | getCss(), height, previewHeight, runLabel, onRun,
 *                                 onChange, extraButtons, live, autoRun, before (an element put
 *                                 above the editor, such as tabs), strict (render the component
 *                                 inside <StrictMode>, as a new React project does)}
 *                                 A grip between the editor and the Run bar sets the editor's height
 *                                 (js/layout.js): the height chosen is where every such editor starts.
 *   U.challenge(container, opts)  the task, a workbench whose "Check my answer" (Ctrl+Enter) renders
 *                                 your code afresh and then runs the checks inside the preview, a
 *                                 checklist that ticks or crosses each one, Hint / Reset / Show
 *                                 solution, and the work kept as you type. Used by lessons and by
 *                                 machine-coding problems (views/builds.js).
 *                                 A challenge with `strict: true` runs in <StrictMode> (its effects
 *                                 run twice on mount, so a missing cleanup shows).
 *                                 Show solution is remembered ("<storeKey>.shown", across reloads):
 *                                 while it is, a pass still ticks the checks but does not count
 *                                 (opts.onPass is not called) until Reset starts the work over.
 *                                 The mock interview leaves it out (opts.noSolution).
 *   U.challengeFor('lesson:r-jsx' | 'build:counter')
 *                                 the challenge object itself: {title, task, starter, solution, css?,
 *                                 hints, checks} (the tests use it)
 *
 * Check shapes (they run inside the preview, after React has drawn the component):
 *   {label, fn: 'async function (doc, win, t) { ... }'}  passes when it returns true or nothing; a
 *       string it returns is shown as what was found. t: $, $$, text(sel), count(sel), click(sel),
 *       type(sel, value), key(sel, key), hover(sel), leave(sel), submit(sel), paste(sel, text),
 *       tick(), wait(ms), warnings() (console errors and warnings so far), source() (the JSX as
 *       written), code() (the JavaScript Babel made of it), renders(async fn) (what rendered
 *       while fn ran: {ComponentName: commits it rendered in}), logs() (every console line so far,
 *       not only warnings), components(name) (each mounted instance of that component, or of
 *       every component when no name is given: {name, type, props, hooks, states (the values its
 *       state hooks hold now), contexts, handlers}, read from React's committed tree), tests() (a promise
 *       of the code's own test results, [{name, ok, error, ms}]) and testsOf(source) (the tests of
 *       another version of the code, say the component broken on purpose). click, type, key, hover, leave,
 *       submit and paste return a promise that settles once React has handled the event: `await`
 *       them. doc.activeElement is the element with the focus.
 *   {label, exists: sel}   {label, count: sel, eq|min|max}   {label, text: sel, equals|includes|match}
 */
(function (U) {
  'use strict';
  var h = U.h;
  var LIVE_DELAY = 700;   // ms after the last keystroke before the preview runs again

  /* ---------- an editor, a live preview and a console ---------- */

  U.workbench = function (container, opts) {
    var runBtn = h('button', { class: 'btn btn-primary', type: 'button', title: 'Ctrl+Enter' }, opts.runLabel || '▶ Run');
    var formatBtn = h('button', { class: 'btn btn-small btn-ghost format-btn', type: 'button', title: 'Tidy the code as Prettier does (Shift+Alt+F)' }, 'Format');
    var bar = h('div', { class: 'row run-bar' }, runBtn, formatBtn, opts.extraButtons || null);
    var editor = U.editor.create(null, {
      value: opts.code, height: U.layout.editorHeight('work', opts.height || 300), onRun: function () { (opts.onRun || run)(); },
      onChange: function (v) { if (opts.onChange) opts.onChange(v); if (opts.live !== false) liveRun(); }
    });
    var cons = U.preview.console(null);
    var hl = U.preview.highlighter();
    var preview = U.preview.create(null, {
      height: opts.previewHeight || 220, strict: !!opts.strict,
      onConsole: function (e) { cons.add(e); },
      onReload: function () { cons.clear(); editor.clearError(); hl.clear(); },
      onError: function (e) { if (e.line) editor.markError(e.line, e.message); },
      onRenders: hl.onRenders
    });
    var label = h('div', { class: 'preview-label' }, h('span', { class: 'live-dot', 'aria-hidden': 'true' }), 'Preview',
      h('span', { class: 'spacer' }), hl.toggle, h('span', { class: 'faint' }, 'React ' + U.react.VERSION));
    var grip = U.layout.grip({ kind: 'work', editors: [editor], preview: preview, def: opts.height || 300 });
    if (opts.before) container.appendChild(opts.before);
    container.appendChild(editor.el);
    editor.refresh();
    container.appendChild(grip.el);
    container.appendChild(bar);
    container.appendChild(label);
    container.appendChild(preview.wrap);
    container.appendChild(hl.line);
    container.appendChild(cons.el);

    var self = { editor: editor, preview: preview, console: cons, result: null, run: run, runBtn: runBtn };
    function run(o) {
      var css = opts.getCss ? opts.getCss() : opts.css || '';
      return preview.render({ code: editor.get(), css: css }, { force: o && o.force }).then(function (res) {
        if (res.state === 'replaced') return preview.lastRun;   // a newer run took over: its result is the one that counts
        self.result = res;
        if (res.state === 'error' && res.error && res.error.line) editor.markError(res.error.line, res.error.message);
        return res;
      });
    }
    var liveRun = U.debounce(function () {
      if (!editor.el.isConnected || editor.syntaxErrors().length) return;
      run();
    }, LIVE_DELAY);
    runBtn.addEventListener('click', function () { (opts.onRun || run)(); });
    formatBtn.addEventListener('click', function () { editor.format(); });
    if (opts.autoRun !== false) run();
    return self;
  };

  /* ---------- a checked challenge ---------- */

  /**
   * opts: {challenge, storeKey (where the work is kept as you type), extraButtons?: [..],
   * showTask?: false when the page already shows the task beside the editor,
   * noSolution?: true for no "Show solution" button (the mock interview),
   * onPass: fn() -> the celebration text, called each time every check passes}
   */
  U.challenge = function (box, opts) {
    var ch = opts.challenge;
    var saved = U.store.get(opts.storeKey, null);
    var shownKey = opts.storeKey + '.shown';
    var shown = !opts.noSolution && !!U.store.get(shownKey, false);   // the solution was put in the editor: passes do not count until Reset
    var checklist = h('ul', { class: 'checklist', 'aria-live': 'polite' });
    var status = h('div');
    var hintBox = h('div');
    var hintsShown = 0;
    if (opts.showTask !== false) {
      box.appendChild(h('div', { class: 'task' }, h('div', { class: 'task-title' }, ch.title || 'Challenge'), U.enhance(h('div', { html: U.md(ch.task) }))));
    }
    var hintBtn = h('button', { class: 'btn btn-small', type: 'button' }, 'Hint');
    var solBtn = h('button', { class: 'btn btn-small btn-ghost', type: 'button' }, 'Show solution');
    var resetBtn = h('button', { class: 'btn btn-small btn-ghost', type: 'button' }, 'Reset');
    var checking = null;
    var wb = U.workbench(box, {
      code: typeof saved === 'string' ? saved : ch.starter, css: ch.css || '', height: opts.height || 320, previewHeight: opts.previewHeight || 200, strict: !!ch.strict,
      runLabel: '✓ Check my answer', onRun: function () { check(); },
      onChange: function (v) { U.store.set(opts.storeKey, v); },
      extraButtons: [h('span', { class: 'spacer' }), hintBtn, resetBtn, opts.noSolution ? null : solBtn].concat(opts.extraButtons || [])
    });
    box.appendChild(checklist);
    box.appendChild(status);
    box.appendChild(hintBox);
    drawChecklist(null);
    if (shown) shownNote();

    function shownNote() {
      status.innerHTML = '';
      status.appendChild(h('p', { class: 'faint' }, 'The solution is in the editor: read it, change it, check it. ' +
        'A pass with it does not count; Reset, then write it yourself to make it count.'));
    }

    hintBtn.addEventListener('click', function () {
      if (hintsShown >= (ch.hints || []).length) return;
      hintBox.appendChild(U.enhance(U.callout('tip', 'Hint ' + (hintsShown + 1) + ' of ' + ch.hints.length, U.md(ch.hints[hintsShown]))));
      hintsShown++;
      if (opts.onHint) opts.onHint(hintsShown);
      if (hintsShown >= ch.hints.length) hintBtn.disabled = true;
    });
    if (!(ch.hints || []).length) hintBtn.disabled = true;
    resetBtn.addEventListener('click', function () {
      if (!resetBtn.getAttribute('data-armed')) { resetBtn.setAttribute('data-armed', '1'); resetBtn.textContent = 'Click again to start over'; return; }
      resetBtn.removeAttribute('data-armed'); resetBtn.textContent = 'Reset';
      U.store.del(opts.storeKey);
      U.store.del(shownKey);
      shown = false;
      status.innerHTML = '';
      wb.editor.set(ch.starter);
    });
    solBtn.addEventListener('click', function () {
      if (!solBtn.getAttribute('data-armed')) { solBtn.setAttribute('data-armed', '1'); solBtn.textContent = 'Click again to replace your code with the solution'; return; }
      solBtn.removeAttribute('data-armed'); solBtn.textContent = 'Show solution';
      shown = true;
      U.store.set(shownKey, true);
      wb.editor.set(ch.solution);
      U.store.set(opts.storeKey, ch.solution);
      shownNote();
      if (opts.onSolution) opts.onSolution();
    });

    function drawChecklist(results) {
      checklist.innerHTML = '';
      ch.checks.forEach(function (c, i) {
        var r = results ? results[i] || { ok: false, got: 'no result' } : null;
        checklist.appendChild(h('li', { class: r ? (r.ok ? 'ok' : 'fail') : 'todo' },
          h('span', { class: 'mark', 'aria-hidden': 'true' }, r ? (r.ok ? '✓' : '✗') : '○'),
          h('span', null, h('span', { html: U.mdInline(c.label) }), r && !r.ok && r.got ? h('span', { class: 'got' }, r.got) : null)));
      });
    }

    /** Render the code afresh, run every check in the preview, tick the list. Resolves with {state, results}. */
    function check() {
      if (checking) return checking;
      wb.runBtn.disabled = true;
      status.innerHTML = '';
      var note = h('p', { class: 'faint' }, 'Checking…');
      status.appendChild(note);
      var slow = setTimeout(function () { note.textContent = 'Still checking: some checks wait, as a user would, for a timer, a debounce or a slow answer.'; }, 1500);
      checking = wb.run({ force: true }).then(function (res) {
        return wb.preview.runChecks(ch.checks).then(function (results) { return { state: res.state, results: results }; });
      }).then(function (out) {
        clearTimeout(slow);
        report(out);
        checking = null;
        wb.runBtn.disabled = false;
        return out;
      });
      return checking;
    }

    function report(out) {
      var results = out.results;
      drawChecklist(results);
      var passed = results.filter(function (r) { return r.ok; }).length;
      var allOk = passed === ch.checks.length;
      box.setAttribute('data-result', allOk ? 'pass' : 'fail');
      status.innerHTML = '';
      if (allOk && shown) {
        status.appendChild(h('div', { class: 'helped-pass' }, '✓ All checks pass with the solution shown, so nothing is recorded. ' +
          'To make it count, click Reset (twice) and write it yourself.'));
      } else if (allOk) status.appendChild(h('div', { class: 'celebrate' }, opts.onPass ? opts.onPass() : '🎉 All checks pass!'));
      else {
        status.appendChild(h('p', { class: 'faint' }, passed + ' of ' + ch.checks.length + ' checks pass.' +
          (out.state === 'syntax' ? ' Your code does not compile yet: see the ✕ in the editor.' : out.state === 'unavailable' ? ' React could not start: see the message in the preview.' : '')));
      }
    }
    return { editor: wb.editor, workbench: wb, check: check, challenge: ch };
  };

  U.challengeFor = function (ref) {
    var m = /^(\w+):(.+)$/.exec(ref || '');
    if (!m) return null;
    if (m[1] === 'lesson') { var l = U.find('lessons', m[2]); return l && l.challenge; }
    if (m[1] === 'build') return U.find('builds', m[2]);
    return null;
  };
})(window.RLT);
