/*
 * Lessons, track 3: JavaScript. Lesson shape: see lessons-html.js.
 * Behaviour checks ({fn: ...}) run in a freshly loaded preview each time, so clicks in one check
 * never leak into the next.
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];
  var M = ['html', 'css', 'js'];

  L.push(
    {
      id: 'js-basics', track: 'JavaScript', modes: ['js', 'html'],
      title: 'JavaScript for a Java developer',
      summary: 'Variables, types, functions, arrays and objects - mapped onto what you already know from Java.',
      keywords: ['javascript', 'let', 'const', 'function', 'arrow function', 'array', 'object', '===', 'types'],
      body: [
        'JavaScript looks like Java and is not Java. The syntax (braces, `if`, `for`, `while`, `return`) will feel familiar; the type system will not.',
        '## Variables',
        '```js\nconst name = "Ravi";   // cannot be reassigned - like final\nlet count = 0;         // can be reassigned\n// var: the old way, avoid it\n```',
        'There are no type declarations: the *value* has a type, the variable does not. `typeof` tells you: `"number"`, `"string"`, `"boolean"`, `"object"`, `"undefined"`, `"function"`. There is one number type (a double), and two "nothings": `null` and `undefined`.',
        '## Equality',
        'Always use `===` and `!==`. The double `==` converts types first: `"5" == 5` is `true`. `===` compares like Java\'s `==` for primitives, and strings compare by value.',
        '## Functions',
        '```js\nfunction add(a, b) {          // a declaration\n  return a + b;\n}\nconst square = x => x * x;     // an arrow function, like a Java lambda\nconsole.log(`2 + 3 = ${add(2, 3)}`);  // template literal: string interpolation\n```',
        '## Arrays and objects',
        '```js\nconst nums = [3, 1, 2];                  // like a List\nnums.push(4);\nconst doubled = nums.map(n => n * 2);    // like stream().map()\nconst total = nums.reduce((s, n) => s + n, 0);\n\nconst user = { name: "Asha", age: 31 };  // like a Map or a record\nconsole.log(user.name, user["age"]);\n```',
        '`console.log(...)` prints to the console panel under the preview - your `System.out.println`.'
      ].join('\n\n'),
      java: '`const` ≈ `final`, arrow functions ≈ lambdas, `array.map/filter/reduce` ≈ streams, objects ≈ `Map<String, Object>` with dot access. No compiler: mistakes show up only when the line runs, as errors in the console.',
      example: {
        html: '<p>Open the console below the preview.</p>',
        js: 'const prices = [120, 80, 45];\nconst total = prices.reduce((sum, p) => sum + p, 0);\nconsole.log("Total:", total);\n\nconst user = { name: "Asha", skills: ["Java", "SQL"] };\nconsole.log(`${user.name} knows ${user.skills.length} languages`);\n\nconsole.log("5" == 5, "5" === 5);  // true false\nconsole.log(typeof 42, typeof "hi", typeof null);'
      },
      related: ['js:basics', 'js:arrays', 'js:functions'],
      challenge: {
        title: 'An average function',
        task: '1. Write a **function declaration** `function average(numbers) { … }` that returns the average of an array of numbers.\n2. Print the average of `[4, 8, 15, 16, 23, 42]` with `console.log`.\n3. Put that result into the `<span id="result">` (use `document.getElementById("result").textContent = …`).',
        starter: { html: '<p>The average is <span id="result">?</span></p>', js: '// write function average(numbers) here\n\n' },
        solution: {
          html: '<p>The average is <span id="result">?</span></p>',
          js: 'function average(numbers) {\n  const sum = numbers.reduce((s, n) => s + n, 0);\n  return sum / numbers.length;\n}\n\nconst avg = average([4, 8, 15, 16, 23, 42]);\nconsole.log(avg);\ndocument.getElementById("result").textContent = avg;'
        },
        hints: ['Sum with a loop or `numbers.reduce((s, n) => s + n, 0)`, then divide by `numbers.length`.', 'Write it as `function average(numbers) { … }` - a function declaration - so the checker can call it.'],
        checks: [
          { label: '`average` is a function', fn: 'function (doc, win) { return typeof win.average === "function" || "no function called average (declare it with: function average(numbers) { ... })"; }' },
          { label: '`average([2, 4])` returns 3', fn: 'function (doc, win) { if (typeof win.average !== "function") return "no average function yet"; var r = win.average([2, 4]); return r === 3 || ("it returned " + r); }' },
          { label: '`average([10])` returns 10', fn: 'function (doc, win) { if (typeof win.average !== "function") return "no average function yet"; var r = win.average([10]); return r === 10 || ("it returned " + r); }' },
          { label: 'The page shows 18', text: '#result', equals: '18' },
          { label: 'Uses `console.log`', source: 'js', match: 'console\\.log\\s*\\(' }
        ]
      }
    },
    {
      id: 'js-dom', track: 'JavaScript', modes: M,
      title: 'Selecting and changing elements',
      summary: 'Find elements with querySelector, then change their text, classes, styles and attributes.',
      keywords: ['dom', 'querySelector', 'textContent', 'classList', 'innerHTML', 'getElementById', 'setAttribute'],
      body: [
        'JavaScript sees the page as the DOM tree (see the [[explain:dom-tree]] explainer). You find elements with CSS selectors:',
        '```js\nconst title = document.querySelector("h1");        // first match, or null\nconst items = document.querySelectorAll(".item");  // all matches (a NodeList)\nconst box   = document.getElementById("box");      // by id\n```',
        '## Changing them',
        '```js\ntitle.textContent = "Hello!";        // the text (safe)\nbox.innerHTML = "<b>bold</b>";       // parse HTML - never with user input!\nbox.classList.add("highlight");      // also remove, toggle, contains\nbox.style.backgroundColor = "gold";  // inline style; CSS names in camelCase\nimg.setAttribute("alt", "A cat");    // or simply img.alt = "A cat"\n```',
        '`querySelectorAll` returns a list; loop over it with `forEach`:',
        '```js\ndocument.querySelectorAll(".item").forEach(el => el.classList.add("done"));\n```',
        'Prefer toggling **classes** over setting styles one by one: the look stays in CSS, the logic in JS.',
        'Scripts must run *after* the elements exist. The tool runs your JS at the end of `<body>`, so they do. In your own pages, put `<script src="app.js" defer>` in `<head>`.'
      ].join('\n\n'),
      java: 'Exactly the `org.w3c.dom` model: `document.querySelector` ≈ an XPath lookup, `textContent` ≈ `Node.getTextContent()`, `setAttribute` ≈ `Element.setAttribute()`.',
      example: {
        html: '<h1>Hello</h1>\n<ul>\n  <li class="item">One</li>\n  <li class="item">Two</li>\n</ul>',
        css: '.done {\n  text-decoration: line-through;\n  color: gray;\n}',
        js: 'const h1 = document.querySelector("h1");\nh1.textContent = "Changed by JavaScript";\nh1.style.color = "crimson";\n\ndocument.querySelectorAll(".item").forEach(li => li.classList.add("done"));\nconsole.log(document.querySelectorAll("li").length, "items");'
      },
      related: ['js:select', 'js:change', 'js:classes', 'explain:dom-tree'],
      challenge: {
        title: 'Change the page from JavaScript',
        task: 'Do not edit the HTML - only the JavaScript:\n\n1. Change the `<h1>` text to `Hello, DOM!`.\n2. Add the class `highlight` to **every** `.item`.\n3. Set the image\'s `alt` to `A friendly avatar`.',
        starter: {
          html: '<h1>Welcome</h1>\n<ul>\n  <li class="item">HTML</li>\n  <li class="item">CSS</li>\n  <li class="item">JavaScript</li>\n</ul>\n<img src="avatar.svg" alt="">',
          css: '.highlight {\n  background: #fff3c4;\n  font-weight: bold;\n}',
          js: '// select the elements and change them here\n'
        },
        solution: {
          html: '<h1>Welcome</h1>\n<ul>\n  <li class="item">HTML</li>\n  <li class="item">CSS</li>\n  <li class="item">JavaScript</li>\n</ul>\n<img src="avatar.svg" alt="">',
          css: '.highlight {\n  background: #fff3c4;\n  font-weight: bold;\n}',
          js: 'document.querySelector("h1").textContent = "Hello, DOM!";\n\ndocument.querySelectorAll(".item").forEach(item => item.classList.add("highlight"));\n\ndocument.querySelector("img").alt = "A friendly avatar";'
        },
        hints: ['`document.querySelector("h1").textContent = "Hello, DOM!";`', '`querySelectorAll` + `forEach` + `classList.add("highlight")`.'],
        checks: [
          { label: 'The heading reads "Hello, DOM!"', text: 'h1', equals: 'Hello, DOM!' },
          { label: 'Every `.item` has the class `highlight`', fn: 'function (doc) { var all = doc.querySelectorAll(".item").length, hi = doc.querySelectorAll(".item.highlight").length; return (all > 0 && all === hi) || (hi + " of " + all + " items highlighted"); }' },
          { label: 'The image\'s alt is "A friendly avatar"', attr: 'img', name: 'alt', equals: 'A friendly avatar' },
          { label: 'The HTML was not edited', source: 'html', match: '<h1>Welcome</h1>' }
        ]
      }
    },
    {
      id: 'js-events', track: 'JavaScript', modes: M,
      title: 'Events: reacting to the user',
      summary: 'addEventListener, the event object, and updating the page when something happens.',
      keywords: ['events', 'addEventListener', 'click', 'input', 'keydown', 'event object', 'listener'],
      body: [
        'The browser fires **events** - `click`, `input`, `keydown`, `submit`, `mouseover` and many more. You register a function to run when one happens:',
        '```js\nconst btn = document.querySelector("#save");\nbtn.addEventListener("click", (event) => {\n  console.log("clicked", event.target);\n});\n```',
        'The function receives an **event object**: `event.target` is the element the event happened on, `event.key` the key pressed, and `event.preventDefault()` stops the browser\'s default action (following a link, submitting a form).',
        '## State in a variable, shown in the DOM',
        'A common pattern: keep the state in a variable, change it in the listener, then copy it to the page:',
        '```js\nlet count = 0;\nconst out = document.querySelector("#count");\ndocument.querySelector("#plus").addEventListener("click", () => {\n  count++;\n  out.textContent = count;\n});\n```',
        '## Event delegation',
        'Events **bubble** up from the target to its ancestors. One listener on a parent can handle clicks on all its children (`event.target.closest("li")`) - even children added later.'
      ].join('\n\n'),
      java: '`addEventListener("click", fn)` is `button.addActionListener(e -> ...)` in Swing; the event object is the `ActionEvent`. Bubbling is like an event propagating up a chain of handlers.',
      example: {
        html: '<input id="name" placeholder="Type your name">\n<p>Hello, <span id="out">stranger</span>!</p>\n<button id="btn">Click me</button>',
        js: 'const input = document.querySelector("#name");\nconst out = document.querySelector("#out");\n\ninput.addEventListener("input", () => {\n  out.textContent = input.value || "stranger";\n});\n\ndocument.querySelector("#btn").addEventListener("click", (e) => {\n  console.log("Clicked:", e.target.textContent);\n});'
      },
      related: ['js:events', 'js:event-object', 'html:button'],
      challenge: {
        title: 'A counter',
        task: 'Make the counter work:\n\n1. **+** adds 1 to the number in `#count`.\n2. **−** subtracts 1.\n3. **Reset** sets it back to 0.',
        starter: {
          html: '<div class="counter">\n  <button id="minus">−</button>\n  <span id="count">0</span>\n  <button id="plus">+</button>\n  <button id="reset">Reset</button>\n</div>',
          css: '.counter {\n  display: flex;\n  gap: 10px;\n  align-items: center;\n  font-size: 24px;\n}\n\nbutton {\n  font-size: 20px;\n  min-width: 44px;\n}',
          js: 'let count = 0;\nconst out = document.querySelector("#count");\n\n// add click listeners for #plus, #minus and #reset\n'
        },
        solution: {
          html: '<div class="counter">\n  <button id="minus">−</button>\n  <span id="count">0</span>\n  <button id="plus">+</button>\n  <button id="reset">Reset</button>\n</div>',
          css: '.counter {\n  display: flex;\n  gap: 10px;\n  align-items: center;\n  font-size: 24px;\n}\n\nbutton {\n  font-size: 20px;\n  min-width: 44px;\n}',
          js: 'let count = 0;\nconst out = document.querySelector("#count");\n\nfunction show() {\n  out.textContent = count;\n}\n\ndocument.querySelector("#plus").addEventListener("click", () => { count++; show(); });\ndocument.querySelector("#minus").addEventListener("click", () => { count--; show(); });\ndocument.querySelector("#reset").addEventListener("click", () => { count = 0; show(); });'
        },
        hints: ['`document.querySelector("#plus").addEventListener("click", () => { … });`', 'Inside: change `count`, then `out.textContent = count;`.'],
        checks: [
          { label: 'Three clicks on + show 3', fn: 'function (doc, win, t) { t.click("#plus"); t.click("#plus"); t.click("#plus"); var v = doc.querySelector("#count").textContent.trim(); return v === "3" || ("it shows " + v); }' },
          { label: '+ + − shows 1', fn: 'function (doc, win, t) { t.click("#plus"); t.click("#plus"); t.click("#minus"); var v = doc.querySelector("#count").textContent.trim(); return v === "1" || ("it shows " + v); }' },
          { label: '− from 0 shows -1', fn: 'function (doc, win, t) { t.click("#minus"); var v = doc.querySelector("#count").textContent.trim(); return v === "-1" || ("it shows " + v); }' },
          { label: 'Reset brings it back to 0', fn: 'function (doc, win, t) { t.click("#plus"); t.click("#plus"); t.click("#reset"); var v = doc.querySelector("#count").textContent.trim(); return v === "0" || ("it shows " + v); }' }
        ]
      }
    },
    {
      id: 'js-devtools', track: 'JavaScript', modes: M,
      title: 'Debugging with Chrome DevTools',
      summary: 'Your IntelliJ debugger for the web: inspect elements, see which CSS rule won, read errors and pause on a breakpoint.',
      keywords: ['devtools', 'debug', 'debugger', 'inspect', 'f12', 'breakpoint', 'console', 'elements', 'styles', 'computed', 'network', 'event listeners'],
      body: [
        'Every browser has developer tools built in. In Chrome press **F12** (or **Ctrl+Shift+I**), or right-click anything on a page and choose **Inspect**. Try it now, on this page.',
        '## The panels you will use every day',
        '- **Elements** - the live DOM tree. Click a node and **Styles** shows every rule that matches it, the most specific on top, with the declarations that lost crossed out. Untick a declaration, or click a value and type a new one: the page changes at once. **Computed** shows the final value of every property, and a box-model diagram with the real pixel sizes.\n- **Console** - errors with their file and line, and a prompt where you can run any JavaScript against the page.\n- **Sources** - the code, with breakpoints, step over (F10), step into (F11) and resume (F8).\n- **Network** - every request: URL, status, headers, the JSON that came back, and how long it took.\n- **Device toolbar** (Ctrl+Shift+M) - the page at phone and tablet sizes.',
        '## Inspecting the previews in this tool',
        'Each preview here is a small page inside the big one (an `<iframe>`). Right-click inside a preview and choose **Inspect**: DevTools opens on that element. To run code in the preview from the Console, pick the preview in the drop-down at the top of the Console that says **top**.',
        '## Three bugs, three ways to find them',
        '1. **"My CSS does nothing."** Inspect the element. If your declaration is crossed out, a more specific rule won, and Styles shows which one. If your rule is not listed at all, its selector does not match the element.\n2. **"The layout is off by a few pixels."** Hover the element in Elements: the page highlights its content, padding, border and margin. **Computed** gives the exact sizes.\n3. **"Clicking does nothing."** Look in the Console for a red error first. No error? Select the element and open **Event Listeners** (a tab next to Styles) to see what is attached to it - or put `debugger;` in the handler. While DevTools is open, the code stops there and you can hover any variable to see its value.',
        '```js\nbutton.addEventListener("click", () => {\n  debugger;          // pauses here while DevTools is open\n  total = total + 1;\n});\n```',
        'The **Inspect** button and the **Console** under the Playground preview are small versions of the same idea. One difference: this tool\'s pretend server answers `/api/...` inside the page, so those calls show in the tool\'s console but not in the Network panel. A real server\'s calls do appear there.'
      ].join('\n\n'),
      java: 'DevTools is IntelliJ\'s debugger, structure view and HTTP client in one. **Sources** = breakpoints and stepping (F10 / F11 here, F8 / F7 in IntelliJ). **Console** = Evaluate Expression. **Elements** = a live object inspector for the DOM. **Network** = the HTTP client log.',
      example: {
        html: '<p class="note">Right-click me and choose Inspect.</p>\n<button id="add">Add one</button>\n<p>Total: <span id="total">0</span></p>',
        css: 'p {\n  color: #1a7f37;\n}\n\n.note {\n  color: gray;   /* Inspect the note: which colour wins, and why? */\n  padding: 8px;\n  border: 2px dashed #b9bfd0;\n}',
        js: 'let total = 0;\ndocument.querySelector("#add").addEventListener("click", () => {\n  debugger;   // open DevTools (F12), then click the button: the code pauses here\n  total = total + 1;\n  document.querySelector("#total").textContent = total;\n  console.log("total is now", total);\n});',
        note: 'Open DevTools with F12, then click "Add one": the code stops on `debugger;`. Press F8 to carry on.'
      },
      related: ['term:devtools', 'explain:specificity', 'explain:box-model', 'css:box-sizing', 'js:events'],
      challenge: {
        title: 'Fix three bugs',
        task: 'This order panel has three bugs. Open DevTools (F12) and use it to find each one:\n\n1. The note should be **green** (`#1a7f37`) but stays grey. Inspect it: in **Styles**, which rule beats `.note`? Make your rule win.\n2. The discount box sticks out of the panel on the right. Inspect it and look at **Computed**: its width plus its padding and border is wider than the panel. Fix it with `box-sizing: border-box`.\n3. Clicking **Apply** does nothing, and there is no error. Select the button and open **Event Listeners** (or add `debugger;` to the handler). Fix the event name. (The ⚠ beside that line in the JavaScript editor gives this one away - but find it with DevTools first: a real website has no ⚠.)',
        starter: {
          html: '<div class="panel">\n  <h2>Order summary</h2>\n  <p class="note">Your order ships tomorrow.</p>\n  <input class="code" placeholder="Discount code">\n  <button id="apply">Apply</button>\n  <p id="msg"></p>\n</div>',
          css: '.panel {\n  width: 300px;\n  padding: 16px;\n  border: 1px solid #d9dde8;\n  border-radius: 8px;\n  font-family: system-ui, sans-serif;\n}\n\n.panel p {\n  color: #6b7385;\n}\n\n.note {\n  color: #1a7f37;\n  font-weight: bold;\n}\n\n.code {\n  display: block;\n  width: 100%;\n  padding: 8px;\n  margin-bottom: 8px;\n}',
          js: 'document.querySelector("#apply").addEventListener("onclick", () => {\n  document.querySelector("#msg").textContent = "Code applied!";\n});'
        },
        solution: {
          html: '<div class="panel">\n  <h2>Order summary</h2>\n  <p class="note">Your order ships tomorrow.</p>\n  <input class="code" placeholder="Discount code">\n  <button id="apply">Apply</button>\n  <p id="msg"></p>\n</div>',
          css: '.panel {\n  width: 300px;\n  padding: 16px;\n  border: 1px solid #d9dde8;\n  border-radius: 8px;\n  font-family: system-ui, sans-serif;\n}\n\n.panel p {\n  color: #6b7385;\n}\n\n.panel .note {\n  color: #1a7f37;\n  font-weight: bold;\n}\n\n.code {\n  display: block;\n  box-sizing: border-box;\n  width: 100%;\n  padding: 8px;\n  margin-bottom: 8px;\n}',
          js: 'document.querySelector("#apply").addEventListener("click", () => {\n  document.querySelector("#msg").textContent = "Code applied!";\n});'
        },
        hints: ['`.panel p` scores (0, 1, 1) and `.note` only (0, 1, 0), so `.panel p` wins. Write `.panel .note` (0, 2, 0) or `p.note` instead.', 'Add `box-sizing: border-box;` to `.code`: then `width: 100%` includes the padding and the border.', 'The event is called `"click"`. `onclick` is the name of a *property* (`button.onclick = …`), not of the event.'],
        checks: [
          { label: 'The note is green', computed: '.note', prop: 'color', equals: 'rgb(26, 127, 55)' },
          { label: 'The discount box uses `box-sizing: border-box`', computed: '.code', prop: 'box-sizing', equals: 'border-box' },
          { label: 'The discount box fills the panel without sticking out', fn: 'function (doc, win) { var p = doc.querySelector(".panel"), cs = win.getComputedStyle(p); var inner = p.getBoundingClientRect().right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight); var r = doc.querySelector(".code").getBoundingClientRect().right; if (r > inner + 0.5) return "it sticks out by " + Math.round(r - inner) + "px"; return r > inner - 1 || ("it stops " + Math.round(inner - r) + "px short of the edge"); }' },
          { label: 'Apply shows "Code applied!"', fn: 'function (doc, win, t) { t.click("#apply"); var m = doc.querySelector("#msg").textContent.trim(); return m === "Code applied!" || (m ? "it shows \\"" + m + "\\"" : "nothing happened on click"); }' }
        ]
      }
    },
    {
      id: 'js-forms', track: 'JavaScript', modes: M,
      title: 'Forms with JavaScript',
      summary: 'Read values, react while the user types, and handle submit without reloading the page.',
      keywords: ['form', 'submit', 'preventDefault', 'value', 'input event', 'validation', 'FormData'],
      body: [
        '## Reading values',
        '`input.value` is always a **string** - convert with `Number(input.value)` when you need a number. Checkboxes use `checkbox.checked` (a boolean).',
        '## Reacting as the user types',
        'The `input` event fires on every keystroke; `change` fires when the user commits (leaves the field, picks an option).',
        '## Handling submit',
        'Listen for `submit` on the **form** (it catches the button click *and* Enter), and stop the browser from reloading the page:',
        '```js\nconst form = document.querySelector("form");\nform.addEventListener("submit", (event) => {\n  event.preventDefault();               // no page reload\n  const name = form.elements.name.value.trim();\n  if (!name) {\n    showError("Please enter your name");\n    return;\n  }\n  // send it with fetch(), update the page, …\n});\n```',
        '`new FormData(form)` collects every named field at once - handy for sending to a server.',
        'Remember: client-side checks are for the user\'s convenience. The server must validate again.'
      ].join('\n\n'),
      java: '`event.preventDefault()` is like consuming an event so the default handler never runs. `FormData` is the client-side twin of Spring\'s `@ModelAttribute` binding.',
      example: {
        html: '<form>\n  <input name="city" placeholder="City">\n  <button>Search</button>\n</form>\n<p id="msg"></p>',
        js: 'const form = document.querySelector("form");\nform.addEventListener("submit", (e) => {\n  e.preventDefault();\n  const city = form.elements.city.value.trim();\n  document.querySelector("#msg").textContent = city ? "Searching " + city + "…" : "Type a city first";\n  console.log(Object.fromEntries(new FormData(form)));\n});'
      },
      related: ['js:forms', 'js:events', 'html:form', 'html:input'],
      challenge: {
        title: 'A greeting form',
        task: '1. When the form is submitted, **prevent the page reload**, read the name and show `Welcome, <name>!` in `#greeting` (e.g. `Welcome, Ravi!`).\n2. If the name is empty, show `Please enter your name` instead.\n3. While the user types, show the number of characters typed in `#chars`.',
        starter: {
          html: '<form id="f">\n  <label>Name <input id="name" name="name"></label>\n  <button>Go</button>\n</form>\n<p>Characters: <span id="chars">0</span></p>\n<p id="greeting"></p>',
          css: '#greeting {\n  font-size: 20px;\n  font-weight: bold;\n}',
          js: 'const form = document.querySelector("#f");\nconst nameInput = document.querySelector("#name");\n\n'
        },
        solution: {
          html: '<form id="f">\n  <label>Name <input id="name" name="name"></label>\n  <button>Go</button>\n</form>\n<p>Characters: <span id="chars">0</span></p>\n<p id="greeting"></p>',
          css: '#greeting {\n  font-size: 20px;\n  font-weight: bold;\n}',
          js: 'const form = document.querySelector("#f");\nconst nameInput = document.querySelector("#name");\nconst greeting = document.querySelector("#greeting");\n\nform.addEventListener("submit", (e) => {\n  e.preventDefault();\n  const name = nameInput.value.trim();\n  greeting.textContent = name ? `Welcome, ${name}!` : "Please enter your name";\n});\n\nnameInput.addEventListener("input", () => {\n  document.querySelector("#chars").textContent = nameInput.value.length;\n});'
        },
        hints: ['`form.addEventListener("submit", (e) => { e.preventDefault(); … });`', 'For the live count use the `input` event and `nameInput.value.length`.'],
        checks: [
          { label: 'Submitting "Ravi" shows "Welcome, Ravi!"', fn: 'function (doc, win, t) { t.type("#name", "Ravi"); t.submit("#f"); return t.wait(50).then(function () { var v = doc.querySelector("#greeting").textContent.trim(); return v === "Welcome, Ravi!" || ("#greeting shows \\"" + v + "\\""); }); }' },
          { label: 'Submitting an empty name asks for it', fn: 'function (doc, win, t) { t.type("#name", ""); t.submit("#f"); return t.wait(50).then(function () { var v = doc.querySelector("#greeting").textContent.trim(); return v === "Please enter your name" || ("#greeting shows \\"" + v + "\\""); }); }' },
          { label: 'The submit handler calls `preventDefault()`', fn: 'function (doc) { var f = doc.querySelector("#f"); var ev = new Event("submit", { cancelable: true, bubbles: true }); f.dispatchEvent(ev); return (ev.defaultPrevented && !ev.uiltBlocked) || "the default (page reload) was not prevented"; }' },
          { label: 'Typing "abc" shows 3 characters', fn: 'function (doc, win, t) { t.type("#name", "abc"); var v = doc.querySelector("#chars").textContent.trim(); return v === "3" || ("#chars shows " + v); }' }
        ]
      }
    },
    {
      id: 'js-todo', track: 'JavaScript', modes: M,
      title: 'Creating and removing elements: a to-do list',
      summary: 'Build new elements with createElement, add them with append, remove them, and use event delegation.',
      keywords: ['createElement', 'append', 'remove', 'todo', 'list', 'event delegation', 'closest'],
      body: [
        '## Creating elements',
        '```js\nconst li = document.createElement("li");   // a new, detached element\nli.textContent = "Buy milk";\nlist.append(li);                           // now it is on the page\n```',
        'Use `textContent` (not `innerHTML`) for text the user typed: it can never be interpreted as HTML, which keeps you safe from script injection.',
        '## Removing elements',
        '`el.remove()` takes an element off the page.',
        '## Event delegation',
        'Items added later do not have listeners yet. Instead of adding one to each, listen on the **list** and find out what was clicked:',
        '```js\nlist.addEventListener("click", (e) => {\n  if (e.target.matches(".delete")) {\n    e.target.closest("li").remove();\n  }\n});\n```',
        '`closest(selector)` walks up from an element to the nearest ancestor that matches - like walking up a tree of parent nodes.'
      ].join('\n\n'),
      java: '`document.createElement` + `append` is `doc.createElement()` + `node.appendChild()` in `org.w3c.dom`. Delegation is one handler for a whole container instead of one per child - like a single `MouseListener` on a `JList`.',
      example: {
        html: '<button id="add">Add a star</button>\n<ul id="stars"></ul>',
        js: 'const list = document.querySelector("#stars");\nlet n = 0;\n\ndocument.querySelector("#add").addEventListener("click", () => {\n  const li = document.createElement("li");\n  li.textContent = "★ star " + (++n) + " (click to remove)";\n  list.append(li);\n});\n\nlist.addEventListener("click", (e) => {\n  const li = e.target.closest("li");\n  if (li) li.remove();\n});'
      },
      related: ['js:create', 'js:events', 'js:storage'],
      challenge: {
        title: 'A working to-do list',
        task: '1. Submitting the form (the **Add** button or Enter) adds the typed task as a new `<li>` in `#list`, then clears the input.\n2. Empty tasks (only spaces) are ignored.\n3. Each new `<li>` contains a `<button class="delete">✕</button>`; clicking it removes that task.',
        starter: {
          html: '<form id="todo-form">\n  <input id="task" placeholder="New task" autocomplete="off">\n  <button id="add">Add</button>\n</form>\n<ul id="list"></ul>',
          css: '#list li {\n  display: flex;\n  justify-content: space-between;\n  max-width: 280px;\n  padding: 4px 0;\n}',
          js: 'const form = document.querySelector("#todo-form");\nconst input = document.querySelector("#task");\nconst list = document.querySelector("#list");\n\n'
        },
        solution: {
          html: '<form id="todo-form">\n  <input id="task" placeholder="New task" autocomplete="off">\n  <button id="add">Add</button>\n</form>\n<ul id="list"></ul>',
          css: '#list li {\n  display: flex;\n  justify-content: space-between;\n  max-width: 280px;\n  padding: 4px 0;\n}',
          js: 'const form = document.querySelector("#todo-form");\nconst input = document.querySelector("#task");\nconst list = document.querySelector("#list");\n\nform.addEventListener("submit", (e) => {\n  e.preventDefault();\n  const text = input.value.trim();\n  if (!text) return;\n  const li = document.createElement("li");\n  const span = document.createElement("span");\n  span.textContent = text;\n  const del = document.createElement("button");\n  del.className = "delete";\n  del.type = "button";\n  del.textContent = "✕";\n  li.append(span, del);\n  list.append(li);\n  input.value = "";\n});\n\nlist.addEventListener("click", (e) => {\n  if (e.target.matches(".delete")) e.target.closest("li").remove();\n});'
        },
        hints: ['In the submit listener: `e.preventDefault()`, read `input.value.trim()`, return early if it is empty.', 'Build the `<li>`, a `<span>` for the text and a `<button class="delete">`; one click listener on `#list` handles every delete button.'],
        checks: [
          { label: 'Adding "Buy milk" creates one item and clears the input', fn: 'function (doc, win, t) { t.type("#task", "Buy milk"); t.click("#add"); return t.wait(30).then(function () { var li = doc.querySelectorAll("#list li"); if (li.length !== 1) return li.length + " items in the list"; if (li[0].textContent.indexOf("Buy milk") < 0) return "the item text is \\"" + li[0].textContent.trim() + "\\""; return doc.querySelector("#task").value === "" || "the input was not cleared"; }); }' },
          { label: 'Two tasks make two items', fn: 'function (doc, win, t) { t.type("#task", "One"); t.click("#add"); t.type("#task", "Two"); t.click("#add"); return t.wait(30).then(function () { var n = doc.querySelectorAll("#list li").length; return n === 2 || (n + " items"); }); }' },
          { label: 'Empty tasks are ignored', fn: 'function (doc, win, t) { t.type("#task", "   "); t.click("#add"); return t.wait(30).then(function () { var n = doc.querySelectorAll("#list li").length; return n === 0 || (n + " item(s) added"); }); }' },
          { label: 'The ✕ button removes its task', fn: 'function (doc, win, t) { t.type("#task", "Temp"); t.click("#add"); return t.wait(30).then(function () { var b = doc.querySelector("#list li button.delete"); if (!b) return "no button.delete inside the item"; b.click(); return t.wait(30); }).then(function (r) { if (typeof r === "string") return r; var n = doc.querySelectorAll("#list li").length; return n === 0 || (n + " item(s) left"); }); }' }
        ]
      }
    },
    {
      id: 'js-fetch', track: 'JavaScript', modes: M,
      title: 'Fetching data from a server',
      summary: 'Call an API with fetch, wait with async/await, read JSON and render it - the bridge to your Spring Boot world.',
      keywords: ['fetch', 'api', 'json', 'async', 'await', 'promise', 'rest', 'http'],
      body: [
        'This is where your backend experience pays off. The browser calls your REST API with `fetch`:',
        '```js\nasync function loadUsers() {\n  const response = await fetch("/api/users");   // GET request\n  if (!response.ok) throw new Error("HTTP " + response.status);\n  const users = await response.json();          // parse the JSON body\n  return users;                                 // an array of objects\n}\n```',
        '## Promises and async/await',
        '`fetch` does not block. It returns a **Promise** - a value that will arrive later. `await` (only allowed inside an `async` function) pauses that function until it arrives, without freezing the page. A `try/catch` around it catches network errors and the error you throw on a bad status.',
        '## The pretend server',
        'Previews in this tool include a small fake backend, so you can practise offline:',
        '- `GET /api/users`, `GET /api/users/1`, `POST /api/users` (validated like a Spring controller - see [[lesson:js-spring]])\n- `GET /api/todos`, `POST /api/todos` with a JSON body `{"title": "…"}`\n- `GET /api/hello?name=Ravi`, `GET /api/slow` (2 s), `GET /api/error` (500)',
        'Each request and response is logged in the console panel.',
        '```js\nawait fetch("/api/todos", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ title: "Learn fetch" })\n});\n```',
        'Real servers on another domain also need CORS headers - the same `@CrossOrigin` you may have configured in Spring.'
      ].join('\n\n'),
      java: '`fetch` is `RestTemplate.getForObject()` that returns a `CompletableFuture`; `await` is like `.join()` - except it does not block the thread. `response.json()` is Jackson\'s `readValue`.',
      example: {
        html: '<button id="go">Say hello</button>\n<p id="out"></p>',
        js: 'document.querySelector("#go").addEventListener("click", async () => {\n  const res = await fetch("/api/hello?name=Ravi");\n  const data = await res.json();\n  document.querySelector("#out").textContent = data.message;\n});'
      },
      related: ['js:fetch', 'js:json'],
      challenge: {
        title: 'Show the users',
        task: '1. While loading, show `Loading…` in `#status`.\n2. Load the users from `/api/users` with `fetch` and show each user\'s **name** in `#users`, one `<li>` per user.\n3. When done, empty `#status`.',
        starter: {
          html: '<p id="status"></p>\n<ul id="users"></ul>',
          css: '#status {\n  color: gray;\n}',
          js: 'const list = document.querySelector("#users");\nconst status = document.querySelector("#status");\n\n'
        },
        solution: {
          html: '<p id="status"></p>\n<ul id="users"></ul>',
          css: '#status {\n  color: gray;\n}',
          js: 'const list = document.querySelector("#users");\nconst status = document.querySelector("#status");\n\nasync function loadUsers() {\n  status.textContent = "Loading…";\n  try {\n    const res = await fetch("/api/users");\n    if (!res.ok) throw new Error("HTTP " + res.status);\n    const users = await res.json();\n    users.forEach(u => {\n      const li = document.createElement("li");\n      li.textContent = u.name;\n      list.append(li);\n    });\n    status.textContent = "";\n  } catch (err) {\n    status.textContent = "Could not load users: " + err.message;\n  }\n}\n\nloadUsers();'
        },
        hints: ['Write an `async function`, `await fetch("/api/users")`, then `await res.json()`.', 'Set `status.textContent = "Loading…"` before the fetch and `""` after the list is built.'],
        checks: [
          { label: 'Shows "Loading…" while waiting', fn: 'function (doc) { var v = doc.querySelector("#status").textContent; return /loading/i.test(v) || ("#status shows \\"" + v + "\\" right after the page loads"); }' },
          { label: 'One `<li>` per user (3)', fn: 'function (doc, win, t) { return t.wait(900).then(function () { var n = doc.querySelectorAll("#users li").length; return n === 3 || (n + " items"); }); }' },
          { label: 'The items show the names', fn: 'function (doc, win, t) { return t.wait(900).then(function () { var txt = doc.querySelector("#users").textContent; return (/Asha Rao/.test(txt) && /Meera Iyer/.test(txt)) || "names not found in the list"; }); }' },
          { label: '`#status` is empty when done', fn: 'function (doc, win, t) { return t.wait(900).then(function () { var v = doc.querySelector("#status").textContent.trim(); return v === "" || ("#status still shows \\"" + v + "\\""); }); }' },
          { label: 'Uses `fetch`', source: 'js', match: 'fetch\\s*\\(' }
        ]
      }
    },
    {
      id: 'js-spring', track: 'JavaScript', modes: M,
      title: 'Calling your own Spring Boot API',
      summary: 'Send JSON to a Spring controller, show its @Valid errors next to the fields, and get past CORS.',
      keywords: ['spring', 'spring boot', 'cors', 'crossorigin', 'post', 'json', 'requestbody', 'valid', 'validation', '415', '400', 'origin', 'preflight', 'rest'],
      body: [
        'You already write the server side. This lesson is the other end of the wire: a page that sends JSON to your controller and handles every answer it can give.',
        '## Sending JSON',
        '```js\nconst res = await fetch("/api/users", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ name: "Asha", email: "asha@example.com" })\n});\n```',
        'Forget the `Content-Type` header and Spring answers **415 Unsupported Media Type**: `fetch` sends a string body as `text/plain`, and `@RequestBody` reads JSON only.',
        '## The controller on the other side',
        '```java\n@RestController\n@RequestMapping("/api/users")\nclass UserController {\n  @PostMapping\n  ResponseEntity<User> create(@Valid @RequestBody NewUser body) {\n    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));\n  }\n}\n\nrecord NewUser(@NotBlank String name, @NotBlank @Email String email) {}\n```',
        '## Showing validation errors',
        'When `@Valid` fails, Spring Boot answers **400** - but by default the body does not say which field was wrong. A small `@RestControllerAdvice` sends the field errors the page needs:',
        '```java\n@RestControllerAdvice\nclass ValidationErrors {\n  @ExceptionHandler(MethodArgumentNotValidException.class)\n  ResponseEntity<Map<String, Object>> handle(MethodArgumentNotValidException e) {\n    var errors = e.getBindingResult().getFieldErrors().stream()\n        .map(f -> Map.of("field", f.getField(), "message", String.valueOf(f.getDefaultMessage())))\n        .toList();\n    return ResponseEntity.badRequest().body(Map.of("status", 400, "errors", errors));\n  }\n}\n```',
        'On the page, look at `res.status` (or `res.ok`) **before** you use the body. `fetch` rejects only when the network fails - never because of a 4xx or 5xx answer:',
        '```js\nif (res.status === 400) {\n  const { errors } = await res.json();\n  errors.forEach(e => showError(e.field, e.message));\n} else if (res.ok) {\n  const user = await res.json();\n}\n```',
        '## Same origin, or CORS',
        'An **origin** is scheme + host + port: `http://localhost:8080` and `http://localhost:5173` are different origins. A page may *read* answers only from its own origin, unless the server allows others with CORS headers.',
        '- **Easiest: let Spring Boot serve the page.** Put `index.html`, `app.css` and `app.js` in `src/main/resources/static/`. They come from the same origin as the API, so `fetch("/api/users")` just works and CORS never comes up.\n- **The page lives somewhere else** (a dev server, or a file): allow its origin with `@CrossOrigin(origins = "http://localhost:5173")` on the controller, or for every controller in `WebMvcConfigurer.addCorsMappings`.',
        'A CORS failure looks like a network error: your code only gets `TypeError: Failed to fetch`. The real reason is in Chrome\'s DevTools Console: *"…has been blocked by CORS policy: No \'Access-Control-Allow-Origin\' header…"*. The request did reach your server - CORS stops the page from reading the answer. Before a JSON `POST`, the browser first sends an `OPTIONS` "preflight" request to ask for permission.',
        '## Trying it with your real app',
        'The previews in this tool are sandboxed, which gives them the origin `null`, so only `@CrossOrigin(origins = "*")` lets them in. That is fine on your own machine while you learn; never ship `*` for an API that uses cookies or logins. With your app running, `fetch("http://localhost:8080/api/…")` from the Playground should then reach it.',
        '## The pretend server',
        '`POST /api/users` in this tool behaves like the controller and the advice above: **415** without the JSON header, **400** with `{status, errors: [{field, message}]}` for a blank name or a bad email, and **201** with the new user otherwise.'
      ].join('\n\n'),
      java: 'This is `RestTemplate` seen from the other side: `fetch` with `JSON.stringify` is `restTemplate.postForEntity(url, body, User.class)`, and `res.status` is `getStatusCode()`. CORS has no Java-client twin - only browsers enforce it, which is why the same call works from Postman or a test and fails from a page.',
      example: {
        html: '<button id="good">POST a valid user</button>\n<button id="bad">POST an invalid user</button>\n<button id="plain">POST without the JSON header</button>\n<pre id="out">Click a button.</pre>',
        js: 'async function send(body, withHeader) {\n  const res = await fetch("/api/users", {\n    method: "POST",\n    headers: withHeader ? { "Content-Type": "application/json" } : {},\n    body: JSON.stringify(body)\n  });\n  const data = await res.json();\n  document.querySelector("#out").textContent = res.status + " " + res.statusText + "\\n" + JSON.stringify(data, null, 2);\n}\n\ndocument.querySelector("#good").addEventListener("click", () => send({ name: "Asha", email: "asha@example.com" }, true));\ndocument.querySelector("#bad").addEventListener("click", () => send({ name: "", email: "not-an-email" }, true));\ndocument.querySelector("#plain").addEventListener("click", () => send({ name: "Asha", email: "asha@example.com" }, false));',
        note: 'Click each button and compare the status codes with the controller code above.'
      },
      related: ['js:fetch', 'js:json', 'js:forms', 'term:cors', 'lesson:js-fetch'],
      challenge: {
        title: 'Sign up against the API',
        task: 'Make the form talk to `POST /api/users` (the pretend server checks it the way `@Valid` would):\n\n1. On submit, stop the page from reloading (`event.preventDefault()`) and send `{ name, email }` as **JSON** with `POST`.\n2. If the answer is **400**, show each error\'s `message` in the matching `<small class="error" data-for="…">` - `data-for` holds the field name.\n3. If the answer is **201**, empty every `.error` and show `Created user #<id>` in `#result`.',
        starter: {
          html: '<form id="signup" novalidate>\n  <label>Name <input name="name"></label>\n  <small class="error" data-for="name"></small>\n  <label>Email <input name="email"></label>\n  <small class="error" data-for="email"></small>\n  <button>Sign up</button>\n</form>\n<p id="result"></p>',
          css: 'form {\n  display: grid;\n  gap: 4px;\n  max-width: 280px;\n}\n\n.error {\n  color: #b42318;\n  min-height: 1em;\n}',
          js: 'const form = document.querySelector("#signup");\n\n// 1. on submit: preventDefault, then POST { name, email } as JSON to /api/users\n// 2. 400: put each error\'s message into .error[data-for="<field>"]\n// 3. 201: empty the errors and show "Created user #<id>" in #result\n'
        },
        solution: {
          html: '<form id="signup" novalidate>\n  <label>Name <input name="name"></label>\n  <small class="error" data-for="name"></small>\n  <label>Email <input name="email"></label>\n  <small class="error" data-for="email"></small>\n  <button>Sign up</button>\n</form>\n<p id="result"></p>',
          css: 'form {\n  display: grid;\n  gap: 4px;\n  max-width: 280px;\n}\n\n.error {\n  color: #b42318;\n  min-height: 1em;\n}',
          js: 'const form = document.querySelector("#signup");\nconst result = document.querySelector("#result");\n\nform.addEventListener("submit", async (event) => {\n  event.preventDefault();\n  document.querySelectorAll(".error").forEach(el => el.textContent = "");\n  result.textContent = "";\n\n  const res = await fetch("/api/users", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify(Object.fromEntries(new FormData(form)))\n  });\n  const data = await res.json();\n\n  if (res.status === 400) {\n    data.errors.forEach(e => {\n      document.querySelector(`.error[data-for="${e.field}"]`).textContent = e.message;\n    });\n  } else if (res.status === 201) {\n    result.textContent = "Created user #" + data.id;\n  }\n});'
        },
        hints: ['`Object.fromEntries(new FormData(form))` turns the form into `{ name: "…", email: "…" }` - ready for `JSON.stringify`.', 'Send the header `{ "Content-Type": "application/json" }`, or the server answers 415.', 'For a 400, `data.errors` is a list of `{ field, message }`. Find each box with `document.querySelector(".error[data-for=" + e.field + "]")`.'],
        checks: [
          { label: 'Sends the header `Content-Type: application/json`', source: 'js', match: 'application\\/json' },
          { label: 'Sends the body with `JSON.stringify`', source: 'js', match: 'JSON\\.stringify\\s*\\(' },
          { label: 'Submitting does not reload the page', fn: 'function (doc, win) { var ev = new win.Event("submit", { cancelable: true, bubbles: true }); doc.querySelector("#signup").dispatchEvent(ev); return (ev.defaultPrevented && !ev.uiltBlocked) || "the submit event was not cancelled - call event.preventDefault() in a submit listener"; }' },
          { label: 'A blank name and a bad email show both server messages', fn: 'function (doc, win, t) { doc.querySelector("[name=name]").value = ""; doc.querySelector("[name=email]").value = "nope"; t.click("#signup button"); return t.wait(900).then(function () { var n = doc.querySelector("[data-for=name]").textContent, e = doc.querySelector("[data-for=email]").textContent; if (!/must not be blank/.test(n)) return "the name error shows \\"" + n + "\\""; return /well-formed/.test(e) || ("the email error shows \\"" + e + "\\""); }); }' },
          { label: 'A valid sign-up shows "Created user #4"', fn: 'function (doc, win, t) { doc.querySelector("[name=name]").value = "Ravi"; doc.querySelector("[name=email]").value = "ravi@example.com"; t.click("#signup button"); return t.wait(900).then(function () { var r = doc.querySelector("#result").textContent.trim(); return r === "Created user #4" || ("#result shows \\"" + r + "\\""); }); }' },
          { label: 'A good sign-up after a bad one clears the errors', fn: 'function (doc, win, t) { var n = doc.querySelector("[name=name]"), e = doc.querySelector("[name=email]"); n.value = ""; e.value = "nope"; t.click("#signup button"); return t.wait(900).then(function () { n.value = "Ravi"; e.value = "ravi@example.com"; t.click("#signup button"); return t.wait(900); }).then(function () { var left = Array.prototype.map.call(doc.querySelectorAll(".error"), function (x) { return x.textContent.trim(); }).filter(Boolean); if (left.length) return "still showing: " + left.join(", "); return /Created user #4/.test(doc.querySelector("#result").textContent) || "no \\"Created user #4\\" after the good sign-up"; }); }' }
        ]
      }
    },
    {
      id: 'js-capstone', track: 'JavaScript', modes: M,
      title: 'Capstone: an interactive profile page',
      summary: 'Put it all together: a theme switch, a show-more toggle and a like button that remembers its count.',
      keywords: ['project', 'capstone', 'localStorage', 'theme', 'toggle', 'dark mode'],
      body: [
        'Time to combine HTML, CSS and JavaScript. Three small features, each a pattern you will use again and again:',
        '## 1. Theme switch: toggle a class, let CSS do the rest',
        '```js\nthemeBtn.addEventListener("click", () => document.body.classList.toggle("dark"));\n```',
        'All the colours live in CSS under `body.dark { … }`. JavaScript only flips the switch.',
        '## 2. Show more: the `hidden` attribute',
        '```js\nmoreBtn.addEventListener("click", () => {\n  details.hidden = !details.hidden;\n  moreBtn.textContent = details.hidden ? "Show more" : "Show less";\n});\n```',
        '## 3. A like counter that survives a reload: localStorage',
        '`localStorage` stores strings per website, kept after the page closes:',
        '```js\nlet likes = Number(localStorage.getItem("likes")) || 0;\n// … on click:\nlikes++;\nlocalStorage.setItem("likes", likes);\n```',
        'Use `JSON.stringify` / `JSON.parse` to store objects. Once this works, open the Playground and build your own page from scratch.'
      ].join('\n\n'),
      java: '`localStorage` is like `java.util.prefs.Preferences`: a small persistent key-value store, strings only, scoped to your application (here: the website).',
      example: {
        html: '<button id="toggle">Toggle theme</button>\n<p>Theme switching with one class.</p>',
        css: 'body {\n  transition: background-color .3s, color .3s;\n}\nbody.dark {\n  background: #11141c;\n  color: #e6e9f2;\n}',
        js: 'document.querySelector("#toggle").addEventListener("click", () => {\n  document.body.classList.toggle("dark");\n  console.log("dark mode:", document.body.classList.contains("dark"));\n});'
      },
      related: ['js:classes', 'js:storage', 'js:events', 'html:button'],
      challenge: {
        title: 'Three features',
        task: '1. `#theme` toggles the class `dark` on `<body>` (the CSS already styles `body.dark`).\n2. `#more` shows the hidden `#details` paragraph and changes its own text to `Show less`; clicking again hides it and says `Show more`.\n3. `#like` adds 1 to the number in `#likes` and saves it in `localStorage` under the key `likes`; on page load, show the saved number.',
        starter: {
          html: '<h1>Ravi</h1>\n<button id="theme">Toggle theme</button>\n<p>Backend developer learning the front end.</p>\n<p id="details" hidden>Java, Spring Boot, SQL - and now HTML, CSS and JavaScript.</p>\n<button id="more">Show more</button>\n<p><button id="like">♥ Like</button> <span id="likes">0</span> likes</p>',
          css: 'body {\n  transition: background-color .3s, color .3s;\n}\n\nbody.dark {\n  background: #11141c;\n  color: #e6e9f2;\n}',
          js: '// 1. theme  2. show more  3. likes with localStorage\n'
        },
        solution: {
          html: '<h1>Ravi</h1>\n<button id="theme">Toggle theme</button>\n<p>Backend developer learning the front end.</p>\n<p id="details" hidden>Java, Spring Boot, SQL - and now HTML, CSS and JavaScript.</p>\n<button id="more">Show more</button>\n<p><button id="like">♥ Like</button> <span id="likes">0</span> likes</p>',
          css: 'body {\n  transition: background-color .3s, color .3s;\n}\n\nbody.dark {\n  background: #11141c;\n  color: #e6e9f2;\n}',
          js: 'document.querySelector("#theme").addEventListener("click", () => {\n  document.body.classList.toggle("dark");\n});\n\nconst details = document.querySelector("#details");\nconst more = document.querySelector("#more");\nmore.addEventListener("click", () => {\n  details.hidden = !details.hidden;\n  more.textContent = details.hidden ? "Show more" : "Show less";\n});\n\nconst likesEl = document.querySelector("#likes");\nlet likes = Number(localStorage.getItem("likes")) || 0;\nlikesEl.textContent = likes;\ndocument.querySelector("#like").addEventListener("click", () => {\n  likes++;\n  likesEl.textContent = likes;\n  localStorage.setItem("likes", likes);\n});'
        },
        hints: ['Theme: `document.body.classList.toggle("dark")`.', 'Likes: read once at start with `Number(localStorage.getItem("likes")) || 0`, then `setItem` after every click.'],
        checks: [
          { label: '#theme toggles `dark` on the body', fn: 'function (doc, win, t) { var before = doc.body.classList.contains("dark"); t.click("#theme"); var after = doc.body.classList.contains("dark"); t.click("#theme"); return (before !== after && doc.body.classList.contains("dark") === before) || "the class did not toggle"; }' },
          { label: '#more reveals the details and says "Show less"', fn: 'function (doc, win, t) { t.click("#more"); var d = doc.querySelector("#details"), b = doc.querySelector("#more"); if (d.hidden) return "#details is still hidden"; return /show less/i.test(b.textContent) || ("the button says \\"" + b.textContent.trim() + "\\""); }' },
          { label: 'A second click hides them again', fn: 'function (doc, win, t) { t.click("#more"); t.click("#more"); var d = doc.querySelector("#details"), b = doc.querySelector("#more"); if (!d.hidden) return "#details is still visible"; return /show more/i.test(b.textContent) || ("the button says \\"" + b.textContent.trim() + "\\""); }' },
          { label: '#like adds one each click', fn: 'function (doc, win, t) { var start = Number(doc.querySelector("#likes").textContent) || 0; t.click("#like"); t.click("#like"); var now = Number(doc.querySelector("#likes").textContent); return now === start + 2 || ("went from " + start + " to " + now); }' },
          { label: 'The count is saved in localStorage', fn: 'function (doc, win, t) { t.click("#like"); var shown = doc.querySelector("#likes").textContent.trim(); var saved = win.localStorage.getItem("likes"); return saved === shown || ("saved \\"" + saved + "\\" but showing " + shown); }' }
        ]
      }
    }
  );
})(window.UILT);
