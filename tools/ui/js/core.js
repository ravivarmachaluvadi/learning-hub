/*
 * core.js - the small toolkit every other file uses.
 *
 * Everything hangs off one global object, window.UILT (UI Learning Tool), because the app is opened
 * straight from disk (file://), where browsers refuse ES modules. Load order is set in index.html:
 * vendor -> core -> preview/editor -> data -> views -> app.
 */
window.UILT = window.UILT || {};
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
   * Tiny Markdown subset for the descriptions in data/*.js:
   * paragraphs (blank line), "- " bullet lists, `code`, **bold**, *italic*, [text](url),
   * and [[css:display]] / [[html:a]] / [[js:events]] / [[lesson:css-box]] / [[term:dom]] /
   * [[recipe:tabs]] / [[recreate:nav-bar]] links.
   */
  U.md = function (src) {
    if (!src) return '';
    // fenced code blocks (```html ... ```) are lifted out first, because they may contain blank lines
    var fences = [];
    var text = String(src).trim().replace(/```(\w*)\n([\s\S]*?)\n```/g, function (_, lang, code) {
      fences.push({ lang: lang || 'html', code: code });
      return '\u0001' + (fences.length - 1) + '\u0001';
    });
    var blocks = text.split(/\n\s*\n/);
    return blocks.map(function (b) {
      var fence = /^\s*\u0001(\d+)\u0001\s*$/.exec(b);
      if (fence) {
        var f = fences[+fence[1]];
        return '<pre class="code cm-s-uilt" data-mode="' + U.esc(f.lang) + '">' + U.esc(f.code) + '</pre>';
      }
      var hm = /^(#{2,4}) (.+)$/.exec(b.trim());
      if (hm && b.trim().indexOf('\n') < 0) {
        var lvl = hm[1].length;
        return '<h' + lvl + '>' + inline(hm[2]) + '</h' + lvl + '>';
      }
      var lines = b.split('\n');
      if (lines.every(function (l) { return /^\s*- /.test(l); })) {
        return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*- /, '')) + '</li>'; }).join('') + '</ul>';
      }
      if (lines.every(function (l) { return /^\s*\d+\. /.test(l); })) {
        return '<ol>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*\d+\. /, '')) + '</li>'; }).join('') + '</ol>';
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

  /** Colour the code blocks that U.md produced, once they are in the page. */
  U.enhance = function (root) {
    if (!window.CodeMirror || !window.CodeMirror.runMode) return root;
    var modes = { html: 'htmlmixed', css: 'css', js: 'javascript', javascript: 'javascript', java: 'text/x-java' };
    U.$$('pre.code[data-mode]', root).forEach(function (pre) {
      var mode = pre.getAttribute('data-mode');
      if (mode === 'text') return;
      var code = pre.textContent;
      pre.textContent = '';
      window.CodeMirror.runMode(code, modes[mode] || mode, pre);
      pre.removeAttribute('data-mode');
    });
    return root;
  };

  /** Route for a cross-reference such as ("css", "display") or ("html", "a"). */
  U.linkFor = function (kind, id) {
    var map = { css: '#/css/', html: '#/html/', js: '#/js/', lesson: '#/lessons/', explain: '#/explain/', term: '#/glossary/', recipe: '#/recipes/', recreate: '#/recreate/' };
    return (map[kind] || '#/') + encodeURIComponent(id);
  };
  U.labelFor = function (kind, id) {
    if (kind === 'html') return '&lt;' + U.esc(id) + '&gt;';
    if (kind === 'css') return U.esc(id);
    if (kind === 'lesson') { var l = U.find('lessons', id); return l ? U.esc(l.title) : U.esc(id); }
    if (kind === 'js') { var t = U.find('jsTopics', id); return t ? U.esc(t.title) : U.esc(id); }
    if (kind === 'explain') { var e = U.find('explainers', id); return e ? U.esc(e.title) : U.esc(id); }
    if (kind === 'term') { var g = U.find('glossary', id); return g ? U.esc(g.term) : U.esc(id); }
    if (kind === 'recipe') { var r = U.find('recipes', id); return r ? U.esc(r.title) : U.esc(id); }
    if (kind === 'recreate') { var c = U.find('recreate', id); return c ? U.esc(c.title) : U.esc(id); }
    return U.esc(id);
  };

  /** Look an entry up by id in one of the data collections. */
  U.find = function (collection, id) {
    var list = U.data[collection] || [];
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.id === id || e.tag === id || e.name === id) return e;
    }
    return null;
  };

  /* ---------- storage: everything under the "uilt." prefix, never throws ---------- */

  U.store = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem('uilt.' + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem('uilt.' + key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    del: function (key) {
      try { localStorage.removeItem('uilt.' + key); } catch (e) { /* storage blocked: nothing to delete */ }
    }
  };

  /* ---------- backup and restore: every "uilt." key in one JSON file ---------- */

  function toolKeys() {
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('uilt.') === 0) keys.push(k);
      }
    } catch (e) { /* storage blocked: nothing to list */ }
    return keys;
  }

  U.backup = {
    APP: 'UI Learning Tool',
    /** Everything the tool keeps in this browser, as {app, version, savedAt, data: {key: rawString}}. */
    collect: function () {
      var data = {};
      toolKeys().forEach(function (k) { try { data[k] = localStorage.getItem(k); } catch (e) { /* skip it */ } });
      return { app: U.backup.APP, version: 1, savedAt: new Date().toISOString(), data: data };
    },
    /** Look at a parsed file before restoring it: {ok, msg} or {ok, lessons, snippets, savedAt}. */
    inspect: function (obj) {
      if (!obj || obj.app !== U.backup.APP || !obj.data || typeof obj.data !== 'object') {
        return { ok: false, msg: 'This file is not a backup from the UI Learning Tool, so nothing was changed.' };
      }
      function size(key) { try { return Object.keys(JSON.parse(obj.data[key] || '{}')).length; } catch (e) { return 0; } }
      return { ok: true, lessons: size('uilt.lessons.done'), snippets: size('uilt.playground.snippets'), savedAt: obj.savedAt };
    },
    /** Replace every "uilt." key with the backup's. If the browser refuses, put the old data back. */
    restore: function (obj) {
      var before = U.backup.collect().data;
      function write(data) {
        toolKeys().forEach(function (k) { localStorage.removeItem(k); });
        Object.keys(data).forEach(function (k) {
          if (k.indexOf('uilt.') === 0 && typeof data[k] === 'string') localStorage.setItem(k, data[k]);
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
    if (U.layout) U.layout.beforeRender();
    root.innerHTML = '';
    root.className = 'view view-' + r.section;
    current = { view: view, route: r };
    U.$$('.tabs a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-section') === r.section);
    });
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

  /** Hand a snippet to the Playground and switch to it. */
  U.openInPlayground = function (snippet) {
    U.store.set('playground.incoming', {
      title: snippet.title || 'From ' + (U.parseHash().params[0] || 'reference'),
      html: snippet.html || '', css: snippet.css || '', js: snippet.js || ''
    });
    U.go('#/playground');
  };

  /** Pretty-print a CSS block: "a{b:c;d:e}" style strings from data become readable. */
  U.formatCss = function (css) {
    return String(css || '').trim();
  };

  /** A collapsible section: <details> with a styled summary. */
  U.section = function (title, body, open) {
    return U.h('details', { class: 'fold', open: open !== false }, U.h('summary', null, title), body);
  };

  /** A labelled "callout" box used for Java analogies, tips and warnings. */
  U.callout = function (kind, title, html) {
    return U.h('aside', { class: 'callout callout-' + kind },
      U.h('div', { class: 'callout-title' }, title),
      U.h('div', { class: 'callout-body', html: html }));
  };

  /* ---------- sample media, generated so the tool works offline ----------
   * Demo code refers to plain file names (src="landscape.svg"), which read naturally. Before a preview
   * is rendered or exported, U.fillMedia swaps each name for an embedded data: URL, so no files or
   * network are needed. */

  /* encodeURIComponent leaves ( ) ' ! * alone, but an unquoted CSS url(...) ends at the first ")":
     the landscape's own url(#s) gradient reference broke background-image: url(landscape.svg). */
  function svgUrl(svg) {
    return 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/[()'!*]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
  }

  /** A 320x200 landscape picture. */
  U.sampleImage = function () {
    return svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">' +
      '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ec5ff"/><stop offset="1" stop-color="#e0f0ff"/></linearGradient></defs>' +
      '<rect width="320" height="200" fill="url(#s)"/><circle cx="250" cy="55" r="26" fill="#ffd34d"/>' +
      '<path d="M0 160 L70 90 L120 140 L180 70 L260 150 L320 110 L320 200 L0 200 Z" fill="#3f8f5b"/>' +
      '<path d="M0 185 L90 150 L170 180 L250 155 L320 175 L320 200 L0 200 Z" fill="#2c6b43"/></svg>');
  };

  /** A 160x240 portrait picture (tall), useful for object-fit demos. */
  function portrait() {
    return svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="240" viewBox="0 0 160 240">' +
      '<rect width="160" height="240" fill="#ffe7c2"/><rect y="170" width="160" height="70" fill="#d98c3f"/>' +
      '<rect x="66" y="80" width="28" height="100" fill="#7a4a1f"/><circle cx="80" cy="70" r="46" fill="#3f8f5b"/>' +
      '<circle cx="128" cy="30" r="16" fill="#ffb000"/></svg>');
  }

  /** A 96x96 round avatar. */
  function avatar() {
    return svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
      '<rect width="96" height="96" fill="#cfe0ff"/><circle cx="48" cy="38" r="18" fill="#4f6fd8"/>' +
      '<path d="M14 96 C18 66 78 66 82 96 Z" fill="#4f6fd8"/></svg>');
  }

  /** A small repeating tile, for background-repeat demos. */
  function tile() {
    return svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
      '<rect width="40" height="40" fill="#fff4d6"/><circle cx="20" cy="20" r="11" fill="#f08c00"/></svg>');
  }

  U.sampleFiles = {
    'landscape.svg': U.sampleImage,
    'portrait.svg': portrait,
    'avatar.svg': avatar,
    'tile.svg': tile,
    'beep.wav': function () { return U.sampleWav(); },
    'clip.webm': function () { return videoUrl || ''; }
  };

  /**
   * A 3-second sample video, recorded once from an animated <canvas> with MediaRecorder and kept as
   * a data: URL. Calls cb() when ready (immediately if it already is). Silently skipped if the
   * browser cannot record.
   */
  var videoUrl = null, videoWaiters = null;
  U.ensureSampleVideo = function (cb) {
    if (videoUrl) { cb(); return; }
    if (videoWaiters) { videoWaiters.push(cb); return; }
    videoWaiters = [cb];
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 320; canvas.height = 180;
      var ctx = canvas.getContext('2d');
      var stream = canvas.captureStream(30);
      var types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      var mime = types.filter(function (t) { return window.MediaRecorder && MediaRecorder.isTypeSupported(t); })[0];
      if (!mime) { videoWaiters = null; return; }
      var rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 350000 });
      var chunks = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        var fr = new FileReader();
        fr.onload = function () {
          videoUrl = fr.result;
          var w = videoWaiters; videoWaiters = [];
          w.forEach(function (f) { try { f(); } catch (e) { console.error(e); } });
        };
        fr.readAsDataURL(new Blob(chunks, { type: 'video/webm' }));
      };
      var t0 = performance.now();
      var frame = function () {
        var t = (performance.now() - t0) / 1000;
        var sky = ctx.createLinearGradient(0, 0, 0, 180);
        sky.addColorStop(0, '#8ec5ff'); sky.addColorStop(1, '#e0f0ff');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, 320, 180);
        ctx.fillStyle = '#3f8f5b'; ctx.fillRect(0, 140, 320, 40);
        var x = 30 + (t / 3) * 260, y = 125 - Math.abs(Math.sin(t * 3.2)) * 80;
        ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1d2433'; ctx.font = 'bold 15px sans-serif';
        ctx.fillText('Sample video  0:0' + Math.min(3, Math.floor(t)), 10, 22);
        if (t < 3) requestAnimationFrame(frame); else rec.stop();
      };
      rec.start(250);
      frame();
    } catch (e) { videoWaiters = null; }
  };

  /** A one-second 440 Hz beep as a WAV data URL, for the <audio> demo. */
  var wavCache = null;
  U.sampleWav = function () {
    if (wavCache) return wavCache;
    var rate = 8000, n = rate, bytes = new Uint8Array(44 + n);
    var dv = new DataView(bytes.buffer);
    function str(o, s) { for (var i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); }
    str(0, 'RIFF'); dv.setUint32(4, 36 + n, true); str(8, 'WAVE'); str(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, rate, true); dv.setUint32(28, rate, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
    str(36, 'data'); dv.setUint32(40, n, true);
    for (var i = 0; i < n; i++) {
      var fade = Math.min(1, i / 400, (n - i) / 400);
      bytes[44 + i] = 128 + Math.round(60 * fade * Math.sin(2 * Math.PI * 440 * i / rate));
    }
    var bin = '';
    for (var j = 0; j < bytes.length; j++) bin += String.fromCharCode(bytes[j]);
    wavCache = 'data:audio/wav;base64,' + btoa(bin);
    return wavCache;
  };

  /** Swap the sample file names (landscape.svg, beep.wav, ...) for embedded data: URLs. */
  U.fillMedia = function (code) {
    return String(code || '').replace(/(^|[^\w./-])(landscape\.svg|portrait\.svg|avatar\.svg|tile\.svg|beep\.wav|clip\.webm)(?![\w.])/g,
      function (_, before, name) { return before + U.sampleFiles[name](); });
  };
})(window.UILT);
