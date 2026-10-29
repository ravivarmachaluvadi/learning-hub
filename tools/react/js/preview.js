/*
 * preview.js - live React previews (adapted from the UI Learning Tool's preview.js).
 *
 * A preview is a sandboxed <iframe srcdoc> (no same-origin access), so the app talks to it only
 * through postMessage. Rendering a component goes like this:
 *
 *   1. In this page, RLT.react.compile turns the JSX into plain JavaScript (Babel, retainLines: each
 *      line stays where you wrote it) and adds a runaway-loop check to every loop.
 *   2. A new frame gets a document with React's module text (vendor/react, see react-runtime.js),
 *      the CSS, and the "bridge" below, which carries the compiled code as text.
 *   3. Inside the frame the bridge turns React's text into modules (blob: URLs: addresses for text
 *      held in memory) and names them in an import map, so `import ... from 'react'` finds them with
 *      no internet. It turns your code into a module the same way, imports React, and renders your
 *      default export, App, into <div id="root"> inside an error boundary and a <Ready> component.
 *      Ready's effect runs once React has drawn App, and only then does the preview report "ready" -
 *      so checks never look at a half-drawn page.
 *
 * The bridge also forwards console output and errors (with the line of YOUR code: it is read from
 * the blob: URL in the error's stack), keeps links and forms from navigating away, stands in for
 * localStorage, offers a pretend backend for fetch('/api/...'), stops endless loops, and runs the
 * checks of a challenge.
 *
 * It also sees what rendered, as React DevTools does: it defines __REACT_DEVTOOLS_GLOBAL_HOOK__
 * before React DOM loads, and React DOM (development) calls the hook's onCommitFiberRoot after every
 * commit. The bridge walks the committed tree, counts each component that rendered (checks read the
 * counts with t.renders), and, while "Highlight renders" is on, outlines each one in the page for a
 * moment and tells the app which rendered (the line under the preview). The same tree tells a check
 * what each mounted component holds (t.components: its props, hooks, state values, contexts and event handlers).
 *
 * Code that imports `vitest` or `@testing-library/...` gets the stand-ins of js/testing.js (only
 * then): its tests run once the component has rendered, and their results reach the console and
 * the checks (t.tests). t.testsOf(source) runs the tests of another version of the code, which the
 * app compiles on the preview's behalf.
 *
 *   var p = RLT.preview.create(container, {height: 260, onConsole: fn, onError: fn, onRenders: fn});
 *     (script: true runs a plain module that only prints, such as JavaScript for React's runs: no
 *     "Nothing to show" warning when it exports no App)
 *   p.render({code, css}).then(function (result) { ... });
 *     result.state: 'ready' | 'error' (it ran, and threw) | 'syntax' (it could not be compiled:
 *                   result.error = {message, line, col}) | 'unavailable' (React or Babel could not
 *                   be loaded from vendor/, or React could not start)
 *   p.runChecks(checks).then(function (results) { ... });   // [{ok, got}] in the order given
 *
 * Creating a preview forgets every earlier preview that is no longer in the page.
 */
(function (U) {
  'use strict';

  var LOAD_TIMEOUT = 20000;   // ms to wait for React's modules to start before saying they could not
  var CHECKS_TIMEOUT = 30000; // ms a challenge's checks may take in all (some wait for timers)

  /* ===================================================================================
   * The bridge. This function is never called in the app window: its source text is
   * copied into each preview document. Keep it self-contained.
   * =================================================================================== */
  function bridge() {
    var cfg = window.__rlt || {};
    var parentWin = window.parent;
    var nativeConsole = {};
    var log = [];          // console.error / console.warn texts, for checks (t.warnings())
    var logAll = [];       // every console line, for checks (t.logs())
    var errored = false;   // an error was reported before the preview said "ready"
    var isReady = false;

    function send(msg) {
      msg.epoch = cfg.epoch;
      try { parentWin.postMessage(msg, '*'); } catch (e) { /* app window gone */ }
    }

    /* ---------- what rendered: a stand-in for React DevTools' hook (defined before React DOM loads) ----------
       After each commit, walk the new tree as DevTools does: a subtree whose children are the very same
       fibers as before was not touched, so it is skipped; a component rendered if it is new (no
       alternate: it mounted) or React marked it as having done work (flag 1, PerformedWork). Counting
       commits, not calls, means StrictMode's second call and a render a transition dropped never count. */
    var renderTotals = {};                    // component name -> commits it rendered in (t.renders)
    var ownTypes = [];                        // the tool's own components (its error boundary, Ready): never counted
    var roots = [];                           // every React root that has committed (t.components reads them)
    var highlight = !!cfg.highlight, commits = 0, recent = {}, layer = null;
    var COMPOSITE = { 0: 1, 1: 1, 11: 1, 15: 1 };   // function, class, forwardRef, simple memo (a memo with a compare has its function as a child)
    var HOST = { 5: 1, 26: 1, 27: 1 };              // DOM elements
    function nameOf(f) {
      var t = f.type, r = f.tag === 11 && t ? t.render : null;
      return (t && t.displayName) || (r && (r.displayName || r.name)) || (!r && t && t.name) || 'Anonymous';
    }
    function walk(next, prev, out) {
      if (COMPOSITE[next.tag] && ownTypes.indexOf(next.type) < 0 && (!prev || (next.flags & 1))) out.push(next);
      if (prev && next.child === prev.child) return;
      for (var c = next.child; c; c = c.sibling) walk(c, c.alternate, out);
    }
    function hostNodes(f, out) {
      for (var c = f.child; c; c = c.sibling) {
        if (HOST[c.tag] || c.tag === 6) out.push(c.stateNode);
        else hostNodes(c, out);
      }
      return out;
    }
    function boxOf(nodes) {
      var box = null;
      nodes.forEach(function (n) {
        if (!n || !n.isConnected) return;
        var b;
        if (n.nodeType === 3) { var range = document.createRange(); range.selectNodeContents(n); b = range.getBoundingClientRect(); }
        else b = n.getBoundingClientRect();
        if (!b.width && !b.height) return;
        box = box ? { l: Math.min(box.l, b.left), t: Math.min(box.t, b.top), r: Math.max(box.r, b.right), b: Math.max(box.b, b.bottom) }
          : { l: b.left, t: b.top, r: b.right, b: b.bottom };
      });
      return box;
    }
    /** Outline each component that rendered, for a moment: teal, amber once its component (by name)
        rendered in 2 commits within a second, red after 4. */
    function flash(items) {
      var now = Date.now(), seen = {};
      items.forEach(function (it) {   // one tick per name per commit: three Rows in one commit are one render of Row
        if (seen[it.name]) return;
        seen[it.name] = true;
        recent[it.name] = (recent[it.name] || []).filter(function (x) { return now - x < 1000; }).concat(now);
      });
      setTimeout(function () {   // after the commit: layout effects have run and the DOM is final
        if (!layer || !layer.isConnected) {
          layer = document.createElement('div');
          layer.id = 'rlt-flashes';
          document.documentElement.appendChild(layer);   // outside <body>: checks that look at body's children never see it
        }
        items.forEach(function (it) {
          var box = boxOf(it.nodes);
          if (!box) return;
          var n = recent[it.name].length;
          var el = document.createElement('div');
          el.className = 'rlt-flash ' + (n >= 4 ? 'rlt-hot' : n >= 2 ? 'rlt-warm' : 'rlt-cool');
          el.setAttribute('data-name', it.name);
          el.style.left = (box.l - 1) + 'px';
          el.style.top = (box.t - 1) + 'px';
          el.style.width = (box.r - box.l + 2) + 'px';
          el.style.height = (box.b - box.t + 2) + 'px';
          var label = document.createElement('span');
          label.textContent = it.name;
          el.appendChild(label);
          layer.appendChild(el);
          setTimeout(function () { el.classList.add('rlt-fade'); }, 550);
          setTimeout(function () { el.remove(); }, 1000);
        });
      }, 0);
    }
    /** What a mounted component holds, read from the committed tree: its name, its type (to render it afresh), its props, how
        many hooks it calls (useState, useEffect, useRef…: each keeps a slot; a class component has none),
        the values its state hooks hold now (a hook with an update queue: useState, useReducer and the
        hooks built on them, such as useTransition's flag; not refs, memos or effects), how many contexts
        it reads, and the event handlers on the elements it renders itself (['button.onClick']; not
        those of the components inside it). */
    function describeFiber(f) {
      var hooks = 0, contexts = 0, handlers = [], states = [];
      if (f.tag !== 1) for (var s = f.memoizedState; s; s = s.next) { hooks++; if (s.queue) states.push(s.memoizedState); }
      for (var c = f.dependencies && f.dependencies.firstContext; c; c = c.next) contexts++;
      (function own(x) {
        for (; x; x = x.sibling) {
          if (COMPOSITE[x.tag]) continue;   // another component: its handlers are its own
          if (HOST[x.tag]) {
            var p = x.memoizedProps || {};
            for (var k in p) if (/^on[A-Z]/.test(k) && typeof p[k] === 'function') handlers.push(x.type + '.' + k);
          }
          own(x.child);
        }
      })(f.child);
      return { name: nameOf(f), type: f.type, props: f.memoizedProps || {}, hooks: hooks, states: states, contexts: contexts, handlers: handlers };
    }
    /** Every mounted instance of the component called name, or of every component when no name is given, in tree order. */
    function componentsNamed(name) {
      var out = [];
      roots.forEach(function (r) {
        (function walk(f) {
          for (; f; f = f.sibling) {
            if (COMPOSITE[f.tag] && ownTypes.indexOf(f.type) < 0 && (name == null || nameOf(f) === name)) out.push(describeFiber(f));
            walk(f.child);
          }
        })(r.current && r.current.child);
      });
      return out;
    }
    function onCommit(root) {
      if (roots.indexOf(root) < 0) roots.push(root);
      var cur = root.current, out = [], counts = {};
      walk(cur, cur.alternate, out);
      out.forEach(function (f) {
        var n = nameOf(f);
        renderTotals[n] = (renderTotals[n] || 0) + 1;
        counts[n] = (counts[n] || 0) + 1;
      });
      commits++;
      // the first commit draws the whole page: flashing all of it says nothing
      if (highlight && commits > 1 && out.length) {
        flash(out.map(function (f) { return { name: nameOf(f), nodes: hostNodes(f, []) }; }));
        send({ rlt: 'renders', counts: counts });
      }
    }
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true, isDisabled: false, renderers: new Map(),
      inject: function (internals) { this.renderers.set(1, internals); return 1; },
      onCommitFiberRoot: function (id, root) {
        try { onCommit(root); } catch (e) { nativeConsole.warn && nativeConsole.warn('render highlighter:', e); }
      }
    };

    /* ---------- React: its module text becomes modules, named by an import map (before any import) ---------- */
    (function () {
      var mods = window.__rltReact || {}, extra = window.__rltExtra || {}, imports = {};
      Object.keys(extra).forEach(function (name) { mods[name] = extra[name]; });   // the testing stand-ins, when the code imports them
      Object.keys(mods).forEach(function (name) {
        imports[name] = URL.createObjectURL(new Blob([mods[name]], { type: 'text/javascript' }));
      });
      try { delete window.__rltReact; delete window.__rltExtra; } catch (e) { /* leave it */ }
      var map = document.createElement('script');
      map.type = 'importmap';
      map.textContent = JSON.stringify({ imports: imports });
      document.head.appendChild(map);
    })();

    /* ---------- where an error happened: the line in the learner's code ---------- */
    var userUrl = URL.createObjectURL(new Blob([cfg.code || ''], { type: 'text/javascript' }));
    var urlRe = new RegExp(userUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':(\\d+)');
    function lineOf(err) {
      var m = err && err.stack && urlRe.exec(String(err.stack));
      return m ? +m[1] : 0;
    }

    /* ---------- value formatting for the console panel ---------- */
    function describeEl(el) {
      var s = '<' + el.tagName.toLowerCase();
      if (el.id) s += '#' + el.id;
      if (el.classList && el.classList.length) s += '.' + Array.prototype.join.call(el.classList, '.');
      return s + '>';
    }
    function fmt(v, depth, nested) {
      depth = depth || 0;
      if (v === null) return 'null';
      if (v === undefined) return 'undefined';
      var t = typeof v;
      if (t === 'string') return nested ? JSON.stringify(v) : v;
      if (t === 'number' || t === 'boolean' || t === 'bigint') return String(v);
      if (t === 'symbol') return v.toString();
      if (t === 'function') return 'ƒ ' + (v.name || 'anonymous') + '()';
      if (v instanceof Error) return v.name + ': ' + v.message;
      if (typeof Element !== 'undefined' && v instanceof Element) return describeEl(v);
      if (typeof Node !== 'undefined' && v instanceof Node) return v.nodeName;
      if (v instanceof Date) return v.toISOString();
      if (v && v.$$typeof && v.type) return '<' + (typeof v.type === 'string' ? v.type : v.type.name || 'Component') + ' /> (a React element)';
      if (typeof Event !== 'undefined' && v instanceof Event) {
        return v.constructor.name + ' {type: "' + v.type + '"' + (v.target && v.target.tagName ? ', target: ' + describeEl(v.target) : '') + '}';
      }
      if (v && v.nativeEvent && v.type) return 'SyntheticEvent {type: "' + v.type + '"' + (v.target && v.target.tagName ? ', target: ' + describeEl(v.target) : '') + '}';
      if (depth > 2) return Array.isArray(v) ? '[…]' : '{…}';
      var isList = (typeof NodeList !== 'undefined' && v instanceof NodeList) ||
                   (typeof HTMLCollection !== 'undefined' && v instanceof HTMLCollection);
      if (Array.isArray(v) || isList) {
        var items = Array.prototype.slice.call(v, 0, 50).map(function (x) { return fmt(x, depth + 1, true); });
        var name = isList ? v.constructor.name + '(' + v.length + ') ' : (v.length > 1 ? '(' + v.length + ') ' : '');
        return name + '[' + items.join(', ') + (v.length > 50 ? ', …' : '') + ']';
      }
      if (v instanceof Map) {
        return 'Map(' + v.size + ') {' + Array.from(v.entries()).slice(0, 30).map(function (e) {
          return fmt(e[0], depth + 1, true) + ' => ' + fmt(e[1], depth + 1, true);
        }).join(', ') + '}';
      }
      if (v instanceof Set) {
        return 'Set(' + v.size + ') {' + Array.from(v).slice(0, 30).map(function (x) { return fmt(x, depth + 1, true); }).join(', ') + '}';
      }
      if (typeof Promise !== 'undefined' && v instanceof Promise) return 'Promise {…}';
      try {
        var keys = Object.keys(v);
        var ctor = v.constructor && v.constructor !== Object ? v.constructor.name + ' ' : '';
        return ctor + '{' + keys.slice(0, 30).map(function (k) {
          return k + ': ' + fmt(v[k], depth + 1, true);
        }).join(', ') + (keys.length > 30 ? ', …' : '') + '}';
      } catch (e) { return String(v); }
    }
    /** console.log's own format: "%s" and friends in the first argument take the next ones (React's warnings use it). */
    function formatArgs(args) {
      if (typeof args[0] !== 'string' || !/%[sdifoOc]/.test(args[0])) return args.map(function (a) { return fmt(a, 0, false); }).join(' ');
      var rest = args.slice(1);
      var head = args[0].replace(/%([sdifoOc])/g, function (m, k) {
        if (!rest.length) return m;
        var v = rest.shift();
        if (k === 'c') return '';
        if (k === 'd' || k === 'i') return String(parseInt(v, 10));
        if (k === 'f') return String(parseFloat(v));
        return fmt(v, 0, k !== 's');
      });
      return [head].concat(rest.map(function (a) { return fmt(a, 0, false); })).join(' ').trim();
    }

    ['log', 'info', 'warn', 'error', 'debug', 'table', 'dir'].forEach(function (lv) {
      nativeConsole[lv] = (console[lv] || console.log).bind(console);
      console[lv] = function () {
        var args = Array.prototype.slice.call(arguments);
        var level = (lv === 'warn' || lv === 'error' || lv === 'info') ? lv : 'log';
        var text = formatArgs(args);
        if (level === 'warn' || level === 'error') log.push({ level: level, text: text });
        logAll.push(text);
        send({ rlt: 'console', level: level, text: text });
        nativeConsole[lv].apply(null, args);
      };
    });
    console.clear = function () { send({ rlt: 'console-clear' }); };

    /* ---------- errors ---------- */
    function report(err, prefix) {
      var text = (prefix || '') + (err && err.name && err.message ? err.name + ': ' + err.message : String(err && err.message || err));
      log.push({ level: 'error', text: text });
      if (!isReady) errored = true;
      send({ rlt: 'error', text: text, line: lineOf(err) });
    }
    window.addEventListener('error', function (e) {
      var t = e.target;
      if (t && t !== window && t.tagName) {
        var what = t.getAttribute('src') || t.getAttribute('href') || t.tagName.toLowerCase();
        if (what.length > 80) what = what.slice(0, 77) + '…';
        send({ rlt: 'console', level: 'warn', text: 'Could not load ' + what + ' (' + describeEl(t) + ')' });
        return;
      }
      report(e.error || { message: e.message });
    }, true);
    window.addEventListener('unhandledrejection', function (e) { report(e.reason, 'Uncaught (in promise) '); });

    /* ---------- runaway-loop guard (the app inserts calls to it into loop bodies) ---------- */
    var loopCounts = {}, loopStarts = {}, loopResetQueued = false;
    window.__rltLoop = function (id, line) {
      if (!loopResetQueued) {
        loopResetQueued = true;
        setTimeout(function () { loopCounts = {}; loopStarts = {}; loopResetQueued = false; }, 0);
      }
      var c = loopCounts[id] = (loopCounts[id] || 0) + 1;
      if (c === 1) loopStarts[id] = Date.now();
      else if (c % 1000 === 0 && Date.now() - loopStarts[id] > 1500) {
        send({ rlt: 'error', text: 'Stopped a loop that kept running for 1.5 seconds - it is probably infinite. Check its condition.', line: line });
        return true;
      }
      return false;
    };

    /* ---------- keep the preview in place: links and forms ---------- */
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || !e.target.closest) return;
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      e.preventDefault();
      if (href.charAt(0) === '#') {
        var id = decodeURIComponent(href.slice(1));
        var dest = id ? document.getElementById(id) || document.getElementsByName(id)[0] : document.body;
        if (dest) dest.scrollIntoView();
        return;
      }
      var how = /^mailto:/i.test(href) ? 'would open your email app'
        : a.target === '_blank' ? 'would open in a new tab' : 'would replace this page';
      send({ rlt: 'console', level: 'info', text: 'Link clicked: ' + href + ' - ' + how + '. (The preview does not follow links.)' });
    });
    document.addEventListener('submit', function (e) {
      // React form actions (<form action={fn}>) call preventDefault themselves; this catches plain forms
      if (e.defaultPrevented) return;
      e.preventDefault();
      var f = e.target, pairs = [];
      try {
        new FormData(f, e.submitter).forEach(function (v, k) { pairs.push(k + '=' + (typeof v === 'string' ? v : (v.name || 'file'))); });
      } catch (x) { /* very old browser */ }
      send({ rlt: 'console', level: 'info', text: 'Form submitted with ' + (pairs.length ? pairs.join('&') : 'no named fields') +
        '. The browser would now load a new page; in React, call e.preventDefault() in onSubmit (or use <form action={fn}>).' });
    });

    /* ---------- localStorage stand-in (persisted by the app between renders) ---------- */
    (function () {
      var works = false;
      try { works = !!window.localStorage && (window.localStorage.setItem('__t', '1'), window.localStorage.removeItem('__t'), true); } catch (e) { works = false; }
      if (works) return;
      function makeStore(initial, persist) {
        var data = initial || {};
        function save() { if (persist) send({ rlt: 'storage', data: data }); }
        return {
          getItem: function (k) { k = String(k); return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
          setItem: function (k, v) { data[String(k)] = String(v); save(); },
          removeItem: function (k) { delete data[String(k)]; save(); },
          clear: function () { data = {}; save(); },
          key: function (i) { return Object.keys(data)[i] || null; },
          get length() { return Object.keys(data).length; }
        };
      }
      try { Object.defineProperty(window, 'localStorage', { value: makeStore(cfg.storage, true), configurable: true }); } catch (e) { /* leave it */ }
      try { Object.defineProperty(window, 'sessionStorage', { value: makeStore({}, false), configurable: true }); } catch (e) { /* leave it */ }
    })();

    /* ---------- pretend backend: fetch('/api/...') (the UI Learning Tool's, unchanged) ---------- */
    var realFetch = window.fetch;
    var api = {
      users: [
        { id: 1, name: 'Asha Rao', email: 'asha@example.com', role: 'admin' },
        { id: 2, name: 'Vikram Shah', email: 'vikram@example.com', role: 'developer' },
        { id: 3, name: 'Meera Iyer', email: 'meera@example.com', role: 'designer' }
      ],
      todos: [
        { id: 1, title: 'Learn HTML', done: true },
        { id: 2, title: 'Learn CSS', done: false },
        { id: 3, title: 'Learn React', done: false }
      ],
      nextTodo: 4,
      nextUser: 4
    };
    function reply(status, body, delay) {
      var text = { 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 404: 'Not Found', 415: 'Unsupported Media Type', 500: 'Internal Server Error' }[status] || '';
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve(new Response(status === 204 ? null : JSON.stringify(body), {
            status: status, statusText: text, headers: { 'Content-Type': 'application/json' }
          }));
        }, delay === undefined ? 300 : delay);
      });
    }
    function headerOf(headers, name) {
      if (!headers) return '';
      if (typeof headers.get === 'function') return headers.get(name) || '';
      if (Array.isArray(headers)) {
        var pair = headers.filter(function (x) { return String(x[0]).toLowerCase() === name; })[0];
        return pair ? String(pair[1]) : '';
      }
      for (var k in headers) if (k.toLowerCase() === name) return String(headers[k]);
      return '';
    }
    /* POST /api/users behaves like a Spring controller: @RequestBody (415 without JSON), @Valid with
       @NotBlank name and @Email email (400 with field errors, as a @RestControllerAdvice would send) */
    function createUser(body, contentType) {
      if (!/application\/json/i.test(contentType)) {
        return reply(415, { status: 415, error: 'Unsupported Media Type', message: "Content-Type '" + (contentType || 'text/plain;charset=UTF-8') + "' is not supported. Send the header Content-Type: application/json." });
      }
      var name = body && typeof body.name === 'string' ? body.name.trim() : '';
      var email = body && typeof body.email === 'string' ? body.email.trim() : '';
      var errors = [];
      if (!name) errors.push({ field: 'name', message: 'must not be blank' });
      if (!email) errors.push({ field: 'email', message: 'must not be blank' });
      else if (!/^[^@\s]+@[^@\s]+$/.test(email)) errors.push({ field: 'email', message: 'must be a well-formed email address' });
      if (errors.length) return reply(400, { status: 400, error: 'Bad Request', errors: errors });
      var user = { id: api.nextUser++, name: name, email: email, role: 'user' };
      api.users.push(user);
      return reply(201, user);
    }
    function route(method, path, query, body, contentType) {
      var m;
      if (path === 'hello') return reply(200, { message: 'Hello, ' + (query.name || 'stranger') + '!' });
      if (path === 'users' && method === 'GET') return reply(200, api.users);
      if (path === 'users' && method === 'POST') return createUser(body, contentType);
      if ((m = path.match(/^users\/(\d+)$/)) && method === 'GET') {
        var u = api.users.filter(function (x) { return x.id === +m[1]; })[0];
        return u ? reply(200, u) : reply(404, { error: 'No user with id ' + m[1] });
      }
      if (path === 'todos' && method === 'GET') return reply(200, api.todos);
      if (path === 'todos' && method === 'POST') {
        if (!body || !body.title) return reply(400, { error: 'A todo needs a "title"' });
        var t = { id: api.nextTodo++, title: String(body.title), done: !!body.done };
        api.todos.push(t);
        return reply(201, t);
      }
      if ((m = path.match(/^todos\/(\d+)$/))) {
        var idx = -1;
        api.todos.forEach(function (x, i) { if (x.id === +m[1]) idx = i; });
        if (idx < 0) return reply(404, { error: 'No todo with id ' + m[1] });
        if (method === 'GET') return reply(200, api.todos[idx]);
        if (method === 'PUT' || method === 'PATCH') { Object.assign(api.todos[idx], body || {}, { id: api.todos[idx].id }); return reply(200, api.todos[idx]); }
        if (method === 'DELETE') { api.todos.splice(idx, 1); return reply(204); }
      }
      if (path === 'slow') return reply(200, { message: 'Sorry I am late - this endpoint takes 2 seconds.' }, 2000);
      if (path === 'error') return reply(500, { error: 'Something went wrong on the server' });
      return reply(404, { error: 'No endpoint ' + method + ' /api/' + path + '. Try /api/users (GET or POST), /api/users/1, /api/todos, /api/hello?name=Ravi, /api/slow, /api/error' });
    }
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || String(input);
      var m = url.match(/^(?:\.?\/)?api\/([^?#]*)(?:\?([^#]*))?/);
      if (!m) return realFetch ? realFetch.apply(window, arguments) : Promise.reject(new TypeError('fetch is not available'));
      init = init || {};
      var method = String(init.method || 'GET').toUpperCase();
      var query = {};
      (m[2] || '').split('&').forEach(function (p) {
        if (!p) return;
        var kv = p.split('=');
        query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
      });
      var body = null;
      if (init.body) { try { body = JSON.parse(init.body); } catch (e) { return reply(400, { error: 'The body is not valid JSON' }); } }
      send({ rlt: 'console', level: 'info', text: '→ ' + method + ' /api/' + m[1] + (m[2] ? '?' + m[2] : '') + (init.body ? '  body: ' + init.body : '') + '   (pretend server)' });
      var contentType = headerOf(init.headers, 'content-type') || (typeof init.body === 'string' ? 'text/plain;charset=UTF-8' : '');
      return route(method, m[1].replace(/\/$/, ''), query, body, contentType).then(function (res) {
        send({ rlt: 'console', level: 'info', text: '← ' + res.status + ' ' + res.statusText + '   ' + method + ' /api/' + m[1] });
        return res;
      });
    };

    /* ---------- checks: what a challenge asks of the rendered page ---------- */
    function q1(sel) { return document.querySelector(sel); }
    function qa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
    function textOf(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; }
    function the(sel) {
      var el = typeof sel === 'string' ? q1(sel) : sel;
      if (!el) throw new Error('Nothing matches ' + sel);
      return el;
    }
    /** Let React finish what an event started: its updates, then the effects they cause. */
    function tick() { return new Promise(function (r) { setTimeout(function () { setTimeout(r, 0); }, 0); }); }

    /* ---------- tests (js/testing.js's stand-ins): the run after the first render, and runs of other code ---------- */
    var testsDone = null;                     // the results of the code's own tests, once they have run
    var compiles = {}, compileSeq = 0;
    /** JSX -> JavaScript, by the app (Babel lives there): resolves with {code} or {error}. */
    function compileInApp(source) {
      return new Promise(function (resolve) {
        var id = ++compileSeq;
        compiles[id] = resolve;
        send({ rlt: 'compile', id: id, source: String(source) });
        setTimeout(function () { if (compiles[id]) { delete compiles[id]; resolve({ error: 'the app did not answer' }); } }, 5000);
      });
    }

    var helpers = {
      $: q1, $$: qa, tick: tick,
      source: function () { return cfg.source || ''; },   // the JSX as written
      code: function () { return cfg.code || ''; },       // the JavaScript Babel made of it
      text: function (sel) { return textOf(typeof sel === 'string' ? q1(sel) : sel); },
      count: function (sel) { return qa(sel).length; },
      wait: function (ms) { return new Promise(function (r) { setTimeout(r, ms || 0); }); },
      warnings: function () { return log.map(function (e) { return e.text; }); },
      logs: function () { return logAll.slice(); },      // every console line so far, log and info included
      /* each mounted instance of a component, or of every component with no name: {name, type, props, hooks, states, contexts, handlers} (describeFiber, above) */
      components: function (name) { return componentsNamed(name); },
      /* the code's tests ([{name, ok, error, ms}]), once they have run; [] when it has none */
      tests: function () { return testsDone || Promise.resolve([]); },
      /* the tests of another version of the code (say, the component broken on purpose), run quietly */
      testsOf: function (source) {
        return compileInApp(source).then(function (r) {
          if (r.error || !r.code) return [{ name: '(compile)', ok: false, error: 'the changed code does not compile: ' + (r.error || 'no code'), ms: 0 }];
          if (!window.__rltTL) return [{ name: '(no tests)', ok: false, error: 'the code imports no test library, so it has no tests to run', ms: 0 }];
          return window.__rltTL.runModule(r.code);
        });
      },
      click: function (sel) { the(sel).click(); return tick(); },
      /* React tracks an input's value itself, so a plain `el.value = x` would not reach onChange:
         set it through the native setter, as typing does, then send the input event */
      type: function (sel, value) {
        var el = the(sel);
        var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        el.focus();
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return tick();
      },
      key: function (sel, key) {
        var el = the(sel);
        el.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true }));
        el.dispatchEvent(new KeyboardEvent('keyup', { key: key, bubbles: true, cancelable: true }));
        return tick();
      },
      /* React builds onMouseEnter / onMouseLeave from mouseover / mouseout pairs */
      hover: function (sel) {
        var el = the(sel);
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }));
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
        return tick();
      },
      leave: function (sel) {
        var el = the(sel);
        el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));
        el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
        return tick();
      },
      /* what rendered: t.renders() is every component's count of commits it rendered in, so far;
         t.renders(async fn) runs fn and resolves with the counts of what rendered while it ran */
      renders: function (fn) {
        function copy() { var o = {}; for (var k in renderTotals) o[k] = renderTotals[k]; return o; }
        if (typeof fn !== 'function') return copy();
        var before = copy();
        return Promise.resolve().then(fn).then(tick).then(function () {
          var out = {};
          for (var k in renderTotals) { var d = renderTotals[k] - (before[k] || 0); if (d) out[k] = d; }
          return out;
        });
      },
      submit: function (sel) { var f = the(sel); if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); return tick(); },
      /* a paste of `text`, as Ctrl+V gives it: onPaste reads it from e.clipboardData */
      paste: function (sel, text) {
        var el = the(sel), data = new DataTransfer();
        data.setData('text/plain', String(text));
        el.focus();
        el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
        return tick();
      }
    };

    function compare(got, c) {
      if (c.equals !== undefined) return String(got) === String(c.equals);
      if (c.match) return new RegExp(c.match, 'i').test(String(got));
      if (c.includes !== undefined) return String(got).toLowerCase().indexOf(String(c.includes).toLowerCase()) >= 0;
      return true;
    }
    function short(s) { s = String(s); return s.length > 70 ? s.slice(0, 67) + '…' : s; }
    function runCheck(c) {
      var msgOk = { ok: true };
      try {
        if (c.fn) {
          var fn = (0, eval)('(' + c.fn + ')');
          return Promise.resolve(fn(document, window, helpers)).then(function (r) {
            if (r === true || r === undefined) return msgOk;
            return { ok: false, got: typeof r === 'string' ? r : '' };
          }, function (err) { return { ok: false, got: 'Error: ' + (err && err.message || err) }; });
        }
        if (c.exists) return Promise.resolve(q1(c.exists) ? msgOk : { ok: false, got: 'nothing matches ' + c.exists });
        if (c.count) {
          var n = qa(c.count).length;
          var ok = (c.eq === undefined || n === c.eq) && (c.min === undefined || n >= c.min) && (c.max === undefined || n <= c.max);
          return Promise.resolve({ ok: ok, got: 'found ' + n });
        }
        if (c.text) {
          var te = q1(c.text);
          if (!te) return Promise.resolve({ ok: false, got: 'nothing matches ' + c.text });
          var tv = textOf(te);
          return Promise.resolve({ ok: compare(tv, c), got: '"' + short(tv) + '"' });
        }
        return Promise.resolve({ ok: false, got: 'unknown check type' });
      } catch (err) {
        return Promise.resolve({ ok: false, got: 'Error: ' + (err && err.message || err) });
      }
    }

    function answer(q) {
      if (q.type === 'checks') {
        var results = [];
        return (q.checks || []).reduce(function (p, c) {
          return p.then(function () { return runCheck(c).then(function (r) { results.push(r); }); });
        }, Promise.resolve()).then(function () { return results; });
      }
      if (q.type === 'eval') {
        var f = (0, eval)('(' + q.code + ')');
        return typeof f === 'function' ? f(document, window, helpers) : f;
      }
      if (q.type === 'html') return document.getElementById('root') ? document.getElementById('root').innerHTML : '';
      return null;
    }

    window.addEventListener('message', function (ev) {
      var d = ev.data;
      if (d && d.rlt === 'highlight' && ev.source === parentWin) { highlight = !!d.on; return; }
      if (d && d.rlt === 'compiled' && ev.source === parentWin) {
        var done = compiles[d.id];
        if (done) { delete compiles[d.id]; done(d); }
        return;
      }
      if (!d || d.rlt !== 'ask' || ev.source !== parentWin) return;
      Promise.resolve().then(function () { return answer(d.q || {}); }).then(function (r) {
        send({ rlt: 'answer', id: d.id, result: r });
      }, function (err) {
        send({ rlt: 'answer', id: d.id, error: String(err && err.message || err) });
      });
    });

    /*
     * A brand-new preview can be "loaded" a few milliseconds before the browser has given its
     * <iframe> a size (seen in the UI Learning Tool's tests): wait until the window has a width.
     * A preview that is really hidden never gets one; after about a second it is reported anyway.
     */
    function whenLaidOut(cb, tries) {
      tries = tries || 0;
      var laidOut = innerWidth > 0 && document.documentElement.getBoundingClientRect().width > 0;
      if (laidOut || tries > 60) { cb(); return; }
      setTimeout(function () { whenLaidOut(cb, tries + 1); }, 15);
    }
    function ready() {
      if (isReady) return;
      isReady = true;
      setTimeout(function () { whenLaidOut(function () { send({ rlt: 'ready', errored: errored }); }); }, 0);
      // the code's own tests run once the component has rendered; a failed test is not a crash
      if (window.__rltTL && window.__rltTL.registered()) testsDone = window.__rltTL.runMain();
    }

    /* ---------- import React, then the learner's module, and render its App ---------- */
    function mount() {
      var timer = setTimeout(function () { send({ rlt: 'unavailable', text: 'React did not start within ' + cfg.timeout / 1000 + ' seconds.' }); }, cfg.timeout);
      Promise.all([import('react'), import('react-dom/client')]).then(function (mods) {
        clearTimeout(timer);
        var React = mods[0], RDC = mods[1], h = React.createElement;
        send({ rlt: 'react', version: React.version });
        return import(userUrl).then(function (mod) {
          var App = mod['default'];
          if (typeof App !== 'function') {
            // no default export: the code rendered itself with createRoot, or rendered nothing at all
            // (a plain script, cfg.script, only prints: nothing to show is what it means to do)
            if (!cfg.script && !document.getElementById('root').childNodes.length && !(cfg.code || '').match(/createRoot|render\s*\(/)) {
              send({ rlt: 'console', level: 'warn', text: 'Nothing to show: write `export default function App() { ... }` and return some JSX.' });
            }
            setTimeout(ready, 30);
            return;
          }
          class Boundary extends React.Component {
            constructor(props) { super(props); this.state = { error: null }; }
            static getDerivedStateFromError(error) { return { error: error }; }
            render() {
              if (!this.state.error) return this.props.children;
              return h('pre', { className: 'rlt-crash' },
                'This component crashed while rendering:\n\n' + (this.state.error.name || 'Error') + ': ' + this.state.error.message +
                '\n\nThe console below names the line. Fix it, and the preview runs again.');
            }
          }
          function Ready(props) {
            React.useEffect(function () { ready(); }, []);
            return props.children;
          }
          ownTypes.push(Boundary, Ready);
          var root = RDC.createRoot(document.getElementById('root'), {
            onCaughtError: function (err) { report(err); ready(); },
            onUncaughtError: function (err) { report(err); ready(); },
            onRecoverableError: function (err) { send({ rlt: 'console', level: 'warn', text: String(err && err.message || err) }); }
          });
          var app = h(Boundary, null, h(Ready, null, h(App)));
          root.render(cfg.strict ? h(React.StrictMode, null, app) : app);
        }, function (err) { report(err); ready(); });
      }, function (err) {
        clearTimeout(timer);
        send({ rlt: 'unavailable', text: String(err && err.message || err) });
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  }

  /* ===================================================================================
   * App side
   * =================================================================================== */

  var previews = [];

  window.addEventListener('message', function (ev) {
    var d = ev.data;
    if (!d || typeof d !== 'object' || !d.rlt) return;
    for (var i = 0; i < previews.length; i++) {
      if (previews[i].frame.contentWindow === ev.source) { previews[i]._message(d); return; }
    }
  });

  /** The page every preview gets: base styles for a demo page, then the snippet's own CSS. */
  var BASE_CSS = 'body { font-family: system-ui, sans-serif; margin: 12px; color: #1d2433; line-height: 1.45; }' +
    ' button, input, select, textarea { font: inherit; }' +
    ' .rlt-crash { white-space: pre-wrap; background: #fdecec; color: #a32020; border: 1px solid #f3b4b4; border-radius: 8px; padding: 10px 12px; font: 13px/1.5 ui-monospace, Consolas, monospace; }' +
    // the re-render highlighter's outlines (see the bridge): above everything, never in the way of a click
    ' #rlt-flashes { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; }' +
    ' #rlt-flashes .rlt-flash { position: fixed; box-sizing: border-box; border: 2px solid #1a9fb5; border-radius: 3px; background: rgba(26, 159, 181, 0.06); opacity: 1; transition: opacity 0.4s; }' +
    // the name sits inside the outline, top right, where it rarely hides the component's own text
    ' #rlt-flashes .rlt-flash span { position: absolute; right: 0; top: 0; padding: 0 5px; border-radius: 0 0 0 3px; background: #1a9fb5; color: #fff; font: 600 10px/14px system-ui, sans-serif; white-space: nowrap; }' +
    ' #rlt-flashes .rlt-warm { border-color: #d99a00; background: rgba(217, 154, 0, 0.08); } #rlt-flashes .rlt-warm span { background: #d99a00; color: #1d2433; }' +
    ' #rlt-flashes .rlt-hot { border-color: #d63a3a; background: rgba(214, 58, 58, 0.08); } #rlt-flashes .rlt-hot span { background: #d63a3a; }' +
    ' #rlt-flashes .rlt-fade { opacity: 0; }';

  /* ---------- "Highlight renders": one switch for every preview, remembered in "rlt.highlight" ---------- */
  function highlightOn() { return U.store.get('highlight', false) === true; }
  function paintSwitch(b) {
    var on = highlightOn();
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.classList.toggle('active', on);
  }
  function setHighlight(on) {
    U.store.set('highlight', !!on);
    previews.forEach(function (p) { p.post({ rlt: 'highlight', on: !!on }); });
    U.$$('.hl-toggle').forEach(paintSwitch);
    if (!on) U.$$('.render-line').forEach(function (l) { l.hidden = true; l.textContent = ''; });
  }
  /**
   * The switch for a preview's bar, and the line that goes under the preview: "Rendered: App, Row ×3"
   * (×3: three Rows rendered in that commit). Pass onRenders to U.preview.create, and clear() on a reload.
   */
  function highlighter() {
    var line = U.h('div', { class: 'render-line', hidden: true });
    var toggle = U.h('button', {
      class: 'btn btn-small btn-ghost hl-toggle', type: 'button',
      title: 'Outline each component for a moment when it renders, as React DevTools does with "Highlight updates when components render"',
      onclick: function () { setHighlight(!highlightOn()); }
    }, 'Highlight renders');
    paintSwitch(toggle);
    return {
      toggle: toggle, line: line,
      onRenders: function (counts) {
        if (!highlightOn()) return;
        line.textContent = 'Rendered: ' + Object.keys(counts).map(function (n) { return counts[n] > 1 ? n + ' ×' + counts[n] : n; }).join(', ');
        line.hidden = false;
      },
      clear: function () { line.hidden = true; line.textContent = ''; }
    };
  }

  /** A value as JSON that is safe inside a <script>: no "<", so no "</script>" can end it early. */
  function safe(v) { return JSON.stringify(v).replace(/</g, '\\u003c'); }

  /** React's module text (about 1.2 MB) as one <script> for the preview document: made once, reused. */
  var reactScript = null;
  function reactModules() {
    if (reactScript === null) reactScript = '<script>window.__rltReact=' + safe(U.react.modules()) + ';</' + 'script>';
    return reactScript;
  }

  /** Code that imports vitest or Testing Library gets the stand-ins (js/testing.js); other code does not pay for them. */
  var TESTING_IMPORT = /\bfrom\s+['"](vitest|@testing-library\/[\w/-]+)['"]|\bimport\s+['"]@testing-library\/[\w/-]+['"]/;
  function testingScripts(source) {
    if (!U.testing || !TESTING_IMPORT.test(source)) return '';
    return '<script>(' + U.testing.library.toString() + ')();</' + 'script>' +
      '<script>window.__rltExtra=' + safe(U.testing.modules) + ';</' + 'script>';
  }

  function buildDoc(source, code, css, epoch, opts) {
    var cfg = { epoch: epoch, source: source, code: code, timeout: LOAD_TIMEOUT, strict: !!opts.strict, script: !!opts.script,
      storage: U.store.get('preview.storage', {}), highlight: highlightOn() };
    return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      reactModules() + testingScripts(source) +
      '<style id="rlt-base">' + BASE_CSS + '</style>' +
      '<style id="rlt-css">' + String(css || '').replace(/<\/style/gi, '<\\/style') + '</style>' +
      '<script>window.__rlt=' + safe(cfg) + ';(' + bridge.toString() + ')();</' + 'script>' +
      '</head><body><div id="root"></div></body></html>';
  }

  function Preview(container, opts) {
    this.opts = opts || {};
    this.epoch = 0;
    this.isReady = false;
    this.waiters = [];
    this.pending = {};
    this.seq = 0;
    this.last = null;
    this.result = null;
    this.firstError = null;
    this.reactVersion = null;
    this.wrap = U.h('div', { class: 'preview', 'data-state': 'idle' });
    this.msg = U.h('div', { class: 'preview-msg', hidden: true, role: 'status' });
    this.frame = this._makeFrame();
    this.wrap.style.height = (this.opts.height || 220) + 'px';
    this.wrap.appendChild(this.frame);
    this.wrap.appendChild(this.msg);
    if (container) container.appendChild(this.wrap);
    previews = previews.filter(function (p) { return p.wrap.isConnected; });
    previews.push(this);
  }

  Preview.prototype._makeFrame = function () {
    return U.h('iframe', {
      class: 'preview-frame',
      title: this.opts.title || 'Live preview',
      sandbox: 'allow-scripts allow-forms allow-modals'
    });
  };

  Preview.prototype._state = function (s, msg) {
    this.wrap.setAttribute('data-state', s);
    this.msg.hidden = !msg;
    this.msg.innerHTML = '';
    if (msg) this.msg.appendChild(msg);
  };

  /** Finish the current render with this result (once). */
  Preview.prototype._settle = function (epoch, result) {
    if (epoch !== this.epoch) return;
    this.result = result;
    var keep = [];
    this.waiters.forEach(function (w) { if (w.epoch === epoch) w.resolve(result); else keep.push(w); });
    this.waiters = keep;
    if (this.opts.onResult) this.opts.onResult(result);
  };

  /**
   * Compile and run {code, css}. Resolves with {state, error?} (see the top of this file).
   * Running the same code and CSS again resolves at once with the last result, unless {force: true}.
   */
  Preview.prototype.render = function (snippet, options) {
    var self = this;
    var s = { code: snippet.code || '', css: snippet.css || '' };
    var force = options && options.force;
    // the same code again: the run already made, or the one still on its way
    if (!force && this.last && this.last.code === s.code && this.last.css === s.css && this.lastRun) return this.lastRun;
    this.last = s;
    var epoch = ++this.epoch;
    // a run still on its way is replaced by this one: settle it, so nothing waits for it forever
    this.waiters.forEach(function (w) { w.resolve({ state: 'replaced' }); });
    this.waiters = [];
    this.isReady = false;
    this.firstError = null;
    var pend = this.pending;
    this.pending = {};
    Object.keys(pend).forEach(function (k) { pend[k]({ result: null }); });
    this._state('loading', null);
    var done = new Promise(function (resolve) { self.waiters.push({ epoch: epoch, resolve: resolve }); });
    this.lastRun = done;
    U.react.whenReady().then(function (ok) {
      if (epoch !== self.epoch) return;
      if (!ok) { self._unavailable(epoch, U.react.problem); return; }
      var compiled = U.react.compile(s.code, { guardLoops: true });
      if (compiled.error) {
        var e = compiled.error;
        self._state('syntax', U.h('div', null, U.h('b', null, 'Syntax error, line ' + e.line + ': '), e.message,
          U.h('div', { class: 'faint' }, 'The preview runs again as soon as the code compiles.')));
        if (self.opts.onReload) self.opts.onReload();
        if (self.opts.onConsole) self.opts.onConsole({ level: 'error', text: 'SyntaxError: ' + e.message, where: 'line ' + e.line });
        self._settle(epoch, { state: 'syntax', error: e });
        return;
      }
      if (self.opts.onReload) self.opts.onReload();
      var next = self._makeFrame();
      next.srcdoc = buildDoc(s.code, compiled.code, s.css, epoch, self.opts);
      // every run gets a brand-new <iframe>: messages from the old page can no longer reach us
      if (self.frame.parentNode) self.frame.parentNode.replaceChild(next, self.frame);
      else self.wrap.insertBefore(next, self.msg);
      self.frame = next;
    });
    return done;
  };

  Preview.prototype._unavailable = function (epoch, why) {
    this._state('unavailable', U.h('div', null,
      U.h('b', null, 'React could not start in the preview.'),
      U.h('p', null, 'The preview runs React ' + U.react.VERSION + ' from vendor/react and the JSX translator from vendor/babel, both in this folder. ' +
        'If one is missing, run python -I tools/vendor.py. Lessons, quizzes and flashcards still work.'),
      why ? U.h('div', { class: 'faint' }, why) : null));
    this._settle(epoch, { state: 'unavailable', error: { message: why || 'unavailable', line: 0 } });
  };

  Preview.prototype.post = function (msg) {
    try { this.frame.contentWindow.postMessage(msg, '*'); } catch (e) { /* frame not attached */ }
  };

  /** Ask the frame a question; resolves with the answer (or null after ms, 6 s by default, or if the page changes). */
  Preview.prototype.ask = function (q, ms) {
    var self = this;
    if (!this.isReady) return Promise.resolve(null);
    return new Promise(function (resolve, reject) {
      var id = ++self.seq;
      var timer = setTimeout(function () { delete self.pending[id]; resolve(null); }, ms || 6000);
      self.pending[id] = function (d) {
        clearTimeout(timer);
        if (d.error) reject(new Error(d.error)); else resolve(d.result);
      };
      self.post({ rlt: 'ask', id: id, q: q });
    });
  };

  /** Run a challenge's checks in the rendered page: [{ok, got}], one per check. */
  Preview.prototype.runChecks = function (checks) {
    var r = this.result || {};
    if (r.state === 'syntax' || r.state === 'unavailable' || !this.isReady) {
      var why = r.state === 'syntax' ? 'your code did not compile (line ' + r.error.line + ')' : r.state === 'unavailable' ? 'React could not start' : 'the preview is not ready';
      return Promise.resolve(checks.map(function () { return { ok: false, got: why }; }));
    }
    // checks may wait for timers (an autoplay, a debounce, a fetch): give the whole list CHECKS_TIMEOUT
    return this.ask({ type: 'checks', checks: checks }, CHECKS_TIMEOUT).then(function (res) {
      return res || checks.map(function () { return { ok: false, got: 'the preview did not answer' }; });
    }, function (err) {
      return checks.map(function () { return { ok: false, got: String(err.message || err) }; });
    });
  };

  Preview.prototype.setHeight = function (px) { this.wrap.style.height = px + 'px'; };

  Preview.prototype._message = function (d) {
    if (d.epoch !== this.epoch) return; // an older page, finishing late
    if (d.rlt === 'ready') {
      this.isReady = true;
      var bad = d.errored;
      this._state(bad ? 'error' : 'ready', null);
      this._settle(d.epoch, bad ? { state: 'error', error: this.firstError } : { state: 'ready' });
    } else if (d.rlt === 'answer') {
      var cb = this.pending[d.id];
      if (cb) { delete this.pending[d.id]; cb(d); }
    } else if (d.rlt === 'react') {
      this.reactVersion = d.version;
    } else if (d.rlt === 'unavailable') {
      this._unavailable(d.epoch, d.text);
    } else if (d.rlt === 'console') {
      if (this.opts.onConsole) this.opts.onConsole({ level: d.level, text: d.text });
    } else if (d.rlt === 'console-clear') {
      if (this.opts.onConsole) this.opts.onConsole({ level: 'clear' });
    } else if (d.rlt === 'error') {
      var e = { message: d.text, line: d.line || 0 };
      if (!this.firstError) this.firstError = e;
      if (this.opts.onConsole) this.opts.onConsole({ level: 'error', text: d.text, where: d.line ? 'line ' + d.line : '' });
      if (this.opts.onError) this.opts.onError(e);
    } else if (d.rlt === 'storage') {
      U.store.set('preview.storage', d.data);
    } else if (d.rlt === 'renders') {
      if (this.opts.onRenders) this.opts.onRenders(d.counts || {});
    } else if (d.rlt === 'compile') {   // t.testsOf: the preview has no Babel, so the app compiles for it
      var c = U.react.compile(String(d.source || ''), { guardLoops: true });
      this.post({ rlt: 'compiled', id: d.id, code: c.code || null, error: c.error ? 'line ' + c.error.line + ': ' + c.error.message : null });
    }
  };

  Preview.prototype.destroy = function () {
    var self = this;
    previews = previews.filter(function (p) { return p !== self; });
    this.wrap.remove();
  };

  /**
   * What an error or warning means, in plain words, from data/react-errors.js: the first entry whose
   * regex matches the text. Returns {id, says (Markdown), href, label, external} or null.
   */
  U.explainError = function (text) {
    var list = U.data.reactErrors || [];
    for (var i = 0; i < list.length; i++) {
      var e = list[i], m;
      try { m = new RegExp(e.match, 'i').exec(String(text || '')); } catch (x) { continue; }
      if (!m) continue;
      var name = m[1] || '', api = name && U.find('api', name);
      var says = (api && e.apiSays ? e.apiSays : e.says).replace(/\{name\}/g, name).replace(/\{module\}/g, api ? api.module : '');
      return {
        id: e.id, says: says, external: !e.lesson,
        href: e.lesson ? U.linkFor('lesson', e.lesson) : e.docs,
        label: e.lesson ? 'Lesson: ' + ((U.find('lessons', e.lesson) || {}).title || e.lesson) : 'react.dev'
      };
    }
    return null;
  };

  /**
   * A console panel bound to a preview: call panel.add(entry) from the preview's onConsole. An error
   * or warning that React's catalogue knows gets a "What this means" line under it.
   */
  function ConsolePanel(container) {
    var self = this;
    this.count = 0;
    this.list = U.h('div', { class: 'console-list', role: 'log', 'aria-live': 'polite' });
    this.empty = U.h('div', { class: 'console-empty' }, 'console.log() output, React\'s warnings and errors appear here.');
    this.el = U.h('div', { class: 'console' },
      U.h('div', { class: 'console-head' },
        U.h('span', null, 'Console'),
        U.h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: function () { self.clear(); } }, 'Clear')),
      this.list);
    this.list.appendChild(this.empty);
    if (container) container.appendChild(this.el);
  }
  ConsolePanel.prototype.add = function (e) {
    if (e.level === 'clear') { this.clear(); return; }
    if (this.empty.parentNode) this.empty.remove();
    this.count++;
    var why = (e.level === 'error' || e.level === 'warn') ? U.explainError(e.text) : null;
    var row = U.h('div', { class: 'console-row console-' + e.level },
      U.h('span', { class: 'console-icon', 'aria-hidden': 'true' }, { error: '✖', warn: '⚠', info: 'ℹ', log: '›' }[e.level] || '›'),
      U.h('span', { class: 'console-text' }, e.text),
      e.where ? U.h('span', { class: 'console-where' }, e.where) : null,
      why ? U.h('div', { class: 'console-why', 'data-id': why.id },
        U.h('b', null, 'What this means: '), U.h('span', { html: U.mdInline(why.says) }), ' ',
        U.h('a', { href: why.href, target: why.external ? '_blank' : null, rel: why.external ? 'noopener' : null }, why.label + (why.external ? ' ↗' : ' →'))) : null);
    this.list.appendChild(row);
    if (this.count > 300) { this.list.firstChild.remove(); this.count--; }
    this.list.scrollTop = this.list.scrollHeight;
  };
  ConsolePanel.prototype.clear = function () {
    this.list.innerHTML = '';
    this.count = 0;
    this.list.appendChild(this.empty);
  };

  U.preview = {
    create: function (container, opts) { return new Preview(container, opts); },
    console: function (container) { return new ConsolePanel(container); },
    highlighter: highlighter,
    _buildDoc: buildDoc
  };
})(window.RLT);
