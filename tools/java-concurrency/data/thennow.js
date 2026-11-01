/*
 * data/thennow.js - Then <-> now (#/then-now, js/views/thennow.js, batch 3): what concurrent Java code
 * does every day, written the way it was before Java 21 and the way Java 21 to 25 lets you write it.
 *
 * Topic shape: {id, title}
 * Pair shape: {id, topic, title, keywords, then (a whole program: a class Main with public static void
 *   main, no Java 21 to 25 API), now (a whole Java 25 compact source file: void main() at the top),
 *   output (exactly what BOTH print), since (the release the new side needs: '19', '21', '24' or '25'),
 *   preview (true when the new side uses a preview API of Java 25), note (Markdown), stdin?}
 *
 * tests/check_data.py checks the shape (and that `preview` matches the new side's APIs);
 * tests/test_content.py runs both sides on this PC's JDK 25, twice each, and each must print exactly
 * `output`. Nothing prints a thread id, a hash code or a time, so both print the same on every run.
 */
(function (U) {
  'use strict';
  U.data.thenNowTopics = [
    { id: 'threads', title: 'Starting threads' },
    { id: 'waiting', title: 'Waiting for results' },
    { id: 'failure', title: 'Failures and deadlines' },
    { id: 'context', title: 'Context and lazy values' },
    { id: 'limits', title: 'Limits and streams' },
    { id: 'language', title: 'The program itself' }
  ];

  var P = U.data.thenNow = [];
  function add(topic, rows) { rows.forEach(function (r) { r.topic = topic; P.push(r); }); }

  /* ---------------------------------------------------------------- starting threads */
  add('threads', [
    { id: 'start-thread', title: 'Start a named thread and wait for it', since: '21', preview: false,
      keywords: ['new Thread', 'Thread.ofVirtual', 'builder', 'name', 'join'],
      then: `public class Main {
    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(() -> System.out.println("hello from " + Thread.currentThread().getName()), "worker");
        t.start();
        t.join();
    }
}`,
      now: `void main() throws InterruptedException {
    Thread t = Thread.ofVirtual().name("worker").start(() -> IO.println("hello from " + Thread.currentThread().getName()));
    t.join();
}`,
      output: 'hello from worker',
      note: 'A builder says what kind of thread, its name, and starts it, in one expression. `Thread.ofPlatform()` is the same builder for platform threads. See [[lesson:vt-create]] and [[ref:thread-of-virtual]].' },
    { id: 'thread-per-task', title: 'A thousand waiting tasks', since: '21', preview: false,
      keywords: ['newFixedThreadPool', 'newVirtualThreadPerTaskExecutor', 'pool', 'thread per task', 'throughput'],
      then: `import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(200);
        for (int i = 0; i < 1_000; i++) {
            pool.submit(() -> { Thread.sleep(50); return null; });
        }
        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.MINUTES);
        System.out.println("1000 tasks done");
    }
}`,
      now: `void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 1_000; i++) {
            executor.submit(() -> { Thread.sleep(50); return null; });
        }
    }
    IO.println("1000 tasks done");
}`,
      output: '1000 tasks done',
      note: 'The pool of 200 runs the tasks in five waves; virtual threads run all thousand at once, because a task that waits costs almost nothing. No size to guess. See [[lesson:vt-why]].' },
    { id: 'executor-close', title: 'Wait for an executor\'s tasks', since: '19', preview: false,
      keywords: ['shutdown', 'awaitTermination', 'close', 'try-with-resources', 'AutoCloseable'],
      then: `import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        List<String> done = Collections.synchronizedList(new ArrayList<>());
        ExecutorService pool = Executors.newFixedThreadPool(3);
        try {
            for (int i = 0; i < 3; i++) {
                final int n = i;
                pool.submit(() -> done.add("task " + n));
            }
        } finally {
            pool.shutdown();
            while (!pool.awaitTermination(1, TimeUnit.SECONDS)) {
                System.out.println("still waiting");
            }
        }
        System.out.println(done.size() + " done");
    }
}`,
      now: `void main() {
    List<String> done = Collections.synchronizedList(new ArrayList<>());
    try (var executor = Executors.newFixedThreadPool(3)) {
        for (int i = 0; i < 3; i++) {
            int n = i;
            executor.submit(() -> done.add("task " + n));
        }
    }
    IO.println(done.size() + " done");
}`,
      output: '3 done',
      note: 'Since Java 19 an `ExecutorService` is `AutoCloseable`: `close()` shuts it down and waits for its tasks, so try-with-resources replaces the `finally` and the loop. See [[ref:executor-service-close]].' },
    { id: 'named-threads', title: 'Name the threads a pool makes', since: '21', preview: false,
      keywords: ['ThreadFactory', 'factory', 'thread names', 'newThreadPerTaskExecutor'],
      then: `import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    public static void main(String[] args) throws Exception {
        AtomicInteger next = new AtomicInteger();
        ThreadFactory factory = r -> new Thread(r, "job-" + next.getAndIncrement());
        ExecutorService pool = Executors.newFixedThreadPool(2, factory);
        System.out.println(pool.submit(() -> Thread.currentThread().getName()).get());
        System.out.println(pool.submit(() -> Thread.currentThread().getName()).get());
        pool.shutdown();
    }
}`,
      now: `void main() throws Exception {
    try (var executor = Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("job-", 0).factory())) {
        IO.println(executor.submit(() -> Thread.currentThread().getName()).get());
        IO.println(executor.submit(() -> Thread.currentThread().getName()).get());
    }
}`,
      output: 'job-0\njob-1',
      note: 'A builder with `name(prefix, start)` numbers the threads it makes, and `factory()` turns it into a `ThreadFactory`: no counter of your own. Names are what you read in a thread dump. See [[ref:executors-new-thread-per-task-executor]].' },
    { id: 'daemon-thread', title: 'A background thread that does not keep the JVM up', since: '21', preview: false,
      keywords: ['daemon', 'setDaemon', 'ofPlatform', 'background'],
      then: `public class Main {
    public static void main(String[] args) throws InterruptedException {
        Thread ticker = new Thread(() -> System.out.println("tick"));
        ticker.setName("ticker");
        ticker.setDaemon(true);
        ticker.start();
        ticker.join();
        System.out.println(ticker.getName() + " was a daemon: " + ticker.isDaemon());
    }
}`,
      now: `void main() throws InterruptedException {
    Thread ticker = Thread.ofPlatform().name("ticker").daemon(true).start(() -> IO.println("tick"));
    ticker.join();
    IO.println(ticker.getName() + " was a daemon: " + ticker.isDaemon());
}`,
      output: 'tick\nticker was a daemon: true',
      note: 'The JVM ends when only daemon threads are left. Every virtual thread is a daemon already; for a platform thread, the builder\'s `daemon(true)`. See [[lesson:th-basics]].' },
    { id: 'uncaught-handler', title: 'Hear about a thread that died', since: '21', preview: false,
      keywords: ['uncaught exception', 'setUncaughtExceptionHandler', 'handler', 'builder'],
      then: `public class Main {
    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(() -> { throw new IllegalStateException("bad row"); }, "importer");
        t.setUncaughtExceptionHandler((th, e) -> System.out.println(th.getName() + " died: " + e.getMessage()));
        t.start();
        t.join();
    }
}`,
      now: `void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().name("importer")
        .uncaughtExceptionHandler((th, e) -> IO.println(th.getName() + " died: " + e.getMessage()))
        .start(() -> { throw new IllegalStateException("bad row"); });
    t.join();
}`,
      output: 'importer died: bad row',
      note: 'An exception that ends a thread reaches nobody but its handler; the default prints to `System.err`. The builder takes the handler before the thread starts, so none can slip past it. See [[ref:thread-set-uncaught-exception-handler]].' }
  ]);

  /* ---------------------------------------------------------------- waiting for results */
  add('waiting', [
    { id: 'join-duration', title: 'Wait a while for a thread', since: '19', preview: false,
      keywords: ['join', 'Duration', 'timeout', 'isAlive'],
      then: `public class Main {
    public static void main(String[] args) throws InterruptedException {
        Thread slow = new Thread(() -> {
            try { Thread.sleep(1_000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        slow.start();
        slow.join(50);
        System.out.println("still running after 50 ms: " + slow.isAlive());
        slow.interrupt();
        slow.join();
    }
}`,
      now: `void main() throws InterruptedException {
    Thread slow = Thread.ofVirtual().start(() -> {
        try { Thread.sleep(Duration.ofSeconds(1)); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    });
    boolean ended = slow.join(Duration.ofMillis(50));
    IO.println("still running after 50 ms: " + !ended);
    slow.interrupt();
    slow.join();
}`,
      output: 'still running after 50 ms: true',
      note: 'Since Java 19, `sleep` and `join` take a `Duration`, and `join(Duration)` says whether the thread ended: no separate `isAlive()` that could change in between. See [[ref:thread-join]].' },
    { id: 'future-state', title: 'Find out what became of a task', since: '21', preview: false,
      keywords: ['Future', 'state', 'resultNow', 'exceptionNow', 'isDone', 'switch'],
      then: `import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<Integer> ok = pool.submit(() -> 42);
        Future<Integer> bad = pool.submit(() -> { throw new IllegalStateException(); });
        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.SECONDS);
        for (Future<Integer> f : Arrays.asList(ok, bad)) {
            try {
                System.out.println("SUCCESS " + f.get());
            } catch (ExecutionException e) {
                System.out.println("FAILED " + e.getCause().getClass().getSimpleName());
            }
        }
    }
}`,
      now: `void main() {
    Future<Integer> ok, bad;
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        ok = executor.submit(() -> 42);
        bad = executor.submit(() -> { throw new IllegalStateException(); });
    }
    for (Future<Integer> f : List.of(ok, bad)) {
        IO.println(switch (f.state()) {
            case SUCCESS -> "SUCCESS " + f.resultNow();
            case FAILED -> "FAILED " + f.exceptionNow().getClass().getSimpleName();
            case CANCELLED, RUNNING -> "not done";
        });
    }
}`,
      output: 'SUCCESS 42\nFAILED IllegalStateException',
      note: '`Future.state()`, `resultNow()` and `exceptionNow()` (Java 19) read a finished task without a `get()` in a `try`; the `switch` over an enum (pattern matching for switch, Java 21) must cover every state. See [[ref:future-state]].' },
    { id: 'blocking-not-callbacks', title: 'One call after another, without callbacks', since: '21', preview: false,
      keywords: ['CompletableFuture', 'thenCompose', 'callbacks', 'blocking', 'virtual thread', 'reactive'],
      then: `import java.util.concurrent.*;

public class Main {
    static CompletableFuture<String> user(String id, Executor ex) {
        return CompletableFuture.supplyAsync(() -> "user " + id, ex);
    }
    static CompletableFuture<String> orders(String user, Executor ex) {
        return CompletableFuture.supplyAsync(() -> user + ": 3 orders", ex);
    }
    public static void main(String[] args) {
        ExecutorService pool = Executors.newFixedThreadPool(4);
        String answer = user("42", pool).thenCompose(u -> orders(u, pool)).join();
        System.out.println(answer);
        pool.shutdown();
    }
}`,
      now: `String user(String id) { return "user " + id; }
String orders(String user) { return user + ": 3 orders"; }

void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        IO.println(executor.submit(() -> orders(user("42"))).get());
    }
}`,
      output: 'user 42: 3 orders',
      note: 'The chain existed so that no thread would wait between the two calls. A virtual thread may wait: write the calls one after the other, with ordinary return values, `try`/`catch` and a stack trace that shows the whole request. See [[lesson:vt-blocking]].' },
    { id: 'fan-out', title: 'Two calls at once, then both results', since: '25', preview: true,
      keywords: ['fan-out', 'CompletableFuture', 'allOf', 'StructuredTaskScope', 'fork', 'join'],
      then: `import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CompletableFuture<String> user = CompletableFuture.supplyAsync(() -> "ravi", pool);
        CompletableFuture<Integer> orders = CompletableFuture.supplyAsync(() -> 3, pool);
        CompletableFuture.allOf(user, orders).join();
        System.out.println(user.join() + ": " + orders.join() + " orders");
        pool.shutdown();
    }
}`,
      now: `void main() throws InterruptedException {
    try (var scope = StructuredTaskScope.open()) {
        var user = scope.fork(() -> "ravi");
        var orders = scope.fork(() -> 3);
        scope.join();
        IO.println(user.get() + ": " + orders.get() + " orders");
    }
}`,
      output: 'ravi: 3 orders',
      note: 'The scope owns its subtasks: they cannot outlive the block, a failure cancels the other, and a thread dump shows them under the scope. A preview API in Java 25. See [[lesson:sc-why]].' },
    { id: 'first-success', title: 'The first answer wins', since: '25', preview: true,
      keywords: ['invokeAny', 'anyOf', 'race', 'Joiner', 'anySuccessfulResultOrThrow', 'mirror'],
      then: `import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Callable<String>> mirrors = Arrays.asList(
            () -> { Thread.sleep(500); return "slow mirror"; },
            () -> "fast mirror");
        System.out.println(pool.invokeAny(mirrors));
        pool.shutdownNow();
    }
}`,
      now: `void main() throws InterruptedException {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())) {
        scope.fork(() -> { Thread.sleep(500); return "slow mirror"; });
        scope.fork(() -> "fast mirror");
        IO.println(scope.join());
    }
}`,
      output: 'fast mirror',
      note: 'Both cancel the losers. The scope also guarantees they have ended when the block does, and its policy is one object (a `Joiner`) you can swap. See [[lesson:sc-joiners]].' }
  ]);

  /* ---------------------------------------------------------------- failures and deadlines */
  add('failure', [
    { id: 'cancel-siblings', title: 'One call fails: stop the other', since: '25', preview: true,
      keywords: ['cancellation', 'failure', 'invokeAll', 'cancel', 'StructuredTaskScope', 'FailedException'],
      then: `import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch slowStarted = new CountDownLatch(1);
        CountDownLatch slowStopped = new CountDownLatch(1);
        Future<String> slow = pool.submit(() -> {
            slowStarted.countDown();
            try {
                Thread.sleep(5_000);
                return "stock";
            } finally {
                slowStopped.countDown();
            }
        });
        Future<String> failing = pool.submit(() -> {
            slowStarted.await();
            throw new IllegalStateException("payment declined");
        });
        try {
            failing.get();
            slow.get();
        } catch (ExecutionException e) {
            slow.cancel(true);
            System.out.println("failed: " + e.getCause().getMessage());
        }
        System.out.println("the other stopped: " + slowStopped.await(5, TimeUnit.SECONDS));
        pool.shutdown();
    }
}`,
      now: `void main() throws InterruptedException {
    var slowStarted = new CountDownLatch(1);
    var slowStopped = new CountDownLatch(1);
    try (var scope = StructuredTaskScope.open()) {
        scope.fork(() -> {
            slowStarted.countDown();
            try {
                Thread.sleep(5_000);
                return "stock";
            } finally {
                slowStopped.countDown();
            }
        });
        scope.fork(() -> {
            slowStarted.await();
            throw new IllegalStateException("payment declined");
        });
        scope.join();
    } catch (StructuredTaskScope.FailedException e) {
        IO.println("failed: " + e.getCause().getMessage());
    }
    IO.println("the other stopped: " + slowStopped.await(5, TimeUnit.SECONDS));
}`,
      output: 'failed: payment declined\nthe other stopped: true',
      note: 'With futures, cancelling the rest is your job, and easy to forget on one path. A scope does it: the first failure interrupts the siblings, and `join()` throws `FailedException` with the failure as its cause. See [[lesson:sc-failure]].' },
    { id: 'deadline', title: 'One deadline for the whole fan-out', since: '25', preview: true,
      keywords: ['timeout', 'deadline', 'get with timeout', 'withTimeout', 'TimeoutException'],
      then: `import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<String> slow = pool.submit(() -> { Thread.sleep(5_000); return "late"; });
        try {
            System.out.println(slow.get(100, TimeUnit.MILLISECONDS));
        } catch (TimeoutException e) {
            slow.cancel(true);
            System.out.println("deadline passed: fallback");
        }
        pool.shutdown();
    }
}`,
      now: `void main() throws InterruptedException {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>allSuccessfulOrThrow(),
            config -> config.withTimeout(Duration.ofMillis(100)))) {
        scope.fork(() -> { Thread.sleep(5_000); return "late"; });
        IO.println(scope.join().map(StructuredTaskScope.Subtask::get).toList());
    } catch (StructuredTaskScope.TimeoutException e) {
        IO.println("deadline passed: fallback");
    }
}`,
      output: 'deadline passed: fallback',
      note: 'A timeout on each `get` adds up when there are several; the scope\'s deadline covers all of its subtasks at once and cancels whatever has not finished. See [[lesson:sc-timeouts]].' }
  ]);

  /* ---------------------------------------------------------------- context and lazy values */
  add('context', [
    { id: 'threadlocal-context', title: 'Context for the length of a call', since: '25', preview: false,
      keywords: ['ThreadLocal', 'ScopedValue', 'context', 'request', 'where', 'remove'],
      then: `public class Main {
    static final ThreadLocal<String> USER = new ThreadLocal<>();

    static void handle() {
        System.out.println("handling for " + USER.get());
    }

    public static void main(String[] args) {
        USER.set("asha");
        try {
            handle();
        } finally {
            USER.remove();
        }
        System.out.println("afterwards: " + (USER.get() == null ? "unbound" : USER.get()));
    }
}`,
      now: `static final ScopedValue<String> USER = ScopedValue.newInstance();

void handle() {
    IO.println("handling for " + USER.get());
}

void main() {
    ScopedValue.where(USER, "asha").run(this::handle);
    IO.println("afterwards: " + (USER.isBound() ? USER.get() : "unbound"));
}`,
      output: 'handling for asha\nafterwards: unbound',
      note: 'The `ThreadLocal` needs a `set`, a `finally` and a `remove`, and anyone may `set` it in between. A scoped value is bound for the call and cannot outlive it. Final in Java 25. See [[lesson:sv-basics]].' },
    { id: 'inherited-context', title: 'Context that child threads see', since: '25', preview: true,
      keywords: ['InheritableThreadLocal', 'ScopedValue', 'inheritance', 'fork', 'request id'],
      then: `public class Main {
    static final InheritableThreadLocal<String> REQUEST = new InheritableThreadLocal<>();

    public static void main(String[] args) throws InterruptedException {
        REQUEST.set("req-7");
        Thread child = new Thread(() -> System.out.println("child sees " + REQUEST.get()));
        child.start();
        child.join();
        REQUEST.remove();
    }
}`,
      now: `static final ScopedValue<String> REQUEST = ScopedValue.newInstance();

void main() throws Exception {
    ScopedValue.where(REQUEST, "req-7").call(() -> {
        try (var scope = StructuredTaskScope.open()) {
            var child = scope.fork(() -> "child sees " + REQUEST.get());
            scope.join();
            IO.println(child.get());
        }
        return null;
    });
}`,
      output: 'child sees req-7',
      note: 'An `InheritableThreadLocal` is copied into every thread made while it is set, pooled ones included, and goes stale there. Subtasks of a scope read the parent\'s binding without a copy, and only while the scope is open. See [[lesson:sv-inheritance]].' },
    { id: 'lazy-init', title: 'Compute a shared value once, when first needed', since: '25', preview: true,
      keywords: ['lazy', 'double-checked locking', 'volatile', 'StableValue', 'singleton', 'holder'],
      then: `import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    static final AtomicInteger LOADS = new AtomicInteger();
    static volatile String config;

    static String config() {
        String c = config;
        if (c == null) {
            synchronized (Main.class) {
                c = config;
                if (c == null) {
                    LOADS.incrementAndGet();
                    config = c = "loaded";
                }
            }
        }
        return c;
    }

    public static void main(String[] args) throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(8);
        for (int i = 0; i < 50; i++) pool.submit(Main::config);
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println(config() + ", loaded " + LOADS.get() + " time");
    }
}`,
      now: `static final AtomicInteger LOADS = new AtomicInteger();
static final StableValue<String> CONFIG = StableValue.of();

String config() {
    return CONFIG.orElseSet(() -> { LOADS.incrementAndGet(); return "loaded"; });
}

void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 50; i++) executor.submit(this::config);
    }
    IO.println(config() + ", loaded " + LOADS.get() + " time");
}`,
      output: 'loaded, loaded 1 time',
      note: 'Double-checked locking is correct only with the `volatile` (and the local copy); `StableValue.orElseSet` runs the supplier once however many threads ask, and the JVM may treat the value as a constant. A preview in 25, renamed `LazyConstant` in 26. See [[lesson:sv-lazy-init]].' }
  ]);

  /* ---------------------------------------------------------------- limits and streams */
  add('limits', [
    { id: 'parallel-blocking', title: 'Blocking calls in a stream', since: '24', preview: false,
      keywords: ['parallelStream', 'mapConcurrent', 'Gatherers', 'blocking', 'common pool'],
      then: `import java.util.*;
import java.util.stream.*;

public class Main {
    static String fetch(int id) {
        try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        return "page " + id;
    }

    public static void main(String[] args) {
        List<String> pages = Arrays.asList(1, 2, 3).parallelStream()
            .map(Main::fetch)
            .collect(Collectors.toList());
        System.out.println(pages);
    }
}`,
      now: `String fetch(int id) {
    try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    return "page " + id;
}

void main() {
    IO.println(Stream.of(1, 2, 3).gather(Gatherers.mapConcurrent(10, this::fetch)).toList());
}`,
      output: '[page 1, page 2, page 3]',
      note: 'A parallel stream blocks the common pool\'s few threads (one per processor, less one), and how many run at once depends on the machine. `mapConcurrent` runs each call on a virtual thread, at most 10 at once, in order. See [[lesson:sv-map-concurrent]].' },
    { id: 'semaphore-limit', title: 'At most three calls at once', since: '21', preview: false,
      keywords: ['limit', 'Semaphore', 'pool size', 'bulkhead', 'concurrency limit'],
      then: `import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        AtomicInteger now = new AtomicInteger(), peak = new AtomicInteger();
        ExecutorService pool = Executors.newFixedThreadPool(3);
        for (int i = 0; i < 20; i++) {
            pool.submit(() -> {
                peak.accumulateAndGet(now.incrementAndGet(), Math::max);
                Thread.sleep(20);
                now.decrementAndGet();
                return null;
            });
        }
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println("at most 3 at once: " + (peak.get() <= 3));
    }
}`,
      now: `void main() {
    var now = new AtomicInteger();
    var peak = new AtomicInteger();
    var permits = new Semaphore(3);
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
    IO.println("at most 3 at once: " + (peak.get() <= 3));
}`,
      output: 'at most 3 at once: true',
      note: 'With a pool, its size was the limit; virtual threads are never pooled, so the limit goes where it belongs, on the scarce resource, as a `Semaphore`. See [[lesson:vt-limit]].' }
  ]);

  /* ---------------------------------------------------------------- the program itself */
  add('language', [
    { id: 'compact-main', title: 'A program, with input', since: '25', preview: false, stdin: 'Asha\n',
      keywords: ['compact source file', 'void main', 'IO.println', 'IO.readln', 'System.out', 'BufferedReader'],
      then: `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        System.out.print("Name: ");
        String name = in.readLine();
        System.out.println("Hello, " + name);
    }
}`,
      now: `void main() {
    String name = IO.readln("Name: ");
    IO.println("Hello, " + name);
}`,
      output: 'Name: Asha\nHello, Asha',
      note: 'Java 25 (JEP 512): a file may hold just its methods (a compact source file), `main` needs no `public static` and no `args`, `java.base` is imported for you, and `IO` reads and prints. The echo of the input line is the tool\'s. See [[lesson:th-basics]].' }
  ]);
})(window.JCLT);
