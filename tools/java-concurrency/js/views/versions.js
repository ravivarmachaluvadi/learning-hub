/*
 * views/versions.js - the Java version map (#/versions, batch 2): for each concurrency feature, every JEP
 * from Java 19 to 27, whether it was an incubator, a preview or final, and what changed, each linking its
 * page on openjdk.org. The data is data/versions.js. Java 25 rows are marked: it is the LTS this tool runs.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var LABELS = { incubator: 'Incubator', preview: 'Preview', final: 'Final', removed: 'Removed' };

  U.views.versions = {
    render: function (root) {
      var features = U.data.versions || [];
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Java versions'),
        h('p', null, 'Every concurrency JEP from Java 19 to 27: when it was an incubator, a preview or final, and what changed. ' +
          'Java 25 is the long-term-support release this tool runs, with preview features on. Each row was read on openjdk.org (1 Nov 2026).')));
      root.appendChild(h('div', { class: 'card narrow', html: U.md(
        '| Status | What it means for your code |\n|---|---|\n' +
        '| **Final** | part of Java: compiles and runs with no flag, and will not change |\n' +
        '| **Preview** | finished but not permanent: needs `--enable-preview` to compile and run, and may change in the next release |\n' +
        '| **Incubator** | an experimental module (`jdk.incubator.…`), added with `--add-modules` |') }));
      features.forEach(function (f) {
        var m = f.lesson ? /^(\w+):(.+)$/.exec(f.lesson) : null;
        root.appendChild(h('h2', { id: 'v-' + f.id, html: U.mdInline(f.feature) }));
        root.appendChild(h('p', { class: 'muted' }, h('span', { html: U.mdInline(f.summary) }),
          m ? [' ', h('a', { href: U.linkFor(m[1], m[2]), html: 'Learn it: ' + U.labelFor(m[1], m[2]) + ' →' })] : null));
        root.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table version-table' },
          h('thead', null, h('tr', null, h('th', null, 'Java'), h('th', null, 'JEP'), h('th', null, 'Status'), h('th', null, 'What changed'))),
          h('tbody', null, f.rows.map(function (r) {
            return h('tr', { class: r.jdk === 25 ? 'lts-row' : null },
              h('td', null, String(r.jdk) + (r.jdk === 25 || r.jdk === 21 ? ' LTS' : '')),
              h('td', null, h('a', { href: 'https://openjdk.org/jeps/' + r.jep, target: '_blank', rel: 'noopener' }, 'JEP ' + r.jep)),
              h('td', null, h('span', { class: 'badge status-' + r.status }, LABELS[r.status] || r.status)),
              h('td', { html: U.mdInline(r.note) }));
          })))));
      });
    }
  };
  U.route('versions', U.views.versions);
})(window.JCLT);
