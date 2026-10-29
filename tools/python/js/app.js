/*
 * app.js - start-up: the theme switch, the "where Python runs" badge, global search (Ctrl+K or /),
 * and the router.
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

  /* ---------- the runtime badge: which Python runs your code ---------- */

  function setupRuntimeBadge() {
    var badge = document.getElementById('runtime-badge');
    var dlg = document.getElementById('runtime-dialog');
    U.run.onChange(function (info) {
      var short = info.state === 'loading' ? '…' : info.state === 'error' ? 'No Python' : info.runtime === 'server' ? 'PC' : 'Web';
      badge.innerHTML = '';
      badge.appendChild(h('span', { class: 'rb-long' }, info.label));
      badge.appendChild(h('span', { class: 'rb-short', 'aria-hidden': 'true' }, short));
      badge.setAttribute('data-state', info.state);
      badge.setAttribute('data-runtime', info.runtime || '');
      badge.title = info.state === 'ready' ? (info.runtime === 'server' ? 'Programs run on the Python installed on this PC (' + info.detail + ')' :
        'Programs run inside this page (' + info.detail + '). Click for the other way.') : (info.detail || info.label);
      U.$$('.runtime-card').forEach(function (el) { el.replaceWith(U.runtimeExplainer()); });
    });
    badge.addEventListener('click', function () {
      var body = document.getElementById('runtime-dialog-body');
      body.innerHTML = '';
      body.appendChild(h('h2', { style: { marginTop: 0 } }, 'Where your Python runs'));
      body.appendChild(U.runtimeExplainer());
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  /* ---------- search ---------- */

  function plain(md) { return String(md || '').replace(/`/g, '').replace(/\*\*/g, '').replace(/\[\[\w+:([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, id, l) { return l || id; }); }

  var index = null;
  function buildIndex() {
    var idx = [];
    function add(type, name, sub, href, keys, weight) {
      idx.push({ type: type, name: name, sub: plain(sub), href: href, keys: (keys || []).filter(Boolean).map(function (k) { return String(k).toLowerCase(); }), weight: weight || 1 });
    }
    (U.data.lessons || []).forEach(function (l) {
      var t = U.find('tracks', l.track);
      add('Lesson', l.title, l.summary, '#/lessons/' + l.id, (l.keywords || []).concat([t ? t.title : '']), 2.5);
    });
    (U.data.tracks || []).forEach(function (t) {
      add('Track', t.title, t.summary, '#/lessons?track=' + t.id, [t.level, 'track'].concat(t.keywords || []), 1.5);
    });
    add('Lesson', 'Review your missed quiz questions', 'Questions you missed in the lesson quizzes come back here until you know them.',
      '#/lessons/review', ['quiz', 'review', 'questions', 'test yourself', 'spaced repetition'], 2.5);
    add('Page', 'Practice', 'Katas: small exercises from easy to hard, most of them the patterns interviews ask for.', '#/practice',
      ['practice', 'kata', 'katas', 'exercise', 'exercises', 'interview', 'leetcode', 'drill', 'problems', 'algorithms', 'coding'], 2.5);
    (U.data.katas || []).forEach(function (k) {
      var pats = (k.patterns || []).map(function (p) { var e = U.find('kataPatterns', p); return e ? e.title : p; });
      add('Kata', k.title, k.summary, '#/practice/' + k.id, pats.concat(k.patterns || [], k.keywords || [], [k.level, 'kata']), 1.6);
    });
    add('Page', 'Projects', 'Guided builds of real programs: a command-line tool, a pytest suite, a FastAPI service next to Spring Boot, a data script.', '#/projects',
      ['projects', 'project', 'build', 'guided', 'portfolio', 'real program'], 2.5);
    (U.data.projects || []).forEach(function (p) {
      add('Project', p.title, p.summary, '#/projects/' + p.id, (p.keywords || []).concat(p.packages || [], ['project']), 2.2);
      p.steps.forEach(function (s, i) {
        add('Project', s.title, p.title + ', step ' + (i + 1) + ': ' + s.summary, '#/projects/' + p.id + '/' + (i + 1), [p.title, 'step'], 1);
      });
    });
    add('Page', 'Playground', 'Write any Python and run it, with an input box for input().', '#/playground',
      ['playground', 'run', 'editor', 'scratch', 'try', 'snippet', 'repl'], 2);
    add('Page', 'Visualize', 'Step through a program and watch every name point at its object: frames, objects, arrows.', '#/visualize',
      ['visualize', 'visualise', 'step', 'debugger', 'trace', 'frames', 'objects', 'references', 'python tutor', 'memory'], 2);
    add('Page', 'Explainers', 'Pages that run real Python as you click: names and objects, scope, generators, decorators.', '#/explain',
      ['explainer', 'explain', 'interactive', 'demo'], 1.5);
    (U.data.explainers || []).forEach(function (x) {
      add('Explainer', x.title, x.summary, '#/explain/' + x.id, x.keywords, 2.2);
    });
    (U.data.vizExamples || []).forEach(function (x) {
      add('Visualize', x.title, x.summary, '#/visualize?example=' + x.id, ['visualize', 'example'], 1);
    });
    add('Page', 'Where your Python runs', 'Your own Python through pylearn, or Python inside the browser; a desktop shortcut.', '#/?at=how-it-runs',
      ['pylearn', 'server', 'pyodide', 'offline', 'runtime', 'browser', 'shortcut', 'desktop', 'start menu', 'install', 'start'], 1.5);
    add('Page', 'Reference', 'Every built-in function, every method of str, list, dict, set and tuple, keywords, operators, special methods, exceptions and 25 modules.', '#/reference',
      ['reference', 'api', 'docs', 'documentation', 'built-in', 'builtins', 'methods', 'keywords', 'operators', 'modules', 'stdlib', 'standard library'], 2);
    (U.data.reference || []).forEach(function (e) {
      var g = U.find('refGroups', e.group);
      add('Reference', e.title, e.summary, '#/reference/' + e.id, [e.name, g ? g.title : ''].concat(e.covers || []), 1.8);
    });
    add('Page', 'Java ↔ Python', 'Side-by-side translations: collections, streams, Optional, records, JUnit, Maven, Spring.', '#/java',
      ['java', 'translation', 'side by side', 'comparison', 'cheat sheet', 'equivalent'], 2);
    (U.data.javapy || []).forEach(function (e) {
      add('Java', e.title, e.note, '#/java/' + e.id, (e.keywords || []).concat(['java']), 1.7);
    });
    add('Page', 'Glossary', 'Python words in plain language, with the Java idea each one matches.', '#/glossary',
      ['glossary', 'terms', 'definitions', 'words', 'vocabulary', 'jargon'], 2);
    (U.data.glossary || []).forEach(function (t) {
      add('Term', t.term, t.def, '#/glossary/' + t.id, t.keywords || [], 0.8);   // below lessons: a lesson teaches the term
    });
    return idx;
  }

  function scoreToken(e, t) {
    var name = e.name.toLowerCase(), best = 0;
    if (name === t) best = 100;
    else if (e.keys.indexOf(t) >= 0) best = 85;
    else if (name.indexOf(t) === 0) best = 65;
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
        results.appendChild(h('div', { class: 'search-empty' }, 'Try: f-string, dict, comprehension, dataclass, generator, append, HashMap, Optional, heapq, FastAPI'));
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
        h('span', { class: 'badge' + (e.type === 'Lesson' ? ' badge-ok' : e.type === 'Explainer' || e.type === 'Java' ? ' badge-warn' : e.type === 'Reference' || e.type === 'Term' ? '' : ' badge-accent') }, e.type),
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
    setupRuntimeBadge();
    setupSearch();
    window.addEventListener('hashchange', U.render);
    U.render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.PYLT);
