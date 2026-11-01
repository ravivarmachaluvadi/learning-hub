/*
 * views/explainers.js - the explainers (#/explain, #/explain/<id>, #/explain/<id>/<example>, batch 2): one
 * hard idea taken apart a step at a time, with a picture, then the same program run for real. The Kotlin
 * Learning Tool's explainers, adapted: the content is in data/explainers.js, which lists the operations.
 *
 * An explainer's page has its examples as chips. For the chosen one: Reset, Back, Step, Play and End
 * (and the ← and → keys) move through its steps; the code shows the line each step is on; the picture
 * shows what the steps' operations have built so far, drawn in one of four ways:
 *   carriers   the carrier threads, each with the virtual thread mounted on it (pinned or not), and the
 *              virtual threads that are ready (waiting for a carrier), waiting (unmounted) or done
 *   timeline   milliseconds running down the page, a column per lane; drawn top to bottom so it fits a phone
 *   tree       a structured scope and its subtasks, each under its parent: running, succeeded, failed,
 *              cancelled, waiting in join() or closed
 *   bindings   the scoped-value bindings the current thread sees (innermost on top), and what each thread
 *              it starts sees
 *   memory     (batch 3) main memory's shared variables, each thread's own view of them (what it has read
 *              or computed), the monitors it holds or waits for, and the happens-before edges made so far
 * Every picture also has "Printed": each `log` so far, which is what the real program prints by then.
 * tests/test_content.py proves the program prints exactly the steps' logs; tests/test_ui.py ("explain")
 * steps every example to its end.
 *
 * Through jclearn, "Run it" runs the program (an example with jdk: '21' on the JDK 21 found on this PC);
 * opened from disk, the page says how to start jclearn, and every step still works.
 *
 * The throughput explainer (batch 4) is not stepped: sliders drive a small model of one service, simulate(params).
 *
 * For the tests: JCLT.explain.stateAt(picture, example, k) is the picture after the first k steps.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var PLAY_EVERY = 1100;      // ms between steps while playing
  var TREE_LABELS = { running: 'running', success: 'succeeded', failed: 'failed', cancelled: 'cancelled (interrupted)', joining: 'waiting in join()', closed: 'closed' };
  var VT_LABELS = { ready: 'ready: waiting for a carrier', running: 'running', pinned: 'pinned: blocked, holding its carrier', waiting: 'waiting: unmounted, its stack on the heap', done: 'done' };
  var current = null;         // the page on show: {stop}

  function explainers() { return U.data.explainers || []; }

  function fresh() {
    return { printed: [], carriers: [], vts: [], jobs: [], lanes: [], clock: 0, marks: [], frames: [], children: [],
      mem: { cells: [], threads: [], edges: [], changed: {} } };
  }

  /** The memory picture's operations (batch 3): each thread's own view of the shared variables, main memory, locks, edges. */
  function memoryOp(st, verb, arg, last) {
    var m = st.mem, w = arg.split(' ');
    function thread(id) { return m.threads.filter(function (t) { return t.id === id; })[0]; }
    function cell(name) { return m.cells.filter(function (c) { return c.name === name; })[0]; }
    function mark(key) { if (last) m.changed[key] = true; }
    var t = thread(w[0]);
    if (verb === 'cell') { m.cells.push({ name: w[0], value: w.slice(1).join(' ') }); mark('cell:' + w[0]); }
    else if (verb === 'thread') { m.threads.push({ id: w[0], label: w.slice(1).join(' ') || w[0], view: {}, order: [], holds: [], blocked: null, done: false }); mark('thread:' + w[0]); }
    else if (verb === 'edge') { m.edges.push(arg); if (last) m.changed['edge:' + (m.edges.length - 1)] = true; }
    else if (!t) return;
    else if (verb === 'read' || verb === 'set') {
      var c = cell(w[1]);
      if (t.order.indexOf(w[1]) < 0) t.order.push(w[1]);
      t.view[w[1]] = verb === 'read' ? (c ? c.value : '?') : w.slice(2).join(' ');
      mark('view:' + t.id + ':' + w[1]);
    }
    else if (verb === 'write') { var c2 = cell(w[1]); if (c2) { c2.value = t.view[w[1]]; mark('cell:' + w[1]); } }
    else if (verb === 'lock') { t.blocked = null; if (t.holds.indexOf(w[1]) < 0) t.holds.push(w[1]); mark('thread:' + t.id); }
    else if (verb === 'unlock') { t.holds = t.holds.filter(function (x) { return x !== w[1]; }); mark('thread:' + t.id); }
    else if (verb === 'block') { t.blocked = w[1]; mark('thread:' + t.id); }
    else if (verb === 'done') { t.done = true; t.blocked = null; mark('thread:' + t.id); }
  }

  function words(arg) { var sp = arg.indexOf(' '); return sp < 0 ? [arg, ''] : [arg.slice(0, sp), arg.slice(sp + 1)]; }

  /** The picture after the first k steps of an example. */
  function stateAt(picture, ex, k) {
    var st = fresh();
    function vt(id) { return st.vts.filter(function (v) { return v.id === id; })[0]; }
    function carrier(id) { return st.carriers.filter(function (c) { return c.id === id; })[0]; }
    function off(v) { st.carriers.forEach(function (c) { if (c.vt === v.id) c.vt = null; }); v.on = null; }
    for (var i = 0; i < k && i < ex.steps.length; i++) {
      ex.steps[i][1].forEach(function (op) {
        var w = words(op), verb = w[0], arg = w[1];
        if (verb === 'log') { st.printed.push(arg); return; }
        if (picture === 'memory') { memoryOp(st, verb, arg, i === k - 1); return; }
        var a = words(arg);
        if (verb === 'carrier') st.carriers.push({ id: a[0], label: a[1], vt: null });
        else if (verb === 'vt') st.vts.push({ id: a[0], label: a[1], state: 'ready', on: null, pinned: false });
        else if (verb === 'mount') {
          var v = vt(a[0]), c = carrier(a[1]);
          if (v && c) { off(v); if (c.vt) { var o = vt(c.vt); if (o) { o.on = null; } } c.vt = v.id; v.on = c.id; v.state = v.pinned ? 'pinned' : 'running'; }
        }
        else if (verb === 'unmount') { var u = vt(a[0]); if (u) { off(u); u.state = 'waiting'; u.pinned = false; } }
        else if (verb === 'ready') { var r = vt(a[0]); if (r) { off(r); r.state = 'ready'; r.pinned = false; } }
        else if (verb === 'pin') { var p = vt(a[0]); if (p) { p.pinned = true; p.state = 'pinned'; } }
        else if (verb === 'done') { var d = vt(a[0]); if (d) { off(d); d.state = 'done'; d.pinned = false; } }
        else if (verb === 'node') {
          var parts = arg.split(' ');
          st.jobs.push({ id: parts[0], parent: parts[1] === '-' ? null : parts[1], label: parts.slice(2).join(' '), state: 'running' });
        }
        else if (verb === 'state') st.jobs.forEach(function (j) { if (j.id === a[0]) j.state = a[1]; });
        else if (verb === 'lane') st.lanes.push({ id: a[0], label: a[1] });
        else if (verb === 'at') st.clock = +arg;
        else if (verb === 'mark') st.marks.push({ at: st.clock, lane: a[0], text: a[1], step: i });
        else if (verb === 'bind') { var eq = arg.indexOf('='); st.frames.push({ name: arg.slice(0, eq), value: arg.slice(eq + 1) }); }
        else if (verb === 'pop') st.frames.pop();
        else if (verb === 'child') {
          var inherits = a[0] === 'inherits';
          st.children.push({ label: a[1], inherits: inherits, sees: inherits ? visible(st.frames) : [] });
        }
      });
    }
    return st;
  }

  /** The value each name has where the innermost binding wins: [{name, value}]. */
  function visible(frames) {
    var seen = {}, out = [];
    for (var i = frames.length - 1; i >= 0; i--) {
      if (seen[frames[i].name]) continue;
      seen[frames[i].name] = true;
      out.unshift({ name: frames[i].name, value: frames[i].value });
    }
    return out;
  }

  /* ---------- the four pictures ---------- */

  function vtChip(v) {
    return h('div', { class: 'xp-vt xp-vt-' + v.state, 'data-id': v.id, 'data-state': v.state }, h('b', null, v.label), h('span', null, VT_LABELS[v.state] || v.state));
  }

  function drawCarriers(st) {
    var byState = function (s) { return st.vts.filter(function (v) { return v.state === s; }); };
    return [
      h('div', { class: 'xp-box' }, h('div', { class: 'xp-box-title' }, 'Carrier threads (platform threads of the scheduler)'),
        st.carriers.length ? h('div', { class: 'xp-carriers' }, st.carriers.map(function (c) {
          var v = c.vt ? st.vts.filter(function (x) { return x.id === c.vt; })[0] : null;
          return h('div', { class: 'xp-carrier' + (v && v.pinned ? ' xp-carrier-pinned' : ''), 'data-id': c.id },
            h('div', { class: 'xp-carrier-name' }, c.label), v ? vtChip(v) : h('p', { class: 'xp-free' }, 'free'));
        })) : h('p', { class: 'xp-free' }, 'No carrier yet.')),
      [['ready', 'Ready, queued for a carrier'], ['waiting', 'Waiting: unmounted, stack on the heap'], ['done', 'Done']].map(function (g) {
        var list = byState(g[0]);
        return list.length ? h('div', { class: 'xp-box' }, h('div', { class: 'xp-box-title' }, g[1]), h('div', { class: 'xp-vts' }, list.map(vtChip))) : null;
      })
    ];
  }

  function drawTree(st) {
    function kids(parent) {
      var mine = st.jobs.filter(function (j) { return j.parent === parent; });
      if (!mine.length) return null;
      return h('ul', { class: 'xp-tree' }, mine.map(function (j) {
        return h('li', null,
          h('div', { class: 'xp-job xp-job-' + j.state, 'data-id': j.id, 'data-state': j.state },
            h('span', { class: 'xp-job-name' }, j.label), h('span', { class: 'xp-job-state' }, TREE_LABELS[j.state] || j.state)),
          kids(j.id));
      }));
    }
    return [st.jobs.length ? kids(null) : h('p', { class: 'xp-free' }, 'No scope is open yet.')];
  }

  function drawTimeline(st, k) {
    var cols = st.lanes.length;
    var grid = h('div', { class: 'xp-timeline', style: { gridTemplateColumns: '4.5em repeat(' + Math.max(cols, 1) + ', minmax(0, 1fr))' } });
    grid.appendChild(h('div', { class: 'xp-tl-head' }, 'time'));
    st.lanes.forEach(function (l) { grid.appendChild(h('div', { class: 'xp-tl-head xp-lane', 'data-lane': l.id }, l.label)); });
    var times = [];
    st.marks.forEach(function (m) { if (times.indexOf(m.at) < 0) times.push(m.at); });
    times.forEach(function (t) {
      grid.appendChild(h('div', { class: 'xp-tl-time' }, t + ' ms'));
      st.lanes.forEach(function (l) {
        var here = st.marks.filter(function (m) { return m.at === t && m.lane === l.id; });
        grid.appendChild(h('div', { class: 'xp-tl-cell' }, here.map(function (m) {
          return h('div', { class: 'xp-mark' + (m.step === k - 1 ? ' xp-new' : ''), 'data-lane': m.lane }, m.text);
        })));
      });
    });
    return [h('p', { class: 'xp-clock' }, 'About ', h('b', null, st.clock + ' ms'), ' after the start'), grid];
  }

  function drawBindings(st) {
    var now = visible(st.frames);
    return [
      h('div', { class: 'xp-box' }, h('div', { class: 'xp-box-title' }, 'Bindings in force (the innermost on top)'),
        st.frames.length ? h('div', { class: 'xp-frames' }, st.frames.slice().reverse().map(function (f, i) {
          var shadowed = now.every(function (n) { return n.name !== f.name || n.value !== f.value; }) || (i > 0 && st.frames.slice().reverse().slice(0, i).some(function (g) { return g.name === f.name; }));
          return h('div', { class: 'xp-frame' + (shadowed ? ' xp-shadowed' : ''), 'data-frame': f.name + '=' + f.value }, h('code', null, f.name + ' = ' + f.value),
            shadowed ? h('span', { class: 'faint' }, ' (hidden by the binding above)') : null);
        })) : h('p', { class: 'xp-free' }, 'Nothing is bound: get() would throw NoSuchElementException.')),
      st.children.length ? h('div', { class: 'xp-box' }, h('div', { class: 'xp-box-title' }, 'Threads it started, and what they see'),
        h('div', { class: 'xp-vts' }, st.children.map(function (c) {
          return h('div', { class: 'xp-vt ' + (c.inherits ? 'xp-vt-running' : 'xp-vt-waiting') }, h('b', null, c.label),
            h('span', null, c.sees.length ? c.sees.map(function (s) { return s.name + ' = ' + s.value; }).join(', ') : 'nothing bound'));
        }))) : null
    ];
  }

  function drawMemory(st) {
    var m = st.mem, ch = m.changed;
    function changed(key) { return ch[key] ? ' xp-mem-changed' : ''; }
    return [
      h('div', { class: 'xp-box xp-mem-main' }, h('div', { class: 'xp-box-title' }, 'Main memory: one copy of each shared variable'),
        m.cells.length ? h('div', { class: 'xp-mem-cells' }, m.cells.map(function (c) {
          return h('code', { class: 'xp-mem-cell' + changed('cell:' + c.name), 'data-cell': c.name }, c.name + ' = ' + c.value);
        })) : h('p', { class: 'xp-free' }, 'Nothing shared yet.')),
      m.threads.length ? h('div', { class: 'xp-mem-threads' }, m.threads.map(function (t) {
        var status = t.done ? 'ended' : t.blocked ? 'BLOCKED, waiting for the monitor of ' + t.blocked : t.holds.length ? 'holds the monitor of ' + t.holds.join(', ') : 'running';
        return h('div', { class: 'xp-box xp-mem-thread' + (t.done ? ' xp-mem-done' : t.blocked ? ' xp-mem-blocked' : t.holds.length ? ' xp-mem-holding' : '') + changed('thread:' + t.id), 'data-thread': t.id },
          h('div', { class: 'xp-box-title' }, 'Thread ' + t.label + ': its own view'),
          h('div', { class: 'xp-mem-status' }, status),
          t.order.length ? h('div', { class: 'xp-mem-cells' }, t.order.map(function (name) {
            return h('code', { class: 'xp-mem-cell' + changed('view:' + t.id + ':' + name) }, name + ' = ' + t.view[name]);
          })) : h('p', { class: 'xp-free' }, 'Has read nothing yet.'));
      })) : null,
      m.edges.length ? h('div', { class: 'xp-box xp-mem-edges' }, h('div', { class: 'xp-box-title' }, 'Happens-before edges made so far'),
        h('ul', null, m.edges.map(function (e, i) { return h('li', { class: changed('edge:' + i).trim() || null }, e); }))) : null
    ];
  }

  var DRAW = { carriers: drawCarriers, timeline: drawTimeline, tree: drawTree, bindings: drawBindings, memory: drawMemory };

  /* ---------- the index (#/explain) ---------- */

  function indexPage(root) {
    root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Explainers'),
      h('p', null, 'The ideas that are hard to see in code, taken apart one step at a time with a picture. Every step is proved: the program it ' +
        'describes prints exactly what the steps say, on your JDK. Through jclearn, "Run it" shows the real run.')));
    root.appendChild(h('div', { class: 'cards' }, explainers().map(function (x) {
      var t = U.find('tracks', x.track);
      return h('a', { class: 'card xp-card', href: '#/explain/' + x.id },
        h('div', { class: 'card-kicker' }, (t ? t.title : x.track) + ' · ' + (x.picture === 'simulator' ? 'a simulator' : U.plural(x.examples.length, 'example', 'examples'))),
        h('h3', null, x.title), h('p', { class: 'muted', style: { margin: 0 } }, x.summary));
    })));
  }

  /* ---------- one explainer (#/explain/<id>/<example>) ---------- */

  function explainerPage(root, x, exId) {
    var ex = x.examples.filter(function (e) { return e.id === exId; })[0] || x.examples[0];
    var k = 0, timer = null;
    var t = U.find('tracks', x.track);
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/explain' }, 'Explainers'), ' › ', t ? h('a', { href: '#/lessons?track=' + t.id }, t.title) : x.track));
    var page = h('article', { class: 'xp-page', 'data-id': x.id });
    root.appendChild(page);
    page.appendChild(h('h1', null, x.title));
    page.appendChild(U.enhance(h('div', { class: 'xp-intro', html: U.md(x.intro) })));

    var chips = h('div', { class: 'row xp-chips', role: 'group', 'aria-label': 'Examples' });
    var desc = h('div', { class: 'xp-desc' });
    var count = h('span', { class: 'xp-count', 'aria-live': 'polite' });
    var btn = function (cls, text, label, fn) { return h('button', { class: 'btn btn-small ' + cls, type: 'button', 'aria-label': label, onclick: fn }, text); };
    var resetBtn = btn('xp-reset', '⏮ Reset', 'Back to the start', function () { stop(); go(0); });
    var backBtn = btn('xp-back', '◀ Back', 'One step back', function () { stop(); go(k - 1); });
    var stepBtn = btn('btn-primary xp-step', 'Step ▶', 'One step forward', function () { stop(); go(k + 1); });
    var playBtn = btn('xp-play', '▶ Play', 'Play the steps', function () { if (timer) stop(); else play(); });
    var endBtn = btn('xp-end', 'End ⏭', 'Go to the last step', function () { stop(); go(ex.steps.length); });
    var controls = h('div', { class: 'row xp-controls' }, resetBtn, backBtn, stepBtn, playBtn, endBtn, h('span', { class: 'spacer' }), count);
    var code = h('div', { class: 'xp-code cm-s-jclt', role: 'region', 'aria-label': 'The program' });
    var says = h('div', { class: 'xp-says', 'aria-live': 'polite' });
    var picture = h('div', { class: 'xp-picture' });
    var printed = h('pre', { class: 'code xp-printed', 'aria-label': 'Printed so far' });
    var left = h('div', { class: 'xp-left' }, code);
    var right = h('div', { class: 'xp-right' }, says, picture, h('div', { class: 'xp-box-title' }, 'Printed'), printed);
    var body = h('div', { class: 'xp-body' }, left, right);
    var jdkNote = h('p', { class: 'xp-jdk faint' });
    page.appendChild(chips);
    page.appendChild(desc);
    page.appendChild(jdkNote);
    page.appendChild(controls);
    page.appendChild(body);
    U.layout.split(body, { key: 'explain', def: 50, minLeft: 280, minRight: 300, label: 'Resize the program and the picture' });
    var full = U.layout.full(root, { kind: 'explain', root: root });
    controls.insertBefore(full.btn, count);

    // Run it: the real program on this PC
    var runNote = h('div', { class: 'xp-run-note' });
    var runBtn = h('button', { class: 'btn btn-primary xp-run', type: 'button' }, '▶ Run it');
    var panelHolder = h('div');
    page.appendChild(h('h2', null, 'Now for real'));
    page.appendChild(h('p', { class: 'muted' }, 'Run the program on your PC: it prints what the steps above say it prints.'));
    page.appendChild(runNote);
    page.appendChild(h('div', { class: 'row run-bar' }, runBtn,
      h('button', { class: 'btn', type: 'button', onclick: function () { U.openInPlayground({ title: x.title + ': ' + ex.label, code: ex.code }); } }, 'Open in Playground')));
    page.appendChild(panelHolder);
    var panel = null;
    runBtn.addEventListener('click', function () {
      if (!panel) { panel = U.runPanel({ title: 'What it really printed' + (ex.jdk ? ' on Java ' + ex.jdk : '') }); panelHolder.appendChild(panel.el); }
      runBtn.disabled = true;
      panel.start();
      U.run.exec({ code: ex.code, stdin: '', jdk: ex.jdk || null }, panel.append).then(function (res) { panel.show(res); runBtn.disabled = false; });
    });
    U.run.ready().then(function () { if (!U.run.available() && runNote.isConnected) runNote.appendChild(U.serverNote('#/explain/' + x.id)); });

    if (x.outro) page.appendChild(U.enhance(h('div', { class: 'xp-outro', html: U.md(x.outro) })));
    if ((x.related || []).length) {
      page.appendChild(h('div', { class: 'row see-also' }, h('span', { class: 'faint' }, 'Learn more:'), x.related.map(function (r) {
        var m = /^(\w+):(.+)$/.exec(r);
        return h('a', { class: 'btn btn-small', href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
      })));
    }

    x.examples.forEach(function (e) {
      chips.appendChild(h('button', { class: 'btn btn-small xp-chip', type: 'button', 'data-ex': e.id, onclick: function () { if (e !== ex) choose(e, true); } }, e.label));
    });

    function drawCode() {
      code.innerHTML = '';
      ex.code.replace(/\n$/, '').split('\n').forEach(function (line, i) {
        var text = h('span', { class: 'xp-line-text' });
        U.highlightInto(text, line || ' ', 'java');
        code.appendChild(h('div', { class: 'xp-line', 'data-line': String(i + 1) }, h('span', { class: 'xp-ln', 'aria-hidden': 'true' }, String(i + 1)), text));
      });
    }

    /** Show example e from its start; picked by a click, it also goes into the address (without a new render). */
    function choose(e, picked) {
      stop();
      ex = e;
      U.$$('.xp-chip', chips).forEach(function (b) {
        var on = b.getAttribute('data-ex') === ex.id;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      desc.innerHTML = '';
      if (ex.desc) desc.appendChild(U.enhance(h('div', { html: U.md(ex.desc) })));
      jdkNote.textContent = ex.jdk ? 'This example runs on Java ' + ex.jdk + ' (the JDK ' + ex.jdk + ' on your PC), to show how it behaved before Java 24.' : '';
      jdkNote.hidden = !ex.jdk;
      if (picked) {
        try { history.replaceState(null, '', '#/explain/' + x.id + '/' + ex.id); } catch (err) { /* file:// may refuse: the chip still works */ }
      }
      if (panel) { panel.el.remove(); panel = null; }
      drawCode();
      go(0);
    }

    function go(n) {
      k = Math.max(0, Math.min(ex.steps.length, n));
      var st = stateAt(x.picture, ex, k);
      var step = k ? ex.steps[k - 1] : null;
      count.textContent = 'Step ' + k + ' of ' + ex.steps.length;
      U.$$('.xp-line', code).forEach(function (l) { l.classList.toggle('on', !!step && +l.getAttribute('data-line') === step[0]); });
      var on = U.$('.xp-line.on', code);
      if (on && code.scrollHeight > code.clientHeight) on.scrollIntoView({ block: 'nearest' });
      says.innerHTML = '';
      says.appendChild(U.enhance(h('div', { html: U.md(step ? step[2] : 'Press **Step** (or →) to start, or **Play** to watch it run.') })));
      picture.innerHTML = '';
      picture.setAttribute('data-picture', x.picture);
      DRAW[x.picture](st, k).forEach(function (el) {
        (Array.isArray(el) ? el : [el]).forEach(function (e2) { if (e2) picture.appendChild(e2); });
      });
      printed.innerHTML = '';
      st.printed.forEach(function (line) { printed.appendChild(h('span', { class: 'xp-out' }, line)); printed.appendChild(document.createTextNode('\n')); });
      printed.classList.toggle('empty', !st.printed.length);
      resetBtn.disabled = backBtn.disabled = k === 0;
      stepBtn.disabled = endBtn.disabled = k === ex.steps.length;
    }

    function play() {
      if (k >= ex.steps.length) go(0);
      playBtn.textContent = '❚❚ Pause';
      playBtn.setAttribute('aria-label', 'Pause');
      timer = setInterval(function () {
        if (!page.isConnected || k >= ex.steps.length) { stop(); return; }
        go(k + 1);
        if (k >= ex.steps.length) stop();
      }, PLAY_EVERY);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      playBtn.textContent = '▶ Play';
      playBtn.setAttribute('aria-label', 'Play the steps');
    }

    function keydown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || !page.isConnected) return;
      var tgt = e.target, tag = tgt && tgt.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tgt && tgt.isContentEditable) || (tgt && tgt.closest && tgt.closest('.CodeMirror, dialog[open], .splitter'))) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); stop(); go(k + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); go(k - 1); }
    }
    document.addEventListener('keydown', keydown);
    current = { stop: function () { stop(); document.removeEventListener('keydown', keydown); } };
    choose(ex);
  }

  /* ---------- the throughput simulator (batch 4) ---------- */

  /**
   * One service, one deterministic run. Requests arrive evenly for `seconds`. Each takes a thread for its whole
   * serviceMs (threads 0: no limit, as on virtual threads), and needs a connection for the first holdMs of it
   * (connections 0: no database). Whoever comes first gets the next free one.
   * -> {requests, capacity, limitedBy, throughput, p50, p99, maxLatency, peakInFlight, series: [in flight, per slice]}
   */
  function simulate(p) {
    var n = Math.max(1, Math.round(p.rps * p.seconds)), gap = 1000 / p.rps;
    var threads = p.threads > 0 ? new Array(p.threads).fill(0) : null;
    var conns = p.connections > 0 && p.holdMs > 0 ? new Array(p.connections).fill(0) : null;
    function earliest(a) { var b = 0; for (var i = 1; i < a.length; i++) if (a[i] < a[b]) b = i; return b; }
    var spans = [], latencies = [], last = 0;
    for (var i = 0; i < n; i++) {
      var arrive = i * gap, begin = arrive, t = -1, c = -1;
      if (threads) { t = earliest(threads); begin = Math.max(begin, threads[t]); }
      var holdEnd = begin;
      if (conns) { c = earliest(conns); begin = Math.max(begin, conns[c]); holdEnd = begin + p.holdMs; conns[c] = holdEnd; }
      var end = Math.max(holdEnd, begin) + (conns ? Math.max(0, p.serviceMs - p.holdMs) : p.serviceMs);
      if (threads) threads[t] = end;
      spans.push([arrive, end]);
      latencies.push(end - arrive);
      if (end > last) last = end;
    }
    var byThreads = threads ? p.threads * 1000 / p.serviceMs : Infinity;
    var byConns = conns ? p.connections * 1000 / p.holdMs : Infinity;
    var capacity = Math.min(byThreads, byConns);
    var sorted = latencies.slice().sort(function (a, b) { return a - b; });
    var SLICES = 40, series = new Array(SLICES).fill(0), events = [];
    spans.forEach(function (s) {
      var from = Math.floor(s[0] / last * SLICES), to = Math.min(SLICES - 1, Math.floor(s[1] / last * SLICES));
      for (var k = from; k <= to; k++) series[k]++;
      events.push([s[0], 1], [s[1], -1]);
    });
    events.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var now = 0, peak = 0;
    events.forEach(function (e) { now += e[1]; if (now > peak) peak = now; });
    return {
      requests: n, capacity: capacity, limitedBy: capacity >= p.rps ? 'nothing' : byConns < byThreads ? 'connections' : 'threads',
      throughput: n / (last / 1000), p50: sorted[Math.floor(n * 0.5)], p99: sorted[Math.min(n - 1, Math.floor(n * 0.99))],
      maxLatency: sorted[n - 1], peakInFlight: peak, series: series, lastMs: last
    };
  }

  var SLIDERS = [
    { key: 'rps', label: 'Requests a second', min: 10, max: 1000, step: 10 },
    { key: 'serviceMs', label: 'Each request takes (ms)', min: 10, max: 2000, step: 10 },
    { key: 'threads', label: 'Threads (0 = virtual threads: no limit)', min: 0, max: 400, step: 5 },
    { key: 'connections', label: 'Database connections (0 = no database)', min: 0, max: 100, step: 5 },
    { key: 'holdMs', label: 'Each holds a connection for (ms)', min: 0, max: 2000, step: 10 }
  ];

  function simulatorPage(root, x, exId) {
    var ex = x.examples.filter(function (e) { return e.id === exId; })[0] || x.examples[0];
    var p = Object.assign({}, ex.params);
    var t = U.find('tracks', x.track);
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/explain' }, 'Explainers'), ' › ', t ? h('a', { href: '#/lessons?track=' + t.id }, t.title) : x.track));
    var page = h('article', { class: 'xp-page sim-page', 'data-id': x.id });
    root.appendChild(page);
    page.appendChild(h('h1', null, x.title));
    page.appendChild(U.enhance(h('div', { class: 'xp-intro', html: U.md(x.intro) })));
    var chips = h('div', { class: 'row xp-chips', role: 'group', 'aria-label': 'Examples' });
    var desc = h('div', { class: 'xp-desc' });
    page.appendChild(chips);
    page.appendChild(desc);
    var controls = h('div', { class: 'card sim-controls' });
    var inputs = {};
    SLIDERS.forEach(function (s) {
      var value = h('output', { class: 'sim-value', 'data-for': s.key });
      var input = h('input', { type: 'range', class: 'sim-input', 'data-key': s.key, min: String(s.min), max: String(s.max), step: String(s.step), 'aria-label': s.label });
      input.addEventListener('input', function () { p[s.key] = +input.value; markChips(null); draw(); });
      inputs[s.key] = { input: input, value: value };
      controls.appendChild(h('label', { class: 'sim-slider' }, h('span', { class: 'sim-label' }, s.label), input, value));
    });
    page.appendChild(controls);
    var verdict = h('div', { class: 'xp-says sim-verdict', 'aria-live': 'polite' });
    var tiles = h('div', { class: 'sim-tiles' });
    var bars = h('div', { class: 'sim-bars', role: 'img' });
    page.appendChild(verdict);
    page.appendChild(tiles);
    page.appendChild(h('div', { class: 'xp-box-title' }, 'Requests in flight, from the first arrival to the last answer'));
    page.appendChild(bars);

    function tile(label, value, cls) {
      return h('div', { class: 'sim-tile ' + (cls || '') }, h('div', { class: 'sim-tile-value' }, value), h('div', { class: 'sim-tile-label' }, label));
    }
    function ms(v) { return v >= 1000 ? (v / 1000).toFixed(1) + ' s' : Math.round(v) + ' ms'; }
    function draw() {
      SLIDERS.forEach(function (s) { inputs[s.key].input.value = String(p[s.key]); inputs[s.key].value.textContent = String(p[s.key]); });
      var r = simulate(p);
      verdict.innerHTML = '';
      var text = r.limitedBy === 'nothing'
        ? 'The service keeps up: it could do **' + Math.round(r.capacity === Infinity ? p.rps : r.capacity) + '** a second' + (r.capacity === Infinity ? ' at least' : '') + ', and **' + p.rps + '** arrive.'
        : 'Limited by **' + r.limitedBy + '**: it can do **' + Math.round(r.capacity) + '** a second, and **' + p.rps + '** arrive, so a queue grows for as long as they keep coming.';
      verdict.appendChild(U.enhance(h('div', { html: U.md(text) })));
      verdict.setAttribute('data-limit', r.limitedBy);
      tiles.innerHTML = '';
      tiles.appendChild(tile('served a second', String(Math.round(r.throughput)), 'sim-throughput'));
      tiles.appendChild(tile('typical wait (p50)', ms(r.p50), 'sim-p50'));
      tiles.appendChild(tile('slowest 1% (p99)', ms(r.p99), 'sim-p99'));
      tiles.appendChild(tile('most in flight at once', String(r.peakInFlight), 'sim-peak'));
      bars.innerHTML = '';
      bars.setAttribute('aria-label', 'At most ' + r.peakInFlight + ' requests in flight');
      var top = Math.max.apply(null, r.series) || 1;
      r.series.forEach(function (v) { bars.appendChild(h('span', { class: 'sim-bar', style: { height: Math.max(2, Math.round(v / top * 100)) + '%' } })); });
    }
    function markChips(id) {
      U.$$('.xp-chip', chips).forEach(function (b) {
        var on = b.getAttribute('data-ex') === id;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    function choose(e, picked) {
      ex = e;
      p = Object.assign({}, e.params);
      markChips(e.id);
      desc.innerHTML = '';
      if (e.desc) desc.appendChild(U.enhance(h('div', { html: U.md(e.desc) })));
      if (picked) { try { history.replaceState(null, '', '#/explain/' + x.id + '/' + e.id); } catch (err) { /* file:// may refuse: the chip still works */ } }
      draw();
    }
    x.examples.forEach(function (e) {
      chips.appendChild(h('button', { class: 'btn btn-small xp-chip', type: 'button', 'data-ex': e.id, onclick: function () { choose(e, true); } }, e.label));
    });

    // the model against the real thing
    page.appendChild(h('h2', null, 'Now for real'));
    page.appendChild(h('p', { class: 'muted' }, x.proof.note));
    var runNote = h('div', { class: 'xp-run-note' });
    var runBtn = h('button', { class: 'btn btn-primary xp-run', type: 'button' }, '▶ Run it');
    var panelHolder = h('div');
    page.appendChild(runNote);
    page.appendChild(h('div', { class: 'row run-bar' }, runBtn,
      h('button', { class: 'btn', type: 'button', onclick: function () { U.openInPlayground({ title: x.title, code: x.proof.code }); } }, 'Open in Playground')));
    page.appendChild(panelHolder);
    var panel = null;
    runBtn.addEventListener('click', function () {
      if (!panel) { panel = U.runPanel({ title: 'What it really printed' }); panelHolder.appendChild(panel.el); }
      runBtn.disabled = true;
      panel.start();
      U.run.exec({ code: x.proof.code, stdin: '', timeout: 60 }, panel.append).then(function (res) { panel.show(res); runBtn.disabled = false; });
    });
    U.run.ready().then(function () { if (!U.run.available() && runNote.isConnected) runNote.appendChild(U.serverNote('#/explain/' + x.id)); });
    if (x.outro) page.appendChild(U.enhance(h('div', { class: 'xp-outro', html: U.md(x.outro) })));
    if ((x.related || []).length) {
      page.appendChild(h('div', { class: 'row see-also' }, h('span', { class: 'faint' }, 'Learn more:'), x.related.map(function (r) {
        var m = /^(\w+):(.+)$/.exec(r);
        return h('a', { class: 'btn btn-small', href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
      })));
    }
    choose(ex);
  }

  U.views.explain = {
    render: function (root, params) {
      var x = params[0] && U.find('explainers', params[0]);
      if (x && x.picture === 'simulator') simulatorPage(root, x, params[1]);
      else if (x) explainerPage(root, x, params[1]);
      else indexPage(root);
    },
    destroy: function () { if (current) current.stop(); current = null; }
  };
  U.route('explain', U.views.explain);
  U.explain = { stateAt: stateAt, simulate: simulate };
})(window.JCLT);
