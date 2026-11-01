/*
 * views/reference.js - the Reference (#/reference, #/reference/<id>, batch 3): the concurrency APIs of
 * the JDK, the Kotlin tool's Reference for Java.
 *
 * The index lists every entry, grouped (threads, monitors and locks, executors, futures, atomics,
 * collections, synchronizers, fork/join, structured concurrency, scoped and stable values), with a
 * filter. An entry's page shows its signature, the Java release it arrived in (read from the JDK's own
 * source, lib/src.zip) and a "preview" badge for the APIs that are previews in Java 25, what it does, an
 * example with what it prints (stored in data/reference-*.js and proved by tests/test_content.py), a Run
 * button (through jclearn), and the other entries of its group. Editors link here from their hover tips
 * (js/assist.js).
 */
(function (U) {
  'use strict';
  var h = U.h;
  var API = 'https://docs.oracle.com/en/java/javase/25/docs/api/';

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

  /** Where the official documentation of an entry is: its own link, else its group's, else the Java 25 API. */
  function docsFor(e) {
    if (e.docs) return e.docs;
    var grp = U.find('refGroups', e.group);
    return grp && grp.docs ? grp.docs : API;
  }

  function badges(e) {
    return [h('span', { class: 'badge ref-since', title: 'The Java release this API arrived in (its @since)' }, 'since Java ' + e.since),
      e.preview ? h('span', { class: 'badge badge-warn ref-preview', title: 'A preview API in Java 25: compile and run with --enable-preview (jclearn does)' }, 'preview in 25') : null];
  }

  /* ---------- the index (#/reference) ---------- */

  function indexPage(root, query) {
    var all = entries();
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Reference'),
      h('p', null, all.length + ' of the JDK\'s concurrency APIs, from Thread and synchronized to StructuredTaskScope, each with the Java release it arrived in, ' +
        'whether it is a preview in Java 25, an example you can run and what it prints. ' +
        'In any editor, hover a name to see its entry, or Ctrl+click it to open it here.')));
    var filter = h('input', { class: 'input ref-filter', id: 'ref-filter', type: 'search', autocomplete: 'off', spellcheck: 'false',
      placeholder: 'Filter: a name or a word (tryLock, merge, timeout, interrupt, preview…)', 'aria-label': 'Filter the Reference' });
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
          h('code', null, e.title), h('small', null, (e.preview ? 'preview · ' : '') + 'Java ' + e.since + ' · ' + short(e.summary)));
        items.appendChild(a);
        rows.push({ el: a, hay: [e.title, e.name, e.sig, e.preview ? 'preview' : ''].concat(e.covers || [], e.receiver || []).join(' ').toLowerCase() + ' ' + plain(e.summary).toLowerCase() });
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
      try { sessionStorage.setItem('jclt.ref.filter', filter.value); } catch (e) { /* storage blocked: the filter is just not kept */ }
    }
    filter.addEventListener('input', apply);
    var kept = '';
    try { kept = sessionStorage.getItem('jclt.ref.filter') || ''; } catch (e) { kept = ''; }
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
    main.appendChild(h('div', { class: 'row ref-badges' }, badges(e)));
    var sig = h('pre', { class: 'code ref-sig cm-s-jclt' });
    U.highlightInto(sig, e.sig, 'java');
    main.appendChild(sig);
    if ((e.receiver || []).length) {
      main.appendChild(h('p', { class: 'faint ref-receiver' }, 'Called on: ', e.receiver.map(function (r, i) { return [i ? ', ' : '', h('code', null, r)]; })));
    }
    main.appendChild(U.enhance(h('div', { class: 'ref-summary', html: U.md(e.summary) })));
    if (e.covers && e.covers.length) {
      main.appendChild(h('p', { class: 'faint' }, 'This entry also covers: ', e.covers.map(function (c, i) {
        return [i ? ', ' : '', h('code', null, c)];
      })));
    }
    if (e.preview) main.appendChild(U.enhance(U.callout('warn', 'A preview API in Java 25', U.md('Compile and run with `--enable-preview` (jclearn always does). Its API changes in Java 26 and 27: see [[lesson:sc-patterns]] and the version map.'))));

    main.appendChild(h('h2', null, 'Example'));
    var code = U.codeBlock(e.example, 'java', { title: e.title });
    main.appendChild(h('div', { class: 'ref-example' }, code.el));
    var panelHolder = h('div');
    var runBtn = h('button', { class: 'btn btn-primary ref-run', type: 'button' }, '▶ Run it');
    main.appendChild(h('div', { class: 'row run-bar' }, runBtn, h('span', { class: 'spacer' }),
      h('a', { class: 'faint', href: docsFor(e), target: '_blank', rel: 'noopener' }, 'Java 25 API docs ↗')));
    main.appendChild(panelHolder);
    main.appendChild(h('h3', null, 'It prints'));
    main.appendChild(h('pre', { class: 'code ref-prints' }, e.output));
    var note = h('div');
    main.appendChild(note);
    U.run.ready().then(function () { if (!U.run.available() && note.isConnected) note.appendChild(U.serverNote('#/reference/' + e.id)); });
    var panel = null;
    runBtn.addEventListener('click', function () {
      if (!panel) { panel = U.runPanel({ title: 'Run on your PC' }); panelHolder.appendChild(panel.el); }
      runBtn.disabled = true;
      panel.start();
      U.run.exec({ code: e.example, stdin: e.stdin || '' }, panel.append).then(function (res) {
        panel.show(res);
        runBtn.disabled = false;
      });
    });
    if ((e.see || []).length) {
      main.appendChild(h('div', { class: 'row see-also' }, h('span', { class: 'faint' }, 'Learn it in:'), e.see.map(function (r) {
        var m = /^(\w+):(.+)$/.exec(r);
        return h('a', { class: 'btn btn-small', href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
      })));
    }

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
})(window.JCLT);
