/*
 * Interview Q&A, track 6 (React 19 and beyond): questions 27 and 38 of 18_React_QA.md, both ★★ in the
 * notes. The track's ★★★ questions (26, 28, 42) came early, in data/interview-fast-track.js.
 * The question shape is described at the top of data/interview.js.
 */
(function (U) {
  var Q = U.data.questions = U.data.questions || [];
  function jsx() { return '```jsx\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q.push(
    {
      id: 'server-components', track: 'react19', weight: 2, source: '18_React_QA.md#27',
      q: 'Server Components vs Client Components',
      keywords: ['server components', 'client components', 'rsc', 'react server components', 'use client', 'use server', 'server functions', 'server actions', 'serializable', 'next.js app router', 'bundle size'],
      short: '**Server Components** run only on the server, at request or build time: they can be `async`, read a database or files directly, use secrets, and send **no JavaScript** to the browser. **Client Components**, in a file that starts with `\'use client\'`, also run in the browser and can use state, effects and event handlers. A Server Component renders Client Components and passes them data (or server-rendered children). They need a framework such as Next.js.',
      answer: [
        '| | Server Components | Client Components |\n|---|---|---|\n' +
        '| Run | Only on the server, per request or at build time | On the server for the first HTML, then in the browser |\n' +
        '| May use | `async`/`await`, the database, files, secrets | State, effects, event handlers, context, browser APIs |\n' +
        '| JavaScript sent to the browser | None for the component itself | The component\'s code |\n' +
        '| Marked by | Nothing: the default in frameworks that support them | `\'use client\'` at the top of the file |',
        jsx('// Server Component: fetches next to the data, ships no JavaScript',
            'export default async function ProductPage({ id }) {',
            '  const product = await db.products.find(id);',
            '  return <AddToCart productId={product.id} price={product.price} />;',
            '}',
            '',
            '// AddToCart.jsx',
            "'use client';",
            'export default function AddToCart({ productId, price }) {',
            '  const [count, setCount] = useState(0);',
            '  return <button onClick={() => setCount(count + 1)}>Add · {count}</button>;',
            '}'),
        '**Why they exist:** less JavaScript in the browser (a markdown renderer or a date library used only on the server never ships), data fetched next to the data (no API endpoint, no loading waterfall in the browser), and secrets that stay on the server, while interactive parts stay Client Components.',
        '**The rules at the boundary.** `\'use client\'` marks a file, and everything it imports, as client code. Props from a Server Component to a Client Component must be **serialisable**: strings, numbers, plain objects, arrays, dates, promises, JSX; not functions (except Server Functions marked `\'use server\'`) and not class instances. A Client Component cannot import a Server Component, but can receive one as `children`, rendered on the server.',
        '**Server Functions** (`\'use server\'`) go the other way: server code the browser can call, typically as a form action. Each one is a public endpoint, so validate the input and check permissions inside it.',
        '**Not the same as SSR:** SSR makes HTML on the server for the first load, and every component still hydrates in the browser. Server Components decide which components ever reach the browser. Frameworks combine both.'
      ].join('\n\n'),
      followups: [
        'Can a Client Component import a Server Component? How do you put one inside the other?',
        'Why can you not pass an `onClick` from a Server Component to a Client Component?',
        'How are Server Components different from SSR?',
        'What does `\'use server\'` mark, and what must you check inside such a function?',
        'Would you use Server Components for a dashboard behind a login? Why, or why not?'
      ],
      related: ['lesson:r-server-components', 'lesson:r-rendering-strategies', 'lesson:r-actions', 'lesson:r-composition']
    },
    {
      id: 'testing', track: 'react19', weight: 2, source: '18_React_QA.md#38',
      q: 'How do you test React components?',
      keywords: ['testing', 'test', 'react testing library', 'testing library', 'rtl', 'vitest', 'jest', 'user-event', 'jest-dom', 'msw', 'playwright', 'cypress', 'getByRole', 'unit test', 'integration test', 'e2e'],
      short: 'Vitest (or Jest) runs the tests; **React Testing Library** renders a component and finds elements the way a user does, by role and name, label or text; **user-event** clicks and types like a person; **jest-dom** adds matchers such as `toBeInTheDocument`; MSW mocks the network; Playwright or Cypress test the whole app in a real browser. The principle: test the behaviour users see, not implementation details, so tests survive refactoring.',
      answer: [
        '| Tool | Role |\n|---|---|\n' +
        '| Vitest or Jest | Test runner, assertions, mock functions (`vi.fn()`) |\n' +
        '| React Testing Library | Render components and query them as users do (by role, label, text) |\n' +
        '| `@testing-library/user-event` | Realistic typing and clicking |\n' +
        '| `@testing-library/jest-dom` | Matchers: `toBeInTheDocument`, `toHaveTextContent`, `toBeDisabled` |\n' +
        '| MSW (Mock Service Worker) | Mock API calls at the network level |\n' +
        '| Playwright or Cypress | End-to-end tests in a real browser |',
        jsx("import { render, screen } from '@testing-library/react';",
            "import userEvent from '@testing-library/user-event';",
            '',
            "test('adds a todo', async () => {",
            '  const user = userEvent.setup();',
            '  render(<TodoApp />);',
            "  await user.type(screen.getByLabelText('New todo'), 'Buy milk');",
            "  await user.click(screen.getByRole('button', { name: 'Add' }));",
            "  expect(screen.getByText('Buy milk')).toBeInTheDocument();",
            '});'),
        '**Queries, in order of preference:** `getByRole` (with `name`), `getByLabelText`, `getByPlaceholderText`, `getByText`, then `getByDisplayValue`, `getByAltText`, `getByTitle`, and `getByTestId` last. A query by role also checks the element is accessible.',
        '**getBy, queryBy, findBy:** `getBy` throws if nothing (or more than one) matches; `queryBy` returns `null`, for asserting absence; `findBy` waits, for what appears after a fetch. `waitFor` retries any expectation.',
        '**What not to test:** state variable names, class names, internal functions, snapshots of whole components. They change in refactors while the user sees no difference, so the tests fail for no reason.',
        '**Mocking:** `vi.fn()` for callback props; MSW for `fetch`, so the component\'s real data code runs; `renderHook` for a custom hook. **The balance:** many component tests like the one above, a few end-to-end tests for the paths that matter most, unit tests for pure logic.'
      ].join('\n\n'),
      followups: [
        'Why `getByRole` rather than `getByTestId`?',
        'Which query for an element that must not be there? And for one that appears after a fetch?',
        'Why user-event rather than `fireEvent`?',
        'How do you test a component that fetches data?',
        'What is wrong with snapshot tests of whole components?',
        'How do you test a custom hook?'
      ],
      related: ['lesson:r-testing', 'lesson:r-custom-hooks']
    }
  );
})(window.RLT);
