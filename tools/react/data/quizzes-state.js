/*
 * Quizzes for track 2 (State and forms): three or more questions per lesson, keyed by lesson id.
 * The question shape is described at the top of data/quizzes-foundations.js; the choices are
 * shuffled every time, so never write "both of the above".
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};
  function jsx() { return '```jsx\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q['r-state-snapshot'] = [
    {
      q: 'What does the click log?\n\n' + jsx('const [count, setCount] = useState(5);', '', 'function handleClick() {', '  setCount(count + 1);', '  console.log(count);', '}'),
      choices: ['5', '6', '`undefined`'],
      answer: 0,
      why: '`count` is this render\'s value, a constant. `setCount` stores 6 for the next render and asks React for it; the line after it still runs in the old render, where `count` is 5.'
    },
    {
      q: 'The count is 0. One click runs `setCount(count + 1)` three times. What does the page show next?',
      choices: ['1', '3', '0'],
      answer: 0,
      why: 'All three calls read the same snapshot, so each one says "replace it with 1". React batches them and renders once, with 1.'
    },
    {
      q: 'The count is 0. One click runs `setCount(c => c + 1)` three times. What does the page show next?',
      choices: ['3', '1', '0'],
      answer: 0,
      why: 'An updater function is queued, and React calls each one with the result of the one before: 0 → 1 → 2 → 3.'
    },
    {
      q: 'The count is 0. A click runs `setCount(count + 5)` and then `setCount(c => c + 1)`. What does the page show next?',
      choices: ['6', '5', '1'],
      answer: 0,
      why: 'The queue holds "replace with 5", then "add 1 to whatever it is": 0 → 5 → 6.'
    },
    {
      q: 'A handler calls two different setters, `setName(\'Asha\')` and `setAge(30)`. How many times does React render?',
      choices: ['Once, after the handler has finished', 'Twice, once per setter call', 'Once, straight after the first setter call'],
      answer: 0,
      why: 'React **batches** the updates of one event: it waits until the handler has finished, then renders once with all of them. Since React 18 it does the same in timers and promises.'
    }
  ];

  Q['r-state-objects'] = [
    {
      q: 'Why does this not update the page?\n\n' + jsx('person.age = 31;', 'setPerson(person);'),
      choices: ['It is the same object, so React\'s `Object.is` comparison sees no change and skips the render', 'Objects cannot be kept in state', '`setPerson` only works inside `useEffect`'],
      answer: 0,
      why: 'React compares the new value with the old one by reference. The object changed inside, but it is still the same object, so React decides nothing changed. Make a new one: `setPerson({ ...person, age: 31 })`.'
    },
    {
      q: 'Which update changes only the city and keeps everything else?',
      choices: [
        "`setUser({ ...user, address: { ...user.address, city: 'Pune' } })`",
        "`setUser({ ...user, address: { city: 'Pune' } })`",
        "`setUser({ address: { city: 'Pune' } })`"
      ],
      answer: 0,
      why: 'Each level you change is copied: the outer spread keeps the user\'s other fields, the inner one keeps the address\'s other fields. The second loses the rest of the address; the third loses everything but the city.'
    },
    {
      q: 'What does `{ ...person }` copy?',
      choices: ['The top level only: objects nested inside are shared with the original', 'Every level, however deep', 'Nothing: it is another name for the same object'],
      answer: 0,
      why: 'The spread is a **shallow** copy. `copy.address` is the very same object as `person.address`, which is why nested changes need a spread at each level.'
    },
    {
      q: 'An input has `name="email"`. What does this handler do when you type in it?\n\n' + jsx('setForm({ ...form, [e.target.name]: e.target.value });'),
      choices: ['Makes a new form object with every field copied and `email` replaced by what is typed', 'Adds a field called `e.target.name`', 'Changes `form.email` in place'],
      answer: 0,
      why: '`[e.target.name]` is a computed property name: the key is the value of `e.target.name`, here `email`. One handler then serves every input that has a matching `name`.'
    }
  ];

  Q['r-state-arrays'] = [
    {
      q: 'Which line adds an item without changing the array in state?',
      choices: ['`setItems([...items, item])`', '`items.push(item); setItems(items);`', '`setItems(items.push(item))`'],
      answer: 0,
      why: 'The spread makes a new array. `push` changes the old one, which React then sees as "no change"; and `push` returns the new length, so the third line would put a number in state.'
    },
    {
      q: 'How do you remove the item with id 3?',
      choices: ['`setItems(items.filter(i => i.id !== 3))`', '`items.splice(2, 1); setItems(items);`', '`delete items[2]; setItems(items);`'],
      answer: 0,
      why: '`filter` returns a new array without the item. `splice` and `delete` change the array in state, and React does not draw again.'
    },
    {
      q: 'How do you sort a list held in state?',
      choices: ['`setItems([...items].sort(byName))`', '`setItems(items.sort(byName))`', '`items.sort(byName)` on its own'],
      answer: 0,
      why: '`sort` sorts in place and returns the same array, so `setItems(items.sort(…))` hands React the array it already has. Copy first, or use `items.toSorted(byName)`.'
    },
    {
      q: 'What is wrong here?\n\n' + jsx('const copy = [...todos];', 'copy[0].done = true;', 'setTodos(copy);'),
      choices: [
        'The object inside is shared with the old array, so the old state is changed too',
        'Nothing: the array is a new one',
        '`setTodos` refuses an array made with the spread syntax'
      ],
      answer: 0,
      why: '`[...todos]` copies the array, not the objects in it. Change the item with `map` and a spread: `todos.map(t => t.id === id ? { ...t, done: true } : t)`.'
    }
  ];

  Q['r-forms'] = [
    {
      q: 'Which is a controlled text input?',
      choices: ['`<input value={text} onChange={e => setText(e.target.value)} />`', '`<input defaultValue={text} />`', '`<input value={text} />`'],
      answer: 0,
      why: 'Controlled means the input shows a state value and reports each keystroke so the state can follow. `defaultValue` only sets the start; `value` without `onChange` makes it read-only.'
    },
    {
      q: 'An input has `value={name}` but no `onChange`. What happens when you type in it?',
      choices: ['Nothing changes, and React warns that the field is read-only', 'It works as a normal input', 'React throws an error and the page goes blank'],
      answer: 0,
      why: 'React keeps putting the state value back into the input, so typing has no effect. Add `onChange`, or use `defaultValue` for a field React does not need to control.'
    },
    {
      q: 'How does an `onChange` handler read a checkbox?',
      choices: ['`e.target.checked`', '`e.target.value`', '`e.checked`'],
      answer: 0,
      why: 'A checkbox\'s `value` is the text it submits ("on" by default), whether ticked or not. Whether it is ticked is `checked`, both in the prop (`checked={agreed}`) and in the event.'
    },
    {
      q: 'Why put `onSubmit` on the `<form>` rather than `onClick` on its button?',
      choices: ['It also runs when Enter is pressed in a field, and `e.preventDefault()` there stops the page reloading', 'Buttons cannot have click handlers inside a form', 'React requires it'],
      answer: 0,
      why: 'Submitting is a form event: a click on the submit button and Enter in a text field both trigger it. Without `preventDefault()` the browser sends the form and reloads the page.'
    },
    {
      q: 'When is an uncontrolled input a good choice?',
      choices: ['A simple form read once on submit, or a file input', 'A field you want to check on every keystroke', 'Never: React does not support them'],
      answer: 0,
      why: 'Uncontrolled inputs keep their value in the DOM, read with `FormData` (or a ref) when needed. React Hook Form uses them for speed on large forms. A file input is always uncontrolled.'
    }
  ];

  Q['r-lifting-state'] = [
    {
      q: 'Two sibling components must show the same value. Where does its state go?',
      choices: ['In their closest common parent, passed down to both', 'In each of them, kept in step by hand', 'In a global variable outside React'],
      answer: 0,
      why: 'One owner for the value: the closest component that has both of them below it. It passes the value down as a prop, and a function that changes it.'
    },
    {
      q: 'A child needs to change state its parent owns. How?',
      choices: ['It calls a function the parent passed as a prop, such as `onChange`', 'It sets the parent\'s state variable directly', 'It changes its own props'],
      answer: 0,
      why: 'Props are read-only. The parent passes a callback (`onShow`, `onAdd`, `onChange`); the child calls it, and the parent sets its own state.'
    },
    {
      q: 'What goes wrong here?\n\n' + jsx('function Cart({ items }) {', '  const [total, setTotal] = useState(sum(items));', '  return <p>{total}</p>;', '}'),
      choices: [
        'The total is worked out only for the first render; when `items` changes it stays wrong',
        'Nothing: `useState` keeps the total in step with the items',
        '`useState` cannot take a function call'
      ],
      answer: 0,
      why: 'The initial value is used once. A value you can compute from props or state needs no state: `const total = sum(items);` on every render.'
    },
    {
      q: 'In this sense, what is a *controlled* component?',
      choices: ['One whose important values come from props, so its parent decides them', 'One that uses `useReducer`', 'One wrapped in a `<form>`'],
      answer: 0,
      why: 'Like a controlled input, a controlled component does not own the value: the parent passes it, and changes come back through a callback. That is what lets a parent coordinate several of them.'
    }
  ];

  Q['r-use-reducer'] = [
    {
      q: 'What does a reducer return?',
      choices: ['The next state, as a new value', 'Nothing: it changes the state it was given', 'An action for `dispatch`'],
      answer: 0,
      why: 'A reducer is `(state, action) => nextState`. React makes what it returns the new state, so it must not change the old one.'
    },
    {
      q: 'What should an action\'s `type` describe?',
      choices: ['What happened, such as `\'added\'` or `\'deleted\'`', 'The setter to call, such as `\'setTasks\'`', 'The name of the component that dispatched it'],
      answer: 0,
      why: 'Actions describe events; the reducer decides what they do to the state. That keeps the handlers short and the logic in one place.'
    },
    {
      q: 'Which reducer case is a bug?',
      choices: [
        "`case 'added': state.items.push(action.item); return state;`",
        "`case 'added': return { ...state, items: [...state.items, action.item] };`",
        "`case 'cleared': return { ...state, items: [] };`"
      ],
      answer: 0,
      why: 'It changes the old state and returns the same object, so React sees no change. A reducer returns new objects and arrays.'
    },
    {
      q: 'When is `useReducer` a better fit than `useState`?',
      choices: ['When many handlers change the same state in different ways', 'For every piece of state, always', 'Only for a single boolean'],
      answer: 0,
      why: 'With several kinds of change, one reducer keeps the logic together and testable. For a lone flag or text field, `useState` is simpler.'
    }
  ];
})(window.RLT);
