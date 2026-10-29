/*
 * data/lessons-coroutines.js - Track 6, Coroutines: ten lessons on kotlinx.coroutines for a Java
 * developer (batch 4).
 *
 * The lesson shape is described at the top of data/lessons-basics.js. Every ```kotlin block runs in
 * tests/test_content.py with kotlinx.coroutines 1.11.0, and an ```output block after one is its exact
 * output. No program prints a thread number or a measured time, so each prints the same on every run:
 * programs whose output is about time run on runTest's fake clock (`currentTime`), and the others print
 * only what their order makes certain. Checks prove "these ran at the same time" on that fake clock too,
 * never by measuring real time. Code is written in template literals: a Kotlin ${…} is \${…}.
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function norun(code) { return '```kotlin-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function java(code) { return '```java\n' + code + '\n```'; }
  var L = U.data.lessons = U.data.lessons || [];
  var OPT_IN = '@file:OptIn(ExperimentalCoroutinesApi::class)\n\n';   // currentTime is experimental in kotlinx-coroutines-test

  /* ---------------------------------------------------------------- 1 */
  L.push({
    id: 'kt-coroutines-threads', track: 'coroutines', title: 'Coroutines and threads',
    summary: 'A coroutine is a computation that can pause without blocking its thread. runBlocking and launch, delay instead of Thread.sleep, a hundred thousand coroutines on one thread, and how they compare with Java\'s threads and virtual threads.',
    keywords: ['coroutine', 'coroutines', 'thread', 'virtual thread', 'runBlocking', 'launch', 'delay', 'Thread.sleep', 'lightweight', 'kotlinx.coroutines', 'Loom', 'concurrency'],
    docs: 'https://kotlinlang.org/docs/coroutines-basics.html',
    body: [
      '## A computation that can pause',
      'A **coroutine** is a piece of work that can *pause* (suspend) at certain points and carry on later, without holding a thread while it waits. Coroutines are not part of the language\'s standard library: they come from the library kotlinx.coroutines (version 1.11.0 in this tool; a Gradle project adds `org.jetbrains.kotlinx:kotlinx-coroutines-core`).',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    launch {
        delay(100)
        println("world")
    }
    println("hello")
}`),
      out(`hello
world`),
      '`runBlocking` starts a coroutine and blocks `main`\'s thread until that coroutine, and every coroutine started inside it, has finished: it is the bridge from ordinary code into coroutines. `launch` starts another coroutine and returns at once, so `hello` prints first. `delay(100)` pauses that coroutine for 100 ms; meanwhile the thread is free for other work.',
      '**A trap on the first day.** `fun main() = runBlocking { … }` gives `main` the type of the block\'s *last line*. Here that is `println`, which gives `Unit`. If the last line were the `launch { … }`, `main` would return a `Job`, and the JVM would find no `main` to run. End the block with a line that gives `Unit`, or write `runBlocking<Unit> { … }`; this tool\'s hint says so when it happens.',
      '## delay is not Thread.sleep',
      'Three coroutines, each waiting 100 ms between two lines. With `delay`, a coroutine that waits gives the thread back:',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    repeat(3) { i ->
        launch {
            println("start $i")
            delay(100)
            println("end $i")
        }
    }
}`),
      out(`start 0
start 1
start 2
end 0
end 1
end 2`),
      'All three start before any ends: their waits overlapped, on one thread. Now the same with `Thread.sleep`, which blocks the thread itself (the ⚠ in an editor warns about it):',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    repeat(3) { i ->
        launch {
            println("start $i")
            Thread.sleep(100)
            println("end $i")
        }
    }
}`),
      out(`start 0
end 0
start 1
end 1
start 2
end 2`),
      'The first coroutine holds the only thread for its whole wait, so the others cannot even start: the program takes three times as long. `runBlocking` runs everything here on `main`\'s one thread, which is also why the order is the same on every run.',
      '## A hundred thousand coroutines',
      'A coroutine is a small object, not an operating-system thread, so a program can have very many:',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    var finished = 0
    val threads = mutableSetOf<String>()
    val jobs = List(100_000) {
        launch {
            delay(1000)
            threads += Thread.currentThread().name
            finished++
        }
    }
    jobs.joinAll()
    println("$finished coroutines finished, on \${threads.size} thread")
}`),
      out('100000 coroutines finished, on 1 thread'),
      'All 100,000 waited their second at the same time, on one thread, in a little over a second. 100,000 platform threads would each need an operating-system thread and a stack of its own. (A plain `var` is safe here only because one thread runs every coroutine; [[lesson:kt-shared-state]] shows what to do when several threads do.)',
      '## A clock you can trust, for the examples',
      'Some programs in these lessons print *times*, to show what ran at the same time. Real time varies from run to run, so those run in `runTest` (from kotlinx-coroutines-test) instead of `runBlocking`. Its clock is fake: `delay` moves it forward at once, without waiting, and `currentTime` reads it, so the times printed are exact. Read `t=300` as "300 ms after the start". The first line opts in to `currentTime`, which the library marks as experimental. [[lesson:kt-flow-testing]] teaches `runTest` properly.',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.test.*

fun main() = runTest {
    launch { delay(300); println("t=$currentTime slow done") }
    launch { delay(100); println("t=$currentTime fast done") }
    delay(500)
    println("t=$currentTime main done")
}`),
      out(`t=100 fast done
t=300 slow done
t=500 main done`),
      '## Coroutines next to Java\'s threads',
      '| | Platform thread | Virtual thread (Java 21) | Coroutine |\n|---|---|---|---|\n| Made by | the operating system | the JVM | the kotlinx.coroutines library |\n| Cost | a stack of its own, about 1 MB | small | small |\n| Waiting | blocks the thread | parks it cheaply | suspends; the thread is free |\n| A blocking call (`Thread.sleep`, JDBC) | blocks | parks, mostly | blocks its thread: move it to `Dispatchers.IO` |\n| Cancelling | `interrupt()` | `interrupt()` | through the scope, for the whole tree |\n| Streams of values | none | none | `Flow` |',
      'Coroutines do not compute faster: CPU work runs on as many threads as there are cores either way. They make *waiting* cheap, and they let concurrent code read like ordinary sequential code. See [[q:coroutines-vs-threads]] for the interview version.'
    ].join('\n\n'),
    java: [
      java(`ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();
for (int i = 0; i < 3; i++) {
    int n = i;
    pool.submit(() -> {
        System.out.println("start " + n);
        Thread.sleep(100);          // parks a virtual thread; blocks a platform one
        System.out.println("end " + n);
        return null;
    });
}
pool.close();                       // waits for the tasks (Java 19+)`),
      'Java 21\'s virtual threads make waiting cheap too, and keep the blocking style. What coroutines add is **structure**: every coroutine belongs to a scope, the scope waits for it, and cancelling the scope cancels everything inside it, which Java leaves to you (or to the preview API `StructuredTaskScope`). Kotlin code calls `delay` where Java calls `Thread.sleep`, and `launch` where Java submits a task to an executor.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.*

fun main() = runBlocking {
    val names = listOf("Asha", "Ravi", "Li")
    for (name in names) {
        launch {
            delay(name.length * 100L)
            println("$name is ready")
        }
    }
    println("waiting for \${names.size} coroutines")
}`,
      note: 'Each coroutine waits as long as its name is long, so the shortest is ready first. Change `delay` to `Thread.sleep` (the ⚠ warns) and run it: now they finish in the order they started, one after another.'
    },
    challenge: {
      title: 'Breakfast, all at once',
      task: 'As given, `main` cooks the eggs, then the toast, then the coffee, blocking the thread with `Thread.sleep` for each. Make the three cook **at the same time**:\n\n1. Put each dish (its "start" line, its wait and its "done" line) in a `launch { … }` of its own.\n2. Wait with `delay` instead of `Thread.sleep`.\n3. After the three launches, end `main`\'s block with `println("all started")`.\n\nThe output should then be "all started", the three starts, and the three dishes done, quickest first.',
      starter: `import kotlinx.coroutines.*

fun main() = runBlocking {
    // Make these three cook at the same time: each in its own launch, with delay instead of Thread.sleep.
    // Then end the block with println("all started").
    println("eggs: start")
    Thread.sleep(300)
    println("eggs: done")
    println("toast: start")
    Thread.sleep(200)
    println("toast: done")
    println("coffee: start")
    Thread.sleep(100)
    println("coffee: done")
}`,
      solution: `import kotlinx.coroutines.*

fun main() = runBlocking {
    launch {
        println("eggs: start")
        delay(300)
        println("eggs: done")
    }
    launch {
        println("toast: start")
        delay(200)
        println("toast: done")
    }
    launch {
        println("coffee: start")
        delay(100)
        println("coffee: done")
    }
    println("all started")
}`,
      hints: [
        'Wrap each group of three lines in `launch { … }`. `launch` returns at once, so the next `launch` starts straight away.',
        '`delay(300)` pauses only its own coroutine and gives the thread back; `Thread.sleep(300)` holds the thread, so nothing else can run.',
        'If the run says there is no `main`: the block\'s last line must give `Unit`. That is what the final `println("all started")` is for.'
      ],
      checks: [
        { label: 'Every dish starts before the first one is done', code: 'val firstDone = lines.indexOfFirst { it.endsWith(": done") }\nok(firstDone > 0 && lines.take(firstDone).count { it.endsWith(": start") } == 3, "all three should start before any is done: $lines")' },
        { label: 'The quickest is done first: coffee, then toast, then eggs', code: 'eq(lines.filter { it.endsWith(": done") }, listOf("coffee: done", "toast: done", "eggs: done"))' },
        { label: '"all started" prints before any dish starts', code: 'eq(lines.firstOrNull(), "all started")' },
        { label: 'No `Thread.sleep`: each dish waits with `delay`', code: 'ok(!uses("""Thread\\s*\\.\\s*sleep""") && uses("""\\bdelay\\s*\\("""), "use delay(…) in each launch, and no Thread.sleep")' },
        { label: 'Each dish in a `launch` of its own', code: 'ok(Regex("""\\blaunch\\s*\\{""").findAll(source).count() >= 3, "three launch { … } blocks, one per dish")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'kt-suspend', track: 'coroutines', title: 'suspend functions',
    summary: 'A suspend function can pause without blocking its thread. Where it can be called, why calls run one after another by default, why suspend does not mean "in the background", the state machine the compiler makes of it, and wrapping a callback API.',
    keywords: ['suspend', 'suspend function', 'suspending', 'continuation', 'state machine', 'sequential', 'suspendCancellableCoroutine', 'callback', 'COROUTINE_SUSPENDED', 'CPS'],
    docs: 'https://kotlinlang.org/docs/composing-suspending-functions.html',
    body: [
      '## A function that can pause',
      'Mark a function `suspend`, and it may call other suspend functions, such as `delay`, which pause it without blocking the thread:',
      kt(`import kotlinx.coroutines.*

suspend fun fetchUser(id: Int): String {
    delay(100)
    return "user$id"
}

suspend fun fetchOrders(user: String): List<String> {
    delay(100)
    return listOf("$user-order1", "$user-order2")
}

suspend fun loadPage(id: Int): String {
    val user = fetchUser(id)
    val orders = fetchOrders(user)
    return "$user has \${orders.size} orders"
}

fun main() = runBlocking {
    println(loadPage(7))
}`),
      out('user7 has 2 orders'),
      'The code reads like ordinary blocking code: call, get a value, use it. No callbacks, no `thenApply`.',
      '**A suspend function can be called only from a coroutine or another suspend function.** From a plain `fun main()`, `delay(100)` does not compile: *Suspend function \'suspend fun delay(timeMillis: Long): Unit\' can only be called from a coroutine or another suspend function.* A suspend function may pause, and only a coroutine can be paused, so the compiler makes you start one first (`runBlocking`, `launch`, a framework\'s scope).',
      '## One after another, by default',
      'Two suspend calls in a row run in turn, like any two calls. On the fake clock (see [[lesson:kt-coroutines-threads]]), two 100 ms steps take 200 ms:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.test.*

suspend fun step(name: String): String {
    delay(100)
    return name
}

fun main() = runTest {
    val a = step("a")
    val b = step("b")
    println("$a$b at t=$currentTime")
}`),
      out('ab at t=200'),
      'That is the right default: the second call often needs the first one\'s result, as `fetchOrders` needs the user. Running independent calls *at the same time* is something you ask for, with `async` ([[lesson:kt-launch-async]]).',
      '## suspend does not mean "in the background"',
      '`suspend` moves nothing to another thread. A suspend function that only computes runs on its caller\'s thread, start to finish:',
      kt(`import kotlinx.coroutines.*

suspend fun sumTo(n: Int): Int = (1..n).sum()

fun main() = runBlocking {
    val caller = Thread.currentThread()
    val total = sumTo(100)
    println("$total, same thread: \${Thread.currentThread() === caller}")
}`),
      out('5050, same thread: true'),
      'And blocking code inside a suspend function still blocks the thread: `suspend fun load() { Thread.sleep(1000) }` holds its thread for a second, `suspend` or not. Moving work to other threads is the job of dispatchers ([[lesson:kt-dispatchers]]).',
      '## How it works: a state machine',
      'The JVM has no idea what pausing a function means, so the compiler rewrites every suspend function. It gets a hidden last parameter, a **continuation** object, and its body becomes a **state machine**: before each suspend call it stores a `label` saying where to carry on, and keeps in the object any local it needs afterwards. To pause, a function returns the marker `COROUTINE_SUSPENDED`, so every caller up the stack returns at once and the thread is free; to resume, the continuation calls the function again, and the label sends it to the right place. Roughly, for `loadPage`:',
      norun(`fun loadPage(id: Int, cont: Continuation<Any?>): Any? {
    val sm = cont as? LoadPageMachine ?: LoadPageMachine(id, cont)
    when (sm.label) {
        0 -> {
            sm.label = 1
            val r = fetchUser(id, sm)                  // may pause
            if (r === COROUTINE_SUSPENDED) return r    // the thread is free
            sm.user = r as String
        }
        1 -> sm.user = sm.result as String             // resumed with fetchUser's result
    }
    // state 2 calls fetchOrders(sm.user, sm) the same way, then returns the text
}`),
      'The explainer [[explain:suspend-state-machine]] shows this happening in a real run, a step at a time: the labels, the kept value, and the thread going free.',
      '## Wrapping a callback API',
      'Older APIs report their result through a callback. `suspendCancellableCoroutine` turns one into a suspend function: it pauses the coroutine and hands you its continuation, and the callback resumes it with the result:',
      kt(`import kotlinx.coroutines.*
import kotlin.coroutines.resume

// an old-style API: it answers later, on a thread of its own
fun fetchAsync(id: Int, onDone: (String) -> Unit) {
    Thread {
        Thread.sleep(50)
        onDone("user$id")
    }.start()
}

suspend fun fetch(id: Int): String = suspendCancellableCoroutine { cont ->
    fetchAsync(id) { result -> cont.resume(result) }
}

fun main() = runBlocking {
    println(fetch(7))
    println(fetch(8))
}`),
      out(`user7
user8`),
      'The caller sees a plain suspend function. A real wrapper would also cancel the underlying request when the coroutine is cancelled (`cont.invokeOnCancellation { … }`), and pass an error on with `cont.resumeWithException(e)`.'
    ].join('\n\n'),
    java: [
      java(`CompletableFuture<String> page = fetchUser(7)                  // CompletableFuture<String>
    .thenCompose(user -> fetchOrders(user)                     // CompletableFuture<List<String>>
        .thenApply(orders -> user + " has " + orders.size() + " orders"));
System.out.println(page.join());`),
      'Java chains futures, or blocks a thread (a virtual one, today) while it waits. A suspend function is written like the blocking version and behaves like the future version: the thread is free while it waits. Java\'s nearest cousin of the continuation is the callback you pass to `thenApply`; Kotlin\'s compiler writes those for you.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.*

suspend fun boil(): String {
    delay(300)
    return "hot water"
}

suspend fun brew(water: String): String {
    delay(200)
    return "tea made with $water"
}

fun main() = runBlocking {
    val water = boil()
    println("got $water")
    println(brew(water))
}`,
      note: 'Try calling `boil()` from a new plain function `fun quick() = boil()`: the compiler refuses, because only a coroutine can pause. Mark it `suspend fun quick()` and it compiles.'
    },
    challenge: {
      title: 'Prices, and a callback made suspend',
      task: 'Two suspend functions to write:\n\n1. `totalPrice(items)`: the sum of `fetchPrice(item)` for every item, fetched **one after another** (an empty list costs 0).\n2. `fetchUser(id)`: a suspend version of the callback API `loadUserAsync(id, callback)`, using `suspendCancellableCoroutine`. It should return what the callback receives.',
      starter: `import kotlinx.coroutines.*
import kotlin.coroutines.resume

suspend fun fetchPrice(item: String): Int {
    delay(100)
    return item.length * 10
}

// an old-style API: it calls back later, from a thread of its own
fun loadUserAsync(id: Int, callback: (String) -> Unit) {
    Thread {
        Thread.sleep(20)
        callback("user$id")
    }.start()
}

suspend fun totalPrice(items: List<String>): Int = TODO("the sum of fetchPrice(item) for each item, one after another")

suspend fun fetchUser(id: Int): String = TODO("wrap loadUserAsync with suspendCancellableCoroutine")

fun main() = runBlocking {
    println(totalPrice(listOf("tea", "milk")))
    println(fetchUser(7))
}`,
      solution: `import kotlinx.coroutines.*
import kotlin.coroutines.resume

suspend fun fetchPrice(item: String): Int {
    delay(100)
    return item.length * 10
}

// an old-style API: it calls back later, from a thread of its own
fun loadUserAsync(id: Int, callback: (String) -> Unit) {
    Thread {
        Thread.sleep(20)
        callback("user$id")
    }.start()
}

suspend fun totalPrice(items: List<String>): Int = items.sumOf { fetchPrice(it) }

suspend fun fetchUser(id: Int): String = suspendCancellableCoroutine { cont ->
    loadUserAsync(id) { user -> cont.resume(user) }
}

fun main() = runBlocking {
    println(totalPrice(listOf("tea", "milk")))
    println(fetchUser(7))
}`,
      hints: [
        '`items.sumOf { fetchPrice(it) }` works: `sumOf` is an inline function, so a suspend call inside its lambda is allowed. A `for` loop adding to a `var` works too.',
        '`suspendCancellableCoroutine { cont -> … }` pauses the coroutine and gives you `cont`. Start the callback API inside it, and in the callback call `cont.resume(value)`.'
      ],
      checks: [
        { label: '`totalPrice` adds up the prices', code: 'eq(runBlocking { totalPrice(listOf("tea", "milk")) }, 70)\neq(runBlocking { totalPrice(listOf("x")) }, 10)' },
        { label: 'An empty list costs 0', code: 'eq(runBlocking { totalPrice(emptyList()) }, 0)' },
        { label: 'One after another: three prices take 300 ms on the fake clock', code: 'runTest {\n    totalPrice(listOf("a", "b", "c"))\n    eq(currentTime, 300L)\n}' },
        { label: '`fetchUser` returns what the callback receives', code: 'eq(runBlocking { fetchUser(7) }, "user7")\neq(runBlocking { fetchUser(42) }, "user42")' },
        { label: '`fetchUser` uses `suspendCancellableCoroutine`', code: 'ok(uses("""suspendCancellableCoroutine"""), "wrap the callback with suspendCancellableCoroutine { cont -> … }")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'kt-launch-async', track: 'coroutines', title: 'launch and async',
    summary: 'launch starts work that gives no result and returns a Job; async starts work that gives a value and returns a Deferred. Running independent calls at the same time, awaitAll, a lazy start, and the two mistakes everyone makes once.',
    keywords: ['launch', 'async', 'await', 'Job', 'Deferred', 'awaitAll', 'join', 'concurrent', 'parallel', 'CoroutineStart.LAZY', 'concurrency'],
    docs: 'https://kotlinlang.org/docs/composing-suspending-functions.html',
    body: [
      '## Two builders',
      'Both start a coroutine in the current scope and return at once. `launch` is for work whose result you do not need; it returns a `Job`, which you can `join` (wait for) or `cancel`. `async` is for work that computes a value; it returns a `Deferred<T>`, a `Job` with a result, which `await()` gives:',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    val job: Job = launch {
        delay(100)
        println("logged")
    }
    val answer: Deferred<Int> = async {
        delay(50)
        6 * 7
    }
    println("answer: \${answer.await()}")
    job.join()
    println("job done: \${job.isCompleted}")
}`),
      out(`answer: 42
logged
job done: true`),
      '## At the same time',
      'Start two `async`s first, then await both, and the waits overlap. On the fake clock, two 100 ms calls take 100 ms instead of 200:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.test.*

suspend fun price(item: String): Int {
    delay(100)
    return item.length * 10
}

fun main() = runTest {
    val inTurn = price("apple") + price("pear")
    println("one after another: $inTurn at t=$currentTime")
    val start = currentTime
    val a = async { price("apple") }
    val b = async { price("pear") }
    println("at the same time: \${a.await() + b.await()} after \${currentTime - start} ms")
}`),
      out(`one after another: 90 at t=200
at the same time: 90 after 100 ms`),
      'This is *concurrency*: both waits are in progress at once. Whether they also run in *parallel*, on two threads, depends on the dispatcher; for waiting on a network or a database, concurrency is what matters.',
      '## Many at once: awaitAll',
      '`map` a list to `async`s, then `awaitAll()` waits for all of them and gives their results in order:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.test.*

suspend fun square(n: Int): Int {
    delay(100)
    return n * n
}

fun main() = runTest {
    val squares = (1..5).map { n -> async { square(n) } }.awaitAll()
    println("$squares at t=$currentTime")
}`),
      out('[1, 4, 9, 16, 25] at t=100'),
      'If one of them fails, `awaitAll` throws at once, and (as the next lesson shows) the scope cancels the others.',
      '## A lazy start',
      '`async(start = CoroutineStart.LAZY)` makes the coroutine but starts it only when someone calls `await()` or `start()`:',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    val report = async(start = CoroutineStart.LAZY) {
        println("computing the report")
        "report"
    }
    println("before")
    println(report.await())
}`),
      out(`before
computing the report
report`),
      '## Two mistakes everyone makes once',
      '| Written | What happens | Instead |\n|---|---|---|\n| `async { a() }.await()`, then `async { b() }.await()` | each waits before the next starts: no gain, extra cost | start both, then await both |\n| `async { save(x) }`, never awaited | works, but its failure goes unnoticed until the scope ends | `launch { save(x) }` for side effects |\n| `launch` for a value, read through a shared `var` | a race, and no way to get the value back cleanly | `async`, and `await()` the value |',
      'The interview version, with how each handles an exception: [[q:launch-vs-async]].'
    ].join('\n\n'),
    java: [
      java(`CompletableFuture<Integer> a = CompletableFuture.supplyAsync(() -> price("apple"));
CompletableFuture<Integer> b = CompletableFuture.supplyAsync(() -> price("pear"));
int total = a.join() + b.join();                       // blocks until both are done

List<CompletableFuture<Integer>> all = items.stream().map(i -> supplyAsync(() -> price(i))).toList();
CompletableFuture.allOf(all.toArray(new CompletableFuture[0])).join();`),
      '`async` is `supplyAsync`, `await()` is `join()` without blocking a thread, and `awaitAll()` is `allOf(…)` followed by a `join` on each. `launch` is `runAsync`, or `executor.submit` of a `Runnable`. The difference that matters: a coroutine started with either belongs to a scope, which waits for it and cancels it, where a future nobody joins is simply forgotten.'
    ].join('\n\n'),
    example: {
      code: OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.test.*

suspend fun fetch(what: String, ms: Long): String {
    delay(ms)
    return what
}

fun main() = runTest {
    val user = async { fetch("Asha", 100) }
    val orders = async { fetch("3 orders", 150) }
    val ads = async { fetch("no ads", 50) }
    println("\${user.await()}, \${orders.await()}, \${ads.await()}")
    println("ready at t=$currentTime")
}`,
      note: 'The page is ready when its slowest part is: 150 ms. Change it to await each one right after its `async` (`async { … }.await()`) and see the time become 300.'
    },
    challenge: {
      title: 'A dashboard in one wait',
      task: 'Write two suspend functions that load their parts **at the same time**:\n\n1. `loadDashboard()`: load the user (`loadUser()`, 100 ms) and the order count (`loadOrderCount()`, 150 ms) concurrently, and return `"Asha: 3 orders"`. It should take 150 ms, not 250.\n2. `prices(items)`: the price of every item, in order, all fetched at once with `async` and `awaitAll()`. Any number of items takes 100 ms.\n\nBoth are already inside `coroutineScope { … }`, which gives `async` a scope to run in ([[lesson:kt-structured-concurrency]] explains it).',
      starter: `import kotlinx.coroutines.*

suspend fun loadUser(): String {
    delay(100)
    return "Asha"
}

suspend fun loadOrderCount(): Int {
    delay(150)
    return 3
}

suspend fun price(item: String): Int {
    delay(100)
    return item.length * 10
}

suspend fun loadDashboard(): String = coroutineScope {
    TODO("load the user and the order count at the same time, then \\"Asha: 3 orders\\"")
}

suspend fun prices(items: List<String>): List<Int> = coroutineScope {
    TODO("an async per item, then awaitAll()")
}

fun main() = runBlocking {
    println(loadDashboard())
    println(prices(listOf("tea", "coffee")))
}`,
      solution: `import kotlinx.coroutines.*

suspend fun loadUser(): String {
    delay(100)
    return "Asha"
}

suspend fun loadOrderCount(): Int {
    delay(150)
    return 3
}

suspend fun price(item: String): Int {
    delay(100)
    return item.length * 10
}

suspend fun loadDashboard(): String = coroutineScope {
    val user = async { loadUser() }
    val count = async { loadOrderCount() }
    "\${user.await()}: \${count.await()} orders"
}

suspend fun prices(items: List<String>): List<Int> = coroutineScope {
    items.map { async { price(it) } }.awaitAll()
}

fun main() = runBlocking {
    println(loadDashboard())
    println(prices(listOf("tea", "coffee")))
}`,
      hints: [
        'Start both before awaiting either: `val user = async { loadUser() }`, `val count = async { loadOrderCount() }`, then build the text from `user.await()` and `count.await()`.',
        '`items.map { async { price(it) } }` gives a list of `Deferred<Int>`; `.awaitAll()` turns it into the list of prices, in the same order.'
      ],
      checks: [
        { label: '`loadDashboard()` gives "Asha: 3 orders"', code: 'eq(runBlocking { loadDashboard() }, "Asha: 3 orders")' },
        { label: 'The user and the orders load at the same time: 150 ms on the fake clock, not 250', code: 'runTest {\n    loadDashboard()\n    eq(currentTime, 150L)\n}' },
        { label: '`prices` gives every price, in order', code: 'eq(runBlocking { prices(listOf("tea", "coffee")) }, listOf(30, 60))\neq(runBlocking { prices(emptyList()) }, listOf<Int>())' },
        { label: 'Five prices take 100 ms: all fetched at once', code: 'runTest {\n    prices(List(5) { "item$it" })\n    eq(currentTime, 100L)\n}' },
        { label: '`prices` uses `awaitAll()`', code: 'ok(uses("""\\bawaitAll\\b"""), "map the items to async { … }, then awaitAll()")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'kt-structured-concurrency', track: 'coroutines', title: 'Structured concurrency',
    summary: 'Every coroutine has a parent, so coroutines form a tree: a parent waits for its children, cancelling it cancels them all, and a failing child cancels its siblings. coroutineScope, and why GlobalScope leaks.',
    keywords: ['structured concurrency', 'CoroutineScope', 'coroutineScope', 'scope', 'parent', 'child', 'Job', 'GlobalScope', 'leak', 'tree', 'failure', 'cancellation'],
    docs: 'https://kotlinlang.org/docs/coroutines-basics.html',
    body: [
      '## Every coroutine has a parent',
      '`launch` and `async` are called on a **scope** (a `CoroutineScope`), and the new coroutine becomes a child of the scope\'s job. Inside `runBlocking { … }` or `launch { … }`, `this` is a scope, which is why you can write `launch` with nothing in front of it. So the coroutines of a program form a tree, and three rules follow from it:',
      '1. **A parent is not done until all its children are.**\n2. **Cancelling a parent cancels all its children**, and theirs.\n3. **A child that fails cancels its parent**, which cancels the other children.',
      'The explainer [[explain:cancellation-tree]] draws the tree, and each rule at work, a step at a time.',
      '## A parent waits for its children',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    val parent = launch {
        launch {
            delay(200)
            println("child: done")
        }
        println("parent: its own code is done")
    }
    parent.join()
    println("main: the parent is done")
}`),
      out(`parent: its own code is done
child: done
main: the parent is done`),
      'The parent\'s block ended at once, but `join()` waited for the child too. You never have to remember to wait for the coroutines a function started: its scope does.',
      '## coroutineScope: a scope inside a suspend function',
      'A suspend function that starts coroutines needs a scope to start them in. `coroutineScope { … }` makes one, as a child of whoever called the function, and returns when the block and every coroutine started in it have finished:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.test.*

suspend fun loadPage(): String = coroutineScope {
    val profile = async { delay(100); "profile" }
    val feed = async { delay(150); "feed" }
    "\${profile.await()} + \${feed.await()}"
}

fun main() = runTest {
    println("\${loadPage()} at t=$currentTime")
}`),
      out('profile + feed at t=150'),
      '## A failure cancels the siblings',
      'If one child fails, the scope cancels the others and throws the exception to its caller, as an ordinary exception:',
      kt(`import kotlinx.coroutines.*

suspend fun loadPage(): String = coroutineScope {
    val profile = async {
        try {
            delay(1000)
            "profile"
        } finally {
            println("profile: cancelled")
        }
    }
    val feed = async<String> {
        delay(100)
        throw IllegalStateException("feed is down")
    }
    "\${profile.await()} + \${feed.await()}"
}

fun main() = runBlocking {
    try {
        println(loadPage())
    } catch (e: IllegalStateException) {
        println("caught: \${e.message}")
    }
}`),
      out(`profile: cancelled
caught: feed is down`),
      'Nothing is left running: the profile\'s work stopped as soon as the page could no longer be built. When the children *should* fail on their own, a supervisor does it ([[lesson:kt-coroutine-exceptions]]).',
      '## Why GlobalScope leaks',
      '`GlobalScope` is a scope with no job: a coroutine launched in it has **no parent**. Nothing waits for it and nothing cancels it, so it can outlive the work that started it:',
      kt(`import kotlinx.coroutines.*

@OptIn(DelicateCoroutinesApi::class)
fun main() {
    lateinit var leaked: Job
    runBlocking {
        leaked = GlobalScope.launch { delay(5000) }
        launch { delay(50) }
    }
    println("runBlocking is done; its child finished, the GlobalScope one is still active: \${leaked.isActive}")
    leaked.cancel()
}`),
      out('runBlocking is done; its child finished, the GlobalScope one is still active: true'),
      '`runBlocking` waited for its own child, and not for the other. In a server, a coroutine like that keeps running after the request it belonged to has failed or been cancelled. The compiler warns that `GlobalScope` is "a delicate API" (the `@OptIn` silences that here, on purpose), and the ⚠ in the editor says the same.'
    ].join('\n\n'),
    java: [
      java(`// Java 21+, preview: StructuredTaskScope
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Subtask<String> profile = scope.fork(() -> loadProfile());
    Subtask<String> feed = scope.fork(() -> loadFeed());
    scope.join().throwIfFailed();       // waits for both; a failure cancels the other
    return profile.get() + " + " + feed.get();
}`),
      'Java is getting the same idea as a preview API, `StructuredTaskScope`, whose shape changes from one JDK to the next. In Kotlin it is not an API you remember to use: every coroutine has a scope, so the structure is the default. An `ExecutorService` is the opposite: tasks submitted to it belong to nobody, like `GlobalScope`\'s coroutines.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.*

fun main() = runBlocking {
    val parent = launch {
        repeat(3) { i ->
            launch {
                try {
                    delay(1000L * (i + 1))
                    println("child $i finished")
                } finally {
                    println("child $i stops")
                }
            }
        }
    }
    delay(100)
    parent.cancel()
    parent.join()
    println("everything under the parent has stopped")
}`,
      note: 'Cancelling the parent stopped all three children. Remove `parent.cancel()`: now `join()` waits three seconds, for the slowest child.'
    },
    challenge: {
      title: 'A page that fails cleanly',
      task: 'Write two suspend functions:\n\n1. `loadPage(failFeed)`: run `part("profile", 200)` and `part("feed", 100, failFeed)` **at the same time** inside `coroutineScope`, and return `"profile + feed"`. When the feed fails, the profile must be cancelled (`part` logs that by itself) and the exception thrown to the caller.\n2. `loadOrError(failFeed)`: return `loadPage(failFeed)`, or `"error: "` and the exception\'s message when it throws an `IllegalStateException`.\n\nNo `GlobalScope`.',
      starter: `import kotlinx.coroutines.*

val log = mutableListOf<String>()

suspend fun part(name: String, ms: Long, fail: Boolean = false): String {
    try {
        delay(ms)
        if (fail) throw IllegalStateException("$name failed")
        return name
    } catch (e: CancellationException) {
        log += "$name cancelled"
        throw e
    }
}

suspend fun loadPage(failFeed: Boolean = false): String = coroutineScope {
    TODO("the profile (200 ms) and the feed (100 ms) at the same time")
}

suspend fun loadOrError(failFeed: Boolean): String = TODO("the page, or \\"error: \\" and the message")

fun main() = runBlocking {
    println(loadOrError(false))
    println(loadOrError(true))
    println(log)
}`,
      solution: `import kotlinx.coroutines.*

val log = mutableListOf<String>()

suspend fun part(name: String, ms: Long, fail: Boolean = false): String {
    try {
        delay(ms)
        if (fail) throw IllegalStateException("$name failed")
        return name
    } catch (e: CancellationException) {
        log += "$name cancelled"
        throw e
    }
}

suspend fun loadPage(failFeed: Boolean = false): String = coroutineScope {
    val profile = async { part("profile", 200) }
    val feed = async { part("feed", 100, failFeed) }
    "\${profile.await()} + \${feed.await()}"
}

suspend fun loadOrError(failFeed: Boolean): String =
    try {
        loadPage(failFeed)
    } catch (e: IllegalStateException) {
        "error: \${e.message}"
    }

fun main() = runBlocking {
    println(loadOrError(false))
    println(loadOrError(true))
    println(log)
}`,
      hints: [
        'Inside `coroutineScope`, start both with `async`, then build `"\${profile.await()} + \${feed.await()}"`. The scope does the rest: when the feed throws, it cancels the profile and rethrows.',
        '`loadOrError` is an ordinary `try { loadPage(failFeed) } catch (e: IllegalStateException) { "error: \${e.message}" }`: an expression, so the function can be `= try { … }`.'
      ],
      checks: [
        { label: '`loadPage()` gives "profile + feed"', code: 'eq(runBlocking { loadPage() }, "profile + feed")' },
        { label: 'The two parts load at the same time: 200 ms on the fake clock', code: 'runTest {\n    loadPage()\n    eq(currentTime, 200L)\n}' },
        { label: 'When the feed fails, the profile is cancelled', code: 'log.clear()\nrunBlocking { try { loadPage(failFeed = true) } catch (e: IllegalStateException) { } }\nok("profile cancelled" in log, "the profile should be cancelled when the feed fails; the log says $log")' },
        { label: '`loadOrError` turns the failure into "error: feed failed"', code: 'eq(runBlocking { loadOrError(true) }, "error: feed failed")\neq(runBlocking { loadOrError(false) }, "profile + feed")' },
        { label: 'No `GlobalScope`', code: 'ok(!uses("""GlobalScope"""), "a coroutine in GlobalScope has no parent: the failure would not cancel it")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'kt-cancellation', track: 'coroutines', title: 'Cancellation and timeouts',
    summary: 'Cancelling a coroutine only asks it to stop: it stops at its next suspension point, and code that never suspends must check. finally and NonCancellable, withTimeout and withTimeoutOrNull, and never swallowing CancellationException.',
    keywords: ['cancellation', 'cancel', 'cooperative', 'CancellationException', 'isActive', 'ensureActive', 'yield', 'NonCancellable', 'withTimeout', 'withTimeoutOrNull', 'TimeoutCancellationException', 'finally', 'runCatching'],
    docs: 'https://kotlinlang.org/docs/coroutines-cancellation.html',
    body: [
      '## cancel() asks; a suspension point answers',
      '`job.cancel()` marks a coroutine as cancelled. The coroutine notices at its next **suspension point**: every suspend function of kotlinx.coroutines (`delay`, `await`, `withContext`, a channel\'s `send`…) checks, and throws `CancellationException` if the coroutine was cancelled. That exception unwinds the coroutine like any other, so `finally` blocks run:',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    val job = launch {
        try {
            repeat(10) { i ->
                println("working $i")
                delay(100)
            }
        } finally {
            println("cleaning up")
        }
    }
    delay(250)
    job.cancelAndJoin()
    println("cancelled: \${job.isCancelled}")
}`),
      out(`working 0
working 1
working 2
cleaning up
cancelled: true`),
      '`cancelAndJoin()` is `cancel()` followed by `join()`: ask, then wait until it has really stopped.',
      '## Code that never suspends never stops',
      'Cancellation is **cooperative**. A loop that only computes reaches no suspension point, so it cannot notice. Two loops on worker threads, both cancelled after 100 ms; only one checks:',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    val start = System.currentTimeMillis()
    val stubborn = launch(Dispatchers.Default) {
        var spins = 0L
        while (System.currentTimeMillis() - start < 500) {
            spins++
        }
        println("stubborn: ran to its end, ignoring the cancel")
    }
    val polite = launch(Dispatchers.Default) {
        try {
            while (true) {
                ensureActive()
            }
        } finally {
            println("polite: stopped at its check")
        }
    }
    delay(100)
    polite.cancelAndJoin()
    stubborn.cancelAndJoin()
    println("both done")
}`),
      out(`polite: stopped at its check
stubborn: ran to its end, ignoring the cancel
both done`),
      '`ensureActive()` throws `CancellationException` once the coroutine is cancelled; `if (!isActive) break` is the same check, by hand. `yield()` checks too, and also lets other coroutines waiting for the thread run, which matters when they share one thread.',
      '## Clean-up that has to suspend',
      'Once a coroutine is cancelled, every suspend call in it throws at once, even in `finally`. Clean-up that must suspend (saving a draft, closing a connection politely) goes in `withContext(NonCancellable) { … }`:',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    val careless = launch {
        try {
            delay(10_000)
        } finally {
            delay(50)
            println("careless: saved")
        }
    }
    val careful = launch {
        try {
            delay(10_000)
        } finally {
            withContext(NonCancellable) {
                delay(50)
                println("careful: saved")
            }
        }
    }
    delay(100)
    careless.cancelAndJoin()
    careful.cancelAndJoin()
    println("both closed")
}`),
      out(`careful: saved
both closed`),
      '"careless: saved" never printed: its `delay(50)` threw straight away.',
      '## Timeouts',
      '`withTimeout(ms) { … }` cancels its block when the time runs out, and throws `TimeoutCancellationException`; `withTimeoutOrNull` returns null instead, which is usually easier to handle:',
      kt(`import kotlinx.coroutines.*

suspend fun slowSearch(): String {
    delay(1000)
    return "results"
}

fun main() = runBlocking {
    val quick = withTimeoutOrNull(2000) { slowSearch() }
    val tooSlow = withTimeoutOrNull(100) { slowSearch() }
    println("$quick, $tooSlow")
    try {
        println(withTimeout(100) { slowSearch() })
    } catch (e: TimeoutCancellationException) {
        println("timed out: \${e.message}")
    }
}`),
      out(`results, null
timed out: Timed out waiting for 100 ms`),
      '## Never swallow CancellationException',
      'Cancellation travels as an exception, so code that catches every exception catches it too, and the coroutine carries on as if nothing happened. `runCatching` around a suspend call is the usual culprit:',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    val job = launch {
        repeat(3) { i ->
            val r = runCatching { delay(100) }
            println("step $i: \${if (r.isFailure) "cancellation swallowed" else "ok"}")
        }
    }
    delay(150)
    job.cancelAndJoin()
}`),
      out(`step 0: ok
step 1: cancellation swallowed
step 2: cancellation swallowed`),
      'The loop went on after it was cancelled. Catch the exceptions you mean (`catch (e: IOException)`), rethrow a `CancellationException` if you catch broadly, or call `ensureActive()` after the `catch`. See [[q:cancellation]].'
    ].join('\n\n'),
    java: [
      java(`Future<?> task = executor.submit(() -> {
    while (!Thread.currentThread().isInterrupted()) {   // the loop must check, as in Kotlin
        work();
    }
});
task.cancel(true);                                       // sets the interrupt flag
// a blocking call (sleep, wait, I/O) throws InterruptedException; a catch that ignores it hides the cancel`),
      'Java\'s interruption is cooperative too, and has the same trap: catching `InterruptedException` and carrying on swallows the request to stop. The differences: in Kotlin, cancelling a parent cancels the whole tree of coroutines under it; every suspend call is a cancellation point; and a timeout is just a cancellation with a clock.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.*

fun main() = runBlocking {
    val download = launch {
        try {
            for (percent in 0..100 step 25) {
                println("downloaded $percent%")
                delay(100)
            }
        } finally {
            println("download closed")
        }
    }
    delay(220)
    println("user pressed cancel")
    download.cancelAndJoin()
    println("done")
}`,
      note: 'The download stopped at its next `delay`, and its `finally` ran. Change `delay(220)` to `delay(1000)` and the download finishes before the cancel arrives.'
    },
    challenge: {
      title: 'Brewing, with a timer and a kettle',
      task: 'Three things to fix:\n\n1. `brew(minutes)` should turn the kettle off however it ends: add a `finally` that adds `"kettle off"` to the `log`.\n2. `brewAtMost(minutes, limitMs)`: brew, but stop when `limitMs` runs out. Return `true` if the tea was made in time, `false` if the timer cut it short. Use `withTimeoutOrNull`.\n3. `crunch(n)` counts in a loop that never suspends, so it cannot be cancelled. Make it cooperative: call `yield()` in each round (it checks for cancellation, and lets other coroutines run).',
      starter: `import kotlinx.coroutines.*

val log = mutableListOf<String>()
var crunched = 0

suspend fun brew(minutes: Int) {
    // turn the kettle off however brewing ends: add a finally
    repeat(minutes) { m ->
        delay(100)
        log += "minute \${m + 1}"
    }
}

suspend fun brewAtMost(minutes: Int, limitMs: Long): Boolean = TODO("true if brew finished within limitMs, else false")

suspend fun crunch(n: Int) {
    crunched = 0
    while (crunched < n) {
        crunched++      // make this loop cancellable
    }
}

fun main() = runBlocking {
    println(brewAtMost(3, 1000))
    println(brewAtMost(5, 250))
    println(log)
}`,
      solution: `import kotlinx.coroutines.*

val log = mutableListOf<String>()
var crunched = 0

suspend fun brew(minutes: Int) {
    try {
        repeat(minutes) { m ->
            delay(100)
            log += "minute \${m + 1}"
        }
    } finally {
        log += "kettle off"
    }
}

suspend fun brewAtMost(minutes: Int, limitMs: Long): Boolean =
    withTimeoutOrNull(limitMs) { brew(minutes) } != null

suspend fun crunch(n: Int) {
    crunched = 0
    while (crunched < n) {
        yield()
        crunched++
    }
}

fun main() = runBlocking {
    println(brewAtMost(3, 1000))
    println(brewAtMost(5, 250))
    println(log)
}`,
      hints: [
        '`try { … } finally { log += "kettle off" }` around the loop: `finally` runs when the loop ends, when it throws, and when it is cancelled.',
        '`withTimeoutOrNull(limitMs) { brew(minutes) }` gives the block\'s value (`Unit` here) in time, or null: compare it with `null`.',
        'Put `yield()` at the top of the `while` loop. On one thread, it is also what lets the code that cancels you run at all.'
      ],
      checks: [
        { label: 'In time: `brewAtMost(3, 1000)` is true, and the kettle goes off', code: 'log.clear()\nrunTest { eq(brewAtMost(3, 1000), true) }\neq(log, listOf("minute 1", "minute 2", "minute 3", "kettle off"))' },
        { label: 'Too slow: `brewAtMost(5, 250)` is false, and the kettle still goes off', code: 'log.clear()\nrunTest { eq(brewAtMost(5, 250), false) }\neq(log, listOf("minute 1", "minute 2", "kettle off"))' },
        { label: 'The timer stops brewing at 250 ms on the fake clock', code: 'runTest {\n    brewAtMost(5, 250)\n    eq(currentTime, 250L)\n}' },
        { label: '`crunch` can be cancelled while it counts', code: 'runTest {\n    val job = launch { crunch(1_000_000) }\n    yield()\n    job.cancelAndJoin()\n}\nok(crunched < 1_000_000, "crunch should stop soon after it is cancelled; it counted all the way to $crunched")' },
        { label: 'Uncancelled, `crunch` still counts to the end', code: 'runTest { crunch(500) }\neq(crunched, 500)' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 6 */
  L.push({
    id: 'kt-dispatchers', track: 'coroutines', title: 'Dispatchers and context',
    summary: 'A dispatcher decides which threads a coroutine runs on: Default for CPU work, IO for blocking calls, Main for a UI. withContext switches and returns a result, limitedParallelism caps a pool, and a coroutine\'s context holds its job, dispatcher and name.',
    keywords: ['dispatcher', 'Dispatchers.Default', 'Dispatchers.IO', 'Dispatchers.Main', 'Unconfined', 'withContext', 'limitedParallelism', 'main-safe', 'CoroutineContext', 'CoroutineName', 'thread pool', 'blocking'],
    docs: 'https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html',
    body: [
      '## Which thread? The dispatcher decides',
      'Every coroutine runs on a **dispatcher**, which hands it threads. `runBlocking` uses the thread that called it; `launch` and `async` use their parent\'s, unless you pass another:',
      kt(`import kotlinx.coroutines.*

fun worker() = Thread.currentThread().name.startsWith("DefaultDispatcher-worker")

fun main() = runBlocking {
    println("runBlocking runs on: \${Thread.currentThread().name}")
    launch { println("a child, by default on: \${Thread.currentThread().name}") }.join()
    launch(Dispatchers.Default) { println("Dispatchers.Default, a worker thread: \${worker()}") }.join()
    launch(Dispatchers.IO) { println("Dispatchers.IO, a worker thread: \${worker()}") }.join()
}`),
      out(`runBlocking runs on: main
a child, by default on: main
Dispatchers.Default, a worker thread: true
Dispatchers.IO, a worker thread: true`),
      '| Dispatcher | Threads | For |\n|---|---|---|\n| `Dispatchers.Default` | as many as the CPU has cores | CPU work: sorting, parsing, JSON, image work |\n| `Dispatchers.IO` | many more (64, or the number of cores if larger), shared with Default | blocking calls: JDBC, files, old HTTP clients |\n| `Dispatchers.Main` | the UI thread (Android, Swing, JavaFX) | touching the UI; not on a server |\n| `Dispatchers.Unconfined` | whichever thread resumes it | rarely right: tests and special cases |',
      '**Do not mix them up.** A blocking call on `Default` takes one of its few threads and starves the CPU work waiting behind it; CPU work on `IO` can run on far more threads than there are cores.',
      '## withContext: switch, wait, return',
      '`withContext(dispatcher) { … }` runs a block on another dispatcher, suspends the caller until it is done, and returns its result. It starts no new coroutine; it moves the current one:',
      kt(`import kotlinx.coroutines.*

fun blockingRead(): String {
    Thread.sleep(50)
    return "alpha beta gamma"
}

fun main() = runBlocking {
    val text = withContext(Dispatchers.IO) { blockingRead() }
    val words = withContext(Dispatchers.Default) { text.split(" ").size }
    println("$words words, back on \${Thread.currentThread().name}")
}`),
      out('3 words, back on main'),
      '## Main-safe functions',
      'The habit that makes this easy to get right: **a function that blocks switches to `IO` itself**, so its callers never need to know. Then any coroutine, on any dispatcher (a UI thread included), can call it:',
      kt(`import kotlinx.coroutines.*

fun queryDatabase(id: Int): String {
    Thread.sleep(50)                 // a JDBC call, say
    return "row $id"
}

suspend fun loadRow(id: Int): String = withContext(Dispatchers.IO) {
    queryDatabase(id)
}

fun main() = runBlocking {
    println(loadRow(7))
}`),
      out('row 7'),
      '## limitedParallelism: a pool of your own size',
      '`Dispatchers.IO.limitedParallelism(n)` gives a view of `IO` that runs at most `n` coroutines at once: one per connection of a pool of `n`, say. Twelve blocking queries, at most three at a time:',
      kt(`import kotlinx.coroutines.*
import java.util.concurrent.atomic.AtomicInteger

val running = AtomicInteger()
val most = AtomicInteger()

fun query(id: Int): Int {
    most.accumulateAndGet(running.incrementAndGet(), ::maxOf)
    Thread.sleep(30)
    running.decrementAndGet()
    return id * 10
}

val database = Dispatchers.IO.limitedParallelism(3)

fun main() = runBlocking {
    val results = (1..12).map { id ->
        async(database) { query(id) }
    }.awaitAll()
    println("\${results.sum()}, never more than 3 at once: \${most.get() <= 3}")
}`),
      out('780, never more than 3 at once: true'),
      'Make the view once, keep it in a `val`, and share it: each call to `limitedParallelism` makes a new view with a limit of its own, so calling it inside the `map` would allow twelve at once.',
      '## The coroutine context',
      'A coroutine carries a **context**: a small map of elements, among them its `Job`, its dispatcher, a `CoroutineName` for debugging, and a `CoroutineExceptionHandler`. Elements combine with `+`, a child inherits its parent\'s context (with a new `Job` of its own), and `coroutineContext[Key]` reads one:',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    launch(Dispatchers.Default + CoroutineName("loader")) {
        println("name: \${coroutineContext[CoroutineName]?.name}")
        launch {
            println("its child inherits the name: \${coroutineContext[CoroutineName]?.name}")
        }
    }.join()
}`),
      out(`name: loader
its child inherits the name: loader`),
      'Run with the JVM option `-Dkotlinx.coroutines.debug`, and thread names in logs and stack traces show the coroutine\'s name too.'
    ].join('\n\n'),
    java: [
      java(`ExecutorService cpu = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
ExecutorService io = Executors.newCachedThreadPool();

CompletableFuture<String> text = CompletableFuture.supplyAsync(() -> blockingRead(), io);
CompletableFuture<Integer> words = text.thenApplyAsync(t -> t.split(" ").length, cpu);`),
      'A dispatcher is Kotlin\'s executor, and `Default` and `IO` are two shared ones that everybody uses, so you rarely make your own. `withContext` is the part Java lacks: the code stays sequential while it hops between pools, and comes back to where it started. On Android, `Dispatchers.Main` plays the part of `runOnUiThread`.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.*

fun where() = if (Thread.currentThread().name == "main") "main" else "a worker"

suspend fun parse(text: String): List<Int> = withContext(Dispatchers.Default) {
    println("parsing on \${where()}")
    text.split(",").map { it.trim().toInt() }
}

fun main() = runBlocking {
    println("starting on \${where()}")
    val numbers = parse("4, 8, 15, 16, 23, 42")
    println("sum \${numbers.sum()}, back on \${where()}")
}`,
      note: 'Change `Dispatchers.Default` to `Dispatchers.IO`: still a worker (they share threads). Remove the `withContext` and everything runs on `main`.'
    },
    challenge: {
      title: 'Main-safe, and at most two at once',
      task: 'Three suspend functions over the blocking functions given:\n\n1. `loadConfig()`: return `readConfig()`, run on `Dispatchers.IO`, so the function is main-safe.\n2. `countWords(text)`: the number of words (split on spaces), counted on `Dispatchers.Default`.\n3. `queryAll(ids)`: `query(id)` for every id, **at the same time**, but **at most two at once** (the database allows two connections): use `async` with `Dispatchers.IO.limitedParallelism(2)`. Return the results in the order of `ids`.',
      starter: `import kotlinx.coroutines.*
import java.util.concurrent.atomic.AtomicInteger

var configThread = ""
val running = AtomicInteger()
val mostAtOnce = AtomicInteger()

fun readConfig(): String {
    configThread = Thread.currentThread().name
    Thread.sleep(30)
    return "debug=false"
}

fun query(id: Int): String {
    mostAtOnce.accumulateAndGet(running.incrementAndGet(), ::maxOf)
    Thread.sleep(40)
    running.decrementAndGet()
    return "row $id"
}

suspend fun loadConfig(): String = TODO("readConfig() on Dispatchers.IO")

suspend fun countWords(text: String): Int = TODO("count the words on Dispatchers.Default")

suspend fun queryAll(ids: List<Int>): List<String> = coroutineScope {
    TODO("query every id at the same time, at most two at once")
}

fun main() = runBlocking {
    println(loadConfig())
    println(countWords("one two three"))
    println(queryAll(listOf(1, 2, 3)))
}`,
      solution: `import kotlinx.coroutines.*
import java.util.concurrent.atomic.AtomicInteger

var configThread = ""
val running = AtomicInteger()
val mostAtOnce = AtomicInteger()

fun readConfig(): String {
    configThread = Thread.currentThread().name
    Thread.sleep(30)
    return "debug=false"
}

fun query(id: Int): String {
    mostAtOnce.accumulateAndGet(running.incrementAndGet(), ::maxOf)
    Thread.sleep(40)
    running.decrementAndGet()
    return "row $id"
}

suspend fun loadConfig(): String = withContext(Dispatchers.IO) { readConfig() }

suspend fun countWords(text: String): Int = withContext(Dispatchers.Default) {
    text.split(" ").filter { it.isNotEmpty() }.size
}

val database = Dispatchers.IO.limitedParallelism(2)

suspend fun queryAll(ids: List<Int>): List<String> = coroutineScope {
    ids.map { id -> async(database) { query(id) } }.awaitAll()
}

fun main() = runBlocking {
    println(loadConfig())
    println(countWords("one two three"))
    println(queryAll(listOf(1, 2, 3)))
}`,
      hints: [
        '`suspend fun loadConfig(): String = withContext(Dispatchers.IO) { readConfig() }`: the block\'s value is the function\'s.',
        'Make the limited dispatcher once: `val database = Dispatchers.IO.limitedParallelism(2)`. Then `ids.map { id -> async(database) { query(id) } }.awaitAll()`.'
      ],
      checks: [
        { label: '`loadConfig()` gives the config', code: 'eq(runBlocking { loadConfig() }, "debug=false")' },
        { label: '`readConfig` runs on a worker thread, not the caller\'s', code: 'runBlocking { loadConfig() }\nok(configThread.startsWith("DefaultDispatcher-worker"), "readConfig ran on \\"$configThread\\": run it in withContext(Dispatchers.IO)")' },
        { label: '`countWords` counts the words', code: 'eq(runBlocking { countWords("one two three") }, 3)\neq(runBlocking { countWords("solo") }, 1)' },
        { label: '`queryAll` gives every row, in order', code: 'eq(runBlocking { queryAll(listOf(3, 1, 2)) }, listOf("row 3", "row 1", "row 2"))' },
        { label: 'Two at once, and never more', code: 'mostAtOnce.set(0)\nrunBlocking { queryAll((1..8).toList()) }\neq(mostAtOnce.get(), 2)' },
        { label: '`loadConfig` uses `withContext(Dispatchers.IO)`, and `queryAll` uses `limitedParallelism`', code: 'ok(uses("""withContext\\s*\\(\\s*Dispatchers\\s*\\.\\s*IO""") && uses("""limitedParallelism\\s*\\(\\s*2\\s*\\)"""), "withContext(Dispatchers.IO) in loadConfig, limitedParallelism(2) for the queries")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 7 */
  L.push({
    id: 'kt-coroutine-exceptions', track: 'coroutines', title: 'Exceptions in coroutines',
    summary: 'An exception a coroutine does not catch travels up its tree: it cancels the parent and the siblings. launch against async, why a try around launch catches nothing, SupervisorJob and supervisorScope, and where a CoroutineExceptionHandler takes effect.',
    keywords: ['exception', 'exceptions', 'coroutine exception', 'SupervisorJob', 'supervisorScope', 'CoroutineExceptionHandler', 'propagation', 'await', 'try catch', 'failure', 'CancellationException'],
    docs: 'https://kotlinlang.org/docs/exception-handling.html',
    body: [
      '## Up the tree',
      'In a normal scope, an exception that a child coroutine does not catch **fails the child, then its parent**: the parent cancels its other children, and the failure goes on up until something handles it. Inside `coroutineScope`, "something" is the caller: `coroutineScope` throws the exception, as an ordinary one, once every child has stopped:',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking<Unit> {
    try {
        coroutineScope {
            launch {
                try {
                    delay(1000)
                } finally {
                    println("sibling: cancelled")
                }
            }
            launch {
                delay(50)
                throw IllegalArgumentException("bad input")
            }
        }
    } catch (e: IllegalArgumentException) {
        println("caught from coroutineScope: \${e.message}")
    }
}`),
      out(`sibling: cancelled
caught from coroutineScope: bad input`),
      '(`runBlocking<Unit>`: the block\'s last expression is the `try`, whose value is not `Unit`, so `main` says its type itself. See the trap in [[lesson:kt-coroutines-threads]].)',
      '## launch and async fail differently',
      '`async` keeps its exception for `await()`, which throws it where you can catch it. (In a normal scope the failure *also* goes to the parent, as with `launch`; under a supervisor, `await()` is the only place it appears.)',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    supervisorScope {
        val price = async<Int> { throw IllegalStateException("no price") }
        val shown = try { price.await() } catch (e: IllegalStateException) { -1 }
        println("price: $shown")
    }
}`),
      out('price: -1'),
      '## A try around launch catches nothing',
      'This surprises everyone once. `launch` returns at once, and the exception happens later, inside the new coroutine, where no `try` of yours is:',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    val handler = CoroutineExceptionHandler { _, e -> println("handler: \${e.message}") }
    val scope = CoroutineScope(Job() + handler)
    try {
        scope.launch { throw IllegalStateException("inside the launch") }.join()
    } catch (e: IllegalStateException) {
        println("caught around launch")
    }
    println("the try caught nothing")
}`),
      out(`handler: inside the launch
the try caught nothing`),
      'Put the `try` **inside** the coroutine, around the code that throws. The `CoroutineExceptionHandler` is a last resort, for logging what nobody caught.',
      '## SupervisorJob and supervisorScope',
      'A **supervisor** stops the spread: a child that fails cancels neither its siblings nor its parent. Use it when the children are independent, such as the widgets of a page or the connections of a server. Each child must then deal with its own failure, with a `try`, `await()`, or a handler:',
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    val handler = CoroutineExceptionHandler { _, e -> println("handler: \${e.message}") }
    supervisorScope {
        launch(handler) {
            delay(50)
            throw IllegalStateException("widget A failed")
        }
        launch {
            delay(150)
            println("widget B: shown, unaffected")
        }
    }
    println("page done")
}`),
      out(`handler: widget A failed
widget B: shown, unaffected
page done`),
      '`supervisorScope { }` is the supervisor version of `coroutineScope { }`; `CoroutineScope(SupervisorJob() + …)` makes a long-lived scope whose children fail on their own ([[lesson:kt-coroutine-scopes]]). The explainer [[explain:cancellation-tree]] shows both, step by step.',
      '## Where a CoroutineExceptionHandler takes effect',
      '| Where it is installed | Does it get the exception? |\n|---|---|\n| on a scope, for a coroutine launched at its root (`scope.launch(handler)`, or in the scope\'s context) | yes |\n| on a direct child of a supervisor | yes |\n| on a coroutine nested inside another, in a normal scope | no: the exception goes to the parent instead |\n| on an `async` | no: the exception is for `await()` |',
      '## CancellationException is not a failure',
      'Cancellation travels as a `CancellationException`, but parents treat it as a normal end: cancelling a child does not cancel its parent, and no handler hears about it. This is also why swallowing one is a bug ([[lesson:kt-cancellation]]): the coroutine looks cancelled to no one.'
    ].join('\n\n'),
    java: [
      java(`CompletableFuture<Integer> price = CompletableFuture.supplyAsync(() -> { throw new IllegalStateException("no price"); });
int shown = price.exceptionally(e -> -1).join();     // the failure travels with the future

executor.submit(() -> { throw new IllegalStateException(); });   // nobody sees this one unless they call get()`),
      'In Java a failed future keeps its exception until someone asks, and a task submitted to an executor fails silently unless someone calls `get()`. Coroutines never fail silently: a failure goes up to the parent, cancels the work that depends on it, and reaches a `try` or a handler. `async` with `await()` is the `CompletableFuture` way; a supervisor is how you say "these failures are independent".'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.*

suspend fun widget(name: String, fails: Boolean): String {
    delay(100)
    if (fails) throw IllegalStateException("$name is down")
    return "$name ok"
}

fun main() = runBlocking {
    val shown = supervisorScope {
        listOf("news" to false, "weather" to true, "stocks" to false).map { (name, fails) ->
            async { widget(name, fails) }
        }.map { d ->
            try { d.await() } catch (e: IllegalStateException) { "(\${e.message})" }
        }
    }
    println(shown)
}`,
      note: 'One widget fails; the others are still shown. Change `supervisorScope` to `coroutineScope` and run it again: now one failure cancels the others, and the exception escapes the `try` around `await` because the scope itself fails.'
    },
    challenge: {
      title: 'An import that survives a bad row',
      task: '`importRow(row)` imports one row: it fails at once for text that is not a number, and otherwise takes 50 ms and adds the number to `imported`.\n\n1. `importAll(rows)`: import every row **at the same time**, and return a list with each row\'s number, or `null` for a row that failed. A bad row must not stop the others: use `supervisorScope`, and catch each row\'s failure where you `await` it.\n2. `strictImport(rows)`: import every row at the same time in a normal `coroutineScope`, so the first failure cancels the rest. Return `"imported N"` (N rows), or `"failed: "` and the message.',
      starter: `import kotlinx.coroutines.*

val imported = mutableListOf<Int>()

suspend fun importRow(row: String): Int {
    val n = row.toIntOrNull() ?: throw IllegalArgumentException("bad row: $row")
    delay(50)
    imported += n
    return n
}

suspend fun importAll(rows: List<String>): List<Int?> = TODO("each row at once, under a supervisor; null for a failed row")

suspend fun strictImport(rows: List<String>): String = TODO("all at once in coroutineScope: \\"imported N\\" or \\"failed: message\\"")

fun main() = runBlocking {
    println(importAll(listOf("1", "x", "3")))
    println(strictImport(listOf("4", "y")))
    println(imported)
}`,
      solution: `import kotlinx.coroutines.*

val imported = mutableListOf<Int>()

suspend fun importRow(row: String): Int {
    val n = row.toIntOrNull() ?: throw IllegalArgumentException("bad row: $row")
    delay(50)
    imported += n
    return n
}

suspend fun importAll(rows: List<String>): List<Int?> = supervisorScope {
    rows.map { row -> async { importRow(row) } }
        .map { d -> try { d.await() } catch (e: IllegalArgumentException) { null } }
}

suspend fun strictImport(rows: List<String>): String =
    try {
        val n = coroutineScope { rows.map { row -> async { importRow(row) } }.awaitAll() }.size
        "imported $n"
    } catch (e: IllegalArgumentException) {
        "failed: \${e.message}"
    }

fun main() = runBlocking {
    println(importAll(listOf("1", "x", "3")))
    println(strictImport(listOf("4", "y")))
    println(imported)
}`,
      hints: [
        'In `supervisorScope`, map the rows to `async { importRow(row) }`, then map each `Deferred` to `try { d.await() } catch (e: IllegalArgumentException) { null }`.',
        'For `strictImport`, put `coroutineScope { rows.map { async { importRow(it) } }.awaitAll() }` inside a `try`: the scope throws the first failure to you, after cancelling the other rows.'
      ],
      checks: [
        { label: '`importAll` gives each row\'s number, and null for a bad row', code: 'eq(runBlocking { importAll(listOf("1", "x", "3")) }, listOf(1, null, 3))' },
        { label: 'A bad row does not stop the good ones', code: 'imported.clear()\nrunBlocking { importAll(listOf("1", "x", "3")) }\neq(imported.sorted(), listOf(1, 3))' },
        { label: 'The rows are imported at the same time: 50 ms on the fake clock', code: 'runTest {\n    importAll(listOf("1", "2", "3", "4"))\n    eq(currentTime, 50L)\n}' },
        { label: '`strictImport` reports success, and the first failure', code: 'eq(runBlocking { strictImport(listOf("1", "2")) }, "imported 2")\neq(runBlocking { strictImport(listOf("1", "y")) }, "failed: bad row: y")' },
        { label: 'In `strictImport`, a bad row cancels the others: nothing is imported', code: 'imported.clear()\nrunBlocking { strictImport(listOf("5", "6", "z")) }\neq(imported, listOf<Int>())' },
        { label: '`importAll` uses `supervisorScope`', code: 'ok(uses("""\\bsupervisorScope\\b"""), "run importAll\'s rows in supervisorScope { … }")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 8 */
  L.push({
    id: 'kt-channels', track: 'coroutines', title: 'Channels',
    summary: 'A channel is a queue between coroutines: send suspends while it is full, receive while it is empty. Capacities, close and for, produce, fanning work out to several workers and back in, and when a Flow is the better choice.',
    keywords: ['channel', 'Channel', 'send', 'receive', 'close', 'produce', 'rendezvous', 'buffered', 'conflated', 'unlimited', 'fan-out', 'fan-in', 'producer', 'consumer', 'queue', 'BlockingQueue'],
    docs: 'https://kotlinlang.org/docs/channels.html',
    body: [
      '## A queue between coroutines',
      'A `Channel` passes values from coroutines that `send` to coroutines that `receive`. Each value goes to **one** receiver. `close()` says no more will come, and `for (x in channel)` receives until then:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<String>()
    launch {
        for (dish in listOf("soup", "pasta", "cake")) channel.send(dish)
        channel.close()
    }
    for (dish in channel) println("served $dish")
    println("kitchen closed")
}`),
      out(`served soup
served pasta
served cake
kitchen closed`),
      'Where a Java `BlockingQueue` *blocks* a thread on `put` and `take`, a channel *suspends* the coroutine, and the thread does other work.',
      '## Capacity: who waits for whom',
      'With no capacity (the default, a *rendezvous*), `send` completes only when a receiver takes the value. Watch the producer wait for a slow consumer:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()
    launch {
        for (i in 1..3) {
            println("sending $i")
            channel.send(i)
            println("sent $i")
        }
        channel.close()
    }
    for (x in channel) {
        println("received $x")
        delay(100)
    }
}`),
      out(`sending 1
sent 1
sending 2
received 1
received 2
sent 2
sending 3
received 3
sent 3`),
      'The first value went straight to the receiver, which was already waiting. Then `send(2)` had to wait until the receiver came back from its `delay`. With room for two values, `Channel<Int>(capacity = 2)`, the producer sends all three without waiting: the first to the waiting receiver, the others into the buffer.',
      '| Capacity | `send` waits when… | Like |\n|---|---|---|\n| `Channel.RENDEZVOUS` (0, the default) | no receiver is taking | `SynchronousQueue` |\n| a number, or `Channel.BUFFERED` (64) | the buffer is full | `ArrayBlockingQueue` |\n| `Channel.UNLIMITED` | never (memory is the limit) | `LinkedBlockingQueue` |\n| `Channel.CONFLATED` | never: a new value replaces an unread one | a single "latest" slot |',
      '## produce',
      '`produce { … }` starts a coroutine that sends into a channel it returns, and closes the channel when its block ends, so the closing cannot be forgotten. kotlinx.coroutines 1.11 still marks it experimental, so the program opts in:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun CoroutineScope.squares(n: Int): ReceiveChannel<Int> = produce {
    for (i in 1..n) send(i * i)
}

fun main() = runBlocking {
    val received = mutableListOf<Int>()
    for (s in squares(4)) received += s
    println(received)
}`),
      out('[1, 4, 9, 16]'),
      '## Fan-out and fan-in',
      'Several coroutines can receive from one channel: each value goes to whichever is free, which spreads work over **workers**. Two workers, six orders, 100 ms each:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val orders = Channel<Int>()
    launch {
        for (o in 1..6) orders.send(o)
        orders.close()
    }
    val workers = List(2) { w ->
        launch {
            for (o in orders) {
                println("worker $w packs order $o")
                delay(100)
            }
        }
    }
    workers.joinAll()
    println("all packed")
}`),
      out(`worker 0 packs order 1
worker 1 packs order 2
worker 0 packs order 3
worker 1 packs order 4
worker 0 packs order 5
worker 1 packs order 6
all packed`),
      '*Fan-in* is the other way round: several coroutines send into one channel, and one coroutine collects the results.',
      '## A channel or a Flow?',
      '| | `Channel` | `Flow` |\n|---|---|---|\n| Hot or cold | hot: values exist whether anyone receives or not | cold: runs only when collected |\n| Each value goes to | one receiver | every collector (each runs its own flow) |\n| Typical use | handing work between coroutines, a queue of jobs | a stream of results to transform: [[lesson:kt-flow-basics]] |',
      'Most application code uses flows; channels are the plumbing underneath (`buffer()` and `channelFlow` use them), and the right tool for a work queue.'
    ].join('\n\n'),
    java: [
      java(`BlockingQueue<Integer> orders = new ArrayBlockingQueue<>(10);
for (int w = 0; w < 2; w++) {
    executor.submit(() -> {
        while (true) {
            int o = orders.take();          // blocks this thread until an order comes
            if (o < 0) break;               // a "poison pill" ends the worker
            pack(o);
        }
        return null;
    });
}`),
      'A channel is a `BlockingQueue` that suspends instead of blocking, with `close()` built in instead of a poison-pill value, and `for (x in channel)` instead of a `take()` loop. A thousand coroutines waiting on channels cost a thousand small objects, not a thousand blocked threads.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val tickets = Channel<String>(capacity = Channel.UNLIMITED)
    listOf("printer", "login", "email").forEach { tickets.send(it) }
    tickets.close()
    val agents = List(2) { a ->
        launch {
            for (t in tickets) {
                println("agent $a takes $t")
                delay(100)
            }
        }
    }
    agents.joinAll()
}`,
      note: 'Each ticket goes to exactly one agent. Try three agents, or `Channel.CONFLATED`: only the last ticket survives.'
    },
    challenge: {
      title: 'Workers sharing a queue',
      task: 'Write `processAll(orders, workers)`: pack every order using `workers` coroutines that share one channel.\n\n1. Inside `coroutineScope`, make a `Channel<Int>` for the orders, and launch a coroutine that sends every order into it, then closes it.\n2. Launch `workers` coroutines, each taking orders from the channel with `for (o in queue)` and calling `pack(o)`, which takes 100 ms.\n3. Return every result, sorted.\n\nWith three workers, six orders take 200 ms; with one, 600.',
      starter: `import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

suspend fun pack(order: Int): String {
    delay(100)
    return "order $order packed"
}

suspend fun processAll(orders: List<Int>, workers: Int): List<String> = coroutineScope {
    TODO("a channel of orders, workers that pack from it, every result sorted")
}

fun main() = runBlocking {
    println(processAll((1..6).toList(), 3))
}`,
      solution: `import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

suspend fun pack(order: Int): String {
    delay(100)
    return "order $order packed"
}

suspend fun processAll(orders: List<Int>, workers: Int): List<String> = coroutineScope {
    val queue = Channel<Int>()
    launch {
        for (o in orders) queue.send(o)
        queue.close()
    }
    val results = List(workers) {
        async {
            val packed = mutableListOf<String>()
            for (o in queue) packed += pack(o)
            packed
        }
    }.awaitAll()
    results.flatten().sorted()
}

fun main() = runBlocking {
    println(processAll((1..6).toList(), 3))
}`,
      hints: [
        'The sender: `launch { for (o in orders) queue.send(o); queue.close() }`. Without `close()`, the workers\' `for` loops never end.',
        'Each worker can be an `async` that collects what it packed into a list of its own: `List(workers) { async { … } }.awaitAll()` gives a list of lists, and `flatten().sorted()` makes one.'
      ],
      checks: [
        { label: 'Every order is packed', code: 'eq(runBlocking { processAll(listOf(1, 2, 3), 2) }, listOf("order 1 packed", "order 2 packed", "order 3 packed"))' },
        { label: 'Each order exactly once', code: 'val packed = runBlocking { processAll((1..9).toList(), 3) }\neq(packed.size, 9)\neq(packed.toSet().size, 9)' },
        { label: 'Three workers pack six orders in 200 ms on the fake clock', code: 'runTest {\n    processAll((1..6).toList(), 3)\n    eq(currentTime, 200L)\n}' },
        { label: 'One worker takes 600 ms', code: 'runTest {\n    processAll((1..6).toList(), 1)\n    eq(currentTime, 600L)\n}' },
        { label: 'The orders go through a `Channel`', code: 'ok(uses("""\\bChannel\\s*<"""), "share the orders through a Channel<Int>()")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 9 */
  L.push({
    id: 'kt-shared-state', track: 'coroutines', title: 'Shared mutable state',
    summary: 'Two coroutines changing one value can lose updates, even on one thread, if they pause between reading and writing. AtomicInteger, Mutex and withLock, why synchronized cannot hold across a suspension, and confining the state to one thread.',
    keywords: ['shared state', 'race', 'race condition', 'Mutex', 'withLock', 'AtomicInteger', 'synchronized', 'thread safety', 'confinement', 'limitedParallelism', 'lost update', 'critical section'],
    docs: 'https://kotlinlang.org/docs/shared-mutable-state-and-concurrency.html',
    body: [
      '## A race on one thread',
      'A "read, then write" that pauses in the middle is a race, even when one thread runs everything. Here each of 1,000 coroutines reads the count, pauses (`yield()` stands for any suspend call: a database read, say), then writes back what it read, plus one:',
      kt(`import kotlinx.coroutines.*

var count = 0

suspend fun increment() {
    val seen = count
    yield()
    count = seen + 1
}

fun main() = runBlocking {
    List(1000) { launch { increment() } }.joinAll()
    println("1000 increments, count = $count")
}`),
      out('1000 increments, count = 1'),
      'Every coroutine read 0 before any of them wrote, so 999 updates were lost. With several threads (`Dispatchers.Default`) the same thing happens without any pause, at random, which makes it much harder to see.',
      '## Mutex: one at a time, without blocking',
      'A `Mutex` is a lock for coroutines: `withLock { … }` takes it, suspending (not blocking) while another coroutine holds it, runs the block, and gives it back even if the block throws:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.sync.*

var count = 0
val mutex = Mutex()

suspend fun increment() = mutex.withLock {
    val seen = count
    yield()
    count = seen + 1
}

fun main() = runBlocking {
    List(1000) { launch { increment() } }.joinAll()
    println("1000 increments, count = $count")
}`),
      out('1000 increments, count = 1000'),
      'A Kotlin `Mutex` is **not reentrant**: a coroutine that calls `withLock` while already holding the lock waits for itself forever.',
      '## Why not synchronized?',
      '`synchronized` holds a Java monitor, which belongs to a *thread*. A coroutine may suspend inside the block and resume on another thread, which could then not release a lock it does not own, so the compiler refuses a suspend call there:',
      norun(`synchronized(lock) {
    delay(10)      // compile error: The 'delay' suspension point is inside a critical section.
}`),
      '`synchronized` is still fine around code that does not suspend; around code that does, use a `Mutex`.',
      '## Atomics: for one number',
      'For a single counter or flag updated from many threads, an atomic is simpler and faster than a lock:',
      kt(`import kotlinx.coroutines.*
import java.util.concurrent.atomic.AtomicInteger

fun main() = runBlocking {
    val hits = AtomicInteger()
    withContext(Dispatchers.Default) {
        repeat(1000) { launch { repeat(100) { hits.incrementAndGet() } } }
    }
    println(hits.get())
}`),
      out('100000'),
      '`withContext` waits for every coroutine launched inside it, as any scope does, so the count is complete when it returns. Kotlin\'s `MutableStateFlow` has `update { it + 1 }`, the same idea for a state that is observed ([[lesson:kt-stateflow-sharedflow]]).',
      '## Confinement: one coroutine at a time on the state',
      'The third way: let only one coroutine at a time touch the state, by running every update on a dispatcher that runs one at a time:',
      kt(`import kotlinx.coroutines.*

val oneAtATime = Dispatchers.Default.limitedParallelism(1)
var total = 0

fun main() = runBlocking {
    withContext(Dispatchers.Default) {
        repeat(100) {
            launch {
                repeat(100) { withContext(oneAtATime) { total++ } }
            }
        }
    }
    println(total)
}`),
      out('10000'),
      '| Tool | Use it for | Cost |\n|---|---|---|\n| `AtomicInteger`, `AtomicReference` | one value, updated in one step | the cheapest |\n| `Mutex.withLock` | several values that must change together, or code that suspends while it changes them | a little more; never blocks a thread |\n| confinement (`limitedParallelism(1)`) | a whole object owned by one place | a switch for each update |\n| `synchronized` | code that does not suspend | blocks the thread while it waits |'
    ].join('\n\n'),
    java: [
      java(`private final ReentrantLock lock = new ReentrantLock();
void deposit(int amount) {
    lock.lock();
    try { balance += amount; } finally { lock.unlock(); }
}
// or: synchronized void deposit(int amount) { balance += amount; }
// or: private final AtomicInteger balance = new AtomicInteger();`),
      'The tools are Java\'s, with one addition: a coroutine `Mutex` *suspends* while it waits, where a Java lock blocks the thread. And races are easier to cause by accident with coroutines, because every suspend call is a point where another coroutine can run, on the same thread.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.*
import kotlinx.coroutines.sync.*

val seats = mutableListOf("1A", "1B", "1C")
val booking = Mutex()

suspend fun book(name: String): String = booking.withLock {
    val seat = seats.firstOrNull() ?: return@withLock "$name: sold out"
    delay(10)                 // the payment
    seats.remove(seat)
    "$name gets $seat"
}

fun main() = runBlocking {
    val results = listOf("Asha", "Ravi", "Li", "Mei").map { name -> async { book(name) } }.awaitAll()
    results.forEach(::println)
}`,
      note: 'Each booking checks a seat and takes it in one locked step. Remove `booking.withLock` (keep the block\'s body in `run { … }`): every passenger gets seat 1A.'
    },
    challenge: {
      title: 'A bank account that adds up',
      task: '`Account` reads its balance, waits for the bank (`yield()`), then writes. Many deposits at once lose money, and two withdrawals can both pass the check. Make every change of the balance happen one at a time, with a `Mutex`:\n\n1. `deposit(amount)`: add to the balance, safely.\n2. `withdraw(amount)`: take the amount and return `true` if the balance covers it; otherwise change nothing and return `false`. The check and the change must happen in the same locked step.',
      starter: `import kotlinx.coroutines.*
import kotlinx.coroutines.sync.*

class Account(start: Int) {
    var balance = start
        private set

    suspend fun deposit(amount: Int) {
        val seen = balance
        yield()                 // waiting for the bank
        balance = seen + amount
    }

    suspend fun withdraw(amount: Int): Boolean {
        if (balance < amount) return false
        yield()                 // waiting for the bank
        balance -= amount
        return true
    }
}

fun main() = runBlocking {
    val account = Account(0)
    List(100) { launch { account.deposit(1) } }.joinAll()
    println(account.balance)
}`,
      solution: `import kotlinx.coroutines.*
import kotlinx.coroutines.sync.*

class Account(start: Int) {
    var balance = start
        private set
    private val lock = Mutex()

    suspend fun deposit(amount: Int) = lock.withLock {
        val seen = balance
        yield()                 // waiting for the bank
        balance = seen + amount
    }

    suspend fun withdraw(amount: Int): Boolean = lock.withLock {
        if (balance < amount) return@withLock false
        yield()                 // waiting for the bank
        balance -= amount
        true
    }
}

fun main() = runBlocking {
    val account = Account(0)
    List(100) { launch { account.deposit(1) } }.joinAll()
    println(account.balance)
}`,
      hints: [
        'Give `Account` a `private val lock = Mutex()`, and wrap each function\'s body in `lock.withLock { … }`.',
        'Inside `withLock`, a plain `return` would leave the function from the middle of the lock\'s block; `return@withLock false` gives the block\'s value, and the last line, `true`, is the value otherwise.'
      ],
      checks: [
        { label: '100 deposits at once add 100', code: 'val a = Account(0)\nrunBlocking { List(100) { launch { a.deposit(1) } }.joinAll() }\neq(a.balance, 100)' },
        { label: 'Deposits from many threads add up too', code: 'val a = Account(0)\nrunBlocking(Dispatchers.Default) { List(1000) { launch { a.deposit(2) } }.joinAll() }\neq(a.balance, 2000)' },
        { label: 'Ten withdrawals of 30 from 100: exactly three succeed', code: 'val a = Account(100)\nval ok = runBlocking { List(10) { async { a.withdraw(30) } }.awaitAll() }\neq(ok.count { it }, 3)\neq(a.balance, 10)' },
        { label: 'A withdrawal the balance cannot cover changes nothing', code: 'val a = Account(20)\neq(runBlocking { a.withdraw(50) }, false)\neq(a.balance, 20)' },
        { label: 'The account uses a `Mutex`', code: 'ok(uses("""\\bMutex\\s*\\(""") && uses("""\\bwithLock\\b"""), "a Mutex() and withLock { … } around each change")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 10 */
  L.push({
    id: 'kt-coroutine-scopes', track: 'coroutines', title: 'Scopes in real code',
    summary: 'Where scopes come from outside main: a component that owns a scope and cancels it when it closes, a scope passed in so tests can control it, the framework\'s scopes (Spring, Android), runBlocking only at the edges, and CompletableFuture both ways.',
    keywords: ['CoroutineScope', 'scope', 'lifecycle', 'SupervisorJob', 'GlobalScope', 'viewModelScope', 'Spring', 'suspend controller', 'runBlocking', 'CompletableFuture', 'future', 'await', 'close', 'cancel'],
    docs: 'https://kotlinlang.org/docs/coroutines-basics.html',
    body: [
      '## Every coroutine needs a scope; who owns it?',
      'In `main`, `runBlocking` gives you a scope, and inside suspend functions `coroutineScope` does. A component that starts work which outlives a single call (a poller, a cache that refreshes, a websocket) needs a scope of its own, tied to **its own lifetime**: made when the component is made, cancelled when it closes.',
      kt(`import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentLinkedQueue

class Downloader : AutoCloseable {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    val closed = ConcurrentLinkedQueue<String>()

    fun download(url: String): Job = scope.launch {
        try {
            delay(10_000)
        } finally {
            closed += url
        }
    }

    override fun close() = scope.cancel()
}

fun main() = runBlocking {
    val downloads = Downloader()
    val jobs = listOf(downloads.download("a.zip"), downloads.download("b.zip"))
    delay(100)
    downloads.close()
    jobs.joinAll()
    println("stopped: \${downloads.closed.sorted()}")
}`),
      out('stopped: [a.zip, b.zip]'),
      '`SupervisorJob()` keeps one failed download from cancelling the others; `Dispatchers.Default` keeps the work off the caller\'s thread; and `close()` cancels everything the component started. That is `GlobalScope` done right: the same freedom, with an owner.',
      '## Pass the scope in',
      'Better still for testing: let the caller give the component its scope. In production the framework\'s scope, in a test `runTest`\'s, whose fake clock then drives it:',
      kt(`import kotlinx.coroutines.*

class Ticker(private val scope: CoroutineScope) {
    private var job: Job? = null

    fun start(onTick: (Int) -> Unit) {
        job = scope.launch {
            var n = 0
            while (true) {
                delay(100)
                onTick(++n)
            }
        }
    }

    fun stop() {
        job?.cancel()
    }
}

fun main() = runBlocking {
    val ticker = Ticker(this)
    ticker.start { println("tick $it") }
    delay(350)
    ticker.stop()
    println("stopped")
}`),
      out(`tick 1
tick 2
tick 3
stopped`),
      '## The framework\'s scopes',
      'Frameworks that support coroutines give you a scope tied to the lifetime they manage, so you rarely make one yourself:',
      norun(`// Spring (WebFlux or MVC): a controller method may be suspend; the request is its scope
@GetMapping("/users/{id}")
suspend fun user(@PathVariable id: Long): User = coroutineScope {
    val profile = async { profiles.load(id) }
    val orders = async { orders.recent(id) }
    User(profile.await(), orders.await())
}

// Android: viewModelScope is cancelled when the ViewModel is cleared
class UserViewModel : ViewModel() {
    fun refresh() = viewModelScope.launch { _state.value = repository.load() }
}`),
      '(Shown, not run: Spring and Android are not part of this tool.) In both, when the request or the screen goes away, its scope is cancelled, and every coroutine it started stops.',
      '## runBlocking only at the edges',
      '`runBlocking` blocks its thread, so it belongs only where ordinary code meets coroutines: `main`, a test, a Java callback that must return a value. Inside a coroutine it blocks a thread the coroutine machinery needs; on a dispatcher with one thread (a UI thread, `limitedParallelism(1)`), a `runBlocking` that waits for work queued on that same thread waits forever. The ⚠ in the editor marks a `runBlocking` inside a coroutine or a suspend function.',
      '## CompletableFuture, both ways',
      'Java libraries return `CompletableFuture`s, and Java callers want them. kotlinx.coroutines converts both ways, in the package `kotlinx.coroutines.future`:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.future.*
import java.util.concurrent.CompletableFuture

// a Java-style API
fun lookUp(id: Int): CompletableFuture<String> = CompletableFuture.supplyAsync { "user$id" }

// Kotlin waits for it without blocking
suspend fun name(id: Int): String = lookUp(id).await()

// and offers Java callers a future
fun nameForJava(scope: CoroutineScope, id: Int): CompletableFuture<String> =
    scope.future { name(id).uppercase() }

fun main() = runBlocking {
    println(name(7))
    println(nameForJava(this, 8).await())
}`),
      out(`user7
USER8`)
    ].join('\n\n'),
    java: [
      java(`public final class Downloader implements AutoCloseable {
    private final ExecutorService pool = Executors.newFixedThreadPool(4);

    public Future<?> download(String url) { return pool.submit(() -> fetch(url)); }

    @Override public void close() { pool.shutdownNow(); }   // interrupts what is still running
}`),
      'A component owning an `ExecutorService` and shutting it down in `close()` is the Java version, and the same discipline. A coroutine scope adds the parent-child structure (cancelling it stops the children of the children too) and costs nothing while nothing runs.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.*

class Heartbeat(private val scope: CoroutineScope, private val every: Long) {
    private var job: Job? = null
    var beats = 0
        private set

    fun start() {
        job = scope.launch {
            while (isActive) {
                delay(every)
                beats++
            }
        }
    }

    fun stop() {
        job?.cancel()
    }
}

fun main() = runBlocking {
    val heart = Heartbeat(this, every = 100)
    heart.start()
    delay(550)
    heart.stop()
    println("beats: \${heart.beats}")
}`,
      note: 'Remove `heart.stop()`: the program never ends, because `runBlocking` waits for every coroutine in its scope, the heartbeat included. A scope you own is a promise to cancel it.'
    },
    challenge: {
      title: 'A refresher with its own lifetime',
      task: 'Finish `Refresher`, which keeps `latest` up to date:\n\n1. `start()`: launch, **in the scope it was given**, a coroutine that every 100 ms calls `load()` and stores the result in `latest`.\n2. `stop()`: cancel that coroutine.\n3. `latestForJava(scope)`: for Java callers, a `CompletableFuture<String>` of `load()`\'s result, made with `scope.future { … }`.',
      starter: `import kotlinx.coroutines.*
import kotlinx.coroutines.future.*
import java.util.concurrent.CompletableFuture

class Refresher(private val scope: CoroutineScope, private val load: suspend () -> String) {
    var latest = "nothing yet"
        private set
    private var job: Job? = null

    fun start() {
        TODO("every 100 ms, latest = load(), in scope")
    }

    fun stop() {
        TODO("cancel the refreshing")
    }

    fun latestForJava(): CompletableFuture<String> = TODO("scope.future { … }")
}

fun main() = runBlocking {
    var version = 0
    val r = Refresher(this) { "version \${++version}" }
    r.start()
    delay(350)
    r.stop()
    println(r.latest)
    println(r.latestForJava().await())
}`,
      solution: `import kotlinx.coroutines.*
import kotlinx.coroutines.future.*
import java.util.concurrent.CompletableFuture

class Refresher(private val scope: CoroutineScope, private val load: suspend () -> String) {
    var latest = "nothing yet"
        private set
    private var job: Job? = null

    fun start() {
        job = scope.launch {
            while (true) {
                delay(100)
                latest = load()
            }
        }
    }

    fun stop() {
        job?.cancel()
    }

    fun latestForJava(): CompletableFuture<String> = scope.future { load() }
}

fun main() = runBlocking {
    var version = 0
    val r = Refresher(this) { "version \${++version}" }
    r.start()
    delay(350)
    r.stop()
    println(r.latest)
    println(r.latestForJava().await())
}`,
      hints: [
        '`job = scope.launch { while (true) { delay(100); latest = load() } }`: `delay` is also where the loop notices it was cancelled.',
        '`stop()` is `job?.cancel()`, and `scope.future { load() }` gives Java a future of the result.'
      ],
      checks: [
        { label: 'After 350 ms it has refreshed three times', code: 'runTest {\n    var n = 0\n    val r = Refresher(this) { "v\${++n}" }\n    r.start()\n    advanceTimeBy(350)\n    eq(r.latest, "v3")\n    r.stop()\n}' },
        { label: '`stop()` stops the refreshing', code: 'runTest {\n    var n = 0\n    val r = Refresher(this) { "v\${++n}" }\n    r.start()\n    advanceTimeBy(250)\n    r.stop()\n    advanceTimeBy(1000)\n    eq(r.latest, "v2")\n}' },
        { label: 'It runs in the scope it was given: cancelling the scope stops it', code: 'runTest {\n    var n = 0\n    val own = CoroutineScope(coroutineContext + Job())\n    val r = Refresher(own) { "v\${++n}" }\n    r.start()\n    advanceTimeBy(150)\n    own.cancel()\n    advanceTimeBy(1000)\n    eq(r.latest, "v1")\n}' },
        { label: '`latestForJava()` gives a future of the loaded value', code: 'val f = runBlocking { Refresher(this) { "fresh" }.latestForJava() }\neq(f.get(), "fresh")' },
        { label: 'No `GlobalScope`, and the future comes from `future { … }`', code: 'ok(!uses("""GlobalScope""") && uses("""\\.future\\s*\\{"""), "launch in the given scope, and use scope.future { … }")' }
      ]
    }
  });
})(window.KLT);
