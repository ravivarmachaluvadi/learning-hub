/*
 * Playground templates: starting points in the Playground's "Templates…" menu.
 * Template shape: {id, title, code, css?}. tests/test_ui.py runs every one of them and requires a
 * clean console.
 */
(function (U) {
  U.data.templates = [
    {
      id: 'counter', title: 'Counter (useState)',
      code: `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="box">
      <h1>{count}</h1>
      <button onClick={() => setCount(c => c - 1)}>−</button>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
`,
      css: '.box { text-align: center; } .box h1 { font-size: 48px; margin: 8px 0; } button { font-size: 20px; min-width: 44px; margin: 0 4px; }'
    },
    {
      id: 'list', title: 'A list you can add to',
      code: `import { useState } from 'react';

export default function App() {
  const [items, setItems] = useState([
    { id: 1, text: 'Learn JSX' },
    { id: 2, text: 'Learn props' }
  ]);
  const [text, setText] = useState('');

  function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setItems([...items, { id: Date.now(), text: text.trim() }]);
    setText('');
  }

  return (
    <>
      <form onSubmit={add}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Something to learn" />
        <button>Add</button>
      </form>
      <ul>
        {items.map(item => <li key={item.id}>{item.text}</li>)}
      </ul>
    </>
  );
}
`
    },
    {
      id: 'fetch', title: 'Fetch users from the pretend API',
      code: `import { useState, useEffect } from 'react';

export default function App() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers);
  }, []);

  if (!users) return <p>Loading…</p>;
  return (
    <ul>
      {users.map(u => (
        <li key={u.id}>{u.name} <small>({u.role})</small></li>
      ))}
    </ul>
  );
}
`
    },
    {
      id: 'action', title: 'A form action (useActionState, React 19)',
      code: `import { useActionState } from 'react';

async function subscribe(previous, formData) {
  const email = formData.get('email');
  await new Promise(r => setTimeout(r, 600));          // pretend to call a server
  if (!email.includes('@')) return { ok: false, message: 'That does not look like an email.' };
  return { ok: true, message: 'Subscribed ' + email };
}

export default function App() {
  const [result, formAction, isPending] = useActionState(subscribe, null);
  return (
    <form action={formAction}>
      <input name="email" placeholder="you@example.com" />
      <button disabled={isPending}>{isPending ? 'Subscribing…' : 'Subscribe'}</button>
      {result && <p className={result.ok ? 'ok' : 'bad'}>{result.message}</p>}
    </form>
  );
}
`,
      css: '.ok { color: #1a7f37; } .bad { color: #c62828; }'
    },
    {
      id: 'tests', title: 'A component and its tests (Vitest, Testing Library)',
      code: `import { useState } from 'react';
import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export default function Toggle() {
  const [on, setOn] = useState(false);
  return <button aria-pressed={on} onClick={() => setOn(!on)}>{on ? 'On' : 'Off'}</button>;
}

// the results show in the console, under the preview
test('starts off', () => {
  render(<Toggle />);
  expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'false');
});

test('a click turns it on', async () => {
  const user = userEvent.setup();
  render(<Toggle />);
  await user.click(screen.getByRole('button'));
  expect(screen.getByRole('button', { name: 'On' })).toHaveAttribute('aria-pressed', 'true');
});
`
    },
    {
      id: 'blank', title: 'Empty component',
      code: `export default function App() {
  return <h1>Hello</h1>;
}
`
    }
  ];
})(window.RLT);
