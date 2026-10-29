/*
 * data/interview-types.js - interview questions on Types in depth (batch 3): the ★★ and ★ ones. The
 * track's ★★★ questions arrived early: equality and any-unit-nothing (data/interview-basics.js) and
 * generics-variance (data/interview-fast-track.js).
 *
 * The question shape is described at the top of data/interview-basics.js. Every ```kotlin block runs in
 * tests/test_content.py, and an ```output block after one is its exact output.
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function norun(code) { return '```kotlin-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function java(code) { return '```java\n' + code + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];

  Q.push({
    id: 'class-delegation', track: 'types', weight: 2,
    q: 'What is class delegation (`by`), and when would you use it instead of inheritance?',
    keywords: ['delegation', 'class delegation', 'by', 'decorator', 'composition over inheritance', 'forwarding', 'wrapper'],
    short: '`class A(b: B) : B by b` implements the interface `B` by forwarding every member to `b`; you override only what should change. It is composition with the forwarding methods written by the compiler. Use it to decorate an object (logging, caching, counting) or to combine behaviours, especially since Kotlin classes are final by default and cannot be extended. It works only for interfaces, `toString`/`equals`/`hashCode` are not forwarded, and the delegate never calls back into your overrides.',
    answer: [
      kt(`interface Cache {
    fun find(key: String): String?
    fun store(key: String, value: String)
}

class MapCache : Cache {
    private val map = HashMap<String, String>()
    override fun find(key: String) = map[key]
    override fun store(key: String, value: String) {
        map[key] = value
    }
}

class CountingCache(private val inner: Cache) : Cache by inner {
    var hits = 0
    var misses = 0
    override fun find(key: String): String? = inner.find(key).also { if (it == null) misses++ else hits++ }
}

fun main() {
    val c = CountingCache(MapCache())
    c.store("a", "1")
    c.find("a")
    c.find("b")
    println("\${c.hits} hit, \${c.misses} miss")
}`),
      out('1 hit, 1 miss'),
      '`store` was not written in `CountingCache`: the compiler forwards it. **Why prefer it to inheritance:** it works with final classes, the wrapper depends only on the interface (not on how the inner class calls its own methods, the fragile base class problem), and the wrapped object can be chosen at run time.',
      '**The limit, often asked as a follow-up:** calls go one way. If the inner object had a `findOrDefault` that called its own `find`, it would call *its* `find`, not your counting one. With inheritance it would call the override.'
    ].join('\n\n'),
    followups: [
      'Why does a delegated class not forward `toString`?',
      'An inner method calls another inner method you have overridden in the wrapper. Which one runs?',
      'How would you write the same decorator in Java?'
    ],
    related: ['lesson:kt-class-delegation', 'lesson:kt-visibility', 'q:final-by-default', 'q:property-delegates'],
    docs: 'https://kotlinlang.org/docs/delegation.html'
  });

  Q.push({
    id: 'property-delegates', track: 'types', weight: 2,
    q: 'How do delegated properties work? What do `lazy`, `observable` and a map delegate do?',
    keywords: ['delegated property', 'by lazy', 'lazy', 'observable', 'vetoable', 'Delegates', 'getValue', 'setValue', 'map delegate', 'ReadWriteProperty'],
    short: '`val x by d` hands the property\'s getter (and setter, for a `var`) to the object `d`, which provides `operator fun getValue(thisRef, property)` (and `setValue`). The compiler stores `d` in a hidden field and calls it on every access. `lazy { }` computes the value on first read and keeps it (thread-safe by default); `Delegates.observable` runs code after each change and `vetoable` can refuse one; a `Map` serves values by property name. Your own delegates are just classes with those operators.',
    answer: [
      kt(`import kotlin.properties.Delegates
import kotlin.reflect.KProperty

class Upper {
    private var value = ""
    operator fun getValue(thisRef: Any?, property: KProperty<*>) = value
    operator fun setValue(thisRef: Any?, property: KProperty<*>, v: String) {
        value = v.uppercase()
    }
}

class Profile(data: Map<String, Any?>) {
    val name: String by data
    val bio: String by lazy { "Bio of $name" }
    var code: String by Upper()
    var status: String by Delegates.observable("new") { p, old, new -> println("\${p.name}: $old -> $new") }
}

fun main() {
    val p = Profile(mapOf("name" to "Asha"))
    println(p.bio)
    p.code = "in-blr"
    println(p.code)
    p.status = "active"
}`),
      out(`Bio of Asha
IN-BLR
status: new -> active`),
      '**`lazy` and threads:** the default `LazyThreadSafetyMode.SYNCHRONIZED` runs the block once, under a lock; `PUBLICATION` may run it on several threads and keeps the first result; `NONE` has no locking. **`lazy` or `lateinit`?** `lazy` is for a `val` the class can compute itself; `lateinit` for a `var` that someone else sets later (a framework, a test\'s setup).'
    ].join('\n\n'),
    followups: [
      'What does the compiler generate for `val x by lazy { … }`?',
      'Which `LazyThreadSafetyMode` would you use for a value only the UI thread reads?',
      'How would you write a delegate that logs every read?'
    ],
    related: ['lesson:kt-property-delegates', 'q:lateinit-vs-lazy', 'q:class-delegation'],
    docs: 'https://kotlinlang.org/docs/delegated-properties.html'
  });

  Q.push({
    id: 'operator-overloading', track: 'types', weight: 2,
    q: 'How does operator overloading work in Kotlin, and what are its rules?',
    keywords: ['operator', 'operator overloading', 'plus', 'times', 'get', 'set', 'invoke', 'contains', 'compareTo', 'plusAssign', 'convention'],
    short: 'Each operator is a call to a function with a fixed name, marked `operator`: `a + b` is `a.plus(b)`, `a[i]` is `a.get(i)`, `a in b` is `b.contains(a)`, `a()` is `a.invoke()`, `a < b` is `a.compareTo(b) < 0`. The set of operators is fixed (you cannot invent new ones, and `&&`, `||`, `===` cannot be overloaded). They can be members or extensions, so you can add them to types you do not own; the standard library does this for `BigDecimal`.',
    answer: [
      kt(`import java.math.BigDecimal

data class Money(val cents: Long) {
    operator fun plus(o: Money) = Money(cents + o.cents)
    operator fun times(n: Int) = Money(cents * n)
    operator fun compareTo(o: Money) = cents.compareTo(o.cents)
}

operator fun Money.unaryMinus() = Money(-cents)

fun main() {
    val price = Money(1999)
    println(price * 3 + Money(1))
    println(-price)
    println(price > Money(1000))
    println(BigDecimal("1.10") + BigDecimal("2.20"))
}`),
      out(`Money(cents=5998)
Money(cents=-1999)
true
3.30`),
      '**Rules worth naming in an interview:** `==` calls `equals` (and cannot be redefined any other way); `+=` calls `plusAssign` if there is one, else `a = a + b`; `compareTo` gives all four of `<`, `>`, `<=`, `>=`; `componentN` functions are operators too (destructuring). **Judgement:** overload only where the meaning is obvious (maths, collections, units); `user + order` would surprise every reader.'
    ].join('\n\n'),
    followups: [
      'Which operators cannot be overloaded?',
      'What is the difference between `plus` and `plusAssign`?',
      'How can you add `+` to a class from a library you cannot change?'
    ],
    related: ['lesson:kt-operators', 'q:destructuring', 'q:extension-functions'],
    docs: 'https://kotlinlang.org/docs/operator-overloading.html'
  });

  Q.push({
    id: 'generic-constraints', track: 'types', weight: 2,
    q: 'How do you constrain a type parameter? What are upper bounds and `where` clauses?',
    keywords: ['upper bound', 'generic constraint', 'where', 'type parameter', 'T : Comparable', 'extends', 'bound', 'Any?', 'non-null type parameter'],
    short: '`fun <T : Comparable<T>> max(a: T, b: T)` says T must be a `Comparable<T>`: Java\'s `<T extends Comparable<T>>`. Several bounds go in a `where` clause: `where T : CharSequence, T : Comparable<T>`. With no bound, the bound is `Any?`, so a T may be null; `<T : Any>` forbids that. Inside the function you can then call the bound\'s members on a T.',
    answer: [
      kt(`fun <T : Comparable<T>> clamp(x: T, low: T, high: T): T = if (x < low) low else if (x > high) high else x

fun <T> longest(items: List<T>): T? where T : CharSequence, T : Comparable<T> = items.maxByOrNull { it.length }

fun <T : Any> describe(x: T) = "\${x::class.simpleName}: $x"

fun main() {
    println(clamp(15, 0, 10))
    println(clamp("m", "a", "k"))
    println(longest(listOf("fig", "banana", "kiwi")))
    println(describe(42))
}`),
      out(`10
k
banana
Int: 42`),
      '`x::class` needs a non-null receiver, which is what `<T : Any>` guarantees: with a plain `<T>`, `x` could be null and `x::class` would not compile. **Compared with Java:** bounds mean the same; the difference is variance, said once on the class in Kotlin ([[q:generics-variance]]), and `reified` type parameters for inline functions ([[q:reified]]).'
    ].join('\n\n'),
    followups: [
      'What is the default upper bound of a type parameter?',
      'How do you declare two bounds on one type parameter?',
      'Why can you not write `T::class` in an ordinary generic function?'
    ],
    related: ['lesson:kt-generics', 'q:generics-variance', 'q:reified'],
    docs: 'https://kotlinlang.org/docs/generics.html#upper-bounds'
  });

  Q.push({
    id: 'destructuring', track: 'types', weight: 1,
    q: 'What are destructuring declarations, and what is their pitfall?',
    keywords: ['destructuring', 'componentN', 'component1', 'data class', 'Pair', 'Triple', 'map entries', 'positional', '_'],
    short: '`val (name, age) = user` calls `user.component1()` and `component2()`. Data classes, `Pair`, `Triple` and map entries have them; any class can declare `operator fun componentN()`. It works in `val`, `for ((k, v) in map)` and lambda parameters (`{ (k, v) -> }`), and `_` skips a part. The pitfall: it is **positional**, so reordering a data class\'s properties, or swapping two names, silently gives wrong values when the types match.',
    answer: [
      kt(`data class Range(val from: Int, val to: Int)

fun main() {
    val (from, to) = Range(1, 5)
    println("$from..$to")
    val (to2, from2) = Range(1, 5)
    println("$from2..$to2")
    for ((word, count) in mapOf("a" to 2, "b" to 1)) println("$word:$count")
    val (_, last) = Range(7, 9)
    println(last)
}`),
      out(`1..5
5..1
a:2
b:1
9`),
      'The second declaration names them the wrong way round and compiles: destructuring takes `component1()` first, whatever the variable is called. Use it for short-lived, obvious shapes (pairs, map entries), and prefer the property names (`r.from`) where order could be confused.'
    ].join('\n\n'),
    followups: [
      'Which functions does a data class generate for destructuring?',
      'How do you destructure a map entry in a lambda?',
      'What happens to existing destructuring code if you add a property at the start of a data class?'
    ],
    related: ['lesson:kt-operators', 'q:data-classes', 'q:operator-overloading'],
    docs: 'https://kotlinlang.org/docs/destructuring-declarations.html'
  });

  Q.push({
    id: 'type-aliases', track: 'types', weight: 1,
    q: 'What is a `typealias`, and how is it different from a value class?',
    keywords: ['typealias', 'type alias', 'value class', 'inline class', 'new type', 'function type', 'JvmInline'],
    short: 'A `typealias` is another name for an existing type: `typealias Handler = (Event) -> Unit`. The compiler replaces it everywhere, so it is no new type: any `Int` is accepted where a `typealias UserId = Int` is asked for. A value class (`@JvmInline value class UserId(val v: Int)`) is a real new type, checked by the compiler, usually with no wrapper object at run time. Use aliases for long types; use value classes to keep ids and units apart.',
    answer: [
      kt(`typealias Callback = (String) -> Unit
typealias OrderId = Int

@JvmInline
value class UserId(val value: Int)

fun loadOrder(id: OrderId) = "order $id"
fun loadUser(id: UserId) = "user \${id.value}"

fun main() {
    val log: Callback = { println("log: $it") }
    val userNumber = 7
    log(loadOrder(userNumber))
    log(loadUser(UserId(7)))
}`),
      out(`log: order 7
log: user 7`),
      '`loadOrder(userNumber)` compiles although the number was meant as a user id: the alias does not stop it. `loadUser(7)` would not compile: a `UserId` must be made on purpose.'
    ].join('\n\n'),
    followups: [
      'Can a typealias give a generic type a shorter name, such as `typealias Grid<T> = List<List<T>>`?',
      'When is a value class boxed at run time?',
      'What does Java code see of a typealias?'
    ],
    related: ['lesson:kt-type-aliases', 'lesson:kt-value-inner', 'q:value-classes'],
    docs: 'https://kotlinlang.org/docs/type-aliases.html'
  });
})(window.KLT);
