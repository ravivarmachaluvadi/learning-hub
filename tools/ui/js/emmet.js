/*
 * emmet.js - Emmet abbreviations in the HTML editors: type ul>li*3 and press Tab.
 *
 * Emmet (https://docs.emmet.io) is the HTML shorthand built into VS Code and IntelliJ. This file is
 * a small, readable subset of it:
 *
 *   div.card#main    a <div> with a class and an id; the tag can be left out (.card is a <div>,
 *                    and inside a <ul> it is an <li>)
 *   ul>li            > a child          h1+p        + a sibling      ul>li^p   ^ back up a level
 *   li*3             * repeat           li.item$*3  $ the number (1, 2, 3; $$ gives 01, 02)
 *   a[href=#]        [ ] attributes     p{Hello}    { } text         (header>h1)+main   ( ) groups
 *   !                an HTML page skeleton
 *
 * Some tags get their usual attributes, as in Emmet: a -> href, img -> src and alt, input:email ->
 * type, name and id. The expansion is indented like the line it is typed on, and the cursor lands
 * in the first empty spot. Only abbreviations made of real HTML tag names expand, so Tab after an
 * ordinary word (or inside a tag) still indents. While an abbreviation is under the cursor, a small
 * box shows what Tab will produce.
 *
 *   U.emmet.expand('ul>li*3')   -> the HTML text, or null if it is not an abbreviation
 *   U.emmet.expandAtCursor(cm)  -> true if it expanded the abbreviation before the cursor
 */
(function (U) {
  'use strict';

  var UNIT = '  ';
  var MARK = '\u0001'; // marks an empty spot while rendering: the first one becomes the cursor

  var TAGS = {};
  ('a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup ' +
   'data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head ' +
   'header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol ' +
   'optgroup option output p param picture pre progress q rp rt ruby s samp script search section select slot small source span ' +
   'strong style sub summary sup svg table tbody td template textarea tfoot th thead time title tr track u ul var video wbr')
    .split(' ').forEach(function (t) { TAGS[t] = true; });

  function set(list) { var o = {}; list.split(' ').forEach(function (t) { o[t] = true; }); return o; }
  var VOID = set('area base br col embed hr img input link meta param source track wbr');
  var INLINE = set('a abbr b bdi bdo br button cite code data del dfn em i img input ins kbd label mark q s samp select small span strong sub sup textarea time u var wbr');

  /* Emmet's usual attributes for some tags: name -> [tag, [[attribute, default value]]] */
  var ALIASES = {
    a: ['a', [['href', '']]],
    'a:blank': ['a', [['href', 'https://'], ['target', '_blank'], ['rel', 'noopener noreferrer']]],
    'a:mail': ['a', [['href', 'mailto:']]],
    abbr: ['abbr', [['title', '']]],
    img: ['img', [['src', ''], ['alt', '']]],
    iframe: ['iframe', [['src', '']]],
    link: ['link', [['rel', 'stylesheet'], ['href', '']]],
    'link:css': ['link', [['rel', 'stylesheet'], ['href', 'style.css']]],
    'script:src': ['script', [['src', '']]],
    'meta:utf': ['meta', [['charset', 'UTF-8']]],
    'meta:vp': ['meta', [['name', 'viewport'], ['content', 'width=device-width, initial-scale=1.0']]],
    form: ['form', [['action', '']]],
    'form:get': ['form', [['action', ''], ['method', 'get']]],
    'form:post': ['form', [['action', ''], ['method', 'post']]],
    label: ['label', [['for', '']]],
    input: ['input', [['type', 'text']]],
    select: ['select', [['name', ''], ['id', '']]],
    option: ['option', [['value', '']]],
    opt: ['option', [['value', '']]],
    textarea: ['textarea', [['name', ''], ['id', ''], ['cols', '30'], ['rows', '10']]],
    btn: ['button', []],
    'btn:s': ['button', [['type', 'submit']]],
    'button:submit': ['button', [['type', 'submit']]],
    'btn:r': ['button', [['type', 'reset']]],
    'button:reset': ['button', [['type', 'reset']]]
  };
  var SHORT_TYPES = { t: 'text', p: 'password', c: 'checkbox', r: 'radio', h: 'hidden', s: 'submit', b: 'button', f: 'file' };
  ('text email password number search url tel date time datetime-local month week color range file checkbox radio hidden ' +
   'submit reset button').split(' ').forEach(function (t) {
    var attrs = t === 'hidden' ? [['name', '']] : /^(submit|reset|button)$/.test(t) ? [['value', '']] : [['name', ''], ['id', '']];
    ALIASES['input:' + t] = ['input', [['type', t]].concat(attrs)];
  });
  Object.keys(SHORT_TYPES).forEach(function (k) { ALIASES['input:' + k] = ALIASES['input:' + SHORT_TYPES[k]]; });

  var PAGE = '<!doctype html>\n<html lang="en">\n<head>\n' + UNIT + '<meta charset="UTF-8">\n' +
    UNIT + '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' + UNIT + '<title>Document</title>\n' +
    '</head>\n<body>\n' + UNIT + MARK + '\n</body>\n</html>';

  /* ---------- parsing: the abbreviation becomes a tree of {name, ops, text, children, repeat} ---------- */

  function parse(abbr) {
    var i = 0, n = abbr.length;
    function fail() { throw new Error('not an abbreviation'); }
    function peek() { return abbr.charAt(i); }
    function readWhile(re) { var st = i; while (i < n && re.test(abbr.charAt(i))) i++; return abbr.slice(st, i); }
    function readUntil(close) {
      var st = ++i, e = abbr.indexOf(close, st);
      if (e < 0) fail();
      i = e + 1;
      return abbr.slice(st, e);
    }
    function readRepeat(node) {
      if (peek() !== '*') return;
      i++;
      var d = readWhile(/\d/);
      if (!d || +d < 1) fail();
      node.repeat = Math.min(+d, 200);
    }
    function readAttrs(s) {
      var out = [], j = 0;
      while (j < s.length) {
        while (j < s.length && /\s/.test(s.charAt(j))) j++;
        if (j >= s.length) break;
        var st = j;
        while (j < s.length && !/[\s=]/.test(s.charAt(j))) j++;
        var name = s.slice(st, j), value = null;
        if (!name) fail();
        if (s.charAt(j) === '=') {
          j++;
          var q = s.charAt(j);
          if (q === '"' || q === "'") {
            var e = s.indexOf(q, j + 1);
            if (e < 0) fail();
            value = s.slice(j + 1, e);
            j = e + 1;
          } else {
            st = j;
            while (j < s.length && !/\s/.test(s.charAt(j))) j++;
            value = s.slice(st, j);
          }
        }
        out.push([name, value]);
      }
      return out;
    }
    function element() {
      var node = { name: readWhile(/[\w:-]/), ops: [], children: [] };
      if (node.name && !/^[A-Za-z]/.test(node.name)) fail();
      for (;;) {
        var c = peek(), v;
        if (c === '#' || c === '.') {
          i++;
          v = readWhile(/[\w$@-]/);
          if (!v) fail();
          node.ops.push([c === '#' ? 'id' : 'class', v]);
        } else if (c === '[') {
          readAttrs(readUntil(']')).forEach(function (a) { node.ops.push(['attr', a[0], a[1]]); });
        } else if (c === '{') {
          if (node.text !== undefined) fail();
          node.text = readUntil('}');
        } else break;
      }
      if (!node.name && !node.ops.length) {
        if (node.text === undefined) fail();
        node.isText = true;
      }
      readRepeat(node);
      return node;
    }
    function term() {
      if (peek() !== '(') return element();
      i++;
      var g = { group: sequence(), children: [] };
      if (peek() !== ')') fail();
      i++;
      readRepeat(g);
      return g;
    }
    function sequence() {
      var root = { children: [] }, ctx = root;
      for (;;) {
        var t = term();
        t.parent = ctx;
        ctx.children.push(t);
        var c = peek();
        if (c === '>') { i++; if (t.group || t.isText) fail(); ctx = t; }
        else if (c === '+') i++;
        else if (c === '^') { while (peek() === '^') { i++; ctx = ctx.parent || root; } }
        else break;
      }
      return root.children;
    }
    var list = sequence();
    if (i !== n) fail();
    return list;
  }

  /** Every tag written in the abbreviation must be a real HTML tag (or one of Emmet's aliases). */
  function allKnown(nodes) {
    return nodes.every(function (nd) {
      if (nd.group) return allKnown(nd.group);
      if (nd.name) {
        var name = nd.name.toLowerCase();
        if (!ALIASES[name] && !(TAGS[name] && name.indexOf(':') < 0)) return false;
      }
      return allKnown(nd.children);
    });
  }

  /* ---------- building: repeat, number and fill in the implicit tags and usual attributes ---------- */

  function number(s, num) {
    if (s.indexOf('$') < 0) return s;
    return s.replace(/(\$+)(@(-)?(\d+)?)?/g, function (_, dollars, at, minus, base) {
      var start = base ? +base : 1;
      var v = num ? (minus ? start + num.n - 1 - num.i : start + num.i) : start;
      var str = String(v);
      while (str.length < dollars.length) str = '0' + str;
      return str;
    });
  }

  function implicitTag(parent) {
    parent = String(parent || '').toLowerCase();
    if (/^(ul|ol|menu)$/.test(parent)) return 'li';
    if (/^(table|tbody|thead|tfoot)$/.test(parent)) return 'tr';
    if (parent === 'tr') return 'td';
    if (/^(select|optgroup|datalist)$/.test(parent)) return 'option';
    if (INLINE[parent]) return 'span';
    return 'div';
  }

  function makeElement(node, parentTag, num) {
    var name = node.name || implicitTag(parentTag);
    var alias = ALIASES[name.toLowerCase()];
    var tag = alias ? alias[0] : name;
    var attrs = alias ? alias[1].map(function (a) { return [a[0], a[1]]; }) : [];
    var classes = [];
    function put(k, v) {
      for (var j = 0; j < attrs.length; j++) if (attrs[j][0] === k) { attrs[j][1] = v; return; }
      attrs.push([k, v]);
    }
    node.ops.forEach(function (op) {
      if (op[0] === 'id') put('id', number(op[1], num));
      else if (op[0] === 'class') { if (!classes.length) put('class', ''); classes.push(number(op[1], num)); }
      else put(op[1], op[2] === null ? '' : number(op[2], num));
    });
    if (classes.length) put('class', classes.join(' '));
    return {
      tag: tag, attrs: attrs, isVoid: !!VOID[tag.toLowerCase()],
      text: node.text !== undefined ? number(node.text, num) : '',
      children: build(node.children, tag, num)
    };
  }

  function build(nodes, parentTag, num) {
    var out = [];
    nodes.forEach(function (nd) {
      var times = nd.repeat || 1;
      for (var k = 0; k < times; k++) {
        var mine = nd.repeat ? { i: k, n: times } : num;
        if (nd.group) out.push.apply(out, build(nd.group, parentTag, mine));
        else if (nd.isText) out.push({ text: number(nd.text, mine) });
        else out.push(makeElement(nd, parentTag, mine));
      }
    });
    return out;
  }

  /* ---------- rendering: block elements on their own lines, inline ones kept together ---------- */

  function indent(depth) { var s = ''; for (var k = 0; k < depth; k++) s += UNIT; return s; }
  function attrText(attrs) { return attrs.map(function (a) { return ' ' + a[0] + '="' + (a[1] === '' ? MARK : a[1]) + '"'; }).join(''); }
  function inlineSafe(nd) { return nd.tag === undefined || (!!INLINE[nd.tag.toLowerCase()] && nd.children.every(inlineSafe)); }
  function flat(nd) {
    if (nd.tag === undefined) return nd.text;
    var open = '<' + nd.tag + attrText(nd.attrs) + '>';
    if (nd.isVoid) return open;
    var inner = nd.text + nd.children.map(flat).join('');
    return open + (inner || MARK) + '</' + nd.tag + '>';
  }
  function block(nd, depth) {
    var pad = indent(depth);
    if (nd.tag === undefined || nd.isVoid || nd.children.every(inlineSafe)) return pad + flat(nd);
    var lines = [pad + '<' + nd.tag + attrText(nd.attrs) + '>'];
    if (nd.text) lines.push(pad + UNIT + nd.text);
    lines.push(list(nd.children, depth + 1));
    lines.push(pad + '</' + nd.tag + '>');
    return lines.join('\n');
  }
  function list(nodes, depth) {
    if (nodes.every(inlineSafe)) return indent(depth) + nodes.map(flat).join('');
    return nodes.map(function (nd) { return block(nd, depth); }).join('\n');
  }

  /** {text, cursor} for an abbreviation, or null. cursor is an offset into text. */
  function expandWithCursor(abbr) {
    abbr = String(abbr || '').trim();
    if (!abbr) return null;
    var raw;
    if (abbr === '!' || abbr === 'html:5') raw = PAGE;
    else {
      var tree;
      try { tree = parse(abbr); } catch (e) { return null; }
      if (!allKnown(tree)) return null;
      raw = list(build(tree, '', null), 0);
    }
    var at = raw.indexOf(MARK);
    var text = raw.split(MARK).join('');
    return { text: text, cursor: at < 0 ? text.length : at };
  }

  function expand(abbr) { var r = expandWithCursor(abbr); return r ? r.text : null; }

  /* ---------- the editor side ---------- */

  /**
   * The abbreviation that ends at the cursor, from the text of the line before and after it:
   * {start, end, abbr, result} in line positions, or null. Brackets that the editor closed by
   * itself (a[href=#|]) count as part of it.
   */
  function find(before, after) {
    var i = before.length;
    while (i > 0) {
      var ch = before.charAt(i - 1);
      if (ch === ']' || ch === '}') {
        var open = before.lastIndexOf(ch === ']' ? '[' : '{', i - 2);
        if (open < 0) break;
        i = open;
      } else if (/[\w.#>+^*$@!:()%-]/.test(ch)) i--;
      else break;
    }
    // a '>' that closes a tag on this line is not part of the abbreviation: <p>ul>li
    var lt = before.lastIndexOf('<');
    if (lt >= 0) {
      var gt = closeOfTag(before, lt);
      if (gt < 0) return null; // the cursor is inside a tag
      i = Math.max(i, gt + 1);
    }
    var abbr = before.slice(i);
    if (!abbr || /^\s/.test(abbr)) return null;
    var tail = /^[\]})]*/.exec(after)[0];
    for (var cut = tail.length; cut >= 0; cut--) {
      var r = expandWithCursor(abbr + tail.slice(0, cut));
      if (r) return { start: i, end: before.length + cut, abbr: abbr + tail.slice(0, cut), result: r };
    }
    return null;
  }
  function closeOfTag(s, lt) {
    var q = null;
    for (var j = lt + 1; j < s.length; j++) {
      var c = s.charAt(j);
      if (q) { if (c === q) q = null; }
      else if (c === '"' || c === "'") q = c;
      else if (c === '>') return j;
    }
    return -1;
  }

  /** Only in HTML (not inside <style> or <script>), with nothing selected. */
  function findAtCursor(cm) {
    if (cm.somethingSelected() || cm.getOption('readOnly')) return null;
    var cur = cm.getCursor();
    var tok = cm.getTokenAt(cur);
    var inner = window.CodeMirror.innerMode(cm.getMode(), tok.state);
    if (inner.mode.name !== 'xml') return null;
    var line = cm.getLine(cur.line);
    var hit = find(line.slice(0, cur.ch), line.slice(cur.ch));
    if (hit) hit.line = cur.line;
    return hit;
  }

  function expandAtCursor(cm) {
    var hit = findAtCursor(cm);
    if (!hit) return false;
    var pad = /^\s*/.exec(cm.getLine(hit.line))[0];
    var text = hit.result.text.split('\n').join('\n' + pad);
    var cursor = hit.result.cursor + (hit.result.text.slice(0, hit.result.cursor).split('\n').length - 1) * pad.length;
    var Pos = window.CodeMirror.Pos;
    cm.operation(function () {
      var from = Pos(hit.line, hit.start);
      var startIndex = cm.indexFromPos(from);
      // origin without "+": one undo step of its own, never merged with the typing before it
      cm.replaceRange(text, from, Pos(hit.line, hit.end), 'emmet');
      cm.setCursor(cm.posFromIndex(startIndex + cursor));
    });
    hidePreview();
    return true;
  }

  /* "Tab will give you this": a small box under the cursor while an abbreviation is typed */
  var box = null;
  function hidePreview() { if (box) box.style.display = 'none'; }
  function showPreview(cm, hit) {
    if (!box) {
      box = U.h('div', { class: 'emmet-preview', role: 'status' });
      document.body.appendChild(box);
    }
    var lines = hit.result.text.split('\n');
    var shown = lines.slice(0, 10).join('\n') + (lines.length > 10 ? '\n…' : '');
    box.innerHTML = '';
    box.appendChild(U.h('div', { class: 'emmet-preview-head' }, U.h('kbd', null, 'Tab'), ' expands ', U.h('code', null, hit.abbr), ' (Emmet)'));
    box.appendChild(U.h('pre', null, shown));
    var c = cm.cursorCoords(true, 'window');
    box.style.display = 'block';
    var w = box.offsetWidth;
    box.style.left = Math.max(8, Math.min(c.left, window.innerWidth - w - 8)) + 'px';
    var top = c.bottom + 6;
    if (top + box.offsetHeight > window.innerHeight - 8) top = Math.max(8, c.top - box.offsetHeight - 6);
    box.style.top = top + 'px';
  }

  function attach(cm) {
    var update = U.debounce(function () {
      // show-hint keeps a completion "active" even when it found nothing to list: only a visible list counts
      var listing = cm.state.completionActive && cm.state.completionActive.widget;
      if (!cm.hasFocus() || listing) { hidePreview(); return; }
      var hit = findAtCursor(cm);
      // a lone word like "div" needs no preview; an operator shows it is meant as an abbreviation
      if (hit && /[>+^*.#[{(!]/.test(hit.abbr)) showPreview(cm, hit); else hidePreview();
    }, 120);
    cm.on('cursorActivity', update);
    cm.on('blur', hidePreview);
    cm.on('scroll', hidePreview);
  }

  U.emmet = { expand: expand, expandWithCursor: expandWithCursor, expandAtCursor: expandAtCursor, attach: attach, find: find, hidePreview: hidePreview };
})(window.UILT);
