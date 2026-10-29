/*
 * Lessons, track 6: React 19 and beyond.
 *
 * The lesson shape, and how the code is written (template literals that never use `${`), are
 * described at the top of data/lessons-foundations.js. Every challenge says `strict: true`, as the
 * last three tracks' do. What the lessons say React 19.3 does was probed in this tool's preview
 * first (ROADMAP.md, batch 5). Three things here stand in for what a preview cannot have:
 *   - a pretend server: async functions that wait (and sometimes fail), in the code itself;
 *   - server HTML: the rendering lesson hydrates strings that are exactly what React 19.3's
 *     renderToString makes of the same components (checked against it when written);
 *   - Server Components: the preview runs every component in the browser, and the challenge's
 *     checks hold the server part to a Server Component's rules (t.components, js/preview.js).
 * The testing lesson's tests run on the stand-ins of js/testing.js (t.tests, t.testsOf).
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  function block(lang, lines) { return '```' + lang + '\n' + lines.join('\n') + '\n```'; }
  function jsx() { return block('jsx', [].slice.call(arguments)); }
  function js() { return block('js', [].slice.call(arguments)); }

  L.push(
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'r-actions', track: 'react19',
      title: 'Actions: async work React keeps track of',
      summary: 'An Action is a function, usually async, that React runs in a transition: it tracks the pending state for you, keeps the page responsive, and sends a thrown error to the error boundary. Pass one to <form action={…}> and it receives the FormData, and the form empties itself when it is done.',
      keywords: ['actions', 'action', 'form action', 'form actions', 'async transition', 'startTransition async', 'useTransition', 'isPending', 'pending state', 'FormData', 'formAction', 'requestFormReset', 'form reset', 'onSubmit vs action', 'react 19 forms', 'double submit'],
      docs: 'https://react.dev/reference/react-dom/components/form',
      body: [
        'Before React 19, every form that talked to a server carried the same bookkeeping: `e.preventDefault()`, a `saving` state set to `true` and back to `false` in `finally`, an `error` state, and a line to empty the inputs. React 19 does that bookkeeping itself, for a function it calls an **Action**.',
        jsx('// React 18: you track everything',
            'function Rename() {',
            "  const [name, setName] = useState('');",
            '  const [saving, setSaving] = useState(false);',
            '  async function handleSubmit(e) {',
            '    e.preventDefault();',
            '    setSaving(true);',
            '    try { await saveName(name); setName(\'\'); }',
            '    finally { setSaving(false); }',
            '  }',
            '  return <form onSubmit={handleSubmit}>…</form>;',
            '}',
            '',
            '// React 19: the form calls an Action',
            'function Rename() {',
            '  async function rename(formData) {',
            "    await saveName(formData.get('name'));",
            '  }',
            '  return (',
            '    <form action={rename}>',
            '      <input name="name" />',
            '      <button>Save</button>',
            '    </form>',
            '  );',
            '}'),
        '## What React does around an Action',
        '| You write | React |\n|---|---|\n' +
        '| `<form action={fn}>` | Calls `fn(formData)` when the form is submitted, inside a transition. No `preventDefault` |\n' +
        '| `startTransition(async () => { … })` | Treats the whole async function as one transition: `isPending` stays `true` until it returns |\n' +
        '| An error thrown inside | Sends it to the nearest error boundary ([[lesson:r-error-boundaries]]) |\n' +
        '| A form action that finished | Resets the form: every field without `value` goes back to its `defaultValue` |',
        '## FormData: no state for the inputs',
        'The action receives the form\'s fields as a `FormData`: `formData.get(\'name\')` is the value of the field with `name="name"`, a ticked checkbox gives `\'on\'` and an unticked one `null`, and `formData.getAll(\'tags\')` collects fields that share a name. So the inputs need no state at all: no `value`, no `onChange`. A controlled input still works, but the reset leaves it alone.',
        '## Pending: isPending from a transition',
        'A button that is not in a form gets its pending state from `useTransition` ([[lesson:r-transitions]]), which in React 19 accepts an async function:',
        jsx('const [isPending, startTransition] = useTransition();',
            '',
            'function handlePublish() {',
            '  startTransition(async () => {',
            '    await publishPost();',
            "    startTransition(() => setStatus('Published'));",
            '  });',
            '}',
            '',
            '<button onClick={handlePublish} disabled={isPending}>',
            "  {isPending ? 'Publishing…' : 'Publish'}",
            '</button>'),
        'While `isPending` is `true` the button is disabled, so a second click cannot publish twice. Why the second `startTransition`: after an `await`, JavaScript has lost track of the transition, so a state update there is an ordinary one again. React still applies it, and usually you cannot tell; when several Actions overlap you can ([[lesson:r-use-optimistic]] shows it), so React\'s documentation wraps updates after `await` in `startTransition` again.',
        'For a **form\'s** pending state there are two hooks, the next two lessons: `useActionState` gives it to the component that owns the form ([[lesson:r-use-action-state]]), and `useFormStatus` to a button inside the form ([[lesson:r-use-form-status]]).',
        '## Errors',
        'An error thrown in an Action reaches the nearest error boundary, which replaces part of the page. That suits the unexpected (the server is down). For an error the user can fix, catch it and show it next to the form:',
        jsx('startTransition(async () => {',
            '  try {',
            '    await publishPost();',
            '  } catch (e) {',
            '    startTransition(() => setError(e.message));',
            '  }',
            '});'),
        '## Two buttons, two actions',
        'A button can override its form\'s action: `<button formAction={saveDraft}>Save draft</button>` sends the same fields to `saveDraft` instead. And `requestFormReset(form)`, from `react-dom`, resets a form at the end of the current transition, for the rare form whose own action is not the one running.',
        'Actions are also how React 19 talks to a server: a **Server Function** (`\'use server\'`) passed to `<form action>` is called over the network ([[lesson:r-server-components]]). The interview question is [[q:react-19]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript a form submits itself: the browser loads the `action` URL with the fields, unless your `submit` listener calls `e.preventDefault()` and sends `new FormData(form)` with `fetch`. You then disable the button, enable it again in `finally`, and call `form.reset()` on success. React 19\'s `<form action={fn}>` is that same listener, written once by React: `fn` receives the `FormData`, the pending state is tracked for you, and the form is reset after it.',
      example: {
        code: `import { useState, useTransition } from 'react';

// a pretend server: it answers after a moment
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let nextId = 2;

export default function Notes() {
  const [notes, setNotes] = useState([{ id: 1, text: 'Buy milk' }]);
  const [isPending, startTransition] = useTransition();

  // a form action: React calls it with the form's data, and empties the form when it is done
  async function addNote(formData) {
    const text = formData.get('note');
    console.log('saving', text);
    await wait(600);
    setNotes(n => [...n, { id: nextId++, text }]);
  }

  // an Action outside a form: isPending stays true until it has finished
  function clearAll() {
    startTransition(async () => {
      await wait(800);
      startTransition(() => setNotes([]));
    });
  }

  return (
    <div>
      <form action={addNote}>
        <input name="note" placeholder="A new note" />
        <button>Add</button>
      </form>
      <ul>
        {notes.map(n => <li key={n.id}>{n.text}</li>)}
      </ul>
      <button onClick={clearAll} disabled={isPending}>
        {isPending ? 'Clearing…' : 'Clear all'}
      </button>
    </div>
  );
}
`,
        css: 'form { display: flex; gap: 6px; } input { padding: 4px 8px; }',
        note: 'Type a note and press **Add**: the box empties by itself once the pretend server has answered, and no state holds what you typed. **Clear all** keeps its button disabled for the whole 0.8 seconds.'
      },
      challenge: {
        title: 'Tags and a Publish button, the React 19 way',
        strict: true,
        task: 'A post editor written the React 18 way. Rewrite it with Actions:\n\n' +
          '- **Add tag** is a form with `action={…}`: the action reads the tag from the `FormData` (`name="tag"`), waits for `saveTag(tag)` and adds what it returns to the list. The box empties by itself: no state for it, no `onSubmit`, no `preventDefault`.\n' +
          '- **Publish** runs `publish(tags)` inside `startTransition(async () => …)`. While it runs, the button reads `Publishing…` and is disabled, so a second click cannot publish twice. Afterwards `.status` says `Published with 2 tags` (or `1 tag`).\n' +
          '- With no tags, `publish` throws. Catch it and show its message in `<p className="error">`; Publish works again.\n\n' +
          '`saveTag` and `publish` are the pretend server: do not change them. Keep the classes `.tag-form`, `.tags`, `.publish`, `.status` and `.error`.',
        starter: `import { useState } from 'react';

// the pretend server (do not change)
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function saveTag(tag) {
  await wait(200);
  return tag.trim().toLowerCase();
}
async function publish(tags) {
  await wait(500);
  if (tags.length === 0) throw new Error('Add a tag before publishing');
  console.info('server: published', tags.join(', '));
}

export default function PostEditor() {
  const [tags, setTags] = useState([]);
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState('Draft');

  async function handleAdd(e) {
    e.preventDefault();
    const saved = await saveTag(tag);
    setTags([...tags, saved]);
    setTag('');
  }

  async function handlePublish() {
    await publish(tags);
    setStatus('Published with ' + tags.length + ' tags');
  }

  return (
    <div className="editor">
      <form className="tag-form" onSubmit={handleAdd}>
        <input value={tag} onChange={e => setTag(e.target.value)} placeholder="A tag" />
        <button>Add tag</button>
      </form>
      <ul className="tags">
        {tags.map(t => <li key={t}>{t}</li>)}
      </ul>
      <button className="publish" onClick={handlePublish}>Publish</button>
      <p className="status">{status}</p>
    </div>
  );
}
`,
        solution: `import { useState, useTransition } from 'react';

// the pretend server (do not change)
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function saveTag(tag) {
  await wait(200);
  return tag.trim().toLowerCase();
}
async function publish(tags) {
  await wait(500);
  if (tags.length === 0) throw new Error('Add a tag before publishing');
  console.info('server: published', tags.join(', '));
}

export default function PostEditor() {
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState('Draft');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  // a form action: the form's data comes in, and React empties the form afterwards
  async function addTag(formData) {
    const saved = await saveTag(formData.get('tag'));
    setTags(t => [...t, saved]);
  }

  function handlePublish() {
    startTransition(async () => {
      try {
        await publish(tags);
        startTransition(() => {
          setError('');
          setStatus('Published with ' + tags.length + (tags.length === 1 ? ' tag' : ' tags'));
        });
      } catch (e) {
        startTransition(() => setError(e.message));
      }
    });
  }

  return (
    <div className="editor">
      <form className="tag-form" action={addTag}>
        <input name="tag" placeholder="A tag" />
        <button>Add tag</button>
      </form>
      <ul className="tags">
        {tags.map(t => <li key={t}>{t}</li>)}
      </ul>
      <button className="publish" onClick={handlePublish} disabled={isPending}>
        {isPending ? 'Publishing…' : 'Publish'}
      </button>
      <p className="status">{status}</p>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
`,
        css: '.tag-form { display: flex; gap: 6px; } .tag-form input { padding: 4px 8px; } .tags { padding-left: 18px; } .status { color: #556; } .error { color: #c62828; }',
        hints: [
          'The form: `<form className="tag-form" action={addTag}>` with `<input name="tag" />`, and no `value` or `onChange`. `async function addTag(formData) { const saved = await saveTag(formData.get(\'tag\')); … }` adds `saved` to `tags`; React empties the box once `addTag` has finished.',
          'Publish: `const [isPending, startTransition] = useTransition();`, then `startTransition(async () => { await publish(tags); … })` in the click handler, and on the button `disabled={isPending}` and `{isPending ? \'Publishing…\' : \'Publish\'}`.',
          'An error thrown inside the transition would reach the error boundary and replace the page. Put `await publish(tags)` in a `try`, and in the `catch` set an `error` state from `e.message`; empty it again on success.'
        ],
        checks: [
          { label: 'Publishing with no tags shows why in `.error`, and Publish works again', fn: `async function (doc, win, t) {
  await t.click('.publish');
  await t.wait(650);
  if (doc.querySelector('.rlt-crash')) return 'the error crashed the page: catch it inside the action';
  if (!doc.querySelector('.error')) return 'no .error after publishing with no tags';
  if (t.text('.error') !== 'Add a tag before publishing') return '.error says "' + t.text('.error') + '"';
  return !doc.querySelector('.publish').disabled || 'Publish is still disabled';
}` },
          { label: 'Add tag puts the tag in the list, and the box empties by itself', fn: `async function (doc, win, t) {
  await t.type('.tag-form input', 'React');
  await t.click('.tag-form button');
  await t.wait(350);
  await t.type('.tag-form input', 'News');
  await t.click('.tag-form button');
  await t.wait(350);
  var tags = t.$$('.tags li').map(function (li) { return li.textContent; }).join(', ');
  if (tags !== 'react, news') return '.tags shows: ' + (tags || 'nothing');
  var box = doc.querySelector('.tag-form input').value;
  return box === '' || 'the box still holds "' + box + '"';
}` },
          { label: 'While publishing, the button reads "Publishing…" and is disabled; then `.status` says "Published with 2 tags"', fn: `async function (doc, win, t) {
  await t.click('.publish');
  var b = doc.querySelector('.publish');
  if (b.textContent !== 'Publishing…') return 'while publishing, the button reads "' + b.textContent + '"';
  if (!b.disabled) return 'while publishing, the button is not disabled';
  await t.wait(650);
  if (t.text('.status') !== 'Published with 2 tags') return '.status says "' + t.text('.status') + '"';
  return (!b.disabled && b.textContent === 'Publish') || 'afterwards the button reads "' + b.textContent + '"' + (b.disabled ? ', still disabled' : '');
}` },
          { label: 'Two quick clicks on Publish publish once', fn: `async function (doc, win, t) {
  function published() { return t.logs().filter(function (l) { return l.indexOf('server: published') === 0; }).length; }
  var before = published();
  await t.click('.publish');
  await t.click('.publish');
  await t.wait(700);
  var n = published() - before;
  return n === 1 || 'two quick clicks published ' + n + ' times';
}` },
          { label: 'The tag form uses `action={…}`: no `onSubmit`, no `preventDefault`', fn: `function (doc, win, t) {
  var src = t.source();
  if (!/<form[^>]*\\baction=\\{/.test(src)) return 'the <form> has no action={…}';
  return !/onSubmit|preventDefault/.test(src) || 'onSubmit or preventDefault is still there: the action replaces both';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'r-use-action-state', track: 'react19',
      title: 'useActionState: what the last submit returned',
      summary: 'useActionState wraps a form action and keeps what it returns: the errors to show, a message, the values to put back. It gives [state, formAction, isPending], and the action receives the previous state and the FormData. The form resets after each submit, so return what the user typed to keep it.',
      keywords: ['useActionState', 'action state', 'form state', 'formAction', 'isPending', 'previous state', 'server validation', 'field errors', 'form errors', 'useFormState', 'progressive enhancement', 'permalink', 'keep values after error', 'defaultValue'],
      docs: 'https://react.dev/reference/react/useActionState',
      body: [
        'A form\'s action usually has something to say back: "That email is taken", "Saved". With only `<form action>`, you would add one state for that and another for the pending flag. `useActionState` is that state, owned by the action:',
        jsx("import { useActionState } from 'react';",
            '',
            'async function subscribe(previousState, formData) {',
            "  const result = await saveEmail(formData.get('email'));   // the server",
            '  return result.ok ? { message: \'Subscribed\' } : { error: result.error };',
            '}',
            '',
            'function Newsletter() {',
            '  const [state, formAction, isPending] = useActionState(subscribe, {});',
            '  return (',
            '    <form action={formAction}>',
            '      <input name="email" />',
            "      <button disabled={isPending}>{isPending ? 'Subscribing…' : 'Subscribe'}</button>",
            '      {state.error && <p className="error">{state.error}</p>}',
            '    </form>',
            '  );',
            '}'),
        '| It returns | What it is |\n|---|---|\n' +
        '| `state` | The initial state at first; afterwards whatever the action last returned |\n' +
        '| `formAction` | What you pass to `<form action>`, or to a button\'s `formAction` |\n' +
        '| `isPending` | `true` from the submit until the action has returned |',
        'The action is called with the **previous state** first and the `FormData` second, so it can build on the last result: count the attempts, keep a history.',
        '## The form resets, so send the values back',
        'After every action React resets the form: each field goes back to its `defaultValue`. After a success that is what you want. After an error it would wipe what the user typed, so return the values with the error and use them as the defaults:',
        jsx('async function signUp(previous, formData) {',
            "  const email = formData.get('email');",
            "  const result = await createAccount(email, formData.get('password'));",
            '  if (result.errors) return { errors: result.errors, email };   // the email, never the password',
            '  return { user: result.user };',
            '}',
            '',
            '<input name="email" defaultValue={state.email} />'),
        'The new state arrives before the reset, so the box is reset to the email the user typed. Never send a password back into the page: let that box empty.',
        '## Submits wait their turn',
        'Submit three times quickly and the action runs three times, **one after another**, each receiving the state the one before returned; `isPending` stays `true` until the last one finishes. Three `startTransition` calls, by contrast, would run side by side.',
        '## Return or throw?',
        'Return what the user can fix (a taken email, a short password): it is state, shown next to the field. Throw what they cannot (the server is down): it goes to the error boundary.',
        '## Where it came from',
        'Before React 19 was released it was called `useFormState` and lived in `react-dom`; you will meet that name in older articles. A third argument, a `permalink` URL, matters with Server Components: it lets the form work before the JavaScript has loaded. The interview questions are [[q:forms]] and [[q:react-19]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript the submit handler writes its results into the page by hand: `emailError.textContent = "…"`, `button.disabled = true` and back. And the typed values survive an error for free, because nothing reset the form. With React 19\'s form actions the form is reset after every submit, so the values to keep travel back in the state the action returns, and React draws the errors from that state.',
      example: {
        code: `import { useActionState } from 'react';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// a pretend server: ada@example.com is already on the list
async function subscribe(previous, formData) {
  const email = formData.get('email');
  console.log('previous state:', previous, '· email:', email);
  await wait(600);
  if (!email.includes('@')) return { error: 'That does not look like an email.', email };
  if (email === 'ada@example.com') return { error: email + ' is already subscribed.', email };
  return { message: 'Subscribed ' + email };
}

export default function Newsletter() {
  const [state, formAction, isPending] = useActionState(subscribe, { email: '' });
  return (
    <form action={formAction}>
      <input name="email" defaultValue={state.email} placeholder="you@example.com" />
      <button disabled={isPending}>{isPending ? 'Subscribing…' : 'Subscribe'}</button>
      {state.error && <p className="bad">{state.error}</p>}
      {state.message && <p className="ok">{state.message}</p>}
    </form>
  );
}
`,
        css: 'input { padding: 4px 8px; width: 210px; } .bad { color: #c62828; } .ok { color: #1a7f37; }',
        note: 'Try `ada@example.com`: the error shows and the email stays in the box, because the action returned it. Try another address: the box empties, as a successful form does. The console shows the previous state each action receives.'
      },
      challenge: {
        title: 'A sign-up the server validates',
        strict: true,
        task: 'Finish the sign-up form. `createAccount(email, password)` is the pretend server (do not change it): it answers `{ errors }` or `{ user }` after half a second.\n\n' +
          '- The action passes the form\'s email and password to `createAccount` and returns the next state.\n' +
          '- Errors show under their fields, in `<p className="error-email">` and `<p className="error-password">`, only when there is one.\n' +
          '- After an error the email box still holds what was typed; the password box is empty.\n' +
          '- While it runs, the button reads `Creating…` and is disabled.\n' +
          '- On success the form is replaced by `<p className="welcome">Welcome, grace@example.com!</p>`.',
        starter: `import { useActionState } from 'react';

// the pretend server (do not change)
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function createAccount(email, password) {
  await wait(500);
  const errors = {};
  if (!email.includes('@')) errors.email = 'Enter an email address';
  else if (email === 'ada@example.com') errors.email = email + ' is already registered';
  if (password.length < 8) errors.password = 'At least 8 characters';
  return Object.keys(errors).length ? { errors } : { user: { email } };
}

async function signUp(previous, formData) {
  const result = await createAccount(formData.get('email'), formData.get('password'));
  return result;
}

export default function SignUp() {
  const [state, formAction] = useActionState(signUp, {});
  const errors = state.errors || {};
  if (state.user) return <p className="welcome">Welcome, {state.user.email}!</p>;
  return (
    <form className="signup" action={formAction}>
      <label>Email <input name="email" /></label>
      {errors.email && <p className="error-email">{errors.email}</p>}
      <label>Password <input name="password" type="password" /></label>
      {errors.password && <p className="error-password">{errors.password}</p>}
      <button>Create account</button>
    </form>
  );
}
`,
        solution: `import { useActionState } from 'react';

// the pretend server (do not change)
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function createAccount(email, password) {
  await wait(500);
  const errors = {};
  if (!email.includes('@')) errors.email = 'Enter an email address';
  else if (email === 'ada@example.com') errors.email = email + ' is already registered';
  if (password.length < 8) errors.password = 'At least 8 characters';
  return Object.keys(errors).length ? { errors } : { user: { email } };
}

async function signUp(previous, formData) {
  const email = formData.get('email');
  const result = await createAccount(email, formData.get('password'));
  if (result.errors) return { errors: result.errors, email };   // keep the email; never send the password back
  return { user: result.user };
}

export default function SignUp() {
  const [state, formAction, isPending] = useActionState(signUp, { email: '' });
  const errors = state.errors || {};
  if (state.user) return <p className="welcome">Welcome, {state.user.email}!</p>;
  return (
    <form className="signup" action={formAction}>
      <label>Email <input name="email" defaultValue={state.email} /></label>
      {errors.email && <p className="error-email">{errors.email}</p>}
      <label>Password <input name="password" type="password" /></label>
      {errors.password && <p className="error-password">{errors.password}</p>}
      <button disabled={isPending}>{isPending ? 'Creating…' : 'Create account'}</button>
    </form>
  );
}
`,
        css: '.signup { display: grid; gap: 6px; max-width: 260px; } .signup label { display: grid; gap: 2px; } .signup input { padding: 4px 8px; } .error-email, .error-password { margin: 0; color: #c62828; font-size: 14px; } .welcome { color: #1a7f37; font-weight: 600; }',
        hints: [
          'The form is reset after every action, so whatever must survive an error has to come back in the state. Return `{ errors: result.errors, email }` when there are errors, and `{ user: result.user }` when there are none.',
          'Put it back with `<input name="email" defaultValue={state.email} />`, and start from `useActionState(signUp, { email: \'\' })`. Leave the password box alone: it empties, as it should.',
          'The third value of `useActionState` is `isPending`: `<button disabled={isPending}>{isPending ? \'Creating…\' : \'Create account\'}</button>`.'
        ],
        checks: [
          { label: 'A taken email and a short password: both errors show under their fields', fn: `async function (doc, win, t) {
  await t.type('input[name=email]', 'ada@example.com');
  await t.type('input[name=password]', 'short');
  await t.click('.signup button');
  await t.wait(650);
  if (t.text('.error-email') !== 'ada@example.com is already registered') return '.error-email says ' + JSON.stringify(t.text('.error-email'));
  return t.text('.error-password') === 'At least 8 characters' || '.error-password says ' + JSON.stringify(t.text('.error-password'));
}` },
          { label: 'After the error, the email is still in its box and the password box is empty', fn: `function (doc) {
  var email = doc.querySelector('input[name=email]').value, password = doc.querySelector('input[name=password]').value;
  if (email !== 'ada@example.com') return 'the email box holds "' + email + '": return the email with the errors, and use it as defaultValue';
  return password === '' || 'the password box still holds "' + password + '"';
}` },
          { label: 'Fix only the password: just the email error remains', fn: `async function (doc, win, t) {
  await t.type('input[name=password]', 'longenough1');
  await t.click('.signup button');
  await t.wait(650);
  if (doc.querySelector('.error-password')) return '.error-password still shows: "' + t.text('.error-password') + '"';
  return t.text('.error-email') === 'ada@example.com is already registered' || '.error-email says ' + JSON.stringify(t.text('.error-email'));
}` },
          { label: 'While it runs, the button reads "Creating…" and is disabled', fn: `async function (doc, win, t) {
  await t.type('input[name=email]', 'grace@example.com');
  await t.type('input[name=password]', 'longenough1');
  await t.click('.signup button');
  var b = doc.querySelector('.signup button');
  if (!b) return 'the form is gone at once: the button should wait for the server';
  if (b.textContent !== 'Creating…') return 'while it runs, the button reads "' + b.textContent + '"';
  return b.disabled || 'while it runs, the button is not disabled';
}` },
          { label: 'Then the form is replaced by "Welcome, grace@example.com!"', fn: `async function (doc, win, t) {
  await t.wait(650);
  if (doc.querySelector('.signup')) return 'the form is still there';
  return t.text('.welcome') === 'Welcome, grace@example.com!' || '.welcome says ' + JSON.stringify(t.text('.welcome'));
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'r-use-form-status', track: 'react19',
      title: 'useFormStatus: a button that knows its form',
      summary: 'useFormStatus, from react-dom, tells a component inside a <form> whether that form is being submitted, and with what data. It reads the nearest form above it, so call it in the button\'s own component: in the component that renders the <form>, it always says false.',
      keywords: ['useFormStatus', 'form status', 'pending', 'submit button', 'SubmitButton', 'react-dom hook', 'design system button', 'loading button', 'form data', 'nearest form', 'pending always false'],
      docs: 'https://react.dev/reference/react-dom/hooks/useFormStatus',
      body: [
        'A design system has one `SubmitButton` that every form uses. It should say "Saving…" while its own form is being sent, without each form passing a `pending` prop down to it. `useFormStatus` lets the button ask its form:',
        jsx("import { useFormStatus } from 'react-dom';",
            '',
            'function SubmitButton({ children }) {',
            '  const { pending } = useFormStatus();',
            '  return <button disabled={pending}>{pending ? \'Saving…\' : children}</button>;',
            '}',
            '',
            '<form action={saveProfile}>',
            '  <input name="name" />',
            '  <SubmitButton>Save</SubmitButton>',
            '</form>'),
        '| `useFormStatus()` gives | While the form is being sent | Otherwise |\n|---|---|---|\n' +
        '| `pending` | `true` | `false` |\n' +
        '| `data` | The `FormData` being sent | `null` |\n' +
        '| `method` | `\'get\'` or `\'post\'` | `\'get\'` |\n' +
        '| `action` | The function (or URL) the form was sent to | `null` |',
        'It comes from `react-dom`, not `react`: it is about a DOM form.',
        '## Only from inside the form',
        'It reads the nearest `<form>` **above** the component, the way `useContext` reads the nearest provider. In the component that renders the form there is no form above, so it always says `false`, and React gives no warning:',
        jsx('function Newsletter() {',
            '  const { pending } = useFormStatus();          // ❌ always false: this component renders the form',
            '  return (',
            '    <form action={subscribe}>',
            '      <button disabled={pending}>Subscribe</button>',
            '    </form>',
            '  );',
            '}'),
        'The fix is a component of its own for the part that needs the status, rendered inside the form. That is why it is almost always a button.',
        '## Each form its own',
        'Two forms on a page, each with a `SubmitButton`: only the buttons of the form being sent are pending. `data` tells a component what is being sent, for a line such as "Sending to ada@example.com…".',
        '## useFormStatus or useActionState?',
        '| | `useActionState` | `useFormStatus` |\n|---|---|---|\n' +
        '| Called in | The component that owns the form | Any component inside a form |\n' +
        '| Gives | The action\'s result, and `isPending` | Only the status: `pending`, `data`, `method`, `action` |\n' +
        '| Good for | Errors and messages from the server | Reusable buttons, spinners, "sending…" lines |',
        'They work together: the form\'s owner shows the result with `useActionState`, and its `SubmitButton` shows the pending state with `useFormStatus`. The interview question is [[q:forms]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript the submit handler finds its own button (`e.submitter`, or `form.querySelector("button")`) and disables it, and every form repeats that code. useFormStatus turns it around: the button asks its form. One `SubmitButton` component then works in every form, the way a CSS class works on every button.',
      example: {
        code: `import { useState } from 'react';
import { useFormStatus } from 'react-dom';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// one button for every form: it asks the form above it
function SubmitButton({ children }) {
  const { pending, data } = useFormStatus();
  return (
    <button disabled={pending}>
      {pending ? 'Sending "' + data.get('text') + '"…' : children}
    </button>
  );
}

function MessageForm({ label, delay }) {
  const [sent, setSent] = useState('');
  async function send(formData) {
    await wait(delay);
    setSent(formData.get('text'));
  }
  return (
    <form action={send}>
      <input name="text" placeholder={label} />
      <SubmitButton>Send</SubmitButton>
      {sent && <span> sent: {sent}</span>}
    </form>
  );
}

export default function App() {
  return (
    <>
      <MessageForm label="A quick message" delay={600} />
      <MessageForm label="A slow message" delay={1800} />
    </>
  );
}
`,
        css: 'form { margin: 0 0 8px; } input { padding: 4px 8px; }',
        note: 'Send a message in each form: each `SubmitButton` follows its own form, and reads what is being sent from `data`.'
      },
      challenge: {
        title: 'One SubmitButton for two forms',
        strict: true,
        task: 'Both forms try to show a pending button, and neither does: they call `useFormStatus` in the component that renders the form. Fix it with components that sit **inside** the forms:\n\n' +
          '- `SubmitButton({ children, pendingText })` calls `useFormStatus()`. While its form is sent it shows `pendingText` and is disabled; otherwise it shows `children`. Both forms use it.\n' +
          '- In the newsletter form, a `SendingTo` component under the button shows `<p className="sending">Sending to ada@example.com…</p>` while that form is sent (the email comes from `data`), and nothing otherwise.\n\n' +
          'The actions and the pretend server are given. Keep the classes `.newsletter`, `.feedback` and `.done`.',
        starter: `import { useState } from 'react';
import { useFormStatus } from 'react-dom';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function Newsletter() {
  const [done, setDone] = useState('');
  const { pending } = useFormStatus();
  async function subscribe(formData) {
    await wait(900);
    setDone('Subscribed ' + formData.get('email'));
  }
  return (
    <form className="newsletter" action={subscribe}>
      <input name="email" placeholder="you@example.com" />
      <button disabled={pending}>{pending ? 'Subscribing…' : 'Subscribe'}</button>
      {done && <p className="done">{done}</p>}
    </form>
  );
}

function Feedback() {
  const [done, setDone] = useState('');
  const { pending } = useFormStatus();
  async function send(formData) {
    await wait(600);
    setDone('Thanks for the feedback');
  }
  return (
    <form className="feedback" action={send}>
      <textarea name="message" placeholder="Your feedback" />
      <button disabled={pending}>{pending ? 'Sending…' : 'Send feedback'}</button>
      {done && <p className="done">{done}</p>}
    </form>
  );
}

export default function App() {
  return (
    <>
      <Newsletter />
      <Feedback />
    </>
  );
}
`,
        solution: `import { useState } from 'react';
import { useFormStatus } from 'react-dom';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// inside a form, it reads that form's status
function SubmitButton({ children, pendingText }) {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? pendingText : children}</button>;
}

function SendingTo() {
  const { pending, data } = useFormStatus();
  if (!pending) return null;
  return <p className="sending">Sending to {data.get('email')}…</p>;
}

function Newsletter() {
  const [done, setDone] = useState('');
  async function subscribe(formData) {
    await wait(900);
    setDone('Subscribed ' + formData.get('email'));
  }
  return (
    <form className="newsletter" action={subscribe}>
      <input name="email" placeholder="you@example.com" />
      <SubmitButton pendingText="Subscribing…">Subscribe</SubmitButton>
      <SendingTo />
      {done && <p className="done">{done}</p>}
    </form>
  );
}

function Feedback() {
  const [done, setDone] = useState('');
  async function send(formData) {
    await wait(600);
    setDone('Thanks for the feedback');
  }
  return (
    <form className="feedback" action={send}>
      <textarea name="message" placeholder="Your feedback" />
      <SubmitButton pendingText="Sending…">Send feedback</SubmitButton>
      {done && <p className="done">{done}</p>}
    </form>
  );
}

export default function App() {
  return (
    <>
      <Newsletter />
      <Feedback />
    </>
  );
}
`,
        css: 'form { display: grid; gap: 6px; max-width: 280px; margin-bottom: 14px; } input, textarea { padding: 4px 8px; } .sending { margin: 0; color: #667; font-size: 14px; } .done { margin: 0; color: #1a7f37; }',
        hints: [
          '`useFormStatus` reads the form **above** the component that calls it. `Newsletter` renders the form, so for it there is no form above: `pending` is always `false`.',
          'Write `function SubmitButton({ children, pendingText }) { const { pending } = useFormStatus(); return <button disabled={pending}>{pending ? pendingText : children}</button>; }` and use it in both forms, removing the forms\' own `useFormStatus` calls.',
          '`SendingTo` is another small component inside the newsletter form: `const { pending, data } = useFormStatus();`, then `pending ? <p className="sending">Sending to {data.get(\'email\')}…</p> : null`.'
        ],
        checks: [
          { label: 'Subscribe: while it is sent, its button reads "Subscribing…" and is disabled', fn: `async function (doc, win, t) {
  await t.type('.newsletter input', 'ada@example.com');
  await t.click('.newsletter button');
  var b = doc.querySelector('.newsletter button');
  if (b.textContent !== 'Subscribing…') return 'while it is sent, the button reads "' + b.textContent + '"';
  return b.disabled || 'while it is sent, the button is not disabled';
}` },
          { label: 'Under it: "Sending to ada@example.com…", read from the form\'s data', fn: `function (doc, win, t) {
  return t.text('.newsletter .sending') === 'Sending to ada@example.com…' || '.sending says ' + JSON.stringify(t.text('.newsletter .sending'));
}` },
          { label: 'Meanwhile the feedback form\'s button still reads "Send feedback", and works', fn: `function (doc) {
  var b = doc.querySelector('.feedback button');
  if (b.textContent !== 'Send feedback') return 'the feedback button reads "' + b.textContent + '" while the other form is sent';
  return !b.disabled || 'the feedback button is disabled while the other form is sent';
}` },
          { label: 'Send feedback: "Sending…" while sent; then both forms say they are done', fn: `async function (doc, win, t) {
  await t.type('.feedback textarea', 'Nice tool');
  await t.click('.feedback button');
  var b = doc.querySelector('.feedback button');
  if (b.textContent !== 'Sending…' || !b.disabled) return 'while it is sent, the feedback button reads "' + b.textContent + '"' + (b.disabled ? '' : ' and is not disabled');
  await t.wait(1000);
  if (t.text('.newsletter .done') !== 'Subscribed ada@example.com') return 'the newsletter says ' + JSON.stringify(t.text('.newsletter .done'));
  if (t.text('.feedback .done') !== 'Thanks for the feedback') return 'the feedback form says ' + JSON.stringify(t.text('.feedback .done'));
  if (doc.querySelector('.sending')) return '.sending still shows after the form was sent';
  return doc.querySelector('.newsletter button').textContent === 'Subscribe' || 'afterwards the newsletter button reads "' + doc.querySelector('.newsletter button').textContent + '"';
}` },
          { label: 'One `SubmitButton`, rendered in both forms', fn: `function (doc, win, t) {
  var n = t.components('SubmitButton').length;
  return n === 2 || 'found ' + n + ' SubmitButton components on the page';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'r-use-optimistic', track: 'react19',
      title: 'useOptimistic: show it before the server answers',
      summary: 'useOptimistic shows the result of an action at once, while the request is still on its way: a like, a sent message. Its value is the real state plus the updates still pending; when the action ends it falls back to the real state, so a failure undoes itself, and a success stays because you set the real state.',
      keywords: ['useOptimistic', 'optimistic update', 'optimistic ui', 'optimistic state', 'rollback', 'revert on error', 'instant feedback', 'like button', 'pending message', 'sending', 'addOptimistic', 'outside a transition'],
      docs: 'https://react.dev/reference/react/useOptimistic',
      body: [
        'A like on a slow network: wait for the server and the heart turns red a second later, which feels broken. Turn it red at once and you must remember to turn it back if the server says no. `useOptimistic` does the remembering:',
        jsx("import { useState, useOptimistic, startTransition } from 'react';",
            '',
            'const [likes, setLikes] = useState(12);                        // the real state',
            'const [shownLikes, addShownLike] = useOptimistic(likes, (current, change) => current + change);',
            '',
            'function like() {',
            '  startTransition(async () => {',
            '    addShownLike(1);                                   // the screen shows 13 at once',
            '    const saved = await saveLike();                    // …while this is on its way',
            '    startTransition(() => setLikes(saved.likes));      // the real state, for good',
            '  });',
            '}',
            '',
            '<button onClick={like}>♥ {shownLikes}</button>'),
        'You render `shownLikes`, never `likes`. The second argument is how a pending update changes the value: here, add the change.',
        '## What the screen shows, and when',
        '| Moment | `shownLikes` |\n|---|---|\n' +
        '| Before | `likes`, the real state: 12 |\n' +
        '| `addShownLike(1)` | The real state with the pending update applied: 13 |\n' +
        '| The action ends, after `setLikes(13)` | The new real state, 13; the pending update is gone |\n' +
        '| The action ends after a failure, with no `setLikes` | The old real state, 12: the like has undone itself |',
        'That is the whole idea: the optimistic value only lives while the action runs. Nothing to roll back by hand, but also nothing kept unless you set the real state.',
        '## Only inside an action',
        'Call the update function inside an Action: a form action, or `startTransition`. Called anywhere else, React logs "An optimistic state update occurred outside a transition or action". On its own, as in a plain click handler, it then shows nothing; called just before a transition starts, it may seem to work, but React still reports it, so do not rely on it.',
        '## Several at once',
        'Two comments sent quickly are two actions in flight, and the optimistic list holds both. Here the second `startTransition` matters: if the first comment\'s real update is made after `await` without it, that update is not part of the transition, the first comment arrives in the real list while its optimistic copy is still shown, and it appears **twice** until the second answer comes back. Wrapped in `startTransition`, both optimistic copies stay until both actions are done, then the real list replaces them in one go. [[build:optimistic-comments]] makes you handle exactly this.',
        '## Show what is not confirmed',
        'Make the optimistic item look provisional: the update function can add `sending: true`, and the list draws such items grey, with "Sending…". If it fails, say so, and give the user their text back.',
        jsx('const [shown, addShown] = useOptimistic(comments, (current, text) =>',
            '  [...current, { id: \'pending-\' + current.length, text, sending: true }]',
            ');'),
        '## When not to',
        'Not for what must not be wrong even for a second: a payment, an irreversible delete, a booking. There, show the pending state and wait for the server ([[lesson:r-actions]]). The interview question is [[q:react-19]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript an optimistic like is three steps: change the page at once (`heart.classList.add("liked")`), send the request, and on failure put it back (`classList.remove`) and show an error. The undo is the part people forget. useOptimistic makes the undo automatic: the optimistic value only lives while the action runs, so after a failure the real state is what shows again.',
      example: {
        code: `import { useState, useOptimistic, startTransition } from 'react';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let serverDown = false;

// a pretend server: it takes a second, and fails while "the server is down" is ticked
async function saveLike(likes) {
  await wait(1000);
  if (serverDown) throw new Error('The server is down');
  return likes;
}

export default function Post() {
  const [likes, setLikes] = useState(12);
  const [shownLikes, addShownLike] = useOptimistic(likes, (current, change) => current + change);
  const [message, setMessage] = useState('');

  function like() {
    startTransition(async () => {
      addShownLike(1);
      try {
        const saved = await saveLike(likes + 1);
        startTransition(() => { setLikes(saved); setMessage('Saved'); });
      } catch (e) {
        startTransition(() => setMessage(e.message + ': the like was undone'));
      }
    });
  }

  return (
    <div>
      <button onClick={like}>♥ {shownLikes}</button>
      <label>
        <input type="checkbox" onChange={e => { serverDown = e.target.checked; }} /> The server is down
      </label>
      <p>{message}</p>
    </div>
  );
}
`,
        css: 'button { font-size: 18px; padding: 4px 14px; } label { margin-left: 10px; }',
        note: 'Click ♥: the count goes up at once, and stays once the pretend server has answered. Tick "The server is down" and click again: the count goes up, then back down a second later, with no code that turns it back.'
      },
      challenge: {
        title: 'A like button that answers at once',
        strict: true,
        task: 'The ♥ button waits a whole second for the server before it changes, which feels broken. Make it optimistic with `useOptimistic`:\n\n' +
          '- A click flips it **at once**: `aria-pressed` and the count in `.count` change before the server answers (12 → 13 when you like, back to 12 when you unlike).\n' +
          '- When the server confirms, it stays as it is.\n' +
          '- When the server fails (tick `.down`, "The server is down"), it flips back when the server answers, and `.error` says `Could not save your like`. A later success empties `.error`.\n\n' +
          '`savePostLike` is the pretend server: do not change it.',
        starter: `import { useState } from 'react';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// the pretend server (do not change)
let serverDown = false;
async function savePostLike(liked) {
  await wait(600);
  if (serverDown) throw new Error('The server is down');
  return liked;
}

export default function LikeButton() {
  const [post, setPost] = useState({ liked: false, likes: 12 });
  const [error, setError] = useState('');

  async function toggle() {
    const liked = !post.liked;
    try {
      await savePostLike(liked);
      setPost(p => ({ liked, likes: p.likes + (liked ? 1 : -1) }));
      setError('');
    } catch (e) {
      setError('Could not save your like');
    }
  }

  return (
    <div className="post">
      <button className="like" aria-pressed={post.liked} onClick={toggle}>
        ♥ <span className="count">{post.likes}</span>
      </button>
      <label>
        <input className="down" type="checkbox" onChange={e => { serverDown = e.target.checked; }} /> The server is down
      </label>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
`,
        solution: `import { useState, useOptimistic, startTransition } from 'react';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// the pretend server (do not change)
let serverDown = false;
async function savePostLike(liked) {
  await wait(600);
  if (serverDown) throw new Error('The server is down');
  return liked;
}

export default function LikeButton() {
  const [post, setPost] = useState({ liked: false, likes: 12 });
  const [shown, setShown] = useOptimistic(post, (current, liked) => ({ liked, likes: current.likes + (liked ? 1 : -1) }));
  const [error, setError] = useState('');

  function toggle() {
    const liked = !shown.liked;
    startTransition(async () => {
      setShown(liked);                      // at once, while the server is asked
      try {
        await savePostLike(liked);
        startTransition(() => {             // the real state: it stays
          setPost(p => ({ liked, likes: p.likes + (liked ? 1 : -1) }));
          setError('');
        });
      } catch (e) {
        startTransition(() => setError('Could not save your like'));   // no setPost: it flips back by itself
      }
    });
  }

  return (
    <div className="post">
      <button className="like" aria-pressed={shown.liked} onClick={toggle}>
        ♥ <span className="count">{shown.likes}</span>
      </button>
      <label>
        <input className="down" type="checkbox" onChange={e => { serverDown = e.target.checked; }} /> The server is down
      </label>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
`,
        css: '.like { font-size: 18px; padding: 4px 14px; border-radius: 20px; border: 1px solid #ccd; background: #fff; } .like[aria-pressed="true"] { color: #d63a3a; border-color: #d63a3a; } label { margin-left: 10px; } .error { color: #c62828; }',
        hints: [
          'Keep the real state in `post`, and render from an optimistic copy: `const [shown, setShown] = useOptimistic(post, (current, liked) => ({ liked, likes: current.likes + (liked ? 1 : -1) }));`. Use `shown` for `aria-pressed` and the count.',
          'In the click handler: `startTransition(async () => { setShown(liked); … await savePostLike(liked); … })`. The optimistic update must be inside the transition, or React refuses it.',
          'On success, set the real `post` (inside `startTransition` again, after the `await`). On failure, do not touch `post`: when the action ends, `shown` falls back to it by itself. Just set the error.'
        ],
        checks: [
          { label: 'A click flips it at once: pressed, 13, before the server answers', fn: `async function (doc, win, t) {
  await t.click('.like');
  var b = doc.querySelector('.like');
  if (b.getAttribute('aria-pressed') !== 'true') return 'right after the click, aria-pressed is "' + b.getAttribute('aria-pressed') + '"';
  return t.text('.count') === '13' || 'right after the click, the count is ' + t.text('.count');
}` },
          { label: 'When the server confirms, it stays: pressed, 13', fn: `async function (doc, win, t) {
  await t.wait(700);
  var b = doc.querySelector('.like');
  if (b.getAttribute('aria-pressed') !== 'true' || t.text('.count') !== '13') return 'after the server answered: aria-pressed "' + b.getAttribute('aria-pressed') + '", count ' + t.text('.count');
  return !doc.querySelector('.error') || '.error shows "' + t.text('.error') + '"';
}` },
          { label: 'With the server down, an unlike flips at once, then back when the server fails, with the error', fn: `async function (doc, win, t) {
  await t.click('.down');
  await t.click('.like');
  var b = doc.querySelector('.like');
  if (b.getAttribute('aria-pressed') !== 'false' || t.text('.count') !== '12') return 'right after the click: aria-pressed "' + b.getAttribute('aria-pressed') + '", count ' + t.text('.count') + ' (expected false, 12)';
  await t.wait(700);
  if (b.getAttribute('aria-pressed') !== 'true' || t.text('.count') !== '13') return 'after the failure: aria-pressed "' + b.getAttribute('aria-pressed') + '", count ' + t.text('.count') + ' (expected it back: true, 13)';
  return t.text('.error') === 'Could not save your like' || '.error says ' + JSON.stringify(t.text('.error'));
}` },
          { label: 'Server back up: unlike flips at once, stays, and the error goes', fn: `async function (doc, win, t) {
  await t.click('.down');
  await t.click('.like');
  var b = doc.querySelector('.like');
  if (b.getAttribute('aria-pressed') !== 'false' || t.text('.count') !== '12') return 'right after the click: aria-pressed "' + b.getAttribute('aria-pressed') + '", count ' + t.text('.count');
  await t.wait(700);
  if (b.getAttribute('aria-pressed') !== 'false' || t.text('.count') !== '12') return 'after the server answered: aria-pressed "' + b.getAttribute('aria-pressed') + '", count ' + t.text('.count');
  return !doc.querySelector('.error') || '.error still says "' + t.text('.error') + '"';
}` },
          { label: 'No optimistic update outside an action (React would refuse it)', fn: `function (doc, win, t) {
  var bad = t.warnings().filter(function (w) { return /optimistic state update occurred outside/.test(w); });
  return !bad.length || 'React said: ' + bad[0];
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'r-use', track: 'react19',
      title: 'use(): read a promise or a context',
      summary: 'use(promise) reads a promise\'s value while rendering: the component suspends until it settles, the nearest <Suspense> shows its fallback meanwhile, and a rejection goes to the error boundary. The promise must outlive the render, so cache it. use(Context) reads a context, and unlike the hooks it may sit inside an if.',
      keywords: ['use', 'use()', 'use promise', 'use hook', 'suspend', 'suspense', 'read a promise', 'data fetching', 'cache promise', 'uncached promise', 'use context', 'conditional context', 'error boundary', 'loading forever', 'react 19 data'],
      docs: 'https://react.dev/reference/react/use',
      body: [
        '[[lesson:r-fetching]] fetched in an effect: render empty, fetch afterwards, put the answer in state, and guard against answers arriving out of order. With `use`, a component reads a promise as if it were the value:',
        jsx("import { use, Suspense } from 'react';",
            '',
            'function Profile({ userPromise }) {',
            '  const user = use(userPromise);          // waits here until it settles',
            '  return <h2>{user.name}</h2>;',
            '}',
            '',
            '<Suspense fallback={<p>Loading…</p>}>',
            '  <Profile userPromise={userPromise} />',
            '</Suspense>'),
        '| When `use` reads the promise, it is | React |\n|---|---|\n' +
        '| Still pending | Suspends the component: the nearest `<Suspense>` shows its fallback, and the component renders again once it settles |\n' +
        '| Resolved | `use` returns the value |\n' +
        '| Rejected | Throws the error to the nearest error boundary ([[lesson:r-error-boundaries]]) |',
        'So the loading state is the `<Suspense>` around it ([[lesson:r-lazy-suspense]]) and the error state the error boundary: the component itself only describes the success.',
        '## The promise must outlive the render',
        jsx('function Profile({ id }) {',
            '  const user = use(fetchUser(id));        // ❌ a new promise on every render',
            '  …',
            '}'),
        'React suspends, waits for that promise, and renders `Profile` again, which calls `fetchUser` again and gets a **new** pending promise. The fallback stays for ever, and React 19.3 says nothing about it. Even `useMemo` does not help: a component that suspends before it has first appeared keeps no state at all, so its `useMemo` starts afresh on every try. Make the promise **outside** rendering:',
        jsx('const cache = new Map();',
            '',
            'function fetchUserOnce(id) {',
            '  if (!cache.has(id)) cache.set(id, fetchUser(id));   // one promise per user',
            '  return cache.get(id);',
            '}',
            '',
            'function Profile({ id }) {',
            '  const user = use(fetchUserOnce(id));',
            '  return <h2>{user.name}</h2>;',
            '}'),
        'Other good places: an event handler that starts the request and stores the promise in state, or a framework or Server Component that passes the promise down as a prop ([[lesson:r-server-components]]). A promise that has already settled is read at once: going back to a user already loaded shows them with no fallback and no new request.',
        '## Errors, and starting over',
        'A rejected promise reaches the nearest error boundary. To try again for another user, give the boundary a `key` that changes with the user (`<ErrorBoundary key={id}>`): a new key is a new boundary, with no error in it ([[lesson:r-reconciliation]]).',
        '## use(Context)',
        '`use(ThemeContext)` reads a context, as `useContext` does ([[lesson:r-context]]). Unlike any hook it may be called inside an `if` or a loop, or after an early `return`: the one exception to [[lesson:r-rules-of-hooks]].',
        jsx('function Badge({ user }) {',
            '  if (!user.admin) return null;',
            '  const theme = use(ThemeContext);        // fine after a return; useContext here would not be',
            '  return <span className={\'badge-\' + theme}>admin</span>;',
            '}'),
        '## An effect, use, or a library?',
        '| | Loading and errors | Races | Caching |\n|---|---|---|---|\n' +
        '| `useEffect` and `fetch` | Your own state | Your own `ignore` flag | None |\n' +
        '| `use` and a cached promise | `<Suspense>` and an error boundary | None: one promise per key | Your own `Map` |\n' +
        '| TanStack Query, a framework\'s loaders | Built in | Handled | Built in, with refetching |',
        'In a real app the third line usually wins; `use` is what those libraries and frameworks build on. The interview question is [[q:react-19]].'
      ].join('\n\n'),
      plainjs: 'A promise is the same object in plain JavaScript and in React; what differs is when you read it. Plain JavaScript reads it with `await` or `.then`, and draws "Loading…" before and the data after, by hand. `use(promise)` lets React do the waiting: the component stops, React shows the nearest fallback, and renders the component again once the promise has settled. Caching it is the `const cache = new Map()` in front of `fetch` that you would write anyway, to avoid fetching twice.',
      example: {
        code: `import { use, Suspense, useState, Component } from 'react';

const NAMES = { 1: 'Ada Lovelace', 2: 'Grace Hopper' };

// a pretend server: user 3 does not exist
function getUser(id) {
  console.log('GET /users/' + id);
  return new Promise((resolve, reject) => setTimeout(() => {
    if (NAMES[id]) resolve({ id, name: NAMES[id] });
    else reject(new Error('No user ' + id));
  }, 700));
}

// one promise per user, made outside rendering
const cache = new Map();
function getUserOnce(id) {
  if (!cache.has(id)) cache.set(id, getUser(id));
  return cache.get(id);
}

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    return this.state.error ? <p className="failed">{this.state.error.message}</p> : this.props.children;
  }
}

function Profile({ id }) {
  const user = use(getUserOnce(id));
  return <h2>{user.name}</h2>;
}

export default function App() {
  const [id, setId] = useState(1);
  return (
    <div>
      {[1, 2, 3].map(n => <button key={n} onClick={() => setId(n)}>User {n}</button>)}
      <ErrorBoundary key={id}>
        <Suspense fallback={<p>Loading…</p>}>
          <Profile id={id} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
`,
        css: 'button { margin-right: 6px; } .failed { color: #c62828; }',
        note: 'Switch between users 1 and 2: each is requested once (see the console), and a user already loaded shows at once. User 3 fails, and the error boundary shows why; its `key` gives the next user a fresh boundary.'
      },
      challenge: {
        title: 'A profile stuck on "Loading…"',
        strict: true,
        task: 'The profile never gets past "Loading…": `Profile` calls `use(getUser(id))`, and `getUser` (the pretend server, do not change it) makes a new promise each time. Fix it:\n\n' +
          '- Cache each user\'s promise by id, in a `Map` outside the components, so a user is requested once and their promise survives the render.\n' +
          '- While a user loads, the `<Suspense>` shows `<p className="loading">Loading…</p>`; then `<h2 className="name">` shows the name.\n' +
          '- User 4 does not exist: the given `ErrorBoundary` shows "Could not load user 4" in `.failed`.\n' +
          '- Going back to a user already loaded shows them at once, with no "Loading…" and no new request. Going back from user 4 to user 3 shows user 3, not the error.',
        starter: `import { use, Suspense, useState, Component } from 'react';

const PEOPLE = { 1: 'Ada Lovelace', 2: 'Grace Hopper', 3: 'Margaret Hamilton' };

// the pretend server (do not change)
function getUser(id) {
  console.info('GET /users/' + id);
  return new Promise((resolve, reject) => setTimeout(() => {
    if (PEOPLE[id]) resolve({ id, name: PEOPLE[id] });
    else reject(new Error('Could not load user ' + id));
  }, 300));
}

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    return this.state.error ? <p className="failed">{this.state.error.message}</p> : this.props.children;
  }
}

function Profile({ id }) {
  const user = use(getUser(id));
  return <h2 className="name">{user.name}</h2>;
}

export default function People() {
  const [id, setId] = useState(1);
  return (
    <div>
      <button className="prev" onClick={() => setId(id - 1)} disabled={id === 1}>Previous</button>
      <button className="next" onClick={() => setId(id + 1)} disabled={id === 4}>Next</button>
      <ErrorBoundary>
        <Suspense fallback={<p className="loading">Loading…</p>}>
          <Profile id={id} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
`,
        solution: `import { use, Suspense, useState, Component } from 'react';

const PEOPLE = { 1: 'Ada Lovelace', 2: 'Grace Hopper', 3: 'Margaret Hamilton' };

// the pretend server (do not change)
function getUser(id) {
  console.info('GET /users/' + id);
  return new Promise((resolve, reject) => setTimeout(() => {
    if (PEOPLE[id]) resolve({ id, name: PEOPLE[id] });
    else reject(new Error('Could not load user ' + id));
  }, 300));
}

// one promise per user, made outside rendering: it survives every try of the render
const cache = new Map();
function getUserOnce(id) {
  if (!cache.has(id)) cache.set(id, getUser(id));
  return cache.get(id);
}

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    return this.state.error ? <p className="failed">{this.state.error.message}</p> : this.props.children;
  }
}

function Profile({ id }) {
  const user = use(getUserOnce(id));
  return <h2 className="name">{user.name}</h2>;
}

export default function People() {
  const [id, setId] = useState(1);
  return (
    <div>
      <button className="prev" onClick={() => setId(id - 1)} disabled={id === 1}>Previous</button>
      <button className="next" onClick={() => setId(id + 1)} disabled={id === 4}>Next</button>
      <ErrorBoundary key={id}>
        <Suspense fallback={<p className="loading">Loading…</p>}>
          <Profile id={id} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
`,
        css: 'button { margin-right: 6px; } .failed { color: #c62828; } .loading { color: #667; }',
        hints: [
          '`getUser(id)` returns a new promise every time it is called, and React calls `Profile` again after each wait. Keep one promise per id: `const cache = new Map();` and `function getUserOnce(id) { if (!cache.has(id)) cache.set(id, getUser(id)); return cache.get(id); }`, outside the components.',
          '`useMemo` will not do: a component that suspends before it has first appeared keeps no state, so `useMemo` starts afresh each try. The cache must live outside the component.',
          'Once user 4 has failed, the boundary keeps its error for every user after. `<ErrorBoundary key={id}>` gives each user a boundary of their own.'
        ],
        checks: [
          { label: 'User 1 loads: "Loading…", then "Ada Lovelace"', fn: `async function (doc, win, t) {
  if (!doc.querySelector('.loading') && t.text('.name') !== 'Ada Lovelace') return 'neither "Loading…" nor Ada Lovelace shows';
  await t.wait(500);
  return t.text('.name') === 'Ada Lovelace' || 'half a second later: ' + (doc.querySelector('.loading') ? 'still "Loading…"' : JSON.stringify(t.text('#root')));
}` },
          { label: 'Next: "Grace Hopper"', fn: `async function (doc, win, t) {
  await t.click('.next');
  await t.wait(500);
  return t.text('.name') === 'Grace Hopper' || 'after Next: ' + (doc.querySelector('.loading') ? 'still "Loading…"' : JSON.stringify(t.text('.name')));
}` },
          { label: 'Back to Ada: shown at once, with no new request', fn: `async function (doc, win, t) {
  function asked(n) { return t.logs().filter(function (l) { return l === 'GET /users/' + n; }).length; }
  var before = asked(1);
  await t.click('.prev');
  if (doc.querySelector('.loading')) return '"Loading…" shows again for a user already loaded';
  if (t.text('.name') !== 'Ada Lovelace') return 'after Previous: ' + JSON.stringify(t.text('.name'));
  await t.wait(100);
  return asked(1) === before || 'user 1 was requested again';
}` },
          { label: 'User 4 fails: "Could not load user 4"', fn: `async function (doc, win, t) {
  await t.click('.next');
  await t.wait(400);
  await t.click('.next');
  await t.wait(400);
  await t.click('.next');
  await t.wait(500);
  return t.text('.failed') === 'Could not load user 4' || 'on user 4: ' + JSON.stringify(t.text('#root'));
}` },
          { label: 'Back from user 4: user 3 shows, not the error', fn: `async function (doc, win, t) {
  await t.click('.prev');
  await t.wait(100);
  if (doc.querySelector('.failed')) return 'the error still shows on user 3: give the boundary a key that changes with the user';
  return t.text('.name') === 'Margaret Hamilton' || 'on user 3: ' + JSON.stringify(t.text('#root'));
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'r-react-19-upgrade', track: 'react19',
      title: 'ref as a prop, and moving code to React 19',
      summary: 'React 19 makes several things simpler: ref is a plain prop (no forwardRef), a ref callback can return its cleanup, a context is its own provider, and <title> or <meta> can be rendered from any component. It also removed old APIs, and one removal changes behaviour without a word: defaultProps on a function component is ignored.',
      keywords: ['ref as a prop', 'forwardRef', 'react 19 upgrade', 'upgrade', 'migration', 'migrate to react 19', 'breaking changes', 'defaultProps', 'propTypes', 'ref callback cleanup', 'Context.Provider', 'document metadata', 'title tag', 'meta tag', 'Activity', 'removed apis', 'codemod', 'ReactDOM.render', 'string refs'],
      docs: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide',
      body: [
        'Most React 18 code runs unchanged in React 19. This lesson is the upgrade itself: what you can now write more simply, and what changed under your feet.',
        '## ref is a prop',
        jsx('// React 18',
            'const SearchField = forwardRef(function SearchField(props, ref) {',
            '  return <input ref={ref} {...props} />;',
            '});',
            '',
            '// React 19',
            'function SearchField({ ref, ...props }) {',
            '  return <input ref={ref} {...props} />;',
            '}'),
        'A function component now receives `ref` like any other prop and hands it to the element it means ([[lesson:r-dom-refs]] uses it). `forwardRef` still works, with no warning in 19.3, and React plans to deprecate it.',
        '## A ref callback can clean up',
        jsx('<ul ref={node => {',
            '  const observer = new ResizeObserver(() => setHeight(node.offsetHeight));',
            '  observer.observe(node);',
            '  return () => observer.disconnect();     // React 19: runs when the element goes',
            '}} />'),
        'Before React 19 a ref callback was called again with `null` when the element went, and the observer had to be kept somewhere to disconnect it. Now it returns its own undo, like an effect. In StrictMode React calls it, cleans it up and calls it again whenever the element appears, so a missing cleanup shows as two observers. Write the callback with braces: `ref={n => (saved = n)}` returns a value by accident.',
        '## A context is its own provider',
        '`<ThemeContext value="dark">` instead of `<ThemeContext.Provider value="dark">` ([[lesson:r-context]]). The old form still works.',
        '## title and meta from any component',
        'React 19 moves `<title>`, `<meta>` and `<link>` elements rendered anywhere into the `<head>`: the component that knows the number of results can say `<title>Search · 3 results</title>`. No `useEffect` setting `document.title`, and no library for it.',
        '## Activity: hidden, not gone (19.2)',
        jsx("<Activity mode={tab === 'posts' ? 'visible' : 'hidden'}>",
            '  <Posts />',
            '</Activity>'),
        'A hidden `Activity` keeps its children\'s state and DOM (they get `display: none`), cleans up their effects, and runs them again when shown: a tab you leave and come back to is as you left it, with nothing running behind it meanwhile.',
        '## What React 19 removed',
        '| Removed | Use instead | If old code still has it |\n|---|---|---|\n' +
        '| `defaultProps` on a function component | Default values: `function Greeting({ name = \'guest\' })` | **Ignored, silently**: the prop is `undefined` |\n' +
        '| `propTypes` | TypeScript | Ignored, silently: no warnings any more |\n' +
        '| `ReactDOM.render`, `hydrate` | `createRoot(…).render`, `hydrateRoot` | Not exported: calling them is an error |\n' +
        '| `unmountComponentAtNode`, `findDOMNode` | `root.unmount()`, a ref | Not exported |\n' +
        '| String refs (`ref="input"`) and legacy context (`contextTypes`) | `useRef` or a ref callback; `createContext` | Removed |',
        '`defaultProps` is the dangerous one: nothing fails, a greeting just says "Hello, " instead of "Hello, guest". Class components keep `defaultProps`.',
        '## The upgrade, in practice',
        '1. Upgrade to React 18.3 first: it warns about everything 19 removes.\n2. Run the codemod: `npx codemod@latest react/19/migration-recipe` rewrites most of it (string refs, `ReactDOM.render`, imports).\n3. Upgrade `@types/react` and `@types/react-dom` to 19, and fix what TypeScript then reports.\n4. Search for `defaultProps` on function components by hand: nothing else will tell you.',
        'The interview questions are [[q:react-19]] ("What did React 19 remove?") and [[q:ref-to-component]].'
      ].join('\n\n'),
      plainjs: 'Plain JavaScript has worked this way all along: an element is passed to whatever needs it, `addEventListener` comes with `removeEventListener`, and `document.title = "Inbox (3)"` sets the title. React 19 brings React closer to that: a `ref` is passed like any other value, a ref callback returns its own undo, and a `<title>` written where the data is ends up in the `<head>`.',
      example: {
        code: `import { useState, useRef, Activity } from 'react';

// ref is a plain prop: no forwardRef
function SearchField({ ref, placeholder }) {
  return <input ref={ref} placeholder={placeholder} />;
}

function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>Clicked {n} times</button>;
}

export default function App() {
  const inputRef = useRef(null);
  const [tab, setTab] = useState('search');
  const [width, setWidth] = useState(0);

  return (
    <div>
      <title>{'Example · ' + tab}</title>
      <button onClick={() => setTab(tab === 'search' ? 'counter' : 'search')}>Switch tab</button>
      <Activity mode={tab === 'search' ? 'visible' : 'hidden'}>
        <p>
          <SearchField ref={inputRef} placeholder="Search" />
          <button onClick={() => inputRef.current.focus()}>Focus</button>
        </p>
      </Activity>
      <Activity mode={tab === 'counter' ? 'visible' : 'hidden'}>
        <p><Counter /> (switch away and back: the count is kept)</p>
      </Activity>
      <div className="box" ref={node => {
        const observer = new ResizeObserver(() => setWidth(node.offsetWidth));
        observer.observe(node);
        console.log('observing the box');
        return () => { observer.disconnect(); console.log('stopped observing'); };
      }}>This box is {width} px wide</div>
    </div>
  );
}
`,
        css: '.box { margin-top: 10px; padding: 8px; border: 1px dashed #99a; resize: horizontal; overflow: auto; max-width: 100%; }',
        note: 'The page title (`document.title`) follows the tab, from a `<title>` the component renders. Count in the counter tab, switch away and back: `Activity` kept the count. Drag the box\'s corner: the ref callback\'s observer keeps the width up to date.'
      },
      challenge: {
        title: 'Bring a React 18 component to React 19',
        strict: true,
        task: 'This search page was written for React 18. Bring it to React 19, and fix the bug the upgrade caused:\n\n' +
          '- `Greeting` with no name should say "Hello, guest". It says "Hello, " now: React 19 ignores `defaultProps` on a function component. Use a default value instead.\n' +
          '- `SearchField` takes `ref` as a plain prop: no `forwardRef`. **Focus the search** must still focus `.search`.\n' +
          '- The theme reaches the button through `<ThemeContext value="dark">`, not `.Provider`.\n' +
          '- The page title, "Search · 3 results", comes from a `<title>` the component renders, not from an effect that sets `document.title`.\n' +
          '- The results list measures its height with a `ResizeObserver` started in a ref callback. Return its cleanup, so hiding the list disconnects it.',
        starter: `import { forwardRef, useRef, useState, useEffect, createContext, useContext } from 'react';

const ThemeContext = createContext('light');
const RESULTS = ['React 19', 'Actions', 'useOptimistic'];

const SearchField = forwardRef(function SearchField({ placeholder }, ref) {
  return <input className="search" ref={ref} placeholder={placeholder} />;
});

function Greeting({ name }) {
  return <p className="greeting">Hello, {name}</p>;
}
Greeting.defaultProps = { name: 'guest' };

function FocusButton({ onClick }) {
  const theme = useContext(ThemeContext);
  return <button className={'focus btn-' + theme} onClick={onClick}>Focus the search</button>;
}

function Results() {
  const [height, setHeight] = useState(0);
  return (
    <ul className="results" ref={node => {
      if (node) {
        const observer = new ResizeObserver(() => setHeight(node.offsetHeight));
        observer.observe(node);
      }
    }}>
      {RESULTS.map(r => <li key={r}>{r}</li>)}
      <li className="height">{height} px tall</li>
    </ul>
  );
}

export default function SearchPage() {
  const inputRef = useRef(null);
  const [show, setShow] = useState(true);

  useEffect(() => {
    document.title = 'Search · ' + RESULTS.length + ' results';
  }, []);

  return (
    <ThemeContext.Provider value="dark">
      <Greeting />
      <SearchField ref={inputRef} placeholder="Search" />
      <FocusButton onClick={() => inputRef.current.focus()} />
      <button className="toggle" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'} results</button>
      {show && <Results />}
    </ThemeContext.Provider>
  );
}
`,
        solution: `import { useRef, useState, createContext, useContext } from 'react';

const ThemeContext = createContext('light');
const RESULTS = ['React 19', 'Actions', 'useOptimistic'];

// ref is a plain prop in React 19
function SearchField({ ref, placeholder }) {
  return <input className="search" ref={ref} placeholder={placeholder} />;
}

// a default value, not defaultProps (which React 19 ignores on a function component)
function Greeting({ name = 'guest' }) {
  return <p className="greeting">Hello, {name}</p>;
}

function FocusButton({ onClick }) {
  const theme = useContext(ThemeContext);
  return <button className={'focus btn-' + theme} onClick={onClick}>Focus the search</button>;
}

function Results() {
  const [height, setHeight] = useState(0);
  return (
    <ul className="results" ref={node => {
      const observer = new ResizeObserver(() => setHeight(node.offsetHeight));
      observer.observe(node);
      return () => observer.disconnect();    // React 19: the cleanup runs when the list goes
    }}>
      {RESULTS.map(r => <li key={r}>{r}</li>)}
      <li className="height">{height} px tall</li>
    </ul>
  );
}

export default function SearchPage() {
  const inputRef = useRef(null);
  const [show, setShow] = useState(true);

  return (
    <ThemeContext value="dark">
      <title>{'Search · ' + RESULTS.length + ' results'}</title>
      <Greeting />
      <SearchField ref={inputRef} placeholder="Search" />
      <FocusButton onClick={() => inputRef.current.focus()} />
      <button className="toggle" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'} results</button>
      {show && <Results />}
    </ThemeContext>
  );
}
`,
        css: '.search { padding: 4px 8px; margin-right: 6px; } .btn-dark { background: #20232a; color: #61dafb; border: 0; padding: 5px 10px; border-radius: 6px; } .toggle { margin-left: 6px; } .results { margin-top: 10px; } .height { color: #889; }',
        hints: [
          '`defaultProps` on a function component does nothing in React 19. Give the parameter a default: `function Greeting({ name = \'guest\' })`.',
          '`function SearchField({ ref, placeholder }) { … }` with no `forwardRef`; the parent\'s `<SearchField ref={inputRef} />` stays as it is. `<ThemeContext value="dark">` replaces `<ThemeContext.Provider value="dark">`. Render `<title>{\'Search · \' + RESULTS.length + \' results\'}</title>` and delete the effect.',
          'In the ref callback, make the observer and `return () => observer.disconnect();`. The callback then needs no `if (node)`: React 19 calls the cleanup instead of calling the callback with `null`.'
        ],
        checks: [
          { label: 'With no name, the greeting says "Hello, guest"', fn: `function (doc, win, t) {
  return t.text('.greeting') === 'Hello, guest' || '.greeting says ' + JSON.stringify(t.text('.greeting')) + (/defaultProps/.test(t.source()) ? ': React 19 ignores defaultProps on a function component' : '');
}` },
          { label: '`SearchField` takes `ref` as a prop: Focus works, with no `forwardRef`', fn: `async function (doc, win, t) {
  await t.click('.focus');
  if (doc.activeElement !== doc.querySelector('.search')) return 'Focus the search did not focus .search';
  return !/forwardRef/.test(t.source()) || 'forwardRef is still there: ref is a plain prop now';
}` },
          { label: 'The theme reaches the button through `<ThemeContext value>`, not `.Provider`', fn: `function (doc, win, t) {
  if (!doc.querySelector('.focus').classList.contains('btn-dark')) return 'the button is not dark: ' + doc.querySelector('.focus').className;
  return !/\\.Provider/.test(t.source()) || '.Provider is still there';
}` },
          { label: 'The title "Search · 3 results" comes from a `<title>` element, not an effect', fn: `function (doc, win, t) {
  if (doc.title !== 'Search · 3 results') return 'the page title is "' + doc.title + '"';
  if (/document\\.title\\s*=/.test(t.source())) return 'document.title is still set by hand';
  return /<title>/.test(t.source()) || 'no <title> element in the component';
}` },
          { label: 'Hiding the results disconnects their ResizeObserver: the ref callback returns its cleanup', fn: `async function (doc, win, t) {
  var Real = win.ResizeObserver, live = 0;
  win.ResizeObserver = function (cb) {
    var o = new Real(cb), on = false;
    return { observe: function (n) { if (!on) { on = true; live++; } o.observe(n); }, unobserve: function (n) { o.unobserve(n); },
      disconnect: function () { if (on) { on = false; live--; } o.disconnect(); } };
  };
  try {
    await t.click('.toggle');
    await t.click('.toggle');
    if (!doc.querySelector('.results')) return 'the results did not come back';
    if (live < 1) return 'showing the results again started no ResizeObserver';
    await t.click('.toggle');
  } finally { win.ResizeObserver = Real; }
  return live === 0 || 'with the results hidden, ' + live + ' ResizeObserver(s) still watch them: return a cleanup from the ref callback';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'r-rendering-strategies', track: 'react19',
      title: 'Where the HTML is made: CSR, SSR, SSG and hydration',
      summary: 'Client-side rendering builds the page in the browser; server-side rendering makes the HTML on the server for each request; static generation makes it once, at build time. With SSR and SSG, React then hydrates the HTML: it attaches to it instead of drawing it again, which works only if its first render matches the server\'s HTML exactly.',
      keywords: ['csr', 'ssr', 'ssg', 'isr', 'client-side rendering', 'server-side rendering', 'static site generation', 'rendering strategies', 'hydration', 'hydrateRoot', 'hydration mismatch', 'hydration error', 'hydration failed', 'renderToString', 'streaming ssr', 'seo', 'next.js', 'suppressHydrationWarning', 'getServerSnapshot'],
      docs: 'https://react.dev/reference/react-dom/client/hydrateRoot',
      body: [
        'Everything in this tool so far was **client-side rendering**: the browser receives an empty `<div id="root">` and a script, and React builds the page. That is not the only place the HTML can be made.',
        '| | Client-side rendering (CSR) | Server-side rendering (SSR) | Static generation (SSG) |\n|---|---|---|---|\n' +
        '| The HTML is made | In the browser, after the JavaScript loads | On the server, for each request | Once, at build time |\n' +
        '| First content on screen | Last: blank until the script has run | Soon | First: a file from a CDN |\n' +
        '| Search engines and link previews | See little until the script runs | See the content | See the content |\n' +
        '| Data | Live | Live | As of the last build |\n' +
        '| Fits | A dashboard behind a login | A shop\'s product pages with live prices | A blog, documentation, marketing pages |',
        'Frameworks such as Next.js choose per page, and add **incremental static regeneration** (ISR): a static page rebuilt in the background every few minutes, or when its data changes.',
        '## Hydration',
        'With SSR and SSG the browser shows the server\'s HTML at once, but it is inert: nothing reacts to a click until React has loaded. Then, instead of drawing the page again, React **hydrates** it: it renders the same components, walks the existing HTML in step, and attaches each event handler to the node already there.',
        jsx("import { hydrateRoot } from 'react-dom/client';",
            '',
            "hydrateRoot(document.getElementById('root'), <App />);   // not createRoot: the HTML is already there"),
        'The server makes that HTML with `renderToString` (or a streaming variant). For `<button>Clicked {count} times</button>` it sends `<button>Clicked <!-- -->0<!-- --> times</button>`: the comments mark where one text piece ends and the next begins, so React can match its three pieces of text to the server\'s.',
        '## When they do not match',
        'Hydration only works if the browser\'s first render produces exactly the server\'s HTML. When it does not, React 19 logs "Hydration failed because the server rendered text didn\'t match the client", **throws the server\'s HTML away** and builds that part afresh: slower, often a visible flash, and the fast first paint is wasted. The usual causes:',
        '| Cause | Why it differs |\n|---|---|\n' +
        '| `new Date()`, `Date.now()` | The server rendered seconds, or hours, earlier |\n' +
        '| `Math.random()`, a random id | A new value each time (use `useId` for ids) |\n' +
        '| `window`, `localStorage`, `innerWidth` read while rendering | The server has none of them |\n' +
        '| Formatting in the user\'s locale or time zone | The server\'s are different |\n' +
        '| Invalid HTML nesting, a `<div>` inside a `<p>` | The browser repairs the HTML before React sees it |\n' +
        '| A browser extension that edits the page | The HTML changed before React loaded |',
        '## The fixes',
        'Render what the server rendered first, and the browser-only value after hydration:',
        jsx('function LocalTime() {',
            "  const [time, setTime] = useState('…');                    // what the server rendered",
            '  useEffect(() => {',
            '    setTime(new Date().toLocaleTimeString());                // the browser\'s own, after hydration',
            '  }, []);',
            '  return <p>Your time: {time}</p>;',
            '}'),
        '- **Send the data with the page.** A value the server used (its time, a price) travels with the HTML, as JSON, and the browser renders from the same value.\n' +
        '- **Browser-only values after hydration**: an effect as above, or `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`, whose third function gives the value to use on the server and while hydrating.\n' +
        '- **`suppressHydrationWarning`** on one element whose text must differ (a timestamp): React keeps the server\'s text there and says nothing. One level only; use it rarely.',
        '## Streaming',
        '`renderToPipeableStream` (Node) and `renderToReadableStream` (the web) send the HTML in pieces: the page\'s frame first, and each `<Suspense>` boundary\'s content when its data is ready, with the fallback until then. The browser can hydrate the parts that have arrived, starting with the part the user clicks on.',
        '## In this tool',
        'A preview has no server, so the examples hydrate a string standing in for what the server sent. It is exactly what React 19.3\'s `renderToString` makes of the same component, checked against it when this lesson was written. [[term:hydration]] is in the Glossary; [[lesson:r-server-components]] is the other way React uses a server. The interview question is [[q:csr-ssr-ssg]].'
      ].join('\n\n'),
      plainjs: 'You know server-rendered pages already: a Spring MVC controller with Thymeleaf, or a JSP, sends finished HTML, and a script then finds the buttons with `querySelector` and adds listeners. That is SSR, followed by hydration done by hand. React hydration does the second half for you, from the same components that made the HTML: it walks the server\'s HTML in step with its own render and attaches each handler to the node already there.',
      example: {
        code: `import { useState } from 'react';
import { hydrateRoot } from 'react-dom/client';

// What the server sent: React 19.3's renderToString(<App />), word for word
const SERVER_HTML = '<div class="page"><h1>Hello from the server</h1><button>Clicked <!-- -->0<!-- --> times</button></div>';

function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="page">
      <h1>Hello from the server</h1>
      <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
    </div>
  );
}

// the page as the browser received it, then React attaches to it
const container = document.getElementById('root');
container.innerHTML = SERVER_HTML;
const serverH1 = container.querySelector('h1');
hydrateRoot(container, <App />);

setTimeout(() => {
  console.log("React kept the server's <h1>:", container.querySelector('h1') === serverH1);
}, 100);
`,
        css: 'h1 { font-size: 20px; margin: 0 0 8px; }',
        note: 'There is no `export default` here: like a real app\'s entry file, the code hydrates the page itself. The console says React kept the server\'s nodes, and the button works. Change "Hello from the server" in the component only (not in `SERVER_HTML`) and run it: React reports the mismatch and builds the page afresh.'
      },
      challenge: {
        title: 'Fix the hydration mismatches',
        strict: true,
        task: 'The server sent `SERVER_HTML`, rendered from `SERVER_DATA`. Hydrating it fails: React reports a mismatch and throws the server\'s HTML away. Make the browser\'s first render match the server\'s, then fill in what only the browser knows:\n\n' +
          '- `Updated at 06:30` comes from `SERVER_DATA` (passed in as `data`), as on the server, not from the browser\'s clock.\n' +
          '- `.local` shows `Your time: …` at first, as the server did, and the visitor\'s own time (`HH:MM`) once hydrated.\n' +
          '- `.layout` shows `Layout: …` at first, then `narrow` (window under 500 px wide) or `wide`.\n' +
          '- The Like button works.\n\n' +
          'The last four lines are the setup (the page as the browser received it): do not change them, nor `SERVER_HTML` and `SERVER_DATA`.',
        starter: `import { useState } from 'react';
import { hydrateRoot } from 'react-dom/client';

// what the server sent (renderToString in React 19.3), and the data it rendered from
const SERVER_DATA = { updatedAt: '06:30' };
const SERVER_HTML = '<main class="page"><h1>Today in brief</h1><p class="time">Updated at <!-- -->06:30</p><p class="local">Your time: <!-- -->…</p><p class="layout">Layout: <!-- -->…</p><button class="like">Likes: <!-- -->0</button></main>';

function hhmm(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function News({ data }) {
  const [likes, setLikes] = useState(0);
  const updatedAt = hhmm(new Date());
  const local = hhmm(new Date());
  const layout = window.innerWidth < 500 ? 'narrow' : 'wide';
  return (
    <main className="page">
      <h1>Today in brief</h1>
      <p className="time">Updated at {updatedAt}</p>
      <p className="local">Your time: {local}</p>
      <p className="layout">Layout: {layout}</p>
      <button className="like" onClick={() => setLikes(likes + 1)}>Likes: {likes}</button>
    </main>
  );
}

// the setup: the page as the browser received it (do not change)
const container = document.getElementById('root');
container.innerHTML = SERVER_HTML;
window.serverH1 = container.querySelector('h1');
hydrateRoot(container, <News data={SERVER_DATA} />);
`,
        solution: `import { useState, useEffect, useSyncExternalStore } from 'react';
import { hydrateRoot } from 'react-dom/client';

// what the server sent (renderToString in React 19.3), and the data it rendered from
const SERVER_DATA = { updatedAt: '06:30' };
const SERVER_HTML = '<main class="page"><h1>Today in brief</h1><p class="time">Updated at <!-- -->06:30</p><p class="local">Your time: <!-- -->…</p><p class="layout">Layout: <!-- -->…</p><button class="like">Likes: <!-- -->0</button></main>';

function hhmm(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function subscribe(onChange) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}
function layoutNow() {
  return window.innerWidth < 500 ? 'narrow' : 'wide';
}

function News({ data }) {
  const [likes, setLikes] = useState(0);
  const [local, setLocal] = useState('…');               // what the server rendered
  useEffect(() => {
    setLocal(hhmm(new Date()));                           // the visitor's own time, after hydration
  }, []);
  const layout = useSyncExternalStore(subscribe, layoutNow, () => '…');   // '…' on the server and while hydrating
  return (
    <main className="page">
      <h1>Today in brief</h1>
      <p className="time">Updated at {data.updatedAt}</p>
      <p className="local">Your time: {local}</p>
      <p className="layout">Layout: {layout}</p>
      <button className="like" onClick={() => setLikes(likes + 1)}>Likes: {likes}</button>
    </main>
  );
}

// the setup: the page as the browser received it (do not change)
const container = document.getElementById('root');
container.innerHTML = SERVER_HTML;
window.serverH1 = container.querySelector('h1');
hydrateRoot(container, <News data={SERVER_DATA} />);
`,
        css: '.page h1 { font-size: 20px; margin: 0 0 6px; } .page p { margin: 4px 0; }',
        hints: [
          'React compares its **first** render with the server\'s HTML, piece by piece. Whatever differs (the browser\'s clock, `window`) must not be in that first render.',
          '`Updated at` is the server\'s value: render `data.updatedAt`. For the visitor\'s time, start a state at `\'…\'` (what the server rendered) and set it in `useEffect(() => { … }, [])`, which runs only in the browser, after hydration.',
          'For the layout, `useSyncExternalStore(subscribe, () => (window.innerWidth < 500 ? \'narrow\' : \'wide\'), () => \'…\')`: the third function is the value for the server and for hydration; React switches to the second once hydrated. `subscribe` adds a `resize` listener and returns its removal.'
        ],
        checks: [
          { label: 'React kept the server\'s HTML: no "Hydration failed", and the `<h1>` is the very element the server sent', fn: `async function (doc, win, t) {
  await t.wait(80);
  var bad = t.warnings().filter(function (w) { return /Hydration failed|didn't match/.test(w); });
  if (bad.length) return 'React says: ' + bad[0].split('. ')[0];
  return win.serverH1 === doc.querySelector('h1') || 'the <h1> is a new element: React threw the server\\'s HTML away';
}` },
          { label: '"Updated at 06:30": the time the server rendered, and what the component itself renders', fn: `async function (doc, win, t) {
  if (t.text('.time') !== 'Updated at 06:30') return '.time says ' + JSON.stringify(t.text('.time'));
  // the page may only be keeping the server's text: render News afresh, as any later re-render would
  var c = t.components('News')[0];
  if (!c) return 'no News component on the page';
  var R = await import('react'), D = await import('react-dom'), C = await import('react-dom/client');
  var box = doc.createElement('div'), root = C.createRoot(box);
  D.flushSync(function () { root.render(R.createElement(c.type, c.props)); });
  var p = box.querySelector('.time'), text = p ? p.textContent : null;
  root.unmount();
  return text === 'Updated at 06:30' || 'rendered afresh, News says ' + JSON.stringify(text) + ': the page only kept the server\\'s text (suppressHydrationWarning hides a mismatch, it does not fix it)';
}` },
          { label: 'Once hydrated, `.local` shows your own time', fn: `function (doc, win, t) {
  function hhmm(d) { return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  var now = new Date(), want = [hhmm(now), hhmm(new Date(now.getTime() - 60000))];   // the minute may have just turned
  return want.some(function (w) { return t.text('.local') === 'Your time: ' + w; }) || '.local says ' + JSON.stringify(t.text('.local')) + ', expected "Your time: ' + want[0] + '"';
}` },
          { label: '`.layout` follows the window: narrow under 500 px, wide above', fn: `function (doc, win, t) {
  var want = 'Layout: ' + (win.innerWidth < 500 ? 'narrow' : 'wide');
  return t.text('.layout') === want || '.layout says ' + JSON.stringify(t.text('.layout')) + ' with a window ' + win.innerWidth + ' px wide';
}` },
          { label: 'Likes work: two clicks, "Likes: 2"', fn: `async function (doc, win, t) {
  await t.click('.like');
  await t.click('.like');
  return t.text('.like') === 'Likes: 2' || 'the button says ' + JSON.stringify(t.text('.like'));
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 8 */
    {
      id: 'r-server-components', track: 'react19',
      title: 'Server Components and Server Functions',
      summary: 'A Server Component runs only on the server: it can be async, read the database directly, and sends no JavaScript to the browser. A Client Component (in a file that starts with \'use client\') also runs in the browser and can hold state and handle events. Only data crosses from server to client, and server parts reach client parts as children.',
      keywords: ['server components', 'rsc', 'react server components', 'client components', 'use client', 'use server', 'server functions', 'server actions', 'serializable props', 'client boundary', 'donut pattern', 'async component', 'next.js app router', 'zero bundle size', 'ssr vs rsc'],
      docs: 'https://react.dev/reference/rsc/server-components',
      body: [
        'Until React 19 every component reached the browser: even with SSR ([[lesson:r-rendering-strategies]]), the server made the HTML and then the browser ran the same components again. **Server Components** are a kind that runs only on the server and never ships to the browser.',
        jsx('// ProductPage.jsx: a Server Component (the default in Next.js\'s App Router)',
            "import { db } from './db';",
            "import AddToCart from './AddToCart';",
            '',
            'export default async function ProductPage({ id }) {',
            '  const product = await db.products.find(id);     // the database itself: no API, no effect',
            '  return (',
            '    <main>',
            '      <h1>{product.name}</h1>',
            '      <p>{product.description}</p>',
            '      <AddToCart productId={product.id} price={product.price} />',
            '    </main>',
            '  );',
            '}'),
        jsx('// AddToCart.jsx: a Client Component',
            "'use client';",
            "import { useState } from 'react';",
            '',
            'export default function AddToCart({ productId, price }) {',
            '  const [count, setCount] = useState(0);',
            '  return <button onClick={() => setCount(count + 1)}>Add (£{price}) · in cart: {count}</button>;',
            '}'),
        '| | Server Components | Client Components |\n|---|---|---|\n' +
        '| Run | Only on the server, per request or at build time | On the server for the first HTML, then in the browser |\n' +
        '| May use | `async`/`await`, the database, files, secrets | State, effects, event handlers, context, browser APIs |\n' +
        '| May not use | State, effects, event handlers, context, browser APIs | The server\'s secrets and database |\n' +
        '| JavaScript sent to the browser | None for the component itself | The component\'s code |\n' +
        '| Marked by | Nothing: the default in a framework that supports them | `\'use client\'` at the top of the file |',
        '## \'use client\' is a boundary',
        '`\'use client\'` goes at the top of a **file**, and makes that file, and everything it imports, client code. Below the boundary everything runs in the browser too. The server renders its own part and leaves a hole for each Client Component, which the browser fills in.',
        '## Only data crosses',
        'The props a Server Component gives a Client Component travel over the network, so they must be **serialisable**: strings, numbers, booleans, `null`, plain objects and arrays, dates, even promises (read with `use`, [[lesson:r-use]]) and JSX. Not functions, and not class instances. Pass an `onAdd` function and React refuses: "Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with \'use server\'". The cure is to move the behaviour into the Client Component, and pass it only the data it needs (`productId`, `price`).',
        '## Server parts inside client parts: children',
        'A Client Component cannot import a Server Component (the import would make it client code). It can **receive** one, already rendered, as `children`:',
        jsx('<Collapsible title="Reviews">          {/* client: holds `open` and the button */}',
            '  <Reviews productId={id} />           {/* server: rendered on the server, passed in finished */}',
            '</Collapsible>'),
        'Opening the `Collapsible` re-renders the `Collapsible` alone: `Reviews` was rendered on the server, and arrives as finished output. It is [[lesson:r-composition]]\'s "pass it in as children", for the same reason [[lesson:r-rendering]] gave: what a parent made is not re-rendered by a child\'s state.',
        '## Server Functions: \'use server\'',
        'The other direction: an async function marked `\'use server\'` runs on the server but can be called from the browser. Pass it to `<form action>` and it is an Action ([[lesson:r-actions]]); React sends the request and handles the pending state.',
        jsx("'use server';",
            '',
            'export async function addToCart(formData) {',
            "  await db.cart.add(formData.get('productId'));",
            '}'),
        'Each one is a public endpoint: anyone can call it with anything, so check the input and the user\'s rights inside, as a Spring controller would.',
        '## Not the same as SSR',
        'SSR decides **when** HTML is made (on the server, before the browser runs anything); all components still ship to the browser and hydrate. Server Components decide **which components ever reach the browser**. They combine: a framework renders Server and Client Components to HTML on the server, and only the Client Components hydrate.',
        '## You need a framework',
        'Server Components need a bundler and a server that understand them: Next.js\'s App Router, React Router in framework mode, Waku. A plain Vite app is client-only.',
        '## In this tool',
        'A preview has no server, so every component in it really runs in the browser: it is a stand-in. The challenge\'s checks hold the server part to a Server Component\'s rules: no hooks, no context, no event handlers, only data passed to the client part, and client parts that do not re-render it. And an `async` component in the browser gets React\'s own error: "…is an async Client Component. Only Server Components can be async". The interview question is [[q:server-components]].'
      ].join('\n\n'),
      plainjs: 'The split is old: a Spring MVC page made on the server with Thymeleaf, plus a little JavaScript for the parts that react to clicks. The server part reads the database and sends HTML; the script only gets data (a `data-product-id` attribute), never the server\'s Java methods. Server Components are that split inside React: the server parts never reach the browser, and the client parts get data through props, as the script got it through attributes.',
      example: {
        code: `import { useState } from 'react';

// --- the server part: no state, no effects, no handlers (in a real app: async, reading the database)
const PRODUCT = { id: 7, name: 'Mechanical keyboard', price: 89 };

function ProductPage() {
  return (
    <main>
      <h1>{PRODUCT.name}</h1>
      <AddToCart productId={PRODUCT.id} price={PRODUCT.price} />
      <Collapsible title="Specifications">
        <Specs />
      </Collapsible>
    </main>
  );
}

function Specs() {
  return <ul><li>Brown switches</li><li>Tenkeyless</li></ul>;
}

// --- the client part: 'use client' would head its file
function AddToCart({ productId, price }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Add to cart (£{price}) · in cart: {count}</button>;
}

function Collapsible({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'} {title.toLowerCase()}</button>
      <div hidden={!open}>{children}</div>
    </section>
  );
}

export default ProductPage;
`,
        css: 'main h1 { font-size: 20px; margin: 0 0 8px; } section { margin-top: 10px; }',
        note: 'Turn on **Highlight renders** and click both buttons: only `AddToCart` or `Collapsible` flashes. `ProductPage` and `Specs`, the server part, never render again: in a real app they would have run once, on the server.'
      },
      challenge: {
        title: 'Split a product page at the boundary',
        strict: true,
        task: '`ProductPage`, `ProductInfo` and `Reviews` are meant to be Server Components; `AddToCart` and `Collapsible` Client Components. As written, `ProductPage` holds the state and the click handlers, so it could not run on the server. Split it:\n\n' +
          '- The server part (`ProductPage`, `ProductInfo`, `Reviews`) holds no state, effects, context or event handlers.\n' +
          '- `AddToCart` keeps its own count and gets only data: `productId` and `price`. A function cannot be sent from the server.\n' +
          '- A client `Collapsible({ title, children })` holds `open` and its `.toggle` button; `ProductPage` passes `<Reviews />` into it as children.\n\n' +
          'Keep the text and the classes: `.add`, `.in-cart`, `.toggle`, `.review`. In this preview everything runs in the browser; the checks hold the server part to a Server Component\'s rules.',
        starter: `import { useState } from 'react';

const PRODUCT = { id: 7, name: 'Mechanical keyboard', price: 89 };
const REVIEWS = [
  { id: 1, by: 'Asha', text: 'Lovely to type on.' },
  { id: 2, by: 'Vikram', text: 'Loud, but I like it.' }
];

function ProductInfo({ product }) {
  return (
    <>
      <h1>{product.name}</h1>
      <p className="price">£{product.price}</p>
    </>
  );
}

function AddToCart({ price, count, onAdd }) {
  return (
    <p>
      <button className="add" onClick={onAdd}>Add to cart (£{price})</button>
      <span className="in-cart"> In cart: {count}</span>
    </p>
  );
}

function Reviews({ reviews }) {
  return (
    <ul>
      {reviews.map(r => <li className="review" key={r.id}>{r.by}: {r.text}</li>)}
    </ul>
  );
}

export default function ProductPage() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  return (
    <main className="product">
      <ProductInfo product={PRODUCT} />
      <AddToCart price={PRODUCT.price} count={count} onAdd={() => setCount(count + 1)} />
      <section>
        <button className="toggle" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'} reviews</button>
        {open && <Reviews reviews={REVIEWS} />}
      </section>
    </main>
  );
}
`,
        solution: `import { useState } from 'react';

const PRODUCT = { id: 7, name: 'Mechanical keyboard', price: 89 };
const REVIEWS = [
  { id: 1, by: 'Asha', text: 'Lovely to type on.' },
  { id: 2, by: 'Vikram', text: 'Loud, but I like it.' }
];

/* ---------- the server part: no state, effects, context or handlers ---------- */

function ProductInfo({ product }) {
  return (
    <>
      <h1>{product.name}</h1>
      <p className="price">£{product.price}</p>
    </>
  );
}

function Reviews({ reviews }) {
  return (
    <ul>
      {reviews.map(r => <li className="review" key={r.id}>{r.by}: {r.text}</li>)}
    </ul>
  );
}

export default function ProductPage() {
  return (
    <main className="product">
      <ProductInfo product={PRODUCT} />
      <AddToCart productId={PRODUCT.id} price={PRODUCT.price} />
      <Collapsible title="reviews">
        <Reviews reviews={REVIEWS} />
      </Collapsible>
    </main>
  );
}

/* ---------- the client part ('use client' would head its file) ---------- */

function AddToCart({ productId, price }) {
  const [count, setCount] = useState(0);
  return (
    <p>
      <button className="add" onClick={() => setCount(count + 1)}>Add to cart (£{price})</button>
      <span className="in-cart"> In cart: {count}</span>
    </p>
  );
}

function Collapsible({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button className="toggle" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'} {title}</button>
      {open && children}
    </section>
  );
}
`,
        css: '.product h1 { font-size: 20px; margin: 0; } .price { margin: 2px 0 8px; font-weight: 600; }',
        hints: [
          'Move the count into `AddToCart`: `const [count, setCount] = useState(0);` and its own `onClick`. `ProductPage` then passes only `productId={PRODUCT.id}` and `price={PRODUCT.price}`.',
          'Write `function Collapsible({ title, children }) { const [open, setOpen] = useState(false); … }` with the `.toggle` button and `{open && children}`. In `ProductPage`: `<Collapsible title="reviews"><Reviews reviews={REVIEWS} /></Collapsible>`.',
          '`ProductPage` should end with no `useState` and no `onClick`: it only arranges the parts, with data.'
        ],
        checks: [
          { label: 'The page shows the product: "Mechanical keyboard", £89', fn: `function (doc, win, t) {
  if (t.text('h1') !== 'Mechanical keyboard') return 'the <h1> says ' + JSON.stringify(t.text('h1'));
  return t.text('.price') === '£89' || '.price says ' + JSON.stringify(t.text('.price'));
}` },
          { label: 'Add to cart counts: two clicks, "In cart: 2"', fn: `async function (doc, win, t) {
  await t.click('.add');
  await t.click('.add');
  return t.text('.in-cart') === 'In cart: 2' || '.in-cart says ' + JSON.stringify(t.text('.in-cart'));
}` },
          { label: 'The server part (ProductPage, ProductInfo) holds no state, effects, context or event handlers', fn: `function (doc, win, t) {
  var names = ['ProductPage', 'ProductInfo'];
  for (var i = 0; i < names.length; i++) {
    var found = t.components(names[i]);
    if (!found.length) return names[i] + ' is not on the page';
    var c = found[0];
    if (c.hooks) return names[i] + ' calls ' + c.hooks + ' hook(s): a Server Component cannot hold state or effects';
    if (c.contexts) return names[i] + ' reads a context: a Server Component cannot';
    if (c.handlers.length) return names[i] + ' handles events itself (' + c.handlers.join(', ') + '): handlers belong in a Client Component';
  }
}` },
          { label: '`AddToCart` gets only data (`productId`, `price`): no function crosses from server to client', fn: `function (doc, win, t) {
  var c = t.components('AddToCart')[0];
  if (!c) return 'no AddToCart on the page';
  var fns = Object.keys(c.props).filter(function (k) { return typeof c.props[k] === 'function'; });
  if (fns.length) return 'AddToCart receives the function prop(s) ' + fns.join(', ') + ': a function cannot be sent from the server';
  if (c.props.productId !== 7 || c.props.price !== 89) return 'AddToCart should get productId 7 and price 89, it gets ' + JSON.stringify(c.props);
  return c.hooks > 0 || 'AddToCart holds no state: it should keep its own count';
}` },
          { label: 'Opening the reviews re-renders neither ProductPage nor ProductInfo: a client `Collapsible` gets `<Reviews />` as children', fn: `async function (doc, win, t) {
  var col = t.components('Collapsible')[0];
  if (!col) return 'no Collapsible component on the page';
  var kids = [].concat(col.props.children || []);
  if (!kids.some(function (k) { return k && k.type && k.type.name === 'Reviews'; })) return 'Collapsible\\'s children are not a <Reviews /> element made by ProductPage';
  var r = await t.renders(async function () { await t.click('.toggle'); });
  var again = ['ProductPage', 'ProductInfo'].filter(function (n) { return r[n]; });
  return !again.length || 'opening the reviews rendered ' + again.join(' and ') + ' again';
}` },
          { label: 'The two reviews show, from a `Reviews` with no state or handlers, and hide again', fn: `async function (doc, win, t) {
  function shown() { return t.$$('.review').filter(function (el) { return el.offsetParent !== null; }).length; }
  if (shown() !== 2) return shown() + ' reviews show after opening';
  var rv = t.components('Reviews')[0];
  if (rv && (rv.hooks || rv.handlers.length)) return 'Reviews holds state or handles events: it is server code';
  await t.click('.toggle');
  return shown() === 0 || shown() + ' reviews still show after closing';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 9 */
    {
      id: 'r-testing', track: 'react19',
      title: 'Testing components the way users use them',
      summary: 'React Testing Library renders a component and finds things the way a user does: by role and name, by label, by text. user-event clicks and types like a person, and jest-dom says what to expect. Test what the user sees, not state or class names, and a test survives a refactor and fails when the behaviour breaks.',
      keywords: ['testing', 'test', 'tests', 'react testing library', 'testing library', 'rtl', 'vitest', 'jest', 'user-event', 'userEvent', 'jest-dom', 'getByRole', 'screen', 'findBy', 'queryBy', 'waitFor', 'msw', 'mock service worker', 'playwright', 'cypress', 'renderHook', 'unit test', 'e2e', 'test behaviour', 'mutation testing'],
      docs: 'https://react.dev/reference/react/act',
      body: [
        '| Tool | Its job |\n|---|---|\n' +
        '| **Vitest** (or Jest) | Runs the tests: `test`, `expect`, mock functions with `vi.fn()` |\n' +
        '| **React Testing Library** | Renders a component into a test page and finds elements as a user would |\n' +
        '| **user-event** | Clicks and types like a person: focus, every keystroke, every event |\n' +
        '| **jest-dom** | Matchers about the page: `toBeInTheDocument`, `toHaveTextContent`, `toBeDisabled` |\n' +
        '| **MSW** (Mock Service Worker) | Answers `fetch` at the network level, with the same handlers in tests and in development |\n' +
        '| **Playwright** or Cypress | Test the whole app in a real browser (end to end) |',
        jsx("import { test, expect } from 'vitest';",
            "import { render, screen } from '@testing-library/react';",
            "import userEvent from '@testing-library/user-event';",
            '',
            "test('adds a todo', async () => {",
            '  const user = userEvent.setup();',
            '  render(<TodoApp />);',
            "  await user.type(screen.getByLabelText('New todo'), 'Buy milk');",
            "  await user.click(screen.getByRole('button', { name: 'Add' }));",
            "  expect(screen.getByText('Buy milk')).toBeInTheDocument();",
            '});'),
        'It reads like what a person does: find the box labelled "New todo", type, press the button named Add, see "Buy milk".',
        '## Find things as a user would',
        '| In this order | Finds | Example |\n|---|---|---|\n' +
        '| `getByRole` | An element by its role and accessible name | `getByRole(\'button\', { name: \'Add\' })` |\n' +
        '| `getByLabelText` | A form field by its label | `getByLabelText(\'Email\')` |\n' +
        '| `getByPlaceholderText` | A field by its placeholder, when it has no label | `getByPlaceholderText(\'Search\')` |\n' +
        '| `getByText` | Text that is not in a control | `getByText(\'No todos yet\')` |\n' +
        '| `getByDisplayValue`, `getByAltText`, `getByTitle` | A field\'s value, an image\'s alt text, a title | `getByAltText(\'Logo\')` |\n' +
        '| `getByTestId` | `data-testid`: the last resort | `getByTestId(\'chart\')` |',
        'Finding a button by its role and name also proves it **is** a button with that name, for a screen reader as much as for the test. A `<div onClick>` styled as a button fails `getByRole(\'button\')`: the test catches an accessibility bug for free.',
        '## getBy, queryBy, findBy',
        '| | None found | One | Several | Use it for |\n|---|---|---|---|---|\n' +
        '| `getBy…` | Throws | Returns it | Throws | Something that must be there now |\n' +
        '| `queryBy…` | `null` | Returns it | Throws | Something that must **not** be there: `expect(screen.queryByText(\'Error\')).not.toBeInTheDocument()` |\n' +
        '| `findBy…` | Waits (a second), then throws | Resolves with it | Throws | Something that appears later, after a fetch: `await screen.findByText(\'Ada\')` |',
        'Each has an `All` form (`getAllByRole(\'listitem\')`) that returns every match. `waitFor(() => expect(…))` retries any expectation until it passes or a second has gone.',
        '## user-event, not fireEvent',
        '`fireEvent.click(button)` dispatches one event. `await user.click(button)` does what a person\'s click does: pointer and mouse events, the focus moving, then the click, and nothing at all on a disabled button. `user.type` types key by key, so every `onChange` runs as it would for a person. Create the user once per test with `userEvent.setup()`, and `await` every call.',
        '## What not to test',
        'Not state variable names, not class names, not which function was called inside the component, not a snapshot of all its HTML. Those change in every refactor while the page stays the same, so such tests fail for no reason and pass when it matters. The question for each test: **would a user notice if this broke?**',
        '## Mocks',
        'A callback prop: `const onSave = vi.fn(); render(<Form onSave={onSave} />); … expect(onSave).toHaveBeenCalledWith(\'Ada\')`. The network: MSW, so the component\'s real `fetch` code runs. A custom hook: `renderHook(() => useCounter())` from Testing Library, then `result.current`.',
        '## How many of each',
        'A few end-to-end tests for the paths that make money (sign up, pay), many component tests like these, and plain unit tests for pure logic (a price calculation). Component tests give the most confidence for their cost: they run in milliseconds and test what users see.',
        '## In this tool',
        'Nothing is installed here, so a preview whose code imports `vitest` or `@testing-library/…` gets small stand-ins for them, written for this tool: the names above and their behaviour (the queries, getBy, queryBy, findBy, `within`, `waitFor`, `fireEvent`, user-event\'s click, type, clear, selectOptions, keyboard and tab, jest-dom\'s matchers, `vi.fn`). Tests run once the component has rendered, and each result shows in the console. They were compared with the real libraries on the same tests. Fake timers, snapshots and module mocks are not there. [[q:predict-output]] is a card of predictions; a test is how you prove one. The interview question is [[q:testing]].'
      ].join('\n\n'),
      plainjs: 'Without a library you would test a component by building the DOM, finding things with `document.querySelector(".add")`, dispatching events by hand and reading `textContent`. Testing Library is that, made to read like a user\'s steps: "find the button named Add, click it, expect to see Buy milk". The selectors are the difference: a user does not see `.add`, they see a button labelled Add, and a test that looks for that breaks only when what the user meets breaks.',
      example: {
        code: `import { useState } from 'react';
import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Add one</button>
      <button onClick={() => setCount(0)} disabled={count === 0}>Reset</button>
    </div>
  );
}

// the preview shows the component; the tests below render copies of their own
export default Counter;

test('starts at zero, with Reset disabled', () => {
  render(<Counter />);
  expect(screen.getByText('Clicked 0 times')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
});

test('counts clicks, and Reset goes back to zero', async () => {
  const user = userEvent.setup();
  render(<Counter />);
  await user.click(screen.getByRole('button', { name: 'Add one' }));
  await user.click(screen.getByRole('button', { name: 'Add one' }));
  expect(screen.getByText('Clicked 2 times')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Reset' }));
  expect(screen.getByText('Clicked 0 times')).toBeInTheDocument();
});
`,
        note: 'The console under the preview shows each test\'s result (✓ or ✗ and why). Break the component (make Reset set 1) and run it: the second test fails, saying what it could not find.'
      },
      challenge: {
        title: 'Write the tests for a todo list',
        strict: true,
        task: '`TodoApp` works; it has one test, and that test looks inside the component instead of at what a user sees. Below `TodoApp`, write at least three tests with `render`, `screen` and `userEvent`:\n\n' +
          '1. It shows "No todos yet" at first.\n' +
          '2. Typing "Buy milk" in the box labelled "New todo" and clicking **Add** puts "Buy milk" in the list, and empties the box.\n' +
          '3. A todo of only spaces is not added.\n\n' +
          'Find elements as a user would: by role, label or text (no `querySelector`, no `container`, no class names, no test ids). The checks also break `TodoApp` on purpose, three ways, and require one of your tests to fail each time: that is what a test is for. Do not change `TodoApp`.',
        starter: `import { useState } from 'react';
import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

let nextId = 1;

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  function add(e) {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    setTodos([...todos, { id: nextId++, title }]);
    setText('');
  }

  return (
    <form onSubmit={add}>
      <label htmlFor="new-todo">New todo</label>
      <input id="new-todo" value={text} onChange={e => setText(e.target.value)} />
      <button>Add</button>
      {todos.length === 0 ? <p>No todos yet</p> : <ul>{todos.map(t => <li key={t.id}>{t.title}</li>)}</ul>}
    </form>
  );
}

test('shows the empty message', () => {
  const { container } = render(<TodoApp />);
  expect(container.querySelector('p').textContent).toBe('No todos yet');
});
`,
        solution: `import { useState } from 'react';
import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

let nextId = 1;

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  function add(e) {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    setTodos([...todos, { id: nextId++, title }]);
    setText('');
  }

  return (
    <form onSubmit={add}>
      <label htmlFor="new-todo">New todo</label>
      <input id="new-todo" value={text} onChange={e => setText(e.target.value)} />
      <button>Add</button>
      {todos.length === 0 ? <p>No todos yet</p> : <ul>{todos.map(t => <li key={t.id}>{t.title}</li>)}</ul>}
    </form>
  );
}

test('shows "No todos yet" at first', () => {
  render(<TodoApp />);
  expect(screen.getByText('No todos yet')).toBeInTheDocument();
});

test('adds a todo and empties the box', async () => {
  const user = userEvent.setup();
  render(<TodoApp />);
  await user.type(screen.getByLabelText('New todo'), 'Buy milk');
  await user.click(screen.getByRole('button', { name: 'Add' }));
  expect(screen.getByRole('listitem')).toHaveTextContent('Buy milk');
  expect(screen.getByLabelText('New todo')).toHaveValue('');
});

test('does not add a todo of only spaces', async () => {
  const user = userEvent.setup();
  render(<TodoApp />);
  await user.type(screen.getByLabelText('New todo'), '   ');
  await user.click(screen.getByRole('button', { name: 'Add' }));
  expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  expect(screen.getByText('No todos yet')).toBeInTheDocument();
});
`,
        hints: [
          'Each test starts with `render(<TodoApp />);` and finds things through `screen`: `screen.getByText(\'No todos yet\')`, `screen.getByLabelText(\'New todo\')`, `screen.getByRole(\'button\', { name: \'Add\' })`.',
          'For typing and clicking: `const user = userEvent.setup();`, then `await user.type(box, \'Buy milk\')` and `await user.click(button)`. Make the test `async`.',
          'Say what a user would see: `expect(screen.getByRole(\'listitem\')).toHaveTextContent(\'Buy milk\')`, `expect(box).toHaveValue(\'\')`, and for the blank todo `expect(screen.queryAllByRole(\'listitem\')).toHaveLength(0)`.'
        ],
        checks: [
          { label: 'Three tests or more, and every one passes on `TodoApp`', fn: `async function (doc, win, t) {
  var r = (await t.tests()).filter(function (x) { return !x.skipped; });   // a skipped test proves nothing
  var failed = r.filter(function (x) { return !x.ok; });
  if (failed.length) return '"' + failed[0].name + '" fails: ' + failed[0].error;
  return r.length >= 3 || 'found ' + r.length + ' test(s)';
}` },
          { label: 'They find elements as a user does: no `querySelector`, `container`, class names or test ids', fn: `function (doc, win, t) {
  var src = t.source(), at = src.indexOf('test(');
  var tests = at < 0 ? '' : src.slice(at);
  var bad = /querySelector|container|className|\\.class|TestId|data-testid/.exec(tests);
  return !bad || 'the tests use ' + bad[0] + ': find elements by role, label or text';
}` },
          { label: 'They catch a TodoApp that leaves the text in the box after Add', fn: `async function (doc, win, t) {
  var src = t.source(), line = "    setText('');\\n";
  if (src.indexOf(line) < 0) return 'TodoApp was changed: keep it as given (the checks break it on purpose)';
  var r = await t.testsOf(src.replace(line, ''));
  return r.some(function (x) { return !x.ok; }) || 'every test still passes when Add leaves the text in the box';
}` },
          { label: 'They catch a TodoApp that adds a todo of only spaces', fn: `async function (doc, win, t) {
  var src = t.source(), line = '    if (!title) return;\\n';
  if (src.indexOf(line) < 0) return 'TodoApp was changed: keep it as given (the checks break it on purpose)';
  var r = await t.testsOf(src.replace(line, ''));
  return r.some(function (x) { return !x.ok; }) || 'every test still passes when a todo of spaces is added';
}` },
          { label: 'They catch a TodoApp that never says "No todos yet"', fn: `async function (doc, win, t) {
  var src = t.source(), part = '<p>No todos yet</p>';
  if (src.indexOf(part) < 0) return 'TodoApp was changed: keep it as given (the checks break it on purpose)';
  var r = await t.testsOf(src.replace(part, 'null'));
  return r.some(function (x) { return !x.ok; }) || 'every test still passes when the empty message is gone';
}` }
        ]
      }
    }
  );
})(window.RLT);
