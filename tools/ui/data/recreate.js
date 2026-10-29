/*
 * "Recreate this" challenges (#/recreate). You see a finished design and write CSS until your
 * preview matches it.
 *
 * Shape: {id, title, level: 'Beginner'|'Intermediate', summary, brief (Markdown), keywords, related,
 *         height (preview px), html (given markup), css (the target's CSS = the answer),
 *         starter (the CSS you start from), alt (optional: a different correct CSS - the tests prove
 *         it matches too), hints, compare: [{sel, props}]}
 *
 * How "matches" is decided (js/views/recreate.js): both pages are measured in previews of the same
 * size. For every element matching each `sel`, its box (position and size, 2px tolerance) and each
 * listed computed property must agree. Colours may differ by a few units, a corner radius counts
 * as what you see (anything above half the height looks the same), and a property ending in "?"
 * only has to agree on whether it is there at all (a box-shadow or none).
 */
(function (U) {
  function lines() { return Array.prototype.join.call(arguments, '\n'); }

  U.data.recreate = [
    {
      id: 'pill-button', title: 'A pill button', level: 'Beginner', height: 110,
      summary: 'A solid call-to-action button with fully round ends.',
      brief: 'Look at the target: a solid colour, no border, white bold text, room around the words, and ends that are completely round.',
      keywords: ['button', 'border-radius', 'padding', 'pill', 'rounded'],
      related: ['css:border-radius', 'css:padding', 'css:background-color', 'css:font-weight'],
      html: '<button class="btn">Get started</button>',
      css: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 24px;', '}', '',
        '.btn {', '  padding: 12px 28px;', '  border: 0;', '  border-radius: 999px;', '  background: #4353c9;',
        '  color: white;', '  font-size: 16px;', '  font-weight: 600;', '}'),
      starter: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 24px;', '}', '',
        '.btn {', '  /* make the button look like the target */', '}'),
      alt: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 24px;', '}', '',
        '.btn {', '  padding: 12px 28px;', '  border: none;', '  border-radius: 30px;', '  background-color: rgb(67, 83, 201);',
        '  color: #fff;', '  font-size: 1rem;', '  font-weight: 600;', '}'),
      hints: [
        'The size comes from `padding`: more on the left and right than on the top and bottom.',
        'Buttons get a grey border from the browser: `border: 0` removes it.',
        'Fully round ends come from a `border-radius` larger than half the height. `999px` is the usual trick.'
      ],
      compare: [
        { sel: '.btn', props: ['background-color', 'color', 'border-top-left-radius', 'border-top-width', 'font-size', 'font-weight'] }
      ]
    },
    {
      id: 'center-it', title: 'Centre it', level: 'Beginner', height: 220,
      summary: 'One box in the exact middle of the page, both ways.',
      brief: 'The white box sits in the middle of the coloured area, horizontally and vertically, and is only as wide as its text.',
      keywords: ['centre', 'center', 'middle', 'place-items', 'align-items', 'justify-content'],
      related: ['css:place-items', 'css:justify-content', 'css:align-items', 'lesson:css-flex-container'],
      html: lines('<div class="stage">', '  <div class="box">Centred</div>', '</div>'),
      css: lines(
        'body {', '  margin: 0;', '  font-family: system-ui, sans-serif;', '}', '',
        '.stage {', '  display: grid;', '  place-items: center;', '  height: 100vh;', '  background: #eef1fb;', '}', '',
        '.box {', '  padding: 20px 32px;', '  border-radius: 10px;', '  background: white;', '  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);', '}'),
      starter: lines(
        'body {', '  margin: 0;', '  font-family: system-ui, sans-serif;', '}', '',
        '.stage {', '  height: 100vh;', '  background: #eef1fb;', '}', '',
        '.box {', '  padding: 20px 32px;', '  border-radius: 10px;', '  background: white;', '  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);', '}'),
      alt: lines(
        'body {', '  margin: 0;', '  font-family: system-ui, sans-serif;', '}', '',
        '.stage {', '  display: flex;', '  justify-content: center;', '  align-items: center;', '  height: 100vh;', '  background: #eef1fb;', '}', '',
        '.box {', '  padding: 20px 32px;', '  border-radius: 10px;', '  background: white;', '  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);', '}'),
      hints: [
        'Centring is done on the **parent** (`.stage`), not on the box.',
        'Two lines do it: `display: grid;` and `place-items: center;`.',
        'Flexbox works too: `display: flex; justify-content: center; align-items: center;`. Both match.'
      ],
      compare: [
        { sel: '.stage', props: ['background-color'] },
        { sel: '.box', props: ['background-color', 'box-shadow?'] }
      ]
    },
    {
      id: 'nav-bar', title: 'A navigation bar', level: 'Beginner', height: 110,
      summary: 'Logo on the left, links on the right, all on one dark bar.',
      brief: 'The logo and the links share one line: the logo at the left end, the links at the right end, everything centred vertically. The links are not underlined.',
      keywords: ['navbar', 'navigation', 'header', 'menu', 'space-between', 'flex'],
      related: ['css:display', 'css:justify-content', 'css:gap', 'css:text-decoration', 'lesson:css-flex-container'],
      html: lines(
        '<header class="nav">', '  <strong class="logo">Brand</strong>', '  <nav class="links">',
        '    <a href="#">Home</a>', '    <a href="#">Pricing</a>', '    <a href="#">About</a>', '  </nav>', '</header>'),
      css: lines(
        'body {', '  margin: 0;', '  font-family: system-ui, sans-serif;', '}', '',
        '.nav {', '  display: flex;', '  justify-content: space-between;', '  align-items: center;', '  padding: 14px 20px;', '  background: #1d2433;', '}', '',
        '.logo {', '  color: white;', '  font-size: 20px;', '}', '',
        '.links {', '  display: flex;', '  gap: 18px;', '}', '',
        '.links a {', '  color: #c9cfe0;', '  text-decoration: none;', '}'),
      starter: lines(
        'body {', '  margin: 0;', '  font-family: system-ui, sans-serif;', '}', '',
        '.nav {', '  background: #1d2433;', '}', '',
        '.logo {', '  color: white;', '  font-size: 20px;', '}'),
      alt: lines(
        'body {', '  margin: 0;', '  font-family: system-ui, sans-serif;', '}', '',
        'header {', '  display: flex;', '  align-items: center;', '  justify-content: space-between;', '  padding: 14px 20px;', '  background: #1d2433;', '}', '',
        'header strong {', '  color: white;', '  font-size: 20px;', '}', '',
        'header nav {', '  display: flex;', '  gap: 18px;', '}', '',
        'nav a {', '  color: #c9cfe0;', '  text-decoration: none;', '}'),
      hints: [
        '`display: flex` on the header puts the logo and the nav on one line; `justify-content: space-between` pushes them to the two ends.',
        'The bar has room around its content: `padding` on the header, more at the sides.',
        'The links are a second flex container with a `gap`. `text-decoration: none` removes the underline.'
      ],
      compare: [
        { sel: '.nav', props: ['background-color'] },
        { sel: '.logo', props: ['color', 'font-size'] },
        { sel: '.links a', props: ['color', 'text-decoration-line'] }
      ]
    },
    {
      id: 'media-object', title: 'Avatar next to text', level: 'Beginner', height: 200,
      summary: 'A comment: a round picture on the left, the name and text beside it.',
      brief: 'The round picture stays on the left at its own size; the name and the text fill the rest of the row. The whole comment sits on a rounded grey card.',
      keywords: ['media object', 'avatar', 'comment', 'side by side', 'flex', 'image and text'],
      related: ['css:display', 'css:gap', 'css:border-radius', 'css:align-items', 'lesson:css-flex-items'],
      html: lines(
        '<article class="comment">', '  <img class="avatar" src="avatar.svg" alt="">', '  <div class="body">', '    <b>Meera Iyer</b>',
        '    <p>Flexbox puts the picture and the text side by side, and the text takes the space that is left.</p>', '  </div>', '</article>'),
      css: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 20px;', '}', '',
        '.comment {', '  display: flex;', '  gap: 14px;', '  align-items: flex-start;', '  max-width: 420px;', '  padding: 14px;',
        '  border-radius: 12px;', '  background: #f0f2f8;', '}', '',
        '.avatar {', '  width: 56px;', '  height: 56px;', '  border-radius: 50%;', '}', '',
        '.body p {', '  margin: 4px 0 0;', '  color: #4d5568;', '}'),
      starter: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 20px;', '}', '',
        '.comment {', '  max-width: 420px;', '  padding: 14px;', '  border-radius: 12px;', '  background: #f0f2f8;', '}', '',
        '.avatar {', '  width: 56px;', '  height: 56px;', '}'),
      alt: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 20px;', '}', '',
        '.comment {', '  display: grid;', '  grid-template-columns: 56px 1fr;', '  gap: 14px;', '  align-items: start;', '  max-width: 420px;',
        '  padding: 14px;', '  border-radius: 12px;', '  background: #f0f2f8;', '}', '',
        '.avatar {', '  width: 56px;', '  height: 56px;', '  border-radius: 50%;', '}', '',
        '.body p {', '  margin: 4px 0 0;', '  color: #4d5568;', '}'),
      hints: [
        '`display: flex` on `.comment` puts the picture and the text block side by side.',
        'The space between them is a `gap`; the picture becomes a circle with `border-radius: 50%`.',
        'The paragraph sits close under the name (`margin: 4px 0 0`) in a grey colour.'
      ],
      compare: [
        { sel: '.comment', props: ['background-color'] },
        { sel: '.avatar', props: ['border-top-left-radius'] },
        { sel: '.body', props: [] },
        { sel: '.body p', props: ['color'] }
      ]
    },
    {
      id: 'feature-grid', title: 'Cards in a grid', level: 'Beginner', height: 220,
      summary: 'Six cards in three equal columns with even gaps.',
      brief: 'Three equal columns, two rows, the same gap between every card, and each word centred in its card.',
      keywords: ['grid', 'columns', 'cards', 'gallery', 'repeat', 'fr'],
      related: ['css:grid-template-columns', 'css:gap', 'css:text-align', 'lesson:css-grid'],
      html: lines(
        '<section class="features">', '  <div class="feature">Fast</div>', '  <div class="feature">Safe</div>', '  <div class="feature">Simple</div>',
        '  <div class="feature">Offline</div>', '  <div class="feature">Free</div>', '  <div class="feature">Open</div>', '</section>'),
      css: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 20px;', '}', '',
        '.features {', '  display: grid;', '  grid-template-columns: repeat(3, 1fr);', '  gap: 12px;', '}', '',
        '.feature {', '  padding: 24px 12px;', '  border-radius: 10px;', '  background: #e7e9ff;', '  font-weight: 600;', '  text-align: center;', '}'),
      starter: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 20px;', '}', '',
        '.feature {', '  padding: 24px 12px;', '  border-radius: 10px;', '  background: #e7e9ff;', '  font-weight: 600;', '}'),
      alt: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 20px;', '}', '',
        '.features {', '  display: grid;', '  grid-template-columns: 1fr 1fr 1fr;', '  column-gap: 12px;', '  row-gap: 12px;', '}', '',
        '.feature {', '  padding: 24px 12px;', '  border-radius: 10px;', '  background: #e7e9ff;', '  font-weight: 600;', '  text-align: center;', '}'),
      hints: [
        '`display: grid` on `.features`, then `grid-template-columns: repeat(3, 1fr)` makes three equal columns.',
        'One `gap` sets the space between rows and between columns.',
        'The words are centred inside their cards with `text-align`.'
      ],
      compare: [
        { sel: '.features', props: [] },
        { sel: '.feature', props: ['background-color', 'text-align'] }
      ]
    },
    {
      id: 'badge-corner', title: 'A badge on the corner', level: 'Intermediate', height: 170,
      summary: 'A red "New" badge that hangs over the top-right corner of a card.',
      brief: 'The card looks as it does without the badge: the badge takes no room inside it. It hangs half outside the top-right corner.',
      keywords: ['badge', 'corner', 'absolute', 'relative', 'position', 'ribbon'],
      related: ['css:position', 'css:top', 'css:right', 'lesson:css-position'],
      html: lines(
        '<div class="card">', '  <span class="badge">New</span>', '  <h3>Wireless headphones</h3>', '  <p>40 hours of battery.</p>', '</div>'),
      css: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 30px;', '}', '',
        '.card {', '  position: relative;', '  width: 240px;', '  padding: 16px;', '  border: 1px solid #d9dde8;', '  border-radius: 12px;', '}', '',
        '.card h3 {', '  margin: 0 0 6px;', '}', '',
        '.card p {', '  margin: 0;', '  color: #4d5568;', '}', '',
        '.badge {', '  position: absolute;', '  top: -10px;', '  right: -10px;', '  padding: 4px 10px;', '  border-radius: 999px;',
        '  background: #e03131;', '  color: white;', '  font-size: 12px;', '  font-weight: 700;', '}'),
      starter: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 30px;', '}', '',
        '.card {', '  width: 240px;', '  padding: 16px;', '  border: 1px solid #d9dde8;', '  border-radius: 12px;', '}', '',
        '.card h3 {', '  margin: 0 0 6px;', '}', '',
        '.card p {', '  margin: 0;', '  color: #4d5568;', '}', '',
        '.badge {', '  /* put me on the corner */', '}'),
      alt: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 30px;', '}', '',
        '.card {', '  position: relative;', '  width: 240px;', '  padding: 16px;', '  border: 1px solid #d9dde8;', '  border-radius: 12px;', '}', '',
        '.card h3 {', '  margin: 0 0 6px;', '}', '',
        '.card p {', '  margin: 0;', '  color: #4d5568;', '}', '',
        '.badge {', '  position: absolute;', '  inset: -10px -10px auto auto;', '  padding: 4px 10px;', '  border-radius: 999px;',
        '  background: #e03131;', '  color: white;', '  font-size: 12px;', '  font-weight: 700;', '}'),
      hints: [
        '`position: absolute` takes the badge out of the flow, so it no longer pushes the heading down.',
        'An absolute element is placed against its nearest **positioned** ancestor: give the card `position: relative`.',
        'Negative `top` and `right` pull the badge past the corner. It is a small pill: red, white bold 12px text, `border-radius: 999px`.'
      ],
      compare: [
        { sel: '.card', props: [] },
        { sel: '.card h3', props: [] },
        { sel: '.badge', props: ['background-color', 'color', 'font-size', 'font-weight', 'border-top-left-radius'] }
      ]
    },
    {
      id: 'tag-list', title: 'Tags that wrap', level: 'Intermediate', height: 170,
      summary: 'A list of pill-shaped tags that wrap onto new rows.',
      brief: 'The tags flow in rows and wrap when a row is full, with the same small gap everywhere. No bullets, no indentation, and the list is never wider than 300px.',
      keywords: ['tags', 'chips', 'pills', 'wrap', 'flex-wrap', 'list'],
      related: ['css:flex-wrap', 'css:gap', 'css:list-style-type', 'css:max-width'],
      html: lines(
        '<ul class="tags">', '  <li>html</li>', '  <li>css</li>', '  <li>javascript</li>', '  <li>flexbox</li>', '  <li>grid</li>',
        '  <li>accessibility</li>', '  <li>responsive</li>', '</ul>'),
      css: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 20px;', '}', '',
        '.tags {', '  display: flex;', '  flex-wrap: wrap;', '  gap: 8px;', '  max-width: 300px;', '  margin: 0;', '  padding: 0;', '  list-style: none;', '}', '',
        '.tags li {', '  padding: 4px 12px;', '  border: 1px solid #b9bfd0;', '  border-radius: 999px;', '  font-size: 14px;', '}'),
      starter: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 20px;', '}', '',
        '.tags li {', '  font-size: 14px;', '}'),
      alt: lines(
        'body {', '  font-family: system-ui, sans-serif;', '  margin: 20px;', '}', '',
        '.tags {', '  display: flex;', '  flex-flow: row wrap;', '  gap: 8px;', '  max-width: 300px;', '  margin: 0;', '  padding-left: 0;', '}', '',
        '.tags li {', '  list-style: none;', '  padding: 4px 12px;', '  border: 1px solid #b9bfd0;', '  border-radius: 999px;', '  font-size: 14px;', '}'),
      hints: [
        '`display: flex` with `flex-wrap: wrap` lays the tags in rows that wrap when they run out of room; `gap` spaces them.',
        'A list comes with a top and bottom margin, a left padding and bullets: `margin: 0; padding: 0; list-style: none;` removes them.',
        'Each tag is a pill: a thin grey border and `border-radius: 999px`. The list is at most `300px` wide.'
      ],
      compare: [
        { sel: '.tags', props: [] },
        { sel: '.tags li', props: ['list-style-type', 'border-top-width', 'border-top-left-radius'] }
      ]
    },
    {
      id: 'page-layout', title: 'A page layout', level: 'Intermediate', height: 280,
      summary: 'Header, sidebar, main area and footer on a grid that fills the page.',
      brief: 'The header and footer run the full width; the sidebar has a fixed width and the main area takes the rest. Together they fill the whole height, with even gaps.',
      keywords: ['layout', 'holy grail', 'sidebar', 'header', 'footer', 'grid areas'],
      related: ['css:grid-template-columns', 'css:grid-template-rows', 'css:grid-column', 'css:grid-template-areas', 'lesson:css-grid'],
      html: lines(
        '<div class="page">', '  <header>Header</header>', '  <aside>Sidebar</aside>', '  <main>Main content</main>', '  <footer>Footer</footer>', '</div>'),
      css: lines(
        'body {', '  margin: 0;', '  font-family: system-ui, sans-serif;', '}', '',
        '.page {', '  display: grid;', '  grid-template-columns: 160px 1fr;', '  grid-template-rows: 56px 1fr 44px;', '  gap: 8px;',
        '  height: 100vh;', '  padding: 8px;', '  box-sizing: border-box;', '}', '',
        'header,', 'footer {', '  grid-column: 1 / -1;', '}', '',
        'header, aside, main, footer {', '  padding: 12px;', '  border-radius: 8px;', '}', '',
        'header {', '  background: #4353c9;', '  color: white;', '}', '',
        'aside {', '  background: #ffe7c2;', '}', '',
        'main {', '  background: #e3f5ea;', '}', '',
        'footer {', '  background: #d9dde8;', '}'),
      starter: lines(
        'body {', '  margin: 0;', '  font-family: system-ui, sans-serif;', '}', '',
        '.page {', '  height: 100vh;', '  padding: 8px;', '  box-sizing: border-box;', '}', '',
        'header, aside, main, footer {', '  padding: 12px;', '  border-radius: 8px;', '}', '',
        'header {', '  background: #4353c9;', '  color: white;', '}', '',
        'aside {', '  background: #ffe7c2;', '}', '',
        'main {', '  background: #e3f5ea;', '}', '',
        'footer {', '  background: #d9dde8;', '}'),
      alt: lines(
        'body {', '  margin: 0;', '  font-family: system-ui, sans-serif;', '}', '',
        '.page {', '  display: grid;', '  grid-template-areas:', '    "head head"', '    "side main"', '    "foot foot";',
        '  grid-template-columns: 160px 1fr;', '  grid-template-rows: 56px 1fr 44px;', '  gap: 8px;',
        '  height: 100vh;', '  padding: 8px;', '  box-sizing: border-box;', '}', '',
        'header { grid-area: head; }', 'aside { grid-area: side; }', 'main { grid-area: main; }', 'footer { grid-area: foot; }', '',
        'header, aside, main, footer {', '  padding: 12px;', '  border-radius: 8px;', '}', '',
        'header {', '  background: #4353c9;', '  color: white;', '}', '',
        'aside {', '  background: #ffe7c2;', '}', '',
        'main {', '  background: #e3f5ea;', '}', '',
        'footer {', '  background: #d9dde8;', '}'),
      hints: [
        'It is a grid of two columns - a `160px` sidebar and the rest (`1fr`) - and three rows: `56px`, the rest, `44px`.',
        'The header and footer span both columns: `grid-column: 1 / -1`. Or name the areas with `grid-template-areas`.',
        'The spaces between the areas are one `gap: 8px`.'
      ],
      compare: [
        { sel: 'header', props: ['background-color'] },
        { sel: 'aside', props: ['background-color'] },
        { sel: 'main', props: ['background-color'] },
        { sel: 'footer', props: ['background-color'] }
      ]
    }
  ];
})(window.UILT);
