/*
 * views/springmap.js - the Spring map (#/spring, batch 4): each Spring feature, the thread it runs on with and without
 * virtual threads, and the lesson that explains it. The threads are the output of one real program, shown at the
 * bottom, which the tests run. The data is data/springmap.js.
 */
(function (U) {
  'use strict';
  var h = U.h;

  U.views.spring = {
    render: function (root) {
      var m = U.data.springMap || { rows: [], program: '', output: '' };
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'The Spring map'),
        h('p', null, 'Where your code runs in a Spring Boot 4.1.2 application: each feature, the thread it gets with and without ' +
          'spring.threads.virtual.enabled, and the lesson that explains it. Every row but one is what the program at the bottom printed.')));
      var list = h('div', { class: 'sm-rows' });
      m.rows.forEach(function (r) {
        list.appendChild(h('article', { class: 'card sm-row' + (r.notRun ? ' sm-notrun' : ''), 'data-id': r.id },
          h('h3', { class: 'sm-feature' }, r.feature),
          h('dl', { class: 'sm-threads' },
            h('dt', null, 'Virtual threads off'), h('dd', { class: 'sm-off' }, h('code', null, r.off)),
            h('dt', null, 'Virtual threads on'), h('dd', { class: 'sm-on' }, h('code', null, r.on))),
          U.enhance(h('div', { class: 'sm-note', html: U.md(r.note) })),
          r.notRun ? h('p', { class: 'sm-notrun-why faint' }, r.notRun) : null,
          h('a', { class: 'btn btn-small sm-lesson', href: U.linkFor('lesson', r.lesson), html: U.labelFor('lesson', r.lesson) })));
      });
      root.appendChild(list);
      root.appendChild(h('h2', null, 'The program behind the map'));
      root.appendChild(h('p', { class: 'muted' }, 'One application that does each thing, started both ways. The tests run it, and it must print exactly this.'));
      root.appendChild(h('pre', { class: 'code sm-output' }, m.output));
      root.appendChild(U.codeBlock(m.program, 'java', { label: 'Java', title: 'The Spring map' }).el);
    }
  };
  U.route('spring', U.views.spring);
})(window.JCLT);
