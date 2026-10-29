/*
 * views/explain.js - the explainers (#/explain, #/explain/<id>): an idea with a picture you can
 * change. The text is in data/explainers.js (from content/explainers.md); each picture is drawn by
 * js/views/explainers/<id>.js, which registers CLT.explainers[id] = {render(container), ...}.
 * They are listed with their track's lessons too, and the Lessons tab stays lit on these pages.
 * Adapted from the Lead Engineer Learning Tool.
 */
(function (U) {
  'use strict';
  var h = U.h;
  U.explainers = U.explainers || {};

  function listPage(root) {
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/lessons' }, 'Lessons'), ' › Explainers'));
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Explainers'),
      h('p', null, 'Ideas that are quicker to understand by changing something and watching what happens: add a file read and watch the context fill, set a key in two files and see which wins, try a command against a rule set.')));
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
    root.appendChild(h('article', { class: 'lesson-text explainer' },
      h('div', { class: 'row' }, U.trackBadge(x.track), h('span', { class: 'badge badge-accent' }, 'Explainer')),
      h('h1', null, x.title),
      h('p', { class: 'lesson-summary' }, x.summary),
      h('div', { class: 'lesson-body', html: U.md(x.intro) })));
    var widget = h('div', { class: 'card explainer-widget', 'data-id': x.id });
    root.appendChild(widget);
    if (U.explainers[x.id]) U.explainers[x.id].render(widget);
    else widget.appendChild(h('p', { class: 'muted' }, 'The picture for this explainer is missing.'));
    root.appendChild(h('div', { class: 'lesson-text' },
      h('div', { class: 'lesson-body explainer-after', html: U.md(x.after) }),
      (x.related || []).length ? [h('h2', null, 'Practise it'), U.linkList(x.related, 'lesson-related')] : null,
      h('h2', null, 'Checked against'),
      h('ul', { class: 'plain-list lesson-sources explainer-sources' }, x.sources.map(function (s) {
        return h('li', null, h('a', { href: s, target: '_blank', rel: 'noopener' }, s.replace(/^https:\/\/code\.claude\.com\/docs\/en\//, 'docs: ')));
      }))));
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
})(window.CLT);
