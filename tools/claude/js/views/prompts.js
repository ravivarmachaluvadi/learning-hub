/*
 * views/prompts.js - the prompt library (#/prompts, #/prompts?p=<id> to jump to one).
 *
 * Prompts are grouped by situation (data/prompts.js, from content/prompts.md). Each shows what people
 * usually type, the prompt that works, and why. <Angle brackets> mark what to fill in. Copy copies
 * the prompt exactly; stars are kept in "clt.prompts.starred".
 */
(function (U) {
  'use strict';
  var h = U.h;

  function starred() { return U.store.get('prompts.starred', []); }

  /** The prompt as HTML, with each <placeholder> marked. */
  function marked(text) {
    return U.esc(text).replace(/&lt;([^&\n]{1,70}?)&gt;/g, '<mark class="ph">&lt;$1&gt;</mark>');
  }

  U.views.prompts = {
    render: function (root, params, query) {
      var groups = U.data.promptGroups || [];
      var prompts = U.data.prompts || [];
      var stars = starred();
      var group = 'all';

      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Prompts'),
        h('p', null, 'Prompts that work, next to the ones people usually type. The difference is nearly always the same: say who it is for, give the facts and the files, ' +
          'set the length, and ask for proof. Fill in the parts in angle brackets, copy, paste into Claude Code.')));

      var filter = h('input', { class: 'input', id: 'pr-filter', type: 'search', placeholder: 'Filter: manager, phase, roadmap, test…', 'aria-label': 'Filter the prompts' });
      var chips = h('div', { class: 'chips filter-chips', role: 'group', 'aria-label': 'Show prompts about' },
        [{ id: 'all', title: 'All' }, { id: 'starred', title: '★ Starred' }].concat(groups).map(function (g) {
          return h('button', { class: 'chip' + (g.id === 'all' ? ' selected' : ''), type: 'button', 'data-group': g.id,
            onclick: function () { group = g.id; apply(); } }, g.title);
        }));
      root.appendChild(h('div', { class: 'ph-controls' }, filter, chips));
      var empty = h('p', { class: 'muted ph-empty', hidden: true }, 'No prompt matches.');

      var list = h('div', { class: 'pr-list' });
      groups.forEach(function (g) {
        list.appendChild(h('section', { class: 'pr-group', 'data-group': g.id },
          h('h2', null, g.title), h('p', { class: 'muted' }, g.summary),
          prompts.filter(function (p) { return p.group === g.id; }).map(card)));
      });
      root.appendChild(list);
      root.appendChild(empty);

      function card(p) {
        var on = stars.indexOf(p.id) >= 0;
        var star = h('button', { class: 'btn btn-small btn-ghost pr-star', type: 'button', 'aria-pressed': on ? 'true' : 'false',
          'aria-label': 'Star this prompt', title: 'Star this prompt', onclick: function () {
            var now = starred(), i = now.indexOf(p.id);
            if (i >= 0) now.splice(i, 1); else now.push(p.id);
            U.store.set('prompts.starred', now);
            stars = now;
            star.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
            star.textContent = i >= 0 ? '☆' : '★';
          } }, on ? '★' : '☆');
        return h('article', { class: 'prompt-card', 'data-id': p.id, id: 'prompt-' + p.id },
          h('h3', null, p.title),
          h('div', { class: 'pr-weak' }, h('span', { class: 'ph-label' }, 'Instead of'), h('p', null, p.weak)),
          h('div', { class: 'pr-strong' }, h('span', { class: 'ph-label' }, 'Use'), h('pre', { class: 'pr-text', html: marked(p.prompt) })),
          h('p', { class: 'pr-why', html: U.mdInline(p.why) }),
          h('div', { class: 'row pr-actions' },
            (p.related || []).map(function (r) {
              var m = /^(\w+):(.+)$/.exec(r);
              return h('a', { class: 'cheat-rel', href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
            }),
            h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small btn-primary pr-copy', type: 'button', onclick: function () { U.copy(p.prompt); } }, 'Copy'),
            star));
      }

      function apply() {
        var q = filter.value.trim().toLowerCase();
        U.$$('.chip', chips).forEach(function (c) { c.classList.toggle('selected', c.getAttribute('data-group') === group); });
        var any = false;
        U.$$('.pr-group', list).forEach(function (sec) {
          var shown = 0;
          U.$$('.prompt-card', sec).forEach(function (el) {
            var p = U.find('prompts', el.getAttribute('data-id'));
            var ok = (group === 'all' || p.group === group || (group === 'starred' && stars.indexOf(p.id) >= 0)) &&
              (!q || (p.title + ' ' + p.prompt + ' ' + p.weak + ' ' + p.why).toLowerCase().indexOf(q) >= 0);
            el.hidden = !ok;
            if (ok) shown++;
          });
          sec.hidden = !shown;
          if (shown) any = true;
        });
        empty.hidden = any;
        empty.textContent = !any && group === 'starred' ? 'No starred prompts yet. Press ☆ on a prompt to keep it here.' : 'No prompt matches.';
      }
      filter.addEventListener('input', apply);

      if (query.p) {
        var target = U.$('.prompt-card[data-id="' + query.p.replace(/"/g, '') + '"]', list);
        if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); target.classList.add('flash'); }, 30);
      }
    }
  };
  U.route('prompts', U.views.prompts);
})(window.CLT);
