/*
 * views/practice.js - Practice (#/practice, #/practice/<id>): the katas, small checked exercises from easy
 * to hard. The Python Learning Tool's practice page, for Kotlin, with a second kind of kata:
 *
 *   pattern   an interview pattern (a map of what was seen, two pointers, a sliding window, a heap, a
 *             breadth-first search, dynamic programming…) written the Kotlin way
 *   rewrite   a Java program to turn into idiomatic Kotlin. The Java original is shown read-only, with a
 *             Run of its own (on the JDK, through ktlearn); the starter is the same program written in
 *             Kotlin the way a Java developer writes it first: it works, so it passes every behaviour
 *             check, and fails the idiom checks, which read the code (`idiom: true` on a check)
 *
 * Each kata is checked like a lesson's challenge (U.challenge, js/challenge.js). The list filters by level,
 * kind and pattern; the filters are kept in the address (#/practice?level=Hard&kind=rewrite&pattern=dp), so
 * a filtered list can be linked. A kata page has the lessons' divider and full screen (js/layout.js).
 * Solved katas are kept in "klt.practice.done" as {id: when}; your code for each in "klt.practice.work.<id>".
 * Lessons list the katas that link them (U.katasFor, "Practise it" in views/lessons.js).
 *
 * The kata shape is described at the top of data/katas-easy.js.
 * For the tests: KLT.currentChallenge = {kind: 'kata', id, challenge, editor, check}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var LEVELS = ['Easy', 'Medium', 'Hard'];
  var KINDS = { pattern: 'Interview pattern', rewrite: 'Java to idiomatic Kotlin' };

  function katas() { return U.data.katas || []; }
  function done() { return U.store.get('practice.done', {}); }
  function markDone(id) { var d = done(); d[id] = new Date().toISOString(); U.store.set('practice.done', d); }
  function patternTitle(id) { var p = U.find('kataPatterns', id); return p ? p.title : id; }

  /** The katas whose `learn` links this lesson, in their order (Easy first). */
  U.katasFor = function (lessonId) {
    return katas().filter(function (k) { return (k.learn || []).indexOf('lesson:' + lessonId) >= 0; });
  };

  /** A kata as a row of a list: its number or ✓, its title and summary, and badges (its level when
   *  showLevel, "Java → Kotlin" for a rewrite, its patterns). */
  U.kataRow = function (k, n, showLevel) {
    var solved = !!done()[k.id];
    return h('a', { class: 'lesson-row kata-row' + (solved ? ' done' : ''), href: '#/practice/' + k.id, 'data-id': k.id },
      h('span', { class: 'lesson-num', 'aria-label': solved ? 'solved' : 'kata ' + n }, solved ? '✓' : String(n)),
      h('span', { class: 'lesson-row-text' }, h('b', null, k.title), h('small', null, k.summary)),
      h('span', { class: 'kata-badges' },
        showLevel ? h('span', { class: 'badge' }, k.level) : null,
        k.kind === 'rewrite' ? h('span', { class: 'badge badge-accent' }, 'Java → Kotlin') : null,
        k.patterns.slice(0, 2).map(function (p) { return h('span', { class: 'badge' }, patternTitle(p)); })));
  };

  /* ---------- the list (#/practice) ---------- */

  function list(root, query) {
    var d = done(), all = katas();
    var solved = all.filter(function (k) { return d[k.id]; }).length;
    var state = {
      level: LEVELS.indexOf(query.level) >= 0 ? query.level : '',
      kind: KINDS[query.kind] ? query.kind : '',
      pattern: U.find('kataPatterns', query.pattern) ? query.pattern : ''
    };
    var rewrites = all.filter(function (k) { return k.kind === 'rewrite'; }).length;
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Practice'),
      h('p', null, all.length + ' katas, from easy to hard, each checked like a lesson\'s challenge, with hints and a solution. ' +
        (all.length - rewrites) + ' are the patterns interviews ask for (a map of what was seen, two pointers, a sliding window, a stack, a heap, ' +
        'a breadth-first search, dynamic programming, coroutines and flows), written the Kotlin way. ' + rewrites + ' are rewrites: a Java program, ' +
        'already working in Java-shaped Kotlin, to turn into idiomatic Kotlin. Do them in any order; each says which lessons teach what it needs.')));
    root.appendChild(h('div', { class: 'card narrow' },
      h('div', { class: 'row' }, h('b', { class: 'practice-progress' }, solved + ' of ' + all.length + ' katas solved'), h('span', { class: 'spacer' }),
        solved ? h('button', {
          class: 'btn btn-small btn-ghost', type: 'button',
          onclick: function (e) {
            var b = e.currentTarget;
            if (b.getAttribute('data-armed')) { U.store.del('practice.done'); U.render(); }
            else { b.setAttribute('data-armed', '1'); b.textContent = 'Click again to clear the solved marks'; }
          }
        }, 'Reset progress') : null),
      h('div', { class: 'progress', style: { marginTop: '8px' } }, h('span', { style: { width: (all.length ? solved / all.length * 100 : 0) + '%' } }))));
    root.appendChild(h('div', { class: 'card narrow predict-card', style: { marginTop: '12px' } },
      h('div', { class: 'row' },
        h('span', null, h('b', null, 'Predict the output: '), 'short programs built around the traps a Java developer falls into. Read, write what each prints, see why.'),
        h('span', { class: 'spacer' }),
        h('a', { class: 'btn', id: 'practice-predict', href: '#/predict' }, 'Play a round →'))));

    var levelBox = h('span', { class: 'seg practice-levels', role: 'group', 'aria-label': 'Level' });
    [''].concat(LEVELS).forEach(function (lv) {
      levelBox.appendChild(h('button', { class: 'seg-btn', type: 'button', 'data-level': lv, onclick: function () { state.level = lv; apply(); } }, lv || 'Every level'));
    });
    var kindBox = h('span', { class: 'seg practice-kinds', role: 'group', 'aria-label': 'Kind' });
    [['', 'Both kinds'], ['pattern', 'Interview patterns'], ['rewrite', 'Java to idiomatic Kotlin']].forEach(function (x) {
      kindBox.appendChild(h('button', { class: 'seg-btn', type: 'button', 'data-kind': x[0], onclick: function () { state.kind = x[0]; apply(); } }, x[1]));
    });
    var pick = h('select', { class: 'select', id: 'practice-pattern', 'aria-label': 'Pattern' },
      h('option', { value: '' }, 'Every pattern'),
      (U.data.kataPatterns || []).map(function (p) {
        var n = all.filter(function (k) { return k.patterns.indexOf(p.id) >= 0; }).length;
        return h('option', { value: p.id }, p.title + ' (' + n + ')');
      }));
    pick.value = state.pattern;
    pick.addEventListener('change', function () { state.pattern = pick.value; apply(); });
    root.appendChild(h('div', { class: 'practice-filters' }, levelBox, kindBox, pick));
    var empty = h('p', { class: 'muted practice-empty', hidden: true }, 'No kata matches these filters.');
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
        var row = U.kataRow(k, ++n);
        sec.appendChild(row);
        rows.push({ el: row, k: k });
      });
    });

    function address() {   // the filters, as the address keeps them
      var q = [state.level ? 'level=' + state.level : '', state.kind ? 'kind=' + state.kind : '', state.pattern ? 'pattern=' + state.pattern : ''].filter(Boolean).join('&');
      return q ? '?' + q : '';
    }
    function apply() {
      var shown = 0;
      rows.forEach(function (r) {
        r.el.hidden = (state.level && r.k.level !== state.level) || (state.kind && r.k.kind !== state.kind) ||
          (state.pattern && r.k.patterns.indexOf(state.pattern) < 0);
        if (!r.el.hidden) shown++;
      });
      sections.forEach(function (s) { s.hidden = !U.$$('a.kata-row', s).some(function (a) { return !a.hidden; }); });
      empty.hidden = shown > 0;
      [[levelBox, 'data-level', state.level], [kindBox, 'data-kind', state.kind]].forEach(function (x) {
        U.$$('.seg-btn', x[0]).forEach(function (b) {
          var on = b.getAttribute(x[1]) === x[2];
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
      pick.value = state.pattern;
      try { history.replaceState(null, '', '#/practice' + address()); } catch (e) { /* the filter still works */ }
    }
    apply();
  }

  /* ---------- one kata (#/practice/<id>) ---------- */

  /** The Java original of a rewrite: read-only, with its own Run (the JDK, through ktlearn). */
  function originalBox(k) {
    var holder = h('div'), panel = null, running = false;
    var run = h('button', { class: 'btn btn-small kata-original-run', type: 'button' }, '▶ Run the Java');
    run.addEventListener('click', function () {
      if (running) return;
      running = true;
      if (panel) panel.el.remove();
      panel = U.runPanel({ title: 'The Java original, run on your JDK' });
      holder.appendChild(panel.el);
      run.disabled = true;
      panel.start();
      U.run.exec({ code: k.original, stdin: k.stdin || '', lang: 'java' }, panel.append).then(function (res) {
        panel.show(res);
        running = false;
        run.disabled = false;
      });
    });
    return h('details', { class: 'kata-original', open: true },
      h('summary', null, 'The Java original (read only)'),
      U.codeBlock(k.original, 'java', { label: 'Main.java' }).el,
      h('div', { class: 'row', style: { marginTop: '6px' } }, h('span', { class: 'faint' }, 'Your Kotlin must print what this prints.'), h('span', { class: 'spacer' }), run),
      holder);
  }

  U.kataOriginal = originalBox;   // the mock interview's kata round shows it too

  function kataPage(root, k) {
    var all = katas(), idx = all.indexOf(k);
    var prev = all[idx - 1], next = all[idx + 1];
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
      h('a', { class: 'badge' + (k.kind === 'rewrite' ? ' badge-accent' : ''), href: '#/practice?kind=' + k.kind }, KINDS[k.kind] || k.kind),
      k.patterns.map(function (p) { return h('a', { class: 'badge', href: '#/practice?pattern=' + p }, patternTitle(p)); }),
      done()[k.id] ? h('span', { class: 'badge badge-ok' }, '✓ solved') : null));
    text.appendChild(h('p', { class: 'entry-summary' }, k.summary));
    text.appendChild(h('div', { class: 'task' }, h('div', { class: 'task-title' }, k.title), U.enhance(h('div', { html: U.md(k.task) }))));
    if (k.original) text.appendChild(U.enhance(originalBox(k)));
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
      next ? h('a', { class: 'btn btn-primary', href: '#/practice/' + next.id }, next.title + ' →') :
        h('a', { class: 'btn btn-primary', href: '#/mock' }, 'All katas done? Try a mock interview →')));

    work.appendChild(h('div', { class: 'ed-tabs' }, h('b', null, 'Your solution'), h('span', { class: 'spacer' }), h('span', { class: 'faint' }, 'Ctrl+Enter checks'),
      fs.hideBtn, fs.btn));
    var note = h('div');
    work.appendChild(note);
    U.run.ready().then(function () { if (!U.run.available() && note.isConnected) note.appendChild(U.serverNote('#/practice/' + k.id)); });
    var area = U.challenge(work, {
      challenge: k, storeKey: 'practice.work.' + k.id, showTask: false,
      extraButtons: [h('button', { class: 'btn btn-small', type: 'button',
        onclick: function () { U.openInPlayground({ title: k.title, code: area.editor.get(), stdin: k.stdin || '' }); } }, 'Open in Playground')],
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
})(window.KLT);
