/*
 * views/explainers-js.js - the JavaScript explainers: the event loop and event bubbling.
 *
 * The event loop is a step-by-step animation of a short program: the call stack, the timers and
 * requests waiting in the browser, the microtask and task queues, and the console. Each example
 * also runs for real in a preview, and the tests check that the real console prints the same lines
 * in the same order as the animation - so the animation cannot tell a different story.
 *
 * Event bubbling records real clicks: every listener in the preview reports its event's phase,
 * target and currentTarget, and the boxes light up in the order the event reached them.
 */
(function (U) {
  'use strict';
  var h = U.h;

  U.data.explainers.push(
    { id: 'event-loop', title: 'The event loop', summary: 'Step through what JavaScript runs when: the call stack, the task queue and the microtask queue - and why await does not block.', keywords: ['event loop', 'async', 'await', 'promise', 'then', 'settimeout', 'microtask', 'task queue', 'call stack', 'callback', 'blocking', 'single thread'] },
    { id: 'bubbling', title: 'Event bubbling and capturing', summary: 'Click nested boxes and watch the click travel down to its target and back up. stopPropagation, target and currentTarget.', keywords: ['bubbling', 'bubble', 'capturing', 'capture', 'propagation', 'stoppropagation', 'target', 'currenttarget', 'eventphase', 'delegation', 'click'] }
  );

  /* ===================================================================================
   * 8. The event loop
   *
   * Each step is [line, operations, explanation]. line is the code line to highlight (1-based,
   * 0 = none). Operations change the picture:
   *   push X / pop          a function goes on / comes off the call stack
   *   wait ID X / done ID   something waits in the browser (a timer, a request) / stops waiting
   *   task ID X / micro ID X   a function joins the task queue / the microtask queue
   *   run task / run micro  the event loop moves the next queued function onto the stack
   *   log X                 a line appears in the console
   *   phase P               what the event loop is doing: script, micro, task or idle
   *   busy on / busy off    the stack is stuck in a long loop
   * =================================================================================== */
  var EXAMPLES = [
    {
      id: 'timeout-zero', label: 'setTimeout(…, 0)',
      desc: 'A timer of 0 ms still waits until the script has finished.',
      code: 'console.log("A");\nsetTimeout(() => console.log("B"), 0);\nconsole.log("C");',
      steps: [
        [0, ['phase script', 'push script'], 'The browser runs your whole script as one **task**. It goes on the **call stack**: the list of functions running right now. There is only one stack, so JavaScript does one thing at a time.'],
        [1, ['push console.log("A")', 'log A'], 'Line 1 calls `console.log`. It goes on top of the stack and prints **A**.'],
        [2, ['pop', 'push setTimeout(…, 0)', 'wait t1 timer 0 ms → () => console.log("B")'], '`setTimeout` does **not** run your function. It hands it to the browser together with a timer, and returns at once. The function now waits outside JavaScript.'],
        [2, ['pop', 'done t1', 'task t1 () => console.log("B")'], 'The timer said 0 ms, so it is due straight away: the browser puts the function in the **task queue**. It cannot run yet, because the stack is still busy with your script.'],
        [3, ['push console.log("C")', 'log C'], 'Line 3 prints **C**. The queued function is still waiting.'],
        [0, ['pop', 'pop', 'phase micro'], 'The script has finished, so the stack is empty. The **event loop** now looks at the microtask queue first. It is empty.'],
        [2, ['phase task', 'run task'], 'Next, the event loop takes the oldest **task** from the task queue and puts it on the stack.'],
        [2, ['push console.log("B")', 'log B'], 'It prints **B** - last, even though the timer said 0 ms. "0 ms" means "as soon as the stack is free", never "right now".'],
        [0, ['pop', 'pop', 'phase idle'], 'Everything is empty. The event loop waits for the next thing to happen: a click, a timer, a reply from the network.']
      ]
    },
    {
      id: 'promise-vs-timeout', label: 'Promise vs setTimeout',
      desc: 'Promise callbacks (microtasks) run before timer callbacks (tasks).',
      code: 'console.log("1 script start");\nsetTimeout(() => console.log("4 timeout"), 0);\nPromise.resolve().then(() => console.log("3 promise"));\nconsole.log("2 script end");',
      steps: [
        [0, ['phase script', 'push script'], 'The script starts, as one task on the call stack.'],
        [1, ['push console.log(…)', 'log 1 script start'], 'Line 1 prints **1 script start**.'],
        [2, ['pop', 'push setTimeout(…, 0)', 'wait t1 timer 0 ms → () => console.log("4 timeout")'], '`setTimeout` hands its function to the browser\'s timer and returns at once…'],
        [2, ['pop', 'done t1', 'task t1 () => console.log("4 timeout")'], '…and since 0 ms is up straight away, the function joins the **task queue**.'],
        [3, ['push Promise.resolve().then(…)', 'micro m1 () => console.log("3 promise")'], 'The promise is already resolved, so `.then` puts its function in the **microtask queue**: a second, more urgent queue.'],
        [4, ['pop', 'push console.log(…)', 'log 2 script end'], 'Line 4 prints **2 script end**. Both queues now hold a function.'],
        [0, ['pop', 'pop', 'phase micro', 'run micro'], 'The stack is empty. The event loop runs **every microtask first**, before any task: the promise callback goes on the stack.'],
        [3, ['push console.log(…)', 'log 3 promise'], 'It prints **3 promise**. The timer callback is still waiting in the task queue.'],
        [0, ['pop', 'pop', 'phase task', 'run task'], 'The microtask queue is empty now, so the event loop takes the next **task**: the timer callback.'],
        [2, ['push console.log(…)', 'log 4 timeout'], 'It prints **4 timeout**.'],
        [0, ['pop', 'pop', 'phase idle'], 'Done. The rule: first the code that is running, then **all** microtasks (promise callbacks), then **one** task (a timer, a click, a network reply) - and round again.']
      ]
    },
    {
      id: 'await', label: 'await does not block',
      desc: 'await pauses only its own function; the rest of the page carries on.',
      code: 'async function load() {\n  console.log("2 asking the server…");\n  const res = await fetch("/api/hello");\n  console.log("4 answer:", res.status);\n}\nconsole.log("1 before load()");\nload();\nconsole.log("3 after load() - the page stays free");',
      steps: [
        [0, ['phase script', 'push script'], 'The script starts. Lines 1-5 only **define** `load`; nothing in it runs yet.'],
        [6, ['push console.log(…)', 'log 1 before load()'], 'Line 6 prints **1 before load()**.'],
        [7, ['pop', 'push load()'], 'Line 7 calls `load()`. An `async` function starts like any other: it goes on the stack and runs **straight away**, up to its first `await`.'],
        [2, ['push console.log(…)', 'log 2 asking the server…'], 'Line 2 prints **2 asking the server…**.'],
        [3, ['pop', 'push fetch("/api/hello")', 'wait f1 network: GET /api/hello'], '`fetch` starts the request in the browser, outside JavaScript, and immediately returns a **promise**: an object for the answer that has not arrived yet.'],
        [3, ['pop', 'pop', 'wait p1 load() paused at line 3 until the promise settles'], '`await` meets an unfinished promise. It does **not** sit and wait. It parks the rest of `load` (lines 3-4) with the promise and **returns** from `load()`. The stack drops back to the script.'],
        [8, ['push console.log(…)', 'log 3 after load() - the page stays free'], 'The script carries on and prints **3 after load()**. Nothing is blocked: a click on the page would be handled right now.'],
        [0, ['pop', 'pop', 'phase idle'], 'The script is done and the stack is empty. The event loop is idle - timers and clicks could run - while the request is still on its way.'],
        [0, ['done f1', 'done p1', 'phase micro', 'micro m1 rest of load(), with res = the response'], 'The server answers (here after 0.3 seconds). The promise settles, so the rest of `load` is queued as a **microtask**.'],
        [3, ['run micro'], 'The stack is empty, so the event loop runs that microtask: `load` **resumes** right after the `await`, with `res` set to the response.'],
        [4, ['push console.log(…)', 'log 4 answer: 200'], 'Line 4 prints **4 answer: 200**.'],
        [0, ['pop', 'pop', 'phase idle'], '`load` is finished. `await` paused only `load`, never the page. In Java terms it is not `future.get()` (which blocks the thread) but `future.thenAccept(rest of the method)`.']
      ]
    },
    {
      id: 'blocking', label: 'A long loop blocks',
      desc: 'While the stack is busy, nothing else can run - not even a 0 ms timer.',
      code: 'setTimeout(() => console.log("2 timer (asked for 0 ms)"), 0);\nconst end = Date.now() + 1000;\nwhile (Date.now() < end) {} // busy for 1 second\nconsole.log("1 loop finished");',
      steps: [
        [0, ['phase script', 'push script'], 'The script starts.'],
        [1, ['push setTimeout(…, 0)', 'wait t1 timer 0 ms → () => console.log("2 timer…")'], 'Line 1 hands a 0 ms timer to the browser.'],
        [1, ['pop', 'done t1', 'task t1 () => console.log("2 timer…")'], 'It is due at once, so its function waits in the **task queue**.'],
        [3, ['busy on'], 'The `while` loop keeps the stack busy for a whole second. The timer function is ready, but it **cannot** run: tasks start only when the stack is empty. The page is frozen too - no clicks, no scrolling, no repainting - because the browser draws the page between tasks.'],
        [4, ['busy off', 'push console.log(…)', 'log 1 loop finished'], 'One second later the loop ends, and line 4 prints **1 loop finished**.'],
        [0, ['pop', 'pop', 'phase micro'], 'The stack is finally empty. No microtasks are waiting.'],
        [1, ['phase task', 'run task'], 'The event loop takes the timer task - a whole second late.'],
        [1, ['push console.log(…)', 'log 2 timer (asked for 0 ms)'], 'It prints **2 timer (asked for 0 ms)**. A timer is a *minimum* delay, never an interruption. Long work should be split into small pieces (or moved to a Web Worker) so the page stays responsive.'],
        [0, ['pop', 'pop', 'phase idle'], 'Idle again.']
      ]
    }
  ];

  var PHASES = {
    '': 'Not started yet. Press Step.',
    script: 'Running a task: your script',
    micro: 'Stack empty → run all microtasks first',
    task: 'No microtasks left → take the next task',
    idle: 'Waiting for something to happen'
  };

  function freshState() { return { stack: [], apis: [], micro: [], tasks: [], log: [], phase: '', busy: false, seq: 0 }; }

  function apply(st, ops) {
    ops.forEach(function (op) {
      var sp = op.indexOf(' '), name = sp < 0 ? op : op.slice(0, sp), rest = sp < 0 ? '' : op.slice(sp + 1);
      if (name === 'phase') st.phase = rest;
      else if (name === 'push') st.stack.push({ id: 's' + (++st.seq), text: rest });
      else if (name === 'pop') st.stack.pop();
      else if (name === 'log') st.log.push({ id: 'l' + st.log.length, text: rest });
      else if (name === 'busy') st.busy = rest === 'on';
      else if (name === 'done') st.apis = st.apis.filter(function (x) { return x.id !== 'w' + rest; });
      else if (name === 'run') {
        var item = (rest === 'task' ? st.tasks : st.micro).shift();
        if (item) st.stack.push({ id: 's' + (++st.seq), text: item.text });
      } else if (name === 'wait' || name === 'task' || name === 'micro') {
        var sp2 = rest.indexOf(' ');
        var id = rest.slice(0, sp2), text = rest.slice(sp2 + 1);
        var list = name === 'wait' ? st.apis : name === 'task' ? st.tasks : st.micro;
        list.push({ id: name.charAt(0) + id, text: text });
      }
    });
  }

  function stateAt(ex, k) {
    var st = freshState();
    for (var i = 0; i < k; i++) apply(st, ex.steps[i][1]);
    st.line = k ? ex.steps[k - 1][0] : 0;
    st.say = k ? ex.steps[k - 1][2] : 'Press **Step** to run the code one move at a time, or **Play** to watch it run. ' + ex.desc;
    return st;
  }

  function eventLoop(main, ex) {
    U.explainerKit.head(main, ex, 'JavaScript runs on **one thread**: one call stack, one thing at a time. Everything that happens *later* - timers, clicks, network replies, promise callbacks - waits in a queue until the stack is empty. The **event loop** is the browser\'s rule for what runs next. Pick an example and step through it; then run it for real and compare.');
    var exState = { ex: EXAMPLES[0], step: 0 };
    var playing = null;
    var controls = h('div', { class: 'ex-controls' });
    var out = h('div', { class: 'ex-out' });
    main.appendChild(h('div', { class: 'ex-layout' }, controls, out));

    var picker = U.chipGroup({
      name: 'Example',
      values: EXAMPLES.map(function (x) { return { value: x.id, label: x.label, desc: x.desc }; }),
      get: function () { return exState.ex.id; },
      set: function (id) { stop(); exState.ex = EXAMPLES.filter(function (x) { return x.id === id; })[0]; exState.step = 0; drawCode(); draw(); resetReal(); }
    });
    controls.appendChild(h('div', { class: 'control el-examples' }, h('div', { class: 'control-head' }, h('span', { class: 'control-name' }, 'Example')), picker.el));

    function btn(act, label, title) { return h('button', { class: 'btn btn-small', type: 'button', 'data-act': act, title: title }, label); }
    var bReset = btn('reset', '⏮ Reset', 'Back to the start'), bBack = btn('back', '◀ Back', 'One step back');
    var bStep = btn('step', 'Step ▶', 'One step forward'), bPlay = btn('play', '▶ Play', 'Step by itself'), bEnd = btn('end', 'End ⏭', 'Jump to the end');
    bStep.classList.add('btn-primary');
    var stepEl = h('span', { class: 'el-step faint' });
    controls.appendChild(h('div', { class: 'control' }, h('div', { class: 'row el-buttons' }, bReset, bBack, bStep, bPlay, bEnd), h('div', { style: { marginTop: '6px' } }, stepEl)));
    var codeBox = h('pre', { class: 'el-code cm-s-uilt', 'aria-label': 'The example code' });
    controls.appendChild(h('div', null, h('div', { class: 'preview-label' }, 'The code'), codeBox));
    controls.appendChild(U.callout('java', 'Java analogy', U.md('Like Swing\'s **Event Dispatch Thread**: one thread runs every listener, and `SwingUtilities.invokeLater(r)` queues `r` to run once the current work is done - that is `setTimeout(r, 0)`. A long `actionPerformed` freezes a Swing window exactly the way a long loop freezes a page.')));

    var say = h('div', { class: 'callout callout-info el-say', 'aria-live': 'polite' });
    var loop = h('div', { class: 'el-loop' });
    function panel(key, title, sub) {
      var list = h('div', { class: 'el-list' });
      var el = h('div', { class: 'el-panel', 'data-panel': key }, h('div', { class: 'el-panel-head' }, h('b', null, title), h('span', { class: 'faint' }, sub)), list);
      return { el: el, list: list };
    }
    var P = {
      stack: panel('stack', 'Call stack', 'running now (top runs)'),
      apis: panel('apis', 'Waiting in the browser', 'timers, requests'),
      micro: panel('micro', 'Microtask queue', 'promise callbacks, after await'),
      tasks: panel('tasks', 'Task queue', 'timers, clicks, events'),
      console: panel('console', 'Console', 'what the code printed')
    };
    out.appendChild(say);
    out.appendChild(loop);
    out.appendChild(h('div', { class: 'el-machine' }, P.stack.el, P.apis.el, P.micro.el, P.tasks.el, P.console.el));

    // --- the same code, run for real
    var con = U.preview.console(null);
    var realPreview = U.preview.create(null, { height: 54, baseCss: U.DEMO_BASE, title: 'The example, run for real', onConsole: function (e) { con.add(e); }, onReload: function () { con.clear(); } });
    var bReal = btn('real', '▶ Run it for real', 'Run the example in a real page and compare the console');
    bReal.classList.add('btn-primary');
    out.appendChild(h('div', { class: 'el-real stack' },
      h('div', { class: 'row el-buttons' }, bReal, h('span', { class: 'faint' }, 'The browser runs the same code. Its console should match the one above, line for line.')),
      realPreview.wrap, con.el));
    function resetReal() { realPreview.render({ html: '<p style="color: #5f6880">Press "Run it for real" to run the example in this page.</p>' }); }
    bReal.addEventListener('click', function () {
      realPreview.render({ html: '<p>This page ran the example. Its console output is below.</p>', css: '', js: exState.ex.code }, { force: true });
    });
    resetReal();

    function drawCode() {
      codeBox.innerHTML = '';
      exState.ex.code.split('\n').forEach(function (text, i) {
        var codeEl = h('span', { class: 'el-text' });
        if (window.CodeMirror && window.CodeMirror.runMode) window.CodeMirror.runMode(text, 'javascript', codeEl); else codeEl.textContent = text;
        codeBox.appendChild(h('div', { class: 'el-line', 'data-line': i + 1 }, h('span', { class: 'el-ln', 'aria-hidden': 'true' }, String(i + 1)), codeEl));
      });
    }

    function idsOf(st) {
      var o = {};
      ['stack', 'apis', 'micro', 'tasks', 'log'].forEach(function (k) { st[k].forEach(function (x) { o[k + x.id] = true; }); });
      return o;
    }
    function fill(p, key, items, old, empty) {
      p.list.innerHTML = '';
      if (!items.length) { p.list.appendChild(h('span', { class: 'el-empty' }, empty)); return; }
      items.forEach(function (x, i) {
        var extra = key === 'stack' && i === 0 ? ' el-top' : (key === 'micro' || key === 'tasks') && i === 0 ? ' el-next' : '';
        p.list.appendChild(h('div', { class: 'el-item' + (old[key + x.id] ? '' : ' el-new') + extra }, x.text));
      });
    }

    function draw() {
      var ex = exState.ex, k = exState.step, total = ex.steps.length;
      var st = stateAt(ex, k), old = idsOf(k ? stateAt(ex, k - 1) : freshState());
      fill(P.stack, 'stack', st.stack.slice().reverse(), old, '(empty)');
      fill(P.apis, 'apis', st.apis, old, '(nothing)');
      fill(P.micro, 'micro', st.micro, old, '(empty)');
      fill(P.tasks, 'tasks', st.tasks, old, '(empty)');
      fill(P.console, 'log', st.log, old, '(nothing printed yet)');
      if (st.busy) P.stack.list.appendChild(h('div', { class: 'el-busy' }, '⏳ stuck in the while loop for 1 second - nothing else can run'));
      P.stack.el.classList.toggle('el-active', st.phase === 'script' || st.busy);
      P.micro.el.classList.toggle('el-active', st.phase === 'micro');
      P.tasks.el.classList.toggle('el-active', st.phase === 'task');
      loop.innerHTML = '';
      loop.appendChild(h('span', { class: 'el-loop-icon' + (st.phase === 'micro' || st.phase === 'task' ? ' turning' : ''), 'aria-hidden': 'true' }, '↻'));
      loop.appendChild(h('span', null, h('b', null, 'Event loop: '), PHASES[st.phase] || ''));
      U.$$('.el-line', codeBox).forEach(function (l) { l.classList.toggle('el-line-on', +l.getAttribute('data-line') === st.line); });
      say.innerHTML = '<div class="callout-title">' + (k ? 'Step ' + k : 'Start') + '</div><div class="callout-body">' + U.md(st.say) + '</div>';
      stepEl.textContent = 'Step ' + k + ' of ' + total;
      stepEl.setAttribute('data-step', k);
      stepEl.setAttribute('data-total', total);
      bReset.disabled = bBack.disabled = k === 0;
      bStep.disabled = bEnd.disabled = k === total;
    }

    function go(k) { exState.step = Math.max(0, Math.min(exState.ex.steps.length, k)); draw(); }
    function stop() { if (playing) { clearInterval(playing); playing = null; } bPlay.textContent = '▶ Play'; }
    bReset.addEventListener('click', function () { stop(); go(0); });
    bBack.addEventListener('click', function () { stop(); go(exState.step - 1); });
    bStep.addEventListener('click', function () { stop(); go(exState.step + 1); });
    bEnd.addEventListener('click', function () { stop(); go(exState.ex.steps.length); });
    bPlay.addEventListener('click', function () {
      if (playing) { stop(); return; }
      if (exState.step >= exState.ex.steps.length) go(0);
      bPlay.textContent = '⏸ Pause';
      go(exState.step + 1);
      playing = setInterval(function () {
        if (!main.isConnected || exState.step >= exState.ex.steps.length) { stop(); return; }
        go(exState.step + 1);
      }, 1400);
    });

    drawCode();
    draw();

    // --- why await does not block
    main.appendChild(h('h2', null, 'Why await does not block'));
    main.appendChild(h('div', { class: 'card', html: U.md(
      '`await` looks like Java\'s `future.get()`, but it works the other way round. `get()` **blocks the thread**: nothing else runs on it until the answer arrives. ' +
      'JavaScript has only one thread, so it cannot afford that. Instead, `await` **splits the function in two**: the part before `await` runs now, and the rest is ' +
      'stored with the promise and runs later as a microtask, once the promise settles. Meanwhile the stack is empty, so clicks, timers and repainting carry on.\n\n' +
      '- **One stack:** JavaScript runs one thing at a time, from start to finish. Nothing interrupts a running function.\n' +
      '- **Microtasks first:** whenever the stack empties, *all* waiting microtasks run - promise callbacks (`.then`) and the rest of an `async` function after `await`.\n' +
      '- **Then one task:** a timer callback, a click listener, a network event. Then microtasks again, and so on, for as long as the page is open.\n' +
      '- **Drawing happens between tasks,** so a long loop freezes the page. Keep each piece of work short.') }));
    var cmp = h('div', { class: 'el-compare' });
    cmp.appendChild(U.codeBlock('// Java: get() blocks this thread until the answer arrives\nString body = client.sendAsync(req, ofString()).get().body();\n\n// Java: thenAccept() registers "the rest" and returns at once\nclient.sendAsync(req, ofString())\n      .thenAccept(res -> System.out.println(res.body()));', 'java', { label: 'Java', copy: false }).el);
    cmp.appendChild(U.codeBlock('// JavaScript: await is the thenAccept() version, written like get()\nasync function load() {\n  const res = await fetch("/api/hello");\n  console.log(res.status);   // "the rest": a microtask, later\n}', 'js', { label: 'JavaScript', copy: false }).el);
    main.appendChild(cmp);
  }

  /* ===================================================================================
   * 9. Event bubbling and capturing
   * =================================================================================== */

  /* Runs in the preview before the learner-visible code: log(e, which) records each listener call
     in window.__journey, prints it, and lights the boxes up one after another. */
  var BUBBLE_HELPER = '<script>(function () {\n' +
    '  var current = null, queue = [], timer = null;\n' +
    '  window.__journey = [];\n' +
    '  function unlight() { document.querySelectorAll(".box").forEach(function (b) { b.classList.remove("lit-capture", "lit-target", "lit-bubble"); }); }\n' +
    '  function play() {\n' +
    '    if (timer || !queue.length) return;\n' +
    '    var e = queue.shift(), el = document.getElementById(e.current);\n' +
    '    unlight();\n' +
    '    if (el) {\n' +
    '      el.classList.add("lit-" + e.phase);\n' +
    '      var hops = el.querySelector(":scope > .hops");\n' +
    '      if (!hops) { hops = document.createElement("span"); hops.className = "hops"; el.appendChild(hops); }\n' +
    '      var hop = document.createElement("span");\n' +
    '      hop.className = "hop hop-" + e.phase;\n' +
    '      hop.textContent = e.n + (e.phase === "capture" ? " ↓" : e.phase === "target" ? " ●" : " ↑");\n' +
    '      hops.appendChild(hop);\n' +
    '    }\n' +
    '    timer = setTimeout(function () { timer = null; play(); }, 600);\n' +
    '  }\n' +
    '  window.log = function (e, which) {\n' +
    '    if (e !== current) {\n' +
    '      current = e; window.__journey = []; queue = []; clearTimeout(timer); timer = null; unlight();\n' +
    '      document.querySelectorAll(".hops").forEach(function (x) { x.remove(); });\n' +
    '    }\n' +
    '    var phase = e.eventPhase === 1 ? "capture" : e.eventPhase === 2 ? "target" : "bubble";\n' +
    '    var entry = { n: window.__journey.length + 1, phase: phase, which: which, current: e.currentTarget.id, target: e.target.id };\n' +
    '    window.__journey.push(entry);\n' +
    '    queue.push(entry);\n' +
    '    console.log(entry.n + ". " + (phase === "capture" ? "↓ capturing" : phase === "target" ? "● at the target" : "↑ bubbling") +\n' +
    '      " - " + which + " on #" + entry.current + " - e.target is #" + entry.target);\n' +
    '    play();\n' +
    '  };\n' +
    '})();</' + 'script>\n' +
    '<style>.hops { position: absolute; top: 6px; right: 8px; display: flex; gap: 4px; pointer-events: none; }\n' +
    '.hop { font: 700 12px/1 system-ui, sans-serif; padding: 4px 7px; border-radius: 99px; color: #fff; }\n' +
    '.hop-capture { background: #c2410c; } .hop-target { background: #be185d; } .hop-bubble { background: #1f7a43; }</style>';

  var BOXES_HTML = '<div class="box" id="outer">\n  <div class="box" id="middle">\n    <div class="box" id="inner"></div>\n  </div>\n</div>';
  var BOXES_CSS = '.box {\n  position: relative;\n  padding: 30px 16px 16px;\n  border: 2px solid #4f6fd8;\n  border-radius: 12px;\n  background: #eef1fb;\n  cursor: pointer;\n  transition: background .25s, box-shadow .25s;\n}\n' +
    '.box::before {\n  content: "#" attr(id);\n  position: absolute;\n  top: 8px;\n  left: 10px;\n  font: 700 13px/1 ui-monospace, monospace;\n  color: #33449a;\n}\n' +
    '#middle {\n  background: #dfe5fb;\n}\n#inner {\n  min-height: 44px;\n  background: #c9d3fa;\n}\n' +
    '.lit-capture {\n  background: #ffe2c8;\n  box-shadow: 0 0 0 4px #ff7a1a;\n}\n.lit-target {\n  background: #ffd6e4;\n  box-shadow: 0 0 0 4px #d6336c;\n}\n.lit-bubble {\n  background: #d9f2e1;\n  box-shadow: 0 0 0 4px #1f7a43;\n}';

  var PHASE_TEXT = { capture: '↓ capturing', target: '● at the target', bubble: '↑ bubbling' };

  function bubbling(main, ex) {
    U.explainerKit.head(main, ex, 'A click does not only reach the element you clicked. It travels **down** from the window through every ancestor to that element (the **capturing** phase), arrives at the **target**, then travels back **up** through the same ancestors (**bubbling**). Every listener on the way runs. Click any box in the preview and watch the order.');
    var s = { capture: true, bubble: true, stop: 'none', stopPhase: 'bubble' };
    var controls = h('div', { class: 'ex-controls' });
    var out = h('div', { class: 'ex-out' });
    main.appendChild(h('div', { class: 'ex-layout' }, controls, out));

    var capSw = U.switchControl('Capture listener (runs on the way down)', s.capture, function (on) { s.capture = on; update(); });
    var bubSw = U.switchControl('Bubble listener (runs on the way up - the default)', s.bubble, function (on) { s.bubble = on; update(); });
    capSw.input.setAttribute('aria-label', 'Capture listener on each box');
    bubSw.input.setAttribute('aria-label', 'Bubble listener on each box');
    controls.appendChild(h('div', { class: 'control', 'data-group': 'listeners' },
      h('div', { class: 'control-head' }, h('span', { class: 'control-name' }, 'Listeners on each box')),
      h('div', { class: 'stack', style: { gap: '6px' } }, capSw.el, bubSw.el)));

    var stopG = U.chipGroup({
      name: 'Call stopPropagation() in',
      values: [
        { value: 'none', label: 'nowhere', desc: 'Nobody stops the event: it visits every listener on its way down and back up.' },
        { value: 'outer', label: '#outer', desc: 'The outermost box stops the event in its listener.' },
        { value: 'middle', label: '#middle', desc: 'The middle box stops the event in its listener.' },
        { value: 'inner', label: '#inner', desc: 'The innermost box stops the event in its listener.' }
      ],
      get: function () { return s.stop; }, set: function (v) { s.stop = v; stopG.sync(); update(); }
    });
    var phaseG = U.chipGroup({
      name: 'In which listener',
      values: [
        { value: 'capture', label: 'capture listener', desc: 'Stopped on the way down: the boxes further in never hear about the click.' },
        { value: 'bubble', label: 'bubble listener', desc: 'Stopped on the way up: the boxes further out never hear about the click.' }
      ],
      get: function () { return s.stopPhase; }, set: function (v) { s.stopPhase = v; phaseG.sync(); update(); }
    });
    controls.appendChild(h('div', { class: 'control', 'data-group': 'stop' },
      h('div', { class: 'control-head' }, h('a', { class: 'control-name', href: '#/js/event-object' }, 'e.stopPropagation() in')), stopG.el));
    controls.appendChild(h('div', { class: 'control', 'data-group': 'stop-phase' },
      h('div', { class: 'control-head' }, h('span', { class: 'control-name' }, '…in its')), phaseG.el));
    controls.appendChild(U.callout('java', 'Java analogy', U.md('Like an exception travelling up the call stack: the click starts at the element you clicked and travels up through its parents. Two differences: **every** listener on the way runs (not only the first `catch`), and `stopPropagation()` is like catching it without rethrowing. Capturing - the trip down first - has no Java equivalent.')));

    var summary = h('div', { class: 'formula bub-summary', 'aria-live': 'polite' });
    var journey = h('ol', { class: 'bub-journey' });
    var p = U.preview.create(null, {
      height: 270, baseCss: U.DEMO_BASE, title: 'Nested boxes: click one',
      onConsole: function () { refreshSoon(); }, onReload: function () { drawJourney([]); }
    });
    var code = U.codeBlock('', 'js', {
      label: 'JavaScript', playground: function () {
        return { title: 'Event bubbling', html: BOXES_HTML, css: BOXES_CSS, js: 'function log(e, which) {\n  console.log(which, "on #" + e.currentTarget.id, "- e.target is #" + e.target.id);\n}\n' + lastJs };
      }
    });
    out.appendChild(h('div', null, h('div', { class: 'preview-label' }, h('span', { class: 'live-dot' }), 'Click any box - the click travels in the numbered order'), p.wrap));
    out.appendChild(summary);
    out.appendChild(journey);
    out.appendChild(code.el);
    out.appendChild(U.callout('tip', 'target or currentTarget?', U.md('`e.target` is the element you actually clicked - the same for every listener. `e.currentTarget` is the element whose listener is running now, so it changes as the event travels (inside a listener it is the same as `this`). Because clicks bubble, **one listener on a parent** can handle clicks on all its children: `list.addEventListener("click", e => e.target.closest("li"))`. That is **event delegation**, and it works for children added later too.')));
    var lastJs = '';

    function listenersJs() {
      var stopLine = function (which) {
        return s.stop !== 'none' && s.stopPhase === which ? '\n    if (box.id === "' + s.stop + '") e.stopPropagation();   // the event goes no further' : '';
      };
      var body = [];
      if (s.capture) body.push('  box.addEventListener("click", (e) => {\n    log(e, "capture listener");' + stopLine('capture') + '\n  }, { capture: true });   // runs on the way down');
      if (s.bubble) body.push('  box.addEventListener("click", (e) => {\n    log(e, "bubble listener");' + stopLine('bubble') + '\n  });                      // runs on the way up');
      if (!body.length) body.push('  // no listeners: the click still travels, but nobody hears it');
      return '// log(e, …) prints one line and lights the box up (a helper in this demo)\nfor (const box of document.querySelectorAll(".box")) {\n' + body.join('\n') + '\n}';
    }

    /* the listener calls a click on `target` would make if nothing stopped it */
    function fullJourney(target) {
      var path = ['outer', 'middle', 'inner'];
      var above = path.slice(0, Math.max(0, path.indexOf(target))); // the boxes around the target, outermost first
      var all = [];
      if (s.capture) above.forEach(function (b) { all.push({ phase: 'capture', which: 'capture listener', current: b }); });
      if (s.capture) all.push({ phase: 'target', which: 'capture listener', current: target });
      if (s.bubble) all.push({ phase: 'target', which: 'bubble listener', current: target });
      if (s.bubble) above.slice().reverse().forEach(function (b) { all.push({ phase: 'bubble', which: 'bubble listener', current: b }); });
      return all;
    }

    function drawJourney(list) {
      journey.innerHTML = '';
      if (!list || !list.length) {
        summary.innerHTML = s.capture || s.bubble ? 'Click any box in the preview: its journey appears here, one line per listener that ran.' : 'There are no listeners, so a click goes unnoticed. Switch one on.';
        return;
      }
      var target = list[0].target;
      summary.innerHTML = 'You clicked <b>#' + U.esc(target) + '</b>, so <code>e.target</code> is #' + U.esc(target) + ' for every listener below. <code>e.currentTarget</code> is the box whose listener is running.';
      list.forEach(function (e) {
        journey.appendChild(h('li', { class: 'bub-' + e.phase, 'data-phase': e.phase, 'data-current': e.current, 'data-target': e.target },
          h('span', { class: 'bub-phase' }, PHASE_TEXT[e.phase]), ' ', h('code', null, '#' + e.current), ' - ' + e.which + ' · ',
          h('span', { class: 'faint', html: 'currentTarget <code>#' + U.esc(e.current) + '</code>, target <code>#' + U.esc(e.target) + '</code>' })));
      });
      var full = fullJourney(target);
      if (list.length < full.length) {
        var last = list[list.length - 1];
        full.slice(list.length).forEach(function (e) {
          journey.appendChild(h('li', { class: 'skipped', 'data-phase': e.phase, 'data-current': e.current },
            h('span', { class: 'bub-phase' }, 'never ran'), ' ', h('code', null, '#' + e.current), ' - ' + e.which + ': ',
            h('span', { class: 'faint', html: '<code>stopPropagation()</code> in #' + U.esc(last.current) + '\'s ' + U.esc(last.which) + ' ended the journey' })));
        });
      }
    }

    var refreshSoon = U.debounce(function () {
      p.ask({ type: 'eval', code: 'function () { return window.__journey || []; }' }).then(drawJourney, function () {});
    }, 80);

    function update() {
      lastJs = listenersJs();
      code.set(lastJs);
      p.render({ html: BOXES_HTML, css: BOXES_CSS, js: lastJs, head: BUBBLE_HELPER });
      drawJourney([]);
    }
    update();
  }

  U.explainerBuilders['event-loop'] = eventLoop;
  U.explainerBuilders.bubbling = bubbling;
})(window.UILT);
