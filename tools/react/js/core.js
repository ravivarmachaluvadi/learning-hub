/*
 * core.js - the small toolkit every other file uses (adapted from the Python Learning Tool's, which
 * adapted the UI Learning Tool's).
 *
 * Everything hangs off one global object, window.RLT (React Learning Tool), because the app is
 * opened straight from disk (file://), where browsers refuse ES modules. Load order is set in
 * index.html: vendor -> core -> runtime/preview/editor -> data -> views -> app.
 */
window.RLT = window.RLT || {};
(function (U) {
  'use strict';

  U.data = U.data || {};
  U.views = U.views || {};

  /* ---------- DOM helpers ---------- */

  /**
   * h('div', {class: 'card', onclick: fn}, 'text', childNode, [more, children])
   * Strings become text nodes; arrays are flattened; null/false children are skipped.
   * Attribute keys starting with "on" become event listeners; "html" sets innerHTML.
   */
  U.h = function (tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  };
  function append(el, kid) {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { append(el, k); }); return; }
    el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }

  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  U.esc = function (s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  U.debounce = function (fn, ms) {
    var t;
    return function () {
      var self = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  };

  /**
   * Tiny Markdown subset for the text in data/*.js:
   * paragraphs (blank line), "## " headings, "- " and "1. " lists, | tables | (header, |---|, rows; \| is a | in a cell),
   * ```jsx fenced code```, `code`, **bold**, *italic*, [text](https://...) and [[lesson:r-jsx]] links
 * (any kind U.linkFor knows: lesson, track, q, build, explain, term, ref, js; [[term:hydration|hydrating]] sets the text).
   * A fence with no language is JSX; ```js, ```css, ```html, ```java, ```text and ```console are the others.
   */
  U.md = function (src) {
    if (!src) return '';
    // fenced code blocks are lifted out first, because they may contain blank lines
    var fences = [];
    var text = String(src).trim().replace(/```([\w-]*)\n([\s\S]*?)\n```/g, function (_, lang, code) {
      fences.push({ lang: lang || 'jsx', code: code });
      return '\u0001' + (fences.length - 1) + '\u0001';
    });
    var blocks = text.split(/\n\s*\n/);
    return blocks.map(function (b) {
      var fence = /^\s*\u0001(\d+)\u0001\s*$/.exec(b);
      if (fence) {
        var f = fences[+fence[1]];
        return '<pre class="code cm-s-rlt" data-mode="' + U.esc(f.lang) + '">' + U.esc(f.code) + '</pre>';
      }
      var hm = /^(#{2,4}) (.+)$/.exec(b.trim());
      if (hm && b.trim().indexOf('\n') < 0) {
        var lvl = hm[1].length;
        return '<h' + lvl + '>' + inline(hm[2]) + '</h' + lvl + '>';
      }
      var lines = b.split('\n');
      if (lines.length >= 2 && lines.every(function (l) { return /^\s*\|.*\|\s*$/.test(l); }) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[1])) {
        var cells = function (l) { return l.trim().slice(1, -1).split(/(?<!\\)\|/).map(function (c) { return inline(c.trim().replace(/\\\|/g, '|')); }); };
        return '<div class="table-wrap"><table class="table"><thead><tr>' +
          cells(lines[0]).map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
          lines.slice(2).map(function (l) { return '<tr>' + cells(l).map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') +
          '</tbody></table></div>';
      }
      if (lines.every(function (l) { return /^\s*- /.test(l); })) {
        return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*- /, '')) + '</li>'; }).join('') + '</ul>';
      }
      if (lines.every(function (l) { return /^\s*\d+\. /.test(l); })) {
        // a list may be split by blank lines into one-item blocks: keep counting from its own number
        var start = parseInt(lines[0], 10);
        return '<ol' + (start > 1 ? ' start="' + start + '"' : '') + '>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*\d+\. /, '')) + '</li>'; }).join('') + '</ol>';
      }
      return '<p>' + inline(lines.join(' ')) + '</p>';
    }).join('');
  };
  function inline(s) {
    var codes = [];
    s = s.replace(/`([^`]+)`/g, function (_, c) { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = U.esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
      .replace(/\[\[(\w+):([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, kind, id, label) {
        return '<a href="' + U.linkFor(kind, id) + '">' + (label || U.labelFor(kind, id)) + '</a>';
      })
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return '<code>' + U.esc(codes[+i]) + '</code>'; });
  }
  /** One line of Markdown without the surrounding <p>. */
  U.mdInline = function (src) { return U.md(src).replace(/^<p>|<\/p>$/g, ''); };

  /** Colour the code blocks that U.md produced, once they are in the page. */
  U.enhance = function (root) {
    if (!window.CodeMirror || !window.CodeMirror.runMode) return root;
    var modes = { jsx: 'jsx', js: 'javascript', javascript: 'javascript', css: 'css', html: 'xml' };
    U.$$('pre.code[data-mode]', root).forEach(function (pre) {
      var mode = pre.getAttribute('data-mode');
      pre.removeAttribute('data-mode');
      if (!modes[mode]) return;
      var code = pre.textContent;
      pre.textContent = '';
      window.CodeMirror.runMode(code, modes[mode], pre);
    });
    return root;
  };

  /**
   * Route for a cross-reference such as ("lesson", "r-jsx"); also track:<id>, q:<interview
   * question>, build:<machine-coding problem>, explain:<explainer>, term:<glossary term>,
   * ref:<Reference entry> and js:<JavaScript for React entry>.
   */
  U.linkFor = function (kind, id) {
    var map = { lesson: '#/lessons/', track: '#/lessons?track=', q: '#/interview/', build: '#/build/', explain: '#/explain/',
      term: '#/glossary/', ref: '#/reference/', js: '#/javascript/' };
    return (map[kind] || '#/') + encodeURIComponent(id);
  };
  U.labelFor = function (kind, id) {
    var lists = { lesson: 'lessons', track: 'tracks', q: 'questions', build: 'builds', explain: 'explainers', term: 'glossary', ref: 'api', js: 'javascript' };
    var e = lists[kind] ? U.find(lists[kind], id) : null;
    return e ? U.esc(e.title || e.q || e.term || e.name) : U.esc(id);
  };

  /** Look an entry up by id in one of the data collections. */
  U.find = function (collection, id) {
    var list = U.data[collection] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  };

  /* ---------- storage: everything under the "rlt." prefix, never throws ---------- */

  var PREFIX = 'rlt.';
  U.store = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    del: function (key) {
      try { localStorage.removeItem(PREFIX + key); } catch (e) { /* storage blocked: nothing to delete */ }
    }
  };

  /* ---------- backup and restore: every "rlt." key in one JSON file ---------- */

  function toolKeys() {
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) keys.push(k);
      }
    } catch (e) { /* storage blocked: nothing to list */ }
    return keys;
  }

  U.backup = {
    APP: 'React Learning Tool',
    /** Everything the tool keeps in this browser, as {app, version, savedAt, data: {key: rawString}}. */
    collect: function () {
      var data = {};
      toolKeys().forEach(function (k) { try { data[k] = localStorage.getItem(k); } catch (e) { /* skip it */ } });
      return { app: U.backup.APP, version: 1, savedAt: new Date().toISOString(), data: data };
    },
    /** Look at a parsed file before restoring it: {ok, msg} or {ok, lessons, builds, cards, snippets, savedAt}. */
    inspect: function (obj) {
      if (!obj || obj.app !== U.backup.APP || !obj.data || typeof obj.data !== 'object') {
        return { ok: false, msg: 'This file is not a backup from the React Learning Tool, so nothing was changed.' };
      }
      function size(key) { try { return Object.keys(JSON.parse(obj.data[key] || '{}')).length; } catch (e) { return 0; } }
      return { ok: true, lessons: size(PREFIX + 'lessons.done'), builds: size(PREFIX + 'builds.done'), cards: size(PREFIX + 'cards.review'),
        snippets: size(PREFIX + 'playground.snippets'), savedAt: obj.savedAt };
    },
    /** Replace every "rlt." key with the backup's. If the browser refuses, put the old data back. */
    restore: function (obj) {
      var before = U.backup.collect().data;
      function write(data) {
        toolKeys().forEach(function (k) { localStorage.removeItem(k); });
        Object.keys(data).forEach(function (k) {
          if (k.indexOf(PREFIX) === 0 && typeof data[k] === 'string') localStorage.setItem(k, data[k]);
        });
      }
      try { write(obj.data); return true; } catch (e) {
        try { write(before); } catch (e2) { /* storage blocked: nothing more we can do */ }
        return false;
      }
    }
  };

  /** Save text as a file through the browser's download (works from file:// too). */
  /**
   * Save text as a file. Opened from disk or served, through the browser's download. Inside the private
   * claude.ai artifact the frame cannot download, so the "downloads" capability asks the viewer to save
   * it instead; claude.ai saves only some file types (.json and .txt among them), so for the others it
   * says to use Copy. (The same as the Claude Learning Tool's.)
   */
  U.download = function (filename, text, type) {
    function viaLink() {
      var a = U.h('a', { href: URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })), download: filename });
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }
    var claude = window.claude;
    if (!claude || typeof claude.use !== 'function') return viaLink();
    claude.use('downloads').then(function (dl) {
      if (!dl) return viaLink();
      return dl.save({ filename: filename, data: text }).then(null, function (e) {
        var code = e && e.code;
        if (code === 'declined') return;
        if (code === 'rejected_extension' || code === 'extension_not_enabled') U.toast('claude.ai cannot save ' + filename + ' as a file: use Copy instead.');
        else if (code === 'rate_limited') U.toast('A save is already waiting for your answer.');
        else U.toast('This file could not be saved here: use Copy instead.');
      });
    }, viaLink);
  };

  /* ---------- router: #/section/id?key=value ---------- */

  var routes = {};
  var current = null;

  U.route = function (section, view) { routes[section] = view; };

  U.parseHash = function (hash) {
    var h = (hash || location.hash || '').replace(/^#\/?/, '');
    var q = {};
    var qi = h.indexOf('?');
    if (qi >= 0) {
      h.slice(qi + 1).split('&').forEach(function (pair) {
        if (!pair) return;
        var kv = pair.split('=');
        q[decodeURIComponent(kv[0])] = decodeURIComponent(kv.slice(1).join('=') || '');
      });
      h = h.slice(0, qi);
    }
    var parts = h.split('/').filter(Boolean).map(decodeURIComponent);
    return { section: parts[0] || 'home', params: parts.slice(1), query: q };
  };

  U.go = function (hash) {
    if (location.hash === hash) U.render(); else location.hash = hash;
  };

  U.render = function () {
    var r = U.parseHash();
    var view = routes[r.section] || routes.home;
    var root = document.getElementById('view');
    if (current && current.view.destroy) {
      try { current.view.destroy(); } catch (e) { console.error(e); }
    }
    if (U.hideEditorTip) U.hideEditorTip();
    if (U.layout) U.layout.beforeRender();
    root.innerHTML = '';
    root.className = 'view view-' + r.section;
    current = { view: view, route: r };
    U.$$('.tabs a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-section') === r.section);
    });
    // on a phone the tabs scroll sideways: bring the page's own tab into view (not scrollIntoView, which would scroll the page too)
    var strip = U.$('.tabs'), tab = U.$('.tabs a.active');
    if (strip && tab) {
      var s = strip.getBoundingClientRect(), t = tab.getBoundingClientRect();
      if (t.left < s.left || t.right > s.right) strip.scrollLeft += t.left - s.left - (s.width - t.width) / 2;
    }
    if (r.section !== 'home') U.store.set('last', location.hash);
    view.render(root, r.params, r.query);
    if (U.layout) U.layout.afterRender();   // full screen stays for a page of the same kind, and ends on any other
    if (!r.query.keepScroll) window.scrollTo(0, 0);
  };

  /* ---------- small UI services ---------- */

  U.toast = function (msg) {
    var t = U.h('div', { class: 'toast', role: 'status' }, msg);
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2200);
  };

  U.copy = function (text) {
    function fallback() {
      var ta = U.h('textarea', { style: { position: 'fixed', opacity: '0' } });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); U.toast('Copied'); } catch (e) { U.toast('Copy failed - select the text and press Ctrl+C'); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { U.toast('Copied'); }, fallback);
    } else fallback();
  };

  /** Hand a component to the Playground and switch to it. */
  U.openInPlayground = function (snippet) {
    U.store.set('playground.incoming', { title: snippet.title || '', code: snippet.code || '', css: snippet.css || '' });
    U.go('#/playground');
  };

  /** A labelled "callout" box used for plain-JS comparisons, tips and warnings. */
  U.callout = function (kind, title, html) {
    return U.h('aside', { class: 'callout callout-' + kind },
      U.h('div', { class: 'callout-title' }, title),
      U.h('div', { class: 'callout-body', html: html }));
  };

  /** "m:ss" for a number of seconds. */
  U.clock = function (secs) {
    secs = Math.max(0, Math.floor(secs || 0));
    var s = secs % 60;
    return Math.floor(secs / 60) + ':' + (s < 10 ? '0' : '') + s;
  };

  U.plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : many); };
})(window.RLT);
