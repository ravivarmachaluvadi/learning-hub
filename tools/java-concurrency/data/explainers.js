/*
 * data/explainers.js - the explainers (#/explain, js/views/explainers.js, batches 2 and 3): an idea that is hard to
 * see in code, taken apart one step at a time with a picture, then run for real.
 *
 * Explainer shape: {id, track, picture: 'carriers' | 'timeline' | 'tree' | 'bindings' | 'memory' | 'simulator', title, summary,
 *   keywords, intro (Markdown), outro (Markdown), related: ['lesson:<id>', 'q:<id>'],
 *   examples: [{id, label, desc (Markdown), code (a whole program), jdk?: '21', steps}]}
 * Each step is [line, [operations], what happens (Markdown)]; line is the code line to highlight, from 1
 * (0 = none). The operations change the picture, in order. Every picture has:
 *   log T                 the program prints T (a line)
 * carriers:  carrier ID LABEL · vt ID LABEL · mount VT CARRIER · unmount VT · ready VT · pin VT · done VT
 * timeline:  lane ID LABEL · at MS · mark LANE TEXT
 * tree:      node ID PARENT LABEL (PARENT - for none) · state ID running|success|failed|cancelled|joining|closed
 * bindings:  bind NAME=VALUE · pop · child inherits|none LABEL
 * memory:    cell NAME VALUE · thread ID LABEL · read T NAME (T's copy := memory) · set T NAME VALUE (T's copy
 *            only) · write T NAME (memory := T's copy) · lock T LOCK · block T LOCK · unlock T LOCK · edge TEXT
 *            (a happens-before edge made) · done T   (batch 3)
 *
 * simulator (batch 4): no steps; each example is {id, label, desc, params: {rps, serviceMs, threads, connections, holdMs, seconds}},
 *            and the explainer has proof: {note, code, output}, a real program the tests run against the model's claim.
 *
 * What is proved: tests/check_data.py, that every step's line is in its program and every operation is
 * known and consistent; tests/test_content.py, that each program prints exactly the lines its steps log, in
 * order (an example with jdk: '21' runs on JDK 21); tests/test_ui.py ("explain"), that stepping to the end
 * leaves "Printed" holding exactly those lines. The times in the pictures are the programs' own sleeps;
 * the order of what they print is what the tests prove.
 */
(function (U) {
  'use strict';
  var X = U.data.explainers = U.data.explainers || [];

  X.push({
    id: 'carriers', track: 'virtual-threads', picture: 'carriers',
    title: 'Carriers: mounting, unmounting, pinning',
    summary: 'One carrier thread, several virtual threads: watch them mount, unmount while they wait, hold the carrier while they compute, and get pinned in a class initializer.',
    keywords: ['carrier', 'mount', 'unmount', 'pinning', 'time slicing', 'scheduler', 'class initializer'],
    intro: 'Each example gives the scheduler **one carrier thread**, so every virtual thread has to take turns on it. The picture shows the carrier, the virtual thread mounted on it, and the others: **ready** (queued for the carrier), **waiting** (unmounted, its stack on the heap), **pinned** (blocked, but still holding the carrier) or **done**.',
    outro: 'A real scheduler has one carrier per processor, which hides all of this until something holds carriers: a long computation, or pinning. Lessons [[lesson:vt-blocking]] and [[lesson:vt-pinning]] go further.',
    related: ['lesson:vt-under-the-hood', 'lesson:vt-blocking', 'lesson:vt-pinning', 'q:vt-how'],
    examples: [
      { id: 'three-waits', label: 'Three sleeps, one carrier',
        desc: 'Three virtual threads each sleep. While one sleeps, the carrier runs the next.',
        code: `void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    Thread a = Thread.ofVirtual().start(() -> work("A", 300));
    Thread b = Thread.ofVirtual().start(() -> work("B", 100));
    Thread c = Thread.ofVirtual().start(() -> work("C", 200));
    a.join();
    b.join();
    c.join();
}

void work(String name, long ms) {
    IO.println(name + " starts");
    try {
        Thread.sleep(ms);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
    IO.println(name + " ends");
}`,
        steps: [
          [2, ['carrier c1 carrier 1'], 'The first two lines leave the scheduler one **carrier**: a single platform thread to run every virtual thread.'],
          [4, ['vt A thread A'], '`start` makes virtual thread A. It is **ready**: queued until the carrier is free.'],
          [6, ['vt B thread B', 'vt C thread C'], 'B and C queue behind it. `main` runs on a platform thread of its own; it goes on to `join()` and waits.'],
          [13, ['mount A c1', 'log A starts'], 'The carrier **mounts** A: A\'s frames go onto the carrier\'s stack, and A prints.'],
          [15, ['unmount A'], '`Thread.sleep` blocks, so A **unmounts**: its frames are copied to the heap and the carrier is free.'],
          [13, ['mount B c1', 'log B starts'], 'The carrier takes the next ready thread, B.'],
          [15, ['unmount B'], 'B sleeps too, and unmounts.'],
          [13, ['mount C c1', 'log C starts'], 'Then C.'],
          [15, ['unmount C'], 'Three threads are sleeping at once, on one carrier, and the carrier is free.'],
          [19, ['ready B', 'mount B c1', 'log B ends', 'done B'], 'At 100 ms B\'s sleep ends: B is ready again, the carrier mounts it, and it prints and ends.'],
          [19, ['ready C', 'mount C c1', 'log C ends', 'done C'], 'At 200 ms, C.'],
          [19, ['ready A', 'mount A c1', 'log A ends', 'done A'], 'At 300 ms, A. The program took about 300 ms, not 600: the three waits overlapped on one carrier.']
        ] },
      { id: 'cpu-loop', label: 'A loop holds the carrier',
        desc: 'A virtual thread that computes never blocks, so it never gives the carrier up: there is no time slicing.',
        code: `void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    Thread busy = Thread.ofVirtual().start(() -> {
        IO.println("busy: computing for 300 ms");
        long end = System.nanoTime() + 300_000_000L;
        while (System.nanoTime() < end) { }
        IO.println("busy: done");
    });
    Thread.sleep(50);
    Thread quick = Thread.ofVirtual().start(() -> IO.println("quick: finally ran"));
    busy.join();
    quick.join();
}`,
        steps: [
          [2, ['carrier c1 carrier 1'], 'One carrier again.'],
          [4, ['vt busy busy'], 'main starts `busy`.'],
          [5, ['mount busy c1', 'log busy: computing for 300 ms'], 'The carrier mounts it.'],
          [7, [], '`busy` loops for 300 ms. It calls nothing that blocks, so it never unmounts.'],
          [11, ['vt quick quick'], 'At 50 ms main starts `quick`. It is ready, but the only carrier is taken, and the scheduler does not take it back: no time slicing.'],
          [8, ['log busy: done', 'done busy'], 'At 300 ms the loop ends; `busy` prints and ends, and the carrier is free.'],
          [11, ['mount quick c1', 'log quick: finally ran', 'done quick'], 'Only now does `quick` run, 250 ms after it was ready. On a real server, CPU-heavy work on virtual threads delays every thread that only waits: lesson [[lesson:vt-cpu-bound]].']
        ] },
      { id: 'pinned-init', label: 'Pinned in a class initializer',
        desc: 'Blocking inside a `static { }` block pins the virtual thread to its carrier, even on Java 25.',
        code: `static class Settings {
    static final String VALUE;
    static {
        try {
            Thread.sleep(300);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        VALUE = "loaded";
    }
}

void main() throws Exception {
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    Thread loader = Thread.ofVirtual().start(() -> IO.println("loader: settings " + Settings.VALUE));
    Thread.sleep(50);
    Thread other = Thread.ofVirtual().start(() -> IO.println("other: ran"));
    loader.join();
    other.join();
}`,
        steps: [
          [14, ['carrier c1 carrier 1'], 'One carrier.'],
          [16, ['vt loader loader', 'mount loader c1'], '`loader` reads `Settings.VALUE`, so the JVM runs `Settings`\' class initializer, on `loader`\'s thread.'],
          [5, ['pin loader'], 'The initializer sleeps. A virtual thread that blocks inside a class initializer cannot unmount: it is **pinned**, and its carrier is blocked with it. The scheduler does not add a carrier to make up for it.'],
          [18, ['vt other other'], 'At 50 ms `other` is ready, but the only carrier is held by a sleeping thread.'],
          [16, ['ready loader', 'mount loader c1', 'log loader: settings loaded', 'done loader'], 'At 300 ms the initializer ends; `loader` prints and ends.'],
          [18, ['mount other c1', 'log other: ran', 'done other'], 'Only now does `other` run. JFR records the wait as a `jdk.VirtualThreadPinned` event, with the reason "VM call to Main$Settings.<clinit> on stack".']
        ] }
    ]
  });

  var PIN_CODE = `public class Main {
    public static void main(String[] args) throws Exception {
        System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
        System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
        Object lock = new Object();
        Thread holder = Thread.ofVirtual().start(() -> {
            synchronized (lock) {
                System.out.println("holder: has the lock, sleeps 300 ms");
                try {
                    Thread.sleep(300);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                System.out.println("holder: wakes, leaves the lock");
            }
        });
        Thread.sleep(50);
        Thread other = Thread.ofVirtual().start(() -> System.out.println("other: runs"));
        holder.join();
        other.join();
    }
}`;

  X.push({
    id: 'pinning-21-25', track: 'virtual-threads', picture: 'timeline',
    title: 'synchronized on Java 21 and on Java 25',
    summary: 'The same program on two JDKs: a virtual thread sleeps while holding a monitor. On 21 it pins the only carrier; on 25 it unmounts and the other thread runs.',
    keywords: ['pinning', 'synchronized', 'monitor', 'jep 491', 'java 21', 'java 24', 'java 25'],
    intro: 'One program, run twice: on **Java 25** (the JDK this tool runs) and on **Java 21** (also on this PC). Both give the scheduler one carrier. A virtual thread takes a lock with `synchronized` and sleeps inside it; 50 ms later another virtual thread is started. Time runs down the page.',
    outro: 'JEP 491, in Java 24, reworked monitors so that a virtual thread can unmount while it holds one. That is why the Spring Boot reference recommends Java 24 or later for virtual threads. The lock is still held while the holder sleeps: a thread that needs *that lock* still waits, as on any thread.',
    related: ['lesson:vt-pinning', 'q:vt-pinning'],
    examples: [
      { id: 'java25', label: 'Java 25: no pinning',
        desc: 'Run on Java 25.0.4, the JDK this tool runs.',
        code: PIN_CODE,
        steps: [
          [3, ['lane carrier the carrier', 'lane holder holder', 'lane other other', 'at 0'], 'One carrier; a column for it and one for each virtual thread.'],
          [8, ['mark carrier runs holder', 'mark holder takes the lock', 'log holder: has the lock, sleeps 300 ms'], '`holder` is mounted and enters `synchronized`.'],
          [10, ['mark holder sleeps: unmounts, lock still held', 'mark carrier free'], 'On Java 24 and later a virtual thread can unmount while it holds a monitor: the carrier is free.'],
          [18, ['at 50', 'mark other started'], 'At 50 ms main starts `other`.'],
          [18, ['mark carrier runs other', 'mark other runs', 'log other: runs'], 'The free carrier runs it straight away.'],
          [14, ['at 300', 'mark carrier runs holder again', 'mark holder wakes, leaves the lock', 'log holder: wakes, leaves the lock'], 'At 300 ms the sleep ends; `holder` is mounted again, still holding the lock, and leaves it.']
        ] },
      { id: 'java21', label: 'Java 21: pinned', jdk: '21',
        desc: 'The same program on Java 21.0.12.',
        code: PIN_CODE,
        steps: [
          [3, ['lane carrier the carrier', 'lane holder holder', 'lane other other', 'at 0'], 'The same program, run on Java 21.'],
          [8, ['mark carrier runs holder', 'mark holder takes the lock', 'log holder: has the lock, sleeps 300 ms'], '`holder` is mounted and enters `synchronized`.'],
          [10, ['mark holder sleeps: pinned', 'mark carrier blocked with it'], 'On Java 21 to 23 the monitor belongs to the carrier, so a virtual thread holding one cannot unmount. It is **pinned**: the carrier sleeps with it.'],
          [18, ['at 50', 'mark other started: no free carrier'], 'At 50 ms `other` is ready, but there is no carrier to run it.'],
          [14, ['at 300', 'mark holder wakes, leaves the lock', 'log holder: wakes, leaves the lock'], 'At 300 ms the sleep ends and `holder` leaves the lock.'],
          [18, ['mark carrier runs other', 'mark other runs at last', 'log other: runs'], 'Only now does `other` run: 250 ms late. With more carriers the delay hides, until enough threads pin all of them.']
        ] }
    ]
  });

  X.push({
    id: 'scope-tree', track: 'structured', picture: 'tree',
    title: 'The scope tree: failure, race and timeout',
    summary: 'A structured scope and its subtasks: one failure cancels the siblings, the first success cancels the losers, a deadline cancels everything left. No subtask outlives the block.',
    keywords: ['structured concurrency', 'StructuredTaskScope', 'cancellation', 'joiner', 'timeout', 'fork', 'join'],
    intro: '`main` opens a `StructuredTaskScope` and forks subtasks, each on a virtual thread of its own. The picture is the tree: the scope, owned by `main`, and its subtasks under it. Each example uses a different **policy** (a `Joiner`) for when the scope is done. Structured concurrency is a **preview API** in Java 25; this tool runs with `--enable-preview`.',
    outro: 'Whatever the policy, the shape is the same: `join()` waits for the policy to decide, the scope cancels (interrupts) whatever is still running, and `close()` at the end of the `try` block waits for every subtask thread to end.',
    related: ['lesson:sc-failure', 'lesson:sc-joiners', 'lesson:sc-timeouts', 'q:sc-what'],
    examples: [
      { id: 'one-fails', label: 'One fails: the rest are cancelled',
        desc: 'The default `open()`: wait for all to succeed, or for the first failure.',
        code: `String call(String name, long ms, boolean fail) throws InterruptedException {
    try {
        Thread.sleep(ms);
    } catch (InterruptedException e) {
        IO.println(name + ": cancelled");
        throw e;
    }
    if (fail) throw new IllegalStateException(name + " is down");
    IO.println(name + ": done");
    return name;
}

void main() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        scope.fork(() -> call("users", 100, false));
        scope.fork(() -> call("orders", 200, true));
        scope.fork(() -> call("prices", 2_000, false));
        scope.join();
    } catch (StructuredTaskScope.FailedException e) {
        IO.println("join() threw: " + e.getCause().getMessage());
    }
}`,
        steps: [
          [14, ['node scope - the scope (main)'], '`main` opens a scope: it is its **owner**.'],
          [15, ['node users scope users'], '`fork` starts `users` on a new virtual thread, a child of the scope.'],
          [17, ['node orders scope orders', 'node prices scope prices'], '`orders` and `prices` too. All three run at the same time.'],
          [18, ['state scope joining'], '`main` waits in `join()`.'],
          [9, ['state users success', 'log users: done'], 'At 100 ms `users` succeeds.'],
          [8, ['state orders failed'], 'At 200 ms `orders` throws. The default policy: one failure fails the scope, and the scope **cancels** what is still running.'],
          [5, ['state prices cancelled', 'log prices: cancelled'], '`prices` is interrupted in its sleep and stops, 1.8 seconds early. Nobody had to remember to cancel it.'],
          [20, ['state scope closed', 'log join() threw: orders is down'], '`join()` threw `FailedException`, whose cause is `orders`\' exception; `close()` waited for `prices` to end, so no thread outlives the block.']
        ] },
      { id: 'race', label: 'A race: the first answer wins',
        desc: '`Joiner.anySuccessfulResultOrThrow()`: the first subtask to succeed gives the result; the scope cancels the rest.',
        code: `String mirror(String name, long ms) throws InterruptedException {
    try {
        Thread.sleep(ms);
    } catch (InterruptedException e) {
        IO.println(name + ": cancelled");
        throw e;
    }
    IO.println(name + ": answered");
    return name;
}

void main() throws Exception {
    String winner;
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())) {
        scope.fork(() -> mirror("eu-mirror", 500));
        scope.fork(() -> mirror("us-mirror", 100));
        winner = scope.join();
    }
    IO.println("first answer: " + winner);
}`,
        steps: [
          [14, ['node scope - the scope (main)'], 'A scope whose policy is "the first success wins".'],
          [16, ['node eu scope eu-mirror', 'node us scope us-mirror'], 'Two mirrors are asked the same question at the same time.'],
          [17, ['state scope joining'], '`main` waits in `join()`.'],
          [8, ['state us success', 'log us-mirror: answered'], 'At 100 ms `us-mirror` answers: the joiner has its result and cancels the scope.'],
          [5, ['state eu cancelled', 'log eu-mirror: cancelled'], '`eu-mirror` is interrupted: its answer is no longer needed.'],
          [19, ['state scope closed', 'log first answer: us-mirror'], '`join()` returned the winner\'s result; after `close()` no mirror is still running.']
        ] },
      { id: 'timeout', label: 'A deadline',
        desc: '`withTimeout`: when the deadline passes, the scope is cancelled and `join()` throws `TimeoutException`.',
        code: `String call(String name, long ms) throws InterruptedException {
    try {
        Thread.sleep(ms);
    } catch (InterruptedException e) {
        IO.println(name + ": cancelled");
        throw e;
    }
    IO.println(name + ": done");
    return name;
}

void main() throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>allSuccessfulOrThrow(),
            config -> config.withTimeout(Duration.ofMillis(150)))) {
        scope.fork(() -> call("cache", 50));
        scope.fork(() -> call("database", 2_000));
        scope.join();
    } catch (StructuredTaskScope.TimeoutException e) {
        IO.println("join() threw TimeoutException after 150 ms");
    }
}`,
        steps: [
          [13, ['node scope - the scope (main), 150 ms deadline'], 'A scope with a deadline: 150 ms from when it opens.'],
          [16, ['node cache scope cache', 'node db scope database'], 'Two subtasks: a fast cache and a slow database.'],
          [17, ['state scope joining'], '`main` waits in `join()`.'],
          [8, ['state cache success', 'log cache: done'], 'At 50 ms the cache answers.'],
          [5, ['state db cancelled', 'log database: cancelled'], 'At 150 ms the deadline passes: the scope is cancelled, and the database call is interrupted.'],
          [19, ['state scope closed', 'log join() threw TimeoutException after 150 ms'], '`join()` throws `StructuredTaskScope.TimeoutException`. A deadline for the whole fan-out is one line.']
        ] }
    ]
  });

  X.push({
    id: 'scoped-bindings', track: 'scoped', picture: 'bindings',
    title: 'Scoped values: binding, rebinding, inheriting',
    summary: 'A ScopedValue has a value only inside where(…).run(…): nested bindings hide outer ones and end with their block, and subtasks of a structured scope see the binding while an executor\'s threads do not.',
    keywords: ['ScopedValue', 'binding', 'rebinding', 'inheritance', 'ThreadLocal', 'context'],
    intro: 'A `ScopedValue` is a key. `ScopedValue.where(KEY, value).run(…)` binds it for the duration of that call, and `KEY.get()` anywhere inside reads it. The picture is the stack of bindings in force, innermost on top, and what each thread started from here sees. Scoped values are **final** in Java 25 (JEP 506).',
    outro: 'A binding cannot be changed inside its block (there is no `set`), and it ends when its block ends: no leak into a pooled thread, no `remove()` to forget. That is the difference from `ThreadLocal` that matters with millions of virtual threads.',
    related: ['lesson:sv-basics', 'lesson:sv-rebinding', 'lesson:sv-inheritance', 'q:sv-vs-threadlocal'],
    examples: [
      { id: 'rebinding', label: 'Rebinding in a nested call',
        desc: 'A nested `where(…).run(…)` hides the outer value for its own block only.',
        code: `static final ScopedValue<String> USER = ScopedValue.newInstance();

void main() {
    ScopedValue.where(USER, "ravi").run(() -> {
        IO.println("outer: " + USER.get());
        ScopedValue.where(USER, "admin").run(() -> IO.println("inner: " + USER.get()));
        IO.println("outer again: " + USER.get());
    });
    IO.println("after run: bound? " + USER.isBound());
}`,
        steps: [
          [1, [], '`USER` is a key with no value yet.'],
          [4, ['bind USER=ravi'], '`where(USER, "ravi").run(…)` binds it for the lambda and everything it calls.'],
          [5, ['log outer: ravi'], 'Inside, `get()` reads it.'],
          [6, ['bind USER=admin', 'log inner: admin'], 'A nested `where` binds `USER` again, for its own lambda only: the outer binding is hidden, not changed.'],
          [6, ['pop'], 'That inner `run` returns, and its binding ends.'],
          [7, ['log outer again: ravi'], 'The outer value is back: it was never overwritten.'],
          [9, ['pop', 'log after run: bound? false'], 'After the outer `run`, nothing is bound: `get()` here would throw `NoSuchElementException`.']
        ] },
      { id: 'inheritance', label: 'Subtasks inherit; executors do not',
        desc: 'A subtask forked in a `StructuredTaskScope` reads the binding; a thread from an executor does not.',
        code: `static final ScopedValue<String> REQUEST = ScopedValue.newInstance();

void main() throws Exception {
    ScopedValue.where(REQUEST, "req-42").call(() -> {
        try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>allSuccessfulOrThrow())) {
            scope.fork(() -> "subtask sees " + REQUEST.get());
            IO.println(scope.join().map(StructuredTaskScope.Subtask::get).toList().getFirst());
        }
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            IO.println("executor thread sees " + executor.submit(() -> REQUEST.isBound() ? REQUEST.get() : "nothing").get());
        }
        return null;
    });
}`,
        steps: [
          [4, ['bind REQUEST=req-42'], 'A request id is bound for the whole call.'],
          [6, ['child inherits a subtask (fork)'], 'A subtask forked in a scope **inherits** the bindings: it reads the same value, nothing copied. The scope guarantees the subtask ends before the binding does.'],
          [7, ['log subtask sees req-42'], 'So the subtask reads `req-42`.'],
          [10, ['child none an executor thread'], 'A thread from an executor inherits nothing: an executor cannot promise its threads end before the binding does.'],
          [10, ['log executor thread sees nothing'], 'There, `REQUEST` is unbound.'],
          [13, ['pop'], '`call` returns, and the binding ends.']
        ] }
    ]
  });
  /* ---------------------------------------------------------------- batch 3: memory */
  X.push({
    id: 'lost-update', track: 'threads', picture: 'memory',
    title: 'A lost update, and happens-before',
    summary: 'Each thread works on its own view of memory. Watch two increments become one, then the three fixes: a lock that makes the second thread wait, a compare-and-set that notices and retries, and the happens-before edges (volatile, start, join) that decide what a thread is sure to see.',
    keywords: ['lost update', 'race', 'happens-before', 'memory model', 'volatile', 'synchronized', 'cas', 'visibility', 'start', 'join'],
    intro: 'The picture has **main memory** (the shared variables, one copy each) and, for each thread, **its own view**: the values it has read into registers and caches, and the ones it has computed but not yet written. A thread sees another\'s write only when a **happens-before** edge connects them; the edges made so far are listed under the threads. Two of these programs hold a race window open with a latch, so they print the same on every run, as the tests prove. Without a happens-before edge a thread may see a stale value for ever (measured in [[lesson:th-visibility]]: a plain flag never seen in 12 runs of 12); that program is not here, because what it prints depends on the JIT, and every program here must print exactly what its steps say.',
    outro: 'Three ways out of the lost update: a lock (the second thread waits, and the unlock-then-lock edge shows it the first one\'s write), a compare-and-set (the second thread\'s write is refused because the value changed, and it retries), or no shared mutable state at all. And for visibility, an edge: `volatile`, a lock, `start()`, `join()`, or a `java.util.concurrent` hand-off.',
    related: ['lesson:th-races', 'lesson:th-visibility', 'lesson:th-synchronized', 'lesson:juc-atomics', 'q:th-happens-before'],
    examples: [
      { id: 'lost', label: 'Two increments, one lost',
        desc: 'Both threads read `count` before either writes. A latch holds them there, so it happens every run.',
        code: `int count = 0;

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
    IO.println("two increments, count = " + count);
}`,
        steps: [
          [1, ['cell count 0', 'thread m main'], '`count` is a field: one copy, in main memory, 0.'],
          [11, ['thread a A'], 'Thread A starts, running `increment`.'],
          [12, ['thread b B'], 'Thread B starts, running the same code.'],
          [6, ['read a count'], 'A reads `count` into its local `seen`: 0.'],
          [6, ['read b count'], 'B reads `count` too, before A has written anything: also 0.'],
          [8, [], 'The latch keeps both here until both have read: the race window, held open. Without it the window is nanoseconds wide, and the bug shows only now and then.'],
          [9, ['set a count 1', 'write a count'], 'A computes 0 + 1 and writes 1 to main memory.'],
          [9, ['set b count 1', 'write b count'], 'B computes **its** 0 + 1 and writes 1 over A\'s 1. A\'s increment is lost.'],
          [14, ['done a', 'done b', 'edge everything A and B did → main\'s join() returns'], 'Both threads end; `join()` makes what they wrote visible to main.'],
          [15, ['read m count', 'log two increments, count = 1'], 'Main reads 1. Two increments ran; one survived.']
        ] },
      { id: 'synchronized', label: 'The same, with synchronized',
        desc: 'The read and the write are now one critical section. Which thread goes first changes from run to run; the result does not.',
        code: `int count = 0;

synchronized void increment() {
    int seen = count;
    count = seen + 1;
}

void main() throws InterruptedException {
    Thread a = Thread.ofPlatform().start(this::increment);
    Thread b = Thread.ofPlatform().start(this::increment);
    a.join();
    b.join();
    IO.println("two increments, count = " + count);
}`,
        steps: [
          [1, ['cell count 0', 'thread m main', 'thread a A', 'thread b B'], 'Main memory holds `count = 0`; two threads will each call `increment()`.'],
          [3, ['lock a this'], 'A enters the synchronized method: it takes the monitor of `this`.'],
          [3, ['block b this'], 'B wants the same monitor and waits for it, `BLOCKED`. It cannot read `count` yet.'],
          [4, ['read a count'], 'A reads 0.'],
          [5, ['set a count 1', 'write a count'], 'A writes 1.'],
          [6, ['unlock a this', 'edge A unlocks this → B locks this', 'done a'], 'A leaves the method and releases the monitor. Unlocking happens-before the next lock of the same monitor.'],
          [3, ['lock b this'], 'B takes the monitor. Because of that edge, B is sure to see everything A did.'],
          [4, ['read b count'], 'B reads 1, not 0.'],
          [5, ['set b count 2', 'write b count'], 'B writes 2.'],
          [6, ['unlock b this', 'done b'], 'B releases the monitor and ends.'],
          [11, ['edge everything A and B did → main\'s join() returns'], 'Main joins both.'],
          [13, ['read m count', 'log two increments, count = 2'], 'Both increments survive.']
        ] },
      { id: 'cas', label: 'Compare-and-set notices, and retries',
        desc: 'No lock: both threads read 0 again, but a compare-and-set writes only if the value is still what the thread read.',
        code: `void main() throws InterruptedException {
    var count = new AtomicInteger(0);
    var bothRead = new CountDownLatch(2);
    List<String> log = Collections.synchronizedList(new ArrayList<>());
    Runnable increment = () -> {
        int seen = count.get();
        bothRead.countDown();
        try { bothRead.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
        while (!count.compareAndSet(seen, seen + 1)) {
            log.add("a CAS failed: expected " + seen + ", found " + count.get() + "; retry");
            seen = count.get();
        }
    };
    Thread a = Thread.ofPlatform().start(increment);
    Thread b = Thread.ofPlatform().start(increment);
    a.join();
    b.join();
    log.forEach(IO::println);
    IO.println("count = " + count.get());
}`,
        steps: [
          [2, ['cell count 0', 'thread m main'], 'An `AtomicInteger`: one value in main memory, 0, changed only by atomic operations.'],
          [14, ['thread a A', 'thread b B'], 'Two threads start.'],
          [6, ['read a count', 'read b count'], 'Both read 0, held at the latch as before.'],
          [9, ['set a count 1', 'write a count'], 'A: `compareAndSet(0, 1)`. The value is still 0, so it writes 1 and returns `true`. Which thread wins changes from run to run; that one of them loses does not.'],
          [9, ['set b count 1'], 'B: `compareAndSet(0, 1)`. The value is 1 now, not the 0 B expected: **nothing is written**, and it returns `false`.'],
          [11, ['read b count'], 'B notes the failure and reads again: 1.'],
          [9, ['set b count 2', 'write b count'], 'B: `compareAndSet(1, 2)` succeeds.'],
          [17, ['done a', 'done b', 'edge everything A and B did → main\'s join() returns'], 'Both threads end.'],
          [18, ['log a CAS failed: expected 0, found 1; retry'], 'The one failed CAS, from whichever thread lost.'],
          [19, ['read m count', 'log count = 2'], 'No update lost, and no thread ever waited.']
        ] },
      { id: 'volatile', label: 'A volatile flag carries data with it',
        desc: 'Main writes `data`, then the volatile `ready`. A reader that sees `ready == true` is sure to see `data = 42`.',
        code: `static int data;
static volatile boolean ready;

void main() throws InterruptedException {
    Thread reader = Thread.ofPlatform().start(() -> {
        while (!ready) Thread.onSpinWait();
        IO.println("reader sees data = " + data);
    });
    data = 42;
    ready = true;
    reader.join();
}`,
        steps: [
          [1, ['cell data 0', 'cell ready false', 'thread m main'], 'Two fields in main memory: a plain `data` and a `volatile` `ready`.'],
          [5, ['thread r reader', 'edge main\'s actions so far → the reader starts'], 'Main starts the reader: everything main did before `start()` is visible to it.'],
          [6, ['read r ready'], 'The reader reads `ready`: false. Being volatile, it is read from memory every time round the loop.'],
          [9, ['set m data 42', 'write m data'], 'Main writes `data = 42`: a plain write.'],
          [10, ['set m ready true', 'write m ready', 'edge main writes ready (volatile) → the reader\'s read that sees it'], 'Main writes `ready = true`. A volatile write happens-before every later read of it, and `data = 42` came before it in main\'s program order.'],
          [6, ['read r ready'], 'The reader sees `true` and leaves the loop.'],
          [7, ['read r data', 'log reader sees data = 42'], 'By transitivity (data written, then ready written, then ready read, then data read) the reader must see 42. With the two writes swapped, it need not.'],
          [11, ['done r', 'edge the reader\'s actions → main\'s join() returns'], 'Main joins the reader.']
        ] },
      { id: 'start-join', label: 'start() and join() are edges too',
        desc: 'No volatile, no lock: the array element is plain, and still both reads are guaranteed.',
        code: `int[] box = new int[1];

void main() throws InterruptedException {
    box[0] = 1;
    Thread t = Thread.ofPlatform().start(() -> {
        IO.println("the thread sees " + box[0]);
        box[0] = 2;
    });
    t.join();
    IO.println("main sees " + box[0]);
}`,
        steps: [
          [1, ['cell box[0] 0', 'thread m main'], 'An array element: shared, plain, 0.'],
          [4, ['set m box[0] 1', 'write m box[0]'], 'Main writes 1.'],
          [5, ['thread t T', 'edge everything main did before start() → T\'s actions'], '`start()` happens-before everything the new thread does.'],
          [6, ['read t box[0]', 'log the thread sees 1'], 'So T is sure to see 1.'],
          [7, ['set t box[0] 2', 'write t box[0]'], 'T writes 2 and ends.'],
          [9, ['done t', 'edge everything T did → main\'s join() returns'], 'Everything a thread did happens-before another thread\'s `join()` on it returns.'],
          [10, ['read m box[0]', 'log main sees 2'], 'So main is sure to see 2. These two edges are why handing work to a thread, or an executor, and waiting for it is safe.']
        ] }
    ]
  });

  /* ---------------------------------------------------------------- batch 4 */

  /** The line of a program that holds this text: an explainer's steps stay right when the program changes. */
  function lineOf(code, text) {
    var i = code.indexOf(text);
    if (i < 0) throw new Error('explainer: no such line: ' + text);
    return code.slice(0, i).split('\n').length;
  }

  var CTX_IMPORTS = `import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.core.task.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.*;
import org.slf4j.MDC;
`;

  var LOST = CTX_IMPORTS + `
static String seen() { return "trace " + MDC.get("trace"); }

@Component
static class Later {
    @Async public CompletableFuture<String> run() { return CompletableFuture.completedFuture(seen()); }
}

@RestController
static class Web {
    final Later later;
    Web(Later later) { this.later = later; }
    @GetMapping("/orders") String orders() throws Exception {
        MDC.put("trace", "t-1");
        IO.println("handler: " + seen());
        String[] started = new String[1];
        Thread.ofVirtual().start(() -> started[0] = seen()).join();
        IO.println("a new thread: " + started[0]);
        IO.println("@Async: " + later.run().get());
        IO.println("supplyAsync: " + CompletableFuture.supplyAsync(() -> seen()).get());
        MDC.clear();
        return "ok";
    }
}

@EnableAutoConfiguration
@EnableAsync
@Import({ Web.class, Later.class })
static class App { }

void main() {
    try (var ctx = SpringApplication.run(App.class, "--spring.threads.virtual.enabled=true")) {
        var http = RestClient.create("http://localhost:" + ctx.getEnvironment().getProperty("local.server.port"));
        http.get().uri("/orders").retrieve().toBodilessEntity();
    }
}`;

  var DECORATED = LOST.replace(`@EnableAutoConfiguration
@EnableAsync
@Import({ Web.class, Later.class })
static class App { }`, `@EnableAutoConfiguration
@EnableAsync
@Import({ Web.class, Later.class })
static class App {
    @Bean TaskDecorator carryTheTrace() {
        return task -> {
            var copy = MDC.getCopyOfContextMap();
            return () -> {
                if (copy != null) MDC.setContextMap(copy);
                try {
                    task.run();
                } finally {
                    MDC.clear();
                }
            };
        };
    }
}`);

  var ROLLBACK = `import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.*;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;

@Service
static class Orders {
    final JdbcTemplate jdbc;
    Orders(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Transactional
    public void place() throws InterruptedException {
        jdbc.update("insert into orders values ('on the caller')");
        Thread.ofVirtual().start(() -> jdbc.update("insert into orders values ('on another thread')")).join();
        throw new IllegalStateException("something went wrong");
    }
}

@EnableAutoConfiguration
@EnableTransactionManagement
@Import(Orders.class)
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none")) {
        var jdbc = ctx.getBean(JdbcTemplate.class);
        jdbc.execute("create table orders(name varchar(40))");
        try {
            ctx.getBean(Orders.class).place();
        } catch (IllegalStateException e) {
            IO.println("rolled back: " + e.getMessage());
        }
        IO.println("the table has: " + jdbc.queryForList("select name from orders", String.class));
    }
}`;

  X.push({
    id: 'spring-context', track: 'spring', picture: 'bindings',
    title: 'A Spring request and its lost context',
    summary: 'A real request carries a trace id on its thread. Watch it vanish on a new thread, an @Async method and supplyAsync; come back with a TaskDecorator, for those it reaches; and see a rollback miss a row.',
    keywords: ['context', 'mdc', 'threadlocal', 'TaskDecorator', 'transaction', 'rollback', 'async', 'trace id'],
    intro: 'Spring keeps a request\'s context in `ThreadLocal`s: the logging context (`MDC`), the user, the request, the transaction. The picture shows what **the current thread** can see, and what each thread it starts can see. Everything printed here is a real Spring Boot application answering a real HTTP request.',
    outro: 'The rule behind all three: context follows the **thread**, and work does not stay on one thread when you fork. Lesson [[lesson:sp-context]] has the fixes, and [[lesson:sv-inheritance]] the Java 25 alternative: a `ScopedValue` reaches a scope\'s forks.',
    related: ['lesson:sp-context', 'lesson:sp-async', 'q:sp-context-lost'],
    examples: [
      { id: 'lost', label: 'Three ways to lose it',
        desc: 'The handler sets a trace id, then does work three ways. None of them sees it.',
        code: LOST,
        steps: [
          [lineOf(LOST, 'MDC.put("trace", "t-1")'), ['bind trace=t-1'], 'The request\'s thread sets a trace id in the `MDC`: a `ThreadLocal`, so only this thread has it.'],
          [lineOf(LOST, 'IO.println("handler: "'), ['log handler: trace t-1'], 'On the same thread it is there.'],
          [lineOf(LOST, 'Thread.ofVirtual().start'), ['child none a new thread', 'log a new thread: trace null'], 'A new thread starts with empty `ThreadLocal`s.'],
          [lineOf(LOST, 'IO.println("@Async: "'), ['child none @Async on applicationTaskExecutor', 'log @Async: trace null'], '`@Async` hands the method to the task executor: another thread, so nothing comes along.'],
          [lineOf(LOST, 'supplyAsync(() -> seen())'), ['child none supplyAsync on the common pool', 'log supplyAsync: trace null'], '`supplyAsync` with no executor uses the common pool: the same, and on a platform thread, even with virtual threads on.']
        ]
      },
      { id: 'decorated', label: 'A TaskDecorator',
        desc: 'The same program, with one `TaskDecorator` bean. Boot applies it to `applicationTaskExecutor`.',
        code: DECORATED,
        steps: [
          [lineOf(DECORATED, 'MDC.put("trace", "t-1")'), ['bind trace=t-1'], 'The same request, the same trace id.'],
          [lineOf(DECORATED, 'IO.println("handler: "'), ['log handler: trace t-1'], 'On the same thread it is there.'],
          [lineOf(DECORATED, 'Thread.ofVirtual().start'), ['child none a new thread', 'log a new thread: trace null'], 'A thread you start yourself does not go through the executor: **still lost**.'],
          [lineOf(DECORATED, 'var copy = MDC.getCopyOfContextMap()'), [], 'For `@Async`, the decorator runs first, **on the submitting thread**, and copies the map.'],
          [lineOf(DECORATED, 'IO.println("@Async: "'), ['child inherits @Async on applicationTaskExecutor', 'log @Async: trace t-1'], 'On the new thread it restores the copy, runs the task, and clears it in a `finally`. Now the trace id arrives.'],
          [lineOf(DECORATED, 'supplyAsync(() -> seen())'), ['child none supplyAsync on the common pool', 'log supplyAsync: trace null'], '`supplyAsync` with no executor never touches `applicationTaskExecutor`: **still lost**. Pass it the decorated executor.']
        ]
      },
      { id: 'rollback', label: 'The rollback that misses a row',
        desc: 'A `@Transactional` method writes on two threads, then fails.',
        code: ROLLBACK,
        steps: [
          [lineOf(ROLLBACK, '@Transactional'), ['bind transaction=open, one connection'], 'The proxy opens a transaction and binds its connection to this thread.'],
          [lineOf(ROLLBACK, "'on the caller'"), [], 'This insert finds the transaction on its thread, and joins it.'],
          [lineOf(ROLLBACK, "'on another thread'"), ['child none a new thread: its own connection, its own transaction'], 'This thread finds no transaction. `JdbcTemplate` takes another connection, inserts, and **commits at once**.'],
          [lineOf(ROLLBACK, 'throw new IllegalStateException'), ['pop'], 'The method throws: the proxy rolls back the transaction it opened. That covers one connection.'],
          [lineOf(ROLLBACK, 'IO.println("rolled back: "'), ['log rolled back: something went wrong'], 'The caller hears about the failure.'],
          [lineOf(ROLLBACK, 'IO.println("the table has: "'), ['log the table has: [on another thread]'], 'And **the row from the other thread is still there**. A transaction cannot follow you to another thread: it *is* one connection.']
        ]
      }
    ]
  });

  var CF_FAIL = `void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var price = CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(300);
                IO.println("price: finished anyway");
            } catch (InterruptedException e) {
                IO.println("price: cancelled");
            }
            return 250;
        }, executor);
        var stock = CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            IO.println("stock: failed");
            if (true) throw new IllegalStateException("stock down");
            return 4;
        }, executor);
        try {
            price.thenCombine(stock, (p, s) -> p * s).join();
        } catch (CompletionException e) {
            IO.println("caller: heard " + e.getCause().getMessage());
        }
    }
}`;

  var SCOPE_FAIL = `void main() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var price = scope.fork(() -> {
            try {
                Thread.sleep(300);
                IO.println("price: finished anyway");
            } catch (InterruptedException e) {
                IO.println("price: cancelled");
                throw e;
            }
            return 250;
        });
        var stock = scope.fork(() -> {
            Thread.sleep(100);
            IO.println("stock: failed");
            if (true) throw new IllegalStateException("stock down");
            return 4;
        });
        try {
            scope.join();
            IO.println(price.get() * stock.get());
        } catch (StructuredTaskScope.FailedException e) {
            Thread.sleep(50);
            IO.println("caller: heard " + e.getCause().getMessage());
        }
    }
}`;

  var CF_DEADLINE = `void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var finished = new CountDownLatch(1);
        var price = CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(300);
                IO.println("price: finished anyway");
            } catch (InterruptedException e) {
                IO.println("price: cancelled");
            }
            finished.countDown();
            return 250;
        }, executor).orTimeout(100, TimeUnit.MILLISECONDS);
        try {
            price.join();
        } catch (CompletionException e) {
            IO.println("caller: heard " + e.getCause().getClass().getSimpleName());
        }
        finished.await();
    }
}`;

  var SCOPE_DEADLINE = `void main() throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<Integer>awaitAllSuccessfulOrThrow(), cf -> cf.withTimeout(Duration.ofMillis(100)))) {
        var price = scope.fork(() -> {
            try {
                Thread.sleep(300);
                IO.println("price: finished anyway");
            } catch (InterruptedException e) {
                IO.println("price: cancelled");
                throw e;
            }
            return 250;
        });
        try {
            scope.join();
            IO.println(price.get());
        } catch (StructuredTaskScope.TimeoutException e) {
            Thread.sleep(50);
            IO.println("caller: heard " + e.getClass().getSimpleName());
        }
    }
}`;

  X.push({
    id: 'cf-vs-scope', track: 'spring', picture: 'timeline',
    title: 'CompletableFuture against a scope, when one call fails',
    summary: 'The same two calls, on a timeline. When one fails or runs late, one approach goes on working and waits, and the other stops at once and leaves nothing behind.',
    keywords: ['CompletableFuture', 'StructuredTaskScope', 'cancel', 'failure', 'timeout', 'thenCombine', 'orTimeout', 'deadline', 'aggregator'],
    intro: 'An endpoint calls two services: `price` takes 300 ms, `stock` 100 ms. Time runs down the page, one column per thread. The times are the programs\' own sleeps; the order of what they print is what the tests prove.',
    outro: 'A scope is a preview API in Java 25 ([[lesson:sc-patterns]]): if you cannot use one yet, you can still cancel by hand, but a `CompletableFuture` cancelled does not interrupt its running task ([[lesson:juc-completable]]). Lesson [[lesson:sp-aggregator]] builds the endpoint.',
    related: ['lesson:sp-aggregator', 'lesson:sc-failure', 'lesson:juc-completable', 'q:sp-fanout'],
    examples: [
      { id: 'cf-fails', label: 'CompletableFuture: stock fails',
        desc: '`thenCombine` waits for both futures, even though one has already failed.',
        code: CF_FAIL,
        steps: [
          [lineOf(CF_FAIL, 'var price ='), ['lane c caller', 'lane p price', 'lane s stock', 'at 0', 'mark p starts, 300 ms of work', 'mark s starts, 100 ms of work', 'mark c waits in join()'], 'Two calls start together.'],
          [lineOf(CF_FAIL, 'IO.println("stock: failed")'), ['at 100', 'mark s fails', 'log stock: failed'], 'At 100 ms `stock` fails. The answer is already decided: there will be no page.'],
          [lineOf(CF_FAIL, 'IO.println("price: finished anyway")'), ['at 300', 'mark p finishes anyway', 'log price: finished anyway'], 'Nothing told `price`. Another 200 ms of load on a service, for an answer nobody can use.'],
          [lineOf(CF_FAIL, 'IO.println("caller: heard "'), ['mark c hears, at last', 'log caller: heard stock down'], 'Only now does `join()` report it. **The caller paid for the slowest call, to hear about the fastest failure.**']
        ]
      },
      { id: 'scope-fails', label: 'A scope: stock fails',
        desc: 'The same two calls in a `StructuredTaskScope`.',
        code: SCOPE_FAIL,
        steps: [
          [lineOf(SCOPE_FAIL, 'var price ='), ['lane c caller', 'lane p price', 'lane s stock', 'at 0', 'mark p starts, 300 ms of work', 'mark s starts, 100 ms of work', 'mark c waits in join()'], 'Two forks, on two virtual threads.'],
          [lineOf(SCOPE_FAIL, 'IO.println("stock: failed")'), ['at 100', 'mark s fails', 'log stock: failed'], 'At 100 ms `stock` fails.'],
          [lineOf(SCOPE_FAIL, 'IO.println("price: cancelled")'), ['mark p interrupted', 'log price: cancelled'], 'The default joiner cancels the scope: `price` is interrupted in its `sleep`, 200 ms of work saved.'],
          [lineOf(SCOPE_FAIL, 'IO.println("caller: heard "'), ['at 150', 'mark c hears', 'log caller: heard stock down'], '`join()` throws at once (the `sleep(50)` is only so the printed order is certain). **The caller heard 150 ms sooner, and nothing is left running.**']
        ]
      },
      { id: 'cf-deadline', label: 'CompletableFuture: past the deadline',
        desc: '`orTimeout` fails the future. What happens to the work?',
        code: CF_DEADLINE,
        steps: [
          [lineOf(CF_DEADLINE, 'var price ='), ['lane c caller', 'lane p price', 'at 0', 'mark p starts, 300 ms of work', 'mark c waits in join()'], 'One call, a 100 ms deadline.'],
          [lineOf(CF_DEADLINE, 'IO.println("caller: heard "'), ['at 100', 'mark c hears', 'log caller: heard TimeoutException'], 'At 100 ms the **future** fails. The caller moves on.'],
          [lineOf(CF_DEADLINE, 'IO.println("price: finished anyway")'), ['at 300', 'mark p finishes anyway', 'log price: finished anyway'], 'But the **work** was not told: it ran to the end. A retry now means two of these running. `orTimeout` is a deadline for the caller, not for the work.']
        ]
      },
      { id: 'scope-deadline', label: 'A scope: past the deadline',
        desc: '`withTimeout` on the scope.',
        code: SCOPE_DEADLINE,
        steps: [
          [lineOf(SCOPE_DEADLINE, 'var price ='), ['lane c caller', 'lane p price', 'at 0', 'mark p starts, 300 ms of work', 'mark c waits in join()'], 'One fork, a 100 ms deadline.'],
          [lineOf(SCOPE_DEADLINE, 'IO.println("price: cancelled")'), ['at 100', 'mark p interrupted', 'log price: cancelled'], 'At 100 ms the scope is cancelled: the work is interrupted.'],
          [lineOf(SCOPE_DEADLINE, 'IO.println("caller: heard "'), ['at 150', 'mark c hears', 'log caller: heard TimeoutException'], '`join()` throws `TimeoutException`. The deadline applied to the work too.']
        ]
      }
    ]
  });

  X.push({
    id: 'throughput', track: 'spring', picture: 'simulator',
    title: 'The throughput simulator',
    summary: 'Requests a second, how long each waits, threads, connections. Move the sliders and see where the limit is, and watch it move from the thread pool to the database when you turn virtual threads on.',
    keywords: ['throughput', 'simulator', 'little\'s law', 'latency', 'thread pool', 'connection pool', 'capacity', 'load', 'saturation'],
    intro: 'A small model of one service: requests arrive evenly; each needs a thread for its whole life, and a connection for part of it. When arrivals pass what the service can do, a queue grows and latency climbs without limit. Little\'s law gives the ceiling: **threads ÷ seconds per request**, and **connections ÷ seconds holding one**. Whichever is lower is the limit.',
    outro: 'A model leaves things out: garbage collection, the database slowing down as it fills, time slicing. It shows where the limit is, not how the service behaves at it. Lessons [[lesson:sp-db-pool]] and [[lesson:sp-migrate]] are about the real thing.',
    related: ['lesson:sp-db-pool', 'lesson:sp-migrate', 'lesson:vt-why', 'q:sp-pool-limit'],
    examples: [
      { id: 'pool', label: 'A pool of 10, overloaded', desc: '100 requests a second, each 200 ms. Ten threads can do 50 a second, so the queue grows.',
        params: { rps: 100, serviceMs: 200, threads: 10, connections: 0, holdMs: 0, seconds: 10 } },
      { id: 'virtual', label: 'Virtual threads', desc: 'The same load, with no limit on threads. Nobody waits.',
        params: { rps: 100, serviceMs: 200, threads: 0, connections: 0, holdMs: 0, seconds: 10 } },
      { id: 'database', label: 'Virtual threads, and the database', desc: 'No limit on threads, but each request holds one of 10 connections for its whole 200 ms. The limit has only moved: exactly the same 50 a second.',
        params: { rps: 100, serviceMs: 200, threads: 0, connections: 10, holdMs: 200, seconds: 10 } },
      { id: 'short-tx', label: 'And a short transaction', desc: 'The same 200 ms, of which only 20 ms holds a connection ([[lesson:sp-db-pool]]). Now 10 connections can serve 500 a second.',
        params: { rps: 100, serviceMs: 200, threads: 0, connections: 10, holdMs: 20, seconds: 10 } }
    ],
    proof: {
      note: 'The first example, for real: a real Tomcat with 10 threads, then virtual threads, serving 200 requests of 200 ms each. The model says 200 × 200 ms ÷ 10 = 4 s at the least with 10 threads. It counts the answers too: a load test that does not check its responses can pass on load it never delivered.',
      code: `import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.net.http.*;

@RestController
static class Web {
    @GetMapping("/slow") String slow() throws Exception {
        Thread.sleep(200);
        return "ok";
    }
}

@EnableAutoConfiguration
@Import(Web.class)
static class App { }

static final AtomicInteger answered = new AtomicInteger();

// A burst can overflow the queue of connections waiting to be accepted: a refused one tries again.
static void send(HttpClient http, HttpRequest request) throws Exception {
    while (true) {
        try {
            if (http.send(request, HttpResponse.BodyHandlers.ofString()).statusCode() == 200) answered.incrementAndGet();
            return;
        } catch (java.net.ConnectException refused) {
            Thread.sleep(20);
        }
    }
}

long load(String... args) throws Exception {
    answered.set(0);
    try (var ctx = SpringApplication.run(App.class, args)) {
        var http = HttpClient.newHttpClient();
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + ctx.getEnvironment().getProperty("local.server.port") + "/slow")).build();
        long start = System.nanoTime();
        try (var clients = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 200; i++) {
                clients.submit(() -> { send(http, request); return null; });
            }
        }
        long ms = (System.nanoTime() - start) / 1_000_000;
        IO.println(answered + " of 200 answered");
        return ms;
    }
}

void main() throws Exception {
    long pool = load("--server.tomcat.threads.max=10", "--server.tomcat.accept-count=1000");
    long virtual = load("--spring.threads.virtual.enabled=true", "--server.tomcat.accept-count=1000");
    IO.println("10 threads: took at least the 4 s the model says: " + (pool >= 4000));
    IO.println("virtual threads: took less than half of that: " + (virtual < 2000));
}`,
      output: `200 of 200 answered
200 of 200 answered
10 threads: took at least the 4 s the model says: true
virtual threads: took less than half of that: true`
    }
  });
})(window.JCLT);
