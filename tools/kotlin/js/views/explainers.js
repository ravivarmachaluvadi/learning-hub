/*
 * views/explainers.js - the explainers (#/explain, #/explain/<id>, #/explain/<id>/<example>): one hard
 * idea taken apart a step at a time, with a picture, then the same program run for real. The React
 * Learning Tool's explainers, adapted: the content is in data/explainers.js, which lists the operations.
 *
 * An explainer's page has its examples as chips. For the chosen one: Reset, Back, Step, Play and End
 * (and the ← and → keys) move through its steps; the code shows the line each step is on; the picture
 * shows what the steps' operations have built so far, drawn in one of four ways:
 *   machine    a suspend function's state machine: the thread's call stack (or "free"), the
 *              continuation object's label and saved fields, and whether it runs, waits or is done
 *   tree       the jobs, each under its parent, each active, completing, cancelling, cancelled, failed
 *              or done
 *   timeline   fake milliseconds running down the page, a column per lane (the producer, each
 *              collector), each mark at its time; drawn top to bottom so it fits a phone
 *   stack      the call stack at the moment a lambda runs, and whether a lambda object exists
 * Every picture also has "Printed": each `log` so far, which is what the real program prints by then.
 * tests/test_content.py proves the program prints exactly the steps' logs; tests/test_ui.py ("explain")
 * steps every example and checks the picture against its own reading of the operations.
 *
 * Through ktlearn, "Run it" runs the program and shows what it really printed; opened from disk, the
 * page says how to start ktlearn, and every step still works.
 *
 * For the tests: KLT.explain.stateAt(picture, example, k) is the picture after the first k steps.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var PLAY_EVERY = 1100;      // ms between steps while playing
  var STATE_LABELS = { active: 'active', completing: 'waiting for its children', cancelling: 'cancelling', cancelled: 'cancelled', failed: 'failed', done: 'done' };
  var PHASE_LABELS = { running: 'running on the thread', suspended: 'suspended: the thread is free', done: 'done: returned its result' };
  var current = null;         // the page on show: {keydown, stop}

  function explainers() { return U.data.explainers || []; }

  function fresh() {
    return { printed: [], label: null, saves: [], stack: [], phase: null, jobs: [], lanes: [], clock: 0, marks: [], lambda: null };
  }

  /** The picture after the first k steps of an example. */
  function stateAt(picture, ex, k) {
    var st = fresh();
    for (var i = 0; i < k && i < ex.steps.length; i++) {
      ex.steps[i][1].forEach(function (op) {
        var sp = op.indexOf(' '), verb = sp < 0 ? op : op.slice(0, sp), arg = sp < 0 ? '' : op.slice(sp + 1);
        if (verb === 'log') st.printed.push(arg);
        else if (verb === 'label') st.label = arg;
        else if (verb === 'save') {
          var eq = arg.indexOf('='), name = arg.slice(0, eq), value = arg.slice(eq + 1);
          var f = st.saves.filter(function (s) { return s.name === name; })[0];
          if (f) f.value = value; else st.saves.push({ name: name, value: value });
        }
        else if (verb === 'stack') st.stack = arg.trim() ? arg.split('>').map(function (s) { return s.trim(); }) : [];
        else if (verb === 'phase') st.phase = arg;
        else if (verb === 'node') {
          var p = arg.split(' '), id = p[0], parent = p[1], label = p.slice(2).join(' ');
          st.jobs.push({ id: id, parent: parent === '-' ? null : parent, label: label, state: 'active' });
        }
        else if (verb === 'state') {
          var q = arg.split(' ');
          st.jobs.forEach(function (j) { if (j.id === q[0]) j.state = q[1]; });
        }
        else if (verb === 'lane') {
          var s2 = arg.indexOf(' ');
          st.lanes.push({ id: arg.slice(0, s2), label: arg.slice(s2 + 1) });
        }
        else if (verb === 'at') st.clock = +arg;
        else if (verb === 'mark') {
          var s3 = arg.indexOf(' ');
          st.marks.push({ at: st.clock, lane: arg.slice(0, s3), text: arg.slice(s3 + 1), step: i });
        }
        else if (verb === 'lambda') st.lambda = arg;
      });
    }
    return st;
  }

  /* ---------- the four pictures ---------- */

  function drawMachine(st) {
    var frames = st.stack.length ? h('div', { class: 'xp-frames' }, st.stack.map(function (f) { return h('div', { class: 'xp-frame', 'data-frame': f }, h('code', null, f)); }))
      : h('p', { class: 'xp-free' }, 'Free: running other coroutines (or idle)');
    return [
      h('div', { class: 'xp-box' }, h('div', { class: 'xp-box-title' }, 'The thread is running'), frames),
      h('div', { class: 'xp-box' }, h('div', { class: 'xp-box-title' }, 'The continuation object (what the function keeps while it waits)'),
        h('div', { class: 'xp-fields' },
          h('div', { class: 'xp-field-row' }, h('code', null, 'label'), h('span', { class: 'xp-label', 'data-value': st.label === null ? '' : st.label }, st.label === null ? '–' : st.label)),
          st.saves.map(function (s) {
            return h('div', { class: 'xp-field xp-field-row', 'data-name': s.name, 'data-value': s.value }, h('code', null, s.name), h('span', null, s.value));
          }))),
      st.phase ? h('p', { class: 'xp-phase xp-phase-' + st.phase }, PHASE_LABELS[st.phase] || st.phase) : null
    ];
  }

  function drawTree(st) {
    function kids(parent) {
      var mine = st.jobs.filter(function (j) { return j.parent === parent; });
      if (!mine.length) return null;
      return h('ul', { class: 'xp-tree' }, mine.map(function (j) {
        return h('li', null,
          h('div', { class: 'xp-job xp-job-' + j.state, 'data-id': j.id, 'data-state': j.state },
            h('span', { class: 'xp-job-name' }, j.label), h('span', { class: 'xp-job-state' }, STATE_LABELS[j.state] || j.state)),
          kids(j.id));
      }));
    }
    return [st.jobs.length ? kids(null) : h('p', { class: 'xp-free' }, 'No coroutine has started yet.')];
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
    return [h('p', { class: 'xp-clock' }, 'Now: ', h('b', null, st.clock + ' ms'), ' on the fake clock'), grid];
  }

  function drawStack(st) {
    return [
      h('div', { class: 'xp-box' }, h('div', { class: 'xp-box-title' }, 'The call stack (the innermost call on top)'),
        st.stack.length ? h('div', { class: 'xp-frames' }, st.stack.map(function (f) { return h('div', { class: 'xp-frame', 'data-frame': f }, h('code', null, f)); }))
          : h('p', { class: 'xp-free' }, 'Nothing is running yet.')),
      st.lambda ? h('p', { class: 'xp-lambda xp-lambda-' + st.lambda, 'data-on': st.lambda },
        st.lambda === 'yes' ? 'A lambda object exists: the function received it, and calls it.' : 'No lambda object: the lambda\'s code was copied into the caller.') : null
    ];
  }

  var DRAW = { machine: drawMachine, tree: drawTree, timeline: drawTimeline, stack: drawStack };

  /* ---------- the index (#/explain) ---------- */

  function indexPage(root) {
    root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Explainers'),
      h('p', null, 'The ideas that are hard to see in code, taken apart one step at a time with a picture. Every step is proved: the program it ' +
        'describes prints exactly what the steps say, on your kotlinc. Through ktlearn, "Run it" shows the real run.')));
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
    var code = h('div', { class: 'xp-code cm-s-klt', role: 'region', 'aria-label': 'The program' });
    var says = h('div', { class: 'xp-says', 'aria-live': 'polite' });
    var picture = h('div', { class: 'xp-picture' });
    var printed = h('pre', { class: 'code xp-printed', 'aria-label': 'Printed so far' });
    var left = h('div', { class: 'xp-left' }, code);
    var right = h('div', { class: 'xp-right' }, says, picture, h('div', { class: 'xp-box-title' }, 'Printed'), printed);
    var body = h('div', { class: 'xp-body' }, left, right);
    page.appendChild(chips);
    page.appendChild(desc);
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
      if (!panel) { panel = U.runPanel({ title: 'What it really printed' }); panelHolder.appendChild(panel.el); }
      runBtn.disabled = true;
      panel.start();
      U.run.exec({ code: ex.code, stdin: '' }, panel.append).then(function (res) { panel.show(res); runBtn.disabled = false; });
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
        U.highlightInto(text, line || ' ', 'kotlin');
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
      picture.setAttribute('data-clock', String(st.clock));
      if (st.phase) picture.setAttribute('data-phase', st.phase); else picture.removeAttribute('data-phase');
      DRAW[x.picture](st, k).forEach(function (el) { if (el) picture.appendChild(el); });
      printed.textContent = st.printed.join('\n');
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
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable) || (t && t.closest && t.closest('.CodeMirror, dialog[open], .splitter'))) return;
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
})(window.KLT);
