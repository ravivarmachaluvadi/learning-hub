/*
 * data/quizzes-structured.js - the quiz at the end of each Structured concurrency lesson (batch 2).
 * The shape is described at the top of data/quizzes-virtual-threads.js. Programs run with --enable-preview.
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};

  Q['sc-why'] = [
    { q: 'What is an **orphan** task?',
      choices: ['A task still running after the code that started it has returned or failed', 'A task with no name', 'A task that runs on a platform thread', 'A task that was never started'],
      answer: 0,
      why: 'With an executor, nothing ties a task to the method that submitted it: when that method fails and returns, its other tasks run on for a result nobody reads.' },
    { q: 'In a `StructuredTaskScope` opened with `open()`, one subtask fails. What happens to the others still running?',
      choices: ['They are cancelled (interrupted), and close() waits for them to stop', 'They run to the end, and their results are thrown away', 'They are killed at once, without running their finally blocks', 'Nothing: the failure is ignored until join() is called again'],
      answer: 0,
      why: 'The default policy fails the scope on the first failure and cancels the rest; `close()` at the end of the try block waits until every subtask thread has ended.' },
    { q: 'What does a program need, in Java 25, to compile and run code that uses `StructuredTaskScope`?',
      choices: ['`--enable-preview` for both javac and java', 'Nothing: it is final in Java 25', '`--add-modules jdk.incubator.concurrent`', 'A third-party library'],
      answer: 0,
      why: 'Structured concurrency is a preview API in Java 25 (JEP 505, the fifth preview), and still a preview in 26 and 27.' },
    { q: 'Which of these is **structured**?',
      choices: ['Subtasks forked in a scope opened in a try-with-resources block', '`CompletableFuture.supplyAsync` calls combined with `allOf`', 'Tasks submitted to a shared static executor', '`new Thread(task).start()` for each call'],
      answer: 0,
      why: 'Only the scope ties the subtasks\' lifetimes to a block of code: they start inside it and have all ended when it ends.' }
  ];

  Q['sc-basics'] = [
    { q: 'What does this program print?',
      code: 'void main() throws Exception {\n    try (var scope = StructuredTaskScope.open()) {\n        var s = scope.fork(() -> "x");\n        String r;\n        try {\n            r = s.get();\n        } catch (IllegalStateException e) {\n            r = e.getMessage();\n        }\n        scope.join();\n        IO.println(r);\n    }\n}',
      choices: ['`join not called`', '`x`', '`null`'],
      answer: 0,
      why: 'A subtask has its result only after the scope has been joined; `get()` before `join()` throws `IllegalStateException: join not called` (Java 25).' },
    { q: 'Which thread may call `fork` and `join` on a scope?',
      choices: ['Only the owner: the thread that opened it', 'Any thread', 'Only its subtasks', 'Only a platform thread'],
      answer: 0,
      why: 'Forking from another thread throws `WrongThreadException: Current thread not owner` (probed on 25).' },
    { q: 'A subtask was cancelled before it finished. What is its `state()`?',
      choices: ['`UNAVAILABLE`', '`FAILED`', '`CANCELLED`', '`SUCCESS`'],
      answer: 0,
      why: '`Subtask.State` has three values: `UNAVAILABLE`, `SUCCESS` and `FAILED`. A cancelled or unfinished subtask is `UNAVAILABLE`.' },
    { q: 'What does a scope\'s `close()` do?',
      choices: ['Cancels the scope if needed and waits for every subtask thread to end', 'Returns at once and lets the subtasks finish in the background', 'Throws if any subtask is still running', 'Interrupts the owner thread'],
      answer: 0,
      why: 'That is the guarantee: when the try block ends, nothing the scope started is still running.' }
  ];

  Q['sc-failure'] = [
    { q: 'What does this program print?',
      code: 'void main() throws Exception {\n    try (var scope = StructuredTaskScope.open()) {\n        scope.fork(() -> { throw new IllegalArgumentException("bad id"); });\n        scope.join();\n    } catch (StructuredTaskScope.FailedException e) {\n        IO.println(e.getCause().getClass().getSimpleName());\n    }\n}',
      choices: ['`IllegalArgumentException`', '`FailedException`', '`ExecutionException`'],
      answer: 0,
      why: '`join()` throws `FailedException`, and its cause is the subtask\'s own exception.' },
    { q: 'How does a scope cancel a subtask that is still running?',
      choices: ['It interrupts the subtask\'s thread', 'It stops the thread with Thread.stop()', 'It sets a cancelled flag the subtask must poll', 'It throws an exception into the subtask from outside'],
      answer: 0,
      why: 'Cancellation in Java is an interrupt: blocking calls answer it by throwing `InterruptedException`.' },
    { q: 'A subtask catches `InterruptedException` and carries on with its loop. The scope is cancelled. What happens?',
      choices: ['close() waits until the loop ends: cancellation did not stop it', 'The JVM kills the subtask', 'join() returns at once and the subtask keeps running after the block', 'The subtask is restarted'],
      answer: 0,
      why: 'Swallowing the interrupt defeats cancellation; `close()` still waits for every subtask, so the whole block takes as long as the stubborn subtask.' },
    { q: 'The owner thread itself is interrupted while it waits in `join()`. What happens?',
      choices: ['join() throws InterruptedException and the scope cancels its subtasks', 'join() ignores it and keeps waiting', 'Only the first subtask is interrupted', 'The subtasks finish and join() returns normally'],
      answer: 0,
      why: 'Cancellation flows down the tree: an interrupted owner cancels its scope, whose subtasks are interrupted in turn.' }
  ];

  Q['sc-joiners'] = [
    { q: 'You ask three mirrors the same question and want the first answer. Which joiner?',
      choices: ['`anySuccessfulResultOrThrow()`', '`allSuccessfulOrThrow()`', '`awaitAll()`', '`awaitAllSuccessfulOrThrow()`'],
      answer: 0,
      why: 'Its `join()` returns the first successful result and the scope cancels the rest (Java 25; renamed `anySuccessfulOrThrow()` in 26).' },
    { q: 'What does this program print?',
      code: 'void main() throws Exception {\n    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>allSuccessfulOrThrow())) {\n        scope.fork(() -> { Thread.sleep(100); return "a"; });\n        scope.fork(() -> "b");\n        IO.println(scope.join().map(StructuredTaskScope.Subtask::get).toList());\n    }\n}',
      choices: ['`[a, b]`', '`[b, a]`', '`[b]`'],
      answer: 0,
      why: 'The stream `join()` returns is in fork order, not in the order the subtasks finished.' },
    { q: 'With `Joiner.awaitAll()`, one subtask throws. What does `join()` do?',
      choices: ['Returns normally; the failure is kept in that subtask (state() is FAILED)', 'Throws FailedException', 'Cancels the other subtasks', 'Returns the exception'],
      answer: 0,
      why: '`awaitAll()` waits for every subtask whatever happens and never cancels; read each subtask\'s state and exception afterwards.' },
    { q: 'May one `Joiner` object be used for two scopes?',
      choices: ['No: make a new one for each scope', 'Yes, joiners are stateless', 'Yes, but only one at a time', 'Only the built-in ones'],
      answer: 0,
      why: 'A joiner keeps state about its scope\'s subtasks. Java 25 does not refuse a reused one, and the second scope\'s join() then returned both scopes\' subtasks (probed).' }
  ];

  Q['sc-custom-joiner'] = [
    { q: 'In a custom `Joiner`, what does returning `true` from `onComplete` do?',
      choices: ['It cancels the scope: subtasks still running are interrupted and join() wakes up', 'It marks the subtask as successful', 'It retries the subtask', 'It makes join() throw'],
      answer: 0,
      why: '`onFork` and `onComplete` return whether to cancel the scope.' },
    { q: 'On which thread does `onComplete` run?',
      choices: ['The finished subtask\'s own thread, possibly at the same time as others', 'Always the owner thread', 'A single joiner thread, one call at a time', 'The common ForkJoinPool'],
      answer: 0,
      why: 'Several subtasks can finish at once, so the joiner\'s state must be thread-safe (an AtomicInteger, a ConcurrentLinkedQueue).' },
    { q: 'What does this program print?',
      code: 'class Count implements StructuredTaskScope.Joiner<String, Integer> {\n    private final AtomicInteger done = new AtomicInteger();\n    public boolean onComplete(StructuredTaskScope.Subtask<? extends String> s) {\n        done.incrementAndGet();\n        return false;\n    }\n    public Integer result() {\n        return done.get();\n    }\n}\n\nvoid main() throws Exception {\n    try (var scope = StructuredTaskScope.open(new Count())) {\n        scope.fork(() -> "a");\n        scope.fork(() -> { throw new IllegalStateException("b"); });\n        scope.fork(() -> "c");\n        IO.println(scope.join());\n    }\n}',
      choices: ['`3`', '`2`', '`1`'],
      answer: 0,
      why: '`onComplete` is called for every subtask that completes, failures included; this joiner never cancels, so all three are counted.' },
    { q: 'A custom joiner\'s `result()` throws. What does `join()` do?',
      choices: ['Throws FailedException with that exception as its cause', 'Returns null', 'Throws the exception itself, unwrapped', 'Retries result()'],
      answer: 0,
      why: 'JEP 505: if `result()` throws, `join()` throws `FailedException` with that cause.' }
  ];

  Q['sc-timeouts'] = [
    { q: 'A scope opened with `withTimeout(Duration.ofMillis(100))` is still waiting at 100 ms. What happens?',
      choices: ['The scope is cancelled and join() throws StructuredTaskScope.TimeoutException', 'join() returns the results so far', 'The slow subtasks keep running after the block', 'join() throws java.util.concurrent.TimeoutException with a message'],
      answer: 0,
      why: 'The deadline cancels the scope (interrupting what is still running) and `join()` throws `StructuredTaskScope.TimeoutException`, which carries no message (probed on 25).' },
    { q: 'What does this program print?',
      code: 'String price() throws Exception {\n    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow(),\n            config -> config.withTimeout(Duration.ofMillis(50)))) {\n        scope.fork(() -> { Thread.sleep(1_000); return "live"; });\n        return scope.join();\n    } catch (StructuredTaskScope.TimeoutException e) {\n        return "cached";\n    }\n}\n\nvoid main() throws Exception {\n    IO.println(price());\n}',
      choices: ['`cached`', '`live`', '`null`'],
      answer: 0,
      why: 'The live call takes a second; the 50 ms deadline passes first, so the fallback is returned.' },
    { q: 'Why is one deadline on the scope often better than a timeout on each call?',
      choices: ['It bounds the whole fan-out by the request\'s budget, instead of timeouts that add up', 'Per-call timeouts do not exist in Java', 'It makes the calls faster', 'It removes the need for HTTP client timeouts'],
      answer: 0,
      why: 'A request has one budget. Keep the clients\' own timeouts too: they protect connections, the scope\'s deadline protects the request.' },
    { q: 'What does `withThreadFactory(factory)` change?',
      choices: ['How the scope makes its subtasks\' threads (their names, their kind)', 'How many subtasks may run at once', 'The deadline', 'Which thread owns the scope'],
      answer: 0,
      why: 'Subtasks run on virtual threads by default; a factory can name them (checkout-1, checkout-2) or set handlers.' }
  ];

  Q['sc-nesting'] = [
    { q: 'An outer scope is closed while an inner scope opened after it is still open. What happens (Java 25)?',
      choices: ['StructureViolationException', 'Both close normally', 'The inner scope is closed first, silently', 'A deadlock'],
      answer: 0,
      why: 'Scopes must close in the reverse order they opened; try-with-resources makes that automatic.' },
    { q: 'A subtask has a scope of its own. Its parent scope is cancelled. What happens to the inner subtasks?',
      choices: ['They are cancelled too: the subtask is interrupted in its own join(), and its scope cancels its subtasks', 'They run to the end', 'They become orphans', 'They are moved to the parent scope'],
      answer: 0,
      why: 'Cancellation flows down the tree, level by level.' },
    { q: 'What does this program print?',
      code: 'int inner(int x) throws Exception {\n    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<Integer>allSuccessfulOrThrow())) {\n        scope.fork(() -> x);\n        scope.fork(() -> x * 10);\n        return scope.join().mapToInt(StructuredTaskScope.Subtask::get).sum();\n    }\n}\n\nvoid main() throws Exception {\n    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<Integer>allSuccessfulOrThrow())) {\n        scope.fork(() -> inner(1));\n        scope.fork(() -> inner(2));\n        IO.println(scope.join().mapToInt(StructuredTaskScope.Subtask::get).sum());\n    }\n}',
      choices: ['`33`', '`3`', '`30`'],
      answer: 0,
      why: 'inner(1) is 1 + 10 = 11 and inner(2) is 2 + 20 = 22; 11 + 22 = 33.' },
    { q: 'How does a JSON thread dump show a structured scope?',
      choices: ['As a thread container with its threads, its parent and its owner', 'It does not show scopes', 'As one thread named after the scope', 'Only in a JFR recording'],
      answer: 0,
      why: 'Each scope is a container in `jcmd Thread.dump_to_file -format=json`, named after `withName` (probed), so the tree can be rebuilt.' }
  ];

  Q['sc-patterns'] = [
    { q: 'What is a **hedged request**?',
      choices: ['A second request sent only if the first has not answered after a short delay; the first answer wins and the other is cancelled', 'A request retried after it fails', 'A request split into parts', 'A request sent to every replica at once'],
      answer: 0,
      why: 'Sent rarely, it cuts the slowest calls; with a scope, the loser is cancelled so hedging does not double the load.' },
    { q: 'What does this program print?',
      code: 'void main() throws Exception {\n    var calls = new AtomicInteger();\n    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())) {\n        scope.fork(() -> { calls.incrementAndGet(); return "primary"; });\n        scope.fork(() -> { Thread.sleep(500); calls.incrementAndGet(); return "backup"; });\n        scope.join();\n    }\n    IO.println(calls.get());\n}',
      choices: ['`1`', '`2`', '`0`'],
      answer: 0,
      why: 'The primary answers at once; the scope is cancelled, which interrupts the backup\'s sleep before it ever counts its call.' },
    { q: 'In Java 26, what is `Joiner.anySuccessfulResultOrThrow()` called?',
      choices: ['`anySuccessfulOrThrow()`', '`firstSuccessful()`', 'It is unchanged', '`raceOrThrow()`'],
      answer: 0,
      why: 'JEP 525 renamed it; it also made `allSuccessfulOrThrow()` return a List of results.' },
    { q: 'Which joiner does Java 27 remove?',
      choices: ['`awaitAll()`', '`allUntil(…)`', '`allSuccessfulOrThrow()`', 'None'],
      answer: 0,
      why: 'JEP 533 removes `awaitAll()`, adds a type parameter for the exception join() throws, and makes the …OrThrow joiners throw ExecutionException.' }
  ];
})(window.JCLT);
