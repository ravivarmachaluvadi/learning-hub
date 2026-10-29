/*
 * data/javakt.js - Kotlin <-> Java (#/java, js/views/javakt.js): what you write in Java every day, next to
 * the Kotlin for it, grouped by topic (batch 3).
 *
 * Topic shape: {id, title}
 * Entry shape: {id, topic, title, keywords, java (a whole Java 21 program: a class Main with
 *   public static void main), kotlin (a whole Kotlin program), output (exactly what BOTH print), note (Markdown)}
 *
 * tests/check_data.py checks every entry has both sides and its output; tests/test_content.py runs the
 * Kotlin on kotlinc and the Java on this JDK (compiled as Java 21), and each must print exactly `output`.
 * Nothing prints a hash code, an address, a time or a HashMap's order, so both print the same on every run.
 * Code is in template literals: a Kotlin ${…} is \${…}, a "\n" (Kotlin or Java) is "\\n".
 */
(function (U) {
  'use strict';
  U.data.javaktTopics = [
    { id: 'basics', title: 'Basics' },
    { id: 'strings', title: 'Strings' },
    { id: 'null', title: 'null and Optional' },
    { id: 'collections', title: 'Collections' },
    { id: 'streams', title: 'Streams' },
    { id: 'classes', title: 'Classes and records' },
    { id: 'equality', title: 'Equality' },
    { id: 'functions', title: 'Functions and lambdas' },
    { id: 'exceptions', title: 'Exceptions and resources' },
    { id: 'generics', title: 'Generics' },
    { id: 'interop', title: 'Threads, classes, interop' }
  ];

  var E = U.data.javakt = [];
  function add(topic, rows) {
    rows.forEach(function (r) { r.topic = topic; E.push(r); });
  }

  /* ---------------------------------------------------------------- basics */
  add('basics', [
    { id: 'main', title: 'A program\'s entry point', keywords: ['main', 'public static void main', 'hello world', 'MainKt'],
      java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from main");
    }
}`,
      kotlin: `fun main() {
    println("Hello from main")
}`,
      output: 'Hello from main',
      note: 'No class, no `public static void`, no `String[] args` unless you need them. The compiler puts a top-level `main` into a class named after the file (`MainKt`). See [[lesson:kt-first-program]].' },
    { id: 'variables', title: 'Variables: final and not', keywords: ['final', 'var', 'val', 'type inference', 'declaration'],
      java: `import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        final String city = "Pune";
        int count = 3;
        count += 2;
        var items = new ArrayList<String>();
        items.add("a");
        System.out.println(city + " " + count + " " + items);
    }
}`,
      kotlin: `fun main() {
    val city = "Pune"
    var count = 3
    count += 2
    val items = mutableListOf<String>()
    items.add("a")
    println("$city $count $items")
}`,
      output: 'Pune 5 [a]',
      note: '`val` is Java\'s `final` variable and `var` a plain one; both infer the type, as Java\'s `var` does. Prefer `val`. See [[lesson:kt-variables]].' },
    { id: 'ternary', title: 'The ternary operator', keywords: ['?:', 'ternary', 'conditional', 'if expression'],
      java: `public class Main {
    public static void main(String[] args) {
        int score = 72;
        String label = score >= 50 ? "pass" : "fail";
        int max = 3 > 5 ? 3 : 5;
        System.out.println(label + " " + max);
    }
}`,
      kotlin: `fun main() {
    val score = 72
    val label = if (score >= 50) "pass" else "fail"
    val max = if (3 > 5) 3 else 5
    println("$label $max")
}`,
      output: 'pass 5',
      note: 'Kotlin has no `a ? b : c`: `if` is an expression and gives the value. (Kotlin\'s `?:` is something else, the Elvis operator: a default for null.) See [[lesson:kt-conditions]].' },
    { id: 'switch', title: 'switch → when', keywords: ['switch', 'case', 'when', 'switch expression', 'yield'],
      java: `public class Main {
    static String describe(int code) {
        return switch (code) {
            case 200 -> "OK";
            case 301, 302 -> "Redirect";
            case 404 -> "Not found";
            default -> code >= 500 ? "Server error" : "Other";
        };
    }

    public static void main(String[] args) {
        for (int c : new int[] {200, 302, 404, 503, 418}) System.out.println(describe(c));
    }
}`,
      kotlin: `fun describe(code: Int): String = when (code) {
    200 -> "OK"
    301, 302 -> "Redirect"
    404 -> "Not found"
    in 500..599 -> "Server error"
    else -> "Other"
}

fun main() {
    for (c in listOf(200, 302, 404, 503, 418)) println(describe(c))
}`,
      output: `OK
Redirect
Not found
Server error
Other`,
      note: '`when` never falls through, takes several values per branch, ranges (`in 500..599`), types (`is String`) and plain conditions, and gives a value. Java 21\'s switch expression is close; old `case:` with `break` is not. See [[q:when-vs-switch]].' },
    { id: 'loops', title: 'Counting loops and for-each', keywords: ['for', 'loop', 'range', 'until', 'downTo', 'step', 'for each'],
      java: `import java.util.List;

public class Main {
    public static void main(String[] args) {
        for (int i = 0; i < 3; i++) System.out.print(i + ",");
        System.out.println();
        for (int i = 10; i >= 0; i -= 5) System.out.print(i + ",");
        System.out.println();
        for (String s : List.of("a", "b")) System.out.print(s + ",");
        System.out.println();
    }
}`,
      kotlin: `fun main() {
    for (i in 0 until 3) print("$i,")
    println()
    for (i in 10 downTo 0 step 5) print("$i,")
    println()
    for (s in listOf("a", "b")) print("$s,")
    println()
}`,
      output: `0,1,2,
10,5,0,
a,b,`,
      note: 'Kotlin\'s `for` goes over something: a range (`0 until 3` leaves out 3, `1..3` includes it), a progression (`downTo`, `step`), or a collection. There is no `for (init; test; step)`. See [[lesson:kt-loops]].' },
    { id: 'constants', title: 'Constants: static final', keywords: ['static final', 'const', 'constant', 'companion'],
      java: `public class Main {
    static final int MAX_USERS = 100;
    static final String APP = "shop";

    public static void main(String[] args) {
        System.out.println(APP + " allows " + MAX_USERS);
    }
}`,
      kotlin: `const val MAX_USERS = 100
const val APP = "shop"

fun main() {
    println("$APP allows $MAX_USERS")
}`,
      output: 'shop allows 100',
      note: 'A `const val` at the top level is a compile-time constant, copied into the code that uses it, like Java\'s `static final` constants. Inside a class, constants go in a `companion object`. See [[lesson:kt-type-aliases]].' },
    { id: 'numbers', title: 'Number conversions', keywords: ['widening', 'cast', 'toLong', 'toDouble', 'integer division', 'int', 'long'],
      java: `public class Main {
    public static void main(String[] args) {
        int total = 7;
        int count = 2;
        long big = total;                         // widened for you
        double avg = (double) total / count;
        int back = (int) 3.99;
        System.out.println(big + " " + total / count + " " + avg + " " + back);
    }
}`,
      kotlin: `fun main() {
    val total = 7
    val count = 2
    val big: Long = total.toLong()
    val avg = total.toDouble() / count
    val back = 3.99.toInt()
    println("$big \${total / count} $avg $back")
}`,
      output: '7 3 3.5 3',
      note: 'Kotlin never widens numbers by itself: `val big: Long = total` does not compile. Convert on purpose with `toLong()`, `toDouble()`, `toInt()`, which replace Java\'s casts. Integer division truncates in both. See [[lesson:kt-numbers]].' },
    { id: 'instanceof', title: 'instanceof and casts', keywords: ['instanceof', 'is', 'smart cast', 'cast', 'pattern matching'],
      java: `public class Main {
    static String describe(Object o) {
        if (o instanceof String s) return "text of " + s.length();
        if (o instanceof Integer n && n > 10) return "a big number";
        return "something else";
    }

    public static void main(String[] args) {
        System.out.println(describe("hello"));
        System.out.println(describe(42));
        System.out.println(describe(3.5));
    }
}`,
      kotlin: `fun describe(o: Any): String {
    if (o is String) return "text of \${o.length}"
    if (o is Int && o > 10) return "a big number"
    return "something else"
}

fun main() {
    println(describe("hello"))
    println(describe(42))
    println(describe(3.5))
}`,
      output: `text of 5
a big number
something else`,
      note: 'Kotlin\'s `is` smart-casts the same variable: after `o is String`, `o` is a `String`, with no new name (Java 16\'s pattern adds `s`). A cast is `o as String`, or `o as? String` for null instead of an exception. See [[q:smart-casts]].' }
  ]);

  /* ---------------------------------------------------------------- strings */
  add('strings', [
    { id: 'templates', title: 'Concatenation → string templates', keywords: ['concatenation', '+', 'template', 'interpolation', 'String.format'],
      java: `public class Main {
    public static void main(String[] args) {
        String name = "Asha";
        int age = 30;
        System.out.println("Hi " + name + ", next year you are " + (age + 1));
    }
}`,
      kotlin: `fun main() {
    val name = "Asha"
    val age = 30
    println("Hi $name, next year you are \${age + 1}")
}`,
      output: 'Hi Asha, next year you are 31',
      note: '`$name` puts a value in; `${…}` puts in any expression. Java 21 has no templates (the preview was withdrawn). See [[lesson:kt-strings]].' },
    { id: 'text-blocks', title: 'Text blocks → raw strings', keywords: ['text block', 'raw string', 'multiline', 'trimIndent', '"""'],
      java: `public class Main {
    public static void main(String[] args) {
        String json = """
            {
              "name": "Asha",
              "path": "C:\\\\data"
            }""";
        System.out.println(json);
    }
}`,
      kotlin: `fun main() {
    val json = """
        {
          "name": "Asha",
          "path": "C:\\data"
        }
    """.trimIndent()
    println(json)
}`,
      output: `{
  "name": "Asha",
  "path": "C:\\data"
}`,
      note: 'In a Kotlin raw string a backslash is just a backslash, so `C:\\data` needs no escaping (Java\'s text block still needs `\\\\`). `trimIndent()` removes the shared indentation, which Java\'s text block does by itself. Templates work inside raw strings too.' },
    { id: 'string-equals', title: 'Comparing strings', keywords: ['equals', '==', 'equalsIgnoreCase', 'compareTo', 'string comparison'],
      java: `public class Main {
    public static void main(String[] args) {
        String a = "kotlin";
        String b = new StringBuilder("kot").append("lin").toString();
        System.out.println(a.equals(b) + " " + (a == b) + " " + a.equalsIgnoreCase("KOTLIN"));
    }
}`,
      kotlin: `fun main() {
    val a = "kotlin"
    val b = StringBuilder("kot").append("lin").toString()
    println("\${a == b} \${a === b} \${a.equals("KOTLIN", ignoreCase = true)}")
}`,
      output: 'true false true',
      note: 'Kotlin\'s `==` is Java\'s `equals` (and null-safe); `===` is Java\'s `==`. So comparing strings with `==` is right in Kotlin. See [[lesson:kt-equality]].' },
    { id: 'string-builder', title: 'StringBuilder → buildString', keywords: ['StringBuilder', 'buildString', 'append', 'string building'],
      java: `public class Main {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 3; i++) {
            if (i > 1) sb.append(", ");
            sb.append("item").append(i);
        }
        System.out.println(sb.toString());
    }
}`,
      kotlin: `fun main() {
    val s = buildString {
        for (i in 1..3) {
            if (i > 1) append(", ")
            append("item").append(i)
        }
    }
    println(s)
}`,
      output: 'item1, item2, item3',
      note: '`buildString { }` runs the block on a new `StringBuilder` and returns the text: the builder never escapes. For this exact job, `(1..3).joinToString(", ") { "item$it" }` is one line. See [[lesson:kt-build-functions]].' },
    { id: 'split-join', title: 'Splitting and joining', keywords: ['split', 'join', 'String.join', 'joinToString', 'trim', 'Collectors.joining'],
      java: `import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        String csv = " tea, coffee ,juice ";
        List<String> drinks = new ArrayList<>();
        for (String part : csv.split(",")) drinks.add(part.trim().toUpperCase());
        System.out.println(String.join(" | ", drinks));
    }
}`,
      kotlin: `fun main() {
    val csv = " tea, coffee ,juice "
    val drinks = csv.split(",").map { it.trim().uppercase() }
    println(drinks.joinToString(" | "))
}`,
      output: 'TEA | COFFEE | JUICE',
      note: 'Kotlin\'s `split(",")` takes a plain string, not a regular expression (Java\'s does; `split(".")` surprises Java developers), and returns a `List`. `joinToString` also takes a prefix, a postfix and a transform.' },
    { id: 'formatting', title: 'Formatting numbers and padding', keywords: ['String.format', 'format', 'padStart', 'padEnd', 'printf'],
      java: `public class Main {
    public static void main(String[] args) {
        double price = 4.256;
        System.out.println(String.format("%.2f", price));
        System.out.println(String.format("%5d|", 42));
        System.out.println(String.format("%-6s|", "ab"));
    }
}`,
      kotlin: `fun main() {
    val price = 4.256
    println("%.2f".format(price))
    println(42.toString().padStart(5) + "|")
    println("ab".padEnd(6) + "|")
}`,
      output: `4.26
   42|
ab    |`,
      note: '`"%.2f".format(x)` is `String.format` as an extension; `padStart` and `padEnd` pad without a format string. Both follow the JVM\'s locale, so this tool runs everything in `en_US`.' }
  ]);

  /* ---------------------------------------------------------------- null */
  add('null', [
    { id: 'null-check', title: 'Checking for null', keywords: ['null check', '!= null', '?.', 'safe call', 'NullPointerException'],
      java: `public class Main {
    static int lengthOf(String s) {
        if (s != null) return s.length();
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(lengthOf("kotlin") + " " + lengthOf(null));
    }
}`,
      kotlin: `fun lengthOf(s: String?): Int = s?.length ?: -1

fun main() {
    println("\${lengthOf("kotlin")} \${lengthOf(null)}")
}`,
      output: '6 -1',
      note: 'In Kotlin, `String` cannot hold null and `String?` can, and the compiler will not let you call `s.length` on a `String?`. `?.` gives null instead of throwing; `?:` gives a default. See [[lesson:kt-null-safety]].' },
    { id: 'default-value', title: 'A default for null', keywords: ['requireNonNullElse', 'ternary', 'elvis', '?:', 'default'],
      java: `import java.util.Objects;

public class Main {
    public static void main(String[] args) {
        String nickname = null;
        String shown = nickname != null ? nickname : "guest";
        String also = Objects.requireNonNullElse(nickname, "guest");
        System.out.println(shown + " " + also);
    }
}`,
      kotlin: `fun main() {
    val nickname: String? = null
    val shown = nickname ?: "guest"
    println("$shown $shown")
}`,
      output: 'guest guest',
      note: 'The Elvis operator `?:` gives the right side when the left is null. The right side can also be `return`, `throw` or `continue`: `val user = find(id) ?: return`.' },
    { id: 'optional', title: 'Optional<T> → T?', keywords: ['Optional', 'orElse', 'map', 'ifPresent', 'nullable', 'empty'],
      java: `import java.util.Map;
import java.util.Optional;

public class Main {
    static final Map<Integer, String> USERS = Map.of(1, "asha");

    static Optional<String> find(int id) {
        return Optional.ofNullable(USERS.get(id));
    }

    public static void main(String[] args) {
        System.out.println(find(1).map(String::toUpperCase).orElse("none"));
        System.out.println(find(2).map(String::toUpperCase).orElse("none"));
        find(1).ifPresent(name -> System.out.println("found " + name));
    }
}`,
      kotlin: `val users = mapOf(1 to "asha")

fun find(id: Int): String? = users[id]

fun main() {
    println(find(1)?.uppercase() ?: "none")
    println(find(2)?.uppercase() ?: "none")
    find(1)?.let { name -> println("found $name") }
}`,
      output: `ASHA
none
found asha`,
      note: 'Kotlin uses nullable types instead of `Optional`: no wrapper object, and the compiler checks every use. `?.` is `map`, `?:` is `orElse`, `?.let { }` is `ifPresent`. See [[q:null-safety]].' },
    { id: 'not-null-assertion', title: 'When you are sure: !!', keywords: ['!!', 'not-null assertion', 'NullPointerException', 'NPE'],
      java: `public class Main {
    public static void main(String[] args) {
        String s = null;
        try {
            System.out.println(s.length());
        } catch (NullPointerException e) {
            System.out.println("NullPointerException");
        }
    }
}`,
      kotlin: `fun main() {
    val s: String? = null
    try {
        println(s!!.length)
    } catch (e: NullPointerException) {
        println("NullPointerException")
    }
}`,
      output: 'NullPointerException',
      note: 'In Java any reference can throw this. In Kotlin it can only happen where you wrote `!!` ("I am sure this is not null"), at platform types from Java, or in a few rare cases. Treat each `!!` as a question to answer. See [[q:npe-in-kotlin]].' },
    { id: 'require-non-null', title: 'Objects.requireNonNull → requireNotNull', keywords: ['requireNonNull', 'requireNotNull', 'checkNotNull', 'precondition'],
      java: `import java.util.Objects;

public class Main {
    static String greet(String name) {
        Objects.requireNonNull(name, "name is required");
        return "Hello, " + name;
    }

    public static void main(String[] args) {
        System.out.println(greet("Ravi"));
        try {
            greet(null);
        } catch (RuntimeException e) {
            System.out.println(e.getMessage());
        }
    }
}`,
      kotlin: `fun greet(name: String?): String {
    val n = requireNotNull(name) { "name is required" }
    return "Hello, $n"
}

fun main() {
    println(greet("Ravi"))
    try {
        greet(null)
    } catch (e: RuntimeException) {
        println(e.message)
    }
}`,
      output: `Hello, Ravi
name is required`,
      note: '`requireNotNull` returns the value as non-null, so `n` is a `String` from then on. It throws `IllegalArgumentException` (Java\'s throws `NullPointerException`); `checkNotNull` throws `IllegalStateException`. Better still: make the parameter `String`, and the caller cannot pass null at all.' },
    { id: 'null-chains', title: 'Chains of null checks', keywords: ['nested null check', '?.', 'chain', 'safe call chain'],
      java: `public class Main {
    record Address(String city) {}
    record User(String name, Address address) {}

    static String cityOf(User u) {
        if (u != null && u.address() != null && u.address().city() != null) return u.address().city();
        return "unknown";
    }

    public static void main(String[] args) {
        System.out.println(cityOf(new User("Asha", new Address("Pune"))));
        System.out.println(cityOf(new User("Ravi", null)));
        System.out.println(cityOf(null));
    }
}`,
      kotlin: `data class Address(val city: String?)
data class User(val name: String, val address: Address?)

fun cityOf(u: User?): String = u?.address?.city ?: "unknown"

fun main() {
    println(cityOf(User("Asha", Address("Pune"))))
    println(cityOf(User("Ravi", null)))
    println(cityOf(null))
}`,
      output: `Pune
unknown
unknown`,
      note: 'Each `?.` stops the chain at the first null. And the types say which parts may be missing: `name` never is, so no check is written for it.' }
  ]);

  /* ---------------------------------------------------------------- collections */
  add('collections', [
    { id: 'lists', title: 'Making lists', keywords: ['List.of', 'ArrayList', 'listOf', 'mutableListOf', 'Arrays.asList'],
      java: `import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> fixed = List.of(3, 1, 2);
        List<String> names = new ArrayList<>();
        names.add("Asha");
        names.add("Ravi");
        names.remove("Asha");
        System.out.println(fixed + " " + names + " " + fixed.size());
    }
}`,
      kotlin: `fun main() {
    val fixed = listOf(3, 1, 2)
    val names = mutableListOf<String>()
    names.add("Asha")
    names.add("Ravi")
    names.remove("Asha")
    println("$fixed $names \${fixed.size}")
}`,
      output: '[3, 1, 2] [Ravi] 3',
      note: '`listOf` gives a read-only `List` (no `add` at all, checked when compiling, where Java\'s `List.of` throws at run time); `mutableListOf` an `ArrayList`. `size` is a property. See [[lesson:kt-collections]].' },
    { id: 'maps', title: 'Maps: put, get, getOrDefault', keywords: ['HashMap', 'LinkedHashMap', 'put', 'get', 'getOrDefault', 'mapOf', 'mutableMapOf'],
      java: `import java.util.LinkedHashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> stock = new LinkedHashMap<>();
        stock.put("pens", 10);
        stock.put("ink", 2);
        stock.put("pens", stock.get("pens") - 1);
        System.out.println(stock + " " + stock.getOrDefault("paper", 0) + " " + stock.containsKey("ink"));
    }
}`,
      kotlin: `fun main() {
    val stock = mutableMapOf("pens" to 10, "ink" to 2)
    stock["pens"] = stock.getValue("pens") - 1
    println("$stock \${stock["paper"] ?: 0} \${"ink" in stock}")
}`,
      output: '{pens=9, ink=2} 0 true',
      note: '`map[key]` reads (giving null when the key is missing) and `map[key] = v` writes. `mutableMapOf` is a `LinkedHashMap`, so the order you added things is kept. `"ink" in stock` is `containsKey`. `a to b` makes a `Pair`.' },
    { id: 'map-iteration', title: 'Going over a map', keywords: ['entrySet', 'Map.Entry', 'forEach', 'destructuring', 'for ((k, v) in map)'],
      java: `import java.util.LinkedHashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> ages = new LinkedHashMap<>();
        ages.put("Asha", 30);
        ages.put("Ravi", 41);
        for (Map.Entry<String, Integer> e : ages.entrySet()) {
            System.out.println(e.getKey() + " is " + e.getValue());
        }
    }
}`,
      kotlin: `fun main() {
    val ages = mapOf("Asha" to 30, "Ravi" to 41)
    for ((name, age) in ages) {
        println("$name is $age")
    }
}`,
      output: `Asha is 30
Ravi is 41`,
      note: '`for ((name, age) in ages)` takes each entry apart (destructuring: [[lesson:kt-operators]]). `ages.forEach { (name, age) -> … }` does the same as a lambda.' },
    { id: 'counting', title: 'Counting with a map', keywords: ['merge', 'getOrDefault', 'word count', 'groupingBy', 'eachCount', 'frequency'],
      java: `import java.util.Map;
import java.util.TreeMap;

public class Main {
    public static void main(String[] args) {
        String[] words = "the cat and the hat and the bat".split(" ");
        Map<String, Integer> counts = new TreeMap<>();
        for (String w : words) counts.merge(w, 1, Integer::sum);
        System.out.println(counts);
    }
}`,
      kotlin: `fun main() {
    val words = "the cat and the hat and the bat".split(" ")
    val counts = words.groupingBy { it }.eachCount().toSortedMap()
    println(counts)
}`,
      output: '{and=2, bat=1, cat=1, hat=1, the=3}',
      note: '`groupingBy { it }.eachCount()` counts in one call. With a mutable map: `counts[w] = (counts[w] ?: 0) + 1`. `toSortedMap()` is a `TreeMap`, sorted by key as Java\'s is here.' },
    { id: 'read-only-copy', title: 'Copies and read-only views', keywords: ['unmodifiableList', 'List.copyOf', 'read-only', 'toMutableList', 'copy', 'UnsupportedOperationException'],
      java: `import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> original = List.of(1, 2);
        List<Integer> copy = new ArrayList<>(original);
        copy.add(3);
        try {
            original.add(4);
        } catch (UnsupportedOperationException e) {
            System.out.println("cannot add to List.of");
        }
        System.out.println(original + " " + copy);
    }
}`,
      kotlin: `fun main() {
    val original = listOf(1, 2)
    val copy = original.toMutableList()
    copy.add(3)
    println("cannot add to List.of")
    println("$original $copy")
}`,
      output: `cannot add to List.of
[1, 2] [1, 2, 3]`,
      note: 'Java can only throw when you add to an unmodifiable list. In Kotlin, `original.add(4)` does not compile: `List` has no `add`. (Read-only is not immutable, though: a `List` may be a view of a list someone else changes. See [[q:read-only-collections]].)' },
    { id: 'arrays', title: 'Arrays', keywords: ['array', 'int[]', 'Arrays.sort', 'Arrays.toString', 'IntArray', 'contentToString'],
      java: `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] numbers = {5, 3, 8};
        Arrays.sort(numbers);
        String[] names = new String[2];
        names[0] = "a";
        System.out.println(Arrays.toString(numbers) + " " + numbers.length + " " + Arrays.toString(names));
    }
}`,
      kotlin: `fun main() {
    val numbers = intArrayOf(5, 3, 8)
    numbers.sort()
    val names = arrayOfNulls<String>(2)
    names[0] = "a"
    println("\${numbers.contentToString()} \${numbers.size} \${names.contentToString()}")
}`,
      output: '[3, 5, 8] 3 [a, null]',
      note: '`IntArray` is Java\'s `int[]` and `Array<String>` is `String[]`. An array\'s `toString` is Java\'s (`[I@1b6d3586`), so print it with `contentToString()`. Most Kotlin code uses lists instead.' },
    { id: 'first-last', title: 'First, last, and safe access', keywords: ['getFirst', 'getLast', 'first', 'last', 'firstOrNull', 'getOrNull', 'index'],
      java: `import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> xs = List.of("a", "b", "c");
        String third = xs.size() > 2 ? xs.get(2) : null;
        String tenth = xs.size() > 9 ? xs.get(9) : null;
        System.out.println(xs.getFirst() + " " + xs.getLast() + " " + third + " " + tenth);
    }
}`,
      kotlin: `fun main() {
    val xs = listOf("a", "b", "c")
    println("\${xs.first()} \${xs.last()} \${xs.getOrNull(2)} \${xs.getOrNull(9)}")
}`,
      output: 'a c c null',
      note: '`first()` and `last()` throw on an empty list, as Java 21\'s `getFirst()` does; their `OrNull` versions (`firstOrNull()`, `getOrNull(i)`) return null instead. `xs[2]` is `get(2)`.' }
  ]);

  /* ---------------------------------------------------------------- streams */
  add('streams', [
    { id: 'filter-map', title: 'filter, map, collect', keywords: ['stream', 'filter', 'map', 'collect', 'Collectors.toList', 'toList'],
      java: `import java.util.List;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6);
        List<Integer> squares = numbers.stream()
            .filter(n -> n % 2 == 0)
            .map(n -> n * n)
            .collect(Collectors.toList());
        System.out.println(squares);
    }
}`,
      kotlin: `fun main() {
    val numbers = listOf(1, 2, 3, 4, 5, 6)
    val squares = numbers
        .filter { it % 2 == 0 }
        .map { it * it }
    println(squares)
}`,
      output: '[4, 16, 36]',
      note: 'The operations are on the collection itself: no `stream()`, no `collect`. Each step makes a new list (eager); for long chains over big data, `asSequence()` makes it lazy like a stream. See [[lesson:kt-collection-ops]].' },
    { id: 'sum-average', title: 'Sums, averages, min and max', keywords: ['mapToInt', 'sum', 'average', 'max', 'sumOf', 'maxOf', 'IntStream'],
      java: `import java.util.List;

public class Main {
    record Item(String name, int price) {}

    public static void main(String[] args) {
        List<Item> cart = List.of(new Item("tea", 30), new Item("cake", 120), new Item("bun", 15));
        int total = cart.stream().mapToInt(Item::price).sum();
        double avg = cart.stream().mapToInt(Item::price).average().orElse(0);
        String priciest = cart.stream().max((a, b) -> a.price() - b.price()).map(Item::name).orElse("none");
        System.out.println(total + " " + avg + " " + priciest);
    }
}`,
      kotlin: `data class Item(val name: String, val price: Int)

fun main() {
    val cart = listOf(Item("tea", 30), Item("cake", 120), Item("bun", 15))
    val total = cart.sumOf { it.price }
    val avg = cart.map { it.price }.average()
    val priciest = cart.maxByOrNull { it.price }?.name ?: "none"
    println("$total $avg $priciest")
}`,
      output: '165 55.0 cake',
      note: '`sumOf { }`, `maxByOrNull { }`, `minOf { }` take the selector directly. `average()` on an empty list gives `NaN` rather than an empty `OptionalDouble`.' },
    { id: 'grouping', title: 'groupingBy → groupBy', keywords: ['groupingBy', 'Collectors.groupingBy', 'groupBy', 'partitioningBy', 'partition'],
      java: `import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<String> words = List.of("fig", "pear", "kiwi", "banana", "plum");
        Map<Integer, List<String>> byLength = words.stream()
            .collect(Collectors.groupingBy(String::length, TreeMap::new, Collectors.toList()));
        Map<Boolean, List<String>> shortOnes = words.stream().collect(Collectors.partitioningBy(w -> w.length() <= 4));
        System.out.println(byLength);
        System.out.println(shortOnes.get(true) + " " + shortOnes.get(false));
    }
}`,
      kotlin: `fun main() {
    val words = listOf("fig", "pear", "kiwi", "banana", "plum")
    val byLength = words.groupBy { it.length }.toSortedMap()
    val (shortOnes, longOnes) = words.partition { it.length <= 4 }
    println(byLength)
    println("$shortOnes $longOnes")
}`,
      output: `{3=[fig], 4=[pear, kiwi, plum], 6=[banana]}
[fig, pear, kiwi, plum] [banana]`,
      note: '`groupBy` returns a `Map<K, List<V>>`, keeping the order keys first appear (`toSortedMap()` sorts it, like the `TreeMap` here). `partition` returns a `Pair` of lists, taken apart with `val (a, b)`.' },
    { id: 'sorting', title: 'Sorting by several keys', keywords: ['Comparator.comparing', 'thenComparing', 'sorted', 'sortedBy', 'compareBy', 'sortedWith', 'reversed'],
      java: `import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class Main {
    record Person(String name, int age) {}

    public static void main(String[] args) {
        List<Person> people = List.of(new Person("Ravi", 41), new Person("Asha", 30), new Person("Li", 30));
        System.out.println(people.stream()
            .sorted(Comparator.comparing(Person::age).thenComparing(Person::name))
            .map(Person::name).collect(Collectors.toList()));
        System.out.println(people.stream()
            .sorted(Comparator.comparing(Person::age).reversed())
            .map(Person::name).collect(Collectors.toList()));
    }
}`,
      kotlin: `data class Person(val name: String, val age: Int)

fun main() {
    val people = listOf(Person("Ravi", 41), Person("Asha", 30), Person("Li", 30))
    println(people.sortedWith(compareBy({ it.age }, { it.name })).map { it.name })
    println(people.sortedByDescending { it.age }.map { it.name })
}`,
      output: `[Asha, Li, Ravi]
[Ravi, Asha, Li]`,
      note: '`sortedBy { }` sorts by one key and `compareBy({ … }, { … })` builds a comparator from several. Both sorts are stable, so Asha stays before Li in the second line, in both languages.' },
    { id: 'distinct-take', title: 'distinct, skip, limit', keywords: ['distinct', 'skip', 'limit', 'drop', 'take', 'takeWhile'],
      java: `import java.util.List;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<Integer> xs = List.of(5, 5, 1, 4, 1, 9, 2);
        System.out.println(xs.stream().distinct().skip(1).limit(2).collect(Collectors.toList()));
        System.out.println(xs.stream().takeWhile(x -> x > 2).collect(Collectors.toList()));
    }
}`,
      kotlin: `fun main() {
    val xs = listOf(5, 5, 1, 4, 1, 9, 2)
    println(xs.distinct().drop(1).take(2))
    println(xs.takeWhile { it > 2 })
}`,
      output: `[1, 4]
[5, 5]`,
      note: 'Java\'s `skip` and `limit` are Kotlin\'s `drop` and `take`; `takeWhile` and `dropWhile` have the same names. `distinct()` keeps the first of each.' },
    { id: 'matching', title: 'anyMatch, allMatch, findFirst', keywords: ['anyMatch', 'allMatch', 'noneMatch', 'findFirst', 'any', 'all', 'none', 'firstOrNull'],
      java: `import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> xs = List.of(3, 8, 12, 5);
        boolean anyBig = xs.stream().anyMatch(x -> x > 10);
        boolean allPositive = xs.stream().allMatch(x -> x > 0);
        int firstEven = xs.stream().filter(x -> x % 2 == 0).findFirst().orElse(-1);
        System.out.println(anyBig + " " + allPositive + " " + firstEven);
    }
}`,
      kotlin: `fun main() {
    val xs = listOf(3, 8, 12, 5)
    val anyBig = xs.any { it > 10 }
    val allPositive = xs.all { it > 0 }
    val firstEven = xs.firstOrNull { it % 2 == 0 } ?: -1
    println("$anyBig $allPositive $firstEven")
}`,
      output: 'true true 8',
      note: '`any { }`, `all { }` and `none { }` read like the question. `firstOrNull { }` replaces `filter(…).findFirst()`, returning null rather than an empty `Optional`.' },
    { id: 'flatmap-joining', title: 'flatMap and joining', keywords: ['flatMap', 'Collectors.joining', 'joinToString', 'flatten'],
      java: `import java.util.List;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<List<String>> teams = List.of(List.of("Asha", "Ravi"), List.of("Li"));
        String everyone = teams.stream()
            .flatMap(List::stream)
            .map(String::toUpperCase)
            .collect(Collectors.joining(", ", "[", "]"));
        System.out.println(everyone);
    }
}`,
      kotlin: `fun main() {
    val teams = listOf(listOf("Asha", "Ravi"), listOf("Li"))
    val everyone = teams.flatten().joinToString(", ", "[", "]") { it.uppercase() }
    println(everyone)
}`,
      output: '[ASHA, RAVI, LI]',
      note: '`flatten()` joins a list of lists; `flatMap { }` maps each item to a list and joins the results. `joinToString` takes the separator, prefix, postfix and a transform in one call.' },
    { id: 'iterate', title: 'Infinite streams → sequences', keywords: ['Stream.iterate', 'generate', 'generateSequence', 'sequence', 'lazy', 'infinite'],
      java: `import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Main {
    public static void main(String[] args) {
        System.out.println(Stream.iterate(1, x -> x * 2).limit(6).collect(Collectors.toList()));
        System.out.println(Stream.iterate(1, x -> x * 3).filter(x -> x > 100).findFirst().get());
    }
}`,
      kotlin: `fun main() {
    println(generateSequence(1) { it * 2 }.take(6).toList())
    println(generateSequence(1) { it * 3 }.first { it > 100 })
}`,
      output: `[1, 2, 4, 8, 16, 32]
243`,
      note: 'A `Sequence` is lazy like a stream: nothing runs until a terminal call (`toList`, `first`, `sum`). Unlike a stream it can be gone over more than once. See [[lesson:kt-sequences]].' }
  ]);

  /* ---------------------------------------------------------------- classes */
  add('classes', [
    { id: 'record-data-class', title: 'record → data class', keywords: ['record', 'data class', 'equals', 'hashCode', 'toString', 'copy', 'value object'],
      java: `public class Main {
    record Point(int x, int y) {
        Point withX(int newX) { return new Point(newX, y); }
    }

    public static void main(String[] args) {
        Point a = new Point(1, 2);
        Point b = a.withX(5);
        System.out.println(a.x() + "," + a.y() + " " + b.x() + "," + b.y() + " " + a.equals(new Point(1, 2)));
    }
}`,
      kotlin: `data class Point(val x: Int, val y: Int)

fun main() {
    val a = Point(1, 2)
    val b = a.copy(x = 5)
    println("\${a.x},\${a.y} \${b.x},\${b.y} \${a == Point(1, 2)}")
}`,
      output: '1,2 5,2 true',
      note: 'A data class gets `equals`, `hashCode`, `toString`, `copy` and `componentN`. `copy(x = 5)` replaces the hand-written "wither". Unlike a record, a data class can have `var` properties and can extend a class. (Their `toString`s differ: `Point[x=1, y=2]` and `Point(x=1, y=2)`.) See [[lesson:kt-data-classes]].' },
    { id: 'bean-property', title: 'Fields with getters and setters → properties', keywords: ['getter', 'setter', 'bean', 'property', 'private field', 'validation'],
      java: `public class Main {
    static class Account {
        private int balance;
        public int getBalance() { return balance; }
        public void setBalance(int value) {
            if (value < 0) throw new IllegalArgumentException("negative");
            balance = value;
        }
    }

    public static void main(String[] args) {
        Account a = new Account();
        a.setBalance(50);
        a.setBalance(a.getBalance() + 25);
        System.out.println(a.getBalance());
    }
}`,
      kotlin: `class Account {
    var balance: Int = 0
        set(value) {
            require(value >= 0) { "negative" }
            field = value
        }
}

fun main() {
    val a = Account()
    a.balance = 50
    a.balance += 25
    println(a.balance)
}`,
      output: '75',
      note: 'A property is the field, the getter and the setter in one. Add a `set(value)` (or `get()`) only when it does something; `field` is the stored value. Java callers still see `getBalance()` and `setBalance()`. See [[lesson:kt-properties]].' },
    { id: 'constructors', title: 'Constructor overloads → default arguments', keywords: ['constructor', 'overload', 'default argument', 'this(...)', 'telescoping'],
      java: `public class Main {
    static class Server {
        final String host;
        final int port;
        final boolean secure;
        Server(String host) { this(host, 80); }
        Server(String host, int port) { this(host, port, false); }
        Server(String host, int port, boolean secure) { this.host = host; this.port = port; this.secure = secure; }
        String url() { return (secure ? "https" : "http") + "://" + host + ":" + port; }
    }

    public static void main(String[] args) {
        System.out.println(new Server("a.com").url());
        System.out.println(new Server("b.com", 8443, true).url());
    }
}`,
      kotlin: `class Server(val host: String, val port: Int = 80, val secure: Boolean = false) {
    fun url() = "\${if (secure) "https" else "http"}://$host:$port"
}

fun main() {
    println(Server("a.com").url())
    println(Server("b.com", 8443, secure = true).url())
}`,
      output: `http://a.com:80
https://b.com:8443`,
      note: 'One primary constructor with defaults replaces the chain of overloads, and named arguments (`secure = true`) say what each value is. `@JvmOverloads` writes the overloads for Java callers. See [[lesson:kt-constructors]].' },
    { id: 'singleton', title: 'Singletons → object', keywords: ['singleton', 'getInstance', 'object', 'INSTANCE', 'static instance'],
      java: `import java.util.ArrayList;
import java.util.List;

public class Main {
    static final class Registry {
        private static final Registry INSTANCE = new Registry();
        private final List<String> names = new ArrayList<>();
        private Registry() {}
        static Registry getInstance() { return INSTANCE; }
        void register(String name) { names.add(name); }
        int count() { return names.size(); }
    }

    public static void main(String[] args) {
        Registry.getInstance().register("a");
        Registry.getInstance().register("b");
        System.out.println(Registry.getInstance().count());
    }
}`,
      kotlin: `object Registry {
    private val names = mutableListOf<String>()
    fun register(name: String) {
        names.add(name)
    }
    fun count() = names.size
}

fun main() {
    Registry.register("a")
    Registry.register("b")
    println(Registry.count())
}`,
      output: '2',
      note: '`object` declares the class and its one instance, created on first use, thread-safely. Java code reaches it as `Registry.INSTANCE`. See [[lesson:kt-objects]].' },
    { id: 'static-members', title: 'static members → companion object', keywords: ['static', 'companion object', 'factory', 'static method', 'counter'],
      java: `public class Main {
    static class User {
        private static int created = 0;
        final String name;
        private User(String name) { this.name = name; created++; }
        static User of(String name) { return new User(name.trim()); }
        static int created() { return created; }
    }

    public static void main(String[] args) {
        User a = User.of(" Asha ");
        User.of("Ravi");
        System.out.println(a.name + " " + User.created());
    }
}`,
      kotlin: `class User private constructor(val name: String) {
    companion object {
        var created = 0
            private set

        fun of(name: String): User {
            created++
            return User(name.trim())
        }
    }
}

fun main() {
    val a = User.of(" Asha ")
    User.of("Ravi")
    println("\${a.name} \${User.created}")
}`,
      output: 'Asha 2',
      note: 'Kotlin has no `static`: what belongs to the class goes in its `companion object`, called the same way (`User.of(…)`). Plain helper functions can simply live at the top level of the file. See [[q:object-companion]].' },
    { id: 'inheritance', title: 'Abstract classes and overriding', keywords: ['abstract', 'extends', 'override', '@Override', 'open', 'final', 'inheritance'],
      java: `import java.util.List;

public class Main {
    static abstract class Shape {
        abstract double area();
        String describe() { return getClass().getSimpleName() + " " + area(); }
    }
    static class Square extends Shape {
        final double side;
        Square(double side) { this.side = side; }
        @Override double area() { return side * side; }
    }
    static class Rect extends Shape {
        final double w, h;
        Rect(double w, double h) { this.w = w; this.h = h; }
        @Override double area() { return w * h; }
    }

    public static void main(String[] args) {
        for (Shape s : List.of(new Square(3), new Rect(2, 5))) System.out.println(s.describe());
    }
}`,
      kotlin: `abstract class Shape {
    abstract fun area(): Double
    fun describe() = "\${this::class.simpleName} \${area()}"
}

class Square(val side: Double) : Shape() {
    override fun area() = side * side
}

class Rect(val w: Double, val h: Double) : Shape() {
    override fun area() = w * h
}

fun main() {
    for (s in listOf(Square(3.0), Rect(2.0, 5.0))) println(s.describe())
}`,
      output: `Square 9.0
Rect 10.0`,
      note: '`: Shape()` extends it and calls its constructor. `override` is a required keyword, not an annotation. Classes and members are final unless `open` (an `abstract` class is open). Note `3.0`: Kotlin does not turn an `Int` into a `Double`. See [[lesson:kt-inheritance]].' },
    { id: 'enums', title: 'Enums with fields', keywords: ['enum', 'enum class', 'values', 'entries', 'switch on enum', 'when'],
      java: `public class Main {
    enum Planet {
        MERCURY(0.38), EARTH(1.0), JUPITER(2.53);
        final double gravity;
        Planet(double gravity) { this.gravity = gravity; }
    }

    public static void main(String[] args) {
        for (Planet p : Planet.values()) {
            String kind = switch (p) {
                case JUPITER -> "giant";
                default -> "rocky";
            };
            System.out.println(p + " " + p.gravity + " " + kind + " " + p.ordinal());
        }
    }
}`,
      kotlin: `enum class Planet(val gravity: Double) {
    MERCURY(0.38), EARTH(1.0), JUPITER(2.53)
}

fun main() {
    for (p in Planet.entries) {
        val kind = when (p) {
            Planet.JUPITER -> "giant"
            Planet.MERCURY, Planet.EARTH -> "rocky"
        }
        println("$p \${p.gravity} $kind \${p.ordinal}")
    }
}`,
      output: `MERCURY 0.38 rocky 0
EARTH 1.0 rocky 1
JUPITER 2.53 giant 2`,
      note: '`entries` (Kotlin 1.9) replaces `values()`, without copying an array each time. A `when` that lists every constant needs no `else`, so adding a planet makes the compiler point at it. See [[lesson:kt-enums]].' },
    { id: 'sealed', title: 'Sealed types and pattern switch', keywords: ['sealed', 'permits', 'record patterns', 'pattern matching', 'switch', 'exhaustive'],
      java: `public class Main {
    sealed interface Shape permits Circle, Rect {}
    record Circle(double r) implements Shape {}
    record Rect(double w, double h) implements Shape {}

    static String area(Shape s) {
        return switch (s) {
            case Circle c -> "circle " + 3 * c.r() * c.r();
            case Rect(double w, double h) -> "rect " + w * h;
        };
    }

    public static void main(String[] args) {
        System.out.println(area(new Circle(2)));
        System.out.println(area(new Rect(2, 3)));
    }
}`,
      kotlin: `sealed interface Shape
data class Circle(val r: Double) : Shape
data class Rect(val w: Double, val h: Double) : Shape

fun area(s: Shape): String = when (s) {
    is Circle -> "circle \${3 * s.r * s.r}"
    is Rect -> "rect \${s.w * s.h}"
}

fun main() {
    println(area(Circle(2.0)))
    println(area(Rect(2.0, 3.0)))
}`,
      output: `circle 12.0
rect 6.0`,
      note: 'Both check that every subtype is handled. Kotlin needs no `permits` (the compiler finds the subtypes in the package) and smart-casts `s` instead of naming a new variable. See [[lesson:kt-sealed]].' }
  ]);

  /* ---------------------------------------------------------------- equality */
  add('equality', [
    { id: 'identity', title: 'Same object or same value', keywords: ['==', 'equals', '===', 'identity', 'reference equality'],
      java: `import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> a = new java.util.ArrayList<>(List.of(1, 2));
        List<Integer> b = new java.util.ArrayList<>(List.of(1, 2));
        System.out.println(a.equals(b) + " " + (a == b) + " " + (a == a));
    }
}`,
      kotlin: `fun main() {
    val a = mutableListOf(1, 2)
    val b = mutableListOf(1, 2)
    println("\${a == b} \${a === b} \${a === a}")
}`,
      output: 'true false true',
      note: 'Kotlin\'s `==` is `equals` and `===` is identity, the opposite of what Java\'s `==` suggests. See [[lesson:kt-equality]].' },
    { id: 'equals-hashcode', title: 'equals and hashCode by hand → data class', keywords: ['equals', 'hashCode', 'Objects.equals', 'Objects.hash', 'data class', 'HashSet'],
      java: `import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class Main {
    static final class Email {
        final String user, domain;
        Email(String user, String domain) { this.user = user; this.domain = domain; }
        @Override public boolean equals(Object o) {
            return o instanceof Email e && user.equals(e.user) && domain.equals(e.domain);
        }
        @Override public int hashCode() { return Objects.hash(user, domain); }
    }

    public static void main(String[] args) {
        Set<Email> set = new HashSet<>();
        set.add(new Email("asha", "x.com"));
        set.add(new Email("asha", "x.com"));
        System.out.println(set.size() + " " + set.contains(new Email("asha", "x.com")));
    }
}`,
      kotlin: `data class Email(val user: String, val domain: String)

fun main() {
    val set = hashSetOf(Email("asha", "x.com"), Email("asha", "x.com"))
    println("\${set.size} \${Email("asha", "x.com") in set}")
}`,
      output: '1 true',
      note: 'The data class writes both, consistently, from the constructor properties. Writing them by hand in Kotlin looks like Java: `override fun equals(other: Any?) = other is Email && …`, and `hashCode` with it.' },
    { id: 'boxed-numbers', title: 'Boxed numbers and ==', keywords: ['Integer', 'Integer cache', 'boxing', '==', 'equals', 'autoboxing'],
      java: `public class Main {
    public static void main(String[] args) {
        Integer a = 1000;
        Integer b = 1000;
        System.out.println(a.equals(b));
        System.out.println(a == b);
    }
}`,
      kotlin: `fun main() {
    val a: Int? = 1000
    val b: Int? = 1000
    println(a == b)
    println(a === b)
}`,
      output: `true
false`,
      note: 'Java\'s `==` on two `Integer`s compares the boxes: `true` up to 127 (they are cached), `false` above. Kotlin\'s `==` always compares the values; only `===` sees the boxes, and the compiler warns about it. Use `==`.' },
    { id: 'comparable', title: 'Comparable and compareTo', keywords: ['Comparable', 'compareTo', 'sorted', '<', '>', 'ordering'],
      java: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Main {
    record Version(int major, int minor) implements Comparable<Version> {
        public int compareTo(Version o) {
            return major != o.major ? Integer.compare(major, o.major) : Integer.compare(minor, o.minor);
        }
        public String toString() { return major + "." + minor; }
    }

    public static void main(String[] args) {
        List<Version> vs = new ArrayList<>(List.of(new Version(2, 1), new Version(1, 9), new Version(2, 0)));
        Collections.sort(vs);
        System.out.println(vs + " " + (new Version(1, 9).compareTo(new Version(2, 0)) < 0));
    }
}`,
      kotlin: `data class Version(val major: Int, val minor: Int) : Comparable<Version> {
    override fun compareTo(other: Version) = compareValuesBy(this, other, { it.major }, { it.minor })
    override fun toString() = "$major.$minor"
}

fun main() {
    val vs = listOf(Version(2, 1), Version(1, 9), Version(2, 0)).sorted()
    println("$vs \${Version(1, 9) < Version(2, 0)}")
}`,
      output: '[1.9, 2.0, 2.1] true',
      note: 'A Kotlin `Comparable` gets `<`, `>`, `<=` and `>=` for free: `a < b` calls `compareTo`. `compareValuesBy` compares by several keys in order. See [[lesson:kt-operators]].' }
  ]);

  /* ---------------------------------------------------------------- functions */
  add('functions', [
    { id: 'lambdas', title: 'Function<T, R> → function types', keywords: ['lambda', 'Function', 'BiFunction', 'Supplier', 'function type', 'apply'],
      java: `import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.function.Supplier;

public class Main {
    public static void main(String[] args) {
        Function<Integer, Integer> twice = x -> x * 2;
        BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;
        Supplier<String> hello = () -> "hello";
        System.out.println(twice.apply(3) + " " + add.apply(2, 5) + " " + hello.get() + " " + twice.andThen(x -> x + 1).apply(4));
    }
}`,
      kotlin: `fun main() {
    val twice: (Int) -> Int = { it * 2 }
    val add = { a: Int, b: Int -> a + b }
    val hello = { "hello" }
    val twiceThenInc: (Int) -> Int = { twice(it) + 1 }
    println("\${twice(3)} \${add(2, 5)} \${hello()} \${twiceThenInc(4)}")
}`,
      output: '6 7 hello 9',
      note: 'Kotlin has real function types, `(Int) -> Int`, so there is no zoo of `Function`, `BiFunction`, `Supplier`, `Consumer`. A function value is called like a function: `twice(3)`. `it` is the single parameter. See [[lesson:kt-lambdas]].' },
    { id: 'method-references', title: 'Method references', keywords: ['method reference', '::', 'String::length', 'function reference', 'constructor reference'],
      java: `import java.util.List;
import java.util.stream.Collectors;

public class Main {
    static boolean isShort(String s) { return s.length() <= 4; }

    public static void main(String[] args) {
        List<String> words = List.of("kiwi", "banana", "fig");
        System.out.println(words.stream().map(String::length).collect(Collectors.toList()));
        System.out.println(words.stream().filter(Main::isShort).collect(Collectors.toList()));
    }
}`,
      kotlin: `fun isShort(s: String) = s.length <= 4

fun main() {
    val words = listOf("kiwi", "banana", "fig")
    println(words.map(String::length))
    println(words.filter(::isShort))
}`,
      output: `[4, 6, 3]
[kiwi, fig]`,
      note: '`String::length` refers to a property here (it is one in Kotlin). A top-level function is `::isShort`; a constructor is `::User`; a bound reference is `user::greet`. See [[q:function-references]].' },
    { id: 'default-arguments', title: 'Overloads → default and named arguments', keywords: ['overload', 'default argument', 'named argument', 'optional parameter'],
      java: `public class Main {
    static String greet(String name) { return greet(name, "Hello"); }
    static String greet(String name, String greeting) { return greet(name, greeting, "!"); }
    static String greet(String name, String greeting, String end) { return greeting + ", " + name + end; }

    public static void main(String[] args) {
        System.out.println(greet("Asha"));
        System.out.println(greet("Ravi", "Hi", "."));
    }
}`,
      kotlin: `fun greet(name: String, greeting: String = "Hello", end: String = "!") = "$greeting, $name$end"

fun main() {
    println(greet("Asha"))
    println(greet("Ravi", greeting = "Hi", end = "."))
}`,
      output: `Hello, Asha!
Hi, Ravi.`,
      note: 'One function with defaults. Named arguments make a call readable, and let you skip any default, not only the last ones: `greet("Li", end = "?")`. See [[lesson:kt-functions]].' },
    { id: 'varargs', title: 'Varargs', keywords: ['varargs', '...', 'vararg', 'spread', '*'],
      java: `public class Main {
    static int sum(int... xs) {
        int total = 0;
        for (int x : xs) total += x;
        return total;
    }

    public static void main(String[] args) {
        int[] more = {4, 5};
        System.out.println(sum(1, 2, 3) + " " + sum(more) + " " + sum());
    }
}`,
      kotlin: `fun sum(vararg xs: Int): Int = xs.sum()

fun main() {
    val more = intArrayOf(4, 5)
    println("\${sum(1, 2, 3)} \${sum(*more)} \${sum()}")
}`,
      output: '6 9 0',
      note: 'Inside, `xs` is an `IntArray`. Passing an existing array needs the spread operator `*`, which also lets you mix: `sum(1, *more, 6)`.' },
    { id: 'utility-extension', title: 'Utility classes → extension functions', keywords: ['static utility', 'StringUtils', 'helper', 'extension function', 'util class'],
      java: `public class Main {
    static final class Strings {
        private Strings() {}
        static boolean isPalindrome(String s) {
            String clean = s.toLowerCase().replace(" ", "");
            return new StringBuilder(clean).reverse().toString().equals(clean);
        }
    }

    public static void main(String[] args) {
        System.out.println(Strings.isPalindrome("Never odd or even") + " " + Strings.isPalindrome("Kotlin"));
    }
}`,
      kotlin: `fun String.isPalindrome(): Boolean {
    val clean = lowercase().replace(" ", "")
    return clean == clean.reversed()
}

fun main() {
    println("\${"Never odd or even".isPalindrome()} \${"Kotlin".isPalindrome()}")
}`,
      output: 'true false',
      note: 'An extension function is called like a method of the type, and found by autocomplete after a dot. It is still a static function underneath (Java calls `MainKt.isPalindrome(s)`) and sees only the type\'s public members. See [[lesson:kt-extensions]].' },
    { id: 'callbacks', title: 'Callbacks: Consumer → (T) -> Unit', keywords: ['Consumer', 'callback', 'listener', 'higher-order function', 'Unit'],
      java: `import java.util.function.Consumer;

public class Main {
    static void download(String url, Consumer<String> onDone) {
        onDone.accept("got " + url);
    }

    public static void main(String[] args) {
        download("a.txt", result -> System.out.println(result));
        download("b.txt", System.out::println);
    }
}`,
      kotlin: `fun download(url: String, onDone: (String) -> Unit) {
    onDone("got $url")
}

fun main() {
    download("a.txt") { result -> println(result) }
    download("b.txt", ::println)
}`,
      output: `got a.txt
got b.txt`,
      note: 'A lambda that is the last argument goes after the brackets: `download("a.txt") { … }`. That one rule is what makes Kotlin\'s builders and DSLs read so naturally. See [[lesson:kt-higher-order]].' }
  ]);

  /* ---------------------------------------------------------------- exceptions */
  add('exceptions', [
    { id: 'checked-exceptions', title: 'Checked exceptions', keywords: ['checked exception', 'throws', 'IOException', 'catch', 'Files.readString'],
      java: `import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    static String load(String name) throws IOException {
        return Files.readString(Path.of(name));
    }

    public static void main(String[] args) {
        try {
            load("missing.txt");
        } catch (IOException e) {
            System.out.println("could not read: " + e.getClass().getSimpleName());
        }
    }
}`,
      kotlin: `import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path

fun load(name: String): String = Files.readString(Path.of(name))

fun main() {
    try {
        load("missing.txt")
    } catch (e: IOException) {
        println("could not read: \${e::class.simpleName}")
    }
}`,
      output: 'could not read: NoSuchFileException',
      note: 'Kotlin has no checked exceptions: `load` declares nothing, and callers catch only where they can do something. Add `@Throws(IOException::class)` so Java callers can catch it. See [[q:checked-exceptions]].' },
    { id: 'try-with-resources', title: 'try-with-resources → use', keywords: ['try-with-resources', 'AutoCloseable', 'Closeable', 'use', 'close'],
      java: `public class Main {
    static class Connection implements AutoCloseable {
        void send(String s) { System.out.println("sending " + s); }
        @Override public void close() { System.out.println("closed"); }
    }

    public static void main(String[] args) {
        try (Connection c = new Connection()) {
            c.send("hello");
        }
    }
}`,
      kotlin: `class Connection : AutoCloseable {
    fun send(s: String) = println("sending $s")
    override fun close() = println("closed")
}

fun main() {
    Connection().use { c ->
        c.send("hello")
    }
}`,
      output: `sending hello
closed`,
      note: '`use { }` closes the resource when the block ends, normally or with an exception, as try-with-resources does. It returns the block\'s value: `val text = reader.use { it.readText() }`.' },
    { id: 'try-expression', title: 'try as an expression', keywords: ['try', 'catch', 'expression', 'parseInt', 'toIntOrNull', 'NumberFormatException'],
      java: `public class Main {
    static int parseOr(String s, int fallback) {
        int n;
        try {
            n = Integer.parseInt(s);
        } catch (NumberFormatException e) {
            n = fallback;
        }
        return n;
    }

    public static void main(String[] args) {
        System.out.println(parseOr("42", 0) + " " + parseOr("4x2", 0));
        System.out.println(parseOr("4x2", 0));
    }
}`,
      kotlin: `fun parseOr(s: String, fallback: Int): Int = try {
    s.toInt()
} catch (e: NumberFormatException) {
    fallback
}

fun main() {
    println("\${parseOr("42", 0)} \${parseOr("4x2", 0)}")
    println("4x2".toIntOrNull() ?: 0)
}`,
      output: `42 0
0`,
      note: '`try` gives a value, so no variable is declared first. For parsing, `toIntOrNull() ?: 0` avoids the exception altogether. See [[lesson:kt-exceptions]].' },
    { id: 'preconditions', title: 'Guard clauses: require and check', keywords: ['IllegalArgumentException', 'IllegalStateException', 'require', 'check', 'precondition', 'error'],
      java: `public class Main {
    static int withdraw(int balance, int amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount must be positive: " + amount);
        if (amount > balance) throw new IllegalStateException("insufficient funds");
        return balance - amount;
    }

    public static void main(String[] args) {
        System.out.println(withdraw(100, 30));
        try { withdraw(100, -5); } catch (IllegalArgumentException e) { System.out.println(e.getMessage()); }
        try { withdraw(10, 30); } catch (IllegalStateException e) { System.out.println(e.getMessage()); }
    }
}`,
      kotlin: `fun withdraw(balance: Int, amount: Int): Int {
    require(amount > 0) { "amount must be positive: $amount" }
    check(amount <= balance) { "insufficient funds" }
    return balance - amount
}

fun main() {
    println(withdraw(100, 30))
    try {
        withdraw(100, -5)
    } catch (e: IllegalArgumentException) {
        println(e.message)
    }
    try {
        withdraw(10, 30)
    } catch (e: IllegalStateException) {
        println(e.message)
    }
}`,
      output: `70
amount must be positive: -5
insufficient funds`,
      note: '`require` throws `IllegalArgumentException` (bad input), `check` throws `IllegalStateException` (bad state), `error("…")` throws `IllegalStateException` anywhere. The message is a lambda, built only when it fails.' },
    { id: 'multi-catch', title: 'Catching several types', keywords: ['multi-catch', 'catch', '|', 'when', 'is', 'exception types'],
      java: `public class Main {
    static void risky(int n) {
        if (n == 1) throw new IllegalArgumentException("bad argument");
        if (n == 2) throw new UnsupportedOperationException("not supported");
        throw new ArithmeticException("maths");
    }

    public static void main(String[] args) {
        for (int n = 1; n <= 3; n++) {
            try {
                risky(n);
            } catch (IllegalArgumentException | UnsupportedOperationException e) {
                System.out.println("caller error: " + e.getMessage());
            } catch (ArithmeticException e) {
                System.out.println("other: " + e.getMessage());
            }
        }
    }
}`,
      kotlin: `fun risky(n: Int): Nothing = when (n) {
    1 -> throw IllegalArgumentException("bad argument")
    2 -> throw UnsupportedOperationException("not supported")
    else -> throw ArithmeticException("maths")
}

fun main() {
    for (n in 1..3) {
        try {
            risky(n)
        } catch (e: RuntimeException) {
            when (e) {
                is IllegalArgumentException, is UnsupportedOperationException -> println("caller error: \${e.message}")
                else -> println("other: \${e.message}")
            }
        }
    }
}`,
      output: `caller error: bad argument
caller error: not supported
other: maths`,
      note: 'Kotlin has no `catch (A | B e)`. Catch a common parent and branch with `when (e) { is A, is B -> … }`, or write a `catch` for each type. `risky` returns `Nothing`: it never returns normally.' }
  ]);

  /* ---------------------------------------------------------------- generics */
  add('generics', [
    { id: 'bounded-generic', title: 'A generic method with a bound', keywords: ['generic method', 'extends', 'bound', 'Comparable', 'type parameter'],
      java: `import java.util.List;

public class Main {
    static <T extends Comparable<T>> T largest(List<T> items) {
        T best = items.get(0);
        for (T x : items) if (x.compareTo(best) > 0) best = x;
        return best;
    }

    public static void main(String[] args) {
        System.out.println(largest(List.of(3, 9, 4)) + " " + largest(List.of("pear", "zucchini", "apple")));
    }
}`,
      kotlin: `fun <T : Comparable<T>> largest(items: List<T>): T {
    var best = items.first()
    for (x in items) if (x > best) best = x
    return best
}

fun main() {
    println("\${largest(listOf(3, 9, 4))} \${largest(listOf("pear", "zucchini", "apple"))}")
}`,
      output: '9 zucchini',
      note: 'The bound is written with a colon, and a `Comparable` can be compared with `>`. (The standard library has it already: `items.max()`.) See [[lesson:kt-generics]].' },
    { id: 'wildcard-extends', title: '? extends → out', keywords: ['wildcard', '? extends', 'covariance', 'out', 'producer', 'PECS'],
      java: `import java.util.List;

public class Main {
    static double total(List<? extends Number> numbers) {
        double sum = 0;
        for (Number n : numbers) sum += n.doubleValue();
        return sum;
    }

    public static void main(String[] args) {
        List<Integer> ints = List.of(1, 2);
        List<Double> doubles = List.of(0.5, 0.25);
        System.out.println(total(ints) + " " + total(doubles));
    }
}`,
      kotlin: `fun total(numbers: List<Number>): Double = numbers.sumOf { it.toDouble() }

fun main() {
    val ints: List<Int> = listOf(1, 2)
    val doubles: List<Double> = listOf(0.5, 0.25)
    println("\${total(ints)} \${total(doubles)}")
}`,
      output: '3.0 0.75',
      note: 'No wildcard needed: Kotlin\'s `List` is declared `List<out E>`, so a `List<Int>` already is a `List<Number>`. Java must write `? extends` at every use. See [[q:generics-variance]].' },
    { id: 'wildcard-super', title: '? super → in', keywords: ['? super', 'contravariance', 'in', 'consumer', 'MutableList<in T>'],
      java: `import java.util.ArrayList;
import java.util.List;

public class Main {
    static void addNumbers(List<? super Integer> target) {
        for (int i = 1; i <= 3; i++) target.add(i);
    }

    public static void main(String[] args) {
        List<Number> numbers = new ArrayList<>();
        List<Object> objects = new ArrayList<>(List.of("start"));
        addNumbers(numbers);
        addNumbers(objects);
        System.out.println(numbers + " " + objects);
    }
}`,
      kotlin: `fun addNumbers(target: MutableList<in Int>) {
    for (i in 1..3) target.add(i)
}

fun main() {
    val numbers = mutableListOf<Number>()
    val objects = mutableListOf<Any>("start")
    addNumbers(numbers)
    addNumbers(objects)
    println("$numbers $objects")
}`,
      output: '[1, 2, 3] [start, 1, 2, 3]',
      note: '`MutableList` takes items in and gives them out, so it is invariant; `in Int` at the use site says this function only puts Ints in. That is Java\'s `? super Integer`.' },
    { id: 'class-token', title: 'Class<T> parameters → reified', keywords: ['Class<T>', 'type token', 'reified', 'filterIsInstance', 'type erasure', 'isInstance'],
      java: `import java.util.ArrayList;
import java.util.List;

public class Main {
    static <T> List<T> ofType(List<?> items, Class<T> type) {
        List<T> found = new ArrayList<>();
        for (Object o : items) if (type.isInstance(o)) found.add(type.cast(o));
        return found;
    }

    public static void main(String[] args) {
        List<Object> mixed = List.of(1, "two", 3.0, "four");
        System.out.println(ofType(mixed, String.class) + " " + ofType(mixed, Integer.class));
    }
}`,
      kotlin: `inline fun <reified T> ofType(items: List<*>): List<T> = items.filterIsInstance<T>()

fun main() {
    val mixed = listOf(1, "two", 3.0, "four")
    println("\${ofType<String>(mixed)} \${ofType<Int>(mixed)}")
}`,
      output: '[two, four] [1]',
      note: 'An `inline` function with a `reified` type parameter knows `T` at run time, so it can check `is T` without being handed a `Class<T>`. The standard library\'s `filterIsInstance<T>()` is one. See [[lesson:kt-reified]].' }
  ]);

  /* ---------------------------------------------------------------- interop */
  add('interop', [
    { id: 'class-literals', title: 'getClass() and .class', keywords: ['getClass', '.class', '::class', 'javaClass', 'Class', 'KClass', 'getSimpleName'],
      java: `public class Main {
    public static void main(String[] args) {
        Object o = "text";
        System.out.println(o.getClass().getSimpleName());
        System.out.println(String.class.getName());
        System.out.println(o.getClass() == String.class);
    }
}`,
      kotlin: `fun main() {
    val o: Any = "text"
    println(o::class.simpleName)
    println(String::class.java.name)
    println(o.javaClass == String::class.java)
}`,
      output: `String
java.lang.String
true`,
      note: '`o::class` is a Kotlin `KClass`; `o.javaClass` and `String::class.java` are Java `Class` objects, for Java APIs. See [[lesson:kt-annotations]].' },
    { id: 'nested-inner', title: 'Static nested and inner classes', keywords: ['static nested class', 'inner class', 'nested', 'inner', 'this@Outer'],
      java: `public class Main {
    static class Tree {
        String name = "oak";
        static class Seed { String kind() { return "seed"; } }      // no Tree needed
        class Leaf { String of() { return "leaf of " + name; } }      // holds a Tree
    }

    public static void main(String[] args) {
        Tree t = new Tree();
        System.out.println(new Tree.Seed().kind() + ", " + t.new Leaf().of());
    }
}`,
      kotlin: `class Tree {
    val name = "oak"

    class Seed {
        fun kind() = "seed"
    }

    inner class Leaf {
        fun of() = "leaf of $name"
    }
}

fun main() {
    val t = Tree()
    println("\${Tree.Seed().kind()}, \${t.Leaf().of()}")
}`,
      output: 'seed, leaf of oak',
      note: 'The defaults are swapped: a Kotlin nested class is Java\'s *static* nested class, holding no reference to the outer object; `inner` is Java\'s inner class. Safer, since an inner class keeps its outer object alive. See [[lesson:kt-value-inner]].' },
    { id: 'threads', title: 'Starting and joining threads', keywords: ['Thread', 'Runnable', 'start', 'join', 'thread', 'kotlin.concurrent'],
      java: `import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        AtomicInteger done = new AtomicInteger();
        Thread[] workers = new Thread[3];
        for (int i = 0; i < 3; i++) {
            workers[i] = new Thread(() -> done.incrementAndGet());
            workers[i].start();
        }
        for (Thread w : workers) w.join();
        System.out.println(done.get() + " workers finished");
    }
}`,
      kotlin: `import java.util.concurrent.atomic.AtomicInteger
import kotlin.concurrent.thread

fun main() {
    val done = AtomicInteger()
    val workers = List(3) { thread { done.incrementAndGet() } }
    workers.forEach { it.join() }
    println("\${done.get()} workers finished")
}`,
      output: '3 workers finished',
      note: '`thread { }` creates and starts a thread in one call. `InterruptedException` is checked in Java, so `main` must declare it; Kotlin\'s `main` declares nothing. For most concurrent work Kotlin code uses coroutines.' },
    { id: 'synchronized', title: 'synchronized', keywords: ['synchronized', 'lock', '@Synchronized', 'thread safety', 'race'],
      java: `public class Main {
    static int count = 0;
    static final Object lock = new Object();

    public static void main(String[] args) throws InterruptedException {
        Runnable work = () -> {
            for (int i = 0; i < 10_000; i++) {
                synchronized (lock) { count++; }
            }
        };
        Thread a = new Thread(work), b = new Thread(work);
        a.start(); b.start();
        a.join(); b.join();
        System.out.println(count);
    }
}`,
      kotlin: `import kotlin.concurrent.thread

var count = 0
val lock = Any()

fun main() {
    val work = {
        repeat(10_000) {
            synchronized(lock) { count++ }
        }
    }
    val a = thread { work() }
    val b = thread { work() }
    a.join()
    b.join()
    println(count)
}`,
      output: '20000',
      note: '`synchronized(lock) { }` is a standard-library function, not a keyword; `@Synchronized` on a function does what Java\'s `synchronized` modifier does. Without the lock, the count would often come out below 20000.' },
    { id: 'completable-future', title: 'CompletableFuture → coroutines', keywords: ['CompletableFuture', 'supplyAsync', 'thenCombine', 'async', 'await', 'coroutines', 'runBlocking'],
      java: `import java.util.concurrent.CompletableFuture;

public class Main {
    static int slowPrice(String item) {
        try { Thread.sleep(100); } catch (InterruptedException e) { throw new RuntimeException(e); }
        return item.length() * 10;
    }

    public static void main(String[] args) {
        CompletableFuture<Integer> tea = CompletableFuture.supplyAsync(() -> slowPrice("tea"));
        CompletableFuture<Integer> cake = CompletableFuture.supplyAsync(() -> slowPrice("cake"));
        System.out.println("total " + tea.thenCombine(cake, Integer::sum).join());
    }
}`,
      kotlin: `import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking

suspend fun slowPrice(item: String): Int {
    delay(100)
    return item.length * 10
}

fun main() = runBlocking {
    val tea = async { slowPrice("tea") }
    val cake = async { slowPrice("cake") }
    println("total \${tea.await() + cake.await()}")
}`,
      output: 'total 70',
      note: 'With coroutines, asynchronous code reads like ordinary code: `async` starts the work, `await()` waits for it without blocking a thread, and `delay` suspends instead of sleeping. Both prices load at the same time. The [[track:coroutines]] track (batch 4) explains it all; see [[q:launch-vs-async]].' }
  ]);
})(window.KLT);
