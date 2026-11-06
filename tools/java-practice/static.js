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

  // ---------------------------------------------------------------- progress (localStorage)
  const PKEY = 'cvsite:progress';
  const readProgress = () => { try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch { return {}; } };
  const writeProgress = p => {
    try { localStorage.setItem(PKEY, JSON.stringify(p)); }
    catch { throw new Error('This browser would not save your progress (storage full or blocked).'); }
  };
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
    const files = readProgress(), e = files[rel] || {};
    if (status === 'done' && e.s === 'done' && pass) e.r = (e.r || 0) + 1;
    else if (status === 'revise' || status === 'none' || (status === 'done' && e.s !== 'done')) delete e.r;
    if (pass && secs !== null) { e.secs = secs; e.best = Math.min(secs, e.best ?? secs); }
    if (pass && hints !== null) e.hints = hints;
    if (status === 'done' || status === 'revise') { e.s = status; e.t = today(); }
    else if (status === 'none') delete e.s;
    if (pass !== null && pass !== undefined) { e.practiced = today(); e.pass = !!pass; }
    if (Object.keys(e).length) files[rel] = e; else delete files[rel];
    writeProgress(files);
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
    const files = readProgress();
    if (Object.keys(clean).length) files[rel] = clean; else delete files[rel];
    writeProgress(files);
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
               'UI pages (.html) do run here, with their tests.');
    return { phase: 'elsewhere', ok: true, exitCode: 0, file: name, output: lines.join('\n'), runner: 'not on this website' };
  }

  /* A UI page's test output (the page ran here): the laptop server ticks it with outcheck.py.
     That is not ported, so lines are shown without ticks and counted as not checked. */
  function checkLines(output) {
    const text = String(output).replace(/\r\n?/g, '\n').replace(/\n$/, '');
    const verdicts = [], checks = { pass: 0, fail: 0, unchecked: 0 };
    for (const line of text.split('\n')) {
      verdicts.push(null);
      if (/expected/i.test(line)) checks.unchecked++;
    }
    return { verdicts, checks };
  }

  // ---------------------------------------------------------------- the routes
  const ROOT = { id: SITE.root || 'java-interview-practice', name: SITE.root || 'java-interview-practice', path: SITE.root || '', default: true };
  const INFO = {
    jdk: '-', repo: ROOT.name, version: SITE.version || '', autostart: null, platform: 'web', git: false, stub: false,
    files: false, langs: ['py', 'js', 'html'], python: false, node: null, pyassist: false,
    pill: 'Website copy',
    pillTitle: 'This is the website copy of Code Viewer (built ' + (SITE.built || '?') + '). Reading, Practice, Hint, Compare, '
      + 'Next, Done / Revise and search work here; progress is kept in this browser. ▶ Run on a Java file shows how to '
      + 'run it on a PC. Run with ticks, Save, new files and Java suggestions need Code Viewer on the laptop.',
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
      case '/api/run': return runElsewhere(b);
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
