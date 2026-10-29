/*
 * views/glossary.js - React's words in plain language (#/glossary, #/glossary/<id>), as the Python
 * Learning Tool's Glossary: every term A to Z, its definition, and links to where it is taught. The
 * filter narrows the list as you type (a term's name, its other names and its definition); the
 * address #/glossary/<id> scrolls to one term and marks it. Ctrl K finds each term too (js/app.js),
 * and any text can link one with [[term:<id>]]. The terms are in data/glossary.js.
 */
(function (U) {
  'use strict';
  var h = U.h;

  function plain(md) { return String(md || '').replace(/`/g, '').replace(/\*\*/g, '').replace(/\[\[\w+:([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, id, l) { return l || id; }); }

  U.views.glossary = {
    render: function (root, params) {
      var terms = (U.data.glossary || []).slice().sort(function (a, b) { return a.term.toLowerCase().localeCompare(b.term.toLowerCase()); });
      root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Glossary'),
        h('p', null, 'The words React developers use without explaining them, explained in plain language, each with where this tool teaches it. ' +
          terms.length + ' terms. Ctrl K finds them from anywhere.')));
      var filter = h('input', { class: 'input glossary-filter', id: 'glossary-filter', type: 'search', autocomplete: 'off', spellcheck: 'false',
        placeholder: 'Filter: a word, or a topic (render, server, form…)', 'aria-label': 'Filter the terms' });
      var empty = h('p', { class: 'muted glossary-empty', hidden: true });
      var list = h('div', { class: 'glossary-list' });
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
          (t.keywords || []).length ? h('p', { class: 'faint term-aka' }, 'Also: ' + t.keywords.join(', ')) : null,
          h('div', { class: 'term-def', html: U.md(t.def) }),
          see.length ? h('div', { class: 'row term-see' }, h('span', { class: 'faint' }, 'Learn it in:'), see) : null);
        list.appendChild(el);
        return { el: el, hay: (t.term + ' ' + (t.keywords || []).join(' ') + ' ' + plain(t.def)).toLowerCase() };
      });
      U.enhance(list);
      function apply() {
        var words = filter.value.toLowerCase().trim().split(/\s+/).filter(Boolean), shown = 0;
        rows.forEach(function (r) {
          r.el.hidden = !words.every(function (w) { return r.hay.indexOf(w) >= 0; });
          if (!r.el.hidden) shown++;
        });
        empty.hidden = shown > 0;
        empty.textContent = 'No term matches "' + filter.value + '". Try a shorter word, or Ctrl K to search lessons and questions too.';
      }
      filter.addEventListener('input', apply);
      apply();
      if (params[0]) {
        var el = document.getElementById('term-' + params[0]);
        if (el) {
          el.classList.add('term-on');
          setTimeout(function () { el.scrollIntoView({ block: 'center' }); }, 0);   // after the router's scroll to the top
        }
      }
    }
  };
  U.route('glossary', U.views.glossary);
})(window.RLT);
