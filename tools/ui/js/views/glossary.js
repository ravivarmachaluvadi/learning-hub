/*
 * views/glossary.js - plain-language definitions (#/glossary and #/glossary/<id>).
 */
(function (U) {
  'use strict';
  var h = U.h;

  U.views.glossary = {
    render: function (root, params) {
      var terms = (U.data.glossary || []).slice().sort(function (a, b) { return a.term.localeCompare(b.term); });
      root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Glossary'),
        h('p', null, 'The words that web developers use without explaining them, explained.')));
      var filter = h('input', { class: 'input', type: 'search', placeholder: 'Filter terms…', 'aria-label': 'Filter terms', style: { maxWidth: '360px', width: '100%', marginBottom: '14px' } });
      var listEl = h('div', { class: 'glossary-list' });
      root.appendChild(filter);
      root.appendChild(listEl);
      function draw() {
        var q = filter.value.trim().toLowerCase();
        listEl.innerHTML = '';
        terms.forEach(function (t) {
          var hay = (t.term + ' ' + t.def + ' ' + (t.keywords || []).join(' ')).toLowerCase();
          if (q && hay.indexOf(q) < 0) return;
          var see = (t.see || []).map(function (r) {
            var m = /^(\w+):(.+)$/.exec(r);
            return h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
          });
          listEl.appendChild(h('article', { class: 'term', id: 'term-' + t.id },
            h('h3', null, t.term),
            h('div', { html: U.md(t.def) }),
            see.length ? h('div', { class: 'related', style: { marginTop: '8px' } }, see) : null));
        });
        if (!listEl.children.length) listEl.appendChild(h('p', { class: 'muted' }, 'No term matches "' + filter.value + '".'));
      }
      filter.addEventListener('input', draw);
      draw();
      if (params[0]) {
        var el = document.getElementById('term-' + params[0]);
        if (el) setTimeout(function () { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); }, 30);
      }
    }
  };
  U.route('glossary', U.views.glossary);
})(window.UILT);
