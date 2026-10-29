/*
 * data/interview-flow.js - the ★★ and ★ interview questions on Flow (batch 4). The two ★★★ Flow questions
 * arrived early, in batch 2 (data/interview-fast-track.js), and link these lessons too.
 *
 * The question shape is described at the top of data/interview-basics.js. Every ```kotlin block runs in
 * tests/test_content.py with kotlinx.coroutines 1.11.0, and an ```output block after one is its exact
 * output. Programs whose output is about time run on runTest's fake clock (`currentTime`).
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function norun(code) { return '```kotlin-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];
  var OPT_IN = '@file:OptIn(ExperimentalCoroutinesApi::class)\n\n';

  Q.push({
    id: 'flow-operators', track: 'flow', weight: 2,
    q: 'What are intermediate and terminal flow operators? And how do flatMapConcat, flatMapMerge and flatMapLatest differ?',
    keywords: ['flow operators', 'intermediate operator', 'terminal operator', 'map', 'filter', 'collect', 'flatMapConcat', 'flatMapMerge', 'flatMapLatest', 'switchMap', 'concatMap'],
    short: 'An **intermediate** operator (`map`, `filter`, `take`, `debounce`…) returns a new flow describing a step, and runs nothing. A **terminal** operator (`collect`, `toList`, `first`, `reduce`…) is a suspend function that runs the whole chain, each value going through every step in turn. When each value leads to a flow of its own, `flatMapConcat` runs those flows one after another, `flatMapMerge` runs them at the same time, and `flatMapLatest` cancels the one still running when a new value arrives (Reactor\'s `concatMap`, `flatMap` and `switchMap`).',
    answer: [
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun details(id: Int): Flow<String> = flow {
    delay(100)
    emit("details of $id")
}

fun main() = runTest {
    val ids = flowOf(1, 2, 3)
    val concat = ids.flatMapConcat { details(it) }.toList()
    println("concat: $concat at t=$currentTime")
    val start = currentTime
    val merged = ids.flatMapMerge { details(it) }.toList()
    println("merge: \${merged.size} results after \${currentTime - start} ms")
}`),
      out(`concat: [details of 1, details of 2, details of 3] at t=300
merge: 3 results after 100 ms`),
      'On the fake clock: three 100 ms lookups took 300 ms in turn, and 100 ms at the same time. (The three `flatMap` operators are still marked experimental in kotlinx.coroutines 1.11, hence the opt-in.)',
      '| Operator | Inner flows | Use it for |\n|---|---|---|\n| `flatMapConcat` | one after another, in order | each depends on the one before |\n| `flatMapMerge` | at the same time (16 by default) | independent work |\n| `flatMapLatest` | a new value cancels the running one | search-as-you-type |'
    ].join('\n\n'),
    followups: [
      'Why does building a chain of operators run nothing?',
      'Which `flatMap` would you use for a search box, and why?',
      'How would you write an operator of your own?'
    ],
    related: ['lesson:kt-flow-operators', 'q:flow-cold-hot', 'q:flow-backpressure'],
    docs: 'https://kotlinlang.org/docs/coroutines-flow.html#intermediate-flow-operators'
  });

  Q.push({
    id: 'flow-context', track: 'flow', weight: 2,
    q: 'What does flowOn do, and why can\'t you use withContext inside flow { }?',
    keywords: ['flowOn', 'withContext', 'context preservation', 'Flow invariant is violated', 'dispatcher', 'upstream', 'subscribeOn', 'channelFlow'],
    short: 'A flow preserves its collector\'s context: its code runs in the coroutine that collects it. So a flow may not switch context around `emit`; `withContext(Dispatchers.IO) { emit(x) }` compiles, then fails with "Flow invariant is violated", since the value would reach the collector on a thread it did not choose. `flowOn(dispatcher)` is the way to move work: it runs everything upstream of it on that dispatcher (through a channel), and leaves everything downstream, the collector included, where it was. Emitting from other coroutines needs `channelFlow { }`.',
    answer: [
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun onWorker() = Thread.currentThread().name.startsWith("DefaultDispatcher-worker")

fun main() = runBlocking {
    flow { emit(onWorker()) }
        .flowOn(Dispatchers.IO)
        .collect { emitted -> println("emitted on a worker: $emitted, collected on a worker: \${onWorker()}") }

    val broken = flow { withContext(Dispatchers.IO) { emit(1) } }
    try {
        broken.collect { }
    } catch (e: IllegalStateException) {
        println(e.message?.lineSequence()?.first())
    }
}`),
      out(`emitted on a worker: true, collected on a worker: false
Flow invariant is violated:`),
      '`flowOn` is Reactor\'s `subscribeOn` for the part above it; there is no `publishOn`, because the collector\'s own context decides the rest.'
    ].join('\n\n'),
    followups: [
      'In `a.map { }.flowOn(IO).filter { }.collect { }`, what runs on `IO`?',
      'How do you emit values from several coroutines into one flow?'
    ],
    related: ['lesson:kt-flow-context', 'q:dispatchers', 'q:flow-cold-hot'],
    docs: 'https://kotlinlang.org/docs/coroutines-flow.html#change-the-coroutine-context-of-a-cold-flow-with-flowon'
  });

  Q.push({
    id: 'flow-backpressure', track: 'flow', weight: 2,
    q: 'How does Flow handle backpressure? What do buffer, conflate and collectLatest do?',
    keywords: ['backpressure', 'buffer', 'conflate', 'collectLatest', 'slow collector', 'suspension', 'onBackpressureBuffer', 'onBackpressureLatest', 'Reactive Streams'],
    short: 'By suspension: `emit` waits until the collector has dealt with the value, so a fast producer can never outrun a slow collector, and nothing piles up. No request protocol is needed, as Reactive Streams needs. When taking turns is too slow, choose: `buffer()` runs the producer in its own coroutine with a queue, so every value is kept and the producer runs ahead; `conflate()` keeps only the latest value for the collector; `collectLatest { }` cancels the work for an old value when a new one arrives.',
    answer: [
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

val prices = flow {
    for (p in 1..5) {
        delay(100)
        emit(p)
    }
}

fun main() = runTest {
    var shown = mutableListOf<Int>()
    prices.collect { delay(250); shown += it }
    println("plain: $shown at $currentTime ms")
    for (name in listOf("buffer", "conflate", "collectLatest")) {
        shown = mutableListOf()
        val start = currentTime
        when (name) {
            "buffer" -> prices.buffer().collect { delay(250); shown += it }
            "conflate" -> prices.conflate().collect { delay(250); shown += it }
            else -> prices.collectLatest { delay(250); shown += it }
        }
        println("$name: $shown in \${currentTime - start} ms")
    }
}`),
      out(`plain: [1, 2, 3, 4, 5] at 1750 ms
buffer: [1, 2, 3, 4, 5] in 1350 ms
conflate: [1, 3, 5] in 850 ms
collectLatest: [5] in 750 ms`),
      'A price every 100 ms, a screen that takes 250 ms to show one, on the fake clock. Every value and the slowest (plain), every value and faster (buffer), the latest whenever free (conflate), or only the very last (collectLatest).'
    ].join('\n\n'),
    followups: [
      'Which would you use for a progress bar, and why?',
      'How big is the buffer `buffer()` uses?',
      'How is this different from Reactive Streams\' `request(n)`?'
    ],
    related: ['lesson:kt-flow-buffering', 'q:flow-cold-hot', 'q:flow-operators'],
    docs: 'https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/buffer.html'
  });

  Q.push({
    id: 'flow-exceptions', track: 'flow', weight: 2,
    q: 'How are exceptions handled in a Flow? What is exception transparency?',
    keywords: ['flow exceptions', 'catch', 'exception transparency', 'onCompletion', 'retry', 'retryWhen', 'try catch', 'collect'],
    short: 'An exception thrown in a flow or an operator comes out of the terminal operator, so `try` around `collect` works. Declaratively, the `catch` operator handles exceptions from everything **upstream** of it and may `emit` a fallback; it never sees one thrown downstream, by the collector. That rule, that a flow never swallows exceptions from below it, is **exception transparency**, and it also means a flow must not wrap `emit` in a `try` that catches everything. `onCompletion` runs however the flow ends; `retry` and `retryWhen` collect it again.',
    answer: [
      kt(`import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking
import java.io.IOException

fun main() = runBlocking {
    var attempts = 0
    val prices = flow {
        attempts++
        if (attempts < 3) throw IOException("timeout $attempts")
        emit(42)
    }
    prices
        .retry(1) { it is IOException }
        .catch { e -> println("gave up: \${e.message}"); emit(-1) }
        .onCompletion { cause -> println("completed, cause: $cause") }
        .collect { println("price $it") }
}`),
      out(`gave up: timeout 2
price -1
completed, cause: null`),
      'One retry was not enough (it would have worked on the third attempt), so `catch` replaced the failure; `onCompletion`, after `catch`, saw a normal end.',
      norun(`flow {
    try {
        emit(value)          // wrong: this would also catch the collector's exceptions
    } catch (e: Exception) { }
}`)
    ].join('\n\n'),
    followups: [
      'Why does `catch` not see an exception thrown in `collect { }`?',
      'Where would you put `onCompletion` to see the original failure?',
      'How do you retry with a back-off?'
    ],
    related: ['lesson:kt-flow-errors', 'q:coroutine-exceptions', 'q:flow-cold-hot'],
    docs: 'https://kotlinlang.org/docs/coroutines-flow.html#handle-exceptions-in-flows'
  });

  Q.push({
    id: 'testing-coroutines', track: 'flow', weight: 2,
    q: 'How do you test coroutines and flows?',
    keywords: ['runTest', 'testing coroutines', 'kotlinx-coroutines-test', 'virtual time', 'advanceTimeBy', 'runCurrent', 'backgroundScope', 'StandardTestDispatcher', 'UnconfinedTestDispatcher', 'Turbine'],
    short: 'With `runTest` from `kotlinx-coroutines-test`: it runs the test body as a coroutine on a fake clock, so `delay`, timeouts and retries take no real time and `currentTime` is exact. `advanceTimeBy`, `runCurrent` and `advanceUntilIdle` move the clock by hand. The code under test should take its scope or dispatcher from outside, so the test can pass its own: `backgroundScope` for work that never ends. A finite flow is tested with `toList()`, an endless one with `take(n).toList()` (or the Turbine library).',
    answer: [
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*
import kotlin.test.assertEquals

class Poller(private val scope: CoroutineScope, private val fetch: suspend () -> Int) {
    val latest = MutableStateFlow(0)

    fun start() = scope.launch {
        while (true) {
            latest.value = fetch()
            delay(1000)
        }
    }
}

fun main() = runTest {
    var calls = 0
    val poller = Poller(backgroundScope) { ++calls }
    poller.start()
    runCurrent()
    assertEquals(1, poller.latest.value)
    advanceTimeBy(2500)
    assertEquals(3, poller.latest.value)
    println("passed: $calls fetches in $currentTime ms of fake time")
}`),
      out('passed: 3 fetches in 2500 ms of fake time'),
      'Two and a half seconds of polling, tested instantly and exactly. In JUnit 5: `@Test fun polls() = runTest { … }`.'
    ].join('\n\n'),
    followups: [
      'What is the difference between `StandardTestDispatcher` and `UnconfinedTestDispatcher`?',
      'Why does `runTest` fail when a coroutine is still running at the end, and what is `backgroundScope` for?',
      'How do you test code that uses `Dispatchers.IO` inside?'
    ],
    related: ['lesson:kt-flow-testing', 'q:testing-kotlin', 'q:coroutine-scope-lifecycle'],
    docs: 'https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/'
  });

  Q.push({
    id: 'flow-vs-sequence', track: 'flow', weight: 1,
    q: 'Flow, Sequence or Reactor\'s Flux: what is the difference?',
    keywords: ['Flow', 'Sequence', 'Flux', 'Reactor', 'lazy', 'suspend', 'stream', 'Stream', 'cold'],
    short: 'All three are lazy streams. A `Sequence` is synchronous: computing a value cannot suspend, so it cannot wait for a network call without blocking. A `Flow` is a `Sequence` whose steps may suspend, collected in a coroutine, with cancellation and structured concurrency for free. Reactor\'s `Flux` does what Flow does, with callbacks, a larger operator set and a request-based backpressure protocol; Flow\'s operators are short suspend functions, and its backpressure is suspension.',
    answer: [
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun numbersSeq() = sequence { for (i in 1..3) yield(i) }

fun numbersFlow() = flow {
    for (i in 1..3) {
        delay(10)
        emit(i)
    }
}

fun main() = runBlocking {
    println(numbersSeq().map { it * 2 }.toList())
    println(numbersFlow().map { it * 2 }.toList())
}`),
      out(`[2, 4, 6]
[2, 4, 6]`),
      'The same pipeline, and the same answer. But a `delay` inside `sequence { }` does not compile: its block allows only its own `yield`, never other suspend calls.',
      '| | `Sequence` | `Flow` | `Flux` |\n|---|---|---|---|\n| A step can wait | no | yes (suspends) | yes (callbacks) |\n| Consumed by | `toList`, `forEach`… | `collect`, in a coroutine | `subscribe` |\n| Cancellation | none | the coroutine\'s | `Disposable` |'
    ].join('\n\n'),
    followups: [
      'Why can a `sequence { }` block not call `delay`?',
      'How would you turn a `Flux` into a `Flow`?'
    ],
    related: ['lesson:kt-flow-basics', 'q:sequences', 'q:flow-cold-hot'],
    docs: 'https://kotlinlang.org/docs/coroutines-flow.html'
  });

  Q.push({
    id: 'statein-sharein', track: 'flow', weight: 1,
    q: 'How do you turn a cold flow into a hot one? What are stateIn, shareIn and SharingStarted?',
    keywords: ['stateIn', 'shareIn', 'SharingStarted', 'WhileSubscribed', 'Eagerly', 'Lazily', 'hot flow', 'cold flow', 'replay', 'StateFlow', 'SharedFlow'],
    short: '`stateIn(scope, started, initialValue)` runs a cold flow once, in a scope, and shares it as a `StateFlow`; `shareIn(scope, started, replay)` shares it as a `SharedFlow`. Every collector then shares one run instead of starting its own. `SharingStarted` says when the upstream runs: `Eagerly` (at once), `Lazily` (from the first collector, then forever), or `WhileSubscribed(ms)` (while someone collects, stopping that long after the last one leaves).',
    answer: [
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun main() = runTest {
    var runs = 0
    val prices = flow {
        runs++
        emit(10)
        delay(100)
        emit(20)
    }
    prices.toList()
    prices.toList()
    println("cold, collected twice: it ran $runs times")

    runs = 0
    val shared = prices.shareIn(backgroundScope, SharingStarted.Eagerly, replay = 2)
    delay(200)
    println("shared: \${shared.take(2).toList()} and \${shared.take(2).toList()}, and it ran $runs time")
}`),
      out(`cold, collected twice: it ran 2 times
shared: [10, 20] and [10, 20], and it ran 1 time`),
      'A screen\'s ViewModel typically writes `repository.items().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())`: one database query however many views watch it, kept alive across a quick rotation.'
    ].join('\n\n'),
    followups: [
      'What does `WhileSubscribed(5000)` gain over `Eagerly`?',
      'When would you choose `shareIn` over `stateIn`?'
    ],
    related: ['lesson:kt-stateflow-sharedflow', 'q:stateflow-vs-sharedflow', 'q:flow-cold-hot'],
    docs: 'https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/state-in.html'
  });
})(window.KLT);
