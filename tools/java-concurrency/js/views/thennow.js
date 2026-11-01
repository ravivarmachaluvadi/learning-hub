/*
 * views/thennow.js - Then <-> now (#/then-now, #/then-now/<id>, batch 3): the way concurrent Java was
 * written before Java 21, next to the way Java 21 to 25 lets you write it, grouped by topic
 * (data/thennow.js), with a topic filter and a text filter. The Kotlin tool's Kotlin <-> Java page, for
 * old Java and new Java.
 *
 * Each pair shows two whole programs (the old one a class Main in the Java 8 style, the new one a Java 25
 * compact source file), what both print (stored in the data; tests/test_content.py runs both sides on
 * this PC's JDK 25 and each must print exactly that), the release the new side needs (and whether it uses
 * a preview API), and a note. Served by jclearn, each side has a Run button; opened from disk, the page
 * says how to start jclearn. #/then-now/<id> scrolls to one pair and highlights it.
 */
(function (U) {
  'use strict';
  var h = U.h;

  function plain(md) {
    return String(md || '').replace(/\[\[\w+:([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, id, l) { return l || id; }).replace(/[`*]/g, '');
  }

  function sinceLabel(p) {
    return 'The new way needs Java ' + p.since + (p.preview ? ' (a preview API: --enable-preview)' : '');
  }

  function entryEl(p) {
    var panelHolder = h('div', { class: 'tn-run' }), panel = null, running = false;
    var runThen = h('button', { class: 'btn btn-small tn-run-then', type: 'button' }, '▶ Run the old way');
    var runNow = h('button', { class: 'btn btn-small btn-primary tn-run-now', type: 'button' }, '▶ Run the new way');
    var el = h('article', { class: 'tn-entry card', id: 'tn-' + p.id, 'data-id': p.id, 'data-topic': p.topic },
      h('h3', null, h('a', { href: '#/then-now/' + p.id, class: 'tn-anchor' }, p.title)),
      h('p', { class: 'tn-since faint' }, sinceLabel(p), p.preview ? h('span', { class: 'badge badge-warn', style: { marginLeft: '6px' } }, 'preview') : null),
      h('div', { class: 'tn-pair' },
        h('div', { class: 'tn-then' }, U.codeBlock(p.then, 'java', { label: 'Before Java 21', title: 'Then: ' + p.title }).el),
        h('div', { class: 'tn-now' }, U.codeBlock(p.now, 'java', { label: 'Java ' + p.since + (p.preview ? ' (preview)' : ''), title: 'Now: ' + p.title }).el)),
      h('div', { class: 'tn-out' },
        h('div', { class: 'row' }, h('span', { class: 'tn-out-label' }, 'Both print'), h('span', { class: 'spacer' }), runThen, runNow),
        h('pre', { class: 'code tn-prints' }, p.output), panelHolder),
      U.enhance(h('div', { class: 'tn-note', html: U.md(p.note) })));
    function run(side) {
      if (running) return;
      running = true;
      if (panel) panel.el.remove();
      panel = U.runPanel({ title: side === 'then' ? 'The old way, run on your JDK' : 'The new way, run on your JDK' });
      panelHolder.appendChild(panel.el);
      runThen.disabled = runNow.disabled = true;
      panel.start();
      U.run.exec({ code: side === 'then' ? p.then : p.now, stdin: p.stdin || '' }, panel.append).then(function (res) {
        panel.show(res);
        running = false;
        runThen.disabled = runNow.disabled = false;
      });
    }
    runThen.addEventListener('click', function () { run('then'); });
    runNow.addEventListener('click', function () { run('now'); });
    return el;
  }

  U.views.thennow = {
    render: function (root, params) {
      var all = U.data.thenNow || [], topics = U.data.thenNowTopics || [];
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Then ↔ now'),
        h('p', null, all.length + ' things concurrent Java code does, each written the way it was before Java 21 and the way Java 21 to 25 lets you write it. ' +
          'Both sides are whole programs and print the same: the tests run both on your JDK 25. ' +
          'Pick a topic, or filter by a word such as executor, timeout, ThreadLocal or lazy.')));
      var active = 'all';
      var buttons = [h('button', { class: 'seg-btn', type: 'button', 'data-topic': 'all' }, 'All')].concat(topics.map(function (t) {
        return h('button', { class: 'seg-btn', type: 'button', 'data-topic': t.id }, t.title);
      }));
      var filter = h('input', { class: 'input tn-filter', id: 'tn-filter', type: 'search', autocomplete: 'off', placeholder: 'Filter: executor, timeout, ThreadLocal, lazy…', 'aria-label': 'Filter the pairs' });
      root.appendChild(h('div', { class: 'tn-tools' }, h('div', { class: 'seg tn-topics', role: 'group', 'aria-label': 'Topics' }, buttons), filter));
      var note = h('div');
      root.appendChild(note);
      U.run.ready().then(function () { if (!U.run.available() && note.isConnected) note.appendChild(U.serverNote('#/then-now')); });
      var empty = h('p', { class: 'muted tn-empty', hidden: true }, 'No pair matches. Clear the filter, or pick "All".');
      root.appendChild(empty);

      var sections = [], rows = [];
      topics.forEach(function (t) {
        var list = all.filter(function (p) { return p.topic === t.id; });
        var section = h('section', { class: 'tn-topic', 'data-topic': t.id }, h('h2', null, t.title));
        list.forEach(function (p) {
          var el = entryEl(p);
          section.appendChild(el);
          rows.push({ el: el, topic: p.topic, hay: (p.title + ' ' + (p.keywords || []).join(' ') + ' ' + p.then + ' ' + p.now + ' ' + plain(p.note)).toLowerCase() });
        });
        sections.push(section);
        root.appendChild(section);
      });

      function apply() {
        var words = filter.value.trim().toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
        rows.forEach(function (r) {
          var ok = (active === 'all' || r.topic === active) && words.every(function (w) { return r.hay.indexOf(w) >= 0; });
          r.el.hidden = !ok;
          if (ok) shown++;
        });
        sections.forEach(function (s) { s.hidden = !U.$$('.tn-entry', s).some(function (x) { return !x.hidden; }); });
        buttons.forEach(function (b) {
          var on = b.getAttribute('data-topic') === active;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        empty.hidden = shown > 0;
      }
      buttons.forEach(function (b) { b.addEventListener('click', function () { active = b.getAttribute('data-topic'); apply(); }); });
      filter.addEventListener('input', apply);
      apply();

      if (params[0]) {
        var target = document.getElementById('tn-' + params[0]);
        if (target) {
          target.classList.add('flash');
          setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 0);
        }
      }
    }
  };
  U.route('then-now', U.views.thennow);
})(window.JCLT);
