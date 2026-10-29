/*
 * data/explainers.js - the explainers (#/explain, js/views/explainers.js): an idea that is hard to see in
 * code, taken apart one step at a time with a picture, then run for real (batch 4). The React Learning
 * Tool's explainers, adapted to Kotlin; tests/check_data.py's PLANNED_EXPLAINERS lists them.
 *
 * Explainer shape: {id, track, picture: 'machine' | 'tree' | 'timeline' | 'stack', title, summary,
 *   keywords, intro (Markdown), outro (Markdown), related: ['lesson:<id>', 'q:<id>', 'term:<id>'],
 *   examples: [{id, label, desc (Markdown), code (a whole program), steps}]}
 * Each step is [line, [operations], what happens (Markdown)]; line is the code line to highlight, from 1
 * (0 = none). The operations change the picture, in order. Every picture has:
 *   log T          the program prints T (a line)
 * machine (a suspend function's state machine):
 *   label N        the continuation object's label is N
 *   save NAME=V    the continuation object keeps V in its field NAME (L$0…)
 *   stack A > B    the thread is running A, which called B (outermost first); `stack` alone: none
 *   phase P        running, suspended (the thread is free) or done
 * tree (jobs and their parents):
 *   node ID PARENT LABEL   a coroutine starts, a child of PARENT (- for none)
 *   state ID S             its job is now active, completing, cancelling, cancelled, failed or done
 * timeline (fake milliseconds, a column per lane):
 *   lane ID LABEL  a column     at T   the clock moves to T ms     mark LANE TEXT   something happens there now
 * stack (the call stack when a lambda runs):
 *   stack A > B    as above     lambda yes|no   whether a lambda object exists
 *
 * What is proved: tests/check_data.py, that every step's line is in its program and every operation is
 * known and consistent (a job's state names a job started, a mark a lane made, the clock never goes
 * back); tests/test_content.py, that each program prints exactly the lines its steps log, in order;
 * tests/test_ui.py ("explain"), that stepping to the end leaves the page's picture where the operations
 * say. The pictures' other parts (a stack, a label) are the explanation, and the logs the programs print
 * are where they show: the labels, the fields, the call stacks, the order of `finally` blocks and the
 * times on the fake clock are all printed by the real run.
 */
(function (U) {
  'use strict';
  var X = U.data.explainers = U.data.explainers || [];

  X.push({
    id: "suspend-state-machine", track: "coroutines", picture: "machine", title: "suspend as a state machine",
    summary: "What the compiler makes of a suspend function: a numbered label for each suspend call, an object that keeps what the function needs, and a return that frees the thread. Watched from inside a real run.",
    keywords: ["suspend", "state machine", "continuation", "label", "COROUTINE_SUSPENDED", "CPS", "continuation-passing style", "resume", "invokeSuspend"],
    intro: "A `suspend` function can pause without blocking its thread. The compiler makes that possible by rewriting it: it gets a hidden last parameter, a **continuation** object, and its body becomes a **state machine**. Before each suspend call it stores a `label` saying where to carry on, and any value it still needs afterwards goes into the object too, because the function's stack frame will be gone. To pause, a function returns the marker `COROUTINE_SUSPENDED` instead of a result, and every caller up the stack returns it too, so the thread is free. To resume, the continuation calls the function again with the same object, and the label sends it straight to the right place.\n\nThese programs show it happening, with no coroutine library. `fetch` pauses by hand: it keeps its caller's continuation in `waiting` and returns `COROUTINE_SUSPENDED`. `main` then plays the part a dispatcher plays, calling `resume` later. `fields` reads the continuation object's `label` and the objects it keeps (`L$0`…) by reflection. Those field names are what kotlinc 2.4.20 generates: internals, not a promised format. The object has a few more fields (`result`, and `I$0` for numbers it keeps), which these programs leave out.",
    outro: "**What follows from it.** A suspend function that does not actually pause costs about what a normal call costs: one check of the value it got back. `suspend` alone moves nothing to another thread. And code that *blocks* inside a suspend function (`Thread.sleep`, a JDBC call) still blocks the thread, because the state machine can only free the thread when a function returns `COROUTINE_SUSPENDED`. With kotlinx.coroutines, `delay` and `await` pause exactly like `fetch` here, and a dispatcher resumes them on a thread of its choosing.",
    related: ["lesson:kt-suspend", "q:suspend-functions", "term:continuation", "term:suspend-function"],
    examples: [
      {
        id: "one-pause", label: "One pause",
        desc: "`loadUser` makes one suspend call, which pauses. Watch the label, the thread, and who carries on.",
        code: `import kotlin.coroutines.*
import kotlin.coroutines.intrinsics.*

var waiting: Continuation<String>? = null

// the continuation object's label, and the objects it keeps (L$0, L$1…)
fun fields(cont: Any): String = cont.javaClass.declaredFields
    .filter { it.name == "label" || it.name.startsWith("L$") }
    .sortedBy { it.name }
    .joinToString(", ") { f -> f.isAccessible = true; "\${f.name}=\${f.get(cont)}" }

// pauses for real: keeps its caller's continuation, and returns COROUTINE_SUSPENDED
suspend fun fetch(what: String): String = suspendCoroutineUninterceptedOrReturn { cont ->
    println("fetch($what) pauses: \${fields(cont)}")
    waiting = cont
    COROUTINE_SUSPENDED
}

suspend fun loadUser(id: Int): String {
    println("loadUser starts")
    val name = fetch("user $id")
    println("loadUser goes on with $name")
    return name.uppercase()
}

fun main() {
    val whenDone = Continuation<String>(EmptyCoroutineContext) { println("result: \${it.getOrThrow()}") }
    suspend { loadUser(7) }.startCoroutine(whenDone)
    println("main: loadUser returned, so the thread is free")
    waiting!!.resume("asha")
    println("main: end")
}`,
        steps: [
          [28, ["stack main > startCoroutine > loadUser", "phase running"], "`main` starts a coroutine that runs `loadUser(7)`. `startCoroutine` calls it at once, on this thread: a coroutine is not a thread of its own."],
          [20, ["log loadUser starts"], "`loadUser` runs like any function until its first suspend call."],
          [21, ["label 1", "stack main > startCoroutine > loadUser > fetch"], "Before calling `fetch`, the state machine sets `label = 1`: \"when I am resumed, carry on after the first suspend call\". The label lives in `loadUser`'s continuation object, which `fetch` receives as its hidden last parameter."],
          [14, ["log fetch(user 7) pauses: label=1"], "`fetch` gets that object as `cont` and reads it: `label=1`. There is no `L$0`: `loadUser` holds no object that it needs after the pause."],
          [16, ["phase suspended", "stack main"], "`fetch` keeps the continuation in `waiting` and returns `COROUTINE_SUSPENDED`. `loadUser` sees the marker and returns it too, at once, and so does `startCoroutine`. The stack unwinds back to `main`: the coroutine now exists only as that object."],
          [29, ["log main: loadUser returned, so the thread is free"], "`main` carries on. In a real program, this is where the thread runs other coroutines."],
          [30, ["stack main > resumeWith > invokeSuspend > loadUser", "phase running"], "`resume(\"asha\")` calls the continuation's `resumeWith`, whose `invokeSuspend` calls `loadUser` again with the same object. `label` is 1, so it jumps straight past the `fetch` call, with `\"asha\"` as its result."],
          [22, ["log loadUser goes on with asha"], "From here `loadUser` runs on as if `fetch` had simply returned `\"asha\"`."],
          [23, ["phase done", "stack main > resumeWith", "log result: ASHA"], "`loadUser` returns its result, so its continuation is done and hands the result on: to `whenDone`, the continuation `main` gave `startCoroutine`."],
          [31, ["stack main", "log main: end"], "`resume` returns, and `main` ends."]
        ]
      },
      {
        id: "two-pauses", label: "Two pauses, one value kept",
        desc: "`loadPage` pauses twice, and needs `user` after the second pause. Where does `user` live meanwhile?",
        code: `import kotlin.coroutines.*
import kotlin.coroutines.intrinsics.*

var waiting: Continuation<String>? = null

// the continuation object's label, and the objects it keeps (L$0, L$1…)
fun fields(cont: Any): String = cont.javaClass.declaredFields
    .filter { it.name == "label" || it.name.startsWith("L$") }
    .sortedBy { it.name }
    .joinToString(", ") { f -> f.isAccessible = true; "\${f.name}=\${f.get(cont)}" }

// pauses for real: keeps its caller's continuation, and returns COROUTINE_SUSPENDED
suspend fun fetch(what: String): String = suspendCoroutineUninterceptedOrReturn { cont ->
    println("fetch($what) pauses: \${fields(cont)}")
    waiting = cont
    COROUTINE_SUSPENDED
}

suspend fun loadPage(id: Int): String {
    val user = fetch("user $id")
    val orders = fetch("orders of $user")
    return "$user has $orders"
}

fun main() {
    val whenDone = Continuation<String>(EmptyCoroutineContext) { println("result: \${it.getOrThrow()}") }
    suspend { loadPage(7) }.startCoroutine(whenDone)
    println("main: the thread is free")
    waiting!!.resume("asha")
    println("main: free again")
    waiting!!.resume("2 orders")
    println("main: end")
}`,
        steps: [
          [27, ["stack main > startCoroutine > loadPage", "phase running"], "`main` starts the coroutine, and `loadPage` runs on this thread."],
          [20, ["label 1", "save L$0=null", "stack main > startCoroutine > loadPage > fetch"], "Before the first suspend call, `label = 1`. This function's object also has a field `L$0` for an object it must keep across a pause; nothing is in it yet."],
          [14, ["log fetch(user 7) pauses: L$0=null, label=1"], "`fetch` reads the object: `label=1`, and `L$0` empty."],
          [16, ["phase suspended", "stack main"], "`fetch` returns `COROUTINE_SUSPENDED`, so does `loadPage`, and the stack unwinds to `main`."],
          [28, ["log main: the thread is free"], "The thread is free."],
          [29, ["stack main > resumeWith > invokeSuspend > loadPage", "phase running"], "Resumed with `\"asha\"`: `loadPage` is called again with its object, and `label = 1` sends it past the first call. `user` is `\"asha\"`."],
          [21, ["label 2", "save L$0=asha", "stack main > resumeWith > invokeSuspend > loadPage > fetch"], "Before the second suspend call, `label = 2`. And `user` is needed after it, in the `return`, so the function stores it in its object: `L$0 = asha`. A local variable cannot survive the pause, because the stack frame that holds it is about to go."],
          [14, ["log fetch(orders of asha) pauses: L$0=asha, label=2"], "`fetch` sees both: `label=2`, and `user` kept in `L$0`."],
          [16, ["phase suspended", "stack main"], "It pauses again, and the stack unwinds to `main` again."],
          [30, ["log main: free again"], "Free again."],
          [31, ["stack main > resumeWith > invokeSuspend > loadPage", "phase running"], "`label = 2` sends `loadPage` past the second call. It takes `user` back out of `L$0`, and `orders` is `\"2 orders\"`."],
          [22, ["phase done", "stack main > resumeWith", "log result: asha has 2 orders"], "It returns, and `whenDone` gets the result."],
          [32, ["stack main", "log main: end"], "Two pauses, one object, two labels: that is the whole state machine."]
        ]
      },
      {
        id: "no-pause", label: "A suspend call that does not pause",
        desc: "This `fetch` has its answer in a cache, so it returns it at once. What does the state machine do then?",
        code: `import kotlin.coroutines.*
import kotlin.coroutines.intrinsics.*

val cache = mapOf("user 7" to "asha")

fun fields(cont: Any): String = cont.javaClass.declaredFields
    .filter { it.name == "label" || it.name.startsWith("L$") }
    .sortedBy { it.name }
    .joinToString(", ") { f -> f.isAccessible = true; "\${f.name}=\${f.get(cont)}" }

// does not pause: it has the answer, so it returns it, not COROUTINE_SUSPENDED
suspend fun fetch(what: String): String = suspendCoroutineUninterceptedOrReturn { cont ->
    println("fetch($what) answers at once: \${fields(cont)}")
    cache.getValue(what)
}

suspend fun loadUser(id: Int): String {
    println("loadUser starts")
    val name = fetch("user $id")
    println("loadUser goes on with $name")
    return name.uppercase()
}

fun main() {
    val whenDone = Continuation<String>(EmptyCoroutineContext) { println("result: \${it.getOrThrow()}") }
    suspend { loadUser(7) }.startCoroutine(whenDone)
    println("main: end")
}`,
        steps: [
          [26, ["stack main > startCoroutine > loadUser", "phase running"], "`main` starts the coroutine, as before."],
          [18, ["log loadUser starts"], "`loadUser` starts."],
          [19, ["label 1", "stack main > startCoroutine > loadUser > fetch"], "The label is set before the call, as before: the state machine cannot know yet whether `fetch` will pause."],
          [13, ["log fetch(user 7) answers at once: label=1"], "`fetch` sees `label=1`."],
          [14, ["stack main > startCoroutine > loadUser"], "This time `fetch` returns a real value, `\"asha\"`, not the marker. `loadUser` checks what it got back, sees a value, and simply carries on: no unwinding, no resume."],
          [20, ["log loadUser goes on with asha"], "It carries on in the same call."],
          [21, ["phase done", "stack main > startCoroutine", "log result: ASHA"], "It finishes inside the same `startCoroutine` call, so `result` prints before `main` goes on. A suspend call that does not pause costs a normal call and one check."],
          [27, ["stack main", "log main: end"], "The end."]
        ]
      }
    ]
  });

  X.push({
    id: "cancellation-tree", track: "coroutines", picture: "tree", title: "The cancellation tree",
    summary: "Structured concurrency as a picture: every coroutine is a child of the one that started it, a parent waits for its children, cancelling a parent cancels everything under it, and a failing child takes its scope down, unless a supervisor stops it.",
    keywords: ["structured concurrency", "cancellation", "cancel", "job", "parent", "child", "tree", "coroutineScope", "supervisorScope", "SupervisorJob", "failure", "propagation"],
    intro: "Each coroutine has a `Job`, and each job has a parent: the job of the coroutine or scope it was started in. So the coroutines of a program form a tree, and three rules follow from it. **A parent is not done until its children are.** **Cancelling a job cancels all of its children**, and theirs. **A child that fails cancels its parent**, which cancels the other children, unless the parent is a supervisor.\n\nEach program prints from its coroutines' `finally` blocks, so you can see the order in which they stop; it is the same on every run, because `runBlocking` runs every coroutine here on one thread, one at a time. The states drawn are a job's: *active*, *waiting for its children* (completing), *cancelling*, *cancelled*, *failed* and *done*.",
    outro: "This is why coroutines cannot leak: whatever a scope started has finished, or been cancelled, by the time the scope ends. `GlobalScope` is the exception, since its coroutines have no parent, and that is why it is discouraged.",
    related: ["lesson:kt-structured-concurrency", "lesson:kt-coroutine-exceptions", "q:structured-concurrency", "q:coroutine-exceptions", "term:structured-concurrency"],
    examples: [
      {
        id: "cancel-parent", label: "Cancelling the parent",
        desc: "A parent with two children, one of which has a child of its own. Every one of them waits forever. Then `main` cancels the parent.",
        code: `import kotlinx.coroutines.*

fun main() = runBlocking {
    val parent = launch {
        launch {
            try { awaitCancellation() } finally { println("child A: cancelled") }
        }
        launch {
            launch {
                try { awaitCancellation() } finally { println("grandchild B1: cancelled") }
            }
            try { awaitCancellation() } finally { println("child B: cancelled") }
        }
        try { awaitCancellation() } finally { println("parent: cancelled") }
    }
    delay(100)
    println("main: cancel the parent")
    parent.cancel()
    parent.join()
    println("parent.isCancelled = \${parent.isCancelled}")
}`,
        steps: [
          [3, ["node main - runBlocking (main)"], "`runBlocking` starts the first coroutine. Everything else will be its descendant."],
          [4, ["node parent main parent"], "`launch` makes a child of the coroutine it is called in: `parent`, under `main`."],
          [5, ["node A parent child A"], "Inside the parent, another `launch`: child A."],
          [8, ["node B parent child B"], "And child B…"],
          [9, ["node B1 B grandchild B1"], "…which starts a child of its own, B1. Each of them now waits in `awaitCancellation()`, which suspends until it is cancelled."],
          [16, [], "Five coroutines, all active, all suspended. None of them holds a thread while it waits."],
          [17, ["log main: cancel the parent"], "`main` is about to cancel the parent."],
          [18, ["state parent cancelling", "state A cancelling", "state B cancelling", "state B1 cancelling"], "`cancel()` cancels the parent and, through the tree, every job under it, all at once. Each coroutine stops at its next suspension point: here, `awaitCancellation()` throws `CancellationException`, and the `finally` blocks run."],
          [6, ["log child A: cancelled", "state A cancelled"], "Child A's `finally` runs, and A is cancelled."],
          [10, ["log grandchild B1: cancelled", "state B1 cancelled"], "So is B1."],
          [12, ["log child B: cancelled", "state B cancelled"], "B's own code stops too. B's job counts as cancelled only now that its child, B1, has finished."],
          [14, ["log parent: cancelled", "state parent cancelled"], "Last, the parent: cancelled once its own code and every child have finished."],
          [19, [], "`join()` waits until the parent is completely finished, children and all."],
          [20, ["log parent.isCancelled = true", "state main done"], "Nothing is left running. `main`'s coroutine is done."]
        ]
      },
      {
        id: "child-fails", label: "A child fails in coroutineScope",
        desc: "A page loads its profile and its feed at the same time. The feed fails.",
        code: `import kotlinx.coroutines.*

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
        println("feed: fails")
        throw IllegalStateException("feed is down")
    }
    "\${profile.await()} + \${feed.await()}"
}

fun main() = runBlocking {
    try {
        println(loadPage())
    } catch (e: IllegalStateException) {
        println("main caught: \${e.message}")
    }
}`,
        steps: [
          [20, ["node main - runBlocking (main)"], "`main` runs in `runBlocking`'s coroutine."],
          [3, ["node scope main coroutineScope"], "`coroutineScope` makes a scope, a job of its own, as a child of its caller. `loadPage` returns only when everything started in it has finished."],
          [4, ["node profile scope async profile"], "Two children start at once: the profile…"],
          [12, ["node feed scope async feed"], "…and the feed."],
          [17, [], "The scope's own code waits for the profile. Both children are running."],
          [14, ["log feed: fails"], "After 100 ms, the feed fails."],
          [15, ["state feed failed", "state scope cancelling"], "In a normal scope, a child's failure is its parent's failure: the scope is cancelled."],
          [6, ["state profile cancelling"], "A cancelled scope cancels its other children: the profile stops at its `delay`."],
          [9, ["log profile: cancelled", "state profile cancelled"], "Its `finally` runs."],
          [3, ["state scope failed"], "With every child finished, the scope ends as failed, and `coroutineScope` throws the feed's exception to its caller as an ordinary exception."],
          [24, ["log main caught: feed is down", "state main done"], "`main` catches it with an ordinary `try`. Nothing was left running."]
        ]
      },
      {
        id: "supervised", label: "The same under supervisorScope",
        desc: "The same page, now in `supervisorScope`, and with the feed's error handled where it is awaited.",
        code: `import kotlinx.coroutines.*

suspend fun loadPage(): String = supervisorScope {
    val profile = async {
        delay(300)
        println("profile: done")
        "profile"
    }
    val feed = async<String> {
        delay(100)
        println("feed: fails")
        throw IllegalStateException("feed is down")
    }
    val shownFeed = try { feed.await() } catch (e: IllegalStateException) { "no feed (\${e.message})" }
    "\${profile.await()} + $shownFeed"
}

fun main() = runBlocking {
    println(loadPage())
}`,
        steps: [
          [18, ["node main - runBlocking (main)"], "`main` runs in `runBlocking`'s coroutine."],
          [3, ["node scope main supervisorScope"], "`supervisorScope` makes a scope too, but a supervisor: its children fail on their own."],
          [4, ["node profile scope async profile"], "The profile starts…"],
          [9, ["node feed scope async feed"], "…and the feed."],
          [11, ["log feed: fails"], "The feed fails, as before."],
          [12, ["state feed failed"], "Under a supervisor, the failure stays with the child that failed: the scope is not cancelled, and neither is the profile."],
          [14, [], "`feed.await()` throws the feed's exception here, where the code catches it and shows \"no feed\"."],
          [6, ["log profile: done", "state profile done"], "The profile finishes normally."],
          [15, ["state scope done"], "The scope finishes with a result."],
          [19, ["log profile + no feed (feed is down)", "state main done"], "A page with a profile and no feed, instead of no page at all."]
        ]
      },
      {
        id: "parent-waits", label: "A parent waits for its children",
        desc: "The parent's own code ends at once, but its child takes 200 ms.",
        code: `import kotlinx.coroutines.*

fun main() = runBlocking {
    val parent = launch {
        launch {
            delay(200)
            println("child: done")
        }
        println("parent: its own code is done")
    }
    delay(100)
    println("main: parent.isCompleted = \${parent.isCompleted}")
    parent.join()
    println("main: parent.isCompleted = \${parent.isCompleted}")
}`,
        steps: [
          [3, ["node main - runBlocking (main)"], "`main` runs in `runBlocking`'s coroutine."],
          [4, ["node parent main parent"], "`main` launches the parent…"],
          [5, ["node child parent child"], "…which launches a child."],
          [9, ["log parent: its own code is done", "state parent completing"], "The parent's block has ended, but its job is not done: it is completing, waiting for its child."],
          [12, ["log main: parent.isCompleted = false"], "So after 100 ms, `isCompleted` is still false."],
          [7, ["log child: done", "state child done"], "At 200 ms the child finishes."],
          [13, ["state parent done"], "With its last child done, the parent completes, and `join()` returns."],
          [14, ["log main: parent.isCompleted = true", "state main done"], "Now it is complete."]
        ]
      }
    ]
  });

  X.push({
    id: "flow-timeline", track: "flow", picture: "timeline", title: "Cold and hot flows on a timeline",
    summary: "When does a flow run, and who gets which value? A cold flow, a SharedFlow, a StateFlow, buffer() and collectLatest, each drawn on a clock you can trust.",
    keywords: ["flow", "cold flow", "hot flow", "SharedFlow", "StateFlow", "buffer", "collectLatest", "backpressure", "timeline", "emit", "collect", "runTest", "virtual time"],
    intro: "A flow's behaviour is about *time*: when its code runs, which collector sees which value, and who waits for whom. So these programs print the time with every line, and the picture puts each event in its column at that time, running down the page.\n\nThey run under `runTest`, whose clock is fake: `delay(100)` moves it forward 100 ms at once, without waiting, and `currentTime` reads it. So the times are exact, on any PC, and every run prints the same. Real programs use real time, with `runBlocking` or a framework's scope; the order of events is the same. `runTest` is taught in [[lesson:kt-flow-testing]]. The first line of each program opts in to `currentTime`, which kotlinx-coroutines-test marks as experimental; without it the compiler warns.",
    outro: "**Cold** (`flow { }`): the code runs for each collector, from the start, only while it is collected. **Hot** (`SharedFlow`, `StateFlow`): one stream exists on its own, and collectors share what it sends from the moment they subscribe; a `StateFlow` always has a current value and skips one equal to it. Between a fast producer and a slow collector, `buffer()` lets the producer run ahead, and `collectLatest` drops work that a newer value makes useless.",
    related: ["lesson:kt-flow-basics", "lesson:kt-flow-buffering", "lesson:kt-stateflow-sharedflow", "q:flow-cold-hot", "q:stateflow-vs-sharedflow", "q:flow-backpressure"],
    examples: [
      {
        id: "cold", label: "A cold flow, two collectors",
        desc: "A flow that makes 1, 2 and 3, 100 ms apart. A collects at once, B 150 ms later.",
        code: `@file:OptIn(ExperimentalCoroutinesApi::class)

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun main() = runTest {
    val numbers = flow {
        println("t=$currentTime flow starts")
        for (i in 1..3) {
            delay(100)
            emit(i)
        }
    }
    launch { numbers.collect { println("t=$currentTime A got $it") } }
    delay(150)
    launch { numbers.collect { println("t=$currentTime B got $it") } }
}`,
        steps: [
          [8, ["lane a collector A", "lane b collector B", "at 0"], "`flow { }` only describes the work: nothing has run yet."],
          [15, ["mark a starts a run of its own", "log t=0 flow starts"], "A collects, and the block runs, for A."],
          [12, ["at 100", "mark a got 1", "log t=100 A got 1"], "A gets 1."],
          [17, ["at 150", "mark b starts a run of its own", "log t=150 flow starts"], "B collects 150 ms later, and the block runs again, from the start, for B. \"flow starts\" prints a second time."],
          [12, ["at 200", "mark a got 2", "log t=200 A got 2"], "A gets 2."],
          [12, ["at 250", "mark b got 1", "log t=250 B got 1"], "B gets 1, not 2: its run is its own, 100 ms after it started."],
          [12, ["at 300", "mark a got 3", "log t=300 A got 3"], "A gets 3, and its run ends."],
          [12, ["at 350", "mark b got 2", "log t=350 B got 2"], "B gets 2…"],
          [12, ["at 450", "mark b got 3", "log t=450 B got 3"], "…and 3. Each collector got every value, on its own run: that is cold."]
        ]
      },
      {
        id: "shared", label: "A SharedFlow and a late collector",
        desc: "A sender sends 1, 2 and 3 into a `MutableSharedFlow`, 100 ms apart. A listens from the start, B from 150 ms.",
        code: `@file:OptIn(ExperimentalCoroutinesApi::class)

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun main() = runTest {
    val events = MutableSharedFlow<Int>()
    val a = launch { events.collect { println("t=$currentTime A got $it") } }
    launch {
        for (i in 1..3) {
            delay(100)
            println("t=$currentTime send $i")
            events.emit(i)
        }
    }
    delay(150)
    val b = launch { events.collect { println("t=$currentTime B got $it") } }
    delay(200)
    a.cancel()
    b.cancel()
}`,
        steps: [
          [8, ["lane s sender", "lane a collector A", "lane b collector B", "at 0"], "A `MutableSharedFlow` is hot: it exists on its own, and collectors subscribe to it."],
          [9, ["mark a subscribes"], "A starts listening at once."],
          [13, ["at 100", "mark s sends 1", "log t=100 send 1"], "The sender sends 1…"],
          [9, ["mark a got 1", "log t=100 A got 1"], "…and A, the only subscriber, gets it."],
          [18, ["at 150", "mark b subscribes"], "B subscribes at 150 ms. Value 1 is gone: a SharedFlow with no `replay` keeps nothing for late collectors."],
          [13, ["at 200", "mark s sends 2", "log t=200 send 2"], "The sender sends 2…"],
          [9, ["mark a got 2", "log t=200 A got 2"], "…A gets it…"],
          [18, ["mark b got 2", "log t=200 B got 2"], "…and so does B: one stream, shared by everyone listening."],
          [13, ["at 300", "mark s sends 3", "log t=300 send 3"], "Then 3…"],
          [9, ["mark a got 3", "log t=300 A got 3"], "…to A…"],
          [18, ["mark b got 3", "log t=300 B got 3"], "…and to B."],
          [20, ["at 350", "mark a cancelled", "mark b cancelled"], "A hot flow never ends by itself, so its collectors are cancelled to stop them."]
        ]
      },
      {
        id: "state", label: "A StateFlow skips an equal value",
        desc: "A status that starts as \"idle\". A collects from the start, B from 300 ms.",
        code: `@file:OptIn(ExperimentalCoroutinesApi::class)

import kotlinx.coroutines.*
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
    a.cancel()
    b.cancel()
}`,
        steps: [
          [8, ["lane v value", "lane a collector A", "lane b collector B", "at 0", "mark v idle"], "A `StateFlow` always holds exactly one value. It starts as \"idle\"."],
          [9, ["mark a sees idle", "log t=0 A sees idle"], "A new collector gets the current value at once."],
          [11, ["at 100", "mark v loading"], "The value becomes \"loading\"…"],
          [9, ["mark a sees loading", "log t=100 A sees loading"], "…and A sees it."],
          [13, ["at 200", "mark v loading again: ignored"], "The same value again. A StateFlow ignores a value equal to the one it holds, so no one hears anything."],
          [15, ["at 300", "mark b sees loading", "log t=300 B sees loading"], "B starts at 300 ms and gets the current value at once: \"loading\"."],
          [17, ["at 400", "mark v done"], "The value becomes \"done\"…"],
          [9, ["mark a sees done", "log t=400 A sees done"], "…A sees it…"],
          [15, ["mark b sees done", "log t=400 B sees done"], "…and B. That is state: whoever looks sees the latest value, and only changes."]
        ]
      },
      {
        id: "no-buffer", label: "No buffer: they take turns",
        desc: "Making an order takes 100 ms; packing one takes 300 ms.",
        code: `@file:OptIn(ExperimentalCoroutinesApi::class)

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun main() = runTest {
    val orders = flow {
        for (i in 1..3) {
            delay(100)
            println("t=$currentTime made $i")
            emit(i)
        }
    }
    orders.collect {
        delay(300)
        println("t=$currentTime packed $it")
    }
    println("t=$currentTime all packed")
}`,
        steps: [
          [8, ["lane m maker (the flow)", "lane p packer (collect)", "at 0"], "The flow makes orders; `collect` packs them."],
          [11, ["at 100", "mark m made 1", "log t=100 made 1"], "Order 1 is made."],
          [12, ["mark m waits for the packer"], "`emit` hands 1 to the collector and waits until the collector has dealt with it: the maker stops."],
          [17, ["at 400", "mark p packed 1", "log t=400 packed 1"], "300 ms later, 1 is packed."],
          [11, ["at 500", "mark m made 2", "log t=500 made 2"], "Only then does the maker go on. Making 2 takes until 500 ms."],
          [17, ["at 800", "mark p packed 2", "log t=800 packed 2"], "Packed at 800…"],
          [11, ["at 900", "mark m made 3", "log t=900 made 3"], "…made at 900…"],
          [17, ["at 1200", "mark p packed 3", "log t=1200 packed 3"], "…packed at 1200."],
          [19, ["log t=1200 all packed"], "3 × (100 + 300) = 1200 ms: the two never work at the same time. A slow collector slowing the producer down is Flow's backpressure: it is just suspension."]
        ]
      },
      {
        id: "buffer", label: "buffer(): the maker runs ahead",
        desc: "The same orders, with `.buffer()` before `collect`.",
        code: `@file:OptIn(ExperimentalCoroutinesApi::class)

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun main() = runTest {
    val orders = flow {
        for (i in 1..3) {
            delay(100)
            println("t=$currentTime made $i")
            emit(i)
        }
    }
    orders.buffer().collect {
        delay(300)
        println("t=$currentTime packed $it")
    }
    println("t=$currentTime all packed")
}`,
        steps: [
          [8, ["lane m maker (the flow)", "lane p packer (collect)", "at 0"], "The same maker and packer."],
          [15, [], "`buffer()` runs the flow in a coroutine of its own, with a queue between it and the collector, so `emit` need not wait for the packer."],
          [11, ["at 100", "mark m made 1", "log t=100 made 1"], "Order 1 is made, and the packer starts on it at once."],
          [11, ["at 200", "mark m made 2", "log t=200 made 2"], "The maker goes straight on: 2 waits in the buffer…"],
          [11, ["at 300", "mark m made 3", "log t=300 made 3"], "…and so does 3. The maker is finished."],
          [17, ["at 400", "mark p packed 1", "log t=400 packed 1"], "1 is packed at 400…"],
          [17, ["at 700", "mark p packed 2", "log t=700 packed 2"], "…2 at 700, taken straight from the buffer…"],
          [17, ["at 1000", "mark p packed 3", "log t=1000 packed 3"], "…and 3 at 1000."],
          [19, ["log t=1000 all packed"], "100 + 3 × 300 = 1000 ms instead of 1200: the making overlapped the packing."]
        ]
      },
      {
        id: "latest", label: "collectLatest: only the newest matters",
        desc: "Someone types \"k\", \"ko\", \"kot\", 100 ms apart, and each search takes 150 ms.",
        code: `@file:OptIn(ExperimentalCoroutinesApi::class)

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun main() = runTest {
    val queries = flow {
        emit("k")
        delay(100)
        emit("ko")
        delay(100)
        emit("kot")
    }
    queries.collectLatest { q ->
        println("t=$currentTime search '$q' starts")
        delay(150)
        println("t=$currentTime results for '$q'")
    }
    println("t=$currentTime done")
}`,
        steps: [
          [8, ["lane q typed", "lane s search", "at 0"], "What is typed, and the search for it."],
          [9, ["mark q k"], "\"k\" is typed…"],
          [16, ["mark s search k starts", "log t=0 search 'k' starts"], "…and its search starts."],
          [11, ["at 100", "mark q ko"], "100 ms later, \"ko\" arrives, while the search for \"k\" is still going."],
          [16, ["mark s k cancelled, ko starts", "log t=100 search 'ko' starts"], "`collectLatest` cancels the block that is still running for \"k\", and starts it again for \"ko\"."],
          [13, ["at 200", "mark q kot"], "\"kot\" arrives…"],
          [16, ["mark s ko cancelled, kot starts", "log t=200 search 'kot' starts"], "…so the search for \"ko\" is cancelled too."],
          [18, ["at 350", "mark s results for kot", "log t=350 results for 'kot'"], "Nothing new arrives, so the search for \"kot\" finishes."],
          [20, ["log t=350 done"], "Only the last search ran to the end: what a search box wants. With plain `collect`, all three would have run, one after the other."]
        ]
      }
    ]
  });

  X.push({
    id: "inline-or-not", track: "functional", picture: "stack", title: "inline or not",
    summary: "What inline changes at run time: the same call with and without it, seen from the call stack. No lambda object, no extra call, and a return that leaves the outer function.",
    keywords: ["inline", "noinline", "lambda", "lambda object", "call stack", "non-local return", "stack trace", "invokedynamic", "higher-order function"],
    intro: "A function that takes a lambda normally receives it as an object, and calls it. Marked `inline`, the function is not called at all: the compiler copies its body into each place that calls it, and the lambda's body into that. The difference cannot be seen in the source, so these programs look at the one thing that shows it: the call stack.\n\n`stack()` lists the methods on the stack when it is called, innermost first, up to `main`. The names (`main$lambda$0`…) are what kotlinc 2.4.20 generates: internals, not a promised format.",
    outro: "**When to use `inline`:** for small functions that take lambdas, like the standard library's `forEach`, `map`, `let` and `use`. It saves the lambda object and a call, and lets `return` leave the function you are in. It is not worth it for big functions (each call site gets a copy) or for functions without lambda parameters (the compiler warns that the gain is insignificant). `noinline` keeps one lambda as an object when the function must store it; `crossinline` lets an inlined lambda run in another context, at the price of `return`.",
    related: ["lesson:kt-inline", "q:inline-functions", "lesson:kt-lambdas"],
    examples: [
      {
        id: "not-inline", label: "A normal function",
        desc: "`twice` is an ordinary function that calls its lambda two times.",
        code: `// the calls on the stack right now, innermost first, up to main
fun stack(): String = Thread.currentThread().stackTrace
    .map { it.methodName }
    .drop(2)
    .let { it.take(it.indexOf("main") + 1) }
    .joinToString(" < ")

fun twice(block: () -> Unit) {
    block()
    block()
}

fun main() {
    twice { println("the lambda runs in: " + stack()) }
}`,
        steps: [
          [14, ["stack main", "lambda yes"], "`main` passes a lambda to `twice`. A normal function receives it as an object it can call: a lambda object. (Since Kotlin 2.0 it is made the way Java makes its lambdas, with `invokedynamic`; one that captures nothing is made once and reused.)"],
          [8, ["stack main > twice"], "`twice` is called: a frame of its own on the stack."],
          [9, ["stack main > twice > main$lambda$0"], "`block()` calls the object, and the object runs the lambda's body: a method the compiler named `main$lambda$0`."],
          [14, ["log the lambda runs in: main$lambda$0 < twice < main"], "The stack, innermost first, says so. (The object's own `invoke` call sits between `twice` and `main$lambda$0` too: the JVM leaves the frames of the classes it makes for lambdas out of stack traces.)"],
          [10, ["log the lambda runs in: main$lambda$0 < twice < main"], "The second call goes the same way."],
          [14, ["stack main"], "Two calls to `twice`'s lambda, each through the object."]
        ]
      },
      {
        id: "inline", label: "The same, inline",
        desc: "The same program, with `inline` before `fun twice`.",
        code: `// the calls on the stack right now, innermost first, up to main
fun stack(): String = Thread.currentThread().stackTrace
    .map { it.methodName }
    .drop(2)
    .let { it.take(it.indexOf("main") + 1) }
    .joinToString(" < ")

inline fun twice(block: () -> Unit) {
    block()
    block()
}

fun main() {
    twice { println("the lambda runs in: " + stack()) }
}`,
        steps: [
          [8, ["lambda no"], "`twice` is `inline`: the compiler copies its body into every call, and the lambda's body into that. `main` compiles as if it called `println` twice itself, so no lambda object is needed."],
          [14, ["stack main"], "At run time there is no call to `twice`, and none to a lambda."],
          [14, ["log the lambda runs in: main"], "The lambda's code runs in `main`'s own frame…"],
          [14, ["log the lambda runs in: main"], "…both times."]
        ]
      },
      {
        id: "return", label: "return from inside the lambda",
        desc: "`forEach` is an inline function from the standard library. What does `return` inside its lambda return from?",
        code: `// the calls on the stack right now, innermost first, up to main
fun stack(): String = Thread.currentThread().stackTrace
    .map { it.methodName }
    .drop(2)
    .let { it.take(it.indexOf("main") + 1) }
    .joinToString(" < ")

fun firstNegative(numbers: List<Int>): Int? {
    numbers.forEach {
        println("checking $it in: " + stack())
        if (it < 0) return it
    }
    println("no negative number")
    return null
}

fun main() {
    println("found \${firstNegative(listOf(3, -2, 5))}")
}`,
        steps: [
          [18, ["stack main > firstNegative", "lambda no"], "`main` calls `firstNegative`."],
          [9, [], "`forEach` is `inline`: its loop, and the lambda, are copied into `firstNegative`."],
          [10, ["log checking 3 in: firstNegative < main"], "So the lambda's code runs in `firstNegative`'s frame. 3 is not negative."],
          [10, ["log checking -2 in: firstNegative < main"], "-2 is…"],
          [11, ["stack main"], "…and in the copied code, `return` is the `return` of `firstNegative` itself. It returns -2 and leaves the loop: a *non-local return*. With a normal function it could not: a plain `return` in its lambda does not compile, and `return@forEach` ends only one call of the lambda."],
          [18, ["log found -2"], "\"no negative number\" never printed."]
        ]
      },
      {
        id: "noinline", label: "noinline: one lambda kept as an object",
        desc: "`now` runs one lambda at once and keeps the other for later, in a list.",
        code: `// the calls on the stack right now, innermost first, up to main
fun stack(): String = Thread.currentThread().stackTrace
    .map { it.methodName }
    .drop(2)
    .let { it.take(it.indexOf("main") + 1) }
    .joinToString(" < ")

val later = mutableListOf<() -> Unit>()

inline fun now(block: () -> Unit, noinline afterwards: () -> Unit) {
    block()
    later.add(afterwards)
}

fun main() {
    now({ println("block runs in: " + stack()) }, { println("afterwards runs in: " + stack()) })
    println("kept for later: \${later.size}")
    later.forEach { it() }
}`,
        steps: [
          [16, ["stack main", "lambda no"], "`now` is `inline`, so `block` is copied into `main`: no object."],
          [11, ["log block runs in: main"], "It runs in `main`'s frame."],
          [12, ["lambda yes"], "But `afterwards` is put in a list, and a list holds objects, so it must be one. `noinline` says so: this one lambda is made into an object. Without `noinline`, `later.add(afterwards)` does not compile."],
          [17, ["log kept for later: 1"], "The object waits in the list."],
          [18, ["stack main > main$lambda$1"], "`it()` calls the object, which runs the lambda's body: `main$lambda$1`."],
          [18, ["log afterwards runs in: main$lambda$1 < main"], "`forEach` is inline, so the call comes straight from `main`."]
        ]
      }
    ]
  });
})(window.KLT);
