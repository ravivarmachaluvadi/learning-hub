/*
 * Lessons, track 2: CSS. Lesson shape: see lessons-html.js.
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];
  var M = ['html', 'css'];
  var TRANSPARENT = ['rgba(0, 0, 0, 0)', 'transparent'];

  L.push(
    {
      id: 'css-attach', track: 'CSS', modes: M,
      title: 'How CSS attaches to HTML',
      summary: 'Rules, selectors and declarations - and the three places CSS can live.',
      keywords: ['css basics', 'rule', 'selector', 'declaration', 'class', 'id', 'stylesheet'],
      body: [
        'CSS is a list of **rules**. Each rule has a **selector** (which elements) and a block of **declarations** (property: value):',
        '```css\n/* every h1 */\nh1 {\n  color: navy;\n  font-size: 2rem;\n}\n\n/* every element with class="note" */\n.note {\n  background: lightyellow;\n}\n\n/* the one element with id="cta" */\n#cta {\n  font-weight: bold;\n}\n```',
        '## The three basic selectors',
        '- **Type**: `h1`, `p`, `a` - every element of that tag.\n- **Class**: `.note` - every element with `class="note"`. Classes are reusable and are your main tool.\n- **Id**: `#cta` - the single element with `id="cta"`. Ids must be unique; use them sparingly in CSS.',
        '## Where CSS lives',
        '- A separate file, linked in `<head>`: `<link rel="stylesheet" href="styles.css">` - best for real sites.\n- A `<style>` element in the page - what this tool\'s CSS tab does for you.\n- A `style="…"` attribute on one element - fine for a quick test, hard to maintain.',
        'A missing semicolon or brace makes the browser skip that declaration silently - there are no error messages in CSS. If a style "does nothing", check the spelling first.'
      ].join('\n\n'),
      java: 'A rule is declarative, like an annotation-driven aspect: "for every element matching this pointcut (selector), apply these properties". You never call it; the browser applies it.',
      example: {
        html: '<h1>Hello CSS</h1>\n<p class="note">I have class="note".</p>\n<p>I am a plain paragraph.</p>\n<p class="note">Me too - classes are reusable.</p>',
        css: 'h1 {\n  color: navy;\n}\n\n.note {\n  background: lightyellow;\n  padding: 6px;\n}'
      },
      related: ['css:color', 'css:background-color', 'html:style', 'html:link', 'explain:specificity'],
      challenge: {
        title: 'Style from the CSS tab',
        task: 'Without touching the HTML, write CSS that:\n\n1. Makes every `<h1>` **navy**.\n2. Gives elements with class `note` a background colour.\n3. Makes the element with id `cta` **bold**.',
        starter: { html: '<h1>Welcome</h1>\n<p class="note">This is a note.</p>\n<p>A normal paragraph.</p>\n<a id="cta" href="#">Sign up now</a>', css: '/* write your rules here */\n' },
        solution: { html: '<h1>Welcome</h1>\n<p class="note">This is a note.</p>\n<p>A normal paragraph.</p>\n<a id="cta" href="#">Sign up now</a>', css: 'h1 {\n  color: navy;\n}\n\n.note {\n  background: lightyellow;\n}\n\n#cta {\n  font-weight: bold;\n}' },
        hints: ['A class selector starts with a dot: `.note { … }`. An id selector starts with `#`.', '`color: navy;` - the colour name is exactly "navy".'],
        checks: [
          { label: '`h1` is navy', computed: 'h1', prop: 'color', equals: 'rgb(0, 0, 128)' },
          { label: '`.note` has a background colour', computed: '.note', prop: 'background-color', notIn: TRANSPARENT },
          { label: '`#cta` is bold', computed: '#cta', prop: 'font-weight', min: 600 },
          { label: 'No `style=""` attributes - all styling is in the CSS tab', source: 'html', match: 'style\\s*=', negate: true }
        ]
      }
    },
    {
      id: 'css-selectors', track: 'CSS', modes: M,
      title: 'Selectors and specificity',
      summary: 'Target exactly the elements you mean, and understand which rule wins when rules disagree.',
      keywords: ['selector', 'descendant', 'child', 'pseudo-class', 'nth-child', 'specificity', 'cascade'],
      body: [
        '## Combining selectors',
        '- `nav a` - every `a` **inside** a `nav`, at any depth (descendant).\n- `ul > li` - `li` elements that are **direct children** of a `ul`.\n- `li.active` - an `li` that **also** has class `active` (no space!).\n- `h1, h2` - a list: both h1 and h2.\n- `a[href^="https"]` - an attribute condition.',
        '## Pseudo-classes: elements in a state or position',
        '- `a:hover` - while the mouse is over it; `:focus` - while it has keyboard focus.\n- `li:first-child`, `li:last-child`, `tr:nth-child(even)`, `li:nth-child(3)`.\n- `input:invalid`, `:checked`, `:disabled`.\n- `li:not(.active)` - every li without the class.',
        '## When rules disagree: the cascade',
        'If two rules set the same property on the same element, the browser picks the winner by:',
        '1. **Specificity** - a score (ids, classes, types). `#menu a` (1,0,1) beats `nav a` (0,0,2), which beats `a` (0,0,1).\n2. **Order** - with equal scores, the rule written later wins.',
        'The [[explain:specificity]] explainer lets you type selectors and watch the score.'
      ].join('\n\n'),
      java: 'Specificity resolution is like Java choosing the most specific overload. The difference: a tie is not an error - the later rule wins.',
      example: {
        html: '<ul class="menu">\n  <li>Home</li>\n  <li class="active">Blog</li>\n  <li>About</li>\n</ul>\n<p>Hover the menu items.</p>',
        css: '.menu li {\n  padding: 4px;\n}\n.menu li:hover {\n  background: #eef1fb;\n}\n.menu li.active {\n  font-weight: bold;\n}\nli:nth-child(odd) {\n  color: #4353c9;\n}'
      },
      related: ['explain:specificity', 'css:color', 'html:li', 'html:tr'],
      challenge: {
        title: 'Selectors only',
        task: 'Do not change the HTML (no new classes). Using selectors only:\n\n1. Make every link **inside the nav** green - the link in the paragraph must stay as it is.\n2. Make the **first** menu item bold.\n3. Give the item with class `active` a background colour.\n4. Give every **even** row of the table a background colour (odd rows stay transparent).',
        starter: {
          html: '<nav>\n  <ul>\n    <li><a href="#">Home</a></li>\n    <li class="active"><a href="#">Blog</a></li>\n    <li><a href="#">About</a></li>\n  </ul>\n</nav>\n<table>\n  <tbody>\n    <tr><td>Row 1</td></tr>\n    <tr><td>Row 2</td></tr>\n    <tr><td>Row 3</td></tr>\n    <tr><td>Row 4</td></tr>\n  </tbody>\n</table>\n<p>A <a href="#">link outside the nav</a> keeps its colour.</p>',
          css: '/* selectors only - no changes to the HTML */\n'
        },
        solution: {
          html: '<nav>\n  <ul>\n    <li><a href="#">Home</a></li>\n    <li class="active"><a href="#">Blog</a></li>\n    <li><a href="#">About</a></li>\n  </ul>\n</nav>\n<table>\n  <tbody>\n    <tr><td>Row 1</td></tr>\n    <tr><td>Row 2</td></tr>\n    <tr><td>Row 3</td></tr>\n    <tr><td>Row 4</td></tr>\n  </tbody>\n</table>\n<p>A <a href="#">link outside the nav</a> keeps its colour.</p>',
          css: 'nav a {\n  color: green;\n}\n\nnav li:first-child {\n  font-weight: bold;\n}\n\nli.active {\n  background: orange;\n}\n\ntbody tr:nth-child(even) {\n  background: #eeeeee;\n}'
        },
        hints: ['"Inside the nav" is a descendant selector: `nav a { … }`.', 'Position-based selectors: `li:first-child`, `tr:nth-child(even)`.'],
        checks: [
          { label: 'Every link inside the nav is green', computed: 'nav a', every: true, prop: 'color', equals: 'rgb(0, 128, 0)' },
          { label: 'The link outside the nav is not green', computed: 'p a', prop: 'color', not: 'rgb(0, 128, 0)' },
          { label: 'The first menu item is bold', computed: 'nav li:first-child', prop: 'font-weight', min: 700 },
          { label: '`li.active` has a background colour', computed: 'nav li.active', prop: 'background-color', notIn: TRANSPARENT },
          { label: 'Rows 2 and 4 have a background', computed: 'tbody tr:nth-child(even)', every: true, prop: 'background-color', notIn: TRANSPARENT },
          { label: 'Rows 1 and 3 stay transparent', computed: 'tbody tr:nth-child(odd)', every: true, prop: 'background-color', oneOf: TRANSPARENT },
          { label: 'No new classes in the HTML', source: 'html', match: 'class="(?!active")', negate: true }
        ]
      }
    },
    {
      id: 'css-typography', track: 'CSS', modes: M,
      title: 'Colours, units and typography',
      summary: 'Colour formats, px vs em vs rem, and the handful of font properties that make text readable.',
      keywords: ['colour', 'color', 'units', 'rem', 'em', 'font', 'line-height', 'typography'],
      body: [
        '## Colours',
        '`navy` (a name), `#4353c9` (hex: red, green, blue), `rgb(67 83 201)`, `hsl(233 56% 53%)` (hue, saturation, lightness). Add transparency with a fourth value: `rgb(0 0 0 / 50%)` or `#00000080`.',
        '## Units',
        '- `px` - fixed CSS pixels. Good for borders.\n- `rem` - multiples of the root font size (16px by default). Good for font sizes and spacing: it follows the user\'s font preference.\n- `em` - multiples of the *current* font size.\n- `%` - a share of the parent.\n- `vw` / `vh` - 1% of the viewport width / height.\n- `ch` - the width of a "0": great for line length.',
        'See them side by side in the [[explain:units]] explainer.',
        '## Readable text in five properties',
        '```css\nbody {\n  font-family: system-ui, Arial, sans-serif;\n}\np {\n  font-size: 1.125rem;   /* 18px */\n  line-height: 1.6;      /* unitless: 1.6 x the font size */\n}\narticle {\n  max-width: 60ch;       /* about 60 characters per line */\n}\n```',
        'Font properties are **inherited**: set the family once on `body` and every element inside uses it.'
      ].join('\n\n'),
      java: 'Inheritance of `font-family` and `color` works like fields inherited from a superclass: children get the parent\'s value unless they override it.',
      example: {
        html: '<h1>Typography</h1>\n<p>Text in <span class="hl">rem units</span> follows the user\'s font setting.</p>',
        css: 'body {\n  font-family: Georgia, serif;\n  color: #333;\n}\nh1 {\n  color: hsl(233 56% 53%);\n}\np {\n  font-size: 1.25rem;\n  line-height: 1.6;\n}\n.hl {\n  background: rgb(255 200 0 / 40%);\n}'
      },
      related: ['css:color', 'css:font-family', 'css:font-size', 'css:line-height', 'css:text-align', 'css:max-width', 'explain:units'],
      challenge: {
        title: 'Make the article readable',
        task: '1. Give `body` a sans-serif font family.\n2. Paragraphs: font size `1.125rem` and a unitless `line-height` of `1.6`.\n3. The heading: centred, in a **hex** colour of your choice.\n4. Limit the article to `max-width: 60ch`.',
        starter: {
          html: '<article>\n  <h1>Reading on the web</h1>\n  <p>Good typography is mostly invisible: comfortable size, generous line spacing and lines that are not too long. Your eyes should glide along the text without effort.</p>\n  <p>About 60 to 75 characters per line is easiest to read. Longer lines make it hard to find the start of the next line.</p>\n</article>',
          css: '/* make it readable */\n'
        },
        solution: {
          html: '<article>\n  <h1>Reading on the web</h1>\n  <p>Good typography is mostly invisible: comfortable size, generous line spacing and lines that are not too long. Your eyes should glide along the text without effort.</p>\n  <p>About 60 to 75 characters per line is easiest to read. Longer lines make it hard to find the start of the next line.</p>\n</article>',
          css: 'body {\n  font-family: system-ui, Arial, sans-serif;\n}\n\narticle {\n  max-width: 60ch;\n}\n\np {\n  font-size: 1.125rem;\n  line-height: 1.6;\n}\n\nh1 {\n  color: #4353c9;\n  text-align: center;\n}'
        },
        hints: ['A font stack ends with a generic family: `font-family: system-ui, Arial, sans-serif;`.', '1.125rem is 18px when the root size is 16px; unitless line-height `1.6` then gives 28.8px lines.'],
        checks: [
          { label: 'The body uses a sans-serif font', computed: 'body', prop: 'font-family', match: 'sans-serif|system-ui|arial|helvetica|segoe|roboto|verdana' },
          { label: 'Paragraphs are 18px (1.125rem)', computed: 'p', prop: 'font-size', equals: '18px' },
          { label: 'Paragraph line height is 1.6', computed: 'p', prop: 'line-height', min: 28.5, max: 29.1 },
          { label: 'The heading is centred', computed: 'h1', prop: 'text-align', equals: 'center' },
          { label: 'The heading colour is written in hex', source: 'css', match: 'h1[^{]*\\{[^}]*color\\s*:\\s*#[0-9a-f]{3,8}' },
          { label: 'The article has `max-width: 60ch`', source: 'css', match: 'max-width\\s*:\\s*60ch' }
        ]
      }
    },
    {
      id: 'css-box-model', track: 'CSS', modes: M,
      title: 'The box model',
      summary: 'Content, padding, border, margin - and why width does not mean what you think until box-sizing.',
      keywords: ['box model', 'margin', 'padding', 'border', 'box-sizing', 'width', 'centre'],
      body: [
        'Every element is a rectangle with four layers, from the inside out:',
        '1. **Content** - the text or image.\n2. **Padding** - space inside, between content and border. Shows the background.\n3. **Border** - the line around it.\n4. **Margin** - space outside, pushing neighbours away. Always transparent.',
        '```css\n.card {\n  width: 300px;\n  padding: 20px;          /* all four sides */\n  border: 2px solid navy; /* width style colour */\n  margin: 16px auto;      /* 16px top/bottom, auto left/right = centred */\n}\n```',
        '## The width surprise',
        'By default (`box-sizing: content-box`) `width` is the *content* only, so the card above is actually 300 + 2×20 + 2×2 = **344px** wide. Set `box-sizing: border-box` and `width` includes padding and border: exactly 300px. Most sites set it on every element.',
        '## Centring a box',
        '`margin: 0 auto` centres a block that has a width: the left and right margins share the free space equally.',
        'Play with all of this in the [[explain:box-model]] explainer - it shows the sum as you drag.'
      ].join('\n\n'),
      java: 'Swing has the same idea: an `EmptyBorder`/`Insets` for padding, a `LineBorder` for the border, and the layout manager\'s gaps for margin.',
      example: {
        html: '<div class="a">content-box: 200px + padding + border</div>\n<div class="b">border-box: exactly 200px</div>',
        css: '.a, .b {\n  width: 200px;\n  padding: 20px;\n  border: 5px solid #4353c9;\n  margin: 10px 0;\n}\n.b {\n  box-sizing: border-box;\n}'
      },
      related: ['explain:box-model', 'css:margin', 'css:padding', 'css:border', 'css:box-sizing', 'css:border-radius'],
      challenge: {
        title: 'A centred card',
        task: 'Style `.card` so that it is:\n\n1. **300px wide in total**, padding and border included (use `box-sizing`).\n2. 20px of padding.\n3. A 2px **solid** border.\n4. Rounded corners of 8px.\n5. Centred horizontally on the page.',
        starter: { html: '<div class="card">\n  <h2>Box model</h2>\n  <p>Content, padding, border, margin.</p>\n</div>', css: '.card {\n  background: #eef1fb;\n}' },
        solution: { html: '<div class="card">\n  <h2>Box model</h2>\n  <p>Content, padding, border, margin.</p>\n</div>', css: '.card {\n  box-sizing: border-box;\n  width: 300px;\n  padding: 20px;\n  border: 2px solid #4353c9;\n  border-radius: 8px;\n  margin: 0 auto;\n  background: #eef1fb;\n}' },
        hints: ['`box-sizing: border-box; width: 300px;` makes the whole box 300px.', 'Centre with `margin: 0 auto;` (it needs the width).'],
        checks: [
          { label: 'The card is 300px wide in total', rect: '.card', side: 'width', min: 299, max: 301 },
          { label: 'It uses `box-sizing: border-box`', computed: '.card', prop: 'box-sizing', equals: 'border-box' },
          { label: '20px padding', computed: '.card', prop: 'padding-left', equals: '20px' },
          { label: 'A 2px border', computed: '.card', prop: 'border-top-width', equals: '2px' },
          { label: 'The border is solid', computed: '.card', prop: 'border-top-style', equals: 'solid' },
          { label: '8px rounded corners', computed: '.card', prop: 'border-top-left-radius', equals: '8px' },
          { label: 'Centred horizontally', centered: '.card', within: 'body', axis: 'x', tolerance: 3 }
        ]
      }
    },
    {
      id: 'css-display', track: 'CSS', modes: M,
      title: 'Display: block, inline, inline-block, none',
      summary: 'The one property that decides how a box sits among its neighbours.',
      keywords: ['display', 'block', 'inline', 'inline-block', 'none', 'hide', 'visibility'],
      body: [
        'Every element has a default `display`, and changing it changes how the box behaves:',
        '- `block` - new line, full width; `width`, `height` and all margins work. (div, p, h1)\n- `inline` - flows in a line of text; **ignores width, height and vertical margins**. (span, a, strong)\n- `inline-block` - sits in the line, but is a proper box: width, height, padding and margins all work. Ideal for buttons and badges.\n- `none` - gone: not drawn, takes no space.\n- `flex` and `grid` - the layout modes of the next lessons.',
        'Try them all on one element in the [[css:display]] reference page.',
        '## Hiding things',
        '`display: none` removes the box and its space. `visibility: hidden` hides it but keeps an empty gap. `opacity: 0` makes it invisible but still clickable.',
        '```css\n.menu a {\n  display: inline-block;  /* so padding pushes neighbours */\n  padding: 8px 16px;\n  text-decoration: none;  /* remove the link underline */\n}\n```'
      ].join('\n\n'),
      java: 'Like choosing how a component participates in its parent\'s layout; `display: none` is `setVisible(false)` - the layout reflows as if it was removed.',
      example: {
        html: '<p>Inline: <span class="i">span</span> <span class="i">span</span></p>\n<p>Inline-block: <span class="ib">span</span> <span class="ib">span</span></p>\n<span class="b">block span</span>',
        css: 'span {\n  background: #ffe7c2;\n  width: 120px;\n  padding: 6px;\n}\n.ib {\n  display: inline-block;\n}\n.b {\n  display: block;\n}'
      },
      related: ['css:display', 'css:visibility', 'css:opacity', 'html:span', 'html:div'],
      challenge: {
        title: 'Button-like links and a hidden ad',
        task: '1. Make the three links in the `nav` look like buttons: `display: inline-block`, padding `8px 16px`, a background colour and **no underline**.\n2. Hide the `.ad` banner completely - it must not take any space.',
        starter: {
          html: '<nav>\n  <a href="#">Home</a>\n  <a href="#">Blog</a>\n  <a href="#">About</a>\n</nav>\n<div class="ad">BUY NOW! Limited offer!</div>\n<p>Content after the ad.</p>',
          css: 'nav a {\n  \n}\n\n.ad {\n  background: gold;\n  padding: 20px;\n}'
        },
        solution: {
          html: '<nav>\n  <a href="#">Home</a>\n  <a href="#">Blog</a>\n  <a href="#">About</a>\n</nav>\n<div class="ad">BUY NOW! Limited offer!</div>\n<p>Content after the ad.</p>',
          css: 'nav a {\n  display: inline-block;\n  padding: 8px 16px;\n  background: #4353c9;\n  color: white;\n  text-decoration: none;\n  border-radius: 6px;\n}\n\n.ad {\n  display: none;\n  background: gold;\n  padding: 20px;\n}'
        },
        hints: ['`text-decoration: none;` removes the underline.', 'Only `display: none` removes the space; `visibility: hidden` leaves a gap.'],
        checks: [
          { label: 'Nav links are `inline-block`', computed: 'nav a', every: true, prop: 'display', equals: 'inline-block' },
          { label: 'Padding 8px 16px', computed: 'nav a', every: true, prop: 'padding', equals: '8px 16px' },
          { label: 'A background colour', computed: 'nav a', prop: 'background-color', notIn: TRANSPARENT },
          { label: 'No underline', computed: 'nav a', every: true, prop: 'text-decoration-line', equals: 'none' },
          { label: 'The ad takes no space (`display: none`)', computed: '.ad', prop: 'display', equals: 'none' }
        ]
      }
    },
    {
      id: 'css-flex-container', track: 'CSS', modes: M,
      title: 'Flexbox, part 1: the container',
      summary: 'Lay children out in a row or column, spread them out and centre them - with three properties.',
      keywords: ['flexbox', 'flex', 'justify-content', 'align-items', 'centre', 'center', 'row', 'column'],
      body: [
        '`display: flex` on a container turns its direct children into **flex items** laid out along one line:',
        '```css\n.toolbar {\n  display: flex;\n  flex-direction: row;            /* or column */\n  justify-content: space-between; /* along the main axis */\n  align-items: center;            /* across it */\n  gap: 12px;                      /* space between items */\n}\n```',
        '## Two axes',
        '- The **main axis** follows `flex-direction`: left-to-right for `row`, top-to-bottom for `column`. `justify-content` places items along it: `flex-start`, `center`, `flex-end`, `space-between`, `space-around`, `space-evenly`.\n- The **cross axis** runs across it. `align-items` places items along it: `stretch` (default), `flex-start`, `center`, `flex-end`, `baseline`.',
        '## Centre anything',
        'The most-searched CSS question has a three-line answer:',
        '```css\n.box {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n```',
        'Use the [[explain:flexbox]] lab to try every combination.'
      ].join('\n\n'),
      java: 'Flexbox is a layout manager, like `BoxLayout` (or JavaFX `HBox`/`VBox`): the container arranges its children along one axis, with alignment and gaps.',
      example: {
        html: '<div class="row">\n  <div>One</div>\n  <div>Two</div>\n  <div>Three</div>\n</div>',
        css: '.row {\n  display: flex;\n  justify-content: space-evenly;\n  align-items: center;\n  height: 120px;\n  background: #eef1fb;\n}\n.row div {\n  padding: 10px;\n  background: #4353c9;\n  color: white;\n}'
      },
      related: ['explain:flexbox', 'css:display', 'css:flex-direction', 'css:justify-content', 'css:align-items', 'css:gap'],
      challenge: {
        title: 'Header and hero',
        task: '1. Make `.top` a flex row with the logo on the left and the nav on the right (`space-between`), vertically centred.\n2. Centre the `<h2>` inside `.hero` both horizontally and vertically.',
        starter: {
          html: '<header class="top">\n  <strong class="logo">MySite</strong>\n  <nav><a href="#">Home</a> <a href="#">Blog</a> <a href="#">About</a></nav>\n</header>\n<section class="hero">\n  <h2>Centred!</h2>\n</section>',
          css: '.top {\n  padding: 10px;\n  background: #eef1fb;\n}\n\n.logo {\n  font-size: 24px;\n}\n\n.hero {\n  height: 200px;\n  margin-top: 10px;\n  background: #4353c9;\n  color: white;\n}\n\n.hero h2 {\n  margin: 0;\n}'
        },
        solution: {
          html: '<header class="top">\n  <strong class="logo">MySite</strong>\n  <nav><a href="#">Home</a> <a href="#">Blog</a> <a href="#">About</a></nav>\n</header>\n<section class="hero">\n  <h2>Centred!</h2>\n</section>',
          css: '.top {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 10px;\n  background: #eef1fb;\n}\n\n.logo {\n  font-size: 24px;\n}\n\n.hero {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 200px;\n  margin-top: 10px;\n  background: #4353c9;\n  color: white;\n}\n\n.hero h2 {\n  margin: 0;\n}'
        },
        hints: ['Flex properties go on the **container** (`.top`, `.hero`), not on the children.', 'Centring = `display: flex; justify-content: center; align-items: center;`.'],
        checks: [
          { label: '`.top` is a flex container', computed: '.top', prop: 'display', equals: 'flex' },
          { label: 'Logo and nav pushed apart (`space-between`)', computed: '.top', prop: 'justify-content', equals: 'space-between' },
          { label: 'Vertically centred (`align-items: center`)', computed: '.top', prop: 'align-items', equals: 'center' },
          { label: 'The hero heading is centred both ways', centered: '.hero h2', within: '.hero', tolerance: 3 }
        ]
      }
    },
    {
      id: 'css-flex-items', track: 'CSS', modes: M,
      title: 'Flexbox, part 2: the items',
      summary: 'Let items grow, shrink or stay fixed with flex-grow, flex-shrink, flex-basis and the flex shorthand.',
      keywords: ['flex-grow', 'flex-shrink', 'flex-basis', 'flex: 1', 'order', 'align-self', 'columns'],
      body: [
        'Items have their own properties, deciding how they share the container\'s space:',
        '- `flex-basis` - the starting size (like width, for a row).\n- `flex-grow` - how many shares of the **spare** space to take. 0 = none.\n- `flex-shrink` - how many shares of the **shortage** to give up when space is tight. 0 = never shrink.',
        'The shorthand `flex: grow shrink basis` is what you will use:',
        '```css\n.sidebar { flex: 0 0 200px; } /* exactly 200px, never grows or shrinks */\n.main    { flex: 2; }         /* 2 shares of the remaining space */\n.aside   { flex: 1; }         /* 1 share */\n```',
        '`flex: 1` on every item gives equal columns. `order` changes the visual order, and `align-self` overrides `align-items` for one item.',
        'Remember that `box-sizing: border-box` makes sizes include padding - the starter CSS sets it on every element.'
      ].join('\n\n'),
      java: 'Like `GridBagConstraints.weightx`: items with weight 0 keep their preferred size, the rest share the extra space in proportion to their weights.',
      example: {
        html: '<div class="row">\n  <div class="a">flex: 1</div>\n  <div class="b">flex: 2</div>\n  <div class="c">flex: 0 0 100px</div>\n</div>',
        css: '* {\n  box-sizing: border-box;\n}\n.row {\n  display: flex;\n  gap: 6px;\n}\n.row div {\n  padding: 10px 0;\n  text-align: center;\n  background: #4353c9;\n  color: white;\n}\n.a { flex: 1; }\n.b { flex: 2; }\n.c { flex: 0 0 100px; background: #ff7a1a; }'
      },
      related: ['css:flex', 'css:flex-grow', 'css:flex-shrink', 'css:flex-basis', 'css:order', 'explain:flexbox'],
      challenge: {
        title: 'A three-column layout',
        task: 'Turn `.layout` into a flex row where:\n\n1. The sidebar is always exactly **150px** wide (it never grows or shrinks).\n2. The main column takes **twice** as much of the remaining space as the aside.',
        starter: {
          html: '<div class="layout">\n  <nav class="sidebar">Sidebar</nav>\n  <main class="content">Main content</main>\n  <aside class="extra">Extra</aside>\n</div>',
          css: '* {\n  box-sizing: border-box;\n}\n\n.layout {\n  height: 160px;\n}\n\n.sidebar {\n  padding: 10px;\n  background: #1d2433;\n  color: white;\n}\n\n.content, .extra {\n  padding: 10px 0;\n  text-align: center;\n  color: white;\n}\n\n.content { background: #4353c9; }\n.extra { background: #ff7a1a; }'
        },
        solution: {
          html: '<div class="layout">\n  <nav class="sidebar">Sidebar</nav>\n  <main class="content">Main content</main>\n  <aside class="extra">Extra</aside>\n</div>',
          css: '* {\n  box-sizing: border-box;\n}\n\n.layout {\n  display: flex;\n  height: 160px;\n}\n\n.sidebar {\n  flex: 0 0 150px;\n  padding: 10px;\n  background: #1d2433;\n  color: white;\n}\n\n.content, .extra {\n  padding: 10px 0;\n  text-align: center;\n  color: white;\n}\n\n.content { flex: 2; background: #4353c9; }\n.extra { flex: 1; background: #ff7a1a; }'
        },
        hints: ['`flex: 0 0 150px` means: do not grow, do not shrink, start at 150px.', '`flex: 2` and `flex: 1` share the rest 2 : 1.'],
        checks: [
          { label: '`.layout` is a flex container', computed: '.layout', prop: 'display', equals: 'flex' },
          { label: 'The sidebar is 150px wide', rect: '.sidebar', side: 'width', min: 149, max: 151 },
          { label: 'The sidebar never grows (`flex-grow: 0`)', computed: '.sidebar', prop: 'flex-grow', equals: '0' },
          { label: 'The sidebar never shrinks (`flex-shrink: 0`)', computed: '.sidebar', prop: 'flex-shrink', equals: '0' },
          { label: 'Main is twice as wide as the aside', fn: 'function (doc) { var m = doc.querySelector(".content").getBoundingClientRect().width, a = doc.querySelector(".extra").getBoundingClientRect().width; return Math.abs(m - 2 * a) <= 2 || ("main is " + Math.round(m) + "px, aside " + Math.round(a) + "px"); }' }
        ]
      }
    },
    {
      id: 'css-grid', track: 'CSS', modes: M,
      title: 'CSS Grid',
      summary: 'Two-dimensional layout: define columns and rows, then place items - spans, fr units and named areas.',
      keywords: ['grid', 'grid-template-columns', 'fr', 'repeat', 'span', 'gap', 'layout', 'gallery'],
      body: [
        'Flexbox lays out one line at a time. **Grid** controls rows *and* columns together:',
        '```css\n.gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr); /* three equal columns */\n  grid-auto-rows: 80px;                  /* every row 80px tall */\n  gap: 10px;\n}\n```',
        '- `fr` is a **fraction** of the free space: `1fr 2fr` splits it 1 : 2.\n- `repeat(3, 1fr)` is short for `1fr 1fr 1fr`.\n- `repeat(auto-fill, minmax(150px, 1fr))` makes as many columns as fit: responsive without media queries.',
        '## Placing items',
        'The grid has numbered **lines** between tracks, starting at 1. An item can span:',
        '```css\n.feature {\n  grid-column: span 2;   /* two columns wide */\n  grid-row: 1 / 3;       /* from row line 1 to 3 */\n}\n```',
        'For page layouts, `grid-template-areas` lets you draw the layout with names - see [[css:grid-template-areas]]. The [[explain:grid]] lab draws the numbered lines for you.'
      ].join('\n\n'),
      java: 'Like `GridBagLayout` where you define the columns and rows once on the container; `grid-column: span 2` is `gridwidth = 2`.',
      example: {
        html: '<div class="grid">\n  <div class="big">1 (span 2)</div>\n  <div>2</div><div>3</div><div>4</div><div>5</div>\n</div>',
        css: '.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 8px;\n}\n.grid div {\n  padding: 14px;\n  background: #4353c9;\n  color: white;\n}\n.big {\n  grid-column: span 2;\n  background: #ff7a1a !important;\n}'
      },
      related: ['explain:grid', 'css:grid-template-columns', 'css:grid-column', 'css:grid-row', 'css:gap', 'css:grid-template-areas'],
      challenge: {
        title: 'A photo gallery',
        task: '1. Make `.gallery` a grid with **3 equal columns**, rows `80px` tall (`grid-auto-rows`) and a `10px` gap.\n2. Make the **first** photo span 2 columns **and** 2 rows.',
        starter: {
          html: '<div class="gallery">\n  <img src="landscape.svg" alt="Photo 1">\n  <img src="portrait.svg" alt="Photo 2">\n  <img src="landscape.svg" alt="Photo 3">\n  <img src="avatar.svg" alt="Photo 4">\n  <img src="landscape.svg" alt="Photo 5">\n  <img src="portrait.svg" alt="Photo 6">\n</div>',
          css: 'img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  border-radius: 6px;\n}'
        },
        solution: {
          html: '<div class="gallery">\n  <img src="landscape.svg" alt="Photo 1">\n  <img src="portrait.svg" alt="Photo 2">\n  <img src="landscape.svg" alt="Photo 3">\n  <img src="avatar.svg" alt="Photo 4">\n  <img src="landscape.svg" alt="Photo 5">\n  <img src="portrait.svg" alt="Photo 6">\n</div>',
          css: '.gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-auto-rows: 80px;\n  gap: 10px;\n}\n\n.gallery img:first-child {\n  grid-column: span 2;\n  grid-row: span 2;\n}\n\nimg {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  border-radius: 6px;\n}'
        },
        hints: ['`grid-template-columns: repeat(3, 1fr);`', 'Select the first photo with `.gallery img:first-child` and give it `grid-column: span 2; grid-row: span 2;`.'],
        checks: [
          { label: '`.gallery` is a grid', computed: '.gallery', prop: 'display', equals: 'grid' },
          { label: 'Three equal columns', fn: 'function (doc, win) { var c = win.getComputedStyle(doc.querySelector(".gallery")).gridTemplateColumns.split(" ").map(parseFloat).filter(function (n) { return !isNaN(n); }); if (c.length !== 3) return c.length + " column(s)"; return (Math.abs(c[0] - c[1]) < 1 && Math.abs(c[1] - c[2]) < 1) || "columns are " + c.map(Math.round).join("px, ") + "px"; }' },
          { label: 'A 10px gap', computed: '.gallery', prop: 'column-gap', equals: '10px' },
          { label: 'Rows are 80px tall', computed: '.gallery', prop: 'grid-auto-rows', equals: '80px' },
          { label: 'The first photo spans 2 columns', fn: 'function (doc) { var a = doc.querySelector(".gallery img:nth-child(1)").getBoundingClientRect(), b = doc.querySelector(".gallery img:nth-child(2)").getBoundingClientRect(); return Math.abs(a.width - (2 * b.width + 10)) <= 2 || ("it is " + Math.round(a.width) + "px wide"); }' },
          { label: 'The first photo spans 2 rows', rect: '.gallery img:first-child', side: 'height', min: 168, max: 172 }
        ]
      }
    },
    {
      id: 'css-position', track: 'CSS', modes: M,
      title: 'Positioning and z-index',
      summary: 'Take an element out of the normal flow: badges in corners, sticky headers, overlays.',
      keywords: ['position', 'absolute', 'relative', 'sticky', 'fixed', 'z-index', 'badge', 'overlay'],
      body: [
        'Normally elements flow one after another. `position` changes that, together with the offsets `top`, `right`, `bottom`, `left`:',
        '- `static` - normal flow (the default); offsets ignored.\n- `relative` - nudged from its normal spot; its space stays reserved. Also makes it the **reference box** for absolute children.\n- `absolute` - removed from the flow, placed against the nearest **positioned** ancestor.\n- `fixed` - pinned to the viewport; stays put while scrolling.\n- `sticky` - normal until it would scroll away, then sticks (e.g. at `top: 0`).',
        '## The badge pattern',
        '```css\n.card  { position: relative; }   /* the reference box */\n.badge {\n  position: absolute;\n  top: 8px;\n  right: 8px;                     /* top-right corner of .card */\n}\n```',
        'Forget the `relative` on the parent and the badge flies to the corner of the whole page - the most common positioning bug.',
        '## Stacking',
        'When positioned elements overlap, `z-index` decides which is in front: higher numbers win. Try it in the [[explain:positioning]] explainer.'
      ].join('\n\n'),
      java: '`absolute` is like a null layout with `setBounds()` relative to a container; `fixed` is relative to the window itself.',
      example: {
        html: '<div class="card">\n  <span class="badge">SALE</span>\n  <p>A card with a badge.</p>\n</div>',
        css: '.card {\n  position: relative;\n  width: 200px;\n  padding: 20px;\n  border: 1px solid #ccc;\n}\n.badge {\n  position: absolute;\n  top: -10px;\n  right: -10px;\n  padding: 2px 8px;\n  background: crimson;\n  color: white;\n  border-radius: 999px;\n}'
      },
      related: ['explain:positioning', 'css:position', 'css:top', 'css:z-index', 'css:inset'],
      challenge: {
        title: 'Badge and sticky header',
        task: '1. Put the red **NEW** badge in the **top-right corner of the card** (the card must be its reference box).\n2. Make the dark header **stick** to the top of the page while scrolling (`top: 0`).',
        starter: {
          html: '<header class="bar">Sticky header</header>\n<div class="card">\n  <span class="badge">NEW</span>\n  <h3>Product</h3>\n  <p>A card with a badge in its corner.</p>\n</div>\n<p class="filler">Scroll down…</p>\n<p class="filler">…more…</p>\n<p class="filler">…the end.</p>',
          css: '.bar {\n  background: #1d2433;\n  color: white;\n  padding: 10px;\n}\n\n.card {\n  width: 220px;\n  margin: 20px;\n  padding: 16px;\n  border: 1px solid #d9dde8;\n  border-radius: 10px;\n}\n\n.badge {\n  background: crimson;\n  color: white;\n  padding: 2px 8px;\n  font-size: 12px;\n  border-radius: 999px;\n}\n\n.filler {\n  height: 120px;\n}'
        },
        solution: {
          html: '<header class="bar">Sticky header</header>\n<div class="card">\n  <span class="badge">NEW</span>\n  <h3>Product</h3>\n  <p>A card with a badge in its corner.</p>\n</div>\n<p class="filler">Scroll down…</p>\n<p class="filler">…more…</p>\n<p class="filler">…the end.</p>',
          css: '.bar {\n  position: sticky;\n  top: 0;\n  background: #1d2433;\n  color: white;\n  padding: 10px;\n}\n\n.card {\n  position: relative;\n  width: 220px;\n  margin: 20px;\n  padding: 16px;\n  border: 1px solid #d9dde8;\n  border-radius: 10px;\n}\n\n.badge {\n  position: absolute;\n  top: 8px;\n  right: 8px;\n  background: crimson;\n  color: white;\n  padding: 2px 8px;\n  font-size: 12px;\n  border-radius: 999px;\n}\n\n.filler {\n  height: 120px;\n}'
        },
        hints: ['Parent `position: relative`, child `position: absolute` with `top` and `right`.', 'Sticky needs an offset: `position: sticky; top: 0;`.'],
        checks: [
          { label: 'The card is the reference box (`position: relative`)', computed: '.card', prop: 'position', equals: 'relative' },
          { label: 'The badge is `position: absolute`', computed: '.badge', prop: 'position', equals: 'absolute' },
          { label: 'The badge sits in the card\'s top-right corner', fn: 'function (doc) { var c = doc.querySelector(".card").getBoundingClientRect(), b = doc.querySelector(".badge").getBoundingClientRect(); return (Math.abs(b.right - c.right) <= 12 && Math.abs(b.top - c.top) <= 12) || ("it is " + Math.round(c.right - b.right) + "px from the right edge and " + Math.round(b.top - c.top) + "px from the top"); }' },
          { label: 'The header is sticky', computed: '.bar', prop: 'position', equals: 'sticky' },
          { label: '…at `top: 0`', computed: '.bar', prop: 'top', equals: '0px' }
        ]
      }
    },
    {
      id: 'css-responsive', track: 'CSS', modes: M,
      title: 'Responsive design and media queries',
      summary: 'One page that works on a phone and a desktop: mobile-first CSS, media queries and fluid sizes.',
      keywords: ['responsive', 'media query', 'mobile', 'viewport', 'breakpoint', 'mobile-first'],
      body: [
        '## Step 1: the viewport tag',
        'Without `<meta name="viewport" content="width=device-width, initial-scale=1">` in `<head>`, phones pretend to be 980px wide and shrink everything. (This tool\'s previews add it for you.)',
        '## Step 2: fluid by default',
        'Avoid fixed widths. Use `%`, `fr`, `max-width`, and make images shrink: `img { max-width: 100%; }`.',
        '## Step 3: media queries',
        'A media query applies rules only when a condition is true:',
        '```css\n/* mobile first: the base styles are for small screens */\n.cards {\n  display: grid;\n  gap: 10px;\n}\n\n/* from 600px wide, three columns */\n@media (min-width: 600px) {\n  .cards {\n    grid-template-columns: repeat(3, 1fr);\n  }\n}\n```',
        '**Mobile first** means writing the phone layout first, then adding `min-width` queries for bigger screens. The phone gets the least CSS, and each breakpoint only adds.',
        'Test it: drag the preview\'s corner, or use the Phone / Tablet buttons in the Playground.'
      ].join('\n\n'),
      java: 'Media queries are like conditional configuration - think Spring `@Profile` or `@ConditionalOnProperty`: the same beans (elements), different settings depending on the environment (the screen).',
      example: {
        html: '<div class="box">Resize the preview: I change colour below 500px.</div>',
        css: '.box {\n  padding: 20px;\n  background: #4353c9;\n  color: white;\n}\n@media (max-width: 500px) {\n  .box {\n    background: #ff7a1a;\n  }\n}',
        note: 'Drag the bottom-right corner of the preview to make it narrower.'
      },
      related: ['html:meta', 'css:max-width', 'css:grid-template-columns', 'html:picture'],
      challenge: {
        title: 'Mobile-first cards',
        task: '1. On small screens the three cards stack in **one column** (they already do).\n2. From **600px** wide (`@media (min-width: 600px)`), show them **side by side** in three columns.\n3. Make images never wider than their card: `max-width: 100%`.\n\nThe checker resizes the preview to 400px and 680px to test.',
        starter: {
          html: '<div class="cards">\n  <div class="card"><img src="landscape.svg" alt=""><p>One</p></div>\n  <div class="card"><img src="landscape.svg" alt=""><p>Two</p></div>\n  <div class="card"><img src="landscape.svg" alt=""><p>Three</p></div>\n</div>',
          css: '.card {\n  border: 1px solid #d9dde8;\n  border-radius: 8px;\n  padding: 8px;\n  margin-bottom: 10px;\n}'
        },
        solution: {
          html: '<div class="cards">\n  <div class="card"><img src="landscape.svg" alt=""><p>One</p></div>\n  <div class="card"><img src="landscape.svg" alt=""><p>Two</p></div>\n  <div class="card"><img src="landscape.svg" alt=""><p>Three</p></div>\n</div>',
          css: 'img {\n  max-width: 100%;\n}\n\n.card {\n  border: 1px solid #d9dde8;\n  border-radius: 8px;\n  padding: 8px;\n  margin-bottom: 10px;\n}\n\n@media (min-width: 600px) {\n  .cards {\n    display: grid;\n    grid-template-columns: repeat(3, 1fr);\n    gap: 10px;\n  }\n}'
        },
        hints: ['Put the multi-column rules inside `@media (min-width: 600px) { … }`.', 'Inside it, `display: grid; grid-template-columns: repeat(3, 1fr);` (or `display: flex` with `flex: 1` cards).'],
        checks: [
          { label: 'At 400px wide the cards stack', width: 400, check: { fn: 'function (doc) { var c = doc.querySelectorAll(".card"); return c[1].getBoundingClientRect().top >= c[0].getBoundingClientRect().bottom - 1 || "cards are side by side at 400px"; }' } },
          { label: 'At 680px wide the three cards are side by side', width: 680, check: { fn: 'function (doc) { var c = Array.prototype.map.call(doc.querySelectorAll(".card"), function (e) { return Math.round(e.getBoundingClientRect().top); }); return (Math.abs(c[0] - c[1]) <= 2 && Math.abs(c[1] - c[2]) <= 2) || "cards are stacked at 680px"; }' } },
          { label: 'Images have `max-width: 100%`', computed: 'img', prop: 'max-width', equals: '100%' },
          { label: 'Uses a `min-width: 600px` media query', source: 'css', match: '@media[^{]*min-width\\s*:\\s*600px' }
        ]
      }
    },
    {
      id: 'css-variables', track: 'CSS', modes: M,
      title: 'CSS variables and calc()',
      summary: 'Name a colour or a size once and reuse it everywhere, and let the browser do arithmetic with mixed units.',
      keywords: ['variables', 'custom properties', 'var', '--', 'calc', 'theme', 'design tokens', 'min', 'max', 'clamp'],
      body: [
        'Real stylesheets repeat the same brand colour and spacing dozens of times. **CSS variables** (the official name is *custom properties*) give a value a name, so you change it in one place.',
        '## Declare, then use',
        '```css\n:root {               /* the <html> element: seen by the whole page */\n  --brand: #4353c9;\n  --space: 12px;\n}\n\n.btn {\n  background: var(--brand);\n  padding: var(--space);\n}\n```',
        '- A variable name starts with two dashes: `--brand`. Names are case-sensitive.\n- `var(--brand)` reads it. `var(--brand, blue)` reads it, or uses `blue` when `--brand` is not set.\n- `:root` is the usual home for page-wide variables.',
        '## They cascade - and that is the point',
        'A variable is inherited like `color`: every element inside sees it, and any rule can **override it for its own part of the page**. Change the variable, not the properties that use it:',
        '```css\n.danger {\n  --brand: #c62828;   /* every .btn inside .danger turns red */\n}\n\n@media (min-width: 800px) {\n  :root {\n    --space: 20px;     /* more room on big screens */\n  }\n}\n```',
        'This is how dark themes are built: one class on `<body>` swaps a handful of colour variables. JavaScript can change them too: `document.body.style.setProperty("--brand", "teal")`.',
        '## calc(): arithmetic with mixed units',
        '`calc()` lets the browser work a value out at layout time, mixing units you could never add yourself: `width: calc(100% - 200px)` means "all the space, minus 200 pixels for the sidebar". Put spaces around `+` and `-`: `calc(100%-200px)` is invalid. Variables work inside: `calc(var(--space) * 2)`.',
        '## min(), max() and clamp()',
        '- `width: min(100%, 600px)` - the full width on a phone, never more than 600px.\n- `font-size: clamp(16px, 4vw, 28px)` - grows with the screen, but stays between 16px and 28px.',
        'In the editors, typing `var(` lists the variables your stylesheet declares, and hovering a variable shows where it is declared.'
      ].join('\n\n'),
      java: 'Variables on `:root` are like constants in one config class - closer still to Spring properties: `var(--brand, blue)` reads like `@Value("${brand:blue}")`, and a rule deeper in the page can override the value for its own part of the tree, the way a profile overrides `application.properties`.',
      example: {
        html: '<div class="card">\n  <h3>Default theme</h3>\n  <button class="btn">Save</button>\n</div>\n<div class="card dark">\n  <h3>Dark theme: only the variables change</h3>\n  <button class="btn">Save</button>\n</div>',
        css: ':root {\n  --bg: #ffffff;\n  --text: #1d2433;\n  --brand: #4353c9;\n  --space: 12px;\n}\n\n.dark {\n  --bg: #181c26;\n  --text: #e6e9f2;\n  --brand: #8b9cff;\n}\n\n.card {\n  background: var(--bg);\n  color: var(--text);\n  padding: calc(var(--space) * 2);\n  margin-bottom: var(--space);\n  border: 1px solid #d9dde8;\n  border-radius: 10px;\n}\n\n.btn {\n  background: var(--brand);\n  color: var(--bg);\n  border: 0;\n  border-radius: 6px;\n  padding: var(--space) calc(var(--space) * 2);\n}',
        note: 'Change `--brand` or `--space` in `:root` and watch both cards follow. Hover a `var(--…)` to see where it is declared.'
      },
      related: ['css:color', 'css:width', 'term:custom-property', 'term:calc', 'term:inheritance'],
      challenge: {
        title: 'A themeable toolbar',
        task: '1. In `:root`, declare `--brand: #4353c9` and `--space: 12px`.\n2. Give `.btn` `background: var(--brand)` and `padding: var(--space)`.\n3. In `.danger`, set **only the variable** `--brand` to `#c62828`, so the Delete button turns red without another `background` rule.\n4. Make `.main` exactly `calc(100% - 200px)` wide, so it fills the space next to the 200px menu.',
        starter: {
          html: '<div class="toolbar">\n  <button class="btn">Save</button>\n  <button class="btn">Share</button>\n</div>\n<div class="toolbar danger">\n  <button class="btn">Delete</button>\n</div>\n<div class="layout">\n  <nav class="side">Menu</nav>\n  <main class="main">Content</main>\n</div>',
          css: '.btn {\n  color: white;\n  border: 0;\n  border-radius: 6px;\n}\n\n.danger {\n}\n\n.toolbar {\n  margin-bottom: 8px;\n}\n\n.layout {\n  display: flex;\n}\n\n.side {\n  width: 200px;\n  flex: none;\n  background: #eef1fb;\n}\n\n.main {\n  background: #fff3d6;\n}'
        },
        solution: {
          html: '<div class="toolbar">\n  <button class="btn">Save</button>\n  <button class="btn">Share</button>\n</div>\n<div class="toolbar danger">\n  <button class="btn">Delete</button>\n</div>\n<div class="layout">\n  <nav class="side">Menu</nav>\n  <main class="main">Content</main>\n</div>',
          css: ':root {\n  --brand: #4353c9;\n  --space: 12px;\n}\n\n.btn {\n  background: var(--brand);\n  color: white;\n  border: 0;\n  border-radius: 6px;\n  padding: var(--space);\n}\n\n.danger {\n  --brand: #c62828;\n}\n\n.toolbar {\n  margin-bottom: 8px;\n}\n\n.layout {\n  display: flex;\n}\n\n.side {\n  width: 200px;\n  flex: none;\n  background: #eef1fb;\n}\n\n.main {\n  width: calc(100% - 200px);\n  background: #fff3d6;\n}'
        },
        hints: ['Declare variables inside `:root { … }`, each as `--name: value;`.', 'In `.danger`, write just `--brand: #c62828;`. The Delete button inside picks it up, because variables are inherited.', '`.main { width: calc(100% - 200px); }` - with spaces around the minus.'],
        checks: [
          { label: '`:root` declares `--brand` and `--space`', fn: 'function (doc, win) { var s = win.getComputedStyle(doc.documentElement); var b = s.getPropertyValue("--brand").trim(), p = s.getPropertyValue("--space").trim(); if (b.toLowerCase() !== "#4353c9") return b ? "--brand is \\"" + b + "\\"" : "no --brand on :root"; return p === "12px" || (p ? "--space is \\"" + p + "\\"" : "no --space on :root"); }' },
          { label: 'The Save button\'s background is the brand colour', computed: '.toolbar .btn', prop: 'background-color', equals: 'rgb(67, 83, 201)' },
          { label: '`.btn` reads it with `var(--brand)`', source: 'css', match: '\\.btn\\s*\\{[^}]*background(-color)?\\s*:\\s*var\\(\\s*--brand' },
          { label: 'Buttons are padded with `var(--space)` (12px)', computed: '.btn', prop: 'padding-top', equals: '12px' },
          { label: '`.btn` reads it with `var(--space)`', source: 'css', match: '\\.btn\\s*\\{[^}]*padding\\s*:\\s*var\\(\\s*--space' },
          { label: 'The Delete button is red', computed: '.danger .btn', prop: 'background-color', equals: 'rgb(198, 40, 40)' },
          { label: '`.danger` changes the variable', source: 'css', match: '\\.danger\\s*\\{[^}]*--brand\\s*:' },
          { label: '`.main` is 200px narrower than the layout', fn: 'function (doc) { var l = doc.querySelector(".layout").getBoundingClientRect().width, m = doc.querySelector(".main").getBoundingClientRect().width; return Math.abs(l - 200 - m) < 1 || ("main is " + Math.round(m) + "px wide in a " + Math.round(l) + "px layout"); }' },
          { label: 'Uses `calc(100% - 200px)`', source: 'css', match: 'calc\\(\\s*100%\\s*-\\s*200px\\s*\\)' }
        ]
      }
    },
    {
      id: 'css-motion', track: 'CSS', modes: M,
      title: 'Transitions, transforms and animations',
      summary: 'Hover effects that glide, elements that rotate and scale, and keyframe animations that loop.',
      keywords: ['transition', 'transform', 'animation', 'keyframes', 'hover', 'scale', 'rotate', 'motion'],
      body: [
        '## Transform',
        '`transform` moves, rotates or scales an element *as drawn*, without disturbing the layout: `translateX(20px)`, `rotate(45deg)`, `scale(1.1)`.',
        '## Transition: animate a change',
        'A transition animates between two states, usually normal and `:hover`:',
        '```css\n.btn {\n  transition: transform 0.2s ease;  /* what, how long, how */\n}\n.btn:hover {\n  transform: scale(1.1);\n}\n```',
        'The transition goes on the **normal** state, so it animates both ways.',
        '## Animation: keyframes that run on their own',
        '```css\n@keyframes spin {\n  to { transform: rotate(360deg); }\n}\n.loader {\n  animation: spin 1s linear infinite;  /* name duration timing count */\n}\n```',
        'Animate `transform` and `opacity` when you can - they stay smooth even on slow phones. And respect users who switch motion off with `@media (prefers-reduced-motion: reduce)`.'
      ].join('\n\n'),
      java: 'A transition is like a `javax.swing.Timer` interpolating a value for you - except you only declare the start, the end and the duration; the browser runs the frames.',
      example: {
        html: '<div class="box">Hover me</div>',
        css: '.box {\n  width: 120px;\n  padding: 20px;\n  background: #4353c9;\n  color: white;\n  transition: transform 0.3s ease, background-color 0.3s;\n}\n.box:hover {\n  transform: rotate(-5deg) scale(1.1);\n  background-color: #ff7a1a;\n}'
      },
      related: ['css:transition', 'css:transform', 'css:animation'],
      challenge: {
        title: 'A lively button and a spinner',
        task: '1. When the button is hovered, scale it to `1.1` (`.btn:hover { transform: scale(1.1); }`).\n2. Give `.btn` a `0.2s` transition on `transform`, so it grows smoothly.\n3. Make `.loader` spin forever with a `@keyframes` rotation.',
        starter: {
          html: '<button class="btn">Hover me</button>\n<div class="loader" role="status" aria-label="Loading"></div>',
          css: '.btn {\n  padding: 10px 20px;\n  font-size: 16px;\n}\n\n.loader {\n  width: 40px;\n  height: 40px;\n  margin-top: 20px;\n  border: 4px solid #d9dde8;\n  border-top-color: #4353c9;\n  border-radius: 50%;\n}'
        },
        solution: {
          html: '<button class="btn">Hover me</button>\n<div class="loader" role="status" aria-label="Loading"></div>',
          css: '.btn {\n  padding: 10px 20px;\n  font-size: 16px;\n  transition: transform 0.2s ease;\n}\n\n.btn:hover {\n  transform: scale(1.1);\n}\n\n@keyframes spin {\n  to { transform: rotate(360deg); }\n}\n\n.loader {\n  width: 40px;\n  height: 40px;\n  margin-top: 20px;\n  border: 4px solid #d9dde8;\n  border-top-color: #4353c9;\n  border-radius: 50%;\n  animation: spin 1s linear infinite;\n}'
        },
        hints: ['`transition: transform 0.2s ease;` goes on `.btn` itself, not on `:hover`.', '`@keyframes spin { to { transform: rotate(360deg); } }` then `animation: spin 1s linear infinite;`.'],
        checks: [
          { label: '`.btn:hover` scales to 1.1', source: 'css', match: '\\.btn:hover\\s*\\{[^}]*transform\\s*:\\s*scale\\(\\s*1\\.1\\s*\\)' },
          { label: '`.btn` transitions `transform`', computed: '.btn', prop: 'transition-property', match: 'transform|all' },
          { label: '…over 0.2s', computed: '.btn', prop: 'transition-duration', equals: '0.2s' },
          { label: '`.loader` has an animation', computed: '.loader', prop: 'animation-name', not: 'none' },
          { label: '…that repeats forever', computed: '.loader', prop: 'animation-iteration-count', equals: 'infinite' },
          { label: 'The keyframes rotate', source: 'css', match: '@keyframes[\\s\\S]*rotate' }
        ]
      }
    }
  );
})(window.UILT);
