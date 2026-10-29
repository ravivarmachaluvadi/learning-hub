/*
 * data/quizzes-basics.js - the quiz at the end of each Basics lesson (js/views/quiz.js draws them).
 *
 * Q['<lesson id>'] = [{q (Markdown), code? (a whole program, shown under the question), choices: [..],
 *   answer (the index of the right choice), why}]
 * A question with `code` asks what it prints: its right choice is the output, in backticks, and
 * tests/test_content.py runs the program to prove it (and that no wrong choice is the output too).
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};

  Q['kt-first-program'] = [
    { q: 'Where does a Kotlin program start running?',
      choices: ['At `fun main()`, a function at the top level of the file', 'At `public static void main` inside a class you write', 'At the first line of the file, like a script'],
      answer: 0,
      why: 'A Kotlin program starts at `main`, which needs no class around it. The compiler puts top-level functions into a class named after the file (`MainKt` for `main.kt`).' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    print("a")\n    print("b")\n    println("c")\n}',
      choices: ['`abc`', '`a`, `b` and `c`, on three lines', '`a b c`'],
      answer: 0,
      why: '`print` does not end the line; only `println` does. So all three letters land on one line, with nothing between them.' },
    { q: 'The compiler turns `main.kt`, holding a top-level `fun main()`, into a class. What is the class called?',
      choices: ['`MainKt`', '`Main`', '`main`', '`Kotlin`'],
      answer: 0,
      why: 'A file\'s top-level functions go into a class named after the file, with `Kt` added. You see it in stack traces (`at MainKt.main(main.kt:3)`), and Java code calls the functions through it (`MainKt.greet()`).' },
    { q: 'Which is true of semicolons in Kotlin?',
      choices: ['They are optional: the end of a line ends a statement', 'Every statement needs one, as in Java', 'They are not allowed'],
      answer: 0,
      why: 'A line break ends a statement. A `;` is allowed, and needed only to put two statements on one line.' }
  ];

  Q['kt-variables'] = [
    { q: 'Which of these does **not** compile?',
      choices: ['`val a = 1`, then `a = 2`', '`var b = 1`, then `b = 2`', '`val c: Int`, then `c = 3` (once)'],
      answer: 0,
      why: 'A `val` is assigned once. `c` is fine: a `val` declared without a value can be assigned exactly once later.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val items = mutableListOf(1, 2)\n    items.add(3)\n    println(items.size)\n}',
      choices: ['`3`', '`2`', 'Nothing: it does not compile, because `items` is a `val`'],
      answer: 0,
      why: '`val` fixes which list `items` names, not what the list holds. The list is a mutable one, so `add` works.' },
    { q: 'What is the type of `x` in `val x = 2.5`?',
      choices: ['`Double`', '`Float`', 'None until it is used: Kotlin is dynamically typed'],
      answer: 0,
      why: 'A decimal literal is a `Double` (a `Float` needs an `f`: `2.5f`). The type is inferred once, at compile time, and fixed.' },
    { q: 'What does `const val` give you that a plain `val` does not?',
      choices: ['A compile-time constant, copied into the code that uses it, like Java\'s `static final`', 'A value that can never be reassigned (a plain `val` can be)', 'A variable that is faster to change'],
      answer: 0,
      why: 'Both are read-only. `const val` also must be known when compiling (a number or a string, at the top level or in an `object`), and the compiler inlines it into every use.' }
  ];

  Q['kt-numbers'] = [
    { q: 'What does this program print?',
      code: 'fun main() {\n    println(7 / 2)\n}',
      choices: ['`3`', '`3.5`', '`4`'],
      answer: 0,
      why: 'Both sides are `Int`, so the division drops the fraction, as in Java. `7 / 2.0` or `7.toDouble() / 2` gives 3.5.' },
    { q: '`val i: Int = 5`. Which line compiles?',
      choices: ['`val l: Long = i.toLong()`', '`val l: Long = i`', '`val l: Long = (Long) i`'],
      answer: 0,
      why: 'Kotlin never widens a number by itself, and has no `(Long)` cast syntax. You convert on purpose with `toLong()`.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    println("12".toInt() + "3".toInt())\n}',
      choices: ['`15`', '`123`', '`12 3`'],
      answer: 0,
      why: '`toInt()` turns each text into a number, so `+` adds two `Int`s.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    println(\'a\' + 2)\n}',
      choices: ['`c`', '`99`', '`a2`'],
      answer: 0,
      why: 'A `Char` is not a number in Kotlin. Adding an `Int` to a `Char` moves along the alphabet: `\'a\' + 2` is `\'c\'`. Its number is `\'c\'.code`, 99.' }
  ];

  Q['kt-strings'] = [
    { q: 'What does this program print?',
      code: 'fun main() {\n    val n = 4\n    println("n = $n, squared = ${n * n}")\n}',
      choices: ['`n = 4, squared = 16`', '`n = $n, squared = ${n * n}`', '`n = 4, squared = n * n`'],
      answer: 0,
      why: '`$n` puts in the value of `n`, and `${…}` the value of any expression.' },
    { q: 'How do you get the number of characters in a string `s`?',
      choices: ['`s.length`', '`s.length()`', '`s.size`', '`len(s)`'],
      answer: 0,
      why: '`length` is a property in Kotlin, so it has no brackets. Collections have `size`.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val a = "Hi"\n    val b = "hI".lowercase().replace(\'h\', \'H\')\n    println(a == b)\n}',
      choices: ['`true`', '`false`'],
      answer: 0,
      why: '`==` calls `equals`: the same characters, so `true`. Java\'s `==` would compare the two objects and say `false`, because `b` is a new string made at run time.' },
    { q: 'What is `"abc"[1]`?',
      choices: ['The `Char` `\'b\'`', 'The `String` `"b"`', 'A compile error: use `charAt(1)`'],
      answer: 0,
      why: 'Indexing a string gives a `Char`, Java\'s `charAt`. Indexes start at 0.' }
  ];

  Q['kt-conditions'] = [
    { q: 'What does this program print?',
      code: 'fun main() {\n    val x = 5\n    println(if (x > 3) "big" else "small")\n}',
      choices: ['`big`', '`small`', 'Nothing: `if` cannot be inside `println`'],
      answer: 0,
      why: '`if` is an expression with a value, so it can go anywhere a value can, such as an argument.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val n = 3\n    val size = when (n) {\n        1, 2 -> "low"\n        in 3..5 -> "mid"\n        else -> "high"\n    }\n    println(size)\n}',
      choices: ['`mid`', '`low`', '`high`'],
      answer: 0,
      why: '3 is not 1 or 2, but it is in the range `3..5`, so the second branch matches.' },
    { q: 'Why has Kotlin no `a ? b : c`?',
      choices: ['`if` is an expression, so `if (a) b else c` already gives the value', 'It was dropped to keep the language small, so there is no way to choose a value inline', 'The `?` is taken by nullable types'],
      answer: 0,
      why: 'Since `if` (and `when`) give values, a separate ternary would be a second way to write the same thing.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val n = 1\n    when (n) {\n        1 -> print("one ")\n        2 -> print("two ")\n        else -> print("other ")\n    }\n    println("done")\n}',
      choices: ['`one done`', '`one two other done`', '`one two done`'],
      answer: 0,
      why: '`when` never falls through to the next branch: the first match runs, and then `when` is done. No `break` is needed.' }
  ];

  Q['kt-loops'] = [
    { q: 'What does this program print?',
      code: 'fun main() {\n    println((1 until 4).toList())\n}',
      choices: ['`[1, 2, 3]`', '`[1, 2, 3, 4]`', '`[0, 1, 2, 3]`'],
      answer: 0,
      why: '`until` leaves out the end. `1..4` would include it.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    println((10 downTo 1 step 4).toList())\n}',
      choices: ['`[10, 6, 2]`', '`[10, 6, 2, 1]`', '`[]`'],
      answer: 0,
      why: '`downTo` counts down from 10, and `step 4` takes every fourth number: 10, 6, 2. The next, -2, is past 1.' },
    { q: 'How do you write Java\'s `for (int i = 0; i < n; i++)` in Kotlin?',
      choices: ['`for (i in 0 until n)`', '`for (i in 0..n)`', '`for (var i = 0; i < n; i++)`'],
      answer: 0,
      why: '`0..n` includes `n`, one time more than Java\'s loop. Kotlin has no C-style `for` at all.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    var count = 0\n    outer@ for (i in 1..3) {\n        for (j in 1..3) {\n            if (j > i) continue@outer\n            count++\n        }\n    }\n    println(count)\n}',
      choices: ['`6`', '`9`', '`3`'],
      answer: 0,
      why: '`continue@outer` jumps to the next `i` as soon as `j` passes it, so the inner loop runs 1, then 2, then 3 times: 6 in all.' }
  ];

  Q['kt-functions'] = [
    { q: 'What does this program print?',
      code: 'fun tag(text: String, open: String = "<", close: String = ">") = "$open$text$close"\n\nfun main() {\n    println(tag("b", close = "/>"))\n}',
      choices: ['`<b/>`', '`/>b>`', 'Nothing: `open` was skipped, so it does not compile'],
      answer: 0,
      why: 'Naming `close` skips `open`, which keeps its default `"<"`.' },
    { q: 'What does a function with a `{ }` body and no return type return?',
      choices: ['`Unit`, Kotlin\'s `void`, which you can leave out', 'The value of its last line', '`null`'],
      answer: 0,
      why: 'Only a single-expression function (`= …`) infers its return type. A block body returns `Unit` unless it declares a type and returns a value.' },
    { q: 'A Java class calls `fun greet(name: String, greeting: String = "Hello")`. What can it pass?',
      choices: ['Both arguments, always, unless the function has `@JvmOverloads`', 'Just the name: Java sees the default', 'Named arguments'],
      answer: 0,
      why: 'Java has no default or named arguments. `@JvmOverloads` makes the compiler write `greet(String)` for Java callers.' },
    { q: 'What does this program print?',
      code: 'fun sq(x: Int) = x * x\n\nfun main() {\n    println(sq(sq(2)))\n}',
      choices: ['`16`', '`8`', '`4`'],
      answer: 0,
      why: '`sq(2)` is 4, and `sq(4)` is 16.' }
  ];

  Q['kt-null-safety'] = [
    { q: 'What does this program print?',
      code: 'fun main() {\n    val s: String? = null\n    println(s?.length ?: 0)\n}',
      choices: ['`0`', '`null`', 'It throws a `NullPointerException`'],
      answer: 0,
      why: '`s?.length` is `null` because `s` is, and `?: 0` turns the null into 0.' },
    { q: 'What does `x!!` do when `x` is null?',
      choices: ['Throws a `NullPointerException`', 'Gives `null`', 'It does not compile'],
      answer: 0,
      why: '`!!` asserts the value is not null. When it is null, it throws, which is why `!!` is best kept rare.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val a: Any = "hello"\n    if (a is String) println(a.uppercase()) else println("not a string")\n}',
      choices: ['`HELLO`', '`hello`', '`not a string`'],
      answer: 0,
      why: 'After `a is String`, `a` is smart-cast to `String` inside the branch, so `uppercase()` can be called without a cast.' },
    { q: 'Which type is a list that may itself be null, but holds no nulls?',
      choices: ['`List<String>?`', '`List<String?>`', '`List<String?>?`'],
      answer: 0,
      why: 'The `?` belongs to whatever it follows: after `>`, the list may be null; after `String`, the elements may be.' }
  ];

  Q['kt-exceptions'] = [
    { q: 'What must a Kotlin function that may throw `IOException` declare?',
      choices: ['Nothing: Kotlin has no checked exceptions', '`throws IOException`, as in Java', '`@Throws(IOException::class)`, always'],
      answer: 0,
      why: 'No exception has to be declared or caught. `@Throws` is only for Java callers, who otherwise could not catch it.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val n = try { "x".toInt() } catch (e: NumberFormatException) { -1 }\n    println(n)\n}',
      choices: ['`-1`', '`0`', 'It throws `NumberFormatException`'],
      answer: 0,
      why: '`try` is an expression: its value is the value of the block that ran, here the `catch` block.' },
    { q: 'Which call throws `IllegalArgumentException` when its condition is false?',
      choices: ['`require(condition)`', '`check(condition)`', '`error(condition)`'],
      answer: 0,
      why: '`require` checks arguments (`IllegalArgumentException`); `check` checks state (`IllegalStateException`); `error` always throws.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val r = runCatching { 10 / 0 }\n    println(r.isFailure)\n}',
      choices: ['`true`', '`false`', 'It throws `ArithmeticException`'],
      answer: 0,
      why: '`runCatching` catches the `ArithmeticException` into a failed `Result`.' }
  ];

  Q['kt-collections'] = [
    { q: 'What does this program print?',
      code: 'fun main() {\n    val a = listOf(3, 1, 2)\n    val b = a.sorted()\n    println("$a $b")\n}',
      choices: ['`[3, 1, 2] [1, 2, 3]`', '`[1, 2, 3] [1, 2, 3]`', 'Nothing: a `List` cannot be sorted'],
      answer: 0,
      why: '`sorted()` returns a new list and leaves `a` as it was.' },
    { q: 'What does `map["missing"]` give for a `Map<String, Int>` without that key?',
      choices: ['`null`: the result type is `Int?`', '`0`', 'It throws `NoSuchElementException`'],
      answer: 0,
      why: 'A missing key gives null, so the type of `map[key]` is nullable. `getValue(key)` throws instead, and `getOrDefault` gives a default.' },
    { q: 'Which of these does **not** compile?',
      choices: ['`listOf(1, 2).add(3)`', '`mutableListOf(1, 2).add(3)`', '`listOf(1, 2) + 3`'],
      answer: 0,
      why: 'A `List` is read-only: it has no `add`. `+` makes a new list, which is allowed.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val m = mapOf("a" to 1, "b" to 2)\n    println(m.size + (m["c"] ?: 10))\n}',
      choices: ['`12`', '`3`', '`2`'],
      answer: 0,
      why: 'The map has 2 entries, and the missing `"c"` gives null, which `?: 10` turns into 10.' }
  ];
})(window.KLT);
