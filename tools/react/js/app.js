/*
 * app.js - start-up: the theme switch, the React badge, global search (Ctrl+K or /), and the router.
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

  /* ---------- the React badge: can code run right now? ---------- */

  function setupBadge() {
    var badge = document.getElementById('react-badge');
    var dlg = document.getElementById('react-dialog');
    U.react.onChange(function (s) {
      var long = s === 'loading' ? 'Loading React…' : s === 'unavailable' ? 'React missing: code cannot run' : 'React ' + U.react.VERSION;
      var short = s === 'loading' ? '…' : s === 'unavailable' ? '!' : U.react.VERSION.split('.').slice(0, 2).join('.');
      badge.innerHTML = '';
      badge.appendChild(h('span', { class: 'rb-long' }, long));
      badge.appendChild(h('span', { class: 'rb-short', 'aria-hidden': 'true' }, short));
      badge.setAttribute('data-state', s);
      badge.title = s === 'ready' ? 'Your code runs on React ' + U.react.VERSION + ', from this folder: no internet needed. Click for how.' : s === 'unavailable' ? U.react.problem + ' Click for more.' : 'Loading';
      U.$$('.react-card').forEach(function (el) { el.replaceWith(U.reactExplainer()); });
    });
    badge.addEventListener('click', function () {
      var body = document.getElementById('react-dialog-body');
      body.innerHTML = '';
      body.appendChild(h('h2', { style: { marginTop: 0 } }, 'Where React comes from'));
      body.appendChild(U.reactExplainer());
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
    add('Page', 'Review your missed quiz questions', 'Questions you missed in the lesson quizzes come back here until you know them.',
      '#/lessons/review', ['quiz', 'review', 'questions', 'test yourself', 'spaced repetition'], 2);
    add('Page', 'Interview Q&A', 'The React questions interviews ask, with 30-second answers and follow-ups.', '#/interview',
      ['interview', 'questions', 'q&a', 'qa', 'answers', 'prepare', 'preparation'], 2.5);
    add('Page', 'Flashcards', 'Practise the interview questions: answer out loud, reveal, grade yourself; they come back until you know them.', '#/interview/cards',
      ['flashcards', 'flash cards', 'cards', 'practise', 'practice', 'spaced repetition', 'review', 'drill'], 2.5);
    (U.data.questions || []).forEach(function (q) {
      add('Question', q.q, q.short, '#/interview/' + q.id, (q.keywords || []).concat(['interview', 'question']), 2.2);
    });
    add('Page', 'Machine coding', 'Build interview components against a timer: counter, star rating, accordion…', '#/build',
      ['machine coding', 'machine', 'coding', 'build', 'components', 'timer', 'interview', 'practice', 'problems'], 2.5);
    (U.data.builds || []).forEach(function (b) {
      add('Problem', b.title, b.summary, '#/build/' + b.id, (b.keywords || []).concat([b.level, 'machine coding', 'problem']), 2.3);
    });
    add('Page', 'Explainers', 'Ideas taken apart one move at a time, then run in real React: state is a snapshot, and more with each track.', '#/explain',
      ['explainer', 'explainers', 'explain', 'step through', 'step by step', 'visual', 'how it works'], 2.2);
    (U.data.explainers || []).forEach(function (x) {
      add('Explainer', x.title, x.summary, '#/explain/' + x.id, (x.keywords || []).concat(['explainer']), 2.4);
    });
    add('Page', 'Reference: hooks and APIs', 'Every hook and API: its signature, what it does, the snippet, its lesson, react.dev and the questions about it.', '#/reference',
      ['reference', 'api', 'apis', 'hooks', 'hook', 'docs', 'documentation', 'cheat sheet', 'signature'], 2.6);
    (U.data.api || []).forEach(function (e) {
      add('Reference', e.name, e.summary, '#/reference/' + e.id, [e.kind, e.module, 'reference', 'api'], 2);
    });
    add('Page', 'The ★★★ fast track', 'Flashcards of the questions asked in almost every React round: practise these first when time is short.', '#/interview/cards?weight=3',
      ['fast track', 'fast', 'track', '3 stars', 'three stars', 'most asked', 'must know', 'top questions', 'flashcards'], 2.3);
    add('Page', 'Mock interview', 'Questions out loud against a clock, a follow-up after each, then a timed machine-coding round; a scorecard and what to revise.', '#/mock',
      ['mock interview', 'mock', 'interview', 'practice interview', 'timed', 'simulate', 'rehearse', 'scorecard', 'dry run'], 2.4);
    add('Page', 'Glossary', 'React\'s words in plain language, each linked to where it is taught: reconciliation, hydration, Server Components…', '#/glossary',
      ['glossary', 'terms', 'definitions', 'definition', 'words', 'vocabulary', 'jargon', 'what does it mean', 'meaning'], 2.2);
    (U.data.glossary || []).forEach(function (t) {
      add('Term', t.term, t.def, '#/glossary/' + t.id, (t.keywords || []).concat(['term', 'glossary']), 0.8);   // below lessons: a lesson teaches the term
    });
    add('Page', 'JavaScript for React', 'The shorthand React code is written in (=>, const [a, b] =, ..., ?.), each next to the same thing written out and the nearest Java.', '#/javascript',
      ['javascript', 'js', 'java', 'coming from java', 'modern javascript', 'es6', 'shorthand', 'syntax', 'language'], 2.4);
    (U.data.javascript || []).forEach(function (e) {
      add('JavaScript', e.title, e.says, '#/javascript/' + e.id, (e.keywords || []).concat(['javascript', 'java']), 1.5);   // below lessons: a lesson uses it
    });
    add('Page', 'Playground', 'Write any component and watch it run, with templates and saved snippets.', '#/playground',
      ['playground', 'run', 'editor', 'scratch', 'try', 'snippet', 'sandbox'], 2);
    add('Page', 'Where React comes from', 'React 19 and Babel are files in this folder (vendor/): code runs with no internet.', '#/?at=how-it-runs',
      ['offline', 'internet', 'vendor', 'babel', 'version', 'runtime'], 1.2);
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
        results.appendChild(h('div', { class: 'search-empty' }, 'Try: useState, key, snapshot, useEffect, cleanup, useRef, context, memo, useOptimistic, hydration, testing, mock interview, glossary, =>, destructuring'));
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
        h('span', { class: 'badge' + (e.type === 'Lesson' || e.type === 'Explainer' ? ' badge-ok' : e.type === 'Question' ? ' badge-warn' : e.type === 'Reference' ? '' : ' badge-accent') }, e.type),
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
    setupBadge();
    setupSearch();
    window.addEventListener('hashchange', U.render);
    U.render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.RLT);
