/*
 * editor.js - the code editors and read-only code blocks (adapted from the Python Learning Tool's).
 *
 * Editors use CodeMirror 5 (vendor/codemirror): line numbers, colouring for JSX (its jsx mode
 * colours the tags inside JavaScript), bracket matching, tags that close themselves, 2-space
 * indentation. Ctrl+Enter runs (the host passes onRun), Ctrl+/ comments lines out.
 *
 * Every JSX editor you type in checks its syntax a moment after you stop: the JSX translator that
 * runs the code (Babel, RLT.react.syntax) compiles it, and the first error is underlined in red,
 * marked ✕ in the gutter, and explained on hover, focus or tap - before anything runs. When it
 * compiles, the React-habit warnings (js/habits.js) are drawn the same way, as a ⚠, with a button
 * for the ones that have a fix ("Add the import"). It also gets autocomplete (Ctrl+Space) and hover
 * cards (js/assist.js).
 * An error that happens while the code runs is marked by the host with markError(line, message).
 * Shift+Alt+F (and a host's Format button) tidies the code with Prettier (vendor/prettier, loaded
 * the first time); U.editor.formatCode(code, mode) does it without an editor.
 * If the vendor files are missing, a plain <textarea> is used instead.
 */
(function (U) {
  'use strict';

  var PRETTIER = '3.9.9';      // vendor/prettier (tools/vendor.py reads this), published 23 Sep 2026
  var MODES = { jsx: 'jsx', css: 'css', js: 'javascript' };
  var LABELS = { jsx: 'JSX', css: 'CSS', js: 'JavaScript', html: 'HTML', java: 'Java' };
  var INDENT = 2;

  /* ---------- the one tooltip that explains a ✕ or a ⚠ ---------- */

  var tip = null, hideTimer = null;
  /** kind: 'syntax' or 'habit'; actions: [{label, run}] drawn as buttons (a habit's fix). */
  function showTip(marker, msgs, title, kind, actions) {
    if (!tip) {
      tip = U.h('div', { class: 'editor-tip', role: 'tooltip', hidden: true });
      tip.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
      tip.addEventListener('mouseleave', hideTipSoon);
      document.body.appendChild(tip);
    }
    clearTimeout(hideTimer);
    tip.innerHTML = '';
    tip.setAttribute('data-kind', kind || 'syntax');
    tip.appendChild(U.h('div', { class: 'editor-tip-title' }, title));
    msgs.forEach(function (m) { tip.appendChild(U.h('div', { class: 'editor-tip-msg', html: U.md(m) })); });
    if (actions && actions.length) {
      tip.appendChild(U.h('div', { class: 'row editor-tip-actions' }, actions.map(function (a) {
        return U.h('button', { class: 'btn btn-small', type: 'button', onclick: a.run }, a.label);
      })));
    }
    tip.hidden = false;
    var r = marker.getBoundingClientRect();
    var w = tip.offsetWidth, hgt = tip.offsetHeight;
    var left = Math.max(8, Math.min(r.right + 6, window.innerWidth - w - 8));
    var top = r.bottom + 6 + hgt > window.innerHeight ? Math.max(8, r.top - hgt - 6) : r.bottom + 6;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function hideTipSoon() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { if (tip) tip.hidden = true; }, 250);
  }
  U.hideEditorTip = function () {
    clearTimeout(hideTimer);
    if (tip) tip.hidden = true;
    if (U.assist) U.assist.hideTip();
  };

  var SYNTAX_DELAY = 400;   // ms after the last keystroke

  /**
   * Keep one editor's syntax underline, and its React-habit warnings, in step with its text.
   * Returns {shown(), now(), habits()}: the errors shown, a check made at once, the warnings shown.
   */
  function watchSyntax(cm, withHabits) {
    var shown = [], marks = [], lines = [], warned = [], warnLines = [];
    function clear() {
      marks.forEach(function (m) { m.clear(); });
      lines.forEach(function (h) { cm.removeLineClass(h, 'background', 'syntax-line'); });
      marks = [];
      lines = [];
      cm.clearGutter('rlt-syntax');
      shown = [];
    }
    function draw(errors) {
      cm.operation(function () {
        clear();
        errors.forEach(function (e) {
          var n = Math.min(Math.max(e.line, 1), cm.lineCount()) - 1;
          var text = cm.getLine(n);
          var from = Math.max(0, Math.min(e.col - 1, text.length));
          var to = Math.min(from + 1, text.length);
          if (to <= from) { from = Math.max(0, text.length - 1); to = text.length; }   // past the end: its last character
          if (to > from) marks.push(cm.markText({ line: n, ch: from }, { line: n, ch: to }, { className: 'syntax-error', attributes: { title: e.message } }));
          var marker = U.h('span', { class: 'syntax-marker', tabindex: '0', role: 'img', 'aria-label': 'Syntax error on line ' + (n + 1) + ': ' + e.message }, '✕');
          ['mouseenter', 'focus', 'click'].forEach(function (ev) { marker.addEventListener(ev, function () { showTip(marker, ['`' + e.message + '`'], 'Syntax error, line ' + (n + 1)); }); });
          marker.addEventListener('mouseleave', hideTipSoon);
          marker.addEventListener('blur', hideTipSoon);
          cm.setGutterMarker(n, 'rlt-syntax', marker);
          lines.push(cm.addLineClass(n, 'background', 'syntax-line'));
        });
        shown = errors.slice();
      });
    }

    /* the ⚠ markers: one per line, every warning of that line in its tooltip */
    function drawWarnings(list) {
      cm.operation(function () {
        cm.clearGutter('rlt-warn');
        warnLines.forEach(function (hl) { cm.removeLineClass(hl, 'background', 'habit-line'); });
        warnLines = [];
        var byLine = {};
        list.forEach(function (w) { (byLine[w.line] = byLine[w.line] || []).push(w); });
        Object.keys(byLine).forEach(function (ln) {
          var ws = byLine[ln], n = +ln - 1;
          if (n < 0 || n >= cm.lineCount()) return;
          var plain = ws.map(function (w) { return w.msg.replace(/[`*]/g, ''); }).join(' ');
          var marker = U.h('span', { class: 'habit-marker', tabindex: '0', role: 'img', 'aria-label': 'React habit on line ' + ln + ': ' + plain,
            'data-ids': ws.map(function (w) { return w.id; }).join(' ') }, '⚠');
          var show = function () {
            var fixes = ws.filter(function (w) { return w.fix; }).map(function (w) {
              return { label: w.fix.label, run: function () { applyFix(w); } };
            });
            showTip(marker, ws.map(function (w) { return w.msg; }), ws.length === 1 ? 'A React habit?' : ws.length + ' React habits?', 'habit', fixes);
          };
          ['mouseenter', 'focus', 'click'].forEach(function (ev) { marker.addEventListener(ev, show); });
          marker.addEventListener('mouseleave', hideTipSoon);
          marker.addEventListener('blur', hideTipSoon);
          cm.setGutterMarker(n, 'rlt-warn', marker);
          warnLines.push(cm.addLineClass(n, 'background', 'habit-line'));
        });
        warned = list.slice();
      });
    }
    /** A fix is worked out again on the code as it is now (you may have typed since it was drawn). */
    function applyFix(w) {
      var now = (U.reactHabits(cm.getValue()) || []).filter(function (x) { return x.id === w.id && x.line === w.line && x.fix; })[0];
      U.hideEditorTip();
      if (!now) return;
      var c = now.fix.change;
      cm.replaceRange(c.text, cm.posFromIndex(c.from), cm.posFromIndex(c.to), '+fix');
      cm.focus();
    }

    function check() {
      var code = cm.getValue(), errors = U.react ? U.react.syntax(code) : [];
      draw(errors);
      if (withHabits) drawWarnings(!errors.length && U.reactHabits ? U.reactHabits(code) : []);
    }
    cm.on('change', U.debounce(check, SYNTAX_DELAY));
    if (U.react) U.react.onChange(function (s) { if (s === 'ready') check(); });
    return {
      shown: function () { return shown.slice(); },
      now: function () { check(); return shown.slice(); },
      habits: function () { return warned.slice(); }
    };
  }

  /* ---------- Format (Shift+Alt+F): Prettier from vendor/prettier, loaded the first time ---------- */

  var PRETTIER_FILES = ['standalone.js', 'plugins/babel.js', 'plugins/estree.js', 'plugins/postcss.js'];
  var prettierLoad = null;
  function loadPrettier() {
    if (!prettierLoad) {
      prettierLoad = PRETTIER_FILES.reduce(function (p, f) {
        return p.then(function (ok) {
          return ok && new Promise(function (resolve) {
            var s = document.createElement('script');
            s.src = 'vendor/prettier/' + f;
            s.onload = function () { resolve(true); };
            s.onerror = function () { resolve(false); };
            document.head.appendChild(s);
          });
        });
      }, Promise.resolve(true)).then(function (ok) { return ok && !!(window.prettier && window.prettierPlugins); });
    }
    return prettierLoad;
  }

  /** Tidy code as Prettier does (mode 'jsx' or 'css'): a promise of {code} or {error: {message, line}}. */
  function formatCode(text, mode) {
    text = String(text || '');
    return loadPrettier().then(function (ok) {
      if (!ok) return { error: { message: 'The formatter could not be loaded from vendor/prettier (version ' + PRETTIER + '): run python -I tools/vendor.py prettier.', line: 0 } };
      if (!text.trim()) return { code: text };
      var plugins = Object.keys(window.prettierPlugins).map(function (k) { return window.prettierPlugins[k]; });
      return Promise.resolve(window.prettier.format(text, { parser: mode === 'css' ? 'css' : 'babel', plugins: plugins, singleQuote: true }))
        .then(function (code) { return { code: code }; }, function (e) {
          var loc = (e && e.loc && e.loc.start) || {};
          return { error: { message: String(e && e.message || e).split('\n')[0].replace(/\s*\(\d+:\d+\)\s*$/, ''), line: loc.line || 0 } };
        });
    });
  }

  /** Format a whole editor in one undo step, keeping the cursor on (about) the same line. */
  function formatEditor(cm, mode) {
    var before = cm.getValue();
    return formatCode(before, mode).then(function (r) {
      if (r.error) {
        U.toast(r.error.line ? 'Format needs code that compiles: fix line ' + r.error.line + ' first (' + r.error.message + ').' : r.error.message);
        return false;
      }
      if (r.code === before || cm.getValue() !== before) return false;   // nothing to tidy, or you typed meanwhile
      var line = cm.getCursor().line;
      cm.operation(function () {
        cm.replaceRange(r.code, window.CodeMirror.Pos(cm.firstLine(), 0), window.CodeMirror.Pos(cm.lastLine()), 'format');
        var l = Math.min(line, cm.lastLine());
        cm.setCursor({ line: l, ch: cm.getLine(l).length });
      });
      return true;
    });
  }

  /** Backspace in the leading spaces of a line deletes back to the previous multiple of 2. */
  function smartBackspace(cm) {
    if (cm.somethingSelected()) return window.CodeMirror.Pass;
    var cur = cm.getCursor();
    var before = cm.getLine(cur.line).slice(0, cur.ch);
    if (!before.length || /[^ ]/.test(before)) return window.CodeMirror.Pass;
    var to = Math.floor((cur.ch - 1) / INDENT) * INDENT;
    cm.replaceRange('', { line: cur.line, ch: to }, cur, '+delete');
  }

  /**
   * U.editor.create(container, {value, onChange(value), onRun(), height, readOnly, mode: 'jsx'|'css', syntax, habits, assist})
   * returns {el, cm, get(), set(value, silent), focus(), refresh(), markError(line, message), clearError(),
   *          errorLine(), syntaxErrors(), habits(), format(), goTo(line), setHeight(px), height()}
   * syntax: false turns the live syntax check off; syntaxErrors() checks now and returns what it shows.
   * habits: false turns the React-habit warnings off; habits() is the list they show now.
   * assist: false turns autocomplete and hover cards off. format() resolves true if it changed the code.
   */
  function create(container, opts) {
    opts = opts || {};
    var mode = opts.mode || 'jsx';
    var wrap = U.h('div', { class: 'editor editor-' + mode });
    if (container) container.appendChild(wrap);
    var silent = false;
    var errLine = null;

    if (window.CodeMirror) {
      var keys = {
        'Ctrl-/': 'toggleComment',
        'Cmd-/': 'toggleComment',
        Tab: function (c) {
          if (c.somethingSelected()) c.indentSelection('add');
          else c.replaceSelection(new Array(INDENT - (c.getCursor().ch % INDENT) + 1).join(' '), 'end');
        },
        'Shift-Tab': 'indentLess',
        Backspace: smartBackspace,
        'Ctrl-Enter': function () { if (opts.onRun) opts.onRun(); },
        'Cmd-Enter': function () { if (opts.onRun) opts.onRun(); },
        'Shift-Alt-F': function (c) { if (!opts.readOnly) formatEditor(c, mode); }
      };
      var cm = window.CodeMirror(wrap, {
        value: opts.value || '',
        mode: MODES[mode] || mode,
        theme: 'rlt',
        lineNumbers: true,
        lineWrapping: true,
        tabSize: INDENT,
        indentUnit: INDENT,
        indentWithTabs: false,
        smartIndent: true,
        autoCloseBrackets: true,
        autoCloseTags: mode === 'jsx',
        matchBrackets: true,
        styleActiveLine: !opts.readOnly,
        readOnly: !!opts.readOnly,
        screenReaderLabel: (LABELS[mode] || mode) + ' editor',
        gutters: ['rlt-err', 'rlt-syntax', 'rlt-warn', 'CodeMirror-linenumbers'],
        extraKeys: keys
      });
      if (opts.height) cm.setSize(null, opts.height);
      var editable = mode === 'jsx' && !opts.readOnly;
      var syntax = editable && opts.syntax !== false ? watchSyntax(cm, opts.habits !== false) : null;
      if (editable && opts.assist !== false && U.assist) U.assist.attach(cm);
      cm.on('change', function () {
        clearError();
        if (!silent && opts.onChange) opts.onChange(cm.getValue());
      });
      function clearError() {
        if (errLine === null) return;
        if (errLine < cm.lineCount()) cm.removeLineClass(errLine, 'background', 'error-line');
        cm.clearGutter('rlt-err');
        errLine = null;
      }
      return {
        el: wrap, cm: cm, mode: mode,
        get: function () { return cm.getValue(); },
        set: function (v, quiet) {
          silent = !!quiet;
          cm.setValue(v || '');
          cm.clearHistory();
          silent = false;
        },
        focus: function () { cm.focus(); },
        refresh: function () { cm.refresh(); },
        /** The editor's height in px (the grip and full screen set it: js/layout.js). */
        setHeight: function (px) { cm.setSize(null, px); },
        height: function () { return cm.getWrapperElement().offsetHeight; },
        /** Mark a line (1-based) as the place an error happened, with the message on hover. */
        markError: function (line, message) {
          clearError();
          if (!line || line < 1 || line > cm.lineCount()) return;
          errLine = line - 1;
          cm.addLineClass(errLine, 'background', 'error-line');
          cm.setGutterMarker(errLine, 'rlt-err', U.h('span', { class: 'err-marker', title: message || 'The error happened here' }, '●'));
        },
        clearError: clearError,
        errorLine: function () { return errLine === null ? null : errLine + 1; },
        syntaxErrors: function () { return syntax ? syntax.now() : []; },
        habits: function () { return syntax ? syntax.habits() : []; },
        format: function () { return opts.readOnly ? Promise.resolve(false) : formatEditor(cm, mode); },
        /** Put the cursor on a line (1-based) and scroll it into view. */
        goTo: function (line) {
          var l = Math.max(0, Math.min(cm.lineCount() - 1, line - 1));
          cm.setCursor({ line: l, ch: cm.getLine(l).length });
          cm.scrollIntoView(null, 80);
          cm.focus();
        }
      };
    }

    var ta = U.h('textarea', { class: 'editor-fallback', spellcheck: 'false', 'aria-label': (LABELS[mode] || mode) + ' editor' });
    ta.value = opts.value || '';
    if (opts.height) ta.style.height = (typeof opts.height === 'number' ? opts.height + 'px' : opts.height);
    if (opts.readOnly) ta.readOnly = true;
    ta.addEventListener('input', function () { if (!silent && opts.onChange) opts.onChange(ta.value); });
    ta.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && opts.onRun) { e.preventDefault(); opts.onRun(); }
    });
    wrap.appendChild(ta);
    var fallbackErr = null;
    return {
      el: wrap, cm: null, mode: mode,
      get: function () { return ta.value; },
      set: function (v) { ta.value = v || ''; },
      focus: function () { ta.focus(); },
      refresh: function () {},
      setHeight: function (px) { ta.style.height = px + 'px'; },
      height: function () { return ta.offsetHeight; },
      markError: function (line) { fallbackErr = line || null; },
      clearError: function () { fallbackErr = null; },
      errorLine: function () { return fallbackErr; },
      syntaxErrors: function () { return mode === 'jsx' && U.react ? U.react.syntax(ta.value) : []; },
      habits: function () { return []; },
      format: function () { return Promise.resolve(false); },
      goTo: function () { ta.focus(); }
    };
  }

  /** Colour a code string into a <pre>, using CodeMirror's runMode when available. */
  function highlightInto(pre, code, mode) {
    pre.innerHTML = '';
    if (window.CodeMirror && window.CodeMirror.runMode && MODES[mode]) window.CodeMirror.runMode(code, MODES[mode], pre);
    else pre.textContent = code;
  }

  /** A read-only, coloured snippet with a Copy button (and "Open in Playground" for JSX). */
  function codeBlock(code, mode, opts) {
    opts = opts || {};
    var pre = U.h('pre', { class: 'code cm-s-rlt' });
    var head = U.h('div', { class: 'codeblock-head' },
      U.h('span', { class: 'codeblock-lang' }, opts.label || LABELS[mode] || mode),
      U.h('span', { class: 'spacer' }),
      U.h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: function () { U.copy(code); } }, 'Copy'),
      mode === 'jsx' && opts.playground !== false ? U.h('button', {
        class: 'btn btn-small', type: 'button', onclick: function () { U.openInPlayground({ title: opts.title, code: code }); }
      }, 'Open in Playground') : null);
    highlightInto(pre, code, mode);
    return { el: U.h('div', { class: 'codeblock' }, head, pre) };
  }

  U.editor = { create: create, formatCode: formatCode, MODES: MODES, LABELS: LABELS, PRETTIER: PRETTIER };
  U.codeBlock = codeBlock;
  U.highlightInto = highlightInto;
})(window.RLT);
