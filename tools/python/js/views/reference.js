/*
 * views/reference.js - the Reference (#/reference, #/reference/<id>).
 *
 * The index lists every entry, grouped (built-in functions, constants, the methods of str, list,
 * dict, set and tuple, keywords, operators, special methods, exceptions, modules), with a filter.
 * An entry's page shows its signature, what it does, its Java equivalent, an example with what it
 * prints (stored in data/reference-*.js and proved by the tests), a Run button that runs the example
 * on the Python in use, and the other entries of its group. Editors link here from their hover tips.
 */
(function (U) {
  'use strict';
  var h = U.h;

  function entries() { return U.data.reference || []; }
  function groups() { return U.data.refGroups || []; }
  function inGroup(id) { return entries().filter(function (e) { return e.group === id; }); }

  function plain(md) {
    return String(md || '').replace(/\[\[\w+:([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, id, l) { return l || id; }).replace(/[`*]/g, '');
  }
  function short(md) {
    var t = plain(md), cut = t.search(/[.:;](\s|$)/);
    if (cut > 0) t = t.slice(0, cut);
    return t.length > 90 ? t.slice(0, 89) + '…' : t;
  }

  /** Where the official documentation of an entry is. */
  function docsFor(e) {
    if (e.docs) return e.docs;
    var base = 'https://docs.python.org/3/', g = e.group;
    if (g === 'functions') return base + 'library/functions.html#' + e.name;
    if (g === 'constants') return base + 'library/constants.html#' + e.name;
    if (g === 'str' || g === 'dict') return base + 'library/stdtypes.html#' + g + '.' + e.name;
    if (g === 'exceptions') return base + 'library/exceptions.html#' + e.name;
    var grp = U.find('refGroups', g);
    return grp ? grp.docs : base;
  }

  /* ---------- the index (#/reference) ---------- */

  function indexPage(root, query) {
    var all = entries();
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Reference'),
      h('p', null, 'Every built-in function, every method of str, list, dict, set and tuple, every keyword, the operators and the special methods behind them, ' +
        'the built-in exceptions and the 25 standard-library modules you will use most: ' + all.length + ' entries, each with an example you can run and its Java equivalent. ' +
        'In any editor, hover a name to see its entry, or Ctrl+click it to open it here.')));
    var filter = h('input', { class: 'input ref-filter', id: 'ref-filter', type: 'search', autocomplete: 'off', spellcheck: 'false',
      placeholder: 'Filter: a name or a word (split, append, iterator, HashMap…)', 'aria-label': 'Filter the Reference' });
    var jump = h('nav', { class: 'ref-jump', 'aria-label': 'Groups' }, groups().map(function (g) {
      return h('a', { class: 'btn btn-small', href: '#/reference?group=' + g.id }, g.title);
    }));
    var empty = h('p', { class: 'muted', hidden: true });
    root.appendChild(h('div', { class: 'ref-tools' }, filter, jump));
    root.appendChild(empty);

    var rows = [];
    groups().forEach(function (g) {
      var list = inGroup(g.id);
      var items = h('div', { class: 'ref-items' });
      var section = h('section', { class: 'ref-group', 'data-group': g.id, id: 'ref-group-' + g.id },
        h('h2', null, g.title, h('span', { class: 'badge' }, String(list.length))),
        U.enhance(h('p', { class: 'muted ref-group-intro', html: U.mdInline(g.intro) })), items);
      list.forEach(function (e) {
        var a = h('a', { class: 'ref-item', href: '#/reference/' + e.id, 'data-id': e.id },
          h('code', null, e.title), h('small', null, short(e.summary)));
        items.appendChild(a);
        rows.push({ el: a, section: section, hay: [e.title, e.name].concat(e.covers || [], e.members || []).join(' ').toLowerCase() + ' ' + plain(e.summary + ' ' + e.java).toLowerCase() });
      });
      root.appendChild(section);
    });

    function apply() {
      var q = filter.value.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean), shown = 0;
      rows.forEach(function (r) {
        var ok = words.every(function (w) { return r.hay.indexOf(w) >= 0; });
        r.el.hidden = !ok;
        if (ok) shown++;
      });
      U.$$('.ref-group', root).forEach(function (s) { s.hidden = !U.$$('.ref-item', s).some(function (a) { return !a.hidden; }); });
      empty.hidden = shown > 0;
      empty.textContent = 'Nothing in the Reference matches "' + filter.value + '". Try a shorter word, or search everything with Ctrl K.';
      try { sessionStorage.setItem('pylt.ref.filter', filter.value); } catch (e) { /* storage blocked: the filter is just not kept */ }
    }
    filter.addEventListener('input', apply);
    var kept = '';
    try { kept = sessionStorage.getItem('pylt.ref.filter') || ''; } catch (e) { kept = ''; }
    if (query && query.q !== undefined) kept = query.q;
    if (query && query.group) kept = '';
    filter.value = kept;
    apply();
    if (query && query.group) {
      var target = document.getElementById('ref-group-' + query.group);
      if (target) setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 0);
    }
  }

  /* ---------- one entry (#/reference/<id>) ---------- */

  function entryPage(root, e) {
    var group = U.find('refGroups', e.group);
    var siblings = inGroup(e.group), at = siblings.indexOf(e);
    var prev = siblings[at - 1], next = siblings[at + 1];
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/reference' }, 'Reference'), ' › ',
      h('a', { href: '#/reference?group=' + e.group }, group ? group.title : e.group)));

    var main = h('article', { class: 'ref-entry', 'data-id': e.id });
    var side = h('aside', { class: 'ref-side' });
    root.appendChild(h('div', { class: 'ref-layout' }, main, side));

    main.appendChild(h('h1', null, e.title));
    main.appendChild(h('pre', { class: 'code ref-sig' }, e.sig));
    main.appendChild(U.enhance(h('div', { class: 'ref-summary', html: U.md(e.summary) })));
    if (e.covers && e.covers.length) {
      main.appendChild(h('p', { class: 'faint' }, 'This entry also covers: ', e.covers.map(function (c, i) {
        return [i ? ', ' : '', h('code', null, c)];
      })));
    }
    if (e.members) {
      main.appendChild(h('p', { class: 'ref-members' }, h('b', null, 'Names you will use: '), e.members.map(function (m, i) {
        return [i ? ' ' : '', h('code', null, e.name + '.' + m)];
      })));
    }
    main.appendChild(U.enhance(U.callout('java', 'In Java', U.md(e.java))));

    main.appendChild(h('h2', null, 'Example'));
    var allowed = U.run.supports(e);
    var code = U.codeBlock(e.example, 'python', { title: e.title });
    main.appendChild(code.el);
    if (e.stdin) {
      main.appendChild(h('p', { class: 'faint' }, 'It reads this input, one line per input() call:'));
      main.appendChild(h('pre', { class: 'code stdin-show' }, e.stdin));
    }
    var panelHolder = h('div');
    var runBtn = h('button', { class: 'btn btn-primary ref-run', type: 'button', disabled: !allowed || null }, '▶ Run it');
    main.appendChild(h('div', { class: 'row run-bar' }, runBtn,
      h('button', { class: 'btn', type: 'button', onclick: function () { U.openInVisualize({ title: e.title, code: e.example, stdin: e.stdin || '' }); } }, 'Visualize'),
      h('span', { class: 'spacer' }),
      h('a', { class: 'faint', href: docsFor(e), target: '_blank', rel: 'noopener' }, 'docs.python.org ↗')));
    if (!allowed) main.appendChild(U.callout('warn', 'Needs Python on your PC', U.md('This example starts another program, which a browser cannot do. Run `pylearn.cmd` (or `python pylearn.py`) to try it.')));
    main.appendChild(panelHolder);
    main.appendChild(h('h3', null, 'It prints'));
    main.appendChild(h('pre', { class: 'code ref-prints' }, e.output));
    var panel = null;
    runBtn.addEventListener('click', function () {
      if (!panel) { panel = U.runPanel({ title: 'Run on ' + (U.run.info.runtime === 'server' ? 'your Python' : 'Python in this browser') }); panelHolder.appendChild(panel.el); }
      runBtn.disabled = true;
      panel.start();
      U.run.exec({ code: e.example, stdin: e.stdin || '' }, panel.append).then(function (res) {
        panel.show(res);
        runBtn.disabled = false;
      });
    });

    main.appendChild(h('div', { class: 'row lesson-nav' },
      prev ? h('a', { class: 'btn', href: '#/reference/' + prev.id }, '← ' + prev.title) : null,
      h('span', { class: 'spacer' }),
      next ? h('a', { class: 'btn btn-primary', href: '#/reference/' + next.id }, next.title + ' →') : null));

    side.appendChild(h('div', { class: 'ref-side-title' }, group ? group.title : e.group));
    side.appendChild(h('nav', { class: 'ref-side-list', 'aria-label': 'Entries in this group' }, siblings.map(function (s) {
      return h('a', { href: '#/reference/' + s.id, class: s === e ? 'active' : null, 'aria-current': s === e ? 'page' : null }, s.title);
    })));
  }

  U.views.reference = {
    render: function (root, params, query) {
      var e = params[0] && U.find('reference', params[0]);
      if (e) entryPage(root, e); else indexPage(root, query);
    }
  };
  U.route('reference', U.views.reference);
  U.refDocs = docsFor;
})(window.PYLT);
