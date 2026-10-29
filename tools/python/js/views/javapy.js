/*
 * views/javapy.js - Java <-> Python (#/java, #/java/<id>): side-by-side translations, grouped by
 * topic (data/javapy.js), with a topic filter and a text filter. Each entry shows the Java, the
 * Python, what the Python prints (proved by the tests), and a note. #/java/<id> scrolls to one
 * entry and highlights it.
 */
(function (U) {
  'use strict';
  var h = U.h;

  function plain(md) {
    return String(md || '').replace(/\[\[\w+:([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, id, l) { return l || id; }).replace(/[`*]/g, '');
  }

  function entryEl(e) {
    var panelHolder = h('div'), panel = null;
    var runnable = e.runs !== false && U.run.supports(e);
    var runBtn = runnable ? h('button', { class: 'btn btn-small', type: 'button' }, '▶ Run') : null;
    var el = h('article', { class: 'jp-entry card', id: 'jp-' + e.id, 'data-id': e.id, 'data-topic': e.topic },
      h('h3', null, h('a', { href: '#/java/' + e.id, class: 'jp-anchor' }, e.title)),
      h('div', { class: 'jp-pair' },
        h('div', { class: 'jp-java' }, U.codeBlock(e.java, e.javaLang === 'text' ? 'text' : 'java', { label: 'Java' }).el),
        h('div', { class: 'jp-python' }, U.codeBlock(e.python, 'python', { label: 'Python', title: 'Java ↔ Python: ' + e.title }).el)),
      e.runs === false ?
        U.enhance(U.callout('warn', 'Not run here', U.md(e.why))) :
        h('div', { class: 'jp-out' },
          h('div', { class: 'row' }, h('span', { class: 'jp-out-label' }, 'The Python prints'), h('span', { class: 'spacer' }), runBtn),
          h('pre', { class: 'code jp-prints' }, e.output), panelHolder),
      U.enhance(h('div', { class: 'jp-note', html: U.md(e.note) })));
    if (runBtn) {
      runBtn.addEventListener('click', function () {
        if (!panel) { panel = U.runPanel({ title: 'Run' }); panelHolder.appendChild(panel.el); }
        runBtn.disabled = true;
        panel.start();
        U.run.exec({ code: e.python, stdin: e.stdin || '' }, panel.append).then(function (res) { panel.show(res); runBtn.disabled = false; });
      });
    }
    return el;
  }

  U.views.javapy = {
    render: function (root, params) {
      var all = U.data.javapy || [], topics = U.data.javapyTopics || [];
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Java ↔ Python'),
        h('p', null, all.length + ' translations of things you write in Java every day, side by side with the Python a Python developer would write. ' +
          'Every Python side runs, and prints exactly what is shown under it. Pick a topic, or filter by a word such as Optional, stream or record.')));
      var active = 'all';
      var buttons = [h('button', { class: 'seg-btn', type: 'button', 'data-topic': 'all' }, 'All')].concat(topics.map(function (t) {
        return h('button', { class: 'seg-btn', type: 'button', 'data-topic': t.id }, t.title);
      }));
      var filter = h('input', { class: 'input jp-filter', id: 'jp-filter', type: 'search', autocomplete: 'off', placeholder: 'Filter: HashMap, stream, record…', 'aria-label': 'Filter the translations' });
      root.appendChild(h('div', { class: 'jp-tools' }, h('div', { class: 'seg jp-topics', role: 'group', 'aria-label': 'Topics' }, buttons), filter));
      var empty = h('p', { class: 'muted', hidden: true });
      root.appendChild(empty);

      var sections = [], rows = [];
      topics.forEach(function (t) {
        var list = all.filter(function (e) { return e.topic === t.id; });
        var section = h('section', { class: 'jp-topic', 'data-topic': t.id }, h('h2', null, t.title));
        list.forEach(function (e) {
          var el = entryEl(e);
          section.appendChild(el);
          rows.push({ el: el, topic: e.topic, hay: (e.title + ' ' + (e.keywords || []).join(' ') + ' ' + e.java + ' ' + e.python + ' ' + plain(e.note)).toLowerCase() });
        });
        sections.push(section);
        root.appendChild(section);
      });
      U.enhance(root);

      function apply() {
        var words = filter.value.trim().toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
        rows.forEach(function (r) {
          var ok = (active === 'all' || r.topic === active) && words.every(function (w) { return r.hay.indexOf(w) >= 0; });
          r.el.hidden = !ok;
          if (ok) shown++;
        });
        sections.forEach(function (s) { s.hidden = !U.$$('.jp-entry', s).some(function (x) { return !x.hidden; }); });
        buttons.forEach(function (b) {
          var on = b.getAttribute('data-topic') === active;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        empty.hidden = shown > 0;
        empty.textContent = 'No translation matches. Clear the filter, or pick "All".';
      }
      buttons.forEach(function (b) { b.addEventListener('click', function () { active = b.getAttribute('data-topic'); apply(); }); });
      filter.addEventListener('input', apply);
      apply();

      if (params[0]) {
        var target = document.getElementById('jp-' + params[0]);
        if (target) {
          target.classList.add('flash');
          setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 0);
        }
      }
    }
  };
  U.route('java', U.views.javapy);
})(window.PYLT);
