/*
 * views/reading.js - the reading list (#/reading, under the Lessons tab): the books, articles and
 * guides in data/reading.js, by track, with filters ("start here", one track, hide what you have
 * read) and a tick for each. Ticks are kept in "lelt.reading" as {read: {id: 'YYYY-MM-DD'}}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var KIND = { book: 'Book', article: 'Article', guide: 'Guide', paper: 'Paper' };

  function state() {
    var st = U.store.get('reading', null);
    if (!st || typeof st !== 'object' || !st.read || typeof st.read !== 'object') st = { read: {} };
    return st;
  }

  U.views.reading = {
    render: function (root) {
      var items = U.data.reading || [], st = state(), filter = 'all', hideRead = false;
      var count = h('span', { id: 'rl-count', class: 'muted' });
      var hide = h('input', { type: 'checkbox', id: 'rl-hide-read', onchange: function () { hideRead = hide.checked; apply(); } });
      // the tracks in the order the list first names them (leadership first), each item in the data's order
      var tracks = [];
      items.forEach(function (r) { var t = U.track(r.track); if (t && tracks.indexOf(t) < 0) tracks.push(t); });
      var chips = h('div', { class: 'chips filter-chips', role: 'group', 'aria-label': 'Show' });
      [['all', 'All'], ['start', 'Start here']].concat(tracks.map(function (t) { return [t.id, t.name]; })).forEach(function (c) {
        chips.appendChild(h('button', { class: 'chip' + (c[0] === 'all' ? ' selected' : ''), type: 'button', 'data-filter': c[0], 'aria-pressed': c[0] === 'all' ? 'true' : 'false',
          onclick: function () { filter = c[0]; apply(); } }, c[1]));
      });

      root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/lessons' }, 'Lessons'), ' › Reading list'));
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Reading list'),
        h('p', null, 'The books, articles and guides behind the lessons, by area. Each says why a lead should read it and what to take from it. ' +
          'New to leading? Start with the five marked "Start here". Tick what you have read; the ticks stay in this browser.')));
      root.appendChild(chips);
      root.appendChild(h('div', { class: 'row rl-bar' }, count, h('span', { class: 'spacer' }),
        h('label', { class: 'radio', for: 'rl-hide-read' }, hide, ' Hide what I have read')));

      var groups = tracks.map(function (t) {
        return { track: t, el: h('section', { class: 'rl-group', 'data-track': t.id },
          h('div', { class: 'track-title' }, U.trackBadge(t.id), h('h2', null, t.name)),
          h('div', { class: 'rl-list' }, items.filter(function (r) { return r.track === t.id; }).map(item))) };
      });
      groups.forEach(function (g) { root.appendChild(g.el); });

      function item(r) {
        var tick = h('input', { type: 'checkbox', class: 'rl-tick', 'aria-label': 'I have read ' + r.title, onchange: function () {
          if (tick.checked) st.read[r.id] = U.localDate(new Date()); else delete st.read[r.id];
          U.store.set('reading', st);
          apply();
        } });
        tick.checked = !!st.read[r.id];
        return h('article', { class: 'card rl-item', 'data-id': r.id, 'data-track': r.track },
          h('div', { class: 'rl-head' }, tick,
            h('div', { class: 'rl-title' },
              h('b', null, r.url ? h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.title) : r.title),
              h('small', null, r.author + ' · ' + r.year + ' · ' + (KIND[r.kind] || r.kind))),
            r.start ? h('span', { class: 'badge badge-accent' }, 'Start here') : null),
          h('p', { class: 'rl-why' }, r.why),
          h('p', { class: 'rl-take' }, h('b', null, 'What to take from it: '), r.take));
      }

      function apply() {
        U.$$('.chip', chips).forEach(function (c) {
          var on = c.getAttribute('data-filter') === filter;
          c.classList.toggle('selected', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var read = items.filter(function (r) { return st.read[r.id]; }).length;
        count.textContent = read + ' of ' + items.length + ' read';
        U.$$('.rl-item', root).forEach(function (el) {
          var r = U.find('reading', el.getAttribute('data-id'));
          var show = (filter === 'all' || (filter === 'start' ? r.start : r.track === filter)) && !(hideRead && st.read[r.id]);
          el.hidden = !show;
          el.classList.toggle('read', !!st.read[r.id]);
        });
        groups.forEach(function (g) { g.el.hidden = !U.$$('.rl-item', g.el).some(function (el) { return !el.hidden; }); });
      }
      apply();
    }
  };
  U.route('reading', U.views.reading);
})(window.LELT);
