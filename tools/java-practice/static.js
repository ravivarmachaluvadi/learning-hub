/* site_static.js - the server half of Code Viewer for its website copy (tools/build_site.py).

   GitHub Pages serves files and runs nothing, so the page's /api/... requests are answered here,
   in the browser, from data/ built next to this file:
     data/tree.json      the file list, as /api/tree gives it
     data/files.json     every file's text and hash, plus how to run each Java file elsewhere
     data/practice.json  each practice file's skeleton, hidden notes and hints (loaded on first use)
   Progress (Done / Revise, reviews, solve times) is kept in this browser's localStorage.

   What cannot work without a server answers with how to do it on a PC instead: Run for Java,
   Python and JavaScript shows the commands; Save, new files, Push and Java suggestions say they
   need Code Viewer on the laptop. A UI page (.html) runs here, as it does on the laptop. */
(() => {
  'use strict';
  const SITE = window.CV_SITE || {};
  window.CV_STATIC = true;
  const realFetch = window.fetch.bind(window);
  const DATA = new URL('data/', document.currentScript.src).href;
  const LAPTOP = 'needs Code Viewer on your laptop; this website copy can only read and practise.';

  const loads = {};
  const load = name => loads[name] || (loads[name] = realFetch(DATA + name).then(r => {
    if (!r.ok) throw new Error(`Could not load ${name} (the site answered ${r.status})`);
    return r.json();
  }).catch(e => { delete loads[name]; throw e; }));

  // ---------------------------------------------------------------- progress
  /* Done / Revise marks. With Personal Apps' drive-sync.js loaded (build_site.py copies it), they
     live in a DriveStore: kept in this browser at once, and in My Drive / Personal Apps /
     java-practice.json once "Continue with Google" is pressed, so every device shows the same
     marks. Each mark carries the time it changed and the newer one wins; a cleared mark is a
     tombstone, so an old device cannot bring it back. Without it: this browser only. */
  const PKEY = 'cvsite:progress';
  const localProgress = () => { try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch { return {}; } };
  let store = null;
  if (window.DriveStore && window.APP_CONFIG && APP_CONFIG.googleClientId) {
    store = DriveStore.open({
      file: 'java-practice.json', cacheKey: 'cvsite:drive', empty: () => ({ v: 1, items: {} }),
      onChange: (doc, how) => { if (how === 'remote') dispatchEvent(new Event('cv-progress')); },
    });
    try {                          // marks made here before sync existed join the synced ones, once
      if (!localStorage.getItem('cvsite:migrated')) {
        const add = Object.entries(localProgress()).filter(([k]) => !store.doc.items[k]), now = Date.now();
        if (add.length) store.mutate(doc => { for (const [k, e] of add) doc.items[k] = { ...e, updatedAt: now }; });
        localStorage.setItem('cvsite:migrated', '1');
      }
    } catch {}
    window.cvSync = store;
    // the sign-in button and sync state, under the file list's progress line
    const wrap = document.createElement('div'), label = document.createElement('span'), slot = document.createElement('span');
    wrap.className = 'side-foot'; wrap.id = 'cvSyncWrap';
    label.textContent = 'Marks on every device:';
    label.title = 'Done / Revise marks are saved in your Google Drive (My Drive / Personal Apps / java-practice.json) once '
      + 'you continue with Google, so every browser you sign in on shows the same ones. Until then they stay in this browser.';
    wrap.append(label, slot);
    const foot = document.getElementById('count');
    if (foot) { foot.after(wrap); DriveStore.mountStatus(slot, store); }
  }
  function readProgress() {
    if (!store) return localProgress();
    const out = {};
    for (const [k, it] of Object.entries(store.doc.items)) if (it && !it.deleted) { const { updatedAt, ...e } = it; out[k] = e; }
    return out;
  }
  function putEntry(rel, e) {
    if (store) {
      const now = Date.now();
      store.mutate(doc => { doc.items[rel] = Object.keys(e).length ? { ...e, updatedAt: now } : { deleted: true, updatedAt: now }; });
      return;
    }
    const files = localProgress();
    if (Object.keys(e).length) files[rel] = e; else delete files[rel];
    try { localStorage.setItem(PKEY, JSON.stringify(files)); }
    catch { throw new Error('This browser would not save your progress (storage full or blocked).'); }
  }
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function whole(v, what, most) {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    if (!Number.isInteger(n)) throw new Error(`${what} must be a whole number`);
    if (n < 0 || n > most) throw new Error(`${what} must be between 0 and ${most}`);
    return n;
  }
  /* codeview.py State.set_progress, line for line */
  function setProgress(rel, status, pass, secs, hints) {
    secs = whole(secs, 'secs', 7 * 86400); hints = whole(hints, 'hints', 100);
    const e = { ...(readProgress()[rel] || {}) };
    if (status === 'done' && e.s === 'done' && pass) e.r = (e.r || 0) + 1;
    else if (status === 'revise' || status === 'none' || (status === 'done' && e.s !== 'done')) delete e.r;
    if (pass && secs !== null) { e.secs = secs; e.best = Math.min(secs, e.best ?? secs); }
    if (pass && hints !== null) e.hints = hints;
    if (status === 'done' || status === 'revise') { e.s = status; e.t = today(); }
    else if (status === 'none') delete e.s;
    if (pass !== null && pass !== undefined) { e.practiced = today(); e.pass = !!pass; }
    putEntry(rel, e);
    return e;
  }
  /* State.restore_progress: put an entry back exactly as it was (the page's Undo) */
  function restoreProgress(rel, entry) {
    if (!entry || typeof entry !== 'object') throw new Error('restore needs an entry');
    const clean = {};
    for (const [k, v] of Object.entries(entry)) {
      if (k === 's' && (v === 'done' || v === 'revise')) clean[k] = v;
      else if ((k === 't' || k === 'practiced') && typeof v === 'string' && /^\d{4}-\d\d-\d\d$/.test(v)) clean[k] = v;
      else if (k === 'r' || k === 'hints') clean[k] = whole(v, k, 100);
      else if (k === 'secs' || k === 'best') clean[k] = whole(v, k, 7 * 86400);
      else if (k === 'pass' && typeof v === 'boolean') clean[k] = v;
      else throw new Error(`cannot restore ${k}=${JSON.stringify(v)}`);
    }
    putEntry(rel, clean);
    return clean;
  }

  // ---------------------------------------------------------------- search (codeview.py search())
  async function search(q, regex, matchCase) {
    if (!q) return { files: [], matches: 0 };
    let pat;
    try { pat = new RegExp(regex ? q : q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase ? '' : 'i'); }
    catch (e) { throw new Error('bad regular expression: ' + e.message); }
    const { order, files } = await load('files.json');
    const out = [];
    let total = 0;
    for (const path of order) {
      const lines = files[path].text.split(/\r\n|\r|\n/), hits = [];
      for (let i = 0; i < lines.length && hits.length < 50; i++) {
        const m = pat.exec(lines[i]);
        if (m && m[0].length) {
          const cut = Math.max(0, m.index - 60);
          hits.push({ line: i + 1, col: m.index + 1, len: m[0].length, text: lines[i].slice(cut, cut + 220), off: m.index - cut });
        }
      }
      if (hits.length) {
        out.push({ path, hits });
        total += hits.length;
        if (total >= 2000) break;
      }
    }
    return { files: out, matches: total, capped: total >= 2000 };
  }

  // ---------------------------------------------------------------- Run: how to run it on a PC
  async function runElsewhere(req) {
    const kind = req.lang || 'java', path = req.path || null, name = path ? path.split('/').pop() : null;
    let meta = null;
    if (path && kind === 'java') { try { meta = (await load('files.json')).files[path]?.run || null; } catch {} }
    const lines = [];
    if (kind === 'java') {
      const file = name || 'Main.java';
      lines.push('Java cannot run on this website: it has no server to compile it.',
                 'To run this code on any PC with Java:', '',
                 '  1. Copy it: the copy button at the top right, or Ctrl+A then Ctrl+C in the editor.',
                 '  2. IntelliJ: Ctrl+Alt+Shift+Insert, choose Java, paste, then click the green',
                 '     arrow beside main(). This is the quickest way.');
      if (meta && meta.main && !meta.first) {
        const cls = (meta.pkg ? meta.pkg + '.' : '') + meta.main;
        lines.push(`     Or in a terminal: save it as ${file}, then run`,
                   `       javac -d out ${file}`, `       java -cp out ${cls}`,
                   `     (main() is in class ${meta.main}, which is not the first class in the file,`,
                   `     so "java ${file}" alone would start the wrong class.)`);
      } else {
        lines.push(`     Or in a terminal: save it as ${file}, then run`, `       java ${file}`);
        if (meta && meta.main) lines.push(`     (main() is in class ${meta.main}.)`);
      }
      if (meta && meta.jdk25) lines.push('', 'This file uses Java 25 features (IO.println, or main() with no class around it),',
                                         'so it needs JDK 25. With an older JDK, change IO.println to System.out.println',
                                         'and put main() inside a class.');
      if (!path) lines.push('', 'The Scratch pad starts as a bare void main(), which needs JDK 25.');
    } else if (kind === 'py') {
      const file = name || 'main.py';
      lines.push('Python cannot run on this website. On a PC with Python 3:', '',
                 '  1. Copy the code: the copy button at the top right.',
                 `  2. Save it as ${file}, then run:  python ${file}`);
    } else {
      const file = name || 'main.js';
      lines.push('JavaScript files run with Node.js, which this website does not have. On a PC with Node:', '',
                 '  1. Copy the code: the copy button at the top right.',
                 `  2. Save it as ${file}, then run:  node ${file}`,
                 '', 'Or paste it into the browser console (F12), if it uses no Node modules.');
    }
    lines.push('', 'Everything else works here: Practice, Hint, Compare, Next, Done / Revise and search.',
               'Python and JavaScript files and UI pages (.html) do run here, with ticks.');
    return { phase: 'elsewhere', ok: true, exitCode: 0, file: name, output: lines.join('\n'), runner: 'not on this website' };
  }

  /* Ticks and crosses: outcheck.js, the port of the laptop's outcheck.py (same verdict on every
     line the repo prints; test_codeview.py OutcheckJsTest). Loaded before this file. */
  const checkLines = output => window.outcheck.checkLines(output);

  // ---------------------------------------------------------------- JavaScript runs here
  /* A .js file (or a JavaScript Scratch pad / Try block) runs in a Web Worker: its own thread,
     so an endless loop cannot freeze the page, and terminate() ends it at the time limit. Like
     Node, the program ends when no timer is left; console output is formatted the way Node's
     util.inspect does for the usual values. Node-only things (require, process, fs) are not
     there; the error says so. */
  // All of it inside one function: a name declared at the worker's top level would clash with the
  // program's own (C01_EventLoopOrder.js has function timers(); "already been declared", 6 Nov).
  const WORKER = String.raw`(() => {
'use strict';
const send = (t, s) => postMessage({ t, s });
const IDENT = /^[A-Za-z_$][\w$]*$/;
function inspect(v, depth = 0, seen = new Set()) {
  if (v === null) return 'null';
  switch (typeof v) {
    case 'string': return depth ? (v.includes("'") && !v.includes('"') ? '"' + v + '"' : "'" + v.replace(/'/g, "\\'") + "'") : v;
    case 'number': return Object.is(v, -0) ? '-0' : String(v);
    case 'bigint': return v + 'n';
    case 'undefined': return 'undefined';
    case 'boolean': return String(v);
    case 'symbol': return v.toString();
    case 'function': {
      if (/^class\b/.test(Function.prototype.toString.call(v))) return '[class ' + (v.name || '(anonymous)') + ']';
      const kind = v.constructor && v.constructor.name === 'AsyncFunction' ? 'AsyncFunction' : 'Function';
      return '[' + kind + (v.name ? ': ' + v.name : ' (anonymous)') + ']';
    }
  }
  if (seen.has(v)) return '[Circular *1]';
  if (v instanceof Error) return v.stack || String(v);
  if (v instanceof Date) return isNaN(v) ? 'Invalid Date' : v.toISOString();
  if (v instanceof RegExp) return String(v);
  if (v instanceof Promise) return 'Promise { <pending> }';
  if (depth > 2) return Array.isArray(v) ? '[Array]' : '[Object]';
  seen = new Set(seen).add(v);
  const inner = x => inspect(x, depth + 1, seen);
  const wrap = (open, items, close) => items.length ? open + ' ' + items.join(', ') + ' ' + close : open + close;
  if (Array.isArray(v)) {
    const items = [];
    let holes = 0;
    for (let i = 0; i < v.length; i++) {
      if (!(i in v)) { holes++; continue; }
      if (holes) { items.push('<' + holes + ' empty item' + (holes > 1 ? 's' : '') + '>'); holes = 0; }
      items.push(inner(v[i]));
    }
    if (holes) items.push('<' + holes + ' empty item' + (holes > 1 ? 's' : '') + '>');
    return wrap('[', items, ']');
  }
  if (v instanceof Map) return wrap('Map(' + v.size + ') {', [...v].map(([k, x]) => inner(k) + ' => ' + inner(x)), '}');
  if (v instanceof Set) return wrap('Set(' + v.size + ') {', [...v].map(inner), '}');
  const proto = Object.getPrototypeOf(v);
  const name = proto === null ? '[Object: null prototype]' : proto === Object.prototype ? '' : (proto.constructor && proto.constructor.name) || '';
  const items = Object.keys(v).map(k => (IDENT.test(k) ? k : "'" + k + "'") + ': ' + inner(v[k]));
  return (name ? name + ' ' : '') + wrap('{', items, '}');
}
const line = args => args.map(a => typeof a === 'string' ? a : inspect(a)).join(' ');
for (const k of ['log', 'info', 'debug', 'warn', 'error', 'trace']) console[k] = (...a) => send('out', line(a));
console.dir = v => send('out', inspect(v));
console.table = v => send('out', inspect(v));
console.assert = (ok, ...a) => { if (!ok) send('out', 'Assertion failed' + (a.length ? ': ' + line(a) : '')); };
const counts = {}, timers = {};
console.count = (l = 'default') => send('out', l + ': ' + (counts[l] = (counts[l] || 0) + 1));
console.time = (l = 'default') => { timers[l] = performance.now(); };
console.timeEnd = (l = 'default') => send('out', l + ': ' + (performance.now() - timers[l]).toFixed(3) + 'ms');

// like Node, the program has ended when no timer is left to fire
const live = new Set(), st = setTimeout, ct = clearTimeout, si = setInterval, ci = clearInterval;
self.setTimeout = (fn, ms, ...a) => { const id = st(() => { live.delete(id); if (typeof fn === 'function') fn(...a); }, ms); live.add(id); return id; };
self.clearTimeout = id => { live.delete(id); ct(id); };
self.setInterval = (fn, ms, ...a) => { const id = si(fn, ms, ...a); live.add(id); return id; };
self.clearInterval = id => { live.delete(id); ci(id); };
self.setImmediate = (fn, ...a) => self.setTimeout(fn, 0, ...a);

let file = 'main.js';
function crash(e) {
  if (!(e instanceof Error)) { send('crash', 'Uncaught ' + inspect(e, 1)); return; }
  const at = (e.stack || '').match(new RegExp('\\(?' + file.replace(/[.$]/g, '\\$&') + ':(\\d+):\\d+'));
  const missing = e instanceof ReferenceError && /^(require|process|module|exports|__dirname|__filename|Buffer|global)\b/.test(e.message);
  const stack = (e.stack || '').split('\n').filter(l => /^\s+at /.test(l) && l.includes(file)).map(l => l.replace(/^\s+/, '    '));
  send('crash', (at ? file + ':' + at[1] + '\n' : '') + e.name + ': ' + e.message + (stack.length ? '\n' + stack.join('\n') : '')
       + (missing ? '\n(' + e.message.split(' ')[0] + ' is part of Node.js, which this website does not have: run this file with node on your PC.)' : ''));
}
self.addEventListener('error', ev => { ev.preventDefault(); crash(ev.error || new Error(ev.message)); });
self.addEventListener('unhandledrejection', ev => { ev.preventDefault(); crash(ev.reason); });
self.onmessage = ({ data }) => {
  file = data.file;
  try { (0, eval)(data.code + '\n//# sourceURL=' + data.file); }
  catch (e) { crash(e); return; }
  // no timer left, twice in a row: the browser reports a promise rejected with nothing to catch
  // it in a task of its own, which must get its turn before the program counts as ended
  let quiet = 0;
  const idle = () => { quiet = live.size ? 0 : quiet + 1; if (quiet >= 2) send('done'); else st(idle, quiet ? 1 : 4); };
  st(idle, 0);
};
})();
`;
  // ---------------------------------------------------------------- Python runs here (Pyodide)
  /* A .py file runs on Pyodide (Python compiled for the browser), the same version the Learning
     Hub's Python tool uses, from cdn.jsdelivr.net (about 10 MB the first time; the browser and the
     service worker keep it). As on the laptop: Python's own syntax report first, then the file
     runs as __main__, stdout and stderr together, a traceback that shows the file's lines, exit
     code from sys.exit(). The time limit ends the worker; the next run loads Python again. If
     Python cannot load (offline, or jsDelivr blocked), Run says why and how to run it on a PC. */
  const PYODIDE = '0.29.5', PY_CDN = 'https://cdn.jsdelivr.net/npm/pyodide@' + PYODIDE + '/';
  const PY_RUNNER = [
    'import io, linecache, sys, traceback, warnings',
    'def __cv_run(code, fname, stdin):',
    '    try:',
    '        with warnings.catch_warnings():',
    '            warnings.simplefilter("ignore")',
    '            co = compile(code, fname, "exec", dont_inherit=True)',
    '    except SyntaxError as e:',
    '        return ("compile", "".join(traceback.format_exception_only(e)), 1)',
    '    except ValueError as e:',
    '        return ("compile", f"{fname}: {e}\\n", 1)',
    '    linecache.cache[fname] = (len(code), None, code.splitlines(True), fname)',
    '    sys.stdin = io.StringIO(stdin)',
    '    g = {"__name__": "__main__", "__file__": fname, "__builtins__": __builtins__}',
    '    status = 0',
    '    try:',
    '        exec(co, g)',
    '    except SystemExit as e:',
    '        if e.code is None:',
    '            status = 0',
    '        elif isinstance(e.code, int):',
    '            status = e.code',
    '        else:',
    '            print(e.code, file=sys.stderr)',
    '            status = 1',
    '    except BaseException as e:',
    '        tb = e.__traceback__',
    '        while tb is not None and tb.tb_frame.f_code.co_filename != fname:',
    '            tb = tb.tb_next',
    '        traceback.print_exception(type(e), e, tb)',
    '        status = 1',
    '    finally:',
    '        sys.stdout.flush()',
    '        sys.stderr.flush()',
    '    return ("run", "", status)',
  ].join('\n');
  const PY_WORKER = String.raw`(() => {
'use strict';
let py = null;
self.onmessage = async ({ data: m }) => {
  if (m.type === 'init') {
    try {
      importScripts(m.cdn + 'pyodide.js');
      py = await loadPyodide({ indexURL: m.cdn });
      for (const [name, set] of [['out', 'setStdout'], ['err', 'setStderr']]) {
        const dec = new TextDecoder();
        py[set]({ write: buf => { postMessage({ t: 'out', s: dec.decode(buf, { stream: true }) }); return buf.length; } });
      }
      py.runPython(m.runner);
      postMessage({ t: 'ready', version: py.runPython('import sys; sys.version.split()[0]') });
    } catch (e) { postMessage({ t: 'failed', s: String(e && e.message || e) }); }
    return;
  }
  if (m.type === 'run') {
    try {
      const f = py.globals.get('__cv_run');
      const r = f(m.code, m.file, m.stdin).toJs();
      f.destroy();
      postMessage({ t: 'done', phase: r[0], text: r[1], code: r[2] });
    } catch (e) { postMessage({ t: 'done', phase: 'run', text: String(e && e.message || e) + '\n', code: 1 }); }
  }
};
})();
`;
  let pyWorker = null, pyReady = null, pyVersion = '';
  function pyStart() {
    pyWorker = new Worker(URL.createObjectURL(new Blob([PY_WORKER], { type: 'text/javascript' })));
    const w = pyWorker;
    pyReady = new Promise(resolve => {
      w.onmessage = ({ data }) => {
        if (data.t === 'ready') { pyVersion = data.version; resolve(true); }
        else if (data.t === 'failed') resolve(data.s);
      };
      w.onerror = e => { e.preventDefault(); resolve(e.message || 'the worker could not start'); };
    });
    w.postMessage({ type: 'init', cdn: PY_CDN, runner: PY_RUNNER });
    return pyReady;
  }
  async function runPy(req) {
    const file = (req.path || '').split('/').pop() || 'Scratch.py', limit = Math.max(1, Math.min(+req.timeout || 10, 60)) * 1000;
    const loaded = await (pyReady || pyStart());
    if (loaded !== true) {
      if (pyWorker) pyWorker.terminate();
      pyWorker = pyReady = null;
      const r = await runElsewhere(req);
      r.output = `Python could not be loaded in this browser (${loaded}). It comes from cdn.jsdelivr.net, which may be `
        + 'blocked on this network, or you are offline and it was never loaded here.\n\n' + r.output;
      return r;
    }
    const w = pyWorker, parts = [], t0 = performance.now();
    let size = 0, cut = false;
    return new Promise(resolve => {
      const finish = (phase, exitCode, timedOut, tail) => {
        clearTimeout(timer);
        if (tail) parts.push(tail);
        let output = parts.join('');
        if (cut) output += '\n[output cut at 256 KB]\n';
        if (phase === 'compile') return resolve({ phase, ok: false, file, output, compileMs: Math.round(performance.now() - t0) });
        const { verdicts, checks } = checkLines(output);
        resolve({ phase: 'run', ok: exitCode === 0 && !timedOut, exitCode, timedOut, truncated: cut, file,
                  runner: `Python ${pyVersion} in this browser`, runMs: Math.round(performance.now() - t0), output, verdicts, checks });
      };
      const timer = setTimeout(() => { w.terminate(); pyWorker = pyReady = null; finish('run', 1, true); }, limit);
      w.onmessage = ({ data }) => {
        if (data.t === 'out') {
          if (cut) return;
          size += data.s.length;
          if (size > 256 * 1024) { cut = true; return; }
          parts.push(data.s);
        } else if (data.t === 'done') finish(data.phase, data.code, false, data.text);
      };
      w.postMessage({ type: 'run', code: req.code || '', file, stdin: req.stdin || '' });
    });
  }

  let workerUrl = null;
  function runJs(req) {
    const file = (req.path || '').split('/').pop() || 'Scratch.js', limit = Math.max(1, Math.min(+req.timeout || 10, 60)) * 1000;
    workerUrl = workerUrl || URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }));
    return new Promise(resolve => {
      const w = new Worker(workerUrl), lines = [], t0 = performance.now();
      let size = 0, cut = false;
      const finish = (exitCode, timedOut, tail) => {
        clearTimeout(timer); w.terminate();
        if (tail) lines.push(tail);
        let output = lines.join('\n') + (lines.length ? '\n' : '');
        if (cut) output += '\n[output cut at 256 KB]\n';
        const { verdicts, checks } = checkLines(output);
        resolve({ phase: 'run', ok: exitCode === 0 && !timedOut, exitCode, timedOut, truncated: cut, file,
                  runner: 'in this browser', runMs: Math.round(performance.now() - t0), output, verdicts, checks });
      };
      const timer = setTimeout(() => finish(1, true), limit);
      w.onmessage = ({ data }) => {
        if (data.t === 'out') {
          if (cut) return;
          size += data.s.length + 1;
          if (size > 256 * 1024) { cut = true; return; }
          lines.push(data.s);
        } else if (data.t === 'crash') finish(1, false, data.s);
        else if (data.t === 'done') finish(0, false);
      };
      w.onerror = e => { e.preventDefault(); finish(1, false, 'Error: ' + (e.message || 'the program could not start')); };
      w.postMessage({ code: req.code || '', file });
    });
  }

  // ---------------------------------------------------------------- the routes
  const ROOT = { id: SITE.root || 'java-interview-practice', name: SITE.root || 'java-interview-practice', path: SITE.root || '', default: true };
  const INFO = {
    jdk: '-', repo: ROOT.name, version: SITE.version || '', autostart: null, platform: 'web', git: false, stub: false,
    files: false, langs: ['py', 'js', 'html'], python: false, node: null, pyassist: false,
    pill: 'Website copy',
    pillTitle: 'This is the website copy of Code Viewer (built ' + (SITE.built || '?') + '). Reading, Practice, Hint, Compare, '
      + 'Next, Done / Revise and search work here. Python, JavaScript and UI pages run here with ticks. ▶ Run on a Java '
      + 'file shows how to run it on a PC. Save, new files and Java suggestions need Code Viewer on the laptop.',
  };

  async function get(path, q) {
    switch (path) {
      case '/api/info': return INFO;
      case '/api/roots': return [ROOT];
      case '/api/tree': return load('tree.json');
      case '/api/progress': return readProgress();
      case '/api/file': {
        const f = (await load('files.json')).files[q.path || ''];
        if (!f) throw new Error('No such file on this website copy: ' + (q.path || '(none)'));
        return { text: f.text, hash: f.hash };
      }
      case '/api/practice': {
        const p = (await load('practice.json'))[q.path || ''];
        if (!p) throw new Error('Practice works on .java, .py, .js and .html files');
        if (p.error) throw new Error(p.error);
        return p;
      }
      case '/api/search': return search(q.q || '', q.regex === '1', q.case === '1');
      case '/api/git': throw new Error('Git ' + LAPTOP);
    }
    throw new Error('Not found');
  }
  async function post(path, b) {
    switch (path) {
      case '/api/run': return b.lang === 'js' ? runJs(b) : b.lang === 'py' ? runPy(b) : runElsewhere(b);
      case '/api/check': return checkLines(b.output || '');
      case '/api/syntax': return { errors: [] };
      case '/api/progress':
        return 'restore' in b ? restoreProgress(b.path, b.restore) : setProgress(b.path, b.status, b.pass, b.secs, b.hints);
      case '/api/assist': throw new Error('Java suggestions need Code Viewer on your laptop.');
      case '/api/save': throw new Error('Saving to a file ' + LAPTOP + ' Your edit stays in this browser as a draft; copy it to keep it.');
      case '/api/new': case '/api/mkdir': case '/api/rename': case '/api/delete':
        throw new Error('Changing files ' + LAPTOP);
      case '/api/git/push': throw new Error('Push ' + LAPTOP);
    }
    throw new Error('That ' + LAPTOP);
  }

  /* Offline after one visit, and installable: the service worker (tools/site_sw.js, sw.js here)
     keeps a copy of the site. Browsers allow one only on https or on this computer. */
  const SW_URL = new URL('sw.js', document.currentScript.src);
  if ('serviceWorker' in navigator && window.isSecureContext) {
    addEventListener('load', () => { navigator.serviceWorker.register(SW_URL).catch(() => {}); });
  }

  /* On a phone the file list fills the screen (build_site.py's CSS); opening a file hides it,
     and the list button at the top left brings it back. */
  const narrow = matchMedia('(max-width: 760px)');
  addEventListener('hashchange', () => {
    if (narrow.matches && !document.body.classList.contains('side-collapsed')) document.getElementById('sideBtn')?.click();
  });

  const reply = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const u = new URL(url, location.href);
    if (u.origin !== location.origin || !u.pathname.startsWith('/api/')) return realFetch(input, init);
    try {
      const q = Object.fromEntries(u.searchParams);
      const body = init && init.body ? JSON.parse(init.body) : null;
      return reply(await (init && init.method === 'POST' ? post(u.pathname, body || {}) : get(u.pathname, q)));
    } catch (e) {
      return reply({ error: e.message || String(e) }, 400);
    }
  };
})();
