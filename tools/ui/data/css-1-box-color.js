/*
 * CSS properties, part 1: the box model, colour and backgrounds.
 * Entry shape: see css-0-shared.js.
 */
(function (U) {
  var P = U.data.cssProperties;
  function css(lines) { return lines.join('\n'); }
  var LEN_UNITS = ['px', '%', 'em', 'rem', 'vw'];
  var BORDER_BUILDER = {
    type: 'builder', label: 'Build a border', format: '{0} {1} {2}',
    parts: [
      { label: 'width', type: 'length', min: 0, max: 20, value: 4, units: ['px'] },
      { label: 'style', type: 'select', options: ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none'] },
      { label: 'colour', type: 'color', value: '#ff7a1a' }
    ]
  };
  var SIDES_BUILDER = function (label, max, min) {
    return {
      type: 'builder', label: label, format: '{0} {1} {2} {3}',
      desc: 'Four values go clockwise from the top: top, right, bottom, left.',
      parts: ['top', 'right', 'bottom', 'left'].map(function (s) { return { label: s, type: 'length', min: min || 0, max: max, value: 10, units: ['px', 'em', '%'] }; })
    };
  };

  P.push(
    /* ---------- Box model ---------- */
    {
      name: 'width', group: 'Box model', short: 'how wide a box is',
      summary: 'How wide the element\'s box is.',
      description: 'By default a block element (like `<div>`) is as wide as its parent (`auto`), and an inline element (like `<span>`) ignores width entirely. Percentages are of the parent\'s width. Watch the dashed parent: the box can be narrower than it, or even stick out.',
      initial: 'auto', inherited: false, appliesTo: 'all elements except inline ones (span, a, strong…)',
      values: [
        { value: 'auto', desc: 'The browser decides: a block element fills its parent\'s width.' },
        { value: 'fit-content', desc: 'As wide as the content needs, but never wider than the parent ("shrink-wrap").' },
        { value: 'min-content', desc: 'As narrow as possible: every line breaks, so the longest word sets the width.' },
        { value: 'max-content', desc: 'As wide as the content wants with no line breaks at all - may stick out of the parent.' },
        { value: '200px', desc: 'Exactly 200 CSS pixels, whatever the parent\'s size.', example: true },
        { value: '50%', desc: 'Half of the parent\'s content width.', example: true },
        { value: '15em', desc: '15 times the element\'s font size: grows when the text gets bigger.', example: true },
        { value: '120%', desc: 'Wider than the parent: the box overflows it.', example: true },
        { value: 'calc(100% - 40px)', desc: 'The parent\'s width minus 40px. `calc()` mixes units, so the box always leaves exactly 40px free, whatever the parent\'s size. See [[lesson:css-variables]].', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom width', min: 0, max: 600, value: 240, units: LEN_UNITS.concat(['ch']) }],
      start: '200px', demo: 'sized',
      java: 'The "content size" of a component, like `setPreferredSize` in Swing - but by default only the content area, not including padding and border (see `box-sizing`).',
      tips: ['For readable text, limit width with `max-width: 65ch` instead of a fixed width.', 'Add `box-sizing: border-box` so padding and border are included in the width you set.'],
      mistakes: ['Setting `width` on a `<span>` or `<a>`: inline elements ignore it. Change `display` to `inline-block` or `block` first.', 'Fixed pixel widths that break on small screens. Prefer `%`, `max-width` or flexbox/grid.'],
      related: ['height', 'max-width', 'min-width', 'box-sizing', 'padding', 'explain:box-model', 'explain:units'],
      keywords: ['size', 'wide', 'dimension', 'fit-content', 'units']
    },
    {
      name: 'height', group: 'Box model', short: 'how tall a box is',
      summary: 'How tall the element\'s box is.',
      description: 'Usually you leave height alone (`auto`): the box grows to fit its content. A fixed height that is too small makes the content overflow. A percentage height only works when the parent has a definite height (here the parent is 170px tall).',
      initial: 'auto', inherited: false, appliesTo: 'all elements except inline ones',
      values: [
        { value: 'auto', desc: 'As tall as the content needs. The usual and safest choice.' },
        { value: 'fit-content', desc: 'As tall as the content, within the space available.' },
        { value: 'min-content', desc: 'The smallest height that fits the content.' },
        { value: 'max-content', desc: 'The height the content wants.' },
        { value: '120px', desc: 'Exactly 120 pixels tall.', example: true },
        { value: '20px', desc: 'Too small: the text spills out of the box (see `overflow`).', example: true },
        { value: '50%', desc: 'Half of the parent\'s height - only because the parent has a fixed height.', example: true },
        { value: '100%', desc: 'As tall as the parent\'s content area.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom height', min: 0, max: 300, value: 100, units: LEN_UNITS.concat(['vh']) }],
      start: '120px',
      demo: { preset: 'sized', css: '.parent {\n  height: 170px;\n}' },
      tips: ['Need "at least this tall"? Use `min-height`, so the box can still grow with its content.', 'Full-screen sections: `min-height: 100vh` (or `100dvh` on phones).'],
      mistakes: ['`height: 50%` doing nothing: the parent has no fixed height, so 50% of "auto" is ignored.', 'Fixed heights on boxes with text: one translation or a bigger font later, the text overflows.'],
      related: ['width', 'min-height', 'max-height', 'overflow', 'explain:box-model'],
      keywords: ['size', 'tall', 'dimension', 'vh']
    },
    {
      name: 'min-width', group: 'Box model', short: 'never narrower than',
      summary: 'A lower limit for the width: the box may be wider, but never narrower than this.',
      description: 'The demo box has `width: 100px`. `min-width` wins over `width` when they disagree, so a min-width of 250px makes it 250px wide.',
      initial: 'auto', inherited: false,
      values: [
        { value: 'auto', desc: 'No minimum (for flex items, "auto" means "do not shrink below the content").' },
        { value: 'min-content', desc: 'At least as wide as the longest word.' },
        { value: 'max-content', desc: 'At least as wide as the content on one line.' },
        { value: 'fit-content', desc: 'At least the content\'s shrink-wrapped width.' },
        { value: '250px', desc: 'At least 250px, even though width says 100px.', example: true },
        { value: '60%', desc: 'At least 60% of the parent.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom minimum', min: 0, max: 500, value: 200, units: LEN_UNITS }],
      start: '250px',
      demo: { preset: 'sized', css: '.box {\n  width: 100px;\n}' },
      tips: ['Buttons: `min-width: 120px` keeps short labels like "OK" from producing tiny buttons.'],
      related: ['width', 'max-width', 'flex-basis'],
      keywords: ['minimum width', 'size']
    },
    {
      name: 'max-width', group: 'Box model', short: 'never wider than',
      summary: 'An upper limit for the width: the box may be narrower, but never wider than this.',
      description: 'The most useful sizing property for responsive pages: "be as wide as possible, but no wider than 600px". The demo box would fill the parent; max-width caps it. `max-width` wins over `width`.',
      initial: 'none', inherited: false,
      values: [
        { value: 'none', desc: 'No limit.' },
        { value: 'min-content', desc: 'No wider than the longest word.' },
        { value: 'max-content', desc: 'No wider than the content on one line.' },
        { value: 'fit-content', desc: 'No wider than the shrink-wrapped content.' },
        { value: '200px', desc: 'At most 200px.', example: true },
        { value: '50%', desc: 'At most half the parent.', example: true },
        { value: '20ch', desc: 'At most about 20 characters wide - `ch` is the width of a "0" in the current font. Great for readable line lengths.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom maximum', min: 0, max: 600, value: 300, units: LEN_UNITS.concat(['ch']) }],
      start: '200px', demo: 'sized',
      tips: ['`img { max-width: 100%; height: auto; }` makes images shrink to fit small screens.', 'Centre a page column: `max-width: 960px; margin: 0 auto;`.'],
      related: ['width', 'min-width', 'margin', 'lesson:css-responsive'],
      keywords: ['maximum width', 'responsive', 'container', 'readable', 'ch']
    },
    {
      name: 'min-height', group: 'Box model', short: 'never shorter than',
      summary: 'A lower limit for the height: the box is at least this tall, but can grow with its content.',
      description: 'Usually better than `height`: a hero section with `min-height: 300px` is at least 300px tall but still fits more text if needed.',
      initial: 'auto', inherited: false,
      values: [
        { value: 'auto', desc: 'No minimum.' },
        { value: 'min-content', desc: 'At least the content\'s minimum height.' },
        { value: '120px', desc: 'At least 120px tall.', example: true },
        { value: '50vh', desc: 'At least half of the viewport\'s height (here: the preview\'s height).', example: true },
        { value: '10em', desc: 'At least 10 times the font size.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom minimum', min: 0, max: 300, value: 120, units: ['px', 'em', 'vh'] }],
      start: '120px', demo: 'sized',
      related: ['height', 'max-height'],
      keywords: ['minimum height', 'hero', 'vh']
    },
    {
      name: 'max-height', group: 'Box model', short: 'never taller than',
      summary: 'An upper limit for the height. Content that does not fit overflows - combine with `overflow: auto` for a scrollable area.',
      description: 'The demo box has a lot of text. Cap its height and watch the text spill out; then add `overflow: auto` (see the tip) to get a scroll bar instead.',
      initial: 'none', inherited: false,
      values: [
        { value: 'none', desc: 'No limit: the box is as tall as its content.' },
        { value: '60px', desc: 'At most 60px: the rest of the text overflows the box.', example: true },
        { value: '100px', desc: 'At most 100px.', example: true },
        { value: '30vh', desc: 'At most 30% of the viewport height.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom maximum', min: 0, max: 300, value: 80, units: ['px', 'em', 'vh'] }],
      start: '60px',
      demo: { preset: 'sized', html: '<div class="parent">\n  <div class="box">A box with a lot of text. It keeps going for a while so that it needs several lines, more than a small box can show. Lines, lines and more lines of text in this box.</div>\n</div>', css: '.parent {\n  height: 190px;\n}' },
      previewHeight: 240,
      tips: ['A scrollable panel: `max-height: 300px; overflow: auto;`.'],
      related: ['height', 'overflow', 'min-height'],
      keywords: ['maximum height', 'scroll', 'limit']
    },
    {
      name: 'margin', group: 'Box model', short: 'space outside the border',
      summary: 'Space *outside* the element\'s border: pushes neighbours away. Transparent.',
      description: 'One value sets all four sides; two set top/bottom and left/right; four go clockwise: top, right, bottom, left. `auto` on the left and right centres a box that has a width (the demo box is 160px wide). Vertical margins between blocks "collapse": two 20px margins touching make one 20px gap, not 40px.',
      initial: '0', inherited: false,
      values: [
        { value: 'auto', desc: 'Take all the free space. On left and right of a fixed-width block, this centres it.' },
        { value: '0', desc: 'No margin.', example: true },
        { value: '20px', desc: '20px on all four sides.', example: true },
        { value: '10px 40px', desc: '10px top and bottom, 40px left and right.', example: true },
        { value: '0 auto', desc: 'The classic centring trick: no vertical margin, automatic (equal) left and right margins.', example: true },
        { value: '5px 10px 30px 60px', desc: 'Top 5, right 10, bottom 30, left 60 - clockwise from the top.', example: true },
        { value: '-15px', desc: 'Negative margin: pulls the box over its neighbours.', example: true }
      ],
      inputs: [SIDES_BUILDER('Each side', 60, -20)],
      start: '20px',
      demo: { preset: 'spacing', css: '.box {\n  width: 160px;\n}' },
      java: 'Like the outer `Insets` of a `BorderLayout` gap: empty space around the component that belongs to nobody\'s background.',
      tips: ['Single sides: `margin-top`, `margin-right`, `margin-bottom`, `margin-left` (or the logical `margin-block` / `margin-inline`).', 'Between items in flex or grid layouts, `gap` is simpler than margins.'],
      mistakes: ['Expecting margins to add up vertically: they collapse to the larger one.', 'Using margin to create space *inside* a box with a background - that is padding.'],
      related: ['padding', 'gap', 'box-sizing', 'explain:box-model', 'lesson:css-box-model'],
      keywords: ['spacing', 'space outside', 'centre', 'center', 'auto margin', 'gap', 'margin collapse']
    },
    {
      name: 'padding', group: 'Box model', short: 'space inside the border',
      summary: 'Space *inside* the element, between its content and its border. Shows the element\'s background.',
      description: 'Same 1-to-4-value pattern as margin. Padding makes boxes breathe: buttons, cards and table cells all rely on it. Unlike margin, padding is never negative and never collapses.',
      initial: '0', inherited: false,
      values: [
        { value: '0', desc: 'Content touches the border.', example: true },
        { value: '8px', desc: '8px on all sides.', example: true },
        { value: '24px', desc: '24px on all sides: a roomy card.', example: true },
        { value: '8px 32px', desc: '8px top/bottom, 32px left/right: a typical button.', example: true },
        { value: '4px 8px 24px 48px', desc: 'Top, right, bottom, left.', example: true },
        { value: '1.5em', desc: 'Relative to the font size: scales with the text.', example: true }
      ],
      inputs: [SIDES_BUILDER('Each side', 60, 0)],
      start: '24px', demo: 'spacing',
      java: 'The inner `Insets` / `EmptyBorder` of a Swing component: space between its edge and its content.',
      mistakes: ['Padding making a box wider than its `width`. Fix it with `box-sizing: border-box`.'],
      related: ['margin', 'box-sizing', 'border', 'explain:box-model', 'lesson:css-box-model'],
      keywords: ['spacing', 'space inside', 'inner space']
    },
    {
      name: 'box-sizing', group: 'Box model', short: 'what width measures',
      summary: 'Decides whether `width` and `height` include the padding and border.',
      description: 'The box below has `width: 200px; padding: 20px; border: 6px`. With `content-box` (the default), the 200px is only the content, so the visible box is 252px wide - wider than the 200px ruler. With `border-box`, the visible box is exactly 200px and the content shrinks to make room.',
      initial: 'content-box', inherited: false,
      values: [
        { value: 'content-box', desc: 'width = the content only. Padding and border are added on top. The default, and often surprising.' },
        { value: 'border-box', desc: 'width = content + padding + border. What you set is what you see. Most sites set this on everything.' }
      ],
      start: 'content-box',
      demo: {
        html: '<div class="ruler">200px</div>\n<div class="box">width: 200px</div>',
        css: css(['.ruler {', '  width: 200px;', '  background: #1d2433;', '  color: white;', '  font-size: 12px;', '  text-align: center;', '}',
          '.box {', '  width: 200px;', '  padding: 20px;', '  border: 6px solid #ff7a1a;', '  margin-top: 6px;', '  background: #4f6fd8;', '  color: white;', '}']),
        target: '.box'
      },
      tips: ['The usual first lines of a stylesheet: `*, *::before, *::after { box-sizing: border-box; }`.'],
      related: ['width', 'padding', 'border', 'explain:box-model'],
      keywords: ['border-box', 'content-box', 'box model', 'sizing']
    },
    {
      name: 'border', group: 'Box model', short: 'line around the box',
      summary: 'A line around the element: its width, style and colour in one declaration (a "shorthand").',
      description: 'Write it as `width style colour`, in any order: `2px solid navy`. The style is required - without it there is no border. Single sides: `border-top`, `border-bottom`…',
      initial: 'medium none currentcolor', inherited: false,
      values: [
        { value: 'none', desc: 'No border.' },
        { value: '3px solid #1d2433', desc: 'A 3px solid dark line.', example: true },
        { value: '6px dashed tomato', desc: 'Dashes in a named colour.', example: true },
        { value: '3px dotted #4353c9', desc: 'Dots.', example: true },
        { value: '8px double #1d2433', desc: 'Two lines (needs at least 3px to show).', example: true },
        { value: '10px ridge #9aa3b8', desc: 'A 3D-looking raised ridge.', example: true }
      ],
      inputs: [BORDER_BUILDER],
      start: '3px solid #1d2433', demo: 'box',
      mistakes: ['`border: 2px red` - no style, so no border appears.'],
      related: ['border-width', 'border-style', 'border-color', 'border-radius', 'outline', 'box-sizing'],
      keywords: ['border', 'line', 'frame', 'outline', 'stroke']
    },
    {
      name: 'border-width', group: 'Box model', short: 'thickness of the border',
      summary: 'How thick the border is.',
      description: 'Only visible when `border-style` is not none. 1 to 4 values, like margin.',
      initial: 'medium', inherited: false,
      values: [
        { value: 'thin', desc: 'Thin (usually 1px).' },
        { value: 'medium', desc: 'Medium (usually 3px). The default.' },
        { value: 'thick', desc: 'Thick (usually 5px).' },
        { value: '1px', desc: 'A hairline.', example: true },
        { value: '12px', desc: 'Heavy.', example: true },
        { value: '2px 12px', desc: '2px top and bottom, 12px left and right.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom width', min: 0, max: 30, value: 4, units: ['px', 'em'] }],
      start: '12px', demo: 'bordered',
      related: ['border', 'border-style', 'border-color'],
      keywords: ['border thickness']
    },
    {
      name: 'border-style', group: 'Box model', short: 'solid, dashed, dotted…',
      summary: 'The line style of the border.',
      description: 'Without a style, there is no border at all (the default is `none`). The 3D styles use the border colour to compute lighter and darker shades. "Compare all values" shows all ten side by side.',
      initial: 'none', inherited: false,
      values: [
        { value: 'none', desc: 'No border (the default).' },
        { value: 'hidden', desc: 'Like none, but wins conflicts in collapsed table borders.' },
        { value: 'solid', desc: 'A single solid line. The everyday choice.' },
        { value: 'dashed', desc: 'Dashes.' },
        { value: 'dotted', desc: 'Round dots.' },
        { value: 'double', desc: 'Two parallel lines.' },
        { value: 'groove', desc: 'Looks carved into the page.' },
        { value: 'ridge', desc: 'Looks raised from the page.' },
        { value: 'inset', desc: 'The whole box looks pressed in.' },
        { value: 'outset', desc: 'The whole box looks raised (like an old button).' }
      ],
      start: 'dashed', demo: 'bordered', compareHeight: 110,
      related: ['border', 'border-width', 'outline'],
      keywords: ['dashed', 'dotted', 'solid', 'double']
    },
    {
      name: 'border-color', group: 'Box model', short: 'colour of the border',
      summary: 'The colour of the border.',
      description: 'Any colour value. The default `currentcolor` means "the same as the text colour". Up to four values for the four sides.',
      initial: 'currentcolor', inherited: false,
      values: [
        { value: 'currentcolor', desc: 'The element\'s text colour (the default).' },
        { value: 'transparent', desc: 'Invisible, but still takes up its width. Handy for borders that appear on hover without moving anything.' },
        { value: '#ff7a1a', desc: 'A hex colour.', example: true },
        { value: 'tomato', desc: 'One of the 148 named colours.', example: true },
        { value: 'rgb(0 150 80)', desc: 'Red, green, blue from 0 to 255.', example: true },
        { value: 'red green blue orange', desc: 'Top, right, bottom, left.', example: true }
      ],
      inputs: [{ type: 'color', label: 'Pick a colour', value: '#ff7a1a' }],
      start: '#ff7a1a', demo: 'bordered',
      related: ['border', 'color'],
      keywords: ['border colour', 'border color']
    },
    {
      name: 'border-radius', group: 'Box model', short: 'rounded corners',
      summary: 'Rounds the corners of the box (its background and border).',
      description: 'One value rounds all corners; four go clockwise from top-left. `50%` on a square makes a circle. A slash gives elliptical corners: `30px / 10px`.',
      initial: '0', inherited: false,
      values: [
        { value: '0', desc: 'Square corners.', example: true },
        { value: '6px', desc: 'Slightly rounded, like most buttons.', example: true },
        { value: '20px', desc: 'Clearly rounded, like a card.', example: true },
        { value: '50%', desc: 'An ellipse - or a circle if the box is square.', example: true },
        { value: '999px', desc: 'A "pill": fully round ends on a wide box.', example: true },
        { value: '30px 0', desc: 'Top-left and bottom-right rounded, the others square.', example: true },
        { value: '50% 0 50% 0', desc: 'A leaf shape.', example: true },
        { value: '40px / 12px', desc: 'Elliptical corners: 40px wide, 12px tall.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom radius', min: 0, max: 80, value: 16, units: ['px', '%', 'em'] }],
      start: '20px',
      demo: { preset: 'box', css: '.box {\n  width: 140px;\n  height: 90px;\n}' },
      tips: ['Images round too: `img { border-radius: 50%; }` makes a circular avatar from a square photo.'],
      related: ['border', 'overflow', 'box-shadow'],
      keywords: ['rounded corners', 'circle', 'pill', 'round']
    },
    {
      name: 'outline', group: 'Box model', short: 'line that takes no space',
      summary: 'A line drawn around the element *outside* its border. Unlike a border, it takes no space and never shifts the layout.',
      description: 'Browsers use outlines for the keyboard focus ring. Tab through a page with the keyboard: the ring you see is an outline. `outline-offset` moves it away from the border.',
      initial: 'medium none currentcolor', inherited: false,
      values: [
        { value: 'none', desc: 'No outline.' },
        { value: '3px solid #ff7a1a', desc: 'A solid orange line around the box.', example: true },
        { value: '2px dashed red', desc: 'Dashed, useful for debugging layouts: shows boxes without changing their size.', example: true },
        { value: '6px double #4353c9', desc: 'Two lines.', example: true },
        { value: 'auto', desc: 'The browser\'s own focus-ring style.', example: true }
      ],
      inputs: [BORDER_BUILDER],
      start: '3px solid #ff7a1a', demo: 'spacing',
      mistakes: ['`button:focus { outline: none; }` without a replacement style. Keyboard users can no longer see where they are.'],
      related: ['border', 'box-shadow'],
      keywords: ['focus ring', 'outline', 'debug']
    },

    /* ---------- Colour and background ---------- */
    {
      name: 'color', group: 'Colour & background', short: 'text colour',
      summary: 'The colour of the text (and the default colour of borders and SVG icons).',
      description: 'Inherited: set it on `body` and every element inside uses it, unless something closer says otherwise. In the demo the `<strong>` has no colour of its own, so it inherits. Colours can be names, hex codes (`#rrggbb`), `rgb()`, `hsl()` and more.',
      initial: 'black (canvastext)', inherited: true,
      values: [
        { value: 'navy', desc: 'A named colour. There are 148 names, from aliceblue to yellowgreen.', example: true },
        { value: 'crimson', desc: 'Another named colour.', example: true },
        { value: '#4353c9', desc: 'Hex: red 43, green 53, blue c9 (hexadecimal 00-ff).', example: true },
        { value: '#4353c980', desc: 'Hex with alpha: the last two digits are opacity (80 ≈ 50%).', example: true },
        { value: 'rgb(220 40 60)', desc: 'Red, green, blue as numbers from 0 to 255.', example: true },
        { value: 'rgb(0 0 0 / 50%)', desc: 'Black at 50% opacity.', example: true },
        { value: 'hsl(150 70% 35%)', desc: 'Hue (0-360° round the colour wheel), saturation, lightness. Easy to make lighter or darker variants.', example: true }
      ],
      inputs: [{ type: 'color', label: 'Pick a colour', value: '#d6336c' }],
      start: 'crimson',
      demo: { html: '<p class="text">The quick <strong>brown fox</strong> jumps over the lazy dog.</p>', css: '.text {\n  font-size: 22px;\n}', target: '.text' },
      java: 'Inheritance works like a field inherited from a superclass: children use the parent\'s value unless they override it.',
      tips: ['Check contrast: text needs a contrast ratio of at least 4.5:1 against its background to be readable.'],
      related: ['background-color', 'opacity', 'border-color', 'term:inheritance'],
      keywords: ['text colour', 'text color', 'font colour', 'hex', 'rgb', 'hsl', 'colour', 'color']
    },
    {
      name: 'background-color', group: 'Colour & background', short: 'fill colour',
      summary: 'The colour that fills the element\'s box, behind its content and padding (and under the border).',
      description: 'Not inherited, but the default is `transparent`, so the parent\'s background shows through - which looks like inheritance. Use a colour with alpha (opacity) to tint without hiding what is behind.',
      initial: 'transparent', inherited: false,
      values: [
        { value: 'transparent', desc: 'No fill: whatever is behind shows through (the default).' },
        { value: 'lightyellow', desc: 'A named colour.', example: true },
        { value: '#4353c9', desc: 'A hex colour.', example: true },
        { value: 'rgb(255 122 26 / 40%)', desc: 'Orange at 40% opacity: the stripes behind show through.', example: true },
        { value: 'hsl(200 80% 90%)', desc: 'A very light blue.', example: true },
        { value: 'currentcolor', desc: 'The same as the text colour (so the text disappears!).', example: true }
      ],
      inputs: [{ type: 'color', label: 'Pick a colour', value: '#ffe7c2' }],
      start: 'lightyellow',
      demo: {
        html: '<div class="stripes">\n  <div class="box">A box with some text</div>\n</div>',
        css: css(['.stripes {', '  padding: 14px;', '  background: repeating-linear-gradient(45deg, #fff 0 10px, #e3e8f2 10px 20px);', '}',
          '.box {', '  padding: 16px;', '  border: 2px dashed #9aa3b8;', '}']),
        target: '.box'
      },
      related: ['background-image', 'color', 'opacity', 'background-clip'],
      keywords: ['background colour', 'background color', 'fill', 'bg']
    },
    {
      name: 'background-image', group: 'Colour & background', short: 'image or gradient behind',
      summary: 'An image or a gradient drawn behind the content. Gradients are generated by CSS - no file needed.',
      description: 'Images are given with `url(...)`. Gradients blend between colours: `linear-gradient` along a line, `radial-gradient` from a centre, `conic-gradient` around a centre. Images repeat to fill the box unless `background-repeat` says otherwise.',
      initial: 'none', inherited: false,
      values: [
        { value: 'none', desc: 'No image.' },
        { value: 'linear-gradient(#4f6fd8, #ff7a1a)', desc: 'Top to bottom, blue to orange.', example: true },
        { value: 'linear-gradient(to right, #4f6fd8, #ff7a1a)', desc: 'Left to right.', example: true },
        { value: 'linear-gradient(135deg, #ffd34d 0%, #ff7a1a 50%, #d6336c 100%)', desc: 'Diagonal, three colours with positions.', example: true },
        { value: 'radial-gradient(circle, #ffd34d, #ff7a1a)', desc: 'From the centre outwards.', example: true },
        { value: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', desc: 'Round the centre, like a colour wheel.', example: true },
        { value: 'repeating-linear-gradient(45deg, #eef1fb 0 10px, #c9d3ee 10px 20px)', desc: 'Stripes, from a repeating gradient.', example: true },
        { value: 'url(landscape.svg)', desc: 'An image file. (This one repeats, because the box is bigger than the image.)', example: true }
      ],
      start: 'linear-gradient(to right, #4f6fd8, #ff7a1a)',
      demo: { html: '<div class="box">Text on top of the background</div>', css: css(['.box {', '  height: 140px;', '  padding: 12px;', '  border: 2px dashed #9aa3b8;', '  font-weight: 600;', '}']), target: '.box' },
      compareHeight: 120,
      tips: ['Layer several images: `background-image: url(logo.svg), linear-gradient(...)` - the first one is on top.', 'Try [cssgradient.io](https://cssgradient.io) to design gradients.'],
      related: ['background-size', 'background-repeat', 'background-position', 'background-color'],
      keywords: ['gradient', 'image', 'linear-gradient', 'radial-gradient', 'background picture', 'url']
    },
    {
      name: 'background-size', group: 'Colour & background', short: 'scale the background image',
      summary: 'How big the background image is drawn.',
      description: 'The demo box is 280 × 140 and the image is 320 × 200, so different values crop or shrink it. `cover` and `contain` are the two you will use most.',
      initial: 'auto', inherited: false,
      values: [
        { value: 'auto', desc: 'The image\'s own size (cropped if the box is smaller).' },
        { value: 'cover', desc: 'Scale until the box is fully covered, keeping the shape. Parts are cropped. For hero images.' },
        { value: 'contain', desc: 'Scale until the whole image fits, keeping the shape. Empty space may remain.' },
        { value: '100px', desc: '100px wide, height in proportion.', example: true },
        { value: '50% auto', desc: 'Half the box width, height in proportion.', example: true },
        { value: '100% 100%', desc: 'Stretch to the box exactly - the image is distorted.', example: true }
      ],
      start: 'cover',
      demo: { html: '<div class="box"></div>', css: css(['.box {', '  width: 280px;', '  height: 140px;', '  background-color: #eef1fb;', '  background-image: url(landscape.svg);', '  background-repeat: no-repeat;', '  border: 2px dashed #9aa3b8;', '}']), target: '.box' },
      compareHeight: 170,
      related: ['background-image', 'background-position', 'object-fit'],
      keywords: ['cover', 'contain', 'scale background', 'stretch']
    },
    {
      name: 'background-position', group: 'Colour & background', short: 'place the background image',
      summary: 'Where the background image sits inside the box.',
      description: 'Keywords (`top`, `right`, `center`…), lengths, or percentages. Two values: horizontal first, then vertical.',
      initial: '0% 0%', inherited: false,
      values: [
        { value: 'center', desc: 'In the middle.' },
        { value: 'top', desc: 'Centred along the top edge.' },
        { value: 'bottom', desc: 'Centred along the bottom edge.' },
        { value: 'left', desc: 'Centred along the left edge.' },
        { value: 'right', desc: 'Centred along the right edge.' },
        { value: 'right bottom', desc: 'In the bottom-right corner.', example: true },
        { value: '20px 40px', desc: '20px from the left, 40px from the top.', example: true },
        { value: '75% 25%', desc: 'Percentages line up the same point of image and box.', example: true }
      ],
      start: 'center',
      demo: { html: '<div class="box"></div>', css: css(['.box {', '  width: 280px;', '  height: 150px;', '  background-color: #eef1fb;', '  background-image: url(avatar.svg);', '  background-repeat: no-repeat;', '  border: 2px dashed #9aa3b8;', '}']), target: '.box' },
      compareHeight: 180,
      related: ['background-image', 'background-size', 'object-position'],
      keywords: ['position background', 'align background']
    },
    {
      name: 'background-repeat', group: 'Colour & background', short: 'tile the background',
      summary: 'Whether a background image repeats (tiles) to fill the box.',
      description: 'By default images repeat in both directions. The demo uses a small 40 × 40 tile.',
      initial: 'repeat', inherited: false,
      values: [
        { value: 'repeat', desc: 'Tile in both directions (the default). Edge tiles may be cut off.' },
        { value: 'no-repeat', desc: 'Draw the image once.' },
        { value: 'repeat-x', desc: 'Tile horizontally only.' },
        { value: 'repeat-y', desc: 'Tile vertically only.' },
        { value: 'space', desc: 'Tile without cutting, spreading the leftover space between tiles.' },
        { value: 'round', desc: 'Tile without cutting, stretching the tiles slightly so a whole number fits.' }
      ],
      start: 'repeat-x',
      demo: { html: '<div class="box"></div>', css: css(['.box {', '  width: 270px;', '  height: 130px;', '  background-color: #eef1fb;', '  background-image: url(tile.svg);', '  border: 2px dashed #9aa3b8;', '}']), target: '.box' },
      compareHeight: 160,
      related: ['background-image', 'background-size'],
      keywords: ['tile', 'repeat', 'pattern']
    },
    {
      name: 'background-attachment', group: 'Colour & background', short: 'does the background scroll?',
      summary: 'Whether the background scrolls with the content or stays put.',
      description: 'Scroll inside the demo box to feel the difference. `fixed` pins the image to the viewport (the preview frame), which creates a parallax-like effect.',
      initial: 'scroll', inherited: false,
      values: [
        { value: 'scroll', desc: 'Fixed to the box: scrolling the page moves it, scrolling inside the box does not.' },
        { value: 'local', desc: 'Scrolls together with the box\'s content.' },
        { value: 'fixed', desc: 'Fixed to the viewport: does not move at all while scrolling.' }
      ],
      start: 'local',
      demo: {
        html: '<div class="box">\n  <p>Scroll inside this box ↓</p>\n  <p>Line 2</p><p>Line 3</p><p>Line 4</p><p>Line 5</p><p>Line 6</p><p>Line 7</p><p>The end.</p>\n</div>',
        css: css(['.box {', '  width: 280px;', '  height: 150px;', '  overflow: auto;', '  background-image: url(avatar.svg);', '  background-repeat: no-repeat;', '  background-position: right top;', '  border: 2px dashed #9aa3b8;', '  padding: 0 10px;', '}']),
        target: '.box'
      },
      hint: 'scroll inside the box',
      related: ['background-image', 'overflow'],
      keywords: ['parallax', 'fixed background', 'scroll']
    },
    {
      name: 'background-clip', group: 'Colour & background', short: 'how far the background reaches',
      summary: 'How far the background extends: under the border, only to the padding edge, only behind the content - or only inside the text.',
      description: 'The demo has a thick dashed border and padding so you can see each edge. `text` clips the background to the letters themselves; it only shows when the text colour is see-through (here it is 25% white).',
      initial: 'border-box', inherited: false,
      values: [
        { value: 'border-box', desc: 'Under the border too (the default) - visible through the gaps in the dashes.' },
        { value: 'padding-box', desc: 'Stops at the inside edge of the border.' },
        { value: 'content-box', desc: 'Only behind the content, not the padding.' },
        { value: 'text', desc: 'Only inside the text\'s letters: gradient text.' }
      ],
      start: 'padding-box',
      demo: { html: '<div class="box">Gradient text</div>', css: css(['.box {', '  padding: 20px;', '  border: 10px dashed #1d2433;', '  background-image: linear-gradient(to right, #4f6fd8, #ff7a1a);', '  color: rgb(255 255 255 / 25%);', '  font: 800 34px system-ui, sans-serif;', '}']), target: '.box' },
      related: ['background-color', 'border', 'padding'],
      keywords: ['gradient text', 'clip background']
    },
    {
      name: 'opacity', group: 'Colour & background', short: 'see-through-ness',
      summary: 'How see-through the whole element is, including its content and children. 1 is solid, 0 is invisible.',
      description: 'An element at opacity 0 is invisible but still there: it takes space and can still be clicked. To fade only the background, use a colour with alpha instead (e.g. `rgb(0 0 0 / 50%)`).',
      initial: '1', inherited: false,
      values: [
        { value: '1', desc: 'Fully opaque (the default).', example: true },
        { value: '0.75', desc: '75% opaque.', example: true },
        { value: '0.5', desc: 'Half see-through.', example: true },
        { value: '0.2', desc: 'Mostly see-through.', example: true },
        { value: '0', desc: 'Invisible, but still taking space and still clickable.', example: true }
      ],
      inputs: [{ type: 'number', label: 'Custom opacity', min: 0, max: 1, step: 0.05, value: 0.6 }],
      start: '0.5',
      demo: { preset: 'box', html: '<div class="stripes">\n  <div class="box">Box with <b>text</b></div>\n</div>', css: '.stripes {\n  padding: 14px;\n  background: repeating-linear-gradient(45deg, #fff 0 10px, #e3e8f2 10px 20px);\n}' },
      tips: ['Fade elements in and out with `transition: opacity .3s`.'],
      related: ['visibility', 'color', 'filter', 'transition'],
      keywords: ['transparency', 'fade', 'alpha', 'see-through', 'transparent']
    }
  );
})(window.UILT);
