/*
 * Quizzes for track 3 (Effects and refs): three or more questions per lesson, keyed by lesson id.
 * The question shape is described at the top of data/quizzes-foundations.js; the choices are
 * shuffled every time, so never write "both of the above".
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};
  function jsx() { return '```jsx\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q['r-effects'] = [
    {
      q: 'In what order do these happen when a component with an effect first appears?',
      choices: ['React renders the component, updates the DOM, the browser paints, then the effect runs', 'The effect runs, then React renders the component and paints', 'React renders the component and runs the effect, then the browser paints'],
      answer: 0,
      why: 'An effect waits until the screen is updated and painted, so it never delays what the user sees, and it finds the DOM already changed. (`useLayoutEffect` is the one that runs before the paint.)'
    },
    {
      q: 'When does `useEffect(fn, [])` run?',
      choices: ['Once, after the first render', 'After every render', 'Never: an empty array means it has nothing to run for'],
      answer: 0,
      why: 'An empty array has no dependency that could change, so after the first run React always skips it. With no array at all it would run after every render.'
    },
    {
      q: 'A component shows `fullName` from `first` and `last`, both in state. What is the best way?',
      choices: ['`const fullName = first + \' \' + last;` while rendering', 'An effect on `[first, last]` that calls `setFullName(first + \' \' + last)`', 'A ref that an effect updates after each render'],
      answer: 0,
      why: 'A value worked out from props or state is computed during render. An effect would add a second render, and for a moment the screen would show the old full name.'
    },
    {
      q: 'Which hook replaces a class component\'s `componentDidMount` and `componentWillUnmount` together?',
      choices: ['`useEffect(() => { … return () => { … }; }, [])`', '`useState`, with a lazy initial value', '`useLayoutEffect` with no array'],
      answer: 0,
      why: 'The effect runs after the first render (mount) and its cleanup runs when the component leaves (unmount). One effect keeps the setup and the teardown of one concern together.'
    }
  ];

  Q['r-effect-cleanup'] = [
    {
      q: 'An effect has `[roomId]` as its dependencies, and `roomId` changes from `general` to `travel`. What does React run, in order?',
      choices: ['The old cleanup (which sees `general`), then the effect with `travel`', 'The effect with `travel`, then the old cleanup', 'Only the effect with `travel`: cleanups run only when the component leaves'],
      answer: 0,
      why: 'Before an effect runs again, React runs the cleanup of its previous run, and that cleanup still sees the old render\'s values. So it disconnects from exactly the room it connected to.'
    },
    {
      q: 'Why does this cleanup leave the listener in place?\n\n' + jsx('useEffect(() => {', "  window.addEventListener('resize', () => setWidth(innerWidth));", "  return () => window.removeEventListener('resize', () => setWidth(innerWidth));", '}, []);'),
      choices: ['The two arrow functions are different functions, so the one added is never removed', 'A cleanup cannot call `removeEventListener`', '`resize` listeners are removed only when the page closes'],
      answer: 0,
      why: '`removeEventListener` removes the very function that was added. Two arrow functions with the same code are two different objects. Keep the handler in a variable and pass that same variable to both.'
    },
    {
      q: 'In development, a new effect logs "connect", "disconnect", "connect" when its component appears. What is going on?',
      choices: ['StrictMode runs each new effect, its cleanup and the effect again, to check the cleanup', 'The component rendered three times because its state changed', 'A bug in React 19 that production also has'],
      answer: 0,
      why: 'In development, StrictMode simulates an unmount and a mount right away. A correct cleanup makes effect, cleanup, effect end where one effect would. Production runs it once.'
    },
    {
      q: 'An interval started in an effect has no cleanup. What does StrictMode show in development?',
      choices: ['Two intervals running, so whatever it updates goes twice as fast', 'Nothing: StrictMode only changes production', 'An error that stops the component'],
      answer: 0,
      why: 'StrictMode runs the effect twice, and nothing clears the first interval. That is the bug users would meet after leaving the page and coming back, shown at once.'
    }
  ];

  Q['r-effect-deps'] = [
    {
      q: 'Why does this effect reconnect on every keystroke in the message box?\n\n' + jsx('const options = { serverUrl, roomId };', 'useEffect(() => {', '  const c = createConnection(options);', '  c.connect();', '  return () => c.disconnect();', '}, [options]);'),
      choices: ['`options` is a new object on every render, and React compares dependencies by reference', 'Every effect runs again after a keystroke', '`createConnection` must be listed too'],
      answer: 0,
      why: 'React compares each dependency with `Object.is`. A new object is never the same object, so every render (each keystroke re-renders) counts as a change. Make the object inside the effect and depend on `serverUrl` and `roomId`.'
    },
    {
      q: 'What happens with `useEffect(() => { setCount(count + 1); }, [count]);`?',
      choices: ['An endless loop: each run changes `count`, which runs the effect again ("Maximum update depth exceeded")', 'It adds 1 once, after the first render', 'Nothing: an effect cannot set state'],
      answer: 0,
      why: 'Setting state renders again; `count` changed, so the effect runs again and sets it again, for ever. React stops it with "Maximum update depth exceeded".'
    },
    {
      q: 'An effect reads `roomId` but its array is `[]`. The user switches rooms. What happens?',
      choices: ['The effect keeps the first room: it never runs again, and its code still sees the first render\'s `roomId`', 'React adds `roomId` to the array by itself', 'The effect runs with the new room, because effects always see the latest values'],
      answer: 0,
      why: 'An effect sees the values of the render that made it: a stale closure. With `[]` it never runs again, so the chat stays connected to the first room. List every value the effect reads.'
    },
    {
      q: 'What is `useEffectEvent` (React 19.2) for?',
      choices: ['Reading the latest props or state inside an effect without making them dependencies', 'Running an effect only after a click', 'Making an effect async'],
      answer: 0,
      why: 'It makes a function that always sees the latest values and is not a dependency, for a part of the effect that should use a value without re-running when it changes (a toast in the current theme when the room connects).'
    }
  ];

  Q['r-fetching'] = [
    {
      q: 'The user picks Alice, then Bob. Alice\'s answer arrives last. Without protection, what does the page show?',
      choices: ['Alice\'s data, while Bob is selected', 'Bob\'s data: React cancels the old request', 'An error: two requests cannot be on their way at once'],
      answer: 0,
      why: 'Both requests finish. Whichever `setUser` runs last wins, and answers arrive in any order. That is the race: an old, slow answer overwrites the new one.'
    },
    {
      q: 'How does an `ignore` flag in the cleanup fix the race?',
      choices: ['When the person changes, the old effect\'s cleanup sets its own `ignore` to true, so its answer is dropped', 'It stops the browser sending the old request', 'It makes React wait for the old request before starting the new one'],
      answer: 0,
      why: 'Each run of the effect has its own `ignore` variable. The cleanup runs exactly when that run\'s answer stops mattering. (`AbortController` goes further and cancels the request itself.)'
    },
    {
      q: 'Why can you not write `useEffect(async () => { … }, [id])`?',
      choices: ['An async function returns a promise, and an effect must return nothing or a cleanup function', 'Effects cannot use `await` anywhere', 'Async code inside effects runs before the render'],
      answer: 0,
      why: 'React would get a promise where it expects a cleanup. Write an async function inside the effect and call it: `async function load() { … } load();`.'
    },
    {
      q: 'With `AbortController`, the fetch\'s `.catch` gets an error named `AbortError`. What should it do with it?',
      choices: ['Ignore it: the request was cancelled on purpose, it is not a failure', 'Show it to the user as a network error', 'Retry the request'],
      answer: 0,
      why: 'The cleanup aborted the request because a newer one replaced it. Show only real failures: `if (err.name !== \'AbortError\') setError(err.message);`.'
    }
  ];

  Q['r-refs'] = [
    {
      q: 'What happens on the screen when a click runs `countRef.current = countRef.current + 1`?',
      choices: ['Nothing: changing a ref does not re-render', 'The component re-renders with the new value', 'React throws, because refs are read-only'],
      answer: 0,
      why: 'A ref is a plain object React does not watch. Its value changes at once, but nothing draws. If the screen should show it, it belongs in state.'
    },
    {
      q: 'A stopwatch keeps its interval id in `let intervalId` inside the component. Why does Stop not stop it?',
      choices: ['The first tick re-renders, and the new render\'s `intervalId` starts again as `null`, so Stop clears nothing', '`clearInterval` cannot clear an interval started in another function', 'A component cannot start intervals'],
      answer: 0,
      why: 'Every render runs the component again, and its `let` variables start over. A ref (`useRef(null)`) keeps the same object across renders, so the id survives.'
    },
    {
      q: 'Which of these belongs in a ref rather than in state?',
      choices: ['The id of a running timer', 'The text the user is typing into a controlled input', 'The number shown on a counter'],
      answer: 0,
      why: 'The screen never shows a timer id; only handlers and effects need it. What the screen shows is state, so that changing it re-renders.'
    },
    {
      q: 'Why should you not write `{countRef.current}` in the JSX?',
      choices: ['Changing the ref does not re-render, so the screen shows a value that goes stale', 'Refs cannot hold numbers', 'React reads refs only inside effects'],
      answer: 0,
      why: 'The JSX shows whatever the ref held during the last render, which may be long ago. Read and change refs in handlers and effects; show state.'
    }
  ];

  Q['r-dom-refs'] = [
    {
      q: 'When is `inputRef.current` the `<input>` element?',
      choices: ['Once React has put the input on the page: in event handlers and effects', 'During the first render, as soon as `useRef` is called', 'Only inside `useLayoutEffect`'],
      answer: 0,
      why: 'During the first render the input does not exist yet, so `inputRef.current` is `null`. React sets it after it has created the DOM node, before effects run.'
    },
    {
      q: 'In React 19, how does a parent focus an input inside your own `TextField` component?',
      choices: ['`TextField` takes `ref` as a prop and puts it on the `<input>`', 'It cannot: refs only work on HTML elements', '`document.querySelector` inside the parent'],
      answer: 0,
      why: 'In React 19 `ref` is a plain prop for function components: `function TextField({ ref, ...props }) { return <input ref={ref} {...props} />; }`. Before 19 the component had to be wrapped in `forwardRef`.'
    },
    {
      q: 'A tooltip measures its height and moves above or below its button. Why `useLayoutEffect` instead of `useEffect`?',
      choices: ['It runs before the browser paints, so the user never sees the tooltip in the wrong place', 'It runs before the component renders', '`useEffect` cannot read the DOM'],
      answer: 0,
      why: '`useEffect` runs after the paint: the first position would flash for a frame. `useLayoutEffect` runs after the DOM update and before the paint, so the corrected position is the first one drawn.'
    },
    {
      q: 'What does `useImperativeHandle` let a component do?',
      choices: ['Give a parent\'s ref a few chosen methods (such as `focus`) instead of the whole DOM node', 'Change the DOM without React knowing', 'Run an effect before the render'],
      answer: 0,
      why: '`useImperativeHandle(ref, () => ({ focus() { … } }))` decides what the parent sees through its ref, which keeps the component\'s insides private.'
    }
  ];

  Q['r-custom-hooks'] = [
    {
      q: 'Two components each call `useOnlineStatus()`. How many `isOnline` states are there?',
      choices: ['Two: each call runs its own `useState` and its own effect', 'One, shared by both components', 'None: custom hooks cannot hold state'],
      answer: 0,
      why: 'A custom hook shares logic, not state. Calling it is like pasting its body into each component. To share one value, lift it up or use context.'
    },
    {
      q: 'Why must a custom hook\'s name start with `use`?',
      choices: ['So that the lint rules, the React Compiler and editors check it with the rules of hooks', 'React finds hooks by searching for names that start with `use`', 'It is only a convention, with no effect on any tool'],
      answer: 0,
      why: 'React itself does not look at names, but every tool around it does: the `use` prefix says "this calls hooks, so check it like a component". A function that calls no hooks should not have it.'
    },
    {
      q: 'In `useDebounce`, what makes a fast typist wait for a pause?',
      choices: ['Each new value runs the effect\'s cleanup, which clears the waiting timer before a new one starts', 'React batches the keystrokes', 'The `setTimeout` delay grows with each keystroke'],
      answer: 0,
      why: 'The effect depends on `value`. Every keystroke changes it, so React cleans up the previous run (`clearTimeout`) and starts a fresh timer. Only a pause as long as `delay` lets one fire.'
    }
  ];

  Q['r-rules-of-hooks'] = [
    {
      q: 'Why does React need hooks to be called in the same order on every render?',
      choices: ['It matches each call to its stored state by position, not by name', 'Hooks are sorted alphabetically', 'The order decides which hook runs first in the browser'],
      answer: 0,
      why: 'React keeps a list of slots per component. The first hook called gets slot 1, the second slot 2. Skip one and every later hook reads the wrong slot.'
    },
    {
      q: 'What is wrong here?\n\n' + jsx('function Profile({ user }) {', '  if (!user) return <SignIn />;', "  const [tab, setTab] = useState('posts');", '  …', '}'),
      choices: ['The hook comes after an early return, so renders without a user call one hook fewer', 'Nothing: the hook is at the top level of the function', '`useState` cannot hold a string'],
      answer: 0,
      why: 'It looks like the top level, but the `return` above it makes it conditional. When `user` arrives, the render calls one more hook than the last, and React throws "Rendered more hooks than during the previous render". Call every hook before returning.'
    },
    {
      q: 'You want an effect to do something only while `enabled` is true. What do you write?',
      choices: ['`useEffect(() => { if (!enabled) return; … }, [enabled]);`', '`if (enabled) { useEffect(() => { … }); }`', '`enabled && useEffect(() => { … });`'],
      answer: 0,
      why: 'The hook itself is called on every render; the condition goes inside it. The other two skip the call on some renders, which breaks the order.'
    },
    {
      q: 'Which of these may be called inside an `if`?',
      choices: ['`use(promise)`, React 19\'s `use`', '`useState`', '`useEffect`'],
      answer: 0,
      why: '`use` is the one exception: it may be called conditionally and in loops. Every hook whose name starts with `use` and a capital letter must be called at the top level.'
    }
  ];
})(window.RLT);
