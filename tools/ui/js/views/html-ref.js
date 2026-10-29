/*
 * views/html-ref.js - the HTML element reference (#/html and #/html/<tag>).
 *
 * Every element page is generated from one entry in data/html-*.js. The page keeps the chosen
 * attribute values in `state`, fills the entry's demo template with them, and redraws the preview
 * and the code on every change. Hovering a value chip previews it without keeping it.
 * The line between the controls and the preview can be dragged (one position for every element and
 * property page), and Full screen puts the whole page across the window (js/layout.js).
 */
(function (U) {
  'use strict';
  var h = U.h;

  var ORDER = ['Document', 'Sections', 'Text', 'Lists', 'Links & media', 'Tables', 'Forms', 'Interactive'];
  var MDN = 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/';

  function list() { return U.data.htmlElements || []; }
  function title(e) { return e.title || '<' + e.tag + '>'; }

  /** ` href="x" target="_blank"` from the chosen values, in the entry's attribute order. */
  function attrString(entry, values) {
    var parts = [];
    allAttrs(entry).forEach(function (a) {
      var v = values[a.name];
      if (v === undefined || v === null || v === false) return;
      if (a.kind === 'boolean') { if (v) parts.push(a.name); return; }
      if (v === '' && !a.allowEmpty) return;
      parts.push(a.name + '="' + U.escAttr(v) + '"');
    });
    return parts.length ? ' ' + parts.join(' ') : '';
  }

  function allAttrs(entry) { return (entry.attributes || []).concat(globalsFor(entry)); }

  /** Global attributes minus any the element defines itself (e.g. <html> has its own lang). */
  function globalsFor(entry) {
    var own = (entry.attributes || []).map(function (a) { return a.name; });
    return (U.data.htmlGlobalAttrs || []).filter(function (g) { return own.indexOf(g.name) < 0; });
  }

  function defaultTemplate(entry) {
    return entry.void ? '<' + entry.tag + '{{attrs}}>' : '<' + entry.tag + '{{attrs}}>{{content}}</' + entry.tag + '>';
  }

  /** Fill a demo/code template: a string with {{attrs}} {{content}} {{variant}} {{attr:name|fallback}}, or a function. */
  function fill(tpl, ctx) {
    if (typeof tpl === 'function') return tpl(ctx.values, ctx.content, ctx.variant, ctx.attrs);
    return String(tpl)
      .replace(/\{\{attrs\}\}/g, ctx.attrs)
      .replace(/\{\{content\}\}/g, ctx.content)
      .replace(/\{\{variant\}\}/g, ctx.variant || '')
      .replace(/\{\{attr:([\w-]+)(?:\|([^}]*))?\}\}/g, function (_, n, def) {
        var v = ctx.values[n];
        return U.esc(v === undefined || v === true ? (def || '') : v);
      });
  }

  /** Build {html, code, css} for an entry with the given values. Used by the page and by tests. */
  function build(entry, values, content, variant) {
    var ctx = { values: values, content: content, variant: variant, attrs: attrString(entry, values) };
    var html = fill(entry.demo || defaultTemplate(entry), ctx);
    var code = entry.code ? fill(entry.code, ctx) : html;
    return { html: html, code: code, css: entry.demoCss || '' };
  }

  /* ---------- the intro page (#/html) ---------- */

  function intro(main) {
    var counts = {};
    list().forEach(function (e) { counts[e.category] = (counts[e.category] || 0) + 1; });
    main.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'HTML elements'),
      h('p', null, 'HTML describes what each part of a page is: a heading, a paragraph, a link, a form field. ' +
        'Pick any element on the left. You can change each attribute and see every possible value, with a plain explanation and a live preview.')));

    main.appendChild(h('div', { class: 'card' },
      h('h2', { style: { marginTop: 0 } }, 'Anatomy of an element'),
      h('div', { html: anatomy() }),
      h('p', { class: 'muted', style: { marginTop: '12px' } },
        'Some elements have no content and no closing tag; they are called ', h('b', null, 'void elements'), ': ',
        h('code', null, '<img>'), ', ', h('code', null, '<input>'), ', ', h('code', null, '<br>'), ', ', h('code', null, '<meta>'), '. ',
        'Elements nest inside each other like boxes, which gives the page a tree shape - the ',
        h('a', { href: '#/explain/dom-tree' }, 'DOM tree'), '.')));

    main.appendChild(U.callout('java', 'For a Java developer',
      U.md('Think of an element as an object: the **tag** is its class (`a`, `img`, `form`), the **attributes** are named fields set in the constructor (`href="…"`), and the **content** is its children. The browser parses the text into a tree of objects you can walk from JavaScript, just like `org.w3c.dom` in Java.')));

    main.appendChild(h('h2', null, 'Block and inline'));
    main.appendChild(h('p', { class: 'muted' }, 'Every element has a default way of sitting on the page. This is the first thing to know about any element, and each element page shows it.'));
    var p = U.preview.create(null, { height: 200, baseCss: U.DEMO_BASE, title: 'Block versus inline' });
    main.appendChild(p.wrap);
    p.render({
      html: '<div class="b">&lt;div&gt; is block: full width, starts on a new line</div>\n' +
        '<p class="b">&lt;p&gt; is block too</p>\n' +
        '<p>Inside this paragraph, <span class="i">&lt;span&gt;</span>, <a class="i" href="#">&lt;a&gt;</a> and <strong class="i">&lt;strong&gt;</strong> are inline: they flow with the text and are only as wide as their content.</p>',
      css: '.b { background: #dce6ff; border: 2px dashed #4f6fd8; padding: 6px; margin: 6px 0; }\n.i { background: #ffe7c2; outline: 2px dashed #d98c3f; }'
    });

    main.appendChild(h('h2', null, 'Browse by group'));
    var cards = h('div', { class: 'cards' });
    ORDER.forEach(function (cat) {
      var first = list().filter(function (e) { return e.category === cat; });
      if (!first.length) return;
      cards.appendChild(h('a', { class: 'card', href: '#/html/' + encodeURIComponent(first[0].tag) },
        h('div', { class: 'card-kicker' }, counts[cat] + ' elements'),
        h('h3', null, cat),
        h('p', { class: 'muted', style: { margin: 0 } }, first.slice(0, 7).map(function (e) { return e.title || e.tag; }).join(', ') + (first.length > 7 ? ', …' : ''))));
    });
    main.appendChild(cards);
  }

  function anatomy() {
    return '<div class="anatomy" role="img" aria-label="Parts of an element: opening tag with attribute name and value, content, closing tag">' +
      '<span class="an"><span class="an-row"><span class="tk-b">&lt;</span><span class="tk-t">a</span>&nbsp;' +
      '<span class="an-up"><small>attribute name</small><span class="tk-a">href</span></span><span class="tk-b">=</span>' +
      '<span class="an-up"><small>attribute value</small><span class="tk-s">"https://mdn.dev"</span></span><span class="tk-b">&gt;</span></span>' +
      '<small>opening tag</small></span>' +
      '<span class="an"><span class="an-row">Read the docs</span><small>content</small></span>' +
      '<span class="an"><span class="an-row"><span class="tk-b">&lt;/</span><span class="tk-t">a</span><span class="tk-b">&gt;</span></span><small>closing tag</small></span>' +
      '</div><p class="faint" style="margin:6px 0 0">The whole thing - opening tag, content and closing tag - is one element.</p>';
  }

  /* ---------- an element page (#/html/<tag>) ---------- */

  function entryPage(main, entry, query) {
    var state = {
      values: Object.assign({}, entry.start || {}),
      content: entry.content !== undefined ? entry.content : 'Hello',
      variant: entry.variant ? (entry.variant.start || entry.variant.values[0].value) : ''
    };
    if (query.attr) {
      var qa = allAttrs(entry).filter(function (a) { return a.name === query.attr; })[0];
      if (qa) state.values[query.attr] = qa.kind === 'boolean' ? true : query.v;
    }
    var hover = null; // {name, value} while a chip is hovered

    function snapshot(withHover) {
      var vals = Object.assign({}, state.values), variant = state.variant;
      if (withHover && hover) {
        if (hover.name === '__variant') variant = hover.value;
        else if (hover.value === undefined) delete vals[hover.name];
        else vals[hover.name] = hover.value;
      }
      return build(entry, vals, state.content, variant);
    }

    // --- header
    var facts = h('div', { class: 'facts' },
      h('span', null, 'Group: ', h('b', null, entry.category)),
      entry.display ? h('span', null, 'Default display: ', h('b', null, entry.display)) : null,
      h('span', null, entry.void ? 'Void element: no content, no closing tag' : 'Needs a closing tag'),
      h('a', { href: entry.mdn || MDN + (entry.mdnTag || entry.tag), target: '_blank', rel: 'noopener' }, 'MDN ↗'));
    main.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/html' }, 'HTML'), ' › ', entry.category));
    var head = h('div', { class: 'entry-head' }, h('h1', null, title(entry)));
    main.appendChild(head);
    main.appendChild(h('div', { class: 'entry-summary', html: U.md(entry.summary) }));
    main.appendChild(h('div', { class: 'entry-desc', html: U.md(entry.description) }));
    main.appendChild(facts);
    if (entry.java) main.appendChild(U.callout('java', 'Java analogy', U.md(entry.java)));

    // --- workbench: controls on the left, preview + code on the right
    var controls = h('div', { class: 'controls' });
    var side = h('div', { class: 'workbench-side' });
    var bench = h('div', { class: 'workbench' }, controls, side);
    main.appendChild(bench);
    U.layout.split(bench, { key: 'ref', minLeft: 260, minRight: 300, label: 'Resize the controls and the preview' });
    head.appendChild(U.layout.full(bench, { kind: 'ref', root: document.getElementById('view') }).btn);

    var consoleBox = h('div', { hidden: true });
    var consolePanel = null;
    var preview = U.preview.create(null, {
      height: entry.previewHeight || 230, baseCss: U.DEMO_BASE, title: 'Preview of ' + title(entry),
      onConsole: function (msg) {
        if (!consolePanel) { consolePanel = U.preview.console(consoleBox); consoleBox.hidden = false; }
        consolePanel.add(msg);
      }
    });
    side.appendChild(h('div', null,
      h('div', { class: 'preview-label' }, h('span', { class: 'live-dot' }), 'Live preview',
        h('span', { class: 'faint', style: { textTransform: 'none', letterSpacing: 0, fontWeight: 400 } }, '- drag the corner to resize')),
      preview.wrap));
    side.appendChild(consoleBox);
    var code = U.codeBlock('', 'html', {
      label: 'HTML',
      playground: function () {
        var s = snapshot(false);
        return { title: title(entry), html: s.html, css: U.DEMO_BASE + (s.css ? '\n' + s.css : '') };
      }
    });
    side.appendChild(code.el);
    var cssBlock = entry.demoCss ? U.codeBlock(entry.demoCss, 'css', { label: 'CSS used by this demo' }) : null;
    if (cssBlock) side.appendChild(cssBlock.el);
    if (entry.note) side.appendChild(h('p', { class: 'faint', html: U.md(entry.note) }));

    var syncs = [];
    function update() {
      var s = snapshot(true);
      preview.render({ html: s.html, css: s.css });
      code.set(s.code);
    }
    function commit() { syncs.forEach(function (f) { f(); }); update(); }
    function setHover(name, value, active) { hover = active ? { name: name, value: value } : null; update(); }

    if (entry.variant) {
      var vg = U.chipGroup({
        name: entry.variant.label,
        values: entry.variant.values,
        get: function () { return state.variant; },
        set: function (v) { state.variant = v; commit(); },
        hover: function (v, active) { setHover('__variant', v, active); }
      });
      syncs.push(vg.sync);
      controls.appendChild(h('div', { class: 'control is-set' },
        h('div', { class: 'control-head' }, h('span', { class: 'control-name' }, entry.variant.label), h('span', { class: 'control-kind' }, 'choose the tag')),
        entry.variant.desc ? h('div', { class: 'control-desc', html: U.md(entry.variant.desc) }) : null,
        vg.el));
    }

    if (!entry.void && entry.contentKind !== 'none') {
      var ta = h('textarea', { class: 'input mono', rows: Math.min(8, Math.max(2, String(state.content).split('\n').length + 1)), spellcheck: 'false', style: { width: '100%', resize: 'vertical', fontSize: '13px' } });
      ta.value = state.content;
      ta.addEventListener('input', function () { state.content = ta.value; update(); });
      var kindLabel = { text: 'plain text', css: 'CSS code', js: 'JavaScript code' }[entry.contentKind] || 'text and nested tags';
      controls.appendChild(h('div', { class: 'control' },
        h('div', { class: 'control-head' }, h('span', { class: 'control-name' }, 'content'), h('span', { class: 'control-kind' }, kindLabel)),
        h('div', { class: 'control-desc' }, entry.contentHelp || 'What goes between the opening and closing tag.'),
        ta));
    }

    (entry.attributes || []).forEach(function (a) { controls.appendChild(attrControl(a)); });
    if (!(entry.attributes || []).length) {
      controls.appendChild(h('p', { class: 'muted' }, 'This element has no attributes of its own; the global attributes below work on it.'));
    }
    var globals = h('div', { class: 'controls' });
    globalsFor(entry).forEach(function (a) { globals.appendChild(attrControl(a)); });
    controls.appendChild(U.section('Global attributes (work on every element)', globals, false));

    function attrControl(a) {
      var box = h('div', { class: 'control', 'data-attr': a.name });
      function mark() { box.classList.toggle('is-set', state.values[a.name] !== undefined && state.values[a.name] !== false && state.values[a.name] !== ''); }
      var kindText = { enum: 'choose a value', boolean: 'on / off', text: 'text', number: 'number', color: 'colour', url: 'URL' }[a.kind] || a.kind;
      box.appendChild(h('div', { class: 'control-head' },
        h('span', { class: 'control-name' }, a.name),
        h('span', { class: 'control-kind' }, kindText),
        a.required ? h('span', { class: 'badge badge-warn' }, 'required') : null));
      box.appendChild(h('div', { class: 'control-desc', html: U.md(a.desc) }));

      if (a.kind === 'enum') {
        var g = U.chipGroup({
          name: a.name,
          values: a.values,
          none: a.required ? null : { label: '(not set)', desc: a.unset || 'Not set: the browser uses its default behaviour.' },
          get: function () { return state.values[a.name]; },
          set: function (v) { if (v === undefined) delete state.values[a.name]; else state.values[a.name] = v; commit(); },
          hover: function (v, active) { setHover(a.name, v, active); }
        });
        syncs.push(function () { g.sync(); mark(); });
        box.appendChild(g.el);
      } else if (a.kind === 'boolean') {
        var sw = U.switchControl(a.name + (state.values[a.name] ? ' is on' : ' is off'), !!state.values[a.name], function (on) {
          if (on) state.values[a.name] = true; else delete state.values[a.name];
          sw.el.lastChild.textContent = a.name + (on ? ' is on' : ' is off');
          commit();
        });
        syncs.push(function () { sw.set(!!state.values[a.name]); mark(); });
        box.appendChild(sw.el);
      } else {
        var row = h('div', { class: 'control-row' });
        var inputs = [];
        if (a.kind === 'number') {
          var rng = h('input', { type: 'range', min: a.min !== undefined ? a.min : 0, max: a.max !== undefined ? a.max : 100, step: a.step || 1, 'aria-label': a.name + ' slider' });
          var num = h('input', { class: 'input input-small', type: 'number', min: a.min, max: a.max, step: a.step || 1, 'aria-label': a.name });
          rng.value = num.value = state.values[a.name] !== undefined ? state.values[a.name] : (a.example !== undefined ? a.example : a.min || 0);
          if (state.values[a.name] === undefined) num.value = '';
          rng.addEventListener('input', function () { num.value = rng.value; state.values[a.name] = rng.value; commit(); });
          num.addEventListener('input', function () {
            if (num.value === '') delete state.values[a.name]; else { state.values[a.name] = num.value; rng.value = num.value; }
            commit();
          });
          row.appendChild(rng); row.appendChild(num);
          inputs.push(num);
        } else if (a.kind === 'color') {
          var col = h('input', { type: 'color', 'aria-label': a.name });
          col.value = state.values[a.name] || a.example || '#4353c9';
          col.addEventListener('input', function () { state.values[a.name] = col.value; commit(); });
          row.appendChild(col);
          row.appendChild(h('span', { class: 'faint' }, 'Pick a colour'));
        } else {
          var txt = h('input', { class: 'input', type: 'text', placeholder: a.example ? 'e.g. ' + a.example : '', spellcheck: 'false', 'aria-label': a.name });
          txt.value = state.values[a.name] !== undefined && state.values[a.name] !== true ? state.values[a.name] : '';
          txt.addEventListener('input', function () {
            if (txt.value === '' && !a.allowEmpty) delete state.values[a.name]; else state.values[a.name] = txt.value;
            commit();
          });
          row.appendChild(txt);
          inputs.push(txt);
          if (a.example !== undefined) {
            row.appendChild(h('button', {
              class: 'btn btn-small', type: 'button',
              onclick: function () { txt.value = a.example; state.values[a.name] = a.example; commit(); }
            }, 'Use example'));
          }
          if (a.suggestions) {
            var sg = h('div', { class: 'chips', style: { marginTop: '8px', width: '100%' } });
            a.suggestions.forEach(function (s) {
              var sv = typeof s === 'string' ? s : s.value;
              var b = h('button', { class: 'chip chip-example', type: 'button', title: typeof s === 'string' ? null : s.desc }, sv);
              b.addEventListener('mouseenter', function () { setHover(a.name, sv, true); });
              b.addEventListener('mouseleave', function () { setHover(null, null, false); });
              b.addEventListener('click', function () { txt.value = sv; state.values[a.name] = sv; hover = null; commit(); });
              sg.appendChild(b);
            });
            row.appendChild(sg);
          }
        }
        row.appendChild(h('button', {
          class: 'btn btn-small btn-ghost', type: 'button', title: 'Remove this attribute',
          onclick: function () { delete state.values[a.name]; inputs.forEach(function (i) { i.value = ''; }); commit(); }
        }, 'Clear'));
        syncs.push(mark);
        box.appendChild(row);
      }
      mark();
      return box;
    }

    main.appendChild(U.entryFooter(entry, 'html', null));
    update();
    // the sample video is recorded on first use; redraw once it exists (last = null forces a full reload)
    if (entry.needsVideo) U.ensureSampleVideo(function () { preview.last = null; update(); });
    var target = query.attr && controls.querySelector('[data-attr="' + query.attr + '"]');
    if (target) {
      var fold = target.closest('details');
      if (fold) fold.open = true;
      setTimeout(function () { target.scrollIntoView({ block: 'center' }); }, 50);
    }
  }

  U.views.html = {
    render: function (root, params, query) {
      var tag = params[0];
      var entry = tag ? U.find('htmlElements', tag) : null;
      var main = h('div', { class: 'ref-main' });
      root.appendChild(h('div', { class: 'ref' },
        U.refSidebar({
          items: list(),
          groupOf: function (e) { return e.category; },
          order: ORDER,
          label: function (e) { return e.title || e.tag; },
          sub: function (e) { return e.short || ''; },
          href: function (e) { return '#/html/' + encodeURIComponent(e.tag); },
          isActive: function (e) { return entry === e; },
          match: function (e, q) {
            return (e.tag + ' ' + (e.title || '') + ' ' + (e.short || '') + ' ' + (e.keywords || []).join(' ')).toLowerCase().indexOf(q) >= 0;
          },
          placeholder: 'Filter elements…',
          toggleLabel: 'Browse all elements',
          ariaLabel: 'HTML elements'
        }),
        main));
      if (entry) entryPage(main, entry, query); else intro(main);
    }
  };

  U.htmlRef = { build: build, attrString: attrString, allAttrs: allAttrs };
  U.route('html', U.views.html);
})(window.UILT);
