/*
 * data/quizzes-interop.js - the quiz at the end of each Idioms, DSLs and interop lesson (batch 3).
 *
 * The question shape is described at the top of data/quizzes-basics.js. A question with `code` asks what
 * it prints: its right choice is the output, in backticks, and tests/test_content.py proves it.
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};

  Q['kt-java-from-kotlin'] = [
    { q: 'How does Kotlin call a Java class\'s `getName()` and `setName(x)`?',
      choices: ['As a property: `obj.name` and `obj.name = x`', 'Only as methods: `obj.getName()`', 'Only after adding `@JvmField` to the Java class'],
      answer: 0,
      why: 'Java getters and setters are seen as properties. The method form still compiles, but Kotlin code uses the property.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val sb = java.lang.StringBuilder()\n    sb.append("ab").append("cd")\n    println(sb.length)\n}',
      choices: ['`4`', '`2`', 'Nothing: `length` is a method in Java, so it must be `length()`'],
      answer: 0,
      why: 'A Java `StringBuilder` is a `CharSequence`, whose `length()` Kotlin sees as the property `length`.' },
    { q: 'What is a platform type?',
      choices: ['The type of a value from Java whose nullability Kotlin does not know, such as `String!`; you may use it as nullable or not, at your own risk', 'A primitive type such as `int`', 'A type that exists only on Android'],
      answer: 0,
      why: 'Declaring the type you expect (`val s: String? = javaObj.name`) turns it into an ordinary Kotlin type that the compiler checks.' },
    { q: 'Passing a Kotlin lambda where a Java method expects a `Runnable` is called…',
      choices: ['SAM conversion (single abstract method)', 'Boxing', 'Type erasure'],
      answer: 0,
      why: 'Any Java interface with exactly one abstract method accepts a lambda.' }
  ];

  Q['kt-kotlin-from-java'] = [
    { q: 'How does Java call a top-level function `fun greet()` declared in `Utils.kt`?',
      choices: ['`UtilsKt.greet()`', '`Utils.greet()`', 'It cannot: top-level functions are Kotlin-only'],
      answer: 0,
      why: 'Top-level functions are static methods of the file\'s class, `UtilsKt`; `@file:JvmName("Utils")` renames it.' },
    { q: 'What does `@JvmOverloads` do?',
      choices: ['Writes a Java overload for the default arguments, dropping them one at a time from the right', 'Makes a function static', 'Lets Java pass arguments by name'],
      answer: 0,
      why: 'Java has no default arguments, so without overloads it must pass every argument.' },
    { q: 'A companion object has `fun create()`, without `@JvmStatic`. How does Java call it?',
      choices: ['`MyClass.Companion.create()`', '`MyClass.create()`', 'It cannot'],
      answer: 0,
      why: 'The companion is an object named `Companion`. `@JvmStatic` adds a static `MyClass.create()` as well.' },
    { q: 'What does this program print?',
      code: 'import java.lang.reflect.Modifier\n\nobject Counter {\n    @JvmStatic fun next() = 1\n    fun peek() = 0\n}\n\nfun main() {\n    val c = Counter::class.java\n    println("${Modifier.isStatic(c.getMethod("next").modifiers)} ${Modifier.isStatic(c.getMethod("peek").modifiers)}")\n}',
      choices: ['`true false`', '`true true`', '`false false`'],
      answer: 0,
      why: 'An `object`\'s functions are instance methods on `Counter.INSTANCE`; `@JvmStatic` makes a static one too.' }
  ];

  Q['kt-dsls'] = [
    { q: 'In `fun build(block: StringBuilder.() -> Unit)`, what is `this` inside the lambda passed as `block`?',
      choices: ['The `StringBuilder` the function runs it on', 'The object that called `build`', 'The lambda itself'],
      answer: 0,
      why: 'A lambda with a receiver runs on an object of the receiver type, so its members are called without a name.' },
    { q: 'What does this program print?',
      code: 'fun text(block: StringBuilder.() -> Unit) = StringBuilder().apply(block).toString()\n\nfun main() {\n    println(text {\n        append("a")\n        append(1 + 1)\n        append(\'c\')\n    })\n}',
      choices: ['`a2c`', '`a1+1c`', '`[a, 2, c]`'],
      answer: 0,
      why: '`apply` runs the block on the new builder and returns it; `append(1 + 1)` appends the number 2.' },
    { q: 'What does `@DslMarker` stop?',
      choices: ['Calling an outer receiver\'s members, without naming it, from inside an inner block', 'Creating the builder\'s objects', 'Using lambdas in the DSL'],
      answer: 0,
      why: 'Without it, `row { row { } }` would quietly call the table\'s `row()` from inside a row.' },
    { q: 'Which Kotlin DSL do many Java developers already use?',
      choices: ['Gradle\'s `build.gradle.kts`', 'Maven\'s `pom.xml`', 'Java\'s `module-info.java`'],
      answer: 0,
      why: 'A Gradle Kotlin build file is Kotlin code: functions taking lambdas with receivers, completed and checked by the IDE.' }
  ];

  Q['kt-build-functions'] = [
    { q: 'What does this program print?',
      code: 'fun main() {\n    println(buildString {\n        append("ab")\n        append(3)\n        reverse()\n    })\n}',
      choices: ['`3ba`', '`ab3`', '`ba3`'],
      answer: 0,
      why: 'The block runs on a `StringBuilder`: "ab", then "ab3", then reversed to "3ba".' },
    { q: 'What is the type of `buildList { add(1) }`?',
      choices: ['`List<Int>`: read-only once built', '`MutableList<Int>`', '`ArrayList<Any>`'],
      answer: 0,
      why: 'Inside the block you add to a `MutableList`; the result is handed out as a read-only `List`.' },
    { q: 'When is `buildList { … }` a better choice than `listOf(…)`?',
      choices: ['When the items come from loops and conditions, and the list should be read-only afterwards', 'Always: it is faster', 'Never: it is the same as `mutableListOf()`'],
      answer: 0,
      why: 'For a fixed set of items, `listOf(a, b, c)` says it directly.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val m = buildMap {\n        put("a", 1)\n        put("a", 2)\n    }\n    println(m)\n}',
      choices: ['`{a=2}`', '`{a=1}`', '`{a=1, a=2}`'],
      answer: 0,
      why: 'A map holds one value per key: the second `put` replaces the first.' }
  ];

  Q['kt-fun-interfaces'] = [
    { q: 'Why must a Kotlin interface be declared `fun interface` before a lambda can stand for it?',
      choices: ['Kotlin converts lambdas only to its own interfaces declared `fun interface`; Java interfaces with one abstract method always convert', 'All Kotlin interfaces convert; `fun` makes it faster', 'Only so that Java can call it'],
      answer: 0,
      why: 'Kotlin has function types, so it does not need an interface for every callback. `fun interface` asks for the conversion explicitly.' },
    { q: 'What does this program print?',
      code: 'fun interface Op {\n    fun run(a: Int): Int\n}\n\nfun twice(op: Op, x: Int) = op.run(op.run(x))\n\nfun main() {\n    println(twice({ it * 3 }, 2))\n}',
      choices: ['`18`', '`6`', '`12`'],
      answer: 0,
      why: 'The lambda becomes an `Op`: 2 × 3 = 6, then 6 × 3 = 18.' },
    { q: 'How many abstract methods can a `fun interface` have?',
      choices: ['Exactly one; it may also have members with bodies', 'Any number', 'None'],
      answer: 0,
      why: 'One abstract method is what a lambda can implement.' },
    { q: 'Which of these takes a Kotlin lambda?',
      choices: ['Java\'s `Runnable`', 'A Java abstract class with one abstract method', 'A Java interface with two abstract methods'],
      answer: 0,
      why: 'SAM conversion is for interfaces with a single abstract method, not for abstract classes.' }
  ];

  Q['kt-annotations'] = [
    { q: 'What is the default retention of a Kotlin `annotation class`?',
      choices: ['`RUNTIME`: reflection can see it', '`CLASS`, as in Java', '`SOURCE`'],
      answer: 0,
      why: 'Java\'s default is `CLASS`, which reflection cannot read; Kotlin\'s is `RUNTIME`.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    println(String::class.java.name)\n}',
      choices: ['`java.lang.String`', '`kotlin.String`', '`String`'],
      answer: 0,
      why: '`::class.java` is the Java `Class`, and Kotlin\'s `String` is `java.lang.String` on the JVM. (`String::class.qualifiedName` gives `kotlin.String`.)' },
    { q: 'What is the difference between `@field:Column` and `@get:Column` on a property?',
      choices: ['The first puts the annotation on the Java field, the second on the getter method', 'None', 'The first makes a field, the second a getter'],
      answer: 0,
      why: 'One Kotlin property is a field and a getter (and more) for Java; frameworks look in one particular place.' },
    { q: 'What are `Foo::class` and `Foo::class.java`?',
      choices: ['A Kotlin `KClass`, and the Java `Class` for the same class', 'The same object', 'A class and its companion'],
      answer: 0,
      why: 'Java APIs such as `getAnnotation` take a Java `Class`: pass `Route::class.java`.' }
  ];

  Q['kt-testing'] = [
    { q: 'What does this program print?',
      code: 'import kotlin.test.assertFailsWith\n\nfun main() {\n    val e = assertFailsWith<ArithmeticException> { 10 / "0".toInt() }\n    println(e.message)\n}',
      choices: ['`/ by zero`', '`ArithmeticException`', 'Nothing: the test fails'],
      answer: 0,
      why: '`assertFailsWith` returns the exception the block threw, here the JVM\'s `ArithmeticException: / by zero`.' },
    { q: 'In `assertEquals(a, b)`, which one is the expected value?',
      choices: ['The first', 'The second', 'Either: the message is the same'],
      answer: 0,
      why: 'The failure message reads `Expected <a>, actual <b>.`, so swapping them makes it misleading.' },
    { q: 'What does `kotlin.test` give you?',
      choices: ['One set of assertions, such as `assertFailsWith<T>`, that runs on JUnit 4 and 5, TestNG and Kotlin\'s other platforms', 'A mocking library', 'A test runner of its own that replaces JUnit'],
      answer: 0,
      why: 'On the JVM it sits on top of JUnit: `kotlin.test.Test` is JUnit\'s `@Test`.' },
    { q: 'Can a Kotlin test function\'s name contain spaces?',
      choices: ['Yes, written in backticks, on the JVM', 'No', 'Only in a comment'],
      answer: 0,
      why: '`` fun `a cart adds up its items`() `` is a common style for test names on the JVM.' }
  ];
})(window.KLT);
