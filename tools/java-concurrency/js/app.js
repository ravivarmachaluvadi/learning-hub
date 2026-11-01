/*
 * app.js - start-up: the theme switch, the "where Java runs" badge, global search (Ctrl+K or /),
 * and the router. The Kotlin Learning Tool's, for Java concurrency.
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

  /* ---------- the runtime badge: whether, and on what, your Java runs ---------- */

  function setupRuntimeBadge() {
    var badge = document.getElementById('runtime-badge');
    var dlg = document.getElementById('runtime-dialog');
    U.run.onChange(function (info) {
      var short = info.state === 'loading' ? '…' : info.state === 'offline' ? 'Read' : info.state === 'error' ? 'Off' : info.state === 'warming' ? 'jc…' : 'jc';
      badge.innerHTML = '';
      badge.appendChild(h('span', { class: 'rb-long' }, info.label));
      badge.appendChild(h('span', { class: 'rb-short', 'aria-hidden': 'true' }, short));
      badge.setAttribute('data-state', info.state === 'warming' ? 'loading' : info.state === 'offline' ? 'error' : info.state);
      badge.setAttribute('data-runtime', info.runtime || '');
      badge.title = info.state === 'ready' ? 'Programs compile and run with ' + info.detail : (info.detail || info.label);
      U.$$('.runtime-card').forEach(function (el) { el.replaceWith(U.runtimeExplainer()); });
    });
    badge.addEventListener('click', function () {
      var body = document.getElementById('runtime-dialog-body');
      body.innerHTML = '';
      body.appendChild(h('h2', { style: { marginTop: 0 } }, 'Where your Java runs'));
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
      var built = (U.data.lessons || []).some(function (l) { return l.track === t.id; });
      add('Track', t.title, (built ? '' : '(batch ' + t.batch + ') ') + t.summary, '#/lessons?track=' + t.id, [t.level, 'track'].concat(t.keywords || []), 1.5);
    });
    add('Lesson', 'Review your missed quiz questions', 'Questions you missed in the lesson quizzes come back here until you know them.',
      '#/lessons/review', ['quiz', 'review', 'questions', 'test yourself', 'spaced repetition'], 2.5);
    add('Page', 'Interview Q&A', 'The Java concurrency questions interviews ask most: a 30-second answer, the full answer, follow-ups. Flashcards and a ★★★ fast track.', '#/interview',
      ['interview', 'questions', 'q&a', 'qa', 'flashcards', 'cards', 'prepare', 'job', 'fast track'], 2.5);
    add('Page', 'Flashcards', 'Answer out loud, reveal, grade yourself; cards come back just before you would forget them.', '#/interview/cards',
      ['flashcards', 'cards', 'spaced repetition', 'practise', 'practice', 'drill'], 2);
    (U.data.questions || []).forEach(function (q) {
      add('Question', q.q, q.short, '#/interview/' + q.id, (q.keywords || []).concat(['interview', 'question']), 1.9);
    });
    add('Page', 'Playground', 'Write any Java 25 and run it (preview features on), with an input box for IO.readln().', '#/playground',
      ['playground', 'run', 'editor', 'scratch', 'try', 'snippet', 'repl'], 2);
    add('Page', 'Where your Java runs', 'jclearn.cmd compiles and runs your code on your JDK 25; opened from disk, the tool is for reading.', '#/?at=how-it-runs',
      ['jclearn', 'server', 'javac', 'compiler', 'offline', 'runtime', 'start', 'install', 'jdk', 'jdk 25'], 1.5);
    add('Page', 'Glossary', 'Concurrency words in plain language: carrier thread, pinning, happens-before, and more.', '#/glossary',
      ['glossary', 'terms', 'definitions', 'words', 'vocabulary', 'jargon'], 2);
    (U.data.glossary || []).forEach(function (t) {
      add('Term', t.term, t.def, '#/glossary/' + t.id, t.keywords || [], 0.8);   // below lessons: a lesson teaches the term
    });
    add('Page', 'Explainers', 'Hard ideas taken apart a step at a time, with a picture, each step proved by a real run.', '#/explain',
      ['explainers', 'explainer', 'explain', 'step by step', 'visual', 'picture', 'how it works', 'animation'], 2.2);
    (U.data.explainers || []).forEach(function (x) {
      add('Explainer', x.title, x.summary, '#/explain/' + x.id, x.keywords || [], 2.2);
    });
    add('Page', 'The Spring map', 'Each Spring feature, the thread it runs on with and without virtual threads, and the lesson that explains it.', '#/spring', ['spring', 'map', 'thread', 'async', 'scheduled', 'tomcat', 'where does it run'], 1.5);
    ((U.data.springMap || {}).rows || []).forEach(function (r) {
      add('Spring map', r.feature, r.note, '#/spring', ['spring', r.feature], 0.8);
    });
    add('Page', 'Java versions', 'Every concurrency JEP from Java 19 to 27: preview or final, and what changed.', '#/versions',
      ['java versions', 'versions', 'jep', 'jeps', 'preview', 'final', 'release', 'java 21', 'java 24', 'java 25', 'java 26', 'java 27', 'lts'], 2.2);
    // batch 3: Then <-> now and the Reference
    add('Page', 'Then ↔ now', 'Concurrent Java the way it was written before Java 21, next to the Java 21 to 25 way: both whole programs that print the same.', '#/then-now',
      ['then and now', 'then now', 'old and new', 'before and after', 'modern java', 'migration', 'java 8', 'java 21', 'java 25'], 2.2);
    (U.data.thenNow || []).forEach(function (p) {
      add('Then ↔ now', p.title, p.note, '#/then-now/' + p.id, p.keywords || [], 1.5);
    });
    add('Page', 'Reference', 'The JDK\'s concurrency APIs: each with the Java release it arrived in, whether it is a preview, an example and what it prints.', '#/reference',
      ['reference', 'api', 'apis', 'javadoc', 'docs', 'since', 'methods', 'classes'], 2.2);
    (U.data.reference || []).forEach(function (e) {
      // only the entry's own names: a type's members should not crowd out the lesson that teaches the type
      add('Reference', e.title, e.summary, '#/reference/' + e.id, [e.name, e.title].concat(e.covers || []), 1.2);
    });
    // batch 5: the katas, the predictions (as one page: a single program's title would give its answer away) and the mock
    add('Page', 'Practice: katas', 'Checked exercises from easy to hard: the concurrency patterns interviews ask for, and old programs to rewrite the Java 25 way.',
      '#/practice', ['practice', 'kata', 'katas', 'exercises', 'exercise', 'problems', 'coding', 'drill', 'challenges'], 2.4);
    add('Page', 'The old way to Java 25', 'Katas that start from a working program, written the way it was before Java 21, and ask for the Java 25 way.',
      '#/practice?kind=rewrite', ['rewrite', 'rewrites', 'modernise', 'modernize', 'refactor', 'migrate'], 2.2);
    (U.data.katas || []).forEach(function (k) {
      add('Kata', k.title, k.summary, '#/practice/' + k.id, (k.keywords || []).concat(['kata']), 0);
      idx[idx.length - 1].factor = 0.6;    // practice ranks below the lessons and questions that teach the same words
    });
    add('Page', 'Predict the output', 'Short programs built around the traps of concurrent Java: read, type what each prints, see why.', '#/predict',
      ['predict', 'output', 'what does this print', 'trap', 'traps', 'quiz', 'puzzle', 'puzzles'], 2.2);
    add('Page', 'Mock interview', 'A timed rehearsal: questions answered out loud, then predictions, then a kata against a clock, and a scorecard.', '#/mock',
      ['mock', 'mock interview', 'rehearse', 'rehearsal', 'practice interview', 'timed'], 2.2);
    return idx;
  }

  function scoreToken(e, t) {
    var name = e.name.toLowerCase(), inName = name.indexOf(t) >= 0, best = 0;
    if (name === t) best = 100;
    else if (e.keys.indexOf(t) >= 0) best = inName ? 95 : 85;   // a keyword also in the title: the page is about it
    else if (name.indexOf(t) === 0) best = 65;
    else if (e.keys.some(function (k) { return k.indexOf(t) === 0; })) best = inName ? 60 : 55;
    else if (inName) best = 40;
    else if (e.keys.some(function (k) { return k.indexOf(t) >= 0; })) best = 30;
    else if (t.length >= 3 && e.sub.toLowerCase().indexOf(t) >= 0) best = 8;
    return best;
  }

  U.search = function (q) {
    if (!index) index = buildIndex();
    var tokens = String(q).toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    var out = [], phrase = tokens.join(' ');
    index.forEach(function (e) {
      var total = 0;
      for (var i = 0; i < tokens.length; i++) {
        var s = scoreToken(e, tokens[i]);
        if (!s) return;
        total += s;
      }
      // the words together, as a keyword or in the title ("data class"), beat the same words apart
      if (tokens.length > 1 && (e.keys.indexOf(phrase) >= 0 || e.name.toLowerCase().indexOf(phrase) >= 0)) total += 30;
      out.push({ e: e, s: total * (e.factor || 0.8 + e.weight * 0.1) });
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
        results.appendChild(h('div', { class: 'search-empty' }, 'Try: volatile, deadlock, ConcurrentHashMap, CompletableFuture, virtual thread, pinning, Semaphore, ThreadLocal, thread dump, Spring Boot'));
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
        h('span', { class: 'badge' + (e.type === 'Lesson' || e.type === 'Kata' ? ' badge-ok' : e.type === 'Question' ? ' badge-warn' : e.type === 'Term' ? '' : ' badge-accent') }, e.type),
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
})(window.JCLT);
