/*
 * data/interview-interop.js - interview questions on Idioms, DSLs and Java interop (batch 3): the ★★ and
 * ★ ones. The track's ★★★ question, java-interop, arrived early (data/interview-fast-track.js).
 *
 * The question shape is described at the top of data/interview-basics.js. Every ```kotlin block runs in
 * tests/test_content.py, and an ```output block after one is its exact output. The annotation-target
 * facts were measured on kotlinc 2.4.20 and read on kotlinlang.org (ROADMAP.md, batch 3).
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function norun(code) { return '```kotlin-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function java(code) { return '```java\n' + code + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];

  Q.push({
    id: 'type-safe-builders', track: 'interop', weight: 2,
    q: 'How do Kotlin DSLs (type-safe builders) work?',
    keywords: ['DSL', 'type-safe builder', 'lambda with receiver', 'T.() -> Unit', 'DslMarker', 'Gradle Kotlin DSL', 'Ktor', 'apply', 'builder'],
    short: 'They are ordinary functions taking a *lambda with a receiver*, `block: Html.() -> Unit`: inside the braces `this` is the receiver, so its functions are called without a name, and nesting such calls gives code the shape of what it builds. `@DslMarker` on the builder classes stops an inner block from calling an outer receiver\'s functions by accident. Gradle\'s `build.gradle.kts`, Ktor routing and kotlinx.html are built this way, and the compiler and IDE check them like any code.',
    answer: [
      kt(`@DslMarker
annotation class MenuDsl

@MenuDsl
class Menu(val title: String) {
    private val entries = mutableListOf<String>()
    fun item(name: String, price: Int) {
        entries.add("$name $price")
    }
    fun submenu(title: String, block: Menu.() -> Unit) {
        entries.add(Menu(title).apply(block).render())
    }
    fun render() = "$title[\${entries.joinToString(", ")}]"
}

fun menu(title: String, block: Menu.() -> Unit) = Menu(title).apply(block)

fun main() {
    val m = menu("Cafe") {
        item("tea", 30)
        submenu("Cakes") {
            item("brownie", 90)
            item("muffin", 70)
        }
    }
    println(m.render())
}`),
      out('Cafe[tea 30, Cakes[brownie 90, muffin 70]]'),
      'Three language features make it work: lambdas with receivers, a lambda written after the call\'s brackets, and extension functions (and operators such as `unaryPlus`) declared inside the builder, so they exist only in its blocks.'
    ].join('\n\n'),
    followups: [
      'What is the difference between `(Menu) -> Unit` and `Menu.() -> Unit`?',
      'What would go wrong in this DSL without `@DslMarker`?',
      'How does `apply` relate to a lambda with a receiver?'
    ],
    related: ['lesson:kt-dsls', 'lesson:kt-scope-functions', 'q:scope-functions', 'q:build-functions'],
    docs: 'https://kotlinlang.org/docs/type-safe-builders.html'
  });

  Q.push({
    id: 'sam-conversions', track: 'interop', weight: 2,
    q: 'What is SAM conversion? What is a `fun interface`, and when would you choose it over a function type?',
    keywords: ['SAM', 'SAM conversion', 'single abstract method', 'fun interface', 'functional interface', 'Runnable', 'Comparator', 'function type', 'lambda'],
    short: 'SAM (single abstract method) conversion turns a lambda into an implementation of an interface with one abstract method. Kotlin does it for every such Java interface (`Runnable`, `Comparator`, `Callable`, your Java ones) and for Kotlin interfaces declared `fun interface`. A plain function type, `(String) -> Boolean`, is lighter and usually enough in Kotlin; choose a fun interface when the role deserves a name of its own, needs other (default) members, or will be implemented from Java.',
    answer: [
      kt(`import java.util.concurrent.Callable

fun interface Validator {
    fun validate(s: String): Boolean
    fun and(other: Validator) = Validator { validate(it) && other.validate(it) }
}

fun main() {
    val notBlank = Validator { it.isNotBlank() }
    val short = Validator { it.length < 8 }
    println(notBlank.and(short).validate("kotlin"))
    val task = Callable { "from a Java interface" }
    println(task.call())
    val byLength = listOf("pear", "fig").sortedWith { a, b -> a.length - b.length }
    println(byLength)
}`),
      out(`true
from a Java interface
[fig, pear]`),
      'Without `fun`, `Validator { … }` does not compile: *Interface \'interface Validator : Any\' does not have constructors*. `sortedWith { a, b -> … }` converts the lambda to `java.util.Comparator`. Since Kotlin 1.4, fun interfaces are the way to give Kotlin code the same convenience Java\'s functional interfaces have.'
    ].join('\n\n'),
    followups: [
      'Why does Kotlin not convert lambdas to every Kotlin interface with one method?',
      'Can a fun interface have properties or default methods?',
      'What does a Kotlin function type look like to Java code?'
    ],
    related: ['lesson:kt-fun-interfaces', 'lesson:kt-java-from-kotlin', 'q:higher-order-functions', 'q:java-interop'],
    docs: 'https://kotlinlang.org/docs/fun-interfaces.html'
  });

  Q.push({
    id: 'annotation-targets', track: 'interop', weight: 2,
    q: 'Why did `@NotBlank val email: String` in a Spring Boot controller\'s request class often not validate? What are use-site targets?',
    keywords: ['use-site target', '@field:', '@get:', '@param:', '@property:', 'annotation', 'NotBlank', 'Bean Validation', 'Spring', 'Jackson', 'JPA', 'annotation-default-target'],
    short: 'One Kotlin property in a primary constructor is, for Java, a constructor parameter, a field and a getter, and an annotation lands on only some of them. Before Kotlin 2.2 it went to the first applicable of `param`, `property`, `field`, so a Bean Validation `@NotBlank` landed on the constructor parameter, where Spring\'s validation of the object\'s fields never looked. Use-site targets say where: `@field:NotBlank`, `@get:JsonProperty`, `@param:Value`. Kotlin 2.2 introduced new defaults (the parameter, and the property or else the field); kotlinc 2.4.20 applies them with no option (measured). Writing the target is still the clear, version-proof choice.',
    answer: [
      kt(`@Target(AnnotationTarget.FIELD, AnnotationTarget.VALUE_PARAMETER, AnnotationTarget.FUNCTION, AnnotationTarget.PROPERTY_GETTER)
@Retention(AnnotationRetention.RUNTIME)
annotation class NotBlankLike

class Signup(@NotBlankLike val email: String, @get:NotBlankLike val name: String)

fun main() {
    val c = Signup::class.java
    val ctor = c.constructors.first { !it.isSynthetic }
    println("email, on the parameter: \${ctor.parameterAnnotations[0].any { it is NotBlankLike }}")
    println("email, on the field: \${c.getDeclaredField("email").isAnnotationPresent(NotBlankLike::class.java)}")
    println("name, on the getter: \${c.getMethod("getName").isAnnotationPresent(NotBlankLike::class.java)}")
    println("name, on the field: \${c.getDeclaredField("name").isAnnotationPresent(NotBlankLike::class.java)}")
}`),
      out(`email, on the parameter: true
email, on the field: true
name, on the getter: true
name, on the field: false`),
      '`NotBlankLike` has the targets Jakarta\'s `@NotBlank` has (field, parameter, method). With no target, kotlinc 2.4.20 put it on the parameter *and* the field; `@get:` put it on the getter only. The targets: `@field:`, `@get:`, `@set:`, `@param:`, `@property:` (Kotlin-only: Java reflection cannot see it), `@setparam:`, `@receiver:`, `@delegate:`, `@file:`. The compiler option `-Xannotation-default-target=first-only` brings the old rule back.'
    ].join('\n\n'),
    followups: [
      'Where does `@property:` put an annotation, and who can read it?',
      'Which target would you use for a JPA `@Id` on a constructor property?',
      'How would you find out where an annotation ended up?'
    ],
    related: ['lesson:kt-annotations', 'q:reflection', 'q:java-interop', 'q:final-by-default'],
    docs: 'https://kotlinlang.org/docs/annotations.html#annotation-use-site-targets'
  });

  Q.push({
    id: 'testing-kotlin', track: 'interop', weight: 2,
    q: 'How do you test Kotlin code? What do kotlin.test, JUnit 5 and MockK each do?',
    keywords: ['testing', 'unit test', 'kotlin.test', 'JUnit', 'JUnit 5', 'MockK', 'Mockito', 'assertEquals', 'assertFailsWith', 'backtick names', 'final classes'],
    short: 'On the JVM, Kotlin tests usually run on **JUnit 5** (`useJUnitPlatform()` in Gradle). **kotlin.test** gives Kotlin-friendly assertions (`assertEquals`, `assertFailsWith<T> { }`, `assertIs<T>`) and an `@Test` that maps onto the JUnit in use. For test doubles, **MockK** understands Kotlin: final classes (the default), `object`s, extension functions, coroutines (`coEvery`). Test names can be sentences in backticks.',
    answer: [
      kt(`import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertIs

sealed interface Parsed
data class Num(val value: Int) : Parsed
data class Bad(val reason: String) : Parsed

fun parse(s: String): Parsed = s.toIntOrNull()?.let { Num(it) } ?: Bad("not a number: $s")

fun \`numbers parse\`() = assertEquals(Num(42), parse("42"))
fun \`text is reported\`() = assertEquals("not a number: x", assertIs<Bad>(parse("x")).reason)
fun \`bad input to toInt throws\`() {
    assertFailsWith<NumberFormatException> { "x".toInt() }
}

fun main() {
    for (t in listOf(::\`numbers parse\`, ::\`text is reported\`, ::\`bad input to toInt throws\`)) {
        t()
        println("ok: \${t.name}")
    }
}`),
      out(`ok: numbers parse
ok: text is reported
ok: bad input to toInt throws`),
      '`assertIs<Bad>(…)` checks the type and returns the value as a `Bad`, so `.reason` needs no cast. In a project these functions sit in a class in `src/test/kotlin`, each marked `@Test`. **Mocking:** Mockito mocks final classes only with its inline mock maker (its default since Mockito 5); MockK mocks them too, and also `object`s and top-level functions. Many teams also lean on fakes: an interface and a small in-memory implementation.'
    ].join('\n\n'),
    followups: [
      'Why is mocking harder in Kotlin than in Java, and how do teams deal with it?',
      'How do you test a suspend function?',
      'What does `assertFailsWith` return, and why is that useful?'
    ],
    related: ['lesson:kt-testing', 'q:final-by-default', 'q:sealed-classes'],
    docs: 'https://kotlinlang.org/docs/jvm-test-using-junit.html'
  });

  Q.push({
    id: 'reflection', track: 'interop', weight: 1,
    q: 'What is the difference between `::class` and `::class.java`? What does kotlin-reflect add?',
    keywords: ['reflection', '::class', 'KClass', 'Class', 'javaClass', 'kotlin-reflect', 'memberProperties', 'callable reference', 'simpleName'],
    short: '`Foo::class` is a `KClass`, Kotlin\'s view of the class (it knows about properties, nullability, data classes); `Foo::class.java` is the Java `Class`, which Java APIs take. On a value, `x::class` and `x.javaClass`. Basic features (`simpleName`, function and property references, Java reflection) work out of the box; full Kotlin reflection (`memberProperties`, `findAnnotation`, calling functions by reflection) needs the separate kotlin-reflect library, about 3 MB, so add it only when you need it.',
    answer: [
      kt(`import kotlin.reflect.full.memberProperties

data class Car(val brand: String, val year: Int)

fun main() {
    val car: Any = Car("Tata", 2024)
    println(car::class.simpleName)
    println(car.javaClass.name)
    println(car::class.isData)
    println(Car::class.memberProperties.map { it.name }.sorted())
    val year = Car::year
    println(year(Car("Mahindra", 2021)))
}`),
      out(`Car
Car
true
[brand, year]
2021`),
      '`isData` is something only Kotlin\'s `KClass` knows. Frameworks such as Spring and Jackson\'s Kotlin module use kotlin-reflect to read constructor parameter names, default values and nullability.'
    ].join('\n\n'),
    followups: [
      'When must you pass `::class.java` instead of `::class`?',
      'Why is kotlin-reflect a separate library?',
      'How do you get the `KClass` of a generic type parameter?'
    ],
    related: ['lesson:kt-annotations', 'q:annotation-targets', 'q:reified'],
    docs: 'https://kotlinlang.org/docs/reflection.html'
  });

  Q.push({
    id: 'build-functions', track: 'interop', weight: 1,
    q: 'What are `buildList`, `buildString` and `buildMap`, and why use them?',
    keywords: ['buildList', 'buildString', 'buildMap', 'buildSet', 'builder', 'StringBuilder', 'read-only', 'collection builder'],
    short: 'Each takes a lambda that runs on a fresh mutable builder (a `MutableList`, a `StringBuilder`, a `MutableMap`) and returns the finished read-only result. You fill it with loops and conditions inside the block; outside, nothing can change it, and the whole thing is one expression that fits `= buildList { … }`. They replace "make a mutable list, fill it, return it" and `StringBuilder` boilerplate.',
    answer: [
      kt(`fun csvLine(fields: List<String?>): String = buildString {
    for ((i, f) in fields.withIndex()) {
        if (i > 0) append(',')
        append(f ?: "")
    }
}

fun main() {
    println(csvLine(listOf("a", null, "c")))
    val odds = buildList {
        for (i in 1..9) if (i % 2 == 1) add(i)
        add(size)
    }
    println(odds)
}`),
      out(`a,,c
[1, 3, 5, 7, 9, 5]`),
      'Inside the block `this` is the builder, so `size` (here 5, before the last `add`) and other members work as you go. For a fixed set of items, `listOf(…)` is simpler; for joining with separators, `joinToString`.'
    ].join('\n\n'),
    followups: [
      'What type does `buildList` return, and can the caller add to it?',
      'How is `buildString { }` different from `StringBuilder().apply { }.toString()`?',
      'When would you use `joinToString` instead?'
    ],
    related: ['lesson:kt-build-functions', 'q:read-only-collections', 'q:type-safe-builders'],
    docs: 'https://kotlinlang.org/docs/constructing-collections.html'
  });
})(window.KLT);
