/*
 * data/lessons-flow.js - Track 7, Flow: seven lessons on kotlinx.coroutines' flows for a Java developer
 * who knows streams, and perhaps Reactor (batch 4).
 *
 * The lesson shape is described at the top of data/lessons-basics.js. Every ```kotlin block runs in
 * tests/test_content.py with kotlinx.coroutines 1.11.0, and an ```output block after one is its exact
 * output. A flow's behaviour is about time, so most programs here run on runTest's fake clock and print
 * `currentTime` (see Coroutines, lesson 1): their times are exact on any PC. Checks use that clock too.
 * Code is written in template literals: a Kotlin ${…} is \${…}.
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function norun(code) { return '```kotlin-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function java(code) { return '```java\n' + code + '\n```'; }
  var L = U.data.lessons = U.data.lessons || [];
  var OPT_IN = '@file:OptIn(ExperimentalCoroutinesApi::class)\n\n';                 // currentTime, flatMapLatest
  var PREVIEW = '@file:OptIn(ExperimentalCoroutinesApi::class, FlowPreview::class)\n\n';   // and debounce

  /* ---------------------------------------------------------------- 1 */
  L.push({
    id: 'kt-flow-basics', track: 'flow', title: 'Cold flows',
    summary: 'A Flow is a stream of values computed by suspending code: built with flow { emit() }, run by a terminal operator such as collect. It is cold: it runs for each collector, and only then. Builders, terminal operators, Flow next to Sequence and Reactor, and callbackFlow.',
    keywords: ['flow', 'Flow', 'cold flow', 'emit', 'collect', 'flowOf', 'asFlow', 'terminal operator', 'toList', 'first', 'callbackFlow', 'Flux', 'reactive', 'stream', 'Sequence'],
    docs: 'https://kotlinlang.org/docs/coroutines-flow.html',
    body: [
      '## A stream that can suspend',
      'A `Sequence` gives values one at a time, but computing each one cannot pause; a suspend function can pause, but gives one value. A `Flow<T>` is both: a stream of values whose code can suspend between them. `flow { … }` builds one, `emit` sends a value, and `collect` receives them:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun temperatures(): Flow<Int> = flow {
    for (t in listOf(18, 21, 24)) {
        delay(100)          // a sensor, a database, a network call…
        emit(t)
    }
}

fun main() = runBlocking {
    temperatures().collect { println("$it °C") }
}`),
      out(`18 °C
21 °C
24 °C`),
      '`collect` is a suspend function: the collector waits while the flow works, and each `emit` hands one value over.',
      '## Cold: it runs for each collector, and only then',
      'Building a flow runs none of its code. Each **terminal operator** (`collect`, `toList`, `first`…) runs it, from the start:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun main() = runBlocking {
    val numbers = flow {
        println("the flow starts")
        emit(1)
        emit(2)
    }
    println("built the flow")
    numbers.collect { println("A got $it") }
    numbers.collect { println("B got $it") }
}`),
      out(`built the flow
the flow starts
A got 1
A got 2
the flow starts
B got 1
B got 2`),
      'This is what **cold** means: like a function, a flow does nothing until it is called, and each call is a run of its own. A *hot* flow (`StateFlow`, `SharedFlow`) exists apart from its collectors ([[lesson:kt-stateflow-sharedflow]]). The explainer [[explain:flow-timeline]] draws both on a timeline.',
      '## Builders',
      kt(`import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    println(flowOf("a", "b", "c").toList())
    println((1..3).asFlow().toList())
    println(listOf(true, false).asFlow().toList())
    println(emptyFlow<Int>().toList())
}`),
      out(`[a, b, c]
[1, 2, 3]
[true, false]
[]`),
      '## Terminal operators: what runs the flow',
      '`collect` runs it for every value; `toList` gathers them; `first`, `single`, `reduce`, `fold` and `count` give one answer. `first` cancels the flow once it has its value, so the flow does no more work than needed:',
      kt(`import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val numbers = flow {
        for (i in 1..1000) {
            println("made $i")
            emit(i)
        }
    }
    println("first above 2: \${numbers.first { it > 2 }}")
}`),
      out(`made 1
made 2
made 3
first above 2: 3`),
      'The other 997 were never made. Everything between the builder and the terminal operator (`map`, `filter`…) only describes steps: [[lesson:kt-flow-operators]].',
      '## Flow, Sequence, List and Reactor',
      '| | `List` | `Sequence` | `Flow` | Reactor `Flux` |\n|---|---|---|---|---|\n| Values computed | all at once | one at a time, lazily | one at a time, lazily | one at a time |\n| Can a step wait (suspend)? | no | no | yes | yes, with callbacks |\n| Consumed by | a loop | a terminal call | a terminal call, in a coroutine | `subscribe` |\n| Backpressure | none needed | none needed | suspension: a slow collector makes `emit` wait | requests, `onBackpressure…` |',
      'Flow is to `Sequence` what `suspend` is to a normal function. Compared with Reactor, it has fewer operators, and every one of them is a short suspend function you can read.',
      '## callbackFlow: a listener API as a flow',
      'Many APIs report events through a listener. `callbackFlow` turns one into a flow: register the listener, send each event with `trySend`, and say in `awaitClose` how to unregister, which runs when the collector stops:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlinx.coroutines.flow.*

class Clicker {
    fun start(onClick: (Int) -> Unit) {
        Thread {
            for (i in 1..5) {
                Thread.sleep(20)
                onClick(i)
            }
        }.start()
    }

    fun stop() = println("listener removed")
}

fun Clicker.clicks(): Flow<Int> = callbackFlow {
    start { n -> trySend(n) }
    awaitClose { stop() }
}

fun main() = runBlocking {
    Clicker().clicks().take(3).collect { println("click $it") }
    println("done")
}`),
      out(`click 1
click 2
click 3
listener removed
done`),
      '`take(3)` stopped collecting after three clicks, which closed the flow and ran `awaitClose`: the listener was removed even though the clicker went on clicking.'
    ].join('\n\n'),
    java: [
      java(`// Reactor
Flux<Integer> temperatures = Flux.just(18, 21, 24).delayElements(Duration.ofMillis(100));
temperatures.subscribe(t -> System.out.println(t + " °C"));    // returns at once; values come later

// java.util.stream: lazy, but cannot wait between values, and runs once
Stream<Integer> s = Stream.of(18, 21, 24);`),
      'A cold Flow is a `Flux` before anyone subscribes, and collecting is subscribing. Where Reactor\'s operators take callbacks, a flow\'s code is ordinary sequential code with suspend calls in it, and `collect` simply suspends until the flow ends, so errors and cancellation work as they do everywhere else in coroutines.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun pages(): Flow<String> = flow {
    for (n in 1..3) {
        println("loading page $n")
        delay(100)
        emit("page $n")
    }
}

fun main() = runBlocking {
    println(pages().first())
    println(pages().toList())
}`,
      note: '`first()` loaded one page and stopped; `toList()` started again from page 1 and loaded all three. Try `pages().take(2).toList()`.'
    },
    challenge: {
      title: 'A countdown',
      task: 'Two functions:\n\n1. `countdown(from)`: a flow that emits `from`, `from - 1`, … down to 1, waiting 1000 ms before each value. Building it must not start the count.\n2. `firstOver(numbers, limit)`: the first value of the flow greater than `limit`, or `null` if there is none. It should stop the flow as soon as it has its answer.',
      starter: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun countdown(from: Int): Flow<Int> = TODO("from down to 1, 1000 ms before each")

suspend fun firstOver(numbers: Flow<Int>, limit: Int): Int? = TODO("the first value above limit, or null")

fun main() = runBlocking {
    countdown(3).collect { println(it) }
    println(firstOver(flowOf(1, 5, 9), 4))
}`,
      solution: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun countdown(from: Int): Flow<Int> = flow {
    for (n in from downTo 1) {
        delay(1000)
        emit(n)
    }
}

suspend fun firstOver(numbers: Flow<Int>, limit: Int): Int? = numbers.firstOrNull { it > limit }

fun main() = runBlocking {
    countdown(3).collect { println(it) }
    println(firstOver(flowOf(1, 5, 9), 4))
}`,
      hints: [
        '`flow { for (n in from downTo 1) { delay(1000); emit(n) } }`: the loop runs only when someone collects.',
        '`firstOrNull { it > limit }` is a terminal operator: it gives the first match, or null, and cancels the flow once it has one.'
      ],
      checks: [
        { label: '`countdown(3)` gives 3, 2, 1', code: 'runTest { eq(countdown(3).toList(), listOf(3, 2, 1)) }' },
        { label: 'Building it starts nothing; collecting it takes 1000 ms per value on the fake clock', code: 'runTest {\n    val f = countdown(3)\n    eq(currentTime, 0L)\n    f.toList()\n    eq(currentTime, 3000L)\n}' },
        { label: 'It is cold: collected twice, it runs twice', code: 'runTest {\n    val f = countdown(2)\n    eq(f.toList(), listOf(2, 1))\n    eq(f.toList(), listOf(2, 1))\n    eq(currentTime, 4000L)\n}' },
        { label: '`firstOver` finds the first value above the limit, or null', code: 'runTest {\n    eq(firstOver(flowOf(1, 5, 9), 4), 5)\n    eq(firstOver(flowOf(1, 2), 5), null)\n}' },
        { label: '`firstOver` stops the flow once it has its answer', code: 'runTest {\n    eq(firstOver(countdown(5), 3), 5)\n    eq(currentTime, 1000L)\n}' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'kt-flow-operators', track: 'flow', title: 'Operators',
    summary: 'Intermediate operators describe steps; nothing runs until a terminal one. map, filter, transform, take and onEach; zip against combine; flatMapConcat, flatMapMerge and flatMapLatest; distinctUntilChanged and debounce, on the fake clock.',
    keywords: ['flow operators', 'map', 'filter', 'transform', 'take', 'onEach', 'zip', 'combine', 'flatMapConcat', 'flatMapMerge', 'flatMapLatest', 'distinctUntilChanged', 'debounce', 'fold', 'reduce', 'intermediate operator'],
    docs: 'https://kotlinlang.org/docs/coroutines-flow.html#intermediate-flow-operators',
    body: [
      '## Steps, run one value at a time',
      'An intermediate operator (`map`, `filter`, `take`…) returns a new flow that describes a step; it runs nothing. When a terminal operator collects the chain, each value goes through every step before the next value is made:',
      kt(`import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    (1..4).asFlow()
        .onEach { println("made $it") }
        .filter { it % 2 == 0 }
        .map { it * 10 }
        .collect { println("collected $it") }
}`),
      out(`made 1
made 2
collected 20
made 3
made 4
collected 40`),
      'Value by value, like a `Sequence`, not stage by stage like a `List`. The steps\' lambdas may suspend: `map { fetchPrice(it) }` is fine.',
      '## transform, take and the folds',
      '`transform` is the general operator: for each value, emit as many values as you like, or none. `take(n)` stops the flow after n. `reduce` and `fold` are terminal:',
      kt(`import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val lines = flowOf("a b", "c", "d e f")
        .transform { line -> line.split(" ").forEach { emit(it) } }
    println(lines.toList())
    println(lines.take(4).toList())
    println(lines.fold("") { acc, w -> acc + w.uppercase() })
}`),
      out(`[a, b, c, d, e, f]
[a, b, c, d]
ABCDEF`),
      '## zip and combine',
      'Two flows into one. `zip` pairs them one to one, waiting for both; `combine` gives a value whenever either changes, from the latest of each. On the fake clock, prices every 100 ms and a currency rate every 250 ms:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

val prices = flow { for (p in listOf(10, 20, 30)) { delay(100); emit(p) } }
val rates = flow { for (r in listOf(1, 2)) { delay(250); emit(r) } }

fun main() = runTest {
    prices.zip(rates) { p, r -> p * r }.collect { println("t=$currentTime zip $it") }
    val start = currentTime
    prices.combine(rates) { p, r -> p * r }.collect { println("t=\${currentTime - start} combine $it") }
}`),
      out(`t=250 zip 10
t=500 zip 40
t=250 combine 20
t=300 combine 30
t=500 combine 60`),
      '`zip` made two pairs (10 × 1, 20 × 2) and stopped with the shorter flow. `combine` waited for one value from each (at 250 ms: the latest price, 20, and the first rate), then recomputed on every change: a form whose total depends on several fields.',
      '## Flattening: one flow per value',
      'When each value leads to a flow of its own (each search term to a flow of results), three operators flatten them, and differ in timing. kotlinx.coroutines 1.11 still marks them experimental, hence the opt-in:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun results(term: String): Flow<String> = flow {
    delay(150)
    emit("$term: result")
}

val terms = flow {
    emit("k")
    delay(100)
    emit("ko")
}

fun main() = runTest {
    terms.flatMapConcat { results(it) }.collect { println("t=$currentTime concat $it") }
    var start = currentTime
    terms.flatMapMerge { results(it) }.collect { println("t=\${currentTime - start} merge $it") }
    start = currentTime
    terms.flatMapLatest { results(it) }.collect { println("t=\${currentTime - start} latest $it") }
}`),
      out(`t=150 concat k: result
t=400 concat ko: result
t=150 merge k: result
t=250 merge ko: result
t=250 latest ko: result`),
      '`flatMapConcat` took longest: while the search for "k" ran, the terms flow itself waited, so "ko" was not even sent until 250 ms. `flatMapMerge` let both searches run at once; `flatMapLatest` cancelled the search for "k" when "ko" came, and finished only the newest.',
      '| Operator | Inner flows run | Use it for |\n|---|---|---|\n| `flatMapConcat` | one after another, in order | each step needs the previous one |\n| `flatMapMerge` | at the same time | independent work, order does not matter |\n| `flatMapLatest` | a new value cancels the one still running | searches, where only the newest matters |',
      '## distinctUntilChanged and debounce',
      '`distinctUntilChanged` drops a value equal to the one before it. `debounce(ms)` lets a value through only once no newer one has come for that long: a search box that waits for typing to pause. (`debounce` is a "preview" API, so it opts in too.)',
      kt(PREVIEW + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

val typed = flow {
    emit("k"); delay(100)
    emit("ko"); delay(100)
    emit("kot"); delay(400)
    emit("kot"); delay(400)
    emit("kotlin")
}

fun main() = runTest {
    typed.distinctUntilChanged()
        .debounce(300)
        .collect { println("t=$currentTime search $it") }
}`),
      out(`t=500 search kot
t=1000 search kotlin`),
      '"k" and "ko" were replaced within 300 ms, so they never reached the search; the repeated "kot" was dropped by `distinctUntilChanged`; and the last value goes through when the flow ends.'
    ].join('\n\n'),
    java: [
      java(`Flux.range(1, 4)
    .doOnNext(n -> System.out.println("made " + n))
    .filter(n -> n % 2 == 0)
    .map(n -> n * 10)
    .subscribe(n -> System.out.println("collected " + n));
// zip, combineLatest, concatMap, flatMap, switchMap, distinctUntilChanged, sampleTimeout(debounce)`),
      'The operators map onto Reactor\'s almost one for one: `onEach` is `doOnNext`, `combine` is `combineLatest`, `flatMapConcat`/`Merge`/`Latest` are `concatMap`/`flatMap`/`switchMap`. Writing your own operator needs no special API: it is an extension function that collects one flow inside a `flow { }` builder.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking

data class Order(val id: Int, val total: Int, val paid: Boolean)

val orders = flowOf(Order(1, 30, true), Order(2, 120, false), Order(3, 75, true), Order(4, 200, true))

fun main() = runBlocking {
    val revenue = orders
        .filter { it.paid }
        .map { it.total }
        .onEach { println("counting $it") }
        .fold(0) { sum, t -> sum + t }
    println("revenue: $revenue")
}`,
      note: 'Add `.take(2)` after the `filter`: only the first two paid orders are counted, and the rest are never looked at.'
    },
    challenge: {
      title: 'A search box, and scores',
      task: 'Two functions:\n\n1. `searchTerms(typed)`: from what is typed, the terms to search for. Trim each one, ignore terms shorter than 2 letters, drop a term equal to the one before it, and let a term through only after typing has paused for 300 ms (`debounce`).\n2. `labelled(names, scores)`: pair each name with its score, one to one, as `"Asha: 90"`; stop when either flow ends.',
      starter: `@file:OptIn(FlowPreview::class)

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun searchTerms(typed: Flow<String>): Flow<String> = TODO("trim, at least 2 letters, distinct, debounce(300)")

fun labelled(names: Flow<String>, scores: Flow<Int>): Flow<String> = TODO("\\"name: score\\", one to one")

fun main() = runBlocking {
    println(searchTerms(flowOf(" ko ", "kotlin")).toList())
    println(labelled(flowOf("Asha", "Ravi"), flowOf(90, 85)).toList())
}`,
      solution: `@file:OptIn(FlowPreview::class)

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun searchTerms(typed: Flow<String>): Flow<String> = typed
    .map { it.trim() }
    .filter { it.length >= 2 }
    .distinctUntilChanged()
    .debounce(300)

fun labelled(names: Flow<String>, scores: Flow<Int>): Flow<String> =
    names.zip(scores) { name, score -> "$name: $score" }

fun main() = runBlocking {
    println(searchTerms(flowOf(" ko ", "kotlin")).toList())
    println(labelled(flowOf("Asha", "Ravi"), flowOf(90, 85)).toList())
}`,
      hints: [
        'Chain them in this order: `.map { it.trim() }`, `.filter { it.length >= 2 }`, `.distinctUntilChanged()`, `.debounce(300)`. `debounce` needs the opt-in already at the top of the file.',
        '`names.zip(scores) { name, score -> "$name: $score" }` pairs them one to one and stops with the shorter flow.'
      ],
      checks: [
        { label: 'Only the terms typed before a pause get through', code: 'runTest {\n    val typed = flow { emit("k"); delay(100); emit("ko"); delay(100); emit("kot"); delay(500); emit(" kot "); delay(500); emit("java") }\n    eq(searchTerms(typed).toList(), listOf("kot", "java"))\n}' },
        { label: 'Terms are trimmed, and terms shorter than 2 letters ignored', code: 'runTest { eq(searchTerms(flowOf(" x ", " ab ")).toList(), listOf("ab")) }' },
        { label: 'A term waits for a 300 ms pause in typing', code: 'runTest {\n    val first = searchTerms(flow { emit("kotlin"); delay(1000) }).first()\n    eq(first, "kotlin")\n    eq(currentTime, 300L)\n}' },
        { label: '`labelled` pairs names and scores one to one', code: 'runTest { eq(labelled(flowOf("Asha", "Ravi", "Li"), flowOf(90, 85)).toList(), listOf("Asha: 90", "Ravi: 85")) }' },
        { label: '`searchTerms` uses `debounce` and `distinctUntilChanged`', code: 'ok(uses("""\\.debounce\\s*\\(""") && uses("""\\.distinctUntilChanged\\s*\\("""), "debounce(300) and distinctUntilChanged()")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'kt-flow-context', track: 'flow', title: 'Context and flowOn',
    summary: 'A flow runs in the coroutine of whoever collects it, so withContext around emit is an error. flowOn moves only what is upstream of it to another dispatcher; launchIn with onEach collects in a scope of your choosing.',
    keywords: ['flowOn', 'context preservation', 'Flow invariant is violated', 'withContext', 'launchIn', 'onEach', 'dispatcher', 'upstream', 'downstream', 'channelFlow'],
    docs: 'https://kotlinlang.org/docs/coroutines-flow.html#change-the-coroutine-context-of-a-cold-flow-with-flowon',
    body: [
      '## A flow runs where it is collected',
      'A cold flow\'s code runs in the coroutine that collects it, on that coroutine\'s dispatcher. This is **context preservation**: the code that collects decides where things run, never the flow, so a flow can be collected safely from a UI thread or a request\'s coroutine:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun where() = if (Thread.currentThread().name.startsWith("DefaultDispatcher-worker")) "a worker" else Thread.currentThread().name

val numbers = flow {
    println("emitting on \${where()}")
    emit(1)
}

fun main() = runBlocking {
    numbers.collect { println("collecting on \${where()}") }
    withContext(Dispatchers.Default) {
        numbers.collect { println("collecting on \${where()}") }
    }
}`),
      out(`emitting on main
collecting on main
emitting on a worker
collecting on a worker`),
      '## withContext around emit is an error',
      'So a flow may not switch its own context around `emit`: the value would reach the collector on a thread the collector did not choose. It compiles, and fails when collected:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun main() = runBlocking {
    val wrong = flow {
        withContext(Dispatchers.IO) { emit(1) }
    }
    try {
        wrong.collect { println(it) }
    } catch (e: IllegalStateException) {
        println(e.message?.lineSequence()?.first())
    }
}`),
      out('Flow invariant is violated:'),
      'The full message ends: *Please refer to \'flow\' documentation or use \'flowOn\' instead.* (This tool\'s hint says the same when it happens in your code.) Emitting from a coroutine the flow `launch`ed fails the same way; `channelFlow { }` is the builder for that.',
      '## flowOn: change where the upstream runs',
      '`flowOn(dispatcher)` runs everything *before* it in the chain on that dispatcher, and leaves everything after it, the collector included, where it was:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun where() = if (Thread.currentThread().name.startsWith("DefaultDispatcher-worker")) "a worker" else Thread.currentThread().name

fun main() = runBlocking {
    flow {
        println("reading the file on \${where()}")
        emit("data")
    }
        .map { println("parsing on \${where()}"); it.length }
        .flowOn(Dispatchers.IO)
        .map { println("formatting on \${where()}"); "$it bytes" }
        .collect { println("showing \\"$it\\" on \${where()}") }
}`),
      out(`reading the file on a worker
parsing on a worker
formatting on main
showing "4 bytes" on main`),
      'Upstream of `flowOn` ran on `IO`; downstream stayed on `main`. Between the two, `flowOn` puts a buffer (a channel), so the upstream can run ahead of the collector ([[lesson:kt-flow-buffering]]).',
      '## launchIn: collect in a scope',
      '`collect` suspends until the flow ends, which for an endless flow (events, ticks) is never. `onEach { … }.launchIn(scope)` collects in a new coroutine of that scope instead, and returns its `Job` at once:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

val ticks = flow {
    var n = 0
    while (true) {
        delay(100)
        emit(++n)
    }
}

fun main() = runBlocking {
    val job = ticks.onEach { println("tick $it") }.launchIn(this)
    println("collecting in the background")
    delay(350)
    job.cancel()
    println("stopped")
}`),
      out(`collecting in the background
tick 1
tick 2
tick 3
stopped`),
      'The scope owns the collection: cancel the `Job`, or the scope, and it stops. It reads as one chain, which is why UI code writes `events.onEach { … }.launchIn(viewModelScope)`.'
    ].join('\n\n'),
    java: [
      java(`Flux.defer(() -> Flux.just(readFile()))
    .map(this::parse)
    .subscribeOn(Schedulers.boundedElastic())     // where the source and the steps run
    .publishOn(uiScheduler)                       // where everything after this runs
    .subscribe(this::show);`),
      '`flowOn` is Reactor\'s `subscribeOn`, limited to the part above it, and there is no `publishOn`: the collector\'s own context decides where downstream runs. One rule replaces two operators, and a flow can never surprise its collector with a thread it did not choose.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun where() = if (Thread.currentThread().name == "main") "main" else "a worker"

fun main() = runBlocking {
    (1..3).asFlow()
        .map { n -> println("squaring $n on \${where()}"); n * n }
        .flowOn(Dispatchers.Default)
        .collect { println("got $it on \${where()}") }
}`,
      note: 'Move `.flowOn(Dispatchers.Default)` above the `map`: now the squaring runs on `main` too, because nothing upstream of `flowOn` is left but the numbers.'
    },
    challenge: {
      title: 'Read off the caller\'s thread',
      task: 'Two functions:\n\n1. `lines()`: a flow of the lines `readLines()` returns. `readLines()` blocks, so the flow must run it on `Dispatchers.IO`, with `flowOn`, while the collector stays where it is.\n2. `watch(scope, events, log)`: collect `events` in the given scope, adding each to `log`, and return the `Job` at once (use `onEach` and `launchIn`).',
      starter: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

var readThread = ""

fun readLines(): List<String> {
    readThread = Thread.currentThread().name
    Thread.sleep(30)
    return listOf("first", "second")
}

fun lines(): Flow<String> = TODO("emit each line of readLines(), run on Dispatchers.IO")

fun watch(scope: CoroutineScope, events: Flow<String>, log: MutableList<String>): Job = TODO("onEach + launchIn")

fun main() = runBlocking {
    println(lines().toList())
    val log = mutableListOf<String>()
    watch(this, flowOf("a", "b"), log).join()
    println(log)
}`,
      solution: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

var readThread = ""

fun readLines(): List<String> {
    readThread = Thread.currentThread().name
    Thread.sleep(30)
    return listOf("first", "second")
}

fun lines(): Flow<String> = flow {
    for (line in readLines()) emit(line)
}.flowOn(Dispatchers.IO)

fun watch(scope: CoroutineScope, events: Flow<String>, log: MutableList<String>): Job =
    events.onEach { log += it }.launchIn(scope)

fun main() = runBlocking {
    println(lines().toList())
    val log = mutableListOf<String>()
    watch(this, flowOf("a", "b"), log).join()
    println(log)
}`,
      hints: [
        '`flow { for (line in readLines()) emit(line) }.flowOn(Dispatchers.IO)`: the builder runs upstream of `flowOn`, so `readLines()` runs on `IO`.',
        '`events.onEach { log += it }.launchIn(scope)` starts the collection in the scope and returns its `Job`.'
      ],
      checks: [
        { label: '`lines()` gives the lines', code: 'eq(runBlocking { lines().toList() }, listOf("first", "second"))' },
        { label: '`readLines` runs on a worker thread', code: 'runBlocking { lines().toList() }\nok(readThread.startsWith("DefaultDispatcher-worker"), "readLines ran on \\"$readThread\\": add .flowOn(Dispatchers.IO)")' },
        { label: 'The collector stays on its own thread', code: 'var collectThread = ""\nrunBlocking { lines().collect { collectThread = Thread.currentThread().name } }\nok(!collectThread.startsWith("DefaultDispatcher-worker"), "the collector should stay where it is, not on $collectThread")' },
        { label: '`watch` returns at once, and collects in the scope', code: 'val log = mutableListOf<String>()\nrunTest {\n    val job = watch(this, flow { delay(100); emit("a"); delay(100); emit("b") }, log)\n    eq(log, listOf<String>())\n    job.join()\n    eq(log, listOf("a", "b"))\n    eq(currentTime, 200L)\n}' },
        { label: '`lines` uses `flowOn`, and `watch` uses `launchIn`', code: 'ok(uses("""\\.flowOn\\s*\\(""") && uses("""\\.launchIn\\s*\\("""), "flowOn(Dispatchers.IO) in lines(), launchIn(scope) in watch()")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'kt-flow-buffering', track: 'flow', title: 'Buffering',
    summary: 'A slow collector makes emit wait: backpressure is just suspension. buffer lets the producer run ahead, conflate keeps only the latest value, and collectLatest drops work that a newer value makes useless. Each measured on the fake clock.',
    keywords: ['buffer', 'conflate', 'collectLatest', 'backpressure', 'slow collector', 'fast producer', 'channel', 'flow buffering', 'onBackpressureBuffer', 'onBackpressureLatest'],
    docs: 'https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/buffer.html',
    body: [
      '## Backpressure is suspension',
      'Without help, a flow and its collector take turns: `emit` hands a value over and waits until the collector is done with it. A producer making a price every 100 ms and a screen taking 250 ms to show one, on the fake clock:',
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
    val shown = mutableListOf<Int>()
    prices.collect {
        delay(250)
        shown += it
    }
    println("$shown after $currentTime ms")
}`),
      out('[1, 2, 3, 4, 5] after 1750 ms'),
      '5 × (100 + 250) = 1750: never both working at once. The producer cannot outrun the collector, so nothing piles up: that is Flow\'s backpressure, with no API of its own.',
      '## Three ways to stop waiting',
      'The same prices and the same slow screen, three ways:',
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
    var start = currentTime
    prices.buffer().collect { delay(250); shown += it }
    println("buffer: $shown after \${currentTime - start} ms")

    shown = mutableListOf()
    start = currentTime
    prices.conflate().collect { delay(250); shown += it }
    println("conflate: $shown after \${currentTime - start} ms")

    shown = mutableListOf()
    start = currentTime
    prices.collectLatest { delay(250); shown += it }
    println("collectLatest: $shown after \${currentTime - start} ms")
}`),
      out(`buffer: [1, 2, 3, 4, 5] after 1350 ms
conflate: [1, 3, 5] after 850 ms
collectLatest: [5] after 750 ms`),
      '| Operator | What happens to values the collector is too slow for | Use it when |\n|---|---|---|\n| `buffer()` | they wait in a queue; the producer runs ahead | every value matters, and the producer has its own work to do |\n| `conflate()` | only the latest waits; older ones are dropped | only the current value matters: prices, positions, progress |\n| `collectLatest { }` | a new value cancels the block still busy with the old one | the work is useless once a newer value exists: a search, a re-render |',
      '`buffer()` runs the producer in a coroutine of its own, with a channel between it and the collector (64 places by default; `buffer(10)` chooses). The explainer [[explain:flow-timeline]] steps through `buffer` and `collectLatest` on a timeline.'
    ].join('\n\n'),
    java: [
      java(`Flux.interval(Duration.ofMillis(100))
    .onBackpressureBuffer()          // buffer()
    // .onBackpressureLatest()       // conflate()
    .publishOn(Schedulers.single())
    .subscribe(this::slowShow);

prices.switchMap(p -> render(p));    // collectLatest's idea, as an operator`),
      'Reactive Streams makes backpressure a protocol: the subscriber requests n items, and the publisher must respect it. Flow gets the same effect for free from suspension, and you choose a strategy only when taking turns is too slow.'
    ].join('\n\n'),
    example: {
      code: OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

val progress = flow {
    for (percent in 0..100 step 10) {
        delay(50)
        emit(percent)
    }
}

fun main() = runTest {
    progress.conflate().collect { p ->
        println("t=$currentTime showing $p%")
        delay(200)
    }
}`,
      note: 'A progress bar needs only the latest value: `conflate` skips the ones the screen had no time for. Remove it and every value is shown, the bar lagging further and further behind.'
    },
    challenge: {
      title: 'A screen that keeps up',
      task: '`prices` emits 1 to 5, one every 100 ms, and showing one takes 250 ms. Write three suspend functions that each collect `prices` into a list and return it:\n\n1. `showAll()`: show every price, but let the producer run ahead (`buffer`). It takes 1350 ms.\n2. `showCurrent()`: show only the latest price whenever the screen is free (`conflate`): `[1, 3, 5]` in 850 ms.\n3. `showLast()`: drop a price being shown as soon as a newer one comes (`collectLatest`): `[5]` in 750 ms.',
      starter: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

val prices = flow {
    for (p in 1..5) {
        delay(100)
        emit(p)
    }
}

suspend fun show(p: Int, shown: MutableList<Int>) {
    delay(250)
    shown += p
}

suspend fun showAll(): List<Int> = TODO("every price, the producer running ahead")

suspend fun showCurrent(): List<Int> = TODO("only the latest price when the screen is free")

suspend fun showLast(): List<Int> = TODO("drop a price as soon as a newer one comes")

fun main() = runBlocking {
    println(showAll())
    println(showCurrent())
    println(showLast())
}`,
      solution: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

val prices = flow {
    for (p in 1..5) {
        delay(100)
        emit(p)
    }
}

suspend fun show(p: Int, shown: MutableList<Int>) {
    delay(250)
    shown += p
}

suspend fun showAll(): List<Int> {
    val shown = mutableListOf<Int>()
    prices.buffer().collect { show(it, shown) }
    return shown
}

suspend fun showCurrent(): List<Int> {
    val shown = mutableListOf<Int>()
    prices.conflate().collect { show(it, shown) }
    return shown
}

suspend fun showLast(): List<Int> {
    val shown = mutableListOf<Int>()
    prices.collectLatest { show(it, shown) }
    return shown
}

fun main() = runBlocking {
    println(showAll())
    println(showCurrent())
    println(showLast())
}`,
      hints: [
        'Each function makes a `mutableListOf<Int>()`, collects into it with `show(it, shown)`, and returns it.',
        'Only the operator differs: `prices.buffer().collect { … }`, `prices.conflate().collect { … }`, and `prices.collectLatest { … }` (a terminal operator itself).'
      ],
      checks: [
        { label: '`showAll` shows every price in 1350 ms', code: 'runTest {\n    eq(showAll(), listOf(1, 2, 3, 4, 5))\n    eq(currentTime, 1350L)\n}' },
        { label: '`showCurrent` shows [1, 3, 5] in 850 ms', code: 'runTest {\n    eq(showCurrent(), listOf(1, 3, 5))\n    eq(currentTime, 850L)\n}' },
        { label: '`showLast` shows [5] in 750 ms', code: 'runTest {\n    eq(showLast(), listOf(5))\n    eq(currentTime, 750L)\n}' },
        { label: 'They use `buffer`, `conflate` and `collectLatest`', code: 'ok(uses("""\\.buffer\\s*\\(""") && uses("""\\.conflate\\s*\\(""") && uses("""\\.collectLatest\\b"""), "one of each: buffer(), conflate(), collectLatest { }")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'kt-flow-errors', track: 'flow', title: 'Errors',
    summary: 'An exception in a flow reaches its collector, so try around collect works. catch handles only what is upstream of it, which is exception transparency; onCompletion runs however a flow ends; retry and retryWhen start it again.',
    keywords: ['catch', 'flow exceptions', 'exception transparency', 'onCompletion', 'retry', 'retryWhen', 'try catch', 'error handling', 'onErrorResume', 'fallback'],
    docs: 'https://kotlinlang.org/docs/coroutines-flow.html#handle-exceptions-in-flows',
    body: [
      '## An exception reaches the collector',
      'A flow is code that runs inside `collect`, so an exception thrown in it, or in any operator, comes out of `collect`, and an ordinary `try` catches it:',
      kt(`import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val prices = flow {
        emit(10)
        throw IllegalStateException("the feed broke")
    }
    try {
        prices.collect { println("price $it") }
    } catch (e: IllegalStateException) {
        println("caught: \${e.message}")
    }
}`),
      out(`price 10
caught: the feed broke`),
      '## catch: handle the upstream, declaratively',
      'The `catch` operator handles an exception from anything *above* it, and may emit something in its place. It never sees an exception thrown *below* it, by the collector:',
      kt(`import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    flow {
        emit(1)
        throw IllegalStateException("upstream broke")
    }
        .catch { e -> println("catch saw: \${e.message}"); emit(-1) }
        .collect { println("collected $it") }

    try {
        flowOf(1, 2)
            .catch { println("catch saw it") }
            .collect { if (it == 2) throw IllegalStateException("the collector failed") }
    } catch (e: IllegalStateException) {
        println("only a try around collect saw: \${e.message}")
    }
}`),
      out(`collected 1
catch saw: upstream broke
collected -1
only a try around collect saw: the collector failed`),
      'This is **exception transparency**: an operator does not swallow exceptions from downstream. It is also a rule for your own flows: never put `emit` inside a `try` that catches everything, or you would catch the collector\'s exceptions as if they were yours. Use `catch` instead.',
      '## onCompletion: however it ends',
      '`onCompletion` runs when the flow ends, with the exception as `cause`, or null for a normal end (cancellation counts as an exception). Where it sits matters:',
      kt(`import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    flow {
        emit(1)
        throw IllegalStateException("broke")
    }
        .onCompletion { cause -> println("before catch, cause: \${cause?.message}") }
        .catch { emit(-1) }
        .onCompletion { cause -> println("after catch, cause: \${cause?.message}") }
        .collect { println("collected $it") }
}`),
      out(`collected 1
before catch, cause: broke
collected -1
after catch, cause: null`),
      '## retry and retryWhen',
      '`retry(n) { cause -> … }` collects the flow again from the start when it throws, up to n times, for the exceptions the block accepts. `retryWhen` also gets the attempt number, for a back-off:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*
import java.io.IOException

fun main() = runTest {
    var calls = 0
    val flaky = flow {
        calls++
        println("t=$currentTime call $calls")
        if (calls < 3) throw IOException("timeout")
        emit("data")
    }
    val result = flaky
        .retryWhen { cause, attempt ->
            val retrying = cause is IOException && attempt < 5
            if (retrying) delay(100L * (attempt + 1))
            retrying
        }
        .first()
    println("t=$currentTime got $result")
}`),
      out(`t=0 call 1
t=100 call 2
t=300 call 3
t=300 got data`),
      'It waited 100, then 200 ms between attempts, and gave up on anything that was not an `IOException`.'
    ].join('\n\n'),
    java: [
      java(`Flux.defer(this::fetchPrices)
    .retryWhen(Retry.backoff(3, Duration.ofMillis(100)))
    .onErrorResume(e -> Flux.just(-1))        // catch { emit(-1) }
    .doFinally(signal -> log("done"))         // onCompletion
    .subscribe(this::show);`),
      'The operators match Reactor\'s: `catch` with `emit` is `onErrorResume`, `onCompletion` is `doFinally`, `retryWhen` is `retryWhen`. What Flow adds is that a plain `try` around `collect` also works, because collecting is an ordinary suspend call.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking

fun readings(): Flow<Int> = flow {
    emit(20)
    emit(21)
    throw IllegalStateException("sensor unplugged")
}

fun main() = runBlocking {
    readings()
        .onCompletion { cause -> if (cause != null) println("stream ended: \${cause.message}") }
        .catch { emit(-273) }
        .collect { println("reading $it") }
}`,
      note: 'Move `.catch { emit(-273) }` above `.onCompletion`: now `onCompletion` sees a normal end, because the error was handled before it.'
    },
    challenge: {
      title: 'A flaky price feed',
      task: 'Write `safePrices(source)`, a flow of the source\'s prices that copes with failure:\n\n1. When the source throws an `IOException`, collect it again, up to **2** more times (`retry`). Other exceptions are not retried.\n2. If it still fails (with any exception), emit `-1` instead, and end normally (`catch`).\n3. However the flow ends, add `"finished"` to `log` (`onCompletion`).',
      starter: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import java.io.IOException

val log = mutableListOf<String>()
var attempts = 0

// fails with an IOException for its first \`failures\` collections, then gives 100 and 101
fun flakyPrices(failures: Int): Flow<Int> = flow {
    attempts++
    if (attempts <= failures) throw IOException("network down (attempt $attempts)")
    emit(100)
    emit(101)
}

fun safePrices(source: Flow<Int>): Flow<Int> = TODO("retry IOExceptions twice, then -1; log \\"finished\\"")

fun main() = runBlocking {
    println(safePrices(flakyPrices(2)).toList())
    attempts = 0
    println(safePrices(flakyPrices(5)).toList())
    println(log)
}`,
      solution: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import java.io.IOException

val log = mutableListOf<String>()
var attempts = 0

// fails with an IOException for its first \`failures\` collections, then gives 100 and 101
fun flakyPrices(failures: Int): Flow<Int> = flow {
    attempts++
    if (attempts <= failures) throw IOException("network down (attempt $attempts)")
    emit(100)
    emit(101)
}

fun safePrices(source: Flow<Int>): Flow<Int> = source
    .retry(2) { it is IOException }
    .catch { emit(-1) }
    .onCompletion { log += "finished" }

fun main() = runBlocking {
    println(safePrices(flakyPrices(2)).toList())
    attempts = 0
    println(safePrices(flakyPrices(5)).toList())
    println(log)
}`,
      hints: [
        '`retry(2) { it is IOException }` collects the source again, at most twice, and only for an `IOException`.',
        'After it, `.catch { emit(-1) }` replaces whatever is still failing, and `.onCompletion { log += "finished" }` runs at every end.'
      ],
      checks: [
        { label: 'Two failures, then success: the prices, on the third attempt', code: 'attempts = 0\neq(runBlocking { safePrices(flakyPrices(2)).toList() }, listOf(100, 101))\neq(attempts, 3)' },
        { label: 'Still failing after two retries: -1', code: 'attempts = 0\neq(runBlocking { safePrices(flakyPrices(5)).toList() }, listOf(-1))\neq(attempts, 3)' },
        { label: 'Other exceptions are not retried', code: 'var tries = 0\nval broken = flow<Int> { tries++; throw IllegalStateException("bug") }\neq(runBlocking { safePrices(broken).toList() }, listOf(-1))\neq(tries, 1)' },
        { label: '"finished" is logged each time, however it ends', code: 'log.clear()\nattempts = 0\nrunBlocking { safePrices(flakyPrices(0)).toList(); safePrices(flakyPrices(9)).toList() }\neq(log, listOf("finished", "finished"))' },
        { label: 'It uses `retry`, `catch` and `onCompletion`', code: 'ok(uses("""\\.retry\\s*\\(""") && uses("""\\.catch\\s*\\{""") && uses("""\\.onCompletion\\s*\\{"""), "retry, catch and onCompletion")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 6 */
  L.push({
    id: 'kt-stateflow-sharedflow', track: 'flow', title: 'StateFlow and SharedFlow',
    summary: 'Hot flows exist apart from their collectors. A StateFlow always holds one value and skips an equal one: state. A SharedFlow broadcasts each value to every collector, with an optional replay: events. update, asStateFlow, and stateIn and shareIn.',
    keywords: ['StateFlow', 'SharedFlow', 'MutableStateFlow', 'MutableSharedFlow', 'hot flow', 'update', 'asStateFlow', 'replay', 'stateIn', 'shareIn', 'SharingStarted', 'WhileSubscribed', 'LiveData', 'events', 'state'],
    docs: 'https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-state-flow/',
    body: [
      '## Hot flows',
      'A cold flow runs for each collector. A **hot** flow exists on its own: it holds or sends values whether anyone collects or not, and every collector shares them. Two kinds, for two jobs: `StateFlow` for *state*, `SharedFlow` for *events*.',
      '## StateFlow: one current value',
      'A `MutableStateFlow` always holds exactly one value: it needs one to start with, `value` reads and sets it, a new collector gets the current value at once, and a value equal to the current one is ignored:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun main() = runTest {
    val status = MutableStateFlow("idle")
    val a = launch { status.collect { println("t=$currentTime A sees $it") } }
    delay(100)
    status.value = "loading"
    delay(100)
    status.value = "loading"
    delay(100)
    val b = launch { status.collect { println("t=$currentTime B sees $it") } }
    delay(100)
    status.value = "done"
    delay(100)
    println("now: \${status.value}")
    a.cancel()
    b.cancel()
}`),
      out(`t=0 A sees idle
t=100 A sees loading
t=300 B sees loading
t=400 A sees done
t=400 B sees done
now: done`),
      'A screen\'s state is the classic use: whoever looks sees the latest value, and only changes are sent.',
      '## update, and a read-only view',
      '`value = value + 1` reads and writes in two steps, and loses updates when two coroutines do it at once. `update { it + 1 }` does it in one step, safely. A class keeps its `MutableStateFlow` private and shows the world a read-only `StateFlow` with `asStateFlow()`:',
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

class CartViewModel {
    private val _items = MutableStateFlow(0)
    val items: StateFlow<Int> = _items.asStateFlow()

    fun add() = _items.update { it + 1 }
}

fun main() = runBlocking {
    val cart = CartViewModel()
    withContext(Dispatchers.Default) {
        repeat(1000) { launch { cart.add() } }
    }
    println("items: \${cart.items.value}")
}`),
      out('items: 1000'),
      'Outside the class, `cart.items.value = 5` does not compile: only the class changes its state.',
      '## SharedFlow: events for whoever listens',
      'A `MutableSharedFlow` holds no current value: it broadcasts each value to the collectors listening at that moment, and repeats equal values. `replay = n` keeps the last n for new collectors. That makes it the place for **one-off events**: a message to show, a navigation, a "saved".',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun main() = runTest {
    val events = MutableSharedFlow<String>()
    val early = launch { events.collect { println("t=$currentTime early got $it") } }
    delay(100)
    events.emit("saved")
    events.emit("saved")
    val late = launch { events.collect { println("t=$currentTime late got $it") } }
    delay(100)
    events.emit("deleted")
    delay(100)
    early.cancel()
    late.cancel()
}`),
      out(`t=100 early got saved
t=100 early got saved
t=200 early got deleted
t=200 late got deleted`),
      'Both "saved" events arrived (a `StateFlow` would have sent one); the late collector missed them, and got only what came after it subscribed.',
      '| | `StateFlow` | `SharedFlow` |\n|---|---|---|\n| A current value | always, `value` | none (unless it replays) |\n| Starts with | a value you give | nothing |\n| A new collector gets | the current value, at once | only new values (or the last `replay`) |\n| The same value twice | sent once | sent twice |\n| For | state: what the screen shows | events: what just happened |',
      'The classic bug is an event kept in a `StateFlow`: a screen that comes back shows the old message again, and two identical events in a row arrive once. See [[q:stateflow-vs-sharedflow]] and the explainer [[explain:flow-timeline]].',
      '## stateIn and shareIn: a cold flow made hot',
      'A cold flow from a database or a socket runs once per collector. `stateIn` (or `shareIn`) runs it once, in a scope, and shares it. `SharingStarted` says when: `Eagerly`, `Lazily` (from the first collector), or `WhileSubscribed(ms)`, which stops it that long after the last collector leaves:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun main() = runTest {
    val ticks = flow {
        println("t=$currentTime upstream starts")
        var n = 0
        try {
            while (true) {
                emit(++n)
                delay(100)
            }
        } finally {
            println("t=$currentTime upstream stops")
        }
    }
    val shared = ticks.stateIn(backgroundScope, SharingStarted.WhileSubscribed(500), 0)
    shared.take(3).collect { println("t=$currentTime got $it") }
    delay(1000)
    println("t=$currentTime last value \${shared.value}")
}`),
      out(`t=0 got 0
t=0 upstream starts
t=0 got 1
t=100 got 2
t=600 upstream stops
t=1100 last value 7`),
      'The upstream started with the first collector and stopped 500 ms after the last one left (it had sent 7 by then). `WhileSubscribed(5000)` is the usual choice for a screen: a quick rotation keeps the data flowing; leaving the screen stops it.'
    ].join('\n\n'),
    java: [
      java(`// the nearest Java: a value with listeners
AtomicReference<String> status = new AtomicReference<>("idle");
List<Consumer<String>> listeners = new CopyOnWriteArrayList<>();
void set(String s) { if (!s.equals(status.getAndSet(s))) listeners.forEach(l -> l.accept(s)); }

// Reactor: Sinks.many().replay().latest() ≈ StateFlow; Sinks.many().multicast() ≈ SharedFlow`),
      'Java has no standard observable value; Android\'s `LiveData` and Reactor\'s sinks are the usual ones. A `StateFlow` is `LiveData` that works anywhere, with operators; a `SharedFlow` is a multicast sink.'
    ].join('\n\n'),
    example: {
      code: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

class Thermostat {
    private val _target = MutableStateFlow(20)
    val target: StateFlow<Int> = _target.asStateFlow()

    fun warmer() = _target.update { it + 1 }
    fun cooler() = _target.update { it - 1 }
}

fun main() = runBlocking {
    val t = Thermostat()
    val display = launch { t.target.collect { println("display: $it °C") } }
    delay(10)
    t.warmer(); delay(10)
    t.warmer(); delay(10)
    t.cooler(); delay(10)
    display.cancel()
}`,
      note: 'Each change reaches the display. Call `t.warmer(); t.cooler()` with no `delay` between: the display may see only the final value, because a `StateFlow` is conflated: it keeps the latest, not every step.'
    },
    challenge: {
      title: 'A counter with state and events',
      task: 'Finish `Counter`:\n\n1. `count`: a read-only `StateFlow<Int>` of the current count, starting at 0, backed by a private `MutableStateFlow`.\n2. `increment()`: add 1, safely when called from many threads at once (`update`).\n3. `events`: a read-only `SharedFlow<String>` of one-off events, backed by a private `MutableSharedFlow<String>(extraBufferCapacity = 10)`.\n4. `reset()`: set the count to 0 and send the event `"reset"` (with `tryEmit`, which needs no coroutine thanks to the buffer).',
      starter: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

class Counter {
    val count: StateFlow<Int> = TODO("a read-only view of a private MutableStateFlow(0)")
    val events: SharedFlow<String> = TODO("a read-only view of a private MutableSharedFlow")

    fun increment() {
        TODO("add 1, safely")
    }

    fun reset() {
        TODO("count to 0, and the event \\"reset\\"")
    }
}

fun main() = runBlocking {
    val c = Counter()
    c.increment()
    c.increment()
    println(c.count.value)
}`,
      solution: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

class Counter {
    private val _count = MutableStateFlow(0)
    val count: StateFlow<Int> = _count.asStateFlow()

    private val _events = MutableSharedFlow<String>(extraBufferCapacity = 10)
    val events: SharedFlow<String> = _events.asSharedFlow()

    fun increment() {
        _count.update { it + 1 }
    }

    fun reset() {
        _count.value = 0
        _events.tryEmit("reset")
    }
}

fun main() = runBlocking {
    val c = Counter()
    c.increment()
    c.increment()
    println(c.count.value)
}`,
      hints: [
        '`private val _count = MutableStateFlow(0)` and `val count: StateFlow<Int> = _count.asStateFlow()`; the same pattern for events, with `asSharedFlow()`.',
        '`_count.update { it + 1 }` is the safe increment. In `reset`, `_count.value = 0` then `_events.tryEmit("reset")`.'
      ],
      checks: [
        { label: '`count` starts at 0 and counts', code: 'val c = Counter()\neq(c.count.value, 0)\nc.increment()\nc.increment()\neq(c.count.value, 2)' },
        { label: '1000 increments from many threads make 1000', code: 'val c = Counter()\nrunBlocking(Dispatchers.Default) { repeat(1000) { launch { c.increment() } } }\neq(c.count.value, 1000)' },
        { label: '`count` is read-only from outside', code: 'val c = Counter()\nok(c.count !is MutableStateFlow<*>, "expose the state with asStateFlow(), not the MutableStateFlow itself")' },
        { label: '`reset()` sets 0 and sends "reset" to a listener', code: 'val c = Counter()\nc.increment()\nrunTest {\n    val got = mutableListOf<String>()\n    val listener = launch { c.events.collect { got += it } }\n    runCurrent()\n    c.reset()\n    runCurrent()\n    eq(got, listOf("reset"))\n    listener.cancel()\n}\neq(c.count.value, 0)' },
        { label: '`increment` uses `update`', code: 'ok(uses("""\\.update\\s*\\{"""), "_count.update { it + 1 }")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 7 */
  L.push({
    id: 'kt-flow-testing', track: 'flow', title: 'Testing with runTest',
    summary: 'runTest runs a test on a fake clock: delay skips ahead, currentTime reads it, advanceTimeBy and runCurrent move it by hand. StandardTestDispatcher against UnconfinedTestDispatcher, testing a flow with toList and take, and backgroundScope for what never ends.',
    keywords: ['runTest', 'testing coroutines', 'virtual time', 'fake clock', 'currentTime', 'advanceTimeBy', 'advanceUntilIdle', 'runCurrent', 'StandardTestDispatcher', 'UnconfinedTestDispatcher', 'backgroundScope', 'Turbine', 'kotlinx-coroutines-test'],
    docs: 'https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/',
    body: [
      '## A test that waits for nothing',
      'Coroutine code is full of `delay`s, timeouts and retries; a test that really waited for them would be slow, and flaky on a busy machine. `runTest`, from `kotlinx-coroutines-test`, runs the test on a **fake clock**: a `delay` jumps the clock forward instead of waiting, and `currentTime` reads it. Every timed program in these lessons has been running this way:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.test.*

suspend fun slowGreeting(): String {
    delay(5_000)
    return "hello"
}

fun main() {
    val realStart = System.currentTimeMillis()
    runTest {
        println("\${slowGreeting()} after $currentTime ms on the fake clock")
    }
    println("real time well under a second: \${System.currentTimeMillis() - realStart < 1000}")
}`),
      out(`hello after 5000 ms on the fake clock
real time well under a second: true`),
      'In a JUnit 5 test the shape is `@Test fun greets() = runTest { assertEquals("hello", slowGreeting()) }`. The `@file:OptIn` line is for `currentTime` and friends, which the library still marks experimental.',
      '## Moving the clock by hand',
      'The code under test may start coroutines that run while the test does something else. `advanceTimeBy(ms)` runs everything due within that time; `runCurrent()` runs what is due now; `advanceUntilIdle()` runs everything. A test can stop at any moment and look:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.test.*

fun main() = runTest {
    val log = mutableListOf<String>()
    launch {
        delay(1000)
        log += "reminder sent"
    }
    advanceTimeBy(999)
    println("at 999 ms: $log")
    advanceTimeBy(2)
    println("at 1001 ms: $log")
}`),
      out(`at 999 ms: []
at 1001 ms: [reminder sent]`),
      'Without the fake clock, testing "the reminder goes out after a second, not before" would mean sleeping and hoping.',
      '## StandardTestDispatcher and UnconfinedTestDispatcher',
      '`runTest` uses a `StandardTestDispatcher`: a `launch` only queues its coroutine, which runs when the test body suspends or advances the clock. An `UnconfinedTestDispatcher` starts it at once, which some tests (of a flow being collected) find simpler:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.test.*

fun main() {
    runTest {
        var ran = false
        launch { ran = true }
        println("standard: launched, ran yet: $ran")
        runCurrent()
        println("standard: after runCurrent: $ran")
    }
    runTest(UnconfinedTestDispatcher()) {
        var ran = false
        launch { ran = true }
        println("unconfined: launched, ran yet: $ran")
    }
}`),
      out(`standard: launched, ran yet: false
standard: after runCurrent: true
unconfined: launched, ran yet: true`),
      '## Testing a flow',
      'A flow that ends: `toList()`. One that does not: `take(n).toList()`, which stops it. With `kotlin.test`\'s assertions (a JUnit 5 test reads the same):',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*
import kotlin.test.assertEquals

fun ticker(every: Long): Flow<Int> = flow {
    var n = 0
    while (true) {
        delay(every)
        emit(++n)
    }
}

fun main() = runTest {
    assertEquals(listOf(1, 2, 3), ticker(500).take(3).toList())
    assertEquals(1500L, currentTime)
    println("the ticker test passed")
}`),
      out('the ticker test passed'),
      '## backgroundScope: what never ends',
      '`runTest` waits for every coroutine its body started, and fails (*UncompletedCoroutinesError*) if one is still running. A coroutine that is meant to run forever, such as a collector of a hot flow, goes in `backgroundScope`, which `runTest` cancels when the body ends:',
      kt(OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun main() = runTest {
    val state = MutableStateFlow(0)
    val seen = mutableListOf<Int>()
    backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
        state.collect { seen += it }
    }
    state.value = 1
    state.value = 2
    println(seen)
}`),
      out('[0, 1, 2]'),
      'The collector, started at once on an unconfined dispatcher, saw every value; `runTest` then cancelled it. For bigger flow tests, the library **Turbine** (`app.cash.turbine`) adds `flow.test { awaitItem() … }`; it is not on this tool\'s class path, so it is only named here.'
    ].join('\n\n'),
    java: [
      java(`// Java: time is usually injected, and tests advance it by hand
@Test void reminderAfterOneSecond() {
    FakeClock clock = new FakeClock();
    Reminder r = new Reminder(clock, scheduler);
    clock.advance(Duration.ofMillis(999));  assertFalse(r.sent());
    clock.advance(Duration.ofMillis(2));    assertTrue(r.sent());
}
// Reactor's StepVerifier.withVirtualTime(() -> …).thenAwait(Duration.ofSeconds(1)) …`),
      'Java tests of timed code inject a clock, or use Reactor\'s `StepVerifier.withVirtualTime`. `runTest` does it for every `delay` in the coroutines it runs, without changing the code under test, as long as that code takes its scope or dispatcher from the test (one more reason to pass scopes in: [[lesson:kt-coroutine-scopes]]).'
    ].join('\n\n'),
    example: {
      code: OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.test.*
import kotlin.test.assertEquals

suspend fun fetchWithRetry(fetch: suspend () -> String): String {
    repeat(2) {
        try { return fetch() } catch (e: IllegalStateException) { delay(1000) }
    }
    return fetch()
}

fun main() = runTest {
    var calls = 0
    val result = fetchWithRetry { if (++calls < 3) throw IllegalStateException("busy") else "ok" }
    assertEquals("ok", result)
    assertEquals(2000L, currentTime)
    println("passed: $calls calls, $currentTime ms on the fake clock")
}`,
      note: 'Two seconds of back-off, tested instantly. Change `if (++calls < 3)` to `< 4`: the last `fetch()` throws, and the test fails with that exception.'
    },
    challenge: {
      title: 'Tests that catch a bad countdown',
      task: '`countdown(from)` emits `from` down to 1, one value every 1000 ms. Write `checkCountdown(countdown)`: tests that **pass** for a correct countdown and **throw** (an `AssertionError`, from `assertEquals`) for a wrong one. Inside `runTest`, check that `countdown(3)`:\n\n1. emits `[3, 2, 1]`,\n2. takes 3000 ms on the fake clock in all,\n3. emits its first value at 1000 ms, not before.\n\nThe checks run your tests against the right countdown and three wrong ones.',
      starter: OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*
import kotlin.test.assertEquals

fun countdown(from: Int): Flow<Int> = flow {
    for (n in from downTo 1) {
        delay(1000)
        emit(n)
    }
}

fun checkCountdown(countdown: (Int) -> Flow<Int>) {
    TODO("runTest { … }: the values, the total time, and when the first value comes")
}

fun main() {
    checkCountdown(::countdown)
    println("the tests pass")
}`,
      solution: OPT_IN + `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*
import kotlin.test.assertEquals

fun countdown(from: Int): Flow<Int> = flow {
    for (n in from downTo 1) {
        delay(1000)
        emit(n)
    }
}

fun checkCountdown(countdown: (Int) -> Flow<Int>) = runTest {
    assertEquals(listOf(3, 2, 1), countdown(3).toList())
    assertEquals(3000L, currentTime)
    val start = currentTime
    countdown(3).first()
    assertEquals(1000L, currentTime - start)
}

fun main() {
    checkCountdown(::countdown)
    println("the tests pass")
}`,
      hints: [
        '`fun checkCountdown(countdown: (Int) -> Flow<Int>) = runTest { … }`: inside, `assertEquals(listOf(3, 2, 1), countdown(3).toList())`, then `assertEquals(3000L, currentTime)`.',
        'For the first value: note `currentTime`, take `countdown(3).first()`, and check that 1000 ms passed.'
      ],
      checks: [
        { label: 'Your tests pass for the right countdown', code: 'checkCountdown(::countdown)' },
        { label: 'They catch wrong values (counting up)', code: 'ok(runCatching { checkCountdown { n -> flow { for (i in 1..n) { delay(1000); emit(i) } } } }.isFailure, "a countdown that counts up passed your tests")' },
        { label: 'They catch the wrong pace (2000 ms apart)', code: 'ok(runCatching { checkCountdown { n -> flow { for (i in n downTo 1) { delay(2000); emit(i) } } } }.isFailure, "a countdown 2000 ms apart passed your tests")' },
        { label: 'They catch a first value that comes too soon', code: 'ok(runCatching { checkCountdown { n -> flow { emit(n); for (i in n - 1 downTo 1) { delay(1500); emit(i) } } } }.isFailure, "a countdown whose first value came at once passed your tests")' },
        { label: 'The tests run in `runTest`', code: 'ok(uses("""\\brunTest\\b"""), "write the checks inside runTest { … }")' }
      ]
    }
  });
})(window.KLT);
