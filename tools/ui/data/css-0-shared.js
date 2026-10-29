/*
 * CSS data shared by every property page:
 *   - cssGlobalValues: inherit / initial / unset / revert (valid on any property)
 *   - cssDemos: reusable demo set-ups. A property names one (demo: 'flex') or brings its own
 *     {html, css, target}. The page appends `target { property: value; }` after the demo's CSS.
 *
 * CSS property entry shape (css-1..4):
 *   name, group, short (sidebar hint), summary, description, initial, inherited, appliesTo?,
 *   values: [{value, desc, example?}]  (example: true = a sample of a typed value, drawn dashed)
 *   inputs: [{type: 'length'|'number'|'time'|'angle'|'color'|'select'|'builder', ...}]
 *   start (first value shown), demo, java?, tips[], mistakes[], related[], keywords[],
 *   hint (shown next to "Live preview"), compare: false (no compare grid), compareHeight, previewHeight
 */
(function (U) {
  function css(lines) { return lines.join('\n'); }

  U.data.cssProperties = U.data.cssProperties || [];

  U.data.cssGlobalValues = [
    { value: 'inherit', desc: 'Use the parent element\'s value. Works even for properties that are not inherited by default.' },
    { value: 'initial', desc: 'Use the property\'s initial value from the CSS specification - not the browser\'s default for this element. (`display: initial` is `inline`, even on a div.)' },
    { value: 'unset', desc: 'Act as `inherit` for inherited properties (colour, font) and as `initial` for the rest.' },
    { value: 'revert', desc: 'Go back to the browser\'s own default style for this element (`display: revert` on a div gives `block`).' }
  ];

  U.data.cssDemos = {
    box: {
      html: '<div class="box">Box</div>',
      css: css(['.box {', '  background: #4f6fd8;', '  color: white;', '  padding: 12px;', '}']),
      target: '.box'
    },
    sized: {
      html: '<div class="parent">\n  <div class="box">A box with some text inside it.</div>\n</div>',
      css: css(['.parent {', '  padding: 8px;', '  background: #eef1fb;', '  border: 2px dashed #9aa3b8;', '}',
        '.box {', '  background: #4f6fd8;', '  color: white;', '  padding: 8px;', '}']),
      target: '.box'
    },
    spacing: {
      html: '<div class="parent">\n  <div class="sibling">Sibling above</div>\n  <div class="box">Box</div>\n  <div class="sibling">Sibling below</div>\n</div>',
      css: css(['.parent {', '  display: flow-root;', '  background: #eef1fb;', '  border: 2px dashed #9aa3b8;', '}',
        '.sibling {', '  background: #c9d3ee;', '  padding: 4px 8px;', '}',
        '.box {', '  background: #4f6fd8;', '  color: white;', '  border: 3px solid #1d2433;', '}']),
      target: '.box'
    },
    bordered: {
      html: '<div class="box">A box with a border</div>',
      css: css(['.box {', '  padding: 14px;', '  background: #eef1fb;', '  border: 6px solid #4f6fd8;', '}']),
      target: '.box'
    },
    text: {
      html: '<p class="text">The quick brown fox jumps over the lazy dog.</p>',
      css: css(['.text {', '  font-size: 22px;', '}']),
      target: '.text'
    },
    para: {
      html: '<p class="text">CSS controls how text looks: its font, size, spacing and alignment. This paragraph is long enough to wrap onto several lines, so you can see the effect on whole lines as well as single words.</p>',
      css: css(['.text {', '  max-width: 420px;', '  padding: 8px;', '  background: #eef1fb;', '}']),
      target: '.text'
    },
    flex: {
      html: '<div class="container">\n  <div class="item">One</div>\n  <div class="item tall">Two</div>\n  <div class="item">Three</div>\n</div>',
      css: css(['.container {', '  display: flex;', '  min-height: 160px;', '  background: #eef1fb;', '  border: 2px dashed #9aa3b8;', '}',
        '.item {', '  margin: 4px;', '  padding: 10px 16px;', '  background: #4f6fd8;', '  color: white;', '  border-radius: 6px;', '}',
        '.tall {', '  padding-block: 26px;', '}']),
      target: '.container',
      height: 220
    },
    flexWrap: {
      html: '<div class="container">\n' + [1, 2, 3, 4, 5, 6, 7].map(function (i) { return '  <div class="item">' + i + '</div>'; }).join('\n') + '\n</div>',
      css: css(['.container {', '  display: flex;', '  flex-wrap: wrap;', '  height: 190px;', '  width: 300px;', '  background: #eef1fb;', '  border: 2px dashed #9aa3b8;', '}',
        '.item {', '  width: 70px;', '  margin: 4px;', '  padding: 8px 0;', '  text-align: center;', '  background: #4f6fd8;', '  color: white;', '  border-radius: 6px;', '}']),
      target: '.container',
      height: 230
    },
    flexItem: {
      html: '<div class="container">\n  <div class="item">One</div>\n  <div class="item two">Two</div>\n  <div class="item">Three</div>\n</div>',
      css: css(['.container {', '  display: flex;', '  height: 120px;', '  background: #eef1fb;', '  border: 2px dashed #9aa3b8;', '}',
        '.item {', '  flex-basis: 70px;', '  margin: 4px;', '  padding: 10px;', '  background: #9fb2e8;', '  border-radius: 6px;', '}',
        '/* the item you are changing */', '.two {', '  background: #ff7a1a;', '  color: white;', '}']),
      target: '.two',
      height: 170
    },
    grid: {
      html: '<div class="grid">\n' + [1, 2, 3, 4, 5, 6].map(function (i) { return '  <div class="cell">' + i + '</div>'; }).join('\n') + '\n</div>',
      css: css(['.grid {', '  display: grid;', '  grid-template-columns: repeat(3, 1fr);', '  gap: 6px;', '  min-height: 160px;', '  padding: 6px;', '  background: #eef1fb;', '  border: 2px dashed #9aa3b8;', '}',
        '.cell {', '  padding: 10px;', '  background: #4f6fd8;', '  color: white;', '  border-radius: 6px;', '}']),
      target: '.grid',
      height: 230
    },
    gridItem: {
      html: '<div class="grid">\n  <div class="cell">1</div>\n  <div class="cell two">2</div>\n' + [3, 4, 5, 6, 7].map(function (i) { return '  <div class="cell">' + i + '</div>'; }).join('\n') + '\n</div>',
      css: css(['.grid {', '  display: grid;', '  grid-template-columns: repeat(4, 1fr);', '  grid-auto-rows: 44px;', '  gap: 6px;', '  padding: 6px;', '  background: #eef1fb;', '  border: 2px dashed #9aa3b8;', '}',
        '.cell {', '  padding: 6px;', '  background: #9fb2e8;', '  border-radius: 6px;', '}',
        '/* the item you are placing */', '.two {', '  background: #ff7a1a;', '  color: white;', '}']),
      target: '.two',
      height: 220
    },
    gridAreas: {
      html: '<div class="page">\n  <header>header</header>\n  <nav>nav</nav>\n  <main>main</main>\n  <footer>footer</footer>\n</div>',
      css: css(['.page {', '  display: grid;', '  grid-template-columns: 100px 1fr;', '  grid-template-rows: 40px 1fr 36px;', '  gap: 6px;', '  height: 190px;', '}',
        'header { grid-area: header; background: #4f6fd8; }', 'nav { grid-area: nav; background: #9fb2e8; }',
        'main { grid-area: main; background: #c9d3ee; }', 'footer { grid-area: footer; background: #ff9a4d; }',
        'header, nav, main, footer {', '  padding: 6px;', '  border-radius: 6px;', '  font: 13px monospace;', '}']),
      target: '.page',
      height: 230
    },
    positioned: {
      html: '<div class="parent">\n  parent (position: relative)\n  <div class="box">Box</div>\n</div>',
      css: css(['.parent {', '  position: relative;', '  height: 170px;', '  padding: 6px;', '  font-size: 12px;', '  color: #4d5568;', '  background: #eef1fb;', '  border: 2px dashed #9aa3b8;', '}',
        '.box {', '  position: absolute;', '  width: 90px;', '  padding: 10px;', '  background: #ff7a1a;', '  color: white;', '  font-size: 15px;', '}']),
      target: '.box',
      height: 220
    },
    image: {
      html: '<img class="photo" src="landscape.svg" alt="Hills">\n<img class="photo" src="portrait.svg" alt="A tree">',
      css: css(['.photo {', '  width: 150px;', '  height: 150px;', '  background: #eef1fb;', '  border: 2px dashed #9aa3b8;', '}']),
      target: '.photo',
      height: 200
    },
    list: {
      html: '<ul class="list">\n  <li>First item</li>\n  <li>Second item, which is long enough to wrap onto a second line</li>\n  <li>Third item</li>\n</ul>',
      css: css(['.list {', '  width: 300px;', '  background: #eef1fb;', '}', 'li {', '  background: #ffffff;', '  margin: 2px 0;', '}']),
      target: '.list'
    },
    table: {
      html: '<table class="t">\n  <caption>Scores</caption>\n  <tr><th>Name</th><th>Score</th></tr>\n  <tr><td>Asha</td><td>42</td></tr>\n  <tr><td>Vikram</td><td>37</td></tr>\n</table>',
      css: css(['th, td {', '  border: 2px solid #4f6fd8;', '  padding: 6px 10px;', '}']),
      target: '.t'
    }
  };
})(window.UILT);
