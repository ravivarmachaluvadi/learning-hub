/*
 * data/interview-fast-track.js - the ★★★ questions whose tracks come later (batch 2).
 *
 * Batch 2 completes the ★★★ fast track: every question asked in almost every Kotlin round exists, so
 * the fast-track flashcards are the whole list (tests/check_data.py's FAST_TRACK). The questions here
 * belong to the Types (batch 3), Idioms and interop (batch 3), Coroutines (batch 4) and Flow (batch 4)
 * tracks, and arrived early. Each keeps its own track, so the list filters by track; the batch that built
 * a track linked its lessons here (ROADMAP.md): batch 3 linked generics-variance and java-interop to theirs,
 * and batch 4 the seven Coroutines and two Flow questions to theirs, and to the explainers. Every track is
 * built now, and tests/check_data.py requires each question to link a lesson of its own track.
 *
 * The question shape is described at the top of data/interview-basics.js. Every ```kotlin block runs in
 * tests/test_content.py with kotlinx.coroutines 1.11.0, and an ```output block after one is its exact
 * output: no block prints a thread number or a timing, so each prints the same on every run.
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function norun(code) { return '```kotlin-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function java(code) { return '```java\n' + code + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];

  /* ---------------------------------------------------------------- Types */
  Q.push({
    id: 'generics-variance', track: 'types', weight: 3,
    q: 'What are in, out and star projections, compared with Java\'s wildcards?',
    keywords: ['generics', 'variance', 'in', 'out', 'covariance', 'contravariance', 'invariant', 'star projection', 'wildcard', '? extends', '? super', 'PECS'],
    short: 'Variance says whether a `Box<Cat>` can be used as a `Box<Animal>`. `out T` (covariant) means the type only gives Ts out, so a `List<Cat>` is a `List<Animal>`: Java\'s `? extends T`. `in T` (contravariant) means it only takes Ts in, so a `Comparator<Animal>` is a `Comparator<Cat>`: Java\'s `? super T`. Kotlin can say it once, on the class (declaration-site: `interface List<out E>`), instead of at every use, or at a use site, `MutableList<out Number>`. `Box<*>`, a star projection, is a box of some type you do not know: Java\'s `Box<?>`.',
    answer: [
      kt(`open class Animal(val name: String)
class Cat(name: String) : Animal(name)

interface Source<out T> {
    fun next(): T
}

interface Sink<in T> {
    fun put(item: T)
}

fun printAll(animals: List<Animal>) = println(animals.joinToString { it.name })

fun copy(from: MutableList<out Animal>, to: MutableList<in Animal>) {
    to.addAll(from)
}

fun main() {
    val cats: List<Cat> = listOf(Cat("Tom"), Cat("Kitty"))
    printAll(cats)

    val catSource: Source<Cat> = object : Source<Cat> {
        override fun next() = Cat("Felix")
    }
    val animalSource: Source<Animal> = catSource
    println(animalSource.next().name)

    val names = mutableListOf<String>()
    val animalSink: Sink<Animal> = object : Sink<Animal> {
        override fun put(item: Animal) {
            names.add(item.name)
        }
    }
    val catSink: Sink<Cat> = animalSink
    catSink.put(Cat("Garfield"))
    println(names)

    val everything = mutableListOf<Any>()
    copy(mutableListOf(Cat("Tom")), everything)
    println(everything.size)
}`),
      out(`Tom, Kitty
Felix
[Garfield]
1`),
      '**Why `MutableList` is invariant:** if a `MutableList<Cat>` could be used as a `MutableList<Animal>`, code could `add` a `Dog` to a list of cats. A read-only `List` only gives items out, so Kotlin declares it `List<out E>`, and a `List<Cat>` is a `List<Animal>` with no wildcard at all.',
      '**The rule of thumb** is Java\'s PECS, "producer extends, consumer super", with Kotlin\'s words: a producer is `out`, a consumer is `in`. A `List<*>` can be read (as `Any?`) but nothing can be added to it.',
      '| Java | Kotlin |\n|---|---|\n| `List<? extends Number>` | `List<out Number>`, or just `List<Number>` (it is declared `out`) |\n| `Comparator<? super T>` | `Comparator<in T>` |\n| `Box<?>` | `Box<*>` |\n| variance at every use | variance once, on the class, where it fits |'
    ].join('\n\n'),
    followups: [
      'Why is a `MutableList<Cat>` not a `MutableList<Animal>`?',
      'What is the difference between declaration-site and use-site variance?',
      'What can you do with a `List<*>`?'
    ],
    related: ['lesson:kt-generics', 'lesson:kt-collections', 'q:generic-constraints', 'q:read-only-collections', 'q:reified'],
    docs: 'https://kotlinlang.org/docs/generics.html'
  });

  /* ---------------------------------------------------------------- Idioms and interop */
  Q.push({
    id: 'java-interop', track: 'interop', weight: 3,
    q: 'How do Kotlin and Java call each other? What are platform types and the @Jvm annotations for?',
    keywords: ['java interop', 'interop', 'platform type', 'JvmStatic', 'JvmOverloads', 'JvmField', 'JvmName', 'Throws', 'nullability annotations', 'getter', 'setter'],
    short: 'Both compile to JVM bytecode, so they call each other directly, in one project. **Java from Kotlin:** getters and setters look like properties, and values from Java have *platform types* (`String!`): Kotlin does not know if they can be null, so it lets you use them either way, and a wrong guess throws at run time; nullability annotations (`@Nullable`, JSpecify) turn them into proper Kotlin types. **Kotlin from Java:** top-level functions live in a `FileNameKt` class (`@file:JvmName` renames it); companion members need `@JvmStatic` to be static (constants: `const` or `@JvmField`); default arguments need `@JvmOverloads`; and an exception Java should catch needs `@Throws`.',
    answer: [
      kt(`import java.time.LocalDate
import java.util.ArrayList

class Config @JvmOverloads constructor(val host: String, val port: Int = 8080) {
    companion object {
        @JvmStatic fun local() = Config("localhost")
        const val DEFAULT_PORT = 8080
    }
}

fun main() {
    val list = ArrayList<String>()
    list.add("from a Java collection")
    println(list.size)

    val date = LocalDate.of(2026, 10, 16)
    println(date.dayOfWeek)
    println(date.isLeapYear)

    val env: String? = System.getenv("SURELY_NOT_SET_42")
    println(env ?: "no such variable")

    println(Config.local().port)
}`),
      out(`1
FRIDAY
false
no such variable
8080`),
      '`date.dayOfWeek` calls Java\'s `getDayOfWeek()`, and `date.isLeapYear` its `isLeapYear()`. `System.getenv` returns a platform type; declaring the variable `String?` makes Kotlin check for null from then on.',
      'What Java code sees of `Config`:',
      java(`Config a = new Config("db");        // @JvmOverloads made this constructor
Config b = Config.local();          // @JvmStatic: a real static method
int p = Config.DEFAULT_PORT;        // const val: a static field`),
      '**Platform types are the main risk.** `val name = javaUser.getName()` has the type `String!`; using it as a `String` compiles, and throws a `NullPointerException` on that line if Java returned null. At the boundary with Java code, declare the type you expect: `val name: String? = javaUser.getName()`.'
    ].join('\n\n'),
    followups: [
      'What is a platform type, and how do you make it safe?',
      'What do `@JvmStatic`, `@JvmOverloads`, `@JvmField` and `@Throws` each do?',
      'How does Java call a top-level Kotlin function, or an extension function?'
    ],
    related: ['lesson:kt-java-from-kotlin', 'lesson:kt-kotlin-from-java', 'lesson:kt-type-aliases', 'q:npe-in-kotlin', 'q:object-companion', 'q:sam-conversions'],
    docs: 'https://kotlinlang.org/docs/java-interop.html'
  });

  /* ---------------------------------------------------------------- Coroutines */
  Q.push({
    id: 'coroutines-vs-threads', track: 'coroutines', weight: 3,
    q: 'What is a coroutine, and how is it different from a thread?',
    keywords: ['coroutine', 'coroutines', 'thread', 'virtual thread', 'lightweight', 'suspend', 'kotlinx.coroutines', 'Loom', 'concurrency'],
    short: 'A coroutine is a computation that can *suspend*: pause without blocking its thread, and resume later, possibly on another thread. Coroutines are small objects, managed by the kotlinx.coroutines library, that run on a few threads (dispatchers), so a program can have hundreds of thousands, where each platform thread is an operating-system thread with its own stack. They suspend only at `suspend` calls (cooperatively), and structured concurrency ties each one to a scope for cancellation and errors. Java 21\'s virtual threads also make waiting cheap, but have no structured cancellation built in and no `Flow`.',
    answer: [
      kt(`import kotlinx.coroutines.*
import java.util.concurrent.atomic.AtomicInteger

fun main() = runBlocking {
    val done = AtomicInteger()
    val jobs = List(100_000) {
        launch {
            delay(100)
            done.incrementAndGet()
        }
    }
    jobs.joinAll()
    println("finished \${done.get()} coroutines")
    println(Thread.currentThread().name.substringBefore(" @"))
}`),
      out(`finished 100000 coroutines
main`),
      'All 100,000 ran on one thread, `main`: `delay` suspends the coroutine instead of blocking the thread, so the thread runs the others meanwhile. 100,000 platform threads would each need an operating-system thread and a stack.',
      '| | Platform thread | Virtual thread (Java 21) | Coroutine |\n|---|---|---|---|\n| Managed by | the operating system | the JVM | the kotlinx.coroutines library |\n| A blocking call | blocks it | parks it, cheaply | blocks its thread: move it to `Dispatchers.IO` |\n| Cancellation | interrupt | interrupt | through the scope, structured |\n| Streams of values | none | none | `Flow` |',
      'Coroutines are not faster at computing: CPU-bound work runs on as many threads as there are cores either way. They make *waiting* cheap, and make concurrent code read like sequential code.'
    ].join('\n\n'),
    followups: [
      'Do coroutines run in parallel? On how many threads?',
      'Virtual threads or coroutines for a new Spring Boot service, and why?',
      'What happens when a coroutine calls `Thread.sleep()`?'
    ],
    related: ['lesson:kt-coroutines-threads', 'q:suspend-functions', 'q:structured-concurrency', 'q:dispatchers', 'q:blocking-in-coroutines'],
    docs: 'https://kotlinlang.org/docs/coroutines-basics.html'
  });

  Q.push({
    id: 'suspend-functions', track: 'coroutines', weight: 3,
    q: 'What does suspend mean, and how does a suspend function work underneath?',
    keywords: ['suspend', 'suspend function', 'continuation', 'CPS', 'continuation-passing style', 'state machine', 'COROUTINE_SUSPENDED', 'non-blocking'],
    short: '`suspend` marks a function that can pause without blocking its thread; it can be called only from another suspend function or a coroutine. The compiler rewrites it in *continuation-passing style*: it gains a hidden `Continuation` parameter, and its body becomes a state machine with a state for each suspension point, keeping its local variables in the continuation object. To suspend, it returns the marker `COROUTINE_SUSPENDED`, freeing the thread; when the awaited result arrives, the continuation\'s `resumeWith` re-enters the state machine at the next state, possibly on another thread.',
    answer: [
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
      'Roughly what the compiler makes of `loadPage` (simplified):',
      norun(`fun loadPage(id: Int, cont: Continuation<Any?>): Any? {
    val sm = cont as? LoadPageMachine ?: LoadPageMachine(id, cont)
    when (sm.label) {
        0 -> {
            sm.label = 1
            val r = fetchUser(id, sm)                  // may suspend
            if (r === COROUTINE_SUSPENDED) return r    // the thread is free
            sm.user = r as String
        }
        1 -> sm.user = sm.result as String             // resumed with fetchUser's result
    }
    // state 2 calls fetchOrders(sm.user, sm) the same way, then returns the text
}`),
      '**What follows from it:** a suspend function that does not actually suspend costs about as much as a normal call; `suspend` alone does not move work to another thread (a suspend function that only computes runs on the caller\'s thread); and blocking code inside one (`Thread.sleep`, JDBC) still blocks the thread, so it belongs in `withContext(Dispatchers.IO)`.'
    ].join('\n\n'),
    followups: [
      'How do you call a suspend function from a normal function?',
      'Does marking a function `suspend` make it run in the background?',
      'What is a `Continuation`?'
    ],
    related: ['lesson:kt-suspend', 'explain:suspend-state-machine', 'q:coroutines-vs-threads', 'q:dispatchers'],
    docs: 'https://kotlinlang.org/docs/composing-suspending-functions.html'
  });

  Q.push({
    id: 'launch-vs-async', track: 'coroutines', weight: 3,
    q: 'What is the difference between launch and async?',
    keywords: ['launch', 'async', 'await', 'Job', 'Deferred', 'concurrency', 'parallel', 'awaitAll', 'join'],
    short: 'Both start a coroutine in a scope. `launch` is fire-and-forget: it returns a `Job` (to `join` or `cancel`), and an exception in it propagates to its parent at once. `async` returns a `Deferred<T>`, a `Job` with a result, which `await()` gives; its exception also propagates to the parent in a normal scope, and is thrown again from `await()`. Use `async` for concurrent work whose results you combine (start both, then `await` both), and `launch` for side effects.',
    answer: [
      kt(`import kotlinx.coroutines.*

suspend fun price(item: String): Int {
    delay(200)
    return item.length * 10
}

fun main() = runBlocking {
    val start = System.currentTimeMillis()
    val a = async { price("apple") }
    val b = async { price("banana") }
    println("total \${a.await() + b.await()}")
    val took = System.currentTimeMillis() - start
    println(if (took < 380) "the two waits overlapped" else "the waits ran one after the other")

    val job = launch {
        delay(100)
        println("side effect done")
    }
    job.join()
    println("job completed: \${job.isCompleted}")
}`),
      out(`total 110
the two waits overlapped
side effect done
job completed: true`),
      '| | `launch` | `async` |\n|---|---|---|\n| Returns | `Job` | `Deferred<T>` |\n| Result | none | `await()` |\n| An exception | goes to the parent at once | goes to the parent, and `await()` throws it |\n| Used for | side effects | results computed concurrently |',
      '**Two common mistakes.** `async { a() }.await()` then `async { b() }.await()` runs them one after the other, with extra cost: start both, then await both. And `async` for a side effect nobody awaits: that is `launch`.'
    ].join('\n\n'),
    followups: [
      'Inside `coroutineScope`, one `async` fails: what happens to the others?',
      'What does `awaitAll` do?',
      'How would you make 10 requests concurrently, at most 3 at a time?'
    ],
    related: ['lesson:kt-launch-async', 'q:structured-concurrency', 'q:coroutine-exceptions', 'q:coroutines-vs-threads'],
    docs: 'https://kotlinlang.org/docs/composing-suspending-functions.html'
  });

  Q.push({
    id: 'structured-concurrency', track: 'coroutines', weight: 3,
    q: 'What is structured concurrency?',
    keywords: ['structured concurrency', 'CoroutineScope', 'coroutineScope', 'Job', 'parent', 'child', 'GlobalScope', 'leak', 'cancellation', 'supervisorScope'],
    short: 'Every coroutine starts in a `CoroutineScope` and becomes a child of that scope\'s `Job`, so coroutines form a tree. Three rules follow: a parent does not complete until all its children have; cancelling a parent cancels all its children; and a failing child cancels its parent and its siblings (unless a `SupervisorJob` is used). So coroutines cannot leak: when a request\'s scope ends, everything it started has finished or been cancelled. `coroutineScope { }` makes such a scope inside a suspend function; `GlobalScope` opts out, and is discouraged.',
    answer: [
      kt(`import kotlinx.coroutines.*

suspend fun loadDashboard(): String = coroutineScope {
    val profile = async { delay(100); "profile" }
    val feed = async { delay(150); "feed" }
    "\${profile.await()} + \${feed.await()}"
}

suspend fun failingDashboard(): String = coroutineScope {
    val slow = async {
        try {
            delay(1000)
            "slow"
        } finally {
            println("slow part cancelled")
        }
    }
    val broken = async<String> {
        delay(50)
        throw IllegalStateException("feed failed")
    }
    "\${slow.await()} + \${broken.await()}"
}

fun main() = runBlocking {
    println(loadDashboard())
    val result = try {
        failingDashboard()
    } catch (e: IllegalStateException) {
        "caught: \${e.message}"
    }
    println(result)
}`),
      out(`profile + feed
slow part cancelled
caught: feed failed`),
      'In `failingDashboard`, one child\'s failure cancelled its sibling (its `finally` ran) and then the whole scope, and the exception came out of `coroutineScope` as an ordinary exception for the caller to catch. Nothing was left running.',
      '**Where scopes come from:** `runBlocking` (in `main` and tests), `coroutineScope { }` inside suspend functions, the framework (Spring\'s suspend controller methods, Android\'s `viewModelScope`), and your own `CoroutineScope(SupervisorJob() + Dispatchers.Default)` for a long-lived component, cancelled when the component shuts down. Java has the same idea as a preview API in recent JDKs, `StructuredTaskScope`.'
    ].join('\n\n'),
    followups: [
      'What is wrong with `GlobalScope.launch`?',
      'What is the difference between `coroutineScope` and `supervisorScope`?',
      'Does a parent coroutine wait for the children it launched?'
    ],
    related: ['lesson:kt-structured-concurrency', 'explain:cancellation-tree', 'q:launch-vs-async', 'q:cancellation', 'q:coroutine-exceptions', 'q:coroutine-scope-lifecycle'],
    docs: 'https://kotlinlang.org/docs/coroutines-basics.html'
  });

  Q.push({
    id: 'dispatchers', track: 'coroutines', weight: 3,
    q: 'What are dispatchers, and when do you use Dispatchers.IO, Default and Main?',
    keywords: ['dispatcher', 'Dispatchers.IO', 'Dispatchers.Default', 'Dispatchers.Main', 'Unconfined', 'withContext', 'thread pool', 'blocking', 'limitedParallelism', 'main-safe'],
    short: 'A dispatcher decides which thread or threads a coroutine runs on. `Dispatchers.Default` is a pool as big as the number of CPU cores, for CPU-bound work: sorting, parsing, JSON. `Dispatchers.IO` shares those threads but lets many more run at once (64, or the number of cores if larger), for blocking I/O such as JDBC or file reads. `Dispatchers.Main` is the UI thread (Android, Swing, JavaFX). `Dispatchers.Unconfined` runs wherever it is resumed, and is rarely right. Switch with `withContext(Dispatchers.IO) { … }`, which suspends the caller and returns the block\'s result; it does not start a new coroutine.',
    answer: [
      kt(`import kotlinx.coroutines.*

fun blockingRead(): String {
    Thread.sleep(100)
    return "file contents"
}

fun main() = runBlocking {
    val text = withContext(Dispatchers.IO) { blockingRead() }
    val words = withContext(Dispatchers.Default) { text.split(" ").size }
    println("$text: $words words")

    val onIo = withContext(Dispatchers.IO) { Thread.currentThread().name.startsWith("DefaultDispatcher-worker") }
    val onDefault = withContext(Dispatchers.Default) { Thread.currentThread().name.startsWith("DefaultDispatcher-worker") }
    println("IO and Default share their worker threads: \${onIo && onDefault}")
}`),
      out(`file contents: 2 words
IO and Default share their worker threads: true`),
      '**Make suspend functions main-safe:** a function that blocks wraps its blocking part in `withContext(Dispatchers.IO)` itself, so no caller needs to know. `Dispatchers.IO.limitedParallelism(10)` makes a dispatcher that runs at most 10 at a time, to match a connection pool of 10.',
      '**Do not mix them up.** CPU work on `Dispatchers.IO` can run on far more threads than there are cores; a blocking call on `Dispatchers.Default` takes one of its few threads and starves everything else.'
    ].join('\n\n'),
    followups: [
      'What happens when you run a JDBC query on `Dispatchers.Default`?',
      'Does `withContext` start a new coroutine?',
      'What does `limitedParallelism` do?'
    ],
    related: ['lesson:kt-dispatchers', 'q:coroutines-vs-threads', 'q:suspend-functions', 'q:blocking-in-coroutines', 'q:coroutine-context'],
    docs: 'https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html'
  });

  Q.push({
    id: 'cancellation', track: 'coroutines', weight: 3,
    q: 'How does coroutine cancellation work, and why is it called cooperative?',
    keywords: ['cancellation', 'cancel', 'cooperative', 'CancellationException', 'isActive', 'ensureActive', 'yield', 'NonCancellable', 'withTimeout', 'finally', 'runCatching'],
    short: '`job.cancel()` only marks a coroutine as cancelling; the coroutine stops at its next *suspension point*, because the suspend functions of kotlinx.coroutines (`delay`, `withContext`, `await`, channel operations) check and throw `CancellationException`. Code that computes without suspending must check itself, with `ensureActive()`, `isActive` or `yield()`, or it never stops. `finally` blocks run on cancellation, and suspending inside one needs `withContext(NonCancellable)`. Never swallow `CancellationException`: a `catch (e: Exception)` or a `runCatching` around suspend calls does, and the coroutine keeps going.',
    answer: [
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    val start = System.currentTimeMillis()
    val stubborn = launch(Dispatchers.Default) {
        var spins = 0L
        while (System.currentTimeMillis() - start < 500) {
            spins++
        }
        println("stubborn loop ran to its end, ignoring cancel")
    }
    val polite = launch(Dispatchers.Default) {
        try {
            while (true) {
                ensureActive()
            }
        } finally {
            println("polite loop stopped at its check")
        }
    }
    delay(100)
    polite.cancelAndJoin()
    stubborn.cancelAndJoin()
    println("both done")
}`),
      out(`polite loop stopped at its check
stubborn loop ran to its end, ignoring cancel
both done`),
      'Both were cancelled after 100 ms. The polite loop stopped at its next `ensureActive()`; the stubborn one never checked, so it ran on for another 400 ms.',
      '**The swallowing trap:**',
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
      'The loop went on after it was cancelled, because `runCatching` caught each `CancellationException`. Catch the exceptions you mean, rethrow `CancellationException`, or call `ensureActive()` after catching. Timeouts are cancellation too: `withTimeout(1000) { … }` throws `TimeoutCancellationException`, and `withTimeoutOrNull` gives null.'
    ].join('\n\n'),
    followups: [
      'Why does a loop that never suspends ignore `cancel()`?',
      'How do you run suspending clean-up in the `finally` block of a cancelled coroutine?',
      'Why is `catch (e: Exception)` around a suspend call dangerous?'
    ],
    related: ['lesson:kt-cancellation', 'q:structured-concurrency', 'q:coroutine-exceptions', 'q:timeouts', 'q:checked-exceptions'],
    docs: 'https://kotlinlang.org/docs/coroutines-cancellation.html'
  });

  Q.push({
    id: 'coroutine-exceptions', track: 'coroutines', weight: 3,
    q: 'How are exceptions handled in coroutines? What are SupervisorJob and CoroutineExceptionHandler for?',
    keywords: ['exception', 'coroutine exception', 'SupervisorJob', 'supervisorScope', 'CoroutineExceptionHandler', 'coroutineScope', 'propagation', 'await', 'try catch'],
    short: 'In a normal scope, an exception a child does not catch cancels its parent and all its siblings, and goes up the tree: from `coroutineScope` it is thrown to the caller; at the root of a `launch` tree it reaches the `CoroutineExceptionHandler` (or the thread\'s uncaught-exception handler). `async` also throws it from `await()`. A `SupervisorJob` or `supervisorScope` stops the spread: a failing child cancels neither its siblings nor its parent, and handles its own error. A `try`/`catch` around `launch { }` does not catch what is thrown inside it: put the `try` inside, or use a handler. `CancellationException` is not a failure, and does not spread.',
    answer: [
      kt(`import kotlinx.coroutines.*

fun main() = runBlocking {
    val handler = CoroutineExceptionHandler { _, e -> println("handler got: \${e.message}") }

    val supervised = CoroutineScope(SupervisorJob() + handler)
    val a = supervised.launch {
        delay(50)
        throw IllegalStateException("A failed")
    }
    val b = supervised.launch {
        delay(150)
        println("B finished, unaffected by A")
    }
    joinAll(a, b)

    try {
        coroutineScope {
            launch {
                delay(50)
                throw IllegalArgumentException("child failed")
            }
            launch {
                delay(150)
                println("never printed: the sibling was cancelled")
            }
        }
    } catch (e: IllegalArgumentException) {
        println("caught from coroutineScope: \${e.message}")
    }
    supervised.cancel()
}`),
      out(`handler got: A failed
B finished, unaffected by A
caught from coroutineScope: child failed`),
      '| Where it is thrown | What happens |\n|---|---|\n| in a `launch`, normal scope | cancels the parent and the siblings, then goes up the tree |\n| in an `async`, normal scope | the same, and `await()` throws it |\n| inside `coroutineScope { }` | thrown from `coroutineScope` to the caller, after the other children are cancelled |\n| in a child of a `SupervisorJob` or `supervisorScope` | only that child fails; its `CoroutineExceptionHandler` gets it |\n| a `CancellationException` | not a failure: parents and handlers ignore it |',
      'A `CoroutineExceptionHandler` takes effect on a root coroutine, or a direct child of a supervisor; on a coroutine nested deeper, it is ignored, because the exception goes to the parent instead.'
    ].join('\n\n'),
    followups: [
      'Why does `try { launch { throw … } } catch …` not catch anything?',
      'When do you use `supervisorScope` instead of `coroutineScope`?',
      'Where does a `CoroutineExceptionHandler` take effect, and where is it ignored?'
    ],
    related: ['lesson:kt-coroutine-exceptions', 'explain:cancellation-tree', 'q:structured-concurrency', 'q:launch-vs-async', 'q:cancellation'],
    docs: 'https://kotlinlang.org/docs/exception-handling.html'
  });

  /* ---------------------------------------------------------------- Flow */
  Q.push({
    id: 'flow-cold-hot', track: 'flow', weight: 3,
    q: 'What is a Flow, and what is the difference between a cold and a hot flow?',
    keywords: ['flow', 'Flow', 'cold flow', 'hot flow', 'SharedFlow', 'StateFlow', 'collect', 'emit', 'backpressure', 'reactive', 'Flux', 'shareIn'],
    short: 'A `Flow<T>` is an asynchronous stream of values built on suspend functions: made with `flow { emit(x) }`, changed with operators (`map`, `filter`, `debounce`), and consumed with a terminal operator (`collect`, `first`, `toList`). A plain flow is *cold*: its block runs again for each collector, only while it is collected, and stops when the collector stops. A *hot* flow (`SharedFlow`, `StateFlow`) exists apart from its collectors: it produces values whether anyone listens or not, and all collectors share them. Cold for "fetch this data" (each caller gets its own run); hot for state and events that many observers share.',
    answer: [
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun numbers(): Flow<Int> = flow {
    println("flow started")
    for (i in 1..3) {
        delay(10)
        emit(i)
    }
}

fun main() = runBlocking {
    val cold = numbers().map { it * 10 }
    println("nothing has run yet")
    println(cold.toList())
    println(cold.first())

    val hot = MutableSharedFlow<String>()
    val listener = launch {
        hot.collect { println("listener got $it") }
    }
    delay(10)
    hot.emit("event 1")
    hot.emit("event 2")
    delay(10)
    listener.cancel()
}`),
      out(`nothing has run yet
flow started
[10, 20, 30]
flow started
10
listener got event 1
listener got event 2`),
      '`cold.first()` started the flow again ("flow started" a second time), and stopped it after one value: once `first` had its answer, the flow\'s loop was cancelled.',
      '| | Cold `Flow` | Hot `SharedFlow`, `StateFlow` |\n|---|---|---|\n| Runs | once per collector, while collected | apart from any collector |\n| Collectors | each gets its own run | share one stream |\n| With no collector | does nothing | keeps its state, or drops events |\n| Made with | `flow { }`, `flowOf`, `asFlow()` | `MutableSharedFlow`, `MutableStateFlow`, `shareIn`, `stateIn` |',
      'A cold flow is like a Reactor `Flux` before anyone subscribes. Flow is simpler, because backpressure is just suspension: a slow collector makes `emit` wait.'
    ].join('\n\n'),
    followups: [
      'How do you turn a cold flow into a hot one?',
      'How does Flow handle backpressure?',
      'Flow or Sequence: what is the difference?'
    ],
    related: ['lesson:kt-flow-basics', 'lesson:kt-stateflow-sharedflow', 'explain:flow-timeline', 'q:stateflow-vs-sharedflow', 'q:flow-vs-sequence', 'q:sequences'],
    docs: 'https://kotlinlang.org/docs/coroutines-flow.html'
  });

  Q.push({
    id: 'stateflow-vs-sharedflow', track: 'flow', weight: 3,
    q: 'What is the difference between StateFlow and SharedFlow?',
    keywords: ['StateFlow', 'SharedFlow', 'MutableStateFlow', 'MutableSharedFlow', 'state', 'event', 'replay', 'conflation', 'distinctUntilChanged', 'stateIn', 'shareIn', 'LiveData'],
    short: 'Both are hot flows shared by all their collectors. A `StateFlow` always holds exactly one current value: it needs an initial value, `value` reads it at any time, a new collector gets the current value at once, and setting a value equal to the current one emits nothing (it is conflated and distinct). It models *state*: a screen\'s UI state, a connection status. A `SharedFlow` holds no current value by default; it broadcasts *events* to whoever is collecting, with a configurable `replay` and buffer, and emits equal values again. A `StateFlow` behaves like a `SharedFlow` with a replay of 1, conflation and `distinctUntilChanged`.',
    answer: [
      kt(`import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun main() = runBlocking {
    val state = MutableStateFlow("idle")
    val events = MutableSharedFlow<String>()

    val stateWatcher = launch { state.collect { println("state: $it") } }
    val eventWatcher = launch { events.collect { println("event: $it") } }
    delay(10)

    state.value = "loading"
    delay(10)
    state.value = "loading"
    delay(10)
    state.value = "done"
    delay(10)

    events.emit("clicked")
    events.emit("clicked")
    delay(10)

    println("current state: \${state.value}")
    stateWatcher.cancel()
    eventWatcher.cancel()
}`),
      out(`state: idle
state: loading
state: done
event: clicked
event: clicked
current state: done`),
      'The second `"loading"` printed nothing: a `StateFlow` ignores a value equal to the one it holds. Both `"clicked"` events arrived: a `SharedFlow` passes on every emission.',
      '| | `StateFlow` | `SharedFlow` |\n|---|---|---|\n| A current value | always one, `value` | none (unless it replays) |\n| Initial value | required | none |\n| A new collector gets | the current value at once | only new values (or the replay) |\n| The same value again | ignored | emitted again |\n| Used for | state | one-off events |',
      '**A classic bug** is a one-off event (show a message, navigate) kept in a `StateFlow`: a new collector receives the last event again, and two identical events in a row arrive once. Events belong in a `SharedFlow`, or a `Channel`. `stateIn` and `shareIn` turn a cold flow into either, with a `SharingStarted` policy such as `WhileSubscribed(5000)`.'
    ].join('\n\n'),
    followups: [
      'Why does a `StateFlow` skip a value equal to its current one?',
      'How do you expose a `MutableStateFlow` as read-only?',
      'What does `SharingStarted.WhileSubscribed(5000)` do?'
    ],
    related: ['lesson:kt-stateflow-sharedflow', 'explain:flow-timeline', 'q:flow-cold-hot', 'q:statein-sharein'],
    docs: 'https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-state-flow/'
  });
})(window.KLT);
