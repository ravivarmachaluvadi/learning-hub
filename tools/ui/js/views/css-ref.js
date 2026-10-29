/*
 * views/css-ref.js - the CSS property reference (#/css and #/css/<property>).
 *
 * Each property page applies one declaration, `<target> { <property>: <value>; }`, on top of a
 * small demo, and redraws it whenever the value changes: by clicking or hovering a keyword chip,
 * by moving a slider / colour picker / builder, or by typing any value (checked with CSS.supports).
 * "Compare all values" shows one mini preview per keyword, side by side.
 * The line between the controls and the preview can be dragged (one position for every element and
 * property page), and Full screen puts the whole page across the window (js/layout.js).
 */
(function (U) {
  'use strict';
  var h = U.h;

  var ORDER = ['Box model', 'Colour & background', 'Text & fonts', 'Display & visibility', 'Flexbox', 'Grid', 'Positioning', 'Effects & motion', 'Lists & tables', 'Interaction & misc'];
  var MDN = 'https://developer.mozilla.org/en-US/docs/Web/CSS/';

  function list() { return U.data.cssProperties || []; }

  /** The demo for an entry: its own {html, css, target} or a named shared preset with overrides. */
  function demoOf(entry) {
    var d = entry.demo || 'box';
    if (typeof d === 'string') d = { preset: d };
    var base = d.preset ? (U.data.cssDemos || {})[d.preset] || {} : {};
    return {
      html: d.html !== undefined ? d.html : base.html || '',
      css: (base.css || '') + (d.css ? (base.css ? '\n' : '') + d.css : ''),
      target: d.target || base.target || '.box',
      pseudo: d.pseudo || base.pseudo || '',
      height: d.height || base.height
    };
  }

  /** {html, css, rule} for an entry and a value. Exported for the tests. */
  function build(entry, value) {
    var d = demoOf(entry);
    var rule = d.target + d.pseudo + ' {\n  ' + entry.name + ': ' + value + ';\n}';
    var css = (d.css ? d.css + '\n\n' : '') + '/* the property you are exploring */\n' + rule;
    return { html: d.html, css: css, rule: rule, target: d.target, pseudo: d.pseudo };
  }

  function supports(prop, value) {
    try { return window.CSS && CSS.supports ? CSS.supports(prop, value) : true; } catch (e) { return false; }
  }

  /* ---------- typed inputs ---------- */

  /** One input part: length/number/time/angle (slider + number + unit), color, or select. Returns {el, get()}. */
  function part(spec, onChange) {
    if (spec.type === 'color') {
      var col = h('input', { type: 'color', 'aria-label': spec.label || 'colour' });
      col.value = spec.value || '#4353c9';
      col.addEventListener('input', onChange);
      return { el: col, get: function () { return col.value; } };
    }
    if (spec.type === 'select') {
      var sel = h('select', { class: 'select input-small', 'aria-label': spec.label || 'option' },
        spec.options.map(function (o) { return h('option', { value: o }, o); }));
      sel.value = spec.value || spec.options[0];
      sel.addEventListener('change', onChange);
      return { el: sel, get: function () { return sel.value; } };
    }
    var units = spec.units || (spec.type === 'time' ? ['s', 'ms'] : spec.type === 'angle' ? ['deg', 'turn'] : spec.type === 'number' ? [''] : ['px']);
    var rng = h('input', { type: 'range', min: spec.min, max: spec.max, step: spec.step || 1, 'aria-label': (spec.label || 'value') + ' slider' });
    var num = h('input', { class: 'input input-small', type: 'number', min: spec.min, max: spec.max, step: spec.step || 1, 'aria-label': spec.label || 'value' });
    rng.value = num.value = spec.value !== undefined ? spec.value : spec.min;
    var unit = units.length > 1
      ? h('select', { class: 'select input-small', 'aria-label': 'unit' }, units.map(function (u) { return h('option', { value: u }, u); }))
      : null;
    rng.addEventListener('input', function () { num.value = rng.value; onChange(); });
    num.addEventListener('input', function () { rng.value = num.value; onChange(); });
    if (unit) unit.addEventListener('change', onChange);
    var el = h('span', { class: 'control-row', style: { flex: '1 1 260px' } }, rng, num, unit || (units[0] ? h('span', { class: 'mono faint' }, units[0]) : null));
    return { el: el, get: function () { return num.value + (unit ? unit.value : units[0]); } };
  }

  /** A full custom-value row: a single part, or a builder of several parts joined by `format`. */
  function inputRow(spec, onValue) {
    var parts = [];
    function value() {
      if (spec.type !== 'builder') return parts[0].get();
      return spec.format.replace(/\{(\d+)\}/g, function (_, i) { return parts[+i].get(); });
    }
    function changed() { onValue(value()); }
    var box = h('div', { class: 'control' },
      h('div', { class: 'control-head' }, h('span', { class: 'control-name' }, spec.label || 'Custom value'),
        h('span', { class: 'control-kind' }, spec.type === 'builder' ? 'builder' : spec.type)),
      spec.desc ? h('div', { class: 'control-desc', html: U.md(spec.desc) }) : null);
    if (spec.type === 'builder') {
      spec.parts.forEach(function (p) {
        var pp = part(p, changed);
        parts.push(pp);
        box.appendChild(h('div', { class: 'slider-row', style: { gridTemplateColumns: '110px minmax(0, 1fr)' } },
          h('label', null, p.label), pp.el));
      });
    } else {
      var pp = part(spec, changed);
      parts.push(pp);
      box.appendChild(h('div', { class: 'control-row' }, pp.el));
    }
    box.appendChild(h('div', { class: 'row', style: { marginTop: '8px' } },
      h('button', { class: 'btn btn-small', type: 'button', onclick: changed }, 'Apply this value'),
      h('span', { class: 'faint' }, 'Moving any control applies it.')));
    return box;
  }

  /* ---------- intro page (#/css) ---------- */

  function intro(main) {
    main.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'CSS properties'),
      h('p', null, 'CSS decides how the HTML looks: colours, sizes, spacing and layout. Each page here shows one property, ' +
        'every value it accepts with a plain explanation, and a live preview. Hover a value to preview it; click it to keep it.')));

    main.appendChild(h('div', { class: 'card' },
      h('h2', { style: { marginTop: 0 } }, 'Anatomy of a CSS rule'),
      h('div', {
        class: 'anatomy', role: 'img', 'aria-label': 'A rule: selector, then declarations of property and value in braces',
        html: '<span class="an"><span class="an-row"><span class="tk-t">.card</span></span><small>selector: which elements</small></span>' +
          '<span class="an"><span class="an-row"><span class="tk-b">{</span>&nbsp;' +
          '<span class="an-up"><small>property</small><span class="tk-p">color</span></span><span class="tk-b">:</span>&nbsp;' +
          '<span class="an-up"><small>value</small><span class="tk-n">navy</span></span><span class="tk-b">;</span>&nbsp;<span class="tk-b">}</span></span>' +
          '<small>a declaration, inside the braces</small></span>'
      }),
      h('p', { class: 'muted', style: { marginTop: '10px' } },
        'A stylesheet is a list of rules. The ', h('b', null, 'selector'), ' picks elements; each ', h('b', null, 'declaration'),
        ' sets one property to one value. When two rules disagree, the more specific selector wins, and if they tie, the later one wins - ',
        h('a', { href: '#/explain/specificity' }, 'see the specificity explainer'), '.')));

    main.appendChild(U.callout('java', 'For a Java developer', U.md(
      'A CSS rule is like a declarative aspect: "for every element matching this selector, set these properties". ' +
      'Several rules can apply to one element at once. Conflicts are resolved like overriding with a priority: the more specific selector wins; on a tie, the rule declared later wins. ' +
      'Some properties (colour, font) are also **inherited** by child elements, like fields inherited from a parent class.')));

    main.appendChild(h('h2', null, 'Where CSS lives'));
    var where = h('div', { class: 'cards' },
      h('div', { class: 'card' }, h('h3', null, 'External file (best)'), U.codeBlock('<link rel="stylesheet" href="styles.css">', 'html', { copy: false }).el,
        h('p', { class: 'muted', style: { margin: '8px 0 0' } }, 'One file shared by every page.')),
      h('div', { class: 'card' }, h('h3', null, '<style> in the page'), U.codeBlock('<style>\n  p { color: navy; }\n</style>', 'html', { copy: false }).el,
        h('p', { class: 'muted', style: { margin: '8px 0 0' } }, 'Fine for one-page experiments.')),
      h('div', { class: 'card' }, h('h3', null, 'style attribute'), U.codeBlock('<p style="color: navy">Hi</p>', 'html', { copy: false }).el,
        h('p', { class: 'muted', style: { margin: '8px 0 0' } }, 'Only for quick tests: hard to reuse or override.')));
    main.appendChild(where);

    main.appendChild(h('h2', null, 'Browse by group'));
    var cards = h('div', { class: 'cards' });
    ORDER.forEach(function (g) {
      var items = list().filter(function (p) { return p.group === g; });
      if (!items.length) return;
      cards.appendChild(h('a', { class: 'card', href: '#/css/' + encodeURIComponent(items[0].name) },
        h('div', { class: 'card-kicker' }, items.length + ' properties'),
        h('h3', null, g),
        h('p', { class: 'muted', style: { margin: 0 } }, items.slice(0, 6).map(function (p) { return p.name; }).join(', ') + (items.length > 6 ? ', …' : ''))));
    });
    main.appendChild(cards);
  }

  /* ---------- a property page ---------- */

  function entryPage(main, entry, query) {
    var values = entry.values || [];
    var state = { value: query.v || entry.start || (values[0] && values[0].value) || '' };
    var hover = null;
    function shown() { return hover !== null ? hover : state.value; }

    main.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/css' }, 'CSS'), ' › ', entry.group));
    var head = h('div', { class: 'entry-head' }, h('h1', null, entry.name));
    main.appendChild(head);
    main.appendChild(h('div', { class: 'entry-summary', html: U.md(entry.summary) }));
    main.appendChild(h('div', { class: 'entry-desc', html: U.md(entry.description) }));
    main.appendChild(h('div', { class: 'facts' },
      h('span', null, 'Group: ', h('b', null, entry.group)),
      h('span', null, 'Initial value: ', h('b', { class: 'mono' }, entry.initial)),
      h('span', null, 'Inherited: ', h('b', null, entry.inherited ? 'yes - children get it too' : 'no')),
      entry.appliesTo ? h('span', null, 'Applies to: ', h('b', null, entry.appliesTo)) : null,
      h('a', { href: entry.mdn || MDN + entry.name, target: '_blank', rel: 'noopener' }, 'MDN ↗')));
    if (entry.java) main.appendChild(U.callout('java', 'Java analogy', U.md(entry.java)));

    var decl = h('div', { class: 'declaration', 'aria-live': 'polite' });
    main.appendChild(decl);

    var controls = h('div', { class: 'controls' });
    var side = h('div', { class: 'workbench-side' });
    var bench = h('div', { class: 'workbench' }, controls, side);
    main.appendChild(bench);
    U.layout.split(bench, { key: 'ref', minLeft: 260, minRight: 300, label: 'Resize the controls and the preview' });
    head.appendChild(U.layout.full(bench, { kind: 'ref', root: document.getElementById('view') }).btn);

    var demo = demoOf(entry);
    var consoleBox = h('div', { hidden: true }), consolePanel = null;
    var preview = U.preview.create(null, {
      height: entry.previewHeight || demo.height || 240, baseCss: U.DEMO_BASE, title: 'Preview of ' + entry.name,
      onConsole: function (m) { if (!consolePanel) { consolePanel = U.preview.console(consoleBox); consoleBox.hidden = false; } consolePanel.add(m); }
    });
    side.appendChild(h('div', null,
      h('div', { class: 'preview-label' }, h('span', { class: 'live-dot' }), 'Live preview',
        entry.hint ? h('span', { class: 'faint', style: { textTransform: 'none', letterSpacing: 0, fontWeight: 400 } }, '- ' + entry.hint) : null),
      preview.wrap));
    side.appendChild(consoleBox);
    var cssCode = U.codeBlock('', 'css', {
      label: 'CSS',
      playground: function () {
        var b = build(entry, state.value);
        return { title: entry.name + ': ' + state.value, html: b.html, css: U.DEMO_BASE + '\n\n' + b.css };
      }
    });
    var htmlCode = U.codeBlock(demo.html, 'html', { label: 'HTML' });
    side.appendChild(cssCode.el);
    side.appendChild(U.section('HTML of this demo', htmlCode.el, false));

    var syncs = [];
    function update() {
      var v = shown();
      var b = build(entry, v);
      preview.render({ html: b.html, css: b.css });
      cssCode.set(b.css);
      var ok = supports(entry.name, v);
      decl.innerHTML = (hover !== null ? '<span class="faint" style="font-weight:400">Preview: </span>' : '') +
        '<span class="d-prop">' + U.esc(entry.name) + '</span>: <span class="d-val">' + U.esc(v) + '</span>; ' +
        '<span class="valid-mark ' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✓ valid' : '✗ the browser rejects this value') + '</span>';
      U.$$('.compare-cell', main).forEach(function (c) { c.classList.toggle('selected', c.getAttribute('data-value') === state.value); });
    }
    function setValue(v) { state.value = v; hover = null; syncs.forEach(function (f) { f(); }); update(); }
    function setHover(v, active) { hover = active ? v : null; update(); }

    // keyword chips
    if (values.length) {
      var kw = values.filter(function (v) { return !v.example; });
      var ex = values.filter(function (v) { return v.example; });
      var g = U.chipGroup({
        name: entry.name + ' values', values: kw.concat(ex),
        get: function () { return state.value; },
        set: setValue,
        hover: setHover
      });
      syncs.push(g.sync);
      controls.appendChild(h('div', { class: 'control', 'data-kind': 'values' },
        h('div', { class: 'control-head' }, h('span', { class: 'control-name' }, 'Values'),
          h('span', { class: 'control-kind' }, kw.length + ' keyword' + (kw.length === 1 ? '' : 's') + (ex.length ? ' + ' + ex.length + ' example' + (ex.length === 1 ? '' : 's') + ' (dashed)' : ''))),
        h('div', { class: 'control-desc' }, 'Hover to preview, click to keep.'),
        g.el));
    }

    (entry.inputs || []).forEach(function (spec) { controls.appendChild(inputRow(spec, setValue)); });

    // free typing
    var free = h('input', { class: 'input mono', type: 'text', spellcheck: 'false', placeholder: 'e.g. ' + (entry.freeExample || state.value), 'aria-label': 'Type any value' });
    var freeMark = h('span', { class: 'valid-mark' });
    free.addEventListener('input', function () {
      var v = free.value.trim();
      if (!v) { freeMark.textContent = ''; return; }
      var ok = supports(entry.name, v);
      freeMark.className = 'valid-mark ' + (ok ? 'ok' : 'bad');
      freeMark.textContent = ok ? '✓ valid' : '✗ not valid';
      if (ok) setValue(v);
    });
    controls.appendChild(h('div', { class: 'control' },
      h('div', { class: 'control-head' }, h('span', { class: 'control-name' }, 'Type any value'), h('span', { class: 'control-kind' }, 'checked by your browser')),
      h('div', { class: 'control-desc' }, 'Anything the browser accepts is applied as you type; invalid values are flagged and ignored (just like in a real stylesheet).'),
      h('div', { class: 'control-row' }, free, freeMark)));

    // global values
    var gv = U.chipGroup({
      name: 'global values', values: U.data.cssGlobalValues || [],
      get: function () { return state.value; }, set: setValue, hover: setHover
    });
    syncs.push(gv.sync);
    controls.appendChild(U.section('Values every property accepts', h('div', null,
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'These four work on any property. They are about where the value comes from: the parent, the browser\'s default, or the browser\'s own stylesheet.'),
      gv.el), false));

    // compare grid
    var compareVals = values.slice();
    if (compareVals.length > 1 && entry.compare !== false) {
      var grid = h('div', { class: 'compare-grid' });
      var compareWrap = h('div', { class: 'card', style: { marginTop: '18px' } },
        h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'Compare all values'), h('span', { class: 'spacer' }),
          h('span', { class: 'faint' }, 'Same demo, one value per box. Click a box to select it.')),
        grid);
      main.appendChild(compareWrap);
      var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting || e.target._drawn) return;
          e.target._drawn = true;
          io.unobserve(e.target);
          var b = build(entry, e.target.getAttribute('data-value'));
          var p = U.preview.create(e.target, { height: entry.compareHeight || 150, baseCss: U.DEMO_BASE, title: entry.name + ': ' + e.target.getAttribute('data-value') });
          p.render({ html: b.html, css: b.css });
        });
      }, { rootMargin: '200px' }) : null;
      compareVals.forEach(function (v) {
        var cell = h('div', { class: 'compare-cell', 'data-value': v.value, tabindex: '0', role: 'button', 'aria-label': 'Select ' + v.value, title: U.md(v.desc).replace(/<[^>]+>/g, '') },
          h('span', { class: 'compare-name' }, v.value));
        cell.addEventListener('click', function () { setValue(v.value); window.scrollTo({ top: 0, behavior: 'smooth' }); });
        cell.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cell.click(); } });
        grid.appendChild(cell);
        if (io) io.observe(cell); else {
          var b = build(entry, v.value);
          U.preview.create(cell, { height: entry.compareHeight || 150, baseCss: U.DEMO_BASE }).render({ html: b.html, css: b.css });
        }
      });
    }

    main.appendChild(U.entryFooter(entry, 'css', null));
    update();
  }

  U.views.css = {
    render: function (root, params, query) {
      var name = params[0];
      var entry = name ? U.find('cssProperties', name) : null;
      var main = h('div', { class: 'ref-main' });
      root.appendChild(h('div', { class: 'ref' },
        U.refSidebar({
          items: list(),
          groupOf: function (p) { return p.group; },
          order: ORDER,
          label: function (p) { return p.name; },
          sub: function (p) { return p.short || ''; },
          href: function (p) { return '#/css/' + encodeURIComponent(p.name); },
          isActive: function (p) { return p === entry; },
          match: function (p, q) {
            return (p.name + ' ' + (p.short || '') + ' ' + (p.keywords || []).join(' ') + ' ' + (p.values || []).map(function (v) { return v.value; }).join(' ')).toLowerCase().indexOf(q) >= 0;
          },
          placeholder: 'Filter properties or values…',
          toggleLabel: 'Browse all properties',
          ariaLabel: 'CSS properties'
        }),
        main));
      if (entry) entryPage(main, entry, query); else intro(main);
    }
  };

  U.cssRef = { build: build, demoOf: demoOf, ORDER: ORDER };
  U.cssControls = { part: part, inputRow: inputRow }; // reused by the Playground's Properties panel
  U.route('css', U.views.css);
})(window.UILT);
