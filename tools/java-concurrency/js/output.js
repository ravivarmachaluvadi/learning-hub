/*
 * output.js - the output panel under every editor (Playground, lesson examples and challenges): the
 * Kotlin Learning Tool's, for Java's two kinds of error (it came from the Python Learning Tool's).
 *
 * It shows what the program printed (println in the normal colour, System.err in red, what IO.readln()
 * read in the accent colour, the way a terminal shows what you typed), then any error:
 *   - a compile error: every error the compiler found, as `Main.java:4:5: error: …`, each place a link
 *     that puts the cursor on that line;
 *   - an exception: the JVM's own trace with only your code's frames, each `(Main.java:N)` a link;
 * with a plain-language hint for the mistakes made most in concurrent Java (jclearn.py's hints). The
 * editor marks the line too. The compiler's warnings follow, each with its line.
 *
 *   var panel = U.runPanel({editor, title, emptyText})
 *   panel.start()            clear, "Compiling and running…"
 *   panel.append(kind, text) output as it is printed (from /api/peek)
 *   panel.show(result)       the finished result from JCLT.run.exec
 *   panel.setHeight(px)      the whole panel's height (the grip and full screen set it: js/layout.js);
 *                            null gives it back its own (the output box stops at 360px)
 * The status element (.run-status) carries data-state: idle, running, ok, error, timeout, stopped,
 * unavailable.
 */
(function (U) {
  'use strict';
  var h = U.h;

  U.runPanel = function (opts) {
    opts = opts || {};
    var status = h('span', { class: 'run-status', 'data-state': 'idle' });
    var out = h('div', { class: 'output', role: 'log', 'aria-live': 'polite', tabindex: '0' });
    var el = h('div', { class: 'run-panel' },
      h('div', { class: 'run-head' }, h('span', { class: 'run-title' }, opts.title || 'Output'), h('span', { class: 'spacer' }), status),
      out);

    function setState(state, text) { status.setAttribute('data-state', state); status.textContent = text || ''; }

    function empty() {
      out.innerHTML = '';
      out.appendChild(h('div', { class: 'output-empty' }, opts.emptyText || 'Press Run (Ctrl+Enter) to see what your program prints.'));
      setState('idle', '');
    }

    function add(kind, text) {
      var last = out.lastElementChild;
      if (last && last.classList.contains('o-' + kind)) last.textContent += text;
      else out.appendChild(h('span', { class: 'o-' + kind }, text));
    }

    function start() {
      out.innerHTML = '';
      setState('running', 'Compiling and running…');
      if (opts.editor) opts.editor.clearError();
    }

    function append(kind, text) {
      var e = out.querySelector('.output-empty');
      if (e) e.remove();
      add(kind, text);
      out.scrollTop = out.scrollHeight;
    }

    function lineLink(label, n) {
      return opts.editor ? h('button', { class: 'line-link', type: 'button', title: 'Show line ' + n + ' in the editor', onclick: function () { opts.editor.goTo(n); } }, label)
        : h('span', null, label);
    }

    /** The error text, with every place in Main.java turned into a link to its line. */
    function tracebackEl(text) {
      var box = h('div', { class: 'o-error' });
      String(text || '').replace(/\n$/, '').split('\n').forEach(function (line) {
        var div = h('div');
        var rx = /Main\.java:(\d+)(?::(\d+))?/g, last = 0, m;
        while ((m = rx.exec(line))) {
          div.appendChild(document.createTextNode(line.slice(last, m.index)));
          div.appendChild(lineLink(m[0], +m[1]));
          last = m.index + m[0].length;
        }
        div.appendChild(document.createTextNode(line.slice(last) || (last ? '' : ' ')));
        box.appendChild(div);
      });
      return box;
    }

    function warningsEl(diags) {
      var ws = (diags || []).filter(function (d) { return d.severity === 'warning'; });
      if (!ws.length) return null;
      return h('div', { class: 'run-warnings' }, h('b', null, ws.length === 1 ? 'The compiler warns:' : 'The compiler warns (' + ws.length + '):'),
        h('ul', null, ws.map(function (d) {
          return h('li', null, d.line ? lineLink('line ' + d.line, d.line) : null, d.line ? ': ' : '', d.message);
        })));
    }

    function show(res) {
      out.innerHTML = '';
      (res.events || []).forEach(function (e) { add(e[0], e[1]); });
      if (res.truncated) out.appendChild(h('div', { class: 'o-note' }, '… the output was cut off here: only the first 100,000 characters are kept.'));
      var e = res.error;
      if (e) {
        if (out.childNodes.length && !/\n$/.test(out.textContent)) out.appendChild(h('br'));
        out.appendChild(tracebackEl(e.traceback || (e.type + ': ' + e.message)));
        if (e.hint) {
          var hint = U.callout('warn', 'Hint', U.md(e.hint));
          hint.classList.add('error-hint');
          out.appendChild(hint);
        }
        // the editor holds Main.java: an error in a Java file beside it (or in a Java program) is not one of its lines
        if (opts.editor && e.line && (!e.file || e.file === 'Main.java') && (res.phase === 'run' || res.phase === 'compile')) opts.editor.markError(e.line, e.type + ': ' + e.message);
      }
      var warn = warningsEl(res.diagnostics);
      if (warn) out.appendChild(warn);
      if (!out.childNodes.length) out.appendChild(h('div', { class: 'output-empty' }, 'The program ran and printed nothing.'));
      U.enhance(out);
      if (res.phase === 'timeout') setState('timeout', 'Stopped: took too long');
      else if (res.phase === 'stopped') setState('stopped', 'Stopped');
      else if (res.phase === 'unavailable') setState('unavailable', 'Could not run');
      else if (res.phase === 'compile') setState('error', 'Does not compile' + (e && e.line ? ': ' + where(e) : ''));
      else if (e) setState('error', e.type + (e.line ? ' on ' + where(e) : ''));
      else setState('ok', 'Finished');
      if (res.compileMs != null && res.phase !== 'unavailable') {
        status.appendChild(h('span', { class: 'run-times', title: 'Compiled and run by Java ' + (res.java || '') + ', preview features on' },
          'compiled in ' + res.compileMs + ' ms' + (res.runMs ? ', ran in ' + res.runMs + ' ms' : '')));
      }
    }

    /** "line 4", or "Greeter.java line 4" for a line of another file than Main.java. */
    function where(e) { return (e.file && e.file !== 'Main.java' ? e.file + ' ' : '') + 'line ' + e.line; }

    function setHeight(px) {
      el.style.height = px ? px + 'px' : '';
      el.classList.toggle('sized', !!px);
    }

    empty();
    return { el: el, start: start, append: append, show: show, clear: empty, setState: setState, setHeight: setHeight, out: out };
  };

  /** The "Input" box: the lines IO.readln() reads, one per call. */
  U.stdinBox = function (value, onChange, opts) {
    opts = opts || {};
    var ta = h('textarea', { class: 'stdin-box', rows: opts.rows || 2, spellcheck: 'false', 'aria-label': 'Input for the program', placeholder: 'One line for each IO.readln() call' });
    ta.value = value || '';
    if (onChange) ta.addEventListener('input', function () { onChange(ta.value); });
    var el = h('label', { class: 'stdin' },
      h('span', { class: 'stdin-label' }, 'Input', h('small', null, opts.note || ' - what IO.readln() reads, one line per call')),
      ta);
    return { el: el, get: function () { return ta.value; }, set: function (v) { ta.value = v || ''; }, textarea: ta };
  };
})(window.JCLT);
