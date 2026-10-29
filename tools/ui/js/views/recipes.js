/*
 * views/recipes.js - UI pattern recipes (#/recipes and #/recipes/<id>): dialog, tabs, dropdown menu,
 * toast, sortable table. Each page explains how the pattern works and what makes it accessible, and
 * runs the code in an editable workspace. "Open in Playground" carries it over to keep building.
 * The recipes themselves live in data/recipes.js.
 * The line between the text and the code can be dragged, and Full screen puts the two across the
 * whole window, as on a lesson (js/layout.js).
 */
(function (U) {
  'use strict';
  var h = U.h;

  function recipes() { return U.data.recipes || []; }

  function list(root) {
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'UI pattern recipes'),
      h('p', null, 'The widgets every web app needs, each small, complete and accessible: it works with a mouse, with the keyboard ' +
        'and with a screen reader. Read how it works, try it, then open it in the Playground and make it yours.')));
    root.appendChild(h('div', { class: 'cards' }, recipes().map(function (r) {
      return h('a', { class: 'card', href: '#/recipes/' + r.id },
        h('div', { class: 'card-kicker' }, 'Recipe · HTML + CSS + JS'),
        h('h3', null, r.title),
        h('p', { class: 'muted', style: { margin: 0 } }, r.summary));
    })));
  }

  function recipePage(root, r) {
    var all = recipes(), idx = all.indexOf(r), next = all[idx + 1];
    var text = h('div', { class: 'lesson-text' });
    var work = h('div', { class: 'lesson-work' });
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/recipes' }, 'Recipes'), ' › recipe ' + (idx + 1) + ' of ' + all.length));
    var layout = h('div', { class: 'lesson-layout' }, text, work);
    root.appendChild(layout);
    U.layout.split(layout, { key: 'lesson', minLeft: 260, minRight: 380, label: 'Resize the recipe and the code' });
    var fs = U.layout.full(layout, { kind: 'work', text: text, work: work, fit: 'trade', panes: true });

    text.appendChild(h('h1', null, r.title));
    text.appendChild(h('p', { class: 'entry-summary' }, r.summary));
    text.appendChild(U.enhance(h('div', { html: U.md(r.body) })));
    text.appendChild(h('h2', null, 'Try it'));
    text.appendChild(h('div', { html: U.md(r.tryIt) }));
    text.appendChild(h('h2', null, 'What makes it accessible'));
    text.appendChild(h('div', { class: 'recipe-a11y', html: U.md(r.a11y) }));
    if (r.java) text.appendChild(U.callout('java', 'Java analogy', U.md(r.java)));
    if (r.related && r.related.length) {
      text.appendChild(h('h3', null, 'Look these up'));
      text.appendChild(h('div', { class: 'related' }, r.related.map(function (x) {
        var m = /^(\w+):(.+)$/.exec(x) || [null, 'js', x];
        return h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
      })));
    }
    text.appendChild(h('div', { class: 'row', style: { marginTop: '24px' } },
      h('a', { class: 'btn', href: '#/recipes' }, '← All recipes'), h('span', { class: 'spacer' }),
      next ? h('a', { class: 'btn btn-primary', href: '#/recipes/' + next.id }, next.title + ' →') : null));

    work.appendChild(h('div', { class: 'ed-tabs' }, h('span', { class: 'faint' }, 'The whole recipe: edit it and the preview follows.'),
      h('span', { class: 'spacer' }), fs.hideBtn, fs.btn));
    var box = h('div');
    work.appendChild(box);
    var ws = U.lessonTools.workspace(box, r, { modes: ['html', 'css', 'js'], height: 280, previewHeight: 280, title: r.title + ' preview' });
    work.appendChild(h('div', { class: 'row recipe-actions' },
      h('button', { class: 'btn btn-primary', type: 'button', onclick: function () {
        var s = ws.get();
        U.openInPlayground({ title: r.title, html: s.html, css: s.css, js: s.js });
      } }, 'Open in Playground'),
      h('button', { class: 'btn btn-small', type: 'button', onclick: function () { ws.set(r); } }, 'Reset')));
    U.currentRecipe = { recipe: r, workspace: ws };
  }

  U.views.recipes = {
    render: function (root, params) {
      var r = params[0] && U.find('recipes', params[0]);
      if (r) recipePage(root, r); else list(root);
    },
    destroy: function () { U.currentRecipe = null; }
  };
  U.route('recipes', U.views.recipes);
})(window.UILT);
