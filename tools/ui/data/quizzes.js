/*
 * Quizzes after lessons: a few questions per lesson, keyed by lesson id. Missed questions come back
 * later, in the review (#/lessons/review) and in the next lessons' quizzes - see js/views/quiz.js.
 *
 * Shape: {lessonId: [{q, choices: [...], answer: index into choices, why}]} - all Markdown.
 * The choices are shuffled on screen. A question's id is "<lessonId>/<position>", and the review
 * remembers questions by that id: add new questions at the END of a lesson's list.
 */
(function (U) {
  U.data.quizzes = {
    'html-skeleton': [
      { q: 'Which of the three languages decides **what is on the page** - the headings, the paragraphs, the buttons?',
        choices: ['HTML', 'CSS', 'JavaScript'], answer: 0,
        why: 'HTML is the content and its structure. CSS decides how it looks, and JavaScript makes it react. A page with only HTML still works - it just looks plain.' },
      { q: 'What does `<!doctype html>` on the first line do?',
        choices: ['It loads the HTML library', 'It tells the browser to use standards mode instead of the old "quirks mode"', 'It sets the language of the page'], answer: 1,
        why: 'Without it, the browser falls back to "quirks mode", which copies bugs of 1990s browsers (the box model among them). It loads nothing; the language is the `lang` attribute on `<html>`.' },
      { q: 'Where does `<title>` go, and where does it show up?',
        choices: ['In `<body>`, as the big heading at the top of the page', 'In `<head>`, in the browser tab, in bookmarks and in search results', 'Anywhere; it only shows in search results'], answer: 1,
        why: '`<head>` holds information *about* the page (title, character set, stylesheets), and nothing in it is drawn. The visible heading at the top is an `<h1>` in `<body>`.' }
    ],
    'html-text': [
      { q: 'How many `<h1>` headings should a typical page have, and why do the levels matter?',
        choices: ['As many as you like - they are only big bold text', 'One, and the levels (h1, h2, h3) form the outline that screen readers and search engines use', 'Exactly six, one of each level'], answer: 1,
        why: 'Headings are structure, not styling. Screen-reader users jump from heading to heading like a table of contents. For big text that is not a heading, use CSS on a paragraph.' },
      { q: 'You type three spaces and two line breaks inside a `<p>`. What does the browser show?',
        choices: ['Exactly what you typed', 'A single space: runs of whitespace collapse into one', 'An error'], answer: 1,
        why: 'HTML collapses whitespace. A line break needs `<br>` or a new paragraph; for code, where spacing matters, use `<pre>`.' },
      { q: 'What is the difference between a block element (`<p>`, `<div>`) and an inline element (`<strong>`, `<a>`)?',
        choices: ['A block starts on a new line and takes the full width; an inline element flows inside a line of text', 'A block cannot contain text', 'An inline element is hidden until clicked'], answer: 0,
        why: 'A block is like a paragraph; an inline element is like a word inside it. The CSS `display` property can change either - see the Display lesson.' }
    ],
    'html-links-images': [
      { q: 'What is the difference between `href="https://example.com/about"` and `href="about.html"`?',
        choices: ['None', 'The first is absolute (a full address); the second is relative to the folder of the current page', 'The second only works offline'], answer: 1,
        why: 'A relative URL is resolved against the page it is in, like a relative file path. An absolute URL includes the scheme and the host.' },
      { q: 'Why does every `<img>` need an `alt` attribute?',
        choices: ['It sets the tooltip', 'It is the text screen readers read, and the text shown if the image fails to load', 'It makes the image load faster'], answer: 1,
        why: '`alt` is the image\'s text alternative. For a purely decorative image write `alt=""`, so screen readers skip it; leave `alt` out and they read the file name instead.' },
      { q: 'A link has `target="_blank"`. What happens when it is clicked?',
        choices: ['It opens in the same tab', 'It opens in a new tab or window', 'It downloads the file'], answer: 1,
        why: 'Downloading is the `download` attribute. Browsers now treat `_blank` links as `rel="noopener"`, so the new page cannot take control of yours.' }
    ],
    'html-lists-tables': [
      { q: 'When should you use `<ol>` instead of `<ul>`?',
        choices: ['When the order matters, like the steps of a recipe', 'When the list is long', 'When the items are links'], answer: 0,
        why: '`<ol>` numbers its items because their order means something; `<ul>` is a set where order does not matter. Both can be restyled - the choice is about meaning.' },
      { q: 'In a table, what is `<th>` for?',
        choices: ['A header cell: it labels a column or a row', 'The title above the table', 'A thicker border'], answer: 0,
        why: 'Screen readers announce the `<th>` with each cell, which is how a blind user knows which column a number belongs to. The title above the table is `<caption>`.' },
      { q: 'Is it fine to use a `<table>` to lay a page out in columns?',
        choices: ['Yes, it is the standard way', 'No: tables are for data in rows and columns; page layout is a job for CSS flexbox and grid', 'Only for the footer'], answer: 1,
        why: 'Layout tables confuse screen readers, which announce rows and columns that mean nothing, and they are hard to make responsive.' }
    ],
    'html-forms': [
      { q: 'Why should every input have a `<label>` connected to it?',
        choices: ['The form will not submit without one', 'Screen readers read it as the input\'s name, and clicking the label focuses the input', 'It validates the input'], answer: 1,
        why: 'Connect them by putting the input inside the label, or with `for="id"`. A placeholder is not a label: it disappears as soon as you type.' },
      { q: 'An input has no `name` attribute. What happens to its value when the form is submitted?',
        choices: ['It is sent under the input\'s id', 'It is not sent at all', 'The browser makes up a name'], answer: 1,
        why: 'Only fields with a `name` are sent - like a `@RequestParam` with nothing to bind to. The id is for labels, CSS and JavaScript.' },
      { q: 'What does `<input type="email" required>` give you without any JavaScript?',
        choices: ['Nothing until you write a validator', 'The browser refuses to submit an empty or malformed email and says why; phones show an email keyboard', 'It sends a confirmation email'], answer: 1,
        why: 'Built-in validation is free. Validate on the server as well: the browser\'s checks can be bypassed, like any check on the client.' }
    ],
    'html-semantic': [
      { q: 'Apart from the name, what is the difference between `<div>` and `<nav>`?',
        choices: ['`<nav>` draws a menu bar', 'Nothing you can see - but `<nav>` tells browsers, screen readers and search engines that this is navigation', '`<nav>` loads faster'], answer: 1,
        why: 'Semantic elements carry meaning, not looks. Screen-reader users can jump straight to the `<nav>` or `<main>` landmark; a `<div>` says nothing about itself.' },
      { q: 'Why use a `<button>` rather than a `<div>` with a click listener?',
        choices: ['A `<button>` can take the focus, works with Enter and Space, and is announced as a button - a `<div>` does none of that', 'A `<div>` cannot have click listeners', 'Buttons are easier to style'], answer: 0,
        why: 'To make a `<div>` behave like a button you would need `tabindex`, `role="button"` and key handling. The real element comes with all of it.' },
      { q: 'How many visible `<main>` elements should a page have?',
        choices: ['One: it holds the page\'s main content', 'One per section', 'None: it is optional decoration'], answer: 0,
        why: '`<main>` is where "skip to content" lands. `<header>`, `<footer>` and `<article>` can appear many times; the visible `<main>` cannot.' }
    ],
    'css-attach': [
      { q: 'In `h1 { color: navy; }`, which part is the **selector**?',
        choices: ['`h1`', '`color`', '`navy`'], answer: 0,
        why: 'The selector picks the elements. `color: navy` is a declaration: a property and its value.' },
      { q: 'A semicolon is missing: `p { color: red font-size: 20px; }`. What does the browser do?',
        choices: ['It shows an error on the page', 'It silently drops the broken declaration and carries on', 'It ignores the whole stylesheet'], answer: 1,
        why: 'CSS never shows errors; it skips what it cannot read. Here `color: red font-size: 20px` is one invalid declaration, so neither the colour nor the size applies. The ⚠ in this tool\'s editors, and DevTools, help you find it.' },
      { q: 'Which way of adding CSS is best for a real site with several pages?',
        choices: ['A `style="…"` attribute on each element', 'One `.css` file, linked from every page with `<link rel="stylesheet">`', 'A `<style>` block copied into each page'], answer: 1,
        why: 'One file is written once, cached by the browser, and changes every page at once. `style` attributes are hard to maintain and beat almost every rule.' }
    ],
    'css-selectors': [
      { q: 'What does `nav a` select?',
        choices: ['Every `<a>` inside a `<nav>`, at any depth', 'Only the `<a>` elements that are direct children of `<nav>`', 'Every `<nav>` and every `<a>`'], answer: 0,
        why: 'A space means "descendant, at any depth". Direct children only is `nav > a`; "both" is a comma, `nav, a`.' },
      { q: 'Two rules set the colour of the same link: `#menu a` and `nav a`. Which one wins?',
        choices: ['Whichever is written last', '`#menu a`: the id makes it more specific', '`nav a`: it has more type selectors'], answer: 1,
        why: 'Specificity is compared first - ids, then classes, then types - so (1,0,1) beats (0,0,2). Order only decides between rules of equal specificity.' },
      { q: 'What is the difference between `li.active` and `li .active`?',
        choices: ['None', '`li.active` is an `li` with the class; `li .active` is an element with the class somewhere inside an `li`', 'The second one is invalid'], answer: 1,
        why: 'The space is a combinator. Without it, both conditions apply to the same element.' }
    ],
    'css-typography': [
      { q: 'Why are `rem` units recommended for font sizes?',
        choices: ['They are exactly the same as px', 'They scale with the root font size, so the text follows the user\'s font-size setting', 'They render faster'], answer: 1,
        why: '`1rem` is the root font size: 16px unless the user chose a bigger one. Text sized in `rem` grows for people who need it; text in `px` stays put.' },
      { q: 'Why is `line-height: 1.6` (no unit) usually better than `line-height: 1.6em`?',
        choices: ['They are the same', 'Without a unit it means "1.6 times the element\'s own font size", and children inherit the factor, not a fixed length', 'A value without a unit is not allowed'], answer: 1,
        why: 'With `em` the computed length is inherited: a large heading inside would get the small text\'s line height, and its lines would overlap.' },
      { q: 'You set `font-family` on `body` only. Why do the paragraphs and headings use it too?',
        choices: ['Because `font-family` is inherited', 'Because `body` is the only element', 'They do not: each element needs its own rule'], answer: 0,
        why: 'Text properties such as `color`, `font-*` and `line-height` are inherited. Box properties such as `margin`, `padding` and `border` are not.' }
    ],
    'css-box-model': [
      { q: 'A box has `width: 200px; padding: 20px; border: 5px solid`. How wide is it on screen, with the default box-sizing?',
        choices: ['200px', '250px', '240px'], answer: 1,
        why: 'By default `width` is the content only: 200 + 2 × 20 padding + 2 × 5 border = 250. With `box-sizing: border-box` it would be exactly 200.' },
      { q: 'Which layer lies **inside** the border and shows the element\'s background colour?',
        choices: ['The margin', 'The padding', 'Neither'], answer: 1,
        why: 'From the inside out: content, padding, border, margin. The padding shows the background; the margin is transparent space outside the border.' },
      { q: 'What does `margin: 0 auto` do to a block that has a set `width`?',
        choices: ['Centres it horizontally', 'Removes it from the page', 'Centres it vertically'], answer: 0,
        why: '`auto` left and right margins share the leftover space equally. Vertical centring needs flexbox or grid.' }
    ],
    'css-display': [
      { q: 'You set `width: 200px` on a `<span>` and nothing happens. Why?',
        choices: ['Spans cannot be styled', 'A span is `display: inline`, and inline boxes ignore width and height', 'It needs `!important`'], answer: 1,
        why: 'An inline box is as big as its text. Make it `display: inline-block` or `block` and the width applies.' },
      { q: 'What is the difference between `display: none` and `visibility: hidden`?',
        choices: ['None', '`display: none` removes the box and its space; `visibility: hidden` hides it but keeps its space', '`visibility: hidden` deletes the element from the HTML'], answer: 1,
        why: 'Both hide the element from screen readers too. Neither deletes it: JavaScript can still find it in the DOM.' },
      { q: 'What does `display: inline-block` combine?',
        choices: ['It sits in a line of text like inline, but takes width, height and vertical margins like a block', 'It is a hidden block', 'It is a flex container'], answer: 0,
        why: 'Before flexbox, `inline-block` was the usual way to put boxes side by side. Buttons and badges still use it.' }
    ],
    'css-flex-container': [
      { q: 'In a flex container with the default `flex-direction: row`, which property spreads the items along the row?',
        choices: ['`align-items`', '`justify-content`', '`text-align`'], answer: 1,
        why: '`justify-content` works along the main axis (the row); `align-items` works across it (up and down).' },
      { q: 'You switch to `flex-direction: column`. What does `justify-content: center` do now?',
        choices: ['It still centres horizontally', 'It centres vertically, because the main axis now runs top to bottom', 'Nothing'], answer: 1,
        why: 'The two properties follow the axes, not the screen. In a column, the main axis is vertical.' },
      { q: 'Which pair of declarations, on a flex container with a height, centres its child both ways?',
        choices: ['`text-align: center` and `vertical-align: middle`', '`justify-content: center` and `align-items: center`', '`margin: auto` on the container'], answer: 1,
        why: 'On `display: flex` - or `display: grid` with `place-items: center`. `vertical-align` only works on inline content and table cells.' }
    ],
    'css-flex-items': [
      { q: 'Three items have `flex-grow: 1` and one has `flex-grow: 2`. How is the spare space shared?',
        choices: ['Equally', 'The one with 2 gets a twice-as-big share of the **spare** space', 'The one with 2 ends up exactly twice as wide as the others'], answer: 1,
        why: '`flex-grow` shares out the space that is left over, not the total width. With `flex-basis: 0` (which `flex: 2` sets) the widths do come out 1 : 1 : 1 : 2.' },
      { q: 'What does `flex: 1` mean?',
        choices: ['Grow and shrink equally, starting from a basis of zero (`1 1 0%`)', 'Make the item 1px wide', 'Show the item first'], answer: 0,
        why: 'Give every item `flex: 1` for equal columns. Changing the order of items is the `order` property.' },
      { q: 'A 200px sidebar gets squeezed narrower on small screens. How do you stop it shrinking?',
        choices: ['`flex-shrink: 0` (or `flex: 0 0 200px`)', '`flex-grow: 0`', '`width: 200px !important`'], answer: 0,
        why: 'Flex items may shrink below their width by default (`flex-shrink: 1`). `flex-shrink: 0` keeps the sidebar at its basis.' }
    ],
    'css-grid': [
      { q: 'What does `grid-template-columns: 200px 1fr 1fr` make?',
        choices: ['Three columns: 200px, then the rest shared equally by two', 'Three columns of 200px', 'One 200px column that wraps'], answer: 0,
        why: '`fr` is a share of the space left after the fixed sizes and the gaps.' },
      { q: 'How do you make an item cover columns 1, 2 and 3?',
        choices: ['`grid-column: 1 / 3`', '`grid-column: 1 / 4`', '`grid-columns: 3`'], answer: 1,
        why: 'Grid counts **lines**, not columns: three columns have lines 1 to 4, so columns 1 to 3 run from line 1 to line 4. `span 3` works too, and `-1` means the last line.' },
      { q: 'When would you choose grid over flexbox?',
        choices: ['When you lay things out in rows **and** columns at once, like a page layout or a gallery', 'Never: grid is the old way', 'Only for tables'], answer: 0,
        why: 'Flexbox is one-dimensional: a row or a column of items. Grid is two-dimensional. They mix happily - a grid page with flexbox navigation bars.' }
    ],
    'css-position': [
      { q: 'An element has `position: absolute; top: 0; right: 0`. What is it placed against?',
        choices: ['The browser window, always', 'Its nearest positioned ancestor (`relative`, `absolute`, `fixed` or `sticky`), or the page if there is none', 'Its previous sibling'], answer: 1,
        why: 'That is why the badge pattern gives the card `position: relative`: the card becomes the reference box without moving.' },
      { q: 'What happens to the space an element took up once it is `position: absolute`?',
        choices: ['It stays empty', 'It closes up: the element leaves the normal flow, and the rest moves as if it were not there', 'It doubles'], answer: 1,
        why: 'With `position: relative` the space is kept and the box only shifts on screen; `absolute` takes it out of the flow.' },
      { q: 'An element has `z-index: 999` and is still drawn under another one. What is a likely reason?',
        choices: ['z-index stops at 100', 'It is `position: static` (z-index needs a positioned element or a flex or grid item), or a parent forms a lower stacking context', 'It needs `!important`'], answer: 1,
        why: 'z-index only compares elements inside the same stacking context. A parent with its own lower `z-index`, an `opacity` below 1 or a `transform` caps all its children.' }
    ],
    'css-responsive': [
      { q: 'What does "mobile-first" CSS mean?',
        choices: ['The site only works on phones', 'Write the base styles for small screens, then add `@media (min-width: …)` rules for bigger ones', 'Load the CSS on phones first'], answer: 1,
        why: 'Small screens get the simplest layout; wider screens add columns. The media queries then only ever add things, which keeps them few.' },
      { q: 'What does `<meta name="viewport" content="width=device-width, initial-scale=1">` do?',
        choices: ['Makes the page load faster on phones', 'Tells a phone to use its real screen width, instead of pretending to be a 980px desktop and zooming out', 'Hides the page on desktops'], answer: 1,
        why: 'Without it, a phone lays the page out like a desktop and shrinks it, so your media queries never match.' },
      { q: 'Which declaration makes an image shrink to fit a narrow column but never grow past its own size?',
        choices: ['`width: 100%`', '`max-width: 100%`', '`min-width: 100%`'], answer: 1,
        why: '`width: 100%` would also stretch a small image up. `max-width: 100%` only caps it.' }
    ],
    'css-variables': [
      { q: 'How do you declare and use a CSS variable?',
        choices: ['`$brand: blue;` then `color: $brand;`', '`--brand: blue;` then `color: var(--brand);`', '`var brand = blue;` then `color: brand;`'], answer: 1,
        why: 'Custom properties start with two dashes and are read with `var()`. `$brand` is Sass, a preprocessor; CSS variables are live in the browser.' },
      { q: 'Why are variables usually declared on `:root`?',
        choices: ['The browser requires it', '`:root` is the `<html>` element and variables are inherited, so every element can read them', 'It makes them constants'], answer: 1,
        why: 'Variables cascade like any property. Declare one again on `.dark`, or in a media query, and everything inside follows - which is how theme switches work.' },
      { q: 'What does `width: calc(100% - 40px)` let you do that a single unit cannot?',
        choices: ['Mix units - a percentage minus a fixed length - worked out by the browser during layout', 'Calculate once, when the page loads', 'Nothing: it equals 60%'], answer: 0,
        why: 'Only during layout does the browser know what 100% is. Keep the spaces around `-`: `calc(100%-40px)` is invalid.' }
    ],
    'css-motion': [
      { q: 'Where should `transition: background-color 0.3s` go, so a hover change animates both ways?',
        choices: ['On the normal rule (`.btn`), not only on `.btn:hover`', 'Only on `.btn:hover`', 'Inside a `@keyframes` block'], answer: 0,
        why: 'On the normal rule it applies when the hover starts and when it ends. Put it only on `:hover`, and leaving the button snaps back without animating.' },
      { q: 'Why animate `transform` and `opacity` rather than `width`, `top` or `margin`?',
        choices: ['They are the only properties that can be animated', 'The browser can animate them without laying the page out again, so they stay smooth', 'They work in older browsers'], answer: 1,
        why: 'Animating `width` or `top` makes the browser redo the layout on every frame. `transform: translateX()` moves the drawn pixels instead.' },
      { q: 'What is the difference between a transition and an animation?',
        choices: ['None', 'A transition animates a change between two states, such as hover on and off; an animation runs `@keyframes` by itself and can loop', 'An animation only works with JavaScript'], answer: 1,
        why: 'Use a transition for reactions, and an animation for things that move on their own, like a spinner or a pulse.' }
    ],
    'js-basics': [
      { q: 'Which keyword should you use, by default, for a variable you never reassign?',
        choices: ['`var`', '`let`', '`const`'], answer: 2,
        why: '`const` is like Java\'s `final`: the variable cannot be reassigned, though an object it holds can still change. Use `let` when you must reassign; avoid `var`, whose scope is the whole function.' },
      { q: 'What does `"5" == 5` give, and what should you write instead?',
        choices: ['`false`, so it is fine', '`true`, because `==` converts the types; write `===`, which does not', 'An error'], answer: 1,
        why: '`===` compares without converting. And unlike Java, `===` on two strings compares their text, so there is no `.equals()` to remember.' },
      { q: 'What is `[3, 1, 2].map(x => x * 2)`?',
        choices: ['`[6, 2, 4]`', '`12`', '`[3, 1, 2, 6, 2, 4]`'], answer: 0,
        why: '`map` returns a new array with the function applied to each item, like `stream().map(...).toList()`. The arrow function `x => x * 2` is a lambda.' }
    ],
    'js-dom': [
      { q: 'Three elements have the class `item`. What does `document.querySelector(".item")` return?',
        choices: ['All three, as a list', 'The first one only', '`null`'], answer: 1,
        why: '`querySelector` returns the first match, or `null` when nothing matches. `querySelectorAll` returns them all.' },
      { q: 'Why write `el.textContent = userInput` rather than `el.innerHTML = userInput`?',
        choices: ['It is shorter', '`textContent` shows it as plain text; `innerHTML` would turn any HTML in it into elements, which lets attackers inject scripts (XSS)', '`innerHTML` is deprecated'], answer: 1,
        why: 'Keep `innerHTML` for HTML you wrote yourself. Anything a user typed goes in with `textContent`.' },
      { q: 'What is the usual way to change several styles of an element from JavaScript?',
        choices: ['Set `el.style.color`, `el.style.fontSize` and the rest one by one', 'Toggle a class (`el.classList.toggle("active")`) and keep the styles in the CSS', 'Rewrite the stylesheet'], answer: 1,
        why: 'The CSS stays in one place, and each state (active, open, error) becomes a class name you can see in DevTools.' }
    ],
    'js-events': [
      { q: 'What is wrong with `button.addEventListener("click", handleClick())`?',
        choices: ['Nothing', 'It calls `handleClick` straight away and passes its result; write `handleClick` without the parentheses', '"click" should be "onclick"'], answer: 1,
        why: 'Pass the function itself, like the method reference `this::handleClick`. With `()`, it runs once when the line runs, and never on a click.' },
      { q: 'Inside a click listener, what is `e.target`?',
        choices: ['The element the listener was added to', 'The element that was actually clicked - possibly a child of the listener\'s element', 'The mouse position'], answer: 1,
        why: 'The listener\'s own element is `e.currentTarget`. The difference between the two is what makes event delegation work.' },
      { q: 'What is **event delegation**?',
        choices: ['One listener on a parent handles events from many children, because events bubble up', 'Passing an event to another function', 'Removing listeners'], answer: 0,
        why: 'One listener on a `<ul>` serves every `<li>`, including items added later. `e.target.closest("li")` tells you which one.' }
    ],
    'js-devtools': [
      { q: 'In the Styles panel, a declaration is struck through, **without** a warning icon. What does that mean?',
        choices: ['It has a typo', 'Another rule that sets the same property wins (higher specificity, or later), so this one is overridden', 'It is commented out'], answer: 1,
        why: 'The winning declaration is listed above it. An invalid value is struck through too, but with a ⚠ warning icon beside it.' },
      { q: 'Where do JavaScript errors such as "TypeError: x is not a function" appear, with their file and line?',
        choices: ['In the Elements panel', 'In the Console panel', 'Nowhere: the page just stops'], answer: 1,
        why: 'The Console shows the message with a link to the line; clicking it opens that line in the Sources panel.' },
      { q: 'What does the `debugger;` statement do while DevTools is open?',
        choices: ['Prints every variable', 'Pauses the script on that line, like a breakpoint in IntelliJ', 'Reloads the page'], answer: 1,
        why: 'While paused you can hover variables, step over and into calls, and use the Console in that scope. With DevTools closed, it does nothing.' }
    ],
    'js-forms': [
      { q: 'Which event fires on every keystroke in a text input?',
        choices: ['`change`', '`input`', '`submit`'], answer: 1,
        why: '`input` fires on each edit. `change` fires once, when the user leaves the field (or picks an option in a `<select>`).' },
      { q: 'Why call `e.preventDefault()` in a form\'s `submit` listener?',
        choices: ['To stop the browser sending the form and loading a new page, so your JavaScript can handle it', 'To clear the form', 'To validate the form'], answer: 0,
        why: 'Without it, the browser submits the form itself and your page is replaced. With it, you send the data with `fetch` and stay on the page.' },
      { q: 'What type is `input.value` for `<input type="number">`?',
        choices: ['A number', 'A string', 'It depends on what was typed'], answer: 1,
        why: '`.value` is always a string, so `"2" + 1` gives `"21"`. Use `input.valueAsNumber` or `Number(input.value)`.' }
    ],
    'js-todo': [
      { q: 'What does `document.createElement("li")` do on its own?',
        choices: ['Adds an `<li>` to the page', 'Creates an `<li>` in memory; it appears only when you add it, with `append()` or similar', 'Finds the first `<li>`'], answer: 1,
        why: 'Like `new` in Java: the object exists, but nothing shows until you attach it to the tree.' },
      { q: 'Items are added to a list after the page has loaded. Why does one listener on the `<ul>` still handle their clicks?',
        choices: ['A click on an `<li>` bubbles up to the `<ul>`', 'It does not: each new item needs its own listener', 'The `<ul>` copies its listeners to new children'], answer: 0,
        why: 'That is event delegation: the parent listens once, and `e.target.closest("li")` finds the item.' },
      { q: 'How do you remove an element from the page?',
        choices: ['`el.remove()`', '`el.hidden = true`', '`delete el`'], answer: 0,
        why: '`hidden` only hides it - it is still in the DOM. `delete` removes object properties, not elements.' }
    ],
    'js-fetch': [
      { q: 'What does `fetch("/api/users")` return?',
        choices: ['The array of users', 'A Promise of a Response; then `await res.json()` gives the data', 'A string of JSON'], answer: 1,
        why: 'Two asynchronous steps: the response arrives, then its body is read and parsed. Like a `CompletableFuture<ResponseEntity>`.' },
      { q: 'The server answers 404. Does `await fetch(...)` throw?',
        choices: ['Yes', 'No: fetch only fails when there is no response at all (no network). Check `res.ok` or `res.status` yourself', 'Only in Chrome'], answer: 1,
        why: 'An HTTP error is still a response. `if (!res.ok) throw new Error("HTTP " + res.status);` is the usual line.' },
      { q: 'Does `await` freeze the page while it waits for the server?',
        choices: ['Yes, like a blocking call in Java', 'No: the function pauses, but the browser keeps running other code and handling clicks until the answer comes', 'Only for a slow server'], answer: 1,
        why: '`await` hands control back to the event loop (see [[explain:event-loop]]). The rest of the function carries on later, as a microtask.' }
    ],
    'js-spring': [
      { q: 'You POST JSON with `fetch`, and Spring answers **415 Unsupported Media Type**. What is missing?',
        choices: ['`@ResponseBody`', 'The header `Content-Type: application/json`', 'A CSRF token'], answer: 1,
        why: 'Without it, a string body goes out as `text/plain`, and `@RequestBody` will not read it. Send `headers: { "Content-Type": "application/json" }` with `body: JSON.stringify(data)`.' },
      { q: 'A page on `localhost:5173` calls an API on `localhost:8080`, and the console shows a CORS error. Why?',
        choices: ['The API is down', 'A different port is a different origin; the browser blocks the answer unless the server allows that origin, for example with `@CrossOrigin`', 'fetch cannot call localhost'], answer: 1,
        why: 'CORS is enforced by the browser: the request does reach Spring, but the browser hides the answer from your script. curl and Postman ignore CORS entirely.' },
      { q: '`@Valid` rejects a request, and your error handler answers 400 with a list of field errors. What should the page do?',
        choices: ['Show a general "Something went wrong"', 'Read the JSON body and show each message next to its field', 'Send the request again'], answer: 1,
        why: 'The 400 body says exactly which field is wrong and why. Showing it beside the field turns a server rule into help for the user.' }
    ],
    'js-capstone': [
      { q: 'What is the simplest way to switch a page between a light and a dark theme from JavaScript?',
        choices: ['Change the colour of every element in a loop', 'Toggle one class on `<html>` or `<body>`, and let CSS variables under that class change the colours', 'Load a second page'], answer: 1,
        why: 'JavaScript flips one switch and the CSS does the rest: the variables cascade to every element at once.' },
      { q: 'After `localStorage.setItem("likes", 5)`, what does `localStorage.getItem("likes")` return?',
        choices: ['The number 5', 'The string "5"', '`undefined`'], answer: 1,
        why: 'localStorage stores strings only. Convert on the way back with `Number(...)`, or store objects with `JSON.stringify` and read them with `JSON.parse`.' },
      { q: 'What does `el.hidden = true` do?',
        choices: ['Sets the `hidden` attribute, which the browser shows as `display: none`', 'Deletes the element', 'Makes it transparent but still clickable'], answer: 0,
        why: 'A tidy way to show and hide things. Watch out: any CSS rule that sets `display` on the element beats it.' }
    ]
  };
})(window.UILT);
