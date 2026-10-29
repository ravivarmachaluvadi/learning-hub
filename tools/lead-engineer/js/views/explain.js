/*
 * views/explain.js - the explainers (#/explain, #/explain/<id>): an idea with a picture you can
 * change. The text is in data/explainers.js; each picture is drawn by js/views/explainers/<track>.js,
 * which registers LELT.explainers[id] = {render(container)}. They are listed with their track's
 * lessons too, and the Lessons tab stays lit on these pages.
 */
(function (U) {
  'use strict';
  var h = U.h;
  U.explainers = U.explainers || {};

  function listPage(root) {
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/lessons' }, 'Lessons'), ' › Explainers'));
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Explainers'),
      h('p', null, 'Ideas that are quicker to understand by moving something and watching what happens: drag a slider, roll the dice, switch a pattern.')));
    (U.data.tracks || []).forEach(function (t) {
      var mine = (U.data.explainers || []).filter(function (x) { return x.track === t.id; });
      if (!mine.length) return;
      root.appendChild(h('div', { class: 'track-title' }, U.trackBadge(t.id), h('h2', null, t.name)));
      root.appendChild(h('div', { class: 'cards' }, mine.map(function (x) {
        return h('a', { class: 'card explainer-card', href: '#/explain/' + x.id, 'data-id': x.id },
          h('div', { class: 'card-kicker' }, 'Explainer'), h('h3', null, x.title), h('p', { class: 'muted' }, x.summary));
      })));
    });
  }

  function page(root, x) {
    var t = U.track(x.track);
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/lessons' }, 'Lessons'), ' › ', h('a', { href: '#/explain' }, 'Explainers'), ' › ',
      h('a', { href: '#/lessons?track=' + x.track }, t ? t.name : x.track)));
    var art = h('article', { class: 'lesson-text explainer' },
      h('div', { class: 'row' }, U.trackBadge(x.track), h('span', { class: 'badge badge-accent' }, 'Explainer')),
      h('h1', null, x.title),
      h('p', { class: 'lesson-summary' }, x.summary),
      h('div', { class: 'lesson-body', html: U.md(x.intro) }));
    var widget = h('div', { class: 'card explainer-widget', 'data-id': x.id });
    root.appendChild(art);
    root.appendChild(widget);
    if (U.explainers[x.id]) U.explainers[x.id].render(widget);
    else widget.appendChild(h('p', { class: 'muted' }, 'The picture for this explainer is missing.'));
    root.appendChild(h('div', { class: 'lesson-text' },
      h('div', { class: 'lesson-body explainer-after', html: U.md(x.after) }),
      (x.related || []).length ? [h('h2', null, 'Practise it'), h('ul', { class: 'lesson-related' }, x.related.map(function (r) {
        var m = /^(\w+):(.+)$/.exec(r);
        return h('li', null, h('span', { class: 'badge' }, U.kindLabel(m[1])),
          ' ', h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) }));
      }))] : null,
      h('h2', null, 'Sources'),
      h('ul', { class: 'lesson-sources explainer-sources' }, x.sources.map(function (s) { return h('li', { html: U.mdInline(s) }); }))));
  }

  U.views.explain = {
    render: function (root, params) {
      if (!params[0]) return listPage(root);
      var x = U.find('explainers', params[0]);
      if (!x) {
        root.appendChild(h('div', { class: 'card' }, h('h1', null, 'Explainer not found'),
          h('p', null, 'There is no explainer called "' + params[0] + '".'), h('a', { class: 'btn', href: '#/explain' }, '← All explainers')));
        return;
      }
      page(root, x);
    },
    destroy: function () {
      Object.keys(U.explainers).forEach(function (k) { if (U.explainers[k].destroy) U.explainers[k].destroy(); });
    }
  };
  U.route('explain', U.views.explain);
})(window.LELT);
