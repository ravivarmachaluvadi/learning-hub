/*
 * views/javakt.js - Kotlin <-> Java (#/java, #/java/<id>): what you write in Java every day, next to the
 * Kotlin for it, grouped by topic (data/javakt.js), with a topic filter and a text filter. The Python
 * Learning Tool's Java <-> Python page, with both sides runnable.
 *
 * Each translation shows a whole Java program, a whole Kotlin program, what both print (stored in the
 * data; tests/test_content.py runs both sides, the Java one on this PC's JDK, and each must print exactly
 * that), and a note. Served by ktlearn, each side has a Run button; opened from disk, Run says how to
 * start ktlearn. #/java/<id> scrolls to one translation and highlights it.
 */
(function (U) {
  'use strict';
  var h = U.h;

  function plain(md) {
    return String(md || '').replace(/\[\[\w+:([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, id, l) { return l || id; }).replace(/[`*]/g, '');
  }

  function entryEl(e) {
    var panelHolder = h('div', { class: 'jk-run' }), panel = null, running = false;
    var runKt = h('button', { class: 'btn btn-small btn-primary jk-run-kotlin', type: 'button' }, '▶ Run the Kotlin');
    var runJava = h('button', { class: 'btn btn-small jk-run-java', type: 'button' }, '▶ Run the Java');
    var el = h('article', { class: 'jk-entry card', id: 'jk-' + e.id, 'data-id': e.id, 'data-topic': e.topic },
      h('h3', null, h('a', { href: '#/java/' + e.id, class: 'jk-anchor' }, e.title)),
      h('div', { class: 'jk-pair' },
        h('div', { class: 'jk-java' }, U.codeBlock(e.java, 'java', { label: 'Java' }).el),
        h('div', { class: 'jk-kotlin' }, U.codeBlock(e.kotlin, 'kotlin', { label: 'Kotlin', title: 'Kotlin ↔ Java: ' + e.title }).el)),
      h('div', { class: 'jk-out' },
        h('div', { class: 'row' }, h('span', { class: 'jk-out-label' }, 'Both print'), h('span', { class: 'spacer' }), runKt, runJava),
        h('pre', { class: 'code jk-prints' }, e.output), panelHolder),
      U.enhance(h('div', { class: 'jk-note', html: U.md(e.note) })));
    function run(lang) {
      if (running) return;
      running = true;
      if (panel) panel.el.remove();
      panel = U.runPanel({ title: lang === 'java' ? 'The Java, run on your JDK' : 'The Kotlin, compiled by your kotlinc' });
      panelHolder.appendChild(panel.el);
      runKt.disabled = runJava.disabled = true;
      panel.start();
      U.run.exec({ code: lang === 'java' ? e.java : e.kotlin, stdin: e.stdin || '', lang: lang }, panel.append).then(function (res) {
        panel.show(res);
        running = false;
        runKt.disabled = runJava.disabled = false;
      });
    }
    runKt.addEventListener('click', function () { run('kotlin'); });
    runJava.addEventListener('click', function () { run('java'); });
    return el;
  }

  U.views.javakt = {
    render: function (root, params) {
      var all = U.data.javakt || [], topics = U.data.javaktTopics || [];
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Kotlin ↔ Java'),
        h('p', null, all.length + ' things you write in Java every day, each next to the Kotlin a Kotlin developer would write. ' +
          'Both sides are whole programs and print the same: the tests run the Kotlin on your kotlinc and the Java on your JDK. ' +
          'Pick a topic, or filter by a word such as Optional, stream, record or static.')));
      var active = 'all';
      var buttons = [h('button', { class: 'seg-btn', type: 'button', 'data-topic': 'all' }, 'All')].concat(topics.map(function (t) {
        return h('button', { class: 'seg-btn', type: 'button', 'data-topic': t.id }, t.title);
      }));
      var filter = h('input', { class: 'input jk-filter', id: 'jk-filter', type: 'search', autocomplete: 'off', placeholder: 'Filter: Optional, stream, record, static…', 'aria-label': 'Filter the translations' });
      root.appendChild(h('div', { class: 'jk-tools' }, h('div', { class: 'seg jk-topics', role: 'group', 'aria-label': 'Topics' }, buttons), filter));
      var note = h('div');
      root.appendChild(note);
      U.run.ready().then(function () { if (!U.run.available() && note.isConnected) note.appendChild(U.serverNote('#/java')); });
      var empty = h('p', { class: 'muted jk-empty', hidden: true }, 'No translation matches. Clear the filter, or pick "All".');
      root.appendChild(empty);

      var sections = [], rows = [];
      topics.forEach(function (t) {
        var list = all.filter(function (e) { return e.topic === t.id; });
        var section = h('section', { class: 'jk-topic', 'data-topic': t.id }, h('h2', null, t.title));
        list.forEach(function (e) {
          var el = entryEl(e);
          section.appendChild(el);
          rows.push({ el: el, topic: e.topic, hay: (e.title + ' ' + (e.keywords || []).join(' ') + ' ' + e.java + ' ' + e.kotlin + ' ' + plain(e.note)).toLowerCase() });
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
        sections.forEach(function (s) { s.hidden = !U.$$('.jk-entry', s).some(function (x) { return !x.hidden; }); });
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
        var target = document.getElementById('jk-' + params[0]);
        if (target) {
          target.classList.add('flash');
          setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 0);
        }
      }
    }
  };
  U.route('java', U.views.javakt);
})(window.KLT);
