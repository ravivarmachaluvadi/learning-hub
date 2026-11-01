/*
 * Practice (batch 5), part 1: the patterns every kata is filed under, and the Easy katas (views/practice.js).
 *
 * Kata shape (U.data.katas; the other levels are in data/katas-medium.js and data/katas-hard.js):
 *   {id, level: 'Easy'|'Medium'|'Hard', kind: 'pattern'|'rewrite', title, summary,
 *    patterns: [ids from U.data.kataPatterns], keywords: [..] (more words search should find it by),
 *    learn: ['lesson:juc-futures', 'q:vt-what'] (where what it needs is taught),
 *    java: Markdown (the "Where you meet this at work" note), task: Markdown,
 *    files?: [{name, code}], starter, solution, hints: [..], timeout?: seconds,
 *    checks: [{label, code (Java, with c: runner/Ctx.java), idiom?: true}]}
 *
 * A kata is a challenge like a lesson's. tests/test_content.py proves that every starter fails and every
 * solution passes, with 2+ near misses (tests/kata_near_misses.py) that fail the check predicted. An idiom
 * check reads the code or tests what only the new way can do. A rewrite's id starts rw-: its starter is the
 * working old way, written as it was before Java 21. It passes every other check and fails only idiom checks.
 * No check reads a clock: Probe (runner/Probe.java) proves what ran together, and what was cancelled.
 */
(function (U) {
  'use strict';
  U.data.kataPatterns = [
    { id: 'atomics', title: 'Atomics and CAS' },
    { id: 'waiting', title: 'Waiting for others' },
    { id: 'virtual', title: 'Virtual threads' },
    { id: 'futures', title: 'Futures and deadlines' },
    { id: 'collections', title: 'Concurrent collections' },
    { id: 'interrupts', title: 'Interruption' },
    { id: 'limits', title: 'Limits and bulkheads' },
    { id: 'queues', title: 'Queues' },
    { id: 'context', title: 'Context and scoped values' },
    { id: 'lazy', title: 'Lazy initialisation' },
    { id: 'locks', title: 'Locks and deadlock' },
    { id: 'structured', title: 'Structured concurrency' },
    { id: 'forkjoin', title: 'Fork/join and streams' },
    { id: 'resilience', title: 'Resilience' },
    { id: 'design', title: 'Design a class' }
  ];
  var K = U.data.katas = U.data.katas || [];

  var SERVICE = { name: 'Service.java', code: `/** A slow service: each call waits for an answer, as a call over the network does. */
public interface Service {
    String fetch(String id) throws Exception;
}
` };

  K.push({
    id: 'atomic-counter', level: 'Easy', kind: 'pattern', title: 'A counter that loses nothing',
    summary: 'Several threads, one count, and the total must be exact.',
    patterns: ['atomics'], keywords: ['counter', 'AtomicInteger', 'LongAdder', 'lost update', 'count++', 'join'],
    learn: ['lesson:th-races', 'lesson:juc-atomics'],
    java: 'Request counters, rate limiters, metrics. A plain `int` looks fine in a test and loses updates under load: measured in [[lesson:th-races]], 4 threads lost updates in only 2 runs of 5.',
    task: 'Write `countTo(threads, each)`: start `threads` threads, each adding 1 to a shared count `each` times; wait for them all, and return the total. It must be exact, every time.',
    starter: `// Start the threads, wait for them all, return the exact total.
int countTo(int threads, int each) throws InterruptedException {
    int[] count = new int[1];
    var started = new ArrayList<Thread>();
    for (int t = 0; t < threads; t++) {
        started.add(Thread.ofPlatform().start(() -> {
            for (int i = 0; i < each; i++) count[0]++;
        }));
    }
    for (var t : started) t.join();
    return count[0];
}

void main() throws InterruptedException {
    IO.println(countTo(4, 1000));
}`,
    solution: `int countTo(int threads, int each) throws InterruptedException {
    var count = new AtomicInteger();
    var started = new ArrayList<Thread>();
    for (int t = 0; t < threads; t++) {
        started.add(Thread.ofPlatform().start(() -> {
            for (int i = 0; i < each; i++) count.incrementAndGet();
        }));
    }
    for (var t : started) t.join();
    return count.get();
}

void main() throws InterruptedException {
    IO.println(countTo(4, 1000));
}`,
    hints: ['`count[0]++` is three steps: read, add, write. Two threads can read the same value.', '`AtomicInteger.incrementAndGet()` does all three as one step.', 'Keep the `join`s: without them you read the total before the threads finish.'],
    checks: [
      { label: 'one thread counting 5 gives 5', code: `c.eq(c.call("countTo", 1, 5), 5);` },
      { label: '8 threads counting a million each give exactly 8 million', code: `c.eq(c.call("countTo", 8, 1_000_000), 8_000_000);` },
      { label: 'it uses an atomic type: a race that did not show today is still a race', idiom: true, code: `c.ok(c.uses("AtomicInteger|AtomicLong|LongAdder"), "no atomic type: the total can be wrong on another run, so a passing test proves nothing");` }
    ]
  });

  K.push({
    id: 'wait-for-all', level: 'Easy', kind: 'pattern', title: 'Wait for all of them, even the ones that fail',
    summary: 'A latch that always reaches zero, and a count of what failed.',
    patterns: ['waiting'], keywords: ['CountDownLatch', 'latch', 'countDown', 'finally', 'warm caches', 'startup'],
    learn: ['lesson:juc-synchronizers'],
    java: 'Warming caches at start-up, a test waiting for workers. The classic bug is a `countDown` skipped when a task throws: start-up then hangs for ever, with nothing in the logs.',
    task: 'Write `runAll(tasks)`: run every `Runnable` at the same time on virtual threads, wait with a `CountDownLatch` until all have ended, and return **how many threw**.',
    starter: `// Run all at once on virtual threads; wait with a CountDownLatch; return how many threw.
int runAll(List<Runnable> tasks) throws InterruptedException {
    throw new UnsupportedOperationException("Not written yet");
}

void main() throws InterruptedException {
    IO.println(runAll(List.of(() -> IO.println("warmed"))));
}`,
    solution: `int runAll(List<Runnable> tasks) throws InterruptedException {
    var done = new CountDownLatch(tasks.size());
    var failed = new AtomicInteger();
    for (Runnable task : tasks) {
        Thread.ofVirtual().start(() -> {
            try {
                task.run();
            } catch (RuntimeException e) {
                failed.incrementAndGet();
            } finally {
                done.countDown();
            }
        });
    }
    done.await();
    return failed.get();
}

void main() throws InterruptedException {
    IO.println(runAll(List.of(() -> IO.println("warmed"))));
}`,
    hints: ['`new CountDownLatch(tasks.size())`, and `await()` after starting them all.', '`countDown()` belongs in a `finally`, or a task that throws leaves the latch above zero for ever.', 'A shared `AtomicInteger` counts the failures.'],
    checks: [
      { label: 'it returns 0 when nothing fails, after everything has run', code: `var ran = new AtomicInteger();
List<Runnable> tasks = List.of(ran::incrementAndGet, ran::incrementAndGet, ran::incrementAndGet);
c.eq(c.call("runAll", tasks), 0);
c.eq(ran.get(), 3);` },
      { label: 'the tasks run at the same time, on virtual threads', code: `var probe = c.probe(3);
Runnable meet = () -> { try { probe.meet(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } };
c.call("runAll", List.of(meet, meet, meet));
c.ok(probe.peak() == 3, "at most " + probe.peak() + " at once");
c.ok(probe.allVirtual(), "a task ran on a platform thread");` },
      { label: 'it counts the ones that threw, and does not hang on them', code: `Runnable bad = () -> { throw new IllegalStateException("down"); };
Runnable good = () -> { };
try (var watcher = Executors.newVirtualThreadPerTaskExecutor()) {
    var result = watcher.submit(c.task(() -> c.eq(c.call("runAll", List.of(bad, good, bad)), 2)));
    try {
        result.get(3, TimeUnit.SECONDS);
    } catch (TimeoutException e) {
        c.fail("it never returned: a task that threw did not count the latch down");
    } catch (ExecutionException e) {
        throw e.getCause();
    } finally {
        watcher.shutdownNow();
    }
}` }
    ]
  });

  K.push({
    id: 'fan-out-virtual', level: 'Easy', kind: 'pattern', title: 'Fetch them all at once',
    summary: 'One virtual thread per call, answers in order, and a failure that reaches the caller.',
    patterns: ['virtual'], keywords: ['fan out', 'newVirtualThreadPerTaskExecutor', 'invokeAll', 'future', 'order'],
    learn: ['lesson:vt-why', 'lesson:juc-futures'],
    java: 'Every endpoint that calls several services. Done one after another it costs the sum of their latencies; together, the slowest.',
    task: 'Write `fetchAll(service, ids)`: call `service.fetch(id)` for every id at the same time, on virtual threads, and return the answers **in the order of the ids**. If a call fails, its exception must reach the caller.',
    files: [SERVICE],
    starter: `// Every call at the same time on virtual threads; answers in the order of the ids.
List<String> fetchAll(Service service, List<String> ids) throws Exception {
    var answers = new ArrayList<String>();
    for (String id : ids) {
        answers.add(service.fetch(id));
    }
    return answers;
}

void main() throws Exception {
    Service service = id -> "answer " + id;
    IO.println(fetchAll(service, List.of("a", "b")));
}`,
    solution: `List<String> fetchAll(Service service, List<String> ids) throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var futures = new ArrayList<Future<String>>();
        for (String id : ids) {
            futures.add(executor.submit(() -> service.fetch(id)));
        }
        var answers = new ArrayList<String>();
        for (var f : futures) {
            answers.add(f.get());
        }
        return answers;
    }
}

void main() throws Exception {
    Service service = id -> "answer " + id;
    IO.println(fetchAll(service, List.of("a", "b")));
}`,
    hints: ['`Executors.newVirtualThreadPerTaskExecutor()` in a try-with-resources.', 'Submit them all first, keeping the futures; only then `get()` each, in order.', '`get()` throws `ExecutionException` holding the failure: do not catch it.'],
    checks: [
      { label: 'the answers come back in order', code: `Service service = id -> "answer " + id;
c.eq(c.call("fetchAll", service, List.of("a", "b", "c")), List.of("answer a", "answer b", "answer c"));` },
      { label: 'the calls run at the same time', code: `var probe = c.probe(4);
Service service = id -> { probe.meet(); return id; };
c.call("fetchAll", service, List.of("a", "b", "c", "d"));
c.ok(probe.peak() == 4, "at most " + probe.peak() + " at once");` },
      { label: 'each runs on a virtual thread', code: `var probe = c.probe(1);
Service service = id -> { probe.sleep(1); return id; };
c.call("fetchAll", service, List.of("a", "b"));
c.ok(probe.allVirtual(), probe.platformCalls() + " calls ran on a platform thread");` },
      { label: 'a failed call reaches the caller', code: `Service service = id -> { throw new IllegalStateException("down"); };
boolean threw = false;
try {
    c.call("fetchAll", service, List.of("a"));
} catch (Throwable t) {
    threw = String.valueOf(t).contains("down");
}
c.ok(threw, "it returned normally although a call failed");` }
    ]
  });

  K.push({
    id: 'future-or-default', level: 'Easy', kind: 'pattern', title: 'An answer in time, or a default',
    summary: 'A deadline on a call, a default when it is missed, and nothing left running.',
    patterns: ['futures'], keywords: ['Future', 'get timeout', 'TimeoutException', 'cancel', 'fallback', 'default'],
    learn: ['lesson:juc-futures', 'lesson:th-interrupts'],
    java: 'Recommendations on a product page: useful if fast, and not worth holding the page for. Forgetting the `cancel` leaves the slow call running after nobody wants it.',
    task: 'Write `orDefault(executor, task, ms, fallback)`: submit the task, wait up to `ms` milliseconds, and return its result. If it is late, **cancel it** and return `fallback`. If it fails, return `fallback`.',
    starter: `// The result within ms; if late, cancel it and return the fallback; if it fails, the fallback.
String orDefault(ExecutorService executor, Callable<String> task, long ms, String fallback) throws Exception {
    return executor.submit(task).get();
}

void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        IO.println(orDefault(executor, () -> "fresh", 100, "cached"));
    }
}`,
    solution: `String orDefault(ExecutorService executor, Callable<String> task, long ms, String fallback) throws Exception {
    Future<String> future = executor.submit(task);
    try {
        return future.get(ms, TimeUnit.MILLISECONDS);
    } catch (TimeoutException e) {
        future.cancel(true);
        return fallback;
    } catch (ExecutionException e) {
        return fallback;
    }
}

void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        IO.println(orDefault(executor, () -> "fresh", 100, "cached"));
    }
}`,
    hints: ['`future.get(ms, TimeUnit.MILLISECONDS)` throws `TimeoutException` when it is late.', 'The timeout stops your wait, not the task: `future.cancel(true)` interrupts it.', 'A failed task arrives as `ExecutionException`.'],
    checks: [
      { label: 'an answer in time is returned', code: `try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    Callable<String> task = () -> "fresh";
    c.eq(c.call("orDefault", ex, task, 2000L, "cached"), "fresh");
}` },
      { label: 'a late answer gives the fallback', code: `var probe = c.probe(1);
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    Callable<String> task = () -> { probe.hang(); return "late"; };
    c.eq(c.call("orDefault", ex, task, 50L, "cached"), "cached");
}` },
      { label: 'the late task is cancelled, not left running', code: `var probe = c.probe(1);
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    Callable<String> task = () -> { probe.hang(); return "late"; };
    c.call("orDefault", ex, task, 50L, "cached");
}
c.ok(probe.cancelled() == 1, "the task ran on after the deadline: the timeout stops your wait, not the task");` },
      { label: 'a task that fails gives the fallback', code: `try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    Callable<String> task = () -> { throw new IllegalStateException("down"); };
    c.eq(c.call("orDefault", ex, task, 2000L, "cached"), "cached");
}` }
    ]
  });

  K.push({
    id: 'word-count', level: 'Easy', kind: 'pattern', title: 'Count words from many threads',
    summary: 'A get and then a put is a race, even on a ConcurrentHashMap.',
    patterns: ['collections'], keywords: ['ConcurrentHashMap', 'merge', 'compute', 'check then act', 'word count'],
    learn: ['lesson:juc-collections'],
    java: 'Hit counters, in-memory aggregates. `ConcurrentHashMap` makes each call safe, not the two calls together: the most common concurrency bug in code reviews.',
    task: 'Write `countWords(lines)`: count the words in every line, one virtual thread per line, words split on a space. Return a map from word to count. Every count must be exact.',
    starter: `// One virtual thread per line; word -> exact count.
Map<String, Integer> countWords(List<String> lines) {
    var counts = new ConcurrentHashMap<String, Integer>();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (String line : lines) {
            executor.submit(() -> {
                for (String word : line.split(" ")) {
                    counts.put(word, counts.getOrDefault(word, 0) + 1);
                }
            });
        }
    }
    return counts;
}

void main() {
    IO.println(countWords(List.of("to be", "or not to be")));
}`,
    solution: `Map<String, Integer> countWords(List<String> lines) {
    var counts = new ConcurrentHashMap<String, Integer>();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (String line : lines) {
            executor.submit(() -> {
                for (String word : line.split(" ")) {
                    counts.merge(word, 1, Integer::sum);
                }
            });
        }
    }
    return counts;
}

void main() {
    IO.println(countWords(List.of("to be", "or not to be")));
}`,
    hints: ['`counts.put(word, counts.getOrDefault(word, 0) + 1)` is two steps: another thread can write between them.', '`counts.merge(word, 1, Integer::sum)` is one atomic step per key.'],
    checks: [
      { label: 'it counts one line', code: `Map<String, Integer> m = c.call("countWords", List.of("a b a"));
c.eq(new TreeMap<>(m), new TreeMap<>(Map.of("a", 2, "b", 1)));` },
      { label: 'it counts many lines, exactly', code: `var lines = new ArrayList<String>();
for (int i = 0; i < 2000; i++) lines.add("x y");
Map<String, Integer> m = c.call("countWords", lines);
c.eq(m.get("x"), 2000);
c.eq(m.get("y"), 2000);` },
      { label: 'each update is one atomic step on the map', idiom: true, code: `c.ok(c.uses("merge|compute"), "a get and a put are two steps: another thread can write between them, so a count can be lost");` }
    ]
  });

  K.push({
    id: 'restore-interrupt', level: 'Easy', kind: 'pattern', title: 'Do not swallow the interrupt',
    summary: 'Catching InterruptedException clears the flag. Put it back.',
    patterns: ['interrupts'], keywords: ['InterruptedException', 'interrupt', 'flag', 'restore', 'Thread.currentThread().interrupt()'],
    learn: ['lesson:th-interrupts'],
    java: 'A retry loop that catches `InterruptedException` and carries on cannot be shut down: the deploy waits, then kills it. This is one of the ⚠ warnings in this tool\'s editor.',
    task: 'Write `pause(ms)`: sleep for `ms` milliseconds and return `true`. If the thread is interrupted, return `false` at once, **with its interrupt flag still set** so the caller can see it.',
    starter: `// Sleep and return true; if interrupted, return false with the flag still set.
boolean pause(long ms) {
    try {
        Thread.sleep(ms);
    } catch (InterruptedException e) {
    }
    return true;
}

void main() {
    IO.println(pause(10));
}`,
    solution: `boolean pause(long ms) {
    try {
        Thread.sleep(ms);
        return true;
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return false;
    }
}

void main() {
    IO.println(pause(10));
}`,
    hints: ['Throwing `InterruptedException` clears the thread\'s flag.', '`Thread.currentThread().interrupt()` in the `catch` sets it again.'],
    checks: [
      { label: 'it sleeps, and returns true', code: `c.eq(c.call("pause", 1L), true);
c.ok(!Thread.currentThread().isInterrupted(), "the flag is set though nobody interrupted");` },
      { label: 'interrupted, it returns false', code: `Thread.currentThread().interrupt();
boolean r = c.call("pause", 5000L);
Thread.interrupted();
c.eq(r, false);` },
      { label: 'the flag is still set afterwards', code: `Thread.currentThread().interrupt();
c.call("pause", 5000L);
boolean set = Thread.interrupted();
c.ok(set, "the flag was cleared, so the caller can never know it was asked to stop");` }
    ]
  });

  K.push({
    id: 'with-permit', level: 'Easy', kind: 'pattern', title: 'Acquire outside the try',
    summary: 'A semaphore helper with the one line everybody puts in the wrong place.',
    patterns: ['limits'], keywords: ['Semaphore', 'acquire', 'release', 'finally', 'permit', 'bulkhead'],
    learn: ['lesson:vt-limit', 'lesson:juc-synchronizers'],
    java: 'Every limit on calls to a dependency. A release in `finally` is well known; that `acquire` must come **before** the `try` is not, and the bug only shows when a waiting thread is interrupted, under load, during a deploy.',
    task: 'Write `withPermit(semaphore, call)`: take a permit, run the call, return its result, and always give the permit back. If the thread is interrupted **while waiting for a permit**, the `InterruptedException` reaches the caller and no permit is added: a permit it never got must not be released.',
    starter: `// Take a permit, run the call, always give the permit back. Never release a permit you did not get.
<T> T withPermit(Semaphore semaphore, Callable<T> call) throws Exception {
    return call.call();
}

void main() throws Exception {
    IO.println(withPermit(new Semaphore(1), () -> "ran"));
}`,
    solution: `<T> T withPermit(Semaphore semaphore, Callable<T> call) throws Exception {
    semaphore.acquire();
    try {
        return call.call();
    } finally {
        semaphore.release();
    }
}

void main() throws Exception {
    IO.println(withPermit(new Semaphore(1), () -> "ran"));
}`,
    hints: ['`acquire()`, then `try { … } finally { release(); }`.', 'If `acquire()` is inside the `try`, an interrupt while waiting still runs the `finally`, and adds a permit nobody took.'],
    checks: [
      { label: 'it returns the call\'s result, and the permit comes back', code: `var s = new Semaphore(1);
Callable<String> call = () -> s.availablePermits() + " left inside";
c.eq(c.call("withPermit", s, call), "0 left inside");
c.eq(s.availablePermits(), 1);` },
      { label: 'the permit comes back when the call fails', code: `var s = new Semaphore(1);
Callable<String> call = () -> { throw new IllegalStateException("down"); };
try {
    c.call("withPermit", s, call);
} catch (Throwable t) {
}
c.eq(s.availablePermits(), 1);` },
      { label: 'it never lets in more than the permits allow', code: `var s = new Semaphore(2);
var probe = c.probe(1);
Callable<String> call = () -> { probe.sleep(10); return "x"; };
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10; i++) {
        ex.submit(c.task(() -> c.call("withPermit", s, call)));
    }
}
c.ok(probe.peak() <= 2, probe.peak() + " inside at once, with 2 permits");` },
      { label: 'interrupted while waiting, it adds no permit', code: `var s = new Semaphore(0);
Callable<String> call = () -> "ran";
Thread waiter = Thread.ofVirtual().start(() -> {
    try {
        c.call("withPermit", s, call);
    } catch (Throwable t) {
    }
});
while (s.getQueueLength() == 0 && waiter.isAlive()) Thread.sleep(1);
waiter.interrupt();
waiter.join();
c.eq(s.availablePermits(), 0);` }
    ]
  });

  K.push({
    id: 'queue-pipeline', level: 'Easy', kind: 'pattern', title: 'A producer, a queue, a consumer',
    summary: 'A bounded queue between two threads, and how the consumer knows it is over.',
    patterns: ['queues'], keywords: ['BlockingQueue', 'ArrayBlockingQueue', 'producer consumer', 'poison pill', 'put', 'take'],
    learn: ['lesson:juc-collections'],
    java: 'An in-process pipeline: reading a file on one thread and writing to a database on another. The bound is the point: a fast producer waits instead of filling the heap.',
    task: 'Write `squares(numbers)`: one thread puts the numbers on an `ArrayBlockingQueue` of capacity 2; another takes them and collects their squares. Return the squares in order. The consumer must stop when the numbers end, so send a marker it recognises: a **poison pill**.',
    starter: `// A producer thread, a queue of capacity 2, a consumer thread; the squares in order.
List<Integer> squares(List<Integer> numbers) throws InterruptedException {
    throw new UnsupportedOperationException("Not written yet");
}

void main() throws InterruptedException {
    IO.println("the checks call squares");
}`,
    solution: `List<Integer> squares(List<Integer> numbers) throws InterruptedException {
    final int END = Integer.MIN_VALUE;
    var queue = new ArrayBlockingQueue<Integer>(2);
    var squares = new ArrayList<Integer>();
    Thread producer = Thread.ofVirtual().start(() -> {
        try {
            for (int n : numbers) queue.put(n);
            queue.put(END);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    Thread consumer = Thread.ofVirtual().start(() -> {
        try {
            for (int n = queue.take(); n != END; n = queue.take()) squares.add(n * n);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    producer.join();
    consumer.join();
    return squares;
}

void main() throws InterruptedException {
    IO.println("the checks call squares");
}`,
    hints: ['`put` waits while the queue is full; `take` waits while it is empty.', 'Put one special value after the last number, and stop the consumer when it arrives.', '`join` both threads: the list is safe to read after the `join` (a happens-before edge).'],
    checks: [
      { label: 'the squares come back in order', code: `try (var watcher = Executors.newVirtualThreadPerTaskExecutor()) {
    var result = watcher.submit(c.task(() -> c.eq(c.call("squares", List.of(1, 2, 3)), List.of(1, 4, 9))));
    try {
        result.get(3, TimeUnit.SECONDS);
    } catch (TimeoutException e) {
        c.fail("it never returned: the consumer does not know the numbers have ended");
    } catch (ExecutionException e) {
        throw e.getCause();
    } finally {
        watcher.shutdownNow();
    }
}` },
      { label: 'it ends on an empty list too', code: `try (var watcher = Executors.newVirtualThreadPerTaskExecutor()) {
    var result = watcher.submit(c.task(() -> c.eq(c.call("squares", List.of()), List.of())));
    try {
        result.get(3, TimeUnit.SECONDS);
    } catch (TimeoutException e) {
        c.fail("it never returned: the consumer does not know the numbers have ended");
    } catch (ExecutionException e) {
        throw e.getCause();
    } finally {
        watcher.shutdownNow();
    }
}` },
      { label: 'many numbers through a small queue', code: `var in = new ArrayList<Integer>();
var want = new ArrayList<Integer>();
for (int i = 1; i <= 5000; i++) { in.add(i); want.add(i * i); }
try (var watcher = Executors.newVirtualThreadPerTaskExecutor()) {
    var result = watcher.submit(c.task(() -> c.eq(c.call("squares", in), want)));
    try {
        result.get(3, TimeUnit.SECONDS);
    } catch (TimeoutException e) {
        c.fail("it never returned: the consumer does not know the numbers have ended");
    } catch (ExecutionException e) {
        throw e.getCause();
    } finally {
        watcher.shutdownNow();
    }
}` },
      { label: 'the queue is bounded: capacity 2', idiom: true, code: `c.ok(c.uses("ArrayBlockingQueue"), "use an ArrayBlockingQueue: its bound is what makes a fast producer wait");` }
    ]
  });

  K.push({
    id: 'rw-pool-to-virtual', level: 'Easy', kind: 'rewrite', title: 'A pool you no longer need',
    summary: 'A fixed pool, a guessed size, and a manual shutdown become one line.',
    patterns: ['virtual'], keywords: ['newFixedThreadPool', 'newVirtualThreadPerTaskExecutor', 'try-with-resources', 'shutdown', 'awaitTermination'],
    learn: ['lesson:vt-why', 'then:thread-per-task'],
    java: 'The most common first step of a migration. The pool\'s size was a guess about latency, and it was also a limit: if something downstream needs one, keep it as a real one ([[lesson:sp-migrate]]).',
    task: 'This works. Rewrite it the Java 25 way: no pool, a virtual thread per task, and try-with-resources instead of `shutdown` and `awaitTermination`. It must return the same answers.',
    files: [SERVICE],
    starter: `// Works today. Rewrite: no pool, a virtual thread per task, try-with-resources.
List<String> fetchAll(Service service, List<String> ids) throws Exception {
    ExecutorService pool = Executors.newFixedThreadPool(8);
    try {
        List<Future<String>> futures = new ArrayList<>();
        for (String id : ids) {
            futures.add(pool.submit(() -> service.fetch(id)));
        }
        List<String> answers = new ArrayList<>();
        for (Future<String> f : futures) {
            answers.add(f.get());
        }
        return answers;
    } finally {
        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.MINUTES);
    }
}

void main() throws Exception {
    Service service = id -> "answer " + id;
    IO.println(fetchAll(service, List.of("a", "b")));
}`,
    solution: `List<String> fetchAll(Service service, List<String> ids) throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var futures = ids.stream().map(id -> executor.submit(() -> service.fetch(id))).toList();
        var answers = new ArrayList<String>();
        for (var f : futures) {
            answers.add(f.get());
        }
        return answers;
    }
}

void main() throws Exception {
    Service service = id -> "answer " + id;
    IO.println(fetchAll(service, List.of("a", "b")));
}`,
    hints: ['`try (var executor = Executors.newVirtualThreadPerTaskExecutor()) { … }`: `close()` does the waiting.', 'Everything inside stays as it was.'],
    checks: [
      { label: 'the same answers, in order', code: `Service service = id -> "answer " + id;
c.eq(c.call("fetchAll", service, List.of("a", "b", "c")), List.of("answer a", "answer b", "answer c"));` },
      { label: 'the calls run at the same time', code: `var probe = c.probe(4);
Service service = id -> { probe.meet(); return id; };
c.call("fetchAll", service, List.of("a", "b", "c", "d"));
c.ok(probe.peak() == 4, "at most " + probe.peak() + " at once");` },
      { label: 'each call runs on a virtual thread', idiom: true, code: `var probe = c.probe(1);
Service service = id -> { probe.sleep(1); return id; };
c.call("fetchAll", service, List.of("a", "b"));
c.ok(probe.allVirtual(), probe.platformCalls() + " calls ran on a platform thread");` },
      { label: 'try-with-resources does the shutting down', idiom: true, code: `c.ok(c.uses("try [(]") && !c.uses("awaitTermination"), "close() does the waiting: no shutdown, no awaitTermination");` }
    ]
  });

  K.push({
    id: 'rw-threadlocal-to-scoped', level: 'Easy', kind: 'rewrite', title: 'From ThreadLocal to a scoped value',
    summary: 'A set, a restore in a finally, and a remove become one binding that cannot leak.',
    patterns: ['context'], keywords: ['ThreadLocal', 'ScopedValue', 'where', 'call', 'orElse', 'tenant', 'context'],
    learn: ['lesson:sv-basics', 'lesson:sv-inheritance'],
    java: 'The current user or tenant, set by a filter. A forgotten `remove()` leaves one user\'s identity on a pooled thread for the next request. A scoped value ends with its block, whatever happens.',
    task: 'This works. Rewrite it with a `ScopedValue`: `currentUser()` returns the user bound now, or `"nobody"`; `asUser(user, work)` runs `work` with `user` bound, and a nested `asUser` must restore the outer user afterwards.',
    files: [{ name: 'Unchecked.java', code: `import java.util.concurrent.Callable;
import java.util.function.Supplier;

/** Turns a call that may throw into a Supplier, for the checks. */
public final class Unchecked {
    public static <T> Supplier<T> of(Callable<T> call) {
        return () -> {
            try {
                return call.call();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };
    }
}
` }],
    starter: `// Works today. Rewrite with a ScopedValue: no set, no restore, no remove.
static final ThreadLocal<String> USER = new ThreadLocal<>();

String currentUser() {
    String user = USER.get();
    return user == null ? "nobody" : user;
}

String asUser(String user, Supplier<String> work) {
    String before = USER.get();
    USER.set(user);
    try {
        return work.get();
    } finally {
        if (before == null) USER.remove();
        else USER.set(before);
    }
}

void main() {
    IO.println(asUser("ravi", () -> currentUser()));
}`,
    solution: `static final ScopedValue<String> USER = ScopedValue.newInstance();

String currentUser() {
    return USER.orElse("nobody");
}

String asUser(String user, Supplier<String> work) {
    return ScopedValue.where(USER, user).call(work::get);
}

void main() {
    IO.println(asUser("ravi", () -> currentUser()));
}`,
    hints: ['`static final ScopedValue<String> USER = ScopedValue.newInstance();`', '`ScopedValue.where(USER, user).call(work::get)` binds it for exactly that call.', '`USER.orElse("nobody")` reads it, or gives the default when it is not bound.'],
    checks: [
      { label: 'outside any binding, it is nobody', code: `c.eq(c.call("currentUser"), "nobody");` },
      { label: 'inside, the work sees the user', code: `Supplier<String> work = Unchecked.of(c.callable("currentUser"));
c.eq(c.call("asUser", "ravi", work), "ravi");
c.eq(c.call("currentUser"), "nobody");` },
      { label: 'a nested binding restores the outer one', code: `Supplier<String> who = Unchecked.of(c.callable("currentUser"));
Supplier<String> nested = () -> {
    try {
        String inner = c.call("asUser", "inner", who);
        return inner + " then " + c.call("currentUser");
    } catch (Throwable t) {
        throw new RuntimeException(t);
    }
};
c.eq(c.call("asUser", "outer", nested), "inner then outer");` },
      { label: 'it is gone even when the work throws', code: `Supplier<String> bad = () -> { throw new IllegalStateException("boom"); };
try {
    c.call("asUser", "ravi", bad);
} catch (Throwable t) {
}
c.eq(c.call("currentUser"), "nobody");` },
      { label: 'it uses a ScopedValue, so there is nothing to forget', idiom: true, code: `c.ok(c.uses("ScopedValue") && !c.uses("ThreadLocal"), "still a ThreadLocal: use a ScopedValue, which ends with its block");` }
    ]
  });

  K.push({
    id: 'rw-dcl-to-holder', level: 'Easy', kind: 'rewrite', title: 'Double-checked locking, retired',
    summary: 'Lazy and thread-safe, with no volatile and no lock: let the class loader do it.',
    patterns: ['lazy'], keywords: ['double-checked locking', 'holder idiom', 'lazy', 'volatile', 'singleton', 'class initialization'],
    learn: ['lesson:sv-lazy-init'],
    java: 'Lazily made expensive objects. Double-checked locking works only with `volatile`, and reviewers check it every time. The holder idiom cannot be got wrong. (A slow `static` block can pin a virtual thread: [[lesson:vt-pinning]].)',
    task: 'This works. Rewrite `config()` with the **holder idiom**: a nested class whose `static final` field calls `Loader.load()`. Still lazy (nothing is loaded until the first call), still loaded only once, with no `volatile` and no `synchronized`.',
    files: [{ name: 'Loader.java', code: `import java.util.concurrent.atomic.AtomicInteger;

/** Loading the config takes a moment, and must happen once. */
public final class Loader {
    private static final AtomicInteger loads = new AtomicInteger();

    public static String load() {
        loads.incrementAndGet();
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return "the config";
    }

    public static int loads() { return loads.get(); }
}
` }],
    starter: `// Works today. Rewrite: the holder idiom, no volatile, no synchronized.
private static volatile String config;

String config() {
    String local = config;
    if (local == null) {
        synchronized (Loader.class) {
            local = config;
            if (local == null) {
                config = local = Loader.load();
            }
        }
    }
    return local;
}

void main() {
    IO.println("the checks call config()");
}`,
    solution: `static class Holder {
    static final String CONFIG = Loader.load();
}

String config() {
    return Holder.CONFIG;
}

void main() {
    IO.println("the checks call config()");
}`,
    hints: ['A nested class is initialised the first time it is used, and the JVM makes sure that happens once.', '`static class Holder { static final String CONFIG = Loader.load(); }`, and `return Holder.CONFIG;`'],
    checks: [
      { label: 'nothing is loaded before the first call', code: `c.eq(Loader.loads(), 0);` },
      { label: 'from 50 threads at once, the first calls, it loads only once', code: `var start = new CountDownLatch(1);
var answers = new ConcurrentLinkedQueue<Object>();
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 50; i++) {
        ex.submit(c.task(() -> { start.await(); answers.add(c.call("config")); }));
    }
    start.countDown();
}
c.eq(Loader.loads(), 1);
c.eq(new HashSet<>(answers), Set.of("the config"));` },
      { label: 'no volatile, no lock', idiom: true, code: `c.ok(!c.uses("volatile") && !c.uses("synchronized"), "the class loader does the locking for you: no volatile, no synchronized");` }
    ]
  });
})(window.JCLT);
