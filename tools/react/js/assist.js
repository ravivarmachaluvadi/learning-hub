/*
 * assist.js - "learn while you type" in every editable JSX editor: autocomplete, auto-import and
 * hover cards (the PythonLearningTool's assist.js, made to read JSX).
 *
 * Autocomplete opens by itself after two letters of a name, right after "<", and while you type an
 * attribute in a tag; Ctrl+Space opens it any time. Where the cursor is decides what is offered:
 *
 *   in JavaScript      React's hooks and APIs (data/api.js; "use…" puts hooks first), your names in
 *                      scope, keywords and common globals; after "React.", the react module's names
 *   right after "<"    HTML tags, your components, React's components (Suspense, Fragment…)
 *   inside a tag       React DOM props (className, htmlFor, onClick, aria-…); for your own
 *                      component, the props its header destructures, function Card({ title })
 *   strings, comments, JSX text, a name being declared: nothing
 *
 * Where the cursor is, and which names are in scope there, come from CodeMirror's own JSX and
 * JavaScript tokenizers (the ones that colour the editor), run over the code up to the cursor. They
 * read unfinished code, which is what an editor holds while you type; Babel needs code that parses.
 *
 * Picking a hook at the start of a statement inserts its snippet (useState gives
 * `const [value, setValue] = useState()`, the cursor in the brackets); an attribute comes with its
 * quotes or braces; any React name you pick is added to the import at the top. The box beside the
 * list shows the catalogue entry. Hover a React name for its card (signature, summary, lesson, its
 * Reference entry, react.dev); Ctrl+click opens its lesson, or react.dev when no built lesson teaches it.
 *
 *   RLT.assist.complete(code, index) -> {from, to, ctx, list: [{text, kind, detail, entry?, insert?}]} or null
 *   RLT.assist.lookup(word)          -> the catalogue entries named word
 *   RLT.assist.addImport(code, name) -> {from, to, text}, the change that imports name, or null
 *   RLT.assist.attach(cm)            wires it all into a CodeMirror editor (js/editor.js calls it)
 */
(function (U) {
  'use strict';
  var h = U.h;
  var MAX = 80;
  var CARET = '$0';   // where the cursor goes in an inserted snippet

  var TAGS = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button', 'input', 'label', 'form', 'select',
    'option', 'textarea', 'ul', 'ol', 'li', 'img', 'section', 'main', 'header', 'footer', 'nav', 'article', 'aside',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'strong', 'em', 'small', 'code', 'pre', 'br', 'hr', 'dl', 'dt', 'dd',
    'fieldset', 'legend', 'output', 'progress', 'details', 'summary', 'dialog', 'figure', 'figcaption', 'time',
    'video', 'audio', 'canvas', 'svg'];
  // [name, how it is written: 'string' name="", 'expr' name={}, 'event' name={}, 'bool' name; note]
  var ATTRS = [
    ['className', 'string', 'CSS classes (class in HTML)'], ['id', 'string'], ['style', 'expr', 'an object: {{ color: \'red\' }}'],
    ['key', 'expr', 'tells list items apart'], ['ref', 'expr', 'a ref from useRef'],
    ['onClick', 'event'], ['onChange', 'event'], ['onSubmit', 'event'], ['onInput', 'event'], ['onKeyDown', 'event'],
    ['onKeyUp', 'event'], ['onFocus', 'event'], ['onBlur', 'event'], ['onMouseEnter', 'event'], ['onMouseLeave', 'event'],
    ['onDoubleClick', 'event'], ['onScroll', 'event'], ['onPointerDown', 'event'],
    ['htmlFor', 'string', 'for in HTML: the input\'s id'], ['type', 'string'], ['name', 'string'], ['value', 'expr'],
    ['defaultValue', 'string'], ['checked', 'expr'], ['defaultChecked', 'bool'], ['placeholder', 'string'],
    ['disabled', 'bool'], ['readOnly', 'bool'], ['required', 'bool'], ['autoFocus', 'bool'], ['min', 'string'],
    ['max', 'string'], ['step', 'string'], ['maxLength', 'expr'], ['href', 'string'], ['target', 'string'],
    ['rel', 'string'], ['src', 'string'], ['alt', 'string'], ['title', 'string'], ['role', 'string'],
    ['tabIndex', 'expr', 'tabindex in HTML'], ['hidden', 'bool'], ['action', 'expr', 'a function, in React 19'],
    ['method', 'string'], ['aria-label', 'string'], ['aria-labelledby', 'string'], ['aria-describedby', 'string'],
    ['aria-expanded', 'expr'], ['aria-hidden', 'expr'], ['aria-pressed', 'expr'], ['aria-selected', 'expr'],
    ['aria-checked', 'expr'], ['aria-controls', 'string'], ['aria-live', 'string'], ['aria-current', 'string'],
    ['aria-disabled', 'expr'], ['data-testid', 'string'], ['dangerouslySetInnerHTML', 'expr']
  ];
  var KEYWORDS = ['const', 'let', 'return', 'function', 'export', 'default', 'import', 'from', 'if', 'else', 'true',
    'false', 'null', 'undefined', 'async', 'await', 'new', 'typeof', 'try', 'catch', 'throw', 'for', 'while', 'of',
    'switch', 'case', 'break', 'continue', 'class', 'extends'];
  var GLOBALS = ['console', 'fetch', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'Promise',
    'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'localStorage', 'document', 'window', 'structuredClone'];
  var JSX_MODE = { name: 'jsx', base: { name: 'javascript', globalVars: true } };   // globalVars: top-level names too

  /* ---------------------------------------------------------------- the catalogue */

  function lookup(word) {
    return (U.data.api || []).filter(function (e) { return e.name === word; });
  }

  /* ---------------------------------------------------------------- where the cursor is */

  /** Run CodeMirror's JSX tokenizer over text (runMode's loop, one mode instance): each(token, style); returns the state at the end. */
  function tokenize(text, each) {
    var CM = window.CodeMirror, mode = CM.getMode(CM.defaults, JSX_MODE), state = CM.startState(mode);
    var lines = CM.splitLines(text);
    lines.forEach(function (l, i) {
      if (i) each('\n', '');
      var stream = new CM.StringStream(l, 2, { lookAhead: function (n) { return lines[i + n]; }, baseToken: function () {} });
      if (!stream.string && mode.blankLine) mode.blankLine(state);
      while (!stream.eol()) {
        var style = mode.token(stream, state);
        each(stream.current(), style || '');
        stream.start = stream.pos;
      }
    });
    return state;
  }

  /**
   * Where the cursor is, from the tokenizer run over the code up to it: {ctx, partial, tag?, state}.
   * ctx: 'js' | 'tag' (a tag name after "<") | 'attr' (inside an opening tag) | 'none'.
   */
  function where(code, at) {
    var CM = window.CodeMirror;
    if (!CM || !CM.getMode || !CM.StringStream) return { ctx: 'none' };
    var text = code.slice(0, at), last = { text: '', style: '' };
    var state = tokenize(text, function (t, style) { if (t !== '\n') last = { text: t, style: style }; });
    var lineText = text.slice(text.lastIndexOf('\n') + 1);
    var touching = lineText.length && lineText.slice(-last.text.length) === last.text;
    var cx = state.context, inner = cx && cx.state, m = cx && cx.mode;
    var res = { state: state, last: last, line: lineText };
    if (m && m.name === 'xml') {
      var tag = m.xmlCurrentTag ? m.xmlCurrentTag(inner) : null;
      if (/<$/.test(lineText)) return Object.assign(res, { ctx: 'tag', partial: '' });
      if (tag && tag.close) return Object.assign(res, { ctx: 'none' });
      if (tag && touching && /\btag\b/.test(last.style) && !/bracket/.test(last.style) && /<[\w.$]*$/.test(lineText)) {
        return Object.assign(res, { ctx: 'tag', partial: (/[\w.$]*$/.exec(lineText) || [''])[0] });
      }
      if (tag && !/string/.test(last.style)) return Object.assign(res, { ctx: 'attr', tag: tag.name, partial: (/[\w-]*$/.exec(lineText) || [''])[0] });
      return Object.assign(res, { ctx: 'none' });
    }
    if (touching && /string|comment/.test(last.style)) return Object.assign(res, { ctx: 'none' });
    return Object.assign(res, { ctx: 'js', partial: (/[A-Za-z_$][\w$]*$/.exec(lineText) || [''])[0] });
  }

  /** The names CodeMirror's JavaScript tokenizer knows are declared where the cursor is. */
  function namesInScope(state) {
    var out = {};
    function vars(list) { for (var v = list; v; v = v.next) if (v.name !== 'this' && v.name !== 'arguments') out[v.name] = true; }
    for (var cx = state && state.context; cx; cx = cx.prev) {
      if (!cx.mode || cx.mode.name !== 'javascript') continue;
      var js = cx.state;
      vars(js.localVars);
      for (var c = js.context; c; c = c.prev) vars(c.vars);
      vars(js.globalVars);
    }
    return Object.keys(out);
  }

  /** The code with strings and comments blanked (positions kept), from the same tokenizer. */
  function codeOnly(code) {
    var out = '';
    tokenize(code, function (t, style) { out += /string|comment/.test(style) ? t.replace(/[^\n]/g, ' ') : t; });
    return out;
  }

  /** The props a component of yours destructures in its header: function Card({ title, onPick }). */
  function propsOf(code, name) {
    var src = codeOnly(code), m;
    var res = [new RegExp('function\\s+' + name + '\\s*\\(\\s*\\{([^}]*)\\}'),
      new RegExp('(?:const|let|var)\\s+' + name + '\\s*=\\s*(?:\\w+\\s*\\(\\s*)?(?:function\\s*\\w*\\s*)?\\(\\s*\\{([^}]*)\\}')];
    for (var i = 0; i < res.length; i++) {
      if ((m = res[i].exec(src))) {
        return m[1].split(',').map(function (p) { return p.split(/[=:]/)[0].replace(/[\s.]/g, ''); }).filter(function (p) { return /^[A-Za-z_$][\w$]*$/.test(p); });
      }
    }
    return [];
  }

  /* ---------------------------------------------------------------- completion */

  function firstSentence(md) {
    var t = String(md || '').replace(/[`*]/g, ''), cut = t.search(/[.:;](\s|$)/);
    if (cut > 0) t = t.slice(0, cut);
    return t.length > 60 ? t.slice(0, 59) + '…' : t;
  }
  function matches(text, typed) {
    if (!typed) return 2;
    if (text.indexOf(typed) === 0) return 2;
    if (text.toLowerCase().indexOf(typed.toLowerCase()) === 0) return 1;
    return 0;
  }

  function complete(code, at) {
    code = String(code || '');
    at = Math.max(0, Math.min(at, code.length));
    var w = where(code, at);
    if (w.ctx === 'none') return null;
    var typed = w.partial || '';
    if (/^\d/.test(typed)) return null;
    var after = (/^[\w$-]*/.exec(code.slice(at)) || [''])[0];
    var start = at - typed.length, before = code.slice(0, start), lineBefore = w.line.slice(0, w.line.length - typed.length);
    var items = [], seen = {};
    function push(text, kind, detail, rank, extra) {
      if (seen[text]) return;
      var m = matches(text, typed);
      if (!m) return;
      seen[text] = true;
      items.push(Object.assign({ text: text, kind: kind, detail: detail || '', score: m * 10 + rank }, extra || {}));
    }
    var api = U.data.api || [];

    if (w.ctx === 'tag') {
      namesInScope(w.state).forEach(function (n) { if (/^[A-Z]/.test(n)) push(n, 'your component', 'defined in this file', 6); });
      api.forEach(function (e) { if (e.kind === 'component') push(e.name, 'React', firstSentence(e.summary), 5, { entry: e, autoImport: true }); });
      TAGS.forEach(function (t) { push(t, 'HTML', '', 4); });
    } else if (w.ctx === 'attr') {
      if (/^[A-Z]/.test(w.tag)) {
        propsOf(code, w.tag).forEach(function (p) { push(p, 'prop', 'a prop of ' + w.tag, 6, { insert: p + '={' + CARET + '}' }); });
        push('key', 'prop', 'tells list items apart', 4, { insert: 'key={' + CARET + '}' });
      } else {
        ATTRS.forEach(function (a) {
          var ins = a[1] === 'string' ? a[0] + '="' + CARET + '"' : a[1] === 'bool' ? a[0] : a[0] + '={' + CARET + '}';
          push(a[0], a[1] === 'event' ? 'event' : 'attribute', a[2] || '', a[1] === 'event' ? 5 : 4, { insert: ins });
        });
      }
    } else {
      if (/\b(const|let|var|function|class)\s+[\w$]*$|\b(const|let|var)\s*[[{][^=]*$/.test(before.slice(before.lastIndexOf('\n') + 1) + typed)) return null;   // a name being declared
      var dot = /([\w$]+)\s*\.\s*$/.exec(before);
      if (dot) {
        if (dot[1] !== 'React') return null;
        api.forEach(function (e) { if (e.module === 'react') push(e.name, e.kind, firstSentence(e.summary), 5, { entry: e }); });
      } else {
        // a statement of its own (not inside JSX's { }) can take a hook's whole snippet
        var statement = /^\s*$/.test(lineBefore) && !(w.state.context && w.state.context.prev);
        api.forEach(function (e) {
          var hookFirst = /^use/.test(typed) && e.kind === 'hook';
          push(e.name, e.kind, firstSentence(e.summary), hookFirst ? 7 : 4,
            { entry: e, autoImport: true, insert: statement && e.snippet ? e.snippet : e.name });
        });
        namesInScope(w.state).forEach(function (n) { if (n !== typed) push(n, /^[A-Z]/.test(n) ? 'your component' : 'your name', 'in scope here', 6); });
        KEYWORDS.forEach(function (k) { push(k, 'keyword', '', 3); });
        GLOBALS.forEach(function (g) { push(g, 'global', '', 2); });
      }
    }
    if (!items.length) return null;
    items.sort(function (a, b) { return b.score - a.score || a.text.length - b.text.length || (a.text < b.text ? -1 : 1); });
    if (items.length === 1 && items[0].text === typed) return null;   // already typed in full
    return { from: start, to: at + after.length, ctx: w.ctx, list: items.slice(0, MAX).map(function (i) { delete i.score; return i; }) };
  }

  /* ---------------------------------------------------------------- auto-import */

  /** The change that imports name (from its module in data/api.js), or null if nothing is needed. */
  function addImport(code, name) {
    var e = lookup(name)[0];
    if (!e) return null;
    code = String(code || '');
    var mod = e.module, line = 'import { ' + name + ' } from \'' + mod + '\';\n';
    var parsed = U.react && U.react.parse ? U.react.parse(code) : {};
    if (parsed.ast) {
      var body = parsed.ast.program.body, lastImport = null, target = null;
      for (var i = 0; i < body.length; i++) {
        var n = body[i];
        if (n.type !== 'ImportDeclaration') continue;
        lastImport = n;
        if (n.specifiers.some(function (s) { return s.local && s.local.name === name; })) return null;
        if (n.source.value === mod && !target) target = n;
      }
      if (target) {
        var named = target.specifiers.filter(function (s) { return s.type === 'ImportSpecifier'; });
        if (named.length) { var endAt = named[named.length - 1].end; return { from: endAt, to: endAt, text: ', ' + name }; }
        if (target.specifiers.length === 1 && target.specifiers[0].type === 'ImportDefaultSpecifier') {
          var d = target.specifiers[0].end;
          return { from: d, to: d, text: ', { ' + name + ' }' };
        }
      }
      if (lastImport) {
        var nl = code.indexOf('\n', lastImport.end);
        return nl < 0 ? { from: code.length, to: code.length, text: '\n' + line.slice(0, -1) } : { from: nl + 1, to: nl + 1, text: line };
      }
      return { from: 0, to: 0, text: line + '\n' };
    }
    // the code does not parse yet (you are typing): find the import line by its text
    var re = new RegExp('^import\\s*\\{([^}]*)\\}\\s*from\\s*[\'"]' + mod.replace('/', '\\/') + '[\'"]', 'm'), m = re.exec(code);
    if (m) {
      if (new RegExp('\\b' + name + '\\b').test(m[1])) return null;
      var close = m.index + m[0].indexOf('}'), inside = m[1].replace(/\s+$/, '');
      var at2 = m.index + m[0].indexOf('{') + 1 + inside.length;
      return { from: at2, to: close, text: (inside.trim() ? ', ' : ' ') + name + ' ' };
    }
    if (new RegExp('^import[^\\n]*\\b' + name + '\\b', 'm').test(code)) return null;
    return { from: 0, to: 0, text: line + (/^import\b/.test(code) ? '' : '\n') };
  }

  /* ---------------------------------------------------------------- the info box and the hover card */

  function cardHtml(e) {
    var track = U.find('tracks', e.track);
    var more = e.lesson ? '' : (track ? '<p class="faint">Taught in ' + U.esc(track.title) + ' (batch ' + track.batch + ').</p>' : '');
    return '<div class="ref-tip-sig"><code>' + U.esc(e.sig) + '</code></div>' + U.md(e.summary) + more;
  }

  var info = null;
  function showInfo(item, node) {
    if (!item || !item.entry || !node || !node.parentNode) { hideInfo(); return; }
    if (!info) { info = h('div', { class: 'hint-info', role: 'note' }); document.body.appendChild(info); }
    info.innerHTML = '';
    info.appendChild(h('div', { class: 'hint-info-title' }, item.entry.name, h('span', { class: 'ref-tip-kind' }, item.entry.module)));
    info.appendChild(h('div', { class: 'hint-info-body', html: cardHtml(item.entry) }));
    info.style.display = 'block';
    var r = node.parentNode.getBoundingClientRect(), wd = Math.min(360, window.innerWidth - 16);
    var left = r.right + 6;
    if (left + wd > window.innerWidth - 8) left = Math.max(8, r.left - wd - 6);
    info.style.width = wd + 'px';
    info.style.left = left + 'px';
    info.style.top = Math.max(8, Math.min(r.top, window.innerHeight - info.offsetHeight - 8)) + 'px';
  }
  function hideInfo() { if (info) info.style.display = 'none'; }

  var tip = null, tipTimer = null, tipKey = '';
  function showTip(e, x, y) {
    clearTimeout(tipTimer);
    if (!tip) {
      tip = h('div', { class: 'ref-tip', role: 'tooltip' });
      tip.addEventListener('mouseenter', function () { clearTimeout(tipTimer); });
      tip.addEventListener('mouseleave', hideTipSoon);
      document.body.appendChild(tip);
    }
    tip.innerHTML = '';
    var links = h('div', { class: 'ref-tip-links' },
      e.lesson ? h('a', { class: 'ref-tip-link', href: U.linkFor('lesson', e.lesson), onclick: hideTip, html: 'Lesson: ' + U.labelFor('lesson', e.lesson) + ' →' }) : null,
      h('a', { class: 'ref-tip-link', href: '#/reference/' + encodeURIComponent(e.id), onclick: hideTip }, 'Reference →'),
      h('a', { class: 'ref-tip-link', href: e.docs, target: '_blank', rel: 'noopener' }, 'react.dev ↗'));
    tip.appendChild(h('div', { class: 'ref-tip-entry' },
      h('div', { class: 'ref-tip-title' }, e.name, h('span', { class: 'ref-tip-kind' }, e.kind + ' · ' + e.module)),
      h('div', { class: 'ref-tip-body', html: cardHtml(e) }), links,
      h('div', { class: 'faint ref-tip-keys' }, 'Ctrl+click opens ' + (e.lesson ? 'the lesson' : 'react.dev'))));
    tip.style.display = 'block';
    var wd = tip.offsetWidth, hh = tip.offsetHeight;
    var left = Math.max(8, Math.min(x + 12, window.innerWidth - wd - 8)), top = y + 18;
    if (top + hh > window.innerHeight - 8) top = Math.max(8, y - hh - 12);
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function hideTip() { clearTimeout(tipTimer); tipKey = ''; if (tip) tip.style.display = 'none'; }
  function hideTipSoon() { clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 300); }

  /** The catalogue entry for the name under a screen position in an editor, or null. */
  function entryAt(cm, x, y) {
    var pos = cm.coordsChar({ left: x, top: y }, 'window'), line = cm.getLine(pos.line);
    if (line === undefined) return null;
    var s = pos.ch, en = pos.ch;
    while (s > 0 && /[\w$]/.test(line.charAt(s - 1))) s--;
    while (en < line.length && /[\w$]/.test(line.charAt(en))) en++;
    if (s === en) return null;
    var a = cm.charCoords({ line: pos.line, ch: s }, 'window'), b = cm.charCoords({ line: pos.line, ch: en }, 'window');
    if (x < a.left || x > b.left || y < a.top || y > b.bottom) return null;
    var token = cm.getTokenAt({ line: pos.line, ch: s + 1 });
    if (/string|comment/.test(token.type || '')) return null;
    var dot = /([\w$]*)\s*\.\s*$/.exec(line.slice(0, s));
    if (dot && dot[1] !== 'React') return null;
    var e = lookup(line.slice(s, en))[0];
    return e ? { key: pos.line + ':' + s, entry: e } : null;
  }

  /** Ctrl+click: a lesson opens in the tool, react.dev in a new tab. */
  function openEntry(e) {
    if (e.lesson) U.go(U.linkFor('lesson', e.lesson));
    else window.open(e.docs, '_blank', 'noopener');
  }

  /* ---------------------------------------------------------------- wiring into CodeMirror */

  /** Insert a picked item: its snippet (indented like the line, the cursor at $0), then its import. */
  function pick(cm, data, c) {
    var it = c.item, text = it.insert || it.text;
    var indent = (/^\s*/.exec(cm.getLine(data.from.line)) || [''])[0];
    text = text.replace(/\n/g, '\n' + indent);
    var caret = text.indexOf(CARET);
    text = text.replace(CARET, '');
    cm.operation(function () {
      cm.replaceRange(text, data.from, data.to, 'complete');
      if (caret >= 0) cm.setCursor(cm.posFromIndex(cm.indexFromPos(data.from) + caret));
      if (it.autoImport && it.entry) {
        var ch = addImport(cm.getValue(), it.entry.name);
        if (ch) cm.replaceRange(ch.text, cm.posFromIndex(ch.from), cm.posFromIndex(ch.to), 'complete');
      }
    });
  }

  function hintFor(cm) {
    var res = complete(cm.getValue(), cm.indexFromPos(cm.getCursor()));
    if (!res) return null;
    var data = {
      from: cm.posFromIndex(res.from), to: cm.posFromIndex(res.to),
      list: res.list.map(function (it) {
        return {
          text: it.text, item: it, hint: pick,
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
      var typed = change.text.join('');
      if (!/^[\w$<. -]$/.test(typed)) return;
      var res = complete(c.getValue(), c.indexFromPos(c.getCursor()));
      if (!res) return;
      var cur = c.getCursor(), word = c.getRange(c.posFromIndex(res.from), cur);
      // tags and attributes open at once; JavaScript names after two letters, or after "React."
      if (res.ctx === 'tag' || (res.ctx === 'attr' && typed !== '.') || word.length >= 2 || typed === '.') open(c);
    });
    var wrap = cm.getWrapperElement();
    var moved = U.debounce(function (x, y) {
      if (!wrap.isConnected) return;
      var hit = entryAt(cm, x, y);
      if (!hit) { hideTipSoon(); return; }
      if (hit.key === tipKey && tip && tip.style.display === 'block') return;
      tipKey = hit.key;
      showTip(hit.entry, x, y);
    }, 200);
    wrap.addEventListener('mousemove', function (ev) { moved(ev.clientX, ev.clientY); });
    wrap.addEventListener('mouseleave', hideTipSoon);
    wrap.addEventListener('mousedown', function (ev) {
      if (!(ev.ctrlKey || ev.metaKey)) return;
      var hit = entryAt(cm, ev.clientX, ev.clientY);
      if (!hit) return;
      ev.preventDefault();
      hideTip();
      openEntry(hit.entry);
    });
    cm.on('keydown', hideTip);
  }

  U.assist = { complete: complete, lookup: lookup, addImport: addImport, attach: attach, hideTip: function () { hideTip(); hideInfo(); } };
})(window.RLT);
