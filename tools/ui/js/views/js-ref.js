/*
 * views/js-ref.js - the JavaScript reference (#/js and #/js/<topic>).
 * Each topic: an explanation, the same idea in Java and in JavaScript side by side, a table of the
 * methods involved, and a live example you can edit (with a console).
 * The line between the Java and the JavaScript can be dragged, and Full screen puts the whole page
 * across the window (js/layout.js).
 */
(function (U) {
  'use strict';
  var h = U.h;
  var ORDER = ['Language basics', 'The DOM', 'Events', 'Data & the network'];

  function topics() { return U.data.jsTopics || []; }

  function intro(main) {
    main.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'JavaScript for the page'),
      h('p', null, 'The parts of JavaScript you need to make pages interactive, each shown next to the Java you already know, with a live example and a console.')));
    main.appendChild(U.callout('java', 'The big differences from Java', U.md(
      '- **No compiler, no declared types**: mistakes appear when the line runs, as red errors in the console.\n' +
      '- **One thread with an event loop**: you never block; you register callbacks (events, timers, `await`).\n' +
      '- **Functions are values**: passed around everywhere, like lambdas.\n' +
      '- **Objects are open**: add or remove properties at any time; JSON is just their literal syntax.\n' +
      '- **The DOM is the API**: the page itself is a tree of objects you read and change.')));
    var cards = h('div', { class: 'cards' });
    ORDER.forEach(function (g) {
      var ts = topics().filter(function (t) { return t.group === g; });
      if (!ts.length) return;
      cards.appendChild(h('a', { class: 'card', href: '#/js/' + ts[0].id },
        h('div', { class: 'card-kicker' }, ts.length + ' topics'), h('h3', null, g),
        h('p', { class: 'muted', style: { margin: 0 } }, ts.map(function (t) { return t.title; }).join(' · '))));
    });
    main.appendChild(cards);
  }

  function topicPage(main, t) {
    main.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/js' }, 'JavaScript'), ' › ', t.group));
    var head = h('div', { class: 'page-title' }, h('h1', null, t.title));
    main.appendChild(head);
    main.appendChild(h('div', { class: 'entry-summary', html: U.md(t.summary) }));
    main.appendChild(h('div', { class: 'entry-desc', html: U.md(t.description) }));

    if (t.compare) {
      main.appendChild(h('h2', null, 'Java and JavaScript side by side'));
      var bench = h('div', { class: 'workbench', style: { marginTop: '8px' } },
        U.codeBlock(t.compare.java, 'java', { label: 'Java' }).el,
        U.codeBlock(t.compare.js, 'js', { label: 'JavaScript' }).el);
      main.appendChild(bench);
      U.layout.split(bench, { key: 'js', minLeft: 240, minRight: 240, label: 'Resize the Java and the JavaScript' });
      if (t.compare.note) main.appendChild(h('p', { class: 'muted', html: U.md(t.compare.note) }));
    }

    if (t.api && t.api.length) {
      main.appendChild(h('h2', null, 'What you will use'));
      main.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null, h('th', null, 'Code'), h('th', null, 'What it does'))),
        h('tbody', null, t.api.map(function (a) {
          return h('tr', null, h('td', null, h('code', null, a.name)), h('td', { html: U.md(a.desc).replace(/^<p>|<\/p>$/g, '') }));
        })))));
    }

    if (t.example) {
      main.appendChild(h('h2', null, 'Try it'));
      main.appendChild(h('p', { class: 'muted' }, 'Edit the code; the preview and the console update as you type.'));
      var box = h('div', { style: { maxWidth: '900px' } });
      main.appendChild(box);
      var ws = U.lessonTools.workspace(box, t.example, { modes: ['js', 'html', 'css'], height: 220, previewHeight: 160, title: t.title + ' example' });
      box.appendChild(h('div', { class: 'row', style: { marginTop: '8px' } },
        h('button', { class: 'btn btn-small', type: 'button', onclick: function () { ws.set(t.example); } }, '▶ Reset and run again'),
        h('button', { class: 'btn btn-small', type: 'button', onclick: function () { var s = ws.get(); U.openInPlayground({ title: t.title, html: s.html, css: s.css, js: s.js }); } }, 'Open in Playground')));
    }
    main.appendChild(U.entryFooter(t, 'js', null));
    head.appendChild(U.layout.full(bench || main, { kind: 'ref', root: document.getElementById('view') }).btn);
  }

  U.views.js = {
    render: function (root, params) {
      var t = params[0] && U.find('jsTopics', params[0]);
      var main = h('div', { class: 'ref-main' });
      root.appendChild(h('div', { class: 'ref' },
        U.refSidebar({
          items: topics(),
          groupOf: function (x) { return x.group; },
          order: ORDER,
          label: function (x) { return x.title; },
          href: function (x) { return '#/js/' + x.id; },
          isActive: function (x) { return x === t; },
          match: function (x, q) { return (x.title + ' ' + (x.keywords || []).join(' ') + ' ' + (x.api || []).map(function (a) { return a.name; }).join(' ')).toLowerCase().indexOf(q) >= 0; },
          placeholder: 'Filter topics or methods…',
          toggleLabel: 'Browse all topics',
          ariaLabel: 'JavaScript topics'
        }),
        main));
      if (t) topicPage(main, t); else intro(main);
    }
  };
  U.route('js', U.views.js);
})(window.UILT);
