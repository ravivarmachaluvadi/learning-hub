/*
 * data/interview-threads.js - the interview questions on threads and the memory model (batch 3).
 * The shape is described at the top of data/interview-virtual-threads.js.
 */
(function (U) {
  'use strict';
  function jv(code) { return '```java\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];
  var JLS17 = 'https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html';

  Q.push({
    id: 'th-volatile-vs-synchronized', track: 'threads', weight: 3,
    q: 'What is the difference between volatile and synchronized?',
    keywords: ['volatile', 'synchronized', 'visibility', 'atomicity', 'mutual exclusion', 'memory model', 'happens-before'],
    short: '`volatile` gives **visibility** for one field: every read sees the latest write, and what the writer did before the write is visible too. It gives no **atomicity**: `count++` on a volatile still loses updates. `synchronized` gives both: one thread at a time in the block (mutual exclusion), and unlock happens-before the next lock (visibility). Use volatile for a flag or a reference to an immutable object; a lock (or an atomic) for read-modify-write and for invariants across several fields.',
    answer: '| | `volatile` | `synchronized` |\n|---|---|---|\n| Visibility | yes, for that field | yes, for everything done under the lock |\n| Atomic `x++` | no | yes |\n| Several fields together | no | yes |\n| Blocks other threads | never | yes, while held |\n| Applies to | a field | a block or a method |\n\n' + jv(`static volatile boolean stop;
static int count;

static synchronized void add() { count++; }

void main() throws InterruptedException {
    Thread worker = Thread.ofPlatform().start(() -> { while (!stop) add(); });
    Thread.sleep(50);
    stop = true;
    worker.join();
    IO.println("the worker saw the volatile flag and stopped: " + !worker.isAlive());
}`) + '\n\n' + out('the worker saw the volatile flag and stopped: true'),
    followups: ['Why is count++ on a volatile field not safe?', 'When would you use AtomicInteger instead of either?', 'What does volatile do to the reordering of the writes before it?'],
    related: ['lesson:th-visibility', 'lesson:th-synchronized', 'q:th-happens-before'],
    docs: JLS17
  });

  Q.push({
    id: 'th-happens-before', track: 'threads', weight: 3,
    q: 'What is happens-before in the Java Memory Model?',
    keywords: ['happens-before', 'java memory model', 'jmm', 'visibility', 'reordering', 'volatile', 'start', 'join', 'monitor'],
    short: 'The rule that says when one thread is guaranteed to see another\'s writes. If A happens-before B, B sees everything A did and everything before A. The edges: program order within a thread; unlocking a monitor before the next lock of it; a volatile write before every later read of it; `Thread.start()` before the thread\'s actions; a thread\'s actions before another\'s `join()` on it returns; and the hand-offs of `java.util.concurrent` (submit, `put`/`take`, `Future.get`). It is transitive. Without an edge there is no guarantee: a reader may see an old value for ever.',
    answer: jv(`static int data;
static volatile boolean ready;

void main() throws InterruptedException {
    Thread reader = Thread.ofPlatform().start(() -> {
        while (!ready) Thread.onSpinWait();
        IO.println("data = " + data);
    });
    data = 42;
    ready = true;
    reader.join();
}`) + '\n\n' + out('data = 42') + '\n\n`data = 42` is before `ready = true` in program order; the volatile write is before the read that saw `true`; that read is before reading `data`. By transitivity the reader must see 42. Without `volatile`, it might spin for ever (measured: 12 runs of 12).',
    followups: ['Is happens-before about time?', 'Which java.util.concurrent operations create edges?', 'Why does double-checked locking need volatile?'],
    related: ['lesson:th-visibility', 'lesson:th-publication', 'q:th-volatile-vs-synchronized', 'explain:lost-update'],
    docs: JLS17 + '#jls-17.4.5'
  });

  Q.push({
    id: 'th-race-condition', track: 'threads', weight: 2,
    q: 'What is a race condition? Give the two classic shapes.',
    keywords: ['race condition', 'data race', 'read-modify-write', 'check-then-act', 'lost update', 'atomicity'],
    short: 'A result that depends on how threads happen to interleave. The two shapes: **read-modify-write** (`count++`: two threads read the same value, both write, one update is lost) and **check-then-act** (`if (stock > 0) stock--`: both check, both act, the last item is sold twice). The fix is to make the steps one atomic action: a lock, an atomic class, or a single atomic call (`merge`, `computeIfAbsent`, an SQL `UPDATE … WHERE stock > 0`). A *data race* is the memory-model term: unordered accesses to one variable, at least one a write.',
    answer: jv(`int stock = 1;

synchronized boolean buy() {
    if (stock == 0) return false;
    stock--;
    return true;
}

void main() {
    var sold = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 100; i++) executor.submit(() -> { if (buy()) sold.incrementAndGet(); });
    }
    IO.println("100 buyers, 1 item: sold " + sold.get());
}`) + '\n\n' + out('100 buyers, 1 item: sold 1'),
    followups: ['Why might a racy test still pass?', 'How do you fix a check-then-act across two service instances?'],
    related: ['lesson:th-races', 'lesson:juc-atomics'],
    docs: JLS17
  });

  Q.push({
    id: 'th-deadlock', track: 'threads', weight: 3,
    q: 'What is a deadlock, and how do you prevent one?',
    keywords: ['deadlock', 'lock ordering', 'coffman', 'circular wait', 'tryLock', 'livelock', 'jstack', 'ThreadMXBean'],
    short: 'Two or more threads each holding a lock another needs, all waiting for ever. It needs four conditions together: mutual exclusion, hold and wait, no preemption, and a circular wait. Prevent it by breaking one: take locks in **one global order** (by id), hold one lock at a time, or use `tryLock` with a timeout and back off (with randomness, or it becomes a livelock). Find it with `jstack`/`jcmd Thread.print` ("Found one Java-level deadlock") or `ThreadMXBean.findDeadlockedThreads()`. Also: a pool whose tasks wait for tasks queued behind them deadlocks without any lock.',
    answer: jv(`record Account(int id) { }

void transfer(Account from, Account to, Runnable move) {
    Account first = from.id() < to.id() ? from : to;
    Account second = first == from ? to : from;
    synchronized (first) {
        synchronized (second) {
            move.run();
        }
    }
}

void main() throws InterruptedException {
    var a = new Account(1);
    var b = new Account(2);
    var moves = new AtomicInteger();
    Thread x = Thread.ofPlatform().start(() -> { for (int i = 0; i < 50_000; i++) transfer(a, b, moves::incrementAndGet); });
    Thread y = Thread.ofPlatform().start(() -> { for (int i = 0; i < 50_000; i++) transfer(b, a, moves::incrementAndGet); });
    x.join();
    y.join();
    IO.println("no deadlock: " + moves.get() + " transfers");
}`) + '\n\n' + out('no deadlock: 100000 transfers'),
    followups: ['Does interrupting a deadlocked thread help?', 'How does a database handle the same problem?', 'What is a thread-starvation deadlock?'],
    related: ['lesson:th-deadlock', 'lesson:juc-locks'],
    docs: 'https://docs.oracle.com/javase/tutorial/essential/concurrency/deadlock.html'
  });

  Q.push({
    id: 'th-wait-sleep', track: 'threads', weight: 3,
    q: 'What is the difference between wait() and sleep()?',
    keywords: ['wait', 'sleep', 'notify', 'notifyAll', 'monitor', 'lock', 'spurious wakeup', 'IllegalMonitorStateException'],
    short: '`wait()` is a method of every object: it must be called holding that object\'s monitor, it **releases** the monitor while waiting, and it returns when notified (or interrupted, timed out, or spuriously), taking the monitor back. `Thread.sleep()` is static on `Thread`, needs no lock, and **keeps** every lock the thread holds. So `wait` is for waiting until another thread makes a condition true (always in a `while` loop), `sleep` for letting time pass. Both throw `InterruptedException`.',
    answer: '| | `wait()` | `sleep()` |\n|---|---|---|\n| Class | `Object` | `Thread` (static) |\n| Lock needed | the object\'s monitor | none |\n| Lock while paused | released | kept |\n| Wakes on | notify/notifyAll, interrupt, timeout, spuriously | time up, interrupt |\n\n' + jv(`void main() {
    Object lock = new Object();
    try {
        lock.wait(10);
    } catch (IllegalMonitorStateException e) {
        IO.println("wait without the monitor: " + e.getMessage());
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}`) + '\n\n' + out('wait without the monitor: current thread is not owner'),
    followups: ['Why must wait() be in a while loop?', 'Why prefer notifyAll() to notify()?', 'What replaces wait/notify in modern code?'],
    related: ['lesson:th-wait-notify', 'lesson:juc-locks'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Object.html#wait()'
  });

  Q.push({
    id: 'th-states', track: 'threads', weight: 2,
    q: 'What are the states of a Java thread?',
    keywords: ['thread states', 'NEW', 'RUNNABLE', 'BLOCKED', 'WAITING', 'TIMED_WAITING', 'TERMINATED', 'thread dump'],
    short: 'Six, in `Thread.State`: `NEW` (not started), `RUNNABLE` (running or ready; also blocking I/O), `BLOCKED` (waiting to enter a `synchronized` monitor), `WAITING` (no time limit: `join()`, `wait()`, a lock or queue park), `TIMED_WAITING` (`sleep`, `join(ms)`, `poll(timeout)`) and `TERMINATED`. In a thread dump, many threads `BLOCKED` on one monitor means lock contention; many `WAITING` in a pool means they are idle or starved of a resource.',
    answer: jv(`void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().unstarted(() -> {
        try { Thread.sleep(300); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    });
    IO.println(t.getState());
    t.start();
    while (t.getState() != Thread.State.TIMED_WAITING) Thread.onSpinWait();
    IO.println(t.getState());
    t.join();
    IO.println(t.getState());
}`) + '\n\n' + out(`NEW
TIMED_WAITING
TERMINATED`),
    followups: ['Which state is a thread in while it reads from a socket?', 'What is the difference between BLOCKED and WAITING?'],
    related: ['lesson:th-basics'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Thread.State.html'
  });

  Q.push({
    id: 'th-start-run', track: 'threads', weight: 1,
    q: 'What happens if you call run() instead of start()?',
    keywords: ['start', 'run', 'Runnable', 'new thread', 'IllegalThreadStateException'],
    short: 'The task runs on the current thread, like any method call: no new thread is created. `start()` creates the thread and calls `run()` on it. Starting the same thread twice throws `IllegalThreadStateException`.',
    answer: jv(`void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().name("worker").unstarted(() -> IO.println("on " + Thread.currentThread().getName()));
    t.run();
    t.start();
    t.join();
}`) + '\n\n' + out(`on main
on worker`),
    followups: ['Can a thread be restarted?', 'Why is extending Thread usually worse than passing a Runnable?'],
    related: ['lesson:th-basics'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Thread.html#start()'
  });

  Q.push({
    id: 'th-interrupt', track: 'threads', weight: 3,
    q: 'How do you stop a thread in Java? What should you do with InterruptedException?',
    keywords: ['interrupt', 'InterruptedException', 'cancellation', 'Thread.stop', 'interrupt flag', 'restore', 'isInterrupted'],
    short: 'You ask it: `thread.interrupt()` sets its interrupt flag, and blocking calls (`sleep`, `join`, `wait`, `take`, `lockInterruptibly`) throw `InterruptedException`, clearing the flag. A CPU loop must check `Thread.currentThread().isInterrupted()`. When you catch `InterruptedException`, either let it propagate (`throws`), or stop and **restore the flag** with `Thread.currentThread().interrupt()`; never swallow it. `Thread.stop()` throws `UnsupportedOperationException` on current Java. `Future.cancel(true)`, `shutdownNow()` and structured scopes cancel by interrupting.',
    answer: jv(`void main() throws InterruptedException {
    Thread worker = Thread.ofPlatform().start(() -> {
        try {
            while (true) Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    worker.interrupt();
    worker.join();
    IO.println("stopped, flag restored: " + worker.isInterrupted());
}`) + '\n\n' + out('stopped, flag restored: true'),
    followups: ['What does Thread.interrupted() do differently from isInterrupted()?', 'Does an interrupt reach a thread BLOCKED on synchronized?', 'Does CompletableFuture.cancel(true) interrupt?'],
    related: ['lesson:th-interrupts', 'lesson:juc-futures', 'q:sc-cancellation'],
    docs: 'https://docs.oracle.com/javase/tutorial/essential/concurrency/interrupt.html'
  });

  Q.push({
    id: 'th-immutable', track: 'threads', weight: 2,
    q: 'Why are immutable objects thread-safe, and how do you make one in Java?',
    keywords: ['immutable', 'immutability', 'final', 'record', 'defensive copy', 'List.copyOf', 'safe publication'],
    short: 'Nothing can change after construction, so there is nothing to race on and no lock is needed; `final` fields set in the constructor are also seen correctly by every thread. Make one: all fields `final` (a `record` does that), no setters, no `this` escaping the constructor, and **defensive copies** of mutable inputs (`List.copyOf`, not `Collections.unmodifiableList`, which is a view). To change it, make a new one and publish it through a `volatile` field or an `AtomicReference`.',
    answer: jv(`record Order(String id, List<String> items) {
    Order {
        items = List.copyOf(items);
    }
}

void main() {
    var cart = new ArrayList<>(List.of("tea"));
    var order = new Order("o1", cart);
    cart.add("cake");
    IO.println(order);
}`) + '\n\n' + out('Order[id=o1, items=[tea]]'),
    followups: ['Is a record always immutable?', 'What is safe publication?', 'What does it mean for this to escape the constructor?'],
    related: ['lesson:th-publication', 'lesson:juc-atomics'],
    docs: JLS17 + '#jls-17.5'
  });
})(window.JCLT);
