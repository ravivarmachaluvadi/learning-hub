/*
 * Predict the output (batch 5): short programs, each built around one trap of concurrent Java
 * (views/predict.js, and the mock interview's predictions).
 *
 * Shape: {id, topic, code, output, guess, trap, why, learn}
 *   topic   threads, memory, locks, interrupts, executors, futures, collections, synchronizers, streams, virtual,
 *           structured, scoped (views/predict.js names them)
 *   code    a whole program of 4 to 26 lines
 *   output  exactly what it prints (tests/test_content.py runs it twice and requires it)
 *   guess   the answer most people give: shown, with `trap` (why it is tempting), after a wrong answer
 *   why     what really happens (Markdown); learn: where it is taught
 * Each program's order is fixed by the code (a join, a latch), so it prints the same on every run.
 */
(function (U) {
  'use strict';
  var P = U.data.predictions = U.data.predictions || [];

  P.push(
    { id: 'run-not-start', topic: 'threads',
      code: `void main() {
    Thread t = new Thread(() -> IO.println("on " + Thread.currentThread().getName()), "worker");
    t.run();
    IO.println(t.getState());
}`,
      output: 'on main\nNEW', guess: 'on worker\nTERMINATED',
      trap: 'It looks like the thread ran.', why: '`run()` is an ordinary method call, on the caller. Only `start()` makes a thread, so this one was never started: it is still `NEW`.',
      learn: ['lesson:th-basics'] },
    { id: 'start-twice', topic: 'threads',
      code: `void main() throws Exception {
    Thread t = new Thread(() -> { });
    t.start();
    t.join();
    try {
        t.start();
        IO.println("again");
    } catch (IllegalThreadStateException e) {
        IO.println("refused");
    }
}`,
      output: 'refused', guess: 'again',
      trap: 'The thread has finished, so it seems free to run again.', why: 'A thread starts once in its life. To run the work again, make a new one.',
      learn: ['lesson:th-basics'] },
    { id: 'uncaught-stays', topic: 'threads',
      code: `void main() throws Exception {
    Thread t = new Thread(() -> { throw new IllegalStateException("boom"); });
    t.setUncaughtExceptionHandler((th, e) -> IO.println("heard: " + e.getMessage()));
    t.start();
    t.join();
    IO.println("main carries on");
}`,
      output: 'heard: boom\nmain carries on', guess: 'heard: boom',
      trap: 'An exception feels as if it should stop the program.', why: 'An uncaught exception ends **only its own thread**. `main` is not told: it carries on, and a `join` returns normally.',
      learn: ['lesson:th-basics'] },
    { id: 'daemon-from-parent', topic: 'threads',
      code: `void main() throws Exception {
    Thread parent = new Thread(() -> {
        Thread child = new Thread(() -> { });
        IO.println("child daemon: " + child.isDaemon());
    });
    parent.setDaemon(true);
    parent.start();
    parent.join();
}`,
      output: 'child daemon: true', guess: 'child daemon: false',
      trap: 'Threads are not daemons unless you say so.', why: 'A new platform thread **inherits** daemon status from the thread that makes it.',
      learn: ['lesson:th-basics'] },
    { id: 'join-then-read', topic: 'memory',
      code: `int value = 0;

void main() throws Exception {
    Thread t = new Thread(() -> value = 42);
    t.start();
    t.join();
    IO.println(value);
}`,
      output: '42', guess: '0',
      trap: '`value` is neither `volatile` nor guarded, so main might not see the write.', why: '`join` is a happens-before edge: everything the thread did is visible after it returns. This program is correctly synchronized, with no `volatile` in sight.',
      learn: ['lesson:th-visibility', 'explain:lost-update'] },
    { id: 'static-vs-instance-lock', topic: 'locks',
      code: `static synchronized void a(CountDownLatch both) throws Exception {
    both.countDown();
    IO.println("a met b: " + both.await(1, TimeUnit.SECONDS));
}

synchronized void b(CountDownLatch both) throws Exception {
    both.countDown();
    both.await(1, TimeUnit.SECONDS);
}

void main() throws Exception {
    var both = new CountDownLatch(2);
    Thread t = Thread.ofVirtual().start(() -> {
        try { a(both); } catch (Exception e) { }
    });
    b(both);
    t.join();
}`,
      output: 'a met b: true', guess: 'a met b: false',
      trap: 'Both methods are `synchronized`, so one should wait for the other.', why: 'They hold **different locks**: a `static synchronized` method locks the class, an instance one locks `this`. So they run at the same time.',
      learn: ['lesson:th-synchronized'] },
    { id: 'reentrant', topic: 'locks',
      code: `synchronized void outer() {
    IO.println("outer");
    inner();
}

synchronized void inner() {
    IO.println("inner");
}

void main() {
    outer();
}`,
      output: 'outer\ninner', guess: 'outer',
      trap: '`inner` needs a lock the thread is already holding, which sounds like a deadlock.', why: 'Monitors are **reentrant**: a thread that holds one may take it again.',
      learn: ['lesson:th-synchronized'] },
    { id: 'wait-without-monitor', topic: 'locks',
      code: `void main() throws Exception {
    Object lock = new Object();
    try {
        lock.wait(10);
        IO.println("waited");
    } catch (IllegalMonitorStateException e) {
        IO.println(e.getMessage());
    }
}`,
      output: 'current thread is not owner', guess: 'waited',
      trap: '`wait` looks like a sleep you can call any time.', why: 'You must hold an object\'s monitor to `wait` on it. A wait gives the monitor up, so there must be one to give.',
      learn: ['lesson:th-wait-notify'] },
    { id: 'trylock-reentrant', topic: 'locks',
      code: `import java.util.concurrent.locks.*;

void main() {
    var lock = new ReentrantLock();
    lock.lock();
    IO.println(lock.tryLock());
    IO.println(lock.getHoldCount());
    lock.unlock();
    IO.println(lock.isLocked());
    lock.unlock();
    IO.println(lock.isLocked());
}`,
      output: 'true\n2\ntrue\nfalse', guess: 'false\n1\nfalse\nfalse',
      trap: 'The lock is already held, so `tryLock` should fail.', why: 'It is held **by this thread**, so it succeeds and counts a second hold. Each `lock` needs its own `unlock`.',
      learn: ['lesson:juc-locks'] },
    { id: 'interrupt-clears', topic: 'interrupts',
      code: `void main() {
    Thread.currentThread().interrupt();
    try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        IO.println(e.getMessage());
    }
    IO.println(Thread.currentThread().isInterrupted());
}`,
      output: 'sleep interrupted\nfalse', guess: 'sleep interrupted\ntrue',
      trap: 'The thread was interrupted, so surely it still says so.', why: 'Throwing `InterruptedException` **clears the flag**. That is why code that catches it must set it again, or the caller never knows.',
      learn: ['lesson:th-interrupts'] },
    { id: 'interrupted-reads-and-clears', topic: 'interrupts',
      code: `void main() {
    Thread.currentThread().interrupt();
    IO.println(Thread.interrupted());
    IO.println(Thread.interrupted());
    Thread.currentThread().interrupt();
    IO.println(Thread.currentThread().isInterrupted());
    IO.println(Thread.currentThread().isInterrupted());
}`,
      output: 'true\nfalse\ntrue\ntrue', guess: 'true\ntrue\ntrue\ntrue',
      trap: 'Two calls that read a flag should agree.', why: 'The static `Thread.interrupted()` reads **and clears**. The instance `isInterrupted()` only reads.',
      learn: ['lesson:th-interrupts'] },
    { id: 'interrupt-cpu-loop', topic: 'interrupts',
      code: `void main() throws Exception {
    var sum = new AtomicLong();
    Thread t = Thread.ofPlatform().start(() -> {
        for (int i = 0; i < 200_000_000; i++) sum.lazySet(i);
        IO.println("ran to the end");
    });
    t.interrupt();
    t.join();
    IO.println("flag was only a flag");
}`,
      output: 'ran to the end\nflag was only a flag', guess: 'flag was only a flag',
      trap: '`interrupt()` sounds as if it stops the thread.', why: 'It only sets a flag. Blocking calls notice it; a CPU loop must check for itself, and this one does not.',
      learn: ['lesson:th-interrupts'] },
    { id: 'submit-swallows', topic: 'executors',
      code: `void main() throws Exception {
    try (var pool = Executors.newFixedThreadPool(1)) {
        pool.submit(() -> { throw new IllegalStateException("boom"); });
        pool.execute(() -> IO.println("next task ran"));
    }
    IO.println("nothing was printed about boom");
}`,
      output: 'next task ran\nnothing was printed about boom', guess: 'boom\nnext task ran\nnothing was printed about boom',
      trap: 'An exception on a thread normally prints a stack trace.', why: '`submit` keeps the exception in the `Future`, for a `get()` that never comes. With `execute` it would reach the uncaught handler and print.',
      learn: ['lesson:juc-futures'] },
    { id: 'submit-after-close', topic: 'executors',
      code: `void main() {
    var pool = Executors.newFixedThreadPool(1);
    pool.close();
    try {
        pool.submit(() -> IO.println("ran"));
    } catch (RejectedExecutionException e) {
        IO.println("rejected");
    }
    IO.println(pool.isShutdown());
}`,
      output: 'rejected\ntrue', guess: 'ran\ntrue',
      trap: 'A pool seems reusable, like a list.', why: 'Once closed, a pool takes no more work, and a new one is cheap to make.',
      learn: ['lesson:juc-executors'] },
    { id: 'core-then-queue', topic: 'executors',
      code: `void main() throws Exception {
    var pool = new ThreadPoolExecutor(1, 5, 1, TimeUnit.SECONDS, new LinkedBlockingQueue<>());
    var hold = new CountDownLatch(1);
    for (int i = 0; i < 4; i++) {
        pool.execute(() -> {
            try { hold.await(); } catch (InterruptedException e) { }
        });
    }
    IO.println(pool.getPoolSize() + " thread, " + pool.getQueue().size() + " queued");
    hold.countDown();
    pool.close();
}`,
      output: '1 thread, 3 queued', guess: '4 thread, 0 queued',
      trap: 'The maximum is 5 and work is waiting, so it should grow.', why: 'Order: core threads, then the **queue**, then up to max. An unbounded queue is never full, so the pool never grows past core.',
      learn: ['lesson:juc-executors'] },
    { id: 'invokeall-order', topic: 'executors',
      code: `void main() throws Exception {
    try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Callable<String>> tasks = List.of(
            () -> { Thread.sleep(100); return "slow"; },
            () -> "fast");
        for (var f : ex.invokeAll(tasks)) IO.println(f.get());
    }
}`,
      output: 'slow\nfast', guess: 'fast\nslow',
      trap: 'The fast one finishes first.', why: '`invokeAll` waits for all and returns futures in the order of the **tasks**, not the order they finished.',
      learn: ['lesson:juc-futures'] },
    { id: 'get-wraps', topic: 'futures',
      code: `void main() throws Exception {
    try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
        var f = ex.submit(() -> { throw new IllegalStateException("boom"); });
        try {
            f.get();
        } catch (Exception e) {
            IO.println(e.getClass().getSimpleName());
            IO.println(e.getCause().getClass().getSimpleName());
        }
    }
}`,
      output: 'ExecutionException\nIllegalStateException', guess: 'IllegalStateException\nnull',
      trap: 'The task threw an `IllegalStateException`.', why: '`get()` wraps it. The real failure is the **cause**.',
      learn: ['lesson:juc-futures', 'q:juc-pool-params'] },
    { id: 'cancel-then-get', topic: 'futures',
      code: `void main() throws Exception {
    var f = new CompletableFuture<String>();
    IO.println(f.cancel(true));
    IO.println(f.isDone());
    IO.println(f.isCompletedExceptionally());
    try {
        f.get();
    } catch (CancellationException e) {
        IO.println("cancelled");
    }
}`,
      output: 'true\ntrue\ntrue\ncancelled', guess: 'true\nfalse\nfalse\ncancelled',
      trap: 'A cancelled task did not finish.', why: 'Cancelled counts as **done**, and for a `CompletableFuture` as completed exceptionally. `get()` throws `CancellationException`, unwrapped.',
      learn: ['lesson:juc-futures', 'lesson:juc-completable'] },
    { id: 'complete-once', topic: 'futures',
      code: `void main() {
    var f = new CompletableFuture<String>();
    IO.println(f.complete("first"));
    IO.println(f.complete("second"));
    IO.println(f.join());
}`,
      output: 'true\nfalse\nfirst', guess: 'true\ntrue\nsecond',
      trap: 'A later value looks like an update.', why: 'A `CompletableFuture` completes **once**; later attempts return `false` and change nothing. (`obtrudeValue` exists, and you should not use it.)',
      learn: ['lesson:juc-completable'] },
    { id: 'thenapply-skips', topic: 'futures',
      code: `void main() {
    var f = CompletableFuture.<Integer>failedFuture(new IllegalStateException("boom"))
        .thenApply(x -> { IO.println("thenApply ran"); return x + 1; })
        .exceptionally(e -> { IO.println(e.getClass().getSimpleName()); return -1; })
        .thenApply(x -> { IO.println("second thenApply ran"); return x * 2; });
    IO.println(f.join());
}`,
      output: 'CompletionException\nsecond thenApply ran\n-2', guess: 'thenApply ran\nIllegalStateException\nsecond thenApply ran\n-2',
      trap: 'Each stage should run, and `exceptionally` sees what was thrown.', why: 'A failure skips `thenApply`. And from a **dependent** stage, `exceptionally` sees a `CompletionException` wrapping the cause. After it recovers, the chain goes on as normal.',
      learn: ['lesson:juc-completable'] },
    { id: 'allof-null', topic: 'futures',
      code: `void main() {
    var a = CompletableFuture.completedFuture("a");
    var b = CompletableFuture.completedFuture("b");
    IO.println(CompletableFuture.allOf(a, b).join());
    IO.println(CompletableFuture.anyOf(a, b).join());
}`,
      output: 'null\na', guess: '[a, b]\na',
      trap: '`allOf` should give all the results.', why: '`allOf` is a `CompletableFuture<Void>`: it only says they have finished. Read each future\'s own result.',
      learn: ['lesson:juc-completable'] },
    { id: 'chm-null', topic: 'collections',
      code: `void main() {
    var hash = new HashMap<String, String>();
    hash.put("a", null);
    IO.println(hash.containsKey("a"));
    var concurrent = new ConcurrentHashMap<String, String>();
    try {
        concurrent.put("a", null);
    } catch (NullPointerException e) {
        IO.println("refused");
    }
}`,
      output: 'true\nrefused', guess: 'true\ntrue',
      trap: 'It is a `Map`, so it behaves like one.', why: 'On a concurrent map, `get` returning `null` must mean absent: no `containsKey` then `get` can be atomic. So null keys and values are refused.',
      learn: ['lesson:juc-collections', 'q:juc-concurrenthashmap'] },
    { id: 'recursive-compute', topic: 'collections',
      code: `void main() {
    var m = new ConcurrentHashMap<String, Integer>();
    try {
        m.computeIfAbsent("a", k -> m.computeIfAbsent("a", k2 -> 1));
        IO.println(m);
    } catch (IllegalStateException e) {
        IO.println(e.getMessage());
    }
}`,
      output: 'Recursive update', guess: '{a=1}',
      trap: 'It worked on `HashMap` in old code.', why: 'The function must not touch the map: it runs holding the bin\'s lock. Java detects this case and throws; a different key in the same bin may simply deadlock.',
      learn: ['lesson:juc-collections'] },
    { id: 'cow-snapshot', topic: 'collections',
      code: `void main() {
    var list = new CopyOnWriteArrayList<>(List.of(1, 2));
    for (int n : list) {
        list.add(n * 10);
    }
    IO.println(list);
}`,
      output: '[1, 2, 10, 20]', guess: 'ConcurrentModificationException',
      trap: 'Changing a list while looping over it throws.', why: 'Its iterator walks a **snapshot**: the loop sees 1 and 2 only, and each `add` copies the array. With an `ArrayList` it would throw.',
      learn: ['lesson:juc-collections'] },
    { id: 'hashmap-cme', topic: 'collections',
      code: `void main() {
    var plain = new ArrayList<>(List.of(1, 2, 3));
    try {
        for (int n : plain) {
            if (n == 1) plain.remove(Integer.valueOf(3));
        }
        IO.println("no exception");
    } catch (ConcurrentModificationException e) {
        IO.println("one thread, and still a ConcurrentModificationException");
    }
}`,
      output: 'one thread, and still a ConcurrentModificationException', guess: 'no exception',
      trap: 'There is only one thread, so nothing is concurrent.', why: 'The name misleads: it means the collection changed during iteration, by anyone. It is a bug detector, not a concurrency guarantee.',
      learn: ['lesson:juc-collections'] },
    { id: 'queue-add-vs-offer', topic: 'collections',
      code: `void main() {
    var q = new ArrayBlockingQueue<String>(1);
    IO.println(q.offer("a"));
    IO.println(q.offer("b"));
    try {
        q.add("c");
    } catch (IllegalStateException e) {
        IO.println(e.getMessage());
    }
    IO.println(q.size());
}`,
      output: 'true\nfalse\nQueue full\n1', guess: 'true\ntrue\ntrue\n3',
      trap: 'A queue keeps what you give it.', why: 'When full: `offer` returns `false`, `add` throws, and only `put` waits.',
      learn: ['lesson:juc-collections'] },
    { id: 'latch-below-zero', topic: 'synchronizers',
      code: `void main() throws Exception {
    var latch = new CountDownLatch(1);
    latch.countDown();
    latch.countDown();
    IO.println(latch.getCount());
    latch.await();
    IO.println("await returned");
}`,
      output: '0\nawait returned', guess: '-1\nawait returned',
      trap: 'Two counts down from 1 is -1.', why: 'It stops at zero, and a latch at zero stays open for good. It cannot be reset: that is what `CyclicBarrier` is for.',
      learn: ['lesson:juc-synchronizers'] },
    { id: 'semaphore-extra', topic: 'synchronizers',
      code: `void main() {
    var s = new Semaphore(1);
    s.release();
    s.release();
    IO.println(s.availablePermits());
    IO.println(s.tryAcquire(3));
    IO.println(s.availablePermits());
}`,
      output: '3\ntrue\n0', guess: '1\nfalse\n1',
      trap: 'A semaphore of 1 has at most one permit.', why: 'The number is only where it starts. `release` always adds, even if nobody acquired, which is why a `release` outside a matching `acquire` silently raises your limit.',
      learn: ['lesson:juc-synchronizers', 'kata:with-permit'] },
    { id: 'atomic-reference-identity', topic: 'synchronizers',
      code: `void main() {
    var small = new AtomicReference<>(100);
    var big = new AtomicReference<>(1000);
    IO.println(small.compareAndSet(100, 1));
    IO.println(big.compareAndSet(1000, 1));
    IO.println(big.get());
}`,
      output: 'true\nfalse\n1000', guess: 'true\ntrue\n1',
      trap: 'The values are equal, so compare-and-set should succeed.', why: '`AtomicReference` compares by **identity** (`==`). Autoboxing reuses `Integer`s from -128 to 127 and makes new ones above, so 1000 is a different object.',
      learn: ['lesson:juc-atomics'] },
    { id: 'reduce-identity', topic: 'streams',
      code: `void main() {
    var numbers = List.of(1, 2, 3, 4);
    IO.println(numbers.stream().reduce(10, Integer::sum));
    IO.println(numbers.parallelStream().reduce(10, Integer::sum));
}`,
      output: '20\n50', guess: '20\n20',
      trap: 'Parallel should change the speed, not the answer.', why: 'The identity is used once per split piece: here 4 pieces, so 10 is added 4 times. 10 is not an identity for `+`: only 0 is.',
      learn: ['lesson:juc-forkjoin'] },
    { id: 'foreach-ordered', topic: 'streams',
      code: `void main() {
    var collected = List.of(1, 2, 3, 4, 5, 6).parallelStream().map(n -> n * 10).toList();
    IO.println(collected);
    var seen = new ArrayList<Integer>();
    List.of(1, 2, 3, 4, 5, 6).parallelStream().forEachOrdered(seen::add);
    IO.println(seen);
}`,
      output: '[10, 20, 30, 40, 50, 60]\n[1, 2, 3, 4, 5, 6]', guess: '[40, 10, 30, 20, 60, 50]\n[4, 1, 3, 2, 6, 5]',
      trap: 'Parallel means any order.', why: '`toList` keeps encounter order, and `forEachOrdered` runs in it, one at a time. Only plain `forEach` is unordered.',
      learn: ['lesson:juc-forkjoin'] },
    { id: 'virtual-is-daemon', topic: 'virtual',
      code: `void main() {
    Thread t = Thread.ofVirtual().unstarted(() -> { });
    IO.println(t.isDaemon());
    IO.println(t.getPriority());
    t.setPriority(Thread.MAX_PRIORITY);
    IO.println(t.getPriority());
    IO.println("[" + t.getName() + "]");
}`,
      output: 'true\n5\n5\n[]', guess: 'false\n5\n10\n[VirtualThread-0]',
      trap: 'It is a `Thread`, so it behaves like one.', why: 'Always a daemon, always priority 5 (`setPriority` does nothing), and with no name unless you give one.',
      learn: ['lesson:vt-create', 'q:vt-daemon'] },
    { id: 'virtual-daemon-false', topic: 'virtual',
      code: `void main() {
    Thread t = Thread.ofVirtual().unstarted(() -> { });
    try {
        t.setDaemon(false);
        IO.println("set");
    } catch (IllegalArgumentException e) {
        IO.println(e.getMessage());
    }
}`,
      output: "'false' not legal for virtual threads", guess: 'set',
      trap: 'Every other setter on it just works or does nothing.', why: 'This one refuses. So the JVM never waits for a virtual thread: wait yourself, or an app with nothing else running exits ([[lesson:sp-virtual]]).',
      learn: ['lesson:vt-create'] },
    { id: 'virtual-group', topic: 'virtual',
      code: `void main() throws Exception {
    Thread t = Thread.ofVirtual().start(() -> { });
    t.join();
    IO.println(t.isVirtual());
    IO.println(t.isAlive());
    IO.println(t.getState());
    IO.println(new Thread(() -> { }).isVirtual());
}`,
      output: 'true\nfalse\nTERMINATED\nfalse', guess: 'true\ntrue\nTERMINATED\ntrue',
      trap: 'In Java 25 surely `new Thread` is virtual.', why: '`new Thread` still makes a platform thread, in every release. Virtual threads are asked for by name.',
      learn: ['lesson:vt-create'] },
    { id: 'threadlocal-not-inherited', topic: 'virtual',
      code: `static final ThreadLocal<String> PLAIN = new ThreadLocal<>();
static final InheritableThreadLocal<String> INHERITED = new InheritableThreadLocal<>();

void main() throws Exception {
    PLAIN.set("a");
    INHERITED.set("b");
    Thread.ofVirtual().start(() -> IO.println(PLAIN.get() + " " + INHERITED.get())).join();
    Thread.ofVirtual().inheritInheritableThreadLocals(false).start(() -> IO.println(INHERITED.get())).join();
}`,
      output: 'null b\nnull', guess: 'a b\nb',
      trap: 'A new thread is started from this one, so it should see this one\'s values.', why: 'A plain `ThreadLocal` is never inherited. An `InheritableThreadLocal` is, copied at creation, unless you turn that off.',
      learn: ['lesson:vt-threadlocals'] },
    { id: 'fork-get-before-join', topic: 'structured',
      code: `void main() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var a = scope.fork(() -> 1);
        try {
            IO.println(a.get());
        } catch (IllegalStateException e) {
            IO.println(e.getMessage());
        }
        scope.join();
        IO.println(a.get());
    }
}`,
      output: 'join not called\n1', guess: '1\n1',
      trap: 'The subtask probably finished already.', why: 'A subtask\'s result cannot be read before the owner has joined, however quick it was. That is deliberate: it stops you reading half a result.',
      learn: ['lesson:sc-basics'] },
    { id: 'join-returns-null', topic: 'structured',
      code: `void main() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var a = scope.fork(() -> "x");
        IO.println(scope.join());
        IO.println(a.state());
    }
}`,
      output: 'null\nSUCCESS', guess: 'x\nSUCCESS',
      trap: '`join` should return the result.', why: 'With the default joiner `join()` returns `null`, and results are read from each `Subtask`. Other joiners return something from `join()`.',
      learn: ['lesson:sc-basics', 'lesson:sc-joiners'] },
    { id: 'failed-exception', topic: 'structured',
      code: `void main() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        scope.fork(() -> { throw new IllegalStateException("boom"); });
        try {
            scope.join();
        } catch (StructuredTaskScope.FailedException e) {
            IO.println(e.getCause().getMessage());
        }
    }
}`,
      output: 'boom', guess: 'IllegalStateException',
      trap: 'A subtask threw, so maybe that exception arrives as it is.', why: '`join()` throws `FailedException`, and the subtask\'s exception is its **cause**.',
      learn: ['lesson:sc-failure'] },
    { id: 'scoped-after-block', topic: 'scoped',
      code: `static final ScopedValue<String> USER = ScopedValue.newInstance();

void main() {
    ScopedValue.where(USER, "ravi").run(() -> {
        IO.println(USER.get());
        ScopedValue.where(USER, "admin").run(() -> IO.println(USER.get()));
        IO.println(USER.get());
    });
    IO.println(USER.isBound());
}`,
      output: 'ravi\nadmin\nravi\nfalse', guess: 'ravi\nadmin\nadmin\nfalse',
      trap: 'The inner binding looks like a set.', why: 'A binding is a block, not a write. When the inner one ends the outer value is back, and there is nothing to restore or remove.',
      learn: ['lesson:sv-rebinding'] },
    { id: 'scoped-fork-vs-executor', topic: 'scoped',
      code: `static final ScopedValue<String> USER = ScopedValue.newInstance();

void main() throws Exception {
    ScopedValue.where(USER, "ravi").call(() -> {
        try (var scope = StructuredTaskScope.open()) {
            var forked = scope.fork(() -> USER.orElse("nobody"));
            scope.join();
            IO.println(forked.get());
        }
        try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
            IO.println(ex.submit(() -> USER.orElse("nobody")).get());
        }
        return null;
    });
}`,
      output: 'ravi\nnobody', guess: 'ravi\nravi',
      trap: 'Both start a virtual thread from inside the binding.', why: 'Only a scope\'s `fork` inherits scoped values: its lifetime fits inside the block. An executor\'s thread could outlive it.',
      learn: ['lesson:sv-inheritance'] },
    { id: 'scoped-orelse-null', topic: 'scoped',
      code: `static final ScopedValue<String> USER = ScopedValue.newInstance();

void main() {
    IO.println(USER.orElse("nobody"));
    try {
        IO.println(USER.orElse(null));
    } catch (NullPointerException e) {
        IO.println("refused");
    }
    try {
        IO.println(USER.get());
    } catch (NoSuchElementException e) {
        IO.println("not bound");
    }
}`,
      output: 'nobody\nrefused\nnot bound', guess: 'nobody\nnull\nnull',
      trap: '`orElse(null)` is an everyday idiom on `Optional`.', why: 'Since Java 25 `orElse(null)` is refused (JEP 506), and `get()` on an unbound value throws. Ask `isBound()` where it may be unbound.',
      learn: ['lesson:sv-basics'] }
  );
})(window.JCLT);
