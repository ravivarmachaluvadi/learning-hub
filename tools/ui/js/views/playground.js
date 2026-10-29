/*
 * views/playground.js - free editing with a live preview (#/playground).
 *
 * Three editors (HTML, CSS, JavaScript) feed one preview. HTML and CSS changes redraw about a
 * quarter of a second after you stop typing; JavaScript re-runs after 0.6 s (or only on Run, when
 * "Auto-run JS" is off). Work in progress is kept in this browser; named snippets can be saved,
 * reopened and exported as a single .html file.
 *
 * The line between the editors and the preview can be dragged, the grip under each editor sets its
 * height, and Full screen puts the toolbar, the editors and the preview across the whole window
 * (js/layout.js).
 */
(function (U) {
  'use strict';
  var h = U.h;

  var DEVICES = [
    { label: 'Full width', width: null },
    { label: 'Tablet 768', width: 768 },
    { label: 'Phone 375', width: 375 }
  ];

  function templates() { return U.data.templates || [{ id: 'blank', title: 'Blank', html: '', css: '', js: '' }]; }

  /** A complete standalone HTML file for a snippet (used by Export). */
  function standalone(s, title) {
    // data-rcv-mounted="true" stops the "Raw Code Highlight" Chrome extension from turning a local
    // .html file into a plain-text code view (see index.html)
    return '<!doctype html>\n<html lang="en" data-rcv-mounted="true">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '  <title>' + U.esc(title || 'My page') + '</title>\n  <style>\n' + s.css + '\n  </style>\n</head>\n<body>\n' + s.html +
      (s.js ? '\n<script>\n' + s.js + '\n</' + 'script>' : '') + '\n</body>\n</html>\n';
  }

  U.views.playground = {
    render: function (root) {
      var incoming = U.store.get('playground.incoming', null);
      if (incoming) U.store.del('playground.incoming');
      var cur = incoming || U.store.get('playground.current', null) || Object.assign({ title: 'Untitled' }, templates()[0]);
      var autoRun = U.store.get('playground.autorun', true);

      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Playground'),
        h('p', null, 'Write HTML, CSS and JavaScript and see the result as you type. Your work stays in this browser. ' +
          'Sample files you can use: landscape.svg, portrait.svg, avatar.svg, tile.svg, beep.wav. A pretend server answers fetch("/api/users").'),
        h('p', { class: 'faint', html: U.md('**Learn as you type:** after `display:` (or Ctrl+Space) you get only the valid values - ↑ ↓ previews each one, Enter keeps it, Esc undoes. ' +
          'Hover any property, value, tag or attribute to see what it means (Ctrl+click opens its page). Alt+↑ / Alt+↓ changes the number under the cursor. ' +
          'Click a colour square to pick a colour. ⚠ marks CSS lines that have no effect, and JavaScript worth a second look (a misspelt name, `==`, a selector that finds nothing). ' +
          'In HTML, type an Emmet abbreviation such as `ul>li*3` and press Tab. Shift+Alt+F tidies the indentation.') })));

      // --- toolbar
      var nameInput = h('input', { class: 'input', type: 'text', value: cur.title || 'Untitled', 'aria-label': 'Snippet name' });
      var tplSelect = h('select', { class: 'select', 'aria-label': 'Start from a template' },
        h('option', { value: '' }, 'Start from a template…'),
        h('optgroup', { label: 'Starter pages' }, templates().map(function (t) { return h('option', { value: t.id }, t.title); })),
        (U.data.recipes || []).length ? h('optgroup', { label: 'UI pattern recipes' },
          U.data.recipes.map(function (r) { return h('option', { value: 'recipe:' + r.id }, r.title); })) : null);
      var snipSelect = h('select', { class: 'select', 'aria-label': 'Open a saved snippet' });
      var autoBox = U.switchControl('Auto-run JS', autoRun, function (on) { autoRun = on; U.store.set('playground.autorun', on); if (on) run(); });
      var deviceBtns = h('div', { class: 'row device-btns', role: 'group', 'aria-label': 'Preview width' });
      var toolbar = h('div', { class: 'pg-toolbar' },
        nameInput,
        h('button', { class: 'btn btn-primary', type: 'button', onclick: save }, 'Save'),
        snipSelect,
        tplSelect,
        h('button', { class: 'btn', type: 'button', onclick: exportFile, title: 'Download a single .html file you can open anywhere' }, 'Export .html'),
        h('button', { class: 'btn', type: 'button', onclick: formatAll, title: 'Tidy the indentation of all three editors (Shift+Alt+F tidies just the one you are typing in)' }, 'Format'),
        h('span', { class: 'spacer' }),
        autoBox.el,
        h('button', { class: 'btn', type: 'button', onclick: function () { run(true); }, title: 'Run (Ctrl+Enter)' }, '▶ Run'));

      // --- editors and output
      var edCol = h('div', { class: 'pg-editors' });
      var out = h('div', { class: 'pg-out' });
      var layout = h('div', { class: 'pg' }, edCol, out);
      root.appendChild(h('div', { class: 'pg-work' }, toolbar, layout));
      U.layout.split(layout, { key: 'playground', minLeft: 320, minRight: 300, label: 'Resize the editors and the preview' });
      toolbar.appendChild(U.layout.full(layout, { kind: 'playground', root: layout.parentNode, work: edCol, fit: 'share' }).btn);

      var eds = {};
      var lintCount = h('span', { class: 'lint-count', 'aria-live': 'polite' });
      var jsLintCount = h('span', { class: 'lint-count', 'aria-live': 'polite' });
      ['html', 'css', 'js'].forEach(function (m) {
        var pane = h('div', null, h('div', { class: 'pg-pane-head' }, U.editor.LABELS[m], m === 'css' ? lintCount : m === 'js' ? jsLintCount : null));
        edCol.appendChild(pane);
        eds[m] = U.editor.create(pane, {
          mode: m, value: cur[m] || '', height: U.layout.editorHeight('playground-' + m, m === 'html' ? 260 : 200),
          lint: m === 'css' || m === 'js',
          onTry: m === 'js' ? null : function (text) { tryRender(m, text); },
          onChange: function () { m === 'js' ? jsChanged() : markupChanged(); }
        });
        pane.appendChild(U.layout.grip({ kind: 'playground-' + m, editors: [eds[m]], def: m === 'html' ? 260 : 200 }).el);
      });

      var stage = h('div', { class: 'preview-stage' });
      var inspectBtn = h('button', { class: 'btn btn-small', type: 'button', 'aria-pressed': 'false', title: 'Then click any element in the preview' }, '🔍 Inspect');
      out.appendChild(h('div', { class: 'preview-label' }, h('span', { class: 'live-dot' }), 'Live preview', h('span', { class: 'spacer' }), inspectBtn, deviceBtns));
      out.appendChild(stage);
      var con = U.preview.console(null);
      var inspecting = false;
      var preview = U.preview.create(stage, {
        height: 380, title: 'Playground preview',
        onConsole: function (e) { con.add(e); },
        onReload: function () { con.clear(); },
        onReady: function () {
          lintSoon();
          if (props) props.refresh();
          if (inspecting) preview.inspect(true); // a reload ends the frame's pick mode: arm it again
        },
        onPicked: function (info) {
          setInspecting(false);
          if (!info) return;
          inspector.show(info);
          showTab('inspect');
          inspector.el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); // the panel sits below the preview
        }
      });

      // --- Console | Properties | Inspect
      var props = U.propsPanel.create({ cssEditor: eds.css, preview: preview });
      var inspector = U.inspector.create({ htmlEditor: eds.html, cssEditor: eds.css, onRule: function () { showTab('props'); } });
      var panels = { console: con.el, props: props.el, inspect: inspector.el };
      var tabBtns = {};
      var tabBar = h('div', { class: 'pg-tabs ed-tabs', role: 'tablist' });
      [['console', 'Console'], ['props', 'Properties'], ['inspect', 'Inspect']].forEach(function (t) {
        tabBtns[t[0]] = h('button', { class: 'btn btn-small', type: 'button', role: 'tab', onclick: function () { showTab(t[0]); } }, t[1]);
        tabBar.appendChild(tabBtns[t[0]]);
      });
      out.appendChild(tabBar);
      Object.keys(panels).forEach(function (k) { out.appendChild(panels[k]); });
      function showTab(name) {
        Object.keys(panels).forEach(function (k) {
          panels[k].hidden = k !== name;
          tabBtns[k].classList.toggle('active', k === name);
          tabBtns[k].setAttribute('aria-selected', k === name ? 'true' : 'false');
        });
        U.store.set('playground.tab', name);
        if (name === 'props') props.refresh();
      }
      showTab(U.store.get('playground.tab', 'console'));

      function setInspecting(on) {
        inspecting = on;
        inspectBtn.classList.toggle('active', on);
        inspectBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        inspectBtn.textContent = on ? '🔍 Click an element…' : '🔍 Inspect';
      }
      inspectBtn.addEventListener('click', function () {
        setInspecting(!inspecting);
        preview.inspect(inspecting);
      });

      // --- trying a value from the autocomplete list (nothing is written until Enter)
      var trying = false;
      function tryRender(kind, text) {
        if (text === null) { trying = false; run(false); return; }
        trying = true;
        var s = snapshot();
        preview.render({ html: kind === 'html' ? text : s.html, css: kind === 'css' ? text : s.css, js: lastJs });
      }

      // --- "why doesn't this work?" warnings, after each render
      var lintSoon = U.debounce(function () {
        if (trying) return;
        var css = eds.css.get(), js = eds.js.get();
        U.editorAssist.lintCss(preview, css).then(function (list) {
          if (eds.css.get() !== css || trying) return;
          eds.css.setLint(list);
          lintCount.textContent = list.length ? '⚠ ' + list.length + ' line' + (list.length === 1 ? '' : 's') + ' with no effect' : '';
        });
        U.editorAssist.lintJs(preview, js).then(function (list) {
          if (eds.js.get() !== js || trying) return;
          eds.js.setLint(list);
          jsLintCount.textContent = list.length ? '⚠ ' + list.length + ' warning' + (list.length === 1 ? '' : 's') : '';
        });
      }, 400);

      var deviceWidth = U.store.get('playground.device', null);
      DEVICES.forEach(function (d) {
        var b = h('button', { class: 'btn btn-small' + (d.width === deviceWidth ? ' active' : ''), type: 'button' }, d.label);
        b.addEventListener('click', function () {
          deviceWidth = d.width;
          U.store.set('playground.device', d.width);
          U.$$('.btn', deviceBtns).forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          preview.setWidth(d.width);
        });
        deviceBtns.appendChild(b);
      });
      preview.setWidth(deviceWidth);

      function snapshot() {
        return { title: nameInput.value.trim() || 'Untitled', html: eds.html.get(), css: eds.css.get(), js: eds.js.get() };
      }
      var lastJs = cur.js || '';
      function run(force) {
        var s = snapshot();
        U.store.set('playground.current', s);
        lastJs = autoRun || force ? s.js : lastJs;
        preview.render({ html: s.html, css: s.css, js: lastJs }, { force: !!force });
      }
      var markupChanged = U.debounce(function () { run(false); }, 250);
      var jsChanged = U.debounce(function () {
        U.store.set('playground.current', snapshot());
        if (autoRun) run(false); else lintSoon();
      }, 600);

      function loadSnippet(s) {
        nameInput.value = s.title || 'Untitled';
        eds.html.set(s.html || '', true);
        eds.css.set(s.css || '', true);
        eds.js.set(s.js || '', true);
        lastJs = s.js || '';
        run(true);
      }

      function snippets() { return U.store.get('playground.snippets', {}); }
      function drawSnippets() {
        var all = snippets();
        var names = Object.keys(all).sort();
        snipSelect.innerHTML = '';
        snipSelect.appendChild(h('option', { value: '' }, names.length ? 'Open saved (' + names.length + ')…' : 'No saved snippets yet'));
        names.forEach(function (n) { snipSelect.appendChild(h('option', { value: n }, n)); });
        if (names.length) snipSelect.appendChild(h('option', { value: '__delete' }, '🗑 Delete the current name from saved'));
      }
      function save() {
        var s = snapshot();
        var all = snippets();
        all[s.title] = { html: s.html, css: s.css, js: s.js, savedAt: new Date().toISOString() };
        if (U.store.set('playground.snippets', all)) U.toast('Saved "' + s.title + '"'); else U.toast('Could not save: browser storage is blocked');
        drawSnippets();
      }
      snipSelect.addEventListener('change', function () {
        var v = snipSelect.value;
        snipSelect.value = '';
        if (!v) return;
        var all = snippets();
        if (v === '__delete') {
          var n = nameInput.value.trim();
          if (all[n]) { delete all[n]; U.store.set('playground.snippets', all); U.toast('Deleted "' + n + '"'); }
          else U.toast('No saved snippet is called "' + n + '"');
          drawSnippets();
          return;
        }
        if (all[v]) loadSnippet(Object.assign({ title: v }, all[v]));
      });
      tplSelect.addEventListener('change', function () {
        var v = tplSelect.value;
        var t = /^recipe:/.test(v) ? U.find('recipes', v.slice(7)) : templates().filter(function (x) { return x.id === v; })[0];
        tplSelect.value = '';
        if (t) loadSnippet({ title: t.title, html: t.html, css: t.css, js: t.js });
      });
      function formatAll() {
        var changed = ['html', 'css', 'js'].filter(function (m) { return eds[m].format(); });
        U.toast(changed.length ? 'Formatted ' + changed.map(function (m) { return U.editor.LABELS[m]; }).join(', ') : 'Already tidy');
      }
      function exportFile() {
        var s = snapshot();
        var html = standalone({ html: U.fillMedia(s.html), css: U.fillMedia(s.css), js: s.js }, s.title);
        U.download((s.title.replace(/[^\w-]+/g, '-') || 'page') + '.html', html, 'text/html');
      }

      this._keys = function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(true); }
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); save(); }
      };
      document.addEventListener('keydown', this._keys);

      drawSnippets();
      run(true);
      U.playground = { editors: eds, preview: preview, console: con, run: run, load: loadSnippet, props: props, inspector: inspector, showTab: showTab };
    },
    destroy: function () {
      if (this._keys) document.removeEventListener('keydown', this._keys);
      U.playground = null;
    }
  };

  U.route('playground', U.views.playground);
})(window.UILT);
