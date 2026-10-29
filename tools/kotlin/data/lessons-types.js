/*
 * data/lessons-types.js - Track 4, Types in depth: seven lessons on what Kotlin's type system adds to
 * Java's (batch 3).
 *
 * The lesson shape is described at the top of data/lessons-basics.js. Every ```kotlin block runs in
 * tests/test_content.py, and an ```output block after one is its exact output. Code is written in
 * template literals: a Kotlin ${…} is \${…}, a Kotlin "\n" is "\\n", a backslash is \\.
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function norun(code) { return '```kotlin-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function java(code) { return '```java\n' + code + '\n```'; }
  var L = U.data.lessons = U.data.lessons || [];

  /* ---------------------------------------------------------------- 1 */
  L.push({
    id: 'kt-generics', track: 'types', title: 'Generics and variance',
    summary: 'Generic functions and classes, upper bounds and where, and variance: out and in once on the class instead of wildcards at every use, use-site projections, and star projections.',
    keywords: ['generics', 'generic', 'type parameter', 'variance', 'out', 'in', 'covariance', 'contravariance', 'invariant', 'star projection', 'upper bound', 'where', 'wildcard', '? extends', '? super', 'PECS'],
    docs: 'https://kotlinlang.org/docs/generics.html',
    body: [
      '## Generic functions and classes',
      'A type parameter goes in angle brackets, as in Java: after `class Box` for a class, and before the name for a function. Kotlin infers the type argument from the values almost always, so you rarely write it:',
      kt(`class Box<T>(val item: T) {
    fun <R> map(f: (T) -> R): Box<R> = Box(f(item))
}

fun <T> firstOrDefault(items: List<T>, default: T): T = items.firstOrNull() ?: default

fun main() {
    val b = Box(21).map { it * 2 }
    println(b.item)
    println(firstOrDefault(listOf<String>(), "none"))
    println(firstOrDefault(listOf(3, 4), 0))
}`),
      out(`42
none
3`),
      '`Box(21)` is a `Box<Int>`, and `map { it * 2 }` makes a `Box<Int>` again; `map { it.toString() }` would make a `Box<String>`. In `listOf<String>()` the type is written because an empty list gives the compiler nothing to infer from.',
      '## Upper bounds',
      'A bound says what a type argument must be. Java writes `<T extends Comparable<T>>`; Kotlin writes a colon. Several bounds go in a `where` clause:',
      kt(`fun <T : Comparable<T>> biggest(items: List<T>): T {
    var best = items.first()
    for (x in items) if (x > best) best = x
    return best
}

fun <T> describe(x: T): String where T : CharSequence, T : Comparable<T> = "$x has \${x.length} chars"

fun main() {
    println(biggest(listOf(3, 9, 4)))
    println(biggest(listOf("pear", "apple", "zucchini")))
    println(describe("kotlin"))
}`),
      out(`9
zucchini
kotlin has 6 chars`),
      'Because `T` is `Comparable<T>`, `x > best` compiles: it calls `compareTo`. Without a bound, the bound is `Any?`, so a `T` could be null.',
      '## Variance: is a list of cats a list of animals?',
      'A `MutableList<Cat>` is not a `MutableList<Animal>`, in Kotlin as in Java: if it were, code holding it as a list of animals could add a dog to a list of cats. Such a type is *invariant*. But a read-only `List` only gives items out, so Kotlin declares it `List<out E>`, and a `List<Cat>` *is* a `List<Animal>`:',
      kt(`open class Animal(val name: String)
class Cat(name: String) : Animal(name)

fun names(animals: List<Animal>) = animals.joinToString { it.name }

fun main() {
    val cats: List<Cat> = listOf(Cat("Tom"), Cat("Kitty"))
    println(names(cats))
    val moreCats: MutableList<Cat> = mutableListOf(Cat("Felix"))
    println(names(moreCats))
}`),
      out(`Tom, Kitty
Felix`),
      'The second call works too: `names` asks only for a `List<Animal>`, which a `MutableList<Cat>` is. What does not compile is `val animals: MutableList<Animal> = moreCats`.',
      '## out and in, said once on the class',
      '`out T` means the type only *produces* Ts (they come out of its functions), so a producer of `Int` is a producer of `Number`. `in T` means it only *consumes* Ts, so something that can print `Any` can print a `String`. The compiler checks the promise: an `out T` may not take a `T` parameter, an `in T` may not return one.',
      kt(`interface Producer<out T> {
    fun produce(): T
}

class Counter : Producer<Int> {
    private var n = 0
    override fun produce(): Int = ++n
}

fun interface Printer<in T> {
    fun print(item: T)
}

fun main() {
    val ints: Producer<Int> = Counter()
    val numbers: Producer<Number> = ints
    println(numbers.produce())
    println(numbers.produce())

    val anyPrinter = Printer<Any> { println("printing $it") }
    val stringPrinter: Printer<String> = anyPrinter
    stringPrinter.print("hello")
}`),
      out(`1
2
printing hello`),
      'This is *declaration-site* variance: said once, where the type is declared. Java has only *use-site* variance, a wildcard at every use (`Producer<? extends Number>`). The rule of thumb is Java\'s PECS, "producer extends, consumer super", in Kotlin\'s words: a producer is `out`, a consumer is `in`.',
      '## Use-site variance, when the class is invariant',
      'A `MutableList` both produces and consumes, so it is invariant. A function that only reads from one list and only writes to another can still say so at the use site, as Java\'s wildcards do:',
      kt(`fun copyInto(from: MutableList<out Number>, to: MutableList<in Number>) {
    for (x in from) to.add(x)
}

fun main() {
    val ints = mutableListOf(1, 2)
    val doubles = mutableListOf(0.5)
    val all = mutableListOf<Any>()
    copyInto(ints, all)
    copyInto(doubles, all)
    println(all)
}`),
      out('[1, 2, 0.5]'),
      '`MutableList<out Number>` accepts a list of `Int` or of `Double` and lets you read from it (you cannot `add` to it); `MutableList<in Number>` accepts a list of `Number` or of `Any` and lets you add to it.',
      '## Star projections',
      '`List<*>` is a list of *some* type you do not know: Java\'s `List<?>`. You can read from it (each item is an `Any?`) and ask its size, but not add to it:',
      kt(`fun printSize(items: List<*>) {
    println("\${items.size} items, first: \${items.firstOrNull()}")
}

fun main() {
    printSize(listOf(1, 2, 3))
    printSize(listOf("a"))
    val anything: MutableList<*> = mutableListOf("x", "y")
    println(anything[0])
}`),
      out(`3 items, first: 1
1 items, first: a
x`),
      'Adding to `anything` does not compile: the compiler does not know what type of item the list holds. Type arguments are erased at run time on the JVM, as in Java, so `x is List<String>` cannot be checked; `x is List<*>` can. The [[lesson:kt-reified]] lesson shows how `inline` and `reified` keep a type argument for a function.'
    ].join('\n\n'),
    java: [
      java(`static <T extends Comparable<T>> T biggest(List<T> items) { ... }

double sum(List<? extends Number> numbers) { ... }       // a producer
void fill(List<? super Integer> target) { ... }          // a consumer
int size(List<?> anything) { return anything.size(); }`),
      '| Java | Kotlin |\n|---|---|\n| `<T extends Comparable<T>>` | `<T : Comparable<T>>` |\n| `<T extends A & B>` | `where T : A, T : B` |\n| `List<? extends Number>` | `List<Number>` (List is declared `out`), or `MutableList<out Number>` |\n| `List<? super Integer>` | `MutableList<in Int>` |\n| `List<?>` | `List<*>` |',
      'The big difference: in Java, every method that takes a list of numbers has to write `? extends Number`, and forgetting it makes the method refuse a `List<Integer>`. In Kotlin, `List` says `out` once, so a plain `List<Number>` parameter takes a `List<Int>`.'
    ].join('\n\n'),
    example: {
      code: `class Stack<T> {
    private val items = mutableListOf<T>()

    fun push(x: T) {
        items.add(x)
    }

    fun pop(): T? = items.removeLastOrNull()

    val size: Int get() = items.size
}

fun main() {
    val s = Stack<String>()
    s.push("a")
    s.push("b")
    println(s.pop())
    println(s.size)
    val numbers = Stack<Int>()
    numbers.push(42)
    println(numbers.pop()?.plus(1))
}`,
      note: 'Try `s.push(3)`: the compiler refuses an `Int` for a `Stack<String>`. Then add `fun peek(): T? = items.lastOrNull()` and use it.'
    },
    challenge: {
      title: 'Bounds and variance',
      task: 'Write three generic pieces:\n\n1. `largest(a, b, c)`: the largest of three values of **any comparable type** (Ints, Strings, Doubles…). Give `T` the upper bound `Comparable<T>`.\n2. `Labeled<T>.map(f)`: a new `Labeled` with the same label and `f(value)`, whose type may differ from `T`.\n3. `addAll(from, to)`: add every item of `from` to `to`. As given, `to` takes only a `MutableList<Int>`; change its type so that a `MutableList<Number>` or a `MutableList<Any>` works too.',
      starter: `fun <T> largest(a: T, b: T, c: T): T = TODO("the largest of the three: give T an upper bound")

class Labeled<T>(val label: String, val value: T) {
    fun <R> map(f: (T) -> R): Labeled<R> = TODO("a Labeled with the same label and f(value)")
}

// Make this accept a MutableList<Number> or a MutableList<Any> as \`to\`, too
fun addAll(from: List<Int>, to: MutableList<Int>) {
    TODO("add every item of from to to")
}

fun main() {
    println(largest(3, 9, 4))
}`,
      solution: `fun <T : Comparable<T>> largest(a: T, b: T, c: T): T {
    var best = a
    if (b > best) best = b
    if (c > best) best = c
    return best
}

class Labeled<T>(val label: String, val value: T) {
    fun <R> map(f: (T) -> R): Labeled<R> = Labeled(label, f(value))
}

fun addAll(from: List<Int>, to: MutableList<in Int>) {
    for (x in from) to.add(x)
}

fun main() {
    println(largest(3, 9, 4))
    println(largest("pear", "fig", "plum"))
    println(Labeled("price", 10).map { it * 2 }.value)
    val all = mutableListOf<Any>("start")
    addAll(listOf(1, 2), all)
    println(all)
}`,
      hints: [
        '`fun <T : Comparable<T>> largest(a: T, b: T, c: T): T`: with the bound, `b > best` compiles. (The standard library\'s `maxOf(a, b, c)` is fine too.)',
        '`map` builds a new one: `Labeled(label, f(value))`.',
        '`to` only receives Ints, so it is a consumer: `MutableList<in Int>` accepts a list of `Int`, `Number` or `Any`.'
      ],
      checks: [
        { label: 'The largest of three Ints, wherever it is', code: 'eq(largest(3, 9, 4), 9)\neq(largest(9, 3, 4), 9)\neq(largest(3, 4, 9), 9)' },
        { label: 'Any comparable type: Strings and Doubles too', code: 'eq(largest("pear", "fig", "plum"), "plum")\neq(largest(1.5, -2.0, 0.0), 1.5)' },
        { label: '`T` has the upper bound `Comparable<T>`', code: 'ok(uses("""<\\s*T\\s*:\\s*Comparable\\s*<\\s*T\\s*>\\s*>"""), "give T the bound <T : Comparable<T>>")' },
        { label: '`map` keeps the label and can change the type', code: 'val l = Labeled("price", 10).map { it * 2 }\neq(l.label, "price")\neq(l.value, 20)\neq(Labeled("n", 5).map { "#" + it }.value, "#5")' },
        { label: '`addAll` fills a `MutableList<Any>` and a `MutableList<Number>`', code: 'val anyList = mutableListOf<Any>("start")\naddAll(listOf(1, 2), anyList)\nval numbers = mutableListOf<Number>(0.5)\naddAll(listOf(3), numbers)\neq(anyList, listOf("start", 1, 2))\neq(numbers, listOf(0.5, 3))' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'kt-any-unit-nothing', track: 'types', title: 'Any, Unit and Nothing',
    summary: 'Any is the top of every class tree (Java\'s Object), Unit is a real value (Java\'s void), and Nothing is the type of code that never returns, which is why throw, return and TODO() fit anywhere.',
    keywords: ['Any', 'Unit', 'Nothing', 'Object', 'void', 'top type', 'bottom type', 'throw', 'TODO', 'error', 'never returns', 'Nothing?'],
    docs: 'https://kotlinlang.org/docs/exceptions.html',
    body: [
      '## Any: the top of the class tree',
      'Every Kotlin class extends `Any`, as every Java class extends `Object`. A parameter of type `Any` takes anything that is not null (`Any?` takes null too), and `is` finds out what it really is:',
      kt(`fun describe(x: Any): String = when (x) {
    is Int -> "an Int: $x"
    is String -> "a String of \${x.length}"
    is List<*> -> "a list of \${x.size}"
    else -> "something else: \${x::class.simpleName}"
}

fun main() {
    println(describe(42))
    println(describe("hi"))
    println(describe(listOf(1, 2)))
    println(describe(3.5))
}`),
      out(`an Int: 42
a String of 2
a list of 2
something else: Double`),
      '`Any` has only three members: `equals`, `hashCode` and `toString`. Java\'s `Object` also has `getClass`, `wait` and `notify`; Kotlin writes `x::class` (or `x.javaClass`) for the first, and leaves the others to `java.util.concurrent`. An `Int` passed as `Any` is boxed into a `java.lang.Integer`, as in Java.',
      '## Unit: a real value',
      'A function that returns nothing useful returns `Unit`, and you leave the type out. Unlike Java\'s `void`, `Unit` is a real object, the only value of its type, so it can be stored, compared, and used as a type argument:',
      kt(`fun greet(name: String) {
    println("Hello, $name")
}

fun main() {
    val result = greet("Asha")
    println(result)
    println(result == Unit)
    val actions: List<() -> Unit> = listOf({ println("one") }, { println("two") })
    actions.forEach { it() }
}`),
      out(`Hello, Asha
kotlin.Unit
true
one
two`),
      'That last part is the point: `() -> Unit` is a type like any other. Java needs a separate interface (`Runnable` instead of `Supplier<Void>`) because `void` is not a type.',
      '## Nothing: code that never returns',
      'A function that always throws can declare `Nothing` as its return type. No value has type `Nothing`, so the compiler knows that a call to it never finishes, and `Nothing` fits where *any* type is expected:',
      kt(`fun fail(message: String): Nothing = throw IllegalArgumentException(message)

fun parsePort(text: String): Int {
    val n = text.toIntOrNull() ?: fail("not a number: $text")
    return if (n in 1..65535) n else fail("out of range: $n")
}

fun main() {
    println(parsePort("8080"))
    try {
        parsePort("http")
    } catch (e: IllegalArgumentException) {
        println(e.message)
    }
}`),
      out(`8080
not a number: http`),
      '`text.toIntOrNull() ?: fail(…)` is an `Int`: the left side is an `Int?`, and the right side never gives a value at all. The same is true of `throw`, `return`, `break` and `continue`, which are expressions of type `Nothing`, and of the standard library\'s `TODO()` and `error("…")`. That is why `val n = s.toIntOrNull() ?: return` compiles, and why the compiler knows that the code after such a call never runs.',
      '## Nothing? and the empty list',
      'The literal `null` alone has the type `Nothing?`, which fits any nullable type. And because `List` is covariant (`out`), the `List<Nothing>` that `emptyList()` can return fits a `List<String>` and a `List<Int>` alike:',
      kt(`fun main() {
    val names: List<String> = emptyList()
    val ids: List<Int> = emptyList()
    println(names.size + ids.size)
    val missing: String? = null
    println(missing)
}`),
      out(`0
null`),
      'You saw this in the sealed `Result` of the [[lesson:kt-sealed]] lesson: `Failure` extends `Result<Nothing>`, so one `Failure` object is a `Result<Int>` and a `Result<String>` at once.'
    ].join('\n\n'),
    java: [
      java(`Object x = 42;                       // Kotlin: val x: Any = 42
void log(String s) { ... }           // Kotlin: fun log(s: String) (returns Unit)
Supplier<Void> s = () -> null;       // Kotlin: val s: () -> Unit = { }

static RuntimeException fail(String m) { return new IllegalArgumentException(m); }
int n = parse(text);                  // Java cannot say "this call never returns",
if (n < 0) throw fail("negative");    // so it returns the exception for you to throw`),
      'Java has no `Nothing`: a method that always throws is still `void` or returns something, so `int n = fail()` cannot compile, and code after it is not known to be unreachable. Kotlin\'s `Nothing` makes "this never returns" part of the type, which is how `?:` with `throw` or `return` type-checks.'
    ].join('\n\n'),
    example: {
      code: `fun checkAge(age: Int): Int = if (age >= 0) age else throw IllegalArgumentException("age $age")

fun main() {
    println(checkAge(30))
    val label: String = if (checkAge(5) > 3) "older" else TODO("decide later")
    println(label)
    val u: Unit = println("println returns Unit")
    println(u)
}`,
      note: 'Change `checkAge(5)` to `checkAge(2)`: the program reaches the `TODO()` and stops with `NotImplementedError`. Then try `checkAge(-1)`.'
    },
    challenge: {
      title: 'Code that never returns',
      task: 'Write four small functions:\n\n1. `fail(message)`: always throws `IllegalStateException(message)`. Declare its return type so that a call to it fits where an `Int` is expected.\n2. `requirePositive(n)`: `n` when it is above 0, otherwise `fail("not positive: <n>")`.\n3. `lengthOf(s)`: the length of `s`, or `fail("no text")` when `s` is null (one expression, with `?:`).\n4. `runAll(actions)`: run every action in the list, in order, and return how many ran.',
      starter: `fun fail(message: String): Unit = TODO("throw an IllegalStateException with the message")

fun requirePositive(n: Int): Int = TODO("n when it is above 0, else fail(...)")

fun lengthOf(s: String?): Int = TODO("the length, or fail(...) when s is null")

fun runAll(actions: List<() -> Unit>): Int = TODO("run each action; return how many ran")

fun main() {
    println(requirePositive(5))
}`,
      solution: `fun fail(message: String): Nothing = throw IllegalStateException(message)

fun requirePositive(n: Int): Int = if (n > 0) n else fail("not positive: $n")

fun lengthOf(s: String?): Int = s?.length ?: fail("no text")

fun runAll(actions: List<() -> Unit>): Int {
    for (action in actions) action()
    return actions.size
}

fun main() {
    println(requirePositive(5))
    println(lengthOf("kotlin"))
    println(runAll(listOf({ println("one") }, { println("two") })))
}`,
      hints: [
        'A function that only throws returns `Nothing`: `fun fail(message: String): Nothing = throw IllegalStateException(message)`.',
        'Because `fail` returns `Nothing`, it fits on either side of an `if` that gives an `Int`, and after `?:`: `s?.length ?: fail("no text")`.',
        'Each action is a function: call it with `action()`.'
      ],
      checks: [
        { label: '`fail("boom")` throws an `IllegalStateException` saying `boom`', code: 'val e = runCatching { fail("boom") }.exceptionOrNull()\nok(e is IllegalStateException, "fail should throw an IllegalStateException, not ${e?.javaClass?.simpleName}")\neq(e?.message, "boom")' },
        { label: '`fail` returns `Nothing`, so a call to it fits where an `Int` is expected', code: 'val n: Int = runCatching<Int> { fail("typed") }.getOrDefault(7)\neq(n, 7)' },
        { label: '`requirePositive`: 5 gives 5; 0 fails with `not positive: 0`', code: 'eq(requirePositive(5), 5)\nval e = runCatching { requirePositive(0) }.exceptionOrNull()\nok(e is IllegalStateException && e.message == "not positive: 0", "requirePositive(0) should fail with \\"not positive: 0\\", got $e")' },
        { label: '`lengthOf`: 3 for `"abc"`; null fails with `no text`; both functions call `fail`', code: 'eq(lengthOf("abc"), 3)\nval e = runCatching { lengthOf(null) }.exceptionOrNull()\nok(e is IllegalStateException && e.message == "no text", "lengthOf(null) should fail with \\"no text\\", got $e")\nok(Regex("""\\bfail\\s*\\(""").findAll(code).count() >= 3, "call fail(...) in requirePositive and in lengthOf")' },
        { label: '`runAll` runs every action, in order, and counts them', code: 'var log = ""\neq(runAll(listOf({ log += "a" }, { log += "b" }, { log += "c" })), 3)\neq(log, "abc")\neq(runAll(listOf()), 0)' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'kt-equality', track: 'types', title: '== and ===',
    summary: '== compares by value (it calls equals, and handles null); === asks whether two references are the same object. Writing equals and hashCode together, the Integer cache, and arrays.',
    keywords: ['==', '===', 'equals', 'hashCode', 'equality', 'identity', 'structural equality', 'referential equality', 'Integer cache', 'contentEquals', 'reference'],
    docs: 'https://kotlinlang.org/docs/equality.html',
    body: [
      '## Two kinds of equality',
      'Kotlin\'s `==` asks "do these hold the same value?" and calls `equals`. `===` asks "are these the same object?", which is what Java\'s `==` means for objects:',
      kt(`data class Point(val x: Int, val y: Int)

fun main() {
    val a = Point(1, 2)
    val b = Point(1, 2)
    val c = a
    println(a == b)
    println(a === b)
    println(a === c)
    println(a != b)
}`),
      out(`true
false
true
false`),
      'A data class gets an `equals` that compares its properties, so `a == b`. They are still two objects: `a === b` is false, and `c` is another name for `a`. `!=` and `!==` are the opposites.',
      '## == is safe with null',
      '`a == b` compiles to `a?.equals(b) ?: (b === null)`: it never throws on a null, unlike Java\'s `a.equals(b)`.',
      kt(`fun main() {
    val s: String? = null
    println(s == null)
    println(s == "x")
    val t: String? = "x"
    println(t == "x")
}`),
      out(`true
false
true`),
      '## Strings compare by content',
      'So `==` is the right way to compare strings, the mistake every Java developer has made once (`if (name == "admin")`) cannot happen:',
      kt(`fun main() {
    val a = "kotlin"
    val b = StringBuilder("kot").append("lin").toString()
    println(a == b)
    println(a === b)
    println(a.equals("KOTLIN", ignoreCase = true))
}`),
      out(`true
false
true`),
      '## Writing equals and hashCode',
      'A class of your own compares by identity until you override `equals`. When you do, override `hashCode` too, and make equal objects give equal hash codes: `HashSet` and `HashMap` look in the bucket the hash code picks, and only then call `equals`.',
      kt(`class Email(address: String) {
    val address = address.trim().lowercase()

    override fun equals(other: Any?): Boolean = other is Email && other.address == address
    override fun hashCode(): Int = address.hashCode()
    override fun toString() = "Email($address)"
}

fun main() {
    val a = Email("Asha@Example.com ")
    val b = Email("asha@example.com")
    println(a == b)
    println(setOf(a, b).size)
    println(mapOf(a to "first")[b])
}`),
      out(`true
1
first`),
      '`other is Email` checks the type and smart-casts in one step, so `other.address` needs no cast. Without the `hashCode` override, `a` and `b` would almost always land in different buckets: the set would hold both and the map lookup would give `null`, though `a == b`.',
      '## Numbers: == compares values',
      'For numbers, `==` compares the values, boxed or not. `===` on boxed numbers compares the boxes, and the JVM keeps one box for each value from -128 to 127 (the `Integer` cache), so its answer depends on the number:',
      kt(`fun main() {
    val a: Int = 1000
    val b: Int = 1000
    println(a == b)
    val x: Int? = 1000
    val y: Int? = 1000
    println(x == y)
    println(x === y)
    val small1: Int? = 100
    val small2: Int? = 100
    println(small1 === small2)
}`),
      out(`true
true
false
true`),
      'The compiler warns about `===` on numbers for exactly this reason. Use `==`. (Java\'s `Integer a = 1000, b = 1000; a == b` is `false`, a classic trap; in Kotlin `==` never compares boxes.)',
      '## Arrays compare by reference',
      'An `Array` is a Java array, and its `equals` is Java\'s identity. Compare contents with `contentEquals`, or use lists, which compare by content:',
      kt(`fun main() {
    val a = arrayOf(1, 2, 3)
    val b = arrayOf(1, 2, 3)
    println(a.contentEquals(b))
    println(a.toList() == b.toList())
    println(listOf(1, 2, 3) == listOf(1, 2, 3))
}`),
      out(`true
true
true`)
    ].join('\n\n'),
    java: [
      java(`String a = "kotlin";
String b = new StringBuilder("kot").append("lin").toString();
a == b;                // false: two objects (Kotlin: a === b)
a.equals(b);           // true                (Kotlin: a == b)
Objects.equals(a, b);  // true, and null-safe (Kotlin: a == b)

Integer x = 1000, y = 1000;
x == y;                // false: two boxes! (127 would give true)`),
      'In Java you must remember which `==` you want: `==` for primitives and identity, `.equals` (or `Objects.equals`, for nulls) for values. Kotlin makes the common case short: `==` is always `equals`, null-safe; `===` is the rare identity check.'
    ].join('\n\n'),
    example: {
      code: `data class User(val id: Int, val name: String)

fun main() {
    val a = User(1, "Asha")
    val b = User(1, "Asha")
    println(a == b)
    println(a === b)
    println(a.hashCode() == b.hashCode())
    println(setOf(a, b).size)
}`,
      note: 'Remove `data` and run: `==` falls back to identity, so `a == b` becomes `false` and the set holds two users.'
    },
    challenge: {
      title: 'Equal by what matters',
      task: 'An ISBN can be written with dashes and spaces: `"978-0-13"`, `"97 80 13"` and `"978013"` are the same number.\n\n1. Give `Isbn` a `value`: its text without `-` and spaces, upper-cased.\n2. Make two `Isbn`s with the same `value` equal (`==`), and usable as one key in sets and maps. `toString()` gives `"ISBN <value>"`.\n3. `sameObject(a, b)`: true only when `a` and `b` are the very same object.\n4. `countDistinct(isbns)`: how many different ISBNs the list holds.',
      starter: `class Isbn(raw: String) {
    // "978-0-13" and "97 80 13" are the same ISBN: keep the text without '-' and spaces, upper-cased
    val value: String = TODO("raw without '-' and spaces, upper-cased")

    // equals, hashCode and toString go here
}

fun sameObject(a: Any, b: Any): Boolean = TODO("true only when a and b are the same object")

fun countDistinct(isbns: List<Isbn>): Int = TODO("how many different ISBNs")

fun main() {
    println(Isbn("978-0-13") == Isbn("978013"))
}`,
      solution: `class Isbn(raw: String) {
    val value: String = raw.replace("-", "").replace(" ", "").uppercase()

    override fun equals(other: Any?): Boolean = other is Isbn && other.value == value
    override fun hashCode(): Int = value.hashCode()
    override fun toString(): String = "ISBN $value"
}

fun sameObject(a: Any, b: Any): Boolean = a === b

fun countDistinct(isbns: List<Isbn>): Int = isbns.toSet().size

fun main() {
    println(Isbn("978-0-13") == Isbn("97 80 13"))
    println(countDistinct(listOf(Isbn("1-2"), Isbn("12"), Isbn("3"))))
    println(Isbn("0-306-4061-x"))
}`,
      hints: [
        '`override fun equals(other: Any?): Boolean = other is Isbn && other.value == value`: `is` checks the type and smart-casts.',
        'Equal objects must have equal hash codes: `override fun hashCode() = value.hashCode()`.',
        '"The same object" is `===`; a set keeps one of each equal value: `isbns.toSet().size`.'
      ],
      checks: [
        { label: 'Dashes, spaces and case do not matter', code: 'eq(Isbn("978-0-13"), Isbn("978013"))\neq(Isbn("97 80 13"), Isbn("978013"))\neq(Isbn("0-306-4061-x"), Isbn("03064061X"))' },
        { label: 'Different ISBNs differ, and an Isbn never equals null or a String', code: 'ok(Isbn("1") != Isbn("2"), "1 and 2 are different ISBNs")\nok(!Isbn("1").equals(null), "an Isbn is not equal to null")\nok(!Isbn("1").equals("1"), "an Isbn is not equal to a String")' },
        { label: 'Equal ISBNs work as one key in a set and a map', code: 'eq(Isbn("978-0").hashCode(), Isbn("9780").hashCode())\neq(setOf(Isbn("12-3"), Isbn("123"), Isbn("1 23")).size, 1)\neq(mapOf(Isbn("4-5") to "book")[Isbn("45")], "book")' },
        { label: '`sameObject` is identity: two equal ISBNs are still two objects', code: 'val i = Isbn("1")\nok(sameObject(i, i), "an object is the same object as itself")\nok(!sameObject(Isbn("1"), Isbn("1")), "two Isbn objects that are equal by value are still two objects: use ===")' },
        { label: '`countDistinct` and `toString()`', code: 'eq(countDistinct(listOf(Isbn("1-2"), Isbn("12"), Isbn("3"))), 2)\neq(Isbn("1-2").toString(), "ISBN 12")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'kt-class-delegation', track: 'types', title: 'Class delegation',
    summary: 'class A(b: B) : B by b implements an interface by forwarding every call to an object you hold, so you override only what changes: composition without the boilerplate, and decorators in a few lines.',
    keywords: ['delegation', 'by', 'class delegation', 'interface delegation', 'decorator', 'composition', 'forwarding', 'wrapper', 'composition over inheritance'],
    docs: 'https://kotlinlang.org/docs/delegation.html',
    body: [
      '## Implementing an interface by delegation',
      '`: Repository by inner` tells the compiler: implement every member of `Repository` by calling the same member on `inner`. You override only the members that should do something different:',
      kt(`interface Repository {
    fun find(id: Int): String?
    fun save(id: Int, value: String)
    fun count(): Int
}

class MemoryRepository : Repository {
    private val items = mutableMapOf<Int, String>()
    override fun find(id: Int) = items[id]
    override fun save(id: Int, value: String) {
        items[id] = value
    }
    override fun count() = items.size
}

class LoggingRepository(private val inner: Repository) : Repository by inner {
    override fun save(id: Int, value: String) {
        println("saving $id")
        inner.save(id, value)
    }
}

fun main() {
    val repo = LoggingRepository(MemoryRepository())
    repo.save(1, "Asha")
    repo.save(2, "Ravi")
    println(repo.find(1))
    println(repo.count())
}`),
      out(`saving 1
saving 2
Asha
2`),
      '`find` and `count` were never written in `LoggingRepository`: the compiler generated them, each one line that calls `inner`. Add a member to `Repository` and every delegating class gets it, with no change.',
      '## Composition instead of inheritance',
      'Kotlin classes are final unless they are `open` ([[lesson:kt-visibility]]), so "extend it and override one method" is often not even possible. Delegation wraps the object instead. It also avoids a trap Joshua Bloch made famous in *Effective Java*: a `HashSet` subclass that counts additions by overriding both `add` and `addAll` counts twice, because `HashSet.addAll` calls `add`. A delegating set does not depend on how the inner set is written:',
      kt(`class CountingSet<T>(private val inner: MutableSet<T> = mutableSetOf()) : MutableSet<T> by inner {
    var attempts = 0
        private set

    override fun add(element: T): Boolean {
        attempts++
        return inner.add(element)
    }

    override fun addAll(elements: Collection<T>): Boolean {
        attempts += elements.size
        return inner.addAll(elements)
    }
}

fun main() {
    val s = CountingSet<String>()
    s.add("a")
    s.addAll(listOf("a", "b", "c"))
    println(s.attempts)
    println(s.size)
    println(s.toList())
    println(s.toString().startsWith("CountingSet@"))
}`),
      out(`4
3
[a, b, c]
true`),
      'The last line shows what is *not* delegated: `toString`, `equals` and `hashCode` belong to `Any`, not to the interface, so `CountingSet` keeps its own (here the default `CountingSet@1b6d3586`-style text). Override them yourself when they matter.',
      '## Several interfaces',
      kt(`interface Engine {
    fun start(): String
}

interface Radio {
    fun play(): String
}

class V8 : Engine {
    override fun start() = "vroom"
}

class FmRadio : Radio {
    override fun play() = "music"
}

class Car(engine: Engine, radio: Radio) : Engine by engine, Radio by radio

fun main() {
    val car = Car(V8(), FmRadio())
    println(car.start() + " and " + car.play())
}`),
      out('vroom and music'),
      '## The delegate does not call back into you',
      'The calls go one way. When a forwarded member calls another member, it calls the *delegate\'s*, not your override:',
      kt(`interface Greeter {
    fun name(): String
    fun greet(): String = "Hello, \${name()}"
}

class Default : Greeter {
    override fun name() = "world"
}

class Custom(g: Greeter) : Greeter by g {
    override fun name() = "Kotlin"
}

fun main() {
    val c = Custom(Default())
    println(c.name())
    println(c.greet())
}`),
      out(`Kotlin
Hello, world`),
      '`c.greet()` is forwarded to the `Default` object, and inside it `name()` is `Default`\'s. With inheritance (`class Custom : Default()`, if `Default` were open) it would print `Hello, Kotlin`. That is the trade: delegation is safer because the inner object cannot be affected by your overrides, and for the same reason it cannot be customised from the outside.'
    ].join('\n\n'),
    java: [
      java(`class LoggingRepository implements Repository {
    private final Repository inner;
    LoggingRepository(Repository inner) { this.inner = inner; }

    @Override public String find(int id) { return inner.find(id); }       // forwarding,
    @Override public int count() { return inner.count(); }                // by hand,
    @Override public void save(int id, String value) {                    // for every method
        System.out.println("saving " + id);
        inner.save(id, value);
    }
}`),
      'Java has no delegation: a decorator writes one forwarding method per interface method (*Effective Java*\'s `ForwardingSet` has fifteen), or uses Lombok\'s `@Delegate`. In Kotlin `: Repository by inner` writes them, and keeps them right when the interface grows.'
    ].join('\n\n'),
    example: {
      code: `interface Notifier {
    fun send(to: String, text: String): String
    fun channel(): String
}

class EmailNotifier : Notifier {
    override fun send(to: String, text: String) = "email to $to: $text"
    override fun channel() = "email"
}

class Shouting(private val inner: Notifier) : Notifier by inner {
    override fun send(to: String, text: String) = inner.send(to, text.uppercase() + "!")
}

fun main() {
    val n = Shouting(EmailNotifier())
    println(n.send("asha", "meeting at 3"))
    println(n.channel())
}`,
      note: '`channel()` was never written in `Shouting`. Add a third member to `Notifier` (with an implementation in `EmailNotifier`) and call it on `n`.'
    },
    challenge: {
      title: 'A caching price service',
      task: '`SlowPrices` is slow, and counts how often it is asked. Write `CachedPrices(inner)`:\n\n- it implements `PriceService` **by delegation** to `inner` (`: PriceService by inner`), so `currency()` is forwarded without being written;\n- it overrides only `price(item)`, asking `inner` at most once per item and remembering each answer;\n- `cacheSize` is how many prices it remembers.',
      starter: `interface PriceService {
    fun price(item: String): Int
    fun currency(): String
}

class SlowPrices : PriceService {
    var calls = 0
    override fun price(item: String): Int {
        calls++
        return item.length * 10
    }
    override fun currency() = "INR"
}

// Implement PriceService by delegating to inner; override only price, to remember each answer
class CachedPrices(private val inner: PriceService) : PriceService {
    override fun price(item: String): Int = TODO("ask inner once per item")
    override fun currency(): String = TODO("let delegation forward this instead")
    val cacheSize: Int get() = TODO("how many prices are remembered")
}

fun main() {
    val cached = CachedPrices(SlowPrices())
    println(cached.price("tea"))
}`,
      solution: `interface PriceService {
    fun price(item: String): Int
    fun currency(): String
}

class SlowPrices : PriceService {
    var calls = 0
    override fun price(item: String): Int {
        calls++
        return item.length * 10
    }
    override fun currency() = "INR"
}

class CachedPrices(private val inner: PriceService) : PriceService by inner {
    private val cache = mutableMapOf<String, Int>()
    override fun price(item: String): Int = cache.getOrPut(item) { inner.price(item) }
    val cacheSize: Int get() = cache.size
}

fun main() {
    val slow = SlowPrices()
    val cached = CachedPrices(slow)
    println(cached.price("tea"))
    println(cached.price("tea"))
    println("\${slow.calls} call, \${cached.currency()}")
}`,
      hints: [
        'Write `: PriceService by inner` after the constructor, and delete the `currency()` override: the compiler forwards it.',
        'A map remembers answers: `cache.getOrPut(item) { inner.price(item) }` asks `inner` only when the item is not there yet.'
      ],
      checks: [
        { label: 'Asking twice for one item asks `inner` once', code: 'val slow = SlowPrices()\nval cached = CachedPrices(slow)\neq(cached.price("tea"), 30)\neq(cached.price("tea"), 30)\neq(slow.calls, 1)' },
        { label: 'Each different item is asked for once', code: 'val slow = SlowPrices()\nval cached = CachedPrices(slow)\ncached.price("tea")\ncached.price("coffee")\ncached.price("tea")\neq(cached.price("coffee"), 60)\neq(slow.calls, 2)' },
        { label: '`currency()` comes from `inner`', code: 'eq(CachedPrices(SlowPrices()).currency(), "INR")' },
        { label: '`PriceService` is implemented `by inner`, and `CachedPrices` does not write `currency()`', code: 'ok(uses("""PriceService\\s+by\\s+inner\\b"""), "implement PriceService by delegation: class CachedPrices(...) : PriceService by inner")\nok(!Regex("""fun\\s+currency""").containsMatchIn(code.substringAfter("class CachedPrices")), "let delegation forward currency(); override only price")' },
        { label: '`cacheSize` counts the remembered prices', code: 'val cached = CachedPrices(SlowPrices())\neq(cached.cacheSize, 0)\ncached.price("a")\ncached.price("bb")\ncached.price("a")\neq(cached.cacheSize, 2)' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'kt-property-delegates', track: 'types', title: 'Property delegates',
    summary: 'val x by lazy { … } computes on first use; Delegates.observable and vetoable react to changes; a map can hold properties; and getValue and setValue let you write your own.',
    keywords: ['by lazy', 'lazy', 'delegated property', 'property delegate', 'Delegates', 'observable', 'vetoable', 'notNull', 'getValue', 'setValue', 'ReadWriteProperty', 'LazyThreadSafetyMode', 'map delegation'],
    docs: 'https://kotlinlang.org/docs/delegated-properties.html',
    body: [
      '## by lazy: computed once, on first use',
      '`val content by lazy { … }` runs the block the first time `content` is read, keeps the result, and gives the kept value on every later read:',
      kt(`class Report(val name: String) {
    val content: String by lazy {
        println("building $name")
        "the $name report"
    }
}

fun main() {
    val r = Report("sales")
    println("created")
    println(r.content)
    println(r.content)
}`),
      out(`created
building sales
the sales report
the sales report`),
      '`by` hands the property\'s getter (and setter, for a `var`) to an object, the *delegate*. `lazy { }` returns a `Lazy<T>` delegate. Use it for values that are expensive and maybe never needed, and for values that cannot be computed when the object is built.',
      '## Thread safety',
      'By default `lazy` is synchronized: if several threads read the property at once, the block still runs exactly once and every thread sees the same value. `lazy(LazyThreadSafetyMode.PUBLICATION)` lets several threads compute it and keeps the first result; `LazyThreadSafetyMode.NONE` skips the locking, for values only one thread ever touches.',
      kt(`import kotlin.concurrent.thread

val shared: Int by lazy {
    println("computed once")
    42
}

fun main() {
    val threads = List(4) { thread { shared } }
    threads.forEach { it.join() }
    println(shared)
}`),
      out(`computed once
42`),
      '## observable and vetoable',
      'For a `var`: `Delegates.observable(initial) { property, old, new -> … }` runs after each change; `Delegates.vetoable(initial) { property, old, new -> … }` runs before, and keeps the old value when it returns false.',
      kt(`import kotlin.properties.Delegates

class Thermostat {
    var target: Int by Delegates.observable(20) { _, old, new ->
        println("target $old -> $new")
    }
    var limit: Int by Delegates.vetoable(25) { _, _, new -> new in 10..30 }
}

fun main() {
    val t = Thermostat()
    t.target = 22
    t.target = 18
    t.limit = 40
    println(t.limit)
    t.limit = 28
    println(t.limit)
}`),
      out(`target 20 -> 22
target 22 -> 18
25
28`),
      '`_` stands for a parameter you do not use. `Delegates.notNull<Int>()` is a third: a non-null `var` with no first value, which throws if read before it is set (for a type `lateinit` cannot take, such as `Int`).',
      '## A map as the store',
      'A `Map` with the properties\' names as keys is a delegate too. Handy for data read from JSON or a config file:',
      kt(`class User(map: Map<String, Any?>) {
    val name: String by map
    val age: Int by map
}

fun main() {
    val u = User(mapOf("name" to "Asha", "age" to 30))
    println("\${u.name} is \${u.age}")
}`),
      out('Asha is 30'),
      '## Writing your own delegate',
      'A delegate is any object with an `operator fun getValue` (and `setValue`, for a `var`). Both receive the object the property belongs to and a description of the property itself (`property.name`):',
      kt(`import kotlin.reflect.KProperty

class Trimmed {
    private var value = ""

    operator fun getValue(thisRef: Any?, property: KProperty<*>): String = value

    operator fun setValue(thisRef: Any?, property: KProperty<*>, newValue: String) {
        value = newValue.trim()
    }
}

class Form {
    var email: String by Trimmed()
    var name: String by Trimmed()
}

fun main() {
    val f = Form()
    f.email = "  asha@example.com  "
    f.name = " Asha "
    println("[\${f.email}] [\${f.name}]")
}`),
      out('[asha@example.com] [Asha]'),
      'The standard library\'s `ReadWriteProperty<T, V>` interface has the same two functions, if you prefer implementing an interface to writing `operator`s.'
    ].join('\n\n'),
    java: [
      java(`private volatile Config config;            // lazy, thread-safe: double-checked locking
Config config() {
    Config c = config;
    if (c == null) {
        synchronized (this) {
            c = config;
            if (c == null) config = c = load();
        }
    }
    return c;
}

private final PropertyChangeSupport changes = new PropertyChangeSupport(this);
void setTarget(int t) { int old = target; target = t; changes.firePropertyChange("target", old, t); }`),
      'Java has no delegated properties, so each of these is written by hand, field by field: lazy initialisation as double-checked locking (or a holder class), change listeners with `PropertyChangeSupport`. In Kotlin each is one `by`: `val config by lazy { load() }`.'
    ].join('\n\n'),
    example: {
      code: `import kotlin.properties.Delegates

class Page(val url: String) {
    val html: String by lazy {
        println("downloading $url")
        "<html>$url</html>"
    }
    var visits: Int by Delegates.observable(0) { _, old, new -> println("visits $old -> $new") }
}

fun main() {
    val p = Page("example.com")
    p.visits++
    p.visits++
    println(p.html.length)
    println(p.html.length)
}`,
      note: 'The page is "downloaded" once, at the first `p.html`. Remove `by lazy` (write `val html: String get() = …` instead) and run: it downloads on every read.'
    },
    challenge: {
      title: 'Settings with delegates',
      task: 'Finish `Settings`, using a delegate for each property:\n\n1. `values`: the result of `loader()`, computed **once**, the first time it is read (`by lazy`).\n2. `theme`: a `var`, `"light"` at first, that adds `"<old> -> <new>"` to `history` on every change (`Delegates.observable`).\n3. `fontSize`: a `var`, 14 at first, that refuses (keeps its old value for) anything outside 8..32 (`Delegates.vetoable`).',
      starter: `import kotlin.properties.Delegates

class Settings(private val loader: () -> Map<String, String>) {
    val history = mutableListOf<String>()

    val values: Map<String, String> get() = TODO("by lazy: call loader() once, the first time")
    var theme: String = "light"          // add "old -> new" to history on every change
    var fontSize: Int = 14               // refuse values outside 8..32
}

fun main() {
    val s = Settings { mapOf("lang" to "en") }
    s.theme = "dark"
    println(s.history)
}`,
      solution: `import kotlin.properties.Delegates

class Settings(private val loader: () -> Map<String, String>) {
    val history = mutableListOf<String>()

    val values: Map<String, String> by lazy { loader() }
    var theme: String by Delegates.observable("light") { _, old, new -> history.add("$old -> $new") }
    var fontSize: Int by Delegates.vetoable(14) { _, _, new -> new in 8..32 }
}

fun main() {
    val s = Settings { mapOf("lang" to "en") }
    s.theme = "dark"
    s.fontSize = 40
    println(s.history)
    println(s.fontSize)
    println(s.values)
}`,
      hints: [
        '`val values: Map<String, String> by lazy { loader() }`.',
        '`var theme: String by Delegates.observable("light") { _, old, new -> … }`: the block runs after each change.',
        '`Delegates.vetoable(14) { _, _, new -> new in 8..32 }`: return true to accept the new value.'
      ],
      checks: [
        { label: '`values` calls `loader()` once, and not before it is read', code: 'var loads = 0\nval s = Settings { loads++; mapOf("lang" to "en") }\neq(loads, 0)\neq(s.values["lang"], "en")\neq(s.values["lang"], "en")\neq(loads, 1)' },
        { label: '`values` is `by lazy`', code: 'ok(uses("""by\\s+lazy\\b"""), "load values with by lazy { loader() }")' },
        { label: 'Each change of `theme` is recorded in `history`', code: 'val s = Settings { mapOf() }\neq(s.theme, "light")\ns.theme = "dark"\ns.theme = "blue"\neq(s.history, listOf("light -> dark", "dark -> blue"))\neq(s.theme, "blue")' },
        { label: '`fontSize` refuses values outside 8..32', code: 'val s = Settings { mapOf() }\ns.fontSize = 40\neq(s.fontSize, 14)\ns.fontSize = 20\neq(s.fontSize, 20)\ns.fontSize = 7\neq(s.fontSize, 20)\ns.fontSize = 32\neq(s.fontSize, 32)' },
        { label: '`theme` and `fontSize` use `Delegates.observable` and `Delegates.vetoable`', code: 'ok(uses("""Delegates\\.observable""") && uses("""Delegates\\.vetoable"""), "use Delegates.observable for theme and Delegates.vetoable for fontSize")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 6 */
  L.push({
    id: 'kt-operators', track: 'types', title: 'Operators and destructuring',
    summary: 'operator fun plus, times, get, set, contains, invoke and compareTo let your types use +, *, [], in, () and <; componentN functions let val (a, b) = x take them apart.',
    keywords: ['operator', 'operator overloading', 'plus', 'minus', 'times', 'get', 'set', 'invoke', 'contains', 'compareTo', 'plusAssign', 'destructuring', 'componentN', 'component1', 'convention'],
    docs: 'https://kotlinlang.org/docs/operator-overloading.html',
    body: [
      '## Operator functions',
      'An operator is a call to a function with a fixed name: `a + b` is `a.plus(b)`. Mark such a function `operator`, and your type can use the operator:',
      kt(`data class Money(val amount: Long, val currency: String) {
    operator fun plus(other: Money): Money {
        require(currency == other.currency) { "cannot add $currency and \${other.currency}" }
        return Money(amount + other.amount, currency)
    }
    operator fun times(n: Int) = Money(amount * n, currency)
    operator fun unaryMinus() = Money(-amount, currency)
    operator fun compareTo(other: Money): Int = amount.compareTo(other.amount)
}

fun main() {
    val a = Money(500, "INR")
    val b = Money(250, "INR")
    println(a + b)
    println(b * 3)
    println(-a)
    println(a > b)
}`),
      out(`Money(amount=750, currency=INR)
Money(amount=750, currency=INR)
Money(amount=-500, currency=INR)
true`),
      '| You write | Kotlin calls |\n|---|---|\n| `a + b`, `a - b`, `a * b`, `a / b`, `a % b` | `a.plus(b)`, `minus`, `times`, `div`, `rem` |\n| `-a`, `!a`, `a++` | `a.unaryMinus()`, `not()`, `inc()` |\n| `a[i]`, `a[i] = v` | `a.get(i)`, `a.set(i, v)` |\n| `a in b` | `b.contains(a)` |\n| `a()` | `a.invoke()` |\n| `a += b` | `a.plusAssign(b)`, or `a = a + b` |\n| `a < b`, `a >= b` | `a.compareTo(b) < 0`, `>= 0` |\n| `a..b` | `a.rangeTo(b)` |\n| `a == b` | `a.equals(b)` |',
      'The set is fixed: you cannot invent new operators, only give these meaning. Give them the meaning a reader expects (`+` adds), or a reader will be surprised.',
      '## Indexing and in',
      'A `get` and a `set` may take several indexes:',
      kt(`class Grid(val width: Int, val height: Int) {
    private val cells = IntArray(width * height)
    operator fun get(x: Int, y: Int): Int = cells[y * width + x]
    operator fun set(x: Int, y: Int, value: Int) {
        cells[y * width + x] = value
    }
    operator fun contains(point: Pair<Int, Int>): Boolean =
        point.first in 0 until width && point.second in 0 until height
}

fun main() {
    val g = Grid(3, 2)
    g[1, 1] = 5
    println(g[1, 1])
    println(Pair(2, 1) in g)
    println(Pair(3, 0) in g)
}`),
      out(`5
true
false`),
      '## invoke: an object you call like a function',
      kt(`class Greeter(private val greeting: String) {
    operator fun invoke(name: String) = "$greeting, $name!"
}

fun main() {
    val hello = Greeter("Hello")
    println(hello("Asha"))
}`),
      out('Hello, Asha!'),
      '## += on a list',
      'On a mutable list, `+=` adds in place (`plusAssign`). On a read-only list held in a `var`, it makes a new list (`plus`) and assigns that to the variable. (A mutable list held in a `var` could take either; kotlinc 2.4.20 picks `plusAssign`, in place.)',
      kt(`fun main() {
    val list = mutableListOf(1)
    list += 2
    list += listOf(3, 4)
    var readOnly = listOf(1)
    readOnly += 2
    println(list)
    println(readOnly)
}`),
      out(`[1, 2, 3, 4]
[1, 2]`),
      '## Destructuring',
      '`val (name, age) = user` calls `user.component1()` and `user.component2()`. A data class has one `componentN` per constructor property, in order, and so do `Pair`, `Triple` and a map\'s entries:',
      kt(`data class User(val name: String, val age: Int)

fun minMax(xs: List<Int>): Pair<Int, Int> = Pair(xs.min(), xs.max())

fun main() {
    val (name, age) = User("Asha", 30)
    println("$name is $age")
    val (lo, hi) = minMax(listOf(4, 9, 1))
    println("$lo..$hi")
    for ((key, value) in mapOf("a" to 1, "b" to 2)) println("$key=$value")
    listOf(User("Ravi", 41)).forEach { (n, _) -> println(n) }
}`),
      out(`Asha is 30
1..9
a=1
b=2
Ravi`),
      '`_` skips a part you do not need. In a lambda, `{ (n, _) -> }` takes the one parameter apart; `{ n, _ -> }` would be two parameters. Destructuring goes **by position**, not by name: `val (age, name) = user` compiles if the types fit and silently swaps them. With two properties of the same type, take care.',
      '## Your own componentN',
      kt(`class Span(val start: Int, val end: Int) {
    operator fun component1() = start
    operator fun component2() = end
}

fun main() {
    val (s, e) = Span(3, 7)
    println(e - s)
}`),
      out('4')
    ].join('\n\n'),
    java: [
      java(`BigDecimal total = price.multiply(BigDecimal.valueOf(3)).add(tax);   // Kotlin: price * 3 + tax
String s = list.get(0);                                              // Kotlin: list[0]
map.put("a", 1);                                                     // Kotlin: map["a"] = 1
if (point instanceof Point(int x, int y)) { ... }                    // Java 21 record pattern`),
      'Java has no operator overloading, so `BigDecimal` arithmetic is a chain of method calls. Kotlin\'s standard library already defines `plus`, `times`, `compareTo` and the rest for `BigDecimal` and `BigInteger`, so `a * b + c` works on them. Java 21\'s record patterns take a record apart inside `instanceof` and `switch`; Kotlin\'s destructuring works in any `val`, `for` and lambda.'
    ].join('\n\n'),
    example: {
      code: `import java.math.BigDecimal

data class Point(val x: Int, val y: Int) {
    operator fun plus(o: Point) = Point(x + o.x, y + o.y)
    operator fun times(k: Int) = Point(x * k, y * k)
}

fun main() {
    val p = Point(1, 2) + Point(10, 20)
    println(p)
    println(p * 2)
    val (x, y) = p
    println("x=$x y=$y")
    val price = BigDecimal("19.99")
    println(price * BigDecimal(3) + BigDecimal("0.03"))
}`,
      note: 'The last line uses the standard library\'s operators for `java.math.BigDecimal`. Add `operator fun minus` to `Point` and try `p - Point(1, 1)`.'
    },
    challenge: {
      title: 'A vector type',
      task: 'Give `Vec` its operators, each an `operator fun` inside the class:\n\n- `a + b` and `a - b`, component by component;\n- `a * n`, scaling both components by the `Int` `n`;\n- `-a`, flipping both signs;\n- `a[0]` is `x`, `a[1]` is `y`, and any other index throws `IndexOutOfBoundsException`.\n\nThen write `length2(v)`, `x * x + y * y`, taking `v` apart with `val (x, y) = v`.',
      starter: `data class Vec(val x: Int, val y: Int) {
    // operator fun plus, minus, times(n: Int), unaryMinus and get(index: Int) go here
}

fun length2(v: Vec): Int = TODO("x * x + y * y, taking v apart with val (x, y) = v")

fun main() {
    println(Vec(1, 2))
}`,
      solution: `data class Vec(val x: Int, val y: Int) {
    operator fun plus(o: Vec) = Vec(x + o.x, y + o.y)
    operator fun minus(o: Vec) = Vec(x - o.x, y - o.y)
    operator fun times(n: Int) = Vec(x * n, y * n)
    operator fun unaryMinus() = Vec(-x, -y)
    operator fun get(index: Int): Int = when (index) {
        0 -> x
        1 -> y
        else -> throw IndexOutOfBoundsException("a Vec has indexes 0 and 1, not $index")
    }
}

fun length2(v: Vec): Int {
    val (x, y) = v
    return x * x + y * y
}

fun main() {
    val a = Vec(1, 2)
    val b = Vec(3, 4)
    println(a + b)
    println(b * 2)
    println(-a)
    println(b[1])
    println(length2(b))
}`,
      hints: [
        '`operator fun plus(o: Vec) = Vec(x + o.x, y + o.y)`; `-a` is `operator fun unaryMinus()`.',
        '`operator fun get(index: Int): Int = when (index) { 0 -> x; 1 -> y; else -> throw IndexOutOfBoundsException(…) }`.',
        'A data class already has `component1()` and `component2()`, so `val (x, y) = v` works.'
      ],
      checks: [
        { label: '`+` and `-` work component by component', code: 'eq(Vec(1, 2) + Vec(3, 4), Vec(4, 6))\neq(Vec(5, 5) - Vec(1, 2), Vec(4, 3))' },
        { label: '`*` scales, and `-v` flips both signs', code: 'eq(Vec(2, -3) * 3, Vec(6, -9))\neq(-Vec(1, -2), Vec(-1, 2))' },
        { label: '`v[0]` is x, `v[1]` is y, `v[2]` throws `IndexOutOfBoundsException`', code: 'val v = Vec(7, 8)\neq(v[0], 7)\neq(v[1], 8)\nok(runCatching { v[2] }.exceptionOrNull() is IndexOutOfBoundsException, "v[2] should throw IndexOutOfBoundsException")' },
        { label: '`length2` takes the vector apart with `val (x, y) = v`', code: 'eq(length2(Vec(3, 4)), 25)\neq(length2(Vec(-2, 0)), 4)\nok(uses("""val\\s*\\(\\s*\\w+\\s*,\\s*\\w+\\s*\\)\\s*="""), "take the vector apart with val (x, y) = v")' },
        { label: '`+=` works on a `var` too (through `plus`)', code: 'var v = Vec(1, 1)\nv += Vec(1, 1)\nv += Vec(1, 1)\neq(v, Vec(3, 3))' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 7 */
  L.push({
    id: 'kt-type-aliases', track: 'types', title: 'Type aliases, const val and platform types',
    summary: 'typealias gives a long type a short name (not a new type), const val is a compile-time constant, and platform types (String!) are values from Java whose nullability Kotlin does not know.',
    keywords: ['typealias', 'type alias', 'const', 'const val', 'compile-time constant', 'platform type', 'String!', 'nullability annotations', '@Nullable', '@NotNull', 'JSpecify', 'getProperty', 'getenv'],
    docs: 'https://kotlinlang.org/docs/type-aliases.html',
    body: [
      '## typealias: a short name for a type',
      kt(`typealias UserId = Int
typealias Handler = (String) -> Unit
typealias Matrix = List<List<Int>>

fun lookup(id: UserId): String = "user $id"

fun main() {
    val log: Handler = { println("log: $it") }
    log(lookup(7))
    val m: Matrix = listOf(listOf(1, 2), listOf(3, 4))
    println(m.flatten().sum())
    val plain: Int = 5
    println(lookup(plain))
}`),
      out(`log: user 7
10
user 5`),
      'An alias is only another name: the compiler replaces `UserId` with `Int` everywhere, so the last line passes a plain `Int` where a `UserId` is asked for. That makes aliases good for long function types and nested generics, and no help at all for keeping a user id apart from an order id. For that, use a value class ([[lesson:kt-value-inner]]), which is a real new type that costs nothing at run time.',
      '## const val: a compile-time constant',
      kt(`const val MAX_USERS = 100
val startedOk = System.nanoTime() > 0

object Limits {
    const val TIMEOUT_MS = 5_000L
}

fun main() {
    println(MAX_USERS)
    println(Limits.TIMEOUT_MS)
    println(startedOk)
}`),
      out(`100
5000
true`),
      '`const val` is for values known when compiling: a number, a `Char`, a `Boolean` or a `String`, at the top level or in an `object` (or companion). The compiler copies the value into every place that uses it, as Java does with `static final` constants, and allows it where only constants may go, such as an annotation\'s argument (`@Deprecated(REASON)`). A plain `val` is computed when the program runs: `startedOk` could not be `const`. The [[lesson:kt-variables]] lesson has the basics.',
      '## Platform types: values from Java',
      'Java does not say whether a method can return null. Kotlin cannot know, so a value from Java gets a *platform type*, which compiler messages write as `String!`: `val n: Int = System.getProperty("a")` is refused with *Initializer type mismatch: expected \'Int\', actual \'String!\'*. You may treat a `String!` as `String` or as `String?`; the choice is yours, and a wrong choice fails at run time, on that line:',
      kt(`fun main() {
    val home: String? = System.getProperty("no.such.property")
    println(home ?: "not set")
    val sep = System.getProperty("line.separator")
    println(sep.length)
    try {
        val missing: String = System.getProperty("no.such.property")
        println(missing.length)
    } catch (e: NullPointerException) {
        println("NullPointerException: \${e.message}")
    }
}`),
      out(`not set
1
NullPointerException: getProperty(...) must not be null`),
      'Declaring `missing` as `String` made Kotlin check the value at once, as it arrived from Java: so the exception names the call it came from, instead of happening somewhere later. `sep` was left as a platform type, which works while it is not null. **The rule: at the boundary with Java, declare the type you expect**, `String?` when null is possible, so the compiler checks every use after it.',
      '## When Java says what it returns',
      'Java code annotated with nullability annotations (`@Nullable` and `@NotNull` from JetBrains, AndroidX or JSR-305, and JSpecify\'s `@NullMarked`) gives Kotlin real types instead of platform types: a `@Nullable String` arrives as `String?`, and the compiler makes you handle the null. Spring Framework 7 annotates its API with JSpecify for exactly this reason. The JDK itself is not annotated, so `System.getProperty` stays a platform type.'
    ].join('\n\n'),
    java: [
      java(`// Java has no typealias: a long type is written out every time
Map<String, List<Function<String, Integer>>> handlers = new HashMap<>();

public static final int MAX_USERS = 100;    // Kotlin: const val MAX_USERS = 100

String home = System.getProperty("user.home");   // may be null; Java does not say
int n = home.length();                           // a NullPointerException, maybe, one day`),
      'In Java every reference may be null and nothing says which: the NullPointerException happens wherever the null is first used. Kotlin keeps that uncertainty only at the edge, in platform types, and gives you one place to resolve it: the type you declare when the value arrives.'
    ].join('\n\n'),
    example: {
      code: `typealias Inventory = MutableMap<String, Int>
const val LOW_STOCK = 3

fun lowItems(inv: Inventory): List<String> = inv.filter { it.value <= LOW_STOCK }.keys.sorted()

fun main() {
    val inv: Inventory = mutableMapOf("pens" to 10, "ink" to 2, "paper" to 3)
    println(lowItems(inv))
    val user: String? = System.getenv("SURELY_NOT_SET_42")
    println(user ?: "no such variable")
}`,
      note: 'Change `val user: String?` to `val user: String` and run: Kotlin checks the value from Java at once, on that line.'
    },
    challenge: {
      title: 'Names for types, and values from Java',
      task: 'Five small pieces:\n\n1. `typealias Score = Int` and `typealias Scores = Map<String, Score>`.\n2. `const val PASS_MARK = 40` at the top level.\n3. `passed(scores: Scores)`: the names that scored `PASS_MARK` or more, sorted.\n4. `envOrDefault(name, default)`: the environment variable `name`, or `default` when it is not set. As given it trusts `System.getenv`, a platform type, never to be null: fix that.\n5. `propertyLength(name)`: the length of the system property `name`, or 0 when it is not set.',
      starter: `// typealias Score and Scores, and const val PASS_MARK, go here

fun passed(scores: Map<String, Int>): List<String> = TODO("the names scoring PASS_MARK or more, sorted")

fun envOrDefault(name: String, default: String): String {
    val value: String = System.getenv(name)      // a platform type: is it really never null?
    return value
}

fun propertyLength(name: String): Int = TODO("the length of System.getProperty(name), or 0 when it is not set")

fun main() {
    println(envOrDefault("HOME_OF_NOTHING", "none"))
}`,
      solution: `typealias Score = Int
typealias Scores = Map<String, Score>

const val PASS_MARK = 40

fun passed(scores: Scores): List<String> = scores.filter { it.value >= PASS_MARK }.keys.sorted()

fun envOrDefault(name: String, default: String): String {
    val value: String? = System.getenv(name)
    return value ?: default
}

fun propertyLength(name: String): Int = System.getProperty(name)?.length ?: 0

fun main() {
    println(passed(mapOf("Asha" to 72, "Ravi" to 35, "Li" to 40)))
    println(envOrDefault("HOME_OF_NOTHING", "none"))
    println(propertyLength("line.separator"))
}`,
      hints: [
        '`typealias Scores = Map<String, Score>` uses the first alias; the function can then take `scores: Scores`.',
        '`System.getenv(name)` returns null for a variable that is not set: declare `val value: String?` and finish with `?: default`.',
        '`System.getProperty(name)?.length ?: 0`.'
      ],
      checks: [
        { label: '`passed`: the names at or above the pass mark, sorted', code: 'eq(passed(mapOf("Asha" to 72, "Ravi" to 35, "Li" to 40)), listOf("Asha", "Li"))\neq(passed(mapOf()), listOf<String>())' },
        { label: '`PASS_MARK` is a `const val` of 40', code: 'eq(PASS_MARK, 40)\nok(uses("""\\bconst\\s+val\\s+PASS_MARK\\b"""), "declare it with const val at the top level")' },
        { label: '`Score` and `Scores` are type aliases, and `passed` takes `Scores`', code: 'ok(uses("""typealias\\s+Score\\s*=\\s*Int\\b"""), "typealias Score = Int")\nok(uses("""typealias\\s+Scores\\s*=\\s*Map\\s*<\\s*String\\s*,\\s*Score\\s*>"""), "typealias Scores = Map<String, Score>")\nval s: Scores = mapOf("a" to 41)\neq(passed(s), listOf("a"))' },
        { label: '`envOrDefault` gives the default for a variable that is not set', code: 'eq(envOrDefault("SURELY_NOT_SET_42", "none"), "none")\neq(envOrDefault("ALSO_NOT_SET_43", ""), "")' },
        { label: '`propertyLength`: 0 for a property that is not set', code: 'eq(propertyLength("no.such.property.here"), 0)\neq(propertyLength("line.separator"), 1)' }
      ]
    }
  });
})(window.KLT);
