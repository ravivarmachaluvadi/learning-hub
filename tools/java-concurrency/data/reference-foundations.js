/*
 * data/reference-foundations.js - the Reference, part 1 (batch 3): the classic concurrency APIs, from
 * Thread and synchronized to fork/join (js/views/reference.js shows them; js/assist.js offers them as you
 * type and shows them on hover).
 *
 * Group shape: {id, title, intro (Markdown), docs?}
 * Entry shape (built by add() below): {id, group, name, title, sig, since, preview, summary (Markdown),
 *   example (a whole Java 25 compact source file), output (exactly what it prints), docs, see?, covers?,
 *   and one of: owner ('Executors': a static member, offered after `Executors.`), receiver (['Lock']: an
 *   instance member of those types, offered after a dot), kind: 'keyword', or none (a type)}
 *
 * `since` is the Java release the API arrived in, read from the JDK's own source (lib/src.zip, the
 * @since tags, 1 Nov 2026; a method with no tag arrived with its class, or with the interface method it
 * implements). `preview` is true exactly for the APIs that are previews in Java 25 (tests/check_data.py).
 * tests/test_content.py runs every example twice and requires exactly `output`; nothing prints a thread
 * id, a hash code or a time, so every run prints the same.
 */
(function (U) {
  'use strict';
  var R = U.data.reference = U.data.reference || [];
  var API = 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/';
  function nl(s) { return /\n$/.test(s) ? s : s + '\n'; }
  function slug(t) { return t.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function add(group, cls, rows) {
    rows.forEach(function (r) {
      var title = r.title || (r.owner ? r.owner + '.' + r.name : r.receiver ? r.receiver[0] + '.' + r.name : r.name);
      var e = { id: r.key || slug(title), group: group, name: r.name, title: title, sig: r.sig, since: r.since, preview: !!r.preview,
        summary: r.summary, example: nl(r.example), output: nl(r.output),
        docs: r.docs || (cls ? API + cls.replace(/\./g, '/').replace(/\/([A-Z]\w*)\/([A-Z])/, '/$1.$2') + '.html' : undefined) };
      ['owner', 'receiver', 'kind', 'covers', 'see', 'stdin'].forEach(function (k) { if (r[k] !== undefined) e[k] = r[k]; });
      R.push(e);
    });
  }

  U.data.refGroups = (U.data.refGroups || []).concat([
    { id: 'threads', title: 'Threads', docs: API + 'java/lang/Thread.html',
      intro: '`java.lang.Thread`: making, naming, starting and waiting for threads, platform or virtual, and the interrupt flag that is how Java asks one to stop. See [[lesson:th-basics]] and [[lesson:vt-create]].' },
    { id: 'monitors', title: 'Monitors and locks', docs: API + 'java/util/concurrent/locks/package-summary.html',
      intro: 'The two keywords of the memory model (`synchronized`, `volatile`), the monitor methods every object has (`wait`, `notifyAll`), and `java.util.concurrent.locks`: `ReentrantLock`, `Condition`, read-write and stamped locks. See [[lesson:th-synchronized]] and [[lesson:juc-locks]].' },
    { id: 'executors', title: 'Executors', docs: API + 'java/util/concurrent/ExecutorService.html',
      intro: 'Where tasks run: the `Executors` factory methods, `ThreadPoolExecutor`, and the `ExecutorService` methods that submit tasks, wait for them and shut the pool down. See [[lesson:juc-executors]].' },
    { id: 'futures', title: 'Futures', docs: API + 'java/util/concurrent/CompletableFuture.html',
      intro: 'A result that arrives later: `Future` (wait for it, cancel it, ask its state) and `CompletableFuture` (say what happens when it arrives: transform, combine, recover, time out). See [[lesson:juc-futures]] and [[lesson:juc-completable]].' },
    { id: 'atomics', title: 'Atomics', docs: API + 'java/util/concurrent/atomic/package-summary.html',
      intro: 'One variable changed safely without a lock, by compare-and-set: `AtomicInteger`, `AtomicReference`, and `LongAdder` for a counter many threads hit at once. See [[lesson:juc-atomics]].' },
    { id: 'collections', title: 'Concurrent collections', docs: API + 'java/util/concurrent/package-summary.html',
      intro: 'Collections many threads may use at once: `ConcurrentHashMap` and its atomic per-key methods, copy-on-write lists, blocking queues for producers and consumers. See [[lesson:juc-collections]].' },
    { id: 'synchronizers', title: 'Synchronizers', docs: API + 'java/util/concurrent/package-summary.html',
      intro: 'Objects that make threads wait for each other: a latch counts down once, a barrier meets in rounds, a semaphore hands out permits, a phaser does all three. See [[lesson:juc-synchronizers]].' },
    { id: 'forkjoin', title: 'Fork/join and parallel streams', docs: API + 'java/util/concurrent/ForkJoinPool.html',
      intro: 'Splitting one computation across the processors: `ForkJoinPool`, `RecursiveTask`, the common pool, parallel streams, and `Gatherers.mapConcurrent` for blocking calls in a stream. See [[lesson:juc-forkjoin]].' }
  ]);

  /* ---------------------------------------------------------------- threads */
  var T = ['Thread'], B = ['Thread.Builder'];
  add('threads', 'java.lang.Thread', [
    { name: 'Thread', sig: 'public class Thread implements Runnable', since: '1.0', see: ['lesson:th-basics'],
      summary: 'A thread of execution: platform (a thin wrapper over an operating-system thread) or, since Java 21, virtual. Make one with a builder (`Thread.ofPlatform()`, `Thread.ofVirtual()`), start it once, and `join()` it to wait for it.',
      example: `void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().name("worker").start(() -> IO.println("hello from " + Thread.currentThread().getName()));
    t.join();
    IO.println("state after join: " + t.getState());
}`,
      output: 'hello from worker\nstate after join: TERMINATED' },
    { name: 'ofVirtual', owner: 'Thread', sig: 'static Thread.Builder.OfVirtual ofVirtual()', since: '21', see: ['lesson:vt-create'],
      summary: 'A builder for virtual threads: name them (`name("job-", 0)` numbers them), then `start(task)` or `unstarted(task)`, or make a `ThreadFactory` with `factory()`.',
      example: `void main() throws InterruptedException {
    Thread t = Thread.ofVirtual().name("job-", 1).start(() -> IO.println(Thread.currentThread().getName() + " virtual: " + Thread.currentThread().isVirtual()));
    t.join();
}`,
      output: 'job-1 virtual: true' },
    { name: 'ofPlatform', owner: 'Thread', sig: 'static Thread.Builder.OfPlatform ofPlatform()', since: '21', see: ['lesson:th-basics'],
      summary: 'A builder for platform threads: besides a name, it can set `daemon(true)`, a `priority`, a stack size and an uncaught-exception handler.',
      example: `void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().name("ticker").daemon(true).unstarted(() -> IO.println("ticking"));
    IO.println(t.getName() + " daemon: " + t.isDaemon() + ", state " + t.getState());
    t.start();
    t.join();
}`,
      output: 'ticker daemon: true, state NEW\nticking' },
    { name: 'startVirtualThread', owner: 'Thread', sig: 'static Thread startVirtualThread(Runnable task)', since: '21', see: ['lesson:vt-create'],
      summary: 'Starts a virtual thread with no name, the shortest way to start one. Like every virtual thread it is a daemon: wait for it, or the program may end first.',
      example: `void main() throws InterruptedException {
    Thread t = Thread.startVirtualThread(() -> IO.println("ran"));
    t.join();
    IO.println("name: [" + t.getName() + "]");
}`,
      output: 'ran\nname: []' },
    { name: 'currentThread', owner: 'Thread', sig: 'static Thread currentThread()', since: '1.0', see: ['lesson:th-basics'],
      summary: 'The thread running this code. On a virtual thread it is the virtual thread itself, never its carrier.',
      example: `void main() {
    IO.println(Thread.currentThread().getName());
}`,
      output: 'main' },
    { name: 'sleep', owner: 'Thread', sig: 'static void sleep(long millis) throws InterruptedException\nstatic void sleep(Duration duration) throws InterruptedException   // since 19', since: '1.0', see: ['lesson:th-interrupts'],
      summary: 'Pauses the current thread. It holds every lock it has while it sleeps, and throws `InterruptedException` (clearing the flag) when interrupted. The `Duration` overload arrived in Java 19.',
      example: `void main() throws InterruptedException {
    long start = System.nanoTime();
    Thread.sleep(Duration.ofMillis(100));
    IO.println("slept at least 100 ms: " + ((System.nanoTime() - start) / 1_000_000 >= 100));
}`,
      output: 'slept at least 100 ms: true' },
    { name: 'interrupted', owner: 'Thread', sig: 'static boolean interrupted()', since: '1.0', see: ['lesson:th-interrupts'],
      summary: 'Whether the current thread\'s interrupt flag is set, **and clears it**. To ask without clearing, use `Thread.currentThread().isInterrupted()`.',
      example: `void main() {
    Thread.currentThread().interrupt();
    IO.println("first: " + Thread.interrupted());
    IO.println("second: " + Thread.interrupted());
}`,
      output: 'first: true\nsecond: false' },
    { name: 'start', key: 'thread-builder-start', receiver: B, title: 'Thread.Builder.start', sig: 'Thread start(Runnable task)\nThread unstarted(Runnable task)', since: '21', covers: ['unstarted'], see: ['lesson:vt-create'],
      summary: 'A builder\'s last call: `start` makes the thread and starts it; `unstarted` makes it in state `NEW`, for you to start later. One builder can make many threads.',
      example: `void main() throws InterruptedException {
    var builder = Thread.ofVirtual().name("w-", 0);
    Thread a = builder.start(() -> { });
    Thread b = builder.unstarted(() -> { });
    IO.println(a.getName() + ", " + b.getName() + " " + b.getState());
    b.start();
    a.join();
    b.join();
}`,
      output: 'w-0, w-1 NEW' },
    { name: 'start', key: 'thread-start', receiver: T, sig: 'void start()', since: '1.0', covers: ['run'], see: ['lesson:th-basics'],
      summary: 'Starts the thread: its `run()` then runs on the new thread. Calling `run()` yourself runs it on the current thread, and starting a thread twice throws `IllegalThreadStateException`.',
      example: `void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().name("other").unstarted(() -> IO.println("on " + Thread.currentThread().getName()));
    t.run();
    t.start();
    t.join();
    try {
        t.start();
    } catch (IllegalThreadStateException e) {
        IO.println("twice: " + e.getClass().getSimpleName());
    }
}`,
      output: 'on main\non other\ntwice: IllegalThreadStateException' },
    { name: 'join', key: 'thread-join', receiver: T, sig: 'void join() throws InterruptedException\nboolean join(Duration duration) throws InterruptedException   // since 19', since: '1.0', see: ['lesson:th-basics'],
      summary: 'Waits until the thread has ended. Everything the thread did happens-before `join()` returns, so its writes are visible afterwards. `join(Duration)` (Java 19) gives up after a time and says whether the thread ended.',
      example: `int[] result = new int[1];

void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().start(() -> result[0] = 42);
    t.join();
    IO.println("seen after join: " + result[0]);
    Thread slow = Thread.ofVirtual().start(() -> {
        try { Thread.sleep(1_000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    });
    IO.println("ended within 50 ms: " + slow.join(Duration.ofMillis(50)));
    slow.interrupt();
    slow.join();
}`,
      output: 'seen after join: 42\nended within 50 ms: false' },
    { name: 'interrupt', receiver: T, sig: 'void interrupt()', since: '1.0', covers: ['isInterrupted'], see: ['lesson:th-interrupts'],
      summary: 'Asks the thread to stop: sets its interrupt flag, and makes a blocking call it is in (`sleep`, `join`, `wait`, a queue\'s `take`) throw `InterruptedException`. `isInterrupted()` reads the flag without clearing it.',
      example: `void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().start(() -> {
        try {
            Thread.sleep(10_000);
        } catch (InterruptedException e) {
            IO.println("woken: " + e.getMessage());
        }
    });
    t.interrupt();
    t.join();
}`,
      output: 'woken: sleep interrupted' },
    { name: 'getState', receiver: T, sig: 'Thread.State getState()', since: '1.5', see: ['lesson:th-basics'],
      summary: 'One of `NEW`, `RUNNABLE`, `BLOCKED` (waiting to enter a monitor), `WAITING`, `TIMED_WAITING`, `TERMINATED`. A snapshot for monitoring and thread dumps, not for making decisions.',
      example: `void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().unstarted(() -> {
        try { Thread.sleep(300); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    });
    IO.println(t.getState());
    t.start();
    Thread.sleep(100);
    IO.println(t.getState());
    t.join();
    IO.println(t.getState());
}`,
      output: 'NEW\nTIMED_WAITING\nTERMINATED' },
    { name: 'isVirtual', receiver: T, sig: 'final boolean isVirtual()', since: '21', see: ['lesson:vt-create'],
      summary: 'Whether this is a virtual thread.',
      example: `void main() throws InterruptedException {
    Thread v = Thread.ofVirtual().start(() -> { });
    v.join();
    IO.println("main: " + Thread.currentThread().isVirtual() + ", v: " + v.isVirtual());
}`,
      output: 'main: false, v: true' },
    { name: 'threadId', receiver: T, sig: 'final long threadId()', since: '19', covers: ['getId'],
      summary: 'The thread\'s identifier, unique while it lives. It replaces `getId()`, deprecated in Java 19 because a subclass could override it.',
      example: `void main() {
    Thread me = Thread.currentThread();
    IO.println("same as getId: " + (me.threadId() == me.getId()));
}`,
      output: 'same as getId: true' },
    { name: 'setUncaughtExceptionHandler', receiver: T, sig: 'void setUncaughtExceptionHandler(Thread.UncaughtExceptionHandler handler)', since: '1.5', covers: ['uncaughtExceptionHandler'], see: ['lesson:th-basics'],
      summary: 'Who hears about an exception that ends the thread. Without one, the default prints the stack trace to `System.err`; nothing reaches the thread that started it. Builders take one too: `uncaughtExceptionHandler(…)`.',
      example: `void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().name("importer").unstarted(() -> { throw new IllegalStateException("bad row"); });
    t.setUncaughtExceptionHandler((th, e) -> IO.println(th.getName() + " died: " + e.getMessage()));
    t.start();
    t.join();
    IO.println("main carries on");
}`,
      output: 'importer died: bad row\nmain carries on' }
  ]);

  /* ---------------------------------------------------------------- monitors and locks */
  var LOCK = ['Lock'];
  add('monitors', null, [
    { name: 'synchronized', kind: 'keyword', sig: 'synchronized (lock) { … }\nsynchronized void method() { … }', since: '1.0', see: ['lesson:th-synchronized'],
      docs: 'https://docs.oracle.com/javase/specs/jls/se25/html/jls-14.html#jls-14.19',
      summary: 'Runs a block while holding an object\'s monitor: one thread at a time per object, and everything done before an unlock is visible to the next thread that locks it. A `synchronized` method locks `this` (a static one, the class). Reentrant: a thread can take a monitor it holds.',
      example: `class Counter {
    private int n;
    synchronized void add() { n++; }
    synchronized int get() { return n; }
}

void main() throws InterruptedException {
    Counter c = new Counter();
    Thread a = Thread.ofPlatform().start(() -> { for (int i = 0; i < 100_000; i++) c.add(); });
    Thread b = Thread.ofPlatform().start(() -> { for (int i = 0; i < 100_000; i++) c.add(); });
    a.join();
    b.join();
    IO.println(c.get());
}`,
      output: '200000' },
    { name: 'volatile', kind: 'keyword', sig: 'volatile boolean running;', since: '1.0', see: ['lesson:th-visibility'],
      docs: 'https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html#jls-8.3.1.4',
      summary: 'A field every thread reads fresh: a write to it happens-before every later read of it, so what the writer did before the write is visible too. It makes single reads and writes visible, **not** `count++` atomic.',
      example: `volatile boolean ready;
int data;

void main() throws InterruptedException {
    Thread reader = Thread.ofPlatform().start(() -> {
        while (!ready) Thread.onSpinWait();
        IO.println("data: " + data);
    });
    data = 42;
    ready = true;
    reader.join();
}`,
      output: 'data: 42' },
    { name: 'wait', receiver: ['Object'], title: 'Object.wait', sig: 'final void wait() throws InterruptedException\nfinal void wait(long timeoutMillis) throws InterruptedException', since: '1.0', see: ['lesson:th-wait-notify'],
      summary: 'Releases the object\'s monitor and waits until another thread calls `notifyAll()` (or `notify()`) on it, then takes the monitor back. Call it inside `synchronized` on that object, **in a `while` loop** that checks the condition: a thread can wake without being notified.',
      example: `final Object lock = new Object();
boolean ready;

void main() throws InterruptedException {
    Thread waiter = Thread.ofPlatform().start(() -> {
        synchronized (lock) {
            while (!ready) {
                try { lock.wait(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
            }
            IO.println("ready, so it goes on");
        }
    });
    synchronized (lock) {
        ready = true;
        lock.notifyAll();
    }
    waiter.join();
}`,
      output: 'ready, so it goes on' },
    { name: 'notifyAll', receiver: ['Object'], title: 'Object.notifyAll', sig: 'final void notifyAll()\nfinal void notify()', since: '1.0', covers: ['notify'], see: ['lesson:th-wait-notify'],
      summary: 'Wakes the threads waiting on this object\'s monitor; each takes the monitor in turn and checks its condition again. `notify()` wakes only one, maybe one that cannot go on. Like `wait`, it needs the monitor: outside `synchronized` it throws `IllegalMonitorStateException`.',
      example: `void main() {
    Object lock = new Object();
    try {
        lock.notifyAll();
    } catch (IllegalMonitorStateException e) {
        IO.println(e.getMessage());
    }
    synchronized (lock) {
        lock.notifyAll();
        IO.println("fine while holding it");
    }
}`,
      output: 'current thread is not owner\nfine while holding it' },
    { name: 'ReentrantLock', sig: 'public class ReentrantLock implements Lock\nnew ReentrantLock()\nnew ReentrantLock(boolean fair)', since: '1.5', see: ['lesson:juc-locks'],
      docs: API + 'java/util/concurrent/locks/ReentrantLock.html',
      summary: 'A lock you take and release yourself: what `synchronized` does, plus `tryLock` (with a timeout), `lockInterruptibly`, any number of `Condition`s, and an optional fair order. Always release it in `finally`.',
      example: `void main() {
    var lock = new ReentrantLock();
    lock.lock();
    try {
        lock.lock();
        IO.println("held " + lock.getHoldCount() + " times, fair: " + lock.isFair());
        lock.unlock();
    } finally {
        lock.unlock();
    }
    IO.println("locked now: " + lock.isLocked());
}`,
      output: 'held 2 times, fair: false\nlocked now: false' },
    { name: 'lock', receiver: LOCK, sig: 'void lock()\nvoid unlock()\nvoid lockInterruptibly() throws InterruptedException', since: '1.5', covers: ['unlock', 'lockInterruptibly'], see: ['lesson:juc-locks'],
      docs: API + 'java/util/concurrent/locks/Lock.html',
      summary: '`lock()` waits for the lock, ignoring interrupts; `lockInterruptibly()` gives up with `InterruptedException`. `unlock()` by a thread that does not hold it throws `IllegalMonitorStateException`. The pattern: `lock.lock(); try { … } finally { lock.unlock(); }`.',
      example: `void main() throws InterruptedException {
    var lock = new ReentrantLock();
    lock.lock();
    Thread t = Thread.ofPlatform().start(() -> {
        try {
            lock.lockInterruptibly();
        } catch (InterruptedException e) {
            IO.println("gave up waiting for the lock");
        }
    });
    t.interrupt();
    t.join();
    lock.unlock();
}`,
      output: 'gave up waiting for the lock' },
    { name: 'tryLock', receiver: LOCK, sig: 'boolean tryLock()\nboolean tryLock(long time, TimeUnit unit) throws InterruptedException', since: '1.5', see: ['lesson:juc-locks', 'lesson:th-deadlock'],
      docs: API + 'java/util/concurrent/locks/Lock.html',
      summary: 'Takes the lock if it can, now or within a time, and says whether it did. The way out of a deadlock: a thread that cannot get its second lock lets go of its first and tries again.',
      example: `void main() throws InterruptedException {
    var lock = new ReentrantLock();
    Thread holder = Thread.ofPlatform().start(() -> {
        lock.lock();
        try { Thread.sleep(300); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        finally { lock.unlock(); }
    });
    Thread.sleep(50);
    IO.println("got it in 10 ms: " + lock.tryLock(10, TimeUnit.MILLISECONDS));
    holder.join();
    IO.println("got it now: " + lock.tryLock());
    lock.unlock();
}`,
      output: 'got it in 10 ms: false\ngot it now: true' },
    { name: 'newCondition', receiver: LOCK, sig: 'Condition newCondition()\n// Condition: await(), signal(), signalAll()', since: '1.5', covers: ['await', 'signal', 'signalAll'], see: ['lesson:juc-locks'],
      docs: API + 'java/util/concurrent/locks/Condition.html',
      summary: 'A `Condition` is a lock\'s own wait set: `await()` releases the lock and waits, `signal()` wakes one waiter, `signalAll()` all. One lock can have several (not full, not empty), so a signal wakes only the threads that can go on.',
      example: `void main() throws InterruptedException {
    var lock = new ReentrantLock();
    var filled = lock.newCondition();
    List<String> box = new ArrayList<>();
    Thread taker = Thread.ofPlatform().start(() -> {
        lock.lock();
        try {
            while (box.isEmpty()) filled.await();
            IO.println("took " + box.removeFirst());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    });
    lock.lock();
    try {
        box.add("parcel");
        filled.signal();
    } finally {
        lock.unlock();
    }
    taker.join();
}`,
      output: 'took parcel' },
    { name: 'ReentrantReadWriteLock', sig: 'public class ReentrantReadWriteLock implements ReadWriteLock\nLock readLock()\nLock writeLock()', since: '1.5', covers: ['readLock', 'writeLock'], see: ['lesson:juc-locks'],
      docs: API + 'java/util/concurrent/locks/ReentrantReadWriteLock.html',
      summary: 'Two locks in one: many threads may hold the read lock together, but the write lock is exclusive and waits for the readers to leave. Worth it only when reads are many and long; for a simple map, `ConcurrentHashMap` is better.',
      example: `void main() {
    var rw = new ReentrantReadWriteLock();
    rw.readLock().lock();
    rw.readLock().lock();
    IO.println("readers: " + rw.getReadLockCount());
    IO.println("write while reading: " + rw.writeLock().tryLock());
    rw.readLock().unlock();
    rw.readLock().unlock();
    IO.println("write when free: " + rw.writeLock().tryLock());
}`,
      output: 'readers: 2\nwrite while reading: false\nwrite when free: true' },
    { name: 'StampedLock', sig: 'public class StampedLock\nlong tryOptimisticRead()\nboolean validate(long stamp)\nlong writeLock()', since: '1.8', covers: ['tryOptimisticRead', 'validate'], see: ['lesson:juc-locks'],
      docs: API + 'java/util/concurrent/locks/StampedLock.html',
      summary: 'A lock with an **optimistic read**: read without locking, then `validate(stamp)` says whether a write happened meanwhile; if one did, read again under a real read lock. Not reentrant, no conditions.',
      example: `void main() {
    var sl = new StampedLock();
    long stamp = sl.tryOptimisticRead();
    IO.println("valid with no writer: " + sl.validate(stamp));
    long w = sl.writeLock();
    sl.unlockWrite(w);
    IO.println("valid after a write: " + sl.validate(stamp));
}`,
      output: 'valid with no writer: true\nvalid after a write: false' }
  ]);

  /* ---------------------------------------------------------------- executors */
  var ES = ['ExecutorService'];
  add('executors', 'java.util.concurrent.Executors', [
    { name: 'newVirtualThreadPerTaskExecutor', owner: 'Executors', sig: 'static ExecutorService newVirtualThreadPerTaskExecutor()', since: '21', see: ['lesson:vt-create'],
      summary: 'An executor that starts a new virtual thread for every task, with no pool and no queue. Open it in try-with-resources: `close()` waits for every task.',
      example: `void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<String> f = executor.submit(() -> "virtual: " + Thread.currentThread().isVirtual());
        IO.println(f.get());
    }
}`,
      output: 'virtual: true' },
    { name: 'newFixedThreadPool', owner: 'Executors', sig: 'static ExecutorService newFixedThreadPool(int nThreads)', since: '1.5', see: ['lesson:juc-executors'],
      summary: 'A pool of exactly `nThreads` platform threads and an **unbounded** queue (`LinkedBlockingQueue`): extra tasks wait in the queue, without limit. Right for computing (sized to the processors); for tasks that wait, virtual threads.',
      example: `void main() {
    try (var pool = (ThreadPoolExecutor) Executors.newFixedThreadPool(4)) {
        IO.println("core " + pool.getCorePoolSize() + ", max " + pool.getMaximumPoolSize() + ", queue " + pool.getQueue().getClass().getSimpleName());
    }
}`,
      output: 'core 4, max 4, queue LinkedBlockingQueue' },
    { name: 'newCachedThreadPool', owner: 'Executors', sig: 'static ExecutorService newCachedThreadPool()', since: '1.5', see: ['lesson:juc-executors'],
      summary: 'A pool with no core threads, no limit and no queue (a `SynchronousQueue` hands each task to a thread, making one if none is idle); idle threads end after 60 s. Under load it can make thousands of OS threads.',
      example: `void main() {
    try (var pool = (ThreadPoolExecutor) Executors.newCachedThreadPool()) {
        IO.println("core " + pool.getCorePoolSize() + ", max " + pool.getMaximumPoolSize() + ", keep-alive " + pool.getKeepAliveTime(TimeUnit.SECONDS) + " s");
    }
}`,
      output: 'core 0, max 2147483647, keep-alive 60 s' },
    { name: 'newScheduledThreadPool', owner: 'Executors', sig: 'static ScheduledExecutorService newScheduledThreadPool(int corePoolSize)\n// schedule(task, delay, unit), scheduleAtFixedRate, scheduleWithFixedDelay', since: '1.5', covers: ['schedule', 'scheduleAtFixedRate', 'scheduleWithFixedDelay'], see: ['lesson:juc-executors'],
      summary: 'A pool that runs tasks after a delay or repeatedly. `scheduleAtFixedRate` keeps to the clock; `scheduleWithFixedDelay` waits the delay after each run ends. An exception in a repeating task stops its repeats, silently.',
      example: `void main() throws Exception {
    try (var timer = Executors.newScheduledThreadPool(1)) {
        var later = timer.schedule(() -> "ran after 50 ms", 50, TimeUnit.MILLISECONDS);
        IO.println(later.get());
    }
}`,
      output: 'ran after 50 ms' },
    { name: 'newThreadPerTaskExecutor', owner: 'Executors', sig: 'static ExecutorService newThreadPerTaskExecutor(ThreadFactory threadFactory)', since: '21', see: ['lesson:vt-create'],
      summary: 'A new thread for every task, made by the factory you give: with `Thread.ofVirtual().name("job-", 0).factory()`, every task gets a named virtual thread.',
      example: `void main() throws Exception {
    try (var executor = Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("job-", 0).factory())) {
        IO.println(executor.submit(() -> Thread.currentThread().getName()).get());
        IO.println(executor.submit(() -> Thread.currentThread().getName()).get());
    }
}`,
      output: 'job-0\njob-1' },
    { name: 'ThreadPoolExecutor', sig: 'new ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit,\n                       BlockingQueue<Runnable> workQueue, RejectedExecutionHandler handler)', since: '1.5', see: ['lesson:juc-executors'],
      docs: API + 'java/util/concurrent/ThreadPoolExecutor.html',
      summary: 'The pool behind most factory methods, with its six settings. A new task goes to a core thread; when they are all busy, to the queue; when the queue is full, to a new thread up to the maximum; then to the **rejection handler** (`AbortPolicy` throws, `CallerRunsPolicy` runs it on the caller).',
      example: `void main() throws InterruptedException {
    var pool = new ThreadPoolExecutor(1, 1, 0, TimeUnit.SECONDS, new ArrayBlockingQueue<>(1), new ThreadPoolExecutor.CallerRunsPolicy());
    var hold = new CountDownLatch(1);
    pool.execute(() -> { try { hold.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } });
    pool.execute(() -> { });
    pool.execute(() -> IO.println("full, so it ran on " + Thread.currentThread().getName()));
    hold.countDown();
    pool.close();
}`,
      output: 'full, so it ran on main' },
    { name: 'submit', receiver: ES, sig: '<T> Future<T> submit(Callable<T> task)\nFuture<?> submit(Runnable task)', since: '1.5', covers: ['execute'], see: ['lesson:juc-futures'],
      summary: 'Hands a task to the executor and returns its `Future` at once. A lambda that returns a value is a `Callable` (which may throw); one that returns nothing is a `Runnable`. `execute(Runnable)` returns nothing at all.',
      example: `void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<Integer> answer = executor.submit(() -> 6 * 7);
        Future<?> done = executor.submit(() -> IO.println("a Runnable ran"));
        done.get();
        IO.println("answer " + answer.get() + ", the Runnable's result " + done.get());
    }
}`,
      output: 'a Runnable ran\nanswer 42, the Runnable\'s result null' },
    { name: 'invokeAll', receiver: ES, sig: '<T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)\n<T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks, long timeout, TimeUnit unit)', since: '1.5', see: ['lesson:juc-futures'],
      summary: 'Runs every task and waits for all of them; the futures come back in the order of the tasks, all done. With a timeout, the tasks still running when it expires are cancelled.',
      example: `void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Callable<String>> tasks = List.of(() -> "fast", () -> { Thread.sleep(2_000); return "slow"; });
        for (Future<String> f : executor.invokeAll(tasks, 200, TimeUnit.MILLISECONDS)) IO.println(f.state());
    }
}`,
      output: 'SUCCESS\nCANCELLED' },
    { name: 'invokeAny', receiver: ES, sig: '<T> T invokeAny(Collection<? extends Callable<T>> tasks) throws InterruptedException, ExecutionException', since: '1.5', see: ['lesson:juc-futures'],
      summary: 'Runs the tasks and returns the result of the first to succeed, cancelling the rest. Throws `ExecutionException` only if every task failed.',
      example: `void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Callable<String>> mirrors = List.of(() -> { Thread.sleep(500); return "slow mirror"; }, () -> "fast mirror");
        IO.println(executor.invokeAny(mirrors));
    }
}`,
      output: 'fast mirror' },
    { name: 'close', receiver: ES, title: 'ExecutorService.close', sig: 'default void close()', since: '19', see: ['lesson:juc-executors'],
      summary: 'Shuts the executor down and waits for every task to finish, which is what try-with-resources calls at the end of the block. Before Java 19 it was `shutdown()` then `awaitTermination` in a loop.',
      example: `void main() {
    List<String> done = Collections.synchronizedList(new ArrayList<>());
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 3; i++) {
            int n = i;
            executor.submit(() -> { Thread.sleep(50); done.add("task " + n); return null; });
        }
    }
    IO.println(done.size() + " done when close() returned");
}`,
      output: '3 done when close() returned' },
    { name: 'shutdown', receiver: ES, sig: 'void shutdown()\nboolean awaitTermination(long timeout, TimeUnit unit) throws InterruptedException\nList<Runnable> shutdownNow()', since: '1.5', covers: ['awaitTermination', 'shutdownNow', 'isShutdown', 'isTerminated'], see: ['lesson:juc-executors'],
      summary: '`shutdown()` takes no new tasks and lets the queued ones run; `awaitTermination` waits for them; `shutdownNow()` interrupts the running tasks and returns the queued ones unstarted. A task submitted after shutdown is rejected.',
      example: `void main() throws InterruptedException {
    var pool = Executors.newFixedThreadPool(2);
    pool.submit(() -> IO.println("ran before the shutdown"));
    pool.shutdown();
    IO.println("finished: " + pool.awaitTermination(5, TimeUnit.SECONDS));
    try {
        pool.submit(() -> { });
    } catch (RejectedExecutionException e) {
        IO.println("after shutdown: rejected");
    }
}`,
      output: 'ran before the shutdown\nfinished: true\nafter shutdown: rejected' }
  ]);

  /* ---------------------------------------------------------------- futures */
  var F = ['Future'], CF = ['CompletableFuture'];
  add('futures', 'java.util.concurrent.CompletableFuture', [
    { name: 'get', key: 'future-get', receiver: F, sig: 'V get() throws InterruptedException, ExecutionException\nV get(long timeout, TimeUnit unit) throws …, TimeoutException', since: '1.5', see: ['lesson:juc-futures'],
      docs: API + 'java/util/concurrent/Future.html',
      summary: 'Waits for the result. A task that threw makes `get()` throw `ExecutionException`, with the task\'s exception as its **cause**; with a timeout, `TimeoutException` if it is not done in time (the task goes on).',
      example: `void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<String> bad = executor.submit(() -> { throw new IllegalStateException("no stock"); });
        try {
            bad.get();
        } catch (ExecutionException e) {
            IO.println("cause: " + e.getCause());
        }
        Future<String> slow = executor.submit(() -> { Thread.sleep(1_000); return "late"; });
        try {
            slow.get(50, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            IO.println("not in 50 ms");
            slow.cancel(true);
        }
    }
}`,
      output: 'cause: java.lang.IllegalStateException: no stock\nnot in 50 ms' },
    { name: 'cancel', receiver: F, sig: 'boolean cancel(boolean mayInterruptIfRunning)', since: '1.5', see: ['lesson:juc-futures'],
      docs: API + 'java/util/concurrent/Future.html',
      summary: 'Cancels the task; with `true`, a task already running on an executor\'s thread is **interrupted**. `get()` then throws `CancellationException`. (A `CompletableFuture`\'s `cancel` does not interrupt anything: see `orTimeout`.)',
      example: `void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var started = new CountDownLatch(1);
        var interrupted = new CountDownLatch(1);
        Future<String> f = executor.submit(() -> {
            started.countDown();
            try {
                Thread.sleep(5_000);
                return "finished";
            } catch (InterruptedException e) {
                interrupted.countDown();
                throw e;
            }
        });
        started.await();
        IO.println("cancelled: " + f.cancel(true));
        IO.println("the task was interrupted: " + interrupted.await(5, TimeUnit.SECONDS));
        try {
            f.get();
        } catch (CancellationException e) {
            IO.println("get: CancellationException");
        }
    }
}`,
      output: 'cancelled: true\nthe task was interrupted: true\nget: CancellationException' },
    { name: 'state', receiver: F, sig: 'default Future.State state()   // RUNNING, SUCCESS, FAILED, CANCELLED', since: '19', see: ['lesson:juc-futures'],
      docs: API + 'java/util/concurrent/Future.html',
      summary: 'What became of the task, without waiting: `RUNNING`, `SUCCESS`, `FAILED` or `CANCELLED`. A `switch` on it replaces the old `isDone()`, `isCancelled()` and a `get()` in a `try`.',
      example: `void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<Integer> ok = executor.submit(() -> 1);
        Future<Integer> bad = executor.submit(() -> { throw new IllegalStateException(); });
        executor.close();
        for (Future<Integer> f : List.of(ok, bad)) {
            IO.println(switch (f.state()) {
                case SUCCESS -> "success: " + f.resultNow();
                case FAILED -> "failed: " + f.exceptionNow().getClass().getSimpleName();
                default -> "not done";
            });
        }
    }
}`,
      output: 'success: 1\nfailed: IllegalStateException' },
    { name: 'resultNow', receiver: F, sig: 'default V resultNow()\ndefault Throwable exceptionNow()', since: '19', covers: ['exceptionNow'], see: ['lesson:juc-futures'],
      docs: API + 'java/util/concurrent/Future.html',
      summary: 'The result of a task known to have succeeded (or the exception of one known to have failed), with no checked exceptions to catch. On a task in any other state it throws `IllegalStateException`.',
      example: `void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<String> f = executor.submit(() -> { Thread.sleep(1_000); return "late"; });
        f.cancel(true);
        try {
            f.resultNow();
        } catch (IllegalStateException e) {
            IO.println(e.getMessage());
        }
    }
}`,
      output: 'Task was cancelled' },
    { name: 'supplyAsync', owner: 'CompletableFuture', sig: 'static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier, Executor executor)\nstatic CompletableFuture<Void> runAsync(Runnable runnable, Executor executor)', since: '1.8', covers: ['runAsync'], see: ['lesson:juc-completable'],
      summary: 'Runs the supplier on the executor and returns a `CompletableFuture` of its result. **Pass an executor**: without one it runs on the common `ForkJoinPool`, shared by every parallel stream.',
      example: `void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        CompletableFuture<String> f = CompletableFuture.supplyAsync(() -> "virtual: " + Thread.currentThread().isVirtual(), executor);
        IO.println(f.join());
    }
}`,
      output: 'virtual: true' },
    { name: 'thenApply', receiver: CF, sig: '<U> CompletableFuture<U> thenApply(Function<? super T, ? extends U> fn)', since: '1.8', covers: ['thenAccept', 'thenRun'], see: ['lesson:juc-completable'],
      summary: 'A new future of the result transformed by `fn`, run when the result arrives (on the thread that completes it, or on yours if it is already done). If this future failed, `fn` is skipped and the failure passes on.',
      example: `void main() {
    CompletableFuture<Integer> price = CompletableFuture.completedFuture(100);
    IO.println(price.thenApply(p -> p * 2).thenApply(p -> "total " + p).join());
}`,
      output: 'total 200' },
    { name: 'thenCompose', receiver: CF, sig: '<U> CompletableFuture<U> thenCompose(Function<? super T, ? extends CompletionStage<U>> fn)', since: '1.8', see: ['lesson:juc-completable'],
      summary: 'The next call that needs this result and is itself asynchronous: `fn` returns a future, and `thenCompose` flattens it (where `thenApply` would give a future of a future). The `flatMap` of futures.',
      example: `CompletableFuture<String> user(String id) { return CompletableFuture.completedFuture("user " + id); }
CompletableFuture<String> orders(String user) { return CompletableFuture.completedFuture(user + ": 3 orders"); }

void main() {
    IO.println(user("42").thenCompose(this::orders).join());
}`,
      output: 'user 42: 3 orders' },
    { name: 'thenCombine', key: 'completable-future-then-combine', receiver: CF, sig: '<U, V> CompletableFuture<V> thenCombine(CompletionStage<? extends U> other, BiFunction<? super T, ? super U, ? extends V> fn)', since: '1.8', see: ['lesson:juc-completable'],
      summary: 'Waits for this result and another future\'s, then combines them: two independent calls run at the same time and meet here. If either fails, the combined future fails.',
      example: `void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var price = CompletableFuture.supplyAsync(() -> 250, executor);
        var stock = CompletableFuture.supplyAsync(() -> 4, executor);
        IO.println("stock value: " + price.thenCombine(stock, (p, s) -> p * s).join());
    }
}`,
      output: 'stock value: 1000' },
    { name: 'exceptionally', receiver: CF, sig: 'CompletableFuture<T> exceptionally(Function<Throwable, ? extends T> fn)', since: '1.8', see: ['lesson:juc-completable'],
      summary: 'A fallback: if this future failed, `fn` turns the exception into a value. After an asynchronous step the exception it is given is a `CompletionException` wrapping the real one: look at `getCause()`.',
      example: `void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        CompletableFuture<String> price = CompletableFuture.supplyAsync(() -> { throw new IllegalStateException("pricing down"); }, executor);
        IO.println(price.exceptionally(e -> "fallback (" + e.getCause().getMessage() + ")").join());
    }
}`,
      output: 'fallback (pricing down)' },
    { name: 'handle', receiver: CF, sig: '<U> CompletableFuture<U> handle(BiFunction<? super T, Throwable, ? extends U> fn)\nCompletableFuture<T> whenComplete(BiConsumer<? super T, ? super Throwable> action)', since: '1.8', covers: ['whenComplete'], see: ['lesson:juc-completable'],
      summary: 'Called with the result or the exception (the other is `null`), success or failure, and returns a new value. `whenComplete` sees both too but cannot change the result: for logging.',
      example: `void main() {
    CompletableFuture<Integer> ok = CompletableFuture.completedFuture(5);
    CompletableFuture<Integer> bad = CompletableFuture.failedFuture(new IllegalStateException("no"));
    for (var f : List.of(ok, bad)) IO.println(f.handle((v, e) -> e == null ? "got " + v : "failed: " + e.getMessage()).join());
}`,
      output: 'got 5\nfailed: no' },
    { name: 'allOf', owner: 'CompletableFuture', sig: 'static CompletableFuture<Void> allOf(CompletableFuture<?>... cfs)\nstatic CompletableFuture<Object> anyOf(CompletableFuture<?>... cfs)', since: '1.8', covers: ['anyOf'], see: ['lesson:juc-completable'],
      summary: '`allOf` completes when every future has (its value is `null`: read each future\'s own result); `anyOf` with the first to complete. Neither cancels the others.',
      example: `void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var a = CompletableFuture.supplyAsync(() -> "a", executor);
        var b = CompletableFuture.supplyAsync(() -> "b", executor);
        CompletableFuture.allOf(a, b).join();
        IO.println(a.join() + b.join());
    }
}`,
      output: 'ab' },
    { name: 'orTimeout', receiver: CF, sig: 'CompletableFuture<T> orTimeout(long timeout, TimeUnit unit)\nCompletableFuture<T> completeOnTimeout(T value, long timeout, TimeUnit unit)', since: '9', covers: ['completeOnTimeout'], see: ['lesson:juc-completable'],
      summary: 'A deadline: `orTimeout` fails the future with `TimeoutException`, `completeOnTimeout` completes it with a fallback. Neither stops the work: the task goes on running (measured: it finished anyway, 3 runs of 3).',
      example: `CompletableFuture<String> slow(ExecutorService executor) {
    return CompletableFuture.supplyAsync(() -> {
        try { Thread.sleep(300); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        IO.println("a slow task finished anyway");
        return "slow";
    }, executor);
}

void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        try {
            slow(executor).orTimeout(50, TimeUnit.MILLISECONDS).join();
        } catch (CompletionException e) {
            IO.println("orTimeout: " + e.getCause().getClass().getSimpleName());
        }
        IO.println(slow(executor).completeOnTimeout("fallback", 50, TimeUnit.MILLISECONDS).join());
    }
}`,
      output: 'orTimeout: TimeoutException\nfallback\na slow task finished anyway\na slow task finished anyway' },
    { name: 'join', key: 'completable-future-join', receiver: CF, sig: 'T join()', since: '1.8', covers: ['getNow', 'completedFuture', 'failedFuture'], see: ['lesson:juc-completable'],
      summary: 'Waits for the result, like `get()`, but throws the unchecked `CompletionException` (cause: the real failure) instead of `ExecutionException`, so it fits in a lambda.',
      example: `void main() {
    CompletableFuture<String> bad = CompletableFuture.supplyAsync(() -> { throw new IllegalStateException("down"); }, Runnable::run);
    try {
        bad.join();
    } catch (CompletionException e) {
        IO.println("CompletionException, cause " + e.getCause().getMessage());
    }
}`,
      output: 'CompletionException, cause down' }
  ]);

  /* ---------------------------------------------------------------- atomics */
  var AI = ['AtomicInteger'];
  add('atomics', 'java.util.concurrent.atomic.AtomicInteger', [
    { name: 'AtomicInteger', sig: 'public class AtomicInteger extends Number\nnew AtomicInteger(int initialValue)', since: '1.5', covers: ['AtomicLong', 'AtomicBoolean'], see: ['lesson:juc-atomics'],
      summary: 'An `int` that threads can change without a lock: every method is one atomic step, done with the processor\'s compare-and-set. `AtomicLong` and `AtomicBoolean` are the same for theirs.',
      example: `void main() throws InterruptedException {
    var hits = new AtomicInteger();
    Thread a = Thread.ofPlatform().start(() -> { for (int i = 0; i < 100_000; i++) hits.incrementAndGet(); });
    Thread b = Thread.ofPlatform().start(() -> { for (int i = 0; i < 100_000; i++) hits.incrementAndGet(); });
    a.join();
    b.join();
    IO.println(hits.get());
}`,
      output: '200000' },
    { name: 'incrementAndGet', receiver: AI, sig: 'int incrementAndGet()\nint getAndIncrement()\nint addAndGet(int delta)', since: '1.5', covers: ['getAndIncrement', 'addAndGet', 'getAndAdd', 'decrementAndGet'], see: ['lesson:juc-atomics'],
      summary: 'Atomic `++`: `incrementAndGet` returns the new value, `getAndIncrement` the old one; `addAndGet(delta)` adds any amount.',
      example: `void main() {
    var n = new AtomicInteger(5);
    IO.println(n.getAndIncrement() + " then " + n.incrementAndGet() + " then " + n.addAndGet(10));
}`,
      output: '5 then 7 then 17' },
    { name: 'compareAndSet', receiver: AI, sig: 'boolean compareAndSet(int expectedValue, int newValue)', since: '1.5', covers: ['compareAndExchange', 'weakCompareAndSetVolatile'], see: ['lesson:juc-atomics'],
      summary: 'Sets the new value **only if** the value is still the expected one, and says whether it did. The building block of every lock-free algorithm: read, compute, CAS, and retry if another thread got in first.',
      example: `void main() {
    var stock = new AtomicInteger(1);
    IO.println("first buyer: " + stock.compareAndSet(1, 0));
    IO.println("second buyer, who also read 1: " + stock.compareAndSet(1, 0));
    IO.println("stock: " + stock.get());
}`,
      output: 'first buyer: true\nsecond buyer, who also read 1: false\nstock: 0' },
    { name: 'updateAndGet', receiver: AI, sig: 'int updateAndGet(IntUnaryOperator updateFunction)\nint accumulateAndGet(int x, IntBinaryOperator accumulatorFunction)', since: '1.8', covers: ['getAndUpdate', 'accumulateAndGet', 'getAndAccumulate'], see: ['lesson:juc-atomics'],
      summary: 'The CAS loop written for you: applies the function and retries until no other thread changed the value meanwhile. The function may run more than once, so it must have no side effects.',
      example: `void main() {
    var max = new AtomicInteger(Integer.MIN_VALUE);
    for (int latency : List.of(120, 340, 90)) max.accumulateAndGet(latency, Math::max);
    var capped = new AtomicInteger(8);
    IO.println("max " + max.get() + ", doubled up to 10: " + capped.updateAndGet(v -> Math.min(v * 2, 10)));
}`,
      output: 'max 340, doubled up to 10: 10' },
    { name: 'AtomicReference', sig: 'public class AtomicReference<V>\nV get()\nboolean compareAndSet(V expectedValue, V newValue)\nV updateAndGet(UnaryOperator<V> updateFunction)', since: '1.5', see: ['lesson:juc-atomics'],
      docs: API + 'java/util/concurrent/atomic/AtomicReference.html',
      summary: 'An object reference changed atomically: hold an **immutable** value (a record, an unmodifiable list) and swap in a new one with `updateAndGet`. Readers always see a whole old value or a whole new one.',
      example: `record Config(String host, int port) { }

void main() {
    var current = new AtomicReference<>(new Config("db1", 5432));
    current.updateAndGet(c -> new Config("db2", c.port()));
    IO.println(current.get());
}`,
      output: 'Config[host=db2, port=5432]' },
    { name: 'LongAdder', sig: 'public class LongAdder extends Number\nvoid increment()\nvoid add(long x)\nlong sum()', since: '1.8', covers: ['increment', 'sum', 'LongAccumulator'], see: ['lesson:juc-atomics'],
      docs: API + 'java/util/concurrent/atomic/LongAdder.html',
      summary: 'A counter for many threads at once: it spreads the count over several cells, so threads rarely contend, and `sum()` adds them up. Faster than `AtomicLong` under contention; `sum()` is not a snapshot while others still add.',
      example: `void main() {
    var requests = new LongAdder();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 1_000; i++) executor.submit(requests::increment);
    }
    IO.println(requests.sum());
}`,
      output: '1000' }
  ]);

  /* ---------------------------------------------------------------- collections */
  var CHM = ['ConcurrentHashMap', 'Map'], BQ = ['BlockingQueue'];
  add('collections', 'java.util.concurrent.ConcurrentHashMap', [
    { name: 'ConcurrentHashMap', sig: 'public class ConcurrentHashMap<K, V> implements ConcurrentMap<K, V>', since: '1.5', see: ['lesson:juc-collections'],
      summary: 'A hash map for many threads: reads take no lock, writes lock one bin, and iterating while others change it never throws (it is weakly consistent). It refuses `null` keys and values, with `NullPointerException`.',
      example: `void main() {
    var map = new ConcurrentHashMap<String, Integer>();
    try {
        map.put("k", null);
    } catch (NullPointerException e) {
        IO.println("no null values");
    }
    map.putAll(Map.of("a", 1, "b", 2));
    for (String k : map.keySet()) if (k.length() == 1) map.put(k + k, 0);
    IO.println("changed while iterating, no exception: " + map.size());
}`,
      output: 'no null values\nchanged while iterating, no exception: 4' },
    { name: 'computeIfAbsent', receiver: CHM, title: 'ConcurrentHashMap.computeIfAbsent', sig: 'V computeIfAbsent(K key, Function<? super K, ? extends V> mappingFunction)', since: '1.8', covers: ['compute', 'computeIfPresent'], see: ['lesson:juc-collections'],
      summary: 'Gets the value, or computes and stores it, as **one atomic step** per key: when many threads ask for the same missing key at once, the function runs once and the rest wait for it. Keep the function short, and never let it change the same map.',
      example: `void main() {
    var loads = new AtomicInteger();
    var cache = new ConcurrentHashMap<String, String>();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 50; i++) {
            executor.submit(() -> cache.computeIfAbsent("config", k -> {
                loads.incrementAndGet();
                return "loaded";
            }));
        }
    }
    IO.println("50 threads, loaded " + loads.get() + " time");
}`,
      output: '50 threads, loaded 1 time' },
    { name: 'merge', receiver: CHM, title: 'ConcurrentHashMap.merge', sig: 'V merge(K key, V value, BiFunction<? super V, ? super V, ? extends V> remappingFunction)', since: '1.8', see: ['lesson:juc-collections'],
      summary: 'Puts the value if the key is missing, or combines it with the old one, atomically: `counts.merge(word, 1, Integer::sum)` is a thread-safe counter per key. The `get` then `put` it replaces is a race.',
      example: `void main() {
    var counts = new ConcurrentHashMap<String, Integer>();
    for (String w : "to be or not to be".split(" ")) counts.merge(w, 1, Integer::sum);
    IO.println(new TreeMap<>(counts));
}`,
      output: '{be=2, not=1, or=1, to=2}' },
    { name: 'newKeySet', owner: 'ConcurrentHashMap', sig: 'static <K> ConcurrentHashMap.KeySetView<K, Boolean> newKeySet()', since: '1.8', see: ['lesson:juc-collections'],
      summary: 'A thread-safe `Set` backed by a `ConcurrentHashMap`: the concurrent `HashSet` that the JDK has no class for.',
      example: `void main() {
    Set<Integer> seen = ConcurrentHashMap.newKeySet();
    IntStream.range(0, 1_000).parallel().forEach(i -> seen.add(i % 10));
    IO.println(new TreeSet<>(seen));
}`,
      output: '[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]' },
    { name: 'CopyOnWriteArrayList', sig: 'public class CopyOnWriteArrayList<E> implements List<E>', since: '1.5', see: ['lesson:juc-collections'],
      docs: API + 'java/util/concurrent/CopyOnWriteArrayList.html',
      summary: 'A list that copies its array on every change, so iteration reads a snapshot and never throws. For lists read far more than written: listeners, configuration. Each write costs a full copy.',
      example: `void main() {
    var listeners = new CopyOnWriteArrayList<>(List.of("audit", "metrics"));
    for (String l : listeners) listeners.add(l + "-copy");
    IO.println(listeners);
}`,
      output: '[audit, metrics, audit-copy, metrics-copy]' },
    { name: 'ConcurrentSkipListMap', sig: 'public class ConcurrentSkipListMap<K, V> implements ConcurrentNavigableMap<K, V>', since: '1.6', see: ['lesson:juc-collections'],
      docs: API + 'java/util/concurrent/ConcurrentSkipListMap.html',
      summary: 'A sorted concurrent map (the concurrent `TreeMap`): `firstKey`, `headMap`, `ceilingKey` while other threads add and remove.',
      example: `void main() {
    var byTime = new ConcurrentSkipListMap<Integer, String>(Map.of(30, "c", 10, "a", 20, "b"));
    IO.println(byTime.firstKey() + " " + byTime.ceilingKey(15) + " " + byTime.headMap(30));
}`,
      output: '10 20 {10=a, 20=b}' },
    { name: 'ArrayBlockingQueue', sig: 'public class ArrayBlockingQueue<E> implements BlockingQueue<E>\nnew ArrayBlockingQueue<>(int capacity)', since: '1.5', covers: ['LinkedBlockingQueue', 'SynchronousQueue'], see: ['lesson:juc-collections'],
      docs: API + 'java/util/concurrent/ArrayBlockingQueue.html',
      summary: 'A bounded queue for producers and consumers: `put` waits while it is full, `take` while it is empty. The bound is back pressure. `LinkedBlockingQueue` is unbounded unless given a capacity; a `SynchronousQueue` holds nothing and hands each item over.',
      example: `void main() throws InterruptedException {
    var queue = new ArrayBlockingQueue<Integer>(2);
    Thread consumer = Thread.ofPlatform().start(() -> {
        try {
            int sum = 0;
            for (int i = 0; i < 5; i++) sum += queue.take();
            IO.println("consumed, sum " + sum);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    for (int i = 1; i <= 5; i++) queue.put(i);
    consumer.join();
}`,
      output: 'consumed, sum 15' },
    { name: 'offer', receiver: BQ, sig: 'boolean offer(E e)\nboolean offer(E e, long timeout, TimeUnit unit) throws InterruptedException\nE poll(long timeout, TimeUnit unit) throws InterruptedException', since: '1.5', covers: ['poll', 'put', 'take', 'add'], see: ['lesson:juc-collections'],
      summary: 'The four ways to add to a full queue: `add` throws (`IllegalStateException: Queue full`), `offer` returns `false`, `offer` with a timeout waits that long, `put` waits for ever. `poll` and `take` are the same for an empty queue.',
      example: `void main() throws InterruptedException {
    var queue = new ArrayBlockingQueue<String>(1);
    queue.add("first");
    IO.println("offer: " + queue.offer("second"));
    IO.println("offer for 20 ms: " + queue.offer("second", 20, TimeUnit.MILLISECONDS));
    try {
        queue.add("second");
    } catch (IllegalStateException e) {
        IO.println("add: " + e.getMessage());
    }
    IO.println("poll: " + queue.poll(20, TimeUnit.MILLISECONDS) + ", then " + queue.poll());
}`,
      output: 'offer: false\noffer for 20 ms: false\nadd: Queue full\npoll: first, then null' },
    { name: 'ConcurrentLinkedQueue', sig: 'public class ConcurrentLinkedQueue<E> implements Queue<E>', since: '1.5', see: ['lesson:juc-collections'],
      docs: API + 'java/util/concurrent/ConcurrentLinkedQueue.html',
      summary: 'An unbounded, lock-free queue: `offer` and `poll` never block (`poll` on an empty queue returns `null`). For handing items between threads that do not need to wait.',
      example: `void main() {
    var queue = new ConcurrentLinkedQueue<String>();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 100; i++) executor.submit(() -> queue.offer("event"));
    }
    IO.println(queue.size() + " events, then " + new ConcurrentLinkedQueue<String>().poll());
}`,
      output: '100 events, then null' }
  ]);

  /* ---------------------------------------------------------------- synchronizers */
  add('synchronizers', 'java.util.concurrent.CountDownLatch', [
    { name: 'CountDownLatch', sig: 'new CountDownLatch(int count)\nvoid countDown()\nvoid await() throws InterruptedException', since: '1.5', covers: ['countDown', 'getCount'], see: ['lesson:juc-synchronizers'],
      summary: 'A gate that opens once: `await()` waits until `countDown()` has been called `count` times. A start gate (count 1) lets many threads begin together; a done gate (count n) waits for n workers. It cannot be reset.',
      example: `void main() throws InterruptedException {
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
    IO.println("after: " + ran.get());
}`,
      output: 'before the gate opens: 0\nafter: 3' },
    { name: 'await', key: 'count-down-latch-await', receiver: ['CountDownLatch'], sig: 'void await() throws InterruptedException\nboolean await(long timeout, TimeUnit unit) throws InterruptedException', since: '1.5', see: ['lesson:juc-synchronizers'],
      docs: API + 'java/util/concurrent/CountDownLatch.html',
      summary: 'Waits for the count to reach zero; with a timeout, says whether it did. On an open latch it returns at once, for ever.',
      example: `void main() throws InterruptedException {
    var latch = new CountDownLatch(2);
    latch.countDown();
    IO.println("open within 10 ms: " + latch.await(10, TimeUnit.MILLISECONDS));
    latch.countDown();
    IO.println("open now: " + latch.await(10, TimeUnit.MILLISECONDS));
}`,
      output: 'open within 10 ms: false\nopen now: true' },
    { name: 'CyclicBarrier', sig: 'new CyclicBarrier(int parties, Runnable barrierAction)\nint await() throws InterruptedException, BrokenBarrierException', since: '1.5', see: ['lesson:juc-synchronizers'],
      docs: API + 'java/util/concurrent/CyclicBarrier.html',
      summary: 'A meeting point for a fixed number of threads, round after round: each `await()` waits until all `parties` arrive, the barrier action runs once, and all go on. If one waiter is interrupted the barrier **breaks** for everyone (`BrokenBarrierException`) until `reset()`.',
      example: `void main() {
    List<String> log = Collections.synchronizedList(new ArrayList<>());
    var barrier = new CyclicBarrier(3, () -> log.add("round"));
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 3; i++) executor.submit(() -> { barrier.await(); barrier.await(); return null; });
    }
    IO.println(log);
}`,
      output: '[round, round]' },
    { name: 'Semaphore', sig: 'new Semaphore(int permits)\nvoid acquire() throws InterruptedException\nboolean tryAcquire()\nvoid release()', since: '1.5', covers: ['acquire', 'release', 'tryAcquire', 'availablePermits'], see: ['lesson:juc-synchronizers', 'lesson:vt-limit'],
      docs: API + 'java/util/concurrent/Semaphore.html',
      summary: 'A count of permits: `acquire()` takes one (waiting if none is left), `release()` gives one back. At most n threads in a section at once. Nothing checks that a thread releases only what it took: release in `finally`, once.',
      example: `void main() throws InterruptedException {
    var permits = new Semaphore(2);
    permits.acquire();
    IO.println(permits.tryAcquire() + " " + permits.tryAcquire() + ", left " + permits.availablePermits());
    permits.release(3);
    IO.println("after releasing 3 (only 2 taken): " + permits.availablePermits());
}`,
      output: 'true false, left 0\nafter releasing 3 (only 2 taken): 3' },
    { name: 'Phaser', sig: 'new Phaser(int parties)\nint register()\nint arriveAndAwaitAdvance()\nint arriveAndDeregister()', since: '1.7', covers: ['register', 'arriveAndAwaitAdvance', 'arriveAndDeregister'], see: ['lesson:juc-synchronizers'],
      docs: API + 'java/util/concurrent/Phaser.html',
      summary: 'A barrier whose parties can join and leave between phases: `register()` adds one, `arriveAndDeregister()` leaves, `arriveAndAwaitAdvance()` waits for the others and returns the next phase\'s number.',
      example: `void main() throws InterruptedException {
    var phaser = new Phaser(1);
    phaser.register();
    Thread other = Thread.ofVirtual().start(() -> {
        phaser.arriveAndAwaitAdvance();
        phaser.arriveAndDeregister();
    });
    IO.println("phase " + phaser.arriveAndAwaitAdvance());
    other.join();
    IO.println("parties left: " + phaser.getRegisteredParties());
}`,
      output: 'phase 1\nparties left: 1' },
    { name: 'Exchanger', sig: 'new Exchanger<V>()\nV exchange(V x) throws InterruptedException', since: '1.5', covers: ['exchange'], see: ['lesson:juc-synchronizers'],
      docs: API + 'java/util/concurrent/Exchanger.html',
      summary: 'Two threads swap objects: each `exchange(x)` waits for the other and returns what it gave. A pair of buffers, one filled while the other is emptied.',
      example: `void main() throws InterruptedException {
    var exchanger = new Exchanger<String>();
    String[] got = new String[1];
    Thread other = Thread.ofVirtual().start(() -> {
        try { got[0] = exchanger.exchange("full buffer"); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    });
    String mine = exchanger.exchange("empty buffer");
    other.join();
    IO.println("main got the " + mine + ", the other got the " + got[0]);
}`,
      output: 'main got the full buffer, the other got the empty buffer' }
  ]);

  /* ---------------------------------------------------------------- fork/join */
  add('forkjoin', 'java.util.concurrent.ForkJoinPool', [
    { name: 'ForkJoinPool', sig: 'public class ForkJoinPool extends AbstractExecutorService\nnew ForkJoinPool(int parallelism)\n<T> T invoke(ForkJoinTask<T> task)', since: '1.7', covers: ['invoke'], see: ['lesson:juc-forkjoin'],
      summary: 'A pool for tasks that split into subtasks: each worker has its own deque and, when idle, **steals** work from another\'s. `invoke(task)` runs a task and waits for it. Closeable since Java 19.',
      example: `void main() {
    try (var pool = new ForkJoinPool(2)) {
        IO.println("parallelism " + pool.getParallelism() + ", answer " + pool.invoke(ForkJoinTask.adapt(() -> 6 * 7)));
    }
}`,
      output: 'parallelism 2, answer 42' },
    { name: 'commonPool', owner: 'ForkJoinPool', sig: 'static ForkJoinPool commonPool()', since: '1.8', see: ['lesson:juc-forkjoin'],
      summary: 'The JVM\'s shared pool: parallel streams and `CompletableFuture`\'s `…Async` methods without an executor run here. Its parallelism is the number of processors less one (the calling thread helps); one task that blocks takes a worker from everybody.',
      example: `void main() {
    int cores = Runtime.getRuntime().availableProcessors();
    IO.println("processors less one: " + (ForkJoinPool.commonPool().getParallelism() == Math.max(1, cores - 1)));
}`,
      output: 'processors less one: true' },
    { name: 'RecursiveTask', sig: 'public abstract class RecursiveTask<V> extends ForkJoinTask<V>\nprotected abstract V compute()\n// ForkJoinTask: fork(), join()', since: '1.7', covers: ['compute', 'fork', 'join', 'RecursiveAction'], see: ['lesson:juc-forkjoin'],
      docs: API + 'java/util/concurrent/RecursiveTask.html',
      summary: 'A task that returns a value and may split itself: in `compute()`, a small piece is done directly; a big one makes two halves, `fork()`s one, computes the other, and `join()`s the first. `RecursiveAction` is the same with no result.',
      example: `class Sum extends RecursiveTask<Long> {
    final long[] a;
    final int lo, hi;
    Sum(long[] a, int lo, int hi) { this.a = a; this.lo = lo; this.hi = hi; }
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
    long[] a = LongStream.rangeClosed(1, 100_000).toArray();
    try (var pool = new ForkJoinPool(4)) {
        IO.println(pool.invoke(new Sum(a, 0, a.length)));
    }
}`,
      output: '5000050000' },
    { name: 'parallelStream', receiver: ['Collection'], title: 'Collection.parallelStream', sig: 'default Stream<E> parallelStream()\n// and stream().parallel()', since: '1.8', covers: ['parallel'], see: ['lesson:juc-forkjoin'],
      docs: API + 'java/util/Collection.html',
      summary: 'A stream whose work is split over the common pool and the calling thread. Worth it for big, CPU-bound, side-effect-free work; `toList()` and `forEachOrdered` keep the order, `forEach` does not; a blocking call inside holds one of the pool\'s few threads.',
      example: `void main() {
    List<Integer> numbers = IntStream.rangeClosed(1, 8).boxed().toList();
    IO.println(numbers.parallelStream().map(n -> n * n).toList());
    IO.println(numbers.parallelStream().mapToInt(n -> n).sum());
}`,
      output: '[1, 4, 9, 16, 25, 36, 49, 64]\n36' }
  ]);
})(window.JCLT);
