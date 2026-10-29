/*
 * Lessons, track 1: HTML. Shape of a lesson (read by js/views/lessons.js):
 *   id, track, title, summary, keywords[], modes (editor tabs), body (Markdown), java (Markdown),
 *   example: {html, css, js, note}, related: ['css:display', 'html:a', ...],
 *   challenge: {title, task (Markdown), starter: {html, css, js}, solution: {...}, hints: [...],
 *               checks: [{label, ...check}]}  - check types are listed at the top of lessons.js.
 * Every challenge's starter must FAIL at least one check and its solution must PASS all of them
 * (tests/test_ui.py verifies both).
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  L.push(
    {
      id: 'html-skeleton', track: 'HTML', modes: ['html'],
      title: 'How a web page works',
      summary: 'What the browser does with a page, the three languages, and the skeleton every page starts from.',
      keywords: ['start', 'basics', 'doctype', 'skeleton', 'first page'],
      body: [
        'When you open a page, the browser downloads an **HTML** file, reads it top to bottom, and builds a tree of objects from it (the DOM). Then it applies **CSS** to decide how each part looks, and runs **JavaScript** to make parts react. Three languages, three jobs:',
        '- **HTML** - the structure and meaning: "this is a heading, this is a list, this is a button".\n- **CSS** - the presentation: colours, sizes, spacing, layout.\n- **JavaScript** - the behaviour: what happens when you click, type or scroll.',
        '## Elements',
        'HTML is made of **elements**, written with **tags**: `<p>Hello</p>` is a paragraph element with an opening tag, some content and a closing tag. Elements nest inside each other like boxes, and can carry **attributes** - extra settings in the opening tag, such as `lang="en"`. The HTML tab of this tool opens with a labelled diagram of these parts.',
        '## The skeleton',
        'Every page starts the same way:',
        '```html\n<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>Page title</title>\n</head>\n<body>\n  Everything visible goes here.\n</body>\n</html>\n```',
        '- `<!doctype html>` switches on modern standards mode.\n- `<html lang="en">` is the root and says the page is in English.\n- `<head>` holds information *about* the page; nothing in it is drawn.\n- `<body>` holds everything you see.',
        'HTML is forgiving: a typo rarely produces an error, the browser just guesses. That is convenient, but it means you must look at the result - which is exactly what the live preview is for.'
      ].join('\n\n'),
      java: 'Think MVC: HTML is the model of the page\'s content, CSS is the view styling, JavaScript is the controller. And the DOM the browser builds is the same idea as parsing XML into `org.w3c.dom` objects in Java.',
      example: {
        html: '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>My first page</title>\n</head>\n<body>\n  <h1>Hello, web!</h1>\n  <p>This is my first page. Edit me!</p>\n  <!-- This is a comment: the browser ignores it -->\n</body>\n</html>',
        note: 'Change the heading text and watch the preview update.'
      },
      related: ['html:html', 'html:head', 'html:body', 'html:title', 'explain:dom-tree'],
      challenge: {
        title: 'A page about you',
        task: 'Complete the skeleton:\n\n1. Give `<html>` a `lang` attribute.\n2. Add a `<title>` inside `<head>`.\n3. In the body, add an `<h1>` with your name and a `<p>` saying what you do.',
        starter: { html: '<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n</head>\n<body>\n\n</body>\n</html>' },
        solution: { html: '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>About Ravi</title>\n</head>\n<body>\n  <h1>Ravi</h1>\n  <p>I build backend systems in Java, and now I am learning the front end.</p>\n</body>\n</html>' },
        hints: ['Attributes go inside the opening tag: `<html lang="en">`.', 'The title goes between `<head>` and `</head>`: `<title>About me</title>`.'],
        checks: [
          { label: '`<html>` has a `lang` attribute', attr: 'html', name: 'lang', match: '^[a-z]{2}' },
          { label: 'There is a `<title>` with some text', text: 'head title', match: '\\S' },
          { label: 'The body has an `<h1>` with text', text: 'body h1', match: '\\S' },
          { label: 'There is a paragraph `<p>` with text', text: 'body p', match: '\\S' }
        ]
      }
    },
    {
      id: 'html-text', track: 'HTML', modes: ['html'],
      title: 'Text: headings, paragraphs, block and inline',
      summary: 'Headings give the page its outline; paragraphs and inline tags give text meaning.',
      keywords: ['headings', 'paragraph', 'strong', 'em', 'block', 'inline', 'whitespace'],
      body: [
        '## Headings',
        '`<h1>` to `<h6>` are headings by importance: `<h1>` is the page title, `<h2>` a section, `<h3>` a sub-section. Pick the level by meaning, never by size - CSS handles size. Screen-reader users jump between headings to skim a page, the way you skim a table of contents.',
        '## Paragraphs and whitespace',
        'Text goes in `<p>` elements. Inside HTML, line breaks and runs of spaces collapse into a single space - type five spaces and you get one. To start a new paragraph, start a new `<p>`; for a line break inside a poem or address, use `<br>`.',
        '## Block and inline',
        'This is the most useful idea in this lesson:',
        '- **Block** elements (`<h1>`, `<p>`, `<div>`, `<ul>`) start on a new line and take the full width.\n- **Inline** elements (`<strong>`, `<em>`, `<a>`, `<span>`) sit inside a line of text and are only as wide as their content.',
        '```html\n<p>This is <strong>important</strong> and this is <em>stressed</em>.</p>\n```',
        '`<strong>` means "important" (shown bold), `<em>` means "stressed" (shown italic). Both carry meaning; if you only want bold *looks*, that is a CSS job ([[css:font-weight]]).'
      ].join('\n\n'),
      java: 'Whitespace in HTML text behaves like whitespace in Java source code: it separates words but its amount does not matter. `<pre>` is the exception, like a Java text block.',
      example: {
        html: '<h1>Learning the web</h1>\n<p>HTML gives a page its <strong>structure</strong>.\n   These   extra   spaces collapse.</p>\n<h2>Why it matters</h2>\n<p>Screen readers use headings to <em>navigate</em>.</p>\n<p>Roses are red,<br>violets are blue.</p>'
      },
      related: ['html:h1', 'html:p', 'html:strong', 'html:em', 'html:br', 'css:display'],
      challenge: {
        title: 'A recipe page',
        task: 'Write a short recipe:\n\n1. An `<h1>` with the dish name.\n2. Below it, an `<h2>` that says "Ingredients".\n3. At least two paragraphs.\n4. One word inside a paragraph marked as important with `<strong>`, and one stressed word with `<em>`.',
        starter: { html: '<h1>Masala chai</h1>\n' },
        solution: { html: '<h1>Masala chai</h1>\n<h2>Ingredients</h2>\n<p>Water, milk, tea leaves, ginger, cardamom and sugar.</p>\n<p>Boil the water with the spices <strong>first</strong>, then add the tea - it is <em>much</em> stronger that way.</p>' },
        hints: ['Headings and paragraphs are siblings: `<h2>Ingredients</h2>` then `<p>…</p>`.', '`<strong>` goes *inside* the paragraph, around one word: `<p>Add <strong>salt</strong> last.</p>`.'],
        checks: [
          { label: 'There is an `<h1>`', exists: 'h1' },
          { label: 'An `<h2>` comes after the `<h1>`', fn: 'function (doc) { var a = doc.querySelector("h1"), b = doc.querySelector("h2"); if (!b) return "no <h2> yet"; return !!a && !!(a.compareDocumentPosition(b) & 4); }' },
          { label: 'At least two paragraphs', count: 'p', min: 2 },
          { label: 'A `<strong>` inside a paragraph', exists: 'p strong' },
          { label: 'An `<em>` inside a paragraph', exists: 'p em' }
        ]
      }
    },
    {
      id: 'html-links-images', track: 'HTML', modes: ['html', 'css'],
      title: 'Links and images',
      summary: 'Connect pages with <a> and show pictures with <img>, using absolute and relative URLs.',
      keywords: ['link', 'href', 'image', 'img', 'alt', 'url', 'target'],
      body: [
        '## Links',
        '```html\n<a href="https://developer.mozilla.org">Read the docs</a>\n```',
        'The `href` is the destination:',
        '- **Absolute URL**: `https://example.com/page` - another site.\n- **Relative URL**: `about.html` or `images/logo.png` - a file next to this page.\n- **Fragment**: `#pricing` - jumps to the element with `id="pricing"` on this page.\n- **mailto: / tel:** - open the email app or the phone dialer.',
        'Add `target="_blank"` to open a new tab. Write link text that makes sense on its own - "Read the docs", not "click here".',
        '## Images',
        '```html\n<img src="avatar.svg" alt="Ravi smiling" width="96">\n```',
        '`<img>` is a **void** element: no content, no closing tag. `src` is the file; `alt` describes it for people who cannot see it and appears if the file fails to load. `width`/`height` are in pixels without a unit, and setting them lets the browser reserve space before the image arrives.',
        'This tool has sample images you can use anywhere: `landscape.svg`, `portrait.svg`, `avatar.svg`, `tile.svg`.'
      ].join('\n\n'),
      java: 'An `href` is resolved like a relative path in `java.nio.file.Path.resolve()`: relative to the current page\'s folder unless it starts with `/` or a scheme like `https:`.',
      example: {
        html: '<p>Visit <a href="https://developer.mozilla.org" target="_blank">MDN</a> or jump to <a href="#photo">the photo</a>.</p>\n<img id="photo" src="landscape.svg" alt="Green hills under a blue sky" width="240">\n<p><a href="mailto:ravi@example.com">Email me</a></p>',
        css: 'img {\n  border-radius: 8px;\n}'
      },
      related: ['html:a', 'html:img', 'html:figure', 'css:object-fit'],
      challenge: {
        title: 'A profile card',
        task: 'Build a profile card:\n\n1. An `<img>` showing `avatar.svg`, with a meaningful `alt` text and `width="96"`.\n2. Your name in an `<h2>`.\n3. A link to `https://github.com` that opens in a **new tab**.\n4. A `mailto:` link to an email address.',
        starter: { html: '<div class="card">\n  \n</div>', css: '.card {\n  width: 240px;\n  padding: 16px;\n  border: 1px solid #d9dde8;\n  border-radius: 10px;\n  text-align: center;\n}' },
        solution: { html: '<div class="card">\n  <img src="avatar.svg" alt="Ravi\'s avatar" width="96">\n  <h2>Ravi</h2>\n  <p><a href="https://github.com" target="_blank">My GitHub</a></p>\n  <p><a href="mailto:ravi@example.com">Email me</a></p>\n</div>', css: '.card {\n  width: 240px;\n  padding: 16px;\n  border: 1px solid #d9dde8;\n  border-radius: 10px;\n  text-align: center;\n}' },
        hints: ['`<img src="avatar.svg" alt="My avatar" width="96">` - no closing tag.', 'New tab: `<a href="https://github.com" target="_blank">GitHub</a>`. Email: `<a href="mailto:me@example.com">Email me</a>`.'],
        checks: [
          { label: 'The image uses `avatar.svg`', source: 'html', match: '<img[^>]+src\\s*=\\s*["\']?avatar\\.svg' },
          { label: 'The image has a meaningful `alt` (3+ letters)', attr: 'img', name: 'alt', match: '[A-Za-z]{3,}' },
          { label: 'The image is 96px wide', rect: 'img', side: 'width', min: 95, max: 97 },
          { label: 'Your name is in an `<h2>`', text: 'h2', match: '\\S' },
          { label: 'A GitHub link opens in a new tab', attr: 'a[href^="https://github.com"]', name: 'target', equals: '_blank' },
          { label: 'There is a `mailto:` link', exists: 'a[href^="mailto:"]' }
        ]
      }
    },
    {
      id: 'html-lists-tables', track: 'HTML', modes: ['html', 'css'],
      title: 'Lists and tables',
      summary: 'Group items with <ul> and <ol>; show data in rows and columns with <table>.',
      keywords: ['list', 'ul', 'ol', 'li', 'table', 'th', 'td', 'tr'],
      body: [
        '## Lists',
        '`<ul>` is an unordered (bulleted) list, `<ol>` an ordered (numbered) one. Their only allowed children are `<li>` items - but an item can contain anything, including another list.',
        '```html\n<ul>\n  <li>Milk</li>\n  <li>Bread\n    <ul>\n      <li>Whole wheat</li>\n    </ul>\n  </li>\n</ul>\n```',
        'Lists are everywhere: menus, card grids, search results. CSS can remove the bullets ([[css:list-style-type]]) and lay them out in a row.',
        '## Tables',
        'Use a table for real tabular data - things you would put in a spreadsheet - never for page layout.',
        '```html\n<table>\n  <thead>\n    <tr><th>Item</th><th>Price</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Tea</td><td>₹20</td></tr>\n  </tbody>\n</table>\n```',
        '- `<tr>` is a row, `<th>` a header cell, `<td>` a data cell.\n- `<thead>` / `<tbody>` group the rows.\n- `colspan="2"` / `rowspan="2"` merge cells.',
        'Tables have no borders by default; add them with CSS (`border`, `border-collapse: collapse`).'
      ].join('\n\n'),
      java: 'A `<ul>` is a `List<String>` rendered with bullets; a table is a `List<List<String>>` with a header row - like a JDBC `ResultSet` on screen.',
      example: {
        html: '<h3>To do</h3>\n<ol>\n  <li>Learn HTML</li>\n  <li>Learn CSS</li>\n  <li>Learn JavaScript</li>\n</ol>\n<table>\n  <thead>\n    <tr><th>Language</th><th>Job</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>HTML</td><td>Structure</td></tr>\n    <tr><td>CSS</td><td>Looks</td></tr>\n  </tbody>\n</table>',
        css: 'table {\n  border-collapse: collapse;\n}\nth, td {\n  border: 1px solid #b9bfd0;\n  padding: 4px 10px;\n}'
      },
      related: ['html:ul', 'html:ol', 'html:li', 'html:table', 'html:th', 'html:td', 'css:border-collapse'],
      challenge: {
        title: 'Shopping list and price table',
        task: '1. A `<ul>` shopping list with at least **3** items.\n2. A `<table>` with a header row of `<th>` cells "Item" and "Price", and at least **2** data rows of `<td>` cells.',
        starter: { html: '<h3>Shopping</h3>\n\n<h3>Prices</h3>\n', css: 'table {\n  border-collapse: collapse;\n}\nth, td {\n  border: 1px solid #b9bfd0;\n  padding: 4px 10px;\n}' },
        solution: { html: '<h3>Shopping</h3>\n<ul>\n  <li>Milk</li>\n  <li>Bread</li>\n  <li>Eggs</li>\n</ul>\n<h3>Prices</h3>\n<table>\n  <thead>\n    <tr><th>Item</th><th>Price</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Milk</td><td>₹30</td></tr>\n    <tr><td>Bread</td><td>₹45</td></tr>\n  </tbody>\n</table>', css: 'table {\n  border-collapse: collapse;\n}\nth, td {\n  border: 1px solid #b9bfd0;\n  padding: 4px 10px;\n}' },
        hints: ['Each list item is `<li>…</li>` directly inside the `<ul>`.', 'A row is `<tr>`, with `<th>` cells in the header row and `<td>` cells in the data rows.'],
        checks: [
          { label: 'A `<ul>` with at least 3 `<li>` items', count: 'ul > li', min: 3 },
          { label: 'The table has at least 2 header cells (`<th>`)', count: 'table th', min: 2 },
          { label: 'The table has at least 2 rows of `<td>` data', count: 'table tr:has(td)', min: 2 }
        ]
      }
    },
    {
      id: 'html-forms', track: 'HTML', modes: ['html', 'css'],
      title: 'Forms and inputs',
      summary: 'Collect input with <form>, <label>, <input> types, and built-in validation.',
      keywords: ['form', 'input', 'label', 'button', 'required', 'validation', 'submit'],
      body: [
        'A form collects values and sends them somewhere when submitted. The browser does a lot for free: Enter submits, `required` fields are checked, `type="email"` checks the format, and phones show the right keyboard.',
        '```html\n<form action="/signup" method="post">\n  <label for="email">Email</label>\n  <input id="email" name="email" type="email" required>\n  <button>Sign up</button>\n</form>\n```',
        '## The important attributes',
        '- `name` - the key the value is sent under. **No name, not sent.**\n- `type` - text, email, password, number, date, checkbox, radio… (22 types: see [[html:input]]).\n- `required`, `minlength`, `maxlength`, `min`, `max`, `pattern` - validation rules.\n- `placeholder` - a hint inside the field (not a replacement for a label).',
        '## Labels',
        'Every field needs a `<label>`. Connect it with `for` = the field\'s `id`, or wrap the field inside the label. Clicking the label then focuses the field, and screen readers read the label aloud.',
        'In this tool\'s previews, submitting does not send anything; a message under the preview shows what would have been sent.'
      ].join('\n\n'),
      java: 'With `method="post"`, the browser sends what a Spring controller receives as `@RequestParam String email` - the input\'s `name` is the parameter name. Browser validation is a convenience for the user; the server must still validate.',
      example: {
        html: '<form action="/subscribe" method="post">\n  <p>\n    <label for="name">Name</label><br>\n    <input id="name" name="name" required>\n  </p>\n  <p>\n    <label><input type="checkbox" name="news" checked> Send me news</label>\n  </p>\n  <button>Subscribe</button>\n</form>',
        css: 'input:invalid {\n  border-color: crimson;\n}'
      },
      related: ['html:form', 'html:input', 'html:label', 'html:button', 'html:fieldset'],
      challenge: {
        title: 'A sign-up form',
        task: 'Build a sign-up form inside the `<form>`:\n\n1. A text field for the name and an `type="email"` field - both with a `name` and both **required**.\n2. A password field with `minlength="8"`.\n3. A checkbox "I agree".\n4. Every field has a `<label>`.\n5. A submit button.',
        starter: { html: '<form action="/signup" method="post">\n  <!-- your fields here -->\n</form>', css: 'label {\n  display: block;\n  margin-top: 8px;\n}' },
        solution: {
          html: '<form action="/signup" method="post">\n  <label for="name">Name</label>\n  <input id="name" name="name" required>\n  <label for="email">Email</label>\n  <input id="email" name="email" type="email" required>\n  <label for="pw">Password</label>\n  <input id="pw" name="password" type="password" minlength="8">\n  <label><input type="checkbox" name="agree"> I agree</label>\n  <button>Sign up</button>\n</form>',
          css: 'label {\n  display: block;\n  margin-top: 8px;\n}'
        },
        hints: ['`<label for="email">Email</label>` + `<input id="email" name="email" type="email" required>` - the `for` must equal the `id`.', 'For the checkbox, wrapping is easiest: `<label><input type="checkbox" name="agree"> I agree</label>`.'],
        checks: [
          { label: 'A required, named email field', exists: 'form input[type="email"][name][required]' },
          { label: 'A required, named text field for the name', exists: 'form input:not([type])[name][required], form input[type="text"][name][required]' },
          { label: 'A password field with `minlength="8"`', exists: 'form input[type="password"][minlength="8"]' },
          { label: 'A checkbox', exists: 'form input[type="checkbox"]' },
          { label: 'Every field has a label', fn: 'function (doc) { var f = Array.prototype.slice.call(doc.querySelectorAll("form input:not([type=submit]):not([type=hidden]):not([type=button])")); if (!f.length) return "no fields yet"; var bad = f.filter(function (i) { return !i.labels || !i.labels.length; }); return bad.length ? bad.length + " field(s) without a label" : true; }' },
          { label: 'A submit button', exists: 'form button:not([type="button"]):not([type="reset"]), form input[type="submit"]' }
        ]
      }
    },
    {
      id: 'html-semantic', track: 'HTML', modes: ['html', 'css'],
      title: 'Semantic layout and accessibility',
      summary: 'Use elements that say what things are - header, nav, main, article, footer - and why that matters.',
      keywords: ['semantic', 'accessibility', 'a11y', 'header', 'nav', 'main', 'footer', 'landmarks'],
      body: [
        'A `<div>` says nothing about its content. **Semantic** elements do:',
        '- `<header>` - the top of the page (logo, title)\n- `<nav>` - the main navigation links\n- `<main>` - the content unique to this page (one per page)\n- `<article>` - a self-contained piece: a post, a card\n- `<section>` - a themed part with a heading\n- `<aside>` - related, secondary content\n- `<footer>` - the bottom: copyright, contacts',
        'They look exactly like divs. Their value is meaning: screen readers list them as **landmarks** so users can jump straight to the menu or the content, search engines understand the page better, and the next developer reads the HTML faster.',
        '## Accessibility basics',
        'Accessibility means people using screen readers, keyboards only or zoom can use your page. Most of it comes free with correct HTML:',
        '- `lang` on `<html>`, a real `<title>`.\n- Headings in order, one `<h1>`.\n- `alt` on every image.\n- A `<label>` for every field.\n- `<button>` for actions and `<a href>` for navigation - never a clickable `<div>`.',
        'Try it yourself: press **Tab** in a page. Everything you can click should be reachable, in a sensible order, with a visible focus ring.'
      ].join('\n\n'),
      java: 'Like choosing precise types over `Object`: `List<Order>` documents intent and lets tools help you. `<nav>` versus `<div class="nav">` is the same trade.',
      example: {
        html: '<header>\n  <strong>MySite</strong>\n  <nav><a href="#">Home</a> · <a href="#">Blog</a></nav>\n</header>\n<main>\n  <article>\n    <h1>Hello</h1>\n    <p>An article that makes sense on its own.</p>\n  </article>\n  <aside>Related links</aside>\n</main>\n<footer>© 2026</footer>',
        css: 'header, nav, main, article, aside, footer {\n  border: 1px dashed #9aa3b8;\n  margin: 4px;\n  padding: 4px;\n}'
      },
      related: ['html:header', 'html:nav', 'html:main', 'html:article', 'html:aside', 'html:footer', 'html:section'],
      challenge: {
        title: 'Fix the div soup',
        task: 'This page is built from divs with class names that say what they are. Replace each one with the matching semantic element: `<header>`, `<nav>`, `<main>`, `<article>` and `<footer>`. Afterwards, no `div` with those classes may remain. (The CSS styles the new elements already.)',
        starter: {
          html: '<div class="header">\n  <strong>MySite</strong>\n  <div class="nav"><a href="#">Home</a> · <a href="#">About</a></div>\n</div>\n<div class="main">\n  <div class="article">\n    <h1>Welcome</h1>\n    <p>Semantic HTML helps everyone.</p>\n  </div>\n</div>\n<div class="footer">© 2026 MySite</div>',
          css: 'header, .header, footer, .footer {\n  background: #eef1fb;\n  padding: 8px;\n}\nnav, .nav {\n  display: inline-block;\n  margin-left: 12px;\n}\narticle, .article {\n  border: 1px solid #d9dde8;\n  padding: 8px;\n}'
        },
        solution: {
          html: '<header>\n  <strong>MySite</strong>\n  <nav><a href="#">Home</a> · <a href="#">About</a></nav>\n</header>\n<main>\n  <article>\n    <h1>Welcome</h1>\n    <p>Semantic HTML helps everyone.</p>\n  </article>\n</main>\n<footer>© 2026 MySite</footer>',
          css: 'header, .header, footer, .footer {\n  background: #eef1fb;\n  padding: 8px;\n}\nnav, .nav {\n  display: inline-block;\n  margin-left: 12px;\n}\narticle, .article {\n  border: 1px solid #d9dde8;\n  padding: 8px;\n}'
        },
        hints: ['Change both tags: `<div class="header">…</div>` becomes `<header>…</header>`.'],
        checks: [
          { label: 'A `<header>` containing a `<nav>`', exists: 'header nav' },
          { label: 'A `<main>` containing an `<article>`', exists: 'main article' },
          { label: 'A `<footer>`', exists: 'footer' },
          { label: 'No divs with those class names remain', count: 'div.header, div.nav, div.main, div.article, div.footer', eq: 0 }
        ]
      }
    }
  );
})(window.UILT);
