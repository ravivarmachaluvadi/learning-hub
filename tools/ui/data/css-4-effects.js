/*
 * CSS properties, part 4: effects and motion, lists and tables, interaction and the rest.
 * Entry shape: see css-0-shared.js. `interactive: true` marks properties whose effect you have to
 * hover, click, scroll or wait for (motion) to see; the tests skip their "looks different in a
 * still screenshot" check, but still require every value to change the computed style.
 */
(function (U) {
  var P = U.data.cssProperties;
  function css(lines) { return lines.join('\n'); }

  var STAGE = {
    html: '<div class="stage">\n  <div class="ghost"></div>\n  <div class="box">Box</div>\n</div>',
    css: css(['.stage {', '  position: relative;', '  height: 170px;', '  padding: 40px 0 0 60px;', '  background: #eef1fb;', '}',
      '/* dashed outline = where the box would be without the property */',
      '.ghost {', '  position: absolute;', '  width: 110px;', '  height: 70px;', '  border: 2px dashed #9aa3b8;', '}',
      '.box {', '  width: 110px;', '  height: 70px;', '  padding: 8px;', '  box-sizing: border-box;', '  background: #4f6fd8;', '  color: white;', '}']),
    target: '.box', height: 220
  };

  P.push(
    /* ---------- Effects and motion ---------- */
    {
      name: 'box-shadow', group: 'Effects & motion', short: 'shadow around the box',
      summary: 'Shadows around (or inside) the box: x offset, y offset, blur, spread, colour. Separate several with commas.',
      description: 'Soft, low shadows make cards look lifted. `inset` draws the shadow inside. A shadow with no blur and a spread acts like an extra border that takes no space.',
      initial: 'none', inherited: false,
      values: [
        { value: 'none', desc: 'No shadow.' },
        { value: '0 4px 12px rgb(0 0 0 / 25%)', desc: 'A soft card shadow.', example: true },
        { value: '6px 6px 0 #1d2433', desc: 'A hard offset shadow (no blur): a "brutalist" look.', example: true },
        { value: '0 0 0 4px #ffd34d', desc: 'No offset, no blur, 4px spread: a ring that does not change the layout.', example: true },
        { value: 'inset 0 0 14px rgb(0 0 0 / 55%)', desc: 'Inside the box: looks pressed in.', example: true },
        { value: '0 12px 24px -8px #4f6fd8', desc: 'Negative spread: a coloured glow underneath only.', example: true },
        { value: '0 2px 4px rgb(0 0 0 / 20%), 0 8px 24px rgb(0 0 0 / 20%)', desc: 'Two layered shadows: more realistic depth.', example: true }
      ],
      inputs: [{
        type: 'builder', label: 'Build a shadow', format: '{0} {1} {2} {3} {4}',
        parts: [
          { label: 'x offset', type: 'length', min: -30, max: 30, value: 4, units: ['px'] },
          { label: 'y offset', type: 'length', min: -30, max: 30, value: 8, units: ['px'] },
          { label: 'blur', type: 'length', min: 0, max: 50, value: 16, units: ['px'] },
          { label: 'spread', type: 'length', min: -20, max: 20, value: 0, units: ['px'] },
          { label: 'colour', type: 'color', value: '#5f6880' }
        ]
      }],
      start: '0 4px 12px rgb(0 0 0 / 25%)',
      demo: { html: '<div class="box">Card</div>', css: css(['body {', '  padding: 20px;', '}', '.box {', '  width: 160px;', '  padding: 24px;', '  background: white;', '  border-radius: 10px;', '}']), target: '.box' },
      related: ['text-shadow', 'filter', 'border-radius', 'outline'],
      keywords: ['shadow', 'drop shadow', 'elevation', 'glow', 'card']
    },
    {
      name: 'filter', group: 'Effects & motion', short: 'blur, grayscale, brightness…',
      summary: 'Photo-editing effects applied to the element as drawn: blur, brightness, contrast, grayscale, sepia, hue rotation and more.',
      description: 'Filters can be chained: `grayscale(1) blur(2px)`. `drop-shadow()` follows the shape of transparent images, unlike box-shadow.',
      initial: 'none', inherited: false,
      values: [
        { value: 'none', desc: 'No filter.' },
        { value: 'blur(3px)', desc: 'Blur by a 3px radius.', example: true },
        { value: 'brightness(1.5)', desc: '150% brightness (below 1 is darker).', example: true },
        { value: 'contrast(2)', desc: 'Double contrast.', example: true },
        { value: 'grayscale(1)', desc: 'Black and white.', example: true },
        { value: 'sepia(1)', desc: 'Old-photo brown.', example: true },
        { value: 'hue-rotate(90deg)', desc: 'Shift every colour round the colour wheel.', example: true },
        { value: 'invert(1)', desc: 'A photo negative.', example: true },
        { value: 'saturate(3)', desc: 'Much stronger colours.', example: true },
        { value: 'drop-shadow(4px 4px 4px rgb(0 0 0 / 40%))', desc: 'A shadow that follows the image\'s shape.', example: true },
        { value: 'grayscale(1) blur(1px)', desc: 'Two filters chained.', example: true }
      ],
      start: 'grayscale(1)',
      demo: { html: '<img class="photo" src="landscape.svg" alt="Hills">', css: '.photo {\n  width: 240px;\n}', target: '.photo' },
      compareHeight: 190,
      related: ['backdrop-filter', 'opacity', 'box-shadow'],
      keywords: ['blur', 'grayscale', 'greyscale', 'brightness', 'photo effect', 'sepia']
    },
    {
      name: 'backdrop-filter', group: 'Effects & motion', short: 'blur what is behind',
      summary: 'Applies a filter to whatever is *behind* the element: the "frosted glass" effect.',
      description: 'Only visible when the element\'s own background is partly transparent, like the white panel here.',
      initial: 'none', inherited: false,
      values: [
        { value: 'none', desc: 'No effect.' },
        { value: 'blur(6px)', desc: 'Frosted glass.', example: true },
        { value: 'grayscale(1)', desc: 'Behind the panel turns grey.', example: true },
        { value: 'brightness(0.5)', desc: 'Darkens what is behind.', example: true },
        { value: 'blur(4px) saturate(2)', desc: 'Blurred and more colourful.', example: true }
      ],
      start: 'blur(6px)',
      demo: {
        html: '<div class="photo">\n  <div class="glass">Frosted panel</div>\n</div>',
        css: css(['.photo {', '  width: 300px;', '  height: 180px;', '  padding: 40px;', '  box-sizing: border-box;', '  background: url(landscape.svg) center / cover;', '}',
          '.glass {', '  padding: 20px;', '  background: rgb(255 255 255 / 30%);', '  border: 1px solid rgb(255 255 255 / 60%);', '  border-radius: 10px;', '  font-weight: 700;', '}']),
        target: '.glass'
      },
      compareHeight: 200,
      related: ['filter', 'background-color', 'opacity'],
      keywords: ['frosted glass', 'glassmorphism', 'blur background']
    },
    {
      name: 'transform', group: 'Effects & motion', short: 'move, rotate, scale, skew',
      summary: 'Moves, rotates, scales or skews the element *as drawn*, without affecting the layout around it.',
      description: 'The dashed outline shows where the box really is in the layout; the blue box is where it is drawn. Functions can be chained and are applied right to left. Transforms are cheap to animate, so they are the go-to for motion.',
      initial: 'none', inherited: false, appliesTo: 'transformable elements (not plain inline ones)',
      values: [
        { value: 'none', desc: 'No transform.' },
        { value: 'translateX(60px)', desc: 'Move 60px right.', example: true },
        { value: 'translate(40px, 30px)', desc: 'Move right and down.', example: true },
        { value: 'rotate(20deg)', desc: 'Rotate clockwise by 20 degrees (around the centre).', example: true },
        { value: 'scale(1.3)', desc: '130% size.', example: true },
        { value: 'scale(0.6)', desc: '60% size.', example: true },
        { value: 'skewX(20deg)', desc: 'Slant horizontally.', example: true },
        { value: 'rotate(45deg) scale(0.8)', desc: 'Two transforms chained.', example: true },
        { value: 'perspective(300px) rotateY(45deg)', desc: 'A 3D turn, with perspective.', example: true }
      ],
      inputs: [{
        type: 'builder', label: 'Build a transform', format: 'translate({0}, {1}) rotate({2}) scale({3})',
        parts: [
          { label: 'move x', type: 'length', min: -80, max: 120, value: 30, units: ['px'] },
          { label: 'move y', type: 'length', min: -40, max: 60, value: 0, units: ['px'] },
          { label: 'rotate', type: 'angle', min: -180, max: 180, value: 15, units: ['deg'] },
          { label: 'scale', type: 'number', min: 0.2, max: 2, step: 0.1, value: 1 }
        ]
      }],
      start: 'rotate(20deg)', demo: STAGE, compareHeight: 220,
      tips: ['Centre an absolutely positioned box: `left: 50%; top: 50%; transform: translate(-50%, -50%);`.'],
      related: ['transform-origin', 'transition', 'animation', 'position'],
      keywords: ['rotate', 'scale', 'translate', 'move', 'skew', '3d', 'zoom']
    },
    {
      name: 'transform-origin', group: 'Effects & motion', short: 'pivot point for transforms',
      summary: 'The point a transform pivots around - the centre by default.',
      description: 'The box is rotated 25° by the demo CSS; change only the pivot and see where it swings.',
      initial: '50% 50% (center)', inherited: false,
      values: [
        { value: 'center', desc: 'Rotate around the middle.' },
        { value: 'top left', desc: 'Rotate around the top-left corner, like a door hinge.', example: true },
        { value: 'bottom right', desc: 'Around the bottom-right corner.', example: true },
        { value: '0 100%', desc: 'Bottom-left corner, in percentages.', example: true },
        { value: '20px 80%', desc: 'Any point, in lengths or percentages.', example: true }
      ],
      start: 'top left',
      demo: { html: STAGE.html, css: STAGE.css + '\n.box {\n  transform: rotate(25deg);\n}', target: '.box', height: 220 },
      compareHeight: 220,
      related: ['transform'],
      keywords: ['pivot', 'rotation point', 'origin']
    },
    {
      name: 'transition', group: 'Effects & motion', short: 'animate between states',
      summary: 'Animates the change when a property\'s value changes - for example on hover - instead of jumping instantly.',
      description: 'Every 1.5 seconds a small script toggles a class on the box that moves it and makes it orange. Without a transition it jumps; with one it glides. Syntax: property, duration, timing function, delay.',
      initial: 'all 0s ease 0s', inherited: false, interactive: true,
      values: [
        { value: 'none', desc: 'No animation: the change is instant.' },
        { value: 'all 0.3s ease', desc: 'Animate every changing property over 0.3s. A typical hover effect.', example: true },
        { value: 'transform 1s ease-in-out', desc: 'Only the movement, slow start and end.', example: true },
        { value: 'transform 1s linear', desc: 'Constant speed: looks mechanical.', example: true },
        { value: 'transform 1s cubic-bezier(.68, -0.6, .32, 1.6)', desc: 'A custom curve that overshoots and bounces back.', example: true },
        { value: 'transform 1s steps(4)', desc: 'Jumps in 4 steps.', example: true },
        { value: 'background-color 1s', desc: 'Only the colour animates; the movement still jumps.', example: true },
        { value: 'all 0.5s ease 0.5s', desc: 'Waits 0.5s before starting (a delay).', example: true }
      ],
      start: 'transform 1s ease-in-out',
      demo: {
        html: '<div class="box">Box</div>\n<script>\n  setInterval(() => document.querySelector(".box").classList.toggle("moved"), 1500);\n</script>',
        css: css(['.box {', '  width: 70px;', '  padding: 14px;', '  background: #4f6fd8;', '  color: white;', '}',
          '.box.moved {', '  transform: translateX(170px);', '  background: #ff7a1a;', '}']),
        target: '.box'
      },
      hint: 'the box moves every 1.5 s',
      tips: ['Animate `transform` and `opacity`: they are smooth even on slow phones. Animating `width` or `top` is costly.', 'Respect users who turn motion off: wrap big animations in `@media (prefers-reduced-motion: no-preference)`.'],
      related: ['animation', 'transform', 'opacity', 'lesson:css-motion'],
      keywords: ['animate', 'hover effect', 'ease', 'smooth', 'duration']
    },
    {
      name: 'animation', group: 'Effects & motion', short: 'keyframe animation',
      summary: 'Runs a named `@keyframes` animation: name, duration, timing, how many times, direction.',
      description: 'Unlike a transition, an animation runs on its own, with as many steps as you like. The demo CSS defines four keyframe sets: spin, bounce, pulse and slide.',
      initial: 'none', inherited: false,
      values: [
        { value: 'none', desc: 'No animation.' },
        { value: 'spin 2s linear infinite', desc: 'Rotate forever at constant speed: a loading spinner.', example: true },
        { value: 'bounce 1s ease-in-out infinite', desc: 'Up and down forever.', example: true },
        { value: 'pulse 1.5s ease-in-out infinite', desc: 'Grow, fade and shrink: draws attention.', example: true },
        { value: 'slide 2s ease-in-out infinite alternate', desc: 'Right, then back (alternate direction).', example: true },
        { value: 'spin 1s linear 2', desc: 'Exactly two turns, then stop.', example: true },
        { value: 'slide 1s ease-out forwards', desc: 'Once, then stay at the end (fill-mode forwards).', example: true }
      ],
      start: 'bounce 1s ease-in-out infinite',
      demo: {
        html: '<div class="box">Box</div>',
        css: css(['@keyframes spin { to { transform: rotate(360deg); } }',
          '@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-40px); } }',
          '@keyframes pulse { 50% { transform: scale(1.25); opacity: .6; } }',
          '@keyframes slide { from { transform: translateX(0); } to { transform: translateX(160px); } }',
          '.box {', '  width: 70px;', '  margin-top: 50px;', '  padding: 14px;', '  background: #4f6fd8;', '  color: white;', '  text-align: center;', '}']),
        target: '.box'
      },
      related: ['transition', 'transform', 'lesson:css-motion'],
      keywords: ['keyframes', 'animate', 'spinner', 'loop', 'motion']
    },

    /* ---------- Lists and tables ---------- */
    {
      name: 'list-style-type', group: 'Lists & tables', short: 'bullet or numbering style',
      summary: 'The marker in front of each list item: bullets, numbers, letters, Roman numerals - or a string of your own.',
      description: 'Works on `<ul>` and `<ol>` (and anything with `display: list-item`). `none` removes markers, which is what navigation menus do.',
      initial: 'disc', inherited: true,
      values: [
        { value: 'disc', desc: 'Filled circle (default for ul).' },
        { value: 'circle', desc: 'Hollow circle.' },
        { value: 'square', desc: 'Filled square.' },
        { value: 'decimal', desc: '1, 2, 3 (default for ol).' },
        { value: 'decimal-leading-zero', desc: '01, 02, 03.' },
        { value: 'lower-alpha', desc: 'a, b, c.' },
        { value: 'upper-roman', desc: 'I, II, III.' },
        { value: 'lower-greek', desc: 'α, β, γ.' },
        { value: 'none', desc: 'No marker.' },
        { value: 'devanagari', desc: 'Devanagari digits: १, २, ३.', example: true },
        { value: 'telugu', desc: 'Telugu digits: ౧, ౨, ౩.', example: true },
        { value: '"👉 "', desc: 'Any text in quotes becomes the marker.', example: true }
      ],
      start: 'square', demo: 'list', compareHeight: 130,
      related: ['list-style-position', 'html:ul', 'html:ol'],
      keywords: ['bullets', 'numbering', 'list marker', 'remove bullets']
    },
    {
      name: 'list-style-position', group: 'Lists & tables', short: 'marker inside or outside',
      summary: 'Whether list markers sit outside the text block (hanging) or inside it, like the first letter of the text.',
      description: 'Look at the second item, which wraps: with `inside`, the second line starts under the bullet.',
      initial: 'outside', inherited: true,
      values: [
        { value: 'outside', desc: 'Markers hang outside the text; wrapped lines line up with the text (the default).' },
        { value: 'inside', desc: 'Markers are part of the first line; wrapped lines start under the marker.' }
      ],
      start: 'inside', demo: 'list',
      related: ['list-style-type'],
      keywords: ['bullet position', 'hanging bullets']
    },
    {
      name: 'border-collapse', group: 'Lists & tables', short: 'single or double table borders',
      summary: 'Whether table cells have separate borders (double lines) or share one collapsed border.',
      description: 'Almost every styled table uses `collapse`.',
      initial: 'separate', inherited: true, appliesTo: 'tables',
      values: [
        { value: 'separate', desc: 'Each cell has its own border, with space between (the default).' },
        { value: 'collapse', desc: 'Neighbouring borders merge into one line.' }
      ],
      start: 'collapse', demo: 'table',
      related: ['border-spacing', 'html:table'],
      keywords: ['table borders', 'double borders']
    },
    {
      name: 'border-spacing', group: 'Lists & tables', short: 'gap between table cells',
      summary: 'The gap between cells of a table with `border-collapse: separate`.',
      description: 'One value for both directions, or horizontal then vertical.',
      initial: '0 (browsers set 2px on tables)', inherited: true, appliesTo: 'tables',
      values: [
        { value: '0', desc: 'Cells touch (borders still doubled).', example: true },
        { value: '4px', desc: '4px gaps.', example: true },
        { value: '12px', desc: '12px gaps.', example: true },
        { value: '16px 2px', desc: '16px horizontal, 2px vertical.', example: true }
      ],
      inputs: [{ type: 'length', label: 'Custom spacing', min: 0, max: 30, value: 6, units: ['px'] }],
      start: '12px', demo: 'table',
      related: ['border-collapse'],
      keywords: ['cell spacing', 'table gap']
    },
    {
      name: 'caption-side', group: 'Lists & tables', short: 'caption above or below',
      summary: 'Puts a table\'s `<caption>` above or below the table.',
      description: 'Captions below a table read like the caption of a figure; above, like a title. The HTML order does not change - the caption is still the table\'s first child.',
      initial: 'top', inherited: true, appliesTo: 'table captions',
      values: [
        { value: 'top', desc: 'Above the table (the default).' },
        { value: 'bottom', desc: 'Below the table.' }
      ],
      start: 'bottom', demo: 'table',
      related: ['html:caption', 'border-collapse'],
      keywords: ['table caption']
    },

    /* ---------- Interaction and misc ---------- */
    {
      name: 'cursor', group: 'Interaction & misc', short: 'mouse pointer shape',
      summary: 'The shape of the mouse pointer while it is over the element.',
      description: 'Hover the box (or each box in "Compare all values"). Use cursors to hint what will happen: `pointer` for clickable things, `not-allowed` for disabled ones.',
      initial: 'auto', inherited: true, interactive: true,
      values: [
        { value: 'auto', desc: 'The browser decides: an I-beam over text, an arrow elsewhere.' },
        { value: 'default', desc: 'The normal arrow.' },
        { value: 'pointer', desc: 'A hand: "this is clickable". Links have it already; add it to clickable custom elements.' },
        { value: 'text', desc: 'An I-beam: "you can select or type text here".' },
        { value: 'move', desc: 'Four arrows: "this can be moved".' },
        { value: 'grab', desc: 'An open hand: "you can drag this".' },
        { value: 'grabbing', desc: 'A closed hand: "you are dragging".' },
        { value: 'not-allowed', desc: 'A no-entry sign: "you cannot do that".' },
        { value: 'wait', desc: 'Busy: the page cannot be used right now.' },
        { value: 'progress', desc: 'Busy in the background, but you can still click.' },
        { value: 'help', desc: 'A question mark: help is available.' },
        { value: 'crosshair', desc: 'Cross-hairs: precise selection.' },
        { value: 'zoom-in', desc: 'A magnifier with +.' },
        { value: 'col-resize', desc: 'Resize a column horizontally.' },
        { value: 'none', desc: 'No pointer at all.' }
      ],
      start: 'pointer',
      demo: { preset: 'box', html: '<div class="box">Hover me</div>', css: '.box {\n  width: 140px;\n  height: 60px;\n}' },
      hint: 'hover the box', compareHeight: 100,
      related: ['pointer-events', 'user-select', 'html:button'],
      keywords: ['mouse', 'pointer', 'hand cursor', 'cursor']
    },
    {
      name: 'pointer-events', group: 'Interaction & misc', short: 'can it be clicked?',
      summary: 'Whether the element reacts to the mouse at all. With `none`, clicks pass straight through it to whatever is underneath.',
      description: 'Click the button: its click is logged under the preview. With `none` nothing happens. Useful for decorative overlays that must not block clicks.',
      initial: 'auto', inherited: true, interactive: true,
      values: [
        { value: 'auto', desc: 'Normal: the element receives clicks and hovers.' },
        { value: 'none', desc: 'Invisible to the mouse: clicks go through to what is behind.' }
      ],
      start: 'none',
      demo: { html: '<button class="btn" onclick="console.log(\'Button clicked!\')">Click me</button>', css: '.btn {\n  padding: 10px 18px;\n}', target: '.btn' },
      hint: 'click the button',
      mistakes: ['Using `pointer-events: none` to "disable" a button: keyboard users can still press it. Use the `disabled` attribute.'],
      related: ['cursor', 'user-select'],
      keywords: ['click through', 'disable clicks']
    },
    {
      name: 'user-select', group: 'Interaction & misc', short: 'can text be selected?',
      summary: 'Whether the user can select the text by dragging or double-clicking.',
      description: 'Try selecting the text in the preview with each value.',
      initial: 'auto', inherited: false, interactive: true,
      values: [
        { value: 'auto', desc: 'Normal selection.' },
        { value: 'none', desc: 'Cannot be selected. For buttons and controls, not for content people may want to copy.' },
        { value: 'text', desc: 'Can be selected (even inside a no-select parent).' },
        { value: 'all', desc: 'One click selects the whole element: handy for codes and IDs.' }
      ],
      start: 'all',
      demo: { html: '<p class="text">Coupon code: <b>LEARN-CSS-2026</b>. Try to select this text.</p>', css: '.text {\n  font-size: 18px;\n}', target: '.text' },
      hint: 'try selecting the text',
      related: ['cursor', 'pointer-events'],
      keywords: ['select text', 'copy', 'disable selection']
    },
    {
      name: 'object-fit', group: 'Interaction & misc', short: 'fit an image in its box',
      summary: 'How an image (or video) fills a box whose shape differs from its own - like `background-size`, for `<img>`.',
      description: 'Both images are forced into 150 × 150 squares: a wide landscape and a tall portrait.',
      initial: 'fill', inherited: false, appliesTo: 'images, videos and other replaced elements',
      values: [
        { value: 'fill', desc: 'Stretch to fill the box exactly: the image is distorted (the default).' },
        { value: 'contain', desc: 'Fit the whole image inside, keeping its shape: empty bands remain.' },
        { value: 'cover', desc: 'Fill the box, keeping the shape, cropping the overflow. Best for thumbnails and avatars.' },
        { value: 'none', desc: 'Natural size, cropped by the box.' },
        { value: 'scale-down', desc: 'Like none or contain, whichever makes it smaller.' }
      ],
      start: 'cover', demo: 'image', compareHeight: 190,
      related: ['object-position', 'aspect-ratio', 'background-size', 'html:img'],
      keywords: ['image fit', 'cover', 'contain', 'crop image', 'thumbnail']
    },
    {
      name: 'object-position', group: 'Interaction & misc', short: 'which part of the image shows',
      summary: 'With `object-fit: cover` (or none), which part of the image stays visible - like `background-position` for `<img>`.',
      description: 'The demo sets `object-fit: cover`.',
      initial: '50% 50%', inherited: false, appliesTo: 'replaced elements',
      values: [
        { value: 'center', desc: 'Keep the middle.' },
        { value: 'top', desc: 'Keep the top (good for portraits: heads stay in).' },
        { value: 'bottom', desc: 'Keep the bottom.' },
        { value: 'left', desc: 'Keep the left side.' },
        { value: 'right', desc: 'Keep the right side.' },
        { value: '20% 80%', desc: 'Any point.', example: true }
      ],
      start: 'top',
      demo: { preset: 'image', css: '.photo {\n  object-fit: cover;\n}' },
      compareHeight: 190,
      related: ['object-fit', 'background-position'],
      keywords: ['image position', 'focal point']
    },
    {
      name: 'aspect-ratio', group: 'Interaction & misc', short: 'keep a width:height shape',
      summary: 'Gives a box a fixed shape (width : height), so its height follows its width.',
      description: 'The box is 200px wide with no height: aspect-ratio computes the height. Ideal for video embeds and image placeholders.',
      initial: 'auto', inherited: false,
      values: [
        { value: 'auto', desc: 'No fixed shape: height comes from the content.' },
        { value: '1', desc: 'A square (1 / 1).', example: true },
        { value: '16 / 9', desc: 'Widescreen video.', example: true },
        { value: '4 / 3', desc: 'Classic photo.', example: true },
        { value: '3 / 4', desc: 'Portrait.', example: true },
        { value: '2 / 1', desc: 'Twice as wide as tall.', example: true }
      ],
      start: '16 / 9',
      demo: { preset: 'box', css: '.box {\n  width: 200px;\n}' },
      compareHeight: 220,
      related: ['width', 'height', 'object-fit'],
      keywords: ['ratio', '16:9', 'square', 'shape']
    },
    {
      name: 'content', group: 'Interaction & misc', short: 'text added by CSS',
      summary: 'With the `::before` and `::after` pseudo-elements, inserts generated content (text, symbols, attribute values) before or after an element\'s own content.',
      description: 'The demo rule targets `.box::before`. The inserted text is not part of the HTML: it cannot be selected and screen readers may skip it, so use it for decoration only.',
      initial: 'normal', inherited: false, appliesTo: '::before and ::after',
      values: [
        { value: 'normal', desc: 'For ::before/::after this means none: no box is generated.' },
        { value: 'none', desc: 'No generated content.' },
        { value: '"★ "', desc: 'A literal string, in quotes.', example: true },
        { value: '"Note: "', desc: 'Some text.', example: true },
        { value: 'attr(data-label)', desc: 'The value of the element\'s data-label attribute.', example: true },
        { value: 'open-quote', desc: 'An opening quotation mark matching the language.', example: true }
      ],
      start: '"★ "',
      demo: { html: '<p class="box" data-label="[from data-label] ">The text of the paragraph.</p>', css: '.box::before {\n  color: #ff7a1a;\n  font-weight: 700;\n}', target: '.box', pseudo: '::before' },
      related: ['html:q'],
      keywords: ['before', 'after', 'pseudo-element', 'generated content', 'icon']
    },
    {
      name: 'accent-color', group: 'Interaction & misc', short: 'colour of checkboxes & co',
      summary: 'Recolours built-in form controls - checkboxes, radio buttons, range sliders, progress bars - with one line.',
      description: 'Put it on a parent and every control inside follows.',
      initial: 'auto', inherited: true,
      values: [
        { value: 'auto', desc: 'The browser\'s default colour (usually blue).' },
        { value: '#ff7a1a', desc: 'Orange.', example: true },
        { value: 'crimson', desc: 'Crimson.', example: true },
        { value: 'rebeccapurple', desc: 'Purple.', example: true },
        { value: 'hsl(150 70% 35%)', desc: 'Green.', example: true }
      ],
      inputs: [{ type: 'color', label: 'Pick a colour', value: '#ff7a1a' }],
      start: '#ff7a1a',
      demo: {
        html: '<form class="box">\n  <label><input type="checkbox" checked> Checkbox</label>\n  <label><input type="radio" checked> Radio</label><br>\n  <input type="range" value="60"> <progress value="60" max="100"></progress>\n</form>',
        css: '', target: '.box'
      },
      related: ['html:input', 'html:progress', 'color'],
      keywords: ['checkbox colour', 'checkbox color', 'form control colour', 'theme']
    },
    {
      name: 'scroll-behavior', group: 'Interaction & misc', short: 'smooth scrolling',
      summary: 'Whether jumping to an anchor (a `#section` link) scrolls instantly or smoothly.',
      description: 'Click the links in the preview with each value. Usually set on `html` for the whole page.',
      initial: 'auto', inherited: false, interactive: true,
      values: [
        { value: 'auto', desc: 'Jump instantly.' },
        { value: 'smooth', desc: 'Glide to the target.' }
      ],
      start: 'smooth',
      demo: {
        html: '<nav><a href="#one">One</a> · <a href="#two">Two</a> · <a href="#three">Three</a></nav>\n<div class="scroller">\n  <h3 id="one">Section one</h3><p class="tall">…</p>\n  <h3 id="two">Section two</h3><p class="tall">…</p>\n  <h3 id="three">Section three</h3><p class="tall">…</p>\n</div>',
        css: css(['.scroller {', '  height: 150px;', '  overflow: auto;', '  border: 2px dashed #9aa3b8;', '  padding: 0 10px;', '}', '.tall {', '  height: 160px;', '}']),
        target: '.scroller'
      },
      hint: 'click the links',
      related: ['overflow', 'html:a'],
      keywords: ['smooth scroll', 'anchor', 'scrolling']
    },
    {
      name: 'resize', group: 'Interaction & misc', short: 'user-resizable box',
      summary: 'Lets the user resize the element by dragging its bottom-right corner.',
      description: 'Only works when `overflow` is not `visible` (the demo sets `overflow: auto`). Textareas are resizable by default; `resize: none` turns that off.',
      initial: 'none', inherited: false,
      values: [
        { value: 'none', desc: 'Not resizable.' },
        { value: 'both', desc: 'Drag in both directions.' },
        { value: 'horizontal', desc: 'Width only.' },
        { value: 'vertical', desc: 'Height only.' }
      ],
      start: 'both',
      demo: { html: '<div class="box">Drag my bottom-right corner.</div>', css: css(['.box {', '  width: 180px;', '  height: 70px;', '  overflow: auto;', '  padding: 8px;', '  background: #eef1fb;', '  border: 2px dashed #9aa3b8;', '}']), target: '.box' },
      hint: 'drag the corner',
      related: ['overflow', 'html:textarea'],
      keywords: ['resizable', 'drag corner', 'textarea']
    }
  );
})(window.UILT);
