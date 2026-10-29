/*
 * data/interview-functional.js - interview questions on functional Kotlin (Track 3, batch 2).
 *
 * The question shape is described at the top of data/interview-basics.js. Every ```kotlin block runs in
 * tests/test_content.py, and an ```output block after one is its exact output. Compiler messages are
 * K2's, as kotlinc 2.4.20 words them (probed in batch 2).
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];

  Q.push({
    id: 'scope-functions', track: 'functional', weight: 3,
    q: 'What are the scope functions, and when do you use each?',
    keywords: ['scope functions', 'let', 'run', 'with', 'apply', 'also', 'it', 'this', 'takeIf', 'builder', 'null check'],
    short: '`let`, `run`, `with`, `apply` and `also` run a block with an object in scope, and differ in two ways: the object is `this` (`run`, `with`, `apply`) or `it` (`let`, `also`); and the call returns what the block computes (`let`, `run`, `with`) or the object itself (`apply`, `also`). In practice: `?.let { }` for "only when not null", `apply { }` to set up a new object, `also { }` for a side effect such as logging in a chain, and `run { }` or `with(x) { }` to compute a value from an object\'s members.',
    answer: [
      kt(`data class Request(var url: String = "", var method: String = "GET", val headers: MutableMap<String, String> = mutableMapOf())

fun main() {
    val req = Request().apply {
        url = "https://api.example.com/users"
        headers["Accept"] = "application/json"
    }.also { println("built \${it.method} \${it.url}") }

    val token: String? = "abc123"
    token?.let { req.headers["Authorization"] = "Bearer $it" }

    val summary = with(req) { "$method $url with \${headers.size} headers" }
    println(summary)
    val host = req.url.run { substringAfter("://").substringBefore("/") }
    println(host)
}`),
      out(`built GET https://api.example.com/users
GET https://api.example.com/users with 2 headers
api.example.com`),
      '| Function | The object is | It returns |\n|---|---|---|\n| `let` | `it` | what the block computes |\n| `run` | `this` | what the block computes |\n| `with(x)` | `this` | what the block computes |\n| `apply` | `this` | the object |\n| `also` | `it` | the object |',
      '**The trap in `?.let { } ?: …`:** it is not an if/else. When the block itself returns null, the Elvis branch runs too:',
      kt(`fun main() {
    val name: String? = "Asha"
    val result = name?.let { null } ?: "fallback"
    println(result)
}`),
      out('fallback'),
      'Other pitfalls: nesting (an inner `it` hides an outer one), and long `let` chains where a local `val` would read better. Each scope function is a tiny `inline` function in the standard library, so none costs anything at run time.'
    ].join('\n\n'),
    followups: [
      '`apply` or `also`: when does the difference matter?',
      'What goes wrong with `x?.let { … } ?: y`?',
      'How are the scope functions written, and what do they cost?'
    ],
    related: ['lesson:kt-scope-functions', 'lesson:kt-null-safety', 'q:inline-functions'],
    docs: 'https://kotlinlang.org/docs/scope-functions.html'
  });

  Q.push({
    id: 'extension-functions', track: 'functional', weight: 3,
    q: 'How do extension functions work, and can they be overridden?',
    keywords: ['extension function', 'extension', 'receiver', 'static dispatch', 'static resolution', 'override', 'shadowed', 'member wins', 'utility class'],
    short: 'An extension, `fun String.initials()`, is called like a member but compiled to a static function that takes the receiver as its first parameter. So it cannot see private members, and it is chosen statically, from the declared type, when compiling: it cannot be overridden, and a member with the same signature always wins (the extension is "shadowed"). Extensions add convenience to classes you do not own and replace Java utility classes; most of Kotlin\'s standard library is extensions on Java\'s types.',
    answer: [
      kt(`open class Animal
class Dog : Animal() {
    fun speak() = "member: woof"
}

fun Animal.speak() = "extension on Animal"
fun Dog.describe() = "extension on Dog"
fun Animal.describe() = "extension on Animal"

fun main() {
    val dog = Dog()
    val asAnimal: Animal = dog
    println(dog.speak())
    println(asAnimal.speak())
    println(dog.describe())
    println(asAnimal.describe())
}`),
      out(`member: woof
extension on Animal
extension on Dog
extension on Animal`),
      'The last line is the interview answer: the object is a `Dog`, but the variable is declared `Animal`, so the `Animal` extension runs. A member function is chosen at run time from the object\'s class; an extension is chosen when compiling, from the variable\'s type. And on a `Dog` variable, the member `speak()` wins over the extension.',
      '**Scope.** An extension is visible where its package is imported (`import com.acme.util.initials`). Declared inside a class, it can use both its receiver and the class (a *member extension*), which is what Kotlin DSLs are made of.',
      '**When to use one:** for convenience on types you do not own, to keep a class\'s core small, and for helpers that work on null (`fun String?.orDash()`). Not for behaviour that should change in subclasses: that needs a member function.'
    ].join('\n\n'),
    followups: [
      'Why does the extension for the parent type run when the object is a child?',
      'Can an extension read `private` or `protected` members?',
      'What is an extension on a nullable receiver, and why is it useful?'
    ],
    related: ['lesson:kt-extensions', 'q:scope-functions'],
    docs: 'https://kotlinlang.org/docs/extensions.html'
  });

  Q.push({
    id: 'inline-functions', track: 'functional', weight: 3,
    q: 'What does inline do, and what are noinline and crossinline for?',
    keywords: ['inline', 'inline function', 'noinline', 'crossinline', 'non-local return', 'lambda allocation', 'reified', 'performance', 'bytecode'],
    short: '`inline` makes the compiler copy a function\'s body, with the bodies of its lambda arguments, into every place that calls it. That gives three things: no lambda object and no call for higher-order functions; a `return` inside the lambda that leaves the calling function (a non-local return); and `reified` type parameters. `noinline` keeps one lambda parameter a real object, to store it or pass it to non-inline code; `crossinline` keeps it inlined but forbids non-local returns, needed when the lambda is called from another context, such as an object or another thread. Inline only small functions that take lambdas.',
    answer: [
      kt(`inline fun <T> withLogging(name: String, block: () -> T): T {
    println("start $name")
    val r = block()
    println("end $name")
    return r
}

inline fun runLater(crossinline task: () -> Unit): Runnable = Runnable { task() }

fun firstEven(xs: List<Int>): Int? {
    withLogging("search") {
        for (x in xs) if (x % 2 == 0) return x
    }
    return null
}

fun main() {
    println(firstEven(listOf(3, 4, 5)))
    runLater { println("ran later") }.run()
}`),
      out(`start search
4
ran later`),
      '"end search" never printed: the non-local `return x` left `firstEven` from inside the block, skipping the rest of `withLogging`. That is the price of non-local returns; a `try`/`finally` inside the inline function would still run.',
      '`runLater` calls `task` inside a `Runnable`, which may run after `runLater` has returned, so a `return` in `task` would have nowhere to go. `crossinline` says the lambda will not try.',
      '**The costs.** Inlining copies code, so a large inline function called in many places grows the bytecode, and one with no lambda parameters gains nothing (*Expected performance impact from inlining is insignificant*). A public inline function cannot use non-public members, since its body becomes part of its callers, and changing it means recompiling them.'
    ].join('\n\n'),
    followups: [
      'Why does a non-local return need the function to be inline?',
      'When does inlining give no benefit?',
      'Why must a function with a `reified` type parameter be inline?'
    ],
    related: ['lesson:kt-inline', 'explain:inline-or-not', 'lesson:kt-reified', 'q:lambda-returns', 'q:reified'],
    docs: 'https://kotlinlang.org/docs/inline-functions.html'
  });

  Q.push({
    id: 'sequences', track: 'functional', weight: 3,
    q: 'What is the difference between a Sequence and a List, and how do sequences compare with Java streams?',
    keywords: ['sequence', 'asSequence', 'lazy', 'eager', 'stream', 'Java stream', 'terminal operation', 'intermediate operation', 'generateSequence', 'performance'],
    short: 'List operations are eager: each step (`map`, `filter`) goes over the whole collection and builds a new list. A `Sequence` is lazy: each element goes through every step in turn, nothing runs until a terminal operation (`toList`, `first`, `sum`), and it can stop early or never end. Use a sequence for large collections with long chains, or when an early stop (`first`, `take`) saves work; for small collections a list is often faster. Like Java streams, sequences are lazy and staged; unlike them, they can be iterated again if their source allows, have no parallel mode, and share the list operations\' names.',
    answer: [
      kt(`fun main() {
    var listSteps = 0
    var sequenceSteps = 0
    val data = (1..1_000).toList()

    data.map { listSteps++; it * 2 }.filter { listSteps++; it % 3 == 0 }.take(2)
    data.asSequence().map { sequenceSteps++; it * 2 }.filter { sequenceSteps++; it % 3 == 0 }.take(2).toList()

    println("list: $listSteps steps")
    println("sequence: $sequenceSteps steps")
}`),
      out(`list: 2000 steps
sequence: 12 steps`),
      'The list mapped and filtered all 1,000 numbers before `take(2)` looked at the result. The sequence stopped after the sixth number, where it had found its two matches.',
      '| | List | Sequence | Java Stream |\n|---|---|---|---|\n| Evaluation | eager | lazy | lazy |\n| Use it twice | yes | if its source can be | no |\n| Parallel | no | no | `parallelStream()` |\n| Endless | no | yes | yes |\n| Ends with | nothing | a terminal operation | a terminal operation |',
      'A sequence has a cost per element and step (an iterator chain, and lambdas that are not inlined), so measure before converting a short chain. Some sequence operations, such as `sorted()`, must read everything before giving the first item.'
    ].join('\n\n'),
    followups: [
      'When is a sequence slower than a list?',
      'Which operations are intermediate, and which are terminal?',
      'Is `sorted()` lazy on a sequence?'
    ],
    related: ['lesson:kt-sequences', 'lesson:kt-collection-ops', 'q:collection-operations'],
    docs: 'https://kotlinlang.org/docs/sequences.html'
  });

  Q.push({
    id: 'higher-order-functions', track: 'functional', weight: 2,
    q: 'What are higher-order functions and function types?',
    keywords: ['higher-order function', 'function type', 'lambda', 'anonymous function', 'function reference', 'receiver', 'Function1', 'callback'],
    short: 'A higher-order function takes a function as a parameter or returns one. Kotlin writes function types directly: `(Int) -> Boolean`, `() -> Unit`, `(String, Int) -> String`, nullable as `((Int) -> Unit)?`, and with a receiver as `StringBuilder.() -> Unit`. You can pass a lambda, an anonymous function or a function reference (`::isEven`). On the JVM a function type is an interface (`Function1` and the like); a lambda passed to a normal function is an object, and one passed to an `inline` function is inlined.',
    answer: [
      kt(`fun buildMessage(build: StringBuilder.() -> Unit): String = StringBuilder().apply(build).toString()

fun compose(f: (Int) -> Int, g: (Int) -> Int): (Int) -> Int = { g(f(it)) }

fun isEven(n: Int) = n % 2 == 0

fun main() {
    val msg = buildMessage {
        append("Hello")
        append(", Kotlin")
    }
    println(msg)
    val inc: (Int) -> Int = { it + 1 }
    val double = fun(x: Int): Int { return x * 2 }
    println(compose(inc, double)(5))
    println(listOf(1, 2, 3, 4).filter(::isEven))
}`),
      out(`Hello, Kotlin
12
[2, 4]`),
      'Three ways to pass a function: a lambda, `{ it + 1 }`; an anonymous function, `fun(x: Int): Int { … }`, where `return` returns from it as in Java; and a reference, `::isEven`.',
      '`StringBuilder.() -> Unit` is a function type *with a receiver*: inside the lambda, `this` is the `StringBuilder`, so `append` needs no prefix. It is what `apply`, `buildString` and every Kotlin DSL are made of ([[lesson:kt-dsls]] builds one).'
    ].join('\n\n'),
    followups: [
      'What is a function type with a receiver?',
      'How does a Java method receive a Kotlin lambda, and the other way round?',
      'What is the difference between a lambda and an anonymous function?'
    ],
    related: ['lesson:kt-higher-order', 'lesson:kt-lambdas', 'q:inline-functions', 'q:function-references'],
    docs: 'https://kotlinlang.org/docs/lambdas.html'
  });

  Q.push({
    id: 'collection-operations', track: 'functional', weight: 2,
    q: 'Explain map, flatMap, filter, fold, reduce, groupBy and associateBy.',
    keywords: ['map', 'flatMap', 'filter', 'fold', 'reduce', 'groupBy', 'associateBy', 'associate', 'groupingBy', 'collection operations', 'Collectors'],
    short: '`map` transforms each item; `flatMap` turns each into a collection and flattens them; `filter` keeps the matches. `fold(initial) { acc, x -> … }` accumulates from a start value (of any type, safe on an empty list); `reduce` starts from the first element and throws on an empty list. `groupBy { key }` gives a `Map<K, List<T>>`; `associateBy { key }` gives a `Map<K, T>`, keeping the last item for each key; `associate { k to v }` builds any map. Each returns a new collection and changes nothing in place.',
    answer: [
      kt(`data class Book(val title: String, val author: String, val tags: List<String>, val pages: Int)

val books = listOf(
    Book("Kotlin in Action", "Jemerov", listOf("kotlin", "jvm"), 360),
    Book("Effective Java", "Bloch", listOf("java", "jvm"), 412),
    Book("Atomic Kotlin", "Eckel", listOf("kotlin"), 638)
)

fun main() {
    println(books.map { it.title.length })
    println(books.flatMap { it.tags }.toSet())
    println(books.fold(0) { total, b -> total + b.pages })
    println(books.map { it.pages }.reduce { a, b -> maxOf(a, b) })
    println(books.groupBy { it.tags.first() }.mapValues { (_, bs) -> bs.size })
    println(books.associateBy { it.author }.keys)
    println(books.associate { it.title to it.pages }["Atomic Kotlin"])
}`),
      out(`[16, 14, 13]
[kotlin, jvm, java]
1410
638
{kotlin=2, java=1}
[Jemerov, Bloch, Eckel]
638`),
      '**The traps interviews look for:** `reduce` on an empty list throws, `fold` does not; `associateBy` silently drops all but the last item for a repeated key (use `groupBy` when keys repeat); `map { … }.flatten()` is `flatMap`; and a chain of five operations over a million items builds five intermediate lists, where `asSequence()` builds none. Counting is `groupingBy { it }.eachCount()`.'
    ].join('\n\n'),
    followups: [
      'What happens to repeated keys in `associateBy`?',
      'How would you count the words in a text?',
      'Which of these operations are lazy on a `Sequence`?'
    ],
    related: ['lesson:kt-collection-ops', 'q:sequences', 'q:read-only-collections'],
    docs: 'https://kotlinlang.org/docs/collection-transformations.html'
  });

  Q.push({
    id: 'lambda-returns', track: 'functional', weight: 2,
    q: 'What does return do inside a lambda?',
    keywords: ['return', 'non-local return', 'return@', 'label', 'forEach', 'continue', 'break', 'anonymous function', 'inline'],
    short: 'In a lambda passed to an `inline` function (`forEach`, `map`, `let`), a bare `return` is a *non-local return*: it returns from the function around it. In a lambda passed to a non-inline function, a bare `return` is not allowed (*\'return\' is prohibited here*). `return@label` (`return@forEach`, or a label you name) returns from the lambda only, which in `forEach` acts like `continue`. An anonymous function, `fun(x) { return … }`, returns from itself, as a Java lambda does. Since Kotlin 2.2.0, `break` and `continue` work inside inline lambdas too.',
    answer: [
      kt(`fun findInline(xs: List<Int>): String {
    xs.forEach { if (it == 2) return "found 2 (left findInline)" }
    return "not found"
}

fun skipTwo(xs: List<Int>): List<Int> {
    val out = mutableListOf<Int>()
    xs.forEach {
        if (it == 2) return@forEach
        out.add(it)
    }
    return out
}

fun main() {
    println(findInline(listOf(1, 2, 3)))
    println(skipTwo(listOf(1, 2, 3)))
    val squares = listOf(1, 2, 3).map(fun(x: Int): Int { return x * x })
    println(squares)
    val labelled = listOf(1, 2, 3).map inner@{ if (it == 2) return@inner 0; it * 10 }
    println(labelled)
}`),
      out(`found 2 (left findInline)
[1, 3]
[1, 4, 9]
[10, 0, 30]`),
      'A Java developer\'s instinct, `return` meaning "this element is done", is `return@forEach` in Kotlin. A plain `for` loop with `continue` and `break` is often clearer still.'
    ].join('\n\n'),
    followups: [
      'Why is a bare `return` not allowed in a lambda passed to `thread { }`?',
      'How do you leave a `forEach` altogether, rather than skip one item?',
      'What does `crossinline` have to do with returns?'
    ],
    related: ['lesson:kt-inline', 'q:inline-functions'],
    docs: 'https://kotlinlang.org/docs/returns.html'
  });

  Q.push({
    id: 'reified', track: 'functional', weight: 2,
    q: 'What is a reified type parameter, and why does it need inline?',
    keywords: ['reified', 'type erasure', 'generics', 'inline', 'T::class', 'is T', 'Class<T>', 'type token', 'filterIsInstance'],
    short: 'On the JVM, generic type arguments are erased: inside `fun <T> f()`, `T` is unknown at run time, so `x is T` and `T::class` do not compile. Marking the type parameter `reified` in an `inline` function fixes it: the body is copied into each call site, where the real type is known, and the compiler fills it in. It replaces Java\'s `Class<T>` parameters: `filterIsInstance<String>()`, `mapper.readValue<User>(json)`. The limits: inline functions only; the type argument\'s own arguments are still erased (`List<String>` is just `List`); and Java code cannot call such a function.',
    answer: [
      kt(`inline fun <reified T> Map<String, Any>.getAs(key: String): T? = this[key] as? T

inline fun <reified T : Enum<T>> parseEnum(name: String): T? =
    enumValues<T>().firstOrNull { it.name.equals(name, ignoreCase = true) }

enum class Level { LOW, HIGH }

fun main() {
    val config: Map<String, Any> = mapOf("port" to 8080, "host" to "localhost")
    val port: Int? = config.getAs("port")
    val wrong: String? = config.getAs("port")
    println(port)
    println(wrong)
    println(parseEnum<Level>("high"))
}`),
      out(`8080
null
HIGH`),
      '`getAs` even infers `T` from the variable\'s declared type: `val port: Int? = config.getAs("port")`.',
      '**Why it needs `inline`:** a normal function has one compiled body shared by every caller, and the JVM passes no type information, so there is nothing to fill `T` with (*Only type parameters of inline functions can be reified*). An inline function has a copy at each call site, each with its `T` known.'
    ].join('\n\n'),
    followups: [
      'What is type erasure, and what does Java do about it?',
      'Can a class have a reified type parameter?',
      'Why is `T::class` for a `List<String>` just `List`?'
    ],
    related: ['lesson:kt-reified', 'q:inline-functions', 'q:generics-variance'],
    docs: 'https://kotlinlang.org/docs/inline-functions.html#reified-type-parameters'
  });

  Q.push({
    id: 'function-references', track: 'functional', weight: 1,
    q: 'What are function references (::) in Kotlin?',
    keywords: ['function reference', 'callable reference', '::', 'method reference', 'bound reference', 'constructor reference', 'KFunction'],
    short: '`::name` turns an existing function, property or constructor into a value of a function type, like Java\'s method references: `list.filter(::isValid)`; `String::length`, unbound, where the receiver becomes the first parameter; `user::greet`, bound to that object; and `::User`, a constructor. Plain use needs no `kotlin-reflect`; with it, a reference is also a reflection object (`KFunction`, `KProperty`).',
    answer: [
      kt(`data class User(val name: String) {
    fun greet(other: String) = "$name greets $other"
}

fun isLong(s: String) = s.length > 3

fun main() {
    val names = listOf("Asha", "Li", "Ravi")
    println(names.filter(::isLong))
    println(names.map(String::length))
    println(names.map(::User))
    val asha = User("Asha")
    println(names.map(asha::greet))
    val nameOf: (User) -> String = User::name
    println(nameOf(User("Meera")))
}`),
      out(`[Asha, Ravi]
[4, 2, 4]
[User(name=Asha), User(name=Li), User(name=Ravi)]
[Asha greets Asha, Asha greets Li, Asha greets Ravi]
Meera`),
      '| Java | Kotlin |\n|---|---|\n| `Util::isLong`, a static method | `::isLong`, a top-level function |\n| `String::length` | `String::length` (a property) |\n| `user::greet` | `user::greet` |\n| `User::new` | `::User` |'
    ].join('\n\n'),
    followups: [
      'What is the difference between `String::length` and `"abc"::length`?',
      'When is a reference clearer than a lambda, and when is it not?',
      'Do function references need `kotlin-reflect`?'
    ],
    related: ['lesson:kt-lambdas', 'q:higher-order-functions'],
    docs: 'https://kotlinlang.org/docs/lambdas.html#function-references'
  });
})(window.KLT);
