/*
 * testing.js - small stand-ins for the libraries React components are tested with, so the testing
 * lesson's tests really run in a preview, with nothing installed:
 *
 *   vitest                       test (it), describe, beforeEach, afterEach, expect, vi.fn, vi.spyOn
 *   @testing-library/react       render, screen, within, fireEvent, waitFor, cleanup, act, renderHook
 *   @testing-library/user-event  userEvent.setup() and its click, dblClick, type ({Enter}, {Backspace},
 *                                {Escape}…), clear, selectOptions, keyboard, tab, hover, unhover
 *   @testing-library/jest-dom    its matchers, always on: toBeInTheDocument, toHaveTextContent,
 *                                toBeDisabled, toBeEnabled, toHaveValue, toBeChecked, toBeVisible,
 *                                toHaveAttribute, toHaveClass, toHaveFocus, toBeEmptyDOMElement
 *
 * They keep the real names and behave as the real ones do, as far as this subset goes: queries by role
 * (with the accessible name, `level`, `checked`, `pressed`, `expanded`, `selected`), label text,
 * placeholder, text (`exact: false` too), display value, alt text, title and test id, each as getBy
 * (exactly one, or an error worded as Testing Library words it), queryBy (null when none), findBy
 * (waits up to a second) and their All forms. Role queries skip hidden elements, as the real ones
 * do. tests/test_ui.py ("testing") runs a test file through them whose results were compared with the
 * real libraries (Vitest 3, Testing Library 16, jsdom) when this was written. What is not here
 * (fake timers, snapshots, module mocks, every ARIA role) a test cannot use.
 *
 * How it runs: js/preview.js puts `library` (below) into a preview whose code imports one of these
 * names, and the small modules in `modules` re-export what it defines. The code's test() calls only
 * register tests; once the component has rendered, the preview runs them one after another, each on a
 * clean page, and prints ✓ or ✗ with the reason in the console. render() draws into a <div> of its
 * own on <body>, and `screen` searches <body> without the preview's own App (#root), as if the tests
 * ran in a page of their own. React's updates are applied with flushSync, as act() does.
 *
 * `library` is never called in the app: its source text is copied into the preview. Keep it
 * self-contained, and never write the characters of an HTML comment or a closing script tag in it.
 */
(function (U) {
  'use strict';

  function library() {
    'use strict';
    var T = {};
    var deps = null;          // {createRoot, flushSync, React}: given by the @testing-library/react module when it loads
    var mounted = [];         // what render() drew: [{root, container}], removed after each test
    var DEFAULT_TIMEOUT = 3000, WAIT_TIMEOUT = 1000;

    /* ================================================================ the runner (vitest) */

    function scope(parent, name) { return { parent: parent, name: name, before: [], after: [] }; }
    var top = scope(null, ''), current = top;
    var registry = [];        // [{name, fn, scope, timeout, skip}]

    function fullName(sc, name) {
      var parts = [];
      for (var s = sc; s; s = s.parent) if (s.name) parts.unshift(s.name);
      parts.push(name);
      return parts.join(' > ');
    }
    function test(name, fn, timeout) { registry.push({ name: fullName(current, String(name)), fn: fn, scope: current, timeout: timeout }); }
    test.skip = function (name) { registry.push({ name: fullName(current, String(name)), skip: true, scope: current }); };
    test.todo = test.skip;
    test.only = test;
    function describe(name, fn) {
      var outer = current;
      current = scope(outer, String(name));
      try { fn(); } finally { current = outer; }
    }
    describe.skip = function () {};
    function beforeEach(fn) { current.before.push(fn); }
    function afterEach(fn) { current.after.push(fn); }

    function hooks(sc, kind) {
      var chain = [];
      for (var s = sc; s; s = s.parent) chain.unshift(s);
      var list = [];
      chain.forEach(function (s) { list = list.concat(s[kind]); });
      return kind === 'after' ? list.reverse() : list;
    }
    function withTimeout(p, ms, name) {
      return new Promise(function (resolve, reject) {
        var t = setTimeout(function () { reject(new Error('Test timed out in ' + ms + ' ms: is it waiting for something that never happens?')); }, ms);
        Promise.resolve(p).then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
      });
    }
    function message(e) {
      var m = e && e.message !== undefined ? String(e.message) : String(e);
      return m.length > 900 ? m.slice(0, 897) + '…' : m;
    }
    function runOne(item) {
      if (item.skip) return Promise.resolve({ name: item.name, ok: true, skipped: true, error: null, ms: 0 });
      var start = Date.now(), error = null;
      var p = Promise.resolve();
      hooks(item.scope, 'before').forEach(function (h) { p = p.then(function () { return h(); }); });
      p = p.then(function () { return withTimeout(item.fn(), item.timeout || DEFAULT_TIMEOUT, item.name); });
      return p.catch(function (e) { error = e; }).then(function () {
        var q = Promise.resolve();
        hooks(item.scope, 'after').forEach(function (h) { q = q.then(function () { return h(); }); });
        return q.catch(function (e) { if (!error) error = e; });
      }).then(function () {
        cleanup();
        return { name: item.name, ok: !error, error: error ? message(error) : null, ms: Date.now() - start };
      });
    }
    /* Tests run in a page of their own, as in a real project: while they run, the preview's own App
       (#root) is taken out of the page and put back after. Left in, its elements would share ids
       with the tests' copies, and a label's `for` would point at the App's input, not the test's. */
    var running = 0, parked = null;
    function parkApp() {
      if (running++) return;
      var app = document.getElementById('root');
      if (app && app.parentNode) { parked = { app: app, parent: app.parentNode, next: app.nextSibling }; app.remove(); }
    }
    function unparkApp() {
      if (--running || !parked) return;
      parked.parent.insertBefore(parked.app, parked.next && parked.next.parentNode === parked.parent ? parked.next : null);
      parked = null;
    }
    function runList(list) {
      var results = [];
      parkApp();
      return list.reduce(function (p, item) {
        return p.then(function () { return runOne(item).then(function (r) { results.push(r); }); });
      }, Promise.resolve()).then(function () { unparkApp(); return results; }, function (e) { unparkApp(); throw e; });
    }
    /** The code's own tests, after its first render: each result in the console, then a summary. */
    T.registered = function () { return registry.length; };
    T.runMain = function () {
      var list = registry;
      registry = [];
      return runList(list).then(function (results) {
        var failed = 0;
        results.forEach(function (r) {
          if (r.skipped) console.log('○ ' + r.name + ' (skipped)');
          else if (r.ok) console.log('✓ ' + r.name);
          else { failed++; console.error('✗ ' + r.name + ': ' + r.error); }
        });
        var passed = results.filter(function (r) { return r.ok && !r.skipped; }).length;
        console.info('Tests: ' + passed + ' passed' + (failed ? ', ' + failed + ' failed' : '') + ' (' + results.length + ')');
        return results;
      });
    };
    /** The tests of another module (compiled code): imported on a registry of their own, run quietly. */
    T.runModule = function (code) {
      var saved = registry, savedScope = current;
      registry = [];
      current = scope(null, '');
      var url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
      return import(url).then(function () {
        var list = registry;
        registry = saved; current = savedScope;
        return runList(list);
      }, function (e) {
        registry = saved; current = savedScope;
        return [{ name: '(import)', ok: false, error: 'the changed code failed to load: ' + message(e), ms: 0 }];
      });
    };

    /* ================================================================ expect (vitest + jest-dom) */

    function AssertionError(msg) { var e = new Error(msg); e.name = 'AssertionError'; return e; }
    function fmt(v, depth) {
      depth = depth || 0;
      if (v === null) return 'null';
      if (v === undefined) return 'undefined';
      if (typeof v === 'string') return depth ? JSON.stringify(v) : "'" + v + "'";
      if (typeof v === 'function') return v._isMockFunction ? 'vi.fn()' : '[Function ' + (v.name || 'anonymous') + ']';
      if (typeof v !== 'object') return String(v);
      if (v instanceof Element) return describeEl(v);
      if (depth > 2) return Array.isArray(v) ? '[…]' : '{…}';
      if (Array.isArray(v)) return '[ ' + v.map(function (x) { return fmt(x, depth + 1); }).join(', ') + ' ]';
      return '{ ' + Object.keys(v).map(function (k) { return k + ': ' + fmt(v[k], depth + 1); }).join(', ') + ' }';
    }
    function describeEl(el) {
      var s = '<' + el.tagName.toLowerCase();
      if (el.id) s += ' id="' + el.id + '"';
      if (el.className && typeof el.className === 'string') s += ' class="' + el.className + '"';
      var txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return s + '>' + (txt ? (txt.length > 40 ? txt.slice(0, 37) + '…' : txt) : '') + '</' + el.tagName.toLowerCase() + '>';
    }
    function equals(a, b) {
      if (Object.is(a, b)) return true;
      if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
      if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      var ka = Object.keys(a).filter(function (k) { return a[k] !== undefined; });
      var kb = Object.keys(b).filter(function (k) { return b[k] !== undefined; });
      if (ka.length !== kb.length) return false;
      return ka.every(function (k) { return Object.prototype.hasOwnProperty.call(b, k) && equals(a[k], b[k]); });
    }
    function isEl(v) { return v instanceof Element; }
    function needEl(v, matcher) {
      if (!isEl(v)) throw AssertionError(matcher + ' needs an element: received ' + fmt(v) + (v === null ? ' (a queryBy… found nothing?)' : ''));
    }
    function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
    function textMatch(text, want) { return want instanceof RegExp ? want.test(text) : text.indexOf(String(want)) >= 0; }
    function isDisabled(el) {
      if (!/^(BUTTON|INPUT|SELECT|TEXTAREA|OPTGROUP|OPTION|FIELDSET)$/.test(el.tagName)) return false;
      if (el.disabled) return true;
      for (var p = el.parentElement; p; p = p.parentElement) if (p.tagName === 'FIELDSET' && p.disabled) return true;
      return false;
    }
    function isVisible(el) {
      if (!el.isConnected) return false;
      for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
        var st = getComputedStyle(e);
        if (e.hidden || st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
        if (e.tagName === 'DETAILS' && !e.open && e !== el && !(el.tagName === 'SUMMARY' && el.parentElement === e)) return false;
      }
      return true;
    }
    function valueOf(el) {
      if (el.tagName === 'SELECT') {
        var sel = Array.prototype.filter.call(el.options, function (o) { return o.selected; }).map(function (o) { return o.value; });
        return el.multiple ? sel : (sel[0] === undefined ? null : sel[0]);
      }
      if (el.type === 'number') return el.value === '' ? null : Number(el.value);
      if (el.type === 'checkbox' || el.type === 'radio') return el.checked ? el.value : null;
      return el.value;
    }
    var matchers = {
      toBe: function (a, b) { return [Object.is(a, b), 'expected ' + fmt(a) + ' to be ' + fmt(b) + ' // Object.is equality', 'expected ' + fmt(a) + ' not to be ' + fmt(b)]; },
      toEqual: function (a, b) { return [equals(a, b), 'expected ' + fmt(a) + ' to deeply equal ' + fmt(b), 'expected ' + fmt(a) + ' not to deeply equal ' + fmt(b)]; },
      toStrictEqual: function (a, b) { return matchers.toEqual(a, b); },
      toBeTruthy: function (a) { return [!!a, 'expected ' + fmt(a) + ' to be truthy', 'expected ' + fmt(a) + ' not to be truthy']; },
      toBeFalsy: function (a) { return [!a, 'expected ' + fmt(a) + ' to be falsy', 'expected ' + fmt(a) + ' not to be falsy']; },
      toBeNull: function (a) { return [a === null, 'expected ' + fmt(a) + ' to be null', 'expected null not to be null']; },
      toBeUndefined: function (a) { return [a === undefined, 'expected ' + fmt(a) + ' to be undefined', 'expected undefined not to be undefined']; },
      toBeDefined: function (a) { return [a !== undefined, 'expected undefined to be defined', 'expected ' + fmt(a) + ' to be undefined']; },
      toBeNaN: function (a) { return [Number.isNaN(a), 'expected ' + fmt(a) + ' to be NaN', 'expected NaN not to be NaN']; },
      toContain: function (a, b) {
        var ok = typeof a === 'string' ? a.indexOf(b) >= 0 : !!a && Array.prototype.indexOf.call(a, b) >= 0;
        return [ok, 'expected ' + fmt(a) + ' to contain ' + fmt(b), 'expected ' + fmt(a) + ' not to contain ' + fmt(b)];
      },
      toHaveLength: function (a, n) {
        var len = a && a.length;
        return [len === n, 'expected ' + fmt(a) + ' to have a length of ' + n + ' but got ' + len, 'expected ' + fmt(a) + ' not to have a length of ' + n];
      },
      toMatch: function (a, re) { var ok = re instanceof RegExp ? re.test(String(a)) : String(a).indexOf(re) >= 0; return [ok, 'expected ' + fmt(a) + ' to match ' + String(re), 'expected ' + fmt(a) + ' not to match ' + String(re)]; },
      toBeGreaterThan: function (a, b) { return [a > b, 'expected ' + a + ' to be greater than ' + b, 'expected ' + a + ' not to be greater than ' + b]; },
      toBeGreaterThanOrEqual: function (a, b) { return [a >= b, 'expected ' + a + ' to be greater than or equal to ' + b, 'expected ' + a + ' not to be greater than or equal to ' + b]; },
      toBeLessThan: function (a, b) { return [a < b, 'expected ' + a + ' to be less than ' + b, 'expected ' + a + ' not to be less than ' + b]; },
      toBeLessThanOrEqual: function (a, b) { return [a <= b, 'expected ' + a + ' to be less than or equal to ' + b, 'expected ' + a + ' not to be less than or equal to ' + b]; },
      toThrow: function (fn, want) {
        if (typeof fn !== 'function') throw AssertionError('toThrow needs a function: expect(() => …).toThrow()');
        var thrown = null, did = false;
        try { fn(); } catch (e) { did = true; thrown = e; }
        var msg = thrown && thrown.message !== undefined ? String(thrown.message) : String(thrown);
        var ok = did && (want === undefined || (want instanceof RegExp ? want.test(msg) : msg.indexOf(String(want)) >= 0));
        return [ok, did ? 'expected the error "' + msg + '" to ' + (want instanceof RegExp ? 'match ' + want : 'include "' + want + '"') : 'expected the function to throw an error' + (want !== undefined ? ' matching ' + String(want) : '') + ', but it did not',
          'expected the function not to throw' + (want !== undefined ? ' an error matching ' + String(want) : '') + ', but it threw "' + msg + '"'];
      },
      toHaveBeenCalled: function (f) { mockOnly(f); var n = f.mock.calls.length; return [n > 0, 'expected the mock to have been called, but it was not', 'expected the mock not to have been called, but it was called ' + n + ' times']; },
      toHaveBeenCalledTimes: function (f, n) { mockOnly(f); var c = f.mock.calls.length; return [c === n, 'expected the mock to have been called ' + n + ' times, but it was called ' + c + ' times', 'expected the mock not to have been called ' + n + ' times']; },
      toHaveBeenCalledWith: function (f) {
        mockOnly(f);
        var args = Array.prototype.slice.call(arguments, 1);
        var ok = f.mock.calls.some(function (c) { return equals(c, args); });
        return [ok, 'expected the mock to have been called with ' + fmt(args) + '; its calls: ' + (f.mock.calls.length ? f.mock.calls.map(function (c) { return fmt(c); }).join(', ') : 'none'),
          'expected the mock not to have been called with ' + fmt(args)];
      },
      toHaveBeenLastCalledWith: function (f) {
        mockOnly(f);
        var args = Array.prototype.slice.call(arguments, 1), last = f.mock.calls[f.mock.calls.length - 1];
        return [!!last && equals(last, args), 'expected the last call to be with ' + fmt(args) + ', it was with ' + fmt(last), 'expected the last call not to be with ' + fmt(args)];
      },
      /* jest-dom */
      toBeInTheDocument: function (el) {
        var ok = isEl(el) && el.ownerDocument === document && document.documentElement.contains(el);
        return [ok, el === null ? 'expected element to be in the document, but it was not found (null)' : 'expected ' + fmt(el) + ' to be in the document', 'expected ' + fmt(el) + ' not to be in the document, but it is'];
      },
      toHaveTextContent: function (el, want) {
        needEl(el, 'toHaveTextContent');
        var text = norm(el.textContent);
        return [textMatch(text, want), 'expected element to have text content ' + fmt(want, 1) + ', received "' + text + '"', 'expected element not to have text content ' + fmt(want, 1) + ', received "' + text + '"'];
      },
      toBeDisabled: function (el) { needEl(el, 'toBeDisabled'); return [isDisabled(el), 'expected ' + fmt(el) + ' to be disabled', 'expected ' + fmt(el) + ' not to be disabled']; },
      toBeEnabled: function (el) { needEl(el, 'toBeEnabled'); return [!isDisabled(el), 'expected ' + fmt(el) + ' to be enabled', 'expected ' + fmt(el) + ' not to be enabled']; },
      toHaveValue: function (el, want) {
        needEl(el, 'toHaveValue');
        var v = valueOf(el);
        return [equals(v, want), 'expected ' + fmt(el) + ' to have value ' + fmt(want) + ', received ' + fmt(v), 'expected ' + fmt(el) + ' not to have value ' + fmt(want)];
      },
      toBeChecked: function (el) {
        needEl(el, 'toBeChecked');
        var ok = (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.getAttribute('aria-checked') === 'true';
        return [ok, 'expected ' + fmt(el) + ' to be checked', 'expected ' + fmt(el) + ' not to be checked'];
      },
      toBeVisible: function (el) { needEl(el, 'toBeVisible'); return [isVisible(el), 'expected ' + fmt(el) + ' to be visible', 'expected ' + fmt(el) + ' not to be visible']; },
      toHaveAttribute: function (el, name, value) {
        needEl(el, 'toHaveAttribute');
        var has = el.hasAttribute(name), got = el.getAttribute(name);
        var ok = has && (value === undefined || equals(got, value));
        return [ok, 'expected ' + fmt(el) + ' to have attribute ' + name + (value !== undefined ? '="' + value + '"' : '') + (has ? ', it is "' + got + '"' : ''), 'expected ' + fmt(el) + ' not to have attribute ' + name + (value !== undefined ? '="' + value + '"' : '')];
      },
      toHaveClass: function (el) {
        needEl(el, 'toHaveClass');
        var names = Array.prototype.slice.call(arguments, 1).join(' ').split(/\s+/).filter(Boolean);
        var ok = names.length ? names.every(function (n) { return el.classList.contains(n); }) : el.classList.length > 0;
        return [ok, 'expected ' + fmt(el) + ' to have class "' + names.join(' ') + '"', 'expected ' + fmt(el) + ' not to have class "' + names.join(' ') + '"'];
      },
      toHaveFocus: function (el) { needEl(el, 'toHaveFocus'); var a = document.activeElement; return [a === el, 'expected ' + fmt(el) + ' to have the focus; it is on ' + (a && a !== document.body ? fmt(a) : 'nothing'), 'expected ' + fmt(el) + ' not to have the focus']; },
      toBeEmptyDOMElement: function (el) { needEl(el, 'toBeEmptyDOMElement'); return [!el.innerHTML.trim(), 'expected ' + fmt(el) + ' to be empty', 'expected ' + fmt(el) + ' not to be empty']; }
    };
    function mockOnly(f) { if (!f || !f._isMockFunction) throw AssertionError('expected a vi.fn() mock, received ' + fmt(f)); }
    function expect(actual) {
      function build(not, wrap) {
        var api = {};
        Object.keys(matchers).forEach(function (name) {
          api[name] = function () {
            var args = [actual].concat(Array.prototype.slice.call(arguments));
            function judge(a) {
              args[0] = a;
              var r = matchers[name].apply(null, args);
              if (r[0] === not) throw AssertionError(not ? r[2] : r[1]);
            }
            return wrap ? wrap(judge, name) : judge(actual);
          };
        });
        return api;
      }
      var api = build(false);
      api.not = build(true);
      function settle(rejects) {
        return function (judge, name) {
          return Promise.resolve(actual).then(function (v) {
            if (rejects) throw AssertionError('expected the promise to reject, it resolved with ' + fmt(v));
            judge(v);
          }, function (e) {
            if (!rejects) throw AssertionError('expected the promise to resolve, it rejected with ' + message(e));
            judge(name === 'toThrow' ? function () { throw e; } : e);   // await expect(p).rejects.toThrow('…')
          });
        };
      }
      api.resolves = build(false, settle(false));
      api.rejects = build(false, settle(true));
      return api;
    }

    /* ---------- vi.fn, vi.spyOn ---------- */
    function fnMock(impl) {
      var queue = [], base = impl;
      function mock() {
        var args = Array.prototype.slice.call(arguments);
        mock.mock.calls.push(args);
        var f = queue.length ? queue.shift() : base;
        try {
          var v = f ? f.apply(this, args) : undefined;
          mock.mock.results.push({ type: 'return', value: v });
          return v;
        } catch (e) { mock.mock.results.push({ type: 'throw', value: e }); throw e; }
      }
      mock._isMockFunction = true;
      mock.mock = { calls: [], results: [] };
      mock.mockImplementation = function (f) { base = f; return mock; };
      mock.mockImplementationOnce = function (f) { queue.push(f); return mock; };
      mock.mockReturnValue = function (v) { base = function () { return v; }; return mock; };
      mock.mockReturnValueOnce = function (v) { queue.push(function () { return v; }); return mock; };
      mock.mockResolvedValue = function (v) { base = function () { return Promise.resolve(v); }; return mock; };
      mock.mockRejectedValue = function (e) { base = function () { return Promise.reject(e); }; return mock; };
      mock.mockClear = function () { mock.mock.calls = []; mock.mock.results = []; return mock; };
      mock.mockReset = function () { mock.mockClear(); base = undefined; queue = []; return mock; };
      return mock;
    }
    var vi = {
      fn: fnMock,
      spyOn: function (obj, key) {
        var original = obj[key];
        var m = fnMock(function () { return original.apply(this, arguments); });
        m.mockRestore = function () { obj[key] = original; };
        obj[key] = m;
        return m;
      }
    };

    /* ================================================================ queries (Testing Library) */

    function tick() { return new Promise(function (r) { setTimeout(function () { setTimeout(r, 0); }, 0); }); }

    /** Every element under base, without the preview's own App when base is the page (screen). */
    function elementsIn(base) {
      var all = Array.prototype.slice.call(base.querySelectorAll('*'));
      if (base !== document.body) return all;
      var app = document.getElementById('root');
      return all.filter(function (el) { return !app || (el !== app && !app.contains(el)); });
    }
    function hiddenFromTree(el) {   // excluded from role queries, as Testing Library does
      for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
        if (e.hidden || e.getAttribute('aria-hidden') === 'true') return true;
        var st = getComputedStyle(e);
        if (st.display === 'none' || st.visibility === 'hidden') return true;
      }
      return false;
    }
    var INPUT_ROLES = { button: 'button', submit: 'button', reset: 'button', image: 'button', checkbox: 'checkbox', radio: 'radio',
      range: 'slider', number: 'spinbutton', search: 'searchbox', email: 'textbox', tel: 'textbox', text: 'textbox', url: 'textbox' };
    function implicitRole(el) {
      var tag = el.tagName.toLowerCase();
      switch (tag) {
        case 'a': case 'area': return el.hasAttribute('href') ? 'link' : null;
        case 'button': return 'button';
        case 'input':
          var type = (el.getAttribute('type') || 'text').toLowerCase();
          if (type === 'hidden' || type === 'password' || type === 'file' || type === 'color' || type === 'date') return null;
          return INPUT_ROLES[type] || 'textbox';
        case 'textarea': return 'textbox';
        case 'select': return el.multiple || el.size > 1 ? 'listbox' : 'combobox';
        case 'option': return 'option';
        case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': return 'heading';
        case 'ul': case 'ol': case 'menu': return 'list';
        case 'li': return 'listitem';
        case 'img': return el.getAttribute('alt') === '' ? 'presentation' : 'img';
        case 'nav': return 'navigation';
        case 'main': return 'main';
        case 'aside': return 'complementary';
        case 'article': return 'article';
        case 'header': return el.closest('article, aside, main, nav, section') ? null : 'banner';
        case 'footer': return el.closest('article, aside, main, nav, section') ? null : 'contentinfo';
        case 'section': return authorName(el) ? 'region' : null;   // a region, or a form, only when it is named
        case 'form': return authorName(el) ? 'form' : null;
        case 'dialog': return 'dialog';
        case 'p': return 'paragraph';
        case 'table': return 'table';
        case 'tr': return 'row';
        case 'td': return 'cell';
        case 'th': return 'columnheader';
        case 'thead': case 'tbody': case 'tfoot': return 'rowgroup';
        case 'progress': return 'progressbar';
        case 'output': return 'status';
        case 'hr': return 'separator';
        case 'fieldset': case 'details': return 'group';
        default: return null;
      }
    }
    function roleOf(el) {
      var explicit = (el.getAttribute('role') || '').trim().split(/\s+/)[0];
      return explicit || implicitRole(el);
    }
    var NAME_FROM_CONTENT = { button: 1, link: 1, heading: 1, cell: 1, columnheader: 1, rowheader: 1, checkbox: 1, radio: 1, option: 1,
      tab: 1, menuitem: 1, row: 1, 'switch': 1, treeitem: 1, tooltip: 1 };
    function textAlternative(node) {   // the text a subtree gives an accessible name
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1) return '';
      if (node.hidden || node.getAttribute('aria-hidden') === 'true') return '';
      if (node.getAttribute('aria-label')) return ' ' + node.getAttribute('aria-label') + ' ';
      if (node.tagName === 'IMG') return node.getAttribute('alt') || '';
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(node.tagName)) return '';
      var s = '';
      for (var c = node.firstChild; c; c = c.nextSibling) s += textAlternative(c);
      return /^(DIV|P|LI|H[1-6]|SECTION|ARTICLE|TR|TD|TH|UL|OL|BR)$/.test(node.tagName) ? ' ' + s + ' ' : s;
    }
    /** A name given by the author (aria-labelledby, aria-label, title): what makes a section a region. */
    function authorName(el) {
      var ids = el.getAttribute('aria-labelledby');
      var t = ids ? ids.split(/\s+/).map(function (id) { var x = document.getElementById(id); return x ? x.textContent : ''; }).join(' ') : '';
      return norm(t || el.getAttribute('aria-label') || el.getAttribute('title') || '');
    }
    function accessibleName(el) {
      var ids = el.getAttribute('aria-labelledby');
      if (ids) {
        var t = ids.split(/\s+/).map(function (id) { var x = document.getElementById(id); return x ? textAlternative(x) : ''; }).join(' ');
        if (norm(t)) return norm(t);
      }
      if (el.getAttribute('aria-label') && norm(el.getAttribute('aria-label'))) return norm(el.getAttribute('aria-label'));
      var tag = el.tagName;
      if (tag === 'INPUT' && /^(button|submit|reset)$/i.test(el.type)) return norm(el.value || (el.type === 'submit' ? 'Submit' : el.type === 'reset' ? 'Reset' : ''));
      if (tag === 'INPUT' && el.type === 'image') return norm(el.alt || '');
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(tag) && el.labels && el.labels.length) {
        return norm(Array.prototype.map.call(el.labels, textAlternative).join(' '));
      }
      if (tag === 'IMG' || tag === 'AREA') return norm(el.getAttribute('alt') || el.getAttribute('title') || '');
      if (tag === 'FIELDSET') { var lg = el.querySelector('legend'); if (lg) return norm(textAlternative(lg)); }
      if (tag === 'TABLE') { var cap = el.querySelector('caption'); if (cap) return norm(textAlternative(cap)); }
      var role = roleOf(el);
      if (role && NAME_FROM_CONTENT[role]) { var c = norm(textAlternative(el)); if (c) return c; }
      return norm(el.getAttribute('title') || '');
    }
    function nameMatches(name, want) {
      if (want === undefined) return true;
      if (want instanceof RegExp) return want.test(name);
      if (typeof want === 'function') return !!want(name);
      return name === String(want);
    }
    function stateOf(el, prop) {
      if (prop === 'checked') return (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.getAttribute('aria-checked') === 'true';
      if (prop === 'selected') return el.tagName === 'OPTION' ? el.selected : el.getAttribute('aria-selected') === 'true';
      if (prop === 'pressed') return el.getAttribute('aria-pressed') === 'true';
      if (prop === 'expanded') return el.getAttribute('aria-expanded') === 'true';
      return undefined;
    }
    function levelOf(el) {
      var m = /^H([1-6])$/.exec(el.tagName);
      return el.hasAttribute('aria-level') ? +el.getAttribute('aria-level') : m ? +m[1] : undefined;
    }
    /** A text matcher, as Testing Library's: exact by default (after trimming and collapsing spaces). */
    function textMatcher(want, opts) {
      opts = opts || {};
      return function (text) {
        if (text === null || text === undefined) return false;
        var t = opts.normalizer ? opts.normalizer(text) : norm(text);
        if (want instanceof RegExp) return want.test(t);
        if (typeof want === 'function') return !!want(t);
        if (opts.exact === false) return t.toLowerCase().indexOf(String(want).toLowerCase()) >= 0;
        return t === String(want);
      };
    }
    function ownText(el) {   // the element's own text nodes, as getByText reads them
      var s = '';
      for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3) s += c.textContent;
      return s;
    }
    function q(v) { return v instanceof RegExp ? String(v) : String(v); }

    /* each query kind: what it finds, and how its errors describe it */
    var KINDS = {
      Role: {
        find: function (base, role, opts) {
          opts = opts || {};
          return elementsIn(base).filter(function (el) {
            if (roleOf(el) !== role) return false;
            if (!opts.hidden && hiddenFromTree(el)) return false;
            if (opts.level !== undefined && levelOf(el) !== opts.level) return false;
            var props = ['checked', 'selected', 'pressed', 'expanded'];
            for (var i = 0; i < props.length; i++) if (opts[props[i]] !== undefined && stateOf(el, props[i]) !== opts[props[i]]) return false;
            return nameMatches(accessibleName(el), opts.name);
          });
        },
        none: function (base, role, opts) {
          var rolesHere = {};
          elementsIn(base).forEach(function (el) {
            var r = roleOf(el);
            if (!r || hiddenFromTree(el) || r === 'presentation' || r === 'paragraph' || r === 'rowgroup') return;
            var n = accessibleName(el);
            (rolesHere[r] = rolesHere[r] || []).push(n ? '"' + n + '"' : '(no name)');
          });
          var here = Object.keys(rolesHere).map(function (r) { return r + ': ' + rolesHere[r].slice(0, 6).join(', '); }).join('; ');
          return 'Unable to find an accessible element with the role "' + role + '"' + (opts && opts.name !== undefined ? ' and name ' + (opts.name instanceof RegExp ? String(opts.name) : '"' + opts.name + '"') : '') +
            '. Here are the accessible roles: ' + (here || 'none');
        },
        many: function (base, role, opts) { return 'Found multiple elements with the role "' + role + '"' + (opts && opts.name !== undefined ? ' and name ' + (opts.name instanceof RegExp ? String(opts.name) : '"' + opts.name + '"') : ''); }
      },
      LabelText: {
        find: function (base, text, opts) {
          var match = textMatcher(text, opts), out = [];
          elementsIn(base).forEach(function (el) {
            if (el.tagName === 'LABEL' && match(el.textContent)) {
              var c = el.control;
              if (c && out.indexOf(c) < 0) out.push(c);
            }
            if (el.getAttribute('aria-label') && match(el.getAttribute('aria-label')) && out.indexOf(el) < 0) out.push(el);
            var ids = el.getAttribute('aria-labelledby');
            if (ids && match(ids.split(/\s+/).map(function (id) { var x = document.getElementById(id); return x ? x.textContent : ''; }).join(' ')) && out.indexOf(el) < 0) out.push(el);
          });
          return out;
        },
        none: function (base, text, opts) {
          var m = textMatcher(text, opts);
          var orphan = elementsIn(base).some(function (el) { return el.tagName === 'LABEL' && m(el.textContent) && !el.control; });
          return orphan ? 'Found a label with the text of: ' + q(text) + ', however no form control was found associated to that label. Make sure you\'re using the "for" attribute or "aria-labelledby" attribute correctly.'
            : 'Unable to find a label with the text of: ' + q(text);
        },
        many: function (base, text) { return 'Found multiple elements with the label text: ' + q(text); }
      },
      PlaceholderText: {
        find: function (base, text, opts) { var m = textMatcher(text, opts); return elementsIn(base).filter(function (el) { return el.hasAttribute('placeholder') && m(el.getAttribute('placeholder')); }); },
        none: function (base, text) { return 'Unable to find an element with the placeholder text of: ' + q(text); },
        many: function (base, text) { return 'Found multiple elements with the placeholder text of: ' + q(text); }
      },
      Text: {
        find: function (base, text, opts) {
          var m = textMatcher(text, opts), ignore = opts && opts.ignore !== undefined ? opts.ignore : 'script, style';
          return elementsIn(base).filter(function (el) { return !(ignore && el.matches(ignore)) && m(ownText(el)); });
        },
        none: function (base, text) { return 'Unable to find an element with the text: ' + q(text) + '. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.'; },
        many: function (base, text) { return 'Found multiple elements with the text: ' + q(text); }
      },
      DisplayValue: {
        find: function (base, text, opts) {
          var m = textMatcher(text, opts);
          return elementsIn(base).filter(function (el) {
            if (el.tagName === 'SELECT') return Array.prototype.some.call(el.options, function (o) { return o.selected && m(o.textContent); });
            return (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && m(el.value);
          });
        },
        none: function (base, text) { return 'Unable to find an element with the display value: ' + q(text) + '.'; },
        many: function (base, text) { return 'Found multiple elements with the display value: ' + q(text) + '.'; }
      },
      AltText: {
        find: function (base, text, opts) { var m = textMatcher(text, opts); return elementsIn(base).filter(function (el) { return /^(IMG|INPUT|AREA)$/.test(el.tagName) && el.hasAttribute('alt') && m(el.getAttribute('alt')); }); },
        none: function (base, text) { return 'Unable to find an element with the alt text: ' + q(text); },
        many: function (base, text) { return 'Found multiple elements with the alt text: ' + q(text); }
      },
      Title: {
        find: function (base, text, opts) { var m = textMatcher(text, opts); return elementsIn(base).filter(function (el) { return el.hasAttribute('title') && m(el.getAttribute('title')); }); },
        none: function (base, text) { return 'Unable to find an element with the title: ' + q(text) + '.'; },
        many: function (base, text) { return 'Found multiple elements with the title: ' + q(text) + '.'; }
      },
      TestId: {
        find: function (base, id, opts) { var m = textMatcher(id, opts); return elementsIn(base).filter(function (el) { return el.hasAttribute('data-testid') && m(el.getAttribute('data-testid')); }); },
        none: function (base, id) { return 'Unable to find an element by: [data-testid="' + q(id) + '"]'; },
        many: function (base, id) { return 'Found multiple elements by: [data-testid="' + q(id) + '"]'; }
      }
    };
    function queryError(msg) { var e = new Error(msg); e.name = 'TestingLibraryElementError'; return e; }
    function waitFor(cb, opts) {
      opts = opts || {};
      var timeout = opts.timeout || WAIT_TIMEOUT, interval = opts.interval || 50, start = Date.now();
      return new Promise(function (resolve, reject) {
        function attempt() {
          var r;
          try { r = cb(); } catch (e) { return retry(e); }
          Promise.resolve(r).then(resolve, retry);
        }
        function retry(e) {
          if (Date.now() - start >= timeout) { reject(e || new Error('Timed out in waitFor.')); return; }
          setTimeout(attempt, interval);
        }
        attempt();
      });
    }
    /** getBy…, queryBy…, findBy… and their All forms for one base element. */
    function queriesFor(base) {
      var api = {};
      Object.keys(KINDS).forEach(function (kind) {
        var K = KINDS[kind];
        function all(a, o) { return K.find(base(), a, o); }
        api['queryAllBy' + kind] = function (a, o) { return all(a, o); };
        api['getAllBy' + kind] = function (a, o) { var r = all(a, o); if (!r.length) throw queryError(K.none(base(), a, o)); return r; };
        api['queryBy' + kind] = function (a, o) { var r = all(a, o); if (r.length > 1) throw queryError(K.many(base(), a, o)); return r[0] || null; };
        api['getBy' + kind] = function (a, o) {
          var r = all(a, o);
          if (!r.length) throw queryError(K.none(base(), a, o));
          if (r.length > 1) throw queryError(K.many(base(), a, o));
          return r[0];
        };
        api['findAllBy' + kind] = function (a, o, w) { return waitFor(function () { return api['getAllBy' + kind](a, o); }, w); };
        api['findBy' + kind] = function (a, o, w) { return waitFor(function () { return api['getBy' + kind](a, o); }, w); };
      });
      api.debug = function (el) { console.log((el || base()).outerHTML || ''); };
      return api;
    }
    var screen = queriesFor(function () { return document.body; });
    screen.debug = function () {
      console.log(mounted.map(function (m) { return m.container.innerHTML; }).join('\n') || '(nothing rendered)');
    };
    function within(el) { return queriesFor(function () { return el; }); }

    /* ================================================================ render, cleanup, act, renderHook */

    function needDeps() {
      if (!deps) throw new Error('render() needs React: import it from @testing-library/react');
    }
    function render(ui, options) {
      needDeps();
      options = options || {};
      var container = options.container || document.body.appendChild(document.createElement('div'));
      var caught = null;
      var root = deps.createRoot(container, { onUncaughtError: function (e) { caught = e; } });
      var entry = { root: root, container: container };
      mounted.push(entry);
      deps.flushSync(function () { root.render(ui); });
      if (caught) throw caught;
      var out = queriesFor(function () { return document.body; });
      out.container = container;
      out.baseElement = document.body;
      out.unmount = function () { deps.flushSync(function () { root.unmount(); }); };
      out.rerender = function (next) { caught = null; deps.flushSync(function () { root.render(next); }); if (caught) throw caught; };
      out.asFragment = function () { var f = document.createDocumentFragment(); f.appendChild(container.cloneNode(true)); return f; };
      return out;
    }
    function cleanup() {
      mounted.splice(0).forEach(function (m) {
        try { deps.flushSync(function () { m.root.unmount(); }); } catch (e) { /* already gone */ }
        if (m.container.parentNode === document.body) m.container.remove();
      });
    }
    function act(cb) {
      var r;
      if (deps) deps.flushSync(function () { r = cb(); }); else r = cb();
      return Promise.resolve(r).then(function (v) { return tick().then(function () { return v; }); });
    }
    function renderHook(cb, options) {
      needDeps();
      options = options || {};
      var result = { current: undefined };
      function HookHost(props) { result.current = cb(props.p); return null; }
      var r = render(deps.React.createElement(HookHost, { p: options.initialProps }));
      return { result: result, rerender: function (p) { r.rerender(deps.React.createElement(HookHost, { p: p })); }, unmount: r.unmount };
    }

    /* ================================================================ fireEvent */

    function setValue(el, value) {
      var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    }
    function dispatch(el, ev, init) {
      if (!el) throw new Error('fireEvent needs an element: received ' + el);
      if (init && init.target) {
        Object.keys(init.target).forEach(function (k) {
          if (k === 'value') setValue(el, init.target[k]);
          else el[k] = init.target[k];
        });
      }
      return el.dispatchEvent(ev);
    }
    function mouse(type, init) { return new MouseEvent(type, Object.assign({ bubbles: true, cancelable: true, button: 0 }, init || {})); }
    function fireEvent(el, ev) { return dispatch(el, ev); }
    fireEvent.click = function (el, init) { return dispatch(el, mouse('click', init)); };
    fireEvent.dblClick = function (el, init) { return dispatch(el, mouse('dblclick', init)); };
    fireEvent.mouseDown = function (el, init) { return dispatch(el, mouse('mousedown', init)); };
    fireEvent.mouseUp = function (el, init) { return dispatch(el, mouse('mouseup', init)); };
    fireEvent.mouseOver = function (el, init) { return dispatch(el, mouse('mouseover', Object.assign({ relatedTarget: document.body }, init))); };
    fireEvent.mouseOut = function (el, init) { return dispatch(el, mouse('mouseout', Object.assign({ relatedTarget: document.body }, init))); };
    fireEvent.mouseEnter = function (el, init) { fireEvent.mouseOver(el, init); return dispatch(el, mouse('mouseenter', Object.assign({ bubbles: false }, init))); };
    fireEvent.mouseLeave = function (el, init) { fireEvent.mouseOut(el, init); return dispatch(el, mouse('mouseleave', Object.assign({ bubbles: false }, init))); };
    fireEvent.change = function (el, init) { return dispatch(el, new Event('change', { bubbles: true }), init); };
    fireEvent.input = function (el, init) { return dispatch(el, new Event('input', { bubbles: true }), init); };
    fireEvent.submit = function (el) { return dispatch(el, new Event('submit', { bubbles: true, cancelable: true })); };
    fireEvent.focus = function (el) { el.focus(); return true; };
    fireEvent.blur = function (el) { el.blur(); return true; };
    fireEvent.keyDown = function (el, init) { return dispatch(el, new KeyboardEvent('keydown', Object.assign({ bubbles: true, cancelable: true }, init || {}))); };
    fireEvent.keyUp = function (el, init) { return dispatch(el, new KeyboardEvent('keyup', Object.assign({ bubbles: true, cancelable: true }, init || {}))); };

    /* ================================================================ user-event */

    function disabledForUser(el) { return isDisabled(el) || (el.closest && !!el.closest('[inert]')); }
    function focusable(el) {
      if (!el || disabledForUser(el) || hiddenFromTree(el)) return false;
      if (el.tabIndex >= 0) return true;
      return /^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(el.tagName) && !(el.tagName === 'A' && !el.hasAttribute('href'));
    }
    function focusFor(el) {
      for (var e = el; e && e !== document.body; e = e.parentElement) if (focusable(e) || e.hasAttribute('tabindex')) { e.focus(); return; }
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    }
    function click(el) {
      if (!el) throw new Error('user.click needs an element: received ' + el);
      if (disabledForUser(el)) return tick();   // a disabled control gets no click, as in a browser
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      el.dispatchEvent(mouse('mousedown'));
      focusFor(el);
      el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
      el.dispatchEvent(mouse('mouseup'));
      el.click();
      return tick();
    }
    var KEYS = { Enter: 'Enter', Backspace: 'Backspace', Escape: 'Escape', Esc: 'Escape', Tab: 'Tab', Space: ' ', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown',
      ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', Home: 'Home', End: 'End', Delete: 'Delete', PageUp: 'PageUp', PageDown: 'PageDown' };
    function keySteps(text) {   // 'ab{Enter}' -> ['a', 'b', {key: 'Enter'}]; '{{' is a literal {
      var out = [], i = 0, s = String(text);
      while (i < s.length) {
        if (s[i] === '{' && s[i + 1] === '{') { out.push('{'); i += 2; continue; }
        if (s[i] === '{') {
          var end = s.indexOf('}', i);
          var name = s.slice(i + 1, end);
          if (end < 0 || !KEYS[name]) throw new Error('user-event: unknown key {' + name + '}; this stand-in knows ' + Object.keys(KEYS).map(function (k) { return '{' + k + '}'; }).join(' '));
          out.push({ key: KEYS[name] });
          i = end + 1;
          continue;
        }
        out.push(s[i]);
        i++;
      }
      return out;
    }
    function isTextField(el) { return el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|reset|image|file|range|color)$/i.test(el.type))); }
    function press(el, step) {
      var key = typeof step === 'string' ? step : step.key;
      var down = new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true });
      var go = el.dispatchEvent(down);
      if (go && typeof step === 'string' && isTextField(el) && !el.readOnly && !disabledForUser(el)) {
        setValue(el, el.value + step);
        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: step, inputType: 'insertText' }));
      } else if (go && key === 'Backspace' && isTextField(el)) {
        setValue(el, el.value.slice(0, -1));
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
      } else if (go && key === 'Enter') {
        if (el.tagName === 'TEXTAREA') {
          setValue(el, el.value + '\n');
          el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertLineBreak' }));
        } else if (el.tagName === 'INPUT' && el.form && isTextField(el)) {
          var submitter = el.form.querySelector('button:not([type]), button[type="submit"], input[type="submit"]');
          if (submitter && !disabledForUser(submitter)) submitter.click();
          else if (!submitter) el.form.requestSubmit();
        } else if (el.tagName === 'BUTTON' || (el.tagName === 'A' && el.hasAttribute('href'))) el.click();
      } else if (go && key === ' ' && (el.tagName === 'BUTTON' || el.type === 'checkbox' || el.type === 'radio')) {
        el.click();
      }
      el.dispatchEvent(new KeyboardEvent('keyup', { key: key, bubbles: true, cancelable: true }));
    }
    function tabbables() {
      return elementsIn(document.body).filter(function (el) { return focusable(el) && el.tabIndex >= 0; });
    }
    function makeUser() {
      var user = {
        click: click,
        dblClick: function (el) { return click(el).then(function () { return click(el); }).then(function () { el.dispatchEvent(mouse('dblclick')); return tick(); }); },
        hover: function (el) { fireEvent.mouseEnter(el); return tick(); },
        unhover: function (el) { fireEvent.mouseLeave(el); return tick(); },
        type: function (el, text, opts) {
          if (!el) return Promise.reject(new Error('user.type needs an element: received ' + el));
          var p = opts && opts.skipClick ? Promise.resolve(el.focus()) : click(el);
          return p.then(function () {
            keySteps(text).forEach(function (step) { press(document.activeElement === el || !document.activeElement || document.activeElement === document.body ? el : document.activeElement, step); });
            return tick();
          });
        },
        clear: function (el) {
          el.focus();
          if (!isTextField(el) || disabledForUser(el) || el.readOnly) return tick();
          setValue(el, '');
          el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContent' }));
          return tick();
        },
        selectOptions: function (select, values) {
          var want = [].concat(values).map(function (v) { return isEl(v) ? v.value : String(v); });
          var found = Array.prototype.filter.call(select.options, function (o) { return want.indexOf(o.value) >= 0 || want.indexOf(o.textContent) >= 0; });
          if (found.length < want.length) return Promise.reject(new Error('Value "' + want.join(', ') + '" not found in options'));
          if (disabledForUser(select)) return tick();
          select.focus();
          Array.prototype.forEach.call(select.options, function (o) { if (found.indexOf(o) >= 0) o.selected = true; else if (!select.multiple) o.selected = false; });
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return tick();
        },
        keyboard: function (text) {
          keySteps(text).forEach(function (step) { press(document.activeElement || document.body, step); });
          return tick();
        },
        tab: function (opts) {
          var list = tabbables(), at = list.indexOf(document.activeElement);
          var next = opts && opts.shift ? list[(at <= 0 ? list.length : at) - 1] : list[(at + 1) % list.length];
          if (next) next.focus();
          return tick();
        }
      };
      return user;
    }
    var userEvent = makeUser();
    userEvent.setup = function () { return makeUser(); };

    T.init = function (d) { deps = d; };
    T.test = test; T.describe = describe; T.beforeEach = beforeEach; T.afterEach = afterEach; T.expect = expect; T.vi = vi;
    T.render = render; T.screen = screen; T.within = within; T.fireEvent = fireEvent; T.waitFor = waitFor; T.cleanup = cleanup;
    T.act = act; T.renderHook = renderHook; T.userEvent = userEvent;
    window.__rltTL = T;
  }

  /* the modules the code imports: each re-exports what library() defined */
  var TL = 'const T = window.__rltTL;\n';
  U.testing = {
    library: library,
    modules: {
      'vitest': TL + 'export const test = T.test, it = T.test, describe = T.describe, beforeEach = T.beforeEach, afterEach = T.afterEach, expect = T.expect, vi = T.vi;\n',
      '@testing-library/react': "import * as React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport { flushSync } from 'react-dom';\n" + TL +
        'T.init({ createRoot, flushSync, React });\n' +
        'export const render = T.render, screen = T.screen, within = T.within, fireEvent = T.fireEvent, waitFor = T.waitFor, cleanup = T.cleanup, act = T.act, renderHook = T.renderHook;\n',
      '@testing-library/user-event': TL + 'export default T.userEvent;\nexport const userEvent = T.userEvent;\n',
      '@testing-library/jest-dom': 'export {};\n',
      '@testing-library/jest-dom/vitest': 'export {};\n'
    }
  };
})(window.RLT);
