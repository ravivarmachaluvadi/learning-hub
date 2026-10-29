/*
 * editor.js - code editors and read-only code blocks.
 *
 * Editors use CodeMirror 5 (vendor/codemirror) for line numbers, colouring, auto-closing tags and
 * brackets, and autocomplete (Ctrl+Space, or automatically after "<" in HTML and while typing CSS
 * properties). Shift+Alt+F formats the code with js-beautify (vendor/js-beautify). In HTML, Tab
 * expands an Emmet abbreviation such as ul>li*3 (js/emmet.js). If the vendor files are missing, a
 * plain <textarea> is used instead.
 */
(function (U) {
  'use strict';

  var MODES = { html: 'htmlmixed', css: 'css', js: 'javascript', java: 'text/x-java' };
  var LABELS = { html: 'HTML', css: 'CSS', js: 'JavaScript', java: 'Java' };

  function autoHint(cm, change, mode) {
    if (!cm.showHint || change.origin !== '+input') return;
    var ch = change.text.join('');
    var cur = cm.getCursor();
    var tok = cm.getTokenAt(cur);
    var inner = window.CodeMirror.innerMode(cm.getMode(), tok.state).mode.name;
    if (inner === 'xml' && (ch === '<' || (/^[\w-]$/.test(ch) && /tag|attribute/.test(tok.type || '')))) {
      cm.showHint({ completeSingle: false });
    } else if (inner === 'css' && /^[a-z-]$/i.test(ch) && /property|variable|atom|keyword|tag/.test(tok.type || '') && tok.string.length >= 2) {
      cm.showHint({ completeSingle: false });
    } else if (inner === 'javascript' && ch === '.' && mode === 'js') {
      cm.showHint({ completeSingle: false });
    }
  }

  /* ---------- Format (Shift+Alt+F): js-beautify from vendor/js-beautify ---------- */

  var BEAUTIFY = { indent_size: 2, preserve_newlines: true, max_preserve_newlines: 2, end_with_newline: false };
  function formatCode(text, mode) {
    var b = window.beautifier;
    if (!b || !text.trim()) return text;
    if (mode === 'css') return b.css(text, Object.assign({ newline_between_rules: true }, BEAUTIFY));
    if (mode === 'js') return b.js(text, BEAUTIFY);
    if (mode === 'html') return b.html(text, Object.assign({ indent_inner_html: false, extra_liners: [], wrap_line_length: 0, indent_scripts: 'normal' }, BEAUTIFY));
    return text;
  }

  /** Format a whole editor in one undo step, keeping the cursor on (about) the same line. */
  function format(cm, mode) {
    var before = cm.getValue(), after = formatCode(before, mode);
    if (after === before) return false;
    var line = cm.getCursor().line;
    cm.operation(function () {
      cm.replaceRange(after, window.CodeMirror.Pos(cm.firstLine(), 0), window.CodeMirror.Pos(cm.lastLine()), 'format');
      var l = Math.min(line, cm.lastLine());
      cm.setCursor({ line: l, ch: cm.getLine(l).length });
    });
    return true;
  }

  /**
   * U.editor.create(container, {mode: 'html'|'css'|'js', value, onChange(value), height, readOnly,
   *                             onTry(textOrNull), lint, assist})
   * returns {el, get(), set(value, silent), focus(), refresh(), format(), setLint(list), setHeight(px), height(), cm}
   *
   * Editable editors get the learning assistance from js/editor-assist.js (catalogue autocomplete,
   * hover tooltips, Alt+Up/Down number scrubbing, colour swatches) unless assist: false.
   *   onTry(text)  - called while arrowing through a value list with the whole editor text as it
   *                  would be with that value; onTry(null) means "show the real code again".
   *   lint: true   - adds the warnings gutter; the host fills it with setLint([{line, msg}]).
   */
  function create(container, opts) {
    opts = opts || {};
    var mode = opts.mode || 'html';
    var wrap = U.h('div', { class: 'editor editor-' + mode });
    if (container) container.appendChild(wrap);
    var silent = false;
    var assist = !!U.editorAssist && opts.assist !== false && !opts.readOnly;

    if (window.CodeMirror) {
      var keys = {
        'Ctrl-Space': 'autocomplete',
        'Ctrl-/': 'toggleComment',
        'Cmd-/': 'toggleComment',
        Tab: function (c) {
          if (c.somethingSelected()) c.indentSelection('add');
          else if (mode === 'html' && assist && U.emmet && U.emmet.expandAtCursor(c)) return;
          else c.replaceSelection('  ', 'end');
        },
        'Shift-Tab': 'indentLess',
        'Shift-Alt-F': function (c) { if (!c.getOption('readOnly')) format(c, mode); }
      };
      if (assist) Object.assign(keys, U.editorAssist.keys());
      var cm = window.CodeMirror(wrap, {
        value: opts.value || '',
        mode: MODES[mode],
        theme: 'uilt',
        lineNumbers: true,
        lineWrapping: true,
        tabSize: 2,
        indentUnit: 2,
        autoCloseTags: mode === 'html',
        autoCloseBrackets: true,
        matchBrackets: true,
        styleActiveLine: !opts.readOnly,
        readOnly: !!opts.readOnly,
        screenReaderLabel: (LABELS[mode] || mode) + ' editor',
        gutters: opts.lint ? ['uilt-lint', 'CodeMirror-linenumbers'] : ['CodeMirror-linenumbers'],
        extraKeys: keys,
        hintOptions: assist
          // ":" and spaces must not close a list: CSS values like "0 auto" have spaces
          ? { completeSingle: false, closeCharacters: /[;{}<>]/, hint: function (c) { return U.editorAssist.hint(c, mode); } }
          : { completeSingle: false }
      });
      if (opts.height) cm.setSize(null, opts.height);
      cm.on('change', function () { if (!silent && opts.onChange) opts.onChange(cm.getValue()); });
      if (assist) U.editorAssist.attach(cm, mode, opts);
      else cm.on('inputRead', function (c, change) { autoHint(c, change, mode); });
      return {
        el: wrap, cm: cm, mode: mode,
        setLint: function (list) { if (opts.lint && U.editorAssist) U.editorAssist.setLint(cm, list || []); },
        get: function () { return cm.getValue(); },
        set: function (v, quiet) {
          silent = !!quiet;
          cm.setValue(v || '');
          cm.clearHistory();
          silent = false;
        },
        focus: function () { cm.focus(); },
        refresh: function () { cm.refresh(); },
        format: function () { return format(cm, mode); },
        /** The editor's height in px (the grip and full screen set it: js/layout.js). */
        setHeight: function (px) { cm.setSize(null, px); },
        height: function () { return cm.getWrapperElement().offsetHeight; }
      };
    }

    var ta = U.h('textarea', { class: 'editor-fallback', spellcheck: 'false', 'aria-label': (LABELS[mode] || mode) + ' editor' });
    ta.value = opts.value || '';
    if (opts.height) ta.style.height = (typeof opts.height === 'number' ? opts.height + 'px' : opts.height);
    if (opts.readOnly) ta.readOnly = true;
    ta.addEventListener('input', function () { if (!silent && opts.onChange) opts.onChange(ta.value); });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var s = ta.selectionStart;
        ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + 2;
        if (opts.onChange) opts.onChange(ta.value);
      }
    });
    wrap.appendChild(ta);
    return {
      el: wrap, cm: null, mode: mode,
      setLint: function () {},
      get: function () { return ta.value; },
      set: function (v) { ta.value = v || ''; },
      focus: function () { ta.focus(); },
      refresh: function () {},
      setHeight: function (px) { ta.style.height = px + 'px'; },
      height: function () { return ta.offsetHeight; },
      format: function () {
        var v = formatCode(ta.value, mode);
        if (v === ta.value) return false;
        ta.value = v;
        if (opts.onChange) opts.onChange(v);
        return true;
      }
    };
  }

  /** Colour a code string into a <pre>, using CodeMirror's runMode when available. */
  function highlightInto(pre, code, mode) {
    pre.innerHTML = '';
    if (window.CodeMirror && window.CodeMirror.runMode) window.CodeMirror.runMode(code, MODES[mode] || mode, pre);
    else pre.textContent = code;
  }

  /**
   * U.codeBlock(code, mode, {label, playground: {html, css, js}, copy: true})
   * returns {el, set(code)}. A read-only, coloured snippet with a Copy button.
   */
  function codeBlock(code, mode, opts) {
    opts = opts || {};
    var current = code;
    var pre = U.h('pre', { class: 'code cm-s-uilt' });
    var head = U.h('div', { class: 'codeblock-head' },
      U.h('span', { class: 'codeblock-lang' }, opts.label || LABELS[mode] || mode),
      U.h('span', { class: 'spacer' }),
      opts.copy === false ? null : U.h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: function () { U.copy(current); } }, 'Copy'),
      opts.playground ? U.h('button', {
        class: 'btn btn-small', type: 'button',
        onclick: function () { U.openInPlayground(typeof opts.playground === 'function' ? opts.playground() : opts.playground); }
      }, 'Open in Playground') : null);
    var el = U.h('div', { class: 'codeblock' }, head, pre);
    highlightInto(pre, code, mode);
    return {
      el: el,
      set: function (c) { if (c === current) return; current = c; highlightInto(pre, c, mode); }
    };
  }

  U.editor = { create: create, formatCode: formatCode, MODES: MODES, LABELS: LABELS };
  U.codeBlock = codeBlock;
  U.highlightInto = highlightInto;
})(window.UILT);
