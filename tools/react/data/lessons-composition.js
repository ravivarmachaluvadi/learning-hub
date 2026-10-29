/*
 * Lessons, track 4: Composition and shared state.
 *
 * The lesson shape, and how the code is written (template literals that never use `${`), are
 * described at the top of data/lessons-foundations.js. Like batch 3's, every challenge of this
 * track says `strict: true` (its preview runs inside <StrictMode>, as a new React project does);
 * the examples do not, so their consoles read simply. Some checks count renders with t.renders()
 * (js/preview.js): "adding to the cart re-renders no ProductCard" needs no counting code in yours.
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  function block(lang, lines) { return '```' + lang + '\n' + lines.join('\n') + '\n```'; }
  function jsx() { return block('jsx', [].slice.call(arguments)); }
  function js() { return block('js', [].slice.call(arguments)); }

  L.push(
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'r-composition', track: 'composition',
      title: 'Composition: children instead of drilling',
      summary: 'When a value has to pass through components that never use it, that is prop drilling. Often the fix is not a new tool but a new shape: the component that owns the data builds the piece that needs it, and passes the finished piece down as children or as a named slot.',
      keywords: ['composition', 'prop drilling', 'drilling', 'children', 'slots', 'slot props', 'layout component', 'pass jsx as props', 'jsx as a prop', 'containment', 'props.children', 'compose components'],
      docs: 'https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children',
      body: [
        'A mailbox page shows the signed-in user in a menu at the top right. The user lives in `App`, the menu is three layers down, and the two layers in between hand it along without ever using it:',
        jsx('function App() {',
            "  const [user, setUser] = useState({ name: 'Asha' });",
            '  return <Page user={user} />;',
            '}',
            '',
            'function Page({ user }) {          // does not use user…',
            '  return <Header user={user} />;',
            '}',
            '',
            'function Header({ user }) {        // …nor does this',
            '  return <header>Mailbox <UserMenu user={user} /></header>;',
            '}'),
        'That is **prop drilling**. It works, but every layer must know about data it does not care about: give `UserMenu` one more prop (an `onSignOut`) and you edit three components, and neither `Page` nor `Header` can be used anywhere without a user.',
        '## Pass what is built, not what to build it from',
        'Turn it round. `App`, which owns the user, builds the menu itself and hands the finished piece down; the layers in between only put it in place:',
        jsx('function App() {',
            "  const [user, setUser] = useState({ name: 'Asha' });",
            '  return (',
            '    <Page header={<Header menu={<UserMenu user={user} />} />}>',
            '      <Inbox />',
            '    </Page>',
            '  );',
            '}',
            '',
            'function Page({ header, children }) {',
            '  return <div className="page">{header}<main>{children}</main></div>;',
            '}',
            '',
            'function Header({ menu }) {',
            '  return <header>Mailbox {menu}</header>;',
            '}'),
        '`Page` and `Header` no longer mention the user at all. What sits between a component\'s tags arrives as `children` ([[lesson:r-children]]); any other piece of JSX can travel in a prop of its own, a **slot**: `header`, `sidebar`, `actions`, `menu`.',
        '## Layout components',
        '| A component that | Takes | Example |\n|---|---|---|\n' +
        '| Frames some content | `children` | `<Card>…</Card>`, `<Modal>…</Modal>` |\n' +
        '| Has several areas | One slot prop per area | `<Layout header={…} sidebar={…}>…</Layout>` |\n' +
        '| Varies one small part | A slot for that part | `<Button icon={<SaveIcon />}>Save</Button>` |',
        'Most design systems are built this way: generic boxes that place what they are given. The data stays with the components that use it, and a change to `UserMenu` touches `App` and `UserMenu`, nothing else.',
        '## When composition is not enough',
        'Slots work when the component that owns the data can build the piece. When many components at many depths need the same value (the theme, the language, a user read in twenty places), handing pieces around becomes its own tangle. That is what **context** is for: [[lesson:r-context]]. The interview question is [[q:prop-drilling]].',
        'A bonus: when a component\'s own state changes, the `children` and slots it was given are the very same elements as before (its parent made them), so React does not render them again. [[lesson:r-rendering]] uses that to make a page faster.'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript a function that builds part of a page can take ready-made pieces instead of the data to make them: `renderPage({ header: buildHeader(menuEl), body: inboxEl })`, where the page function only does `main.append(body)`. `children` and slot props are the same idea in JSX: the code that knows the data builds the piece, and the layout puts it in place.',
      example: {
        code: `import { useState } from 'react';

function Layout({ header, sidebar, children }) {
  return (
    <div className="layout">
      <header className="top">{header}</header>
      <aside className="side">{sidebar}</aside>
      <main className="main">{children}</main>
    </div>
  );
}

function Avatar({ user }) {
  return <span className="avatar">{user.name[0]}</span>;
}

export default function App() {
  const [user, setUser] = useState({ name: 'Asha', unread: 3 });

  return (
    <Layout
      header={<><b>Mailbox</b> <Avatar user={user} /></>}
      sidebar={<p>Inbox ({user.unread})</p>}
    >
      <p>Hello, {user.name}.</p>
      <button onClick={() => setUser({ ...user, unread: 0 })}>Read all</button>
    </Layout>
  );
}
`,
        css: '.layout { display: grid; grid-template-columns: 110px 1fr; gap: 6px; max-width: 420px; } .top { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-radius: 8px; background: #20232a; color: #fff; } .side, .main { padding: 6px 10px; border: 1px solid #ccd; border-radius: 8px; } .side p, .main p { margin: 0 0 6px; } .avatar { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #61dafb; color: #20232a; font-weight: 700; }',
        note: 'Click **Read all**: the sidebar changes, yet `Layout` never received `user`; it only placed what `App` gave it. Add a `footer` slot to `Layout` and pass it `<small>…</small>` from `App`.'
      },
      challenge: {
        title: 'A user menu that no layer passes along',
        strict: true,
        task: '`Page` and `Header` take `user` and `onSignOut` only to pass them on to `UserMenu`. Reshape the code so that neither of them takes, passes or mentions `user` or `onSignOut`:\n\n' +
          '- `App` builds `<UserMenu … />` itself and hands it down in a slot: for example `Header` takes a `menu` prop, and `Page` takes the whole header in a `header` prop.\n' +
          '- It still works: the header shows `Asha` and **Sign out**; Sign out shows "Signed out" in the menu and "Goodbye" in the page.\n\n' +
          'Keep the class names: the checks look for `.header`, `.name`, `.sign-out`, `.signed-out` and `.welcome`.',
        starter: `import { useState } from 'react';

function UserMenu({ user, onSignOut }) {
  if (!user) return <span className="signed-out">Signed out</span>;
  return (
    <span className="user-menu">
      <b className="name">{user.name}</b>{' '}
      <button className="sign-out" onClick={onSignOut}>Sign out</button>
    </span>
  );
}

function Header({ user, onSignOut }) {
  return (
    <header className="header">
      <b>Mailbox</b>
      <UserMenu user={user} onSignOut={onSignOut} />
    </header>
  );
}

function Page({ user, onSignOut, children }) {
  return (
    <div className="page">
      <Header user={user} onSignOut={onSignOut} />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState({ name: 'Asha' });
  return (
    <Page user={user} onSignOut={() => setUser(null)}>
      <p className="welcome">{user ? 'Welcome back, ' + user.name : 'Goodbye'}</p>
    </Page>
  );
}
`,
        solution: `import { useState } from 'react';

function UserMenu({ user, onSignOut }) {
  if (!user) return <span className="signed-out">Signed out</span>;
  return (
    <span className="user-menu">
      <b className="name">{user.name}</b>{' '}
      <button className="sign-out" onClick={onSignOut}>Sign out</button>
    </span>
  );
}

function Header({ menu }) {
  return (
    <header className="header">
      <b>Mailbox</b>
      {menu}
    </header>
  );
}

function Page({ header, children }) {
  return (
    <div className="page">
      {header}
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState({ name: 'Asha' });
  return (
    <Page header={<Header menu={<UserMenu user={user} onSignOut={() => setUser(null)} />} />}>
      <p className="welcome">{user ? 'Welcome back, ' + user.name : 'Goodbye'}</p>
    </Page>
  );
}
`,
        css: '.header { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; background: #eef2f7; max-width: 360px; } .page main { padding: 4px 10px; }',
        hints: [
          'Start with `Header`: instead of `{ user, onSignOut }` let it take `{ menu }`, and put `{menu}` where `<UserMenu … />` was.',
          'Then `Page`: let it take `{ header, children }` and put `{header}` where `<Header … />` was.',
          'Now `App` builds the pieces: `<Page header={<Header menu={<UserMenu user={user} onSignOut={() => setUser(null)} />} />}>`. JSX is a value, so it can go in any prop.'
        ],
        checks: [
          { label: 'The header shows Asha and Sign out', fn: `function (doc, win, t) {
  if (t.text('.header .name') !== 'Asha') return 'the header\\'s .name says "' + t.text('.header .name') + '"';
  return !!doc.querySelector('.header .sign-out') || 'no .sign-out button in the header';
}` },
          { label: 'Sign out: "Signed out" in the header, "Goodbye" in the page', fn: `async function (doc, win, t) {
  await t.click('.sign-out');
  if (!doc.querySelector('.header .signed-out')) return 'after Sign out, the header has no .signed-out';
  return t.text('.welcome') === 'Goodbye' || '.welcome says "' + t.text('.welcome') + '"';
}` },
          { label: '`Page` and `Header` no longer take, pass or mention `user` or `onSignOut`', fn: `function (doc, win, t) {
  var src = t.source(), bad = [];
  ['Page', 'Header'].forEach(function (name) {
    var m = new RegExp('(?:function\\\\s+' + name + '\\\\b|(?:const|let)\\\\s+' + name + '\\\\s*=)').exec(src);
    if (!m) return;
    var rest = src.slice(m.index + 1), end = rest.search(/\\n(?:export\\s+)?(?:default\\s+)?(?:function|const|let|class)\\s/);
    var body = src.slice(m.index, m.index + 1 + (end < 0 ? rest.length : end));
    if (/\\buser\\b|onSignOut/.test(body)) bad.push(name);
  });
  return !bad.length || bad.join(' and ') + ' still mention' + (bad.length === 1 ? 's' : '') + ' user or onSignOut';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'r-context', track: 'composition',
      title: 'Context: data for a whole subtree',
      summary: 'Context lets a component offer a value to every component below it, at any depth, with no props in between. Make one with createContext, provide it with <MyContext value={…}>, read it with useContext. The nearest provider above a component wins.',
      keywords: ['context', 'useContext', 'createContext', 'provider', 'Context.Provider', 'consumer', 'theme', 'default value', 'nearest provider', 'use(context)', 'context api', 'pass data deeply'],
      docs: 'https://react.dev/learn/passing-data-deeply-with-context',
      body: [
        'Some values are needed almost everywhere: the colour theme, the language, the signed-in user. Threading them through every layer as props is drilling at its worst. **Context** lets a component make a value available to its whole subtree, however deep:',
        jsx("import { createContext, useContext, useState } from 'react';",
            '',
            '// 1. create it once, outside any component, with a default',
            "const ThemeContext = createContext('light');",
            '',
            '// 2. provide a value to everything inside',
            'function App() {',
            "  const [theme, setTheme] = useState('dark');",
            '  return (',
            '    <ThemeContext value={theme}>',
            '      <Page />',
            '    </ThemeContext>',
            '  );',
            '}',
            '',
            '// 3. read it at any depth, with no props in between',
            'function Button({ children }) {',
            '  const theme = useContext(ThemeContext);',
            "  return <button className={'btn-' + theme}>{children}</button>;",
            '}'),
        'In React 19 the context is its own provider: `<ThemeContext value={…}>`. Before 19 you wrote `<ThemeContext.Provider value={…}>`, which still works and fills existing code.',
        '## Which value a component gets',
        '| Above the component there is | `useContext(ThemeContext)` returns |\n|---|---|\n' +
        '| One provider | Its `value` |\n' +
        '| Several providers | The **nearest** one\'s: an inner provider overrides an outer one for its part of the tree |\n' +
        '| No provider | The default given to `createContext` |',
        'So one section of a page can say "everything in here is dark" by wrapping itself in `<ThemeContext value="dark">`, whatever the rest of the app uses.',
        '## A change re-renders every reader',
        'When a provider\'s `value` changes, React renders again every component that reads that context, even one inside a `memo` component that would otherwise be skipped. That is how a theme switch reaches every button. It is also the cost: a value that changes on every keystroke re-renders all its readers on every keystroke. [[lesson:r-context-reducer]] shows how to keep that small.',
        '## Context is not state',
        'Context only **passes** a value down; it stores nothing and changes nothing. Pair it with state: the provider\'s component holds `useState`, and puts the value (and, when children must change it, the setter) into the context.',
        '## use(Context)',
        'React 19\'s `use(ThemeContext)` reads a context too. Unlike `useContext`, it may be called inside an `if` or a loop: the one exception to [[lesson:r-rules-of-hooks]].',
        '- **Good uses:** the theme, the language, the signed-in user, feature flags: values many components need that change rarely.\n' +
        '- **Think twice:** data only two components share (lift the state up, [[lesson:r-lifting-state]]), or a deep layout that could take slots ([[lesson:r-composition]]).',
        'The interview question is [[q:context]].'
      ].join('\n\n'),
      plainjs: 'Plain JavaScript reaches deep code with a global (`window.theme`) or by passing the value down by hand. A global has one value for the whole page and tells nobody when it changes. Context is a scoped global: one value per part of the tree, a nearer provider overriding a farther one, and React re-renders every reader when the value changes. CSS custom properties behave the same way: `--accent` set on a section applies to everything inside it.',
      example: {
        code: `import { useState, createContext, useContext } from 'react';

const ThemeContext = createContext('light');

function Button({ children }) {
  const theme = useContext(ThemeContext);
  return <button className={'btn btn-' + theme}>{children}</button>;
}

function Panel({ title }) {
  const theme = useContext(ThemeContext);
  return (
    <section className={'panel panel-' + theme}>
      <h4>{title}</h4>
      <Button>Open</Button> <Button>Share</Button>
    </section>
  );
}

export default function App() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext value={theme}>
      <label>
        <input type="checkbox" checked={theme === 'dark'} onChange={e => setTheme(e.target.checked ? 'dark' : 'light')} /> Dark mode
      </label>
      <Panel title="Follows the switch" />
      <ThemeContext value="dark">
        <Panel title="Always dark: a nearer provider" />
      </ThemeContext>
    </ThemeContext>
  );
}
`,
        css: '.panel { margin-top: 8px; padding: 6px 10px 10px; border-radius: 8px; border: 1px solid #ccd; max-width: 320px; } .panel h4 { margin: 0 0 6px; } .panel-dark { background: #20232a; color: #eee; border-color: #20232a; } .btn { padding: 3px 10px; border-radius: 6px; border: 1px solid #99a; } .btn-light { background: #fff; color: #20232a; } .btn-dark { background: #3a3f4b; color: #61dafb; border-color: #61dafb; }',
        note: 'Tick **Dark mode**: the first panel and its buttons follow it; the second stays dark, because the provider nearest to it says so. Delete the outer `<ThemeContext value={theme}>` (and its closing tag): the first panel falls back to the default, `light`.'
      },
      challenge: {
        title: 'A theme that reaches every button',
        strict: true,
        task: '**Switch theme** changes `theme` in `App`, but no `Button` knows about it: each is stuck on `light`. Use context so that:\n\n' +
          '- Every `Button` has the class `btn-light` or `btn-dark`, following the theme.\n' +
          '- The buttons inside `<section className="danger">` are always `btn-dark`, whatever the theme: give that section its own provider.\n' +
          '- No `theme` prop is passed to `Toolbar`, `Panel`, `Card` or `Button`.',
        starter: `import { useState, createContext, useContext } from 'react';

function Button({ children }) {
  const theme = 'light';   // TODO: the theme of the nearest provider
  return <button className={'btn btn-' + theme}>{children}</button>;
}

function Toolbar() {
  return (
    <div className="toolbar">
      <Button>Bold</Button>
      <Button>Italic</Button>
    </div>
  );
}

function Card({ title }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <Button>Open</Button>
    </div>
  );
}

function Panel() {
  return (
    <div className="panel">
      <Card title="Drafts" />
      <section className="danger">
        <Card title="Delete account" />
      </section>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState('light');
  return (
    <div className={'app app-' + theme}>
      <button className="switch" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Switch theme</button>
      <Toolbar />
      <Panel />
    </div>
  );
}
`,
        solution: `import { useState, createContext, useContext } from 'react';

const ThemeContext = createContext('light');

function Button({ children }) {
  const theme = useContext(ThemeContext);
  return <button className={'btn btn-' + theme}>{children}</button>;
}

function Toolbar() {
  return (
    <div className="toolbar">
      <Button>Bold</Button>
      <Button>Italic</Button>
    </div>
  );
}

function Card({ title }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <Button>Open</Button>
    </div>
  );
}

function Panel() {
  return (
    <div className="panel">
      <Card title="Drafts" />
      <ThemeContext value="dark">
        <section className="danger">
          <Card title="Delete account" />
        </section>
      </ThemeContext>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext value={theme}>
      <div className={'app app-' + theme}>
        <button className="switch" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Switch theme</button>
        <Toolbar />
        <Panel />
      </div>
    </ThemeContext>
  );
}
`,
        css: '.app { padding: 8px; border-radius: 8px; } .app-dark { background: #20232a; color: #eee; } .toolbar, .card { margin-top: 6px; } .card h4 { margin: 4px 0; } .danger { margin-top: 6px; padding: 4px 8px; border: 1px dashed #c62828; border-radius: 6px; } .btn { margin-right: 4px; padding: 2px 10px; border-radius: 6px; border: 1px solid #99a; } .btn-light { background: #fff; color: #20232a; } .btn-dark { background: #3a3f4b; color: #61dafb; }',
        hints: [
          'Create the context outside every component: `const ThemeContext = createContext(\'light\');`. In `Button`, read it: `const theme = useContext(ThemeContext);`.',
          'In `App`, wrap everything it returns in `<ThemeContext value={theme}>…</ThemeContext>`: every `Button` below now reads the current theme.',
          'For the danger zone, wrap the `<section className="danger">` in `<ThemeContext value="dark">`. The nearest provider wins, so its buttons stay dark.'
        ],
        checks: [
          { label: 'At the start the buttons are light, the danger zone\'s dark', fn: `function (doc) {
  var btns = [].slice.call(doc.querySelectorAll('.btn'));
  if (btns.length < 4) return 'only ' + btns.length + ' .btn buttons';
  var wrong = btns.filter(function (b) { return !b.classList.contains(b.closest('.danger') ? 'btn-dark' : 'btn-light'); });
  return !wrong.length || wrong.length + ' button(s) have the wrong theme, such as "' + wrong[0].textContent + '" (' + wrong[0].className + ')';
}` },
          { label: 'Switch theme: every button turns dark', fn: `async function (doc, win, t) {
  await t.click('.switch');
  var light = [].slice.call(doc.querySelectorAll('.btn')).filter(function (b) { return !b.classList.contains('btn-dark'); });
  return !light.length || 'after the switch, ' + light.length + ' button(s) are not btn-dark, such as "' + light[0].textContent + '"';
}` },
          { label: 'Switch back: light again, but the danger zone stays dark', fn: `async function (doc, win, t) {
  await t.click('.switch');
  var wrong = [].slice.call(doc.querySelectorAll('.btn')).filter(function (b) { return !b.classList.contains(b.closest('.danger') ? 'btn-dark' : 'btn-light'); });
  return !wrong.length || wrong.length + ' button(s) have the wrong theme, such as "' + wrong[0].textContent + '" (' + wrong[0].className + ')';
}` },
          { label: 'Context carries it: `useContext` is called, and no `theme` prop is passed down', fn: `function (doc, win, t) {
  var src = t.source();
  if (!/\\buse(?:Context)?\\s*\\(\\s*\\w+/.test(src) || !/createContext\\s*\\(/.test(src)) return 'no createContext(…) and useContext(…) in the code';
  var m = /<(Toolbar|Panel|Card|Button)\\b[^>]*\\btheme=/.exec(src);
  return !m || '<' + m[1] + '> still gets a theme prop';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'r-context-reducer', track: 'composition',
      title: 'Context and a reducer: shared state',
      summary: 'For state a whole page shares, keep it in one provider component with useReducer, and pass the state and dispatch down in two contexts. The readers of the state re-render when it changes; components that only dispatch never do.',
      keywords: ['context and reducer', 'useReducer and context', 'provider component', 'dispatch context', 'split context', 'useCart', 'custom provider', 'context re-render', 'context performance', 'memoize context value', 'app state', 'shared state', 'store without a library'],
      docs: 'https://react.dev/learn/scaling-up-with-reducer-and-context',
      body: [
        'A shop page: product cards add to a cart, a badge in the header counts it, a list shows it. They sit in different branches, so the cart lives above them all. [[lesson:r-use-reducer]] for the changes and [[lesson:r-context]] for the reach make a small store, with no library:',
        jsx('const CartContext = createContext(null);',
            'const CartDispatchContext = createContext(null);',
            '',
            'function CartProvider({ children }) {',
            '  const [items, dispatch] = useReducer(cartReducer, []);',
            '  return (',
            '    <CartContext value={items}>',
            '      <CartDispatchContext value={dispatch}>{children}</CartDispatchContext>',
            '    </CartContext>',
            '  );',
            '}',
            '',
            'export function useCart() {',
            '  return useContext(CartContext);',
            '}',
            '',
            'export function useCartDispatch() {',
            '  const dispatch = useContext(CartDispatchContext);',
            "  if (!dispatch) throw new Error('useCartDispatch must be used inside <CartProvider>');",
            '  return dispatch;',
            '}'),
        'The app wraps itself in `<CartProvider>` once, and calls `useCart()` or `useCartDispatch()` wherever it needs them. Components never touch the contexts themselves: the two hooks are the whole interface, and the error says plainly what is wrong when a component is used outside the provider.',
        '## Who re-renders',
        'When `items` changes, React re-renders the components that read `CartContext`, and nothing else on its account:',
        '| Component | Reads | Re-renders when the cart changes? |\n|---|---|---|\n' +
        '| `CartBadge`, `CartList` | `useCart()` | Yes: they show the cart |\n' +
        '| `ProductCard` | `useCartDispatch()` only | No: `dispatch` never changes |\n' +
        '| The page around them | Nothing | No: it is the provider\'s `children`, made by its parent |',
        'Two details make that work. **`dispatch`, like a state setter, is the same function forever**, so a context that holds only it never changes. And the provider takes its content as **`children`**: when its state changes it renders again, but the children were made by its parent and are the very same elements, so React skips them unless they read a context that changed.',
        '## The one-context trap',
        jsx('<CartContext value={{ items, dispatch }}>   // ❌ a new object on every render'),
        'One context holding both is a new object each time the provider renders, so every reader re-renders on every change, each `ProductCard` that only wanted `dispatch` included. `useMemo(() => ({ items, dispatch }), [items])` stops the needless re-renders when nothing changed, but not when `items` did. Split contexts by how often their values change.',
        '## When not to use context',
        '- **Values that change many times a second** (a mouse position, the text of an input, an animation): every reader re-renders each time.\n' +
        '- **Server data** (products, orders): TanStack Query caches it, refetches it and shares it, which context does not.\n' +
        '- **A large, busy app state:** a store such as Zustand or Redux lets each component subscribe to just the slice it reads: [[lesson:r-state-libraries]].',
        'The interview questions are [[q:context]] and [[q:state-management]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript this is a small store module: `let items = []; const listeners = new Set(); export function dispatch(action) { items = reducer(items, action); listeners.forEach(l => l()); }`, and each widget subscribes and redraws itself. The provider is that module, scoped to a part of the tree; React does the subscribing for you, and redraws exactly the components that read the state.',
      example: {
        code: `import { useState, useReducer, createContext, useContext } from 'react';

const TasksContext = createContext(null);
const TasksDispatchContext = createContext(null);

function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'added':
      return [...tasks, { id: action.id, text: action.text, done: false }];
    case 'toggled':
      return tasks.map(t => (t.id === action.id ? { ...t, done: !t.done } : t));
    default:
      throw new Error('Unknown action: ' + action.type);
  }
}

function TasksProvider({ children }) {
  const [tasks, dispatch] = useReducer(tasksReducer, [{ id: 1, text: 'Write the plan', done: true }]);
  return (
    <TasksContext value={tasks}>
      <TasksDispatchContext value={dispatch}>{children}</TasksDispatchContext>
    </TasksContext>
  );
}

function useTasks() {
  return useContext(TasksContext);
}

function useTasksDispatch() {
  return useContext(TasksDispatchContext);
}

let nextId = 2;

function AddTask() {
  const [text, setText] = useState('');
  const dispatch = useTasksDispatch();

  function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch({ type: 'added', id: nextId++, text: text.trim() });
    setText('');
  }

  return (
    <form onSubmit={add}>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="New task" /> <button>Add</button>
    </form>
  );
}

function TaskList() {
  const tasks = useTasks();
  const dispatch = useTasksDispatch();
  return (
    <ul>
      {tasks.map(t => (
        <li key={t.id}>
          <label>
            <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: 'toggled', id: t.id })} /> {t.text}
          </label>
        </li>
      ))}
    </ul>
  );
}

function Summary() {
  const tasks = useTasks();
  return <p className="summary">{tasks.filter(t => t.done).length} of {tasks.length} done</p>;
}

export default function App() {
  return (
    <TasksProvider>
      <AddTask />
      <TaskList />
      <Summary />
    </TasksProvider>
  );
}
`,
        css: 'ul { padding-left: 4px; list-style: none; margin: 8px 0; } .summary { margin: 0; color: #667; }',
        note: 'Turn on **Highlight renders** (above the preview), then tick a task: `TaskList` and `Summary` flash, because they read the tasks. `AddTask` does not: it reads only `dispatch`, which never changes.'
      },
      challenge: {
        title: 'A cart that re-renders only its readers',
        strict: true,
        task: 'The cart works: **Add** puts a product in it (or raises its quantity), the badge counts the items, **Remove** takes a line out. But it keeps the cart and `dispatch` in one context, so every Add re-renders every `ProductCard`, though a card only dispatches.\n\n' +
          'Change the provider so that adding to the cart re-renders `CartBadge` and `CartList`, and no `ProductCard`, keeping what it does.\n\n' +
          'Keep the component names: the checks count which of them render.',
        starter: `import { useReducer, createContext, useContext } from 'react';

const PRODUCTS = [{ id: 'tea', name: 'Tea' }, { id: 'coffee', name: 'Coffee' }, { id: 'cocoa', name: 'Cocoa' }];

function cartReducer(items, action) {
  switch (action.type) {
    case 'added': {
      const line = items.find(i => i.id === action.product.id);
      if (line) return items.map(i => (i.id === line.id ? { ...i, qty: i.qty + 1 } : i));
      return [...items, { id: action.product.id, name: action.product.name, qty: 1 }];
    }
    case 'removed':
      return items.filter(i => i.id !== action.id);
    default:
      throw new Error('Unknown action: ' + action.type);
  }
}

const CartContext = createContext(null);

function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  return <CartContext value={{ items, dispatch }}>{children}</CartContext>;
}

function ProductCard({ product }) {
  const { dispatch } = useContext(CartContext);
  return (
    <div className="product">
      {product.name}{' '}
      <button className={'add-' + product.id} onClick={() => dispatch({ type: 'added', product })}>Add</button>
    </div>
  );
}

function CartBadge() {
  const { items } = useContext(CartContext);
  return <span className="badge">{items.reduce((n, i) => n + i.qty, 0)}</span>;
}

function CartList() {
  const { items, dispatch } = useContext(CartContext);
  return (
    <ul className="cart">
      {items.map(i => (
        <li key={i.id}>
          <span className="line">{i.name} × {i.qty}</span>{' '}
          <button className={'remove-' + i.id} onClick={() => dispatch({ type: 'removed', id: i.id })}>Remove</button>
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  return (
    <CartProvider>
      <header>Cart <CartBadge /></header>
      {PRODUCTS.map(p => <ProductCard key={p.id} product={p} />)}
      <CartList />
    </CartProvider>
  );
}
`,
        solution: `import { useReducer, createContext, useContext } from 'react';

const PRODUCTS = [{ id: 'tea', name: 'Tea' }, { id: 'coffee', name: 'Coffee' }, { id: 'cocoa', name: 'Cocoa' }];

function cartReducer(items, action) {
  switch (action.type) {
    case 'added': {
      const line = items.find(i => i.id === action.product.id);
      if (line) return items.map(i => (i.id === line.id ? { ...i, qty: i.qty + 1 } : i));
      return [...items, { id: action.product.id, name: action.product.name, qty: 1 }];
    }
    case 'removed':
      return items.filter(i => i.id !== action.id);
    default:
      throw new Error('Unknown action: ' + action.type);
  }
}

const CartContext = createContext(null);
const CartDispatchContext = createContext(null);

function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  return (
    <CartContext value={items}>
      <CartDispatchContext value={dispatch}>{children}</CartDispatchContext>
    </CartContext>
  );
}

function useCart() {
  return useContext(CartContext);
}

function useCartDispatch() {
  const dispatch = useContext(CartDispatchContext);
  if (!dispatch) throw new Error('useCartDispatch must be used inside <CartProvider>');
  return dispatch;
}

function ProductCard({ product }) {
  const dispatch = useCartDispatch();
  return (
    <div className="product">
      {product.name}{' '}
      <button className={'add-' + product.id} onClick={() => dispatch({ type: 'added', product })}>Add</button>
    </div>
  );
}

function CartBadge() {
  const items = useCart();
  return <span className="badge">{items.reduce((n, i) => n + i.qty, 0)}</span>;
}

function CartList() {
  const items = useCart();
  const dispatch = useCartDispatch();
  return (
    <ul className="cart">
      {items.map(i => (
        <li key={i.id}>
          <span className="line">{i.name} × {i.qty}</span>{' '}
          <button className={'remove-' + i.id} onClick={() => dispatch({ type: 'removed', id: i.id })}>Remove</button>
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  return (
    <CartProvider>
      <header>Cart <CartBadge /></header>
      {PRODUCTS.map(p => <ProductCard key={p.id} product={p} />)}
      <CartList />
    </CartProvider>
  );
}
`,
        css: 'header { font-weight: 700; margin-bottom: 6px; } .badge { display: inline-block; min-width: 1.6em; padding: 0 6px; border-radius: 999px; background: #20232a; color: #61dafb; text-align: center; } .product { margin: 4px 0; } .cart { padding-left: 18px; }',
        hints: [
          '`value={{ items, dispatch }}` is a new object every time `CartProvider` renders, so every reader of `CartContext` re-renders on every change, `ProductCard` too.',
          'Make a second context for `dispatch` alone: `const CartDispatchContext = createContext(null);`, and provide both: `<CartContext value={items}><CartDispatchContext value={dispatch}>{children}</CartDispatchContext></CartContext>`. `dispatch` never changes, so that context never does.',
          '`ProductCard` reads only the dispatch context; `CartBadge` reads the items; `CartList` reads both. Two small hooks, `useCart()` and `useCartDispatch()`, keep the components tidy.'
        ],
        checks: [
          { label: 'Tea twice and Coffee once: the badge says 3, the cart Tea × 2, Coffee × 1', fn: `async function (doc, win, t) {
  await t.click('.add-tea');
  await t.click('.add-tea');
  await t.click('.add-coffee');
  if (t.text('.badge') !== '3') return 'the badge says "' + t.text('.badge') + '"';
  var lines = [].map.call(doc.querySelectorAll('.cart .line'), function (l) { return l.textContent; }).join(', ');
  return lines === 'Tea × 2, Coffee × 1' || 'the cart says: ' + (lines || 'nothing');
}` },
          { label: 'Remove Tea: Coffee × 1 is left, and the badge says 1', fn: `async function (doc, win, t) {
  await t.click('.remove-tea');
  var lines = [].map.call(doc.querySelectorAll('.cart .line'), function (l) { return l.textContent; }).join(', ');
  if (lines !== 'Coffee × 1') return 'the cart says: ' + (lines || 'nothing');
  return t.text('.badge') === '1' || 'the badge says "' + t.text('.badge') + '"';
}` },
          { label: 'Add re-renders `CartBadge` and `CartList`, and no `ProductCard`', fn: `async function (doc, win, t) {
  var r = await t.renders(async function () { await t.click('.add-cocoa'); });
  if (!r.CartBadge || !r.CartList) return 'Add did not re-render ' + (!r.CartBadge ? 'CartBadge' : 'CartList') + ' (keep the component names)';
  return !r.ProductCard || 'one Add re-rendered ProductCard ' + r.ProductCard + ' times: it only dispatches, so give it a context that never changes';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'r-error-boundaries', track: 'composition',
      title: 'Error boundaries',
      summary: 'An error thrown while rendering takes the whole page down, unless an error boundary above it catches it and shows a fallback instead. A boundary is still a class component, and it does not catch errors in event handlers or in code that runs later.',
      keywords: ['error boundary', 'error boundaries', 'getDerivedStateFromError', 'componentDidCatch', 'fallback', 'crash', 'white screen', 'blank page', 'react-error-boundary', 'try again', 'reset', 'onCaughtError', 'error handling'],
      docs: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary',
      body: [
        'If a component throws while React renders it (`null.price`, a bad date, a field missing from the server\'s answer), React cannot finish the tree. Since React 16 it then takes the **whole** app off the page: a blank screen is safer than a half-drawn one that lies. An **error boundary** limits the damage to its own part of the tree:',
        jsx("import { Component } from 'react';",
            '',
            'class ErrorBoundary extends Component {',
            '  state = { error: null };',
            '',
            '  static getDerivedStateFromError(error) {',
            '    return { error };                            // show the fallback next',
            '  }',
            '',
            '  componentDidCatch(error, info) {',
            '    logToService(error, info.componentStack);   // and report it',
            '  }',
            '',
            '  render() {',
            '    if (this.state.error) return this.props.fallback;',
            '    return this.props.children;',
            '  }',
            '}',
            '',
            '<ErrorBoundary fallback={<p>The chart could not be drawn.</p>}>',
            '  <SalesChart />',
            '</ErrorBoundary>'),
        '| Method | React calls it | Use it to |\n|---|---|---|\n' +
        '| `static getDerivedStateFromError(error)` | While rendering, once a child has thrown | Return the state that shows the fallback |\n' +
        '| `componentDidCatch(error, info)` | Once the fallback is on the screen | Log the error and `info.componentStack` |',
        'There is no hook for this: a boundary is one of the last reasons to write a class. Most teams write one once, or use the `react-error-boundary` package (`<ErrorBoundary FallbackComponent={…} onReset={…}>`).',
        '## What a boundary does not catch',
        '| An error thrown in | Caught? | What to do instead |\n|---|---|---|\n' +
        '| Rendering, an effect, a class\'s lifecycle method | Yes | |\n' +
        '| An event handler | No | `try`/`catch` in the handler, and keep the error in state to show it |\n' +
        '| `setTimeout`, a promise, `fetch().then()` | No | `.catch()` it into state; or rethrow it in an update, `setState(() => { throw err; })`, which a boundary does catch |\n' +
        '| The boundary itself | No | The next boundary up catches it |',
        'An event handler runs after rendering, outside React\'s walk through the tree, so there is nothing for React to replace: the page is still right, only the action failed. Handle those errors where they happen.',
        '## Where to put them',
        'One boundary at the top turns a crash into a friendly page. More boundaries around **independent** parts (each widget of a dashboard, the comments under an article, each route) keep one failure from hiding everything else. Do not wrap every button: a boundary should surround something that makes sense to lose on its own.',
        '## Trying again',
        'A boundary that shows its fallback stays that way until its state changes. Give the fallback a **Try again** button that clears the error (`this.setState({ error: null })`), and the children render afresh, from new state. Changing the boundary\'s `key` does the same from outside, for example when the user moves to another page.',
        'React 19\'s `createRoot` also takes `onCaughtError` and `onUncaughtError`, to log every error in one place. This tool uses them, which is why the console under the preview still shows an error a boundary caught. The interview question is [[q:error-boundaries]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you wrap a risky widget: `try { renderChart(el, data); } catch (e) { el.textContent = "Could not draw the chart"; }`. React calls your components for you, so you cannot put a `try` around them; an error boundary is that `try`/`catch`, placed in the tree. And as in plain JavaScript, a `try` does not catch code that runs later: a click handler or a `setTimeout` needs its own.',
      example: {
        code: `import { Component, useState } from 'react';

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.log('caught:', error.message);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fallback">
          Something went wrong: {this.state.error.message}{' '}
          <button onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Clock() {
  const [broken, setBroken] = useState(false);
  if (broken) throw new Error('the clock fell off the wall');
  return (
    <p>
      {new Date().toLocaleTimeString()} <button onClick={() => setBroken(true)}>Break it</button>
    </p>
  );
}

export default function App() {
  return (
    <div>
      <ErrorBoundary>
        <Clock />
      </ErrorBoundary>
      <p>This line is outside the boundary: it stays.</p>
    </div>
  );
}
`,
        css: '.fallback { padding: 8px 10px; border: 1px solid #f3b4b4; border-radius: 8px; background: #fdecec; color: #a32020; }',
        note: 'Click **Break it**: the clock throws while rendering, the boundary shows its fallback, and the line under it stays. **Try again** clears the error and the clock renders afresh. Then move `<ErrorBoundary>` to wrap the whole `<div>`, and break it again: one clock takes everything with it.'
      },
      challenge: {
        title: 'One broken widget, not a broken page',
        strict: true,
        task: 'Click **Refresh** in the Stocks widget: the server sends a quote with no price, `Stocks` throws while rendering, and the whole dashboard disappears. Write an `ErrorBoundary` class and use it so that:\n\n' +
          '- A widget that throws shows `<div className="widget-error">` with the text "This widget failed." and a **Try again** button (`className="retry"`), in its own place.\n' +
          '- The other widgets keep working.\n' +
          '- **Try again** brings the broken widget back, starting afresh.\n\n' +
          'The console will still show the error: React reports every error, even one a boundary caught, so you can fix it.',
        starter: `import { Component, useState } from 'react';

// TODO: an ErrorBoundary class component

function Weather() {
  return (
    <section className="widget weather">
      <h4>Weather</h4>
      <p>Pune, 31°C</p>
    </section>
  );
}

function Stocks() {
  const [quote, setQuote] = useState({ symbol: 'ACME', price: 120.5 });
  return (
    <section className="widget stocks">
      <h4>Stocks</h4>
      <p>{quote.symbol}: {quote.price.toFixed(2)}</p>
      <button className="refresh" onClick={() => setQuote({ symbol: 'ACME', price: null })}>Refresh</button>
    </section>
  );
}

function News() {
  return (
    <section className="widget news">
      <h4>News</h4>
      <p>React 19.3 is out.</p>
    </section>
  );
}

export default function Dashboard() {
  return (
    <div className="dashboard">
      <Weather />
      <Stocks />
      <News />
    </div>
  );
}
`,
        solution: `import { Component, useState } from 'react';

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="widget widget-error">
          This widget failed.{' '}
          <button className="retry" onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Weather() {
  return (
    <section className="widget weather">
      <h4>Weather</h4>
      <p>Pune, 31°C</p>
    </section>
  );
}

function Stocks() {
  const [quote, setQuote] = useState({ symbol: 'ACME', price: 120.5 });
  return (
    <section className="widget stocks">
      <h4>Stocks</h4>
      <p>{quote.symbol}: {quote.price.toFixed(2)}</p>
      <button className="refresh" onClick={() => setQuote({ symbol: 'ACME', price: null })}>Refresh</button>
    </section>
  );
}

function News() {
  return (
    <section className="widget news">
      <h4>News</h4>
      <p>React 19.3 is out.</p>
    </section>
  );
}

export default function Dashboard() {
  return (
    <div className="dashboard">
      <ErrorBoundary><Weather /></ErrorBoundary>
      <ErrorBoundary><Stocks /></ErrorBoundary>
      <ErrorBoundary><News /></ErrorBoundary>
    </div>
  );
}
`,
        css: '.dashboard { display: flex; flex-wrap: wrap; gap: 8px; } .widget { flex: 1; min-width: 110px; padding: 6px 10px; border: 1px solid #ccd; border-radius: 8px; } .widget h4 { margin: 0 0 4px; } .widget p { margin: 0 0 6px; } .widget-error { background: #fdecec; color: #a32020; border-color: #f3b4b4; }',
        hints: [
          'A boundary is a class: `class ErrorBoundary extends Component { state = { error: null }; static getDerivedStateFromError(error) { return { error }; } render() { … } }`. Its `render` returns the fallback while `this.state.error` is set, and `this.props.children` otherwise.',
          'Wrap each widget in its own boundary: `<ErrorBoundary><Stocks /></ErrorBoundary>`, and the same for the others. One boundary around all three would hide all three.',
          '**Try again** is `onClick={() => this.setState({ error: null })}`: the boundary renders its children again, and `Stocks` starts afresh, from its first quote.'
        ],
        checks: [
          { label: 'At the start the three widgets show', fn: `function (doc, win, t) {
  var missing = ['weather', 'stocks', 'news'].filter(function (w) { return !doc.querySelector('.' + w); });
  return !missing.length || 'missing: .' + missing.join(', .');
}` },
          { label: 'Refresh breaks Stocks: it shows "This widget failed.", and Weather and News stay', fn: `async function (doc, win, t) {
  await t.click('.refresh');
  if (doc.querySelector('.rlt-crash')) return 'the whole dashboard crashed: nothing caught the error';
  var errs = doc.querySelectorAll('.widget-error');
  if (errs.length !== 1) return errs.length + ' .widget-error elements (one is right)';
  if (errs[0].textContent.indexOf('This widget failed.') < 0) return '.widget-error says "' + errs[0].textContent + '"';
  if (!doc.querySelector('.weather') || !doc.querySelector('.news')) return 'Weather or News went too: give each widget its own boundary';
  return !doc.querySelector('.stocks') || 'the Stocks widget is still there';
}` },
          { label: 'Try again brings Stocks back, from its first quote', fn: `async function (doc, win, t) {
  if (!doc.querySelector('.retry')) return 'no .retry button';
  await t.click('.retry');
  if (doc.querySelector('.widget-error')) return 'the error is still shown';
  return t.text('.stocks p') === 'ACME: 120.50' || 'Stocks shows "' + t.text('.stocks p') + '"';
}` },
          { label: 'The boundary is a class with `getDerivedStateFromError`', fn: `function (doc, win, t) {
  return /class\\s+\\w+\\s+extends\\s+(?:React\\.)?Component/.test(t.source()) && /getDerivedStateFromError/.test(t.source()) || 'no class … extends Component with a static getDerivedStateFromError';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'r-portals', track: 'composition',
      title: 'Portals: render somewhere else',
      summary: 'createPortal(children, domNode) draws part of a component into another DOM node, usually document.body, so a menu, tooltip or dialog escapes a parent that clips it. For React it stays where you wrote it: props, context and events follow the component tree, not the DOM.',
      keywords: ['portal', 'portals', 'createPortal', 'react-dom', 'modal', 'tooltip', 'dropdown', 'popover', 'overflow hidden', 'z-index', 'stacking context', 'document.body', 'event bubbling', 'clipped'],
      docs: 'https://react.dev/reference/react-dom/createPortal',
      body: [
        'A card has `overflow: hidden` (to keep its rounded corners clean) and a "⋯" button whose menu should hang below it. Drawn inside the card, the menu is cut off at the card\'s edge, and `z-index` cannot help: `overflow`, `transform` and `filter` on an ancestor clip or trap a child however high its `z-index`. The menu has to live somewhere else in the DOM:',
        jsx("import { createPortal } from 'react-dom';",
            '',
            'function Card() {',
            '  const [open, setOpen] = useState(false);',
            '  return (',
            '    <div className="card">',
            '      <button onClick={() => setOpen(!open)}>⋯</button>',
            '      {open && createPortal(',
            '        <ul className="menu">…</ul>,',
            '        document.body                 // drawn here, at the end of <body>',
            '      )}',
            '    </div>',
            '  );',
            '}'),
        '## Two trees',
        '| | In the DOM | In React |\n|---|---|---|\n' +
        '| Where the menu is | A child of `<body>`, outside the card | Inside `Card`, where you wrote it |\n' +
        '| Context | (no such thing) | Read from the providers above `Card` |\n' +
        '| A click on it | Bubbles to `<body>`, never through the card | Reaches the `onClick` of `Card` and of its parents |',
        'The last row surprises people: React events bubble through the **React** tree, so a click inside the portal reaches handlers on the card, though in the DOM the menu is nowhere near it. Plain DOM listeners (`addEventListener`, `e.target.closest(\'.card\')`) see the DOM instead.',
        '## Placing it',
        'Outside the card, the menu no longer moves with it: give it `position: fixed`, and work out where from the button\'s box, `buttonRef.current.getBoundingClientRect()`: `top` is its `bottom`, `left` its `left`. Measure in `useLayoutEffect`, before the paint, so the menu never shows in the wrong place first ([[lesson:r-dom-refs]]).',
        '## What portals are for',
        '- Dialogs and modals ([[build:modal]]), tooltips, dropdown menus, popovers, toasts: anything that floats above the page.\n' +
        '- Drawing into a node React does not own: a `<div id="modal-root">` in `index.html`, or part of a page another library manages.',
        'A portal moves the pixels, not the meaning: a dialog still needs `role="dialog"`, the focus moved into it and back, and Escape to close it. The native `<dialog>` element with `showModal()` goes on the browser\'s top layer by itself, above everything, which is worth knowing too. The interview question is [[q:portals]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you would build the menu, `document.body.append(menu)` it, remove it on close, and wire its clicks back to the card it belongs to by hand. A portal does the appending and removing for you, and keeps the menu part of the card in every way that is not about pixels: its state, its context and its events.',
      example: {
        code: `import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

function Tip({ text, portal, children }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (!show) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
  }, [show]);

  const tip = <span className="tip" style={portal ? { position: 'fixed', top: pos.top, left: pos.left } : null}>{text}</span>;
  return (
    <span ref={ref}>
      <button onClick={() => setShow(!show)}>{children}</button>
      {show && (portal ? createPortal(tip, document.body) : tip)}
    </span>
  );
}

export default function App() {
  const [clicks, setClicks] = useState(0);
  return (
    <div className="box" onClick={() => setClicks(clicks + 1)}>
      <p>This box has overflow: hidden. Clicks inside it: {clicks}</p>
      <Tip text="I am cut off by the box, however high my z-index">Without a portal</Tip>{' '}
      <Tip text="I float above everything" portal>With a portal</Tip>
    </div>
  );
}
`,
        css: '.box { position: relative; height: 82px; overflow: hidden; padding: 6px 10px; border: 1px solid #ccd; border-radius: 8px; max-width: 360px; } .box p { margin: 0 0 6px; } .tip { position: absolute; z-index: 999; padding: 6px 10px; border-radius: 6px; background: #20232a; color: #fff; white-space: nowrap; }',
        note: 'Click both buttons. The first tip is clipped by the box; the second, drawn into `<body>` through a portal, floats over everything. Now click on the second tip itself: the box counts the click, because React events bubble through the component tree, though the tip is not inside the box in the DOM.'
      },
      challenge: {
        title: 'A menu that escapes its card',
        strict: true,
        task: 'The card\'s "⋯" button opens a menu, but the card has `overflow: hidden` (and a `transform`), so most of the menu is cut off. Render the menu through a portal into `document.body`, so that:\n\n' +
          '- **⋯** opens it, outside `#root`, and **⋯** again closes it.\n' +
          '- Every item can be clicked: nothing hides it.\n' +
          '- It sits just below the ⋯ button: `top` is the button\'s bottom (give or take a few pixels), `left` the button\'s left. Its CSS already says `position: fixed`; measure the button with a ref.\n' +
          '- **Archive** sets the card\'s status to "Archived" and closes the menu.',
        starter: `import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

function Card({ title }) {
  const [open, setOpen] = useState(false);
  const [archived, setArchived] = useState(false);

  return (
    <div className="card">
      <b>{title}</b> <span className="status">{archived ? 'Archived' : 'Active'}</span>
      <button className="more" aria-label="More" onClick={() => setOpen(!open)}>⋯</button>
      {open && (
        <ul className="menu" style={{ top: 40, left: 8 }}>
          <li><button className="rename">Rename</button></li>
          <li><button className="archive" onClick={() => { setArchived(true); setOpen(false); }}>Archive</button></li>
          <li><button className="delete">Delete</button></li>
        </ul>
      )}
    </div>
  );
}

export default function App() {
  return <Card title="Quarterly report" />;
}
`,
        solution: `import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

function Card({ title }) {
  const [open, setOpen] = useState(false);
  const [archived, setArchived] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return;
    const r = buttonRef.current.getBoundingClientRect();
    setPos({ top: r.bottom, left: r.left });
  }, [open]);

  return (
    <div className="card">
      <b>{title}</b> <span className="status">{archived ? 'Archived' : 'Active'}</span>
      <button ref={buttonRef} className="more" aria-label="More" onClick={() => setOpen(!open)}>⋯</button>
      {open && createPortal(
        <ul className="menu" style={{ top: pos.top, left: pos.left }}>
          <li><button className="rename">Rename</button></li>
          <li><button className="archive" onClick={() => { setArchived(true); setOpen(false); }}>Archive</button></li>
          <li><button className="delete">Delete</button></li>
        </ul>,
        document.body
      )}
    </div>
  );
}

export default function App() {
  return <Card title="Quarterly report" />;
}
`,
        css: '.card { position: relative; height: 56px; overflow: hidden; transform: translateZ(0); padding: 8px 10px; border: 1px solid #ccd; border-radius: 10px; max-width: 300px; } .more { margin-left: 8px; } .menu { position: fixed; z-index: 10; margin: 0; padding: 4px 0; list-style: none; background: #fff; border: 1px solid #b5c0cf; border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,.15); } .menu button { display: block; width: 100%; padding: 5px 16px; border: 0; background: none; text-align: left; }',
        hints: [
          'Draw the menu with `createPortal(<ul className="menu" …>…</ul>, document.body)` in place of the `<ul>` itself: it then lives at the end of `<body>`, out of the card\'s reach.',
          'Measure the button: `const buttonRef = useRef(null);`, `<button ref={buttonRef} …>`, and in `useLayoutEffect(() => { if (!open) return; const r = buttonRef.current.getBoundingClientRect(); setPos({ top: r.bottom, left: r.left }); }, [open]);`.',
          'Give the menu `style={{ top: pos.top, left: pos.left }}`. Its CSS is `position: fixed`, so those are measured from the window, exactly like `getBoundingClientRect()`.'
        ],
        checks: [
          { label: '⋯ opens the menu outside `#root`, in `<body>`', fn: `async function (doc, win, t) {
  await t.click('.more');
  var menu = doc.querySelector('.menu');
  if (!menu) return 'no .menu after clicking ⋯';
  return !doc.getElementById('root').contains(menu) || 'the menu is inside #root, in the card: draw it with createPortal(…, document.body)';
}` },
          { label: 'Every item can be clicked: nothing clips the menu', fn: `function (doc) {
  var hidden = [].filter.call(doc.querySelectorAll('.menu button'), function (b) {
    var r = b.getBoundingClientRect(), hit = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !hit || !b.contains(hit);
  });
  return !hidden.length || hidden.length + ' item(s) cannot be clicked, such as "' + hidden[0].textContent + '": something clips them';
}` },
          { label: 'The menu sits just below the ⋯ button', fn: `function (doc) {
  var b = doc.querySelector('.more').getBoundingClientRect(), m = doc.querySelector('.menu').getBoundingClientRect();
  if (Math.abs(m.top - b.bottom) > 8) return 'the menu\\'s top is at ' + Math.round(m.top) + ' px, the button\\'s bottom at ' + Math.round(b.bottom) + ' px';
  return Math.abs(m.left - b.left) <= 8 || 'the menu\\'s left is at ' + Math.round(m.left) + ' px, the button\\'s at ' + Math.round(b.left) + ' px';
}` },
          { label: 'Archive: the card says Archived, and the menu closes', fn: `async function (doc, win, t) {
  await t.click('.menu .archive');
  if (t.text('.status') !== 'Archived') return 'the status says "' + t.text('.status') + '"';
  return !doc.querySelector('.menu') || 'the menu is still open';
}` },
          { label: '⋯ twice: open, then closed', fn: `async function (doc, win, t) {
  await t.click('.more');
  if (!doc.querySelector('.menu')) return 'no menu after ⋯';
  await t.click('.more');
  return !doc.querySelector('.menu') || 'a second ⋯ did not close the menu';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'r-logic-patterns', track: 'composition',
      title: 'Sharing logic: HOCs, render props and hooks',
      summary: 'Before hooks, React code shared stateful logic with higher-order components (a function that wraps a component) and render props (a component that calls your function to draw). Custom hooks replaced both in new code, but you meet them in older code and in libraries.',
      keywords: ['hoc', 'hocs', 'higher-order component', 'higher order component', 'render props', 'render prop', 'children as a function', 'function as child', 'wrapper hell', 'prop collision', 'withRouter', 'connect', 'sharing logic', 'code reuse', 'patterns'],
      docs: 'https://react.dev/learn/reusing-logic-with-custom-hooks',
      body: [
        'Three components need the mouse position. The logic is the same each time: a listener on `window` and a piece of state. React has had three ways to share it:',
        jsx('// 1. A higher-order component (HOC): a function that takes a component and returns a new one',
            'function withMouse(Component) {',
            '  return function WithMouse(props) {',
            '    const [pos, setPos] = useState({ x: 0, y: 0 });',
            '    useEffect(() => { /* listen to mousemove, call setPos */ }, []);',
            '    return <Component {...props} mouse={pos} />;',
            '  };',
            '}',
            'const Dot = withMouse(function Dot({ mouse }) { … });',
            '',
            '// 2. A render prop: the component holds the logic, and calls your function to draw',
            '<MouseTracker render={pos => <Dot x={pos.x} y={pos.y} />} />',
            '<MouseTracker>{pos => <Dot x={pos.x} y={pos.y} />}</MouseTracker>   // children as the function',
            '',
            '// 3. A custom hook: the logic is a function the component calls',
            'function Dot() {',
            '  const pos = useMousePosition();',
            '  …',
            '}'),
        '## Why hooks won',
        '| | HOC | Render prop | Custom hook |\n|---|---|---|---|\n' +
        '| The value arrives as | An invisible prop (`mouse`) | A function argument | A variable you name |\n' +
        '| Two at once | Wrappers in wrappers; two may pass the same prop and one silently wins | Callbacks inside callbacks | Two lines, `const pos = useMouse(); const user = useUser();` |\n' +
        '| In DevTools | `WithMouse(WithUser(Card))` | Extra layers | Just `Card` |',
        'The colliding prop is the classic HOC bug: in `withUser(withSettings(Profile))`, if both pass `data`, `Profile` gets only one of them, and nothing warns you. A hook returns its value into a variable you name, so nothing can collide.',
        '## Where you still meet them',
        '- **HOCs:** `memo(Component)` and `forwardRef(…)` have the HOC shape; React Redux\'s `connect()`, React Router 5\'s `withRouter`, and much code written before 2019.\n' +
        '- **Render props:** a component that draws around content you choose, with its own data: a virtual list that calls `renderRow(index)`, a form library\'s `<Field render={…}>`, `<Context.Consumer>`. They still fit when the component, not you, decides where your content goes.',
        'Turning a HOC into a hook is mostly moving its body: the state and effects go into `useMouse()`, which returns what the HOC passed as a prop. Custom hooks are [[lesson:r-custom-hooks]]; the interview question is [[q:hocs-render-props]].'
      ].join('\n\n'),
      plainjs: 'Plain JavaScript has the same three shapes. A HOC is a decorator, a function that wraps another: `const logged = withLogging(save)`. A render prop is a callback: `list.forEachVisible(item => drawRow(item))`. A custom hook is a helper that returns a value: `const pos = getMousePosition()`, the shape that composes best, because two of them never step on each other.',
      example: {
        code: `import { useState } from 'react';

// the shared logic, as a custom hook: where the pointer is inside an element
function usePointer() {
  const [pos, setPos] = useState(null);
  const handlers = {
    onPointerMove: e => {
      const r = e.currentTarget.getBoundingClientRect();
      setPos({ x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) });
    },
    onPointerLeave: () => setPos(null)
  };
  return [pos, handlers];
}

// 1. a HOC built on it: it passes the position as a "pointer" prop
function withPointer(Component) {
  return function WithPointer(props) {
    const [pos, handlers] = usePointer();
    return <div className="pad" {...handlers}><Component {...props} pointer={pos} /></div>;
  };
}
const ViaHoc = withPointer(function Readout({ pointer }) {
  return <p>HOC: {pointer ? pointer.x + ', ' + pointer.y : 'move here'}</p>;
});

// 2. a render prop: the component calls the function you give it
function PointerArea({ children }) {
  const [pos, handlers] = usePointer();
  return <div className="pad" {...handlers}>{children(pos)}</div>;
}

// 3. the hook itself, used directly
function ViaHook() {
  const [pos, handlers] = usePointer();
  return <div className="pad" {...handlers}><p>Hook: {pos ? pos.x + ', ' + pos.y : 'move here'}</p></div>;
}

export default function App() {
  return (
    <div className="pads">
      <ViaHoc />
      <PointerArea>{pos => <p>Render prop: {pos ? pos.x + ', ' + pos.y : 'move here'}</p>}</PointerArea>
      <ViaHook />
    </div>
  );
}
`,
        css: '.pads { display: flex; flex-wrap: wrap; gap: 8px; } .pad { flex: 1; min-width: 120px; height: 70px; padding: 6px 10px; border: 1px dashed #99a; border-radius: 8px; touch-action: none; } .pad p { margin: 0; }',
        note: 'Move the pointer over each box: the same logic, delivered three ways. Read how each component gets the position: a prop it did not ask for (the HOC), an argument (the render prop), a variable it named (the hook).'
      },
      challenge: {
        title: 'Two HOCs, one prop',
        strict: true,
        task: '`withUser` loads the signed-in user, `withSettings` keeps the user\'s settings, and `ProfileView` needs both. But both HOCs pass their value as `data`, so the inner one wins: the profile shows the settings where the name should be.\n\n' +
          'Replace the two HOCs with custom hooks, `useUser()` and `useSettings()`, that `ProfileView` calls itself, and export `ProfileView` (unwrapped) as the default:\n\n' +
          '- While the user loads (0.2 seconds), it says `Loading…` in `<p className="loading">`; then `Asha (admin)` in `.who`.\n' +
          '- `.prefs` says `Dark mode: on · English`, and **Toggle dark mode** turns it to `off`.',
        starter: `import { useState, useEffect } from 'react';

function withUser(Component) {
  return function WithUser(props) {
    const [user, setUser] = useState(null);
    useEffect(() => {
      const id = setTimeout(() => setUser({ name: 'Asha', role: 'admin' }), 200);   // a pretend request
      return () => clearTimeout(id);
    }, []);
    return <Component {...props} data={user} />;
  };
}

function withSettings(Component) {
  return function WithSettings(props) {
    const [settings, setSettings] = useState({ darkMode: true, language: 'English' });
    const toggleDark = () => setSettings(s => ({ ...s, darkMode: !s.darkMode }));
    return <Component {...props} data={settings} onToggleDark={toggleDark} />;
  };
}

function ProfileView({ data, onToggleDark }) {
  // it needs the user AND the settings, but both HOCs pass theirs as "data"
  const user = data;
  const settings = data;
  if (!user) return <p className="loading">Loading…</p>;
  return (
    <div className="profile">
      <p className="who">{user.name} ({user.role})</p>
      <p className="prefs">Dark mode: {settings.darkMode ? 'on' : 'off'} · {settings.language}</p>
      <button className="toggle-dark" onClick={onToggleDark}>Toggle dark mode</button>
    </div>
  );
}

export default withUser(withSettings(ProfileView));
`,
        solution: `import { useState, useEffect } from 'react';

function useUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const id = setTimeout(() => setUser({ name: 'Asha', role: 'admin' }), 200);   // a pretend request
    return () => clearTimeout(id);
  }, []);
  return user;
}

function useSettings() {
  const [settings, setSettings] = useState({ darkMode: true, language: 'English' });
  const toggleDark = () => setSettings(s => ({ ...s, darkMode: !s.darkMode }));
  return [settings, toggleDark];
}

export default function ProfileView() {
  const user = useUser();
  const [settings, toggleDark] = useSettings();
  if (!user) return <p className="loading">Loading…</p>;
  return (
    <div className="profile">
      <p className="who">{user.name} ({user.role})</p>
      <p className="prefs">Dark mode: {settings.darkMode ? 'on' : 'off'} · {settings.language}</p>
      <button className="toggle-dark" onClick={toggleDark}>Toggle dark mode</button>
    </div>
  );
}
`,
        css: '.profile p { margin: 0 0 6px; } .who { font-weight: 700; }',
        hints: [
          'Move the body of `withUser`\'s inner component into `function useUser() { … return user; }`: the same `useState` and `useEffect`, returning the value instead of passing it as a prop.',
          'Do the same for the settings: `function useSettings() { … return [settings, toggleDark]; }`, a pair like `useState`\'s.',
          'In `ProfileView`, take no props: `const user = useUser(); const [settings, toggleDark] = useSettings();`, and `export default function ProfileView()`. Delete the two HOCs.'
        ],
        checks: [
          { label: 'It says Loading… while the user loads, then Asha (admin)', fn: `async function (doc, win, t) {
  if (!doc.querySelector('.loading')) return 'no .loading at the start';
  for (var i = 0; i < 20 && !doc.querySelector('.who'); i++) await t.wait(50);
  return t.text('.who') === 'Asha (admin)' || '.who says "' + t.text('.who') + '"';
}` },
          { label: 'Dark mode: on · English, and the button turns it off', fn: `async function (doc, win, t) {
  if (t.text('.prefs') !== 'Dark mode: on · English') return '.prefs says "' + t.text('.prefs') + '"';
  await t.click('.toggle-dark');
  return t.text('.prefs') === 'Dark mode: off · English' || 'after the toggle, .prefs says "' + t.text('.prefs') + '"';
}` },
          { label: 'No HOC is left: `ProfileView` calls `useUser()` and `useSettings()`', fn: `function (doc, win, t) {
  var src = t.source();
  if (/with(?:User|Settings)\\s*\\(/.test(src)) return 'withUser(…) or withSettings(…) is still used';
  var calls = function (name) { return (src.match(new RegExp('\\\\b' + name + '\\\\s*\\\\(\\\\s*\\\\)', 'g')) || []).length; };
  return (calls('useUser') >= 2 && calls('useSettings') >= 2) || 'write useUser() and useSettings(), and call both in ProfileView';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'r-state-libraries', track: 'composition',
      title: 'State libraries: Redux Toolkit and Zustand',
      summary: 'Most state is local, lifted, or server data. For app-wide client state that changes often, a store such as Redux Toolkit or Zustand lets each component subscribe to just the slice it reads, so a change re-renders only the components that use it. Both are built on useSyncExternalStore.',
      keywords: ['redux', 'redux toolkit', 'rtk', 'createSlice', 'configureStore', 'useSelector', 'useDispatch', 'zustand', 'store', 'selector', 'selectors', 'state management', 'useSyncExternalStore', 'tanstack query', 'global state', 'immer'],
      docs: 'https://react.dev/reference/react/useSyncExternalStore',
      body: [
        'Before picking a library, sort the state. Each kind has a home, and most of it never needs a library:',
        '| Kind of state | Example | Its home |\n|---|---|---|\n' +
        '| Used by one component | Is this dropdown open? | `useState`, `useReducer` |\n' +
        '| Shared by a few nearby | The filters of one page | Lift it up: [[lesson:r-lifting-state]] |\n' +
        '| Read everywhere, changes rarely | Theme, language, signed-in user | Context: [[lesson:r-context]] |\n' +
        '| From the server | Products, orders | TanStack Query, or the framework\'s loaders |\n' +
        '| In the address | The page number, a search | The router\'s URL parameters |\n' +
        '| App-wide, changes often | A cart, an editor, a dashboard\'s layout | A store: Zustand or Redux Toolkit |',
        'A **store** is an object outside React that holds state, lets you change it, and tells its subscribers when it changed. Its strength is **selectors**: a component asks for one slice (`state => state.cart.count`) and re-renders only when that slice changes. Context cannot do that: every reader re-renders when its value changes.',
        '## Redux Toolkit',
        js("import { configureStore, createSlice } from '@reduxjs/toolkit';",
           '',
           'const cartSlice = createSlice({',
           "  name: 'cart',",
           '  initialState: { items: [] },',
           '  reducers: {',
           '    added(state, action) {',
           '      state.items.push(action.payload);   // Immer turns this into a new state',
           '    },',
           '    cleared(state) {',
           '      state.items = [];',
           '    }',
           '  }',
           '});',
           '',
           'export const { added, cleared } = cartSlice.actions;',
           'export const store = configureStore({ reducer: { cart: cartSlice.reducer } });'),
        jsx('// main.jsx wraps the app once: <Provider store={store}><App /></Provider>',
            '',
            'function CartBadge() {',
            '  const count = useSelector(state => state.cart.items.length);   // re-renders when this number changes',
            '  return <span>{count}</span>;',
            '}',
            '',
            'function AddButton({ product }) {',
            '  const dispatch = useDispatch();',
            '  return <button onClick={() => dispatch(added(product))}>Add</button>;',
            '}'),
        'The words: the **store** holds the state; an **action** says what happened (`{ type: \'cart/added\', payload }`); a **reducer** works out the next state from it ([[lesson:r-use-reducer]]); **dispatch** sends an action; a **selector** reads a slice. Redux Toolkit\'s `createSlice` is how Redux is written today: it makes the action creators for you, and Immer lets a reducer "mutate" a draft safely. RTK Query adds server data.',
        '## Zustand',
        jsx("import { create } from 'zustand';",
            '',
            'const useCart = create(set => ({',
            '  items: [],',
            '  add: item => set(state => ({ items: [...state.items, item] })),',
            '  clear: () => set({ items: [] })',
            '}));',
            '',
            'function CartBadge() {',
            '  const count = useCart(state => state.items.length);',
            '  return <span>{count}</span>;',
            '}'),
        'No provider, no actions, no reducers: the store is a hook. Zustand suits a small or medium app that wants a shared store with little code; Redux Toolkit a large app with many developers, strict patterns, and its DevTools (every action logged, time travel).',
        '## Underneath: useSyncExternalStore',
        'Both rest on React\'s `useSyncExternalStore(subscribe, getSnapshot)`. React calls `subscribe` with a callback, calls `getSnapshot` on each render, and renders the component again when the callback fires and the snapshot is different (by `Object.is`). A selector is a `getSnapshot` that returns a slice, so it must return the same value while nothing changed: a selector that builds a new object or array each time makes the component re-render on every change, or React warns about an endless loop.',
        'This tool cannot install packages, so the challenge has you build the core of Zustand, about twenty lines. The interview questions are [[q:state-management]] and [[q:redux-toolkit]].'
      ].join('\n\n'),
      plainjs: 'A store in plain JavaScript is a few lines: `let state = { … }; const listeners = new Set(); function setState(change) { state = { ...state, ...change }; listeners.forEach(l => l()); }`, and each widget subscribes and redraws itself when its part changed. Redux and Zustand are that, with conventions on top; `useSyncExternalStore` lets React components be the subscribers.',
      example: {
        code: `import { useSyncExternalStore } from 'react';

// a tiny store: state, a way to change it, and subscribers to tell
let state = { count: 0, user: 'Asha' };
const listeners = new Set();

const store = {
  getState: () => state,
  setState: change => {
    state = { ...state, ...change };
    listeners.forEach(l => l());
  },
  subscribe: listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

function useStore(selector) {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

function Counter() {
  const count = useStore(s => s.count);
  return <button onClick={() => store.setState({ count: count + 1 })}>Count: {count}</button>;
}

function UserName() {
  const user = useStore(s => s.user);
  return <p>Signed in as {user}</p>;
}

export default function App() {
  return (
    <div>
      <Counter />
      <UserName />
      <button onClick={() => store.setState({ user: state.user === 'Asha' ? 'Ravi' : 'Asha' })}>Switch user</button>
    </div>
  );
}
`,
        css: 'button { margin: 0 6px 6px 0; } p { margin: 4px 0 8px; }',
        note: 'Turn on **Highlight renders** and click **Count**: only `Counter` flashes, because `UserName` selected `user`, which did not change. **Switch user** is the other way round. With one context holding the whole state, both would flash every time.'
      },
      challenge: {
        title: 'Your own Zustand, in twenty lines',
        strict: true,
        task: 'Finish `createStore` and `useStore`, the core of a store library:\n\n' +
          '- `setState(change)` replaces the state with a **new** object holding the change (`{ ...state, ...change }`), then calls every listener.\n' +
          '- `subscribe(listener)` remembers it, and returns a function that forgets it.\n' +
          '- `useStore(selector)` reads `selector(store.getState())` and re-renders the component when that slice changes: build it on `useSyncExternalStore`.\n\n' +
          'Then **Count** re-renders `Counter` only, and **Switch user** re-renders `UserName` only. Keep `window.store = store`: the checks use it.',
        starter: `import { useSyncExternalStore } from 'react';

function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();
  return {
    getState: () => state,
    setState: change => {
      // TODO: a new state object holding the change, then tell every listener
    },
    subscribe: listener => {
      // TODO: remember the listener, and return a function that forgets it
      return () => {};
    }
  };
}

const store = createStore({ count: 0, user: 'Asha' });
window.store = store;   // the checks use it

function useStore(selector) {
  // TODO: re-render when selector(store.getState()) changes: useSyncExternalStore
  return selector(store.getState());
}

function Counter() {
  const count = useStore(s => s.count);
  return <button className="inc" onClick={() => store.setState({ count: count + 1 })}>Count: {count}</button>;
}

function UserName() {
  const user = useStore(s => s.user);
  return (
    <p className="user">
      Signed in as {user}{' '}
      <button className="switch" onClick={() => store.setState({ user: user === 'Asha' ? 'Ravi' : 'Asha' })}>Switch user</button>
    </p>
  );
}

export default function App() {
  return (
    <div>
      <Counter />
      <UserName />
    </div>
  );
}
`,
        solution: `import { useSyncExternalStore } from 'react';

function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();
  return {
    getState: () => state,
    setState: change => {
      state = { ...state, ...change };
      listeners.forEach(l => l());
    },
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

const store = createStore({ count: 0, user: 'Asha' });
window.store = store;   // the checks use it

function useStore(selector) {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

function Counter() {
  const count = useStore(s => s.count);
  return <button className="inc" onClick={() => store.setState({ count: count + 1 })}>Count: {count}</button>;
}

function UserName() {
  const user = useStore(s => s.user);
  return (
    <p className="user">
      Signed in as {user}{' '}
      <button className="switch" onClick={() => store.setState({ user: user === 'Asha' ? 'Ravi' : 'Asha' })}>Switch user</button>
    </p>
  );
}

export default function App() {
  return (
    <div>
      <Counter />
      <UserName />
    </div>
  );
}
`,
        css: '.user { margin: 8px 0 0; }',
        hints: [
          '`setState`: `state = { ...state, ...change };` then `listeners.forEach(l => l());`. A new object each time, as React expects of state.',
          '`subscribe`: `listeners.add(listener); return () => listeners.delete(listener);`. React calls the function it returns when the component leaves the page.',
          '`useStore`: `return useSyncExternalStore(store.subscribe, () => selector(store.getState()));`. React calls the second function on every render and after each notification, and re-renders only when what it returns changed.'
        ],
        checks: [
          { label: 'Count goes up: Count: 1, then Count: 2', fn: `async function (doc, win, t) {
  await t.click('.inc');
  if (t.text('.inc') !== 'Count: 1') return 'after one click it says "' + t.text('.inc') + '"';
  await t.click('.inc');
  return t.text('.inc') === 'Count: 2' || 'after two clicks it says "' + t.text('.inc') + '"';
}` },
          { label: 'Switch user: Signed in as Ravi', fn: `async function (doc, win, t) {
  await t.click('.switch');
  return t.text('.user').indexOf('Signed in as Ravi') === 0 || '.user says "' + t.text('.user') + '"';
}` },
          { label: 'Count re-renders `Counter`, not `UserName`', fn: `async function (doc, win, t) {
  var r = await t.renders(async function () { await t.click('.inc'); });
  if (!r.Counter) return 'Count did not re-render Counter';
  return !r.UserName || 'Count re-rendered UserName ' + r.UserName + ' times: useStore should re-render only when its slice changes';
}` },
          { label: 'Switch user re-renders `UserName`, not `Counter`', fn: `async function (doc, win, t) {
  var r = await t.renders(async function () { await t.click('.switch'); });
  if (!r.UserName) return 'Switch user did not re-render UserName';
  return !r.Counter || 'Switch user re-rendered Counter ' + r.Counter + ' times';
}` },
          { label: '`subscribe` returns a function that unsubscribes', fn: `function (doc, win) {
  if (!win.store) return 'window.store is gone: keep the line that sets it';
  var calls = 0, stop = win.store.subscribe(function () { calls++; });
  win.store.setState({ note: 1 });
  if (typeof stop === 'function') stop();
  win.store.setState({ note: 2 });
  return calls === 1 || 'a listener was called ' + calls + ' times for one change before unsubscribing (1 is right)';
}` }
        ]
      }
    }
  );
})(window.RLT);
