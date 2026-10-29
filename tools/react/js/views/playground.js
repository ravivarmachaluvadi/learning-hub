/*
 * views/playground.js - the Playground (#/playground): write any component and see it run.
 *
 * A JSX tab and a CSS tab on the left; the live preview (React 19, see js/preview.js) and its console
 * on the right. The preview runs again a moment after you stop typing, and on Ctrl+Enter / Run.
 * Start from a template (data/templates.js), save snippets by name, download the component as a
 * .jsx file. The current work is kept as you type ("rlt.playground.current"); snippets live in
 * "rlt.playground.snippets" as {name: {code, css, at}}. A lesson's "Open in Playground" hands its
 * code over through "rlt.playground.incoming".
 *
 * The line between the editor and the preview can be dragged, the grip under the editor sets its
 * height, and Full screen puts the bar, the editor and the preview across the whole window (js/layout.js).
 *
 * For the tests: RLT.playground = {jsx, css (the two editors), preview, console, run()}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var LIVE_DELAY = 700;
  var BLANK = { code: "import { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <main>\n      <h1>Hello, React</h1>\n      <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>\n    </main>\n  );\n}\n", css: 'main {\n  font-family: system-ui, sans-serif;\n}\n' };

  function snippets() { return U.store.get('playground.snippets', {}); }

  U.views.playground = {
    render: function (root) {
      var incoming = U.store.get('playground.incoming', null);
      U.store.del('playground.incoming');
      var cur = incoming || U.store.get('playground.current', null) || BLANK;
      var title = incoming && incoming.title ? incoming.title : '';

      root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Playground'),
        h('p', null, 'Write any component and watch it run. Export a component named App as the default, import hooks from \'react\', and use fetch(\'/api/users\') or fetch(\'/api/todos\') for pretend data. ' +
          'Ctrl+Enter runs; it also runs by itself a moment after you stop typing.' + (title ? ' Opened from: ' + title + '.' : ''))));

      var tplPick = h('select', { class: 'select', id: 'pg-template', 'aria-label': 'Start from a template' },
        h('option', { value: '' }, 'Templates…'),
        (U.data.templates || []).map(function (t) { return h('option', { value: t.id }, t.title); }));
      var snipPick = h('select', { class: 'select', id: 'pg-snippets', 'aria-label': 'Your saved snippets' });
      var nameIn = h('input', { class: 'input', id: 'pg-name', type: 'text', placeholder: 'Snippet name', 'aria-label': 'Snippet name', spellcheck: 'false' });
      var saveBtn = h('button', { class: 'btn', id: 'pg-save', type: 'button' }, 'Save');
      var runBtn = h('button', { class: 'btn btn-primary', id: 'pg-run', type: 'button', title: 'Ctrl+Enter' }, '▶ Run');
      var dlBtn = h('button', { class: 'btn btn-ghost', type: 'button', title: 'Download the component as App.jsx' }, 'Download .jsx');
      var fmtBtn = h('button', { class: 'btn btn-ghost', id: 'pg-format', type: 'button', title: 'Tidy the open tab as Prettier does (Shift+Alt+F)' }, 'Format');
      var bar = h('div', { class: 'row pg-bar' }, tplPick, snipPick, nameIn, saveBtn, h('span', { class: 'spacer' }), fmtBtn, dlBtn, runBtn);

      var left = h('div', { class: 'pg-left' }), right = h('div', { class: 'pg-right' });
      var layout = h('div', { class: 'pg-layout' }, left, right), pgWork = h('div', { class: 'pg-work' }, bar, layout);
      root.appendChild(pgWork);
      U.layout.split(layout, { key: 'playground', def: 52, minLeft: 320, minRight: 300, label: 'Resize the editor and the preview' });
      bar.appendChild(U.layout.full(layout, { kind: 'playground', root: pgWork, work: left }).btn);
      var tabJsx = h('button', { class: 'btn btn-small active', type: 'button' }, 'App.jsx');
      var tabCss = h('button', { class: 'btn btn-small', type: 'button' }, 'styles.css');
      left.appendChild(h('div', { class: 'ed-tabs' }, tabJsx, tabCss));
      var save = U.debounce(function () { U.store.set('playground.current', { code: jsx.get(), css: css.get() }); }, 300);
      var edH = U.layout.editorHeight('playground', 460);
      var jsx = U.editor.create(left, { mode: 'jsx', value: cur.code, height: edH, onRun: function () { run(true); }, onChange: function () { save(); live(); } });
      var css = U.editor.create(left, { mode: 'css', value: cur.css || '', height: edH, onRun: function () { run(true); }, onChange: function () { save(); live(); } });
      css.el.hidden = true;
      left.appendChild(U.layout.grip({ kind: 'playground', editors: [jsx, css], def: 460 }).el);
      function show(which) {
        jsx.el.hidden = which !== 'jsx';
        css.el.hidden = which !== 'css';
        tabJsx.classList.toggle('active', which === 'jsx');
        tabCss.classList.toggle('active', which === 'css');
        U.layout.refresh(left);
      }
      tabJsx.addEventListener('click', function () { show('jsx'); });
      tabCss.addEventListener('click', function () { show('css'); });

      var cons = U.preview.console(null);
      var hl = U.preview.highlighter();
      var preview = U.preview.create(null, {
        height: 360, title: 'Playground preview',
        onConsole: function (e) { cons.add(e); },
        onReload: function () { cons.clear(); jsx.clearError(); hl.clear(); },
        onError: function (e) { if (e.line) jsx.markError(e.line, e.message); },
        onRenders: hl.onRenders
      });
      right.appendChild(h('div', { class: 'preview-label' }, h('span', { class: 'live-dot', 'aria-hidden': 'true' }), 'Preview',
        h('span', { class: 'spacer' }), hl.toggle, h('span', { class: 'faint' }, 'React ' + U.react.VERSION)));
      right.appendChild(preview.wrap);
      right.appendChild(hl.line);
      right.appendChild(cons.el);

      function run(force) {
        return preview.render({ code: jsx.get(), css: css.get() }, { force: force }).then(function (res) {
          if (res.state === 'replaced') return preview.lastRun;
          if (res.state === 'error' && res.error && res.error.line) jsx.markError(res.error.line, res.error.message);
          return res;
        });
      }
      var live = U.debounce(function () { if (jsx.el.isConnected && !jsx.syntaxErrors().length) run(); }, LIVE_DELAY);
      runBtn.addEventListener('click', function () { run(true); });

      function load(s) {
        jsx.set(s.code || '');
        css.set(s.css || '');
        U.store.set('playground.current', { code: jsx.get(), css: css.get() });
        show('jsx');
        return run();
      }
      tplPick.addEventListener('change', function () {
        var t = U.find('templates', tplPick.value);
        if (t) load(t);
        tplPick.value = '';
      });
      function fillSnippets() {
        var s = snippets(), names = Object.keys(s).sort();
        snipPick.innerHTML = '';
        snipPick.appendChild(h('option', { value: '' }, names.length ? 'Your snippets (' + names.length + ')…' : 'No saved snippets'));
        names.forEach(function (n) { snipPick.appendChild(h('option', { value: n }, n)); });
        snipPick.disabled = !names.length;
      }
      snipPick.addEventListener('change', function () {
        var s = snippets()[snipPick.value];
        if (s) { nameIn.value = snipPick.value; load(s); }
        snipPick.value = '';
      });
      saveBtn.addEventListener('click', function () {
        var name = nameIn.value.trim();
        if (!name) { nameIn.focus(); U.toast('Give the snippet a name first'); return; }
        var s = snippets();
        s[name] = { code: jsx.get(), css: css.get(), at: new Date().toISOString() };
        U.store.set('playground.snippets', s);
        fillSnippets();
        U.toast('Saved "' + name + '"');
      });
      dlBtn.addEventListener('click', function () { U.download('App.jsx', jsx.get(), 'text/javascript'); });
      fmtBtn.addEventListener('click', function () { (css.el.hidden ? jsx : css).format(); });
      fillSnippets();
      run();

      U.playground = { jsx: jsx, css: css, preview: preview, console: cons, run: function () { return run(true); } };
    },
    destroy: function () { U.playground = null; }
  };
  U.route('playground', U.views.playground);
})(window.RLT);
