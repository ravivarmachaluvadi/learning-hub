/*
 * data/lessons-basics.js - Track 1, Basics: ten lessons for a Java developer's first Kotlin.
 *
 * Lesson shape: {id, track, title, summary, keywords, docs (kotlinlang.org), body (Markdown),
 *   java (the "Coming from Java" box, Markdown), example: {code, stdin?, note?},
 *   challenge: {title, task, starter, solution, stdin?, hints: [..], checks: [{label, code}]}, needs?: ['coroutines']}
 *
 * In the Markdown, a ```kotlin block is a whole program: tests/test_content.py runs it, and when an
 * ```output block follows it, the program must print exactly that. A fragment is ```kotlin-norun.
 * A check's code is Kotlin, run after main, with output, lines, source, error, eq(), ok(), uses(),
 * mentions(), templated(), captured { } and runWith() in scope (runner/Harness.kt, class Ctx).
 * Code is written in template literals: a Kotlin ${…} is written \${…}, and a Kotlin "\n" is "\\n".
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function norun(code) { return '```kotlin-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function java(code) { return '```java\n' + code + '\n```'; }
  function text(t) { return '```text\n' + t + '\n```'; }
  var L = U.data.lessons = U.data.lessons || [];

  /* ---------------------------------------------------------------- 1 */
  L.push({
    id: 'kt-first-program', track: 'basics', title: 'Your first Kotlin program',
    summary: 'A program starts at fun main(), at the top level of a file: no class needed. println, print, comments, and what the compiler makes of it.',
    keywords: ['main', 'println', 'print', 'hello world', 'first program', 'semicolon', 'comment', 'MainKt'],
    docs: 'https://kotlinlang.org/docs/basic-syntax.html',
    body: [
      'Every Kotlin program starts at a function called `main`. It sits at the top level of the file, outside any class:',
      kt(`fun main() {
    println("Hello, Kotlin!")
    print("print stays on the line, ")
    println("println ends it.")
}`),
      out(`Hello, Kotlin!
print stays on the line, println ends it.`),
      '`fun` declares a function. `println` prints its argument and then a line break; `print` prints without one. A line needs no semicolon: the end of the line ends the statement. (A `;` is allowed, and only needed to put two statements on one line.)',
      '## No class needed',
      'Java makes you write a class to hold `main`. Kotlin does not: functions, like variables, can live at the top level of a file. The compiler still makes a class, because the JVM only runs classes. For a file called `main.kt` it is called `MainKt`, and your `main` becomes its `public static void main(String[] args)`. You can see the name in this tool when a program throws: `at MainKt.main(main.kt:3)`.',
      '## Command-line arguments',
      'When the program needs its command-line arguments, `main` takes them as an `Array<String>`:',
      kt(`fun main(args: Array<String>) {
    println("I got \${args.size} arguments")
}`),
      out('I got 0 arguments'),
      'This tool runs programs without arguments, so `args` is empty here. `Array<String>` is how Kotlin writes Java\'s `String[]`: generic types in angle brackets, as in Java. (`${args.size}` puts a value into the text; the [[lesson:kt-strings]] lesson explains.)',
      '## Comments',
      '`//` comments out the rest of a line and `/* … */` a block, as in Java. Unlike Java\'s, block comments nest, so you can comment out code that already holds a block comment:',
      kt(`fun main() {
    // a line comment
    /* a block comment /* with one inside */ still a comment */
    println("Only this runs")
}`),
      out('Only this runs')
    ].join('\n\n'),
    java: [
      java(`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Kotlin!");
    }
}`),
      'The same program in Kotlin is three lines: `fun main() { println("Hello, Kotlin!") }`. `System.out.println` works in Kotlin too, because Kotlin calls Java libraries directly, but `println` is the Kotlin way. There is no `public` to write: in Kotlin everything is public unless you say otherwise, and `fun main()` needs no `static`, no class and no `String[] args`.'
    ].join('\n\n'),
    example: {
      code: `fun main() {
    println("Hello, Kotlin!")
    print("2 + 3 = ")
    println(2 + 3)
    println("Done.")
}`,
      note: 'Change the text and press **Run** (Ctrl+Enter). Then change a `println` to `print` and see where the line break goes.'
    },
    challenge: {
      title: 'Three lines',
      task: 'Make the program print exactly these three lines, in this order:\n\n' + text(`Kotlin runs on the JVM.
Kotlin is concise.
Kotlin is null-safe.`) + '\n\nUse one `println` for each line.',
      starter: `fun main() {
    // Print the three lines here, one println for each.
    println("Kotlin runs on the JVM.")
}`,
      solution: `fun main() {
    println("Kotlin runs on the JVM.")
    println("Kotlin is concise.")
    println("Kotlin is null-safe.")
}`,
      hints: [
        '`println("…")` prints its text and then ends the line. Three lines need three calls.',
        'The checks compare the text exactly: mind the capital K and the full stop at the end of each line.'
      ],
      checks: [
        { label: 'Prints three lines', code: 'eq(lines.size, 3)' },
        { label: 'The second line is `Kotlin is concise.`', code: 'eq(lines.getOrNull(1), "Kotlin is concise.")' },
        { label: 'The whole output is exactly the three lines', code: 'eq(output, "Kotlin runs on the JVM.\\nKotlin is concise.\\nKotlin is null-safe.\\n")' },
        { label: 'Uses `println`, not `System.out.println`', code: 'ok(!uses("""System\\.out"""), "println is enough in Kotlin: no System.out needed")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'kt-variables', track: 'basics', title: 'val, var and type inference',
    summary: 'val is assigned once, var can change; the type is inferred but fixed. val is not "immutable", and const val is a compile-time constant.',
    keywords: ['val', 'var', 'variable', 'final', 'type inference', 'const', 'constant', 'immutable', 'reassign'],
    docs: 'https://kotlinlang.org/docs/basic-syntax.html',
    body: [
      'Kotlin has two keywords for a variable. `val` (value) is assigned once; `var` (variable) can be assigned again:',
      kt(`fun main() {
    val language = "Kotlin"
    var version = 1
    version = 2
    println("$language $version")
}`),
      out('Kotlin 2'),
      'Writing `language = "Java"` would not compile: the compiler says *\'val\' cannot be reassigned*. Prefer `val`, and use `var` only for something that really changes, such as a counter. Code where most names never change is easier to follow.',
      '## The type is worked out for you',
      '`val language = "Kotlin"` has no type written, yet `language` is a `String`, fixed at compile time. Kotlin *infers* it from the value. You can still write it, after the name and a colon:',
      kt(`fun main() {
    val city: String = "Pune"
    val year: Int = 2026
    val ratio: Double = 0.75
    println("$city $year $ratio")
}`),
      out('Pune 2026 0.75'),
      'The type is checked as strictly as in Java: `var count = 1` makes an `Int`, and `count = "two"` is a compile error. Inference saves typing; it does not make Kotlin dynamic.',
      '## val is not "immutable"',
      '`val` fixes the name, not the object behind it. A `val` that holds a mutable list can still change the list:',
      kt(`fun main() {
    val names = mutableListOf("Asha")
    names.add("Ravi")
    println(names)
}`),
      out('[Asha, Ravi]'),
      '## Declare first, assign later',
      'A `val` can be declared without a value, as long as the compiler can see it is assigned exactly once before it is read:',
      kt(`fun main() {
    val hour = 14
    val greeting: String
    if (hour < 12) {
        greeting = "Good morning"
    } else {
        greeting = "Good afternoon"
    }
    println(greeting)
}`),
      out('Good afternoon'),
      'The [[lesson:kt-conditions]] lesson shows a shorter way: `if` itself gives a value.',
      '## Constants',
      'For a value known when the program is compiled (a number or a string), there is `const val`, at the top level of the file or inside an `object`. It is Java\'s `static final` constant: the compiler copies the value into every place that uses it.',
      kt(`const val MAX_USERS = 100

fun main() {
    println("At most $MAX_USERS users")
}`),
      out('At most 100 users')
    ].join('\n\n'),
    java: 'Java\'s `final var city = "Pune";` is Kotlin\'s `val city = "Pune"`, and Java\'s `var count = 0;` (Java 10) is Kotlin\'s `var count = 0`. The difference is the default. In Java a local can change unless you add `final`, and most code never does. In Kotlin you choose `val` or `var` every time, and `val` is the shorter habit.\n\nThe type goes after the name (`val year: Int`), not before it. It reads well when the type is left out, which is most of the time.',
    example: {
      code: `fun main() {
    val name = "Ravi"
    var score = 10
    score += 5
    score++
    println("$name has $score points")
}`,
      note: 'Add `name = "Li"` and run: read the compile error, then change `val name` to `var name`.'
    },
    challenge: {
      title: 'A running total',
      task: 'The program has `val city = "Pune"` and `var total = 0`. Add 120, 80 and 45 to `total`, one at a time (`total += 120`…), then print exactly:\n\n' + text(`City: Pune
Total: 245`) + '\n\nPut the values into the text with string templates, such as `"City: $city"`, not with `+`.',
      starter: `fun main() {
    val city = "Pune"
    var total = 0
    // add 120, 80 and 45 to total, one at a time

    // then print the two lines
    TODO("print City: Pune and Total: 245")
}`,
      solution: `fun main() {
    val city = "Pune"
    var total = 0
    total += 120
    total += 80
    total += 45
    println("City: $city")
    println("Total: $total")
}`,
      hints: [
        '`total += 120` adds 120 to `total`; it is allowed because `total` is a `var`.',
        'A `$` followed by a name inside a string puts the value in: `println("Total: $total")`.'
      ],
      checks: [
        { label: 'The first line is `City: Pune`', code: 'eq(lines.getOrNull(0), "City: Pune")' },
        { label: 'The second line is `Total: 245`', code: 'eq(lines.getOrNull(1), "Total: 245")' },
        { label: '`city` is a `val` and `total` a `var`', code: 'ok(uses("""\\bval\\s+city\\b""") && uses("""\\bvar\\s+total\\b"""), "keep val city and var total")' },
        { label: 'The lines are built with templates (`$city`, `$total`)', code: 'ok(templated("city") && templated("total"), "put the values into the text with string templates, not with +")' },
        { label: 'The program ends without an error', code: 'ok(error == null, "it threw $error")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'kt-numbers', track: 'basics', title: 'Numbers and conversions',
    summary: 'Int, Long, Double and the rest; no silent widening, so you convert with toLong() and toDouble(); integer division, overflow, and text to numbers.',
    keywords: ['int', 'long', 'double', 'float', 'number', 'conversion', 'toInt', 'toDouble', 'widening', 'division', 'overflow', 'math'],
    docs: 'https://kotlinlang.org/docs/numbers.html',
    body: [
      'Kotlin has the number types Java has, with capital letters: `Int` (32 bits), `Long` (64), `Double`, `Float`, `Short` and `Byte`. A whole-number literal is an `Int`, or a `Long` when it does not fit in one. `L` makes a literal a `Long`, a decimal point a `Double`, and `f` a `Float`. Underscores make big numbers readable:',
      kt(`fun main() {
    val people = 1_400_000_000
    val stars = 100_000_000_000
    val big = 7L
    val price = 9.99
    val ratio = 0.5f
    println("$people $stars $big $price $ratio")
}`),
      out('1400000000 100000000000 7 9.99 0.5'),
      '## No silent widening',
      'Java turns an `int` into a `long` or a `double` whenever one is needed. Kotlin never converts a number by itself. You call a conversion function: `toLong()`, `toDouble()`, `toInt()` and the rest.',
      norun(`val count: Int = 3
// compile error: Initializer type mismatch: expected 'Long', actual 'Int'
val total: Long = count
// fine
val total2: Long = count.toLong()`),
      'Arithmetic still mixes types: `count + 1L` is a `Long` and `count * 1.5` is a `Double`, because the operators are defined for each pair of types. Only assignments and arguments refuse a different type.',
      kt(`fun main() {
    val count = 3
    val asLong = count + 1L
    val asDouble = count * 1.5
    println("$asLong $asDouble")
    println(count.toDouble() / 2)
}`),
      out(`4 4.5
1.5`),
      '## Division, remainder, overflow',
      '`/` between two whole numbers drops the fraction, as in Java, and `%` is the remainder. Make one side a `Double` first to keep the fraction. Whole numbers wrap around when they overflow, also as in Java:',
      kt(`fun main() {
    println(7 / 2)
    println(7 % 2)
    println(7 / 2.0)
    println(7.toDouble() / 2)
    println(Int.MAX_VALUE + 1)
}`),
      out(`3
1
3.5
3.5
-2147483648`),
      '## Text to numbers, and maths',
      kt(`import kotlin.math.roundToInt
import kotlin.math.sqrt

fun main() {
    val n = "42".toInt()
    val maybe = "4x".toIntOrNull()
    println(n + 1)
    println(maybe)
    println(sqrt(2.0))
    println(2.6.roundToInt())
    println("%.2f".format(2.0 / 3))
}`),
      out(`43
null
1.4142135623730951
3
0.67`),
      '`toInt()` throws `NumberFormatException` on text that is not a number; `toIntOrNull()` gives `null` instead (the [[lesson:kt-null-safety]] lesson shows how to handle a null). Maths functions such as `sqrt`, `abs` and `roundToInt` are in `kotlin.math`. `"%.2f".format(x)` is Java\'s `String.format`, called on the pattern.',
      '## A Char is not a number',
      'In Java a `char` is a number: `\'a\' + 1` is 98. In Kotlin a `Char` is a character. Adding to it gives the next character, and `.code` gives its number:',
      kt(`fun main() {
    println('a' + 1)
    println('a'.code)
}`),
      out(`b
97`),
      '## Under the hood',
      'An `Int` is compiled to Java\'s `int` wherever it can be, so it costs what an `int` costs. It becomes a boxed `java.lang.Integer` only where an object is needed: in a `List<Int>`, or as an `Int?`, an `Int` that may be null.'
    ].join('\n\n'),
    java: '| Java | Kotlin |\n|---|---|\n| `int`, `long`, `double` | `Int`, `Long`, `Double` |\n| `long l = i;` (widened for you) | `val l: Long = i.toLong()` |\n| `(double) a / b` | `a.toDouble() / b` |\n| `Integer.parseInt("42")` | `"42".toInt()`, or `"42".toIntOrNull()` |\n| `Math.sqrt(x)`, `Math.round(x)` | `sqrt(x)`, `x.roundToInt()` (from `kotlin.math`) |\n| `String.format("%.2f", x)` | `"%.2f".format(x)` |\n| `Integer.MAX_VALUE` | `Int.MAX_VALUE` |',
    example: {
      code: `import kotlin.math.roundToInt

fun main() {
    val celsius = 37.0
    val fahrenheit = celsius * 9 / 5 + 32
    println("$celsius °C is $fahrenheit °F")
    println("Rounded: \${fahrenheit.roundToInt()} °F")
    val seconds = 3_725
    println("\${seconds / 3600} h \${seconds % 3600 / 60} min \${seconds % 60} s")
}`,
      note: 'Change `celsius` to a whole number, `37`: the program still works, because `37 * 9 / 5 + 32` is all `Int`. What do you lose?'
    },
    challenge: {
      title: 'Average and hours',
      task: 'Two small calculations.\n\n1. `total` is 17 and `count` is 4: print their average with two decimals, `Average: 4.25`. The starter has `0.0`; replace it with `total` divided by `count`, keeping the fraction.\n2. `minutes` is 135: print it as hours and minutes, `2 h 15 min`, using `/` and `%`.\n\nThe output must be exactly:\n\n' + text(`Average: 4.25
2 h 15 min`),
      starter: `fun main() {
    val total = 17
    val count = 4
    val average = 0.0     // fix: total divided by count, keeping the fraction
    println("Average: \${"%.2f".format(average)}")

    val minutes = 135
    println("? h ? min")  // fix: the hours and the minutes, from minutes
}`,
      solution: `fun main() {
    val total = 17
    val count = 4
    val average = total.toDouble() / count
    println("Average: \${"%.2f".format(average)}")

    val minutes = 135
    println("\${minutes / 60} h \${minutes % 60} min")
}`,
      hints: [
        '`total / count` divides two `Int`s and gives 4. Make one of them a `Double` first: `total.toDouble() / count`.',
        '`minutes / 60` is the whole hours and `minutes % 60` the minutes left over. Put each into the text with `${…}`.'
      ],
      checks: [
        { label: 'Prints `Average: 4.25` first', code: 'eq(lines.getOrNull(0), "Average: 4.25")' },
        { label: 'Prints `2 h 15 min` second', code: 'eq(lines.getOrNull(1), "2 h 15 min")' },
        { label: 'Converts with `toDouble()`: Kotlin never widens by itself', code: 'ok(uses("""\\.toDouble\\(\\)"""), "make total (or count) a Double with toDouble() before dividing")' },
        { label: 'Works out the hours and minutes with `/` and `%`', code: 'ok(uses("""minutes\\s*/\\s*60""") && uses("""minutes\\s*%\\s*60"""), "use minutes / 60 and minutes % 60")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'kt-strings', track: 'basics', title: 'Strings and templates',
    summary: 'String templates ($name, ${expr}), raw strings in triple quotes, the everyday string functions, == comparing text, and reading a line with readln().',
    keywords: ['string', 'template', 'interpolation', 'raw string', 'trimIndent', 'substring', 'split', 'uppercase', 'length', 'readln', 'equals', 'char'],
    docs: 'https://kotlinlang.org/docs/strings.html',
    body: [
      '## Templates',
      'A `$` in a string puts a value in: `$name` for a name, `${…}` for any expression. Templates replace most uses of `+` and of `String.format`:',
      kt(`fun main() {
    val name = "Asha"
    val items = 3
    println("Hello, $name!")
    println("$name has $items items, \${items * 2} after doubling")
    println("Her name has \${name.length} letters")
    println("A dollar sign: \\$5")
}`),
      out(`Hello, Asha!
Asha has 3 items, 6 after doubling
Her name has 4 letters
A dollar sign: $5`),
      '## Raw strings',
      'Three quotes make a *raw string*. It can span lines, and a backslash is just a backslash, which suits regular expressions and Windows paths. `trimIndent()` removes the indentation the lines share, and the first and last line when they are blank:',
      kt(`fun main() {
    val path = """C:\\Users\\Ravi"""
    val poem = """
        Roses are red,
        Kotlin is too.
    """.trimIndent()
    println(path)
    println(poem)
}`),
      out(`C:\\Users\\Ravi
Roses are red,
Kotlin is too.`),
      'Templates work in raw strings too.',
      '## What a string can do',
      'Strings are immutable, as in Java, and every method of Java\'s `String` works. Kotlin adds many of its own. The everyday ones:',
      kt(`fun main() {
    val s = "  Kotlin and Java  "
    val t = s.trim()
    println(t.length)
    println(t.uppercase())
    println(t[0])
    println(t.substring(0, 6))
    println(t.split(" "))
    println(t.replace("Java", "the JVM"))
    println("Kot" in t)
    println(t.startsWith("Kotlin"))
    println("ab".repeat(3))
    println("7".padStart(3, '0'))
}`),
      out(`15
KOTLIN AND JAVA
K
Kotlin
[Kotlin, and, Java]
Kotlin and the JVM
true
true
ababab
007`),
      '`length` is a property, so it has no brackets. `t[0]` is a `Char` (`\'K\'`, in single quotes), the same as Java\'s `charAt(0)`. `in` asks whether one string contains another.',
      '## == compares the text',
      'In Kotlin, `==` calls `equals`. For strings that means: the same characters give `true`. Java\'s `==` compares references, the classic bug. Kotlin\'s compares content. Comparing references is `===`, rarely needed (see [[q:equality]]).',
      kt(`fun main() {
    val a = "kot"
    val b = "Kotlin".substring(0, 3).lowercase()
    println(a == b)
    println(a.equals("KOT", ignoreCase = true))
}`),
      out(`true
true`),
      '## Reading a line',
      '`readln()` reads one line of input; in this tool it comes from the **Input** box, one line per call. `readlnOrNull()` gives `null` when there is no more input. (`?:` gives a default for a null: the [[lesson:kt-null-safety]] lesson explains.)',
      kt(`fun main() {
    val line = readlnOrNull() ?: "nobody"
    println("Hello, $line")
}`),
      out('Hello, nobody')
    ].join('\n\n'),
    java: '| Java | Kotlin |\n|---|---|\n| `"Hi " + name + "!"` | `"Hi $name!"` |\n| `String.format("%d items", n)` | `"$n items"` |\n| `s.length()` | `s.length` |\n| `s.charAt(0)` | `s[0]` |\n| `s.equals(t)` | `s == t` |\n| `s.contains("x")` | `"x" in s` |\n| A text block, `"""` (Java 15) | A raw string, `"""`, with `trimIndent()` |\n| `new Scanner(System.in).nextLine()` | `readln()` |',
    example: {
      code: `fun main() {
    val first = "Grace"
    val last = "Hopper"
    val full = "$first $last"
    println(full)
    println("\${full.length} characters, initials \${first[0]}\${last[0]}")
    println(full.uppercase().reversed())
}`,
      note: 'Try `println(first + last)` and `println("$first$last")`: the same text. Which reads better?'
    },
    challenge: {
      title: 'Clean up a name',
      task: '`name` holds `"  ada lovelace  "`, with spaces around it. Print three lines:\n\n' + text(`AL
Hello, ada lovelace!
LOVELACE has 8 letters`) + '\n\n1. The initials, upper-cased. The starter already has `parts`: the name trimmed and split into its two words.\n2. A greeting, with the spaces trimmed off the name.\n3. The surname in capitals and its length.\n\nBuild every line with string templates: no `+` next to a string.',
      starter: `fun main() {
    val name = "  ada lovelace  "
    val parts = name.trim().split(" ")
    println("initials")              // fix: AL
    println("Hello, " + name + "!")  // fix: trim the name, and use a template
    println("surname")               // fix: LOVELACE has 8 letters
}`,
      solution: `fun main() {
    val name = "  ada lovelace  "
    val parts = name.trim().split(" ")
    val initials = "\${parts[0][0]}\${parts[1][0]}".uppercase()
    println(initials)
    println("Hello, \${name.trim()}!")
    println("\${parts[1].uppercase()} has \${parts[1].length} letters")
}`,
      hints: [
        '`parts[0]` is `"ada"` and `parts[0][0]` its first `Char`. Put both first letters into one template, then `.uppercase()` the result.',
        'Inside `${…}` any expression works: `"Hello, ${name.trim()}!"`, `"${parts[1].length}"`.'
      ],
      checks: [
        { label: 'Line 1 is the initials, `AL`', code: 'eq(lines.getOrNull(0), "AL")' },
        { label: 'Line 2 is `Hello, ada lovelace!`, with no extra spaces', code: 'eq(lines.getOrNull(1), "Hello, ada lovelace!")' },
        { label: 'Line 3 is `LOVELACE has 8 letters`', code: 'eq(lines.getOrNull(2), "LOVELACE has 8 letters")' },
        { label: 'No `+` next to a string: templates instead', code: 'ok(!uses("""\\"\\s*\\+|\\+\\s*\\""""), "put the values into the strings with templates, not with +")' },
        { label: 'Trims the spaces with `trim()`', code: 'ok(uses("""\\.trim\\(\\)"""), "trim() removes the spaces at both ends")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'kt-conditions', track: 'basics', title: 'if and when are expressions',
    summary: 'if gives a value, so Kotlin needs no ternary. when replaces switch: no fall-through, several values per branch, ranges, types, and plain conditions.',
    keywords: ['if', 'else', 'when', 'switch', 'ternary', 'expression', 'condition', 'branch', 'in', 'is', 'exhaustive'],
    docs: 'https://kotlinlang.org/docs/control-flow.html',
    body: [
      '## if gives a value',
      'In Kotlin, `if` is an expression: it has a value, the value of the branch that ran. That is why Kotlin has no `a ? b : c`: it does not need one.',
      kt(`fun main() {
    val a = 7
    val b = 4
    val max = if (a > b) a else b
    println(max)
    val kind = if (a % 2 == 0) "even" else "odd"
    println("$a is $kind")
}`),
      out(`7
7 is odd`),
      'A branch can be a block; its last expression is its value:',
      kt(`fun main() {
    val temperature = 31
    val advice = if (temperature > 30) {
        println("It is hot")
        "drink water"
    } else {
        "enjoy the day"
    }
    println(advice)
}`),
      out(`It is hot
drink water`),
      'Used as a value, `if` must have an `else`: otherwise there would be no value when the condition is false.',
      '## when',
      '`when` is Kotlin\'s `switch`, and more. It compares a value with each branch in turn and runs the first one that matches. There is no fall-through and no `break`: one branch runs, and then `when` is done.',
      kt(`fun main() {
    val day = 6
    val name = when (day) {
        1 -> "Monday"
        2, 3, 4 -> "midweek"
        5 -> "Friday"
        6, 7 -> "weekend"
        else -> "not a day"
    }
    println(name)
}`),
      out('weekend'),
      'A branch can test a range with `in`, or a type with `is`. Inside an `is String` branch the value *is* a `String`, with no cast (a smart cast, see [[q:smart-casts]]). With no value after `when`, each branch is a condition of its own:',
      kt(`fun describe(x: Any): String = when (x) {
    is String -> "a string of length \${x.length}"
    in 1..9 -> "a small number"
    is Int -> "a number"
    else -> "something else"
}

fun main() {
    println(describe("hello"))
    println(describe(5))
    println(describe(42))
    println(describe(2.5))
    val score = 72
    val result = when {
        score >= 90 -> "excellent"
        score >= 60 -> "pass"
        else -> "fail"
    }
    println(result)
}`),
      out(`a string of length 5
a small number
a number
something else
pass`),
      '(`fun describe(x: Any): String = …` declares a function that takes any value and returns a `String`: the [[lesson:kt-functions]] lesson covers functions.)',
      '## when must cover every case',
      'When `when` gives a value, it must cover every possible case, usually with an `else`. With an enum or a sealed class (the [[track:classes]] track) the compiler knows every case, and tells you which one you forgot.',
      '## Conditions are Booleans',
      '`&&`, `||` and `!` work as in Java, and a condition must be a `Boolean`: `if (count)` with an `Int` does not compile.'
    ].join('\n\n'),
    java: [
      java(`int max = a > b ? a : b;
String name = switch (day) {
    case 1 -> "Monday";
    case 6, 7 -> "weekend";
    default -> "not a day";
};`),
      'Java 14\'s switch expressions are close to `when`. The older `switch` statement falls through to the next `case` without a `break`; `when` never does. `when` also takes ranges (`in 1..9`), types (`is String`, the idea behind Java 21\'s pattern matching), and plain conditions.'
    ].join('\n\n'),
    example: {
      code: `fun main() {
    val hour = 15
    val greeting = when {
        hour < 12 -> "Good morning"
        hour < 18 -> "Good afternoon"
        else -> "Good evening"
    }
    println(greeting)
    println(if (hour % 2 == 0) "an even hour" else "an odd hour")
}`,
      note: 'Change `hour` and run. Then delete the `else` branch of the `when`: what does the compiler say?'
    },
    challenge: {
      title: 'Grades with when',
      task: 'Write `grade(score)` as a `when` on the score:\n\n| Score | Grade |\n|---|---|\n| 90 to 100 | `"A"` |\n| 75 to 89 | `"B"` |\n| 50 to 74 | `"C"` |\n| 0 to 49 | `"F"` |\n| anything else | `"invalid"` |\n\nUse ranges (`in 90..100 -> "A"`), not a chain of `if`s. `fun grade(score: Int): String = when …` declares a function that takes an `Int` and returns a `String`; `main` prints three grades.',
      starter: `fun grade(score: Int): String = when (score) {
    in 90..100 -> "A"
    else -> TODO("the other grades")
}

fun main() {
    println(grade(95))
    println(grade(50))
    println(grade(120))
}`,
      solution: `fun grade(score: Int): String = when (score) {
    in 90..100 -> "A"
    in 75..89 -> "B"
    in 50..74 -> "C"
    in 0..49 -> "F"
    else -> "invalid"
}

fun main() {
    println(grade(95))
    println(grade(50))
    println(grade(120))
}`,
      hints: [
        '`in 75..89 -> "B"` matches every score from 75 to 89, both included.',
        'The branches are tried in order and the first match wins; `else` catches everything left, such as -1 and 101.'
      ],
      checks: [
        { label: '`grade(90)` and `grade(100)` are `"A"`', code: 'eq(listOf(grade(90), grade(100)), listOf("A", "A"))' },
        { label: '`grade(75)` and `grade(89)` are `"B"`', code: 'eq(listOf(grade(75), grade(89)), listOf("B", "B"))' },
        { label: '`grade(50)` and `grade(74)` are `"C"`; `grade(0)` and `grade(49)` are `"F"`', code: 'eq(listOf(grade(50), grade(74), grade(0), grade(49)), listOf("C", "C", "F", "F"))' },
        { label: '`grade(-1)` and `grade(101)` are `"invalid"`', code: 'eq(listOf(grade(-1), grade(101)), listOf("invalid", "invalid"))' },
        { label: 'Uses `when` with ranges, not `if`', code: 'ok(uses("""\\bwhen\\b""") && uses("""\\bin\\s+\\d+\\s*\\.\\.""") && !uses("""\\bif\\b"""), "use when (score) { in 90..100 -> \\"A\\" ... }")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 6 */
  L.push({
    id: 'kt-loops', track: 'basics', title: 'Ranges and loops',
    summary: 'Ranges (.., until, ..<, downTo, step), for over anything iterable, while and do-while, repeat, and labelled break and continue.',
    keywords: ['for', 'loop', 'range', 'until', 'downTo', 'step', 'while', 'repeat', 'break', 'continue', 'label', 'withIndex', 'indices'],
    docs: 'https://kotlinlang.org/docs/ranges.html',
    body: [
      '## Ranges',
      '`1..5` is a range: the numbers from 1 to 5, both included. `until` (or `..<`) leaves out the end, `downTo` counts down, and `step` skips. `toList()` shows what a range holds:',
      kt(`fun main() {
    println((1..5).toList())
    println((0 until 5).toList())
    println((0..<5).toList())
    println((10 downTo 0 step 3).toList())
    println(3 in 1..5)
    println(7 !in 1..5)
}`),
      out(`[1, 2, 3, 4, 5]
[0, 1, 2, 3, 4]
[0, 1, 2, 3, 4]
[10, 7, 4, 1]
true
true`),
      '`in` also asks whether a value lies in a range: `3 in 1..5` is `true`, and the compiler turns it into two comparisons. A `for` over a range compiles to the same counting loop Java writes, with no range object made.',
      '## for goes over things',
      'Kotlin\'s `for` has one form: `for (x in something)`, where the something is a range, a string, a list, a map, or anything else that can be iterated. There is no `for (int i = 0; i < n; i++)`.',
      kt(`fun main() {
    for (i in 1..3) {
        println("lap $i")
    }
    for (c in "abc") print(c.uppercaseChar())
    println()
    val names = listOf("Asha", "Ravi")
    for (name in names) println(name)
    for ((index, name) in names.withIndex()) println("$index: $name")
    for (i in names.indices) println("\${names[i]} is at $i")
}`),
      out(`lap 1
lap 2
lap 3
ABC
Asha
Ravi
0: Asha
1: Ravi
Asha is at 0
Ravi is at 1`),
      '`withIndex()` gives each item with its position, and `(index, name)` takes the pair apart. `indices` is the range of valid positions, `0 until size`.',
      '## while, do-while and repeat',
      kt(`fun main() {
    var n = 10
    while (n > 1) {
        n /= 2
        println(n)
    }
    var tries = 0
    do {
        tries++
    } while (tries < 3)
    println("tried $tries times")
    repeat(2) { println("hi") }
}`),
      out(`5
2
1
tried 3 times
hi
hi`),
      '`while` and `do … while` are Java\'s. `repeat(n) { … }` runs the block n times: the shortest loop when you need no counter.',
      '## break, continue and labels',
      '`break` and `continue` work as in Java. To leave an outer loop from an inner one, label it, `outer@ for (…)`, then write `break@outer` or `continue@outer`:',
      kt(`fun main() {
    outer@ for (i in 1..3) {
        for (j in 1..3) {
            if (j == 2) continue
            if (i == 3) break@outer
            println("$i,$j")
        }
    }
}`),
      out(`1,1
1,3
2,1
2,3`)
    ].join('\n\n'),
    java: '| Java | Kotlin |\n|---|---|\n| `for (int i = 0; i < n; i++)` | `for (i in 0 until n)` |\n| `for (int i = 1; i <= n; i++)` | `for (i in 1..n)` |\n| `for (int i = n; i >= 0; i -= 2)` | `for (i in n downTo 0 step 2)` |\n| `for (String s : names)` | `for (s in names)` |\n| `IntStream.rangeClosed(1, 5)` | `1..5` |\n| `outer: for …` and `break outer;` | `outer@ for …` and `break@outer` |\n\nWatch `0..n`: it includes `n`, so it runs one time more than Java\'s `i < n`. `0 until n` is the Java loop.',
    example: {
      code: `fun main() {
    val n = 5
    var factorial = 1L
    for (i in 1..n) {
        factorial *= i
    }
    println("$n! = $factorial")
    for (row in 1..3) {
        println("*".repeat(row))
    }
}`,
      note: 'Change `1..n` to `1 until n`: which number is no longer multiplied in?'
    },
    challenge: {
      title: 'Sum of multiples, and a countdown',
      task: 'Write `sumOfMultiples(n)`: the sum of every number from 1 to `n`, `n` included, that is a multiple of 3 or of 5. For 10 that is 3 + 5 + 6 + 9 + 10 = 33. Use a `for` loop over `1..n`.\n\nThen make `main` print `sumOfMultiples(10)` and, on the last line, a countdown from 3 made with `downTo`:\n\n' + text(`33
3 2 1 liftoff`),
      starter: `fun sumOfMultiples(n: Int): Int {
    var total = 0
    // add each number from 1 to n that is a multiple of 3 or of 5
    return total
}

fun main() {
    println(sumOfMultiples(10))
    // count down: 3 2 1 liftoff
}`,
      solution: `fun sumOfMultiples(n: Int): Int {
    var total = 0
    for (i in 1..n) {
        if (i % 3 == 0 || i % 5 == 0) total += i
    }
    return total
}

fun main() {
    println(sumOfMultiples(10))
    for (i in 3 downTo 1) print("$i ")
    println("liftoff")
}`,
      hints: [
        '`i % 3 == 0` is true when `i` is a multiple of 3. Combine the two tests with `||`.',
        'For the countdown, `print("$i ")` in a `for (i in 3 downTo 1)` loop keeps the numbers on one line; a `println("liftoff")` after the loop ends it.'
      ],
      checks: [
        { label: '`sumOfMultiples(10)` is 33', code: 'eq(sumOfMultiples(10), 33)' },
        { label: '`sumOfMultiples(15)` is 60: `n` itself counts', code: 'eq(sumOfMultiples(15), 60)' },
        { label: '`sumOfMultiples(0)` is 0', code: 'eq(sumOfMultiples(0), 0)' },
        { label: 'The loop goes over `1..n`', code: 'ok(uses("""\\bfor\\s*\\(\\s*\\w+\\s+in\\s+1\\s*\\.\\.\\s*n\\s*\\)"""), "loop with for (i in 1..n)")' },
        { label: 'The last line is `3 2 1 liftoff`', code: 'eq(lines.lastOrNull(), "3 2 1 liftoff")' },
        { label: 'Counts down with `downTo`', code: 'ok(uses("""\\bdownTo\\b"""), "count down with for (i in 3 downTo 1)")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 7 */
  L.push({
    id: 'kt-functions', track: 'basics', title: 'Functions: default and named arguments',
    summary: 'fun, parameters and return types, single-expression functions, Unit, default arguments that replace overloads, named arguments, and vararg.',
    keywords: ['function', 'fun', 'parameter', 'return', 'default argument', 'named argument', 'overload', 'vararg', 'unit', 'single-expression', 'void'],
    docs: 'https://kotlinlang.org/docs/functions.html',
    body: [
      '## Declaring a function',
      '`fun`, the name, the parameters (each one `name: Type`), then the return type after a colon:',
      kt(`fun add(a: Int, b: Int): Int {
    return a + b
}

fun main() {
    println(add(2, 3))
}`),
      out('5'),
      'When the body is one expression, write it after `=` and leave out the braces, the `return`, and usually the return type, which is inferred:',
      kt(`fun square(x: Int) = x * x

fun isEven(n: Int) = n % 2 == 0

fun main() {
    println(square(7))
    println(isEven(7))
}`),
      out(`49
false`),
      'A function that returns nothing returns `Unit`, Kotlin\'s `void`, and you leave it out. Parameters are read-only, like a `val`: assigning to one does not compile.',
      '## Default arguments',
      'A parameter can have a default value, and a caller can then leave it out:',
      kt(`fun greet(name: String, greeting: String = "Hello", punctuation: String = "!"): String =
    "$greeting, $name$punctuation"

fun main() {
    println(greet("Asha"))
    println(greet("Ravi", "Welcome"))
    println(greet("Li", "Hi", "."))
}`),
      out(`Hello, Asha!
Welcome, Ravi!
Hi, Li.`),
      'One function replaces the three overloads Java would need.',
      '## Named arguments',
      'A caller can name an argument. The order then no longer matters, and a default in the middle can be skipped. Names also make a call readable where a bare `true` or `3` says nothing:',
      kt(`fun greet(name: String, greeting: String = "Hello", punctuation: String = "!"): String =
    "$greeting, $name$punctuation"

fun main() {
    println(greet("Asha", punctuation = "?"))
    println(greet(greeting = "Hey", name = "Ravi"))
}`),
      out(`Hello, Asha?
Hey, Ravi!`),
      '## Any number of arguments',
      '`vararg` takes any number of arguments of one type, as Java\'s `int...` does; inside the function it is an array. To pass an array you already have, spread it with `*`:',
      kt(`fun total(vararg prices: Int): Int {
    var sum = 0
    for (p in prices) sum += p
    return sum
}

fun main() {
    println(total(10, 20, 30))
    val more = intArrayOf(1, 2)
    println(total(*more, 100))
}`),
      out(`60
103`),
      '## Functions anywhere',
      'A function can live at the top level of a file (no class needed), inside a class, or inside another function, where it is a *local function* that sees the outer function\'s variables. A function that never returns, because it always throws, has the return type `Nothing`: `TODO()` is one, and `error("message")` is another (see [[q:any-unit-nothing]]).'
    ].join('\n\n'),
    java: [
      'Java gets optional parameters from overloads, or from a builder:',
      java(`String greet(String name) { return greet(name, "Hello"); }
String greet(String name, String greeting) { return greet(name, greeting, "!"); }
String greet(String name, String greeting, String punctuation) { return greeting + ", " + name + punctuation; }`),
      'In Kotlin that is one function: `fun greet(name: String, greeting: String = "Hello", punctuation: String = "!")`. A Java caller sees only the full signature of such a function, unless you add `@JvmOverloads`, which makes the compiler write the overloads for Java ([[lesson:kt-kotlin-from-java]]). Java has no named arguments, so Java code always passes every argument, in order.'
    ].join('\n\n'),
    example: {
      code: `fun bmi(weightKg: Double, heightM: Double): Double = weightKg / (heightM * heightM)

fun describe(value: Double, unit: String = "kg/m²", decimals: Int = 1): String =
    "%.\${decimals}f %s".format(value, unit)

fun main() {
    val b = bmi(70.0, 1.75)
    println(describe(b))
    println(describe(b, decimals = 3))
}`,
      note: 'Call `describe(b, "points")`, then `describe(b, unit = "points", decimals = 0)`.'
    },
    challenge: {
      title: 'One function instead of three overloads',
      task: 'Give `joinParts` two more parameters, each with a default: `separator` (default `", "`) and `suffix` (default `"."`). It returns `first`, then the separator, then `second`, then the suffix:\n\n| Call | Result |\n|---|---|\n| `joinParts("red", "green")` | `"red, green."` |\n| `joinParts("red", "green", " & ")` | `"red & green."` |\n| `joinParts("red", "green", suffix = "!")` | `"red, green!"` |\n\nWrite it as a single-expression function (`= …`), and make `main` print the first and the last of these.',
      starter: `fun joinParts(first: String, second: String): String = TODO("add separator and suffix, with defaults")

fun main() {
    println(joinParts("red", "green"))
}`,
      solution: `fun joinParts(first: String, second: String, separator: String = ", ", suffix: String = "."): String =
    "$first$separator$second$suffix"

fun main() {
    println(joinParts("red", "green"))
    println(joinParts("red", "green", suffix = "!"))
}`,
      hints: [
        'A default goes after the type: `separator: String = ", "`.',
        'To skip the separator and set only the suffix, name it: `joinParts("red", "green", suffix = "!")`.'
      ],
      checks: [
        { label: '`joinParts("red", "green")` is `"red, green."`', code: 'eq(joinParts("red", "green"), "red, green.")' },
        { label: '`joinParts("red", "green", " & ")` is `"red & green."`', code: 'eq(joinParts("red", "green", " & "), "red & green.")' },
        { label: '`joinParts("red", "green", suffix = "!")` is `"red, green!"`', code: 'eq(joinParts("red", "green", suffix = "!"), "red, green!")' },
        { label: '`main` prints `red, green.` and then `red, green!`', code: 'eq(lines, listOf("red, green.", "red, green!"))' },
        { label: 'A single-expression function (`= …`)', code: 'ok(uses("""fun\\s+joinParts\\s*\\([^)]*\\)\\s*(:\\s*String\\s*)?="""), "write it as fun joinParts(...) = ...")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 8 */
  L.push({
    id: 'kt-null-safety', track: 'basics', title: 'Null safety',
    summary: 'String can never be null, String? can. Four ways to handle a nullable value: a check with a smart cast, the safe call ?., the Elvis operator ?:, and !!.',
    keywords: ['null', 'nullable', 'null safety', '?', '?.', 'safe call', '?:', 'elvis', '!!', 'smart cast', 'let', 'NullPointerException', 'NPE', 'Optional'],
    docs: 'https://kotlinlang.org/docs/null-safety.html',
    body: [
      '## Two kinds of type',
      'In Kotlin, a `String` can never be null. To allow null, add a question mark: `String?`. The compiler then makes you deal with the null before you use the value, so the NullPointerExceptions Java finds at run time become compile errors:',
      norun(`// compile error: Null cannot be a value of a non-null type 'String'
val name: String = null
// fine
val maybe: String? = null
// compile error: Only safe (?.) or non-null asserted (!!.) calls are allowed
println(maybe.length)`),
      'There are four ways to deal with a nullable value.',
      '## 1. Check it, and Kotlin smart-casts',
      'After `if (x != null)` the compiler knows `x` is not null inside the branch, and lets you use it as a plain `String`. This is a *smart cast*:',
      kt(`fun describe(s: String?): String {
    if (s != null) {
        return "\${s.length} characters"
    }
    return "nothing"
}

fun main() {
    println(describe("Kotlin"))
    println(describe(null))
}`),
      out(`6 characters
nothing`),
      'A smart cast needs a value that cannot change between the check and the use: a local `val`, or a local `var` nothing changes in between. A `var` property is refused, because other code could change it (see [[q:smart-casts]]). Kotlin 2.0\'s compiler, [[term:k2]], smart-casts in more places than earlier versions did: after `a is X || a is Y`, inside the lambdas of inline functions, in `catch` and `finally` blocks, and more. So older Kotlin code sometimes has a cast or a `!!` that is no longer needed.',
      '## 2. The safe call ?.',
      '`s?.length` is `s.length` when `s` is not null, and `null` when it is. Safe calls chain: the first null ends the chain.',
      kt(`fun main() {
    val city: String? = "pune"
    val none: String? = null
    println(city?.uppercase())
    println(none?.uppercase())
    println(none?.trim()?.length)
}`),
      out(`PUNE
null
null`),
      '## 3. The Elvis operator ?:',
      '`a ?: b` is `a` unless it is null, and then `b`. With a safe call it gives a default in one line. And because `throw` and `return` are expressions too, the right side can also leave:',
      kt(`fun lengthOf(s: String?): Int = s?.length ?: 0

fun requireName(name: String?): String = name ?: throw IllegalArgumentException("no name")

fun main() {
    println(lengthOf("abc"))
    println(lengthOf(null))
    println(requireName("Asha"))
    println("42".toIntOrNull() ?: -1)
    println("4x".toIntOrNull() ?: -1)
}`),
      out(`3
0
Asha
42
-1`),
      '## 4. The not-null assertion !!',
      '`s!!` says "I know this is not null". It gives the value, or throws a `NullPointerException` if you were wrong. It is the one place a Kotlin program writes its own NPE, so use it rarely: a check, `?.` or `?:` is almost always better.',
      '## ?.let: run code only when there is a value',
      '`x?.let { … }` runs the block only when `x` is not null, with the value as `it`:',
      kt(`fun main() {
    val email: String? = "ravi@example.com"
    email?.let { println("Sending to $it") }
    val missing: String? = null
    missing?.let { println("never printed") }
    println("done")
}`),
      out(`Sending to ravi@example.com
done`),
      '## Collections and casts',
      '`List<String?>` is a list that may hold nulls; `List<String>?` is a list that may itself be null. `filterNotNull()` drops the nulls. `as?` is a cast that gives null instead of throwing:',
      kt(`fun main() {
    val raw = listOf("1", null, "3")
    println(raw.filterNotNull())
    val x: Any = "text"
    println(x as? Int)
    println((x as? String)?.length)
}`),
      out(`[1, 3]
null
4`),
      '## Where nulls still come from',
      'Values from Java code have *platform types*, written `String!` in messages. Kotlin cannot know whether a Java method returns null, so it lets you choose, and a wrong choice fails at run time. The other sources are `!!`, a `lateinit` property read too early (the [[track:classes]] track), and code that runs before a constructor has set a property. [[q:npe-in-kotlin]] shows each one.'
    ].join('\n\n'),
    java: '| Java | Kotlin |\n|---|---|\n| Any reference may be null | `String` never is; `String?` may be |\n| `if (s != null) s.length()` | `if (s != null) s.length` (a smart cast), or `s?.length` |\n| `s != null ? s : "none"` | `s ?: "none"` |\n| `Optional.ofNullable(s).map(String::trim).orElse("")` | `s?.trim() ?: ""` |\n| `Objects.requireNonNull(s)` | `requireNotNull(s)`, or `s!!` |\n| `@Nullable` and `@NonNull`, checked by extra tools | Part of the type, checked by the compiler |\n\nKotlin reads the nullability annotations on Java code (JetBrains\', JSpecify\'s, Android\'s and others): a Java method marked `@Nullable` returns a `String?` in Kotlin, not a platform type.',
    example: {
      code: `fun main() {
    val input: String? = readlnOrNull()
    val name = input?.trim() ?: "stranger"
    println("Hello, $name!")
    println("Your input has \${input?.length ?: 0} characters")
}`,
      stdin: 'Ravi',
      note: 'Change the name in the **Input** box and run again; then empty the box and run.'
    },
    challenge: {
      title: 'No null left unhandled',
      task: 'Write two functions, without `!!`:\n\n- `displayName(name, nickname)`: the nickname, trimmed, when there is one; otherwise the name. `displayName("Ravi", " Rav ")` is `"Rav"` and `displayName("Ravi", null)` is `"Ravi"`.\n- `lengthOrMinusOne(s)`: the length of `s`, or -1 when `s` is null. (An empty string has length 0, so 0 cannot mean "no string".)',
      starter: `fun displayName(name: String, nickname: String?): String = TODO("the trimmed nickname, or the name")

fun lengthOrMinusOne(s: String?): Int = TODO("the length, or -1 for null")

fun main() {
    println(displayName("Ravi", " Rav "))
    println(displayName("Ravi", null))
    println(lengthOrMinusOne(null))
}`,
      solution: `fun displayName(name: String, nickname: String?): String = nickname?.trim() ?: name

fun lengthOrMinusOne(s: String?): Int = s?.length ?: -1

fun main() {
    println(displayName("Ravi", " Rav "))
    println(displayName("Ravi", null))
    println(lengthOrMinusOne(null))
}`,
      hints: [
        '`nickname?.trim()` is the trimmed nickname, or `null` when there is none. What gives a default for a null?',
        '`a ?: b` is `a`, or `b` when `a` is null: `s?.length ?: -1`.'
      ],
      checks: [
        { label: '`displayName("Ravi", " Rav ")` is `"Rav"`', code: 'eq(displayName("Ravi", " Rav "), "Rav")' },
        { label: '`displayName("Ravi", null)` is `"Ravi"`', code: 'eq(displayName("Ravi", null), "Ravi")' },
        { label: '`lengthOrMinusOne(null)` is -1', code: 'eq(lengthOrMinusOne(null), -1)' },
        { label: '`lengthOrMinusOne("abc")` is 3 and `lengthOrMinusOne("")` is 0', code: 'eq(listOf(lengthOrMinusOne("abc"), lengthOrMinusOne("")), listOf(3, 0))' },
        { label: 'No `!!`', code: 'ok(!uses("""!!"""), "handle the null with ?. and ?: instead of !!")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 9 */
  L.push({
    id: 'kt-exceptions', track: 'basics', title: 'Exceptions',
    summary: 'throw, try, catch and finally as in Java, but no checked exceptions; try is an expression; require, check and error; runCatching and Result; use for closing.',
    keywords: ['exception', 'try', 'catch', 'finally', 'throw', 'checked exception', 'throws', 'require', 'check', 'runCatching', 'Result', 'use', 'try-with-resources'],
    docs: 'https://kotlinlang.org/docs/exceptions.html',
    body: [
      '## The same throw, try and catch',
      '`throw`, `try`, `catch` and `finally` look as they do in Java, without the `new`:',
      kt(`fun main() {
    try {
        val n = "abc".toInt()
        println(n)
    } catch (e: NumberFormatException) {
        println("Not a number: \${e.message}")
    } finally {
        println("finally runs either way")
    }
}`),
      out(`Not a number: For input string: "abc"
finally runs either way`),
      '`catch (e: NumberFormatException)` names the exception first and its type second, as declarations do everywhere in Kotlin. To catch several types, write one `catch` for each, or catch a common supertype and use `when (e) { is … }`.',
      '## No checked exceptions',
      'Kotlin has no checked exceptions. Nothing forces you to catch or declare an `IOException`, and a function has no `throws` clause. You catch an exception where you can do something about it, and let it travel up otherwise. Why, and what a Java caller sees: [[q:checked-exceptions]].',
      kt(`import java.io.File

fun firstLine(path: String): String = File(path).readLines().first()

fun main() {
    try {
        println(firstLine("no-such-file.txt"))
    } catch (e: java.io.FileNotFoundException) {
        println("No such file")
    }
}`),
      out('No such file'),
      'Java would make `firstLine` say `throws IOException`. Kotlin does not.',
      '## try is an expression',
      'Like `if` and `when`, `try` gives a value: the last expression of the `try` block, or of the `catch` block that ran. And `throw` is an expression whose type is `Nothing`, so it fits anywhere a value is expected, such as after `?:`:',
      kt(`fun parse(text: String): Int = try {
    text.toInt()
} catch (e: NumberFormatException) {
    0
}

fun main() {
    println(parse("12"))
    println(parse("twelve"))
    val age: Int? = null
    val checked = try { age ?: throw IllegalStateException("no age") } catch (e: IllegalStateException) { -1 }
    println(checked)
}`),
      out(`12
0
-1`),
      '## require, check and error',
      'Three standard functions throw for you, each with a message you choose. `require` checks an argument (`IllegalArgumentException`), `check` checks the state (`IllegalStateException`), and `error` always throws (`IllegalStateException`):',
      kt(`fun withdraw(balance: Int, amount: Int): Int {
    require(amount > 0) { "amount must be positive, was $amount" }
    check(balance >= amount) { "not enough money" }
    return balance - amount
}

fun main() {
    println(withdraw(100, 30))
    try {
        withdraw(100, -5)
    } catch (e: IllegalArgumentException) {
        println(e.message)
    }
    try {
        withdraw(10, 30)
    } catch (e: IllegalStateException) {
        println(e.message)
    }
}`),
      out(`70
amount must be positive, was -5
not enough money`),
      '## runCatching and Result',
      '`runCatching { … }` runs the block and catches any exception into a `Result`, which you then ask: `getOrNull()`, `getOrElse { … }`, `isSuccess`, `exceptionOrNull()`.',
      kt(`fun main() {
    val good = runCatching { "7".toInt() }
    val bad = runCatching { "seven".toInt() }
    println(good.getOrNull())
    println(bad.getOrNull())
    println(bad.getOrElse { -1 })
    println(bad.exceptionOrNull()?.javaClass?.simpleName)
}`),
      out(`7
null
-1
NumberFormatException`),
      '`runCatching` catches everything, including exceptions you did not expect, so prefer a plain `try` with the type you mean. For text that may not be a number, `toIntOrNull()` is simpler still: no exception at all.',
      '## use closes things',
      '`use` is Java\'s try-with-resources. It runs the block and closes the resource afterwards, even when the block throws.',
      kt(`import java.io.File

fun main() {
    File("notes.txt").writeText("first\\nsecond\\n")
    val first = File("notes.txt").bufferedReader().use { it.readLine() }
    println(first)
}`),
      out('first')
    ].join('\n\n'),
    java: '| Java | Kotlin |\n|---|---|\n| `throw new IllegalArgumentException("x")` | `throw IllegalArgumentException("x")` |\n| `catch (NumberFormatException e)` | `catch (e: NumberFormatException)` |\n| `void read() throws IOException` | `fun read()`: nothing to declare |\n| `try (var r = new FileReader(f)) { … }` | `FileReader(f).use { r -> … }` |\n| `Objects.requireNonNull`, Guava\'s `checkArgument` | `requireNotNull`, `require`, `check` |\n\nA Java caller of a Kotlin function cannot catch a checked exception it is not told about: `javac` refuses `catch (IOException e)` around a call that does not declare it. `@Throws(IOException::class)` on the Kotlin function adds the `throws` clause for Java.',
    example: {
      code: `fun main() {
    val inputs = listOf("10", "x", "25", "")
    var total = 0
    for (text in inputs) {
        val n = text.toIntOrNull()
        if (n == null) {
            println("skipping '$text'")
            continue
        }
        total += n
    }
    println("total $total")
}`,
      note: 'Replace `toIntOrNull()` with `toInt()` and run: the first bad input stops the program. Then wrap the loop body in `try` / `catch`.'
    },
    challenge: {
      title: 'Fail safely',
      task: 'Three small functions, each handling a failure in its own way:\n\n- `parseOrDefault(text, default)`: the number in `text` (spaces around it allowed), or `default` when it is not a number. Use `toIntOrNull()`: no `try` needed.\n- `safeDivide(a, b)`: `a / b`, or `null` when `b` is 0. Use `try` as an expression, catching `ArithmeticException`.\n- `checkedAge(age)`: returns `age`, but throws `IllegalArgumentException` with the message `age must not be negative: -3` (for -3) when `age` is negative. Use `require`.',
      starter: `fun parseOrDefault(text: String, default: Int): Int = TODO()

fun safeDivide(a: Int, b: Int): Int? = TODO()

fun checkedAge(age: Int): Int = TODO()

fun main() {
    println(parseOrDefault(" 42 ", 0))
    println(safeDivide(1, 0))
}`,
      solution: `fun parseOrDefault(text: String, default: Int): Int = text.trim().toIntOrNull() ?: default

fun safeDivide(a: Int, b: Int): Int? = try {
    a / b
} catch (e: ArithmeticException) {
    null
}

fun checkedAge(age: Int): Int {
    require(age >= 0) { "age must not be negative: $age" }
    return age
}

fun main() {
    println(parseOrDefault(" 42 ", 0))
    println(parseOrDefault("forty", 0))
    println(safeDivide(10, 2))
    println(safeDivide(1, 0))
    println(runCatching { checkedAge(-3) }.exceptionOrNull()?.message)
}`,
      hints: [
        '`text.trim().toIntOrNull()` is the number or `null`; `?: default` turns the null into the default.',
        '`try { a / b } catch (e: ArithmeticException) { null }` is a value: put it after `=`. And `require(age >= 0) { "…" }` throws with the message the block returns.'
      ],
      checks: [
        { label: '`parseOrDefault(" 42 ", 0)` is 42', code: 'eq(parseOrDefault(" 42 ", 0), 42)' },
        { label: '`parseOrDefault("forty", -1)` is -1', code: 'eq(parseOrDefault("forty", -1), -1)' },
        { label: '`safeDivide(10, 2)` is 5 and `safeDivide(1, 0)` is null', code: 'eq(listOf(safeDivide(10, 2), safeDivide(1, 0)), listOf(5, null))' },
        { label: '`checkedAge(-3)` throws `IllegalArgumentException` saying `age must not be negative: -3`',
          code: 'val e = runCatching { checkedAge(-3) }.exceptionOrNull()\nok(e is IllegalArgumentException, "checkedAge(-3) should throw IllegalArgumentException; it threw ${e?.javaClass?.simpleName}")\neq(e?.message, "age must not be negative: -3")' },
        { label: '`checkedAge(30)` is 30', code: 'eq(checkedAge(30), 30)' },
        { label: '`parseOrDefault` uses `toIntOrNull()`, not a `catch`', code: 'ok(uses("""toIntOrNull""") && !uses("""NumberFormatException"""), "text.trim().toIntOrNull() ?: default needs no try")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 10 */
  L.push({
    id: 'kt-collections', track: 'basics', title: 'Collections: lists, sets and maps',
    summary: 'Read-only List, Set and Map next to their Mutable twins, made with listOf, mutableListOf, mapOf and "a" to 1; the everyday operations; read-only is not immutable.',
    keywords: ['list', 'set', 'map', 'collection', 'listOf', 'mutableListOf', 'mapOf', 'pair', 'to', 'read-only', 'immutable', 'array', 'ArrayList', 'HashMap'],
    docs: 'https://kotlinlang.org/docs/collections-overview.html',
    body: [
      '## Read-only and mutable',
      'Kotlin splits each collection interface in two. `List`, `Set` and `Map` can only be read: they have no `add`, no `remove`, no `put`. `MutableList`, `MutableSet` and `MutableMap` add those. `listOf`, `setOf` and `mapOf` make read-only ones; `mutableListOf` and its friends make mutable ones:',
      kt(`fun main() {
    val fruits = listOf("apple", "banana")
    val basket = mutableListOf("apple")
    basket.add("cherry")
    basket += "date"
    println(fruits)
    println(basket)
    println(fruits + "fig")
    println(fruits)
}`),
      out(`[apple, banana]
[apple, cherry, date]
[apple, banana, fig]
[apple, banana]`),
      '`fruits.add("fig")` would not compile. `fruits + "fig"` makes a *new* list and leaves `fruits` alone.',
      '## Read-only is not immutable',
      'A `List` is a read-only *view*: the object behind it may be a `MutableList` that other code changes. Kotlin\'s collections are Java\'s at run time (`listOf` gives a `java.util.List`), so a Java method can try to change one too. [[q:read-only-collections]] has the details.',
      kt(`fun main() {
    val source = mutableListOf(1, 2)
    val view: List<Int> = source
    source.add(3)
    println(view)
}`),
      out('[1, 2, 3]'),
      '## Lists',
      kt(`fun main() {
    val scores = listOf(70, 95, 82)
    println(scores[0])
    println(scores.size)
    println(scores.first())
    println(scores.last())
    println(95 in scores)
    println(scores.indexOf(82))
    println(scores.sum())
    println(scores.max())
    println(scores.sorted())
    println(scores.sortedDescending())
    println(scores.joinToString(" | "))
    println(scores.getOrNull(10))
}`),
      out(`70
3
70
82
true
2
247
95
[70, 82, 95]
[95, 82, 70]
70 | 95 | 82
null`),
      '`sorted()` returns a new, sorted list. A `MutableList` also has `sort()`, which sorts it in place, as Java\'s `Collections.sort` does. `scores[10]` would throw `IndexOutOfBoundsException`; `getOrNull(10)` gives `null` instead.',
      '## Sets',
      kt(`fun main() {
    val tags = mutableSetOf("kotlin", "java")
    tags.add("kotlin")
    println(tags)
    println(tags.size)
    println(setOf(1, 2, 3) intersect setOf(2, 3, 4))
}`),
      out(`[kotlin, java]
2
[2, 3]`),
      '`setOf` and `mutableSetOf` keep the order the items were added in (they are `LinkedHashSet`s); `hashSetOf` promises no order.',
      '## Maps',
      '`"a" to 1` makes a `Pair`, and `mapOf` takes pairs. Reading with `map[key]` gives a nullable value, because the key may be missing:',
      kt(`fun main() {
    val ages = mutableMapOf("Asha" to 31, "Ravi" to 28)
    ages["Li"] = 25
    ages["Asha"] = 32
    println(ages)
    println(ages["Ravi"])
    println(ages["Zoe"])
    println(ages.getOrDefault("Zoe", 0))
    println(ages["Zoe"] ?: 0)
    for ((name, age) in ages) println("$name is $age")
    println(ages.keys)
    println(ages.values)
}`),
      out(`{Asha=32, Ravi=28, Li=25}
28
null
0
0
Asha is 32
Ravi is 28
Li is 25
[Asha, Ravi, Li]
[32, 28, 25]`),
      '`map[key] = value` is `put`. `mapOf` and `mutableMapOf` keep the order the entries were added in (a `LinkedHashMap`).',
      '## Arrays',
      'Arrays exist too: `arrayOf("a", "b")` is a `String[]`, and `intArrayOf(1, 2)` an `int[]` with no boxing. Use them for Java interop and for speed; in everyday code, use lists.',
      'The [[track:functional]] track adds the operations that make collections shine: `map`, `filter`, `groupBy`, `associate` and the rest.'
    ].join('\n\n'),
    java: '| Java | Kotlin |\n|---|---|\n| `List.of("a", "b")` (unmodifiable) | `listOf("a", "b")` (read-only) |\n| `new ArrayList<>(List.of("a"))` | `mutableListOf("a")` |\n| `Map.of("a", 1)` | `mapOf("a" to 1)` |\n| `map.put(k, v)`, `map.get(k)` | `map[k] = v`, `map[k]` (nullable) |\n| `list.get(0)` | `list[0]` |\n| `list.size()` | `list.size` |\n| `for (Map.Entry<String, Integer> e : map.entrySet())` | `for ((k, v) in map)` |\n\nJava\'s `List.of` throws when you call `add`. Kotlin\'s `List` has no `add` to call, so the mistake is a compile error.',
    example: {
      code: `fun main() {
    val cart = mutableMapOf<String, Int>()
    cart["apples"] = 3
    cart["pears"] = 1
    cart["apples"] = (cart["apples"] ?: 0) + 2
    println(cart)
    var items = 0
    for ((_, count) in cart) items += count
    println("$items items")
}`,
      note: '`_` skips the part of the pair you do not need. Add bananas to the cart and run.'
    },
    challenge: {
      title: 'Count words, keep the original',
      task: '1. Write `wordCounts(text)`: how many times each word appears, ignoring case. `wordCounts("the cat and the hat")` is `{the=2, cat=1, and=1, hat=1}`. Lower-case the text, `split(" ")` it, skip empty words, and count into the `mutableMapOf<String, Int>()` the starter makes: `counts[word] = (counts[word] ?: 0) + 1`.\n2. In `main`, `scores` is a `MutableList`. Make a sorted copy, then print `scores`, the copy, and the highest score, without changing `scores`:\n\n' + text(`[70, 95, 82]
[70, 82, 95]
Top: 95`),
      starter: `fun wordCounts(text: String): Map<String, Int> {
    val counts = mutableMapOf<String, Int>()
    // lower-case the text, split it on " ", skip empty words, count each one
    return counts
}

fun main() {
    val scores = mutableListOf(70, 95, 82)
    // make a sorted copy, then print scores, the copy, and "Top: 95"
}`,
      solution: `fun wordCounts(text: String): Map<String, Int> {
    val counts = mutableMapOf<String, Int>()
    for (word in text.lowercase().split(" ")) {
        if (word.isEmpty()) continue
        counts[word] = (counts[word] ?: 0) + 1
    }
    return counts
}

fun main() {
    val scores = mutableListOf(70, 95, 82)
    val sorted = scores.sorted()
    println(scores)
    println(sorted)
    println("Top: \${scores.max()}")
}`,
      hints: [
        '`counts[word]` is the count so far, or `null` the first time; `?: 0` makes that 0. Then add one and store it back.',
        '`sorted()` gives a new list; `sort()` would change `scores` itself. `max()` is the largest element.'
      ],
      checks: [
        { label: '`wordCounts("the cat and the hat")` counts `the` twice', code: 'eq(wordCounts("the cat and the hat"), mapOf("the" to 2, "cat" to 1, "and" to 1, "hat" to 1))' },
        { label: 'Case is ignored: `wordCounts("Go go GO")` is `{go=3}`', code: 'eq(wordCounts("Go go GO"), mapOf("go" to 3))' },
        { label: 'Empty words are skipped: `wordCounts("a  b")` is `{a=1, b=1}`', code: 'eq(wordCounts("a  b"), mapOf("a" to 1, "b" to 1))' },
        { label: '`main` prints `scores` unchanged, then the sorted copy', code: 'eq(lines.take(2), listOf("[70, 95, 82]", "[70, 82, 95]"))' },
        { label: 'The last line is `Top: 95`', code: 'eq(lines.getOrNull(2), "Top: 95")' }
      ]
    }
  });
})(window.KLT);
