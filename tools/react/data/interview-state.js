/*
 * Interview Q&A, track 2 (State and forms): questions 7, 8, 9, 18 and 39 of 18_React_QA.md.
 * The question shape is described at the top of data/interview.js.
 */
(function (U) {
  var Q = U.data.questions = U.data.questions || [];
  function jsx() { return '```jsx\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q.push(
    {
      id: 'controlled-uncontrolled', track: 'state', weight: 3, source: '18_React_QA.md#7',
      q: 'Controlled vs uncontrolled components',
      keywords: ['controlled', 'uncontrolled', 'controlled component', 'uncontrolled component', 'value', 'defaultValue', 'onChange', 'ref', 'FormData', 'input', 'form'],
      short: 'A **controlled** input\'s value lives in React state: `value={name}` shows it and `onChange` updates it on every keystroke, so React always knows what is typed. An **uncontrolled** input keeps its value in the DOM: `defaultValue` sets the start, and you read it when you need it, with `FormData` on submit or a ref.',
      answer: [
        '| | Controlled | Uncontrolled |\n|---|---|---|\n' +
        '| Where the value lives | React state | The DOM element |\n' +
        '| How you read it | From state, at any time | On submit (`FormData`), or with a ref |\n' +
        '| Code | `value={name} onChange={e => setName(e.target.value)}` | `defaultValue="x"`, `name="email"` |\n' +
        '| Good for | Checks as you type, formatting, dependent fields, a disabled Submit | Simple forms read once, file inputs, non-React widgets |',
        jsx('// controlled: React owns the value',
            "const [email, setEmail] = useState('');",
            '<input value={email} onChange={e => setEmail(e.target.value)} />',
            '',
            '// uncontrolled: the browser owns it; read it on submit',
            'function handleSubmit(e) {',
            '  e.preventDefault();',
            "  const email = new FormData(e.target).get('email');",
            '}',
            '<input name="email" defaultValue="" />'),
        '**Controlled is the common default.** Two warnings show you got it half right: `value` without `onChange` makes a read-only field, and a value that starts as `undefined` and later becomes text switches the input from uncontrolled to controlled. Start with `useState(\'\')`.',
        '**Uncontrolled is not old-fashioned.** React Hook Form uses uncontrolled inputs so a large form does not re-render on every keystroke, and React 19\'s `<form action={fn}>` hands your function the `FormData`, so plain inputs need no state at all. A file input is always uncontrolled: its value can only be set by the user.'
      ].join('\n\n'),
      followups: [
        'What happens when an input has `value` but no `onChange`?',
        'Why does React warn "A component is changing an uncontrolled input to be controlled"? (the value started as `undefined`)',
        'Why is `<input type="file">` always uncontrolled?',
        'A form with 50 fields re-renders on every keystroke. What would you change?',
        'How does React 19\'s `<form action>` change the choice?'
      ],
      related: ['lesson:r-forms', 'build:otp-input', 'lesson:r-actions']
    },
    {
      id: 'state-not-immediate', track: 'state', weight: 3, source: '18_React_QA.md#8',
      q: 'Why doesn\'t state update immediately?',
      keywords: ['setState', 'state not updating', 'async setState', 'batching', 'automatic batching', 'updater function', 'functional update', 'snapshot', 'flushSync'],
      short: '`setState` does not change the variable: it **schedules a re-render**, and the current render keeps its value, because state is a snapshot of that render. The updates of one event are **batched** into one render. To build on the previous value, pass an updater: `setCount(c => c + 1)`.',
      answer: [
        jsx('const [count, setCount] = useState(0);',
            '',
            'function handleClick() {',
            '  setCount(count + 1);',
            '  console.log(count);          // still 0: the new value arrives on the next render',
            '}'),
        '**Why it works this way.** All the code of one render, the JSX and its handlers, sees the same values, so nothing is half-updated halfway through a handler. And React renders once per event instead of once per setter call.',
        '**Batching.** Since React 18 (with `createRoot`), every update is batched: in event handlers, timeouts, promises and native listeners alike. Before 18, only updates inside React event handlers were; a `setTimeout` with two setters rendered twice.',
        '**The updater function** receives the latest queued value, so several updates add up:',
        jsx('setCount(count + 1); setCount(count + 1);   // +1: both read the same count',
            'setCount(c => c + 1); setCount(c => c + 1); // +2: each gets the result of the one before'),
        '**Needing the new value now:** work it out into a variable first, `const next = count + 1; setCount(next); save(next);`. Forcing React to apply an update at once is possible with `flushSync` from `react-dom`, but it is rarely needed (for example, to scroll to an item you just added).'
      ].join('\n\n'),
      followups: [
        'What does `console.log(count)` print right after `setCount(count + 1)`?',
        'What changed about batching in React 18?',
        'You need the new value straight away, to send it to the server. How?',
        'When would you use `flushSync`, and why rarely?',
        'Why is `setCount(c => c + 1)` the safe choice inside `setInterval`?'
      ],
      related: ['lesson:r-state-snapshot', 'explain:state-snapshot']
    },
    {
      id: 'immutable-state', track: 'state', weight: 3, source: '18_React_QA.md#9',
      q: 'Why must state be immutable?',
      keywords: ['immutable', 'immutability', 'mutate', 'mutation', 'Object.is', 'reference', 'same reference', 'spread', 'push', 'immer', 'shallow copy'],
      short: 'React decides whether state changed by comparing **references** (`Object.is`), not contents. Change an object or array in place and hand it back, and React sees the same reference: it may skip the render, and memoised children and effects miss the change too. Always make a new object or array.',
      answer: [
        jsx('items.push(newItem); setItems(items);                      // ❌ the same array: may not re-render',
            'setItems([...items, newItem]);                             // ✅ a new array',
            "setUser({ ...user, address: { ...user.address, city: 'Pune' } });   // ✅ copy each level you change"),
        '**What else relies on new references:** `memo` compares props by reference, so a mutated prop looks unchanged; `useEffect`, `useMemo` and `useCallback` compare their dependencies the same way. A mutation slips past all of them.',
        '**Why references and not a deep comparison:** comparing two references costs nothing; comparing every field of a big tree on every update would cost more than the renders it saves.',
        '**What immutability buys besides:** undo and redo (keep the old states), time-travel debugging, cheap "did anything change?" checks, and safe concurrent rendering, where React may start a render and throw it away while the screen still shows the old data.',
        '**Deeply nested data:** keep the state flatter, or let **Immer** make the copies (`produce`, or `useImmer`): you write `draft.address.city = \'Pune\'` and get a new object. Redux Toolkit\'s `createSlice` uses Immer, which is why its reducers may look as if they mutate.'
      ].join('\n\n'),
      followups: [
        'Is the spread syntax a deep copy?',
        'How do you update one item inside an array of objects?',
        'What does Immer do, and where have you met it?',
        'Why does React not just compare objects deeply?',
        'What do `toSorted`, `toReversed` and `with` add to arrays?'
      ],
      related: ['lesson:r-state-objects', 'lesson:r-state-arrays']
    },
    {
      id: 'lifting-state', track: 'state', weight: 2, source: '18_React_QA.md#18',
      q: 'What is lifting state up?',
      keywords: ['lifting state up', 'lift state', 'shared state', 'siblings', 'common parent', 'single source of truth', 'callback', 'controlled component'],
      short: 'When two components need the same data, move the state to their **closest common parent**, pass the value down as props, and pass down a callback so the children can ask for changes. There is then one source of truth.',
      answer: [
        'Example: a product list and a cart summary both need the cart, so the cart state lives in their parent page.',
        jsx('function ShopPage() {',
            '  const [cart, setCart] = useState([]);',
            '  return (',
            '    <>',
            '      <ProductList onAdd={p => setCart([...cart, p])} />',
            '      <CartSummary items={cart} />',
            '    </>',
            '  );',
            '}'),
        'The children become **controlled** components: their props decide what they show, and they call the callback to request a change. Values that follow from the state (the cart\'s total) are computed during render, not stored.',
        '**The costs:** state lifted higher than needed re-renders everything below it on each change, and props start passing through components that never use them (**prop drilling**). Lift only as far as the closest common parent. When many distant components need the value, use composition (`children`), context for rarely changing data, or a store such as Zustand.'
      ].join('\n\n'),
      followups: [
        'How does a child change state that lives in its parent?',
        'What does it cost to lift state too high?',
        'When does lifting stop being enough, and what comes next?',
        'What is derived state, and why should you not store it?'
      ],
      related: ['lesson:r-lifting-state']
    },
    {
      id: 'forms', track: 'state', weight: 1, source: '18_React_QA.md#39',
      q: 'How do you handle forms in React?',
      keywords: ['forms', 'form', 'react hook form', 'zod', 'validation', 'useActionState', 'useFormStatus', 'form action', 'onSubmit'],
      short: 'Small forms: controlled inputs with `useState` and an `onSubmit` handler. Large forms: **React Hook Form** (uncontrolled inputs, few re-renders, built-in validation), often with a **Zod** schema shared with the back end. React 19 adds `<form action={fn}>` with `useActionState` and `useFormStatus`, which handle the pending and error states with little code.',
      answer: [
        '**Small: controlled inputs** ([[lesson:r-forms]]): one state object, one `handleChange` using the input\'s `name`, validity worked out each render, `e.preventDefault()` in `onSubmit`.',
        '**Large: React Hook Form with Zod.** The inputs stay uncontrolled, so typing does not re-render the form; the schema validates on the client and can be reused on the server.',
        jsx("import { useForm } from 'react-hook-form';",
            "import { zodResolver } from '@hookform/resolvers/zod';",
            "import { z } from 'zod';",
            '',
            'const schema = z.object({ email: z.email(), password: z.string().min(8) });',
            '',
            'function SignIn() {',
            '  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });',
            '  return (',
            '    <form onSubmit={handleSubmit(save)}>',
            "      <input {...register('email')} />",
            '      {errors.email && <p>{errors.email.message}</p>}',
            "      <input type=\"password\" {...register('password')} />",
            '      <button>Sign in</button>',
            '    </form>',
            '  );',
            '}'),
        '**React 19: form actions.** The action receives the previous state and the `FormData`; React tracks the pending state and resets the form after a successful submit.',
        jsx('async function signIn(prev, formData) {',
            "  const res = await fetch('/api/login', { method: 'POST', body: formData });",
            "  return res.ok ? { error: null } : { error: 'Wrong email or password' };",
            '}',
            '',
            'function SignIn() {',
            '  const [state, formAction, isPending] = useActionState(signIn, { error: null });',
            '  return (',
            '    <form action={formAction}>',
            '      <input name="email" />',
            '      <input name="password" type="password" />',
            "      <button disabled={isPending}>{isPending ? 'Signing in…' : 'Sign in'}</button>",
            '      {state.error && <p>{state.error}</p>}',
            '    </form>',
            '  );',
            '}'),
        'Whatever the tool: validate on the client for quick feedback **and** on the server for safety, and make errors accessible (`aria-invalid`, `aria-describedby` pointing at the message, focus on the first error).'
      ].join('\n\n'),
      followups: [
        'Controlled inputs or React Hook Form for a 40-field form, and why?',
        'Where does validation belong: the client, the server, or both?',
        'What does `useFormStatus` give a submit button?',
        'How do you make form errors accessible?'
      ],
      related: ['lesson:r-forms', 'lesson:r-actions', 'lesson:r-use-action-state', 'lesson:r-use-form-status', 'build:multi-step-form']
    }
  );
})(window.RLT);
