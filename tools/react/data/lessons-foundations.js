/*
 * Lessons, track 1: Foundations.
 *
 * Lesson shape:
 *   {id, track, title, summary, keywords: [..], docs: 'https://react.dev/...', uilt?: a UI Learning Tool lesson id,
 *    body: Markdown (U.md: ## headings, lists, | tables |, ```jsx blocks```, `code`, [[lesson:id]], [[q:id]]),
 *    plainjs: Markdown for the "Coming from plain JavaScript" box,
 *    example: {code, css?, note?},
 *    challenge: {title, task (Markdown), starter, solution, css?, hints: [..], checks: [..]}}
 *
 * Code is written in template literals so it reads exactly as JSX. A template literal inside the
 * code is escaped, \` and \${ (lesson 7's example has the only one: data/javascript.js's entry for
 * template literals names that lesson, so it opens with a "New JavaScript in this lesson" box). Every
 * example, starter and solution is a module whose default export is the component the preview
 * renders. The check shapes and the helpers a check function gets (t.click, t.text, t.source…) are
 * listed at the top of js/challenge.js; tests/test_ui.py proves every starter fails at least one
 * check and every solution passes them all.
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  function block(lang, lines) { return '```' + lang + '\n' + lines.join('\n') + '\n```'; }
  function jsx() { return block('jsx', [].slice.call(arguments)); }
  function js() { return block('js', [].slice.call(arguments)); }

  L.push(
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'r-first-component', track: 'foundations',
      title: 'Your first component',
      summary: 'A component is a function that returns JSX. Export one as the default, and React draws it on the page.',
      keywords: ['component', 'function component', 'export default', 'App', 'root', 'createRoot', 'render', 'hello world', 'declarative'],
      docs: 'https://react.dev/learn/your-first-component', uilt: 'js-dom',
      body: [
        'React builds a user interface out of **components**. A component is a JavaScript function that returns a description of a piece of UI, written in **JSX**: markup inside JavaScript.',
        jsx('export default function App() {',
            '  return <h1>Hello, React</h1>;',
            '}'),
        '## How it gets on the page',
        'In a real project (made with Vite, or a framework such as Next.js) one file does this once, at start-up: it finds an element in the HTML page and tells React to draw your top component inside it.',
        jsx("import { createRoot } from 'react-dom/client';",
            "import App from './App';",
            '',
            "createRoot(document.getElementById('root')).render(<App />);"),
        'In this tool every editor is your `App.jsx`. Export a component as the default and the tool renders it into a `<div id="root">` for you.',
        '## Components use components',
        'A component can put other components in its JSX, as if they were HTML tags:',
        jsx('function Badge() {',
            '  return <span className="badge">React 19</span>;',
            '}',
            '',
            'export default function App() {',
            '  return (',
            '    <section>',
            '      <h1>Team</h1>',
            '      <Badge />',
            '      <Badge />',
            '    </section>',
            '  );',
            '}'),
        '## Three rules',
        '- **A capital letter.** `<Badge />` is your component; `<badge />` would be an HTML tag the browser does not know. That is how JSX tells them apart.',
        '- **One tree.** A component returns one element (with anything inside it), or `null` for nothing. Two elements side by side need a wrapper: [[lesson:r-jsx]].',
        '- **Parentheses for several lines.** `return (` on the same line, then the JSX. Without the parenthesis, `return` followed by a line break returns `undefined`.',
        '## Declarative',
        'You describe **what** the page should look like, not the steps to build it. When the data changes, you describe the new result and React works out which DOM nodes to add, change or remove. That idea, UI as a function of data, is what [[q:what-is-react]] asks about.'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you build the page step by step: `const h1 = document.createElement("h1"); h1.textContent = "Hello"; root.appendChild(h1);`. That is *imperative*: you give the browser each instruction, and when the data changes you write more instructions to patch the page. In React you write the result (`<h1>Hello</h1>`) and React creates, updates and removes the DOM nodes itself. A component is the React version of "a function that builds a piece of the page", except that you never touch `document` yourself.',
      example: {
        code: `function Badge() {
  return <span className="badge">React 19</span>;
}

export default function App() {
  return (
    <section>
      <h1>Hello, React</h1>
      <p>This page was built by two components.</p>
      <Badge />
      <Badge />
    </section>
  );
}
`,
        css: '.badge { display: inline-block; margin-right: 6px; padding: 2px 10px; border-radius: 999px; background: #e3f3f8; color: #087ea4; font-weight: 600; }',
        note: 'Change the text, add a third `<Badge />`, or rename `Badge` to `badge` in both places and read the console: a lower-case name is taken as an HTML tag.'
      },
      challenge: {
        title: 'Two greetings',
        task: 'Write a component `Greeting` that returns a `<p>` with the text `Welcome to React`.\n\nThen make `App` return a `<main>` holding an `<h1>` with the text `My first component`, followed by **two** `<Greeting />` elements.',
        starter: `// 1. Write the Greeting component here


export default function App() {
  return (
    <main>
      {/* 2. an <h1>, then two <Greeting /> */}
    </main>
  );
}
`,
        solution: `function Greeting() {
  return <p>Welcome to React</p>;
}

export default function App() {
  return (
    <main>
      <h1>My first component</h1>
      <Greeting />
      <Greeting />
    </main>
  );
}
`,
        hints: [
          'A component is a function whose name starts with a capital letter and returns JSX: `function Greeting() { return <p>…</p>; }`. Put it above `App`.',
          'Use it inside `App` like a tag: `<Greeting />`. Write it twice for two of them, after the `<h1>`.'
        ],
        checks: [
          { label: 'The `<main>` has an `<h1>` that says "My first component"', text: 'main h1', equals: 'My first component' },
          { label: 'There are exactly two `<p>` saying "Welcome to React"', fn: `function (doc) {
  var ps = [].slice.call(doc.querySelectorAll('main p'));
  if (ps.length !== 2) return 'found ' + ps.length + ' <p> in <main>';
  var bad = ps.filter(function (p) { return p.textContent.trim() !== 'Welcome to React'; })[0];
  return !bad || 'one says "' + bad.textContent.trim() + '"';
}` },
          { label: 'They come from a `Greeting` component, used twice (not two `<p>` written in `App`)', fn: `function (doc, win, t) {
  var src = t.source();
  if (!/function\\s+Greeting\\s*\\(|const\\s+Greeting\\s*=/.test(src)) return 'no Greeting component found';
  var uses = (src.match(/<Greeting\\s*\\/>/g) || []).length;
  return uses === 2 || '<Greeting /> is used ' + uses + ' times';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'r-jsx', track: 'foundations',
      title: 'JSX: markup inside JavaScript',
      summary: 'JSX looks like HTML but is JavaScript: className instead of class, style as an object, { } for any expression, every tag closed, one parent.',
      keywords: ['jsx', 'className', 'class', 'style', 'curly braces', 'expressions', 'fragment', '<>', 'htmlFor', 'self-closing', 'camelCase', 'createElement', 'jsx runtime', 'babel'],
      docs: 'https://react.dev/learn/writing-markup-with-jsx', uilt: 'js-dom',
      body: [
        'JSX is not HTML and not a string. A compiler (Babel in this tool; esbuild or SWC in Vite and Next.js) turns every tag into a function call before the code runs:',
        jsx('const el = <h1 className="title">Hi {name}</h1>;',
            '',
            '// what the modern JSX transform turns it into:',
            'const el = jsx("h1", { className: "title", children: ["Hi ", name] });'),
        'The call returns a plain object that **describes** the element. So JSX is a value: you can keep it in a variable, return it, pass it to a function or put it in an array. [[q:jsx-compiles-to]] is this, as an interview answer.',
        '## Where JSX differs from HTML',
        '| HTML | JSX | Why |\n|---|---|---|\n' +
        '| `class="card"` | `className="card"` | `class` is a JavaScript keyword |\n' +
        '| `for="email"` | `htmlFor="email"` | `for` is a JavaScript keyword |\n' +
        '| `style="color: red; font-size: 20px"` | `style={{ color: \'red\', fontSize: 20 }}` | an object; camelCase names; a number means pixels |\n' +
        '| `onclick="save()"` | `onClick={save}` | camelCase, and a function, not a string |\n' +
        '| `<br>`, `<hr>`, `<input>` | `<br />`, `<hr />`, `<input />` | every tag must be closed |\n' +
        '| `<!-- note -->` | `{/* note */}` | a JavaScript comment inside braces |',
        '## Curly braces: a window into JavaScript',
        'Inside JSX, `{ }` holds any JavaScript **expression**: a variable, arithmetic, a function call, a ternary. Not a statement: `if` and `for` go above the `return`.',
        jsx("const user = { name: 'Asha', age: 31 };",
            '',
            'return <p>{user.name} turns {user.age + 1} next year.</p>;'),
        'Attributes too: `src={url}`, with no quotes around the braces. Quotes give a string; braces give JavaScript. `style={{ … }}` is simply braces holding an object.',
        '## One parent: the Fragment',
        'A component returns one tree. Two elements side by side need a wrapper: a `<div>`, or a **Fragment**, `<>…</>`, which groups them without adding anything to the page:',
        jsx('return (',
            '  <>',
            '    <h1>Title</h1>',
            '    <p>Text</p>',
            '  </>',
            ');'),
        'Why: `return jsx("h1") jsx("p")` is not valid JavaScript. A function returns one value.',
        '## Safe by default',
        '`{text}` is always inserted as text. If `text` holds `<img src=x onerror=alert(1)>`, the page shows those characters; nothing runs. Only `dangerouslySetInnerHTML` inserts HTML, and its name is the warning: [[q:security]].'
      ].join('\n\n'),
      plainjs: 'The same card in plain JavaScript: `el.className = "card"; el.style.fontSize = "20px"; label.htmlFor = "email"; h2.textContent = user.name;`. JSX keeps the DOM\'s own property names, `className`, `htmlFor` and camelCase style names like `fontSize`, which is why they differ from HTML. What changes is that you write the whole result in one place instead of setting properties one at a time. And `{user.name}` works like `textContent`, never like `innerHTML`.',
      example: {
        code: `const user = { name: 'Asha Rao', role: 'Front-end developer', years: 4 };

export default function App() {
  const accent = '#087ea4';
  return (
    <>
      <div className="card" style={{ borderColor: accent }}>
        <h2>{user.name}</h2>
        <p>{user.role}, {user.years * 12} months of React</p>
        <label htmlFor="msg">Message</label>
        <input id="msg" placeholder={'Write to ' + user.name.split(' ')[0]} />
      </div>
      {/* a comment inside JSX */}
      <p style={{ color: accent, fontSize: 14 }}>Two elements at the top, grouped by a Fragment.</p>
    </>
  );
}
`,
        css: '.card { border: 2px solid; border-radius: 10px; padding: 12px 16px; max-width: 320px; } .card h2 { margin: 0 0 4px; } label { display: block; margin-top: 8px; font-size: 13px; }',
        note: 'Try `class="card"` instead of `className` and read the console: React warns, because the DOM property is `className`.'
      },
      challenge: {
        title: 'Turn HTML into JSX',
        task: 'The starter is written like HTML, so it does not even compile (see the ✕ in the editor). Make it JSX:\n\n1. `class` becomes `className`: the card keeps the class `card`, the note the class `note`.\n2. Close the `<hr>` and `<br>` tags.\n3. The heading\'s `style` becomes an object that makes it blue (`color: \'blue\'`).\n4. Show the `name` and `city` variables with `{ }` instead of the words NAME and CITY.\n5. Wrap the two top-level elements in a Fragment, so the component returns one tree.',
        starter: `export default function App() {
  const name = 'Meera Iyer';
  const city = 'Pune';
  return (
    <div class="card">
      <h2 style="color: blue">NAME</h2>
      <hr>
      <p>Lives in CITY<br>since 2019</p>
    </div>
    <p class="note">Written in JSX</p>
  );
}
`,
        solution: `export default function App() {
  const name = 'Meera Iyer';
  const city = 'Pune';
  return (
    <>
      <div className="card">
        <h2 style={{ color: 'blue' }}>{name}</h2>
        <hr />
        <p>Lives in {city}<br />since 2019</p>
      </div>
      <p className="note">Written in JSX</p>
    </>
  );
}
`,
        hints: [
          'Fix what the ✕ in the editor points at first: `<hr>` must be `<hr />`, and two elements at the top level need `<>` … `</>` around them.',
          '`style` takes an object, so it needs two pairs of braces: `style={{ color: \'blue\' }}`. The outer pair says "JavaScript here", the inner pair is the object.',
          'Inside text, `{name}` puts the variable\'s value in: `<p>Lives in {city}<br />since 2019</p>`.'
        ],
        checks: [
          { label: 'The card uses `className`, not `class`', fn: `function (doc, win, t) {
  if (!doc.querySelector('.card')) return 'nothing has the class card';
  return !/\\bclass=/.test(t.source()) || 'the code still says class=';
}` },
          { label: 'The heading is blue, through a style object', fn: `function (doc) {
  var h2 = doc.querySelector('.card h2');
  if (!h2) return 'no <h2> in the card';
  var c = getComputedStyle(h2).color;
  return c === 'rgb(0, 0, 255)' || 'its colour is ' + c;
}` },
          { label: 'The heading shows the name, the paragraph the city', fn: `function (doc, win, t) {
  if (t.text('.card h2') !== 'Meera Iyer') return 'the heading says "' + t.text('.card h2') + '"';
  return /Lives in Pune/.test(t.text('.card p') || '') || 'the paragraph says "' + t.text('.card p') + '"';
}` },
          { label: 'The `<hr />` and the `<br />` are there', fn: `function (doc) {
  return (doc.querySelector('.card hr') && doc.querySelector('.card p br')) ? true : 'an <hr> or a <br> is missing';
}` },
          { label: 'The note sits next to the card (one tree, grouped)', fn: `function (doc, win, t) {
  var note = doc.querySelector('.note');
  if (!note) return 'no element has the class note';
  if (note.closest('.card')) return 'the note is inside the card';
  return t.text('.note') === 'Written in JSX' || 'the note says "' + t.text('.note') + '"';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'r-props', track: 'foundations',
      title: 'Components and props',
      summary: 'Props pass data into a component, like arguments into a function. They are read-only: a component never changes its own props.',
      keywords: ['props', 'properties', 'arguments', 'destructuring', 'default value', 'read-only', 'reusable', 'pass data', 'pure'],
      docs: 'https://react.dev/learn/passing-props-to-a-component', uilt: 'js-basics',
      body: [
        '**Props** are how a parent passes data to a child. You write them like HTML attributes; the component receives them all as **one object**:',
        jsx('function Greeting(props) {',
            '  return <p>Hello, {props.name}!</p>;',
            '}',
            '',
            '<Greeting name="Asha" />    // React calls Greeting({ name: "Asha" })'),
        '## Destructuring and defaults',
        'Most code takes the props object apart in the parameter list, and gives defaults right there:',
        jsx("function Greeting({ name, punctuation = '!' }) {",
            '  return <p>Hello, {name}{punctuation}</p>;',
            '}'),
        '## Any value can be a prop',
        'A string goes in quotes; anything else goes in braces: numbers, booleans, arrays, objects, functions, even JSX. A bare name means `true`.',
        jsx("<Product title=\"Keyboard\" price={2499} inStock={true} tags={['usb', 'mechanical']} />",
            '<Product title="Mouse" price={799} inStock />'),
        '## Props are read-only',
        'A component must never change its props (`props.price = 0` is a bug): they belong to the parent. When the parent renders again with other values, the child simply receives new props. Data flows **one way**, down from parent to child. A value a component changes itself is **state**: [[lesson:r-state-basics]], and [[q:props-vs-state]] is the interview question.',
        '## Components are pure',
        'Given the same props, a component should return the same JSX, and do nothing else while rendering: no changing variables outside it, no fetching. Like a pure function. React counts on it: it may render a component more than once, or skip rendering it when nothing changed.'
      ].join('\n\n'),
      plainjs: 'A component with props is a function with parameters: `function greeting(name) { const p = document.createElement("p"); p.textContent = "Hello, " + name; return p; }`. The difference is the packaging: React collects all the attributes you write into **one object**, so `<Greeting name="Asha" />` calls `Greeting({ name: "Asha" })`. Default values are ordinary default parameters, in the destructuring.',
      example: {
        code: `function Product({ title, price, inStock = true, tags = [] }) {
  return (
    <article className="product">
      <h3>{title}</h3>
      <p className="price">₹{price.toLocaleString('en-IN')}</p>
      <p>{inStock ? 'In stock' : 'Sold out'}</p>
      <p className="tags">{tags.join(' · ')}</p>
    </article>
  );
}

export default function App() {
  return (
    <div className="grid">
      <Product title="Keyboard" price={2499} tags={['usb', 'mechanical']} />
      <Product title="Monitor" price={12999} inStock={false} tags={['27 inch']} />
    </div>
  );
}
`,
        css: '.grid { display: flex; gap: 12px; flex-wrap: wrap; } .product { border: 1px solid #ccd; border-radius: 8px; padding: 10px 14px; min-width: 160px; } .product h3 { margin: 0; } .product p { margin: 4px 0; } .price { font-weight: 700; } .tags { color: #667; font-size: 13px; }',
        note: 'Add a third `<Product />` without `tags`: the default `[]` keeps `tags.join` working.'
      },
      challenge: {
        title: 'One badge, three people',
        task: 'Write `UserBadge` with two props, `name` and `role`. It returns a `<div className="user-badge">` with the name in a `<b>` and the role in a `<span>`. The role defaults to `"guest"` when it is not passed.\n\nIn `App`, render three badges:\n\n- Asha, admin\n- Vikram, developer\n- Meera, with no role (so she shows as guest)',
        starter: `function UserBadge() {
  // take name and role from the props; role defaults to "guest"
  return <div className="user-badge">?</div>;
}

export default function App() {
  return (
    <div>
      <UserBadge />
    </div>
  );
}
`,
        solution: `function UserBadge({ name, role = 'guest' }) {
  return (
    <div className="user-badge">
      <b>{name}</b> <span>{role}</span>
    </div>
  );
}

export default function App() {
  return (
    <div>
      <UserBadge name="Asha" role="admin" />
      <UserBadge name="Vikram" role="developer" />
      <UserBadge name="Meera" />
    </div>
  );
}
`,
        css: '.user-badge { display: inline-flex; gap: 6px; margin: 4px; padding: 4px 10px; border: 1px solid #ccd; border-radius: 999px; } .user-badge span { color: #667; }',
        hints: [
          'Take the props apart in the parameter list: `function UserBadge({ name, role = \'guest\' })`.',
          'Pass them like attributes: `<UserBadge name="Asha" role="admin" />`. For Meera, leave `role` out.'
        ],
        checks: [
          { label: 'Three `.user-badge` elements', count: '.user-badge', eq: 3 },
          { label: 'The names, each in a `<b>`: Asha, Vikram, Meera', fn: `function (doc) {
  var names = [].map.call(doc.querySelectorAll('.user-badge b'), function (b) { return b.textContent.trim(); });
  return names.join(', ') === 'Asha, Vikram, Meera' || 'found: ' + (names.join(', ') || 'none');
}` },
          { label: 'The roles, each in a `<span>`: admin, developer, guest (the default)', fn: `function (doc) {
  var roles = [].map.call(doc.querySelectorAll('.user-badge span'), function (s) { return s.textContent.trim(); });
  return roles.join(', ') === 'admin, developer, guest' || 'found: ' + (roles.join(', ') || 'none');
}` },
          { label: 'All three are the same `UserBadge` component', fn: `function (doc, win, t) {
  var uses = (t.source().match(/<UserBadge\\b/g) || []).length;
  return uses === 3 || '<UserBadge is used ' + uses + ' times';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'r-children', track: 'foundations',
      title: 'Children and composition',
      summary: 'What you put between a component\'s tags arrives as props.children, so one component can wrap any content: cards, panels, layouts.',
      keywords: ['children', 'props.children', 'composition', 'wrapper', 'layout', 'slot', 'nesting', 'jsx as props', 'composition vs inheritance'],
      docs: 'https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children',
      body: [
        'Content you nest inside a component\'s tags arrives as a prop named `children`:',
        jsx('function Card({ children }) {',
            '  return <div className="card">{children}</div>;',
            '}',
            '',
            '<Card>',
            '  <h2>Photo</h2>',
            '  <p>Any JSX can go here.</p>',
            '</Card>'),
        '`Card` does not know or care what is inside it; it only decides where it goes. This is **composition**: you build bigger components by putting smaller ones inside, instead of adding a prop for every variation.',
        '## More than one slot',
        'For a second or third place to put content, pass JSX through ordinary props too:',
        jsx('function Panel({ title, footer, children }) {',
            '  return (',
            '    <section className="panel">',
            '      <header>{title}</header>',
            '      <div className="panel-body">{children}</div>',
            '      {footer && <footer>{footer}</footer>}',
            '    </section>',
            '  );',
            '}',
            '',
            '<Panel title={<b>Settings</b>} footer={<button>Save</button>}>',
            '  <p>Body</p>',
            '</Panel>'),
        '## Composition instead of configuration',
        'A `Card` that renders its `children` serves every card in the app. A `Card` with `showImage`, `imageUrl`, `subtitle` and `badge` props grows a new prop for every new screen. React has no component inheritance at all: when an interviewer asks "composition or inheritance?", the React answer is composition, with `children` and props.'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript a wrapper takes the element to wrap as an argument: `function card(child) { const div = document.createElement("div"); div.className = "card"; div.appendChild(child); return div; }`. `children` is the same idea, but the content is written in place, between the tags, so the code reads like the page it produces.',
      example: {
        code: `function Card({ title, children }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <div className="row">
      <Card title="Text">
        <p>Children can be text and tags.</p>
      </Card>
      <Card title="A list">
        <ul>
          <li>HTML</li>
          <li>CSS</li>
          <li>React</li>
        </ul>
      </Card>
      <Card title="A button">
        <button>I am a child too</button>
      </Card>
    </div>
  );
}
`,
        css: '.row { display: flex; gap: 10px; flex-wrap: wrap; } .card { border: 1px solid #ccd; border-radius: 8px; padding: 8px 12px; min-width: 140px; } .card h3 { margin: 0 0 6px; font-size: 15px; } .card ul, .card p { margin: 0; }'
      },
      challenge: {
        title: 'An alert box for any content',
        task: 'Write `Alert` with a `type` prop (`"info"` or `"error"`) and `children`. It returns `<div className={\'alert alert-\' + type}>` holding a `<strong>` that says **Note** for info and **Error** for error, followed by the children.\n\nRender two alerts in `App`:\n\n1. type `info`, with the children `<p>Saved as draft.</p>`\n2. type `error`, with the children `<p>Could not reach the server.</p>` and `<button>Retry</button>`',
        starter: `function Alert(props) {
  return <div className="alert">Alert</div>;
}

export default function App() {
  return (
    <main>
      <Alert type="info" />
    </main>
  );
}
`,
        solution: `function Alert({ type, children }) {
  return (
    <div className={'alert alert-' + type}>
      <strong>{type === 'error' ? 'Error' : 'Note'}</strong>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <main>
      <Alert type="info">
        <p>Saved as draft.</p>
      </Alert>
      <Alert type="error">
        <p>Could not reach the server.</p>
        <button>Retry</button>
      </Alert>
    </main>
  );
}
`,
        css: '.alert { border-radius: 8px; padding: 8px 12px; margin: 8px 0; } .alert p { margin: 4px 0; } .alert-info { background: #e3f3f8; } .alert-error { background: #fdecec; }',
        hints: [
          'Take `children` from the props like any other prop: `function Alert({ type, children })`, and put `{children}` in the JSX where the content should go.',
          'To pass children, open and close the component\'s tag around them: `<Alert type="info"><p>Saved as draft.</p></Alert>`.'
        ],
        checks: [
          { label: 'An `.alert-info` and an `.alert-error`, both with the class `alert`', fn: `function (doc) {
  return (doc.querySelector('.alert.alert-info') && doc.querySelector('.alert.alert-error')) ? true : 'found ' + doc.querySelectorAll('.alert').length + ' .alert, classes: ' + [].map.call(doc.querySelectorAll('.alert'), function (a) { return a.className; }).join(' | ');
}` },
          { label: 'The info alert says Note and holds "Saved as draft."', fn: `function (doc, win, t) {
  if (t.text('.alert-info strong') !== 'Note') return 'its <strong> says "' + t.text('.alert-info strong') + '"';
  return t.text('.alert-info p') === 'Saved as draft.' || 'its <p> says "' + t.text('.alert-info p') + '"';
}` },
          { label: 'The error alert says Error and holds its paragraph and a Retry button', fn: `function (doc, win, t) {
  if (t.text('.alert-error strong') !== 'Error') return 'its <strong> says "' + t.text('.alert-error strong') + '"';
  if (t.text('.alert-error p') !== 'Could not reach the server.') return 'its <p> says "' + t.text('.alert-error p') + '"';
  return t.text('.alert-error button') === 'Retry' || 'no Retry button inside it';
}` },
          { label: 'Both are the same `Alert` component', fn: `function (doc, win, t) {
  var uses = (t.source().match(/<Alert\\b/g) || []).length;
  return uses === 2 || '<Alert is used ' + uses + ' times';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'r-conditional', track: 'foundations',
      title: 'Conditional rendering',
      summary: 'Show different JSX for different situations with if, the ternary ? :, and &&, and avoid the 0 that && can leave on the page.',
      keywords: ['conditional', 'if', 'ternary', '&&', 'and', 'null', 'show', 'hide', 'zero', 'falsy', 'logical and', 'return null'],
      docs: 'https://react.dev/learn/conditional-rendering', uilt: 'js-basics',
      body: [
        'JSX has no `if` tag: you use JavaScript. Three ways, from the most room to the least:',
        '## 1. `if` before the return',
        'When the whole output differs:',
        jsx('function Status({ online }) {',
            '  if (!online) {',
            '    return <p className="off">Offline</p>;',
            '  }',
            '  return <p className="on">Online</p>;',
            '}'),
        '## 2. The ternary inside JSX',
        '`condition ? a : b`, when one piece differs:',
        jsx("<button>{isSaving ? 'Saving…' : 'Save'}</button>"),
        '## 3. `&&` for "this, or nothing"',
        jsx('{hasError && <p className="error">Something went wrong</p>}'),
        'When the left side is false, React renders nothing there.',
        '## The 0 trap',
        '`a && b` gives back `a` itself when `a` is falsy. React renders nothing for `false`, `null` and `undefined`, but **it renders the number 0 as "0"**:',
        jsx('{messages.length && <Badge />}        // shows a stray 0 when there are no messages',
            '{messages.length > 0 && <Badge />}    // shows nothing: the left side is false'),
        'Make the left side a real boolean (`> 0`, `!!x`, `Boolean(x)`) or use a ternary. It is a favourite "predict the output" interview question.',
        '## Rendering nothing',
        'A component may `return null` to show nothing at all.'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you keep every element in the page and show or hide it: `badge.hidden = count === 0; text.textContent = count === 1 ? "1 message" : count + " messages";`. In React you decide on every render what to return: when the condition is false the element is simply not in the output, and React removes it from the page. Nothing stays hidden in the DOM unless you ask for it.',
      example: {
        code: `function Inbox({ unread }) {
  return (
    <div className="inbox">
      <h3>Inbox</h3>
      {unread > 0 ? <p>You have {unread} unread messages.</p> : <p>All caught up.</p>}
      {unread > 0 && <span className="dot">{unread}</span>}
    </div>
  );
}

export default function App() {
  return (
    <>
      <Inbox unread={3} />
      <Inbox unread={0} />
      <p>Change <code>unread &gt; 0 &amp;&amp;</code> to <code>unread &amp;&amp;</code> on line 6: a stray 0 appears in the second inbox.</p>
    </>
  );
}
`,
        css: '.inbox { border: 1px solid #ccd; border-radius: 8px; padding: 6px 12px; margin-bottom: 8px; } .inbox h3 { margin: 0; } .inbox p { margin: 4px 0; } .dot { display: inline-block; min-width: 22px; text-align: center; border-radius: 11px; background: #d33; color: #fff; font-weight: 700; }'
      },
      challenge: {
        title: 'Singular, plural, and no stray 0',
        task: 'Fix `Notifications` (it takes a `count` prop):\n\n- `count` 0: only a `<p className="empty">` saying `No new notifications`\n- `count` 1: a `<p className="summary">` saying `1 new notification` (singular)\n- more: a `<p className="summary">` saying, for example, `5 new notifications`\n\nAnd a `<span className="badge">` with the count, but **only** when the count is above 0. The starter shows a stray `0`: find out why.\n\n`App` renders it three times, each inside a `<div className="n">`. Leave `App` as it is.',
        starter: `function Notifications({ count }) {
  return (
    <div>
      <p className="summary">{count} new notifications</p>
      {count && <span className="badge">{count}</span>}
    </div>
  );
}

export default function App() {
  return (
    <>
      <div className="n"><Notifications count={0} /></div>
      <div className="n"><Notifications count={1} /></div>
      <div className="n"><Notifications count={5} /></div>
    </>
  );
}
`,
        solution: `function Notifications({ count }) {
  if (count === 0) {
    return <p className="empty">No new notifications</p>;
  }
  return (
    <div>
      <p className="summary">{count} new notification{count === 1 ? '' : 's'}</p>
      {count > 0 && <span className="badge">{count}</span>}
    </div>
  );
}

export default function App() {
  return (
    <>
      <div className="n"><Notifications count={0} /></div>
      <div className="n"><Notifications count={1} /></div>
      <div className="n"><Notifications count={5} /></div>
    </>
  );
}
`,
        css: '.n { border-bottom: 1px solid #ddd; padding: 4px 0; } .n p { margin: 2px 0; } .badge { display: inline-block; min-width: 22px; text-align: center; border-radius: 11px; background: #d33; color: #fff; font-weight: 700; }',
        hints: [
          'For 0 the whole output is different: an `if (count === 0) return …;` before the main `return` is the clearest way.',
          '`count && …` gives back `count` itself when it is 0, and React prints the number 0. Make the left side a boolean: `count > 0 && …`.',
          'For the plural: `notification{count === 1 ? \'\' : \'s\'}`.'
        ],
        checks: [
          { label: 'With 0: only "No new notifications", in a `.empty` (no badge, no stray 0)', fn: `function (doc, win, t) {
  var n = doc.querySelectorAll('.n')[0];
  if (!n) return 'the .n wrappers are missing: keep App as it is';
  if (!n.querySelector('.empty')) return 'no .empty paragraph for 0';
  if (n.querySelector('.badge')) return 'a badge shows for 0';
  var text = t.text(n);
  return text === 'No new notifications' || 'the first one reads "' + text + '"';
}` },
          { label: 'With 1: "1 new notification" (singular) and a badge saying 1', fn: `function (doc, win, t) {
  var n = doc.querySelectorAll('.n')[1];
  if (!n) return 'the second .n is missing';
  if (t.text(n.querySelector('.summary')) !== '1 new notification') return 'it reads "' + t.text(n.querySelector('.summary')) + '"';
  return t.text(n.querySelector('.badge')) === '1' || 'no badge saying 1';
}` },
          { label: 'With 5: "5 new notifications" and a badge saying 5', fn: `function (doc, win, t) {
  var n = doc.querySelectorAll('.n')[2];
  if (!n) return 'the third .n is missing';
  if (t.text(n.querySelector('.summary')) !== '5 new notifications') return 'it reads "' + t.text(n.querySelector('.summary')) + '"';
  return t.text(n.querySelector('.badge')) === '5' || 'no badge saying 5';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'r-lists-keys', track: 'foundations',
      title: 'Lists and keys',
      summary: 'Turn an array into elements with map(), give each one a stable key, and see why the array index is the wrong key when the list can change.',
      keywords: ['list', 'map', 'key', 'keys', 'array', 'filter', 'index as key', 'unique key', 'reorder', 'reconciliation', 'each child in a list'],
      docs: 'https://react.dev/learn/rendering-lists', uilt: 'js-todo',
      body: [
        'JSX can hold an array of elements, so a list is the data `map()`ped to JSX:',
        jsx("const fruits = [{ id: 1, name: 'Mango' }, { id: 2, name: 'Guava' }];",
            '',
            '<ul>',
            '  {fruits.map(f => <li key={f.id}>{f.name}</li>)}',
            '</ul>'),
        'To show only some, `filter()` first: `fruits.filter(f => f.ripe).map(…)`.',
        '## Why every item needs a `key`',
        'A **key** is a string or number that identifies an item among its siblings. Between two renders React matches the old items with the new ones **by key**: it then knows which item moved, which is new and which was removed, and it keeps each item\'s DOM element (and the state inside it) with the right item. Without keys React warns in the console: *Each child in a list should have a unique "key" prop*.',
        '## Where keys come from',
        'From the data: a database id, a product code, a slug. A key must be **unique among its siblings** (not across the whole page) and **stable**: the same item gets the same key on every render. Never `Math.random()`: a new key on every render means a brand-new element on every render.',
        '## Why not the index',
        '`key={index}` silences the warning, but the index belongs to the **position**, not to the item. Insert, remove or reorder items and every index after the change moves to another item. React then reuses the wrong elements: text typed into a row\'s input, or a ticked checkbox, stays at its position and ends up next to another item. The index is fine only for a list that never changes order. The example on the right shows it happen; [[q:keys]] is the interview answer.',
        '## The key goes on the outer element',
        'Put the key on the element `map()` returns, `<Row key={p.id} … />`, not on something inside `Row`. React keeps the key for itself: `Row` does not receive it as a prop.'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you loop and append: `for (const f of fruits) { const li = document.createElement("li"); li.textContent = f.name; ul.appendChild(li); }`. When the data changes you usually clear the list and build it again, and the user loses what they typed and where they were. React updates only what changed, and the key is how it knows which `<li>` is which.',
      example: {
        code: `import { useState } from 'react';

const START = [
  { id: 'a', name: 'Asha' },
  { id: 'b', name: 'Vikram' },
  { id: 'c', name: 'Meera' }
];

function Row({ name }) {
  return <li>{name} <input placeholder={'note for ' + name} /></li>;
}

export default function App() {
  const [people, setPeople] = useState(START);
  return (
    <>
      <p>Type a note next to Asha in both lists, then press the button.</p>
      <button onClick={() => setPeople([...people].reverse())}>Reverse both lists</button>
      <div className="cols">
        <div>
          <h4>key = person.id ✅</h4>
          <ul>{people.map(p => <Row key={p.id} name={p.name} />)}</ul>
        </div>
        <div>
          <h4>key = index ❌</h4>
          <ul>{people.map((p, i) => <Row key={i} name={p.name} />)}</ul>
        </div>
      </div>
    </>
  );
}
`,
        css: '.cols { display: flex; gap: 18px; flex-wrap: wrap; } h4 { margin: 10px 0 4px; } ul { padding-left: 18px; margin: 0; } li { margin: 4px 0; } input { width: 110px; }',
        note: 'The button uses `useState`, which [[lesson:r-state-basics]] explains. With `key={p.id}` your note moves with Asha; with `key={i}` it stays in the first row, now next to Meera.'
      },
      challenge: {
        title: 'Only the developers',
        task: 'The `team` array is given. Render a `<ul className="team">` with one `<li>` per person **whose role is `developer`**, each reading `Name (city)`, for example `Vikram (Pune)`.\n\nGive every `<li>` a key from the data (`id`), not the index. The console must stay free of the "unique key" warning.',
        starter: `const team = [
  { id: 101, name: 'Asha', role: 'designer', city: 'Hyderabad' },
  { id: 102, name: 'Vikram', role: 'developer', city: 'Pune' },
  { id: 103, name: 'Meera', role: 'developer', city: 'Chennai' },
  { id: 104, name: 'Ravi', role: 'manager', city: 'Bengaluru' },
  { id: 105, name: 'Sara', role: 'developer', city: 'Kochi' }
];

export default function App() {
  return (
    <ul className="team">
      {team.map(person => <li>{person.name}</li>)}
    </ul>
  );
}
`,
        solution: `const team = [
  { id: 101, name: 'Asha', role: 'designer', city: 'Hyderabad' },
  { id: 102, name: 'Vikram', role: 'developer', city: 'Pune' },
  { id: 103, name: 'Meera', role: 'developer', city: 'Chennai' },
  { id: 104, name: 'Ravi', role: 'manager', city: 'Bengaluru' },
  { id: 105, name: 'Sara', role: 'developer', city: 'Kochi' }
];

export default function App() {
  const developers = team.filter(person => person.role === 'developer');
  return (
    <ul className="team">
      {developers.map(person => (
        <li key={person.id}>{person.name} ({person.city})</li>
      ))}
    </ul>
  );
}
`,
        hints: [
          '`team.filter(person => person.role === \'developer\')` gives a new array with only the developers; `map` that one.',
          'The key goes on the `<li>` that `map` returns: `<li key={person.id}>`.',
          'Text and variables mix freely: `{person.name} ({person.city})`.'
        ],
        checks: [
          { label: 'Three `<li>`: only the developers', count: 'ul.team li', eq: 3 },
          { label: 'They read "Vikram (Pune)", "Meera (Chennai)", "Sara (Kochi)"', fn: `function (doc, win, t) {
  var items = [].map.call(doc.querySelectorAll('ul.team li'), function (li) { return t.text(li); });
  return items.join(' | ') === 'Vikram (Pune) | Meera (Chennai) | Sara (Kochi)' || 'found: ' + (items.join(' | ') || 'none');
}` },
          { label: 'No "unique key" warning in the console', fn: `function (doc, win, t) {
  var w = t.warnings().filter(function (x) { return /unique "key"/.test(x); })[0];
  return !w || 'React warned: ' + w.split('.')[0];
}` },
          { label: 'The key comes from the data (`person.id`), not the index', fn: `function (doc, win, t) {
  var src = t.source();
  if (/key=\\{\\s*(i|idx|index)\\s*\\}/.test(src)) return 'the key is the index';
  return /key=\\{\\s*\\w+\\.id\\s*\\}/.test(src) || 'no key={….id} found';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'r-events', track: 'foundations',
      title: 'Responding to events',
      summary: 'onClick={handleClick} hands React a function to call later; onClick={handleClick()} calls it while rendering. Event objects, preventDefault, and handlers passed as props.',
      keywords: ['events', 'onClick', 'event handler', 'onChange', 'onSubmit', 'onKeyDown', 'preventDefault', 'stopPropagation', 'synthetic event', 'e.target', 'handler as prop', 'bubbling', 'camelCase'],
      docs: 'https://react.dev/learn/responding-to-events', uilt: 'js-events',
      body: [
        'An event handler is a prop, named in camelCase, whose value is a function:',
        jsx('function SaveButton() {',
            '  function handleClick() {',
            "    console.log('Saved');",
            '  }',
            '  return <button onClick={handleClick}>Save</button>;',
            '}'),
        '## Pass the function; do not call it',
        '| You write | What happens |\n|---|---|\n' +
        '| `onClick={handleClick}` | ✅ React calls it on every click |\n' +
        '| `onClick={() => remove(id)}` | ✅ an arrow function that React calls on every click; it calls `remove(id)` |\n' +
        '| `onClick={handleClick()}` | ❌ calls it **while rendering**, once, and hands React its return value (`undefined`) as the handler |',
        'The third is the classic bug: the code runs when the page draws, and never on a click. It is worse when the function sets state: every button then sets it while rendering, the page shows the last button\'s value before anyone clicks, and React warns in the console that one component updated another while rendering. To pass an argument, wrap the call in an arrow function, as in the second row.',
        '## The event object',
        'The handler receives the event: `e.target`, `e.key`, `e.preventDefault()`, `e.stopPropagation()`. It is React\'s **SyntheticEvent**, a wrapper with the same interface as the browser\'s event, the same on every browser; the original is `e.nativeEvent`. React listens once, at the root of your app, and calls your handlers itself: event delegation, done for you. [[q:synthetic-events]] asks about it.',
        jsx("<form onSubmit={e => { e.preventDefault(); save(); }}>",
            "<input onKeyDown={e => { if (e.key === 'Enter') search(); }} />"),
        '## Handlers as props: how events go up',
        'A parent passes a function down, and the child calls it. By convention the prop is named `onSomething` and the parent\'s function `handleSomething`:',
        jsx('function Toolbar({ onPlay }) {',
            '  return <button onClick={onPlay}>Play</button>;',
            '}',
            '',
            "<Toolbar onPlay={() => console.log('playing')} />"),
        'This is the other half of one-way data flow: props carry data down, and calls to handlers carry events up.',
        '## Bubbling',
        'Events bubble in React too: a click on a button inside a `<div onClick>` runs the button\'s handler, then the div\'s. `e.stopPropagation()` stops it there.'
      ].join('\n\n'),
      plainjs: '`btn.addEventListener("click", handleClick)` becomes `<button onClick={handleClick}>`. There is no `addEventListener` and no `removeEventListener`: React adds and removes the listeners as elements appear and disappear. Watch the spelling: in plain JavaScript the property is `onclick`, all lower case, and the event name is `"click"`; in React the prop is `onClick`, camelCase, always. (The UI Learning Tool warns about `onClick` because it is wrong there; here it is the only right spelling.)',
      example: {
        code: `function Toolbar({ onPlay, onStop }) {
  return (
    <div className="toolbar" onClick={() => console.log('the toolbar heard it too (bubbling)')}>
      <button onClick={onPlay}>▶ Play</button>
      <button onClick={e => { e.stopPropagation(); onStop(); }}>■ Stop (does not bubble)</button>
    </div>
  );
}

export default function App() {
  function handlePlay(e) {
    console.log(\`Play clicked: \${e.type} on \${e.target.textContent}\`);
  }
  return (
    <>
      <Toolbar onPlay={handlePlay} onStop={() => console.log('Stop clicked')} />
      <form onSubmit={e => { e.preventDefault(); console.log('submitted, without reloading the page'); }}>
        <input placeholder="Type, then press Enter" />
      </form>
    </>
  );
}
`,
        css: '.toolbar { display: flex; gap: 8px; padding: 8px; border: 1px dashed #aab; border-radius: 8px; margin-bottom: 10px; }',
        note: 'Click both buttons and press Enter in the input, then read the console under the preview.'
      },
      challenge: {
        title: 'Tell the parent what was picked',
        task: 'Fix `ColorButton` and `App`. `ColorButton` takes two props, `color` and `onPick`: it renders a `<button className="swatch">` showing the colour, and a click calls `onPick(color)`.\n\n`App` renders three of them (red, green, blue) and a `<p className="picked">`. Clicking a button must change the paragraph to, for example, `You picked green`. `App` already keeps the choice with `useState` (the next lesson explains it): pass `setPicked` down as `onPick`.\n\nThe starter crashes right away. Read the console to see why.',
        starter: `import { useState } from 'react';

function ColorButton({ color, onPick }) {
  return <button className="swatch" onClick={onPick(color)}>{color}</button>;
}

export default function App() {
  const [picked, setPicked] = useState('nothing');
  return (
    <div>
      <ColorButton color="red" />
      <ColorButton color="green" />
      <ColorButton color="blue" />
      <p className="picked">You picked {picked}</p>
    </div>
  );
}
`,
        solution: `import { useState } from 'react';

function ColorButton({ color, onPick }) {
  return <button className="swatch" onClick={() => onPick(color)}>{color}</button>;
}

export default function App() {
  const [picked, setPicked] = useState('nothing');
  return (
    <div>
      <ColorButton color="red" onPick={setPicked} />
      <ColorButton color="green" onPick={setPicked} />
      <ColorButton color="blue" onPick={setPicked} />
      <p className="picked">You picked {picked}</p>
    </div>
  );
}
`,
        css: '.swatch { margin-right: 6px; padding: 4px 12px; }',
        hints: [
          '`onClick={onPick(color)}` calls `onPick` while rendering. Hand React a function instead: `onClick={() => onPick(color)}`.',
          'The buttons get no `onPick` at all yet: pass it from `App`, `<ColorButton color="red" onPick={setPicked} />`.',
          'It says "You picked blue" before you click anything? Then `onPick(color)` is still being called while rendering: each button sets the state, and blue, the last one, wins.'
        ],
        checks: [
          { label: 'Three `.swatch` buttons: red, green, blue', fn: `function (doc, win, t) {
  var b = [].map.call(doc.querySelectorAll('.swatch'), function (x) { return t.text(x); });
  return b.join(', ') === 'red, green, blue' || 'found: ' + (b.join(', ') || 'none');
}` },
          { label: 'Before any click it says "You picked nothing"', text: '.picked', equals: 'You picked nothing' },
          { label: 'Clicking green says "You picked green"', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.swatch')[1]);
  return t.text('.picked') === 'You picked green' || 'it says "' + t.text('.picked') + '"';
}` },
          { label: 'Clicking blue, then red, ends on "You picked red"', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.swatch')[2]);
  await t.click(doc.querySelectorAll('.swatch')[0]);
  return t.text('.picked') === 'You picked red' || 'it says "' + t.text('.picked') + '"';
}` }
        ]
      }
    },

    /* ------------------------------------------------------------------ 8 */
    {
      id: 'r-state-basics', track: 'foundations',
      title: 'State: a component\'s memory',
      summary: 'useState gives a component a value that survives between renders; calling its setter makes React render the component again with the new value.',
      keywords: ['state', 'useState', 'hook', 'hooks', 'setter', 'setState', 're-render', 'render', 'memory', 'counter', 'local variable', 'toggle'],
      docs: 'https://react.dev/learn/state-a-components-memory', uilt: 'js-todo',
      body: [
        'A plain variable cannot hold anything that changes:',
        jsx('function Counter() {',
            '  let count = 0;                                  // back to 0 every time Counter runs',
            '  return <button onClick={() => count++}>{count}</button>;   // React is never told to draw again',
            '}'),
        'Two problems: the variable starts again at 0 each time React calls the function, and changing it does not make React render again.',
        '## useState',
        'The `useState` **hook** fixes both:',
        jsx("import { useState } from 'react';",
            '',
            'function Counter() {',
            '  const [count, setCount] = useState(0);',
            '  return <button onClick={() => setCount(count + 1)}>{count}</button>;',
            '}'),
        '`useState(0)` returns a pair: the **current value** and a **setter**. React keeps the value for this component between renders; `0` is only the starting value. Calling `setCount(…)` stores the new value and **re-renders**: React calls `Counter` again, `useState` now returns 1, and the button shows 1.',
        '## Each component on the screen has its own',
        'Render `<Counter />` twice and each keeps its own count. State belongs to one component instance on the page, not to the function.',
        '## Several values',
        'Call `useState` once per value:',
        js("const [name, setName] = useState('');",
           'const [open, setOpen] = useState(false);'),
        'Keep only what you cannot work out from other values. A "liked" flag is state; the like count shown next to it can be computed from it on every render.',
        '## Hooks are called at the top level',
        'Functions whose names start with `use` are hooks. Call them at the top of the component, never inside an `if`, a loop or a nested function: React matches each `useState` call to its value **by the order of the calls**. The full rules, and why, are the interview question [[q:rules-of-hooks]]; their lesson comes with the Effects track.',
        '## State and props',
        'Props come from the parent and are read-only; state belongs to the component and changes through its setter. One component\'s state is often its child\'s prop. That is [[q:props-vs-state]].',
        '## Next',
        'Why `setCount(count + 1)` three times in one click adds only 1: [[lesson:r-state-snapshot]]. How to change objects and arrays held in state: [[lesson:r-state-objects]] and [[lesson:r-state-arrays]].'
      ].join('\n\n'),
      plainjs: 'In plain JavaScript you keep the value in a variable and call `render()` yourself after each change: `count++; render();`. The UI Learning Tool\'s todo lesson works this way. `useState` is that variable and that `render()` call joined together: `setCount(5)` stores 5 **and** redraws the component. You never update the DOM yourself, so the page cannot disagree with the data.',
      example: {
        code: `import { useState } from 'react';

function Counter({ label }) {
  const [count, setCount] = useState(0);
  return (
    <div className="counter">
      <span>{label}: <b>{count}</b></span>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  return (
    <div className={dark ? 'page dark' : 'page'}>
      <Counter label="Apples" />
      <Counter label="Oranges" />
      <label>
        <input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} /> Dark mode
      </label>
    </div>
  );
}
`,
        css: '.page { padding: 10px; border-radius: 8px; } .dark { background: #20232a; color: #eee; } .counter { display: flex; gap: 8px; align-items: center; margin: 6px 0; } .counter span { min-width: 110px; }',
        note: 'Two `<Counter />`s, two separate counts: state belongs to each instance on the page.'
      },
      challenge: {
        title: 'A like button',
        task: 'Make the like button work. The `<button className="like">` shows `♡ Like` while not liked and `♥ Liked` once liked, and each click toggles between the two. The `<span className="likes">` next to it shows **41** while not liked and **42** while liked.\n\nKeep one boolean in state with `useState`, and work the number out from it: no second piece of state.',
        starter: `import { useState } from 'react';

function LikeButton() {
  let liked = false;
  return (
    <div>
      <button className="like" onClick={() => { liked = !liked; }}>
        {liked ? '♥ Liked' : '♡ Like'}
      </button>
      <span className="likes">41</span>
    </div>
  );
}

export default function App() {
  return <LikeButton />;
}
`,
        solution: `import { useState } from 'react';

function LikeButton() {
  const [liked, setLiked] = useState(false);
  return (
    <div>
      <button className="like" onClick={() => setLiked(!liked)}>
        {liked ? '♥ Liked' : '♡ Like'}
      </button>
      <span className="likes">{liked ? 42 : 41}</span>
    </div>
  );
}

export default function App() {
  return <LikeButton />;
}
`,
        css: '.like { margin-right: 8px; padding: 4px 12px; } .likes { font-weight: 700; }',
        hints: [
          'Replace `let liked = false` with `const [liked, setLiked] = useState(false);`.',
          'In the click handler, call the setter: `setLiked(!liked)`. Changing a plain variable never redraws anything.',
          'The number needs no state of its own: `{liked ? 42 : 41}`.'
        ],
        checks: [
          { label: 'It starts as "♡ Like", with 41', fn: `function (doc, win, t) {
  return (t.text('.like') === '♡ Like' && t.text('.likes') === '41') || 'it shows "' + t.text('.like') + '" and ' + t.text('.likes');
}` },
          { label: 'One click: "♥ Liked", with 42', fn: `async function (doc, win, t) {
  await t.click('.like');
  return (t.text('.like') === '♥ Liked' && t.text('.likes') === '42') || 'after a click it shows "' + t.text('.like') + '" and ' + t.text('.likes');
}` },
          { label: 'A second click goes back to "♡ Like", with 41', fn: `async function (doc, win, t) {
  await t.click('.like');
  return (t.text('.like') === '♡ Like' && t.text('.likes') === '41') || 'after a second click it shows "' + t.text('.like') + '" and ' + t.text('.likes');
}` },
          { label: 'The liked flag is kept with `useState`', fn: `function (doc, win, t) {
  return /useState\\s*\\(/.test(t.source()) || 'useState is never called';
}` }
        ]
      }
    }
  );
})(window.RLT);
