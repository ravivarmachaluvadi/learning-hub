/*
 * react-runtime.js - how React code gets from an editor into a preview.
 *
 * Both pieces live in vendor/, each at one pinned version, so code runs with no internet:
 *
 *   Babel (@babel/standalone, vendor/babel/) runs in this page and turns JSX into plain JavaScript.
 *     retainLines keeps every line where you wrote it, so an error on line 4 of the output is an
 *     error on line 4 of your code: no line mapping anywhere. With {guardLoops: true} it also puts a
 *     runaway-loop check at the top of every loop (loopGuard, below).
 *   React itself (vendor/react/react.js, the development build, so its warnings reach the console)
 *     is ES module source text: each preview turns it into modules and names them in an import map
 *     (js/preview.js), so your code can say `import { useState } from 'react'` exactly as in a real
 *     project.
 *
 * Neither vendor file is edited by hand: tools/vendor.py downloads both for the versions below.
 *
 *   RLT.react.VERSION, RLT.react.BABEL     the pinned versions
 *   RLT.react.state                        'loading' | 'ready' | 'unavailable' (a vendor file is missing or wrong)
 *   RLT.react.problem                      why it is unavailable, in one sentence ('' otherwise)
 *   RLT.react.whenReady()                  a promise of true (Babel and React loaded) or false (not)
 *   RLT.react.compile(src, {guardLoops})   {code} or {error: {message, line, col}} (needs Babel)
 *   RLT.react.syntax(src)                  [] or [{line, col, message}] for the editor's underline
 *   RLT.react.parse(src)                   {ast} (Babel's tree, JSX included) or {error}: what the habit
 *                                          warnings and autocomplete read (js/habits.js, js/assist.js)
 *   RLT.react.traverse(ast, visitors)      Babel's traverse, with scopes (which names are visible where)
 *   RLT.react.modules()                    {'react': source, 'react-dom/client': source, ...} for a preview
 *   RLT.react.onChange(fn)                 fn(state) now and whenever the state changes
 */
(function (U) {
  'use strict';

  var VERSION = '19.3.0';      // react and react-dom, published 9 Sep 2026
  var BABEL = '8.0.6';         // @babel/standalone, published 18 Sep 2026
  var BABEL_SRC = 'vendor/babel/babel.min.js';
  var REACT_SRC = 'vendor/react/react.js';

  var state = 'loading', problem = '', babelOk = false;
  var listeners = [];
  /* Both are loaded without blocking the page: lessons, quizzes and flashcards never wait for them. */
  function load(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(true); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
  }
  var ready = Promise.all([load(BABEL_SRC), load(REACT_SRC)]).then(function (loaded) {
    var B = window.Babel, R = window.RLT_REACT;
    babelOk = loaded[0] && !!(B && B.transform);
    if (!babelOk) problem = 'The JSX translator could not be loaded from ' + BABEL_SRC + '.';
    else if (B.version && B.version !== BABEL) problem = BABEL_SRC + ' is Babel ' + B.version + ', not ' + BABEL + ': run python -I tools/vendor.py.';
    else if (!loaded[1] || !R || !R.modules) problem = 'React could not be loaded from ' + REACT_SRC + '.';
    else if (R.version !== VERSION) problem = REACT_SRC + ' holds React ' + R.version + ', not ' + VERSION + ': run python -I tools/vendor.py.';
    set(problem ? 'unavailable' : 'ready');
    return !problem;
  });
  function set(s) {
    state = s;
    listeners.forEach(function (fn) { try { fn(s); } catch (e) { console.error(e); } });
  }

  /**
   * A Babel plugin: the runaway-loop check (window.__rltLoop, in the preview's bridge) as the first
   * statement of every loop's body, braces added where there were none:
   *   while (x) n++;   ->   while (x) {if (window.__rltLoop(0, 3)) break;n++;}
   * It works on the parsed code, so it sees every kind of loop (for, for-in, for-of, while,
   * do-while) and no quote in a string or a regex can mislead it. The new nodes have no position,
   * so retainLines prints them on the loop's own line: no line number moves.
   */
  function loopGuard(api) {
    var t = api.types;
    return {
      pre: function () { this.loops = 0; this.guarded = new WeakSet(); },
      visitor: {
        Loop: function (path, pass) {
          var loop = path.node;
          if (pass.guarded.has(loop)) return;
          pass.guarded.add(loop);
          var check = t.ifStatement(
            t.callExpression(t.memberExpression(t.identifier('window'), t.identifier('__rltLoop')),
              [t.numericLiteral(pass.loops++), t.numericLiteral(loop.loc ? loop.loc.start.line : 0)]),
            t.breakStatement());
          if (t.isBlockStatement(loop.body)) loop.body.body.unshift(check);
          else loop.body = t.blockStatement([check, loop.body]);
        }
      }
    };
  }

  /** Babel's first message line, without the file name and position it adds: "Unexpected token". */
  function cleanMessage(e) {
    return String(e && e.message || e).split('\n')[0]
      .replace(/^\/?App\.jsx:\s*/, '')
      .replace(/\s*\(\d+:\d+\)\s*$/, '');
  }

  function compile(src, opts) {
    if (!babelOk) return { error: { message: problem || 'The JSX translator is still loading.', line: 0, col: 0 } };
    try {
      var out = window.Babel.transform(String(src || ''), {
        presets: [['react', { runtime: 'automatic' }]],
        plugins: opts && opts.guardLoops ? [loopGuard] : [],
        retainLines: true, filename: 'App.jsx', sourceType: 'module', sourceMaps: false
      });
      return { code: out.code };
    } catch (e) {
      var loc = e.loc || {};
      return { error: { message: cleanMessage(e), line: loc.line || 1, col: (loc.column || 0) + 1 } };
    }
  }

  function syntax(src) {
    if (!babelOk || !String(src || '').trim()) return [];
    var r = compile(src);
    return r.error ? [r.error] : [];
  }

  /** Babel's tree of the code, without translating it: positions are those of your text. */
  function parse(src) {
    if (!babelOk) return { error: { message: problem || 'The JSX translator is still loading.', line: 0, col: 0 } };
    try {
      return { ast: window.Babel.packages.parser.parse(String(src || ''), { sourceType: 'module', plugins: ['jsx'] }) };
    } catch (e) {
      var loc = e.loc || {};
      return { error: { message: cleanMessage(e), line: loc.line || 1, col: (loc.column || 0) + 1 } };
    }
  }

  U.react = {
    VERSION: VERSION, BABEL: BABEL,
    get state() { return state; },
    get problem() { return problem; },
    whenReady: function () { return ready; },
    compile: compile, syntax: syntax, parse: parse,
    traverse: function (ast, visitors) { window.Babel.packages.traverse.default(ast, visitors); },
    modules: function () { return (window.RLT_REACT && window.RLT_REACT.modules) || {}; },
    onChange: function (fn) { listeners.push(fn); fn(state); }
  };
})(window.RLT);
