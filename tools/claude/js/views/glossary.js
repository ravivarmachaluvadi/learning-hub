/*
 * views/glossary.js - Claude Code's terms in plain language (#/glossary; #/glossary/<id> highlights
 * one). The terms are in data/glossary.js, from content/glossary.md. Adapted from the Lead Engineer
 * Learning Tool. The Lessons tab stays lit here.
 */
(function (U) {
  'use strict';
  var h = U.h;

  U.views.glossary = {
    render: function (root, params) {
      var terms = (U.data.glossary || []).slice().sort(function (a, b) { return a.term.localeCompare(b.term); });
      root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/lessons' }, 'Lessons'), ' › Glossary'));
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Glossary'),
        h('p', null, terms.length + ' Claude Code terms in plain language, each checked against the official docs, with where to read more.')));
      if (params[0] && !U.find('glossary', params[0])) {
        root.appendChild(U.callout('warn', 'Term not found', '<p>There is no term called "' + U.esc(params[0]) + '". Here is the full list.</p>'));
      }
      var filter = h('input', { class: 'input', id: 'gl-filter', type: 'search', placeholder: 'Filter the terms: compaction, mode, rule…', 'aria-label': 'Filter the terms' });
      root.appendChild(h('div', { class: 'ph-controls' }, filter));
      var empty = h('p', { class: 'muted', hidden: true }, 'No term mentions that.');
      var list = h('div', { class: 'glossary-list' }, terms.map(function (g) {
        return h('article', { class: 'term', 'data-id': g.id, id: 'term-' + g.id },
          h('h3', null, g.term),
          h('div', { html: U.md(g.def) }),
          (g.see || []).length ? h('p', { class: 'faint term-see' }, 'See: ', g.see.map(function (r, i) {
            var m = /^(\w+):(.+)$/.exec(r);
            return [i ? ', ' : '', h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) })];
          })) : null);
      }));
      root.appendChild(list);
      root.appendChild(empty);
      filter.addEventListener('input', function () {
        var q = filter.value.trim().toLowerCase(), any = false;
        U.$$('.term', list).forEach(function (el) {
          var g = U.find('glossary', el.getAttribute('data-id'));
          var hay = (g.term + ' ' + g.def + ' ' + (g.keywords || []).join(' ')).toLowerCase();
          el.hidden = !!q && hay.indexOf(q) < 0;
          if (!el.hidden) any = true;
        });
        empty.hidden = any;
      });
      var target = params[0] && U.$('.term[data-id="' + params[0].replace(/"/g, '') + '"]', list);
      if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); target.classList.add('flash'); }, 30);
    }
  };
  U.route('glossary', U.views.glossary);
})(window.CLT);
