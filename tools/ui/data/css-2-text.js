/*
 * CSS properties, part 2: text and fonts.
 * Entry shape: see css-0-shared.js. Most text properties are inherited: set them once on a parent.
 */
(function (U) {
  var P = U.data.cssProperties;
  function css(lines) { return lines.join('\n'); }

  var NARROW = {
    html: '<div class="box">Visit https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap   for    the   details.\nSecond line.</div>',
    css: css(['.box {', '  width: 170px;', '  padding: 6px;', '  background: #eef1fb;', '  border: 2px dashed #9aa3b8;', '}']),
    target: '.box'
  };

  P.push(
    {
      name: 'font-family', group: 'Text & fonts', short: 'which typeface',
      summary: 'Which typeface the text uses. Give a list: the browser uses the first one it has.',
      description: 'Always end the list with a generic family (`serif`, `sans-serif`, `monospace`…) as the final fallback. Font names with spaces need quotes: `"Courier New"`. Web fonts are loaded with `@font-face` or a `<link>` to a font service.',
      initial: 'depends on the browser (usually a serif)', inherited: true,
      values: [
        { value: 'serif', desc: 'A font with small strokes at the ends of letters, like Times. Traditional, bookish.' },
        { value: 'sans-serif', desc: 'Clean letters without serifs, like Arial or Helvetica. The usual choice on screens.' },
        { value: 'monospace', desc: 'Every letter the same width, like a code editor.' },
        { value: 'cursive', desc: 'A handwriting-like font. Varies a lot between systems.' },
        { value: 'fantasy', desc: 'A decorative font. Rarely useful.' },
        { value: 'system-ui', desc: 'The operating system\'s own interface font: Segoe UI on Windows, San Francisco on Apple devices.' },
        { value: 'Georgia, serif', desc: 'A font stack: Georgia if available, otherwise any serif.', example: true },
        { value: '"Courier New", monospace', desc: 'Quoted because the name has a space.', example: true },
        { value: 'Arial, Helvetica, sans-serif', desc: 'A classic, safe stack.', example: true }
      ],
      start: 'Georgia, serif', demo: 'text',
      java: 'Like a list of fallbacks resolved at runtime: the first available implementation wins, and the generic family is the guaranteed default.',
      tips: ['Two fonts are usually enough for a whole site: one for headings, one for body text.'],
      related: ['font-size', 'font-weight', 'line-height'],
      keywords: ['font', 'typeface', 'serif', 'sans-serif', 'monospace']
    },
    {
      name: 'font-size', group: 'Text & fonts', short: 'how big the text is',
      summary: 'The size of the text.',
      description: '`px` is a fixed size. `em` is relative to the parent\'s font size and `rem` to the root (`<html>`) font size, normally 16px. Prefer `rem` for text: it respects the user\'s browser setting for bigger text.',
      initial: 'medium (16px)', inherited: true,
      values: [
        { value: 'xx-small', desc: 'About 9px.' },
        { value: 'x-small', desc: 'About 10px.' },
        { value: 'small', desc: 'About 13px.' },
        { value: 'medium', desc: '16px, the browser default.' },
        { value: 'large', desc: 'About 18px.' },
        { value: 'x-large', desc: '24px.' },
        { value: 'xx-large', desc: '32px.' },
        { value: 'xxx-large', desc: '48px.' },
        { value: 'smaller', desc: 'One step smaller than the parent.' },
        { value: 'larger', desc: 'One step larger than the parent.' },
        { value: '14px', desc: 'Exactly 14 pixels.', example: true },
        { value: '1.5rem', desc: '1.5 × the root size: 24px by default.', example: true },
        { value: '2em', desc: '2 × the parent\'s font size.', example: true },
        { value: '150%', desc: '1.5 × the parent\'s font size.', example: true },
        { value: 'clamp(14px, 5vw, 40px)', desc: 'Fluid: 5% of the viewport width, but never below 14px or above 40px. Resize the preview.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom size', min: 6, max: 80, value: 28, units: ['px', 'rem', 'em', '%', 'vw'] }],
      start: '1.5rem',
      demo: { html: '<p class="text">The quick brown fox jumps over the lazy dog.</p>', css: '.text {\n  margin: 0;\n}', target: '.text' },
      related: ['font-family', 'line-height', 'explain:units', 'lesson:css-typography'],
      keywords: ['text size', 'font size', 'rem', 'em', 'big text', 'small text']
    },
    {
      name: 'font-weight', group: 'Text & fonts', short: 'how bold',
      summary: 'How thick (bold) the letters are, from 100 (thin) to 900 (black).',
      description: 'Not every font has every weight; the browser picks the nearest one it has. `normal` is 400 and `bold` is 700.',
      initial: 'normal (400)', inherited: true,
      values: [
        { value: 'normal', desc: 'The same as 400.' },
        { value: 'bold', desc: 'The same as 700.' },
        { value: 'lighter', desc: 'One step lighter than the parent.' },
        { value: 'bolder', desc: 'One step bolder than the parent.' },
        { value: '100', desc: 'Thin.' }, { value: '300', desc: 'Light.' }, { value: '500', desc: 'Medium.' },
        { value: '600', desc: 'Semi-bold.' }, { value: '800', desc: 'Extra-bold.' }, { value: '900', desc: 'Black: the heaviest.' }
      ],
      inputs: [{ type: 'number', label: 'Custom weight', min: 100, max: 900, step: 100, value: 600 }],
      start: 'bold', demo: 'text',
      related: ['font-family', 'font-style', 'html:strong', 'html:b'],
      keywords: ['bold', 'thick', 'weight', 'light']
    },
    {
      name: 'font-style', group: 'Text & fonts', short: 'italic or not',
      summary: 'Normal, italic or oblique (slanted) letters.',
      description: '`italic` uses the font\'s true italic design if it has one; `oblique` just slants the normal letters. In most fonts you will not see a difference.',
      initial: 'normal', inherited: true,
      values: [
        { value: 'normal', desc: 'Upright.' },
        { value: 'italic', desc: 'Italic.' },
        { value: 'oblique', desc: 'Slanted.' },
        { value: 'oblique 25deg', desc: 'Slanted by a chosen angle (fonts that support it).', example: true }
      ],
      start: 'italic', demo: 'text',
      related: ['font-weight', 'html:em', 'html:i'],
      keywords: ['italic', 'slant', 'oblique']
    },
    {
      name: 'line-height', group: 'Text & fonts', short: 'distance between lines',
      summary: 'The height of each line of text: more line-height means more space between lines.',
      description: 'Use a unitless number like `1.5`: it means "1.5 × this element\'s font size", and children re-calculate it for their own font size. 1.4-1.7 is comfortable for body text.',
      initial: 'normal (about 1.2)', inherited: true,
      values: [
        { value: 'normal', desc: 'The font\'s default, about 1.2. A bit tight for paragraphs.' },
        { value: '1', desc: 'Exactly the font size: lines nearly touch.', example: true },
        { value: '1.5', desc: '1.5 × the font size. A good default for reading.', example: true },
        { value: '2', desc: 'Double spacing.', example: true },
        { value: '30px', desc: 'A fixed 30px; does not adapt if the font size changes.', example: true },
        { value: '150%', desc: '150% of this element\'s size, computed once (children inherit the pixel value).', example: true }
      ],
      inputs: [{ type: 'number', label: 'Custom (unitless)', min: 0.8, max: 3, step: 0.1, value: 1.6 }],
      start: '1.5', demo: 'para',
      tips: ['A neat trick: in a single-line box, `line-height` equal to the box height centres the text vertically.'],
      related: ['font-size', 'letter-spacing'],
      keywords: ['line spacing', 'leading', 'line gap']
    },
    {
      name: 'letter-spacing', group: 'Text & fonts', short: 'space between letters',
      summary: 'Extra space between letters (or less, with a negative value).',
      description: 'Wider spacing helps short uppercase labels; tighter spacing suits big headings.',
      initial: 'normal', inherited: true,
      values: [
        { value: 'normal', desc: 'The font\'s own spacing.' },
        { value: '1px', desc: '1px extra between letters.', example: true },
        { value: '0.2em', desc: 'Wide: a fifth of the font size.', example: true },
        { value: '5px', desc: 'Very wide.', example: true },
        { value: '-1px', desc: 'Tighter than normal.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom spacing', min: -3, max: 12, step: 0.5, value: 2, units: ['px', 'em'] }],
      start: '0.2em', demo: 'text',
      related: ['word-spacing', 'text-transform'],
      keywords: ['tracking', 'letter spacing', 'kerning']
    },
    {
      name: 'word-spacing', group: 'Text & fonts', short: 'space between words',
      summary: 'Extra space between words.',
      description: 'Added to the normal width of a space character.',
      initial: 'normal', inherited: true,
      values: [
        { value: 'normal', desc: 'The normal space.' },
        { value: '10px', desc: '10px extra per space.', example: true },
        { value: '1em', desc: 'A font-size-wide extra gap.', example: true },
        { value: '-3px', desc: 'Tighter.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom spacing', min: -5, max: 30, value: 8, units: ['px', 'em'] }],
      start: '10px', demo: 'text',
      related: ['letter-spacing'],
      keywords: ['word gap']
    },
    {
      name: 'text-align', group: 'Text & fonts', short: 'left, centre, right, justify',
      summary: 'How lines of text (and other inline content) line up inside their box.',
      description: 'It aligns the *content* of a block, not the block itself. To centre a box, use `margin: 0 auto` or flexbox. `start`/`end` follow the text direction, so they also work for right-to-left languages.',
      initial: 'start', inherited: true,
      values: [
        { value: 'left', desc: 'Lines start at the left edge.' },
        { value: 'right', desc: 'Lines end at the right edge.' },
        { value: 'center', desc: 'Each line is centred.' },
        { value: 'justify', desc: 'Lines stretch to both edges by widening the spaces (except the last line).' },
        { value: 'start', desc: 'Left for left-to-right text, right for right-to-left text.' },
        { value: 'end', desc: 'The opposite of start.' }
      ],
      start: 'center', demo: 'para',
      mistakes: ['Expecting `text-align: center` to centre a div: it centres the text inside it.'],
      related: ['justify-content', 'margin', 'vertical-align'],
      keywords: ['align text', 'centre text', 'center text', 'justify', 'center', 'centre']
    },
    {
      name: 'text-decoration', group: 'Text & fonts', short: 'underline, line-through…',
      summary: 'Lines drawn on text: underline, overline, line-through - with optional style, colour and thickness.',
      description: 'Shorthand for `text-decoration-line`, `-style`, `-color` and `-thickness`. `text-decoration: none` is mostly used to remove the underline from links.',
      initial: 'none', inherited: false,
      values: [
        { value: 'none', desc: 'No line. Removes the underline from links.' },
        { value: 'underline', desc: 'A line under the text.' },
        { value: 'overline', desc: 'A line above the text.' },
        { value: 'line-through', desc: 'A line through the middle (strikethrough).' },
        { value: 'underline wavy red', desc: 'Wavy red underline, like a spell-checker.', example: true },
        { value: 'underline dotted 2px', desc: 'Dotted, 2px thick.', example: true },
        { value: 'line-through 3px #d6336c', desc: 'A thick coloured strike.', example: true },
        { value: 'underline overline', desc: 'Two lines at once.', example: true }
      ],
      start: 'underline wavy red', demo: 'text',
      tips: ['`text-underline-offset: 4px` moves the underline away from the letters.'],
      related: ['html:a', 'html:del', 'color'],
      keywords: ['underline', 'strikethrough', 'line-through', 'remove underline']
    },
    {
      name: 'text-transform', group: 'Text & fonts', short: 'UPPER, lower, Capitalised',
      summary: 'Changes the capitalisation of text for display, without changing the text itself.',
      description: 'The HTML keeps its original text (copy-paste and screen readers may get the original). Handy for buttons and labels.',
      initial: 'none', inherited: true,
      values: [
        { value: 'none', desc: 'As written.' },
        { value: 'uppercase', desc: 'ALL CAPITALS.' },
        { value: 'lowercase', desc: 'all small letters.' },
        { value: 'capitalize', desc: 'The First Letter Of Each Word.' }
      ],
      start: 'uppercase', demo: 'text',
      related: ['letter-spacing', 'font-size'],
      keywords: ['uppercase', 'lowercase', 'capitalize', 'caps']
    },
    {
      name: 'text-indent', group: 'Text & fonts', short: 'indent the first line',
      summary: 'Indents the first line of a block of text, like in a printed book.',
      description: 'A negative value with matching `padding-left` creates a "hanging indent".',
      initial: '0', inherited: true,
      values: [
        { value: '0', desc: 'No indent.', example: true },
        { value: '2em', desc: 'Two font-sizes in.', example: true },
        { value: '60px', desc: '60px in.', example: true },
        { value: '25%', desc: 'A quarter of the box\'s width.', example: true },
        { value: '-20px', desc: 'Sticks out to the left (hanging).', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom indent', min: -40, max: 120, value: 30, units: ['px', 'em', '%'] }],
      start: '2em', demo: 'para',
      related: ['text-align', 'padding'],
      keywords: ['indent', 'first line']
    },
    {
      name: 'text-shadow', group: 'Text & fonts', short: 'shadow behind letters',
      summary: 'A shadow behind each letter: x offset, y offset, blur, colour. Several shadows can be combined with commas.',
      description: 'Subtle shadows improve readability of text over images; bold ones make retro or glowing effects.',
      initial: 'none', inherited: true,
      values: [
        { value: 'none', desc: 'No shadow.' },
        { value: '2px 2px 0 #ff7a1a', desc: 'A hard orange shadow, down and right.', example: true },
        { value: '0 0 8px #4f6fd8', desc: 'A soft blue glow (no offset, only blur).', example: true },
        { value: '1px 1px 2px rgb(0 0 0 / 50%)', desc: 'A subtle drop shadow.', example: true },
        { value: '3px 3px 0 #ffd34d, 6px 6px 0 #ff7a1a', desc: 'Two stacked shadows: a retro effect.', example: true }
      ],
      inputs: [{
        type: 'builder', label: 'Build a shadow', format: '{0} {1} {2} {3}',
        parts: [
          { label: 'x offset', type: 'length', min: -20, max: 20, value: 3, units: ['px'] },
          { label: 'y offset', type: 'length', min: -20, max: 20, value: 3, units: ['px'] },
          { label: 'blur', type: 'length', min: 0, max: 30, value: 4, units: ['px'] },
          { label: 'colour', type: 'color', value: '#ff7a1a' }
        ]
      }],
      start: '2px 2px 0 #ff7a1a',
      demo: { html: '<p class="text">Shadowy text</p>', css: '.text {\n  font: 800 40px system-ui, sans-serif;\n  margin: 10px 0;\n}', target: '.text' },
      related: ['box-shadow', 'filter'],
      keywords: ['shadow', 'glow', 'text glow']
    },
    {
      name: 'white-space', group: 'Text & fonts', short: 'spaces and line breaks',
      summary: 'Whether spaces and line breaks in the HTML are kept, and whether long lines wrap.',
      description: 'Normally HTML collapses runs of spaces into one and ignores line breaks. The demo text has extra spaces and a real line break in it.',
      initial: 'normal', inherited: true,
      values: [
        { value: 'normal', desc: 'Collapse spaces, ignore line breaks, wrap lines to fit.' },
        { value: 'nowrap', desc: 'Collapse spaces, and never wrap: the text runs out of the box.' },
        { value: 'pre', desc: 'Keep every space and line break; never wrap (like `<pre>`).' },
        { value: 'pre-wrap', desc: 'Keep spaces and line breaks, and also wrap long lines.' },
        { value: 'pre-line', desc: 'Collapse spaces, but keep line breaks; wrap long lines.' },
        { value: 'break-spaces', desc: 'Like pre-wrap, and spaces at the end of a line can wrap too.' }
      ],
      start: 'nowrap', demo: NARROW,
      related: ['overflow-wrap', 'text-overflow', 'html:pre'],
      keywords: ['nowrap', 'wrap', 'whitespace', 'line break', 'pre']
    },
    {
      name: 'overflow-wrap', group: 'Text & fonts', short: 'break long words?',
      summary: 'Whether the browser may break a long word (such as a URL) that does not fit on a line.',
      description: 'Without it, a long URL sticks out of a narrow box. `break-word` breaks it only when there is no other way.',
      initial: 'normal', inherited: true,
      values: [
        { value: 'normal', desc: 'Only break at spaces and hyphens: long words overflow.' },
        { value: 'break-word', desc: 'Break inside a word if it would otherwise overflow.' },
        { value: 'anywhere', desc: 'Like break-word, and the word also no longer forces the box to be wider (matters for min-content sizing).' }
      ],
      start: 'break-word', demo: NARROW,
      related: ['word-break', 'white-space', 'overflow'],
      keywords: ['word wrap', 'long url', 'break word']
    },
    {
      name: 'word-break', group: 'Text & fonts', short: 'where words may break',
      summary: 'Where line breaks may happen inside words.',
      description: 'More aggressive than `overflow-wrap`: `break-all` breaks anywhere, even when not needed, which suits code or tables of IDs.',
      initial: 'normal', inherited: true,
      values: [
        { value: 'normal', desc: 'The usual rules for each language.' },
        { value: 'break-all', desc: 'Break between any two letters to fill lines completely.' },
        { value: 'keep-all', desc: 'Do not break words in Chinese, Japanese and Korean text (otherwise like normal).' }
      ],
      start: 'break-all', demo: NARROW,
      related: ['overflow-wrap', 'white-space'],
      keywords: ['break all', 'line breaking']
    },
    {
      name: 'text-overflow', group: 'Text & fonts', short: '"…" for cut-off text',
      summary: 'What to show when text is cut off at the end of a box: nothing, or an ellipsis (…).',
      description: 'Works only together with `white-space: nowrap` and `overflow: hidden` (the demo sets both). Typical for long names in tables and cards.',
      initial: 'clip', inherited: false,
      values: [
        { value: 'clip', desc: 'Cut the text off at the edge.' },
        { value: 'ellipsis', desc: 'End with "…" to show that there is more.' }
      ],
      start: 'ellipsis',
      demo: { html: '<div class="box">This sentence is far too long to fit in one line of this small box.</div>', css: css(['.box {', '  width: 220px;', '  white-space: nowrap;', '  overflow: hidden;', '  padding: 6px;', '  border: 2px dashed #9aa3b8;', '}']), target: '.box' },
      related: ['white-space', 'overflow'],
      keywords: ['ellipsis', 'truncate', 'dots', 'cut off']
    },
    {
      name: 'vertical-align', group: 'Text & fonts', short: 'align inline items in a line',
      summary: 'Vertical alignment of an inline element (an image, an icon, a word) within its line - or of content in a table cell.',
      description: 'It does *not* centre a block inside its parent - use flexbox for that. It only aligns things sitting on the same line of text, like the avatar in the demo.',
      initial: 'baseline', inherited: false,
      values: [
        { value: 'baseline', desc: 'The bottom of the image sits on the text\'s baseline (the line letters sit on).' },
        { value: 'middle', desc: 'The middle of the image lines up with the middle of lowercase letters.' },
        { value: 'top', desc: 'Aligned with the top of the whole line.' },
        { value: 'bottom', desc: 'Aligned with the bottom of the whole line.' },
        { value: 'text-top', desc: 'Aligned with the top of the text.' },
        { value: 'text-bottom', desc: 'Aligned with the bottom of the text.' },
        { value: 'sub', desc: 'Lowered like subscript.' },
        { value: 'super', desc: 'Raised like superscript.' },
        { value: '-10px', desc: '10px below the baseline.', example: true }
      ],
      start: 'middle',
      demo: { html: '<p class="line">Big <span class="big">TEXT</span> and <img class="icon" src="avatar.svg" alt="avatar"> an image in one line.</p>', css: css(['.line {', '  font-size: 18px;', '  background: linear-gradient(#eef1fb, #eef1fb);', '}', '.big {', '  font-size: 40px;', '}', '.icon {', '  width: 32px;', '  height: 32px;', '}']), target: '.icon' },
      mistakes: ['Using `vertical-align: middle` to centre a div in its parent. It has no effect on blocks.'],
      related: ['align-items', 'line-height', 'html:img'],
      keywords: ['align image', 'icon alignment', 'baseline', 'vertical centre']
    }
  );
})(window.UILT);
