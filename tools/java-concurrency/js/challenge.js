/*
 * challenge.js - the parts every checked exercise shares (the Kotlin Learning Tool's): a lesson's
 * challenge, a practice kata (views/practice.js) and the mock interview's coding round (views/mock.js).
 *
 *   U.codeArea(container, opts)   an editor with Run / Stop and an output panel, and a grip right under
 *                                 the editor to make it taller or shorter (js/layout.js): the height
 *                                 chosen is where every lesson editor starts
 *   U.challenge(container, opts)  the task, an editor whose "Check my answer" (Ctrl+Enter) compiles and
 *                                 runs the program and then the checks (Java, see runner/Ctx.java),
 *                                 a checklist that ticks or crosses each one, Hint / Reset / Show
 *                                 solution, and the work kept as you type
 *   U.challengeFor('lesson:vt-create'), U.challengeFor('kata:fan-out')
 *                                 the challenge object itself: {title, task, starter, solution, stdin?,
 *                                 hints, checks, timeout?, files?} (the tests use it). files are the lesson's
 *                                 other Java files (an interface the task gives you, Service.java), compiled
 *                                 with the code and shown read-only above the editor (U.javaFiles).
 *                                 A kata's check may be an idiom check ({label, code, idiom: true}): it reads
 *                                 the code rather than running it, and the checklist marks it "idiom"
 */
(function (U) {
  'use strict';
  var h = U.h;

  /* ---------- an editor with Run / Stop and an output panel ---------- */

  /** The lesson's other Java files (a Service interface the task gives you), shown read-only above its editor. */
  U.javaFiles = function (files) {
    return h('details', { class: 'java-files', open: true },
      h('summary', null, files.length === 1 ? files[0].name + ', compiled with your code (read only)' : files.length + ' Java files, compiled with your code (read only)'),
      files.map(function (f) { return U.codeBlock(f.code, 'java', { label: f.name }).el; }));
  };

  U.codeArea = function (container, opts) {
    var runBtn = h('button', { class: 'btn btn-primary', type: 'button', title: 'Ctrl+Enter' }, opts.runLabel || '▶ Run');
    var stopBtn = h('button', { class: 'btn', type: 'button', disabled: true }, '■ Stop');
    var height = opts.height || 280;
    var files = opts.files && opts.files.length ? opts.files : null;
    var editor = U.editor.create(null, { value: opts.value, height: U.layout.editorHeight('work', height), onChange: opts.onChange, onRun: function () { run(); }, files: files });
    var stdin = opts.stdin !== undefined && opts.stdin !== null ? U.stdinBox(opts.stdin, opts.onStdin) : null;
    var panel = U.runPanel({ editor: editor, title: 'Output', emptyText: opts.emptyText });
    var bar = h('div', { class: 'row run-bar' }, runBtn, stopBtn, opts.extraButtons || null);
    var grip = U.layout.grip({ kind: 'work', editors: [editor], output: panel, def: height });
    if (files) container.appendChild(U.javaFiles(files));
    container.appendChild(editor.el);
    editor.refresh();
    container.appendChild(grip.el);
    if (stdin) container.appendChild(stdin.el);
    container.appendChild(bar);
    container.appendChild(panel.el);
    var running = false;
    function run() {
      if (running) return Promise.resolve(null);
      if (opts.allowed && !opts.allowed()) return Promise.resolve(null);
      running = true;
      runBtn.disabled = true;
      stopBtn.disabled = false;
      panel.start();
      var req = { code: editor.get(), stdin: opts.fixedStdin !== undefined ? opts.fixedStdin : (stdin ? stdin.get() : '') };
      if (opts.checks) req.checks = opts.checks;
      if (files) req.files = files;
      if (opts.timeout) req.timeout = opts.timeout;
      return U.run.exec(req, panel.append).then(function (res) {
        panel.show(res);
        if (opts.onResult) opts.onResult(res);
        return res;
      }).then(function (res) {
        running = false;
        runBtn.disabled = false;
        stopBtn.disabled = true;
        return res;
      });
    }
    runBtn.addEventListener('click', function () { run(); });
    stopBtn.addEventListener('click', function () { U.run.stop(); });
    return { editor: editor, panel: panel, run: run, stdin: stdin, runBtn: runBtn };
  };

  /* ---------- a checked challenge ---------- */

  /**
   * opts: {challenge, storeKey (where the work is kept as you type), allowed?: fn, extraButtons?: [..],
   * showTask?: false when the page already shows the task beside the editor,
   * noSolution?: true for no "Show solution" (the mock interview), onHint?: fn(hints shown so far),
   * onPass: fn() -> the celebration text, called each time every check passes}
   */
  U.challenge = function (box, opts) {
    var ch = opts.challenge;
    var saved = U.store.get(opts.storeKey, null);
    var checklist = h('ul', { class: 'checklist', 'aria-live': 'polite' });
    var status = h('div');
    var hintBox = h('div');
    var hintsShown = 0;
    if (opts.showTask !== false) {
      box.appendChild(h('div', { class: 'task' }, h('div', { class: 'task-title' }, ch.title || 'Challenge'), U.enhance(h('div', { html: U.md(ch.task) }))));
    }
    if (ch.stdin) {
      box.appendChild(h('div', { class: 'faint' }, 'Your program is checked with this input (one line per IO.readln() call):'));
      box.appendChild(h('pre', { class: 'code stdin-show' }, ch.stdin));
    }
    var hintBtn = h('button', { class: 'btn btn-small', type: 'button' }, 'Hint');
    var solBtn = opts.noSolution ? null : h('button', { class: 'btn btn-small btn-ghost', type: 'button' }, 'Show solution');
    var resetBtn = h('button', { class: 'btn btn-small btn-ghost', type: 'button' }, 'Reset');
    var area = U.codeArea(box, {
      value: typeof saved === 'string' ? saved : ch.starter, height: opts.height || 300, runLabel: '✓ Check my answer',
      fixedStdin: ch.stdin || '', checks: ch.checks, timeout: ch.timeout, allowed: opts.allowed, files: ch.files,
      emptyText: 'Press "Check my answer" (Ctrl+Enter): your program runs, then each check below is ticked or crossed.',
      onChange: function (v) { U.store.set(opts.storeKey, v); },
      extraButtons: [h('span', { class: 'spacer' }), hintBtn, resetBtn, solBtn].concat(opts.extraButtons || []),
      onResult: report
    });
    box.appendChild(checklist);
    box.appendChild(status);
    box.appendChild(hintBox);
    drawChecklist(null);

    hintBtn.addEventListener('click', function () {
      if (hintsShown >= (ch.hints || []).length) return;
      hintBox.appendChild(U.enhance(U.callout('tip', 'Hint ' + (hintsShown + 1) + ' of ' + ch.hints.length, U.md(ch.hints[hintsShown]))));
      hintsShown++;
      if (hintsShown >= ch.hints.length) hintBtn.disabled = true;
      if (opts.onHint) opts.onHint(hintsShown);
    });
    if (!(ch.hints || []).length) hintBtn.disabled = true;
    resetBtn.addEventListener('click', function () {
      if (!resetBtn.getAttribute('data-armed')) { resetBtn.setAttribute('data-armed', '1'); resetBtn.textContent = 'Click again to start over'; return; }
      resetBtn.removeAttribute('data-armed'); resetBtn.textContent = 'Reset';
      U.store.del(opts.storeKey);
      area.editor.set(ch.starter);
    });
    if (solBtn) solBtn.addEventListener('click', function () {
      if (!solBtn.getAttribute('data-armed')) { solBtn.setAttribute('data-armed', '1'); solBtn.textContent = 'Click again to replace your code with the solution'; return; }
      solBtn.removeAttribute('data-armed'); solBtn.textContent = 'Show solution';
      area.editor.set(ch.solution);
      U.store.set(opts.storeKey, ch.solution);
    });

    function drawChecklist(results) {
      checklist.innerHTML = '';
      ch.checks.forEach(function (c, i) {
        var r = results ? results[i] || { ok: false, got: 'no result' } : null;
        checklist.appendChild(h('li', { class: r ? (r.ok ? 'ok' : 'fail') : 'todo', 'data-idiom': c.idiom ? '1' : null },
          h('span', { class: 'mark', 'aria-hidden': 'true' }, r ? (r.ok ? '✓' : '✗') : '○'),
          h('span', null, c.idiom ? h('span', { class: 'check-kind', title: 'This check reads your code: it is about how the code is written' }, 'idiom') : null,
            h('span', { html: U.mdInline(c.label) }), r && !r.ok && r.got ? h('span', { class: 'got' }, r.got) : null)));
      });
    }

    function report(res) {
      var results = res.checks || [];
      drawChecklist(results);
      var passed = results.filter(function (r) { return r.ok; }).length;
      var allOk = passed === ch.checks.length;
      box.setAttribute('data-result', allOk ? 'pass' : 'fail');
      status.innerHTML = '';
      if (allOk) status.appendChild(h('div', { class: 'celebrate' }, opts.onPass ? opts.onPass() : '🎉 All checks pass!'));
      else status.appendChild(h('p', { class: 'faint' }, passed + ' of ' + ch.checks.length + ' checks pass.'));
    }
    return { editor: area.editor, run: area.run, challenge: ch };
  };

  U.challengeFor = function (ref) {
    var m = /^(\w+):(.+)$/.exec(ref || '');
    if (!m) return null;
    if (m[1] === 'lesson') { var l = U.find('lessons', m[2]); return l && l.challenge; }
    if (m[1] === 'kata') return U.find('katas', m[2]);
    return null;
  };

})(window.JCLT);
