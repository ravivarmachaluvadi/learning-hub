/*
 * assist.js - "learn while you type" in every editable Kotlin editor: autocomplete and hover (the
 * Python Learning Tool's, for Kotlin).
 *
 *   Autocomplete opens by itself on the second letter of a name, and after a dot (or ?.); Ctrl+Space
 *   opens it any time. It offers keywords, the standard library's top-level functions (println,
 *   listOf, require…), your own names (from fun, val, var, class, object, interface, typealias,
 *   parameters, for and lambda parameters, catch), and after a dot the members of the receiver's type
 *   when the text shows it (val s = "…", xs: List<Int>, = mutableMapOf(…); since batch 4 also flows,
 *   jobs, channels and mutexes: = flowOf(…), = launch { }, = MutableStateFlow(…)), or every member when
 *   it does not (it., a call's result). A CoroutineScope's members (launch, async, produce) are offered
 *   bare too, as code inside a coroutine calls them. Nothing is offered inside a string or a comment,
 *   except inside a string template (${…}, $name). The box beside the list shows the highlighted
 *   name's Reference entry.
 *   Hover a name to see its Reference entry (data/reference-*.js), with a link to it; Ctrl+click
 *   opens it.
 *
 * Both work from the code's text alone: no compiler is asked, so they work opened from disk too, and a
 * guess about a value's type can be wrong.
 *
 *   KLT.assist.complete(code, index) -> {from, to, list: [{text, kind, detail, entry?}]} or null
 *   KLT.assist.lookup(word, {attr})   -> the Reference entries for a name (attr: it follows a dot)
 *   KLT.assist.attach(cm)             wires both into a CodeMirror editor (js/editor.js calls it)
 */
(function (U) {
  'use strict';
  var h = U.h;
  var NAME_RE = /[A-Za-z_][A-Za-z0-9_]*$/;
  var MAX = 250;
  // a type guessed from the text -> the Reference receivers whose members it has
  function dict(o) { return Object.assign(Object.create(null), o || {}); }   // no inherited keys: 'constructor' is a keyword here
  var HAS = dict({
    String: ['String', 'Any'], List: ['List', 'Iterable', 'Any'], Set: ['Iterable', 'Any'], Range: ['Iterable', 'Any'],
    Map: ['Map', 'Any'], Sequence: ['Sequence', 'Any'], Number: ['Number', 'Any'], Char: ['Char', 'Any'], Array: ['Array', 'Any'],
    Result: ['Result', 'Any'], Comparator: ['Comparator', 'Any'], Closeable: ['Closeable', 'Any'],
    // batch 4: kotlinx.coroutines (a Deferred is a Job with a result; a StateFlow and a SharedFlow are flows)
    Flow: ['Flow', 'Any'], StateFlow: ['StateFlow', 'Flow', 'Any'], SharedFlow: ['SharedFlow', 'Flow', 'Any'], Job: ['Job', 'Any'],
    Deferred: ['Deferred', 'Job', 'Any'], Channel: ['Channel', 'Any'], Mutex: ['Mutex', 'Any'], CoroutineScope: ['CoroutineScope', 'Any']
  });
  var TYPE_NAMES = dict({
    String: 'String', CharSequence: 'String', StringBuilder: 'String',
    List: 'List', MutableList: 'List', ArrayList: 'List', Collection: 'List', MutableCollection: 'List', Iterable: 'List',
    Set: 'Set', MutableSet: 'Set', HashSet: 'Set', LinkedHashSet: 'Set', IntRange: 'Range', LongRange: 'Range', CharRange: 'Range',
    Map: 'Map', MutableMap: 'Map', HashMap: 'Map', LinkedHashMap: 'Map', Sequence: 'Sequence',
    Int: 'Number', Long: 'Number', Double: 'Number', Float: 'Number', Short: 'Number', Byte: 'Number', Number: 'Number',
    Char: 'Char', Array: 'Array', IntArray: 'Array', LongArray: 'Array', DoubleArray: 'Array', CharArray: 'Array', BooleanArray: 'Array',
    Result: 'Result', Comparator: 'Comparator', Closeable: 'Closeable', AutoCloseable: 'Closeable',
    Flow: 'Flow', StateFlow: 'StateFlow', MutableStateFlow: 'StateFlow', SharedFlow: 'SharedFlow', MutableSharedFlow: 'SharedFlow',
    Job: 'Job', Deferred: 'Deferred', Channel: 'Channel', SendChannel: 'Channel', ReceiveChannel: 'Channel', Mutex: 'Mutex',
    CoroutineScope: 'CoroutineScope'
  });

  /* ---------------------------------------------------------------- the index of Reference names */

  var idx = null;
  function index() {
    if (idx) return idx;
    idx = { names: dict(), members: dict(), toplevel: [], keywords: [], scoped: [] };
    function put(map, name, e) { (map[name] = map[name] || []).push(e); }
    (U.data.reference || []).forEach(function (e) {
      var names = [e.name].concat(e.covers || []);
      if (e.group === 'keywords') {
        names.forEach(function (n) { put(idx.names, n, e); if (/^\w+$/.test(n)) idx.keywords.push({ name: n, entry: e }); });
        return;
      }
      if ((e.receiver || []).length) {
        names.forEach(function (n) { put(idx.members, n, e); });
        if (e.receiver.indexOf('CoroutineScope') >= 0) idx.scoped.push({ name: e.name, entry: e });
      }
      else names.forEach(function (n) { put(idx.names, n, e); if (/^\w+$/.test(n)) idx.toplevel.push({ name: n, entry: e }); });
    });
    if (!idx.keywords.some(function (k) { return k.name === 'it'; })) idx.keywords.push({ name: 'it', entry: null });
    return idx;
  }

  /** The Reference entries for a name; attr: the name follows a dot, so it is a member. */
  function lookup(word, opts) {
    var ix = index(), attr = opts && opts.attr;
    if (!word) return [];
    if (attr) return (ix.members[word] || ix.names[word] || []).slice();
    return (ix.names[word] || ix.members[word] || []).slice();
  }

  /* ---------------------------------------------------------------- reading the code */

  /**
   * One pass over the code, labelling each character with what a cursor just after it is in: 'c' code,
   * 's' string, 'm' comment, 't' the name of a $name template. Kotlin's rules: line comments and nested
   * block comments, "…" with escapes, """raw""" strings, 'c' characters, and templates ${…} (their inside is
   * code, which can hold strings of its own) and $name. A closing quote, a comment's end and a template's
   * opening { are labelled for what follows them. The last code scanned is kept, as completion asks often.
   */
  var scanned = { code: null, kinds: null };
  function scan(code) {
    if (scanned.code === code) return scanned.kinds;
    var n = code.length, k = new Array(n), stack = [], mode = 'c', raw = false, depth = 0, i = 0, j;
    function mark(from, to, kind) { for (var x = from; x < to && x < n; x++) k[x] = kind; }
    while (i < n) {
      var c = code.charAt(i), nx = code.charAt(i + 1);
      if (mode === 'c') {
        if (c === '/' && nx === '/') {
          j = code.indexOf('\n', i);
          if (j < 0) j = n;
          mark(i, j, 'm');
          i = j;
          continue;
        }
        if (c === '/' && nx === '*') {
          var d = 1;
          j = i + 2;
          while (j < n && d > 0) {
            if (code.substr(j, 2) === '/*') { d++; j += 2; } else if (code.substr(j, 2) === '*/') { d--; j += 2; } else j++;
          }
          mark(i, d > 0 ? n : j - 1, 'm');
          if (d === 0) k[j - 1] = 'c';
          i = j;
          continue;
        }
        if (c === '"') {
          raw = code.substr(i, 3) === '"""';
          mark(i, i + (raw ? 3 : 1), 's');
          mode = 's';
          i += raw ? 3 : 1;
          continue;
        }
        if (c === "'") {
          j = i + 1;
          while (j < n && code.charAt(j) !== "'" && code.charAt(j) !== '\n') j += code.charAt(j) === '\\' ? 2 : 1;
          mark(i, j, 's');
          if (j < n) k[j] = 'c';
          i = j + 1;
          continue;
        }
        k[i] = 'c';
        if (stack.length && c === '{') depth++;
        else if (stack.length && c === '}' && --depth === 0) {
          var top = stack.pop();
          k[i] = 's';
          mode = 's';
          raw = top.raw;
          depth = top.depth;
        }
        i++;
        continue;
      }
      // inside a string
      if (!raw && c === '\\') { mark(i, i + 2, 's'); i += 2; continue; }
      if (raw ? code.substr(i, 3) === '"""' : c === '"') {
        var len = 1;
        if (raw) { len = 3; while (code.charAt(i + len) === '"') len++; }
        mark(i, i + len - 1, 's');
        k[i + len - 1] = 'c';
        mode = 'c';
        i += len;
        continue;
      }
      if (!raw && c === '\n') { k[i] = 'c'; mode = 'c'; i++; continue; }      // a string left open ends at the line
      if (c === '$' && nx === '{') {
        k[i] = 's';
        k[i + 1] = 'c';
        stack.push({ raw: raw, depth: depth });
        mode = 'c';
        depth = 1;
        i += 2;
        continue;
      }
      if (c === '$' && /[A-Za-z_]/.test(nx)) {
        var name = /^[A-Za-z_]\w*/.exec(code.slice(i + 1))[0];
        k[i] = 's';
        mark(i + 1, i + 1 + name.length, 't');
        i += 1 + name.length;
        continue;
      }
      k[i] = 's';
      i++;
    }
    scanned = { code: code, kinds: k };
    return k;
  }

  /** Where index `at` (a cursor) falls: 'code', 'string', 'comment', or 'template-name' (in a $name). */
  function contextAt(code, at) {
    if (at <= 0) return 'code';
    var kind = scan(code)[Math.min(at, code.length) - 1];
    return kind === 's' ? 'string' : kind === 'm' ? 'comment' : kind === 't' ? 'template-name' : 'code';
  }

  /** The code with comments and the inside of strings blanked (positions kept; templates kept), for scanning names. */
  function codeOnly(code) {
    var k = scan(code), out = new Array(code.length);
    for (var i = 0; i < code.length; i++) {
      var c = code.charAt(i);
      out[i] = c === '\n' || k[i] === 'c' || k[i] === 't' ? c : ' ';
    }
    return out.join('');
  }

  /** The names in a parameter list "a: Int, val b: String = "x", vararg c: Int" (brackets inside skipped). */
  function paramNames(list) {
    var names = [], depth = 0, part = '';
    function flush() {
      var m = /^\s*(?:@\w+(?:\([^)]*\))?\s+)*(?:(?:private|public|internal|protected|override|open|vararg|noinline|crossinline|val|var)\s+)*([A-Za-z_]\w*)\s*:/.exec(part);
      if (m) names.push(m[1]);
      part = '';
    }
    for (var i = 0; i < list.length; i++) {
      var c = list.charAt(i);
      if ('([{<'.indexOf(c) >= 0) depth++;
      else if (')]}>'.indexOf(c) >= 0) depth--;
      if (c === ',' && depth === 0) flush(); else part += c;
    }
    flush();
    return names;
  }

  /** The text inside the brackets that open at `from` (code[from] === '('), or ''. */
  function bracketed(code, from) {
    var depth = 0;
    for (var i = from; i < code.length; i++) {
      var c = code.charAt(i);
      if (c === '(') depth++;
      else if (c === ')' && --depth === 0) return code.slice(from + 1, i);
    }
    return code.slice(from + 1);
  }

  /** Your own names: {name: kind}, kind one of 'your function', 'class', 'variable', 'parameter'. */
  function ownNames(code, skip) {
    var src = codeOnly(code), names = dict(), m;
    function add(n, kind) { if (n && /^[A-Za-z_]\w*$/.test(n) && !names[n]) names[n] = kind; }
    var funs = /\bfun\s+(?:<[^>]*>\s*)?(?:[\w.<>?, ]+\.)?([A-Za-z_]\w*)\s*\(/g;
    while ((m = funs.exec(src))) {
      add(m[1], 'your function');
      paramNames(bracketed(src, m.index + m[0].length - 1)).forEach(function (p) { add(p, 'parameter'); });
    }
    var types = /\b(?:class|interface|object|typealias)\s+([A-Za-z_]\w*)(\s*(?:<[^>]*>)?\s*(?:(?:private|internal|protected|public|@\w+)\s+)*(?:constructor\s*)?\()?/g;
    while ((m = types.exec(src))) {
      add(m[1], 'class');
      if (m[2]) paramNames(bracketed(src, m.index + m[0].length - 1)).forEach(function (p) { add(p, 'parameter'); });
    }
    var vals = /\b(?:val|var)\s+(?:[\w.<>?]+\.)?([A-Za-z_]\w*)/g;
    while ((m = vals.exec(src))) add(m[1], 'variable');
    var destr = /\b(?:val|var)\s*\(([^)]*)\)/g;
    while ((m = destr.exec(src))) m[1].split(',').forEach(function (p) { add(p.split(':')[0].trim(), 'variable'); });
    var loops = /\bfor\s*\(\s*\(?([\w\s,]+?)\)?\s+in\b/g;
    while ((m = loops.exec(src))) m[1].split(',').forEach(function (p) { add(p.trim(), 'variable'); });
    var lambdas = /\{\s*\(?((?:[A-Za-z_]\w*(?:\s*:\s*[\w.<>?]+)?\s*,\s*)*[A-Za-z_]\w*(?:\s*:\s*[\w.<>?]+)?)\)?\s*->/g;
    while ((m = lambdas.exec(src))) m[1].split(',').forEach(function (p) { add(p.split(':')[0].trim(), 'parameter'); });
    var catches = /\bcatch\s*\(\s*([A-Za-z_]\w*)/g;
    while ((m = catches.exec(src))) add(m[1], 'variable');
    delete names[skip];
    return names;
  }

  /** Names your code uses after a dot, and the members its classes declare: offered after a dot too. */
  function ownMembers(code) {
    var src = codeOnly(code), out = dict(), m;
    var dots = /\.\s*([A-Za-z_]\w*)/g;
    while ((m = dots.exec(src))) out[m[1]] = true;
    var members = /^[ \t]+(?:(?:override|open|private|protected|internal|public|abstract|lateinit|const|operator|infix|inline|suspend)\s+)*(?:val|var|fun)\s+(?:<[^>]*>\s*)?([A-Za-z_]\w*)/gm;
    while ((m = members.exec(src))) out[m[1]] = true;
    var props = /\(\s*((?:[^()]|\([^()]*\))*)\)/g;
    while ((m = props.exec(src))) {
      var each = /\b(?:val|var)\s+([A-Za-z_]\w*)\s*:/g, p;
      while ((p = each.exec(m[1]))) out[p[1]] = true;
    }
    return out;
  }

  /** A guess at the type of `name` from where it is declared before `before`: a key of HAS, or null. */
  function guessType(code, name, before) {
    if (!name) return null;
    var src = codeOnly(code.slice(0, before)), raw = code.slice(0, before), m, found = null;
    var esc = name.replace(/[$]/g, '\\$');
    var typed = new RegExp('(?:\\b(?:val|var)\\s+|[(,]\\s*(?:(?:val|var|vararg)\\s+)?)' + esc + '\\s*:\\s*([A-Za-z_][\\w.]*)', 'g');
    while ((m = typed.exec(src))) found = { at: m.index, type: TYPE_NAMES[m[1].split('.').pop()] || null };
    var init = new RegExp('\\b(?:val|var)\\s+' + esc + '\\s*(?::[^=\\n]*)?=\\s*', 'g');
    while ((m = init.exec(src))) {
      if (found && found.at > m.index) continue;
      var rest = raw.slice(m.index + m[0].length, m.index + m[0].length + 60);
      var t = null;
      if (/^"/.test(rest) || /^(buildString|String\()/.test(rest)) t = 'String';
      else if (/^(listOf|mutableListOf|arrayListOf|emptyList|listOfNotNull|List\(|MutableList\(|buildList)/.test(rest)) t = 'List';
      else if (/^(setOf|mutableSetOf|hashSetOf|linkedSetOf|emptySet|buildSet)/.test(rest)) t = 'Set';
      else if (/^(mapOf|mutableMapOf|hashMapOf|linkedMapOf|emptyMap|buildMap)/.test(rest)) t = 'Map';
      else if (/^(sequenceOf|generateSequence|sequence\s*\{|emptySequence)/.test(rest)) t = 'Sequence';
      else if (/^(arrayOf|intArrayOf|longArrayOf|doubleArrayOf|charArrayOf|arrayOfNulls|Array\(|IntArray\()/.test(rest)) t = 'Array';
      else if (/^-?\d[\d_]*\s*(\.\.|until\b|downTo\b)/.test(rest)) t = 'Range';
      else if (/^-?\d/.test(rest)) t = 'Number';
      else if (/^'/.test(rest)) t = 'Char';
      else if (/^runCatching/.test(rest)) t = 'Result';
      else if (/^(compareBy|Comparator)/.test(rest)) t = 'Comparator';
      else if (/^(flowOf|emptyFlow|flow\s*[<{]|channelFlow|callbackFlow)/.test(rest)) t = 'Flow';
      else if (/^MutableStateFlow\b/.test(rest)) t = 'StateFlow';
      else if (/^MutableSharedFlow\b/.test(rest)) t = 'SharedFlow';
      else if (/^(\w+\.)?launch\b/.test(rest)) t = 'Job';
      else if (/^(\w+\.)?async\b/.test(rest)) t = 'Deferred';
      else if (/^(Channel\s*[<(]|(\w+\.)?produce\b)/.test(rest)) t = 'Channel';
      else if (/^Mutex\s*\(/.test(rest)) t = 'Mutex';
      else if (/^CoroutineScope\s*\(/.test(rest)) t = 'CoroutineScope';
      found = { at: m.index, type: t };
    }
    return found ? found.type : null;
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
   * What to offer at index: {from, to, list} or null. Items: {text, kind, detail, entry?}; kind is one of
   * 'member', 'keyword', 'function' (the standard library's), or your name's kind ('your function',
   * 'class', 'variable', 'parameter', 'yours' after a dot).
   */
  function complete(code, at) {
    code = String(code || '');
    var ctx = contextAt(code, at);
    if (ctx === 'comment' || ctx === 'string') return null;
    var head = code.slice(0, at);
    var typed = (NAME_RE.exec(head) || [''])[0];
    if (!typed && /\w$/.test(head)) return null;              // in a number, such as 12
    var after = (/^[A-Za-z0-9_]*/.exec(code.slice(at)) || [''])[0];
    var start = at - typed.length;
    var beforeTyped = code.slice(0, start);
    var ix = index(), items = [], seen = dict();
    function push(text, kind, detail, entry, rank) {
      if (seen[text]) return;
      var m = matches(text, typed);
      if (!m) return;
      seen[text] = true;
      items.push({ text: text, kind: kind, detail: detail || '', entry: entry || null, score: m * 10 + (rank || 0) });
    }

    var own = ownNames(code.slice(0, start) + code.slice(at + after.length), typed);
    if (ctx === 'template-name') {
      Object.keys(own).forEach(function (n) { if (own[n] !== 'class') push(n, own[n], 'your ' + own[n].replace('your ', ''), null, 4); });
    } else {
      var dot = /([A-Za-z_]\w*|\)|\]|")\s*\??\.\s*$/.exec(beforeTyped);
      if (dot) {
        var recv = dot[1];
        var type = recv === '"' ? 'String' : /^\w+$/.test(recv) && recv !== 'it' && recv !== 'this' ? guessType(code, recv, start) : null;
        var has = type ? HAS[type] : null;
        (U.data.reference || []).forEach(function (e) {
          var rs = e.receiver || [];
          if (!rs.length) return;
          var fits = !has || rs.some(function (r) { return has.indexOf(r) >= 0; });
          if (!fits) return;
          var own = has && rs.indexOf(has[0]) >= 0;      // the type's own members first, then Any's (let, also, to…)
          [e.name].concat(e.covers || []).forEach(function (n) {
            if (/^[a-z]\w*$/.test(n)) push(n, 'member', rs.join(', ') + ': ' + firstSentence(e.summary), e, has ? (own ? 6 : 5) : 2);
          });
        });
        if (recv !== '"' && !has) {
          var mine = ownMembers(code.slice(0, start) + code.slice(at + after.length));
          Object.keys(mine).forEach(function (n) { if (n !== typed) push(n, 'yours', 'used or declared in your code', null, 4); });
        } else if (has && /^\w+$/.test(recv)) {
          var mine2 = ownMembers(code.slice(0, start) + code.slice(at + after.length));
          Object.keys(mine2).forEach(function (n) { if (n !== typed && (ix.members[n] || []).some(function (e) { return (e.receiver || []).some(function (r) { return has.indexOf(r) >= 0; }); })) push(n, 'member', '', (ix.members[n] || [])[0], 5); });
        }
      } else {
        Object.keys(own).forEach(function (n) { push(n, own[n], own[n].indexOf('your') === 0 ? own[n] : 'your ' + own[n], null, 4); });
        ix.keywords.forEach(function (k) { push(k.name, 'keyword', k.entry ? firstSentence(k.entry.summary) : 'the lambda\'s one parameter', k.entry, 3); });
        ix.toplevel.forEach(function (b) { push(b.name, 'function', firstSentence(b.entry.summary), b.entry, 2); });
        // inside a coroutine `this` is a CoroutineScope, so its members are called bare: launch, async, produce
        ix.scoped.forEach(function (b) { push(b.name, 'function', 'CoroutineScope: ' + firstSentence(b.entry.summary), b.entry, 2); });
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
    U.enhance(tip);
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
    var ctx = contextAt(cm.getValue(), abs + 1);
    if (/\d/.test(word.charAt(0)) || ctx === 'comment' || ctx === 'string') return null;
    var found = lookup(word, { attr: /\.\s*$/.test(line.slice(0, s)) });
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
      // a dot (or ?.) after a name, a string or a call (not after a number), or the second letter of a name
      if (typedNow === '.' ? /(^|[^\w.])[A-Za-z_]\w*\??\.$|["\])]\??\.$/.test(before) : /^\w$/.test(typedNow) && /(^|[^\w])[A-Za-z_]\w+$/.test(before)) open(c);
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

  U.assist = { complete: complete, lookup: lookup, attach: attach, contextAt: contextAt, hideTip: function () { hideTip(); hideInfo(); } };
})(window.KLT);
