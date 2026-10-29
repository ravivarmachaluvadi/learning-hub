/*
 * data/quizzes-functional.js - the quiz at the end of each Functional Kotlin lesson.
 *
 * The question shape is described at the top of data/quizzes-basics.js. A question with `code` asks
 * what it prints: its right choice is the output, in backticks, and tests/test_content.py runs the
 * program to prove it (and that no wrong choice is the output too).
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};

  Q['kt-lambdas'] = [
    { q: 'What does this program print?',
      code: 'fun main() {\n    val f: (Int) -> Int = { it * 3 }\n    val g = { x: Int, y: Int -> x - y }\n    println("${f(4)} ${g(10, 4)}")\n}',
      choices: ['`12 6`', '`12 -6`', '`7 6`'],
      answer: 0,
      why: '`f` triples its one argument, `it`. `g` takes two named parameters and subtracts the second from the first.' },
    { q: 'Which is a Kotlin lambda that takes two `Int`s and returns their sum?',
      choices: ['`{ a: Int, b: Int -> a + b }`', '`(a, b) -> a + b`', '`{ return a + b }`'],
      answer: 0,
      why: 'A Kotlin lambda has its parameters inside the braces, before the arrow, and its last expression is its value. `(a, b) -> a + b` is Java\'s syntax.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    var count = 0\n    val inc = { count++ }\n    inc()\n    inc()\n    println(count)\n}',
      choices: ['`2`', '`0`', 'Nothing: a lambda cannot change a local variable'],
      answer: 0,
      why: 'Unlike a Java lambda, a Kotlin lambda can change the local `var`s it captures.' },
    { q: 'In `names.filter { it.length > 3 }`, what is `it`?',
      choices: ['The lambda\'s one parameter: each name in turn', 'The list `names`', 'The result of the previous call'],
      answer: 0,
      why: 'A lambda with exactly one parameter can leave it out and call it `it`. `filter` calls the lambda once for each name.' }
  ];

  Q['kt-higher-order'] = [
    { q: 'What is a higher-order function?',
      choices: ['A function that takes a function as a parameter, or returns one', 'A function declared at the top level of a file', 'A function with more than three parameters'],
      answer: 0,
      why: '`map`, `filter`, `repeat` and `retry`, which take lambdas, are higher-order functions; so is `discount(10)`, which returns one.' },
    { q: 'What does this program print?',
      code: 'fun twice(f: (Int) -> Int): (Int) -> Int = { f(f(it)) }\n\nfun main() {\n    val addThree = twice { it + 3 }\n    println(addThree(1))\n}',
      choices: ['`7`', '`4`', '`10`'],
      answer: 0,
      why: '`twice` returns a function that applies `f` two times: 1 + 3 + 3 is 7.' },
    { q: 'How do you call a parameter `onDone: (() -> Unit)?` that may be null?',
      choices: ['`onDone?.invoke()`', '`onDone()`', '`onDone!!`'],
      answer: 0,
      why: 'A nullable function type cannot be called directly. `?.invoke()` calls it when it is there, and does nothing when it is null.' },
    { q: 'What does this program print?',
      code: 'fun apply3(x: Int, op: (Int, Int) -> Int) = op(x, 3)\n\nfun main() {\n    println("${apply3(10) { a, b -> a - b }} ${apply3(2, Int::times)}")\n}',
      choices: ['`7 6`', '`-7 6`', '`7 5`'],
      answer: 0,
      why: 'The lambda gets `a` = 10 and `b` = 3. `Int::times` is a reference to multiplication, so 2 × 3 is 6.' }
  ];

  Q['kt-collection-ops'] = [
    { q: 'What does this program print?',
      code: 'fun main() {\n    val xs = listOf(1, 2, 3, 4, 5)\n    println(xs.filter { it % 2 == 1 }.map { it * it })\n}',
      choices: ['`[1, 9, 25]`', '`[4, 16]`', '`[1, 4, 9, 16, 25]`'],
      answer: 0,
      why: '`filter` keeps the odd numbers 1, 3 and 5, and `map` squares each.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    println(listOf("apple", "avocado", "banana").groupBy { it.first() })\n}',
      choices: ['`{a=[apple, avocado], b=[banana]}`', '`{a=avocado, b=banana}`', '`[[apple, avocado], [banana]]`'],
      answer: 0,
      why: '`groupBy` keeps every item, in a list per key. `associateBy` would keep one item per key, the last.' },
    { q: 'What is the difference between `fold` and `reduce`?',
      choices: ['`fold` starts from a value you give (of any type) and accepts an empty list; `reduce` starts from the first item and throws on an empty one', 'None: they are two names for one function', '`reduce` is lazy and `fold` is not'],
      answer: 0,
      why: '`listOf<Int>().fold(0) { a, b -> a + b }` is 0, and `listOf<Int>().reduce { a, b -> a + b }` throws an exception.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val (small, big) = listOf(5, 12, 3, 20).partition { it < 10 }\n    println("$small $big")\n}',
      choices: ['`[5, 3] [12, 20]`', '`[12, 20] [5, 3]`', '`[5, 12, 3, 20] []`'],
      answer: 0,
      why: '`partition` gives a pair: first the items that match, then the rest, each in their original order.' }
  ];

  Q['kt-sequences'] = [
    { q: 'What does this program print?',
      code: 'fun main() {\n    var steps = 0\n    val first = listOf(1, 2, 3, 4).asSequence()\n        .map {\n            steps++\n            it * 10\n        }\n        .first { it > 15 }\n    println("$first $steps")\n}',
      choices: ['`20 2`', '`20 4`', '`10 1`'],
      answer: 0,
      why: 'A sequence takes each item through every step in turn. 1 maps to 10 (not over 15), 2 maps to 20, and `first` stops there: two `map` calls. A list would have mapped all four first.' },
    { q: 'When does the work of `seq.map { … }.filter { … }` run?',
      choices: ['When a terminal operation, such as `toList()`, `first()` or `sum()`, asks for items', 'At once, when `map` is called', 'On another thread'],
      answer: 0,
      why: 'On a sequence, `map` and `filter` only describe the work. Without a terminal operation, nothing runs at all.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    println(generateSequence(1) { it * 3 }.take(4).toList())\n}',
      choices: ['`[1, 3, 9, 27]`', '`[3, 9, 27, 81]`', 'Nothing: the sequence never ends'],
      answer: 0,
      why: 'The sequence would go on forever, but `take(4)` asks for four items, starting from the seed, 1.' },
    { q: 'For a list of 20 items and one `map`, which is usually faster?',
      choices: ['The list operation: a sequence has overhead, and pays off on large data, long chains or an early stop', 'The sequence, always', 'They always take the same time'],
      answer: 0,
      why: 'Laziness costs a little for each item and step. It wins when it avoids work: big collections, many steps, or `first`/`take` that stop early.' }
  ];

  Q['kt-extensions'] = [
    { q: 'What does this program print?',
      code: 'fun String.shout() = uppercase() + "!"\n\nfun main() {\n    println("hi".shout())\n}',
      choices: ['`HI!`', '`hi!`', 'Nothing: `String` has no `shout` function'],
      answer: 0,
      why: 'The extension adds `shout` to `String`. Inside it, `uppercase()` is called on the receiver, `"hi"`.' },
    { q: 'What does this program print?',
      code: 'open class A\nclass B : A()\n\nfun A.who() = "A"\nfun B.who() = "B"\n\nfun main() {\n    val x: A = B()\n    println(x.who())\n}',
      choices: ['`A`', '`B`', 'Nothing: two extensions with one name do not compile'],
      answer: 0,
      why: 'An extension is chosen by the declared type, `A`, when compiling. It is a static function, so it is not overridden by the object\'s real class.' },
    { q: 'Can an extension function read a class\'s `private` members?',
      choices: ['No: it is a static function outside the class, taking the object as a parameter', 'Yes: it becomes part of the class', 'Only for data classes'],
      answer: 0,
      why: 'An extension sees what any outside code sees. It is a nicer way to call a utility function, not a change to the class.' },
    { q: 'A class has a member `fun total(): Int`, and someone writes an extension `fun Cart.total(): Int` for it. Which does `cart.total()` call?',
      choices: ['The member: a member always wins, and the compiler warns that the extension is shadowed', 'The extension, because it was declared later', 'Neither: it does not compile'],
      answer: 0,
      why: 'Extensions can add to a class, never replace what it has. The compiler warns: *This extension is shadowed by a member*.' }
  ];

  Q['kt-scope-functions'] = [
    { q: 'What does this program print?',
      code: 'fun main() {\n    val sb = StringBuilder().apply {\n        append("a")\n        append("b")\n    }\n    val n = "kotlin".let { it.length }\n    println("$sb $n")\n}',
      choices: ['`ab 6`', '`b 6`', '`ab kotlin`'],
      answer: 0,
      why: '`apply` returns the builder after the appends; `let` returns what its block computes, the length.' },
    { q: 'Which two scope functions return the object they were called on?',
      choices: ['`apply` and `also`', '`let` and `run`', '`with` and `let`'],
      answer: 0,
      why: '`apply` and `also` give back their object, so they fit in the middle of a chain. `let`, `run` and `with` give back what their block computes.' },
    { q: 'In which scope functions is the object `it` inside the block?',
      choices: ['`let` and `also`', '`apply` and `run`', '`with` and `apply`'],
      answer: 0,
      why: '`let` and `also` pass the object as a parameter, `it`. `run`, `with` and `apply` make it `this`.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val x: String? = null\n    val r = x?.let { "has ${it.length}" } ?: "empty"\n    println(r)\n}',
      choices: ['`empty`', '`has 0`', '`null`'],
      answer: 0,
      why: '`x?.let` does not run the block when `x` is null; the whole `?.let` is null, so `?:` gives `"empty"`.' }
  ];

  Q['kt-inline'] = [
    { q: 'What does this program print?',
      code: 'fun check(xs: List<Int>): String {\n    xs.forEach {\n        if (it > 2) return "found $it"\n    }\n    return "none"\n}\n\nfun main() {\n    println(check(listOf(1, 5, 9)))\n}',
      choices: ['`found 5`', '`found 9`', '`none`'],
      answer: 0,
      why: '`forEach` is inline, so the `return` inside its lambda returns from `check`, at the first number over 2.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val out = StringBuilder()\n    listOf(1, 2, 3).forEach {\n        if (it == 2) return@forEach\n        out.append(it)\n    }\n    println(out)\n}',
      choices: ['`13`', '`1`', '`123`'],
      answer: 0,
      why: '`return@forEach` leaves only this call of the lambda, like `continue`: 2 is skipped, and 3 is still added.' },
    { q: 'Why are `map`, `filter` and `forEach` declared `inline`?',
      choices: ['So no lambda object is made for each call, and a `return` inside the lambda can leave the function around it', 'So they can run on another thread', 'So they can be overridden'],
      answer: 0,
      why: 'Inlining copies the lambda\'s body into the caller: no object to allocate, and `return` means the caller\'s return.' },
    { q: 'What does `noinline` on a lambda parameter of an inline function mean?',
      choices: ['That lambda stays an object, so the function can store it or pass it on', 'The whole function is no longer inlined', 'The lambda may not use `return@label`'],
      answer: 0,
      why: 'An inlined lambda has no object to store. `noinline` keeps one, for a function that saves the lambda or hands it to non-inline code.' }
  ];

  Q['kt-reified'] = [
    { q: 'Why does `fun <T> isA(x: Any) = x is T` not compile?',
      choices: ['`T` is erased at run time, so there is nothing to check against', 'A generic function cannot use `is`', '`Any` cannot be checked'],
      answer: 0,
      why: '*Cannot check for instance of erased type \'T\'.* The fix is `inline fun <reified T> isA(x: Any) = x is T`.' },
    { q: 'What does a `reified` type parameter need?',
      choices: ['An `inline` function: each call\'s copy knows the real type', 'A class with a companion object', 'A `Class<T>` argument'],
      answer: 0,
      why: '*Only type parameters of inline functions can be reified.* The type is filled into each inlined copy.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val mixed: List<Any> = listOf(1, "a", 2, "b", 3)\n    println(mixed.filterIsInstance<Int>().sum())\n}',
      choices: ['`6`', '`3`', 'Nothing: `sum()` needs a cast first'],
      answer: 0,
      why: '`filterIsInstance<Int>()` keeps 1, 2 and 3, and gives a `List<Int>`, so `sum()` works with no cast.' },
    { q: 'What does this program print?',
      code: 'inline fun <reified T> nameOf() = T::class.java.simpleName\n\nfun main() {\n    println("${nameOf<String>()} ${nameOf<List<String>>()}")\n}',
      choices: ['`String List`', '`String List<String>`', '`T T`'],
      answer: 0,
      why: 'A reified `T` keeps the class, `List`, but not its type argument: that is still erased.' }
  ];
})(window.KLT);
