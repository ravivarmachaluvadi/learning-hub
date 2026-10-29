/*
 * HTML elements, part 3: lists, links and media, tables.
 * Entry shape: see html-1-document.js. Sample files available to every demo (swapped for embedded
 * data when the preview renders): landscape.svg, portrait.svg, avatar.svg, tile.svg, beep.wav, clip.webm.
 */
(function (U) {
  var E = U.data.htmlElements = U.data.htmlElements || [];

  /* One table used by every table element; the element being studied gets {{attrs}} / {{content}}. */
  var TABLE = '<table%table%>\n' +
    '  <caption%caption%>%C:caption:Team scores%</caption>\n' +
    '  <thead%thead%>\n' +
    '    <tr>\n      <th%th%>%C:th:Name%</th>\n      <th scope="col">Score</th>\n    </tr>\n' +
    '  </thead>\n' +
    '  <tbody%tbody%>\n' +
    '    <tr%tr%>\n      <td%td%>%C:td:Asha%</td>\n      <td>42</td>\n    </tr>\n' +
    '    <tr>\n      <td>Vikram</td>\n      <td>37</td>\n    </tr>\n' +
    '  </tbody>\n' +
    '  <tfoot%tfoot%>\n' +
    '    <tr>\n      <td>Total</td>\n      <td>79</td>\n    </tr>\n' +
    '  </tfoot>\n' +
    '</table>';
  function table(subject) {
    return TABLE
      .replace(/%C:(\w+):([^%]*)%/g, function (_, t, d) { return t === subject ? '{{content}}' : d; })
      .replace(/%(\w+)%/g, function (_, t) { return t === subject ? '{{attrs}}' : ''; });
  }
  function tableCss(subject) {
    return 'table { border-collapse: collapse; }\n' +
      'th, td { border: 1px solid #b9bfd0; padding: 6px 10px; text-align: left; }\n' +
      'thead { background: #eef1fb; }\ntfoot { font-weight: 600; }\ncaption { padding: 4px; font-weight: 600; }\n' +
      '/* the element you are studying */\n' + subject + ' { outline: 3px solid #ff5a1f; outline-offset: -2px; background: #fff4ec; }';
  }
  function tablePart(tag, short, summary, description, extra) {
    return Object.assign({
      tag: tag, category: 'Tables', display: { caption: 'table-caption', thead: 'table-header-group', tbody: 'table-row-group', tfoot: 'table-footer-group', tr: 'table-row', th: 'table-cell', td: 'table-cell', table: 'table' }[tag],
      short: short, summary: summary, description: description,
      attributes: [],
      contentKind: 'none',
      demo: table(tag), demoCss: tableCss(tag),
      related: ['table', 'thead', 'tbody', 'tr', 'th', 'td'].filter(function (t) { return t !== tag; }),
      keywords: ['table', 'grid', 'data']
    }, extra || {});
  }

  var SPAN_ATTRS = [
    { name: 'colspan', kind: 'number', min: 1, max: 3, example: 2, desc: 'How many columns this cell stretches across. The other cells in the row then need to shrink in number to keep the table rectangular.' },
    { name: 'rowspan', kind: 'number', min: 1, max: 3, example: 2, desc: 'How many rows this cell stretches down.' }
  ];

  E.push(
    /* ---------- Lists ---------- */
    {
      tag: 'ul', category: 'Lists', display: 'block', short: 'bulleted list',
      summary: 'An unordered list: items where the order does not matter. Shown with bullets.',
      description: 'Its only allowed children are `<li>` items. Lists are everywhere once you know to look: menus, card grids and tag lists are usually `<ul>`s with the bullets removed by CSS (`list-style: none`).',
      java: 'Like a `Set` or an unordered `List`: a group of similar items, where position carries no meaning.',
      attributes: [],
      content: '\n  <li>Milk</li>\n  <li>Bread</li>\n  <li>Eggs</li>\n',
      demo: '<ul{{attrs}}>{{content}}</ul>',
      tips: ['Change the bullet with CSS `list-style-type` (disc, circle, square, none) - see the related links.'],
      mistakes: ['Putting text or a `<div>` directly inside `<ul>`. Only `<li>` may be a direct child; put anything else inside an `<li>`.'],
      related: ['ol', 'li', 'nav', 'css:list-style-type'],
      keywords: ['list', 'bullets', 'unordered', 'menu']
    },
    {
      tag: 'ol', category: 'Lists', display: 'block', short: 'numbered list',
      summary: 'An ordered list: items where the order matters, such as steps or a ranking. Numbered automatically.',
      description: 'The browser numbers the items for you and renumbers them when you add or remove one. `type`, `start` and `reversed` change the numbering.',
      java: 'Like a `List` where the index matters - but numbered from 1, and the numbers are drawn for you.',
      attributes: [
        {
          name: 'type', kind: 'enum', desc: 'The numbering style. (CSS `list-style-type` can do the same and more.)',
          values: [
            { value: '1', desc: 'Numbers: 1, 2, 3 (the default).' },
            { value: 'a', desc: 'Lowercase letters: a, b, c.' },
            { value: 'A', desc: 'Uppercase letters: A, B, C.' },
            { value: 'i', desc: 'Lowercase Roman numerals: i, ii, iii.' },
            { value: 'I', desc: 'Uppercase Roman numerals: I, II, III.' }
          ]
        },
        { name: 'start', kind: 'number', min: -5, max: 20, example: 5, desc: 'The number to start counting from (always a number, even for letter styles: `start="3"` gives "c").' },
        { name: 'reversed', kind: 'boolean', desc: 'Count down instead of up: 3, 2, 1. For countdowns and "top 10" lists.' }
      ],
      content: '\n  <li>Preheat the oven</li>\n  <li>Mix the batter</li>\n  <li>Bake for 20 minutes</li>\n',
      demo: '<ol{{attrs}}>{{content}}</ol>',
      related: ['ul', 'li', 'css:list-style-type'],
      keywords: ['numbered list', 'ordered', 'steps', 'ranking']
    },
    {
      tag: 'li', category: 'Lists', display: 'list-item', short: 'list item',
      summary: 'One item in a `<ul>` or `<ol>`.',
      description: 'An `<li>` can contain anything: text, links, images, even another list (a nested list).',
      attributes: [
        { name: 'value', kind: 'number', min: 1, max: 20, example: 10, desc: 'In an `<ol>`: force this item\'s number. The following items continue from it.' }
      ],
      content: 'Second item',
      demo: '<ol>\n  <li>First item</li>\n  <li{{attrs}}>{{content}}</li>\n  <li>Third item</li>\n</ol>',
      related: ['ul', 'ol'],
      keywords: ['list item', 'item', 'bullet']
    },
    {
      tag: 'dl', title: 'dl · dt · dd', category: 'Lists', display: 'block', short: 'terms and descriptions',
      summary: 'A description list: pairs of a term (`<dt>`) and its description (`<dd>`). For glossaries, FAQs and "label: value" details.',
      description: '`<dt>` is the term, `<dd>` the description, indented by default. One term can have several descriptions and the other way round.',
      java: 'Like a `Map<String, String>` written out: each `<dt>` is a key, each `<dd>` its value.',
      attributes: [],
      content: '\n  <dt>HTML</dt>\n  <dd>The structure of the page.</dd>\n  <dt>CSS</dt>\n  <dd>The look of the page.</dd>\n  <dt>JavaScript</dt>\n  <dd>The behaviour of the page.</dd>\n',
      demo: '<dl{{attrs}}>{{content}}</dl>',
      demoCss: 'dt { font-weight: 600; }\ndd { margin: 0 0 8px 24px; color: #4d5568; }',
      related: ['ul', 'table'],
      keywords: ['dt', 'dd', 'definition list', 'description list', 'glossary', 'key value']
    },

    /* ---------- Links and media ---------- */
    {
      tag: 'a', category: 'Links & media', display: 'inline', short: 'link (anchor)',
      summary: 'A link: goes to another page, a place on this page, an email address, a phone number or a file.',
      description: 'The `href` attribute says where it goes. Without `href` it is only a placeholder and is not clickable. In the preview, clicking a link does not navigate; a message below the preview says what would happen.',
      java: 'Like a URI field with a click handler built in: the browser itself performs the navigation when it is clicked.',
      attributes: [
        {
          name: 'href', kind: 'text', example: 'https://developer.mozilla.org', desc: 'The destination ("hypertext reference"). Click a suggestion to try each kind of address.',
          suggestions: [
            { value: 'https://developer.mozilla.org', desc: 'absolute URL: another site' },
            { value: 'contact.html', desc: 'relative URL: a file next to this page' },
            { value: '/about', desc: 'root-relative URL: from the top of this site' },
            { value: '#section-2', desc: 'fragment: a place on this page (an element with id="section-2")' },
            { value: 'mailto:ravi@example.com', desc: 'opens the email app' },
            { value: 'tel:+919876543210', desc: 'offers to call the number (on phones)' },
            { value: 'report.pdf', desc: 'a file' }
          ]
        },
        {
          name: 'target', kind: 'enum', desc: 'Where to open the destination.', unset: 'Not set: opens in the same tab, replacing this page.',
          values: [
            { value: '_self', desc: 'The same tab (the default).' },
            { value: '_blank', desc: 'A new tab. Use sparingly; users can always open a new tab themselves.' },
            { value: '_parent', desc: 'The parent frame, when this page is inside an `<iframe>`.' },
            { value: '_top', desc: 'The whole window, breaking out of all frames.' }
          ]
        },
        {
          name: 'rel', kind: 'enum', desc: 'The relationship to the destination. Mostly used for security and for search engines.',
          values: [
            { value: 'noopener', desc: 'The new tab gets no control over this page. Browsers now apply this automatically for `target="_blank"`.' },
            { value: 'noreferrer', desc: 'Do not tell the destination which page the visitor came from (also implies noopener).' },
            { value: 'nofollow', desc: 'Tell search engines not to treat this link as a recommendation (e.g. links in user comments).' },
            { value: 'sponsored', desc: 'Marks a paid or advertising link for search engines.' }
          ]
        },
        { name: 'download', kind: 'boolean', desc: 'Download the file instead of opening it. It can also hold a file name: `download="report.pdf"`.' }
      ],
      start: { href: 'https://developer.mozilla.org' },
      content: 'Visit MDN',
      demo: '<p>Read the docs: <a{{attrs}}>{{content}}</a></p>\n<p>Click the link and watch the message below the preview.</p>',
      tips: ['Link text should make sense on its own: "Download the price list" beats "click here". Screen-reader users often browse a list of links.'],
      mistakes: ['Using `<a>` without `href` and a click handler as a button. If it does something rather than going somewhere, it is a `<button>`.'],
      related: ['nav', 'button', 'img', 'css:color', 'css:text-decoration', 'lesson:html-links-images'],
      keywords: ['link', 'hyperlink', 'url', 'anchor', 'href', 'navigate', 'mailto']
    },
    {
      tag: 'img', category: 'Links & media', display: 'inline', void: true, short: 'image',
      summary: 'An image. `src` says which file, `alt` describes it for people who cannot see it.',
      description: 'A void element: no content, no closing tag. It is inline, so it sits on a line of text, aligned to the baseline (which leaves a small gap underneath - see the tips). The tool provides sample files: landscape.svg, portrait.svg, avatar.svg, tile.svg.',
      attributes: [
        {
          name: 'src', kind: 'text', example: 'landscape.svg', required: true, desc: 'The image file: a path or a URL. Try missing.png to see a broken image.',
          suggestions: ['landscape.svg', 'portrait.svg', 'avatar.svg', 'missing.png']
        },
        {
          name: 'alt', kind: 'text', example: 'Green hills under a blue sky', allowEmpty: true, desc: 'Alternative text: read aloud by screen readers and shown if the image fails to load. Describe what the image shows or does. For purely decorative images use an empty `alt=""`.',
          suggestions: ['Green hills under a blue sky', '']
        },
        { name: 'width', kind: 'number', min: 20, max: 640, step: 10, example: 320, desc: 'Width in CSS pixels (no unit in HTML). Setting width and height lets the browser reserve space before the image loads, so the page does not jump.' },
        { name: 'height', kind: 'number', min: 20, max: 400, step: 10, example: 200, desc: 'Height in pixels. If you set only one of width/height, the other scales to keep the shape.' },
        {
          name: 'loading', kind: 'enum', desc: 'When to download the image.',
          values: [
            { value: 'lazy', desc: 'Wait until the user scrolls near it. Saves data for images far down the page.' },
            { value: 'eager', desc: 'Load immediately (the default). Use it for the first images on screen.' }
          ]
        },
        {
          name: 'decoding', kind: 'enum', desc: 'A hint for when to decode the image into pixels.',
          values: [
            { value: 'async', desc: 'Decode in the background; other content may appear first.' },
            { value: 'sync', desc: 'Decode together with the surrounding content.' },
            { value: 'auto', desc: 'Let the browser choose (the default).' }
          ]
        },
        {
          name: 'srcset', kind: 'text', example: 'avatar.svg 1x, landscape.svg 2x', desc: 'Alternative files for different screen densities or widths; the browser picks the best. `1x`/`2x` are pixel densities.',
          suggestions: ['avatar.svg 1x, landscape.svg 2x']
        }
      ],
      start: { src: 'landscape.svg', alt: 'Green hills under a blue sky', width: '320', height: '200' },
      demo: '<p>Text before.</p>\n<img{{attrs}}>\n<p>Text after.</p>',
      tips: ['Remove the gap below an image with CSS `display: block` (or `vertical-align: middle`).', 'Make images shrink on small screens with `max-width: 100%; height: auto;`.'],
      mistakes: ['Leaving out `alt`. Screen readers then read the file name, such as "IMG_0042.jpg".'],
      related: ['picture', 'figure', 'css:object-fit', 'css:aspect-ratio', 'css:max-width', 'lesson:html-links-images'],
      keywords: ['image', 'picture', 'photo', 'alt text', 'src']
    },
    {
      tag: 'picture', title: 'picture · source', category: 'Links & media', display: 'inline', short: 'responsive image choices',
      summary: 'Offers several versions of an image; the browser shows the first `<source>` whose condition matches, otherwise the `<img>` inside.',
      description: 'Used for "art direction" (a tall crop on phones, a wide one on desktops) and for modern formats (AVIF/WebP with a JPEG fallback). The attributes below belong to the `<source>`. Drag the preview\'s corner to make it narrower than 500px and watch the image swap.',
      attributes: [
        {
          name: 'media', kind: 'enum', desc: 'A media query: use this source only when it is true.',
          values: [
            { value: '(max-width: 500px)', desc: 'When the page is at most 500px wide (phones).' },
            { value: '(min-width: 501px)', desc: 'When the page is wider than 500px.' },
            { value: '(orientation: portrait)', desc: 'When the page is taller than it is wide. Drag the preview to make it tall.' },
            { value: '(prefers-color-scheme: dark)', desc: 'When the device is in dark mode.' }
          ]
        },
        { name: 'srcset', kind: 'text', example: 'portrait.svg', required: true, desc: 'The image file(s) for this source.', suggestions: ['portrait.svg', 'avatar.svg'] },
        {
          name: 'type', kind: 'enum', desc: 'The file format. Browsers that cannot show it skip this source.',
          values: [
            { value: 'image/avif', desc: 'AVIF: very small files, newer format.' },
            { value: 'image/webp', desc: 'WebP: small files, supported everywhere today.' },
            { value: 'image/svg+xml', desc: 'SVG: vector drawings that stay sharp at any size.' }
          ]
        }
      ],
      start: { media: '(max-width: 500px)', srcset: 'portrait.svg' },
      contentKind: 'none',
      demo: '<picture>\n  <source{{attrs}}>\n  <img src="landscape.svg" alt="A landscape" style="max-width: 100%">\n</picture>',
      related: ['img', 'figure', 'lesson:css-responsive'],
      keywords: ['responsive image', 'source', 'srcset', 'webp', 'avif', 'art direction']
    },
    {
      tag: 'figure', title: 'figure · figcaption', category: 'Links & media', display: 'block', short: 'image with a caption',
      summary: 'Self-contained content, usually an image, diagram or code sample, with an optional caption (`<figcaption>`).',
      description: 'The caption is tied to the figure, so screen readers read them together. Browsers indent figures with a 40px side margin by default.',
      attributes: [],
      content: 'Fig. 1 - The hills near Nandi.',
      contentHelp: 'The caption text (inside <figcaption>).',
      demo: '<figure{{attrs}}>\n  <img src="landscape.svg" alt="Green hills" width="240">\n  <figcaption>{{content}}</figcaption>\n</figure>',
      demoCss: 'figcaption { font-size: 13px; color: #4d5568; }',
      related: ['img', 'blockquote', 'pre'],
      keywords: ['figcaption', 'caption', 'image caption', 'diagram']
    },
    {
      tag: 'video', category: 'Links & media', display: 'inline', short: 'video player',
      summary: 'Plays a video. With `controls`, the browser draws play, pause, seek and volume buttons for you.',
      description: 'The preview uses clip.webm, a 3-second sample the tool records for you when this page opens. Most browsers block autoplay with sound, so autoplay only works together with `muted`.',
      needsVideo: true,
      attributes: [
        { name: 'src', kind: 'text', example: 'clip.webm', desc: 'The video file.' },
        { name: 'controls', kind: 'boolean', desc: 'Show the browser\'s play/pause/volume controls. Without it, the video can only be started from JavaScript.' },
        { name: 'autoplay', kind: 'boolean', desc: 'Start playing as soon as possible. Browsers allow this only when the video is also `muted`.' },
        { name: 'muted', kind: 'boolean', desc: 'Start with the sound off.' },
        { name: 'loop', kind: 'boolean', desc: 'Start again from the beginning when it ends.' },
        { name: 'playsinline', kind: 'boolean', desc: 'On iPhones, play inside the page instead of jumping to full screen.' },
        { name: 'poster', kind: 'text', example: 'landscape.svg', desc: 'An image shown before the video starts playing.' },
        { name: 'width', kind: 'number', min: 120, max: 640, step: 10, example: 320, desc: 'Display width in pixels; the height follows the video\'s shape.' },
        {
          name: 'preload', kind: 'enum', desc: 'How much to download before the user presses play.',
          values: [
            { value: 'none', desc: 'Nothing. Saves data; there may be a pause when play is pressed.' },
            { value: 'metadata', desc: 'Only the length and size (and often the first frame).' },
            { value: 'auto', desc: 'The browser may download the whole video in advance.' }
          ]
        }
      ],
      start: { src: 'clip.webm', controls: true, width: '320' },
      content: 'Your browser cannot play this video.',
      contentHelp: 'Fallback text, shown only by browsers that cannot play video at all.',
      demo: '<video{{attrs}}>{{content}}</video>',
      tips: ['Offer captions for speech with a `<track kind="captions" src="captions.vtt" srclang="en">` child.'],
      related: ['audio', 'img', 'iframe'],
      keywords: ['video', 'movie', 'player', 'mp4', 'webm', 'autoplay']
    },
    {
      tag: 'audio', category: 'Links & media', display: 'inline', short: 'audio player',
      summary: 'Plays sound. With `controls`, the browser draws a player; without it, nothing is visible.',
      description: 'The preview uses beep.wav, a one-second tone the tool generates. The same attributes as `<video>` apply (except the visual ones).',
      attributes: [
        { name: 'src', kind: 'text', example: 'beep.wav', desc: 'The sound file (MP3, WAV, OGG, AAC…).' },
        { name: 'controls', kind: 'boolean', desc: 'Show the play/pause/volume controls. Without it, the element is invisible.' },
        { name: 'autoplay', kind: 'boolean', desc: 'Start playing straight away. Browsers usually block this until the user has interacted with the page.' },
        { name: 'loop', kind: 'boolean', desc: 'Repeat when it ends.' },
        { name: 'muted', kind: 'boolean', desc: 'Start with the sound off.' },
        {
          name: 'preload', kind: 'enum', desc: 'How much to download in advance.',
          values: [
            { value: 'none', desc: 'Nothing until play is pressed.' },
            { value: 'metadata', desc: 'Only the length.' },
            { value: 'auto', desc: 'Possibly the whole file.' }
          ]
        }
      ],
      start: { src: 'beep.wav', controls: true },
      content: 'Your browser cannot play audio.',
      contentHelp: 'Fallback text for browsers without audio support.',
      demo: '<audio{{attrs}}>{{content}}</audio>',
      related: ['video'],
      keywords: ['audio', 'sound', 'music', 'mp3', 'player']
    },
    {
      tag: 'iframe', category: 'Links & media', display: 'inline', short: 'a page inside the page',
      summary: 'Embeds another web page inside this one, in its own rectangle: maps, YouTube videos, payment forms.',
      description: 'The inner page is fully separate: its own HTML, CSS and JavaScript. This tool\'s previews are iframes too. Many sites refuse to be embedded, so `src` often shows an error; `srcdoc` lets you write the inner page directly.',
      java: 'Like running a second, sandboxed application inside a window of yours: separate state, separate scripts, and you decide its permissions with `sandbox`.',
      attributes: [
        { name: 'srcdoc', kind: 'text', example: '<h2>Hello!</h2><p>I am a separate page.</p>', desc: 'The HTML of the inner page, written inline. Wins over `src`.' },
        { name: 'src', kind: 'text', example: 'https://example.com', desc: 'The URL of the page to embed. (Needs internet; many sites block embedding.)' },
        { name: 'width', kind: 'number', min: 100, max: 600, step: 10, example: 300, desc: 'Width in pixels (default 300).' },
        { name: 'height', kind: 'number', min: 50, max: 400, step: 10, example: 150, desc: 'Height in pixels (default 150).' },
        { name: 'title', kind: 'text', example: 'Example frame', desc: 'A label for screen readers. Required for accessibility.' },
        {
          name: 'loading', kind: 'enum', desc: 'When to load the inner page.',
          values: [
            { value: 'lazy', desc: 'Only when the user scrolls near it.' },
            { value: 'eager', desc: 'Straight away (the default).' }
          ]
        },
        {
          name: 'sandbox', kind: 'text', allowEmpty: true, example: 'allow-scripts', desc: 'Restrict the inner page. Present but empty means "block everything" (scripts, forms, pop-ups); list permissions to grant them back. Click the button in the frame to see whether its script runs.',
          suggestions: [{ value: '', desc: 'block everything' }, { value: 'allow-scripts', desc: 'scripts may run' }, { value: 'allow-scripts allow-forms', desc: 'scripts and forms' }]
        }
      ],
      start: { srcdoc: '<h3>Hello!</h3><p>I am a separate page.</p><button onclick="this.textContent=\'My script ran\'">Click me</button>', width: '320', height: '150', title: 'Example frame' },
      contentKind: 'none',
      demo: '<iframe{{attrs}}></iframe>',
      demoCss: 'iframe { border: 2px solid #4353c9; border-radius: 6px; }',
      related: ['video', 'a', 'canvas'],
      keywords: ['embed', 'frame', 'youtube', 'map', 'sandbox', 'srcdoc']
    },
    {
      tag: 'canvas', category: 'Links & media', display: 'inline', short: 'drawing surface for scripts',
      summary: 'A blank drawing surface. JavaScript draws on it pixel by pixel: charts, games, image editing.',
      description: 'On its own a canvas is empty and transparent; everything you see is drawn by the script under it. `width`/`height` set the number of pixels to draw on (default 300 × 150); the drawing stays where the script put it.',
      java: 'Like `paintComponent(Graphics g)` in Swing: you get a 2D context and call fill/stroke methods on it.',
      attributes: [
        { name: 'width', kind: 'number', min: 100, max: 500, step: 10, example: 300, desc: 'Drawing width in pixels (default 300).' },
        { name: 'height', kind: 'number', min: 50, max: 300, step: 10, example: 150, desc: 'Drawing height in pixels (default 150).' }
      ],
      start: { width: '300', height: '150' },
      content: 'A sunny landscape drawn with JavaScript.',
      contentHelp: 'Fallback content for screen readers and old browsers.',
      demo: '<canvas{{attrs}}>{{content}}</canvas>\n<script>\n  const ctx = document.querySelector("canvas").getContext("2d");\n  ctx.fillStyle = "#8ec5ff"; ctx.fillRect(0, 0, 300, 150);\n  ctx.fillStyle = "#ffd34d"; ctx.beginPath(); ctx.arc(240, 40, 22, 0, Math.PI * 2); ctx.fill();\n  ctx.fillStyle = "#3f8f5b"; ctx.fillRect(0, 110, 300, 40);\n  ctx.fillStyle = "#1d2433"; ctx.font = "16px sans-serif";\n  ctx.fillText("Drawn with JavaScript", 12, 28);\n</script>',
      demoCss: 'canvas { border: 1px dashed #9aa3b8; }',
      related: ['svg', 'img', 'script'],
      keywords: ['draw', 'graphics', 'chart', 'game', '2d']
    },
    {
      tag: 'svg', category: 'Links & media', display: 'inline', short: 'vector drawing',
      summary: 'Scalable Vector Graphics: drawings described as shapes, written right in the HTML. Stays sharp at any size; perfect for icons and logos.',
      description: '`viewBox` defines the drawing\'s own coordinate system; `width`/`height` say how big to show it. The shapes inside (`<circle>`, `<rect>`, `<path>`) can be styled with CSS, e.g. `fill` and `stroke`.',
      attributes: [
        { name: 'width', kind: 'number', min: 20, max: 400, step: 10, example: 120, desc: 'Displayed width in pixels.' },
        { name: 'height', kind: 'number', min: 20, max: 400, step: 10, example: 120, desc: 'Displayed height in pixels.' },
        {
          name: 'viewBox', kind: 'text', example: '0 0 100 100', desc: 'The drawing\'s coordinate system: min-x, min-y, width, height. Shapes use these coordinates; the browser scales them to the displayed size. Try "0 0 200 200" (zoom out) or "25 25 50 50" (zoom in).',
          suggestions: ['0 0 100 100', '0 0 200 200', '25 25 50 50']
        }
      ],
      start: { width: '120', height: '120', viewBox: '0 0 100 100' },
      content: '\n  <circle cx="50" cy="50" r="40" fill="#ffd34d" stroke="#d98c3f" stroke-width="4"/>\n  <circle cx="36" cy="42" r="5" fill="#1d2433"/>\n  <circle cx="64" cy="42" r="5" fill="#1d2433"/>\n  <path d="M32 62 Q50 78 68 62" fill="none" stroke="#1d2433" stroke-width="4" stroke-linecap="round"/>\n',
      demo: '<svg xmlns="http://www.w3.org/2000/svg"{{attrs}}>{{content}}</svg>',
      demoCss: 'svg { border: 1px dashed #9aa3b8; }',
      related: ['canvas', 'img'],
      keywords: ['vector', 'icon', 'logo', 'graphics', 'viewbox']
    },

    /* ---------- Tables ---------- */
    tablePart('table', 'data in rows and columns',
      'A table of data in rows and columns. Built from rows (`<tr>`) of cells (`<th>` headers, `<td>` data).',
      'Use tables for tabular data - things you would put in a spreadsheet - and never for page layout (that is what CSS grid and flexbox are for). Group rows into `<thead>`, `<tbody>` and `<tfoot>`, and add a `<caption>`. The borders here come from CSS: tables have no borders by default.',
      {
        java: 'A 2D structure, like `List<List<String>>` for the rows, with header cells naming the columns - think of a JDBC `ResultSet` drawn on screen.',
        tips: ['`border-collapse: collapse` in CSS merges the double borders between cells into single lines.'],
        mistakes: ['Using a table to lay out a page. It breaks on small screens and confuses screen readers.'],
        related: ['caption', 'thead', 'tbody', 'tr', 'th', 'td', 'css:border-collapse', 'lesson:html-lists-tables'],
        keywords: ['table', 'grid', 'data', 'rows', 'columns', 'spreadsheet']
      }),
    tablePart('caption', 'table title', 'The title of a table. Must be the first child of `<table>`.',
      'Shown above the table by default (CSS `caption-side: bottom` moves it). Screen readers announce it when entering the table.',
      { contentKind: 'text', content: 'Team scores' }),
    tablePart('thead', 'header rows', 'The group of header rows at the top of a table.',
      'Holds the row(s) of column headings. When a long table is printed, browsers repeat the `<thead>` on every page.'),
    tablePart('tbody', 'body rows', 'The main group of data rows.',
      'If you leave it out, the browser adds one for you - which is why a CSS selector like `table > tr` never matches.'),
    tablePart('tfoot', 'footer rows', 'A group of summary rows at the bottom, such as totals.',
      'Like `<thead>`, it is repeated on every printed page.'),
    tablePart('tr', 'table row', 'One row of cells.',
      'Contains `<th>` and/or `<td>` cells. Rows are commonly striped with CSS: `tbody tr:nth-child(even) { background: #f3f5fb; }`.'),
    tablePart('th', 'header cell', 'A header cell: names a column or a row. Bold and centred by default.',
      '`scope` says whether it heads a column or a row, which lets screen readers announce "Score, 42" instead of just "42".',
      {
        contentKind: 'text', content: 'Name',
        attributes: [
          {
            name: 'scope', kind: 'enum', desc: 'Which cells this header describes.',
            values: [
              { value: 'col', desc: 'The cells below it, in its column.' },
              { value: 'row', desc: 'The cells to its right, in its row.' },
              { value: 'colgroup', desc: 'A group of columns.' },
              { value: 'rowgroup', desc: 'A group of rows.' }
            ]
          },
          SPAN_ATTRS[0], SPAN_ATTRS[1],
          { name: 'abbr', kind: 'text', example: 'Pts', desc: 'A short form of the header that screen readers may use when repeating it.' }
        ],
        start: { scope: 'col' }
      }),
    tablePart('td', 'data cell', 'A data cell: one value in the table.',
      'Cells can stretch across several columns (`colspan`) or rows (`rowspan`), like merged cells in a spreadsheet.',
      {
        contentKind: 'text', content: 'Asha',
        attributes: [
          SPAN_ATTRS[0], SPAN_ATTRS[1],
          { name: 'headers', kind: 'text', example: 'name-col', desc: 'For complex tables: the ids of the `<th>` cells that describe this cell.' }
        ]
      })
  );
})(window.UILT);
