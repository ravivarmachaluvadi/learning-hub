/*
 * CSS properties, part 3: layout. Display and visibility, flexbox, grid, positioning.
 * Entry shape: see css-0-shared.js.
 */
(function (U) {
  var P = U.data.cssProperties;
  function css(lines) { return lines.join('\n'); }

  var FLEX_JAVA = 'Flexbox is a layout manager, like Swing\'s `BoxLayout` or JavaFX\'s `HBox`/`VBox`: the container arranges its children along one axis, and each child can say how much to grow or shrink.';
  var GRID_JAVA = 'Grid is the `GridBagLayout` you always wished for: define rows and columns on the container, then place children into cells, letting them span several.';

  P.push(
    /* ---------- Display and visibility ---------- */
    {
      name: 'display', group: 'Display & visibility', short: 'block, inline, flex, grid, none…',
      summary: 'The most important layout property: how the element sits among its neighbours (block or inline), and how it lays out its own children (normal flow, flex or grid).',
      description: 'The orange box is a `<span>` with `width: 200px; height: 80px`. Watch how each value changes both the box (does it start a new line? does it respect width?) and its three children A, B, C.',
      initial: 'inline', inherited: false,
      values: [
        { value: 'block', desc: 'Starts on a new line and takes the full width (unless width is set). Width and height work. The default for div, p, h1, section…' },
        { value: 'inline', desc: 'Flows inside the line of text, as wide as its content. Width, height and vertical margins are ignored. The default for span, a, strong…' },
        { value: 'inline-block', desc: 'Sits in the line like inline, but is a real box: width, height and margins work. Good for buttons and badges.' },
        { value: 'flex', desc: 'A block whose children are laid out by flexbox: in a row by default, with easy alignment and spacing.' },
        { value: 'inline-flex', desc: 'Flexbox inside, but the box itself flows inline.' },
        { value: 'grid', desc: 'A block whose children are laid out on a grid of rows and columns (one column until you define more).' },
        { value: 'flow-root', desc: 'Like block, but contains floats and stops margins collapsing through it.' },
        { value: 'list-item', desc: 'A block with a list bullet, like `<li>`.' },
        { value: 'contents', desc: 'The box itself disappears; its children act as if they were the parent\'s children.' },
        { value: 'none', desc: 'Not displayed at all and takes no space, as if removed from the page. (`visibility: hidden` hides but keeps the space.)' }
      ],
      start: 'block',
      demo: {
        html: '<p>Text before\n  <span class="target">\n    <span class="kid">A</span><span class="kid">B</span><span class="kid">C</span>\n  </span>\n  and text after the element.</p>',
        css: css(['.target {', '  width: 200px;', '  height: 80px;', '  padding: 6px;', '  background: #ffe7c2;', '  border: 2px solid #ff7a1a;', '}',
          '.kid {', '  padding: 4px 10px;', '  margin: 2px;', '  background: #4f6fd8;', '  color: white;', '}']),
        target: '.target'
      },
      compareHeight: 170,
      java: 'Choosing `display` is like choosing a component\'s layout manager *and* how it is placed in its parent: `flex` ≈ `BoxLayout`, `grid` ≈ `GridBagLayout`, `none` ≈ `setVisible(false)`.',
      tips: ['Every element has a default display - the HTML reference shows it for each tag. Most layout problems start by checking it.'],
      mistakes: ['Setting `width` on an inline element and wondering why nothing happens.'],
      related: ['visibility', 'flex-direction', 'grid-template-columns', 'float', 'lesson:css-display', 'explain:flexbox'],
      keywords: ['block', 'inline', 'inline-block', 'flex', 'grid', 'none', 'hide', 'layout']
    },
    {
      name: 'visibility', group: 'Display & visibility', short: 'hide but keep the space',
      summary: 'Hides an element while keeping its space in the layout.',
      description: 'Compare with `display: none`, which removes the space too. The middle box is the one being changed. A hidden element cannot be clicked or focused.',
      initial: 'visible', inherited: true,
      values: [
        { value: 'visible', desc: 'Shown (the default).' },
        { value: 'hidden', desc: 'Invisible, but the gap stays: neighbours do not move.' },
        { value: 'collapse', desc: 'For table rows and columns: removes them like display none. On other elements, the same as hidden.' }
      ],
      start: 'hidden',
      demo: { preset: 'flexItem', css: '.container {\n  height: auto;\n}' },
      related: ['display', 'opacity'],
      keywords: ['hide', 'hidden', 'invisible', 'show']
    },
    {
      name: 'overflow', group: 'Display & visibility', short: 'when content is too big',
      summary: 'What happens when the content is bigger than its box: spill out, get cut off, or scroll.',
      description: 'The demo box is 90px tall with more text than fits. Separate control per axis: `overflow-x`, `overflow-y`.',
      initial: 'visible', inherited: false,
      values: [
        { value: 'visible', desc: 'The content spills out of the box and overlaps what follows (the default).' },
        { value: 'hidden', desc: 'Cut off at the box edge. The hidden part can still be reached by scripts.' },
        { value: 'clip', desc: 'Cut off, and no scrolling at all, even from scripts.' },
        { value: 'scroll', desc: 'Always show scroll bars, even when not needed.' },
        { value: 'auto', desc: 'Show scroll bars only when needed. Usually what you want.' }
      ],
      start: 'auto',
      demo: {
        html: '<div class="box">Overflow is what happens when content does not fit. This box is only 90px tall, but this text needs more room than that. More text, more lines, until it spills.</div>\n<p>The next paragraph.</p>',
        css: css(['.box {', '  width: 240px;', '  height: 90px;', '  padding: 6px;', '  background: #eef1fb;', '  border: 2px dashed #9aa3b8;', '}']),
        target: '.box'
      },
      compareHeight: 190,
      related: ['max-height', 'text-overflow', 'white-space'],
      keywords: ['scroll', 'scrollbar', 'clip', 'hidden', 'spill']
    },

    /* ---------- Flexbox ---------- */
    {
      name: 'flex-direction', group: 'Flexbox', short: 'row or column',
      summary: 'The direction of a flex container\'s main axis: lay the children out in a row or a column, forwards or reversed.',
      description: 'Everything else in flexbox follows this axis: `justify-content` works along it and `align-items` across it. Set on the container (`display: flex`).',
      initial: 'row', inherited: false, appliesTo: 'flex containers',
      values: [
        { value: 'row', desc: 'Left to right (in left-to-right languages). The default.' },
        { value: 'row-reverse', desc: 'Right to left, starting at the right edge.' },
        { value: 'column', desc: 'Top to bottom.' },
        { value: 'column-reverse', desc: 'Bottom to top, starting at the bottom.' }
      ],
      start: 'column', demo: 'flex', compareHeight: 200,
      java: FLEX_JAVA,
      mistakes: ['Using `row-reverse` to reorder items for looks: keyboard and screen-reader order still follows the HTML.'],
      related: ['justify-content', 'align-items', 'flex-wrap', 'explain:flexbox', 'lesson:css-flex-container'],
      keywords: ['flexbox', 'row', 'column', 'direction', 'axis']
    },
    {
      name: 'flex-wrap', group: 'Flexbox', short: 'one line or several',
      summary: 'Whether flex items must squeeze onto one line or may wrap onto several.',
      description: 'The demo has 7 items of 70px in a 300px container: they do not fit on one line.',
      initial: 'nowrap', inherited: false, appliesTo: 'flex containers',
      values: [
        { value: 'nowrap', desc: 'One line only: items shrink, and may overflow (the default).' },
        { value: 'wrap', desc: 'Start a new line when full.' },
        { value: 'wrap-reverse', desc: 'Wrap, but the new lines stack upwards.' }
      ],
      start: 'wrap', demo: 'flexWrap', compareHeight: 220,
      java: FLEX_JAVA,
      related: ['flex-flow', 'align-content', 'gap', 'explain:flexbox'],
      keywords: ['wrap', 'multi-line', 'flexbox']
    },
    {
      name: 'flex-flow', group: 'Flexbox', short: 'direction + wrap in one',
      summary: 'Shorthand for `flex-direction` and `flex-wrap` together.',
      description: 'For example `flex-flow: column wrap`.',
      initial: 'row nowrap', inherited: false, appliesTo: 'flex containers',
      values: [
        { value: 'row nowrap', desc: 'The default.', example: true },
        { value: 'row wrap', desc: 'Rows that wrap.', example: true },
        { value: 'column wrap', desc: 'Columns that wrap into new columns when the container is too short.', example: true },
        { value: 'row-reverse wrap', desc: 'Reversed rows that wrap.', example: true }
      ],
      start: 'row wrap', demo: 'flexWrap', compareHeight: 220,
      related: ['flex-direction', 'flex-wrap'],
      keywords: ['flexbox', 'shorthand']
    },
    {
      name: 'justify-content', group: 'Flexbox', short: 'spread items along the main axis',
      summary: 'How flex (or grid) items are positioned along the main axis, and how the leftover space is shared.',
      description: 'In a row, this is horizontal alignment. The space-* values are the easiest way to spread out navigation links or toolbar buttons. Also works on grid containers.',
      initial: 'normal (behaves as flex-start)', inherited: false, appliesTo: 'flex and grid containers',
      values: [
        { value: 'flex-start', desc: 'Packed at the start.' },
        { value: 'flex-end', desc: 'Packed at the end.' },
        { value: 'center', desc: 'Packed in the middle. Half of the classic "centre anything" recipe.' },
        { value: 'space-between', desc: 'First item at the start, last at the end, equal gaps between.' },
        { value: 'space-around', desc: 'Equal space around each item (so the edge gaps are half the middle gaps).' },
        { value: 'space-evenly', desc: 'Exactly equal gaps everywhere, edges included.' }
      ],
      start: 'center', demo: 'flex', compareHeight: 200,
      java: FLEX_JAVA,
      tips: ['Centre anything inside a box: `display: flex; justify-content: center; align-items: center;`.'],
      related: ['align-items', 'flex-direction', 'gap', 'place-content', 'explain:flexbox', 'lesson:css-flex-container'],
      keywords: ['centre', 'center', 'horizontal align', 'space-between', 'flexbox', 'align horizontally', 'spread']
    },
    {
      name: 'align-items', group: 'Flexbox', short: 'align items across the axis',
      summary: 'How flex (or grid) items line up on the cross axis: in a row, their vertical alignment.',
      description: 'Item "Two" is taller than the others, so you can see the difference. `stretch` (the default) makes items as tall as the line.',
      initial: 'normal (behaves as stretch)', inherited: false, appliesTo: 'flex and grid containers',
      values: [
        { value: 'stretch', desc: 'Items stretch to fill the cross axis (if they have no fixed height).' },
        { value: 'flex-start', desc: 'Aligned to the top (cross-axis start).' },
        { value: 'flex-end', desc: 'Aligned to the bottom.' },
        { value: 'center', desc: 'Centred vertically. The other half of the centring recipe.' },
        { value: 'baseline', desc: 'The first lines of text line up, whatever the item sizes.' }
      ],
      start: 'center', demo: 'flex', compareHeight: 200,
      java: FLEX_JAVA,
      related: ['justify-content', 'align-self', 'align-content', 'place-items', 'explain:flexbox'],
      keywords: ['vertical align', 'centre vertically', 'center vertically', 'center', 'centre', 'flexbox', 'stretch']
    },
    {
      name: 'align-content', group: 'Flexbox', short: 'spread the lines (when wrapping)',
      summary: 'With several lines of wrapped items, how the lines are spread out across the cross axis.',
      description: 'Only has an effect when there is more than one line (`flex-wrap: wrap`) and spare space. The demo container is 190px tall with two lines.',
      initial: 'normal (behaves as stretch)', inherited: false, appliesTo: 'multi-line flex containers and grid containers',
      values: [
        { value: 'stretch', desc: 'Lines stretch to share the space.' },
        { value: 'flex-start', desc: 'Lines packed at the top.' },
        { value: 'flex-end', desc: 'Lines packed at the bottom.' },
        { value: 'center', desc: 'Lines packed in the middle.' },
        { value: 'space-between', desc: 'First line at the top, last at the bottom.' },
        { value: 'space-around', desc: 'Equal space around each line.' },
        { value: 'space-evenly', desc: 'Exactly equal gaps.' }
      ],
      start: 'center', demo: 'flexWrap', compareHeight: 220,
      related: ['align-items', 'flex-wrap', 'justify-content'],
      keywords: ['flexbox', 'lines', 'wrap alignment']
    },
    {
      name: 'gap', group: 'Flexbox', short: 'space between items',
      summary: 'Space between flex or grid items - only between them, never at the outer edges.',
      description: 'One value for both directions, or two: row gap then column gap. Much simpler than margins on every item. (In the demo, item margins are switched off.)',
      initial: 'normal (0 in flexbox)', inherited: false, appliesTo: 'flex, grid and multi-column containers',
      values: [
        { value: '0', desc: 'No gaps.', example: true },
        { value: '8px', desc: '8px between items in both directions.', example: true },
        { value: '20px', desc: '20px between items.', example: true },
        { value: '20px 4px', desc: '20px between rows, 4px between columns.', example: true },
        { value: '1em', desc: 'Relative to the font size.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom gap', min: 0, max: 40, value: 12, units: ['px', 'em', '%'] }],
      start: '8px',
      demo: { preset: 'flexWrap', css: '.item {\n  margin: 0;\n}' },
      compareHeight: 220,
      related: ['margin', 'justify-content', 'grid-template-columns'],
      keywords: ['spacing', 'gutter', 'row-gap', 'column-gap', 'space between']
    },
    {
      name: 'order', group: 'Flexbox', short: 'visual order of an item',
      summary: 'Changes where one flex or grid item appears, without changing the HTML.',
      description: 'Items are sorted by `order` (default 0), then by their position in the HTML. The orange item is the one being changed.',
      initial: '0', inherited: false, appliesTo: 'flex and grid items',
      values: [
        { value: '-1', desc: 'Before all the default (0) items.', example: true },
        { value: '0', desc: 'Normal HTML order.', example: true },
        { value: '1', desc: 'After all the default items.', example: true },
        { value: '5', desc: 'Also last: only the comparison between numbers matters.', example: true }
      ],
      inputs: [{ type: 'number', label: 'Custom order', min: -5, max: 5, value: 1 }],
      start: '-1', demo: 'flexItem',
      mistakes: ['Reordering important content visually: keyboard Tab order and screen readers still follow the HTML.'],
      related: ['flex-direction', 'grid-row'],
      keywords: ['reorder', 'sort', 'position']
    },
    {
      name: 'flex-grow', group: 'Flexbox', short: 'take spare space',
      summary: 'How much of the spare space in the container a flex item takes, relative to the others.',
      description: 'All items start at 70px (`flex-basis`) and the container has room to spare. With 0 (default) the spare space stays empty; with 1 the orange item takes all of it; with 2 it takes twice the share of an item with 1.',
      initial: '0', inherited: false, appliesTo: 'flex items',
      values: [
        { value: '0', desc: 'Do not grow (the default).', example: true },
        { value: '1', desc: 'Take a share of the spare space.', example: true },
        { value: '3', desc: 'Take three shares. Only meaningful compared to the other items\' values.', example: true }
      ],
      inputs: [{ type: 'number', label: 'Custom grow', min: 0, max: 10, value: 2 }],
      start: '1', demo: 'flexItem',
      java: FLEX_JAVA,
      related: ['flex-shrink', 'flex-basis', 'flex', 'explain:flexbox', 'lesson:css-flex-items'],
      keywords: ['grow', 'expand', 'fill space', 'flexbox']
    },
    {
      name: 'flex-shrink', group: 'Flexbox', short: 'give up space when tight',
      summary: 'How much a flex item shrinks, relative to the others, when there is not enough room.',
      description: 'Here the items want 120px each but the container is only 260px wide, so they must shrink. 0 means "never shrink" - the orange item keeps its 120px and the others squeeze.',
      initial: '1', inherited: false, appliesTo: 'flex items',
      values: [
        { value: '0', desc: 'Never shrink below the flex-basis.', example: true },
        { value: '1', desc: 'Shrink as much as the others (the default).', example: true },
        { value: '4', desc: 'Shrink four times as much as the others.', example: true }
      ],
      inputs: [{ type: 'number', label: 'Custom shrink', min: 0, max: 10, value: 2 }],
      start: '0',
      demo: { preset: 'flexItem', css: '.container {\n  width: 260px;\n}\n.item {\n  flex-basis: 120px;\n}' },
      related: ['flex-grow', 'flex-basis', 'flex', 'min-width'],
      keywords: ['shrink', 'squeeze', 'flexbox']
    },
    {
      name: 'flex-basis', group: 'Flexbox', short: 'starting size of an item',
      summary: 'The starting size of a flex item along the main axis, before growing or shrinking.',
      description: 'Think of it as `width` for a row (or `height` for a column), but flexbox-aware. `auto` means "use my width, or my content size".',
      initial: 'auto', inherited: false, appliesTo: 'flex items',
      values: [
        { value: 'auto', desc: 'Use the item\'s width (or its content\'s size if there is none).' },
        { value: 'content', desc: 'Size from the content.' },
        { value: '0', desc: 'Start from nothing; size comes only from flex-grow.', example: true },
        { value: '150px', desc: 'Start at 150px.', example: true },
        { value: '50%', desc: 'Start at half the container.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom basis', min: 0, max: 400, value: 150, units: ['px', '%', 'em'] }],
      start: '150px', demo: 'flexItem',
      related: ['flex-grow', 'flex-shrink', 'width', 'flex'],
      keywords: ['basis', 'starting width', 'flexbox']
    },
    {
      name: 'flex', group: 'Flexbox', short: 'grow + shrink + basis',
      summary: 'Shorthand for `flex-grow`, `flex-shrink` and `flex-basis`. `flex: 1` is the one you will write most.',
      description: '`flex: 1` means "grow, shrink, start from 0": items with `flex: 1` share the space equally. `flex: none` means "stay exactly my size".',
      initial: '0 1 auto', inherited: false, appliesTo: 'flex items',
      values: [
        { value: 'none', desc: '`0 0 auto`: neither grow nor shrink.' },
        { value: 'auto', desc: '`1 1 auto`: grow and shrink, starting from its own size.' },
        { value: '1', desc: '`1 1 0%`: share the space equally with other `flex: 1` items.', example: true },
        { value: '2', desc: 'Two shares of the space.', example: true },
        { value: '0 0 150px', desc: 'Exactly 150px: no growing, no shrinking.', example: true },
        { value: '1 1 100px', desc: 'Start at 100px, then grow or shrink.', example: true }
      ],
      start: '1', demo: 'flexItem',
      tips: ['Equal columns: give every item `flex: 1`.'],
      related: ['flex-grow', 'flex-shrink', 'flex-basis', 'lesson:css-flex-items'],
      keywords: ['flex shorthand', 'equal columns', 'flexbox']
    },
    {
      name: 'align-self', group: 'Flexbox', short: 'override align-items for one item',
      summary: 'Aligns one flex or grid item on the cross axis, overriding the container\'s `align-items`.',
      description: 'Only the orange item moves.',
      initial: 'auto', inherited: false, appliesTo: 'flex and grid items',
      values: [
        { value: 'auto', desc: 'Follow the container\'s align-items.' },
        { value: 'flex-start', desc: 'Top.' },
        { value: 'flex-end', desc: 'Bottom.' },
        { value: 'center', desc: 'Middle.' },
        { value: 'baseline', desc: 'Line up text baselines.' },
        { value: 'stretch', desc: 'Fill the height.' }
      ],
      start: 'flex-end', demo: 'flexItem',
      related: ['align-items', 'justify-self'],
      keywords: ['align one item', 'flexbox']
    },

    /* ---------- Grid ---------- */
    {
      name: 'grid-template-columns', group: 'Grid', short: 'define the columns',
      summary: 'Defines the columns of a grid: how many, and how wide each one is.',
      description: 'Each value is one column. `fr` means "a fraction of the free space": `1fr 2fr` gives the second column twice the width of the first. `repeat(3, 1fr)` is three equal columns. `repeat(auto-fill, minmax(80px, 1fr))` makes as many columns as fit - a responsive grid with no media queries. Drag the preview narrower to see it.',
      initial: 'none', inherited: false, appliesTo: 'grid containers',
      values: [
        { value: 'none', desc: 'No explicit columns: a single column.' },
        { value: '100px 100px 100px', desc: 'Three fixed 100px columns.', example: true },
        { value: '1fr 1fr 1fr', desc: 'Three equal columns sharing the width.', example: true },
        { value: '1fr 2fr', desc: 'Two columns; the second is twice as wide.', example: true },
        { value: '150px 1fr', desc: 'A fixed sidebar and a flexible main column.', example: true },
        { value: 'repeat(4, 1fr)', desc: 'Four equal columns, written short.', example: true },
        { value: 'repeat(auto-fill, minmax(80px, 1fr))', desc: 'As many columns of at least 80px as fit. Responsive.', example: true },
        { value: 'min-content auto', desc: 'First column as narrow as its content allows.', example: true }
      ],
      inputs: [{ type: 'builder', label: 'Equal columns', format: 'repeat({0}, 1fr)', parts: [{ label: 'how many', type: 'number', min: 1, max: 6, value: 3 }] }],
      start: '1fr 2fr', demo: 'grid', compareHeight: 200,
      java: GRID_JAVA,
      related: ['grid-template-rows', 'gap', 'grid-column', 'grid-template-areas', 'explain:grid', 'lesson:css-grid'],
      keywords: ['columns', 'grid', 'fr', 'repeat', 'minmax', 'auto-fill', 'responsive grid', 'layout']
    },
    {
      name: 'grid-template-rows', group: 'Grid', short: 'define the rows',
      summary: 'Defines the rows of a grid and their heights.',
      description: 'Same syntax as columns. Rows you do not define are created automatically as needed (their size comes from `grid-auto-rows`).',
      initial: 'none', inherited: false, appliesTo: 'grid containers',
      values: [
        { value: 'none', desc: 'No explicit rows: rows are created as needed, sized by content.' },
        { value: '40px 80px', desc: 'First row 40px, second 80px.', example: true },
        { value: '1fr 2fr', desc: 'Share the container\'s height 1:2.', example: true },
        { value: 'repeat(2, 60px)', desc: 'Two 60px rows.', example: true },
        { value: 'auto 1fr', desc: 'First row fits its content, the second takes the rest.', example: true }
      ],
      start: '40px 80px', demo: 'grid', compareHeight: 200,
      related: ['grid-template-columns', 'grid-auto-rows', 'explain:grid'],
      keywords: ['rows', 'grid', 'row height']
    },
    {
      name: 'grid-template-areas', group: 'Grid', short: 'draw the layout with names',
      summary: 'Draws the layout as a picture made of names; each child then says which area it goes in (`grid-area: header`).',
      description: 'Each quoted string is one row, each word one cell. Repeating a name makes the area span those cells. The demo\'s children already have `grid-area: header`, `nav`, `main`, `footer` - only this property changes.',
      initial: 'none', inherited: false, appliesTo: 'grid containers',
      values: [
        { value: 'none', desc: 'No named areas.' },
        { value: '"header header" "nav main" "footer footer"', desc: 'A classic page: header on top, nav beside main, footer at the bottom.', example: true },
        { value: '"header header" "main nav" "footer footer"', desc: 'The same, with the sidebar on the right - only the CSS changed.', example: true },
        { value: '"nav header" "nav main" "nav footer"', desc: 'A full-height sidebar.', example: true }
      ],
      start: '"header header" "nav main" "footer footer"', demo: 'gridAreas', compareHeight: 220,
      java: GRID_JAVA,
      tips: ['Combine with a media query to rearrange the whole page on phones by changing only this property.'],
      related: ['grid-area', 'grid-template-columns', 'explain:grid', 'lesson:css-grid'],
      keywords: ['named areas', 'layout', 'page layout', 'grid']
    },
    {
      name: 'grid-auto-flow', group: 'Grid', short: 'how items fill the grid',
      summary: 'How items without an explicit position fill the grid: row by row or column by column, and whether to fill holes.',
      description: 'Items 1 and 2 span 2 and 3 columns, which leaves a hole in the first row. `dense` lets later items fill such holes.',
      initial: 'row', inherited: false, appliesTo: 'grid containers',
      values: [
        { value: 'row', desc: 'Fill each row, then go to the next (the default).' },
        { value: 'column', desc: 'Fill each column, then go to the next.' },
        { value: 'dense', desc: 'Row by row, but go back and fill earlier holes with smaller items.' },
        { value: 'column dense', desc: 'Column by column, filling holes.', example: true }
      ],
      start: 'dense',
      demo: {
        html: '<div class="grid">\n  <div class="cell wide2">1</div>\n  <div class="cell wide3">2</div>\n  <div class="cell">3</div>\n  <div class="cell">4</div>\n  <div class="cell">5</div>\n</div>',
        css: css(['.grid {', '  display: grid;', '  grid-template-columns: repeat(4, 60px);', '  grid-template-rows: repeat(3, 34px);', '  gap: 6px;', '}',
          '.cell {', '  padding: 4px;', '  background: #4f6fd8;', '  color: white;', '  border-radius: 6px;', '}',
          '.wide2 { grid-column: span 2; }', '.wide3 { grid-column: span 3; background: #ff7a1a; }']),
        target: '.grid'
      },
      related: ['grid-column', 'grid-template-columns'],
      keywords: ['dense', 'auto placement', 'grid']
    },
    {
      name: 'grid-auto-rows', group: 'Grid', short: 'size of automatic rows',
      summary: 'The height of rows the grid creates automatically (the ones you did not list in `grid-template-rows`).',
      description: 'Typical for card grids: you do not know how many rows there will be, but each should be the same height.',
      initial: 'auto', inherited: false, appliesTo: 'grid containers',
      values: [
        { value: 'auto', desc: 'Each row as tall as its tallest item.' },
        { value: 'min-content', desc: 'As small as the content allows.' },
        { value: '40px', desc: 'Every row 40px.', example: true },
        { value: '70px', desc: 'Every row 70px.', example: true },
        { value: 'minmax(50px, auto)', desc: 'At least 50px, taller if the content needs it.', example: true }
      ],
      start: '70px',
      demo: { preset: 'grid', css: '.grid {\n  min-height: 0;\n}' },
      related: ['grid-template-rows', 'grid-auto-flow'],
      keywords: ['implicit rows', 'grid']
    },
    {
      name: 'grid-column', group: 'Grid', short: 'which columns an item covers',
      summary: 'Places a grid item between column lines, or makes it span several columns.',
      description: 'Grid lines are numbered from 1 at the left edge; -1 is the last line. `1 / 3` means "from line 1 to line 3" (two columns). `span 2` means "two columns wide, wherever you land". The grid has 4 columns; the orange item is item 2.',
      initial: 'auto', inherited: false, appliesTo: 'grid items',
      values: [
        { value: 'auto', desc: 'Placed automatically, one column wide.' },
        { value: 'span 2', desc: 'Two columns wide.', example: true },
        { value: 'span 3', desc: 'Three columns wide.', example: true },
        { value: '1 / 3', desc: 'From line 1 to line 3: the first two columns.', example: true },
        { value: '2 / -1', desc: 'From line 2 to the last line.', example: true },
        { value: '1 / -1', desc: 'The full width of the grid.', example: true },
        { value: '4', desc: 'Only in column 4.', example: true }
      ],
      start: 'span 2', demo: 'gridItem',
      java: GRID_JAVA,
      related: ['grid-row', 'grid-area', 'grid-template-columns', 'explain:grid'],
      keywords: ['span', 'column span', 'grid lines', 'place item']
    },
    {
      name: 'grid-row', group: 'Grid', short: 'which rows an item covers',
      summary: 'Places a grid item between row lines, or makes it span several rows.',
      description: 'Same as `grid-column`, but vertical.',
      initial: 'auto', inherited: false, appliesTo: 'grid items',
      values: [
        { value: 'auto', desc: 'Placed automatically, one row tall.' },
        { value: 'span 2', desc: 'Two rows tall.', example: true },
        { value: '1 / 3', desc: 'From row line 1 to 3.', example: true },
        { value: '2 / 4', desc: 'Rows 2 and 3.', example: true },
        { value: 'span 3', desc: 'Three rows tall.', example: true }
      ],
      start: 'span 2', demo: 'gridItem',
      related: ['grid-column', 'grid-area'],
      keywords: ['row span', 'grid lines']
    },
    {
      name: 'grid-area', group: 'Grid', short: 'name or place an item',
      summary: 'Either names the area an item belongs to (`grid-area: header`, used with `grid-template-areas`), or places it with four line numbers: row-start / column-start / row-end / column-end.',
      description: 'The demo uses line numbers on the orange item.',
      initial: 'auto', inherited: false, appliesTo: 'grid items',
      values: [
        { value: 'auto', desc: 'Automatic placement.' },
        { value: '1 / 1 / 3 / 3', desc: 'Top-left two-by-two block.', example: true },
        { value: '2 / 2 / 4 / 5', desc: 'Rows 2-3, columns 2-4.', example: true },
        { value: 'span 2 / span 2', desc: 'Two rows by two columns, placed automatically.', example: true }
      ],
      start: '1 / 1 / 3 / 3', demo: 'gridItem',
      related: ['grid-template-areas', 'grid-column', 'grid-row'],
      keywords: ['area', 'place item', 'grid']
    },
    {
      name: 'justify-items', group: 'Grid', short: 'align items inside their cells (horizontally)',
      summary: 'How every grid item is aligned horizontally inside its own cell.',
      description: 'By default items stretch to fill the cell. With other values they shrink to their content and move within the cell.',
      initial: 'legacy (behaves as stretch)', inherited: false, appliesTo: 'grid containers',
      values: [
        { value: 'stretch', desc: 'Fill the cell\'s width.' },
        { value: 'start', desc: 'Left side of the cell.' },
        { value: 'end', desc: 'Right side of the cell.' },
        { value: 'center', desc: 'Centred in the cell.' }
      ],
      start: 'center', demo: 'grid', compareHeight: 200,
      related: ['justify-self', 'align-items', 'place-items'],
      keywords: ['align in cell', 'grid', 'center', 'centre']
    },
    {
      name: 'justify-self', group: 'Grid', short: 'align one item in its cell',
      summary: 'Aligns one grid item horizontally inside its cell, overriding `justify-items`.',
      description: 'Only the orange item moves. (In flexbox this property is ignored; use margins there.)',
      initial: 'auto', inherited: false, appliesTo: 'grid items',
      values: [
        { value: 'auto', desc: 'Follow justify-items.' },
        { value: 'stretch', desc: 'Fill the cell.' },
        { value: 'start', desc: 'Left.' },
        { value: 'end', desc: 'Right.' },
        { value: 'center', desc: 'Centred.' }
      ],
      start: 'center', demo: 'gridItem',
      related: ['justify-items', 'align-self'],
      keywords: ['grid', 'align one item']
    },
    {
      name: 'place-items', group: 'Grid', short: 'align-items + justify-items',
      summary: 'Shorthand for `align-items` and `justify-items`: one value sets both.',
      description: '`place-items: center` on a grid container centres every item in its cell, in both directions - the shortest centring recipe in CSS.',
      initial: 'normal', inherited: false, appliesTo: 'grid (and partly flex) containers',
      values: [
        { value: 'stretch', desc: 'Fill each cell.', example: true },
        { value: 'center', desc: 'Centre in both directions.', example: true },
        { value: 'start', desc: 'Top-left of each cell.', example: true },
        { value: 'end', desc: 'Bottom-right of each cell.', example: true },
        { value: 'center start', desc: 'Vertically centred, horizontally at the start.', example: true }
      ],
      start: 'center', demo: 'grid', compareHeight: 200,
      tips: ['Centre one child in a box: `display: grid; place-items: center;`.'],
      related: ['align-items', 'justify-items', 'place-content'],
      keywords: ['centre', 'center', 'grid', 'shorthand']
    },
    {
      name: 'place-content', group: 'Grid', short: 'move the whole grid',
      summary: 'Shorthand for `align-content` and `justify-content`: moves the whole set of tracks when the grid is smaller than its container.',
      description: 'The demo grid has three 60px columns and two 40px rows inside a bigger box, so there is space to move them around.',
      initial: 'normal', inherited: false, appliesTo: 'grid and flex containers',
      values: [
        { value: 'center', desc: 'The grid sits in the middle of the box.', example: true },
        { value: 'start', desc: 'Top-left.', example: true },
        { value: 'end', desc: 'Bottom-right.', example: true },
        { value: 'space-between', desc: 'Tracks pushed to the edges.', example: true },
        { value: 'space-evenly', desc: 'Equal gaps everywhere.', example: true },
        { value: 'center end', desc: 'Vertically centred, horizontally at the end.', example: true }
      ],
      start: 'center',
      demo: { preset: 'grid', css: '.grid {\n  grid-template-columns: repeat(3, 60px);\n  grid-auto-rows: 40px;\n  height: 190px;\n}' },
      compareHeight: 220,
      related: ['justify-content', 'align-content', 'place-items'],
      keywords: ['centre grid', 'center grid', 'grid', 'shorthand']
    },

    /* ---------- Positioning ---------- */
    {
      name: 'position', group: 'Positioning', short: 'static, relative, absolute, fixed, sticky',
      summary: 'How an element is positioned: in the normal flow, nudged from its place, pinned to an ancestor, pinned to the screen, or sticking while scrolling.',
      description: 'The orange box has `top: 20px; left: 40px`, and those offsets only work once position is not `static`. Its parent (dashed) has `position: relative`, which makes it the reference for `absolute`. Scroll inside the grey frame to see `sticky` and `fixed`.',
      initial: 'static', inherited: false,
      values: [
        { value: 'static', desc: 'Normal flow; top/left are ignored (the default).' },
        { value: 'relative', desc: 'Moved from its normal place by top/left, but its original space stays reserved. Also makes it the reference for absolute children.' },
        { value: 'absolute', desc: 'Taken out of the flow (others close the gap) and placed relative to the nearest positioned ancestor - here the dashed parent.' },
        { value: 'fixed', desc: 'Taken out of the flow and pinned to the viewport (here the preview): it stays put while you scroll.' },
        { value: 'sticky', desc: 'Normal flow until scrolling would move it past top: 20px, then it sticks there while its parent is visible.' }
      ],
      start: 'relative',
      demo: {
        html: '<div class="scroller">\n  <p>Scroll inside this frame ↓</p>\n  <div class="parent">\n    <div class="box">Box</div>\n    <p>The dashed parent has position: relative. The box has top: 20px; left: 40px.</p>\n  </div>\n  <p>More content…</p><p>More content…</p><p>More content…</p><p>More content…</p><p>The end.</p>\n</div>',
        css: css(['.scroller {', '  height: 210px;', '  overflow: auto;', '  padding: 0 10px;', '  background: #f3f5fb;', '  border: 2px solid #9aa3b8;', '}',
          '.parent {', '  position: relative;', '  padding: 8px;', '  border: 2px dashed #4f6fd8;', '}',
          '.box {', '  top: 20px;', '  left: 40px;', '  width: 80px;', '  padding: 8px;', '  background: #ff7a1a;', '  color: white;', '}']),
        target: '.box'
      },
      hint: 'scroll inside the frame', previewHeight: 250, compareHeight: 240,
      java: 'There is no exact Swing match: `static`/`relative` are like a layout manager placing the component, while `absolute`/`fixed` are like a null layout with `setBounds()` relative to a container or the window.',
      mistakes: ['`position: absolute` with no positioned ancestor: the element is placed relative to the whole page and flies off somewhere unexpected. Give the intended parent `position: relative`.'],
      related: ['top', 'inset', 'z-index', 'explain:positioning', 'lesson:css-position'],
      keywords: ['absolute', 'relative', 'fixed', 'sticky', 'static', 'positioning', 'overlay']
    },
    {
      name: 'top', group: 'Positioning', short: 'offset from the top',
      summary: 'For a positioned element: the distance from the top edge of its reference box.',
      description: 'The orange box is `position: absolute` inside a `position: relative` parent. `top`, `right`, `bottom` and `left` work the same way, each from its own edge.',
      initial: 'auto', inherited: false, appliesTo: 'positioned elements',
      values: [
        { value: 'auto', desc: 'No offset: stays where the flow would put it.' },
        { value: '0', desc: 'Touching the top edge.', example: true },
        { value: '40px', desc: '40px down from the top.', example: true },
        { value: '50%', desc: 'Half the parent\'s height down.', example: true },
        { value: '-10px', desc: 'Pokes out above the parent.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom offset', min: -40, max: 160, value: 30, units: ['px', '%', 'em'] }],
      start: '40px', demo: 'positioned',
      related: ['position', 'bottom', 'left', 'right', 'inset'],
      keywords: ['offset', 'positioning']
    },
    {
      name: 'right', group: 'Positioning', short: 'offset from the right',
      summary: 'For a positioned element: the distance from the right edge of its reference box.',
      description: 'Combining `left` and `right` on an absolute element without a width stretches it between them.',
      initial: 'auto', inherited: false, appliesTo: 'positioned elements',
      values: [
        { value: 'auto', desc: 'No offset.' },
        { value: '0', desc: 'Touching the right edge.', example: true },
        { value: '30px', desc: '30px in from the right.', example: true },
        { value: '50%', desc: 'Half the parent\'s width in from the right.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom offset', min: -40, max: 300, value: 30, units: ['px', '%'] }],
      start: '0', demo: 'positioned',
      related: ['left', 'top', 'position', 'inset'],
      keywords: ['offset', 'positioning']
    },
    {
      name: 'bottom', group: 'Positioning', short: 'offset from the bottom',
      summary: 'For a positioned element: the distance from the bottom edge of its reference box.',
      description: 'Handy for things pinned to the bottom, like a "back to top" button (`position: fixed; bottom: 20px; right: 20px`).',
      initial: 'auto', inherited: false, appliesTo: 'positioned elements',
      values: [
        { value: 'auto', desc: 'No offset.' },
        { value: '0', desc: 'Touching the bottom edge.', example: true },
        { value: '20px', desc: '20px up from the bottom.', example: true },
        { value: '50%', desc: 'Half way up.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom offset', min: -40, max: 160, value: 20, units: ['px', '%'] }],
      start: '0', demo: 'positioned',
      related: ['top', 'position', 'inset'],
      keywords: ['offset', 'positioning', 'pin to bottom']
    },
    {
      name: 'left', group: 'Positioning', short: 'offset from the left',
      summary: 'For a positioned element: the distance from the left edge of its reference box.',
      description: '`left: 50%` puts the left edge at the middle; add `transform: translateX(-50%)` to centre the box itself.',
      initial: 'auto', inherited: false, appliesTo: 'positioned elements',
      values: [
        { value: 'auto', desc: 'No offset.' },
        { value: '0', desc: 'Touching the left edge.', example: true },
        { value: '60px', desc: '60px in from the left.', example: true },
        { value: '50%', desc: 'Left edge at the middle.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom offset', min: -40, max: 300, value: 60, units: ['px', '%'] }],
      start: '60px', demo: 'positioned',
      related: ['right', 'top', 'position', 'transform'],
      keywords: ['offset', 'positioning']
    },
    {
      name: 'inset', group: 'Positioning', short: 'top/right/bottom/left in one',
      summary: 'Shorthand for `top`, `right`, `bottom` and `left` (1 to 4 values, like margin).',
      description: '`inset: 0` on an absolute element stretches it over its whole reference box - the standard way to build overlays.',
      initial: 'auto', inherited: false, appliesTo: 'positioned elements',
      values: [
        { value: 'auto', desc: 'No offsets.' },
        { value: '0', desc: 'Stretch over the whole parent: an overlay.', example: true },
        { value: '20px', desc: '20px in from every side.', example: true },
        { value: '10px 40px', desc: '10px top/bottom, 40px left/right.', example: true },
        { value: '10px auto auto 10px', desc: 'Only top and left set: pinned to the top-left corner.', example: true }
      ],
      start: '20px',
      demo: { preset: 'positioned', css: '.box {\n  width: auto;\n}' },
      related: ['top', 'position'],
      keywords: ['overlay', 'offsets', 'positioning']
    },
    {
      name: 'z-index', group: 'Positioning', short: 'what sits on top',
      summary: 'Which positioned element appears in front when elements overlap. Higher numbers are closer to you.',
      description: 'Box B has `z-index: 1`. Change box A\'s z-index: above 1 brings A to the front. Negative values send A behind its parent\'s background - it vanishes. Only works on positioned elements (and flex/grid items).',
      initial: 'auto', inherited: false, appliesTo: 'positioned elements, flex and grid items',
      values: [
        { value: 'auto', desc: 'Same level as the parent; later elements in the HTML paint on top.' },
        { value: '0', desc: 'Level 0: still below B (which is 1).', example: true },
        { value: '2', desc: 'Above B.', example: true },
        { value: '10', desc: 'Also above B: only the order of the numbers matters, so 2 and 10 look the same here.', example: true },
        { value: '-1', desc: 'Behind the parent\'s background: A disappears.', example: true }
      ],
      inputs: [{ type: 'number', label: 'Custom z-index', min: -3, max: 10, value: 2 }],
      start: '2',
      demo: {
        html: '<div class="stage">\n  <div class="a">A - you change me</div>\n  <div class="b">B - z-index: 1</div>\n</div>',
        css: css(['.stage {', '  position: relative;', '  height: 150px;', '  background: #eef1fb;', '}',
          '.a, .b {', '  position: absolute;', '  width: 150px;', '  height: 80px;', '  padding: 8px;', '  color: white;', '}',
          '.a {', '  top: 15px;', '  left: 15px;', '  background: #ff7a1a;', '}',
          '.b {', '  top: 55px;', '  left: 90px;', '  background: #4f6fd8;', '  z-index: 1;', '}']),
        target: '.a'
      },
      java: 'Like `JLayeredPane` layers: components on a higher layer paint over lower ones.',
      mistakes: ['`z-index: 9999` "not working": the element is not positioned, or it is trapped inside a parent with its own stacking context (opacity, transform…).'],
      related: ['position', 'opacity', 'transform', 'explain:positioning'],
      keywords: ['stacking', 'layers', 'on top', 'overlap', 'front', 'behind']
    },
    {
      name: 'float', group: 'Positioning', short: 'push left/right, text wraps',
      summary: 'Pushes an element to the left or right; the following text wraps around it, like an image in a magazine.',
      description: 'Before flexbox, floats were used for whole page layouts. Today use them for their original purpose: wrapping text around images.',
      initial: 'none', inherited: false,
      values: [
        { value: 'none', desc: 'No floating (the default).' },
        { value: 'left', desc: 'Pushed to the left; text wraps on its right.' },
        { value: 'right', desc: 'Pushed to the right; text wraps on its left.' },
        { value: 'inline-start', desc: 'Left in left-to-right text, right in right-to-left text.' },
        { value: 'inline-end', desc: 'The opposite of inline-start.' }
      ],
      start: 'left',
      demo: { html: '<p class="text"><img class="pic" src="avatar.svg" alt="avatar">A floated image lets the text flow around it, the way pictures sit in a magazine article. The lines wrap beside the image and then continue at full width underneath it once they pass the bottom of the image.</p>', css: css(['.text {', '  max-width: 360px;', '}', '.pic {', '  width: 70px;', '  margin: 4px 10px;', '}']), target: '.pic' },
      related: ['clear', 'display', 'html:img'],
      keywords: ['wrap text', 'float image', 'magazine']
    },
    {
      name: 'clear', group: 'Positioning', short: 'go below floats',
      summary: 'Makes an element start below earlier floats instead of wrapping beside them.',
      description: 'The two coloured boxes float left and right; the paragraph is the element being changed.',
      initial: 'none', inherited: false,
      values: [
        { value: 'none', desc: 'Wrap beside floats (the default).' },
        { value: 'left', desc: 'Move below left floats.' },
        { value: 'right', desc: 'Move below right floats.' },
        { value: 'both', desc: 'Move below all floats.' }
      ],
      start: 'both',
      demo: {
        html: '<div class="l">float: left</div>\n<div class="r">float: right (taller)</div>\n<p class="text">This paragraph comes after both floats.</p>',
        css: css(['.l, .r {', '  width: 110px;', '  padding: 6px;', '  color: white;', '}', '.l {', '  float: left;', '  height: 50px;', '  background: #4f6fd8;', '}',
          '.r {', '  float: right;', '  height: 90px;', '  background: #ff7a1a;', '}', '.text {', '  background: #eef1fb;', '}']),
        target: '.text'
      },
      related: ['float', 'display'],
      keywords: ['clearfix', 'float']
    }
  );
})(window.UILT);
