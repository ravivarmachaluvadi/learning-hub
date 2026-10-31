/*
 * runtime.js - compiles and runs Java through the local server, jclearn.py, behind one API.
 *
 *   served by jclearn   (http://127.0.0.1:8028) every run is a POST to /api/run: the server compiles
 *                       the code with this PC's JDK 25 (javac kept warm in one JVM) and runs it in a
 *                       fresh JVM with preview features on, then the challenge's checks (runner/Harness.java)
 *   opened from disk    (file://) or the server does not answer: every page still reads, but a run
 *                       returns a result that says how to start jclearn (no JDK runs inside a page)
 *
 * The API (the Python Learning Tool's, without its in-browser runtime):
 *
 *   JCLT.run.info            {state: 'loading'|'ready'|'warming'|'offline'|'error', java, cores, label, detail}
 *   JCLT.run.onChange(fn)    fn(info) now and after every change (the top-bar badge uses it)
 *   JCLT.run.ready()         a Promise for the info once the server answered, or did not
 *   JCLT.run.exec(req, onEvent)
 *                           req: {code, stdin, checks?, timeout?, files?: [{name, code}]};
 *                           onEvent(kind, text) gets output while the program runs (from /api/peek). Resolves
 *                           with jclearn's result; never rejects. Runs are queued, one at a time. The code
 *                           is Main.java; files are the lesson's other Java files (Service.java…), compiled with it.
 *   JCLT.run.stop()          end the current run now (the Stop button)
 *   JCLT.run.available()     true when code can run here (served by jclearn, and it answered)
 *   JCLT.run.syntax(code, who?, files?)
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

  var DEFAULT_TIMEOUT = 10;                   // seconds, the same as jclearn.py
  var info = { state: 'loading', runtime: null, java: null, cores: null, label: 'Looking for the JDK…', detail: '' };
  var listeners = [];
  var readyWaiters = [];
  var queue = Promise.resolve();
  var current = null;                         // the run in progress
  var seq = 0;

  function set(patch) {
    Object.assign(info, patch);
    if (info.state === 'ready') info.label = 'Java ' + info.java + ' · your PC';
    else if (info.state === 'warming') info.label = 'Java ' + info.java + ' · warming up…';
    else if (info.state === 'offline') info.label = 'Reading only: start jclearn to run';
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
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-JcLearn': '1' },
      body: JSON.stringify({ id: id, code: req.code, stdin: req.stdin || '', checks: req.checks || null, timeout: req.timeout || DEFAULT_TIMEOUT,
        files: req.files && req.files.length ? req.files : null })
    }).then(function (r) {
      if (!r.ok) throw new Error('the server answered ' + r.status);
      return r.json();
    }).catch(function (err) {
      return unavailable(req, 'The local server did not answer (' + (err && err.message || err) + '). Is the jclearn window still open?');
    }).then(function (res) {
      run.done = true;
      if (current && current.id === id) current = null;
      if (res.phase !== 'unavailable' && info.state === 'warming') set({ state: 'ready' });
      return res;
    });
  }

  /** The result of a run that could not happen: the same shape as jclearn's. */
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
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-JcLearn': '1' }, body: JSON.stringify({ code: job.code, files: job.files })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (res) {
        compiling = false;
        job.resolve(res && Array.isArray(res.errors) ? res.errors : null);
        nextCompile();
      });
  }

  var OFFLINE = 'Java has to be compiled before it runs, and this page is not served by jclearn, so there is no JDK to ask. ' +
    'Double-click jclearn.cmd in the JavaConcurrencyLearningTool folder (or run python jclearn.py): it opens this tool at http://127.0.0.1:8028, where Run works.';

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
      if (d.app !== 'Java Concurrency Learning Tool') throw new Error('not jclearn');
      set({ runtime: 'server', java: d.java, cores: d.cores,
        detail: 'Java ' + d.java + ' (' + d.javaHome + '), preview features on, ' + d.cores + ' processor cores',
        state: d.compiler === 'ready' ? 'ready' : d.compiler === 'error' ? 'error' : 'warming' });
      if (info.state === 'warming') setTimeout(poll, 1000);
    }).catch(function () {
      set({ state: 'offline', detail: 'The page is served, but not by jclearn, or jclearn did not answer. ' + OFFLINE });
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
      fetch('api/stop', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-JcLearn': '1' }, body: JSON.stringify({ id: current.id }) })
        .catch(function () { /* the run's own request reports what happened */ });
    },
    running: function () { return !!current; },
    syntax: syntax
  };

  start();
})(window.JCLT);
