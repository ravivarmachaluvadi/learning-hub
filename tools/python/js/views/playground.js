/*
 * views/playground.js - write any Python and run it (#/playground).
 *
 * One editor, an input box (what input() reads), Run (Ctrl+Enter) and Stop, Visualize (the same
 * program, step by step, on the Visualize page), and the output panel.
 * Your current program is kept as you type; Save (Ctrl+S) keeps named snippets in this browser;
 * templates are starting points from data/templates.js; Download saves a .py file you can run with
 * `python file.py`. Other pages hand a program over with PYLT.openInPlayground({title, code, stdin}).
 * A divider resizes the two columns, a grip under the editor sets its height, and Full screen puts the
 * toolbar, the editor and the output across the whole window (js/layout.js).
 *
 * For the tests: PYLT.playground = {editor, setStdin(text), run(), errorLine()}.
 */
(function (U) {
  'use strict';
  var h = U.h;

  var STARTER = '# Write Python here and press Run (Ctrl+Enter).\nname = "Ravi"\nprint(f"Hello, {name}!")\n\nfor i in range(1, 4):\n    print(i, "squared is", i * i)\n';

  function snippets() { return U.store.get('playground.snippets', {}); }

  U.views.playground = {
    render: function (root) {
      var cur = U.store.get('playground.current', { code: STARTER, stdin: '' });
      var incoming = U.store.get('playground.incoming', null);
      var title = '';
      if (incoming) {
        U.store.del('playground.incoming');
        cur = { code: incoming.code, stdin: incoming.stdin || '' };
        title = incoming.title || '';
        U.store.set('playground.current', cur);
      }

      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Playground'),
        h('p', null, 'Write any Python and run it. ' + (title ? 'Opened from: ' + title + '. ' : '') +
          'Your program is kept as you type; Save keeps a named copy in this browser; Download gives you a .py file.')));

      var runBtn = h('button', { class: 'btn btn-primary', id: 'pg-run', type: 'button', title: 'Ctrl+Enter' }, '▶ Run');
      var stopBtn = h('button', { class: 'btn', id: 'pg-stop', type: 'button', disabled: true }, '■ Stop');
      var vizBtn = h('button', { class: 'btn', id: 'pg-visualize', type: 'button', title: 'Step through this program and see its names and objects',
        onclick: function () { U.openInVisualize({ title: name.value.trim() || 'From the Playground', code: editor.get(), stdin: stdin.get() }); } }, 'Visualize');
      var tpl = h('select', { class: 'select', 'aria-label': 'Start from a template' },
        h('option', { value: '' }, 'Templates…'),
        (U.data.templates || []).map(function (t) { return h('option', { value: t.id }, t.title); }));
      var name = h('input', { class: 'input', type: 'text', placeholder: 'Snippet name', 'aria-label': 'Snippet name' });
      var saved = h('select', { class: 'select', 'aria-label': 'Open a saved snippet' });
      var delBtn = h('button', { class: 'btn btn-small btn-ghost', type: 'button' }, 'Delete');

      var editor = U.editor.create(null, {
        value: cur.code, height: U.layout.editorHeight('playground', 420), onRun: run,
        onChange: function (v) { U.store.set('playground.current', { code: v, stdin: stdin.get() }); }
      });
      var stdin = U.stdinBox(cur.stdin, function (v) { U.store.set('playground.current', { code: editor.get(), stdin: v }); }, { rows: 3 });
      var panel = U.runPanel({ editor: editor });

      var toolbar = h('div', { class: 'pg-toolbar' }, runBtn, stopBtn, vizBtn, tpl, h('span', { class: 'spacer' }),
        name, h('button', { class: 'btn', type: 'button', title: 'Ctrl+S', onclick: save }, 'Save'), saved, delBtn,
        h('button', { class: 'btn', type: 'button', onclick: download }, 'Download .py'));
      var left = h('div', { class: 'pg-left' });
      var layout = h('div', { class: 'pg' }, left, h('div', { class: 'pg-out' }, panel.el));
      var pgWork = h('div', { class: 'pg-work' }, toolbar, layout);
      root.appendChild(pgWork);
      U.layout.split(layout, { key: 'playground', def: 53.5, minLeft: 320, minRight: 280, label: 'Resize the editor and the output' });
      toolbar.appendChild(U.layout.full(layout, { kind: 'playground', root: pgWork, work: left }).btn);
      left.appendChild(editor.el);
      editor.refresh();
      left.appendChild(U.layout.grip({ kind: 'playground', editors: [editor], def: 420 }).el);
      left.appendChild(stdin.el);

      function fillSaved() {
        saved.innerHTML = '';
        var names = Object.keys(snippets()).sort();
        saved.appendChild(h('option', { value: '' }, names.length ? 'Saved (' + names.length + ')…' : 'No saved snippets'));
        names.forEach(function (n) { saved.appendChild(h('option', { value: n }, n)); });
        delBtn.disabled = true;
      }
      fillSaved();

      function load(code, input) {
        editor.set(code);
        stdin.set(input || '');
        U.store.set('playground.current', { code: code, stdin: input || '' });
        panel.clear();
      }
      tpl.addEventListener('change', function () {
        var t = U.find('templates', tpl.value);
        if (t) { load(t.code, t.stdin); name.value = t.title; }
        tpl.value = '';
      });
      saved.addEventListener('change', function () {
        var s = snippets()[saved.value];
        delBtn.disabled = !s;
        if (s) { load(s.code, s.stdin); name.value = saved.value; }
      });
      delBtn.addEventListener('click', function () {
        var all = snippets();
        if (!saved.value || !all[saved.value]) return;
        if (!delBtn.getAttribute('data-armed')) { delBtn.setAttribute('data-armed', '1'); delBtn.textContent = 'Click again to delete'; return; }
        delBtn.removeAttribute('data-armed'); delBtn.textContent = 'Delete';
        delete all[saved.value];
        U.store.set('playground.snippets', all);
        U.toast('Deleted');
        fillSaved();
      });
      function save() {
        var n = name.value.trim() || 'Snippet ' + new Date().toLocaleString();
        var all = snippets();
        all[n] = { code: editor.get(), stdin: stdin.get(), at: new Date().toISOString() };
        if (!U.store.set('playground.snippets', all)) { U.toast('Could not save: this browser blocks storage'); return; }
        name.value = n;
        fillSaved();
        saved.value = n;
        delBtn.disabled = false;
        U.toast('Saved "' + n + '"');
      }
      function download() {
        var base = (name.value.trim() || 'main').replace(/[^\w.-]+/g, '_').replace(/\.py$/, '');
        U.download(base + '.py', editor.get(), 'text/x-python');
      }
      function run() {
        if (runBtn.disabled) return;
        runBtn.disabled = true;
        stopBtn.disabled = false;
        panel.start();
        U.run.exec({ code: editor.get(), stdin: stdin.get() }, panel.append).then(function (res) {
          panel.show(res);
          runBtn.disabled = false;
          stopBtn.disabled = true;
        });
      }
      runBtn.addEventListener('click', run);
      stopBtn.addEventListener('click', function () { U.run.stop(); });
      function onKey(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); save(); }
      }
      document.addEventListener('keydown', onKey);
      this.cleanup = function () { document.removeEventListener('keydown', onKey); };

      U.playground = {
        editor: editor, run: run,
        setStdin: function (v) { stdin.set(v); },
        errorLine: function () { return editor.errorLine(); }
      };
    },
    destroy: function () {
      if (this.cleanup) this.cleanup();
      this.cleanup = null;
      U.playground = null;
    }
  };
  U.route('playground', U.views.playground);
})(window.PYLT);
