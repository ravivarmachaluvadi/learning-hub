/*
 * core.js - the small toolkit every other file uses.
 *
 * Everything hangs off one global object, window.CLT (Claude Learning Tool), because the app is
 * opened straight from disk (file://), where browsers refuse ES modules. Load order is set in
 * index.html: core -> lint -> data -> views -> app.
 */
window.CLT = window.CLT || {};
(function (U) {
  'use strict';

  U.data = U.data || {};
  U.views = U.views || {};
  U.tools = U.tools || {};

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
        else if (k === 'value') el.value = v;
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

  U.plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); };

  /**
   * Tiny Markdown subset for the text in data/*.js:
   * paragraphs (blank line), "## " headings, "- " bullet lists, "1. " numbered lists, "> " quotes,
   * `code`, **bold**, *italic*, [text](url), and [[lesson:plan-mode]] / [[tool:crisp]] /
   * [[cheat:clear]] / [[term:compaction]] / [[explainer:context-fills]] / [[scenario:context-85]] links (the kinds are in
   * ROUTES below; an optional "|label" after the id replaces the link text).
   *
   * Within a block, lines are read in runs of one kind, so a heading, a sentence and the list after
   * it can sit on consecutive lines without blank lines between them.
   */
  function lineKind(l) {
    if (/^\s*#{2,4} /.test(l)) return 'h';
    if (/^\s*- /.test(l)) return 'ul';
    if (/^\s*\d+\. /.test(l)) return 'ol';
    if (/^\s*>/.test(l)) return 'quote';
    if (/^\s*\|/.test(l)) return 'table';
    return 'p';
  }
  var FENCE = /^(```|~~~)[ \t]*([\w+#-]*)[ \t]*\n([\s\S]*?)\n\1[ \t]*$/gm;
  U.md = function (src) {
    if (!src) return '';
    // code blocks hold blank lines, so they are taken out before the text is split into paragraphs
    var codes = [];
    var text = String(src).replace(/\r\n/g, '\n').replace(FENCE, function (_, fence, lang, code) {
      codes.push(codeBlock(lang, code));
      return '\n\u0001' + (codes.length - 1) + '\u0001\n';
    });
    var out = [];
    text.trim().split(/\n\s*\n/).forEach(function (b) {
      var code = /^\s*\u0001(\d+)\u0001\s*$/.exec(b);
      if (code) { out.push(codes[+code[1]]); return; }
      var lines = b.split('\n'), i = 0;
      while (i < lines.length) {
        var kind = lineKind(lines[i]);
        if (kind === 'h') {
          var hm = /^\s*(#{2,4}) (.+)$/.exec(lines[i++]);
          out.push('<h' + hm[1].length + '>' + inline(hm[2]) + '</h' + hm[1].length + '>');
          continue;
        }
        var run = [];
        while (i < lines.length && lineKind(lines[i]) === kind) run.push(lines[i++]);
        if (kind === 'ul') out.push('<ul>' + run.map(function (l) { return '<li>' + inline(l.replace(/^\s*- /, '')) + '</li>'; }).join('') + '</ul>');
        else if (kind === 'ol') {
          // a list that a code block interrupted carries on numbering from where it was ("3. ...")
          var first = +/^\s*(\d+)\./.exec(run[0])[1];
          out.push('<ol' + (first > 1 ? ' start="' + first + '"' : '') + '>' + run.map(function (l) { return '<li>' + inline(l.replace(/^\s*\d+\. /, '')) + '</li>'; }).join('') + '</ol>');
        }
        else if (kind === 'quote') out.push('<blockquote>' + U.md(run.map(function (l) { return l.replace(/^\s*> ?/, ''); }).join('\n')) + '</blockquote>');
        else if (kind === 'table') out.push(table(run));
        else out.push('<p>' + inline(run.join(' ')) + '</p>');
      }
    });
    // a code block written right under a line of text stays inside that paragraph's run: put it back
    return out.join('').replace(/\u0001(\d+)\u0001/g, function (_, n) { return '</p>' + codes[+n] + '<p>'; }).replace(/<p>\s*<\/p>/g, '');
  };
  function codeBlock(lang, code) {
    return '<div class="code-block"><div class="code-head"><span class="code-lang">' + U.esc(lang || '') + '</span>' +
      '<button class="btn btn-small code-copy" type="button">Copy</button></div><pre><code>' + U.esc(code) + '</code></pre></div>';
  }
  function cells(line) {
    // split at | but not at \| or inside a [[kind:id|label]] link
    var s = line.trim().replace(/^\|/, '').replace(/\|$/, ''), out = [], cur = '', depth = 0;
    for (var i = 0; i < s.length; i++) {
      if (s[i] === '[' && s[i + 1] === '[') { depth++; cur += '[['; i++; continue; }
      if (s[i] === ']' && s[i + 1] === ']' && depth) { depth--; cur += ']]'; i++; continue; }
      if (s[i] === '|' && s[i - 1] !== '\\' && !depth) { out.push(cur); cur = ''; continue; }
      cur += s[i];
    }
    out.push(cur);
    return out.map(function (c) { return c.trim().replace(/\\\|/g, '|'); });
  }
  function table(lines) {
    var rows = lines.filter(function (l) { return !/^\s*\|[\s:|-]+\|\s*$/.test(l); }).map(cells);
    if (!rows.length) return '';
    return '<div class="table-wrap"><table class="table md-table"><thead><tr>' +
      rows[0].map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.slice(1).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div>';
  }
  function inline(s) {
    var codes = [];
    s = s.replace(/`([^`]+)`/g, function (_, c) { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = U.esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
      .replace(/\[\[(\w+):([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, kind, id, label) {
        return '<a href="' + U.linkFor(kind, id) + '">' + (label || U.labelFor(kind, id)) + '</a>';
      })
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return '<code>' + U.esc(codes[+i]) + '</code>'; });
  }
  /** One line of Markdown without the surrounding <p>. */
  U.mdInline = function (src) { return U.md(src).replace(/^<p>|<\/p>$/g, ''); };
  /** Markdown with its marks removed: for search, titles and copied text. */
  U.plain = function (src) {
    return String(src || '').replace(/`/g, '').replace(/\*\*/g, '').replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, '$1$2')
      .replace(/\[\[\w+:([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, id, l) { return l || id; });
  };

  /** Route for a cross-reference such as ("cheat", "clear") or ("tool", "crisp"). */
  var ROUTES = { tool: '#/tools/', playbook: '#/playbooks/', kit: '#/kit/', prompt: '#/prompts?p=', cheat: '#/cheatsheet?c=',
    track: '#/lessons?track=', lesson: '#/lessons/', explainer: '#/explain/', term: '#/glossary/', scenario: '#/scenarios/' };
  var COLLECTIONS = { tool: 'tools', playbook: 'playbooks', kit: 'kit', prompt: 'prompts', cheat: 'cheats', track: 'tracks',
    lesson: 'lessons', explainer: 'explainers', term: 'glossary', scenario: 'scenarios' };
  U.linkFor = function (kind, id) {
    return (ROUTES[kind] || '#/') + encodeURIComponent(id);
  };
  U.labelFor = function (kind, id) {
    var e = COLLECTIONS[kind] ? U.find(COLLECTIONS[kind], id) : null;
    if (!e) return U.esc(id);
    if (kind === 'track') return U.esc(e.name);
    if (kind === 'cheat') return '<code>' + U.esc(e.name) + '</code>';
    if (kind === 'term') return U.esc(e.term);
    return U.esc(e.title);
  };
  /** The badge word for a kind of link, as in "Lesson" or "Command". */
  U.kindLabel = function (kind) {
    return { tool: 'Tool', playbook: 'Playbook', kit: 'Kit', prompt: 'Prompt', cheat: 'Command', track: 'Track',
      lesson: 'Lesson', explainer: 'Explainer', term: 'Term', scenario: 'Scenario' }[kind] || kind;
  };
  /** A list of cross-references as a <ul>: each a badge with its kind, then the linked name. */
  U.linkList = function (refs, cls) {
    return U.h('ul', { class: 'plain-list ' + (cls || '') }, (refs || []).map(function (r) {
      var m = /^(\w+):(.+)$/.exec(r);
      return U.h('li', null, U.h('span', { class: 'badge' }, U.kindLabel(m[1])), ' ', U.h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) }));
    }));
  };

  /** Look an entry up by id in one of the data collections. */
  U.find = function (collection, id) {
    var list = U.data[collection] || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };
  U.track = function (id) { return U.find('tracks', id); };

  /* ---------- storage: everything under the "clt." prefix, never throws ---------- */

  U.store = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem('clt.' + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem('clt.' + key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    del: function (key) {
      try { localStorage.removeItem('clt.' + key); } catch (e) { /* storage blocked: nothing to delete */ }
    }
  };

  /* ---------- backup and restore: every "clt." key in one JSON file ---------- */

  function toolKeys() {
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('clt.') === 0) keys.push(k);
      }
    } catch (e) { /* storage blocked: nothing to list */ }
    return keys;
  }

  U.backup = {
    APP: 'Claude Learning Tool',
    /** Everything the tool keeps in this browser, as {app, version, savedAt, data: {key: rawString}}. */
    collect: function () {
      var data = {};
      toolKeys().forEach(function (k) { try { data[k] = localStorage.getItem(k); } catch (e) { /* skip it */ } });
      return { app: U.backup.APP, version: 1, savedAt: new Date().toISOString(), data: data };
    },
    /** Look at a parsed file before restoring it: {ok, msg} or {ok, starred, drafts, lessons, scenarios, assessments, savedAt}. */
    inspect: function (obj) {
      if (!obj || obj.app !== U.backup.APP || !obj.data || typeof obj.data !== 'object') {
        return { ok: false, msg: 'This file is not a backup from the Claude Learning Tool, so nothing was changed.' };
      }
      function size(key) { try { return Object.keys(JSON.parse(obj.data[key] || '{}')).length; } catch (e) { return 0; } }
      var drafts = Object.keys(obj.data).filter(function (k) { return k.indexOf('clt.tool.') === 0; }).length;
      var assessments = 0;
      try { assessments = (JSON.parse(obj.data['clt.assess'] || '{}').history || []).length; } catch (e) { assessments = 0; }
      return { ok: true, starred: size('clt.prompts.starred'), drafts: drafts, lessons: size('clt.quiz.scores'),
        scenarios: size('clt.scenarios.done'), assessments: assessments, savedAt: obj.savedAt };
    },
    /** Replace every "clt." key with the backup's. If the browser refuses, put the old data back. */
    restore: function (obj) {
      var before = U.backup.collect().data;
      function write(data) {
        toolKeys().forEach(function (k) { localStorage.removeItem(k); });
        Object.keys(data).forEach(function (k) {
          if (k.indexOf('clt.') === 0 && typeof data[k] === 'string') localStorage.setItem(k, data[k]);
        });
      }
      try { write(obj.data); return true; } catch (e) {
        try { write(before); } catch (e2) { /* storage blocked: nothing more we can do */ }
        return false;
      }
    }
  };

  /**
   * Save text as a file. Opened from disk, through the browser's download. Inside the private claude.ai
   * artifact the frame cannot download, so the "downloads" capability asks the viewer to save it
   * instead; claude.ai saves only some file types (.md, .json and .txt among them, not .js, .ps1 or
   * .yml), so for the others it says to use Copy.
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

  U.localDate = function (d) {
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };

  /* ---------- router: #/section/id?key=value ---------- */

  var routes = {};
  var current = null;
  // sections without a tab of their own light up the tab they belong to
  var TAB_OF = { explain: 'lessons', glossary: 'lessons', assess: 'scenarios', progress: 'scenarios' };

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
    root.innerHTML = '';
    root.className = 'view view-' + (routes[r.section] ? r.section : 'home');
    current = { view: view, route: r };
    U.$$('.tabs a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-section') === (TAB_OF[r.section] || r.section));
    });
    if (r.section !== 'home') U.store.set('last', location.hash);
    view.render(root, r.params, r.query);
    if (!r.query.keepScroll) window.scrollTo(0, 0);
  };

  /* ---------- small UI services ---------- */

  U.toast = function (msg) {
    var t = U.h('div', { class: 'toast', role: 'status' }, msg);
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2400);
  };

  /** Copy text to the clipboard; "done" is the message shown when it worked. */
  U.copy = function (text, done) {
    U.lastCopied = text;   // the browser tests read this: a headless browser has no clipboard to look at
    function fallback() {
      var ta = U.h('textarea', { style: { position: 'fixed', opacity: '0' } });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); U.toast(done || 'Copied'); } catch (e) { U.toast('Copy failed - select the text and press Ctrl+C'); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { U.toast(done || 'Copied'); }, fallback);
    } else fallback();
  };

  // every code block's Copy button: the blocks come from U.md anywhere on the page, so one listener serves them all
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.code-copy') : null;
    if (btn) U.copy(btn.closest('.code-block').querySelector('pre').textContent);
  });

  /**
   * "Ask Claude for feedback": the page cannot call Claude itself (that would need an API key and
   * cost money), so it copies a ready-made prompt for you to paste into Claude.
   */
  U.askClaude = function (prompt) {
    U.copy(prompt, 'Prompt copied - paste it into Claude');
  };

  /** A collapsible section: <details> with a styled summary. */
  U.section = function (title, body, open) {
    return U.h('details', { class: 'fold', open: open !== false }, U.h('summary', null, title), body);
  };

  /** A labelled "callout" box: kind is analogy, tip, warn or info. */
  U.callout = function (kind, title, html) {
    return U.h('aside', { class: 'callout callout-' + kind },
      U.h('div', { class: 'callout-title' }, title),
      U.h('div', { class: 'callout-body', html: html }));
  };

  /** A track's coloured badge. */
  U.trackBadge = function (id) {
    var t = U.track(id);
    return U.h('span', { class: 'badge track-badge track-' + id }, t ? t.short || t.name : id);
  };

  /** Shuffle an array in place and return it. */
  U.shuffle = function (a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  };
})(window.CLT);
