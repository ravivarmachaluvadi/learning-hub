/*
 * data/lessons-juc.js - Track 2, the java.util.concurrent toolkit: eight lessons (batch 3).
 * The lesson shape is described at the top of data/lessons-virtual-threads.js; the race-window checks
 * are described at the top of data/lessons-threads.js.
 */
(function (U) {
  'use strict';
  function jv(code) { return '```java\n' + code + '\n```'; }
  function norun(code) { return '```java-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function props(t) { return '```properties\n' + t + '\n```'; }
  var L = U.data.lessons = U.data.lessons || [];

  var SERVICE = { name: 'Service.java', code: `/** A slow service: each call waits for an answer, as a call over the network does. */
public interface Service {
    String fetch(String id) throws InterruptedException;
}
` };

  /* ---------------------------------------------------------------- 1 */
  L.push({
    id: 'juc-executors', track: 'juc', title: 'Executors and pool sizing',
    summary: 'An executor runs your tasks on threads it manages. What each factory method really builds, ThreadPoolExecutor\'s settings and the order it uses them in, what happens when it is full, how big a pool should be, and how to shut one down.',
    keywords: ['executor', 'ExecutorService', 'thread pool', 'ThreadPoolExecutor', 'newFixedThreadPool', 'newCachedThreadPool', 'pool size', 'pool sizing', 'core pool size', 'queue', 'rejection policy', 'CallerRunsPolicy', 'AbortPolicy', 'shutdown', 'awaitTermination'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html', docsLabel: 'Java 25 API: ThreadPoolExecutor', lab: '16-java-multithreading',
    body: [
      '## Why an executor',
      'Starting a thread per task by hand leaves every question open: how many at once, what names, who waits for them, who hears their exceptions, who stops them. An `ExecutorService` separates **submitting** a task from **running** it: you hand it tasks, it runs them on threads it manages, gives you a `Future` for each ([[lesson:juc-futures]]), and shuts down in one call.',
      '## What the factory methods build',
      '`Executors` has a method for each common pool. They are thin wrappers; what is behind them matters (measured on JDK 25):',
      jv(`String describe(ExecutorService e) {
    if (!(e instanceof ThreadPoolExecutor p)) return e.getClass().getSimpleName();
    return "core " + p.getCorePoolSize() + ", max " + (p.getMaximumPoolSize() == Integer.MAX_VALUE ? "unlimited" : p.getMaximumPoolSize())
        + ", queue " + p.getQueue().getClass().getSimpleName()
        + (p.getQueue().remainingCapacity() == Integer.MAX_VALUE ? " (unbounded)" : "")
        + ", " + p.getRejectedExecutionHandler().getClass().getSimpleName();
}

void main() {
    try (var fixed = Executors.newFixedThreadPool(4);
         var cached = Executors.newCachedThreadPool();
         var virtual = Executors.newVirtualThreadPerTaskExecutor()) {
        IO.println("newFixedThreadPool(4):  " + describe(fixed));
        IO.println("newCachedThreadPool():  " + describe(cached));
        IO.println("newVirtualThreadPerTaskExecutor(): " + describe(virtual));
    }
}`),
      out(`newFixedThreadPool(4):  core 4, max 4, queue LinkedBlockingQueue (unbounded), AbortPolicy
newCachedThreadPool():  core 0, max unlimited, queue SynchronousQueue, AbortPolicy
newVirtualThreadPerTaskExecutor(): ThreadPerTaskExecutor`),
      '| Factory | Threads | Queue | The risk |\n|---|---|---|---|\n| `newFixedThreadPool(n)` | exactly n | unbounded | under overload the queue grows without limit, and so does latency |\n| `newCachedThreadPool()` | as many as tasks waiting, idle ones end after 60 s | none (hands each task over) | thousands of OS threads under load |\n| `newSingleThreadExecutor()` | one | unbounded | one slow task holds up all the rest |\n| `newScheduledThreadPool(n)` | n | a delay queue | a task that throws stops repeating, silently |\n| `newWorkStealingPool()` | a `ForkJoinPool`, one per processor | per-thread deques | for splitting computation ([[lesson:juc-forkjoin]]) |\n| `newVirtualThreadPerTaskExecutor()` | a new virtual thread per task | none | none of the above: limit the resource instead ([[lesson:vt-limit]]) |',
      '## ThreadPoolExecutor\'s order',
      'Most pools are a `ThreadPoolExecutor` with six settings: core size, maximum size, keep-alive, its unit, the work queue and the rejection handler. A new task goes to the **first** of these that can take it:',
      '1. a new thread, while there are fewer than the core size;\n2. the **queue**, while it has room;\n3. a new thread, while there are fewer than the maximum;\n4. the **rejection handler**.',
      'So a pool with an unbounded queue **never grows past its core size**: the queue always has room. And when the queue is bounded and full, the handler decides: `AbortPolicy` (the default) throws `RejectedExecutionException`, `CallerRunsPolicy` runs the task on the thread that submitted it, which slows the submitter down: back pressure.',
      jv(`void main() throws InterruptedException {
    var pool = new ThreadPoolExecutor(1, 1, 0, TimeUnit.SECONDS, new ArrayBlockingQueue<>(1));
    var hold = new CountDownLatch(1);
    pool.execute(() -> { try { hold.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } });
    pool.execute(() -> { });
    try {
        pool.execute(() -> { });
    } catch (RejectedExecutionException e) {
        IO.println("third task: rejected (one thread busy, one task queued, queue full)");
    }
    pool.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    pool.execute(() -> IO.println("with CallerRunsPolicy it ran on " + Thread.currentThread().getName()));
    hold.countDown();
    pool.close();
}`),
      out(`third task: rejected (one thread busy, one task queued, queue full)
with CallerRunsPolicy it ran on main`),
      '## How big a pool',
      'For tasks that **compute**, more threads than processors only adds switching: about one per processor (`Runtime.getRuntime().availableProcessors()`). For tasks that **wait**, Brian Goetz\'s formula: threads = processors × (1 + wait time / compute time). It is Little\'s law again ([[lesson:vt-why]]): enough threads to keep the processors busy while the others wait.',
      jv(`int poolSize(int cores, double waitMs, double computeMs) {
    return (int) Math.ceil(cores * (1 + waitMs / computeMs));
}

void main() {
    IO.println("16 cores, computing only:          " + poolSize(16, 0, 10));
    IO.println("16 cores, 90 ms waiting per 10 ms: " + poolSize(16, 90, 10));
}`),
      out(`16 cores, computing only:          16
16 cores, 90 ms waiting per 10 ms: 160`),
      'The second number is a guess about the downstream services, wrong as soon as they slow down. For waiting tasks, virtual threads remove the guess: no pool, and a `Semaphore` where a real limit exists.',
      '## Shutting down',
      '`shutdown()` accepts no new tasks and lets the queued ones run; `awaitTermination` waits; `shutdownNow()` interrupts the running tasks and returns the queued ones unstarted ([[lesson:th-interrupts]]). Since Java 19 `close()` does `shutdown` and waits, so try-with-resources is the whole story. A pool never shut down keeps its threads, and (if they are not daemons) the JVM, alive.'
    ].join('\n\n'),
    work: [
      '**The executor Spring gives you.** Without virtual threads, Spring Boot auto-configures a `ThreadPoolTaskExecutor` for `@Async` and friends: 8 core threads that grow and shrink with the load, 60 s keep-alive (Spring Boot 4.1.2 reference). Its `ThreadPoolExecutor` order still applies: set a queue capacity, or the pool never grows to its maximum. With `spring.threads.virtual.enabled=true` it becomes a `SimpleAsyncTaskExecutor` on virtual threads, and the pool properties are ignored.',
      props(`spring.task.execution.pool.max-size=16
spring.task.execution.pool.queue-capacity=100
spring.task.execution.pool.keep-alive=10s`),
      '**An unbounded queue hides an overload.** A fixed pool in front of a slow dependency keeps accepting work; the queue grows, every task waits longer, and memory climbs, while dashboards show the pool "healthy" at its size. A bounded queue with `CallerRunsPolicy`, or a rejection you turn into a fast 503, makes the overload visible. See the Learning lab [[lab:57-queueing-theory]].',
      '**One pool per kind of work** (a bulkhead): a slow report generator on its own small pool cannot starve the request threads. And name each pool\'s threads, so a thread dump says which work is stuck.'
    ].join('\n\n'),
    example: {
      code: `// A pool of 2, a queue of 2, then CallerRunsPolicy. Submit 8 slow tasks: which ran on main?
void main() throws InterruptedException {
    var pool = new ThreadPoolExecutor(2, 2, 0, TimeUnit.SECONDS, new ArrayBlockingQueue<>(2),
        Thread.ofPlatform().name("pool-", 1).factory(), new ThreadPoolExecutor.CallerRunsPolicy());
    for (int i = 1; i <= 8; i++) {
        int n = i;
        pool.execute(() -> {
            try { Thread.sleep(100); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            IO.println("task " + n + " on " + Thread.currentThread().getName());
        });
    }
    pool.close();
}`,
      note: 'Which tasks run on main depends on timing; that some do is the back pressure.'
    },
    challenge: {
      title: 'The pool you mean',
      task: 'Two methods.\n\n1. `boundedPool(threads, queueSize)`: a `ThreadPoolExecutor` with exactly `threads` threads, a queue that holds at most `queueSize` waiting tasks, and, when both are full, the task run on the thread that submitted it.\n2. `poolSize(cores, waitMs, computeMs)`: the pool size for tasks that wait `waitMs` for every `computeMs` of computing: `cores × (1 + wait / compute)`, **rounded up**.',
      starter: `// Exactly threads threads, at most queueSize waiting tasks, and the caller runs the task when both are full.
ThreadPoolExecutor boundedPool(int threads, int queueSize) {
    return (ThreadPoolExecutor) Executors.newFixedThreadPool(threads);
}

// cores x (1 + wait / compute), rounded up.
int poolSize(int cores, double waitMs, double computeMs) {
    throw new UnsupportedOperationException("Not written yet");
}

void main() {
    try (var pool = boundedPool(2, 5)) {
        IO.println(pool.getCorePoolSize() + " threads, room for " + pool.getQueue().remainingCapacity());
    }
}`,
      solution: `ThreadPoolExecutor boundedPool(int threads, int queueSize) {
    return new ThreadPoolExecutor(threads, threads, 0, TimeUnit.MILLISECONDS,
        new ArrayBlockingQueue<>(queueSize), new ThreadPoolExecutor.CallerRunsPolicy());
}

int poolSize(int cores, double waitMs, double computeMs) {
    return (int) Math.ceil(cores * (1 + waitMs / computeMs));
}

void main() {
    try (var pool = boundedPool(2, 5)) {
        IO.println(pool.getCorePoolSize() + " threads, room for " + pool.getQueue().remainingCapacity());
    }
}`,
      hints: [
        '`new ThreadPoolExecutor(core, max, keepAlive, unit, queue, handler)`: core and max both `threads` make it fixed; keep-alive does not matter then (0).',
        '`new ArrayBlockingQueue<>(queueSize)` is a bounded queue; `new ThreadPoolExecutor.CallerRunsPolicy()` is the handler that runs a rejected task on the caller.',
        '`Math.ceil` rounds up and returns a `double`: cast it with `(int)`.'
      ],
      checks: [
        { label: 'boundedPool(4, 10) has exactly 4 threads', code: `try (ThreadPoolExecutor pool = c.call("boundedPool", 4, 10)) {
    c.eq(List.of(pool.getCorePoolSize(), pool.getMaximumPoolSize()), List.of(4, 4));
}` },
        { label: 'its queue holds at most 10 waiting tasks', code: `try (ThreadPoolExecutor pool = c.call("boundedPool", 4, 10)) {
    c.ok(pool.getQueue().remainingCapacity() == 10, "the queue has room for " + pool.getQueue().remainingCapacity() + " tasks: an unbounded queue never fills, so the pool never pushes back");
}` },
        { label: 'when the threads and the queue are full, the task runs on the caller', code: `ThreadPoolExecutor pool = c.call("boundedPool", 1, 1);
var hold = new CountDownLatch(1);
pool.execute(() -> { try { hold.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } });
pool.execute(() -> { });
String[] ranOn = new String[1];
try {
    pool.execute(() -> ranOn[0] = Thread.currentThread().getName());
} catch (RejectedExecutionException e) {
    ranOn[0] = "rejected";
}
hold.countDown();
pool.close();
c.eq(ranOn[0], Thread.currentThread().getName());` },
        { label: 'poolSize(16, 90, 10) is 160, and poolSize(8, 0, 10) is 8', code: `c.eq(c.call("poolSize", 16, 90.0, 10.0), 160);
c.eq(c.call("poolSize", 8, 0.0, 10.0), 8);` },
        { label: 'poolSize rounds up: (3, 10, 4) is 11, not 10', code: `c.eq(c.call("poolSize", 3, 10.0, 4.0), 11);` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'juc-futures', track: 'juc', title: 'Callable, Future and invokeAll',
    summary: 'A Callable returns a value and may throw; submitting it gives a Future. get() waits (with a timeout if you are wise), a failure arrives as ExecutionException, cancel(true) interrupts, and state() says what happened.',
    keywords: ['Future', 'Callable', 'Runnable', 'submit', 'get', 'timeout', 'ExecutionException', 'cancel', 'CancellationException', 'invokeAll', 'invokeAny', 'state', 'resultNow', 'TimeoutException'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Future.html', docsLabel: 'Java 25 API: Future', lab: '16-java-multithreading',
    body: [
      '## Runnable or Callable',
      'A `Runnable` returns nothing and cannot throw a checked exception. A `Callable<V>` returns a `V` and may throw anything. `submit` takes either; a lambda that returns a value is a `Callable`, so it may also call `Thread.sleep` without a `try`.',
      '| | `Runnable` | `Callable<V>` |\n|---|---|---|\n| Method | `void run()` | `V call() throws Exception` |\n| Result | none (`get()` gives `null`) | the value |\n| Checked exceptions | must be caught inside | may be thrown, and reach `get()` |\n| Lambda shape | `() -> doIt()` (no value) | `() -> compute()` or `() -> { …; return x; }` |',
      '## A Future: the result, later',
      '`submit` returns a `Future` at once. `get()` waits for the result. If the task threw, `get()` throws `ExecutionException`, and the task\'s own exception is its **cause**:',
      jv(`void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<Integer> ok = executor.submit(() -> 6 * 7);
        Future<Integer> bad = executor.submit(() -> { throw new IllegalStateException("no stock"); });
        IO.println("ok: " + ok.get());
        try {
            bad.get();
        } catch (ExecutionException e) {
            IO.println("message: " + e.getMessage());
            IO.println("cause:   " + e.getCause().getMessage());
        }
    }
}`),
      out(`ok: 42
message: java.lang.IllegalStateException: no stock
cause:   no stock`),
      '## Never wait for ever',
      '`get()` with no timeout waits as long as the task takes, and a call to a stuck service can take for ever. `get(timeout, unit)` throws `TimeoutException` instead, and **the task goes on running**: cancel it if you no longer want it. `cancel(true)` interrupts the thread running it ([[lesson:th-interrupts]]):',
      jv(`void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var stopped = new CountDownLatch(1);
        Future<String> slow = executor.submit(() -> {
            try {
                Thread.sleep(5_000);
                return "late";
            } finally {
                stopped.countDown();
            }
        });
        try {
            slow.get(100, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            IO.println("no answer in 100 ms; still running: " + (slow.state() == Future.State.RUNNING));
            slow.cancel(true);
        }
        IO.println("cancelled, and its thread was interrupted: " + stopped.await(2, TimeUnit.SECONDS));
        IO.println("state now: " + slow.state());
    }
}`),
      out(`no answer in 100 ms; still running: true
cancelled, and its thread was interrupted: true
state now: CANCELLED`),
      '## state(), resultNow(), exceptionNow()',
      'Since Java 19 a `Future` says what became of the task without a `get()` in a `try`: `state()` is `RUNNING`, `SUCCESS`, `FAILED` or `CANCELLED`, and `resultNow()` and `exceptionNow()` read a finished one ([[ref:future-state]]).',
      '## Many tasks: invokeAll and invokeAny',
      '`invokeAll` runs them all and returns their futures, done, in the order of the tasks; with a timeout it cancels the ones still running. `invokeAny` returns the first successful result and cancels the rest.',
      jv(`void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Callable<String>> tasks = List.of(
            () -> "fast",
            () -> { Thread.sleep(2_000); return "slow"; },
            () -> { throw new IllegalStateException("broken"); });
        for (Future<String> f : executor.invokeAll(tasks, 200, TimeUnit.MILLISECONDS)) {
            IO.println(f.state() + (f.state() == Future.State.SUCCESS ? " " + f.resultNow() : ""));
        }
        IO.println("invokeAny: " + executor.invokeAny(List.of(() -> { Thread.sleep(500); return "slow mirror"; }, () -> "fast mirror")));
    }
}`),
      out(`SUCCESS fast
CANCELLED
FAILED
invokeAny: fast mirror`),
      '## What futures leave to you',
      'Futures do not compose (each `get` is a separate wait), and nothing cancels the other tasks when one fails unless you write it, on every path. `CompletableFuture` composes ([[lesson:juc-completable]]); `StructuredTaskScope` cancels for you ([[lesson:sc-failure]]).'
    ].join('\n\n'),
    work: [
      '**Spring\'s `@Async` returns a future.** A method annotated `@Async` that returns `CompletableFuture<T>` (or `Future<T>`) runs on the task executor and hands its caller a future at once; a `void` one runs fire-and-forget, and its exceptions go to an `AsyncUncaughtExceptionHandler`, not to the caller.',
      '**Every remote call gets a deadline.** A `future.get()` with no timeout in a request handler ties that request to the slowest dependency; under an outage the request threads pile up waiting. Give each call a timeout (the client\'s own, and `get(timeout)`), cancel what you stop waiting for, and answer with a fallback or an error.',
      '**Log the cause, not the wrapper.** `ExecutionException: java.lang.IllegalStateException: …` is the wrapper\'s message; the stack trace that says where it went wrong is `e.getCause()`\'s.'
    ].join('\n\n'),
    example: {
      code: `// Make the second call fail or take longer than the deadline: what does each Future's state say?
void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<String> a = executor.submit(() -> { Thread.sleep(50); return "prices"; });
        Future<String> b = executor.submit(() -> { Thread.sleep(80); return "stock"; });
        for (Future<String> f : List.of(a, b)) {
            try {
                IO.println(f.get(200, TimeUnit.MILLISECONDS));
            } catch (ExecutionException e) {
                IO.println("failed: " + e.getCause().getMessage());
            } catch (TimeoutException e) {
                f.cancel(true);
                IO.println("timed out");
            }
        }
    }
}`
    },
    challenge: {
      title: 'Fetch with one deadline',
      task: 'Write `fetchAll(ids, service, millis)`: call `service.fetch(id)` for every id, **all at the same time** on virtual threads, and return one answer per id, in order:\n\n- the call\'s answer;\n- `"failed: <message>"` when it threw, with the message of the **call\'s own** exception;\n- `"timeout"` when it had not answered by the deadline, and then cancel it.\n\nThe deadline is **one for the whole call**: `millis` after `fetchAll` began, not `millis` for each id.',
      files: [SERVICE],
      starter: `// Answer per id, in order: the answer, "failed: <message>", or "timeout" (and cancel it) after millis.
List<String> fetchAll(List<String> ids, Service service, long millis) throws InterruptedException {
    List<String> answers = new ArrayList<>();
    for (String id : ids) {
        answers.add(service.fetch(id));
    }
    return answers;
}

void main() throws InterruptedException {
    IO.println(fetchAll(List.of("a", "b"), id -> "answer " + id, 500));
}`,
      solution: `List<String> fetchAll(List<String> ids, Service service, long millis) throws InterruptedException {
    long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(millis);
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<String>> futures = new ArrayList<>();
        for (String id : ids) futures.add(executor.submit(() -> service.fetch(id)));
        List<String> answers = new ArrayList<>();
        for (Future<String> f : futures) {
            long left = deadline - System.nanoTime();
            try {
                answers.add(f.get(Math.max(0, left), TimeUnit.NANOSECONDS));
            } catch (ExecutionException e) {
                answers.add("failed: " + e.getCause().getMessage());
            } catch (TimeoutException e) {
                f.cancel(true);
                answers.add("timeout");
            }
        }
        return answers;
    }
}

void main() throws InterruptedException {
    IO.println(fetchAll(List.of("a", "b"), id -> "answer " + id, 500));
}`,
      hints: [
        'Submit every call first, keeping the futures in order; then wait for each. The deadline is a moment: `System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(millis)`, and each `get` waits only for the time left until it.',
        '`get(timeout, unit)` throws `ExecutionException` (the call\'s exception is `getCause()`) or `TimeoutException`. Catch both.',
        'After a `TimeoutException`, `f.cancel(true)` interrupts the call; otherwise the executor\'s `close()` would wait for it.'
      ],
      checks: [
        { label: 'returns the answers in order', code: `c.eq(c.call("fetchAll", List.of("x", "y", "z"), (Service) id -> id.toUpperCase(), 1_000L), List.of("X", "Y", "Z"));` },
        { label: 'the three calls are in flight at the same time', code: `var p = c.probe(3);
c.call("fetchAll", List.of("a", "b", "c"), (Service) id -> { p.meet(); return id; }, 2_000L);
c.ok(p.met(), "at most " + p.peak() + " of the 3 calls were in flight at once");` },
        { label: 'a failed call answers "failed: " and the call\'s own message', code: `List<String> got = c.call("fetchAll", List.of("ok", "bad"), (Service) id -> { if (id.equals("bad")) throw new IllegalStateException("no stock"); return id; }, 1_000L);
c.eq(got, List.of("ok", "failed: no stock"));` },
        { label: 'a call that does not answer in time gives "timeout", and is cancelled', code: `var p = c.probe(1);
List<String> got = c.call("fetchAll", List.of("fast", "stuck"), (Service) id -> { if (id.equals("stuck")) p.hang(); return id; }, 200L);
c.eq(got, List.of("fast", "timeout"));
c.ok(p.cancelled() == 1, "the late call was not interrupted: cancel(true) it");` },
        { label: 'one deadline for all: five stuck calls and 300 ms take well under 1.2 s', code: `var p = c.probe(5);
long ms = c.timed(() -> c.call("fetchAll", List.of("a", "b", "c", "d", "e"), (Service) id -> { p.hang(); return id; }, 300L));
c.ok(ms < 1_200, "it took " + ms + " ms: each call got its own 300 ms instead of one deadline for all");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'juc-completable', track: 'juc', title: 'CompletableFuture',
    summary: 'A future you can say what happens next to: transform it, chain another call, combine two, recover from a failure, give it a deadline. Pass it an executor, and know that cancelling or timing it out does not stop the work.',
    keywords: ['CompletableFuture', 'supplyAsync', 'thenApply', 'thenCompose', 'thenCombine', 'exceptionally', 'handle', 'allOf', 'anyOf', 'orTimeout', 'completeOnTimeout', 'CompletionException', 'async', 'common pool', 'callback'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CompletableFuture.html', docsLabel: 'Java 25 API: CompletableFuture', lab: '16-java-multithreading',
    body: [
      '## A future that runs code when it completes',
      'A plain `Future` only lets you wait. A `CompletableFuture` (Java 8) lets you attach what happens next, and returns a new future for that. `supplyAsync(supplier, executor)` starts the work:',
      jv(`void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        CompletableFuture<Integer> price = CompletableFuture.supplyAsync(() -> 250, executor);
        CompletableFuture<Integer> stock = CompletableFuture.supplyAsync(() -> 4, executor);
        String page = price
            .thenCombine(stock, (p, s) -> p + " each, " + s + " left")
            .thenApply(text -> "Kettle: " + text)
            .join();
        IO.println(page);
    }
}`),
      out('Kettle: 250 each, 4 left'),
      '| Method | Takes | Use it for |\n|---|---|---|\n| `thenApply(fn)` | the value, returns a value | a transformation (`map`) |\n| `thenCompose(fn)` | the value, returns a **future** | the next asynchronous call that needs this result (`flatMap`) |\n| `thenCombine(other, fn)` | this value and another future\'s | two independent calls that meet |\n| `thenAccept`, `thenRun` | the value, or nothing | a last step with no result |\n| `allOf(…)`, `anyOf(…)` | many futures | wait for all (value `null`), or the first |',
      '## Pass an executor',
      '`supplyAsync(supplier)` without an executor runs on the common `ForkJoinPool` (measured: `ForkJoinPool.commonPool-worker-N`): one thread per processor, less one, shared by every parallel stream in the JVM. A blocking call there starves everyone. Always give the executor; the ⚠ in the margin flags the one-argument form.',
      '## Failures: exceptionally and handle',
      'A failed step skips the steps after it until one that handles failure. After an asynchronous step, the exception you are handed is a `CompletionException` wrapping the real one (measured):',
      jv(`void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        CompletableFuture<String> stock = CompletableFuture.supplyAsync(() -> { throw new IllegalStateException("stock service down"); }, executor);
        IO.println(stock.thenApply(s -> "never runs").exceptionally(e -> e.getClass().getSimpleName() + ", cause: " + e.getCause().getMessage()).join());
        IO.println(stock.handle((v, e) -> e == null ? v : "stock unknown").join());
        try {
            stock.join();
        } catch (CompletionException e) {
            IO.println("join() throws CompletionException; get() would throw ExecutionException");
        }
    }
}`),
      out(`CompletionException, cause: stock service down
stock unknown
join() throws CompletionException; get() would throw ExecutionException`),
      '## Deadlines that do not stop anything',
      '`orTimeout(t, unit)` fails the future with `TimeoutException`; `completeOnTimeout(value, t, unit)` completes it with a fallback. **Neither stops the work**, and neither does `cancel(true)` once the task is running: a `CompletableFuture` is not connected to the thread computing it. Measured, the running task finished anyway in every run:',
      jv(`void main() throws InterruptedException {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var started = new CountDownLatch(1);
        var slow = CompletableFuture.supplyAsync(() -> {
            started.countDown();
            try { Thread.sleep(300); } catch (InterruptedException e) { IO.println("interrupted"); return "stopped"; }
            IO.println("the slow task finished anyway");
            return "slow";
        }, executor);
        started.await();
        IO.println("cancelled: " + slow.cancel(true));
    }
}`),
      out(`cancelled: true
the slow task finished anyway`),
      'One exception, found while writing this lesson: cancelled **before** the executor has started it, the supplier never runs at all (without the latch above, the program printed only `cancelled: true`, in 3 runs of 3). So cancelling skips work not yet begun, and nothing more.',
      'So a timed-out call still holds its thread and its connection until it ends by itself. Give the client a timeout of its own (the HTTP client\'s, the JDBC driver\'s); or use a `Future` from an executor, whose `cancel(true)` does interrupt ([[lesson:juc-futures]]), or a `StructuredTaskScope`, whose deadline cancels its subtasks ([[lesson:sc-timeouts]]).',
      '## Which thread runs a callback',
      '`thenApply` runs on the thread that completes the future, or, if it is already complete, on **your** thread right now (measured: `main`). The `…Async(fn, executor)` variants always hand the step to the executor. With callbacks, where code runs is decided at run time, which is one reason a stack trace in a chain is hard to read.',
      '## And on Java 21+?',
      'With virtual threads you can write the same aggregation as plain blocking code ([[then:blocking-not-callbacks]]), or as a structured scope ([[then:fan-out]]). `CompletableFuture` stays the type of APIs that are asynchronous anyway: `HttpClient.sendAsync`, Spring\'s `@Async` methods, and code that must run on Java 17.'
    ].join('\n\n'),
    work: [
      '**The aggregator endpoint.** A product page calls prices, stock and reviews: three `supplyAsync` calls on a bounded executor, `thenCombine` or `allOf` to meet, `exceptionally` per call for a degraded answer ("stock unknown"), and `completeOnTimeout` for the whole page. Each of those three ideas is one method here.',
      '**Two traps seen in production.** Calls on the common pool (no executor given) that block on HTTP, so parallel streams elsewhere in the JVM stall; and a timeout that "worked" (the response went out) while the slow calls kept their connections, until the connection pool ran dry. Set the client\'s own timeouts.',
      '**`@Async` methods return it.** `public CompletableFuture<Report> build()` annotated `@Async` returns at once; the caller composes or joins. An exception inside surfaces as a failed future, not at the call.'
    ].join('\n\n'),
    example: {
      code: `// Make the stock call throw, then make it slow: which line changes, and when?
void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var price = CompletableFuture.supplyAsync(() -> "250", executor);
        var stock = CompletableFuture.supplyAsync(() -> "4 left", executor).exceptionally(e -> "stock unknown");
        String page = price.thenCombine(stock, (p, s) -> p + " / " + s)
            .completeOnTimeout("unavailable", 500, TimeUnit.MILLISECONDS)
            .join();
        IO.println(page);
    }
}`
    },
    challenge: {
      title: 'A product page from two services',
      task: 'Write `productPage(id, prices, stock, executor)`: call `prices.fetch(id)` and `stock.fetch(id)` **at the same time**, both on the `executor` you are given, and return `"<price> / <stock>"`.\n\n- If the stock call fails, use `"stock unknown"` for its part.\n- If the page is not ready within 500 ms, return `"unavailable"`.\n\nThe helper `call(service, id)` is there because `fetch` throws a checked exception, which a `Supplier` may not.',
      files: [SERVICE],
      starter: `String productPage(String id, Service prices, Service stock, ExecutorService executor) {
    return call(prices, id) + " / " + call(stock, id);
}

// fetch throws InterruptedException, which a Supplier may not: this wraps it.
String call(Service service, String id) {
    try {
        return service.fetch(id);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new CompletionException(e);
    }
}

void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        IO.println(productPage("kettle", id -> "250", id -> "4 left", executor));
    }
}`,
      solution: `String productPage(String id, Service prices, Service stock, ExecutorService executor) {
    CompletableFuture<String> price = CompletableFuture.supplyAsync(() -> call(prices, id), executor);
    CompletableFuture<String> left = CompletableFuture.supplyAsync(() -> call(stock, id), executor)
        .exceptionally(e -> "stock unknown");
    return price.thenCombine(left, (p, s) -> p + " / " + s)
        .completeOnTimeout("unavailable", 500, TimeUnit.MILLISECONDS)
        .join();
}

String call(Service service, String id) {
    try {
        return service.fetch(id);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new CompletionException(e);
    }
}

void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        IO.println(productPage("kettle", id -> "250", id -> "4 left", executor));
    }
}`,
      hints: [
        'Two `CompletableFuture.supplyAsync(() -> call(…), executor)` start both calls at once, on the executor you were given.',
        'Put `.exceptionally(e -> "stock unknown")` on the stock future only, then `price.thenCombine(stock, (p, s) -> p + " / " + s)`.',
        '`.completeOnTimeout("unavailable", 500, TimeUnit.MILLISECONDS)` on the combined future, then `join()`.'
      ],
      checks: [
        { label: 'combines the two answers', code: `try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    c.eq(c.call("productPage", "kettle", (Service) id -> "250", (Service) id -> "4 left", ex), "250 / 4 left");
}` },
        { label: 'the two calls are in flight at the same time', code: `var p = c.probe(2);
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    c.call("productPage", "kettle", (Service) id -> { p.meet(); return "250"; }, (Service) id -> { p.meet(); return "4"; }, ex);
}
c.ok(p.met(), "the price and stock calls ran one after the other");` },
        { label: 'both calls run on the executor given', code: `var p = c.probe(2);
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    c.call("productPage", "kettle", (Service) id -> { p.meet(); return "250"; }, (Service) id -> { p.meet(); return "4"; }, ex);
}
c.ok(p.allVirtual(), p.platformCalls() + " of the 2 calls ran off the given (virtual-thread) executor: supplyAsync without an executor uses the common pool");` },
        { label: 'a failed stock call gives "stock unknown"', code: `try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    c.eq(c.call("productPage", "kettle", (Service) id -> "250", (Service) id -> { throw new IllegalStateException("down"); }, ex), "250 / stock unknown");
}` },
        { label: 'a page not ready in 500 ms is "unavailable"', code: `var p = c.probe(1);
var ex = Executors.newVirtualThreadPerTaskExecutor();
String[] page = new String[1];
long ms = c.timed(() -> page[0] = c.call("productPage", "kettle", (Service) id -> { p.hang(); return "250"; }, (Service) id -> "4", ex));
ex.shutdownNow();
c.eq(page[0], "unavailable");
c.ok(ms < 2_000, "it took " + ms + " ms");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'juc-locks', track: 'juc', title: 'ReentrantLock, conditions and read-write locks',
    summary: 'ReentrantLock does what synchronized does, plus trying with a timeout, giving up on an interrupt, fairness and several conditions. Read-write and stamped locks let readers share.',
    keywords: ['ReentrantLock', 'Lock', 'tryLock', 'lockInterruptibly', 'Condition', 'await', 'signal', 'signalAll', 'fair lock', 'ReadWriteLock', 'ReentrantReadWriteLock', 'StampedLock', 'optimistic read', 'synchronized vs ReentrantLock'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html', docsLabel: 'Java 25 API: ReentrantLock', lab: '16-java-multithreading',
    body: [
      '## A lock you hold yourself',
      'A `ReentrantLock` is a monitor you take and release in code. Release it in `finally`, always: unlike `synchronized`, nothing does it for you if the block throws.',
      norun(`lock.lock();
try {
    // the critical section
} finally {
    lock.unlock();
}`),
      '| | `synchronized` | `ReentrantLock` |\n|---|---|---|\n| Released | automatically, at the end of the block | by you, in `finally` |\n| Try, or give up after a time | no | `tryLock()`, `tryLock(time, unit)` |\n| Give up on an interrupt | no (a `BLOCKED` thread ignores it) | `lockInterruptibly()` |\n| Fair (longest waiter first) | no | `new ReentrantLock(true)` |\n| Conditions to wait on | one per object (`wait`/`notify`) | any number (`newCondition()`) |\n| Reentrant | yes | yes (`getHoldCount()`) |',
      '## tryLock: wait a while, then do something else',
      jv(`void main() throws InterruptedException {
    var lock = new ReentrantLock();
    Thread holder = Thread.ofPlatform().start(() -> {
        lock.lock();
        try { Thread.sleep(300); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        finally { lock.unlock(); }
    });
    Thread.sleep(50);
    IO.println("got it within 20 ms: " + lock.tryLock(20, TimeUnit.MILLISECONDS));
    holder.join();
    if (lock.tryLock()) {
        try {
            IO.println("got it once it was free; fair: " + lock.isFair());
        } finally {
            lock.unlock();
        }
    }
}`),
      out(`got it within 20 ms: false
got it once it was free; fair: false`),
      '`tryLock` is the way out of the deadlock in [[lesson:th-deadlock]]: a thread that cannot get its second lock in time releases the first and tries again later.',
      '## Conditions',
      'A `Condition` is a wait set belonging to a lock: `await()` releases the lock and waits, `signal()` wakes one waiter, `signalAll()` all. Unlike a monitor, a lock can have **several**, so a bounded buffer keeps producers and consumers apart: `notFull` for producers, `notEmpty` for consumers, and a signal wakes only a thread that can go on. Wait in a `while`, as with `wait()` ([[lesson:th-wait-notify]]).',
      jv(`class Buffer {
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notEmpty = lock.newCondition();
    private final Condition notFull = lock.newCondition();
    private final ArrayDeque<String> items = new ArrayDeque<>();
    private final int capacity;
    Buffer(int capacity) { this.capacity = capacity; }

    void put(String item) throws InterruptedException {
        lock.lock();
        try {
            while (items.size() == capacity) notFull.await();
            items.addLast(item);
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    String take() throws InterruptedException {
        lock.lock();
        try {
            while (items.isEmpty()) notEmpty.await();
            String item = items.removeFirst();
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }
}

void main() throws InterruptedException {
    var buffer = new Buffer(1);
    Thread producer = Thread.ofPlatform().start(() -> {
        try {
            for (String s : List.of("a", "b", "c")) buffer.put(s);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    IO.println(buffer.take() + buffer.take() + buffer.take());
    producer.join();
}`),
      out('abc'),
      'This is how `ArrayBlockingQueue` is built. Write it once to understand it; then use the queue ([[lesson:juc-collections]]).',
      '## Readers that share',
      'A `ReentrantReadWriteLock` has a read lock many threads can hold at once and a write lock that excludes everyone (measured: with two readers in, `writeLock().tryLock()` is `false`). A `StampedLock` (Java 8) adds an **optimistic read**: read with no lock, then `validate(stamp)` says whether a write happened meanwhile, and only then read again under a real lock.',
      jv(`record Point(double x, double y) { }

final StampedLock lock = new StampedLock();
Point where = new Point(1, 2);

double distance() {
    long stamp = lock.tryOptimisticRead();
    Point p = where;
    if (!lock.validate(stamp)) {
        stamp = lock.readLock();
        try {
            p = where;
        } finally {
            lock.unlockRead(stamp);
        }
    }
    return Math.hypot(p.x(), p.y());
}

void main() {
    long w = lock.writeLock();
    try {
        where = new Point(3, 4);
    } finally {
        lock.unlockWrite(w);
    }
    IO.println("distance: " + distance());
}`),
      out('distance: 5.0'),
      'Both pay off only when reads are many and long. For a map read by many threads, `ConcurrentHashMap` is simpler and faster.',
      '## ReentrantLock or synchronized today',
      'Use `synchronized` unless you need something in the table above. The old advice "use `ReentrantLock` with virtual threads, because `synchronized` pins" was true on Java 21 to 23 and is not since Java 24 ([[lesson:vt-pinning]]).'
    ].join('\n\n'),
    work: [
      '**A scheduled job that must not overlap itself.** If a run can take longer than the interval, the next run starts while the last is still going (with a pool larger than one). `if (!lock.tryLock()) return;` at the top, and `unlock` in `finally`, makes the late run skip. Across several instances of the service that is not enough: you need a lock the instances share (a database row, ShedLock); see the Learning lab [[lab:43-distributed-locking]].',
      '**Waiting for a lock with a deadline.** A request that needs a per-customer lock should not wait for ever behind a stuck one: `tryLock(200, MILLISECONDS)` and a clear error ("try again") beats a request that hangs until the gateway times out.',
      '**Read-mostly in-memory data** (a routing table, feature flags) is usually best as an immutable object swapped whole through a `volatile` field or an `AtomicReference` ([[lesson:th-publication]]): readers take no lock at all.'
    ].join('\n\n'),
    example: {
      code: `// Remove notFull.signal() from take(): what happens to the producer? Then give the buffer room for 3.
class Buffer {
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notEmpty = lock.newCondition();
    private final Condition notFull = lock.newCondition();
    private final ArrayDeque<Integer> items = new ArrayDeque<>();
    private final int capacity;
    Buffer(int capacity) { this.capacity = capacity; }

    void put(int x) throws InterruptedException {
        lock.lock();
        try {
            while (items.size() == capacity) notFull.await();
            items.addLast(x);
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    int take() throws InterruptedException {
        lock.lock();
        try {
            while (items.isEmpty()) notEmpty.await();
            int x = items.removeFirst();
            notFull.signal();
            return x;
        } finally {
            lock.unlock();
        }
    }
}

void main() throws InterruptedException {
    var buffer = new Buffer(1);
    Thread producer = Thread.ofPlatform().daemon(true).start(() -> {
        try {
            for (int i = 1; i <= 5; i++) buffer.put(i);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    int sum = 0;
    for (int i = 0; i < 5; i++) sum += buffer.take();
    IO.println("sum " + sum);
}`
    },
    challenge: {
      title: 'A bounded buffer with two conditions',
      task: 'Write the class `Buffer(capacity)` with a `ReentrantLock` and two `Condition`s:\n\n1. `put(item)`: wait while the buffer is full, then add the item at the end.\n2. `take()`: wait while it is empty, then remove and return the first item.\n3. `offer(item, millis)`: like `put`, but wait at most `millis` for room; return `false` if there is still none, `true` once the item is in.\n\nItems come out in the order they went in. Many threads use one buffer at once.',
      starter: `class Buffer {
    private final ArrayDeque<String> items = new ArrayDeque<>();
    private final int capacity;

    Buffer(int capacity) { this.capacity = capacity; }

    void put(String item) throws InterruptedException {
        throw new UnsupportedOperationException("Not written yet");
    }

    boolean offer(String item, long millis) throws InterruptedException {
        throw new UnsupportedOperationException("Not written yet");
    }

    String take() throws InterruptedException {
        throw new UnsupportedOperationException("Not written yet");
    }
}

void main() throws InterruptedException {
    var buffer = new Buffer(2);
    buffer.put("a");
    IO.println(buffer.take());
}`,
      solution: `class Buffer {
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();
    private final ArrayDeque<String> items = new ArrayDeque<>();
    private final int capacity;

    Buffer(int capacity) { this.capacity = capacity; }

    void put(String item) throws InterruptedException {
        lock.lock();
        try {
            while (items.size() == capacity) notFull.await();
            items.addLast(item);
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    boolean offer(String item, long millis) throws InterruptedException {
        long nanos = TimeUnit.MILLISECONDS.toNanos(millis);
        lock.lock();
        try {
            while (items.size() == capacity) {
                if (nanos <= 0) return false;
                nanos = notFull.awaitNanos(nanos);
            }
            items.addLast(item);
            notEmpty.signal();
            return true;
        } finally {
            lock.unlock();
        }
    }

    String take() throws InterruptedException {
        lock.lock();
        try {
            while (items.isEmpty()) notEmpty.await();
            String item = items.removeFirst();
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }
}

void main() throws InterruptedException {
    var buffer = new Buffer(2);
    buffer.put("a");
    IO.println(buffer.take());
}`,
      hints: [
        'One `ReentrantLock`, and from it two conditions: `notFull` (producers wait on it) and `notEmpty` (consumers wait on it). Every method: `lock.lock(); try { … } finally { lock.unlock(); }`.',
        'Wait in a `while`. After adding, `notEmpty.signal()`; after removing, `notFull.signal()`.',
        'For `offer`, `notFull.awaitNanos(nanos)` waits at most that long and returns the time left: loop while full, and return `false` when none is left.'
      ],
      checks: [
        { label: 'items come out in the order they went in', code: `Object b = c.make("Buffer", 3);
for (String s : List.of("a", "b", "c")) c.callOn(b, "put", s);
c.eq(List.of(c.callOn(b, "take"), c.callOn(b, "take"), c.callOn(b, "take")), List.of("a", "b", "c"));` },
        { label: 'take() waits until an item arrives', code: `Object b = c.make("Buffer", 2);
String[] got = new String[1];
Thread taker = Thread.ofPlatform().daemon(true).start(() -> { try { got[0] = c.callOn(b, "take"); } catch (Throwable e) { got[0] = "threw " + e; } });
for (int i = 0; i < 400 && taker.getState() != Thread.State.WAITING; i++) Thread.sleep(5);
c.ok(taker.getState() == Thread.State.WAITING, "take() on an empty buffer did not wait (got " + got[0] + ")");
c.callOn(b, "put", "x");
taker.join(2_000);
c.ok(!taker.isAlive(), "the waiting take() was never woken: signal notEmpty after adding");
c.eq(got[0], "x");` },
        { label: 'put() waits while the buffer is full', code: `Object b = c.make("Buffer", 1);
c.callOn(b, "put", "first");
Thread putter = Thread.ofPlatform().daemon(true).start(() -> { try { c.callOn(b, "put", "second"); } catch (Throwable e) { } });
for (int i = 0; i < 400 && putter.getState() != Thread.State.WAITING; i++) Thread.sleep(5);
c.ok(putter.getState() == Thread.State.WAITING, "put() on a full buffer did not wait");
c.eq(c.callOn(b, "take"), "first");
putter.join(2_000);
c.ok(!putter.isAlive(), "the waiting put() was never woken: signal notFull after removing");` },
        { label: 'offer() gives up when there is no room in time', code: `Object b = c.make("Buffer", 1);
c.callOn(b, "put", "x");
var done = new AtomicReference<Object>();
Thread t = Thread.ofPlatform().daemon(true).start(() -> { try { done.set(c.callOn(b, "offer", "y", 50L)); } catch (Throwable e) { done.set(e); } });
t.join(2_000);
c.ok(!t.isAlive(), "offer(\\"y\\", 50) was still waiting after 2 s: it must give up after its time");
c.eq(done.get(), false);
c.eq(c.callOn(b, "take"), "x");` },
        { label: 'offer() succeeds when room appears in time', code: `Object b = c.make("Buffer", 1);
c.callOn(b, "put", "x");
Thread.ofPlatform().daemon(true).start(() -> { try { Thread.sleep(50); c.callOn(b, "take"); } catch (Throwable e) { } });
c.eq(c.callOn(b, "offer", "y", 2_000L), true);
c.eq(c.callOn(b, "take"), "y");` },
        { label: '4 producers and 4 consumers: 1,000 items, each taken once', code: `Object b = c.make("Buffer", 4);
var taken = new ConcurrentLinkedQueue<String>();
try (var ex = Executors.newFixedThreadPool(8)) {
    for (int p = 0; p < 4; p++) {
        int id = p;
        ex.submit(c.task(() -> { for (int i = 0; i < 250; i++) c.callOn(b, "put", id + "-" + i); }));
        ex.submit(c.task(() -> { for (int i = 0; i < 250; i++) taken.add(c.callOn(b, "take")); }));
    }
}
c.eq(new HashSet<>(taken).size(), 1_000);` },
        { label: 'it uses a ReentrantLock and its conditions', code: `c.ok(c.uses("ReentrantLock") && c.uses("newCondition"), "this one is about ReentrantLock and Condition: no synchronized, wait or notify");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'juc-atomics', track: 'juc', title: 'Atomics, CAS and LongAdder',
    summary: 'Compare-and-set changes a value only if it is still what you read: the basis of every lock-free algorithm. AtomicInteger and AtomicReference wrap it; a CAS loop retries; LongAdder counts fast under contention.',
    keywords: ['atomic', 'AtomicInteger', 'AtomicLong', 'AtomicReference', 'compareAndSet', 'cas', 'compare-and-swap', 'lock-free', 'cas loop', 'updateAndGet', 'accumulateAndGet', 'LongAdder', 'contention', 'aba', 'VarHandle'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/package-summary.html', docsLabel: 'Java 25 API: java.util.concurrent.atomic', lab: '16-java-multithreading',
    body: [
      '## Compare-and-set',
      'Processors have an instruction that sets a memory location to a new value **only if** it still holds the value you expected, and says whether it did: **compare-and-set** (CAS). No lock, no waiting: if another thread got there first, you learn it, and decide what to do.',
      jv(`void main() {
    var stock = new AtomicInteger(1);
    int seenByA = stock.get(), seenByB = stock.get();
    IO.println("A: " + stock.compareAndSet(seenByA, seenByA - 1));
    IO.println("B: " + stock.compareAndSet(seenByB, seenByB - 1) + " (it expected 1, but the stock is now " + stock.get() + ")");
}`),
      out(`A: true
B: false (it expected 1, but the stock is now 0)`),
      '## The CAS loop',
      'The pattern under every atomic: read, compute the new value, CAS; if the CAS failed, someone else changed it, so read again and retry. Nothing ever blocks, and some thread always makes progress (**lock-free**).',
      jv(`boolean reserve(AtomicInteger stock, int n) {
    while (true) {
        int current = stock.get();
        if (current < n) return false;
        if (stock.compareAndSet(current, current - n)) return true;
    }
}

void main() {
    var stock = new AtomicInteger(100);
    var sold = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 1_000; i++) executor.submit(() -> { if (reserve(stock, 1)) sold.incrementAndGet(); });
    }
    IO.println("1,000 buyers, 100 in stock: sold " + sold.get() + ", left " + stock.get());
}`),
      out('1,000 buyers, 100 in stock: sold 100, left 0'),
      '`updateAndGet(fn)` and `accumulateAndGet(x, fn)` are that loop written for you. The function may run more than once (once per retry), so it must have no side effects.',
      jv(`void main() {
    var maxLatency = new AtomicInteger();
    var hits = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int ms : List.of(120, 340, 90, 300)) {
            executor.submit(() -> {
                maxLatency.accumulateAndGet(ms, Math::max);
                hits.incrementAndGet();
            });
        }
    }
    IO.println(hits.get() + " requests, slowest " + maxLatency.get() + " ms");
}`),
      out('4 requests, slowest 340 ms'),
      '## AtomicReference: swap a whole value',
      'Hold an **immutable** object and replace it with a new one in one CAS: readers see the old value or the new, never half of each.',
      jv(`record Limits(int perSecond, int burst) { }

void main() {
    var limits = new AtomicReference<>(new Limits(10, 20));
    limits.updateAndGet(l -> new Limits(l.perSecond() * 2, l.burst()));
    IO.println(limits.get());
}`),
      out('Limits[perSecond=20, burst=20]'),
      '## LongAdder: a counter for many threads',
      'When many threads increment one `AtomicLong`, every CAS fights for the same cache line and many retry. A `LongAdder` (Java 8) keeps several cells and lets each thread add to its own; `sum()` adds them up. It is faster under contention; the price is that `sum()` is not a snapshot while others are still adding, and it has no `compareAndSet`.',
      '| | `synchronized` counter | `AtomicLong` | `LongAdder` |\n|---|---|---|---|\n| Blocks | yes | no | no |\n| Under heavy contention | threads queue for the lock | CAS retries | little contention |\n| Read | exact | exact | `sum()`: exact only when no one is adding |\n| Compare-and-set | under the lock | yes | no |',
      '## ABA, briefly',
      'CAS checks the value, not its history: if it went from A to B and back to A, your CAS succeeds as though nothing happened. For counters that is harmless; for lock-free linked structures it is a bug, which `AtomicStampedReference` (a value plus a version) prevents. Below all of these, `VarHandle` (Java 9) gives the same atomic operations on any field.'
    ].join('\n\n'),
    work: [
      '**Counters on hot paths.** A request counter, a bytes-sent total, a cache-hit counter updated by every request thread: `LongAdder`, read now and then by a metrics exporter. An `AtomicLong` for a value you also compare (an id sequence, a token bucket).',
      '**A rate limiter or a circuit breaker\'s state** is an immutable object (tokens and last refill time; CLOSED/OPEN/HALF_OPEN with counts) in an `AtomicReference`, changed with `updateAndGet`. No lock on the request path.',
      '**Optimistic locking is CAS in the database.** `UPDATE item SET stock = ?, version = version + 1 WHERE id = ? AND version = ?` succeeds only if nobody changed the row since you read it; zero rows updated means read again and retry, as a CAS loop does. See the Learning lab [[lab:10-optimistic-vs-pessimistic-locking]].'
    ].join('\n\n'),
    example: {
      code: `// Replace the CAS loop with "if (stock.get() >= 1) stock.decrementAndGet();". Run it a few times: is the stock ever negative?
boolean reserve(AtomicInteger stock, int n) {
    while (true) {
        int current = stock.get();
        if (current < n) return false;
        if (stock.compareAndSet(current, current - n)) return true;
    }
}

void main() {
    var stock = new AtomicInteger(100);
    var sold = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 10_000; i++) executor.submit(() -> { if (reserve(stock, 1)) sold.incrementAndGet(); });
    }
    IO.println("sold " + sold.get() + ", left " + stock.get());
}`
    },
    challenge: {
      title: 'Reserve stock without a lock',
      task: 'Two methods, both called by many threads at once, **without any lock**:\n\n1. `reserve(stock, n)`: if at least `n` are left, take `n` and return `true`; otherwise return `false` and change nothing. The `Stock` offers only `get()` and `compareAndSet(expected, next)`: write the CAS loop yourself.\n2. `peak(max, value)`: record `value` in `max` if it is larger than what is there, atomically, and return the maximum so far.\n\nThe checks hand you a stock whose `get()` waits for a second thread to read too, if one can.',
      files: [{ name: 'Stock.java', code: `/** A stock count changed only by compare-and-set, like an AtomicInteger or a versioned row. */
public interface Stock {
    int get();

    /** Sets next only if the count is still expected; says whether it did. */
    boolean compareAndSet(int expected, int next);
}
` }],
      starter: `// If at least n are left, take n and return true; otherwise false. No locks: a compare-and-set loop.
boolean reserve(Stock stock, int n) {
    int current = stock.get();
    if (current < n) return false;
    stock.compareAndSet(current, current - n);
    return true;
}

// Record value in max if it is larger, atomically; return the maximum so far.
int peak(AtomicInteger max, int value) {
    throw new UnsupportedOperationException("Not written yet");
}

void main() {
}`,
      solution: `boolean reserve(Stock stock, int n) {
    while (true) {
        int current = stock.get();
        if (current < n) return false;
        if (stock.compareAndSet(current, current - n)) return true;
    }
}

int peak(AtomicInteger max, int value) {
    return max.accumulateAndGet(value, Math::max);
}

void main() {
}`,
      hints: [
        'Read the count, decide, then `compareAndSet(current, current - n)`. If it returns `false`, another thread changed the count after you read it: read again, in a loop.',
        'The loop ends in two ways: not enough left (`return false`), or a CAS that succeeded (`return true`).',
        '`max.accumulateAndGet(value, Math::max)` is the CAS loop for "the larger of the two", written for you.'
      ],
      checks: [
        { label: 'reserve takes what is asked while there is enough', code: `var a = new AtomicInteger(5);
Stock s = new Stock() { public int get() { return a.get(); } public boolean compareAndSet(int e, int n) { return a.compareAndSet(e, n); } };
c.eq(c.call("reserve", s, 3), true);
c.eq(c.call("reserve", s, 3), false);
c.eq(a.get(), 2);` },
        { label: 'two buyers for the last item at once: exactly one gets it', code: `var p = c.probe(2, 300);
var a = new AtomicInteger(1);
Stock s = new Stock() {
    public int get() { int v = a.get(); try { p.meet(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } return v; }
    public boolean compareAndSet(int e, int n) { return a.compareAndSet(e, n); }
};
boolean x, y;
try (var ex = Executors.newFixedThreadPool(2)) {
    var f1 = ex.submit(c.<Boolean>callable("reserve", s, 1));
    var f2 = ex.submit(c.<Boolean>callable("reserve", s, 1));
    x = f1.get();
    y = f2.get();
}
c.ok(!(x && y), "both buyers got the last item (stock now " + a.get() + "): only the CAS may decide who wins");
c.eq(a.get(), 0);` },
        { label: 'a buyer whose CAS lost tries again', code: `var p = c.probe(2, 300);
var a = new AtomicInteger(2);
Stock s = new Stock() {
    public int get() { int v = a.get(); try { p.meet(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } return v; }
    public boolean compareAndSet(int e, int n) { return a.compareAndSet(e, n); }
};
boolean x, y;
try (var ex = Executors.newFixedThreadPool(2)) {
    var f1 = ex.submit(c.<Boolean>callable("reserve", s, 1));
    var f2 = ex.submit(c.<Boolean>callable("reserve", s, 1));
    x = f1.get();
    y = f2.get();
}
c.ok(x && y, "two in stock, two buyers, but one was refused: when the CAS fails, read again and retry");
c.eq(a.get(), 0);` },
        { label: 'no lock is used', code: `c.ok(!c.uses("synchronized|ReentrantLock|[.]lock[(]"), "this one is about compare-and-set: no synchronized and no Lock");` },
        { label: 'peak keeps the maximum, also from 8 threads at once', code: `var max = new AtomicInteger(Integer.MIN_VALUE);
c.eq(List.of(c.call("peak", max, 5), c.call("peak", max, 9), c.call("peak", max, 3)), List.of(5, 9, 9));
var many = new AtomicInteger(Integer.MIN_VALUE);
try (var ex = Executors.newFixedThreadPool(8)) {
    for (int t = 0; t < 8; t++) {
        int base = t * 1_000;
        ex.submit(c.task(() -> { for (int i = 0; i < 1_000; i++) c.call("peak", many, base + i); }));
    }
}
c.eq(many.get(), 7_999);` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 6 */
  L.push({
    id: 'juc-collections', track: 'juc', title: 'Concurrent collections',
    summary: 'ConcurrentHashMap and its atomic per-key methods (merge, compute, computeIfAbsent), copy-on-write lists for read-mostly data, and blocking queues for producers and consumers. And why get-then-put is a race even on a concurrent map.',
    keywords: ['ConcurrentHashMap', 'computeIfAbsent', 'merge', 'compute', 'putIfAbsent', 'CopyOnWriteArrayList', 'BlockingQueue', 'ArrayBlockingQueue', 'LinkedBlockingQueue', 'SynchronousQueue', 'ConcurrentLinkedQueue', 'ConcurrentSkipListMap', 'ConcurrentModificationException', 'weakly consistent', 'cache', 'synchronizedMap', 'HashMap thread safety'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html', docsLabel: 'Java 25 API: ConcurrentHashMap', lab: '16-java-multithreading',
    body: [
      '## Why not a HashMap',
      'A `HashMap` written by two threads at once can lose entries, and its iterator fails fast if the map changes under it, even in one thread:',
      jv(`void main() {
    Map<String, Integer> map = new HashMap<>(Map.of("a", 1, "b", 2));
    try {
        for (String k : map.keySet()) map.put(k + k, 0);
    } catch (ConcurrentModificationException e) {
        IO.println("HashMap: " + e.getClass().getSimpleName());
    }
    var concurrent = new ConcurrentHashMap<>(Map.of("a", 1, "b", 2));
    for (String k : concurrent.keySet()) if (k.length() == 1) concurrent.put(k + k, 0);
    IO.println("ConcurrentHashMap: no exception, " + concurrent.size() + " keys");
}`),
      out(`HashMap: ConcurrentModificationException
ConcurrentHashMap: no exception, 4 keys`),
      '`Collections.synchronizedMap` locks the whole map on every call (and you must lock it to iterate). `ConcurrentHashMap` reads without locking, locks only one bin for a write, and iterates **weakly consistently**: it never throws, and may or may not show changes made while it runs. It refuses `null` keys and values (`NullPointerException`), because `get` returning `null` must mean "absent".',
      '## One atomic step per key',
      'Each `ConcurrentHashMap` call is thread-safe, but two calls in a row are a check-then-act ([[lesson:th-races]]): `map.put(k, map.get(k) + 1)` loses counts. Its per-key methods do read, compute and write as **one** step:',
      '| Instead of | Write | It does, atomically |\n|---|---|---|\n| `put(k, get(k) + 1)` | `merge(k, 1, Integer::sum)` | add one, or put 1 if absent |\n| `if (!containsKey(k)) put(k, v)` | `putIfAbsent(k, v)` | put only if absent |\n| `if (get(k) == null) put(k, load(k))` | `computeIfAbsent(k, key -> load(key))` | load once, however many threads ask |\n| `put(k, f(get(k)))` | `compute(k, (key, old) -> f(old))` | replace using the old value |',
      jv(`void main() {
    var loads = new AtomicInteger();
    var cache = new ConcurrentHashMap<String, String>();
    var counts = new ConcurrentHashMap<String, Integer>();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 50; i++) {
            executor.submit(() -> {
                cache.computeIfAbsent("config", k -> { loads.incrementAndGet(); return "loaded"; });
                counts.merge("hits", 1, Integer::sum);
            });
        }
    }
    IO.println("50 threads: loaded " + loads.get() + " time, hits " + counts.get("hits"));
}`),
      out('50 threads: loaded 1 time, hits 50'),
      'The function inside `computeIfAbsent` or `compute` runs while the key\'s bin is locked: keep it short, and never let it change the same map (measured: a recursive `computeIfAbsent` throws `IllegalStateException: Recursive update`).',
      '## Copy-on-write',
      'A `CopyOnWriteArrayList` copies its whole array on every change, so an iterator reads a snapshot: never a `ConcurrentModificationException`, never a lock for readers. Ideal for listeners and configuration (read all the time, changed rarely); terrible for a list written often.',
      jv(`void main() {
    var listeners = new CopyOnWriteArrayList<>(List.of("audit", "metrics"));
    for (String l : listeners) listeners.add(l + "-backup");
    IO.println(listeners);
}`),
      out('[audit, metrics, audit-backup, metrics-backup]'),
      '## Blocking queues',
      'The hand-off between producers and consumers. `put` waits while the queue is full and `take` while it is empty, so a bounded queue is back pressure ([[lesson:th-wait-notify]] shows the idea underneath).',
      '| Queue | Bound | Notes |\n|---|---|---|\n| `ArrayBlockingQueue` | fixed, required | one lock; the usual bounded choice |\n| `LinkedBlockingQueue` | optional (default `Integer.MAX_VALUE`) | `newFixedThreadPool`\'s queue: unbounded |\n| `SynchronousQueue` | none: no room at all | `offer` with no taker waiting returns `false` (measured) |\n| `PriorityBlockingQueue` | unbounded | takes in priority order |\n| `DelayQueue` | unbounded | an item can be taken only after its delay |\n| `LinkedTransferQueue` | unbounded | `transfer` waits until a consumer took it |',
      'And the four ways to add to a full queue: `add` throws (`IllegalStateException: Queue full`), `offer` returns `false`, `offer(x, time, unit)` waits that long, `put` waits for ever ([[ref:blocking-queue-offer]]). For items handed over without waiting, `ConcurrentLinkedQueue` is lock-free and unbounded; for a sorted map, `ConcurrentSkipListMap`.'
    ].join('\n\n'),
    work: [
      '**The local cache.** `ConcurrentHashMap.computeIfAbsent` is the simplest thread-safe memoiser: each key is loaded once even when a burst of requests misses at the same moment (the stampede a `get`-then-`put` cache suffers). Its limits: no expiry, no size bound, and a slow load blocks other keys in the same bin. For a real cache, Caffeine (whose `get(key, loader)` has the same once-per-key guarantee) or Spring\'s cache abstraction on top of one.',
      '**Producer and consumers.** A message poll loop handing records to worker threads through a bounded `ArrayBlockingQueue`: when the workers fall behind, `put` blocks the poller, so it stops fetching instead of filling the heap.',
      '**The `HashMap` in a singleton bean.** Found in code review more often than any other race: a `private final Map<…> cache = new HashMap<>()` in a `@Service`, filled lazily by request threads. Make it a `ConcurrentHashMap`, and replace each `get`/`put` pair with one of the atomic methods.'
    ].join('\n\n'),
    example: {
      code: `// Replace merge with "counts.put(w, counts.getOrDefault(w, 0) + 1)". Run it a few times: do the counts still add up?
void main() {
    var counts = new ConcurrentHashMap<String, Integer>();
    List<String> words = new ArrayList<>();
    for (int i = 0; i < 10_000; i++) words.add(i % 3 == 0 ? "tea" : "cake");
    try (var executor = Executors.newFixedThreadPool(8)) {
        for (String w : words) executor.submit(() -> counts.merge(w, 1, Integer::sum));
    }
    IO.println(new TreeMap<>(counts) + ", total " + counts.values().stream().mapToInt(Integer::intValue).sum());
}`
    },
    challenge: {
      title: 'Counts and loads that survive a burst',
      task: 'Two methods on a `ConcurrentHashMap` that many threads use at once:\n\n1. `count(counts, word)`: add one to the word\'s count (1 if it is new).\n2. `load(cache, key, service)`: return the cached value for the key, or fetch it with `service.fetch(key)`, store it and return it, **fetching each key only once** however many threads ask for it together.\n\nThe checks hand you a map whose `get` waits for a second thread to look too, if one can: a `get` then a `put` loses.',
      files: [SERVICE],
      starter: `// Add one to the word's count, safely when many threads count at once.
void count(Map<String, Integer> counts, String word) {
    counts.put(word, counts.getOrDefault(word, 0) + 1);
}

// The cached value, or fetch it once (however many threads ask together), store it and return it.
String load(Map<String, String> cache, String key, Service service) throws InterruptedException {
    String hit = cache.get(key);
    if (hit != null) return hit;
    String loaded = service.fetch(key);
    cache.put(key, loaded);
    return loaded;
}

void main() {
}`,
      solution: `void count(Map<String, Integer> counts, String word) {
    counts.merge(word, 1, Integer::sum);
}

String load(Map<String, String> cache, String key, Service service) {
    return cache.computeIfAbsent(key, k -> {
        try {
            return service.fetch(k);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    });
}

void main() {
}`,
      hints: [
        'A `get` and then a `put` are two steps another thread can come between. `ConcurrentHashMap` has methods that read, compute and write as one.',
        '`counts.merge(word, 1, Integer::sum)` puts 1 for a new word, or adds 1 to the old count.',
        '`cache.computeIfAbsent(key, k -> …)` runs the loader once per key; threads asking for the same key meanwhile wait for it. `fetch` throws a checked exception, so catch it inside the lambda.'
      ],
      checks: [
        { label: 'count adds up', code: `var counts = new ConcurrentHashMap<String, Integer>();
for (String w : List.of("tea", "cake", "tea")) c.call("count", counts, w);
c.eq(new TreeMap<>(counts), new TreeMap<>(Map.of("tea", 2, "cake", 1)));` },
        { label: 'two threads counting the same word at once: both counts kept', code: `var p = c.probe(2, 300);
var counts = new ConcurrentHashMap<String, Integer>() {
    @Override public Integer get(Object k) { Integer v = super.get(k); try { p.meet(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } return v; }
};
try (var ex = Executors.newFixedThreadPool(2)) {
    var a = ex.submit(c.callable("count", counts, "tea"));
    var b = ex.submit(c.callable("count", counts, "tea"));
    a.get();
    b.get();
}
c.ok(Integer.valueOf(2).equals(counts.get("tea")), "two counts at once gave " + counts.get("tea") + ": both read the old count, then both wrote; use merge");` },
        { label: 'load fetches a missing key, and serves it from the cache after', code: `var cache = new ConcurrentHashMap<String, String>();
var fetches = new AtomicInteger();
Service s = id -> { fetches.incrementAndGet(); return "value of " + id; };
c.eq(c.call("load", cache, "k", s), "value of k");
c.eq(c.call("load", cache, "k", s), "value of k");
c.eq(fetches.get(), 1);` },
        { label: 'two threads loading the same key at once fetch it once', code: `var p = c.probe(2, 300);
var cache = new ConcurrentHashMap<String, String>() {
    @Override public String get(Object k) { String v = super.get(k); try { p.meet(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } return v; }
};
var fetches = new AtomicInteger();
Service s = id -> { fetches.incrementAndGet(); Thread.sleep(50); return "v"; };
try (var ex = Executors.newFixedThreadPool(2)) {
    var a = ex.submit(c.callable("load", cache, "k", s));
    var b = ex.submit(c.callable("load", cache, "k", s));
    c.eq(List.of(a.get(), b.get()), List.of("v", "v"));
}
c.ok(fetches.get() == 1, "the key was fetched " + fetches.get() + " times: both threads missed, then both fetched; use computeIfAbsent");` },
        { label: '50 threads asking for one key fetch it once', code: `var cache = new ConcurrentHashMap<String, String>();
var fetches = new AtomicInteger();
Service s = id -> { fetches.incrementAndGet(); Thread.sleep(20); return "v"; };
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 50; i++) ex.submit(c.callable("load", cache, "config", s));
}
c.eq(fetches.get(), 1);` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 7 */
  L.push({
    id: 'juc-synchronizers', track: 'juc', title: 'CountDownLatch, CyclicBarrier and Semaphore',
    summary: 'Objects whose only job is to make threads wait for each other: a CountDownLatch opens once, a CyclicBarrier meets in rounds, a Semaphore hands out permits, and a Phaser does all three with parties that come and go.',
    keywords: ['CountDownLatch', 'CyclicBarrier', 'Semaphore', 'Phaser', 'Exchanger', 'synchronizer', 'start gate', 'barrier', 'permits', 'BrokenBarrierException', 'rounds', 'countDown', 'await'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/package-summary.html', docsLabel: 'Java 25 API: java.util.concurrent', lab: '16-java-multithreading',
    body: [
      '## CountDownLatch: a gate that opens once',
      '`await()` waits until `countDown()` has been called `count` times; then the latch is open for good. Two classic uses: a **start gate** (count 1) so that many threads begin at the same moment, and a **done gate** (count n) to wait for n workers.',
      jv(`void main() throws InterruptedException {
    var start = new CountDownLatch(1);
    var done = new CountDownLatch(3);
    var ran = new AtomicInteger();
    for (int i = 0; i < 3; i++) {
        Thread.ofVirtual().start(() -> {
            try {
                start.await();
                ran.incrementAndGet();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                done.countDown();
            }
        });
    }
    IO.println("before the gate opens: " + ran.get());
    start.countDown();
    done.await();
    IO.println("after all three are done: " + ran.get());
}`),
      out(`before the gate opens: 0
after all three are done: 3`),
      '## CyclicBarrier: meet, round after round',
      'A fixed number of threads each call `await()`; the last to arrive runs the **barrier action**, and all go on together. Then the barrier is ready for the next round. If one waiter is interrupted or times out, the barrier **breaks** for all: the others get `BrokenBarrierException` until someone calls `reset()` (measured).',
      jv(`void main() {
    List<String> log = Collections.synchronizedList(new ArrayList<>());
    var barrier = new CyclicBarrier(3, () -> log.add("round done"));
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int w = 0; w < 3; w++) {
            executor.submit(() -> {
                for (int round = 0; round < 2; round++) barrier.await();
                return null;
            });
        }
    }
    IO.println(log);
}`),
      out('[round done, round done]'),
      '## Semaphore: a number of permits',
      '`acquire()` takes a permit, waiting if none is left; `release()` returns one. At most n threads in a section at once: the tool for limiting calls to a scarce resource ([[lesson:vt-limit]]). A semaphore does not know who holds a permit: `release()` from any thread adds one, even one never taken (measured: releasing 3 after taking 2 leaves 3). Release in `finally`, exactly once.',
      jv(`void main() {
    var permits = new Semaphore(3);
    var now = new AtomicInteger();
    var peak = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 20; i++) {
            executor.submit(() -> {
                permits.acquire();
                try {
                    peak.accumulateAndGet(now.incrementAndGet(), Math::max);
                    Thread.sleep(20);
                    now.decrementAndGet();
                } finally {
                    permits.release();
                }
                return null;
            });
        }
    }
    IO.println("20 tasks, at most " + peak.get() + " at once");
}`),
      out('20 tasks, at most 3 at once'),
      '## Phaser and Exchanger',
      'A `Phaser` (Java 7) is a barrier whose parties can **register** and **deregister** between phases, so the number of threads can change; `arriveAndAwaitAdvance()` is `await()`. An `Exchanger` lets two threads swap objects at a meeting point. Both are rarer; see the Reference ([[ref:phaser]], [[ref:exchanger]]).',
      '| Tool | Waits for | Reusable | Typical use |\n|---|---|---|---|\n| `CountDownLatch` | a count to reach zero | no | start gate; wait for n workers or n services to be ready |\n| `CyclicBarrier` | n threads to arrive | yes, every round | simulations, phased computations in steps |\n| `Semaphore` | a permit to be free | yes | at most n at once (a bulkhead) |\n| `Phaser` | the registered parties | yes, with changing parties | rounds where workers join and leave |\n| `Exchanger` | the other thread | yes | swapping a full buffer for an empty one |'
    ].join('\n\n'),
    work: [
      '**Tests that hit the race on purpose.** A start gate (`CountDownLatch(1)`) releases 50 threads at the same moment against an endpoint or a service method, the way production traffic does; a done gate waits for them. Several checks in this tool are built on the same idea.',
      '**Waiting for start-up.** A service that must not take traffic until its caches are warm and its connections are open counts a latch down as each one is ready, and its readiness check reports `latch.getCount() == 0`.',
      '**A bulkhead is a semaphore.** At most 20 concurrent calls to a fragile partner API, and a fast "busy" for the 21st (`tryAcquire` with a short timeout): Resilience4j\'s `SemaphoreBulkhead` is this, with metrics. With virtual threads it is the right shape of limit, since there is no pool size to lean on.'
    ].join('\n\n'),
    example: {
      code: `// Interrupt one of the waiters: what do the other two see? Then call reset().
void main() throws InterruptedException {
    var barrier = new CyclicBarrier(3, () -> IO.println("all three arrived"));
    List<Thread> threads = new ArrayList<>();
    for (int i = 0; i < 3; i++) {
        int n = i;
        threads.add(Thread.ofPlatform().start(() -> {
            try {
                Thread.sleep(100L * n);
                barrier.await();
                IO.println("worker " + n + " goes on");
            } catch (InterruptedException | BrokenBarrierException e) {
                IO.println("worker " + n + ": " + e.getClass().getSimpleName());
            }
        }));
    }
    for (Thread t : threads) t.join();
}`
    },
    challenge: {
      title: 'Workers in rounds',
      task: 'Write `inRounds(workers, rounds, service)`: each worker runs on a thread of its own and, for each round `r` from 0, calls `service.fetch(worker + ":" + r)`. **No worker may start round r + 1 until every worker has finished round r.** Return only when every worker has finished every round.\n\nThe checks give one worker slow calls: without a barrier, the others run ahead.',
      files: [SERVICE],
      starter: `// Each worker on its own thread calls service.fetch(worker + ":" + r) for r = 0, 1, ...
// Nobody starts round r + 1 before everyone has finished round r. Return when all is done.
void inRounds(List<String> workers, int rounds, Service service) throws InterruptedException {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (String w : workers) {
            executor.submit(() -> {
                for (int r = 0; r < rounds; r++) {
                    service.fetch(w + ":" + r);
                }
                return null;
            });
        }
    }
}

void main() throws InterruptedException {
    inRounds(List.of("a", "b"), 2, id -> { IO.println(id); return id; });
}`,
      solution: `void inRounds(List<String> workers, int rounds, Service service) throws InterruptedException {
    var barrier = new CyclicBarrier(workers.size());
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (String w : workers) {
            executor.submit(() -> {
                for (int r = 0; r < rounds; r++) {
                    service.fetch(w + ":" + r);
                    barrier.await();
                }
                return null;
            });
        }
    }
}

void main() throws InterruptedException {
    inRounds(List.of("a", "b"), 2, id -> { IO.println(id); return id; });
}`,
      hints: [
        'The starter already runs each worker on a thread of its own. What is missing is the meeting at the end of each round.',
        '`new CyclicBarrier(workers.size())`, and `barrier.await()` after each round\'s call: the last worker to arrive lets all of them go on, and the barrier is ready for the next round.',
        'The executor\'s `close()` at the end of the `try` waits for every worker, so `inRounds` returns only when all is done.'
      ],
      checks: [
        { label: 'every worker does every round', code: `var log = new ConcurrentLinkedQueue<String>();
c.call("inRounds", List.of("a", "b", "c"), 2, (Service) id -> { log.add(id); return id; });
c.eq(new TreeSet<>(log), new TreeSet<>(List.of("a:0", "a:1", "b:0", "b:1", "c:0", "c:1")));` },
        { label: 'nobody starts a round before everyone finished the last one', code: `var log = Collections.synchronizedList(new ArrayList<String>());
c.call("inRounds", List.of("slow", "b", "c"), 3, (Service) id -> { if (id.startsWith("slow")) Thread.sleep(100); log.add(id); return id; });
List<Integer> rounds = log.stream().map(e -> Integer.parseInt(e.substring(e.indexOf(':') + 1))).toList();
List<Integer> sorted = rounds.stream().sorted().toList();
c.ok(rounds.equals(sorted), "the calls ended in this order: " + log + ": fast workers ran ahead of the slow one; meet at a barrier after each round");` },
        { label: 'the workers of a round run at the same time, each on its own thread', code: `var p = c.probe(3);
c.call("inRounds", List.of("a", "b", "c"), 1, (Service) id -> { p.meet(); return id; });
c.ok(p.met(), "at most " + p.peak() + " of the 3 workers were in flight at once");` },
        { label: 'inRounds returns only when every round of every worker is done', code: `var p = c.probe(2);
c.call("inRounds", List.of("a", "b"), 2, (Service) id -> { p.sleep(50); return id; });
c.eq(p.finished(), 4);` },
        { label: 'zero rounds call nothing', code: `var calls = new AtomicInteger();
c.call("inRounds", List.of("a", "b"), 0, (Service) id -> { calls.incrementAndGet(); return id; });
c.eq(calls.get(), 0);` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 8 */
  L.push({
    id: 'juc-forkjoin', track: 'juc', title: 'Fork/join and parallel streams',
    summary: 'Splitting one computation across the processors: a RecursiveTask splits itself, a ForkJoinPool runs the pieces with work stealing, and a parallel stream does both for you, on a pool shared by the whole JVM.',
    keywords: ['fork/join', 'forkjoin', 'ForkJoinPool', 'RecursiveTask', 'RecursiveAction', 'fork', 'join', 'work stealing', 'common pool', 'parallel stream', 'parallelStream', 'divide and conquer', 'forEachOrdered', 'reduce identity'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ForkJoinPool.html', docsLabel: 'Java 25 API: ForkJoinPool', lab: '16-java-multithreading',
    body: [
      '## Divide and conquer',
      'Some work splits naturally: summing an array is summing two halves. A `RecursiveTask<V>` (Java 7) does a small piece directly and splits a big one: `fork()` one half (it may run on another thread), compute the other half itself, then `join()` the first.',
      jv(`class Sum extends RecursiveTask<Long> {
    static final AtomicInteger made = new AtomicInteger();
    final long[] a;
    final int lo, hi;

    Sum(long[] a, int lo, int hi) {
        this.a = a;
        this.lo = lo;
        this.hi = hi;
        made.incrementAndGet();
    }

    protected Long compute() {
        if (hi - lo <= 1_000) {
            long s = 0;
            for (int i = lo; i < hi; i++) s += a[i];
            return s;
        }
        int mid = (lo + hi) >>> 1;
        Sum left = new Sum(a, lo, mid);
        left.fork();
        return new Sum(a, mid, hi).compute() + left.join();
    }
}

void main() {
    long[] numbers = LongStream.range(0, 100_000).toArray();
    try (var pool = new ForkJoinPool(4)) {
        IO.println("sum " + pool.invoke(new Sum(numbers, 0, numbers.length)) + ", in " + Sum.made.get() + " tasks");
    }
}`),
      out('sum 4999950000, in 255 tasks'),
      'The threshold (1,000 here) trades the cost of a task against the gain of splitting: too small and you make millions of tiny tasks, too big and some processors sit idle.',
      '## Work stealing',
      'Each worker of a `ForkJoinPool` keeps its own double-ended queue. It pushes the tasks it forks and pops the newest; an idle worker **steals** the oldest from another\'s queue, which is the biggest piece left. So the pool balances itself without a central queue to fight over.',
      '## The common pool',
      '`ForkJoinPool.commonPool()` is shared by the whole JVM: parallel streams and `CompletableFuture`\'s `…Async` methods without an executor run on it. Its parallelism is the number of processors **less one** (here 15 of 16), because the thread that started the work helps.',
      '## Parallel streams',
      '`.parallel()` (or `parallelStream()`) splits a stream\'s work over the common pool and the calling thread (measured: the threads were `ForkJoinPool.commonPool-worker-N` and `main`). What stays safe and what does not:',
      jv(`void main() {
    List<Integer> order = Collections.synchronizedList(new ArrayList<>());
    IntStream.rangeClosed(1, 8).parallel().forEachOrdered(order::add);
    IO.println("forEachOrdered: " + order);
    IO.println("toList: " + IntStream.rangeClosed(1, 8).parallel().map(i -> i * 10).boxed().toList());
    IO.println("reduce(10, sum), sequential: " + IntStream.rangeClosed(1, 4).reduce(10, Integer::sum));
    IO.println("reduce(10, sum), parallel:   " + IntStream.rangeClosed(1, 4).parallel().reduce(10, Integer::sum));
}`),
      out(`forEachOrdered: [1, 2, 3, 4, 5, 6, 7, 8]
toList: [10, 20, 30, 40, 50, 60, 70, 80]
reduce(10, sum), sequential: 20
reduce(10, sum), parallel:   50`),
      'The identity of `reduce` is added once **per piece**, so it must be a true identity (0 for a sum). `forEach` runs in any order; `forEachOrdered` and `toList()` keep it. And a side effect into an ordinary collection, `forEach(list::add)`, is a race: measured, `ArrayList::add` from a parallel stream lost elements or threw in 5 runs of 5. Collect instead.',
      '| A parallel stream helps when | It hurts when |\n|---|---|\n| the data is large (many thousands of elements) | the data is small: splitting costs more than it saves |\n| each element costs real CPU | the work is I/O or blocking: it ties up the shared pool |\n| the source splits well (arrays, `ArrayList`, ranges) | the source does not (`LinkedList`, `Stream.iterate`, I/O) |\n| the steps are independent and side-effect free | the steps share mutable state |',
      'A trick seen in the wild: run the stream inside `customPool.submit(() -> list.parallelStream()…).get()` and it uses that pool instead of the common one (measured: `ForkJoinPool-2-worker-N`). It works, but depends on an implementation detail; for blocking calls in a stream, `Gatherers.mapConcurrent` ([[lesson:sv-map-concurrent]]).'
    ].join('\n\n'),
    work: [
      '**A parallel stream in a request handler shares the JVM\'s pool with every other request.** One user\'s big export can take all the common pool\'s workers, and every other parallel stream (and every `supplyAsync` without an executor) waits. For CPU-heavy work in a service, use a dedicated pool sized to the processors, and say how many requests may use it at once ([[lesson:vt-cpu-bound]]).',
      '**Measure before you parallelise.** For the collections a web request handles (tens or hundreds of items), a parallel stream is usually slower than a sequential one. It pays in batch work: scoring a million rows, resizing a folder of images, building a report.',
      '**Blocking in a parallel stream** (an HTTP call per element) is the commonest misuse; the ⚠ in the margin flags it. Use `mapConcurrent` on virtual threads, with a limit.'
    ].join('\n\n'),
    example: {
      code: `// Change the threshold to 10, then to 100_000: how many tasks, and does the sum change?
class Sum extends RecursiveTask<Long> {
    static final int THRESHOLD = 1_000;
    static final AtomicInteger made = new AtomicInteger();
    final long[] a;
    final int lo, hi;

    Sum(long[] a, int lo, int hi) { this.a = a; this.lo = lo; this.hi = hi; made.incrementAndGet(); }

    protected Long compute() {
        if (hi - lo <= THRESHOLD) {
            long s = 0;
            for (int i = lo; i < hi; i++) s += a[i];
            return s;
        }
        int mid = (lo + hi) >>> 1;
        Sum left = new Sum(a, lo, mid);
        left.fork();
        return new Sum(a, mid, hi).compute() + left.join();
    }
}

void main() {
    long[] numbers = LongStream.rangeClosed(1, 1_000_000).toArray();
    try (var pool = new ForkJoinPool()) {
        IO.println("sum " + pool.invoke(new Sum(numbers, 0, numbers.length)) + " in " + Sum.made.get() + " tasks");
    }
}`
    },
    challenge: {
      title: 'Sum it the fork/join way',
      task: 'Two ways to use every processor:\n\n1. The class `SumTask(a, lo, hi)`, a `RecursiveTask<Long>` that sums `a[lo]` to `a[hi - 1]`: a piece of at most 1,000 numbers directly, a bigger one by splitting it in two, forking one half and computing the other. `parallelSum(a)` runs it on a `ForkJoinPool` for the whole array.\n2. `sumOfSquares(xs)`: the sum of the squares of the numbers, with a **parallel stream**. The numbers can be as large as 100,000, whose square does not fit in an `int`.',
      starter: `class SumTask extends RecursiveTask<Long> {
    final long[] a;
    final int lo, hi;

    SumTask(long[] a, int lo, int hi) {
        this.a = a;
        this.lo = lo;
        this.hi = hi;
    }

    @Override
    protected Long compute() {
        throw new UnsupportedOperationException("Not written yet");
    }
}

long parallelSum(long[] a) {
    long sum = 0;
    for (long x : a) sum += x;
    return sum;
}

long sumOfSquares(List<Integer> xs) {
    long sum = 0;
    for (int x : xs) sum += (long) x * x;
    return sum;
}

void main() {
    IO.println(parallelSum(LongStream.rangeClosed(1, 100_000).toArray()));
}`,
      solution: `class SumTask extends RecursiveTask<Long> {
    static final int THRESHOLD = 1_000;
    final long[] a;
    final int lo, hi;

    SumTask(long[] a, int lo, int hi) {
        this.a = a;
        this.lo = lo;
        this.hi = hi;
    }

    @Override
    protected Long compute() {
        if (hi - lo <= THRESHOLD) {
            long sum = 0;
            for (int i = lo; i < hi; i++) sum += a[i];
            return sum;
        }
        int mid = (lo + hi) >>> 1;
        SumTask left = new SumTask(a, lo, mid);
        left.fork();
        long right = new SumTask(a, mid, hi).compute();
        return right + left.join();
    }
}

long parallelSum(long[] a) {
    try (var pool = new ForkJoinPool()) {
        return pool.invoke(new SumTask(a, 0, a.length));
    }
}

long sumOfSquares(List<Integer> xs) {
    return xs.parallelStream().mapToLong(x -> (long) x * x).sum();
}

void main() {
    IO.println(parallelSum(LongStream.rangeClosed(1, 100_000).toArray()));
}`,
      hints: [
        'In `compute()`: if `hi - lo <= 1_000`, add up `a[lo]` to `a[hi - 1]` in a loop. Otherwise `int mid = (lo + hi) >>> 1;` and make two `SumTask`s, `[lo, mid)` and `[mid, hi)`.',
        '`left.fork()`, then compute the right half yourself (`right.compute()`), then `left.join()`: that keeps this thread busy while another may steal the left half. `pool.invoke(new SumTask(a, 0, a.length))` runs the whole thing.',
        'For the squares: `xs.parallelStream().mapToLong(x -> (long) x * x).sum()`. Without the cast, `x * x` is an `int` multiplication and overflows past 46,340.'
      ],
      checks: [
        { label: 'parallelSum of 1 to 100,000 is 5,000,050,000', code: `c.eq(c.call("parallelSum", java.util.stream.LongStream.rangeClosed(1, 100_000).toArray()), 5_000_050_000L);` },
        { label: 'small and empty arrays are summed right', code: `c.eq(c.call("parallelSum", new long[] {4, 5, 6}), 15L);
c.eq(c.call("parallelSum", new long[0]), 0L);
c.eq(c.call("parallelSum", java.util.stream.LongStream.rangeClosed(1, 1_001).toArray()), 501_501L);` },
        { label: 'SumTask is a RecursiveTask that forks', code: `c.ok(c.make("SumTask", new long[0], 0, 0) instanceof RecursiveTask, "SumTask must extend RecursiveTask<Long>");
c.ok(c.uses("[.]fork[(]"), "SumTask never forks: split a big piece and fork() one half");` },
        { label: 'sumOfSquares is right, also for numbers whose square overflows an int', code: `c.eq(c.call("sumOfSquares", List.of(1, 2, 3)), 14L);
c.eq(c.call("sumOfSquares", List.of(100_000, 3)), 10_000_000_009L);` },
        { label: 'sumOfSquares uses a parallel stream', code: `c.ok(c.uses("parallelStream[(]|[.]parallel[(]"), "sumOfSquares is a plain loop or a sequential stream: use parallelStream()");` }
      ]
    }
  });
})(window.JCLT);
