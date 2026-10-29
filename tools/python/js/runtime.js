/*
 * runtime.js - runs Python, in one of two places, behind one API:
 *
 *   server mode   the page was served by pylearn.py (http://127.0.0.1:8026): every run is a POST to
 *                 /api/run and executes on the Python installed on this PC.
 *   browser mode  the page was opened from disk (file://), or the server did not answer: Python runs
 *                 inside the page, in Pyodide (CPython compiled to WebAssembly), loaded from jsDelivr
 *                 into a Web Worker. No threads, processes or pip packages there.
 *
 * Both run py/checker.py (the browser gets it from js/py-embedded.js), so a program and a challenge's
 * checks behave the same either way; Visualize runs py/tracer.py the same way. The API:
 *
 *   PYLT.run.info            {state: 'loading'|'ready'|'error', runtime: 'server'|'browser', python, label, detail}
 *   PYLT.run.onChange(fn)    fn(info) now and after every change (the top-bar badge uses it)
 *   PYLT.run.ready()         a Promise for the info once Python is ready (or failed)
 *   PYLT.run.exec(req, onEvent)
 *                            req: {code, stdin, checks?, timeout?}; onEvent(kind, text) gets output as it
 *                            is printed (browser mode). Resolves with checker.py's result plus
 *                            {runtime, python}; never rejects. Runs are queued, one at a time.
 *   PYLT.run.trace(req)      the same as exec, recorded step by step by py/tracer.py for Visualize:
 *                            the result also has {steps, limit} (see the top of py/tracer.py)
 *   PYLT.run.stop()          end the current run now (the Stop button)
 *   PYLT.run.supports(lesson) false when the lesson needs the server and this is browser mode
 *   PYLT.run.syntax(code)    a Promise for the first syntax error in code (py/checker.py's
 *                            syntax_errors: [] when it compiles, [{line, col, endLine, endCol,
 *                            message, hint}] when not), or null when Python cannot say right now.
 *                            Nothing runs. Not queued behind runs: the server answers at once; the
 *                            browser's worker answers between runs, never during one
 *   PYLT.run.refreshInfo()   server mode: ask /api/info again (after a pip install, the packages
 *                            the projects need show up without restarting pylearn)
 *
 * Why a Blob worker: Chrome refuses new Worker('js/file.js') on a page opened from disk, but accepts a
 * worker built from a Blob. Why runPythonAsync: asyncio.run() inside a program only works when Pyodide
 * was entered asynchronously (it can then pause the JavaScript stack). Why terminate on Stop: a worker
 * running Python cannot be interrupted from outside without cross-origin isolation, which a file://
 * page cannot have, so Stop ends the worker and a fresh one starts (about 2 s, from the browser cache).
 * See ROADMAP.md, "The proof", for what was measured.
 */
(function (U) {
  'use strict';

  var PYODIDE = '0.29.5';                     // ships Python 3.13, like the local Python
  var CDN = 'https://cdn.jsdelivr.net/npm/pyodide@' + PYODIDE + '/';
  var DEFAULT_TIMEOUT = 10;                   // seconds, the same as pylearn.py

  var info = { state: 'loading', runtime: null, python: null, label: 'Loading Python…', detail: '' };
  var listeners = [];
  var readyWaiters = [];
  var queue = Promise.resolve();
  var current = null;                         // the run in progress
  var seq = 0;

  function set(patch) {
    Object.assign(info, patch);
    if (info.state === 'ready') {
      info.label = 'Python ' + info.python + (info.runtime === 'server' ? ' · your PC' : ' · in your browser');
    } else if (info.state === 'error') {
      info.label = 'Python unavailable';
    }
    listeners.forEach(function (fn) { try { fn(info); } catch (e) { console.error(e); } });
    if (info.state !== 'loading') {
      var w = readyWaiters;
      readyWaiters = [];
      w.forEach(function (r) { r(info); });
    }
  }

  /* ---------- server mode ---------- */

  function serverExec(req, onEvent) {
    var id = 'r' + Date.now().toString(36) + (++seq);
    var run = current = { id: id, mode: 'server', done: false };
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
    return fetch(req.trace ? 'api/trace' : 'api/run', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-PyLearn': '1' },
      body: JSON.stringify({ id: id, code: req.code, stdin: req.stdin || '', checks: req.checks || null, timeout: req.timeout || DEFAULT_TIMEOUT })
    }).then(function (r) {
      if (!r.ok) throw new Error('the server answered ' + r.status);
      return r.json();
    }).catch(function (err) {
      return unavailable(req, 'The local server did not answer (' + (err && err.message || err) + '). Is the pylearn window still open?');
    }).then(function (res) {
      run.done = true;
      if (current && current.id === id) current = null;
      return res;
    });
  }

  function serverStop() {
    if (!current || current.mode !== 'server') return;
    fetch('api/stop', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-PyLearn': '1' }, body: JSON.stringify({ id: current.id }) })
      .catch(function () { /* the run's own request reports what happened */ });
  }

  /* ---------- browser mode: Pyodide in a worker ---------- */

  /* This function is never called here: its source text becomes the worker's script. */
  function workerMain() {
    var py = null, running = false, waiting = [];
    function syntax(m) {
      var errors = null;
      try {
        py.globals.set('pylt_code', m.code);
        errors = JSON.parse(py.runPython('pylt_checker.syntax_json(pylt_code)'));
      } catch (err) { errors = null; }
      postMessage({ type: 'syntax', id: m.id, errors: errors });
    }
    self.onmessage = async function (e) {
      var m = e.data;
      if (m.type === 'syntax') {
        // never inside a run: its streams are redirected, and Visualize's tracer would record it
        if (!py) postMessage({ type: 'syntax', id: m.id, errors: null });
        else if (running) waiting.push(m);
        else syntax(m);
        return;
      }
      if (m.type === 'init') {
        try {
          importScripts(m.cdn + 'pyodide.js');
          py = await loadPyodide({ indexURL: m.cdn });
          py.FS.mkdirTree('/pylt');
          Object.keys(m.files).forEach(function (name) { py.FS.writeFile('/pylt/pylt_' + name, m.files[name]); });
          py.runPython('import sys\nsys.path.insert(0, "/pylt")\nimport pylt_checker, pylt_tracer');
          postMessage({ type: 'ready', python: py.runPython('import sys; sys.version.split()[0]') });
        } catch (err) {
          postMessage({ type: 'failed', message: String(err && err.message || err) });
        }
        return;
      }
      if (m.type === 'run') {
        var emit = function (kind, text) { postMessage({ type: 'event', id: m.id, kind: kind, text: text }); };
        running = true;
        try {
          py.globals.set('pylt_request', JSON.stringify(m.request));
          py.globals.set('pylt_emit', emit);
          var out = await py.runPythonAsync(m.request.trace ? 'pylt_tracer.trace_json(pylt_request, pylt_emit)' : 'pylt_checker.run_json(pylt_request, pylt_emit)');
          postMessage({ type: 'done', id: m.id, result: JSON.parse(out) });
        } catch (err) {
          postMessage({ type: 'done', id: m.id, result: null, message: String(err && err.message || err) });
        }
        running = false;
        waiting.splice(0).forEach(syntax);
      }
    };
  }

  var worker = null, workerReady = null;
  var syntaxWaiters = {};                     // syntax check id -> resolve, for the current worker

  function answerSyntaxWaiters() {
    var w = syntaxWaiters;
    syntaxWaiters = {};
    Object.keys(w).forEach(function (id) { w[id](null); });
  }

  function startWorker(restart) {
    set({ state: 'loading', runtime: 'browser', label: restart ? 'Restarting Python…' : 'Loading Python…' });
    var src = '(' + workerMain.toString() + ')();';
    try {
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    } catch (err) {   // a page whose policy refuses the worker: say so, never stay on "Loading"
      set({ state: 'error', runtime: 'browser', detail: 'the browser would not start the worker Python runs in (' + (err && err.message || err) + ')' });
      return (workerReady = Promise.resolve(false));
    }
    var me = worker;
    workerReady = new Promise(function (resolve) {
      me.onmessage = function (e) {
        var m = e.data;
        if (m.type === 'syntax') {
          var answer = syntaxWaiters[m.id];
          delete syntaxWaiters[m.id];
          if (answer) answer(m.errors);
        } else if (m.type === 'ready') {
          set({ state: 'ready', runtime: 'browser', python: m.python, detail: 'Pyodide ' + PYODIDE });
          resolve(true);
        } else if (m.type === 'failed') {
          set({ state: 'error', runtime: 'browser', detail: m.message });
          resolve(false);
        } else if (current && current.mode === 'browser' && m.id === current.id) {
          if (m.type === 'event') {
            current.printed.push([m.kind, m.text]);
            if (current.onEvent) current.onEvent(m.kind, m.text);
          } else if (m.type === 'done') {
            finish(m.result ? m.result : failed(current.req, 'Python stopped unexpectedly: ' + m.message));
          }
        }
      };
      me.onerror = function (e) {
        set({ state: 'error', runtime: 'browser', detail: e.message || 'the worker could not start' });
        resolve(false);
      };
    });
    var files = {};
    Object.keys(U.pySources || {}).forEach(function (k) { files[k] = U.pySources[k]; });
    worker.postMessage({ type: 'init', cdn: CDN, files: files });
    return workerReady;
  }

  function finish(result) {
    var run = current;
    if (!run || run.mode !== 'browser') return;
    clearTimeout(run.timer);
    current = null;
    result.runtime = 'browser';
    result.python = info.python;
    result.wallMs = Math.round(performance.now() - run.t0);
    run.resolve(result);
  }

  /** End the worker mid-run (timeout or Stop), keep what was printed, start a fresh worker. */
  function cutOff(phase) {
    var run = current;
    if (!run || run.mode !== 'browser') return;
    worker.terminate();
    answerSyntaxWaiters();
    var output = run.printed.map(function (e) { return e[1]; }).join('');
    var seconds = (run.req.timeout || DEFAULT_TIMEOUT);
    var msg = phase === 'timeout'
      ? 'Stopped after ' + seconds + ' seconds: the program was still running. Is there a loop that never ends, or an input() waiting for a line?'
      : 'Stopped: you pressed Stop.';
    var res = {
      ok: false, phase: phase, output: output, events: run.printed.slice(), truncated: false, ms: 0,
      error: { type: phase === 'timeout' ? 'Timeout' : 'Stopped', message: msg, line: null, col: null, endCol: null, traceback: msg + '\n',
        hint: phase === 'timeout' ? 'A while loop needs something inside it that eventually makes its condition false (or a break).' : null }
    };
    if (run.req.trace) { res.steps = []; res.limit = null; }
    if (run.req.checks) {
      res.checks = run.req.checks.map(function () {
        return { ok: false, got: phase === 'timeout' ? 'The program did not finish within ' + seconds + ' seconds, so nothing could be checked.' : 'The run was stopped, so nothing was checked.' };
      });
    }
    finish(res);
    startWorker(true);
  }

  function browserExec(req, onEvent) {
    return workerReady.then(function (ok) {
      if (!ok) return unavailable(req, 'Python could not be loaded into the browser (' + (info.detail || 'unknown error') + '). ' +
        'The first load needs internet. Or run the tool with your own Python: double-click pylearn.cmd.');
      return new Promise(function (resolve) {
        var id = ++seq;
        current = {
          id: id, mode: 'browser', req: req, resolve: resolve, onEvent: onEvent, printed: [], t0: performance.now(),
          timer: setTimeout(function () { cutOff('timeout'); }, (req.timeout || DEFAULT_TIMEOUT) * 1000)
        };
        worker.postMessage({ type: 'run', id: id, request: { code: req.code, stdin: req.stdin || '', checks: req.checks || null, trace: !!req.trace, workdir: 'fresh' } });
      });
    });
  }

  /* ---------- results for runs that could not happen ---------- */

  function failed(req, message, phase) {
    var res = {
      ok: false, phase: phase || 'run', output: '', events: [], truncated: false, ms: 0, runtime: info.runtime, python: info.python,
      error: { type: 'Unavailable', message: message, line: null, col: null, endCol: null, traceback: message + '\n', hint: null }
    };
    if (req.checks) res.checks = req.checks.map(function () { return { ok: false, got: message }; });
    if (req.trace) { res.steps = []; res.limit = null; }
    return res;
  }
  function unavailable(req, message) { return failed(req, message, 'unavailable'); }

  /* ---------- start ---------- */

  var mode = location.protocol === 'file:' ? 'browser' : 'server?';

  function startServer() {
    // a host that is not pylearn may never answer at all (the claude.ai artifact's frame): after 4 s, give up on it
    var decided = false;
    function inBrowser() {
      if (decided) return;
      decided = true;
      mode = 'browser';
      startWorker(false);
    }
    var giveUp = setTimeout(inBrowser, 4000);
    fetch('api/info', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }).then(function (data) {
      if (data.app !== 'Python Learning Tool') throw new Error('not pylearn');
      if (decided) return;
      decided = true;
      clearTimeout(giveUp);
      mode = 'server';
      set({ state: 'ready', runtime: 'server', python: data.python, detail: data.executable, packages: data.packages || {} });
    }).catch(function () {
      clearTimeout(giveUp);
      inBrowser();
    });
  }

  U.run = {
    info: info,
    PYODIDE: PYODIDE,
    onChange: function (fn) { listeners.push(fn); fn(info); },
    ready: function () {
      return info.state === 'loading' ? new Promise(function (r) { readyWaiters.push(r); }) : Promise.resolve(info);
    },
    mode: function () { return mode; },
    exec: function (req, onEvent) {
      var job = queue.then(function () {
        if (mode === 'browser') return browserExec(req, onEvent);
        return U.run.ready().then(function () {
          return mode === 'server' ? serverExec(req, onEvent) : browserExec(req, onEvent);
        });
      });
      queue = job.catch(function () { /* each caller sees its own result */ });
      return job;
    },
    trace: function (req, onEvent) {
      return U.run.exec(Object.assign({}, req, { trace: true }), onEvent);
    },
    stop: function () {
      if (!current) return;
      if (current.mode === 'browser') cutOff('stopped'); else serverStop();
    },
    running: function () { return !!current; },
    supports: function (lesson) {
      var rt = lesson && lesson.runtimes;
      return !rt || mode !== 'browser' || rt.indexOf('browser') >= 0;
    },
    syntax: function (code) {
      if (mode === 'browser') {
        return workerReady.then(function (ok) {
          if (!ok) return null;
          return new Promise(function (resolve) {
            var id = 's' + (++seq);
            syntaxWaiters[id] = resolve;
            worker.postMessage({ type: 'syntax', id: id, code: String(code || '') });
          });
        });
      }
      return U.run.ready().then(function () {
        if (mode === 'browser') return U.run.syntax(code);       // the server did not answer: Pyodide took over
        return fetch('api/syntax', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-PyLearn': '1' },
          body: JSON.stringify({ code: String(code || '') }) })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) { return d && Array.isArray(d.errors) ? d.errors : null; })
          .catch(function () { return null; });
      });
    },
    refreshInfo: function () {
      if (mode !== 'server') return Promise.resolve(info);
      return fetch('api/info', { cache: 'no-store' }).then(function (r) { return r.json(); })
        .then(function (data) { set({ packages: data.packages || {} }); return info; })
        .catch(function () { return info; });
    }
  };

  // Inside the claude.ai artifact (its frames come from claudeusercontent.com) Python cannot run: the frame
  // fetches only from its own address, so Pyodide cannot be downloaded, and claude.ai does not serve the
  // .zip it needs. Say so at once rather than try requests that hang there.
  var ARTIFACT = /(^|\.)claudeusercontent\.com$/.test(location.hostname);
  if (ARTIFACT) {
    mode = 'browser';
    workerReady = Promise.resolve(false);
    set({ state: 'error', runtime: 'browser', label: 'Python unavailable', detail: 'Python cannot run inside the claude.ai artifact, which blocks ' +
      'the download of Pyodide. The lessons, katas and Reference still read fine; to run code, open the tool on your own computer' });
  } else if (mode === 'browser') startWorker(false); else startServer();
})(window.PYLT);
