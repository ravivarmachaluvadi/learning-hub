/*
 * Interview Q&A: the React questions from your notes, 18_React_QA.md (java-interview-practice,
 * AAScratches/miscellaneous Interview QAs), brought in track by track. Each batch imports the
 * questions of the track it builds (tests/check_data.py's PLANNED_QUESTIONS lists which).
 *
 * Question shape: {id, track, weight: 1-3 (★: how often interviews ask it, as in the notes),
 *   q, short: the answer to give in 30 seconds (Markdown), answer: the full answer (Markdown),
 *   followups: [what the interviewer asks next], related: ['lesson:<id>', 'build:<id>'],
 *   source: '18_React_QA.md#<question number>', keywords: [..] for search}
 *
 * The answers keep the notes' substance and add what an interviewer pushes on next.
 */
(function (U) {
  var Q = U.data.questions = U.data.questions || [];
  function jsx() { return '```jsx\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q.push(
    {
      id: 'what-is-react', track: 'foundations', weight: 3, source: '18_React_QA.md#1',
      q: 'What is React, and why use it?',
      keywords: ['react', 'library', 'framework', 'why react', 'declarative', 'components'],
      short: 'A JavaScript **library** for building user interfaces out of reusable **components**. You describe what the UI should look like for the current state, UI = f(state), and when the state changes React updates the page, changing only what differs.',
      answer: [
        '**Why teams use it:**',
        '- **Components**: small, reusable, testable pieces, composed into pages.',
        '- **Declarative**: you describe the result, not the DOM steps to get there. React works out the DOM operations.',
        '- **One-way data flow**: data goes down through props, events come up through callbacks, so it is easy to trace where a value came from.',
        '- **Ecosystem**: routing, data fetching, UI kits, frameworks such as Next.js, and React Native for mobile.',
        'It is a **library, not a full framework**: it renders UI and manages component state. Routing (React Router), server data (TanStack Query) and forms (React Hook Form) come from other libraries, or from a framework built on React (Next.js, React Router\'s framework mode).',
        'A sentence that lands well: "React lets me write the UI as a function of the state; when the state changes, React re-runs that function and patches the DOM with the difference."'
      ].join('\n\n'),
      followups: [
        'Library or framework? What does React leave to other tools, and which ones fill the gap?',
        'What does "declarative" give you compared with writing DOM code by hand?',
        'What is one-way data flow, and how does a child send data back up?',
        'When would you **not** reach for React? (a mostly static page, a tiny widget on a server-rendered site)'
      ],
      related: ['lesson:r-first-component', 'lesson:r-props']
    },
    {
      id: 'jsx-compiles-to', track: 'foundations', weight: 2, source: '18_React_QA.md#3',
      q: 'What does JSX compile to?',
      keywords: ['jsx', 'babel', 'createElement', 'jsx runtime', 'compile', 'transpile'],
      short: 'JSX is syntax that a compiler (Babel, esbuild, SWC) turns into function calls, `jsx("h1", { className, children })`, each returning a plain object that **describes** an element. So JSX is just a value; expressions go in `{ }`, statements such as `if` and `for` do not.',
      answer: [
        jsx('const el = <h1 className="title">Hi {name}</h1>;',
            '',
            '// compiles (the modern JSX transform) to roughly:',
            'import { jsx } from "react/jsx-runtime";',
            'const el = jsx("h1", { className: "title", children: ["Hi ", name] });'),
        'The result is an object like `{ type: "h1", props: { className: "title", children: [...] }, key: null }`. That is why JSX can be stored in variables, returned, passed as props or put in arrays.',
        '**Before React 17** JSX compiled to `React.createElement(...)`, so every file needed `import React from "react"`. The **automatic runtime** imports `jsx` from `react/jsx-runtime` for you, which is why modern files do not import React just for JSX.',
        'Two consequences interviewers like: a component returns **one** root (one function call returns one value, hence Fragments `<>…</>`), and values in `{ }` are **escaped** text, which prevents XSS by default.'
      ].join('\n\n'),
      followups: [
        'Why did old code need `import React from "react"` in every file, and why not any more?',
        'Why must a component return a single root element?',
        'Can you write React without JSX? (yes: `createElement` calls, as JSX compiles to)',
        'Why can you not put an `if` statement inside JSX braces?'
      ],
      related: ['lesson:r-jsx']
    },
    {
      id: 'function-vs-class', track: 'foundations', weight: 2, source: '18_React_QA.md#4',
      q: 'Function components or class components?',
      keywords: ['class component', 'function component', 'hooks', 'lifecycle', 'this'],
      short: 'Function components with **hooks** are the standard: less code, no `this`, and logic shared through custom hooks. Class components are legacy; the one thing that still needs a class is an **error boundary**.',
      answer: [
        '| | Function components | Class components |\n|---|---|---|\n' +
        '| Syntax | A function returning JSX | A class with `render()` |\n' +
        '| State and side effects | Hooks (`useState`, `useEffect`) | `this.state`, lifecycle methods |\n' +
        '| `this` | None | Needed everywhere (binding bugs) |\n' +
        '| Status | The standard for new code | Legacy; still needed for error boundaries |',
        jsx('class Counter extends React.Component {',
            '  state = { count: 0 };',
            '  render() {',
            '    return <button onClick={() => this.setState({ count: this.state.count + 1 })}>{this.state.count}</button>;',
            '  }',
            '}',
            '',
            'function Counter() {',
            '  const [count, setCount] = useState(0);',
            '  return <button onClick={() => setCount(count + 1)}>{count}</button>;',
            '}'),
        'Hooks (React 16.8) gave function components everything classes had. They also fixed real problems: related logic scattered across `componentDidMount` / `componentDidUpdate` / `componentWillUnmount`, "wrapper hell" from higher-order components and render props, and `this` binding bugs.'
      ].join('\n\n'),
      followups: [
        'Which class lifecycle methods does `useEffect` replace?',
        'Why do error boundaries still need a class?',
        'What problems did hooks solve?',
        'Would you rewrite a working class component? (usually not, unless you are changing it anyway)'
      ],
      related: ['lesson:r-first-component', 'lesson:r-state-basics']
    },
    {
      id: 'props-vs-state', track: 'foundations', weight: 3, source: '18_React_QA.md#5',
      q: 'Props vs state',
      keywords: ['props', 'state', 'difference', 'read-only', 'useState', 'data flow'],
      short: 'Props are inputs a component **receives** from its parent and must not change; state is data a component **owns** and changes through its setter. A change to either re-renders it, and one component\'s state is often its child\'s prop.',
      answer: [
        '| | Props | State |\n|---|---|---|\n' +
        '| Comes from | The parent | The component itself (`useState`) |\n' +
        '| Can the component change it? | **No**, read-only | Yes, through its setter |\n' +
        '| A change re-renders | When the parent passes new props | Yes |\n' +
        '| Like | Function arguments | Local variables that survive between renders |',
        jsx('function Parent() {',
            "  const [name, setName] = useState('Asha');     // state here…",
            '  return <Greeting name={name} />;              // …is a prop here',
            '}'),
        'A third category is worth naming: **derived values**, computed from props or state during render (a total, a filtered list). They are neither: do not store them, compute them, or they drift out of sync.'
      ].join('\n\n'),
      followups: [
        'Two sibling components need the same value. Where does it live? (lift it to their closest common parent)',
        'What goes wrong with `useState(props.value)`? (later changes of the prop are ignored)',
        'What is derived state, and why not keep it in state?',
        'Can a child change its parent\'s state? (only by calling a function the parent passed down)'
      ],
      related: ['lesson:r-props', 'lesson:r-state-basics']
    },
    {
      id: 'keys', track: 'foundations', weight: 3, source: '18_React_QA.md#6',
      q: 'Why do lists need keys, and why not the index?',
      keywords: ['key', 'keys', 'list', 'index', 'reconciliation', 'map'],
      short: 'Keys tell React **which list item is which** between renders, so it keeps, moves or removes the right element and its state. The index changes when items are inserted, removed or reordered, so React matches the wrong elements: use a stable id from the data.',
      answer: [
        jsx('{todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}      // ✅ stable id',
            '{todos.map((todo, i) => <TodoItem key={i} todo={todo} />)}       // ❌ if the order can change'),
        '**What goes wrong with the index:** delete the first todo and every later todo\'s index drops by one. React sees key 0 still there and reuses its element for what is now the old second item, so text typed into an input or a ticked checkbox appears on the wrong row, and more DOM work is done than needed.',
        'The index is acceptable only for a static list that never reorders, filters or inserts. Keys must be unique **among siblings**, not across the page, and stable: never `Math.random()`, which gives a new element on every render.',
        '**A bonus that impresses:** a key can reset a component on purpose. `<ProfileForm key={userId} />` throws the form\'s state away and starts fresh whenever `userId` changes.'
      ].join('\n\n'),
      followups: [
        'When is the index acceptable as a key?',
        'What happens with `key={Math.random()}`?',
        'How can a key reset a component\'s state on purpose?',
        'Must keys be unique across the whole page?'
      ],
      related: ['lesson:r-lists-keys', 'lesson:r-reconciliation', 'explain:keys-reconciliation']
    },
    {
      id: 'synthetic-events', track: 'foundations', weight: 1, source: '18_React_QA.md#36',
      q: 'What are synthetic events?',
      keywords: ['synthetic event', 'event', 'nativeEvent', 'delegation', 'event pooling', 'onClick'],
      short: 'React passes handlers a **SyntheticEvent**: a wrapper around the browser event with the same interface (`target`, `preventDefault`, `stopPropagation`) that behaves the same on every browser. React listens at the root of your app and calls your handlers; the original is `e.nativeEvent`.',
      answer: [
        'React does not add a listener to every button. It attaches one listener per event type to the **root container** of your app (since React 17; before that, to `document`) and dispatches to the right handlers itself: event delegation, done for you.',
        'Moving the listeners from `document` to the root made it possible to run two React versions on one page, and to mix React with other code that stops propagation at `document`.',
        '**Event pooling is gone:** before React 17 the event object was reused after the handler returned, so reading `e.target` in a `setTimeout` gave `null` unless you called `e.persist()`. Since React 17 that is not needed.',
        jsx('<form onSubmit={e => { e.preventDefault(); save(); }}>',
            '<input onKeyDown={e => console.log(e.key, e.nativeEvent)} />')
      ].join('\n\n'),
      followups: [
        'What changed in React 17 about where listeners are attached, and why did it matter?',
        'Is `e.persist()` still needed?',
        'How do you stop an event from reaching a parent\'s handler?',
        'Why is `onClick={handle()}` a bug?'
      ],
      related: ['lesson:r-events']
    },
    {
      id: 'security', track: 'foundations', weight: 2, source: '18_React_QA.md#37',
      q: 'How do you keep a React app secure?',
      keywords: ['security', 'xss', 'dangerouslySetInnerHTML', 'escape', 'sanitize', 'DOMPurify', 'token', 'localStorage'],
      short: 'React escapes everything in JSX, so `{userInput}` shows as text and an injected `<script>` never runs. The holes are the ones you open: `dangerouslySetInnerHTML` without sanitising, `javascript:` URLs in `href`, tokens in localStorage, and secrets shipped in front-end code.',
      answer: [
        '- **Escaping:** values in `{ }` become text nodes, never HTML.',
        '- **`dangerouslySetInnerHTML`** bypasses that. Use it only with HTML you have sanitised, for example with DOMPurify.',
        '- **URLs:** a user-supplied `href` such as `javascript:alert(1)` runs code when clicked. Allow only `http:` and `https:`. React has warned about `javascript:` URLs in development since 16.9; do not rely on that, validate.',
        '- **Tokens:** an auth token in localStorage can be read by any script an XSS bug lets in. Prefer an `HttpOnly` cookie, which JavaScript cannot read.',
        '- **Secrets:** anything bundled for the browser is public, including build-time environment variables (`VITE_…`, `NEXT_PUBLIC_…`). Keep API keys on the server.',
        '- **Dependencies:** keep them updated (`npm audit`); supply-chain attacks target front-end packages.',
        jsx("import DOMPurify from 'dompurify';",
            '',
            'function Comment({ html }) {',
            '  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;',
            '}')
      ].join('\n\n'),
      followups: [
        'When would you use `dangerouslySetInnerHTML`, and how do you make it safe?',
        'Why is a user-supplied `href` dangerous?',
        'Where should an auth token live, and why?',
        'An API key in a `.env` file used by a Vite app: is it secret?'
      ],
      related: ['lesson:r-jsx']
    }
  );
})(window.RLT);
