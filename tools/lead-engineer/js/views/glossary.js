/*
 * views/glossary.js - plain-language definitions (#/glossary, #/glossary/<id> highlights one).
 */
(function (U) {
  'use strict';
  var h = U.h;

  U.views.glossary = {
    render: function (root, params) {
      var terms = (U.data.glossary || []).slice().sort(function (a, b) { return a.term.localeCompare(b.term); });
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Glossary'),
        h('p', null, terms.length + ' terms a lead hears every week, in plain language.')));
      if (params[0] && !U.find('glossary', params[0])) {
        root.appendChild(U.callout('warn', 'Term not found', '<p>There is no term called "' + U.esc(params[0]) + '". Here is the full list.</p>'));
      }
      var filter = h('input', { class: 'input', type: 'search', placeholder: 'Filter the terms…', 'aria-label': 'Filter the terms' });
      root.appendChild(h('div', { class: 'ph-controls' }, filter));
      var list = h('div', { class: 'glossary-list' }, terms.map(function (g) {
        return h('article', { class: 'term', 'data-id': g.id, id: 'term-' + g.id },
          h('h3', null, g.term),
          h('div', { html: U.md(g.def) }),
          (g.see || []).length ? h('p', { class: 'faint' }, 'See also: ', g.see.map(function (r, i) {
            var m = /^(\w+):(.+)$/.exec(r) || [null, 'term', r];
            return [i ? ', ' : '', h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) })];
          })) : null);
      }));
      root.appendChild(list);
      filter.addEventListener('input', function () {
        var q = filter.value.trim().toLowerCase();
        U.$$('.term', list).forEach(function (el) {
          el.hidden = q && el.textContent.toLowerCase().indexOf(q) < 0;
        });
      });
      var target = params[0] && U.$('.term[data-id="' + params[0].replace(/"/g, '') + '"]', list);
      if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); target.classList.add('flash'); }, 30);
    }
  };
  U.route('glossary', U.views.glossary);
})(window.LELT);
