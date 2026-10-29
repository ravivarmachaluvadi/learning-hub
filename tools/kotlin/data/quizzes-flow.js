/*
 * data/quizzes-flow.js - the quiz at the end of each Flow lesson (batch 4).
 *
 * The question shape is described at the top of data/quizzes-basics.js. A question with `code` asks what
 * it prints: its right choice is the output, in backticks, and tests/test_content.py proves it. Each such
 * program prints one line, the same on every run.
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};
  var OPT_IN = '@file:OptIn(ExperimentalCoroutinesApi::class)\n\n';

  Q['kt-flow-basics'] = [
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\nimport kotlinx.coroutines.flow.*\n\nfun main() = runBlocking {\n    val f = flow { print("run "); emit(1) }\n    print("built ")\n    f.collect { print("got$it ") }\n    f.collect { println("got$it") }\n}',
      choices: ['`built run got1 run got1`', '`run built got1 got1`', '`built run got1 got1`'],
      answer: 0,
      why: 'Building a flow runs nothing, and each `collect` runs it again from the start: a cold flow.' },
    { q: 'What does "cold" mean for a flow?',
      choices: ['Its code runs only when collected, and again for each collector', 'It runs on a background thread', 'It keeps its last value for new collectors'],
      answer: 0,
      why: 'Like a function call: nothing happens until someone collects, and each collection is a run of its own. A hot flow exists on its own.' },
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\nimport kotlinx.coroutines.flow.*\n\nfun main() = runBlocking {\n    var made = 0\n    val f = flow { repeat(10) { made++; emit(it) } }\n    f.first()\n    println(made)\n}',
      choices: ['`1`', '`10`', '`0`'],
      answer: 0,
      why: '`first()` cancels the flow as soon as it has its value, so only one value was made.' },
    { q: 'What can a `Flow` do that a `Sequence` cannot?',
      choices: ['Suspend between values: wait for a network call, a timer, a database', 'Be lazy', 'Be transformed with `map` and `filter`'],
      answer: 0,
      why: 'Both are lazy streams with the same operators; a flow\'s code may call suspend functions, so it is collected in a coroutine.' }
  ];

  Q['kt-flow-operators'] = [
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.flow.*\nimport kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    println(flowOf(1, 2, 3, 4).filter { it % 2 == 0 }.map { it * it }.toList())\n}',
      choices: ['`[4, 16]`', '`[1, 4, 9, 16]`', '`[2, 4]`'],
      answer: 0,
      why: 'The even values, 2 and 4, then squared.' },
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.flow.*\nimport kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    println(flowOf("a", "b", "c").zip(flowOf(1, 2)) { s, n -> "$s$n" }.toList())\n}',
      choices: ['`[a1, b2]`', '`[a1, b2, c2]`', '`[a1, b2, c]`'],
      answer: 0,
      why: '`zip` pairs the values one to one and stops when the shorter flow ends.' },
    { q: 'A search box: each term starts a search that returns a flow of results. Which operator, so that a new term cancels the search still running?',
      choices: ['`flatMapLatest`', '`flatMapConcat`', '`flatMapMerge`'],
      answer: 0,
      why: '`flatMapConcat` would finish every old search first, and `flatMapMerge` would run them all at once; only the latest matters.' },
    { q: 'What is `debounce(300)` for?',
      choices: ['Letting a value through only after 300 ms with no newer value, so fast bursts collapse into their last value', 'Delaying every value by 300 ms', 'Dropping values equal to the one before'],
      answer: 0,
      why: 'Typing "k", "ko", "kot" quickly sends one search, for "kot". Dropping repeats is `distinctUntilChanged`.' }
  ];

  Q['kt-flow-context'] = [
    { q: 'Where does a cold flow\'s code run?',
      choices: ['In the coroutine that collects it, on that coroutine\'s dispatcher', 'Always on `Dispatchers.Default`', 'On a thread of its own'],
      answer: 0,
      why: 'Context preservation: the collector decides. `flowOn` is how the flow itself moves its upstream work elsewhere.' },
    { q: 'What happens when a `flow { }` calls `emit` inside `withContext(Dispatchers.IO) { … }`?',
      choices: ['It compiles, and fails when collected: "Flow invariant is violated"', 'It runs the emission on IO, as intended', 'It does not compile'],
      answer: 0,
      why: 'The value would reach the collector on a thread the collector did not choose. Use `.flowOn(Dispatchers.IO)` after the flow instead.' },
    { q: 'In `a.map { … }.flowOn(Dispatchers.IO).filter { … }.collect { … }`, what runs on `IO`?',
      choices: ['The flow `a` and the `map`: what is upstream of `flowOn`', 'Everything', 'The `filter` and the `collect`'],
      answer: 0,
      why: '`flowOn` changes the context of the operators above it only; the collector stays where it is.' },
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\nimport kotlinx.coroutines.flow.*\n\nfun main() = runBlocking {\n    val job = flowOf(1, 2).onEach { print("$it ") }.launchIn(this)\n    print("started ")\n    job.join()\n    println("joined")\n}',
      choices: ['`started 1 2 joined`', '`1 2 started joined`', '`started joined`'],
      answer: 0,
      why: '`launchIn` starts the collection in a new coroutine and returns at once, so "started" comes first.' }
  ];

  Q['kt-flow-buffering'] = [
    { q: 'How does Flow deal with a collector slower than its producer, with no operator added?',
      choices: ['`emit` suspends until the collector has dealt with the value: they take turns', 'Values pile up in a queue until memory runs out', 'Values the collector is too slow for are dropped'],
      answer: 0,
      why: 'Backpressure is just suspension. `buffer`, `conflate` and `collectLatest` are ways to stop taking turns.' },
    { q: 'What does `conflate()` keep when the collector is busy?',
      choices: ['Only the latest value', 'Every value, in a queue', 'Only the first value'],
      answer: 0,
      why: 'Values that arrive while the collector is busy replace one another; it then gets the newest.' },
    { q: 'What does this program print?',
      code: OPT_IN + 'import kotlinx.coroutines.*\nimport kotlinx.coroutines.flow.*\nimport kotlinx.coroutines.test.*\n\nfun main() = runTest {\n    flowOf(1, 2, 3).collectLatest { delay(100); print(it) }\n    println(" at $currentTime")\n}',
      choices: ['`3 at 100`', '`123 at 300`', '`1 at 100`'],
      answer: 0,
      why: 'The three values arrive at once, so each new one cancels the block still waiting for the old: only 3 is printed, after one 100 ms delay.' },
    { q: 'A progress bar gets a value every 10 ms and takes 50 ms to redraw. Which fits?',
      choices: ['`conflate()`: draw the newest value whenever it is free', '`buffer()`: draw every value, falling further behind', 'Nothing: let the producer wait'],
      answer: 0,
      why: 'Only the current progress matters. `collectLatest` would cancel each redraw before it finishes, and never draw at all while values keep coming.' }
  ];

  Q['kt-flow-errors'] = [
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.flow.*\nimport kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    flow { emit(1); throw IllegalStateException("x") }\n        .catch { emit(0) }\n        .collect { print(it) }\n    println()\n}',
      choices: ['`10`', '`1`', 'It throws `IllegalStateException`'],
      answer: 0,
      why: '1 is collected, then the flow throws, and `catch` replaces the failure with 0.' },
    { q: 'An exception is thrown inside `collect { }`. Does a `catch` operator before `collect` handle it?',
      choices: ['No: `catch` sees only what is upstream of it; a `try` around `collect` does', 'Yes', 'Only if it is an `IOException`'],
      answer: 0,
      why: 'Exception transparency: an operator never swallows exceptions from downstream.' },
    { q: 'When is `onCompletion`\'s `cause` null?',
      choices: ['When the flow ended normally (or a `catch` above it handled the failure)', 'Always', 'When the flow was cancelled'],
      answer: 0,
      why: 'It gets the exception the flow ended with as seen from where it sits; cancellation arrives as a `CancellationException`.' },
    { q: 'What does `retry(3) { it is IOException }` do?',
      choices: ['Collects the flow again from the start, up to 3 times, when it fails with an `IOException`', 'Retries each value 3 times', 'Waits 3 seconds after a failure'],
      answer: 0,
      why: 'Any other exception goes on down the chain. `retryWhen` also gives the attempt number, for a back-off with `delay`.' }
  ];

  Q['kt-stateflow-sharedflow'] = [
    { q: 'What does this program print?',
      code: 'import kotlinx.coroutines.*\nimport kotlinx.coroutines.flow.*\n\nfun main() = runBlocking {\n    val s = MutableStateFlow("a")\n    val seen = mutableListOf<String>()\n    val job = launch(Dispatchers.Unconfined) { s.collect { seen += it } }\n    s.value = "b"\n    s.value = "b"\n    s.value = "c"\n    job.cancel()\n    println(seen)\n}',
      choices: ['`[a, b, c]`', '`[a, b, b, c]`', '`[b, c]`'],
      answer: 0,
      why: 'A new collector gets the current value, "a", at once; the second "b" equals the current value, so it is not sent.' },
    { q: 'Why is a one-off event (a "saved" message) a bug when kept in a `StateFlow`?',
      choices: ['A collector that comes back gets the old event again, and two equal events in a row arrive once', 'A `StateFlow` cannot hold a `String`', 'It is slower'],
      answer: 0,
      why: 'Events belong in a `SharedFlow` (or a `Channel`); a `StateFlow` is for state, where "the latest value" is exactly what you want.' },
    { q: 'A collector subscribes to a `MutableSharedFlow<String>()` (no replay) after two values were sent. What does it get?',
      choices: ['Only the values sent after it subscribed', 'Both earlier values, then the new ones', 'The latest earlier value, then the new ones'],
      answer: 0,
      why: 'With no `replay`, a `SharedFlow` keeps nothing for late collectors. `replay = 1` would give the latest.' },
    { q: 'What does `SharingStarted.WhileSubscribed(5000)` in `stateIn` do?',
      choices: ['Runs the upstream while someone collects, and stops it 5 seconds after the last collector leaves', 'Starts the upstream after 5 seconds', 'Keeps the value for 5 seconds'],
      answer: 0,
      why: 'A short gap (a screen rotating) keeps the data flowing; leaving for good stops it, and the next collector starts it again.' }
  ];

  Q['kt-flow-testing'] = [
    { q: 'What does this program print?',
      code: OPT_IN + 'import kotlinx.coroutines.*\nimport kotlinx.coroutines.test.*\n\nfun main() = runTest {\n    delay(10_000)\n    println(currentTime)\n}',
      choices: ['`10000`', '`0`', 'It prints nothing for ten seconds, then `10000`'],
      answer: 0,
      why: 'On `runTest`\'s fake clock the `delay` jumps the clock forward at once; `currentTime` reads it.' },
    { q: 'In `runTest`, the body calls `launch { … }`. When does that coroutine run?',
      choices: ['When the body suspends or advances the clock (`runCurrent`, `advanceTimeBy`…): the default dispatcher only queues it', 'At once, before `launch` returns', 'Never, unless it is `await`ed'],
      answer: 0,
      why: 'That is the `StandardTestDispatcher`. An `UnconfinedTestDispatcher` starts it at once instead.' },
    { q: 'Why does a collector of a hot flow go in `backgroundScope` inside `runTest`?',
      choices: ['It never ends, and `runTest` cancels `backgroundScope` when the body ends instead of failing for coroutines still running', 'It runs faster there', 'Because hot flows need another thread'],
      answer: 0,
      why: 'Started in the test\'s own scope, it would make `runTest` fail with `UncompletedCoroutinesError`.' },
    { q: 'Why test coroutine code with `runTest` rather than `runBlocking`?',
      choices: ['Its fake clock skips every delay, so timed code is tested instantly, and the times are exact', 'Because `runBlocking` cannot run suspend functions', 'Because `runTest` runs on many threads'],
      answer: 0,
      why: 'A test that really waits is slow, and on a busy machine flaky; with `runTest` "after one second" is something you can assert.' }
  ];
})(window.KLT);
