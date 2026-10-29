/*
 * Lessons, track 2: State and forms.
 *
 * The lesson shape, and how the code is written (template literals that never use `${`), are
 * described at the top of data/lessons-foundations.js. Two examples here show a habit on purpose:
 * the objects and arrays lessons change state in place next to the right way, so the editor's ⚠
 * appears on the line that does it (tests/test_ui.py lists them in ON_PURPOSE).
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  function block(lang, lines) { return '```' + lang + '\n' + lines.join('\n') + '\n```'; }
  function jsx() { return block('jsx', [].slice.call(arguments)); }
  function js() { return block('js', [].slice.call(arguments)); }

  L.push(
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'r-state-snapshot', track: 'state',
      title: 'State is a snapshot',
      summary: 'Setting state does not change the value you already hold: it asks React for the next render. Each render sees its own fixed state, the updates of one event are batched, and setCount(c => c + 1) builds on the latest value.',
      keywords: ['snapshot', 'batching', 'batch', 'updater function', 'functional update', 'state not updating', 'setState not updating immediately', 'prev', 'queue', 'stale', 'console.log after setState', 'async setState', 'setCount(count + 1)', 're-render'],
      docs: 'https://react.dev/learn/state-as-a-snapshot', uilt: 'js-events',
      body: [
        'In [[lesson:r-state-basics]] the setter made the component draw again with the new value. One thing about it surprises everyone once, and interviews ask about it in almost every round: the setter does **not** change the variable you are holding.',
        jsx('const [count, setCount] = useState(0);',
            '',
            'function handleClick() {',
            '  setCount(count + 1);',
            '  console.log(count);     // 0, not 1',
            '}'),
        '## A render is a snapshot',
        'When React calls your component, `useState` hands back the value **for this render**, and `count` is a `const` holding it. Nothing changes it while this render\'s code runs, and that includes the event handlers this render created. `setCount(1)` does two things: it stores 1 for **next time**, and it asks React to render again. In the next render `useState` hands back 1, in a brand-new `count`.',
        'Think of each render as a photo: the JSX, the handlers and the values they read were all taken at the same moment. A handler that runs later, even from a timer, still sees the values in its own photo:',
        jsx('function handleClick() {',
            '  setCount(count + 5);',
            "  setTimeout(() => console.log(count), 3000);   // logs 0, three seconds later",
            '}'),
        '## Three calls, one more',
        jsx('function handleClick() {',
            '  setCount(count + 1);   // setCount(0 + 1)',
            '  setCount(count + 1);   // setCount(0 + 1)',
            '  setCount(count + 1);   // setCount(0 + 1)',
            '}'),
        'One click adds **1**, not 3. All three lines read the same snapshot, so each one says "make it 1". React also **batches** them: it waits until the whole event handler has finished, then renders once. (Since React 18 it batches the updates made in timers and promises too, not only those in event handlers.)',
        '## The updater function',
        'To build on what the previous update produced, pass the setter a **function** instead of a value. React puts it in a queue and, during the next render, calls it with the latest value:',
        jsx('function handleClick() {',
            '  setCount(c => c + 1);   // 0 → 1',
            '  setCount(c => c + 1);   // 1 → 2',
            '  setCount(c => c + 1);   // 2 → 3',
            '}'),
        '| Queued update | `c` it receives | It returns |\n|---|---|---|\n' +
        '| `c => c + 1` | 0 | 1 |\n' +
        '| `c => c + 1` | 1 | 2 |\n' +
        '| `c => c + 1` | 2 | 3 |',
        'A plain value in the queue means "replace it with this"; a function means "work it out from the one before". So `setCount(count + 5)` followed by `setCount(c => c + 1)` gives 6. [[explain:state-snapshot]] steps through these one move at a time, then runs them in real React.',
        '## Which one to use',
        '- The next value depends on the previous one, and it may change more than once before the next render (several calls, a timer, an interval): the **updater**, `setCount(c => c + 1)`.',
        '- The next value does not depend on the old one (`setName(\'Asha\')`, `setOpen(false)`): the plain value.',
        'Name the parameter after the state: `c` for `count`, `prev`, or the full name. An updater must be **pure**: work out the result and return it, nothing else, because React may call it twice in development.',
        'Interview questions on this lesson: [[q:state-not-immediate]], [[q:predict-output]] and, with a timer, [[q:stale-interval]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript `count++` changes the variable at once: the next line sees the new value, and you call `render()` yourself when you are ready. In React the setter is a **request**: it is like leaving React a note saying "next time, count is 1". React reads its notes once your handler has finished, and only then calls your component again. The line after the setter still runs in the old render, with the old value.',
      example: {
        code: `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  function plusThreeValues() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  function plusThreeUpdaters() {
    setCount(c => c + 1);
    setCount(c => c + 1);
    setCount(c => c + 1);
  }

  function setThenLog() {
    setCount(count + 1);
    console.log('right after setCount, count is still', count);
  }

  return (
    <div className="board">
      <output className="big">{count}</output>
      <button onClick={plusThreeValues}>count + 1, three times</button>
      <button onClick={plusThreeUpdaters}>{'c => c + 1'}, three times</button>
      <button onClick={setThenLog}>Set, then log</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
`,
        css: '.board { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; } .big { font-size: 40px; font-weight: 700; min-width: 2ch; margin-right: 8px; }',
        note: 'Click each button and watch the number. After "Set, then log", read the console under the preview: it prints the value from before the click.'
      },
      challenge: {
        title: 'A bonus that adds three',
        task: 'The **Bonus +3** button calls `addPoint()` three times, yet the score goes up by only 1, and the message under the score is always one click behind.\n\n' +
          '1. Fix `addPoint` so that a bonus adds 3. Keep `bonus` as it is: it must still call `addPoint()` three times.\n' +
          '2. Make the message say the score as it is now: `Score is now 4` when the score shows 4.\n\n' +
          'For the checks: the score is in `<output className="score">`, the message in `<p className="message">`, and the buttons have the classes `point` (+1) and `bonus`.',
        starter: `import { useState } from 'react';

export default function Scoreboard() {
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Score is now 0');

  function addPoint() {
    setScore(score + 1);
    setMessage('Score is now ' + score);
  }

  function bonus() {
    addPoint();
    addPoint();
    addPoint();
  }

  return (
    <div className="scoreboard">
      <output className="score">{score}</output>
      <p className="message">{message}</p>
      <button className="point" onClick={addPoint}>+1</button>
      <button className="bonus" onClick={bonus}>Bonus +3</button>
    </div>
  );
}
`,
        solution: `import { useState } from 'react';

export default function Scoreboard() {
  const [score, setScore] = useState(0);

  function addPoint() {
    setScore(s => s + 1);
  }

  function bonus() {
    addPoint();
    addPoint();
    addPoint();
  }

  return (
    <div className="scoreboard">
      <output className="score">{score}</output>
      <p className="message">Score is now {score}</p>
      <button className="point" onClick={addPoint}>+1</button>
      <button className="bonus" onClick={bonus}>Bonus +3</button>
    </div>
  );
}
`,
        css: '.scoreboard { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; } .score { font-size: 36px; font-weight: 700; min-width: 2ch; } .message { flex-basis: 100%; margin: 0; color: #556; }',
        hints: [
          'All three `addPoint()` calls run in the same render, where `score` is one fixed number. Give the setter a function instead: `setScore(s => s + 1)`. React runs each one on the result of the one before.',
          'The message lags because `score` is this render\'s value; the new one only exists in the next render. The message needs no state at all: work it out from `score` in the JSX, `<p className="message">Score is now {score}</p>`.'
        ],
        checks: [
          { label: 'It starts at 0, saying "Score is now 0"', fn: `function (doc, win, t) {
  return (t.text('.score') === '0' && t.text('.message') === 'Score is now 0') || 'it shows ' + t.text('.score') + ' and "' + t.text('.message') + '"';
}` },
          { label: '+1 shows 1, and the message says "Score is now 1"', fn: `async function (doc, win, t) {
  await t.click('.point');
  return (t.text('.score') === '1' && t.text('.message') === 'Score is now 1') || 'after +1 it shows ' + t.text('.score') + ' and "' + t.text('.message') + '"';
}` },
          { label: 'Bonus +3 then shows 4, and "Score is now 4"', fn: `async function (doc, win, t) {
  await t.click('.bonus');
  return (t.text('.score') === '4' && t.text('.message') === 'Score is now 4') || 'after the bonus it shows ' + t.text('.score') + ' and "' + t.text('.message') + '"';
}` },
          { label: 'The bonus still calls `addPoint()` three times', fn: `function (doc, win, t) {
  var calls = (t.source().match(/addPoint\\(\\)/g) || []).length;
  return calls >= 3 || 'addPoint() is called ' + calls + ' times in the code';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'r-state-objects', track: 'state',
      title: 'Objects in state',
      summary: 'Treat an object in state as read-only: to change it, make a new one with the spread syntax, { ...person, age: 31 }, and copy each nested level you change. Changing the old object leaves the page as it was.',
      keywords: ['object', 'objects in state', 'spread', '...', 'immutable', 'immutability', 'mutate', 'mutation', 'nested object', 'copy', 'Object.is', 'immer', 'computed property', '[e.target.name]', 'update object', 'reference'],
      docs: 'https://react.dev/learn/updating-objects-in-state', uilt: 'js-basics',
      body: [
        'State can hold any value, objects included. An object in state has one rule: treat it as **read-only**. To change it, make a new object and give that to the setter.',
        jsx("const [person, setPerson] = useState({ name: 'Asha', age: 30 });",
            '',
            'person.age = 31;                         // ❌ changes the object React already has',
            'setPerson(person);                       //    and hands back the same one: no render',
            '',
            'setPerson({ ...person, age: 31 });       // ✅ a new object: React renders'),
        '## Why changing it does nothing',
        'When you call the setter, React compares the new value with the old one using `Object.is`. For objects that asks "is it the **same object**?", not "are the fields the same?". After `person.age = 31` it is still the same object, so React decides nothing changed, skips the render, and the page keeps showing 30. The change is in there, hidden: the next render that happens for any other reason suddenly shows it. Comparing references instead of every field is what keeps React fast. [[q:immutable-state]] is the interview question.',
        '## Copy with the spread syntax',
        '`{ ...person }` copies every field into a new object; fields written after it replace the copied ones:',
        jsx('setPerson({ ...person, age: person.age + 1 });   // name copied, age replaced'),
        '## One handler for many fields',
        'A form with several inputs needs one handler, not one per field. Give each input a `name`, and use it as a **computed property name**, `[e.target.name]`:',
        jsx('function handleChange(e) {',
            '  setForm({ ...form, [e.target.name]: e.target.value });',
            '}',
            '',
            '<input name="first" value={form.first} onChange={handleChange} />',
            '<input name="email" value={form.email} onChange={handleChange} />'),
        '## Nested objects: copy every level you change',
        'The spread copies one level only. The objects inside are shared with the old one, so changing a nested field means copying each level on the way down:',
        jsx("const [person, setPerson] = useState({ name: 'Asha', address: { city: 'Pune', pin: '411001' } });",
            '',
            "setPerson({ ...person, address: { ...person.address, city: 'Chennai' } });   // ✅",
            "setPerson({ ...person, address: { city: 'Chennai' } });                      // ❌ the pin is gone",
            "person.address.city = 'Chennai';                                             // ❌ changes the old object"),
        '## When the nesting gets deep',
        'Copying three levels by hand gets noisy. Keep the state flatter where you can, or use **Immer** (`useImmer`): you write `draft.address.city = \'Chennai\'` and it makes the copies for you. Redux Toolkit uses Immer the same way.',
        'The editor helps: a line that changes state in place, such as `person.age = …` or `items.push(…)`, gets a ⚠ while you type.'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you change the object and redraw: `person.age = 31; render();`. Nothing compares anything: `render()` runs because you called it. In React the setter decides whether to render by comparing references, so the plain-JS habit of changing objects in place is exactly what breaks. The tools are plain JavaScript: the spread syntax `{ ...person, age: 31 }` and computed names `{ [key]: value }` both come from the language, not from React.',
      example: {
        code: `import { useState } from 'react';

export default function App() {
  const [person, setPerson] = useState({
    name: 'Asha',
    age: 30,
    address: { city: 'Pune', pin: '411001' }
  });

  function birthdayInPlace() {
    person.age += 1;       // changes the object React already has...
    setPerson(person);     // ...and hands back the same one: React skips the render
  }

  function birthdayCopy() {
    setPerson({ ...person, age: person.age + 1 });
  }

  function move() {
    setPerson({ ...person, address: { ...person.address, city: 'Chennai', pin: '600001' } });
  }

  return (
    <div className="card">
      <h3>{person.name}, {person.age}</h3>
      <p>{person.address.city} {person.address.pin}</p>
      <button onClick={birthdayInPlace}>Birthday (in place) ⚠</button>
      <button onClick={birthdayCopy}>Birthday (a copy)</button>
      <button onClick={move}>Move to Chennai</button>
    </div>
  );
}
`,
        css: '.card { border: 1px solid #ccd; border-radius: 10px; padding: 10px 14px; max-width: 360px; } .card h3 { margin: 0; } .card p { margin: 4px 0 10px; color: #556; } .card button { margin: 0 6px 6px 0; }',
        note: 'Click "Birthday (in place)" three times: nothing changes. Then click "Birthday (a copy)": the age jumps by four, because the three hidden changes were there all along. The ⚠ in the editor marks the line that changes state in place.'
      },
      challenge: {
        title: 'Edit a profile',
        task: 'Typing in the inputs changes nothing: both handlers change the `profile` object in place. Fix them so each makes a new object:\n\n' +
          '- `handleChange` serves the Name and Email inputs: one handler, using the input\'s `name`.\n' +
          '- `handleCity` changes the city inside `address`, and keeps the pin.\n\n' +
          'The card under the inputs must follow every keystroke.',
        starter: `import { useState } from 'react';

export default function ProfileEditor() {
  const [profile, setProfile] = useState({
    name: 'Asha',
    email: 'asha@example.com',
    address: { city: 'Pune', pin: '411001' }
  });

  function handleChange(e) {
    profile[e.target.name] = e.target.value;
    setProfile(profile);
  }

  function handleCity(e) {
    profile.address.city = e.target.value;
    setProfile(profile);
  }

  return (
    <div className="editor">
      <label>Name <input name="name" value={profile.name} onChange={handleChange} /></label>
      <label>Email <input name="email" value={profile.email} onChange={handleChange} /></label>
      <label>City <input name="city" value={profile.address.city} onChange={handleCity} /></label>
      <div className="card">
        <b className="card-name">{profile.name}</b>
        <span className="card-email">{profile.email}</span>
        <span className="card-city">{profile.address.city} {profile.address.pin}</span>
      </div>
    </div>
  );
}
`,
        solution: `import { useState } from 'react';

export default function ProfileEditor() {
  const [profile, setProfile] = useState({
    name: 'Asha',
    email: 'asha@example.com',
    address: { city: 'Pune', pin: '411001' }
  });

  function handleChange(e) {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  }

  function handleCity(e) {
    setProfile({ ...profile, address: { ...profile.address, city: e.target.value } });
  }

  return (
    <div className="editor">
      <label>Name <input name="name" value={profile.name} onChange={handleChange} /></label>
      <label>Email <input name="email" value={profile.email} onChange={handleChange} /></label>
      <label>City <input name="city" value={profile.address.city} onChange={handleCity} /></label>
      <div className="card">
        <b className="card-name">{profile.name}</b>
        <span className="card-email">{profile.email}</span>
        <span className="card-city">{profile.address.city} {profile.address.pin}</span>
      </div>
    </div>
  );
}
`,
        css: '.editor { display: grid; gap: 6px; max-width: 320px; } .editor label { display: flex; justify-content: space-between; gap: 8px; } .card { display: grid; gap: 2px; margin-top: 6px; padding: 8px 12px; border: 1px solid #ccd; border-radius: 8px; } .card span { color: #556; }',
        hints: [
          '`{ ...profile, [e.target.name]: e.target.value }` copies every field, then replaces the one the input names (`name` or `email`).',
          'For the city, copy two levels: `{ ...profile, address: { ...profile.address, city: e.target.value } }`. Without the inner `...profile.address`, the pin is lost.'
        ],
        checks: [
          { label: 'Typing a name changes the card', fn: `async function (doc, win, t) {
  await t.type('input[name="name"]', 'Meera');
  return t.text('.card-name') === 'Meera' || 'the card says "' + t.text('.card-name') + '"';
}` },
          { label: 'Typing an email changes it, and keeps the name', fn: `async function (doc, win, t) {
  await t.type('input[name="email"]', 'meera@example.com');
  if (t.text('.card-email') !== 'meera@example.com') return 'the card says "' + t.text('.card-email') + '"';
  return t.text('.card-name') === 'Meera' || 'the name became "' + t.text('.card-name') + '"';
}` },
          { label: 'Typing a city changes it, and keeps the pin and the name', fn: `async function (doc, win, t) {
  await t.type('input[name="city"]', 'Kochi');
  if (t.text('.card-city') !== 'Kochi 411001') return 'the card says "' + t.text('.card-city') + '"';
  return t.text('.card-name') === 'Meera' || 'the name became "' + t.text('.card-name') + '"';
}` },
          { label: 'Nothing is assigned into `profile`', fn: `function (doc, win, t) {
  return !/profile(\\.\\w+|\\[[^\\]]+\\])+\\s*=[^=]/.test(t.source()) || 'the code still assigns into profile';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'r-state-arrays', track: 'state',
      title: 'Arrays in state',
      summary: 'Arrays in state are read-only too: add with [...items, x], remove with filter, change one item with map, and copy before you sort. push, splice and items[i] = x change the old array, and React does not draw again.',
      keywords: ['array', 'arrays in state', 'list', 'add', 'remove', 'delete', 'filter', 'map', 'push', 'splice', 'sort', 'reverse', 'immutable', 'spread', 'toSorted', 'update item in array', 'insert', 'shallow copy'],
      docs: 'https://react.dev/learn/updating-arrays-in-state', uilt: 'js-todo',
      body: [
        'An array in state follows the rule of [[lesson:r-state-objects]]: never change it, always give the setter a **new** array. Most array methods already return a new array, so the rule is mostly about which methods to pick:',
        '| To | Avoid: changes the array | Use: returns a new one |\n|---|---|---|\n' +
        '| Add | `push`, `unshift` | `[...items, item]`, `[item, ...items]` |\n' +
        '| Remove | `splice`, `pop`, `shift` | `filter` |\n' +
        '| Change an item | `items[i] = x` | `map` |\n' +
        '| Insert | `splice` | `[...items.slice(0, i), x, ...items.slice(i)]` |\n' +
        '| Sort, reverse | `sort`, `reverse` | copy first, `[...items].sort(…)`; or `toSorted`, `toReversed` |',
        '## Add',
        jsx('setTodos([...todos, { id: nextId, text, done: false }]);'),
        '## Remove',
        jsx('setTodos(todos.filter(t => t.id !== id));'),
        '## Change one item',
        'The objects inside the array are state too. Replace the one you change with a new object, and keep the others as they are:',
        jsx('setTodos(todos.map(t => (t.id === id ? { ...t, done: !t.done } : t)));'),
        '## The shallow-copy trap',
        '`[...todos]` is a new array holding the **same** objects. `const copy = [...todos]; copy[0].done = true;` still changes an object the old array shares, so the data of the render on screen changes under it. Change items with `map` and a spread, as above.',
        '## Sort and reverse',
        'Both work in place. Copy first: `setItems([...items].sort((a, b) => a.name.localeCompare(b.name)))`. Current browsers also have `items.toSorted(…)` and `items.toReversed()`, which return new arrays.',
        'Keys still come from the data, never from the position: [[lesson:r-lists-keys]]. The interview question is [[q:immutable-state]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you change the array and redraw: `todos.push(todo); render();`, `todos.splice(i, 1); render();`. React compares the array the setter gets with the one it has, by reference: a pushed array is still the same array, so nothing happens. `filter`, `map`, `slice` and the spread syntax are the plain-JS methods you already know; the only change is that you reach for them instead of `push`, `splice` and `sort`.',
      example: {
        code: `import { useState } from 'react';

let nextId = 4;

export default function App() {
  const [items, setItems] = useState([
    { id: 1, name: 'Rice', got: false },
    { id: 2, name: 'Dal', got: true },
    { id: 3, name: 'Mangoes', got: false }
  ]);

  function addPushed() {
    items.push({ id: nextId++, name: 'Tea (pushed)', got: false });   // the same array...
    setItems(items);                                                   // ...so React sees no change
  }

  function addCopied() {
    setItems([...items, { id: nextId++, name: 'Tea', got: false }]);
  }

  function toggle(id) {
    setItems(items.map(i => (i.id === id ? { ...i, got: !i.got } : i)));
  }

  function remove(id) {
    setItems(items.filter(i => i.id !== id));
  }

  function sortByName() {
    setItems([...items].sort((a, b) => a.name.localeCompare(b.name)));
  }

  return (
    <div>
      <ul className="list">
        {items.map(i => (
          <li key={i.id} className={i.got ? 'got' : ''}>
            <label><input type="checkbox" checked={i.got} onChange={() => toggle(i.id)} /> {i.name}</label>
            <button className="x" onClick={() => remove(i.id)} aria-label={'Remove ' + i.name}>×</button>
          </li>
        ))}
      </ul>
      <button onClick={addPushed}>Add with push ⚠</button>
      <button onClick={addCopied}>Add with a copy</button>
      <button onClick={sortByName}>Sort A–Z</button>
    </div>
  );
}
`,
        css: '.list { list-style: none; padding: 0; max-width: 300px; } .list li { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid #eee; } .list li.got label { text-decoration: line-through; color: #889; } .x { border: 0; background: none; color: #c33; font-size: 18px; cursor: pointer; } button { margin: 6px 6px 0 0; }',
        note: 'Click "Add with push" twice: nothing shows. Then tick any box: both hidden teas appear at once, because the next render reads the array that was changed in place.'
      },
      challenge: {
        title: 'A playlist',
        task: 'The three buttons do nothing: each handler changes the `songs` array, or an object in it, in place. Rewrite them so each one makes a new array:\n\n' +
          '- **♡** toggles a song\'s `liked` (its `<li>` then has the class `liked`, and its button `aria-pressed="true"`).\n' +
          '- **×** removes the song.\n' +
          '- **Sort A–Z** sorts the songs by title.',
        starter: `import { useState } from 'react';

export default function Playlist() {
  const [songs, setSongs] = useState([
    { id: 'a', title: 'Tum Hi Ho', liked: false },
    { id: 'b', title: 'Kesariya', liked: false },
    { id: 'c', title: 'Apna Bana Le', liked: false },
    { id: 'd', title: 'Chaiyya Chaiyya', liked: false }
  ]);

  function toggleLike(id) {
    const song = songs.find(s => s.id === id);
    song.liked = !song.liked;
    setSongs(songs);
  }

  function remove(id) {
    songs.splice(songs.findIndex(s => s.id === id), 1);
    setSongs(songs);
  }

  function sortByTitle() {
    songs.sort((a, b) => a.title.localeCompare(b.title));
    setSongs(songs);
  }

  return (
    <div>
      <ol className="playlist">
        {songs.map(s => (
          <li key={s.id} className={s.liked ? 'liked' : ''}>
            <span className="title">{s.title}</span>
            <button className="like" aria-pressed={s.liked} onClick={() => toggleLike(s.id)}>{s.liked ? '♥' : '♡'}</button>
            <button className="remove" aria-label={'Remove ' + s.title} onClick={() => remove(s.id)}>×</button>
          </li>
        ))}
      </ol>
      <button className="sort" onClick={sortByTitle}>Sort A–Z</button>
    </div>
  );
}
`,
        solution: `import { useState } from 'react';

export default function Playlist() {
  const [songs, setSongs] = useState([
    { id: 'a', title: 'Tum Hi Ho', liked: false },
    { id: 'b', title: 'Kesariya', liked: false },
    { id: 'c', title: 'Apna Bana Le', liked: false },
    { id: 'd', title: 'Chaiyya Chaiyya', liked: false }
  ]);

  function toggleLike(id) {
    setSongs(songs.map(s => (s.id === id ? { ...s, liked: !s.liked } : s)));
  }

  function remove(id) {
    setSongs(songs.filter(s => s.id !== id));
  }

  function sortByTitle() {
    setSongs([...songs].sort((a, b) => a.title.localeCompare(b.title)));
  }

  return (
    <div>
      <ol className="playlist">
        {songs.map(s => (
          <li key={s.id} className={s.liked ? 'liked' : ''}>
            <span className="title">{s.title}</span>
            <button className="like" aria-pressed={s.liked} onClick={() => toggleLike(s.id)}>{s.liked ? '♥' : '♡'}</button>
            <button className="remove" aria-label={'Remove ' + s.title} onClick={() => remove(s.id)}>×</button>
          </li>
        ))}
      </ol>
      <button className="sort" onClick={sortByTitle}>Sort A–Z</button>
    </div>
  );
}
`,
        css: '.playlist { padding-left: 22px; max-width: 320px; } .playlist li { padding: 2px 0; } .title { display: inline-block; min-width: 160px; } .playlist li.liked .title { font-weight: 700; } .like, .remove { border: 0; background: none; font-size: 18px; cursor: pointer; } .like { color: #d6336c; } .remove { color: #889; }',
        hints: [
          'Like: `map` gives a new array. Return a new object for the song you change and the same object for the others: `songs.map(s => (s.id === id ? { ...s, liked: !s.liked } : s))`.',
          'Remove: `songs.filter(s => s.id !== id)` keeps every song but that one.',
          'Sort: `sort` sorts in place, so copy first: `[...songs].sort((a, b) => a.title.localeCompare(b.title))`.'
        ],
        checks: [
          { label: 'Liking "Kesariya" marks it, and only it', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.playlist li')[1].querySelector('.like'));
  var lis = doc.querySelectorAll('.playlist li');
  if (!lis[1].classList.contains('liked')) return 'its <li> has no class liked';
  if (lis[1].querySelector('.like').getAttribute('aria-pressed') !== 'true') return 'its aria-pressed is ' + lis[1].querySelector('.like').getAttribute('aria-pressed');
  var liked = doc.querySelectorAll('.playlist li.liked').length;
  return liked === 1 || liked + ' songs are liked';
}` },
          { label: 'Removing "Tum Hi Ho" leaves the other three in order, Kesariya still liked', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.playlist li')[0].querySelector('.remove'));
  var titles = [].map.call(doc.querySelectorAll('.playlist .title'), function (s) { return s.textContent; }).join(', ');
  if (titles !== 'Kesariya, Apna Bana Le, Chaiyya Chaiyya') return 'the list is: ' + titles;
  return doc.querySelectorAll('.playlist li')[0].classList.contains('liked') || 'Kesariya is no longer liked';
}` },
          { label: 'Sort A–Z puts them in order by title, Kesariya still liked', fn: `async function (doc, win, t) {
  await t.click('.sort');
  var titles = [].map.call(doc.querySelectorAll('.playlist .title'), function (s) { return s.textContent; }).join(', ');
  if (titles !== 'Apna Bana Le, Chaiyya Chaiyya, Kesariya') return 'the list is: ' + titles;
  return doc.querySelectorAll('.playlist li')[2].classList.contains('liked') || 'Kesariya is no longer liked';
}` },
          { label: 'Nothing changes `songs` in place (no push, splice, sort on it, no `.liked =`)', fn: `function (doc, win, t) {
  var src = t.source();
  var m = /songs\\s*\\.\\s*(push|splice|sort|reverse|pop|shift|unshift)\\s*\\(/.exec(src);
  if (m) return 'the code still calls songs.' + m[1] + '()';
  return !/\\.liked\\s*=[^=]/.test(src) || 'the code still assigns .liked =';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'r-forms', track: 'state',
      title: 'Controlled inputs and forms',
      summary: 'A controlled input shows a state value (value) and reports every keystroke (onChange), so React always knows what is typed: check it as you type, tidy it, enable Submit only when it is valid. An uncontrolled input keeps its own value, read on submit.',
      keywords: ['form', 'forms', 'input', 'controlled', 'uncontrolled', 'controlled input', 'value', 'onChange', 'onSubmit', 'checkbox', 'checked', 'select', 'textarea', 'defaultValue', 'FormData', 'validation', 'preventDefault', 'react hook form', 'submit', 'useId', 'label', 'htmlFor'],
      docs: 'https://react.dev/reference/react-dom/components/input', uilt: 'js-forms',
      body: [
        'In HTML an input keeps its own value: you type, it changes, and your code reads `input.value` when it needs it. In React you usually **control** it instead: the value lives in state, the input shows it, and every keystroke goes through your code.',
        jsx("const [name, setName] = useState('');",
            '',
            '<input value={name} onChange={e => setName(e.target.value)} />'),
        '`value={name}` says "show what is in state". `onChange` runs on **every keystroke** (React\'s `onChange` is the DOM\'s `input` event, not its `change`), and setting the state draws the input again with the new value. Without an `onChange` the input is read-only: React keeps putting the value back, and warns in the console.',
        '## Why control it',
        '- **Check as you type:** show "too short" while the password is too short.',
        '- **Tidy what is typed:** `setPin(e.target.value.replace(/\\D/g, \'\'))` keeps only the digits.',
        '- **Drive other parts of the page:** a search box filters a list as you type.',
        '- **Enable Submit only when the form is valid.**',
        '## Every kind of field',
        '| Field | It shows | Read in onChange |\n|---|---|---|\n' +
        '| `<input>`, `<textarea>` | `value={text}` | `e.target.value` |\n' +
        '| `<input type="checkbox">` | `checked={agreed}` | `e.target.checked` |\n' +
        '| `<select>` | `value={city}` on the `<select>` | `e.target.value` |\n' +
        '| `<input type="number">` | `value={qty}` | `Number(e.target.value)`: it is always a string |',
        '## One state object for a whole form',
        'With several fields, keep one object and one handler, as in [[lesson:r-state-objects]]. Each input\'s `name` matches its field:',
        jsx("const [form, setForm] = useState({ email: '', password: '', remember: false });",
            '',
            'function handleChange(e) {',
            '  const { name, type, value, checked } = e.target;',
            "  setForm({ ...form, [name]: type === 'checkbox' ? checked : value });",
            '}'),
        '## Submitting',
        'Put `onSubmit` on the `<form>`, not `onClick` on the button: it also runs when you press Enter in a field. Call `e.preventDefault()` first, or the browser reloads the page. (The previews here never navigate away, but a real app would.)',
        jsx('<form onSubmit={e => { e.preventDefault(); save(form); }}>',
            '  …',
            '  <button type="submit" disabled={!form.email}>Sign in</button>',
            '</form>'),
        '## Validity is worked out, not stored',
        'Whether the form is valid follows from what is typed, so compute it on every render instead of keeping it in state:',
        js("const tooShort = form.password.length < 8;",
           "const canSubmit = form.email.includes('@') && !tooShort;"),
        '## Uncontrolled inputs',
        '`defaultValue` (or `defaultChecked`) sets the starting value and then leaves the input to the browser. Read every field when the form is submitted, with `FormData`, exactly as in plain JavaScript:',
        jsx('function handleSubmit(e) {',
            '  e.preventDefault();',
            '  const data = Object.fromEntries(new FormData(e.target));   // { email: …, password: … }',
            '}',
            '',
            '<input name="email" defaultValue="" />'),
        '| | Controlled | Uncontrolled |\n|---|---|---|\n' +
        '| Where the value lives | React state | The DOM element |\n' +
        '| How you read it | From state, at any time | On submit (`FormData`), or with a ref |\n' +
        '| Code | `value={x} onChange={…}` | `defaultValue="x"` |\n' +
        '| Good for | Checks as you type, formatting, dependent fields | Simple forms, file inputs, non-React code |',
        '## Labels and ids: useId',
        'A label names its input by id, `<label htmlFor="email">` and `<input id="email">`. A component used twice on one page would repeat that id, and the second label would point at the first input. Let React make the id: `const id = useId();`, then `<label htmlFor={id}>` and `<input id={id} />`. Every copy of the component gets its own.',
        'Start controlled state with a real value, `useState(\'\')`, never `useState()`: an input whose `value` goes from `undefined` to text switches from uncontrolled to controlled, and React warns.',
        'Bigger forms use **React Hook Form**, which keeps inputs uncontrolled for speed and validates with a schema (Zod). React 19 adds `<form action={fn}>`, which hands your function the `FormData`: [[lesson:r-actions]]. The interview questions are [[q:controlled-uncontrolled]] and [[q:forms]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript an input is uncontrolled: `form.addEventListener("submit", e => { e.preventDefault(); const email = form.elements.email.value; })`, and to react to typing you add an `input` listener. A controlled input turns that around: the value lives in your state, and the input only shows it. Two names to relearn: React\'s `onChange` fires on every keystroke, like the DOM\'s `input` event (the DOM\'s own `change` waits until the field loses focus), and a checkbox is read through `e.target.checked`, not `value`.',
      example: {
        code: `import { useState } from 'react';

export default function App() {
  const [form, setForm] = useState({ name: '', city: 'Pune', newsletter: true });
  const [sent, setSent] = useState(null);

  function handleChange(e) {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSent(form);
  }

  const nameOk = form.name.trim().length >= 2;

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Name
        <input name="name" value={form.name} onChange={handleChange} placeholder="At least 2 letters" />
      </label>
      {!nameOk && form.name !== '' && <p className="err">A name has at least 2 letters.</p>}
      <label>
        City
        <select name="city" value={form.city} onChange={handleChange}>
          <option>Pune</option>
          <option>Chennai</option>
          <option>Kochi</option>
        </select>
      </label>
      <label className="check">
        <input type="checkbox" name="newsletter" checked={form.newsletter} onChange={handleChange} /> Send me the newsletter
      </label>
      <button type="submit" disabled={!nameOk}>Sign up</button>
      <pre>state: {JSON.stringify(form)}</pre>
      {sent && <p className="ok">Signed up: {sent.name} from {sent.city}</p>}
    </form>
  );
}
`,
        css: '.form { display: grid; gap: 8px; max-width: 320px; } .form label { display: grid; gap: 2px; font-size: 14px; } .form .check { display: flex; gap: 6px; align-items: center; } .err { color: #c33; margin: 0; font-size: 13px; } .ok { color: #1f7a43; margin: 0; } pre { margin: 0; font-size: 12px; background: #f4f6f9; padding: 6px; border-radius: 6px; white-space: pre-wrap; }',
        note: 'Type a name and watch the state line follow every keystroke. Sign up stays disabled until the name has 2 letters.'
      },
      challenge: {
        title: 'A sign-up form that checks itself',
        task: 'The markup is there; give it its logic. Make every field controlled, from one `form` object in state:\n\n' +
          '- `<p className="match">` says `Passwords match` or `Passwords do not match` once something is typed in **Confirm**, and stays empty while Confirm is empty.\n' +
          '- **Create account** is disabled until the email contains `@`, the password has 8 or more characters, the two passwords match and the terms box is ticked.\n' +
          '- Submitting shows `<p className="done">Welcome, </p>` followed by the email, for example `Welcome, asha@example.com`.\n\n' +
          'Work out on each render whether the form is valid: do not keep that in state.',
        starter: `import { useState } from 'react';

export default function SignUp() {
  const [done, setDone] = useState('');

  return (
    <form className="signup">
      <label>Email <input name="email" /></label>
      <label>Password <input name="password" type="password" /></label>
      <label>Confirm <input name="confirm" type="password" /></label>
      <label><input name="terms" type="checkbox" /> I accept the terms</label>
      <p className="match"></p>
      <button type="submit">Create account</button>
      {done && <p className="done">Welcome, {done}</p>}
    </form>
  );
}
`,
        solution: `import { useState } from 'react';

export default function SignUp() {
  const [form, setForm] = useState({ email: '', password: '', confirm: '', terms: false });
  const [done, setDone] = useState('');

  function handleChange(e) {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setDone(form.email);
  }

  const matches = form.password === form.confirm;
  const valid = form.email.includes('@') && form.password.length >= 8 && matches && form.terms;

  return (
    <form className="signup" onSubmit={handleSubmit}>
      <label>Email <input name="email" value={form.email} onChange={handleChange} /></label>
      <label>Password <input name="password" type="password" value={form.password} onChange={handleChange} /></label>
      <label>Confirm <input name="confirm" type="password" value={form.confirm} onChange={handleChange} /></label>
      <label><input name="terms" type="checkbox" checked={form.terms} onChange={handleChange} /> I accept the terms</label>
      <p className="match">{form.confirm && (matches ? 'Passwords match' : 'Passwords do not match')}</p>
      <button type="submit" disabled={!valid}>Create account</button>
      {done && <p className="done">Welcome, {done}</p>}
    </form>
  );
}
`,
        css: '.signup { display: grid; gap: 6px; max-width: 320px; } .signup label { display: flex; justify-content: space-between; gap: 8px; align-items: center; } .match { margin: 0; min-height: 1.3em; font-size: 13px; color: #556; } .done { color: #1f7a43; margin: 0; }',
        hints: [
          'One object holds every field: `useState({ email: \'\', password: \'\', confirm: \'\', terms: false })`. Each input gets `value={form.email}` (the checkbox `checked={form.terms}`) and `onChange={handleChange}`.',
          'One handler serves them all through the input\'s `name`: `const { name, type, value, checked } = e.target;` then `setForm({ ...form, [name]: type === \'checkbox\' ? checked : value });`.',
          'Validity is worked out each render: `const valid = form.email.includes(\'@\') && form.password.length >= 8 && form.password === form.confirm && form.terms;`, then `disabled={!valid}`. Submit through `onSubmit` on the form, with `e.preventDefault()` first.'
        ],
        checks: [
          { label: 'At the start, Create account is disabled, and nothing is said about the passwords', fn: `function (doc, win, t) {
  var b = doc.querySelector('button[type="submit"]');
  if (!b) return 'no submit button';
  if (!b.disabled) return 'it is enabled with nothing typed';
  return !t.text('.match') || 'with Confirm empty, .match already says "' + t.text('.match') + '"';
}` },
          { label: 'Two different passwords: "Passwords do not match", still disabled', fn: `async function (doc, win, t) {
  await t.type('input[name="email"]', 'asha@example.com');
  await t.type('input[name="password"]', 'secret123');
  await t.type('input[name="confirm"]', 'secret12');
  if (t.text('.match') !== 'Passwords do not match') return '.match says "' + t.text('.match') + '"';
  return doc.querySelector('button[type="submit"]').disabled || 'it is enabled';
}` },
          { label: 'The same password twice: "Passwords match", disabled until the terms are ticked', fn: `async function (doc, win, t) {
  await t.type('input[name="confirm"]', 'secret123');
  if (t.text('.match') !== 'Passwords match') return '.match says "' + t.text('.match') + '"';
  return doc.querySelector('button[type="submit"]').disabled || 'it is enabled before the terms are ticked';
}` },
          { label: 'Ticking the terms enables it', fn: `async function (doc, win, t) {
  await t.click('input[name="terms"]');
  return !doc.querySelector('button[type="submit"]').disabled || 'it is still disabled';
}` },
          { label: 'A password under 8 characters disables it again', fn: `async function (doc, win, t) {
  await t.type('input[name="password"]', 'short');
  await t.type('input[name="confirm"]', 'short');
  if (!doc.querySelector('button[type="submit"]').disabled) return 'it is enabled with a 5-character password';
  await t.type('input[name="password"]', 'secret123');
  await t.type('input[name="confirm"]', 'secret123');
  return !doc.querySelector('button[type="submit"]').disabled || 'with the long password back, it stays disabled';
}` },
          { label: 'Submitting says "Welcome, asha@example.com", without the browser loading a new page', fn: `async function (doc, win, t) {
  var prevented = null;
  function spy(e) { prevented = e.defaultPrevented; }   // React has handled the submit by the time it reaches <body>
  doc.body.addEventListener('submit', spy);
  await t.submit('form');
  doc.body.removeEventListener('submit', spy);
  if (prevented === false) return 'onSubmit does not call e.preventDefault(): a real browser would load a new page';
  return t.text('.done') === 'Welcome, asha@example.com' || (doc.querySelector('.done') ? '.done says "' + t.text('.done') + '"' : 'no .done paragraph after submitting');
}` },
          { label: 'Every field is controlled (`value={…}`, and `checked={…}` for the box)', fn: `function (doc, win, t) {
  var src = t.source();
  var values = (src.match(/value=\\{/g) || []).length;
  if (values < 3) return 'value={…} appears ' + values + ' times';
  return /checked=\\{/.test(src) || 'the checkbox has no checked={…}';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'r-lifting-state', track: 'state',
      title: 'Lifting state up',
      summary: 'When two components need the same state, move it up to their closest common parent and pass it down: the value as a prop, and a function to change it. One owner for every value, and what can be worked out is computed, not stored.',
      keywords: ['lifting state up', 'lift state', 'shared state', 'siblings', 'common parent', 'single source of truth', 'controlled component', 'uncontrolled component', 'callback prop', 'derived state', 'duplicate state', 'prop drilling', 'onChange prop'],
      docs: 'https://react.dev/learn/sharing-state-between-components',
      body: [
        'State belongs to the component that declares it. Two components that each call `useState` hold two separate values, which can disagree. When siblings must show the same thing, **lift** the state up to their closest common parent.',
        '## Before: two panels, two states',
        jsx('function Panel({ title, children }) {',
            '  const [isOpen, setIsOpen] = useState(false);',
            '  return (',
            '    <section>',
            '      <h3>{title}</h3>',
            '      {isOpen ? <p>{children}</p> : <button onClick={() => setIsOpen(true)}>Show</button>}',
            '    </section>',
            '  );',
            '}'),
        'Each panel opens on its own, and nothing can say "only one open at a time": no component knows about both.',
        '## After: the parent owns it',
        jsx('function Panel({ title, isActive, onShow, children }) {',
            '  return (',
            '    <section>',
            '      <h3>{title}</h3>',
            '      {isActive ? <p>{children}</p> : <button onClick={onShow}>Show</button>}',
            '    </section>',
            '  );',
            '}',
            '',
            'export default function Accordion() {',
            '  const [activeIndex, setActiveIndex] = useState(0);',
            '  return (',
            '    <>',
            '      <Panel title="About" isActive={activeIndex === 0} onShow={() => setActiveIndex(0)}>…</Panel>',
            '      <Panel title="Hours" isActive={activeIndex === 1} onShow={() => setActiveIndex(1)}>…</Panel>',
            '    </>',
            '  );',
            '}'),
        'The same three steps every time:',
        '1. Remove the state from the children.',
        '2. Declare it in their closest common parent.',
        '3. Pass the value down as a prop, and a function that changes it (`onShow`, `onChange`). Calling that function is how a child asks for a change.',
        '## Controlled and uncontrolled components',
        '`Panel` is now **controlled** by its parent: its props decide everything. A component with its own state is **uncontrolled** from outside: easier to drop in, but its parent cannot coordinate it. These are the words of [[lesson:r-forms]] again, with the same meaning: who holds the value.',
        '## One owner for every value',
        'Every piece of state has exactly one owner. Do not copy a prop into state (`useState(props.items)` ignores later changes of the prop), and do not store what you can work out. A cart\'s total comes from its items, on every render:',
        jsx('const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);   // ✅ worked out',
            'const [total, setTotal] = useState(0);                               // ❌ one more thing to keep in step'),
        '## How high?',
        'Only as high as the closest component that needs it. Lifting everything to the top makes each keystroke re-render the whole page, and you end up passing props through layers that never use them (prop drilling). When many distant components need the same value, context and state libraries take over: [[q:context]] and [[q:state-management]]. The interview question for this lesson is [[q:lifting-state]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript, two widgets that share a value usually share a variable, and you redraw both: `let filter = ""; input.oninput = e => { filter = e.target.value; renderList(); renderCount(); };`. Lifting state is the React version of that shared variable: it lives in the parent, the parent passes it to both children, and setting it redraws both, with no `renderCount()` to forget.',
      example: {
        code: `import { useState } from 'react';

const PRODUCTS = [
  { id: 1, name: 'Mango', stocked: true },
  { id: 2, name: 'Guava', stocked: false },
  { id: 3, name: 'Banana', stocked: true },
  { id: 4, name: 'Papaya', stocked: true }
];

function SearchBar({ query, onQueryChange, inStockOnly, onInStockOnlyChange }) {
  return (
    <div className="bar">
      <input value={query} onChange={e => onQueryChange(e.target.value)} placeholder="Search…" />
      <label>
        <input type="checkbox" checked={inStockOnly} onChange={e => onInStockOnlyChange(e.target.checked)} /> In stock only
      </label>
    </div>
  );
}

function ProductList({ products }) {
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const shown = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) && (!inStockOnly || p.stocked)
  );
  return (
    <>
      <SearchBar query={query} onQueryChange={setQuery} inStockOnly={inStockOnly} onInStockOnlyChange={setInStockOnly} />
      <p className="count">{shown.length} of {PRODUCTS.length} shown</p>
      <ProductList products={shown} />
    </>
  );
}
`,
        css: '.bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; } .count { color: #667; margin: 6px 0; } ul { margin: 0; padding-left: 20px; }',
        note: '`SearchBar` and `ProductList` are siblings, and neither owns the filter: `App` does. The list and the count are both worked out from it on every render.'
      },
      challenge: {
        title: 'A cart both sides can see',
        task: 'The Add buttons work, but only inside `ProductList`: `CartSummary` keeps a cart of its own, which stays empty. Lift the cart up to `Shop`:\n\n' +
          '- `Shop` holds the cart, an array of products, in state.\n' +
          '- `ProductList` gets an `onAdd` prop and calls it with the product.\n' +
          '- `CartSummary` gets the items as a prop and shows how many (`.cart-count`) and their total (`.cart-total`, for example `₹520`). Its **Clear** button empties the cart through an `onClear` prop.\n' +
          '- Work the total out from the items on every render: no state for it.',
        starter: `import { useState } from 'react';

const PRODUCTS = [
  { id: 'pen', name: 'Pen', price: 20 },
  { id: 'book', name: 'Notebook', price: 50 },
  { id: 'bag', name: 'Bag', price: 500 }
];

function ProductList() {
  const [cart, setCart] = useState([]);
  return (
    <ul className="products">
      {PRODUCTS.map(p => (
        <li key={p.id}>
          {p.name}, ₹{p.price} <button className="add" onClick={() => setCart([...cart, p])}>Add</button>
        </li>
      ))}
    </ul>
  );
}

function CartSummary() {
  const [items, setItems] = useState([]);
  return (
    <div className="summary">
      Items: <span className="cart-count">{items.length}</span>
      {' '}Total: <span className="cart-total">₹0</span>
      {' '}<button className="clear" onClick={() => setItems([])}>Clear</button>
    </div>
  );
}

export default function Shop() {
  return (
    <div>
      <ProductList />
      <CartSummary />
    </div>
  );
}
`,
        solution: `import { useState } from 'react';

const PRODUCTS = [
  { id: 'pen', name: 'Pen', price: 20 },
  { id: 'book', name: 'Notebook', price: 50 },
  { id: 'bag', name: 'Bag', price: 500 }
];

function ProductList({ onAdd }) {
  return (
    <ul className="products">
      {PRODUCTS.map(p => (
        <li key={p.id}>
          {p.name}, ₹{p.price} <button className="add" onClick={() => onAdd(p)}>Add</button>
        </li>
      ))}
    </ul>
  );
}

function CartSummary({ items, onClear }) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return (
    <div className="summary">
      Items: <span className="cart-count">{items.length}</span>
      {' '}Total: <span className="cart-total">₹{total}</span>
      {' '}<button className="clear" onClick={onClear}>Clear</button>
    </div>
  );
}

export default function Shop() {
  const [cart, setCart] = useState([]);
  return (
    <div>
      <ProductList onAdd={p => setCart([...cart, p])} />
      <CartSummary items={cart} onClear={() => setCart([])} />
    </div>
  );
}
`,
        css: '.products { padding-left: 20px; } .products li { margin: 4px 0; } .summary { padding: 8px 12px; border: 1px solid #ccd; border-radius: 8px; max-width: 320px; } .cart-count, .cart-total { font-weight: 700; }',
        hints: [
          'Move `const [cart, setCart] = useState([]);` from `ProductList` up into `Shop`, and delete the state in `CartSummary`.',
          'Pass down what each child needs: `<ProductList onAdd={p => setCart([...cart, p])} />` and `<CartSummary items={cart} onClear={() => setCart([])} />`. The children call those functions; only `Shop` sets the state.',
          'The total is derived: `const total = items.reduce((sum, item) => sum + item.price, 0);` inside `CartSummary`.'
        ],
        checks: [
          { label: 'It starts empty: 0 items, ₹0', fn: `function (doc, win, t) {
  return (t.text('.cart-count') === '0' && t.text('.cart-total') === '₹0') || 'it shows ' + t.text('.cart-count') + ' items, ' + t.text('.cart-total');
}` },
          { label: 'Adding a Pen and a Bag: 2 items, ₹520', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.add')[0]);
  await t.click(doc.querySelectorAll('.add')[2]);
  return (t.text('.cart-count') === '2' && t.text('.cart-total') === '₹520') || 'it shows ' + t.text('.cart-count') + ' items, ' + t.text('.cart-total');
}` },
          { label: 'Another Pen: 3 items, ₹540', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.add')[0]);
  return (t.text('.cart-count') === '3' && t.text('.cart-total') === '₹540') || 'it shows ' + t.text('.cart-count') + ' items, ' + t.text('.cart-total');
}` },
          { label: 'Clear empties it: 0 items, ₹0', fn: `async function (doc, win, t) {
  await t.click('.clear');
  return (t.text('.cart-count') === '0' && t.text('.cart-total') === '₹0') || 'it shows ' + t.text('.cart-count') + ' items, ' + t.text('.cart-total');
}` },
          { label: 'The cart lives in `Shop`: `ProductList` and `CartSummary` keep no state, and the total is not state', fn: `function (doc, win, t) {
  var src = t.source();
  function body(name) {
    var i = src.indexOf('function ' + name);
    if (i < 0) return '';
    var rest = src.slice(i + 1), j = rest.search(/\\n(export |function |const |let )/);
    return j < 0 ? rest : rest.slice(0, j);
  }
  if (/useState/.test(body('CartSummary'))) return 'CartSummary still has state of its own';
  if (/useState/.test(body('ProductList'))) return 'ProductList still has state of its own';
  if (!/useState/.test(body('Shop'))) return 'Shop holds no state';
  return !/\\[\\s*total\\s*,/.test(src) || 'the total is kept in state: work it out from the items';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'r-use-reducer', track: 'state',
      title: 'useReducer: state changed by actions',
      summary: 'When many event handlers change the same state in different ways, gather the logic in one reducer function: handlers dispatch actions that say what happened, and the reducer returns the next state.',
      keywords: ['useReducer', 'reducer', 'dispatch', 'action', 'action type', 'switch', 'redux', 'state logic', 'pure function', 'complex state', 'useState vs useReducer'],
      docs: 'https://react.dev/learn/extracting-state-logic-into-a-reducer',
      body: [
        'A component with a list and five handlers (add, edit, toggle, delete, clear) has its update logic spread over all five. `useReducer` gathers it into one function, outside the component:',
        jsx('function tasksReducer(tasks, action) {',
            '  switch (action.type) {',
            "    case 'added':",
            '      return [...tasks, { id: action.id, text: action.text, done: false }];',
            "    case 'toggled':",
            '      return tasks.map(t => (t.id === action.id ? { ...t, done: !t.done } : t));',
            "    case 'deleted':",
            '      return tasks.filter(t => t.id !== action.id);',
            '    default:',
            "      throw new Error('Unknown action: ' + action.type);",
            '  }',
            '}'),
        'The component then only says **what happened**:',
        jsx('const [tasks, dispatch] = useReducer(tasksReducer, []);',
            '',
            "<button onClick={() => dispatch({ type: 'deleted', id: task.id })}>Delete</button>"),
        '## How it works',
        '`useReducer(reducer, initialState)` returns the state and a `dispatch` function. `dispatch(action)` queues the action; during the next render React calls `reducer(state, action)`, and what it returns becomes the state. An **action** is a plain object. By convention its `type` says what happened (`\'added\'`, not `\'setTasks\'`), and it carries whatever data that needs.',
        '## The reducer is pure',
        'Given the same state and action it returns the same result, and it does nothing else: no fetching, no timers, no changing the old state. Return new objects and arrays, as in [[lesson:r-state-arrays]]. A pure function can be tested with no React at all: `tasksReducer([], { type: \'added\', id: 1, text: \'Tea\' })` must give one task.',
        '## useState or useReducer?',
        '| | `useState` | `useReducer` |\n|---|---|---|\n' +
        '| Good for | Independent values: a flag, a text | Values that change together, many kinds of change |\n' +
        '| The update logic | In each handler | In one function |\n' +
        '| Testing | Through the component | The reducer alone, as a plain function |\n' +
        '| Code | Less | More, but organised |',
        'Both are fine, and one component can use both. `useReducer` is also the idea behind **Redux**: one store, actions and reducers. Redux, Zustand and when to use which are in [[q:state-management]].'
      ].join('\n\n'),
      plainjs: 'A reducer is ordinary JavaScript. `[1, 2, 3].reduce((sum, n) => sum + n, 0)` folds a list of values into one result; a React reducer folds a list of actions into the current state, as `actions.reduce(reducer, initialState)` would. In plain JavaScript the same pattern is one `update(state, event)` function with a `switch`, which every listener calls before `render()`.',
      example: {
        code: `import { useReducer } from 'react';

const initialCart = [
  { id: 'tea', name: 'Masala tea', price: 30, qty: 1 },
  { id: 'samosa', name: 'Samosa', price: 20, qty: 2 }
];

function cartReducer(cart, action) {
  switch (action.type) {
    case 'incremented':
      return cart.map(i => (i.id === action.id ? { ...i, qty: i.qty + 1 } : i));
    case 'decremented':
      return cart
        .map(i => (i.id === action.id ? { ...i, qty: i.qty - 1 } : i))
        .filter(i => i.qty > 0);
    case 'cleared':
      return [];
    default:
      throw new Error('Unknown action: ' + action.type);
  }
}

export default function App() {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  return (
    <div className="cart">
      {cart.map(i => (
        <div key={i.id} className="line">
          <span>{i.name}</span>
          <button onClick={() => dispatch({ type: 'decremented', id: i.id })}>−</button>
          <b>{i.qty}</b>
          <button onClick={() => dispatch({ type: 'incremented', id: i.id })}>+</button>
        </div>
      ))}
      <p>Total: ₹{total}</p>
      <button onClick={() => dispatch({ type: 'cleared' })}>Clear</button>
    </div>
  );
}
`,
        css: '.cart { max-width: 300px; } .line { display: flex; gap: 8px; align-items: center; margin: 4px 0; } .line span { flex: 1; } .line b { min-width: 1.5ch; text-align: center; }',
        note: 'Every button dispatches an action; all the update logic sits in `cartReducer`, which you could test with no React at all.'
      },
      challenge: {
        title: 'A counter with a step, as a reducer',
        task: 'The buttons and the Step input already dispatch actions, but the reducer handles only `incremented`. Finish it:\n\n' +
          '- `decremented` takes the step away (the count may go below 0).\n' +
          '- `stepChanged` sets the step to `action.step`.\n' +
          '- `reset` puts both back: count 0, step 1.\n' +
          '- An unknown action **throws** an `Error`, instead of being ignored without a word.',
        starter: `import { useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'incremented':
      return { ...state, count: state.count + state.step };
    default:
      return state;
  }
}

export default function StepCounter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 });
  return (
    <div className="stepper">
      <output className="count">{state.count}</output>
      <button className="dec" onClick={() => dispatch({ type: 'decremented' })}>−</button>
      <button className="inc" onClick={() => dispatch({ type: 'incremented' })}>+</button>
      <label>
        Step{' '}
        <input
          className="step"
          type="number"
          value={state.step}
          onChange={e => dispatch({ type: 'stepChanged', step: Number(e.target.value) })}
        />
      </label>
      <button className="reset" onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
}
`,
        solution: `import { useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'incremented':
      return { ...state, count: state.count + state.step };
    case 'decremented':
      return { ...state, count: state.count - state.step };
    case 'stepChanged':
      return { ...state, step: action.step };
    case 'reset':
      return { count: 0, step: 1 };
    default:
      throw new Error('Unknown action: ' + action.type);
  }
}

export default function StepCounter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 });
  return (
    <div className="stepper">
      <output className="count">{state.count}</output>
      <button className="dec" onClick={() => dispatch({ type: 'decremented' })}>−</button>
      <button className="inc" onClick={() => dispatch({ type: 'incremented' })}>+</button>
      <label>
        Step{' '}
        <input
          className="step"
          type="number"
          value={state.step}
          onChange={e => dispatch({ type: 'stepChanged', step: Number(e.target.value) })}
        />
      </label>
      <button className="reset" onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
}
`,
        css: '.stepper { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; } .count { font-size: 32px; font-weight: 700; min-width: 3ch; text-align: center; } .step { width: 60px; }',
        hints: [
          'Each `case` returns a **new** state object: `case \'decremented\': return { ...state, count: state.count - state.step };`.',
          '`stepChanged` carries its data in the action: `return { ...state, step: action.step };`. `reset` returns a fresh object, `{ count: 0, step: 1 }`.',
          'End the `switch` with `default: throw new Error(\'Unknown action: \' + action.type);` so that a misspelt type shows up at once.'
        ],
        checks: [
          { label: 'It starts at 0, with a step of 1', fn: `function (doc, win, t) {
  var step = doc.querySelector('.step');
  return (t.text('.count') === '0' && step && step.value === '1') || 'it shows ' + t.text('.count') + ' with a step of ' + (step && step.value);
}` },
          { label: '+ twice shows 2', fn: `async function (doc, win, t) {
  await t.click('.inc');
  await t.click('.inc');
  return t.text('.count') === '2' || 'it shows ' + t.text('.count');
}` },
          { label: 'With a step of 5: + gives 7, then − gives 2 and −3', fn: `async function (doc, win, t) {
  await t.type('.step', '5');
  if (doc.querySelector('.step').value !== '5') return 'the step input shows ' + doc.querySelector('.step').value;
  await t.click('.inc');
  if (t.text('.count') !== '7') return 'after + it shows ' + t.text('.count');
  await t.click('.dec');
  if (t.text('.count') !== '2') return 'after − it shows ' + t.text('.count');
  await t.click('.dec');
  return t.text('.count') === '-3' || 'after a second − it shows ' + t.text('.count');
}` },
          { label: 'Reset goes back to 0 with a step of 1', fn: `async function (doc, win, t) {
  await t.click('.reset');
  var step = doc.querySelector('.step').value;
  return (t.text('.count') === '0' && step === '1') || 'it shows ' + t.text('.count') + ' with a step of ' + step;
}` },
          { label: 'It uses `useReducer`, and an unknown action throws', fn: `function (doc, win, t) {
  var src = t.source();
  if (!/useReducer\\s*\\(/.test(src)) return 'useReducer is never called';
  return /default\\s*:[\\s\\S]*?throw\\s+new\\s+Error/.test(src) || 'the default case does not throw an Error';
}` }
        ]
      }
    }
  );
})(window.RLT);
