/*
 * data/lessons-functional.js - Track 3, Functional Kotlin: eight lessons on lambdas, higher-order
 * functions, the collection operations, sequences, extensions, scope functions, inline and reified.
 *
 * The lesson shape is described at the top of data/lessons-basics.js. Every ```kotlin block is a whole
 * program that tests/test_content.py runs; an ```output block after one is its exact output. Compiler
 * messages quoted here are K2's, as kotlinc 2.4.20 words them (probed in batch 2). Non-local break and
 * continue are stable since Kotlin 2.2.0 (kotlinlang.org, "What's new in Kotlin 2.2").
 * Code is written in template literals: a Kotlin ${…} is written \${…}, and a Kotlin "\n" is "\\n".
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
    id: 'kt-lambdas', track: 'functional', title: 'Lambdas and function types',
    summary: 'A lambda is a function written as a value, { a, b -> a + b }; its type is a function type such as (Int) -> Int; it names a single parameter; a lambda goes after the brackets when it is the last argument; and it can change the variables it captures.',
    keywords: ['lambda', 'function type', '->', 'it', 'trailing lambda', 'closure', 'capture', 'effectively final', 'function reference', '::', 'invoke', 'Function1', 'Java lambda'],
    docs: 'https://kotlinlang.org/docs/lambdas.html',
    body: [
      '## A function as a value',
      kt(`fun main() {
    val double: (Int) -> Int = { n -> n * 2 }
    val add = { a: Int, b: Int -> a + b }
    println(double(21))
    println(add(2, 3))
    println(double.invoke(5))
}`),
      out(`42
5
10`),
      'A lambda is a block in braces: the parameters, an arrow, then the body. The last expression is the value it gives back, with no `return`. Its type is a *function type*: `(Int) -> Int` takes an `Int` and returns an `Int`; `() -> Unit` takes nothing and returns nothing useful. Where the type is known, as for `double`, the parameter types can be left out; where it is not, write them on the parameters, as in `add`. Calling `double(21)` is short for `double.invoke(21)`.',
      '## it: the one parameter',
      kt(`fun main() {
    val words = listOf("kotlin", "is", "concise")
    println(words.map { it.length })
    println(words.filter { it.length > 2 })
}`),
      out(`[6, 2, 7]
[kotlin, concise]`),
      'A lambda with exactly one parameter can leave it out, and call it `it`.',
      '## The lambda goes last',
      'When the last parameter of a function is a function, the lambda can go after the brackets, and empty brackets can go altogether:',
      kt(`fun applyTwice(x: Int, f: (Int) -> Int): Int = f(f(x))

fun main() {
    println(applyTwice(3, { n -> n + 10 }))
    println(applyTwice(3) { n -> n + 10 })
    println(applyTwice(3) { it * it })
}`),
      out(`23
23
81`),
      'The second and third calls are how Kotlin code looks. `list.map { … }`, `repeat(3) { … }` and `thread { … }` are ordinary functions taking a lambda last, not language keywords.',
      '## A lambda can change what it captures',
      kt(`fun counter(): () -> Int {
    var count = 0
    return { ++count }
}

fun main() {
    var total = 0
    listOf(5, 10, 15).forEach { total += it }
    println(total)

    val next = counter()
    next()
    next()
    println(next())
}`),
      out(`30
3`),
      'A Java lambda can only read local variables that are effectively final. A Kotlin lambda can change them: `total` is updated from inside. And the lambda `counter` returns keeps its own `count` alive after `counter` has returned: a *closure*. Each call of `counter()` makes a new count.',
      '## Function references',
      kt(`fun isEven(n: Int) = n % 2 == 0

fun main() {
    println(listOf(1, 2, 3, 4).filter(::isEven))
    println(listOf("a", "bb", "ccc").map(String::length))
}`),
      out(`[2, 4]
[1, 2, 3]`),
      '`::isEven` and `String::length` pass an existing function, or property, where a lambda would go, like Java\'s method references: [[q:function-references]].'
    ].join('\n\n'),
    java: '| Java | Kotlin |\n|---|---|\n| `(a, b) -> a + b` | `{ a, b -> a + b }` |\n| `x -> x * 2` | `{ it * 2 }` |\n| `Function<Integer, Integer>` | `(Int) -> Int` |\n| `BiFunction<Integer, Integer, Integer>` | `(Int, Int) -> Int` |\n| `Supplier<T>`, `Consumer<T>`, `Runnable` | `() -> T`, `(T) -> Unit`, `() -> Unit` |\n| captured locals must be effectively final | captured `var`s can be changed |\n| `String::length` | `String::length` |\n\nA Kotlin lambda can also be passed where a Java method expects a functional interface: `Thread { println("hi") }` makes a `Runnable`.',
    example: {
      code: `fun main() {
    val greet: (String) -> String = { name -> "Hello, $name" }
    val shout = { s: String -> s.uppercase() + "!" }
    val both = { name: String -> shout(greet(name)) }
    println(greet("Asha"))
    println(both("Ravi"))

    val ops = mapOf<String, (Int, Int) -> Int>("+" to { a, b -> a + b }, "*" to { a, b -> a * b })
    for ((symbol, op) in ops) println("6 $symbol 7 = \${op(6, 7)}")
}`,
      note: 'Add a `"-"` entry to `ops`, and a `"max"` one using `::maxOf`.'
    },
    challenge: {
      title: 'Functions as values',
      task: 'Write:\n\n- `square`, a value of type `(Int) -> Int`: a lambda that squares its argument;\n- `compose(f, g)`: returns a function that applies `f`, then `g`, so `compose(square, { it + 1 })(3)` is 10;\n- `makeCounter()`: returns a function that gives 1 on its first call, then 2, then 3…; two counters count separately.',
      starter: `val square: (Int) -> Int = { TODO("its argument times itself") }

fun compose(f: (Int) -> Int, g: (Int) -> Int): (Int) -> Int = TODO("a function that applies f, then g")

fun makeCounter(): () -> Int = TODO("a function that gives 1, then 2, then 3...")

fun main() {
    println(square(4))
}`,
      solution: `val square: (Int) -> Int = { it * it }

fun compose(f: (Int) -> Int, g: (Int) -> Int): (Int) -> Int = { x -> g(f(x)) }

fun makeCounter(): () -> Int {
    var count = 0
    return { ++count }
}

fun main() {
    println(square(4))
    val squareThenAdd = compose(square) { it + 1 }
    println(squareThenAdd(3))
    val next = makeCounter()
    next()
    println(next())
}`,
      hints: [
        '`compose` returns a lambda: `{ x -> g(f(x)) }`.',
        'Keep the count in a `var` inside `makeCounter`, and return a lambda that adds one to it: each call of `makeCounter` makes a fresh `var`.'
      ],
      checks: [
        { label: '`square(4)` is 16 and `square(-3)` is 9', code: 'eq(listOf(square(4), square(-3)), listOf(16, 9))' },
        { label: '`compose(square, { it + 1 })(3)` is 10: square first, then add 1', code: 'eq(compose(square, { it + 1 })(3), 10)' },
        { label: '`compose({ it + 1 }, square)(3)` is 16: the other order', code: 'eq(compose({ it + 1 }, square)(3), 16)' },
        { label: 'A counter gives 1, 2, 3', code: 'val c = makeCounter()\neq(listOf(c(), c(), c()), listOf(1, 2, 3))' },
        { label: 'Two counters count separately', code: 'val a = makeCounter()\nval b = makeCounter()\na()\na()\neq(listOf(a(), b()), listOf(3, 1))' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'kt-higher-order', track: 'functional', title: 'Higher-order functions',
    summary: 'Functions that take or return functions: writing your own, passing behaviour instead of writing a subclass, returning configured functions, optional callbacks, and why so much of the standard library looks like language.',
    keywords: ['higher-order function', 'function parameter', 'callback', 'strategy', 'return a function', 'listener', 'nullable function type', 'invoke', 'retry', 'Supplier', 'Function'],
    docs: 'https://kotlinlang.org/docs/lambdas.html',
    body: [
      '## A function that takes a function',
      kt(`fun retry(times: Int, action: () -> String): String {
    var lastError: Exception? = null
    for (attempt in 1..times) {
        try {
            return action()
        } catch (e: Exception) {
            println("attempt $attempt failed: \${e.message}")
            lastError = e
        }
    }
    throw IllegalStateException("gave up after $times attempts", lastError)
}

fun main() {
    var calls = 0
    val result = retry(3) {
        calls++
        if (calls < 3) error("not yet")
        "done after $calls calls"
    }
    println(result)
}`),
      out(`attempt 1 failed: not yet
attempt 2 failed: not yet
done after 3 calls`),
      '`retry` knows *when* to run the code and what to do when it fails; the caller says *what* to run. A function that takes or returns a function is a *higher-order function*. The caller\'s lambda ends with the value it gives back, `"done after $calls calls"`, and `error("…")` throws an `IllegalStateException`.',
      '## Passing behaviour instead of a subclass',
      kt(`class Button(val label: String, val onClick: () -> Unit)

fun main() {
    var clicks = 0
    val ok = Button("OK") { clicks++ }
    val hello = Button("Hello") { println("Hello!") }
    ok.onClick()
    ok.onClick()
    hello.onClick()
    println("\${ok.label} clicked $clicks times")
}`),
      out(`Hello!
OK clicked 2 times`),
      'Where Java would declare a `ClickListener` interface and pass an anonymous class, Kotlin takes a function type. A property of a function type is called like a function: `ok.onClick()`.',
      '## Returning a function',
      kt(`fun discount(percent: Int): (Double) -> Double = { price -> price * (100 - percent) / 100 }

fun main() {
    val tenOff = discount(10)
    val half = discount(50)
    println(tenOff(200.0))
    println(half(200.0))
    println(listOf(100.0, 80.0).map(tenOff))
}`),
      out(`180.0
100.0
[90.0, 72.0]`),
      '`discount(10)` makes a function with the 10 built in, ready to pass to `map`.',
      '## Optional callbacks',
      kt(`fun download(url: String, onProgress: ((Int) -> Unit)? = null): String {
    for (p in listOf(50, 100)) onProgress?.invoke(p)
    return "contents of $url"
}

fun main() {
    println(download("a.txt"))
    println(download("b.txt") { println("$it%") })
}`),
      out(`contents of a.txt
50%
100%
contents of b.txt`),
      'A nullable function type needs brackets around it, `((Int) -> Unit)?`, and is called with `?.invoke(…)`.',
      '## The standard library is built this way',
      '`repeat(3) { … }`, `measureTimeMillis { … }`, `list.sortedBy { it.age }`, `thread { … }`, `file.useLines { … }` and `synchronized(lock) { … }` are all ordinary functions that take a lambda last. That is why Kotlin needs so few keywords, and why your own functions can look as if they were built in.'
    ].join('\n\n'),
    java: [
      java(`static String retry(int times, Supplier<String> action) { … }

retry(3, () -> fetch());`),
      'In Java a method that takes behaviour takes a functional interface: `Supplier<T>`, `Function<T, R>`, `Consumer<T>`, `Runnable`, or one you declare. Kotlin writes the type itself: `() -> T`, `(T) -> R`, `(T) -> Unit`, `() -> Unit`. On the JVM these are interfaces too (`Function0`, `Function1`…), so Java code can call `retry(3, () -> fetch())` on the Kotlin function above.'
    ].join('\n\n'),
    example: {
      code: `fun timed(label: String, block: () -> Unit) {
    val start = System.nanoTime()
    block()
    val ms = (System.nanoTime() - start) / 1_000_000
    println("$label took \${if (ms < 1000) "under a second" else "$ms ms"}")
}

fun main() {
    timed("sum") {
        println((1..1000).sum())
    }
}`,
      note: 'Write `fun twice(block: () -> Unit)`, which runs the block two times, and call it with the lambda after the brackets.'
    },
    challenge: {
      title: 'Your own filter and map',
      task: 'Without the standard `filter` and `map`, write:\n\n- `keep(numbers, test)`: the numbers for which `test` is true, in their order;\n- `transformAll(words, f)`: `f` applied to each word;\n- `multiplier(factor)`: a function that multiplies its argument by `factor`.',
      starter: `fun keep(numbers: List<Int>, test: (Int) -> Boolean): List<Int> = TODO("the numbers for which test is true")

fun transformAll(words: List<String>, f: (String) -> String): List<String> = TODO("f applied to each word")

fun multiplier(factor: Int): (Int) -> Int = TODO("a function that multiplies by factor")

fun main() {
    println(keep(listOf(1, 2, 3, 4)) { it > 2 })
}`,
      solution: `fun keep(numbers: List<Int>, test: (Int) -> Boolean): List<Int> {
    val result = mutableListOf<Int>()
    for (n in numbers) {
        if (test(n)) result.add(n)
    }
    return result
}

fun transformAll(words: List<String>, f: (String) -> String): List<String> {
    val result = mutableListOf<String>()
    for (w in words) result.add(f(w))
    return result
}

fun multiplier(factor: Int): (Int) -> Int = { it * factor }

fun main() {
    println(keep(listOf(1, 2, 3, 4)) { it > 2 })
    println(transformAll(listOf("a", "b")) { it.uppercase() })
    println(multiplier(3)(5))
}`,
      hints: [
        'A function parameter is called like any function: `if (test(n)) result.add(n)`.',
        '`multiplier` returns a lambda that remembers `factor`: `{ it * factor }`.'
      ],
      checks: [
        { label: '`keep(listOf(1, 2, 3, 4)) { it > 2 }` is `[3, 4]`', code: 'eq(keep(listOf(1, 2, 3, 4)) { it > 2 }, listOf(3, 4))' },
        { label: '`keep` keeps the order, with any test', code: 'eq(keep(listOf(5, 2, 8, 1)) { it % 2 == 0 }, listOf(2, 8))' },
        { label: '`transformAll` applies the function to each word', code: 'eq(transformAll(listOf("kotlin", "java")) { it.uppercase() }, listOf("KOTLIN", "JAVA"))' },
        { label: '`multiplier(3)(5)` is 15, and `multiplier(10)(7)` is 70', code: 'eq(listOf(multiplier(3)(5), multiplier(10)(7)), listOf(15, 70))' },
        { label: 'Written without `filter` and `map`', code: 'ok(!uses("""\\.(filter|map)\\b"""), "write the loops yourself: no .filter or .map")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'kt-collection-ops', track: 'functional', title: 'Collection operations',
    summary: 'map, filter, sumOf, groupBy, associateBy, partition, fold and reduce, flatMap, zip, chunked, windowed, any, all and firstOrNull: Java\'s streams, without stream() and collect.',
    keywords: ['map', 'filter', 'flatMap', 'fold', 'reduce', 'groupBy', 'associateBy', 'associate', 'partition', 'zip', 'chunked', 'windowed', 'sortedBy', 'sumOf', 'any', 'all', 'none', 'count', 'distinct', 'stream', 'collect', 'Collectors'],
    docs: 'https://kotlinlang.org/docs/collection-operations.html',
    body: [
      '## Transform, filter, add up',
      kt(`data class Order(val customer: String, val amount: Int, val paid: Boolean)

val orders = listOf(
    Order("Asha", 300, true),
    Order("Ravi", 150, false),
    Order("Asha", 200, true),
    Order("Meera", 500, true)
)

fun main() {
    println(orders.filter { it.paid }.map { it.amount })
    println(orders.filter { it.paid }.sumOf { it.amount })
    println(orders.map { it.customer }.distinct())
    println(orders.sortedByDescending { it.amount }.first().customer)
}`),
      out(`[300, 200, 500]
1000
[Asha, Ravi, Meera]
Meera`),
      'Each operation returns a new list and leaves the original alone. There is no `stream()` at the start and no `collect(…)` at the end: the operations belong to the collections themselves.',
      '## Group, index, split',
      kt(`data class Order(val customer: String, val amount: Int, val paid: Boolean)

val orders = listOf(
    Order("Asha", 300, true),
    Order("Ravi", 150, false),
    Order("Asha", 200, true)
)

fun main() {
    val byCustomer = orders.groupBy { it.customer }
    println(byCustomer.mapValues { (_, list) -> list.sumOf { it.amount } })
    println(orders.associateBy { it.amount }.keys)
    val (paid, unpaid) = orders.partition { it.paid }
    println("\${paid.size} paid, \${unpaid.size} unpaid")
    println(orders.count { it.amount > 180 })
}`),
      out(`{Asha=500, Ravi=150}
[300, 150, 200]
2 paid, 1 unpaid
2`),
      '`groupBy` makes a map from each key to the list of items with that key. `associateBy` makes one item per key (when keys repeat, the last item wins). `partition` splits into the items that match and those that do not, as a pair. `mapValues { (_, list) -> … }` takes each entry apart; `_` skips the key.',
      '## fold and reduce',
      kt(`fun main() {
    val numbers = listOf(3, 1, 4, 1, 5)
    println(numbers.reduce { acc, n -> acc + n })
    println(numbers.fold(100) { acc, n -> acc + n })
    println(numbers.fold("") { acc, n -> acc + n })
    println(emptyList<Int>().fold(0) { acc, n -> acc + n })
}`),
      out(`14
114
31415
0`),
      '`reduce` starts from the first item, and throws on an empty list. `fold` starts from a value you give, which can be another type (here a `String`), and gives that value back for an empty list. For a plain total, `sum()` and `sumOf { … }` say it better.',
      '## flatMap, zip, chunked, windowed',
      kt(`fun main() {
    val sentences = listOf("kotlin is fun", "java is too")
    println(sentences.flatMap { it.split(" ") })
    println(listOf("a", "b", "c").zip(listOf(1, 2, 3)))
    println((1..7).chunked(3))
    println(listOf(1, 2, 3, 4).windowed(2) { it.sum() })
}`),
      out(`[kotlin, is, fun, java, is, too]
[(a, 1), (b, 2), (c, 3)]
[[1, 2, 3], [4, 5, 6], [7]]
[3, 5, 7]`),
      '## Asking questions',
      kt(`fun main() {
    val ages = listOf(17, 25, 31)
    println(ages.any { it < 18 })
    println(ages.all { it > 10 })
    println(ages.none { it > 100 })
    println(ages.firstOrNull { it > 40 })
    println(ages.maxOrNull())
}`),
      out(`true
true
true
null
31`),
      'The `OrNull` versions give null where the plain ones (`first`, `max`) throw, on an empty list or when nothing matches.'
    ].join('\n\n'),
    java: '| Java streams | Kotlin |\n|---|---|\n| `list.stream().filter(p).map(f).collect(toList())` | `list.filter(p).map(f)` |\n| `Collectors.groupingBy(f)` | `groupBy(f)` |\n| `Collectors.toMap(k, v)` | `associate { k to v }`, `associateBy(k)` |\n| `Collectors.partitioningBy(p)` | `partition(p)`, a `Pair` |\n| `mapToInt(f).sum()` | `sumOf(f)` |\n| `reduce(identity, op)` | `fold(initial, op)` |\n| `findFirst()`, an `Optional` | `firstOrNull()`, a `T?` |\n| `anyMatch`, `allMatch`, `noneMatch` | `any`, `all`, `none` |\n\nOne difference matters for big data: each Kotlin list operation makes a whole new list at once, where a Java stream is lazy. For a long chain over a large collection, `asSequence()` makes Kotlin lazy too: [[lesson:kt-sequences]].',
    example: {
      code: `data class Employee(val name: String, val dept: String, val salary: Int)

fun main() {
    val staff = listOf(
        Employee("Asha", "eng", 120), Employee("Ravi", "eng", 100),
        Employee("Meera", "sales", 90), Employee("Kiran", "sales", 70)
    )
    val averageByDept = staff.groupBy { it.dept }.mapValues { (_, people) -> people.map { it.salary }.average() }
    println(averageByDept)
    println(staff.maxBy { it.salary }.name)
    println(staff.sortedBy { it.name }.joinToString { it.name })
}`,
      note: 'Find the highest-paid person in each department.'
    },
    challenge: {
      title: 'A sales report',
      task: 'With collection operations only, no loops, write:\n\n- `revenue(sales)`: the total of quantity times price;\n- `unitsByProduct(sales)`: the total quantity for each product, as a map;\n- `topProduct(sales)`: the product with the most revenue over **all** its sales, or null when there are no sales.',
      starter: `data class Sale(val product: String, val qty: Int, val price: Int)

fun revenue(sales: List<Sale>): Int = TODO("the total of qty times price")

fun unitsByProduct(sales: List<Sale>): Map<String, Int> = TODO("the total qty for each product")

fun topProduct(sales: List<Sale>): String? = TODO("the product with the most revenue, or null")

fun main() {
    val sales = listOf(Sale("pen", 10, 20), Sale("book", 2, 300), Sale("pen", 5, 20))
    println(revenue(sales))
}`,
      solution: `data class Sale(val product: String, val qty: Int, val price: Int)

fun revenue(sales: List<Sale>): Int = sales.sumOf { it.qty * it.price }

fun unitsByProduct(sales: List<Sale>): Map<String, Int> =
    sales.groupBy { it.product }.mapValues { (_, list) -> list.sumOf { it.qty } }

fun topProduct(sales: List<Sale>): String? =
    sales.groupBy { it.product }.maxByOrNull { (_, list) -> revenue(list) }?.key

fun main() {
    val sales = listOf(Sale("pen", 10, 20), Sale("book", 2, 300), Sale("pen", 5, 20))
    println(revenue(sales))
    println(unitsByProduct(sales))
    println(topProduct(sales))
}`,
      hints: [
        '`groupBy { it.product }` gives a map from each product to its sales; `mapValues` turns each list of sales into a number.',
        '`maxByOrNull { … }` on a map compares its entries, and gives null for an empty map; `?.key` is the product.'
      ],
      checks: [
        { label: '`revenue` adds up quantity × price: 900', code: 'eq(revenue(listOf(Sale("pen", 10, 20), Sale("book", 2, 300), Sale("pen", 5, 20))), 900)' },
        { label: '`unitsByProduct` totals each product', code: 'eq(unitsByProduct(listOf(Sale("pen", 10, 20), Sale("book", 2, 300), Sale("pen", 5, 20))), mapOf("pen" to 15, "book" to 2))' },
        { label: '`topProduct` counts every sale: two pen sales (300) beat one book sale (250)', code: 'eq(topProduct(listOf(Sale("book", 1, 250), Sale("pen", 10, 15), Sale("pen", 10, 15))), "pen")' },
        { label: '`topProduct` of no sales is null', code: 'eq(topProduct(listOf()), null)' },
        { label: 'No loops: collection operations only', code: 'ok(!uses("""\\b(for|while)\\b"""), "use sumOf, groupBy and the others instead of a loop")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'kt-sequences', track: 'functional', title: 'Sequences',
    summary: 'asSequence() makes a chain lazy: each item goes through every step before the next one starts, nothing runs until a terminal operation, and a sequence can be endless. When it helps, when it does not, and Java streams.',
    keywords: ['sequence', 'asSequence', 'lazy', 'eager', 'generateSequence', 'sequence builder', 'yield', 'stream', 'Java stream', 'terminal operation', 'intermediate operation', 'infinite', 'take'],
    docs: 'https://kotlinlang.org/docs/sequences.html',
    body: [
      '## Eager lists, lazy sequences',
      kt(`fun main() {
    val words = listOf("apple", "kiwi", "banana", "fig")
    val fromList = words
        .map { println("map $it"); it.uppercase() }
        .filter { println("filter $it"); it.length > 3 }
        .first()
    println(fromList)
    println("---")
    val fromSequence = words.asSequence()
        .map { println("map $it"); it.uppercase() }
        .filter { println("filter $it"); it.length > 3 }
        .first()
    println(fromSequence)
}`),
      out(`map apple
map kiwi
map banana
map fig
filter APPLE
filter KIWI
filter BANANA
filter FIG
APPLE
---
map apple
filter APPLE
APPLE`),
      'A list operation goes over the whole list and makes a new list before the next step starts: four maps, then four filters. A sequence passes each item through every step in turn, and `first()` stops as soon as it has its answer: one map and one filter.',
      '## Nothing runs until a terminal operation',
      kt(`fun main() {
    val seq = listOf(1, 2, 3).asSequence().map { println("working on $it"); it * 10 }
    println("nothing has run yet")
    println(seq.toList())
}`),
      out(`nothing has run yet
working on 1
working on 2
working on 3
[10, 20, 30]`),
      '`map` and `filter` on a sequence are *intermediate* operations: they only describe the work. A *terminal* operation (`toList`, `first`, `sum`, `count`, `forEach`) runs it. A sequence nobody finishes never runs, as with a Java stream.',
      '## Endless sequences',
      kt(`fun main() {
    val powersOfTwo = generateSequence(1) { it * 2 }
    println(powersOfTwo.take(10).toList())

    val fibonacci = sequence {
        var a = 0
        var b = 1
        while (true) {
            yield(a)
            val next = a + b
            a = b
            b = next
        }
    }
    println(fibonacci.take(10).joinToString())
    println(fibonacci.first { it > 1000 })
}`),
      out(`[1, 2, 4, 8, 16, 32, 64, 128, 256, 512]
0, 1, 1, 2, 3, 5, 8, 13, 21, 34
1597`),
      '`generateSequence(seed) { next }` and the `sequence { … yield(x) … }` builder make sequences that never end; `take` or `first` decide how much is used. No list could hold them.',
      '## When to use which',
      '| | List operations | A sequence |\n|---|---|---|\n| How the work goes | each step over the whole collection | each item through all the steps |\n| Lists made between steps | one per step | none |\n| Good for | small collections, one or two steps | long chains over large collections; `first` or `take` that stop early; endless data |\n| Cost | a new list per step | a little overhead per item and step |',
      'For a few hundred items and two steps, a list is usually as fast or faster: a sequence is not free. Reach for `asSequence()` when the collection is large and the chain is long, or when an early stop can skip most of the work: [[q:sequences]].'
    ].join('\n\n'),
    java: 'A sequence is the nearest thing Kotlin has to a Java stream: lazy, made of intermediate and terminal operations, one item at a time. The differences: a sequence can be gone through again if its source can (a stream is used once); it is never parallel (Java\'s `parallelStream()` has no sequence version; Kotlin uses coroutines for parallel work); and its operations have the same names as on lists, so switching costs one `asSequence()`. For a Java API that wants a stream, `list.stream()` still works in Kotlin.',
    example: {
      code: `fun main() {
    val firstFive = (1..1_000_000).asSequence()
        .map { it.toLong() * it }
        .filter { it % 7 == 0L }
        .take(5)
        .toList()
    println(firstFive)
}`,
      note: 'Remove `.asSequence()` and run again: the same answer, but a million squares are worked out first.'
    },
    challenge: {
      title: 'Lazy primes',
      task: 'Write:\n\n- `isPrime(n)`: true for 2, 3, 5, 7, 11…, false for 0, 1 and the rest;\n- `primes`, a `Sequence<Int>` of all the primes, in order, made with `generateSequence` or `sequence { }`;\n- `firstPrimesOver(limit, count)`: the first `count` primes greater than `limit`, taken from `primes`.',
      starter: `fun isPrime(n: Int): Boolean = TODO("true for 2, 3, 5, 7, 11...")

val primes: Sequence<Int> = sequenceOf()

fun firstPrimesOver(limit: Int, count: Int): List<Int> = TODO("the first count primes greater than limit")

fun main() {
    println(primes.take(5).toList())
}`,
      solution: `fun isPrime(n: Int): Boolean = n >= 2 && (2..n).takeWhile { it * it <= n }.none { n % it == 0 }

val primes: Sequence<Int> = generateSequence(2) { it + 1 }.filter { isPrime(it) }

fun firstPrimesOver(limit: Int, count: Int): List<Int> = primes.dropWhile { it <= limit }.take(count).toList()

fun main() {
    println(primes.take(5).toList())
    println(firstPrimesOver(100, 3))
}`,
      hints: [
        '`generateSequence(2) { it + 1 }` is 2, 3, 4… forever; `.filter { isPrime(it) }` keeps the primes, lazily.',
        '`dropWhile { it <= limit }` skips the start of a sequence, and `take(count).toList()` finishes it.'
      ],
      checks: [
        { label: '`isPrime`: from 0 to 15, only 2, 3, 5, 7, 11 and 13', code: 'eq((0..15).filter { isPrime(it) }, listOf(2, 3, 5, 7, 11, 13))' },
        { label: '`primes.take(10)` is the first ten primes', code: 'eq(primes.take(10).toList(), listOf(2, 3, 5, 7, 11, 13, 17, 19, 23, 29))' },
        { label: '`firstPrimesOver(100, 3)` is `[101, 103, 107]`, and `firstPrimesOver(7, 2)` is `[11, 13]`', code: 'eq(firstPrimesOver(100, 3), listOf(101, 103, 107))\neq(firstPrimesOver(7, 2), listOf(11, 13))' },
        { label: '`primes` goes as far as it is asked: the first prime over 100,000 is 100,003', code: 'eq(primes.first { it > 100_000 }, 100003)' },
        { label: 'Made with `generateSequence` or `sequence { }`', code: 'ok(uses("""generateSequence|sequence\\s*\\{"""), "make primes with generateSequence or sequence { }")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'kt-extensions', track: 'functional', title: 'Extension functions',
    summary: 'Add a function to a class you do not own: fun String.initials(). It compiles to a static function, is chosen by the declared type, never beats a member, and can be a property or work on a nullable receiver.',
    keywords: ['extension', 'extension function', 'extension property', 'receiver', 'this', 'static dispatch', 'utility class', 'StringUtils', 'nullable receiver', 'shadowed', 'member wins'],
    docs: 'https://kotlinlang.org/docs/extensions.html',
    body: [
      '## A function on someone else\'s class',
      kt(`fun String.initials(): String =
    split(" ").filter { it.isNotBlank() }.joinToString("") { it.first().uppercase() }

fun Int.isEven() = this % 2 == 0

fun main() {
    println("asha rao".initials())
    println("Ravi Varma Chaluvadi".initials())
    println(4.isEven())
}`),
      out(`AR
RVC
true`),
      '`fun String.initials()` adds a function you call as if `String` had it. Inside, `this` is the string it was called on (the *receiver*), and can be left out: `split(" ")` means `this.split(" ")`. Kotlin\'s standard library is mostly extensions: `trim`, `split`, `filter`, `map` and `joinToString` are extension functions on Java\'s own classes.',
      '## What the compiler makes of it',
      'An extension is a static function that takes the receiver as its first parameter: `fun String.initials()` compiles to a static method `initials(String)` in the file\'s class. Java code calls it as `MainKt.initials("asha rao")`. So an extension cannot reach private members, and it does not change the class: it is a nicer way to call a utility function.',
      '## Chosen by the declared type',
      kt(`open class Shape
class Circle : Shape()

fun Shape.name() = "shape"
fun Circle.name() = "circle"

fun printName(s: Shape) = println(s.name())

fun main() {
    printName(Circle())
    val c: Shape = Circle()
    println(c.name())
}`),
      out(`shape
shape`),
      'Which extension runs is decided when compiling, from the type the variable is declared with, not from the object\'s class at run time. A member function would print `circle` here; an extension cannot be overridden. It is the question interviews ask most about extensions: [[q:extension-functions]].',
      '## A member always wins',
      kt(`class Greeter {
    fun hello() = "member"
}

fun Greeter.hello() = "extension"

fun main() {
    println(Greeter().hello())
}`),
      out('member'),
      'When the class already has a member with the same signature, the member is called, and the compiler warns: *This extension is shadowed by a member: \'fun hello(): String\' defined in \'Greeter\'.* An extension can add to a class, never replace what it has.',
      '## Extension properties, and nullable receivers',
      kt(`val String.wordCount: Int
    get() = trim().split(Regex("\\\\s+")).count { it.isNotEmpty() }

fun String?.orDash(): String = if (this.isNullOrBlank()) "-" else this

fun main() {
    println("kotlin is concise".wordCount)
    val missing: String? = null
    println(missing.orDash())
    println("ok".orDash())
}`),
      out(`3
-
ok`),
      'An extension property has nowhere to store a value, so it has a getter. An extension on a nullable type, `String?`, can be called on null, and `this` may be null inside it: that is how `isNullOrBlank()` and `orEmpty()` work.'
    ].join('\n\n'),
    java: [
      java(`public final class StringUtils {
    private StringUtils() {}

    public static String initials(String s) { … }
}

StringUtils.initials("asha rao");`),
      'is `fun String.initials()` in Kotlin, called as `"asha rao".initials()`: the call reads left to right, and the IDE offers it after the dot. In the bytecode it is still a static method, which Java calls as `MainKt.initials("asha rao")` (or under the name `@file:JvmName` gives the file).'
    ].join('\n\n'),
    example: {
      code: `fun Double.format(decimals: Int = 2) = "%.\${decimals}f".format(this)

fun List<Int>.secondLargest(): Int? = distinct().sortedDescending().getOrNull(1)

val Int.minutes get() = this * 60

fun main() {
    println(3.14159.format())
    println(3.14159.format(4))
    println(listOf(5, 9, 9, 2).secondLargest())
    println(listOf(1).secondLargest())
    println(5.minutes)
}`,
      note: 'Write `fun String.isPalindrome()` and try it on `"level"` and `"kotlin"`.'
    },
    challenge: {
      title: 'Extensions for everyday code',
      task: 'Write two extension functions and an extension property:\n\n- `String.capitalizeWords()`: each word with its first letter upper-cased, so `"hello kotlin world"` becomes `"Hello Kotlin World"`;\n- `List<Int>.product()`: all the numbers multiplied together, as a `Long` (1 for an empty list), with no overflow for big numbers;\n- `String.isEmail`: `true` when the text has exactly one `@` with something on both sides.',
      starter: `fun String.capitalizeWords(): String = TODO("each word with its first letter upper-cased")

fun List<Int>.product(): Long = TODO("all the numbers multiplied, as a Long; 1 for an empty list")

// val String.isEmail: an extension property

fun main() {
    println("hello kotlin world".capitalizeWords())
}`,
      solution: `fun String.capitalizeWords(): String =
    split(" ").joinToString(" ") { word -> word.replaceFirstChar { it.uppercase() } }

fun List<Int>.product(): Long = fold(1L) { acc, n -> acc * n }

val String.isEmail: Boolean
    get() {
        val parts = split("@")
        return parts.size == 2 && parts[0].isNotEmpty() && parts[1].isNotEmpty()
    }

fun main() {
    println("hello kotlin world".capitalizeWords())
    println(listOf(2, 3, 4).product())
    println("asha@example.com".isEmail)
}`,
      hints: [
        '`word.replaceFirstChar { it.uppercase() }` capitalises one word; `split(" ")` and `joinToString(" ")` take the text apart and put it back.',
        '`fold(1L) { acc, n -> acc * n }` multiplies as `Long`s from the start. An extension property is `val String.isEmail: Boolean get() { … }`.'
      ],
      checks: [
        { label: '`"hello kotlin world".capitalizeWords()` is `"Hello Kotlin World"`', code: 'eq("hello kotlin world".capitalizeWords(), "Hello Kotlin World")' },
        { label: 'Words already capitalised stay as they are', code: 'eq("Java and kotlin".capitalizeWords(), "Java And Kotlin")' },
        { label: '`listOf(2, 3, 4).product()` is 24, and an empty list gives 1', code: 'eq(listOf(listOf(2, 3, 4).product(), listOf<Int>().product()), listOf(24L, 1L))' },
        { label: 'No overflow: `listOf(100_000, 100_000).product()` is 10,000,000,000', code: 'eq(listOf(100_000, 100_000).product(), 10_000_000_000L)' },
        { label: '`isEmail`: `a@b.com` is one; `ab.com`, `@b.com` and `a@b@c` are not', code: 'eq(listOf("a@b.com", "ab.com", "@b.com", "a@b@c").map { it.isEmail }, listOf(true, false, false, false))' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 6 */
  L.push({
    id: 'kt-scope-functions', track: 'functional', title: 'Scope functions: let, run, with, apply, also',
    summary: 'Five functions that run a block with an object: let and also pass it as it, run, with and apply as this; apply and also return the object, the others what the block computed. Which to use, and takeIf.',
    keywords: ['scope function', 'scope functions', 'let', 'run', 'with', 'apply', 'also', 'it', 'this', 'builder', 'null check', 'takeIf', 'takeUnless', 'configure'],
    docs: 'https://kotlinlang.org/docs/scope-functions.html',
    body: [
      '## Five functions, two questions',
      '| Function | The object is | It returns | Typical use |\n|---|---|---|---|\n| `let` | `it` | what the block computes | `x?.let { … }`: run code only when `x` is not null; turn a value into another |\n| `run` | `this` | what the block computes | compute something from an object\'s members |\n| `with(x)` | `this` | what the block computes | several calls on one object |\n| `apply` | `this` | the object | set up an object you have just made |\n| `also` | `it` | the object | a side effect in a chain: logging, a check |',
      'Two questions pick between them. Inside the block, do you want the object as `this`, so you can call its members directly, or as `it`, so it reads like an argument? And should the call give back the object itself, or what the block computed?',
      '## apply: set it up, get it back',
      kt(`class Connection {
    var host = "localhost"
    var port = 80
    var timeoutMs = 1000
    override fun toString() = "$host:$port (timeout $timeoutMs ms)"
}

fun main() {
    val c = Connection().apply {
        host = "db.example.com"
        port = 5432
    }
    println(c)
}`),
      out('db.example.com:5432 (timeout 1000 ms)'),
      'Inside `apply`, `this` is the new connection, so `host = …` sets its property. `apply` returns the connection, set up: Java\'s builder pattern, without writing a builder.',
      '## let: only when not null, or to turn a value into another',
      kt(`fun main() {
    val email: String? = " Asha@Example.com "
    email?.let { println("sending to \${it.trim().lowercase()}") }
    val none: String? = null
    none?.let { println("never printed") }
    val doubled = "kotlin".let { it.length * 2 }
    println(doubled)
}`),
      out(`sending to asha@example.com
12`),
      '## also: a side effect, then carry on',
      kt(`fun main() {
    val numbers = mutableListOf(3, 1, 2)
        .also { println("before: $it") }
        .apply { sort() }
        .also { println("after: $it") }
    println(numbers.size)
}`),
      out(`before: [3, 1, 2]
after: [1, 2, 3]
3`),
      '## run and with: compute from an object',
      kt(`data class Rect(val w: Int, val h: Int)

fun main() {
    val r = Rect(3, 4)
    val description = r.run { "area \${w * h}, perimeter \${2 * (w + h)}" }
    println(description)
    val text = with(StringBuilder()) {
        append("Kot")
        append("lin")
        toString()
    }
    println(text)
}`),
      out(`area 12, perimeter 14
Kotlin`),
      '## takeIf',
      kt(`fun main() {
    println("42".toIntOrNull()?.takeIf { it > 0 })
    println("-5".toIntOrNull()?.takeIf { it > 0 })
}`),
      out(`42
null`),
      '`takeIf { test }` gives the object when the test passes, and null when it does not (`takeUnless` the reverse). With `?.` and `?:` it makes short validation chains.',
      '## Do not nest them',
      'Each scope function changes what `this` or `it` means. Two levels in, a reader has to work out which object `it` is. When a block grows past a few lines, or nests, a plain local `val` is clearer: `val user = findUser(id) ?: return` reads better than a `let` holding the rest of the function.'
    ].join('\n\n'),
    java: 'Java has no scope functions. The nearest things are a builder (≈ `apply`), a temporary variable (≈ `let`, `run`), `Optional.ofNullable(x).ifPresent(…)` (≈ `x?.let { … }`) and `Optional.map(…)` (≈ `?.let { … }` giving a value). They are not keywords in Kotlin either: each is a short `inline` function in the standard library, for example `inline fun <T> T.also(block: (T) -> Unit): T { block(this); return this }`, so they cost nothing at run time: [[lesson:kt-inline]].',
    example: {
      code: `data class User(var name: String = "", var email: String = "", var admin: Boolean = false)

fun main() {
    val asha = User().apply {
        name = "Asha"
        email = "asha@example.com"
        admin = true
    }.also { println("created $it") }

    val domain = asha.email.let { it.substringAfter("@") }
    println(domain)
    val summary = with(asha) { "$name (\${if (admin) "admin" else "user"})" }
    println(summary)
}`,
      note: 'Change `apply` to `also` and see what breaks: inside `also` the user is `it`, not `this`.'
    },
    challenge: {
      title: 'The right scope function',
      task: 'Write, each with the scope function named:\n\n- `newServer(hostName, portNumber)`: a `Server` with that host and port, made with `apply`;\n- `portOf(text)`: the port number in `text`, or 80 when `text` is null, not a number, or outside 1 to 65535; use `?.takeIf` (or `?.let`) and `?:`;\n- `started(s)`: adds `"started <host>:<port>"` to `s.log` and returns the same server, with `also`.',
      starter: `class Server {
    var host = ""
    var port = 0
    val log = mutableListOf<String>()
}

fun newServer(hostName: String, portNumber: Int): Server = TODO("a Server with this host and port, made with apply")

fun portOf(text: String?): Int = TODO("the port in text, or 80")

fun started(s: Server): Server = TODO("log a line with also, and return the same server")

fun main() {
    println(newServer("localhost", 8080).port)
}`,
      solution: `class Server {
    var host = ""
    var port = 0
    val log = mutableListOf<String>()
}

fun newServer(hostName: String, portNumber: Int): Server = Server().apply {
    host = hostName
    port = portNumber
}

fun portOf(text: String?): Int = text?.toIntOrNull()?.takeIf { it in 1..65535 } ?: 80

fun started(s: Server): Server = s.also { it.log.add("started \${it.host}:\${it.port}") }

fun main() {
    println(newServer("localhost", 8080).port)
    println(portOf("70000"))
    println(started(newServer("db", 5432)).log)
}`,
      hints: [
        '`Server().apply { host = hostName; port = portNumber }` (each on its own line) sets up the server and gives it back.',
        '`text?.toIntOrNull()?.takeIf { it in 1..65535 } ?: 80`. `s.also { … }` gives back `s` itself, whatever the block does.'
      ],
      checks: [
        { label: '`newServer("db", 5432)` has that host and port', code: 'val s = newServer("db", 5432)\neq(listOf(s.host, s.port), listOf<Any>("db", 5432))' },
        { label: '`newServer` uses `apply`', code: 'ok(uses("""\\.apply\\s*\\{"""), "make the server with Server().apply { … }")' },
        { label: '`portOf`: "8080" gives 8080; null, "abc", "0" and "70000" give 80', code: 'eq(listOf(portOf("8080"), portOf(null), portOf("abc"), portOf("0"), portOf("70000")), listOf(8080, 80, 80, 80, 80))' },
        { label: '`started` logs `started db:5432` and returns the same server', code: 'val s = newServer("db", 5432)\nval r = started(s)\nok(r === s, "return the same server: also gives back its receiver")\neq(s.log, listOf("started db:5432"))' },
        { label: '`started` uses `also`', code: 'ok(uses("""\\.also\\s*\\{"""), "log with s.also { … }")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 7 */
  L.push({
    id: 'kt-inline', track: 'functional', title: 'inline functions and non-local returns',
    summary: 'inline copies a function and its lambda into the caller: no lambda object, and a return inside the lambda leaves the caller. return@label, non-local break and continue, noinline and crossinline, and when not to inline.',
    keywords: ['inline', 'inline function', 'non-local return', 'return@', 'label', 'noinline', 'crossinline', 'forEach', 'break', 'continue', 'lambda allocation', 'performance'],
    docs: 'https://kotlinlang.org/docs/inline-functions.html',
    body: [
      '## What a lambda costs',
      'A lambda passed to an ordinary function becomes an object (a `Function1` or one of its kind), and when it captures variables, a new object for each call. In a busy loop that is garbage to collect. An `inline` function avoids it: the compiler copies the function\'s body, with the lambda\'s body, into the place that calls it.',
      kt(`inline fun timesTwo(n: Int, action: (Int) -> Unit) {
    action(n * 2)
}

fun main() {
    var sum = 0
    for (i in 1..3) timesTwo(i) { sum += it }
    println(sum)
}`),
      out('12'),
      'After inlining, the loop body is just `sum += i * 2`: no lambda object and no call. `filter`, `map`, `forEach`, `let`, `apply` and `repeat`, like most of the standard library\'s higher-order functions, are `inline` for this reason. The explainer [[explain:inline-or-not]] shows the difference at run time, on the call stack, a step at a time.',
      '## return inside a lambda',
      'Because an inline lambda\'s body is pasted into the caller, a plain `return` in it returns from the *function around it*: a *non-local return*.',
      kt(`fun findFirstNegative(numbers: List<Int>): Int? {
    numbers.forEach {
        if (it < 0) return it
    }
    return null
}

fun main() {
    println(findFirstNegative(listOf(3, -1, -7)))
    println(findFirstNegative(listOf(1, 2)))
}`),
      out(`-1
null`),
      'The `return it` leaves `findFirstNegative`, not just the lambda: what you want here, and a classic surprise elsewhere.',
      '## return@label: leave only the lambda',
      kt(`fun main() {
    listOf(1, 2, 3, 4).forEach {
        if (it % 2 == 0) return@forEach
        print("$it ")
    }
    println("done")
}`),
      out('1 3 done'),
      '`return@forEach` ends this call of the lambda, and `forEach` moves to the next item, like `continue` in a loop. A lambda can be given a label of its own: `forEach skip@{ … return@skip }`.',
      '## break and continue',
      'Since Kotlin 2.2.0, `break` and `continue` also work inside the lambda of an inline function, for the loop around it:',
      kt(`fun main() {
    for (word in listOf("alpha", "beta", "stop", "gamma")) {
        word.let {
            if (it == "stop") break
            println(it.uppercase())
        }
    }
}`),
      out(`ALPHA
BETA`),
      '## Only inline lambdas can return',
      'An ordinary function may keep its lambda and call it later, after the caller has returned, so a plain `return` in that lambda is refused (*\'return\' is prohibited here*); only `return@label` is allowed. That is why `thread { return }` does not compile but `forEach { return }` does.',
      '## noinline and crossinline',
      kt(`inline fun runBoth(first: () -> Unit, noinline later: () -> Unit): () -> Unit {
    first()
    return later
}

fun main() {
    val saved = runBoth({ println("now") }, { println("later") })
    println("between")
    saved()
}`),
      out(`now
between
later`),
      '`noinline` keeps one lambda an object, because the function stores it or passes it on. `crossinline` keeps a lambda inlined but forbids a non-local `return` in it, which is needed when the function calls it from somewhere else, such as a `Runnable` it creates.',
      '## When not to inline',
      'Inline small functions that take lambdas, and little else. Inlining copies the body to every caller, so a large function grows the bytecode; and inlining a function with no lambda parameters gains almost nothing (the compiler warns: *Expected performance impact from inlining is insignificant*). A public inline function also cannot use private members (*Public-API inline function cannot access non-public-API property*), because its body ends up in other people\'s code.'
    ].join('\n\n'),
    java: 'Java has no inline functions. A Java lambda is always an object (made through `invokedynamic`, and reused when it captures nothing), and a `return` in it leaves the lambda only. So Java\'s `list.forEach(x -> { if (x < 0) return; … })` behaves like `continue`, while Kotlin\'s `forEach { if (it < 0) return }` leaves the whole function; Kotlin\'s `continue` for a lambda is `return@forEach`.',
    example: {
      code: `inline fun <T> measure(label: String, block: () -> T): T {
    val start = System.nanoTime()
    val result = block()
    val micros = (System.nanoTime() - start) / 1000
    println("$label: \${if (micros < 1_000_000) "under a second" else "$micros µs"}")
    return result
}

fun firstLong(words: List<String>): String? {
    words.forEach { if (it.length > 5) return it }
    return null
}

fun main() {
    val total = measure("sum") { (1..1000).sum() }
    println(total)
    println(firstLong(listOf("tea", "coffee", "espresso")))
}`,
      note: 'Change `return it` in `firstLong` to `return@forEach`, and see what it returns now.'
    },
    challenge: {
      title: 'Leaving early',
      task: 'Write:\n\n- `inline fun timesUntil(limit, action)`: calls `action(1)`, `action(2)`… up to `action(limit)`, stops at the first call that returns `true`, and returns how many calls it made. Because it is `inline`, a lambda passed to it can `return` from the function around it;\n- `firstDuplicate(words)`: the first word that appeared earlier in the list, or null, using `forEach` and a `return` from inside it;\n- `oddSquares(numbers)`: the squares of the odd numbers, using `forEach` and `return@forEach` to skip the even ones.',
      starter: `inline fun timesUntil(limit: Int, action: (Int) -> Boolean): Int {
    TODO("call action(1), action(2)... and stop at the first true")
}

fun firstDuplicate(words: List<String>): String? = TODO("forEach, and return the first word seen before")

fun oddSquares(numbers: List<Int>): List<Int> = TODO("forEach, with return@forEach for even numbers")

fun main() {
    println(firstDuplicate(listOf("a", "b", "a")))
}`,
      solution: `inline fun timesUntil(limit: Int, action: (Int) -> Boolean): Int {
    for (i in 1..limit) {
        if (action(i)) return i
    }
    return limit
}

fun firstDuplicate(words: List<String>): String? {
    val seen = mutableSetOf<String>()
    words.forEach {
        if (!seen.add(it)) return it
    }
    return null
}

fun oddSquares(numbers: List<Int>): List<Int> {
    val result = mutableListOf<Int>()
    numbers.forEach {
        if (it % 2 == 0) return@forEach
        result.add(it * it)
    }
    return result
}

fun main() {
    println(timesUntil(10) { it * it > 20 })
    println(firstDuplicate(listOf("a", "b", "a")))
    println(oddSquares(listOf(1, 2, 3)))
}`,
      hints: [
        '`seen.add(it)` returns `false` when the set already held the word: that is the first duplicate, so `return it`.',
        'In `oddSquares`, `return@forEach` skips to the next number; a plain `return` would leave `oddSquares` at the first even number.'
      ],
      checks: [
        { label: '`timesUntil(10) { it * it > 20 }` stops after 5 calls', code: 'eq(timesUntil(10) { it * it > 20 }, 5)' },
        { label: 'With no `true`, it makes every call: `timesUntil(3) { false }` is 3', code: 'var calls = 0\neq(timesUntil(3) { calls++\nfalse }, 3)\neq(calls, 3)' },
        { label: '`timesUntil` is inline: a lambda passed to it can return from the code around it', code: 'val r = run {\n    timesUntil(5) {\n        if (it == 2) return@run "left at 2"\n        false\n    }\n    "finished"\n}\neq(r, "left at 2")' },
        { label: '`firstDuplicate`: the first word seen before, or null', code: 'eq(listOf(firstDuplicate(listOf("a", "b", "c", "b", "a")), firstDuplicate(listOf("x", "y"))), listOf("b", null))' },
        { label: '`oddSquares(listOf(1, 2, 3, 4, 5))` is `[1, 9, 25]`, using `return@forEach`', code: 'eq(oddSquares(listOf(1, 2, 3, 4, 5)), listOf(1, 9, 25))\nok(uses("""return@forEach"""), "skip the even numbers with return@forEach")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 8 */
  L.push({
    id: 'kt-reified', track: 'functional', title: 'reified type parameters',
    summary: 'Generic types are erased at run time, so a generic function cannot ask whether a value is a T. An inline function with a reified type parameter can: is T, T::class, filterIsInstance<T>(), without passing a Class.',
    keywords: ['reified', 'generics', 'type erasure', 'erased', 'is T', 'T::class', 'Class<T>', 'type token', 'filterIsInstance', 'inline', 'type parameter'],
    docs: 'https://kotlinlang.org/docs/inline-functions.html#reified-type-parameters',
    body: [
      '## The problem: erasure',
      'On the JVM, a `List<String>` and a `List<Int>` are the same class at run time: type arguments are *erased* after compiling. So a generic function cannot test its type parameter:',
      norun(`// compile error: Cannot check for instance of erased type 'T (of fun <T> isA)'.
fun <T> isA(value: Any): Boolean = value is T`),
      'Java has the same problem, and the same way round it: pass the class as an argument, `isA(value, String.class)`.',
      '## reified: keep the type',
      kt(`inline fun <reified T> isA(value: Any): Boolean = value is T

fun main() {
    println(isA<String>("text"))
    println(isA<Int>("text"))
    println(isA<Number>(42))
}`),
      out(`true
false
true`),
      '`reified` works only on an `inline` function (*Only type parameters of inline functions can be reified*). The body is copied into each call, where `T` is known, `String` here and `Int` there, so the compiler writes the real type into each copy. No class is passed in.',
      '## In the standard library',
      kt(`fun main() {
    val things: List<Any> = listOf(1, "two", 3.0, "four", 5)
    println(things.filterIsInstance<String>())
    println(things.filterIsInstance<Int>().sum())
}`),
      out(`[two, four]
6`),
      '`filterIsInstance<String>()` gives a `List<String>`, typed, so `sum()` works on the `Int` one with no cast.',
      '## T::class',
      kt(`inline fun <reified T> typeName(): String = T::class.java.simpleName

inline fun <reified T : Any> parse(text: String): T? {
    val value: Any? = when (T::class) {
        Int::class -> text.toIntOrNull()
        Boolean::class -> text.toBooleanStrictOrNull()
        String::class -> text
        else -> null
    }
    return value as? T
}

fun main() {
    println(typeName<String>())
    println(typeName<List<Int>>())
    println(parse<Int>("42"))
    println(parse<Boolean>("yes"))
    println(parse<String>("hi"))
}`),
      out(`String
List
42
null
hi`),
      '`T::class` (a Kotlin class) and `T::class.java` (a Java `Class`) are what a Java API wanting a `Class<T>` needs. The type argument of `List<Int>` is still gone at run time: a reified `T` keeps the class, not its arguments.'
    ].join('\n\n'),
    java: [
      java(`static <T> List<T> ofType(List<?> items, Class<T> type) {
    List<T> out = new ArrayList<>();
    for (Object o : items) if (type.isInstance(o)) out.add(type.cast(o));
    return out;
}

ofType(things, String.class);`),
      'is `things.filterIsInstance<String>()` in Kotlin. Java passes a `Class<T>` (a *type token*) because the type is erased; Kotlin passes nothing, because the inlined copy already names the type. Libraries use the same trick: Jackson\'s Kotlin module offers `mapper.readValue<User>(json)` instead of `mapper.readValue(json, User.class)`.'
    ].join('\n\n'),
    example: {
      code: `inline fun <reified T> List<Any>.countOf(): Int = count { it is T }

inline fun <reified T> describe(value: Any): String {
    val name = T::class.java.simpleName
    return if (value is T) "$value is a $name" else "$value is not a $name"
}

fun main() {
    val mixed: List<Any> = listOf(1, "a", 2L, "b", 3)
    println(mixed.countOf<String>())
    println(mixed.countOf<Int>())
    println(describe<String>("hi"))
    println(describe<Int>("hi"))
}`,
      note: 'Remove `reified` from `countOf` and read what the compiler says.'
    },
    challenge: {
      title: 'Typed helpers',
      task: 'Write two inline functions with a reified type parameter:\n\n- `List<Any>.firstOfType<T>()`: the first item that is a `T` (a subtype counts: an `Int` is a `Number`), or null;\n- `List<Any>.splitByType<T>()`: a `Pair` of the items that are `T`s, typed as a `List<T>`, and all the others, both in order.',
      starter: `inline fun <reified T> List<Any>.firstOfType(): T? = TODO("the first item that is a T, or null")

inline fun <reified T> List<Any>.splitByType(): Pair<List<T>, List<Any>> = TODO("the Ts, and the rest")

fun main() {
    val things: List<Any> = listOf(1, "two", 3.0, "four")
    println(things.firstOfType<String>())
}`,
      solution: `inline fun <reified T> List<Any>.firstOfType(): T? = firstOrNull { it is T } as T?

inline fun <reified T> List<Any>.splitByType(): Pair<List<T>, List<Any>> {
    val (matching, others) = partition { it is T }
    return Pair(matching.map { it as T }, others)
}

fun main() {
    val things: List<Any> = listOf(1, "two", 3.0, "four")
    println(things.firstOfType<String>())
    println(things.splitByType<Double>())
}`,
      hints: [
        'With a reified `T`, `it is T` and `it as T` work inside the lambdas: `firstOrNull { it is T } as T?`.',
        '`partition { it is T }` splits the list in two; map the first half with `it as T` to make it a `List<T>`.'
      ],
      checks: [
        { label: '`firstOfType<String>()` finds `"two"`', code: 'val things: List<Any> = listOf(1, "two", 3.0, "four")\neq(things.firstOfType<String>(), "two")' },
        { label: '`firstOfType<Double>()` finds 3.0, and `firstOfType<Char>()` finds nothing', code: 'val things: List<Any> = listOf(1, "two", 3.0, "four")\neq(listOf(things.firstOfType<Double>(), things.firstOfType<Char>()), listOf(3.0, null))' },
        { label: '`splitByType<String>()` gives the strings and the rest, in order', code: 'val things: List<Any> = listOf(1, "two", 3.0, "four")\neq(things.splitByType<String>(), Pair(listOf("two", "four"), listOf(1, 3.0)))' },
        { label: 'The strings come back typed as a `List<String>`', code: 'val (strings, _) = listOf<Any>("ab", 1, "cde").splitByType<String>()\neq(strings.sumOf { it.length }, 5)' },
        { label: 'A subtype counts: an `Int` is a `Number`', code: 'eq(listOf<Any>("x", 7).firstOfType<Number>(), 7)' }
      ]
    }
  });
})(window.KLT);
