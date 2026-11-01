/*
 * Practice (batch 5), part 3: the Hard katas. The shape is at the top of data/katas-easy.js.
 */
(function (U) {
  'use strict';
  var K = U.data.katas = U.data.katas || [];
  var SERVICE = { name: 'Service.java', code: `/** A slow service: each call waits for an answer, as a call over the network does. */
public interface Service {
    String fetch(String id) throws Exception;
}
` };
  var WATCH_OPEN = `try (var watcher = Executors.newVirtualThreadPerTaskExecutor()) {
    var result = watcher.submit(c.task(() -> {
`;
  function watchClose(message) { return `
    }));
    try {
        result.get(4, TimeUnit.SECONDS);
    } catch (TimeoutException e) {
        c.fail("${message}");
    } catch (ExecutionException e) {
        throw e.getCause();
    } finally {
        watcher.shutdownNow();
    }
}`; }

  K.push({
    id: 'quorum-joiner', level: 'Hard', kind: 'pattern', title: 'A quorum: the first N answers',
    summary: 'A custom Joiner that cancels the scope as soon as enough replicas have answered.',
    patterns: ['structured', 'design'], keywords: ['Joiner', 'custom joiner', 'onComplete', 'quorum', 'first N', 'replicas', 'StructuredTaskScope'],
    learn: ['lesson:sc-custom-joiner'],
    java: 'Quorum reads: ask five replicas, go on as soon as three agree. Preview API in Java 25. A joiner holds state, so make a new one for each scope ([[lesson:sc-custom-joiner]]).',
    task: 'Write `quorum(service, replicas, n)`: ask every replica at once, and return the **first `n` answers**, with the others cancelled, using a nested class that implements `StructuredTaskScope.Joiner<String, List<String>>`. Failures do not count. If fewer than `n` answer, return what there is.',
    files: [SERVICE],
    starter: `// A Joiner of your own: cancel the scope once n subtasks have succeeded; return their answers.
List<String> quorum(Service service, List<String> replicas, int n) throws Exception {
    throw new UnsupportedOperationException("Not written yet");
}

void main() throws Exception {
    Service service = id -> id;
    IO.println(quorum(service, List.of("a", "b", "c"), 2).size());
}`,
    solution: `static class FirstN implements StructuredTaskScope.Joiner<String, List<String>> {
    private final int n;
    private final Queue<String> answers = new ConcurrentLinkedQueue<>();
    private final AtomicInteger count = new AtomicInteger();

    FirstN(int n) { this.n = n; }

    @Override public boolean onComplete(StructuredTaskScope.Subtask<? extends String> s) {
        if (s.state() != StructuredTaskScope.Subtask.State.SUCCESS) return false;
        if (count.incrementAndGet() > n) return true;
        answers.add(s.get());
        return count.get() >= n;
    }

    @Override public List<String> result() {
        return List.copyOf(answers);
    }
}

List<String> quorum(Service service, List<String> replicas, int n) throws Exception {
    try (var scope = StructuredTaskScope.open(new FirstN(n))) {
        for (String replica : replicas) {
            scope.fork(() -> service.fetch(replica));
        }
        return scope.join();
    }
}

void main() throws Exception {
    Service service = id -> id;
    IO.println(quorum(service, List.of("a", "b", "c"), 2).size());
}`,
    hints: ['`onComplete` is told about each finished subtask, on that subtask\'s own thread, and returns `true` to cancel the scope.', 'Check `s.state()`: it is called for failed subtasks too.', 'Keep the answers in a thread-safe collection, and return them from `result()`.'],
    checks: [
      { label: 'it returns n answers', code: `Service service = id -> "answer " + id;
List<String> got = c.call("quorum", service, List.of("a", "b", "c"), 3);
c.eq(new TreeSet<>(got), new TreeSet<>(List.of("answer a", "answer b", "answer c")));` },
      { label: 'with n answers in, the rest are cancelled', code: `var probe = c.probe(1);
Service service = id -> { if (id.startsWith("slow")) probe.hang(); probe.whenHanging(2); return id; };
List<String> got = c.call("quorum", service, List.of("slow1", "slow2", "a", "b"), 2);
c.eq(new TreeSet<>(got), new TreeSet<>(List.of("a", "b")));
c.ok(probe.cancelled() == 2, probe.cancelled() + " of 2 slow replicas were cancelled");` },
      { label: 'failures do not count', code: `// the two failures always finish first, so a joiner that counts them stops before any answer
var failed = new CountDownLatch(2);
Service service = id -> {
    if (id.startsWith("bad")) {
        failed.countDown();
        throw new IllegalStateException("down");
    }
    failed.await();
    Thread.sleep(100);
    return id;
};
List<String> got = c.call("quorum", service, List.of("bad1", "a", "bad2", "b"), 2);
c.eq(new TreeSet<>(got), new TreeSet<>(List.of("a", "b")));` },
      { label: 'fewer than n answer: it returns what there is', code: `Service service = id -> { if (id.startsWith("bad")) throw new IllegalStateException("down"); return id; };
List<String> got = c.call("quorum", service, List.of("bad1", "a", "bad2"), 2);
c.eq(got, List.of("a"));` },
      { label: 'never more than n', code: `Service service = id -> id;
var ids = new ArrayList<String>();
for (int i = 0; i < 50; i++) ids.add("x" + i);
List<String> got = c.call("quorum", service, ids, 3);
c.eq(got.size(), 3);` }
    ]
  });

  K.push({
    id: 'hedged-call', level: 'Hard', kind: 'pattern', title: 'A hedged call',
    summary: 'If the first call is slow, send a second, and take whichever answers first.',
    patterns: ['structured', 'resilience'], keywords: ['hedged request', 'backup request', 'tail latency', 'anySuccessfulResultOrThrow', 'p99'],
    learn: ['lesson:sc-patterns'],
    java: 'Cutting the slowest 1% of a read-heavy service: Google\'s "The Tail at Scale" made it famous. It adds load, so only hedge safe, idempotent calls, and only after the usual latency.',
    task: 'Write `hedged(primary, backup, delayMs)`: call `primary` at once. **Only if it has not answered within `delayMs`**, also call `backup`. Return the first success and cancel the other. If `primary` fails before then, the backup goes ahead when its delay ends.',
    starter: `// primary at once; backup only after delayMs; the first success wins, and the other is cancelled.
String hedged(Callable<String> primary, Callable<String> backup, long delayMs) throws Exception {
    return primary.call();
}

void main() throws Exception {
    IO.println(hedged(() -> "fast", () -> "backup", 100));
}`,
    solution: `String hedged(Callable<String> primary, Callable<String> backup, long delayMs) throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())) {
        scope.fork(primary);
        scope.fork(() -> {
            Thread.sleep(delayMs);
            return backup.call();
        });
        return scope.join();
    }
}

void main() throws Exception {
    IO.println(hedged(() -> "fast", () -> "backup", 100));
}`,
    hints: ['Two forks and `anySuccessfulResultOrThrow`.', 'The backup\'s fork sleeps first. When the primary wins, the scope cancels that sleep, so the backup is never called.'],
    checks: [
      { label: 'a fast primary: its answer, and the backup is never called', code: `var backups = new AtomicInteger();
Callable<String> primary = () -> "primary";
Callable<String> backup = () -> { backups.incrementAndGet(); return "backup"; };
c.eq(c.call("hedged", primary, backup, 500L), "primary");
c.eq(backups.get(), 0);` },
      { label: 'a slow primary: the backup answers, and the primary is cancelled', code: `var probe = c.probe(1);
Callable<String> primary = () -> { probe.hang(); return "primary"; };
Callable<String> backup = () -> "backup";
c.eq(c.call("hedged", primary, backup, 50L), "backup");
c.ok(probe.cancelled() == 1, "the slow primary ran on");` },
      { label: 'the backup waits for the delay', code: `var probe = c.probe(2, 100);
Callable<String> primary = () -> { Thread.sleep(300); return "primary"; };
var calledBackup = new AtomicInteger();
Callable<String> backup = () -> { calledBackup.incrementAndGet(); Thread.sleep(2_000); return "backup"; };
c.eq(c.call("hedged", primary, backup, 2_000L), "primary");
c.eq(calledBackup.get(), 0);` },
      { label: 'a failed primary: the backup still answers', code: `Callable<String> primary = () -> { throw new IllegalStateException("down"); };
Callable<String> backup = () -> "backup";
c.eq(c.call("hedged", primary, backup, 50L), "backup");` }
    ]
  });

  K.push({
    id: 'single-flight', level: 'Hard', kind: 'pattern', title: 'Single flight',
    summary: 'Concurrent callers for one key share one call, and nothing is cached afterwards.',
    patterns: ['collections', 'design'], keywords: ['single flight', 'request coalescing', 'cache stampede', 'CompletableFuture', 'computeIfAbsent', 'thundering herd'],
    learn: ['lesson:juc-completable', 'lesson:juc-collections'],
    java: 'When a popular cache entry expires, a thousand requests ask the database for the same row. Coalescing makes it one query. `Caffeine` and Go\'s `singleflight` do this; it is a favourite interview question.',
    task: 'Write a nested class `SingleFlight` with `public String get(String key, Callable<String> load) throws Exception`. Callers for the same key **while a load is running** wait for that one load and share its answer, or its exception. Once it has ended, the next call loads again: nothing is cached. Different keys never wait for each other.',
    starter: `// Callers of one key, while a load runs, share it. Afterwards the next call loads again.
static class SingleFlight {
    public String get(String key, Callable<String> load) throws Exception {
        return load.call();
    }
}

void main() throws Exception {
    IO.println(new SingleFlight().get("a", () -> "loaded"));
}`,
    solution: `static class SingleFlight {
    private final ConcurrentHashMap<String, CompletableFuture<String>> running = new ConcurrentHashMap<>();

    public String get(String key, Callable<String> load) throws Exception {
        var mine = new CompletableFuture<String>();
        var theirs = running.putIfAbsent(key, mine);
        if (theirs != null) {
            try {
                return theirs.get();
            } catch (ExecutionException e) {
                throw (Exception) e.getCause();
            }
        }
        try {
            String value = load.call();
            mine.complete(value);
            return value;
        } catch (Exception e) {
            mine.completeExceptionally(e);
            throw e;
        } finally {
            running.remove(key);
        }
    }
}

void main() throws Exception {
    IO.println(new SingleFlight().get("a", () -> "loaded"));
}`,
    hints: ['A `ConcurrentHashMap` from key to `CompletableFuture`: `putIfAbsent` decides, atomically, who does the load.', 'The winner loads, completes the future (or completes it exceptionally), and removes it in a `finally`.', 'Everyone else waits on the future.'],
    checks: [
      { label: 'it returns the load\'s answer', code: `Object f = c.make("SingleFlight");
Callable<String> load = () -> "loaded";
c.eq(c.callOn(f, "get", "a", load), "loaded");` },
      { label: 'twenty callers at once share one load', code: `Object f = c.make("SingleFlight");
var loads = new AtomicInteger();
Callable<String> load = () -> { loads.incrementAndGet(); Thread.sleep(300); return "loaded"; };
var answers = new ConcurrentLinkedQueue<Object>();
var start = new CountDownLatch(1);
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 20; i++) {
        ex.submit(c.task(() -> { start.await(); answers.add(c.callOn(f, "get", "a", load)); }));
    }
    start.countDown();
}
c.eq(loads.get(), 1);
c.eq(answers.size(), 20);` },
      { label: 'once it has ended, the next call loads again', code: `Object f = c.make("SingleFlight");
var loads = new AtomicInteger();
Callable<String> load = () -> "load " + loads.incrementAndGet();
c.eq(c.callOn(f, "get", "a", load), "load 1");
c.eq(c.callOn(f, "get", "a", load), "load 2");` },
      { label: 'different keys do not wait for each other', code: `Object f = c.make("SingleFlight");
var probe = c.probe(2);
Callable<String> load = () -> { probe.meet(); return "x"; };
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    ex.submit(c.task(() -> c.callOn(f, "get", "a", load)));
    ex.submit(c.task(() -> c.callOn(f, "get", "b", load)));
}
c.ok(probe.peak() == 2, "two keys could not load at the same time");` },
      { label: 'a failure reaches everyone waiting, and the next call tries again', code: `Object f = c.make("SingleFlight");
var loads = new AtomicInteger();
Callable<String> bad = () -> { loads.incrementAndGet(); Thread.sleep(200); throw new IllegalStateException("down"); };
var failures = new AtomicInteger();
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 5; i++) {
        ex.submit(c.task(() -> {
            try {
                c.callOn(f, "get", "a", bad);
            } catch (IllegalStateException e) {
                failures.incrementAndGet();
            }
        }));
    }
}
c.eq(loads.get(), 1);
c.eq(failures.get(), 5);
Callable<String> good = () -> "well again";
c.eq(c.callOn(f, "get", "a", good), "well again");` }
    ]
  });

  K.push({
    id: 'circuit-breaker', level: 'Hard', kind: 'pattern', title: 'A circuit breaker',
    summary: 'Closed, open, half open: fail fast while a dependency is down, then try one call.',
    patterns: ['resilience', 'design'], keywords: ['circuit breaker', 'open', 'half open', 'closed', 'fail fast', 'resilience4j', 'synchronized'],
    learn: ['lesson:sp-resilience'],
    java: 'At work you use Resilience4j. Interviewers ask you to write one, because it is a small state machine that many threads share. The clock is passed in, so it can be tested without waiting.',
    task: 'Write a nested class `Breaker` with a constructor `Breaker(int failures, LongSupplier clock, long openMs)` and `public <T> T call(Callable<T> work) throws Exception`:\n\n- **closed**: run the work. `failures` failures **in a row** open it; a success resets the count;\n- **open**: throw `IllegalStateException("open")` without running the work, until `openMs` has passed on `clock`;\n- **half open**, after that: let **one** call through. Success closes it; failure opens it again for another `openMs`. Other calls meanwhile get `IllegalStateException("open")`.',
    starter: `// Closed, open, half open. The clock is passed in: never read the real time.
static class Breaker {
    Breaker(int failures, LongSupplier clock, long openMs) { }
    public <T> T call(Callable<T> work) throws Exception {
        return work.call();
    }
}

void main() throws Exception {
    IO.println(new Breaker(2, () -> 0L, 100).call(() -> "ok"));
}`,
    solution: `static class Breaker {
    private final int failures;
    private final LongSupplier clock;
    private final long openMs;
    private int inARow;
    private long openedAt = -1;
    private boolean trial;

    Breaker(int failures, LongSupplier clock, long openMs) {
        this.failures = failures;
        this.clock = clock;
        this.openMs = openMs;
    }

    private synchronized void enter() {
        if (openedAt < 0) return;
        if (trial || clock.getAsLong() - openedAt < openMs) throw new IllegalStateException("open");
        trial = true;
    }

    private synchronized void succeeded() {
        inARow = 0;
        openedAt = -1;
        trial = false;
    }

    private synchronized void failed() {
        if (trial || ++inARow >= failures) {
            openedAt = clock.getAsLong();
            inARow = 0;
        }
        trial = false;
    }

    public <T> T call(Callable<T> work) throws Exception {
        enter();
        try {
            T result = work.call();
            succeeded();
            return result;
        } catch (Exception e) {
            failed();
            throw e;
        }
    }
}

void main() throws Exception {
    IO.println(new Breaker(2, () -> 0L, 100).call(() -> "ok"));
}`,
    hints: ['Keep three things: failures in a row, when it opened (or -1), and whether a trial call is out.', 'Guard the state with `synchronized` methods, but **never** hold the lock while the work runs: it may be slow.', 'A failed trial opens it again at once, whatever the count.'],
    checks: [
      { label: 'closed: it runs the work', code: `var now = new long[1];
LongSupplier clock = () -> now[0];
Object b = c.make("Breaker", 2, clock, 100L);
Callable<String> ok = () -> "ok";
c.eq(c.callOn(b, "call", ok), "ok");` },
      { label: 'it opens after failures in a row, and a success resets the count', code: `var now = new long[1];
LongSupplier clock = () -> now[0];
Object b = c.make("Breaker", 2, clock, 100L);
var runs = new AtomicInteger();
Callable<String> bad = () -> { runs.incrementAndGet(); throw new java.io.IOException("down"); };
Callable<String> ok = () -> { runs.incrementAndGet(); return "ok"; };
try { c.callOn(b, "call", bad); } catch (java.io.IOException e) { }
c.callOn(b, "call", ok);
try { c.callOn(b, "call", bad); } catch (java.io.IOException e) { }
c.eq(c.callOn(b, "call", ok), "ok");
try { c.callOn(b, "call", bad); } catch (java.io.IOException e) { }
try { c.callOn(b, "call", bad); } catch (java.io.IOException e) { }
int before = runs.get();
boolean open = false;
try { c.callOn(b, "call", ok); } catch (IllegalStateException e) { open = "open".equals(e.getMessage()); }
c.ok(open, "two failures in a row did not open it");
c.eq(runs.get(), before);` },
      { label: 'after openMs, one trial; success closes it', code: `var now = new long[1];
LongSupplier clock = () -> now[0];
Object b = c.make("Breaker", 1, clock, 100L);
Callable<String> bad = () -> { throw new java.io.IOException("down"); };
Callable<String> ok = () -> "ok";
try { c.callOn(b, "call", bad); } catch (java.io.IOException e) { }
now[0] = 99;
boolean stillOpen = false;
try { c.callOn(b, "call", ok); } catch (IllegalStateException e) { stillOpen = true; }
c.ok(stillOpen, "it let a call through before openMs had passed");
now[0] = 100;
c.eq(c.callOn(b, "call", ok), "ok");
c.eq(c.callOn(b, "call", ok), "ok");` },
      { label: 'a failed trial opens it again for another openMs', code: `var now = new long[1];
LongSupplier clock = () -> now[0];
Object b = c.make("Breaker", 3, clock, 100L);
Callable<String> bad = () -> { throw new java.io.IOException("down"); };
Callable<String> ok = () -> "ok";
for (int i = 0; i < 3; i++) { try { c.callOn(b, "call", bad); } catch (java.io.IOException e) { } }
now[0] = 100;
try { c.callOn(b, "call", bad); } catch (java.io.IOException e) { }
now[0] = 199;
boolean open = false;
try { c.callOn(b, "call", ok); } catch (IllegalStateException e) { open = true; }
c.ok(open, "one failed trial should open it again at once");
now[0] = 200;
c.eq(c.callOn(b, "call", ok), "ok");` },
      { label: 'half open: only one call gets through, and the lock is not held meanwhile', code: `var now = new long[1];
LongSupplier clock = () -> now[0];
Object b = c.make("Breaker", 1, clock, 100L);
Callable<String> bad = () -> { throw new java.io.IOException("down"); };
try { c.callOn(b, "call", bad); } catch (java.io.IOException e) { }
now[0] = 100;
var inside = new CountDownLatch(1);
var release = new CountDownLatch(1);
Callable<String> slow = () -> { inside.countDown(); release.await(); return "ok"; };
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    var trial = ex.submit(c.task(() -> c.callOn(b, "call", slow)));
    inside.await();
    Callable<String> ok = () -> "ok";
    var second = ex.submit(c.task(() -> {
        boolean refused = false;
        try { c.callOn(b, "call", ok); } catch (IllegalStateException e) { refused = true; }
        c.ok(refused, "a second call got through while the trial was out");
    }));
    try {
        second.get(2, TimeUnit.SECONDS);
    } catch (TimeoutException e) {
        c.fail("the second call waited: is the lock held while the work runs?");
    } catch (ExecutionException e) {
        throw e.getCause();
    } finally {
        release.countDown();
    }
    trial.get();
}` }
    ]
  });

  K.push({
    id: 'fail-fast-bulkhead', level: 'Hard', kind: 'pattern', title: 'A bulkhead that refuses',
    summary: 'At the limit, wait a moment, then refuse, and count it: a fast no beats a slow outage.',
    patterns: ['limits', 'resilience', 'design'], keywords: ['bulkhead', 'tryAcquire', 'Semaphore', 'load shedding', 'rejected', '503'],
    learn: ['lesson:vt-limit', 'lesson:sp-resilience'],
    java: 'A user-facing path: when a dependency is saturated, a 503 now is kinder than a 30-second wait. The count is what your dashboard alerts on, now that the thread pool graph is gone ([[lesson:sp-observe]]).',
    task: 'Write a nested class `Bulkhead` with a constructor `Bulkhead(int limit, long waitMs)` and:\n\n- `public <T> T call(Callable<T> work) throws Exception`: wait at most `waitMs` for a turn. With one, run the work and always give the turn back. Without one, throw `RejectedExecutionException`;\n- `public int rejected()`: how many calls were refused.',
    starter: `// At most limit at once; wait at most waitMs for a turn, else RejectedExecutionException; count refusals.
static class Bulkhead {
    Bulkhead(int limit, long waitMs) { }
    public <T> T call(Callable<T> work) throws Exception { return work.call(); }
    public int rejected() { return 0; }
}

void main() throws Exception {
    IO.println(new Bulkhead(1, 10).call(() -> "ran"));
}`,
    solution: `static class Bulkhead {
    private final Semaphore turns;
    private final long waitMs;
    private final AtomicInteger rejected = new AtomicInteger();

    Bulkhead(int limit, long waitMs) {
        this.turns = new Semaphore(limit);
        this.waitMs = waitMs;
    }

    public <T> T call(Callable<T> work) throws Exception {
        if (!turns.tryAcquire(waitMs, TimeUnit.MILLISECONDS)) {
            rejected.incrementAndGet();
            throw new RejectedExecutionException("too many calls at once");
        }
        try {
            return work.call();
        } finally {
            turns.release();
        }
    }

    public int rejected() { return rejected.get(); }
}

void main() throws Exception {
    IO.println(new Bulkhead(1, 10).call(() -> "ran"));
}`,
    hints: ['`semaphore.tryAcquire(waitMs, TimeUnit.MILLISECONDS)` returns `false` when no permit came in time.', 'Release only if you acquired: the release goes in a `finally` after the check.', 'An `AtomicInteger` counts the refusals.'],
    checks: [
      { label: 'it runs the work', code: `Object b = c.make("Bulkhead", 2, 50L);
Callable<String> ok = () -> "ran";
c.eq(c.callOn(b, "call", ok), "ran");
c.eq(c.callOn(b, "rejected"), 0);` },
      { label: 'at the limit it refuses, and counts it', code: `Object b = c.make("Bulkhead", 1, 50L);
var inside = new CountDownLatch(1);
var release = new CountDownLatch(1);
Callable<String> hold = () -> { inside.countDown(); release.await(); return "x"; };
Callable<String> ok = () -> "ran";
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    var first = ex.submit(c.task(() -> c.callOn(b, "call", hold)));
    inside.await();
    boolean refused = false;
    try {
        c.callOn(b, "call", ok);
    } catch (RejectedExecutionException e) {
        refused = true;
    }
    release.countDown();
    first.get();
    c.ok(refused, "the second call was not refused");
}
c.eq(c.callOn(b, "rejected"), 1);` },
      { label: 'it waits for a turn before refusing', code: `Object b = c.make("Bulkhead", 1, 2_000L);
var inside = new CountDownLatch(1);
Callable<String> hold = () -> { inside.countDown(); Thread.sleep(100); return "x"; };
Callable<String> ok = () -> "ran";
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    var first = ex.submit(c.task(() -> c.callOn(b, "call", hold)));
    inside.await();
    c.eq(c.callOn(b, "call", ok), "ran");
    first.get();
}` },
      { label: 'a failed call gives its turn back', code: `Object b = c.make("Bulkhead", 1, 50L);
Callable<String> bad = () -> { throw new IllegalStateException("down"); };
Callable<String> ok = () -> "ran";
for (int i = 0; i < 3; i++) {
    try { c.callOn(b, "call", bad); } catch (IllegalStateException e) { }
}
c.eq(c.callOn(b, "call", ok), "ran");
c.eq(c.callOn(b, "rejected"), 0);` },
      { label: 'never more than the limit inside', code: `Object b = c.make("Bulkhead", 3, 5_000L);
var probe = c.probe(1);
Callable<String> call = () -> { probe.sleep(10); return "x"; };
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 20; i++) {
        ex.submit(c.task(() -> c.callOn(b, "call", call)));
    }
}
c.ok(probe.peak() <= 3, probe.peak() + " inside, with a limit of 3");` }
    ]
  });

  K.push({
    id: 'batcher', level: 'Hard', kind: 'pattern', title: 'A batcher',
    summary: 'Many threads each ask for one thing; one call to the backend answers them all.',
    patterns: ['design', 'queues'], keywords: ['batch', 'batching', 'CompletableFuture', 'coalesce', 'DataLoader', 'N+1'],
    learn: ['lesson:juc-completable', 'lesson:th-synchronized'],
    java: 'The N+1 query, solved under load: GraphQL\'s DataLoader, batched Kafka sends, a bulk insert. With virtual threads, code can block for its own answer while the batch fills, and stay simple.',
    task: 'Write a nested class `Batcher` with a constructor `Batcher(int size, Function<List<String>, List<String>> backend)` and `public String submit(String item) throws Exception`: it blocks until its batch has run, and returns **its own** answer.\n\nA batch runs when `size` items are waiting, on the thread that added the last one, and **not** holding a lock while the backend runs. The backend returns the answers in the order of the items. If it throws, every caller in that batch gets the failure.',
    starter: `// A batch runs when size items wait. Each caller blocks for its own answer.
static class Batcher {
    private final Function<List<String>, List<String>> backend;
    Batcher(int size, Function<List<String>, List<String>> backend) { this.backend = backend; }
    public String submit(String item) throws Exception {
        return backend.apply(List.of(item)).get(0);
    }
}

void main() throws Exception {
    Function<List<String>, List<String>> backend = items -> items;
    IO.println(new Batcher(1, backend).submit("a"));
}`,
    solution: `static class Batcher {
    private record Waiting(String item, CompletableFuture<String> answer) { }

    private final int size;
    private final Function<List<String>, List<String>> backend;
    private List<Waiting> waiting = new ArrayList<>();

    Batcher(int size, Function<List<String>, List<String>> backend) {
        this.size = size;
        this.backend = backend;
    }

    public String submit(String item) throws Exception {
        var me = new Waiting(item, new CompletableFuture<>());
        List<Waiting> full = null;
        synchronized (this) {
            waiting.add(me);
            if (waiting.size() == size) {
                full = waiting;
                waiting = new ArrayList<>();
            }
        }
        if (full != null) run(full);
        try {
            return me.answer().get();
        } catch (ExecutionException e) {
            throw (Exception) e.getCause();
        }
    }

    private void run(List<Waiting> batch) {
        try {
            var answers = backend.apply(batch.stream().map(Waiting::item).toList());
            for (int i = 0; i < batch.size(); i++) {
                batch.get(i).answer().complete(answers.get(i));
            }
        } catch (RuntimeException e) {
            batch.forEach(w -> w.answer().completeExceptionally(e));
        }
    }
}

void main() throws Exception {
    Function<List<String>, List<String>> backend = items -> items;
    IO.println(new Batcher(1, backend).submit("a"));
}`,
    hints: ['Each caller adds itself and a `CompletableFuture` to a list, and waits on the future.', 'Under a short lock: add, and if the list is now full, take it and start a new one.', 'Outside the lock, the caller that filled it runs the backend and completes all the futures.'],
    checks: [
      { label: 'each caller gets its own answer', code: `Function<List<String>, List<String>> backend = items -> items.stream().map(s -> "answer " + s).toList();
Object b = c.make("Batcher", 3, backend);
var got = new ConcurrentHashMap<String, Object>();
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (String s : List.of("a", "b", "c")) {
        ex.submit(c.task(() -> got.put(s, c.callOn(b, "submit", s))));
    }
}
c.eq(new TreeMap<>(got), new TreeMap<>(Map.of("a", "answer a", "b", "answer b", "c", "answer c")));` },
      { label: 'three callers make one call to the backend', code: `var calls = new AtomicInteger();
var sizes = new ConcurrentLinkedQueue<Integer>();
Function<List<String>, List<String>> backend = items -> { calls.incrementAndGet(); sizes.add(items.size()); return items; };
Object b = c.make("Batcher", 3, backend);
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 3; i++) {
        String s = "x" + i;
        ex.submit(c.task(() -> c.callOn(b, "submit", s)));
    }
}
c.eq(calls.get(), 1);
c.eq(new ArrayList<>(sizes), List.of(3));` },
      { label: 'the next batch starts empty', code: `var sizes = new ConcurrentLinkedQueue<Integer>();
Function<List<String>, List<String>> backend = items -> { sizes.add(items.size()); return items; };
Object b = c.make("Batcher", 2, backend);
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 6; i++) {
        String s = "x" + i;
        ex.submit(c.task(() -> c.callOn(b, "submit", s)));
    }
}
c.eq(new ArrayList<>(sizes), List.of(2, 2, 2));` },
      { label: 'a failure reaches every caller in the batch', code: `Function<List<String>, List<String>> backend = items -> { throw new IllegalStateException("down"); };
Object b = c.make("Batcher", 2, backend);
var failed = new AtomicInteger();
${''}` + WATCH_OPEN + `try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 2; i++) {
        String s = "x" + i;
        ex.submit(c.task(() -> {
            try {
                c.callOn(b, "submit", s);
            } catch (IllegalStateException e) {
                failed.incrementAndGet();
            }
        }));
    }
}` + watchClose('a caller is still waiting: did the failure reach everyone?') + `
c.eq(failed.get(), 2);` },
      { label: 'no lock is held while the backend runs', code: `var inside = new CountDownLatch(2);
var release = new CountDownLatch(1);
Function<List<String>, List<String>> backend = items -> {
    inside.countDown();
    try { release.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    return items;
};
Object b = c.make("Batcher", 1, backend);
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    var first = ex.submit(c.task(() -> c.callOn(b, "submit", "a")));
    var second = ex.submit(c.task(() -> c.callOn(b, "submit", "b")));
    boolean both = inside.await(2, TimeUnit.SECONDS);
    release.countDown();
    first.get();
    second.get();
    c.ok(both, "the second batch could not start while the first ran: a lock is held during the backend call");
}` }
    ]
  });

  K.push({
    id: 'philosophers', level: 'Hard', kind: 'pattern', title: 'The dining philosophers',
    summary: 'Five threads, five forks, and a lock order that breaks the circle.',
    patterns: ['locks'], keywords: ['dining philosophers', 'deadlock', 'lock ordering', 'ReentrantLock', 'circular wait'],
    learn: ['lesson:th-deadlock'],
    java: 'A classic for a reason: real deadlocks are this shape, a cycle of "I hold what you need". Giving locks a global order breaks the cycle, and needs no extra machinery.',
    task: 'Write `dine(n, rounds)`: `n` philosophers around a table, one fork (a `ReentrantLock`) between each pair. Each, on its own platform thread, `rounds` times: takes both its forks, calls `Table.eat(philosopher)`, puts them down. Return when all are finished. Call `Table.pause()` between taking the two forks: it makes the deadlock happen **every time** if your order allows one. Neighbours must never eat at once.',
    files: [{ name: 'Table.java', code: `import java.util.concurrent.atomic.AtomicIntegerArray;
import java.util.concurrent.atomic.AtomicInteger;

/** The table: it counts the meals, and sees neighbours eating at the same moment. */
public final class Table {
    private static volatile AtomicIntegerArray eating;
    public static final AtomicInteger meals = new AtomicInteger();
    public static final AtomicInteger clashes = new AtomicInteger();

    public static void lay(int n) {
        eating = new AtomicIntegerArray(n);
        meals.set(0);
        clashes.set(0);
    }

    public static void eat(int philosopher) {
        int n = eating.length();
        eating.set(philosopher, 1);
        if (n > 1 && (eating.get((philosopher + 1) % n) == 1 || eating.get((philosopher + n - 1) % n) == 1)) clashes.incrementAndGet();
        Thread.yield();
        meals.incrementAndGet();
        eating.set(philosopher, 0);
    }

    /** Between taking the first fork and the second. */
    public static void pause() {
        try {
            Thread.sleep(1);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
` }],
    starter: `import java.util.concurrent.locks.*;

// Each takes the fork on its left, then the fork on its right. Does it finish?
void dine(int n, int rounds) throws InterruptedException {
    var forks = new ReentrantLock[n];
    for (int i = 0; i < n; i++) forks[i] = new ReentrantLock();
    var threads = new ArrayList<Thread>();
    for (int p = 0; p < n; p++) {
        int me = p;
        threads.add(Thread.ofPlatform().daemon().start(() -> {
            ReentrantLock first = forks[me], second = forks[(me + 1) % n];
            for (int r = 0; r < rounds; r++) {
                first.lock();
                Table.pause();
                second.lock();
                Table.eat(me);
                second.unlock();
                first.unlock();
            }
        }));
    }
    for (var t : threads) t.join();
}

void main() {
    IO.println("the checks lay the table and call dine");
}`,
    solution: `import java.util.concurrent.locks.*;

void dine(int n, int rounds) throws InterruptedException {
    var forks = new ReentrantLock[n];
    for (int i = 0; i < n; i++) forks[i] = new ReentrantLock();
    var threads = new ArrayList<Thread>();
    for (int p = 0; p < n; p++) {
        int me = p;
        int left = me, right = (me + 1) % n;
        threads.add(Thread.ofPlatform().daemon().start(() -> {
            ReentrantLock first = forks[Math.min(left, right)], second = forks[Math.max(left, right)];
            for (int r = 0; r < rounds; r++) {
                first.lock();
                try {
                    Table.pause();
                    second.lock();
                    try {
                        Table.eat(me);
                    } finally {
                        second.unlock();
                    }
                } finally {
                    first.unlock();
                }
            }
        }));
    }
    for (var t : threads) t.join();
}

void main() {
    IO.println("the checks lay the table and call dine");
}`,
    hints: ['Everyone taking left then right makes a cycle: everyone holds one fork and waits for the next.', 'Always take the **lower-numbered** fork first. The last philosopher then reaches the other way, and the cycle cannot close.', '`Math.min` and `Math.max` of the two fork numbers.'],
    checks: [
      { label: 'five philosophers finish, every meal eaten', code: `Table.lay(5);
${''}` + WATCH_OPEN + `        c.call("dine", 5, 5);` + watchClose('they never finished: every philosopher holds one fork and waits for the next, a deadlock') + `
c.eq(Table.meals.get(), 25);` },
      { label: 'neighbours never eat at once', code: `Table.lay(5);
${''}` + WATCH_OPEN + `        c.call("dine", 5, 3);` + watchClose('they never finished: a deadlock') + `
c.eq(Table.clashes.get(), 0);` },
      { label: 'two philosophers finish too', code: `Table.lay(2);
${''}` + WATCH_OPEN + `        c.call("dine", 2, 5);` + watchClose('they never finished: a deadlock') + `
c.eq(Table.meals.get(), 10);` }
    ]
  });

  K.push({
    id: 'graceful-worker', level: 'Hard', kind: 'pattern', title: 'A worker that stops cleanly',
    summary: 'Finish what is running, hand back what is not, refuse what comes after, and leave no thread behind.',
    patterns: ['interrupts', 'queues', 'design'], keywords: ['shutdown', 'graceful', 'interrupt', 'BlockingQueue', 'worker thread', 'RejectedExecutionException'],
    learn: ['lesson:th-interrupts', 'lesson:juc-executors'],
    java: 'This is `ExecutorService.shutdownNow()` with the interrupt made gentle: what every deploy needs from a background worker. Without it, a restart loses the task in hand.',
    task: 'Write a nested class `Worker` with a constructor that starts its own virtual thread, running tasks in order from a queue:\n\n- `public void submit(Runnable task)`;\n- `public List<Runnable> stop() throws InterruptedException`: waits for the task now running to finish, and returns the tasks that never started. The worker\'s thread has ended by the time it returns. After `stop`, `submit` throws `RejectedExecutionException`.',
    starter: `// Runs tasks in order on its own thread. stop: finish the running one, return the rest, leave no thread.
static class Worker {
    public void submit(Runnable task) { task.run(); }
    public List<Runnable> stop() throws InterruptedException { return List.of(); }
}

void main() throws InterruptedException {
    var worker = new Worker();
    worker.submit(() -> IO.println("ran"));
    IO.println(worker.stop());
}`,
    solution: `static class Worker {
    private final LinkedBlockingQueue<Runnable> queue = new LinkedBlockingQueue<>();
    private volatile boolean stopping;
    private final Thread thread = Thread.ofVirtual().start(this::loop);

    private void loop() {
        while (!stopping) {
            Runnable task;
            try {
                task = queue.take();
            } catch (InterruptedException e) {
                return;
            }
            try {
                task.run();
            } catch (RuntimeException e) {
                // one task failing must not end the worker
            }
        }
    }

    public void submit(Runnable task) {
        if (stopping) throw new RejectedExecutionException("stopped");
        queue.add(task);
    }

    public List<Runnable> stop() throws InterruptedException {
        stopping = true;
        thread.interrupt();
        thread.join();
        var left = new ArrayList<Runnable>();
        queue.drainTo(left);
        return left;
    }
}

void main() throws InterruptedException {
    var worker = new Worker();
    worker.submit(() -> IO.println("ran"));
    IO.println(worker.stop());
}`,
    hints: ['A `volatile boolean` says stop; an `interrupt()` wakes the thread if it is waiting in `take()`.', 'After the `join`, `queue.drainTo(list)` collects what never started.', 'Catch a task\'s exception inside the loop: one bad task must not end the worker.'],
    checks: [
      { label: 'tasks run in order, on another thread', code: `Object w = c.make("Worker");
var ran = new ConcurrentLinkedQueue<Integer>();
var mine = Thread.currentThread();
var other = new boolean[1];
var done = new CountDownLatch(1);
c.callOn(w, "submit", (Runnable) () -> { ran.add(1); other[0] = Thread.currentThread() != mine; });
c.callOn(w, "submit", (Runnable) () -> { ran.add(2); done.countDown(); });
c.ok(done.await(2, TimeUnit.SECONDS), "the tasks did not run");
c.eq(new ArrayList<>(ran), List.of(1, 2));
c.ok(other[0], "the task ran on the caller's thread");
c.callOn(w, "stop");` },
      { label: 'stop waits for the running task, and hands back the rest', code: `Object w = c.make("Worker");
var inside = new CountDownLatch(1);
var finished = new java.util.concurrent.atomic.AtomicBoolean();
c.callOn(w, "submit", (Runnable) () -> {
    inside.countDown();
    try {
        Thread.sleep(100);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
    finished.set(true);
});
Runnable never = () -> { };
c.callOn(w, "submit", never);
inside.await();
List<Runnable> left = c.callOn(w, "stop");
c.ok(left.size() == 1 && left.get(0) == never, "the task that never started should come back: " + left.size());` },
      { label: 'after stop, submit is refused', code: `Object w = c.make("Worker");
c.callOn(w, "stop");
boolean refused = false;
try {
    c.callOn(w, "submit", (Runnable) () -> { });
} catch (RejectedExecutionException e) {
    refused = true;
}
c.ok(refused, "submit was accepted after stop");` },
      { label: 'stop ends an idle worker, too', code: `Object w = c.make("Worker");
Thread.sleep(50);
${''}` + WATCH_OPEN + `        c.callOn(w, "stop");` + watchClose('stop never returned: the worker is waiting in take(), and nothing woke it') },
      { label: 'a task that throws does not end the worker', code: `Object w = c.make("Worker");
var ran = new CountDownLatch(1);
c.callOn(w, "submit", (Runnable) () -> { throw new IllegalStateException("bad task"); });
c.callOn(w, "submit", (Runnable) ran::countDown);
c.ok(ran.await(2, TimeUnit.SECONDS), "the task after the bad one never ran");
c.callOn(w, "stop");` }
    ]
  });
})(window.JCLT);
