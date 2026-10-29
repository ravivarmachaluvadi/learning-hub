/*
 * output.js - the output panel under every editor (Playground, lesson examples and challenges).
 *
 * It shows what the program printed (print in the normal colour, stderr in red, what input() read
 * in the accent colour, the way a terminal shows what you typed), then any error: Python's own
 * traceback, where each `File "main.py", line N` is a link that puts the cursor on that line, and a
 * plain-language hint for the mistakes a Java developer makes most. The editor marks the line too.
 *
 *   var panel = U.runPanel({editor, title, emptyText})
 *   panel.start()            clear, "Running…"
 *   panel.append(kind, text) output as it is printed (browser mode streams it)
 *   panel.show(result)       the finished result from PYLT.run.exec
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
      setState('running', 'Running…');
      if (opts.editor) opts.editor.clearError();
    }

    function append(kind, text) {
      var e = out.querySelector('.output-empty');
      if (e) e.remove();
      add(kind, text);
      out.scrollTop = out.scrollHeight;
    }

    function tracebackEl(text) {
      var box = h('div', { class: 'o-error' });
      String(text || '').replace(/\n$/, '').split('\n').forEach(function (line) {
        var m = /^(\s*File "main\.py", )line (\d+)(.*)$/.exec(line);
        if (m && opts.editor) {
          var n = +m[2];
          box.appendChild(h('div', null, m[1],
            h('button', { class: 'line-link', type: 'button', title: 'Show line ' + n + ' in the editor', onclick: function () { opts.editor.goTo(n); } }, 'line ' + n),
            m[3]));
        } else {
          box.appendChild(h('div', null, line || ' '));
        }
      });
      return box;
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
          var hint = U.callout('warn', 'Hint', U.esc(e.hint));
          hint.classList.add('error-hint');
          out.appendChild(hint);
        }
        if (opts.editor && e.line && (res.phase === 'run' || res.phase === 'syntax')) opts.editor.markError(e.line, e.type + ': ' + e.message);
      }
      if (!out.childNodes.length) out.appendChild(h('div', { class: 'output-empty' }, 'The program ran and printed nothing.'));
      var ms = res.ms != null ? res.ms : 0;
      if (res.phase === 'timeout') setState('timeout', 'Stopped: took too long');
      else if (res.phase === 'stopped') setState('stopped', 'Stopped');
      else if (res.phase === 'unavailable') setState('unavailable', 'Could not run');
      else if (e) setState('error', e.type + (e.line ? ' on line ' + e.line : ''));
      else setState('ok', 'Finished in ' + (ms < 1 ? 'under 1' : ms) + ' ms');
    }

    function setHeight(px) {
      el.style.height = px ? px + 'px' : '';
      el.classList.toggle('sized', !!px);
    }

    empty();
    return { el: el, start: start, append: append, show: show, clear: empty, setState: setState, setHeight: setHeight, out: out };
  };

  /** "Input" box: the lines input() reads, one per call. */
  U.stdinBox = function (value, onChange, opts) {
    opts = opts || {};
    var ta = h('textarea', { class: 'stdin-box', rows: opts.rows || 2, spellcheck: 'false', 'aria-label': 'Input for the program', placeholder: 'One line for each input() call' });
    ta.value = value || '';
    if (onChange) ta.addEventListener('input', function () { onChange(ta.value); });
    var el = h('label', { class: 'stdin' },
      h('span', { class: 'stdin-label' }, 'Input', h('small', null, opts.note || ' - what input() reads, one line per call')),
      ta);
    return { el: el, get: function () { return ta.value; }, set: function (v) { ta.value = v || ''; }, textarea: ta };
  };
})(window.PYLT);
