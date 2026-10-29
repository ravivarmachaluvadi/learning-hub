/*
 * Explainers: the ideas that trip people up, taken apart one move at a time, then run in real React
 * (js/views/explainers.js). Each track's batch brings its own (tests/check_data.py's
 * PLANNED_EXPLAINERS): State and forms has "State is a snapshot"; Effects and refs "The effect
 * timeline" and "The stale closure"; Performance and internals "Keys and reconciliation".
 *
 * Explainer shape: {id, track, title, summary, keywords, intro (Markdown), outro (Markdown),
 *   related: ['lesson:<id>', 'q:<id>'], examples: [{id, label, desc, code, steps, state?, strict?, settle?}]}
 *   state: the name of the state the picture shows (default 'count'); strict: true runs the real-React
 *   copy inside <StrictMode>; settle: how many ms the tests wait after the end, to prove nothing
 *   else changes (default 300; an interval that keeps going needs longer).
 *
 * An example's code is a component with one button that runs a click handler. Each step is
 * [line, [operations], what happens (Markdown)]; line is the code line to highlight (0 = none).
 * The operations change the picture, in order:
 *   render N   React starts render N (the state's value is still being worked out)
 *   snap V     in this render, the state is V
 *   screen T   the page shows T ("\n" between lines, for a page of several: a list)
 *   run T      T is running now (an event handler, an effect); "run" alone: nothing is
 *   queue T    an update joins React's queue for the next render
 *   apply R    the oldest update not yet worked out gives R
 *   clear      the render has used the queue: it is empty again
 *   log T      the console prints T
 *   wait T     T waits to run: a timer, or an effect waiting for the paint
 *   every T    T waits to run again and again (an interval): it may still be waiting at the end
 *   fire       the oldest one waiting runs (an interval goes to the back, to wait again)
 *   cancel T   T, waiting, is cancelled (clearTimeout, clearInterval) and leaves
 *   keep T     React keeps T, a cleanup, for the effect's next run or the unmount
 *   drop T     the kept T runs now and leaves
 * tests/check_data.py checks that they add up; tests/test_ui.py ("explain") runs every example in
 * real React, clicks its button once, and checks that the screen and the console end exactly where
 * the last step does.
 */
(function (U) {
  function code() { return [].slice.call(arguments).join('\n') + '\n'; }
  var HEAD = ["import { useState } from 'react';", '', 'export default function App() {', '  const [count, setCount] = useState(0);', ''];
  var BUTTON = '  return <button onClick={handleClick}>Count: {count}</button>;';
  // the effect timeline's examples (lines 1-5, and the render log on line 5 for EFFECT_HEAD)
  var EFFECT_TOP = ["import { useState, useEffect } from 'react';", '', 'export default function App() {', '  const [count, setCount] = useState(0);', ''];
  var EFFECT_TOP_LAYOUT = ["import { useState, useEffect, useLayoutEffect } from 'react';"].concat(EFFECT_TOP.slice(1));
  var EFFECT_HEAD = EFFECT_TOP.slice(0, 4).concat(["  console.log('render', count);", '']);
  var EFFECT_BUTTON = '  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;';
  // the stale closure's effect examples: a Start button sets running
  var RUNNING_HEAD = EFFECT_TOP.slice(0, 4).concat(['  const [running, setRunning] = useState(false);', '']);
  var RUNNING_BUTTON = '  return <button onClick={() => setRunning(true)}>Count: {count}</button>;';
  // keys and reconciliation: a Row that numbers itself when React creates it (lines 1-13; App starts on line 14)
  var ROW_TOP = ["import { useState } from 'react';", '', 'let made = 0;', '',
    'function Row({ name }) {', '  const [id] = useState(() => {', '    made = made + 1;',
    "    console.log('new Row #' + made + ' for ' + name);", '    return made;', '  });',
    '  return <li>{name}: Row #{id}</li>;', '}', ''];
  var ROWS_APP = ['export default function App() {', "  const [items, setItems] = useState(['Ada', 'Bob']);", '  return (', '    <div>',
    "      <button onClick={() => setItems(['Zoe', ...items])}>Add Zoe at the top</button>", '      <ul>'];
  var ROWS_END = ['      </ul>', '    </div>', '  );', '}'];
  var NAME_APP = ['export default function App() {', "  const [name, setName] = useState('Ada');", '  return (', '    <div>',
    "      <button onClick={() => setName('Bob')}>Switch to Bob</button>", '      <ul>'];

  U.data.explainers = (U.data.explainers || []).concat([
    {
      id: 'state-snapshot', track: 'state',
      title: 'State is a snapshot',
      summary: 'Why setCount(count + 1) three times in one click adds one: each render sees its own fixed value, a setter only queues an update for the next render, and React works through the queue once the handler has finished.',
      keywords: ['snapshot', 'state', 'batching', 'queue', 'updater function', 'setState', 'setCount', 'count + 1', 'stale closure', 'timeout', 're-render', 'explainer'],
      related: ['lesson:r-state-snapshot', 'q:state-not-immediate', 'q:predict-output', 'q:stale-interval'],
      intro: 'Setting state does not change the variable you are holding. It puts an update in React\'s **queue**, and React renders again once your event handler has finished. In the new render, `useState` works through the queue and hands back the result, in a brand-new variable.\n\n' +
        'Pick an example, then press **Step** to watch one move at a time: which render you are in and what `count` is there, what each line puts in the queue, and what the screen and the console show. Under the steps the same code runs in **real React**: click its button and compare. (The tests of this tool do exactly that for every example, so the steps cannot tell a different story from React.)',
      outro: '## What to remember\n\n' +
        '- In each render, `count` is a **constant**. Setters never change it; they queue an update for the next render.\n' +
        '- React **batches**: it renders once, after the whole event handler has finished.\n' +
        '- In the queue, a value means "replace it with this", and a function means "work it out from the one before". Use the function form, `setCount(c => c + 1)`, when the next value depends on the previous one.\n' +
        '- Code that runs later (a timer, a promise) still sees the snapshot of the render that created it: the **stale closure**.\n\n' +
        'Practise it: [[lesson:r-state-snapshot]] has a challenge, and the interview questions are [[q:state-not-immediate]], [[q:predict-output]] and [[q:stale-interval]].',
      examples: [
        {
          id: 'three-values', label: 'count + 1, three times',
          desc: 'Three setters that all read the same snapshot.',
          code: code.apply(null, HEAD.concat([
            '  function handleClick() {',
            '    setCount(count + 1);',
            '    setCount(count + 1);',
            '    setCount(count + 1);',
            '  }',
            '',
            BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'React calls `App` for the first time. `useState(0)` has nothing stored yet, so it returns the starting value: in **render 1**, `count` is **0**. It is a `const`: nothing changes it during this render.'],
            [12, ['screen Count: 0'], 'Render 1 returns the button, with `handleClick`: a function made **in render 1**, which sees render 1\'s `count`. React puts "Count: 0" on the screen.'],
            [6, ['run handleClick, made in render 1'], 'You click. React calls `handleClick`, the one render 1 made. Inside it, `count` is render 1\'s `count`: 0.'],
            [7, ['queue replace it with 1'], '`setCount(count + 1)` is `setCount(0 + 1)`. It does **not** change `count`: it puts "replace it with 1" in React\'s queue, for the next render.'],
            [8, ['queue replace it with 1'], 'Line 8 reads the same `count`, still 0, so it queues "replace it with 1" again.'],
            [9, ['queue replace it with 1'], 'And a third time. Three updates are waiting, and all three say 1.'],
            [10, ['run'], 'The handler has finished. Only now does React render again: it **batches** all the updates of one event into a single render.'],
            [4, ['render 2', 'apply 1', 'apply 1', 'apply 1'], 'Render 2. `useState` works through the queue, starting from the stored 0: "replace it with 1" gives 1, then 1 again, then 1.'],
            [4, ['snap 1', 'clear'], 'So in render 2, `count` is **1**, and the queue is empty again.'],
            [12, ['screen Count: 1'], 'Render 2 returns "Count: 1". One click added **one**, not three. Now click the real button below: React agrees.']
          ]
        },
        {
          id: 'three-updaters', label: 'c => c + 1, three times',
          desc: 'Three updater functions: each builds on the result of the one before.',
          code: code.apply(null, HEAD.concat([
            '  function handleClick() {',
            '    setCount(c => c + 1);',
            '    setCount(c => c + 1);',
            '    setCount(c => c + 1);',
            '  }',
            '',
            BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'Render 1: `count` is 0.'],
            [12, ['screen Count: 0'], 'The screen shows "Count: 0".'],
            [6, ['run handleClick, made in render 1'], 'You click, and render 1\'s `handleClick` runs.'],
            [7, ['queue c => c + 1'], 'This time the setter gets a **function**. React does not call it yet: it queues it, meaning "work the next value out from the one before".'],
            [8, ['queue c => c + 1'], 'A second function is queued.'],
            [9, ['queue c => c + 1'], 'And a third. None of them reads `count`: each will be handed the value as `c`.'],
            [10, ['run'], 'The handler ends, and React renders once.'],
            [4, ['render 2', 'apply 1'], 'Render 2 works through the queue from the stored 0. The first function gets `c = 0` and returns 1.'],
            [4, ['apply 2'], 'The second gets the first one\'s result, `c = 1`, and returns 2.'],
            [4, ['apply 3', 'snap 3', 'clear'], 'The third gets 2 and returns 3. In render 2, `count` is **3**.'],
            [12, ['screen Count: 3'], '"Count: 3": each update built on the one before.']
          ]
        },
        {
          id: 'mixed', label: 'count + 5, then c => c + 1',
          desc: 'A value and a function in the same queue.',
          code: code.apply(null, HEAD.concat([
            '  function handleClick() {',
            '    setCount(count + 5);',
            '    setCount(c => c + 1);',
            '  }',
            '',
            BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'Render 1: `count` is 0.'],
            [11, ['screen Count: 0'], 'The screen shows "Count: 0".'],
            [6, ['run handleClick, made in render 1'], 'You click.'],
            [7, ['queue replace it with 5'], '`setCount(count + 5)` is `setCount(0 + 5)`: "replace it with 5".'],
            [8, ['queue c => c + 1'], 'Then a function: "add 1 to whatever it is by then".'],
            [9, ['run'], 'The handler ends, and React renders once.'],
            [4, ['render 2', 'apply 5'], 'Render 2 starts from 0. "Replace it with 5" ignores what was there: 5.'],
            [4, ['apply 6', 'snap 6', 'clear'], 'The function gets `c = 5` and returns 6. In render 2, `count` is **6**.'],
            [11, ['screen Count: 6'], '"Count: 6". The other way round, `setCount(c => c + 1)` and then `setCount(count + 5)`, gives 5: the replacement comes last, and wins.']
          ]
        },
        {
          id: 'log-after-set', label: 'Set, then log',
          desc: 'The line after the setter still runs in the old render.',
          code: code.apply(null, HEAD.concat([
            '  function handleClick() {',
            '    setCount(count + 1);',
            '    console.log(count);',
            '  }',
            '',
            BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'Render 1: `count` is 0.'],
            [11, ['screen Count: 0'], 'The screen shows "Count: 0".'],
            [6, ['run handleClick, made in render 1'], 'You click.'],
            [7, ['queue replace it with 1'], 'The setter queues "replace it with 1" for the next render.'],
            [8, ['log 0'], '`console.log(count)` runs straight after, still inside render 1\'s handler, where `count` is 0. It prints **0**. Nothing has re-rendered yet, and even after the re-render, this handler\'s `count` stays 0.'],
            [9, ['run'], 'The handler ends.'],
            [4, ['render 2', 'apply 1', 'snap 1', 'clear'], 'Render 2: the queue gives 1, so `count` is 1 in the new render.'],
            [11, ['screen Count: 1'], 'The screen says "Count: 1", while the console said 0: the log came from the old snapshot.']
          ]
        },
        {
          id: 'timer', label: 'A timer reads the snapshot',
          desc: 'Code that runs later still sees the render that created it.',
          code: code.apply(null, HEAD.concat([
            '  function handleClick() {',
            '    setCount(count + 5);',
            '    setTimeout(() => {',
            "      console.log('one second later, count is', count);",
            '    }, 1000);',
            '  }',
            '',
            BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'Render 1: `count` is 0.'],
            [13, ['screen Count: 0'], 'The screen shows "Count: 0".'],
            [6, ['run handleClick, made in render 1'], 'You click.'],
            [7, ['queue replace it with 5'], '"Replace it with 5" is queued.'],
            [8, ['wait the timer\'s function, made in render 1'], '`setTimeout` hands its function to the browser, to call in a second. The function was made here, in render 1, so the `count` it will read is render 1\'s.'],
            [11, ['run'], 'The handler ends, and React renders.'],
            [4, ['render 2', 'apply 5', 'snap 5', 'clear'], 'Render 2: `count` is 5.'],
            [13, ['screen Count: 5'], 'The screen says "Count: 5".'],
            [9, ['fire', 'log one second later, count is 0'], 'A second later the browser calls the timer\'s function. It still belongs to render 1, so it prints **0**, though the screen has said 5 for a whole second. This is the **stale closure** behind [[q:stale-interval]]; [[explain:stale-closure]] takes it further.']
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ the effect timeline */
    {
      id: 'effect-timeline', track: 'effects',
      title: 'The effect timeline',
      summary: 'When an effect runs, and when its cleanup does: React renders, updates the screen, and only then runs effects; before an effect runs again, the cleanup of its last run goes first, with the old values. A layout effect comes before the paint, and StrictMode adds a cleanup and a second run when a component appears.',
      keywords: ['effect timeline', 'effect order', 'when does an effect run', 'cleanup order', 'after paint', 'before paint', 'mount', 'unmount', 'layout effect', 'strict mode twice', 'debounce', 'explainer'],
      related: ['lesson:r-effects', 'lesson:r-effect-cleanup', 'lesson:r-dom-refs', 'q:use-effect', 'q:effects-twice', 'q:layout-effect'],
      intro: 'An effect does not run where it is written. `useEffect` hands its function to React, which runs it **after** the screen is painted; it keeps the cleanup the effect returns, and runs it before the effect runs again, or when the component leaves the page.\n\n' +
        'Pick an example and press **Step**: the picture shows the render React is in, what waits to run (effects wait for the paint; timers wait for their time), the cleanups React keeps, the screen and the console. Under it the same code runs in **real React**: click its button and compare the console line by line. (This tool\'s tests do exactly that for every example.)',
      outro: '## What to remember\n\n' +
        '- Render, then the DOM update, then the **paint**, then effects. `useLayoutEffect` runs between the DOM update and the paint.\n' +
        '- A cleanup belongs to the render that made it: it sees **that** render\'s values, so it undoes exactly what its effect did.\n' +
        '- When a dependency changed: the old cleanup first, then the new effect. When nothing changed: neither runs. When the component leaves: the last cleanup.\n' +
        '- A cleanup that cancels a waiting timer is a debounce: only the last change gets its turn.\n' +
        '- In development, StrictMode renders twice and runs effect, cleanup, effect when a component first appears. Production runs each once.\n\n' +
        'Practise it: [[lesson:r-effects]], [[lesson:r-effect-cleanup]] and [[lesson:r-dom-refs]]; the interview questions are [[q:use-effect]], [[q:effects-twice]] and [[q:layout-effect]].',
      examples: [
        {
          id: 'deps', label: '[count]: after the paint, and again',
          desc: 'An effect with a cleanup, both logging the count they see.',
          code: code.apply(null, EFFECT_HEAD.concat([
            '  useEffect(() => {',
            "    console.log('effect', count);",
            "    return () => console.log('cleanup', count);",
            '  }, [count]);',
            '',
            EFFECT_BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'React calls `App` for the first time: render 1, where `count` is 0.'],
            [5, ['log render 0'], 'The body runs from top to bottom, so "render 0" is printed while React is still rendering.'],
            [7, ['wait the effect of render 1'], '`useEffect` does not run its function now: it hands it to React, to run once the screen is painted. The function was made in render 1, so it will see `count` = 0.'],
            [12, ['screen Count: 0'], 'Render 1 returns the button. React puts it in the DOM, and the browser paints "Count: 0".'],
            [8, ['fire', 'run the effect of render 1', 'log effect 0'], 'Only now, after the paint, React runs the effect: "effect 0".'],
            [9, ['keep the cleanup of render 1', 'run'], 'The effect returns a function, its cleanup. React keeps it, unrun, for later: before this effect runs again, or when `App` leaves the page. It belongs to render 1, so it remembers `count` = 0.'],
            [12, ['run the click handler, made in render 1', 'queue replace it with 1'], 'You click. The handler calls `setCount(0 + 1)`: "replace it with 1" joins the queue.'],
            [12, ['run'], 'The handler ends, and React renders again.'],
            [4, ['render 2', 'apply 1', 'snap 1', 'clear'], 'Render 2: the queue gives 1, so `count` is 1.'],
            [5, ['log render 1'], 'The body prints "render 1".'],
            [10, ['wait the effect of render 2'], 'React compares the dependencies: `[count]` was `[0]` and is now `[1]`. Something changed, so render 2\'s effect will run, after the paint.'],
            [12, ['screen Count: 1'], 'React updates the DOM, and the browser paints "Count: 1".'],
            [9, ['drop the cleanup of render 1', 'run the cleanup of render 1', 'log cleanup 0'], 'Before the new effect runs, React runs the cleanup it kept. It is render 1\'s, so it prints **cleanup 0**, not 1: it undoes exactly what render 1\'s effect did.'],
            [8, ['fire', 'run the effect of render 2', 'log effect 1'], 'Then render 2\'s effect runs, with `count` = 1: "effect 1".'],
            [9, ['keep the cleanup of render 2', 'run'], 'Its cleanup is kept in turn, for the next change. Now click the real button below: React prints the same five lines.']
          ]
        },
        {
          id: 'empty', label: '[]: once, after the first paint',
          desc: 'The same effect with an empty dependency array.',
          code: code.apply(null, EFFECT_HEAD.concat([
            '  useEffect(() => {',
            "    console.log('effect', count);",
            "    return () => console.log('cleanup', count);",
            '  }, []);',
            '',
            EFFECT_BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'Render 1: `count` is 0.'],
            [5, ['log render 0'], '"render 0".'],
            [7, ['wait the effect of render 1'], 'The effect waits for the paint.'],
            [12, ['screen Count: 0'], 'The browser paints "Count: 0".'],
            [8, ['fire', 'run the effect of render 1', 'log effect 0'], 'After the paint, the effect runs: "effect 0".'],
            [9, ['keep the cleanup of render 1', 'run'], 'Its cleanup is kept, for the day `App` leaves the page.'],
            [12, ['run the click handler, made in render 1', 'queue replace it with 1'], 'You click: "replace it with 1" is queued.'],
            [12, ['run'], 'The handler ends.'],
            [4, ['render 2', 'apply 1', 'snap 1', 'clear'], 'Render 2: `count` is 1.'],
            [5, ['log render 1'], '"render 1".'],
            [12, ['screen Count: 1'], 'The browser paints "Count: 1".'],
            [10, [], 'React would now run the effects whose dependencies changed. `[]` was empty and still is: nothing changed, so it skips the effect **and** its cleanup. No "effect 1" in the console: with `[]` an effect runs once. Had it read `count` later (in a timer, say), it would still see 0: [[explain:stale-closure]].']
          ]
        },
        {
          id: 'save', label: 'A save the cleanup cancels',
          desc: 'An effect that saves 2 seconds after a change, and a cleanup that cancels the save not yet made.',
          code: code.apply(null, EFFECT_TOP.concat([
            '  useEffect(() => {',
            '    const id = setTimeout(() => {',
            "      console.log('saved', count);",
            '    }, 2000);',
            '    return () => clearTimeout(id);',
            '  }, [count]);',
            '',
            EFFECT_BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'Render 1: `count` is 0.'],
            [6, ['wait the effect of render 1'], 'The effect waits for the paint.'],
            [13, ['screen Count: 0'], 'The browser paints "Count: 0".'],
            [7, ['fire', 'run the effect of render 1', 'wait the save of render 1'], 'The effect starts a timer: in 2 seconds, save `count`, which for render 1 is 0.'],
            [10, ['keep the cleanup of render 1', 'run'], 'Its cleanup, `clearTimeout(id)`, is kept.'],
            [13, ['run the click handler, made in render 1', 'queue replace it with 1'], 'You click before the 2 seconds are up.'],
            [4, ['run', 'render 2', 'apply 1', 'snap 1', 'clear'], 'Render 2: `count` is 1.'],
            [11, ['wait the effect of render 2'], '`[count]` changed, so render 2\'s effect will run after the paint.'],
            [13, ['screen Count: 1'], 'The browser paints "Count: 1".'],
            [10, ['drop the cleanup of render 1', 'run the cleanup of render 1', 'cancel the save of render 1'], 'First the kept cleanup: `clearTimeout` cancels render 1\'s save, which has not run yet. It never will.'],
            [7, ['fire', 'run the effect of render 2', 'wait the save of render 2'], 'Then render 2\'s effect starts a new timer, for `count` = 1.'],
            [10, ['keep the cleanup of render 2', 'run'], 'Its cleanup is kept.'],
            [8, ['fire', 'run the save of render 2', 'log saved 1'], 'Two seconds after the **last** change, the save runs: "saved 1". One save, of the newest value, however many clicks came before: that is a debounce, made by the cleanup.']
          ]
        },
        {
          id: 'unmount', label: 'Leaving the page: the last cleanup', state: 'open',
          desc: 'A child with an effect, and a button that takes the child off the page.',
          code: code(
            "import { useState, useEffect } from 'react';",
            '',
            'function Chat() {',
            '  useEffect(() => {',
            "    console.log('connect');",
            "    return () => console.log('disconnect');",
            '  }, []);',
            '  return <p>Chat is open</p>;',
            '}',
            '',
            'export default function App() {',
            '  const [open, setOpen] = useState(true);',
            '  return (',
            '    <div>',
            '      <button onClick={() => setOpen(false)}>Close the chat</button>',
            '      {open && <Chat />}',
            '    </div>',
            '  );',
            '}'),
          steps: [
            [12, ['render 1', 'snap true'], 'React renders `App`: in render 1, `open` is true…'],
            [16, [], '…so it renders `<Chat />` too. `Chat` has an effect.'],
            [4, ['wait the effect of Chat'], '`Chat`\'s effect waits for the paint.'],
            [8, ['screen Close the chat · Chat is open'], 'The browser paints the button and "Chat is open".'],
            [5, ['fire', 'run the effect of Chat', 'log connect'], 'After the paint, the effect runs: "connect".'],
            [6, ['keep the cleanup of Chat', 'run'], 'React keeps its cleanup. With `[]`, no change will ever run it: it waits for the day `Chat` leaves the page.'],
            [15, ['run the click handler', 'queue replace it with false'], 'You click "Close the chat": `setOpen(false)` is queued.'],
            [15, ['run'], 'The handler ends.'],
            [12, ['render 2', 'apply false', 'snap false', 'clear'], 'Render 2: `open` is false.'],
            [16, [], '`open && <Chat />` is now `false`, so `Chat` is not in the new tree: React will take it off the page.'],
            [8, ['screen Close the chat'], 'React removes the `<p>` from the DOM, and the browser paints only the button.'],
            [6, ['drop the cleanup of Chat', 'run the cleanup of Chat', 'log disconnect'], 'A component leaving the page gets its last cleanup: "disconnect". Its state is gone too: shown again, it would start from scratch, with a new effect.']
          ]
        },
        {
          id: 'layout', label: 'useLayoutEffect comes before the paint',
          desc: 'An effect and a layout effect, written in that order.',
          code: code.apply(null, EFFECT_TOP_LAYOUT.concat([
            '  useEffect(() => {',
            "    console.log('effect', count);",
            '  }, [count]);',
            '',
            '  useLayoutEffect(() => {',
            "    console.log('layout effect', count);",
            '  }, [count]);',
            '',
            EFFECT_BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'Render 1: `count` is 0.'],
            [6, ['wait the effect of render 1'], '`useEffect` is written first, and still waits: it runs after the paint.'],
            [10, [], '`useLayoutEffect` is handed to React too, but it will not wait for the paint.'],
            [11, ['run the layout effect of render 1', 'log layout effect 0'], 'React puts the button into the DOM and, **before** the browser paints, runs the layout effect: "layout effect 0". The browser waits for it: here you could measure the button and move things, and nobody would ever see the first position.'],
            [14, ['run', 'screen Count: 0'], 'Now the browser paints "Count: 0".'],
            [7, ['fire', 'run the effect of render 1', 'log effect 0'], 'And after the paint, the ordinary effect: "effect 0". Their order in the code did not matter.'],
            [14, ['run the click handler, made in render 1', 'queue replace it with 1'], 'You click: "replace it with 1".'],
            [14, ['run'], 'The handler ends.'],
            [4, ['render 2', 'apply 1', 'snap 1', 'clear'], 'Render 2: `count` is 1. Both effects list `count`, so both will run.'],
            [6, ['wait the effect of render 2'], 'The effect waits for the paint again.'],
            [11, ['run the layout effect of render 2', 'log layout effect 1'], 'The DOM is updated and, before the paint: "layout effect 1".'],
            [14, ['run', 'screen Count: 1'], 'The browser paints "Count: 1".'],
            [7, ['fire', 'run the effect of render 2', 'log effect 1'], 'Then the effect: "effect 1". Layout effects hold up the paint, so keep them for measuring; everything else belongs in `useEffect`.']
          ]
        },
        {
          id: 'strict', label: 'StrictMode: an extra cleanup and run', strict: true,
          desc: 'The first example again, this time inside <StrictMode>, as a new project runs in development.',
          code: code.apply(null, EFFECT_HEAD.concat([
            '  useEffect(() => {',
            "    console.log('effect', count);",
            "    return () => console.log('cleanup', count);",
            '  }, [count]);',
            '',
            EFFECT_BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'This example runs inside `<StrictMode>`, as a new project does in development. Render 1: `count` is 0.'],
            [5, ['log render 0'], '"render 0".'],
            [5, ['log render 0'], 'StrictMode calls `App` a **second** time, with the same values, and keeps only one result. A pure component gives the same JSX both times; one that changed something outside itself would show it now. So "render 0" is printed twice.'],
            [7, ['wait the effect of render 1'], 'The effect waits for the paint.'],
            [12, ['screen Count: 0'], 'The browser paints "Count: 0".'],
            [8, ['fire', 'run the effect of render 1', 'log effect 0'], 'The effect runs: "effect 0".'],
            [9, ['keep the cleanup of render 1'], 'Its cleanup is kept.'],
            [9, ['drop the cleanup of render 1', 'run the cleanup of render 1', 'log cleanup 0'], 'Now StrictMode pretends the component left the page: it runs the cleanup at once, "cleanup 0"…'],
            [8, ['run the effect of render 1', 'log effect 0', 'keep the cleanup of render 1'], '…and pretends it came back: the effect runs a second time, "effect 0", and its cleanup is kept again. If the cleanup undoes the effect, this ends exactly where one run would: one connection, one listener, one interval.'],
            [12, ['run the click handler, made in render 1', 'queue replace it with 1'], 'You click: "replace it with 1".'],
            [12, ['run'], 'The handler ends.'],
            [4, ['render 2', 'apply 1', 'snap 1', 'clear'], 'Render 2: `count` is 1.'],
            [5, ['log render 1', 'log render 1'], 'StrictMode calls `App` twice again: "render 1", twice.'],
            [10, ['wait the effect of render 2'], '`[count]` changed, so the effect will run.'],
            [12, ['screen Count: 1'], 'The browser paints "Count: 1".'],
            [9, ['drop the cleanup of render 1', 'run the cleanup of render 1', 'log cleanup 0'], 'The kept cleanup runs first: "cleanup 0".'],
            [8, ['fire', 'run the effect of render 2', 'log effect 1'], 'Then the new effect: "effect 1". After the first appearance StrictMode adds no extra runs: an update runs its effect once, as in production.'],
            [9, ['keep the cleanup of render 2', 'run'], 'Its cleanup is kept. In production every line would be printed once, and the extra cleanup and effect on the first appearance would not happen.']
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ the stale closure */
    {
      id: 'stale-closure', track: 'effects',
      title: 'The stale closure',
      summary: 'A function sees the variables of the render that made it, for ever. A timer, an interval or an effect that outlives its render keeps reading old values: an updater, the right dependencies, or a ref gives it the new ones.',
      keywords: ['stale closure', 'closure', 'stale state', 'stale value', 'old value', 'setInterval', 'setTimeout', 'interval stuck', 'counter stuck at 1', 'updater function', 'explainer'],
      related: ['q:stale-interval', 'lesson:r-effect-deps', 'lesson:r-state-snapshot', 'lesson:r-refs', 'explain:state-snapshot'],
      intro: 'A function remembers the variables around it where it was made: that is a **closure**. In a component, every render makes its functions anew, and each one remembers **its own** render\'s values. Most functions are used straight away and thrown out, so that never matters. A function that is kept for later (a timer, an interval, an effect that runs once) keeps reading the values of a render that is long gone: a **stale closure**.\n\n' +
        'Press **Step** to watch which render each function belongs to, what it reads, and what reaches the screen. Each example then runs in **real React** underneath: click its button and wait a few seconds; the steps end where React does.',
      outro: '## What to remember\n\n' +
        '- Every function sees the values of the render that made it. A function that runs later is not updated when the component renders again.\n' +
        '- **An updater** (`setCount(c => c + 1)`) does not need to read the value at all: React hands it the latest one.\n' +
        '- **The right dependencies** make React replace the effect, and its timers, whenever a value it reads changes: no function outlives its render.\n' +
        '- **A ref**, or React 19.2\'s `useEffectEvent`, lets a long-lived function read the latest value without restarting anything.\n\n' +
        'Practise it: [[lesson:r-effect-deps]] and [[lesson:r-refs]]; the interview question is [[q:stale-interval]].',
      examples: [
        {
          id: 'two-timers', label: 'Two timers, one snapshot',
          desc: 'One click starts two timers, 1 and 2 seconds away; both add one to count.',
          code: code.apply(null, HEAD.concat([
            '  function handleClick() {',
            '    setTimeout(() => {',
            "      console.log('timer 1 sees count =', count);",
            '      setCount(count + 1);',
            '    }, 1000);',
            '    setTimeout(() => {',
            "      console.log('timer 2 sees count =', count);",
            '      setCount(count + 1);',
            '    }, 2000);',
            '  }',
            '',
            BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'Render 1: `count` is 0.'],
            [17, ['screen Count: 0'], 'The screen shows "Count: 0".'],
            [6, ['run handleClick, made in render 1'], 'You click. `handleClick` was made in render 1, and so is every function made inside it.'],
            [7, ['wait timer 1, made in render 1'], 'The first arrow function goes to the browser, to run in 1 second. It **closes over** `count`: it will read the `count` of the render it was made in.'],
            [11, ['wait timer 2, made in render 1'], 'The second goes to the browser too, for 2 seconds. Also made in render 1: its `count` is 0 as well, for ever.'],
            [15, ['run'], 'The handler ends. Nothing was queued, so nothing renders yet.'],
            [8, ['fire', 'run timer 1, made in render 1', 'log timer 1 sees count = 0'], 'One second later timer 1 runs, and reads render 1\'s `count`: 0.'],
            [9, ['queue replace it with 1'], '`setCount(0 + 1)`: "replace it with 1".'],
            [4, ['run', 'render 2', 'apply 1', 'snap 1', 'clear'], 'React renders again: in render 2, `count` is 1…'],
            [17, ['screen Count: 1'], '…and the screen says "Count: 1".'],
            [12, ['fire', 'run timer 2, made in render 1', 'log timer 2 sees count = 0'], 'Another second later timer 2 runs. The screen has said 1 for a whole second, but timer 2 belongs to render 1, where `count` is 0. Its `count` is **stale**.'],
            [13, ['queue replace it with 1', 'apply 1', 'clear', 'run'], '`setCount(0 + 1)` asks for 1, which React already has: nothing changes. Two timers, one step: the second update was lost.']
          ]
        },
        {
          id: 'updater', label: 'The fix: an updater',
          desc: 'The same two timers, each with setCount(c => c + 1).',
          code: code.apply(null, HEAD.concat([
            '  function handleClick() {',
            '    setTimeout(() => {',
            "      console.log('timer 1 sees count =', count);",
            '      setCount(c => c + 1);',
            '    }, 1000);',
            '    setTimeout(() => {',
            "      console.log('timer 2 sees count =', count);",
            '      setCount(c => c + 1);',
            '    }, 2000);',
            '  }',
            '',
            BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'Render 1: `count` is 0.'],
            [17, ['screen Count: 0'], 'The screen shows "Count: 0".'],
            [6, ['run handleClick, made in render 1'], 'You click.'],
            [7, ['wait timer 1, made in render 1'], 'Timer 1 waits, made in render 1.'],
            [11, ['wait timer 2, made in render 1'], 'Timer 2 waits, made in render 1 too.'],
            [15, ['run'], 'The handler ends.'],
            [8, ['fire', 'run timer 1, made in render 1', 'log timer 1 sees count = 0'], 'One second later timer 1 runs. Its `count` is 0, as before…'],
            [9, ['queue c => c + 1'], '…but it does not use it: it queues a function, "add one to whatever it is by then".'],
            [4, ['run', 'render 2', 'apply 1', 'snap 1', 'clear'], 'Render 2: React hands the function the latest value, 0, and gets 1.'],
            [17, ['screen Count: 1'], 'The screen says "Count: 1".'],
            [12, ['fire', 'run timer 2, made in render 1', 'log timer 2 sees count = 0'], 'Timer 2 runs. Its `count` is still the stale 0: the log proves it…'],
            [13, ['queue c => c + 1'], '…but the update does not read it. It queues "add one".'],
            [4, ['run', 'render 3', 'apply 2', 'snap 2', 'clear'], 'Render 3: React hands the function the latest value, 1, and gets 2.'],
            [17, ['screen Count: 2'], '"Count: 2". The closures are as stale as before; the updater simply never asks them.']
          ]
        },
        {
          id: 'interval', label: 'An interval that sticks at 1', settle: 2300,
          desc: 'Start sets running; an effect on [running] starts an interval that adds one to count every second.',
          code: code.apply(null, RUNNING_HEAD.concat([
            '  useEffect(() => {',
            '    if (!running) return;',
            '    const id = setInterval(() => {',
            '      setCount(count + 1);',
            '    }, 1000);',
            '    return () => clearInterval(id);',
            '  }, [running]);',
            '',
            RUNNING_BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'Render 1: `count` is 0, and `running` is false.'],
            [7, ['wait the effect of render 1'], 'The effect waits for the paint.'],
            [15, ['screen Count: 0'], 'The screen shows "Count: 0".'],
            [8, ['fire', 'run the effect of render 1', 'run'], 'The effect runs, sees that `running` is false, and returns at once: no interval, no cleanup.'],
            [15, ['run the click handler, made in render 1', 'queue running: replace it with true'], 'You click: `setRunning(true)`.'],
            [15, ['run'], 'The handler ends.'],
            [4, ['render 2', 'apply true', 'snap 0', 'clear'], 'Render 2: `running` is true now; `count` is still 0.'],
            [13, ['wait the effect of render 2'], '`[running]` changed from false to true, so render 2\'s effect will run.'],
            [15, ['screen Count: 0'], 'The screen still says "Count: 0".'],
            [9, ['fire', 'run the effect of render 2', 'every the interval\'s function, made in render 2'], 'The effect starts an interval. Its function is made **here, in render 2**, where `count` is 0, and the interval will call this same function every second, for ever.'],
            [12, ['keep the cleanup of render 2', 'run'], 'React keeps the cleanup, `clearInterval`, for when `running` changes or `App` leaves. Neither will happen.'],
            [10, ['fire', 'run the interval\'s function, made in render 2', 'queue replace it with 1'], 'One second later: `setCount(count + 1)` with render 2\'s `count`, 0. So: "replace it with 1".'],
            [4, ['run', 'render 3', 'apply 1', 'snap 1', 'clear'], 'Render 3: `count` is 1. `[running]` did not change, so the effect does not run again, and the interval keeps its render-2 function.'],
            [15, ['screen Count: 1'], 'The screen says "Count: 1".'],
            [10, ['fire', 'run the interval\'s function, made in render 2', 'queue replace it with 1', 'apply 1', 'clear', 'run'], 'Another second: the same function, the same stale `count` of 0, the same "replace it with 1". React already has 1, so nothing changes, and so on every second: the counter sticks at **1**. This is [[q:stale-interval]]; the fix is `setCount(c => c + 1)`.']
          ]
        },
        {
          id: 'fresh-timer', label: 'The fix: a new timer each render', settle: 1300,
          desc: 'count in the dependencies: each render\'s effect starts one timer, with that render\'s count, and it stops at 2.',
          code: code.apply(null, RUNNING_HEAD.concat([
            '  useEffect(() => {',
            '    if (!running || count === 2) return;',
            '    const id = setTimeout(() => {',
            '      setCount(count + 1);',
            '    }, 1000);',
            '    return () => clearTimeout(id);',
            '  }, [running, count]);',
            '',
            RUNNING_BUTTON,
            '}'])),
          steps: [
            [4, ['render 1', 'snap 0'], 'Render 1: `count` is 0, `running` false.'],
            [7, ['wait the effect of render 1'], 'The effect waits for the paint.'],
            [15, ['screen Count: 0'], 'The screen shows "Count: 0".'],
            [8, ['fire', 'run the effect of render 1', 'run'], 'Not running yet: the effect returns at once.'],
            [15, ['run the click handler, made in render 1', 'queue running: replace it with true'], 'You click: `setRunning(true)`.'],
            [4, ['run', 'render 2', 'apply true', 'snap 0', 'clear'], 'Render 2: `running` is true, `count` is 0.'],
            [13, ['wait the effect of render 2'], '`running` changed, so render 2\'s effect will run.'],
            [9, ['fire', 'run the effect of render 2', 'wait the timer, made in render 2'], 'It starts **one** timer, made in render 2, where `count` is 0. That is right: right now `count` **is** 0.'],
            [12, ['keep the cleanup of render 2', 'run'], 'Its cleanup is kept.'],
            [10, ['fire', 'run the timer, made in render 2', 'queue replace it with 1'], 'A second later: `setCount(0 + 1)`.'],
            [4, ['run', 'render 3', 'apply 1', 'snap 1', 'clear'], 'Render 3: `count` is 1.'],
            [13, ['wait the effect of render 3'], 'This time `count` is in the dependencies, and it changed: render 3\'s effect will run, with `count` = 1.'],
            [15, ['screen Count: 1'], 'The screen says "Count: 1".'],
            [12, ['drop the cleanup of render 2', 'run the cleanup of render 2'], 'First the old cleanup: `clearTimeout` on a timer that has already run, which does nothing.'],
            [9, ['fire', 'run the effect of render 3', 'wait the timer, made in render 3'], 'Then the new effect starts a new timer, made in render 3: it sees `count` = 1. No function outlives its render, so none goes stale.'],
            [12, ['keep the cleanup of render 3', 'run'], 'Its cleanup is kept.'],
            [10, ['fire', 'run the timer, made in render 3', 'queue replace it with 2'], 'A second later: `setCount(1 + 1)`.'],
            [4, ['run', 'render 4', 'apply 2', 'snap 2', 'clear'], 'Render 4: `count` is 2.'],
            [13, ['wait the effect of render 4'], '`count` changed again.'],
            [15, ['screen Count: 2'], 'The screen says "Count: 2".'],
            [12, ['drop the cleanup of render 3', 'run the cleanup of render 3'], 'The old cleanup runs.'],
            [8, ['fire', 'run the effect of render 4', 'run'], 'Render 4\'s effect sees `count === 2` and returns: no timer, no cleanup. It stops at 2.']
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ keys and reconciliation */
    {
      id: 'keys-reconciliation', track: 'performance',
      title: 'Keys and reconciliation',
      summary: 'Why a list item keeps or loses its state: after every render React compares the new elements with the last ones, place by place, and keeps a component only when the same type is in the same place with the same key. Keys from the index, keys from the data, a new key, a new parent type, and a component defined inside another.',
      keywords: ['keys', 'key', 'reconciliation', 'virtual dom', 'diffing', 'index as key', 'key from data', 'preserve state', 'reset state', 'remount', 'component inside component', 'same type same place', 'explainer'],
      related: ['lesson:r-reconciliation', 'lesson:r-lists-keys', 'q:virtual-dom', 'q:keys'],
      intro: 'After every render React compares the new elements with the last ones and decides, place by place, whether to **keep** the component that is there, with its state, or **throw it away** and make a new one. It looks at two things only: the element\'s **type**, and its **key** (without a key, its position among its siblings).\n\n' +
        'Each `Row` here numbers itself when React creates it, and says so in the console, so you can see which components React kept and which it made. Pick an example and press **Step**; then click the same code\'s button in **real React** underneath and compare the screen and the console.',
      outro: '## What to remember\n\n' +
        '- React keeps a component when the same **type** is in the same **place**, with the same **key**. Its state stays, whatever the new props say.\n' +
        '- A different type in a place throws away everything inside it, state included. So does a different key.\n' +
        '- In a list the key is the place. From the data, the state follows the item; from the index, the state stays at the position while the data moves past it.\n' +
        '- A new key is the clean way to reset a component on purpose.\n' +
        '- A component defined inside another is a new type on every render, so it is rebuilt every time.\n\n' +
        'Practise it: [[lesson:r-reconciliation]] and [[lesson:r-lists-keys]]; the interview questions are [[q:virtual-dom]] and [[q:keys]].',
      examples: [
        {
          id: 'index-keys', label: 'Keys from the index', state: 'items',
          desc: 'Two rows keyed by their index; a click adds Zoe at the top.',
          code: code.apply(null, ROW_TOP.concat(ROWS_APP, ['        {items.map((name, i) => <Row key={i} name={name} />)}'], ROWS_END)),
          steps: [
            [15, ['render 1', 'snap ["Ada", "Bob"]'], 'React calls `App` for the first time: in render 1, `items` is `["Ada", "Bob"]`.'],
            [20, [], '`items.map` makes two elements, each keyed by its index: `<Row key={0} name="Ada" />` and `<Row key={1} name="Bob" />`. An element is only a description: no `Row` exists yet.'],
            [8, ['log new Row #1 for Ada'], 'Nothing is at key 0 yet, so React creates a `Row` there. Its `useState` runs the starting function, which numbers it **#1** and says so. That number is this component\'s state, and stays with it as long as React keeps it.'],
            [8, ['log new Row #2 for Bob'], 'Key 1: another new `Row`, **#2**, for Bob.'],
            [11, ['screen Add Zoe at the top\nAda: Row #1\nBob: Row #2'], 'Each `Row` shows its name and its own number.'],
            [18, ['run the click handler, made in render 1', 'queue replace it with ["Zoe", "Ada", "Bob"]'], 'You click: the handler queues a new array with Zoe at the front.'],
            [18, ['run'], 'The handler ends, and React renders again.'],
            [15, ['render 2', 'apply ["Zoe", "Ada", "Bob"]', 'snap ["Zoe", "Ada", "Bob"]', 'clear'], 'Render 2: `items` is `["Zoe", "Ada", "Bob"]`.'],
            [20, [], 'Three elements now, keyed by index: key 0 gets Zoe, key 1 Ada, key 2 Bob.'],
            [11, [], 'React matches each element with the last render **by key**. Key 0 is still a `Row`, so React keeps it: **Row #1, the one made for Ada**, which only gets the new prop `name="Zoe"`. Key 1 keeps Row #2 and gets Ada. The state stays where it was.'],
            [8, ['log new Row #3 for Bob'], 'Key 2 is new: React creates **Row #3**, for Bob.'],
            [11, ['screen Add Zoe at the top\nZoe: Row #1\nAda: Row #2\nBob: Row #3'], 'Every name moved down a row; every piece of state stayed put. Zoe now has the state made for Ada. Text typed into an input, or a ticked box, would now sit next to the wrong person in the same way. Click the real button below: React agrees.']
          ]
        },
        {
          id: 'data-keys', label: 'Keys from the data', state: 'items',
          desc: 'The same list, keyed by the name; the same click.',
          code: code.apply(null, ROW_TOP.concat(ROWS_APP, ['        {items.map(name => <Row key={name} name={name} />)}'], ROWS_END)),
          steps: [
            [15, ['render 1', 'snap ["Ada", "Bob"]'], 'Render 1: `items` is `["Ada", "Bob"]`.'],
            [20, [], 'Two elements, keyed by the name: `<Row key="Ada" … />` and `<Row key="Bob" … />`.'],
            [8, ['log new Row #1 for Ada'], 'React creates Row **#1** at key "Ada"…'],
            [8, ['log new Row #2 for Bob'], '…and Row **#2** at key "Bob".'],
            [11, ['screen Add Zoe at the top\nAda: Row #1\nBob: Row #2'], 'The same screen as with index keys, so far.'],
            [18, ['run the click handler, made in render 1', 'queue replace it with ["Zoe", "Ada", "Bob"]'], 'You click: Zoe goes to the front.'],
            [18, ['run'], 'The handler ends.'],
            [15, ['render 2', 'apply ["Zoe", "Ada", "Bob"]', 'snap ["Zoe", "Ada", "Bob"]', 'clear'], 'Render 2: `items` is `["Zoe", "Ada", "Bob"]`.'],
            [20, [], 'Three elements, keyed "Zoe", "Ada" and "Bob".'],
            [8, ['log new Row #3 for Zoe'], 'React matches by key. There was no "Zoe" before: it creates **Row #3**, for Zoe.'],
            [11, [], 'Key "Ada" was there: React keeps **Row #1** and moves its `<li>` down a place. Key "Bob" keeps **Row #2**. React moves DOM nodes instead of changing their text.'],
            [11, ['screen Add Zoe at the top\nZoe: Row #3\nAda: Row #1\nBob: Row #2'], 'Each person kept their own state; only Zoe\'s row is new. That is why a key should come from the data: an id, or anything that names the item and never changes.']
          ]
        },
        {
          id: 'same-place', label: 'Same type, same place', state: 'name',
          desc: 'One Row whose name prop changes from Ada to Bob.',
          code: code.apply(null, ROW_TOP.concat(NAME_APP, ['        <Row name={name} />'], ROWS_END)),
          steps: [
            [15, ['render 1', 'snap "Ada"'], 'Render 1: `name` is "Ada".'],
            [20, [], 'One `<Row name="Ada" />`, with no key: the first child of the `<ul>`.'],
            [8, ['log new Row #1 for Ada'], 'React creates it: Row **#1**.'],
            [11, ['screen Switch to Bob\nAda: Row #1'], 'The screen shows Ada and her Row.'],
            [18, ['run the click handler, made in render 1', 'queue replace it with "Bob"'], 'You click: "replace it with Bob".'],
            [18, ['run'], 'The handler ends.'],
            [15, ['render 2', 'apply "Bob"', 'snap "Bob"', 'clear'], 'Render 2: `name` is "Bob".'],
            [20, [], 'In the same place, the first child of the `<ul>`, there is again a `<Row>`: the same type. React does not care that the data is about someone else. It keeps the component, **Row #1**, and passes it `name="Bob"`.'],
            [11, ['screen Switch to Bob\nBob: Row #1'], 'Bob now shows the state made for Ada, and nothing was logged: no new Row. Usually that is what you want (a form keeps its text when a label changes). When it is not, give the Row a key that changes with the person: the next example.']
          ]
        },
        {
          id: 'new-key', label: 'A new key: a new component', state: 'name',
          desc: 'The same Row, keyed by the name it shows.',
          code: code.apply(null, ROW_TOP.concat(NAME_APP, ['        <Row key={name} name={name} />'], ROWS_END)),
          steps: [
            [15, ['render 1', 'snap "Ada"'], 'Render 1: `name` is "Ada".'],
            [20, [], 'One `<Row key="Ada" name="Ada" />`.'],
            [8, ['log new Row #1 for Ada'], 'React creates it: Row **#1**.'],
            [11, ['screen Switch to Bob\nAda: Row #1'], 'The screen shows Ada.'],
            [18, ['run the click handler, made in render 1', 'queue replace it with "Bob"'], 'You click.'],
            [18, ['run'], 'The handler ends.'],
            [15, ['render 2', 'apply "Bob"', 'snap "Bob"', 'clear'], 'Render 2: `name` is "Bob".'],
            [20, [], 'Again a `<Row>` in the same place, but its key is now "Bob", and last time it was "Ada". A different key is a different component: React throws Row #1 away, with its state…'],
            [8, ['log new Row #2 for Bob'], '…and creates **Row #2**, for Bob.'],
            [11, ['screen Switch to Bob\nBob: Row #2'], 'Bob starts afresh. This is how you reset a form, a chat draft or a video player when its subject changes, `<Chat key={contact.id} … />`, with no effect to clear anything.']
          ]
        },
        {
          id: 'parent-type', label: 'A different parent type', state: 'boxed',
          desc: 'The same Row, inside a <div> or inside a <section>.',
          code: code.apply(null, ROW_TOP.concat([
            'export default function App() {',
            '  const [boxed, setBoxed] = useState(false);',
            '  return (',
            '    <div>',
            '      <button onClick={() => setBoxed(true)}>Put it in a box</button>',
            '      {boxed ? (',
            '        <section><ul><Row name="Ada" /></ul></section>',
            '      ) : (',
            '        <div><ul><Row name="Ada" /></ul></div>',
            '      )}',
            '    </div>',
            '  );',
            '}'])),
          steps: [
            [15, ['render 1', 'snap false'], 'Render 1: `boxed` is false.'],
            [22, [], 'So the second branch: a `<div>` with a `<ul>` in it, and a `<Row name="Ada" />` in that.'],
            [8, ['log new Row #1 for Ada'], 'React creates the Row: **#1**.'],
            [11, ['screen Put it in a box\nAda: Row #1'], 'The screen shows Ada.'],
            [18, ['run the click handler, made in render 1', 'queue replace it with true'], 'You click: `boxed` will be true.'],
            [18, ['run'], 'The handler ends.'],
            [15, ['render 2', 'apply true', 'snap true', 'clear'], 'Render 2: `boxed` is true.'],
            [20, [], 'In that place there is now a `<section>` where a `<div>` was: a different type. React throws the `<div>` away with **everything inside it**: the `<ul>`, and Row #1 with its state.'],
            [8, ['log new Row #2 for Ada'], 'Then it builds the `<section>` from nothing, with a brand-new Row, **#2**, though it is still a `Row` and still Ada\'s.'],
            [11, ['screen Put it in a box\nAda: Row #2'], 'The same name, a new number: the state is gone. Wrapping something in a different element on some renders resets it. Keep the wrapper\'s type the same, and change only its props or class.']
          ]
        },
        {
          id: 'inner-component', label: 'A component defined inside another', state: 'clicks',
          desc: 'Row written inside App; a click changes only the button\'s text.',
          code: code(
            "import { useState } from 'react';",
            '',
            'let made = 0;',
            '',
            'export default function App() {',
            '  const [clicks, setClicks] = useState(0);',
            '',
            '  function Row({ name }) {',
            '    const [id] = useState(() => {',
            '      made = made + 1;',
            "      console.log('new Row #' + made + ' for ' + name);",
            '      return made;',
            '    });',
            '    return <li>{name}: Row #{id}</li>;',
            '  }',
            '',
            '  return (',
            '    <div>',
            '      <button onClick={() => setClicks(clicks + 1)}>Clicks: {clicks}</button>',
            '      <ul>',
            '        <Row name="Ada" />',
            '      </ul>',
            '    </div>',
            '  );',
            '}'),
          steps: [
            [6, ['render 1', 'snap 0'], 'Render 1: `clicks` is 0.'],
            [8, [], 'Render 1 runs `function Row…`, which makes a function named `Row`: a new function, made in this render.'],
            [11, ['log new Row #1 for Ada'], 'React creates a component of that type in the `<ul>`: Row **#1**.'],
            [14, ['screen Clicks: 0\nAda: Row #1'], 'The screen shows the count and Ada\'s Row.'],
            [19, ['run the click handler, made in render 1', 'queue replace it with 1'], 'You click: only `clicks` changes.'],
            [19, ['run'], 'The handler ends.'],
            [6, ['render 2', 'apply 1', 'snap 1', 'clear'], 'Render 2: `clicks` is 1.'],
            [8, [], 'Render 2 runs `function Row…` again, and makes **another** function. Same name, same code, but a different function, so for React a different type.'],
            [21, [], 'In the `<ul>`, the type was render 1\'s `Row` and is now render 2\'s. A different type: React throws Row #1 away, with its state and its DOM…'],
            [11, ['log new Row #2 for Ada'], '…and creates Row **#2**.'],
            [14, ['screen Clicks: 1\nAda: Row #2'], 'Every render of `App` rebuilds the child from scratch: its state is lost, an input in it would lose the focus, its effects would run again. Move `Row` to the top level of the file, and pass it what it needs as props.']
          ]
        }
      ]
    }
  ]);
})(window.RLT);
