/*
 * data/quizzes-classes.js - the quiz at the end of each Classes and objects lesson.
 *
 * The question shape is described at the top of data/quizzes-basics.js. A question with `code` asks
 * what it prints: its right choice is the output, in backticks, and tests/test_content.py runs the
 * program to prove it (and that no wrong choice is the output too).
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};

  Q['kt-constructors'] = [
    { q: 'What does this program print?',
      code: 'class Box(size: Int) {\n    val doubled = size * 2\n    init {\n        print("init ")\n    }\n}\n\nfun main() {\n    print("start ")\n    println(Box(4).doubled)\n}',
      choices: ['`start init 8`', '`init start 8`', '`start 8`'],
      answer: 0,
      why: 'The `init` block runs while `Box(4)` is being made: after `start ` is printed, and before `.doubled` is read.' },
    { q: 'In `class Person(name: String, val age: Int)`, what is the difference between `name` and `age`?',
      choices: ['`age` is a property; `name` is only a constructor parameter, usable in initializers and `init` blocks', 'None: both are properties', '`name` is private and `age` is public'],
      answer: 0,
      why: '`val` (or `var`) in front of a constructor parameter makes it a property too. Without it, the parameter exists only while the object is being made.' },
    { q: 'A class has a primary constructor. What must a secondary constructor `constructor(side: Int)` do?',
      choices: ['Call the primary one, with `: this(…)`', 'Repeat the primary constructor\'s `init` code', 'Be marked `open`'],
      answer: 0,
      why: 'Every secondary constructor delegates to the primary one, so the `init` blocks and property initializers always run, whichever constructor was called.' },
    { q: 'What does this program print?',
      code: 'class Order(val item: String, val qty: Int = 1, val gift: Boolean = false)\n\nfun main() {\n    val o = Order("pen", gift = true)\n    println("${o.item} ${o.qty} ${o.gift}")\n}',
      choices: ['`pen 1 true`', '`pen true false`', 'Nothing: it does not compile, because `qty` is skipped'],
      answer: 0,
      why: 'A named argument can skip the defaults before it: `qty` keeps its default of 1, and `gift` is set by name.' }
  ];

  Q['kt-properties'] = [
    { q: 'What does this program print?',
      code: 'class Score {\n    var points = 0\n        set(value) {\n            field = if (value < 0) 0 else value\n        }\n}\n\nfun main() {\n    val s = Score()\n    s.points = -5\n    print("${s.points} ")\n    s.points = 7\n    println(s.points)\n}',
      choices: ['`0 7`', '`-5 7`', '`0 0`'],
      answer: 0,
      why: 'Every assignment goes through the setter: -5 is stored as 0, and 7 as 7.' },
    { q: 'Inside a custom setter for `points`, why write `field = value` rather than `points = value`?',
      choices: ['`points = value` would call the setter again, over and over, until the stack overflows', 'Both work the same', '`field` makes the property public'],
      answer: 0,
      why: 'Inside its own accessors, the property\'s name means the property, so assigning it calls the setter. `field` is the stored value itself.' },
    { q: 'Which of these is allowed?',
      choices: ['`lateinit var name: String`', '`lateinit val name: String`', '`lateinit var count: Int`', '`lateinit var name: String?`'],
      answer: 0,
      why: '`lateinit` needs a `var` (it is set later), a non-null type, and not a primitive such as `Int` (*\'lateinit\' modifier is not allowed on properties of primitive types*).' },
    { q: 'What does this program print?',
      code: 'class Clock {\n    var ticks = 0\n    val label: String\n        get() = "ticks=$ticks"\n    val firstLabel = "ticks=$ticks"\n}\n\nfun main() {\n    val c = Clock()\n    c.ticks = 3\n    println("${c.label} ${c.firstLabel}")\n}',
      choices: ['`ticks=3 ticks=0`', '`ticks=3 ticks=3`', '`ticks=0 ticks=0`'],
      answer: 0,
      why: '`label` has a getter, so it is worked out on each read. `firstLabel` was worked out once, when the clock was made and `ticks` was 0.' }
  ];

  Q['kt-visibility'] = [
    { q: 'What is the visibility of a Kotlin class or function written with no modifier?',
      choices: ['`public`', 'Package-private, as in Java', '`internal`', '`private`'],
      answer: 0,
      why: 'Kotlin\'s default is `public`. It has no package-private; `internal` (the module) is the nearest.' },
    { q: 'Which modifier makes a function visible to every file of the same module, and to nothing outside it?',
      choices: ['`internal`', '`protected`', '`private`', '`public`'],
      answer: 0,
      why: 'A module is a set of files compiled together, such as one Gradle module. `private` at the top level means the one file.' },
    { q: 'You write `class A` and then `class B : A()`. What happens?',
      choices: ['It does not compile: `A` is final until it is marked `open`', 'It compiles, as it would in Java', 'It compiles, with a warning'],
      answer: 0,
      why: 'Kotlin classes are final by default (*This type is final, so it cannot be extended*). Write `open class A`.' },
    { q: 'What does this program print?',
      code: 'open class Base {\n    open fun name() = "base"\n    fun hello() = "hello from ${name()}"\n}\n\nclass Child : Base() {\n    override fun name() = "child"\n}\n\nfun main() {\n    val b: Base = Child()\n    println(b.hello())\n}',
      choices: ['`hello from child`', '`hello from base`', 'Nothing: `hello` is not open, so it does not compile'],
      answer: 0,
      why: '`hello` cannot be overridden, but it can be called; it calls `name()`, which is open, and the object is a `Child`.' }
  ];

  Q['kt-data-classes'] = [
    { q: 'What does this program print?',
      code: 'data class P(val x: Int, val y: Int)\n\nfun main() {\n    val a = P(1, 2)\n    val b = a.copy(y = 5)\n    println("$a $b ${a == P(1, 2)}")\n}',
      choices: ['`P(x=1, y=2) P(x=1, y=5) true`', '`P(x=1, y=2) P(x=1, y=5) false`', '`P@1 P@2 true`'],
      answer: 0,
      why: 'A data class prints its properties, `copy` changes only `y`, and `==` compares by value.' },
    { q: 'What does this program print?',
      code: 'data class User(val name: String) {\n    var logins = 0\n}\n\nfun main() {\n    val a = User("Asha")\n    a.logins = 3\n    val b = User("Asha")\n    println(a == b)\n}',
      choices: ['`true`', '`false`'],
      answer: 0,
      why: 'Only the properties of the primary constructor take part in `equals`. `logins` is declared in the body, so it is ignored.' },
    { q: 'A data class has a `MutableList` property. What does `copy()` do with it?',
      choices: ['Shares it: both objects hold the same list (a shallow copy)', 'Copies the list, so the two are independent', 'Leaves it out of the copy'],
      answer: 0,
      why: '`copy` copies each property\'s value, and for a list that value is a reference. Prefer `val` properties of read-only types.' },
    { q: 'Which of these can a data class **not** be?',
      choices: ['`open` (nor `abstract`, `sealed` or `inner`)', 'A class that implements an interface', 'A class with a `var` property', 'A class with a function in its body'],
      answer: 0,
      why: '*Modifier \'open\' is incompatible with \'data\'.* Everything else in the list is allowed.' }
  ];

  Q['kt-objects'] = [
    { q: 'How do you write what Java calls a `static` factory method, `Temperature.ofCelsius(…)`?',
      choices: ['As a function in the class\'s `companion object` (or as a top-level function)', 'With the `static` keyword', 'In an `inner class`'],
      answer: 0,
      why: 'Kotlin has no `static`. Callers still write `Temperature.ofCelsius(…)`; for Java callers, `@JvmStatic` makes it a real static method.' },
    { q: 'What does this program print?',
      code: 'object Counter {\n    var count = 0\n}\n\nfun main() {\n    val a = Counter\n    val b = Counter\n    a.count++\n    b.count++\n    println("${Counter.count} ${a === b}")\n}',
      choices: ['`2 true`', '`1 false`', '`2 false`'],
      answer: 0,
      why: 'An `object` has one instance, so `a`, `b` and `Counter` are the same object, counted up twice.' },
    { q: 'When is the instance of an `object` declaration created?',
      choices: ['The first time it is used, once, safely across threads', 'When the program starts', 'Each time it is used'],
      answer: 0,
      why: 'It is made when its class is first initialised, which the JVM does once and thread-safely: a lazy singleton with no extra code.' },
    { q: 'What does this program print?',
      code: 'data object Empty\n\nobject Plain\n\nfun main() {\n    println("$Empty ${Plain.toString().substringBefore("@")}")\n}',
      choices: ['`Empty Plain`', '`Empty@ Plain`', '`data object Empty Plain`'],
      answer: 0,
      why: 'A `data object` prints its name. A plain `object` prints `Plain@` and a hash code, and `substringBefore("@")` keeps the name.' }
  ];

  Q['kt-enums'] = [
    { q: 'What does this program print?',
      code: 'enum class Day { MON, TUE, WED }\n\nfun main() {\n    println("${Day.WED.ordinal} ${Day.entries.first()} ${Day.valueOf("TUE").name}")\n}',
      choices: ['`2 MON TUE`', '`3 MON TUE`', '`2 [MON] TUE`'],
      answer: 0,
      why: '`ordinal` counts from 0, `entries` lists the constants in order, and `valueOf` finds a constant by its name.' },
    { q: 'A `when` over an enum covers every constant. Why leave out `else`?',
      choices: ['So that adding a constant later stops the `when` compiling until it handles the new one', 'Because `else` is not allowed with an enum', 'It makes the `when` faster'],
      answer: 0,
      why: 'With every case listed and no `else`, the compiler checks the `when` is complete, and tells you where a new constant needs handling.' },
    { q: 'What does `Color.entries` give?',
      choices: ['A list of the constants, in the order they are declared', 'A map from each name to its constant', 'A new array each time, like `values()`'],
      answer: 0,
      why: '`entries` (stable since Kotlin 1.9.0) is a list made once. `values()`, which it replaces, makes a new array on every call.' },
    { q: 'What does this program print?',
      code: 'enum class Coin(val paise: Int) {\n    ONE(100), TWO(200), FIVE(500)\n}\n\nfun main() {\n    println(Coin.entries.sumOf { it.paise } / 100)\n}',
      choices: ['`8`', '`800`', '`3`'],
      answer: 0,
      why: '100 + 200 + 500 is 800 paise, and 800 / 100 is 8.' }
  ];

  Q['kt-sealed'] = [
    { q: 'What does `sealed` tell the compiler about an interface?',
      choices: ['Every type that implements it is known at compile time: they are in the same package and module', 'Nothing may implement it', 'Its methods cannot be overridden'],
      answer: 0,
      why: 'Knowing every subtype is what lets a `when` over it be checked for completeness without an `else`.' },
    { q: 'What does this program print?',
      code: 'sealed interface R\ndata class Ok(val v: Int) : R\ndata class Err(val msg: String) : R\n\nfun show(r: R) = when (r) {\n    is Ok -> "ok ${r.v}"\n    is Err -> "err ${r.msg}"\n}\n\nfun main() {\n    println(listOf(Ok(1), Err("x")).joinToString(" | ") { show(it) })\n}',
      choices: ['`ok 1 | err x`', '`Ok(v=1) | Err(msg=x)`', 'Nothing: the `when` needs an `else`'],
      answer: 0,
      why: 'Both subtypes are covered, so no `else` is needed, and each branch smart-casts `r`.' },
    { q: 'A payment is a card with a number, a UPI payment with an id, or cash. Which models it best?',
      choices: ['A sealed class or interface: each case carries its own data', 'An enum: there are three fixed cases', 'Three unrelated classes'],
      answer: 0,
      why: 'An enum\'s constants are single objects that share one shape. Sealed subtypes can each have different properties, and many objects each.' },
    { q: 'You add a new subtype to a sealed interface. What happens to a `when` over it that has an `else` branch?',
      choices: ['It still compiles, and the new subtype silently takes the `else` branch', 'It stops compiling until you handle the new subtype', 'It throws at run time'],
      answer: 0,
      why: 'That is the reason to leave `else` out of a `when` over a sealed type: without it, the compiler finds the `when`s to update.' }
  ];

  Q['kt-interfaces'] = [
    { q: 'What can a Kotlin interface **not** have?',
      choices: ['State: a property with a stored value', 'A method with a body', 'An abstract property', 'A companion object'],
      answer: 0,
      why: 'An interface property is abstract or has a getter, never a backing field. Shared state needs an abstract class.' },
    { q: 'What does this program print?',
      code: 'interface A { fun hi() = "A" }\ninterface B { fun hi() = "B" }\n\nclass C : A, B {\n    override fun hi() = super<B>.hi() + super<A>.hi()\n}\n\nfun main() {\n    println(C().hi())\n}',
      choices: ['`BA`', '`AB`', 'Nothing: two interfaces with the same method do not compile'],
      answer: 0,
      why: 'The clash must be resolved by overriding, and `super<B>` and `super<A>` choose which body to call, in the order written.' },
    { q: 'Why mark an interface `fun interface`?',
      choices: ['So a lambda can stand for it, as in `Validator { it.isNotBlank() }`', 'So its methods can have bodies', 'So it can hold state'],
      answer: 0,
      why: 'A `fun interface` has exactly one abstract method, and Kotlin then converts a lambda into it (a SAM conversion), as Java does for functional interfaces.' },
    { q: 'What does this program print?',
      code: 'interface Named {\n    val name: String\n    fun greet() = "Hi, $name"\n}\n\nclass Dog(override val name: String) : Named\n\nfun main() {\n    println(Dog("Rex").greet())\n}',
      choices: ['`Hi, Rex`', '`Hi, null`', 'Nothing: `Dog` has no body, so it does not compile'],
      answer: 0,
      why: 'The constructor parameter `override val name` provides the interface\'s property, and `greet` comes from the interface.' }
  ];

  Q['kt-inheritance'] = [
    { q: 'In `class Manager(name: String) : Employee(name)`, what does `Employee(name)` do?',
      choices: ['Names the parent class and calls its constructor', 'Makes a separate `Employee` that the manager holds', 'Casts the manager to an `Employee`'],
      answer: 0,
      why: 'It is Java\'s `extends Employee` and `super(name)` in one.' },
    { q: 'What does this program print?',
      code: 'open class A {\n    init { print("A ") }\n}\n\nopen class B : A() {\n    init { print("B ") }\n}\n\nclass C : B() {\n    init { print("C") }\n}\n\nfun main() {\n    C()\n    println()\n}',
      choices: ['`A B C`', '`C B A`', '`C`'],
      answer: 0,
      why: 'A parent is set up before its child, so the `init` blocks run from the top of the hierarchy down.' },
    { q: 'What is true of an `abstract` member?',
      choices: ['It has no body, and is open without saying so', 'It must also be marked `open`', 'It can be called on the abstract class itself'],
      answer: 0,
      why: 'An abstract member must be overridden, so it is open by nature. The abstract class cannot be made by itself.' },
    { q: 'What does this program print?',
      code: 'open class Base {\n    open val size = 1\n    fun twice() = size * 2\n}\n\nclass Big : Base() {\n    override val size = 10\n}\n\nfun main() {\n    println("${Base().twice()} ${Big().twice()}")\n}',
      choices: ['`2 20`', '`2 2`', '`20 20`'],
      answer: 0,
      why: 'Reading `size` calls its getter, and for a `Big` that is the override, which returns 10.' }
  ];

  Q['kt-value-inner'] = [
    { q: 'A class is declared inside another class, with no modifier. What is it?',
      choices: ['Nested: like Java\'s `static` nested class, with no reference to an outer object', 'Inner: it holds a reference to its outer object, as in Java', 'Private to the outer class'],
      answer: 0,
      why: 'Kotlin reverses Java\'s default. Write `inner class` when it needs the outer object.' },
    { q: 'What does this program print?',
      code: 'class Outer(val n: Int) {\n    inner class In {\n        fun get() = n * 10\n    }\n}\n\nfun main() {\n    println(Outer(4).In().get())\n}',
      choices: ['`40`', '`0`', 'Nothing: `In` cannot see `n`'],
      answer: 0,
      why: 'An `inner` class can read its outer object\'s properties, and is made from an outer object: `Outer(4).In()`.' },
    { q: 'In `fun find(id: UserId)`, where `UserId` is a `@JvmInline value class` wrapping a `Long`, what is passed at run time?',
      choices: ['A plain `long`: the wrapper is gone', 'A `UserId` object, made for the call', 'A `java.lang.Long`'],
      answer: 0,
      why: 'That is the point of a value class: a type of its own when compiling, no object at run time (unless it is used as a nullable or generic type).' },
    { q: 'How many parameters may a value class have in its primary constructor?',
      choices: ['Exactly one', 'Any number', 'None'],
      answer: 0,
      why: '*Value class must have exactly one primary constructor parameter.* It can still have functions, and properties with getters.' }
  ];
})(window.KLT);
