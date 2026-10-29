/*
 * data/lessons-interop.js - Track 5, Idioms, DSLs and Java interop: seven lessons (batch 3).
 *
 * The lesson shape is described at the top of data/lessons-basics.js, with two additions used here:
 *   files: [{name, code}]   Java files compiled with the example's or the challenge's Kotlin (shown read-only
 *                           above the editor). kotlinc reads them, so Kotlin can call them; javac then
 *                           compiles them against Kotlin's classes, so they can call Kotlin.
 *   {label, java}           a check written in Java: statements using c.eq() and c.ok(), compiled by javac
 *                           against the learner's Kotlin. It fails alone, with javac's message, until the
 *                           Kotlin it calls is visible to Java (ktlearn.py, "JAVA").
 * Every ```kotlin block runs in tests/test_content.py (without the files), and an ```output block after one
 * is its exact output. Code is in template literals: a Kotlin ${…} is \${…}, a "\n" is "\\n".
 */
(function (U) {
  'use strict';
  function kt(code) { return '```kotlin\n' + code + '\n```'; }
  function norun(code) { return '```kotlin-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function java(code) { return '```java\n' + code + '\n```'; }
  function text(t) { return '```text\n' + t + '\n```'; }
  var L = U.data.lessons = U.data.lessons || [];

  var GREETER = `public class Greeter {
    private String greeting = "Hello";
    private boolean loud;

    public String getGreeting() { return greeting; }
    public void setGreeting(String greeting) { this.greeting = greeting; }

    public boolean isLoud() { return loud; }
    public void setLoud(boolean loud) { this.loud = loud; }

    public String greet(String name) {
        String text = greeting + ", " + name;
        return loud ? text.toUpperCase() + "!" : text;
    }

    /** The nickname, or null when there is none. */
    public static String nicknameOf(String name) {
        return name.equals("Robert") ? "Bob" : null;
    }
}`;

  var INVENTORY = `import java.util.ArrayList;
import java.util.List;

public class Inventory {
    private final List<String> items = new ArrayList<>();
    private String owner;

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }

    public boolean isEmpty() { return items.isEmpty(); }
    public void add(String item) { items.add(item); }
    public int count() { return items.size(); }

    /** The item at the index, or null when there is none. */
    public String find(int index) {
        return index >= 0 && index < items.size() ? items.get(index) : null;
    }

    /** Calls the visitor once with each item. */
    public void forEachItem(ItemVisitor visitor) {
        for (String item : items) visitor.visit(item);
    }
}`;

  var ITEM_VISITOR = `public interface ItemVisitor {
    void visit(String item);
}`;

  var CALLER = `public class Caller {
    public static String run() {
        Config a = new Config("db");          // a one-argument constructor: @JvmOverloads made it
        Config b = Config.local();            // a static method: @JvmStatic made it
        String v = Config.VERSION;            // a static constant: const val made it
        return a.getHost() + ":" + a.getPort() + ", " + b.getHost() + ", v" + v;
    }
}`;

  /* ---------------------------------------------------------------- 1 */
  L.push({
    id: 'kt-java-from-kotlin', track: 'interop', title: 'Calling Java from Kotlin',
    summary: 'Java classes work in Kotlin as they are: getters and setters become properties, a lambda passes where Java wants a one-method interface, and every value from Java has a platform type you should pin down.',
    keywords: ['java interop', 'calling java', 'getter', 'setter', 'property syntax', 'platform type', 'SAM conversion', 'Runnable', 'checked exceptions', 'keyword names', 'backticks', 'java library'],
    docs: 'https://kotlinlang.org/docs/java-interop.html',
    body: [
      '## Java classes are just there',
      'Kotlin compiles to JVM bytecode and calls Java classes directly: the JDK, any Java library, and Java files in the same project. Import them as in Java (no `new`):',
      kt(`import java.time.LocalDate
import java.util.ArrayDeque

fun main() {
    val date = LocalDate.of(2026, 10, 16)
    println(date.dayOfWeek)
    println(date.plusDays(20).month)
    val queue = ArrayDeque<String>()
    queue.add("first")
    queue.add("second")
    println(queue.poll())
    println(queue.size)
}`),
      out(`FRIDAY
NOVEMBER
first
1`),
      '## Getters and setters become properties',
      'A Java `getName()` is read as `name`, `setName(x)` is written as `name = x`, and a boolean `isDaemon()` keeps its name, `isDaemon`. A Java method that is not a getter stays a method: `count()` is still `count()`.',
      kt(`fun main() {
    val t = Thread { }
    t.name = "worker-1"
    t.isDaemon = true
    println(t.name)
    println(t.isDaemon)
    val file = java.io.File("notes.txt")
    println(file.name)
    println(file.isAbsolute)
}`),
      out(`worker-1
true
notes.txt
false`),
      '## Values from Java: pin the type down',
      'Java does not say which methods may return null, so a value from Java has a *platform type* ([[lesson:kt-type-aliases]]): Kotlin lets you use it as nullable or not, and a wrong guess throws on the line where you made it. Declare the type you expect as the value arrives:',
      kt(`fun main() {
    val props = java.util.Properties()
    props.setProperty("host", "db.local")
    val host: String? = props.getProperty("host")
    val port: String? = props.getProperty("port")
    println(host ?: "no host")
    println(port ?: "no port")
    println(port?.toInt() ?: 5432)
}`),
      out(`db.local
no port
5432`),
      '## A lambda where Java wants an interface',
      'Where a Java method takes an interface with one abstract method (`Runnable`, `Comparator`, `Callable`, your own), you pass a Kotlin lambda: a *SAM conversion* (single abstract method). The interface\'s name in front of the lambda makes one when there is no parameter to convert for:',
      kt(`import java.util.concurrent.Executors

fun main() {
    val byLength = Comparator<String> { a, b -> a.length - b.length }
    println(listOf("pear", "fig", "banana").sortedWith(byLength))
    val pool = Executors.newSingleThreadExecutor()
    val future = pool.submit<Int> { 6 * 7 }
    println(future.get())
    pool.shutdown()
    val r = Runnable { println("running") }
    r.run()
}`),
      out(`[fig, pear, banana]
42
running`),
      '## Checked exceptions are not checked',
      'Java\'s `readText` can throw `IOException`, a checked exception, but Kotlin does not make you catch or declare it ([[lesson:kt-exceptions]]). Catch it where you can do something about it:',
      kt(`import java.io.File
import java.io.FileNotFoundException

fun main() {
    try {
        File("does-not-exist.txt").readText()
    } catch (e: FileNotFoundException) {
        println("caught: \${e::class.simpleName}")
    }
}`),
      out('caught: FileNotFoundException'),
      '## Java names that are Kotlin keywords',
      'A Java member called `in`, `is`, `object` or `when` is written in backticks. The best known is `System.in`, and Mockito\'s `when(…)`:',
      kt(`fun main() {
    val input = System.\`in\`
    println(input.available() >= 0)
}`),
      out('true')
    ].join('\n\n'),
    java: [
      'The example and the challenge here compile a real Java file with your Kotlin. This is `Greeter.java`, and what Kotlin makes of it:',
      java(GREETER),
      '| In Java | From Kotlin |\n|---|---|\n| `new Greeter()` | `Greeter()` |\n| `g.getGreeting()`, `g.setGreeting("Hi")` | `g.greeting`, `g.greeting = "Hi"` |\n| `g.isLoud()`, `g.setLoud(true)` | `g.isLoud`, `g.isLoud = true` |\n| `Greeter.nicknameOf("Ravi")` (may return null) | `Greeter.nicknameOf("Ravi")`, a `String!`: declare it `String?` |'
    ].join('\n\n'),
    example: {
      files: [{ name: 'Greeter.java', code: GREETER }],
      code: `fun main() {
    val g = Greeter()
    println(g.greet("Asha"))
    g.greeting = "Hi"
    g.isLoud = true
    println(g.greet("Ravi"))
    val nick: String? = Greeter.nicknameOf("Ravi")
    println(nick ?: "no nickname")
}`,
      note: '`Greeter.java` above is compiled with your code. Change `val nick: String?` to `val nick: String` and run: Kotlin checks the value from Java at once, and throws on that line.'
    },
    challenge: {
      title: 'Drive a Java class',
      files: [{ name: 'Inventory.java', code: INVENTORY }, { name: 'ItemVisitor.java', code: ITEM_VISITOR }],
      task: '`Inventory.java` and `ItemVisitor.java` (above the editor) are Java. Use them from Kotlin, the Kotlin way:\n\n1. `stock(owner, items)`: a new `Inventory` whose owner is `owner`, holding the items. Set the owner with property syntax (`inv.owner = …`), not `setOwner`.\n2. `describe(inv)`: `"<owner>: <n> items"`, or `"<owner>: empty"` when it is empty (Java\'s `isEmpty()`). An owner never set is null: say `"nobody"`.\n3. `itemAt(inv, index)`: the item, or `"none"`. Java\'s `find` returns null when there is no such item, and the code given trusts it never to.\n4. `upperItems(inv)`: every item upper-cased, collected by passing a lambda to `forEachItem`.',
      starter: `fun stock(owner: String, items: List<String>): Inventory {
    val inv = Inventory()
    inv.setOwner(owner)
    TODO("add each item, and use property syntax for the owner")
}

fun describe(inv: Inventory): String = TODO("\\"<owner>: <n> items\\", or \\"<owner>: empty\\"; an owner never set is null: \\"nobody\\"")

fun itemAt(inv: Inventory, index: Int): String {
    val item: String = inv.find(index)        // find returns null when there is no such item
    return item
}

fun upperItems(inv: Inventory): List<String> = TODO("forEachItem, with a lambda")

fun main() {
    println(describe(stock("Asha", listOf("pen", "ink"))))
}`,
      solution: `fun stock(owner: String, items: List<String>): Inventory {
    val inv = Inventory()
    inv.owner = owner
    for (item in items) inv.add(item)
    return inv
}

fun describe(inv: Inventory): String {
    val who = inv.owner ?: "nobody"
    return if (inv.isEmpty) "$who: empty" else "$who: \${inv.count()} items"
}

fun itemAt(inv: Inventory, index: Int): String = inv.find(index) ?: "none"

fun upperItems(inv: Inventory): List<String> {
    val found = mutableListOf<String>()
    inv.forEachItem { item -> found.add(item.uppercase()) }
    return found
}

fun main() {
    val inv = stock("Asha", listOf("pen", "ink"))
    println(describe(inv))
    println(itemAt(inv, 5))
    println(upperItems(inv))
}`,
      hints: [
        '`getOwner()`/`setOwner()` are the property `owner`, and `isEmpty()` is the property `isEmpty`. `count()` is not a getter, so it stays a call.',
        '`inv.owner` and `inv.find(index)` are platform types: `inv.find(index) ?: "none"` handles the null.',
        '`ItemVisitor` has one method, so a lambda converts: `inv.forEachItem { item -> … }`.'
      ],
      checks: [
        { label: '`stock` sets the owner and adds the items', code: 'val inv = stock("Asha", listOf("pen", "ink"))\neq(inv.owner, "Asha")\neq(inv.count(), 2)\neq(inv.find(1), "ink")' },
        { label: '`describe`: items, empty, and an owner never set', code: 'eq(describe(stock("Asha", listOf("pen", "ink"))), "Asha: 2 items")\neq(describe(stock("Li", listOf())), "Li: empty")\neq(describe(Inventory()), "nobody: empty")' },
        { label: '`itemAt` gives `none` when Java\'s `find` returns null', code: 'val inv = stock("Asha", listOf("pen", "ink"))\neq(itemAt(inv, 1), "ink")\neq(itemAt(inv, 5), "none")\neq(itemAt(inv, -1), "none")' },
        { label: '`upperItems` collects through `forEachItem`', code: 'eq(upperItems(stock("Asha", listOf("pen", "ink"))), listOf("PEN", "INK"))\neq(upperItems(Inventory()), listOf<String>())' },
        { label: 'Property syntax, and a lambda for `forEachItem`', code: 'ok(!uses("""\\.(setOwner|getOwner|isEmpty)\\s*\\("""), "use the properties: inv.owner = …, inv.owner, inv.isEmpty")\nok(uses("""forEachItem\\s*\\{"""), "pass forEachItem a lambda: inv.forEachItem { item -> … }")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'kt-kotlin-from-java', track: 'interop', title: 'Calling Kotlin from Java (the @Jvm annotations)',
    summary: 'What Java sees of your Kotlin: the MainKt class, properties as getters, companions as Companion; and the annotations that make it look like Java: @JvmStatic, @JvmOverloads, @JvmField, @file:JvmName, @Throws and @JvmName.',
    keywords: ['JvmStatic', 'JvmOverloads', 'JvmField', 'JvmName', 'file:JvmName', 'Throws', 'MainKt', 'Companion', 'calling kotlin from java', 'java interop', 'static', 'default arguments'],
    docs: 'https://kotlinlang.org/docs/java-to-kotlin-interop.html',
    body: [
      '## What Java sees',
      'Kotlin compiles to ordinary classes, so Java can call everything. But a few Kotlin features have no Java form, and Java sees them as they are compiled:',
      '| Kotlin | Java sees |\n|---|---|\n| `val host: String` in a class | a private field and `getHost()` (`setHost` for a `var`) |\n| top-level `fun greet()` in `main.kt` | `MainKt.greet()` |\n| `companion object { fun local() }` | `Config.Companion.local()` |\n| `fun connect(port: Int = 80)` | only `connect(int)`: Java has no default arguments |\n| `fun String.shout()` | `MainKt.shout(String)`, the receiver first |\n| `object Registry` | `Registry.INSTANCE` |',
      'The `@Jvm…` annotations change that, so the Java side reads like Java. Here Java reflection shows what each one did:',
      kt(`import java.lang.reflect.Modifier

class Config @JvmOverloads constructor(val host: String, val port: Int = 8080) {
    companion object {
        @JvmStatic fun local() = Config("localhost")
        fun remote() = Config("example.com", 443)
        const val VERSION = "1.0"
        @JvmField val DEFAULT = Config("default")
    }
}

fun main() {
    val c = Config::class.java
    println(c.constructors.filter { !it.isSynthetic }.map { it.parameterCount }.sorted())
    println(Modifier.isStatic(c.getMethod("local").modifiers))
    println(runCatching { c.getMethod("remote") }.isSuccess)
    println(Modifier.isStatic(c.getField("VERSION").modifiers))
    println(Modifier.isStatic(c.getField("DEFAULT").modifiers))
}`),
      out(`[1, 2]
true
false
true
true`),
      '- `@JvmOverloads` wrote a Java constructor for each default argument, dropping them from the right: `Config(String)` and `Config(String, int)`.\n- `@JvmStatic` put `local()` on `Config` itself, static, so Java writes `Config.local()`. `remote()`, without it, exists only as `Config.Companion.remote()`.\n- `const val` and `@JvmField` made public static fields: `Config.VERSION`, `Config.DEFAULT`. Without them Java would call `Config.Companion.getDEFAULT()`.',
      '## Top-level functions: the file\'s class',
      'Top-level functions go into a class named after the file (`MainKt` for `main.kt`). `@file:JvmName` renames it, at the very top of the file:',
      kt(`@file:JvmName("TextUtils")

fun shout(s: String) = s.uppercase() + "!"

fun main() {
    val facade = Class.forName("TextUtils")
    println(facade.getMethod("shout", String::class.java).invoke(null, "hi"))
}`),
      out('HI!'),
      'Java now calls `TextUtils.shout("hi")`. An extension function arrives the same way, its receiver as the first parameter: `fun String.shout()` is `TextUtils.shout(String)` too.',
      '## @Throws: exceptions Java must catch',
      'Kotlin has no checked exceptions, so a Kotlin function declares none, and Java code calling it cannot even write `catch (IOException e)` (javac refuses to catch a checked exception that nothing in the `try` declares). `@Throws` adds the `throws` clause:',
      kt(`import java.io.IOException

@Throws(IOException::class)
fun load(path: String): String = throw IOException("cannot read $path")

fun main() {
    val m = Class.forName("MainKt").getMethod("load", String::class.java)
    println(m.exceptionTypes.map { it.simpleName })
}`),
      out('[IOException]'),
      '## @JvmName: when two functions clash',
      'Type arguments are erased, so `count(List<String>)` and `count(List<Int>)` compile to the same JVM method, and the compiler refuses: *Platform declaration clash: The following declarations have the same JVM signature (count(Ljava/util/List;)I)*. Kotlin can still tell them apart; give each a JVM name:',
      kt(`@JvmName("countWords")
fun count(xs: List<String>) = xs.size

@JvmName("countNumbers")
fun count(xs: List<Int>) = xs.size

fun main() {
    println(count(listOf("a", "b")))
    println(count(listOf(1, 2, 3)))
}`),
      out(`2
3`),
      '## Null from Java into Kotlin',
      'Kotlin checks the parameters of a public function: a Java caller that passes null where Kotlin said `String` gets a `NullPointerException` at once, naming the parameter, rather than somewhere deep inside:',
      kt(`fun greet(name: String) = "Hello, $name"

fun main() {
    val m = Class.forName("MainKt").getMethod("greet", String::class.java)
    try {
        m.invoke(null, *arrayOf<Any?>(null))
    } catch (e: java.lang.reflect.InvocationTargetException) {
        println(e.targetException.message)
    }
}`),
      out('Parameter specified as non-null is null: method MainKt.greet, parameter name')
    ].join('\n\n'),
    java: [
      'The example compiles this Java file with your Kotlin; it calls the Kotlin as Java code would:',
      java(CALLER),
      'Every line of it needs one of the annotations. Take one away, and javac (not Kotlin) reports the line: `Caller.java:4:26: error: cannot find symbol`. That is what the challenge\'s checks do: they are Java, compiled against your Kotlin.'
    ].join('\n\n'),
    example: {
      files: [{ name: 'Caller.java', code: CALLER }],
      code: `class Config @JvmOverloads constructor(val host: String, val port: Int = 8080) {
    companion object {
        @JvmStatic fun local() = Config("localhost")
        const val VERSION = "1.0"
    }
}

fun main() {
    println(Caller.run())
}`,
      note: '`Caller.java` is Java calling your Kotlin. Remove `@JvmStatic` and run: javac reports the line of `Caller.java` that can no longer compile. Then remove `@JvmOverloads`.'
    },
    challenge: {
      title: 'Make it Java-friendly',
      task: 'The Kotlin below works from Kotlin. Its checks are **Java code**, calling it the way a Java colleague would, and none of them compile yet. Add what each needs:\n\n1. Java calls `Temperature.fromFahrenheit(212.0)`: a static method.\n2. Java reads `Temperature.FREEZING`: a static field.\n3. Java reads `Temperature.UNIT`, the string `"C"`: a constant.\n4. Java calls `new Report("Q3")` and `new Report("Q3", 5)`: constructors for the default arguments.\n5. Java calls `Temperatures.format(t)`: the file\'s top-level functions, in a class called `Temperatures`.\n\nAnd it must still work from Kotlin.',
      starter: `class Temperature(val celsius: Double) {
    companion object {
        fun fromFahrenheit(f: Double) = Temperature((f - 32) * 5 / 9)
        val FREEZING = Temperature(0.0)
        val UNIT = "C"
    }
}

class Report(val title: String, val pages: Int = 1, val draft: Boolean = false)

fun format(t: Temperature): String = "%.1f°C".format(t.celsius)

fun main() {
    println(format(Temperature.fromFahrenheit(212.0)))
    println(Report("Q3").pages)
}`,
      solution: `@file:JvmName("Temperatures")

class Temperature(val celsius: Double) {
    companion object {
        @JvmStatic fun fromFahrenheit(f: Double) = Temperature((f - 32) * 5 / 9)
        @JvmField val FREEZING = Temperature(0.0)
        const val UNIT = "C"
    }
}

class Report @JvmOverloads constructor(val title: String, val pages: Int = 1, val draft: Boolean = false)

fun format(t: Temperature): String = "%.1f°C".format(t.celsius)

fun main() {
    println(format(Temperature.fromFahrenheit(212.0)))
    println(Report("Q3").pages)
}`,
      hints: [
        'A failing check shows javac\'s message. `cannot find symbol … method fromFahrenheit` means Java looks for a static method on `Temperature`: `@JvmStatic`.',
        '`@JvmField val FREEZING` is a static field; `const val UNIT = "C"` is a constant. A constructor gets Java overloads with `class Report @JvmOverloads constructor(…)`.',
        '`@file:JvmName("Temperatures")` goes on the first line of the file, before everything else.'
      ],
      checks: [
        { label: 'Java: `Temperature.fromFahrenheit(212.0)`, a static method', java: 'c.eq(Temperature.fromFahrenheit(212.0).getCelsius(), 100.0);' },
        { label: 'Java: `Temperature.FREEZING`, a static field', java: 'c.eq(Temperature.FREEZING.getCelsius(), 0.0);' },
        { label: 'Java: `Temperature.UNIT` is `"C"`', java: 'c.eq(Temperature.UNIT, "C");' },
        { label: 'Java: `new Report("Notes")` and `new Report("Q3", 5)`', java: 'c.eq(new Report("Notes").getPages(), 1);\nReport r = new Report("Q3", 5);\nc.eq(r.getPages(), 5);\nc.eq(r.getDraft(), false);' },
        { label: 'Java: `Temperatures.format(t)`', java: 'c.eq(Temperatures.format(new Temperature(21.5)), "21.5°C");' },
        { label: 'Kotlin still calls it all the Kotlin way', code: 'eq(Temperature.fromFahrenheit(32.0).celsius, 0.0)\neq(Temperature.FREEZING.celsius, 0.0)\neq(Temperature.UNIT, "C")\neq(Report("x").pages, 1)\neq(format(Temperature(-3.25)), "-3.3°C")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'kt-dsls', track: 'interop', title: 'Builders and type-safe DSLs',
    summary: 'A lambda with a receiver (T.() -> Unit) makes this inside the braces a T, which is how Kotlin builds nested, checked structures that read like a small language: HTML, Gradle builds, routes. @DslMarker keeps the levels apart.',
    keywords: ['DSL', 'type-safe builder', 'builder', 'lambda with receiver', 'receiver', 'T.() -> Unit', 'DslMarker', 'Gradle Kotlin DSL', 'kotlinx.html', 'apply', 'unaryPlus'],
    docs: 'https://kotlinlang.org/docs/type-safe-builders.html',
    body: [
      '## Lambdas with receivers',
      'A parameter of type `StringBuilder.() -> Unit` is a lambda that runs *on* a `StringBuilder`: inside it, `this` is that builder, so its members are called without naming it:',
      kt(`fun buildGreeting(block: StringBuilder.() -> Unit): String {
    val sb = StringBuilder()
    sb.block()
    return sb.toString()
}

fun main() {
    val text = buildGreeting {
        append("Hello, ")
        append("Kotlin")
        append('!')
    }
    println(text)
}`),
      out('Hello, Kotlin!'),
      '`sb.block()` calls the lambda with `sb` as its receiver. This is how the standard library\'s `apply`, `with` and `buildString` work ([[lesson:kt-scope-functions]]).',
      '## A small HTML builder',
      'Nest such lambdas, and the code takes the shape of what it builds. Each function makes a child, runs the block on it, and keeps it:',
      kt(`class Tag(val name: String) {
    private val children = mutableListOf<Tag>()
    private var text = ""

    fun tag(name: String, block: Tag.() -> Unit = {}): Tag {
        val t = Tag(name)
        t.block()
        children.add(t)
        return t
    }

    operator fun String.unaryPlus() {
        text += this
    }

    fun render(): String = "<$name>$text\${children.joinToString("") { it.render() }}</$name>"
}

fun html(block: Tag.() -> Unit): Tag = Tag("html").apply(block)

fun main() {
    val page = html {
        tag("head") { tag("title") { +"Shop" } }
        tag("body") {
            tag("h1") { +"Welcome" }
            tag("p") { +"Two items" }
        }
    }
    println(page.render())
}`),
      out('<html><head><title>Shop</title></head><body><h1>Welcome</h1><p>Two items</p></body></html>'),
      '`+"Shop"` is the `unaryPlus` operator ([[lesson:kt-operators]]), declared as an extension *inside* `Tag`, so it exists only within a tag\'s block. A real HTML DSL (kotlinx.html) gives each tag its own function, `head { }`, `body { }`, `p { }`, and allows only valid children in each.',
      '## @DslMarker: keep the levels apart',
      'Inside nested blocks, every outer receiver is in scope too. So inside a `row { }` of a table you could call the *table\'s* `row()` by mistake, and make a row in the wrong place. Mark the builder classes with an annotation that is itself marked `@DslMarker`, and the compiler allows only the innermost receiver\'s members without a name:',
      kt(`@DslMarker
annotation class TableDsl

@TableDsl
class Table {
    val rows = mutableListOf<Row>()
    fun row(block: Row.() -> Unit) {
        rows.add(Row().apply(block))
    }
}

@TableDsl
class Row {
    val cells = mutableListOf<String>()
    fun cell(text: String) {
        cells.add(text)
    }
}

fun table(block: Table.() -> Unit) = Table().apply(block)

fun main() {
    val t = table {
        row {
            cell("a")
            cell("b")
        }
        row { cell("c") }
    }
    println(t.rows.map { it.cells })
}`),
      out('[[a, b], [c]]'),
      'Now `row { row { } }` does not compile: *\'fun row(block: Row.() -> Unit): Unit\' cannot be called in this context with an implicit receiver. Use an explicit receiver if necessary.*',
      '## DSLs you will meet',
      'Gradle\'s `build.gradle.kts` is one (`dependencies { implementation("…") }`), and so are Ktor\'s routing (`routing { get("/") { … } }`), Spring\'s bean and router DSLs, and kotlinx.html. They are ordinary Kotlin: functions taking lambdas with receivers, which the IDE completes and the compiler checks.'
    ].join('\n\n'),
    java: [
      java(`String page = new Html.Builder()
    .head(new Head.Builder().title("Shop").build())
    .body(new Body.Builder()
        .h1("Welcome")
        .p("Two items")
        .build())
    .build();`),
      'A Java builder chains calls and nests by building each part separately. A Kotlin DSL nests blocks, so the code has the shape of the result, each block can hold loops and `if`s, and `@DslMarker` makes misplaced calls compile errors.'
    ].join('\n\n'),
    example: {
      code: `class ShoppingList {
    val items = mutableListOf<String>()
    fun item(name: String, qty: Int = 1) {
        items.add("$qty x $name")
    }
}

fun shopping(block: ShoppingList.() -> Unit): List<String> = ShoppingList().apply(block).items

fun main() {
    val list = shopping {
        item("milk", 2)
        item("bread")
        for (fruit in listOf("apple", "pear")) item(fruit, 3)
    }
    println(list)
}`,
      note: 'Inside `shopping { }`, `this` is a `ShoppingList`. Add a function `fun note(text: String)` to it and call it in the block.'
    },
    challenge: {
      title: 'A routing DSL',
      task: 'Finish a tiny web-routing DSL. `router { … }` makes a `Router` and runs the block on it; inside:\n\n- `get(path, handler)` adds `"GET <prefix><path> -> <handler>"` to `routes`, and `post(path, handler)` adds `"POST …"`;\n- `group(prefix) { … }` runs its block on a router whose prefix is the current prefix plus `prefix`, adding to the **same** list of routes. Groups can nest.\n\nRoutes keep the order they were declared in.',
      starter: `class Router(private val prefix: String = "", val routes: MutableList<String> = mutableListOf()) {
    fun get(path: String, handler: String) {
        TODO("add \\"GET <prefix><path> -> <handler>\\" to routes")
    }
    // post(path, handler) and group(prefix, block) go here
}

fun router(block: Router.() -> Unit): Router = TODO("a Router, with block run on it")

fun main() {
    val r = router {
        get("/", "home")
    }
    println(r.routes)
}`,
      solution: `class Router(private val prefix: String = "", val routes: MutableList<String> = mutableListOf()) {
    fun get(path: String, handler: String) {
        routes.add("GET $prefix$path -> $handler")
    }

    fun post(path: String, handler: String) {
        routes.add("POST $prefix$path -> $handler")
    }

    fun group(prefix: String, block: Router.() -> Unit) {
        Router(this.prefix + prefix, routes).block()
    }
}

fun router(block: Router.() -> Unit): Router = Router().apply(block)

fun main() {
    val r = router {
        get("/", "home")
        group("/api") {
            get("/items", "listItems")
            post("/items", "addItem")
        }
    }
    r.routes.forEach { println(it) }
}`,
      hints: [
        '`router` is `Router().apply(block)`: `apply` runs the block with the router as `this`, and returns it.',
        'A group is another `Router`, with the longer prefix and the same list: `Router(this.prefix + prefix, routes).block()`. (`this.prefix` is the router\'s own; `prefix` alone is the parameter.)'
      ],
      checks: [
        { label: '`get` adds a route', code: 'eq(router { get("/", "home") }.routes, listOf("GET / -> home"))' },
        { label: '`post` adds a POST route', code: 'eq(router { post("/users", "createUser") }.routes, listOf("POST /users -> createUser"))' },
        { label: 'A group adds its prefix to the routes inside it', code: 'eq(router { group("/api") { get("/items", "list"); post("/items", "add") } }.routes, listOf("GET /api/items -> list", "POST /api/items -> add"))' },
        { label: 'Nested groups, and routes in the order they were declared', code: 'val r = router {\n    get("/", "home")\n    group("/api") { group("/v1") { get("/ping", "ping") } }\n    get("/about", "about")\n}\neq(r.routes, listOf("GET / -> home", "GET /api/v1/ping -> ping", "GET /about -> about"))' },
        { label: 'The blocks are lambdas with a receiver: `Router.() -> Unit`', code: 'ok(Regex("""Router\\s*\\.\\s*\\(\\s*\\)\\s*->\\s*Unit""").findAll(code).count() >= 2, "take each block as Router.() -> Unit, in router and in group")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'kt-build-functions', track: 'interop', title: 'buildList, buildString and buildMap',
    summary: 'buildString, buildList, buildSet and buildMap give you a mutable builder inside a block and a read-only result outside it: the StringBuilder and new ArrayList<>() patterns as one expression.',
    keywords: ['buildList', 'buildString', 'buildMap', 'buildSet', 'builder', 'StringBuilder', 'apply', 'read-only', 'collection builder', 'appendLine'],
    docs: 'https://kotlinlang.org/docs/constructing-collections.html',
    body: [
      '## buildString',
      'The block runs on a fresh `StringBuilder`; the result is the finished `String`:',
      kt(`fun main() {
    val n = 5
    val s = buildString {
        append("Countdown:")
        for (i in n downTo 1) append(" $i")
        appendLine()
        append("liftoff")
    }
    println(s)
}`),
      out(`Countdown: 5 4 3 2 1
liftoff`),
      '## buildList, buildSet, buildMap',
      'Inside the block you have a `MutableList` (or set, or map) to fill with loops and conditions; what comes out is read-only. The element type is worked out from what you add:',
      kt(`fun main() {
    val evens = buildList {
        for (i in 1..10) if (i % 2 == 0) add(i)
        add(0, -2)
    }
    println(evens)
    val initials = buildSet {
        for (name in listOf("Asha", "Arun", "Ravi")) add(name.first())
    }
    println(initials)
    val lengths = buildMap {
        for (w in listOf("kotlin", "java")) put(w, w.length)
        putIfAbsent("java", 0)
    }
    println(lengths)
}`),
      out(`[-2, 2, 4, 6, 8, 10]
[A, R]
{kotlin=6, java=4}`),
      'Compared with `val xs = mutableListOf<Int>()` followed by a loop and `return xs`, the builder keeps the mutable list inside the block: nothing outside can add to it later, and the whole thing is one expression, so it fits in `= buildList { … }`. Inside the block, `this` is the list, so `size`, `contains` and `last()` all work as you go.',
      '## apply, the builder for objects',
      'For an object with properties to set, `apply` is the builder ([[lesson:kt-scope-functions]]): it runs the block on the object and returns the object.',
      kt(`class Request {
    var url = ""
    var method = "GET"
    val headers = mutableMapOf<String, String>()
}

fun main() {
    val r = Request().apply {
        url = "https://example.com/api"
        method = "POST"
        headers["Accept"] = "application/json"
    }
    println("\${r.method} \${r.url} \${r.headers}")
}`),
      out('POST https://example.com/api {Accept=application/json}'),
      '## joinToString or buildString?',
      'To join a list with separators, `joinToString(", ", prefix = "[", postfix = "]")` says it in one call. `buildString` is for text built in steps: lines, conditions, padding. Each takes a size hint for long text: `buildString(capacity = 4096) { … }`, as Java\'s `new StringBuilder(4096)`.'
    ].join('\n\n'),
    java: [
      java(`StringBuilder sb = new StringBuilder();
sb.append("Countdown:");
for (int i = n; i >= 1; i--) sb.append(" ").append(i);
String s = sb.toString();

List<Integer> evens = new ArrayList<>();
for (int i = 1; i <= 10; i++) if (i % 2 == 0) evens.add(i);
List<Integer> result = List.copyOf(evens);     // read-only, from here on`),
      'The same steps, with the builder variable named and visible to the rest of the method, and the read-only copy made by hand. Kotlin\'s builder functions scope the mutable part to the block.'
    ].join('\n\n'),
    example: {
      code: `fun receipt(items: Map<String, Int>): String = buildString {
    appendLine("RECEIPT")
    for ((name, price) in items) appendLine(name.padEnd(8) + price.toString().padStart(5))
    append("TOTAL   " + items.values.sum().toString().padStart(5))
}

fun main() {
    println(receipt(mapOf("tea" to 30, "cake" to 120)))
    val squares = buildList { for (i in 1..5) add(i * i) }
    println(squares)
}`,
      note: 'Add an item to the map and run. Then try `squares.add(36)` after the builder: it does not compile, because the result is a read-only `List`.'
    },
    challenge: {
      title: 'Build it in one expression',
      task: 'Write each function as one builder expression:\n\n1. `table(n)` with `buildString`: the lines `"<n> x <i> = <n*i>"` for i from 1 to 3, separated by line breaks, with **no** line break at the end.\n2. `primesBelow(limit)` with `buildList`: every prime number below `limit`, in order (a prime is 2 or more and divisible only by 1 and itself).\n3. `wordCounts(text)` with `buildMap`: how often each word appears, words being split by spaces and counted in lower case. An empty text gives an empty map.',
      starter: `fun table(n: Int): String = TODO("buildString: \\"n x i = n*i\\" for i in 1..3, one per line, no line break at the end")

fun primesBelow(limit: Int): List<Int> = TODO("buildList: every prime below limit")

fun wordCounts(text: String): Map<String, Int> = TODO("buildMap: how often each lower-case word appears")

fun main() {
    println(table(3))
}`,
      solution: `fun table(n: Int): String = buildString {
    for (i in 1..3) {
        if (i > 1) append('\\n')
        append("$n x $i = \${n * i}")
    }
}

fun isPrime(n: Int): Boolean = n >= 2 && (2 until n).none { n % it == 0 }

fun primesBelow(limit: Int): List<Int> = buildList {
    for (n in 2 until limit) if (isPrime(n)) add(n)
}

fun wordCounts(text: String): Map<String, Int> = buildMap {
    for (word in text.lowercase().split(" ")) {
        if (word.isBlank()) continue
        put(word, getOrDefault(word, 0) + 1)
    }
}

fun main() {
    println(table(3))
    println(primesBelow(20))
    println(wordCounts("The cat and the hat"))
}`,
      hints: [
        'In `buildString { }` you are a `StringBuilder`: `append(…)`. Put the line break *before* every line but the first, and none is left at the end.',
        'Inside `buildMap { }`, `this` is a `MutableMap`: `put(word, getOrDefault(word, 0) + 1)`.',
        '`"".split(" ")` gives `[""]`, one empty word: skip blank words.'
      ],
      checks: [
        { label: '`table(3)`: three lines, no line break at the end', code: 'eq(table(3), "3 x 1 = 3\\n3 x 2 = 6\\n3 x 3 = 9")\neq(table(7).lines().last(), "7 x 3 = 21")' },
        { label: '`primesBelow`: the primes below the limit, in order', code: 'eq(primesBelow(20), listOf(2, 3, 5, 7, 11, 13, 17, 19))\neq(primesBelow(2), listOf<Int>())\neq(primesBelow(3), listOf(2))' },
        { label: '`wordCounts` counts the lower-case words', code: 'eq(wordCounts("the cat and the hat"), mapOf("the" to 2, "cat" to 1, "and" to 1, "hat" to 1))\neq(wordCounts("Go go GO"), mapOf("go" to 3))' },
        { label: 'An empty text gives an empty map', code: 'eq(wordCounts(""), mapOf<String, Int>())' },
        { label: 'Written with `buildString`, `buildList` and `buildMap`', code: 'ok(uses("""\\bbuildString\\b""") && uses("""\\bbuildList\\b""") && uses("""\\bbuildMap\\b"""), "use buildString, buildList and buildMap")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'kt-fun-interfaces', track: 'interop', title: 'fun interfaces and SAM conversions',
    summary: 'A fun interface is a Kotlin interface with one abstract method, so a lambda can stand for it, as for Java\'s Runnable or Comparator. When to choose one over a plain function type.',
    keywords: ['fun interface', 'SAM', 'SAM conversion', 'single abstract method', 'functional interface', 'Runnable', 'Comparator', 'Callable', 'function type', 'lambda', 'FunctionalInterface'],
    docs: 'https://kotlinlang.org/docs/fun-interfaces.html',
    body: [
      '## A fun interface',
      'An interface with exactly one abstract method, declared `fun interface`, can be created from a lambda, as Java creates a `Runnable` from one:',
      kt(`fun interface Validator {
    fun validate(input: String): Boolean
}

val notBlank = Validator { it.isNotBlank() }
val short = Validator { it.length <= 10 }

fun check(input: String, vararg rules: Validator) = rules.all { it.validate(input) }

fun main() {
    println(check("kotlin", notBlank, short))
    println(check("   ", notBlank, short))
    println(check("a very long string", notBlank, short))
}`),
      out(`true
false
false`),
      'Without the `fun`, an interface cannot take a lambda: `Validator { … }` would fail with *Interface \'interface Validator : Any\' does not have constructors*, and you would write `object : Validator { override fun validate(input: String) = … }`. Java interfaces with one abstract method convert to a lambda whether or not they say `@FunctionalInterface`.',
      '## A fun interface or a function type?',
      kt(`typealias Rule = (String) -> Boolean

fun interface NamedRule {
    fun test(s: String): Boolean
}

fun main() {
    val r1: Rule = { it.startsWith("k") }
    val r2 = NamedRule { it.startsWith("k") }
    println(r1("kotlin"))
    println(r2.test("java"))
    println(r2 is NamedRule)
}`),
      out(`true
false
true`),
      '| A function type, `(String) -> Boolean` | A fun interface |\n|---|---|\n| no declaration needed; `::isValid` and any lambda fit | a named type of its own, visible in signatures and to Java |\n| called as `r1("x")` | called by its method name, `r2.test("x")` |\n| nothing but the call | can have other, non-abstract members (below), and be implemented by classes and objects |',
      'Prefer the function type for a callback or a strategy passed to one function. Choose a fun interface for a role in your design that deserves a name, that Java code will implement, or that needs helper methods.',
      '## Members beside the abstract one',
      kt(`fun interface Formatter {
    fun format(value: Double): String

    fun formatAll(values: List<Double>): String = values.joinToString(" | ") { format(it) }
}

fun main() {
    val money = Formatter { "%.2f".format(it) }
    println(money.formatAll(listOf(1.0, 2.5, 3.14159)))
}`),
      out('1.00 | 2.50 | 3.14'),
      '## Java\'s functional interfaces',
      'Every Java interface with one abstract method takes a Kotlin lambda: as an argument, or with the interface\'s name in front:',
      kt(`import java.util.concurrent.Callable

fun main() {
    val tasks = listOf(Callable { 1 + 1 }, Callable { "two" })
    println(tasks.map { it.call() })
    val t = Thread { println("in a thread") }
    t.start()
    t.join()
    val names = mutableListOf("pear", "Fig", "apple")
    java.util.Collections.sort(names, String.CASE_INSENSITIVE_ORDER)
    println(names)
    names.sortWith { a, b -> b.length - a.length }
    println(names)
}`),
      out(`[2, two]
in a thread
[apple, Fig, pear]
[apple, pear, Fig]`),
      '`Thread { … }` passes the lambda as Java\'s `Runnable`; `sortWith { a, b -> … }` passes it as a `java.util.Comparator`. Kotlin even has a `Comparator { a, b -> … }` of its own name for the same interface.'
    ].join('\n\n'),
    java: [
      java(`@FunctionalInterface
interface Validator {
    boolean validate(String input);
}

Validator notBlank = input -> !input.isBlank();
Runnable task = () -> System.out.println("running");`),
      'Java converts a lambda to any interface with one abstract method; `@FunctionalInterface` only asks the compiler to check that there is one. Kotlin converts to Java interfaces the same way, but to its own interfaces only when they are declared `fun interface`, because Kotlin has real function types (`(String) -> Boolean`) and does not need an interface for every callback.'
    ].join('\n\n'),
    example: {
      code: `fun interface Listener {
    fun onEvent(name: String)
}

class Button {
    private val listeners = mutableListOf<Listener>()
    fun onClick(l: Listener) {
        listeners.add(l)
    }
    fun click() = listeners.forEach { it.onEvent("click") }
}

fun main() {
    val b = Button()
    b.onClick { println("first heard a $it") }
    b.onClick(Listener { println("second heard a $it") })
    b.click()
}`,
      note: 'Remove `fun` from `fun interface Listener` and run: neither lambda converts any more. Then try `b.onClick(object : Listener { override fun onEvent(name: String) = println(name) })`.'
    },
    challenge: {
      title: 'Pluggable discounts',
      task: '1. Make `Discount` an interface that a lambda can stand for, and give it a second, non-abstract member, `then(next)`: a `Discount` that applies this one, then `next`.\n2. `tenPercent` takes 10% off (`price - price / 10`); `flat50` takes 50 off but never goes below 0. Write each as a lambda.\n3. `checkout(prices, discount)`: the sum of the discounted prices.\n4. `cheapestFirst(items)`: the names, cheapest first, sorted with `sortedWith(Comparator { a, b -> … })`.',
      starter: `interface Discount {
    fun apply(price: Int): Int
}

val tenPercent: Discount get() = TODO("a Discount taking 10% off, written as a lambda")
val flat50: Discount get() = TODO("50 off, never below 0")

fun checkout(prices: List<Int>, discount: Discount): Int = TODO("the sum of the discounted prices")

fun cheapestFirst(items: List<Pair<String, Int>>): List<String> = TODO("the names, cheapest first, with sortedWith(Comparator { a, b -> … })")

fun main() {
    println(checkout(listOf(100, 200), tenPercent))
}`,
      solution: `fun interface Discount {
    fun apply(price: Int): Int

    fun then(next: Discount): Discount = Discount { price -> next.apply(this.apply(price)) }
}

val tenPercent = Discount { it - it / 10 }
val flat50 = Discount { maxOf(0, it - 50) }

fun checkout(prices: List<Int>, discount: Discount): Int = prices.sumOf { discount.apply(it) }

fun cheapestFirst(items: List<Pair<String, Int>>): List<String> =
    items.sortedWith(Comparator { a, b -> a.second - b.second }).map { it.first }

fun main() {
    println(checkout(listOf(100, 200), tenPercent))
    println(tenPercent.then(flat50).apply(200))
    println(cheapestFirst(listOf("tea" to 30, "cake" to 120, "bun" to 15)))
}`,
      hints: [
        '`fun interface Discount { … }` lets `Discount { it - it / 10 }` compile.',
        'Inside `then`, the lambda can call this discount\'s `apply` and then `next.apply`: `Discount { price -> next.apply(this.apply(price)) }`.',
        '`Comparator { a, b -> a.second - b.second }` orders by price; `map { it.first }` keeps the names.'
      ],
      checks: [
        { label: '`tenPercent` and `flat50`', code: 'eq(tenPercent.apply(200), 180)\neq(flat50.apply(120), 70)\neq(flat50.apply(30), 0)' },
        { label: '`Discount` is an interface a lambda can stand for', code: 'ok(Discount::class.java.isInterface, "Discount should be an interface")\nval double = Discount { it * 2 }\neq(double.apply(21), 42)' },
        { label: '`then` applies this discount, then the next', code: 'eq(tenPercent.then(flat50).apply(200), 130)\neq(flat50.then(tenPercent).apply(200), 135)' },
        { label: '`checkout` sums the discounted prices', code: 'eq(checkout(listOf(100, 200), tenPercent), 270)\neq(checkout(listOf(), flat50), 0)' },
        { label: '`cheapestFirst`, with a `Comparator` lambda', code: 'eq(cheapestFirst(listOf("tea" to 30, "cake" to 120, "bun" to 15)), listOf("bun", "tea", "cake"))\nok(uses("""Comparator\\s*(<[^>]*>)?\\s*\\{"""), "sort with sortedWith(Comparator { a, b -> … })")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 6 */
  L.push({
    id: 'kt-annotations', track: 'interop', title: 'Annotations and reflection',
    summary: 'Declaring annotations, use-site targets (@field:, @get:, @param:) that decide where Java frameworks find them, ::class and ::class.java, reading annotations at run time, and kotlin-reflect.',
    keywords: ['annotation', 'annotation class', 'use-site target', '@field:', '@get:', '@param:', '@property:', 'Retention', 'Target', 'reflection', '::class', 'KClass', 'Class', 'javaClass', 'kotlin-reflect', 'findAnnotation', 'memberProperties', 'callable reference'],
    docs: 'https://kotlinlang.org/docs/annotations.html',
    body: [
      '## Declaring and reading an annotation',
      'An annotation is an `annotation class`. `@Target` says what it may be put on, and `@Retention(RUNTIME)` keeps it in the class files where reflection can find it (it is Kotlin\'s default; Java\'s is `CLASS`, which reflection cannot see):',
      kt(`@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Route(val path: String, val method: String = "GET")

@Route("/users")
class UserController {
    @Route("/users/{id}", method = "DELETE")
    fun delete() = "deleted"
}

fun main() {
    val route = UserController::class.java.getAnnotation(Route::class.java)
    println("\${route.method} \${route.path}")
    val m = UserController::class.java.getMethod("delete").getAnnotation(Route::class.java)
    println("\${m.method} \${m.path}")
}`),
      out(`GET /users
DELETE /users/{id}`),
      'An annotation\'s arguments must be constants: numbers, strings (`const val` too), class literals, enums, other annotations, and arrays of these.',
      '## ::class and ::class.java',
      '`Order::class` is a `KClass`, Kotlin\'s description of the class; `Order::class.java` is the Java `Class` that Java APIs (and Java reflection) want. On a value, `x::class` and `x.javaClass` give its run-time class:',
      kt(`data class Order(val id: Int)

fun main() {
    val k = Order::class
    println(k.simpleName)
    println(k.java.name)
    val o: Any = Order(7)
    println(o::class == Order::class)
    println(o.javaClass.simpleName)
    println(String::class.java == "x".javaClass)
}`),
      out(`Order
Order
true
Order
true`),
      '## Use-site targets: where the annotation lands',
      'One Kotlin property is, for Java, a constructor parameter, a field, a getter and maybe a setter. An annotation on it lands on one of these, and Java frameworks look in a particular place: JPA and Jackson often read fields, Bean Validation reads fields or getters. Say where with a use-site target:',
      kt(`import kotlin.reflect.full.findAnnotation

@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY, AnnotationTarget.VALUE_PARAMETER, AnnotationTarget.PROPERTY_GETTER)
@Retention(AnnotationRetention.RUNTIME)
annotation class Column(val name: String)

class User(
    @field:Column("user_name") val name: String,
    @property:Column("user_age") val age: Int,
    @get:Column("user_email") val email: String
)

fun main() {
    val c = User::class.java
    println(c.getDeclaredField("name").getAnnotation(Column::class.java)?.name)
    println(c.getDeclaredField("age").getAnnotation(Column::class.java)?.name)
    println(User::age.findAnnotation<Column>()?.name)
    println(c.getMethod("getEmail").getAnnotation(Column::class.java)?.name)
}`),
      out(`user_name
null
user_age
user_email`),
      '`@property:` puts the annotation where only Kotlin looks: Java reflection finds nothing on the field `age`, while Kotlin reflection does. The targets are `@field:`, `@get:`, `@set:`, `@param:` (the constructor parameter), `@property:`, `@setparam:`, `@receiver:`, `@delegate:` and `@file:`. Without one, the compiler picks by rules that depend on the annotation\'s `@Target` and on the Kotlin version, so with Spring, JPA or Jackson **write the target**: `@field:NotBlank val name: String`.',
      '## Reflection with kotlin-reflect',
      'Kotlin\'s own reflection (`memberProperties`, `findAnnotation`, calling a property\'s getter) lives in a separate library, kotlin-reflect, which this tool puts on the class path; a real project adds it as a dependency. Without it, `::class`, `simpleName` and Java reflection still work.',
      kt(`import kotlin.reflect.full.memberProperties

data class Product(val name: String, val price: Int, val inStock: Boolean)

fun describe(obj: Any): String =
    obj::class.memberProperties.sortedBy { it.name }.joinToString { "\${it.name}=\${it.getter.call(obj)}" }

fun main() {
    println(describe(Product("tea", 30, true)))
}`),
      out('inStock=true, name=tea, price=30'),
      '## References are reflection too',
      '`::isEven` is a function reference ([[lesson:kt-lambdas]]) and `Counter::count` a property reference. Both carry a name and can be called or read:',
      kt(`fun isEven(n: Int) = n % 2 == 0

class Counter {
    var count = 0
}

fun main() {
    val f = ::isEven
    println(f.name)
    println(listOf(1, 2, 3, 4).filter(f))
    val c = Counter()
    val prop = Counter::count
    prop.set(c, 5)
    println(prop(c))
    println(prop.name)
}`),
      out(`isEven
[2, 4]
5
count`)
    ].join('\n\n'),
    java: [
      java(`@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
@interface Route { String path(); String method() default "GET"; }

Class<?> c = UserController.class;            // Kotlin: UserController::class.java
Class<?> d = order.getClass();                 // Kotlin: order::class.java, or order.javaClass
Route r = c.getAnnotation(Route.class);        // the same call in Kotlin`),
      'Two traps when moving from Java: an annotation\'s retention defaults to `CLASS` in Java and `RUNTIME` in Kotlin; and one Kotlin property is several Java elements, so the use-site target decides which one a framework sees.'
    ].join('\n\n'),
    example: {
      code: `import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.memberProperties

@Target(AnnotationTarget.PROPERTY)
annotation class Label(val text: String)

data class Address(@Label("Street") val street: String, @Label("Postcode") val code: String, val note: String)

fun main() {
    val a = Address("MG Road", "560001", "near the park")
    for (p in Address::class.memberProperties.sortedBy { it.name }) {
        val label = p.findAnnotation<Label>()?.text ?: "(no label)"
        println("$label: \${p.getter.call(a)}")
    }
}`,
      note: 'Add `@Label("Note")` to `note`, and run. Then print `Address::class.simpleName` and `a.javaClass.name`.'
    },
    challenge: {
      title: 'A tiny validator',
      task: 'Write `validate(obj)`, reading the annotations of `obj`\'s properties with kotlin-reflect. Go through the properties sorted by name; for each `String` value:\n\n- a property marked `@NotBlank` whose value is blank gives `"<name> is blank"`;\n- a property marked `@MaxLength(n)` whose value is longer than n gives `"<name> is longer than <n>"`.\n\nReturn the problems found, in that order. Then `typeName(obj)`: the simple name of `obj`\'s class.',
      starter: `import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.memberProperties

@Target(AnnotationTarget.PROPERTY)
annotation class NotBlank

@Target(AnnotationTarget.PROPERTY)
annotation class MaxLength(val value: Int)

data class Signup(@NotBlank val user: String, @MaxLength(5) val code: String, val note: String)

fun validate(obj: Any): List<String> = TODO("for each property, sorted by name: check @NotBlank and @MaxLength")

fun typeName(obj: Any): String = TODO("the simple name of obj's class")

fun main() {
    println(validate(Signup("", "1234567", "")))
}`,
      solution: `import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.memberProperties

@Target(AnnotationTarget.PROPERTY)
annotation class NotBlank

@Target(AnnotationTarget.PROPERTY)
annotation class MaxLength(val value: Int)

data class Signup(@NotBlank val user: String, @MaxLength(5) val code: String, val note: String)

fun validate(obj: Any): List<String> {
    val problems = mutableListOf<String>()
    for (p in obj::class.memberProperties.sortedBy { it.name }) {
        val value = p.getter.call(obj) as? String ?: continue
        if (p.findAnnotation<NotBlank>() != null && value.isBlank()) problems.add("\${p.name} is blank")
        val max = p.findAnnotation<MaxLength>()
        if (max != null && value.length > max.value) problems.add("\${p.name} is longer than \${max.value}")
    }
    return problems
}

fun typeName(obj: Any): String = obj::class.simpleName ?: "?"

fun main() {
    println(validate(Signup("", "1234567", "")))
    println(typeName(Signup("a", "b", "c")))
}`,
      hints: [
        '`obj::class.memberProperties` lists the properties; `p.getter.call(obj)` reads one, as an `Any?`: `as? String ?: continue` skips the rest.',
        '`p.findAnnotation<NotBlank>()` is the annotation, or null when the property has none; `p.findAnnotation<MaxLength>()?.value` is its number.'
      ],
      checks: [
        { label: 'A valid signup has no problems (5 characters is not longer than 5)', code: 'eq(validate(Signup("asha", "12", "")), listOf<String>())\neq(validate(Signup("asha", "12345", "")), listOf<String>())' },
        { label: 'A blank `@NotBlank` property', code: 'eq(validate(Signup("  ", "12", "x")), listOf("user is blank"))' },
        { label: 'A `@MaxLength` property that is too long', code: 'eq(validate(Signup("asha", "1234567", "x")), listOf("code is longer than 5"))' },
        { label: 'Both, sorted by property name, and any annotated class works', code: 'eq(validate(Signup("", "1234567", "")), listOf("code is longer than 5", "user is blank"))\ndata class Pet(@NotBlank val name: String, @MaxLength(3) val tag: String)\neq(validate(Pet("", "abcd")), listOf("name is blank", "tag is longer than 3"))' },
        { label: '`typeName` gives the simple name', code: 'eq(typeName(Signup("a", "b", "c")), "Signup")\neq(typeName("x"), "String")\neq(typeName(listOf(1).size), "Int")' }
      ]
    }
  });

  /* ---------------------------------------------------------------- 7 */
  L.push({
    id: 'kt-testing', track: 'interop', title: 'Testing with kotlin.test',
    summary: 'kotlin.test\'s assertions (assertEquals, assertFailsWith, assertIs, assertContentEquals), test names in backticks, and how it maps onto JUnit 5 in a real Gradle project.',
    keywords: ['kotlin.test', 'test', 'testing', 'unit test', 'assertEquals', 'assertFailsWith', 'assertTrue', 'assertNotNull', 'assertIs', 'assertContentEquals', 'JUnit', 'JUnit 5', 'backtick names', 'MockK'],
    docs: 'https://kotlinlang.org/docs/jvm-test-using-junit.html',
    body: [
      '## kotlin.test',
      '`kotlin.test` is the standard library\'s testing API: assertions that throw an `AssertionError` with a clear message when they fail. Here they run in `main`; in a project they run inside test functions (below).',
      kt(`import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

fun slugify(title: String): String = title.trim().lowercase().replace(Regex("[^a-z0-9]+"), "-").trim('-')

fun main() {
    assertEquals("hello-world", slugify("  Hello, World! "))
    assertTrue(slugify("A").isNotEmpty())
    val e = assertFailsWith<NumberFormatException> { "x".toInt() }
    assertNotNull(e.message)
    println("all assertions passed")
}`),
      out('all assertions passed'),
      '`assertEquals(expected, actual)`: the expected value comes **first**, as in JUnit. `assertFailsWith<T> { … }` fails unless the block throws a `T`, and returns the exception, so you can check its message.',
      '## What a failure says',
      kt(`import kotlin.test.assertEquals

fun main() {
    try {
        assertEquals(4, 2 + 1, "adding")
    } catch (e: AssertionError) {
        println(e.message)
    }
}`),
      out('adding. Expected <4>, actual <3>.'),
      '## Test functions with readable names',
      'A test is a function; on the JVM its name may be a sentence in backticks. Here `main` plays the test runner:',
      kt(`import kotlin.test.assertEquals

class Cart {
    private val items = mutableListOf<Int>()
    fun add(price: Int) {
        require(price > 0) { "price must be positive" }
        items.add(price)
    }
    fun total() = items.sum()
}

fun \`an empty cart totals zero\`() = assertEquals(0, Cart().total())

fun \`a cart adds up its items\`() {
    val c = Cart()
    c.add(30)
    c.add(70)
    assertEquals(100, c.total())
}

fun main() {
    val tests = listOf(::\`an empty cart totals zero\`, ::\`a cart adds up its items\`)
    for (t in tests) {
        t()
        println("passed: \${t.name}")
    }
}`),
      out(`passed: an empty cart totals zero
passed: a cart adds up its items`),
      '## More assertions',
      kt(`import kotlin.test.assertContentEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertIs

fun main() {
    val ex = assertFailsWith<IllegalArgumentException> { require(false) { "nope" } }
    println(ex.message)
    assertContentEquals(listOf(1, 2), sequenceOf(1, 2).toList())
    val x: Any = "text"
    val s = assertIs<String>(x)
    println(s.length)
}`),
      out(`nope
4`),
      '`assertIs<String>(x)` checks the type and returns `x` as a `String`. `assertContentEquals` compares arrays, lists and sequences item by item. There are also `assertNull`, `assertNotEquals`, `assertContains`, `assertFalse` and `fail("…")`.',
      '## In a real project: JUnit 5',
      'In a Gradle project, tests live in `src/test/kotlin`, and kotlin.test runs on JUnit 5. The build file needs two lines:',
      '```text\n// build.gradle.kts\ndependencies {\n    testImplementation(kotlin("test"))     // kotlin.test, wired to JUnit 5\n}\ntasks.test {\n    useJUnitPlatform()\n}\n```',
      'and a test class looks like this (shown, not run: JUnit is not on this tool\'s class path):',
      norun(`import kotlin.test.Test
import kotlin.test.assertEquals

class CartTest {
    @Test
    fun \`a cart adds up its items\`() {
        val c = Cart()
        c.add(30)
        assertEquals(30, c.total())
    }
}`),
      '`kotlin.test.Test` is JUnit\'s `@Test` under another name. For mocking, Kotlin projects usually use MockK, which understands final classes, `object`s and coroutines.'
    ].join('\n\n'),
    java: [
      java(`import static org.junit.jupiter.api.Assertions.*;

@Test
void anEmptyCartTotalsZero() {
    assertEquals(0, new Cart().total());
    NumberFormatException e = assertThrows(NumberFormatException.class, () -> Integer.parseInt("x"));
    assertNotNull(e.getMessage());
}`),
      '`assertThrows(X.class, () -> …)` becomes `assertFailsWith<X> { … }`, with the type as a type argument, and the method name can say what it tests in words. JUnit 5 runs both: kotlin.test is a thin layer over it.'
    ].join('\n\n'),
    example: {
      code: `import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

fun fizz(n: Int): String {
    require(n > 0) { "n must be positive" }
    return when {
        n % 15 == 0 -> "FizzBuzz"
        n % 3 == 0 -> "Fizz"
        n % 5 == 0 -> "Buzz"
        else -> n.toString()
    }
}

fun main() {
    assertEquals("Fizz", fizz(9))
    assertEquals("FizzBuzz", fizz(30))
    assertEquals("7", fizz(7))
    assertFailsWith<IllegalArgumentException> { fizz(0) }
    println("all tests pass")
}`,
      note: 'Break `fizz` on purpose (swap "Fizz" and "Buzz") and run: the first failing assertion stops the program and says what it expected.'
    },
    challenge: {
      title: 'Tests that catch bugs',
      task: '`parseDuration` turns `"2h"` into 120 minutes, `"45m"` into 45 and `"1h 30m"` into 90, and throws `IllegalArgumentException` for text that is not a duration, such as `"abc"` or `""`.\n\nWrite `checkParser(parse)`: tests, with kotlin.test, for **any** function that claims to do this. It must pass (throw nothing) for a correct parser such as `parseDuration`, and throw an `AssertionError` for a parser that:\n\n- ignores the minutes;\n- ignores the hours;\n- returns 0 instead of throwing for bad text.',
      starter: `import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

/** "2h" is 120 minutes, "45m" is 45, "1h 30m" is 90; anything else throws IllegalArgumentException. */
fun parseDuration(text: String): Int {
    val m = Regex("""(?:(\\d+)h)?\\s*(?:(\\d+)m)?""").matchEntire(text.trim())
    require(m != null && text.isNotBlank()) { "not a duration: '$text'" }
    val hours = m.groupValues[1].toIntOrNull() ?: 0
    val minutes = m.groupValues[2].toIntOrNull() ?: 0
    return hours * 60 + minutes
}

// Tests for any parser: pass for a correct one, throw an AssertionError for a wrong one
fun checkParser(parse: (String) -> Int) {
    TODO("assertEquals for \\"2h\\", \\"45m\\" and \\"1h 30m\\"; assertFailsWith for text that is not a duration")
}

fun main() {
    checkParser(::parseDuration)
    println("the tests pass")
}`,
      solution: `import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

/** "2h" is 120 minutes, "45m" is 45, "1h 30m" is 90; anything else throws IllegalArgumentException. */
fun parseDuration(text: String): Int {
    val m = Regex("""(?:(\\d+)h)?\\s*(?:(\\d+)m)?""").matchEntire(text.trim())
    require(m != null && text.isNotBlank()) { "not a duration: '$text'" }
    val hours = m.groupValues[1].toIntOrNull() ?: 0
    val minutes = m.groupValues[2].toIntOrNull() ?: 0
    return hours * 60 + minutes
}

fun checkParser(parse: (String) -> Int) {
    assertEquals(120, parse("2h"))
    assertEquals(45, parse("45m"))
    assertEquals(90, parse("1h 30m"))
    assertFailsWith<IllegalArgumentException> { parse("abc") }
    assertFailsWith<IllegalArgumentException> { parse("") }
}

fun main() {
    checkParser(::parseDuration)
    println("the tests pass")
}`,
      hints: [
        '`assertEquals(120, parse("2h"))`: the expected value first. One assertion with hours only, one with minutes only, one with both.',
        '`assertFailsWith<IllegalArgumentException> { parse("abc") }` throws an `AssertionError` when `parse` returns instead of throwing.'
      ],
      checks: [
        { label: 'The tests pass for a correct parser', code: 'checkParser(::parseDuration)\ncheckParser { t -> parseDuration(" $t ") }' },
        { label: 'They catch a parser that ignores the minutes', code: 'val r = runCatching { checkParser { t -> parseDuration(t) / 60 * 60 } }\nok(r.exceptionOrNull() is AssertionError, "your tests should throw an AssertionError for a parser that ignores minutes; got ${r.exceptionOrNull() ?: "nothing"}")' },
        { label: 'They catch a parser that ignores the hours', code: 'val r = runCatching { checkParser { t -> parseDuration(t) % 60 } }\nok(r.exceptionOrNull() is AssertionError, "your tests should throw an AssertionError for a parser that ignores hours; got ${r.exceptionOrNull() ?: "nothing"}")' },
        { label: 'They catch a parser that returns 0 for bad text', code: 'val r = runCatching { checkParser { t -> runCatching { parseDuration(t) }.getOrDefault(0) } }\nok(r.exceptionOrNull() is AssertionError, "your tests should throw an AssertionError for a parser that accepts \\"abc\\"; got ${r.exceptionOrNull() ?: "nothing"}")' },
        { label: 'Written with `assertEquals` and `assertFailsWith`', code: 'ok(uses("""\\bassertEquals\\s*\\(""") && uses("""\\bassertFailsWith\\s*<"""), "call assertEquals(…) and assertFailsWith<…> { … }")' }
      ]
    }
  });
})(window.KLT);
