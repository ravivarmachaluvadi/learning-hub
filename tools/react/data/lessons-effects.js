/*
 * Lessons, track 3: Effects and refs.
 *
 * The lesson shape, and how the code is written (template literals that never use `${`), are
 * described at the top of data/lessons-foundations.js. Every challenge of this track says
 * `strict: true`: its preview runs inside <StrictMode>, as a new React project does, so a missing
 * cleanup shows up the way it would at work (two listeners, two connections). The cleanup lesson's
 * example runs in it too, to show the double run; the other examples do not, so their consoles read
 * simply. The rules-of-hooks example has a hook inside an `if` on purpose (tests/test_ui.py lists it
 * in ON_PURPOSE): clicking its button shows React's crash.
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  function block(lang, lines) { return '```' + lang + '\n' + lines.join('\n') + '\n```'; }
  function jsx() { return block('jsx', [].slice.call(arguments)); }
  function js() { return block('js', [].slice.call(arguments)); }

  L.push(
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'r-effects', track: 'effects',
      title: 'Effects: code that runs after the render',
      summary: 'An effect is code React runs after it has updated the screen, to keep your component in step with something outside React: the page title, a timer, a connection, the network. The dependency array says when it runs again.',
      keywords: ['useEffect', 'effect', 'side effect', 'after render', 'dependency array', 'componentDidMount', 'componentDidUpdate', 'lifecycle', 'class lifecycle', 'document.title', 'localStorage', 'synchronise', 'synchronize', 'external system', 'mount'],
      docs: 'https://react.dev/learn/synchronizing-with-effects', uilt: 'js-dom',
      body: [
        'Rendering must be **pure**: from the props and the state, work out the JSX, and nothing else. But some code has to *do* something because the component is on the screen: set the page title, start a timer, connect to a chat server, fetch data. Event handlers cover what a click causes. **Effects** cover what being on the screen causes.',
        jsx("import { useEffect } from 'react';",
            '',
            'function Inbox({ unread }) {',
            '  useEffect(() => {',
            "    document.title = '(' + unread + ') Inbox';",
            '  }, [unread]);',
            '  return <h1>Inbox</h1>;',
            '}'),
        '## When it runs',
        '| Step | What happens |\n|---|---|\n' +
        '| 1. Render | React calls `Inbox`, which returns JSX. `useEffect` hands its function to React; it does not run it |\n' +
        '| 2. Commit | React changes the DOM to match the JSX |\n' +
        '| 3. Paint | The browser draws the new screen |\n' +
        '| 4. Effect | React runs the effect, with the values of the render that made it |',
        'So the user never waits for an effect to see the screen, and an effect always finds the DOM already updated. [[explain:effect-timeline]] steps through it, with the console of real React beside it.',
        '## The dependency array',
        '| You write | The effect runs |\n|---|---|\n' +
        '| `useEffect(fn, [unread])` | After the first render, then after every render in which `unread` changed |\n' +
        '| `useEffect(fn, [])` | Once, after the first render |\n' +
        '| `useEffect(fn)` | After every render |',
        'After each render React compares every dependency with its value last time and skips the effect if none changed. List **every** value from the component that the effect reads; [[lesson:r-effect-deps]] explains why, and what goes wrong otherwise.',
        '## Not everything is an effect',
        '- **A value worked out from props or state** is computed while rendering: `const fullName = first + \' \' + last;`. Copying it into state from an effect costs an extra render, and for that moment the screen shows the old value.',
        '- **What a click causes** belongs in the click handler: `function handleBuy() { addToCart(item); showToast(\'Added\'); }`, not in an effect that watches the cart.',
        'The word for an effect is **synchronise**: it keeps something outside React in step with your state.',
        '## Coming from class components',
        '| A class component had | A function component uses |\n|---|---|\n' +
        '| `componentDidMount` | `useEffect(fn, [])` |\n' +
        '| `componentDidUpdate` | `useEffect(fn, [deps])` |\n' +
        '| `componentWillUnmount` | The cleanup that the effect returns: [[lesson:r-effect-cleanup]] |\n' +
        '| `shouldComponentUpdate`, `PureComponent` | `memo`: [[lesson:r-memo]] |',
        'One effect holds the setup **and** the teardown of one concern, where a class spread them over three methods mixed with every other concern. Think "keep this in step with these values", not "run this on mount". The interview questions are [[q:use-effect]] and [[q:lifecycle-vs-hooks]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you change the page and do the extra work in the same function: `count++; render(); document.title = count + " new";`. React splits the two. Rendering only describes the page; React draws it, then runs your effects, the "extra work", with the values that render used. It is a little like a `setTimeout(fn, 0)` after each redraw, except that React decides which effects to run by comparing their dependencies.',
      example: {
        code: `import { useState, useEffect } from 'react';

export default function App() {
  const [draft, setDraft] = useState(() => localStorage.getItem('draft') || '');
  console.log('render: the draft is', JSON.stringify(draft));

  useEffect(() => {
    console.log('effect: saving', JSON.stringify(draft));
    localStorage.setItem('draft', draft);
  }, [draft]);

  return (
    <div className="note">
      <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type a note, then press Run" />
      <p className="small">{draft.length} characters, saved after every change</p>
    </div>
  );
}
`,
        css: '.note { display: grid; gap: 6px; max-width: 360px; } .note textarea { min-height: 70px; font: inherit; padding: 6px 8px; } .small { margin: 0; color: #667; font-size: 13px; }',
        note: 'Type a few letters and read the console: each keystroke prints "render" first, then "effect". Then press **Run**: the component starts again from nothing, and the note comes back from `localStorage`, which the effect kept in step.'
      },
      challenge: {
        title: 'The tab title follows the unread count',
        strict: true,
        task: 'An inbox shows how many messages are unread. Keep the browser tab\'s title in step with it, as Gmail does:\n\n' +
          '- `(3) Inbox` while 3 are unread, and `Inbox` when none are.\n' +
          '- It changes with the count: **New message** adds one, **Read all** clears them.\n' +
          '- Typing in the search box must not set the title again: set it only when the count changes.\n\n' +
          'The preview is a page of its own, so `document.title` is its title (the checks read it there). Like every challenge of this track, it runs inside `<StrictMode>`: the next lesson explains what that changes.',
        starter: `import { useState, useEffect } from 'react';

export default function Inbox() {
  const [unread, setUnread] = useState(3);
  const [search, setSearch] = useState('');

  return (
    <div className="inbox">
      <h2>Inbox <span className="count">{unread}</span></h2>
      <input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mail" />
      <button className="new" onClick={() => setUnread(unread + 1)}>New message</button>
      <button className="read" onClick={() => setUnread(0)}>Read all</button>
    </div>
  );
}
`,
        solution: `import { useState, useEffect } from 'react';

export default function Inbox() {
  const [unread, setUnread] = useState(3);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = unread > 0 ? '(' + unread + ') Inbox' : 'Inbox';
  }, [unread]);

  return (
    <div className="inbox">
      <h2>Inbox <span className="count">{unread}</span></h2>
      <input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mail" />
      <button className="new" onClick={() => setUnread(unread + 1)}>New message</button>
      <button className="read" onClick={() => setUnread(0)}>Read all</button>
    </div>
  );
}
`,
        css: '.inbox { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; } .inbox h2 { flex-basis: 100%; margin: 0; } .count { display: inline-block; min-width: 1.6em; padding: 0 6px; border-radius: 999px; background: #c62828; color: #fff; font-size: 14px; text-align: center; } .search { padding: 4px 8px; }',
        hints: [
          'The title lives outside React, so set it in an effect, inside `Inbox` before the `return`: `useEffect(() => { document.title = …; }, [unread]);`.',
          'Work the text out from `unread`: `unread > 0 ? \'(\' + unread + \') Inbox\' : \'Inbox\'`.',
          'Without the dependency array the effect runs after **every** render, including the one each keystroke in the search box causes; and code in the component\'s body runs on every render too. `[unread]` makes React skip the effect unless `unread` changed.'
        ],
        checks: [
          { label: 'At the start the title is "(3) Inbox"', fn: `function (doc) {
  return doc.title === '(3) Inbox' || 'the title is "' + doc.title + '"';
}` },
          { label: 'New message: "(4) Inbox"', fn: `async function (doc, win, t) {
  await t.click('.new');
  return doc.title === '(4) Inbox' || 'the title is "' + doc.title + '"';
}` },
          { label: 'Read all: "Inbox"', fn: `async function (doc, win, t) {
  await t.click('.read');
  return doc.title === 'Inbox' || 'the title is "' + doc.title + '"';
}` },
          { label: 'Typing in the search box does not set the title again', fn: `async function (doc, win, t) {
  var own = Object.getOwnPropertyDescriptor(win.Document.prototype, 'title'), sets = 0;
  Object.defineProperty(doc, 'title', { configurable: true, get: function () { return own.get.call(doc); }, set: function (v) { sets++; own.set.call(doc, v); } });
  try {
    await t.type('.search', 'invoice');
    await t.type('.search', 'invoices');
  } finally { delete doc.title; }
  return sets === 0 || 'typing set the title ' + sets + ' times: it is set on every render. Set it in an effect with [unread] as its dependencies';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'r-effect-cleanup', track: 'effects',
      title: 'Cleanup, and why effects run twice',
      summary: 'An effect that starts something (a timer, a listener, a connection) returns a function that stops it. React runs that cleanup before the effect runs again and when the component leaves the page. In development, StrictMode runs each new effect, its cleanup and the effect again, to show the cleanups you forgot.',
      keywords: ['cleanup', 'clean up', 'return a function', 'unmount', 'componentWillUnmount', 'setInterval', 'clearInterval', 'addEventListener', 'removeEventListener', 'StrictMode', 'strict mode', 'effect runs twice', 'double effect', 'memory leak', 'subscription', 'idempotent'],
      docs: 'https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development', uilt: 'js-events',
      body: [
        'Some effects start something that keeps going: a timer ticks, a listener waits for keys, a socket stays open. When the component leaves the page, or the effect runs again with new values, that something must stop. The effect says how by **returning a function**, its cleanup:',
        jsx('useEffect(() => {',
            '  const id = setInterval(() => setTime(new Date()), 1000);   // start',
            '  return () => clearInterval(id);                             // stop',
            '}, []);'),
        '## When the cleanup runs',
        '| Moment | What React runs |\n|---|---|\n' +
        '| The component appears | The effect |\n' +
        '| A dependency changed | The **old** cleanup, then the effect with the new values |\n' +
        '| The component leaves the page | The last cleanup |',
        'A cleanup belongs to the render that made it, so it sees **that** render\'s values. When `roomId` changes from `general` to `travel`, the old cleanup disconnects from `general`: exactly the room it connected to. [[explain:effect-timeline]] shows the order, one move at a time.',
        '## What undoes what',
        '| An effect that starts | Is cleaned up with |\n|---|---|\n' +
        '| `setInterval(fn, ms)`, `setTimeout(fn, ms)` | `clearInterval(id)`, `clearTimeout(id)` |\n' +
        '| `window.addEventListener(\'keydown\', onKey)` | `window.removeEventListener(\'keydown\', onKey)`, with the **same** function |\n' +
        '| `const socket = connect(room)` | `socket.disconnect()` |\n' +
        '| `fetch(url)` | Ignoring or aborting its answer: [[lesson:r-fetching]] |',
        'The listener trap: `removeEventListener(\'keydown\', e => …)` removes nothing, because a new arrow function is a different function. Keep the one you added in a variable, and remove that.',
        '## Why effects run twice in development',
        'A new React project wraps the app in `<StrictMode>` (look in `main.jsx`). In **development**, StrictMode makes React run every effect, its cleanup, and the effect again when a component first appears: a pretend unmount and mount. Production runs it once.',
        'It is a test. A cleanup that really undoes its effect makes effect, cleanup, effect end exactly where one effect would. A missing cleanup shows at once: two intervals tick twice as fast, two listeners toggle twice and seem to do nothing, two chat connections stay open. Users would meet the same bug later, when they leave a page and come back.',
        'So fix the cleanup, never StrictMode. (StrictMode also calls your components twice, which is why rendering must be pure.) The interview question is [[q:effects-twice]].',
        'From here on, the challenges and machine-coding problems of this track run inside `<StrictMode>`, as a new project does.'
      ].join('\n\n'),
      plainjs: 'A plain-JavaScript page that starts a timer or adds a listener often never stops it: the page lives until you leave it. In React, components come and go while the page stays (a tab closes, a dialog shuts), so whatever a component started must stop with it. The cleanup is the `removeEventListener` you would write in a `destroy()` method, kept right next to the `addEventListener` it undoes.',
      example: {
        strict: true,
        code: `import { useState, useEffect } from 'react';

function Clock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    console.log('start the interval');
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => {
      console.log('clear the interval');
      clearInterval(id);
    };
  }, []);

  return <p className="clock">{time.toLocaleTimeString()}</p>;
}

export default function App() {
  const [show, setShow] = useState(true);
  return (
    <div>
      <label>
        <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} /> Show the clock
      </label>
      {show && <Clock />}
    </div>
  );
}
`,
        css: '.clock { font: 700 32px ui-monospace, Consolas, monospace; margin: 8px 0; }',
        note: 'This example runs inside `<StrictMode>`. Read the console from the top: when the clock first appeared, its effect started, was cleaned up, and started again. Untick the box: the cleanup runs once more, and the clock stops for good. Delete the `return` and run it: two intervals start, and nothing ever stops them.'
      },
      challenge: {
        title: 'A keyboard shortcut that leaves with its component',
        strict: true,
        task: 'Pressing **?** anywhere on the page should open and close the shortcut help, as in Gmail and GitHub. The listener goes on `window`, from an effect in `ShortcutHelp`.\n\n' +
          '- **?** opens the help (`<div className="help">`), and **?** again closes it.\n' +
          '- Unticking **Keyboard shortcuts** takes `ShortcutHelp` off the page: its listener must go with it, and come back when the box is ticked again.\n\n' +
          'This preview runs inside `<StrictMode>`: if the listener is never removed, the effect\'s second run adds a second one, and every **?** toggles the help twice.',
        starter: `import { useState, useEffect } from 'react';

function ShortcutHelp() {
  const [open, setOpen] = useState(false);

  // TODO: while this component is on the page, pressing "?" toggles the help

  return open ? (
    <div className="help">
      <b>Keyboard shortcuts</b>
      <p>? shows or hides this help · / searches · c writes a new message</p>
    </div>
  ) : (
    <p className="hint">Press ? for the keyboard shortcuts</p>
  );
}

export default function App() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div>
      <label>
        <input type="checkbox" className="enable" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Keyboard shortcuts
      </label>
      {enabled && <ShortcutHelp />}
    </div>
  );
}
`,
        solution: `import { useState, useEffect } from 'react';

function ShortcutHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === '?') setOpen(o => !o);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return open ? (
    <div className="help">
      <b>Keyboard shortcuts</b>
      <p>? shows or hides this help · / searches · c writes a new message</p>
    </div>
  ) : (
    <p className="hint">Press ? for the keyboard shortcuts</p>
  );
}

export default function App() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div>
      <label>
        <input type="checkbox" className="enable" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Keyboard shortcuts
      </label>
      {enabled && <ShortcutHelp />}
    </div>
  );
}
`,
        css: '.help { margin-top: 8px; padding: 8px 12px; border: 1px solid #b5c0cf; border-radius: 8px; background: #f4f6f9; } .help p { margin: 4px 0 0; } .hint { color: #667; }',
        hints: [
          'Inside `ShortcutHelp`, add the listener in an effect that runs once: `useEffect(() => { function onKey(e) { if (e.key === \'?\') setOpen(o => !o); } window.addEventListener(\'keydown\', onKey); … }, []);`.',
          'Return the cleanup, with the **same** function: `return () => window.removeEventListener(\'keydown\', onKey);`. A new arrow function there would remove nothing.',
          'The effect runs once, so the `open` it can see is the first render\'s, `false` for ever: `setOpen(!open)` could open the help but never close it. Toggle with an updater, `setOpen(o => !o)`, which always gets the latest value.'
        ],
        checks: [
          { label: '**?** opens the help, and **?** again closes it', fn: `async function (doc, win, t) {
  await t.key('body', '?');
  if (!doc.querySelector('.help')) return 'after one ?, the help is not open';
  await t.key('body', '?');
  return !doc.querySelector('.help') || 'after a second ?, the help is still open';
}` },
          { label: 'Unticking the box removes the listener from `window`; ticking it adds one back', fn: `async function (doc, win, t) {
  var live = [], add = win.addEventListener, remove = win.removeEventListener;
  win.addEventListener = function (type, fn, o) { if (type === 'keydown') live.push(fn); return add.call(this, type, fn, o); };
  win.removeEventListener = function (type, fn, o) { var i = type === 'keydown' ? live.indexOf(fn) : -1; if (i >= 0) live.splice(i, 1); return remove.call(this, type, fn, o); };
  try {
    await t.click('.enable');
    await t.click('.enable');
    if (live.length !== 1) return 'ticking the box again left ' + live.length + ' keydown listeners on window (one is right)';
    await t.click('.enable');
  } finally { delete win.addEventListener; delete win.removeEventListener; }
  return !live.length || 'with the box unticked, ' + live.length + ' keydown listener is still on window: the cleanup must remove the same function';
}` },
          { label: 'Ticked again, **?** opens the help', fn: `async function (doc, win, t) {
  if (!doc.querySelector('.enable').checked) await t.click('.enable');
  await t.key('body', '?');
  return !!doc.querySelector('.help') || 'after ticking the box again, ? does not open the help';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'r-effect-deps', track: 'effects',
      title: 'Dependencies: when an effect runs again',
      summary: 'List every value from the component that the effect reads. React compares each with the last render\'s and runs the effect again when one changed. Objects and functions made during render are new every time, state the effect sets can loop, and many effects should not exist at all.',
      keywords: ['dependencies', 'dependency', 'deps', 'exhaustive-deps', 'missing dependency', 'Object.is', 'infinite loop', 'Maximum update depth', 'reconnect', 'object dependency', 'useEffectEvent', 'you might not need an effect', 'derived state', 'reactive values', 'stale value'],
      docs: 'https://react.dev/learn/lifecycle-of-reactive-effects',
      body: [
        'An effect reads values from its render: props, state, and anything worked out from them. These are **reactive** values: the next render may bring new ones, and then the effect is out of step. The dependency array lists them, and React runs the effect again when any of them changed.',
        jsx('function ChatRoom({ roomId }) {',
            "  const [serverUrl, setServerUrl] = useState('https://chat.example.com');",
            '',
            '  useEffect(() => {',
            '    const connection = createConnection(serverUrl, roomId);',
            '    connection.connect();',
            '    return () => connection.disconnect();',
            '  }, [serverUrl, roomId]);   // both are read inside',
            '}'),
        '## How React compares',
        'After each render, React compares every dependency with its value last time using `Object.is`: numbers, strings and booleans by value; objects, arrays and functions by **reference**, "is it the same object?". If every one is the same, React skips the effect, and its cleanup.',
        '## Three mistakes',
        '| Mistake | What you see | The fix |\n|---|---|---|\n' +
        '| A value read but not listed | The effect keeps using an old value | List it: the `react-hooks/exhaustive-deps` lint rule names it |\n' +
        '| An object or function made during render, listed | The effect runs after **every** render, because it is new each time | Make it inside the effect, or depend on its plain fields |\n' +
        '| State the effect sets, listed | An endless loop: "Maximum update depth exceeded" | An updater, or no effect at all |',
        jsx('const options = { serverUrl, roomId };        // ❌ a new object on every render',
            'useEffect(() => { … createConnection(options) … }, [options]);',
            '',
            'useEffect(() => {',
            '  const options = { serverUrl, roomId };      // ✅ made inside: depend on the strings',
            '  …',
            '}, [serverUrl, roomId]);'),
        'A value read but not listed is a **stale closure**: the effect still sees the render that made it. [[explain:stale-closure]] steps through one.',
        '## You might not need an effect',
        '| Instead of an effect that… | Do this |\n|---|---|\n' +
        '| works a value out from props or state | Compute it while rendering: `const visible = todos.filter(…)` |\n' +
        '| responds to a click by watching state | Do it in the click handler |\n' +
        '| resets the state when a prop changes | Give the component a `key`: `<Profile key={userId} />` |',
        'An effect is for **synchronising with something outside React**. When nothing outside is involved, you almost certainly do not need one. The interview question is [[q:effect-mistakes]].',
        '## Reading a value without reacting to it',
        'Sometimes an effect needs the latest value of something that should not make it run again: show a toast in the current theme when the room connects, without reconnecting when the theme changes. React 19.2 adds `useEffectEvent`: a function that always sees the latest values, and is not a dependency.',
        jsx("const onConnected = useEffectEvent(() => showToast('Connected!', theme));",
            '',
            'useEffect(() => {',
            '  const connection = createConnection(serverUrl, roomId);',
            "  connection.on('connected', () => onConnected());",
            '  connection.connect();',
            '  return () => connection.disconnect();',
            '}, [serverUrl, roomId]);   // theme is not listed, and need not be'),
        'Before it, the same was done with a ref that holds the latest value: [[lesson:r-refs]].'
      ].join('\n\n'),
      plainjs: 'Plain JavaScript has no dependency arrays: you redo a piece of work in the handler that changed its input (`select.onchange = () => { socket.close(); socket = connect(select.value); }`). React calls your component again for every change, so it needs a rule for which effects to redo: the ones whose inputs changed. The dependency array is that list of inputs, and the cleanup is your `socket.close()`.',
      example: {
        code: `import { useState, useEffect } from 'react';

function createConnection(roomId) {
  // a pretend chat server: it only logs
  return {
    connect() { console.log('connected to #' + roomId); },
    disconnect() { console.log('disconnected from #' + roomId); }
  };
}

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);

  return (
    <div>
      <h3>Welcome to #{roomId}</h3>
      <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message" />
    </div>
  );
}

export default function App() {
  const [roomId, setRoomId] = useState('general');
  return (
    <div>
      <label>
        Room{' '}
        <select value={roomId} onChange={e => setRoomId(e.target.value)}>
          <option value="general">general</option>
          <option value="travel">travel</option>
          <option value="music">music</option>
        </select>
      </label>
      <ChatRoom roomId={roomId} />
    </div>
  );
}
`,
        css: 'h3 { margin: 10px 0 6px; } input { padding: 4px 8px; }',
        note: 'Change the room and read the console: the old room disconnects, then the new one connects. Type a message: nothing reconnects, because `message` is not a dependency. Change the array to `[roomId, message]` and type again.'
      },
      challenge: {
        title: 'Reconnect when the room changes, not on every keystroke',
        strict: true,
        task: 'This chat reconnects to the server on every keystroke: type a message and watch the console. Fix the effect in `ChatRoom` so that:\n\n' +
          '- It connects to the room when it appears.\n' +
          '- Switching rooms disconnects from the old room and connects to the new one.\n' +
          '- Typing a message connects and disconnects nothing.\n\n' +
          'Keep `createConnection` and the lines above it as they are: they log to the console and record each call for the checks.',
        starter: `import { useState, useEffect } from 'react';

const SERVER = 'https://chat.example.com';
const calls = [];
window.chatCalls = calls;   // the checks read what happened

function createConnection({ serverUrl, roomId }) {
  return {
    connect() { calls.push('connect ' + roomId); console.log('connected to #' + roomId + ' at ' + serverUrl); },
    disconnect() { calls.push('disconnect ' + roomId); console.log('disconnected from #' + roomId); }
  };
}

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');
  const options = { serverUrl: SERVER, roomId: roomId };

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [options]);

  return (
    <div>
      <h3>#{roomId}</h3>
      <input className="message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" />
    </div>
  );
}

export default function App() {
  const [roomId, setRoomId] = useState('general');
  return (
    <div>
      <select className="room" value={roomId} onChange={e => setRoomId(e.target.value)}>
        <option value="general">general</option>
        <option value="travel">travel</option>
      </select>
      <ChatRoom roomId={roomId} />
    </div>
  );
}
`,
        solution: `import { useState, useEffect } from 'react';

const SERVER = 'https://chat.example.com';
const calls = [];
window.chatCalls = calls;   // the checks read what happened

function createConnection({ serverUrl, roomId }) {
  return {
    connect() { calls.push('connect ' + roomId); console.log('connected to #' + roomId + ' at ' + serverUrl); },
    disconnect() { calls.push('disconnect ' + roomId); console.log('disconnected from #' + roomId); }
  };
}

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const connection = createConnection({ serverUrl: SERVER, roomId: roomId });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);

  return (
    <div>
      <h3>#{roomId}</h3>
      <input className="message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" />
    </div>
  );
}

export default function App() {
  const [roomId, setRoomId] = useState('general');
  return (
    <div>
      <select className="room" value={roomId} onChange={e => setRoomId(e.target.value)}>
        <option value="general">general</option>
        <option value="travel">travel</option>
      </select>
      <ChatRoom roomId={roomId} />
    </div>
  );
}
`,
        css: 'h3 { margin: 10px 0 6px; } .message { padding: 4px 8px; }',
        hints: [
          '`options` is a new object on every render, so `[options]` always counts as changed: every keystroke re-renders `ChatRoom`, and the effect reconnects.',
          'Make the object inside the effect, `createConnection({ serverUrl: SERVER, roomId: roomId })`, and list what it is made from: `[roomId]`. `SERVER` is a constant outside the component, so it is not a dependency.'
        ],
        checks: [
          { label: 'When it appears, it is connected to #general, and only to it', fn: `function (doc, win) {
  if (!win.chatCalls) return 'window.chatCalls is gone: keep createConnection and the lines above it';
  var on = {};
  win.chatCalls.forEach(function (c) { var p = c.split(' '); on[p[1]] = (on[p[1]] || 0) + (p[0] === 'connect' ? 1 : -1); });
  var now = Object.keys(on).filter(function (r) { return on[r] > 0; }).sort().join(', ');
  return now === 'general' || 'connected now: ' + (now || 'nothing');
}` },
          { label: 'Switching to #travel disconnects #general and connects #travel', fn: `async function (doc, win, t) {
  await t.type('.room', 'travel');
  var on = {};
  win.chatCalls.forEach(function (c) { var p = c.split(' '); on[p[1]] = (on[p[1]] || 0) + (p[0] === 'connect' ? 1 : -1); });
  var now = Object.keys(on).filter(function (r) { return on[r] > 0; }).sort().join(', ');
  return now === 'travel' || 'connected now: ' + (now || 'nothing');
}` },
          { label: 'Typing a message connects and disconnects nothing', fn: `async function (doc, win, t) {
  var before = win.chatCalls.length;
  await t.type('.message', 'h');
  await t.type('.message', 'hi');
  var extra = win.chatCalls.slice(before);
  return !extra.length || 'typing two letters caused: ' + extra.join(', ');
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'r-fetching', track: 'effects',
      title: 'Fetching data without races',
      summary: 'Fetch in an effect when the data depends on what is on the screen, and show three states: loading, the data, an error. Answers can arrive out of order, so the cleanup marks an old request as stale (an ignore flag, or AbortController) and its answer is dropped.',
      keywords: ['fetch', 'fetching', 'data fetching', 'loading', 'loading state', 'error state', 'race condition', 'race', 'out of order', 'ignore flag', 'AbortController', 'abort', 'async effect', 'async await', 'TanStack Query', 'react query', 'stale response'],
      docs: 'https://react.dev/learn/synchronizing-with-effects#fetching-data', uilt: 'js-fetch',
      body: [
        'A profile shows the person picked in a list, and the data lives on a server. Keeping the screen in step with the server is synchronising with something outside React, so the fetch goes in an effect that depends on the person:',
        jsx('function Profile({ userId }) {',
            '  const [user, setUser] = useState(null);',
            '  const [error, setError] = useState(null);',
            '',
            '  useEffect(() => {',
            '    let ignore = false;',
            '    setUser(null);',
            '    setError(null);',
            "    fetch('/api/users/' + userId)",
            '      .then(res => {',
            "        if (!res.ok) throw new Error('HTTP ' + res.status);",
            '        return res.json();',
            '      })',
            '      .then(data => { if (!ignore) setUser(data); })',
            '      .catch(err => { if (!ignore) setError(err.message); });',
            '    return () => { ignore = true; };',
            '  }, [userId]);',
            '',
            '  if (error) return <p>Could not load: {error}</p>;',
            '  if (!user) return <p>Loading…</p>;',
            '  return <h2>{user.name}</h2>;',
            '}'),
        '## The race',
        'Pick Alice, then quickly Bob: two requests are on their way. If Alice\'s answer is slow, Bob\'s arrives first and the page shows Bob; then Alice\'s arrives and, without protection, the page switches to **Alice** while Bob is selected. Answers do not come back in the order you asked.',
        'The fix is in the cleanup. When `userId` changes, React runs the old effect\'s cleanup, which sets **its** `ignore` to true. The old request still finishes, but its answer is dropped. Each run of the effect has its own `ignore` variable: a closure again, used on purpose.',
        '## AbortController',
        js('useEffect(() => {',
           '  const controller = new AbortController();',
           '  fetch(url, { signal: controller.signal })',
           '    .then(res => res.json())',
           '    .then(setData)',
           "    .catch(err => { if (err.name !== 'AbortError') setError(err.message); });",
           '  return () => controller.abort();',
           '}, [url]);'),
        'It cancels the request itself, so less is downloaded, and the browser rejects the promise with an `AbortError`, which is not a real failure: do not show it.',
        '## async inside, not outside',
        'The effect\'s function must return nothing or a cleanup, never a promise, so it cannot be `async` itself. Write an async function inside it and call it:',
        jsx('useEffect(() => {',
            '  let ignore = false;',
            '  async function load() {',
            "    const res = await fetch('/api/users/' + userId);",
            '    const data = await res.json();',
            '    if (!ignore) setUser(data);',
            '  }',
            '  load();',
            '  return () => { ignore = true; };',
            '}, [userId]);'),
        '## In real apps',
        'An effect fetches with no cache, no retry, nothing shared between two components that need the same data, and only after the page has rendered. Most teams use **TanStack Query** (`useQuery`) or their framework\'s loaders, which handle all of that; React 19\'s `use()` reads a promise inside a component ([[lesson:r-use]]). The effect version, and its race, is still what interviews ask about: [[q:effect-mistakes]].',
        'In StrictMode the effect fetches twice when the component appears in development, and the first answer is ignored: the same protection, doing its job.'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript the race is just as real: `select.onchange = async () => { const user = await (await fetch(url)).json(); render(user); }`, and a slow first answer overwrites a fast second one. The usual fix is a counter (`const ticket = ++latest; … if (ticket !== latest) return;`) or `AbortController`. React gives the fix a natural home: the cleanup runs exactly when the old request stops mattering.',
      example: {
        code: `import { useState, useEffect } from 'react';

function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setUser(null);
    setError(null);
    fetch('/api/users/' + userId)
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(data => {
        if (!ignore) setUser(data);
      })
      .catch(err => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [userId]);

  if (error) return <p className="error">Could not load user {userId}: {error}</p>;
  if (!user) return <p className="small">Loading…</p>;
  return (
    <div className="profile">
      <b>{user.name}</b> · {user.role}
      <div className="small">{user.email}</div>
    </div>
  );
}

export default function App() {
  const [userId, setUserId] = useState(1);
  return (
    <div>
      {[1, 2, 3, 4].map(id => (
        <button key={id} onClick={() => setUserId(id)} aria-pressed={id === userId}>
          User {id}
        </button>
      ))}
      <Profile userId={userId} />
    </div>
  );
}
`,
        css: 'button { margin: 0 6px 8px 0; } button[aria-pressed="true"] { font-weight: 700; } .profile { padding: 8px 12px; border: 1px solid #ccd; border-radius: 8px; max-width: 320px; } .small { color: #667; font-size: 13px; } .error { color: #c62828; }',
        note: 'Click the users one after another: each shows "Loading…" for 0.3 seconds, as long as the pretend server takes. User 4 does not exist, so the server answers 404 and the error shows. The console lists each request and its answer.'
      },
      challenge: {
        title: 'Never the wrong person',
        strict: true,
        task: 'Pick a person and their bio loads from `fetchBio`, a pretend server that answers in its own time: Alice\'s bio takes 0.8 seconds, Bob\'s 0.1, and Taylor\'s request fails.\n\n' +
          'Right now, picking **Alice** and then quickly **Bob** ends on Alice\'s bio while Bob is selected. Fix it so that:\n\n' +
          '- While a bio loads, `<p className="bio">` says `Loading…`.\n' +
          '- After quick switches it always ends on the bio of the person selected, whatever order the answers come in.\n' +
          '- A failed request shows its message in `<p className="error">` (instead of the bio).\n\n' +
          'Keep `fetchBio` as it is.',
        starter: `import { useState, useEffect } from 'react';

const DELAY = { Alice: 800, Bob: 100, Taylor: 300 };
const BIOS = { Alice: 'Alice writes compilers.', Bob: 'Bob plays the tabla.' };

function fetchBio(person) {
  // a pretend server: each person's answer takes its own time
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (person === 'Taylor') reject(new Error('This profile is private'));
      else resolve(BIOS[person]);
    }, DELAY[person]);
  });
}

export default function Profile() {
  const [person, setPerson] = useState('Bob');
  const [bio, setBio] = useState(null);

  useEffect(() => {
    fetchBio(person).then(result => setBio(result));
  }, [person]);

  return (
    <div>
      <select className="person" value={person} onChange={e => setPerson(e.target.value)}>
        <option>Alice</option>
        <option>Bob</option>
        <option>Taylor</option>
      </select>
      <p className="bio">{bio}</p>
    </div>
  );
}
`,
        solution: `import { useState, useEffect } from 'react';

const DELAY = { Alice: 800, Bob: 100, Taylor: 300 };
const BIOS = { Alice: 'Alice writes compilers.', Bob: 'Bob plays the tabla.' };

function fetchBio(person) {
  // a pretend server: each person's answer takes its own time
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (person === 'Taylor') reject(new Error('This profile is private'));
      else resolve(BIOS[person]);
    }, DELAY[person]);
  });
}

export default function Profile() {
  const [person, setPerson] = useState('Bob');
  const [bio, setBio] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setBio(null);
    setError(null);
    fetchBio(person)
      .then(result => {
        if (!ignore) setBio(result);
      })
      .catch(err => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [person]);

  return (
    <div>
      <select className="person" value={person} onChange={e => setPerson(e.target.value)}>
        <option>Alice</option>
        <option>Bob</option>
        <option>Taylor</option>
      </select>
      {error ? <p className="error">{error}</p> : <p className="bio">{bio === null ? 'Loading…' : bio}</p>}
    </div>
  );
}
`,
        css: '.person { padding: 4px 8px; } .bio { min-height: 1.4em; } .error { color: #c62828; }',
        hints: [
          'Show "Loading…" by clearing the bio when the effect starts, `setBio(null)`, and rendering `{bio === null ? \'Loading…\' : bio}`.',
          'Give each run of the effect its own flag: `let ignore = false;` at the top, `if (!ignore) setBio(result)` when the answer comes, and `return () => { ignore = true; };`. When the person changes, React runs the old cleanup, so the old answer is dropped.',
          'Add `.catch(err => { if (!ignore) setError(err.message); })`, keep `error` in state (cleared at the start, like the bio), and render `<p className="error">{error}</p>` while there is one.'
        ],
        checks: [
          { label: 'It loads Bob\'s bio', fn: `async function (doc, win, t) {
  for (var i = 0; i < 40 && t.text('.bio') !== 'Bob plays the tabla.'; i++) await t.wait(50);
  return t.text('.bio') === 'Bob plays the tabla.' || '.bio says "' + t.text('.bio') + '"';
}` },
          { label: 'Picking Alice says "Loading…" until her bio arrives', fn: `async function (doc, win, t) {
  await t.type('.person', 'Alice');
  if (t.text('.bio') !== 'Loading…') return 'right after picking Alice, .bio says "' + t.text('.bio') + '"';
  for (var i = 0; i < 40 && t.text('.bio') !== 'Alice writes compilers.'; i++) await t.wait(50);
  return t.text('.bio') === 'Alice writes compilers.' || 'after 2 seconds .bio says "' + t.text('.bio') + '"';
}` },
          { label: 'Bob, Alice, Bob in quick succession: it ends on Bob\'s bio', fn: `async function (doc, win, t) {
  await t.type('.person', 'Bob');
  await t.type('.person', 'Alice');
  await t.type('.person', 'Bob');
  await t.wait(1100);   // Alice's slow answer has arrived by now
  return t.text('.bio') === 'Bob plays the tabla.' || 'with Bob selected, .bio says "' + t.text('.bio') + '"';
}` },
          { label: 'Taylor\'s failed request shows its message in `.error`', fn: `async function (doc, win, t) {
  await t.type('.person', 'Taylor');
  for (var i = 0; i < 30 && !doc.querySelector('.error'); i++) await t.wait(50);
  var e = doc.querySelector('.error');
  if (!e) return 'no .error after the request failed';
  return e.textContent === 'This profile is private' || '.error says "' + e.textContent + '"';
}` },
          { label: 'Back to Bob, the error goes and his bio shows', fn: `async function (doc, win, t) {
  await t.type('.person', 'Bob');
  for (var i = 0; i < 30 && t.text('.bio') !== 'Bob plays the tabla.'; i++) await t.wait(50);
  if (doc.querySelector('.error')) return 'the error is still shown';
  return t.text('.bio') === 'Bob plays the tabla.' || '.bio says "' + t.text('.bio') + '"';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'r-refs', track: 'effects',
      title: 'useRef: remember without rendering',
      summary: 'useRef(initial) gives a box, ref.current, that keeps its value between renders and does not cause one when it changes. Use it for what the screen does not show: a timer id, the previous value, the latest callback. If the screen shows it, it is state.',
      keywords: ['useRef', 'ref', 'refs', 'ref.current', 'current', 'mutable value', 'timer id', 'interval id', 'previous value', 'usePrevious', 'state vs ref', 'instance variable', 'no re-render', 'stopwatch'],
      docs: 'https://react.dev/learn/referencing-values-with-refs',
      body: [
        'State has a twin that never draws: a **ref**.',
        jsx('const clicks = useRef(0);                  // { current: 0 }',
            '',
            'function handleClick() {',
            '  clicks.current = clicks.current + 1;     // changed at once; nothing re-renders',
            '}'),
        '`useRef` returns the **same** object on every render, and you change its `current` property directly, as with any object. React does not watch it, so changing it draws nothing.',
        '## State, a ref, or a plain variable?',
        '| | `useState` | `useRef` | `let x` in the component |\n|---|---|---|---|\n' +
        '| Survives a re-render | Yes | Yes | No: it starts over on every render |\n' +
        '| Changing it re-renders | Yes | No | No |\n' +
        '| Changed with | The setter, for the next render | `ref.current = …`, at once | `x = …` |\n' +
        '| Good for | What the screen shows | Timer ids, the previous value, DOM nodes | Nothing that must last |',
        'The rule of thumb: if the screen shows it, it is state; if only your handlers and effects need it, a ref.',
        '## A timer id',
        jsx('const intervalRef = useRef(null);',
            '',
            'function start() {',
            '  intervalRef.current = setInterval(tick, 100);',
            '}',
            '',
            'function stop() {',
            '  clearInterval(intervalRef.current);',
            '}'),
        'With `let intervalId` instead, the id would be lost: `start` sets it, the first tick re-renders, and the new render\'s `intervalId` is `null` again. `stop` then clears nothing, and the timer runs for ever.',
        '## Do not read or write refs while rendering',
        'The JSX should depend on props and state only. `{clicks.current}` in the JSX shows whatever it was at the last render and goes stale, because changing it never draws. Read and change refs in event handlers and effects. (One exception: filling a ref once, `if (ref.current === null) ref.current = new Player();`.)',
        '## The latest value, for a callback that lives long',
        'An interval started once keeps the values of the render that started it ([[explain:stale-closure]]). A ref can give it the latest value without restarting it: an effect writes `latest.current = value` after each render, and the interval reads `latest.current`. React 19.2\'s `useEffectEvent` now does this for you: [[lesson:r-effect-deps]].',
        'A ref can also hold a DOM node: [[lesson:r-dom-refs]]. The interview question is [[q:use-ref]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript a variable outside your functions keeps its value: `let timerId; start = () => { timerId = setInterval(…); }`. Inside a React component nothing does, because the component function runs again on every render and its `let` variables start over. A ref is the React version of that outside variable, one per component on the page; and like it, changing it draws nothing.',
      example: {
        code: `import { useState, useRef } from 'react';

export default function App() {
  const [stateClicks, setStateClicks] = useState(0);
  const refClicks = useRef(0);
  let plainClicks = 0;

  function countAll() {
    setStateClicks(stateClicks + 1);
    refClicks.current = refClicks.current + 1;
    plainClicks = plainClicks + 1;
    console.log('state:', stateClicks + 1, '· ref:', refClicks.current, '· plain variable:', plainClicks);
  }

  function countRefOnly() {
    refClicks.current = refClicks.current + 1;
    console.log('the ref is now', refClicks.current, '(the screen does not change)');
  }

  return (
    <div>
      <button onClick={countAll}>Count with all three</button>
      <button onClick={countRefOnly}>Count with the ref only</button>
      <p>State, on the screen: <b>{stateClicks}</b></p>
    </div>
  );
}
`,
        css: 'button { margin: 0 6px 6px 0; }',
        note: 'Click "Count with all three" a few times: the console shows the ref keeps counting, while the plain variable is 1 every time (each render starts it at 0 again). Then click "Count with the ref only": the ref goes up, and the screen stays as it is, because a ref never re-renders.'
      },
      challenge: {
        title: 'A stopwatch whose Stop always stops',
        strict: true,
        task: 'Give the stopwatch its logic. The time is shown in `<output className="time">` with one decimal: `0.0 s`, `1.3 s`…\n\n' +
          '- **Start** runs it: it shows the time since it started, plus any time from before a Stop.\n' +
          '- **Stop** freezes it, and **Start** again goes on from there.\n' +
          '- **Start** while it runs changes nothing: one click of **Stop** must still stop it.\n' +
          '- **Reset** stops it and goes back to `0.0 s`.\n\n' +
          'Keep the interval\'s id where a re-render cannot lose it.',
        starter: `import { useState, useRef, useEffect } from 'react';

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);   // milliseconds

  function start() {}
  function stop() {}
  function reset() {}

  return (
    <div className="stopwatch">
      <output className="time">{(elapsed / 1000).toFixed(1)} s</output>
      <button className="start" onClick={start}>Start</button>
      <button className="stop" onClick={stop}>Stop</button>
      <button className="reset" onClick={reset}>Reset</button>
    </div>
  );
}
`,
        solution: `import { useState, useRef, useEffect } from 'react';

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);   // milliseconds
  const intervalRef = useRef(null);

  function start() {
    if (intervalRef.current !== null) return;   // already running
    const startedAt = Date.now() - elapsed;
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 50);
  }

  function stop() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  function reset() {
    stop();
    setElapsed(0);
  }

  useEffect(() => {
    return () => clearInterval(intervalRef.current);   // leaving the page stops it too
  }, []);

  return (
    <div className="stopwatch">
      <output className="time">{(elapsed / 1000).toFixed(1)} s</output>
      <button className="start" onClick={start}>Start</button>
      <button className="stop" onClick={stop}>Stop</button>
      <button className="reset" onClick={reset}>Reset</button>
    </div>
  );
}
`,
        css: '.stopwatch { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; } .time { font: 700 32px ui-monospace, Consolas, monospace; min-width: 5ch; margin-right: 8px; }',
        hints: [
          'Keep the id in a ref: `const intervalRef = useRef(null);`, then `intervalRef.current = setInterval(…)` in `start` and `clearInterval(intervalRef.current)` in `stop`. A `let` variable would be back to `null` after the next render.',
          'Work the time out from a start moment: `const startedAt = Date.now() - elapsed;`, then every 50 ms `setElapsed(Date.now() - startedAt)`. Taking `elapsed` off is what makes Start go on after a Stop.',
          'Guard Start with `if (intervalRef.current !== null) return;`, and set the ref back to `null` in `stop`. Reset is `stop()`, then `setElapsed(0)`.'
        ],
        checks: [
          { label: 'It starts at 0.0 s', fn: `function (doc, win, t) {
  return t.text('.time') === '0.0 s' || 'it shows ' + t.text('.time');
}` },
          { label: 'Start runs it: 0.3 seconds later it shows 0.2 s or more', fn: `async function (doc, win, t) {
  await t.click('.start');
  await t.wait(320);
  var s = parseFloat(t.text('.time'));
  return (s >= 0.2 && s <= 0.8) || 'after 0.3 seconds it shows ' + t.text('.time');
}` },
          { label: 'Stop freezes it', fn: `async function (doc, win, t) {
  await t.click('.stop');
  var a = t.text('.time');
  await t.wait(250);
  return t.text('.time') === a || 'after Stop it went on, from ' + a + ' to ' + t.text('.time');
}` },
          { label: 'Start goes on from there; Start twice, then one Stop, still stops it', fn: `async function (doc, win, t) {
  var before = parseFloat(t.text('.time'));
  await t.click('.start');
  await t.click('.start');
  await t.wait(250);
  var now = parseFloat(t.text('.time'));
  if (now < before + 0.1) return 'after Start it shows ' + t.text('.time') + ': it should go on from ' + before.toFixed(1) + ' s';
  if (now > before + 1) return 'it jumped from ' + before.toFixed(1) + ' to ' + now.toFixed(1) + ' s';
  await t.click('.stop');
  var a = t.text('.time');
  await t.wait(250);
  return t.text('.time') === a || 'Start twice, then Stop: it went on from ' + a + ' to ' + t.text('.time') + ', so a second interval is still running';
}` },
          { label: 'Reset goes back to 0.0 s, and stays there', fn: `async function (doc, win, t) {
  await t.click('.start');
  await t.wait(120);
  await t.click('.reset');
  await t.wait(200);
  return t.text('.time') === '0.0 s' || 'after Reset it shows ' + t.text('.time');
}` },
          { label: 'The interval\'s id is kept in a ref', fn: `function (doc, win, t) {
  return /useRef\\s*\\(/.test(t.source()) || 'useRef is never called';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'r-dom-refs', track: 'effects',
      title: 'Refs to the DOM, and measuring it',
      summary: 'Put a ref on a JSX element and React fills ref.current with its DOM node once it is on the page: focus it, scroll to it, measure it. In React 19 your own components take ref as a plain prop. Measure in useLayoutEffect, which runs before the paint, so nobody sees the first position.',
      keywords: ['dom ref', 'ref to a dom node', 'focus', 'scrollIntoView', 'scroll', 'measure', 'getBoundingClientRect', 'useLayoutEffect', 'layout effect', 'before paint', 'flicker', 'forwardRef', 'ref as a prop', 'useImperativeHandle', 'flushSync', 'ref callback'],
      docs: 'https://react.dev/learn/manipulating-the-dom-with-refs', uilt: 'js-dom',
      body: [
        'Most of the time React owns the DOM: you describe it, and React changes it. A few things have no JSX: focusing a field, scrolling to an item, measuring a box. For those you need the DOM node itself, and a ref gets it:',
        jsx('const inputRef = useRef(null);',
            '',
            '<input ref={inputRef} />',
            '<button onClick={() => inputRef.current.focus()}>Search</button>'),
        'Once React has put the `<input>` on the page it sets `inputRef.current` to the node, and back to `null` when it goes. During the first render the node does not exist yet, so use the ref in event handlers and effects, never while rendering.',
        '## What it is for',
        '| To | Call |\n|---|---|\n' +
        '| Focus a field, select its text | `ref.current.focus()`, `ref.current.select()` |\n' +
        '| Scroll something into view | `ref.current.scrollIntoView({ block: \'nearest\' })`, or set `scrollTop` |\n' +
        '| Measure it | `ref.current.getBoundingClientRect()`, `offsetHeight` |\n' +
        '| Play or pause a video | `ref.current.play()`, `ref.current.pause()` |',
        'Leave the rest to React. Changing the DOM by hand (`ref.current.textContent = …`, removing a node) fights React, which will put it back or crash.',
        '## A ref to your own component',
        'In React 19, `ref` is a prop like any other: your component takes it and hands it to the element it means.',
        jsx('function MessageInput({ ref, ...props }) {',
            '  return <input ref={ref} className="field" {...props} />;',
            '}',
            '',
            'const inputRef = useRef(null);',
            '<MessageInput ref={inputRef} placeholder="Message" />'),
        'Before React 19 a function component could not receive `ref`; it had to be wrapped, `const MessageInput = forwardRef((props, ref) => …)`. Existing code is full of `forwardRef`, and it still works. The interview question is [[q:ref-to-component]].',
        'To give the parent a few methods instead of the whole node, use `useImperativeHandle`:',
        jsx('function MessageInput({ ref }) {',
            '  const inner = useRef(null);',
            '  useImperativeHandle(ref, () => ({ focus: () => inner.current.focus() }), []);',
            '  return <input ref={inner} />;',
            '}'),
        '## Measuring before the paint: useLayoutEffect',
        '`useEffect` runs **after** the browser paints. Measure there and move something, and the user sees the first position for a frame: a flicker. `useLayoutEffect` runs after React has updated the DOM but **before** the paint, so the position you work out is the first one anyone sees:',
        jsx('useLayoutEffect(() => {',
            '  const { height } = tooltipRef.current.getBoundingClientRect();',
            "  setPlace(height > spaceAbove ? 'below' : 'above');",
            '}, []);'),
        'It holds up the paint, so keep it short and use it only for measuring; everything else belongs in `useEffect`. The interview question is [[q:layout-effect]], and [[explain:effect-timeline]] shows the order.',
        '## Scrolling to something you just added',
        '`setMessages([...messages, m])` does not change the DOM at once, so scrolling straight after it scrolls to the message that **was** last. Scroll in an effect, which runs once the new message is drawn, or wrap the update in `flushSync` (from `react-dom`), which applies it to the DOM before the next line runs.'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you find a node with `document.querySelector(\'#search\')` when you need it. In React that is fragile: the component may be on the page twice, and the node may not exist yet. A ref is a node your component owns: `ref={inputRef}` instead of an `id`, and `inputRef.current` instead of `querySelector`. `.focus()`, `.scrollIntoView()` and `getBoundingClientRect()` are the same DOM methods you already know.',
      example: {
        code: `import { useState, useRef, useLayoutEffect } from 'react';

function SearchField({ ref, ...props }) {
  return <input ref={ref} className="search" type="search" {...props} />;
}

export default function App() {
  const searchRef = useRef(null);
  const boxRef = useRef(null);
  const [lines, setLines] = useState(2);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    setHeight(boxRef.current.getBoundingClientRect().height);
  }, [lines]);

  const numbers = Array.from({ length: lines }, (_, i) => i + 1);

  return (
    <div>
      <SearchField ref={searchRef} placeholder="Search…" />
      <button onClick={() => searchRef.current.focus()}>Focus the search</button>
      <div ref={boxRef} className="box">
        {numbers.map(n => <p key={n}>Line {n}</p>)}
      </div>
      <button onClick={() => setLines(lines + 1)}>Add a line</button>
      <p>The box is {Math.round(height)} px tall, measured before the paint.</p>
    </div>
  );
}
`,
        css: '.search { padding: 4px 8px; margin-right: 6px; } .box { margin: 10px 0; padding: 4px 10px; border: 1px solid #ccd; border-radius: 8px; max-width: 260px; } .box p { margin: 4px 0; }',
        note: '"Focus the search" reaches into `SearchField`, your own component, through the `ref` prop. "Add a line" makes the box taller: `useLayoutEffect` measures it before the browser paints, so the number is right in the very first frame.'
      },
      challenge: {
        title: 'A chat box that scrolls and keeps the focus',
        strict: true,
        task: 'Sending works, but the chat is awkward to use. After each **Send**:\n\n' +
          '- The list scrolls to the bottom, so the newest message is visible. (It is a box 120 px tall with its own scrollbar.)\n' +
          '- The focus goes back to the message field, so the next message can be typed at once. The field is `MessageInput`, your own component: pass it a `ref`.\n\n' +
          'For the checks: the list is `<ul className="messages">`, the field an `<input className="field">` and the button `<button className="send">`.',
        starter: `import { useState, useRef, useEffect } from 'react';

function MessageInput(props) {
  return <input className="field" placeholder="Message" {...props} />;
}

let nextId = 4;

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hi! Are we still on for lunch?' },
    { id: 2, text: 'Yes, 1 pm at the usual place.' },
    { id: 3, text: 'Great, see you there.' }
  ]);
  const [text, setText] = useState('');

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setMessages([...messages, { id: nextId++, text: text.trim() }]);
    setText('');
  }

  return (
    <form className="chat" onSubmit={send}>
      <ul className="messages">
        {messages.map(m => <li key={m.id}>{m.text}</li>)}
      </ul>
      <MessageInput value={text} onChange={e => setText(e.target.value)} />
      <button className="send">Send</button>
    </form>
  );
}
`,
        solution: `import { useState, useRef, useEffect } from 'react';

function MessageInput({ ref, ...props }) {
  return <input ref={ref} className="field" placeholder="Message" {...props} />;
}

let nextId = 4;

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hi! Are we still on for lunch?' },
    { id: 2, text: 'Yes, 1 pm at the usual place.' },
    { id: 3, text: 'Great, see you there.' }
  ]);
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setMessages([...messages, { id: nextId++, text: text.trim() }]);
    setText('');
    inputRef.current.focus();
  }

  return (
    <form className="chat" onSubmit={send}>
      <ul className="messages" ref={listRef}>
        {messages.map(m => <li key={m.id}>{m.text}</li>)}
      </ul>
      <MessageInput ref={inputRef} value={text} onChange={e => setText(e.target.value)} />
      <button className="send">Send</button>
    </form>
  );
}
`,
        css: '.chat { max-width: 340px; } .messages { height: 120px; overflow-y: auto; list-style: none; margin: 0 0 8px; padding: 6px; border: 1px solid #ccd; border-radius: 8px; } .messages li { margin: 4px 0; padding: 4px 10px; border-radius: 10px; background: #eef2f7; } .field { padding: 4px 8px; margin-right: 6px; }',
        hints: [
          'For the list: `const listRef = useRef(null);`, `<ul className="messages" ref={listRef}>`, and an effect that runs when `messages` changes: `listRef.current.scrollTop = listRef.current.scrollHeight;`. By the time an effect runs, the new message is in the DOM.',
          'For the focus: React 19 hands `ref` to your component as a prop. Take it out and give it to the input: `function MessageInput({ ref, ...props }) { return <input ref={ref} … {...props} />; }`.',
          'Then `const inputRef = useRef(null);`, `<MessageInput ref={inputRef} … />`, and `inputRef.current.focus();` at the end of `send`.'
        ],
        checks: [
          { label: 'Send adds the message at the bottom of the list', fn: `async function (doc, win, t) {
  await t.type('.field', 'On my way');
  doc.querySelector('.send').focus();   // as a real click would
  await t.click('.send');
  var items = doc.querySelectorAll('.messages li');
  return items[items.length - 1].textContent === 'On my way' || 'the last message is "' + items[items.length - 1].textContent + '"';
}` },
          { label: 'After Send, the focus is back in the message field', fn: `async function (doc, win, t) {
  await t.type('.field', 'Be there in 5');
  doc.querySelector('.send').focus();   // clicking a button focuses it
  await t.click('.send');
  var a = doc.activeElement;
  return a === doc.querySelector('.field') || 'the focus is on ' + (a && a !== doc.body ? '<' + a.tagName.toLowerCase() + ' class="' + a.className + '">' : 'nothing');
}` },
          { label: 'Five messages later the newest is in view: the list is scrolled to the bottom', fn: `async function (doc, win, t) {
  for (var i = 1; i <= 5; i++) {
    await t.type('.field', 'Message ' + i);
    doc.querySelector('.send').focus();
    await t.click('.send');
  }
  await t.wait(50);
  var ul = doc.querySelector('.messages');
  if (ul.scrollHeight <= ul.clientHeight) return 'the list does not overflow: is it still 120 px tall?';
  return ul.scrollTop + ul.clientHeight >= ul.scrollHeight - 2 || 'the list is scrolled to ' + Math.round(ul.scrollTop) + ' of ' + (ul.scrollHeight - ul.clientHeight) + ' px: the newest message is hidden';
}` },
          { label: 'The field is still your `MessageInput`, with the ref passed to it as a prop', fn: `function (doc, win, t) {
  return /<MessageInput[^>]*\\bref=\\{/.test(t.source()) || 'no <MessageInput ref={…}> in the code';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'r-custom-hooks', track: 'effects',
      title: 'Custom hooks: share logic, not state',
      summary: 'A custom hook is a function whose name starts with use and that calls other hooks. It moves a piece of stateful logic out of a component so that others can reuse it. Each component that calls it gets its own state: hooks share how, not what.',
      keywords: ['custom hook', 'custom hooks', 'use prefix', 'extract logic', 'reuse logic', 'useDebounce', 'debounce', 'useLocalStorage', 'useOnlineStatus', 'useWindowWidth', 'useSyncExternalStore', 'useDebugValue', 'renderHook', 'share logic'],
      docs: 'https://react.dev/learn/reusing-logic-with-custom-hooks',
      body: [
        'Two components need the same effect: both show whether the browser is online. Instead of copying it, move it into a function of its own:',
        jsx('function useOnlineStatus() {',
            '  const [isOnline, setIsOnline] = useState(navigator.onLine);',
            '  useEffect(() => {',
            '    const on = () => setIsOnline(true);',
            '    const off = () => setIsOnline(false);',
            "    window.addEventListener('online', on);",
            "    window.addEventListener('offline', off);",
            '    return () => {',
            "      window.removeEventListener('online', on);",
            "      window.removeEventListener('offline', off);",
            '    };',
            '  }, []);',
            '  return isOnline;',
            '}',
            '',
            'function StatusBar() {',
            '  const isOnline = useOnlineStatus();',
            "  return <p>{isOnline ? 'Online' : 'Disconnected'}</p>;",
            '}'),
        '## The rules',
        '- The name starts with `use` and a capital letter: `useOnlineStatus`. That tells React\'s lint rules, the React Compiler and this editor to check it like a component: [[lesson:r-rules-of-hooks]].',
        '- A function that calls no hooks is a plain function: do not give it a `use` name.',
        '- Return whatever reads best: a value (`useOnlineStatus()`), a pair like `useState`\'s (`const [on, toggle] = useToggle()`), or an object when there are several things.',
        '## Logic, not state',
        'Two components calling `useOnlineStatus()` do not share one `isOnline`: each call runs its own `useState` and its own effect. Calling a custom hook is like pasting its body into the component. To share one value between components, lift it up or use context. The interview question is [[q:custom-hooks]].',
        '## A useful one: useDebounce',
        jsx('function useDebounce(value, delay) {',
            '  const [debounced, setDebounced] = useState(value);',
            '  useEffect(() => {',
            '    const id = setTimeout(() => setDebounced(value), delay);',
            '    return () => clearTimeout(id);',
            '  }, [value, delay]);',
            '  return debounced;',
            '}',
            '',
            'const query = useDebounce(text, 300);   // follows text, 300 ms after its last change'),
        'Each keystroke changes `value`, so React cleans up the waiting timer and starts a new one: only a pause as long as `delay` lets one fire. The cleanup **is** the debounce.',
        '## Stores outside React',
        'For a value that lives outside React and can change at any time (the online status, a state library\'s store), React has a hook made for it: `useSyncExternalStore(subscribe, getSnapshot)`; `useOnlineStatus` is often written with it. `useDebugValue(isOnline ? \'Online\' : \'Offline\')` labels a custom hook in React DevTools.',
        'To test a hook without a component, React Testing Library has `renderHook(() => useDebounce(\'a\', 300))`.'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you reuse logic by writing a function: `function debounce(fn, ms) { let id; return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); }; }`. A custom hook is that, for logic that needs React\'s state and effects. The difference is where the timer lives: a plain `debounce` keeps it in a closure you create once; `useDebounce` keeps it in React, one per component, and cleans it up when the component goes.',
      example: {
        code: `import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved !== null ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function NameCard() {
  const [name, setName] = useLocalStorage('name', '');
  return (
    <label className="card">
      Your name <input value={name} onChange={e => setName(e.target.value)} />
    </label>
  );
}

function ThemePicker() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  return (
    <div className={'card ' + theme}>
      Theme: <b>{theme}</b>{' '}
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Switch</button>
    </div>
  );
}

export default function App() {
  return (
    <>
      <NameCard />
      <ThemePicker />
    </>
  );
}
`,
        css: '.card { display: block; margin: 0 0 8px; padding: 8px 12px; border: 1px solid #ccd; border-radius: 8px; max-width: 320px; } .card input { margin-left: 6px; padding: 3px 6px; } .dark { background: #20232a; color: #eee; }',
        note: 'Both components use `useLocalStorage`, and each has its own value, under its own key. Type a name, switch the theme, then press **Run**: both come back from storage.'
      },
      challenge: {
        title: 'useDebounce, for two search boxes',
        strict: true,
        task: 'Each panel filters its list on every keystroke; on a real site each filter would be a request to a server. Write `useDebounce(value, delay)` and use it in `SearchPanel`, so that:\n\n' +
          '- A list filters only once typing has paused for 300 ms.\n' +
          '- The input still shows every keystroke at once.\n' +
          '- The two panels never disturb each other: typing in one does not delay or cancel the other.\n\n' +
          'The list filters by `query`; the input shows `text`.',
        starter: `import { useState, useEffect } from 'react';

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Mango'];
const CITIES = ['Chennai', 'Delhi', 'Kochi', 'Mumbai', 'Mysuru', 'Pune'];

function useDebounce(value, delay) {
  // TODO: return value, but only once it has stopped changing for delay ms
  return value;
}

function SearchPanel({ title, items }) {
  const [text, setText] = useState('');
  const query = text;   // TODO: debounce it
  const shown = items.filter(item => item.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="panel">
      <h3>{title}</h3>
      <input className="q" value={text} onChange={e => setText(e.target.value)} placeholder={'Search ' + title.toLowerCase()} />
      <ul className="results">{shown.map(item => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}

export default function App() {
  return (
    <div className="panels">
      <SearchPanel title="Fruits" items={FRUITS} />
      <SearchPanel title="Cities" items={CITIES} />
    </div>
  );
}
`,
        solution: `import { useState, useEffect } from 'react';

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Mango'];
const CITIES = ['Chennai', 'Delhi', 'Kochi', 'Mumbai', 'Mysuru', 'Pune'];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function SearchPanel({ title, items }) {
  const [text, setText] = useState('');
  const query = useDebounce(text, 300);
  const shown = items.filter(item => item.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="panel">
      <h3>{title}</h3>
      <input className="q" value={text} onChange={e => setText(e.target.value)} placeholder={'Search ' + title.toLowerCase()} />
      <ul className="results">{shown.map(item => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}

export default function App() {
  return (
    <div className="panels">
      <SearchPanel title="Fruits" items={FRUITS} />
      <SearchPanel title="Cities" items={CITIES} />
    </div>
  );
}
`,
        css: '.panels { display: flex; flex-wrap: wrap; gap: 16px; } .panel { flex: 1; min-width: 150px; } .panel h3 { margin: 0 0 6px; } .q { width: 100%; box-sizing: border-box; padding: 4px 8px; } .results { padding-left: 20px; margin: 6px 0 0; }',
        hints: [
          'Inside `useDebounce`, keep the debounced copy in state, `const [debounced, setDebounced] = useState(value);`, and return it.',
          'An effect on `[value, delay]` starts a timer, `const id = setTimeout(() => setDebounced(value), delay);`, and its cleanup clears it: `return () => clearTimeout(id);`. Each keystroke cleans up the timer before it, so only a pause lets one fire.',
          'In `SearchPanel`: `const query = useDebounce(text, 300);`. Each panel calls the hook, so each has its own state and its own timer. A timer kept in a variable outside the hook would be shared by both panels.'
        ],
        checks: [
          { label: 'Typing "ap" in Fruits: the input shows it at once, the list waits', fn: `async function (doc, win, t) {
  var input = doc.querySelectorAll('.panel')[0].querySelector('.q');
  await t.type(input, 'ap');
  if (input.value !== 'ap') return 'the input shows "' + input.value + '"';
  var list = [].map.call(doc.querySelectorAll('.panel')[0].querySelectorAll('.results li'), function (li) { return li.textContent; }).join(', ');
  return list === 'Apple, Apricot, Banana, Blueberry, Cherry, Grape, Mango' || 'the list filtered at once: ' + list;
}` },
          { label: 'After a 300 ms pause, it shows Apple, Apricot, Grape', fn: `async function (doc, win, t) {
  await t.wait(400);
  var list = [].map.call(doc.querySelectorAll('.panel')[0].querySelectorAll('.results li'), function (li) { return li.textContent; }).join(', ');
  return list === 'Apple, Apricot, Grape' || 'after the pause the list is: ' + list;
}` },
          { label: 'Keystrokes 200 ms apart keep it waiting: only a 300 ms pause filters', fn: `async function (doc, win, t) {
  var panel = doc.querySelectorAll('.panel')[0], input = panel.querySelector('.q');
  function list() { return [].map.call(panel.querySelectorAll('.results li'), function (li) { return li.textContent; }).join(', '); }
  await t.type(input, 'b');
  await t.wait(200);
  await t.type(input, 'bl');
  await t.wait(200);
  if (list() !== 'Apple, Apricot, Grape') return '400 ms after "b" but only 200 ms after "bl", it already filtered: ' + list();
  await t.wait(250);
  return list() === 'Blueberry' || 'after the pause the list is: ' + list();
}` },
          { label: 'Typing in Fruits, then at once in Cities: both lists filter', fn: `async function (doc, win, t) {
  var panels = doc.querySelectorAll('.panel');
  function list(p) { return [].map.call(p.querySelectorAll('.results li'), function (li) { return li.textContent; }).join(', '); }
  await t.type(panels[0].querySelector('.q'), 'man');
  await t.type(panels[1].querySelector('.q'), 'mu');
  await t.wait(450);
  if (list(panels[0]) !== 'Mango') return 'Fruits shows: ' + list(panels[0]);
  return list(panels[1]) === 'Mumbai' || 'Cities shows: ' + list(panels[1]);
}` },
          { label: '`SearchPanel` gets its query from `useDebounce`', fn: `function (doc, win, t) {
  return /=\\s*useDebounce\\s*\\(/.test(t.source()) || 'nothing is set from useDebounce(…)';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 8 */
    {
      id: 'r-rules-of-hooks', track: 'effects',
      title: 'The rules of hooks',
      summary: 'Call hooks at the top level of a component or a custom hook, on every render, in the same order: never inside a condition, a loop or a nested function, or after an early return. React tells hooks apart only by their order, so a skipped call hands every later hook the wrong state.',
      keywords: ['rules of hooks', 'hook rules', 'top level', 'conditional hook', 'early return', 'hook order', 'Rendered more hooks than during the previous render', 'rendered fewer hooks', 'invalid hook call', 'eslint-plugin-react-hooks', 'call order', 'slots'],
      docs: 'https://react.dev/reference/rules/rules-of-hooks',
      body: [
        'Every hook in this course follows two rules:',
        '1. **Only at the top level**: not inside `if`, `? :`, `&&`, a loop or a nested function, and not after an early `return`. Every render calls the same hooks, in the same order.',
        '2. **Only from React functions**: components and custom hooks. Not from event handlers, plain helpers or classes.',
        '## Why the order matters',
        'React does not know your hooks by name. It keeps a list of slots for each component and hands them out in order: the first hook called gets slot 1, the second slot 2.',
        '| Render 1 calls | It gets slot | Which holds |\n|---|---|---|\n' +
        '| `useState(\'Asha\')` | 1 | the name |\n' +
        '| `useState(30)` | 2 | the age |\n' +
        '| `useEffect(…)` | 3 | the effect |',
        'If render 2 skips the first call because it sits inside an `if`, `useState(30)` asks for slot 1 and gets **the name**, and every later hook is off by one. React notices that the number of hooks changed and stops with "Rendered more hooks than during the previous render" (or "fewer"). The interview question is [[q:rules-of-hooks]].',
        '## The early-return trap',
        jsx('function Profile({ user }) {',
            '  if (!user) return <SignIn />;              // without a user: no hooks are called…',
            "  const [tab, setTab] = useState('posts');   // ❌ …with one: a hook more",
            '}'),
        'The page works until `user` arrives, then crashes. Call every hook first, then return early.',
        '## Making a hook conditional, the right way',
        '| You want | Do this |\n|---|---|\n' +
        '| An effect only when something is true | Call `useEffect` always, and put the `if` **inside** it |\n' +
        '| State that only some renders need | Declare it always; ignore it when it is not needed |\n' +
        '| A whole group of hooks only sometimes | Move them into a child component that is rendered only then |',
        'React 19\'s `use()` is the one exception: it may be called inside `if` and loops.',
        '## Who checks it',
        '`eslint-plugin-react-hooks`, in every Vite and Next.js project, flags both rules, and the React Compiler relies on them. This editor shows a ⚠ on a hook inside an `if`, a loop, `&&`, after an early `return`, or inside a handler.'
      ].join('\n\n'),
      plainjs: 'Plain JavaScript has nothing like this rule, because a variable is known by its name. React\'s hooks are not: `useState(0)` has no name React can see, only its place among this render\'s calls. That is why the same line can be right in one place and wrong one line lower: its place is its identity.',
      example: {
        code: `import { useState } from 'react';

export default function App() {
  const [showAge, setShowAge] = useState(false);
  const [name, setName] = useState('Asha');

  if (showAge) {
    const [age, setAge] = useState(30);   // a hook inside an if
    console.log('age', age);
  }

  const [city, setCity] = useState('Pune');

  return (
    <div>
      <p>{name} lives in {city}.</p>
      <button onClick={() => setShowAge(true)}>Show the age</button>
    </div>
  );
}
`,
        css: 'p { margin: 0 0 8px; }',
        note: 'The ⚠ in the editor marks the hook inside the `if`. Click **Show the age**: render 2 calls one hook more than render 1, React stops, and the console says why. Move `useState(30)` above the `if` and run it again: it works.'
      },
      challenge: {
        title: 'Sign in without a crash',
        strict: true,
        task: 'Click **Sign in**: the card crashes with "Rendered more hooks than during the previous render". Find the hook that is not called on every render and fix the component, keeping what it does:\n\n' +
          '- Signed out, it shows the **Sign in** button.\n' +
          '- Signed in, it shows `Asha`, the **Posts** and **Likes** tabs (Posts first) and **Sign out**.\n' +
          '- Signing out and in again still works.',
        starter: `import { useState } from 'react';

export default function ProfileCard() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <button className="sign-in" onClick={() => setUser({ name: 'Asha' })}>Sign in</button>;
  }

  const [tab, setTab] = useState('posts');

  return (
    <div className="profile">
      <h3 className="name">{user.name}</h3>
      <div className="tabs">
        <button className="tab-posts" aria-pressed={tab === 'posts'} onClick={() => setTab('posts')}>Posts</button>
        <button className="tab-likes" aria-pressed={tab === 'likes'} onClick={() => setTab('likes')}>Likes</button>
      </div>
      <p className="panel">{tab === 'posts' ? '3 posts' : '12 likes'}</p>
      <button className="sign-out" onClick={() => setUser(null)}>Sign out</button>
    </div>
  );
}
`,
        solution: `import { useState } from 'react';

export default function ProfileCard() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('posts');

  if (!user) {
    return <button className="sign-in" onClick={() => setUser({ name: 'Asha' })}>Sign in</button>;
  }

  return (
    <div className="profile">
      <h3 className="name">{user.name}</h3>
      <div className="tabs">
        <button className="tab-posts" aria-pressed={tab === 'posts'} onClick={() => setTab('posts')}>Posts</button>
        <button className="tab-likes" aria-pressed={tab === 'likes'} onClick={() => setTab('likes')}>Likes</button>
      </div>
      <p className="panel">{tab === 'posts' ? '3 posts' : '12 likes'}</p>
      <button className="sign-out" onClick={() => setUser(null)}>Sign out</button>
    </div>
  );
}
`,
        css: '.profile { padding: 8px 12px; border: 1px solid #ccd; border-radius: 8px; max-width: 300px; } .name { margin: 0 0 6px; } .tabs button[aria-pressed="true"] { font-weight: 700; } .panel { margin: 8px 0; }',
        hints: [
          'Signed out, the component returns before `useState(\'posts\')`, so render 1 calls one hook. Signed in it calls two, and React stops.',
          'Move `const [tab, setTab] = useState(\'posts\');` up, next to the other `useState`, before the `if`. Every render then calls both, in the same order.',
          'Another clean fix: move the signed-in part into its own component, `<Profile user={user} />`, with the tab state inside it. Its hooks then run only while it is on the page, which is allowed.'
        ],
        checks: [
          { label: 'Signed out, it shows the Sign in button', fn: `function (doc) {
  if (!doc.querySelector('.sign-in')) return 'no .sign-in button';
  return !doc.querySelector('.profile') || 'the profile shows before signing in';
}` },
          { label: 'Signing in shows Asha and the Posts tab, with no crash', fn: `async function (doc, win, t) {
  await t.click('.sign-in');
  var crash = doc.querySelector('.rlt-crash');
  if (crash) return 'it crashed: ' + (crash.textContent.split('\\n')[2] || crash.textContent);
  if (t.text('.name') !== 'Asha') return '.name says "' + t.text('.name') + '"';
  return t.text('.panel') === '3 posts' || '.panel says "' + t.text('.panel') + '"';
}` },
          { label: 'Likes switches the tab', fn: `async function (doc, win, t) {
  await t.click('.tab-likes');
  return t.text('.panel') === '12 likes' || '.panel says "' + t.text('.panel') + '"';
}` },
          { label: 'Signing out and in again shows the card again', fn: `async function (doc, win, t) {
  await t.click('.sign-out');
  if (!doc.querySelector('.sign-in')) return 'after Sign out there is no Sign in button';
  await t.click('.sign-in');
  if (doc.querySelector('.rlt-crash')) return 'signing in again crashed';
  return !!doc.querySelector('.profile') || 'no .profile after signing in again';
}` }
        ]
      }
    }
  );
})(window.RLT);
