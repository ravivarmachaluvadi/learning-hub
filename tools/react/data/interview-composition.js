/*
 * Interview Q&A, track 4 (Composition and shared state): questions 17, 22, 30, 33 and 35 of
 * 18_React_QA.md. Its ★★★ questions (16, 29) came early, in data/interview-fast-track.js.
 * The question shape is described at the top of data/interview.js.
 */
(function (U) {
  var Q = U.data.questions = U.data.questions || [];
  function jsx() { return '```jsx\n' + [].slice.call(arguments).join('\n') + '\n```'; }
  function js() { return '```js\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q.push(
    {
      id: 'prop-drilling', track: 'composition', weight: 2, source: '18_React_QA.md#17',
      q: 'What is prop drilling, and how do you avoid it?',
      keywords: ['prop drilling', 'drilling', 'composition', 'children', 'slots', 'context', 'pass props down', 'deeply nested'],
      short: '**Prop drilling** is passing a prop through components that do not use it, only to reach one deeper down. Every layer must know about it, so changes ripple through all of them. Fixes, simplest first: **composition** (the owner builds the piece and passes it down as `children` or a slot, so the middle layers never see the data); **context**, for values needed widely that change rarely; a **state library** for app-wide state that changes often.',
      answer: [
        jsx('// drilled: Page and Header only pass user along',
            '<Page user={user} />  →  <Header user={user} />  →  <UserMenu user={user} />',
            '',
            '// composed: App builds the menu; Page and Header only place it',
            '<Page header={<Header menu={<UserMenu user={user} />} />}>',
            '  <Inbox />',
            '</Page>'),
        '| Fix | Use it when | Cost |\n|---|---|---|\n' +
        '| Composition (`children`, slot props) | The owner of the data can build the piece that needs it | None; often simplifies the layout components too |\n' +
        '| Context | Many components at many depths read the same value, which changes rarely (theme, user, language) | Every reader re-renders when the value changes |\n' +
        '| A store (Zustand, Redux Toolkit) | App-wide client state that changes often | A dependency and its patterns |',
        '**Is drilling always bad?** No. Two or three levels of explicit props are easy to follow and to search. Drilling becomes a problem when the middle layers are many, generic, or reused elsewhere.',
        '**The point interviewers like:** reach for composition before context. Context hides where a value comes from and costs re-renders; a slot keeps the data flow visible.'
      ].join('\n\n'),
      followups: [
        'How does passing JSX as a prop remove the drilling?',
        'When is drilling through two or three levels perfectly fine?',
        'Why might context make a page slower than drilling?',
        'What does "lift content up" mean, and how does it help performance?'
      ],
      related: ['lesson:r-composition', 'lesson:r-context', 'lesson:r-children']
    },
    {
      id: 'error-boundaries', track: 'composition', weight: 2, source: '18_React_QA.md#22',
      q: 'What are error boundaries?',
      keywords: ['error boundary', 'error boundaries', 'getDerivedStateFromError', 'componentDidCatch', 'fallback ui', 'react-error-boundary', 'crash', 'white screen'],
      short: 'An **error boundary** is a component that catches errors thrown **while rendering** its children (and in their effects and lifecycle methods) and shows a fallback instead of a blank page. It is still a **class** with `static getDerivedStateFromError` (render the fallback) and `componentDidCatch` (log it), or the `react-error-boundary` package. It does **not** catch errors in event handlers, async code or itself.',
      answer: [
        jsx('class ErrorBoundary extends React.Component {',
            '  state = { hasError: false };',
            '  static getDerivedStateFromError() { return { hasError: true }; }',
            '  componentDidCatch(error, info) { logToService(error, info.componentStack); }',
            '  render() {',
            '    return this.state.hasError ? <p>Something went wrong.</p> : this.props.children;',
            '  }',
            '}',
            '',
            '<ErrorBoundary><Dashboard /></ErrorBoundary>'),
        '| Thrown in | Caught by a boundary? |\n|---|---|\n' +
        '| Rendering, effects, class lifecycle methods | Yes |\n' +
        '| Event handlers | No: `try`/`catch` in the handler |\n' +
        '| `setTimeout`, promises, `fetch` | No: `.catch()` it, or rethrow it inside a state update |\n' +
        '| Server-side rendering | No |\n' +
        '| The boundary itself | No: the next boundary up catches it |',
        '**Why:** without a boundary, React 19 unmounts the whole tree when rendering throws, because a half-drawn UI could show wrong data.',
        '**Placement:** one at the top for a friendly crash page, more around independent sections (each route, each dashboard widget, a comments section), so one broken part does not take down the rest. Reset a boundary with a "Try again" button that clears its state, or by changing its `key`.',
        '**Why still a class?** There is no hook equivalent of `getDerivedStateFromError`; `react-error-boundary` wraps the class and adds `resetKeys`, `onReset` and a `useErrorBoundary` hook to send async errors to it. React 19 also adds `onCaughtError` and `onUncaughtError` on `createRoot`, for logging.'
      ].join('\n\n'),
      followups: [
        'Why does an error in an `onClick` handler not reach a boundary, and what do you do instead?',
        'How do you let the user retry after a boundary has caught an error?',
        'Where would you place boundaries in a dashboard?',
        'Why are error boundaries still class components?',
        'How do you get an error from a failed `fetch` into a boundary?'
      ],
      related: ['lesson:r-error-boundaries', 'q:lifecycle-vs-hooks']
    },
    {
      id: 'redux-toolkit', track: 'composition', weight: 2, source: '18_React_QA.md#30',
      q: 'Redux and Redux Toolkit: the basics',
      keywords: ['redux', 'redux toolkit', 'rtk', 'store', 'action', 'reducer', 'dispatch', 'selector', 'createSlice', 'configureStore', 'useSelector', 'useDispatch', 'immer', 'rtk query'],
      short: 'Redux keeps app state in one **store**. Components **dispatch** **actions** (objects that say what happened), a pure **reducer** `(state, action) => newState` works out the next state, and **selectors** read slices (`useSelector`), re-rendering a component only when its slice changes. **Redux Toolkit** is how Redux is written today: `createSlice` makes the reducer and action creators, Immer lets reducers "mutate" safely, and `configureStore` sets up the store and DevTools.',
      answer: [
        js("import { configureStore, createSlice } from '@reduxjs/toolkit';",
           '',
           'const cartSlice = createSlice({',
           "  name: 'cart',",
           '  initialState: { items: [] },',
           '  reducers: {',
           '    added(state, action) { state.items.push(action.payload); },   // Immer makes this immutable',
           '    cleared(state) { state.items = []; }',
           '  }',
           '});',
           '',
           'export const { added, cleared } = cartSlice.actions;',
           'export const store = configureStore({ reducer: { cart: cartSlice.reducer } });',
           '',
           '// in a component',
           'const items = useSelector(state => state.cart.items);',
           'const dispatch = useDispatch();',
           'dispatch(added(product));'),
        '| Term | What it is |\n|---|---|\n' +
        '| Store | One object holding the app\'s state; `<Provider store={store}>` makes it reachable |\n' +
        '| Action | `{ type: \'cart/added\', payload }`: what happened |\n' +
        '| Reducer | A pure function from the state and an action to the next state |\n' +
        '| Dispatch | Sends an action to the store |\n' +
        '| Selector | Reads a slice; the component re-renders when that slice changes |\n' +
        '| Thunk | An async function dispatched like an action (`createAsyncThunk`) |',
        '**When Redux fits:** a large app with complex shared client state, many developers, a need for strict patterns, and its DevTools (every action logged, time-travel debugging). **RTK Query** handles server data inside Redux.',
        '**When it does not:** small and medium apps, where Zustand or context with `useReducer` is less code, and apps whose "global state" is mostly server data, which TanStack Query handles better.'
      ].join('\n\n'),
      followups: [
        'Why must a reducer be pure, and how can RTK reducers "mutate" the state?',
        'How does `useSelector` decide whether to re-render a component?',
        'Redux Toolkit or Zustand: how would you choose?',
        'What is RTK Query, and when would you use TanStack Query instead?',
        'Where do async requests go in Redux?'
      ],
      related: ['lesson:r-state-libraries', 'lesson:r-use-reducer', 'q:state-management']
    },
    {
      id: 'portals', track: 'composition', weight: 1, source: '18_React_QA.md#33',
      q: 'What are portals for?',
      keywords: ['portal', 'portals', 'createPortal', 'modal', 'tooltip', 'dropdown', 'overflow hidden', 'z-index', 'event bubbling', 'document.body'],
      short: '`createPortal(children, domNode)` renders children into a **different DOM node**, usually `document.body`, while they stay in the **same React tree**: props, context and event bubbling follow the component tree, not the DOM. Use it for modals, tooltips, dropdowns and toasts that must escape a parent\'s `overflow: hidden`, `z-index` or `transform`.',
      answer: [
        jsx("import { createPortal } from 'react-dom';",
            '',
            'function Modal({ children, onClose }) {',
            '  return createPortal(',
            '    <div className="backdrop" onClick={onClose}>',
            '      <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>',
            '        {children}',
            '      </div>',
            '    </div>,',
            '    document.body',
            '  );',
            '}'),
        '**The two trees:** in the DOM the modal is a child of `<body>`; in React it is still inside the component that rendered it. So a click inside it **bubbles to that component\'s React ancestors**, and it reads context from the providers above them. Plain DOM listeners see the DOM tree instead.',
        '**Why not just z-index?** A parent with `overflow: hidden` clips its children, and `transform` or `filter` create a containing block that traps even `position: fixed`. No z-index escapes that; moving the DOM node does.',
        '**What a portal does not do:** accessibility. A dialog still needs `role="dialog"`, `aria-modal`, focus moved in and returned, a focus trap, Escape to close. The native `<dialog>` element with `showModal()` puts itself in the browser\'s top layer and handles some of this.'
      ].join('\n\n'),
      followups: [
        'A click inside a portal: which `onClick` handlers run?',
        'Why can z-index not lift a menu out of a card with `overflow: hidden`?',
        'What else does a modal need besides a portal?',
        'When would you use the native `<dialog>` element instead?'
      ],
      related: ['lesson:r-portals', 'build:modal']
    },
    {
      id: 'hocs-render-props', track: 'composition', weight: 2, source: '18_React_QA.md#35',
      q: 'HOCs, render props and hooks: how do they compare?',
      keywords: ['hoc', 'higher-order component', 'higher order component', 'render props', 'render prop', 'custom hooks', 'sharing logic', 'wrapper hell', 'prop collision', 'withRouter', 'connect'],
      short: 'Three ways to share stateful logic. A **higher-order component** is a function that wraps a component and passes it extra props (`withAuth(Page)`). A **render prop** is a component that calls your function to draw (`<Mouse render={pos => …} />`). A **custom hook** is a function the component calls (`const pos = useMousePosition()`). Hooks are the modern default; HOCs and render props remain in older code and some libraries.',
      answer: [
        '| Pattern | Example | Drawback |\n|---|---|---|\n' +
        '| Higher-order component | `export default withAuth(Dashboard)` | "Wrapper hell" in DevTools; props from two HOCs can collide; where a prop comes from is invisible |\n' +
        '| Render props | `<Mouse render={pos => <Cursor pos={pos} />} />` | Nesting grows deep when several are combined |\n' +
        '| Custom hooks | `const pos = useMousePosition();` | Must follow the rules of hooks |',
        jsx('// two HOCs that both pass "data": the inner one silently wins',
            'export default withUser(withSettings(Profile));',
            '',
            '// hooks: each value has a name you chose',
            'function Profile() {',
            '  const user = useUser();',
            '  const [settings, toggleDark] = useSettings();',
            '  …',
            '}'),
        '**Where they still appear:** `memo` and `forwardRef` are HOC-shaped; React Redux\'s `connect()` and React Router 5\'s `withRouter` are HOCs; render props live on where a component draws around content you choose (a virtual list\'s `renderRow`, `<Context.Consumer>`).',
        '**Converting a HOC to a hook:** move the HOC\'s state and effects into a `use…` function that returns what the HOC passed as a prop, then call it in the component.'
      ].join('\n\n'),
      followups: [
        'What goes wrong when two HOCs pass a prop with the same name?',
        'Convert `withWindowWidth(Component)` into a hook.',
        'When is a render prop still a good choice?',
        'Is `memo` a HOC?'
      ],
      related: ['lesson:r-logic-patterns', 'lesson:r-custom-hooks', 'q:custom-hooks']
    }
  );
})(window.RLT);
