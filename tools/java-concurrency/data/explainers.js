/*
 * data/explainers.js - the explainers (#/explain, js/views/explainers.js, batch 2): an idea that is hard to
 * see in code, taken apart one step at a time with a picture, then run for real.
 *
 * Explainer shape: {id, track, picture: 'carriers' | 'timeline' | 'tree' | 'bindings', title, summary,
 *   keywords, intro (Markdown), outro (Markdown), related: ['lesson:<id>', 'q:<id>'],
 *   examples: [{id, label, desc (Markdown), code (a whole program), jdk?: '21', steps}]}
 * Each step is [line, [operations], what happens (Markdown)]; line is the code line to highlight, from 1
 * (0 = none). The operations change the picture, in order. Every picture has:
 *   log T                 the program prints T (a line)
 * carriers:  carrier ID LABEL · vt ID LABEL · mount VT CARRIER · unmount VT · ready VT · pin VT · done VT
 * timeline:  lane ID LABEL · at MS · mark LANE TEXT
 * tree:      node ID PARENT LABEL (PARENT - for none) · state ID running|success|failed|cancelled|joining|closed
 * bindings:  bind NAME=VALUE · pop · child inherits|none LABEL
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
})(window.JCLT);
