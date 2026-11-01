/*
 * data/quizzes-threads.js - the quiz at the end of each Threads and the memory model lesson (batch 3).
 * The shape is described at the top of data/quizzes-virtual-threads.js.
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};

  Q['th-basics'] = [
    { q: 'What does this program print?',
      code: 'void main() {\n    Thread t = Thread.ofPlatform().name("w").unstarted(() -> IO.println(Thread.currentThread().getName()));\n    t.run();\n}',
      choices: ['`main`', '`w`', '`Thread-0`'],
      answer: 0,
      why: '`run()` is an ordinary method call: the task runs on the thread that called it. Only `start()` makes a new thread.' },
    { q: 'What does this program print?',
      code: 'void main() throws InterruptedException {\n    Thread t = Thread.ofPlatform().unstarted(() -> { });\n    IO.println(t.getState());\n    t.start();\n    t.join();\n    IO.println(t.getState());\n}',
      choices: ['`NEW\nTERMINATED`', '`RUNNABLE\nTERMINATED`', '`NEW\nRUNNABLE`'],
      answer: 0,
      why: 'Made but not started is `NEW`; after `join()` returns, the thread has ended: `TERMINATED`.' },
    { q: 'A thread started by `main` throws an exception nobody catches. What happens to `main`?',
      choices: ['Nothing: it goes on; the exception ends only the other thread (and is printed by its handler)', 'main gets the exception at its next line', 'The JVM exits', 'main is interrupted'],
      answer: 0,
      why: 'An uncaught exception ends its own thread. To hear about it, set an uncaught-exception handler, or run the task on an executor and read its `Future`.' },
    { q: 'When does the JVM end, if main has returned?',
      choices: ['When the only threads left are daemon threads', 'At once, whatever other threads are doing', 'When every thread, daemon or not, has ended', 'Only when System.exit is called'],
      answer: 0,
      why: 'Non-daemon threads keep the JVM alive; daemon threads (every virtual thread, and platform threads made with `daemon(true)`) do not.' }
  ];

  Q['th-races'] = [
    { q: 'Why can `count++` lose updates when two threads run it at once?',
      choices: ['It is three steps (read, add, write), and both threads can read before either writes', 'Because int is not thread-safe in Java', 'Because the JIT removes it', 'It cannot: ++ is atomic'],
      answer: 0,
      why: 'Read-modify-write. Make the three steps one: a lock, or `AtomicInteger.incrementAndGet()`.' },
    { q: 'What does this program print?',
      code: 'int count = 0;\n\nvoid main() throws InterruptedException {\n    var bothRead = new CountDownLatch(2);\n    Runnable inc = () -> {\n        int seen = count;\n        bothRead.countDown();\n        try { bothRead.await(); } catch (InterruptedException e) { return; }\n        count = seen + 1;\n    };\n    Thread a = Thread.ofPlatform().start(inc), b = Thread.ofPlatform().start(inc);\n    a.join();\n    b.join();\n    IO.println(count);\n}',
      choices: ['`1`', '`2`', '`0`'],
      answer: 0,
      why: 'The latch makes both threads read 0 before either writes, so both write 1: a lost update, every run.' },
    { q: 'Your test runs a racy counter 10 times and gets the right total every time. What has it proved?',
      choices: ['Nothing: the race can stay hidden (measured: once the JIT compiled the loop, no updates were lost)', 'That the counter is thread-safe', 'That the race happens only on other PCs', 'That the JIT fixed the race'],
      answer: 0,
      why: 'Races depend on timing, the JIT and the hardware. Reason about the code, or force the window open as this tool\'s checks do.' },
    { q: '`if (!map.containsKey(k)) map.put(k, v);` on a `ConcurrentHashMap`, from many threads. Is it safe?',
      choices: ['No: each call is thread-safe, but another thread can put between the check and the act; use putIfAbsent', 'Yes: ConcurrentHashMap makes it safe', 'Only with volatile', 'Yes, if the map is final'],
      answer: 0,
      why: 'Check-then-act across two calls. `putIfAbsent`, `computeIfAbsent` and `merge` do it as one atomic step.' }
  ];

  Q['th-visibility'] = [
    { q: 'A thread loops `while (!ready) { }` on a plain boolean field, and another thread sets it to true. What does Java promise?',
      choices: ['Nothing: the reader may never see it (here it spun for ever in 12 runs of 12)', 'The reader sees it at once', 'The reader sees it within a millisecond', 'The reader sees it at the next garbage collection'],
      answer: 0,
      why: 'Without a happens-before edge there is no visibility guarantee; the JIT may read the field once, before the loop. `volatile` gives the edge.' },
    { q: 'What does this program print?',
      code: 'int[] box = new int[1];\n\nvoid main() throws InterruptedException {\n    box[0] = 1;\n    Thread t = Thread.ofPlatform().start(() -> box[0] = box[0] + 10);\n    t.join();\n    IO.println(box[0]);\n}',
      choices: ['`11`', '`10`', '`1`'],
      answer: 0,
      why: 'What main wrote before `start()` is visible in the thread, and what the thread wrote is visible after `join()`: both are happens-before edges.' },
    { q: 'Which statement about `volatile int count` is true?',
      choices: ['Each read and write is visible to other threads, but count++ is still not atomic', 'count++ becomes atomic', 'It makes the field final', 'It locks the object while count is written'],
      answer: 0,
      why: 'Visibility, not atomicity. For read-modify-write, use a lock or an atomic.' },
    { q: 'Thread A writes `data = 42` and then `ready = true` (ready is volatile). Thread B reads `ready == true`. What does B see in data?',
      choices: ['42: the write to data happens-before the volatile write, which happens-before B\'s read', 'Possibly 0: data is not volatile', '42 only if data is also volatile', 'Whatever the CPU cache holds'],
      answer: 0,
      why: 'Happens-before is transitive: program order, then volatile write to read, then program order again.' }
  ];

  Q['th-synchronized'] = [
    { q: 'What does this program print?',
      code: 'class Counter {\n    private int n;\n    synchronized void inc() { n++; }\n    synchronized void twice() { inc(); inc(); }\n    synchronized int get() { return n; }\n}\n\nvoid main() {\n    var c = new Counter();\n    c.twice();\n    IO.println(c.get());\n}',
      choices: ['`2`', 'Nothing: it deadlocks', '`1`'],
      answer: 0,
      why: 'Monitors are reentrant: a thread may take a lock it already holds.' },
    { q: 'Two threads each run `synchronized (new Object()) { count++; }`. Is count safe?',
      choices: ['No: each thread locks its own new object, so they never exclude each other', 'Yes: the block is synchronized', 'Yes, if count is volatile', 'Only on one carrier thread'],
      answer: 0,
      why: 'A lock protects only against threads that take the same lock.' },
    { q: 'What does a `static synchronized` method lock?',
      choices: ['The class object', 'this', 'Nothing: static methods cannot be synchronized', 'Every instance of the class'],
      answer: 0,
      why: 'One lock shared by all instances; an instance `synchronized` method locks `this`, a different lock.' },
    { q: 'A thread dump shows 40 request threads BLOCKED on the same monitor of a singleton bean. The likely cause?',
      choices: ['A synchronized method that does slow work (I/O) while holding the lock', 'Too few virtual threads', 'A volatile field', 'The garbage collector'],
      answer: 0,
      why: 'Every request waits its turn for that lock. Do the slow work outside the critical section.' }
  ];

  Q['th-wait-notify'] = [
    { q: 'Why must `wait()` be called in a `while` loop that checks the condition?',
      choices: ['A thread can wake without the condition being true: a spurious wakeup, or another thread took it first', 'Because wait() returns immediately', 'Because if is slower', 'To release the lock'],
      answer: 0,
      why: 'Check again after every wake-up: `while (!condition) lock.wait();`.' },
    { q: 'What does this program print?',
      code: 'void main() {\n    Object lock = new Object();\n    try {\n        lock.notifyAll();\n        IO.println("ok");\n    } catch (IllegalMonitorStateException e) {\n        IO.println(e.getMessage());\n    }\n}',
      choices: ['`current thread is not owner`', '`ok`', '`null`'],
      answer: 0,
      why: '`wait`, `notify` and `notifyAll` need the object\'s monitor: call them inside `synchronized (lock)`.' },
    { q: 'What is the main difference between `wait()` and `Thread.sleep()`?',
      choices: ['wait() releases the monitor while it waits; sleep() keeps every lock it holds', 'sleep() releases the monitor; wait() keeps it', 'wait() cannot be interrupted', 'There is none'],
      answer: 0,
      why: 'That is why `wait` must be called holding the monitor, and why sleeping in a `synchronized` block makes others wait too.' },
    { q: 'Producers and consumers wait on the same object. Why prefer `notifyAll()` to `notify()`?',
      choices: ['notify() wakes one thread, maybe a producer when only a consumer could go on, and everyone sleeps', 'notifyAll() is faster', 'notify() is deprecated', 'notify() releases the lock early'],
      answer: 0,
      why: 'notifyAll wakes all, each rechecks its condition. A Condition per kind of waiter is the precise tool.' }
  ];

  Q['th-deadlock'] = [
    { q: 'Thread 1 holds lock A and asks for B; thread 2 holds B and asks for A. What breaks the deadlock for good?',
      choices: ['Every thread takes the locks in the same global order', 'Calling interrupt() on one of them', 'Making the locks volatile', 'Adding a Thread.sleep before the second lock'],
      answer: 0,
      why: 'A global order makes a cycle impossible. A BLOCKED thread ignores interrupts, and a sleep only changes the odds.' },
    { q: 'What does this program print?',
      code: 'void main() throws Exception {\n    try (var pool = Executors.newFixedThreadPool(1)) {\n        Future<String> outer = pool.submit(() -> {\n            Future<String> inner = pool.submit(() -> "inner");\n            try {\n                return inner.get(200, TimeUnit.MILLISECONDS);\n            } catch (TimeoutException e) {\n                return "timeout";\n            }\n        });\n        IO.println(outer.get());\n    }\n}',
      choices: ['`timeout`', '`inner`'],
      answer: 0,
      why: 'The only thread runs the outer task, which waits for the inner one queued behind it: a thread-starvation deadlock (here broken by the timeout).' },
    { q: 'Which tool finds a deadlock in a running JVM?',
      choices: ['jstack or jcmd Thread.print ("Found one Java-level deadlock"), or ThreadMXBean.findDeadlockedThreads()', 'A heap dump', 'The GC log', 'JFR\'s CPU profile'],
      answer: 0,
      why: 'Thread dumps show who holds and who waits for each lock, and report the cycle.' },
    { q: 'Two threads keep backing off and retrying in step, never getting both locks, though neither is blocked. What is this?',
      choices: ['A livelock', 'A deadlock', 'Starvation of the garbage collector', 'Pinning'],
      answer: 0,
      why: 'Busy but making no progress. A random back-off breaks the symmetry.' }
  ];

  Q['th-interrupts'] = [
    { q: 'What does this program print?',
      code: 'void main() {\n    Thread.currentThread().interrupt();\n    IO.println(Thread.interrupted() + " " + Thread.interrupted());\n}',
      choices: ['`true false`', '`true true`', '`false false`'],
      answer: 0,
      why: 'The static `Thread.interrupted()` reads and clears the flag; `isInterrupted()` reads without clearing.' },
    { q: 'You catch `InterruptedException` inside a `Runnable`, which may not throw it. What should the catch block do?',
      choices: ['Stop the work and restore the flag: Thread.currentThread().interrupt()', 'Nothing: an empty catch', 'Log it and carry on', 'Call Thread.stop()'],
      answer: 0,
      why: 'Throwing the exception cleared the flag. Restoring it passes the request to stop on to the code above you.' },
    { q: 'A thread is BLOCKED entering a `synchronized` block when it is interrupted. What happens?',
      choices: ['It keeps waiting for the monitor; its flag stays set', 'It throws InterruptedException at once', 'It gets the lock at once', 'It ends'],
      answer: 0,
      why: 'Monitor entry ignores interrupts (measured). `ReentrantLock.lockInterruptibly()` does answer them.' },
    { q: 'What does `thread.stop()` do on Java 25?',
      choices: ['Throws UnsupportedOperationException; the thread runs on', 'Kills the thread at once', 'Interrupts the thread', 'It does not compile'],
      answer: 0,
      why: 'Measured. Stopping is cooperative: interrupt, and let the thread\'s own code stop.' }
  ];

  Q['th-publication'] = [
    { q: 'What does this program print?',
      code: 'record Order(List<String> items) { }\n\nvoid main() {\n    List<String> cart = new ArrayList<>(List.of("tea"));\n    Order o = new Order(cart);\n    cart.add("cake");\n    IO.println(o.items().size());\n}',
      choices: ['`2`', '`1`'],
      answer: 0,
      why: 'A record is only shallowly immutable: it holds the same list. Copy it in a compact constructor with `List.copyOf`.' },
    { q: 'What does this program print?',
      code: 'void main() {\n    List<String> base = new ArrayList<>(List.of("a"));\n    List<String> view = Collections.unmodifiableList(base);\n    List<String> copy = List.copyOf(base);\n    base.add("b");\n    IO.println(view.size() + " " + copy.size());\n}',
      choices: ['`2 1`', '`1 1`', '`2 2`'],
      answer: 0,
      why: '`unmodifiableList` is a read-only view of the same list; `List.copyOf` is a copy.' },
    { q: 'Which of these does NOT publish an object safely to other threads?',
      choices: ['Assigning it to a plain (non-volatile) field that other threads read without a lock', 'Storing it in a ConcurrentHashMap', 'Assigning it to a volatile field', 'Creating it in a static initialiser'],
      answer: 0,
      why: 'Without a happens-before edge a reader may see the reference before the object\'s fields are set.' },
    { q: 'A pooled thread\'s task sets a ThreadLocal and never removes it. What does the next task on that thread see?',
      choices: ['The value the last task left there', 'The initial value', 'null, always', 'It throws'],
      answer: 0,
      why: 'The thread outlives the task, and its ThreadLocal values with it (measured). Remove it in finally.' }
  ];
})(window.JCLT);
