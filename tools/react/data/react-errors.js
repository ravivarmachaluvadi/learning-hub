/*
 * React's error messages and warnings, explained in plain words: the console under every preview
 * adds "What this means" under a message that matches (RLT.explainError, js/preview.js).
 *
 * Entry shape: {id, match (a JavaScript regex, case-insensitive; its first group, if any, is
 *   {name} in the text), says (Markdown), apiSays? (used instead when {name} is a React API from
 *   data/api.js; {module} is its module), lesson? and/or docs (react.dev), example (a component
 *   that really produces the message)}
 *
 * The first entry that matches wins, so the specific ones come before the general ones.
 * tests/test_ui.py ("errors") runs every example and checks its explanation appears, which proves
 * each regex matches what React 19.3 really says; tests/check_data.py checks the fields and links.
 */
(function (U) {
  var R = 'https://react.dev/';

  U.data.reactErrors = [
    { id: 'too-many-renders', match: 'Too many re-renders', lesson: 'r-events',
      says: 'React stopped an endless loop: setting state **while rendering** asks for another render, which sets it again. The usual cause is calling a function instead of passing it: `onClick={setCount(1)}` runs as the component draws. Write `onClick={() => setCount(1)}`.',
      example: "import { useState } from 'react';\n\nexport default function App() {\n  const [n, setN] = useState(0);\n  return <button onClick={setN(n + 1)}>{n}</button>;\n}\n" },
    { id: 'object-child', match: 'Objects are not valid as a React child', lesson: 'r-jsx',
      says: 'JSX can show text, numbers, elements and arrays of them, but not a plain object. Show one of its fields (`{user.name}`) or turn it into text (`{JSON.stringify(user)}`); a date needs `.toLocaleDateString()`.',
      example: "export default function App() {\n  const user = { name: 'Asha' };\n  return <p>{user}</p>;\n}\n" },
    { id: 'function-child', match: 'Functions are not valid as a React child', lesson: 'r-first-component',
      says: 'A function sits where JSX expects something to show: usually `{Card}` where you meant `<Card />`, or `{getLabel}` where you meant `{getLabel()}`.',
      example: "function Card() {\n  return <p>card</p>;\n}\n\nexport default function App() {\n  return <div>{Card}</div>;\n}\n" },
    { id: 'missing-key', match: 'Each child in a list should have a unique "key" prop', lesson: 'r-lists-keys',
      says: 'Give the element that `.map()` returns a `key` from the data: `<li key={item.id}>`. React uses it to tell the items apart when the list changes; the index works only for a list that never reorders or shrinks.',
      example: "export default function App() {\n  const items = ['tea', 'coffee'];\n  return <ul>{items.map(item => <li>{item}</li>)}</ul>;\n}\n" },
    { id: 'invalid-hook-call', match: 'Invalid hook call', lesson: 'r-rules-of-hooks', docs: R + 'reference/rules/rules-of-hooks',
      says: 'A hook (`useState`, `useEffect`…) ran somewhere React was not drawing a component: an event handler, an effect, or a plain function. Call hooks only at the top level of a component, or of your own `use…` hook.',
      example: "import { useState, useEffect } from 'react';\n\nexport default function App() {\n  useEffect(() => {\n    useState(0);\n  }, []);\n  return <p>hello</p>;\n}\n" },
    { id: 'hooks-order', match: 'Rendered (?:more|fewer) hooks than|change in the order of Hooks', lesson: 'r-rules-of-hooks', docs: R + 'reference/rules/rules-of-hooks',
      says: 'This render called a different number of hooks from the last one: a hook inside an `if`, a loop, or after an early `return`. React tells hooks apart by their order, so call every hook on every render, at the top of the component.',
      example: "import { useState, useEffect } from 'react';\n\nexport default function App() {\n  const [ready, setReady] = useState(false);\n  useEffect(() => {\n    setReady(true);\n  }, []);\n  if (ready) {\n    const [extra] = useState(1);\n  }\n  return <p>{String(ready)}</p>;\n}\n" },
    { id: 'update-while-rendering', match: 'Cannot update a component .* while rendering a different component', lesson: 'r-events',
      says: 'A child called its parent\'s state setter **while rendering**: `onPick(1)` in its body, or `onClick={onPick(1)}`. Call it from an event handler, `onClick={() => onPick(1)}`, or from an effect if it must follow a render.',
      example: "import { useState } from 'react';\n\nfunction Child({ onPick }) {\n  onPick(1);\n  return <p>child</p>;\n}\n\nexport default function App() {\n  const [n, setN] = useState(0);\n  return <div><Child onPick={setN} />{n}</div>;\n}\n" },
    { id: 'max-depth', match: 'Maximum update depth exceeded', lesson: 'r-effect-deps', docs: R + 'reference/react/useEffect#my-effect-runs-after-every-re-render',
      says: 'State kept changing in a loop: usually an effect with no dependency list that sets state, so every render starts the next one. Give the effect its dependencies, and set state only when the value really changes.',
      example: "import { useState, useLayoutEffect } from 'react';\n\nexport default function App() {\n  const [n, setN] = useState(0);\n  useLayoutEffect(() => {\n    setN(n + 1);\n  });\n  return <p>{n}</p>;\n}\n" },
    { id: 'element-type-invalid', match: 'Element type is invalid', lesson: 'r-first-component',
      says: 'You drew something that is not a component, so it is `undefined`: usually an import that does not match the export (`import Card from` a file with `export function Card`, or the other way round), or a misspelt name.',
      example: "const Card = undefined;\n\nexport default function App() {\n  return <Card />;\n}\n" },
    { id: 'invalid-dom-prop', match: 'Invalid DOM property `(\\w+)`', lesson: 'r-jsx',
      says: 'JSX writes some attributes by their JavaScript names: `className` for `class`, `htmlFor` for `for`, `tabIndex` for `tabindex`. The message says which one to use.',
      example: "export default function App() {\n  return <div class=\"box\">hello</div>;\n}\n" },
    { id: 'uncontrolled-to-controlled', match: 'changing an uncontrolled input to be controlled', lesson: 'r-forms', docs: R + 'reference/react-dom/components/input#controlling-an-input-with-a-state-variable',
      says: 'The input\'s `value` started as `undefined` (React leaves it alone: uncontrolled), then got a value (React controls it). Start the state with a real value: `useState(\'\')`, not `useState()`.',
      example: "import { useState, useEffect } from 'react';\n\nexport default function App() {\n  const [text, setText] = useState();\n  useEffect(() => {\n    setText('hello');\n  }, []);\n  return <input value={text} onChange={e => setText(e.target.value)} />;\n}\n" },
    { id: 'value-without-onchange', match: 'You provided a `value` prop to a form field without an `onChange` handler', lesson: 'r-forms', docs: R + 'reference/react-dom/components/input#controlling-an-input-with-a-state-variable',
      says: 'An input with `value` but no `onChange` is read-only: React keeps putting the value back. Add `onChange={e => setValue(e.target.value)}`, or use `defaultValue` for a field React does not need to control.',
      example: "export default function App() {\n  return <input value=\"fixed\" />;\n}\n" },
    { id: 'optimistic-outside-action', match: 'optimistic state update occurred outside a transition or action', lesson: 'r-use-optimistic',
      says: 'An optimistic update belongs inside an Action: a form action, or `startTransition(async () => { … })`. Called anywhere else, React reports it, and on its own it shows nothing. Move the call into the action, before its `await`.',
      example: "import { useState, useOptimistic, useEffect } from 'react';\n\nexport default function App() {\n  const [likes] = useState(0);\n  const [shown, addShown] = useOptimistic(likes, (n, change) => n + change);\n  useEffect(() => { addShown(1); }, []);\n  return <p>{shown} likes</p>;\n}\n" },
    { id: 'hydration-mismatch', match: 'Hydration failed because', lesson: 'r-rendering-strategies',
      says: 'The browser\'s first render differed from the HTML the server sent, so React threw that HTML away and drew the part afresh. The `+` and `-` lines show what differed: usually something rendered from the clock, `Math.random()`, `window` or the user\'s locale. Render the server\'s value first, and the browser\'s after hydration, in an effect.',
      example: "import { hydrateRoot } from 'react-dom/client';\n\nconst container = document.getElementById('root');\ncontainer.innerHTML = '<p>Rendered at 10:00:00</p>';\n\nfunction App() {\n  return <p>{'Rendered at ' + new Date().toLocaleTimeString('en-GB')}</p>;\n}\n\nhydrateRoot(container, <App />);\n" },
    { id: 'async-client-component', match: 'is an async Client Component', lesson: 'r-server-components',
      says: 'Only Server Components may be `async`: a component that runs in the browser cannot `await` while it renders. Fetch in a Server Component (or a framework\'s loader) and pass the data down, or read a promise with `use()` inside `<Suspense>`.',
      example: "import { Suspense } from 'react';\n\nasync function Profile() {\n  const user = await new Promise(resolve => setTimeout(() => resolve({ name: 'Ada' }), 100));\n  return <p>{user.name}</p>;\n}\n\nexport default function App() {\n  return <Suspense fallback={<p>Loading…</p>}><Profile /></Suspense>;\n}\n" },
    { id: 'null-property', match: 'Cannot read properties of (?:null|undefined)', lesson: 'r-conditional',
      says: 'The code read a field of something that is `null` or `undefined`: often data that has not arrived yet, or a prop nobody passed. Draw a placeholder until it exists (`if (!user) return <p>Loading…</p>;`), or write `user?.name`.',
      example: "export default function App() {\n  const user = null;\n  return <p>{user.name}</p>;\n}\n" },
    { id: 'not-a-function', match: '([\\w$.]+) is not a function', docs: R + 'learn/rendering-lists',
      says: '`{name}` was called, but it is not a function. With `.map is not a function` the value is not an array (an object, or `undefined` before the data arrives); with a setter, check the order in `const [value, setValue] = useState()`.',
      example: "export default function App() {\n  const items = { first: 'tea' };\n  return <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>;\n}\n" },
    { id: 'not-defined', match: '([\\w$]+) is not defined', docs: R + 'learn/importing-and-exporting-components',
      says: '`{name}` is used but never declared in this file: check its spelling and its capital letters, or declare it.',
      apiSays: '`{name}` is React\'s, and this file does not import it. Add it at the top: `import { {name} } from \'{module}\'`. (Pick it from autocomplete and the import is added for you.)',
      example: "export default function App() {\n  const message = 'hello';\n  return <p>{mesage}</p>;\n}\n" }
  ];
})(window.RLT);
