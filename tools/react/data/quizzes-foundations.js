/*
 * Quizzes for track 1 (Foundations): three or more questions per lesson, keyed by lesson id.
 *
 * Question shape: {q: Markdown, choices: [Markdown, ...], answer: index of the right choice,
 *                  why: Markdown shown after any answer}.
 * The choices are shuffled every time, so never write "both of the above". A missed question goes
 * into the review (js/views/quiz.js).
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};
  function jsx() { return '```jsx\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q['r-first-component'] = [
    {
      q: 'What is a React component?',
      choices: ['A JavaScript function that returns JSX describing a piece of UI', 'An HTML file with a template', 'A class that must extend `HTMLElement`'],
      answer: 0,
      why: 'A component is a function (its name starting with a capital letter) that returns JSX. React calls it and turns what it returns into DOM elements.'
    },
    {
      q: 'Why does `<profile />` not render your `Profile` component?',
      choices: ['A lower-case tag is taken as an HTML element, not a component', 'Components must be self-closed with `</>`', 'Tags are case-insensitive, so it does render it'],
      answer: 0,
      why: 'JSX decides by the first letter: lower case means a built-in HTML tag (`div`, `p`), a capital means a component from your code. That is why component names start with a capital.'
    },
    {
      q: 'What does this return?\n\n' + jsx('function App() {', '  return', '    <h1>Hi</h1>;', '}'),
      choices: ['`undefined`: `return` followed by a line break ends the statement', 'The `<h1>`', 'A syntax error'],
      answer: 0,
      why: 'JavaScript inserts a semicolon after a bare `return` at the end of a line, so the JSX below is never reached. Write `return (` on the same line and close the parenthesis after the JSX.'
    },
    {
      q: 'React is called *declarative*. What does that mean for you?',
      choices: ['You describe what the UI should look like for the data; React works out the DOM changes', 'You declare every DOM operation in order', 'You must declare all variables with `const`'],
      answer: 0,
      why: 'Plain DOM code is imperative: you give each step (`createElement`, `appendChild`, `textContent = …`). In React you return the result, and React compares it with what is on the page and makes only the changes needed.'
    }
  ];

  Q['r-jsx'] = [
    {
      q: 'Which line gives an element the CSS class `card` in JSX?',
      choices: ['`<div className="card">`', '`<div class="card">`', '`<div css="card">`'],
      answer: 0,
      why: '`class` is a reserved word in JavaScript, and JSX follows the DOM property name, `className` (the same one you set in plain JS: `el.className = "card"`).'
    },
    {
      q: 'Which `style` is right in JSX?',
      choices: ["`style={{ fontSize: 20, color: 'red' }}`", '`style="font-size: 20px; color: red"`', "`style={fontSize: 20, color: 'red'}`"],
      answer: 0,
      why: '`style` takes an object, so it needs the braces that say "JavaScript here" plus the braces of the object itself. Property names are camelCase, and a plain number means pixels.'
    },
    {
      q: 'What does JSX turn into before the code runs?',
      choices: ['Function calls, such as `jsx("h1", { children: "Hi" })`, that return plain objects', 'An HTML string that is set with `innerHTML`', 'Calls to `document.createElement` straight away'],
      answer: 0,
      why: 'A compiler (Babel, esbuild, SWC) rewrites each tag into a call that returns an object describing the element. That is why JSX is a value you can store, return or pass around. React later turns those objects into DOM nodes.'
    },
    {
      q: 'Why can a component not return two sibling elements without a wrapper?',
      choices: ['A function returns one value; `<>…</>` (a Fragment) groups them without adding a DOM element', 'Browsers do not allow two elements in a row', 'React only renders `<div>` at the top level'],
      answer: 0,
      why: 'Two JSX expressions side by side are two function calls with nothing joining them, which is not valid JavaScript. Wrap them in a Fragment `<>…</>` (or a real element).'
    }
  ];

  Q['r-props'] = [
    {
      q: 'How does `Greeting` receive `<Greeting name="Asha" age={31} />`?',
      choices: ['As one object: `Greeting({ name: "Asha", age: 31 })`', 'As two arguments: `Greeting("Asha", 31)`', 'Through `this.props` only'],
      answer: 0,
      why: 'React gathers all the attributes into one props object and passes it as the first argument. Destructuring, `function Greeting({ name, age })`, takes it apart.'
    },
    {
      q: 'A child component wants to change a value it received as a prop. What should happen?',
      choices: ['The parent owns it: the child asks the parent, by calling a function the parent passed down', 'The child assigns to it: `props.value = 5`', 'The child copies it into a global variable'],
      answer: 0,
      why: 'Props are read-only. Data flows down; to change it, the parent passes a handler (`onChange`) and the child calls it. The parent then renders again with a new value.'
    },
    {
      q: 'What does `<Toggle on />` pass as the `on` prop?',
      choices: ['`true`', 'The string `"on"`', '`undefined`'],
      answer: 0,
      why: 'A bare attribute name means `true`, like `disabled` in HTML. To pass `false`, write `on={false}`.'
    },
    {
      q: 'Which prop is wrong?\n\n' + jsx('<Product price="2499" />'),
      choices: ['`price` is the string "2499", not a number: write `price={2499}`', 'Nothing: quotes and braces mean the same', 'Prop names cannot be lower case'],
      answer: 0,
      why: 'Quotes always give a string. Braces give any JavaScript value, so numbers, booleans, arrays and objects go in braces. `"2499" + 1` is "24991"; `2499 + 1` is 2500.'
    }
  ];

  Q['r-children'] = [
    {
      q: 'Where does the content between `<Card>` and `</Card>` go?',
      choices: ['Into the `children` prop of `Card`', 'Into `props.content`', 'Nowhere: `Card` must be self-closing'],
      answer: 0,
      why: 'Whatever you nest inside a component\'s tags arrives as `props.children`. The component decides where to put it, with `{children}`.'
    },
    {
      q: 'You need a `Panel` with a header slot and a body. What is the usual React way?',
      choices: ['Pass the header as a prop holding JSX (`title={<b>…</b>}`) and the body as children', 'Make `Panel` extend a `BasePanel` class', 'Copy `Panel` for each kind of header'],
      answer: 0,
      why: 'JSX is a value, so any prop can carry it. Extra slots are ordinary props; the main content is `children`. React favours composition over inheritance.'
    },
    {
      q: 'What does this component render for `<Box />`, with no children?\n\n' + jsx('function Box({ children }) {', '  return <div className="box">{children}</div>;', '}'),
      choices: ['An empty `<div class="box">`', 'The text "undefined"', 'An error'],
      answer: 0,
      why: '`children` is `undefined`, and React renders nothing for `undefined`, `null` and booleans. The `<div>` itself is still there.'
    }
  ];

  Q['r-conditional'] = [
    {
      q: 'What appears on the page when `count` is 0?\n\n' + jsx('{count && <Badge />}'),
      choices: ['A "0"', 'Nothing', 'The badge'],
      answer: 0,
      why: '`0 && x` gives back `0`, and React renders numbers, including 0. `false`, `null` and `undefined` render nothing. Write `count > 0 && <Badge />`.'
    },
    {
      q: 'Which shows "Saving…" while `saving` is true and "Save" otherwise?',
      choices: ["`<button>{saving ? 'Saving…' : 'Save'}</button>`", "`<button>{if (saving) 'Saving…' else 'Save'}</button>`", "`<button>{saving && 'Saving…' || 'Save'}</button>` is the only way"],
      answer: 0,
      why: 'Inside `{ }` only expressions are allowed, and the ternary is an expression. `if` is a statement: use it above the `return`.'
    },
    {
      q: 'How does a component render nothing at all?',
      choices: ['It returns `null`', 'It returns an empty string `""` only', 'It must throw an error'],
      answer: 0,
      why: '`return null;` renders nothing, and the component is still mounted (it keeps its state).'
    }
  ];

  Q['r-lists-keys'] = [
    {
      q: 'What is a `key` for?',
      choices: ['It tells React which item is which between renders, so it keeps each item\'s element and state with the right item', 'It sorts the list', 'It is the `id` attribute in the DOM'],
      answer: 0,
      why: 'React matches the old list with the new one by key, to know what moved, what was added and what was removed. The key never appears in the DOM.'
    },
    {
      q: 'A list where items can be removed uses `key={index}`. What goes wrong?',
      choices: ['After a removal the indexes shift, so React gives one item\'s element (and its typed text or ticked box) to another item', 'Nothing: the index is always unique', 'React throws an error'],
      answer: 0,
      why: 'The index belongs to the position, not to the item. Remove the first item and the second now has key 0: React reuses the first item\'s element for it. Use a stable id from the data.'
    },
    {
      q: 'Which key is best?',
      choices: ['`key={product.sku}`, a unique, stable value from the data', '`key={Math.random()}`', '`key={product.name.length}`'],
      answer: 0,
      why: 'A key must be unique among siblings and the same on every render. A random key changes every render, so React throws the element away and builds a new one each time.'
    },
    {
      q: 'Where does the key go?\n\n' + jsx('{users.map(u => <UserRow ??? user={u} />)}'),
      choices: ['On `<UserRow key={u.id} …>`, the element `map` returns', 'On the `<li>` inside `UserRow`', 'On the parent `<ul>`'],
      answer: 0,
      why: 'React reads the key on the elements in the array, so it goes on the element `map` returns. `UserRow` does not receive `key` as a prop: pass the id separately if it needs it.'
    }
  ];

  Q['r-events'] = [
    {
      q: 'What happens with `<button onClick={save()}>`?',
      choices: ['`save` runs once while rendering, and the button gets its return value as the handler', '`save` runs on every click', 'React refuses to compile it'],
      answer: 0,
      why: 'The braces hold an expression, and `save()` is a call: it runs at render time. Pass the function itself, `onClick={save}`, or an arrow, `onClick={() => save(id)}`.'
    },
    {
      q: 'How does a child tell its parent that something was clicked?',
      choices: ['It calls a function the parent passed down as a prop, such as `onSelect`', 'It changes the parent\'s state variable directly', 'It dispatches a DOM event for the parent to listen to'],
      answer: 0,
      why: 'The parent passes `onSelect={handleSelect}`; the child calls `onSelect(value)`. Data goes down in props, events come up through these calls.'
    },
    {
      q: 'What is `e` in `onClick={e => …}`?',
      choices: ['A SyntheticEvent: React\'s wrapper around the browser event, with the same methods', 'Always the raw browser `MouseEvent`', 'The component\'s props'],
      answer: 0,
      why: 'React passes a SyntheticEvent with `target`, `preventDefault()`, `stopPropagation()` and the rest, the same on every browser. The browser\'s event is `e.nativeEvent`.'
    },
    {
      q: 'Which stops a form from reloading the page when submitted?',
      choices: ['`<form onSubmit={e => { e.preventDefault(); … }}>`', '`<form onSubmit="return false">`', '`<form onsubmit={…}>`'],
      answer: 0,
      why: 'Call `e.preventDefault()` in the handler. React handlers are functions, never strings, and the prop is camelCase: `onSubmit`.'
    }
  ];

  Q['r-state-basics'] = [
    {
      q: 'Why does this button always show 0?\n\n' + jsx('function Counter() {', '  let count = 0;', '  return <button onClick={() => count++}>{count}</button>;', '}'),
      choices: ['Changing a local variable does not re-render, and each render starts it at 0 again', 'Arrow functions cannot change variables', 'The button needs a `key`'],
      answer: 0,
      why: 'Use `const [count, setCount] = useState(0)`: React keeps the value between renders, and the setter tells React to render again.'
    },
    {
      q: 'What does `setCount(5)` do?',
      choices: ['Stores 5 for this component and makes React render it again', 'Changes `count` to 5 immediately, in the running function', 'Changes the DOM text directly'],
      answer: 0,
      why: 'The setter schedules a re-render with the new value. The `count` variable in the code that is running now keeps its old value: the State track shows why.'
    },
    {
      q: 'You render `<Counter />` twice. How many counts are there?',
      choices: ['Two: each instance on the page has its own state', 'One, shared by both', 'None until you add a key'],
      answer: 0,
      why: 'State belongs to a component instance in the tree, not to the function. To share a count, keep it in their parent and pass it down as a prop.'
    },
    {
      q: 'Why must `useState` not be called inside an `if`?',
      choices: ['React matches each hook call to its stored value by the order of the calls, which an `if` can change', 'Hooks are slower inside blocks', 'It is fine; there is no such rule'],
      answer: 0,
      why: 'React keeps hook values in a list in call order. Skip a call in one render and every later hook reads the wrong value. Call hooks at the top level of the component.'
    }
  ];
})(window.RLT);
