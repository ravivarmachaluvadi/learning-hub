/*
 * data/interview-scoped.js - the interview questions on scoped values, mapConcurrent and lazy
 * initialisation (batch 2). The shape is described at the top of data/interview-virtual-threads.js.
 */
(function (U) {
  'use strict';
  function jv(code) { return '```java\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];

  Q.push({
    id: 'sv-what', track: 'scoped', weight: 3,
    q: 'What is a ScopedValue?',
    keywords: ['ScopedValue', 'scoped value', 'where', 'run', 'call', 'context', 'jep 506', 'final'],
    short: 'A key whose value is bound for the duration of a call: `ScopedValue.where(USER, u).run(() -> handle())`, and any code inside reads `USER.get()`. It cannot be changed inside the binding (a callee rebinds for its own callees), it ends with the block, and subtasks of a `StructuredTaskScope` inherit it without copying. Final in Java 25 (JEP 506); the replacement for `ThreadLocal` when the value is context that flows one way.',
    answer: jv(`static final ScopedValue<String> USER = ScopedValue.newInstance();

void handle() {
    IO.println("handling for " + USER.get());
}

void main() {
    ScopedValue.where(USER, "ravi").run(this::handle);
    IO.println("bound afterwards: " + USER.isBound());
}`) + '\n\n' + out(`handling for ravi
bound afterwards: false`),
    followups: ['What happens on get() when nothing is bound?', 'How does a callee change the value for code it calls?'],
    related: ['lesson:sv-basics', 'lesson:sv-rebinding', 'q:sv-vs-threadlocal'],
    docs: 'https://openjdk.org/jeps/506'
  });

  Q.push({
    id: 'sv-vs-threadlocal', track: 'scoped', weight: 3,
    q: 'ScopedValue or ThreadLocal: what is the difference, and when would you use each?',
    keywords: ['ScopedValue', 'ThreadLocal', 'InheritableThreadLocal', 'leak', 'mutability', 'inheritance', 'virtual threads'],
    short: 'A ThreadLocal is a mutable per-thread variable: anyone can `set` it, it lives as long as the thread unless `remove()` is called (leaks in pools), and inheritable ones are copied into every child thread. A ScopedValue is immutable inside its binding, bounded by the block, and inherited by structured subtasks without copying, which matters with millions of virtual threads. Use ScopedValue for one-way context (user, tenant, trace id); keep ThreadLocal for per-thread mutable caches or where data flows back via `set`.',
    answer: '| | `ThreadLocal` | `ScopedValue` |\n|---|---|---|\n| Change it | `set` anywhere | no: rebind for callees |\n| Lifetime | the thread\'s, unless `remove()` | the binding\'s block |\n| In a pool | can leak to the next task | cannot outlive its block |\n| Children | inheritable: copied at creation | structured subtasks read it, no copy |\n| Status | since Java 1.2 | final in Java 25 |',
    followups: ['Why is InheritableThreadLocal a problem with pools?', 'How would you migrate an MDC-style request id?'],
    related: ['lesson:sv-inheritance', 'lesson:vt-threadlocals', 'q:sv-what', 'q:vt-threadlocal'],
    docs: 'https://openjdk.org/jeps/506'
  });

  Q.push({
    id: 'sv-inheritance', track: 'scoped', weight: 2,
    q: 'Do scoped values reach other threads?',
    keywords: ['inheritance', 'StructuredTaskScope', 'fork', 'executor', 'ScopedValue', 'context propagation'],
    short: 'Only subtasks forked in a `StructuredTaskScope` inherit the bindings in force where the scope was opened; they read the same binding, nothing copied, because the scope guarantees they end before the binding does. Threads from an executor, a `ForkJoinPool` or `new Thread` inherit nothing (probed on Java 25), because nothing guarantees they end in time.',
    answer: jv(`static final ScopedValue<String> ID = ScopedValue.newInstance();

void main() throws Exception {
    ScopedValue.where(ID, "req-42").call(() -> {
        try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<Boolean>allSuccessfulOrThrow())) {
            scope.fork(() -> ID.isBound());
            IO.println("subtask: bound? " + scope.join().findFirst().orElseThrow().get());
        }
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            IO.println("executor thread: bound? " + executor.submit(() -> ID.isBound()).get());
        }
        return null;
    });
}`) + '\n\n' + out(`subtask: bound? true
executor thread: bound? false`),
    followups: ['Why can an executor not inherit them safely?', 'How do Spring applications pass context to @Async methods today?'],
    related: ['lesson:sv-inheritance', 'q:sv-vs-threadlocal'],
    docs: 'https://openjdk.org/jeps/506'
  });

  Q.push({
    id: 'map-concurrent', track: 'scoped', weight: 2,
    q: 'How do you run a blocking call for each element of a stream with bounded concurrency?',
    keywords: ['Gatherers', 'mapConcurrent', 'stream', 'parallelStream', 'bounded concurrency', 'virtual threads', 'jep 485'],
    short: 'Since Java 24: `stream.gather(Gatherers.mapConcurrent(n, fn))`. It runs `fn` on virtual threads, at most `n` at once, keeps the stream\'s order, rethrows a failure and cancels the remaining tasks. A parallel stream is wrong for this: it runs on the common ForkJoinPool\'s few platform threads, which blocking calls hold, and you cannot set the concurrency.',
    answer: jv(`void main() {
    var pages = Stream.of("a", "b", "c", "d")
        .gather(Gatherers.mapConcurrent(2, s -> s.toUpperCase()))
        .toList();
    IO.println(pages);
}`) + '\n\n' + out('[A, B, C, D]'),
    followups: ['What happens when the function throws?', 'Before Java 24, how would you have written it?'],
    related: ['lesson:sv-map-concurrent', 'q:vt-pool'],
    docs: 'https://openjdk.org/jeps/485'
  });

  Q.push({
    id: 'lazy-init', track: 'scoped', weight: 3,
    q: 'How do you initialise a value lazily and thread-safely? Explain double-checked locking.',
    keywords: ['lazy initialization', 'singleton', 'double-checked locking', 'volatile', 'holder idiom', 'StableValue', 'LazyConstant', 'safe publication'],
    short: 'Three ways. The holder idiom: a nested class with a `static final` field, initialised by the JVM once, under its class-init lock (statics only). Double-checked locking: check, lock, check again, assign; the field must be `volatile`, or another thread can see the reference before the object is fully built. And in Java 25, `StableValue.orElseSet(supplier)` (a preview; `LazyConstant` in 26): computed once even under contention, and treated as a constant by the JIT. For a Spring bean, the container already creates it once.',
    answer: jv(`static volatile String config;
static final Object LOCK = new Object();

static String config() {
    if (config == null) {
        synchronized (LOCK) {
            if (config == null) {
                config = "loaded once";
            }
        }
    }
    return config;
}

void main() {
    IO.println(config());
}`) + '\n\n' + out('loaded once') + '\n\nWithout `volatile`, the write of the reference can become visible before the writes inside the object\'s constructor: a reader that skips the lock may see a half-built object. Since Java 5, `volatile` gives the write a happens-before edge to the read.',
    followups: ['Why is an enum singleton also safe?', 'Why might the holder idiom pin virtual threads?'],
    related: ['lesson:sv-lazy-init', 'q:sv-what'],
    docs: 'https://openjdk.org/jeps/502'
  });
})(window.JCLT);
