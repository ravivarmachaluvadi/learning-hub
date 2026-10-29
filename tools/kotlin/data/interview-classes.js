/*
 * data/interview-classes.js - interview questions on classes and objects (Track 2, batch 2).
 *
 * The question shape is described at the top of data/interview-basics.js. Every ```kotlin block runs in
 * tests/test_content.py, and an ```output block after one is its exact output. Compiler messages are
 * K2's, as kotlinc 2.4.20 words them; what Java sees (mangled names, synthetic fields) was checked by
 * running the code through Java reflection (ROADMAP.md, batch 2).
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function norun(code) { return '```kotlin-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function java(code) { return '```java\n' + code + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];

  Q.push({
    id: 'data-classes', track: 'classes', weight: 3,
    q: 'What does a data class generate, and what are its limits?',
    keywords: ['data class', 'equals', 'hashCode', 'toString', 'copy', 'componentN', 'destructuring', 'record', 'DTO', 'JPA entity', 'shallow copy'],
    short: 'From the properties in its primary constructor: `equals` and `hashCode` (by value), `toString`, `copy` (change some properties by name), and `component1()`, `component2()`… for destructuring. The limits: only primary-constructor properties take part (a property in the body is ignored); `copy` is shallow; the class cannot be `open`, `abstract`, `sealed` or `inner`, and needs at least one constructor parameter. A `var` property in a data class used as a hash key is a trap, and JPA entities should not be data classes.',
    answer: [
      kt(`data class User(val name: String, val age: Int) {
    var lastLogin: String = "never"
}

fun main() {
    val a = User("Asha", 30)
    val b = a.copy()
    b.lastLogin = "today"
    println(a == b)
    println(b)
    val (name, age) = a
    println("$name, $age")
    println(a.hashCode() == User("Asha", 30).hashCode())
}`),
      out(`true
User(name=Asha, age=30)
Asha, 30
true`),
      '`lastLogin` is declared in the body, so `==` and `toString` ignore it: the two users are equal although their logins differ. That is useful for a cache field, and a bug when it was meant to count.',
      '**`copy` is shallow:** a list property is shared between the original and the copy. Prefer `val` properties of read-only types, and the copy is safe.',
      '**A `var` in a hash key:** change a property after the object went into a `HashSet` or a `HashMap` key, and its hash code changes; the collection looks in the wrong place and no longer finds it ([[lesson:kt-data-classes]] shows it).',
      '**Why not for JPA entities.** An entity\'s identity is its database id, often set when it is saved, and its other fields change. A data class\'s `hashCode` over every property changes with them, so an entity put in a `HashSet` before saving cannot be found after; and a generated `toString` or `equals` that touches a lazy relation loads it, or throws outside a session. Hibernate also needs an open class and a no-argument constructor. Use a plain class with `equals` on the id for entities, and data classes for DTOs and value objects.',
      '**Records.** Java 16 records give `equals`, `hashCode`, `toString` and accessors, but no `copy`, no destructuring, no `var` properties and no default values; `@JvmRecord` compiles a data class as a real record when Java code needs one.'
    ].join('\n\n'),
    followups: [
      'Why should a data class used as a map key have only `val` properties?',
      'How would you make a deep copy of a data class that holds a list?',
      'Data class or Java record for the DTOs of a Kotlin Spring Boot service?'
    ],
    related: ['lesson:kt-data-classes', 'q:equality', 'q:value-classes'],
    docs: 'https://kotlinlang.org/docs/data-classes.html'
  });

  Q.push({
    id: 'object-companion', track: 'classes', weight: 3,
    q: 'What are object and companion object, and how does Kotlin replace static?',
    keywords: ['object', 'companion object', 'singleton', 'static', 'JvmStatic', 'JvmField', 'const', 'factory', 'INSTANCE', 'Companion'],
    short: '`object` declares a singleton: a class and its one instance, made lazily and thread-safely the first time it is used. A `companion object` is an object inside a class whose members are called through the class name, `User.create()`: with top-level functions, it is how Kotlin replaces `static`. It is a real object, so it can implement interfaces and be passed around. For Java callers, `@JvmStatic` makes its functions real static methods, and `const val` (or `@JvmField`) makes its constants static fields.',
    answer: [
      kt(`interface Factory<T> {
    fun create(name: String): T
}

class User private constructor(val name: String) {
    companion object : Factory<User> {
        const val MAX_NAME = 20
        override fun create(name: String) = User(name.take(MAX_NAME))
    }
}

object Registry {
    private val users = mutableListOf<User>()
    fun add(u: User) = users.add(u)
    fun count() = users.size
}

fun <T> makeAll(f: Factory<T>, names: List<String>) = names.map { f.create(it) }

fun main() {
    makeAll(User, listOf("Asha", "Ravi")).forEach { Registry.add(it) }
    println(Registry.count())
    println(User.create("a".repeat(30)).name.length)
}`),
      out(`2
20`),
      'The companion object is passed as a value, `makeAll(User, …)`, because it implements `Factory`: something no Java `static` method can do.',
      '**What Java sees:**\n\n| Kotlin | Java calls it as |\n|---|---|\n| a companion `fun create` | `User.Companion.create("x")` |\n| the same, with `@JvmStatic` | `User.create("x")` |\n| `const val MAX_NAME` | `User.MAX_NAME`, a static field |\n| `object Registry` | `Registry.INSTANCE.count()` |\n| a top-level function in `main.kt` | `MainKt.greet()` |',
      '**Which to use.** A function that belongs to no class: a top-level function. A factory or a constant that belongs to a class: its companion object. One shared service or registry: an `object`, with the usual caution about global mutable state; in a Spring application a bean is usually better, because a test can replace it. For one case of a sealed hierarchy, a `data object`.'
    ].join('\n\n'),
    followups: [
      'Is an `object` made when the program starts or on first use, and is that thread-safe?',
      'What does `@JvmStatic` change, and when do you need it?',
      'Why would a companion object implement an interface?'
    ],
    related: ['lesson:kt-objects', 'q:val-var-const', 'q:java-interop'],
    docs: 'https://kotlinlang.org/docs/object-declarations.html'
  });

  Q.push({
    id: 'sealed-classes', track: 'classes', weight: 3,
    q: 'What are sealed classes and interfaces, and how do they differ from enums?',
    keywords: ['sealed', 'sealed class', 'sealed interface', 'enum', 'exhaustive', 'when', 'algebraic data type', 'state', 'result', 'permits'],
    short: 'A sealed class or interface keeps all its subtypes in the same package and module, so the compiler knows every one. A `when` over it can then be exhaustive with no `else`, and adding a subtype makes every such `when` stop compiling until it handles the new case. An enum is a fixed set of single *instances* that share one shape; a sealed type is a fixed set of *types*, each with its own properties and any number of instances. Typical uses: results (`Success` and `Failure`), UI state, events and commands.',
    answer: [
      kt(`sealed interface LoadState<out T> {
    data object Loading : LoadState<Nothing>
    data class Success<T>(val data: T) : LoadState<T>
    data class Failure(val error: String, val retryable: Boolean) : LoadState<Nothing>
}

fun <T> describe(s: LoadState<T>): String = when (s) {
    LoadState.Loading -> "loading"
    is LoadState.Success -> "got \${s.data}"
    is LoadState.Failure -> if (s.retryable) "failed (\${s.error}), retrying" else "failed: \${s.error}"
}

fun main() {
    val states = listOf(LoadState.Loading, LoadState.Success(listOf(1, 2)), LoadState.Failure("timeout", true))
    for (s in states) println(describe(s))
}`),
      out(`loading
got [1, 2]
failed (timeout), retrying`),
      '| | enum | sealed type |\n|---|---|---|\n| What is fixed | the instances | the subtypes |\n| Instances per case | exactly one | any number |\n| Data per case | the same properties for all | each subtype its own |\n| Exhaustive `when` | yes | yes |\n| `entries`, `valueOf`, `ordinal` | yes | no |',
      '**Sealed class or sealed interface?** A sealed class can have a constructor and state its subtypes share; a sealed interface cannot hold state, but a class can implement several sealed interfaces, and an enum can implement one. Prefer the interface unless the subtypes share state.',
      '**Why no `else`.** With an `else`, a new subtype silently takes the `else` branch. Without it, the compiler lists every `when` to update: *\'when\' expression must be exhaustive*.',
      '**Java.** Java 17 has sealed classes too, with a `permits` list (or subclasses in the same file), and Java 21\'s `switch` with patterns checks them. Kotlin needs no `permits` list: the subtypes may be in any file of the same package and module (since Kotlin 1.5.0).'
    ].join('\n\n'),
    followups: [
      'Why is an `else` branch in a `when` over a sealed type a bad idea?',
      'How do you choose between a sealed class and a sealed interface?',
      'How would you send a sealed hierarchy as JSON, and read it back?'
    ],
    related: ['lesson:kt-sealed', 'lesson:kt-enums', 'q:when-vs-switch', 'q:smart-casts'],
    docs: 'https://kotlinlang.org/docs/sealed-classes.html'
  });

  Q.push({
    id: 'final-by-default', track: 'classes', weight: 3,
    q: 'Why are Kotlin classes final by default, and what does that mean for Spring?',
    keywords: ['final', 'open', 'final by default', 'override', 'fragile base class', 'Spring', 'proxy', 'CGLIB', 'all-open', 'kotlin-spring', 'no-arg', 'kotlin-jpa', 'Transactional'],
    short: 'Classes and their members are final unless marked `open`, following Effective Java\'s advice: design and document for inheritance, or else prohibit it. An unplanned subclass breaks when its parent changes (the fragile base class problem). `override` is a required keyword, and `final override` stops further overriding. Frameworks that subclass your classes at run time, such as Spring\'s CGLIB proxies for `@Configuration` and `@Transactional`, need them open, so Kotlin projects use the `kotlin-spring` (all-open) and `kotlin-jpa` (no-arg) compiler plugins, which Spring Initializr sets up for a Kotlin project.',
    answer: [
      norun(`class Repository {
    fun find(id: Int) = "item $id"
}

// compile error: This type is final, so it cannot be extended.
class CachedRepository : Repository()`),
      kt(`open class Repository {
    open fun find(id: Int) = "item $id"
    fun findAll(ids: List<Int>) = ids.map { find(it) }
}

open class CachedRepository : Repository() {
    private val cache = mutableMapOf<Int, String>()
    final override fun find(id: Int) = cache.getOrPut(id) { super.find(id) + " (cached)" }
}

fun main() {
    val repo: Repository = CachedRepository()
    println(repo.findAll(listOf(1, 2, 1)))
}`),
      out('[item 1 (cached), item 2 (cached), item 1 (cached)]'),
      '`findAll` is not open, so no subclass can change how it works; `find` is open, and `CachedRepository` closes it again with `final override` while staying open itself.',
      '**Spring.** A `@Configuration` class, or a bean with `@Transactional`, `@Cacheable` or `@Async`, is wrapped in a CGLIB subclass that overrides its methods to add the behaviour. A final class cannot be proxied at all, and a final method is called directly, past the proxy: the transaction silently never starts. The `kotlin-spring` plugin opens every class annotated with `@Component`, `@Async`, `@Transactional`, `@Cacheable` or `@SpringBootTest`, and with annotations built on them, such as `@Service` and `@Configuration`.',
      '**JPA.** Hibernate needs a no-argument constructor and, for lazy loading, classes it can subclass: the `kotlin-jpa` plugin adds the constructor, and an `allOpen` setting for `@Entity` opens the classes.'
    ].join('\n\n'),
    followups: [
      'What goes wrong if a `@Transactional` service method is final?',
      'What do the all-open and no-arg compiler plugins do?',
      'When would you mark an override `final`?'
    ],
    related: ['lesson:kt-visibility', 'lesson:kt-inheritance', 'q:interface-vs-abstract'],
    docs: 'https://kotlinlang.org/docs/all-open-plugin.html'
  });

  Q.push({
    id: 'lateinit-vs-lazy', track: 'classes', weight: 3,
    q: 'lateinit or by lazy: what is the difference, and when do you use each?',
    keywords: ['lateinit', 'lazy', 'by lazy', 'isInitialized', 'UninitializedPropertyAccessException', 'thread safety', 'LazyThreadSafetyMode', 'dependency injection', 'Delegates.notNull'],
    short: '`lateinit var` is a non-null property that something outside promises to set before it is read: dependency injection, a test\'s setup. Reading it first throws `UninitializedPropertyAccessException`, and `::x.isInitialized` tells you. It must be a `var` of a non-null, non-primitive type. `val x by lazy { … }` computes its value itself, on the first read, once, and caches it; it is a `val` of any type, and thread-safe by default. `lateinit` when the value comes from outside, `lazy` when the property can work it out.',
    answer: [
      kt(`class ReportService {
    lateinit var repository: String

    val expensiveConfig: Map<String, Int> by lazy {
        println("loading config once")
        mapOf("pageSize" to 50)
    }

    fun ready() = this::repository.isInitialized
}

fun main() {
    val s = ReportService()
    println(s.ready())
    s.repository = "postgres"
    println(s.ready())
    println(s.expensiveConfig["pageSize"])
    println(s.expensiveConfig["pageSize"])
    val early = ReportService()
    println(runCatching { early.repository }.exceptionOrNull()?.javaClass?.simpleName)
}`),
      out(`false
true
loading config once
50
50
UninitializedPropertyAccessException`),
      '| | `lateinit var` | `val … by lazy { }` |\n|---|---|---|\n| `val` or `var` | `var` | `val` |\n| Types | non-null, not a primitive | any |\n| Who sets it | code outside: injection, setup | its own block, on the first read |\n| Read before it has a value | throws | computes it |\n| Threads | a plain field, no locking | synchronised by default |',
      '`lazy` is a property delegate (the [[lesson:kt-property-delegates]] lesson covers delegates). `by lazy(LazyThreadSafetyMode.NONE) { … }` drops the lock when only one thread reads the property.',
      '**Common mistakes:** `lateinit` on an `Int` is refused (*\'lateinit\' modifier is not allowed on properties of primitive types*): use `Delegates.notNull<Int>()` or a nullable. And `lazy` around a value that must be recomputed: it never is. With constructor injection, as Spring recommends, neither is needed: the dependency is a constructor `val`.'
    ].join('\n\n'),
    followups: [
      'Why can `lateinit` not be used on an `Int`?',
      'Which thread-safety modes does `lazy` offer?',
      'With constructor injection in Spring, do you still need `lateinit`?'
    ],
    related: ['lesson:kt-properties', 'q:properties-fields', 'q:npe-in-kotlin'],
    docs: 'https://kotlinlang.org/docs/properties.html#late-initialized-properties-and-variables'
  });

  Q.push({
    id: 'constructors-init', track: 'classes', weight: 2,
    q: 'How do primary constructors, init blocks and secondary constructors work, and in what order do they run?',
    keywords: ['constructor', 'primary constructor', 'secondary constructor', 'init', 'initialization order', 'this', 'super', 'JvmOverloads'],
    short: 'The primary constructor is in the class header, and `val` or `var` parameters there become properties. Property initializers and `init` blocks run as part of it, top to bottom, in the order they are written. A secondary constructor (`constructor(…) : this(…)`) must call the primary one first, so its own body runs after every initializer. A subclass calls its parent\'s constructor first, so the parent is set up before the child\'s initializers run.',
    answer: [
      kt(`open class Parent(name: String) {
    init {
        println("1. parent init for $name")
    }
}

class Child(name: String) : Parent(name) {
    val greeting = "hello".also { println("2. child property") }

    init {
        println("3. child init")
    }

    constructor(id: Int) : this("child-$id") {
        println("4. secondary constructor body")
    }
}

fun main() {
    Child(7)
}`),
      out(`1. parent init for child-7
2. child property
3. child init
4. secondary constructor body`),
      'Default arguments cover most of what Java\'s overloaded constructors do, and `@JvmOverloads` writes the overloads for Java callers. A class may also have no primary constructor and only secondary ones, which is how a class with several unrelated constructors is usually written.',
      'The trap: calling an `open` function from an initializer runs the subclass\'s override before the subclass is set up, and its properties read as `null` ([[lesson:kt-inheritance]]).'
    ].join('\n\n'),
    followups: [
      'When do you need a secondary constructor instead of default arguments?',
      'Which runs first: a property initializer, or an `init` block written below it?',
      'What does `@JvmOverloads` generate?'
    ],
    related: ['lesson:kt-constructors', 'lesson:kt-inheritance', 'q:default-named-args'],
    docs: 'https://kotlinlang.org/docs/classes.html#constructors-and-initializer-blocks'
  });

  Q.push({
    id: 'properties-fields', track: 'classes', weight: 2,
    q: 'What is a Kotlin property, and how does it relate to fields, getters and setters?',
    keywords: ['property', 'field', 'backing field', 'getter', 'setter', 'get()', 'set()', 'JvmField', 'private set', 'computed property', 'JavaBean'],
    short: 'A property is a value with accessors: a `val` has a getter, a `var` a getter and a setter. The compiler makes a private field (the *backing field*) only when it is needed: when the property has an initializer and default accessors, or a custom accessor uses `field`. A property with only a custom getter stores nothing. Callers write `user.name` and Kotlin calls the getter, so logic can be added later without changing callers. Java sees ordinary getters and setters; `@JvmField` exposes the field itself.',
    answer: [
      kt(`class Temperature {
    var celsius: Double = 0.0
        set(value) {
            require(value >= -273.15) { "below absolute zero" }
            field = value
        }

    val fahrenheit: Double
        get() = celsius * 9 / 5 + 32

    var history = mutableListOf<Double>()
        private set
}

fun main() {
    val t = Temperature()
    t.celsius = 100.0
    println(t.fahrenheit)
    println(Temperature::class.java.declaredFields.map { it.name }.sorted())
}`),
      out(`212.0
[celsius, history]`),
      'The class has two fields: `fahrenheit` is worked out on each read and has none.',
      '| Kotlin | What Java sees |\n|---|---|\n| `val name` | `getName()` |\n| `var name` | `getName()` and `setName(…)` |\n| `var isActive` | `isActive()` and `setActive(…)` |\n| `@JvmField val id` | a public field `id` |\n| `const val MAX` (in an object) | a static final field |',
      'Accessors can have their own visibility (`private set`). At run time the JIT inlines trivial getters and setters, so a property costs what a field does.'
    ].join('\n\n'),
    followups: [
      'When does a property have no backing field?',
      'Should this be a property with a getter, or a function?',
      'How do you make a property read-only from outside but writable inside the class?'
    ],
    related: ['lesson:kt-properties', 'q:lateinit-vs-lazy'],
    docs: 'https://kotlinlang.org/docs/properties.html'
  });

  Q.push({
    id: 'visibility', track: 'classes', weight: 2,
    q: 'What visibility modifiers does Kotlin have, and how do they differ from Java\'s?',
    keywords: ['visibility', 'public', 'private', 'protected', 'internal', 'module', 'package-private', 'name mangling'],
    short: 'Four: `public`, the default (Java\'s default is package-private); `internal`, visible in the same module (one Gradle or Maven module); `protected`, the class and its subclasses, without Java\'s same-package access; and `private`, inside the class, or inside the file for a top-level declaration. Kotlin has no package-private. Java sees `internal` members as public, under mangled names.',
    answer: [
      kt(`open class Account(private val pin: Int) {
    internal var audits = 0
    protected fun check(entered: Int) = entered == pin

    fun unlock(entered: Int): Boolean {
        audits++
        return check(entered)
    }
}

class SavingsAccount(pin: Int) : Account(pin) {
    fun unlockTwice(entered: Int) = check(entered) && check(entered)
}

fun main() {
    val acc = SavingsAccount(1234)
    println(acc.unlock(1111))
    println(acc.unlockTwice(1234))
    println(acc.audits)
}`),
      out(`false
true
1`),
      '| Modifier | Kotlin | Java\'s nearest |\n|---|---|---|\n| (none) | `public` | package-private |\n| `public` | everywhere | everywhere |\n| `internal` | the module | (none) |\n| `protected` | the class and its subclasses | the class, its subclasses and the package |\n| `private` | the class, or the file at the top level | the class |',
      '**`internal` in practice:** a library\'s implementation classes, visible to its own code and to its tests (Gradle compiles the tests as a friend of the main code). Java code sees an `internal` member as public, with the module\'s name added, such as `getAudits$main`, so it is hard to call by accident.',
      '**Nested classes.** In Kotlin an outer class does not see the `private` members of its nested and inner classes, where Java\'s does; a nested class does see its outer class\'s private members.'
    ].join('\n\n'),
    followups: [
      'What counts as a module for `internal`?',
      'Can a unit test see `internal` declarations?',
      'Why might Kotlin have left out package-private?'
    ],
    related: ['lesson:kt-visibility', 'q:final-by-default'],
    docs: 'https://kotlinlang.org/docs/visibility-modifiers.html'
  });

  Q.push({
    id: 'interface-vs-abstract', track: 'classes', weight: 2,
    q: 'Interface or abstract class: how do you choose in Kotlin?',
    keywords: ['interface', 'abstract class', 'default method', 'state', 'multiple inheritance', 'template method', 'fun interface', 'super<A>'],
    short: 'An interface can have abstract members, methods with bodies and properties (abstract, or with getters), but no state: no backing fields and no constructor; a class can implement many. An abstract class can hold state, take constructor parameters, have `protected` members and `init` logic, and a class extends only one. Prefer interfaces for capabilities and contracts (and a `fun interface` for one method); use an abstract class for a shared base that needs state, such as a template method.',
    answer: [
      kt(`interface Shape {
    val name: String
    fun area(): Double
    fun describe() = "$name: \${"%.2f".format(area())}"
}

abstract class Polygon(private val sides: List<Double>) : Shape {
    init {
        require(sides.size >= 3) { "a polygon has 3 or more sides" }
    }
    fun perimeter() = sides.sum()
}

class Square(side: Double) : Polygon(List(4) { side }) {
    override val name = "square"
    override fun area() = (perimeter() / 4) * (perimeter() / 4)
}

fun main() {
    val s = Square(2.0)
    println(s.describe())
    println(s.perimeter())
}`),
      out(`square: 4.00
8.0`),
      '| | interface | abstract class |\n|---|---|---|\n| State (backing fields) | no | yes |\n| Constructor | no | yes |\n| How many a class can have | many | one |\n| Methods with bodies | yes | yes |\n| `protected` members | no | yes |',
      'Kotlin\'s interfaces work like Java 8\'s, plus properties. When two interfaces give the same method a body, the class must override it and choose with `super<A>.method()`.'
    ].join('\n\n'),
    followups: [
      'Can a Kotlin interface have a property? Can it store a value?',
      'How do you resolve two interfaces that give the same method a body?',
      'When would you still choose an abstract class?'
    ],
    related: ['lesson:kt-interfaces', 'lesson:kt-inheritance', 'q:final-by-default'],
    docs: 'https://kotlinlang.org/docs/interfaces.html'
  });

  Q.push({
    id: 'value-classes', track: 'classes', weight: 1,
    q: 'What is a value class, and when would you use one?',
    keywords: ['value class', 'inline class', 'JvmInline', 'wrapper', 'type safety', 'boxing', 'id', 'units'],
    short: '`@JvmInline value class UserId(val raw: Long)` wraps one value in a type of its own, so a `UserId` cannot be passed where an `OrderId` or a plain `Long` is expected, and the compiler removes the wrapper at run time where it can: the bytecode passes a `long`. The value is boxed where an object is needed: as a nullable, a generic type argument or `Any`. Use them for ids, units of measure and validated strings. They were called inline classes; value classes are stable since Kotlin 1.5.0.',
    answer: [
      kt(`@JvmInline
value class UserId(val raw: Long)

@JvmInline
value class OrderId(val raw: Long)

fun cancel(order: OrderId, by: UserId) = "order \${order.raw} cancelled by user \${by.raw}"

fun main() {
    val user = UserId(7)
    val order = OrderId(1001)
    println(cancel(order, user))
    println(UserId(7) == user)
    val ids: List<UserId> = listOf(user)
    println(ids.first().raw)
}`),
      out(`order 1001 cancelled by user 7
true
7`),
      '`cancel(user, order)`, with the arguments swapped, does not compile. With two `Long`s it would, and the bug would reach production.',
      '**The limits:** exactly one property in the constructor; no `===` (*Identity equality … is prohibited*); a function taking a value class is compiled under a mangled name, such as `cancel-KW8opnw`, which Java cannot call (`@JvmName` gives it a usable one); and boxing in collections and generics. A data class can have many properties and is always an object; a value class has one, and usually is not.'
    ].join('\n\n'),
    followups: [
      'When is a value class boxed?',
      'Value class or type alias for a `UserId`?',
      'Why is `===` not allowed on a value class?'
    ],
    related: ['lesson:kt-value-inner', 'q:data-classes'],
    docs: 'https://kotlinlang.org/docs/inline-classes.html'
  });

  Q.push({
    id: 'nested-vs-inner', track: 'classes', weight: 1,
    q: 'What is the difference between a nested and an inner class in Kotlin?',
    keywords: ['nested class', 'inner class', 'inner', 'static nested class', 'this@Outer', 'memory leak', 'outer reference'],
    short: 'A class declared inside another is *nested* by default: Java\'s `static` nested class, with no reference to an outer object. Marked `inner`, it holds a reference to its outer object (reached as `this@Outer`), like a Java inner class, and is made from one: `outer.Inner()`. Kotlin reverses Java\'s default because that hidden reference keeps the outer object alive as long as the inner one lives, a common memory leak.',
    answer: [
      kt(`class Tree(val name: String) {
    class Node(val value: Int)

    inner class Leaf(val value: Int) {
        fun path() = "$name/$value"
    }
}

fun main() {
    val node = Tree.Node(1)
    val tree = Tree("oak")
    val leaf = tree.Leaf(2)
    println(node.value)
    println(leaf.path())
    println(Tree.Node::class.java.declaredFields.map { it.name })
    println(Tree.Leaf::class.java.declaredFields.map { it.name }.sorted())
}`),
      out(`1
oak/2
[value]
[this$0, value]`),
      'Java reflection shows the cost: every `Leaf` carries an extra field, `this$0`, its `Tree`. A `Node` does not.'
    ].join('\n\n'),
    followups: [
      'An inner class has a property with the same name as its outer class\'s: how do you reach the outer one?',
      'Why is Kotlin\'s default the opposite of Java\'s?',
      'Can a nested class see its outer class\'s private members?'
    ],
    related: ['lesson:kt-value-inner'],
    docs: 'https://kotlinlang.org/docs/nested-classes.html'
  });
})(window.KLT);
