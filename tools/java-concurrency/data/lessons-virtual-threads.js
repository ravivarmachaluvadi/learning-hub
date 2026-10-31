/*
 * data/lessons-virtual-threads.js - Track 3, Virtual threads: nine lessons (batch 1).
 *
 * Lesson shape: {id, track, title, summary, keywords, docs (the JEP or the JDK's guide), docsLabel?,
 *   lab? (a Learning lab folder, linked on the public Learning Hub), body (Markdown),
 *   work (the "Where you meet this at work" box: Spring and production, Markdown),
 *   example: {code, stdin?, note?, files?},
 *   challenge: {title, task, starter, solution, stdin?, hints: [..], checks: [{label, code}], files?}}
 *
 * In the Markdown, a ```java block is a whole program (a Java 25 compact source file: `void main()` at the
 * top, java.base imported for you): tests/test_content.py runs it, three copies at once, and when an
 * ```output block follows it, every run must print exactly that. A fragment is ```java-norun. No program
 * prints a thread name it did not choose, an id or a measured time: timing shows only as a comparison
 * (`took less than 5 seconds: true`), and order only where the program makes it certain.
 *
 * A check's code is Java statements run after main, with `c` (runner/Ctx.java): c.call("method", args...)
 * calls your method by name, c.probe(n) makes a Probe (runner/Probe.java) that proves which calls were in
 * flight together, on which kind of thread, and which were cancelled, without timing anything.
 * files are the lesson's other Java files (Service.java...), compiled with your code and shown read-only.
 * Code is written in template literals: no Java string here uses a backslash.
 */
(function (U) {
  'use strict';
  function jv(code) { return '```java\n' + code + '\n```'; }
  function norun(code) { return '```java-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function txt(t) { return '```text\n' + t + '\n```'; }
  function props(t) { return '```properties\n' + t + '\n```'; }
  var L = U.data.lessons = U.data.lessons || [];

  var SERVICE = { name: 'Service.java', code: `/** A slow service: each call waits for an answer, as a call over the network does. */
public interface Service {
    String fetch(String id) throws InterruptedException;
}
` };

  /* ---------------------------------------------------------------- 1 */
  L.push({
    id: 'vt-why', track: 'virtual-threads', title: 'Why virtual threads',
    summary: 'A thread per request keeps code simple, but platform threads are too costly to have thousands. Little\'s law says how many you need; virtual threads make that many cheap.',
    keywords: ['virtual thread', 'thread per request', 'little\'s law', 'throughput', 'platform thread', 'os thread', 'loom', 'jep 444', 'scalability', 'reactive', 'async'],
    docs: 'https://openjdk.org/jeps/444', docsLabel: 'JEP 444: Virtual Threads', lab: '18-java-virtual-threads',
    body: [
      '## One thread per request',
      'Most Java servers give each request a thread of its own and run it top to bottom: read the order, call the stock service, call the payment service, write to the database, answer. The code is plain and blocking, a stack trace shows the whole story of a request, and a debugger steps through it line by line. This style is called **thread-per-request**.',
      'Most of a request\'s time is spent *waiting*: for the database, for another service, for a file. While it waits, its thread does nothing, but it is still taken.',
      '## Little\'s law: how many threads you need',
      'How many requests are in flight at once? **Little\'s law**: the number in flight equals the arrival rate times the time each one takes, `L = λ × W`.',
      jv(`void main() {
    double requestsPerSecond = 2_000;
    // 200 ms, almost all of it waiting for a database and two services
    double secondsPerRequest = 0.2;
    long inFlight = Math.round(requestsPerSecond * secondsPerRequest);
    IO.println("requests in flight at once: " + inFlight);
    int poolSize = 200;
    IO.println("most a pool of 200 can serve: " + Math.round(poolSize / secondsPerRequest) + " requests per second");
}`),
      out(`requests in flight at once: 400
most a pool of 200 can serve: 1000 requests per second`),
      'With a thread per request, 400 requests in flight need 400 threads. A pool of 200 caps the service at 1,000 requests a second, however idle the CPU is: the rest queue, and their wait is added to their time.',
      '## Why not 10,000 platform threads?',
      'A **platform thread** (every `Thread` before Java 21) is a thin wrapper around an operating-system thread. Each one reserves a stack (typically about 1 MB of address space), and the operating system schedules every one of them. A few thousand is fine; tens of thousands strains the machine, and a pool is how servers kept the number bounded.',
      'The other way out was **asynchronous** code: `CompletableFuture` chains or a reactive library such as Reactor. A thread is never left waiting, so a few threads serve many requests. The price is the code: callbacks instead of statements, stack traces that no longer show who called what, and a debugger that cannot step through a request.',
      '## Virtual threads: cheap threads',
      'A **virtual thread** (final in Java 21, [JEP 444](https://openjdk.org/jeps/444)) is a `java.lang.Thread` that the JVM, not the operating system, schedules. While it waits in a blocking call, it gives back the platform thread it was running on, so waiting costs only a little memory. Ten thousand waiting at once is nothing:',
      jv(`void main() throws Exception {
    long start = System.nanoTime();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 10_000; i++) {
            executor.submit(() -> {
                // stands for a 1-second call to a slow service
                Thread.sleep(1_000);
                return null;
            });
        }
    }                                       // close() waits for all 10,000
    long ms = (System.nanoTime() - start) / 1_000_000;
    IO.println("10,000 one-second tasks done");
    IO.println("took less than 5 seconds: " + (ms < 5_000));
}`),
      out(`10,000 one-second tasks done
took less than 5 seconds: true`),
      'All 10,000 slept at the same time, so the whole program took a little over one second. The same work on a pool shows the difference: 1,000 tasks of 100 ms on 100 platform threads go in ten waves.',
      jv(`long time(ExecutorService executor) throws Exception {
    long start = System.nanoTime();
    try (executor) {
        for (int i = 0; i < 1_000; i++) {
            executor.submit(() -> { Thread.sleep(100); return null; });
        }
    }
    return (System.nanoTime() - start) / 1_000_000;
}

void main() throws Exception {
    long pool = time(Executors.newFixedThreadPool(100));
    long virtual = time(Executors.newVirtualThreadPerTaskExecutor());
    IO.println("pool of 100 took at least a second: " + (pool >= 1_000));
    IO.println("virtual threads took less than half as long: " + (virtual * 2 < pool));
}`),
      out(`pool of 100 took at least a second: true
virtual threads took less than half as long: true`),
      '## What they do not do',
      'Virtual threads are not *faster* threads. One request takes as long as before; a CPU-heavy calculation runs no quicker. They raise **throughput** (requests served per second) when the time is spent waiting, because far more requests can wait at once. Lesson 8 shows when to keep a platform pool.',
      '| | Platform thread | Virtual thread |\n|---|---|---|\n| Scheduled by | the operating system | the JVM, on a few platform threads |\n| Cost | a reserved stack, an OS thread | a small Java object; its stack grows on the heap as needed |\n| How many | thousands | millions |\n| While it blocks | holds its OS thread | gives the platform thread back |\n| Pool it? | yes, to bound the number | never (lesson 6) |'
    ].join('\n\n'),
    work: [
      '**Spring Boot on Tomcat.** Each request runs on a thread from Tomcat\'s pool, whose size is `server.tomcat.threads.max` (200 by default). When every request spends 200 ms waiting on other services, Little\'s law caps the instance at about 1,000 requests a second, and beyond that requests queue: the classic "thread pool exhausted" incident, with an idle CPU.',
      props(`# Spring Boot 3.2 and later, on Java 21 or later
spring.threads.virtual.enabled=true`),
      'With this property, Tomcat and Jetty run each request on a virtual thread, and (the Spring Boot reference says) properties that size thread pools no longer have an effect. The reference recommends Java 24 or later for the best experience: lesson 5 shows why. Removing the thread limit moves the queue somewhere else, usually the database connection pool: lesson 6.'
    ].join('\n\n'),
    example: {
      code: `// Change the numbers: how many requests a second, how long each waits, how big the pool.
long time(ExecutorService executor, int tasks, int millis) throws Exception {
    long start = System.nanoTime();
    try (executor) {
        for (int i = 0; i < tasks; i++) {
            executor.submit(() -> { Thread.sleep(millis); return null; });
        }
    }
    return (System.nanoTime() - start) / 1_000_000;
}

void main() throws Exception {
    int tasks = 2_000, millis = 100, pool = 200;
    IO.println("Little's law: about " + (tasks * millis / 1_000) + " task-seconds of waiting");
    IO.println("pool of " + pool + ":       " + time(Executors.newFixedThreadPool(pool), tasks, millis) + " ms");
    IO.println("virtual threads:   " + time(Executors.newVirtualThreadPerTaskExecutor(), tasks, millis) + " ms");
}`,
      note: 'The times vary from run to run and PC to PC; the gap between the two lines does not.'
    },
    challenge: {
      title: 'A thread for every request',
      task: 'Two methods to write.\n\n1. `threadsNeeded(requestsPerSecond, secondsPerRequest)`: Little\'s law, **rounded up** to a whole number of threads (`Math.ceil`).\n2. `handleAll(requests, service)`: call `service.fetch(request)` for every request, **each on a virtual thread of its own, all at the same time**, and return the answers in the order of the requests.\n\nThe checks hand `handleAll` a service whose calls wait for each other: it passes only when the calls really are in flight together.',
      files: [SERVICE],
      starter: `long threadsNeeded(double requestsPerSecond, double secondsPerRequest) {
    throw new UnsupportedOperationException("Not written yet");
}

// Call service.fetch(request) for every request, each on a virtual thread of its own, all at the same time.
// Return the answers in the order of the requests.
List<String> handleAll(List<String> requests, Service service) throws Exception {
    List<String> answers = new ArrayList<>();
    for (String r : requests) {
        // one after another, on one thread: make these run at the same time
        answers.add(service.fetch(r));
    }
    return answers;
}

void main() throws Exception {
    IO.println(handleAll(List.of("a", "b"), id -> "answer " + id));
}`,
      solution: `long threadsNeeded(double requestsPerSecond, double secondsPerRequest) {
    return (long) Math.ceil(requestsPerSecond * secondsPerRequest);
}

List<String> handleAll(List<String> requests, Service service) throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<String>> futures = new ArrayList<>();
        for (String r : requests) {
            futures.add(executor.submit(() -> service.fetch(r)));
        }
        List<String> answers = new ArrayList<>();
        for (Future<String> f : futures) {
            answers.add(f.get());
        }
        return answers;
    }
}

void main() throws Exception {
    IO.println(handleAll(List.of("a", "b"), id -> "answer " + id));
}`,
      hints: [
        'Little\'s law: threads = requests per second × seconds per request. `Math.ceil` rounds up; cast the result to `long`.',
        '`Executors.newVirtualThreadPerTaskExecutor()` in a try-with-resources block starts a virtual thread for each `submit`. Keep each `Future` in a list, in the order of the requests.',
        'Submit them all first, then call `get()` on each `Future` in turn: that keeps the order, and the calls still run at the same time.'
      ],
      checks: [
        { label: 'threadsNeeded(2000, 0.2) is 400', code: `c.eq(c.call("threadsNeeded", 2000.0, 0.2), 400L);` },
        { label: 'threadsNeeded rounds up: (10, 0.21) is 3, not 2', code: `c.eq(c.call("threadsNeeded", 10.0, 0.21), 3L);` },
        { label: 'handleAll returns the answers in the order of the requests', code: `c.eq(c.call("handleAll", List.of("x", "y", "z"), (Service) id -> id.toUpperCase()), List.of("X", "Y", "Z"));` },
        { label: 'the five calls are in flight at the same time', code: `var p = c.probe(5);
c.call("handleAll", List.of("a", "b", "c", "d", "e"), (Service) id -> { p.meet(); return id; });
c.ok(p.met(), "at most " + p.peak() + " of the 5 calls were in flight at once: they ran one after another");` },
        { label: 'each call runs on a virtual thread', code: `var p = c.probe(3);
c.call("handleAll", List.of("a", "b", "c"), (Service) id -> { p.meet(); return id; });
c.ok(p.allVirtual(), p.platformCalls() + " of the " + p.calls() + " calls ran on a platform thread, not a virtual one");` },
        { label: '1,000 requests are in flight at once, not a pool\'s worth', code: `var p = c.probe(1_000, 3_000);
List<String> ids = new ArrayList<>();
for (int i = 0; i < 1_000; i++) ids.add("r" + i);
c.call("handleAll", ids, (Service) id -> { p.meet(); return id; });
c.ok(p.met(), "at most " + p.peak() + " of the 1,000 calls were in flight at once: is something capping the number of threads?");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'vt-create', track: 'virtual-threads', title: 'Creating virtual threads',
    summary: 'Thread.ofVirtual(), Thread.startVirtualThread, builders that name threads, factories, and the executor that starts one per task. Virtual threads are always daemon threads, so wait for them.',
    keywords: ['Thread.ofVirtual', 'startVirtualThread', 'Thread.Builder', 'ThreadFactory', 'newVirtualThreadPerTaskExecutor', 'newThreadPerTaskExecutor', 'daemon', 'join', 'isVirtual', 'executor close', 'AutoCloseable', 'name'],
    docs: 'https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html', docsLabel: 'Oracle: Virtual Threads', lab: '18-java-virtual-threads',
    body: [
      '## Three ways to start one',
      jv(`void main() throws Exception {
    Thread a = Thread.ofVirtual().start(() -> IO.println("a: started with a builder"));
    a.join();
    Thread b = Thread.startVirtualThread(() -> IO.println("b: started with the shortcut"));
    b.join();
    Thread c = Thread.ofVirtual().name("checkout-", 1).unstarted(() -> IO.println("c: " + Thread.currentThread().getName()));
    IO.println("before start: " + c.getState());
    c.start();
    c.join();
    IO.println("virtual? " + c.isVirtual());
}`),
      out(`a: started with a builder
b: started with the shortcut
before start: NEW
c: checkout-1
virtual? true`),
      '`Thread.ofVirtual()` returns a **builder** (`Thread.Builder.OfVirtual`): set a name (`name("checkout-", 1)` numbers them from 1), then `start(task)` or `unstarted(task)`. `Thread.ofPlatform()` is the same builder for platform threads. `Thread.startVirtualThread(task)` is the shortcut.',
      '## What is different about them',
      jv(`void main() {
    Thread t = Thread.ofVirtual().unstarted(() -> {});
    IO.println("daemon: " + t.isDaemon());
    t.setPriority(Thread.MAX_PRIORITY);
    IO.println("priority: " + t.getPriority());
    IO.println("name: [" + t.getName() + "]");
    try {
        t.setDaemon(false);
    } catch (IllegalArgumentException e) {
        IO.println("setDaemon(false): " + e.getMessage());
    }
}`),
      out(`daemon: true
priority: 5
name: []
setDaemon(false): 'false' not legal for virtual threads`),
      '| | A virtual thread |\n|---|---|\n| Daemon | always: `setDaemon(false)` throws |\n| Priority | always `NORM_PRIORITY` (5): `setPriority` does nothing |\n| Name | the empty string, unless you give one |\n| `Thread.currentThread()` inside it | the virtual thread itself |',
      '## The daemon trap',
      'The JVM ends when only daemon threads are left. Every virtual thread is a daemon, so a program whose `main` returns does not wait for them:',
      jv(`void main() {
    Thread.startVirtualThread(() -> {
        try { Thread.sleep(1_000); } catch (InterruptedException e) { return; }
        IO.println("you will not see this");
    });
    IO.println("main is done");
}`),
      out('main is done'),
      'Wait for them yourself: `join()` each thread, or (better) start them from an executor and let its `close()` wait.',
      '## An executor that starts one per task',
      jv(`void main() throws Exception {
    try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<Integer> f = executor.submit(() -> 6 * 7);
        IO.println("answer: " + f.get());
        executor.submit(() -> {
            Thread.sleep(200);
            IO.println("slow task finished");
            return null;
        });
    }                                   // close(): waits for the slow task
    IO.println("after the try block");
}`),
      out(`answer: 42
slow task finished
after the try block`),
      '`ExecutorService` is `AutoCloseable` since Java 19: `close()` shuts it down and **waits** for every task. In a try-with-resources block, no task can outlive the block, which is the first step towards structured concurrency (Track 4). `submit` with a lambda that returns a value takes a `Callable`, which may throw checked exceptions; a lambda that returns nothing is a `Runnable`, which may not (the tool\'s hint says so when it happens).',
      '## Factories and names',
      jv(`void main() throws Exception {
    ThreadFactory factory = Thread.ofVirtual().name("worker-", 0).factory();
    try (var executor = Executors.newThreadPerTaskExecutor(factory)) {
        for (int i = 0; i < 3; i++) {
            String name = executor.submit(() -> Thread.currentThread().getName()).get();
            IO.println(name);
        }
    }
}`),
      out(`worker-0
worker-1
worker-2`),
      'A builder\'s `factory()` is a `ThreadFactory` that numbers its threads (and is safe to share between threads). `Executors.newThreadPerTaskExecutor(factory)` starts one thread per task from it: the per-task executor, with names.'
    ].join('\n\n'),
    work: [
      '**Spring.** Spring Framework 6.1 added virtual threads to its own executors: `SimpleAsyncTaskExecutor` (`setVirtualThreads(true)`) and `VirtualThreadTaskExecutor`. With `spring.threads.virtual.enabled=true`, Spring Boot\'s `applicationTaskExecutor` (behind `@Async`) becomes a virtual-thread `SimpleAsyncTaskExecutor`, and its scheduler a virtual-thread `SimpleAsyncTaskScheduler` (Spring Boot 3.2 release notes).',
      '**The daemon trap in production.** The Spring Boot reference warns of it: with virtual threads, a `@Scheduled` job\'s thread is a daemon and does not keep the JVM alive, so a service with no web server can exit at once. Its answer is `spring.main.keep-alive=true`.',
      '**Names.** Log lines print the thread\'s name (Logback\'s `%thread`); an unnamed virtual thread\'s is empty. Name the threads you start yourself with a builder or a factory, so a log line still says which worker wrote it.'
    ].join('\n\n'),
    example: {
      code: `void main() throws Exception {
    ThreadFactory factory = Thread.ofVirtual().name("order-", 100).factory();
    try (var executor = Executors.newThreadPerTaskExecutor(factory)) {
        List<Future<String>> results = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            results.add(executor.submit(() -> {
                Thread.sleep(100);
                Thread me = Thread.currentThread();
                return me.getName() + " virtual=" + me.isVirtual() + " daemon=" + me.isDaemon();
            }));
        }
        for (Future<String> f : results) IO.println(f.get());
    }
}`
    },
    challenge: {
      title: 'Named workers, and waiting for them',
      task: 'Two methods to write.\n\n1. `startWorker(n, task)`: start `task` on a **new virtual thread named `"worker-" + n`**, and return the thread (already started).\n2. `sendAll(messages, service)`: call `service.fetch(message)` for every message, each on a virtual thread, all at the same time (the answers are not needed). Return how many were sent, but **only once every call has finished**.',
      files: [SERVICE],
      starter: `Thread startWorker(int n, Runnable task) {
    throw new UnsupportedOperationException("Not written yet");
}

int sendAll(List<String> messages, Service service) throws Exception {
    throw new UnsupportedOperationException("Not written yet");
}

void main() throws Exception {
    Thread t = startWorker(1, () -> IO.println("hello from " + Thread.currentThread().getName()));
    t.join();
    IO.println("sent " + sendAll(List.of("a", "b", "c"), m -> "ok"));
}`,
      solution: `Thread startWorker(int n, Runnable task) {
    return Thread.ofVirtual().name("worker-" + n).start(task);
}

int sendAll(List<String> messages, Service service) throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (String m : messages) {
            executor.submit(() -> service.fetch(m));
        }
    }
    return messages.size();
}

void main() throws Exception {
    Thread t = startWorker(1, () -> IO.println("hello from " + Thread.currentThread().getName()));
    t.join();
    IO.println("sent " + sendAll(List.of("a", "b", "c"), m -> "ok"));
}`,
      hints: [
        '`Thread.ofVirtual().name("worker-" + n).start(task)` starts it and returns it in one line.',
        'In `sendAll`, submit every call to `Executors.newVirtualThreadPerTaskExecutor()` inside a try-with-resources block: its `close()`, at the end of the block, waits for every call.',
        'A virtual thread is a daemon: if `sendAll` returned before the calls finished, nothing would wait for them.'
      ],
      checks: [
        { label: 'startWorker returns a virtual thread', code: `Thread t = c.call("startWorker", 7, (Runnable) () -> {});
t.join(2_000);
c.ok(t.isVirtual(), "the thread is a platform thread: use Thread.ofVirtual()");` },
        { label: 'it is named worker-7', code: `Thread t = c.call("startWorker", 7, (Runnable) () -> {});
t.join(2_000);
c.eq(t.getName(), "worker-7");` },
        { label: 'it is already started, and runs the task', code: `var ran = new java.util.concurrent.atomic.AtomicBoolean();
Thread t = c.call("startWorker", 3, (Runnable) () -> ran.set(true));
c.ok(t.getState() != Thread.State.NEW, "the thread was returned without being started: call start(task), not unstarted(task)");
t.join(2_000);
c.ok(ran.get(), "the task never ran");` },
        { label: 'sendAll returns how many it sent', code: `c.eq(c.call("sendAll", List.of("a", "b", "c", "d"), (Service) m -> m), 4);` },
        { label: 'sendAll sends them all at the same time', code: `var p = c.probe(4);
c.call("sendAll", List.of("a", "b", "c", "d"), (Service) m -> { p.meet(); return m; });
c.ok(p.met(), "at most " + p.peak() + " of the 4 calls were in flight at once");` },
        { label: 'sendAll returns only when every call has finished', code: `var p = c.probe(5);
c.call("sendAll", List.of("a", "b", "c", "d", "e"), (Service) m -> { p.sleep(300); return m; });
c.ok(p.finished() == 5, "sendAll returned while " + (5 - p.finished()) + " of the 5 calls were still running: wait for them (join, or close the executor)");` },
        { label: 'each call runs on a virtual thread', code: `var p = c.probe(3);
c.call("sendAll", List.of("a", "b", "c"), (Service) m -> { p.meet(); return m; });
c.ok(p.allVirtual(), p.platformCalls() + " of the calls ran on a platform thread");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'vt-under-the-hood', track: 'virtual-threads', title: 'Carriers, mounting and unmounting',
    summary: 'A virtual thread runs on a carrier, a platform thread of a small ForkJoinPool. When it blocks, its stack moves to the heap and the carrier runs another one: a thousand threads can wait on one carrier.',
    keywords: ['carrier thread', 'carrier', 'mount', 'unmount', 'continuation', 'scheduler', 'ForkJoinPool', 'parallelism', 'jdk.virtualThreadScheduler.parallelism', 'stack chunk', 'heap'],
    docs: 'https://openjdk.org/jeps/444', docsLabel: 'JEP 444: Virtual Threads', lab: '18-java-virtual-threads',
    body: [
      '## A thread made of an object',
      'A platform thread *is* an operating-system thread. A virtual thread is an ordinary Java object (of the class `java.lang.VirtualThread`) that holds a **continuation**: the code it runs, and, while it is not running, its stack frames, kept on the heap.',
      '## Carriers',
      'Virtual threads run on a **scheduler**: a `ForkJoinPool` of platform threads, called **carrier threads**. It has as many carriers as the machine has processors (`Runtime.getRuntime().availableProcessors()`); the system property `jdk.virtualThreadScheduler.parallelism` changes that.',
      '- **Mount**: the scheduler picks a virtual thread that is ready and runs it on a free carrier: its frames go onto the carrier\'s stack.\n- **Unmount**: when the virtual thread blocks in the JDK (a `sleep`, a lock, a queue, a socket read), its frames are copied to the heap and the carrier is free for another virtual thread.\n- **Resume**: when the wait is over, it is mounted again, on whichever carrier is free, which need not be the one it had.',
      '## A thousand waiting threads, one carrier',
      'The first two lines give the scheduler a single carrier, and forbid it to add a second one while a carrier is blocked (it reads both once, when the first virtual thread is made). Each task blocks for a second; while one blocks, the carrier runs the next:',
      jv(`void main() throws Exception {
    // one carrier for every virtual thread
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    var inFlight = new AtomicInteger();
    var most = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 1_000; i++) {
            executor.submit(() -> {
                most.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
                // blocks: the virtual thread unmounts, the carrier runs the next one
                Thread.sleep(1_000);
                inFlight.decrementAndGet();
                return null;
            });
        }
    }
    IO.println("most waiting at once, on one carrier: " + most.get());
}`),
      out('most waiting at once, on one carrier: 1000'),
      '## Thread.currentThread() is the virtual thread',
      'Code running in a virtual thread never sees its carrier: `Thread.currentThread()` is the virtual thread, and `ThreadLocal`s are the virtual thread\'s own. Only its `toString()` names the carrier it is mounted on at that moment:',
      jv(`void main() throws Exception {
    Thread vt = Thread.ofVirtual().start(() -> {
        Thread me = Thread.currentThread();
        IO.println("current thread is virtual: " + me.isVirtual());
        IO.println("mounted on a ForkJoinPool carrier: " + me.toString().contains("@ForkJoinPool"));
    });
    vt.join();
}`),
      out(`current thread is virtual: true
mounted on a ForkJoinPool carrier: true`),
      '## Where the stack goes',
      'An unmounted virtual thread\'s frames live in heap objects (stack chunks) that grow and shrink with the frames actually in use: a thread a few calls deep costs a few hundred bytes, not a reserved megabyte. That is why a million can wait at once, and also why deep recursion in a virtual thread still costs memory. The garbage collector frees the frames of a thread that has ended.',
      '## They do not take turns',
      'A carrier switches virtual threads only when one blocks or ends. There is no time slicing: a virtual thread that computes for a second keeps its carrier for that second. Lesson 4 shows it, and lesson 8 what to do about CPU-heavy work.'
    ].join('\n\n'),
    work: [
      '**In a thread dump of a Spring Boot service with virtual threads,** the carriers appear as platform threads named `ForkJoinPool-1-worker-N`. There are as many as the JVM sees processors, which in a container is the CPU limit it is given: two CPUs, two carriers, serving thousands of request threads.',
      '**You rarely set `jdk.virtualThreadScheduler.parallelism`.** It exists for tests and for special cases, as here: one carrier makes visible what many carriers hide. In a real service, a carrier count that is too small shows up only when something holds carriers, which lessons 5 and 8 are about.'
    ].join('\n\n'),
    example: {
      code: `void main() throws Exception {
    // try 2, 4 or 8: the result does not change
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    var inFlight = new AtomicInteger();
    var most = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 5_000; i++) {
            executor.submit(() -> {
                most.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
                Thread.sleep(500);
                inFlight.decrementAndGet();
                return null;
            });
        }
    }
    IO.println("most waiting at once: " + most.get());
}`
    },
    challenge: {
      title: 'Many calls, one carrier',
      task: 'This run gives the scheduler **one carrier thread** (the first line of `main`; the checks set it too). Write `fetchAll(ids, service)`: call `service.fetch(id)` for every id, each on a virtual thread, all at the same time, and return the answers in the order of the ids.\n\nWith one carrier, the calls can only be in flight together if every virtual thread unmounts while it waits. The checks hand you a service whose calls block until the others arrive, and ask for 500 at once.',
      files: [SERVICE],
      starter: `List<String> fetchAll(List<String> ids, Service service) throws Exception {
    throw new UnsupportedOperationException("Not written yet");
}

void main() throws Exception {
    // one carrier: keep this line first
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    IO.println(fetchAll(List.of("a", "b", "c"), id -> id + "!"));
}`,
      solution: `List<String> fetchAll(List<String> ids, Service service) throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<String>> futures = new ArrayList<>();
        for (String id : ids) {
            futures.add(executor.submit(() -> service.fetch(id)));
        }
        List<String> answers = new ArrayList<>();
        for (Future<String> f : futures) answers.add(f.get());
        return answers;
    }
}

void main() throws Exception {
    // one carrier: keep this line first
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    IO.println(fetchAll(List.of("a", "b", "c"), id -> id + "!"));
}`,
      hints: [
        'A virtual thread per id: `Executors.newVirtualThreadPerTaskExecutor()`, one `submit` per id, the `Future`s kept in order.',
        'The service\'s `fetch` blocks in the JDK (it waits on a latch), so each virtual thread unmounts and the one carrier moves on to the next.',
        'Calling `get()` on a `Future` before submitting the next one would run them one after another: submit them all first.'
      ],
      checks: [
        { label: 'the answers come back in the order of the ids', code: `c.oneCarrier();
c.eq(c.call("fetchAll", List.of("x", "y", "z"), (Service) id -> id + id), List.of("xx", "yy", "zz"));` },
        { label: 'each call runs on a virtual thread', code: `c.oneCarrier();
var p = c.probe(3);
c.call("fetchAll", List.of("a", "b", "c"), (Service) id -> { p.meet(); return id; });
c.ok(p.allVirtual(), p.platformCalls() + " of the calls ran on a platform thread");` },
        { label: 'five calls wait together on the one carrier', code: `c.oneCarrier();
var p = c.probe(5);
c.call("fetchAll", List.of("a", "b", "c", "d", "e"), (Service) id -> { p.meet(); return id; });
c.ok(p.met(), "at most " + p.peak() + " of the 5 calls were in flight at once");` },
        { label: '500 calls wait together on the one carrier', code: `c.oneCarrier();
var p = c.probe(500, 3_000);
List<String> ids = new ArrayList<>();
for (int i = 0; i < 500; i++) ids.add("id" + i);
c.call("fetchAll", ids, (Service) id -> { p.meet(); return id; });
c.ok(p.met(), "at most " + p.peak() + " of the 500 calls were in flight at once");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'vt-blocking', track: 'virtual-threads', title: 'What blocking does',
    summary: 'Sleeping, locks, queues, futures and sockets unmount a virtual thread. File I/O holds the carrier, and the scheduler adds a carrier to make up for it. CPU work is never interrupted: no time slicing.',
    keywords: ['blocking', 'unmount', 'park', 'BlockingQueue', 'ReentrantLock', 'CountDownLatch', 'socket', 'file I/O', 'compensate', 'capture', 'time slicing', 'Object.wait', 'WAITING'],
    docs: 'https://openjdk.org/jeps/444', docsLabel: 'JEP 444: Virtual Threads', lab: '18-java-virtual-threads',
    body: [
      '## Blocking calls that unmount',
      'Virtual threads are worth having because the JDK\'s blocking calls were rewritten to **park** the virtual thread instead of blocking the carrier. Among them:',
      '| Kind | Calls that unmount the virtual thread |\n|---|---|\n| Waiting | `Thread.sleep`, `Thread.join`, `Future.get`, `CompletableFuture.join` |\n| Locks and synchronizers | `ReentrantLock`, `ReadWriteLock`, `Semaphore`, `CountDownLatch`, `CyclicBarrier`, `Condition.await` |\n| Queues | `BlockingQueue.put` and `take`, `SynchronousQueue`, `Exchanger` |\n| Network | sockets and socket channels (`java.net`, NIO), so JDBC drivers and HTTP clients written on them |\n| Monitors (Java 24 and later) | `synchronized`, `Object.wait` |',
      'Three virtual threads, three kinds of wait, one carrier. All three are parked at the same time, in the `WAITING` state:',
      jv(`void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    var queue = new ArrayBlockingQueue<String>(1);
    var gate = new CountDownLatch(1);
    var lock = new ReentrantLock();
    // main holds the lock for now
    lock.lock();
    Thread taker = Thread.ofVirtual().start(() -> { try { queue.take(); } catch (InterruptedException e) { } });
    Thread waiter = Thread.ofVirtual().start(() -> { try { gate.await(); } catch (InterruptedException e) { } });
    Thread locker = Thread.ofVirtual().start(() -> { lock.lock(); lock.unlock(); });
    Thread.sleep(300);
    IO.println("queue taker: " + taker.getState());
    IO.println("latch waiter: " + waiter.getState());
    IO.println("lock waiter: " + locker.getState());
    queue.put("a message");
    gate.countDown();
    lock.unlock();
    taker.join();
    waiter.join();
    locker.join();
    IO.println("all three finished");
}`),
      out(`queue taker: WAITING
latch waiter: WAITING
lock waiter: WAITING
all three finished`),
      '## Blocking that holds the carrier',
      'Some operations cannot be made to wait without a thread: on most operating systems, reading or writing a **file** is one. A virtual thread doing file I/O keeps its carrier for the call. JEP 444 calls this *capturing* the carrier, and the scheduler makes up for it by adding a carrier for a while, so the other virtual threads keep running. In Java 21 to 23, `Object.wait()` worked this way too; since Java 24 it unmounts.',
      '## No time slicing',
      'A virtual thread gives its carrier up only when it blocks or ends. Code that computes without blocking keeps it, however long it takes. With one carrier, a second virtual thread has to wait for the first to finish its loop:',
      jv(`void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    List<String> log = Collections.synchronizedList(new ArrayList<>());
    Thread a = Thread.ofVirtual().start(() -> {
        log.add("A: busy for 300 ms, never blocking");
        long end = System.nanoTime() + 300_000_000L;
        // CPU work: no blocking call, so no unmount
        while (System.nanoTime() < end) { }
        log.add("A: done");
    });
    // A is running now
    Thread.sleep(50);
    Thread b = Thread.ofVirtual().start(() -> log.add("B: finally got the carrier"));
    a.join();
    b.join();
    log.forEach(IO::println);
}`),
      out(`A: busy for 300 ms, never blocking
A: done
B: finally got the carrier`),
      'With one carrier per processor, a few virtual threads doing long computations can hold every carrier, and then the thousands of others that only wait cannot even resume. Lesson 8 keeps CPU work off the carriers.'
    ].join('\n\n'),
    work: [
      '**Database and HTTP calls unmount.** JDBC drivers written in Java talk over sockets, so a query parks the request\'s virtual thread; Spring\'s `RestClient` and `RestTemplate` and the JDK\'s `HttpClient` do the same. A driver that calls native code (a JNI driver) holds the carrier instead: lesson 5.',
      '**Logging to a file holds the carrier briefly.** A synchronous file appender writes on the request\'s thread, so each write captures the carrier for a moment and the scheduler compensates. An asynchronous appender moves the file I/O to a thread of its own.',
      '**A busy loop is a bug on any thread, and worse on a virtual one.** `while (!ready) { }` or a retry loop with no sleep keeps a carrier for as long as it spins.'
    ].join('\n\n'),
    example: {
      code: `void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    // a hand-off: put waits for a take
    var queue = new SynchronousQueue<Integer>();
    Thread producer = Thread.ofVirtual().start(() -> {
        try {
            for (int i = 1; i <= 5; i++) {
                IO.println("put " + i);
                queue.put(i);
            }
        } catch (InterruptedException e) { }
    });
    Thread consumer = Thread.ofVirtual().start(() -> {
        try {
            for (int i = 1; i <= 5; i++) IO.println("took " + queue.take());
        } catch (InterruptedException e) { }
    });
    producer.join();
    consumer.join();
}`,
      note: 'Two virtual threads take turns on one carrier: each one parks in `put` or `take` and lets the other run.'
    },
    challenge: {
      title: 'A hand-off on one carrier',
      task: 'Write `sumThroughQueue(n)`: one virtual thread **puts** the numbers 1 to n into an `ArrayBlockingQueue` of capacity 1, another virtual thread **takes** n numbers from it and adds them up; return the sum once both have finished.\n\nThe run has one carrier (the checks set it), so each thread must block in `put` and `take` and let the other one run. A loop that polls the queue without blocking would keep the carrier for ever.',
      starter: `long sumThroughQueue(int n) throws Exception {
    // A producer virtual thread puts 1..n into an ArrayBlockingQueue of capacity 1;
    // a consumer virtual thread takes n numbers and adds them up. Return the sum.
    throw new UnsupportedOperationException("Not written yet");
}

void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    IO.println(sumThroughQueue(10));
}`,
      solution: `long sumThroughQueue(int n) throws Exception {
    var queue = new ArrayBlockingQueue<Integer>(1);
    var sum = new AtomicLong();
    Thread producer = Thread.ofVirtual().start(() -> {
        try {
            for (int i = 1; i <= n; i++) queue.put(i);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    Thread consumer = Thread.ofVirtual().start(() -> {
        try {
            for (int i = 0; i < n; i++) sum.addAndGet(queue.take());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    producer.join();
    consumer.join();
    return sum.get();
}

void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    IO.println(sumThroughQueue(10));
}`,
      hints: [
        '`var queue = new ArrayBlockingQueue<Integer>(1);` then two `Thread.ofVirtual().start(…)` threads, and `join()` both before returning.',
        'The consumer\'s running total is written by one thread and read by another: an `AtomicLong` (or reading it only after `join()`, which makes the write visible) keeps that safe.',
        '`put` and `take` throw `InterruptedException`, and a `Runnable` lambda may not: catch it inside the lambda.'
      ],
      checks: [
        { label: 'sumThroughQueue(10) is 55', code: `c.oneCarrier();
c.eq(c.call("sumThroughQueue", 10), 55L);` },
        { label: 'sumThroughQueue(0) is 0', code: `c.oneCarrier();
c.eq(c.call("sumThroughQueue", 0), 0L);` },
        { label: '20,000 numbers pass through the queue on one carrier', code: `c.oneCarrier();
c.eq(c.call("sumThroughQueue", 20_000), 200_010_000L);` },
        { label: 'it uses a blocking queue', code: `c.ok(c.uses("BlockingQueue|SynchronousQueue"), "use an ArrayBlockingQueue: its put and take block, which lets the other thread run");` },
        { label: 'it runs the two sides on virtual threads', code: `c.ok(c.uses("ofVirtual|startVirtualThread|newVirtualThreadPerTaskExecutor"), "start the producer and the consumer as virtual threads");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'vt-pinning', track: 'virtual-threads', title: 'Pinning, and the Java 24 fix',
    summary: 'A pinned virtual thread cannot unmount, so its wait blocks the carrier too. In Java 21 to 23, synchronized pinned; since Java 24 it does not. A blocking class initializer, and native frames, still pin in Java 25.',
    keywords: ['pinning', 'pinned', 'synchronized', 'monitor', 'JEP 491', 'class initializer', 'static initializer', 'clinit', 'native', 'ReentrantLock', 'Java 24', 'Object.wait'],
    docs: 'https://openjdk.org/jeps/491', docsLabel: 'JEP 491: Synchronize Virtual Threads without Pinning', lab: '18-java-virtual-threads',
    body: [
      '## Pinned: mounted and stuck',
      'A virtual thread is **pinned** when it blocks but cannot unmount: its carrier then blocks with it, and runs nothing else until the wait ends. The scheduler does not add a carrier to make up for a pinned one.',
      '| Java | `synchronized` around a blocking call |\n|---|---|\n| 21 to 23 | pins: the monitor belonged to the carrier, so the virtual thread could not leave it (JEP 444) |\n| 24 and later | does not pin: monitors were reworked so a virtual thread can unmount while it holds one, waits to enter one, or waits in `Object.wait()` ([JEP 491](https://openjdk.org/jeps/491)) |',
      'On Java 25, with one carrier, a virtual thread sleeping inside `synchronized` lets another one run:',
      jv(`void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    Object lock = new Object();
    var ran = new AtomicBoolean();
    Thread holder = Thread.ofVirtual().start(() -> {
        synchronized (lock) {
            // blocks while holding the monitor
            try { Thread.sleep(500); } catch (InterruptedException e) { }
        }
    });
    Thread.sleep(100);
    Thread other = Thread.ofVirtual().start(() -> ran.set(true));
    other.join(300);
    IO.println("the other thread ran while the monitor was held: " + ran.get());
    holder.join();
}`),
      out('the other thread ran while the monitor was held: true'),
      'On Java 21 to 23 the same program prints `false`: the holder pinned the only carrier, so the other thread could not start until the sleep ended.',
      '## What still pins in Java 25',
      'JEP 491 lists what is left:',
      '- a virtual thread that calls **native code** (a JNI method or a foreign function), when that code calls back into Java that blocks;\n- **blocking inside a class initializer** (a `static { … }` block, or a static field\'s initial value);\n- waiting for **another thread to finish initialising a class**;\n- blocking while the JVM **loads a class** to resolve a name.',
      'The class initializer is the one ordinary code meets. A `static` block that waits for something pins the thread that first touched the class:',
      jv(`static class Settings {
    static final String VALUE;
    static {
        // stands for loading settings over the network
        try { Thread.sleep(500); } catch (InterruptedException e) { }
        VALUE = "loaded";
    }
}

void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    var ran = new AtomicBoolean();
    Thread loader = Thread.ofVirtual().start(() -> IO.println("settings: " + Settings.VALUE));
    Thread.sleep(100);
    Thread other = Thread.ofVirtual().start(() -> ran.set(true));
    other.join(300);
    IO.println("the other thread ran while the class loaded: " + ran.get());
    loader.join();
}`),
      out(`the other thread ran while the class loaded: false
settings: loaded`),
      'Lesson 9 catches this with JFR, whose `jdk.VirtualThreadPinned` event names the reason: "VM call to Main$Settings.<clinit> on stack".',
      '## On Java 21: a ReentrantLock',
      'Before Java 24, the advice was to replace `synchronized` with a `ReentrantLock` where code blocks while holding it, because a `java.util.concurrent` lock never pinned. On Java 24 and later, `synchronized` is fine again; a `ReentrantLock` is still the choice when you need `tryLock` with a timeout, fairness, or several conditions.'
    ].join('\n\n'),
    work: [
      '**Run virtual threads on Java 24 or later.** The Spring Boot reference says so: "For the best experience, Java 24 or later is strongly recommended", and warns of lower throughput from pinned virtual threads. Many libraries hold a monitor around I/O (connection pools, drivers, caches); on Java 21 each of those calls pinned a carrier, and a handful of slow ones could stall every request. Java 25 LTS removes that whole class of problem.',
      '**Keep slow work out of static initializers.** Loading configuration, warming a cache or opening a connection in a `static { }` block pins the first virtual thread that touches the class, and every other thread that touches it waits for the initialisation. Load it in a method instead, once, behind a lock.'
    ].join('\n\n'),
    example: {
      code: `// Try it: change synchronized to a ReentrantLock, or move the sleep into a static block.
void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    Object lock = new Object();
    var others = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        executor.submit(() -> {
            synchronized (lock) {
                Thread.sleep(500);
            }
            return null;
        });
        Thread.sleep(100);
        for (int i = 0; i < 100; i++) executor.submit(() -> { others.incrementAndGet(); return null; });
        Thread.sleep(200);
        IO.println("other threads that ran while the monitor was held: " + others.get());
    }
}`
    },
    challenge: {
      title: 'Load the prices without pinning',
      task: 'The price table is loaded inside a **class initializer** (`static { … }` of `Prices`), with a slow call to `source.fetch("prices")`. That pins: while it loads, the one carrier (the checks set one) can run nothing else.\n\nRewrite `prices(service)` so that it:\n\n1. returns what `service.fetch("prices")` returns;\n2. does the fetch **outside any class initializer**, so other virtual threads run while it waits;\n3. fetches **only once**, however many threads call it at the same time (keep the answer in a field, behind a lock; `synchronized` is fine on Java 25).',
      files: [SERVICE],
      starter: `static Service source;

static class Prices {
    static final String TABLE;
    static {
        try {
            // a slow call inside a class initializer: it pins
            TABLE = source.fetch("prices");
        } catch (InterruptedException e) {
            throw new IllegalStateException(e);
        }
    }
}

String prices(Service service) throws Exception {
    source = service;
    return Prices.TABLE;
}

void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    IO.println(prices(id -> "apple=3, pear=4"));
}`,
      solution: `private String table;                                   // loaded on first use

synchronized String prices(Service service) throws Exception {
    if (table == null) {
        // an ordinary method: a virtual thread unmounts here
        table = service.fetch("prices");
    }
    return table;
}

void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    IO.println(prices(id -> "apple=3, pear=4"));
}`,
      hints: [
        'Delete the `Prices` class: keep the table in a field of your own, and fill it in `prices` the first time it is called.',
        'Make `prices` `synchronized` (or use a `ReentrantLock`): then two threads calling it together cannot both see the field empty and both fetch.',
        'On Java 25, a virtual thread waiting inside `synchronized` unmounts, so the lock costs no carrier.'
      ],
      checks: [
        { label: 'prices returns what the service returns', code: `c.oneCarrier();
c.eq(c.call("prices", (Service) id -> "apple=3"), "apple=3");` },
        { label: 'other virtual threads run while the prices load', code: `c.oneCarrier();
var p = c.probe(2);
Service s = id -> { p.meet(); return "table"; };
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(c.callable("prices", s));
    Thread.sleep(100);
    executor.submit(() -> { p.meet(); return null; });
}
c.ok(p.met(), "while the prices loaded, no other virtual thread could run on the one carrier: the load is pinned (is it still in a class initializer?)");` },
        { label: 'ten threads asking at once cause one fetch', code: `c.oneCarrier();
var p = c.probe(1);
Service s = id -> { p.sleep(200); return "table"; };
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10; i++) executor.submit(c.callable("prices", s));
}
c.eq(p.calls(), 1);` },
        { label: 'no class initializer does the fetch', code: `c.ok(!c.uses("static\\\\s*\\\\{"), "a static { } block is still there: move the fetch into a method");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 6 */
  L.push({
    id: 'vt-limit', track: 'virtual-threads', title: 'Limit with a Semaphore, never a pool',
    summary: 'Virtual threads are cheap, so never pool them. A pool was also a limit: a Semaphore around the call to the slow resource keeps that limit where it belongs, and tryAcquire with a timeout sheds load.',
    keywords: ['Semaphore', 'pool', 'pooling', 'limit', 'bulkhead', 'rate limit', 'tryAcquire', 'backpressure', 'connection pool', 'HikariCP', 'newFixedThreadPool'],
    docs: 'https://openjdk.org/jeps/444', docsLabel: 'JEP 444: Virtual Threads', lab: '18-java-virtual-threads',
    body: [
      '## Never pool virtual threads',
      'A thread pool did two jobs: it **reused** threads that were costly to make, and it **limited** how many ran at once. Virtual threads cost almost nothing to make, so reuse is pointless; JEP 444 puts it plainly: "Virtual threads are cheap and plentiful, and thus should never be pooled." What is left is the limit, and a pool is a poor place for it.',
      '## A Semaphore around the scarce thing',
      'A `Semaphore` hands out a fixed number of permits: `acquire()` waits for one (a virtual thread unmounts while it waits), `release()` gives it back. Put it around the call to the resource that needs protecting:',
      jv(`void main() throws Exception {
    var permits = new Semaphore(5);
    var inFlight = new AtomicInteger();
    var most = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 100; i++) {
            executor.submit(() -> {
                permits.acquire();
                try {
                    most.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
                    // the call to the slow service
                    Thread.sleep(50);
                    inFlight.decrementAndGet();
                } finally {
                    permits.release();
                }
                return null;
            });
        }
    }
    IO.println("100 tasks, at most " + most.get() + " calls at once");
}`),
      out('100 tasks, at most 5 calls at once'),
      'All 100 tasks have a thread; only 5 at a time are inside the call. Always `release()` in a `finally`, or a failed call would lose its permit for good.',
      '## Why the limit belongs on the resource',
      'One request may call the database (10 connections), a payment service (20 calls at once allowed) and a cache (no limit). A pool of request threads can enforce only one number for all three. A semaphore per resource enforces each one, at the call, whatever thread is calling.',
      '## Waiting, or saying no',
      '`tryAcquire(timeout)` waits at most that long and returns `false` if no permit came: the caller can answer "busy, try again" (HTTP 503) at once instead of queueing without end. That is **load shedding**.',
      jv(`void main() throws Exception {
    var permits = new Semaphore(1);
    // someone else holds the only permit
    permits.acquire();
    Thread t = Thread.ofVirtual().start(() -> {
        try {
            if (permits.tryAcquire(100, TimeUnit.MILLISECONDS)) {
                try { IO.println("got a permit"); } finally { permits.release(); }
            } else {
                IO.println("busy: answer 503 and let the client retry");
            }
        } catch (InterruptedException e) { }
    });
    t.join();
    permits.release();
}`),
      out('busy: answer 503 and let the client retry'),
      '`new Semaphore(n, true)` makes it **fair**: permits go to waiters in the order they asked. The default is faster but lets a newcomer jump the queue.'
    ].join('\n\n'),
    work: [
      '**The database pool becomes the queue.** HikariCP, Spring Boot\'s default connection pool, has 10 connections unless you set `spring.datasource.hikari.maximum-pool-size`, and a caller waits up to `connection-timeout` (30 seconds by default) for one. With Tomcat\'s 200 platform threads, at most 200 requests waited for those 10 connections. With a virtual thread per request, 5,000 can, and they all wait the full 30 seconds before failing. Put a limit in front (a `Semaphore`, or a bulkhead from a resilience library) and decide what an excess request should get: a short wait, or a fast 503.',
      '**A downstream service\'s limit.** When a partner API allows 20 concurrent calls, a `Semaphore(20)` around the client call keeps you within it, from every request thread at once.'
    ].join('\n\n'),
    example: {
      code: `// Change the permits and the number of tasks: the peak follows the permits, not the threads.
void main() throws Exception {
    int permitsAllowed = 3, tasks = 30;
    var permits = new Semaphore(permitsAllowed);
    var inFlight = new AtomicInteger();
    var most = new AtomicInteger();
    long start = System.nanoTime();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < tasks; i++) {
            executor.submit(() -> {
                permits.acquire();
                try {
                    most.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
                    Thread.sleep(100);
                    inFlight.decrementAndGet();
                } finally {
                    permits.release();
                }
                return null;
            });
        }
    }
    IO.println(tasks + " tasks, " + permitsAllowed + " permits: at most " + most.get() + " at once, "
        + (System.nanoTime() - start) / 1_000_000 + " ms");
}`
    },
    challenge: {
      title: 'At most n calls at once',
      task: 'Write `fetchAll(ids, service, limit)`: call `service.fetch(id)` for every id, each on a virtual thread, with **at most `limit` calls in flight at any moment**, and return the answers in the order of the ids.\n\nUse a `Semaphore`, not a pool: every id gets a virtual thread straight away, and the permits do the limiting.',
      files: [SERVICE],
      starter: `List<String> fetchAll(List<String> ids, Service service, int limit) throws Exception {
    throw new UnsupportedOperationException("Not written yet");
}

void main() throws Exception {
    IO.println(fetchAll(List.of("a", "b", "c", "d"), id -> id.toUpperCase(), 2));
}`,
      solution: `List<String> fetchAll(List<String> ids, Service service, int limit) throws Exception {
    var permits = new Semaphore(limit);
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<String>> futures = new ArrayList<>();
        for (String id : ids) {
            futures.add(executor.submit(() -> {
                permits.acquire();
                try {
                    return service.fetch(id);
                } finally {
                    permits.release();
                }
            }));
        }
        List<String> answers = new ArrayList<>();
        for (Future<String> f : futures) answers.add(f.get());
        return answers;
    }
}

void main() throws Exception {
    IO.println(fetchAll(List.of("a", "b", "c", "d"), id -> id.toUpperCase(), 2));
}`,
      hints: [
        'One `Semaphore(limit)`, shared by all the tasks of this call. Each task acquires a permit before `fetch` and releases it in a `finally`.',
        'Submit every id to `Executors.newVirtualThreadPerTaskExecutor()`: the threads are free; the permits are the limit.',
        'Keep the `Future`s in the order of the ids and `get()` them in that order.'
      ],
      checks: [
        { label: 'the answers come back in the order of the ids', code: `c.eq(c.call("fetchAll", List.of("a", "b", "c"), (Service) id -> id + "1", 2), List.of("a1", "b1", "c1"));` },
        { label: 'with a limit of 3, three calls run together', code: `var p = c.probe(3);
List<String> ids = new ArrayList<>();
for (int i = 0; i < 12; i++) ids.add("id" + i);
c.call("fetchAll", ids, (Service) id -> { p.meet(); p.sleep(20); return id; }, 3);
c.ok(p.met(), "at most " + p.peak() + " calls were in flight at once, with a limit of 3: use all the permits");` },
        { label: 'never more than the limit at once', code: `var p = c.probe(3);
List<String> ids = new ArrayList<>();
for (int i = 0; i < 12; i++) ids.add("id" + i);
c.call("fetchAll", ids, (Service) id -> { p.meet(); p.sleep(20); return id; }, 3);
c.ok(p.peak() <= 3, p.peak() + " calls were in flight at once, with a limit of 3");` },
        { label: 'a limit of 1 runs them one at a time', code: `var p = c.probe(1);
c.call("fetchAll", List.of("a", "b", "c", "d"), (Service) id -> { p.sleep(20); return id; }, 1);
c.eq(p.peak(), 1);` },
        { label: 'each call runs on a virtual thread, not a pool\'s platform thread', code: `var p = c.probe(2);
c.call("fetchAll", List.of("a", "b", "c", "d"), (Service) id -> { p.meet(); return id; }, 2);
c.ok(p.allVirtual(), p.platformCalls() + " of the calls ran on a platform thread: use virtual threads and a Semaphore, not a pool");` },
        { label: 'it limits with a Semaphore', code: `c.ok(c.uses("Semaphore"), "limit the calls with a Semaphore");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 7 */
  L.push({
    id: 'vt-threadlocals', track: 'virtual-threads', title: 'ThreadLocal at a million threads',
    summary: 'ThreadLocal works on virtual threads, but a cache kept in one builds a new object for every task, and inherited values are copied into every thread. Share what is safe to share.',
    keywords: ['ThreadLocal', 'InheritableThreadLocal', 'cache', 'per-thread', 'memory', 'inheritInheritableThreadLocals', 'SimpleDateFormat', 'DateTimeFormatter', 'ScopedValue', 'MDC', 'context'],
    docs: 'https://openjdk.org/jeps/444', docsLabel: 'JEP 444: Virtual Threads', lab: '20-scoped-values',
    body: [
      '## Each virtual thread has its own',
      '`ThreadLocal` works on virtual threads as on platform threads: each thread sees its own value. What changes is how many threads there are, and how long each lives.',
      '## Caches in a ThreadLocal stop working',
      'A common trick on a pool: keep an object that is costly to build, and not safe to share, in a `ThreadLocal`, so each pooled thread builds one and reuses it for ever. With a virtual thread per task, every task is a new thread:',
      jv(`static final AtomicInteger built = new AtomicInteger();
static final ThreadLocal<StringBuilder> BUFFER = ThreadLocal.withInitial(() -> {
    built.incrementAndGet();
    // a costly object, kept per thread
    return new StringBuilder(10_000);
});

int run(ExecutorService executor) throws Exception {
    built.set(0);
    try (executor) {
        for (int i = 0; i < 1_000; i++) {
            executor.submit(() -> BUFFER.get().setLength(0));
        }
    }
    return built.get();
}

void main() throws Exception {
    IO.println("pool of 4 threads: " + run(Executors.newFixedThreadPool(4)) + " buffers built");
    IO.println("a virtual thread per task: " + run(Executors.newVirtualThreadPerTaskExecutor()) + " buffers built");
}`),
      out(`pool of 4 threads: 4 buffers built
a virtual thread per task: 1000 buffers built`),
      'The cache now costs more than having none. If the object is safe to share (immutable, or thread-safe), share one. If it is not, make one per use, or keep a small pool of them (a `BlockingQueue` of objects, not of threads).',
      '## Memory',
      'A `ThreadLocal` value lives as long as its thread. A million virtual threads each holding 10 KB in a `ThreadLocal` hold 10 GB. With threads that live for one request this is usually small, but it is worth knowing where the per-thread values are.',
      '## Inherited values are copied',
      'An `InheritableThreadLocal` copies its value into every thread the current thread starts, virtual ones included. The builder can turn that off:',
      jv(`static final InheritableThreadLocal<String> USER = new InheritableThreadLocal<>();

void main() throws Exception {
    USER.set("ravi");
    Thread inherits = Thread.ofVirtual().start(() -> IO.println("inherited: " + USER.get()));
    inherits.join();
    Thread fresh = Thread.ofVirtual().inheritInheritableThreadLocals(false).start(() -> IO.println("not inherited: " + USER.get()));
    fresh.join();
}`),
      out(`inherited: ravi
not inherited: null`),
      '## The replacement for context',
      'For values that describe the current request (the user, a trace id, a transaction), Java 25 has `ScopedValue` (final in Java 25): bound for the duration of a call, read-only inside it, and inherited by the subtasks of a structured scope without copying. Track 5 teaches it.'
    ].join('\n\n'),
    work: [
      '**Spring keeps request context in ThreadLocals.** `RequestContextHolder` (the current HTTP request), `SecurityContextHolder` (the logged-in user, a `ThreadLocal` by default), `TransactionSynchronizationManager` (the connection a `@Transactional` method uses) and the logging MDC all hold per-thread values. With a virtual thread per request that is fine: the request runs on one thread from start to end. They do not follow work you hand to *another* thread, virtual or not: Track 6 shows what breaks and the fixes.',
      '**Old utility code.** A `ThreadLocal<SimpleDateFormat>` (because `SimpleDateFormat` is not thread-safe) builds a formatter per request on virtual threads. `DateTimeFormatter` is immutable and thread-safe: one `static final` instance serves every thread.'
    ].join('\n\n'),
    example: {
      code: `static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");   // immutable: one for every thread

void main() throws Exception {
    var when = LocalDateTime.of(2026, 10, 31, 9, 30);
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<String>> results = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            int minutes = i * 15;
            results.add(executor.submit(() -> FORMAT.format(when.plusMinutes(minutes))));
        }
        for (Future<String> f : results) IO.println(f.get());
    }
}`
    },
    challenge: {
      title: 'One template for every thread',
      task: '`Template` (in its own file, read-only) is slow to build, and safe to share: `render` changes nothing. The code keeps one per thread in a `ThreadLocal`, which on virtual threads builds one **per request**.\n\nChange `message(order)` so it returns `"Order #<order> is on its way"` from **one shared** `Template`, however many virtual threads call it. Do not use a `ThreadLocal`.',
      files: [{ name: 'Template.java', code: `import java.util.concurrent.atomic.AtomicInteger;

/** A template that is slow to build (it parses a file) and safe to share: render() changes nothing. */
public final class Template {
    private static final AtomicInteger BUILT = new AtomicInteger();
    private final String text;

    public Template() {
        BUILT.incrementAndGet();
        this.text = "Order #%d is on its way";
    }

    public String render(int order) {
        return text.formatted(order);
    }

    /** How many templates have been built so far. */
    public static int built() {
        return BUILT.get();
    }
}
` }],
      starter: `static final ThreadLocal<Template> TEMPLATE = ThreadLocal.withInitial(Template::new);   // one per thread

String message(int order) {
    return TEMPLATE.get().render(order);
}

void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 1; i <= 3; i++) {
            int order = i;
            executor.submit(() -> IO.println(message(order)));
        }
    }
    IO.println("templates built: " + Template.built());
}`,
      solution: `static final Template TEMPLATE = new Template();    // safe to share: one for every thread

String message(int order) {
    return TEMPLATE.render(order);
}

void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 1; i <= 3; i++) {
            int order = i;
            executor.submit(() -> IO.println(message(order)));
        }
    }
    IO.println("templates built: " + Template.built());
}`,
      hints: [
        'A `static final Template TEMPLATE = new Template();` is built once, when the class is first used, and every thread can read it.',
        'Then `message` is one line: `return TEMPLATE.render(order);`.'
      ],
      checks: [
        { label: 'message(7) is "Order #7 is on its way"', code: `c.eq(c.call("message", 7), "Order #7 is on its way");` },
        { label: '200 virtual threads get the right message each', code: `List<Future<String>> results = new ArrayList<>();
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 200; i++) results.add(executor.submit(c.callable("message", i)));
}
for (int i = 0; i < 200; i++) c.eq(results.get(i).get(), "Order #" + i + " is on its way");` },
        { label: '200 virtual threads build no new template', code: `int before = Template.built();
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 200; i++) executor.submit(c.callable("message", i));
}
int built = Template.built() - before;
c.ok(built == 0, "200 calls on virtual threads built " + built + " templates: share one instead");` },
        { label: 'no ThreadLocal is left', code: `c.ok(!c.uses("ThreadLocal"), "a ThreadLocal is still there");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 8 */
  L.push({
    id: 'vt-cpu-bound', track: 'virtual-threads', title: 'CPU-bound work: when not to use them',
    summary: 'Virtual threads help when threads wait. Work that computes gains nothing, and with no time slicing it can hold every carrier. Wait on virtual threads; compute on a pool sized to the processors.',
    keywords: ['cpu-bound', 'cpu', 'compute', 'time slicing', 'fixed thread pool', 'availableProcessors', 'starvation', 'parallel streams', 'ForkJoinPool', 'bcrypt', 'image'],
    docs: 'https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html', docsLabel: 'Oracle: Virtual Threads', lab: '18-java-virtual-threads',
    body: [
      '## They help when threads wait',
      'A machine with 8 processors computes 8 things at once, whatever the threads. Virtual threads raise throughput by letting far more requests *wait* at once; a request that spends its time computing still needs a processor for all of that time.',
      '| The work | What fits |\n|---|---|\n| Waiting: database, HTTP calls, queues, files | a virtual thread per task |\n| Computing: hashing, compression, image or PDF work, big JSON | a pool of platform threads the size of the processors, or a parallel stream |\n| A request that does both | a virtual thread for the request, which hands the computing part to the pool and waits for it |',
      '## Why not compute on virtual threads anyway?',
      'Lesson 4 showed it: a virtual thread keeps its carrier until it blocks. Eight virtual threads each hashing for a second on an 8-carrier scheduler hold every carrier for that second, and the thousands of request threads whose database answers have arrived cannot resume. Their latency jumps, though the CPU is doing useful work.',
      '## Hand the computing part to a pool',
      // in real code: the number of processors
      jv(`static final ExecutorService CPU = Executors.newFixedThreadPool(2);

long checksum(String data) {
    long h = 0;
    for (int i = 0; i < 1_000_000; i++) h = h * 31 + data.charAt(i % data.length());
    return h;
}

void main() throws Exception {
    var onPlatform = new AtomicInteger();
    try (var requests = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<Long>> results = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            String data = "payload-" + i;
            results.add(requests.submit(() -> {
                // waiting: fine on the virtual thread
                Thread.sleep(100);
                // computing: on the pool
                return CPU.submit(() -> {
                    if (!Thread.currentThread().isVirtual()) onPlatform.incrementAndGet();
                    return checksum(data);
                }).get();
            }));
        }
        for (Future<Long> f : results) f.get();
    } finally {
        CPU.shutdown();
    }
    IO.println("4 requests done; computing ran on platform threads " + onPlatform.get() + " times");
}`),
      out('4 requests done; computing ran on platform threads 4 times'),
      'The request\'s virtual thread waits in `get()`, which unmounts it, so waiting for the pool costs no carrier. The pool\'s size, not the number of requests, decides how many computations run at once.',
      '## Parallel streams',
      'A parallel stream splits CPU work over the common `ForkJoinPool` (one thread per processor, less one). That is the right tool for computing; it is the wrong one for blocking calls, which hold its few threads. Track 5 shows `Gatherers.mapConcurrent`, a stream step that runs blocking calls on virtual threads.'
    ].join('\n\n'),
    work: [
      '**CPU-heavy steps inside web requests:** password hashing (Spring Security\'s `BCryptPasswordEncoder` is slow on purpose), resizing images, generating PDFs or reports, compressing, parsing very large JSON. On a service with virtual threads, run them on a bounded executor, for example a `ThreadPoolTaskExecutor` bean sized to the processors, and wait for the result from the request\'s virtual thread.',
      '**Batch jobs that only compute** gain nothing from virtual threads: a fixed pool or a parallel stream is the right shape.'
    ].join('\n\n'),
    example: {
      code: `long work(int seed) {
    long h = seed;
    for (int i = 0; i < 20_000_000; i++) h = h * 6364136223846793005L + 1442695040888963407L;
    return h;
}

long time(ExecutorService executor) throws Exception {
    long start = System.nanoTime();
    try (executor) {
        for (int i = 0; i < 16; i++) { int seed = i; executor.submit(() -> work(seed)); }
    }
    return (System.nanoTime() - start) / 1_000_000;
}

void main() throws Exception {
    int cores = Runtime.getRuntime().availableProcessors();
    IO.println("processors: " + cores);
    IO.println("pool of " + cores + ":     " + time(Executors.newFixedThreadPool(cores)) + " ms");
    IO.println("virtual threads: " + time(Executors.newVirtualThreadPerTaskExecutor()) + " ms   (no faster: the work computes)");
}`
    },
    challenge: {
      title: 'Wait on virtual threads, compute on the pool',
      task: 'Write `handle(ids, service, hasher, cpu)`: for every id, on a virtual thread of its own, all at the same time:\n\n1. fetch the data with `service.fetch(id)` (it waits);\n2. hash it with `hasher.hash(data)` **on the `cpu` executor** (a small pool of platform threads you are given), and wait for the result.\n\nReturn the hashes in the order of the ids. The checks count where each call ran.',
      files: [SERVICE, { name: 'Hasher.java', code: `/** CPU-heavy work: it computes, and never waits. */
public interface Hasher {
    long hash(String data);
}
` }],
      starter: `List<Long> handle(List<String> ids, Service service, Hasher hasher, ExecutorService cpu) throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<Long>> results = new ArrayList<>();
        for (String id : ids) {
            results.add(executor.submit(() -> {
                String data = service.fetch(id);
                // computing on the virtual thread: move this to the cpu executor
                return hasher.hash(data);
            }));
        }
        List<Long> hashes = new ArrayList<>();
        for (Future<Long> f : results) hashes.add(f.get());
        return hashes;
    }
}

void main() throws Exception {
    try (var cpu = Executors.newFixedThreadPool(2)) {
        IO.println(handle(List.of("a", "bb"), id -> "data-" + id, data -> data.length(), cpu));
    }
}`,
      solution: `List<Long> handle(List<String> ids, Service service, Hasher hasher, ExecutorService cpu) throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<Long>> results = new ArrayList<>();
        for (String id : ids) {
            results.add(executor.submit(() -> {
                String data = service.fetch(id);
                return cpu.submit(() -> hasher.hash(data)).get();
            }));
        }
        List<Long> hashes = new ArrayList<>();
        for (Future<Long> f : results) hashes.add(f.get());
        return hashes;
    }
}

void main() throws Exception {
    try (var cpu = Executors.newFixedThreadPool(2)) {
        IO.println(handle(List.of("a", "bb"), id -> "data-" + id, data -> data.length(), cpu));
    }
}`,
      hints: [
        'Inside each virtual thread\'s task: `cpu.submit(() -> hasher.hash(data)).get()`. The `get()` waits, and a virtual thread unmounts while it waits.',
        'Use the executor you are given: its size is the limit on computing at once. A pool of your own would let more run.'
      ],
      checks: [
        { label: 'the hashes come back in the order of the ids', code: `try (var cpu = Executors.newFixedThreadPool(2)) {
    c.eq(c.call("handle", List.of("a", "bbb", "cc"), (Service) id -> "data-" + id, (Hasher) d -> (long) d.length(), cpu), List.of(6L, 8L, 7L));
}` },
        { label: 'the fetches run at the same time, on virtual threads', code: `var p = c.probe(4);
try (var cpu = Executors.newFixedThreadPool(2)) {
    c.call("handle", List.of("a", "b", "c", "d"), (Service) id -> { p.meet(); return id; }, (Hasher) d -> 1L, cpu);
}
c.ok(p.met(), "at most " + p.peak() + " of the 4 fetches were in flight at once");
c.ok(p.allVirtual(), p.platformCalls() + " fetches ran on a platform thread");` },
        { label: 'the hashing runs on the cpu executor\'s platform threads', code: `var p = c.probe(1);
try (var cpu = Executors.newFixedThreadPool(2)) {
    c.call("handle", List.of("a", "b", "c", "d"), (Service) id -> id, (Hasher) d -> { try { p.sleep(20); } catch (InterruptedException e) { throw new RuntimeException(e); } return 1L; }, cpu);
}
c.ok(p.virtualCalls() == 0, p.virtualCalls() + " of the 4 hashes ran on a virtual thread: submit them to the cpu executor");` },
        { label: 'no more hashes at once than the pool has threads', code: `var p = c.probe(1);
try (var cpu = Executors.newFixedThreadPool(2)) {
    c.call("handle", List.of("a", "b", "c", "d", "e", "f"), (Service) id -> id, (Hasher) d -> { try { p.sleep(50); } catch (InterruptedException e) { throw new RuntimeException(e); } return 1L; }, cpu);
}
c.ok(p.peak() <= 2, p.peak() + " hashes ran at once, but the cpu executor has 2 threads: use it, not a pool of your own");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 9 */
  L.push({
    id: 'vt-observe', track: 'virtual-threads', title: 'Observing them: thread dumps and JFR',
    summary: 'jstack does not show waiting virtual threads; jcmd Thread.dump_to_file does, as text or JSON. JFR records pinning with its reason. Name your threads so both are readable.',
    keywords: ['thread dump', 'jcmd', 'Thread.dump_to_file', 'jstack', 'JSON', 'JFR', 'Flight Recorder', 'VirtualThreadPinned', 'HotSpotDiagnosticMXBean', 'dumpThreads', 'observability', 'RecordingStream'],
    docs: 'https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html', docsLabel: 'Oracle: Virtual Threads', lab: '18-java-virtual-threads',
    body: [
      '## The old thread dump leaves them out',
      'Measured on JDK 25 with three named virtual threads waiting on a latch:',
      '| Command | The three virtual threads |\n|---|---|\n| `jstack <pid>` | not listed |\n| `jcmd <pid> Thread.print` | not listed |\n| `jcmd <pid> Thread.dump_to_file -format=text <file>` | listed |\n| `jcmd <pid> Thread.dump_to_file -format=json <file>` | listed, grouped by the executor or scope that owns them |',
      'The new dump (JEP 444) is written to a file because it can hold a million threads. The file must not exist yet.',
      '## A dump from inside the program',
      'The same dump is one call on `HotSpotDiagnosticMXBean`, which a program (or a health endpoint) can make about itself. It needs an absolute path to a file that does not exist yet:',
      jv(`import com.sun.management.HotSpotDiagnosticMXBean;
import java.lang.management.ManagementFactory;

void main() throws Exception {
    var gate = new CountDownLatch(1);
    try (var executor = Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("order-", 1).factory())) {
        for (int i = 0; i < 3; i++) executor.submit(() -> { gate.await(); return null; });
        Thread.sleep(200);
        Path file = Files.createTempFile("threads", ".json");
        // the dump refuses to overwrite a file
        Files.delete(file);
        var bean = ManagementFactory.getPlatformMXBean(HotSpotDiagnosticMXBean.class);
        bean.dumpThreads(file.toString(), HotSpotDiagnosticMXBean.ThreadDumpFormat.JSON);
        String json = Files.readString(file);
        for (int i = 1; i <= 3; i++) IO.println("order-" + i + " in the dump: " + json.contains("order-" + i));
        gate.countDown();
    }
}`),
      out(`order-1 in the dump: true
order-2 in the dump: true
order-3 in the dump: true`),
      '## JFR: what pinned, and why',
      'JDK Flight Recorder has four virtual-thread events (JEP 444): `jdk.VirtualThreadStart` and `jdk.VirtualThreadEnd` (off by default), `jdk.VirtualThreadPinned` (on, when a pinned thread blocks for 20 ms or more) and `jdk.VirtualThreadSubmitFailed` (on). Since Java 24 the pinned event says why (JEP 491). A program can watch its own events with a `RecordingStream`:',
      jv(`import jdk.jfr.consumer.RecordingStream;

static class Settings {
    static final String VALUE;
    static {
        // blocks in a class initializer: pins
        try { Thread.sleep(200); } catch (InterruptedException e) { }
        VALUE = "loaded";
    }
}

void main() throws Exception {
    var seen = new CountDownLatch(1);
    try (var stream = new RecordingStream()) {
        stream.enable("jdk.VirtualThreadPinned").withThreshold(Duration.ofMillis(10));
        stream.onEvent("jdk.VirtualThreadPinned", event -> {
            IO.println("pinned, because: " + event.getString("pinnedReason"));
            seen.countDown();
        });
        stream.startAsync();
        Thread.ofVirtual().start(() -> IO.println("settings " + Settings.VALUE)).join();
        IO.println("event seen: " + seen.await(5, TimeUnit.SECONDS));
    }
}`),
      out(`settings loaded
pinned, because: VM call to Main$Settings.<clinit> on stack
event seen: true`),
      'In production, record to a file and read it afterwards:',
      txt(`java -XX:StartFlightRecording:filename=recording.jfr -jar service.jar
jfr print --events jdk.VirtualThreadPinned recording.jfr`),
      '## Names make both readable',
      'A dump of 50,000 threads named `""` tells you little. Threads started from a named factory (`Thread.ofVirtual().name("order-", 1).factory()`) say what they were for, in dumps and in log lines.'
    ].join('\n\n'),
    work: [
      '**When a service with virtual threads hangs,** take the new dump, not `jstack`: in a container, `jcmd 1 Thread.dump_to_file -format=json /tmp/threads.json` (the JVM is often process 1), then copy the file out. Count the threads waiting in the same place: thousands parked on the connection pool\'s `getConnection` is the database-pool queue of lesson 6.',
      '**A continuous JFR recording** (`-XX:StartFlightRecording` with a maximum age or size) costs little, and on an incident you dump it and look for `jdk.VirtualThreadPinned` events: their stack trace and reason point at the class initializer or native call that held carriers.'
    ].join('\n\n'),
    example: {
      code: `import com.sun.management.HotSpotDiagnosticMXBean;
import java.lang.management.ManagementFactory;

void main() throws Exception {
    var gate = new CountDownLatch(1);
    try (var executor = Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("checkout-", 1).factory())) {
        for (int i = 0; i < 2; i++) executor.submit(() -> { gate.await(); return null; });
        Thread.sleep(200);
        Path file = Files.createTempFile("threads", ".txt");
        Files.delete(file);
        ManagementFactory.getPlatformMXBean(HotSpotDiagnosticMXBean.class)
            .dumpThreads(file.toString(), HotSpotDiagnosticMXBean.ThreadDumpFormat.TEXT_PLAIN);
        Files.readAllLines(file).stream().filter(line -> line.contains("checkout-") || line.contains("CountDownLatch.await")).forEach(IO::println);
        gate.countDown();
    }
}`,
      note: 'The text format: each virtual thread with its stack, waiting in `CountDownLatch.await`.'
    },
    challenge: {
      title: 'A dump you can search',
      task: 'Two methods to write.\n\n1. `dumpThreads()`: take a JSON thread dump of this JVM with `HotSpotDiagnosticMXBean.dumpThreads` and return the file\'s text. It must work every time it is called (the dump refuses a file that exists, and needs an absolute path).\n2. `countNamed(dump, prefix)`: how many threads in the dump have a name that starts with `prefix`. In the JSON, a thread\'s name appears as `"name": "worker-1"`.\n\nThe checks start virtual threads named `probe-1`, `probe-2` and `probe-3`, waiting on a latch, and look for them in your dump.',
      starter: `import com.sun.management.HotSpotDiagnosticMXBean;
import java.lang.management.ManagementFactory;

String dumpThreads() throws Exception {
    throw new UnsupportedOperationException("Not written yet");
}

int countNamed(String dump, String prefix) {
    throw new UnsupportedOperationException("Not written yet");
}

void main() throws Exception {
    String dump = dumpThreads();
    IO.println("threads named main: " + countNamed(dump, "main"));
}`,
      solution: `import com.sun.management.HotSpotDiagnosticMXBean;
import java.lang.management.ManagementFactory;

String dumpThreads() throws Exception {
    Path file = Files.createTempFile("threads", ".json");
    // the dump must create the file itself
    Files.delete(file);
    try {
        ManagementFactory.getPlatformMXBean(HotSpotDiagnosticMXBean.class)
            .dumpThreads(file.toAbsolutePath().toString(), HotSpotDiagnosticMXBean.ThreadDumpFormat.JSON);
        return Files.readString(file);
    } finally {
        Files.deleteIfExists(file);
    }
}

int countNamed(String dump, String prefix) {
    int count = 0;
    String key = "\\"name\\": \\"" + prefix;
    for (int at = dump.indexOf(key); at >= 0; at = dump.indexOf(key, at + 1)) count++;
    return count;
}

void main() throws Exception {
    String dump = dumpThreads();
    IO.println("threads named main: " + countNamed(dump, "main"));
}`,
      hints: [
        '`Files.createTempFile(…)` gives a fresh name; delete the file straight away, so `dumpThreads` can create it. Delete it again when you have read it.',
        '`ManagementFactory.getPlatformMXBean(HotSpotDiagnosticMXBean.class).dumpThreads(path, HotSpotDiagnosticMXBean.ThreadDumpFormat.JSON)`; then `Files.readString`.',
        'For `countNamed`, count how often `"name": "` followed by the prefix occurs, with `indexOf` in a loop (or a regular expression).'
      ],
      checks: [
        { label: 'dumpThreads returns a JSON thread dump', code: `String dump = c.call("dumpThreads");
c.ok(dump.trim().startsWith("{") && dump.contains("threadDump"), "this is not a JSON thread dump: " + dump.substring(0, Math.min(80, dump.length())));` },
        { label: 'the dump lists virtual threads that are waiting', code: `var gate = new CountDownLatch(1);
try (var executor = Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("probe-", 1).factory())) {
    for (int i = 0; i < 3; i++) executor.submit(() -> { gate.await(); return null; });
    Thread.sleep(200);
    String dump = c.call("dumpThreads");
    gate.countDown();
    for (int i = 1; i <= 3; i++) c.ok(dump.contains("probe-" + i), "probe-" + i + ", a waiting virtual thread, is not in the dump: does it use dumpThreads, not Thread.getAllStackTraces()?");
}` },
        { label: 'countNamed finds the three probe threads', code: `var gate = new CountDownLatch(1);
try (var executor = Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("probe-", 1).factory())) {
    for (int i = 0; i < 3; i++) executor.submit(() -> { gate.await(); return null; });
    Thread.sleep(200);
    String dump = c.call("dumpThreads");
    gate.countDown();
    c.eq(c.call("countNamed", dump, "probe-"), 3);
}` },
        { label: 'countNamed gives 0 for a name nobody has', code: `String dump = c.call("dumpThreads");
c.eq(c.call("countNamed", dump, "nobody-"), 0);` },
        { label: 'a second and a third dump work too', code: `c.call("dumpThreads");
c.call("dumpThreads");
String dump = c.call("dumpThreads");
c.ok(dump.contains("threadDump"), "the third dump failed");` }
      ]
    }
  });
})(window.JCLT);
