/*
 * data/interview-structured.js - the interview questions on structured concurrency (batch 2).
 * The shape is described at the top of data/interview-virtual-threads.js.
 */
(function (U) {
  'use strict';
  function jv(code) { return '```java\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];

  Q.push({
    id: 'sc-what', track: 'structured', weight: 3,
    q: 'What is structured concurrency, and what problem does it solve?',
    keywords: ['structured concurrency', 'StructuredTaskScope', 'orphan', 'cancellation', 'fork', 'join', 'jep 505'],
    short: 'It treats a group of concurrent subtasks as one unit of work tied to a block of code: they start inside the block and have all ended when it ends. Java\'s `StructuredTaskScope` (a preview in Java 25, JEP 505) forks subtasks on virtual threads, joins them by a policy, cancels the rest when the policy says so (one failed, one succeeded, a deadline passed), and waits for them in `close()`. It solves orphaned tasks, missing cancellation and lost failures, and makes the task tree visible in thread dumps.',
    answer: [
      jv(`String slow(String name, long ms) throws InterruptedException {
    try {
        Thread.sleep(ms);
    } catch (InterruptedException e) {
        IO.println(name + ": cancelled");
        throw e;
    }
    return name;
}

void main() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        scope.fork(() -> slow("user", 1_000));
        scope.fork(() -> { throw new IllegalStateException("orders down"); });
        scope.join();
    } catch (StructuredTaskScope.FailedException e) {
        IO.println("failed: " + e.getCause().getMessage());
    }
}`),
      out(`user: cancelled
failed: orders down`),
      '| Unstructured (executor) | Structured (scope) |\n|---|---|\n| a task can outlive its caller | `close()` waits for every subtask |\n| a failure leaves siblings running | the scope cancels them |\n| cancelling the caller does not reach the tasks | an interrupted owner cancels its scope |\n| unrelated threads in a dump | the scope tree in a JSON dump |'
    ].join('\n\n'),
    followups: ['How does the scope cancel a subtask?', 'What changes in the API between Java 25, 26 and 27?', 'Would you use a preview API in production?'],
    related: ['lesson:sc-why', 'lesson:sc-basics', 'lesson:sc-nesting', 'q:sc-vs-completablefuture', 'q:sc-preview'],
    docs: 'https://openjdk.org/jeps/505'
  });

  Q.push({
    id: 'sc-vs-completablefuture', track: 'structured', weight: 3,
    q: 'StructuredTaskScope or CompletableFuture: how do they differ?',
    keywords: ['CompletableFuture', 'StructuredTaskScope', 'allOf', 'thenCombine', 'cancellation', 'async', 'comparison'],
    short: '`CompletableFuture` composes asynchronous results with callbacks (`thenCompose`, `allOf`), runs on a pool, and does not tie tasks to their caller: a failure does not cancel siblings, and `cancel(true)` does not even interrupt the running task. A scope is blocking-style code on virtual threads: fork, join, read; failures cancel siblings by interrupting them; nothing outlives the block. Use `CompletableFuture` for event-driven pipelines and existing async APIs; use a scope for request-scoped fan-out on virtual threads.',
    answer: '| | `CompletableFuture` | `StructuredTaskScope` |\n|---|---|---|\n| Style | callbacks and combinators | plain blocking code |\n| Threads | a pool (the common pool by default) | a virtual thread per subtask |\n| On a failure | siblings run on | siblings cancelled (interrupted) |\n| `cancel` | does not interrupt the task | cancellation interrupts |\n| Lifetime | can outlive the caller | ends with the block |\n| Status | final since Java 8 | preview in 25, 26, 27 |',
    followups: ['Why does CompletableFuture.cancel(true) not interrupt?', 'How would you add a deadline to each?'],
    related: ['lesson:sc-why', 'lesson:sc-failure', 'q:sc-what'],
    docs: 'https://openjdk.org/jeps/505'
  });

  Q.push({
    id: 'sc-cancellation', track: 'structured', weight: 3,
    q: 'How does cancellation work in structured concurrency, and what can break it?',
    keywords: ['cancellation', 'interrupt', 'InterruptedException', 'cooperative', 'FailedException', 'close'],
    short: 'Cancelling a scope interrupts every subtask thread still running; Java cancellation is cooperative, so blocking calls answer with `InterruptedException` and loops must check `Thread.interrupted()`. `close()` then waits for every subtask to end. It breaks when a subtask swallows the interrupt (an empty `catch`, or `catch (Exception e) { log }`) or computes without checking: the scope still waits for it, so the whole block takes as long as that subtask.',
    answer: jv(`void main() throws Exception {
    long start = System.nanoTime();
    try (var scope = StructuredTaskScope.open()) {
        scope.fork(() -> {
            for (int i = 0; i < 3; i++) {
                try {
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    // swallowed: cancellation does not stop this loop
                }
            }
            return "stubborn";
        });
        scope.fork(() -> { throw new IllegalStateException("fails at once"); });
        scope.join();
    } catch (StructuredTaskScope.FailedException e) {
        IO.println("close() waited for the stubborn subtask: " + ((System.nanoTime() - start) / 1_000_000 >= 350));
    }
}`) + '\n\n' + out('close() waited for the stubborn subtask: true'),
    followups: ['How do you make a CPU-bound loop cancellable?', 'What happens when the owner thread is interrupted?'],
    related: ['lesson:sc-failure', 'q:sc-what', 'term:cancellation'],
    docs: 'https://openjdk.org/jeps/505'
  });

  Q.push({
    id: 'sc-joiners', track: 'structured', weight: 2,
    q: 'What is a Joiner, and which built-in joiners are there in Java 25?',
    keywords: ['Joiner', 'allSuccessfulOrThrow', 'anySuccessfulResultOrThrow', 'awaitAll', 'allUntil', 'awaitAllSuccessfulOrThrow', 'policy'],
    short: 'A Joiner is the scope\'s policy: it is told about each subtask as it is forked and as it completes, decides when to cancel the scope, and produces what `join()` returns. Java 25 has `awaitAllSuccessfulOrThrow()` (the default of `open()`), `allSuccessfulOrThrow()` (a stream of subtasks), `anySuccessfulResultOrThrow()` (the first result), `awaitAll()` (wait for everything) and `allUntil(predicate)`. A joiner must not be reused across scopes; you can write your own.',
    answer: '| Joiner (Java 25) | Returns | Cancels when |\n|---|---|---|\n| `awaitAllSuccessfulOrThrow()` | null | one fails |\n| `allSuccessfulOrThrow()` | stream of subtasks, fork order | one fails |\n| `anySuccessfulResultOrThrow()` | the first result | one succeeds |\n| `awaitAll()` | null | never |\n| `allUntil(p)` | stream of all subtasks | p is true for one |\n\nJava 26 renames the race joiner `anySuccessfulOrThrow()` and makes `allSuccessfulOrThrow()` return a `List` of results; Java 27 removes `awaitAll()`.',
    followups: ['How would you write a quorum joiner?', 'Why must a joiner be thread-safe?'],
    related: ['lesson:sc-joiners', 'lesson:sc-custom-joiner'],
    docs: 'https://openjdk.org/jeps/505'
  });

  Q.push({
    id: 'sc-timeout', track: 'structured', weight: 2,
    q: 'How do you put a deadline on a group of concurrent calls?',
    keywords: ['timeout', 'deadline', 'withTimeout', 'TimeoutException', 'fallback', 'budget'],
    short: 'Open the scope with a configuration: `StructuredTaskScope.open(joiner, config -> config.withTimeout(Duration.ofMillis(200)))`. When the deadline passes before the joiner is satisfied, the scope cancels what is still running and `join()` throws `StructuredTaskScope.TimeoutException`; catch it to return a fallback. One deadline for the whole fan-out matches a request\'s budget better than a timeout per call; keep the clients\' own timeouts too.',
    answer: jv(`String price() throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow(),
            config -> config.withTimeout(Duration.ofMillis(100)))) {
        scope.fork(() -> { Thread.sleep(1_000); return "live price"; });
        return scope.join();
    } catch (StructuredTaskScope.TimeoutException e) {
        return "cached price";
    }
}

void main() throws Exception {
    IO.println(price());
}`) + '\n\n' + out('cached price'),
    followups: ['What happens to the slow call when the deadline passes?', 'How does Java 26\'s Joiner.onTimeout change this?'],
    related: ['lesson:sc-timeouts', 'q:sc-joiners'],
    docs: 'https://openjdk.org/jeps/505'
  });

  Q.push({
    id: 'sc-preview', track: 'structured', weight: 2,
    q: 'Structured concurrency is a preview in Java 25. Would you use it in production?',
    keywords: ['preview', '--enable-preview', 'production', 'risk', 'java 26', 'java 27', 'adoption'],
    short: 'It is finished but not permanent: it needs `--enable-preview` at compile and run time, class files are tied to that exact Java release, and the API changes (it changed in 25, 26 and 27). A reasonable answer: use it where the gain is large (request fan-out with cancellation), behind a small wrapper so a release upgrade is a few edits, with the build and deployment flags in place; or wait for it to become final and use executors with careful cancellation meanwhile. Scoped values, by contrast, are final in 25.',
    answer: '| Consideration | What it means |\n|---|---|\n| Flags | `--enable-preview` in the compiler plugin and in every `java` command |\n| Class files | compiled with preview on run only on that release |\n| API churn | 25: new `open`/`Joiner` API; 26: renames; 27: exception type parameter, `awaitAll` removed |\n| Mitigation | keep scopes in a few helpers; tests around them |',
    followups: ['What did Java 26 and 27 change?', 'How do you enable preview features in Maven or Gradle?'],
    related: ['lesson:sc-patterns', 'q:sc-what'],
    docs: 'https://openjdk.org/jeps/533'
  });

  Q.push({
    id: 'sc-hedging', track: 'structured', weight: 1,
    q: 'What is a hedged request, and how would you build one?',
    keywords: ['hedged request', 'hedging', 'tail latency', 'p99', 'race', 'backup request'],
    short: 'Send a request; if no answer has arrived after a short delay (around the usual answer time), send the same request to another replica and take whichever answers first, cancelling the other. It cuts tail latency at the cost of a few extra requests. With a scope: `anySuccessfulResultOrThrow()`, fork the primary, and fork a second subtask that sleeps for the delay before calling the backup; if the primary wins first, the scope interrupts that sleep and the backup is never sent.',
    answer: 'The shape is in lesson [[lesson:sc-patterns]], with a checked challenge. The point to make: without cancellation, hedging doubles the load on a slow service; with structured cancellation, the losing request stops.',
    followups: ['How do you pick the hedge delay?', 'Why can hedging make an overload worse?'],
    related: ['lesson:sc-patterns', 'q:sc-joiners'],
    docs: 'https://openjdk.org/jeps/505'
  });
})(window.JCLT);
