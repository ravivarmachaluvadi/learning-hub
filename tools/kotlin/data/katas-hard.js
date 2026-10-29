/*
 * Practice (batch 5), part 3: the Hard katas. The kata shape is described at the top of data/katas-easy.js.
 * The coroutine and Flow katas are checked on runTest's fake clock: "400 ms" is exact on any PC.
 */
(function (U) {
  'use strict';
  var K = U.data.katas = U.data.katas || [];

  K.push(
    {
      id: 'course-order', level: 'Hard', kind: 'pattern', title: 'Course order (topological sort)',
      summary: 'An order to take courses in, each after its prerequisites, or null for a cycle: Kahn\'s algorithm with a priority queue.',
      patterns: ['graphs', 'heap'], keywords: ['topological sort', 'kahn', 'prerequisites', 'dependencies', 'cycle', 'PriorityQueue', 'buildMap', 'getOrPut'],
      learn: ['lesson:kt-collection-ops', 'lesson:kt-build-functions', 'lesson:kt-scope-functions', 'ref:getorput'],
      java: 'Kahn\'s algorithm in Java is the same: a `Map<String, Integer>` of how many prerequisites each course still waits for, a `Map<String, List<String>>` of what each course unlocks, and a queue of courses with nothing left to wait for (a `PriorityQueue`, so the order is unique). Kotlin builds the maps with `associateWith` and `buildMap { getOrPut(…) { mutableListOf() } += … }`, and `takeIf { … }` turns "not every course was taken" into `null`.',
      task: 'Write `courseOrder(courses, prereqs)`. Each pair `a to b` in `prereqs` means course `b` must be taken before course `a`. Return the courses in an order that takes every course after all of its prerequisites; when several courses could come next, take them in **alphabetical** order, so the answer is unique. When the prerequisites go round in a cycle, there is no such order: return `null`.\n\n`courseOrder(listOf("physics", "calculus", "algebra"), listOf("calculus" to "algebra", "physics" to "calculus"))` is `[algebra, calculus, physics]`.',
      starter: `fun courseOrder(courses: List<String>, prereqs: List<Pair<String, String>>): List<String>? = courses.sorted()

fun main() {
    println(courseOrder(listOf("physics", "calculus", "algebra"), listOf("calculus" to "algebra", "physics" to "calculus")))
    println(courseOrder(listOf("a", "b"), listOf("a" to "b", "b" to "a")))
}
`,
      solution: `import java.util.PriorityQueue

fun courseOrder(courses: List<String>, prereqs: List<Pair<String, String>>): List<String>? {
    val waiting = courses.associateWith { 0 }.toMutableMap()        // how many prerequisites are not taken yet
    val unlocks = buildMap<String, MutableList<String>> {
        for ((course, before) in prereqs) {
            getOrPut(before) { mutableListOf() } += course
            waiting[course] = waiting.getValue(course) + 1
        }
    }
    val ready = PriorityQueue(waiting.filterValues { it == 0 }.keys)
    val order = mutableListOf<String>()
    while (ready.isNotEmpty()) {
        val c = ready.poll()
        order += c
        for (next in unlocks[c].orEmpty()) {
            waiting[next] = waiting.getValue(next) - 1
            if (waiting[next] == 0) ready += next
        }
    }
    return order.takeIf { it.size == courses.size }
}

fun main() {
    println(courseOrder(listOf("physics", "calculus", "algebra"), listOf("calculus" to "algebra", "physics" to "calculus")))
    println(courseOrder(listOf("a", "b"), listOf("a" to "b", "b" to "a")))
}
`,
      hints: [
        'Count, for each course, how many prerequisites it still waits for. The courses waiting for nothing can be taken now.',
        'Take the alphabetically first of those (a `PriorityQueue<String>` keeps them in order). Taking it unlocks the courses that waited for it: lower each one\'s count, and a count reaching 0 means it is ready too.',
        'Courses on a cycle never reach 0, so when the queue runs dry before every course is taken, there is a cycle: `order.takeIf { it.size == courses.size }`.'
      ],
      checks: [
        { label: 'A chain: algebra, then calculus, then physics', code: `eq(courseOrder(listOf("physics", "calculus", "algebra"), listOf("calculus" to "algebra", "physics" to "calculus")), listOf("algebra", "calculus", "physics"))` },
        { label: 'When several are ready, alphabetical order', code: `eq(courseOrder(listOf("z", "y", "x", "a"), listOf("a" to "z")), listOf("x", "y", "z", "a"))` },
        { label: 'A cycle: `null`', code: `eq(courseOrder(listOf("a", "b", "c"), listOf("a" to "b", "b" to "c", "c" to "a")), null)` },
        { label: 'No prerequisites: alphabetical; no courses: none', code: `eq(courseOrder(listOf("b", "a"), emptyList()), listOf("a", "b"))
eq(courseOrder(emptyList(), emptyList()), emptyList<String>())` },
        { label: 'A diamond: the shared course once, after both of its prerequisites', code: `eq(courseOrder(listOf("top", "left", "right", "base"), listOf("left" to "base", "right" to "base", "top" to "left", "top" to "right")), listOf("base", "left", "right", "top"))` },
        { label: '5,000 courses in a chain', code: `val names = List(5_000) { "c%04d".format(it) }
val chain = (1 until 5_000).map { names[it] to names[it - 1] }
eq(courseOrder(names.reversed(), chain), names)` }
      ]
    },
    {
      id: 'edit-distance', level: 'Hard', kind: 'pattern', title: 'Edit distance',
      summary: 'The fewest single-letter inserts, deletes and replacements from one word to another: a dynamic-programming table.',
      patterns: ['dp', 'strings'], keywords: ['edit distance', 'levenshtein', 'dynamic programming', 'table', 'IntArray', 'minOf'],
      learn: ['lesson:kt-loops', 'lesson:kt-collections', 'lesson:kt-conditions'],
      java: 'The same table in Java is an `int[][]`. Kotlin builds it with `Array(rows) { IntArray(cols) }`; `0..a.length` includes its end, where Java\'s loop says `<=`; and `minOf` takes three values at once. Each cell depends only on its left, upper and upper-left neighbours, which is why filling the table row by row works.',
      task: 'Write `editDistance(a, b)`: the fewest single-character edits (insert a character, delete one, or replace one with another) that turn `a` into `b`. `"kitten"` to `"sitting"` is 3, and `"flaw"` to `"lawn"` is 2.\n\nOne check compares two strings of 2,000 letters, so trying every way of editing is far too slow: fill a table where `d[i][j]` is the distance between the first `i` letters of `a` and the first `j` letters of `b`.',
      starter: `fun editDistance(a: String, b: String): Int {
    var diff = kotlin.math.abs(a.length - b.length)
    for (i in 0 until minOf(a.length, b.length)) {
        if (a[i] != b[i]) diff++
    }
    return diff
}

fun main() {
    println(editDistance("kitten", "sitting"))
    println(editDistance("flaw", "lawn"))
}
`,
      solution: `fun editDistance(a: String, b: String): Int {
    // d[i][j]: the distance between the first i letters of a and the first j letters of b
    val d = Array(a.length + 1) { IntArray(b.length + 1) }
    for (i in 0..a.length) d[i][0] = i
    for (j in 0..b.length) d[0][j] = j
    for (i in 1..a.length) {
        for (j in 1..b.length) {
            d[i][j] = if (a[i - 1] == b[j - 1]) d[i - 1][j - 1]
            else 1 + minOf(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1])
        }
    }
    return d[a.length][b.length]
}

fun main() {
    println(editDistance("kitten", "sitting"))
    println(editDistance("flaw", "lawn"))
}
`,
      hints: [
        'Comparing position by position misses an insert or a delete: after one, every later letter is shifted.',
        'From `""` to the first `j` letters of `b` takes `j` inserts, so `d[0][j] = j`, and `d[i][0] = i` deletes.',
        'For the rest: equal last letters cost nothing more (`d[i-1][j-1]`); otherwise 1 plus the cheapest of a delete (`d[i-1][j]`), an insert (`d[i][j-1]`) and a replacement (`d[i-1][j-1]`).'
      ],
      checks: [
        { label: '`"kitten"` to `"sitting"`: 3', code: `eq(editDistance("kitten", "sitting"), 3)` },
        { label: '`"flaw"` to `"lawn"`: 2 (delete f, add n)', code: `eq(editDistance("flaw", "lawn"), 2)` },
        { label: 'From or to an empty string: the other one\'s length; the same word: 0', code: `eq(editDistance("", "abc"), 3)
eq(editDistance("abc", ""), 3)
eq(editDistance("same", "same"), 0)` },
        { label: '`"intention"` to `"execution"`: 5', code: `eq(editDistance("intention", "execution"), 5)` },
        { label: 'Two strings of 2,000 letters with no letter in common, quickly', code: `eq(editDistance("ab".repeat(1_000), "cd".repeat(1_000)), 2_000)` }
      ]
    },
    {
      id: 'coin-change', level: 'Hard', kind: 'pattern', title: 'Fewest coins',
      summary: 'The fewest coins that make an amount, or null when it cannot be made: dynamic programming over every smaller amount.',
      patterns: ['dp'], keywords: ['coin change', 'dynamic programming', 'greedy', 'IntArray', 'takeIf', 'nullable result'],
      learn: ['lesson:kt-loops', 'lesson:kt-null-safety', 'lesson:kt-numbers', 'ref:takeif'],
      java: 'The same table in Java is an `int[]` filled with a large number. Here `Int.MAX_VALUE` means "cannot be made", so it must be checked before adding 1 (it would wrap round to the smallest `Int`), and the answer is an `Int?`: `takeIf` turns the marker into `null` at the end, so callers never see a magic value such as -1.',
      task: 'Write `fewestCoins(coins, amount)`: the fewest coins adding up to exactly `amount`, using each coin value as often as you like, or `null` when it cannot be done. `fewestCoins(listOf(1, 2, 5), 11)` is 3 (5 + 5 + 1); `fewestCoins(listOf(2), 3)` is `null`; an amount of 0 takes 0 coins.\n\nThe starter takes the largest coin first, as a cashier would. That is not always the fewest. Work out the fewest for every amount from 0 up: the fewest for `a` is one coin `c` plus the fewest for `a - c`.',
      starter: `fun fewestCoins(coins: List<Int>, amount: Int): Int? {
    var left = amount
    var count = 0
    for (c in coins.sortedDescending()) {
        count += left / c
        left %= c
    }
    return if (left == 0) count else null
}

fun main() {
    println(fewestCoins(listOf(1, 2, 5), 11))
    println(fewestCoins(listOf(1, 3, 4), 6))
}
`,
      solution: `fun fewestCoins(coins: List<Int>, amount: Int): Int? {
    val best = IntArray(amount + 1) { Int.MAX_VALUE }      // best[a]: the fewest coins for a; MAX_VALUE: it cannot be made
    best[0] = 0
    for (a in 1..amount) {
        for (c in coins) {
            if (c <= a && best[a - c] != Int.MAX_VALUE) best[a] = minOf(best[a], best[a - c] + 1)
        }
    }
    return best[amount].takeIf { it != Int.MAX_VALUE }
}

fun main() {
    println(fewestCoins(listOf(1, 2, 5), 11))
    println(fewestCoins(listOf(1, 3, 4), 6))
}
`,
      hints: [
        'Largest first fails for `[1, 3, 4]` and 6: 4 + 1 + 1 is three coins, 3 + 3 is two.',
        'Keep `best[a]`, the fewest coins for every amount `a` from 0 to `amount`; `best[0] = 0`. For each `a`, try every coin `c <= a`: `best[a - c] + 1`.',
        'Mark the amounts that cannot be made (`Int.MAX_VALUE`), skip them, and turn the marker into `null` at the end: `best[amount].takeIf { it != Int.MAX_VALUE }`.'
      ],
      checks: [
        { label: '`[1, 2, 5]` and 11: 3 coins', code: `eq(fewestCoins(listOf(1, 2, 5), 11), 3)` },
        { label: 'Largest first is not enough: `[1, 3, 4]` and 6 is 2 (3 + 3)', code: `eq(fewestCoins(listOf(1, 3, 4), 6), 2)
eq(fewestCoins(listOf(7, 13), 9_999), 771)` },
        { label: 'It cannot be done: `null`', code: `eq(fewestCoins(listOf(2), 3), null)
eq(fewestCoins(listOf(5, 10), 7), null)` },
        { label: 'An amount of 0 takes 0 coins', code: `eq(fewestCoins(listOf(3), 0), 0)` },
        { label: 'An amount of 10,000, quickly', code: `eq(fewestCoins(listOf(1, 7, 23, 89, 101), 10_000), 100)` }
      ]
    },
    {
      id: 'merge-k-sorted', level: 'Hard', kind: 'pattern', title: 'Merge k sorted sequences, lazily',
      summary: 'Several sorted, possibly endless, sequences merged into one sorted sequence: sequence { yield } over a PriorityQueue.',
      patterns: ['sequences', 'heap'], keywords: ['merge k sorted', 'priority queue', 'heap', 'sequence', 'yield', 'lazy', 'infinite', 'generateSequence'],
      learn: ['lesson:kt-sequences', 'lesson:kt-generics', 'ref:sequence', 'ref:generatesequence'],
      java: 'Java merges k sorted lists with a `PriorityQueue` of iterators too, but to be lazy it needs a hand-written `Iterator` class with `hasNext` and `next`. Kotlin\'s `sequence { }` lets you write the loop straight through: `yield(value)` hands a value to the caller and pauses right there until the next one is asked for. That is why endless sources work.',
      task: 'Each sequence in `sources` is sorted from smallest to largest, and may never end. Write `mergeSorted(sources)`: one sequence holding all their values, smallest first, read **lazily**: a value is taken from a source only when the merged sequence needs it.\n\n`mergeSorted(listOf(sequenceOf(1, 4, 7), sequenceOf(2, 5))).toList()` is `[1, 2, 4, 5, 7]`, and `mergeSorted(listOf(multiplesOf3, multiplesOf5)).take(4)` is `[3, 5, 6, 9]`, though both sources are endless.\n\nBuild it with `sequence { … yield(…) … }`: keep each source\'s next value in a `PriorityQueue`, smallest on top.',
      starter: `fun mergeSorted(sources: List<Sequence<Int>>): Sequence<Int> =
    sources.flatMap { it.toList() }.sorted().asSequence()

fun main() {
    println(mergeSorted(listOf(sequenceOf(1, 4, 7), sequenceOf(2, 5))).toList())
}
`,
      solution: `import java.util.PriorityQueue

fun mergeSorted(sources: List<Sequence<Int>>): Sequence<Int> = sequence {
    // each source's next value, with the rest of that source, smallest value on top
    val heads = PriorityQueue<Pair<Int, Iterator<Int>>>(compareBy { it.first })
    for (s in sources) {
        val rest = s.iterator()
        if (rest.hasNext()) heads += rest.next() to rest
    }
    while (heads.isNotEmpty()) {
        val (value, rest) = heads.poll()
        yield(value)
        if (rest.hasNext()) heads += rest.next() to rest
    }
}

fun main() {
    println(mergeSorted(listOf(sequenceOf(1, 4, 7), sequenceOf(2, 5))).toList())
}
`,
      hints: [
        '`toList()` on an endless sequence never returns. Take only what is needed: the first value of each source.',
        'Keep `value to iterator` pairs in a `PriorityQueue` ordered by the value. The smallest on top is the next value of the merge.',
        'In `sequence { }`: `poll()` the smallest, `yield` its value, then put back that source\'s next value, if it has one. Ask for the next value only after the `yield`, so nothing is read before it is needed.'
      ],
      checks: [
        { label: 'Three finite sources: one sorted sequence', code: `eq(mergeSorted(listOf(sequenceOf(1, 4, 7), sequenceOf(2, 5), sequenceOf(3, 6, 8, 9))).toList(), (1..9).toList())` },
        { label: 'Equal values all kept; empty sources and no sources at all', code: `eq(mergeSorted(listOf(sequenceOf(1, 1), emptySequence(), sequenceOf(1, 2))).toList(), listOf(1, 1, 1, 2))
eq(mergeSorted(emptyList()).toList(), emptyList<Int>())` },
        { label: 'Endless sources: the first ten multiples of 3 and of 5', code: `val threes = generateSequence(3) { it + 3 }
val fives = generateSequence(5) { it + 5 }
eq(mergeSorted(listOf(threes, fives)).take(10).toList(), listOf(3, 5, 6, 9, 10, 12, 15, 15, 18, 20))` },
        { label: 'Lazy: taking 5 values from 4 sources reads at most 8 values from them', code: `var read = 0
val sources = List(4) { k -> generateSequence(k) { it + 4 }.onEach { read++ } }
eq(mergeSorted(sources).take(5).toList(), listOf(0, 1, 2, 3, 4))
ok(read <= 8, "read $read values from the sources to give 5: the 4 first values, then one after each value given but the last")` },
        { label: 'Built with `sequence { … yield(…) … }`', idiom: true, code: `ok(uses("""\\bsequence\\s*\\{""") && uses("""\\byield\\s*\\("""), "build the result with sequence { … yield(value) … }")` }
      ]
    },
    {
      id: 'calculator', level: 'Hard', kind: 'pattern', title: 'A calculator without eval',
      summary: 'Integers, + - * /, brackets and unary minus, with * before +: tokens as a sealed interface and a recursive-descent parser.',
      patterns: ['parsing', 'recursion'], keywords: ['calculator', 'expression', 'parser', 'recursive descent', 'tokenizer', 'precedence', 'sealed interface', 'grammar'],
      learn: ['lesson:kt-sealed', 'lesson:kt-data-classes', 'lesson:kt-exceptions', 'lesson:kt-conditions'],
      java: 'In Java the tokens would be a class hierarchy (or Java 21\'s sealed interface with records), and the parser the same three methods calling each other, one per level of precedence. Kotlin\'s data classes make `Op(\'(\')` a value you can compare with `==` and use straight in a `when` branch, and `error(…)` and `check(…)` throw with a message in one call.',
      task: 'Write `evaluate(expr)`: the value of an arithmetic expression of whole numbers, `+`, `-`, `*`, `/` and brackets, with spaces anywhere. `*` and `/` go before `+` and `-`; operators of the same level go left to right; `/` is whole-number division; a `-` before a number or a bracket makes it negative. `evaluate("2 + 3 * 4")` is 14, `evaluate("(2 + 3) * 4")` is 20, `evaluate("-(2 + 3)")` is -5. A broken expression, such as `"(1 + 2"`, throws an exception.\n\nSplit the text into tokens (a `sealed interface Token`: numbers and operators), then parse with one function per level:\n\n```text\nexpression = term   (("+" | "-") term)*\nterm       = factor (("*" | "/") factor)*\nfactor     = number | "-" factor | "(" expression ")"\n```',
      starter: `fun evaluate(expr: String): Int {
    val parts = expr.replace(" ", "")
    var result = 0
    var op = '+'
    var number = 0
    for (c in parts + "+") {
        if (c.isDigit()) {
            number = number * 10 + (c - '0')
        } else {
            result = when (op) {
                '+' -> result + number
                '-' -> result - number
                '*' -> result * number
                else -> result / number
            }
            op = c
            number = 0
        }
    }
    return result
}

fun main() {
    println(evaluate("2 + 3 * 4"))
    println(evaluate("(2 + 3) * 4"))
    println(evaluate("-(2 + 3) * 2"))
}
`,
      solution: `sealed interface Token
data class Num(val value: Int) : Token
data class Op(val symbol: Char) : Token

fun tokenize(expr: String): List<Token> {
    val tokens = mutableListOf<Token>()
    var i = 0
    while (i < expr.length) {
        val c = expr[i]
        when {
            c.isWhitespace() -> i++
            c.isDigit() -> {
                val start = i
                while (i < expr.length && expr[i].isDigit()) i++
                tokens += Num(expr.substring(start, i).toInt())
            }
            c in "+-*/()" -> { tokens += Op(c); i++ }
            else -> error("unexpected '$c' at position \${i + 1}")
        }
    }
    return tokens
}

class Parser(private val tokens: List<Token>) {
    private var pos = 0
    private fun next(): Token = tokens.getOrNull(pos++) ?: error("the expression ends too early")
    private fun eat(symbol: Char): Boolean = (tokens.getOrNull(pos) == Op(symbol)).also { if (it) pos++ }

    // expression = term (("+" | "-") term)*
    fun expression(): Int {
        var value = term()
        while (true) {
            value = when {
                eat('+') -> value + term()
                eat('-') -> value - term()
                else -> return value
            }
        }
    }

    // term = factor (("*" | "/") factor)*
    private fun term(): Int {
        var value = factor()
        while (true) {
            value = when {
                eat('*') -> value * factor()
                eat('/') -> value / factor()
                else -> return value
            }
        }
    }

    // factor = number | "-" factor | "(" expression ")"
    private fun factor(): Int = when (val t = next()) {
        is Num -> t.value
        Op('-') -> -factor()
        Op('(') -> expression().also { check(eat(')')) { "a ( is never closed" } }
        else -> error("unexpected '\${(t as Op).symbol}'")
    }

    fun end() = check(pos == tokens.size) { "unexpected text after position $pos" }
}

fun evaluate(expr: String): Int {
    val parser = Parser(tokenize(expr))
    return parser.expression().also { parser.end() }
}

fun main() {
    println(evaluate("2 + 3 * 4"))
    println(evaluate("(2 + 3) * 4"))
    println(evaluate("-(2 + 3) * 2"))
}
`,
      hints: [
        'Reading left to right with one running total cannot give `*` its precedence, or handle brackets. Split the work: tokens first, then a parser.',
        'Tokens: `sealed interface Token`, `data class Num(val value: Int) : Token`, `data class Op(val symbol: Char) : Token`. A number is a run of digits; spaces are skipped.',
        'The parser keeps a position in the token list. `expression()` reads a `term()`, then while the next token is `+` or `-`, another `term()`; `term()` does the same with `factor()` and `*`, `/`; `factor()` is a number, a `-` and another factor, or `(`, an `expression()` and `)`.'
      ],
      checks: [
        { label: '`*` before `+`, and the same level left to right: `"2 + 3 * 4"` is 14, `"10 - 4 - 3"` is 3', code: `eq(evaluate("2 + 3 * 4"), 14)
eq(evaluate("10 - 4 - 3"), 3)` },
        { label: 'Brackets: `"(2 + 3) * 4"` is 20, `"2 * (3 + (4 - 1))"` is 12', code: `eq(evaluate("(2 + 3) * 4"), 20)
eq(evaluate("2 * (3 + (4 - 1))"), 12)` },
        { label: 'Whole-number division, left to right: `"8 / 2 / 2"` is 2, `"7 / 2"` is 3', code: `eq(evaluate("8 / 2 / 2"), 2)
eq(evaluate("7 / 2"), 3)` },
        { label: 'A minus that makes a number negative: `"-3 + 5"` is 2, `"-(2 + 3)"` is -5, `"2 * -3"` is -6', code: `eq(evaluate("-3 + 5"), 2)
eq(evaluate("-(2 + 3)"), -5)
eq(evaluate("2 * -3"), -6)` },
        { label: 'Numbers of several digits, spaces optional: `"12*(3+40)"` is 516', code: `eq(evaluate("12*(3+40)"), 516)` },
        { label: 'A broken expression throws: `"(1 + 2"` and `"1 +"`', code: `ok(runCatching { evaluate("(1 + 2") }.isFailure, "\\"(1 + 2\\" should throw: the ( is never closed")
ok(runCatching { evaluate("1 +") }.isFailure, "\\"1 +\\" should throw: a number is missing")` }
      ]
    },
    {
      id: 'worker-pool', level: 'Hard', kind: 'pattern', title: 'A worker pool over a channel',
      summary: 'Many jobs, at most n running at once, the results in the jobs\' order: a Channel shared by n coroutines, proved on the fake clock.',
      patterns: ['coroutines'], keywords: ['worker pool', 'channel', 'fan-out', 'concurrency limit', 'coroutineScope', 'async', 'awaitAll', 'thread pool', 'runTest'],
      learn: ['lesson:kt-channels', 'lesson:kt-launch-async', 'lesson:kt-structured-concurrency', 'lesson:kt-flow-testing'],
      java: 'In Java this is an `ExecutorService` from `Executors.newFixedThreadPool(3)`, `invokeAll`, and a list of `Future`s in the jobs\' order: three threads. Here three coroutines take jobs from one `Channel`, so at most three run at a time, on no extra threads at all, and `coroutineScope` waits for them (and cancels the rest if one fails). The checks run on `runTest`\'s fake clock, so "400 ms" is exact on any PC.',
      task: 'Write `processAll(jobs, workers, work)`, a `suspend` function: run `work` on every job, with at most `workers` of them running at the same time, and never fewer while jobs are waiting; return the results in the **jobs\' order** (not the order they finished in).\n\nPut the jobs (with their positions: `withIndex()`) into a `Channel`, start `workers` coroutines that each take jobs from it until it is closed, and put the results back in order. The checks run on `runTest`\'s fake clock: 10 jobs of 100 ms with 3 workers take exactly 400 ms.',
      starter: `import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

suspend fun processAll(jobs: List<Int>, workers: Int, work: suspend (Int) -> String): List<String> =
    jobs.map { work(it) }

fun main() = runBlocking {
    val results = processAll(listOf(1, 2, 3, 4, 5), workers = 2) { n -> delay(10L * (6 - n)); "job $n" }
    println(results)
}
`,
      solution: `import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

suspend fun processAll(jobs: List<Int>, workers: Int, work: suspend (Int) -> String): List<String> = coroutineScope {
    val queue = Channel<IndexedValue<Int>>()
    launch {
        jobs.withIndex().forEach { queue.send(it) }
        queue.close()                       // the workers' loops end when the channel is empty and closed
    }
    List(workers) {
        async { buildList { for ((i, job) in queue) add(i to work(job)) } }
    }.awaitAll().flatten().sortedBy { it.first }.map { it.second }
}

fun main() = runBlocking {
    val results = processAll(listOf(1, 2, 3, 4, 5), workers = 2) { n -> delay(10L * (6 - n)); "job $n" }
    println(results)
}
`,
      hints: [
        '`jobs.map { work(it) }` runs one job after another. To run several at once, start several coroutines in a `coroutineScope { }`, which waits for them all.',
        'A `Channel` hands each job to exactly one taker. One coroutine sends every `jobs.withIndex()` value and then closes it; each worker loops `for ((i, job) in queue)`, and its loop ends when the channel is closed and empty.',
        'Make each worker an `async` that returns its `i to result` pairs. `awaitAll()`, `flatten()`, sort by `i`, keep the results.'
      ],
      checks: [
        { label: 'Every job\'s result, in the jobs\' order', code: `runTest {
    val got = processAll((1..10).toList(), 3) { n -> delay(100L * (11 - n)); "r$n" }
    eq(got, (1..10).map { "r$it" })
}` },
        { label: '3 at a time: 10 jobs of 100 ms take 400 ms on the fake clock', code: `runTest {
    processAll((1..10).toList(), 3) { n -> delay(100); "r$n" }
    eq(currentTime, 400L)
}` },
        { label: 'Never more than 3 running at once', code: `runTest {
    var running = 0
    var most = 0
    processAll((1..10).toList(), 3) { n ->
        running++
        most = maxOf(most, running)
        delay(100)
        running--
        "r$n"
    }
    eq(most, 3)
}` },
        { label: 'One worker: one after another, 1,000 ms', code: `runTest {
    processAll((1..10).toList(), 1) { n -> delay(100); "r$n" }
    eq(currentTime, 1000L)
}` },
        { label: 'No jobs: no results', code: `runTest {
    eq(processAll(emptyList(), 4) { "x" }, emptyList<String>())
}` }
      ]
    },
    {
      id: 'search-flow', level: 'Hard', kind: 'pattern', title: 'A search box as a Flow',
      summary: 'Search as the user types: debounce, filter, distinctUntilChanged and mapLatest, checked against a typing timeline on the fake clock.',
      patterns: ['flow'], keywords: ['search box', 'typeahead', 'debounce', 'distinctUntilChanged', 'mapLatest', 'switchMap', 'flow operators', 'runTest'],
      learn: ['lesson:kt-flow-operators', 'lesson:kt-flow-testing', 'ref:debounce', 'ref:distinctuntilchanged'],
      java: 'With Reactor this is `queries.debounce(…)` (`sampleTimeout` in Reactor), `.map(String::trim).filter(…).distinctUntilChanged().switchMap(this::search)`; `mapLatest` is Kotlin\'s `switchMap`. The checks run on `runTest`\'s fake clock: the typing and the 300 ms pauses take no real time, and `currentTime` says exactly when each search started.',
      task: '`queries` is what a search box holds, a value each time it changes. Write `searchResults(queries, search)`: a `Flow` of search results that behaves like a good search box:\n\n- it searches only once typing has paused for **300 ms** (`debounce`);\n- it trims the query, and ignores one shorter than **2 characters**;\n- it does not search the same query twice in a row (`distinctUntilChanged`);\n- when a newer query comes while a search is running, that search is **cancelled** (`mapLatest`).\n\n`debounce` and `mapLatest` are marked as preview and experimental APIs, so the solution starts with `@file:OptIn(…)`.',
      starter: `import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun searchResults(queries: Flow<String>, search: suspend (String) -> List<String>): Flow<List<String>> =
    queries.map { search(it) }

fun main() = runBlocking {
    val typed = flowOf("k", "ko", "kot")
    searchResults(typed) { q -> listOf("$q: 1 result") }.collect { println(it) }
}
`,
      solution: `@file:OptIn(FlowPreview::class, ExperimentalCoroutinesApi::class)

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun searchResults(queries: Flow<String>, search: suspend (String) -> List<String>): Flow<List<String>> =
    queries
        .debounce(300)
        .map { it.trim() }
        .filter { it.length >= 2 }
        .distinctUntilChanged()
        .mapLatest { search(it) }

fun main() = runBlocking {
    val typed = flowOf("k", "ko", "kot")
    searchResults(typed) { q -> listOf("$q: 1 result") }.collect { println(it) }
}
`,
      hints: [
        'Each rule is one operator, in this order: `debounce(300)`, `map { it.trim() }`, `filter { it.length >= 2 }`, `distinctUntilChanged()`, then the search.',
        'Trim before `distinctUntilChanged()`, so `"kotlin"` and `"kotlin "` count as the same query.',
        '`map { search(it) }` lets a slow, old search finish; `mapLatest { search(it) }` cancels it when a newer query arrives. Opt in at the top: `@file:OptIn(FlowPreview::class, ExperimentalCoroutinesApi::class)`.'
      ],
      checks: [
        { label: 'Only a pause of 300 ms searches: typing "k", "ko", "kot" quickly searches "kot" once', code: `runTest {
    val searched = mutableListOf<String>()
    val typed = flow { emit("k"); delay(100); emit("ko"); delay(100); emit("kot"); delay(1000) }
    val got = searchResults(typed) { q -> searched += q; listOf("$q!") }.toList()
    eq(searched, listOf("kot"))
    eq(got, listOf(listOf("kot!")))
}` },
        { label: 'Fewer than 2 characters, once trimmed: no search', code: `runTest {
    val searched = mutableListOf<String>()
    val typed = flow { emit("a"); delay(500); emit(" b "); delay(500); emit("go "); delay(500) }
    searchResults(typed) { q -> searched += q; listOf(q) }.toList()
    eq(searched, listOf("go"))
}` },
        { label: 'The same query twice in a row: one search', code: `runTest {
    val searched = mutableListOf<String>()
    val typed = flow { emit("kotlin"); delay(500); emit("kotlin "); delay(500); emit("java"); delay(500) }
    searchResults(typed) { q -> searched += q; listOf(q) }.toList()
    eq(searched, listOf("kotlin", "java"))
}` },
        { label: 'A newer query cancels the slow search for the old one', code: `runTest {
    val typed = flow { emit("slow"); delay(400); emit("fast"); delay(2000) }
    val got = searchResults(typed) { q -> delay(if (q == "slow") 1000 else 10); listOf(q) }.toList()
    eq(got, listOf(listOf("fast")))
}` },
        { label: 'The search starts 300 ms after the typing stops, on the fake clock', code: `runTest {
    var at = -1L
    val typed = flow { emit("abc"); delay(5000) }
    searchResults(typed) { q -> at = currentTime; listOf(q) }.toList()
    eq(at, 300L)
}` }
      ]
    },
    {
      id: 'rw-coroutines', level: 'Hard', kind: 'rewrite', title: 'CompletableFutures to coroutines',
      summary: 'supplyAsync, thenCombine and completeOnTimeout on pool threads become suspend functions, async, await and withTimeoutOrNull.',
      patterns: ['coroutines'], keywords: ['CompletableFuture', 'supplyAsync', 'thenCombine', 'completeOnTimeout', 'async', 'await', 'withTimeoutOrNull', 'Thread.sleep', 'delay', 'suspend'],
      learn: ['lesson:kt-launch-async', 'lesson:kt-cancellation', 'lesson:kt-coroutine-scopes', 'q:future-interop'],
      java: 'Each `CompletableFuture.supplyAsync` runs on a pool thread, `thenCombine` chains the results, and `completeOnTimeout` gives the default. With coroutines the code reads top to bottom: `async` starts each call, `await()` collects it, `withTimeoutOrNull(300)` gives `null` when the call is too slow (and cancels it), and `coroutineScope` makes sure no call outlives `summary`. `delay` frees the thread where `Thread.sleep` held it.',
      task: 'The Java below fetches a user, their orders and their points at the same time on pool threads, combines them, and gives 0 points when the points take longer than 300 ms. The Kotlin in the editor still uses `CompletableFuture` and `Thread.sleep`: it works, and prints what the Java prints.\n\nRewrite it with coroutines: the three fetches become **`suspend` functions** that wait with **`delay`**; `summary` becomes a `suspend` function that starts the three calls with **`async`** inside `coroutineScope`, and gives 0 points with **`withTimeoutOrNull(300)`**. The checks run `summary` on `runTest`\'s fake clock: the three calls together take 100 ms, and a slow `fetchPoints` gives 0 at exactly 300 ms. The output must not change.',
      original: `import java.util.concurrent.*;

public class Main {
    static String fetchUser(int id) {
        sleep(100);
        return "user" + id;
    }

    static int fetchOrders(int id) {
        sleep(100);
        return id * 3;
    }

    static int fetchPoints(int id) {
        sleep(id == 2 ? 500 : 50);
        return id * 10;
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); }
    }

    static String summary(int id) throws Exception {
        CompletableFuture<String> user = CompletableFuture.supplyAsync(() -> fetchUser(id));
        CompletableFuture<Integer> orders = CompletableFuture.supplyAsync(() -> fetchOrders(id));
        CompletableFuture<Integer> points = CompletableFuture.supplyAsync(() -> fetchPoints(id))
            .completeOnTimeout(0, 300, TimeUnit.MILLISECONDS);
        return user.thenCombine(orders, (u, o) -> u + ": " + o + " orders")
            .thenCombine(points, (s, p) -> s + ", " + p + " points")
            .get();
    }

    public static void main(String[] args) throws Exception {
        System.out.println(summary(1));
        System.out.println(summary(2));
    }
}
`,
      starter: `import java.util.concurrent.CompletableFuture
import java.util.concurrent.TimeUnit

fun fetchUser(id: Int): String {
    Thread.sleep(100)
    return "user$id"
}

fun fetchOrders(id: Int): Int {
    Thread.sleep(100)
    return id * 3
}

fun fetchPoints(id: Int): Int {
    Thread.sleep(if (id == 2) 500L else 50L)
    return id * 10
}

fun summary(id: Int): String {
    val user = CompletableFuture.supplyAsync { fetchUser(id) }
    val orders = CompletableFuture.supplyAsync { fetchOrders(id) }
    val points = CompletableFuture.supplyAsync { fetchPoints(id) }.completeOnTimeout(0, 300, TimeUnit.MILLISECONDS)
    return user.thenCombine(orders) { u, o -> "$u: $o orders" }
        .thenCombine(points) { s, p -> "$s, $p points" }
        .get()
}

fun main() {
    println(summary(1))
    println(summary(2))
}
`,
      solution: `import kotlinx.coroutines.*

suspend fun fetchUser(id: Int): String {
    delay(100)
    return "user$id"
}

suspend fun fetchOrders(id: Int): Int {
    delay(100)
    return id * 3
}

suspend fun fetchPoints(id: Int): Int {
    delay(if (id == 2) 500L else 50L)
    return id * 10
}

suspend fun summary(id: Int): String = coroutineScope {
    val user = async { fetchUser(id) }
    val orders = async { fetchOrders(id) }
    val points = async { withTimeoutOrNull(300) { fetchPoints(id) } ?: 0 }
    "\${user.await()}: \${orders.await()} orders, \${points.await()} points"
}

fun main() = runBlocking {
    println(summary(1))
    println(summary(2))
}
`,
      hints: [
        'Mark the three fetches `suspend` and replace `Thread.sleep` with `delay`: the fake clock moves only for `delay`.',
        '`suspend fun summary(id: Int): String = coroutineScope { … }`: inside, `async { fetchUser(id) }` starts a call, and `.await()` gives its result. Start all three before awaiting any.',
        '`withTimeoutOrNull(300) { fetchPoints(id) } ?: 0` is 0 when the call takes longer than 300 ms. `main` becomes `fun main() = runBlocking { … }`.'
      ],
      checks: [
        { label: 'It prints what the Java prints', code: `eq(output, "user1: 3 orders, 10 points\\nuser2: 6 orders, 0 points\\n")` },
        { label: '`summary` is a suspend function, its three calls at the same time: 100 ms on the fake clock', idiom: true, code: `runTest {
    eq(summary(1), "user1: 3 orders, 10 points")
    eq(currentTime, 100L)
}` },
        { label: 'A slow `fetchPoints` gives 0 points at 300 ms, without waiting for it', idiom: true, code: `runTest {
    eq(summary(2), "user2: 6 orders, 0 points")
    eq(currentTime, 300L)
}` },
        { label: 'No `CompletableFuture` and no `Thread.sleep`: `async` and `delay`', idiom: true, code: `ok(!uses("""CompletableFuture|Thread\\s*\\.\\s*sleep""") && uses("""\\basync\\b"""), "start each call with async { … } and wait with delay")` },
        { label: 'The fetches are `suspend` functions', idiom: true, code: `ok(uses("""suspend\\s+fun\\s+fetchUser""") && uses("""suspend\\s+fun\\s+fetchPoints"""), "mark fetchUser, fetchOrders and fetchPoints suspend")` }
      ]
    }
  );
})(window.KLT);
