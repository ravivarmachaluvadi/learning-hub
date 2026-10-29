/*
 * Interview Q&A, track 3 (Effects and refs): questions 12, 13, 21 and 34 of 18_React_QA.md.
 * Its ★★★ questions (10, 11, 19, 20, 25, 41) came early, in data/interview-fast-track.js.
 * The question shape is described at the top of data/interview.js.
 */
(function (U) {
  var Q = U.data.questions = U.data.questions || [];
  function jsx() { return '```jsx\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q.push(
    {
      id: 'layout-effect', track: 'effects', weight: 2, source: '18_React_QA.md#12',
      q: 'useEffect vs useLayoutEffect',
      keywords: ['useLayoutEffect', 'useEffect', 'layout effect', 'before paint', 'after paint', 'flicker', 'measure', 'tooltip position', 'synchronous', 'blocks paint'],
      short: '`useEffect` runs **after** the browser has painted, so it never delays the screen: use it for almost everything. `useLayoutEffect` runs after React has updated the DOM but **before** the paint, and the browser waits for it. Use it only to measure the DOM and change something before the user sees it, such as positioning a tooltip without a flicker.',
      answer: [
        '| | `useEffect` | `useLayoutEffect` |\n|---|---|---|\n' +
        '| Runs | After the paint | After the DOM update, before the paint |\n' +
        '| Blocks the paint | No | Yes, until it finishes (and any state it sets is drawn) |\n' +
        '| Good for | Fetching, subscriptions, timers, logging: nearly everything | Measuring layout and adjusting it before anyone sees it |',
        jsx('function Tooltip({ targetRect, children }) {',
            '  const ref = useRef(null);',
            '  const [height, setHeight] = useState(0);',
            '',
            '  useLayoutEffect(() => {',
            '    setHeight(ref.current.getBoundingClientRect().height);   // measured before the paint',
            '  }, []);',
            '',
            '  const top = targetRect.top - height < 0 ? targetRect.bottom : targetRect.top - height;',
            '  return <div ref={ref} style={{ position: \'absolute\', top }}>{children}</div>;',
            '}'),
        '**Why the flicker happens with `useEffect`:** the first render puts the tooltip at its default place, the browser paints it there, then the effect measures and moves it, and the browser paints again. For one frame the user sees it jump. With `useLayoutEffect` the move happens between the DOM update and the first paint, so only the final position is ever drawn.',
        '**The cost:** everything in a layout effect, and the re-render it causes, holds up the screen. Keep it short. The order in one commit is: render, DOM update, layout effects, paint, effects.'
      ].join('\n\n'),
      followups: [
        'In what order do render, the DOM update, layout effects, the paint and effects happen?',
        'Why does measuring in `useEffect` cause a flicker?',
        'Name a case where `useLayoutEffect` is the wrong choice.'
      ],
      related: ['lesson:r-dom-refs', 'lesson:r-effects', 'explain:effect-timeline']
    },
    {
      id: 'use-ref', track: 'effects', weight: 2, source: '18_React_QA.md#13',
      q: 'What is useRef for?',
      keywords: ['useRef', 'ref', 'refs', 'ref.current', 'mutable', 'dom access', 'focus', 'timer id', 'previous value', 'state vs ref', 'no re-render'],
      short: '`useRef(initial)` returns an object, `{ current }`, that **survives re-renders**, and changing `current` **does not re-render**. Two uses: holding a **DOM node** (`<input ref={inputRef} />`, then `inputRef.current.focus()`), and keeping a **value the screen does not show**: a timer id, the previous value, the latest callback. If the screen should show it, it is state.',
      answer: [
        '| | State | Ref |\n|---|---|---|\n' +
        '| Survives re-renders | Yes | Yes |\n' +
        '| Changing it re-renders | Yes | No |\n' +
        '| Changed by | The setter; the new value arrives on the next render | Assigning `ref.current`, at once |\n' +
        '| Use for | What the screen shows | DOM nodes, timer ids, values only handlers and effects need |',
        jsx('function Stopwatch() {',
            '  const [elapsed, setElapsed] = useState(0);',
            '  const intervalRef = useRef(null);',
            '',
            '  function start() {',
            '    const startedAt = Date.now() - elapsed;',
            '    intervalRef.current = setInterval(() => setElapsed(Date.now() - startedAt), 50);',
            '  }',
            '  function stop() {',
            '    clearInterval(intervalRef.current);   // the id survived every tick\'s re-render',
            '  }',
            '  …',
            '}'),
        '**Why not a plain variable?** A `let` inside the component starts over on every render, so the id set in `start` is gone by the time `stop` runs. A variable outside the component survives, but is shared by every instance of it on the page.',
        '**The rule that catches people:** do not read or write `ref.current` during rendering (except to fill it once, lazily). The JSX would show a value that changing never redraws. Refs belong in event handlers and effects.',
        '**The latest-value trick:** an effect writes `latestRef.current = value` after every render, and a long-lived callback (an interval, a listener added once) reads it, so it never goes stale. React 19.2\'s `useEffectEvent` is the built-in way to do this.'
      ].join('\n\n'),
      followups: [
        'Why does a timer id kept in a `let` inside the component get lost?',
        'What is wrong with showing `{ref.current}` in the JSX?',
        'Write `usePrevious(value)`.',
        'When would you use a ref instead of state to avoid re-renders, and what do you give up?',
        'How does a ref help an interval read the latest state?'
      ],
      related: ['lesson:r-refs', 'lesson:r-dom-refs', 'build:carousel']
    },
    {
      id: 'lifecycle-vs-hooks', track: 'effects', weight: 2, source: '18_React_QA.md#21',
      q: 'Class lifecycle methods vs hooks',
      keywords: ['lifecycle', 'lifecycle methods', 'class component', 'componentDidMount', 'componentDidUpdate', 'componentWillUnmount', 'shouldComponentUpdate', 'PureComponent', 'getDerivedStateFromError', 'componentDidCatch', 'hooks vs classes'],
      short: 'Mount, update and unmount all map to `useEffect`: `componentDidMount` is `useEffect(fn, [])`, `componentDidUpdate` is `useEffect(fn, [deps])`, and `componentWillUnmount` is the cleanup the effect returns. `this.state` is `useState`, `shouldComponentUpdate` is `memo`. Error boundaries are the exception: there is no hook for them, so they are still classes.',
      answer: [
        '| Class component | Function component |\n|---|---|\n' +
        '| `constructor`, `this.state`, `this.setState` | `useState` (or `useReducer`) |\n' +
        '| `componentDidMount` | `useEffect(() => { … }, [])` |\n' +
        '| `componentDidUpdate(prevProps)` | `useEffect(() => { … }, [deps])` |\n' +
        '| `componentWillUnmount` | The cleanup function returned from `useEffect` |\n' +
        '| `shouldComponentUpdate`, `PureComponent` | `memo` |\n' +
        '| `getDerivedStateFromError`, `componentDidCatch` | No hook: an error boundary is still a class |\n' +
        '| Instance fields (`this.timerId`) | `useRef` |',
        jsx('// a class splits one concern across three methods',
            'componentDidMount()    { this.c = connect(this.props.roomId); }',
            'componentDidUpdate(p)  { if (p.roomId !== this.props.roomId) { this.c.close(); this.c = connect(this.props.roomId); } }',
            'componentWillUnmount() { this.c.close(); }',
            '',
            '// one effect keeps it together',
            'useEffect(() => {',
            '  const c = connect(roomId);',
            '  return () => c.close();',
            '}, [roomId]);'),
        '**The point to make:** hooks group code **by concern** (everything about the connection together), where classes grouped it **by moment** (everything on mount together, mixed with every other concern). And the effect version cannot forget the update case, which classes often did: the dependency array covers it.',
        '**Do not translate one to one.** "On mount" thinking leads to effects with missing dependencies. Ask what the effect keeps in step, and list what it reads.'
      ].join('\n\n'),
      followups: [
        'Which lifecycle method has no hook equivalent, and why does that matter?',
        'Why do hooks group code better than lifecycle methods?',
        'What did `componentDidUpdate` often get wrong that a dependency array gets right?',
        'How would you hold a class\'s instance field, such as `this.timerId`, in a function component?'
      ],
      related: ['lesson:r-effects', 'lesson:r-effect-cleanup', 'lesson:r-refs']
    },
    {
      id: 'ref-to-component', track: 'effects', weight: 2, source: '18_React_QA.md#34',
      q: 'How do you pass a ref to your own component?',
      keywords: ['ref as a prop', 'pass a ref', 'forwardRef', 'useImperativeHandle', 'ref prop', 'react 19 ref', 'focus a child input', 'ref to component'],
      short: 'In **React 19**, `ref` is a plain prop for function components: take it and put it on the element you mean, `function TextInput({ ref, ...props }) { return <input ref={ref} {...props} />; }`. **Before React 19**, the component had to be wrapped in `forwardRef((props, ref) => …)`, which still works and fills existing code. `useImperativeHandle` exposes a few methods, such as `focus()`, instead of the whole DOM node.',
      answer: [
        jsx('// React 19',
            'function TextInput({ ref, ...props }) {',
            '  return <input ref={ref} {...props} />;',
            '}',
            '',
            'function Form() {',
            '  const nameRef = useRef(null);',
            '  return (',
            '    <>',
            '      <TextInput ref={nameRef} placeholder="Name" />',
            '      <button onClick={() => nameRef.current.focus()}>Edit name</button>',
            '    </>',
            '  );',
            '}'),
        jsx('// before React 19: forwardRef',
            'const TextInput = forwardRef(function TextInput(props, ref) {',
            '  return <input ref={ref} {...props} />;',
            '});'),
        '**Exposing less than the node:** `useImperativeHandle(ref, () => ({ focus: () => inner.current.focus() }), [])` gives the parent exactly `focus()`. The child keeps its DOM private, and can change it without breaking the parent.',
        '**When to use it at all:** focus, scroll, measure, play media: things with no prop. If the parent wants to change what the child shows, pass a prop instead; a ref that reaches in to change things makes data flow hard to follow.'
      ].join('\n\n'),
      followups: [
        'What changed about `ref` in React 19, and what happens to `forwardRef`?',
        'Why expose methods with `useImperativeHandle` instead of the DOM node?',
        'When is passing a ref the wrong solution?',
        'A parent wants to scroll a list inside your component to one item. What would you expose?'
      ],
      related: ['lesson:r-dom-refs', 'lesson:r-refs', 'lesson:r-react-19-upgrade']
    }
  );
})(window.RLT);
