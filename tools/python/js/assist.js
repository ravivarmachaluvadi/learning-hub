/*
 * assist.js - "learn while you type" in every editable Python editor: autocomplete and hover.
 *
 *   Autocomplete opens by itself after two letters of a name, and after a dot; Ctrl+Space opens it
 *   any time. It offers keywords, built-in functions, constants and exceptions, your own names (from
 *   def, class, assignments, parameters, for, import, with/except ... as), the methods of str, list,
 *   dict, set and tuple after a dot (the type guessed from how the name was assigned, when it can
 *   be), and a module's members after "module.". Nothing is offered inside a string or a comment.
 *   The box beside the list shows the highlighted name's Reference entry.
 *   Hover a name to see its Reference entry (data/reference-*.js), with a link to it; Ctrl+click
 *   opens it.
 *
 * Both work from the code's text alone: nothing runs, so a guess about a value's type can be wrong.
 *
 *   PYLT.assist.complete(code, index) -> {from, to, list: [{text, kind, detail, entry?}]} or null
 *   PYLT.assist.lookup(word, {attr})   -> the Reference entries for a name (attr: it follows a dot)
 *   PYLT.assist.attach(cm)             wires both into a CodeMirror editor (js/editor.js calls it)
 */
(function (U) {
  'use strict';
  var h = U.h;
  var METHOD_GROUPS = ['str', 'list', 'dict', 'set', 'tuple'];
  var NAME_RE = /[A-Za-z_][A-Za-z0-9_]*$/;
  var MAX = 80;

  /* ---------------------------------------------------------------- the index of Reference names */

  var idx = null;
  function index() {
    if (idx) return idx;
    idx = { names: {}, methods: {}, modules: {}, keywords: [], builtins: [] };
    function put(map, name, e) { (map[name] = map[name] || []).push(e); }
    (U.data.reference || []).forEach(function (e) {
      var names = [e.name].concat(e.covers || []);
      if (METHOD_GROUPS.indexOf(e.group) >= 0) { names.forEach(function (n) { put(idx.methods, n, e); }); return; }
      if (e.group === 'operators') return;
      names.forEach(function (n) { put(idx.names, n, e); });
      if (e.group === 'modules') idx.modules[e.name] = e;
      if (e.group === 'keywords') names.forEach(function (n) { if (n !== '_') idx.keywords.push(n); });
      if (e.group === 'functions' || e.group === 'constants' || e.group === 'exceptions') {
        names.forEach(function (n) { idx.builtins.push({ name: n, entry: e }); });
      }
    });
    ['True', 'False', 'None'].forEach(function (k) { if (idx.keywords.indexOf(k) < 0) idx.keywords.push(k); });
    return idx;
  }

  /** The Reference entries for a name; attr: the name follows a dot, so it is a method. */
  function lookup(word, opts) {
    var ix = index(), attr = opts && opts.attr;
    if (!word) return [];
    if (attr) {
      var found = (ix.methods[word] || []).slice();
      if (/^__\w+__$/.test(word)) found = found.concat(ix.names[word] || []);
      return found;
    }
    return (ix.names[word] || []).slice();
  }

  /* ---------------------------------------------------------------- reading the code */

  /** Where index falls: 'code', 'string' or 'comment'. Triple quotes and escapes are understood. */
  function contextAt(code, at) {
    var i = 0, n = Math.min(at, code.length);
    while (i < n) {
      var c = code.charAt(i);
      if (c === '#') {
        var e = code.indexOf('\n', i);
        if (e < 0 || e >= at) return 'comment';
        i = e + 1;
        continue;
      }
      if (c === '"' || c === "'") {
        var triple = code.substr(i, 3) === c + c + c, j = i + (triple ? 3 : 1);
        for (;;) {
          if (j >= code.length) return j >= at ? 'string' : 'code';
          var d = code.charAt(j);
          if (d === '\\') { j += 2; continue; }
          if (triple ? code.substr(j, 3) === c + c + c : d === c) { j += triple ? 3 : 1; break; }
          if (d === '\n' && !triple) break;
          j++;
        }
        if (j > at || (j === at && code.charAt(at - 1) !== c)) return 'string';
        i = j;
        continue;
      }
      i++;
    }
    return 'code';
  }

  /** The code with strings and comments blanked out (positions kept), for scanning names. */
  function codeOnly(code) {
    return code.replace(/#[^\n]*/g, function (m) { return m.replace(/[^\n]/g, ' '); })
      .replace(/("""|''')[\s\S]*?\1|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, function (m) { return m.replace(/[^\n]/g, ' '); });
  }

  /** Your own names: functions, classes, variables, parameters, loop variables, imports. */
  function ownNames(code, skipAt) {
    var src = codeOnly(code), names = {}, m;
    function add(n, kind) { if (n && !/^\d/.test(n) && !names[n]) names[n] = kind; }
    var res = [
      [/\bdef\s+([A-Za-z_]\w*)/g, 'function'], [/\bclass\s+([A-Za-z_]\w*)/g, 'class'],
      [/^[ \t]*([A-Za-z_]\w*)\s*(?::[^=\n]*)?=(?!=)/gm, 'variable'],
      [/\bas\s+([A-Za-z_]\w*)/g, 'variable']
    ];
    res.forEach(function (r) { while ((m = r[0].exec(src))) add(m[1], r[1]); });
    // a, b = ..., for a, b in ...
    var multi = /^[ \t]*([A-Za-z_][\w, \t*]*?)\s*=(?!=)/gm;
    while ((m = multi.exec(src))) m[1].split(',').forEach(function (p) { add(p.replace(/[\s*]/g, ''), 'variable'); });
    var loops = /\bfor\s+([\w, \t()]+?)\s+in\b/g;
    while ((m = loops.exec(src))) m[1].replace(/[()]/g, '').split(',').forEach(function (p) { add(p.trim(), 'variable'); });
    // parameters of def and lambda
    var defs = /\bdef\s+\w+\s*\(([^)]*)\)|\blambda\s+([^:]*):/g;
    while ((m = defs.exec(src))) {
      (m[1] !== undefined ? m[1] : m[2]).split(',').forEach(function (p) {
        add(p.split(/[:=]/)[0].replace(/[\s*\/]/g, ''), 'parameter');
      });
    }
    // imports
    var imp = /^[ \t]*import\s+([^\n]+)/gm;
    while ((m = imp.exec(src))) m[1].split(',').forEach(function (p) { var w = p.trim().split(/\s+as\s+/); add(w[1] || w[0].split('.')[0], 'module'); });
    var from = /^[ \t]*from\s+[\w.]+\s+import\s+\(?([^\n)]+)/gm;
    while ((m = from.exec(src))) m[1].split(',').forEach(function (p) { var w = p.trim().split(/\s+as\s+/); add(w[1] || w[0], 'imported'); });
    delete names[skipAt];
    delete names.self;
    delete names.cls;
    return names;
  }

  /** Which modules the code imports, as {local name: module name}. */
  function importedModules(code) {
    var src = codeOnly(code), out = {}, m;
    var imp = /^[ \t]*import\s+([^\n]+)/gm;
    while ((m = imp.exec(src))) {
      m[1].split(',').forEach(function (p) {
        var w = p.trim().split(/\s+as\s+/), mod = w[0].trim();
        out[(w[1] || mod.split('.')[0]).trim()] = w[1] ? mod : mod.split('.')[0];
      });
    }
    return out;
  }

  /** Attribute names your code uses after a dot (self.total, obj.name): offered after a dot too. */
  function ownAttributes(code) {
    var src = codeOnly(code), out = {}, m, re = /\.\s*([A-Za-z_]\w*)/g;
    while ((m = re.exec(src))) out[m[1]] = true;
    var methods = /^[ \t]+def\s+([A-Za-z_]\w*)/gm;
    while ((m = methods.exec(src))) out[m[1]] = true;
    return out;
  }

  /** A guess at a name's type from its last assignment: 'str', 'list', 'dict', 'set', 'tuple' or null. */
  function guessType(code, name, before) {
    if (!name) return null;
    var src = codeOnly(code.slice(0, before)), raw = code.slice(0, before);
    var re = new RegExp('(?:^|\\n)[ \\t]*' + name + '\\s*(?::[^=\\n]*)?=(?!=)\\s*', 'g'), m, at = -1;
    while ((m = re.exec(src))) at = m.index + m[0].length;
    if (at < 0) return null;
    var rest = raw.slice(at, at + 40);
    if (/^[rbfRBF]{0,2}["']/.test(rest) || /^str\(/.test(rest)) return 'str';
    if (/^\[/.test(rest) || /^(list|sorted)\(/.test(rest)) return 'list';
    if (/^\{\s*\}/.test(rest) || /^dict\(/.test(rest)) return 'dict';
    if (/^\{/.test(rest)) return /^\{[^}]*:/.test(rest) ? 'dict' : 'set';
    if (/^set\(|^frozenset\(/.test(rest)) return 'set';
    if (/^\(|^tuple\(/.test(rest)) return 'tuple';
    return null;
  }

  /* ---------------------------------------------------------------- completion */

  function firstSentence(md) {
    var t = String(md || '').replace(/\[\[\w+:([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, id, l) { return l || id; }).replace(/[`*]/g, '');
    var cut = t.search(/[.:;](\s|$)/);
    if (cut > 0) t = t.slice(0, cut);
    return t.length > 60 ? t.slice(0, 59) + '…' : t;
  }

  function matches(text, typed) {
    if (!typed) return 2;
    if (text.indexOf(typed) === 0) return 2;
    if (text.toLowerCase().indexOf(typed.toLowerCase()) === 0) return 1;
    return 0;
  }

  /**
   * What to offer at index: {from, to, list} or null. Items: {text, kind, detail, entry?}; kind is
   * one of 'method', 'member', 'attribute', 'keyword', 'built-in', 'exception', 'constant',
   * 'module', or your name's kind ('function', 'class', 'variable', 'parameter', 'imported').
   */
  function complete(code, at) {
    code = String(code || '');
    if (contextAt(code, at) !== 'code') return null;
    var head = code.slice(0, at);
    var typed = (NAME_RE.exec(head) || [''])[0];
    if (/\d/.test(typed.charAt(0))) return null;
    var after = (/^[A-Za-z0-9_]*/.exec(code.slice(at)) || [''])[0];
    var start = at - typed.length;
    var beforeTyped = code.slice(0, start);
    var ix = index(), items = [], seen = {};
    function push(text, kind, detail, entry, rank) {
      if (seen[text]) return;
      var m = matches(text, typed);
      if (!m) return;
      if (!typed.length && /^_/.test(text)) return;
      if (/^__/.test(text) && !/^_/.test(typed)) return;
      seen[text] = true;
      items.push({ text: text, kind: kind, detail: detail || '', entry: entry || null, score: m * 10 + (rank || 0) });
    }

    var dot = /([A-Za-z_]\w*|\)|\]|["'])\s*\.\s*$/.exec(beforeTyped);
    if (dot) {
      // after a dot: a module's members, or methods (the receiver's type first when it can be guessed)
      var recv = dot[1], mods = importedModules(code);
      var modEntry = /^\w+$/.test(recv) && mods[recv] && ix.modules[mods[recv]];
      if (modEntry) {
        (modEntry.members || []).forEach(function (n) { push(n, 'member', mods[recv] + '.' + n, modEntry, 5); });
      } else {
        var type = recv === '"' || recv === "'" ? 'str' : /^\w+$/.test(recv) ? guessType(code, recv, start) : null;
        var own = ownAttributes(code.slice(0, start) + code.slice(at + after.length));
        if (type) {
          (U.data.reference || []).forEach(function (e) {
            if (e.group === type) push(e.name, 'method', type + ': ' + firstSentence(e.summary), e, 5);
          });
        }
        if (recv !== '"' && recv !== "'") Object.keys(own).forEach(function (n) { if (n !== typed) push(n, 'attribute', 'used in your code', null, 4); });
        if (!type) {
          Object.keys(ix.methods).sort().forEach(function (n) {
            var es = ix.methods[n];
            push(n, 'method', es.map(function (e) { return e.group; }).join(', ') + ': ' + firstSentence(es[0].summary), es[0], 2);
          });
        }
      }
    } else {
      if (/^\s*(import|from)\s+[\w.]*$/.test(head.slice(head.lastIndexOf('\n') + 1))) {
        Object.keys(ix.modules).sort().forEach(function (n) { push(n, 'module', firstSentence(ix.modules[n].summary), ix.modules[n], 5); });
      } else {
        var own2 = ownNames(code, typed);
        Object.keys(own2).forEach(function (n) { push(n, own2[n], 'your ' + own2[n], null, 4); });
        ix.keywords.forEach(function (k) { var e = (ix.names[k] || [])[0]; push(k, 'keyword', e ? firstSentence(e.summary) : '', e, 3); });
        ix.builtins.forEach(function (b) {
          var kind = b.entry.group === 'exceptions' ? 'exception' : b.entry.group === 'constants' ? 'constant' : 'built-in';
          push(b.name, kind, firstSentence(b.entry.summary), b.entry, kind === 'built-in' ? 2 : 1);
        });
      }
    }
    if (!items.length) return null;
    items.sort(function (a, b) { return b.score - a.score || (a.text.length - b.text.length) || (a.text < b.text ? -1 : 1); });
    if (items.length === 1 && items[0].text === typed) return null;     // already typed in full
    return { from: start, to: at + after.length, list: items.slice(0, MAX).map(function (i) { delete i.score; return i; }) };
  }

  /* ---------------------------------------------------------------- the info box and the hover tip */

  function entryHtml(e) {
    return '<div class="ref-tip-sig"><code>' + U.esc(e.sig) + '</code></div>' + U.md(e.summary) +
      '<div class="ref-tip-java"><b>Java:</b> ' + U.mdInline(e.java) + '</div>';
  }

  var info = null;
  function showInfo(item, node) {
    if (!item || !item.entry || !node || !node.parentNode) { hideInfo(); return; }
    if (!info) { info = h('div', { class: 'hint-info', role: 'note' }); document.body.appendChild(info); }
    info.innerHTML = '';
    info.appendChild(h('div', { class: 'hint-info-title' }, item.entry.title, h('span', { class: 'ref-tip-kind' }, item.kind)));
    info.appendChild(h('div', { class: 'hint-info-body', html: entryHtml(item.entry) }));
    info.style.display = 'block';
    var r = node.parentNode.getBoundingClientRect(), w = Math.min(360, window.innerWidth - 16);
    var left = r.right + 6;
    if (left + w > window.innerWidth - 8) left = Math.max(8, r.left - w - 6);
    info.style.width = w + 'px';
    info.style.left = left + 'px';
    info.style.top = Math.max(8, Math.min(r.top, window.innerHeight - info.offsetHeight - 8)) + 'px';
  }
  function hideInfo() { if (info) info.style.display = 'none'; }

  var tip = null, tipTimer = null, tipKey = '';
  function showTip(entries, x, y) {
    clearTimeout(tipTimer);
    if (!tip) {
      tip = h('div', { class: 'ref-tip', role: 'tooltip' });
      tip.addEventListener('mouseenter', function () { clearTimeout(tipTimer); });
      tip.addEventListener('mouseleave', hideTipSoon);
      document.body.appendChild(tip);
    }
    tip.innerHTML = '';
    entries.slice(0, 3).forEach(function (e) {
      var group = U.find('refGroups', e.group);
      tip.appendChild(h('div', { class: 'ref-tip-entry' },
        h('div', { class: 'ref-tip-title' }, e.title, h('span', { class: 'ref-tip-kind' }, group ? group.title : e.group)),
        h('div', { class: 'ref-tip-body', html: entryHtml(e) }),
        h('a', { class: 'ref-tip-link', href: '#/reference/' + e.id, onclick: hideTip }, 'Open in the Reference →')));
    });
    if (entries.length > 3) tip.appendChild(h('div', { class: 'faint' }, '… and ' + (entries.length - 3) + ' more with this name'));
    tip.style.display = 'block';
    var w = tip.offsetWidth, hh = tip.offsetHeight;
    var left = Math.max(8, Math.min(x + 12, window.innerWidth - w - 8)), top = y + 18;
    if (top + hh > window.innerHeight - 8) top = Math.max(8, y - hh - 12);
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function hideTip() { clearTimeout(tipTimer); tipKey = ''; if (tip) tip.style.display = 'none'; }
  function hideTipSoon() { clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 300); }

  /** The Reference entries for the name under a screen position in an editor, or null. */
  function entriesAt(cm, x, y) {
    var pos = cm.coordsChar({ left: x, top: y }, 'window');
    var line = cm.getLine(pos.line);
    if (line === undefined) return null;
    var ch = pos.ch, s = ch, e = ch;
    while (s > 0 && /\w/.test(line.charAt(s - 1))) s--;
    while (e < line.length && /\w/.test(line.charAt(e))) e++;
    if (s === e) return null;
    var a = cm.charCoords({ line: pos.line, ch: s }, 'window'), b = cm.charCoords({ line: pos.line, ch: e }, 'window');
    if (x < a.left || x > b.left || y < a.top || y > b.bottom) return null;
    var word = line.slice(s, e);
    var abs = cm.indexFromPos({ line: pos.line, ch: s });
    if (/\d/.test(word.charAt(0)) || contextAt(cm.getValue(), abs + 1) !== 'code') return null;
    var attr = /\.\s*$/.test(line.slice(0, s));
    var found = lookup(word, { attr: attr });
    if (!found.length && !attr) {
      var mod = importedModules(cm.getValue())[word];
      if (mod && index().modules[mod]) found = [index().modules[mod]];
    }
    return found.length ? { key: pos.line + ':' + s, entries: found } : null;
  }

  /* ---------------------------------------------------------------- wiring into CodeMirror */

  function hintFor(cm) {
    var res = complete(cm.getValue(), cm.indexFromPos(cm.getCursor()));
    if (!res) return null;
    var data = {
      from: cm.posFromIndex(res.from), to: cm.posFromIndex(res.to),
      list: res.list.map(function (it) {
        return {
          text: it.text, item: it,
          render: function (el) {
            el.appendChild(h('span', { class: 'hint-text' }, it.text));
            el.appendChild(h('span', { class: 'hint-kind' }, it.kind));
            if (it.detail) el.appendChild(h('span', { class: 'hint-detail' }, it.detail));
          }
        };
      })
    };
    window.CodeMirror.on(data, 'select', function (c, node) { showInfo(c.item, node); });
    window.CodeMirror.on(data, 'close', hideInfo);
    return data;
  }

  function open(cm) {
    if (cm.showHint) cm.showHint({ hint: hintFor, completeSingle: false });
  }

  function attach(cm) {
    if (!window.CodeMirror || !cm.showHint) return;
    cm.addKeyMap({ 'Ctrl-Space': open, 'Cmd-Space': open });
    cm.on('inputRead', function (c, change) {
      if (change.origin !== '+input' || c.state.completionActive) return;
      var typedNow = change.text.join(''), cur = c.getCursor();
      var before = c.getLine(cur.line).slice(0, cur.ch);
      // a dot after a name (not after a number), or the second letter of a name
      if (typedNow === '.' ? /(^|[^\w.])[A-Za-z_]\w*\.$|["'\])]\.$/.test(before) : /^\w$/.test(typedNow) && /(^|[^\w])[A-Za-z_]\w+$/.test(before)) open(c);
    });
    var wrap = cm.getWrapperElement();
    var moved = U.debounce(function (x, y) {
      if (!wrap.isConnected) return;
      var hit = entriesAt(cm, x, y);
      if (!hit) { hideTipSoon(); return; }
      if (hit.key === tipKey && tip && tip.style.display === 'block') return;
      tipKey = hit.key;
      showTip(hit.entries, x, y);
    }, 200);
    wrap.addEventListener('mousemove', function (ev) { moved(ev.clientX, ev.clientY); });
    wrap.addEventListener('mouseleave', hideTipSoon);
    wrap.addEventListener('mousedown', function (ev) {
      if (!(ev.ctrlKey || ev.metaKey)) return;
      var hit = entriesAt(cm, ev.clientX, ev.clientY);
      if (!hit) return;
      ev.preventDefault();
      hideTip();
      U.go('#/reference/' + hit.entries[0].id);
    });
    cm.on('keydown', hideTip);
  }

  U.assist = { complete: complete, lookup: lookup, attach: attach, hideTip: function () { hideTip(); hideInfo(); } };
})(window.PYLT);
