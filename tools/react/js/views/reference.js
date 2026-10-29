/*
 * views/reference.js - the Reference (#/reference, #/reference/<name>): every hook and API of the
 * catalogue (data/api.js) on one page, grouped by the track that teaches it, in the course's order.
 *
 * Each entry shows its signature, what it does, the snippet autocomplete inserts, the lesson that
 * teaches it (or the track and batch that will), react.dev, and the interview questions about it (a
 * question whose keywords hold the entry's name). The filter box narrows the list as you type: every
 * word must appear in the name, the module, the kind, the signature or the summary.
 * #/reference/<name> scrolls to that entry and marks it. Ctrl K finds each entry too (js/app.js),
 * and the editor's hover cards link here (js/assist.js).
 */
(function (U) {
  'use strict';
  var h = U.h;

  function plain(md) { return String(md || '').replace(/`/g, '').replace(/\*\*/g, ''); }

  /** The interview questions about an entry: those whose keywords hold its name. */
  function questionsAbout(e) {
    var name = e.name.toLowerCase();
    return (U.data.questions || []).filter(function (q) {
      return (q.keywords || []).some(function (k) { return String(k).toLowerCase() === name; });
    });
  }

  function entryEl(e) {
    var lesson = e.lesson && U.find('lessons', e.lesson);
    var track = U.find('tracks', e.track);
    var qs = questionsAbout(e);
    return h('article', { class: 'card ref-entry', id: 'ref-' + e.id, 'data-id': e.id },
      h('div', { class: 'ref-head' },
        h('h3', { class: 'ref-name' }, e.name),
        h('span', { class: 'ref-kind' }, e.kind + ' · ' + e.module)),
      h('pre', { class: 'code cm-s-rlt ref-sig', 'data-mode': 'jsx' }, e.sig),
      h('div', { class: 'ref-summary', html: U.md(e.summary) }),
      e.snippet ? h('details', { class: 'ref-snippet' }, h('summary', null, 'What autocomplete writes'),
        h('pre', { class: 'code cm-s-rlt', 'data-mode': 'jsx' }, e.snippet.replace('$0', ''))) : null,
      h('div', { class: 'ref-links' },
        lesson ? h('a', { href: U.linkFor('lesson', lesson.id) }, 'Lesson: ' + lesson.title + ' →') :
          h('span', { class: 'faint' }, 'Taught in ' + (track ? track.title + ', batch ' + track.batch : e.track)),
        h('a', { href: e.docs, target: '_blank', rel: 'noopener' }, 'react.dev ↗')),
      qs.length ? h('div', { class: 'ref-questions faint' }, 'Interview: ', qs.map(function (q, i) {
        return [i ? ' · ' : '', h('a', { href: '#/interview/' + q.id }, q.q)];
      })) : null);
  }

  function page(root, focus) {
    var all = U.data.api || [];
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Reference: hooks and APIs'),
      h('p', null, 'Every hook and API the editor knows, ' + all.length + ' in all, grouped by the track that teaches it: its signature, what it does, ' +
        'the lesson, react.dev, and the interview questions about it. In any editor, hover a name for the same card; Ctrl K finds them from anywhere.')));
    var input = h('input', { class: 'input', id: 'ref-filter', type: 'search', autocomplete: 'off', spellcheck: 'false',
      placeholder: 'Filter: a name, or what it does (effect, ref, form…)', 'aria-label': 'Filter the reference' });
    var count = h('span', { class: 'faint ref-count', 'aria-live': 'polite' });
    var empty = h('p', { class: 'muted ref-empty', hidden: true }, 'Nothing matches. Try a shorter word, or Ctrl K to search lessons and questions too.');
    root.appendChild(h('div', { class: 'ref-bar' }, input, count));
    root.appendChild(empty);

    var groups = [];
    (U.data.tracks || []).forEach(function (t) {
      var es = all.filter(function (e) { return e.track === t.id; });
      if (!es.length) return;
      var sec = h('section', { class: 'ref-group', 'data-track': t.id },
        h('h2', { class: 'level-title' }, t.title, h('span', { class: 'faint ref-group-n' }, ' · ' + es.length)),
        h('div', { class: 'ref-list' }, es.map(entryEl)));
      groups.push(sec);
      root.appendChild(sec);
    });
    U.enhance(root);

    function apply() {
      var words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean), shown = 0;
      U.$$('.ref-entry', root).forEach(function (el) {
        var e = U.find('api', el.getAttribute('data-id'));
        var hay = [e.name, e.module, e.kind, e.sig, plain(e.summary)].join(' ').toLowerCase();
        var ok = words.every(function (w) { return hay.indexOf(w) >= 0; });
        el.hidden = !ok;
        if (ok) shown++;
      });
      groups.forEach(function (g) { g.hidden = !U.$$('.ref-entry', g).some(function (el) { return !el.hidden; }); });
      empty.hidden = shown > 0;
      count.textContent = words.length ? shown + ' of ' + all.length : '';
    }
    input.addEventListener('input', apply);

    var target = focus ? U.$$('.ref-entry', root).filter(function (el) { return el.getAttribute('data-id') === focus; })[0] : null;
    if (target) {
      target.classList.add('ref-on');
      setTimeout(function () { target.scrollIntoView({ block: 'center' }); }, 0);   // after the router's scroll to the top
    }
  }

  U.views.reference = { render: function (root, params) { page(root, params[0] || ''); } };
  U.route('reference', U.views.reference);
})(window.RLT);
