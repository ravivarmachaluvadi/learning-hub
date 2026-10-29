/*
 * Machine coding, track 6 (React 19 and beyond): two React-first problems with no plain-JS page in
 * 11-UI-Practice, so each says `plainjs: null`, and `plainjsNote` says how the same thing is done
 * without React. The problem shape is described at the top of data/builds.js. Each runs inside
 * <StrictMode> (`strict: true`), as the last three tracks' problems do.
 *
 * Optimistic comments rests on a probe of React 19.3 (ROADMAP.md, batch 5): with two comments in
 * flight, a real update made after `await` outside startTransition shows the first comment twice for
 * a moment; a check samples the list for exactly that.
 */
(function (U) {
  var B = U.data.builds = U.data.builds || [];

  B.push(
    {
      id: 'optimistic-comments', track: 'react19', level: 'Medium', minutes: 35, plainjs: null, strict: true,
      title: 'Optimistic comments',
      summary: 'A comment thread that answers at once: a new comment shows straight away, marked "Sending…", and the server\'s answer confirms it; a rejected one disappears, says why and gives the text back; two sent quickly both show, in order, and neither ever shows twice.',
      keywords: ['optimistic comments', 'optimistic ui', 'optimistic update', 'useOptimistic', 'comment thread', 'chat', 'messages', 'pending', 'sending', 'rollback', 'react 19'],
      plainjsNote: 'Without React: on submit, append an `<li class="pending">` straight away and empty the box, then `fetch` the comment. On success, drop the class (or swap in the server\'s version of the row); on failure, remove that `<li>`, show the error and put the text back in the box. You keep a reference to each pending `<li>` so each answer finds its own row. useOptimistic does that bookkeeping: the pending rows are worked out from the requests still in flight, and each disappears by itself when its action ends.',
      task: 'Make the thread optimistic, with `useOptimistic`. `postComment(text)` is the pretend server (do not change it): it answers after 0.8 seconds with the saved comment, or throws for a comment with "spam" in it.\n\n' +
        '- Posting shows the comment **at once**, last, as `<li className="comment pending">` with "Sending…" in it, and the box (`input[name=text]`) empties at once.\n' +
        '- When the server answers, the comment is confirmed: no `pending`, no "Sending…", shown once.\n' +
        '- A rejected comment disappears when the server answers, `<p className="error">` says the server\'s message, and its text goes back in the box. A later success empties `.error`.\n' +
        '- Two comments posted quickly both show at once, in order, and are both confirmed, in order. Neither may ever show twice.\n' +
        '- A blank comment is not sent.\n' +
        '- The optimistic update is made inside the action (React reports one made outside it as an error).',
      starter: `import { useState } from 'react';

// the pretend server (do not change)
let nextId = 3;
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function postComment(text) {
  await wait(800);
  if (/spam/i.test(text)) throw new Error('Comment rejected: it looks like spam');
  console.info('server: saved', text);
  return { id: nextId++, author: 'You', text };
}

const START = [
  { id: 1, author: 'Ada', text: 'Great write-up!' },
  { id: 2, author: 'Grace', text: 'The second example helped.' }
];

export default function Thread() {
  const [comments, setComments] = useState(START);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const saved = await postComment(draft);
    setComments([...comments, saved]);
    setDraft('');
  }

  return (
    <div className="thread">
      <ul className="comments">
        {comments.map(c => (
          <li key={c.id} className="comment"><b>{c.author}</b> {c.text}</li>
        ))}
      </ul>
      <form className="comment-form" onSubmit={handleSubmit}>
        <input name="text" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a comment" />
        <button>Post</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
`,
      solution: `import { useState, useOptimistic, startTransition } from 'react';

// the pretend server (do not change)
let nextId = 3;
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function postComment(text) {
  await wait(800);
  if (/spam/i.test(text)) throw new Error('Comment rejected: it looks like spam');
  console.info('server: saved', text);
  return { id: nextId++, author: 'You', text };
}

const START = [
  { id: 1, author: 'Ada', text: 'Great write-up!' },
  { id: 2, author: 'Grace', text: 'The second example helped.' }
];

let pendingId = 0;

export default function Thread() {
  const [comments, setComments] = useState(START);
  const [shown, addShown] = useOptimistic(comments, (current, pending) => [...current, pending]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');                                         // urgent: the box empties at once
    startTransition(async () => {
      addShown({ id: 'pending-' + ++pendingId, author: 'You', text, sending: true });
      try {
        const saved = await postComment(text);
        // inside startTransition: the real comment replaces its optimistic copy when every post is done,
        // never next to it
        startTransition(() => {
          setComments(c => [...c, saved]);
          setError('');
        });
      } catch (err) {
        startTransition(() => {                         // no setComments: the optimistic row goes by itself
          setError(err.message);
          setDraft(text);
        });
      }
    });
  }

  return (
    <div className="thread">
      <ul className="comments">
        {shown.map(c => (
          <li key={c.id} className={'comment' + (c.sending ? ' pending' : '')}>
            <b>{c.author}</b> {c.text}
            {c.sending && <small> Sending…</small>}
          </li>
        ))}
      </ul>
      <form className="comment-form" onSubmit={handleSubmit}>
        <input name="text" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a comment" />
        <button>Post</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
`,
      css: '.comments { list-style: none; padding: 0; margin: 0 0 8px; } .comment { padding: 4px 0; border-bottom: 1px solid #eee; } .pending { color: #889; } .pending small { font-style: italic; } .comment-form { display: flex; gap: 6px; } .comment-form input { flex: 1; padding: 4px 8px; } .error { color: #c62828; }',
      hints: [
        'Render from an optimistic copy of the list: `const [shown, addShown] = useOptimistic(comments, (current, pending) => [...current, pending]);`. A pending comment is an object such as `{ id: \'pending-1\', author: \'You\', text, sending: true }`, and the list gives it the class `pending` and "Sending…".',
        'In the submit handler: take the text, `setDraft(\'\')` outside any transition (so the box empties at once), then `startTransition(async () => { addShown(…); const saved = await postComment(text); … })`.',
        'After the `await`, set the real list inside `startTransition(() => setComments(c => [...c, saved]))`. Without it, with two comments in flight, the first arrives while its optimistic copy is still shown: twice, for a moment.',
        'On failure, do not touch `comments`: the optimistic row goes when the action ends. Set the error and put the text back with `setDraft(text)`.'
      ],
      checks: [
        { label: 'It starts with the two comments from the server', fn: `function (doc, win, t) {
  var texts = t.$$('.comment').map(function (li) { return li.textContent; });
  return (texts.length === 2 && /Ada/.test(texts[0]) && /Grace/.test(texts[1])) || 'the comments: ' + JSON.stringify(texts);
}` },
        { label: 'Posting shows the comment at once, last, `pending` with "Sending…", and the box empties at once', fn: `async function (doc, win, t) {
  await t.type('input[name=text]', 'Nice post');
  await t.click('.comment-form button');
  var all = t.$$('.comment'), last = all[all.length - 1];
  if (all.length !== 3 || !/Nice post/.test(last.textContent)) return 'right after Post the list is: ' + all.map(function (li) { return li.textContent; }).join(' | ');
  if (!last.classList.contains('pending') || !/Sending…/.test(last.textContent)) return 'the new comment is not marked: class "' + last.className + '", text "' + last.textContent + '"';
  var box = doc.querySelector('input[name=text]').value;
  return box === '' || 'the box still holds "' + box + '" while the comment is sent';
}` },
        { label: 'When the server answers, it is confirmed: no `pending`, no "Sending…", shown once', fn: `async function (doc, win, t) {
  await t.wait(950);
  var mine = t.$$('.comment').filter(function (li) { return /Nice post/.test(li.textContent); });
  if (mine.length !== 1) return '"Nice post" shows ' + mine.length + ' times';
  if (mine[0].classList.contains('pending') || /Sending…/.test(mine[0].textContent)) return 'it is still marked as sending';
  return t.$$('.comment').length === 3 || t.$$('.comment').length + ' comments';
}` },
        { label: 'Two quick posts: both show at once in order, both are confirmed in order, and neither ever shows twice', fn: `async function (doc, win, t) {
  function texts() { return t.$$('.comment').map(function (li) { return li.textContent; }); }
  function count(word) { return texts().filter(function (x) { return x.indexOf(word) >= 0; }).length; }
  await t.type('input[name=text]', 'First reply');
  await t.click('.comment-form button');
  await t.wait(100);
  await t.type('input[name=text]', 'Second reply');
  await t.click('.comment-form button');
  var now = texts().slice(-2);
  if (!(/First reply/.test(now[0]) && /Second reply/.test(now[1]))) return 'right after both posts, the last two comments are: ' + now.join(' | ');
  for (var i = 0; i < 30; i++) {
    if (count('First reply') > 1 || count('Second reply') > 1) return 'at one moment the list showed a reply twice: ' + texts().slice(-3).join(' | ');
    await t.wait(40);
  }
  var end = t.$$('.comment').slice(-2);
  if (!(/First reply/.test(end[0].textContent) && /Second reply/.test(end[1].textContent))) return 'at the end: ' + texts().slice(-2).join(' | ');
  return !end.some(function (li) { return li.classList.contains('pending'); }) || 'a reply is still pending';
}` },
        { label: 'A rejected comment disappears, `.error` says why, and the text goes back in the box', fn: `async function (doc, win, t) {
  var before = t.$$('.comment').length;
  await t.type('input[name=text]', 'buy spam now');
  await t.click('.comment-form button');
  if (t.$$('.comment').length !== before + 1) return 'the comment did not show at once';
  await t.wait(950);
  if (t.$$('.comment').some(function (li) { return /buy spam now/.test(li.textContent); })) return 'the rejected comment is still in the list';
  if (t.text('.error') !== 'Comment rejected: it looks like spam') return '.error says ' + JSON.stringify(t.text('.error'));
  var box = doc.querySelector('input[name=text]').value;
  return box === 'buy spam now' || 'the box holds "' + box + '": give the text back';
}` },
        { label: 'The next comment posts normally, and the error goes', fn: `async function (doc, win, t) {
  await t.type('input[name=text]', 'Thanks');
  await t.click('.comment-form button');
  await t.wait(950);
  var last = t.$$('.comment').pop();
  if (!last || !/Thanks/.test(last.textContent) || last.classList.contains('pending')) return 'the last comment is ' + JSON.stringify(last && last.textContent);
  return !doc.querySelector('.error') || '.error still says "' + t.text('.error') + '"';
}` },
        { label: 'A blank comment is not sent', fn: `async function (doc, win, t) {
  var before = t.$$('.comment').length, saved = t.logs().length;
  await t.type('input[name=text]', '   ');
  await t.click('.comment-form button');
  await t.wait(50);
  if (t.$$('.comment').length !== before) return 'a blank comment was added to the list';
  await t.wait(900);
  return !t.logs().slice(saved).some(function (l) { return l.indexOf('server: saved') === 0; }) || 'a blank comment was sent to the server';
}` },
        { label: 'No optimistic update outside an action (React reports it as an error)', fn: `function (doc, win, t) {
  var bad = t.warnings().filter(function (w) { return /optimistic state update occurred outside/.test(w); });
  return !bad.length || 'React said: ' + bad[0];
}` }
      ],
      followups: [
        'A double click posts the same comment twice. How does the server avoid storing it twice?',
        'The server returns the saved comment with its real id and time. How do you swap the pending row for it without the list jumping?',
        'Show "Retry" on a failed comment, kept in the list, instead of putting the text back in the box.',
        'Comments from other people arrive over a WebSocket while yours is pending. Where do they go in the list?',
        'Why must the real update after `await` be wrapped in `startTransition`?',
        'When would you not show a comment optimistically?'
      ],
      learn: ['lesson:r-use-optimistic', 'lesson:r-actions', 'lesson:r-state-arrays']
    },
    {
      id: 'multi-step-form', track: 'react19', level: 'Hard', minutes: 45, plainjs: null, strict: true,
      title: 'Multi-step form',
      summary: 'A sign-up wizard of three steps (Account, Profile, Review): Next validates its step and focuses the first bad field, Back keeps everything typed, Review lists it all with Edit links, and the last step submits through useActionState; an email the server refuses sends you back to step 1 with the error under it.',
      keywords: ['multi-step form', 'multistep form', 'wizard', 'form wizard', 'stepper', 'steps', 'sign-up flow', 'checkout steps', 'validation', 'lifting state', 'aria-current', 'useActionState'],
      plainjsNote: 'Without React, a multi-step form is usually one `<form>` with a `<fieldset>` per step, all in the page and all but one hidden. The values survive Back for free, because the inputs never leave the DOM; Next checks only the visible fieldset (`fieldset.querySelectorAll(\'input\')` and `checkValidity()`), focuses the first invalid input, and the last step submits the whole form at once. In React a step you do not render is gone, inputs and all, so the values must live in state above the steps (or the steps must stay rendered and hidden): that is the heart of this problem.',
      task: 'Finish the sign-up wizard. `createAccount(data)` is the pretend server (do not change it).\n\n' +
        '- `<ol className="steps">` lists Account, Profile, Review; the current step\'s `<li>` has `aria-current="step"`.\n' +
        '- **Step 1**: `email` (must contain `@`: "Enter an email address") and `password` (8 characters or more: "At least 8 characters"). **Step 2**: `name` (required: "Enter your name") and `plan`, two radios `free` and `pro` (Free ticked at first).\n' +
        '- **Next** (`.next`) checks only its step. Each error shows in `<p className="error-email">` (`error-password`, `error-name`), the focus moves to the first bad field, and the step stays. **Back** (`.back`) keeps everything typed, in every step.\n' +
        '- **Review** (`.review`) shows `Email: …`, `Password: ••••••••`, `Name: …` and `Plan: Free` or `Pro`, with **Edit** buttons (`.edit-account`, `.edit-profile`) that go back to that step.\n' +
        '- **Create account** (`.submit`) sends everything through `useActionState`: while it runs it reads `Creating…` and is disabled. On success `<p className="welcome">Welcome, Ada!</p>` replaces the wizard. If the server refuses the email, you are back on step 1 with its message in `.error-email`, and your email still in the box.\n\n' +
        'The fields are `input[name=email]`, `input[name=password]`, `input[name=name]` and `input[name=plan]`.',
      starter: `import { useState } from 'react';

// the pretend server (do not change)
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function createAccount(data) {
  await wait(600);
  if (data.email === 'taken@example.com') return { error: 'That email is already registered' };
  console.info('server: created', data.email);
  return { user: { name: data.name } };
}

// TODO: keep the values above the steps, validate on Next, Review, Edit, and submit with useActionState
function AccountStep({ onNext }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="step">
      <label>Email <input name="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Password <input name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button className="next" onClick={onNext}>Next</button>
    </div>
  );
}

function ProfileStep({ onBack, onNext }) {
  const [name, setName] = useState('');
  return (
    <div className="step">
      <label>Name <input name="name" value={name} onChange={e => setName(e.target.value)} /></label>
      <button className="back" onClick={onBack}>Back</button>
      <button className="next" onClick={onNext}>Next</button>
    </div>
  );
}

function ReviewStep({ onBack }) {
  return (
    <div className="step review">
      <p>Check your details.</p>
      <button className="back" onClick={onBack}>Back</button>
      <button className="submit">Create account</button>
    </div>
  );
}

export default function SignUpWizard() {
  const [step, setStep] = useState(1);
  return (
    <div className="wizard">
      <ol className="steps">
        <li>Account</li>
        <li>Profile</li>
        <li>Review</li>
      </ol>
      {step === 1 && <AccountStep onNext={() => setStep(2)} />}
      {step === 2 && <ProfileStep onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <ReviewStep onBack={() => setStep(2)} />}
    </div>
  );
}
`,
      solution: `import { useState, useRef, useActionState } from 'react';

// the pretend server (do not change)
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function createAccount(data) {
  await wait(600);
  if (data.email === 'taken@example.com') return { error: 'That email is already registered' };
  console.info('server: created', data.email);
  return { user: { name: data.name } };
}

const STEPS = ['Account', 'Profile', 'Review'];

// each step's fields, in order, and what is wrong with them
function problems(step, data) {
  const errors = {};
  if (step === 1) {
    if (!data.email.includes('@')) errors.email = 'Enter an email address';
    if (data.password.length < 8) errors.password = 'At least 8 characters';
  }
  if (step === 2 && !data.name.trim()) errors.name = 'Enter your name';
  return errors;
}

function Field({ label, name, type = 'text', data, errors, onChange }) {
  return (
    <label>
      {label} <input name={name} type={type} value={data[name]} onChange={e => onChange(name, e.target.value)} />
      {errors[name] && <p className={'error-' + name}>{errors[name]}</p>}
    </label>
  );
}

export default function SignUpWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ email: '', password: '', name: '', plan: 'free' });   // above the steps: Back loses nothing
  const [errors, setErrors] = useState({});
  const stepRef = useRef(null);

  const [result, submit, isPending] = useActionState(async () => {
    const answer = await createAccount(data);
    if (answer.error) {
      setErrors({ email: answer.error });
      setStep(1);
      return {};
    }
    return { user: answer.user };
  }, {});

  function change(name, value) {
    setData(d => ({ ...d, [name]: value }));
  }

  function next() {
    const found = problems(step, data);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      stepRef.current.querySelector('[name="' + first + '"]').focus();
      return;
    }
    setStep(step + 1);
  }

  function goTo(n) {
    setErrors({});
    setStep(n);
  }

  if (result.user) return <p className="welcome">Welcome, {result.user.name}!</p>;

  const props = { data, errors, onChange: change };
  return (
    <div className="wizard">
      <ol className="steps">
        {STEPS.map((s, i) => <li key={s} aria-current={step === i + 1 ? 'step' : undefined}>{s}</li>)}
      </ol>
      <div className="step" ref={stepRef}>
        {step === 1 && (
          <>
            <Field label="Email" name="email" {...props} />
            <Field label="Password" name="password" type="password" {...props} />
            <button className="next" onClick={next}>Next</button>
          </>
        )}
        {step === 2 && (
          <>
            <Field label="Name" name="name" {...props} />
            <fieldset>
              <legend>Plan</legend>
              {['free', 'pro'].map(p => (
                <label key={p}>
                  <input type="radio" name="plan" value={p} checked={data.plan === p} onChange={() => change('plan', p)} /> {p === 'free' ? 'Free' : 'Pro'}
                </label>
              ))}
            </fieldset>
            <button className="back" onClick={() => goTo(1)}>Back</button>
            <button className="next" onClick={next}>Next</button>
          </>
        )}
        {step === 3 && (
          <form className="review" action={submit}>
            <p>Email: {data.email} <button type="button" className="edit-account" onClick={() => goTo(1)}>Edit</button></p>
            <p>Password: ••••••••</p>
            <p>Name: {data.name} <button type="button" className="edit-profile" onClick={() => goTo(2)}>Edit</button></p>
            <p>Plan: {data.plan === 'pro' ? 'Pro' : 'Free'}</p>
            <button type="button" className="back" onClick={() => goTo(2)}>Back</button>
            <button className="submit" disabled={isPending}>{isPending ? 'Creating…' : 'Create account'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
`,
      css: '.steps { display: flex; gap: 14px; padding-left: 18px; } .steps li[aria-current="step"] { font-weight: 700; color: #087ea4; } .step { display: grid; gap: 6px; max-width: 300px; } .step label { display: grid; gap: 2px; } .step input:not([type=radio]) { padding: 4px 8px; } fieldset label { display: inline; margin-right: 10px; } [class^="error-"] { margin: 0; color: #c62828; font-size: 14px; } .review p { margin: 2px 0; } .welcome { color: #1a7f37; font-weight: 600; }',
      hints: [
        'The steps are not rendered when you leave them, so their own state is lost. Keep every value in one object in `SignUpWizard`: `useState({ email: \'\', password: \'\', name: \'\', plan: \'free\' })`, and make each field controlled from it.',
        'Next: work out the current step\'s errors (`{ email: \'Enter an email address\', … }`), put them in state, and if there are any, focus the first: a ref on the step\'s container and `ref.current.querySelector(\'[name="email"]\').focus()`. Only with no errors, go to the next step.',
        'The steps indicator: `aria-current={step === i + 1 ? \'step\' : undefined}` on each `<li>`. Review is plain text from the state, the password as `••••••••`, and Edit is `setStep(1)` or `setStep(2)`.',
        'Submit: `const [result, submit, isPending] = useActionState(async () => { const answer = await createAccount(data); … }, {});` and `<form action={submit}>` around the Review. On an error, set it as the email\'s error and go back to step 1; on success return the user and render the welcome.'
      ],
      checks: [
        { label: 'Step 1 shows the email and password, and the indicator marks Account as the current step', fn: `function (doc, win, t) {
  if (!doc.querySelector('input[name=email]') || !doc.querySelector('input[name=password]')) return 'step 1 has no email or password field';
  var cur = doc.querySelector('.steps [aria-current="step"]');
  return (cur && cur.textContent === 'Account') || 'the current step is ' + JSON.stringify(cur && cur.textContent);
}` },
        { label: 'Next with a bad email and a short password: both errors, the focus on the email, still on step 1', fn: `async function (doc, win, t) {
  await t.type('input[name=email]', 'ada');
  await t.type('input[name=password]', 'short');
  await t.click('.next');
  if (t.text('.error-email') !== 'Enter an email address') return '.error-email says ' + JSON.stringify(t.text('.error-email'));
  if (t.text('.error-password') !== 'At least 8 characters') return '.error-password says ' + JSON.stringify(t.text('.error-password'));
  if (doc.activeElement !== doc.querySelector('input[name=email]')) return 'the focus is not on the email field';
  return t.text('.steps [aria-current="step"]') === 'Account' || 'the step changed to ' + t.text('.steps [aria-current="step"]');
}` },
        { label: 'A valid account, Next: step 2, Profile, with no errors left', fn: `async function (doc, win, t) {
  await t.type('input[name=email]', 'ada@example.com');
  await t.type('input[name=password]', 'longenough1');
  await t.click('.next');
  if (t.text('.steps [aria-current="step"]') !== 'Profile') return 'the current step is ' + JSON.stringify(t.text('.steps [aria-current="step"]'));
  if (!doc.querySelector('input[name=name]')) return 'step 2 has no name field';
  return !doc.querySelector('[class^="error-"]') || 'an error still shows: ' + t.text('[class^="error-"]');
}` },
        { label: 'Back: step 1, with the email and password still there', fn: `async function (doc, win, t) {
  await t.click('.back');
  var e = doc.querySelector('input[name=email]'), p = doc.querySelector('input[name=password]');
  if (!e) return 'Back did not go to step 1';
  if (e.value !== 'ada@example.com' || p.value !== 'longenough1') return 'after Back the fields hold "' + e.value + '" and "' + p.value + '": keep the values above the steps';
  await t.click('.next');
  return t.text('.steps [aria-current="step"]') === 'Profile' || 'Next did not return to step 2';
}` },
        { label: 'Step 2: no name shows "Enter your name" and focuses it; Ada and Pro go on to the Review', fn: `async function (doc, win, t) {
  await t.click('.next');
  if (t.text('.error-name') !== 'Enter your name') return '.error-name says ' + JSON.stringify(t.text('.error-name'));
  if (doc.activeElement !== doc.querySelector('input[name=name]')) return 'the focus is not on the name field';
  await t.type('input[name=name]', 'Ada');
  var pro = doc.querySelector('input[name=plan][value=pro]');
  if (!pro) return 'no plan radio with the value "pro"';
  await t.click(pro);
  await t.click('.next');
  return (!!doc.querySelector('.review') && t.text('.steps [aria-current="step"]') === 'Review') || 'Next did not show the Review';
}` },
        { label: 'The Review lists the email, the name and the plan, and hides the password', fn: `function (doc, win, t) {
  var r = t.text('.review');
  var want = ['Email: ada@example.com', 'Password: ••••••••', 'Name: Ada', 'Plan: Pro'];
  for (var i = 0; i < want.length; i++) if (r.indexOf(want[i]) < 0) return 'the Review lacks "' + want[i] + '": ' + r;
  return r.indexOf('longenough1') < 0 || 'the Review shows the password';
}` },
        { label: 'Edit on the account goes back to step 1, everything kept; Next, Next returns to the Review', fn: `async function (doc, win, t) {
  await t.click('.edit-account');
  var e = doc.querySelector('input[name=email]');
  if (!e || e.value !== 'ada@example.com') return 'Edit did not go to step 1 with the email kept';
  await t.click('.next');
  if (doc.querySelector('input[name=name]').value !== 'Ada') return 'the name was lost';
  await t.click('.next');
  return !!doc.querySelector('.review') || 'Next, Next did not return to the Review';
}` },
        { label: 'An email the server refuses: back on step 1, its message under the email, the email kept', fn: `async function (doc, win, t) {
  await t.click('.edit-account');
  await t.type('input[name=email]', 'taken@example.com');
  await t.click('.next');
  await t.click('.next');
  await t.click('.submit');
  await t.wait(700);
  if (t.text('.steps [aria-current="step"]') !== 'Account') return 'after the refusal the current step is ' + JSON.stringify(t.text('.steps [aria-current="step"]'));
  if (t.text('.error-email') !== 'That email is already registered') return '.error-email says ' + JSON.stringify(t.text('.error-email'));
  var e = doc.querySelector('input[name=email]').value;
  return e === 'taken@example.com' || 'the email box holds "' + e + '"';
}` },
        { label: 'Create account: "Creating…" and disabled while it runs, then "Welcome, Ada!"', fn: `async function (doc, win, t) {
  await t.type('input[name=email]', 'ada@example.com');
  await t.click('.next');
  await t.click('.next');
  await t.click('.submit');
  var b = doc.querySelector('.submit');
  if (!b) return 'the Review is gone at once: it should wait for the server';
  if (b.textContent !== 'Creating…' || !b.disabled) return 'while it runs, the button reads "' + b.textContent + '"' + (b.disabled ? '' : ' and is not disabled');
  await t.wait(700);
  if (doc.querySelector('.wizard')) return 'the wizard is still there';
  return t.text('.welcome') === 'Welcome, Ada!' || '.welcome says ' + JSON.stringify(t.text('.welcome'));
}` }
      ],
      followups: [
        'Save the progress so a reload comes back to the same step with the same values.',
        'Let the indicator jump to any step already completed, but not past the first incomplete one.',
        'Check the email as it is typed, but only once the user has left the field the first time.',
        'The steps come from a configuration array. How would you make the wizard generic?',
        'Make the browser\'s Back button go to the previous step: the step in the URL.',
        'How would React Hook Form, or a Zod schema, change this code?'
      ],
      learn: ['lesson:r-lifting-state', 'lesson:r-forms', 'lesson:r-use-action-state', 'lesson:r-dom-refs']
    }
  );
})(window.RLT);
