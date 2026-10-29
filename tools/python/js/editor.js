/*
 * editor.js - the Python code editor and read-only code blocks.
 *
 * Editors use CodeMirror 5 (vendor/codemirror): line numbers, colouring, bracket matching, and
 * Python-style indentation: 4 spaces, Tab indents, Shift+Tab un-indents, Enter after a line ending in
 * ":" indents the next line, and Backspace inside the leading spaces removes one level of 4.
 * Ctrl+Enter runs (the host passes onRun), Ctrl+/ comments lines out with #.
 * Every Python editor you type in shows the Java-habit warnings (js/habits.js) as you type: a ⚠ in
 * the gutter, the line tinted, and what to write instead on hover, focus or tap. A moment after you
 * stop typing, Python itself checks the syntax (PYLT.run.syntax, py/checker.py's syntax_errors): the
 * first error is underlined in red, marked ✕ in the gutter, and explained on hover, focus or tap,
 * with the hint for a Java habit when there is one. It also gets autocomplete (Ctrl+Space) and hover
 * tips from the Reference (js/assist.js).
 * If the vendor files are missing, a plain <textarea> is used instead.
 */
(function (U) {
  'use strict';

  var MODES = { python: 'python', java: 'text/x-java', js: 'javascript' };
  var LABELS = { python: 'Python', java: 'Java', js: 'JavaScript' };
  var INDENT = 4;

  /* ---------- the one tooltip that explains a ⚠ ---------- */

  var tip = null, hideTimer = null;
  function showTip(marker, msgs, title, kind) {
    if (!tip) {
      tip = U.h('div', { class: 'habit-tip', role: 'tooltip', hidden: true });
      tip.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
      tip.addEventListener('mouseleave', hideTipSoon);
      document.body.appendChild(tip);
    }
    clearTimeout(hideTimer);
    tip.innerHTML = '';
    tip.setAttribute('data-kind', kind || 'habit');
    tip.appendChild(U.h('div', { class: 'habit-tip-title' }, title || (msgs.length === 1 ? 'A Java habit?' : msgs.length + ' Java habits?')));
    msgs.forEach(function (m) { tip.appendChild(U.h('div', { class: 'habit-tip-msg', html: U.md(m) })); });
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
  U.hideHabitTip = function () { clearTimeout(hideTimer); if (tip) tip.hidden = true; };

  /** Keep the ⚠ markers of one editor in step with its text. Returns () => the current warnings. */
  function watchHabits(cm) {
    var list = [], lines = [];
    function paint() {
      list = U.javaHabits ? U.javaHabits(cm.getValue()) : [];
      cm.operation(function () {
        cm.clearGutter('pylt-warn');
        lines.forEach(function (h) { cm.removeLineClass(h, 'background', 'habit-line'); });
        lines = [];
        var byLine = {};
        list.forEach(function (w) { (byLine[w.line] = byLine[w.line] || []).push(w); });
        Object.keys(byLine).forEach(function (ln) {
          var n = +ln - 1;
          if (n >= cm.lineCount()) return;
          var msgs = byLine[ln].map(function (w) { return w.msg; });
          var plain = msgs.join(' ').replace(/`/g, '').replace(/\*\*/g, '');
          var marker = U.h('span', { class: 'habit-marker', tabindex: '0', role: 'img', 'aria-label': 'Java habit on line ' + ln + ': ' + plain, 'data-ids': byLine[ln].map(function (w) { return w.id; }).join(' ') }, '⚠');
          marker.addEventListener('mouseenter', function () { showTip(marker, msgs); });
          marker.addEventListener('focus', function () { showTip(marker, msgs); });
          marker.addEventListener('click', function () { showTip(marker, msgs); });
          marker.addEventListener('mouseleave', hideTipSoon);
          marker.addEventListener('blur', hideTipSoon);
          cm.setGutterMarker(n, 'pylt-warn', marker);
          lines.push(cm.addLineClass(n, 'background', 'habit-line'));
        });
      });
    }
    cm.on('change', U.debounce(paint, 250));
    paint();
    return function () { return list.slice(); };
  }

  var SYNTAX_DELAY = 600;   // ms after the last keystroke

  /**
   * Keep one editor's syntax underline in step with its text: a moment after typing stops, ask Python
   * (PYLT.run.syntax) and draw what it found. An answer for text that has changed since is dropped.
   * Returns () => the errors now shown.
   */
  function watchSyntax(cm) {
    var shown = [], marks = [], lines = [], asked = 0;
    function clear() {
      marks.forEach(function (m) { m.clear(); });
      lines.forEach(function (h) { cm.removeLineClass(h, 'background', 'syntax-line'); });
      marks = [];
      lines = [];
      cm.clearGutter('pylt-syntax');
      shown = [];
    }
    function draw(errors) {
      cm.operation(function () {
        clear();
        (errors || []).forEach(function (e) {
          var n = Math.min(Math.max(e.line, 1), cm.lineCount()) - 1;
          var text = cm.getLine(n);
          var from = Math.max(0, Math.min(e.col - 1, text.length));
          var endLine = Math.min(Math.max(e.endLine || e.line, e.line), cm.lineCount()) - 1;
          var to = endLine > n ? Math.min(Math.max(0, e.endCol - 1), cm.getLine(endLine).length) : Math.min(Math.max(e.endCol - 1, from), text.length);
          if (endLine === n && to <= from) {          // past the end of the line: underline its last character
            from = Math.max(0, text.length - 1);
            to = text.length;
          }
          var msgs = ['`' + e.message + '`'].concat(e.hint ? [e.hint] : []);
          var plain = e.message + (e.hint ? ' ' + e.hint : '');
          if (to > from || endLine > n) marks.push(cm.markText({ line: n, ch: from }, { line: endLine, ch: to }, { className: 'syntax-error', attributes: { title: plain } }));
          var marker = U.h('span', { class: 'syntax-marker', tabindex: '0', role: 'img', 'aria-label': 'Syntax error on line ' + (n + 1) + ': ' + plain }, '✕');
          ['mouseenter', 'focus', 'click'].forEach(function (ev) { marker.addEventListener(ev, function () { showTip(marker, msgs, 'Syntax error, line ' + (n + 1), 'syntax'); }); });
          marker.addEventListener('mouseleave', hideTipSoon);
          marker.addEventListener('blur', hideTipSoon);
          cm.setGutterMarker(n, 'pylt-syntax', marker);
          lines.push(cm.addLineClass(n, 'background', 'syntax-line'));
        });
        shown = (errors || []).slice();
      });
    }
    function check() {
      if (!U.run || !U.run.syntax) return;
      var code = cm.getValue(), ask = ++asked;
      if (!code.trim()) { draw([]); return; }
      U.run.syntax(code).then(function (errors) {
        if (ask !== asked || code !== cm.getValue() || errors === null) return;   // stale, or Python could not say
        draw(errors);
      });
    }
    cm.on('change', U.debounce(check, SYNTAX_DELAY));
    check();
    return function () { return shown.slice(); };
  }

  /** Backspace in the leading spaces of a line deletes back to the previous multiple of 4. */
  function smartBackspace(cm) {
    if (cm.somethingSelected()) return window.CodeMirror.Pass;
    var cur = cm.getCursor();
    var before = cm.getLine(cur.line).slice(0, cur.ch);
    if (!before.length || /[^ ]/.test(before)) return window.CodeMirror.Pass;
    var to = Math.floor((cur.ch - 1) / INDENT) * INDENT;
    cm.replaceRange('', { line: cur.line, ch: to }, cur, '+delete');
  }

  /**
   * U.editor.create(container, {value, onChange(value), onRun(), height, readOnly, mode, habits, assist, syntax})
   * returns {el, cm, get(), set(value, silent), focus(), refresh(), setHeight(px), height(),
   *          markError(line, message), clearError(), errorLine(), habits(), syntaxErrors()}
   * habits: false turns the Java-habit warnings off (they are on for every editable Python editor);
   * habits() is the list they currently show. assist: false turns autocomplete and hover off.
   * syntax: false turns the live syntax check off; syntaxErrors() is what it currently shows.
   */
  function create(container, opts) {
    opts = opts || {};
    var mode = opts.mode || 'python';
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
        'Cmd-Enter': function () { if (opts.onRun) opts.onRun(); }
      };
      var cm = window.CodeMirror(wrap, {
        value: opts.value || '',
        mode: MODES[mode] || mode,
        theme: 'pylt',
        lineNumbers: true,
        lineWrapping: true,
        tabSize: INDENT,
        indentUnit: INDENT,
        indentWithTabs: false,
        smartIndent: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        styleActiveLine: !opts.readOnly,
        readOnly: !!opts.readOnly,
        screenReaderLabel: (LABELS[mode] || mode) + ' editor',
        gutters: ['pylt-err', 'pylt-syntax', 'pylt-warn', 'CodeMirror-linenumbers'],
        extraKeys: keys
      });
      if (opts.height) cm.setSize(null, opts.height);
      var habits = mode === 'python' && !opts.readOnly && opts.habits !== false ? watchHabits(cm) : function () { return []; };
      if (mode === 'python' && !opts.readOnly && opts.assist !== false && U.assist) U.assist.attach(cm);
      var syntaxErrors = mode === 'python' && !opts.readOnly && opts.syntax !== false ? watchSyntax(cm) : function () { return []; };
      cm.on('change', function () {
        clearError();
        if (!silent && opts.onChange) opts.onChange(cm.getValue());
      });
      function clearError() {
        if (errLine === null) return;
        if (errLine < cm.lineCount()) cm.removeLineClass(errLine, 'background', 'error-line');
        cm.clearGutter('pylt-err');
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
          cm.setGutterMarker(errLine, 'pylt-err', U.h('span', { class: 'err-marker', title: message || 'The error happened here' }, '●'));
        },
        clearError: clearError,
        errorLine: function () { return errLine === null ? null : errLine + 1; },
        habits: habits,
        syntaxErrors: syntaxErrors,
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
      habits: function () { return U.javaHabits && mode === 'python' && !opts.readOnly ? U.javaHabits(ta.value) : []; },
      syntaxErrors: function () { return []; },
      goTo: function () { ta.focus(); }
    };
  }

  /** Colour a code string into a <pre>, using CodeMirror's runMode when available. */
  function highlightInto(pre, code, mode) {
    pre.innerHTML = '';
    if (window.CodeMirror && window.CodeMirror.runMode) window.CodeMirror.runMode(code, MODES[mode] || mode, pre);
    else pre.textContent = code;
  }

  /** A read-only, coloured snippet with a Copy button (and "Open in Playground" for Python). */
  function codeBlock(code, mode, opts) {
    opts = opts || {};
    var pre = U.h('pre', { class: 'code cm-s-pylt' });
    var head = U.h('div', { class: 'codeblock-head' },
      U.h('span', { class: 'codeblock-lang' }, opts.label || LABELS[mode] || mode),
      U.h('span', { class: 'spacer' }),
      U.h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: function () { U.copy(code); } }, 'Copy'),
      mode === 'python' && opts.playground !== false ? U.h('button', {
        class: 'btn btn-small', type: 'button', onclick: function () { U.openInPlayground({ title: opts.title, code: code }); }
      }, 'Open in Playground') : null);
    highlightInto(pre, code, mode);
    return { el: U.h('div', { class: 'codeblock' }, head, pre) };
  }

  U.editor = { create: create, MODES: MODES, LABELS: LABELS };
  U.codeBlock = codeBlock;
  U.highlightInto = highlightInto;
})(window.PYLT);
