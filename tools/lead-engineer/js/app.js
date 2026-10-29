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

  var index = null;
  function buildIndex() {
    var idx = [];
    function add(type, name, sub, href, keys, weight) {
      idx.push({ type: type, name: U.plain(name), sub: U.plain(sub), href: href,
        keys: (keys || []).filter(Boolean).map(function (k) { return String(k).toLowerCase(); }), weight: weight || 1 });
    }
    function trackName(id) { var t = U.track(id); return t ? t.name : ''; }
    (U.data.scenarios || []).forEach(function (s) {
      add('Scenario', s.title, s.summary, '#/scenarios/' + s.id, (s.keywords || []).concat([trackName(s.track), 'scenario', 'practice']), 3);
    });
    (U.data.lessons || []).forEach(function (l) {
      add('Lesson', l.title, l.summary, '#/lessons/' + l.id, (l.keywords || []).concat([trackName(l.track)]), 2.6);
    });
    (U.data.explainers || []).forEach(function (x) {
      add('Explainer', x.title, x.summary, '#/explain/' + x.id, (x.keywords || []).concat([trackName(x.track), 'explainer']), 3.2);
    });
    add('Lesson', 'Review your missed quiz questions', 'Questions you missed in the lesson quizzes come back here until you know them.',
      '#/lessons/review', ['quiz', 'review', 'questions', 'test yourself', 'spaced repetition'], 2);
    (U.data.tools || []).forEach(function (t) {
      add('Tool', t.title, t.summary, '#/tools/' + t.id, (t.keywords || []).concat(['tool']), 3.3);
    });
    (U.data.playbooks || []).forEach(function (p) {
      // not the bare word "meeting": every playbook would then outrank the lesson on meetings
      add('Playbook', p.title, p.summary, '#/playbooks/' + p.id, (p.keywords || []).concat(['playbook', 'agenda']), 3.2);
    });
    (U.data.templates || []).forEach(function (t) {
      add('Template', t.title, t.summary, U.linkFor('template', t.id), (t.keywords || []).concat(['template']), 3.1);
    });
    (U.data.phrases || []).forEach(function (p) {
      var g = U.find('phraseGroups', p.group);
      add('Phrase', p.say, 'Instead of: ' + p.instead, U.linkFor('phrase', p.id), (p.keywords || []).concat([g ? g.title : '', p.instead]), 1.2);
    });
    (U.data.glossary || []).forEach(function (g) {
      add('Term', g.term, g.def, '#/glossary/' + g.id, [g.term].concat(g.keywords || []), 2);
    });
    add('Start', 'Self-assessment: where are you strong, where to grow?', 'Rate 30 behaviours of a lead engineer and get a radar chart and a suggested path.',
      '#/start', ['assessment', 'self assessment', 'radar', 'start', 'where do i start', 'skills'], 2.5);
    add('Start', 'Your progress', 'Scenarios played, lessons done, your radar chart, activity by week, and what to do next.',
      '#/progress', ['progress', 'my progress', 'stats', 'statistics', 'activity', 'how am i doing', 'what next', 'dashboard'], 3.4);
    add('Practice', 'A week as a lead', 'Twelve mixed scenarios over Monday to Friday, scored per area against how you rated yourself.',
      '#/week', ['week as a lead', 'a week as a lead', 'week', 'practice week', 'mixed scenarios', 'simulation', 'practice run'], 3.4);
    add('Reading', 'Reading list', 'The books, articles and guides behind the lessons, five of them marked "start here".',
      '#/reading', ['reading list', 'books', 'book', 'reading', 'articles', 'what to read', 'further reading', 'recommended books'], 3.2);
    (U.data.reading || []).forEach(function (r) {
      add('Reading', r.title, r.author + ', ' + r.year + ': ' + r.why, '#/reading', [r.author], 1);
    });
    return idx;
  }

  function scoreToken(e, t) {
    var name = e.name.toLowerCase(), best = 0;
    if (name === t) best = 100;
    else if (e.keys.indexOf(t) >= 0) best = 85;
    else if (name.indexOf(t) === 0) best = 65;
    else if (e.keys.some(function (k) { return k.indexOf(t) === 0; })) best = 55;
    else if (new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(name)) best = 50;
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
        results.appendChild(h('div', { class: 'search-empty' }, 'Try: deadline, status, stand-up, estimate, risk, PRD, urgent, retro, 1:1, feedback, delegate, incident, postmortem, ADR, tech debt, 30-60-90, journal, week as a lead'));
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
        h('span', { class: 'badge' + (/^(Scenario|Practice)$/.test(e.type) ? ' badge-accent' : /^(Lesson|Explainer|Reading)$/.test(e.type) ? ' badge-ok' : /^(Tool|Playbook|Template)$/.test(e.type) ? ' badge-warn' : '') }, e.type),
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
      var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
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
})(window.LELT);
