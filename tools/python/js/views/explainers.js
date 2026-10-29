/*
 * views/explainers.js - the explainers (#/explain, #/explain/<id>): each one answers a hard question
 * by running real Python as you click. The content, every experiment and every variant of it, is in
 * data/explainers.js.
 *
 * An experiment has controls (a row of choices, or a "stepper" such as next(g) that moves through
 * its options in order). Every change picks the variant for the controls' values and runs its code:
 * view "trace" through PYLT.run.trace, drawn with Visualize's picture (U.viz) and starting at the
 * variant's `at` step; view "run" through PYLT.run.exec, shown as the code and what it printed. The
 * variant's note explains what happened. Runs go through the runtime's queue one at a time; a result
 * that arrives after the controls changed again is dropped. An experiment with runtimes: ['server']
 * (threads, processes) runs nothing in the in-browser Python: it shows its code and a note saying
 * how to start pylearn (data-state "needs-server").
 *
 * Each two-column block (code and what it printed, or the Visualize picture) has a divider; the ones
 * of a kind move together. Full screen puts the whole page across the window (js/layout.js).
 *
 * For the tests: PYLT.explain.last(experimentId) is {when, output} for the last result shown, where
 * output includes the error's traceback, as the page shows it.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var results = {};

  function same(a, b) {
    var ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(function (k) { return a[k] === b[k]; });
  }

  function matchStep(at) {
    if (!at) return null;
    return function (step) {
      var top = step.stack[step.stack.length - 1];
      var name = top ? top.name.replace(/^.*<locals>\./, '') : '';
      return (!at.event || step.event === at.event) && (!at.func || name === at.func) && (!at.line || step.line === at.line);
    };
  }

  function experiment(root, x, e) {
    var values = {};
    (e.controls || []).forEach(function (c) { values[c.id] = c.options[0].value; });
    var box = h('section', { class: 'exp card', 'data-exp': e.id, 'data-state': 'idle' });
    root.appendChild(box);
    box.appendChild(h('h2', null, e.title));
    box.appendChild(U.enhance(h('div', { class: 'exp-text', html: U.md(e.text) })));

    var controls = h('div', { class: 'exp-controls' });
    box.appendChild(controls);
    var syncs = [];
    (e.controls || []).forEach(function (c) {
      var wrap = h('div', { class: 'exp-control', 'data-control': c.id }, h('span', { class: 'exp-label' }, c.label));
      if (c.kind === 'stepper') {
        var current = h('span', { class: 'exp-step-label', 'aria-live': 'polite' });
        var nextBtn = h('button', { class: 'btn btn-primary btn-small exp-next', type: 'button' }, (c.button || 'next(g)') + ' ▶');
        var resetBtn = h('button', { class: 'btn btn-small exp-reset', type: 'button' }, 'Start over');
        var index = function () { return c.options.map(function (o) { return o.value; }).indexOf(values[c.id]); };
        nextBtn.addEventListener('click', function () {
          var i = index();
          if (i < c.options.length - 1) { values[c.id] = c.options[i + 1].value; changed(); }
        });
        resetBtn.addEventListener('click', function () { values[c.id] = c.options[0].value; changed(); });
        wrap.appendChild(h('span', { class: 'row' }, nextBtn, resetBtn, current));
        syncs.push(function () {
          var i = index();
          current.textContent = c.options[i].label;
          nextBtn.disabled = i >= c.options.length - 1;
          resetBtn.disabled = i === 0;
        });
      } else {
        var group = h('span', { class: 'seg', role: 'group', 'aria-label': c.label });
        c.options.forEach(function (o) {
          group.appendChild(h('button', { class: 'seg-btn', type: 'button', 'data-value': o.value, html: U.mdInline(o.label),
            onclick: function () { if (values[c.id] !== o.value) { values[c.id] = o.value; changed(); } } }));
        });
        wrap.appendChild(group);
        syncs.push(function () {
          U.$$('.seg-btn', group).forEach(function (b) {
            var on = b.getAttribute('data-value') === values[c.id];
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        });
      }
      controls.appendChild(wrap);
    });

    var stage = h('div', { class: 'exp-stage' });
    var noteBox = h('div', { class: 'exp-note', 'aria-live': 'polite' });
    var links = h('div', { class: 'row exp-links' });
    var allowed = U.run.supports(e);
    if (!allowed) box.appendChild(U.serverNote('This experiment needs Python on your PC', e.runtimeWhy, '#/explain/' + x.id));
    box.appendChild(stage);
    box.appendChild(noteBox);
    box.appendChild(links);

    var viz = null, panel = null, codeHolder = null;
    if (!allowed) {
      codeHolder = h('div', { class: 'exp-code' });
      stage.appendChild(codeHolder);
    } else if (e.view === 'trace') {
      viz = U.viz.create(stage);
    } else {
      codeHolder = h('div', { class: 'exp-code' });
      panel = U.runPanel({ title: 'What it printed', emptyText: 'Running…' });
      var runBox = h('div', { class: 'exp-run' }, codeHolder, panel.el);
      stage.appendChild(runBox);
      U.layout.split(runBox, { key: 'explain', def: 50, minLeft: 260, minRight: 260, label: 'Resize the code and what it printed' });
    }

    var seq = 0;
    function changed() {
      syncs.forEach(function (s) { s(); });
      var when = Object.assign({}, values);
      var v = e.variants.filter(function (x) { return same(x.when, when); })[0];
      if (!v) return;
      var mine = ++seq;
      box.setAttribute('data-state', 'running');
      noteBox.innerHTML = '';
      links.innerHTML = '';
      links.appendChild(h('button', { class: 'btn btn-small', type: 'button', onclick: function () { U.openInPlayground({ title: x.title + ': ' + e.title, code: v.code, stdin: v.stdin }); } }, 'Open in Playground'));
      links.appendChild(h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: function () { U.openInVisualize({ title: x.title + ': ' + e.title, code: v.code, stdin: v.stdin }); } }, 'Open in Visualize'));
      if (!allowed) {
        codeHolder.innerHTML = '';
        codeHolder.appendChild(U.codeBlock(v.code, 'python', { title: x.title + ': ' + e.title, playground: false }).el);
        box.setAttribute('data-state', 'needs-server');
        return;
      }
      var job;
      if (viz) {
        viz.setRunning();
        job = U.run.trace({ code: v.code, stdin: v.stdin || '' });
      } else {
        codeHolder.innerHTML = '';
        codeHolder.appendChild(U.codeBlock(v.code, 'python', { title: x.title + ': ' + e.title, playground: false }).el);
        panel.start();
        job = U.run.exec({ code: v.code, stdin: v.stdin || '' });
      }
      job.then(function (res) {
        if (mine !== seq || !box.isConnected) return;
        if (viz) viz.show(res, v.code, { at: matchStep(v.at) });
        else panel.show(res);
        if (v.note) noteBox.appendChild(U.enhance(U.callout('info', 'What happened', U.md(v.note))));
        results[e.id] = { when: when, output: (res.output || '') + (res.error ? '\n' + (res.error.traceback || res.error.message || '') : '') };
        box.setAttribute('data-state', 'done');
      });
    }
    changed();
    return { destroy: function () { if (viz) viz.destroy(); } };
  }

  function index(root) {
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Explainers'),
      h('p', null, 'Each explainer takes one idea that is hard to see in code and shows it happening. Every experiment runs real Python as you click, ' +
        'and the pictures are drawn from what Python actually did, never from a description of it.')));
    var cards = h('div', { class: 'cards' });
    (U.data.explainers || []).forEach(function (x) {
      cards.appendChild(h('a', { class: 'card', href: '#/explain/' + x.id },
        h('div', { class: 'card-kicker' }, U.plural(x.experiments.length, 'experiment', 'experiments') +
          (x.experiments.some(function (e) { return e.runtimes && e.runtimes.indexOf('browser') < 0; }) ? ' · some need your PC' : '')),
        h('h3', null, x.title), h('p', { class: 'muted', style: { margin: 0 } }, x.summary)));
    });
    root.appendChild(cards);
  }

  var live = [];
  U.views.explainers = {
    render: function (root, params) {
      var x = params[0] && U.find('explainers', params[0]);
      if (!x) { index(root); return; }
      root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/explain' }, 'Explainers'), ' › ', x.title));
      root.appendChild(h('div', { class: 'page-head' },
        h('div', { class: 'head-row' }, h('h1', null, x.title), U.layout.full(root, { kind: 'explain', root: root }).btn),
        U.enhance(h('div', { class: 'exp-intro', html: U.md(x.intro) }))));
      var list = h('div', { class: 'exp-list' });
      root.appendChild(list);
      live = x.experiments.map(function (e) { return experiment(list, x, e); });
      var others = (U.data.explainers || []).filter(function (o) { return o.id !== x.id; });
      root.appendChild(h('div', { class: 'row lesson-nav' }, h('span', { class: 'faint' }, 'More explainers:'),
        others.map(function (o) { return h('a', { class: 'btn btn-small', href: '#/explain/' + o.id }, o.title); })));
    },
    destroy: function () {
      live.forEach(function (l) { l.destroy(); });
      live = [];
    }
  };
  U.route('explain', U.views.explainers);
  U.explain = { last: function (id) { return results[id] || null; } };
})(window.PYLT);
