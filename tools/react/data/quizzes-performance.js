/*
 * Quizzes for track 5 (Performance and internals): three or more questions per lesson, keyed by
 * lesson id. The question shape is described at the top of data/quizzes-foundations.js; the choices
 * are shuffled every time, so never write "both of the above".
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};
  function jsx() { return '```jsx\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q['r-rendering'] = [
    {
      q: '`App` holds some state and renders `<Footer />`, which takes no props. `App`\'s state changes. Does `Footer` render again?',
      choices: ['Yes: by default a component renders whenever its parent does', 'No: it has no props, so nothing changed for it', 'Only if `Footer` reads the same state'],
      answer: 0,
      why: 'Props are not what triggers a render; the parent rendering is. `memo(Footer)` would let React skip it, because its (empty) props are the same.'
    },
    {
      q: 'What is the difference between rendering and committing?',
      choices: ['Rendering calls your components to get JSX; committing changes the DOM where the result differs', 'Rendering changes the DOM; committing saves the state', 'They are two words for the same step'],
      answer: 0,
      why: 'A render can produce exactly what the last one did, and then the commit changes nothing on the screen. That is why a re-render is often cheap.'
    },
    {
      q: 'Typing in a search box at the top of a page re-renders a slow report next to it. Which fix costs nothing?',
      choices: ['Move the search box\'s state into a component of its own', 'Wrap the whole page in `useMemo`', 'Debounce the report\'s rendering with `setTimeout`'],
      answer: 0,
      why: 'State that lives in the box\'s own component re-renders only that component as you type. The report, outside it, is no longer touched.'
    },
    {
      q: 'Before optimising, what should you do?',
      choices: ['Measure: Highlight renders, or the React DevTools Profiler while doing the slow thing', 'Wrap every component in `memo`', 'Move all state into context'],
      answer: 0,
      why: 'Most re-renders are cheap. The Profiler shows which commits are slow and which components cost the time, which is rarely the one you would guess.'
    }
  ];

  Q['r-reconciliation'] = [
    {
      q: '`{isAdmin ? <Profile admin /> : <Profile />}` and `isAdmin` changes. What happens to `Profile`\'s state?',
      choices: ['It survives: the same type in the same place is the same component', 'It resets: the JSX is a different branch of the ternary', 'React throws an error about changing props'],
      answer: 0,
      why: 'React compares the type at each place in the tree, not which line of your code made it. Both branches put a `Profile` in the same place.'
    },
    {
      q: 'A component is wrapped in a `<div>` on one render and in a `<section>` on the next. What happens to the component\'s state?',
      choices: ['It is lost: a different parent type throws the whole subtree away', 'It is kept: only the wrapper changed', 'It is kept, but its effects run again'],
      answer: 0,
      why: 'When the type at a place changes, React unmounts the old element and everything inside it, and builds the new one from scratch.'
    },
    {
      q: 'How do you make `<Chat contact={contact} />` start afresh, empty draft and all, whenever the contact changes?',
      choices: ['Give it a key that changes with the contact: `<Chat key={contact.id} contact={contact} />`', 'Clear each piece of state in an effect that depends on `contact`', 'Call `forceUpdate()` on the Chat'],
      answer: 0,
      why: 'A new key is a new component to React: it throws the old one away with its state. Simpler, and harder to get wrong, than resetting each value in an effect.'
    },
    {
      q: 'Why does a component defined inside another lose its state, and its input the focus, on every render?',
      choices: ['Each render makes a new function, so React sees a new component type and rebuilds it', 'Inner components cannot use hooks', 'React renders inner components only once'],
      answer: 0,
      why: 'For React the type is the function itself. A function made during render is a new one each time, so the old component and its DOM are thrown away.'
    }
  ];

  Q['r-memo'] = [
    {
      q: 'How does `memo` compare the old props with the new ones?',
      choices: ['Each prop with `Object.is`: equal values, or the very same object or function', 'By turning both into JSON and comparing the text', 'It compares only the props whose names start with `on`'],
      answer: 0,
      why: 'A shallow comparison, prop by prop. Two objects with the same contents are still different objects.'
    },
    {
      q: '`<Row item={item} onSelect={id => setSelected(id)} />` with `Row` wrapped in `memo`: does a parent re-render re-render `Row`?',
      choices: ['Yes: the arrow function is new each render, so one prop always differs', 'No: `item` is the same, which is enough', 'Only when `item` changes'],
      answer: 0,
      why: 'Every prop must be the same. Pass `onSelect={setSelected}` (a setter never changes) or keep the callback with `useCallback`.'
    },
    {
      q: 'Which prop never breaks a `memo` comparison?',
      choices: ['A state setter such as `setSelected`', '`style={{ color: \'red\' }}`', '`items={list.filter(x => x.done)}`'],
      answer: 0,
      why: 'React gives a component the same setter function on every render. An object literal and the result of `filter` are new each time.'
    },
    {
      q: 'A `memo` component reads a context whose value changes. What happens?',
      choices: ['It renders again: `memo` only compares props', 'It stays as it was until its props change', 'React shows a warning'],
      answer: 0,
      why: 'Its own state and the contexts it reads still trigger renders. `memo` only skips the renders that come from the parent.'
    }
  ];

  Q['r-usememo-usecallback'] = [
    {
      q: 'What is `useCallback(fn, deps)` the same as?',
      choices: ['`useMemo(() => fn, deps)`', '`useMemo(fn, deps)`', '`useEffect(fn, deps)`'],
      answer: 0,
      why: '`useMemo` keeps what its function returns; returning `fn` keeps the function itself. `useMemo(fn, deps)` would keep what `fn` returns.'
    },
    {
      q: 'The child is **not** wrapped in `memo`. Does wrapping its `onClick` in `useCallback` stop it re-rendering?',
      choices: ['No: without `memo` the child re-renders with its parent whatever its props', 'Yes: the prop stays the same, so React skips it', 'Yes, but only in production'],
      answer: 0,
      why: '`useCallback` only helps something that compares the function: a `memo` child, or an effect\'s dependency list.'
    },
    {
      q: 'How can a callback that changes a list be made once, with `[]` as its dependencies?',
      choices: ['Use the updater form: `setTodos(ts => ts.map(…))` reads no state', 'List `todos` in the dependencies anyway', 'Keep `todos` in a global variable'],
      answer: 0,
      why: 'The updater receives the latest list from React, so the callback reads nothing from the render and never needs remaking.'
    },
    {
      q: 'When is `useMemo` not worth it?',
      choices: ['For a cheap calculation: the comparison and the memory cost more than the work', 'For filtering 10,000 items on every keystroke', 'For an object passed to a `memo` child'],
      answer: 0,
      why: 'Measure with `console.time`. Cache what takes a millisecond or more on frequent renders, and what a `memo` child or an effect needs to stay the same.'
    }
  ];

  Q['r-react-compiler'] = [
    {
      q: 'What does the React Compiler do?',
      choices: ['At build time, it adds the memoisation you would write with `memo`, `useMemo` and `useCallback`', 'It runs React components on the server', 'It converts class components into function components'],
      answer: 0,
      why: 'It works out which values depend on which props and state, and caches each value and piece of JSX until its inputs change.'
    },
    {
      q: 'A component does `props.items.sort(…)` while rendering. Why is that a problem, compiled or not?',
      choices: ['It changes the parent\'s array in place: rendering must not change its inputs', 'Arrays cannot be sorted in React', 'It sorts too slowly'],
      answer: 0,
      why: 'Props are read-only. Sorting in place changes data the parent owns, so anything that cached or showed it is now wrong. Sort a copy: `[...items].sort(…)`.'
    },
    {
      q: 'How do you keep the compiler away from one component that is not ready?',
      choices: ['Write `"use no memo"` as its first line', 'Rename it to start with a lowercase letter', 'Wrap it in `<StrictMode>`'],
      answer: 0,
      why: 'The directive skips that component, which helps when adopting the compiler step by step.'
    },
    {
      q: 'With the compiler on, what still needs your thought?',
      choices: ['How much renders: where state lives, long lists, urgent versus background updates', 'Every `useCallback` in the app', 'Nothing: performance is solved'],
      answer: 0,
      why: 'It caches values; it does not move state down, virtualise a list or make an update a transition.'
    }
  ];

  Q['r-transitions'] = [
    {
      q: 'What does `startTransition(() => setTab(\'posts\'))` change?',
      choices: ['The new tab renders in the background; the old one stays and responds, and a newer update can drop it', 'The tab change is delayed by a fixed 300 ms', 'The update is skipped if the render is slow'],
      answer: 0,
      why: 'A transition is a non-urgent update: React renders it in slices, keeps the current screen meanwhile, and throws it away if something newer comes first.'
    },
    {
      q: 'Why can a controlled input\'s `setText` not go inside `startTransition`?',
      choices: ['Typing must show at once: an input whose value lags feels broken', 'Transitions cannot hold strings', 'Inputs do not support React state'],
      answer: 0,
      why: 'Keep the input urgent and put only the slow consequence (the filtered list) in a transition, or render it from `useDeferredValue`.'
    },
    {
      q: 'You render a slow list from `useDeferredValue(query)`. Why must the list be wrapped in `memo`?',
      choices: ['In the urgent render it gets the old value; without `memo` it re-renders anyway, slowly', 'Deferred values only work inside `memo`', 'Otherwise React throws an error'],
      answer: 0,
      why: 'The trick is that the urgent render skips the slow part. With `memo` and an unchanged prop, it does; without, it renders the list as slowly as before.'
    },
    {
      q: 'How do you know a deferred value has not caught up yet?',
      choices: ['`query !== deferredQuery`', '`useDeferredValue` returns `null` while busy', 'Read `isPending` from `useDeferredValue`'],
      answer: 0,
      why: 'While the background render is on its way, the deferred copy still holds the old value. Comparing the two tells you to dim the stale content.'
    }
  ];

  Q['r-lazy-suspense'] = [
    {
      q: 'What must `import(\'./Chart\')` give, for `lazy(() => import(\'./Chart\'))` to work?',
      choices: ['A module whose default export is the component', 'The component function itself', 'A string with the component\'s code'],
      answer: 0,
      why: '`lazy` waits for the promise and renders its `default`. A named export needs `.then(m => ({ default: m.Chart }))`.'
    },
    {
      q: 'Where should `const Chart = lazy(…)` be written?',
      choices: ['Once, at the top level of the module', 'Inside the component that shows it, so it loads on demand', 'Inside a `useEffect`'],
      answer: 0,
      why: 'Inside a component it is a new component type each render: the code is "loaded" again, and everything inside loses its state.'
    },
    {
      q: 'What does `<Suspense fallback={<Spinner />}>` show while a lazy component inside it downloads?',
      choices: ['The fallback, in place of the whole boundary\'s content', 'Nothing until the whole page is ready', 'An error, unless the download takes under a second'],
      answer: 0,
      why: 'A suspended component shows the nearest Suspense boundary\'s fallback; when its code arrives, React renders the content.'
    },
    {
      q: 'Which split usually saves the most?',
      choices: ['One file per route, so visitors download only the pages they open', 'One file per button', 'One file for all the CSS'],
      answer: 0,
      why: 'Routes and heavy widgets (charts, editors, maps) hold most of the code a first visit does not need. Tiny components cost a request each and save nothing.'
    }
  ];

  Q['r-long-lists'] = [
    {
      q: 'What does virtualising a list mean?',
      choices: ['Rendering only the rows in view (plus a few), in a container as tall as the whole list', 'Rendering the list in a Web Worker', 'Loading the list from the server one page at a time'],
      answer: 0,
      why: 'The DOM holds a handful of rows wherever you scroll, while a tall inner element keeps the scrollbar right.'
    },
    {
      q: 'Rows are 30 px tall and the list is scrolled to 6,000 px. Which row is at the top?',
      choices: ['Row 201: index `Math.floor(6000 / 30)`, which is 200', 'Row 200', 'Row 6000'],
      answer: 0,
      why: '6000 / 30 = 200, the index of the first visible row; counting from 1, that is row 201.'
    },
    {
      q: 'What is overscan for?',
      choices: ['Rendering a few rows past each edge, so a fast scroll shows no blank space', 'Making the scrollbar longer', 'Loading the next page of data in advance'],
      answer: 0,
      why: 'Scrolling moves the content before React has rendered the new rows. A few extra rows above and below cover that moment.'
    },
    {
      q: 'What do users lose with a virtualised list?',
      choices: ['Ctrl+F and screen readers cannot see the rows that are not rendered', 'The ability to scroll with the mouse wheel', 'Keys stop working'],
      answer: 0,
      why: 'Only the visible rows exist in the DOM. Offer your own search, and tell assistive technology the list\'s full size with `aria-rowcount` or `aria-setsize`.'
    }
  ];
})(window.RLT);
