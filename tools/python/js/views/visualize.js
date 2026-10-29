/*
 * views/visualize.js - step through a program and see every name point at its object (#/visualize).
 *
 * Two parts:
 *
 *   U.viz.create(container)   the step-through picture, also used by the explainers. show(result,
 *                             code, opts) draws a result of PYLT.run.trace (py/tracer.py records it):
 *                             the code with the line that runs next, what was printed so far, the
 *                             frames (one per call in progress) with their names, and the objects
 *                             those names point at, with an SVG arrow from each name to its object.
 *                             Returns {el, show, go(i), index(), count(), setRunning(), destroy()}.
 *                             opts.at(step) picks the step to show first (default: the last one).
 *   the page                  an editor (and Input box) and "Visualize"; then the picture, stepped
 *                             with the buttons, the slider or the arrow keys. Other pages hand a
 *                             program over with U.openInVisualize({title, code, stdin}); a link to
 *                             #/visualize?example=<id> opens one of data/visualize.js, visualized.
 *
 * Room for it (js/layout.js): a divider between the program and the picture (the same one wherever the
 * picture is drawn, explainers too), a grip under the page's editor, and Full screen for the whole page,
 * with the step bar kept at the top as it scrolls.
 *
 * How the picture is laid out: frames on the left, objects on the right. Objects are placed in rows,
 * in the order the frames' names first reach them; an object reached only from another object goes
 * to its right, in the same row, so most arrows point right. Arrows are drawn after the boxes are in
 * the page (they need measured positions), and again whenever the picture changes size.
 *
 * For the tests: PYLT.visualize = {editor, setStdin(text), run(), viz}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var SVG = 'http://www.w3.org/2000/svg';

  /* ---------- describing a step in words ---------- */

  function shortValue(v) {
    if (!v) return '';
    return v.ref !== undefined ? 'an object' : v.v;
  }
  function funcName(frame) {
    return frame ? frame.name.replace(/^.*<locals>\./, '') : '';
  }
  function describe(step, res, isLast) {
    var top = step.stack[step.stack.length - 1];
    var name = funcName(top), global = top && top.name === 'Global frame';
    var where = global ? '' : ' in ' + name + '()';
    switch (step.event) {
      case 'line': return 'Line ' + step.line + ' runs next' + where + '.';
      case 'call': return name + '() is called: Python makes a new frame for its names, starting with its parameters.';
      case 'resume': return name + '() resumes where its yield paused it, with its names as they were.';
      case 'return':
        if (global) return res.error && isLast ? 'The program stopped.' : 'The program has finished.';
        return name + '() returns ' + shortValue(top.ret) + '. Its frame goes away.';
      case 'yield': return name + '() pauses and yields ' + shortValue(top.ret) + '. Its frame is kept for the next round.';
      case 'exception': return (step.exc ? step.exc.type + ': ' + step.exc.message : 'An exception') + ' (raised on line ' + step.line + where + ').';
      case 'unwind': return global ? 'The program stopped with an error.' : name + '() ends early: the exception passes on to whoever called it.';
    }
    return '';
  }

  /* ---------- the picture ---------- */

  function create(container, options) {
    options = options || {};
    var state = { res: null, code: '', i: 0, layoutRows: null };
    var first = h('button', { class: 'btn btn-small viz-first', type: 'button', title: 'First step (Home)', 'aria-label': 'First step' }, '⏮');
    var prev = h('button', { class: 'btn btn-small viz-prev', type: 'button', title: 'Back (←)' }, '◀ Back');
    var next = h('button', { class: 'btn btn-small btn-primary viz-next', type: 'button', title: 'Forward (→)' }, 'Forward ▶');
    var last = h('button', { class: 'btn btn-small viz-last', type: 'button', title: 'Last step (End)', 'aria-label': 'Last step' }, '⏭');
    var slider = h('input', { class: 'viz-slider', type: 'range', min: 0, max: 0, value: 0, 'aria-label': 'Step' });
    var stepText = h('span', { class: 'viz-step-text' });
    var what = h('div', { class: 'viz-what', 'aria-live': 'polite' });
    var note = h('div', { class: 'viz-note', hidden: true });
    var codeBox = h('div', { class: 'viz-code', role: 'list', 'aria-label': 'The program' });
    var out = h('pre', { class: 'viz-out', 'aria-label': 'Printed so far' });
    var frames = h('div', { class: 'viz-frames' });
    var heap = h('div', { class: 'viz-heap' });
    var svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'viz-arrows');
    svg.setAttribute('aria-hidden', 'true');
    var diagram = h('div', { class: 'viz-diagram' },
      h('div', { class: 'viz-col' }, h('div', { class: 'viz-col-title' }, 'Frames'), frames),
      h('div', { class: 'viz-col viz-col-heap' }, h('div', { class: 'viz-col-title' }, 'Objects'), heap));
    diagram.appendChild(svg);
    var body = h('div', { class: 'viz-body' },
      h('div', { class: 'viz-left' }, codeBox,
        h('div', { class: 'viz-out-box' }, h('div', { class: 'viz-col-title' }, 'Printed so far'), out)),
      diagram);
    var el = h('div', { class: 'viz', 'data-state': 'empty' },
      h('div', { class: 'viz-bar' }, first, prev, next, last, slider, stepText),
      what, note, body);
    if (container) container.appendChild(el);
    U.layout.split(body, { key: 'viz', def: 39, minLeft: 220, minRight: 380, label: 'Resize the program and the picture' });

    first.addEventListener('click', function () { go(0); });
    prev.addEventListener('click', function () { go(state.i - 1); });
    next.addEventListener('click', function () { go(state.i + 1); });
    last.addEventListener('click', function () { go(count() - 1); });
    slider.addEventListener('input', function () { go(+slider.value); });

    var redraw = U.debounce(drawArrows, 30);
    var observer = window.ResizeObserver ? new ResizeObserver(function () { redraw(); }) : null;
    if (observer) observer.observe(diagram);
    window.addEventListener('resize', redraw);

    function count() { return state.res && state.res.steps ? state.res.steps.length : 0; }

    /** The order objects are drawn in: rows, each starting at an object a frame points at. */
    function layout(step) {
      var placed = {}, rows = [];
      function children(obj) {
        var refs = [];
        function add(v) { if (v && v.ref !== undefined) refs.push(String(v.ref)); }
        (obj.items || []).forEach(add);
        (obj.entries || []).forEach(function (e) { add(e[0]); add(e[1]); });
        (obj.vars || []).concat(obj.cells || [], obj.defaults || []).forEach(function (p) { add(p[1]); });
        return refs;
      }
      function place(id, row) {
        if (placed[id] || !step.heap[id]) return;
        placed[id] = true;
        row.push(id);
        children(step.heap[id]).forEach(function (c) { place(c, row); });
      }
      step.stack.forEach(function (f) {
        f.vars.concat(f.ret ? [['', f.ret]] : []).forEach(function (p) {
          var v = p[1];
          if (v && v.ref !== undefined && !placed[String(v.ref)]) {
            var row = [];
            place(String(v.ref), row);
            if (row.length) rows.push(row);
          }
        });
      });
      return rows;
    }

    function valueEl(v, heapNow) {
      if (!v) return h('span', { class: 'viz-v' }, '?');
      if (v.ref === undefined) return h('span', { class: 'viz-v' }, v.v);
      var drawn = !!heapNow[String(v.ref)];
      return h('span', { class: 'viz-ref' + (drawn ? '' : ' viz-ref-missing'), 'data-ref': String(v.ref),
        title: drawn ? 'An arrow to the object' : 'This object is not drawn: there are too many objects in this step' });
    }

    function rowsTable(pairs, heapNow, cls, prevPairs) {
      var before = {};
      (prevPairs || []).forEach(function (p) { before[p[0]] = JSON.stringify(p[1]); });
      return pairs.map(function (p) {
        var changed = prevPairs && before[p[0]] !== JSON.stringify(p[1]);
        return h('div', { class: (cls || 'viz-var') + (changed ? ' viz-changed' : ''), 'data-var': p[0] },
          h('span', { class: 'viz-name' }, p[0]), h('span', { class: 'viz-val' }, valueEl(p[1], heapNow)));
      });
    }

    function objectEl(id, obj, heapNow) {
      var title, body = [];
      var kind = obj.kind;
      if (kind === 'list' || kind === 'tuple' || kind === 'set') {
        var n = (obj.items || []).length + (obj.more || 0);
        title = obj.type + (n ? '' : ' (empty)');
        var items = (obj.items || []).map(function (v, i) {
          return h('div', { class: 'viz-item' },
            kind === 'set' ? null : h('span', { class: 'viz-idx' }, obj.fields ? obj.fields[i] : String(i)),
            h('span', { class: 'viz-cell' }, valueEl(v, heapNow)));
        });
        if (obj.more) items.push(h('div', { class: 'viz-more' }, '+' + obj.more + ' more'));
        body.push(h('div', { class: 'viz-items' }, items));
      } else if (kind === 'dict') {
        var size = (obj.entries || []).length + (obj.more || 0);
        title = obj.type + (size ? '' : ' (empty)');
        body = (obj.entries || []).map(function (e) {
          return h('div', { class: 'viz-entry' }, h('span', { class: 'viz-key' }, valueEl(e[0], heapNow)), h('span', { class: 'viz-val' }, valueEl(e[1], heapNow)));
        });
        if (obj.more) body.push(h('div', { class: 'viz-more' }, '+' + obj.more + ' more'));
      } else if (kind === 'function') {
        title = 'function ' + obj.name + obj.sig;
        body = rowsTable((obj.defaults || []).map(function (d) { return ['default ' + d[0], d[1]]; }), heapNow, 'viz-var viz-default')
          .concat(rowsTable((obj.cells || []).map(function (c) { return ['captured ' + c[0], c[1]]; }), heapNow, 'viz-var viz-cell-var'));
      } else if (kind === 'generator') {
        var st = { created: 'not started', suspended: 'paused at line ' + obj.line, running: 'running', closed: 'finished' }[obj.state] || obj.state;
        title = 'generator ' + obj.name;
        body.push(h('div', { class: 'viz-gen-state', 'data-state': obj.state }, st));
        body = body.concat(rowsTable(obj.vars || [], heapNow));
      } else if (kind === 'class') {
        title = 'class ' + obj.name;
        body = rowsTable(obj.vars || [], heapNow);
      } else if (kind === 'instance') {
        title = obj.type + ' object';
        body = rowsTable(obj.vars || [], heapNow);
        if (!body.length) body.push(h('div', { class: 'viz-empty' }, 'no attributes yet'));
      } else {
        title = obj.type;
        body.push(h('div', { class: 'viz-repr' }, obj.repr));
      }
      return h('div', { class: 'viz-obj', 'data-id': id, 'data-kind': kind },
        h('div', { class: 'viz-obj-title' }, title), body);
    }

    function outputUpTo(n) {
      var events = state.res.events || [], left = n, parts = [];
      for (var i = 0; i < events.length && left > 0; i++) {
        var text = events[i][1].slice(0, left);
        left -= text.length;
        parts.push(h('span', { class: 'o-' + events[i][0] }, text));
      }
      return parts;
    }

    function go(i) {
      var n = count();
      if (!n) return;
      i = Math.max(0, Math.min(n - 1, i));
      state.i = i;
      var res = state.res, step = res.steps[i], before = i > 0 ? res.steps[i - 1] : null;
      var isLast = i === n - 1;
      slider.value = i;
      stepText.textContent = 'Step ' + (i + 1) + ' of ' + n;
      first.disabled = prev.disabled = i === 0;
      next.disabled = last.disabled = isLast;
      what.textContent = describe(step, res, isLast);
      what.setAttribute('data-event', step.event);

      U.$$('.viz-line', codeBox).forEach(function (l) {
        var ln = +l.getAttribute('data-line');
        l.classList.toggle('is-current', ln === step.line);
        l.classList.toggle('is-prev', !!before && ln === before.line && ln !== step.line);
      });
      var cur = U.$('.viz-line.is-current', codeBox);
      if (cur && codeBox.scrollHeight > codeBox.clientHeight) {
        var top = cur.offsetTop - codeBox.offsetTop;
        if (top < codeBox.scrollTop || top > codeBox.scrollTop + codeBox.clientHeight - 24) codeBox.scrollTop = top - codeBox.clientHeight / 3;
      }

      out.innerHTML = '';                 // left empty, it shows "Nothing printed yet" (css)
      outputUpTo(step.out).forEach(function (p) { out.appendChild(p); });
      if (isLast && res.error && res.error.type !== 'StepLimit') {
        out.appendChild(h('span', { class: 'o-error' }, (step.out && !/\n$/.test(out.textContent) ? '\n' : '') + (res.error.traceback || res.error.type + ': ' + res.error.message)));
      }

      frames.innerHTML = '';
      step.stack.forEach(function (f, k) {
        var prevFrame = before && before.stack[k] && before.stack[k].name === f.name ? before.stack[k] : null;
        var rows = rowsTable(f.vars, step.heap, 'viz-var', prevFrame ? prevFrame.vars : (before ? [] : null));
        if (f.ret) rows.push(h('div', { class: 'viz-var viz-ret', 'data-var': 'Return value' },
          h('span', { class: 'viz-name' }, step.event === 'yield' ? 'Yielded' : 'Return value'), h('span', { class: 'viz-val' }, valueEl(f.ret, step.heap))));
        if (!rows.length) rows.push(h('div', { class: 'viz-empty' }, 'no names yet'));
        frames.appendChild(h('div', { class: 'viz-frame' + (k === step.stack.length - 1 ? ' is-current' : ''), 'data-name': f.name },
          h('div', { class: 'viz-frame-title' }, f.name === 'Global frame' ? f.name : funcName(f) + (/^class /.test(f.name) ? '' : '()'),
            k === step.stack.length - 1 && f.name !== 'Global frame' ? h('span', { class: 'viz-frame-line' }, 'line ' + step.line) : null),
          rows));
      });

      heap.innerHTML = '';
      var rows = layout(step);
      if (!rows.length) heap.appendChild(h('div', { class: 'viz-empty' }, 'No objects yet: numbers and strings are drawn inside the frames.'));
      rows.forEach(function (row) {
        heap.appendChild(h('div', { class: 'viz-row' }, row.map(function (id) { return objectEl(id, step.heap[id], step.heap); })));
      });
      drawArrows();
    }

    function drawArrows() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (!el.isConnected || !count()) return;
      var box = diagram.getBoundingClientRect();
      svg.setAttribute('width', diagram.scrollWidth);
      svg.setAttribute('height', diagram.scrollHeight);
      var defs = document.createElementNS(SVG, 'defs');
      var marker = document.createElementNS(SVG, 'marker');
      marker.setAttribute('id', 'viz-head-' + uid);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '7');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('orient', 'auto-start-reverse');
      var tipPath = document.createElementNS(SVG, 'path');
      tipPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
      tipPath.setAttribute('class', 'viz-arrow-head');
      marker.appendChild(tipPath);
      defs.appendChild(marker);
      svg.appendChild(defs);
      U.$$('.viz-ref', diagram).forEach(function (dot) {
        var target = U.$('.viz-obj[data-id="' + dot.getAttribute('data-ref') + '"]', diagram);
        if (!target) return;
        var a = dot.getBoundingClientRect(), b = target.getBoundingClientRect();
        var sx = a.left + a.width / 2 - box.left, sy = a.top + a.height / 2 - box.top;
        var ex = b.left - box.left - 1, ey = b.top - box.top + Math.min(15, b.height / 2);
        // forward arrows curve gently; one back to an object on the left loops out and comes in from
        // its left side, without swinging past the picture's own left edge
        var reach = ex > sx ? Math.max(36, (ex - sx) / 2) : 40;
        var c2x = Math.max(2, ex - (ex > sx ? reach : 28));
        var p = document.createElementNS(SVG, 'path');
        p.setAttribute('d', 'M ' + sx + ' ' + sy + ' C ' + (sx + reach) + ' ' + sy + ', ' + c2x + ' ' + ey + ', ' + ex + ' ' + ey);
        p.setAttribute('class', 'viz-arrow');
        p.setAttribute('data-to', dot.getAttribute('data-ref'));
        p.setAttribute('marker-end', 'url(#viz-head-' + uid + ')');
        svg.appendChild(p);
      });
    }
    var uid = ++create.seq;

    function listing(code) {
      codeBox.innerHTML = '';
      String(code).replace(/\n$/, '').split('\n').forEach(function (line, k) {
        var text = h('code', { class: 'viz-src cm-s-pylt' });
        U.highlightInto(text, line || ' ', 'python');
        codeBox.appendChild(h('div', { class: 'viz-line', role: 'listitem', 'data-line': k + 1 },
          h('span', { class: 'viz-ln' }, String(k + 1)), text));
      });
    }

    function show(res, code, opts) {
      opts = opts || {};
      state.res = res;
      state.code = code;
      listing(code);
      var n = count();
      slider.max = Math.max(0, n - 1);
      var e = res.error;
      var msg = null;
      if (res.limit) msg = e && e.message;
      else if (!n && e) msg = (res.phase === 'syntax' ? 'Python could not read the program, so nothing ran. ' : '') + e.type + (e.line ? ' on line ' + e.line : '') + ': ' + e.message;
      else if (!n) msg = 'The program has no steps to show.';
      note.hidden = !msg;
      note.textContent = msg || '';
      if (res.phase === 'syntax' && e && e.line) {
        var bad = U.$('.viz-line[data-line="' + e.line + '"]', codeBox);
        if (bad) bad.classList.add('is-error');
      }
      el.setAttribute('data-state', 'ready');
      el.classList.toggle('viz-has-steps', n > 0);
      if (!n) {
        frames.innerHTML = heap.innerHTML = out.innerHTML = '';
        stepText.textContent = 'No steps';
        what.textContent = '';
        [first, prev, next, last].forEach(function (b) { b.disabled = true; });
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        return;
      }
      var start = n - 1;
      if (opts.at) {
        for (var k = 0; k < n; k++) if (opts.at(res.steps[k], k)) { start = k; break; }
      }
      go(start);
    }

    return {
      el: el, show: show, go: go, count: count,
      index: function () { return state.i; },
      setRunning: function () { el.setAttribute('data-state', 'running'); what.textContent = 'Running your program and recording every step…'; },
      destroy: function () { if (observer) observer.disconnect(); window.removeEventListener('resize', redraw); }
    };
  }
  create.seq = 0;

  U.viz = { create: create, describe: describe };

  /** Hand a program to the Visualize page and switch to it. */
  U.openInVisualize = function (snippet) {
    U.store.set('visualize.incoming', { title: snippet.title || '', code: snippet.code || '', stdin: snippet.stdin || '' });
    U.go('#/visualize');
  };

  /* ---------- the page (#/visualize) ---------- */

  var STARTER = (U.data.vizExamples && U.data.vizExamples[0] && U.data.vizExamples[0].code) || 'a = [1, 2]\nb = a\nb.append(3)\nprint(a)\n';

  U.views.visualize = {
    render: function (root, params, query) {
      var cur = U.store.get('visualize.current', { code: STARTER, stdin: '' });
      var incoming = U.store.get('visualize.incoming', null);
      var example = query && query.example ? U.find('vizExamples', query.example) : null;
      var auto = false, title = '';
      if (incoming) {
        U.store.del('visualize.incoming');
        cur = { code: incoming.code, stdin: incoming.stdin || '' };
        title = incoming.title;
        auto = true;
      } else if (example) {
        cur = { code: example.code, stdin: example.stdin || '' };
        title = example.title;
        auto = true;
      }
      U.store.set('visualize.current', cur);

      root.appendChild(h('div', { class: 'page-head' },
        h('div', { class: 'head-row' }, h('h1', null, 'Visualize'), U.layout.full(root, { kind: 'visualize', root: root }).btn),
        h('p', { html: U.mdInline('Run a program one step at a time and watch what Python does: each call gets a **frame** for its names, ' +
          'and every name is an **arrow to an object**. Two arrows to one box means two names for the same object, ' +
          'which is how Python variables work (Java object references behave the same way). Numbers and strings are drawn inside the frames to keep the picture small.') })));

      var exampleSel = h('select', { class: 'select', id: 'viz-examples', 'aria-label': 'Load an example' },
        h('option', { value: '' }, 'Examples…'),
        (U.data.vizExamples || []).map(function (x) { return h('option', { value: x.id }, x.title); }));
      var runBtn = h('button', { class: 'btn btn-primary', id: 'viz-run', type: 'button', title: 'Ctrl+Enter' }, '▶ Visualize');
      var editor = U.editor.create(null, {
        value: cur.code, height: U.layout.editorHeight('visualize', 300), onRun: function () { run(); },
        onChange: function (v) { U.store.set('visualize.current', { code: v, stdin: stdin.get() }); }
      });
      var stdin = U.stdinBox(cur.stdin, function (v) { U.store.set('visualize.current', { code: editor.get(), stdin: v }); });
      var editBox = h('div', { class: 'viz-edit stack-tight', id: 'viz-edit-box' },
        h('div', { class: 'row' }, runBtn, exampleSel, h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small', type: 'button', onclick: function () { U.openInPlayground({ title: 'From Visualize', code: editor.get(), stdin: stdin.get() }); } }, 'Open in Playground')),
        editor.el, U.layout.grip({ kind: 'visualize', editors: [editor], def: 300 }).el, stdin.el,
        h('p', { class: 'faint' }, 'Visualize records at most 1,000 steps, so keep programs short. It runs the same Python as the Run button, with the same Input box.'));
      var heading = h('b', { class: 'viz-title' });
      var viewBox = h('div', { class: 'viz-view stack-tight', id: 'viz-view-box', hidden: true },
        h('div', { class: 'row' }, h('button', { class: 'btn', id: 'viz-edit-btn', type: 'button' }, '✎ Edit code'), heading,
          h('span', { class: 'spacer' }), h('span', { class: 'faint viz-keys' }, '← → step, Home / End jump')));
      root.appendChild(editBox);
      root.appendChild(viewBox);
      editor.refresh();
      var viz = create(viewBox);

      function showEditor() {
        viewBox.hidden = true;
        editBox.hidden = false;
        editor.refresh();
        editor.focus();
      }
      function run() {
        var code = editor.get();
        editBox.hidden = true;
        viewBox.hidden = false;
        heading.textContent = title || '';
        viz.setRunning();
        return U.run.trace({ code: code, stdin: stdin.get() }).then(function (res) {
          if (!viewBox.isConnected) return res;
          viz.show(res, code, { at: function () { return true; } });      // start at step 1, like a debugger
          title = '';
          return res;
        });
      }
      runBtn.addEventListener('click', function () { run(); });
      U.$('#viz-edit-btn', viewBox).addEventListener('click', showEditor);
      exampleSel.addEventListener('change', function () {
        var x = U.find('vizExamples', exampleSel.value);
        exampleSel.value = '';
        if (!x) return;
        editor.set(x.code);
        stdin.set(x.stdin || '');
        U.store.set('visualize.current', { code: x.code, stdin: x.stdin || '' });
        title = x.title;
        run();
      });
      function onKey(e) {
        if (viewBox.hidden || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;   // a divider took the key
        var t = document.activeElement;
        if (t && t.getAttribute && t.getAttribute('role') === 'separator') return;
        if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) && t.type !== 'range' || (t.closest && t.closest('.CodeMirror')))) return;
        var keys = { ArrowLeft: -1, ArrowRight: 1 };
        if (keys[e.key]) { e.preventDefault(); viz.go(viz.index() + keys[e.key]); }
        else if (e.key === 'Home') { e.preventDefault(); viz.go(0); }
        else if (e.key === 'End') { e.preventDefault(); viz.go(viz.count() - 1); }
      }
      document.addEventListener('keydown', onKey);
      this.cleanup = function () { document.removeEventListener('keydown', onKey); viz.destroy(); };

      U.visualize = { editor: editor, viz: viz, run: run, setStdin: function (v) { stdin.set(v); } };
      if (auto) run();
    },
    destroy: function () {
      if (this.cleanup) this.cleanup();
      this.cleanup = null;
      U.visualize = null;
    }
  };
  U.route('visualize', U.views.visualize);
})(window.PYLT);
