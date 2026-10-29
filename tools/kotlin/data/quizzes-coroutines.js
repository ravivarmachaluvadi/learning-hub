/*
 * data/quizzes-coroutines.js - the quiz at the end of each Coroutines lesson (batch 4).
 *
 * The question shape is described at the top of data/quizzes-basics.js. A question with `code` asks what
 * it prints: its right choice is the output, in backticks, and tests/test_content.py proves it. Each such
 * program prints one line, the same on every run.
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};
  var OPT_IN = '@file:OptIn(ExperimentalCoroutinesApi::class)\n\n';

  Q['kt-coroutines-threads'] = [
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nfun main() = runBlocking {\n    launch { print("A ") }\n    print("B ")\n    launch { print("C") }\n    print("D ")\n}',
      choices: ['`B D A C`', '`A B C D`', '`B A D C`'],
      answer: 0,
      why: '`launch` only schedules its coroutine. The main coroutine runs on until it suspends or its block ends, so B and D print first; then the two children run, in the order they were launched.' },
    { q: 'What does `delay(100)` do that `Thread.sleep(100)` does not?',
      choices: ['It pauses only this coroutine and gives the thread back, so other coroutines run meanwhile', 'It waits more precisely', 'It runs the rest of the function on another thread'],
      answer: 0,
      why: '`Thread.sleep` blocks the whole thread: every coroutine waiting for it waits too. `delay` suspends the coroutine, and is also a point where it can be cancelled.' },
    { q: '`fun main() = runBlocking { launch { println("hi") } }` compiles, but running it says there is no `main`. Why?',
      choices: ['`main` gets the type of the block\'s last line, a `launch` that gives a `Job`, so it is not a `main` the JVM can run', '`launch` cannot be used inside `runBlocking`', '`runBlocking` must be called inside `main`\'s body, never as its value'],
      answer: 0,
      why: 'An expression-bodied function takes the type of its expression, and `runBlocking` returns its block\'s value. End the block with a line that gives `Unit` (such as a `println`), or write `runBlocking<Unit> { … }`.' },
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nfun main() = runBlocking {\n    val threads = mutableSetOf<String>()\n    List(100) {\n        launch {\n            delay(10)\n            threads += Thread.currentThread().name\n        }\n    }.joinAll()\n    println(threads.size)\n}',
      choices: ['`1`', '`100`', '`8`'],
      answer: 0,
      why: '`runBlocking` runs every coroutine started in it on its own thread, `main`, unless told otherwise. The hundred waits overlap on that one thread.' }
  ];

  Q['kt-suspend'] = [
    { q: 'What does this program print?',
      code: OPT_IN + 'import kotlinx.coroutines.*\nimport kotlinx.coroutines.test.*\n\nsuspend fun step() = delay(100)\n\nfun main() = runTest {\n    step()\n    step()\n    println(currentTime)\n}',
      choices: ['`200`', '`100`', '`0`'],
      answer: 0,
      why: 'Suspend calls in a row run one after another, like any calls, so the two 100 ms steps take 200 ms on the fake clock. Running them at the same time needs `async`.' },
    { q: 'Where can a suspend function be called?',
      choices: ['Only in a coroutine, or in another suspend function', 'Anywhere, like any function', 'Only inside `runBlocking`'],
      answer: 0,
      why: 'A suspend function may pause, and only a coroutine can be paused. From ordinary code you start one first: `runBlocking` in `main` and tests, or a scope\'s `launch`.' },
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nsuspend fun compute(): Int = (1..4).sum()\n\nfun main() = runBlocking {\n    val caller = Thread.currentThread()\n    val n = compute()\n    println("$n ${Thread.currentThread() === caller}")\n}',
      choices: ['`10 true`', '`10 false`', '`4 true`'],
      answer: 0,
      why: '`suspend` moves nothing to another thread: a suspend function that only computes runs on its caller\'s thread. Dispatchers move work.' },
    { q: 'What does the compiler turn a suspend function into?',
      choices: ['A function with an extra continuation parameter, whose body is a state machine with a state for each suspend call', 'A function that runs on a new thread', 'A `CompletableFuture`'],
      answer: 0,
      why: 'The continuation keeps the label (where to carry on) and the locals needed after a pause. To pause, the function returns `COROUTINE_SUSPENDED`; to resume, it is called again with the same continuation.' }
  ];

  Q['kt-launch-async'] = [
    { q: 'What does this program print?',
      code: OPT_IN + 'import kotlinx.coroutines.*\nimport kotlinx.coroutines.test.*\n\nfun main() = runTest {\n    val a = async { delay(100); 1 }.await()\n    val b = async { delay(100); 2 }.await()\n    println("${a + b} at $currentTime")\n}',
      choices: ['`3 at 200`', '`3 at 100`', '`3 at 0`'],
      answer: 0,
      why: 'Each `async` is awaited before the next one starts, so the two run one after another: 200 ms. Start both first, then await both, and it takes 100.' },
    { q: 'What do `launch` and `async` return?',
      choices: ['`launch` a `Job`; `async` a `Deferred<T>`, a `Job` with a result you get with `await()`', 'Both return the result of their block', '`launch` returns `Unit`; `async` a `CompletableFuture`'],
      answer: 0,
      why: 'Use `launch` for side effects (you can `join` or `cancel` its `Job`), and `async` when you need the value.' },
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nfun main() = runBlocking {\n    val d = async(start = CoroutineStart.LAZY) { print("computing "); 42 }\n    print("before ")\n    println(d.await())\n}',
      choices: ['`before computing 42`', '`computing before 42`', '`before 42`'],
      answer: 0,
      why: 'A lazy `async` starts only when someone awaits it (or calls `start()`), so "computing" comes after "before".' },
    { q: 'You `map` ten items to `async { fetch(it) }` and call `awaitAll()`. One fetch fails. What happens?',
      choices: ['`awaitAll` throws that exception, and the scope cancels the other fetches', 'You get a list with a null where it failed', '`awaitAll` waits for all ten, then throws'],
      answer: 0,
      why: 'In a normal scope a failing child cancels its parent and siblings, and `awaitAll` fails as soon as one does.' }
  ];

  Q['kt-structured-concurrency'] = [
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nfun main() = runBlocking {\n    val parent = launch {\n        launch { delay(100); print("child ") }\n        print("parent ")\n    }\n    parent.join()\n    println("joined")\n}',
      choices: ['`parent child joined`', '`parent joined`', '`parent joined child`'],
      answer: 0,
      why: 'A parent job is not complete until its children are, so `join()` waits for the child too.' },
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nfun main() = runBlocking {\n    val message = try {\n        coroutineScope {\n            launch { delay(100); print("never ") }\n            launch { throw IllegalStateException("boom") }\n        }\n        "no error"\n    } catch (e: IllegalStateException) {\n        e.message\n    }\n    println(message)\n}',
      choices: ['`boom`', '`never boom`', '`no error`'],
      answer: 0,
      why: 'The failing child cancels the scope, which cancels the other child before it prints, and `coroutineScope` throws the exception to its caller.' },
    { q: 'What is wrong with `GlobalScope.launch { … }` in a request handler?',
      choices: ['The coroutine has no parent: nothing waits for it or cancels it, so it can outlive the request', 'It runs on the UI thread', 'It does not compile'],
      answer: 0,
      why: 'It compiles (with a "delicate API" warning). Launch in a scope instead: `coroutineScope { }` inside a suspend function, or the framework\'s scope.' },
    { q: 'What is the difference between `coroutineScope { }` and `runBlocking { }`?',
      choices: ['`coroutineScope` suspends while it waits for its children; `runBlocking` blocks the thread', 'They are the same', '`coroutineScope` does not wait for its children'],
      answer: 0,
      why: 'Both make a scope and wait for everything started in it. `runBlocking` is for `main` and tests; inside suspend functions use `coroutineScope`.' }
  ];

  Q['kt-cancellation'] = [
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nfun main() = runBlocking {\n    println(withTimeoutOrNull(100) { delay(500); "done" })\n}',
      choices: ['`null`', '`done`', 'It throws `TimeoutCancellationException`'],
      answer: 0,
      why: 'The block was cancelled after 100 ms, so `withTimeoutOrNull` gives null. `withTimeout` would throw instead.' },
    { q: 'Why does a `while (true) { compute() }` loop in a coroutine ignore `cancel()`?',
      choices: ['Cancellation is cooperative: it never reaches a suspension point or checks `isActive`', 'Loops cannot be cancelled in Kotlin', 'Because it runs on `Dispatchers.Default`'],
      answer: 0,
      why: 'Call `ensureActive()` (or `yield()`, or check `isActive`) in the loop, and it stops soon after it is cancelled.' },
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nfun main() = runBlocking {\n    val job = launch {\n        try {\n            delay(1000)\n            print("finished ")\n        } finally {\n            print("finally ")\n        }\n    }\n    delay(50)\n    job.cancelAndJoin()\n    println("cancelled")\n}',
      choices: ['`finally cancelled`', '`finished finally cancelled`', '`cancelled`'],
      answer: 0,
      why: '`delay` throws `CancellationException` when the job is cancelled, so "finished" is skipped, and `finally` runs.' },
    { q: 'Why is `try { suspendCall() } catch (e: Exception) { log(e) }` dangerous in a coroutine?',
      choices: ['It catches `CancellationException` too, so the coroutine carries on after it was cancelled', 'It catches nothing, because coroutines throw no exceptions', 'It makes the call run twice'],
      answer: 0,
      why: 'Catch the exceptions you mean, or rethrow `CancellationException` (and `runCatching` has the same problem).' }
  ];

  Q['kt-dispatchers'] = [
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nfun main() = runBlocking {\n    val result = withContext(Dispatchers.Default) { "computed" }\n    println("$result on ${Thread.currentThread().name}")\n}',
      choices: ['`computed on main`', '`computed on DefaultDispatcher-worker-1`', '`computed on Default`'],
      answer: 0,
      why: '`withContext` runs its block on `Default`, then returns the coroutine to where it was: `runBlocking`\'s thread, `main`.' },
    { q: 'What goes wrong when you run a JDBC query on `Dispatchers.Default`?',
      choices: ['It holds one of the few CPU threads (one per core) while it waits, so CPU work queues behind it', 'Nothing: Default and IO are the same', 'It does not compile'],
      answer: 0,
      why: 'Blocking calls belong on `Dispatchers.IO`, which has many more threads for exactly that. Wrap them in `withContext(Dispatchers.IO)` inside the function that blocks.' },
    { q: 'Does `withContext(Dispatchers.IO) { … }` start a new coroutine?',
      choices: ['No: it moves the current coroutine to that dispatcher, waits for the block, and returns its result', 'Yes, like `launch`', 'Yes, like `async`, and you must `await` it'],
      answer: 0,
      why: 'That is why it reads like a plain function call. To run work alongside, use `launch` or `async`.' },
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nfun main() = runBlocking(CoroutineName("outer")) {\n    launch { println(coroutineContext[CoroutineName]?.name) }.join()\n}',
      choices: ['`outer`', '`null`', '`coroutine`'],
      answer: 0,
      why: 'A child inherits its parent\'s context (with a new `Job`), so the name passes down unless the child sets its own.' }
  ];

  Q['kt-coroutine-exceptions'] = [
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nfun main() = runBlocking {\n    val result = supervisorScope {\n        val a = async<Int> { throw IllegalStateException("A") }\n        val b = async { 2 }\n        b.await() + (try { a.await() } catch (e: IllegalStateException) { 10 })\n    }\n    println(result)\n}',
      choices: ['`12`', '`2`', 'It throws `IllegalStateException`'],
      answer: 0,
      why: 'Under a supervisor, the failing `async` cancels nothing else; its exception comes out of `await()`, where it is caught and replaced by 10.' },
    { q: 'Why does `try { scope.launch { throw e } } catch (e: Exception) { … }` catch nothing?',
      choices: ['`launch` returns at once; the exception happens later, inside the new coroutine, where the `try` is not', 'Coroutines swallow exceptions', 'Because `catch (e: Exception)` does not catch runtime exceptions'],
      answer: 0,
      why: 'Put the `try` inside the coroutine, or use `async` and catch around `await()`. A `CoroutineExceptionHandler` can log what nobody caught.' },
    { q: 'When do you use `supervisorScope` instead of `coroutineScope`?',
      choices: ['When the children are independent, so one failing should not cancel the others', 'When the children must all succeed together', 'When the code runs on the main thread'],
      answer: 0,
      why: 'In `coroutineScope` one failure cancels the rest and fails the scope; in `supervisorScope` each child fails alone and handles its own failure.' },
    { q: 'A `CoroutineExceptionHandler` is put on a coroutine launched inside another `launch`, in a normal scope. Does it get the inner coroutine\'s exception?',
      choices: ['No: the exception goes to the parent instead, and only a handler at the root (or on a supervisor\'s child) takes effect', 'Yes, always', 'Only if the exception is a `CancellationException`'],
      answer: 0,
      why: 'In a normal scope a child hands its failure to its parent, so a handler nested deeper is never asked.' }
  ];

  Q['kt-channels'] = [
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\nimport kotlinx.coroutines.channels.*\n\nfun main() = runBlocking {\n    val c = Channel<Int>(Channel.CONFLATED)\n    c.send(1)\n    c.send(2)\n    c.send(3)\n    println(c.receive())\n}',
      choices: ['`3`', '`1`', '`[1, 2, 3]`'],
      answer: 0,
      why: 'A conflated channel keeps only the latest unread value: each `send` replaces the one before, and never waits.' },
    { q: 'Two coroutines receive from the same channel. How many of them get each value?',
      choices: ['One: each value goes to exactly one receiver', 'Both', 'Whichever subscribed first gets all of them'],
      answer: 0,
      why: 'That is what makes a channel a work queue: several workers share the values (fan-out). A `SharedFlow` is what gives every collector every value.' },
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\nimport kotlinx.coroutines.channels.*\n\nfun main() = runBlocking {\n    val c = Channel<String>(Channel.UNLIMITED)\n    c.send("a")\n    c.send("b")\n    c.close()\n    val got = mutableListOf<String>()\n    for (x in c) got += x\n    println(got)\n}',
      choices: ['`[a, b]`', '`[]`', 'It throws `ClosedReceiveChannelException`'],
      answer: 0,
      why: 'Closing stops new values, but the ones already sent are still received; then the `for` loop ends.' },
    { q: 'Which is a reason to use a `Channel` rather than a `Flow`?',
      choices: ['Work handed from coroutines to a pool of workers, each item to one of them', 'A stream of results to transform with `map` and `filter`', 'A value many observers watch'],
      answer: 0,
      why: 'A channel is a queue between coroutines. Streams to transform are flows; a value to observe is a `StateFlow`.' }
  ];

  Q['kt-shared-state'] = [
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nvar n = 0\n\nfun main() = runBlocking {\n    List(10) {\n        launch {\n            val seen = n\n            yield()\n            n = seen + 1\n        }\n    }.joinAll()\n    println(n)\n}',
      choices: ['`1`', '`10`', 'It depends on the run'],
      answer: 0,
      why: 'Each coroutine reads `n`, pauses, and only then writes. All ten read 0 before any writes, so nine updates are lost: a race, on a single thread.' },
    { q: 'Why does the compiler refuse a `delay` inside `synchronized(lock) { … }`?',
      choices: ['A coroutine may resume on another thread, which would not own the lock it must release', 'Because `delay` is too slow', '`synchronized` does not exist in Kotlin'],
      answer: 0,
      why: 'A Java monitor belongs to a thread. Around code that suspends, use a coroutine `Mutex`, which suspends instead of blocking.' },
    { q: 'A coroutine holding a `Mutex` calls a function that does `mutex.withLock { … }` on the same mutex. What happens?',
      choices: ['It waits forever: a coroutine `Mutex` is not reentrant', 'It goes straight in, as with `ReentrantLock`', 'It throws `IllegalStateException` at once'],
      answer: 0,
      why: 'Take the lock in one place, and keep the code inside it short and free of calls that take it again.' },
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\nimport java.util.concurrent.atomic.AtomicInteger\n\nfun main() = runBlocking {\n    val n = AtomicInteger()\n    withContext(Dispatchers.Default) {\n        repeat(10) { launch { repeat(100) { n.incrementAndGet() } } }\n    }\n    println(n.get())\n}',
      choices: ['`1000`', 'Less than 1000, varying from run to run', '`100`'],
      answer: 0,
      why: 'Each `incrementAndGet` is one indivisible step, so no update is lost; and `withContext` waits for all ten coroutines before returning.' }
  ];

  Q['kt-coroutine-scopes'] = [
    { q: 'Why give a component its `CoroutineScope` from outside, instead of making its own inside?',
      choices: ['The owner decides its lifetime, and a test can pass `runTest`\'s scope, whose fake clock then drives it', 'It runs faster', 'A class cannot make a scope'],
      answer: 0,
      why: 'Making its own (`CoroutineScope(SupervisorJob() + …)`) is fine too, if the component cancels it when it closes. Passing it in makes the component easy to test.' },
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\n\nfun main() = runBlocking {\n    launch { delay(100); print("child") }\n    print("main ")\n}',
      choices: ['`main child`', '`main`', '`child main`'],
      answer: 0,
      why: '`runBlocking` is a scope like any other: it does not return until its children have finished.' },
    { q: 'Why is `runBlocking` inside a coroutine a mistake?',
      choices: ['It blocks a thread the coroutines need, and on a single-thread dispatcher it can wait forever for work queued behind it', 'It does not compile there', 'It cancels the coroutine around it'],
      answer: 0,
      why: 'It is the bridge from blocking code into coroutines, for `main` and tests. Inside a coroutine, call the suspend code directly, or use `coroutineScope`.' },
    { q: 'A Java library returns a `CompletableFuture<User>`. How does Kotlin wait for it without blocking?',
      choices: ['`future.await()`, from `kotlinx.coroutines.future`', '`future.get()`', '`runBlocking { future }`'],
      answer: 0,
      why: '`await()` suspends until the future completes. The other way, `scope.future { … }` gives Java callers a `CompletableFuture`.' }
  ];
})(window.KLT);
