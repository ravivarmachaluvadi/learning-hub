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
 * Every picture also has "Printed": each `log` so far, which is what the real program prints by then.
 * tests/test_content.py proves the program prints exactly the steps' logs; tests/test_ui.py ("explain")
 * steps every example to its end.
 *
 * Through jclearn, "Run it" runs the program (an example with jdk: '21' on the JDK 21 found on this PC);
 * opened from disk, the page says how to start jclearn, and every step still works.
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
    return { printed: [], carriers: [], vts: [], jobs: [], lanes: [], clock: 0, marks: [], frames: [], children: [] };
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

  var DRAW = { carriers: drawCarriers, timeline: drawTimeline, tree: drawTree, bindings: drawBindings };

  /* ---------- the index (#/explain) ---------- */

  function indexPage(root) {
    root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Explainers'),
      h('p', null, 'The ideas that are hard to see in code, taken apart one step at a time with a picture. Every step is proved: the program it ' +
        'describes prints exactly what the steps say, on your JDK. Through jclearn, "Run it" shows the real run.')));
    root.appendChild(h('div', { class: 'cards' }, explainers().map(function (x) {
      var t = U.find('tracks', x.track);
      return h('a', { class: 'card xp-card', href: '#/explain/' + x.id },
        h('div', { class: 'card-kicker' }, (t ? t.title : x.track) + ' · ' + U.plural(x.examples.length, 'example', 'examples')),
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

  U.views.explain = {
    render: function (root, params) {
      var x = params[0] && U.find('explainers', params[0]);
      if (x) explainerPage(root, x, params[1]); else indexPage(root);
    },
    destroy: function () { if (current) current.stop(); current = null; }
  };
  U.route('explain', U.views.explain);
  U.explain = { stateAt: stateAt };
})(window.JCLT);
