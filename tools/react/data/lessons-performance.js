/*
 * Lessons, track 5: Performance and internals.
 *
 * The lesson shape, and how the code is written (template literals that never use `${`), are
 * described at the top of data/lessons-foundations.js. Every challenge says `strict: true`, as the
 * last two tracks' do. Many checks count renders with t.renders() (js/preview.js): it counts commits,
 * not calls, so StrictMode's double call does not double a count, and a render a transition dropped
 * is not counted. Several examples and starters hold up the main thread on purpose (a busy loop of a
 * millisecond or so per row) so that a slow render can be seen and measured.
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  function block(lang, lines) { return '```' + lang + '\n' + lines.join('\n') + '\n```'; }
  function jsx() { return block('jsx', [].slice.call(arguments)); }
  function js() { return block('js', [].slice.call(arguments)); }

  L.push(
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'r-rendering', track: 'performance',
      title: 'What makes a component render',
      summary: 'A component renders again for three reasons: its state changed, its parent rendered, or a context it reads changed. Rendering is calling your function; only the differences reach the DOM. Measure before you fix, then move state down or pass the slow parts in as children.',
      keywords: ['render', 're-render', 'rerender', 'why did this render', 'render triggers', 'render and commit', 'commit', 'highlight renders', 'highlight updates', 'profiler', 'react devtools', 'move state down', 'lift content up', 'slow typing', 'wasted renders'],
      docs: 'https://react.dev/learn/render-and-commit',
      body: [
        'In React, **rendering** means calling your component to get its JSX. It is not drawing: after a render React **commits**, changing only the DOM nodes whose output differs. A render that returns what it returned last time changes nothing on the screen; it only costs the time of the call.',
        '## Three reasons to render again',
        '| A component renders again when | For example |\n|---|---|\n' +
        '| Its own state changes to a different value | `setCount(count + 1)` in it |\n' +
        '| Its parent renders | `App`\'s state changed: every component `App` returns renders too, whether its props changed or not |\n' +
        '| A context it reads changes | The theme provider got a new value |',
        'Props are not on the list: they change only because the parent rendered, and that is already a reason. So a child re-renders with its parent **even when its props are the same**; [[lesson:r-memo]] is how to change that. Setting state to the value it already has (by `Object.is`) re-renders nothing below.',
        '## Seeing it',
        '- **Highlight renders**, on the bar above every preview in this tool: each component that rendered flashes, labelled with its name, and the line under the preview lists them. It does what React DevTools\' "Highlight updates when components render" does.\n' +
        '- **React DevTools, Profiler tab:** record while you click or type; it lists every commit, which components rendered, how long each took, and why.\n' +
        '- **`<Profiler id="list" onRender={log}>`** in your code: after each commit inside it, React calls `log(id, phase, actualDuration)`.',
        '## Is a re-render a problem?',
        'Usually not. Calling a small component is fast, and React re-renders thousands per second. It is worth fixing when a measurement shows a slow commit on something frequent: every keystroke, every scroll, every animation frame. **Measure first**: the slow part is rarely the one you would guess.',
        '## Two fixes that cost nothing',
        jsx('// ❌ each keystroke renders Page, and so SlowReport',
            'function Page() {',
            "  const [query, setQuery] = useState('');",
            '  return (',
            '    <>',
            '      <input value={query} onChange={e => setQuery(e.target.value)} />',
            '      <SlowReport />',
            '    </>',
            '  );',
            '}',
            '',
            '// ✅ the state lives where it is used: typing renders only SearchBox',
            'function SearchBox() {',
            "  const [query, setQuery] = useState('');",
            '  return <input value={query} onChange={e => setQuery(e.target.value)} />;',
            '}',
            '',
            'function Page() {',
            '  return (',
            '    <>',
            '      <SearchBox />',
            '      <SlowReport />',
            '    </>',
            '  );',
            '}'),
        '**Move state down** into the smallest component that needs it. When the state has to stay high, **lift the content up**: a component that receives the slow part as `children` re-renders without re-rendering it, because those elements were made by its parent, which did not render ([[lesson:r-composition]]).',
        jsx('function ColourPicker({ children }) {',
            "  const [colour, setColour] = useState('teal');",
            '  return <div style={{ color: colour }}>…{children}</div>;   // a new colour does not re-render children',
            '}',
            '',
            '<ColourPicker><SlowReport /></ColourPicker>'),
        'Only then reach for `memo` ([[lesson:r-memo]]), or let the React Compiler add it ([[lesson:r-react-compiler]]). The interview questions are [[q:too-many-renders]] and [[q:performance]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript nothing redraws unless you call `render()`, and you call it for exactly what changed: `updateCounter()`, not `redrawPage()`. React redraws for you, from the component whose state changed downwards, so where a piece of state lives decides how much is re-rendered. Keeping it low, in the component that uses it, is the React version of calling only the `render()` you need.',
      example: {
        code: `import { useState, Profiler } from 'react';

function Report() {
  const rows = [];
  for (let i = 1; i <= 5; i++) rows.push(<li key={i}>Row {i}</li>);
  return <ul className="report">{rows}</ul>;
}

function OwnSearch() {
  const [text, setText] = useState('');
  return <input value={text} onChange={e => setText(e.target.value)} placeholder="B: state in its own component" />;
}

function log(id, phase, duration) {
  console.log(id + ': ' + phase + ' in ' + duration.toFixed(1) + ' ms');
}

export default function App() {
  const [text, setText] = useState('');
  return (
    <Profiler id="page" onRender={log}>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="A: state in App" />
      <OwnSearch />
      <Report />
    </Profiler>
  );
}
`,
        css: 'input { display: block; margin: 0 0 6px; padding: 4px 8px; width: 260px; } .report { margin: 4px 0; }',
        note: 'Turn on **Highlight renders** (on the bar above the preview). Type in box A: `App`, `OwnSearch` and `Report` flash, because `App` owns that state. Type in box B: only `OwnSearch` flashes. The console shows `<Profiler>` timing each commit.'
      },
      challenge: {
        title: 'Typing should not re-render the report',
        strict: true,
        task: '`ExpensiveReport` takes 30 ms to render, and every keystroke in the search box renders it again, so typing lags. Fix it **without `memo`**:\n\n' +
          '- Typing in the box still updates the hint under it: `Searching for "mar"…`.\n' +
          '- Typing renders `ExpensiveReport` no more: move the search\'s state down into a component of its own.\n\n' +
          'Keep the names `ExpensiveReport` and the classes `.search`, `.hint`, `.report`: the checks count renders by name. Turn on **Highlight renders** to watch it.',
        starter: `import { useState } from 'react';

function ExpensiveReport() {
  const start = performance.now();
  while (performance.now() - start < 30) {}   // pretend it takes 30 ms to draw
  return (
    <section className="report">
      <h3>Sales report</h3>
      <p>March: 1,204 orders · April: 1,388 orders</p>
    </section>
  );
}

export default function Dashboard() {
  const [query, setQuery] = useState('');
  const hint = query ? 'Searching for "' + query + '"…' : 'Type to search the orders';

  return (
    <div className="dashboard">
      <input className="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search orders" />
      <p className="hint">{hint}</p>
      <ExpensiveReport />
    </div>
  );
}
`,
        solution: `import { useState } from 'react';

function ExpensiveReport() {
  const start = performance.now();
  while (performance.now() - start < 30) {}   // pretend it takes 30 ms to draw
  return (
    <section className="report">
      <h3>Sales report</h3>
      <p>March: 1,204 orders · April: 1,388 orders</p>
    </section>
  );
}

function SearchBox() {
  const [query, setQuery] = useState('');
  const hint = query ? 'Searching for "' + query + '"…' : 'Type to search the orders';
  return (
    <>
      <input className="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search orders" />
      <p className="hint">{hint}</p>
    </>
  );
}

export default function Dashboard() {
  return (
    <div className="dashboard">
      <SearchBox />
      <ExpensiveReport />
    </div>
  );
}
`,
        css: '.search { padding: 4px 8px; width: 240px; } .hint { color: #667; margin: 4px 0 8px; } .report { padding: 6px 10px; border: 1px solid #ccd; border-radius: 8px; max-width: 320px; } .report h3 { margin: 0 0 4px; }',
        hints: [
          'Who owns `query`? `Dashboard`. So every keystroke renders `Dashboard`, and with it every component it returns, `ExpensiveReport` included.',
          'Move the input, the hint and the `useState` into a new component, `function SearchBox() { … }`, and render `<SearchBox />` above the report. Typing then renders only `SearchBox`.',
          '`Dashboard` has no state left: it renders once, and so does the report.'
        ],
        checks: [
          { label: 'Typing updates the hint: Searching for "mar"…', fn: `async function (doc, win, t) {
  await t.type('.search', 'mar');
  return t.text('.hint') === 'Searching for "mar"…' || '.hint says "' + t.text('.hint') + '"';
}` },
          { label: 'The report still shows', fn: `function (doc, win, t) {
  return t.text('.report h3') === 'Sales report' || 'no .report with its "Sales report" title';
}` },
          { label: 'Typing three letters renders `ExpensiveReport` no more', fn: `async function (doc, win, t) {
  var r = await t.renders(async function () {
    await t.type('.search', 'j');
    await t.type('.search', 'ju');
    await t.type('.search', 'jun');
  });
  return !r.ExpensiveReport || 'three keystrokes rendered ExpensiveReport ' + r.ExpensiveReport + ' times';
}` },
          { label: 'Without `memo`: the state moved; nothing was cached', fn: `function (doc, win, t) {
  return !/\\bmemo\\s*\\(/.test(t.source()) || 'memo(…) is used: move the state down instead';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'r-reconciliation', track: 'performance',
      title: 'Reconciliation: when state survives',
      summary: 'After a render React compares the new tree of elements with the last one. The same component type in the same place is kept, with its state; a different type is thrown away and built afresh. Keys name the items of a list, and a new key resets a component on purpose.',
      keywords: ['reconciliation', 'virtual dom', 'vdom', 'diffing', 'diff', 'react elements', 'preserve state', 'reset state', 'key', 'key prop', 'reset with a key', 'position in the tree', 'component inside component', 'nested component', 'remount', 'fiber'],
      docs: 'https://react.dev/learn/preserving-and-resetting-state',
      body: [
        'JSX does not make DOM nodes. `<li className="row">Ada</li>` makes a plain object, a **React element**: `{ type: \'li\', props: { className: \'row\', children: \'Ada\' }, key: null }`. A render returns a tree of them, the "virtual DOM". After each render React compares the new tree with the last one (**reconciliation**, or diffing) and changes the DOM only where they differ.',
        '## The rules it compares by',
        '| In the same place, last render and this one | React |\n|---|---|\n' +
        '| The same type (`<Profile>`, then `<Profile>`) | Keeps the component and its state, and updates its props |\n' +
        '| A different type (`<div>` then `<section>`, `<Profile>` then `<Login>`) | Throws the old one away, with its state and everything inside it, and builds the new one |\n' +
        '| The same type with a different `key` | Treats it as a different component: throws it away and builds a new one |',
        'React does not look at your variable names or your data: only at the **type** and the **place** in the tree it renders. State belongs to a place.',
        jsx('{isAdmin ? <Profile admin /> : <Profile />}                            // same type, same place: the state survives',
            '{isAdmin ? <div><Editor /></div> : <section><Editor /></section>}   // the parent\'s type changes: Editor starts over'),
        '## Lists and keys',
        'Among siblings, React matches items by **key** instead of by place. With `key={item.id}` an item keeps its state wherever it moves. With the index as the key, an item added at the top gives every component the key the one before it had: the state stays in its place while the data moves past it ([[lesson:r-lists-keys]]). [[explain:keys-reconciliation]] steps through both, next to real React.',
        '## Resetting on purpose',
        jsx('<Chat key={contact.id} contact={contact} />'),
        'When `contact` changes, so does the key, and React builds a fresh `Chat`: the draft, the scroll position and all its state start over. That is simpler and safer than an effect that clears each piece of state when a prop changes.',
        '## Never define a component inside another',
        jsx('function Chat() {',
            "  const [draft, setDraft] = useState('');",
            '  function Field() {                          // ❌ a new function on every render of Chat',
            '    return <textarea value={draft} onChange={e => setDraft(e.target.value)} />;',
            '  }',
            '  return <Field />;',
            '}'),
        '`Field` is a new function each time `Chat` renders, so for React it is a new type every time: it throws the old `<textarea>` away and makes a new one, and the focus is lost on every keystroke. Define components at the top level of the file, and pass them what they need as props.',
        'Since React 16 the reconciler is called **Fiber**: it splits the work into units it can pause, so an urgent update can interrupt a long render ([[lesson:r-transitions]]). The interview question is [[q:virtual-dom]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you choose whether to update a node or replace it: `el.textContent = name` keeps the node (and its focus, its scroll position, the text typed in it), `el.replaceWith(newEl)` loses all of that. React makes the same choice for you by comparing types and keys: the same type in the same place is your `textContent` update; another type, or another key, is the `replaceWith`.',
      example: {
        code: `import { useState } from 'react';

function Counter({ label }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{label}: {count}</button>;
}

export default function App() {
  const [fancy, setFancy] = useState(false);
  const [person, setPerson] = useState('Ada');

  return (
    <div className="demo">
      <label>
        <input type="checkbox" checked={fancy} onChange={e => setFancy(e.target.checked)} /> Fancy
      </label>
      <p>Same type, same place: kept</p>
      {fancy ? <Counter label="Fancy" /> : <Counter label="Plain" />}
      <p>The parent's type changes: reset</p>
      {fancy ? <section><Counter label="In a section" /></section> : <div><Counter label="In a div" /></div>}
      <p>A key from the data: reset when it changes</p>
      <button onClick={() => setPerson(person === 'Ada' ? 'Bob' : 'Ada')}>Switch to {person === 'Ada' ? 'Bob' : 'Ada'}</button>{' '}
      <Counter key={person} label={person} />
    </div>
  );
}
`,
        css: '.demo p { margin: 10px 0 4px; color: #667; font-size: 13px; }',
        note: 'Click each counter a few times, then tick **Fancy**: the first keeps its count (same type, same place); the second starts over (its parent changed from `<div>` to `<section>`). **Switch** gives the last counter a new key, so it starts over too.'
      },
      challenge: {
        title: 'A draft that behaves',
        strict: true,
        task: 'This messenger has two bugs, both about how React matches components:\n\n' +
          '- Typing in the draft loses the focus after every letter: the text box is thrown away and made again on each keystroke. Keep the same box while typing.\n' +
          '- Switching contact keeps the draft you wrote to the last one: write to Ada, switch to Bob, and Ada\'s text is still there. Each contact should start with an empty draft.\n\n' +
          '**Send** still empties the draft. Keep the classes `.draft`, `.send` and `.pick-…`.',
        starter: `import { useState } from 'react';

const CONTACTS = [{ id: 'ada', name: 'Ada' }, { id: 'bob', name: 'Bob' }, { id: 'cy', name: 'Cy' }];

function Chat({ contact }) {
  const [draft, setDraft] = useState('');

  function Field() {
    return <textarea className="draft" value={draft} onChange={e => setDraft(e.target.value)} placeholder={'Message ' + contact.name} />;
  }

  return (
    <section className="chat">
      <h3>To {contact.name}</h3>
      <Field />
      <button className="send" onClick={() => setDraft('')}>Send</button>
    </section>
  );
}

export default function Messenger() {
  const [to, setTo] = useState(CONTACTS[0]);
  return (
    <div className="messenger">
      <nav>
        {CONTACTS.map(c => (
          <button key={c.id} className={'pick-' + c.id} aria-pressed={c.id === to.id} onClick={() => setTo(c)}>{c.name}</button>
        ))}
      </nav>
      <Chat contact={to} />
    </div>
  );
}
`,
        solution: `import { useState } from 'react';

const CONTACTS = [{ id: 'ada', name: 'Ada' }, { id: 'bob', name: 'Bob' }, { id: 'cy', name: 'Cy' }];

function Field({ value, onChange, name }) {
  return <textarea className="draft" value={value} onChange={e => onChange(e.target.value)} placeholder={'Message ' + name} />;
}

function Chat({ contact }) {
  const [draft, setDraft] = useState('');

  return (
    <section className="chat">
      <h3>To {contact.name}</h3>
      <Field value={draft} onChange={setDraft} name={contact.name} />
      <button className="send" onClick={() => setDraft('')}>Send</button>
    </section>
  );
}

export default function Messenger() {
  const [to, setTo] = useState(CONTACTS[0]);
  return (
    <div className="messenger">
      <nav>
        {CONTACTS.map(c => (
          <button key={c.id} className={'pick-' + c.id} aria-pressed={c.id === to.id} onClick={() => setTo(c)}>{c.name}</button>
        ))}
      </nav>
      <Chat key={to.id} contact={to} />
    </div>
  );
}
`,
        css: 'nav button { margin-right: 4px; } nav button[aria-pressed="true"] { font-weight: 700; } .chat h3 { margin: 8px 0 4px; } .draft { display: block; width: 260px; height: 46px; margin-bottom: 4px; }',
        hints: [
          '`Field` is defined inside `Chat`, so every render of `Chat` makes a new `Field` function, a new type for React. Move it to the top level and pass it what it uses: `<Field value={draft} onChange={setDraft} name={contact.name} />`.',
          'Switching contact renders the same `Chat` in the same place, so React keeps it and its draft. Give it a key that changes with the contact: `<Chat key={to.id} contact={to} />`.'
        ],
        checks: [
          { label: 'Typing keeps the same text box, with the focus in it', fn: `async function (doc, win, t) {
  var box = doc.querySelector('.draft');
  await t.type(box, 'H');
  var now = doc.querySelector('.draft');
  if (now !== box) return 'after one letter the text box is a new one: React threw the old one away, and the focus with it';
  await t.type(now, 'Hi');
  if (doc.querySelector('.draft') !== box) return 'after two letters the text box is a new one';
  if (doc.activeElement !== box) return 'the focus left the text box';
  return box.value === 'Hi' || 'the box says "' + box.value + '"';
}` },
          { label: 'Switching to Bob starts an empty draft, for Bob', fn: `async function (doc, win, t) {
  await t.type('.draft', 'Hi Ada');
  await t.click('.pick-bob');
  var d = doc.querySelector('.draft');
  if (d.value !== '') return 'Bob\\'s draft says "' + d.value + '"';
  return d.getAttribute('placeholder') === 'Message Bob' || 'the placeholder says "' + d.getAttribute('placeholder') + '"';
}` },
          { label: 'Send empties the draft', fn: `async function (doc, win, t) {
  await t.type('.draft', 'See you');
  await t.click('.send');
  return doc.querySelector('.draft').value === '' || 'after Send the draft says "' + doc.querySelector('.draft').value + '"';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'r-memo', track: 'performance',
      title: 'memo: skip a re-render',
      summary: 'memo(Component) lets React skip re-rendering a component when every prop is the same as last time, compared one by one with Object.is. It helps only when the props really stay the same: a new object, array, function or JSX each render defeats it.',
      keywords: ['memo', 'React.memo', 'memoization', 'memoisation', 'skip re-render', 'shallow comparison', 'shallow equal', 'Object.is', 'props equal', 'PureComponent', 'arePropsEqual', 'stable props', 'state setter stable'],
      docs: 'https://react.dev/reference/react/memo',
      body: [
        'A child re-renders whenever its parent does ([[lesson:r-rendering]]). `memo` adds a check first: if every prop is the same as last time, React reuses the last result and skips the component, and everything below it.',
        jsx("import { memo } from 'react';",
            '',
            'const Row = memo(function Row({ item, selected, onSelect }) {',
            "  return <li className={selected ? 'selected' : ''} onClick={() => onSelect(item.id)}>{item.name}</li>;",
            '});'),
        '## "The same" means Object.is, prop by prop',
        '| The prop | Is the same as last time when |\n|---|---|\n' +
        '| `5`, `\'Ada\'`, `true`, `null` | The value is equal |\n' +
        '| `item`, an object from state | It is the very same object: state you did not change keeps its objects |\n' +
        '| `style={{ color: \'red\' }}` | Never: a new object each render |\n' +
        '| `onSelect={id => select(id)}` | Never: a new function each render |\n' +
        '| `onSelect={setSelected}` | Always: a state setter (and `dispatch`) never changes |\n' +
        '| `children` written as JSX | Never: JSX makes new elements each render |',
        'So `memo` works only with props that stay the same. Pass state setters as they are, move constant objects out of the component, keep the objects that come from state; for the rest there is [[lesson:r-usememo-usecallback]].',
        '## What memo does not stop',
        '- The component\'s **own state** changing: it renders.\n' +
        '- A **context** it reads changing: it renders.\n' +
        '- A parent that passes a new object or function every time: the comparison fails every time, and `memo` only adds its own cost.',
        'A second argument replaces the comparison: `memo(Row, (prev, next) => prev.item.id === next.item.id)`. It is rarely worth it and easy to get wrong: forget a prop and the row shows stale data.',
        '## When to use it',
        '`memo` is a performance hint, not a promise: React may still render. Use it on components that often render with the same props and cost something: the rows of a long list, a chart, a large form section. Measure with **Highlight renders** or the Profiler before and after. With the React Compiler on, it is added for you ([[lesson:r-react-compiler]]). The interview question is [[q:memo-usememo-usecallback]].'
      ].join('\n\n'),
      plainjs: 'The plain-JS version is a cache in front of a function: `if (sameArgs(args, lastArgs)) return lastResult;`. `memo` is that for a component, comparing each prop with `===` (more exactly, `Object.is`). Like every cache keyed on objects, it only hits when you pass the same objects again, not copies that look the same.',
      example: {
        code: `import { useState, useEffect, memo } from 'react';

const NAMES = ['Ada', 'Bob', 'Cy', 'Dee'];

function PlainRow({ name }) {
  return <li>{name}</li>;
}

const MemoRow = memo(function MemoRow({ name }) {
  return <li>{name}</li>;
});

export default function App() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="lists">
      <p>Seconds: {seconds}</p>
      <ul>{NAMES.map(n => <PlainRow key={n} name={n} />)}</ul>
      <ul>{NAMES.map(n => <MemoRow key={n} name={n} />)}</ul>
    </div>
  );
}
`,
        css: '.lists { display: flex; flex-wrap: wrap; gap: 4px 24px; } .lists p { flex-basis: 100%; margin: 0; } .lists ul { margin: 0; }',
        note: 'Turn on **Highlight renders**: every second `App` and the four `PlainRow`s flash; the `MemoRow`s never do, because their only prop, a string, never changes. Now give each `MemoRow` the prop `style={{ color: \'teal\' }}`: a new object every second, and they flash too.'
      },
      challenge: {
        title: 'A clock that re-renders 200 rows',
        strict: true,
        task: 'The clock above the list ticks four times a second (fast, so the checks need not wait), and every tick re-renders all 200 rows, though none of them shows the time. Make `Row` skip the renders it does not need:\n\n' +
          '- While the clock ticks, no `Row` re-renders.\n' +
          '- Clicking a row selects it (class `selected`), and re-renders exactly two rows: the one that was selected and the new one.\n\n' +
          'Keep the names `List` and `Row`: the checks count their renders.',
        starter: `import { useState, useEffect, memo } from 'react';

const ITEMS = Array.from({ length: 200 }, (_, i) => ({ id: i + 1, name: 'Item ' + (i + 1) }));

function Row({ item, selected, onSelect }) {
  return (
    <li className={selected ? 'row selected' : 'row'} onClick={() => onSelect(item.id)}>
      {item.name}
    </li>
  );
}

export default function List() {
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <p className="clock">{now.toLocaleTimeString()}</p>
      <ul className="rows">
        {ITEMS.map(item => (
          <Row key={item.id} item={item} selected={item.id === selected} onSelect={setSelected} />
        ))}
      </ul>
    </div>
  );
}
`,
        solution: `import { useState, useEffect, memo } from 'react';

const ITEMS = Array.from({ length: 200 }, (_, i) => ({ id: i + 1, name: 'Item ' + (i + 1) }));

const Row = memo(function Row({ item, selected, onSelect }) {
  return (
    <li className={selected ? 'row selected' : 'row'} onClick={() => onSelect(item.id)}>
      {item.name}
    </li>
  );
});

export default function List() {
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <p className="clock">{now.toLocaleTimeString()}</p>
      <ul className="rows">
        {ITEMS.map(item => (
          <Row key={item.id} item={item} selected={item.id === selected} onSelect={setSelected} />
        ))}
      </ul>
    </div>
  );
}
`,
        css: '.clock { font: 700 20px ui-monospace, Consolas, monospace; margin: 0 0 6px; } .rows { height: 120px; overflow-y: auto; margin: 0; padding: 0; list-style: none; border: 1px solid #ccd; border-radius: 8px; max-width: 260px; } .row { padding: 2px 10px; cursor: pointer; } .row.selected { background: #dbe9ff; font-weight: 700; }',
        hints: [
          'Each tick sets `now` in `List`, so `List` renders, and with it every `Row`, whose props have not changed: the same `item` object from `ITEMS`, the same `selected`, the same `setSelected`.',
          'Wrap `Row` in `memo`: `const Row = memo(function Row({ item, selected, onSelect }) { … });`. Its three props are all the same on a tick, so React skips it.',
          'On a click only two rows get a different `selected`: the old one (now `false`) and the new one (now `true`). `onSelect={setSelected}` is a state setter, the same function forever, so it never breaks the comparison.'
        ],
        checks: [
          { label: 'Clicking Item 3 selects it', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.rows .row')[2]);
  var sel = [].filter.call(doc.querySelectorAll('.rows .row'), function (r) { return r.classList.contains('selected'); }).map(function (r) { return r.textContent; });
  return sel.join(', ') === 'Item 3' || 'the selected rows are: ' + (sel.join(', ') || 'none');
}` },
          { label: 'While the clock ticks, no `Row` re-renders', fn: `async function (doc, win, t) {
  var r = await t.renders(function () { return t.wait(700); });
  if (!r.List) return 'the clock did not tick for 0.7 seconds (List did not render): keep the interval';
  return !r.Row || r.List + ' ticks re-rendered Row ' + r.Row + ' times';
}` },
          { label: 'Selecting Item 7 re-renders two rows: Item 3 and Item 7', fn: `async function (doc, win, t) {
  var row = doc.querySelectorAll('.rows .row')[6];
  var r = await t.renders(async function () { await t.click(row); });
  if (!doc.querySelectorAll('.rows .row')[6].classList.contains('selected')) return 'Item 7 is not selected';
  return r.Row === 2 || 'selecting Item 7 re-rendered ' + (r.Row || 0) + ' rows (two are right: the old selection and the new)';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'r-usememo-usecallback', track: 'performance',
      title: 'useMemo and useCallback',
      summary: 'useMemo keeps a calculated value between renders, and useCallback keeps a function, until one of their dependencies changes. Use them for a slow calculation, and to give a memo child (or an effect) props that stay the same. Anywhere else they only add cost.',
      keywords: ['useMemo', 'useCallback', 'memoize', 'memoise', 'cache a value', 'cache a function', 'stable callback', 'stable reference', 'expensive calculation', 'dependencies', 'referential equality', 'useCallback vs useMemo', 'updater function'],
      docs: 'https://react.dev/reference/react/useMemo',
      body: [
        jsx('const visible = useMemo(() => filterTodos(todos, tab), [todos, tab]);   // keeps a value',
            '',
            'const toggle = useCallback(id => {                                       // keeps a function',
            '  setTodos(ts => ts.map(t => (t.id === id ? { ...t, done: !t.done } : t)));',
            '}, []);'),
        'On the first render React calls your function and keeps the result. On each later render it compares the dependencies with last time (`Object.is`, as for effects): all the same, it hands back the kept result; one changed, it calls your function again. `useCallback(fn, deps)` is exactly `useMemo(() => fn, deps)`: what it keeps is the function itself.',
        '## Three reasons to use them',
        '| Reason | For example |\n|---|---|\n' +
        '| A slow calculation would run on renders where its inputs did not change | Filtering or sorting thousands of items while the user types somewhere else |\n' +
        '| A prop of a `memo` child must stay the same | An `onToggle` callback, a `labels` object |\n' +
        '| A dependency of an effect must stay the same | An options object the effect connects with |',
        '"Slow" means measured: put `console.time(\'filter\')` and `console.timeEnd(\'filter\')` around it. A millisecond or more on every keystroke is worth keeping; building a few objects is not.',
        '## Keeping the dependencies empty',
        'A callback that reads state must list it, and is new whenever it changes. The updater form reads nothing (React passes in the latest value), so the callback can be made once:',
        jsx('const toggle = useCallback(id => setTodos(todos.map(…)), [todos]);   // a new function after every change',
            'const toggle = useCallback(id => setTodos(ts => ts.map(…)), []);     // made once'),
        '## When they do nothing',
        '- On a child that is not wrapped in `memo`: it re-renders anyway, whatever its props.\n' +
        '- When one other prop is still new on each render: one inline object breaks the comparison for all.\n' +
        '- For a cheap value: the comparison and the memory cost more than the calculation.',
        'In development StrictMode calls your `useMemo` function twice, to catch an impure one; production calls it once. `useMemo` is a cache that React may drop, not a promise: the code must still be right without it. With the React Compiler you rarely write either by hand ([[lesson:r-react-compiler]]). The interview question is [[q:memo-usememo-usecallback]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you would cache by hand: `if (todos !== lastTodos || tab !== lastTab) { cached = filterTodos(todos, tab); lastTodos = todos; lastTab = tab; }`. `useMemo` is that, with one cache per component on the page. `useCallback` solves a problem plain JavaScript rarely has: a function made inside a render is a new one each time, which matters only because `memo` and effects compare by reference.',
      example: {
        code: `import { useState, useMemo } from 'react';

function countMultiples(limit, of) {
  console.log('counting the multiples of ' + of + ' up to ' + limit);
  let n = 0;
  for (let i = 1; i <= limit; i++) {
    if (i % of === 0) n++;
  }
  return n;
}

export default function App() {
  const [limit, setLimit] = useState(1000000);
  const [dark, setDark] = useState(false);
  const count = useMemo(() => countMultiples(limit, 7), [limit]);

  return (
    <div className={dark ? 'box dark' : 'box'}>
      <label>
        Up to <input type="number" value={limit} onChange={e => setLimit(Number(e.target.value))} />
      </label>
      <p>{count} multiples of 7</p>
      <label>
        <input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} /> Dark
      </label>
    </div>
  );
}
`,
        css: '.box { padding: 8px 12px; border-radius: 8px; max-width: 280px; } .dark { background: #20232a; color: #eee; } input[type="number"] { width: 110px; }',
        note: 'Tick **Dark** a few times: the console stays quiet, because `limit` did not change and `useMemo` hands back the count it kept. Change the number: it counts again. Then write `const count = countMultiples(limit, 7);` instead, and tick Dark again.'
      },
      challenge: {
        title: 'Stable props for a memo list',
        strict: true,
        task: '`Row` is wrapped in `memo`, yet typing a note re-renders all 100 rows and runs the slow filter on every keystroke, and ticking one task re-renders every row. Fix `TodoList`, keeping what it does:\n\n' +
          '- Typing in the note renders no `Row`, and does not run `filterTodos` again.\n' +
          '- Ticking one task re-renders that row alone, and it shows **Done**.\n' +
          '- The **To do** filter still shows only the unfinished tasks.\n\n' +
          'Keep the names `Row` and `filterTodos`, and the line that counts the filter\'s calls.',
        starter: `import { useState, useMemo, useCallback, memo } from 'react';

const TODOS = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, text: 'Task ' + (i + 1), done: i % 3 === 0 }));

window.filterCalls = 0;   // the checks count the filtering
function filterTodos(todos, show) {
  window.filterCalls++;
  const start = performance.now();
  while (performance.now() - start < 20) {}   // pretend the filter is slow
  return todos.filter(t => show === 'all' || (show === 'done' ? t.done : !t.done));
}

const Row = memo(function Row({ todo, labels, onToggle }) {
  return (
    <li className="row">
      <label>
        <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} /> {todo.text}
      </label>{' '}
      <span className="state">{todo.done ? labels.done : labels.todo}</span>
    </li>
  );
});

export default function TodoList() {
  const [todos, setTodos] = useState(TODOS);
  const [show, setShow] = useState('all');
  const [note, setNote] = useState('');

  const visible = filterTodos(todos, show);
  const labels = { done: 'Done', todo: 'To do' };

  function toggle(id) {
    setTodos(todos.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  return (
    <div>
      <input className="note" value={note} onChange={e => setNote(e.target.value)} placeholder="A note to yourself" />
      <select className="show" value={show} onChange={e => setShow(e.target.value)}>
        <option value="all">All</option>
        <option value="todo">To do</option>
        <option value="done">Done</option>
      </select>
      <ul className="rows">
        {visible.map(t => <Row key={t.id} todo={t} labels={labels} onToggle={toggle} />)}
      </ul>
    </div>
  );
}
`,
        solution: `import { useState, useMemo, useCallback, memo } from 'react';

const TODOS = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, text: 'Task ' + (i + 1), done: i % 3 === 0 }));

window.filterCalls = 0;   // the checks count the filtering
function filterTodos(todos, show) {
  window.filterCalls++;
  const start = performance.now();
  while (performance.now() - start < 20) {}   // pretend the filter is slow
  return todos.filter(t => show === 'all' || (show === 'done' ? t.done : !t.done));
}

const Row = memo(function Row({ todo, labels, onToggle }) {
  return (
    <li className="row">
      <label>
        <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} /> {todo.text}
      </label>{' '}
      <span className="state">{todo.done ? labels.done : labels.todo}</span>
    </li>
  );
});

const LABELS = { done: 'Done', todo: 'To do' };

export default function TodoList() {
  const [todos, setTodos] = useState(TODOS);
  const [show, setShow] = useState('all');
  const [note, setNote] = useState('');

  const visible = useMemo(() => filterTodos(todos, show), [todos, show]);

  const toggle = useCallback(id => {
    setTodos(ts => ts.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  return (
    <div>
      <input className="note" value={note} onChange={e => setNote(e.target.value)} placeholder="A note to yourself" />
      <select className="show" value={show} onChange={e => setShow(e.target.value)}>
        <option value="all">All</option>
        <option value="todo">To do</option>
        <option value="done">Done</option>
      </select>
      <ul className="rows">
        {visible.map(t => <Row key={t.id} todo={t} labels={LABELS} onToggle={toggle} />)}
      </ul>
    </div>
  );
}
`,
        css: '.note { padding: 4px 8px; margin-right: 6px; } .rows { height: 110px; overflow-y: auto; margin: 6px 0 0; padding: 0 8px; list-style: none; border: 1px solid #ccd; border-radius: 8px; max-width: 300px; } .state { color: #667; font-size: 12px; }',
        hints: [
          '`labels` is a new object on every render, and `toggle` a new function: `memo` compares them with `Object.is`, finds them different, and renders every row. Move `labels` out of the component (it never changes), and wrap `toggle` in `useCallback`.',
          'Make `toggle` need no dependencies with the updater form: `useCallback(id => { setTodos(ts => ts.map(…)); }, [])`. With `[todos]` it would be a new function after each tick, and every row would render again.',
          'Cache the filtered list: `const visible = useMemo(() => filterTodos(todos, show), [todos, show]);`. Typing a note changes neither, so the slow filter does not run; a tick changes `todos`, so it runs once, and each unchanged todo keeps its object.'
        ],
        checks: [
          { label: 'Typing a note renders no `Row`', fn: `async function (doc, win, t) {
  var r = await t.renders(async function () {
    await t.type('.note', 'b');
    await t.type('.note', 'bu');
  });
  return !r.Row || 'two keystrokes re-rendered Row ' + r.Row + ' times';
}` },
          { label: 'Typing a note does not run `filterTodos` again', fn: `async function (doc, win, t) {
  var before = win.filterCalls;
  await t.type('.note', 'buy');
  await t.type('.note', 'buy m');
  return win.filterCalls === before || 'two keystrokes ran filterTodos ' + (win.filterCalls - before) + ' times';
}` },
          { label: 'Ticking Task 2 re-renders that row alone, and it shows Done', fn: `async function (doc, win, t) {
  var box = doc.querySelectorAll('.rows .row')[1].querySelector('input');
  var r = await t.renders(async function () { await t.click(box); });
  var state = doc.querySelectorAll('.rows .row')[1].querySelector('.state');
  if (!state || state.textContent !== 'Done') return 'Task 2 shows "' + (state ? state.textContent : '') + '"';
  return r.Row === 1 || 'ticking one task re-rendered ' + (r.Row || 0) + ' rows';
}` },
          { label: 'To do shows only the unfinished tasks', fn: `async function (doc, win, t) {
  await t.type('.show', 'todo');
  var rows = doc.querySelectorAll('.rows .row');
  var done = [].filter.call(rows, function (r) { return r.querySelector('input').checked; });
  if (done.length) return done.length + ' finished task(s) show, such as ' + done[0].textContent;
  return rows.length === 65 || rows.length + ' tasks show (65 are unfinished)';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'r-react-compiler', track: 'performance',
      title: 'The React Compiler',
      summary: 'The React Compiler is a build-time tool (1.0 since October 2025) that adds the memoisation of memo, useMemo and useCallback for you, more finely than by hand. It relies on your components keeping the rules of React: pure rendering, props and state never changed in place, the rules of hooks.',
      keywords: ['react compiler', 'compiler', 'babel-plugin-react-compiler', 'automatic memoization', 'auto memo', 'rules of react', 'pure', 'purity', 'pure component', 'idempotent', 'mutation', 'mutate props', 'use no memo', 'eslint-plugin-react-hooks', 'react forget'],
      docs: 'https://react.dev/learn/react-compiler',
      body: [
        'Writing `memo`, `useMemo` and `useCallback` by hand is tedious and easy to get wrong: one inline object or one missing dependency, and the work is wasted or the screen goes stale. The **React Compiler** does it at build time. It reads each component and hook, works out which values depend on which props and state, and caches each value and each piece of JSX until its inputs change:',
        jsx('// you write',
            'function TodoList({ todos, tab }) {',
            '  const visible = filterTodos(todos, tab);',
            '  return <List items={visible} onSelect={id => select(id)} />;',
            '}',
            '',
            '// it compiles, roughly, into',
            'function TodoList({ todos, tab }) {',
            '  const $ = useMemoCache(4);',
            '  let visible;',
            '  if ($[0] !== todos || $[1] !== tab) {',
            '    visible = filterTodos(todos, tab);',
            '    $[0] = todos; $[1] = tab; $[2] = visible;',
            '  } else {',
            '    visible = $[2];',
            '  }',
            '  …   // the JSX and the arrow function are cached the same way',
            '}'),
        '## Turning it on',
        '| Project | How |\n|---|---|\n' +
        '| Vite | `babel-plugin-react-compiler` in the React plugin\'s Babel options; new projects can start with it on |\n' +
        '| Next.js | `reactCompiler: true` in `next.config` |\n' +
        '| Expo | On in new projects |\n' +
        '| A component that is not ready | `"use no memo"` as its first line skips it |',
        'React Compiler 1.0 came out on 7 October 2025, and works with React 17 and later. The recommended rules of `eslint-plugin-react-hooks` report the code it cannot compile. This tool runs plain Babel, not the compiler, so its memo lessons are done by hand.',
        '## The rules it relies on',
        '| Rule | Broken by |\n|---|---|\n' +
        '| Rendering is pure: the same props and state give the same JSX, and change nothing outside | `Math.random()` or `Date.now()` in the output; setting `document.title` or a global while rendering |\n' +
        '| Props and state are read-only | `props.items.sort()`, which sorts the parent\'s array in place; `user.name = …` |\n' +
        '| A value is not changed after it was used in JSX | Pushing into an array after handing it to a child |\n' +
        '| Refs are not read or written while rendering | `{ref.current}` in the JSX |\n' +
        '| The rules of hooks | A hook inside an `if` ([[lesson:r-rules-of-hooks]]) |',
        'Code that breaks them was already fragile (StrictMode\'s double render exists to expose it), and compiled, it can show stale values. When the compiler sees such code it skips that component, and the lint rule tells you; when it cannot see it, the bug ships. Pure components are the price of free memoisation.',
        '## What is left to do by hand',
        'Little: new code rarely needs `memo`, `useMemo` or `useCallback`, and the existing ones can stay. What the compiler does not change is **how much** renders: where state lives ([[lesson:r-rendering]]), long lists ([[lesson:r-long-lists]]), and urgent versus background updates ([[lesson:r-transitions]]). The interview question is [[q:react-compiler]].'
      ].join('\n\n'),
      plainjs: 'Plain JavaScript has no compiler step that rewrites your functions to cache their results; you cache by hand. The React Compiler can, because components promise what plain functions do not: given the same inputs they return the same output and change nothing else. Break that promise (sort an argument in place, change a global) and any cache, in any language, starts returning stale results.',
      example: {
        code: `import { useState } from 'react';

const SCORES = [
  { name: 'Asha', points: 72 },
  { name: 'Ravi', points: 95 },
  { name: 'Meera', points: 88 }
];

function Ranking({ scores, copy }) {
  const byPoints = (a, b) => b.points - a.points;
  const ranked = copy ? [...scores].sort(byPoints) : scores.sort(byPoints);
  return <ol>{ranked.map(s => <li key={s.name}>{s.name} {s.points}</li>)}</ol>;
}

export default function App() {
  const [show, setShow] = useState(false);
  const [copy, setCopy] = useState(false);
  return (
    <div>
      <label>
        <input type="checkbox" checked={copy} onChange={e => setCopy(e.target.checked)} /> Sort a copy
      </label>{' '}
      <button onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'} the ranking</button>
      <h4>As entered</h4>
      <ul>{SCORES.map(s => <li key={s.name}>{s.name}</li>)}</ul>
      {show && <Ranking scores={SCORES} copy={copy} />}
    </div>
  );
}
`,
        css: 'h4 { margin: 10px 0 2px; } ul, ol { margin: 0 0 6px; }',
        note: 'Click **Show the ranking**, then **Hide**: "As entered" has changed order, because `scores.sort(…)` sorted the array `App` owns. Press **Run** to start again, tick **Sort a copy**, and repeat: the original order stays. A compiled `App` would never notice its array changed, and could keep showing a list it cached.'
      },
      challenge: {
        title: 'Safe to compile',
        strict: true,
        task: '`Leaderboard` breaks two rules of React: it sorts the `scores` it was given in place, and it makes up a new key for every row on every render. Fix it, keeping what it shows:\n\n' +
          '- The `SCORES` array is never changed: "As entered" keeps its order, before and after **Lowest first**.\n' +
          '- The ranking reads Ravi 95, Meera 88, Asha 72, Vikram 64, and **Lowest first** turns it round.\n' +
          '- A re-render keeps the same row elements: React moves them instead of making new ones.\n\n' +
          'Keep `window.SCORES = SCORES`: the checks look at it.',
        starter: `import { useState } from 'react';

const SCORES = [
  { name: 'Asha', points: 72 },
  { name: 'Ravi', points: 95 },
  { name: 'Meera', points: 88 },
  { name: 'Vikram', points: 64 }
];
window.SCORES = SCORES;   // the checks look at it

function Leaderboard({ scores, highestFirst }) {
  scores.sort((a, b) => (highestFirst ? b.points - a.points : a.points - b.points));
  return (
    <ol className="ranked">
      {scores.map(s => <li key={Math.random()}>{s.name} {s.points}</li>)}
    </ol>
  );
}

export default function App() {
  const [highestFirst, setHighestFirst] = useState(true);
  return (
    <div>
      <button className="flip" onClick={() => setHighestFirst(!highestFirst)}>
        {highestFirst ? 'Lowest first' : 'Highest first'}
      </button>
      <Leaderboard scores={SCORES} highestFirst={highestFirst} />
      <h4>As entered</h4>
      <ul className="entered">
        {SCORES.map(s => <li key={s.name}>{s.name}</li>)}
      </ul>
    </div>
  );
}
`,
        solution: `import { useState } from 'react';

const SCORES = [
  { name: 'Asha', points: 72 },
  { name: 'Ravi', points: 95 },
  { name: 'Meera', points: 88 },
  { name: 'Vikram', points: 64 }
];
window.SCORES = SCORES;   // the checks look at it

function Leaderboard({ scores, highestFirst }) {
  const ranked = [...scores].sort((a, b) => (highestFirst ? b.points - a.points : a.points - b.points));
  return (
    <ol className="ranked">
      {ranked.map(s => <li key={s.name}>{s.name} {s.points}</li>)}
    </ol>
  );
}

export default function App() {
  const [highestFirst, setHighestFirst] = useState(true);
  return (
    <div>
      <button className="flip" onClick={() => setHighestFirst(!highestFirst)}>
        {highestFirst ? 'Lowest first' : 'Highest first'}
      </button>
      <Leaderboard scores={SCORES} highestFirst={highestFirst} />
      <h4>As entered</h4>
      <ul className="entered">
        {SCORES.map(s => <li key={s.name}>{s.name}</li>)}
      </ul>
    </div>
  );
}
`,
        css: 'h4 { margin: 10px 0 2px; } .ranked, .entered { margin: 4px 0; }',
        hints: [
          '`scores.sort(…)` sorts the very array `App` passed in, `SCORES` itself. Sort a copy: `const ranked = [...scores].sort(…)` (or `scores.toSorted(…)`), and render `ranked`.',
          '`key={Math.random()}` is a new key on every render, so React throws every row away and makes it again, and the component is not pure either: the same props give different output. Use something stable from the data: `key={s.name}`.'
        ],
        checks: [
          { label: 'The `SCORES` array is never changed', fn: `function (doc, win) {
  if (!win.SCORES) return 'window.SCORES is gone: keep the line that sets it';
  var order = win.SCORES.map(function (s) { return s.name; }).join(', ');
  return order === 'Asha, Ravi, Meera, Vikram' || 'SCORES is now in this order: ' + order + ': something sorted it in place';
}` },
          { label: 'Highest first: Ravi 95, Meera 88, Asha 72, Vikram 64', fn: `function (doc) {
  var r = [].map.call(doc.querySelectorAll('.ranked li'), function (li) { return li.textContent; }).join(', ');
  return r === 'Ravi 95, Meera 88, Asha 72, Vikram 64' || 'the ranking reads: ' + r;
}` },
          { label: 'Lowest first turns it round, and "As entered" keeps its order', fn: `async function (doc, win, t) {
  await t.click('.flip');
  var r = [].map.call(doc.querySelectorAll('.ranked li'), function (li) { return li.textContent; }).join(', ');
  if (r !== 'Vikram 64, Asha 72, Meera 88, Ravi 95') return 'the ranking reads: ' + r;
  var e = [].map.call(doc.querySelectorAll('.entered li'), function (li) { return li.textContent; }).join(', ');
  return e === 'Asha, Ravi, Meera, Vikram' || '"As entered" reads: ' + e;
}` },
          { label: 'A re-render keeps the same row elements: the keys come from the data', fn: `async function (doc, win, t) {
  var before = [].slice.call(doc.querySelectorAll('.ranked li'));
  await t.click('.flip');
  var after = [].slice.call(doc.querySelectorAll('.ranked li'));
  var fresh = after.filter(function (li) { return before.indexOf(li) < 0; });
  return !fresh.length || fresh.length + ' of the ' + after.length + ' rows are new elements after a re-render: give each row a key from the data';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'r-transitions', track: 'performance',
      title: 'Transitions and useDeferredValue',
      summary: 'Some updates are urgent (what you type, what you click) and some are not (the list that follows, the next tab). Mark the slow ones with startTransition, or render the slow part from useDeferredValue: React renders them in the background, keeps the page responsive, and drops a render that a newer update has made pointless.',
      keywords: ['useTransition', 'startTransition', 'transition', 'transitions', 'isPending', 'useDeferredValue', 'deferred value', 'concurrent rendering', 'concurrent', 'interruptible rendering', 'urgent update', 'non-urgent update', 'responsive input', 'debounce vs deferred', 'stale content'],
      docs: 'https://react.dev/reference/react/useTransition',
      body: [
        'Normally a render runs to its end once started: if it takes 300 ms, the page is frozen for 300 ms, and the next click or keystroke waits. Since React 18 a render can be **interruptible**, if you tell React it is not urgent.',
        '## useTransition',
        jsx('const [isPending, startTransition] = useTransition();',
            '',
            'function selectTab(next) {',
            '  startTransition(() => {',
            '    setTab(next);            // not urgent: render it in the background',
            '  });',
            '}',
            '',
            '{isPending && <Spinner />}'),
        'Inside `startTransition`, `setTab(\'posts\')` starts a **background render**. The old tab stays on the screen and keeps responding, and `isPending` is true. React renders the new tab in small slices and handles anything urgent between them: another click starts a newer update, and the outdated background render is dropped without ever reaching the screen.',
        '| | An urgent update (a plain `setState`) | A transition |\n|---|---|---|\n' +
        '| Reaches the screen | As soon as it is rendered | When its background render is done |\n' +
        '| While it renders | The page waits | The old screen stays, and responds |\n' +
        '| A newer update arrives | It waits its turn | The outdated render is dropped |\n' +
        '| Something suspends | The Suspense fallback shows | The old screen stays instead |',
        '`startTransition` also exists without the hook (`import { startTransition } from \'react\'`), for code outside components; it gives no `isPending`. React 19 lets the function be `async`: that is an Action ([[lesson:r-actions]]).',
        'One thing a transition cannot hold is the value of a controlled input: typing must show at once, so `setText` stays urgent. Put only the slow consequence in the transition, or use the next hook.',
        '## useDeferredValue',
        jsx("const [query, setQuery] = useState('');",
            'const deferredQuery = useDeferredValue(query);   // lags behind while React is busy',
            'const isStale = query !== deferredQuery;',
            '',
            '<input value={query} onChange={e => setQuery(e.target.value)} />',
            '<div style={{ opacity: isStale ? 0.5 : 1 }}>',
            '  <SlowList query={deferredQuery} />',
            '</div>',
            '',
            'const SlowList = memo(function SlowList({ query }) { … });'),
        'On a keystroke React first renders with the new `query` and the **old** `deferredQuery`, so the input updates at once. Then it renders again in the background with the new `deferredQuery`, dropped if another keystroke comes first. Use it when you do not own the update: the value comes from a parent or a library.',
        '**`SlowList` must be wrapped in `memo`.** In the urgent render it receives the old `deferredQuery`, the same as before; without `memo` it renders again anyway, slowly, and nothing is gained.',
        '## Instead of a debounce?',
        'A debounce waits a fixed time after the last keystroke, even on a fast computer, and then renders everything at once, freezing the page if the render is slow. A deferred value starts at once, adapts to the device, and can be interrupted. Keep debouncing for what costs outside React, such as a request per keystroke ([[lesson:r-custom-hooks]]). The interview question is [[q:transitions]].'
      ].join('\n\n'),
      plainjs: 'Plain JavaScript runs on one thread: a function that takes 300 ms blocks every click and keystroke for 300 ms. The plain-JS fixes are a debounce (do it later, all at once), or splitting the work by hand into chunks with `setTimeout` or `requestIdleCallback`, and cancelling the chunks of an outdated job yourself. A transition is that chunking, done by React: it renders in slices, gives the browser a turn between them, and throws away a job that a newer update has made pointless.',
      example: {
        code: `import { useState, useDeferredValue, memo } from 'react';

const WORDS = Array.from({ length: 400 }, (_, i) => ['apple', 'banana', 'cherry', 'grape'][i % 4] + ' ' + (i + 1));

function Word({ text }) {
  const start = performance.now();
  while (performance.now() - start < 0.5) {}   // each word takes half a millisecond to draw
  return <li>{text}</li>;
}

const WordList = memo(function WordList({ query }) {
  const shown = WORDS.filter(w => w.includes(query));
  return <ul className="words">{shown.map(w => <Word key={w} text={w} />)}</ul>;
});

export default function App() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Type quickly: app, ban, 12…" />
      <div className={isStale ? 'stale' : ''}>
        <WordList query={deferredQuery} />
      </div>
    </div>
  );
}
`,
        css: 'input { padding: 4px 8px; width: 240px; } .words { height: 120px; overflow-y: auto; margin: 6px 0 0; padding-left: 22px; border: 1px solid #ccd; border-radius: 8px; max-width: 280px; } .stale { opacity: 0.45; transition: opacity 0.2s; }',
        note: 'Type quickly: every letter shows at once, while the list catches up, dimmed meanwhile. Then change `useDeferredValue(query)` to plain `query` and type again: each keystroke now waits for the whole list.'
      },
      challenge: {
        title: 'A slow tab that freezes the page',
        strict: true,
        task: 'The **Posts** tab takes about a quarter of a second to render (250 slow posts). Click it, then **Contact** at once: nothing answers until all the posts are drawn, and only then does Contact show. Make the tabs switch in a transition, so that:\n\n' +
          '- Right after clicking **Posts** the old tab is still shown, with `<span className="pending">Loading…</span>` next to the tabs.\n' +
          '- **Contact**, clicked while Posts is still rendering, wins at once: the posts are never drawn.\n' +
          '- Given time, Posts opens: 250 posts, and no `Loading…`.\n\n' +
          'Keep the component names: the checks count their renders.',
        starter: `import { useState, useTransition } from 'react';

function SlowPost({ n }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}   // each post takes 1 ms to draw
  return <li>Post #{n}</li>;
}

function Posts() {
  const items = [];
  for (let i = 1; i <= 250; i++) items.push(<SlowPost key={i} n={i} />);
  return <ul className="posts">{items}</ul>;
}

function About() {
  return <p className="about">I write about React.</p>;
}

function Contact() {
  return <p className="contact">Write to me at asha@example.com.</p>;
}

export default function Profile() {
  const [tab, setTab] = useState('about');

  function select(next) {
    setTab(next);
  }

  return (
    <div>
      <nav className="tabs">
        <button className="tab-about" aria-pressed={tab === 'about'} onClick={() => select('about')}>About</button>
        <button className="tab-posts" aria-pressed={tab === 'posts'} onClick={() => select('posts')}>Posts</button>
        <button className="tab-contact" aria-pressed={tab === 'contact'} onClick={() => select('contact')}>Contact</button>
      </nav>
      {tab === 'about' && <About />}
      {tab === 'posts' && <Posts />}
      {tab === 'contact' && <Contact />}
    </div>
  );
}
`,
        solution: `import { useState, useTransition } from 'react';

function SlowPost({ n }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}   // each post takes 1 ms to draw
  return <li>Post #{n}</li>;
}

function Posts() {
  const items = [];
  for (let i = 1; i <= 250; i++) items.push(<SlowPost key={i} n={i} />);
  return <ul className="posts">{items}</ul>;
}

function About() {
  return <p className="about">I write about React.</p>;
}

function Contact() {
  return <p className="contact">Write to me at asha@example.com.</p>;
}

export default function Profile() {
  const [tab, setTab] = useState('about');
  const [isPending, startTransition] = useTransition();

  function select(next) {
    startTransition(() => {
      setTab(next);
    });
  }

  return (
    <div>
      <nav className="tabs">
        <button className="tab-about" aria-pressed={tab === 'about'} onClick={() => select('about')}>About</button>
        <button className="tab-posts" aria-pressed={tab === 'posts'} onClick={() => select('posts')}>Posts</button>
        <button className="tab-contact" aria-pressed={tab === 'contact'} onClick={() => select('contact')}>Contact</button>
        {isPending && <span className="pending">Loading…</span>}
      </nav>
      {tab === 'about' && <About />}
      {tab === 'posts' && <Posts />}
      {tab === 'contact' && <Contact />}
    </div>
  );
}
`,
        css: '.tabs button { margin-right: 4px; } .tabs button[aria-pressed="true"] { font-weight: 700; } .pending { color: #667; font-size: 13px; } .posts { height: 110px; overflow-y: auto; margin: 6px 0 0; }',
        hints: [
          '`const [isPending, startTransition] = useTransition();` at the top of `Profile`.',
          'In `select`, put the update in a transition: `startTransition(() => { setTab(next); });`. React then renders the new tab in the background and keeps the old one on the screen.',
          'Show `{isPending && <span className="pending">Loading…</span>}` beside the buttons. A click on Contact during the Posts render is a newer update: React drops the Posts render and shows Contact.'
        ],
        checks: [
          { label: 'Right after clicking Posts, About is still shown, with Loading…', fn: `async function (doc, win, t) {
  await t.click('.tab-posts');
  if (doc.querySelector('.posts')) return 'the posts were drawn before the click returned: the page was frozen while they rendered';
  if (!doc.querySelector('.about')) return 'About went away before the posts were ready';
  return !!doc.querySelector('.pending') || 'no .pending (Loading…) while the posts render';
}` },
          { label: 'Given time, Posts opens: 250 posts, and no Loading…', fn: `async function (doc, win, t) {
  if (!doc.querySelector('.posts')) await t.click('.tab-posts');
  for (var i = 0; i < 60 && (doc.querySelectorAll('.posts li').length < 250 || doc.querySelector('.pending')); i++) await t.wait(50);
  if (doc.querySelectorAll('.posts li').length !== 250) return doc.querySelectorAll('.posts li').length + ' posts after 3 seconds';
  return !doc.querySelector('.pending') || 'Loading… is still shown';
}` },
          { label: 'Contact, clicked while Posts is rendering, wins: the posts are never drawn', fn: `async function (doc, win, t) {
  await t.click('.tab-about');
  for (var i = 0; i < 40 && !doc.querySelector('.about'); i++) await t.wait(50);
  var r = await t.renders(async function () {
    await t.click('.tab-posts');
    await t.wait(30);
    await t.click('.tab-contact');
    await t.wait(800);
  });
  if (!doc.querySelector('.contact')) return 'Contact is not shown';
  if (doc.querySelector('.pending')) return 'Loading… is still shown';
  return !r.Posts || 'Posts was drawn ' + r.Posts + ' time(s), though Contact was clicked first: make the tab switch a transition';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'r-lazy-suspense', track: 'performance',
      title: 'lazy and Suspense: load code when it is needed',
      summary: 'lazy(() => import(\'./Chart\')) puts a component in a file of its own, downloaded the first time it renders, and <Suspense fallback={…}> shows something in its place meanwhile. Declare lazy components at the top level, split by route and by heavy widget, and catch a failed download with an error boundary.',
      keywords: ['lazy', 'React.lazy', 'Suspense', 'fallback', 'code splitting', 'dynamic import', 'import()', 'bundle size', 'chunk', 'lazy loading', 'loading spinner', 'route splitting', 'preload', 'suspense boundary'],
      docs: 'https://react.dev/reference/react/lazy',
      body: [
        'A bundler (Vite, webpack) puts all your code into one file by default, so a first visit downloads the chart library, the rich-text editor and the admin pages, used or not. **Code splitting** gives a part a file of its own, downloaded when it is first needed:',
        jsx("import { useState, lazy, Suspense } from 'react';",
            '',
            "const Chart = lazy(() => import('./Chart'));   // Chart.jsx becomes a file of its own",
            '',
            'function Report() {',
            '  const [show, setShow] = useState(false);',
            '  return (',
            '    <>',
            '      <button onClick={() => setShow(true)}>Show the chart</button>',
            '      {show && (',
            '        <Suspense fallback={<p>Loading the chart…</p>}>',
            '          <Chart />',
            '        </Suspense>',
            '      )}',
            '    </>',
            '  );',
            '}'),
        'The first time `<Chart />` renders, React calls your function, which starts the download, and the component **suspends**: React shows the nearest `<Suspense>`\'s fallback in its place, and renders the real thing once the file has arrived. `import(\'./Chart\')` must give a module whose **default** export is the component.',
        '## The rules',
        '- **Declare it once, at the top level** of the module. `lazy` inside a component makes a new component type on every render: the code is "loaded" again, and everything inside loses its state each time.\n' +
        '- **A Suspense boundary must be above it.** One boundary can wait for several lazy parts; nested boundaries let parts appear one by one.\n' +
        '- **A download can fail** (the network drops; a new deployment removed the old file): put an error boundary around it, with a "Try again" ([[lesson:r-error-boundaries]]).',
        '## Where to split',
        '| Split | Why |\n|---|---|\n' +
        '| Each route (page) | The most common and most effective: a visitor downloads only the pages they open |\n' +
        '| Heavy widgets | Charts, maps, code and rich-text editors, PDF viewers: often more code than the rest of the page |\n' +
        '| What is shown on demand | Dialogs, settings panels, admin tools |\n' +
        '| Not small components | Each file costs a request; splitting out a button saves nothing |',
        '## Smoother loading',
        '- Switching what is shown in a transition ([[lesson:r-transitions]]) keeps the old screen while the code downloads, instead of flashing the fallback.\n' +
        '- Start the download early: call the same `import(\'./Chart\')` when the pointer moves over the button; the browser keeps the file, and the click finds it ready.',
        '`Suspense` is not only for code: in React 19 a component that reads a promise with `use(promise)` suspends the same way, and frameworks load data through it. A preview here is a single file, so the challenge uses a pretend `import()`: a function that resolves with `{ default: Chart }` after a moment. The interview question is [[q:lazy-suspense]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you load code on demand with a dynamic import: `button.onclick = async () => { const { drawChart } = await import(\'./chart.js\'); drawChart(el); }`, showing a "Loading…" text yourself until it resolves. `lazy` wraps exactly that `import()`, and `Suspense` shows the loading text for you, wherever in the tree code is still on its way.',
      example: {
        code: `import { useState, lazy, Suspense } from 'react';

function Chart() {
  return <p className="chart">The chart: its code took a second to "download".</p>;
}

// a pretend import('./Chart'): it resolves with a module after a second
const LazyChart = lazy(() => {
  console.log('downloading the chart code…');
  return new Promise(resolve => setTimeout(() => resolve({ default: Chart }), 1000));
});

export default function App() {
  const [show, setShow] = useState(false);
  return (
    <div>
      <button onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'} the chart</button>
      {show && (
        <Suspense fallback={<p className="loading">Loading the chart…</p>}>
          <LazyChart />
        </Suspense>
      )}
    </div>
  );
}
`,
        css: '.chart { padding: 8px 12px; border: 1px solid #ccd; border-radius: 8px; max-width: 320px; } .loading { color: #667; }',
        note: 'Click **Show**: the fallback shows for a second while the "download" runs, and the console says so, once. Hide and show again: the chart is there at once, and nothing is downloaded again. Move the `lazy(…)` line inside `App` and try the same.'
      },
      challenge: {
        title: 'Load the chart only when asked',
        strict: true,
        task: '`Chart` is drawn straight away, so its code would be in the first download of every visit. `loadChart` is a pretend `import(\'./Chart\')`: in a real project the bundler would put `Chart` in a file of its own, and this would download it. Use it with `lazy`, so that:\n\n' +
          '- Nothing is downloaded until **Show the chart** is clicked.\n' +
          '- Meanwhile `<p className="loading">Loading the chart…</p>` shows in its place; then the chart.\n' +
          '- Hiding and showing it again shows it at once, and downloads nothing more.\n\n' +
          'Keep `loadChart` as it is: it counts its calls for the checks.',
        starter: `import { useState, lazy, Suspense } from 'react';

function Chart() {
  return (
    <figure className="chart">
      <div className="bars"><span style={{ height: 30 }} /><span style={{ height: 52 }} /><span style={{ height: 41 }} /></div>
      <figcaption>Sales, March to May</figcaption>
    </figure>
  );
}

// a pretend import('./Chart'): it "downloads" the chart's code in 0.4 seconds
window.chartLoads = 0;
function loadChart() {
  window.chartLoads++;
  return new Promise(resolve => setTimeout(() => resolve({ default: Chart }), 400));
}

export default function Report() {
  const [show, setShow] = useState(false);
  return (
    <div>
      <button className="toggle" onClick={() => setShow(!show)}>{show ? 'Hide the chart' : 'Show the chart'}</button>
      {show && <Chart />}
    </div>
  );
}
`,
        solution: `import { useState, lazy, Suspense } from 'react';

function Chart() {
  return (
    <figure className="chart">
      <div className="bars"><span style={{ height: 30 }} /><span style={{ height: 52 }} /><span style={{ height: 41 }} /></div>
      <figcaption>Sales, March to May</figcaption>
    </figure>
  );
}

// a pretend import('./Chart'): it "downloads" the chart's code in 0.4 seconds
window.chartLoads = 0;
function loadChart() {
  window.chartLoads++;
  return new Promise(resolve => setTimeout(() => resolve({ default: Chart }), 400));
}

const LazyChart = lazy(loadChart);

export default function Report() {
  const [show, setShow] = useState(false);
  return (
    <div>
      <button className="toggle" onClick={() => setShow(!show)}>{show ? 'Hide the chart' : 'Show the chart'}</button>
      {show && (
        <Suspense fallback={<p className="loading">Loading the chart…</p>}>
          <LazyChart />
        </Suspense>
      )}
    </div>
  );
}
`,
        css: '.chart { margin: 8px 0 0; } .bars { display: flex; align-items: flex-end; gap: 6px; height: 56px; } .bars span { display: block; width: 24px; background: #61dafb; border-radius: 3px 3px 0 0; } .loading { color: #667; }',
        hints: [
          'At the top level, next to `loadChart`: `const LazyChart = lazy(loadChart);`. React calls `loadChart` the first time `<LazyChart />` renders, and never again.',
          'Render `<LazyChart />` where `<Chart />` was, inside `<Suspense fallback={<p className="loading">Loading the chart…</p>}>`.',
          'Not inside `Report`: a `lazy(…)` there would be a new component on every render, and download again each time it is shown.'
        ],
        checks: [
          { label: 'Nothing is downloaded until the chart is shown', fn: `function (doc, win) {
  if (doc.querySelector('.chart')) return 'the chart shows before it was asked for';
  return win.chartLoads === 0 || 'loadChart was called ' + win.chartLoads + ' time(s) before anything was clicked';
}` },
          { label: 'Show: "Loading the chart…" first, then the chart, from one download', fn: `async function (doc, win, t) {
  await t.click('.toggle');
  if (doc.querySelector('.chart')) return 'the chart showed at once: nothing was downloaded (use lazy(loadChart))';
  if (!doc.querySelector('.loading')) return 'no .loading while the code downloads';
  for (var i = 0; i < 30 && !doc.querySelector('.chart'); i++) await t.wait(50);
  if (!doc.querySelector('.chart')) return 'no chart 1.5 seconds later';
  if (doc.querySelector('.loading')) return 'the chart shows, but so does .loading';
  return win.chartLoads === 1 || 'loadChart was called ' + win.chartLoads + ' times';
}` },
          { label: 'Hide and show again: the chart is there at once, with no second download', fn: `async function (doc, win, t) {
  await t.click('.toggle');
  await t.click('.toggle');
  if (!doc.querySelector('.chart')) return 'shown again, the chart is not there at once';
  return win.chartLoads === 1 || 'loadChart was called ' + win.chartLoads + ' times: declare the lazy component once, outside Report';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 8 */
    {
      id: 'r-long-lists', track: 'performance',
      title: 'Long lists: render only what is seen',
      summary: 'Ten thousand rows mean ten thousand DOM nodes: a slow first render, slow updates and a heavy page. Paginate, load more as the user scrolls, or virtualise: render only the rows in view (plus a few), placed in a container as tall as the whole list.',
      keywords: ['long list', 'long lists', 'virtualisation', 'virtualization', 'virtual list', 'virtual scrolling', 'windowing', 'react-window', 'tanstack virtual', 'react-virtuoso', 'infinite scroll', 'pagination', 'load more', 'overscan', 'content-visibility', 'large list'],
      docs: 'https://react.dev/learn/rendering-lists',
      body: [
        'A list of 10,000 contacts, each row a few elements, is some 40,000 DOM nodes. The first render takes long, every update compares all 10,000 rows, the browser lays them all out, and memory grows, for rows nobody is looking at. Three ways out:',
        '| Approach | How | Fits |\n|---|---|---|\n' +
        '| Pagination | 50 rows a page, with page links ([[build:pagination]]) | Tables and search results, where "page 3" means something |\n' +
        '| Load more, infinite scroll | Render 50; add 50 when the user reaches the end (an `IntersectionObserver` on the last row) | Feeds; but the DOM still grows as they scroll |\n' +
        '| Virtualisation (windowing) | Render only the rows in view, and swap them as the user scrolls | Long lists and tables that must scroll as one |',
        '## The window',
        'When every row has the same height, the arithmetic is short:',
        jsx('const ROW = 30, VIEW = 300, OVERSCAN = 5;',
            'const [scrollTop, setScrollTop] = useState(0);',
            '',
            'const first = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN);',
            'const last = Math.min(items.length - 1, Math.floor((scrollTop + VIEW) / ROW) + OVERSCAN);',
            '',
            "<div style={{ height: VIEW, overflowY: 'auto' }} onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>",
            "  <ul style={{ position: 'relative', height: items.length * ROW }}>",
            '    {items.slice(first, last + 1).map((item, i) => (',
            "      <li key={item.id} style={{ position: 'absolute', top: (first + i) * ROW, height: ROW }}>…</li>",
            '    ))}',
            '  </ul>',
            '</div>'),
        'The inner element is as tall as all the rows together, so the scrollbar is right, and each rendered row is placed where it would be. **Overscan** renders a few rows past each edge, so a fast scroll does not show blank space before React catches up. Libraries often move one inner block with `transform: translateY(…)` instead of placing each row.',
        '## In real projects',
        '- **TanStack Virtual** (`useVirtualizer`) and **react-window** do this, including rows of different heights, which they measure as they render.\n' +
        '- Give rows keys from the data and keep them cheap; `memo` on a row helps while scrolling.\n' +
        '- Rows that are not rendered cannot be found with Ctrl+F or read by a screen reader: give the list `aria-rowcount` (or `aria-setsize` and `aria-posinset` on each row), and offer a search box.\n' +
        '- For a long page of sections, CSS `content-visibility: auto` lets the browser skip laying out and painting what is off screen, while the DOM stays complete.',
        'The interview question is [[q:long-lists]], and [[build:virtual-list]] adds a selection, the arrow keys and "Go to row".'
      ].join('\n\n'),
      plainjs: 'Virtualisation started as a plain-DOM technique: one tall spacer for the scrollbar, a `scroll` listener that works out the first visible row, and a small pool of row elements moved into place and given new text. In React you render the visible slice from `scrollTop` state, and React reuses the row elements whose keys stay in view.',
      example: {
        code: `import { useState } from 'react';

const ROW = 28;
const VIEW = 168;
const OVERSCAN = 3;
const ITEMS = Array.from({ length: 5000 }, (_, i) => 'Order #' + (10001 + i));

export default function App() {
  const [scrollTop, setScrollTop] = useState(0);
  const first = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN);
  const last = Math.min(ITEMS.length - 1, Math.floor((scrollTop + VIEW) / ROW) + OVERSCAN);

  const rows = [];
  for (let i = first; i <= last; i++) {
    rows.push(<li key={ITEMS[i]} className="row" style={{ top: i * ROW }}>{ITEMS[i]}</li>);
  }

  return (
    <div>
      <p className="small">{ITEMS.length} orders · rows {first + 1} to {last + 1} are in the DOM ({rows.length} elements)</p>
      <div className="view" style={{ height: VIEW }} onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>
        <ul className="all" style={{ height: ITEMS.length * ROW }}>{rows}</ul>
      </div>
    </div>
  );
}
`,
        css: '.small { margin: 0 0 6px; color: #667; font-size: 13px; } .view { overflow-y: auto; border: 1px solid #ccd; border-radius: 8px; max-width: 280px; } .all { position: relative; margin: 0; padding: 0; list-style: none; } .row { position: absolute; left: 0; right: 0; height: 28px; line-height: 28px; padding: 0 10px; box-sizing: border-box; border-bottom: 1px solid #eef; }',
        note: 'Scroll the list and watch the line above it: about a dozen elements are in the DOM, wherever you are in the 5,000. Turn on **Highlight renders** to see the rows React draws as you scroll.'
      },
      challenge: {
        title: '10,000 contacts, a handful of rows',
        strict: true,
        task: 'The list draws all 10,000 contacts. Virtualise it, so that only the rows in view (and a few more) are in the DOM:\n\n' +
          '- Fewer than 40 rows are in the DOM, wherever the list is scrolled.\n' +
          '- The list scrolls as before: the inner `<ul className="rows">` is as tall as all the rows (10,000 × 30 px), and each row sits where it would be (`position: absolute`, `top` = its index × 30).\n' +
          '- Scrolled to 6,000 px, the row at the top is **Contact 201**; at the very bottom the last row is **Contact 10000**.\n\n' +
          'For the checks: the scrolling box is `.viewport`, each row an `<li className="row">`.',
        starter: `import { useState } from 'react';

const ROW_HEIGHT = 30;
const VIEW_HEIGHT = 150;
const CONTACTS = Array.from({ length: 10000 }, (_, i) => 'Contact ' + (i + 1));

export default function ContactList() {
  return (
    <div className="viewport" style={{ height: VIEW_HEIGHT }}>
      <ul className="rows">
        {CONTACTS.map(name => (
          <li key={name} className="row" style={{ height: ROW_HEIGHT }}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
`,
        solution: `import { useState } from 'react';

const ROW_HEIGHT = 30;
const VIEW_HEIGHT = 150;
const OVERSCAN = 4;
const CONTACTS = Array.from({ length: 10000 }, (_, i) => 'Contact ' + (i + 1));

export default function ContactList() {
  const [scrollTop, setScrollTop] = useState(0);
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(CONTACTS.length - 1, Math.floor((scrollTop + VIEW_HEIGHT) / ROW_HEIGHT) + OVERSCAN);

  const rows = [];
  for (let i = first; i <= last; i++) {
    rows.push(
      <li key={CONTACTS[i]} className="row" style={{ position: 'absolute', top: i * ROW_HEIGHT, left: 0, right: 0, height: ROW_HEIGHT }}>
        {CONTACTS[i]}
      </li>
    );
  }

  return (
    <div className="viewport" style={{ height: VIEW_HEIGHT }} onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>
      <ul className="rows" style={{ position: 'relative', height: CONTACTS.length * ROW_HEIGHT }}>
        {rows}
      </ul>
    </div>
  );
}
`,
        css: '.viewport { overflow-y: auto; border: 1px solid #ccd; border-radius: 8px; max-width: 260px; } .rows { margin: 0; padding: 0; list-style: none; } .row { box-sizing: border-box; line-height: 30px; padding: 0 10px; border-bottom: 1px solid #eef; }',
        hints: [
          'Keep `scrollTop` in state, set from the box: `onScroll={e => setScrollTop(e.currentTarget.scrollTop)}`.',
          'The first row in view is `Math.floor(scrollTop / ROW_HEIGHT)`, the last `Math.floor((scrollTop + VIEW_HEIGHT) / ROW_HEIGHT)`. Add a few on each side (overscan), within 0 and 9,999, and render only those.',
          'Make the `<ul>` as tall as the whole list, `style={{ position: \'relative\', height: CONTACTS.length * ROW_HEIGHT }}`, and place each rendered row: `style={{ position: \'absolute\', top: i * ROW_HEIGHT, left: 0, right: 0, height: ROW_HEIGHT }}`.'
        ],
        checks: [
          { label: 'Fewer than 40 rows are in the DOM', fn: `function (doc) {
  var n = doc.querySelectorAll('.row').length;
  if (n < 5) return 'only ' + n + ' rows: the box should be full';
  return n < 40 || n + ' rows are in the DOM';
}` },
          { label: 'The list is still 300,000 px tall, so the scrollbar is right', fn: `function (doc) {
  var h = doc.querySelector('.viewport').scrollHeight;
  return Math.abs(h - 300000) <= 2 || 'the box scrolls over ' + h + ' px';
}` },
          { label: 'Scrolled to 6,000 px: Contact 201 is at the top', fn: `async function (doc, win, t) {
  var v = doc.querySelector('.viewport');
  v.scrollTop = 6000;
  await t.wait(100);
  var r = v.getBoundingClientRect(), hit = doc.elementFromPoint(r.left + 20, r.top + 6), row = hit && hit.closest('.row');
  return (row && row.textContent === 'Contact 201') || 'at the top of the box is ' + (row ? row.textContent : 'no row');
}` },
          { label: 'At the very bottom: Contact 10000 is the last row', fn: `async function (doc, win, t) {
  var v = doc.querySelector('.viewport');
  v.scrollTop = v.scrollHeight;
  await t.wait(100);
  var r = v.getBoundingClientRect(), hit = doc.elementFromPoint(r.left + 20, r.bottom - 6), row = hit && hit.closest('.row');
  return (row && row.textContent === 'Contact 10000') || 'at the bottom of the box is ' + (row ? row.textContent : 'no row');
}` },
          { label: 'Back at the top: Contact 1, and still fewer than 40 rows', fn: `async function (doc, win, t) {
  var v = doc.querySelector('.viewport');
  v.scrollTop = 0;
  await t.wait(100);
  var r = v.getBoundingClientRect(), hit = doc.elementFromPoint(r.left + 20, r.top + 6), row = hit && hit.closest('.row');
  if (!row || row.textContent !== 'Contact 1') return 'at the top of the box is ' + (row ? row.textContent : 'no row');
  return doc.querySelectorAll('.row').length < 40 || doc.querySelectorAll('.row').length + ' rows are in the DOM';
}` }
        ]
      }
    }
  );
})(window.RLT);
