/*
 * UI pattern recipes (#/recipes): small, complete, accessible versions of the widgets every web app
 * needs. Each opens in the Playground (also from its "Start from a template…" menu).
 *
 * Shape: {id, title, summary, keywords, body (Markdown: how it works), a11y (Markdown list: the
 *         accessibility points), tryIt (Markdown: what to try in the preview), java (analogy),
 *         related ([kind:]id, default kind js), html, css, js}
 */
(function (U) {
  function lines() { return Array.prototype.join.call(arguments, '\n'); }
  var BASE = lines('body {', '  font-family: system-ui, sans-serif;', '  margin: 24px;', '  color: #1d2433;', '}');
  var BUTTON = lines('button {', '  padding: 8px 14px;', '  border: 1px solid #b9bfd0;', '  border-radius: 8px;', '  background: white;',
    '  font: inherit;', '  cursor: pointer;', '}');

  U.data.recipes = [
    {
      id: 'dialog', title: 'Dialog (modal)',
      summary: 'A "Are you sure?" box that blocks the page until it is answered - built on <dialog>.',
      keywords: ['dialog', 'modal', 'popup', 'confirm', 'overlay', 'lightbox', 'showModal', 'backdrop'],
      related: ['html:dialog', 'html:form', 'js:events', 'term:accessibility'],
      body: [
        'A **modal dialog** asks one question and blocks the rest of the page until it is answered: "Delete your account?". HTML has an element for it, `<dialog>`, and the browser does the hard parts.',
        '## How it works',
        '- `dialog.showModal()` opens it **on top of everything**, dims the page behind it (the `::backdrop`), moves the focus into it and makes the rest of the page **inert**: no clicks, no Tab key.\n' +
        '- **Esc** closes it, with no code from you.\n' +
        '- A `<form method="dialog">` inside it closes the dialog when one of its buttons is pressed, and that button\'s `value` becomes `dialog.returnValue`. The `close` event is where you read what was chosen.\n' +
        '- A click on the dimmed backdrop arrives as a click **on the `<dialog>` element itself** - and so does a click on the dialog\'s own padding. The code closes the dialog only when the click lands outside its box.',
        '## Two traps',
        '- **Esc keeps the old `returnValue`.** After a "delete", pressing Esc the next time would still read "delete". The recipe clears it before each opening.\n' +
        '- `dialog.show()` (without "Modal") opens it as a plain box in the page: no backdrop, no Esc, and the page stays clickable.'
      ].join('\n\n'),
      a11y: [
        '- `showModal()` gives the dialog its role, keeps the focus inside it, and makes Esc close it.',
        '- `aria-labelledby` points at the heading, so a screen reader announces "Delete your account?, dialog".',
        '- `showModal()` focuses the first button, so Cancel - the safe choice - comes first: pressing Enter never deletes by accident. (`autofocus` on another element would pick that one instead; the previews in this tool block `autofocus`, because they run in a sandboxed frame.)',
        '- When the dialog closes, the browser puts the focus back on the button that opened it.'
      ].join('\n'),
      tryIt: [
        '1. Click **Delete account…**, then press **Esc**: "Cancelled."',
        '2. Open it again and click **Delete**: "Account deleted."',
        '3. Open it once more and click the dark area around it: it closes. A click on its white padding does not.'
      ].join('\n'),
      java: 'Like a modal `JDialog`: the rest of the window is blocked until it closes. One difference: `showModal()` does **not** block your code. It returns at once, and you learn the answer later, in the `close` event.',
      html: lines(
        '<button id="open-dialog" type="button">Delete account…</button>',
        '<p id="result" role="status"></p>',
        '',
        '<dialog id="confirm" aria-labelledby="confirm-title">',
        '  <form method="dialog">',
        '    <h2 id="confirm-title">Delete your account?</h2>',
        '    <p>This removes your profile and all your posts. You cannot undo it.</p>',
        '    <div class="actions">',
        '      <button value="cancel">Cancel</button>',
        '      <button value="delete" class="danger">Delete</button>',
        '    </div>',
        '  </form>',
        '</dialog>'),
      css: lines(BASE, '', BUTTON, '',
        'dialog {', '  max-width: 360px;', '  padding: 20px 24px;', '  border: 0;', '  border-radius: 14px;', '  box-shadow: 0 20px 50px rgb(0 0 0 / 30%);', '}', '',
        '/* the dimmed layer behind a modal dialog */',
        'dialog::backdrop {', '  background: rgb(20 24 40 / 55%);', '}', '',
        'dialog h2 {', '  margin: 0 0 8px;', '  font-size: 1.2rem;', '}', '',
        '.actions {', '  display: flex;', '  justify-content: flex-end;', '  gap: 8px;', '  margin-top: 16px;', '}', '',
        '.danger {', '  border-color: #c92a2a;', '  background: #c92a2a;', '  color: white;', '}'),
      js: lines(
        'const dialog = document.querySelector("#confirm");',
        'const result = document.querySelector("#result");',
        '',
        'document.querySelector("#open-dialog").addEventListener("click", () => {',
        '  dialog.returnValue = ""; // Esc would otherwise keep the answer from last time',
        '  dialog.showModal();      // on top, page dimmed and inert, Esc closes it',
        '});',
        '',
        '// <form method="dialog"> closes the dialog; the pressed button\'s value is the returnValue',
        'dialog.addEventListener("close", () => {',
        '  result.textContent = dialog.returnValue === "delete" ? "Account deleted." : "Cancelled.";',
        '});',
        '',
        '// a click on the backdrop has the dialog as its target - but so does a click on its padding',
        'dialog.addEventListener("click", (e) => {',
        '  if (e.target !== dialog) return;',
        '  const box = dialog.getBoundingClientRect();',
        '  const inside = e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom;',
        '  if (!inside) dialog.close("cancel");',
        '});')
    },
    {
      id: 'tabs', title: 'Tabs',
      summary: 'One panel at a time, with a row of tabs to switch - working with the mouse, the keyboard and a screen reader.',
      keywords: ['tabs', 'tablist', 'tabpanel', 'aria-selected', 'roving tabindex', 'switch panels'],
      related: ['js:attributes', 'js:events', 'html:button', 'term:accessibility'],
      body: [
        'Tabs show one panel from a set, with a row of buttons to switch. HTML has no `<tabs>` element, so the recipe builds them from buttons and sections, and adds **ARIA roles** that tell assistive technology what each part is.',
        '## How it works',
        '- Each tab is a `<button role="tab">` whose `aria-controls` names its panel. Each panel is a `<section role="tabpanel">`.\n' +
        '- `aria-selected="true"` marks the chosen tab, and the CSS styles `[aria-selected="true"]`. The state lives in **one** place - the attribute that screen readers read too.\n' +
        '- The other panels carry the `hidden` attribute, which hides them from the eye and from screen readers.\n' +
        '- **Roving tabindex**: only the selected tab has `tabindex="0"`; the others have `-1`. The Tab key enters the row once and then moves on, instead of stepping through every tab.\n' +
        '- Arrow keys move between tabs and wrap round at the ends; Home and End jump to the first and last. That is what keyboard users expect from a tab row.'
      ].join('\n\n'),
      a11y: [
        '- `role="tablist"`, `role="tab"` and `role="tabpanel"` let a screen reader say "Security, tab, 2 of 3, selected".',
        '- `aria-controls` and `aria-labelledby` link each tab and its panel, both ways.',
        '- Only one tab is in the Tab order (roving tabindex); the arrow keys move within the row.',
        '- `:focus-visible` shows a focus ring for keyboard users without showing it on every mouse click.'
      ].join('\n'),
      tryIt: [
        '1. Click **Security**: its panel shows and the other two hide.',
        '2. Press **→** and **←**: the selection follows the focus, and wraps at the ends. **Home** and **End** jump.',
        '3. Press **Tab**: the focus leaves the row, instead of stepping through all three tabs.'
      ].join('\n'),
      java: 'Like a `JTabbedPane`. The difference: the selected state is an attribute on the element (`aria-selected`) that the CSS and screen readers both read, rather than a field hidden inside the component.',
      html: lines(
        '<div role="tablist" aria-label="Account settings">',
        '  <button role="tab" id="tab-profile" aria-controls="panel-profile" aria-selected="true">Profile</button>',
        '  <button role="tab" id="tab-security" aria-controls="panel-security" aria-selected="false" tabindex="-1">Security</button>',
        '  <button role="tab" id="tab-billing" aria-controls="panel-billing" aria-selected="false" tabindex="-1">Billing</button>',
        '</div>',
        '',
        '<section role="tabpanel" id="panel-profile" aria-labelledby="tab-profile">',
        '  <h3>Profile</h3>',
        '  <p>Your name, photo and bio.</p>',
        '</section>',
        '<section role="tabpanel" id="panel-security" aria-labelledby="tab-security" hidden>',
        '  <h3>Security</h3>',
        '  <p>Password and two-step sign-in.</p>',
        '</section>',
        '<section role="tabpanel" id="panel-billing" aria-labelledby="tab-billing" hidden>',
        '  <h3>Billing</h3>',
        '  <p>Your plan and invoices.</p>',
        '</section>'),
      css: lines(BASE, '',
        '[role="tablist"] {', '  display: flex;', '  gap: 4px;', '  border-bottom: 2px solid #d9dde8;', '}', '',
        '[role="tab"] {', '  margin-bottom: -2px;', '  padding: 8px 14px;', '  border: 0;', '  border-bottom: 3px solid transparent;',
        '  background: none;', '  color: #4d5568;', '  font: inherit;', '  cursor: pointer;', '}', '',
        '[role="tab"][aria-selected="true"] {', '  border-bottom-color: #4353c9;', '  color: #4353c9;', '  font-weight: 600;', '}', '',
        '[role="tab"]:focus-visible {', '  outline: 2px solid #4353c9;', '  outline-offset: 2px;', '}', '',
        '[role="tabpanel"] {', '  padding: 12px 2px;', '}', '',
        '[role="tabpanel"] h3 {', '  margin: 0 0 4px;', '}'),
      js: lines(
        'const tabs = [...document.querySelectorAll(\'[role="tab"]\')];',
        '',
        'function select(tab) {',
        '  tabs.forEach((t) => {',
        '    const on = t === tab;',
        '    t.setAttribute("aria-selected", on); // "true" or "false": CSS and screen readers read it',
        '    t.tabIndex = on ? 0 : -1;             // only the selected tab is in the Tab order',
        '    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;',
        '  });',
        '  tab.focus();',
        '}',
        '',
        'tabs.forEach((tab) => tab.addEventListener("click", () => select(tab)));',
        '',
        '// arrows move between the tabs (and wrap round); Home and End jump to the ends',
        'document.querySelector(\'[role="tablist"]\').addEventListener("keydown", (e) => {',
        '  const i = tabs.indexOf(document.activeElement);',
        '  const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];',
        '  if (next === undefined) return;',
        '  e.preventDefault();',
        '  select(tabs[(next + tabs.length) % tabs.length]);',
        '});')
    },
    {
      id: 'dropdown', title: 'Dropdown menu',
      summary: 'A button that opens a short list of actions, and closes it on a choice, on Esc, or on a click anywhere else.',
      keywords: ['dropdown', 'menu', 'popup menu', 'actions', 'aria-expanded', 'outside click', 'popover'],
      related: ['explain:bubbling', 'js:events', 'css:position', 'term:event-bubbling'],
      body: [
        'A dropdown menu is a button that opens a short list of actions. Showing and hiding a list is easy; the part that takes thought is **closing** it - after a choice, on Esc, and on a click anywhere else.',
        '## How it works',
        '- The list starts with the `hidden` attribute. Opening it sets `menu.hidden = false` and `aria-expanded="true"`, then moves the focus to the first item.\n' +
        '- A click on an item is caught **once, on the list** (event delegation): `e.target.closest(\'[role="menuitem"]\')` finds which item it was.\n' +
        '- A click anywhere else **bubbles up to `document`**. One listener there closes the menu when the click did not start inside `.menu-wrap` - the [[explain:bubbling]] explainer at work.\n' +
        '- `position: absolute` on the list, inside a `position: relative` wrapper, makes it float under the button without pushing the page down.',
        '## A trap',
        'The `hidden` attribute only hides an element while no CSS rule sets its `display`. Write `#menu { display: flex; }` and the menu never hides again. If you need a layout, write `#menu:not([hidden]) { display: flex; }`.'
      ].join('\n\n'),
      a11y: [
        '- `aria-haspopup` and `aria-expanded` tell a screen reader that the button opens a menu, and whether it is open now.',
        '- The items are real `<button>`s, so they take the focus and work with Enter and Space.',
        '- The arrow keys move between items; Esc closes the menu and puts the focus back on the button, so a keyboard user is never stranded.',
        '- The newer Popover API (the `popover` attribute) can do the show, hide and outside-click parts without JavaScript; this recipe does them by hand so you can see how they work.'
      ].join('\n'),
      tryIt: [
        '1. Click **Options**: the menu opens with the focus on Edit.',
        '2. Press **↓**, then **Enter**: "You chose: Duplicate", and the focus is back on the button.',
        '3. Open it again, then click anywhere outside it - or press **Esc**: it closes.'
      ].join('\n'),
      java: 'The outside-click listener is like a global `AWTEventListener`: it hears every click in the window, and your code decides whether that click concerns the menu.',
      html: lines(
        '<div class="menu-wrap">',
        '  <button id="menu-button" aria-haspopup="true" aria-expanded="false" aria-controls="menu">Options ▾</button>',
        '  <ul id="menu" role="menu" aria-labelledby="menu-button" hidden>',
        '    <li role="none"><button role="menuitem">Edit</button></li>',
        '    <li role="none"><button role="menuitem">Duplicate</button></li>',
        '    <li role="none"><button role="menuitem">Archive</button></li>',
        '  </ul>',
        '</div>',
        '<p id="chosen" role="status"></p>'),
      css: lines(BASE, '',
        '.menu-wrap {', '  position: relative;', '  display: inline-block;', '}', '',
        '#menu-button {', '  padding: 8px 14px;', '  border: 1px solid #b9bfd0;', '  border-radius: 8px;', '  background: white;', '  font: inherit;', '  cursor: pointer;', '}', '',
        '/* floats under the button; no "display" here, so the hidden attribute keeps working */',
        '#menu {', '  position: absolute;', '  top: calc(100% + 4px);', '  left: 0;', '  z-index: 10;', '  min-width: 160px;', '  margin: 0;', '  padding: 4px;',
        '  list-style: none;', '  background: white;', '  border: 1px solid #d9dde8;', '  border-radius: 10px;', '  box-shadow: 0 8px 24px rgb(0 0 0 / 15%);', '}', '',
        '[role="menuitem"] {', '  display: block;', '  width: 100%;', '  padding: 7px 10px;', '  border: 0;', '  border-radius: 6px;', '  background: none;',
        '  font: inherit;', '  text-align: left;', '  cursor: pointer;', '}', '',
        '[role="menuitem"]:hover,', '[role="menuitem"]:focus {', '  background: #e7e9ff;', '  outline: none;', '}'),
      js: lines(
        'const button = document.querySelector("#menu-button");',
        'const menu = document.querySelector("#menu");',
        'const items = [...menu.querySelectorAll(\'[role="menuitem"]\')];',
        '',
        'function openMenu() {',
        '  menu.hidden = false;',
        '  button.setAttribute("aria-expanded", "true");',
        '  items[0].focus();',
        '}',
        'function closeMenu() {',
        '  menu.hidden = true;',
        '  button.setAttribute("aria-expanded", "false");',
        '}',
        '',
        'button.addEventListener("click", () => (menu.hidden ? openMenu() : closeMenu()));',
        '',
        '// one listener for every item (event delegation)',
        'menu.addEventListener("click", (e) => {',
        '  const item = e.target.closest(\'[role="menuitem"]\');',
        '  if (!item) return;',
        '  document.querySelector("#chosen").textContent = "You chose: " + item.textContent;',
        '  closeMenu();',
        '  button.focus();',
        '});',
        '',
        '// every click bubbles up to document: close the menu if it came from outside',
        'document.addEventListener("click", (e) => {',
        '  if (!menu.hidden && !e.target.closest(".menu-wrap")) closeMenu();',
        '});',
        '',
        '// keyboard: arrows move, Esc closes and gives the focus back to the button',
        'menu.addEventListener("keydown", (e) => {',
        '  const i = items.indexOf(document.activeElement);',
        '  if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }',
        '  if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }',
        '  if (e.key === "Escape") { closeMenu(); button.focus(); }',
        '});')
    },
    {
      id: 'toast', title: 'Toast notifications',
      summary: 'Short messages that slide in at a corner, stack, and leave by themselves - announced to screen readers.',
      keywords: ['toast', 'notification', 'snackbar', 'flash message', 'alert', 'aria-live', 'transition'],
      related: ['js:timers', 'js:create', 'css:transition', 'term:accessibility'],
      body: [
        'A toast is a short message that appears in a corner and leaves by itself: "Saved", "Could not connect". It must never take the focus or block the page.',
        '## How it works',
        '- `toast("Saved")` creates a `<div class="toast">`, adds it to a fixed container in the corner, and removes it 3 seconds later.\n' +
        '- The container is a flex **column** with a `gap`, so several toasts stack neatly.\n' +
        '- **The slide-in**: a new toast starts transparent and a little low. A frame later the code adds the class `show`, and the CSS `transition` animates it into place. Adding `show` at once would skip the animation, because the browser never drew the "before" state.\n' +
        '- Leaving is the same in reverse: remove `show`, and when the transition has ended (`transitionend`), remove the element. A timer removes it anyway in case no transition runs (with reduced motion, there is none).'
      ].join('\n\n'),
      a11y: [
        '- The container has `role="status"` and `aria-live="polite"`: screen readers read each new toast once they finish their current sentence, and the focus stays where it is.',
        '- For an urgent error, `role="alert"` interrupts instead.',
        '- Keep toasts for messages that are safe to miss. Anything the user must act on belongs in the page or in a dialog.',
        '- People who ask their system for less motion (`prefers-reduced-motion`) get no slide.'
      ].join('\n'),
      tryIt: [
        '1. Click **Save**, then **Try something that fails**: two toasts stack in the corner.',
        '2. Wait 3 seconds: they slide away by themselves.'
      ].join('\n'),
      java: 'Like a one-shot `javax.swing.Timer`: `setTimeout(fn, 3000)` schedules the removal and returns at once. Nothing waits, and the page stays responsive.',
      html: lines(
        '<button id="save">Save</button>',
        '<button id="fail">Try something that fails</button>',
        '',
        '<!-- new toasts are added in here; screen readers announce them -->',
        '<div class="toasts" role="status" aria-live="polite"></div>'),
      css: lines(BASE, '', BUTTON, '',
        '.toasts {', '  position: fixed;', '  right: 16px;', '  bottom: 16px;', '  z-index: 100;', '  display: flex;', '  flex-direction: column;', '  gap: 8px;', '}', '',
        '.toast {', '  padding: 10px 16px;', '  border-radius: 10px;', '  background: #1d2433;', '  color: white;', '  box-shadow: 0 6px 20px rgb(0 0 0 / 25%);',
        '  opacity: 0;', '  transform: translateY(12px);', '  transition: opacity 0.25s, transform 0.25s;', '}', '',
        '.toast.show {', '  opacity: 1;', '  transform: none;', '}', '',
        '.toast.error {', '  background: #c92a2a;', '}', '',
        '@media (prefers-reduced-motion: reduce) {', '  .toast {', '    transition: none;', '  }', '}'),
      js: lines(
        'const box = document.querySelector(".toasts");',
        '',
        'function toast(message, kind = "info", ms = 3000) {',
        '  const t = document.createElement("div");',
        '  t.className = "toast " + kind;',
        '  t.textContent = message;',
        '  box.append(t);',
        '  // wait for the browser to draw it once, then add "show": the transition needs a "before"',
        '  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("show")));',
        '',
        '  setTimeout(() => {',
        '    t.classList.remove("show");',
        '    t.addEventListener("transitionend", () => t.remove(), { once: true });',
        '    setTimeout(() => t.remove(), 500); // in case no transition runs',
        '  }, ms);',
        '}',
        '',
        'document.querySelector("#save").addEventListener("click", () => toast("Saved"));',
        'document.querySelector("#fail").addEventListener("click", () => toast("Could not connect to the server", "error"));')
    },
    {
      id: 'sortable-table', title: 'Sortable table',
      summary: 'Click a column heading to sort the rows; click again to reverse. Numbers sort as numbers.',
      keywords: ['sort', 'sortable', 'table', 'aria-sort', 'comparator', 'order by', 'data grid'],
      related: ['html:table', 'js:arrays', 'js:create', 'js:events'],
      body: [
        'Click a column heading to sort the rows by it; click again to reverse the order. The data is already in the page, so sorting is pure DOM work: read the rows, sort them, put them back.',
        '## How it works',
        '- Each heading holds a `<button>`, so it can be reached and pressed with the keyboard. One click listener on `<thead>` serves all of them (event delegation).\n' +
        '- `[...tbody.rows]` copies the live list of rows into a real array, which has `.sort()`.\n' +
        '- The comparator reads the text of the clicked column. Numbers must be compared **as numbers**: as text, `"1300"` comes before `"45"`, because "1" sorts before "4". `localeCompare` compares words the way a dictionary does.\n' +
        '- `tbody.append(...rows)` **moves** the rows into their new order: appending a node that is already in the page moves it rather than copying it.\n' +
        '- `aria-sort` on the heading records the order; the CSS draws ▲ or ▼ from the same attribute.'
      ].join('\n\n'),
      a11y: [
        '- Buttons in the headings make sorting work with Tab and Enter, not only with a mouse.',
        '- `aria-sort="ascending"` or `"descending"` on the sorted heading is read out ("Commits, sorted ascending").',
        '- `scope="col"` ties each heading to its column, and the `<caption>` names the table.'
      ].join('\n'),
      tryIt: [
        '1. Click **Commits**: 7, 45, 120, 310, 1300 - sorted as numbers.',
        '2. Click it again: the order reverses and the arrow flips.',
        '3. Click **Name**: alphabetical order.'
      ].join('\n'),
      java: 'The comparator is a `Comparator<Row>`: `Number(x) - Number(y)` is `Integer.compare(x, y)`, `x.localeCompare(y)` is a `Collator`, and `-order` is `.reversed()`.',
      html: lines(
        '<table class="sortable">',
        '  <caption>Team - click a heading to sort</caption>',
        '  <thead>',
        '    <tr>',
        '      <th scope="col" aria-sort="none"><button>Name</button></th>',
        '      <th scope="col" aria-sort="none"><button>Role</button></th>',
        '      <th scope="col" aria-sort="none"><button data-type="number">Commits</button></th>',
        '    </tr>',
        '  </thead>',
        '  <tbody>',
        '    <tr><td>Vikram</td><td>Developer</td><td>7</td></tr>',
        '    <tr><td>Asha</td><td>Admin</td><td>1300</td></tr>',
        '    <tr><td>Zoe</td><td>Tester</td><td>120</td></tr>',
        '    <tr><td>Meera</td><td>Designer</td><td>45</td></tr>',
        '    <tr><td>Ravi</td><td>Developer</td><td>310</td></tr>',
        '  </tbody>',
        '</table>'),
      css: lines(BASE, '',
        'table {', '  min-width: 320px;', '  border-collapse: collapse;', '}', '',
        'caption {', '  margin-bottom: 6px;', '  color: #4d5568;', '  text-align: left;', '}', '',
        'th,', 'td {', '  padding: 8px 12px;', '  border-bottom: 1px solid #d9dde8;', '  text-align: left;', '}', '',
        '/* the numbers column lines up on the right */',
        'th:last-child,', 'td:last-child {', '  text-align: right;', '}', '',
        '/* a heading button that looks like plain heading text */',
        'th button {', '  padding: 0;', '  border: 0;', '  background: none;', '  font: inherit;', '  font-weight: 600;', '  color: inherit;', '  cursor: pointer;', '}', '',
        'th button:focus-visible {', '  outline: 2px solid #4353c9;', '  outline-offset: 2px;', '}', '',
        'th button::after {', '  content: " ↕";', '  color: #9aa3b8;', '}', '',
        'th[aria-sort="ascending"] button::after {', '  content: " ▲";', '  color: #4353c9;', '}', '',
        'th[aria-sort="descending"] button::after {', '  content: " ▼";', '  color: #4353c9;', '}'),
      js: lines(
        'const table = document.querySelector(".sortable");',
        'const tbody = table.querySelector("tbody");',
        '',
        '// one listener for every heading button (event delegation)',
        'table.querySelector("thead").addEventListener("click", (e) => {',
        '  const button = e.target.closest("button");',
        '  if (!button) return;',
        '  const th = button.closest("th");',
        '  const col = th.cellIndex;',
        '  const numeric = button.dataset.type === "number";',
        '  // the same column again flips the order',
        '  const dir = th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending";',
        '',
        '  const rows = [...tbody.rows];',
        '  rows.sort((a, b) => {',
        '    const x = a.cells[col].textContent;',
        '    const y = b.cells[col].textContent;',
        '    const order = numeric ? Number(x) - Number(y) : x.localeCompare(y);',
        '    return dir === "ascending" ? order : -order;',
        '  });',
        '  tbody.append(...rows); // moves the rows: no copies are made',
        '',
        '  table.querySelectorAll("th").forEach((h) => h.setAttribute("aria-sort", "none"));',
        '  th.setAttribute("aria-sort", dir);',
        '});')
    }
  ];
})(window.UILT);
