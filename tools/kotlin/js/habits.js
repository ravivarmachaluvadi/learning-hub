/*
 * habits.js - the Java-habit warnings (⚠): lines a Java developer writes from habit, which Kotlin
 * either rejects (a compile error) or accepts while there is a Kotlin way to write them.
 *
 *   KLT.javaHabits(code) -> [{line, id, msg}]   line is 1-based; msg is Markdown saying what to write
 *                                              instead, and why
 *   KLT.javaHabits.rules -> [{id, compiles}]    compiles: the habit compiles, and its message starts
 *                                              "This compiles, but"
 *
 * js/editor.js shows each one as a ⚠ in the margin of every editable Kotlin editor, with the message on
 * hover. Nothing is compiled, so the warnings work opened from disk too; once ktlearn runs, the
 * compiler's own ✕ follows a moment later for the habits that do not compile.
 *
 * The rules read only code: strings (with their ${…} templates), characters and comments (which nest
 * in Kotlin) are blanked out first, keeping every position and line break, so "new Foo()" in a string
 * never warns. A rule marked `only` explains its line by itself (a Java `for` line would otherwise also
 * warn about its declaration); a rule marked `top` applies only to a line that starts a statement (not
 * inside brackets). The coroutine rules (batch 4) ask what a line sits in: s.context(line, col) lists the
 * text before each `{` that encloses that place, innermost last (`launch `, `suspend fun load(): String `).
 *
 * Whether each habit compiles was checked on kotlinc 2.4.20 (ROADMAP.md, batches 2 and 3), and tests/test_ui.py
 * ("warnings", "underline") proves each rule fires on its habit and not on the Kotlin way, that each
 * habit compiles exactly when its rule says, and that no example, starter, solution, template or code
 * block warns except where it shows the habit on purpose.
 */
(function (U) {
  'use strict';

  /** Blank out strings, characters and comments, keeping positions. -> {code, lines, depth} */
  function scan(text) {
    var out = text.split(''), n = text.length;
    function blank(a, b) { for (var k = a; k < b; k++) if (out[k] !== '\n') out[k] = ' '; }
    function block(i) {                       // a /* comment */, which may hold others: -> its end
      var depth = 0;
      while (i < n) {
        if (text.substr(i, 2) === '/*') { depth++; i += 2; }
        else if (text.substr(i, 2) === '*/') { depth--; i += 2; if (!depth) return i; }
        else i++;
      }
      return n;
    }
    function chr(i) {                         // a 'c' character: -> its end (a stray ' blanks nothing)
      var j = i + 1 + (text.charAt(i + 1) === '\\' ? 2 : 1);
      while (j < n && j - i < 10 && text.charAt(j) !== "'" && text.charAt(j) !== '\n') j++;
      return text.charAt(j) === "'" ? j + 1 : i + 1;
    }
    function str(i) {                         // a "string" or a """raw string""", with its templates: -> its end
      var raw = text.substr(i, 3) === '"""', j = i + (raw ? 3 : 1);
      while (j < n) {
        var c = text.charAt(j);
        if (!raw && c === '\\') { j += 2; continue; }
        if (c === '$' && text.charAt(j + 1) === '{') { j = code(j + 2, true); continue; }
        if (raw ? text.substr(j, 3) === '"""' : c === '"') {
          j += raw ? 3 : 1;
          while (raw && text.charAt(j) === '"') j++;     // """" : the last three close it
          return j;
        }
        if (c === '\n' && !raw) return j;                 // an unclosed string ends with its line
        j++;
      }
      return n;
    }
    function code(i, template) {              // code from i; in a ${template}, up to the } that closes it
      var depth = 0;
      while (i < n) {
        var c = text.charAt(i), d = text.charAt(i + 1), e;
        if (c === '/' && d === '/') { e = text.indexOf('\n', i); if (e < 0) e = n; blank(i, e); i = e; continue; }
        if (c === '/' && d === '*') { e = block(i); blank(i, e); i = e; continue; }
        if (c === '"') { e = str(i); blank(i, e); i = e; continue; }
        if (c === "'") { e = chr(i); blank(i, e); i = e; continue; }
        if (template) {
          if (c === '{') depth++;
          else if (c === '}') { if (!depth) return i + 1; depth--; }
        }
        i++;
      }
      return n;
    }
    code(0, false);
    var blanked = out.join(''), lines = blanked.split('\n'), depth = [], level = 0, stacks = [], braces = [];
    function opener(li, m) {                  // what a `{` belongs to: its line up to it, or the line above when it stands alone
      var t = lines[li].slice(0, m);
      return !t.trim() && li > 0 ? lines[li - 1] : t;
    }
    lines.forEach(function (l, li) {
      depth.push(level);
      stacks.push(braces.slice());
      for (var m = 0; m < l.length; m++) {
        var ch = l.charAt(m);
        if (ch === '(' || ch === '[') level++;
        else if ((ch === ')' || ch === ']') && level > 0) level--;
        else if (ch === '{') braces.push(opener(li, m));
        else if (ch === '}') braces.pop();
      }
    });
    function context(li, col) {
      var st = stacks[li].slice(), l = lines[li];
      for (var m = 0; m < col && m < l.length; m++) {
        if (l.charAt(m) === '{') st.push(opener(li, m));
        else if (l.charAt(m) === '}') st.pop();
      }
      return st;
    }
    return { code: blanked, lines: lines, depth: depth, context: context };
  }

  // what a block belongs to, read from the text before its `{` (batch 4's coroutine rules)
  var ON_IO = /\bDispatchers\s*\.\s*IO\b/;
  var IN_COROUTINE = /\b(launch|async|runBlocking|coroutineScope|supervisorScope|withContext|withTimeout|withTimeoutOrNull|runTest|flow|channelFlow|callbackFlow|produce)\b|\bsuspend\s+fun\b/;
  var NOT_COROUTINE = /\bfun\b|\b(thread|Thread|submit|execute|Runnable|Callable)\b/;
  /** Is the place (line i, column col) inside a coroutine, and not where blocking belongs (Dispatchers.IO)? */
  function inCoroutine(s, i, col) {
    var st = s.context(i, col);
    for (var k = st.length - 1; k >= 0; k--) {
      if (ON_IO.test(st[k])) return false;
      if (IN_COROUTINE.test(st[k])) return true;
      if (NOT_COROUTINE.test(st[k])) return false;
    }
    return false;
  }

  var PRIMS = 'int|long|short|byte|double|float|boolean|char';
  var JAVA_DECL = new RegExp('^\\s*(final\\s+)?((' + PRIMS + ')(\\[\\])*\\s+[a-z_]\\w*\\s*(=|;|$)|[A-Z]\\w*(<.*>)?(\\[\\])*\\s+[a-z_]\\w*\\s*(=|;))');
  var ARRAY_TYPE = new RegExp('\\b(' + PRIMS + '|[A-Z]\\w*)\\[\\]\\s*[a-z_]\\w*');
  // the `;` Kotlin needs after an enum's constants when it has members: `RED(1), GREEN(2);`, or `};`
  // closing the last constant's own body (found in batch 2: Op's TIMES { … };)
  var ENUM_ENTRIES = /^\s*([A-Z][A-Z0-9_]*\s*(\([^)]*\))?\s*,\s*)*[A-Z][A-Z0-9_]*\s*(\([^)]*\))?\s*;\s*$|^\s*\}\s*;\s*$/;
  var GETTER = /\bfun\s+get[A-Z]\w*\s*\(\s*\)/;
  var SETTER = /\bfun\s+set([A-Z])(\w*)\s*\(\s*([a-z_]\w*)\s*:[^,()]*\)/;

  var RULES = [
    // first, the lines one warning explains: nothing else on them is reported
    { id: 'java-main', only: true, test: /\b(public\s+)?static\s+void\s+main\s*\(/,
      msg: 'A Kotlin program starts at a top-level function: `fun main() { … }`. No class, no `public static void`, and no `String[] args` unless you need them (`fun main(args: Array<String>)`).' },
    { id: 'c-for', only: true, test: /^\s*for\s*\([^)]*;/,
      msg: 'Kotlin\'s `for` goes over a range or a collection; there is no `for (init; test; step)`. Count with `for (i in 0 until n)` (0 to n − 1) or `for (i in 1..n)`, and visit each item with `for (x in items)`.' },
    { id: 'wildcard', only: true, test: /\?\s+(extends|super)\b/,
      msg: 'Kotlin writes Java\'s wildcards with `out` and `in`: `? extends T` is `out T` (you only take Ts out), `? super T` is `in T` (you only put Ts in): `MutableList<out Number>`.' },
    { id: 'extends-bound', only: true, test: /<\s*[A-Z]\w*\s+extends\s+[A-Z]/,
      msg: 'Kotlin writes a bound on a type parameter with a colon: `fun <T : Comparable<T>> biggest(a: T, b: T)`. Several bounds go in a `where` clause: `where T : CharSequence, T : Comparable<T>`.' },

    // habits that do not compile
    { id: 'new', test: /(^|[^\w.])new\s+[A-Z][\w.]*\s*[(<\[]/,
      msg: 'Kotlin has no `new`: calling the class creates the object. Write `Point(1, 2)`.' },
    { id: 'declaration', test: function (line, i, s) {
        return (s.depth[i] === 0 && JAVA_DECL.test(line)) || ARRAY_TYPE.test(line);
      },
      msg: 'Kotlin writes `val` (set once) or `var` (can change), then the name, then the type: `val name: String = "Li"`, or just `val name = "Li"`, since the type is inferred. Arrays are `Array<String>` and `IntArray`, not `String[]` and `int[]`, and there is no `final`: a `val` already is.' },
    { id: 'ternary', test: /\s\?\s+[^:]*?\s:\s/,
      msg: 'Kotlin has no `a ? b : c`. `if` is an expression and gives the value: `val max = if (a > b) a else b`. For "this, or a default when it is null", the Elvis operator: `name ?: "none"`.' },
    { id: 'switch', test: /\bswitch\s*\(/,
      msg: 'Kotlin uses `when` instead of `switch`: `when (x) { 1 -> "one"; 2, 3 -> "few"; else -> "many" }`. No `case`, no `break`, no fall-through, and it gives a value.' },
    { id: 'length-call', test: /\.length\s*\(\s*\)/,
      msg: 'A string\'s length is a property in Kotlin: `s.length`, no brackets. (A collection has `size`.)' },
    { id: 'size-call', test: /\.size\s*\(\s*\)/,
      msg: 'A collection\'s size is a property in Kotlin: `items.size`, no brackets. `count { … }` counts the items that match a condition.' },
    { id: 'static', test: /(^|[^\w.])static\b/,
      msg: 'Kotlin has no `static`. Put the function or constant at the top level of the file, or, when it belongs to a class, in its `companion object { … }`: callers still write `MathUtil.twice(2)`.' },
    { id: 'void', test: /(^|[^\w.])void\b/,
      msg: 'Kotlin has no `void`. A function that returns nothing returns `Unit`, and you leave it out: `fun greet() { … }`.' },
    { id: 'catch', test: /\bcatch\s*\(\s*[A-Z][\w.]*(\s*\|\s*[A-Z][\w.]*)*\s+[a-z_]\w*\s*\)/,
      msg: 'Kotlin writes the name first, then the type: `catch (e: IOException)`. To catch two types, write two `catch` blocks, or catch a common parent and check with `when (e) { is … }`.' },
    { id: 'throws', test: /(^|[^@\w])throws\s+[A-Z]/,
      msg: 'Kotlin has no checked exceptions, so a function does not declare what it throws: drop `throws …`. (Java callers that must catch it need `@Throws(IOException::class)` on the function.)' },
    { id: 'instanceof', test: /\binstanceof\b/,
      msg: '`instanceof` is `is` in Kotlin: `if (x is String)`. After the check, `x` is a `String` inside the `if` (a smart cast): no cast needed.' },
    { id: 'extends', test: /\b(extends|implements)\s+[A-Z]/,
      msg: 'Kotlin writes the parents after a colon: `class Dog : Animal(), Pet`. A class you extend is called, `Animal()`, because its constructor runs; an interface is not. In generics, `<T extends X>` is `<T : X>`.' },
    { id: 'override-annotation', test: /@Override\b/,
      msg: 'Kotlin marks an override with the `override` keyword, and it is required: `override fun toString() = "…"`. Java\'s `@Override` adds nothing.' },
    { id: 'cast', test: /(?<!\b(if|while|when|for|catch)\s*)(?<![\w)\]>?])\(\s*([A-Z]\w*(<[^()]*>)?|int|long|double|float|short|byte|char|boolean)\s*\)\s*[a-z_(]/,
      msg: 'Kotlin casts with `as`: `obj as String`. `as?` gives null instead of throwing when the value is something else, and after an `is` check you need no cast at all.' },
    { id: 'java-lambda', test: /\(\s*[a-z_]\w*\s*->|\(\s*\(\s*[a-z_]\w*(\s*,\s*[a-z_]\w*)*\s*\)\s*->/,
      msg: 'A Kotlin lambda goes in braces, with the arrow inside: `names.forEach { n -> println(n) }`, `reduce { a, b -> a + b }`. As the last argument it goes after the brackets, and a single parameter can be left out and called `it`: `names.forEach { println(it) }`.' },
    { id: 'java-collection', test: /(^|[^\w.])(List|Set|Map)\s*\.\s*of\s*\(|<>\s*\(/,
      msg: 'Kotlin makes collections with functions: `listOf(1, 2)`, `setOf(…)`, `mapOf("a" to 1)`, and `mutableListOf()`, `mutableMapOf()` for ones that change. There is no diamond `<>`: the types are inferred, or written out, `mutableListOf<Int>()`.' },
    { id: 'java-convert', test: /(^|[^\w.])(String\s*\.\s*valueOf|Long\s*\.\s*parseLong|Double\s*\.\s*parseDouble|Float\s*\.\s*parseFloat|Boolean\s*\.\s*parseBoolean|Short\s*\.\s*parseShort|Byte\s*\.\s*parseByte)\s*\(/,
      msg: 'In Kotlin, `String`, `Long`, `Double` and `Boolean` are Kotlin types, without Java\'s static `valueOf` and `parse…`. Convert the value itself: `n.toString()`, `"4".toLong()`, `"2.5".toDouble()`, `"true".toBoolean()` (or `toLongOrNull()`, which gives null for bad text).' },
    { id: 'try-resources', test: /\btry\s*\(/,
      msg: 'Kotlin has no try-with-resources. Call `use` on anything closeable: `reader.use { r -> … }` closes it at the end, even after an exception.' },
    { id: 'labelled-break', test: /\b(break|continue)\s+(?!else\b)[a-z_]\w*/,
      msg: 'Kotlin writes a label with `@`: mark the loop `outer@ for (…)`, then `break@outer` or `continue@outer`, with no space.' },
    { id: 'class-literal', test: /(^|[^\w.])([A-Z][\w.]*|int|long|double|float|short|byte|char|boolean|void)\s*\.\s*class\b/,
      msg: 'Kotlin writes a class literal with `::`: `String::class` is a Kotlin `KClass`, and `String::class.java` the Java `Class` that a Java API asks for.' },
    { id: 'get-class', test: /\.\s*getClass\s*\(\s*\)/,
      msg: 'Kotlin types do not show `getClass()`. Write `x::class` for the Kotlin `KClass`, and `x::class.java` or `x.javaClass` for the Java `Class`: `x::class.simpleName`, `x.javaClass.name`.' },

    // habits that compile: Kotlin accepts them, and has its own way
    { id: 'println', compiles: true, test: /\bSystem\s*\.\s*out\s*\.\s*print(ln|f)?\b/,
      msg: 'This compiles, but Kotlin prints with `println(x)` and `print(x)`: no `System.out`. (For text with values in it, a template: `println("Total: $total")`.)' },
    { id: 'equals', compiles: true, test: function (line) {
        return /\.equals\s*\(/.test(line.replace(/\bsuper\s*\.\s*equals\s*\(/g, '')) && !/\bignoreCase\b/.test(line);
      },
      msg: 'This compiles, but in Kotlin `==` calls `equals` for you (and handles null): write `a == b`. `===` asks whether two references point to the same object.' },
    // put with two arguments only: a one-argument put is some other API (a sink, a queue)
    { id: 'get-put', compiles: true, test: /\.get\s*\(\s*[^)\s]|\.put\s*\([^,()]*,/,
      msg: 'This compiles, but Kotlin indexes with brackets: `list[i]`, `map[key]`, and `map[key] = value` instead of `put`. (On a `Map`, `map[key]` gives null when the key is missing.)' },
    { id: 'semicolon', compiles: true, test: function (line) { return /;\s*$/.test(line) && !ENUM_ENTRIES.test(line); },
      msg: 'This compiles, but a Kotlin statement ends at the end of the line, so the `;` is not needed, and Kotlin code never has one. It is needed only between two statements on one line, and after the entries of an `enum` that has members.' },
    // a setter only when its parameter is `value` or the property's own name: setName(name), not setUp(name)
    { id: 'getter', compiles: true, test: function (line) {
        var m = SETTER.exec(line);
        return GETTER.test(line) || (!!m && (m[3] === 'value' || m[3] === m[1].toLowerCase() + m[2]));
      },
      msg: 'This compiles, but a Kotlin class uses a property instead of a getter and a setter: `val name: String` (read-only) or `var name: String`. Java code still sees `getName()` and `setName(…)`, made for you.' },
    { id: 'this-assign', compiles: true, test: /\bthis\s*\.\s*(\w+)\s*=\s*\1\b(?!\s*[.(\[?!])/,
      msg: 'This compiles, but Kotlin declares the property and fills it from the constructor in one place: `class Person(val name: String)`. A constructor body that copies its parameters into fields is what the primary constructor does for you.' },
    { id: 'stream', compiles: true, test: /\.stream\s*\(\s*\)/,
      msg: 'This compiles, but Kotlin collections have `map`, `filter`, `sortedBy`, `groupBy` and the rest built in: `list.filter { it > 0 }`, with no `stream()` and no `collect`. For a long chain over a big collection, `asSequence()` is the lazy version.' },
    { id: 'optional', compiles: true, test: /\bOptional\s*[<.]/,
      msg: 'This compiles, but Kotlin has "maybe no value" in its types: `String?` instead of `Optional<String>`, `?.` instead of `map`, and `?:` instead of `orElse`.' },
    { id: 'java-parse', compiles: true, test: /\bInteger\s*\.\s*(parseInt|valueOf)\s*\(/,
      msg: 'This compiles, but Kotlin converts text with a function on the text itself: `"42".toInt()`, or `"42".toIntOrNull()`, which gives null instead of throwing for bad text. (Kotlin\'s type is `Int`; `Integer` is Java\'s.)' },
    { id: 'public', compiles: true, test: /(^|[^\w.])public\s+(fun|class|val|var|interface|object|abstract|open|data|enum|sealed|override|inline|suspend|operator|infix|const|lateinit|inner|value|annotation|constructor)\b/,
      msg: 'This compiles, but `public` is already the default in Kotlin, so Kotlin code leaves it out. Write `private`, `protected` or `internal` when you mean them.' },
    { id: 'object-type', compiles: true, test: /([:<,(]\s*|\bas\??\s+)Object\b(?!\s*[(.:])/,
      msg: 'This compiles, but Kotlin\'s top type is `Any`, not `Object`. To the compiler a Kotlin `String` or `Int` is not a `java.lang.Object`, so passing one where `Object` is declared does not compile. Write `Any` (or `Any?` when null is allowed).' },

    // batch 4: coroutines. All three compile; the compiler warns only about GlobalScope ("a delicate API")
    { id: 'global-scope', compiles: true, test: /\bGlobalScope\s*\./,
      msg: 'This compiles, but a coroutine started in `GlobalScope` belongs to no scope: nothing waits for it, nothing cancels it, and its errors reach no parent, so it can outlive the work that started it. Launch it in a scope: inside `coroutineScope { … }`, or on a `CoroutineScope` of your component that you cancel when it shuts down.' },
    { id: 'thread-sleep', compiles: true, test: function (line, i, s) {
        var m = /\bThread\s*\.\s*sleep\s*\(/.exec(line);
        return !!m && inCoroutine(s, i, m.index);
      },
      msg: 'This compiles, but `Thread.sleep` blocks the thread this coroutine runs on, so every other coroutine waiting for that thread waits too. Inside a coroutine, `delay(ms)` pauses only this coroutine. Code that really must block (JDBC, a file) belongs in `withContext(Dispatchers.IO) { … }`.' },
    { id: 'nested-run-blocking', compiles: true, test: function (line, i, s) {
        var m = /\brunBlocking\b/.exec(line);
        return !!m && inCoroutine(s, i, m.index);
      },
      msg: 'This compiles, but `runBlocking` blocks its thread until the block ends: it is the bridge from ordinary code into coroutines, for `main` and tests. Inside a coroutine or a `suspend` function, call the suspend code directly, or use `coroutineScope { … }` to wait for several coroutines without blocking.' }
  ];

  U.javaHabits = function (text) {
    var s = scan(String(text || '')), out = [];
    s.lines.forEach(function (line, i) {
      if (!line.trim()) return;
      for (var r = 0; r < RULES.length; r++) {
        var rule = RULES[r];
        if (rule.top && s.depth[i] !== 0) continue;
        var hit = typeof rule.test === 'function' ? rule.test(line, i, s) : rule.test.test(line);
        if (!hit) continue;
        out.push({ line: i + 1, id: rule.id, msg: rule.msg });
        if (rule.only) break;
      }
    });
    return out;
  };
  U.javaHabits.rules = RULES.map(function (r) { return { id: r.id, compiles: !!r.compiles }; });
  U.javaHabits.scan = scan;    // for the tests: what the rules read
})(window.KLT);
