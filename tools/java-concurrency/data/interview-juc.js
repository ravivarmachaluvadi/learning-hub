/*
 * data/interview-juc.js - the interview questions on the java.util.concurrent toolkit (batch 3).
 * The shape is described at the top of data/interview-virtual-threads.js.
 */
(function (U) {
  'use strict';
  function jv(code) { return '```java\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];
  var API = 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/';

  Q.push({
    id: 'juc-pool-params', track: 'juc', weight: 3,
    q: 'Explain ThreadPoolExecutor\'s parameters, and what happens when a task is submitted.',
    keywords: ['ThreadPoolExecutor', 'core pool size', 'maximum pool size', 'queue', 'rejection policy', 'keep-alive', 'CallerRunsPolicy', 'AbortPolicy'],
    short: 'Core size, maximum size, keep-alive (for threads above the core), the work queue, the thread factory and the rejection handler. A new task goes to a new thread while there are fewer than **core**; then to the **queue**; when the queue is full, to a new thread up to **max**; then to the **rejection handler** (`AbortPolicy` throws, `CallerRunsPolicy` runs it on the submitter, two others discard). So with an unbounded queue (`newFixedThreadPool`\'s) the pool never grows past core, and overload shows only as a growing queue.',
    answer: jv(`void main() throws InterruptedException {
    var pool = new ThreadPoolExecutor(1, 2, 60, TimeUnit.SECONDS, new ArrayBlockingQueue<>(1));
    var hold = new CountDownLatch(1);
    Runnable busy = () -> { try { hold.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } };
    pool.execute(busy);
    pool.execute(busy);
    IO.println("after 2 tasks: " + pool.getPoolSize() + " thread, " + pool.getQueue().size() + " queued");
    pool.execute(busy);
    IO.println("after 3 tasks: " + pool.getPoolSize() + " threads, " + pool.getQueue().size() + " queued");
    try {
        pool.execute(busy);
    } catch (RejectedExecutionException e) {
        IO.println("the 4th task: rejected");
    }
    hold.countDown();
    pool.close();
}`) + '\n\n' + out(`after 2 tasks: 1 thread, 1 queued
after 3 tasks: 2 threads, 1 queued
the 4th task: rejected`),
    followups: ['Why does a fixed pool use an unbounded queue, and what is the risk?', 'Which rejection policy gives back pressure?', 'What does Spring Boot configure for @Async?'],
    related: ['lesson:juc-executors', 'q:juc-pool-size'],
    docs: API + 'ThreadPoolExecutor.html'
  });

  Q.push({
    id: 'juc-pool-size', track: 'juc', weight: 2,
    q: 'How big should a thread pool be?',
    keywords: ['pool size', 'pool sizing', 'cpu-bound', 'io-bound', 'goetz formula', 'little\'s law', 'availableProcessors'],
    short: 'For CPU-bound work, about the number of processors (`availableProcessors()`, sometimes + 1): more only adds switching. For tasks that wait, processors × (1 + wait time / compute time) (Goetz), which is Little\'s law: enough threads to keep the processors busy while others wait. Then measure, since the wait time is a guess about other services. On Java 21+, waiting tasks need no pool at all: a virtual thread each, and a `Semaphore` where a real limit exists (a connection pool, a partner\'s rate limit).',
    answer: jv(`int poolSize(int cores, double waitMs, double computeMs) {
    return (int) Math.ceil(cores * (1 + waitMs / computeMs));
}

void main() {
    IO.println("8 cores, computing:              " + poolSize(8, 0, 10));
    IO.println("8 cores, waits 190 ms per 10 ms: " + poolSize(8, 190, 10));
}`) + '\n\n' + out(`8 cores, computing:              8
8 cores, waits 190 ms per 10 ms: 160`),
    followups: ['What changes with virtual threads?', 'How do you size a database connection pool?'],
    related: ['lesson:juc-executors', 'lesson:vt-why', 'q:vt-littles-law'],
    docs: API + 'ThreadPoolExecutor.html'
  });

  Q.push({
    id: 'juc-future-vs-completablefuture', track: 'juc', weight: 3,
    q: 'Future or CompletableFuture: what is the difference?',
    keywords: ['Future', 'CompletableFuture', 'thenApply', 'thenCompose', 'thenCombine', 'exceptionally', 'callback', 'composition', 'cancel'],
    short: 'A `Future` only lets you wait (`get`), cancel and ask its state: combining two means two blocking waits, and failure handling is a `try` around `get`. A `CompletableFuture` (Java 8) is also a `CompletionStage`: you attach what happens next (`thenApply`, `thenCompose`, `thenCombine`, `allOf`), recover (`exceptionally`, `handle`) and add deadlines (`orTimeout`, `completeOnTimeout`), without blocking a thread. Two differences that bite: `cancel(true)` on a `CompletableFuture` does **not** interrupt the task (it does for an executor\'s `Future`), and `supplyAsync` without an executor runs on the common pool.',
    answer: jv(`void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<Integer> a = executor.submit(() -> 20);
        Future<Integer> b = executor.submit(() -> 22);
        IO.println("Future: two waits, " + (a.get() + b.get()));
        var x = CompletableFuture.supplyAsync(() -> 20, executor);
        var y = CompletableFuture.supplyAsync(() -> 22, executor);
        IO.println("CompletableFuture: one pipeline, " + x.thenCombine(y, Integer::sum).join());
    }
}`) + '\n\n' + out(`Future: two waits, 42
CompletableFuture: one pipeline, 42`),
    followups: ['What does exceptionally receive after an async failure?', 'Why pass an executor to supplyAsync?', 'How does a StructuredTaskScope compare?'],
    related: ['lesson:juc-futures', 'lesson:juc-completable', 'q:sc-vs-completablefuture'],
    docs: API + 'CompletableFuture.html'
  });

  Q.push({
    id: 'juc-callable-runnable', track: 'juc', weight: 1,
    q: 'Runnable or Callable?',
    keywords: ['Runnable', 'Callable', 'submit', 'execute', 'checked exception', 'Future'],
    short: '`Runnable.run()` returns nothing and cannot throw a checked exception; `Callable<V>.call()` returns a `V` and may throw `Exception`. `submit` takes both and returns a `Future` (whose `get()` gives `null` for a `Runnable`); `execute` takes only a `Runnable`. A lambda that returns a value is a `Callable`, so it may call `Thread.sleep` without a `try`.',
    answer: jv(`void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Callable<String> callable = () -> { Thread.sleep(10); return "a value"; };
        Runnable runnable = () -> IO.println("ran, returned nothing");
        IO.println(executor.submit(callable).get());
        IO.println(executor.submit(runnable).get());
    }
}`) + '\n\n' + out(`a value
ran, returned nothing
null`),
    followups: ['Why does a lambda with no return value fail to compile when it calls Thread.sleep?'],
    related: ['lesson:juc-futures'],
    docs: API + 'Callable.html'
  });

  Q.push({
    id: 'juc-lock-vs-synchronized', track: 'juc', weight: 3,
    q: 'ReentrantLock or synchronized: when would you choose each?',
    keywords: ['ReentrantLock', 'synchronized', 'tryLock', 'lockInterruptibly', 'fairness', 'Condition', 'pinning', 'virtual threads'],
    short: 'Both are reentrant, exclusive and give the same visibility. `synchronized` is simpler and is released automatically; prefer it. Choose `ReentrantLock` when you need what it adds: `tryLock` (with a timeout, to avoid deadlock or skip work), `lockInterruptibly` (a thread blocked on `synchronized` ignores interrupts), fairness, or several `Condition`s on one lock. The old reason, that `synchronized` pins virtual threads, applied to Java 21 to 23 and not since Java 24 (JEP 491).',
    answer: jv(`void main() throws InterruptedException {
    var lock = new ReentrantLock();
    lock.lock();
    Thread other = Thread.ofPlatform().start(() -> {
        try {
            IO.println("other got it within 50 ms: " + lock.tryLock(50, TimeUnit.MILLISECONDS));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    other.join();
    lock.unlock();
}`) + '\n\n' + out('other got it within 50 ms: false'),
    followups: ['Why must unlock() be in finally?', 'What is a fair lock, and what does it cost?', 'What is a StampedLock\'s optimistic read?'],
    related: ['lesson:juc-locks', 'lesson:th-synchronized', 'lesson:vt-pinning'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html'
  });

  Q.push({
    id: 'juc-cas', track: 'juc', weight: 2,
    q: 'What is CAS, and how do atomic classes use it?',
    keywords: ['cas', 'compare-and-set', 'compare-and-swap', 'AtomicInteger', 'lock-free', 'aba', 'LongAdder'],
    short: 'Compare-and-set: a processor instruction that writes a new value only if the location still holds the expected one, and reports success. Atomic classes build on it with a loop: read, compute, CAS, retry if another thread changed it meanwhile. No thread ever blocks (lock-free), but under heavy contention the retries cost, which is why `LongAdder` spreads a counter over cells. The ABA problem: the value went A→B→A and the CAS cannot tell; `AtomicStampedReference` adds a version.',
    answer: jv(`int incrementAndGet(AtomicInteger n) {
    while (true) {
        int current = n.get();
        if (n.compareAndSet(current, current + 1)) return current + 1;
    }
}

void main() {
    var n = new AtomicInteger();
    try (var executor = Executors.newFixedThreadPool(4)) {
        for (int t = 0; t < 4; t++) executor.submit(() -> { for (int i = 0; i < 25_000; i++) incrementAndGet(n); });
    }
    IO.println(n.get());
}`) + '\n\n' + out('100000'),
    followups: ['When is LongAdder better than AtomicLong?', 'Why must updateAndGet\'s function have no side effects?', 'How is optimistic locking in a database like CAS?'],
    related: ['lesson:juc-atomics', 'lesson:th-races'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/package-summary.html'
  });

  Q.push({
    id: 'juc-concurrenthashmap', track: 'juc', weight: 3,
    q: 'How is ConcurrentHashMap different from Hashtable and Collections.synchronizedMap?',
    keywords: ['ConcurrentHashMap', 'Hashtable', 'synchronizedMap', 'computeIfAbsent', 'merge', 'weakly consistent', 'null', 'bin lock'],
    short: 'The other two lock the whole map for every call. `ConcurrentHashMap` reads without locking and locks only one bin for a write (since Java 8; earlier versions used segments), so many threads write at once. Its iterators are weakly consistent: no `ConcurrentModificationException`, changes during iteration may or may not show. It refuses `null` keys and values. Above all it has atomic per-key operations (`putIfAbsent`, `computeIfAbsent`, `compute`, `merge`), because a `get` then a `put`, even on a concurrent map, is a race.',
    answer: jv(`void main() {
    var hits = new ConcurrentHashMap<String, Integer>();
    try (var executor = Executors.newFixedThreadPool(8)) {
        for (int i = 0; i < 10_000; i++) {
            String page = i % 2 == 0 ? "/home" : "/cart";
            executor.submit(() -> hits.merge(page, 1, Integer::sum));
        }
    }
    IO.println(new TreeMap<>(hits));
}`) + '\n\n' + out('{/cart=5000, /home=5000}'),
    followups: ['Why does ConcurrentHashMap not allow null?', 'What must the function in computeIfAbsent not do?', 'Is size() exact while other threads write?'],
    related: ['lesson:juc-collections', 'lesson:th-races'],
    docs: API + 'ConcurrentHashMap.html'
  });

  Q.push({
    id: 'juc-latch-barrier', track: 'juc', weight: 2,
    q: 'CountDownLatch, CyclicBarrier and Semaphore: what does each do?',
    keywords: ['CountDownLatch', 'CyclicBarrier', 'Semaphore', 'Phaser', 'synchronizer', 'permits', 'start gate'],
    short: 'A `CountDownLatch` waits until a count reaches zero, once (a start gate, or waiting for n workers or services). A `CyclicBarrier` makes a fixed number of threads meet, round after round, with an optional action at each meeting; an interrupted waiter breaks it for all. A `Semaphore` hands out n permits: at most n threads in a section (a bulkhead, a limit on calls to a scarce resource). A `Phaser` is a barrier whose parties can join and leave.',
    answer: jv(`void main() throws InterruptedException {
    var ready = new CountDownLatch(3);
    for (String cache : List.of("users", "prices", "stock")) {
        Thread.ofVirtual().start(() -> {
            IO.println(cache + " warmed");
            ready.countDown();
        });
    }
    ready.await();
    IO.println("all caches warm: " + (ready.getCount() == 0));
}`) + '\n\n' + '(The three "warmed" lines print in any order; the last line always comes last.)',
    followups: ['Which can be reused?', 'What happens to a barrier when one waiter is interrupted?', 'Why does a Semaphore not check who releases?'],
    related: ['lesson:juc-synchronizers', 'lesson:vt-limit'],
    docs: API + 'package-summary.html'
  });

  Q.push({
    id: 'juc-forkjoin', track: 'juc', weight: 2,
    q: 'What is work stealing, and when do parallel streams help or hurt?',
    keywords: ['work stealing', 'ForkJoinPool', 'RecursiveTask', 'parallel stream', 'common pool', 'fork', 'join'],
    short: 'In a `ForkJoinPool` each worker has its own deque: it pushes the subtasks it forks and pops the newest, and an idle worker steals the oldest (the biggest piece) from another. Parallel streams run on the common pool (processors − 1 workers) plus the calling thread. They help for large, CPU-bound, side-effect-free work on sources that split well (arrays, `ArrayList`, ranges). They hurt for small inputs, `LinkedList` or I/O sources, shared mutable state (`forEach(list::add)` is a race), and blocking calls, which starve the pool every other parallel stream in the JVM uses.',
    answer: jv(`void main() {
    long sum = LongStream.rangeClosed(1, 1_000_000).parallel().sum();
    IO.println("parallel sum: " + sum);
    IO.println("reduce with a bad identity: " + IntStream.rangeClosed(1, 4).parallel().reduce(10, Integer::sum));
}`) + '\n\n' + out(`parallel sum: 500000500000
reduce with a bad identity: 50`),
    followups: ['Why fork one half and compute the other?', 'How do you run a parallel stream on your own pool?', 'What should you use for blocking calls in a stream?'],
    related: ['lesson:juc-forkjoin', 'lesson:sv-map-concurrent'],
    docs: API + 'ForkJoinPool.html'
  });
})(window.JCLT);
