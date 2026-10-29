/*
 * views/practice.js - Practice (#/practice, #/practice/<id>): katas, small exercises from easy to
 * hard, most of them the patterns interviews ask for. Each one is checked like a lesson's challenge
 * (U.challenge, js/challenge.js). The list filters by level and by pattern; the filter is kept in the
 * address (#/practice?level=Hard&pattern=heapq), so it can be linked. A kata page has the lessons'
 * divider and full screen (js/layout.js).
 *
 * The kata shape is described at the top of data/katas-easy.js.
 * For the tests: PYLT.currentChallenge = {kind: 'kata', id, challenge, editor, check}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var LEVELS = ['Easy', 'Medium', 'Hard'];

  function katas() { return U.data.katas || []; }
  function done() { return U.store.get('practice.done', {}); }
  function markDone(id) { var d = done(); d[id] = new Date().toISOString(); U.store.set('practice.done', d); }
  function patternTitle(id) { var p = U.find('kataPatterns', id); return p ? p.title : id; }

  /* ---------- the list (#/practice) ---------- */

  function list(root, query) {
    var d = done(), all = katas();
    var solved = all.filter(function (k) { return d[k.id]; }).length;
    var state = { level: LEVELS.indexOf(query.level) >= 0 ? query.level : '', pattern: U.find('kataPatterns', query.pattern) ? query.pattern : '' };
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Practice'),
      h('p', null, all.length + ' katas: small exercises from easy to hard, most of them the patterns interviews ask for, such as a dict for ' +
        'lookups, two pointers, a sliding window, a stack, a heap, a breadth-first search and dynamic programming. Each one is checked like a ' +
        'lesson challenge, with hints and a solution. Do them in any order; each says which lesson teaches what it needs.')));
    root.appendChild(h('div', { class: 'card narrow' },
      h('div', { class: 'row' }, h('b', null, solved + ' of ' + all.length + ' katas solved'), h('span', { class: 'spacer' }),
        solved ? h('button', {
          class: 'btn btn-small btn-ghost', type: 'button',
          onclick: function (e) {
            var b = e.currentTarget;
            if (b.getAttribute('data-armed')) { U.store.del('practice.done'); U.render(); }
            else { b.setAttribute('data-armed', '1'); b.textContent = 'Click again to clear the solved marks'; }
          }
        }, 'Reset progress') : null),
      h('div', { class: 'progress', style: { marginTop: '8px' } }, h('span', { style: { width: (all.length ? solved / all.length * 100 : 0) + '%' } }))));

    var levelBox = h('span', { class: 'seg practice-levels', role: 'group', 'aria-label': 'Level' });
    [''].concat(LEVELS).forEach(function (lv) {
      levelBox.appendChild(h('button', { class: 'seg-btn', type: 'button', 'data-level': lv,
        onclick: function () { state.level = lv; apply(); } }, lv || 'Every level'));
    });
    var pick = h('select', { class: 'select', id: 'practice-pattern', 'aria-label': 'Pattern' },
      h('option', { value: '' }, 'Every pattern'),
      (U.data.kataPatterns || []).map(function (p) {
        var n = all.filter(function (k) { return k.patterns.indexOf(p.id) >= 0; }).length;
        return h('option', { value: p.id }, p.title + ' (' + n + ')');
      }));
    pick.value = state.pattern;
    pick.addEventListener('change', function () { state.pattern = pick.value; apply(); });
    root.appendChild(h('div', { class: 'practice-filters' }, levelBox, pick));
    var empty = h('p', { class: 'muted', hidden: true }, 'No kata matches both filters.');
    root.appendChild(empty);

    var rows = [], sections = [], n = 0;
    LEVELS.forEach(function (level) {
      var ks = all.filter(function (k) { return k.level === level; });
      if (!ks.length) return;
      var sec = h('section', { 'data-level': level });
      sections.push(sec);
      root.appendChild(sec);
      sec.appendChild(h('h2', { class: 'level-title' }, level));
      ks.forEach(function (k) {
        n++;
        var row = h('a', { class: 'lesson-row kata-row' + (d[k.id] ? ' done' : ''), href: '#/practice/' + k.id },
          h('span', { class: 'lesson-num', 'aria-label': d[k.id] ? 'solved' : 'kata ' + n }, d[k.id] ? '✓' : String(n)),
          h('span', { class: 'lesson-row-text' }, h('b', null, k.title), h('small', null, k.summary)),
          h('span', { class: 'kata-badges' }, k.patterns.map(function (p) { return h('span', { class: 'badge' }, patternTitle(p)); })));
        sec.appendChild(row);
        rows.push({ el: row, k: k });
      });
    });

    function apply() {
      var shown = 0;
      rows.forEach(function (r) {
        r.el.hidden = (state.level && r.k.level !== state.level) || (state.pattern && r.k.patterns.indexOf(state.pattern) < 0);
        if (!r.el.hidden) shown++;
      });
      sections.forEach(function (s) { s.hidden = !U.$$('a.kata-row', s).some(function (a) { return !a.hidden; }); });
      empty.hidden = shown > 0;
      U.$$('.seg-btn', levelBox).forEach(function (b) {
        var on = b.getAttribute('data-level') === state.level;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var q = [state.level ? 'level=' + state.level : '', state.pattern ? 'pattern=' + state.pattern : ''].filter(Boolean).join('&');
      try { history.replaceState(null, '', '#/practice' + (q ? '?' + q : '')); } catch (e) { /* file:// in an old browser: the filter still works */ }
    }
    apply();
  }

  /* ---------- one kata (#/practice/<id>) ---------- */

  function kataPage(root, k) {
    var all = katas(), idx = all.indexOf(k);
    var prev = all[idx - 1], next = all[idx + 1];
    var allowed = U.run.supports(k);
    var text = h('div', { class: 'lesson-text' });
    var work = h('div', { class: 'lesson-work' });
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/practice' }, 'Practice'), ' › ',
      k.level + ' · kata ' + (idx + 1) + ' of ' + all.length));
    var layout = h('div', { class: 'lesson-layout' }, text, work);
    root.appendChild(layout);
    U.layout.split(layout, { key: 'lesson', def: 49, minLeft: 260, minRight: 380, label: 'Resize the kata and the code' });
    var fs = U.layout.full(layout, { kind: 'work', text: text, work: work });

    text.appendChild(h('h1', null, k.title));
    text.appendChild(h('div', { class: 'kata-meta' },
      h('a', { class: 'badge badge-accent', href: '#/practice?level=' + k.level }, k.level),
      k.patterns.map(function (p) { return h('a', { class: 'badge', href: '#/practice?pattern=' + p }, patternTitle(p)); }),
      done()[k.id] ? h('span', { class: 'badge badge-ok' }, '✓ solved') : null));
    text.appendChild(h('p', { class: 'entry-summary' }, k.summary));
    text.appendChild(h('div', { class: 'task' }, h('div', { class: 'task-title' }, k.title), U.enhance(h('div', { html: U.md(k.task) }))));
    if (k.java) text.appendChild(U.enhance(U.callout('java', 'Coming from Java', U.md(k.java))));
    if ((k.learn || []).length) {
      text.appendChild(h('div', { class: 'row see-also' }, h('span', { class: 'faint' }, 'What it needs is taught in:'),
        k.learn.map(function (r) {
          var m = /^(\w+):(.+)$/.exec(r);
          return h('a', { class: 'btn btn-small', href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
        })));
    }
    text.appendChild(h('div', { class: 'row lesson-nav' },
      prev ? h('a', { class: 'btn', href: '#/practice/' + prev.id }, '← ' + prev.title) : null,
      h('span', { class: 'spacer' }),
      next ? h('a', { class: 'btn btn-primary', href: '#/practice/' + next.id }, next.title + ' →') : h('a', { class: 'btn btn-primary', href: '#/projects' }, 'All katas done? Try a project →')));

    work.appendChild(h('div', { class: 'ed-tabs' }, h('b', null, 'Your solution'), h('span', { class: 'spacer' }), h('span', { class: 'faint' }, 'Ctrl+Enter checks'),
      fs.hideBtn, fs.btn));
    if (!allowed) work.appendChild(U.serverNote('This kata needs Python on your PC', k.runtimeWhy, '#/practice/' + k.id));
    var area = U.challenge(work, {
      challenge: k, storeKey: 'practice.work.' + k.id, showTask: false, allowed: function () { return allowed; },
      extraButtons: [h('button', { class: 'btn btn-small', type: 'button', title: 'Step through your code and see its names and objects',
        onclick: function () { U.openInVisualize({ title: k.title, code: area.editor.get(), stdin: k.stdin || '' }); } }, 'Visualize')],
      onPass: function () {
        markDone(k.id);
        return '🎉 All checks pass - kata solved!' + (next ? ' Next: ' + next.title : '');
      }
    });
    U.currentChallenge = { kind: 'kata', id: k.id, challenge: k, editor: area.editor, check: area.run };
  }

  U.views.practice = {
    render: function (root, params, query) {
      var k = params[0] && U.find('katas', params[0]);
      if (k) kataPage(root, k); else list(root, query || {});
    },
    destroy: function () { U.currentChallenge = null; }
  };
  U.route('practice', U.views.practice);
})(window.PYLT);
