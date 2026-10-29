/*
 * data/quizzes-types.js - the quiz at the end of each Types in depth lesson (batch 3).
 *
 * The question shape is described at the top of data/quizzes-basics.js. A question with `code` asks what
 * it prints: its right choice is the output, in backticks, and tests/test_content.py proves it.
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};

  Q['kt-generics'] = [
    { q: 'Which Kotlin type matches Java\'s `List<? extends Number>`?',
      choices: ['`List<out Number>`, which is just `List<Number>`, since `List` is declared `out`', '`List<in Number>`', '`List<*>`'],
      answer: 0,
      why: '`out` is "produces Ts": Java\'s `? extends`. Because Kotlin\'s `List` is declared `List<out E>`, a `List<Int>` already passes where a `List<Number>` is asked for.' },
    { q: 'What does this program print?',
      code: 'open class Fruit(val name: String)\nclass Apple : Fruit("apple")\n\nfun show(items: List<Fruit>) = items.joinToString { it.name }\n\nfun main() {\n    val apples: List<Apple> = listOf(Apple(), Apple())\n    println(show(apples))\n}',
      choices: ['`apple, apple`', 'Nothing: it does not compile, because a `List<Apple>` is not a `List<Fruit>`', '`Apple, Apple`'],
      answer: 0,
      why: '`List` is covariant (`out E`), so a list of apples is a list of fruit. With a `MutableList` parameter it would not compile.' },
    { q: 'Why is a `MutableList<Cat>` not a `MutableList<Animal>`?',
      choices: ['Through a `MutableList<Animal>`, code could add a `Dog` to the list of cats', 'Because `Cat` is final', 'Because type arguments are erased at run time'],
      answer: 0,
      why: 'A type that both takes Ts in and gives Ts out must be invariant. `List` only gives them out, so it can be `out`.' },
    { q: 'What can you do with a `MutableList<*>`?',
      choices: ['Read its items, as `Any?`, and ask its size; but not add to it', 'Add any value to it', 'Nothing at all: it cannot be used'],
      answer: 0,
      why: 'A star projection is a list of some type you do not know. Every item is at least an `Any?`, but nothing you have is known to be of its type.' }
  ];

  Q['kt-any-unit-nothing'] = [
    { q: 'What does this program print?',
      code: 'fun main() {\n    val u = print("x ")\n    println(u)\n}',
      choices: ['`x kotlin.Unit`', '`x null`', '`x void`'],
      answer: 0,
      why: '`print` returns `Unit`, a real object, and printing it shows `kotlin.Unit`.' },
    { q: 'What is the type of `throw IllegalStateException()`, used as an expression?',
      choices: ['`Nothing`', '`Unit`', '`Throwable`', '`Any`'],
      answer: 0,
      why: '`throw`, `return`, `break`, `continue`, `TODO()` and `error()` never give a value, so their type is `Nothing`, which fits where any type is expected.' },
    { q: 'Why does `val n = text.toIntOrNull() ?: return` compile inside a function?',
      choices: ['`return` is an expression of type `Nothing`, and `Nothing` fits where an `Int` is expected', '`?:` turns `return` into 0', 'It does not compile: `return` is a statement'],
      answer: 0,
      why: 'The right side of `?:` never gives a value, so `n` is an `Int` whenever the line finishes.' },
    { q: 'What is Kotlin\'s `Any` in Java terms?',
      choices: ['`java.lang.Object`: every class extends it; in Kotlin it has only `equals`, `hashCode` and `toString`', '`void`', 'A wildcard, like `?`'],
      answer: 0,
      why: '`Any` is the top of the class tree. `Any?` adds null to it.' }
  ];

  Q['kt-equality'] = [
    { q: 'What does this program print?',
      code: 'data class P(val x: Int)\n\nfun main() {\n    val a = P(1)\n    val b = P(1)\n    println("${a == b} ${a === b}")\n}',
      choices: ['`true false`', '`false false`', '`true true`'],
      answer: 0,
      why: '`==` calls the data class\'s `equals`, which compares `x`. `===` asks whether they are one object, and they are two.' },
    { q: 'What does `a == b` compile to, when `a` may be null?',
      choices: ['`a?.equals(b) ?: (b === null)`: it never throws on a null', '`a.equals(b)`, which throws when `a` is null', '`a === b`'],
      answer: 0,
      why: 'That is why `==` is the safe way to compare in Kotlin, with no need for Java\'s `Objects.equals`.' },
    { q: 'You override `equals` in a class. What else must you override?',
      choices: ['`hashCode`, so that equal objects land in the same bucket of a `HashSet` or `HashMap`', '`toString`', '`compareTo`'],
      answer: 0,
      why: 'Hash-based collections compare hash codes first. Equal objects with different hash codes are treated as different keys.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val a = arrayOf(1, 2)\n    val b = arrayOf(1, 2)\n    println("${a.contentEquals(b)} ${listOf(1, 2) == listOf(1, 2)}")\n}',
      choices: ['`true true`', '`false true`', '`true false`'],
      answer: 0,
      why: 'An array\'s own `equals` is identity (it is a Java array), so arrays are compared with `contentEquals`. Lists compare their items.' }
  ];

  Q['kt-class-delegation'] = [
    { q: 'What does `class A(b: B) : B by b` generate, when `B` is an interface?',
      choices: ['Every member of `B` in `A`, each one forwarding to `b`', 'A subclass of `b`\'s class', 'A copy of `b`'],
      answer: 0,
      why: 'The compiler writes the forwarding methods. You override only the ones that should behave differently.' },
    { q: 'What does this program print?',
      code: 'interface Greeter {\n    fun name(): String\n    fun greet(): String = "Hello, ${name()}"\n}\n\nclass Default : Greeter {\n    override fun name() = "world"\n}\n\nclass Custom(g: Greeter) : Greeter by g {\n    override fun name() = "Kotlin"\n}\n\nfun main() {\n    println(Custom(Default()).greet())\n}',
      choices: ['`Hello, world`', '`Hello, Kotlin`', 'Nothing: `greet` is not overridden'],
      answer: 0,
      why: '`greet` is forwarded to the `Default` object, and the `name()` it calls is `Default`\'s own. A delegate never calls back into the object that wraps it.' },
    { q: 'What can come after `by` in a class header?',
      choices: ['An object implementing an interface the class declares: only interfaces can be delegated', 'Any open class', 'Any class at all'],
      answer: 0,
      why: 'Class delegation implements an *interface* by forwarding. Members of `Any` (`toString`, `equals`, `hashCode`) are not forwarded.' },
    { q: 'Which Java pattern does class delegation make short?',
      choices: ['A decorator or forwarding wrapper, which forwards every method by hand', 'A singleton', 'A builder'],
      answer: 0,
      why: 'A Java decorator writes one forwarding method per interface method. `by` writes them for you.' }
  ];

  Q['kt-property-delegates'] = [
    { q: 'What does this program print?',
      code: 'val x: String by lazy {\n    print("init ")\n    "v"\n}\n\nfun main() {\n    print("a ")\n    print(x + " ")\n    println(x)\n}',
      choices: ['`a init v v`', '`init a v v`', '`a init v init v`'],
      answer: 0,
      why: 'The block runs the first time `x` is read, after `a ` was printed, and only once.' },
    { q: 'With several threads reading a `by lazy` property at once, how often does its block run, by default?',
      choices: ['Exactly once: the default mode is `SYNCHRONIZED`', 'Once per thread', 'It is not allowed: `lazy` is for one thread'],
      answer: 0,
      why: '`LazyThreadSafetyMode.SYNCHRONIZED` is the default. `PUBLICATION` lets several threads compute and keeps the first result; `NONE` does no locking.' },
    { q: 'What does an object need, to be the delegate of a `val`?',
      choices: ['An `operator fun getValue(thisRef, property)`', 'To implement `Comparable`', 'A backing field'],
      answer: 0,
      why: 'A `var` also needs `operator fun setValue(thisRef, property, value)`. The interfaces `ReadOnlyProperty` and `ReadWriteProperty` declare the same functions.' },
    { q: 'The block of a `Delegates.vetoable` property returns `false`. What happens to the assignment?',
      choices: ['It is ignored: the property keeps its old value', 'It throws an exception', 'The property becomes null'],
      answer: 0,
      why: 'vetoable runs before the change and may refuse it. observable runs after the change and cannot.' }
  ];

  Q['kt-operators'] = [
    { q: 'What does `a[i] = v` call?',
      choices: ['`a.set(i, v)`', '`a.put(i, v)`', '`a.assign(i, v)`'],
      answer: 0,
      why: 'Indexing is `get` and `set`, marked `operator`. For a map, `set` is the standard library\'s name for `put`.' },
    { q: 'What does this program print?',
      code: 'data class P(val a: Int, val b: Int) {\n    operator fun plus(o: P) = P(a + o.a, b + o.b)\n}\n\nfun main() {\n    val (x, y) = P(1, 2) + P(10, 20)\n    println("$x $y")\n}',
      choices: ['`11 22`', '`P(a=11, b=22)`', '`1 2`'],
      answer: 0,
      why: '`+` calls `plus`, and `val (x, y)` calls the data class\'s `component1()` and `component2()`.' },
    { q: 'How does `val (a, b) = user` decide what goes into `a`?',
      choices: ['By position: `a` is `component1()`, the first constructor property of a data class', 'By name: `a` must be a property called `a`', 'Alphabetically'],
      answer: 0,
      why: 'Destructuring is positional, so `val (age, name) = user` compiles when the types allow it, and swaps the values silently.' },
    { q: 'What does `x in list` compile to?',
      choices: ['`list.contains(x)`', '`x.contains(list)`', '`list.indexOf(x) > 0`'],
      answer: 0,
      why: '`in` calls `contains` on the right side; `!in` negates it.' }
  ];

  Q['kt-type-aliases'] = [
    { q: 'Is `typealias UserId = Int` a new type?',
      choices: ['No: it is another name for `Int`, so any `Int` is accepted where a `UserId` is asked for', 'Yes, like a value class', 'Yes, but only at run time'],
      answer: 0,
      why: 'Aliases are replaced at compile time. A value class (`@JvmInline value class UserId(val v: Int)`) is a real new type.' },
    { q: 'Which of these can be a `const val`?',
      choices: ['`const val NAME = "app"` at the top level', '`const val now = System.currentTimeMillis()`', '`const val ids = listOf(1, 2)`'],
      answer: 0,
      why: 'A `const val` must be a primitive or a `String` known when compiling, at the top level or in an `object`.' },
    { q: 'What does `String!` in a compiler message mean?',
      choices: ['A platform type: a `String` from Java that may or may not be null; Kotlin does not know', 'A `String` that must not be null', 'A `String` that has to be initialized'],
      answer: 0,
      why: 'You can use it as `String` or `String?`. Declaring the type you expect makes the compiler check from then on.' },
    { q: 'What does this program print?',
      code: 'fun main() {\n    val p: String? = System.getProperty("not.a.real.property")\n    println(p?.length ?: -1)\n}',
      choices: ['`-1`', '`0`', '`null`'],
      answer: 0,
      why: 'The property is not set, so `getProperty` returns null; declared `String?`, Kotlin makes you handle it, here with `?:`.' }
  ];
})(window.KLT);
