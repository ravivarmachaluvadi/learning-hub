/*
 * views/playbooks.js - step-by-step workflows (#/playbooks, #/playbooks/<id>).
 *
 * Each playbook is a Markdown page (data/playbooks.js, from content/playbooks/*.md) with its
 * commands and prompts in code blocks that copy with one click.
 */
(function (U) {
  'use strict';
  var h = U.h;

  function links(list, cls) {
    return h('ul', { class: 'plain-list ' + cls }, (list || []).map(function (r) {
      var m = /^(\w+):(.+)$/.exec(r);
      return h('li', null, h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) }));
    }));
  }

  function listPage(root) {
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Playbooks'),
      h('p', null, 'Workflows for the situations that come up every week, step by step, with the exact commands and prompts. Every code block has a Copy button.')));
    root.appendChild(h('div', { class: 'cards' }, (U.data.playbooks || []).map(function (p) {
      return h('a', { class: 'card playbook-card', href: '#/playbooks/' + p.id, 'data-id': p.id },
        h('div', { class: 'row' }, U.trackBadge(p.track), h('span', { class: 'faint' }, p.minutes + ' min read')),
        h('h3', null, p.title),
        h('p', { class: 'muted' }, p.summary));
    })));
  }

  U.views.playbooks = {
    render: function (root, params) {
      if (!params[0]) return listPage(root);
      var p = U.find('playbooks', params[0]);
      if (!p) {
        root.appendChild(h('div', { class: 'card' }, h('h1', null, 'Playbook not found'),
          h('p', null, 'There is no playbook called "' + params[0] + '".'), h('a', { class: 'btn', href: '#/playbooks' }, '← All playbooks')));
        return;
      }
      root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/playbooks' }, 'Playbooks'), ' › ', p.title));
      root.appendChild(h('div', { class: 'page-head' },
        h('div', { class: 'row' }, U.trackBadge(p.track), h('span', { class: 'faint' }, p.minutes + ' min read')),
        h('h1', null, p.title),
        h('p', { class: 'lesson-summary' }, p.summary)));
      root.appendChild(h('div', { class: 'pb-layout' },
        h('article', { class: 'pb-body lesson-text', html: U.md(p.body) }),
        (p.related || []).length ? h('aside', { class: 'card pb-side' }, h('h2', null, 'Related'), links(p.related, 'pb-related')) : null));
    }
  };
  U.route('playbooks', U.views.playbooks);
})(window.CLT);
