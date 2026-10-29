/*
 * Interview Q&A: the ★★★ fast track (batch 2). 18_React_QA.md marks 21 questions as asked in almost
 * every React round; Foundations and State and forms bring six of them, and this file brings the
 * other fifteen early, as flashcards, before their tracks' lessons exist. Each keeps its own track,
 * so the list filters by track; `related` names only lessons that exist, and the batch that builds a
 * track adds its lessons' links (ROADMAP.md): batch 3 linked the Effects and refs questions (10, 11,
 * 19, 20, 25, 41), batch 4 those of Composition (16, 29) and Performance (2, 14, 31, 40), batch 5
 * those of React 19 (26, 28, and 42, whose predictions the testing lesson teaches you to prove).
 * tests/check_data.py's FAST_TRACK lists them, and requires that link once a track is built.
 * The question shape is described at the top of data/interview.js.
 */
(function (U) {
  var Q = U.data.questions = U.data.questions || [];
  function jsx() { return '```jsx\n' + [].slice.call(arguments).join('\n') + '\n```'; }
  function js() { return '```js\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q.push(
    {
      id: 'virtual-dom', track: 'performance', weight: 3, source: '18_React_QA.md#2',
      q: 'What are the virtual DOM and reconciliation?',
      keywords: ['virtual dom', 'vdom', 'reconciliation', 'diffing', 'diff', 'fiber', 'render phase', 'commit phase', 'react elements'],
      short: 'Components return a **description** of the UI: plain objects, often called the virtual DOM. On a state change React renders the affected components again, **compares** the new tree with the previous one (reconciliation, or "diffing"), and applies only the differences to the real DOM, which is the slow part.',
      answer: [
        '**Three phases:** React calls your components to get a new tree of elements (**render**), compares it with the previous tree (**reconciliation**), and applies the changes to the DOM, then runs effects (**commit**). Only the commit touches the page.',
        '**How the comparison stays fast.** Comparing two arbitrary trees perfectly is very slow, so React uses rules that work for real UIs:',
        '- An element of a **different type** (`<div>` → `<section>`, `ProfileCard` → `LoginForm`) is torn down and rebuilt, **including its state**.',
        '- The **same type** in the same place is updated in place: changed attributes are patched; a component renders again with its new props and keeps its state.',
        '- In lists, **keys** match items between renders ([[q:keys]]).',
        jsx('{isAdmin ? <div><Editor /></div> : <section><Editor /></section>}',
            '// switching loses Editor\'s state: its parent changed type, so the whole subtree is rebuilt'),
        '**The precise follow-up:** the virtual DOM is not "faster than the DOM" by magic. Hand-written, exact DOM updates are faster. What it gives you is the declarative model (describe the result, React works out the steps) at a cost that is low enough, with the necessary DOM work batched. Svelte and SolidJS compile components to direct DOM updates and have no virtual DOM.',
        '**Fiber:** since React 16 the reconciler splits rendering into small units of work that can be paused and resumed. That made concurrent features such as transitions possible.'
      ].join('\n\n'),
      followups: [
        'Is the virtual DOM faster than the real DOM?',
        'A component\'s parent changes from `<div>` to `<section>`. What happens to the component\'s state?',
        'What is Fiber, and what did it make possible?',
        'What happens in the render phase, and what in the commit phase?',
        'How do Svelte and SolidJS manage without a virtual DOM?'
      ],
      related: ['lesson:r-reconciliation', 'explain:keys-reconciliation', 'lesson:r-rendering', 'lesson:r-lists-keys']
    },
    {
      id: 'use-effect', track: 'effects', weight: 3, source: '18_React_QA.md#10',
      q: 'How does useEffect work?',
      keywords: ['useEffect', 'effect', 'side effect', 'cleanup', 'dependencies', 'dependency array', 'componentDidMount', 'subscribe', 'synchronise', 'synchronize'],
      short: '`useEffect` **synchronises** a component with something outside React: a subscription, a timer, the network, a browser API. It runs **after** React has updated the DOM and the browser has painted. The dependency array decides when it runs again, and the function it returns (the cleanup) undoes it before the next run and when the component goes away.',
      answer: [
        jsx('useEffect(() => {',
            '  const socket = connect(roomId);       // set up',
            '  return () => socket.disconnect();     // clean up',
            '}, [roomId]);                           // dependencies'),
        '| Dependencies | When the effect runs |\n|---|---|\n' +
        '| `[a, b]` | After the first render, and after any render where `a` or `b` changed |\n' +
        '| `[]` | Once, after the first render |\n' +
        '| None | After every render |',
        '**Order:** React renders, updates the DOM, the browser paints, **then** the effect runs. When `roomId` changes, the cleanup runs first, with the **old** `roomId` it captured, then the effect runs with the new one. On unmount, only the cleanup runs.',
        '**Think of it as** "keep this in sync with these values", not "run this on mount". Every value from the component that the effect reads belongs in the array; the `react-hooks/exhaustive-deps` lint rule checks it.',
        '**What is not an effect:** data you can work out from props or state (compute it while rendering), and responses to a user action (do them in the event handler). Data fetching works in an effect if you guard against races, but frameworks and TanStack Query do it better, with caching.'
      ].join('\n\n'),
      followups: [
        'When exactly does the cleanup run, and with which values?',
        'What is the difference between no array, `[]` and `[a, b]`?',
        'Why does my effect run twice in development?',
        'Name two things that should not be effects.',
        'How do you fetch in an effect without a race condition?'
      ],
      related: ['lesson:r-effects', 'lesson:r-effect-cleanup', 'lesson:r-effect-deps', 'explain:effect-timeline']
    },
    {
      id: 'effect-mistakes', track: 'effects', weight: 3, source: '18_React_QA.md#11',
      q: 'What are the common useEffect mistakes?',
      keywords: ['useEffect mistakes', 'infinite loop', 'missing dependencies', 'exhaustive-deps', 'race condition', 'AbortController', 'cleanup', 'stale', 'you might not need an effect', 'useEffectEvent'],
      short: 'Missing dependencies (the effect uses stale values); setting state the effect depends on (an endless loop); objects or functions made during render as dependencies (it runs every render); no cleanup (leaks, duplicate handlers); fetching without cancelling (a slow old answer overwrites a new one); and effects that should not exist at all.',
      answer: [
        '| Mistake | What goes wrong | Fix |\n|---|---|---|\n' +
        '| Missing dependencies | The effect uses stale values | List every value it reads (the lint rule tells you) |\n' +
        '| Setting state that is also a dependency | An endless render loop | An updater function, or rethink the dependency |\n' +
        '| An object or function made during render as a dependency | Runs after every render (a new reference each time) | Create it inside the effect, `useMemo` / `useCallback`, or the React Compiler |\n' +
        '| No cleanup for a subscription or timer | Leaks; handlers pile up | Return a cleanup function |\n' +
        '| Fetching without cancelling | A slow old response overwrites a newer one | An `ignore` flag in the cleanup, or `AbortController` |\n' +
        '| An effect that computes data from props or state | An extra render, values out of step | Compute it during render |\n' +
        '| An effect that responds to a click | Logic that is hard to follow | Put it in the event handler |',
        '**The race, fixed:**',
        jsx('useEffect(() => {',
            '  let ignore = false;',
            "  fetch('/api/users/' + id).then(r => r.json()).then(user => {",
            '    if (!ignore) setUser(user);         // an answer for an old id is dropped',
            '  });',
            '  return () => { ignore = true; };',
            '}, [id]);'),
        '**The effect that should not exist:**',
        jsx("const [fullName, setFullName] = useState('');",
            "useEffect(() => { setFullName(first + ' ' + last); }, [first, last]);   // ❌ an extra render",
            '',
            "const fullName = first + ' ' + last;                                       // ✅ computed"),
        'To read the latest props or state inside an effect **without** making them dependencies, React 19.2 adds `useEffectEvent`.'
      ].join('\n\n'),
      followups: [
        'The lint rule says a dependency is missing, but adding it causes a loop. What now?',
        'Why does an object literal in the dependency array make the effect run every render?',
        'Show how a slow, older request can overwrite a newer one, and fix it.',
        'When is an effect the wrong tool?',
        'What is `useEffectEvent` for?'
      ],
      related: ['lesson:r-effect-deps', 'lesson:r-fetching', 'lesson:r-effect-cleanup', 'explain:stale-closure']
    },
    {
      id: 'memo-usememo-usecallback', track: 'performance', weight: 3, source: '18_React_QA.md#14',
      q: 'useMemo vs useCallback vs React.memo',
      keywords: ['useMemo', 'useCallback', 'memo', 'React.memo', 'memoization', 'memoisation', 'referential equality', 'shallow comparison', 'react compiler', 'performance'],
      short: '`useMemo` caches a **computed value**, `useCallback` caches a **function** (the same reference between renders), and `memo(Component)` skips re-rendering a component when its props are shallowly equal. They work as a team: `memo` only helps if the props really stay the same, so the objects and callbacks passed to it are memoised. Measure first; with the React Compiler most of this is automatic.',
      answer: [
        '| | Caches | Returns | Typical use |\n|---|---|---|---|\n' +
        '| `useMemo(() => compute(a), [a])` | A computed value | The value | Expensive calculations; stable objects passed as props |\n' +
        '| `useCallback(fn, [deps])` | A function | The same function reference | Callbacks for memoised children, or used as effect dependencies |\n' +
        '| `memo(Component)` | A component\'s render | A memoised component | Skip re-rendering when the props are unchanged (shallow comparison) |',
        jsx('const Row = memo(function Row({ item, onSelect }) { /* … */ });',
            '',
            'function List({ items, query }) {',
            '  const visible = useMemo(() => items.filter(i => i.name.includes(query)), [items, query]);',
            '  const handleSelect = useCallback(id => setSelected(id), []);',
            '  return visible.map(i => <Row key={i.id} item={i} onSelect={handleSelect} />);',
            '}'),
        'Without `useCallback`, `onSelect={id => setSelected(id)}` is a new function on every render, so every `Row` sees a changed prop and `memo` does nothing. `useCallback(fn, deps)` is simply `useMemo(() => fn, deps)`.',
        '**Do not sprinkle them everywhere.** Each one costs memory and a comparison, and makes the code harder to read. Use the React DevTools Profiler to find a real problem first. **React Compiler 1.0** (October 2025) adds this memoisation at build time, so new code with the compiler on rarely needs any of the three by hand.'
      ].join('\n\n'),
      followups: [
        'Why does `memo(Child)` not help when the parent passes `onClick={() => …}`?',
        'Is `useCallback` useful without `memo` or an effect dependency?',
        'What does "shallow comparison" compare?',
        'What changes when the React Compiler is on?'
      ],
      related: ['lesson:r-memo', 'lesson:r-usememo-usecallback', 'lesson:r-react-compiler']
    },
    {
      id: 'context', track: 'composition', weight: 3, source: '18_React_QA.md#16',
      q: 'What is the Context API, and when should you not use it?',
      keywords: ['context', 'useContext', 'createContext', 'provider', 'prop drilling', 'global state', 'theme', 'auth context', 'use'],
      short: 'Context passes a value to every component below a provider without threading it through props. It suits data needed widely that changes rarely: the current user, the theme, the language. It is not ideal for fast-changing data (every consumer re-renders when the value changes), for server data (TanStack Query), or for a large, busy global store (Zustand, Redux).',
      answer: [
        jsx('const AuthContext = createContext(null);',
            '',
            'function App() {',
            '  const [user, setUser] = useState(null);',
            '  const value = useMemo(() => ({ user, setUser }), [user]);',
            '  // React 19: the context is its own provider; before, <AuthContext.Provider value={…}>',
            '  return (',
            '    <AuthContext value={value}>',
            '      <Layout />',
            '    </AuthContext>',
            '  );',
            '}',
            '',
            'function Avatar() {',
            '  const { user } = useContext(AuthContext);',
            '  return <img src={user?.photo} alt="" />;',
            '}'),
        '**Good for:** data many components need that changes rarely: the current user, the theme, the language, feature flags.',
        '**Not ideal for:**',
        '- **Fast-changing data:** every component that reads the context re-renders when its value changes, even if it uses only one field.',
        '- **Server data:** use TanStack Query, which caches, refetches and deduplicates.',
        '- **A large global state with many updates:** a store such as Zustand or Redux lets each component subscribe to just the slice it needs.',
        '**If you do use it:** split contexts by concern (auth apart from theme), and memoise the value object, as above. `value={{ user, setUser }}` is a new object on every render of `App`, which re-renders every consumer. In React 19, `use(AuthContext)` also reads a context, and unlike `useContext` it may be called inside a condition.'
      ].join('\n\n'),
      followups: [
        'Every consumer re-renders when the value changes. How do you limit that?',
        'Why is `value={{ user, setUser }}` a problem, and how do you fix it?',
        'Context, or Redux / Zustand?',
        'What happens when no provider is above a component that reads the context?',
        'What does `use(MyContext)` add in React 19?'
      ],
      related: ['lesson:r-context', 'lesson:r-context-reducer', 'lesson:r-composition', 'lesson:r-use']
    },
    {
      id: 'custom-hooks', track: 'effects', weight: 3, source: '18_React_QA.md#19',
      q: 'What are custom hooks?',
      keywords: ['custom hook', 'custom hooks', 'use prefix', 'reuse logic', 'useFetch', 'useDebounce', 'useLocalStorage', 'useWindowWidth', 'renderHook'],
      short: 'A custom hook is a function whose name starts with `use` and that calls other hooks. It extracts **stateful logic** so several components can reuse it. It shares the logic, not the state: each component that calls it gets its own state.',
      answer: [
        jsx('function useWindowWidth() {',
            '  const [width, setWidth] = useState(window.innerWidth);',
            '  useEffect(() => {',
            '    const onResize = () => setWidth(window.innerWidth);',
            "    window.addEventListener('resize', onResize);",
            "    return () => window.removeEventListener('resize', onResize);",
            '  }, []);',
            '  return width;',
            '}',
            '',
            'function Header() {',
            '  const width = useWindowWidth();',
            '  return width < 600 ? <MobileNav /> : <DesktopNav />;',
            '}'),
        '**The key point:** hooks share **logic**, not **state**. Two components calling `useWindowWidth()` each get their own `width` state and their own listener. To share one value, lift it up or use context.',
        '**The `use` prefix is not decoration.** It tells React\'s lint rules (and the React Compiler) that the function follows the rules of hooks, so it is checked like a component. A helper that calls no hooks should not start with `use`.',
        '**Common examples:** `useFetch`, `useDebounce`, `useLocalStorage`, `useAuth`, `useMediaQuery`, `useToggle`. Return whatever reads best: a value, a pair like `useState` (`[on, toggle]`), or an object when there are several things. Test one with `renderHook` from React Testing Library.'
      ].join('\n\n'),
      followups: [
        'Two components call `useWindowWidth()`. Do they share one `width`?',
        'Why must a custom hook\'s name start with `use`?',
        'Should a custom hook return an array or an object?',
        'Write `useDebounce(value, delay)`.',
        'How do you test a custom hook?'
      ],
      related: ['lesson:r-custom-hooks', 'build:autocomplete']
    },
    {
      id: 'rules-of-hooks', track: 'effects', weight: 3, source: '18_React_QA.md#20',
      q: 'What are the rules of hooks, and why do they exist?',
      keywords: ['rules of hooks', 'hooks rules', 'top level', 'conditional hook', 'hook order', 'eslint-plugin-react-hooks', 'invalid hook call', 'rendered fewer hooks'],
      short: '1. Call hooks only at the **top level**: never inside conditions, loops or nested functions, or after an early `return`. 2. Call them only from function components or custom hooks. React keeps each component\'s hook state in a list and matches every call to its slot **by order**, so a call skipped in one render shifts every later hook onto the wrong state.',
      answer: [
        jsx('if (isLoggedIn) {',
            '  const [cart, setCart] = useState([]);   // ❌ some renders skip it',
            '}',
            '',
            'const [cart, setCart] = useState([]);     // ✅ always called; use the condition below'),
        '**Why order matters, step by step.** Render 1 calls `useState(\'Asha\')` then `useState(30)`: slot 1 holds the name, slot 2 the age. If render 2 skips the first call, `useState(30)` is now the first call and reads slot 1, the name. Every hook after the skipped one is off by one. React notices the count changed and throws "Rendered fewer hooks than expected".',
        '**Making a hook conditional, the right way:** call it every time and put the condition inside it (`useEffect(() => { if (!enabled) return; … })`), or move it into a child component that is itself rendered only when needed.',
        '`eslint-plugin-react-hooks` enforces both rules, and the editor here warns about a hook inside an `if`. The one exception is React 19\'s `use()`, which may be called conditionally.'
      ].join('\n\n'),
      followups: [
        'Walk through what goes wrong when one render skips a hook.',
        'How do you use a hook only when a condition is true?',
        'Which hook may be called conditionally?',
        'What error appears when a render calls fewer hooks than the one before?'
      ],
      related: ['lesson:r-rules-of-hooks', 'lesson:r-state-basics', 'lesson:r-use']
    },
    {
      id: 'effects-twice', track: 'effects', weight: 3, source: '18_React_QA.md#25',
      q: 'Why do my effects run twice?',
      keywords: ['strictmode', 'strict mode', 'effect runs twice', 'useEffect twice', 'double render', 'development', 'cleanup', 'idempotent'],
      short: 'In **development**, with `<StrictMode>` (on by default in new projects), React deliberately renders components twice and runs effects **mount → cleanup → mount**, to expose impure rendering and missing cleanups. **Production runs everything once.** If the double run causes a bug, the effect lacks a cleanup or is not idempotent: fix that, rather than removing StrictMode.',
      answer: [
        jsx("import { StrictMode } from 'react';",
            "import { createRoot } from 'react-dom/client';",
            '',
            "createRoot(document.getElementById('root')).render(",
            '  <StrictMode>',
            '    <App />',
            '  </StrictMode>',
            ');'),
        '**What it catches:** an effect that opens a connection and never closes it shows **two** open connections in development. In production the same bug appears later, when the component unmounts and mounts again (navigating away and back). StrictMode simulates that at once.',
        '| Symptom in development | The real problem | Fix |\n|---|---|---|\n' +
        '| Two subscriptions or listeners | No cleanup | Return a cleanup that unsubscribes |\n' +
        '| Two fetches | Not wrong by itself | Ignore the stale one (an `ignore` flag), or let a data library cache |\n' +
        '| Two analytics events | Usually harmless in development | Leave it, or send it from the event that caused it |\n' +
        '| "Initialise once" code runs twice | It belongs outside React | Run it at module level, before `createRoot` |',
        'Besides effects, StrictMode in development also calls component bodies, state initialisers and updater functions twice, and in React 19 ref callbacks too. That is why they must be pure: running them twice must give the same result.'
      ].join('\n\n'),
      followups: [
        'Does StrictMode change anything in production?',
        'My effect opens a WebSocket; in development there are two. What is wrong?',
        'How do you run something exactly once when the app starts?',
        'What else does StrictMode run twice?'
      ],
      related: ['lesson:r-effect-cleanup', 'explain:effect-timeline']
    },
    {
      id: 'react-19', track: 'react19', weight: 3, source: '18_React_QA.md#26',
      q: 'What\'s new in React 19?',
      keywords: ['react 19', 'whats new', 'new features', 'actions', 'useActionState', 'useFormStatus', 'useOptimistic', 'use', 'ref as a prop', 'forwardRef', 'activity', 'useEffectEvent'],
      short: 'React 19 is built around **Actions**: async functions passed to `<form action>` or run in a transition, for which React handles the pending state, errors and form reset. Around them: `useActionState`, `useFormStatus` and `useOptimistic`. Also `use()` to read a promise or a context, `ref` as a plain prop, `<Context>` as its own provider, and `<title>` and `<meta>` rendered anywhere. 19.2 added `<Activity>` and `useEffectEvent`.',
      answer: [
        '| Feature | What it does |\n|---|---|\n' +
        '| Actions | Async functions passed to `<form action={…}>` or run in a transition; React handles pending state, errors and form reset |\n' +
        '| `useActionState` | Returns `[state, formAction, isPending]` for a form action |\n' +
        '| `useFormStatus` | A child (a submit button) reads its form\'s pending state |\n' +
        '| `useOptimistic` | Shows the expected result at once; reverts if the action fails |\n' +
        '| `use(promise or context)` | Reads a promise (suspending until it settles) or a context, even inside a condition |\n' +
        '| `ref` as a prop | Function components receive `ref` directly; `forwardRef` is not needed |\n' +
        '| `<Context>` as provider | `<ThemeContext value={…}>` |\n' +
        '| Document metadata | `<title>`, `<meta>`, `<link>` rendered anywhere are moved to `<head>` |\n' +
        '| Server Components and Server Functions | Stable, used through frameworks |\n' +
        '| `<Activity>` (19.2) | Hides part of the UI while keeping its state; can pre-render hidden UI |\n' +
        '| `useEffectEvent` (19.2) | Reads the latest props and state from an effect without making them dependencies |',
        jsx('const [state, formAction, isPending] = useActionState(saveProfile, { error: null });',
            '',
            '<form action={formAction}>',
            '  <input name="name" />',
            '  <button disabled={isPending}>Save</button>',
            '  {state.error && <p>{state.error}</p>}',
            '</form>'),
        '**What React 19 removed** (the upgrade question): `ReactDOM.render` and `hydrate` (use `createRoot` and `hydrateRoot`), string refs, legacy context (`contextTypes`), `propTypes` checks, and `defaultProps` on function components (use default parameters).',
        'The **React Compiler** (1.0, October 2025) is a separate build tool, not part of React 19 itself, but it is the other big change of the same period.'
      ].join('\n\n'),
      followups: [
        'What is an Action, and what does React do for you around one?',
        'What does `useOptimistic` do when the action fails?',
        'Why is `forwardRef` no longer needed?',
        'What did React 19 remove?',
        'What problems do `<Activity>` and `useEffectEvent` solve?'
      ],
      related: ['lesson:r-actions', 'lesson:r-use-action-state', 'lesson:r-use-form-status', 'lesson:r-use-optimistic', 'lesson:r-use',
        'lesson:r-react-19-upgrade', 'lesson:r-forms']
    },
    {
      id: 'csr-ssr-ssg', track: 'react19', weight: 3, source: '18_React_QA.md#28',
      q: 'CSR vs SSR vs SSG',
      keywords: ['csr', 'ssr', 'ssg', 'isr', 'client-side rendering', 'server-side rendering', 'static site generation', 'hydration', 'next.js', 'seo', 'rendering strategies'],
      short: 'They differ in **where and when the HTML is made**. Client-side rendering (CSR): in the browser after the JavaScript loads, so the page is blank until then. Server-side rendering (SSR): on the server for each request. Static site generation (SSG): once, at build time. With SSR and SSG the browser gets ready HTML, and React then **hydrates** it to make it interactive.',
      answer: [
        '| | CSR | SSR | SSG |\n|---|---|---|---|\n' +
        '| HTML made | In the browser, after JS loads | On the server, per request | At build time |\n' +
        '| First content | Slowest (blank until JS runs) | Fast | Fastest (from a CDN) |\n' +
        '| SEO | Weaker | Good | Good |\n' +
        '| Data freshness | Live | Live | As of the last build |\n' +
        '| Server cost | Static hosting only | A server for every request | Static hosting |\n' +
        '| Example | A dashboard behind a login (Vite + React) | Product pages with live prices | A blog, docs, marketing pages |',
        '**Hydration:** the server\'s HTML shows at once, but its buttons do nothing yet. React loads, renders the same tree in the browser, and attaches the event handlers to the existing HTML. If the browser renders something different from the server (a date, `Math.random()`, `window` read during render) React reports a **hydration mismatch**.',
        '**Between SSG and SSR:** incremental static regeneration (ISR) rebuilds a static page in the background every N seconds, or on demand. **Streaming SSR** with `Suspense` sends the page in pieces, so a slow section does not hold up the rest.',
        '**Choose by page:** frameworks such as Next.js mix these per route. Server Components are a different axis: they decide where a **component** runs (and ship no JavaScript for it), and can be rendered at build time or per request.'
      ].join('\n\n'),
      followups: [
        'What is hydration, and what causes a hydration mismatch?',
        'Which would you choose for a dashboard behind a login, a product page, and a blog?',
        'What is incremental static regeneration?',
        'How are Server Components different from SSR?',
        'What does streaming SSR with Suspense improve?'
      ],
      related: ['lesson:r-rendering-strategies', 'lesson:r-server-components']
    },
    {
      id: 'state-management', track: 'composition', weight: 3, source: '18_React_QA.md#29',
      q: 'How do you choose state management?',
      keywords: ['state management', 'redux', 'redux toolkit', 'zustand', 'tanstack query', 'react query', 'global state', 'server state', 'context vs redux', 'url state'],
      short: 'Classify the state first. Local UI state: `useState` or `useReducer`. Shared by a few components: lift it up. App-wide and rarely changing: context. App-wide client state that changes often: **Zustand** or **Redux Toolkit**. **Server data: TanStack Query** (or the framework\'s loaders). URL state: the router. Most "global state" turns out to be cached server data.',
      answer: [
        '| Kind of state | Example | Best tool |\n|---|---|---|\n' +
        '| Local UI state | Is the dropdown open? The input\'s text | `useState`, `useReducer` |\n' +
        '| Shared by a few components | The selected filters on a page | Lift state up |\n' +
        '| App-wide, rarely changing | The current user, the theme | Context |\n' +
        '| App-wide client state, frequent updates | A cart, an editor\'s state | Zustand or Redux Toolkit |\n' +
        '| Server data | Products, orders from the API | TanStack Query (or the framework\'s loaders) |\n' +
        '| URL state | The current page, search filters | The router (query parameters) |',
        '**The senior insight:** most "global state" is really **cached server data**. Move it to TanStack Query, which handles loading, caching, refetching and deduplication, and very little global client state is left: often context or a small Zustand store is enough.',
        js("import { create } from 'zustand';",
           '',
           'export const useCart = create(set => ({',
           '  items: [],',
           '  add: item => set(state => ({ items: [...state.items, item] })),',
           '  clear: () => set({ items: [] })',
           '}));',
           '',
           '// in a component: re-renders only when items change',
           'const items = useCart(state => state.items);'),
        '**When Redux Toolkit earns its weight:** a large app with complex shared client state, many developers, and a need for strict patterns and its DevTools (time-travel debugging). RTK Query covers server data inside Redux.'
      ].join('\n\n'),
      followups: [
        'Why is server data different from client state?',
        'Context or Zustand for a shopping cart, and why?',
        'When does Redux Toolkit earn its weight?',
        'Which state belongs in the URL?',
        'How does a Zustand selector avoid needless re-renders?'
      ],
      related: ['lesson:r-state-libraries', 'lesson:r-context-reducer', 'lesson:r-lifting-state', 'lesson:r-use-reducer']
    },
    {
      id: 'performance', track: 'performance', weight: 3, source: '18_React_QA.md#31',
      q: 'How do you optimise React performance?',
      keywords: ['performance', 'optimise', 'optimize', 'profiler', 'slow', 're-renders', 'code splitting', 'lazy', 'virtualisation', 'web vitals', 'bundle size'],
      short: '**Measure first**, with the React DevTools Profiler ("what rendered, and why"). Then fix the cause: too many re-renders (move state down, split components and contexts, `memo` with stable props, the React Compiler), expensive calculations (`useMemo`), a large bundle (code splitting with `lazy`), long lists (virtualise), slow typing (`useTransition`, `useDeferredValue`, debounce), too many requests (cache with TanStack Query).',
      answer: [
        '| Problem | Fixes |\n|---|---|\n' +
        '| Too many re-renders | Move state down to where it is used; split components and contexts; `memo` with stable props; the React Compiler |\n' +
        '| Expensive calculations | `useMemo`, or move them out of render |\n' +
        '| A large bundle, a slow first load | Code splitting (`lazy`, per route); remove heavy dependencies; tree-shaking |\n' +
        '| Long lists | Virtualisation |\n' +
        '| Slow typing in inputs | `useTransition` / `useDeferredValue`; debounce expensive work |\n' +
        '| Too much data fetching | Cache with TanStack Query; fetch in parallel, not in a waterfall |\n' +
        '| Images | Lazy-load, the right sizes, modern formats |\n' +
        '| A slow first paint | SSR or SSG through a framework |',
        '**How to answer it well:** say what you would measure before naming a fix. The user-facing numbers are the Core Web Vitals: LCP (how fast the main content appears), INP (how fast the page responds to input) and CLS (how much the layout jumps). The Profiler then says which components cost the time.',
        '**The fixes that are free:** keep state as low in the tree as possible, and pass slow parts as `children` so a parent\'s state change does not re-render them.'
      ].join('\n\n'),
      followups: [
        'How do you find out which components re-render, and why?',
        'Which Core Web Vitals would you watch, and what does each measure?',
        'What is code splitting, and where would you split?',
        'When does virtualisation pay off?',
        'Debouncing or `useDeferredValue`: what is the difference?'
      ],
      related: ['lesson:r-rendering', 'lesson:r-memo', 'lesson:r-transitions', 'lesson:r-lazy-suspense', 'lesson:r-long-lists']
    },
    {
      id: 'too-many-renders', track: 'performance', weight: 3, source: '18_React_QA.md#40',
      q: 'Scenario: the page is slow when typing. How do you investigate?',
      keywords: ['re-render', 'rerender', 'too many re-renders', 're-renders too often', 'slow typing', 'profiler', 'highlight updates', 'move state down', 'performance scenario'],
      short: '1. **Measure:** React DevTools Profiler; record while typing, and turn on "Highlight updates when components render". 2. **Find the cause:** usually state too high up (each keystroke re-renders the page), a context that changes often, new object or function props defeating `memo`, an expensive calculation per keystroke, or a huge list. 3. **Fix it, then measure again**: fewer and shorter commits.',
      answer: [
        '| Cause | Fix |\n|---|---|\n' +
        '| State too high up: typing re-renders the whole page | Move the input\'s state into a smaller component |\n' +
        '| A context value that changes often, read widely | Split the context; memoise the value |\n' +
        '| New object or function props on every render defeat `memo` | `useMemo` / `useCallback`, or the React Compiler |\n' +
        '| An expensive calculation on every keystroke | `useMemo`, `useDeferredValue`, or debounce |\n' +
        '| A huge list re-rendering | Virtualise; memoise the rows |',
        '**The most common fix: move state down.**',
        jsx('// ❌ every keystroke re-renders HugeReport',
            'function Page() {',
            "  const [query, setQuery] = useState('');",
            '  return (',
            '    <>',
            '      <input value={query} onChange={e => setQuery(e.target.value)} />',
            '      <HugeReport />',
            '    </>',
            '  );',
            '}',
            '',
            '// ✅ the input owns its state; Page and HugeReport no longer re-render',
            'function SearchBox() {',
            "  const [query, setQuery] = useState('');",
            '  return <input value={query} onChange={e => setQuery(e.target.value)} />;',
            '}'),
        'A re-render is not a bug by itself: React re-rendering a cheap component is fast. It matters when the Profiler shows long commits on each keystroke.'
      ].join('\n\n'),
      followups: [
        'What does "Highlight updates when components render" show you?',
        'How can moving state **down** fix a performance problem?',
        'Why might `memo` not stop a child from re-rendering?',
        'When would you reach for `useDeferredValue` instead?'
      ],
      related: ['lesson:r-rendering', 'lesson:r-memo', 'lesson:r-usememo-usecallback', 'lesson:r-transitions']
    },
    {
      id: 'stale-interval', track: 'effects', weight: 3, source: '18_React_QA.md#41',
      q: 'Scenario: a counter in setInterval sticks at 1. Why?',
      keywords: ['stale closure', 'stale state', 'setInterval', 'interval', 'timer', 'closure', 'updater function', 'useEffectEvent', 'timer stuck'],
      short: 'The effect ran once (`[]`), so its interval callback **closed over** `seconds` from the first render, which is 0 for ever: every tick sets `0 + 1`. That is a **stale closure**. The fix is the updater function, `setSeconds(s => s + 1)`, which always receives the latest value.',
      answer: [
        jsx('function Timer() {',
            '  const [seconds, setSeconds] = useState(0);',
            '',
            '  useEffect(() => {',
            '    const id = setInterval(() => {',
            '      setSeconds(seconds + 1);        // ❌ always 0 + 1: the timer sticks at 1',
            '    }, 1000);',
            '    return () => clearInterval(id);',
            '  }, []);',
            '',
            '  return <p>{seconds}s</p>;',
            '}'),
        '**Why:** a function remembers the variables of the render it was created in; that is a closure, and each render\'s values are a snapshot ([[lesson:r-state-snapshot]]). The effect ran once, so the interval\'s callback belongs to render 1 for ever.',
        '**The fix:** `setSeconds(s => s + 1)`. The callback no longer reads `seconds` at all; React passes it the latest value.',
        '**Other ways, and their costs:** adding `seconds` to the dependency array also works, but clears and recreates the interval every second. To read the latest **prop** inside the interval, where no updater helps, keep it in a ref, or use React 19.2\'s `useEffectEvent`.'
      ].join('\n\n'),
      followups: [
        'Why does adding `seconds` to the dependency array also work, and what does it cost?',
        'What is a closure, and why is it "stale" here?',
        'The callback needs the latest value of a **prop**. How?',
        'Why must this effect return a cleanup?'
      ],
      related: ['explain:stale-closure', 'lesson:r-effect-deps', 'lesson:r-refs', 'lesson:r-state-snapshot']
    },
    {
      id: 'predict-output', track: 'react19', weight: 3, source: '18_React_QA.md#42',
      q: 'Predict what happens: the quick round',
      keywords: ['predict the output', 'quick round', 'what happens', 'gotchas', 'trick questions', 'batching', 'zero', 'key reset', 'onClick call'],
      short: 'Ten one-liners, fired in a row: three `setCount(count + 1)` add 1, three `setCount(c => c + 1)` add 3; a log right after `setCount` shows the old value; `{items.length && <List />}` shows 0; a child re-renders with its parent unless memoised; a new `key` resets state; an effect with no array runs after every render; an effect that sets its own dependency loops; `push` then set may not render; `onClick={fn()}` runs while rendering.',
      answer: [
        '| Code | What happens | Why |\n|---|---|---|\n' +
        '| `setCount(count + 1)` three times in one handler | Up by **1** | All three read the same `count`; the updates are batched |\n' +
        '| `setCount(c => c + 1)` three times | Up by **3** | Each updater gets the latest value |\n' +
        '| `console.log(count)` right after `setCount(5)` | Logs the **old** value | The new one arrives on the next render |\n' +
        '| `{items.length && <List />}` with an empty array | Renders **0** | `0 && …` is `0`, and React renders numbers |\n' +
        '| A parent re-renders; the child\'s props are unchanged | The child **re-renders anyway** | Unless it is wrapped in `memo` (or the Compiler is on) |\n' +
        '| `<Profile key={userId} />` and `userId` changes | Profile **remounts**: its state resets | A new key means a new instance |\n' +
        '| `useEffect(() => { … })` with no array | Runs after **every** render | No array, no filter |\n' +
        '| `useEffect(() => { setX(x + 1); }, [x])` | An **endless loop** | The effect changes its own dependency |\n' +
        '| `items.push(4); setItems(items);` | The screen may **not** update | The same array reference |\n' +
        '| `onClick={handleClick()}` | Runs **while rendering**, not on click | It is called, not passed |',
        '**How to use this card:** cover the middle column, read each line of code, say what happens and why, then check. Each row has its lesson: [[lesson:r-state-snapshot]] (rows 1 to 3), [[lesson:r-conditional]] (row 4), [[lesson:r-lists-keys]] (row 6), [[lesson:r-state-arrays]] (row 9), [[lesson:r-events]] (row 10).'
      ].join('\n\n'),
      followups: [
        'Fix each row that is a bug.',
        'Which row does the React Compiler change?',
        'Why does a new key reset state, and when is that useful on purpose?',
        'Write the line that renders nothing instead of 0 for an empty list.'
      ],
      related: ['lesson:r-state-snapshot', 'lesson:r-conditional', 'lesson:r-lists-keys', 'lesson:r-state-arrays', 'lesson:r-events', 'explain:state-snapshot', 'lesson:r-testing']
    }
  );
})(window.RLT);
