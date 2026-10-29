/*
 * views/explainers.js - interactive visual explainers (#/explain and #/explain/<id>).
 *
 * Each explainer pairs a few controls with a live preview and a picture or numbers that explain
 * what the browser did. Where possible the numbers are measured from the preview itself (through
 * the preview bridge), so the explanation can never disagree with what you see.
 * The line between the controls and the picture can be dragged, and Full screen puts the whole page
 * across the window (js/layout.js): both are added here, after an explainer has drawn its page.
 */
(function (U) {
  'use strict';
  var h = U.h;

  U.data.explainers = [
    { id: 'box-model', title: 'The box model', summary: 'Every element is a box: content, padding, border, margin. See the numbers add up.', keywords: ['margin', 'padding', 'border', 'box-sizing', 'width'] },
    { id: 'flexbox', title: 'Flexbox lab', summary: 'Arrange items in a row or column; play with every container and item property.', keywords: ['flex', 'justify-content', 'align-items', 'layout', 'centre', 'center'] },
    { id: 'grid', title: 'Grid lab', summary: 'Rows, columns, fr units, spans - with the grid lines drawn and numbered.', keywords: ['grid', 'columns', 'rows', 'fr', 'span', 'layout'] },
    { id: 'positioning', title: 'Positioning', summary: 'static, relative, absolute, fixed and sticky - and what each one is positioned against.', keywords: ['position', 'absolute', 'relative', 'fixed', 'sticky', 'z-index'] },
    { id: 'specificity', title: 'Selectors and specificity', summary: 'Which elements a selector picks, its score, and which rule wins a conflict.', keywords: ['selector', 'specificity', 'cascade', 'class', 'id', 'conflict'] },
    { id: 'dom-tree', title: 'The DOM tree', summary: 'Type HTML, see the tree of objects the browser builds from it.', keywords: ['dom', 'tree', 'nodes', 'parent', 'child'] },
    { id: 'units', title: 'CSS units', summary: 'px, em, rem, %, vw, ch side by side, measured live.', keywords: ['px', 'em', 'rem', 'vw', 'vh', 'percent', 'units'] }
  ];

  /* ---------- small control helpers ---------- */

  function cssDesc(prop, value) {
    var p = U.find('cssProperties', prop);
    var v = p && (p.values || []).filter(function (x) { return x.value === value; })[0];
    return v ? v.desc : '';
  }
  function chips(label, prop, values, get, set, hover) {
    var g = U.chipGroup({
      name: label,
      values: values.map(function (v) { return { value: v, desc: cssDesc(prop, v) || v }; }),
      get: get, set: set, hover: hover
    });
    return { el: h('div', { class: 'control' }, h('div', { class: 'control-head' }, h('a', { class: 'control-name', href: '#/css/' + prop }, label)), g.el), sync: g.sync };
  }
  function slider(label, min, max, value, unit, onInput, step) {
    var out = h('output', null, value + unit);
    var r = h('input', { type: 'range', min: min, max: max, step: step || 1, 'aria-label': label });
    r.value = value;
    r.addEventListener('input', function () { out.textContent = r.value + unit; onInput(+r.value); });
    return { el: h('div', { class: 'slider-row' }, h('label', null, label), r, out), input: r, set: function (v) { r.value = v; out.textContent = v + unit; } };
  }
  function head(main, ex, intro) {
    main.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/explain' }, 'Explainers'), ' › ', ex.title));
    main.appendChild(h('div', { class: 'page-head' }, h('div', { class: 'page-title' }, h('h1', null, ex.title)), h('p', { html: U.md(intro) })));
  }
  function previewBox(height, title) {
    var p = U.preview.create(null, { height: height, baseCss: U.DEMO_BASE, title: title });
    return p;
  }

  /* ===================================================================================
   * 1. Box model
   * =================================================================================== */
  function boxModel(main, ex) {
    head(main, ex, 'Every element is drawn as a rectangle made of four layers: the **content**, then **padding** (inside space), then the **border**, then **margin** (outside space). Move the sliders: the diagram shows the layers, the sum shows how the width is calculated, and the last line is what the browser actually measured.');
    var s = { width: 200, height: 60, padding: 20, border: 6, margin: 20, sizing: 'content-box' };
    var controls = h('div', { class: 'ex-controls' });
    var out = h('div', { class: 'ex-out' });
    main.appendChild(h('div', { class: 'ex-layout' }, controls, out));

    var card = h('div', { class: 'control' });
    [['width', 40, 320], ['height', 20, 160], ['padding', 0, 60], ['border', 0, 30], ['margin', 0, 60]].forEach(function (d) {
      card.appendChild(slider(d[0], d[1], d[2], s[d[0]], 'px', function (v) { s[d[0]] = v; update(); }).el);
    });
    controls.appendChild(card);
    var sz = chips('box-sizing', 'box-sizing', ['content-box', 'border-box'], function () { return s.sizing; }, function (v) { s.sizing = v; sz.sync(); update(); });
    controls.appendChild(sz.el);
    controls.appendChild(U.callout('java', 'Java analogy', U.md('Like Swing\'s `Insets`: padding is the inner insets of a component, margin is the gap a layout leaves around it, and the border is drawn between them.')));

    var diagram = h('div', { class: 'card' });
    var formula = h('div', { class: 'formula', 'aria-live': 'polite' });
    var measured = h('div', { class: 'formula' });
    var p = previewBox(260, 'Box model preview');
    var code = U.codeBlock('', 'css', { label: 'CSS' });
    out.appendChild(diagram);
    out.appendChild(formula);
    out.appendChild(h('div', null, h('div', { class: 'preview-label' }, h('span', { class: 'live-dot' }), 'The real box (the dashed line is the margin edge)'), p.wrap));
    out.appendChild(measured);
    out.appendChild(code.el);

    function layer(cls, tag, n, inner) {
      return '<div class="bm-layer ' + cls + '"><span class="bm-tag">' + tag + '</span>' +
        '<span class="bm-n t">' + n + '</span><span class="bm-n b">' + n + '</span><span class="bm-n l">' + n + '</span><span class="bm-n r">' + n + '</span>' + inner + '</div>';
    }
    var seq = 0;
    function update() {
      var contentW = s.sizing === 'border-box' ? Math.max(0, s.width - 2 * s.padding - 2 * s.border) : s.width;
      var contentH = s.sizing === 'border-box' ? Math.max(0, s.height - 2 * s.padding - 2 * s.border) : s.height;
      var visibleW = contentW + 2 * s.padding + 2 * s.border;
      diagram.innerHTML = '<div class="bm">' + layer('bm-margin', 'margin', s.margin, layer('bm-border', 'border', s.border, layer('bm-padding', 'padding', s.padding,
        '<div class="bm-content">' + contentW + ' × ' + contentH + '</div>'))) + '</div>';
      if (s.sizing === 'content-box') {
        formula.innerHTML = 'box-sizing: <b>content-box</b> → width means the content only.<br>' +
          'Visible width = border + padding + <b>width</b> + padding + border = ' + s.border + ' + ' + s.padding + ' + <b>' + s.width + '</b> + ' + s.padding + ' + ' + s.border + ' = <b>' + visibleW + 'px</b><br>' +
          'Space taken in the layout (with margins) = ' + s.margin + ' + ' + visibleW + ' + ' + s.margin + ' = <b>' + (visibleW + 2 * s.margin) + 'px</b>';
      } else {
        formula.innerHTML = 'box-sizing: <b>border-box</b> → width includes padding and border.<br>' +
          'Visible width = <b>width</b> = <b>' + s.width + 'px</b><br>' +
          'Content width = ' + s.width + ' − 2 × ' + s.padding + ' − 2 × ' + s.border + ' = <b>' + contentW + 'px</b>' + (s.width - 2 * s.padding - 2 * s.border < 0 ? ' (cannot go below 0)' : '') + '<br>' +
          'Space taken in the layout (with margins) = ' + s.margin + ' + ' + s.width + ' + ' + s.margin + ' = <b>' + (Math.max(s.width, 2 * s.padding + 2 * s.border) + 2 * s.margin) + 'px</b>';
      }
      var css = '.box {\n  box-sizing: ' + s.sizing + ';\n  width: ' + s.width + 'px;\n  height: ' + s.height + 'px;\n  padding: ' + s.padding + 'px;\n  border: ' + s.border + 'px solid #1d2433;\n  margin: ' + s.margin + 'px;\n  background: #8cb6c0;\n}';
      code.set(css);
      var mine = ++seq;
      p.render({
        html: '<div class="outer"><div class="box">content</div></div>',
        css: '.outer {\n  display: inline-block;\n  outline: 2px dashed #ff7a1a;\n  background: #fff4ec;\n}\n' + css
      }).then(function () { return p.ask({ type: 'rect', sel: '.box' }); }).then(function (r) {
        if (mine !== seq || !r) return;
        measured.innerHTML = 'Measured by the browser: the box is <b>' + Math.round(r.width) + ' × ' + Math.round(r.height) + 'px</b> (border included, margin excluded).';
        measured.setAttribute('data-width', Math.round(r.width));
      });
    }
    update();
  }

  /* ===================================================================================
   * 2. Flexbox lab
   * =================================================================================== */
  function flexbox(main, ex) {
    head(main, ex, 'A flex container lays its children out along one line, the **main axis** (a row, unless `flex-direction` says column). The **cross axis** runs across it. `justify-content` works along the main axis and `align-items` across it. Click an item number to change that item on its own.');
    var c = { 'flex-direction': 'row', 'flex-wrap': 'nowrap', 'justify-content': 'flex-start', 'align-items': 'stretch', 'align-content': 'normal', gap: 8, count: 4 };
    var items = [];
    for (var i = 0; i < 8; i++) items.push({ grow: 0, shrink: 1, basis: 'auto', self: 'auto', order: 0 });
    var sel = 0;
    var SIZES = [[60, 40], [90, 70], [50, 30], [110, 50], [70, 90], [40, 40], [80, 30], [60, 60]];

    var controls = h('div', { class: 'ex-controls' });
    var out = h('div', { class: 'ex-out' });
    main.appendChild(h('div', { class: 'ex-layout' }, controls, out));

    controls.appendChild(h('h3', { style: { margin: '0' } }, 'Container'));
    var syncs = [];
    [['flex-direction', ['row', 'row-reverse', 'column', 'column-reverse']],
      ['flex-wrap', ['nowrap', 'wrap', 'wrap-reverse']],
      ['justify-content', ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']],
      ['align-items', ['stretch', 'flex-start', 'flex-end', 'center', 'baseline']],
      ['align-content', ['normal', 'flex-start', 'center', 'space-between', 'stretch']]].forEach(function (d) {
      var g = chips(d[0], d[0], d[1], function () { return c[d[0]]; }, function (v) { c[d[0]] = v; syncAll(); update(); });
      syncs.push(g.sync);
      controls.appendChild(g.el);
    });
    var card = h('div', { class: 'control' });
    card.appendChild(slider('gap', 0, 40, c.gap, 'px', function (v) { c.gap = v; update(); }).el);
    card.appendChild(slider('items', 1, 8, c.count, '', function (v) { c.count = v; if (sel >= v) sel = v - 1; drawItemButtons(); update(); }).el);
    controls.appendChild(card);

    controls.appendChild(h('h3', { style: { margin: '6px 0 0' } }, 'One item'));
    var itemBtns = h('div', { class: 'row' });
    controls.appendChild(itemBtns);
    var itemCard = h('div', { class: 'control' });
    controls.appendChild(itemCard);
    var growS = slider('flex-grow', 0, 5, 0, '', function (v) { items[sel].grow = v; update(); });
    var shrinkS = slider('flex-shrink', 0, 5, 1, '', function (v) { items[sel].shrink = v; update(); });
    var orderS = slider('order', -3, 3, 0, '', function (v) { items[sel].order = v; update(); });
    var basisS = slider('flex-basis', 0, 300, 0, 'px', function (v) { items[sel].basis = v ? v + 'px' : 'auto'; basisS.el.lastChild.textContent = items[sel].basis; update(); }, 10);
    itemCard.appendChild(growS.el); itemCard.appendChild(shrinkS.el); itemCard.appendChild(basisS.el); itemCard.appendChild(orderS.el);
    var selfG = chips('align-self', 'align-self', ['auto', 'flex-start', 'flex-end', 'center', 'stretch'], function () { return items[sel].self; }, function (v) { items[sel].self = v; selfG.sync(); update(); });
    controls.appendChild(selfG.el);

    function drawItemButtons() {
      itemBtns.innerHTML = '';
      for (var k = 0; k < c.count; k++) {
        (function (k) {
          itemBtns.appendChild(h('button', { class: 'btn btn-small' + (k === sel ? ' btn-primary' : ''), type: 'button', onclick: function () { sel = k; drawItemButtons(); syncItem(); update(); } }, 'Item ' + (k + 1)));
        })(k);
      }
    }
    function syncItem() {
      var it = items[sel];
      growS.set(it.grow); shrinkS.set(it.shrink); orderS.set(it.order);
      basisS.set(it.basis === 'auto' ? 0 : parseInt(it.basis, 10)); basisS.el.lastChild.textContent = it.basis;
      selfG.sync();
    }
    function syncAll() { syncs.forEach(function (f) { f(); }); }

    var axes = h('div', { class: 'formula' });
    var p = previewBox(340, 'Flexbox preview');
    var code = U.codeBlock('', 'css', { label: 'CSS', playground: function () { return { title: 'Flexbox lab', html: lastHtml, css: U.DEMO_BASE + '\n' + lastCss }; } });
    out.appendChild(axes);
    out.appendChild(h('div', null, h('div', { class: 'preview-label' }, h('span', { class: 'live-dot' }), 'Live preview (selected item in orange)'), p.wrap));
    out.appendChild(code.el);
    var lastHtml = '', lastCss = '';

    function update() {
      var dir = c['flex-direction'];
      var main = { row: '→ left to right', 'row-reverse': '← right to left', column: '↓ top to bottom', 'column-reverse': '↑ bottom to top' }[dir];
      var cross = /row/.test(dir) ? '↓ top to bottom' : '→ left to right';
      axes.innerHTML = '<b>Main axis</b> ' + main + ' - <code>justify-content</code> spreads items along it.<br><b>Cross axis</b> ' + cross + ' - <code>align-items</code> aligns items across it.';
      var cont = '.container {\n  display: flex;\n  flex-direction: ' + dir + ';\n  flex-wrap: ' + c['flex-wrap'] + ';\n  justify-content: ' + c['justify-content'] +
        ';\n  align-items: ' + c['align-items'] + ';\n  align-content: ' + c['align-content'] + ';\n  gap: ' + c.gap + 'px;\n}';
      var itemCss = '';
      var html = '<div class="container">\n';
      for (var k = 0; k < c.count; k++) {
        var it = items[k], sz = SIZES[k];
        var extra = [];
        if (it.grow) extra.push('flex-grow: ' + it.grow);
        if (it.shrink !== 1) extra.push('flex-shrink: ' + it.shrink);
        if (it.basis !== 'auto') extra.push('flex-basis: ' + it.basis);
        if (it.self !== 'auto') extra.push('align-self: ' + it.self);
        if (it.order) extra.push('order: ' + it.order);
        if (extra.length) itemCss += '\n.item' + (k + 1) + ' {\n  ' + extra.join(';\n  ') + ';\n}';
        html += '  <div class="item item' + (k + 1) + (k === sel ? ' selected' : '') + '" style="min-width: ' + sz[0] + 'px; min-height: ' + sz[1] + 'px">' + (k + 1) + '</div>\n';
      }
      html += '</div>';
      var base = '.container {\n  min-height: 240px;\n  padding: 4px;\n  background: #eef1fb;\n  border: 2px dashed #9aa3b8;\n}\n.item {\n  background: #4f6fd8;\n  color: white;\n  font: 700 18px system-ui;\n  padding: 6px 10px;\n  border-radius: 6px;\n}\n.item.selected {\n  background: #ff7a1a;\n}';
      lastHtml = html; lastCss = base + '\n' + cont + itemCss;
      code.set(cont + itemCss);
      p.render({ html: html, css: lastCss });
    }
    drawItemButtons();
    update();
  }

  /* ===================================================================================
   * 3. Grid lab
   * =================================================================================== */
  var GRID_LINES_SCRIPT = '<script>(function () {\n' +
    '  function draw() {\n' +
    '    var g = document.querySelector(".grid"); if (!g) return;\n' +
    '    var old = document.querySelectorAll(".gl"); for (var i = 0; i < old.length; i++) old[i].remove();\n' +
    '    var cs = getComputedStyle(g), r = g.getBoundingClientRect();\n' +
    '    function px(list) { return list.split(" ").map(parseFloat).filter(function (n) { return !isNaN(n); }); }\n' +
    '    function lines(sizes, gap, start) { var out = [start], pos = start; sizes.forEach(function (s, i) { pos += s; out.push(pos + (i < sizes.length - 1 ? gap / 2 : 0)); pos += gap; }); out[0] = start; return out; }\n' +
    '    var cols = px(cs.gridTemplateColumns), rows = px(cs.gridTemplateRows);\n' +
    '    var bl = parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft), bt = parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop);\n' +
    '    var cx = lines(cols, parseFloat(cs.columnGap) || 0, r.left + bl), ry = lines(rows, parseFloat(cs.rowGap) || 0, r.top + bt);\n' +
    '    cx.forEach(function (x, i) { mark(x + scrollX, r.top - 16 + scrollY, i + 1, "v", r.height + 16); });\n' +
    '    ry.forEach(function (y, i) { mark(r.left - 18 + scrollX, y + scrollY, i + 1, "h", r.width + 18); });\n' +
    '  }\n' +
    '  function mark(x, y, n, dir, len) {\n' +
    '    var m = document.createElement("div"); m.className = "gl gl-" + dir; m.textContent = n;\n' +
    '    m.style.left = x + "px"; m.style.top = y + "px"; m.style.setProperty("--len", len + "px");\n' +
    '    document.body.appendChild(m);\n' +
    '  }\n' +
    '  addEventListener("load", draw); addEventListener("uilt:patched", draw); addEventListener("resize", draw);\n' +
    '})();</' + 'script>\n' +
    '<style>.gl { position: absolute; font: 700 11px monospace; color: #b42318; pointer-events: none; }\n' +
    '.gl-v { transform: translateX(-50%); } .gl-v::after { content: ""; position: absolute; left: 50%; top: 14px; height: var(--len); border-left: 1px dashed #b42318; }\n' +
    '.gl-h { transform: translateY(-50%); } .gl-h::after { content: ""; position: absolute; top: 50%; left: 14px; width: var(--len); border-top: 1px dashed #b42318; }</style>';

  function grid(main, ex) {
    head(main, ex, 'A grid container is divided into **columns** and **rows**. The red dashed lines are the **grid lines** the browser created, numbered from 1 - the numbers you use with `grid-column: 1 / 3`. `fr` means "a share of the free space". Pick item 2 to place it yourself.');
    var s = { cols: '1fr 1fr 1fr', rows: 'auto', gap: 8, count: 7, ji: 'stretch', ai: 'stretch', col: 'auto', row: 'auto' };
    var controls = h('div', { class: 'ex-controls' });
    var out = h('div', { class: 'ex-out' });
    main.appendChild(h('div', { class: 'ex-layout' }, controls, out));

    function textControl(label, prop, key, presets) {
      var input = h('input', { class: 'input mono', type: 'text', spellcheck: 'false', 'aria-label': label });
      input.value = s[key];
      var mark = h('span', { class: 'valid-mark' });
      input.addEventListener('input', function () {
        var ok = CSS.supports(prop, input.value);
        mark.className = 'valid-mark ' + (ok ? 'ok' : 'bad');
        mark.textContent = ok ? '✓' : '✗ not valid';
        if (ok) { s[key] = input.value; update(); }
      });
      var chipBox = h('div', { class: 'chips', style: { marginTop: '8px' } });
      presets.forEach(function (v) {
        chipBox.appendChild(h('button', { class: 'chip', type: 'button', onclick: function () { input.value = v; s[key] = v; mark.textContent = ''; update(); } }, v));
      });
      return h('div', { class: 'control' }, h('div', { class: 'control-head' }, h('a', { class: 'control-name', href: '#/css/' + prop }, label)),
        h('div', { class: 'control-row' }, input, mark), chipBox);
    }
    controls.appendChild(textControl('grid-template-columns', 'grid-template-columns', 'cols', ['1fr 1fr 1fr', '100px 1fr', '1fr 2fr 1fr', 'repeat(4, 1fr)', 'repeat(auto-fill, minmax(90px, 1fr))', '150px auto 80px']));
    controls.appendChild(textControl('grid-template-rows', 'grid-template-rows', 'rows', ['auto', '60px 60px', '1fr 2fr', 'repeat(3, 50px)']));
    var card = h('div', { class: 'control' });
    card.appendChild(slider('gap', 0, 30, s.gap, 'px', function (v) { s.gap = v; update(); }).el);
    card.appendChild(slider('items', 1, 12, s.count, '', function (v) { s.count = v; update(); }).el);
    controls.appendChild(card);
    var ji = chips('justify-items', 'justify-items', ['stretch', 'start', 'center', 'end'], function () { return s.ji; }, function (v) { s.ji = v; ji.sync(); update(); });
    var ai = chips('align-items', 'align-items', ['stretch', 'start', 'center', 'end'], function () { return s.ai; }, function (v) { s.ai = v; ai.sync(); update(); });
    controls.appendChild(ji.el); controls.appendChild(ai.el);
    controls.appendChild(h('h3', { style: { margin: '6px 0 0' } }, 'Place item 2 (orange)'));
    controls.appendChild(textControl('grid-column', 'grid-column', 'col', ['auto', 'span 2', '1 / 3', '2 / -1', '1 / -1']));
    controls.appendChild(textControl('grid-row', 'grid-row', 'row', ['auto', 'span 2', '1 / 3']));

    var p = previewBox(360, 'Grid preview');
    var code = U.codeBlock('', 'css', { label: 'CSS', playground: function () { return { title: 'Grid lab', html: lastHtml, css: U.DEMO_BASE + '\n' + lastCss }; } });
    out.appendChild(h('div', null, h('div', { class: 'preview-label' }, h('span', { class: 'live-dot' }), 'Live preview with numbered grid lines'), p.wrap));
    out.appendChild(code.el);
    out.appendChild(U.callout('java', 'Java analogy', U.md('Like `GridBagLayout`, but you define the tracks once on the container: `grid-column: 1 / 3` is `gridx = 0, gridwidth = 2` - except lines are counted from 1, and lines (not cells) are numbered.')));
    var lastHtml = '', lastCss = '';

    function update() {
      var html = '<div class="grid">\n';
      for (var k = 1; k <= s.count; k++) html += '  <div class="cell' + (k === 2 ? ' two' : '') + '">' + k + '</div>\n';
      html += '</div>';
      var rule = '.grid {\n  display: grid;\n  grid-template-columns: ' + s.cols + ';\n  grid-template-rows: ' + s.rows + ';\n  gap: ' + s.gap + 'px;\n  justify-items: ' + s.ji + ';\n  align-items: ' + s.ai + ';\n}\n' +
        '.two {\n  grid-column: ' + s.col + ';\n  grid-row: ' + s.row + ';\n}';
      var base = 'body {\n  padding: 22px 10px 10px 26px;\n}\n.grid {\n  min-height: 200px;\n  background: #eef1fb;\n}\n.cell {\n  padding: 8px;\n  background: #4f6fd8;\n  color: white;\n  font: 700 16px system-ui;\n  border-radius: 6px;\n}\n.two {\n  background: #ff7a1a;\n}';
      lastHtml = html; lastCss = base + '\n' + rule;
      code.set(rule);
      p.render({ html: html, css: lastCss, head: GRID_LINES_SCRIPT });
    }
    update();
  }

  /* ===================================================================================
   * 4. Positioning
   * =================================================================================== */
  function positioning(main, ex) {
    head(main, ex, 'The orange box has `top` and `left` offsets. Whether they do anything, and what they are measured from, depends on `position`. Scroll inside the preview to see sticky and fixed in action.');
    var s = { position: 'relative', top: 20, left: 40, parentRel: true, z: 0 };
    var controls = h('div', { class: 'ex-controls' });
    var out = h('div', { class: 'ex-out' });
    main.appendChild(h('div', { class: 'ex-layout' }, controls, out));
    var pg = chips('position', 'position', ['static', 'relative', 'absolute', 'fixed', 'sticky'], function () { return s.position; }, function (v) { s.position = v; pg.sync(); update(); });
    controls.appendChild(pg.el);
    var card = h('div', { class: 'control' });
    card.appendChild(slider('top', -20, 120, s.top, 'px', function (v) { s.top = v; update(); }).el);
    card.appendChild(slider('left', -20, 200, s.left, 'px', function (v) { s.left = v; update(); }).el);
    card.appendChild(slider('z-index', -1, 3, s.z, '', function (v) { s.z = v; update(); }).el);
    controls.appendChild(card);
    var sw = U.switchControl('Parent has position: relative', s.parentRel, function (on) { s.parentRel = on; update(); });
    controls.appendChild(h('div', { class: 'control' }, sw.el, h('div', { class: 'control-desc', style: { marginTop: '6px' } }, 'An absolute element is positioned against its nearest positioned ancestor. Turn this off and the box jumps to the page.')));

    var explain = h('div', { class: 'callout callout-info', 'aria-live': 'polite' });
    var p = previewBox(320, 'Positioning preview');
    var code = U.codeBlock('', 'css', { label: 'CSS' });
    out.appendChild(explain);
    out.appendChild(h('div', null, h('div', { class: 'preview-label' }, h('span', { class: 'live-dot' }), 'Live preview - scroll inside it'), p.wrap));
    out.appendChild(code.el);

    var TEXT = {
      static: ['Normal flow.', 'top and left are ignored: the box sits where the HTML puts it. Blue box B (z-index 1) is unaffected by z-index on a static box.'],
      relative: ['Shifted from its own normal spot.', 'The box is drawn {top}px lower and {left}px further right than normal, but the dashed placeholder space it left behind stays reserved - the text below does not move up.'],
      absolute: ['Out of the flow, placed against an ancestor.', 'The text below closes the gap. The box is placed {top}px from the top and {left}px from the left of {ref}.'],
      fixed: ['Pinned to the viewport.', 'Placed {top}px / {left}px from the corner of the preview window, and it stays there when you scroll.'],
      sticky: ['In the flow until it would scroll away.', 'Behaves like relative until scrolling would push it above top: {top}px - then it sticks there while its parent is on screen. Scroll the preview.']
    };
    function update() {
      var t = TEXT[s.position];
      var ref = s.parentRel ? 'the dashed parent (it has position: relative)' : 'the whole page (no positioned ancestor)';
      explain.innerHTML = '<div class="callout-title">position: ' + s.position + ' - ' + t[0] + '</div><div class="callout-body">' +
        t[1].replace('{top}', s.top).replace('{top}', s.top).replace('{left}', s.left).replace('{ref}', ref) + '</div>';
      var rule = '.box {\n  position: ' + s.position + ';\n  top: ' + s.top + 'px;\n  left: ' + s.left + 'px;\n  z-index: ' + s.z + ';\n}\n.parent {\n  position: ' + (s.parentRel ? 'relative' : 'static') + ';\n}';
      code.set(rule);
      p.render({
        html: '<p>Scroll down inside this preview ↓</p>\n<div class="parent">\n  <p>Parent: first line</p>\n  <div class="box">Box</div>\n  <p>Text after the box. With absolute or fixed, this line moves up into the box\'s old place.</p>\n  <div class="b">B (z-index: 1)</div>\n</div>\n' +
          '<p>More content…</p><p>More content…</p><p>More content…</p><p>More content…</p><p>More content…</p><p>More content…</p><p>The end.</p>',
        css: '.parent {\n  margin: 10px 0 10px 30px;\n  padding: 6px;\n  border: 2px dashed #4f6fd8;\n  background: #f3f5fb;\n}\n.box {\n  width: 90px;\n  padding: 10px;\n  background: #ff7a1a;\n  color: white;\n}\n.b {\n  position: relative;\n  z-index: 1;\n  width: 140px;\n  margin-top: -30px;\n  margin-left: 60px;\n  padding: 10px;\n  background: rgb(79 111 216 / 85%);\n  color: white;\n}\n' + rule
      });
    }
    update();
  }

  /* ===================================================================================
   * 5. Selectors and specificity
   * =================================================================================== */

  /** Specificity of one complex selector: {a: ids, b: classes/attributes/pseudo-classes, c: types/pseudo-elements, parts}. */
  function specificityOf(sel) {
    var a = 0, b = 0, c = 0, parts = [], i = 0, n = sel.length;
    function readIdent() { var st = i; while (i < n && /[\w\- -￿\\]/.test(sel.charAt(i))) i++; return sel.slice(st, i); }
    function readParens() {
      var depth = 0, st = i;
      for (; i < n; i++) {
        var ch = sel.charAt(i);
        if (ch === '(') depth++;
        else if (ch === ')') { depth--; if (depth === 0) { i++; break; } }
      }
      return sel.slice(st + 1, i - 1);
    }
    function maxOf(list) {
      var best = { a: 0, b: 0, c: 0 };
      splitList(list).forEach(function (s) {
        var x = specificityOf(s);
        if (x.a > best.a || (x.a === best.a && (x.b > best.b || (x.b === best.b && x.c > best.c)))) best = x;
      });
      return best;
    }
    while (i < n) {
      var ch = sel.charAt(i);
      if (/\s|>|\+|~/.test(ch)) { var st = i; while (i < n && /[\s>+~]/.test(sel.charAt(i))) i++; var comb = sel.slice(st, i).trim(); parts.push({ text: comb || '␣', kind: '0', why: comb ? 'combinator: adds nothing' : 'descendant combinator (a space): adds nothing' }); continue; }
      if (ch === '#') { i++; parts.push({ text: '#' + readIdent(), kind: 'a', why: 'id: +1 in the first column' }); a++; continue; }
      if (ch === '.') { i++; parts.push({ text: '.' + readIdent(), kind: 'b', why: 'class: +1 in the second column' }); b++; continue; }
      if (ch === '[') { var e = sel.indexOf(']', i); e = e < 0 ? n : e + 1; parts.push({ text: sel.slice(i, e), kind: 'b', why: 'attribute selector: +1 in the second column' }); b++; i = e; continue; }
      if (ch === '*') { i++; parts.push({ text: '*', kind: '0', why: 'universal selector: adds nothing' }); continue; }
      if (ch === ':') {
        if (sel.charAt(i + 1) === ':') { i += 2; var pe = readIdent(); if (sel.charAt(i) === '(') readParens(); parts.push({ text: '::' + pe, kind: 'c', why: 'pseudo-element: +1 in the third column' }); c++; continue; }
        i++;
        var name = readIdent().toLowerCase();
        if (/^(before|after|first-line|first-letter)$/.test(name)) { parts.push({ text: ':' + name, kind: 'c', why: 'old-style pseudo-element: +1 in the third column' }); c++; continue; }
        if (sel.charAt(i) === '(') {
          var arg = readParens();
          if (name === 'where') { parts.push({ text: ':where(' + arg + ')', kind: '0', why: ':where() always adds nothing' }); continue; }
          if (name === 'is' || name === 'not' || name === 'has' || name === 'matches') {
            var m = maxOf(arg);
            a += m.a; b += m.b; c += m.c;
            parts.push({ text: ':' + name + '(' + arg + ')', kind: m.a ? 'a' : m.b ? 'b' : m.c ? 'c' : '0', why: ':' + name + '() counts as its most specific argument: (' + m.a + ',' + m.b + ',' + m.c + ')' });
            continue;
          }
          parts.push({ text: ':' + name + '(' + arg + ')', kind: 'b', why: 'pseudo-class: +1 in the second column' }); b++; continue;
        }
        parts.push({ text: ':' + name, kind: 'b', why: 'pseudo-class: +1 in the second column' }); b++; continue;
      }
      var id = readIdent();
      if (id) { parts.push({ text: id, kind: 'c', why: 'element type: +1 in the third column' }); c++; continue; }
      i++; // skip anything unexpected
    }
    return { a: a, b: b, c: c, parts: parts };
  }
  function splitList(s) {
    var out = [], depth = 0, st = 0;
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      else if (ch === ',' && depth === 0) { out.push(s.slice(st, i).trim()); st = i + 1; }
    }
    out.push(s.slice(st).trim());
    return out.filter(Boolean);
  }
  U.specificity = function (sel) { return splitList(sel).map(specificityOf); };

  var SAMPLE_PAGE = '<nav id="menu" class="nav">\n  <ul>\n    <li class="item"><a href="#">Home</a></li>\n    <li class="item active"><a href="#" class="link">Blog</a></li>\n    <li class="item"><a href="#">About</a></li>\n  </ul>\n</nav>\n<main>\n  <h1 class="title">Hello</h1>\n  <p class="intro">An <em>intro</em> paragraph.</p>\n  <p>A <a href="#" class="link">link</a> in text.</p>\n</main>';

  function specificity(main, ex) {
    head(main, ex, 'A **selector** picks elements. When two rules set the same property on the same element, the browser compares their **specificity** - a score with three columns: ids, then classes / attributes / pseudo-classes, then element types. The higher score wins, column by column from the left. If the scores tie, the rule written **later** wins.');
    var controls = h('div', { class: 'ex-controls' });
    var out = h('div', { class: 'ex-out' });
    main.appendChild(h('div', { class: 'ex-layout' }, controls, out));

    var selInput = h('input', { class: 'input mono', type: 'text', value: 'li.active a', spellcheck: 'false', 'aria-label': 'Selector to test' });
    var presets = h('div', { class: 'chips', style: { marginTop: '8px' } });
    ['li', '.item', 'li.active', '#menu a', 'nav > ul > li', 'p:first-of-type', 'a[href]', 'main p em', 'li:not(.active)', '.link', '*'].forEach(function (v) {
      presets.appendChild(h('button', { class: 'chip', type: 'button', onclick: function () { selInput.value = v; test(); } }, v));
    });
    var score = h('div');
    controls.appendChild(h('div', { class: 'control' }, h('div', { class: 'control-head' }, h('span', { class: 'control-name' }, 'Selector')), selInput, presets));
    controls.appendChild(h('div', { class: 'control' }, score));
    controls.appendChild(U.callout('java', 'Java analogy', U.md('Like overload resolution: the most specific match wins. Unlike Java there is no compile error for a tie - the rule declared later quietly wins. An inline `style=""` beats every selector, and `!important` beats even that (avoid it).')));

    var matchInfo = h('div', { class: 'formula' });
    var p = previewBox(260, 'Sample page');
    out.appendChild(h('div', null, h('div', { class: 'preview-label' }, h('span', { class: 'live-dot' }), 'Sample page - matches are outlined'), p.wrap));
    out.appendChild(matchInfo);
    out.appendChild(U.section('HTML of the sample page', U.codeBlock(SAMPLE_PAGE, 'html', { copy: false }).el, false));
    p.render({ html: SAMPLE_PAGE, css: 'a { color: #4353c9; }' });

    function scoreHtml(sp) {
      return '<div class="spec-score" aria-label="specificity ' + sp.a + ',' + sp.b + ',' + sp.c + '"><span class="spec-a">' + sp.a + '</span><span class="spec-b">' + sp.b + '</span><span class="spec-c">' + sp.c + '</span></div>';
    }
    function test() {
      var sel = selInput.value.trim();
      var specs = sel ? U.specificity(sel) : [];
      score.innerHTML = specs.map(function (sp) {
        return '<div class="control-head"><span class="control-name">Score</span><span class="faint">(ids, classes, types)</span></div>' + scoreHtml(sp) +
          '<div class="spec-parts">' + sp.parts.map(function (pt) { return '<span class="spec-part spec-' + pt.kind + '" title="' + U.esc(pt.why) + '">' + U.esc(pt.text) + '</span>'; }).join('') + '</div>' +
          '<ul class="list-tidy faint">' + sp.parts.filter(function (pt) { return pt.kind !== '0' || pt.text !== '␣'; }).map(function (pt) { return '<li><code>' + U.esc(pt.text) + '</code> - ' + U.esc(pt.why) + '</li>'; }).join('') + '</ul>';
      }).join('<hr>') || '<span class="faint">Type a selector.</span>';
      p.ask({ type: 'match', sel: sel || '#__none' }).then(function (r) {
        if (!r) return;
        if (r.error) { matchInfo.innerHTML = '<span class="valid-mark bad">✗ ' + U.esc(r.error) + '</span>'; return; }
        matchInfo.innerHTML = '<b>' + r.count + '</b> element' + (r.count === 1 ? '' : 's') + ' matched' + (r.count ? ': ' + r.items.map(function (x) { return '<code>' + U.esc(x.label) + '</code>'; }).join(' ') : '.');
      });
    }
    selInput.addEventListener('input', U.debounce(test, 150));
    test();

    // --- rule battle
    main.appendChild(h('h2', null, 'Rule battle: which colour wins?'));
    main.appendChild(h('p', { class: 'muted' }, 'Two rules set the colour of the same elements. Change the selectors and see which rule wins for each element, and why.'));
    var A = { sel: '.item a', color: '#d6336c' }, B = { sel: 'nav a', color: '#1f7a43' };
    var battle = h('div', { class: 'ex-layout' });
    var bControls = h('div', { class: 'ex-controls' });
    var bOut = h('div', { class: 'ex-out' });
    battle.appendChild(bControls); battle.appendChild(bOut);
    main.appendChild(battle);
    function ruleControl(label, r) {
      var inp = h('input', { class: 'input mono', type: 'text', value: r.sel, spellcheck: 'false', 'aria-label': label + ' selector' });
      inp.addEventListener('input', U.debounce(function () { r.sel = inp.value.trim(); fight(); }, 200));
      return h('div', { class: 'control' }, h('div', { class: 'control-head' }, h('span', { class: 'control-name', style: { color: r.color } }, label), h('span', { class: 'control-kind' }, 'colour ' + r.color)), inp);
    }
    bControls.appendChild(ruleControl('Rule A (first)', A));
    bControls.appendChild(ruleControl('Rule B (later)', B));
    var verdict = h('div', { class: 'formula' });
    var bp = previewBox(240, 'Rule battle');
    var bcode = U.codeBlock('', 'css', { label: 'The two rules' });
    bOut.appendChild(bp.wrap);
    bOut.appendChild(verdict);
    bOut.appendChild(bcode.el);
    function cmp(x, y) { return x.a - y.a || x.b - y.b || x.c - y.c; }
    function fight() {
      var css = A.sel + ' {\n  color: ' + A.color + ';\n}\n' + B.sel + ' {\n  color: ' + B.color + ';\n}';
      bcode.set(css);
      bp.render({ html: SAMPLE_PAGE, css: 'a { font-weight: 700; }\n' + css }).then(function () {
        return bp.ask({
          type: 'eval',
          code: 'function (doc) { var A = ' + JSON.stringify(A.sel) + ', B = ' + JSON.stringify(B.sel) + '; var out = [];' +
            ' Array.prototype.forEach.call(doc.body.querySelectorAll("*"), function (el) { var ma = false, mb = false;' +
            ' try { ma = el.matches(A); } catch (e) {} try { mb = el.matches(B); } catch (e) {}' +
            ' if (ma || mb) out.push({ label: el.tagName.toLowerCase() + (el.className ? "." + el.className.trim().split(/\\s+/).join(".") : ""), text: el.textContent.trim().slice(0, 20), a: ma, b: mb, color: getComputedStyle(el).color }); });' +
            ' return out; }'
        });
      }).then(function (rows) {
        if (!rows) return;
        var sa = U.specificity(A.sel || '*'), sb = U.specificity(B.sel || '*');
        var spA = sa[0], spB = sb[0];
        var html = '<div>A ' + scoreHtml(spA) + ' vs B ' + scoreHtml(spB) + '</div>';
        if (!rows.length) { verdict.innerHTML = html + '<p>Neither rule matches anything.</p>'; return; }
        html += '<ul class="list-tidy">';
        rows.forEach(function (r) {
          var why;
          if (r.a && r.b) {
            var d = cmp(spA, spB);
            why = d > 0 ? '<b style="color:' + A.color + '">A wins</b>: its score is higher' : d < 0 ? '<b style="color:' + B.color + '">B wins</b>: its score is higher' : '<b style="color:' + B.color + '">B wins</b>: equal scores, and B comes later';
          } else why = r.a ? 'only A matches' : 'only B matches';
          html += '<li><code>' + U.esc(r.label) + '</code> "' + U.esc(r.text) + '" - ' + why + '</li>';
        });
        verdict.innerHTML = html + '</ul>';
      });
    }
    fight();
  }

  /* ===================================================================================
   * 6. DOM tree
   * =================================================================================== */
  function domTree(main, ex) {
    head(main, ex, 'The browser reads your HTML and builds a **tree of objects**, the DOM (Document Object Model). Every element becomes a node; text between tags becomes text nodes. JavaScript and CSS both work on this tree, not on your text. Edit the HTML and click any node.');
    var start = '<header>\n  <h1>My page</h1>\n</header>\n<main>\n  <p>Hello <strong>world</strong>!</p>\n  <ul>\n    <li>One</li>\n    <li class="special">Two</li>\n  </ul>\n</main>';
    var left = h('div', { class: 'ex-controls' });
    var right = h('div', { class: 'ex-out' });
    main.appendChild(h('div', { class: 'ex-layout' }, left, right));
    left.appendChild(h('div', { class: 'pg-pane-head' }, 'HTML'));
    var ed = U.editor.create(left, { mode: 'html', value: start, height: U.layout.editorHeight('dom-tree', 240), onChange: U.debounce(function () { render(); }, 300) });
    left.appendChild(U.layout.grip({ kind: 'dom-tree', editors: [ed], def: 240 }).el);
    var info = h('div', { class: 'formula' }, 'Click a node in the tree.');
    left.appendChild(info);
    left.appendChild(U.callout('java', 'Java analogy', U.md('This is the same model as `org.w3c.dom` in Java: `Node.getChildNodes()`, `getParentNode()`, `getAttribute()`. In the browser: `el.children`, `el.parentElement`, `el.getAttribute()`.')));

    var tree = h('div', { class: 'tree', role: 'tree', 'aria-label': 'DOM tree' });
    var p = previewBox(220, 'DOM preview');
    right.appendChild(h('div', { class: 'preview-label' }, 'The tree'));
    right.appendChild(tree);
    right.appendChild(h('div', null, h('div', { class: 'preview-label' }, h('span', { class: 'live-dot' }), 'The page'), p.wrap));

    var selected = null;
    function selectorPath(node, chain) {
      // chain: list of {tag, attrs, index among element siblings}
      return chain.filter(function (x) { return x.tag !== 'html'; }).map(function (x) {
        var id = (x.attrs || []).filter(function (a) { return a.name === 'id'; })[0];
        if (id) return '#' + id.value;
        return x.tag + (x.nth ? ':nth-child(' + x.nth + ')' : '');
      }).join(' > ');
    }
    function drawNode(node, chain) {
      var li = h('li', { role: 'treeitem' });
      var label;
      if (node.type === 'el') {
        label = h('span', { class: 'tree-node', html: '&lt;<span class="t-tag">' + node.tag + '</span>' +
          node.attrs.map(function (a) { return ' <span class="t-attr">' + U.esc(a.name) + '</span>=<span class="t-val">"' + U.esc(a.value) + '"</span>'; }).join('') + '&gt;' });
      } else if (node.type === 'text') {
        label = h('span', { class: 'tree-node t-text' }, '#text "' + node.text + '"');
      } else {
        label = h('span', { class: 'tree-node t-text' }, '<!-- ' + node.text + ' -->');
      }
      label.tabIndex = 0;
      function pick() {
        if (selected) selected.classList.remove('sel');
        selected = label; label.classList.add('sel');
        p.ask({ type: 'highlight', path: node.path });
        var kids = node.children || [];
        var elKids = kids.filter(function (k) { return k.type === 'el'; }).length;
        if (node.type === 'el') {
          info.innerHTML = '<b>&lt;' + node.tag + '&gt;</b> element node<br>' +
            'Children: ' + kids.length + ' (' + elKids + ' element' + (elKids === 1 ? '' : 's') + ', ' + (kids.length - elKids) + ' text)<br>' +
            'Reach it from JavaScript:<br><code>document.querySelector("' + U.esc(selectorPath(node, chain)) + '")</code>';
        } else {
          info.innerHTML = '<b>Text node</b>: "' + U.esc(node.text) + '"<br>Text nodes have no tag and no children. Read the text of its parent with <code>el.textContent</code>.';
        }
      }
      label.addEventListener('click', pick);
      label.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      li.appendChild(label);
      if (node.children && node.children.length) {
        var ul = h('ul', { role: 'group' });
        var nth = 0;
        node.children.forEach(function (k) {
          if (k.type === 'el') nth++;
          ul.appendChild(drawNode(k, k.type === 'el' ? chain.concat([{ tag: k.tag, attrs: k.attrs, nth: nth }]) : chain));
        });
        li.appendChild(ul);
      }
      return li;
    }
    function render() {
      p.render({ html: ed.get(), css: 'header, main, ul, li, p, h1, strong { outline: 1px dotted #c9cfdc; }' }).then(function () {
        return p.ask({ type: 'tree' });
      }).then(function (t) {
        if (!t) return;
        tree.innerHTML = '';
        selected = null;
        tree.appendChild(h('ul', null, drawNode(t, [{ tag: 'html', attrs: [] }])));
      });
    }
    render();
  }

  /* ===================================================================================
   * 7. Units
   * =================================================================================== */
  function units(main, ex) {
    head(main, ex, 'Every bar below is set to a width in a different unit. Change the root font size (on `<html>`), the parent\'s font size and the parent\'s width, and see which bars react. The pixel values are measured from the preview.');
    var s = { root: 16, parent: 20, width: 80 };
    var controls = h('div', { class: 'ex-controls' });
    var out = h('div', { class: 'ex-out' });
    main.appendChild(h('div', { class: 'ex-layout' }, controls, out));
    var card = h('div', { class: 'control' });
    card.appendChild(slider('html font', 10, 28, s.root, 'px', function (v) { s.root = v; update(); }).el);
    card.appendChild(slider('parent font', 10, 32, s.parent, 'px', function (v) { s.parent = v; update(); }).el);
    card.appendChild(slider('parent width', 30, 100, s.width, '%', function (v) { s.width = v; update(); }).el);
    controls.appendChild(card);
    controls.appendChild(U.callout('tip', 'Rules of thumb', U.md('- `rem` for font sizes and spacing: respects the user\'s font setting.\n- `%` and `fr` for widths in layouts.\n- `px` for borders and fine details.\n- `vw`/`vh` for things sized to the screen.\n- `ch` for line lengths of text.')));

    var UNITS = [
      { css: '200px', unit: 'px', rel: 'nothing: an absolute CSS pixel' },
      { css: '10em', unit: 'em', rel: 'the parent\'s font size (inherited by the bar)' },
      { css: '10rem', unit: 'rem', rel: 'the root (<html>) font size' },
      { css: '50%', unit: '%', rel: 'the parent\'s width' },
      { css: '50vw', unit: 'vw', rel: 'the viewport width (1vw = 1%)' },
      { css: '20ch', unit: 'ch', rel: 'the width of "0" in the bar\'s font' }
    ];
    var p = previewBox(300, 'Units preview');
    var table = h('div', { class: 'table-wrap' });
    out.appendChild(h('div', null, h('div', { class: 'preview-label' }, h('span', { class: 'live-dot' }), 'Live preview (the dashed box is the parent)'), p.wrap));
    out.appendChild(table);
    var seq = 0;
    function update() {
      var html = '<div class="parent">\n' + UNITS.map(function (u, i) { return '  <div class="bar b' + i + '">' + u.css + '</div>'; }).join('\n') + '\n</div>';
      var css = 'html {\n  font-size: ' + s.root + 'px;\n}\nbody {\n  font-size: 14px;\n}\n.parent {\n  width: ' + s.width + '%;\n  font-size: ' + s.parent + 'px;\n  border: 2px dashed #9aa3b8;\n  padding: 4px 0;\n}\n.bar {\n  margin: 4px 0;\n  padding: 2px 6px;\n  background: #4f6fd8;\n  color: white;\n  font-size: 1em;\n  white-space: nowrap;\n  box-sizing: border-box;\n}\n' +
        UNITS.map(function (u, i) { return '.b' + i + ' { width: ' + u.css + '; }'; }).join('\n');
      var mine = ++seq;
      p.render({ html: html, css: css }).then(function () { return p.ask({ type: 'rect', sel: '.bar', all: true }); }).then(function (rects) {
        if (mine !== seq || !rects) return;
        table.innerHTML = '<table class="table"><thead><tr><th>Value</th><th>Relative to</th><th>Width now</th></tr></thead><tbody>' +
          UNITS.map(function (u, i) { return '<tr><td><code>' + u.css + '</code></td><td>' + U.esc(u.rel) + '</td><td class="mono" data-unit="' + u.unit + '">' + Math.round(rects[i].width) + 'px</td></tr>'; }).join('') + '</tbody></table>';
      });
    }
    update();
  }

  // the JavaScript explainers (event loop, bubbling) live in explainers-js.js and register here too
  var BUILDERS = U.explainerBuilders = { 'box-model': boxModel, flexbox: flexbox, grid: grid, positioning: positioning, specificity: specificity, 'dom-tree': domTree, units: units };
  U.explainerKit = { head: head, chips: chips, slider: slider, previewBox: previewBox };

  U.views.explain = {
    render: function (root, params) {
      var ex = params[0] && U.find('explainers', params[0]);
      if (ex && BUILDERS[ex.id]) {
        BUILDERS[ex.id](root, ex);
        var layouts = U.$$('.ex-layout', root);   // Specificity has two: one divider position for both
        layouts.forEach(function (l) { U.layout.split(l, { key: 'explain', minLeft: 260, minRight: 340, label: 'Resize the controls and the picture' }); });
        var title = U.$('.page-title', root);
        if (title) title.appendChild(U.layout.full(layouts[0] || root, { kind: 'explain', root: root }).btn);
        return;
      }
      root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Visual explainers'),
        h('p', null, 'The ideas that confuse everyone at first, each with controls you can move and a live picture of what the browser does.')));
      var cards = h('div', { class: 'cards' });
      U.data.explainers.forEach(function (x, i) {
        cards.appendChild(h('a', { class: 'card', href: '#/explain/' + x.id },
          h('div', { class: 'card-kicker' }, 'Explainer ' + (i + 1)), h('h3', null, x.title), h('p', { class: 'muted', style: { margin: 0 } }, x.summary)));
      });
      root.appendChild(cards);
    }
  };
  U.route('explain', U.views.explain);
})(window.UILT);
