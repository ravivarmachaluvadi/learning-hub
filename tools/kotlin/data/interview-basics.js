/*
 * data/interview-basics.js - interview questions on the Basics, and two on types that every Kotlin
 * interview asks early (== versus ===; Any, Unit and Nothing). Those two belong to the Types track: they
 * arrived early, in batch 1, and since batch 3 link the Types lessons that teach them.
 *
 * Question shape: {id, track, weight: 1-3 (how often interviews ask it, ★ to ★★★), q,
 *   short (the answer to give in 30 seconds), answer (the full answer, Markdown), followups: [..],
 *   related: ['lesson:<id>', 'q:<id>', 'term:<id>'], docs (kotlinlang.org), keywords}
 * Written for this tool (there is no Kotlin notes file to import). Every ```kotlin block runs in
 * tests/test_content.py, and an ```output block after one is its exact output. Facts that depend on the
 * Kotlin version were checked on kotlinc 2.4.20 and against kotlinlang.org's "What's new" pages.
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function norun(code) { return '```kotlin-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];

  Q.push({
    id: 'why-kotlin', track: 'basics', weight: 3,
    q: 'What is Kotlin, and why would a team choose it over Java?',
    keywords: ['why kotlin', 'kotlin vs java', 'advantages', 'jetbrains', 'android', 'interop', 'benefits'],
    short: 'A statically typed language from JetBrains that compiles to JVM bytecode (and to JavaScript, Wasm and native code). Teams pick it for **null safety in the type system**, **much less boilerplate** (data classes, properties, type inference, default arguments), **coroutines** for asynchronous code, and **full Java interop**: Kotlin and Java call each other in the same project, so a team can adopt it one file at a time.',
    answer: [
      '**What it is.** A statically typed language created by JetBrains; 1.0 was released in 2016. On the JVM it compiles to ordinary bytecode, so it runs wherever Java runs and uses every Java library. Google made it the preferred language for Android in 2019, and Spring supports it fully.',
      '**Why teams choose it:**',
      '- **Null safety.** A `String` cannot hold null; a `String?` can, and the compiler makes you handle it. Most NullPointerExceptions become compile errors.\n- **Less code.** A `data class` replaces a Java bean with `equals`, `hashCode`, `toString` and `copy`; properties replace getters and setters; types are inferred; default arguments replace overloads.\n- **Expressions.** `if`, `when` and `try` give values, and `when` checks that a sealed hierarchy is fully covered.\n- **Coroutines.** Asynchronous code written as straight-line code, with structured concurrency and cancellation built in.\n- **Interop.** Kotlin and Java classes live in one module and call each other, so code can move over one file at a time.',
      kt(`data class User(val name: String, val email: String?)

fun main() {
    val u = User("Asha", null)
    println(u)
    println(u.copy(email = "asha@example.com"))
    println(u.email?.length ?: 0)
}`),
      out(`User(name=Asha, email=null)
User(name=Asha, email=asha@example.com)
0`),
      'One line declares the class; Java needs a record or a bean with its methods. The last line handles the missing email without an `if`.',
      '**The costs, said plainly:** clean builds are slower than Java\'s, the team has a second language to learn, and some tools assume Java (annotation processors run through kapt or KSP). Java has also closed part of the gap with records, `var`, switch expressions, pattern matching and virtual threads. It still has no null safety in the type system, no extension functions and no coroutines.'
    ].join('\n\n'),
    followups: [
      'Kotlin or Java for a new Spring Boot service, and why?',
      'How would you bring Kotlin into an existing Java codebase?',
      'What does modern Java (21+) now have that used to be a reason to switch, and what does it still lack?'
    ],
    related: ['lesson:kt-first-program', 'lesson:kt-null-safety', 'q:null-safety'],
    docs: 'https://kotlinlang.org/docs/comparison-to-java.html'
  });

  Q.push({
    id: 'val-var-const', track: 'basics', weight: 3,
    q: 'What is the difference between val, var and const val?',
    keywords: ['val', 'var', 'const', 'const val', 'final', 'immutable', 'constant', 'read-only'],
    short: '`var` can be reassigned; `val` is assigned once, like Java\'s `final`. `const val` is a compile-time constant: a primitive or a `String` known when compiling, declared at the top level or in an `object`, and inlined into the code that uses it. `val` makes the *reference* read-only, not the object: a `val` can hold a mutable list.',
    answer: [
      '| | `var` | `val` | `const val` |\n|---|---|---|---|\n| Can be reassigned | yes | no | no |\n| Value known | at run time | at run time | at compile time |\n| Allowed types | any | any | primitives and `String` |\n| Where | anywhere | anywhere | top level, `object`, `companion object` |\n| In Java terms | a plain variable | `final` | a `static final` constant |',
      'A `val` property can even give a different value each time it is read, when it has a custom getter. So `val` means "no setter", not "constant":',
      kt(`import kotlin.random.Random

class Dice {
    val roll: Int
        get() = Random.nextInt(1, 7)
}

const val SIDES = 6

fun main() {
    val d = Dice()
    println(d.roll in 1..SIDES)
    val list = mutableListOf(1)
    list.add(2)
    println(list)
}`),
      out(`true
[1, 2]`),
      '`const val` cannot have a getter: its value is copied into the bytecode of every caller. That is also why changing a `const` in a library needs its callers to be recompiled, the same rule as Java\'s constants.'
    ].join('\n\n'),
    followups: [
      'Why can a `const val` not hold a `List` or an object of your own class?',
      'Is a `val` thread-safe? (Only as safe as the object it points to.)',
      'How does a top-level `val` compile, compared with a `const val`? (A private static field with a getter, against a constant inlined at each use.)'
    ],
    related: ['lesson:kt-variables'],
    docs: 'https://kotlinlang.org/docs/properties.html'
  });

  Q.push({
    id: 'null-safety', track: 'basics', weight: 3,
    q: 'How does Kotlin\'s null safety work? Explain ?, ?., ?: and !!',
    keywords: ['null safety', 'nullable', '?', '?.', 'safe call', '?:', 'elvis', '!!', 'not-null assertion', 'NPE', 'NullPointerException'],
    short: 'Nullability is part of the type: a `String` never holds null, a `String?` may, and the compiler will not call a method on a `String?` directly. You handle it with a check (after `if (s != null)`, `s` is smart-cast to `String`), a safe call `s?.length` (null when `s` is null), the Elvis operator `s?.length ?: 0` (a default), or `s!!` (assert not null; throws `NullPointerException` when wrong).',
    answer: [
      '| Operator | Meaning | When `s` is null |\n|---|---|---|\n| `String?` | a type that allows null | |\n| `s?.length` | safe call | the whole expression is `null` |\n| `a ?: b` | Elvis: `a`, or `b` when `a` is null | gives `b` |\n| `s!!` | not-null assertion | throws `NullPointerException` |\n| `s?.let { … }` | run the block only for a value | skips the block |\n| `x as? T` | safe cast | gives `null` instead of throwing |',
      kt(`fun initials(name: String?): String {
    if (name.isNullOrBlank()) return "?"
    return name.split(" ").joinToString("") { it.first().uppercase() }
}

fun main() {
    val nickname: String? = null
    println(nickname?.length)
    println(nickname?.length ?: 0)
    println(initials("ada lovelace"))
    println(initials(null))
}`),
      out(`null
0
AL
?`),
      'After `isNullOrBlank()` returns false, `name` is smart-cast to `String`: the function has a *contract* that tells the compiler so.',
      '**At run time** the types cost nothing: `String?` and `String` are both `java.lang.String`. But public functions check their non-null parameters on entry (`Intrinsics.checkNotNullParameter`), so a Java caller passing null fails at once, with the parameter\'s name, instead of somewhere deep inside.',
      'Values from Java have *platform types* (`String!`): Kotlin cannot know whether they are null, so it lets you treat them either way, and that is where most Kotlin NPEs come from ([[q:npe-in-kotlin]]).'
    ].join('\n\n'),
    followups: [
      'What is a platform type, and why does Kotlin have them?',
      'When is `!!` acceptable?',
      'What is the difference between `s?.let { … }` and `if (s != null) { … }`?',
      'What happens when Java code passes null to a Kotlin function whose parameter is a non-null `String`?'
    ],
    related: ['lesson:kt-null-safety', 'q:npe-in-kotlin', 'q:smart-casts'],
    docs: 'https://kotlinlang.org/docs/null-safety.html'
  });

  Q.push({
    id: 'npe-in-kotlin', track: 'basics', weight: 2,
    q: 'Can a NullPointerException still happen in Kotlin? When?',
    keywords: ['NullPointerException', 'NPE', 'platform type', 'lateinit', '!!', 'UninitializedPropertyAccessException', 'constructor', 'java interop'],
    short: 'Yes, in a few places: `!!` on a null; a platform type from Java used as non-null when Java returned null; a `lateinit` property read before it is set (`UninitializedPropertyAccessException`); a property read while its object is still being built, for example by an `open` function called from a superclass constructor; and Java code that puts nulls into a Kotlin collection or passes null to a Kotlin function.',
    answer: [
      '**`!!`, `lateinit`, and a platform type:**',
      kt(`class Account {
    lateinit var owner: String
}

fun main() {
    val s: String? = null
    println(runCatching { s!!.length }.exceptionOrNull()?.javaClass?.simpleName)
    val a = Account()
    println(runCatching { a.owner }.exceptionOrNull()?.javaClass?.simpleName)
    val r = runCatching {
        val v: String = System.getProperty("no.such.property")
        v.length
    }
    println(r.exceptionOrNull())
}`),
      out(`NullPointerException
UninitializedPropertyAccessException
java.lang.NullPointerException: getProperty(...) must not be null`),
      '`System.getProperty` is a Java method, so it returns a platform type, `String!`. Declaring `val v: String` promises it is not null; Kotlin inserts a check at that point, which fails with the message above. Declare `String?` and the compiler makes you handle the null instead.',
      '**A property read before the constructor sets it.** The superclass constructor runs first and calls an `open` function, which the subclass overrides to read its own property. That property has not been assigned yet, so a non-null `String` is null:',
      kt(`open class Base {
    init { describe() }
    open fun describe() {}
}

class Child : Base() {
    val name: String = "child"
    override fun describe() { println("name is $name") }
}

fun main() {
    Child()
}`),
      out('name is null'),
      'The fix is not to call `open` members from constructors or `init` blocks: the Java rule, with a nastier result in Kotlin, because the type said "never null".'
    ].join('\n\n'),
    followups: [
      'How do you check whether a `lateinit` property has been set? (`::owner.isInitialized`, inside the class.)',
      'How do nullability annotations on Java code change what Kotlin sees?',
      'Why does the example print `name is null` for a non-null property?'
    ],
    related: ['lesson:kt-null-safety', 'q:null-safety'],
    docs: 'https://kotlinlang.org/docs/null-safety.html'
  });

  Q.push({
    id: 'when-vs-switch', track: 'basics', weight: 3,
    q: 'How is when different from Java\'s switch?',
    keywords: ['when', 'switch', 'exhaustive', 'sealed', 'fall-through', 'pattern matching', 'is', 'guard'],
    short: '`when` is an expression (it gives a value), never falls through (no `break`), and a branch can match several values (`1, 2 ->`), a range (`in 1..9`), a type (`is String`, with a smart cast inside) or any condition (`when` with no subject). Used as an expression it must be exhaustive: over an enum or a sealed type the compiler checks that every case is covered, so adding a case breaks the build wherever it is not handled.',
    answer: [
      kt(`sealed interface Shape
data class Circle(val r: Double) : Shape
data class Square(val side: Double) : Shape

fun area(s: Shape): Double = when (s) {
    is Circle -> 3.0 * s.r * s.r
    is Square -> s.side * s.side
}

fun size(n: Int) = when (n) {
    0 -> "none"
    1, 2, 3 -> "a few"
    in 4..9 -> "several"
    else -> "many"
}

fun main() {
    println(area(Square(2.0)))
    println(size(2))
    println(size(7))
    val t = 25
    println(when {
        t < 10 -> "cold"
        t < 25 -> "mild"
        else -> "warm"
    })
}`),
      out(`4.0
a few
several
warm`),
      '`area` has no `else`: the compiler knows `Shape` has exactly two subtypes. Add a `Triangle` and `area` stops compiling until it handles it. Java gets this only from a `switch` over a sealed type, since Java 21.',
      '**Guards.** Since Kotlin 2.2 (stable; a preview in 2.1) a branch can add a condition with `if`:',
      kt(`sealed interface Order
data class Paid(val amount: Int) : Order
data object Cancelled : Order

fun label(o: Order) = when (o) {
    is Paid if o.amount > 1000 -> "big order"
    is Paid -> "order"
    Cancelled -> "cancelled"
}

fun main() {
    println(label(Paid(5000)))
    println(label(Paid(20)))
    println(label(Cancelled))
}`),
      out(`big order
order
cancelled`),
      'An `else` branch over a sealed type compiles, but hides new cases from you: the compiler can no longer tell you what you forgot.'
    ].join('\n\n'),
    followups: [
      'Why must `when` be exhaustive when it is used as an expression, and when is `else` a bad idea?',
      'How does `is` inside `when` give a smart cast?',
      'When would you use `when` with no subject instead of `if`/`else if`?'
    ],
    related: ['lesson:kt-conditions', 'q:smart-casts', 'q:if-expression'],
    docs: 'https://kotlinlang.org/docs/control-flow.html'
  });

  Q.push({
    id: 'if-expression', track: 'basics', weight: 2,
    q: 'Why has Kotlin no ternary operator?',
    keywords: ['ternary', '?:', 'if expression', 'conditional', 'expression'],
    short: 'Because `if` is an expression: `val max = if (a > b) a else b` does what `a > b ? a : b` does, and reads like every other `if`. `when` and `try` are expressions too. For the most common case, "this value, or a default when it is null", there is the Elvis operator: `name ?: "anonymous"`.',
    answer: [
      'One construct instead of two. Each branch can be a block, whose last expression is its value, which a ternary cannot do. Used as an expression, `if` must have an `else`, so there is always a value.',
      kt(`fun main() {
    val a = 3
    val b = 8
    val max = if (a > b) a else b
    val label = if (max > 5) {
        "big"
    } else {
        "small"
    }
    val name: String? = null
    println("$max $label \${name ?: "anonymous"}")
}`),
      out('8 big anonymous'),
      'The `?:` in Kotlin is not a ternary: it is the Elvis operator, `a ?: b`, "a, or b when a is null".'
    ].join('\n\n'),
    followups: [
      'What happens if you use `if` as an expression without an `else`?',
      'When would you choose `when` over `if` / `else if`?'
    ],
    related: ['lesson:kt-conditions', 'q:when-vs-switch'],
    docs: 'https://kotlinlang.org/docs/control-flow.html'
  });

  Q.push({
    id: 'smart-casts', track: 'basics', weight: 3,
    q: 'What is a smart cast, and when does it not work?',
    keywords: ['smart cast', 'is', 'as', 'as?', 'cast', 'instanceof', 'type check', 'K2'],
    short: 'After a check such as `if (x is String)` or `if (s != null)`, the compiler treats the value as the narrower type inside the branch, with no cast written. It does so only when it can prove the value cannot change between the check and the use: local `val`s, local `var`s not changed in between, and `val` properties with no custom getter in the same module. It refuses for `var` properties (other code could change them), `open` properties or ones with a custom getter, and properties from another module.',
    answer: [
      'The usual failure, a `var` property:',
      norun(`class Box(var content: Any?)

fun show(b: Box) {
    if (b.content is String) {
        println(b.content.length)
        // compile error: Smart cast to 'String' is impossible, because 'content' is a mutable
        // property that could be mutated concurrently.
    }
}`),
      'The fix is to copy it into a local `val`, which nothing else can change:',
      kt(`class Box(var content: Any?)

fun show(b: Box) {
    val c = b.content
    if (c is String) println(c.length) else println("not a string")
}

fun main() {
    show(Box("kotlin"))
    show(Box(42))
    val x: Any = 3
    if (x !is Int) return
    println(x + 1)
}`),
      out(`6
not a string
4`),
      'The last lines show a smart cast after an early `return`: past `if (x !is Int) return`, `x` must be an `Int`.',
      '**K2**, the compiler front end that is the default since Kotlin 2.0, smart-casts in more places. One example is a check stored in a local variable:',
      kt(`fun main() {
    val value: Any = "text"
    val isText = value is String
    if (isText) println(value.length)
}`),
      out('4'),
      '`as` casts and throws `ClassCastException` when wrong; `as?` gives null instead. With smart casts, you rarely write either.'
    ].join('\n\n'),
    followups: [
      'Why can a `var` property not be smart-cast, when a local `var` can?',
      'What is the difference between `as`, `as?` and a smart cast?',
      'How do contracts let `isNullOrEmpty()` smart-cast the string it was called on?'
    ],
    related: ['lesson:kt-null-safety', 'lesson:kt-conditions', 'q:null-safety'],
    docs: 'https://kotlinlang.org/docs/typecasts.html'
  });

  Q.push({
    id: 'string-templates', track: 'basics', weight: 1,
    q: 'What are string templates and raw strings?',
    keywords: ['string template', 'interpolation', '$', 'raw string', 'triple quote', 'trimIndent', 'trimMargin', 'multi-dollar'],
    short: '`"$name"` and `"${expr}"` put values into a string; they compile like `+` concatenation (on JVM 9 and later, to the same `invokedynamic` string concatenation `javac` uses). Raw strings, in triple quotes, span lines and treat `\\` as a plain character; `trimIndent()` and `trimMargin()` remove the indentation. They replace `String.format` and Java\'s text blocks in everyday code.',
    answer: [
      kt(`fun main() {
    val user = "ravi"
    val count = 3
    println("Hi $user, you have $count new \${if (count == 1) "message" else "messages"}")
    val json = """
        {"user": "$user", "count": $count}
    """.trimIndent()
    println(json)
    val price = 5
    println("Total: \\$$price")
}`),
      out(`Hi ravi, you have 3 new messages
{"user": "ravi", "count": 3}
Total: $5`),
      'In a normal string `\\$` is a literal dollar sign. Raw strings have no escapes, so a `$` before a name used to need `${\'$\'}`. Since Kotlin 2.2, *multi-dollar* strings fix that: with `$$` in front, only `$$name` is a template, and a single `$` is plain text.',
      kt(`fun main() {
    val n = 3
    println($$"""{"price": "$5", "n": $$n}""")
}`),
      out('{"price": "$5", "n": 3}'),
      '`"%.2f".format(x)` is still the way to format numbers with a fixed number of decimals.'
    ].join('\n\n'),
    followups: [
      'How is a template compiled, and is it slower than a `StringBuilder`?',
      'How do you write a literal `$` in a raw string?',
      'When would you still use `"%.2f".format(x)`?'
    ],
    related: ['lesson:kt-strings'],
    docs: 'https://kotlinlang.org/docs/strings.html'
  });

  Q.push({
    id: 'default-named-args', track: 'basics', weight: 2,
    q: 'How do default and named arguments replace overloads? What do Java callers see?',
    keywords: ['default argument', 'named argument', 'overload', 'JvmOverloads', 'builder', 'parameters'],
    short: 'A parameter with a default (`fun connect(host: String, port: Int = 443)`) can be left out, and a named argument (`connect("db", port = 5432)`) can skip the defaults before it and makes a call self-describing. One function replaces a chain of overloads, and often a builder. Java has neither feature, so a Java caller sees only the full signature, unless the function is marked `@JvmOverloads`, which makes the compiler generate the overloads (dropping defaults from the end).',
    answer: [
      kt(`fun connect(host: String, port: Int = 443, secure: Boolean = true, timeoutMs: Int = 5_000): String =
    "\${if (secure) "https" else "http"}://$host:$port (timeout \${timeoutMs}ms)"

fun main() {
    println(connect("example.com"))
    println(connect("localhost", 8080, secure = false))
    println(connect(host = "db", timeoutMs = 100))
}`),
      out(`https://example.com:443 (timeout 5000ms)
http://localhost:8080 (timeout 5000ms)
https://db:443 (timeout 100ms)`),
      'A default is worked out at each call, and may use the parameters before it: `fun range(start: Int, end: Int = start + 10)`. Behind the scenes the compiler writes one extra static method, `connect$default`, which takes a bit mask saying which arguments were left out.',
      '`@JvmOverloads` on `connect` gives Java `connect(host)`, `connect(host, port)`, `connect(host, port, secure)` and the full one. Java still cannot skip a middle parameter or name an argument.',
      'Kotlin does not allow named arguments when calling a Java method: Java parameter names are not reliably in the bytecode.'
    ].join('\n\n'),
    followups: [
      'What does `@JvmOverloads` generate, and why only from the end?',
      'Can a default value refer to another parameter? To a property of the class?',
      'When is a builder still better than default arguments?'
    ],
    related: ['lesson:kt-functions'],
    docs: 'https://kotlinlang.org/docs/functions.html'
  });

  Q.push({
    id: 'checked-exceptions', track: 'basics', weight: 2,
    q: 'Why does Kotlin have no checked exceptions? What does a Java caller see?',
    keywords: ['checked exception', 'throws', 'Throws', 'IOException', 'exception', 'runCatching', 'Result', 'java interop'],
    short: 'Kotlin\'s designers judged that checked exceptions add ceremony without making large programs safer: in practice they get caught and ignored, wrapped, or added to every signature on the way up, and they do not work with lambdas. So no exception has to be caught or declared. For Java callers, `@Throws(IOException::class)` writes the `throws` clause into the bytecode, so Java can (and must) catch it.',
    answer: [
      'The typical evidence is code like `catch (IOException e) { }`, which hides failures, and interfaces like `Runnable` and `Function` that cannot throw checked exceptions, which forces wrapping inside streams and lambdas.',
      '**What Kotlin offers instead:** catch where you can act; return `null` for an expected "no answer" (`toIntOrNull()`); `runCatching` and `Result`; or a sealed type for results the caller must handle (`sealed interface LoadResult`).',
      kt(`import java.io.IOException

@Throws(IOException::class)
fun load(name: String): String {
    if (name.isEmpty()) throw IOException("no name")
    return "data of $name"
}

fun main() {
    println(load("users"))
    val r = runCatching { load("") }
    println(r.exceptionOrNull()?.message)
}`),
      out(`data of users
no name`),
      'Without `@Throws`, a Java caller cannot even write `catch (IOException e)` around `load(...)`: `javac` says the exception is never thrown in the `try` block. With it, Java sees `String load(String) throws IOException`.',
      'One trap: `runCatching` catches everything, including the `CancellationException` that coroutines use to cancel, which can stop a cancelled coroutine from stopping (the [[track:coroutines]] track).'
    ].join('\n\n'),
    followups: [
      'How would you model an expected failure, such as "user not found", without exceptions?',
      'Why is `runCatching` risky inside a coroutine?',
      'Does `@Throws` change anything for Kotlin callers? (No.)'
    ],
    related: ['lesson:kt-exceptions'],
    docs: 'https://kotlinlang.org/docs/exceptions.html'
  });

  Q.push({
    id: 'read-only-collections', track: 'basics', weight: 3,
    q: 'Is a List in Kotlin immutable? Explain read-only and mutable collections.',
    keywords: ['list', 'mutablelist', 'immutable', 'read-only', 'collections', 'covariant', 'out', 'listOf', 'unmodifiable'],
    short: 'No. `List` is a read-only *interface*: it has no `add` or `remove`, so code holding a `List` cannot change it. But the object behind it is usually a plain Java list, and code holding it as a `MutableList`, or Java code, which sees an ordinary `java.util.List`, can change it. For a guarantee, copy it (`toList()`) or use the `kotlinx.collections.immutable` library.',
    answer: [
      kt(`fun main() {
    val backing = mutableListOf("a", "b")
    val readOnly: List<String> = backing
    backing.add("c")
    println(readOnly)

    val copy = readOnly.toList()
    backing.add("d")
    println(copy)

    val fixed = listOf(1, 2)
    @Suppress("UNCHECKED_CAST")
    val forced = fixed as MutableList<Int>
    println(runCatching { forced.add(3) }.exceptionOrNull()?.javaClass?.simpleName)
}`),
      out(`[a, b, c]
[a, b, c]
UnsupportedOperationException`),
      'The read-only view saw the change. On the JVM, `List` and `MutableList` are both `java.util.List`, so the cast succeeds; `listOf(1, 2)` happens to be backed by `Arrays.asList`, which refuses `add` at run time.',
      '**Variance is the other reason for the split.** `List<out E>` is covariant: a `List<String>` can be passed where a `List<Any>` is expected, safely, because nothing can be added through it. `MutableList<E>` is invariant, like Java\'s `List`.',
      '| Interface | Can change it | Variance | Made by |\n|---|---|---|---|\n| `List<E>` | no | covariant (`out E`) | `listOf`, `emptyList`, `buildList` |\n| `MutableList<E>` | yes | invariant | `mutableListOf`, `arrayListOf` |\n| `Set<E>` / `MutableSet<E>` | no / yes | covariant / invariant | `setOf` / `mutableSetOf` |\n| `Map<K, V>` / `MutableMap<K, V>` | no / yes | `V` covariant / invariant | `mapOf` / `mutableMapOf` |'
    ].join('\n\n'),
    followups: [
      'Why is `List` covariant but `MutableList` not?',
      'A class exposes `val items: List<Item>` backed by a private `MutableList`. Is that safe? (A caller can cast it back; expose a copy if that matters.)',
      'What does a Java method see when you pass it a Kotlin `List`?'
    ],
    related: ['lesson:kt-collections'],
    docs: 'https://kotlinlang.org/docs/collections-overview.html'
  });

  Q.push({
    id: 'ranges', track: 'basics', weight: 1,
    q: 'What are ranges and progressions? Explain .., until, downTo and step.',
    keywords: ['range', 'progression', '..', 'until', '..<', 'downTo', 'step', 'in', 'IntRange'],
    short: '`1..10` is an `IntRange` from 1 to 10, both included; `1 until 10` and `1..<10` leave out the end; `10 downTo 1` counts down; `step 2` skips. A range with a step is an `IntProgression`. `x in 1..10` compiles to two comparisons, and `for (i in 1..n)` to a plain counting loop, so ranges cost nothing extra.',
    answer: [
      kt(`fun main() {
    val r = 1..10
    println(r.first)
    println(r.last)
    println(5 in r)
    println((1..10 step 3).toList())
    println((10 downTo 1 step 4).toList())
    println(('a'..'e').joinToString(""))
    println((1..<4).sum())
    println((5..1).isEmpty())
    println("kiwi" in "apple".."mango")
}`),
      out(`1
10
true
[1, 4, 7, 10]
[10, 6, 2]
abcde
6
true
true`),
      '`5..1` is empty, not a countdown: a common bug. Write `5 downTo 1`. Ranges exist for `Char` and `Long` too, and for any `Comparable` (`"apple".."mango"` works with `in`, though it cannot be iterated).',
      '`until` and `..<` mean the same; `..<` is the operator form, stable since Kotlin 1.9.'
    ].join('\n\n'),
    followups: [
      'How does `for (i in 0 until n)` compile? Is a range object made?',
      'Why is `10..1` empty?',
      'How would you loop over a list\'s indexes? (`list.indices`, or `withIndex()`.)'
    ],
    related: ['lesson:kt-loops'],
    docs: 'https://kotlinlang.org/docs/ranges.html'
  });

  Q.push({
    id: 'equality', track: 'types', weight: 3,
    q: 'What is the difference between == and === in Kotlin?',
    keywords: ['==', '===', 'equals', 'equality', 'identity', 'reference equality', 'structural equality', 'data class'],
    short: '`==` is structural equality: it calls `equals()`, null-safely (`a == b` is `a?.equals(b) ?: (b === null)`). `===` is referential equality: the same object, what Java\'s `==` does. So in Kotlin `s1 == s2` compares the text, as a Java developer means it. Data classes generate an `equals` that compares their properties; `===` on numbers such as `Int` is deprecated, because boxing makes it unreliable.',
    answer: [
      kt(`data class Point(val x: Int, val y: Int)

fun main() {
    val a = Point(1, 2)
    val b = Point(1, 2)
    println(a == b)
    println(a === b)
    val s1 = "kot"
    val s2 = "Kotlin".substring(0, 3).lowercase()
    println(s1 == s2)
    println(s1 === s2)
    val n: String? = null
    println(n == null)
}`),
      out(`true
false
true
false
true`),
      'The compiler warns on `===` between two `Int`s: *Identity equality for arguments of types \'Int\' and \'Int\' is deprecated*. Boxed numbers (in a `List<Int>`, or an `Int?`) may or may not be the same object, as with Java\'s `Integer` cache.',
      '**Floating point** is the subtle case. When both sides are statically a `Double`, `==` follows IEEE 754: `-0.0 == 0.0` is true and `NaN == NaN` is false. When they are typed `Any`, it is `equals()`, which says the opposite for both:',
      kt(`fun main() {
    val a = -0.0
    val b = 0.0
    println(a == b)
    val x: Any = -0.0
    val y: Any = 0.0
    println(x == y)
    println(Double.NaN == Double.NaN)
}`),
      out(`true
false
false`)
    ].join('\n\n'),
    followups: [
      'What must you override together with `equals`, and why? (`hashCode`, or hash-based collections break.)',
      'Which properties take part in a data class\'s `equals`? (Only those in the primary constructor.)',
      'When would you ever use `===`?'
    ],
    related: ['lesson:kt-equality', 'lesson:kt-strings', 'q:read-only-collections', 'q:data-classes'],
    docs: 'https://kotlinlang.org/docs/equality.html'
  });

  Q.push({
    id: 'any-unit-nothing', track: 'types', weight: 3,
    q: 'What are Any, Unit and Nothing?',
    keywords: ['any', 'unit', 'nothing', 'void', 'object', 'type hierarchy', 'bottom type', 'top type'],
    short: '`Any` is the root of every non-null type, Java\'s `Object` (`Any?` is the root of all types). `Unit` is the type of "no useful value", Kotlin\'s `void`, but a real singleton object, so it works as a type argument (`() -> Unit`). `Nothing` has no values: it is the type of an expression that never completes, such as `throw` or `TODO()`, and it is a subtype of every type, which is why `val x: String = s ?: throw …` compiles.',
    answer: [
      kt(`fun fail(message: String): Nothing = throw IllegalStateException(message)

fun log(message: String) {
    println("log: $message")
}

fun main() {
    val result: Unit = log("hi")
    println(result)
    val name: String? = "Asha"
    val sure: String = name ?: fail("no name")
    println(sure)
    val anything: Any = 42
    println(anything is Int)
    val empty = emptyList<Nothing>()
    val strings: List<String> = empty
    println(strings.size)
}`),
      out(`log: hi
kotlin.Unit
Asha
true
0`),
      '`println(result)` prints `kotlin.Unit`: `Unit` is an object. A function returning `Unit` still compiles to a Java `void` method; `Unit` appears only where a value is needed, such as for a generic `T`.',
      '`Nothing` lets the compiler reason about code: after a call that returns `Nothing`, nothing runs, and code there is flagged as unreachable. `Nothing?` has exactly one value, `null`: the type of `val x = null` is `Nothing?`. And `emptyList<Nothing>()` fits every `List<T>`, because `List` is covariant and `Nothing` is a subtype of everything.'
    ].join('\n\n'),
    followups: [
      'Why is `Nothing` a subtype of every type?',
      'How does `Unit` differ from Java\'s `void` in generics? (`Callable<Void>` must `return null`; a `() -> Unit` lambda needs nothing.)',
      'What is the type of `null`?'
    ],
    related: ['lesson:kt-any-unit-nothing', 'lesson:kt-functions', 'lesson:kt-exceptions'],
    docs: 'https://kotlinlang.org/docs/exceptions.html'
  });
})(window.KLT);
