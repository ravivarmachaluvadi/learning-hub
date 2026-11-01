/*
 * assist.js - "learn while you type" in every editable Java editor: autocomplete and hover (batch 3; the
 * Kotlin Learning Tool's, for Java and its concurrency APIs).
 *
 *   Autocomplete opens by itself on the second letter of a name, and after a dot; Ctrl+Space opens it any
 *   time. It offers Java's keywords, the Reference's types (Thread, ReentrantLock, CompletableFuture…),
 *   your own names (methods and their parameters, classes and records, fields and local variables, for,
 *   lambda and catch variables), and after a dot:
 *     - after a type name (Executors., Thread., CompletableFuture., StructuredTaskScope.): its static
 *       methods (data/members.js, read from the JDK by reflection), the Reference's first;
 *     - after a variable whose declaration shows its type (var lock = new ReentrantLock(), ExecutorService
 *       pool = …, var f = CompletableFuture.supplyAsync(…), var scope = StructuredTaskScope.open()…):
 *       that type's public methods from the same table, the Reference's first, so nothing is offered that
 *       would not compile;
 *     - otherwise (a call's result, a name whose type the text does not show): every instance member
 *       the Reference knows, and the names used after a dot in your code.
 *   Nothing is offered inside a string, a text block, a character or a comment. The box beside the list
 *   shows the highlighted name's Reference entry.
 *   Hover a name to see its Reference entry (data/reference-*.js), with a link to it; Ctrl+click opens it.
 *
 * Both work from the code's text alone: no compiler is asked, so they work opened from disk too, and a
 * guess about a value's type can be wrong.
 *
 *   JCLT.assist.complete(code, index) -> {from, to, list: [{text, kind, detail, entry?}]} or null
 *   JCLT.assist.lookup(word, {attr})   -> the Reference entries for a name (attr: it follows a dot)
 *   JCLT.assist.attach(cm)             wires both into a CodeMirror editor (js/editor.js calls it)
 *
 * A Reference entry is a type (no owner, no receiver: ReentrantLock), a static member (owner: 'Executors'),
 * an instance member (receiver: ['Lock']: what it is called on) or a keyword (kind: 'keyword').
 */
(function (U) {
  'use strict';
  var h = U.h;
  var NAME_RE = /[A-Za-z_$][A-Za-z0-9_$]*$/;
  var MAX = 250;
  function dict(o) { return Object.assign(Object.create(null), o || {}); }   // no inherited keys ('constructor', 'toString')

  var KEYWORDS = ('abstract assert boolean break byte case catch char class continue default do double else enum extends final finally float for ' +
    'if implements import instanceof int interface long native new package private protected public return short static super switch ' +
    'synchronized this throw throws transient try void volatile while var record yield sealed permits true false null').split(' ');

  // a type named in the code -> the Reference receivers whose members it has (its own first)
  var HAS = dict({
    Thread: ['Thread'], 'Thread.Builder': ['Thread.Builder'], Builder: ['Thread.Builder'],
    ReentrantLock: ['ReentrantLock', 'Lock'], Lock: ['Lock'], Condition: ['Condition'], ReentrantReadWriteLock: ['ReadWriteLock'], ReadWriteLock: ['ReadWriteLock'],
    StampedLock: ['StampedLock'], Object: ['Object'],
    ExecutorService: ['ExecutorService'], Executor: ['ExecutorService'], ThreadPoolExecutor: ['ThreadPoolExecutor', 'ExecutorService'],
    ScheduledExecutorService: ['ScheduledExecutorService', 'ExecutorService'], ScheduledThreadPoolExecutor: ['ScheduledExecutorService', 'ThreadPoolExecutor', 'ExecutorService'],
    ForkJoinPool: ['ForkJoinPool', 'ExecutorService'],
    Future: ['Future'], CompletableFuture: ['CompletableFuture', 'Future'], CompletionStage: ['CompletableFuture'], ScheduledFuture: ['Future'],
    ForkJoinTask: ['ForkJoinTask', 'Future'], RecursiveTask: ['ForkJoinTask', 'Future'], RecursiveAction: ['ForkJoinTask', 'Future'],
    AtomicInteger: ['AtomicInteger'], AtomicLong: ['AtomicInteger'], AtomicBoolean: ['AtomicInteger'], AtomicReference: ['AtomicReference'],
    LongAdder: ['LongAdder'], LongAccumulator: ['LongAdder'],
    ConcurrentHashMap: ['ConcurrentHashMap', 'Map'], ConcurrentMap: ['ConcurrentHashMap', 'Map'], Map: ['Map'], HashMap: ['Map'],
    CopyOnWriteArrayList: ['CopyOnWriteArrayList'], BlockingQueue: ['BlockingQueue'], ArrayBlockingQueue: ['BlockingQueue'],
    LinkedBlockingQueue: ['BlockingQueue'], SynchronousQueue: ['BlockingQueue'], BlockingDeque: ['BlockingQueue'], LinkedBlockingDeque: ['BlockingQueue'],
    CountDownLatch: ['CountDownLatch'], CyclicBarrier: ['CyclicBarrier'], Semaphore: ['Semaphore'], Phaser: ['Phaser'], Exchanger: ['Exchanger'],
    StructuredTaskScope: ['StructuredTaskScope'], Subtask: ['Subtask'], 'StructuredTaskScope.Subtask': ['Subtask'],
    ScopedValue: ['ScopedValue'], Carrier: ['ScopedValue.Carrier'], StableValue: ['StableValue'], ThreadLocal: ['ThreadLocal'], InheritableThreadLocal: ['ThreadLocal']
  });
  // what a call returns, when a variable is declared with `var x = <call>(`: [regex on the text after `=`, type]
  var RETURNS = [
    [/^new\s+([A-Z]\w*)/, null],
    [/^Executors\s*\.\s*newScheduledThreadPool\b/, 'ScheduledExecutorService'],
    [/^Executors\s*\.\s*new\w*/, 'ExecutorService'],
    [/^ForkJoinPool\s*\.\s*commonPool\b/, 'ForkJoinPool'],
    [/^CompletableFuture\s*\.\s*\w+/, 'CompletableFuture'],
    [/^\w+\s*\.\s*(thenApply|thenCompose|thenCombine|exceptionally|handle|whenComplete|orTimeout|completeOnTimeout|thenAccept|thenRun)\w*\s*\(/, 'CompletableFuture'],
    [/^Thread\s*\.\s*(ofVirtual|ofPlatform)\s*\(\s*\)\s*(\.\s*(name|daemon|factory)\b[^;]*?)?\s*\.\s*(start|unstarted)\s*\(/, 'Thread'],
    [/^Thread\s*\.\s*(ofVirtual|ofPlatform)\s*\(/, 'Thread.Builder'],
    [/^Thread\s*\.\s*(startVirtualThread|currentThread)\b/, 'Thread'],
    [/^StructuredTaskScope\s*\.\s*open\b/, 'StructuredTaskScope'],
    [/^\w+\s*\.\s*fork\s*\(/, 'Subtask'],
    [/^\w+\s*\.\s*(submit|schedule)\s*\(/, 'Future'],
    [/^\w+\s*\.\s*newCondition\s*\(/, 'Condition'],
    [/^ScopedValue\s*\.\s*newInstance\b/, 'ScopedValue'],
    [/^StableValue\s*\.\s*of\b/, 'StableValue'],
    [/^ThreadLocal\s*\.\s*withInitial\b/, 'ThreadLocal'],
    [/^ConcurrentHashMap\s*\.\s*newKeySet\b/, null]
  ];

  /* ---------------------------------------------------------------- the index of Reference names */

  var idx = null;
  function index() {
    if (idx) return idx;
    idx = { names: dict(), members: dict(), statics: dict(), types: [], keywords: [] };
    function put(map, name, e) { (map[name] = map[name] || []).push(e); }
    (U.data.reference || []).forEach(function (e) {
      var names = [e.name].concat(e.covers || []);
      if (e.kind === 'keyword') { names.forEach(function (n) { put(idx.names, n, e); }); return; }
      if (e.owner) {
        names.forEach(function (n) { put(idx.members, n, e); put(idx.names, e.owner + '.' + n, e); });
        (idx.statics[e.owner] = idx.statics[e.owner] || []).push(e);
        return;
      }
      if ((e.receiver || []).length) { names.forEach(function (n) { put(idx.members, n, e); }); return; }
      names.forEach(function (n) { put(idx.names, n, e); if (/^[A-Z]\w*$/.test(n)) idx.types.push({ name: n, entry: e }); });
    });
    KEYWORDS.forEach(function (k) { idx.keywords.push({ name: k, entry: (idx.names[k] || [])[0] || null }); });
    return idx;
  }

  /** What the JDK says a type has (data/members.js, read by reflection): {i: instance methods, s: static}. */
  function membersOf(type) {
    var all = U.data.members;
    return all && Object.prototype.hasOwnProperty.call(all, type) ? all[type] : null;
  }

  var instanceNames = null;
  function isInstanceMember(name) {
    if (!U.data.members) return true;
    if (!instanceNames) {
      instanceNames = dict();
      Object.keys(U.data.members).forEach(function (t) { U.data.members[t].i.forEach(function (n) { instanceNames[n] = true; }); });
    }
    return !!instanceNames[name];
  }

  /** The Reference entry describing method `name` of `type`, or null: one that says it is called on the
   *  type or a supertype (has), or the type's own entry when it lists the method. */
  function entryFor(name, type, has) {
    var ix = index(), list = (ix.members[name] || []).concat(ix.names[name] || []);
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.owner) continue;
      if ((e.receiver || []).some(function (r) { return has.indexOf(r) >= 0; })) return e;
      if (e.name === type || (e.covers || []).indexOf(type) >= 0) return e;
    }
    return null;
  }

  /** For a class the Reference knows only by its static methods (Executors, CompletableFuture…): an entry
   *  made up for the info box, listing them. */
  function ownerEntry(owner) {
    var list = index().statics[owner] || [];
    if (!list.length) return null;
    return { id: list[0].id, group: list[0].group, title: owner, since: list[0].since, preview: list.some(function (e) { return e.preview; }),
      sig: owner + '.' + list.map(function (e) { return e.name; }).join(', ' + owner + '.'),
      summary: 'Its static methods in the Reference: ' + list.map(function (e) { return '`' + e.name + '`'; }).join(', ') + '. Type a dot after `' + owner + '` to choose one.' };
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
   * 's' a string, text block or character, 'm' a comment. A closing quote and a comment's end are labelled
   * for what follows them. The last code scanned is kept, as completion asks often.
   */
  var scanned = { code: null, kinds: null };
  function scan(code) {
    if (scanned.code === code) return scanned.kinds;
    var n = code.length, k = new Array(n), i = 0, j;
    function mark(from, to, kind) { for (var x = from; x < to && x < n; x++) k[x] = kind; }
    while (i < n) {
      var c = code.charAt(i), nx = code.charAt(i + 1);
      if (c === '/' && nx === '/') {
        j = code.indexOf('\n', i);
        if (j < 0) j = n;
        mark(i, j, 'm');
        i = j;
        continue;
      }
      if (c === '/' && nx === '*') {
        j = code.indexOf('*/', i + 2);
        j = j < 0 ? n : j + 2;
        mark(i, j - 1, 'm');
        if (j <= n && j - 1 < n) k[j - 1] = 'c';
        i = j;
        continue;
      }
      if (code.substr(i, 3) === '"""') {
        j = i + 3;
        while (j < n && code.substr(j, 3) !== '"""') j += code.charAt(j) === '\\' ? 2 : 1;
        mark(i, Math.min(n, j + 2), 's');
        if (j + 2 < n) k[j + 2] = 'c';
        i = j + 3;
        continue;
      }
      if (c === '"' || c === "'") {
        j = i + 1;
        while (j < n && code.charAt(j) !== c && code.charAt(j) !== '\n') j += code.charAt(j) === '\\' ? 2 : 1;
        mark(i, j, 's');
        if (j < n) k[j] = 'c';
        i = j + 1;
        continue;
      }
      k[i] = 'c';
      i++;
    }
    scanned = { code: code, kinds: k };
    return k;
  }

  /** Where index `at` (a cursor) falls: 'code', 'string' or 'comment'. */
  function contextAt(code, at) {
    if (at <= 0) return 'code';
    var kind = scan(code)[Math.min(at, code.length) - 1];
    return kind === 's' ? 'string' : kind === 'm' ? 'comment' : 'code';
  }

  /** The code with comments and the inside of strings blanked (positions kept), for scanning names. */
  function codeOnly(code) {
    var k = scan(code), out = new Array(code.length);
    for (var i = 0; i < code.length; i++) {
      var c = code.charAt(i);
      out[i] = c === '\n' || k[i] === 'c' ? c : ' ';
    }
    return out.join('');
  }

  /** The names in a parameter list "int a, final List<String> b, Service... s" (brackets inside skipped). */
  function paramNames(list) {
    var names = [], depth = 0, part = '';
    function flush() {
      var m = /([A-Za-z_$][\w$]*)\s*(?:\[\s*\])*\s*$/.exec(part.trim());
      if (m && /\S\s+\S/.test(part.trim())) names.push(m[1]);
      part = '';
    }
    for (var i = 0; i < list.length; i++) {
      var c = list.charAt(i);
      if ('(<['.indexOf(c) >= 0) depth++;
      else if (')>]'.indexOf(c) >= 0) depth--;
      if (c === ',' && depth === 0) flush(); else part += c;
    }
    flush();
    return names;
  }

  /** The text inside the brackets that open at `from` (code[from] === '('), or the rest. */
  function bracketed(code, from) {
    var depth = 0;
    for (var i = from; i < code.length; i++) {
      var c = code.charAt(i);
      if (c === '(') depth++;
      else if (c === ')' && --depth === 0) return code.slice(from + 1, i);
    }
    return code.slice(from + 1);
  }

  var NOT_A_TYPE = /^(return|new|throw|else|case|yield|package|import|instanceof)$/;
  var CONTROL = /^(if|for|while|switch|catch|synchronized|try|return|new|throw|else|do|super|this)$/;

  /** Your own names: {name: kind}, kind one of 'your method', 'class', 'variable', 'parameter'. */
  function ownNames(code, skip) {
    var src = codeOnly(code), names = dict(), m;
    function add(n, kind) { if (n && /^[A-Za-z_$][\w$]*$/.test(n) && KEYWORDS.indexOf(n) < 0 && !names[n]) names[n] = kind; }
    var methods = /(?:^|[;{}]|\n)[ \t]*(?:(?:public|private|protected|static|final|synchronized|abstract|default|native)\s+)*(?:<[^>]*>\s*)?([A-Za-z_$][\w$.]*(?:<[^;{}()]*>)?(?:\[\])*)\s+([A-Za-z_$][\w$]*)\s*\(/g;
    while ((m = methods.exec(src))) {
      if (NOT_A_TYPE.test(m[1]) || CONTROL.test(m[2])) continue;
      var after = src.slice(m.index + m[0].length - 1);
      var params = bracketed(after, 0);
      var rest = after.slice(params.length + 2);
      if (!/^\s*(throws[^{;]*)?\{/.test(rest)) continue;     // a call or a declaration without a body: not a method
      add(m[2], 'your method');
      paramNames(params).forEach(function (p) { add(p, 'parameter'); });
    }
    var types = /\b(class|interface|record|enum)\s+([A-Z][\w$]*)(\s*(?:<[^>]*>)?\s*\()?/g;
    while ((m = types.exec(src))) {
      add(m[2], 'class');
      if (m[3]) paramNames(bracketed(src, m.index + m[0].length - 1)).forEach(function (p) { add(p, 'parameter'); });
    }
    var vars = /(?:\bvar|\b(?:int|long|double|float|boolean|char|byte|short)|\b[A-Z][\w$.]*(?:<(?:[^<>;=]|<[^<>;=]*>)*>)?(?:\[\])*)\s+([a-z_$][\w$]*)\s*(?=[=;,:)])/g;
    while ((m = vars.exec(src))) add(m[1], 'variable');
    var lambdas = /\(\s*([a-z_$][\w$]*(?:\s*,\s*[a-z_$][\w$]*)*)\s*\)\s*->|\b([a-z_$][\w$]*)\s*->/g;
    while ((m = lambdas.exec(src))) (m[1] || m[2]).split(',').forEach(function (p) { add(p.trim(), 'parameter'); });
    var catches = /\bcatch\s*\(\s*(?:final\s+)?[\w.|\s]+?\s+([a-z_$][\w$]*)\s*\)/g;
    while ((m = catches.exec(src))) add(m[1], 'variable');
    delete names[skip];
    return names;
  }

  /** Names your code uses after a dot: offered after a dot when the type is not known. */
  function ownMembers(code) {
    var src = codeOnly(code), out = dict(), m;
    var dots = /\.\s*([a-z_$][\w$]*)/g;
    while ((m = dots.exec(src))) out[m[1]] = true;
    return out;
  }

  /** A guess at the type of `name` from where it is declared before `before`: a key of HAS, or null. */
  function guessType(code, name, before) {
    if (!name) return null;
    var src = codeOnly(code.slice(0, before)), m, found = null;
    var esc = name.replace(/[$.]/g, '\\$&');
    var typed = new RegExp('\\b([A-Z][\\w$]*(?:\\.[A-Z][\\w$]*)*)\\s*(?:<(?:[^<>;=]|<[^<>;=]*>)*>)?\\s+' + esc + '\\s*(?=[=;,:)])', 'g');
    while ((m = typed.exec(src))) {
      var t = m[1], last = t.split('.').pop();
      if (t === 'var') continue;
      found = { at: m.index, type: HAS[t] ? t : HAS[last] ? last : null };
    }
    var init = new RegExp('\\bvar\\s+' + esc + '\\s*=\\s*', 'g');
    while ((m = init.exec(src))) {
      if (found && found.at > m.index) continue;
      var rest = src.slice(m.index + m[0].length, m.index + m[0].length + 160);
      var type = null;
      for (var i = 0; i < RETURNS.length; i++) {
        var r = RETURNS[i][0].exec(rest);
        if (!r) continue;
        type = RETURNS[i][1] || (r[1] && HAS[r[1]] ? r[1] : null);
        break;
      }
      found = { at: m.index, type: type };
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
   * 'member', 'static', 'keyword', 'type', or your name's kind ('your method', 'class', 'variable',
   * 'parameter', 'yours' after a dot).
   */
  function complete(code, at) {
    code = String(code || '');
    var ctx = contextAt(code, at);
    if (ctx === 'comment' || ctx === 'string') return null;
    var head = code.slice(0, at);
    var typed = (NAME_RE.exec(head) || [''])[0];
    if (!typed && /\w$/.test(head)) return null;              // in a number, such as 12
    if (/^\d/.test(typed)) return null;
    var after = (/^[A-Za-z0-9_$]*/.exec(code.slice(at)) || [''])[0];
    var start = at - typed.length;
    var beforeTyped = code.slice(0, start);
    var ix = index(), items = [], seen = dict();
    function push(text, kind, detail, entry, rank) {
      if (seen[text]) return;
      var mm = matches(text, typed);
      if (!mm) return;
      seen[text] = true;
      items.push({ text: text, kind: kind, detail: detail || '', entry: entry || null, score: mm * 10 + (rank || 0) });
    }
    var rest = code.slice(0, start) + code.slice(at + after.length);

    var dot = /([A-Za-z_$][\w$]*(?:\s*\.\s*[A-Z][\w$]*)*|\)|\]|")\s*\.\s*$/.exec(beforeTyped);
    if (dot) {
      var recv = dot[1].replace(/\s+/g, '');
      var lastPart = recv.split('.').pop();
      if (/^[A-Z]/.test(lastPart) && !guessType(code, recv, start)) {
        // a type: its static members (StructuredTaskScope.Joiner. -> Joiner's), the Reference's first
        var ownerTable = membersOf(lastPart);
        (ix.statics[lastPart] || []).forEach(function (e) {
          [e.name].concat(e.covers || []).forEach(function (n) {
            if (!ownerTable || ownerTable.s.indexOf(n) >= 0) push(n, 'static', lastPart + ': ' + firstSentence(e.summary), e, 6);
          });
        });
        if (ownerTable) ownerTable.s.forEach(function (n) { push(n, 'static', 'a static method of ' + lastPart, null, 3); });
        if (lastPart === 'StructuredTaskScope') ['Joiner', 'Subtask', 'Configuration', 'FailedException', 'TimeoutException'].forEach(function (n) { push(n, 'type', 'a nested type of StructuredTaskScope', (ix.names[n] || [])[0], 5); });
        if (lastPart === 'Thread') push('Builder', 'type', 'Thread.Builder: made by ofVirtual() and ofPlatform()', null, 4);
      } else {
        var type = recv === '"' ? null : /^[\w$]+$/.test(recv) && recv !== 'this' ? guessType(code, recv, start) : null;
        var has = type ? HAS[type] : null;
        var table = type ? membersOf(type) : null;
        if (table) {
          // the JDK's own list for this type, those with a Reference entry first
          table.i.forEach(function (n) {
            var e = entryFor(n, type, has);
            var own = e && (e.receiver || []).indexOf(has[0]) >= 0;
            push(n, 'member', e ? (e.receiver || [type]).join(', ') + ': ' + firstSentence(e.summary) : 'a method of ' + type, e, e ? (own ? 6 : 5) : 3);
          });
        } else {
          // the type is not known: anything the Reference calls a member, if some known type really has it
          (U.data.reference || []).forEach(function (e) {
            var rs = e.receiver || [];
            if (!rs.length || e.owner) return;
            [e.name].concat(e.covers || []).forEach(function (n) {
              if (/^[a-z]\w*$/.test(n) && isInstanceMember(n)) push(n, 'member', rs.join(', ') + ': ' + firstSentence(e.summary), e, 2);
            });
          });
        }
        if (!table) {
          var mine = ownMembers(rest);
          Object.keys(mine).forEach(function (n) { if (n !== typed) push(n, 'yours', 'used after a dot in your code', null, 4); });
        }
      }
    } else {
      var own = ownNames(rest, typed);
      Object.keys(own).forEach(function (n) { push(n, own[n], own[n].indexOf('your') === 0 ? own[n] : 'your ' + own[n], null, 4); });
      ix.keywords.forEach(function (k) { push(k.name, 'keyword', k.entry ? firstSentence(k.entry.summary) : 'a Java keyword', k.entry, 3); });
      ix.types.forEach(function (b) { push(b.name, 'type', firstSentence(b.entry.summary), b.entry, 2); });
      Object.keys(ix.statics).forEach(function (o) { if (!ix.names[o]) push(o, 'type', 'a class with static methods: ' + o + '.…', ownerEntry(o), 2); });
    }
    if (!items.length) return null;
    items.sort(function (a, b) { return b.score - a.score || (a.text.length - b.text.length) || (a.text < b.text ? -1 : 1); });
    if (items.length === 1 && items[0].text === typed) return null;     // already typed in full
    return { from: start, to: at + after.length, list: items.slice(0, MAX).map(function (i) { delete i.score; return i; }) };
  }

  /* ---------------------------------------------------------------- the info box and the hover tip */

  function entryHtml(e) {
    return '<div class="ref-tip-sig"><code>' + U.esc(e.sig) + '</code></div>' + U.md(e.summary) +
      '<div class="ref-tip-java">Since Java ' + U.esc(e.since) + (e.preview ? ' · <b>a preview API in Java 25</b>' : '') + '</div>';
  }

  var info = null;
  function showInfo(item, node) {
    if (!item || !item.entry || !node || !node.parentNode) { hideInfo(); return; }
    var r = node.parentNode.getBoundingClientRect(), w = Math.min(360, window.innerWidth - 16);
    var left = r.right + 6;
    if (left + w > window.innerWidth - 8) left = r.left - w - 6;
    if (left < 8) { hideInfo(); return; }      // no room beside the list (a phone): it would cover the list, whose own line says enough
    if (!info) { info = h('div', { class: 'hint-info', role: 'note' }); document.body.appendChild(info); }
    info.innerHTML = '';
    info.appendChild(h('div', { class: 'hint-info-title' }, item.entry.title, h('span', { class: 'ref-tip-kind' }, item.kind)));
    info.appendChild(h('div', { class: 'hint-info-body', html: entryHtml(item.entry) }));
    info.style.display = 'block';
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
    while (s > 0 && /[\w$]/.test(line.charAt(s - 1))) s--;
    while (e < line.length && /[\w$]/.test(line.charAt(e))) e++;
    if (s === e) return null;
    var a = cm.charCoords({ line: pos.line, ch: s }, 'window'), b = cm.charCoords({ line: pos.line, ch: e }, 'window');
    if (x < a.left || x > b.left || y < a.top || y > b.bottom) return null;
    var word = line.slice(s, e);
    var abs = cm.indexFromPos({ line: pos.line, ch: s });
    var ctx = contextAt(cm.getValue(), abs + 1);
    if (/\d/.test(word.charAt(0)) || ctx === 'comment' || ctx === 'string') return null;
    var before = line.slice(0, s), owner = /([A-Z][\w$]*)\s*\.\s*$/.exec(before);
    var found = owner ? lookup(owner[1] + '.' + word) : [];
    if (!found.length) found = lookup(word, { attr: /\.\s*$/.test(before) });
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
      // a dot after a name or a call (not after a number), or the second letter of a name
      if (typedNow === '.' ? /(^|[^\w.$])[A-Za-z_$][\w$]*\.$|[\])]\.$/.test(before) : /^[\w$]$/.test(typedNow) && /(^|[^\w$])[A-Za-z_$][\w$]+$/.test(before)) open(c);
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

  U.assist = { complete: complete, lookup: lookup, attach: attach, contextAt: contextAt, guessType: guessType, types: Object.keys(HAS), hideTip: function () { hideTip(); hideInfo(); } };
})(window.JCLT);
