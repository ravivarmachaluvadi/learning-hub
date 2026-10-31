/*
 * views/glossary.js - concurrency words in plain language (#/glossary, #/glossary/<id>), with a filter.
 * The terms are in data/glossary.js.
 */
(function (U) {
  'use strict';
  var h = U.h;

  U.views.glossary = {
    render: function (root, params) {
      var terms = (U.data.glossary || []).slice().sort(function (a, b) { return a.term.toLowerCase().localeCompare(b.term.toLowerCase()); });
      root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Glossary'),
        h('p', null, 'The words concurrency talks and code reviews use without explaining them, explained in plain language, each linked to where it is taught.')));
      var filter = h('input', { class: 'input glossary-filter', id: 'glossary-filter', type: 'search', autocomplete: 'off', placeholder: 'Filter terms…', 'aria-label': 'Filter terms' });
      var list = h('div', { class: 'glossary-list' });
      var empty = h('p', { class: 'muted', hidden: true });
      root.appendChild(filter);
      root.appendChild(empty);
      root.appendChild(list);
      var rows = terms.map(function (t) {
        var see = (t.see || []).map(function (r) {
          var m = /^(\w+):(.+)$/.exec(r);
          return h('a', { class: 'btn btn-small', href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
        });
        var el = h('article', { class: 'term card', id: 'term-' + t.id },
          h('h3', null, t.term),
          U.enhance(h('div', { html: U.md(t.def) })),
          see.length ? h('div', { class: 'row term-see' }, h('span', { class: 'faint' }, 'See:'), see) : null);
        list.appendChild(el);
        return { el: el, hay: (t.term + ' ' + (t.keywords || []).join(' ') + ' ' + t.def).toLowerCase() };
      });
      function apply() {
        var q = filter.value.trim().toLowerCase(), shown = 0;
        rows.forEach(function (r) { r.el.hidden = !!q && r.hay.indexOf(q) < 0; if (!r.el.hidden) shown++; });
        empty.hidden = shown > 0;
        empty.textContent = 'No term matches "' + filter.value + '".';
      }
      filter.addEventListener('input', apply);
      apply();
      if (params[0]) {
        var el = document.getElementById('term-' + params[0]);
        if (el) setTimeout(function () { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); }, 30);
      }
    }
  };
  U.route('glossary', U.views.glossary);
})(window.JCLT);
