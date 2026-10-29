/*
 * Machine coding, track 2 (State and forms): Todo list, OTP input, Nested checkboxes, each the React
 * version of its plain-JS page in java-interview-practice/AAScratches/11-UI-Practice/01-Components.
 * The problem shape is described at the top of data/builds.js.
 */
(function (U) {
  var B = U.data.builds = U.data.builds || [];

  B.push(
    {
      id: 'todo-list', track: 'state', level: 'Medium', minutes: 30, plainjs: 'B01_TodoList.html',
      title: 'Todo list',
      summary: 'Add with Enter or the button, tick to mark done, × to delete, and "N left". The most-asked machine-coding round of all.',
      keywords: ['todo', 'todo list', 'todos', 'add', 'delete', 'checkbox', 'form', 'list', 'filter', 'map', 'controlled input'],
      task: 'Build a todo list.\n\n' +
        '- Typing a task and pressing **Enter** (or **Add**) adds it at the end, and empties the input. A blank or spaces-only task adds nothing, and the text is trimmed.\n' +
        '- Each task has a checkbox: ticking it marks the task done.\n' +
        '- Each task has a **×** button that deletes it.\n' +
        '- Under the list, `N left` counts the tasks not done.\n\n' +
        'For the checks: a `<form className="add-form">` holds an `<input className="new-todo">` and the Add button. The tasks are `<li>` elements in a `<ul className="todo-list">`, a done one with the class `done`; inside each, an `<input type="checkbox">`, the text in a `<span className="text">` and a `<button className="del">`. The count is in `<p className="left">`.',
      starter: `import { useState } from 'react';

export default function TodoList() {
  return (
    <div className="todos">
      <form className="add-form">
        <input className="new-todo" placeholder="What needs doing?" />
        <button>Add</button>
      </form>
      <ul className="todo-list"></ul>
      <p className="left">0 left</p>
    </div>
  );
}
`,
      solution: `import { useState } from 'react';

let nextId = 1;

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const left = todos.filter(t => !t.done).length;

  function handleSubmit(e) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    setTodos([...todos, { id: nextId++, text: clean, done: false }]);
    setText('');
  }

  function toggle(id) {
    setTodos(todos.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function remove(id) {
    setTodos(todos.filter(t => t.id !== id));
  }

  return (
    <div className="todos">
      <form className="add-form" onSubmit={handleSubmit}>
        <input className="new-todo" placeholder="What needs doing?" value={text} onChange={e => setText(e.target.value)} />
        <button>Add</button>
      </form>
      <ul className="todo-list">
        {todos.map(t => (
          <li key={t.id} className={t.done ? 'done' : ''}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <span className="text">{t.text}</span>
            </label>
            <button className="del" aria-label={'Delete ' + t.text} onClick={() => remove(t.id)}>×</button>
          </li>
        ))}
      </ul>
      <p className="left">{left} left</p>
    </div>
  );
}
`,
      css: '.todos { max-width: 380px; } .add-form { display: flex; gap: 8px; } .new-todo { flex: 1; padding: 6px 8px; } .todo-list { list-style: none; padding: 0; } .todo-list li { display: flex; align-items: center; gap: 8px; padding: 6px 0; } .todo-list li + li { border-top: 1px solid #ddd; } .todo-list label { flex: 1; display: flex; gap: 8px; align-items: center; } .todo-list li.done .text { text-decoration: line-through; color: #888; } .del { border: 0; background: none; color: #c33; font-size: 18px; cursor: pointer; }',
      hints: [
        'Two pieces of state: `todos`, an array of `{ id, text, done }`, and `text`, what is typed (a controlled input). "N left" is worked out: `todos.filter(t => !t.done).length`.',
        'Add in the form\'s `onSubmit`, so Enter works too: `e.preventDefault()`, trim the text, return if it is empty, then `setTodos([...todos, { id: nextId++, text: clean, done: false }])` and `setText(\'\')`.',
        'Toggle with `map` and a spread, delete with `filter`, and key each `<li>` by `todo.id`: never the index, or a tick stays on the wrong row after a delete.'
      ],
      checks: [
        { label: 'It starts with no tasks and "0 left"', fn: `function (doc, win, t) {
  if (!doc.querySelector('form.add-form .new-todo')) return 'no form.add-form with an input.new-todo';
  if (t.count('.todo-list li')) return t.count('.todo-list li') + ' tasks at the start';
  return t.text('.left') === '0 left' || '.left says "' + t.text('.left') + '"';
}` },
        { label: 'Adding "Buy milk" and "Write tests": both listed, "2 left", the input emptied, no page load', fn: `async function (doc, win, t) {
  var prevented = null;
  function spy(e) { prevented = e.defaultPrevented; }   // React has handled the submit by the time it reaches <body>
  doc.body.addEventListener('submit', spy);
  await t.type('.new-todo', 'Buy milk');
  await t.submit('.add-form');
  doc.body.removeEventListener('submit', spy);
  if (prevented === false) return 'onSubmit does not call e.preventDefault(): a real browser would load a new page';
  await t.type('.new-todo', '  Write tests ');
  await t.submit('.add-form');
  var items = [].map.call(doc.querySelectorAll('.todo-list .text'), function (s) { return s.textContent; }).join(' / ');
  if (items !== 'Buy milk / Write tests') return 'the list is: ' + (items || 'empty');
  if (t.text('.left') !== '2 left') return '.left says "' + t.text('.left') + '"';
  return doc.querySelector('.new-todo').value === '' || 'the input still holds "' + doc.querySelector('.new-todo').value + '"';
}` },
        { label: 'A blank task adds nothing', fn: `async function (doc, win, t) {
  await t.type('.new-todo', '   ');
  await t.submit('.add-form');
  return t.count('.todo-list li') === 2 || 'there are ' + t.count('.todo-list li') + ' tasks now';
}` },
        { label: 'Ticking "Buy milk" marks it done: "1 left"', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.todo-list li')[0].querySelector('input[type="checkbox"]'));
  if (!doc.querySelectorAll('.todo-list li')[0].classList.contains('done')) return 'its <li> has no class done';
  if (doc.querySelectorAll('.todo-list li')[1].classList.contains('done')) return '"Write tests" is marked done too';
  return t.text('.left') === '1 left' || '.left says "' + t.text('.left') + '"';
}` },
        { label: 'Deleting "Buy milk" leaves "Write tests", not done, "1 left"', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.todo-list li')[0].querySelector('.del'));
  var items = [].map.call(doc.querySelectorAll('.todo-list .text'), function (s) { return s.textContent; }).join(' / ');
  if (items !== 'Write tests') return 'the list is: ' + (items || 'empty');
  var li = doc.querySelector('.todo-list li');
  if (li.classList.contains('done') || li.querySelector('input[type="checkbox"]').checked) return '"Write tests" now shows as done';
  return t.text('.left') === '1 left' || '.left says "' + t.text('.left') + '"';
}` },
        { label: 'The keys come from the tasks\' ids, not the index', fn: `function (doc, win, t) {
  var src = t.source();
  if (/key=\\{\\s*(i|idx|index)\\s*\\}/.test(src)) return 'the key is the index';
  return /key=\\{\\s*\\w+\\.id\\s*\\}/.test(src) || 'no key={….id} found';
}` }
      ],
      followups: [
        'Why must the key be the task\'s id? With `key={index}`, tick the first task and delete it: what does the next row show, and why?',
        'Add filters, All / Active / Done. Is the filtered list state? (No: keep the filter in state and work the list out from it.)',
        'Edit a task in place on double-click; Escape cancels, Enter saves.',
        'Move the update logic into a reducer: which actions, and what does each return?',
        'Keep the tasks across reloads: read localStorage in `useState(() => …)`, write it in an effect (the next track).',
        'A task named `<img src=x onerror=alert(1)>`: what does React show, and why is it safe?'
      ],
      learn: ['lesson:r-state-arrays', 'lesson:r-forms', 'lesson:r-lists-keys']
    },
    {
      id: 'otp-input', track: 'state', level: 'Medium', minutes: 35, plainjs: 'B03_OtpInput.html',
      title: 'OTP input',
      summary: 'Six one-digit boxes: typing moves on, letters are refused, Backspace in an empty box goes back, and a pasted code fills them all.',
      keywords: ['otp', 'one-time code', 'verification code', 'pin input', 'paste', 'onPaste', 'focus', 'backspace', 'onKeyDown', 'inputs'],
      task: 'Build a one-time-code input: six boxes, one digit each.\n\n' +
        '- Typing a digit fills the box and moves the focus to the next box.\n' +
        '- Anything that is not a digit is refused: the box stays as it was.\n' +
        '- **Backspace** in an empty box clears the box before it and moves the focus there.\n' +
        '- Pasting a code into any box fills the boxes from that one on, using only the digits of what was pasted, and moves the focus to the box after the last one filled (the sixth at most).\n' +
        '- When all six are filled, `<p className="status">` says `Code: 987654`; otherwise it is empty.\n\n' +
        'For the checks: the six `<input>` elements sit inside a `<div className="otp">` with nothing else in it. Moving the focus is a DOM action, not state: in the handler, `e.target.nextElementSibling.focus()` (or `previousElementSibling`).',
      starter: `import { useState } from 'react';

const LENGTH = 6;

export default function OtpInput() {
  const boxes = Array.from({ length: LENGTH }, (_, i) => i);
  return (
    <div>
      <label htmlFor="digit-0">Enter the 6-digit code we sent you</label>
      <div className="otp">
        {boxes.map(i => (
          <input key={i} id={'digit-' + i} aria-label={'Digit ' + (i + 1)} maxLength={1} inputMode="numeric" />
        ))}
      </div>
      <p className="status" aria-live="polite"></p>
    </div>
  );
}
`,
      solution: `import { useState } from 'react';

const LENGTH = 6;

export default function OtpInput() {
  const [digits, setDigits] = useState(Array(LENGTH).fill(''));
  const code = digits.join('');

  function handleChange(i, e) {
    const typed = e.target.value.slice(-1);
    if (typed && !/^\\d$/.test(typed)) return;            // refused: the box keeps its digit
    setDigits(digits.map((d, k) => (k === i ? typed : d)));
    if (typed && e.target.nextElementSibling) e.target.nextElementSibling.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key !== 'Backspace' || digits[i] || i === 0) return;
    e.preventDefault();
    setDigits(digits.map((d, k) => (k === i - 1 ? '' : d)));
    e.target.previousElementSibling.focus();
  }

  function handlePaste(i, e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\\D/g, '').slice(0, LENGTH - i);
    const next = [...digits];
    [...pasted].forEach((d, k) => {
      next[i + k] = d;
    });
    setDigits(next);
    e.target.parentElement.children[Math.min(LENGTH - 1, i + pasted.length)].focus();
  }

  return (
    <div>
      <label htmlFor="digit-0">Enter the 6-digit code we sent you</label>
      <div className="otp">
        {digits.map((d, i) => (
          <input
            key={i}
            id={'digit-' + i}
            aria-label={'Digit ' + (i + 1)}
            value={d}
            maxLength={1}
            inputMode="numeric"
            autoComplete="one-time-code"
            onChange={e => handleChange(i, e)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={e => handlePaste(i, e)}
          />
        ))}
      </div>
      <p className="status" aria-live="polite">{code.length === LENGTH ? 'Code: ' + code : ''}</p>
    </div>
  );
}
`,
      css: '.otp { display: flex; gap: 8px; margin-top: 6px; } .otp input { width: 40px; height: 48px; text-align: center; font-size: 24px; border: 1px solid #aaa; border-radius: 8px; } .otp input:focus { outline: 2px solid #087ea4; border-color: #087ea4; } .status { color: #555; min-height: 1.4em; }',
      hints: [
        'The state is the six digits: `useState(Array(6).fill(\'\'))`. Each box shows `value={digits[i]}`, and the status is worked out from `digits.join(\'\')`.',
        'In `onChange`, take the last character typed, `e.target.value.slice(-1)`. If it is not a digit, return without setting state: React puts the old value back. Otherwise replace that one digit (`digits.map((d, k) => k === i ? typed : d)`) and focus `e.target.nextElementSibling`.',
        '`onKeyDown` handles Backspace in an empty box (clear the previous digit, focus `previousElementSibling`, and `e.preventDefault()`); `onPaste` reads `e.clipboardData.getData(\'text\')`, keeps the digits with `.replace(/\\D/g, \'\')`, and calls `e.preventDefault()` so the browser does not paste one character into one box.'
      ],
      checks: [
        { label: 'Six empty boxes, and no status', fn: `function (doc, win, t) {
  var boxes = doc.querySelectorAll('.otp input');
  if (boxes.length !== 6) return 'found ' + boxes.length + ' inputs in .otp';
  if ([].some.call(boxes, function (b) { return b.value; })) return 'some boxes are not empty';
  return !t.text('.status') || 'the status says "' + t.text('.status') + '"';
}` },
        { label: 'Typing 4 then 2: "42", and the focus on the third box', fn: `async function (doc, win, t) {
  var boxes = doc.querySelectorAll('.otp input');
  await t.type(boxes[0], '4');
  if (doc.activeElement !== boxes[1]) return 'after the 4, the focus is on box ' + ([].indexOf.call(boxes, doc.activeElement) + 1);
  await t.type(boxes[1], '2');
  var shown = [].map.call(boxes, function (b) { return b.value || '_'; }).join('');
  if (shown !== '42____') return 'the boxes show ' + shown;
  return doc.activeElement === boxes[2] || 'after the 2, the focus is on box ' + ([].indexOf.call(boxes, doc.activeElement) + 1);
}` },
        { label: 'A letter is refused: still "42", the focus stays on the third box', fn: `async function (doc, win, t) {
  var boxes = doc.querySelectorAll('.otp input');
  await t.type(boxes[2], 'x');
  var shown = [].map.call(boxes, function (b) { return b.value || '_'; }).join('');
  if (shown !== '42____') return 'the boxes show ' + shown;
  return doc.activeElement === boxes[2] || 'the focus moved to box ' + ([].indexOf.call(boxes, doc.activeElement) + 1);
}` },
        { label: 'Backspace in the empty third box clears the second and goes back to it', fn: `async function (doc, win, t) {
  var boxes = doc.querySelectorAll('.otp input');
  await t.key(boxes[2], 'Backspace');
  var shown = [].map.call(boxes, function (b) { return b.value || '_'; }).join('');
  if (shown !== '4_____') return 'the boxes show ' + shown;
  return doc.activeElement === boxes[1] || 'the focus is on box ' + ([].indexOf.call(boxes, doc.activeElement) + 1);
}` },
        { label: 'Pasting "98-76 54" into the first box fills all six, focus on the last, "Code: 987654"', fn: `async function (doc, win, t) {
  var boxes = doc.querySelectorAll('.otp input');
  await t.paste(boxes[0], '98-76 54');
  var shown = [].map.call(boxes, function (b) { return b.value || '_'; }).join('');
  if (shown !== '987654') return 'the boxes show ' + shown;
  if (doc.activeElement !== boxes[5]) return 'the focus is on box ' + ([].indexOf.call(boxes, doc.activeElement) + 1);
  return t.text('.status') === 'Code: 987654' || 'the status says "' + t.text('.status') + '"';
}` },
        { label: 'Clearing the last box empties the status again', fn: `async function (doc, win, t) {
  var boxes = doc.querySelectorAll('.otp input');
  await t.type(boxes[5], '');
  if (boxes[5].value) return 'the last box still shows ' + boxes[5].value;
  return !t.text('.status') || 'the status still says "' + t.text('.status') + '"';
}` }
      ],
      followups: [
        'Why does a paste need its own handler? (With `maxLength={1}` the browser keeps one character of the pasted code.)',
        '`autoComplete="one-time-code"` and `inputMode="numeric"`: what does each do on a phone?',
        'Arrow Left / Right between the boxes, and selecting a box\'s digit on focus so typing replaces it.',
        'Do it with refs, `useRef([])`, instead of `nextElementSibling`. When is each better?',
        'One hidden input and six drawn boxes instead: why is that simpler for screen readers and for paste?',
        'Submit automatically when the six are filled, and disable the boxes while the code is checked.'
      ],
      learn: ['lesson:r-forms', 'lesson:r-state-arrays', 'lesson:r-events']
    },
    {
      id: 'nested-checkboxes', track: 'state', level: 'Medium', minutes: 35, plainjs: 'B04_NestedCheckboxes.html',
      title: 'Nested checkboxes',
      summary: 'A tree of checkboxes: a parent sets everything under it, and shows ticked, empty or a dash (indeterminate) from what its children are, at every level.',
      keywords: ['nested checkboxes', 'checkbox tree', 'indeterminate', 'tree', 'recursive component', 'select all', 'derived state', 'parent child checkbox'],
      task: 'Show the tree in `TREE` as nested lists of checkboxes.\n\n' +
        '- Ticking or unticking a box does the same to every box under it.\n' +
        '- A parent is ticked when all its children are ticked, empty when none are, and **indeterminate** (the dash) when only some are, at every level.\n\n' +
        'For the checks: each checkbox has its node\'s `id` as its `id` (`apple`, `leafy`…). React has no `indeterminate` prop, because HTML has no such attribute: it is a DOM property, set through a ref callback, `ref={el => { if (el) el.indeterminate = some; }}`.',
      starter: `import { useState } from 'react';

const TREE = [
  { id: 'fruits', label: 'Fruits', children: [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' }
  ] },
  { id: 'veg', label: 'Vegetables', children: [
    { id: 'carrot', label: 'Carrot' },
    { id: 'leafy', label: 'Leafy', children: [
      { id: 'spinach', label: 'Spinach' },
      { id: 'kale', label: 'Kale' }
    ] }
  ] }
];

function Node({ node }) {
  return (
    <li>
      <label>
        <input type="checkbox" id={node.id} /> {node.label}
      </label>
      {node.children && (
        <ul>
          {node.children.map(child => <Node key={child.id} node={child} />)}
        </ul>
      )}
    </li>
  );
}

export default function NestedCheckboxes() {
  return (
    <ul className="tree">
      {TREE.map(node => <Node key={node.id} node={node} />)}
    </ul>
  );
}
`,
      solution: `import { useState } from 'react';

const TREE = [
  { id: 'fruits', label: 'Fruits', children: [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' }
  ] },
  { id: 'veg', label: 'Vegetables', children: [
    { id: 'carrot', label: 'Carrot' },
    { id: 'leafy', label: 'Leafy', children: [
      { id: 'spinach', label: 'Spinach' },
      { id: 'kale', label: 'Kale' }
    ] }
  ] }
];

function leaves(node) {
  return node.children ? node.children.flatMap(leaves) : [node];
}

function Node({ node, checked, onSet }) {
  const ids = leaves(node).map(leaf => leaf.id);
  const on = ids.filter(id => checked[id]).length;
  const all = on === ids.length;
  const some = on > 0 && !all;
  return (
    <li>
      <label>
        <input
          type="checkbox"
          id={node.id}
          checked={all}
          ref={el => { if (el) el.indeterminate = some; }}
          onChange={e => onSet(ids, e.target.checked)}
        />{' '}
        {node.label}
      </label>
      {node.children && (
        <ul>
          {node.children.map(child => (
            <Node key={child.id} node={child} checked={checked} onSet={onSet} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function NestedCheckboxes() {
  const [checked, setChecked] = useState({});   // leaf id -> true; every parent is worked out

  function setLeaves(ids, value) {
    const next = { ...checked };
    ids.forEach(id => {
      next[id] = value;
    });
    setChecked(next);
  }

  return (
    <ul className="tree">
      {TREE.map(node => <Node key={node.id} node={node} checked={checked} onSet={setLeaves} />)}
    </ul>
  );
}
`,
      css: '.tree, .tree ul { list-style: none; padding-left: 22px; margin: 2px 0; } .tree { padding-left: 0; } .tree label { display: inline-flex; align-items: center; gap: 6px; padding: 2px 0; }',
      hints: [
        'Keep state for the **leaves** only, `{ apple: true, … }`, and work every parent out from its leaves on each render. Nothing can then go out of step, and "some but not all" is the indeterminate state.',
        'A small `leaves(node)` helper returns the leaf nodes under a node (itself, if it has no children). A box\'s change sets all of those leaves to `e.target.checked`.',
        'Make `Node` call itself for its children, and pass the state and the setter down. On each box: `checked={all}` and `ref={el => { if (el) el.indeterminate = some; }}`.'
      ],
      checks: [
        { label: 'Eight boxes, all empty, no dash', fn: `function (doc) {
  var boxes = doc.querySelectorAll('input[type="checkbox"]');
  if (boxes.length !== 8) return 'found ' + boxes.length + ' checkboxes';
  var bad = [].filter.call(boxes, function (b) { return b.checked || b.indeterminate; }).map(function (b) { return b.id; });
  return !bad.length || 'already ticked or dashed: ' + bad.join(', ');
}` },
        { label: 'Ticking Apple: Fruits shows the dash', fn: `async function (doc, win, t) {
  function st(id) { var b = doc.getElementById(id); return !b ? 'missing' : b.indeterminate ? 'some' : b.checked ? 'on' : 'off'; }
  await t.click('#apple');
  var s = [st('fruits'), st('apple'), st('banana')].join(' ');
  return s === 'some on off' || 'Fruits, Apple, Banana are: ' + s;
}` },
        { label: 'Ticking Banana too: Fruits is ticked', fn: `async function (doc, win, t) {
  function st(id) { var b = doc.getElementById(id); return !b ? 'missing' : b.indeterminate ? 'some' : b.checked ? 'on' : 'off'; }
  await t.click('#banana');
  return st('fruits') === 'on' || 'Fruits is ' + st('fruits');
}` },
        { label: 'Ticking Vegetables ticks everything under it, two levels down', fn: `async function (doc, win, t) {
  function st(id) { var b = doc.getElementById(id); return !b ? 'missing' : b.indeterminate ? 'some' : b.checked ? 'on' : 'off'; }
  await t.click('#veg');
  var s = ['carrot', 'leafy', 'spinach', 'kale'].map(st).join(' ');
  return s === 'on on on on' || 'Carrot, Leafy, Spinach, Kale are: ' + s;
}` },
        { label: 'Unticking Kale: Leafy and Vegetables both show the dash', fn: `async function (doc, win, t) {
  function st(id) { var b = doc.getElementById(id); return !b ? 'missing' : b.indeterminate ? 'some' : b.checked ? 'on' : 'off'; }
  await t.click('#kale');
  var s = [st('leafy'), st('veg'), st('kale')].join(' ');
  return s === 'some some off' || 'Leafy, Vegetables, Kale are: ' + s;
}` },
        { label: 'Ticking the dashed Leafy ticks it all again', fn: `async function (doc, win, t) {
  function st(id) { var b = doc.getElementById(id); return !b ? 'missing' : b.indeterminate ? 'some' : b.checked ? 'on' : 'off'; }
  await t.click('#leafy');
  var s = [st('leafy'), st('veg'), st('kale')].join(' ');
  return s === 'on on on' || 'Leafy, Vegetables, Kale are: ' + s;
}` },
        { label: 'Unticking Fruits empties Fruits, Apple and Banana', fn: `async function (doc, win, t) {
  function st(id) { var b = doc.getElementById(id); return !b ? 'missing' : b.indeterminate ? 'some' : b.checked ? 'on' : 'off'; }
  await t.click('#fruits');
  var s = [st('fruits'), st('apple'), st('banana')].join(' ');
  return s === 'off off off' || 'Fruits, Apple, Banana are: ' + s;
}` }
      ],
      followups: [
        'Why keep state for the leaves only? What goes wrong if every box keeps its own ticked flag?',
        'Add a "Select all" box at the top. Is it more state, or worked out like the others?',
        'Collapse and expand each group. Where does the open/closed state live, and why is it separate from the ticks?',
        'Thousands of nodes from a server: each click now walks the whole tree. How would you count ticked leaves per node once, and update only one path?',
        'Return the ticked leaf ids for a form submit.',
        'Accessibility: `role="tree"`, `role="treeitem"`, `aria-checked="mixed"` for the dash, and the arrow keys.'
      ],
      learn: ['lesson:r-lifting-state', 'lesson:r-state-objects', 'lesson:r-children']
    }
  );
})(window.RLT);
