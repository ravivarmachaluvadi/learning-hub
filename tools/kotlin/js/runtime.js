/*
 * runtime.js - compiles and runs Kotlin through the local server, ktlearn.py, behind one API.
 *
 *   served by ktlearn   (http://127.0.0.1:8027) every run is a POST to /api/run: the server compiles
 *                       the code with this PC's kotlinc (a compiler kept warm in one JVM) and runs it on
 *                       this PC's JDK, then the challenge's checks (runner/Harness.kt)
 *   opened from disk    (file://) or the server does not answer: every page still reads, but a run
 *                       returns a result that says how to start ktlearn (Kotlin has no compiler that
 *                       runs inside a page)
 *
 * The API (the Python Learning Tool's, without its in-browser runtime):
 *
 *   KLT.run.info            {state: 'loading'|'ready'|'warming'|'offline'|'error', kotlin, java, coroutines, label, detail}
 *   KLT.run.onChange(fn)    fn(info) now and after every change (the top-bar badge uses it)
 *   KLT.run.ready()         a Promise for the info once the server answered, or did not
 *   KLT.run.exec(req, onEvent)
 *                           req: {code, stdin, checks?, timeout?, lang?: 'kotlin' | 'java', files?: [{name, code}]};
 *                           onEvent(kind, text) gets output while the program runs (from /api/peek). Resolves
 *                           with ktlearn's result; never rejects. Runs are queued, one at a time. lang 'java'
 *                           runs the code as Main.java; files are Java files compiled with a Kotlin program.
 *   KLT.run.stop()          end the current run now (the Stop button)
 *   KLT.run.available()     true when code can run here (served by ktlearn, and it answered)
 *   KLT.run.syntax(code, who?, files?)
 *                           for the editor's live underline: a Promise for the compile errors in code (with
 *                           the Java files it calls, when it has some),
 *                           [{line, col, endLine, endCol, message, hint}], [] when it compiles, or null when
 *                           there is no compiler to ask (opened from disk) or newer text replaced it.
 *                           POST /api/compile: compiled, nothing run. One compile is out at a time; while it
 *                           is, only the newest text of each `who` (an editor) waits, and the text it
 *                           replaced gets null. Runs do not wait for it: the server takes turns.
 */
(function (U) {
  'use strict';

  var DEFAULT_TIMEOUT = 10;                   // seconds, the same as ktlearn.py
  var info = { state: 'loading', runtime: null, kotlin: null, java: null, coroutines: null, label: 'Looking for the compiler…', detail: '' };
  var listeners = [];
  var readyWaiters = [];
  var queue = Promise.resolve();
  var current = null;                         // the run in progress
  var seq = 0;

  function set(patch) {
    Object.assign(info, patch);
    if (info.state === 'ready') info.label = 'Kotlin ' + info.kotlin + ' · your PC';
    else if (info.state === 'warming') info.label = 'Kotlin ' + info.kotlin + ' · warming up…';
    else if (info.state === 'offline') info.label = 'Reading only: start ktlearn to run';
    else if (info.state === 'error') info.label = 'Compiler unavailable';
    listeners.forEach(function (fn) { try { fn(info); } catch (e) { console.error(e); } });
    if (info.state !== 'loading') {
      var w = readyWaiters;
      readyWaiters = [];
      w.forEach(function (r) { r(info); });
    }
  }

  function serverExec(req, onEvent) {
    var id = 'r' + Date.now().toString(36) + (++seq);
    var run = current = { id: id, done: false };
    // the run's own request answers only at the end; meanwhile, show what it prints as it prints it
    var offset = 0;
    function peek() {
      if (run.done) return;
      fetch('api/peek?id=' + encodeURIComponent(id) + '&from=' + offset, { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (p) {
          if (run.done) return;
          offset = p.next;
          if (p.text && onEvent) onEvent('out', p.text);
          setTimeout(peek, 250);
        })
        .catch(function () { if (!run.done) setTimeout(peek, 500); });
    }
    setTimeout(peek, 250);
    return fetch('api/run', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-KtLearn': '1' },
      body: JSON.stringify({ id: id, code: req.code, stdin: req.stdin || '', checks: req.checks || null, timeout: req.timeout || DEFAULT_TIMEOUT,
        lang: req.lang || 'kotlin', files: req.files && req.files.length ? req.files : null })
    }).then(function (r) {
      if (!r.ok) throw new Error('the server answered ' + r.status);
      return r.json();
    }).catch(function (err) {
      return unavailable(req, 'The local server did not answer (' + (err && err.message || err) + '). Is the ktlearn window still open?');
    }).then(function (res) {
      run.done = true;
      if (current && current.id === id) current = null;
      if (res.phase !== 'unavailable' && info.state === 'warming') set({ state: 'ready' });
      return res;
    });
  }

  /** The result of a run that could not happen: the same shape as ktlearn's. */
  function unavailable(req, message) {
    var res = {
      ok: false, phase: 'unavailable', output: '', events: [], truncated: false, ms: 0, diagnostics: [],
      error: { type: 'Unavailable', message: message, line: null, col: null, endCol: null, traceback: message + '\n', hint: null }
    };
    if (req.checks) res.checks = req.checks.map(function () { return { ok: false, got: message }; });
    return res;
  }

  /* ---------- the live underline: compile only ---------- */

  var waiting = [];                           // [{who, code, resolve}], oldest first, one per who
  var compiling = false;

  function syntax(code, who, files) {
    who = who || 'default';
    return U.run.ready().then(function () {
      if (!U.run.available()) return null;
      return new Promise(function (resolve) {
        waiting = waiting.filter(function (w) {
          if (w.who !== who) return true;
          w.resolve(null);                    // replaced by newer text before it was sent
          return false;
        });
        waiting.push({ who: who, code: String(code || ''), files: files && files.length ? files : null, resolve: resolve });
        nextCompile();
      });
    });
  }

  function nextCompile() {
    if (compiling || !waiting.length) return;
    var job = waiting.shift();
    compiling = true;
    fetch('api/compile', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-KtLearn': '1' }, body: JSON.stringify({ code: job.code, files: job.files })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (res) {
        compiling = false;
        job.resolve(res && Array.isArray(res.errors) ? res.errors : null);
        nextCompile();
      });
  }

  var OFFLINE = 'Kotlin has to be compiled before it runs, and this page was opened from disk, so there is no compiler to ask. ' +
    'Double-click ktlearn.cmd in the KotlinLearningTool folder (or run python ktlearn.py): it opens this tool at http://127.0.0.1:8027, where Run works.';

  function poll() {
    // while the compiler warms up (the first start also builds the runner), ask again until it is ready
    fetch('api/info', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      var state = d.compiler === 'ready' ? 'ready' : d.compiler === 'error' ? 'error' : 'warming';
      set({ state: state, detail: state === 'error' ? d.compilerDetail : info.detail });
      if (state === 'warming') setTimeout(poll, 1000);
    }).catch(function () { setTimeout(poll, 2000); });
  }

  function start() {
    if (location.protocol === 'file:') { set({ state: 'offline', detail: OFFLINE }); return; }
    fetch('api/info', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }).then(function (d) {
      if (d.app !== 'Kotlin Learning Tool') throw new Error('not ktlearn');
      set({ runtime: 'server', kotlin: d.kotlin, java: d.java, coroutines: d.coroutines,
        detail: 'kotlinc ' + d.kotlin + ' (' + d.kotlinHome + '), Java ' + d.java + ' (' + d.javaPath + '), kotlinx.coroutines ' + d.coroutines,
        state: d.compiler === 'ready' ? 'ready' : d.compiler === 'error' ? 'error' : 'warming' });
      if (info.state === 'warming') setTimeout(poll, 1000);
    }).catch(function () {
      set({ state: 'offline', detail: 'The page is served, but not by ktlearn, or ktlearn did not answer. ' + OFFLINE });
    });
  }

  U.run = {
    info: info,
    onChange: function (fn) { listeners.push(fn); fn(info); },
    ready: function () {
      return info.state === 'loading' ? new Promise(function (r) { readyWaiters.push(r); }) : Promise.resolve(info);
    },
    available: function () { return info.runtime === 'server' && info.state !== 'offline'; },
    exec: function (req, onEvent) {
      var job = queue.then(function () {
        return U.run.ready().then(function () {
          if (!U.run.available()) return unavailable(req, info.state === 'offline' ? OFFLINE : 'The compiler is not available: ' + (info.detail || 'unknown error'));
          return serverExec(req, onEvent);
        });
      });
      queue = job.catch(function () { /* each caller sees its own result */ });
      return job;
    },
    stop: function () {
      if (!current) return;
      fetch('api/stop', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-KtLearn': '1' }, body: JSON.stringify({ id: current.id }) })
        .catch(function () { /* the run's own request reports what happened */ });
    },
    running: function () { return !!current; },
    syntax: syntax
  };

  start();
})(window.KLT);
