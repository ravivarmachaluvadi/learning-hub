/*
 * HTML elements, part 1: the document skeleton and the page-structure ("sectioning") elements.
 *
 * Entry shape (read by js/views/html-ref.js):
 *   tag, title?, category, display, short (sidebar hint), summary, description, java?,
 *   void?, attributes: [...], start: {attr: value} (pre-selected), content (default inner HTML),
 *   contentKind: 'html'|'text'|'css'|'js'|'none', variant? ({label, values}) for h1-h6,
 *   demo: template string or function(values, content, variant, attrs) -> preview HTML,
 *   code?: template for the code panel when it differs from the demo, demoCss?,
 *   tips[], mistakes[], related[], keywords[],
 *   illustration: true when the preview draws the effect instead of containing the element (meta, link)
 * Templates use {{attrs}} {{content}} {{variant}} {{attr:name|fallback}}.
 */
(function (U) {
  var E = U.data.htmlElements = U.data.htmlElements || [];

  /* A fake browser window, used to show what <head> content does (it is never drawn on the page). */
  var MOCK_CSS =
    '.mock { border: 1px solid #c9cfdc; border-radius: 10px; overflow: hidden; max-width: 540px; background: #fff; }\n' +
    '.mock-bar { display: flex; align-items: flex-end; gap: 6px; padding: 8px 8px 0; background: #e3e8f2; }\n' +
    '.mock-tab { display: flex; align-items: center; gap: 6px; max-width: 240px; padding: 6px 12px; border-radius: 8px 8px 0 0;\n' +
    '  background: #fff; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n' +
    '.mock-tab i { flex: none; width: 14px; height: 14px; border-radius: 3px; background: #9aa3b8; }\n' +
    '.mock-url { padding: 6px 12px; border-bottom: 1px solid #dde2ec; color: #5f6880; font-size: 12.5px; }\n' +
    '.mock-page { padding: 14px; min-height: 80px; }\n' +
    '.note { color: #4d5568; font-size: 13px; }\n' +
    '.serp { font-family: arial, sans-serif; max-width: 520px; }\n' +
    '.serp cite { color: #202124; font-style: normal; font-size: 13px; }\n' +
    '.serp h3 { color: #1a0dab; font-weight: 400; font-size: 19px; margin: 2px 0; }\n' +
    '.serp p { color: #4d5156; font-size: 14px; margin: 0; }\n' +
    '.phones { display: flex; gap: 18px; flex-wrap: wrap; }\n' +
    '.phone { width: 150px; height: 230px; border: 6px solid #1d2433; border-radius: 18px; overflow: hidden; background: #fff; }\n' +
    '.phone-bar { height: 22px; }\n' +
    '.phone p { margin: 6px; }\n' +
    '.cap { font-size: 12px; color: #4d5568; max-width: 150px; }\n';

  function mock(tabText, url, page, favicon) {
    return '<div class="mock">\n  <div class="mock-bar"><div class="mock-tab"><i' + (favicon ? ' style="background:' + favicon + '"' : '') + '></i>' + tabText + '</div></div>\n' +
      '  <div class="mock-url">' + url + '</div>\n  <div class="mock-page">' + page + '</div>\n</div>';
  }

  /* Page skeleton used by the sectioning elements; the element being studied gets {{attrs}}/{{content}}. */
  function page(subject) {
    function open(tag, inner) {
      return tag === subject ? '<' + tag + '{{attrs}}>{{content}}</' + tag + '>' : '<' + tag + '>' + inner + '</' + tag + '>';
    }
    return open('header', '\n  <strong>MySite</strong>\n  ' + open('nav', '<a href="#">Home</a> · <a href="#">Blog</a> · <a href="#">About</a>') + '\n') + '\n' +
      open('main', '\n  ' + open('article', '\n    <h2>Article title</h2>\n    <p>An article stands on its own.</p>\n    ' +
        open('section', '<h3>A section</h3><p>One part of the article.</p>') + '\n  ') + '\n  ' +
        open('aside', 'Related links') + '\n') + '\n' +
      open('footer', '© 2026 MySite');
  }
  function pageCss(subject) {
    return 'body { font-size: 13px; }\n' +
      'header, nav, main, article, section, aside, footer {\n  position: relative; margin: 4px 0; padding: 16px 8px 6px;\n  border: 1.5px dashed #9aa3b8; border-radius: 6px;\n}\n' +
      'header::before, nav::before, main::before, article::before, section::before, aside::before, footer::before {\n' +
      '  position: absolute; top: 1px; left: 6px; font: 10px monospace; color: #5f6880;\n}\n' +
      ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer'].map(function (t) { return t + '::before { content: "' + t + '"; }'; }).join('\n') + '\n' +
      'header { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }\n' +
      'main { display: flex; gap: 8px; }\narticle { flex: 3; }\naside { flex: 1; }\nh2, h3 { margin: 4px 0; }\np { margin: 4px 0; }\n' +
      '/* the element you are studying */\n' + subject + ' { border: 2.5px solid #ff5a1f; background: #fff4ec; }';
  }

  var LANG = [
    { value: 'en', desc: 'English.' },
    { value: 'en-IN', desc: 'English as written in India: language code plus a region code.' },
    { value: 'hi', desc: 'Hindi.' },
    { value: 'te', desc: 'Telugu.' },
    { value: 'ar', desc: 'Arabic. Combine with `dir="rtl"`.' }
  ];
  var DIR = [
    { value: 'ltr', desc: 'Left to right. The default.' },
    { value: 'rtl', desc: 'Right to left: text aligns right, and the order of inline items flips.' },
    { value: 'auto', desc: 'Let the browser decide from the text itself.' }
  ];

  E.push(
    {
      tag: 'html', category: 'Document', display: 'block', short: 'the root of the page',
      summary: 'The root element: everything on the page sits inside `<html>`.',
      description: 'A page is one `<html>` element with exactly two children: `<head>` (information about the page) and `<body>` (what you see). Put `<!doctype html>` on the line before it so the browser uses modern "standards mode". The `lang` attribute here sets the language for the whole page.',
      java: 'The root node of the tree, like `document.getDocumentElement()` in Java\'s `org.w3c.dom` API.',
      attributes: [
        { name: 'lang', kind: 'enum', values: LANG, unset: 'Not set: screen readers and translators have to guess the language.', desc: 'The language of the whole page. Always set it: screen readers, translation tools and search engines rely on it.' },
        { name: 'dir', kind: 'enum', values: DIR, desc: 'Text direction for the whole page.' }
      ],
      start: { lang: 'en' },
      contentKind: 'none',
      demo: '<!doctype html>\n<html{{attrs}}>\n<head>\n  <title>Demo</title>\n</head>\n<body>\n  <h1>Hello!</h1>\n  <p>This page follows the language and direction set on &lt;html&gt;. Try dir="rtl".</p>\n  <p>مرحبا بالعالم - Arabic text reads right to left.</p>\n</body>\n</html>',
      tips: ['Every page starts from the same skeleton: `<!doctype html>`, `<html lang="en">`, a `<head>` with `<meta charset="utf-8">` and a `<title>`, then `<body>`. Lesson 1 builds it.'],
      mistakes: ['Leaving out `<!doctype html>`. The browser then uses "quirks mode", where box sizes and tables behave like browsers from the 1990s.'],
      related: ['head', 'body', 'meta', 'title', 'lesson:html-skeleton'],
      keywords: ['root', 'document', 'doctype', 'skeleton', 'language', 'rtl']
    },
    {
      tag: 'head', category: 'Document', display: 'none', short: 'information about the page',
      summary: 'A container for information *about* the page: its title, character set, styles and scripts. Nothing in it is drawn on the page.',
      description: '`<head>` is the first child of `<html>`. It holds the `<title>`, `<meta>` tags, `<link>`s to stylesheets and icons, and sometimes `<style>` and `<script>`. Browsers read it before showing the page, so put the stylesheet here, not later.',
      java: 'Like the metadata of a class (annotations, imports) as opposed to its behaviour: it configures how the body is handled but is not part of the output.',
      attributes: [],
      contentKind: 'none',
      demo: mock('My page', 'file:///my-page.html', '<p class="note">Nothing inside &lt;head&gt; is drawn here. The &lt;title&gt; went to the tab above; the stylesheet would style this area; the meta tags configure the browser.</p>'),
      code: '<!doctype html>\n<html lang="en">\n<head{{attrs}}>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>My page</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  ...\n</body>\n</html>',
      demoCss: MOCK_CSS,
      tips: ['The minimum useful head: `<meta charset="utf-8">`, the viewport `<meta>`, and a `<title>`.'],
      related: ['title', 'meta', 'link', 'style', 'script'],
      keywords: ['metadata', 'head section']
    },
    {
      tag: 'body', category: 'Document', display: 'block', short: 'everything you see',
      summary: 'Everything visible on the page lives inside `<body>`.',
      description: 'There is one `<body>` per page, right after `<head>`. Browsers give it an 8px margin by default, which is why pages without CSS have a thin gap around the edge. Styles set on body (font, colour) are inherited by everything inside it.',
      java: 'Think of it as the `main` content of the document tree - every visible node is a descendant of body.',
      attributes: [],
      content: '<h1>Everything you see lives in body</h1>\n  <p>Headings, text, images, forms… Try the global "style" attribute below, e.g. background: lightyellow.</p>',
      demo: '<!doctype html>\n<html lang="en">\n<head>\n  <title>Demo</title>\n</head>\n<body{{attrs}}>\n  {{content}}\n</body>\n</html>',
      tips: ['Set the page-wide font and colour on `body` in CSS; children inherit them.'],
      mistakes: ['Putting visible content in `<head>`. Browsers quietly move it into body, and the result is confusing.'],
      related: ['html', 'head', 'main', 'css:margin'],
      keywords: ['page body', 'visible']
    },
    {
      tag: 'title', category: 'Document', display: 'none', short: 'text in the browser tab',
      summary: 'The page title: shown in the browser tab, in bookmarks and as the headline of search results.',
      description: 'Goes inside `<head>`, one per page. It is plain text only. A good title says what this page is, then the site name: "Pricing - MySite". Screen readers announce it when the page opens.',
      attributes: [],
      content: 'My first page',
      contentKind: 'text',
      contentHelp: 'The title text. Change it and watch the tab.',
      demo: function (v, content) { return mock(U.esc(content), 'file:///my-page.html', '<p class="note">The text inside &lt;title&gt; appears in the tab above, in bookmarks, in history and as the blue headline in search results.</p>'); },
      code: '<head>\n  <title{{attrs}}>{{content}}</title>\n</head>',
      demoCss: MOCK_CSS,
      tips: ['Keep it under about 60 characters; search engines cut longer titles.'],
      mistakes: ['Using the same title on every page. Tabs and bookmarks then all look identical.'],
      related: ['head', 'meta', 'h1'],
      keywords: ['tab', 'page title', 'seo']
    },
    {
      tag: 'meta', category: 'Document', display: 'none', void: true,
      illustration: true, short: 'settings for the browser',
      summary: 'A setting about the page, given as a name and a value. Configures the browser and search engines.',
      description: 'Each `<meta>` says one thing. `charset` tells the browser how the text is encoded; `name` + `content` pairs set things like the mobile viewport, the description used by search engines, or the colour of the phone\'s browser bar. Pick a `name` below; the picture changes to show what it affects.',
      java: 'Like entries in a `.properties` file: a key (`name`) and a value (`content`) that the runtime (the browser) reads to configure itself.',
      attributes: [
        {
          name: 'charset', kind: 'enum', desc: 'The character encoding of the file. Always `utf-8`, and it must be the first thing in `<head>`.',
          unset: 'Not set: accented letters, ₹ or emoji may show up as garbage characters.',
          values: [{ value: 'utf-8', desc: 'Unicode: every language, symbol and emoji. The only value you should use.' }]
        },
        {
          name: 'name', kind: 'enum', desc: 'What this meta tag is about. Its value goes in `content`.',
          values: [
            { value: 'viewport', desc: 'How a phone should size the page. `width=device-width, initial-scale=1` makes the page as wide as the phone, so text is readable. Needed for every responsive page.' },
            { value: 'description', desc: 'A one or two sentence summary. Search engines often show it under your title in results.' },
            { value: 'author', desc: 'Who wrote the page.' },
            { value: 'theme-color', desc: 'Colour for the browser\'s address bar on phones (`content` is a colour).' },
            { value: 'robots', desc: 'Instructions for search-engine crawlers, e.g. `noindex` keeps the page out of results.' },
            { value: 'color-scheme', desc: 'Which colour schemes the page supports (`light dark`), so form controls and scrollbars match.' }
          ]
        },
        {
          name: 'content', kind: 'text', example: 'width=device-width, initial-scale=1', desc: 'The value for the chosen `name`.',
          suggestions: [
            { value: 'width=device-width, initial-scale=1', desc: 'for name="viewport"' },
            { value: 'Learn HTML and CSS with live examples.', desc: 'for name="description"' },
            { value: '#4353c9', desc: 'for name="theme-color"' },
            { value: 'noindex, nofollow', desc: 'for name="robots"' },
            { value: 'light dark', desc: 'for name="color-scheme"' }
          ]
        }
      ],
      start: { name: 'description', content: 'Learn HTML and CSS with live examples.' },
      demo: function (v) {
        var c = U.esc(v.content || '');
        if (v.name === 'viewport') {
          var on = /device-width/.test(v.content || '');
          return '<div class="phones">\n<div><div class="phone"><div style="width:400px;transform:scale(.37);transform-origin:0 0"><h2>My page</h2><p>Without a viewport tag the phone pretends to be 980px wide and shrinks everything.</p></div></div><p class="cap">Without the tag: tiny text</p></div>\n' +
            '<div><div class="phone"><h3 style="margin:6px">My page</h3><p>' + (on ? 'With width=device-width the page is as wide as the phone: readable.' : 'content does not say width=device-width yet.') + '</p></div><p class="cap">content="' + c + '"</p></div>\n</div>';
        }
        if (v.name === 'description') {
          return '<div class="serp"><cite>https://mysite.example › learn</cite><h3>My page - MySite</h3><p>' + (c || '<i>(no description: the search engine picks a random sentence)</i>') + '</p></div>\n<p class="note">A search result. The grey text comes from meta name="description".</p>';
        }
        if (v.name === 'theme-color') {
          return '<div class="phone"><div class="phone-bar" style="background:' + c + '"></div><p>The bar above takes the colour in content (' + (c || 'none') + ').</p></div>';
        }
        if (v.name === 'author') return mock('My page', 'file:///my-page.html', '<p class="note">Not shown on the page. Tools and some search engines read: author = <b>' + (c || '?') + '</b>.</p>');
        if (v.name === 'robots') return '<p class="note">Search-engine crawlers read this. <b>' + (c || '(empty)') + '</b><br>noindex = leave this page out of results; nofollow = do not follow its links; index, follow = the default.</p>';
        if (v.name === 'color-scheme') return '<p class="note">With content="light dark", form controls and scrollbars switch to dark when the user\'s device is dark.</p><input value="A text input"> <button>Button</button>';
        if (v.charset) return '<p style="font-size:20px">Héllo – café – ₹ 499 – 日本語 – ✓ 😀</p><p class="note">With charset="utf-8" every character shows correctly.</p>';
        return '<p class="note">Choose a name (or charset) to see what this meta tag affects.</p>';
      },
      code: '<head>\n  <meta{{attrs}}>\n</head>',
      demoCss: MOCK_CSS,
      tips: ['Two meta tags belong in every page: `<meta charset="utf-8">` and `<meta name="viewport" content="width=device-width, initial-scale=1">`.'],
      mistakes: ['Forgetting the viewport tag, then wondering why media queries do nothing on a real phone.'],
      related: ['head', 'title', 'link', 'css:font-size', 'lesson:css-responsive'],
      keywords: ['viewport', 'charset', 'utf-8', 'description', 'seo', 'theme-color', 'responsive']
    },
    {
      tag: 'link', category: 'Document', display: 'none', void: true,
      illustration: true, short: 'connect a stylesheet or icon',
      summary: 'Connects the page to another file: most often a CSS stylesheet or the tab icon.',
      description: '`rel` says what the relationship is and `href` says where the file is. `<link rel="stylesheet" href="styles.css">` is how almost every site loads its CSS. It lives in `<head>`.',
      java: 'A bit like an `import`: it pulls an external resource into the page, and `rel` says what kind of resource it is.',
      attributes: [
        {
          name: 'rel', kind: 'enum', required: true, desc: 'The relationship between this page and the linked file.',
          values: [
            { value: 'stylesheet', desc: 'A CSS file that styles this page. By far the most common use.' },
            { value: 'icon', desc: 'The small picture in the browser tab (the "favicon").' },
            { value: 'preconnect', desc: 'Start connecting to another server early (e.g. a font host), so its files arrive sooner.' },
            { value: 'preload', desc: 'Download a file the page will certainly need soon, before the browser discovers it. Needs `as`.' },
            { value: 'canonical', desc: 'Tells search engines which URL is the main copy of this page, when the same page has several URLs.' },
            { value: 'alternate', desc: 'Another version of the page: another language (with `hreflang`), or an RSS feed.' },
            { value: 'manifest', desc: 'A web app manifest (JSON): lets the site be installed like an app on a phone.' }
          ]
        },
        {
          name: 'href', kind: 'text', example: 'styles.css', desc: 'Where the file is: a path relative to this page (`styles.css`, `css/site.css`) or a full URL.',
          suggestions: ['styles.css', 'favicon.svg', 'https://fonts.gstatic.com', 'https://mysite.example/pricing']
        },
        {
          name: 'media', kind: 'enum', desc: 'Only use this stylesheet when the condition is true. The file is still downloaded.',
          values: [
            { value: 'all', desc: 'Every device. Same as leaving it out.' },
            { value: 'screen', desc: 'Screens only.' },
            { value: 'print', desc: 'Only when printing: a print stylesheet that hides menus and uses black text.' },
            { value: '(max-width: 600px)', desc: 'Only on screens 600px wide or narrower (a media query).' }
          ]
        },
        {
          name: 'as', kind: 'enum', desc: 'With `rel="preload"`: what kind of file is being preloaded.',
          values: [
            { value: 'style', desc: 'A stylesheet.' },
            { value: 'script', desc: 'A JavaScript file.' },
            { value: 'font', desc: 'A web font (also needs `crossorigin`).' },
            { value: 'image', desc: 'An image.' }
          ]
        }
      ],
      start: { rel: 'stylesheet', href: 'styles.css' },
      demo: function (v) {
        var href = U.esc(v.href || '');
        if (v.rel === 'stylesheet') {
          var styled = !v.media || v.media === 'all' || v.media === 'screen';
          return '<div class="phones"><div style="flex:1;min-width:200px"><p class="note">Without ' + (href || 'the stylesheet') + ':</p><div style="font-family:serif;border:1px solid #ccc;padding:8px"><h3 style="margin:0">Welcome</h3><p style="margin:4px 0">Plain browser defaults.</p><a href="#">Sign up</a></div></div>' +
            '<div style="flex:1;min-width:200px"><p class="note">With it' + (v.media ? ' (media="' + U.esc(v.media) + '")' : '') + ':</p>' +
            (styled ? '<div style="border-radius:12px;padding:12px;background:#4353c9;color:#fff"><h3 style="margin:0">Welcome</h3><p style="margin:4px 0;opacity:.9">Styled by the CSS file.</p><a href="#" style="display:inline-block;background:#fff;color:#4353c9;padding:4px 10px;border-radius:6px;text-decoration:none">Sign up</a></div>'
              : '<div style="font-family:serif;border:1px solid #ccc;padding:8px"><h3 style="margin:0">Welcome</h3><p style="margin:4px 0">The media condition is false on this screen, so the styles are not applied.</p></div>') +
            '</div></div>';
        }
        if (v.rel === 'icon') return mock('My page', 'file:///my-page.html', '<p class="note">rel="icon" puts ' + (href || 'an image') + ' in the tab, next to the title (the coloured square).</p>', '#ff7a1a');
        if (v.rel === 'preconnect' || v.rel === 'preload') {
          return '<p class="note">Loading timeline, simplified:</p><div style="font:12px monospace">' +
            '<div>without: <span style="display:inline-block;width:120px;background:#ddd">connect</span><span style="display:inline-block;width:90px;background:#9ab">download</span></div>' +
            '<div>with ' + v.rel + ': <span style="display:inline-block;width:40px;background:#cfe">early</span><span style="display:inline-block;width:90px;background:#9ab">download</span></div></div>' +
            '<p class="note">The browser starts work on ' + (href || 'the file') + ' sooner, so it is ready when needed.</p>';
        }
        return '<p class="note">rel="' + U.esc(v.rel || '') + '" is read by browsers, search engines or the operating system; it does not change what you see on the page. href: ' + (href || '(none)') + '</p>';
      },
      code: '<head>\n  <link{{attrs}}>\n</head>',
      demoCss: MOCK_CSS,
      tips: ['Put stylesheet links in `<head>` so the page never shows unstyled.'],
      mistakes: ['Writing `<link href="styles.css">` without `rel="stylesheet"`: the file is ignored.', 'Using `<link>` for JavaScript. Scripts use `<script src="...">`.'],
      related: ['style', 'script', 'head', 'a'],
      keywords: ['stylesheet', 'css file', 'favicon', 'icon', 'preload', 'import css']
    },
    {
      tag: 'style', category: 'Document', display: 'none', short: 'CSS written inside the page',
      summary: 'CSS written directly inside the HTML file.',
      description: 'Everything between `<style>` and `</style>` is CSS that applies to the whole page. Handy for single-file pages and experiments (like this tool\'s Playground). Larger sites put CSS in separate files and connect them with `<link rel="stylesheet">` so many pages share one file.',
      attributes: [
        {
          name: 'media', kind: 'enum', desc: 'Only apply these styles when the condition is true.',
          values: [
            { value: 'all', desc: 'Always (the default).' },
            { value: 'screen', desc: 'On screens.' },
            { value: 'print', desc: 'Only when printing. In the preview the styles disappear, because the preview is a screen.' },
            { value: '(max-width: 600px)', desc: 'Only when the page is 600px wide or narrower. Drag the preview\'s corner to make it narrower.' },
            { value: '(prefers-color-scheme: dark)', desc: 'Only when the device is set to dark mode.' }
          ]
        }
      ],
      content: 'h1 { color: tomato; }\n.note { background: #fff3c4; padding: 8px; border-radius: 6px; }',
      contentKind: 'css',
      contentHelp: 'CSS rules. Edit them and the preview restyles as you type.',
      demo: '<style{{attrs}}>\n{{content}}\n</style>\n<h1>A styled heading</h1>\n<p class="note">This paragraph has class="note".</p>',
      tips: ['`<style>` can be in `<head>` or `<body>`, but `<head>` keeps things tidy and avoids a flash of unstyled content.'],
      related: ['link', 'head', 'lesson:css-attach'],
      keywords: ['css', 'internal stylesheet', 'embedded css']
    },
    {
      tag: 'script', category: 'Document', display: 'none', short: 'run JavaScript',
      summary: 'Runs JavaScript: either written between the tags, or loaded from a file with `src`.',
      description: 'The browser runs the script when it reaches the tag while reading the page. That is why scripts usually go at the end of `<body>` (or use `defer`): by then the elements they look for exist. Type in the content box to change the code.',
      java: 'Like a `main` method that the browser calls as soon as it reads the tag. `type="module"` is closer to Java packages: the file can `import` and `export`.',
      attributes: [
        {
          name: 'type', kind: 'enum', desc: 'What kind of script this is. Leave it out for normal JavaScript.',
          values: [
            { value: 'module', desc: 'A JavaScript module: may use `import`/`export`, runs in strict mode, and waits until the page is parsed (like `defer`).' },
            { value: 'text/javascript', desc: 'Plain JavaScript, spelled out. Same as leaving `type` out; no need to write it.' },
            { value: 'application/json', desc: 'Not code: a block of JSON data for your scripts to read. The browser does not run it - notice the paragraph keeps saying "Waiting".' }
          ]
        },
        { name: 'src', kind: 'text', example: 'app.js', desc: 'Load the code from a file instead. When `src` is set, any code between the tags is ignored. (The preview has no app.js, so it reports that the file could not load.)' },
        { name: 'defer', kind: 'boolean', desc: 'For files with `src`: download in the background and run after the page is parsed, in order. The best default for scripts in `<head>`. Has no effect on code written between the tags.' },
        { name: 'async', kind: 'boolean', desc: 'For files with `src`: download in the background and run as soon as downloaded, in any order. For independent scripts like analytics.' }
      ],
      content: "document.getElementById('out').textContent =\n  'Hello from JavaScript! Time: ' + new Date().toLocaleTimeString();",
      contentKind: 'js',
      contentHelp: 'JavaScript code. It runs when the preview reloads.',
      demo: '<p id="out">Waiting for the script…</p>\n<script{{attrs}}>\n{{content}}\n</script>',
      tips: ['Load scripts with `<script src="app.js" defer></script>` in `<head>`; it is fast and the elements exist when it runs.'],
      mistakes: ['A script in `<head>` without `defer` that looks for an element: `getElementById` returns `null` because the body has not been read yet.', 'Writing `<script src="app.js" />`. Script tags are never self-closing; always write `</script>`.'],
      related: ['js:select', 'js:events', 'lesson:js-basics'],
      keywords: ['javascript', 'js', 'defer', 'async', 'module', 'code']
    },

    /* ---------- Sections ---------- */
    {
      tag: 'header', category: 'Sections', display: 'block', short: 'top of the page or a section',
      summary: 'The introductory part of a page or section: usually the logo, site name and main menu.',
      description: 'A page usually has one `<header>` at the top. An `<article>` can have its own header with its title and date. It looks like a `<div>` but tells browsers, search engines and screen readers what this part is ("banner").',
      java: 'Like naming a class for its role instead of calling everything `Object`: `<header>` and `<div>` behave the same, but one says what it is for.',
      attributes: [],
      content: '\n  <strong>MySite</strong>\n  <nav><a href="#">Home</a> · <a href="#">Blog</a></nav>\n',
      demo: page('header'), demoCss: pageCss('header'),
      tips: ['Semantic elements like this one look exactly like `<div>`. Their value is meaning: screen-reader users can jump straight to them.'],
      related: ['nav', 'main', 'footer', 'h1', 'lesson:html-semantic'],
      keywords: ['banner', 'top', 'semantic', 'landmark', 'logo']
    },
    {
      tag: 'nav', category: 'Sections', display: 'block', short: 'main navigation links',
      summary: 'A block of major navigation links: the site menu, a table of contents, breadcrumbs.',
      description: 'Use `<nav>` for the important link groups only, not for every link. Screen readers list nav regions so users can jump to the menu. Menus are commonly written as a `<ul>` of links inside `<nav>`.',
      attributes: [],
      content: '<a href="#">Home</a> · <a href="#">Blog</a> · <a href="#">About</a>',
      demo: page('nav'), demoCss: pageCss('nav'),
      tips: ['If a page has several navs, give each an `aria-label`, e.g. `aria-label="Main"` and `aria-label="Footer"`.'],
      related: ['header', 'a', 'ul', 'css:display', 'css:gap'],
      keywords: ['menu', 'navigation', 'navbar', 'links', 'semantic', 'landmark']
    },
    {
      tag: 'main', category: 'Sections', display: 'block', short: 'the page\'s main content',
      summary: 'The main content of the page: what is unique to this page, not repeated on every page.',
      description: 'Only one visible `<main>` per page. Headers, menus and footers that repeat across pages go outside it. Screen readers offer a "skip to main content" jump that lands here.',
      attributes: [],
      content: '\n  <article><h2>Article title</h2><p>The unique content of this page.</p></article>\n  <aside>Related links</aside>\n',
      demo: page('main'), demoCss: pageCss('main'),
      mistakes: ['Putting `<main>` inside `<article>` or `<header>`. It belongs directly in `<body>` (or a plain wrapper div).'],
      related: ['header', 'footer', 'article', 'section'],
      keywords: ['content', 'semantic', 'landmark', 'main content']
    },
    {
      tag: 'section', category: 'Sections', display: 'block', short: 'a themed part with a heading',
      summary: 'A thematic part of a page or article, normally with its own heading.',
      description: 'Use it to split content into chapters: "Features", "Pricing", "FAQ". If you only need a box for styling, use `<div>` instead; a section should make sense in an outline of the page.',
      attributes: [],
      content: '<h3>A section</h3><p>One part of the article, with its own heading.</p>',
      demo: page('section'), demoCss: pageCss('section'),
      tips: ['Rule of thumb: if you cannot think of a heading for it, it is a `<div>`, not a `<section>`.'],
      related: ['article', 'div', 'h1'],
      keywords: ['chapter', 'part', 'semantic']
    },
    {
      tag: 'article', category: 'Sections', display: 'block', short: 'self-contained content',
      summary: 'Self-contained content that would make sense on its own: a blog post, a news story, a product card, a comment.',
      description: 'Test: could you copy it into another site or an RSS feed and it still make sense? Then it is an article. Articles can be nested (comments inside a post) and can have their own header and footer.',
      attributes: [],
      content: '\n    <h2>Article title</h2>\n    <p>A blog post, a news story or a comment: it makes sense on its own.</p>\n  ',
      demo: page('article'), demoCss: pageCss('article'),
      related: ['section', 'aside', 'header', 'time'],
      keywords: ['post', 'blog', 'card', 'semantic']
    },
    {
      tag: 'aside', category: 'Sections', display: 'block', short: 'related side content',
      summary: 'Content related to the main content but not part of its flow: a sidebar, a tip box, related links.',
      description: 'If you removed the aside, the main text would still make sense. It is often shown as a sidebar, but that is only CSS; in HTML it simply means "secondary".',
      attributes: [],
      content: 'Related links',
      demo: page('aside'), demoCss: pageCss('aside'),
      related: ['article', 'main', 'css:flex'],
      keywords: ['sidebar', 'related', 'semantic', 'complementary']
    },
    {
      tag: 'footer', category: 'Sections', display: 'block', short: 'bottom of a page or section',
      summary: 'The closing part of a page or section: copyright, contact links, author, related pages.',
      description: 'Like `<header>`, it can belong to the whole page or to one article (e.g. the author and tags at the end of a post).',
      attributes: [],
      content: '© 2026 MySite · <a href="#">Contact</a>',
      demo: page('footer'), demoCss: pageCss('footer'),
      related: ['header', 'address', 'small'],
      keywords: ['bottom', 'copyright', 'semantic', 'contentinfo']
    },
    {
      tag: 'h1', title: 'h1 – h6', category: 'Sections', display: 'block', short: 'headings, levels 1 to 6',
      summary: 'Headings, from `<h1>` (most important) to `<h6>` (least). They give the page its outline.',
      description: 'Use one `<h1>` for the page\'s main title, `<h2>` for its sections, `<h3>` for sub-sections, and so on, without skipping levels. Choose the level by *importance*, never by size: the size is CSS\'s job. Screen-reader users navigate pages by jumping between headings.',
      java: 'Like a table of contents numbering 1, 1.1, 1.1.1: the level says where the heading sits in the outline.',
      variant: {
        label: 'level', desc: 'Pick the heading level; the tag changes.',
        values: [
          { value: 'h1', desc: 'Level 1: the page title. Usually one per page.' },
          { value: 'h2', desc: 'Level 2: a main section.' },
          { value: 'h3', desc: 'Level 3: a sub-section of an h2.' },
          { value: 'h4', desc: 'Level 4: a sub-section of an h3.' },
          { value: 'h5', desc: 'Level 5: rarely needed.' },
          { value: 'h6', desc: 'Level 6: the smallest; rarely needed.' }
        ]
      },
      attributes: [],
      content: 'A heading',
      demo: '<{{variant}}{{attrs}}>{{content}}</{{variant}}>\n<p>Normal paragraph text, for comparison.</p>',
      mdnTag: 'Heading_Elements',
      tips: ['Want a small h2? Keep the `<h2>` and change its `font-size` in CSS.'],
      mistakes: ['Picking `<h4>` because it "looks the right size". It breaks the outline for screen readers and search engines.'],
      related: ['p', 'section', 'title', 'css:font-size', 'css:font-weight'],
      keywords: ['heading', 'h2', 'h3', 'h4', 'h5', 'h6', 'title', 'headline']
    },
    {
      tag: 'div', category: 'Sections', display: 'block', short: 'generic block box',
      summary: 'A generic box with no meaning of its own. Used to group things for styling or layout.',
      description: 'A `<div>` starts on a new line and takes the full width. It is the building block of layouts: wrap elements in a div, give it a class, and style it. Prefer a semantic element (`<header>`, `<section>`, `<nav>`…) when one fits.',
      java: 'Like a plain `JPanel` in Swing: a container whose only job is to hold and arrange other components.',
      attributes: [],
      start: { class: 'box' },
      content: 'A div is a plain box. It takes the full width.',
      demo: '<div{{attrs}}>{{content}}</div>\n<div>A second div starts on a new line.</div>',
      demoCss: 'div { border: 2px dashed #4f6fd8; background: #eef3ff; padding: 8px; margin: 4px 0; }',
      tips: ['Give divs a meaningful class: `<div class="card">` reads much better than a bare `<div>`.'],
      mistakes: ['"Div soup": using divs for everything, including buttons and headings. A div is not keyboard-focusable and has no meaning for screen readers.'],
      related: ['span', 'section', 'css:display', 'css:flex-direction'],
      keywords: ['container', 'box', 'wrapper', 'block', 'group', 'division']
    },
    {
      tag: 'span', category: 'Sections', display: 'inline', short: 'generic inline wrapper',
      summary: 'A generic inline wrapper: marks a piece of text inside a line, for styling or scripting.',
      description: 'The inline partner of `<div>`. It does not start a new line and is only as wide as its content. Use it to colour a word, or to give JavaScript a handle on a bit of text (`<span id="count">3</span>`).',
      attributes: [],
      content: 'a span',
      demo: '<p>Some text with <span{{attrs}}>{{content}}</span> in the middle of the sentence.</p>',
      demoCss: 'span { background: #ffe7c2; outline: 2px dashed #d98c3f; }',
      mistakes: ['Trying to set `width` or `margin-top` on a span: inline elements ignore them. Use `display: inline-block` if you need a box.'],
      related: ['div', 'strong', 'em', 'mark', 'css:display'],
      keywords: ['inline', 'wrapper', 'text', 'highlight word']
    },
    {
      tag: 'address', category: 'Sections', display: 'block', short: 'contact information',
      summary: 'Contact information for the page or article author: email, phone, postal address, social links.',
      description: 'Browsers show it in italics by default. Despite its name it is not for any postal address in the text, only for "how to contact the people responsible for this content".',
      attributes: [],
      content: 'Written by <a href="mailto:ravi@example.com">Ravi</a>.<br>\n  Bengaluru, India',
      demo: '<footer>\n  <address{{attrs}}>\n  {{content}}\n  </address>\n</footer>',
      related: ['footer', 'a'],
      keywords: ['contact', 'email', 'author']
    }
  );

  U.data.mockCss = MOCK_CSS;
})(window.UILT);
