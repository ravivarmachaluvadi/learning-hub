/*
 * views/cheatsheet.js - the short docs (#/cheatsheet): commands, keys, flags, files and settings.
 *
 *   #/cheatsheet           everything, grouped (data/cheatsheet.js, from content/cheatsheet.md)
 *   #/cheatsheet?top=1     the top 20 only
 *   #/cheatsheet?c=<id>    everything, with one entry highlighted and scrolled into view
 */
(function (U) {
  'use strict';
  var h = U.h;

  var KIND = { slash: 'Command', key: 'Key', prefix: 'Prefix', cli: 'Terminal', file: 'File', setting: 'Setting' };
  var CLI_REF = 'https://code.claude.com/docs/en/cli-reference';

  function sourceLink(c) {
    var href = c.src === 'claude --help' ? CLI_REF : c.src;
    var label = c.src === 'claude --help' ? 'claude --help' : c.src.replace(/^https:\/\/code\.claude\.com\/docs\/en\//, 'docs: ');
    return h('a', { class: 'cheat-src', href: href, target: '_blank', rel: 'noopener' }, label);
  }

  function card(c) {
    return h('article', { class: 'cheat', 'data-id': c.id, id: 'cheat-' + c.id },
      h('div', { class: 'cheat-head' },
        h('code', { class: 'cheat-name' }, c.name),
        h('span', { class: 'badge' }, KIND[c.kind] || c.kind),
        c.top ? h('span', { class: 'badge badge-accent' }, 'Top 20') : null),
      h('p', { class: 'cheat-what', html: U.mdInline(c.what) }),
      h('p', { class: 'cheat-when', html: '<b>When:</b> ' + U.mdInline(c.when) }),
      c.example ? h('pre', { class: 'cheat-example' }, c.example) : null,
      h('div', { class: 'row cheat-actions' },
        h('button', { class: 'btn btn-small cheat-copy', type: 'button', onclick: function () { U.copy(c.example || c.name); } },
          c.example ? 'Copy example' : 'Copy'),
        (c.related || []).map(function (r) {
          var m = /^(\w+):(.+)$/.exec(r);
          return h('a', { class: 'cheat-rel', href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
        }),
        h('span', { class: 'spacer' }),
        sourceLink(c)));
  }

  U.views.cheatsheet = {
    render: function (root, params, query) {
      var groups = U.data.cheatGroups || [];
      var cheats = U.data.cheats || [];
      var group = query.top ? 'top' : 'all';

      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Cheat sheet'),
        h('p', null, 'The short version of the Claude Code docs: what each command, key, flag, file and setting does, and the moment you reach for it. ' +
          'Every entry was checked against the official docs or claude --help for Claude Code 2.1.309, and links its source.')));

      var filter = h('input', { class: 'input', id: 'cs-filter', type: 'search', placeholder: 'Filter: clear, plan, worktree, permission…', 'aria-label': 'Filter the cheat sheet' });
      var chips = h('div', { class: 'chips filter-chips', role: 'group', 'aria-label': 'Show' },
        [{ id: 'all', title: 'All' }, { id: 'top', title: '★ Top 20' }].concat(groups).map(function (g) {
          return h('button', { class: 'chip', type: 'button', 'data-group': g.id, onclick: function () { group = g.id; apply(); } }, g.title);
        }));
      root.appendChild(h('div', { class: 'ph-controls' }, filter, chips));

      var list = h('div', { class: 'cs-list' });
      groups.forEach(function (g) {
        list.appendChild(h('section', { class: 'cs-group', 'data-group': g.id },
          h('h2', null, g.title), h('p', { class: 'muted' }, g.summary),
          h('div', { class: 'cs-cards' }, cheats.filter(function (c) { return c.group === g.id; }).map(card))));
      });
      var empty = h('p', { class: 'muted ph-empty', hidden: true }, 'Nothing matches.');
      root.appendChild(list);
      root.appendChild(empty);

      function apply() {
        var q = filter.value.trim().toLowerCase();
        U.$$('.chip', chips).forEach(function (c) { c.classList.toggle('selected', c.getAttribute('data-group') === group); });
        var any = false;
        U.$$('.cs-group', list).forEach(function (sec) {
          var shown = 0;
          U.$$('.cheat', sec).forEach(function (el) {
            var c = U.find('cheats', el.getAttribute('data-id'));
            var text = [c.name, c.what, c.when, c.example || ''].concat(c.keywords || []).join(' ').toLowerCase();
            var ok = (group === 'all' || group === c.group || (group === 'top' && c.top)) && (!q || text.indexOf(q) >= 0);
            el.hidden = !ok;
            if (ok) shown++;
          });
          sec.hidden = !shown;
          if (shown) any = true;
        });
        empty.hidden = any;
      }
      filter.addEventListener('input', apply);
      apply();

      if (query.c) {
        var target = U.$('.cheat[data-id="' + query.c.replace(/"/g, '') + '"]', list);
        if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); target.classList.add('flash'); }, 30);
      }
    }
  };
  U.route('cheatsheet', U.views.cheatsheet);
})(window.CLT);
