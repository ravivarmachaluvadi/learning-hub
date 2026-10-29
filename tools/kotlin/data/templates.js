/*
 * data/templates.js - starting points for the Playground's "Templates…" menu.
 *
 * Template shape: {id, title, code (a whole program), stdin?}. tests/test_content.py runs each one.
 */
(function (U) {
  'use strict';
  U.data.templates = [
    { id: 'hello-input', title: 'Hello, with input', stdin: 'Ravi\n30\n', code: `fun main() {
    print("Your name: ")
    val name = readln()
    print("Your age: ")
    val age = readln().toIntOrNull() ?: 0
    println("Hello, $name! Next year you will be \${age + 1}.")
}
` },
    { id: 'data-class', title: 'A data class and a list', code: `data class Book(val title: String, val year: Int, val pages: Int)

fun main() {
    val books = listOf(
        Book("Kotlin in Action", 2017, 360),
        Book("Effective Java", 2018, 412),
        Book("Atomic Kotlin", 2021, 638)
    )
    for (b in books) println(b)
    val newest = books.maxBy { it.year }
    println("Newest: \${newest.title}")
    println("Pages in all: \${books.sumOf { it.pages }}")
    println(newest.copy(year = 2026))
}
` },
    { id: 'sealed-when', title: 'A sealed interface and when', code: `sealed interface Payment
data class Card(val last4: String) : Payment
data class Upi(val id: String) : Payment
data object Cash : Payment

fun describe(p: Payment): String = when (p) {
    is Card -> "card ending \${p.last4}"
    is Upi -> "UPI \${p.id}"
    Cash -> "cash"
}

fun main() {
    val payments = listOf(Card("4242"), Upi("ravi@bank"), Cash)
    for (p in payments) println(describe(p))
}
` },
    { id: 'state-machine', title: 'A state machine with sealed types', code: `sealed interface Door {
    data object Open : Door
    data object Closed : Door
    data class Locked(val code: Int) : Door
}

sealed interface Action {
    data object Push : Action
    data object Pull : Action
    data class Lock(val code: Int) : Action
    data class Unlock(val code: Int) : Action
}

fun next(door: Door, action: Action): Door = when (door) {
    Door.Open -> if (action == Action.Pull) Door.Closed else door
    Door.Closed -> when (action) {
        Action.Push -> Door.Open
        is Action.Lock -> Door.Locked(action.code)
        else -> door
    }
    is Door.Locked -> if (action is Action.Unlock && action.code == door.code) Door.Closed else door
}

fun main() {
    val actions = listOf(Action.Pull, Action.Lock(42), Action.Push, Action.Unlock(7), Action.Unlock(42), Action.Push)
    var door: Door = Door.Open
    for (a in actions) {
        val after = next(door, a)
        println("$door + $a -> $after")
        door = after
    }
}
` },
    { id: 'pipeline', title: 'One pipeline, eager and lazy', code: `data class Visit(val page: String, val ms: Int)

fun main() {
    val visits = List(100_000) { i -> Visit("/page/\${i % 50}", (i * 37) % 900) }

    var steps = 0
    val eager = visits
        .map { steps++; it.copy(page = it.page.uppercase()) }
        .filter { steps++; it.ms > 850 }
        .take(3)
    println("list:     \${eager.map { it.ms }} after $steps steps")

    steps = 0
    val lazy = visits.asSequence()
        .map { steps++; it.copy(page = it.page.uppercase()) }
        .filter { steps++; it.ms > 850 }
        .take(3)
        .toList()
    println("sequence: \${lazy.map { it.ms }} after $steps steps")
}
` },
    { id: 'coroutines', title: 'Coroutines: async and await', code: `import kotlinx.coroutines.*

suspend fun fetchPrice(item: String): Int {
    delay(200)                       // pretend to wait for a server
    return item.length * 10
}

fun main() = runBlocking {
    val start = System.currentTimeMillis()
    val a = async { fetchPrice("apple") }
    val b = async { fetchPrice("banana") }
    println("Total: \${a.await() + b.await()}")
    val took = System.currentTimeMillis() - start
    println(if (took < 380) "Both waits ran at the same time" else "The waits ran one after the other")
}
` },
    { id: 'html-dsl', title: 'A small HTML DSL (lambdas with receivers)', code: `@DslMarker
annotation class HtmlDsl

@HtmlDsl
class Element(private val name: String) {
    private val children = mutableListOf<Element>()
    private var text = ""

    private fun child(name: String, block: Element.() -> Unit) {
        children.add(Element(name).apply(block))
    }

    fun head(block: Element.() -> Unit) = child("head", block)
    fun title(block: Element.() -> Unit) = child("title", block)
    fun body(block: Element.() -> Unit) = child("body", block)
    fun h1(block: Element.() -> Unit) = child("h1", block)
    fun ul(block: Element.() -> Unit) = child("ul", block)
    fun li(block: Element.() -> Unit) = child("li", block)

    operator fun String.unaryPlus() {
        text += this
    }

    fun render(indent: String = ""): String = buildString {
        append("$indent<$name>")
        if (children.isEmpty()) {
            append(text)
        } else {
            appendLine()
            for (c in children) appendLine(c.render("$indent  "))
            append(indent)
        }
        append("</$name>")
    }
}

fun html(block: Element.() -> Unit) = Element("html").apply(block)

fun main() {
    val fruits = listOf("mango", "banana", "guava")
    val page = html {
        head { title { +"Market" } }
        body {
            h1 { +"Today" }
            ul {
                for (f in fruits) li { +f }
            }
        }
    }
    println(page.render())
}
` },
    { id: 'delegates', title: 'Property delegates: lazy, observable, a map', code: `import kotlin.properties.Delegates

class Account(data: Map<String, Any?>) {
    val owner: String by data
    val openedIn: Int by data

    val summary: String by lazy {
        println("(building the summary once)")
        "$owner, customer since $openedIn"
    }

    var balance: Int by Delegates.observable(0) { _, old, new ->
        println("balance $old -> $new")
    }

    var limit: Int by Delegates.vetoable(1000) { _, _, new -> new in 0..5000 }
}

fun main() {
    val a = Account(mapOf("owner" to "Asha", "openedIn" to 2019))
    println(a.summary)
    println(a.summary)
    a.balance += 500
    a.balance -= 200
    a.limit = 9000
    println("limit is still \${a.limit}")
}
` },
    // batch 4
    { id: 'channel-workers', title: 'Workers sharing a channel', code: `import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val orders = Channel<Int>()
    launch {
        for (o in 1..6) orders.send(o)
        orders.close()
    }
    val workers = List(3) { w ->
        launch {
            for (o in orders) {
                delay(100L * o)              // bigger orders take longer
                println("worker $w packed order $o")
            }
        }
    }
    workers.joinAll()
    println("all orders packed")
}
` },
    { id: 'search-flow', title: 'A search box: debounce and flatMapLatest, on the fake clock', code: `@file:OptIn(ExperimentalCoroutinesApi::class, FlowPreview::class)

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*

fun search(term: String): Flow<String> = flow {
    delay(200)                               // the server takes 200 ms
    emit("results for '$term'")
}

fun main() = runTest {
    val typed = flow {
        for (text in listOf("k", "ko", "kot", "kotl", "kotlin")) {
            emit(text)
            delay(80)                        // a fast typist
        }
        delay(1000)
        emit("java")
    }
    typed
        .map { it.trim() }
        .filter { it.length >= 2 }
        .distinctUntilChanged()
        .debounce(300)
        .flatMapLatest { search(it) }
        .collect { println("t=$currentTime $it") }
}
` }
  ];
})(window.KLT);
