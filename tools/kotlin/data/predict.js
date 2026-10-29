/*
 * Predict the output (batch 5): short programs, each built around one trap a Java developer falls into
 * (views/predict.js, and the mock interview's predictions).
 *
 * Shape: {id, topic, code, output, guess, trap, why, learn}
 *   topic   one of numbers, strings, null, classes, collections, lambdas, extensions, control, exceptions,
 *           coroutines, flow (views/predict.js names them)
 *   code    a whole program of 5 to 22 lines
 *   output  exactly what it prints (tests/test_content.py runs it twice and requires it)
 *   guess   the answer most Java developers give: shown, with `trap` (why it is tempting), after a wrong
 *           answer; the tests require that the program does not print it
 *   why     what really happens (Markdown); learn: where it is taught
 * Programs whose order depends on coroutines use runBlocking's one thread, where the code fixes the order.
 * Code is written in template literals: a Kotlin ${…} is written \${…}, and a Kotlin "\n" is "\\n".
 */
(function (U) {
  'use strict';
  var P = U.data.predictions = U.data.predictions || [];

  P.push(
    {
      id: 'boxed-identity', topic: 'numbers',
      code: `fun main() {
    val a: Int? = 127
    val b: Int? = 127
    val c: Int? = 1000
    val d: Int? = 1000
    println(a === b)
    println(c === d)
    println(c == d)
}
`,
      output: 'true\nfalse\ntrue',
      guess: 'true\ntrue\ntrue',
      trap: 'The same number looks like the same thing, so `===` seems safe.',
      why: '`Int?` is a boxed `java.lang.Integer`. Boxing goes through `Integer.valueOf`, which hands out shared objects only for -128 to 127: two boxed 127s are one object, two boxed 1000s are two. `===` compares objects, `==` compares values. Never use `===` on numbers; the compiler warns about it.',
      learn: ['lesson:kt-equality', 'q:equality']
    },
    {
      id: 'int-division', topic: 'numbers',
      code: `fun main() {
    val total = 7
    val people = 2
    val share: Double = (total / people).toDouble()
    println(share)
    println(total / people.toDouble())
}
`,
      output: '3.0\n3.5',
      guess: '3.5\n3.5',
      trap: 'The result is declared `Double`, so the division looks like a `Double` division.',
      why: '`total / people` divides two `Int`s, so it is whole-number division: 3. Converting the 3 afterwards gives 3.0. Convert *before* dividing, as on the second line, and the division is a `Double` one: 3.5.',
      learn: ['lesson:kt-numbers']
    },
    {
      id: 'int-overflow', topic: 'numbers',
      code: `fun main() {
    val big = Int.MAX_VALUE
    println(big + 1)
    val wide: Long = big + 1L
    println(wide)
    val tooLate: Long = (big + 1).toLong()
    println(tooLate)
}
`,
      output: '-2147483648\n2147483648\n-2147483648',
      guess: '2147483648\n2147483648\n2147483648',
      trap: 'Kotlin is careful about types, so it seems it would refuse to overflow, or widen to `Long` for you.',
      why: '`Int` arithmetic wraps round exactly as in Java: `Int.MAX_VALUE + 1` is `Int.MIN_VALUE`. Adding `1L` makes the sum a `Long` before it is computed. Converting the result with `toLong()` is too late: it has already wrapped.',
      learn: ['lesson:kt-numbers']
    },
    {
      id: 'double-sum', topic: 'numbers',
      code: `fun main() {
    val sum = 0.1 + 0.2
    println(sum == 0.3)
    println(sum)
    println("%.2f".format(sum))
}
`,
      output: 'false\n0.30000000000000004\n0.30',
      guess: 'true\n0.3\n0.30',
      trap: '0.1 + 0.2 is 0.3 on paper.',
      why: '`Double` is binary floating point, as in Java: 0.1 and 0.2 have no exact binary form, and their sum is 0.30000000000000004. Formatting rounds it for display; comparing it with `==` does not. Compare doubles with a tolerance, or use `BigDecimal` for money.',
      learn: ['lesson:kt-numbers']
    },
    {
      id: 'char-arithmetic', topic: 'numbers',
      code: `fun main() {
    val c = 'a'
    println(c + 1)
    println("a" + 1)
    println(c.code + 1)
    println('z' - 'a')
}
`,
      output: 'b\na1\n98\n25',
      guess: '98\na1\n98\n25',
      trap: 'In Java, `\'a\' + 1` is the `int` 98.',
      why: 'In Kotlin a `Char` is not a number. `Char + Int` is defined to give the next `Char`, so `\'a\' + 1` is `\'b\'`. For the number, ask for `c.code`. `Char - Char` gives the `Int` distance between them.',
      learn: ['lesson:kt-numbers']
    },
    {
      id: 'template-dot', topic: 'strings',
      code: `fun main() {
    val name = "Kotlin"
    println("$name.length")
    println("\${name.length}")
    println("$name's")
}
`,
      output: 'Kotlin.length\n6\nKotlin\'s',
      guess: '6\n6\nKotlin\'s',
      trap: '`$name.length` reads like the length of `name`.',
      why: 'A `$` without braces takes only a name: `$name`, then the text `.length` as it is. For an expression (a property, a call, a sum), write braces: `${name.length}`.',
      learn: ['lesson:kt-strings', 'q:string-templates']
    },
    {
      id: 'string-equality', topic: 'strings',
      code: `fun main() {
    val a = "kotlin"
    val b = StringBuilder("kot").append("lin").toString()
    println(a == b)
    println(a === b)
}
`,
      output: 'true\nfalse',
      guess: 'false\nfalse',
      trap: 'In Java, `==` on two strings built in different ways is usually `false`.',
      why: 'Kotlin\'s `==` calls `equals`, so it compares the text: `true`. `===` is the reference comparison Java\'s `==` does, and the string built by the `StringBuilder` is a different object: `false`.',
      learn: ['lesson:kt-equality', 'q:equality']
    },
    {
      id: 'raw-string-lines', topic: 'strings',
      code: `fun main() {
    val text = """
        first
        second
    """
    println(text.lines().size)
    println(text.trimIndent().lines().size)
}
`,
      output: '4\n2',
      guess: '2\n2',
      trap: 'Only two lines of text are written between the quotes.',
      why: 'A raw string keeps everything between the `"""`: the line break after the opening quotes, and the indent before the closing ones, so it holds four lines, the first empty and the last only spaces. `trimIndent()` removes the first and last blank lines and the common indent, leaving two.',
      learn: ['lesson:kt-strings']
    },
    {
      id: 'elvis-after-let', topic: 'null',
      code: `fun log(msg: String): String? {
    println("log: $msg")
    return null
}

fun main() {
    val name: String? = "Asha"
    name?.let { log(it) } ?: run { println("no name") }
}
`,
      output: 'log: Asha\nno name',
      guess: 'log: Asha',
      trap: '`?.let { } ?: run { }` reads like if/else: one or the other.',
      why: '`let` returns whatever its block returns. Here that is `log(it)`, which is `null`, so the whole `?.let { … }` is `null`, and `?:` runs its right side too. When you mean if/else, write `if (name != null) … else …`.',
      learn: ['lesson:kt-scope-functions', 'lesson:kt-null-safety']
    },
    {
      id: 'null-plus-string', topic: 'null',
      code: `fun main() {
    val s: String? = null
    println(s + "!")
    println(s?.length)
    println(s.isNullOrEmpty())
    println("\${s?.uppercase()}")
}
`,
      output: 'null!\nnull\ntrue\nnull',
      guess: '!\nnull\ntrue\nnull',
      trap: 'A `null` should either vanish from the text or stop the program.',
      why: 'Kotlin defines `+` on a `String?`, and it turns a `null` into the text `null`, as Java\'s string concatenation does. A safe call on `null` gives `null`, and a template prints it as `null`. `isNullOrEmpty()` is an extension on `String?`, so it can be called on `null`.',
      learn: ['lesson:kt-null-safety']
    },
    {
      id: 'elvis-precedence', topic: 'null',
      code: `fun main() {
    val x: Int? = 5
    val y = x ?: 0 + 10
    val z = (x ?: 0) + 10
    println(y)
    println(z)
}
`,
      output: '5\n15',
      guess: '15\n15',
      trap: '`?:` looks like it binds as tightly as the `?.` next to it.',
      why: '`?:` has a lower precedence than `+`, so `x ?: 0 + 10` is `x ?: (0 + 10)`: `x` is 5, so `y` is 5. Brackets make the intent clear: `(x ?: 0) + 10`.',
      learn: ['lesson:kt-null-safety']
    },
    {
      id: 'init-order', topic: 'classes',
      code: `class Demo(val name: String) {
    val greeting = "Hello, $name"

    init {
        println("init 1: $greeting")
    }

    val length = name.length

    init {
        println("init 2: $length")
    }

    constructor() : this("Guest") {
        println("secondary")
    }
}

fun main() {
    Demo()
}
`,
      output: 'init 1: Hello, Guest\ninit 2: 5\nsecondary',
      guess: 'secondary\ninit 1: Hello, Guest\ninit 2: 5',
      trap: 'The secondary constructor is the one called, so its body looks like it runs first.',
      why: 'A secondary constructor must call the primary one first (`: this("Guest")`). The primary one runs the property initialisers and `init` blocks, top to bottom, in the order they are written. Only then does the secondary constructor\'s own body run.',
      learn: ['lesson:kt-constructors', 'q:constructors-init']
    },
    {
      id: 'open-call-in-constructor', topic: 'classes',
      code: `open class Base {
    init {
        describe()
    }

    open fun describe() = println("Base")
}

class Child : Base() {
    private val label = "child"

    override fun describe() = println("Child: $label")
}

fun main() {
    Child()
}
`,
      output: 'Child: null',
      guess: 'Child: child',
      trap: '`label` is set where it is declared, so it looks ready whenever `describe()` runs.',
      why: 'The parent\'s constructor runs before the child\'s properties are set. `Base`\'s `init` calls `describe()`, which is the child\'s override, and the child\'s `label` is still `null`, even though its type says `String`. Never call an `open` function from a constructor or `init`.',
      learn: ['lesson:kt-inheritance']
    },
    {
      id: 'data-class-body-property', topic: 'classes',
      code: `data class User(val name: String) {
    var visits = 0
}

fun main() {
    val a = User("Li")
    val b = User("Li")
    a.visits = 5
    println(a == b)
    println(a)
    println(a.copy().visits)
}
`,
      output: 'true\nUser(name=Li)\n0',
      guess: 'false\nUser(name=Li, visits=5)\n5',
      trap: 'A data class seems to compare and print every property it has.',
      why: 'A data class generates `equals`, `hashCode`, `toString` and `copy` from the properties of its **primary constructor** only. `visits` is declared in the body, so it is not compared, not printed, and `copy()` starts it again from 0.',
      learn: ['lesson:kt-data-classes', 'q:data-classes']
    },
    {
      id: 'copy-is-shallow', topic: 'classes',
      code: `data class Team(val name: String, val members: MutableList<String>)

fun main() {
    val a = Team("core", mutableListOf("Li"))
    val b = a.copy(name = "fork")
    b.members += "Asha"
    println(a.members)
    println(a == b)
}
`,
      output: '[Li, Asha]\nfalse',
      guess: '[Li]\nfalse',
      trap: '`copy` makes a new object, so changing the copy should leave the original alone.',
      why: '`copy` is shallow: the new `Team` holds the same `MutableList` object as the old one. Adding to `b.members` adds to `a.members`. The names differ, so the two teams are still not equal. Read-only lists (`List`) avoid the surprise.',
      learn: ['lesson:kt-data-classes', 'q:data-classes']
    },
    {
      id: 'object-init-on-use', topic: 'classes',
      code: `object Config {
    init {
        println("Config loaded")
    }

    val port = 8080
}

fun main() {
    println("start")
    println(Config.port)
    println(Config.port)
}
`,
      output: 'start\nConfig loaded\n8080\n8080',
      guess: 'Config loaded\nstart\n8080\n8080',
      trap: 'An `object` is a singleton that seems to exist from the start of the program.',
      why: 'An `object` is created the first time it is used, as Java loads a class with a static field on first use. Its `init` runs then, once, after `start`. (A `const val` would be copied into the caller and not even load it.)',
      learn: ['lesson:kt-objects', 'q:object-companion']
    },
    {
      id: 'enum-ordinal', topic: 'classes',
      code: `enum class Level(val weight: Int) { LOW(1), HIGH(10), MEDIUM(5) }

fun main() {
    println(Level.entries.sortedBy { it.weight }.map { it.name })
    println(Level.MEDIUM.ordinal)
    println(Level.entries.maxBy { it.ordinal })
    println(Level.valueOf("HIGH").weight)
}
`,
      output: '[LOW, MEDIUM, HIGH]\n2\nMEDIUM\n10',
      guess: '[LOW, MEDIUM, HIGH]\n1\nHIGH\n10',
      trap: 'MEDIUM is the middle level, so it seems to be ordinal 1.',
      why: '`ordinal` is the position in the declaration, not anything about the meaning: `MEDIUM` is declared third, so it is 2, and it is the last. Sort by your own property (`weight`) when the order matters.',
      learn: ['lesson:kt-enums']
    },
    {
      id: 'lazy-once', topic: 'classes',
      code: `val config: String by lazy {
    println("loading")
    "ready"
}

fun main() {
    println("start")
    println(config)
    println(config)
}
`,
      output: 'start\nloading\nready\nready',
      guess: 'start\nloading\nready\nloading\nready',
      trap: 'The block after `lazy` looks like a getter, which would run on every read.',
      why: '`by lazy { }` runs the block on the first read and keeps its result: later reads return the stored `"ready"` without running it again. A getter, `val config: String get() = …`, would run every time.',
      learn: ['lesson:kt-property-delegates', 'q:lateinit-vs-lazy']
    },
    {
      id: 'read-only-view', topic: 'collections',
      code: `fun main() {
    val backing = mutableListOf(1, 2)
    val view: List<Int> = backing
    backing += 3
    println(view)
    println(view.size)
}
`,
      output: '[1, 2, 3]\n3',
      guess: '[1, 2]\n2',
      trap: '`List` is read-only, so it looks as if it can never change.',
      why: '`List` is a read-only *view*, not an immutable list: `view` and `backing` are the same object, seen through two types. You cannot change it through `view`, but anyone holding it as a `MutableList` can, and `view` sees it.',
      learn: ['lesson:kt-collections', 'q:read-only-collections']
    },
    {
      id: 'sequence-order', topic: 'collections',
      code: `fun main() {
    val result = listOf(1, 2, 3, 4)
        .asSequence()
        .map { println("map $it"); it * 10 }
        .filter { println("filter $it"); it > 15 }
        .first()
    println(result)
}
`,
      output: 'map 1\nfilter 10\nmap 2\nfilter 20\n20',
      guess: 'map 1\nmap 2\nmap 3\nmap 4\nfilter 10\nfilter 20\nfilter 30\nfilter 40\n20',
      trap: 'On a list, each step runs over every element before the next step starts.',
      why: 'A `Sequence` works element by element: each one goes through `map` and then `filter` before the next one starts, and nothing runs until a terminal step (`first()`) asks. `first()` stops at the first match, so 3 and 4 are never touched. Without `asSequence()`, the list version prints all four maps first.',
      learn: ['lesson:kt-sequences', 'q:sequences']
    },
    {
      id: 'duplicate-keys', topic: 'collections',
      code: `fun main() {
    val m = mapOf("a" to 1, "b" to 2, "a" to 3)
    println(m)
    println(m.size)
    println(listOf("hi", "yo", "hey").associateBy { it.length })
}
`,
      output: '{a=3, b=2}\n2\n{2=yo, 3=hey}',
      guess: '{a=1, b=2}\n2\n{2=hi, 3=hey}',
      trap: 'The first value for a key seems to win, or the duplicate to be refused (Java\'s `Map.of` throws).',
      why: '`mapOf` puts the pairs in one after another, so a later value for the same key replaces the earlier one, though the key keeps its first position. `associateBy` does the same: `"yo"` replaces `"hi"` for length 2.',
      learn: ['lesson:kt-collections', 'ref:associateby']
    },
    {
      id: 'list-minus', topic: 'collections',
      code: `fun main() {
    val xs = listOf(1, 2, 1, 3)
    println(xs - 1)
    println(xs - listOf(1))
    println(xs.toSet() - 1)
}
`,
      output: '[2, 1, 3]\n[2, 3]\n[2, 3]',
      guess: '[2, 3]\n[2, 3]\n[2, 3]',
      trap: 'Subtracting 1 from a list seems to take every 1 out.',
      why: '`list - element` removes only the **first** occurrence, like `remove`. `list - collection` removes every element that is in the collection. On a set there is only one of each, so the question does not arise.',
      learn: ['lesson:kt-collections', 'ref:minus']
    },
    {
      id: 'zip-shortest', topic: 'collections',
      code: `fun main() {
    val names = listOf("Li", "Asha", "Bo")
    val ages = listOf(30, 25)
    println(names.zip(ages))
    println(names.zip(ages).toMap()["Bo"])
}
`,
      output: '[(Li, 30), (Asha, 25)]\nnull',
      guess: '[(Li, 30), (Asha, 25), (Bo, null)]\nnull',
      trap: 'Every name seems to get a pair, with `null` where there is no age.',
      why: '`zip` stops at the end of the shorter list: `Bo` has no partner, so there is no pair for him at all. The map has no key `"Bo"`, which is why the lookup is `null`.',
      learn: ['lesson:kt-collection-ops', 'ref:zip']
    },
    {
      id: 'return-in-foreach', topic: 'lambdas',
      code: `fun main() {
    listOf(1, 2, 3).forEach {
        if (it == 2) return
        println(it)
    }
    println("done")
}
`,
      output: '1',
      guess: '1\n3\ndone',
      trap: 'In Java\'s `forEach(x -> …)`, `return` only ends that one call of the lambda.',
      why: '`forEach` is `inline`, so a plain `return` inside its lambda returns from the function around it: `main`. Nothing after it runs, `"done"` included. To skip one element, write `return@forEach`.',
      learn: ['lesson:kt-inline', 'q:lambda-returns']
    },
    {
      id: 'return-at-label', topic: 'lambdas',
      code: `fun main() {
    listOf(1, 2, 3).forEach {
        if (it == 2) return@forEach
        println(it)
    }
    println("done")
}
`,
      output: '1\n3\ndone',
      guess: '1\ndone',
      trap: '`return@forEach` sounds like it leaves the `forEach`, as `break` would.',
      why: '`return@forEach` returns from the lambda, for this element only, like `continue`. The loop goes on with 3. To stop the whole loop early, use a `for` loop with `break`, or a function such as `takeWhile` or `first`.',
      learn: ['lesson:kt-inline', 'q:lambda-returns']
    },
    {
      id: 'scope-results', topic: 'lambdas',
      code: `fun main() {
    val a = StringBuilder("x").apply { append("y") }
    val b = StringBuilder("x").let { it.append("y"); it.length }
    val c = "kotlin".also { it.uppercase() }
    val d = "kotlin".run { uppercase() }
    println(a)
    println(b)
    println(c)
    println(d)
}
`,
      output: 'xy\n2\nkotlin\nKOTLIN',
      guess: 'xy\nxy\nKOTLIN\nKOTLIN',
      trap: 'All four scope functions seem to give back the object you called them on.',
      why: '`apply` and `also` return the object itself; `let` and `run` return the block\'s last value. So `b` is the length, 2. And `also { it.uppercase() }` makes an upper-case copy and throws it away: `c` is still the original `"kotlin"`.',
      learn: ['lesson:kt-scope-functions', 'q:scope-functions']
    },
    {
      id: 'closure-changes-var', topic: 'lambdas',
      code: `fun main() {
    var counter = 0
    val inc = { counter++ }
    inc()
    inc()
    val snapshot = counter
    inc()
    println(snapshot)
    println(counter)
}
`,
      output: '2\n3',
      guess: '0\n0',
      trap: 'In Java a lambda may only read local variables that are effectively final.',
      why: 'A Kotlin lambda can change a `var` it captures: the compiler moves `counter` into a small object both share. So each `inc()` adds 1 to the real `counter`. `snapshot` was read after two calls.',
      learn: ['lesson:kt-lambdas']
    },
    {
      id: 'extension-static', topic: 'extensions',
      code: `open class Animal
class Dog : Animal()

fun Animal.name() = "animal"
fun Dog.name() = "dog"

fun main() {
    val pet: Animal = Dog()
    println(pet.name())
    println(Dog().name())
}
`,
      output: 'animal\ndog',
      guess: 'dog\ndog',
      trap: 'An extension looks like a method, and methods are chosen by the object\'s real class.',
      why: 'Extensions are static functions: the compiler picks one from the **declared** type of the receiver. `pet` is declared `Animal`, so `Animal.name()` is called, whatever object it holds. Overriding needs a real member function.',
      learn: ['lesson:kt-extensions', 'q:extension-functions']
    },
    {
      id: 'member-wins', topic: 'extensions',
      code: `class Greeter {
    fun greet() = "member"
}

fun Greeter.greet() = "extension"
fun Greeter.greet(name: String) = "extension, $name"

fun main() {
    println(Greeter().greet())
    println(Greeter().greet("Li"))
}
`,
      output: 'member\nextension, Li',
      guess: 'extension\nextension, Li',
      trap: 'The extension is declared later and closer, so it seems to win.',
      why: 'When a member and an extension fit the same call, the member always wins: an extension can never replace what a class already has (the compiler warns that the extension is shadowed). An extension with different parameters is a different function, so `greet("Li")` finds it.',
      learn: ['lesson:kt-extensions']
    },
    {
      id: 'nullable-receiver', topic: 'extensions',
      code: `fun String?.describe() = if (this == null) "nothing" else "text of $length"

fun main() {
    val a: String? = null
    println(a.describe())
    println("hey".describe())
    println(a?.describe())
}
`,
      output: 'nothing\ntext of 3\nnull',
      guess: 'nothing\ntext of 3\nnothing',
      trap: 'All three calls reach the same function.',
      why: 'An extension on `String?` can be called on `null`, and handles it itself: `"nothing"`. But `a?.describe()` is a safe call: `a` is `null`, so the function is never called, and the result is `null`.',
      learn: ['lesson:kt-extensions', 'lesson:kt-null-safety']
    },
    {
      id: 'ranges-direction', topic: 'control',
      code: `fun main() {
    for (i in 3..1) print(i)
    println("|")
    for (i in 3 downTo 1) print(i)
    println("|")
    for (i in 1..10 step 4) print(i)
    println("|")
}
`,
      output: '|\n321|\n159|',
      guess: '321|\n321|\n159|',
      trap: '`3..1` reads as "from 3 to 1".',
      why: '`..` only counts up. `3..1` is an empty range, so its loop never runs. To count down, write `3 downTo 1`. `step` keeps the start and stops at the last value not past the end: 1, 5, 9.',
      learn: ['lesson:kt-loops', 'q:ranges']
    },
    {
      id: 'when-first-match', topic: 'control',
      code: `fun size(n: Int) = when {
    n > 0 -> "positive"
    n > 10 -> "big"
    n == 0 -> "zero"
    else -> "negative"
}

fun main() {
    println(size(50))
    println(size(0))
    println(size(-5))
}
`,
      output: 'positive\nzero\nnegative',
      guess: 'big\nzero\nnegative',
      trap: 'The most specific branch, `n > 10`, looks like the one that fits 50.',
      why: '`when` takes the **first** branch that is true, from the top, and never falls through. 50 is positive, so `"big"` can never be reached: put the narrower test first.',
      learn: ['lesson:kt-conditions', 'q:when-vs-switch']
    },
    {
      id: 'labelled-continue', topic: 'control',
      code: `fun main() {
    outer@ for (i in 1..3) {
        for (j in 1..3) {
            if (j == 2) continue@outer
            if (i == 3) break@outer
            println("$i$j")
        }
    }
    println("end")
}
`,
      output: '11\n21\nend',
      guess: '11\n13\n21\n23\nend',
      trap: '`continue` seems to skip only the inner loop\'s current step.',
      why: '`continue@outer` jumps to the next step of the **outer** loop, so `j` never reaches 3. When `i` is 3, `break@outer` leaves both loops before anything prints.',
      learn: ['lesson:kt-loops']
    },
    {
      id: 'finally-order', topic: 'exceptions',
      code: `fun pick(): Int {
    try {
        return 1
    } finally {
        println("finally runs")
    }
}

fun main() {
    println(pick())
}
`,
      output: 'finally runs\n1',
      guess: '1\nfinally runs',
      trap: '`return 1` seems to hand 1 back at once, with `finally` coming after.',
      why: '`finally` runs before the function actually returns: the value 1 is kept, `finally` prints, and only then does `pick()` give 1 to `println`.',
      learn: ['lesson:kt-exceptions']
    },
    {
      id: 'try-value', topic: 'exceptions',
      code: `fun main() {
    val n = try {
        "12a".toInt()
    } catch (e: NumberFormatException) {
        -1
    } finally {
        println("checked")
    }
    println(n)
}
`,
      output: 'checked\n-1',
      guess: '-1',
      trap: 'The `finally` block is the last thing written, so it seems either to be the value or to come after it.',
      why: '`try` is an expression: its value is the last expression of the `try` block, or of the `catch` that ran: here -1. `finally` always runs, but its value is ignored. It runs before `n` is printed.',
      learn: ['lesson:kt-exceptions', 'q:checked-exceptions']
    },
    {
      id: 'require-or-check', topic: 'exceptions',
      code: `fun withdraw(balance: Int, amount: Int): Int {
    require(amount > 0) { "amount must be positive" }
    check(amount <= balance) { "not enough money" }
    return balance - amount
}

fun main() {
    println(runCatching { withdraw(10, 5) }.getOrNull())
    println(runCatching { withdraw(10, 50) }.exceptionOrNull()?.javaClass?.simpleName)
    println(runCatching { withdraw(10, -1) }.exceptionOrNull()?.message)
}
`,
      output: '5\nIllegalStateException\namount must be positive',
      guess: '5\nIllegalArgumentException\namount must be positive',
      trap: '`require` and `check` look like two names for the same thing.',
      why: '`require` checks an *argument* and throws `IllegalArgumentException`; `check` checks *state* and throws `IllegalStateException`. Each takes a lambda that builds the message only when it fails.',
      learn: ['lesson:kt-exceptions']
    },
    {
      id: 'launch-order', topic: 'coroutines',
      code: `import kotlinx.coroutines.*

fun main() = runBlocking {
    launch { println("A") }
    println("B")
    launch { println("C") }
    println("D")
}
`,
      output: 'B\nD\nA\nC',
      guess: 'A\nB\nC\nD',
      trap: '`launch { … }` comes first in the code, so its block seems to run first.',
      why: '`launch` only schedules the coroutine. `runBlocking` runs everything on one thread, and the code that called `launch` keeps that thread until it suspends or ends. So B and D print first; then the two coroutines run, in the order they were launched.',
      learn: ['lesson:kt-launch-async', 'lesson:kt-coroutines-threads']
    },
    {
      id: 'scope-waits', topic: 'coroutines',
      code: `import kotlinx.coroutines.*

suspend fun work() = coroutineScope {
    launch {
        delay(100)
        println("child done")
    }
    println("work returns")
}

fun main() = runBlocking {
    work()
    println("after work")
}
`,
      output: 'work returns\nchild done\nafter work',
      guess: 'work returns\nafter work\nchild done',
      trap: 'The last line of `work()` has run, so `work()` looks finished.',
      why: '`coroutineScope` does not return until every coroutine started inside it has finished. Its block ends at once, but `work()` waits the 100 ms for the child. That is structured concurrency: no work outlives the function that started it.',
      learn: ['lesson:kt-structured-concurrency', 'q:structured-concurrency']
    },
    {
      id: 'await-catch-scope', topic: 'coroutines',
      code: `import kotlinx.coroutines.*

fun main() {
    runBlocking {
        try {
            coroutineScope {
                val failing = async<Int> { error("boom") }
                try {
                    failing.await()
                } catch (e: IllegalStateException) {
                    println("caught at await")
                }
                println("after await")
            }
        } catch (e: IllegalStateException) {
            println("scope failed: \${e.message}")
        }
    }
}
`,
      output: 'caught at await\nafter await\nscope failed: boom',
      guess: 'caught at await\nafter await',
      trap: 'The exception was caught at `await()`, so it looks handled.',
      why: 'A failing child cancels its parent scope as soon as it fails, whether or not anyone catches the exception at `await()`. The catch runs, but `coroutineScope` still fails with the child\'s exception when it ends. To keep a failing child from failing its siblings and parent, use `supervisorScope`.',
      learn: ['lesson:kt-coroutine-exceptions', 'q:coroutine-exceptions']
    },
    {
      id: 'cold-flow-twice', topic: 'flow',
      code: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun main() = runBlocking {
    val numbers = flow {
        println("start")
        emit(1)
        emit(2)
    }
    println(numbers.first())
    println(numbers.toList())
}
`,
      output: 'start\n1\nstart\n[1, 2]',
      guess: 'start\n1\n[1, 2]',
      trap: 'A `Flow` looks like a list of values, produced once.',
      why: 'A `flow { }` is cold: its block runs from the start for **each** collector. `first()` runs it until the first value and cancels it; `toList()` runs it again, from `start`.',
      learn: ['lesson:kt-flow-basics', 'q:flow-cold-hot']
    },
    {
      id: 'stateflow-equal-value', topic: 'flow',
      code: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun main() = runBlocking {
    val state = MutableStateFlow(0)
    val job = launch {
        state.collect { println("saw $it") }
    }
    yield()
    state.value = 1
    yield()
    state.value = 1
    yield()
    state.value = 2
    yield()
    job.cancel()
}
`,
      output: 'saw 0\nsaw 1\nsaw 2',
      guess: 'saw 0\nsaw 1\nsaw 1\nsaw 2',
      trap: 'Every assignment to `value` looks like an event the collector receives.',
      why: 'A `StateFlow` holds a state, not events: setting a value equal to the current one changes nothing, so collectors see nothing new. A new collector first gets the current value (0). For events that may repeat, use a `SharedFlow`.',
      learn: ['lesson:kt-stateflow-sharedflow', 'q:stateflow-vs-sharedflow']
    },
    {
      id: 'catch-upstream', topic: 'flow',
      code: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun main() = runBlocking {
    flowOf(1, 2, 3)
        .map { check(it != 2) { "bad $it" }; it }
        .catch { println("caught: \${it.message}") }
        .collect { println("got $it") }
}
`,
      output: 'got 1\ncaught: bad 2',
      guess: 'got 1\ncaught: bad 2\ngot 3',
      trap: '`catch` looks like a `try` around one element: the bad one is skipped and the rest go on.',
      why: 'An exception ends the flow. `catch` sees what failed upstream of it and can emit a replacement or log, but the values after the failure are never produced: 3 never comes. To skip bad values, handle them inside `map` (or `mapNotNull`) instead.',
      learn: ['lesson:kt-flow-errors', 'q:flow-exceptions']
    }
  );
})(window.KLT);
