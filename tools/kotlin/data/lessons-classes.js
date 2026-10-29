/*
 * data/lessons-classes.js - Track 2, Classes and objects: ten lessons on Kotlin's classes for a Java
 * developer.
 *
 * The lesson shape is described at the top of data/lessons-basics.js. Every ```kotlin block is a whole
 * program that tests/test_content.py runs; an ```output block after one is its exact output. Compiler
 * messages quoted here are K2's, as kotlinc 2.4.20 words them (probed in batch 2). Version facts were
 * checked against kotlinlang.org's "What's new" pages: sealed interfaces and @JvmInline value classes
 * are stable since 1.5.0, `entries` and `data object` since 1.9.0, guards in `when` since 2.2.0.
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
    id: 'kt-constructors', track: 'classes', title: 'Constructors and init',
    summary: 'The primary constructor sits in the class header and declares the properties; init blocks run with it, in order; default arguments replace most overloads; a secondary constructor must call the primary one.',
    keywords: ['class', 'constructor', 'primary constructor', 'init', 'init block', 'secondary constructor', 'this', 'new', 'property', 'default argument', 'require', 'JvmOverloads'],
    docs: 'https://kotlinlang.org/docs/classes.html',
    body: [
      '## A class in one line',
      'A class names its constructor parameters in its header. Writing `val` or `var` in front of a parameter also makes it a property, so this one line declares the class, its constructor, two properties, their getters, and a setter for `age`:',
      kt(`class Person(val name: String, var age: Int)

fun main() {
    val p = Person("Asha", 30)
    p.age += 1
    println("\${p.name} is \${p.age}")
}`),
      out('Asha is 31'),
      'There is no `new`: calling the class creates the object. `p.age += 1` calls the setter and `p.name` the getter: a Kotlin property is a field with accessors, as the [[lesson:kt-properties]] lesson shows.',
      '## init blocks run with the constructor',
      'A parameter without `val` or `var` is only a constructor parameter: you can use it to set up properties and in `init` blocks, and nowhere else. Property initializers and `init` blocks run in the order they are written, top to bottom, each time an object is made:',
      kt(`class Account(owner: String, opening: Int) {
    val id = owner.lowercase()
    init {
        println("1. id is $id")
        require(opening >= 0) { "opening balance must not be negative" }
    }
    var balance = opening
    init {
        println("2. balance is $balance")
    }
}

fun main() {
    val a = Account("Ravi", 100)
    println(a.balance)
}`),
      out(`1. id is ravi
2. balance is 100
100`),
      'An `init` block cannot read a property declared below it: the compiler says *Variable \'balance\' must be initialized*. Declare first, then use. `require` is the usual way to check the arguments: it throws an `IllegalArgumentException` with your message, so a bad object is never made.',
      '## Default arguments instead of overloads',
      kt(`class Connection(val host: String, val port: Int = 5432, val ssl: Boolean = true)

fun main() {
    val a = Connection("db.local")
    val b = Connection("db.local", ssl = false)
    println("\${a.host}:\${a.port} ssl=\${a.ssl}")
    println("\${b.host}:\${b.port} ssl=\${b.ssl}")
}`),
      out(`db.local:5432 ssl=true
db.local:5432 ssl=false`),
      'Java needs a constructor for each combination, or a builder. Here named arguments let the caller skip the defaults in between. Java callers see one constructor with every parameter; `class Connection @JvmOverloads constructor(…)` writes the shorter ones for them.',
      '## Secondary constructors',
      'A class can have more constructors, written in its body with `constructor`. Each must call the primary one first, with `: this(…)`:',
      kt(`class Temperature(val celsius: Double) {
    constructor(fahrenheit: Int) : this((fahrenheit - 32) / 1.8)

    override fun toString() = "%.1f °C".format(celsius)
}

fun main() {
    println(Temperature(21.5))
    println(Temperature(212))
}`),
      out(`21.5 °C
100.0 °C`),
      'Secondary constructors are rarer than in Java, because default arguments cover most of their uses. They matter when another constructor takes different *types*, as here, or when a framework needs a particular one.'
    ].join('\n\n'),
    java: [
      java(`public class Person {
    private final String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
}`),
      'is `class Person(val name: String, var age: Int)` in Kotlin. Java code that uses the Kotlin class still writes `new Person("Asha", 30)`, `getName()`, `getAge()` and `setAge(31)`: the compiler makes them. An `init` block is Java\'s instance initializer, merged into the constructor, and there are no `this.name = name` lines to write.'
    ].join('\n\n'),
    example: {
      code: `class Book(val title: String, val author: String, val pages: Int = 100) {
    init {
        require(pages > 0) { "a book has pages" }
    }
    val long = pages > 300
}

fun main() {
    val b = Book("Kotlin in Action", "Jemerov", 360)
    println("\${b.title} by \${b.author}: \${b.pages} pages, long: \${b.long}")
    val short = Book("Notes", "Ravi")
    println("\${short.title}: \${short.pages} pages, long: \${short.long}")
}`,
      note: 'Run it, then make a `Book` with `pages = 0` and see `require` stop it.'
    },
    challenge: {
      title: 'A rectangle, and a square',
      task: 'Write a class `Rectangle` with two `Int` properties, `width` and `height`, and:\n\n- an `init` block that rejects a side of 0 or less with `require`;\n- a second constructor for a square: `Rectangle(5)` is 5 by 5;\n- a property `area`, the width times the height.',
      starter: `class Rectangle(val width: Int, val height: Int) {
    // an init block: require both sides to be more than 0

    // a second constructor, for a square: Rectangle(5)

    val area: Int = TODO("the width times the height")
}

fun main() {
    println(Rectangle(3, 4).area)
}`,
      solution: `class Rectangle(val width: Int, val height: Int) {
    init {
        require(width > 0 && height > 0) { "sides must be more than 0" }
    }

    constructor(side: Int) : this(side, side)

    val area: Int = width * height
}

fun main() {
    println(Rectangle(3, 4).area)
    println(Rectangle(5).area)
}`,
      hints: [
        '`init { require(condition) { "message" } }` throws an `IllegalArgumentException` when the condition is false.',
        'A second constructor calls the primary one: `constructor(side: Int) : this(side, side)`.'
      ],
      checks: [
        { label: '`Rectangle(3, 4).area` is 12', code: 'eq(Rectangle(3, 4).area, 12)' },
        { label: '`Rectangle(5)` is a 5 by 5 square, area 25', code: 'val s = Rectangle(5)\neq(listOf(s.width, s.height, s.area), listOf(5, 5, 25))' },
        { label: '`Rectangle(0, 3)` is refused with an `IllegalArgumentException`', code: 'eq(runCatching { Rectangle(0, 3) }.exceptionOrNull()?.javaClass?.simpleName, "IllegalArgumentException")' },
        { label: '`Rectangle(4, -1)` is refused too', code: 'eq(runCatching { Rectangle(4, -1) }.exceptionOrNull()?.javaClass?.simpleName, "IllegalArgumentException")' },
        { label: 'The sides are checked in an `init` block', code: 'ok(uses("""\\binit\\s*\\{"""), "check the sides in an init block")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'kt-properties', track: 'classes', title: 'Properties, getters, setters and lateinit',
    summary: 'A property is a field with a getter, and a setter for a var. Custom get() and set(value) with field, private set, computed properties, and lateinit for a value set after the object is made.',
    keywords: ['property', 'getter', 'setter', 'get()', 'set()', 'field', 'backing field', 'private set', 'lateinit', 'isInitialized', 'computed property', 'getName', 'setName', 'JavaBean'],
    docs: 'https://kotlinlang.org/docs/properties.html',
    body: [
      '## A property is not just a field',
      'In Java you write a private field, then public getters and setters. In Kotlin you declare a property, and the compiler makes the field and the accessors. Callers write `p.name`, and Kotlin calls the getter, so you can add logic to it later without changing a single caller.',
      '## Custom getters: computed properties',
      kt(`class Rectangle(val width: Int, val height: Int) {
    val area: Int
        get() = width * height
    val isSquare get() = width == height
}

fun main() {
    val r = Rectangle(3, 4)
    println(r.area)
    println(r.isSquare)
}`),
      out(`12
false`),
      'A property with only a custom getter stores nothing: `area` is worked out on each read. Whether to write a property `area` or a function `area()` is a matter of style: a property for something cheap that describes the object, a function for real work or for anything with side effects.',
      '## Custom setters, and field',
      kt(`class Thermostat {
    var target = 20
        set(value) {
            field = value.coerceIn(10, 30)
        }
}

fun main() {
    val t = Thermostat()
    t.target = 35
    println(t.target)
    t.target = 18
    println(t.target)
}`),
      out(`30
18`),
      'Inside the accessors, `field` is the stored value, the *backing field*. Writing `target = …` inside the setter would call the setter again, and again, until a `StackOverflowError`.',
      '## Read from outside, set from inside: private set',
      kt(`class Counter {
    var count = 0
        private set

    fun increment() {
        count++
    }
}

fun main() {
    val c = Counter()
    c.increment()
    c.increment()
    println(c.count)
}`),
      out('2'),
      'Outside the class, `c.count = 5` does not compile: *Cannot access \'count\': it is private in \'Counter\'*. Only the class itself can change the count.',
      '## lateinit: set after the object is made',
      'Every property of a non-null type must have a value once the object exists. Sometimes the value only comes later: a test\'s setup method, dependency injection, a framework callback. `lateinit var` promises to set it before anyone reads it:',
      kt(`class ReportJob {
    lateinit var title: String

    fun setUp(name: String) {
        title = "Report: $name"
    }

    fun ready() = this::title.isInitialized
}

fun main() {
    val job = ReportJob()
    println(job.ready())
    job.setUp("sales")
    println(job.ready())
    println(job.title)
}`),
      out(`false
true
Report: sales`),
      'Reading it before it is set throws `UninitializedPropertyAccessException`, which names the property: clearer than a `NullPointerException` somewhere later. The rules: `lateinit` is for a `var` of a non-null type that is not a primitive (the compiler says *\'lateinit\' modifier is not allowed on properties of primitive types*), with no custom getter or setter. For a value worked out once, on first use, `val x by lazy { … }` is the other tool: [[q:lateinit-vs-lazy]].',
      '## What Java sees',
      'For `var name: String`, Java code calls `getName()` and `setName(…)`. For a property whose name starts with `is`, such as `var isActive: Boolean`, the getter keeps the name, `isActive()`, and the setter is `setActive(…)`. A Kotlin property is how Kotlin writes a JavaBean.'
    ].join('\n\n'),
    java: '| Java | Kotlin |\n|---|---|\n| a private field, `getName()` and `setName()` | `var name: String` |\n| a getter that computes, `getArea()` | `val area get() = width * height` |\n| a setter that validates | `set(value) { field = … }` |\n| a getter but no public setter | `var count = 0` and `private set` on the next line |\n| a field filled in by a setup method, null until then | `lateinit var title: String` |\n\nLombok\'s `@Getter` and `@Setter` are what Kotlin does without being asked.',
    example: {
      code: `class User(val first: String, val last: String) {
    val fullName get() = "$first $last"
    var email = ""
        set(value) {
            field = value.trim().lowercase()
        }
}

fun main() {
    val u = User("Asha", "Rao")
    u.email = "  Asha@Example.COM "
    println(u.fullName)
    println(u.email)
}`,
      note: 'Run it, then add a property `initials` with a custom getter that gives `"AR"`.'
    },
    challenge: {
      title: 'A wallet that guards its balance',
      task: 'Write a class `Wallet` with:\n\n- `balance`, an `Int` that starts at 0, which code outside the class can read but **not** set;\n- `deposit(amount)`, which adds `amount`, and ignores an amount of 0 or less;\n- `isEmpty`, a property that is `true` whenever the balance is 0, worked out on each read.',
      starter: `class Wallet {
    var balance = 0

    fun deposit(amount: Int) {
        TODO("add the amount when it is more than 0")
    }

    val isEmpty: Boolean = TODO("a property worked out on each read")
}

fun main() {
    val w = Wallet()
    w.deposit(50)
    println(w.balance)
}`,
      solution: `class Wallet {
    var balance = 0
        private set

    fun deposit(amount: Int) {
        if (amount > 0) balance += amount
    }

    val isEmpty: Boolean
        get() = balance == 0
}

fun main() {
    val w = Wallet()
    w.deposit(50)
    println(w.balance)
}`,
      hints: [
        '`private set` on the line after `var balance = 0` keeps the setter inside the class.',
        '`val isEmpty: Boolean = balance == 0` is worked out once, when the wallet is made. A getter, `get() = balance == 0`, is worked out on every read.'
      ],
      checks: [
        { label: 'Deposits add up: 50, then 25, make 75', code: 'val w = Wallet()\nw.deposit(50)\nw.deposit(25)\neq(w.balance, 75)' },
        { label: 'A deposit of 0 or less is ignored', code: 'val w = Wallet()\nw.deposit(10)\nw.deposit(-5)\nw.deposit(0)\neq(w.balance, 10)' },
        { label: '`isEmpty` follows the balance: `true`, then `false` after a deposit', code: 'val w = Wallet()\nval before = w.isEmpty\nw.deposit(1)\neq(listOf(before, w.isEmpty), listOf(true, false))' },
        { label: 'Code outside the class cannot set `balance`', code: 'ok(Wallet::class.java.methods.none { it.name == "setBalance" }, "make the setter private: private set, on the line after var balance = 0")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'kt-visibility', track: 'classes', title: 'Visibility, final by default and open',
    summary: 'public is the default; private, protected and internal (the module). Classes and their members are final unless marked open; override is a required keyword, and final override stops it going further.',
    keywords: ['visibility', 'public', 'private', 'protected', 'internal', 'module', 'final', 'open', 'override', 'final by default', 'package-private', 'fragile base class', 'all-open'],
    docs: 'https://kotlinlang.org/docs/visibility-modifiers.html',
    body: [
      '## Four visibilities, and a different default',
      '| Modifier | On a class member | At the top level of a file |\n|---|---|---|\n| `public` (the default) | visible everywhere | visible everywhere |\n| `internal` | visible in the same module | visible in the same module |\n| `protected` | the class and its subclasses | not allowed |\n| `private` | inside the class only | inside the file only |',
      'A *module* is a set of files compiled together: one Gradle or Maven module, one IntelliJ module. Kotlin has no package-private; `internal` is the nearest, and `private` at the top level of a file makes a helper visible in that file only:',
      kt(`private fun normalise(s: String) = s.trim().lowercase()

fun sameUser(a: String, b: String) = normalise(a) == normalise(b)

fun main() {
    println(sameUser(" Ravi", "RAVI "))
}`),
      out('true'),
      '## Classes are final unless you say open',
      'In Java any class can be extended and any method overridden unless it is marked `final`. Kotlin is the other way round: a class, and each of its members, is final unless marked `open`:',
      norun(`class Base

// compile error: This type is final, so it cannot be extended.
class Derived : Base()`),
      kt(`open class Shape {
    open fun name() = "shape"
    fun describe() = "I am a \${name()}"
}

class Circle : Shape() {
    override fun name() = "circle"
}

fun main() {
    val shapes = listOf(Shape(), Circle())
    for (s in shapes) println(s.describe())
}`),
      out(`I am a shape
I am a circle`),
      '`describe` is not `open`, so no subclass can change it (*\'describe\' in \'Shape\' is final and cannot be overridden*); `name` is. `override` is a required keyword, not an optional annotation, and an `override` stays open for further subclasses until you write `final override`.',
      '## Why final by default',
      'A class that can be extended makes a promise: every subclass depends on which of its methods call which. Change that, and subclasses you have never seen break (the *fragile base class* problem; Effective Java\'s advice is "design and document for inheritance, or else prohibit it"). Kotlin makes the safe choice the default. Frameworks that must subclass your classes, such as Spring\'s proxies, use the `kotlin-spring` (all-open) compiler plugin, which opens classes with certain annotations: [[q:final-by-default]].',
      '## protected',
      kt(`open class Greeter {
    protected open val greeting = "Hello"
    fun greet(name: String) = "$greeting, $name!"
}

class LoudGreeter : Greeter() {
    override val greeting = "HEY"
}

fun main() {
    println(Greeter().greet("Asha"))
    println(LoudGreeter().greet("Ravi"))
}`),
      out(`Hello, Asha!
HEY, Ravi!`),
      'Kotlin\'s `protected` is narrower than Java\'s: it means the class and its subclasses, without the rest of the package. An override keeps the visibility of what it overrides.'
    ].join('\n\n'),
    java: '| Java | Kotlin |\n|---|---|\n| no modifier: package-private | no modifier: `public` |\n| (no equivalent) | `internal`: the module |\n| `protected`: subclasses and the package | `protected`: subclasses only |\n| `class A` can be extended | `open class A` can be extended |\n| `final class A` | `class A` |\n| `@Override`, optional | `override`, required |\n\nJava sees an `internal` member as public, with a mangled name (`getTotal$mymodule`), so Java code in another module can call it but is unlikely to by accident.',
    example: {
      code: `open class Animal(val name: String) {
    open fun sound() = "..."
    fun speak() = "$name says \${sound()}"
}

open class Dog(name: String) : Animal(name) {
    final override fun sound() = "Woof"
}

class Puppy(name: String) : Dog(name)

fun main() {
    println(Animal("Generic").speak())
    println(Dog("Rex").speak())
    println(Puppy("Bit").speak())
}`,
      note: 'Try to override `sound` in `Puppy`, or `speak` in `Dog`, and read what the compiler says.'
    },
    challenge: {
      title: 'Open in one place only',
      task: 'Make this hierarchy compile and behave:\n\n- `Notifier` can be extended; its `channel()` may be overridden, but its `send(message)` may not;\n- `EmailNotifier` extends it and overrides `channel()` to return `"email"`;\n- `send("hi")` gives `"[email] hi"` for an `EmailNotifier`, and `"[log] hi"` for a plain `Notifier`.\n\nAlso keep the helper `format` to this file: make it `private`.',
      starter: `fun format(channel: String, message: String) = "[$channel] $message"

class Notifier {
    fun channel() = "log"
    fun send(message: String) = format(channel(), message)
}

// class EmailNotifier: extends Notifier, and its channel() is "email"

fun main() {
    println(Notifier().send("hi"))
}`,
      solution: `private fun format(channel: String, message: String) = "[$channel] $message"

open class Notifier {
    open fun channel() = "log"
    fun send(message: String) = format(channel(), message)
}

class EmailNotifier : Notifier() {
    override fun channel() = "email"
}

fun main() {
    println(Notifier().send("hi"))
    println(EmailNotifier().send("hi"))
}`,
      hints: [
        'A class must be `open` to be extended, and so must each function a subclass overrides: `open fun channel()`.',
        'The subclass names its parent and calls its constructor: `class EmailNotifier : Notifier() { override fun channel() = "email" }`.'
      ],
      checks: [
        { label: 'A plain `Notifier` sends `[log] hi`', code: 'eq(Notifier().send("hi"), "[log] hi")' },
        { label: '`EmailNotifier().send("hi")` is `[email] hi`', code: 'eq(EmailNotifier().send("hi"), "[email] hi")' },
        { label: 'An `EmailNotifier` is a `Notifier`', code: 'val n: Notifier = EmailNotifier()\neq(n.channel(), "email")' },
        { label: '`Notifier` is open, but `send` is not', code: 'val c = Notifier::class.java\nok(!java.lang.reflect.Modifier.isFinal(c.modifiers), "mark the class open")\nok(java.lang.reflect.Modifier.isFinal(c.getMethod("send", String::class.java).modifiers), "leave send final: only channel() should be open")' },
        { label: '`format` is private to the file', code: 'ok(uses("""private\\s+fun\\s+format"""), "mark format private")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'kt-data-classes', track: 'classes', title: 'Data classes',
    summary: 'data class writes equals, hashCode, toString, copy and componentN from the primary constructor. Only those properties count, copy is shallow, and a var in a hash key is a trap.',
    keywords: ['data class', 'equals', 'hashCode', 'toString', 'copy', 'component1', 'destructuring', 'record', 'value object', 'DTO', 'lombok', 'JvmRecord'],
    docs: 'https://kotlinlang.org/docs/data-classes.html',
    body: [
      '## One keyword, five functions',
      kt(`data class User(val name: String, val age: Int)

fun main() {
    val a = User("Asha", 30)
    val b = User("Asha", 30)
    println(a)
    println(a == b)
    println(a === b)
    println(setOf(a, b).size)
    val older = a.copy(age = 31)
    println(older)
    val (name, age) = older
    println("$name is $age")
}`),
      out(`User(name=Asha, age=30)
true
false
1
User(name=Asha, age=31)
Asha is 31`),
      'From the properties in the primary constructor, the compiler writes `equals` and `hashCode` (by value, so two equal users are one entry in a set), `toString`, `copy` (a new object with some properties changed, by name) and `component1()`, `component2()`…, which make `val (name, age) = older` work. `==` calls `equals`; `===` asks whether two references are the same object.',
      '## Only the constructor\'s properties count',
      kt(`data class Order(val id: Int) {
    var note: String = ""
}

fun main() {
    val a = Order(1)
    a.note = "urgent"
    val b = Order(1)
    println(a == b)
    println(a)
}`),
      out(`true
Order(id=1)`),
      'A property declared in the body is left out of `equals`, `hashCode`, `toString` and `copy`. Sometimes that is the point (a cache, a timestamp); often it is a bug.',
      '## copy is shallow',
      kt(`data class Team(val name: String, val members: MutableList<String>)

fun main() {
    val a = Team("core", mutableListOf("Asha"))
    val b = a.copy(name = "core-2")
    b.members.add("Ravi")
    println(a.members)
}`),
      out('[Asha, Ravi]'),
      '`copy` copies the references, not what they point to: both teams share one list. Data classes work best with `val` properties of read-only types (`List`, not `MutableList`).',
      '## A var in a hash key',
      kt(`data class Point(var x: Int, var y: Int)

fun main() {
    val p = Point(1, 2)
    val set = hashSetOf(p)
    p.x = 10
    println(p in set)
    println(set.size)
}`),
      out(`false
1`),
      'The set filed the point under the hash code it had when it went in. After `p.x = 10` its hash code is different, so the set looks in the wrong place and does not find it, although it still holds it. A data class used as a key, or in a set, should have only `val`s.',
      '## The rules',
      'A data class needs at least one parameter in its primary constructor, each a `val` or a `var`. It cannot be `abstract`, `open`, `sealed` or `inner` (*Modifier \'open\' is incompatible with \'data\'*). It can implement interfaces and extend an open class, and if you write your own `toString` (or `equals`) in its body, the compiler leaves that one to you. For a singleton that prints its own name, there is `data object` ([[lesson:kt-objects]]).'
    ].join('\n\n'),
    java: [
      java('public record User(String name, int age) { }'),
      'A Java 16 record gives `equals`, `hashCode`, `toString` and the accessors `name()` and `age()`. A Kotlin data class gives the same, plus `copy` and destructuring, and allows `var` properties and default values. A record cannot extend a class; a data class can extend an open one. Java code sees a data class\'s properties as `getName()` and `getAge()`; annotate it `@JvmRecord` (all properties `val`, JVM 16 or later) to compile it as a real record. Before records, Java teams used Lombok\'s `@Value` and `@Data`.'
    ].join('\n\n'),
    example: {
      code: `data class Product(val name: String, val price: Double, val tags: List<String> = listOf())

fun main() {
    val p = Product("Pen", 25.0)
    val sale = p.copy(price = 20.0, tags = listOf("sale"))
    println(p)
    println(sale)
    println(p == sale.copy(price = 25.0, tags = listOf()))
    val (name, price) = sale
    println("$name costs $price")
}`,
      note: 'Add `var stock: Int = 0` in the class body and see that `toString` and `==` ignore it.'
    },
    challenge: {
      title: 'Money that compares by value',
      task: 'Make `Money` (an `amount` in paise, a `Long`, and a `currency`) a data class, so that two equal amounts are equal, print as `Money(amount=500, currency=INR)`, and count once in a set.\n\nThen write `add(a, b)`: it refuses two different currencies with `require` (an `IllegalArgumentException`), and otherwise returns a copy of `a` with the two amounts added.',
      starter: `class Money(val amount: Long, val currency: String)

fun add(a: Money, b: Money): Money = TODO("require the same currency, then a copy with the amounts added")

fun main() {
    val total = add(Money(500, "INR"), Money(250, "INR"))
    println(total)
}`,
      solution: `data class Money(val amount: Long, val currency: String)

fun add(a: Money, b: Money): Money {
    require(a.currency == b.currency) { "cannot add \${a.currency} to \${b.currency}" }
    return a.copy(amount = a.amount + b.amount)
}

fun main() {
    val total = add(Money(500, "INR"), Money(250, "INR"))
    println(total)
}`,
      hints: [
        'One keyword in front of `class` gives `equals`, `hashCode`, `toString` and `copy`.',
        '`require(a.currency == b.currency) { "…" }`, then `a.copy(amount = a.amount + b.amount)`.'
      ],
      checks: [
        { label: 'Two `Money(500, "INR")` are equal', code: 'eq(Money(500, "INR"), Money(500, "INR"))' },
        { label: '`Money(500, "INR")` prints as `Money(amount=500, currency=INR)`', code: 'eq(Money(500, "INR").toString(), "Money(amount=500, currency=INR)")' },
        { label: '`add` makes 500 and 250 INR into 750 INR', code: 'eq(add(Money(500, "INR"), Money(250, "INR")), Money(750, "INR"))' },
        { label: 'Adding INR to USD is refused with an `IllegalArgumentException`', code: 'eq(runCatching { add(Money(1, "INR"), Money(1, "USD")) }.exceptionOrNull()?.javaClass?.simpleName, "IllegalArgumentException")' },
        { label: 'Equal amounts are one entry in a set', code: 'eq(setOf(Money(1, "INR"), Money(1, "INR"), Money(2, "INR")).size, 2)' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'kt-objects', track: 'classes', title: 'object and companion object',
    summary: 'object declares a singleton; a companion object holds what Java makes static, such as factory functions and constants; object expressions replace anonymous classes; data object prints its name.',
    keywords: ['object', 'singleton', 'companion object', 'companion', 'static', 'factory', 'anonymous class', 'object expression', 'JvmStatic', 'const', 'data object', 'private constructor'],
    docs: 'https://kotlinlang.org/docs/object-declarations.html',
    body: [
      '## object: a class with one instance',
      kt(`object IdGenerator {
    private var next = 1
    fun nextId(): Int = next++
}

fun main() {
    println(IdGenerator.nextId())
    println(IdGenerator.nextId())
    println(IdGenerator.nextId())
}`),
      out(`1
2
3`),
      '`object` declares a class and its only instance at once. The instance is made the first time it is used, and that is thread-safe: the JVM initialises the class once. It replaces Java\'s singleton pattern, with no private constructor, no `getInstance()` and no double-checked locking.',
      '## companion object: what Java makes static',
      'Kotlin has no `static`. Functions and constants that belong to a class rather than to one object of it go in its `companion object`, and callers use the class name, as in Java:',
      kt(`class Temperature private constructor(val celsius: Double) {
    companion object {
        const val FREEZING = 0.0

        fun ofCelsius(c: Double) = Temperature(c)
        fun ofFahrenheit(f: Double) = Temperature((f - 32) / 1.8)
    }
}

fun main() {
    val t = Temperature.ofFahrenheit(212.0)
    println(t.celsius)
    println(Temperature.ofCelsius(Temperature.FREEZING).celsius)
}`),
      out(`100.0
0.0`),
      'The private constructor makes callers go through the factory functions, a common reason for a companion object. A companion object is a real object: it can implement an interface and have extension functions. Functions that belong to no class at all are simpler as top-level functions.',
      '## Object expressions: anonymous classes',
      kt(`interface Greeter {
    fun greet(name: String): String
}

fun main() {
    val polite = object : Greeter {
        override fun greet(name: String) = "Good morning, $name."
    }
    println(polite.greet("Asha"))

    var clicks = 0
    val button = object {
        fun click() {
            clicks++
        }
    }
    button.click()
    button.click()
    println(clicks)
}`),
      out(`Good morning, Asha.
2`),
      '`object : Greeter { … }` is Java\'s anonymous class. Unlike Java\'s, it can change the local `var`s around it (`clicks`): Kotlin has no "effectively final" rule.',
      '## data object',
      kt(`object Plain
data object Pretty

fun main() {
    println(Plain.toString().startsWith("Plain@"))
    println(Pretty)
}`),
      out(`true
Pretty`),
      'A `data object` prints its name instead of `Plain@1b6d3586`, which is what you want for one case of a sealed hierarchy (`Loading`, `Empty`). Stable since Kotlin 1.9.0.'
    ].join('\n\n'),
    java: '| Java | Kotlin |\n|---|---|\n| a singleton: private constructor, `getInstance()` | `object Config { … }` |\n| a `static` method | a function in the `companion object`, or a top-level function |\n| `static final int MAX = 10` | `const val MAX = 10`, in the companion or at the top level |\n| an anonymous class, `new Runnable() { … }` | an object expression, `object : Runnable { … }` |\n\nJava code calls a companion function as `Temperature.Companion.ofCelsius(…)`, unless it is annotated `@JvmStatic`, which makes it a real static method, `Temperature.ofCelsius(…)`. A `const val` is a static field for Java either way.',
    example: {
      code: `class User private constructor(val name: String) {
    companion object {
        private var created = 0

        fun create(name: String): User {
            created++
            return User(name.trim())
        }

        fun count() = created
    }
}

object AppConfig {
    const val VERSION = "1.4"
    val startedBy = "ktlearn"
}

fun main() {
    User.create(" Asha ")
    val u = User.create("Ravi")
    println("\${u.name}, users made: \${User.count()}")
    println("version \${AppConfig.VERSION} by \${AppConfig.startedBy}")
}`,
      note: 'Try `User("Li")` in `main`: the private constructor refuses it.'
    },
    challenge: {
      title: 'One object per currency',
      task: 'Make the constructor of `Currency` private, and give it a companion object with:\n\n- `fun of(code: String): Currency`, which upper-cases the code and returns the **same** object every time for the same code: `Currency.of("inr") === Currency.of("INR")`. Keep the ones made so far in a map;\n- `const val DEFAULT = "INR"`.',
      starter: `class Currency(val code: String)

fun main() {
    val a = Currency("INR")
    println(a.code)
}`,
      solution: `class Currency private constructor(val code: String) {
    companion object {
        const val DEFAULT = "INR"
        private val known = mutableMapOf<String, Currency>()

        fun of(code: String): Currency {
            val key = code.uppercase()
            return known.getOrPut(key) { Currency(key) }
        }
    }
}

fun main() {
    val a = Currency.of("inr")
    println(a.code)
    println(a === Currency.of(Currency.DEFAULT))
}`,
      hints: [
        '`class Currency private constructor(val code: String) { companion object { … } }`.',
        '`map.getOrPut(key) { Currency(key) }` returns what the map holds for the key, or makes it, stores it and returns it.'
      ],
      checks: [
        { label: '`Currency.of("inr").code` is `"INR"`', code: 'eq(Currency.of("inr").code, "INR")' },
        { label: 'The same code gives the same object (`===`)', code: 'ok(Currency.of("INR") === Currency.of("inr"), "of() must return the object it made before for the same code")' },
        { label: 'Different codes give different objects', code: 'ok(Currency.of("USD") !== Currency.of("INR"), "USD and INR must be different objects")' },
        { label: '`Currency.DEFAULT` is `"INR"`, a `const val`', code: 'eq(Currency.DEFAULT, "INR")\nok(uses("""const\\s+val\\s+DEFAULT"""), "make DEFAULT a const val")' },
        { label: 'The constructor is private', code: 'ok(Currency::class.java.declaredConstructors.filter { !it.isSynthetic }.all { java.lang.reflect.Modifier.isPrivate(it.modifiers) }, "make the constructor private: class Currency private constructor(val code: String)")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 6 */
  L.push({
    id: 'kt-enums', track: 'classes', title: 'Enum classes',
    summary: 'enum class with properties and functions; entries, valueOf, name and ordinal; a when over an enum needs no else; constants with their own bodies.',
    keywords: ['enum', 'enum class', 'entries', 'values', 'valueOf', 'ordinal', 'name', 'when', 'EnumMap', 'constant'],
    docs: 'https://kotlinlang.org/docs/enum-classes.html',
    body: [
      '## enum class',
      kt(`enum class Direction { NORTH, EAST, SOUTH, WEST }

fun main() {
    val d = Direction.EAST
    println(d)
    println(d.name)
    println(d.ordinal)
    println(Direction.entries)
    println(Direction.valueOf("WEST"))
}`),
      out(`EAST
EAST
1
[NORTH, EAST, SOUTH, WEST]
WEST`),
      '`entries` is the list of constants, in order. It is stable since Kotlin 1.9.0 and preferred to the older `values()`, which makes a new array on every call. `valueOf` throws for an unknown name; `entries.find { it.name == text }` gives null instead.',
      '## Properties and functions',
      kt(`enum class Planet(val massKg: Double, val radiusM: Double) {
    MERCURY(3.303e23, 2.4397e6),
    EARTH(5.976e24, 6.37814e6);

    fun surfaceGravity(): Double = 6.67300e-11 * massKg / (radiusM * radiusM)
}

fun main() {
    for (p in Planet.entries) println("%s %.2f".format(p, p.surfaceGravity()))
}`),
      out(`MERCURY 3.70
EARTH 9.80`),
      'A constructor makes each constant carry its own data. When an enum has members, a `;` ends the list of constants: the one place Kotlin code needs one.',
      '## when over an enum needs no else',
      kt(`enum class Level { LOW, MEDIUM, HIGH }

fun color(level: Level) = when (level) {
    Level.LOW -> "green"
    Level.MEDIUM -> "amber"
    Level.HIGH -> "red"
}

fun main() {
    println(Level.entries.map { color(it) })
}`),
      out('[green, amber, red]'),
      'Every constant is covered, so the `when` needs no `else`. Add a constant to `Level`, and every such `when` stops compiling until it handles it: the compiler finds the places to change for you.',
      '## Each constant with its own body',
      kt(`enum class Op(val symbol: String) {
    PLUS("+") {
        override fun apply(a: Int, b: Int) = a + b
    },
    TIMES("*") {
        override fun apply(a: Int, b: Int) = a * b
    };

    abstract fun apply(a: Int, b: Int): Int
}

fun main() {
    for (op in Op.entries) println("3 \${op.symbol} 4 = \${op.apply(3, 4)}")
}`),
      out(`3 + 4 = 7
3 * 4 = 12`),
      'An enum can also implement interfaces. When the cases need different *data* rather than different behaviour (a success with a value, an error with a message), a sealed class is the better tool: [[lesson:kt-sealed]].'
    ].join('\n\n'),
    java: 'Java and Kotlin enums are the same thing on the JVM: a Kotlin enum is a `java.lang.Enum`, with `name()`, `ordinal()` and `compareTo`, and works in an `EnumMap` or an `EnumSet`. The differences are in how you write them: `enum class`, the constructor parameters in the header, `entries` instead of `values()`, and a `when` that checks every constant is handled where Java\'s old `switch` statement did not (Java 21\'s `switch` over an enum now can).',
    example: {
      code: `enum class Size(val ml: Int) {
    SMALL(250), MEDIUM(350), LARGE(500);

    fun next(): Size? = entries.getOrNull(ordinal + 1)
}

fun main() {
    for (s in Size.entries) println("$s: \${s.ml} ml, next \${s.next()}")
    println(Size.entries.find { it.name == "HUGE" })
}`,
      note: 'Add `HUGE(750)` after `LARGE` and run again.'
    },
    challenge: {
      title: 'Order status',
      task: 'Give `Status` a `label` property: `"New"`, `"Paid"`, `"Shipped"` and `"Delivered"`. Then write:\n\n- `next(s)`: the status after `s`, where `DELIVERED` stays `DELIVERED`;\n- `canCancel(s)`: `true` for `NEW` and `PAID` only, as a `when` that lists every status, with no `else`.',
      starter: `enum class Status { NEW, PAID, SHIPPED, DELIVERED }

fun next(s: Status): Status = TODO("the status after s; DELIVERED stays DELIVERED")

fun canCancel(s: Status): Boolean = TODO("a when over every status, with no else")

fun main() {
    println(next(Status.NEW))
}`,
      solution: `enum class Status(val label: String) {
    NEW("New"), PAID("Paid"), SHIPPED("Shipped"), DELIVERED("Delivered")
}

fun next(s: Status): Status = Status.entries[minOf(s.ordinal + 1, Status.entries.lastIndex)]

fun canCancel(s: Status): Boolean = when (s) {
    Status.NEW, Status.PAID -> true
    Status.SHIPPED, Status.DELIVERED -> false
}

fun main() {
    println(next(Status.NEW))
    println(Status.SHIPPED.label)
}`,
      hints: [
        '`enum class Status(val label: String) { NEW("New"), … }`. `Status.entries[i]` is the constant at position `i`, and `s.ordinal` is the position of `s`.',
        '`minOf(s.ordinal + 1, Status.entries.lastIndex)` stops at the last one. In a `when`, one branch can list several values: `Status.NEW, Status.PAID -> true`.'
      ],
      checks: [
        { label: 'The statuses, in order', code: 'eq(Status.entries.map { it.name }, listOf("NEW", "PAID", "SHIPPED", "DELIVERED"))' },
        { label: 'Each has its label', code: 'eq(Status.entries.map { it.label }, listOf("New", "Paid", "Shipped", "Delivered"))' },
        { label: '`next` moves one step, and stops at `DELIVERED`', code: 'eq(Status.entries.map { next(it) }, listOf(Status.PAID, Status.SHIPPED, Status.DELIVERED, Status.DELIVERED))' },
        { label: '`canCancel` is true for `NEW` and `PAID` only', code: 'eq(Status.entries.filter { canCancel(it) }, listOf(Status.NEW, Status.PAID))' },
        { label: '`canCancel` is a `when` with no `else`', code: 'ok(uses("""\\bwhen\\b""") && !uses("""\\belse\\b"""), "list every status in the when, and leave out else")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 7 */
  L.push({
    id: 'kt-sealed', track: 'classes', title: 'Sealed classes and interfaces',
    summary: 'A sealed class or interface lists every subtype at compile time, so a when over it needs no else, and the compiler finds every place a new case must be handled. Results, states, and guards in when.',
    keywords: ['sealed', 'sealed class', 'sealed interface', 'when', 'exhaustive', 'algebraic data type', 'result', 'state', 'data object', 'permits', 'sealed vs enum', 'guard'],
    docs: 'https://kotlinlang.org/docs/sealed-classes.html',
    body: [
      '## A closed set of types',
      kt(`sealed interface Shape
data class Circle(val radius: Double) : Shape
data class Rect(val w: Double, val h: Double) : Shape
data object Dot : Shape

fun area(s: Shape): Double = when (s) {
    is Circle -> 3.14 * s.radius * s.radius
    is Rect -> s.w * s.h
    Dot -> 0.0
}

fun main() {
    val shapes = listOf(Circle(1.0), Rect(2.0, 3.0), Dot)
    for (s in shapes) println("$s: \${area(s)}")
}`),
      out(`Circle(radius=1.0): 3.14
Rect(w=2.0, h=3.0): 6.0
Dot: 0.0`),
      'Every subtype of a sealed type must be declared in the same package and module (stable since Kotlin 1.5.0; before that, in the same file), so the compiler knows them all. The `when` covers each one, so it needs no `else`, and in each branch `s` is smart-cast: `s.radius` needs no cast.',
      '## Why leave out else',
      'Add `data class Triangle(…) : Shape`, and every `when (s)` without an `else` stops compiling: *\'when\' expression must be exhaustive. Add the \'is Triangle\' branch or an \'else\' branch.* With an `else`, the triangle would silently take the `else` branch. Leaving `else` out is how you ask the compiler to find every place a new case needs handling.',
      '## Sealed class or enum?',
      'An enum has a fixed set of *values*, each one object. A sealed type has a fixed set of *types*, and each can have many objects, each with its own data:',
      kt(`sealed class Result<out T> {
    data class Success<T>(val value: T) : Result<T>()
    data class Failure(val message: String) : Result<Nothing>()
}

fun parseAge(text: String): Result<Int> {
    val n = text.toIntOrNull() ?: return Result.Failure("'$text' is not a number")
    return if (n in 0..150) Result.Success(n) else Result.Failure("$n is not an age")
}

fun main() {
    for (t in listOf("42", "abc", "999")) {
        when (val r = parseAge(t)) {
            is Result.Success -> println("age \${r.value}")
            is Result.Failure -> println("error: \${r.message}")
        }
    }
}`),
      out(`age 42
error: 'abc' is not a number
error: 999 is not an age`),
      '`when (val r = …)` names the value it tests, for use in the branches. (`out T` and `Nothing` are what let a `Failure` stand for a `Result` of any type: [[lesson:kt-generics]] and [[lesson:kt-any-unit-nothing]] explain them.)',
      '## Modelling state',
      kt(`sealed interface Screen {
    data object Loading : Screen
    data class Loaded(val items: List<String>) : Screen
    data class Error(val reason: String) : Screen
}

fun render(s: Screen): String = when (s) {
    Screen.Loading -> "spinner"
    is Screen.Loaded -> if (s.items.isEmpty()) "empty list" else s.items.joinToString()
    is Screen.Error -> "error: \${s.reason}"
}

fun main() {
    println(render(Screen.Loading))
    println(render(Screen.Loaded(listOf("a", "b"))))
    println(render(Screen.Error("offline")))
}`),
      out(`spinner
a, b
error: offline`),
      'A sealed class can have a constructor (it is `protected` unless you say `private`) and state that its subtypes share; a sealed interface cannot, but a class can implement several. Prefer a sealed interface unless the subtypes share state.',
      '## Guards in when',
      kt(`sealed interface Order
data class Online(val total: Int) : Order
data object InStore : Order

fun shipping(o: Order): Int = when (o) {
    is Online if o.total >= 500 -> 0
    is Online -> 40
    InStore -> 0
}

fun main() {
    println(listOf(Online(800), Online(200), InStore).map { shipping(it) })
}`),
      out('[0, 40, 0]'),
      'A guard (`is Online if …`, stable since Kotlin 2.2.0) adds a condition to a branch without giving up the check that every case is covered.'
    ].join('\n\n'),
    java: [
      java(`sealed interface Shape permits Circle, Rect {}
record Circle(double radius) implements Shape {}
record Rect(double w, double h) implements Shape {}

double area(Shape s) {
    return switch (s) {
        case Circle c -> Math.PI * c.radius() * c.radius();
        case Rect r -> r.w() * r.h();
    };
}`),
      'Java 17 has sealed types too, and Java 21\'s `switch` with patterns checks that every case is handled. Kotlin needs no `permits` list (the compiler finds the subtypes in the package), a `data class` subtype is a record with `copy`, and `is Circle` smart-casts `s` with no new name.'
    ].join('\n\n'),
    example: {
      code: `sealed interface Event
data class Click(val x: Int, val y: Int) : Event
data class Key(val char: Char) : Event
data object Close : Event

fun describe(e: Event) = when (e) {
    is Click -> "click at (\${e.x}, \${e.y})"
    is Key -> "key '\${e.char}'"
    Close -> "close"
}

fun main() {
    val events = listOf(Click(3, 4), Key('k'), Close)
    for (e in events) println(describe(e))
}`,
      note: 'Add `data class Scroll(val dy: Int) : Event` and run: the compiler points at the `when` that does not handle it.'
    },
    challenge: {
      title: 'A payment result',
      task: 'Model the result of a payment as the sealed interface `PaymentResult`, with three subtypes:\n\n- `Approved(val id: String)`, a data class (given);\n- `Declined(val reason: String)`, a data class;\n- `Pending`, a data object.\n\nThen write `message(r)` as a `when` with **no `else`**: `"Approved: <id>"`, `"Declined: <reason>"` and `"Still processing"`.',
      starter: `sealed interface PaymentResult

data class Approved(val id: String) : PaymentResult
// Declined(reason) and Pending go here

fun message(r: PaymentResult): String = TODO("a when over every result, with no else")

fun main() {
    println(message(Approved("tx-1")))
}`,
      solution: `sealed interface PaymentResult

data class Approved(val id: String) : PaymentResult
data class Declined(val reason: String) : PaymentResult
data object Pending : PaymentResult

fun message(r: PaymentResult): String = when (r) {
    is Approved -> "Approved: \${r.id}"
    is Declined -> "Declined: \${r.reason}"
    Pending -> "Still processing"
}

fun main() {
    println(message(Approved("tx-1")))
    println(message(Declined("card expired")))
    println(message(Pending))
}`,
      hints: [
        '`data class Declined(val reason: String) : PaymentResult` and `data object Pending : PaymentResult`.',
        'A data class branch is `is Approved -> …` (then `r.id` works); an object branch needs no `is`: `Pending -> …`.'
      ],
      checks: [
        { label: 'An approved payment: `Approved: tx-1`', code: 'eq(message(Approved("tx-1")), "Approved: tx-1")' },
        { label: 'A declined one: `Declined: card expired`', code: 'eq(message(Declined("card expired")), "Declined: card expired")' },
        { label: 'A pending one: `Still processing`', code: 'eq(message(Pending), "Still processing")' },
        { label: '`Declined` compares by value, and `Pending` prints as `Pending`', code: 'eq(Declined("x"), Declined("x"))\neq(Pending.toString(), "Pending")' },
        { label: '`PaymentResult` is sealed, and the `when` has no `else`', code: 'ok(PaymentResult::class.java.isSealed, "keep PaymentResult sealed")\nok(!uses("""\\belse\\b"""), "cover every case in the when, with no else")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 8 */
  L.push({
    id: 'kt-interfaces', track: 'classes', title: 'Interfaces',
    summary: 'Interfaces with abstract and default methods and abstract properties; implementing several, and resolving a clash with super<A>; fun interface for an interface with one method.',
    keywords: ['interface', 'implements', 'default method', 'abstract property', 'super', 'multiple inheritance', 'fun interface', 'SAM', 'functional interface', 'diamond'],
    docs: 'https://kotlinlang.org/docs/interfaces.html',
    body: [
      '## Methods with and without bodies',
      kt(`interface Shape {
    val name: String
    fun area(): Double
    fun describe() = "$name with area \${"%.1f".format(area())}"
}

class Square(val side: Double) : Shape {
    override val name = "square"
    override fun area() = side * side
}

fun main() {
    println(Square(3.0).describe())
}`),
      out('square with area 9.0'),
      'An interface can declare properties (`name`), which each class provides, and give methods a body (`describe`), like Java 8\'s default methods. What it cannot hold is state: a property in an interface is either abstract or has a getter, never a stored value.',
      '## Several interfaces, and a clash',
      kt(`interface Walker {
    fun move() = "walk"
}

interface Swimmer {
    fun move() = "swim"
}

class Duck : Walker, Swimmer {
    override fun move() = "\${super<Walker>.move()} and \${super<Swimmer>.move()}"
}

fun main() {
    println(Duck().move())
}`),
      out('walk and swim'),
      'When two interfaces give the same method a body, the class must override it, and `super<Walker>` says whose version to call (Java writes `Walker.super.move()`).',
      '## Interface or abstract class?',
      'An abstract class can hold state and take constructor parameters, and a class extends only one. An interface holds no state, and a class implements as many as it likes. Start with an interface; reach for an abstract class when the shared code needs fields: [[q:interface-vs-abstract]].',
      '## fun interface: one abstract method',
      kt(`fun interface Validator {
    fun validate(input: String): Boolean
}

fun check(input: String, rules: List<Validator>) = rules.all { it.validate(input) }

fun main() {
    val notBlank = Validator { it.isNotBlank() }
    val short = Validator { it.length <= 10 }
    println(check("kotlin", listOf(notBlank, short)))
    println(check("a very long input", listOf(notBlank, short)))
}`),
      out(`true
false`),
      '`fun interface` marks an interface with one abstract method, so a lambda can stand for it (a *SAM conversion*, as Java does for its functional interfaces). Lambdas are the subject of the [[track:functional]] track.'
    ].join('\n\n'),
    java: '| Java | Kotlin |\n|---|---|\n| `class A implements X, Y` | `class A : X, Y` |\n| a `default` method | a method with a body |\n| `X.super.m()` | `super<X>.m()` |\n| a getter declared in an interface, `String getName()` | an abstract property, `val name: String` |\n| `@FunctionalInterface` | `fun interface` |\n| a `static` method in an interface | a function in the interface\'s `companion object` |',
    example: {
      code: `interface Priced {
    val price: Double
    fun withTax(rate: Double = 0.18) = price * (1 + rate)
}

interface Named {
    val name: String
    fun label() = name.uppercase()
}

class Item(override val name: String, override val price: Double) : Priced, Named

fun main() {
    val pen = Item("pen", 100.0)
    println("\${pen.label()}: \${pen.withTax()}")
}`,
      note: 'Give `Item` its own `label()` that adds the price, and call `super.label()` inside it.'
    },
    challenge: {
      title: 'Discounts behind an interface',
      task: 'Write the interface `Discount`, with `fun priceAfter(price: Int): Int` and a property `name` whose default getter returns `"discount"`. Then two classes that implement it:\n\n- `PercentOff(percent)`: takes that many per cent off (`PercentOff(10).priceAfter(200)` is 180), and its `name` is `"10% off"`;\n- `FlatOff(amount)`: takes `amount` off, never going below 0 (`FlatOff(50).priceAfter(30)` is 0), and keeps the default name.\n\nFinally, `best(price, offers)`: the lowest price any of the offers gives.',
      starter: `interface Discount {
    // fun priceAfter(price: Int): Int, and a name with a default getter
}

class PercentOff(val percent: Int)

class FlatOff(val amount: Int)

fun best(price: Int, offers: List<Discount>): Int = TODO("the lowest price any offer gives")

fun main() {
    println(best(200, listOf()))
}`,
      solution: `interface Discount {
    val name: String
        get() = "discount"

    fun priceAfter(price: Int): Int
}

class PercentOff(val percent: Int) : Discount {
    override val name = "$percent% off"
    override fun priceAfter(price: Int) = price - price * percent / 100
}

class FlatOff(val amount: Int) : Discount {
    override fun priceAfter(price: Int) = maxOf(0, price - amount)
}

fun best(price: Int, offers: List<Discount>): Int = offers.minOf { it.priceAfter(price) }

fun main() {
    println(best(200, listOf(PercentOff(10), FlatOff(50))))
}`,
      hints: [
        'A property with a default in an interface has a getter: `val name: String get() = "discount"` (the `get()` on the next line).',
        '`maxOf(0, x)` stops at 0, and `offers.minOf { it.priceAfter(price) }` is the smallest result.'
      ],
      checks: [
        { label: '`PercentOff(10).priceAfter(200)` is 180', code: 'eq(PercentOff(10).priceAfter(200), 180)' },
        { label: '`FlatOff(50)` takes 50 off, and never goes below 0', code: 'eq(listOf(FlatOff(50).priceAfter(200), FlatOff(50).priceAfter(30)), listOf(150, 0))' },
        { label: 'The names: `10% off`, and the default `discount`', code: 'eq(listOf(PercentOff(10).name, FlatOff(5).name), listOf("10% off", "discount"))' },
        { label: '`best` picks the lowest price', code: 'eq(best(200, listOf(PercentOff(10), FlatOff(50))), 150)\neq(best(1000, listOf(PercentOff(10), FlatOff(50))), 900)' },
        { label: 'Both are `Discount`s', code: 'val offers: List<Discount> = listOf(PercentOff(1), FlatOff(1))\neq(offers.size, 2)' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 9 */
  L.push({
    id: 'kt-inheritance', track: 'classes', title: 'Inheritance and abstract classes',
    summary: 'Extending an open class and calling its constructor, overriding methods and properties, super calls, abstract classes, Any at the root, and why a constructor must not call an open function.',
    keywords: ['inheritance', 'extends', 'open', 'override', 'super', 'abstract', 'abstract class', 'Any', 'subclass', 'superclass', 'constructor order', 'polymorphism', 'template method'],
    docs: 'https://kotlinlang.org/docs/inheritance.html',
    body: [
      '## Extending a class',
      kt(`open class Employee(val name: String, val baseSalary: Int) {
    open fun salary() = baseSalary
    override fun toString() = "$name earns \${salary()}"
}

class Manager(name: String, baseSalary: Int, val bonus: Int) : Employee(name, baseSalary) {
    override fun salary() = super.salary() + bonus
}

fun main() {
    val staff: List<Employee> = listOf(Employee("Asha", 50), Manager("Ravi", 70, 20))
    for (e in staff) println(e)
}`),
      out(`Asha earns 50
Ravi earns 90`),
      '`: Employee(name, baseSalary)` names the parent and calls its constructor in one place: Java\'s `extends` and its `super(…)` call together. `super.salary()` calls the parent\'s version. Every class extends `Any`, Kotlin\'s `Object`, which gives `equals`, `hashCode` and `toString`.',
      '## Overriding properties',
      kt(`open class Vehicle {
    open val wheels = 4
    fun describe() = "$wheels wheels"
}

class Bike : Vehicle() {
    override val wheels = 2
}

fun main() {
    println(Vehicle().describe())
    println(Bike().describe())
}`),
      out(`4 wheels
2 wheels`),
      '## Abstract classes',
      kt(`abstract class Report(val title: String) {
    abstract fun body(): String
    fun render() = "== $title ==\\n\${body()}"
}

class SalesReport(private val total: Int) : Report("Sales") {
    override fun body() = "Total: $total"
}

fun main() {
    println(SalesReport(1200).render())
}`),
      out(`== Sales ==
Total: 1200`),
      'An `abstract` class cannot be made by itself, and its `abstract` members have no body; they are open without saying so. This is the *template method* pattern: `render` is fixed, and each subclass fills in `body`.',
      '## Never call an open function from a constructor',
      kt(`open class Base {
    init {
        println("Base sees: \${describe()}")
    }
    open fun describe() = "base"
}

class Child : Base() {
    private val label = "child"
    override fun describe() = "label is $label"
}

fun main() {
    Child()
}`),
      out('Base sees: label is null'),
      'The parent\'s constructor runs first, so `describe()` ran before `label` was set, and a `String` that can never be null read as `null`. It is one of the few holes in Kotlin\'s null safety ([[q:npe-in-kotlin]]). The cure is simple: a constructor or `init` block must not call `open` functions.',
      '## is, as and smart casts',
      kt(`open class Animal
class Dog : Animal() {
    fun fetch() = "fetching"
}

fun play(a: Animal) = if (a is Dog) a.fetch() else "no tricks"

fun main() {
    println(play(Dog()))
    println(play(Animal()))
}`),
      out(`fetching
no tricks`),
      'After `a is Dog`, `a` is a `Dog` in that branch, so `fetch()` needs no cast (Java\'s `instanceof` with a pattern does the same since Java 16).'
    ].join('\n\n'),
    java: [
      java(`public class Manager extends Employee {
    private final int bonus;

    public Manager(String name, int baseSalary, int bonus) {
        super(name, baseSalary);
        this.bonus = bonus;
    }

    @Override
    public int salary() { return super.salary() + bonus; }
}`),
      'In Kotlin, `: Employee(name, baseSalary)` is both `extends Employee` and the `super(…)` call; `@Override` is the `override` keyword, and required; and the parent must be `open` or `abstract`, where in Java it only has to not be `final`.'
    ].join('\n\n'),
    example: {
      code: `abstract class Shape(val name: String) {
    abstract fun area(): Double
    override fun toString() = "%s (%.2f)".format(name, area())
}

class Circle(val r: Double) : Shape("circle") {
    override fun area() = Math.PI * r * r
}

class Square(val side: Double) : Shape("square") {
    override fun area() = side * side
}

fun main() {
    val shapes = listOf(Circle(1.0), Square(2.0))
    for (s in shapes) println(s)
    println("largest: \${shapes.maxBy { it.area() }.name}")
}`,
      note: 'Add a `Triangle`, and try leaving out its `area()`.'
    },
    challenge: {
      title: 'Accounts with different rules',
      task: 'The abstract class `Account` is given, with a `balance` only it and its subclasses can set. Write:\n\n- its `withdraw(amount)`: takes the money and returns `true` only when `canWithdraw(amount)` allows it, and otherwise changes nothing and returns `false`;\n- `SavingsAccount(owner)`: may not go below 0;\n- `CurrentAccount(owner, overdraft)`: may go down to `-overdraft`, but no further.',
      starter: `abstract class Account(val owner: String) {
    var balance = 0
        protected set

    fun deposit(amount: Int) {
        balance += amount
    }

    abstract fun canWithdraw(amount: Int): Boolean

    fun withdraw(amount: Int): Boolean = TODO("take the money only when canWithdraw allows it")
}

// class SavingsAccount(owner: String): never below 0

// class CurrentAccount(owner: String, val overdraft: Int): down to -overdraft

fun main() {
    println("Write the two kinds of account")
}`,
      solution: `abstract class Account(val owner: String) {
    var balance = 0
        protected set

    fun deposit(amount: Int) {
        balance += amount
    }

    abstract fun canWithdraw(amount: Int): Boolean

    fun withdraw(amount: Int): Boolean {
        if (!canWithdraw(amount)) return false
        balance -= amount
        return true
    }
}

class SavingsAccount(owner: String) : Account(owner) {
    override fun canWithdraw(amount: Int) = balance - amount >= 0
}

class CurrentAccount(owner: String, val overdraft: Int) : Account(owner) {
    override fun canWithdraw(amount: Int) = balance - amount >= -overdraft
}

fun main() {
    val s = SavingsAccount("Asha")
    s.deposit(100)
    println(s.withdraw(150))
    println(s.balance)
}`,
      hints: [
        'A subclass passes its owner on: `class SavingsAccount(owner: String) : Account(owner) { override fun canWithdraw(amount: Int) = … }`.',
        'In `withdraw`, ask first: `if (!canWithdraw(amount)) return false`, then take the money and return `true`.'
      ],
      checks: [
        { label: 'Savings: 100 in, then 150 out is refused, and the balance stays 100', code: 'val s = SavingsAccount("Asha")\ns.deposit(100)\neq(listOf(s.withdraw(150), s.balance), listOf(false, 100))' },
        { label: 'Savings: 100 in, then 100 out is allowed', code: 'val s = SavingsAccount("Asha")\ns.deposit(100)\neq(listOf(s.withdraw(100), s.balance), listOf(true, 0))' },
        { label: 'Current, overdraft 50: 100 in, then 150 out is allowed (balance -50)', code: 'val c = CurrentAccount("Ravi", 50)\nc.deposit(100)\neq(listOf(c.withdraw(150), c.balance), listOf(true, -50))' },
        { label: '…and one more rupee is refused', code: 'val c = CurrentAccount("Ravi", 50)\nc.deposit(100)\nc.withdraw(150)\neq(listOf(c.withdraw(1), c.balance), listOf(false, -50))' },
        { label: 'Both are `Account`s, with their owners', code: 'val all: List<Account> = listOf(SavingsAccount("A"), CurrentAccount("B", 0))\neq(all.map { it.owner }, listOf("A", "B"))' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 10 */
  L.push({
    id: 'kt-value-inner', track: 'classes', title: 'Value classes, nested and inner classes',
    summary: 'A value class gives one value its own type, with no object at run time. A nested class is Java\'s static nested class; an inner class holds its outer object, reached with this@Outer.',
    keywords: ['value class', 'inline class', 'JvmInline', 'wrapper', 'type safety', 'nested class', 'inner', 'inner class', 'static nested class', 'this@Outer', 'memory leak'],
    docs: 'https://kotlinlang.org/docs/inline-classes.html',
    body: [
      '## A type for one value',
      'A function `transfer(from: Long, to: Long, amount: Long)` lets a caller swap two arguments, and nothing complains. A *value class* gives each meaning its own type, and costs nothing at run time:',
      kt(`@JvmInline
value class AccountId(val raw: Long)

@JvmInline
value class Paise(val amount: Long) {
    init {
        require(amount >= 0) { "money is not negative" }
    }

    fun rupees() = amount / 100
}

fun transfer(from: AccountId, to: AccountId, amount: Paise) =
    "move \${amount.rupees()} rupees from \${from.raw} to \${to.raw}"

fun main() {
    println(transfer(AccountId(1), AccountId(2), Paise(25_000)))
}`),
      out('move 250 rupees from 1 to 2'),
      'Passing a `Paise` where an `AccountId` is expected, or a plain `Long` for either, no longer compiles. At run time the wrapper disappears and the compiled code passes a `long`. A value class has exactly one property in its primary constructor (*Value class must have exactly one primary constructor parameter*); it can have functions, other properties with getters and an `init` block, but no other stored state. On the JVM it needs `@JvmInline`; both are stable since Kotlin 1.5.0.',
      '## When the wrapper is kept',
      'Where the code needs an object, the value is put in a real wrapper: in a `List<Paise>`, as a `Paise?`, or passed as `Any`. Equality is by value either way, and `===` is refused (*Identity equality for arguments of types \'Paise\' and \'Paise\' is prohibited*). A function that takes a value class is compiled under a changed name, such as `transfer-KW8opnw` (a hash after the dash), which Java code cannot call by its name, so value classes suit Kotlin-only code best.',
      '## Nested classes are static by default',
      kt(`class Outer(val name: String) {
    class Nested {
        fun hello() = "nested: no Outer needed"
    }

    inner class Inner {
        fun hello() = "inner: I belong to $name"
    }
}

fun main() {
    println(Outer.Nested().hello())
    val o = Outer("box")
    println(o.Inner().hello())
}`),
      out(`nested: no Outer needed
inner: I belong to box`),
      'This is the reverse of Java. In Java, a class inside a class is an *inner* class, holding a hidden reference to its outer object, unless you write `static`. In Kotlin it is *nested* (Java\'s `static` nested class) unless you write `inner`. Kotlin\'s default is the safe one: an inner object keeps its outer object alive as long as it lives, the classic leak of listeners and callbacks.',
      '## this@Outer',
      kt(`class Form(val title: String) {
    inner class Field(val title: String) {
        fun describe() = "$title in \${this@Form.title}"
    }
}

fun main() {
    val form = Form("Sign up")
    println(form.Field("email").describe())
}`),
      out('email in Sign up'),
      'Inside `Field`, `title` is the field\'s own; `this@Form.title` reaches the outer object\'s, as Java\'s `Form.this.title` does.'
    ].join('\n\n'),
    java: '| Java | Kotlin |\n|---|---|\n| `static class Nested` | `class Nested` |\n| `class Inner` (holds `Outer.this`) | `inner class Inner` |\n| `Outer.this.name` | `this@Outer.name` |\n| a small wrapper class, `final class UserId { final long raw; … }`: an object per value | `@JvmInline value class UserId(val raw: Long)`: no object at run time |\n\nProject Valhalla\'s value classes may one day bring something similar to Java itself.',
    example: {
      code: `@JvmInline
value class Email(val value: String) {
    init {
        require("@" in value) { "not an email: $value" }
    }

    val domain get() = value.substringAfter("@")
}

class Mailer(val from: String) {
    inner class Draft(val to: Email) {
        fun header() = "from $from to \${to.value}"
    }
}

fun main() {
    val e = Email("asha@example.com")
    println(e.domain)
    println(Mailer("ravi@example.com").Draft(e).header())
    println(runCatching { Email("not-an-email") }.exceptionOrNull()?.message)
}`,
      note: 'Remove `inner` from `Draft` and read what the compiler says about `from`.'
    },
    challenge: {
      title: 'Units that cannot be mixed up',
      task: 'Make `Meters` and `Seconds` value classes (with `@JvmInline`), and make `Seconds` refuse a negative time with `require`. Write `speed(distance, time)`, in metres per second.\n\nThen make `Lap` an **inner** class of `Race`, so its `label()` can use the race\'s name: `Race("Mumbai 10k").Lap(2).label()` is `"Mumbai 10k lap 2"`.',
      starter: `class Meters(val value: Double)

class Seconds(val value: Double)

fun speed(distance: Meters, time: Seconds): Double = TODO("metres per second")

class Race(val name: String) {
    class Lap(val number: Int) {
        fun label(): String = TODO("the race's name, then lap and the number")
    }
}

fun main() {
    println(speed(Meters(100.0), Seconds(20.0)))
}`,
      solution: `@JvmInline
value class Meters(val value: Double)

@JvmInline
value class Seconds(val value: Double) {
    init {
        require(value >= 0) { "time cannot be negative" }
    }
}

fun speed(distance: Meters, time: Seconds): Double = distance.value / time.value

class Race(val name: String) {
    inner class Lap(val number: Int) {
        fun label(): String = "$name lap $number"
    }
}

fun main() {
    println(speed(Meters(100.0), Seconds(20.0)))
    println(Race("Mumbai 10k").Lap(2).label())
}`,
      hints: [
        '`@JvmInline` on one line, then `value class Seconds(val value: Double) { init { require(value >= 0) { "…" } } }`.',
        'Only an `inner` class can read its outer object\'s `name`, and you make one from an outer object: `Race("x").Lap(2)`.'
      ],
      checks: [
        { label: '`speed(Meters(100.0), Seconds(20.0))` is 5.0', code: 'eq(speed(Meters(100.0), Seconds(20.0)), 5.0)' },
        { label: 'A negative time is refused with an `IllegalArgumentException`', code: 'eq(runCatching { Seconds(-1.0) }.exceptionOrNull()?.javaClass?.simpleName, "IllegalArgumentException")' },
        { label: '`Meters` and `Seconds` are value classes', code: 'ok(listOf(Meters::class.java, Seconds::class.java).all { c -> c.declaredMethods.any { it.name == "box-impl" } }, "declare both as @JvmInline value class")' },
        { label: '`Race("Mumbai 10k").Lap(2).label()` is `"Mumbai 10k lap 2"`', code: 'eq(Race("Mumbai 10k").Lap(2).label(), "Mumbai 10k lap 2")' },
        { label: 'Two laps of one race share its name', code: 'val r = Race("Pune half")\neq(listOf(r.Lap(1).label(), r.Lap(2).label()), listOf("Pune half lap 1", "Pune half lap 2"))' }
      ]
    }
  });
})(window.KLT);
