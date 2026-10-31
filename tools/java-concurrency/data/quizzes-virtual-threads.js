/*
 * data/quizzes-virtual-threads.js - the quiz at the end of each Virtual threads lesson (js/views/quiz.js draws them).
 *
 * Q['<lesson id>'] = [{q (Markdown), code? (a whole program, shown under the question), choices: [..],
 *   answer (the index of the right choice), why}]
 * A question with `code` asks what it prints: its right choice is the output (one line), in backticks, and
 * tests/test_content.py runs the program to prove it (and that no wrong choice is the output too).
 * Question ids are '<lesson id>/<position>' (the review keeps them): append new questions at the end.
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};

  Q['vt-why'] = [
    { q: 'A service gets 500 requests a second, and each takes 0.1 s, nearly all of it waiting for a database. By Little\'s law, how many requests are in flight at once?',
      choices: ['50', '500', '5', '5,000'],
      answer: 0,
      why: 'In flight = arrival rate × time in the system = 500 × 0.1 = 50. With a thread per request, that is 50 threads busy at any moment.' },
    { q: 'What do virtual threads improve?',
      choices: ['Throughput, when requests spend their time waiting', 'The latency of a single request', 'How fast CPU-heavy code runs', 'Garbage collection pauses'],
      answer: 0,
      why: 'A request takes as long as before, and computing is no faster. What changes is how many requests can wait at once, so more are served per second.' },
    { q: 'What does this program print?',
      code: 'void main() throws Exception {\n    var count = new AtomicInteger();\n    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n        for (int i = 0; i < 1_000; i++) {\n            executor.submit(() -> { Thread.sleep(10); return count.incrementAndGet(); });\n        }\n    }\n    IO.println(count.get());\n}',
      choices: ['`1000`', '`0`', 'A number below 1000 that changes from run to run'],
      answer: 0,
      why: 'The try-with-resources block closes the executor at its end, and `close()` waits for every task. So all 1,000 have counted by the time `count.get()` runs.' },
    { q: 'Which is true of a platform thread?',
      choices: ['It wraps one operating-system thread for its whole life', 'The JVM moves it between operating-system threads while it waits', 'It costs about as little as a virtual thread', 'It is always a daemon thread'],
      answer: 0,
      why: 'A platform thread is a thin wrapper around an OS thread, with a stack the OS reserves. That is why there can be thousands of them, not millions.' }
  ];

  Q['vt-create'] = [
    { q: 'What does this program print?',
      code: 'void main() {\n    Thread.startVirtualThread(() -> {\n        try { Thread.sleep(500); } catch (InterruptedException e) { return; }\n        IO.println("hello from the virtual thread");\n    });\n    IO.println("main done");\n}',
      choices: ['`main done`', '`hello from the virtual thread`', 'Both lines, `main done` first'],
      answer: 0,
      why: 'Virtual threads are always daemon threads, and the JVM does not wait for daemon threads: `main` returns and the program ends while the virtual thread still sleeps.' },
    { q: 'What happens when you call `setDaemon(false)` on a virtual thread?',
      choices: ['It throws `IllegalArgumentException`', 'The JVM will wait for it before exiting', 'Nothing: it is ignored', 'It turns into a platform thread'],
      answer: 0,
      why: 'A virtual thread is always a daemon. `setDaemon(false)` throws, with the message "\'false\' not legal for virtual threads".' },
    { q: 'What does this program print?',
      code: 'void main() {\n    Thread t = Thread.ofVirtual().name("worker-", 5).unstarted(() -> {});\n    IO.println(t.getName());\n}',
      choices: ['`worker-5`', '`worker-`', '`worker-0`', '`` (an empty line)'],
      answer: 0,
      why: '`name(prefix, start)` names the thread the prefix followed by a counter that starts at `start`. A factory made from the builder goes on counting: `worker-5`, `worker-6`…' },
    { q: 'An `ExecutorService` in a try-with-resources block reaches the end of the block. What does `close()` do?',
      choices: ['Shuts the executor down and waits for every task it was given', 'Cancels every task still running', 'Nothing: executors are not AutoCloseable', 'Shuts it down and returns at once'],
      answer: 0,
      why: 'Since Java 19, `ExecutorService` is `AutoCloseable`: `close()` calls `shutdown()` and waits until every task has finished, so no task outlives the block.' }
  ];

  Q['vt-under-the-hood'] = [
    { q: 'What is a carrier thread?',
      choices: ['A platform thread of the scheduler\'s pool, on which virtual threads are mounted to run', 'The thread that created a virtual thread', 'A virtual thread that carries a ThreadLocal value', 'An operating-system thread with no Java thread around it'],
      answer: 0,
      why: 'The scheduler is a ForkJoinPool of platform threads. Each runs one virtual thread at a time: that platform thread is its carrier while it is mounted.' },
    { q: 'How many carrier threads does the scheduler have by default?',
      choices: ['As many as `Runtime.getRuntime().availableProcessors()`', 'One per virtual thread', '256', 'One'],
      answer: 0,
      why: 'Its parallelism is the number of processors the JVM sees. `jdk.virtualThreadScheduler.parallelism` changes it.' },
    { q: 'What does this program print?',
      code: 'void main() throws Exception {\n    Thread.ofVirtual().start(() -> IO.println(Thread.currentThread().isVirtual())).join();\n}',
      choices: ['`true`', '`false`: the code runs on the carrier'],
      answer: 0,
      why: '`Thread.currentThread()` inside a virtual thread is the virtual thread itself. Code never sees its carrier as the current thread.' },
    { q: 'When does a virtual thread give its carrier to another virtual thread?',
      choices: ['When it blocks in a JDK call that parks it, or when it ends', 'Every few milliseconds, like time slicing', 'Whenever the garbage collector runs', 'Only when it calls `Thread.yield()`'],
      answer: 0,
      why: 'There is no time slicing: a virtual thread unmounts when it blocks (sleep, a lock, a queue, a socket) or ends. (`Thread.yield()` can also give the carrier up, but blocking is what matters in practice.)' }
  ];

  Q['vt-blocking'] = [
    { q: 'On Java 25, which of these keeps the virtual thread mounted (holding its carrier) while it waits?',
      choices: ['Reading a file', 'Waiting for a `ReentrantLock`', 'Reading from a socket', '`Thread.sleep`'],
      answer: 0,
      why: 'File I/O cannot be done without a thread on most operating systems, so the virtual thread captures its carrier for the call; the scheduler adds a carrier for a while to make up for it. The other three unmount.' },
    { q: 'With one carrier, A spins for 200 ms without blocking; B is started 50 ms in. What does this program print?',
      code: 'void main() throws Exception {\n    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");\n    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");\n    var log = new StringBuffer();\n    Thread a = Thread.ofVirtual().start(() -> {\n        long end = System.nanoTime() + 200_000_000L;\n        while (System.nanoTime() < end) { }\n        log.append("A");\n    });\n    Thread.sleep(50);\n    Thread b = Thread.ofVirtual().start(() -> log.append("B"));\n    a.join();\n    b.join();\n    IO.println(log);\n}',
      choices: ['`AB`', '`BA`', 'Sometimes `AB`, sometimes `BA`'],
      answer: 0,
      why: 'A never blocks, so it keeps the only carrier until it ends: B cannot start running before A has appended its letter. Virtual threads are not time-sliced.' },
    { q: 'What happens to a virtual thread that calls `Object.wait()` on Java 25?',
      choices: ['It unmounts, freeing its carrier', 'It pins its carrier until notified', 'It throws, because virtual threads cannot wait on monitors', 'It turns into a platform thread'],
      answer: 0,
      why: 'Java 24 (JEP 491) reworked monitors: `Object.wait()` unmounts the virtual thread. In Java 21 to 23 it captured the carrier, and the scheduler compensated.' },
    { q: 'Which statement about scheduling is true?',
      choices: ['A virtual thread that computes for a second keeps its carrier for that second', 'The JVM preempts virtual threads every 10 ms', 'Virtual threads have priorities, which the scheduler follows', 'A CPU loop in a virtual thread runs on all carriers at once'],
      answer: 0,
      why: 'No time slicing and no priorities: a virtual thread runs until it blocks or ends.' }
  ];

  Q['vt-pinning'] = [
    { q: 'From which Java release does a virtual thread blocking inside `synchronized` no longer pin its carrier?',
      choices: ['Java 24', 'Java 21', 'Java 25', 'It always pins'],
      answer: 0,
      why: 'JEP 491, in Java 24, reworked monitors so a virtual thread can unmount while it holds one, waits to enter one, or waits in `Object.wait()`. Java 25 LTS has it too.' },
    { q: 'Which of these still pins a virtual thread on Java 25?',
      choices: ['Blocking inside a static initializer (`static { … }`)', 'Blocking inside a `synchronized` method', 'Waiting on a `CountDownLatch`', 'Sleeping inside a `ReentrantLock`'],
      answer: 0,
      why: 'JEP 491 lists what is left: blocking in a class initializer, waiting for another thread\'s class initialization, class loading during symbol resolution, and native frames that call back and block.' },
    { q: 'With one carrier on Java 25, a virtual thread sleeps 500 ms inside `synchronized`. What does this program print?',
      code: 'void main() throws Exception {\n    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");\n    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");\n    Object lock = new Object();\n    var ran = new AtomicBoolean();\n    Thread holder = Thread.ofVirtual().start(() -> {\n        synchronized (lock) {\n            try { Thread.sleep(500); } catch (InterruptedException e) { }\n        }\n    });\n    Thread.sleep(100);\n    Thread.ofVirtual().start(() -> ran.set(true)).join(300);\n    IO.println(ran.get());\n    holder.join();\n}',
      choices: ['`true`', '`false`'],
      answer: 0,
      why: 'On Java 24 and later the sleeping holder unmounts, monitor and all, so the other virtual thread gets the carrier. On Java 21 the same program prints `false`.' },
    { q: 'An application must stay on Java 21. A `synchronized` method makes an HTTP call. What was the advice?',
      choices: ['Replace `synchronized` with a `ReentrantLock` there', 'Add more carrier threads with `-Djdk.virtualThreadScheduler.parallelism`', 'Make the method `static`', 'Nothing: pinning cannot happen in a method'],
      answer: 0,
      why: 'A `java.util.concurrent` lock never pinned. On Java 21 to 23, `ReentrantLock` was the fix for blocking while holding a lock; on 24 and later `synchronized` is fine again.' }
  ];

  Q['vt-limit'] = [
    { q: 'Why should virtual threads never be pooled?',
      choices: ['They are cheap to create, so a pool only adds a queue and a fixed limit', 'A pool cannot hold virtual threads', 'Pooled virtual threads always pin', 'A pool would make them platform threads'],
      answer: 0,
      why: 'Pools existed to reuse costly threads and to cap their number. Virtual threads cost almost nothing to make, and the cap belongs on the resource being protected: a Semaphore.' },
    { q: 'What does this program print?',
      code: 'void main() throws Exception {\n    var permits = new Semaphore(2);\n    var inFlight = new AtomicInteger();\n    var most = new AtomicInteger();\n    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n        for (int i = 0; i < 10; i++) {\n            executor.submit(() -> {\n                permits.acquire();\n                try {\n                    most.accumulateAndGet(inFlight.incrementAndGet(), Math::max);\n                    Thread.sleep(50);\n                    inFlight.decrementAndGet();\n                } finally {\n                    permits.release();\n                }\n                return null;\n            });\n        }\n    }\n    IO.println(most.get());\n}',
      choices: ['`2`', '`10`', '`1`'],
      answer: 0,
      why: 'Ten virtual threads, two permits: at most two are inside the guarded part at once, and with 50 ms each, two always overlap.' },
    { q: 'A `Semaphore` has no free permit. What does `tryAcquire(100, TimeUnit.MILLISECONDS)` do?',
      choices: ['Waits up to 100 ms, then returns `false` if no permit came', 'Throws at once', 'Waits until a permit comes, however long', 'Takes a permit anyway'],
      answer: 0,
      why: 'It gives up after the timeout and returns `false`, so the caller can answer "busy" (load shedding) instead of queueing for ever.' },
    { q: 'A Spring Boot service on HikariCP\'s default pool of 10 connections switches to virtual threads and gets 5,000 requests at once. What happens?',
      choices: ['Up to 5,000 requests wait for 10 connections, and those not served within the connection timeout fail', 'Hikari opens 5,000 connections', 'Tomcat still caps the requests at 200', 'Nothing changes'],
      answer: 0,
      why: 'Virtual threads remove the request-thread limit, so the database pool becomes the queue. Limit in front of it (a Semaphore or a bulkhead) and decide what an excess request gets.' }
  ];

  Q['vt-threadlocals'] = [
    { q: 'What does this program print?',
      code: 'static final InheritableThreadLocal<String> USER = new InheritableThreadLocal<>();\n\nvoid main() throws Exception {\n    USER.set("ravi");\n    Thread.ofVirtual().inheritInheritableThreadLocals(false).start(() -> IO.println(USER.get())).join();\n}',
      choices: ['`null`', '`ravi`'],
      answer: 0,
      why: 'Inheritable values are copied into a new thread unless the builder turns it off, as `inheritInheritableThreadLocals(false)` does here.' },
    { q: 'An object costly to build is cached in a `ThreadLocal`. Tasks move from a pool of 8 threads to a virtual thread per task. How many objects get built for 10,000 tasks?',
      choices: ['10,000: every task is a new thread', '8', '1', 'None: virtual threads do not support ThreadLocal'],
      answer: 0,
      why: 'A per-thread cache helps only when threads live long. Share the object if it is thread-safe; otherwise make one per use or keep a small pool of objects.' },
    { q: 'Do `ThreadLocal`s work in virtual threads?',
      choices: ['Yes: each virtual thread has its own values', 'No: `get()` throws', 'They read the carrier\'s values', 'Only `InheritableThreadLocal` works'],
      answer: 0,
      why: 'They work as on platform threads. The carrier\'s thread locals are never visible to the virtual thread.' },
    { q: 'For request context (the user, a trace id) in Java 25, what is the replacement for `ThreadLocal`?',
      choices: ['`ScopedValue`', '`InheritableThreadLocal`', 'A static field', '`ThreadLocalRandom`'],
      answer: 0,
      why: '`ScopedValue` (final in Java 25) binds a value for the duration of a call, cannot be changed inside it, and is inherited by structured subtasks without copying.' }
  ];

  Q['vt-cpu-bound'] = [
    { q: '1,000 tasks each compute for 100 ms and never wait. Compared with a pool sized to the processors, what do virtual threads do?',
      choices: ['Nothing faster: the processors are the limit either way', 'Finish about 1,000 times faster', 'Finish in about 100 ms', 'Run out of memory'],
      answer: 0,
      why: 'Virtual threads overlap waiting, not computing. A CPU-bound batch is limited by the number of processors.' },
    { q: 'In a service running on virtual threads, where should bcrypt password hashing run?',
      choices: ['On a bounded pool of platform threads, with the request\'s virtual thread waiting for the result', 'On the request\'s virtual thread, as it is', 'In a parallel stream inside each request', 'On a new platform thread per request'],
      answer: 0,
      why: 'Long computations hold carriers, starving the virtual threads that only wait. A pool sized to the processors bounds them; waiting for its result unmounts the request\'s thread.' },
    { q: 'What does this program print?',
      code: 'void main() throws Exception {\n    try (var pool = Executors.newFixedThreadPool(1)) {\n        Thread.ofVirtual().start(() -> {\n            try {\n                IO.println(pool.submit(() -> Thread.currentThread().isVirtual()).get());\n            } catch (Exception e) {\n                IO.println("failed");\n            }\n        }).join();\n    }\n}',
      choices: ['`false`', '`true`', '`failed`'],
      answer: 0,
      why: 'The task runs on the pool\'s platform thread, so `isVirtual()` there is false; the virtual thread only waits for it in `get()`.' },
    { q: 'A virtual thread calls `future.get()` on a task running in a platform pool. What happens to its carrier while it waits?',
      choices: ['It is freed: the virtual thread unmounts', 'It is pinned until the task finishes', 'It runs the task itself', 'It is added to the pool'],
      answer: 0,
      why: '`Future.get()` is a blocking call the JDK parks, so the virtual thread unmounts and the carrier serves other virtual threads.' }
  ];

  Q['vt-observe'] = [
    { q: 'A service with thousands of waiting virtual threads hangs. Which command shows them?',
      choices: ['`jcmd <pid> Thread.dump_to_file -format=json <file>`', '`jstack <pid>`', '`jcmd <pid> Thread.print`', '`jps -v`'],
      answer: 0,
      why: 'Measured on JDK 25: `jstack` and `Thread.print` listed none of the waiting virtual threads; `Thread.dump_to_file`, text or JSON, listed them all.' },
    { q: 'Which JFR event reports a pinned virtual thread, and when is it recorded by default?',
      choices: ['`jdk.VirtualThreadPinned`, when a pinned thread blocks for 20 ms or more', '`jdk.ThreadPark`, on every park', '`jdk.VirtualThreadStart`, at every start', '`jdk.VirtualThreadPinned`, but only when you turn it on'],
      answer: 0,
      why: 'It is on by default with a 20 ms threshold; since Java 24 it also says why the thread was pinned. Start and End events are off by default.' },
    { q: 'What does this program print?',
      code: 'void main() {\n    IO.println(Thread.ofVirtual().unstarted(() -> {}).getName().isEmpty());\n}',
      choices: ['`true`', '`false`'],
      answer: 0,
      why: 'A virtual thread has no name unless you give one: the empty string. Named threads make dumps and log lines readable.' },
    { q: '`HotSpotDiagnosticMXBean.dumpThreads(path, format)` is called twice with the same path. What happens the second time?',
      choices: ['It throws `FileAlreadyExistsException`', 'It overwrites the file', 'It appends to the file', 'It writes to a new name'],
      answer: 0,
      why: 'Measured on JDK 25: the dump refuses a file that exists (and a path that is not absolute). Use a fresh file each time.' }
  ];
})(window.JCLT);
