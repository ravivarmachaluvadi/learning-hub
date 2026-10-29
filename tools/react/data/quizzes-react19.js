/*
 * Quizzes for track 6 (React 19 and beyond): three or more questions per lesson, keyed by lesson id.
 * The question shape is described at the top of data/quizzes-foundations.js; the choices are
 * shuffled every time, so never write "both of the above".
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};

  Q['r-actions'] = [
    {
      q: 'What does `<form action={save}>` hand to `save` when the form is submitted?',
      choices: ['A `FormData` with the form\'s fields, by their `name`', 'The submit event, on which you call `preventDefault()`', 'An object of the form\'s state variables'],
      answer: 0,
      why: 'React calls the action with the form\'s `FormData`, inside a transition, and cancels the page load itself: no event, no `preventDefault`. `formData.get(\'email\')` reads the field with `name="email"`.'
    },
    {
      q: 'A form action finishes without an error. What happens to the form\'s uncontrolled inputs?',
      choices: ['React resets the form: each goes back to its `defaultValue`', 'They keep what was typed until the page reloads', 'They are cleared only if the action returns `true`'],
      answer: 0,
      why: 'React resets a form after its action, so a successful submit empties the boxes with no code. Controlled inputs (with `value`) are not touched: their state decides.'
    },
    {
      q: 'In `startTransition(async () => { await publish(); … })`, how long does `isPending` stay `true`?',
      choices: ['Until the whole async function has finished', 'Only until the first `await`', 'Only while React renders the update'],
      answer: 0,
      why: 'In React 19 an async function in a transition is an Action: React keeps the transition pending until it returns, so `disabled={isPending}` covers the whole request and a second click cannot start another.'
    },
    {
      q: 'An Action throws an error the user cannot fix (the server is down), and nothing catches it. Where does it go?',
      choices: ['To the nearest error boundary, which shows its fallback', 'Nowhere: errors in actions are swallowed', 'Into `isPending`, which becomes the error'],
      answer: 0,
      why: 'An error thrown in an Action reaches the nearest error boundary. For an error the user can fix, catch it and show it beside the form instead.'
    }
  ];

  Q['r-use-action-state'] = [
    {
      q: 'What does `useActionState(action, initialState)` return?',
      choices: ['`[state, formAction, isPending]`', '`[state, setState]`', '`{ pending, data, method, action }`'],
      answer: 0,
      why: '`state` is what the action last returned (the initial state at first), `formAction` goes on `<form action>`, and `isPending` is true while it runs. The object with `pending` and `data` is `useFormStatus`.'
    },
    {
      q: 'With `useActionState`, what does the action receive?',
      choices: ['The previous state, then the `FormData`', 'Only the `FormData`', 'The submit event, then the previous state'],
      answer: 0,
      why: 'The previous state comes first, so the action can build on the last result; the `FormData` comes second.'
    },
    {
      q: 'After a submit fails validation, the email box is empty although the user had typed an address. Why?',
      choices: ['React reset the form after the action; return the email in the state and use it as `defaultValue`', 'The email failed validation, so React deleted it', '`useActionState` forgets the input on every render'],
      answer: 0,
      why: 'Every form action ends with a reset. To keep what was typed, the action returns it with the errors, and `<input name="email" defaultValue={state.email} />` puts it back. Never return a password.'
    },
    {
      q: 'Someone clicks Submit three times quickly on a `useActionState` form. What happens?',
      choices: ['The action runs three times, one after another, each getting the state the last returned', 'Only the last click runs', 'The three run at the same time and the slowest one wins'],
      answer: 0,
      why: 'Submits to a `useActionState` action queue up and run in order; `isPending` stays true until the last one has finished.'
    }
  ];

  Q['r-use-form-status'] = [
    {
      q: '`Newsletter` renders a `<form>` and calls `useFormStatus()` itself. While the form is sent, what is `pending`?',
      choices: ['`false`: it reads a form above the component, and there is none', '`true`, as long as the form is being sent', 'It throws an error: the hook must be inside a form'],
      answer: 0,
      why: 'useFormStatus reads the nearest form **above** the calling component. The component that renders the form is not inside it, so it always gets `false`, and React says nothing. Call it in a child, such as a `SubmitButton`.'
    },
    {
      q: 'Which package does `useFormStatus` come from?',
      choices: ['`react-dom`', '`react`', '`react-dom/client`'],
      answer: 0,
      why: 'It is about a DOM form, so it lives in `react-dom`: `import { useFormStatus } from \'react-dom\';`.'
    },
    {
      q: 'Two forms on a page each use the same `SubmitButton`. One form is being sent. Which buttons show "Saving…"?',
      choices: ['Only the button inside the form being sent', 'Both: they share one component', 'Neither, unless the forms share state'],
      answer: 0,
      why: 'Each `SubmitButton` reads its own nearest form. Sharing a component never shares its state.'
    },
    {
      q: 'While a form is being sent, what is `data` in `useFormStatus()`?',
      choices: ['The `FormData` being sent', 'What the action will return', 'The previous state of the form'],
      answer: 0,
      why: '`data.get(\'email\')` tells a component what is being sent, for a line like "Sending to ada@example.com…". It is `null` when nothing is being sent.'
    }
  ];

  Q['r-use-optimistic'] = [
    {
      q: 'An optimistic like is shown, then the server fails, and your action does not set the real state. What does the screen show when the action ends?',
      choices: ['The real state again: the like undoes itself', 'The optimistic value, until you undo it by hand', 'An error from React about a failed optimistic update'],
      answer: 0,
      why: 'The optimistic value only lives while the action runs. When it ends, the hook shows the real state, which nothing changed. No rollback code needed.'
    },
    {
      q: 'The server confirmed the like. What must the action do so the like stays?',
      choices: ['Set the real state (inside `startTransition`, after the `await`)', 'Nothing: the optimistic value becomes the real one', 'Call the optimistic update function a second time'],
      answer: 0,
      why: 'Optimistic updates are always dropped when the action ends. What stays is the real state, so a success must set it.'
    },
    {
      q: 'A click handler calls `addOptimistic(1)` directly, not in an action or transition. What happens?',
      choices: ['React logs "An optimistic state update occurred outside a transition or action" and shows nothing', 'The count goes up and stays up', 'The count goes up, then back down after a second'],
      answer: 0,
      why: 'An optimistic update belongs to an action. Outside one, React refuses it. Wrap the work in `startTransition(async () => { … })` or use a form action.'
    },
    {
      q: 'Two comments are sent quickly; the first one\'s answer comes back and is added with a plain `setComments` after `await`. What can go wrong?',
      choices: ['The first comment shows twice for a moment: confirmed, and still optimistic', 'The second comment is lost', 'Nothing: optimistic updates are per comment'],
      answer: 0,
      why: 'An update after `await` is no longer part of the transition, so the confirmed comment appears while its optimistic copy is still shown. Wrapped in `startTransition`, both copies stay until both actions end, then the real list replaces them.'
    }
  ];

  Q['r-use'] = [
    {
      q: '`const user = use(fetchUser(id));` where `fetchUser` makes a new promise each call. What does the user see?',
      choices: ['The Suspense fallback, for ever', 'The user, after one request', 'An error saying the promise is not cached'],
      answer: 0,
      why: 'Each time React tries the render again it gets a new pending promise. Nothing ever settles from its point of view, and React 19.3 gives no warning. Cache one promise per id, outside rendering.'
    },
    {
      q: 'A promise read with `use` rejects. What happens?',
      choices: ['The error goes to the nearest error boundary', '`use` returns `undefined`', 'The Suspense fallback stays'],
      answer: 0,
      why: '`use` throws the rejection to the nearest error boundary, as an error during rendering would.'
    },
    {
      q: 'Why does keeping the promise in `useMemo` not fix a component that suspends on its first render?',
      choices: ['A component that suspends before it first appears keeps no state, so `useMemo` runs afresh each try', '`useMemo` cannot hold promises', '`use` ignores memoised values'],
      answer: 0,
      why: 'Until a component has mounted, React throws its work away on every suspension, hooks included. The promise must live outside the component: a cache, a parent, or a framework.'
    },
    {
      q: 'What can `use` do that `useContext` cannot?',
      choices: ['Be called inside an `if`, a loop, or after an early `return`', 'Read a context without a provider above', 'Change the context\'s value'],
      answer: 0,
      why: '`use` is the one exception to the rules of hooks: it may be called conditionally. Both read the nearest provider\'s value.'
    }
  ];

  Q['r-react-19-upgrade'] = [
    {
      q: 'In React 19, a function component has `Greeting.defaultProps = { name: \'guest\' }` and is rendered with no name. What does it get?',
      choices: ['`name` is `undefined`: React 19 ignores `defaultProps` on function components, with no warning', '`name` is `\'guest\'`', 'React throws an error about `defaultProps`'],
      answer: 0,
      why: 'That removal changes behaviour silently. Use a default value in the parameters: `function Greeting({ name = \'guest\' })`. Class components keep `defaultProps`.'
    },
    {
      q: 'How does a function component receive a `ref` in React 19?',
      choices: ['As a plain prop: `function Field({ ref }) { … }`', 'Only through `forwardRef`', 'Through `useImperativeHandle`, always'],
      answer: 0,
      why: '`ref` is a prop like any other in React 19. `forwardRef` still works for existing code; new code does not need it.'
    },
    {
      q: 'A ref callback returns a function. When does React 19 call that function?',
      choices: ['When the element is removed (and between StrictMode\'s double calls)', 'On every render', 'Never: React ignores what a ref callback returns'],
      answer: 0,
      why: 'In React 19 a ref callback can return its cleanup, like an effect: disconnect an observer, remove a listener. Before, React called the callback again with `null`.'
    },
    {
      q: 'A component renders `<title>Inbox (3)</title>` in its JSX. What does React 19 do with it?',
      choices: ['Moves it into the document\'s `<head>`, so the page title changes', 'Renders a visible "Inbox (3)" in the page', 'Ignores it: a title belongs in index.html'],
      answer: 0,
      why: 'React 19 hoists `<title>`, `<meta>` and `<link>` to the `<head>` from wherever they are rendered, so no effect has to set `document.title`.'
    }
  ];

  Q['r-rendering-strategies'] = [
    {
      q: 'Which page suits static generation (SSG) best?',
      choices: ['A documentation page that changes when the docs are rebuilt', 'A dashboard behind a login, different for every user', 'A product page with prices that change every minute'],
      answer: 0,
      why: 'SSG makes the HTML once, at build time, so it fits content that is the same for everyone and changes rarely. Per-user pages suit CSR; live data suits SSR.'
    },
    {
      q: 'What is hydration?',
      choices: ['React rendering in the browser and attaching to the HTML the server sent, instead of drawing it again', 'The server filling a page with data from the database', 'The browser downloading the JavaScript bundle'],
      answer: 0,
      why: 'The server\'s HTML shows at once but does nothing. Hydration renders the same components in the browser and attaches the event handlers to the existing nodes.'
    },
    {
      q: 'A component renders `new Date().toLocaleTimeString()` and the page is server-rendered. What happens when it hydrates?',
      choices: ['The text differs from the server\'s: React reports a mismatch and rebuilds that part of the page', 'The browser\'s time quietly replaces the server\'s', 'Nothing: times are allowed to differ'],
      answer: 0,
      why: 'Hydration needs the first render to match the server\'s HTML exactly. React 19 logs "Hydration failed…" and throws the server\'s HTML away. Render the server\'s value first, and the browser\'s time in an effect.'
    },
    {
      q: 'What is the third function of `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` for?',
      choices: ['The value to use on the server and while hydrating, so the first render matches', 'Saving the value to the server', 'Unsubscribing when the component goes'],
      answer: 0,
      why: 'During server rendering and hydration React uses `getServerSnapshot`; once hydrated it switches to `getSnapshot`. That is how a browser-only value such as the window width avoids a mismatch.'
    }
  ];

  Q['r-server-components'] = [
    {
      q: 'Which can a Server Component do?',
      choices: ['Be `async` and read the database directly', 'Hold state with `useState`', 'Handle a click with `onClick`'],
      answer: 0,
      why: 'A Server Component runs only on the server: it can await data and use secrets, but it has no state, effects or event handlers, because it never runs in the browser.'
    },
    {
      q: 'Why can a Server Component not pass `onAdd={() => …}` to a Client Component?',
      choices: ['Props cross the network and must be serialisable; a function cannot be sent', 'Client Components cannot have props', 'Only class components accept functions'],
      answer: 0,
      why: 'Only data crosses from server to client: strings, numbers, objects, arrays, promises, JSX. Move the behaviour into the Client Component, or use a Server Function marked \'use server\'.'
    },
    {
      q: 'How does a Client Component show a Server Component inside it?',
      choices: ['It receives it, already rendered, as `children` (or another prop)', 'It imports it and renders it', 'It cannot, in any way'],
      answer: 0,
      why: 'Importing would turn the server code into client code. Passed as `children`, the Server Component is rendered on the server and arrives finished; the client part\'s state changes never re-render it.'
    },
    {
      q: 'How are Server Components different from server-side rendering?',
      choices: ['SSR decides when HTML is made; Server Components decide which components ever reach the browser', 'They are two names for the same thing', 'SSR is for React 18 and Server Components for React 19 only'],
      answer: 0,
      why: 'With SSR every component still ships to the browser and hydrates. Server Components never ship. A framework uses both: Server and Client Components are rendered to HTML, and only the Client Components hydrate.'
    }
  ];

  Q['r-testing'] = [
    {
      q: 'Which query does Testing Library recommend first, for a button?',
      choices: ['`getByRole(\'button\', { name: \'Save\' })`', '`getByTestId(\'save-button\')`', '`container.querySelector(\'.save\')`'],
      answer: 0,
      why: 'It finds the button as a user and a screen reader do, by its role and name, and so also proves it is a real, accessible button. Test ids are the last resort; class names are implementation details.'
    },
    {
      q: 'You want to assert that an error message is **not** on the page. Which query?',
      choices: ['`queryByText`, which returns `null` when there is none', '`getByText`, which returns `undefined` when there is none', '`findByText`, which waits for it to disappear'],
      answer: 0,
      why: '`getBy…` throws when nothing matches, so it cannot prove absence. `expect(screen.queryByText(\'Error\')).not.toBeInTheDocument()` can.'
    },
    {
      q: 'A list appears after a fetch. How does a test wait for it?',
      choices: ['`await screen.findByText(\'Ada\')`, which retries until it appears or a second has gone', '`screen.getByText(\'Ada\')` straight after `render`', 'A `setTimeout` of five seconds'],
      answer: 0,
      why: '`findBy…` returns a promise that waits for the element. A fixed delay is slow when it is long and flaky when it is short.'
    },
    {
      q: 'Why is `await user.click(button)` (user-event) preferred to `fireEvent.click(button)`?',
      choices: ['It does what a person\'s click does: pointer and mouse events, focus, and nothing on a disabled button', 'fireEvent does not work with React 19', 'user-event runs the test faster'],
      answer: 0,
      why: 'fireEvent dispatches one event. user-event plays the whole interaction, so the test behaves like a user and catches what a user would hit.'
    }
  ];
})(window.RLT);
