/*
 * Quizzes for track 4 (Composition and shared state): three or more questions per lesson, keyed by
 * lesson id. The question shape is described at the top of data/quizzes-foundations.js; the choices
 * are shuffled every time, so never write "both of the above".
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};
  function jsx() { return '```jsx\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q['r-composition'] = [
    {
      q: 'What is prop drilling?',
      choices: ['Passing a prop through components that do not use it, only to reach one deeper down', 'Reading a prop with `props.x` instead of destructuring it', 'Changing a prop inside a child component'],
      answer: 0,
      why: 'The layers in between must name a prop they do not care about, so every new prop touches all of them, and none of them can be reused without it.'
    },
    {
      q: '`Header` only places a `<UserMenu user={user} />`. Which change frees it from knowing about `user`?',
      choices: ['`App` builds the menu and passes it in a slot: `<Header menu={<UserMenu user={user} />} />`', 'Rename the prop from `user` to `data`', 'Make `user` a global variable that `UserMenu` reads'],
      answer: 0,
      why: 'JSX is a value, so the component that owns the data can build the piece and hand it down. `Header` then renders `{menu}` and never sees the user.'
    },
    {
      q: 'What arrives in `children`?',
      choices: ['Whatever is written between the component\'s opening and closing tags', 'The components that the component itself renders', 'Every prop whose name starts with a capital letter'],
      answer: 0,
      why: '`<Card><p>Hi</p></Card>` gives `Card` a `children` prop holding the `<p>`. Other slots are ordinary props that happen to hold JSX.'
    },
    {
      q: 'When is context a better fix for drilling than slots?',
      choices: ['When many components at many depths need the same value, such as the theme', 'When two sibling components share one value', 'Always: slots are an older pattern'],
      answer: 0,
      why: 'Slots work when the owner of the data can build the piece. A value read in twenty places at different depths is what context is for. Two siblings sharing state is lifting state up.'
    }
  ];

  Q['r-context'] = [
    {
      q: 'Two providers of `ThemeContext` are above a component: `"light"` near the top, `"dark"` just above it. What does `useContext(ThemeContext)` return?',
      choices: ['`"dark"`: the nearest provider wins', '`"light"`: the outermost provider wins', 'The default given to `createContext`'],
      answer: 0,
      why: 'React looks up the tree and stops at the first provider of that context. An inner provider overrides an outer one for its part of the tree.'
    },
    {
      q: 'A component reads a context, but no provider of it is above the component. What does it get?',
      choices: ['The default value passed to `createContext`', '`undefined`, always', 'An error: a context must have a provider'],
      answer: 0,
      why: '`createContext(\'light\')` makes `\'light\'` the value for any reader with no provider above it.'
    },
    {
      q: 'How do you provide a context in React 19?',
      choices: ['`<ThemeContext value={theme}>…</ThemeContext>`', '`ThemeContext.set(theme)` before rendering', '`useContext(ThemeContext, theme)` in the parent'],
      answer: 0,
      why: 'In React 19 the context object is its own provider. Before 19 you wrote `<ThemeContext.Provider value={…}>`, which still works.'
    },
    {
      q: 'A provider\'s value changes. Which components render again because of it?',
      choices: ['Every component that reads that context, even inside a `memo` component', 'Only the provider\'s direct children', 'None: a context change shows up on the next unrelated render'],
      answer: 0,
      why: 'React finds the readers of the context and re-renders them. That is how a theme switch reaches every button, and why a fast-changing context costs re-renders everywhere it is read.'
    }
  ];

  Q['r-context-reducer'] = [
    {
      q: 'Why split a provider into a state context and a dispatch context?',
      choices: ['`dispatch` never changes, so components that only dispatch are not re-rendered when the state changes', 'A context can hold only one value at a time', 'React requires reducers to use two contexts'],
      answer: 0,
      why: 'Readers re-render when their context\'s value changes. A dispatch-only context never changes, so an Add button reading it is never re-rendered by the cart changing.'
    },
    {
      q: 'What is wrong with `<CartContext value={{ items, dispatch }}>`?',
      choices: ['It is a new object on every render, so every reader re-renders every time the provider renders', 'Context values cannot be objects', 'Nothing: it is the recommended way'],
      answer: 0,
      why: 'React compares the value with `Object.is`. A new object literal is never the same, so every reader of the context re-renders whenever the provider does.'
    },
    {
      q: 'The provider component holds the state and takes its content as `children`. When its state changes, does the page inside it re-render?',
      choices: ['Only the components that read a context whose value changed', 'Yes, all of it: a component\'s children always re-render with it', 'No component re-renders until the page reloads'],
      answer: 0,
      why: 'The `children` were made by the provider\'s parent, which did not render again, so they are the same elements and React skips them, except the readers of a changed context.'
    },
    {
      q: 'Which data does not belong in context?',
      choices: ['A value that changes many times a second, such as the mouse position', 'The signed-in user', 'The colour theme'],
      answer: 0,
      why: 'Every reader re-renders on every change. Fast-changing values belong in the component that uses them, or in a store with selectors.'
    }
  ];

  Q['r-error-boundaries'] = [
    {
      q: 'A component throws while rendering, and no error boundary is above it. What happens in React 19?',
      choices: ['React removes the whole app from the page', 'Only that component disappears; the rest stays', 'React shows the last good render of that component'],
      answer: 0,
      why: 'React cannot finish the tree, and a half-drawn page could show wrong data, so without a boundary the whole tree is unmounted. A boundary limits that to its own part.'
    },
    {
      q: 'Which error does an error boundary catch?',
      choices: ['One thrown while a child component renders', 'One thrown in a button\'s `onClick` handler', 'One thrown in a `setTimeout` callback'],
      answer: 0,
      why: 'Boundaries catch errors during rendering, in effects and in lifecycle methods. Event handlers and timers run outside rendering: catch those with `try`/`catch` or `.catch()`.'
    },
    {
      q: 'Which method of an error boundary returns the state that shows the fallback?',
      choices: ['`static getDerivedStateFromError(error)`', '`componentDidCatch(error, info)`', '`componentWillUnmount()`'],
      answer: 0,
      why: '`getDerivedStateFromError` runs during rendering and returns new state, such as `{ error }`. `componentDidCatch` runs afterwards, to log the error.'
    },
    {
      q: 'A dashboard has four independent widgets. Where do the boundaries go?',
      choices: ['One around each widget, so one failure leaves the other three working', 'One around the whole dashboard only', 'One around every button inside each widget'],
      answer: 0,
      why: 'A boundary should surround something that makes sense to lose on its own. One around all four hides all four when one breaks.'
    }
  ];

  Q['r-portals'] = [
    {
      q: 'Why does a menu inside a card with `overflow: hidden` get cut off, whatever its `z-index`?',
      choices: ['The ancestor\'s overflow clips its descendants; z-index only orders elements, it does not lift them out', 'z-index does not work on lists', 'Menus need `display: block` to show'],
      answer: 0,
      why: '`overflow`, `transform` and `filter` on an ancestor clip or contain a child. A portal moves the menu\'s DOM out of that ancestor altogether.'
    },
    {
      q: 'A button inside a portal (drawn into `<body>`) is clicked. Its React parent has `onClick`. Does that handler run?',
      choices: ['Yes: React events bubble through the React tree, not the DOM', 'No: the button is not inside the parent in the DOM', 'Only if the portal is drawn into `#root`'],
      answer: 0,
      why: 'For React the portal is where you wrote it. Plain DOM listeners see the DOM tree; React\'s handlers see the component tree.'
    },
    {
      q: 'Which is the right call to draw a dialog at the end of `<body>`?',
      choices: ['`createPortal(<Dialog />, document.body)`, imported from `react-dom`', '`document.body.appendChild(<Dialog />)`', '`useContext(document.body)`'],
      answer: 0,
      why: '`createPortal(children, domNode)` returns something to put in your JSX; React draws the children into that node and removes them when the portal leaves.'
    },
    {
      q: 'A component inside a portal reads `useContext(ThemeContext)`. Which provider does it see?',
      choices: ['The ones above the component that made the portal, as if the portal were not there', 'None: portals start a new tree with no context', 'Only a provider rendered inside `<body>`'],
      answer: 0,
      why: 'Context follows the React tree. The portal moves the DOM nodes, not the component\'s place in the tree.'
    }
  ];

  Q['r-logic-patterns'] = [
    {
      q: 'What is a higher-order component?',
      choices: ['A function that takes a component and returns a new component that wraps it', 'A component at the top of the tree', 'A component that renders more than one child'],
      answer: 0,
      why: '`withUser(Profile)` returns a component that does some work (loads the user) and renders `Profile` with an extra prop.'
    },
    {
      q: 'In `withUser(withSettings(Profile))` both HOCs pass a prop called `data`. What does `Profile` get?',
      choices: ['Only one of them: the inner HOC\'s `data` overwrites the outer one\'s, with no warning', 'An array with both values', 'An error about a duplicate prop'],
      answer: 0,
      why: 'The inner wrapper spreads the props it received, then sets `data` again. Colliding props are the classic HOC bug; hooks avoid it, because you name each value yourself.'
    },
    {
      q: 'Which is a render prop?',
      choices: ['`<MouseTracker render={pos => <Dot x={pos.x} />} />`', '`const pos = useMousePosition();`', '`export default withMouse(Dot);`'],
      answer: 0,
      why: 'A render prop is a function the component calls to decide what to draw, passing it its data. The second is a hook, the third a HOC.'
    },
    {
      q: 'Why did custom hooks replace HOCs and render props in new code?',
      choices: ['Several can be used in one component with no wrappers, no nesting and no prop name clashes', 'They run faster than components', 'HOCs no longer work in React 19'],
      answer: 0,
      why: 'Each hook returns a value into a variable you name. HOCs still work (memo is one), but stacking them adds wrappers and invisible props.'
    }
  ];

  Q['r-state-libraries'] = [
    {
      q: 'Products and orders loaded from the API: where do they belong?',
      choices: ['A server-data cache such as TanStack Query (or the framework\'s loaders)', 'A Redux slice, always', 'Context, read by every page'],
      answer: 0,
      why: 'Server data needs caching, refetching and sharing between components, which TanStack Query does. Most "global state" turns out to be server data.'
    },
    {
      q: 'What does a selector like `useCart(state => state.items.length)` give a component?',
      choices: ['It re-renders only when that number changes, not on every change to the store', 'A copy of the whole store', 'Write access to `items`'],
      answer: 0,
      why: 'The store compares what the selector returns with last time. Context cannot do that: every reader re-renders when its value changes.'
    },
    {
      q: 'In Redux, what is a reducer?',
      choices: ['A pure function `(state, action) => newState`', 'The function that sends an action to the store', 'A component that reads the store'],
      answer: 0,
      why: 'Dispatch sends an action; the reducer works out the next state from the current state and the action. Redux Toolkit\'s `createSlice` writes the action creators for you.'
    },
    {
      q: 'Which React hook do store libraries such as Zustand and React Redux use to subscribe a component to the store?',
      choices: ['`useSyncExternalStore`', '`useEffect` with `setInterval`', '`useContext`'],
      answer: 0,
      why: '`useSyncExternalStore(subscribe, getSnapshot)` re-renders the component when the store notifies and the snapshot changed, safely with concurrent rendering.'
    }
  ];
})(window.RLT);
