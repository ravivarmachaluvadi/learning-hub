/*
 * preview.js - live previews.
 *
 * A preview is an <iframe srcdoc> that runs a snippet {html, css, js}. The frame is sandboxed (no
 * same-origin access), so the app talks to it only through postMessage. A small "bridge" script,
 * injected at the top of every preview document, does the frame-side work:
 *
 *   - forwards console.log / errors to the app (shown in console panels);
 *   - answers questions: computed styles, element boxes, DOM tree, selector matches, lesson checks,
 *     and the layout of chosen elements (to compare a "Recreate this" attempt with its target);
 *   - keeps links and form submits from navigating the preview away (it logs what would happen);
 *   - offers a pretend backend for fetch('/api/...') so the fetch lesson works offline;
 *   - stands in for localStorage (sandboxed frames may not use the real one);
 *   - stops runaway loops (`while (true)`) before they freeze the whole tab.
 *
 * Usage:
 *   var p = UILT.preview.create(container, {height: 240, onConsole: fn});
 *   p.render({html, css, js}).then(...);      // resolves once the frame has drawn it
 *   p.ask({type: 'computed', sel: '.box', props: ['display']}).then(...);
 *
 * Creating a preview forgets every earlier preview that is not in the page (that is how previews
 * of a screen you left are dropped). So when a screen shows several previews, put each one in the
 * page before creating the next - or none but the last will ever report "ready".
 */
(function (U) {
  'use strict';

  /* ===================================================================================
   * The bridge. This function is never called in the app window: its source text is
   * copied into each preview document. Keep it self-contained.
   * =================================================================================== */
  function bridge() {
    var cfg = window.__uilt || {};
    var parentWin = window.parent;
    var nativeConsole = {};

    function send(msg) {
      if (msg.epoch === undefined) msg.epoch = cfg.epoch;
      try { parentWin.postMessage(msg, '*'); } catch (e) { /* app window gone */ }
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
      if (typeof Event !== 'undefined' && v instanceof Event) {
        return v.constructor.name + ' {type: "' + v.type + '"' + (v.target && v.target.tagName ? ', target: ' + describeEl(v.target) : '') + '}';
      }
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

    ['log', 'info', 'warn', 'error', 'debug', 'table', 'dir'].forEach(function (lv) {
      nativeConsole[lv] = (console[lv] || console.log).bind(console);
      console[lv] = function () {
        var args = Array.prototype.slice.call(arguments);
        var level = (lv === 'warn' || lv === 'error' || lv === 'info') ? lv : 'log';
        send({ uilt: 'console', level: level, text: args.map(function (a) { return fmt(a, 0, false); }).join(' ') });
        nativeConsole[lv].apply(null, args);
      };
    });
    console.clear = function () { send({ uilt: 'console-clear' }); };

    /* ---------- errors ---------- */
    window.addEventListener('error', function (e) {
      var t = e.target;
      if (t && t !== window && t.tagName) {
        var what = t.getAttribute('src') || t.getAttribute('href') || t.tagName.toLowerCase();
        if (what.length > 80) what = what.slice(0, 77) + '…';
        send({ uilt: 'console', level: 'warn', text: 'Could not load ' + what + ' (' + describeEl(t) + ')' });
        return;
      }
      send({ uilt: 'error', text: e.message || 'Error', line: e.lineno || 0, col: e.colno || 0 });
    }, true);
    window.addEventListener('unhandledrejection', function (e) {
      send({ uilt: 'error', text: 'Uncaught (in promise) ' + fmt(e.reason, 0, false), line: 0 });
    });

    /* ---------- runaway-loop guard (the app inserts calls to it into loop bodies) ---------- */
    var loopCounts = {}, loopStarts = {}, loopResetQueued = false;
    window.__uiltLoop = function (id, line) {
      if (!loopResetQueued) {
        loopResetQueued = true;
        setTimeout(function () { loopCounts = {}; loopStarts = {}; loopResetQueued = false; }, 0);
      }
      var c = loopCounts[id] = (loopCounts[id] || 0) + 1;
      if (c === 1) loopStarts[id] = Date.now();
      else if (c % 1000 === 0 && Date.now() - loopStarts[id] > 1500) {
        send({ uilt: 'error', text: 'Stopped a loop that kept running for 1.5 seconds - it is probably infinite. Check its condition.', jsLine: line });
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
        : /^tel:/i.test(href) ? 'would offer to call the number'
        : a.target === '_blank' ? 'would open in a new tab'
        : 'would replace this page';
      send({ uilt: 'console', level: 'info', text: 'Link clicked: ' + href + ' - ' + how + '. (The preview does not follow links.)' });
    });
    document.addEventListener('submit', function (e) {
      var f = e.target, pairs = [];
      var dialogSubmit = (f.getAttribute('method') || '').toLowerCase() === 'dialog' ||
        (e.submitter && (e.submitter.getAttribute('formmethod') || '').toLowerCase() === 'dialog');
      if (e.defaultPrevented || dialogSubmit) return; // method="dialog" just closes its <dialog>: let it
      e.preventDefault();
      e.uiltBlocked = true; // lets lesson checks tell the learner's preventDefault() from this one
      try {
        new FormData(f, e.submitter).forEach(function (v, k) {
          pairs.push(k + '=' + (typeof v === 'string' ? v : (v.name || 'file')));
        });
      } catch (x) { /* very old browser */ }
      var method = (f.getAttribute('method') || 'get').toUpperCase();
      send({ uilt: 'console', level: 'info', text: 'Form submitted: ' + method + ' ' + (f.getAttribute('action') || '(this page)') +
        ' with ' + (pairs.length ? pairs.join('&') : 'no named fields - give inputs a name attribute') + '. (The preview does not send it.)' });
    });

    /* ---------- localStorage stand-in (persisted by the app between renders) ---------- */
    (function () {
      var works = false;
      try { works = !!window.localStorage && (window.localStorage.setItem('__t', '1'), window.localStorage.removeItem('__t'), true); } catch (e) { works = false; }
      if (works) return;
      function makeStore(initial, persist) {
        var data = initial || {};
        function save() { if (persist) send({ uilt: 'storage', data: data }); }
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

    /* ---------- pretend backend: fetch('/api/...') ---------- */
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
        { id: 3, title: 'Learn JavaScript', done: false }
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
      send({ uilt: 'console', level: 'info', text: '→ ' + method + ' /api/' + m[1] + (m[2] ? '?' + m[2] : '') + (init.body ? '  body: ' + init.body : '') + '   (pretend server)' });
      var contentType = headerOf(init.headers, 'content-type') || (typeof init.body === 'string' ? 'text/plain;charset=UTF-8' : '');
      return route(method, m[1].replace(/\/$/, ''), query, body, contentType).then(function (res) {
        send({ uilt: 'console', level: 'info', text: '← ' + res.status + ' ' + res.statusText + '   ' + method + ' /api/' + m[1] });
        return res;
      });
    };

    /* ---------- answering questions from the app ---------- */
    function q1(sel) { return document.querySelector(sel); }
    function qa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
    function cs(el, prop, pseudo) { return getComputedStyle(el, pseudo || null).getPropertyValue(prop).trim(); }
    function box(el) {
      var r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    }
    function pathOf(node) {
      var path = [];
      while (node && node !== document.documentElement) {
        var p = node.parentNode;
        if (!p) break;
        path.unshift(Array.prototype.indexOf.call(p.childNodes, node));
        node = p;
      }
      return path;
    }
    function nodeAt(path) {
      var n = document.documentElement;
      for (var i = 0; i < path.length && n; i++) n = n.childNodes[path[i]];
      return n;
    }
    function isBridgeNode(n) {
      return n.nodeType === 1 && ((n.id && n.id.indexOf('uilt-') === 0) ||
        (n.tagName === 'SCRIPT' && n.textContent.indexOf('__uilt') >= 0));
    }
    function serialize(node, depth) {
      if (depth > 40) return null;
      if (node.nodeType === 3) {
        var t = node.textContent.replace(/\s+/g, ' ').trim();
        return t ? { type: 'text', text: t.length > 80 ? t.slice(0, 77) + '…' : t, path: pathOf(node) } : null;
      }
      if (node.nodeType === 8) return { type: 'comment', text: node.textContent.trim().slice(0, 80), path: pathOf(node) };
      if (node.nodeType !== 1 || isBridgeNode(node)) return null;
      var attrs = [];
      for (var i = 0; i < node.attributes.length; i++) {
        var a = node.attributes[i];
        if (a.name === 'data-uilt-hl') continue;
        attrs.push({ name: a.name, value: a.value.length > 60 ? a.value.slice(0, 57) + '…' : a.value });
      }
      var kids = [];
      Array.prototype.forEach.call(node.childNodes, function (c) { var s = serialize(c, depth + 1); if (s) kids.push(s); });
      return { type: 'el', tag: node.tagName.toLowerCase(), attrs: attrs, path: pathOf(node), children: kids };
    }
    function ensureHighlightStyle() {
      if (document.getElementById('uilt-hl-style')) return;
      var st = document.createElement('style');
      st.id = 'uilt-hl-style';
      st.textContent = '[data-uilt-hl]{outline:3px solid #ff5a1f !important;outline-offset:2px !important;' +
        'box-shadow:0 0 0 9999px rgba(255,170,0,0) !important;background-image:linear-gradient(rgba(255,170,0,.22),rgba(255,170,0,.22)) !important}';
      (document.head || document.documentElement).appendChild(st);
    }
    function clearHighlight() { qa('[data-uilt-hl]').forEach(function (el) { el.removeAttribute('data-uilt-hl'); }); }

    function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }
    function compare(got, c) {
      if (c.equals !== undefined) return String(got) === String(c.equals);
      if (c.oneOf) return c.oneOf.map(String).indexOf(String(got)) >= 0;
      if (c.not !== undefined) return String(got) !== String(c.not);
      if (c.notIn) return c.notIn.map(String).indexOf(String(got)) < 0;
      if (c.match) return new RegExp(c.match, 'i').test(String(got));
      if (c.includes !== undefined) return String(got).toLowerCase().indexOf(String(c.includes).toLowerCase()) >= 0;
      var n = num(got);
      if (c.min !== undefined && (n === null || n < c.min)) return false;
      if (c.max !== undefined && (n === null || n > c.max)) return false;
      return true;
    }
    var helpers = {
      $: q1, $$: qa, cs: function (sel, prop, pseudo) { var el = q1(sel); return el ? cs(el, prop, pseudo) : null; },
      box: function (sel) { var el = q1(sel); return el ? box(el) : null; },
      wait: function (ms) { return new Promise(function (r) { setTimeout(r, ms || 0); }); },
      click: function (sel) { var el = typeof sel === 'string' ? q1(sel) : sel; if (!el) throw new Error('Nothing matches ' + sel); el.click(); },
      type: function (sel, value) {
        var el = typeof sel === 'string' ? q1(sel) : sel;
        if (!el) throw new Error('Nothing matches ' + sel);
        el.focus(); el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      },
      key: function (sel, key) {
        var el = typeof sel === 'string' ? q1(sel) : sel;
        ['keydown', 'keyup'].forEach(function (t) { el.dispatchEvent(new KeyboardEvent(t, { key: key, bubbles: true })); });
      },
      submit: function (sel) { var f = q1(sel); if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }
    };

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
        if (c.computed) {
          var els = c.every ? qa(c.computed) : [q1(c.computed)].filter(Boolean);
          if (!els.length) return Promise.resolve({ ok: false, got: 'nothing matches ' + c.computed });
          var bad = null, val = '';
          els.forEach(function (el) { val = cs(el, c.prop, c.pseudo); if (!bad && !compare(val, c)) bad = val; });
          return Promise.resolve(bad === null ? { ok: true, got: c.prop + ': ' + val } : { ok: false, got: c.prop + ' is ' + (bad || '(empty)') });
        }
        if (c.attr) {
          var ae = q1(c.attr);
          if (!ae) return Promise.resolve({ ok: false, got: 'nothing matches ' + c.attr });
          if (!ae.hasAttribute(c.name)) return Promise.resolve({ ok: false, got: 'no ' + c.name + ' attribute' });
          var av = ae.getAttribute(c.name);
          return Promise.resolve({ ok: c.present ? true : compare(av, c), got: c.name + '="' + av + '"' });
        }
        if (c.text) {
          var te = q1(c.text);
          if (!te) return Promise.resolve({ ok: false, got: 'nothing matches ' + c.text });
          var tv = te.textContent.replace(/\s+/g, ' ').trim();
          return Promise.resolve({ ok: compare(tv, c), got: '"' + (tv.length > 60 ? tv.slice(0, 57) + '…' : tv) + '"' });
        }
        if (c.prop) {
          var pe = q1(c.sel);
          if (!pe) return Promise.resolve({ ok: false, got: 'nothing matches ' + c.sel });
          var pv = pe[c.prop];
          return Promise.resolve({ ok: compare(pv, c), got: c.prop + ' = ' + pv });
        }
        if (c.centered) {
          var inner = q1(c.centered), outer = q1(c.within);
          if (!inner || !outer) return Promise.resolve({ ok: false, got: 'nothing matches ' + (inner ? c.within : c.centered) });
          var bi = box(inner), bo = box(outer), tol = c.tolerance || 2;
          var dx = Math.abs((bi.left - bo.left) - (bo.right - bi.right));
          var dy = Math.abs((bi.top - bo.top) - (bo.bottom - bi.bottom));
          var okx = c.axis === 'y' || dx <= tol * 2, oky = c.axis === 'x' || dy <= tol * 2;
          return Promise.resolve({ ok: okx && oky, got: 'off-centre by ' + Math.round(dx / 2) + 'px horizontally, ' + Math.round(dy / 2) + 'px vertically' });
        }
        if (c.rect) {
          var re = q1(c.rect);
          if (!re) return Promise.resolve({ ok: false, got: 'nothing matches ' + c.rect });
          var rv = box(re)[c.side || 'width'];
          return Promise.resolve({ ok: compare(rv, c), got: (c.side || 'width') + ' is ' + Math.round(rv * 10) / 10 + 'px' });
        }
        if (c.any) {
          return Promise.all(c.any.map(runCheck)).then(function (rs) {
            var hit = rs.filter(function (r) { return r.ok; })[0];
            return hit || { ok: false, got: rs.map(function (r) { return r.got; }).filter(Boolean).join('; ') };
          });
        }
        return Promise.resolve({ ok: false, got: 'unknown check type' });
      } catch (err) {
        return Promise.resolve({ ok: false, got: 'Error: ' + (err && err.message || err) });
      }
    }

    function answer(q) {
      switch (q.type) {
        case 'computed': {
          var el = q1(q.sel);
          if (!el) return { found: false };
          var out = {};
          (q.props || []).forEach(function (p) { out[p] = cs(el, p, q.pseudo); });
          return { found: true, values: out };
        }
        case 'computedAll':
          return qa(q.sel).map(function (el) { return { label: describeEl(el), text: el.textContent.trim().slice(0, 40), value: cs(el, q.prop) }; });
        case 'rect': {
          if (q.all) return qa(q.sel).map(box);
          var re = q1(q.sel);
          return re ? box(re) : null;
        }
        case 'count': return qa(q.sel).length;
        case 'match': {
          clearHighlight();
          var list;
          try { list = qa(q.sel); } catch (err) { return { error: 'Not a valid selector' }; }
          ensureHighlightStyle();
          list.forEach(function (n) { n.setAttribute('data-uilt-hl', ''); });
          return { count: list.length, items: list.map(function (n) { return { label: describeEl(n), path: pathOf(n) }; }) };
        }
        case 'tree': return serialize(document.documentElement, 0);
        case 'highlight': {
          clearHighlight();
          if (!q.path) return true;
          var n = nodeAt(q.path);
          if (n && n.nodeType !== 1) n = n.parentNode;
          if (n && n.nodeType === 1 && n !== document.documentElement) {
            ensureHighlightStyle();
            n.setAttribute('data-uilt-hl', '');
            if (n.scrollIntoView) n.scrollIntoView({ block: 'nearest' });
          }
          return true;
        }
        case 'checks': {
          var results = [];
          return (q.checks || []).reduce(function (p, c) {
            return p.then(function () { return runCheck(c).then(function (r) { results.push(r); }); });
          }, Promise.resolve()).then(function () { return results; });
        }
        case 'eval': {
          var f = (0, eval)('(' + q.code + ')');
          return typeof f === 'function' ? f(document, window, helpers) : f;
        }
        case 'size':
          return { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight };
        case 'layout':
          // "Recreate this": where each element sits and how it looks, to compare two pages
          return (q.items || []).map(function (it) {
            var found;
            try { found = qa(it.sel); } catch (e) { return { invalid: true, els: [] }; }
            return { els: found.slice(0, 40).map(function (el) {
              var r = el.getBoundingClientRect(), st = getComputedStyle(el), props = {};
              (it.props || []).forEach(function (p) { props[p] = st.getPropertyValue(p.replace(/\?$/, '')).trim(); });
              return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, props: props };
            }) };
          });
        case 'lint':
          return lint(q.rules || [], q.conditions || []);
        case 'selectors':
          // the JavaScript warnings: how many elements each querySelector / getElementById call finds
          return (q.items || []).map(function (it) {
            var r = { count: 0 };
            try {
              if (it.how === 'id') r.count = document.getElementById(it.arg) ? 1 : 0;
              else if (it.how === 'class') r.count = document.getElementsByClassName(it.arg).length;
              else if (it.how === 'tag') r.count = document.getElementsByTagName(it.arg).length;
              else r.count = qa(it.arg).length;
            } catch (e) { r.invalid = true; return r; }
            if (!r.count && /^[A-Za-z][\w-]*$/.test(it.arg)) {
              r.asClass = document.getElementsByClassName(it.arg).length;
              r.asId = !!document.getElementById(it.arg);
            }
            return r;
          });
        default:
          return null;
      }
    }

    /* ---------- "why doesn't this work?": check property conditions on the matched elements ---------- */
    var FLEX = /^(inline-)?flex$/, GRID = /^(inline-)?grid$/;
    var REPLACED = /^(IMG|INPUT|SELECT|TEXTAREA|BUTTON|VIDEO|AUDIO|CANVAS|IFRAME|SVG|EMBED|OBJECT|PROGRESS|METER)$/i;
    function conditionOk(needs, el, decl) {
      var disp = cs(el, 'display'), pos = cs(el, 'position');
      var par = el.parentElement, pdisp = par ? cs(par, 'display') : 'block';
      switch (needs) {
        case 'not-inline': return disp !== 'inline' || REPLACED.test(el.tagName);
        case 'flex': return FLEX.test(disp);
        case 'flex-or-grid': return FLEX.test(disp) || GRID.test(disp);
        case 'grid': return GRID.test(disp);
        case 'parent-flex': return FLEX.test(pdisp);
        case 'parent-flex-or-grid': return FLEX.test(pdisp) || GRID.test(pdisp);
        case 'parent-grid': return GRID.test(pdisp);
        case 'positioned': return pos !== 'static';
        case 'positioned-or-item': return pos !== 'static' || FLEX.test(pdisp) || GRID.test(pdisp);
        case 'overflow-nowrap':
          if (!/ellipsis/i.test(decl.value || '')) return true;
          return cs(el, 'overflow-x') !== 'visible' && /^(nowrap|pre)$/.test(cs(el, 'white-space'));
        case 'inline-or-cell': return /^(inline|inline-block|table-cell|inline-flex|inline-grid|inline-table)$/.test(disp);
        case 'not-flex-item': return !(FLEX.test(pdisp) || GRID.test(pdisp));
        default: return true;
      }
    }
    function lint(rules, conditions) {
      var byProp = {};
      conditions.forEach(function (c) { c.props.forEach(function (p) { byProp[p] = c; }); });
      return rules.map(function (r) {
        var els;
        try { els = qa(r.sel); } catch (e) { return { invalid: true, warnings: [] }; }
        if (!els.length) return { nothing: true, warnings: [] };
        var warnings = [];
        if (!r.pseudoElement) {
          r.decls.forEach(function (d, j) {
            var c = byProp[d.prop];
            if (!c) return;
            var failing = null;
            var allFail = els.every(function (el) {
              var ok = conditionOk(c.needs, el, d);
              if (!ok && !failing) failing = el;
              return !ok;
            });
            if (!allFail || !failing) return;
            var par = failing.parentElement;
            warnings.push({
              decl: j,
              msg: c.msg.replace(/\{prop\}/g, d.prop).replace(/\{tag\}/g, failing.tagName.toLowerCase())
                .replace(/\{display\}/g, cs(failing, 'display')).replace(/\{position\}/g, cs(failing, 'position'))
                .replace(/\{parentDisplay\}/g, par ? cs(par, 'display') : 'block')
            });
          });
        }
        return { count: els.length, warnings: warnings };
      });
    }

    /* ---------- Inspect mode: outline what is under the mouse, report what gets clicked ---------- */
    var inspecting = false;
    function matchable(sel) {
      return sel.replace(/::?(before|after|first-line|first-letter|placeholder|marker|selection|backdrop|file-selector-button)(?![\w-])/gi, '')
        .replace(/:(hover|focus-within|focus-visible|focus|active|visited|target)(?![\w-])/gi, '').trim() || '*';
    }
    function splitSelectors(s) {
      var out = [], depth = 0, st = 0;
      for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        if (ch === '(' || ch === '[') depth++;
        else if (ch === ')' || ch === ']') depth--;
        else if (ch === ',' && depth === 0) { out.push(s.slice(st, i).trim()); st = i + 1; }
      }
      out.push(s.slice(st).trim());
      return out.filter(Boolean);
    }
    function describeForInspect(el) {
      var c = getComputedStyle(el);
      function four(pattern) {
        return ['top', 'right', 'bottom', 'left'].map(function (s) { return Math.round(parseFloat(c.getPropertyValue(pattern.replace('*', s))) || 0); });
      }
      var r = el.getBoundingClientRect();
      var pad = four('padding-*'), bor = four('border-*-width');
      var rules = [];
      function walk(list, media) {
        Array.prototype.forEach.call(list, function (rule) {
          if (rule.selectorText) {
            var hit = splitSelectors(rule.selectorText).filter(function (s) { try { return el.matches(matchable(s)); } catch (e) { return false; } });
            if (hit.length) rules.push({ selector: rule.selectorText, matched: hit, media: media });
          } else if (rule.cssRules && !rule.name) {
            walk(rule.cssRules, rule.media ? rule.media.mediaText : media);
          }
        });
      }
      var own = document.getElementById('uilt-css');
      try { if (own && own.sheet) walk(own.sheet.cssRules, null); } catch (e) { /* unreadable sheet */ }
      return {
        tag: el.tagName.toLowerCase(), id: el.id || '', classes: Array.prototype.slice.call(el.classList),
        index: Array.prototype.indexOf.call(document.querySelectorAll(el.tagName), el),
        display: c.display, position: c.position,
        margin: four('margin-*'), border: bor, padding: pad,
        width: Math.round(r.width), height: Math.round(r.height),
        contentWidth: Math.max(0, Math.round(r.width - pad[1] - pad[3] - bor[1] - bor[3])),
        contentHeight: Math.max(0, Math.round(r.height - pad[0] - pad[2] - bor[0] - bor[2])),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        rules: rules
      };
    }
    function setInspect(on) {
      inspecting = !!on;
      document.documentElement.style.cursor = inspecting ? 'crosshair' : '';
      if (!inspecting) clearHighlight();
    }
    document.addEventListener('mouseover', function (e) {
      if (!inspecting || !e.target || !e.target.setAttribute || e.target === document.documentElement) return;
      ensureHighlightStyle();
      clearHighlight();
      e.target.setAttribute('data-uilt-hl', '');
    }, true);
    document.addEventListener('click', function (e) {
      if (!inspecting) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      var el = e.target && e.target.nodeType === 1 ? e.target : document.body;
      setInspect(false);
      send({ uilt: 'picked', info: describeForInspect(el) });
    }, true);
    document.addEventListener('keydown', function (e) {
      if (inspecting && e.key === 'Escape') { setInspect(false); send({ uilt: 'picked', info: null }); }
    }, true);

    window.addEventListener('message', function (ev) {
      var d = ev.data;
      if (!d || !d.uilt || ev.source !== parentWin) return;
      if (d.uilt === 'inspect') { setInspect(d.on); return; }
      if (d.uilt === 'patch') {
        var st = document.getElementById('uilt-css');
        if (st) st.textContent = d.css;
        if (document.body) document.body.innerHTML = d.html;
        window.dispatchEvent(new Event('uilt:patched'));
        send({ uilt: 'patched', epoch: d.epoch });
      } else if (d.uilt === 'ask') {
        var reply = function () {
          Promise.resolve().then(function () { return answer(d.q || {}); }).then(function (r) {
            send({ uilt: 'answer', id: d.id, result: r });
          }, function (err) {
            send({ uilt: 'answer', id: d.id, error: String(err && err.message || err) });
          });
        };
        // never measure a half-loaded page: wait until it (and its images) have loaded and been laid out
        if (document.readyState === 'complete') whenLaidOut(reply);
        else window.addEventListener('load', function () { whenLaidOut(reply); }, { once: true });
      }
    });

    /*
     * A brand-new preview can report readyState "complete" a few milliseconds before the browser has
     * given its <iframe> a size and laid it out: the window is then 0 x 0 and every element measures
     * 0 x 0 (seen in the tests: a page 11 ms old, window 0 x 0). So "ready" means: loaded, the window
     * has a size, AND the root element has a width. A preview that is really hidden (display: none)
     * never gets a size; after about a second it is reported ready anyway.
     */
    function whenLaidOut(cb, tries) {
      tries = tries || 0;
      var laidOut = innerWidth > 0 && document.documentElement.getBoundingClientRect().width > 0;
      if (laidOut || tries > 60) { cb(); return; }
      setTimeout(function () { whenLaidOut(cb, tries + 1); }, 15);
    }

    window.addEventListener('load', function () { whenLaidOut(function () { send({ uilt: 'ready' }); }); });
  }

  /* ===================================================================================
   * App side
   * =================================================================================== */

  var previews = [];

  window.addEventListener('message', function (ev) {
    var d = ev.data;
    if (!d || typeof d !== 'object' || !d.uilt) return;
    for (var i = 0; i < previews.length; i++) {
      if (previews[i].frame.contentWindow === ev.source) { previews[i]._message(d); return; }
    }
  });

  function lineCount(s) { var n = 0; for (var i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++; return n; }

  var FULL_DOC = /<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i;

  /**
   * Insert a runaway-loop guard as the first statement of every braced for / while / do body:
   *   for (...) {  ->  for (...) {if(window.__uiltLoop(3,12))break;
   * Strings, template literals and comments are skipped. Loops without braces are left alone.
   */
  U.guardLoops = function (js) {
    var out = '', i = 0, n = js.length, id = 0, line = 1;
    function startsWord(w) {
      return js.substr(i, w.length) === w && !/[\w$]/.test(js.charAt(i - 1) || ' ') && !/[\w$]/.test(js.charAt(i + w.length) || ' ');
    }
    while (i < n) {
      var ch = js.charAt(i);
      if (ch === '\n') { line++; out += ch; i++; continue; }
      if (ch === '/' && js.charAt(i + 1) === '/') { var e1 = js.indexOf('\n', i); e1 = e1 < 0 ? n : e1; out += js.slice(i, e1); i = e1; continue; }
      if (ch === '/' && js.charAt(i + 1) === '*') { var e2 = js.indexOf('*/', i + 2); e2 = e2 < 0 ? n : e2 + 2; var c = js.slice(i, e2); line += lineCount(c); out += c; i = e2; continue; }
      if (ch === '"' || ch === "'" || ch === '`') {
        var j = i + 1;
        while (j < n && js.charAt(j) !== ch) { if (js.charAt(j) === '\\') j++; j++; }
        var s = js.slice(i, j + 1); line += lineCount(s); out += s; i = j + 1; continue;
      }
      if (startsWord('for') || startsWord('while')) {
        var kw = startsWord('for') ? 'for' : 'while';
        var k = i + kw.length;
        while (k < n && /\s/.test(js.charAt(k))) k++;
        if (js.charAt(k) === '(') {
          var depth = 0, m = k;
          for (; m < n; m++) {
            var cm = js.charAt(m);
            if (cm === '(') depth++;
            else if (cm === ')') { depth--; if (depth === 0) break; }
          }
          var after = m + 1;
          while (after < n && /\s/.test(js.charAt(after))) after++;
          if (js.charAt(after) === '{') {
            var head = js.slice(i, after + 1);
            out += head + 'if(window.__uiltLoop(' + (id++) + ',' + line + '))break;';
            line += lineCount(head);
            i = after + 1;
            continue;
          }
        }
      }
      if (startsWord('do')) {
        var d2 = i + 2;
        while (d2 < n && /\s/.test(js.charAt(d2))) d2++;
        if (js.charAt(d2) === '{') {
          var head2 = js.slice(i, d2 + 1);
          out += head2 + 'if(window.__uiltLoop(' + (id++) + ',' + line + '))break;';
          line += lineCount(head2);
          i = d2 + 1;
          continue;
        }
      }
      out += ch; i++;
    }
    return out;
  };

  /** Build the srcdoc text for a snippet. Returns {doc, map} where map converts error lines. */
  function buildDoc(s, opts, epoch) {
    var cfg = { epoch: epoch, storage: U.store.get('preview.storage', {}) };
    var bridgeTag = '<script>window.__uilt=' + JSON.stringify(cfg).replace(/</g, '\\u003c') + ';(' + bridge.toString() + ')();</' + 'script>';
    var css = U.fillMedia(s.css);
    var html = U.fillMedia(s.html);
    var js = s.js ? U.fillMedia(opts.loopGuard === false ? s.js : U.guardLoops(s.js)).replace(/<\/script/gi, '<\\/script') : '';
    var inject = bridgeTag +
      (opts.baseCss ? '<style id="uilt-base">' + opts.baseCss + '</style>' : '') +
      '<style id="uilt-css">' + css + '</style>' + (s.head || '');
    var jsTag = js ? '<script>\n' + js + '\n</' + 'script>' : '';
    var doc, map = { htmlStart: 1, injectAt: -1, injectLines: 0, jsStart: -1, jsLines: lineCount(s.js || '') + 1 };

    if (FULL_DOC.test(s.html)) {
      var at = -1, m;
      if ((m = /<head[^>]*>/i.exec(html))) at = m.index + m[0].length;
      else if ((m = /<html[^>]*>/i.exec(html))) at = m.index + m[0].length;
      else if ((m = /<!doctype[^>]*>/i.exec(html))) at = m.index + m[0].length;
      var before = at >= 0 ? html.slice(0, at) : '<!doctype html>';
      var after = at >= 0 ? html.slice(at) : html;
      if (at < 0) map.htmlStart = 1; // the doctype we added sits on line 1 with the injection
      map.injectAt = lineCount(before) + 1;
      map.injectLines = lineCount(inject);
      if (jsTag) {
        var bi = after.search(/<\/body>/i);
        if (bi < 0) bi = after.search(/<\/html>/i);
        if (bi < 0) bi = after.length;
        var pre = before + inject + after.slice(0, bi);
        map.jsStart = lineCount(pre) + 2;
        doc = pre + jsTag + after.slice(bi);
      } else doc = before + inject + after;
    } else {
      var head = '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' + inject + '</head><body>';
      map.htmlStart = lineCount(head) + 1;
      var body = head + html + '\n';
      map.jsStart = jsTag ? lineCount(body) + 2 : -1;
      doc = body + jsTag + '</body></html>';
    }
    return { doc: doc, map: map };
  }

  /** Convert a document line number from an error into "JS line 3" / "HTML line 12". */
  function whereIs(line, map) {
    if (!line) return '';
    if (map.jsStart > 0 && line >= map.jsStart && line < map.jsStart + map.jsLines) return 'JS line ' + (line - map.jsStart + 1);
    if (map.injectAt > 0) {
      if (line < map.injectAt) return 'HTML line ' + line;
      if (line <= map.injectAt + map.injectLines) return '';
      return 'HTML line ' + (line - map.injectLines);
    }
    var l = line - map.htmlStart + 1;
    return l > 0 ? 'HTML line ' + l : '';
  }

  function Preview(container, opts) {
    this.opts = opts || {};
    this.epoch = 0;
    this.loadedEpoch = -1;
    this.isReady = false;
    this.waiters = [];
    this.pending = {};
    this.seq = 0;
    this.last = null;
    this.map = {};
    this.wrap = U.h('div', { class: 'preview' + (this.opts.className ? ' ' + this.opts.className : '') });
    this.frame = this._makeFrame();
    this.wrap.style.height = (this.opts.height || 220) + 'px';
    this.wrap.appendChild(this.frame);
    if (container) container.appendChild(this.wrap);
    previews = previews.filter(function (p) { return p.wrap.isConnected; });
    previews.push(this);
  }

  Preview.prototype._makeFrame = function () {
    return U.h('iframe', {
      class: 'preview-frame',
      title: this.opts.title || 'Live preview',
      sandbox: 'allow-scripts allow-forms allow-modals allow-popups',
      loading: this.opts.lazy ? 'lazy' : null
    });
  };

  Preview.prototype.render = function (snippet, options) {
    var s = { html: snippet.html || '', css: snippet.css || '', js: snippet.js || '', head: snippet.head || '' };
    var force = options && options.force;
    var self = this;
    var noScripts = !s.js && !/<script/i.test(s.html) && !FULL_DOC.test(s.html);
    // a patch swaps the body without re-running scripts, which would drop every listener they added
    var canPatch = !force && this.isReady && this.last && this.last.js === s.js && this.last.head === s.head &&
      noScripts && !/<script/i.test(this.last.html) && !FULL_DOC.test(this.last.html) && !this.opts.alwaysReload;
    var same = !force && this.last && this.last.html === s.html && this.last.css === s.css &&
      this.last.js === s.js && this.last.head === s.head;
    this.last = s;
    if (same) {
      if (this.isReady) return Promise.resolve();
      var cur = this.epoch;
      return new Promise(function (resolve) { self.waiters.push({ epoch: cur, resolve: resolve }); });
    }
    var epoch = ++this.epoch;
    var done = new Promise(function (resolve) { self.waiters.push({ epoch: epoch, resolve: resolve }); });
    if (canPatch) {
      this.post({ uilt: 'patch', epoch: epoch, html: U.fillMedia(s.html), css: U.fillMedia(s.css) });
    } else {
      this.isReady = false;
      // questions sent to the old page will never be answered: settle them now (as "no answer")
      var pend = this.pending;
      this.pending = {};
      Object.keys(pend).forEach(function (k) { pend[k]({ result: null }); });
      if (this.opts.onReload) this.opts.onReload();
      var built = buildDoc(s, this.opts, epoch);
      this.map = built.map;
      /*
       * Every full reload gets a brand-new <iframe> instead of a new srcdoc in the old one. In the
       * test runs, a reused frame occasionally kept a page that the browser never laid out (every
       * element measured 0 x 0 for seconds), which made correct lesson answers fail. A fresh element
       * starts clean - and messages from the old page can no longer reach us at all.
       */
      var next = this._makeFrame();
      next.srcdoc = built.doc;
      if (this.frame.parentNode) this.frame.parentNode.replaceChild(next, this.frame);
      else this.wrap.appendChild(next);
      this.frame = next;
    }
    return done;
  };

  Preview.prototype.post = function (msg) {
    try { this.frame.contentWindow.postMessage(msg, '*'); } catch (e) { /* frame not attached */ }
  };

  Preview.prototype.whenReady = function () {
    var self = this;
    if (this.isReady) return Promise.resolve();
    return new Promise(function (resolve) { self.waiters.push({ epoch: -1, resolve: resolve }); });
  };

  /** Ask the frame a question; resolves with the answer (or null after 4 s). */
  Preview.prototype.ask = function (q) {
    var self = this;
    return this.whenReady().then(function () {
      return new Promise(function (resolve, reject) {
        var id = ++self.seq;
        var timer = setTimeout(function () { delete self.pending[id]; resolve(null); }, 4000);
        self.pending[id] = function (d) {
          clearTimeout(timer);
          if (d.error) reject(new Error(d.error)); else resolve(d.result);
        };
        self.post({ uilt: 'ask', id: id, q: q });
      });
    });
  };

  Preview.prototype.setWidth = function (px) {
    this.wrap.style.width = px ? px + 'px' : '';
    this.wrap.classList.toggle('preview-sized', !!px);
  };

  Preview.prototype.setHeight = function (px) { this.wrap.style.height = px + 'px'; };

  /** Inspect mode: the next click inside the preview is reported through opts.onPicked(info). */
  Preview.prototype.inspect = function (on) {
    var self = this;
    this.whenReady().then(function () { self.post({ uilt: 'inspect', on: !!on }); });
  };

  Preview.prototype._message = function (d) {
    var self = this;
    if (d.uilt === 'ready' || d.uilt === 'patched') {
      if (d.epoch !== this.epoch) return; // an older render finishing late
      this.isReady = true;
      var keep = [];
      this.waiters.forEach(function (w) {
        if (w.epoch === -1 || w.epoch <= self.epoch) w.resolve(); else keep.push(w);
      });
      this.waiters = keep;
      if (this.opts.onReady) this.opts.onReady(d.uilt);
    } else if (d.uilt === 'answer') {
      var cb = this.pending[d.id];
      if (cb) { delete this.pending[d.id]; cb(d); }
    } else if (d.uilt === 'console') {
      if (this.opts.onConsole) this.opts.onConsole({ level: d.level, text: d.text });
    } else if (d.uilt === 'console-clear') {
      if (this.opts.onConsole) this.opts.onConsole({ level: 'clear' });
    } else if (d.uilt === 'error') {
      var where = d.jsLine ? 'JS line ' + d.jsLine : whereIs(d.line, this.map);
      if (this.opts.onConsole) this.opts.onConsole({ level: 'error', text: d.text, where: where });
    } else if (d.uilt === 'storage') {
      U.store.set('preview.storage', d.data);
    } else if (d.uilt === 'picked') {
      if (this.opts.onPicked) this.opts.onPicked(d.info);
    }
  };

  Preview.prototype.destroy = function () {
    var self = this;
    previews = previews.filter(function (p) { return p !== self; });
    this.wrap.remove();
  };

  /**
   * A console panel bound to a preview: call panel.add(entry) from the preview's onConsole.
   */
  function ConsolePanel(container) {
    var self = this;
    this.count = 0;
    this.list = U.h('div', { class: 'console-list', role: 'log', 'aria-live': 'polite' });
    this.empty = U.h('div', { class: 'console-empty' }, 'console.log() output and errors appear here.');
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
    var row = U.h('div', { class: 'console-row console-' + e.level },
      U.h('span', { class: 'console-icon', 'aria-hidden': 'true' }, { error: '✖', warn: '⚠', info: 'ℹ', log: '›' }[e.level] || '›'),
      U.h('span', { class: 'console-text' }, e.text),
      e.where ? U.h('span', { class: 'console-where' }, e.where) : null);
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
    _buildDoc: buildDoc
  };

  /** Shared base CSS for reference and explainer demos (shown in their code, never hidden). */
  U.DEMO_BASE = 'body { font-family: system-ui, sans-serif; margin: 12px; color: #1d2433; }';
})(window.UILT);
