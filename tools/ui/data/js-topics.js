/*
 * JavaScript reference topics (#/js/<id>). Shape:
 *   id, title, group, summary, description (Markdown),
 *   compare: {java, js, note}  - the same idea written in Java and in JavaScript,
 *   api: [{name, desc}], example: {html, css, js}, tips[], mistakes[], related[], keywords[]
 */
(function (U) {
  U.data.jsTopics = [
    {
      id: 'basics', group: 'Language basics', title: 'Variables, types and equality',
      summary: 'let, const, the seven value types, and why you always write ===.',
      description: 'Variables have no declared type; values do. `const` cannot be reassigned (but a const object can still be changed inside), `let` can. Numbers are all 64-bit floating point. "No value" comes in two flavours: `undefined` (never set) and `null` (deliberately empty). `==` converts types before comparing, so always use `===`.',
      compare: {
        java: 'final String name = "Ravi";\nint count = 0;\ncount++;\nboolean same = "5".equals(String.valueOf(5));\nString msg = "Hi " + name + ", count = " + count;',
        js: 'const name = "Ravi";\nlet count = 0;\ncount++;\nconst same = "5" === String(5);   // true\nconst msg = `Hi ${name}, count = ${count}`;'
      },
      api: [
        { name: 'const x = …', desc: 'A binding that cannot be reassigned (like `final`).' },
        { name: 'let x = …', desc: 'A reassignable, block-scoped variable.' },
        { name: 'typeof x', desc: '"number", "string", "boolean", "undefined", "object", "function", "bigint" or "symbol".' },
        { name: 'a === b', desc: 'Strict equality: same type and same value. Use this, never `==`.' },
        { name: '`text ${expr}`', desc: 'A template literal: string interpolation, can span lines.' },
        { name: 'Number(s) / String(n)', desc: 'Explicit conversion. `Number("12px")` is `NaN` (not a number).' },
        { name: 'a ?? b', desc: '`b` if `a` is null or undefined, otherwise `a`.' },
        { name: 'obj?.prop', desc: 'Optional chaining: `undefined` instead of an error when `obj` is null.' }
      ],
      example: {
        html: '<p>See the console.</p>',
        js: 'let x = 5;\nconsole.log(typeof x, typeof "hi", typeof true, typeof undefined, typeof null);\nconsole.log("5" == 5, "5" === 5);\nconsole.log(0.1 + 0.2);       // floating point, as in Java doubles\nconsole.log(Number("42") + 1, "42" + 1);\nconst user = null;\nconsole.log(user?.name ?? "no user");'
      },
      tips: ['`typeof null` is "object" - a famous historical bug.'],
      mistakes: ['`"2" + 2` is `"22"`: `+` with a string concatenates. Convert input values with `Number()` first.'],
      related: ['functions', 'arrays', 'lesson:js-basics'],
      keywords: ['let', 'const', 'var', 'types', 'typeof', '===', 'equality', 'null', 'undefined', 'template literal']
    },
    {
      id: 'functions', group: 'Language basics', title: 'Functions and arrow functions',
      summary: 'Declarations, arrow functions (lambdas), default parameters, and functions as values.',
      description: 'Functions are values: you can store them in variables, pass them to other functions and return them - which is how event listeners and array methods work. Arrow functions are the short form, like Java lambdas. A function declaration (`function name() {}`) is hoisted: usable before the line that defines it.',
      compare: {
        java: 'int add(int a, int b) {\n  return a + b;\n}\nFunction<Integer, Integer> square = x -> x * x;\nList.of(1, 2, 3).forEach(n -> System.out.println(n));',
        js: 'function add(a, b) {\n  return a + b;\n}\nconst square = x => x * x;\n[1, 2, 3].forEach(n => console.log(n));'
      },
      api: [
        { name: 'function f(a, b) { … }', desc: 'A function declaration.' },
        { name: '(a, b) => a + b', desc: 'An arrow function with an implicit return.' },
        { name: 'x => { …; return y; }', desc: 'An arrow function with a body.' },
        { name: 'function f(a, b = 10)', desc: 'A default parameter value.' },
        { name: 'function f(...items)', desc: 'Rest parameters: all remaining arguments as an array (like Java varargs).' }
      ],
      example: {
        html: '<p>See the console.</p>',
        js: 'function greet(name = "stranger") {\n  return "Hello, " + name;\n}\nconst shout = s => s.toUpperCase() + "!";\nconsole.log(greet(), greet("Ravi"));\nconsole.log(shout(greet("Asha")));\n\nfunction applyTwice(fn, x) { return fn(fn(x)); }\nconsole.log(applyTwice(n => n * 3, 2));'
      },
      mistakes: ['Calling with too few arguments is not an error: missing parameters are `undefined`.'],
      related: ['basics', 'arrays', 'events'],
      keywords: ['function', 'arrow function', 'lambda', 'callback', 'parameters', 'return']
    },
    {
      id: 'arrays', group: 'Language basics', title: 'Arrays and objects',
      summary: 'Arrays (≈ List) with map/filter/reduce (≈ streams), and objects (≈ Map or record).',
      description: 'Arrays grow and shrink like an `ArrayList` and can hold anything. Their methods `map`, `filter`, `reduce`, `find` and `some` work like Java streams, without the `.stream()` and `.collect()`. Objects are bags of named properties, written with `{ }`; `JSON` is just this syntax as text.',
      compare: {
        java: 'List<Integer> nums = new ArrayList<>(List.of(3, 1, 2));\nnums.add(4);\nList<Integer> big = nums.stream().filter(n -> n > 2).toList();\nint total = nums.stream().mapToInt(n -> n).sum();\nMap<String, Object> user = Map.of("name", "Asha", "age", 31);',
        js: 'const nums = [3, 1, 2];\nnums.push(4);\nconst big = nums.filter(n => n > 2);\nconst total = nums.reduce((s, n) => s + n, 0);\nconst user = { name: "Asha", age: 31 };'
      },
      api: [
        { name: 'arr.push(x) / arr.pop()', desc: 'Add to / remove from the end.' },
        { name: 'arr.length', desc: 'The number of items.' },
        { name: 'arr.map(fn)', desc: 'A new array with fn applied to each item.' },
        { name: 'arr.filter(fn)', desc: 'A new array with the items for which fn returns true.' },
        { name: 'arr.reduce(fn, start)', desc: 'Fold the array into one value.' },
        { name: 'arr.find(fn) / arr.some(fn)', desc: 'The first matching item / whether any matches.' },
        { name: 'arr.includes(x)', desc: 'Whether the array contains x.' },
        { name: 'obj.key / obj["key"]', desc: 'Read a property.' },
        { name: 'Object.keys(obj)', desc: 'The property names, as an array.' },
        { name: 'const { name } = user', desc: 'Destructuring: pull properties into variables.' },
        { name: '[...a, ...b] / { ...obj }', desc: 'Spread: copy or combine arrays and objects.' }
      ],
      example: {
        html: '<p>See the console.</p>',
        js: 'const people = [\n  { name: "Asha", role: "admin", age: 31 },\n  { name: "Vikram", role: "dev", age: 27 },\n  { name: "Meera", role: "dev", age: 35 }\n];\nconst devs = people.filter(p => p.role === "dev").map(p => p.name);\nconsole.log(devs);\nconsole.log(people.reduce((sum, p) => sum + p.age, 0) / people.length);\nconst { name, age } = people[0];\nconsole.log(name, age, Object.keys(people[0]));'
      },
      related: ['basics', 'json', 'lesson:js-basics'],
      keywords: ['array', 'list', 'map', 'filter', 'reduce', 'object', 'destructuring', 'spread']
    },
    {
      id: 'select', group: 'The DOM', title: 'Selecting elements',
      summary: 'querySelector, querySelectorAll and getElementById: find elements with CSS selectors.',
      description: 'Any CSS selector works. `querySelector` returns the first match or `null`; `querySelectorAll` returns a static `NodeList` you can loop over with `forEach`. You can also search inside an element: `card.querySelector(".title")`.',
      compare: {
        java: 'Element h1 = (Element) doc.getElementsByTagName("h1").item(0);\nNodeList items = (NodeList) xpath.evaluate("//li[@class=\'item\']", doc, XPathConstants.NODESET);',
        js: 'const h1 = document.querySelector("h1");\nconst items = document.querySelectorAll("li.item");\nitems.forEach(li => console.log(li.textContent));'
      },
      api: [
        { name: 'document.querySelector(sel)', desc: 'The first element matching the CSS selector, or `null`.' },
        { name: 'document.querySelectorAll(sel)', desc: 'All matches, as a NodeList (supports `forEach` and `length`).' },
        { name: 'document.getElementById(id)', desc: 'The element with that id (no `#`).' },
        { name: 'el.closest(sel)', desc: 'The nearest ancestor (or itself) matching sel.' },
        { name: 'el.matches(sel)', desc: 'Whether the element matches sel.' },
        { name: 'el.children / el.parentElement', desc: 'Navigate the tree.' }
      ],
      example: {
        html: '<ul id="menu">\n  <li class="item">Home</li>\n  <li class="item active">Blog</li>\n  <li class="item">About</li>\n</ul>',
        js: 'const active = document.querySelector("#menu .active");\nconsole.log("active:", active.textContent);\n\nconst items = document.querySelectorAll(".item");\nconsole.log(items.length, "items");\nitems.forEach((li, i) => console.log(i, li.textContent));\n\nconsole.log(active.closest("ul").id);\nconsole.log(document.querySelector(".missing"));  // null'
      },
      mistakes: ['Using the result of `querySelector` without checking for `null` when the element might not exist.', 'Running the script before the element exists in the page (script in `<head>` without `defer`).'],
      related: ['change', 'classes', 'explain:specificity', 'lesson:js-dom'],
      keywords: ['querySelector', 'querySelectorAll', 'getElementById', 'find element', 'select', 'closest']
    },
    {
      id: 'change', group: 'The DOM', title: 'Changing text and HTML',
      summary: 'textContent for text (safe), innerHTML for markup (careful), and value for form fields.',
      description: '`textContent` reads or replaces all the text inside an element; whatever you assign is shown literally, so it is safe for user input. `innerHTML` parses its value as HTML: powerful, but never use it with text a user typed - that is how script injection (XSS) happens.',
      compare: {
        java: 'element.setTextContent("Hello");\nString text = element.getTextContent();',
        js: 'el.textContent = "Hello";\nconst text = el.textContent;\nel.innerHTML = "<b>Bold</b> text";   // parses HTML'
      },
      api: [
        { name: 'el.textContent', desc: 'All text inside, read or write. Safe.' },
        { name: 'el.innerHTML', desc: 'The HTML inside, read or write. Never with user input.' },
        { name: 'input.value', desc: 'The current value of a form field (always a string).' },
        { name: 'el.insertAdjacentHTML(pos, html)', desc: 'Insert HTML at "beforebegin", "afterbegin", "beforeend" or "afterend".' }
      ],
      example: {
        html: '<p id="a">Original</p>\n<p id="b">Original</p>',
        js: 'const typed = "<img src=x onerror=alert(1)> hello";\ndocument.querySelector("#a").textContent = typed;  // shown as text: safe\ndocument.querySelector("#b").innerHTML = "<b>bold</b> via innerHTML";\nconsole.log(document.querySelector("#b").textContent);'
      },
      related: ['select', 'create', 'forms'],
      keywords: ['textContent', 'innerHTML', 'innerText', 'change text', 'xss', 'value']
    },
    {
      id: 'classes', group: 'The DOM', title: 'Classes and styles',
      summary: 'classList.add/remove/toggle to switch looks defined in CSS; el.style for one-off values.',
      description: 'Best practice: keep the looks in CSS and let JavaScript switch classes. `el.style` sets inline styles, using camelCase names (`backgroundColor`), and is fine for values computed in JS, such as a position or a width.',
      compare: {
        java: 'button.setBackground(Color.RED);\nlabel.setVisible(false);',
        js: 'button.classList.add("danger");      // CSS: .danger { background: red; }\nlabel.hidden = true;\nbox.style.width = percent + "%";'
      },
      api: [
        { name: 'el.classList.add(c) / remove(c)', desc: 'Add or remove a class.' },
        { name: 'el.classList.toggle(c, force?)', desc: 'Flip a class; returns whether it is now present.' },
        { name: 'el.classList.contains(c)', desc: 'Whether the element has the class.' },
        { name: 'el.style.prop = "value"', desc: 'Set an inline style (camelCase property names).' },
        { name: 'getComputedStyle(el).prop', desc: 'The final value after all CSS rules.' },
        { name: 'el.hidden = true', desc: 'Hide the element (the `hidden` attribute).' }
      ],
      example: {
        html: '<div class="box">Click me</div>',
        css: '.box {\n  padding: 20px;\n  background: #eef1fb;\n  cursor: pointer;\n  transition: background .3s;\n}\n.box.on {\n  background: #ff7a1a;\n  color: white;\n}',
        js: 'const box = document.querySelector(".box");\nbox.addEventListener("click", () => {\n  const on = box.classList.toggle("on");\n  box.textContent = on ? "On!" : "Click me";\n  console.log(getComputedStyle(box).backgroundColor);\n});'
      },
      related: ['select', 'events', 'css:transition', 'lesson:js-capstone'],
      keywords: ['classList', 'toggle', 'add class', 'style', 'inline style', 'hidden']
    },
    {
      id: 'attributes', group: 'The DOM', title: 'Attributes and data-*',
      summary: 'Read and write attributes, and keep your own data on elements with data-* and dataset.',
      description: 'Most attributes are also properties: `img.src`, `a.href`, `input.disabled`. For anything else use `getAttribute`/`setAttribute`. Attributes starting with `data-` are yours; read them through `el.dataset` with camelCase names (`data-user-id` → `dataset.userId`).',
      compare: {
        java: 'element.setAttribute("alt", "A cat");\nString id = element.getAttribute("data-user-id");',
        js: 'img.setAttribute("alt", "A cat");   // or img.alt = "A cat"\nconst id = row.dataset.userId;       // from data-user-id'
      },
      api: [
        { name: 'el.getAttribute(name)', desc: 'The attribute\'s text value, or null.' },
        { name: 'el.setAttribute(name, value)', desc: 'Set an attribute.' },
        { name: 'el.removeAttribute(name)', desc: 'Remove it.' },
        { name: 'el.hasAttribute(name)', desc: 'Whether it is present.' },
        { name: 'el.dataset.someName', desc: 'Read/write the `data-some-name` attribute.' }
      ],
      example: {
        html: '<button data-product-id="42" data-price="499">Buy</button>',
        js: 'const btn = document.querySelector("button");\nconsole.log(btn.dataset.productId, Number(btn.dataset.price) * 2);\nbtn.dataset.state = "clicked";\nconsole.log(btn.outerHTML);'
      },
      related: ['select', 'change', 'html:div'],
      keywords: ['attribute', 'getAttribute', 'setAttribute', 'dataset', 'data-']
    },
    {
      id: 'create', group: 'The DOM', title: 'Creating and removing elements',
      summary: 'createElement, append, prepend, remove - build parts of the page from data.',
      description: 'Create an element, fill it, then attach it. Until it is appended it is not on the page. To render a list from data, loop over the array and append one element per item - or build a `DocumentFragment` first when there are many.',
      compare: {
        java: 'Element li = doc.createElement("li");\nli.setTextContent("New item");\nlist.appendChild(li);\nlist.removeChild(li);',
        js: 'const li = document.createElement("li");\nli.textContent = "New item";\nlist.append(li);\nli.remove();'
      },
      api: [
        { name: 'document.createElement(tag)', desc: 'A new, detached element.' },
        { name: 'parent.append(...nodes)', desc: 'Add at the end (strings become text).' },
        { name: 'parent.prepend(...nodes)', desc: 'Add at the start.' },
        { name: 'el.before(node) / el.after(node)', desc: 'Insert next to an element.' },
        { name: 'el.remove()', desc: 'Remove the element from the page.' },
        { name: 'el.replaceChildren(...nodes)', desc: 'Replace all children (empty it with no arguments).' },
        { name: 'el.cloneNode(true)', desc: 'A deep copy.' }
      ],
      example: {
        html: '<ul id="list"></ul>',
        js: 'const fruits = ["Apple", "Banana", "Mango"];\nconst list = document.querySelector("#list");\nfruits.forEach(f => {\n  const li = document.createElement("li");\n  li.textContent = f;\n  list.append(li);\n});\nlist.firstElementChild.remove();\nconsole.log(list.children.length, "items left");'
      },
      related: ['change', 'events', 'lesson:js-todo'],
      keywords: ['createElement', 'append', 'appendChild', 'remove', 'insert', 'render list']
    },
    {
      id: 'events', group: 'Events', title: 'Listening to events',
      summary: 'addEventListener and the events you will use every day.',
      description: 'Register a function for an event type on an element. Several listeners can listen to the same event. Common events: `click`, `input` (every keystroke), `change` (value committed), `submit` (on forms), `keydown`, `mouseover`/`mouseout`, `focus`/`blur`, `scroll`, and `DOMContentLoaded` (the page is parsed).',
      compare: {
        java: 'button.addActionListener(e -> {\n  System.out.println("clicked");\n});',
        js: 'button.addEventListener("click", (e) => {\n  console.log("clicked");\n});'
      },
      api: [
        { name: 'el.addEventListener(type, fn)', desc: 'Call fn when the event happens.' },
        { name: 'el.removeEventListener(type, fn)', desc: 'Stop listening (pass the same function).' },
        { name: '{ once: true }', desc: 'Third argument: run only the first time.' },
        { name: 'click / dblclick', desc: 'Mouse click (also Enter/Space on buttons).' },
        { name: 'input / change', desc: 'Field value changing / committed.' },
        { name: 'submit', desc: 'A form is being submitted.' },
        { name: 'keydown / keyup', desc: 'A key is pressed / released (`e.key`).' },
        { name: 'mouseover / mouseout', desc: 'The pointer enters / leaves.' }
      ],
      example: {
        html: '<input id="field" placeholder="Type here">\n<button id="btn">Click</button>\n<p id="log"></p>',
        js: 'const log = document.querySelector("#log");\ndocument.querySelector("#btn").addEventListener("click", () => log.textContent = "clicked at " + new Date().toLocaleTimeString());\ndocument.querySelector("#field").addEventListener("input", e => log.textContent = "typed: " + e.target.value);\ndocument.querySelector("#field").addEventListener("keydown", e => console.log("key:", e.key));'
      },
      tips: ['Inline `onclick="…"` attributes work, but `addEventListener` keeps JavaScript out of the HTML and allows several listeners.'],
      related: ['event-object', 'forms', 'lesson:js-events'],
      keywords: ['addEventListener', 'click', 'event', 'listener', 'handler', 'keydown', 'input event', 'onclick']
    },
    {
      id: 'event-object', group: 'Events', title: 'The event object, bubbling and delegation',
      summary: 'event.target, preventDefault, stopPropagation, and one listener for many elements.',
      description: 'Your listener receives an event object describing what happened. Events **bubble**: a click on a `<button>` inside an `<li>` inside a `<ul>` reaches the button\'s listeners first, then the li\'s, then the ul\'s. That lets one listener on a container handle every child - even ones added later. This is called **event delegation**.',
      compare: {
        java: 'list.addMouseListener(new MouseAdapter() {\n  public void mouseClicked(MouseEvent e) {\n    int index = list.locationToIndex(e.getPoint());\n  }\n});',
        js: 'list.addEventListener("click", (e) => {\n  const li = e.target.closest("li");\n  if (li) console.log("clicked", li.textContent);\n});'
      },
      api: [
        { name: 'e.target', desc: 'The element where the event started (e.g. the inner button).' },
        { name: 'e.currentTarget', desc: 'The element whose listener is running.' },
        { name: 'e.preventDefault()', desc: 'Cancel the default action: following a link, submitting a form, typing a character.' },
        { name: 'e.stopPropagation()', desc: 'Stop the event bubbling further up. Rarely needed.' },
        { name: 'e.key', desc: 'For keyboard events: "a", "Enter", "ArrowUp"…' }
      ],
      example: {
        html: '<ul id="list">\n  <li>One <button>✕</button></li>\n  <li>Two <button>✕</button></li>\n</ul>\n<a href="https://example.com" id="link">A link that will not navigate</a>',
        js: 'document.querySelector("#list").addEventListener("click", (e) => {\n  console.log("target:", e.target, "currentTarget:", e.currentTarget);\n  if (e.target.matches("button")) e.target.closest("li").remove();\n});\ndocument.querySelector("#link").addEventListener("click", (e) => {\n  e.preventDefault();\n  console.log("navigation prevented");\n});'
      },
      related: ['events', 'create', 'explain:bubbling', 'lesson:js-todo'],
      keywords: ['event.target', 'preventDefault', 'bubbling', 'delegation', 'stopPropagation', 'closest']
    },
    {
      id: 'forms', group: 'Events', title: 'Reading forms',
      summary: 'Values, checkboxes, the submit event and FormData.',
      description: 'Listen for `submit` on the form (it covers both the button and Enter) and call `preventDefault()` if you handle it in JavaScript. `form.elements.name` gets a field by its `name`. Values are strings; checkboxes have `.checked`.',
      compare: {
        java: '@PostMapping("/signup")\nString signup(@RequestParam String email,\n              @RequestParam(defaultValue = "false") boolean agree) { … }',
        js: 'form.addEventListener("submit", (e) => {\n  e.preventDefault();\n  const email = form.elements.email.value;\n  const agree = form.elements.agree.checked;\n  const all = Object.fromEntries(new FormData(form));\n});'
      },
      api: [
        { name: 'form.elements.someName', desc: 'A field by its name attribute.' },
        { name: 'input.value', desc: 'The text (a string).' },
        { name: 'input.valueAsNumber', desc: 'For number/range/date inputs: the value as a number.' },
        { name: 'checkbox.checked', desc: 'true or false.' },
        { name: 'new FormData(form)', desc: 'Every named field; pass it to fetch or `Object.fromEntries`.' },
        { name: 'form.reset()', desc: 'Restore the starting values.' },
        { name: 'form.checkValidity()', desc: 'Run the built-in validation (required, type, pattern…).' }
      ],
      example: {
        html: '<form id="f">\n  <input name="email" type="email" placeholder="Email" required>\n  <label><input name="agree" type="checkbox"> I agree</label>\n  <button>Send</button>\n</form>',
        js: 'const form = document.querySelector("#f");\nform.addEventListener("submit", (e) => {\n  e.preventDefault();\n  console.log(form.elements.email.value, form.elements.agree.checked);\n  console.log(Object.fromEntries(new FormData(form)));\n});'
      },
      related: ['events', 'html:form', 'html:input', 'lesson:js-forms'],
      keywords: ['form', 'submit', 'value', 'checked', 'FormData', 'preventDefault', 'validation']
    },
    {
      id: 'timers', group: 'Events', title: 'Timers: setTimeout and setInterval',
      summary: 'Run code later, or repeatedly - without blocking the page.',
      description: 'JavaScript in the page runs on one thread; a long loop freezes everything. Timers schedule work for later instead. `setTimeout` runs once after a delay; `setInterval` repeats. Both return an id you can pass to `clearTimeout` / `clearInterval`.',
      compare: {
        java: 'ScheduledExecutorService ex = Executors.newSingleThreadScheduledExecutor();\nex.schedule(() -> show(), 2, TimeUnit.SECONDS);\nex.scheduleAtFixedRate(() -> tick(), 0, 1, TimeUnit.SECONDS);',
        js: 'setTimeout(() => show(), 2000);\nconst id = setInterval(() => tick(), 1000);\nclearInterval(id);   // stop it'
      },
      api: [
        { name: 'setTimeout(fn, ms)', desc: 'Run fn once after ms milliseconds.' },
        { name: 'setInterval(fn, ms)', desc: 'Run fn every ms milliseconds.' },
        { name: 'clearTimeout(id) / clearInterval(id)', desc: 'Cancel.' },
        { name: 'requestAnimationFrame(fn)', desc: 'Run fn before the next screen paint - for smooth animation.' }
      ],
      example: {
        html: '<p>Seconds: <b id="s">0</b></p>\n<button id="stop">Stop</button>',
        js: 'let n = 0;\nconst id = setInterval(() => {\n  document.querySelector("#s").textContent = ++n;\n}, 1000);\ndocument.querySelector("#stop").addEventListener("click", () => {\n  clearInterval(id);\n  console.log("stopped at", n);\n});\nsetTimeout(() => console.log("2 seconds passed"), 2000);'
      },
      related: ['events', 'fetch', 'explain:event-loop', 'css:animation'],
      keywords: ['setTimeout', 'setInterval', 'timer', 'delay', 'schedule', 'clock']
    },
    {
      id: 'storage', group: 'Data & the network', title: 'localStorage',
      summary: 'Keep small amounts of data in the browser, across page reloads.',
      description: '`localStorage` is a key-value store per website, kept until the user clears it (about 5 MB). It stores strings only - use `JSON.stringify` and `JSON.parse` for objects. `sessionStorage` is the same but forgets when the tab closes. (In this tool\'s previews, storage is kept for the preview pages only.)',
      compare: {
        java: 'Preferences prefs = Preferences.userRoot().node("myapp");\nprefs.put("theme", "dark");\nString theme = prefs.get("theme", "light");',
        js: 'localStorage.setItem("theme", "dark");\nconst theme = localStorage.getItem("theme") ?? "light";'
      },
      api: [
        { name: 'localStorage.setItem(k, v)', desc: 'Save a string.' },
        { name: 'localStorage.getItem(k)', desc: 'Read it back, or `null`.' },
        { name: 'localStorage.removeItem(k)', desc: 'Delete one key.' },
        { name: 'localStorage.clear()', desc: 'Delete everything for this site.' },
        { name: 'JSON.stringify(obj) / JSON.parse(s)', desc: 'Store objects as text and get them back.' }
      ],
      example: {
        html: '<p>Visits: <b id="v"></b> (re-run with ▶ to count up)</p>\n<button id="reset">Reset</button>',
        js: 'const visits = Number(localStorage.getItem("visits") || 0) + 1;\nlocalStorage.setItem("visits", visits);\ndocument.querySelector("#v").textContent = visits;\ndocument.querySelector("#reset").addEventListener("click", () => {\n  localStorage.removeItem("visits");\n  console.log("reset");\n});\nlocalStorage.setItem("prefs", JSON.stringify({ theme: "dark", size: 16 }));\nconsole.log(JSON.parse(localStorage.getItem("prefs")).theme);'
      },
      mistakes: ['Storing passwords or tokens there: any script on the page can read it.', 'Forgetting it stores strings: `localStorage.setItem("n", 1)` gives back `"1"`.'],
      related: ['json', 'lesson:js-capstone'],
      keywords: ['localStorage', 'sessionStorage', 'storage', 'persist', 'save data']
    },
    {
      id: 'json', group: 'Data & the network', title: 'JSON',
      summary: 'The text format for data on the web: JSON.stringify and JSON.parse.',
      description: 'JSON (JavaScript Object Notation) is object/array syntax as text, with double-quoted keys and no functions. Every REST API you have built with Spring speaks it. In JavaScript, converting is one call each way.',
      compare: {
        java: 'ObjectMapper om = new ObjectMapper();\nString json = om.writeValueAsString(user);\nUser u = om.readValue(json, User.class);',
        js: 'const json = JSON.stringify(user);\nconst u = JSON.parse(json);'
      },
      api: [
        { name: 'JSON.stringify(value)', desc: 'Object/array → JSON text.' },
        { name: 'JSON.stringify(value, null, 2)', desc: 'Pretty-printed, indented by 2.' },
        { name: 'JSON.parse(text)', desc: 'JSON text → object/array. Throws on invalid JSON.' },
        { name: 'await response.json()', desc: 'Parse a fetch response body.' }
      ],
      example: {
        html: '<pre id="out"></pre>',
        js: 'const order = { id: 7, items: ["tea", "samosa"], paid: false, total: 60 };\nconst text = JSON.stringify(order, null, 2);\ndocument.querySelector("#out").textContent = text;\nconst back = JSON.parse(text);\nconsole.log(back.items.length, typeof back.paid);\ntry { JSON.parse("{bad json}"); } catch (e) { console.warn("Invalid:", e.message); }'
      },
      related: ['fetch', 'storage', 'arrays'],
      keywords: ['json', 'stringify', 'parse', 'serialize', 'jackson']
    },
    {
      id: 'fetch', group: 'Data & the network', title: 'fetch and async/await',
      summary: 'Call HTTP APIs from the page, wait for the answer without freezing, and handle errors.',
      description: '`fetch(url, options)` sends an HTTP request and returns a Promise of a `Response`. Inside an `async` function, `await` waits for it. A 404 or 500 does **not** throw - check `response.ok`. Network failures do throw. Previews here include a pretend server: `/api/users`, `/api/users/1`, `/api/todos` (GET, POST), `/api/hello?name=…`, `/api/slow`, `/api/error`.',
      compare: {
        java: 'ResponseEntity<User[]> r = restTemplate.getForEntity("/api/users", User[].class);\nif (r.getStatusCode().is2xxSuccessful()) render(r.getBody());\n\nCompletableFuture<User[]> f = webClient.get().uri("/api/users")\n    .retrieve().bodyToMono(User[].class).toFuture();',
        js: 'async function load() {\n  const r = await fetch("/api/users");\n  if (!r.ok) throw new Error("HTTP " + r.status);\n  const users = await r.json();\n  render(users);\n}'
      },
      api: [
        { name: 'fetch(url)', desc: 'GET request; resolves to a Response.' },
        { name: 'fetch(url, { method, headers, body })', desc: 'Any method. Send JSON with `body: JSON.stringify(data)` and a Content-Type header.' },
        { name: 'response.ok / response.status', desc: 'Whether the status is 200-299 / the status code.' },
        { name: 'await response.json()', desc: 'The body parsed as JSON.' },
        { name: 'async function f() { … }', desc: 'A function that can `await`; it returns a Promise.' },
        { name: 'try { await … } catch (e) { … }', desc: 'Handle errors from awaited calls.' },
        { name: 'Promise.all([p1, p2])', desc: 'Wait for several requests in parallel.' }
      ],
      example: {
        html: '<button id="go">Load users</button>\n<button id="bad">Call /api/error</button>\n<ul id="out"></ul>',
        js: 'const out = document.querySelector("#out");\ndocument.querySelector("#go").addEventListener("click", async () => {\n  const res = await fetch("/api/users");\n  const users = await res.json();\n  out.replaceChildren(...users.map(u => {\n    const li = document.createElement("li");\n    li.textContent = `${u.name} (${u.role})`;\n    return li;\n  }));\n});\ndocument.querySelector("#bad").addEventListener("click", async () => {\n  const res = await fetch("/api/error");\n  console.log(res.ok, res.status, await res.json());\n});'
      },
      mistakes: ['Forgetting `await`: you get a pending Promise instead of the data.', 'Assuming a 404/500 throws. It does not; check `response.ok`.'],
      related: ['json', 'explain:event-loop', 'lesson:js-fetch'],
      keywords: ['fetch', 'ajax', 'http', 'api', 'rest', 'async', 'await', 'promise', 'request']
    }
  ];
})(window.UILT);
