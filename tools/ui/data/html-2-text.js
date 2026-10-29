/*
 * HTML elements, part 2: text. Paragraphs, line breaks, emphasis, code, quotes, dates and edits.
 * Entry shape: see html-1-document.js.
 */
(function (U) {
  var E = U.data.htmlElements = U.data.htmlElements || [];

  E.push(
    {
      tag: 'p', category: 'Text', display: 'block', short: 'paragraph',
      summary: 'A paragraph of text.',
      description: 'The most common text element. Browsers add space above and below each paragraph (a margin of 1em) and wrap the lines to fit. Line breaks and extra spaces you type in the HTML are collapsed into single spaces - see the demo.',
      java: 'Whitespace in HTML text behaves like whitespace in Java source code: newlines and runs of spaces carry no meaning, except inside `<pre>` (which is like a Java text block).',
      attributes: [],
      content: 'This is a paragraph.   These extra spaces\n  and this line break   are collapsed into single spaces.',
      demo: '<p{{attrs}}>{{content}}</p>\n<p>A second paragraph, with the default gap above it.</p>',
      tips: ['Need a gap? Do not stack empty paragraphs or `<br>`s; set `margin` in CSS.'],
      mistakes: ['Putting a `<div>` or a list inside a `<p>`. A paragraph can only contain inline content; the browser closes the `<p>` early.'],
      related: ['br', 'pre', 'span', 'css:margin', 'css:line-height'],
      keywords: ['paragraph', 'text', 'whitespace']
    },
    {
      tag: 'br', category: 'Text', display: 'inline', void: true, short: 'line break',
      summary: 'A line break inside text, where the line break is part of the content: poems, addresses.',
      description: '`<br>` ends the current line and continues on the next, without starting a new paragraph. It is a void element: no content, no closing tag.',
      attributes: [],
      demo: '<p>\n  Roses are red,<br{{attrs}}>\n  violets are blue,<br>\n  HTML is easy<br>\n  and so is CSS too.\n</p>',
      mistakes: ['Using several `<br><br>` to make space between blocks. Use separate paragraphs and CSS `margin`.'],
      related: ['p', 'pre', 'css:white-space'],
      keywords: ['line break', 'new line', 'newline']
    },
    {
      tag: 'hr', category: 'Text', display: 'block', void: true, short: 'thematic break',
      summary: 'A thematic break: a change of topic between paragraphs. Drawn as a horizontal line.',
      description: 'Its meaning is "a new topic starts here"; the line is just the default look. Restyle it with CSS (`border`, `height`, `background`).',
      attributes: [],
      demo: '<p>The end of one topic.</p>\n<hr{{attrs}}>\n<p>A new topic starts here.</p>',
      tips: ['Try the global `style` attribute with `border: 0; border-top: 3px dotted tomato`.'],
      related: ['p', 'section', 'css:border'],
      keywords: ['horizontal rule', 'line', 'divider', 'separator']
    },
    {
      tag: 'strong', category: 'Text', display: 'inline', short: 'important text',
      summary: 'Strong importance: text the reader must not miss, such as warnings. Bold by default.',
      description: 'Use it for meaning ("this is important"), not for looks. Screen readers may say it with emphasis. If you only want bold text for style, use CSS `font-weight` or `<b>`.',
      attributes: [],
      content: 'Do not touch',
      demo: '<p>Warning: <strong{{attrs}}>{{content}}</strong> - the oven is hot.</p>',
      related: ['b', 'em', 'mark', 'css:font-weight'],
      keywords: ['bold', 'important', 'emphasis', 'warning']
    },
    {
      tag: 'em', category: 'Text', display: 'inline', short: 'stressed emphasis',
      summary: 'Stress emphasis: the word you would say louder. Italic by default.',
      description: 'Moving `<em>` changes the meaning of a sentence: "*I* did not say that" versus "I did not say *that*". For italics without stress (a book title, a foreign word), use `<i>` or `<cite>`.',
      attributes: [],
      content: 'really',
      demo: '<p>I <em{{attrs}}>{{content}}</em> want to learn CSS.</p>',
      related: ['i', 'strong', 'css:font-style'],
      keywords: ['italic', 'emphasis', 'stress']
    },
    {
      tag: 'b', category: 'Text', display: 'inline', short: 'bold, without importance',
      summary: 'Draws attention without adding importance: keywords, product names, the lead words of a summary. Bold by default.',
      description: 'Historically just "bold". Today it means "stylistically offset" text. When the text really is important, use `<strong>` instead.',
      attributes: [],
      content: 'Spring Boot',
      demo: '<p>This course uses <b{{attrs}}>{{content}}</b> for the backend.</p>',
      related: ['strong', 'i', 'css:font-weight'],
      keywords: ['bold', 'keyword']
    },
    {
      tag: 'i', category: 'Text', display: 'inline', short: 'alternate voice',
      summary: 'Text in an alternate voice: technical terms, foreign words, thoughts, ship names. Italic by default.',
      description: 'Not stressed (that is `<em>`), just "different from the surrounding text". Add `lang` for foreign words so screen readers pronounce them correctly.',
      attributes: [],
      start: { lang: 'fr' },
      content: 'déjà vu',
      demo: '<p>I had a strange feeling of <i{{attrs}}>{{content}}</i> this morning.</p>',
      related: ['em', 'b', 'css:font-style'],
      keywords: ['italic', 'foreign word', 'term']
    },
    {
      tag: 'u', category: 'Text', display: 'inline', short: 'annotation (underline)',
      summary: 'An unarticulated annotation: typically marks a spelling mistake. Underlined by default.',
      description: 'Rarely the right choice. On the web an underline usually means "link", so underlined plain text confuses readers. Use CSS `text-decoration` for decorative underlines.',
      attributes: [],
      content: 'speling',
      demo: '<p>The word <u{{attrs}}>{{content}}</u> is misspelled.</p>',
      demoCss: 'u { text-decoration: underline wavy red; }',
      related: ['mark', 'css:text-decoration'],
      keywords: ['underline', 'spelling', 'annotation']
    },
    {
      tag: 'mark', category: 'Text', display: 'inline', short: 'highlighted',
      summary: 'Highlighted text, like a highlighter pen: marks text relevant to what the user is doing, such as search matches.',
      description: 'Yellow background by default. Typical use: highlighting the words that matched a search.',
      attributes: [],
      content: 'flexbox',
      demo: '<p>Results for "flexbox": Learn <mark{{attrs}}>{{content}}</mark> in 10 minutes with live examples.</p>',
      related: ['strong', 'css:background-color'],
      keywords: ['highlight', 'search result', 'yellow']
    },
    {
      tag: 'small', category: 'Text', display: 'inline', short: 'side comment, fine print',
      summary: 'Side comments and fine print: copyright, legal text, "prices include tax". Smaller by default.',
      description: 'It means "less important aside", not just "small font". For simply smaller text use CSS `font-size`.',
      attributes: [],
      content: 'Prices include GST.',
      demo: '<p>Pro plan: ₹499 / month <small{{attrs}}>{{content}}</small></p>',
      related: ['footer', 'css:font-size'],
      keywords: ['fine print', 'small text', 'copyright']
    },
    {
      tag: 'sub', category: 'Text', display: 'inline', short: 'subscript',
      summary: 'Subscript: lowered, smaller text, as in chemical formulas (H₂O).',
      description: 'Use it where typography requires it, not to make text small.',
      attributes: [],
      content: '2',
      demo: '<p>Water is H<sub{{attrs}}>{{content}}</sub>O.</p>',
      related: ['sup'],
      keywords: ['subscript', 'chemistry', 'formula']
    },
    {
      tag: 'sup', category: 'Text', display: 'inline', short: 'superscript',
      summary: 'Superscript: raised, smaller text, as in powers (x²) and footnote markers.',
      description: 'Also used for ordinals in some languages (1<sup>st</sup>).',
      attributes: [],
      content: '2',
      demo: '<p>The area is πr<sup{{attrs}}>{{content}}</sup>.</p>',
      related: ['sub'],
      keywords: ['superscript', 'power', 'exponent', 'footnote']
    },
    {
      tag: 'code', category: 'Text', display: 'inline', short: 'a piece of code',
      summary: 'A fragment of computer code inside text: a variable, a function name, a command. Monospace by default.',
      description: 'For whole blocks of code, wrap it in `<pre>`: `<pre><code>…</code></pre>`. Remember to write `<` as `&lt;` inside code so the browser does not read it as a tag.',
      java: 'The same as `{@code …}` in Javadoc.',
      attributes: [],
      content: 'System.out.println()',
      demo: '<p>In Java you print with <code{{attrs}}>{{content}}</code>; in JavaScript with <code>console.log()</code>.</p>',
      demoCss: 'code { background: #f0f2f8; padding: 1px 4px; border-radius: 4px; }',
      related: ['pre', 'kbd', 'css:font-family'],
      keywords: ['code', 'monospace', 'inline code', 'snippet']
    },
    {
      tag: 'pre', category: 'Text', display: 'block', short: 'preformatted text',
      summary: 'Preformatted text: spaces and line breaks are kept exactly as typed. Monospace by default.',
      description: 'Normally HTML collapses whitespace; inside `<pre>` it does not. Use it for code blocks, ASCII art and terminal output. Long lines do not wrap, so the box may scroll sideways.',
      java: 'Like a Java text block (`"""`): what you type is what you get, indentation included.',
      attributes: [],
      content: 'public class Hello {\n    public static void main(String[] args) {\n        System.out.println("Hi");\n    }\n}',
      demo: '<pre{{attrs}}>{{content}}</pre>',
      demoCss: 'pre { background: #f0f2f8; padding: 10px; border-radius: 6px; }',
      related: ['code', 'p', 'css:white-space', 'css:overflow'],
      keywords: ['preformatted', 'code block', 'whitespace', 'monospace']
    },
    {
      tag: 'kbd', category: 'Text', display: 'inline', short: 'keyboard keys',
      summary: 'Keyboard input: keys the user should press. Monospace by default.',
      description: 'Combine for shortcuts: `<kbd>Ctrl</kbd> + <kbd>C</kbd>`. Usually styled to look like a key.',
      attributes: [],
      content: 'Ctrl',
      demo: '<p>Copy with <kbd{{attrs}}>{{content}}</kbd> + <kbd>C</kbd>.</p>',
      demoCss: 'kbd { border: 1px solid #b9bfd0; border-bottom-width: 3px; border-radius: 5px; padding: 1px 6px; background: #fff; }',
      related: ['code'],
      keywords: ['keyboard', 'shortcut', 'key']
    },
    {
      tag: 'blockquote', category: 'Text', display: 'block', short: 'long quotation',
      summary: 'A long quotation from another source, set apart as its own block. Indented by default.',
      description: 'For short quotes inside a sentence use `<q>`. Put the person\'s name or the source in a `<figcaption>` or `<cite>` outside the blockquote.',
      attributes: [
        { name: 'cite', kind: 'text', example: 'https://example.com/interview', desc: 'URL of the source. Not shown on the page; it is there for tools and search engines.' }
      ],
      content: '\n  <p>Programs must be written for people to read, and only incidentally for machines to execute.</p>\n',
      demo: '<blockquote{{attrs}}>{{content}}</blockquote>\n<p>- Harold Abelson</p>',
      demoCss: 'blockquote { border-left: 4px solid #4353c9; padding-left: 12px; color: #4d5568; }',
      related: ['q', 'figure'],
      keywords: ['quote', 'quotation', 'citation']
    },
    {
      tag: 'q', category: 'Text', display: 'inline', short: 'short quotation',
      summary: 'A short quotation inside a sentence. The browser adds the quotation marks for you.',
      description: 'The quote marks follow the language: with `lang="fr"` you get « guillemets ». Do not type your own quotes as well.',
      attributes: [
        { name: 'cite', kind: 'text', example: 'https://example.com/source', desc: 'URL of the source (not shown).' }
      ],
      content: 'Simplicity is prerequisite for reliability',
      demo: '<p>Dijkstra wrote <q{{attrs}}>{{content}}</q> in 1975.</p>',
      tips: ['Try the global `lang` attribute: `fr` and `ja` change the quote characters.'],
      related: ['blockquote'],
      keywords: ['quote', 'quotation marks', 'inline quote']
    },
    {
      tag: 'abbr', category: 'Text', display: 'inline', short: 'abbreviation',
      summary: 'An abbreviation or acronym. Put the full form in `title`: hovering shows it.',
      description: 'Many browsers draw a dotted underline when `title` is set, hinting that there is more information.',
      attributes: [
        { name: 'title', kind: 'text', example: 'HyperText Markup Language', desc: 'The full expansion, shown as a tooltip.' }
      ],
      start: { title: 'Cascading Style Sheets' },
      content: 'CSS',
      demo: '<p><abbr{{attrs}}>{{content}}</abbr> controls how a page looks. Hover the abbreviation.</p>',
      related: ['span', 'time'],
      keywords: ['abbreviation', 'acronym', 'tooltip']
    },
    {
      tag: 'time', category: 'Text', display: 'inline', short: 'date or time',
      summary: 'A date, time or duration, with a machine-readable version in `datetime`.',
      description: 'People read "next Friday"; software (calendars, search engines) reads `datetime="2026-10-09"`. It looks like plain text.',
      attributes: [
        {
          name: 'datetime', kind: 'text', example: '2026-10-09', desc: 'The precise value in a standard format.',
          suggestions: [
            { value: '2026-10-09', desc: 'a date: YYYY-MM-DD' },
            { value: '2026-10-09T18:30', desc: 'date and local time' },
            { value: '2026-10-09T18:30+05:30', desc: 'with a time-zone offset (IST)' },
            { value: '18:30', desc: 'a time of day' },
            { value: '2026-10', desc: 'a month' },
            { value: 'PT2H30M', desc: 'a duration: 2 hours 30 minutes' }
          ]
        }
      ],
      start: { datetime: '2026-10-09T18:30+05:30' },
      content: 'next Friday at 6:30 pm',
      demo: '<p>The meetup is <time{{attrs}}>{{content}}</time>.</p>',
      related: ['article'],
      keywords: ['date', 'time', 'datetime', 'duration']
    },
    {
      tag: 'del', category: 'Text', display: 'inline', short: 'deleted text',
      summary: 'Text that has been removed from the document. Struck through by default.',
      description: 'Pairs with `<ins>` to show edits, like a diff or a changed price.',
      attributes: [
        { name: 'datetime', kind: 'text', example: '2026-10-01', desc: 'When it was deleted.' },
        { name: 'cite', kind: 'text', example: 'https://example.com/changelog', desc: 'URL explaining the change.' }
      ],
      content: '₹999',
      demo: '<p>Price: <del{{attrs}}>{{content}}</del> <ins>₹499</ins></p>',
      related: ['ins', 'css:text-decoration'],
      keywords: ['strikethrough', 'deleted', 'diff', 'removed']
    },
    {
      tag: 'ins', category: 'Text', display: 'inline', short: 'inserted text',
      summary: 'Text that has been added to the document. Underlined by default.',
      description: 'The partner of `<del>`.',
      attributes: [
        { name: 'datetime', kind: 'text', example: '2026-10-01', desc: 'When it was added.' },
        { name: 'cite', kind: 'text', example: 'https://example.com/changelog', desc: 'URL explaining the change.' }
      ],
      content: '₹499',
      demo: '<p>Price: <del>₹999</del> <ins{{attrs}}>{{content}}</ins></p>',
      related: ['del'],
      keywords: ['inserted', 'added', 'diff']
    }
  );
})(window.UILT);
