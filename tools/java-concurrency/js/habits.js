/*
 * habits.js - the concurrency-habit warnings (⚠, batch 2): lines that compile (or nearly) but are a
 * known way to get concurrent Java wrong, each with what to write instead and why.
 *
 *   JCLT.javaHabits(code) -> [{line, id, msg}]   line is 1-based; msg is Markdown
 *   JCLT.habitRules       -> [{id, msg, compiles, bad, good}]   bad shows the habit, good the better way;
 *                            tests/test_ui.py ("warnings") proves each rule warns on bad and not on good
 *   JCLT.habitAllowed     -> {'<where>:<rule id>': true} content that shows a habit on purpose
 *
 * js/editor.js shows each one as a ⚠ in the margin of every editable Java editor, with the message on
 * hover. Nothing is compiled, so the warnings work opened from disk too. The rules read only code:
 * strings, text blocks, characters and comments are blanked out first, keeping every position and line
 * break, so "new Thread(" in a string never warns. Some rules read the whole file (a field declared
 * volatile, a scope that is never joined); some read what a line sits in (s.openers[i]: the text before
 * each `{` that encloses line i, innermost last).
 */
(function (U) {
  'use strict';

  /** Blank out strings, text blocks, characters and comments, keeping positions. -> {code, lines, depth, openers} */
  function scan(text) {
    var out = text.split(''), n = text.length, i = 0;
    function blank(a, b) { for (var k = a; k < b; k++) if (out[k] !== '\n') out[k] = ' '; }
    while (i < n) {
      var c = text[i], two = text.substr(i, 2);
      if (two === '/*') { var e = text.indexOf('*/', i + 2); e = e < 0 ? n : e + 2; blank(i, e); i = e; }
      else if (two === '//') { var nl = text.indexOf('\n', i); nl = nl < 0 ? n : nl; blank(i, nl); i = nl; }
      else if (text.substr(i, 3) === '"""') {
        var j = i + 3;
        while (j < n && text.substr(j, 3) !== '"""') j += text[j] === '\\' ? 2 : 1;
        j = Math.min(n, j + 3); blank(i + 3, j - 3); i = j;
      } else if (c === '"' || c === "'") {
        var k = i + 1;
        while (k < n && text[k] !== c && text[k] !== '\n') k += text[k] === '\\' ? 2 : 1;
        blank(i + 1, Math.min(k, n)); i = k + 1;
      } else i++;
    }
    var code = out.join(''), lines = code.split('\n'), depth = [], openers = [], stack = [], d = 0;
    lines.forEach(function (line, li) {
      depth.push(d);
      openers.push(stack.slice());
      for (var p = 0; p < line.length; p++) {
        if (line[p] === '{') { d++; stack.push((lines[li].slice(0, p).trim() || (li > 0 ? lines[li - 1].trim() : ''))); }
        else if (line[p] === '}') { d = Math.max(0, d - 1); stack.pop(); }
      }
    });
    return { code: code, lines: lines, depth: depth, openers: openers };
  }

  function inside(s, i, re) { return s.openers[i].some(function (o) { return re.test(o); }); }
  function fileHas(s, re) { return re.test(s.code); }
  function prevCode(s, i) { for (var k = i - 1; k >= 0; k--) if (s.lines[k].trim()) return s.lines[k]; return ''; }

  /** The number of top-level arguments in the call that starts at `open` (the index of its "("), or -1. */
  function argCount(line, open) {
    var depth = 0, args = 0, any = false;
    for (var p = open; p < line.length; p++) {
      var ch = line[p];
      if (ch === '(' || ch === '[' || ch === '{') { depth++; if (depth === 1) continue; }
      if (ch === ')' || ch === ']' || ch === '}') { depth--; if (depth === 0) return any ? args + 1 : 0; }
      if (depth === 1 && ch === ',') args++;
      if (depth >= 1 && ch.trim()) any = true;
    }
    return -1;
  }

  var VIRTUAL = /newVirtualThreadPerTaskExecutor|ofVirtual\s*\(|startVirtualThread/;
  var BLOCKING = /Thread\s*\.\s*sleep|\.get\s*\(\s*\)|\.join\s*\(\s*\)|\.send\s*\(|\.take\s*\(\s*\)|\.await\s*\(/;

  var RULES = [
    { id: 'pooled-virtual', compiles: true,
      test: /newFixedThreadPool\s*\([^;]*ofVirtual/,
      msg: 'This compiles, but **virtual threads should never be pooled** (JEP 444): they are cheap to make, so a pool only adds a queue and a fixed limit. Start one per task with `Executors.newVirtualThreadPerTaskExecutor()`, and put the limit on the scarce resource with a `Semaphore`.',
      bad: 'var pool = Executors.newFixedThreadPool(10, Thread.ofVirtual().factory());',
      good: 'var executor = Executors.newVirtualThreadPerTaskExecutor();\nvar permits = new Semaphore(10);' },
    { id: 'swallowed-interrupt', compiles: true,
      test: function (line, i, s) {
        if (/catch\s*\(\s*(final\s+)?InterruptedException\s+\w+\s*\)\s*\{\s*\}/.test(line)) return true;
        if (!/catch\s*\(\s*(final\s+)?InterruptedException\s+\w+\s*\)\s*\{\s*$/.test(line)) return false;
        for (var k = i + 1; k < s.lines.length; k++) if (s.lines[k].trim()) return s.lines[k].trim() === '}';   // comments are blank here
        return false;
      },
      msg: 'This compiles, but it **swallows the interrupt**. An interrupt is how Java asks a thread to stop (a scope or an executor cancelling it), and throwing `InterruptedException` cleared the thread\'s flag. Stop the work (`return`), or set the flag again: `Thread.currentThread().interrupt();`.',
      bad: 'try {\n    Thread.sleep(100);\n} catch (InterruptedException e) {\n}',
      good: 'try {\n    Thread.sleep(100);\n} catch (InterruptedException e) {\n    Thread.currentThread().interrupt();\n}' },
    { id: 'volatile-increment', compiles: true,
      test: function (line, i, s) {
        var vs = s.code.match(/\bvolatile\s+(?:static\s+)?(?:int|long|short|byte|Integer|Long)\s+(\w+)/g) || [];
        return vs.some(function (decl) {
          var name = decl.split(/\s+/).pop();
          return new RegExp('(\\b' + name + '\\s*(\\+\\+|--|[+\\-*/]=))|((\\+\\+|--)\\s*' + name + '\\b)').test(line);
        });
      },
      msg: 'This compiles, but **`++` on a `volatile` is not atomic**: it reads, adds and writes, and two threads can read the same value. `volatile` makes each read and write visible, not the three together. Use an `AtomicInteger` (`incrementAndGet()`), a `LongAdder`, or a lock.',
      bad: 'volatile int count;\nvoid hit() {\n    count++;\n}',
      good: 'final AtomicInteger count = new AtomicInteger();\nvoid hit() {\n    count.incrementAndGet();\n}' },
    { id: 'dcl-without-volatile', compiles: true,
      test: function (line, i, s) {
        var m = /^\s*if\s*\(\s*(\w+)\s*==\s*null\s*\)\s*\{?\s*$/.exec(line);
        if (!m || !/synchronized\s*\(/.test(s.lines[i + 1] || '')) return false;
        var decl = new RegExp('\\b(?:static\\s+)?(volatile\\s+)?(?:static\\s+)?[A-Z]\\w*(?:<[^>]*>)?\\s+' + m[1] + '\\s*[;=]').exec(s.code);
        return !!decl && !decl[1];
      },
      msg: 'This compiles, but **double-checked locking needs a `volatile` field**. Without it another thread can see the reference before the object it points to is fully built. Declare the field `volatile`, or use the holder idiom, or `StableValue` (preview in Java 25).',
      bad: 'static Config config;\nstatic Config get() {\n    if (config == null) {\n        synchronized (Main.class) {\n            if (config == null) config = new Config();\n        }\n    }\n    return config;\n}',
      good: 'static volatile Config config;\nstatic Config get() {\n    if (config == null) {\n        synchronized (Main.class) {\n            if (config == null) config = new Config();\n        }\n    }\n    return config;\n}' },
    { id: 'wait-without-loop', compiles: true,
      test: function (line, i, s) {
        if (!/\bwait\s*\(\s*\)/.test(line)) return false;
        return /^\s*if\s*\(/.test(line) || (/^\s*if\s*\(.*\)\s*\{?\s*$/.test(prevCode(s, i)) && !/\bwhile\b/.test(line));
      },
      msg: 'This compiles, but **`wait()` belongs in a `while` loop**: a thread can wake up without a `notify` (a spurious wakeup), or after another thread already took what it waited for. `while (!ready) lock.wait();` checks again each time.',
      bad: 'synchronized (lock) {\n    if (!ready) lock.wait();\n}',
      good: 'synchronized (lock) {\n    while (!ready) lock.wait();\n}' },
    { id: 'notify-one', compiles: true,
      test: /(^|[^\w])notify\s*\(\s*\)/,
      msg: 'This compiles, but **`notify()` wakes one waiting thread, maybe not the one that can go on**, and the others sleep on. `notifyAll()` is the safe default; a `ReentrantLock` with one `Condition` per reason to wait is the precise one.',
      bad: 'synchronized (lock) {\n    ready = true;\n    lock.notify();\n}',
      good: 'synchronized (lock) {\n    ready = true;\n    lock.notifyAll();\n}' },
    { id: 'common-pool-async', compiles: true,
      test: function (line) {
        var m = /CompletableFuture\s*\.\s*(supplyAsync|runAsync)\s*\(/.exec(line);
        return !!m && argCount(line, m.index + m[0].length - 1) === 1;
      },
      msg: 'This compiles, but **with no executor, `supplyAsync` runs on the common `ForkJoinPool`**: one thread per processor, shared by every parallel stream in the JVM. Blocking calls there starve everything else. Pass an executor: `supplyAsync(task, executor)`, or use virtual threads directly.',
      bad: 'var f = CompletableFuture.supplyAsync(() -> fetch());',
      good: 'var f = CompletableFuture.supplyAsync(() -> fetch(), executor);' },
    { id: 'executor-not-closed', compiles: true,
      test: function (line, i, s) {
        var m = /^\s*(?:final\s+)?(?:ExecutorService|var)\s+(\w+)\s*=\s*Executors\s*\.\s*new\w*\(/.exec(line);
        if (!m) return false;
        return !new RegExp('\\b' + m[1] + '\\s*\\.\\s*(close|shutdown|shutdownNow)\\s*\\(').test(s.code);
      },
      msg: 'This compiles, but **the executor is never closed**, so nothing waits for its tasks and its threads may outlive the work. Open it in a try-with-resources block: `close()` at its end waits for every task (Java 19 and later).',
      bad: 'ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();\npool.submit(() -> 1);',
      good: 'try (ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor()) {\n    pool.submit(() -> 1);\n}' },
    { id: 'fork-without-join', compiles: true,
      test: function (line, i, s) {
        return /\.\s*fork\s*\(/.test(line) && /StructuredTaskScope/.test(s.code) && !/\.\s*join\s*\(\s*\)/.test(s.code);
      },
      msg: 'This compiles, but **the scope is never joined**. A subtask\'s result can be read only after `join()`, and closing a scope that was not joined is a mistake the scope reports. Call `scope.join()` before the end of the `try` block.',
      bad: 'try (var scope = StructuredTaskScope.open()) {\n    var a = scope.fork(() -> 1);\n}',
      good: 'try (var scope = StructuredTaskScope.open()) {\n    var a = scope.fork(() -> 1);\n    scope.join();\n}' },
    { id: 'get-before-join', compiles: true,
      test: function (line, i, s) {
        var subtasks = [], re = /(\w+)\s*=\s*(\w+)\s*\.\s*fork\s*\(/g, m;
        while ((m = re.exec(s.code))) subtasks.push({ name: m[1], scope: m[2] });
        return subtasks.some(function (st) {
          if (!new RegExp('\\b' + st.name + '\\s*\\.\\s*get\\s*\\(\\s*\\)').test(line)) return false;
          // a join() later in the same block (not in another method that happens to use the same names)
          for (var k = i + 1; k < s.lines.length && s.depth[k] >= s.depth[i]; k++) if (new RegExp('\\b' + st.scope + '\\s*\\.\\s*join\\s*\\(').test(s.lines[k])) return true;
          return false;
        });
      },
      msg: 'This compiles, but **`get()` before `join()` throws** `IllegalStateException: join not called`. A subtask has its result only once the scope has been joined: call `scope.join()` first.',
      bad: 'try (var scope = StructuredTaskScope.open()) {\n    var a = scope.fork(() -> 1);\n    int x = a.get();\n    scope.join();\n}',
      good: 'try (var scope = StructuredTaskScope.open()) {\n    var a = scope.fork(() -> 1);\n    scope.join();\n    int x = a.get();\n}' },
    { id: 'virtual-daemon-false', compiles: true,
      test: function (line, i, s) { return /\.\s*setDaemon\s*\(\s*false\s*\)/.test(line) && fileHas(s, VIRTUAL); },
      msg: 'This compiles, but **a virtual thread is always a daemon**: `setDaemon(false)` throws `IllegalArgumentException`. Wait for virtual threads yourself (join, an executor\'s `close()`, a scope).',
      bad: 'Thread t = Thread.ofVirtual().unstarted(task);\nt.setDaemon(false);',
      good: 'Thread t = Thread.ofVirtual().unstarted(task);\nt.start();\nt.join();' },
    { id: 'cached-pool', compiles: true,
      test: /Executors\s*\.\s*newCachedThreadPool\s*\(/,
      msg: 'This compiles, but **a cached pool makes a platform thread for every task that finds none free**, without limit: under load it can create thousands of OS threads. For tasks that wait, `Executors.newVirtualThreadPerTaskExecutor()`; for computing, a fixed pool sized to the processors.',
      bad: 'var pool = Executors.newCachedThreadPool();',
      good: 'var pool = Executors.newVirtualThreadPerTaskExecutor();' },
    { id: 'raw-new-thread', compiles: true,
      test: /\bnew\s+Thread\s*\(/,
      msg: 'This compiles, but **`new Thread(…)` is a platform thread with no name**, which you must start, name and join by hand. Prefer an executor in try-with-resources, or a builder that says what you want: `Thread.ofVirtual().name("worker-", 0).start(task)`.',
      bad: 'Thread t = new Thread(task);\nt.start();',
      good: 'Thread t = Thread.ofVirtual().name("worker").start(task);' },
    { id: 'threadlocal-virtual', compiles: true,
      test: function (line, i, s) { return /\bThreadLocal\s*[<.]/.test(line) && fileHas(s, VIRTUAL); },
      msg: 'This compiles, but **with a virtual thread per task, a `ThreadLocal` holds one value per task**: a cache in it builds a new object every time, and inherited values are copied into every thread. Share what is thread-safe; for request context, `ScopedValue` (final in Java 25).',
      bad: 'static final ThreadLocal<StringBuilder> BUF = ThreadLocal.withInitial(StringBuilder::new);\nvoid main() {\n    Thread.startVirtualThread(() -> BUF.get().append("x"));\n}',
      good: 'static final ScopedValue<String> USER = ScopedValue.newInstance();\nvoid main() {\n    Thread.startVirtualThread(() -> IO.println("x"));\n}' },
    { id: 'blocking-parallel-stream', compiles: true,
      test: function (line, i, s) {
        if (!/parallelStream\s*\(|\.\s*parallel\s*\(\s*\)/.test(line)) return false;
        for (var k = i; k < Math.min(s.lines.length, i + 4); k++) if (BLOCKING.test(s.lines[k])) return true;
        return false;
      },
      msg: 'This compiles, but **a parallel stream runs on the common `ForkJoinPool`** (one thread per processor, less one). A blocking call in it holds one of those few threads. For calls that wait, `Gatherers.mapConcurrent(n, fn)` (Java 24) runs them on virtual threads, at most `n` at once, in order.',
      bad: 'var pages = urls.parallelStream()\n    .map(u -> client.send(request(u), handler))\n    .toList();',
      good: 'var pages = urls.stream()\n    .gather(Gatherers.mapConcurrent(10, u -> fetch(u)))\n    .toList();' },
    { id: 'sleep-holding-lock', compiles: true,
      test: function (line, i, s) { return /Thread\s*\.\s*sleep\s*\(/.test(line) && (inside(s, i, /synchronized\s*\(/) || /synchronized\s*\(.*\)\s*\{.*Thread\s*\.\s*sleep/.test(line)); },
      msg: 'This compiles, but **it waits while holding a lock**: every other thread that needs the lock waits too. On Java 21 to 23 a virtual thread doing this also pins its carrier (Java 24 fixed that, JEP 491). Do the waiting outside the `synchronized` block.',
      bad: 'synchronized (lock) {\n    Thread.sleep(100);\n}',
      good: 'Thread.sleep(100);\nsynchronized (lock) {\n    count++;\n}' },
    { id: 'scoped-or-else-null', compiles: true,
      test: function (line, i, s) { return /\.\s*orElse\s*\(\s*null\s*\)/.test(line) && fileHas(s, /ScopedValue/); },
      msg: 'This compiles, but **`ScopedValue.orElse(null)` throws `NullPointerException`** in Java 25 (the final API refuses null). Ask `isBound()` first, or give a real default: `USER.orElse("guest")`.',
      bad: 'static final ScopedValue<String> USER = ScopedValue.newInstance();\nString who() {\n    return USER.orElse(null);\n}',
      good: 'static final ScopedValue<String> USER = ScopedValue.newInstance();\nString who() {\n    return USER.isBound() ? USER.get() : "guest";\n}' }
  ];

  U.javaHabits = function (text) {
    var s = scan(String(text || '')), out = [];
    s.lines.forEach(function (line, i) {
      if (!line.trim()) return;
      RULES.forEach(function (rule) {
        var hit = typeof rule.test === 'function' ? rule.test(line, i, s) : rule.test.test(line);
        if (hit) out.push({ line: i + 1, id: rule.id, msg: rule.msg });
      });
    });
    return out;
  };
  U.javaHabits.rules = RULES.map(function (r) { return { id: r.id, compiles: !!r.compiles }; });
  U.javaHabits.scan = scan;    // for the tests: what the rules read
  U.habitRules = RULES.map(function (r) { return { id: r.id, msg: r.msg, compiles: !!r.compiles, bad: r.bad, good: r.good }; });

  /* Content that shows a habit on purpose: '<where>:<rule id>', where is how tests/test_ui.py names it. */
  U.habitAllowed = {
    'vt-create body block 2:virtual-daemon-false': true, 'q vt-daemon block 1:virtual-daemon-false': true,
    'vt-pinning body block 1:sleep-holding-lock': true, 'vt-pinning example:sleep-holding-lock': true, 'q vt-pinning block 1:sleep-holding-lock': true,
    'vt-threadlocals body block 1:threadlocal-virtual': true, 'q vt-threadlocal block 1:threadlocal-virtual': true,
    'sc-basics body block 2:get-before-join': true, 'sc-failure body block 2:swallowed-interrupt': true, 'q sc-cancellation block 1:swallowed-interrupt': true
  };
})(window.JCLT);
