/*
 * data/quizzes-scoped.js - the quiz at the end of each Scoped values lesson (batch 2).
 * The shape is described at the top of data/quizzes-virtual-threads.js.
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};

  Q['sv-basics'] = [
    { q: 'What does this program print?',
      code: 'static final ScopedValue<String> USER = ScopedValue.newInstance();\n\nvoid main() {\n    ScopedValue.where(USER, "asha").run(() -> { });\n    IO.println(USER.isBound());\n}',
      choices: ['`false`', '`true`'],
      answer: 0,
      why: 'A binding lasts only for its `run`: afterwards the key is unbound again.' },
    { q: 'What does `get()` do on a scoped value that is not bound?',
      choices: ['Throws NoSuchElementException ("ScopedValue not bound")', 'Returns null', 'Returns the last value it had', 'Blocks until it is bound'],
      answer: 0,
      why: 'Use `isBound()` or `orElse(default)` where it may be unbound; in Java 25, `orElse(null)` throws NullPointerException.' },
    { q: 'How do you give a scoped value a new value in the middle of a binding?',
      choices: ['You cannot: bind it again with where(…).run(…) for the code you call', 'With set(value)', 'With remove() then where(…)', 'By assigning to the key'],
      answer: 0,
      why: 'There is no `set`: values flow one way, from caller to callees, and a rebinding hides the outer value only for its own block.' },
    { q: 'What is the status of scoped values in Java 25?',
      choices: ['Final (JEP 506): no flag needed', 'A preview, needing --enable-preview', 'An incubator module', 'Removed'],
      answer: 0,
      why: 'Previewed in 21 to 24, final in 25. Only `orElse(null)` changed in the final version.' }
  ];

  Q['sv-rebinding'] = [
    { q: 'What does this program print?',
      code: 'static final ScopedValue<Integer> N = ScopedValue.newInstance();\n\nvoid main() {\n    ScopedValue.where(N, 1).run(() -> {\n        ScopedValue.where(N, 2).run(() -> { });\n        IO.println(N.get());\n    });\n}',
      choices: ['`1`', '`2`', 'It throws NoSuchElementException'],
      answer: 0,
      why: 'The inner binding hid the outer one only inside its own `run`; afterwards the outer value is back, never overwritten.' },
    { q: 'A nested `where(KEY, b).run(…)` inside a binding of `KEY` to `a`: what happens to `a`?',
      choices: ['It is hidden inside the inner block, and visible again when that block ends', 'It is replaced for good', 'Both values are visible as a list', 'The inner where throws'],
      answer: 0,
      why: 'Bindings stack: the innermost wins, and each ends with its block.' },
    { q: 'Why do scoped values have no `set` method?',
      choices: ['So data flows one way: reads are cheap, nothing leaks out of a callee, and subtasks can share the binding without copying', 'Because Java 25 forgot it', 'Because they are stored in the class file', 'To save memory only'],
      answer: 0,
      why: 'Immutability is the design: JEP 506 contrasts it with ThreadLocal\'s unconstrained mutability.' },
    { q: 'The work inside `where(ROLE, "admin").run(…)` throws. Is ROLE still bound to "admin" afterwards?',
      choices: ['No: the binding ends when its block ends, normally or not', 'Yes, until someone resets it', 'Only on the current thread', 'Only if it was a RuntimeException'],
      answer: 0,
      why: 'Unlike a field set and reset by hand, a binding cannot be left behind by an exception.' }
  ];

  Q['sv-inheritance'] = [
    { q: 'What does this program print?',
      code: 'static final ScopedValue<String> ID = ScopedValue.newInstance();\n\nvoid main() throws Exception {\n    ScopedValue.where(ID, "r1").call(() -> {\n        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n            IO.println(executor.submit(() -> ID.isBound()).get());\n        }\n        return null;\n    });\n}',
      choices: ['`false`', '`true`'],
      answer: 0,
      why: 'Only subtasks of a StructuredTaskScope inherit scoped values; an executor cannot promise its threads end before the binding does.' },
    { q: 'How does a forked subtask see its parent\'s scoped values?',
      choices: ['It reads the parent\'s bindings directly: nothing is copied', 'Each value is copied into the new thread', 'It must bind them again itself', 'Through an InheritableThreadLocal'],
      answer: 0,
      why: 'JEP 506: inheritance does not copy, which matters with millions of virtual threads.' },
    { q: 'A pool thread was created while an `InheritableThreadLocal` held "acme"; later it is set to "globex" and a task is submitted to the same pool thread. What does the task read?',
      choices: ['"acme": the value was copied once, when the thread was made', '"globex"', 'null', 'It throws'],
      answer: 0,
      why: 'Inheritable values are copied at thread creation, so long-lived pooled threads carry stale context.' },
    { q: 'When should a ThreadLocal stay a ThreadLocal, per JEP 506?',
      choices: ['When data flows back through set, or for a per-thread cache of a mutable object', 'Always', 'Never: ThreadLocal is deprecated', 'When the value is a String'],
      answer: 0,
      why: 'Migrate one-way, unchanging context (user, tenant, request id); ThreadLocal is not deprecated.' }
  ];

  Q['sv-map-concurrent'] = [
    { q: 'What does this program print?',
      code: 'void main() {\n    IO.println(Stream.of(3, 1, 2).gather(Gatherers.mapConcurrent(3, i -> {\n        try {\n            Thread.sleep(i * 50);\n        } catch (InterruptedException e) {\n            Thread.currentThread().interrupt();\n        }\n        return i;\n    })).toList());\n}',
      choices: ['`[3, 1, 2]`', '`[1, 2, 3]`', 'It changes from run to run'],
      answer: 0,
      why: '`mapConcurrent` keeps the stream\'s order, whichever element finishes first.' },
    { q: 'Which threads run `mapConcurrent`\'s function?',
      choices: ['Virtual threads', 'The common ForkJoinPool', 'The calling thread, one element at a time', 'A pool of maxConcurrency platform threads'],
      answer: 0,
      why: 'The javadoc: "executes a function concurrently with a configured level of max concurrency, using virtual threads".' },
    { q: 'Since which Java is `Gatherers.mapConcurrent` final?',
      choices: ['24', '21', '25', '22'],
      answer: 0,
      why: 'Stream gatherers were previewed in 22 and 23 and became final in 24 (JEP 485).' },
    { q: 'Why not `parallelStream()` for a step that makes HTTP calls?',
      choices: ['It runs on the common ForkJoinPool\'s few platform threads, which the blocking calls hold', 'Parallel streams cannot call methods', 'It is slower for computing', 'It never keeps order'],
      answer: 0,
      why: 'The common pool has about one thread per processor and is shared by the whole JVM; mapConcurrent waits on virtual threads instead.' }
  ];

  Q['sv-lazy-init'] = [
    { q: 'Why must the field in double-checked locking be `volatile`?',
      choices: ['Without it another thread can see the reference before the object is fully built', 'To make the lock faster', 'Because synchronized needs it', 'It need not be'],
      answer: 0,
      why: 'The memory model allows the write of the reference to become visible before the object\'s fields; volatile makes the publication safe.' },
    { q: 'What is the main limit of the holder idiom?',
      choices: ['It works only for static values, with a class per value', 'It is not thread-safe', 'It loads the value every time', 'It needs Java 25'],
      answer: 0,
      why: 'The JVM\'s class initialization makes it safe and fast, but only for statics; and a blocking load in it pins waiting virtual threads.' },
    { q: 'What is `StableValue` called in Java 26?',
      choices: ['`LazyConstant`', '`StableConstant`', '`Lazy`', 'It is unchanged'],
      answer: 0,
      why: 'JEP 526 renamed it LazyConstant (LazyConstant.of(…), get()) and removed orElseSet; it is still a preview.' },
    { q: 'What does this program print?',
      code: 'void main() {\n    var n = new AtomicInteger();\n    Supplier<Integer> s = StableValue.supplier(() -> n.incrementAndGet());\n    s.get();\n    s.get();\n    IO.println(n.get());\n}',
      choices: ['`1`', '`2`', '`0`'],
      answer: 0,
      why: 'A stable supplier computes its value once, on the first get(), and returns the same value after.' }
  ];
})(window.JCLT);
