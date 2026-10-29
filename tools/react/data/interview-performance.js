/*
 * Interview Q&A, track 5 (Performance and internals): questions 15, 23, 24 and 32 of
 * 18_React_QA.md. Its ★★★ questions (2, 14, 31, 40) came early, in data/interview-fast-track.js.
 * The question shape is described at the top of data/interview.js.
 */
(function (U) {
  var Q = U.data.questions = U.data.questions || [];
  function jsx() { return '```jsx\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q.push(
    {
      id: 'react-compiler', track: 'performance', weight: 2, source: '18_React_QA.md#15',
      q: 'What is the React Compiler?',
      keywords: ['react compiler', 'compiler', 'babel-plugin-react-compiler', 'automatic memoization', 'auto memo', 'rules of react', 'use no memo', 'react forget', 'memoization'],
      short: 'A **build-time** tool that analyses components and hooks and adds memoisation automatically: what you would do with `memo`, `useMemo` and `useCallback`, but finer, and without the mistakes. **React Compiler 1.0** came out on 7 October 2025; Vite, Next.js and Expo can start new apps with it on. It relies on the **rules of React** (pure rendering, no mutation of props or state, the rules of hooks); the ESLint plugin reports code it cannot compile.',
      answer: [
        '| | By hand | With the compiler |\n|---|---|---|\n' +
        '| Memoising a value | `useMemo(() => …, [deps])` | Automatic |\n' +
        '| A stable callback | `useCallback(fn, [deps])` | Automatic |\n' +
        '| Skipping a child | `memo(Child)` and stable props | Automatic: the JSX itself is cached |\n' +
        '| Wrong or missing dependencies | Your problem | Worked out from the code |',
        '**How:** a Babel plugin (`babel-plugin-react-compiler`). In Next.js, `reactCompiler: true`; in Vite, the plugin in the React plugin\'s Babel options. It works with React 17 and later. `"use no memo"` at the top of a component skips it, for adopting it gradually.',
        '**What it needs:** components and hooks that follow the rules of React. Rendering is pure (the same inputs give the same output, and nothing outside changes); props and state are never changed in place; refs are not read during render; hooks are called at the top level. Code that breaks them is skipped where the compiler can tell, and can show stale values where it cannot.',
        '**What it does not do:** it caches; it does not decide where state lives, virtualise long lists, split code, or make an update non-urgent. Measuring and those design choices are still yours.',
        '**Do you still write `useMemo`?** Rarely in new code; existing calls are fine to keep.'
      ].join('\n\n'),
      followups: [
        'Which rules of React does the compiler rely on, and what happens when code breaks one?',
        'What does `"use no memo"` do, and when would you use it?',
        'With the compiler on, would you still use `memo` or `useMemo` anywhere?',
        'Why does mutating a prop break a memoising compiler?'
      ],
      related: ['lesson:r-react-compiler', 'lesson:r-memo', 'q:memo-usememo-usecallback']
    },
    {
      id: 'lazy-suspense', track: 'performance', weight: 2, source: '18_React_QA.md#23',
      q: 'Code splitting with lazy and Suspense',
      keywords: ['lazy', 'React.lazy', 'Suspense', 'code splitting', 'dynamic import', 'import()', 'bundle size', 'fallback', 'route splitting', 'lazy loading', 'chunks'],
      short: 'Load a component\'s code only when it is first needed, so the first download is smaller: `const Reports = lazy(() => import(\'./Reports\'))` puts it in a separate file, and `<Suspense fallback={…}>` shows something while that file downloads. Typical split points: **routes**, **heavy components** (charts, editors, maps) and **rarely used dialogs**.',
      answer: [
        jsx("import { lazy, Suspense } from 'react';",
            '',
            "const Reports = lazy(() => import('./Reports'));    // a separate JS file",
            '',
            'function App() {',
            '  return (',
            '    <Suspense fallback={<p>Loading reports…</p>}>',
            '      <Reports />',
            '    </Suspense>',
            '  );',
            '}'),
        '**How it works:** the first render of `<Reports />` calls the function, which starts the download, and the component suspends; React shows the nearest Suspense boundary\'s fallback, then the real component when the module arrives. The module\'s **default export** must be the component.',
        '| Detail | Why it matters |\n|---|---|\n' +
        '| Declare `lazy` at the top level | Inside a component it is a new type every render: reloaded, state lost |\n' +
        '| Put an error boundary around it | A download can fail (network, a new deployment removed old files) |\n' +
        '| Navigate inside a transition | Keeps the old page on screen instead of flashing the fallback |\n' +
        '| Preload on hover or idle | Call the same `import()` early; the browser caches it |\n' +
        '| Nested Suspense boundaries | Parts of a page appear as they are ready, not all at once |',
        '**Suspense beyond code:** in React 19 a component that reads a promise with `use(promise)` suspends the same way, and frameworks (Next.js, React Router) load data through Suspense and stream server-rendered HTML in pieces.'
      ].join('\n\n'),
      followups: [
        'Why must `lazy` be called outside the component?',
        'Where would you split an app\'s code, and where not?',
        'What happens when the lazy chunk fails to download?',
        'How do you avoid a loading spinner flashing on every navigation?',
        'How does Suspense relate to `use(promise)` in React 19?'
      ],
      related: ['lesson:r-lazy-suspense', 'lesson:r-error-boundaries', 'q:performance']
    },
    {
      id: 'transitions', track: 'performance', weight: 2, source: '18_React_QA.md#24',
      q: 'useTransition and useDeferredValue',
      keywords: ['useTransition', 'startTransition', 'useDeferredValue', 'transition', 'concurrent rendering', 'interruptible', 'isPending', 'urgent update', 'non-urgent update', 'deferred value', 'responsive input'],
      short: 'Concurrent rendering (React 18+) lets React **interrupt** non-urgent rendering to keep the page responsive. **`useTransition`** marks a **state update** as non-urgent: `startTransition(() => setFilter(value))`, with `isPending` while it renders. **`useDeferredValue`** gives a **lagging copy of a value**, for when you do not control the update: render the slow part from `deferredQuery` (and wrap it in `memo`).',
      answer: [
        jsx('const [isPending, startTransition] = useTransition();',
            '',
            'function onFilterChange(value) {',
            '  setInput(value);                               // urgent: the input stays responsive',
            '  startTransition(() => setFilter(value));       // non-urgent: re-filtering a big list',
            '}',
            '',
            '// or, when the value comes from elsewhere:',
            'const deferredQuery = useDeferredValue(query);',
            '<SlowList query={deferredQuery} />              // SlowList wrapped in memo'),
        '| | `useTransition` | `useDeferredValue` |\n|---|---|---|\n' +
        '| You wrap | The state update | A value |\n' +
        '| Use when | You own the `setState` call | The value comes from props or a library |\n' +
        '| Pending signal | `isPending` | `value !== deferredValue` |\n' +
        '| Needs | Nothing else | The slow child wrapped in `memo` |',
        '**What "interruptible" means:** the background render runs in small slices; a click or keystroke in between is handled at once, and if it makes the background work outdated, React drops that render. The old screen stays visible meanwhile, instead of a Suspense fallback.',
        '**Versus debouncing:** a debounce waits a fixed delay and then renders everything at once (blocking); a transition starts at once, adapts to the device, and can be interrupted. Debounce still suits network requests.',
        '**React 19:** `startTransition` accepts an async function, an **Action**, with pending state handled for you (`useActionState`, `useFormStatus`).'
      ].join('\n\n'),
      followups: [
        'Why can the input\'s own value not be set inside a transition?',
        'When would you choose `useDeferredValue` over `useTransition`?',
        'Why does `useDeferredValue` need the slow child wrapped in `memo`?',
        'How is a transition different from debouncing?',
        'What happens to a transition when a newer update arrives?'
      ],
      related: ['lesson:r-transitions', 'build:deferred-search', 'q:too-many-renders', 'lesson:r-actions']
    },
    {
      id: 'long-lists', track: 'performance', weight: 2, source: '18_React_QA.md#32',
      q: 'How do you render very long lists?',
      keywords: ['long list', 'long lists', 'virtualisation', 'virtualization', 'windowing', 'virtual list', 'react-window', 'tanstack virtual', 'infinite scroll', 'pagination', '10000 rows', 'large list', 'overscan'],
      short: 'Rendering 10,000 rows creates 10,000+ DOM nodes: slow to render, to update and to scroll. **Virtualisation (windowing)**: render only the rows in view, plus a few extra, inside a container as tall as the whole list, and swap them as the user scrolls. Libraries: **TanStack Virtual**, **react-window**. Alternatives: **pagination** or **"load more"**.',
      answer: [
        jsx('const first = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN);',
            'const last = Math.min(items.length - 1, Math.floor((scrollTop + VIEW) / ROW) + OVERSCAN);',
            '',
            "<div style={{ height: VIEW, overflowY: 'auto' }} onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>",
            "  <div style={{ position: 'relative', height: items.length * ROW }}>   {/* the full height */}",
            '    {items.slice(first, last + 1).map((item, i) => (',
            "      <Row key={item.id} item={item} style={{ position: 'absolute', top: (first + i) * ROW }} />",
            '    ))}',
            '  </div>',
            '</div>'),
        '| Option | Good for | Watch out for |\n|---|---|---|\n' +
        '| Pagination | Tables, search results | More clicks; the URL should hold the page |\n' +
        '| Load more / infinite scroll | Feeds | The DOM keeps growing; no footer; hard to return to a place |\n' +
        '| Virtualisation | Long lists and tables that scroll as one | Variable row heights need measuring; Ctrl+F and screen readers see only the rendered rows |',
        '**Details that come up:** overscan (a few rows beyond the edges so fast scrolling shows no gaps); stable keys from the data; memoised rows; `aria-rowcount` or `aria-setsize`/`aria-posinset` so assistive technology knows the full size; restoring the scroll position when the user comes back.',
        '**A lighter tool:** CSS `content-visibility: auto` lets the browser skip layout and paint for off-screen sections while keeping every node, which suits long documents more than huge lists.'
      ].join('\n\n'),
      followups: [
        'Write the arithmetic for the first and last visible row.',
        'How would you handle rows of different heights?',
        'What breaks for accessibility and in-page search, and how do you make up for it?',
        'Infinite scroll or pagination for a product listing? Why?',
        'How do you keep a selected row selected after it scrolls out of the window?'
      ],
      related: ['lesson:r-long-lists', 'build:virtual-list', 'q:performance']
    }
  );
})(window.RLT);
