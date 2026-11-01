/*
 * data/lessons-threads.js - Track 1, Threads and the memory model: eight lessons (batch 3).
 * The lesson shape is described at the top of data/lessons-virtual-threads.js.
 *
 * A race cannot be shown or checked by running racy code and hoping: measured on this PC, 4 threads x
 * 100,000 unguarded `count++` lost updates in only 2 runs of 5. So the programs here hold the race window
 * open with a latch (both threads read, then both write), and the checks hand your code a Cell, a Stock
 * or a Ledger whose read waits at a Probe rendezvous: racy code then loses the update every run, and
 * correct code (which makes the second thread wait) passes, the rendezvous giving up after 300 ms.
 */
(function (U) {
  'use strict';
  function jv(code) { return '```java\n' + code + '\n```'; }
  function norun(code) { return '```java-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function txt(t) { return '```text\n' + t + '\n```'; }
  var L = U.data.lessons = U.data.lessons || [];

  var SERVICE = { name: 'Service.java', code: `/** A slow service: each call waits for an answer, as a call over the network does. */
public interface Service {
    String fetch(String id) throws InterruptedException;
}
` };
  var CELL = { name: 'Cell.java', code: `/** A number kept somewhere shared (a row, a cache entry): you read it, then write the new value. */
public interface Cell {
    int read() throws InterruptedException;

    void write(int value);
}
` };
  // the check's cell: read() waits (at most 300 ms) for a second reader, so two unguarded calls both read
  // the old value; code that makes the second caller wait gets no second reader, and the wait gives up
  function windowCell(v) {
    return `var p = c.probe(2, 300);
int[] v = {${v}};
Cell cell = new Cell() {
    public int read() throws InterruptedException { int x = v[0]; p.meet(); return x; }
    public void write(int value) { v[0] = value; }
};`;
  }

  /* ---------------------------------------------------------------- 1 */
  L.push({
    id: 'th-basics', track: 'threads', title: 'Threads and their life',
    summary: 'A thread runs a Runnable. start() runs it on the new thread, run() on yours; join() waits for it. Every thread is in one of six states, and an exception ends only its own thread.',
    keywords: ['thread', 'Runnable', 'start', 'run', 'join', 'thread states', 'NEW', 'RUNNABLE', 'BLOCKED', 'WAITING', 'TIMED_WAITING', 'TERMINATED', 'daemon', 'uncaught exception', 'Thread.ofPlatform'],
    docs: 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Thread.html', docsLabel: 'Java 25 API: Thread', lab: '16-java-multithreading',
    body: [
      '## A thread runs a task',
      'A **thread** is a path of execution with its own stack. You give it a task, a `Runnable` (a method that takes nothing and returns nothing), and start it. The classic way is `new Thread(task)`; since Java 21 a builder says what kind of thread you want.',
      jv(`void main() throws InterruptedException {
    Runnable task = () -> IO.println("running on " + Thread.currentThread().getName());
    Thread classic = new Thread(task, "classic");
    classic.start();
    classic.join();
    Thread built = Thread.ofPlatform().name("built").start(task);
    built.join();
}`),
      out(`running on classic
running on built`),
      '`start()` creates the new thread and returns at once; the task then runs on it. `join()` waits until the thread has ended. Without the `join`, `main` might print its next line first, or end before the thread runs.',
      '## start() or run()',
      '`run()` is just the task\'s method: calling it yourself runs the task **on your own thread**, with no new thread at all. A thread can be started only once.',
      jv(`void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().name("worker").unstarted(() -> IO.println("on " + Thread.currentThread().getName()));
    t.run();
    t.start();
    t.join();
    try {
        t.start();
    } catch (IllegalThreadStateException e) {
        IO.println("start() twice: " + e.getClass().getSimpleName());
    }
}`),
      out(`on main
on worker
start() twice: IllegalThreadStateException`),
      '## The six states',
      'A thread is always in one of the states of `Thread.State`. You see them in every thread dump:',
      jv(`void awaitState(Thread t, Thread.State s) throws InterruptedException {
    for (int i = 0; i < 400 && t.getState() != s; i++) Thread.sleep(5);
    IO.println(t.getName() + ": " + t.getState());
}

void main() throws InterruptedException {
    Object lock = new Object();
    Thread sleeper = Thread.ofPlatform().name("sleeper").unstarted(() -> {
        try { Thread.sleep(2_000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    });
    IO.println("sleeper: " + sleeper.getState());
    sleeper.start();
    awaitState(sleeper, Thread.State.TIMED_WAITING);
    Thread joiner = Thread.ofPlatform().name("joiner").start(() -> {
        try { sleeper.join(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    });
    awaitState(joiner, Thread.State.WAITING);
    Thread blocked;
    synchronized (lock) {
        blocked = Thread.ofPlatform().name("blocked").start(() -> { synchronized (lock) { } });
        awaitState(blocked, Thread.State.BLOCKED);
    }
    Thread spinner = Thread.ofPlatform().name("spinner").start(() -> {
        while (!Thread.currentThread().isInterrupted()) { }
    });
    awaitState(spinner, Thread.State.RUNNABLE);
    spinner.interrupt();
    sleeper.interrupt();
    for (Thread t : List.of(sleeper, joiner, blocked, spinner)) t.join();
    IO.println("sleeper: " + sleeper.getState());
}`),
      out(`sleeper: NEW
sleeper: TIMED_WAITING
joiner: WAITING
blocked: BLOCKED
spinner: RUNNABLE
sleeper: TERMINATED`),
      '| State | The thread is… | Caused by |\n|---|---|---|\n| `NEW` | made, not started | `unstarted(…)`, `new Thread(…)` |\n| `RUNNABLE` | running, or ready to run | computing; also blocking file and socket I/O |\n| `BLOCKED` | waiting to enter a monitor | `synchronized` held by another thread |\n| `WAITING` | waiting with no time limit | `join()`, `wait()`, a lock or a queue (`park`) |\n| `TIMED_WAITING` | waiting with a time limit | `sleep`, `join(ms)`, `wait(ms)`, `poll(timeout)` |\n| `TERMINATED` | ended | its task returned or threw |',
      '## Daemon threads and the end of a program',
      'The JVM ends when the only threads left are **daemon** threads. A platform thread is not a daemon unless you say so (it copies its creator\'s setting, and `main` is not one); a virtual thread always is. A daemon thread suits background work that may stop at any moment.',
      jv(`void main() throws InterruptedException {
    Thread ticker = Thread.ofPlatform().name("ticker").daemon(true).start(() -> IO.println("tick"));
    ticker.join();
    Thread worker = Thread.ofPlatform().unstarted(() -> { });
    IO.println("ticker daemon: " + ticker.isDaemon() + ", worker daemon: " + worker.isDaemon());
}`),
      out(`tick
ticker daemon: true, worker daemon: false`),
      '## When a thread throws',
      'An exception that escapes a task ends **its own thread only**. It does not reach the thread that started it: the default handler prints the stack trace to `System.err`, and the program goes on. To hear about it, give the thread an uncaught-exception handler (or use an executor, whose `Future` keeps the exception for you, lesson [[lesson:juc-futures]]).',
      jv(`void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().name("importer")
        .uncaughtExceptionHandler((th, e) -> IO.println(th.getName() + " died: " + e.getMessage()))
        .start(() -> { throw new IllegalStateException("bad row 17"); });
    t.join();
    IO.println("main goes on; importer is " + t.getState());
}`),
      out(`importer died: bad row 17
main goes on; importer is TERMINATED`)
    ].join('\n\n'),
    work: [
      '**Every thread dump is these six states.** Tomcat\'s request threads (`http-nio-8080-exec-1`…) sit `WAITING` on their pool\'s queue when idle and `RUNNABLE` while they serve; a pile of them `BLOCKED` on the same monitor is lock contention ([[lesson:th-synchronized]]); a pile `WAITING` in a connection pool is a pool too small for the load ([[lesson:vt-limit]]). Name the threads you make, so a dump says whose they are.',
      '**A background job that dies quietly.** A thread started by hand whose task throws is gone, with one stack trace in a log nobody reads. Spring\'s `@Scheduled` methods run on a scheduler with **one thread** by default (Spring Boot 4.1.2 reference): one slow job delays all the others. Give background work an executor, so failures land in a `Future` or an error handler, and a name.',
      '**Do not start threads in a request.** A thread per request made by hand is not bounded, not named, not waited for and not stopped at shutdown. Hand the work to an executor the container manages ([[lesson:juc-executors]]).'
    ].join('\n\n'),
    example: {
      code: `// Start three named threads, and wait for all of them. Then remove the joins: what changes?
void main() throws InterruptedException {
    List<Thread> threads = new ArrayList<>();
    var builder = Thread.ofPlatform().name("worker-", 1);
    for (int i = 0; i < 3; i++) {
        threads.add(builder.start(() -> IO.println(Thread.currentThread().getName() + " is " + Thread.currentThread().getState())));
    }
    for (Thread t : threads) t.join();
    IO.println("all " + threads.size() + " are " + threads.get(0).getState());
}`,
      note: 'The three lines print in any order: nothing makes one thread go before another.'
    },
    challenge: {
      title: 'A thread for each job',
      task: 'Write `runAll(jobs, service)`: call `service.fetch(job)` for every job, **each on a platform thread of its own, all at the same time**, named `job-0`, `job-1`… in the order of the jobs. Wait for every thread, then return the answers in the order of the jobs.\n\nThe checks hand you a service whose calls wait for each other, and one that records which thread made each call.',
      files: [SERVICE],
      starter: `// Call service.fetch(job) for every job, each on a platform thread of its own named job-0, job-1...
// Return the answers in the order of the jobs, once every thread has finished.
List<String> runAll(List<String> jobs, Service service) throws InterruptedException {
    List<String> answers = new ArrayList<>();
    for (String job : jobs) {
        // on this thread, one after another
        answers.add(service.fetch(job));
    }
    return answers;
}

void main() throws InterruptedException {
    IO.println(runAll(List.of("a", "b"), id -> "answer " + id));
}`,
      solution: `List<String> runAll(List<String> jobs, Service service) throws InterruptedException {
    String[] answers = new String[jobs.size()];
    List<Thread> threads = new ArrayList<>();
    var builder = Thread.ofPlatform().name("job-", 0);
    for (int i = 0; i < jobs.size(); i++) {
        int k = i;
        threads.add(builder.start(() -> {
            try {
                answers[k] = service.fetch(jobs.get(k));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }));
    }
    for (Thread t : threads) t.join();
    return List.of(answers);
}

void main() throws InterruptedException {
    IO.println(runAll(List.of("a", "b"), id -> "answer " + id));
}`,
      hints: [
        '`Thread.ofPlatform().name("job-", 0)` is a builder whose threads are named `job-0`, `job-1`… in the order you start them. `builder.start(task)` starts one.',
        'Keep each answer in an array at the job\'s index, and every `Thread` in a list. A lambda can use `i` only through a copy: `int k = i;`.',
        'Start them all first, then `join()` each. `join()` also makes what the thread wrote into the array visible to you.'
      ],
      checks: [
        { label: 'returns the answers in the order of the jobs', code: `c.eq(c.call("runAll", List.of("x", "y", "z"), (Service) id -> id.toUpperCase()), List.of("X", "Y", "Z"));` },
        { label: 'the four calls are in flight at the same time', code: `var p = c.probe(4);
c.call("runAll", List.of("a", "b", "c", "d"), (Service) id -> { p.meet(); return id; });
c.ok(p.met(), "at most " + p.peak() + " of the 4 calls were in flight at once: they ran one after another");` },
        { label: 'each call runs on a platform thread, not the caller\'s', code: `var callers = ConcurrentHashMap.<String>newKeySet();
var p = c.probe(3);
c.call("runAll", List.of("a", "b", "c"), (Service) id -> { callers.add(Thread.currentThread().getName()); p.meet(); return id; });
c.ok(p.platformCalls() == 3, p.virtualCalls() + " of the 3 calls ran on a virtual thread: use Thread.ofPlatform()");
c.ok(!callers.contains(Thread.currentThread().getName()), "a call ran on the caller's own thread: start() the threads, do not run() them");` },
        { label: 'the threads are named job-0, job-1, job-2, in the order of the jobs', code: `var names = new ConcurrentHashMap<String, String>();
c.call("runAll", List.of("a", "b", "c"), (Service) id -> { names.put(id, Thread.currentThread().getName()); return id; });
c.eq(new TreeMap<>(names), new TreeMap<>(Map.of("a", "job-0", "b", "job-1", "c", "job-2")));` },
        { label: 'runAll returns only when every call has finished', code: `var p = c.probe(3);
c.call("runAll", List.of("a", "b", "c"), (Service) id -> { p.sleep(100); return id; });
c.ok(p.finished() == 3, "only " + p.finished() + " of the 3 calls had finished when runAll returned: join() every thread");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'th-races', track: 'threads', title: 'Races and atomicity',
    summary: 'count++ is three steps, and two threads can interleave them: an update is lost. Check-then-act has the same flaw. A test that passes proves nothing; making the steps atomic does.',
    keywords: ['race condition', 'data race', 'lost update', 'atomicity', 'read-modify-write', 'check-then-act', 'count++', 'critical section', 'synchronized', 'AtomicInteger', 'thread safety', 'oversell'],
    docs: 'https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html', docsLabel: 'JLS 17: Threads and Locks', lab: '16-java-multithreading',
    body: [
      '## Two threads, one counter',
      '`count++` looks like one step. It is three: **read** `count`, **add** one, **write** it back. If two threads both read before either writes, both write the same number, and one increment is lost. This program holds the window open on purpose, with a latch, so it happens every run:',
      jv(`int count = 0;

void main() throws InterruptedException {
    var bothRead = new CountDownLatch(2);
    Runnable increment = () -> {
        // 1. read
        int seen = count;
        bothRead.countDown();
        try { bothRead.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
        // 2. add, and 3. write
        count = seen + 1;
    };
    Thread a = Thread.ofPlatform().start(increment);
    Thread b = Thread.ofPlatform().start(increment);
    a.join();
    b.join();
    IO.println("two increments, count = " + count);
}`),
      out('two increments, count = 1'),
      'This is a **race condition**: the result depends on how the threads happen to interleave. A **data race** is the narrower thing the memory model defines: two threads touch the same variable, at least one writes, and nothing orders them (no lock, no `volatile`; lesson [[lesson:th-visibility]]).',
      '## Why a passing test proves nothing',
      'Without the latch the window is a few nanoseconds wide. Four threads each adding 100,000:',
      jv(`void main() throws InterruptedException {
    for (int run = 1; run <= 5; run++) {
        int[] count = {0};
        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            threads.add(Thread.ofPlatform().start(() -> { for (int k = 0; k < 100_000; k++) count[0]++; }));
        }
        for (Thread t : threads) t.join();
        IO.println("run " + run + ": " + count[0] + (count[0] == 400_000 ? "" : ", lost " + (400_000 - count[0])));
    }
}`),
      'Measured on this PC (16 cores, 1 Nov 2026): runs 1 and 2 lost 163,692 and 53,653 updates; runs 3 to 5 printed exactly 400,000. Once the JIT had compiled the loop, each thread added in a register and wrote back once, so the race was still there but no longer showed. **A race test that passes has proved nothing.** That is why this tool\'s checks hold the window open instead of hoping, as the latch did above.',
      '## Check, then act',
      'The second classic race: look at the state, then act on what you saw, when another thread can change it in between. The last item in stock, sold twice:',
      jv(`int stock = 1;

void main() throws InterruptedException {
    var bothChecked = new CountDownLatch(2);
    List<String> sold = Collections.synchronizedList(new ArrayList<>());
    Runnable buy = () -> {
        int seen = stock;
        if (seen > 0) {
            bothChecked.countDown();
            try { bothChecked.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
            stock = seen - 1;
            sold.add("sold");
        }
    };
    Thread a = Thread.ofPlatform().start(buy);
    Thread b = Thread.ofPlatform().start(buy);
    a.join();
    b.join();
    IO.println("sold " + sold.size() + " of 1, stock now " + stock);
}`),
      out('sold 2 of 1, stock now 0'),
      '| Shape | Example | Fix |\n|---|---|---|\n| Read-modify-write | `count++`, `total += x`, `map.put(k, map.get(k) + 1)` | one atomic step: a lock, `AtomicInteger`, `map.merge` |\n| Check-then-act | `if (stock > 0) stock--`, `if (!map.containsKey(k)) map.put(k, v)` | check and act under one lock, or one atomic call (`computeIfAbsent`, a CAS) |\n| Lazy initialisation | `if (instance == null) instance = new …` | the holder idiom, `volatile` double-checked locking, `StableValue` |',
      '## Making it atomic',
      'An action is **atomic** when no other thread can see it half done. Two ways for a counter: put the three steps in a `synchronized` method, so only one thread at a time runs it (lesson [[lesson:th-synchronized]]), or use an `AtomicInteger`, whose `incrementAndGet` is one indivisible step done by the processor (lesson [[lesson:juc-atomics]]).',
      jv(`class Counter {
    private int count;
    synchronized void increment() { count++; }
    synchronized int get() { return count; }
}

void main() {
    var counter = new Counter();
    var atomic = new AtomicInteger();
    try (var executor = Executors.newFixedThreadPool(4)) {
        for (int i = 0; i < 4; i++) {
            executor.submit(() -> {
                for (int k = 0; k < 100_000; k++) {
                    counter.increment();
                    atomic.incrementAndGet();
                }
            });
        }
    }
    IO.println("synchronized: " + counter.get() + ", AtomicInteger: " + atomic.get());
}`),
      out('synchronized: 400000, AtomicInteger: 400000')
    ].join('\n\n'),
    work: [
      '**A Spring bean is one object shared by every request.** Beans are singletons by default, so a field in a `@Service` or `@Controller` is shared state, read and written by every request thread at once: a `private int requests`, a `HashMap` used as a cache, a `SimpleDateFormat`. Keep beans stateless (state in local variables and parameters), or make the shared state thread-safe on purpose.',
      '**The oversell is a check-then-act across the database.** `SELECT stock` then `UPDATE … SET stock = ?` from two instances sells the last item twice, however the Java is locked. Make the database do one atomic step (`UPDATE item SET stock = stock - 1 WHERE id = ? AND stock > 0`, then look at the row count), or use optimistic locking (`@Version` in JPA: the second writer fails and retries). See the Learning lab [[lab:10-optimistic-vs-pessimistic-locking]].',
      '**Tests miss races, as above.** Load tests and production find them, at the worst moment. Reason about every shared variable: who writes it, and what orders those writes.'
    ].join('\n\n'),
    example: {
      code: `// Remove the latch: how often does the update still get lost? Then put the two steps in a synchronized method.
int count = 0;

void main() throws InterruptedException {
    var bothRead = new CountDownLatch(2);
    Runnable increment = () -> {
        int seen = count;
        bothRead.countDown();
        try { bothRead.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
        count = seen + 1;
    };
    Thread a = Thread.ofPlatform().start(increment);
    Thread b = Thread.ofPlatform().start(increment);
    a.join();
    b.join();
    IO.println("count = " + count);
}`,
      note: 'With a synchronized method the latch would wait for ever: the second thread cannot get in until the first has finished. That is the point of the lock.'
    },
    challenge: {
      title: 'A counter and a stock that survive two threads',
      task: 'Two methods, both called by many threads at once on the same object. The `Cell` is a number kept somewhere shared: `read()` it, then `write()` the new value.\n\n1. `increment(cell)`: add one to the cell.\n2. `reserve(stock)`: if the stock is above zero, take one and return `true`; otherwise return `false` and change nothing.\n\nThe checks hand you a cell whose `read()` waits for a second thread to read too, if one can: unguarded code then loses the update every time.',
      files: [CELL],
      starter: `// Add one to the cell. Many threads call this at once.
void increment(Cell cell) throws InterruptedException {
    cell.write(cell.read() + 1);
}

// If the stock is above zero, take one and return true; otherwise return false. Many threads call this at once.
boolean reserve(Cell stock) throws InterruptedException {
    int left = stock.read();
    if (left <= 0) return false;
    stock.write(left - 1);
    return true;
}

void main() {
}`,
      solution: `synchronized void increment(Cell cell) throws InterruptedException {
    cell.write(cell.read() + 1);
}

synchronized boolean reserve(Cell stock) throws InterruptedException {
    int left = stock.read();
    if (left <= 0) return false;
    stock.write(left - 1);
    return true;
}

void main() {
}`,
      hints: [
        'Each method reads and then writes. Another thread must not get between the read and the write: make the two steps one critical section.',
        'A `synchronized` method lets one thread at a time run it on the same object. The checks call both methods on one object, so `synchronized` on each method is enough.',
        'A lock made inside the method (`synchronized (new Object())`) protects nothing: every call gets its own.'
      ],
      checks: [
        { label: 'increment adds one', code: `int[] v = {41};
Cell cell = new Cell() { public int read() { return v[0]; } public void write(int value) { v[0] = value; } };
c.call("increment", cell);
c.eq(v[0], 42);` },
        { label: 'two increments at once, with the race window held open, add two', code: windowCell(0) + `
try (var ex = Executors.newFixedThreadPool(2)) {
    var a = ex.submit(c.callable("increment", cell));
    var b = ex.submit(c.callable("increment", cell));
    a.get();
    b.get();
}
c.ok(v[0] == 2, "two increments gave " + v[0] + ": both threads read the old value before either wrote, so an update was lost");` },
        { label: 'reserve takes one while there is stock, and refuses at zero', code: `int[] v = {1};
Cell stock = new Cell() { public int read() { return v[0]; } public void write(int value) { v[0] = value; } };
c.eq(c.call("reserve", stock), true);
c.eq(c.call("reserve", stock), false);
c.eq(v[0], 0);` },
        { label: 'two buyers for the last item at once: exactly one gets it', code: windowCell(1) + `
boolean x, y;
try (var ex = Executors.newFixedThreadPool(2)) {
    var a = ex.submit(c.<Boolean>callable("reserve", cell));
    var b = ex.submit(c.<Boolean>callable("reserve", cell));
    x = a.get();
    y = b.get();
}
c.ok(x != y, (x && y ? "both buyers got the last item" : "neither buyer got it") + " (stock now " + v[0] + "): check and take must be one step");
c.eq(v[0], 0);` },
        { label: '8 threads x 1,000 increments add 8,000', code: `int[] v = {0};
Cell cell = new Cell() { public int read() { return v[0]; } public void write(int value) { v[0] = value; } };
try (var ex = Executors.newFixedThreadPool(8)) {
    for (int t = 0; t < 8; t++) ex.submit(c.task(() -> { for (int i = 0; i < 1_000; i++) c.call("increment", cell); }));
}
c.eq(v[0], 8_000);` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'th-visibility', track: 'threads', title: 'Visibility, volatile and happens-before',
    summary: 'Without a rule that orders them, one thread may never see another\'s write: a flag set to true can stay false for ever. The memory model\'s happens-before rules, and volatile, say when a write is seen.',
    keywords: ['visibility', 'volatile', 'happens-before', 'java memory model', 'jmm', 'memory model', 'stale value', 'reordering', 'JIT hoisting', 'flag', 'publication', 'jsr 133'],
    docs: 'https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.4', docsLabel: 'JLS 17.4: the Java Memory Model', lab: '17-java-memory-model',
    body: [
      '## A write that is never seen',
      'One thread waits for a flag; another sets it. The field is a plain `boolean`:',
      jv(`static boolean ready = false;

void main() throws InterruptedException {
    Thread reader = Thread.ofPlatform().daemon(true).start(() -> {
        while (!ready) { }
    });
    Thread.sleep(200);
    ready = true;
    reader.join(1_000);
    IO.println("still spinning a second after ready = true: " + reader.isAlive());
}`),
      'On this PC it printed `true` in **12 runs of 12**: the reader never saw the write. The JIT compiler saw a loop that does not change `ready` and read it once, before the loop. That is allowed. Java promises that one thread sees another\'s writes only when a **happens-before** rule connects them; without one, the reader may see an old value for ever.',
      '## The happens-before rules',
      'The Java Memory Model (JLS chapter 17) defines **happens-before**: if action A happens-before action B, then B sees everything A did, and everything done before A. The rules you use every day:',
      '| A | happens-before B |\n|---|---|\n| an action in a thread | every later action in the same thread (program order) |\n| releasing a monitor (end of `synchronized`) | the next acquiring of the same monitor |\n| a write to a `volatile` field | every later read of that field |\n| `thread.start()` | everything the started thread does |\n| everything a thread does | another thread\'s `join()` on it returning |\n| `executor.submit(task)`, `queue.put(x)` | the task running, the `take()` that gets x |\n| a task finishing | `future.get()` returning its result |\n| the end of a constructor | another thread\'s read of a `final` field it set |',
      'And it is **transitive**: if A happens-before B and B happens-before C, then A happens-before C. That is what makes a flag carry other data with it.',
      '## volatile',
      'A `volatile` field is read fresh every time, and a write to it happens-before every later read of it. The same program with one word added:',
      jv(`static volatile boolean ready = false;

void main() throws InterruptedException {
    Thread reader = Thread.ofPlatform().daemon(true).start(() -> {
        while (!ready) { }
    });
    Thread.sleep(200);
    ready = true;
    reader.join(1_000);
    IO.println("still spinning a second after ready = true: " + reader.isAlive());
}`),
      out('still spinning a second after ready = true: false'),
      'Because of transitivity, what the writer did **before** the volatile write is visible to a reader that saw it. A plain field published by a volatile flag:',
      jv(`static int data;
static volatile boolean ready;

void main() throws InterruptedException {
    Thread reader = Thread.ofPlatform().start(() -> {
        while (!ready) Thread.onSpinWait();
        IO.println("data seen after ready: " + data);
    });
    data = 42;
    ready = true;
    reader.join();
}`),
      out('data seen after ready: 42'),
      '`data = 42` happens-before `ready = true` (program order), which happens-before the read that saw `true` (volatile), which happens-before reading `data` (program order). Swap the two writes and the guarantee is gone.',
      '## start and join',
      'The edges you use without noticing: what a thread wrote before `start()` is visible inside the new thread, and what the thread wrote is visible after `join()` returns.',
      jv(`int[] box = new int[1];

void main() throws InterruptedException {
    box[0] = 1;
    Thread t = Thread.ofPlatform().start(() -> {
        IO.println("the thread sees what main wrote before start(): " + box[0]);
        box[0] = 2;
    });
    t.join();
    IO.println("main sees what the thread wrote, after join(): " + box[0]);
}`),
      out(`the thread sees what main wrote before start(): 1
main sees what the thread wrote, after join(): 2`),
      '## What volatile does not do',
      '`volatile` makes each read and each write visible. It does **not** make `count++` atomic: the read and the write are still two steps ([[lesson:th-races]]). Use it for a flag, or for a reference to an immutable object that one thread replaces and others read; for anything read-modify-write, a lock or an atomic. The ⚠ in an editor margin catches `++` on a volatile.',
      '[[explain:lost-update|The lost-update explainer]] steps through a lost update and these edges with a picture of each thread\'s view of memory.'
    ].join('\n\n'),
    work: [
      '**The loop that will not stop at shutdown.** A message consumer runs `while (running) { poll(); handle(); }` on its own thread, and `@PreDestroy` (or a shutdown hook) sets `running = false`. Without `volatile`, the loop may never see it, and the service hangs on shutdown until it is killed. Make the flag `volatile`, or stop the loop with an interrupt ([[lesson:th-interrupts]]).',
      '**Configuration that is swapped while running.** A refresher thread builds a new immutable config object and assigns it to a field that request threads read. Make that field `volatile` (or an `AtomicReference`): readers then see either the old config or the new one, complete ([[lesson:th-publication]]).',
      '**You rarely write `volatile` in application code**, because the tools you use already give the edges: a `ConcurrentHashMap` put happens-before the get that sees it, a `BlockingQueue` put before the take, `submit` before the task runs, `Future.get()` after it ends. Knowing that is knowing why they are safe.'
    ].join('\n\n'),
    example: {
      code: `// Take volatile off ready, and run it a few times: does the reader still see data = 42?
static int data;
static volatile boolean ready;

void main() throws InterruptedException {
    Thread reader = Thread.ofPlatform().daemon(true).start(() -> {
        while (!ready) { }
        IO.println("data seen after ready: " + data);
    });
    Thread.sleep(100);
    data = 42;
    ready = true;
    reader.join(1_000);
    IO.println("reader finished: " + !reader.isAlive());
}`,
      note: 'Without volatile the reader usually never finishes here: the JIT reads the flag once. The rule, not the run, is what you can rely on.'
    },
    challenge: {
      title: 'A worker you can stop',
      task: 'Two methods for a background worker:\n\n1. `startWorker(work)`: start a **daemon** platform thread that calls `work.tick()` over and over while a flag says the worker is running, and return the thread.\n2. `stopWorker(worker)`: tell the worker to stop, and return only once it has ended.\n\nThe flag is written by one thread and read by another: make sure the worker is certain to see the change. A stopped worker can be started again.',
      files: [{ name: 'Work.java', code: `/** One step of a background job. */
public interface Work {
    void tick() throws InterruptedException;
}
` }],
      starter: `boolean running;

// Start a daemon platform thread that calls work.tick() while running is true. Return the thread.
Thread startWorker(Work work) {
    throw new UnsupportedOperationException("Not written yet");
}

// Make the worker stop, and return only when it has ended.
void stopWorker(Thread worker) throws InterruptedException {
    running = false;
}

void main() {
}`,
      solution: `volatile boolean running;

Thread startWorker(Work work) {
    running = true;
    return Thread.ofPlatform().daemon(true).start(() -> {
        try {
            while (running) work.tick();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
}

void stopWorker(Thread worker) throws InterruptedException {
    running = false;
    worker.join();
}

void main() {
}`,
      hints: [
        'The flag is written by the thread that calls `stopWorker` and read by the worker: a plain field may never be seen to change. One word on its declaration fixes that.',
        '`Thread.ofPlatform().daemon(true).start(task)` starts a daemon platform thread. Set the flag to `true` before you start it, so a worker started again after a stop runs.',
        '`stopWorker` clears the flag, then `join()`s the worker, which returns once the worker\'s loop has seen the flag and ended.'
      ],
      checks: [
        { label: 'the worker calls tick() over and over', code: `var ticks = new AtomicInteger();
Thread t = c.call("startWorker", (Work) () -> { ticks.incrementAndGet(); Thread.sleep(5); });
for (int i = 0; i < 300 && ticks.get() < 3; i++) Thread.sleep(10);
c.ok(ticks.get() >= 3, "tick() was called " + ticks.get() + " times: start the thread, and set the flag to true before it starts");
c.call("stopWorker", t);` },
        { label: 'stopWorker returns only once the worker has ended', code: `Thread t = c.call("startWorker", (Work) () -> Thread.sleep(100));
Thread.sleep(50);
c.call("stopWorker", t);
c.ok(!t.isAlive(), "the worker was still running when stopWorker returned: wait for it with join()");` },
        { label: 'the flag is volatile, so the worker is sure to see it change', code: `c.ok(c.uses("volatile[ ]+boolean"), "the flag is a plain boolean: another thread may never see it change (the JIT can read it once, before the loop)");` },
        { label: 'the worker is a daemon thread', code: `Thread t = c.call("startWorker", (Work) () -> Thread.sleep(5));
c.ok(t.isDaemon(), "the worker is not a daemon: a forgotten one keeps the program running");
c.call("stopWorker", t);` },
        { label: 'a stopped worker can be started again', code: `var ticks = new AtomicInteger();
Work work = () -> { ticks.incrementAndGet(); Thread.sleep(5); };
c.call("stopWorker", (Thread) c.call("startWorker", work));
int before = ticks.get();
Thread again = c.call("startWorker", work);
for (int i = 0; i < 300 && ticks.get() <= before; i++) Thread.sleep(10);
c.ok(ticks.get() > before, "the second worker never ticked: startWorker must set the flag to true again");
c.call("stopWorker", again);` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'th-synchronized', track: 'threads', title: 'synchronized and monitors',
    summary: 'Every object has a monitor: synchronized lets one thread at a time hold it. What matters is which object you lock: one lock for all the state it guards, never a new one per call, and a short critical section.',
    keywords: ['synchronized', 'monitor', 'intrinsic lock', 'mutual exclusion', 'critical section', 'reentrant', 'reentrancy', 'lock object', 'BLOCKED', 'contention', 'synchronizedList', 'compound action', 'guarded by'],
    docs: 'https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.1', docsLabel: 'JLS 17.1: Synchronization', lab: '16-java-multithreading',
    body: [
      '## One thread at a time',
      'Every Java object has a **monitor** (an intrinsic lock). `synchronized (obj) { … }` takes `obj`\'s monitor, runs the block, and releases it, even if the block throws. While one thread holds it, any other thread that wants it waits, in state `BLOCKED`. A `synchronized` method locks `this`; a `static synchronized` one locks the class.',
      jv(`class Account {
    private int balance;
    synchronized void deposit(int amount) { balance += amount; }
    synchronized int balance() { return balance; }
}

void main() throws InterruptedException {
    var account = new Account();
    Thread a = Thread.ofPlatform().start(() -> { for (int i = 0; i < 100_000; i++) account.deposit(1); });
    Thread b = Thread.ofPlatform().start(() -> { for (int i = 0; i < 100_000; i++) account.deposit(1); });
    a.join();
    b.join();
    IO.println("balance: " + account.balance());
}`),
      out('balance: 200000'),
      'A lock does two things: **mutual exclusion** (one thread in the block at a time) and **visibility** (releasing a monitor happens-before the next acquiring of it, [[lesson:th-visibility]]). That is why `balance()` is `synchronized` too: a reader that skipped the lock could see an old value.',
      '## The question that matters: which object?',
      'A lock protects only against threads that take **the same** lock. Each thread locking an object of its own is no lock at all:',
      jv(`static int count;

void main() throws InterruptedException {
    var bothInside = new CountDownLatch(2);
    Runnable increment = () -> {
        Object myLock = new Object();
        synchronized (myLock) {
            int seen = count;
            bothInside.countDown();
            try { bothInside.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
            count = seen + 1;
        }
    };
    Thread a = Thread.ofPlatform().start(increment);
    Thread b = Thread.ofPlatform().start(increment);
    a.join();
    b.join();
    IO.println("both threads were inside at once, count = " + count);
}`),
      out('both threads were inside at once, count = 1'),
      '| Written | Locks | Watch out for |\n|---|---|---|\n| `synchronized void m()` | `this` | other code can lock your object too |\n| `static synchronized void m()` | the class object | one lock for all instances |\n| `synchronized (lock)` with `private final Object lock` | an object only you can reach | the safest choice for a library |\n| `synchronized (new Object())` | a new object each time | protects nothing |\n| `synchronized ("orders")` | an interned string, shared by the whole JVM | other code locking the same literal |',
      'One more thing peculiar to this tool: the class of a compact source file has no name you can write, so `synchronized (Main.class)` does not compile there (`cannot find symbol: class Main`, measured). A `private static final Object LOCK = new Object();` works everywhere.',
      '## Reentrant',
      'A thread may take a monitor it already holds; it is released when the outermost block ends. So a synchronized method can call another one on the same object:',
      jv(`class Counter {
    private int n;
    synchronized void inc() { n++; }
    synchronized void twice() { inc(); inc(); }
    synchronized int get() { return n; }
}

void main() {
    var c = new Counter();
    c.twice();
    IO.println("reentrant: " + c.get());
    synchronized (c) {
        IO.println("holding it: " + Thread.holdsLock(c));
    }
    IO.println("after the block: " + Thread.holdsLock(c));
}`),
      out(`reentrant: 2
holding it: true
after the block: false`),
      '## Each call atomic is not enough',
      '`Collections.synchronizedList` makes every method of the list synchronized. Two calls in a row still form a check-then-act that another thread can split:',
      jv(`void main() throws InterruptedException {
    List<String> tags = Collections.synchronizedList(new ArrayList<>());
    var bothChecked = new CountDownLatch(2);
    Runnable addOnce = () -> {
        if (!tags.contains("urgent")) {
            bothChecked.countDown();
            try { bothChecked.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
            tags.add("urgent");
        }
    };
    Thread a = Thread.ofPlatform().start(addOnce);
    Thread b = Thread.ofPlatform().start(addOnce);
    a.join();
    b.join();
    IO.println(tags);
}`),
      out('[urgent, urgent]'),
      'The fix is to hold the list\'s own lock around both calls, `synchronized (tags) { if (!tags.contains(t)) tags.add(t); }`, which is also how you must iterate such a list. Or use a collection whose one call does both: `ConcurrentHashMap.newKeySet().add(t)` ([[lesson:juc-collections]]).',
      '## Keep the critical section short',
      'Every thread that wants the lock waits while you hold it. Do the in-memory update inside the lock and everything slow (a database call, an HTTP call, a log line, `Thread.sleep`) outside it. The ⚠ in the margin flags a `sleep` inside `synchronized`. Since Java 24 a virtual thread that blocks inside `synchronized` no longer pins its carrier ([[lesson:vt-pinning]]), but the other threads still wait for the lock.'
    ].join('\n\n'),
    work: [
      '**The thread dump of a slow service.** Forty request threads `BLOCKED`, all "waiting to lock" the same object, and one thread holding it while it calls another service. That is a `synchronized` method on a singleton bean around an I/O call: every request now runs one at a time. Move the call out of the lock, or lock per key (a `ConcurrentHashMap` of locks, or `compute` on the key).',
      '**Old thread-safe classes do it for you, slowly.** `Hashtable`, `Vector`, `StringBuffer` and `Collections.synchronized…` lock on every call, and still need an outer lock for check-then-act and for iterating. Prefer `ConcurrentHashMap` and immutable values.',
      '**Locks do not cross JVMs.** `synchronized` keeps two threads of one instance apart; with three instances behind a load balancer, three threads still run the block at once. Across instances you need the database (a row lock, `SELECT … FOR UPDATE`, a unique constraint) or a distributed lock; see the Learning lab [[lab:43-distributed-locking]].'
    ].join('\n\n'),
    example: {
      code: `// Remove synchronized from deposit: how far off is the balance? Then lock a private lock object instead of this.
class Account {
    private int balance;
    synchronized void deposit(int amount) { balance += amount; }
    synchronized int balance() { return balance; }
}

void main() throws InterruptedException {
    var account = new Account();
    List<Thread> threads = new ArrayList<>();
    for (int t = 0; t < 4; t++) {
        threads.add(Thread.ofPlatform().start(() -> { for (int i = 0; i < 250_000; i++) account.deposit(1); }));
    }
    for (Thread t : threads) t.join();
    IO.println("balance: " + account.balance() + " (expected 1000000)");
}`
    },
    challenge: {
      title: 'One lock for one balance',
      task: 'Write the methods of an account kept in this file: a `balance` field changed by `deposit` and `withdraw`, which also write an entry to a `Ledger` (as a real account writes to an audit log). Many threads call them at once.\n\n1. `deposit(ledger, amount)`: add the amount and record it.\n2. `withdraw(ledger, amount)`: if the balance is too small throw `IllegalStateException` and change nothing; otherwise take it off and record it.\n3. `depositTwice(ledger, amount)`: deposit the amount twice, as one action no other call can split (it calls `deposit`).\n4. `balance()`.\n\nThe balance and its ledger entry must change together: no two of these calls may ever be inside at the same time.\n\nOne requirement no check can prove: that no other call gets between `depositTwice`\'s two deposits. A thread that releases a monitor usually takes it straight back, so the interleaving cannot be forced; it is yours to make impossible.',
      files: [{ name: 'Ledger.java', code: `/** Where an account writes each change: an audit log, as a real account has. */
public interface Ledger {
    void record(String entry) throws InterruptedException;
}
` }],
      starter: `private int balance;

void deposit(Ledger ledger, int amount) throws InterruptedException {
    balance += amount;
    ledger.record("deposit " + amount);
}

void withdraw(Ledger ledger, int amount) throws InterruptedException {
    throw new UnsupportedOperationException("Not written yet");
}

void depositTwice(Ledger ledger, int amount) throws InterruptedException {
    deposit(ledger, amount);
    deposit(ledger, amount);
}

int balance() {
    return balance;
}

void main() {
}`,
      solution: `private int balance;

synchronized void deposit(Ledger ledger, int amount) throws InterruptedException {
    balance += amount;
    ledger.record("deposit " + amount);
}

synchronized void withdraw(Ledger ledger, int amount) throws InterruptedException {
    if (amount > balance) throw new IllegalStateException("only " + balance + " left");
    balance -= amount;
    ledger.record("withdraw " + amount);
}

synchronized void depositTwice(Ledger ledger, int amount) throws InterruptedException {
    deposit(ledger, amount);
    deposit(ledger, amount);
}

synchronized int balance() {
    return balance;
}

void main() {
}`,
      hints: [
        'All four methods guard the same field, so they need the same lock: make each a `synchronized` method (they all lock `this`, and the checks call them on one object).',
        '`depositTwice` holds the lock and then calls `deposit`, which takes it again: a monitor is reentrant, so that is allowed, and no other call can come between the two deposits.',
        '`withdraw` checks the balance and changes it inside the same lock; otherwise two withdrawals could both pass the check.'
      ],
      checks: [
        { label: 'deposit 100, withdraw 30: the balance is 70', code: `Ledger quiet = e -> { };
c.call("deposit", quiet, 100);
c.call("withdraw", quiet, 30);
c.eq(c.call("balance"), 70);` },
        { label: 'a deposit and a withdrawal are never inside at the same time', code: `var p = c.probe(2, 300);
Ledger ledger = e -> p.meet();
c.call("deposit", (Ledger) e -> { }, 100);
try (var ex = Executors.newFixedThreadPool(2)) {
    var a = ex.submit(c.callable("deposit", ledger, 10));
    var b = ex.submit(c.callable("withdraw", ledger, 10));
    a.get();
    b.get();
}
c.ok(p.peak() == 1, "deposit and withdraw were both inside at once: they must take the same lock");
c.eq(c.call("balance"), 100);` },
        { label: 'two deposits are never inside at the same time', code: `var p = c.probe(2, 300);
Ledger ledger = e -> p.meet();
try (var ex = Executors.newFixedThreadPool(2)) {
    var a = ex.submit(c.callable("deposit", ledger, 5));
    var b = ex.submit(c.callable("deposit", ledger, 7));
    a.get();
    b.get();
}
c.ok(p.peak() == 1, "two deposits were inside at once");
c.eq(c.call("balance"), 12);` },
        { label: 'depositTwice deposits twice: a synchronized method may call another one (monitors are reentrant)', code: `var log = Collections.synchronizedList(new ArrayList<String>());
c.call("deposit", (Ledger) e -> { }, 50);
var done = new AtomicBoolean();
Thread t = Thread.ofPlatform().daemon(true).start(() -> { try { c.call("depositTwice", (Ledger) log::add, 20); done.set(true); } catch (Throwable e) { } });
t.join(2_000);
c.ok(done.get(), "depositTwice did not finish: a lock that cannot be taken twice by the same thread waits for itself");
c.eq(log, List.of("deposit 20", "deposit 20"));
c.eq(c.call("balance"), 90);` },
        { label: 'withdrawing more than the balance throws, and changes nothing', code: `Ledger quiet = e -> { };
c.call("deposit", quiet, 20);
try {
    c.call("withdraw", quiet, 50);
    c.fail("withdrawing 50 of 20 did not throw");
} catch (IllegalStateException e) {
    c.eq(c.call("balance"), 20);
}` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'th-wait-notify', track: 'threads', title: 'wait, notify and guarded blocks',
    summary: 'A thread that must wait for a condition calls wait() on a monitor, in a while loop, and the thread that changes the state calls notifyAll(). The pattern behind every blocking queue.',
    keywords: ['wait', 'notify', 'notifyAll', 'guarded block', 'spurious wakeup', 'condition', 'producer consumer', 'bounded buffer', 'IllegalMonitorStateException', 'wait vs sleep', 'monitor'],
    docs: 'https://docs.oracle.com/javase/tutorial/essential/concurrency/guardmeth.html', docsLabel: 'The Java Tutorials: Guarded Blocks', lab: '16-java-multithreading',
    body: [
      '## Waiting for a condition',
      'A consumer must wait until there is something to take. Spinning in a loop burns a processor; sleeping and checking again is slow and still wasteful. Every object\'s monitor has a **wait set**: `wait()` releases the monitor and sleeps until another thread calls `notifyAll()` on the same object, then takes the monitor back. Together they make a **guarded block**:',
      norun(`// the waiting side
synchronized (lock) {
    while (!condition) lock.wait();
    // the condition holds here, and you hold the lock
}

// the side that changes the state
synchronized (lock) {
    changeTheState();
    lock.notifyAll();
}`),
      'Both sides hold the same lock, so the check and the change cannot interleave. `wait()` and `notifyAll()` outside `synchronized` on that object throw:',
      jv(`void main() {
    Object lock = new Object();
    try {
        lock.notifyAll();
    } catch (IllegalMonitorStateException e) {
        IO.println("notifyAll outside synchronized: " + e.getMessage());
    }
}`),
      out('notifyAll outside synchronized: current thread is not owner'),
      '## Why while, never if',
      'When `wait()` returns, the condition may be false again. A thread can wake with no notify at all (a **spurious wakeup**, which the specification allows), and `notifyAll` wakes every waiter, but only one can have the item. Two consumers waiting with `if`, one parcel:',
      jv(`final Object lock = new Object();
final ArrayDeque<String> parcels = new ArrayDeque<>();

String takeWithIf() throws InterruptedException {
    synchronized (lock) {
        if (parcels.isEmpty()) lock.wait();
        return parcels.removeFirst();
    }
}

void main() throws InterruptedException {
    List<String> results = Collections.synchronizedList(new ArrayList<>());
    Runnable consumer = () -> {
        try {
            results.add("got " + takeWithIf());
        } catch (NoSuchElementException e) {
            results.add("NoSuchElementException: the parcel was already gone");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    };
    Thread a = Thread.ofPlatform().start(consumer);
    Thread b = Thread.ofPlatform().start(consumer);
    while (a.getState() != Thread.State.WAITING || b.getState() != Thread.State.WAITING) Thread.sleep(5);
    synchronized (lock) {
        parcels.add("parcel");
        lock.notifyAll();
    }
    a.join();
    b.join();
    results.sort(null);
    results.forEach(IO::println);
}`),
      out(`NoSuchElementException: the parcel was already gone
got parcel`),
      'Both consumers woke; the first took the parcel; the second did not look again. With `while (parcels.isEmpty()) lock.wait();` the second would have gone back to waiting. The ⚠ in the margin flags a `wait()` under an `if`.',
      '## notifyAll, not notify',
      '`notify()` wakes **one** waiting thread, chosen by the JVM. If producers and consumers wait on the same object, it can wake a producer when only a consumer could go on; that producer waits again, and everyone sleeps. `notifyAll()` is the safe default; `ReentrantLock` with a `Condition` per reason to wait is the precise tool ([[lesson:juc-locks]]).',
      '## A bounded buffer',
      'The pattern twice: `put` waits while the buffer is full, `take` while it is empty, and each notifies after changing it.',
      jv(`class Buffer {
    private final ArrayDeque<Integer> items = new ArrayDeque<>();
    private final int capacity;
    Buffer(int capacity) { this.capacity = capacity; }

    synchronized void put(int x) throws InterruptedException {
        while (items.size() == capacity) wait();
        items.addLast(x);
        notifyAll();
    }

    synchronized int take() throws InterruptedException {
        while (items.isEmpty()) wait();
        int x = items.removeFirst();
        notifyAll();
        return x;
    }
}

void main() throws InterruptedException {
    var buffer = new Buffer(2);
    Thread consumer = Thread.ofPlatform().start(() -> {
        try {
            int sum = 0;
            for (int i = 0; i < 5; i++) sum += buffer.take();
            IO.println("consumed 5, sum " + sum);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    for (int i = 1; i <= 5; i++) buffer.put(i);
    consumer.join();
}`),
      out('consumed 5, sum 15'),
      '## wait() or sleep()',
      'The interview favourite. Both pause the thread and both throw `InterruptedException`; the difference is the lock.',
      '| | `wait()` | `Thread.sleep()` |\n|---|---|---|\n| Defined on | `Object` (every monitor) | `Thread` (static) |\n| Needs the monitor | yes, or `IllegalMonitorStateException` | no |\n| The lock while paused | **released**, taken back on waking | **kept** |\n| Ends when | notified, interrupted, timed out, or spuriously | the time is up, or interrupted |\n| For | waiting for a condition another thread makes true | waiting for time to pass |',
      'In new code you rarely write `wait` and `notify`: `BlockingQueue`, `CountDownLatch`, `Semaphore` and `Condition` are built on the same idea and are harder to get wrong ([[lesson:juc-collections]], [[lesson:juc-synchronizers]]). You will still read them in older code, in thread dumps, and in interviews.'
    ].join('\n\n'),
    work: [
      '**You meet it in thread dumps.** A thread `WAITING` "in Object.wait()" is in a guarded block; pool threads idle on their queue show `WAITING (parking)` in `LinkedBlockingQueue.take`; a request thread waiting for a database connection waits on the pool\'s condition until one is returned or the pool\'s timeout passes. The state tells you which.',
      '**A producer faster than its consumer.** A bounded buffer is back pressure: when it is full, the producer waits, instead of the queue growing until memory runs out. Every hand-off between a reading thread and worker threads (a message poll loop and its workers, an importer and its writers) wants a bound.',
      '**Hand-written guarded blocks in old code** are worth reading for the `if` and the `notify()`: both are bugs that wait for the unlucky interleaving.'
    ].join('\n\n'),
    example: {
      code: `// Change while to if in take(), and notifyAll() to notify(); start two consumers. What breaks?
class Buffer {
    private final ArrayDeque<Integer> items = new ArrayDeque<>();
    synchronized void put(int x) { items.addLast(x); notifyAll(); }
    synchronized int take() throws InterruptedException {
        while (items.isEmpty()) wait();
        return items.removeFirst();
    }
}

void main() throws InterruptedException {
    var buffer = new Buffer();
    Thread consumer = Thread.ofPlatform().start(() -> {
        try {
            for (int i = 0; i < 3; i++) IO.println("took " + buffer.take());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    for (int i = 1; i <= 3; i++) {
        Thread.sleep(100);
        buffer.put(i);
    }
    consumer.join();
}`
    },
    challenge: {
      title: 'A one-slot mailbox',
      task: 'Write the class `Mailbox`: a slot that holds at most one message.\n\n1. `put(message)`: wait while the slot is full, then put the message in.\n2. `take()`: wait while the slot is empty, then take the message out and return it.\n\nUse `synchronized`, `wait()` and `notifyAll()`. Many producers and consumers use one mailbox at once; every message must be taken exactly once.',
      starter: `class Mailbox {
    private String message;

    // Wait while the slot is full, then put the message in.
    void put(String m) throws InterruptedException {
        throw new UnsupportedOperationException("Not written yet");
    }

    // Wait while the slot is empty, then take the message out and return it.
    String take() throws InterruptedException {
        throw new UnsupportedOperationException("Not written yet");
    }
}

void main() throws InterruptedException {
    var box = new Mailbox();
    box.put("hello");
    IO.println(box.take());
}`,
      solution: `class Mailbox {
    private String message;

    synchronized void put(String m) throws InterruptedException {
        while (message != null) wait();
        message = m;
        notifyAll();
    }

    synchronized String take() throws InterruptedException {
        while (message == null) wait();
        String m = message;
        message = null;
        notifyAll();
        return m;
    }
}

void main() throws InterruptedException {
    var box = new Mailbox();
    box.put("hello");
    IO.println(box.take());
}`,
      hints: [
        'Both methods are `synchronized`, so `wait()` and `notifyAll()` (on `this`) are allowed in them. "Full" means `message != null`.',
        'Wait in a loop: `while (message == null) wait();` checks again after every wake-up.',
        'After changing the slot, call `notifyAll()`: a `take` wakes the producers waiting to put, a `put` wakes the consumers waiting to take.'
      ],
      checks: [
        { label: 'a message put in is taken out', code: `Object box = c.make("Mailbox");
c.callOn(box, "put", "hello");
c.eq(c.callOn(box, "take"), "hello");` },
        { label: 'take() waits until a message arrives', code: `Object box = c.make("Mailbox");
String[] got = new String[1];
Thread taker = Thread.ofPlatform().start(() -> { try { got[0] = c.callOn(box, "take"); } catch (Throwable e) { got[0] = "threw " + e; } });
for (int i = 0; i < 400 && taker.getState() != Thread.State.WAITING; i++) Thread.sleep(5);
c.ok(taker.getState() == Thread.State.WAITING, "take() on an empty mailbox did not wait (state " + taker.getState() + ", got " + got[0] + ")");
c.callOn(box, "put", "late letter");
taker.join(2_000);
c.ok(!taker.isAlive(), "the waiting take() was never woken by put(): notifyAll() after putting");
c.eq(got[0], "late letter");` },
        { label: 'put() waits while the slot is full', code: `Object box = c.make("Mailbox");
c.callOn(box, "put", "first");
Thread putter = Thread.ofPlatform().start(() -> { try { c.callOn(box, "put", "second"); } catch (Throwable e) { } });
for (int i = 0; i < 400 && putter.getState() != Thread.State.WAITING; i++) Thread.sleep(5);
c.ok(putter.getState() == Thread.State.WAITING, "put() on a full mailbox did not wait: the first message would be lost");
c.eq(c.callOn(box, "take"), "first");
putter.join(2_000);
c.ok(!putter.isAlive(), "the waiting put() was never woken by take(): notifyAll() after taking");
c.eq(c.callOn(box, "take"), "second");` },
        { label: '4 producers and 4 consumers: 1,000 messages, each taken once', code: `Object box = c.make("Mailbox");
var taken = new ConcurrentLinkedQueue<String>();
try (var ex = Executors.newFixedThreadPool(8)) {
    for (int p = 0; p < 4; p++) {
        int id = p;
        ex.submit(c.task(() -> { for (int i = 0; i < 250; i++) c.callOn(box, "put", id + "-" + i); }));
        ex.submit(c.task(() -> { for (int i = 0; i < 250; i++) taken.add(c.callOn(box, "take")); }));
    }
}
c.eq(taken.size(), 1_000);
c.eq(new HashSet<>(taken).size(), 1_000);` },
        { label: 'no wait() is guarded by a plain if', code: `c.ok(!c.uses("if[ ]*[(][^)]*[)][ ]*wait[ ]*[(]"), "a wait() under an if: after a wake-up the condition may be false again (another thread took it, or a spurious wakeup); use while");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 6 */
  L.push({
    id: 'th-deadlock', track: 'threads', title: 'Deadlock, and how to avoid it',
    summary: 'Two threads, each holding the lock the other needs, wait for ever. Take locks in one global order, or back off with tryLock; find them with a thread dump or ThreadMXBean.',
    keywords: ['deadlock', 'lock ordering', 'livelock', 'starvation', 'circular wait', 'coffman conditions', 'ThreadMXBean', 'findDeadlockedThreads', 'tryLock', 'thread starvation deadlock', 'jstack'],
    docs: 'https://docs.oracle.com/javase/tutorial/essential/concurrency/deadlock.html', docsLabel: 'The Java Tutorials: Deadlock', lab: '16-java-multithreading',
    body: [
      '## Two locks, opposite order',
      'Thread 1 holds lock A and wants B; thread 2 holds B and wants A. Neither can go on, and neither will ever let go: a **deadlock**. Forced here with a latch, so both hold their first lock before either asks for the second; the JVM can find it:',
      jv(`import java.lang.management.*;

void main() throws InterruptedException {
    Object a = new Object(), b = new Object();
    var bothHoldOne = new CountDownLatch(2);
    Thread t1 = Thread.ofPlatform().name("t1").daemon(true).start(() -> {
        synchronized (a) {
            bothHoldOne.countDown();
            try { bothHoldOne.await(); } catch (InterruptedException e) { return; }
            synchronized (b) { IO.println("t1 got both"); }
        }
    });
    Thread t2 = Thread.ofPlatform().name("t2").daemon(true).start(() -> {
        synchronized (b) {
            bothHoldOne.countDown();
            try { bothHoldOne.await(); } catch (InterruptedException e) { return; }
            synchronized (a) { IO.println("t2 got both"); }
        }
    });
    t1.join(500);
    IO.println("t1 " + t1.getState() + ", t2 " + t2.getState());
    ThreadMXBean threads = ManagementFactory.getThreadMXBean();
    long[] ids = threads.findDeadlockedThreads();
    IO.println("deadlocked threads: " + ids.length);
    List<String> lines = new ArrayList<>();
    for (ThreadInfo info : threads.getThreadInfo(ids)) {
        lines.add(info.getThreadName() + " waits for " + info.getLockName().replaceAll("@.*", "") + " held by " + info.getLockOwnerName());
    }
    lines.stream().sorted().forEach(IO::println);
}`),
      out(`t1 BLOCKED, t2 BLOCKED
deadlocked threads: 2
t1 waits for java.lang.Object held by t2
t2 waits for java.lang.Object held by t1`),
      'Without the latch, deadlock is a matter of timing; measured here, two threads doing 100,000 transfers each in opposite lock order deadlocked in **10 runs of 10**. A `BLOCKED` thread does not answer an interrupt (measured), so nothing inside the JVM ends it: only a restart.',
      '## The four conditions',
      'A deadlock needs all four (the Coffman conditions), so breaking any one prevents it:',
      '| Condition | Means | Break it by |\n|---|---|---|\n| Mutual exclusion | a lock has one owner at a time | sharing immutable data instead of locking |\n| Hold and wait | a thread holds one lock while asking for another | taking all the locks at once, or one lock only |\n| No preemption | a lock cannot be taken away | `tryLock` with a timeout, letting go and trying again |\n| Circular wait | T1 waits for T2 waits for T1 | **one global order** for taking locks |',
      '## Fix 1: one order for every thread',
      'Give the locks an order (an account id, say) and always take the lower one first. A cycle is then impossible:',
      jv(`class Account {
    final int id;
    int balance;
    Account(int id, int balance) { this.id = id; this.balance = balance; }
}

void transfer(Account from, Account to, int amount) {
    Account first = from.id < to.id ? from : to;
    Account second = first == from ? to : from;
    synchronized (first) {
        synchronized (second) {
            from.balance -= amount;
            to.balance += amount;
        }
    }
}

void main() throws InterruptedException {
    var a = new Account(1, 1_000);
    var b = new Account(2, 1_000);
    Thread x = Thread.ofPlatform().start(() -> { for (int i = 0; i < 100_000; i++) transfer(a, b, 1); });
    Thread y = Thread.ofPlatform().start(() -> { for (int i = 0; i < 100_000; i++) transfer(b, a, 1); });
    x.join();
    y.join();
    IO.println("balances: " + a.balance + " and " + b.balance);
}`),
      out('balances: 1000 and 1000'),
      '## Fix 2: try, and back off',
      'With a `ReentrantLock`, `tryLock(timeout)` gives up instead of waiting for ever: a thread that cannot get its second lock releases its first, waits a random moment, and tries again ([[lesson:juc-locks]]). The random wait matters: two threads that back off and retry in step can repeat the same collision for ever, a **livelock** (busy, but never progressing).',
      '## A deadlock with no locks at all',
      'A task in a pool that waits for another task queued behind it in the same full pool waits for ever: a **thread-starvation deadlock**. With one thread, it is certain:',
      jv(`void main() throws Exception {
    try (var pool = Executors.newFixedThreadPool(1)) {
        Future<String> outer = pool.submit(() -> {
            Future<String> inner = pool.submit(() -> "inner result");
            try {
                return inner.get(500, TimeUnit.MILLISECONDS);
            } catch (TimeoutException e) {
                return "TimeoutException: the inner task is queued behind the outer one, which waits for it";
            }
        });
        IO.println(outer.get());
    }
}`),
      out('TimeoutException: the inner task is queued behind the outer one, which waits for it'),
      '| Problem | What you see | The cure |\n|---|---|---|\n| Deadlock | threads `BLOCKED` (or `WAITING`) for ever, no CPU used | lock ordering, `tryLock`, one lock |\n| Livelock | threads busy retrying, no progress | random back-off, a single coordinator |\n| Starvation | one thread never gets the lock, or a pool never gets a thread | fair locks, separate pools, no waiting on your own pool |',
      '## Finding them',
      '`jstack <pid>` (or `jcmd <pid> Thread.print`) ends its output with "Found one Java-level deadlock" and the cycle; `ThreadMXBean.findDeadlockedThreads()` does the same from inside the program, as above, for a health check. They see monitors and `java.util.concurrent` locks; they cannot see a pool waiting on itself.'
    ].join('\n\n'),
    work: [
      '**The database has the same deadlock.** Two transactions update the same two rows in opposite orders; the database detects the cycle and aborts one (PostgreSQL: "deadlock detected"; MySQL: "Deadlock found when trying to get lock"). The same two cures: update rows in a consistent order (sort by id before a batch update), and retry the transaction that was aborted. See the Learning lab [[lab:10-optimistic-vs-pessimistic-locking]].',
      '**A pool waiting on itself.** An `@Async` method that calls another `@Async` method on the same executor and then waits for its future, or a `CompletableFuture` chain that `join()`s inside a task of a small pool: under load every thread is an outer task waiting for an inner one that cannot start. Never block a pool\'s thread on work queued to the same pool; on virtual threads ([[lesson:vt-create]]) there is no pool to exhaust.',
      '**Add the deadlock check to a health endpoint** (`findDeadlockedThreads() != null`): a deadlocked instance otherwise looks alive, answering health checks while half its threads are stuck.'
    ].join('\n\n'),
    example: {
      code: `// Take the locks in argument order (first = from): run it a few times. Then put the id order back.
class Account {
    final int id;
    int balance;
    Account(int id, int balance) { this.id = id; this.balance = balance; }
}

void transfer(Account from, Account to, int amount) {
    Account first = from.id < to.id ? from : to;
    Account second = first == from ? to : from;
    synchronized (first) {
        synchronized (second) {
            from.balance -= amount;
            to.balance += amount;
        }
    }
}

void main() throws InterruptedException {
    var a = new Account(1, 1_000);
    var b = new Account(2, 1_000);
    Thread x = Thread.ofPlatform().daemon(true).start(() -> { for (int i = 0; i < 100_000; i++) transfer(a, b, 1); });
    Thread y = Thread.ofPlatform().daemon(true).start(() -> { for (int i = 0; i < 100_000; i++) transfer(b, a, 1); });
    x.join(3_000);
    y.join(3_000);
    IO.println(x.isAlive() || y.isAlive() ? "deadlocked" : "balances: " + a.balance + " and " + b.balance);
}`
    },
    challenge: {
      title: 'Transfers that never deadlock',
      task: 'Write `transfer(from, to, amount)`: move the amount from one `Account` to the other, locking **both** accounts (`synchronized` on each) while it does. Many threads transfer at once, in every direction, so take the two locks in one global order: the account with the lower `id` first.\n\nA transfer to the same account is a mistake: throw `IllegalArgumentException`.',
      files: [{ name: 'Account.java', code: `/** A bank account: synchronize on it while you change its balance. */
public final class Account {
    public final int id;
    private int balance;

    public Account(int id, int balance) {
        this.id = id;
        this.balance = balance;
    }

    public int balance() { return balance; }

    public void add(int amount) { balance += amount; }
}
` }],
      starter: `// Move amount from one account to the other, holding both accounts' locks.
void transfer(Account from, Account to, int amount) {
    synchronized (from) {
        synchronized (to) {
            from.add(-amount);
            to.add(amount);
        }
    }
}

void main() {
    var a = new Account(1, 100);
    var b = new Account(2, 0);
    transfer(a, b, 30);
    IO.println(a.balance() + " " + b.balance());
}`,
      solution: `void transfer(Account from, Account to, int amount) {
    if (from == to) throw new IllegalArgumentException("same account");
    Account first = from.id < to.id ? from : to;
    Account second = first == from ? to : from;
    synchronized (first) {
        synchronized (second) {
            from.add(-amount);
            to.add(amount);
        }
    }
}

void main() {
    var a = new Account(1, 100);
    var b = new Account(2, 0);
    transfer(a, b, 30);
    IO.println(a.balance() + " " + b.balance());
}`,
      hints: [
        'Two threads transferring a→b and b→a at once each take their `from` first: each holds the lock the other wants. That is the deadlock.',
        'Decide the order by something both threads agree on, whatever the direction: `Account first = from.id < to.id ? from : to;` and the other one second.',
        'Check `from == to` before locking anything, and throw `IllegalArgumentException`.'
      ],
      checks: [
        { label: 'moves the money', code: `var a = new Account(1, 100);
var b = new Account(2, 0);
c.call("transfer", a, b, 30);
c.eq(List.of(a.balance(), b.balance()), List.of(70, 30));` },
        { label: '100,000 transfers each way at once finish: no deadlock', code: `var a = new Account(1, 1_000);
var b = new Account(2, 1_000);
Thread x = Thread.ofPlatform().daemon(true).start(() -> { for (int i = 0; i < 100_000; i++) try { c.call("transfer", a, b, 1); } catch (Throwable e) { return; } });
Thread y = Thread.ofPlatform().daemon(true).start(() -> { for (int i = 0; i < 100_000; i++) try { c.call("transfer", b, a, 1); } catch (Throwable e) { return; } });
x.join(3_000);
y.join(1_000);
c.ok(!x.isAlive() && !y.isAlive(), "deadlock: each thread holds one account and waits for the other; take the locks in id order");` },
        { label: 'no money is made or lost', code: `var a = new Account(1, 1_000);
var b = new Account(2, 1_000);
try (var ex = Executors.newFixedThreadPool(2)) {
    ex.submit(c.task(() -> { for (int i = 0; i < 20_000; i++) c.call("transfer", a, b, 1); }));
    ex.submit(c.task(() -> { for (int i = 0; i < 20_000; i++) c.call("transfer", b, a, 2); }));
}
c.eq(a.balance() + b.balance(), 2_000);
c.eq(List.of(a.balance(), b.balance()), List.of(21_000, -19_000));` },
        { label: 'a transfer to the same account throws IllegalArgumentException', code: `var a = new Account(1, 100);
try {
    c.call("transfer", a, a, 10);
    c.fail("a transfer to the same account did not throw");
} catch (IllegalArgumentException e) {
    c.eq(a.balance(), 100);
}` },
        { label: 'three accounts transferring in a circle at once finish too', code: `var a = new Account(1, 500);
var b = new Account(2, 500);
var d = new Account(3, 500);
List<Thread> ts = new ArrayList<>();
for (Account[] pair : List.of(new Account[] {a, b}, new Account[] {b, d}, new Account[] {d, a})) {
    ts.add(Thread.ofPlatform().daemon(true).start(() -> { for (int i = 0; i < 50_000; i++) try { c.call("transfer", pair[0], pair[1], 1); } catch (Throwable e) { return; } }));
}
for (Thread t : ts) t.join(1_000);
c.ok(ts.stream().noneMatch(Thread::isAlive), "a deadlock around the circle a→b, b→c, c→a: the id order breaks it");
c.eq(a.balance() + b.balance() + d.balance(), 1_500);` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 7 */
  L.push({
    id: 'th-interrupts', track: 'threads', title: 'Interruption: how Java cancels',
    summary: 'Java cannot kill a thread; it asks it to stop by setting its interrupt flag. Blocking calls answer by throwing InterruptedException, loops must check the flag, and code that catches it must stop or set the flag again.',
    keywords: ['interrupt', 'InterruptedException', 'interrupt flag', 'interrupt status', 'isInterrupted', 'Thread.interrupted', 'cancellation', 'Thread.stop', 'restore interrupt', 'swallow', 'shutdownNow', 'cancel'],
    docs: 'https://docs.oracle.com/javase/tutorial/essential/concurrency/interrupt.html', docsLabel: 'The Java Tutorials: Interrupts', lab: '16-java-multithreading',
    body: [
      '## You cannot kill a thread',
      '`Thread.stop()` once killed a thread wherever it was, leaving locked objects half changed. It is gone in practice: on Java 25 it throws `UnsupportedOperationException` and the thread runs on (measured), and `suspend()` no longer exists. Stopping is **cooperative**: you ask, and the thread\'s own code stops.',
      jv(`void main() throws InterruptedException {
    Thread spinner = Thread.ofPlatform().daemon(true).start(() -> { while (true) Thread.onSpinWait(); });
    try {
        spinner.stop();
    } catch (UnsupportedOperationException e) {
        IO.println("stop(): " + e.getClass().getSimpleName() + ", still alive: " + spinner.isAlive());
    }
}`),
      out('stop(): UnsupportedOperationException, still alive: true'),
      '## The interrupt flag',
      '`t.interrupt()` sets `t`\'s **interrupt flag**. If `t` is in a blocking call that answers interrupts (`sleep`, `join`, `wait`, a queue\'s `take`, a lock\'s `lockInterruptibly`), that call throws `InterruptedException` at once, and **the flag is cleared** as it is thrown.',
      jv(`void main() throws InterruptedException {
    Thread t = Thread.ofPlatform().start(() -> {
        try {
            Thread.sleep(10_000);
        } catch (InterruptedException e) {
            IO.println("caught: " + e.getMessage() + "; flag now " + Thread.currentThread().isInterrupted());
        }
    });
    t.interrupt();
    t.join();
    Thread.currentThread().interrupt();
    IO.println("interrupted() first " + Thread.interrupted() + ", then " + Thread.interrupted());
}`),
      out(`caught: sleep interrupted; flag now false
interrupted() first true, then false`),
      '`isInterrupted()` reads the flag. The static `Thread.interrupted()` reads **and clears** the current thread\'s flag, so a second call says `false`. Not every wait answers: a thread `BLOCKED` entering a `synchronized` block ignores interrupts (its flag stays set, measured), and so does `lock()`; `lockInterruptibly()` does not.',
      '## What to do with InterruptedException',
      'Throwing it cleared the flag. If you catch it, the request to stop disappears unless you pass it on. Two right answers:',
      '| You are in | Do |\n|---|---|\n| a method that may throw it | declare `throws InterruptedException` and let it go: the caller decides |\n| a `Runnable`, a lambda or an override that may not throw it | stop the work, and set the flag again: `Thread.currentThread().interrupt();` |\n| anywhere | never an empty `catch`: that swallows the request, and whoever cancelled you waits for ever |',
      norun(`try {
    Thread.sleep(100);
} catch (InterruptedException e) {
    // restore the flag, so the code above you can see the request too
    Thread.currentThread().interrupt();
    return;
}`),
      '## A loop that computes must look',
      'A CPU loop calls nothing that throws, so the interrupt is only a flag. Check it, usually in the loop condition:',
      jv(`void main() throws InterruptedException {
    long[] reached = new long[1];
    Thread worker = Thread.ofPlatform().start(() -> {
        long i = 0;
        while (!Thread.currentThread().isInterrupted()) i++;
        reached[0] = i;
    });
    Thread.sleep(50);
    worker.interrupt();
    worker.join();
    IO.println("the loop saw the flag and stopped: " + (reached[0] > 0) + "; flag still set: " + worker.isInterrupted());
}`),
      out('the loop saw the flag and stopped: true; flag still set: true'),
      '## Who interrupts',
      '| Call | Interrupts |\n|---|---|\n| `future.cancel(true)` of a task from an executor | the thread running the task |\n| `executor.shutdownNow()` | every running task |\n| `invokeAny`, `invokeAll` with a timeout | the tasks no longer wanted |\n| a `StructuredTaskScope` that is cancelled | every unfinished subtask ([[lesson:sc-failure]]) |\n| `CompletableFuture.cancel(true)`, `orTimeout` | **nothing**: the task runs on (measured, [[lesson:juc-completable]]) |'
    ].join('\n\n'),
    work: [
      '**Shutting a service down.** On shutdown, Spring stops its executors and schedulers, which interrupts the tasks still running, and a scope or `shutdownNow()` interrupts too. A task that swallows `InterruptedException` (an empty `catch`, or `catch (Exception e)` around a retry loop that sleeps) keeps running, and the shutdown waits until the platform kills the process. The ⚠ in the margin flags an empty `catch (InterruptedException e)`.',
      '**Retry loops.** `while (true) { try { call(); break; } catch (Exception e) { Thread.sleep(backoff); } }` catches the `InterruptedException` from `sleep` as just another exception and retries for ever. Catch `InterruptedException` first, restore the flag and stop.',
      '**Timeouts that cancel.** A deadline that calls `future.cancel(true)` frees the thread only if the task answers interrupts. Blocking calls through the JDK do; your own CPU loops must look at the flag.'
    ].join('\n\n'),
    example: {
      code: `// Replace isInterrupted() with Thread.interrupted(): is the flag still set afterwards? Then empty the catch block.
void main() throws InterruptedException {
    var queue = new LinkedBlockingQueue<String>();
    Thread consumer = Thread.ofPlatform().start(() -> {
        try {
            while (!Thread.currentThread().isInterrupted()) IO.println("took " + queue.take());
        } catch (InterruptedException e) {
            IO.println("asked to stop while waiting");
            Thread.currentThread().interrupt();
        }
    });
    queue.put("a");
    queue.put("b");
    Thread.sleep(100);
    consumer.interrupt();
    consumer.join();
    IO.println("flag set at the end: " + consumer.isInterrupted());
}`
    },
    challenge: {
      title: 'Two loops that stop when asked',
      task: 'Two methods, each run on a thread that someone will interrupt:\n\n1. `drain(queue, out)`: take items from the queue (`take()`, which waits) and add each to `out`, until the thread is interrupted. Then return how many it took, **with the interrupt flag set again**.\n2. `crunch(limit)`: count from 0 up to `limit` (a busy loop), but stop early when the thread is interrupted. Return how far it got, and **leave the flag set**.',
      starter: `// Take items into out until interrupted; then return how many were taken, with the flag set again.
int drain(BlockingQueue<String> queue, List<String> out) {
    int taken = 0;
    try {
        while (true) {
            out.add(queue.take());
            taken++;
        }
    } catch (InterruptedException e) {
        // asked to stop
    }
    return taken;
}

// Count up to limit, but stop early when interrupted; leave the flag set.
long crunch(long limit) {
    long i = 0;
    while (i < limit) i++;
    return i;
}

void main() {
    IO.println(crunch(1_000));
}`,
      solution: `int drain(BlockingQueue<String> queue, List<String> out) {
    int taken = 0;
    try {
        while (true) {
            out.add(queue.take());
            taken++;
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
    return taken;
}

long crunch(long limit) {
    long i = 0;
    while (i < limit && !Thread.currentThread().isInterrupted()) i++;
    return i;
}

void main() {
    IO.println(crunch(1_000));
}`,
      hints: [
        'When `take()` throws `InterruptedException`, the flag has just been cleared. `Thread.currentThread().interrupt();` in the `catch` sets it again.',
        'A busy loop has no call that throws: put `!Thread.currentThread().isInterrupted()` in its condition.',
        '`Thread.interrupted()` would also tell you, but it clears the flag: use `isInterrupted()` to leave it set.'
      ],
      checks: [
        { label: 'drain takes the items in order, and stops when interrupted', code: `var queue = new LinkedBlockingQueue<String>(List.of("a", "b"));
var out = Collections.synchronizedList(new ArrayList<String>());
var result = new AtomicInteger(-1);
Thread t = Thread.ofPlatform().daemon(true).start(() -> { try { result.set(c.<Integer>call("drain", queue, out)); } catch (Throwable e) { result.set(-2); } });
for (int i = 0; i < 400 && t.getState() != Thread.State.WAITING; i++) Thread.sleep(5);
t.interrupt();
t.join(2_000);
c.ok(!t.isAlive(), "drain was still running after the interrupt");
c.eq(out, List.of("a", "b"));
c.eq(result.get(), 2);` },
        { label: 'drain leaves the interrupt flag set', code: `var flag = new AtomicReference<Boolean>();
Thread t = Thread.ofPlatform().daemon(true).start(() -> {
    try { c.call("drain", new LinkedBlockingQueue<String>(), new ArrayList<String>()); } catch (Throwable e) { }
    flag.set(Thread.currentThread().isInterrupted());
});
for (int i = 0; i < 400 && t.getState() != Thread.State.WAITING; i++) Thread.sleep(5);
t.interrupt();
t.join(2_000);
c.ok(Boolean.TRUE.equals(flag.get()), "the flag was clear when drain returned: the catch swallowed the request to stop; set it again with Thread.currentThread().interrupt()");` },
        { label: 'crunch counts to its limit when nobody interrupts', code: `c.eq(c.call("crunch", 1_000L), 1_000L);` },
        { label: 'crunch stops early when interrupted', code: `var reached = new AtomicLong(-1);
Thread t = Thread.ofPlatform().daemon(true).start(() -> { try { reached.set(c.<Long>call("crunch", Long.MAX_VALUE)); } catch (Throwable e) { } });
Thread.sleep(50);
t.interrupt();
t.join(2_000);
c.ok(!t.isAlive(), "crunch ignored the interrupt: check Thread.currentThread().isInterrupted() in the loop");
c.ok(reached.get() > 0 && reached.get() < Long.MAX_VALUE, "crunch returned " + reached.get());` },
        { label: 'crunch leaves the interrupt flag set', code: `var flag = new AtomicReference<Boolean>();
Thread t = Thread.ofPlatform().daemon(true).start(() -> {
    try { c.call("crunch", Long.MAX_VALUE); } catch (Throwable e) { }
    flag.set(Thread.currentThread().isInterrupted());
});
Thread.sleep(50);
t.interrupt();
t.join(2_000);
c.ok(Boolean.TRUE.equals(flag.get()), "the flag was clear when crunch returned: Thread.interrupted() clears it; isInterrupted() does not");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 8 */
  L.push({
    id: 'th-publication', track: 'threads', title: 'Safe publication, immutability and ThreadLocal',
    summary: 'An object handed to other threads must be published safely, or they may see it half built. Immutable objects need no locks at all; objects one thread keeps to itself (confinement, ThreadLocal) need none either.',
    keywords: ['safe publication', 'immutable', 'immutability', 'final field', 'record', 'defensive copy', 'List.copyOf', 'unmodifiableList', 'thread confinement', 'ThreadLocal', 'escape', 'AtomicReference', 'SimpleDateFormat'],
    docs: 'https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.5', docsLabel: 'JLS 17.5: final field semantics', lab: '17-java-memory-model',
    body: [
      '## Publishing an object',
      'To **publish** an object is to make it reachable by other threads: assign it to a field they read, put it in a collection, pass it to a thread. If the publishing assignment has no happens-before edge to the reader ([[lesson:th-visibility]]), the reader can see the reference **before** the writes that built the object: fields still `0` or `null`. That is unsafe publication; you will rarely see it on a PC, and you cannot test for it, so publish safely by construction.',
      '| Safe ways to publish | Why it works |\n|---|---|\n| a `static` initialiser (`static final X x = new X();`) | class initialisation is done under a lock the JVM holds |\n| a `volatile` field, or an `AtomicReference` | the write happens-before every read that sees it |\n| a field that both sides only touch under the same lock | unlock happens-before lock |\n| a `ConcurrentHashMap`, a `BlockingQueue`, `executor.submit`, `thread.start` | each hand-off is a happens-before edge |\n| `final` fields set in the constructor | readers see them as constructed, if `this` did not escape the constructor |',
      '## Immutable objects need no lock',
      'An object whose state cannot change after construction is thread-safe however it is shared: there is nothing to race on. A `record` is shallowly immutable: its fields are `final`, but a field holding a mutable list still lets the list change underneath it.',
      jv(`record Order(String id, List<String> items) { }

void main() {
    List<String> cart = new ArrayList<>(List.of("tea"));
    Order order = new Order("o1", cart);
    cart.add("cake");
    IO.println("the order changed after it was made: " + order.items());
}`),
      out('the order changed after it was made: [tea, cake]'),
      'A **defensive copy** in the record\'s compact constructor closes the hole. `List.copyOf` makes an unmodifiable copy; `Collections.unmodifiableList` is only a read-only **view**, and changes to the original still show through it:',
      jv(`record Order(String id, List<String> items) {
    Order {
        items = List.copyOf(items);
    }
}

void main() {
    List<String> cart = new ArrayList<>(List.of("tea"));
    Order order = new Order("o1", cart);
    List<String> view = Collections.unmodifiableList(cart);
    cart.add("cake");
    IO.println("the order: " + order.items() + ", a view: " + view);
    try {
        order.items().add("jam");
    } catch (UnsupportedOperationException e) {
        IO.println("the order's list cannot be changed");
    }
}`),
      out(`the order: [tea], a view: [tea, cake]
the order's list cannot be changed`),
      'To change an immutable value, make a new one and publish it in one step: a `volatile` field or an `AtomicReference` holding it ([[lesson:juc-atomics]]). Readers see the old value or the new one, never a mix.',
      '## Confinement: data only one thread sees',
      'An object only one thread can reach needs no lock: local variables, a `StringBuilder` made and used in one method, the objects a request handler makes for itself. **Thread confinement** is the cheapest thread safety there is. The trap is letting such an object **escape**: storing it in a field, returning it, passing it to a callback that keeps it.',
      '## ThreadLocal: one value per thread',
      'A `ThreadLocal` gives each thread its own copy of a variable: confinement for an object that is costly to make or not thread-safe.',
      jv(`static final ThreadLocal<StringBuilder> BUFFER = ThreadLocal.withInitial(StringBuilder::new);

void main() throws InterruptedException {
    BUFFER.get().append("main's text");
    Thread other = Thread.ofPlatform().start(() -> {
        BUFFER.get().append("other's");
        IO.println("other sees: " + BUFFER.get());
    });
    other.join();
    IO.println("main sees: " + BUFFER.get());
    BUFFER.remove();
}`),
      out(`other sees: other's
main sees: main's text`),
      'In a pool, a thread outlives its task, and so does its `ThreadLocal` value: the next task on that thread finds the last one\'s value unless it was removed.',
      jv(`static final ThreadLocal<String> USER = new ThreadLocal<>();

void main() throws Exception {
    try (var pool = Executors.newFixedThreadPool(1)) {
        pool.submit(() -> USER.set("asha")).get();
        IO.println("the next task on the same thread sees: " + pool.submit(() -> USER.get()).get());
    }
}`),
      out('the next task on the same thread sees: asha'),
      'Set it in `try`, and `remove()` it in `finally`. The classic use, a `SimpleDateFormat` per thread because it is not thread-safe, is better done today with `DateTimeFormatter`, which is immutable and can be shared. With virtual threads, a `ThreadLocal` has one value **per task** ([[lesson:vt-threadlocals]]); for context passed down a call, `ScopedValue` ([[lesson:sv-basics]]).'
    ].join('\n\n'),
    work: [
      '**Stateless beans are thread-safe beans.** A Spring singleton built by constructor injection into `final` fields, holding only other thread-safe beans and immutable configuration, can be called by every request thread at once with no lock. Put request data in parameters and local variables, not fields. `@ConfigurationProperties` can bind into a record: immutable configuration, safely shared.',
      '**ThreadLocal leaks in a pool.** Spring keeps request state in thread-bound holders (`RequestContextHolder`, `SecurityContextHolder`, `TransactionSynchronizationManager`, the logging MDC), and its filters and interceptors clear them at the end of the request in a `finally`. Your own `ThreadLocal` needs the same, or the next request served by that Tomcat thread sees the last user\'s data.',
      '**Caching a value that refreshes.** Hold it as an immutable object in a `volatile` field or an `AtomicReference`, and replace the whole object when it refreshes. Readers never lock and never see half an update.'
    ].join('\n\n'),
    example: {
      code: `// Take out the compact constructor: does the order still change when the cart does? Then try Collections.unmodifiableList.
record Order(String id, List<String> items) {
    Order {
        items = List.copyOf(items);
    }
}

void main() {
    List<String> cart = new ArrayList<>(List.of("tea"));
    Order order = new Order("o1", cart);
    cart.add("cake");
    IO.println(order);
}`
    },
    challenge: {
      title: 'Settings that are safe to share',
      task: 'Settings that many request threads read while one thread now and then replaces them:\n\n1. The record `Settings(host, features)` must be **immutable**: copy the features list, so neither the caller\'s list nor anyone else can change it afterwards.\n2. `update(host, features)`: build new settings and publish them so that every thread is sure to see them.\n3. `current()`: the settings in force.',
      starter: `record Settings(String host, List<String> features) {
}

private Settings current = new Settings("localhost", List.of());

// Replace the settings, so every thread sees the new ones.
void update(String host, List<String> features) {
    current = new Settings(host, features);
}

Settings current() {
    return current;
}

void main() {
    update("db1", List.of("search"));
    IO.println(current());
}`,
      solution: `record Settings(String host, List<String> features) {
    Settings {
        features = List.copyOf(features);
    }
}

private volatile Settings current = new Settings("localhost", List.of());

void update(String host, List<String> features) {
    current = new Settings(host, features);
}

Settings current() {
    return current;
}

void main() {
    update("db1", List.of("search"));
    IO.println(current());
}`,
      hints: [
        'A record\'s compact constructor (`Settings { … }`) can replace a parameter before it is stored: `features = List.copyOf(features);`.',
        '`List.copyOf` makes an unmodifiable copy. `Collections.unmodifiableList` is only a view: changes to the original would still show.',
        'The field that holds the current settings is written by one thread and read by others: declare it `volatile` (or hold the settings in an `AtomicReference`).'
      ],
      checks: [
        { label: 'current() returns what update() set', code: `c.call("update", "db2", List.of("search", "export"));
Object s = c.call("current");
c.eq(c.callOn(s, "host"), "db2");
c.eq(c.callOn(s, "features"), List.of("search", "export"));` },
        { label: 'changing the caller\'s list afterwards does not change the settings', code: `List<String> mine = new ArrayList<>(List.of("search"));
c.call("update", "db2", mine);
mine.add("export");
c.eq(c.callOn(c.call("current"), "features"), List.of("search"));` },
        { label: 'nobody can change the settings\' list', code: `c.call("update", "db2", new ArrayList<>(List.of("search")));
List<String> features = c.callOn(c.call("current"), "features");
try {
    features.add("hack");
    c.fail("the settings' list could be changed: copy it with List.copyOf");
} catch (UnsupportedOperationException e) {
    c.eq(features, List.of("search"));
}` },
        { label: 'the current settings are published safely (volatile, or an AtomicReference)', code: `c.ok(c.uses("volatile[ ]+Settings") || c.uses("AtomicReference"), "the field holding the settings is a plain field: another thread may keep seeing the old settings");` },
        { label: 'settings already handed out never change', code: `c.call("update", "db1", List.of("a"));
Object before = c.call("current");
c.call("update", "db2", List.of("b"));
c.eq(c.callOn(before, "host"), "db1");
c.eq(c.callOn(c.call("current"), "host"), "db2");` }
      ]
    }
  });
})(window.JCLT);
