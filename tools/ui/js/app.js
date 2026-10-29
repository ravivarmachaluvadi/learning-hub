/*
 * app.js - start-up: theme switch, global search (Ctrl+K or /), and the router.
 */
(function (U) {
  'use strict';
  var h = U.h;

  /* ---------- theme: Auto follows the device; the button forces the opposite of what you see ---------- */

  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function deviceTheme() { return media && media.matches ? 'dark' : 'light'; }
  function effectiveTheme() { return document.documentElement.getAttribute('data-theme') || deviceTheme(); }
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function paintThemeButton() {
    var btn = document.getElementById('theme-btn');
    var dark = effectiveTheme() === 'dark';
    var forced = document.documentElement.hasAttribute('data-theme');
    btn.innerHTML = dark ? SUN : MOON;
    btn.title = (dark ? 'Switch to light' : 'Switch to dark') + (forced ? '' : ' (now following your device)');
  }
  function toggleTheme() {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    if (next === deviceTheme()) {
      document.documentElement.removeAttribute('data-theme');
      U.store.del('theme');
    } else {
      document.documentElement.setAttribute('data-theme', next);
      U.store.set('theme', next);
    }
    paintThemeButton();
  }
  if (media && media.addEventListener) media.addEventListener('change', paintThemeButton);

  /* ---------- full screen: the whole tool, without the browser's (or claude.ai's) frame around it ---------- */

  var EXPAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  var SHRINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
  function paintFullButton() {
    var btn = document.getElementById('full-btn');
    var on = !!document.fullscreenElement;
    btn.innerHTML = on ? SHRINK : EXPAND;
    btn.setAttribute('aria-label', on ? 'Leave full screen' : 'Full screen');
    btn.setAttribute('aria-pressed', String(on));
    btn.title = on ? 'Leave full screen (Esc)' : 'Full screen';
  }
  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    else document.documentElement.requestFullscreen().catch(function () { U.toast('The browser did not allow full screen here.'); });
  }

  /* ---------- search ---------- */

  function plain(md) { return String(md || '').replace(/`/g, '').replace(/\*\*/g, '').replace(/\[\[\w+:([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, id, l) { return l || id; }); }

  var index = null;
  function buildIndex() {
    var idx = [];
    function add(type, name, sub, href, keys, weight) {
      idx.push({ type: type, name: name, sub: plain(sub), href: href, keys: (keys || []).filter(Boolean).map(function (k) { return String(k).toLowerCase(); }), weight: weight || 1 });
    }
    (U.data.htmlElements || []).forEach(function (e) {
      add('HTML', e.title || '<' + e.tag + '>', e.summary, '#/html/' + encodeURIComponent(e.tag), [e.tag].concat(e.keywords || []), 3);
      (e.attributes || []).forEach(function (a) {
        add('Attribute', '<' + e.tag + '> ' + a.name, a.desc, '#/html/' + encodeURIComponent(e.tag) + '?attr=' + encodeURIComponent(a.name), [a.name], 1.5);
        (a.values || []).forEach(function (v) {
          add('Value', a.name + '="' + v.value + '"', '<' + e.tag + '> - ' + v.desc,
            '#/html/' + encodeURIComponent(e.tag) + '?attr=' + encodeURIComponent(a.name) + '&v=' + encodeURIComponent(v.value), [v.value], 0.8);
        });
      });
    });
    (U.data.htmlGlobalAttrs || []).forEach(function (a) {
      add('Attribute', a.name + ' (any element)', a.desc, '#/html/div?attr=' + encodeURIComponent(a.name), [a.name], 1.4);
    });
    (U.data.cssProperties || []).forEach(function (p) {
      add('CSS', p.name, p.summary, '#/css/' + encodeURIComponent(p.name), [p.name].concat(p.keywords || []), 3);
      (p.values || []).forEach(function (v) {
        add('Value', p.name + ': ' + v.value, v.desc, '#/css/' + encodeURIComponent(p.name) + '?v=' + encodeURIComponent(v.value), [v.value], 0.8);
      });
    });
    (U.data.lessons || []).forEach(function (l) {
      add('Lesson', l.title, l.summary, '#/lessons/' + l.id, (l.keywords || []).concat([l.track]), 2.5);
    });
    add('Lesson', 'Review your missed quiz questions', 'Questions you missed in the lesson quizzes come back here until you know them.',
      '#/lessons/review', ['quiz', 'review', 'questions', 'test yourself', 'spaced repetition'], 2.5);
    (U.data.recreate || []).forEach(function (c) {
      add('Recreate', c.title, c.summary, '#/recreate/' + c.id, (c.keywords || []).concat(['recreate', 'challenge', 'practice']), 2.2);
    });
    (U.data.recipes || []).forEach(function (r) {
      add('Recipe', r.title, r.summary, '#/recipes/' + r.id, (r.keywords || []).concat(['recipe', 'pattern', 'widget', 'component']), 2.5);
    });
    (U.data.jsTopics || []).forEach(function (t) {
      add('JS', t.title, t.summary, '#/js/' + t.id, (t.keywords || []).concat(t.api ? t.api.map(function (a) { return a.name; }) : []), 2.5);
    });
    (U.data.explainers || []).forEach(function (x) {
      add('Explainer', x.title, x.summary, '#/explain/' + x.id, x.keywords || [], 2.5);
    });
    (U.data.glossary || []).forEach(function (g) {
      add('Term', g.term, g.def, '#/glossary/' + g.id, [g.term].concat(g.keywords || []), 2);
    });
    return idx;
  }

  function scoreToken(e, t) {
    var name = e.name.toLowerCase(), best = 0;
    if (name === t || name === '<' + t + '>') best = 100;
    else if (e.keys.indexOf(t) >= 0) best = 85;
    else if (name.indexOf(t) === 0 || name.indexOf('<' + t) === 0) best = 65;
    else if (e.keys.some(function (k) { return k.indexOf(t) === 0; })) best = 55;
    else if (name.indexOf(t) >= 0) best = 40;
    else if (e.keys.some(function (k) { return k.indexOf(t) >= 0; })) best = 30;
    else if (t.length >= 3 && e.sub.toLowerCase().indexOf(t) >= 0) best = 8;
    return best;
  }

  U.search = function (q) {
    if (!index) index = buildIndex();
    var tokens = String(q).toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    var out = [];
    index.forEach(function (e) {
      var total = 0;
      for (var i = 0; i < tokens.length; i++) {
        var s = scoreToken(e, tokens[i]);
        if (!s) return;
        total += s;
      }
      out.push({ e: e, s: total * (0.8 + e.weight * 0.1) });
    });
    out.sort(function (a, b) { return b.s - a.s || a.e.name.length - b.e.name.length; });
    return out.slice(0, 40).map(function (r) { return r.e; });
  };

  function setupSearch() {
    var dlg = document.getElementById('search-dialog');
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var active = 0, current = [];

    function draw() {
      current = U.search(input.value);
      results.innerHTML = '';
      if (!input.value.trim()) {
        results.appendChild(h('div', { class: 'search-empty' }, 'Try: center, flex, input, color, border, click, grid, link, form'));
        return;
      }
      if (!current.length) {
        results.appendChild(h('div', { class: 'search-empty' }, 'Nothing found for "' + input.value + '".'));
        return;
      }
      active = Math.min(active, current.length - 1);
      current.forEach(function (e, i) {
        results.appendChild(h('a', {
          class: 'search-result' + (i === active ? ' active' : ''), href: e.href, role: 'option',
          'aria-selected': i === active ? 'true' : 'false',
          onclick: function () { close(); }
        },
        h('span', { class: 'badge' + (e.type === 'Lesson' ? ' badge-ok' : e.type === 'Value' || e.type === 'Attribute' ? '' : ' badge-accent') }, e.type),
        h('span', { class: 'search-result-text' }, h('b', null, e.name), h('small', null, e.sub))));
      });
    }
    function open() {
      if (dlg.open) return;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      input.value = '';
      active = 0;
      draw();
      input.focus();
    }
    function close() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
    function move(d) {
      if (!current.length) return;
      active = (active + d + current.length) % current.length;
      draw();
      var el = results.querySelector('.active');
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
    input.addEventListener('input', function () { active = 0; draw(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (current[active]) { close(); U.go(current[active].href); }
      }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    document.getElementById('search-btn').addEventListener('click', open);
    document.addEventListener('keydown', function (e) {
      var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable ||
        (document.activeElement.closest && document.activeElement.closest('.CodeMirror'));
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); open(); }
      else if (e.key === '/' && !typing) { e.preventDefault(); open(); }
    });
    U.openSearch = function (q) { open(); if (q) { input.value = q; draw(); } };
  }

  /* ---------- start ---------- */

  function start() {
    paintThemeButton();
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
    var full = document.getElementById('full-btn');
    full.hidden = !document.fullscreenEnabled;   // a frame that does not allow full screen gets no button
    if (!full.hidden) {
      paintFullButton();
      full.addEventListener('click', toggleFull);
      document.addEventListener('fullscreenchange', paintFullButton);
    }
    setupSearch();
    window.addEventListener('hashchange', U.render);
    U.render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.UILT);
