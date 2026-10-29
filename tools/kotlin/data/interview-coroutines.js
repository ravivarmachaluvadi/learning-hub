/*
 * data/interview-coroutines.js - the ★★ and ★ interview questions on coroutines (batch 4). The seven ★★★
 * coroutine questions arrived early, in batch 2 (data/interview-fast-track.js), and link these lessons too.
 *
 * The question shape is described at the top of data/interview-basics.js. Every ```kotlin block runs in
 * tests/test_content.py with kotlinx.coroutines 1.11.0, and an ```output block after one is its exact
 * output: no block prints a thread number or a measured time.
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function norun(code) { return '```kotlin-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];

  Q.push({
    id: 'coroutine-context', track: 'coroutines', weight: 2,
    q: 'What is a CoroutineContext, and what is in it?',
    keywords: ['CoroutineContext', 'context', 'Job', 'dispatcher', 'CoroutineName', 'CoroutineExceptionHandler', 'element', 'inheritance', 'coroutineContext'],
    short: 'The set of elements a coroutine carries: its `Job` (its place in the tree, for waiting and cancelling), its dispatcher (which threads it runs on), and optionally a `CoroutineName` (for debugging) and a `CoroutineExceptionHandler`. It works like a map keyed by the element\'s type: `coroutineContext[Job]` reads one, and `+` combines contexts, the right side winning. A child inherits its parent\'s context, except that it gets a new `Job` of its own, a child of the parent\'s.',
    answer: [
      kt(`import kotlinx.coroutines.*
import kotlin.coroutines.ContinuationInterceptor

fun main() = runBlocking(CoroutineName("parent")) {
    val parentJob = coroutineContext[Job]!!
    launch(Dispatchers.Default) {
        println("name inherited: \${coroutineContext[CoroutineName]?.name}")
        println("dispatcher replaced: \${coroutineContext[ContinuationInterceptor] == Dispatchers.Default}")
        val myJob = coroutineContext[Job]
        println("a job of its own, under the parent's: \${parentJob.children.any { it === myJob }}")
    }.join()
    val combined = Dispatchers.IO + CoroutineName("a") + CoroutineName("b")
    println("+ keeps the right one: \${combined[CoroutineName]?.name}")
}`),
      out(`name inherited: parent
dispatcher replaced: true
a job of its own, under the parent's: true
+ keeps the right one: b`),
      '| Element | It decides |\n|---|---|\n| `Job` | the coroutine\'s place in the tree: who waits for it, who cancels it |\n| `CoroutineDispatcher` | which thread or threads it runs on |\n| `CoroutineName` | the name shown in debugging and in thread names with `-Dkotlinx.coroutines.debug` |\n| `CoroutineExceptionHandler` | where an exception nobody caught ends up, at the root |',
      'Builders take a context to add (`launch(Dispatchers.IO + CoroutineName("loader"))`), and `withContext` changes it for a block. Where Java would use a `ThreadLocal`, coroutines use a context element, because a coroutine may move between threads.'
    ].join('\n\n'),
    followups: [
      'What does a child coroutine inherit from its parent, and what does it not?',
      'How do you read the current `Job` inside a coroutine?',
      'Why does a `ThreadLocal` not work reliably across a suspension point?'
    ],
    related: ['lesson:kt-dispatchers', 'q:dispatchers', 'q:structured-concurrency'],
    docs: 'https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html'
  });

  Q.push({
    id: 'channels', track: 'coroutines', weight: 2,
    q: 'What is a Channel, and when would you use one instead of a Flow?',
    keywords: ['Channel', 'channel', 'send', 'receive', 'produce', 'fan-out', 'fan-in', 'BlockingQueue', 'rendezvous', 'buffered', 'conflated', 'hot'],
    short: 'A `Channel` is a queue between coroutines: `send` suspends while it is full, `receive` while it is empty, and `close()` ends it (`for (x in channel)` stops there). Each value goes to **one** receiver. Its capacity decides who waits: rendezvous (the default, 0), a buffer, unlimited, or conflated (only the latest). It is hot: values exist whether anyone receives or not. Use a channel to hand work between coroutines (a queue shared by workers); use a `Flow` for a stream of values to transform, which runs per collector.',
    answer: [
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val tasks = Channel<String>(capacity = Channel.UNLIMITED)
    listOf("a.png", "b.png", "c.png", "d.png").forEach { tasks.send(it) }
    tasks.close()
    val reports = List(2) { worker ->
        async {
            val done = mutableListOf<String>()
            for (file in tasks) {
                delay(100)
                done += file
            }
            "worker $worker resized $done"
        }
    }.awaitAll()
    reports.forEach(::println)
}`),
      out(`worker 0 resized [a.png, c.png]
worker 1 resized [b.png, d.png]`),
      'Two workers shared one queue, each file going to whichever was free: fan-out.',
      '| | `Channel` | `Flow` |\n|---|---|---|\n| Hot or cold | hot | cold (`SharedFlow` and `StateFlow` are hot) |\n| Each value goes to | one receiver | every collector |\n| Typical use | a work queue; handing values between coroutines | transforming a stream with operators |\n| Java | `BlockingQueue`, but suspending | Reactor\'s `Flux` |'
    ].join('\n\n'),
    followups: [
      'What capacities can a channel have, and what does each change?',
      'What happens when you send to a closed channel, or receive from an empty closed one?',
      'Why is a `Channel` the wrong place for state that many observers watch?'
    ],
    related: ['lesson:kt-channels', 'q:flow-cold-hot', 'q:shared-mutable-state'],
    docs: 'https://kotlinlang.org/docs/channels.html'
  });

  Q.push({
    id: 'shared-mutable-state', track: 'coroutines', weight: 2,
    q: 'How do you protect shared mutable state in coroutines?',
    keywords: ['shared state', 'race condition', 'Mutex', 'withLock', 'AtomicInteger', 'synchronized', 'confinement', 'limitedParallelism', 'thread safety', 'lost update'],
    short: 'With the same ideas as threads, adapted. An **atomic** (`AtomicInteger`, `MutableStateFlow.update`) for one value changed in one step. A **`Mutex`** (`mutex.withLock { … }`) when several values must change together, or the change suspends: it suspends instead of blocking, and is not reentrant. **Confinement**: all changes on one coroutine or a `limitedParallelism(1)` dispatcher. Not `synchronized` around suspend calls: the compiler refuses, since a coroutine may resume on another thread. And note that coroutines race even on one thread, wherever a suspend call sits between a read and a write.',
    answer: [
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.sync.*
import java.util.concurrent.atomic.AtomicInteger

var plain = 0
var locked = 0
val mutex = Mutex()
val atomic = AtomicInteger()

fun main() = runBlocking {
    List(1000) {
        launch {
            val seen = plain
            yield()                    // any suspend call between the read and the write
            plain = seen + 1
            mutex.withLock {
                val s = locked
                yield()
                locked = s + 1
            }
            atomic.incrementAndGet()
        }
    }.joinAll()
    println("plain: $plain, with a Mutex: $locked, atomic: \${atomic.get()}")
}`),
      out('plain: 1, with a Mutex: 1000, atomic: 1000'),
      'All of this ran on one thread, and the unprotected count still lost 999 updates: every coroutine read 0 before any of them wrote.',
      norun(`synchronized(lock) {
    delay(10)   // compile error: The 'delay' suspension point is inside a critical section.
}`)
    ].join('\n\n'),
    followups: [
      'Why can a suspend function not be called inside `synchronized`?',
      'Is a Kotlin `Mutex` reentrant? What happens if it were assumed to be?',
      'When is an atomic enough, and when do you need a lock?'
    ],
    related: ['lesson:kt-shared-state', 'q:dispatchers', 'q:stateflow-vs-sharedflow'],
    docs: 'https://kotlinlang.org/docs/shared-mutable-state-and-concurrency.html'
  });

  Q.push({
    id: 'blocking-in-coroutines', track: 'coroutines', weight: 2,
    q: 'What happens when you call blocking code, such as Thread.sleep or a JDBC query, inside a coroutine?',
    keywords: ['blocking', 'Thread.sleep', 'JDBC', 'Dispatchers.IO', 'withContext', 'main-safe', 'runBlocking', 'starvation', 'virtual threads'],
    short: 'It blocks the thread the coroutine runs on, and every other coroutine waiting for that thread waits too: `suspend` does not make blocking code non-blocking. On a dispatcher with few threads (`Default`, a UI thread, `runBlocking`\'s one thread) that stalls everything. The fix is to run the blocking call on `Dispatchers.IO`, which has many threads for exactly this: `withContext(Dispatchers.IO) { query() }`, inside the function that blocks, so it is main-safe for every caller. Where a non-blocking API exists (R2DBC, an async HTTP client), call it with `await()` instead. And never `runBlocking` inside a coroutine.',
    answer: [
      kt(`import kotlinx.coroutines.*

fun blockingQuery(): String {
    Thread.sleep(300)
    return "rows"
}

fun main() = runBlocking {
    val ticker = launch {
        repeat(3) { i ->
            println("tick $i")
            delay(50)
        }
    }
    println("query on the coroutine's own thread: \${blockingQuery()}")
    println("query on Dispatchers.IO: \${withContext(Dispatchers.IO) { blockingQuery() }}")
    ticker.join()
}`),
      out(`query on the coroutine's own thread: rows
tick 0
tick 1
tick 2
query on Dispatchers.IO: rows`),
      'The ticker was launched first, but could not even start while the first query held `runBlocking`\'s only thread. During the second query the thread was free (the coroutine was suspended in `withContext`), so the ticks ran.',
      '**Virtual threads** change the cost of blocking (a blocked virtual thread is parked cheaply), and kotlinx.coroutines can run on them, through an executor turned into a dispatcher. The rule stays: do not block a dispatcher\'s few threads.'
    ].join('\n\n'),
    followups: [
      'How do you make a blocking function safe to call from any coroutine?',
      'Why is `runBlocking` inside a coroutine a problem?',
      'How many threads does `Dispatchers.IO` have, and why so many?'
    ],
    related: ['lesson:kt-dispatchers', 'lesson:kt-coroutines-threads', 'q:dispatchers', 'q:coroutines-vs-threads'],
    docs: 'https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html'
  });

  Q.push({
    id: 'coroutine-scope-lifecycle', track: 'coroutines', weight: 2,
    q: 'Where do coroutine scopes come from in a real application, and why is GlobalScope discouraged?',
    keywords: ['CoroutineScope', 'scope', 'lifecycle', 'GlobalScope', 'SupervisorJob', 'viewModelScope', 'Spring', 'suspend controller', 'leak', 'cancel'],
    short: 'A scope should match the lifetime of the work. The framework gives one where it can: a Spring `suspend` controller method runs in the request\'s coroutine, Android\'s `viewModelScope` is cancelled with the screen\'s ViewModel. Inside suspend functions, `coroutineScope { }` makes one. A component whose work outlives a call owns a scope, `CoroutineScope(SupervisorJob() + Dispatchers.Default)`, and cancels it when it closes, or better, receives one, so tests can pass `runTest`\'s. `GlobalScope` has no job: its coroutines have no parent, nothing waits for them or cancels them, so they leak past the work that started them.',
    answer: [
      kt(`import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentLinkedQueue

class PriceAlerts : AutoCloseable {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    val stopped = ConcurrentLinkedQueue<String>()

    fun watch(symbol: String): Job = scope.launch {
        try {
            awaitCancellation()
        } finally {
            stopped += symbol
        }
    }

    override fun close() = scope.cancel()
}

fun main() = runBlocking {
    val alerts = PriceAlerts()
    val watches = listOf(alerts.watch("JAVA"), alerts.watch("KOTL"))
    delay(100)
    alerts.close()
    watches.joinAll()
    println("stopped: \${alerts.stopped.sorted()}")
}`),
      out('stopped: [JAVA, KOTL]'),
      '| Where | The scope | Cancelled when |\n|---|---|---|\n| `main`, a test | `runBlocking`, `runTest` | the block ends |\n| inside a suspend function | `coroutineScope { }`, `supervisorScope { }` | the function returns |\n| Spring WebFlux or MVC | the request\'s coroutine (`suspend` handler) | the request ends or fails |\n| Android | `viewModelScope`, `lifecycleScope` | the ViewModel is cleared, the screen destroyed |\n| your own component | `CoroutineScope(SupervisorJob() + …)` | you call `cancel()`, in `close()` |\n| `GlobalScope` | none | never: avoid it |'
    ].join('\n\n'),
    followups: [
      'What is wrong with `GlobalScope.launch` in a request handler?',
      'Why give a component\'s scope a `SupervisorJob`?',
      'Why pass a scope into a class rather than make it inside?'
    ],
    related: ['lesson:kt-coroutine-scopes', 'lesson:kt-structured-concurrency', 'q:structured-concurrency', 'q:coroutine-exceptions'],
    docs: 'https://kotlinlang.org/docs/coroutines-basics.html'
  });

  Q.push({
    id: 'timeouts', track: 'coroutines', weight: 1,
    q: 'What is the difference between withTimeout and withTimeoutOrNull?',
    keywords: ['withTimeout', 'withTimeoutOrNull', 'TimeoutCancellationException', 'timeout', 'cancellation', 'deadline'],
    short: 'Both run a block and cancel it if it takes longer than the time given. `withTimeout` then throws `TimeoutCancellationException` (a kind of `CancellationException`); `withTimeoutOrNull` returns null instead, which is usually easier to handle. A timeout is cancellation, so it is cooperative: the block stops at a suspension point, and its `finally` blocks run.',
    answer: [
      kt(`import kotlinx.coroutines.*

suspend fun search(ms: Long): String {
    delay(ms)
    return "results"
}

fun main() = runBlocking {
    println(withTimeoutOrNull(500) { search(100) })
    println(withTimeoutOrNull(100) { search(500) })
    try {
        println(withTimeout(100) { search(500) })
    } catch (e: TimeoutCancellationException) {
        println("withTimeout threw: \${e.message}")
    }
}`),
      out(`results
null
withTimeout threw: Timed out waiting for 100 ms`),
      'A `TimeoutCancellationException` that escapes is treated as a cancellation, not a crash, which can hide it: catch it near the `withTimeout`, or prefer `withTimeoutOrNull`.'
    ].join('\n\n'),
    followups: [
      'Why might a timeout not stop a loop that never suspends?',
      'What happens to the work inside the block when the time runs out?'
    ],
    related: ['lesson:kt-cancellation', 'q:cancellation'],
    docs: 'https://kotlinlang.org/docs/coroutines-cancellation.html'
  });

  Q.push({
    id: 'future-interop', track: 'coroutines', weight: 1,
    q: 'How do coroutines work with Java\'s CompletableFuture?',
    keywords: ['CompletableFuture', 'CompletionStage', 'await', 'future', 'asCompletableFuture', 'interop', 'java', 'kotlinx.coroutines.future'],
    short: 'Both ways, with `kotlinx.coroutines.future`. To use a Java API that returns a `CompletableFuture`, call `await()` on it in a coroutine: it suspends until the future completes, without blocking a thread. To offer Java callers a future, start a coroutine with `scope.future { … }`, or turn a `Deferred` into one with `asCompletableFuture()`.',
    answer: [
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.future.*
import java.util.concurrent.CompletableFuture

fun legacyLookup(id: Int): CompletableFuture<String> = CompletableFuture.supplyAsync { "user$id" }

fun main() = runBlocking {
    println("Kotlin awaits a Java future: \${legacyLookup(7).await()}")
    val forJava: CompletableFuture<String> = future { legacyLookup(8).await().uppercase() }
    println("Java gets a future: \${forJava.await()}")
    val deferred = async { 21 }
    println("a Deferred as a future: \${deferred.asCompletableFuture().await() * 2}")
}`),
      out(`Kotlin awaits a Java future: user7
Java gets a future: USER8
a Deferred as a future: 42`),
      'A Spring controller written in Java can call a Kotlin service through `future { }`; Kotlin code can call any Java client that returns futures without a thread blocked per call.'
    ].join('\n\n'),
    followups: [
      'Does `await()` on a `CompletableFuture` block a thread?',
      'Which scope should `future { }` run in?'
    ],
    related: ['lesson:kt-coroutine-scopes', 'q:launch-vs-async', 'q:java-interop'],
    docs: 'https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.future/'
  });
})(window.KLT);
