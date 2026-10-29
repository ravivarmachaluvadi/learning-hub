/*
 * views/phrasebook.js - "Instead of... say..." (#/phrases, #/phrases?p=<id> to jump to one).
 *
 * Phrases are grouped by situation (data/phrases.js). Filter by group or by text, copy the better
 * wording, and star the ones you want to keep close; stars are kept in "lelt.phrases.starred".
 */
(function (U) {
  'use strict';
  var h = U.h;

  function starred() { return U.store.get('phrases.starred', []); }

  U.views.phrases = {
    render: function (root, params, query) {
      var groups = U.data.phraseGroups || [];
      var phrases = U.data.phrases || [];
      var stars = starred();
      var group = 'all';

      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Phrasebook'),
        h('p', null, 'The words you reach for under pressure decide how you come across. Each entry shows a common phrase, a better one, and why it works. ' +
          'Copy the ones you need, and star the ones you want to practise.')));

      var filter = h('input', { class: 'input', id: 'ph-filter', type: 'search', placeholder: 'Filter: sorry, deadline, no, update…', 'aria-label': 'Filter the phrases' });
      var chips = h('div', { class: 'chips filter-chips', role: 'group', 'aria-label': 'Show phrases about' },
        [{ id: 'all', title: 'All' }, { id: 'starred', title: '★ Starred' }].concat(groups).map(function (g) {
          return h('button', { class: 'chip' + (g.id === 'all' ? ' selected' : ''), type: 'button', 'data-group': g.id,
            onclick: function () { group = g.id; apply(); } }, g.title);
        }));
      root.appendChild(h('div', { class: 'ph-controls' }, filter, chips));
      var empty = h('p', { class: 'muted ph-empty', hidden: true }, 'No phrase matches.');

      var list = h('div', { class: 'ph-list' });
      groups.forEach(function (g) {
        var items = phrases.filter(function (p) { return p.group === g.id; });
        list.appendChild(h('section', { class: 'ph-group', 'data-group': g.id },
          h('h2', null, g.title), h('p', { class: 'muted' }, g.summary),
          items.map(card)));
      });
      root.appendChild(list);
      root.appendChild(empty);

      function card(p) {
        var on = stars.indexOf(p.id) >= 0;
        var star = h('button', { class: 'btn btn-small btn-ghost ph-star', type: 'button', 'aria-pressed': on ? 'true' : 'false',
          'aria-label': 'Star this phrase', title: 'Star this phrase', onclick: function () {
            var list = starred(), i = list.indexOf(p.id);
            if (i >= 0) list.splice(i, 1); else list.push(p.id);
            U.store.set('phrases.starred', list);
            stars = list;
            star.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
            star.textContent = i >= 0 ? '☆' : '★';
          } }, on ? '★' : '☆');
        return h('article', { class: 'phrase', 'data-id': p.id, id: 'phrase-' + p.id },
          h('div', { class: 'ph-pair' },
            h('div', { class: 'ph-instead' }, h('span', { class: 'ph-label' }, 'Instead of'), h('p', { html: U.mdInline(p.instead) })),
            h('div', { class: 'ph-say' }, h('span', { class: 'ph-label' }, 'Say'), h('p', { html: U.mdInline(p.say) }))),
          h('p', { class: 'ph-why', html: U.mdInline(p.why) }),
          h('div', { class: 'row ph-actions' },
            h('button', { class: 'btn btn-small ph-copy', type: 'button', onclick: function () { U.copy(U.phraseText(p.say)); } }, 'Copy'),
            star));
      }

      function apply() {
        var q = filter.value.trim().toLowerCase();
        U.$$('.chip', chips).forEach(function (c) { c.classList.toggle('selected', c.getAttribute('data-group') === group); });
        var any = false;
        U.$$('.ph-group', list).forEach(function (sec) {
          var shown = 0;
          U.$$('.phrase', sec).forEach(function (el) {
            var p = U.find('phrases', el.getAttribute('data-id'));
            var ok = (group === 'all' || p.group === group || (group === 'starred' && stars.indexOf(p.id) >= 0)) &&
              (!q || (U.plain(p.say) + ' ' + U.plain(p.instead) + ' ' + U.plain(p.why)).toLowerCase().indexOf(q) >= 0);
            el.hidden = !ok;
            if (ok) shown++;
          });
          sec.hidden = !shown;
          if (shown) any = true;
        });
        empty.hidden = any;
        if (!any && group === 'starred') empty.textContent = 'No starred phrases yet. Press ☆ on a phrase to keep it here.';
        else empty.textContent = 'No phrase matches.';
      }
      filter.addEventListener('input', apply);

      if (query.p) {
        var target = U.$('.phrase[data-id="' + query.p.replace(/"/g, '') + '"]', list);
        if (target) {
          setTimeout(function () {
            target.scrollIntoView({ block: 'center' });
            target.classList.add('flash');
          }, 30);
        }
      }
    }
  };
  U.route('phrases', U.views.phrases);
})(window.LELT);
