/*
 * data/interview-virtual-threads.js - the interview questions on virtual threads (batch 1).
 *
 * Question shape: {id, track, weight (3 = asked in almost every Java backend round, 2 = often,
 *   1 = sometimes), q, keywords, short (the 30-second answer, Markdown), answer (the full answer,
 *   Markdown, with code that runs), followups: [..], related: ['lesson:<id>' | 'q:<id>' | 'term:<id>'], docs}
 * Every ```java block runs in tests/test_content.py (three times, at once) and an ```output block after
 * one is its exact output.
 */
(function (U) {
  'use strict';
  function jv(code) { return '```java\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function props(t) { return '```properties\n' + t + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];

  Q.push({
    id: 'vt-what', track: 'virtual-threads', weight: 3,
    q: 'What is a virtual thread, and how is it different from a platform thread?',
    keywords: ['virtual thread', 'platform thread', 'os thread', 'loom', 'jep 444', 'lightweight', 'difference'],
    short: 'A virtual thread is a `java.lang.Thread` scheduled by the JVM rather than the operating system (final in Java 21, JEP 444). Many virtual threads run on a few platform threads, the carriers; when one blocks in a JDK call it unmounts and its carrier runs another. A platform thread wraps one OS thread for life, with a reserved stack, so you can have thousands; virtual threads cost a small heap object, so you can have millions. They raise throughput for code that waits, not the speed of code that computes.',
    answer: [
      '| | Platform thread | Virtual thread |\n|---|---|---|\n| Scheduled by | the OS | the JVM, on a ForkJoinPool of carriers |\n| Memory | a reserved OS stack | stack frames on the heap, as many as are in use |\n| How many | thousands | millions |\n| While blocked | holds its OS thread | unmounts: the carrier is free |\n| Daemon, priority | your choice | always daemon, always normal priority |\n| Pool it? | yes | never: one per task |',
      jv(`void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<Boolean> f = executor.submit(() -> Thread.currentThread().isVirtual());
        IO.println("a task in this executor runs on a virtual thread: " + f.get());
    }
    Thread platform = Thread.ofPlatform().unstarted(() -> {});
    Thread virtual = Thread.ofVirtual().unstarted(() -> {});
    IO.println("same API: both are java.lang.Thread: " + (platform instanceof Thread && virtual instanceof Thread));
}`),
      out(`a task in this executor runs on a virtual thread: true
same API: both are java.lang.Thread: true`),
      'The point to make: the programming model does not change. Thread-per-request code, blocking calls, stack traces and debuggers all work; only the cost of a thread does.'
    ].join('\n\n'),
    followups: ['What happens when a virtual thread blocks?', 'Do virtual threads make a single request faster?', 'Can you have a million platform threads? Why not?'],
    related: ['lesson:vt-why', 'lesson:vt-under-the-hood', 'q:vt-how', 'term:virtual-thread'],
    docs: 'https://openjdk.org/jeps/444'
  });

  Q.push({
    id: 'vt-how', track: 'virtual-threads', weight: 3,
    q: 'How do virtual threads work under the hood?',
    keywords: ['carrier', 'continuation', 'mount', 'unmount', 'ForkJoinPool', 'scheduler', 'park', 'stack chunk'],
    short: 'Each virtual thread holds a continuation: its code and, while not running, its stack frames on the heap. A scheduler (a FIFO ForkJoinPool with one carrier thread per processor) mounts a ready virtual thread on a carrier, copying its frames onto the carrier\'s stack. When it blocks in a JDK call (sleep, a lock, a queue, a socket), the JDK parks it: frames go back to the heap and the carrier picks another. When the wait ends it is scheduled again, on any carrier. There is no time slicing.',
    answer: [
      '- **Continuation**: the virtual thread\'s code plus its frames; saved to heap objects (stack chunks) when it unmounts.\n- **Scheduler**: a `ForkJoinPool` in FIFO mode; parallelism = available processors (`jdk.virtualThreadScheduler.parallelism`).\n- **Mount / unmount**: the JDK\'s blocking calls were rewritten to park the virtual thread instead of blocking the OS thread.\n- **Capture**: file I/O cannot be parked on most OSes; the carrier stays blocked and the scheduler temporarily adds a carrier.\n- **Pinning**: when it cannot unmount at all (class initializer, native frames; `synchronized` before Java 24).',
      jv(`void main() throws Exception {
    // one carrier
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    var inFlight = new AtomicInteger();
    var most = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 500; i++) {
            executor.submit(() -> {
                most.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
                Thread.sleep(1_000);
                inFlight.decrementAndGet();
                return null;
            });
        }
    }
    IO.println("blocked at once on one carrier: " + most.get());
}`),
      out('blocked at once on one carrier: 500')
    ].join('\n\n'),
    followups: ['Does a virtual thread always resume on the same carrier?', 'What is the difference between capturing and pinning?', 'Why is there no time slicing, and when does that hurt?'],
    related: ['lesson:vt-under-the-hood', 'lesson:vt-blocking', 'q:vt-pinning', 'term:carrier-thread', 'term:continuation'],
    docs: 'https://openjdk.org/jeps/444'
  });

  Q.push({
    id: 'vt-pinning', track: 'virtual-threads', weight: 3,
    q: 'What is pinning, and what changed in Java 24?',
    keywords: ['pinning', 'pinned', 'synchronized', 'jep 491', 'java 24', 'class initializer', 'native', 'ReentrantLock', 'monitor'],
    short: 'A pinned virtual thread blocks without unmounting, so it blocks its carrier too, and the scheduler does not compensate. In Java 21 to 23, blocking inside `synchronized` pinned (the monitor belonged to the carrier), so the advice was `ReentrantLock`. JEP 491 in Java 24 reworked monitors: `synchronized` and `Object.wait()` no longer pin. Still pinning in Java 25: blocking in a class initializer, waiting for another thread\'s class initialization, class loading during resolution, and native frames that call back and block. JFR\'s `jdk.VirtualThreadPinned` event reports it with the reason.',
    answer: [
      '| | Java 21 to 23 | Java 24 and 25 |\n|---|---|---|\n| Blocking in `synchronized` | pins | unmounts |\n| `Object.wait()` | captures the carrier (compensated) | unmounts |\n| Blocking in `static { }` | pins | pins |\n| Native code that calls back and blocks | pins | pins |',
      jv(`static class Config {
    static final String VALUE;
    static {
        // blocking in a class initializer
        try { Thread.sleep(400); } catch (InterruptedException e) { }
        VALUE = "loaded";
    }
}

void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    Object lock = new Object();
    var ranBesideMonitor = new AtomicBoolean();
    Thread holder = Thread.ofVirtual().start(() -> {
        synchronized (lock) { try { Thread.sleep(400); } catch (InterruptedException e) { } }
    });
    Thread.sleep(100);
    Thread.ofVirtual().start(() -> ranBesideMonitor.set(true)).join(250);
    // read it now, while the holder still sleeps
    IO.println("synchronized pinned: " + !ranBesideMonitor.get());
    holder.join();

    var ranBesideInit = new AtomicBoolean();
    Thread loader = Thread.ofVirtual().start(() -> { String v = Config.VALUE; });
    Thread.sleep(100);
    Thread.ofVirtual().start(() -> ranBesideInit.set(true)).join(250);
    // read it now, while the class is still initializing: afterwards the other thread does run
    IO.println("class initializer pinned: " + !ranBesideInit.get());
    loader.join();
}`),
      out(`synchronized pinned: false
class initializer pinned: true`)
    ].join('\n\n'),
    followups: ['How would you find pinning in production?', 'Why did `synchronized` pin before Java 24?', 'Is `ReentrantLock` still useful on Java 25?'],
    related: ['lesson:vt-pinning', 'lesson:vt-observe', 'q:vt-observe', 'term:pinning'],
    docs: 'https://openjdk.org/jeps/491'
  });

  Q.push({
    id: 'vt-pool', track: 'virtual-threads', weight: 3,
    q: 'Should you pool virtual threads? How do you limit concurrency with them?',
    keywords: ['pool', 'pooling', 'semaphore', 'limit', 'bulkhead', 'concurrency limit', 'newFixedThreadPool', 'rate limit'],
    short: 'Never pool them: JEP 444 says they "are cheap and plentiful, and thus should never be pooled". A pool did two jobs, reuse and limiting; reuse is pointless now, and the limit belongs on the scarce resource. Create one virtual thread per task and guard the call to the database or the partner API with a `Semaphore` (or a semaphore bulkhead); `tryAcquire` with a timeout lets you shed load instead of queueing for ever.',
    answer: [
      jv(`void main() throws Exception {
    // the database allows 10 connections
    var dbPermits = new Semaphore(10);
    var inFlight = new AtomicInteger();
    var most = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 1_000; i++) {
            executor.submit(() -> {
                dbPermits.acquire();
                try {
                    most.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
                    Thread.sleep(20);           // the query
                    inFlight.decrementAndGet();
                } finally {
                    dbPermits.release();
                }
                return null;
            });
        }
    }
    IO.println("1,000 request threads, at most " + most.get() + " queries at once");
}`),
      out('1,000 request threads, at most 10 queries at once'),
      'Why a semaphore beats a pool: one request may need three different limits (database, payment API, cache); a pool of request threads expresses only one number. A semaphore per resource expresses each, wherever the call is made.'
    ].join('\n\n'),
    followups: ['What happens to HikariCP when Tomcat switches to virtual threads?', 'What does a fair semaphore change?', 'How would you reject excess requests instead of queueing them?'],
    related: ['lesson:vt-limit', 'q:vt-spring', 'term:semaphore', 'term:bulkhead'],
    docs: 'https://openjdk.org/jeps/444'
  });

  Q.push({
    id: 'vt-when-not', track: 'virtual-threads', weight: 3,
    q: 'When should you not use virtual threads?',
    keywords: ['cpu-bound', 'when not', 'disadvantages', 'limitations', 'time slicing', 'pinning', 'threadlocal', 'native'],
    short: 'When the work computes rather than waits: CPU-bound work gains nothing, and since virtual threads are not time-sliced, long computations hold carriers and starve the waiting threads; use a pool sized to the processors. Also be careful where code pins (blocking class initializers, native calls that block; `synchronized` on Java 21 to 23), where code caches costly objects in `ThreadLocal`s, and where removing the thread limit would overload a downstream resource without a semaphore.',
    answer: [
      '| Situation | What to do |\n|---|---|\n| CPU-heavy work (hashing, images, compression) | a bounded platform pool or parallel stream; the request\'s virtual thread waits for it |\n| A library that blocks in native code | keep it on a platform pool, or accept pinned carriers |\n| Java 21 to 23 with `synchronized` around I/O | upgrade to 24+/25, or switch to `ReentrantLock` |\n| `ThreadLocal` caches of costly objects | share thread-safe objects; pool objects, not threads |\n| A downstream with a hard limit | a `Semaphore` in front of it |',
      'Virtual threads also do not shorten a request: the latency of each call is unchanged.'
    ].join('\n\n'),
    followups: ['Why does no time slicing matter for CPU-bound work?', 'How would you mix virtual threads and a CPU pool in one request?'],
    related: ['lesson:vt-cpu-bound', 'lesson:vt-pinning', 'lesson:vt-threadlocals', 'q:vt-pool'],
    docs: 'https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html'
  });

  Q.push({
    id: 'vt-spring', track: 'virtual-threads', weight: 3,
    q: 'How do you turn on virtual threads in Spring Boot, and what do you check first?',
    keywords: ['spring boot', 'spring.threads.virtual.enabled', 'tomcat', 'jetty', 'async', 'scheduler', 'keep-alive', 'hikari', 'migration'],
    short: 'Set `spring.threads.virtual.enabled=true` (Spring Boot 3.2+, Java 21+; the reference strongly recommends Java 24+ because of pinning). Tomcat and Jetty then process requests on virtual threads, `applicationTaskExecutor` (`@Async`) becomes a virtual-thread `SimpleAsyncTaskExecutor`, the scheduler a `SimpleAsyncTaskScheduler`, and Kafka and RabbitMQ listeners get virtual-thread executors; thread-pool size properties stop having an effect. Check first: the connection pool (now the queue), downstream limits, CPU-heavy steps, ThreadLocal caches, and `spring.main.keep-alive=true` if nothing else keeps the JVM alive.',
    answer: [
      props(`spring.threads.virtual.enabled=true
# a service with no web server, kept alive only by @Scheduled jobs:
spring.main.keep-alive=true`),
      '| Before switching, check | Why |\n|---|---|\n| The Java version | 24 or later: `synchronized` no longer pins (the reference\'s own advice) |\n| `spring.datasource.hikari.maximum-pool-size` and `connection-timeout` | the database pool becomes the queue once the request threads stop being one |\n| Calls to partner services | add a semaphore or bulkhead where a limit existed only because of the thread pool |\n| CPU-heavy steps | move them to a bounded executor |\n| `ThreadLocal` caches in old code | they rebuild per request |\n| Load test | compare throughput and p99 latency before and after |'
    ].join('\n\n'),
    followups: ['What stops working when thread-pool properties no longer apply?', 'Why does a scheduler-only service exit with virtual threads on?', 'What happens to MDC and the security context?'],
    related: ['lesson:vt-why', 'lesson:vt-create', 'lesson:vt-limit', 'q:vt-pool'],
    docs: 'https://docs.spring.io/spring-boot/reference/features/spring-application.html'
  });

  Q.push({
    id: 'vt-vs-reactive', track: 'virtual-threads', weight: 2,
    q: 'Virtual threads or reactive programming (WebFlux, Reactor)?',
    keywords: ['reactive', 'webflux', 'reactor', 'completablefuture', 'async', 'non-blocking', 'backpressure', 'streaming'],
    short: 'Both let a few OS threads serve many waiting requests. Reactive does it by never blocking, at the cost of callback-style code, harder debugging and stack traces that lose the request\'s story. Virtual threads keep plain blocking code and its tools. For request/response services that mostly wait, virtual threads give similar throughput with simpler code. Reactive still earns its place for streaming, backpressure across a pipeline, and when the whole stack is already reactive.',
    answer: '| | Virtual threads (MVC) | Reactive (WebFlux) |\n|---|---|---|\n| Code style | sequential, blocking | operators and callbacks |\n| Stack traces and debugger | the whole request | fragmented |\n| Backpressure | by blocking, or a semaphore | built into the stream protocol |\n| Streaming many events | possible, plainer tools | a natural fit |\n| Existing blocking libraries (JDBC) | work as they are | need reactive drivers (R2DBC) or offloading |',
    followups: ['Does a team already on WebFlux gain anything by moving?', 'How does backpressure work with virtual threads?'],
    related: ['lesson:vt-why', 'q:vt-what'],
    docs: 'https://openjdk.org/jeps/444'
  });

  Q.push({
    id: 'vt-threadlocal', track: 'virtual-threads', weight: 2,
    q: 'Do ThreadLocals work with virtual threads? What are the risks?',
    keywords: ['threadlocal', 'inheritablethreadlocal', 'cache', 'memory', 'scopedvalue', 'mdc', 'context'],
    short: 'They work: each virtual thread has its own values. The risks are about numbers and lifetimes: a `ThreadLocal` cache of costly objects builds one per task (every task is a new thread); a million threads each holding a large value hold a lot of memory; and inheritable values are copied into every child. Share thread-safe objects instead of caching per thread, and use `ScopedValue` (final in Java 25) for request context.',
    answer: jv(`static final AtomicInteger built = new AtomicInteger();
static final ThreadLocal<StringBuilder> CACHE = ThreadLocal.withInitial(() -> { built.incrementAndGet(); return new StringBuilder(); });

void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 500; i++) executor.submit(() -> CACHE.get().append('x'));
    }
    IO.println("500 tasks on virtual threads built " + built.get() + " cached builders");
}`) + '\n\n' + out('500 tasks on virtual threads built 500 cached builders'),
    followups: ['What is the difference between `ThreadLocal` and `ScopedValue`?', 'How do Spring\'s request-scoped holders behave on virtual threads?'],
    related: ['lesson:vt-threadlocals', 'term:threadlocal', 'term:scoped-value'],
    docs: 'https://openjdk.org/jeps/444'
  });

  Q.push({
    id: 'vt-observe', track: 'virtual-threads', weight: 2,
    q: 'How do you see virtual threads in a thread dump, and how do you find pinning?',
    keywords: ['thread dump', 'jcmd', 'Thread.dump_to_file', 'jstack', 'jfr', 'VirtualThreadPinned', 'observability', 'json'],
    short: '`jstack` and `jcmd Thread.print` do not list virtual threads that are waiting (measured on JDK 25). Use `jcmd <pid> Thread.dump_to_file -format=json <file>` (or `-format=text`): it lists every virtual thread, grouped by the executor or scope that owns it. For pinning, JFR\'s `jdk.VirtualThreadPinned` event is on by default for waits of 20 ms or more, with a stack trace and, since Java 24, the reason.',
    answer: '| Tool | Shows |\n|---|---|\n| `jcmd <pid> Thread.dump_to_file -format=json <file>` | every thread, virtual ones included, in their containers |\n| `HotSpotDiagnosticMXBean.dumpThreads(path, format)` | the same, from inside the program (an absolute path to a new file) |\n| JFR `jdk.VirtualThreadPinned` | pinned waits of 20 ms or more, with the reason |\n| JFR `jdk.VirtualThreadSubmitFailed` | a virtual thread that could not be started or unparked |\n| JFR `jdk.VirtualThreadStart` / `End` | off by default: very many events |',
    followups: ['Why is the new dump written to a file?', 'What would thousands of threads parked in `getConnection` tell you?'],
    related: ['lesson:vt-observe', 'q:vt-pinning', 'term:thread-dump', 'term:jfr'],
    docs: 'https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html'
  });

  Q.push({
    id: 'vt-littles-law', track: 'virtual-threads', weight: 2,
    q: 'How many threads does a service need? Explain with Little\'s law.',
    keywords: ['little\'s law', 'capacity', 'sizing', 'throughput', 'latency', 'thread pool size'],
    short: 'Little\'s law: requests in flight = arrival rate × time each spends in the system. At 2,000 requests a second and 200 ms each, 400 are in flight, so thread-per-request needs 400 threads; a pool of 200 caps throughput at 200 / 0.2 = 1,000 a second, however idle the CPU. Virtual threads remove that cap, so the limit becomes the real resources: CPU, connections, downstream capacity.',
    answer: jv(`void main() {
    double rate = 2_000, seconds = 0.2;
    IO.println("in flight: " + Math.round(rate * seconds));
    for (int pool : new int[] { 50, 200, 400 }) {
        IO.println("pool of " + pool + " serves at most " + Math.round(pool / seconds) + " requests a second");
    }
}`) + '\n\n' + out(`in flight: 400
pool of 50 serves at most 250 requests a second
pool of 200 serves at most 1000 requests a second
pool of 400 serves at most 2000 requests a second`),
    followups: ['What happens to latency when arrivals exceed what the pool can serve?', 'Which resource limits the service once threads are not the limit?'],
    related: ['lesson:vt-why', 'term:littles-law'],
    docs: 'https://openjdk.org/jeps/444'
  });

  Q.push({
    id: 'vt-daemon', track: 'virtual-threads', weight: 1,
    q: 'Are virtual threads daemon threads? Why does it matter?',
    keywords: ['daemon', 'setDaemon', 'jvm exit', 'join', 'keep-alive'],
    short: 'Always: `setDaemon(false)` throws `IllegalArgumentException`. The JVM exits when only daemon threads are left, so a program must wait for its virtual threads (join them, close the executor, or use a structured scope). In Spring Boot, a service with only `@Scheduled` work on virtual threads can exit at start-up; `spring.main.keep-alive=true` keeps it running.',
    answer: jv(`void main() {
    Thread t = Thread.ofVirtual().unstarted(() -> {});
    IO.println("daemon: " + t.isDaemon());
    try {
        t.setDaemon(false);
    } catch (IllegalArgumentException e) {
        IO.println("setDaemon(false) refused: " + e.getMessage());
    }
}`) + '\n\n' + out(`daemon: true
setDaemon(false) refused: 'false' not legal for virtual threads`),
    followups: ['How does an executor\'s `close()` help?'],
    related: ['lesson:vt-create', 'term:daemon-thread'],
    docs: 'https://openjdk.org/jeps/444'
  });

  Q.push({
    id: 'vt-create-ways', track: 'virtual-threads', weight: 1,
    q: 'What are the ways to create a virtual thread?',
    keywords: ['Thread.ofVirtual', 'startVirtualThread', 'newVirtualThreadPerTaskExecutor', 'ThreadFactory', 'builder'],
    short: '`Thread.ofVirtual().start(task)` (a builder: name, unstarted, factory), `Thread.startVirtualThread(task)`, `Executors.newVirtualThreadPerTaskExecutor()` (a new virtual thread per submitted task), and `Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("worker-", 0).factory())` for named ones. Structured concurrency\'s scopes also fork subtasks on virtual threads.',
    answer: jv(`void main() throws Exception {
    Thread.ofVirtual().start(() -> IO.println("1. builder")).join();
    Thread.startVirtualThread(() -> IO.println("2. shortcut")).join();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        executor.submit(() -> IO.println("3. executor")).get();
    }
    var factory = Thread.ofVirtual().name("named-", 1).factory();
    try (var executor = Executors.newThreadPerTaskExecutor(factory)) {
        executor.submit(() -> IO.println("4. factory: " + Thread.currentThread().getName())).get();
    }
}`) + '\n\n' + out(`1. builder
2. shortcut
3. executor
4. factory: named-1`),
    followups: ['Why not `new Thread(...)`?'],
    related: ['lesson:vt-create'],
    docs: 'https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html'
  });

  Q.push({
    id: 'vt-time-slicing', track: 'virtual-threads', weight: 1,
    q: 'Are virtual threads preemptive? Is there time slicing?',
    keywords: ['time slicing', 'preemptive', 'scheduling', 'fairness', 'cpu-bound', 'starvation'],
    short: 'No time slicing: a virtual thread keeps its carrier until it blocks (and unmounts) or ends. The OS still preempts the carriers, but among virtual threads it is cooperative, at blocking calls. So long computations on virtual threads can hold all carriers and delay every waiting thread\'s resumption.',
    answer: 'With one carrier, a virtual thread that loops for 300 ms runs to the end before a second virtual thread started meanwhile gets to run at all (lesson 4 shows it). Keep long computations on a bounded platform pool.',
    followups: ['What would happen with eight CPU-bound virtual threads on an eight-core machine?'],
    related: ['lesson:vt-blocking', 'lesson:vt-cpu-bound', 'term:time-slicing'],
    docs: 'https://openjdk.org/jeps/444'
  });
})(window.JCLT);
