/*
 * Java <-> Python (#/java): side-by-side translations, grouped by topic.
 *
 * Topic shape: {id, title}
 * Entry shape: {id, topic, title, java (Java code, or text when javaLang is 'text'), python (code),
 *               output (exactly what the Python prints), note (Markdown), keywords?, runtimes?: ['server'],
 *               runs?: false with why (Markdown) for code that needs a package or a terminal}
 *
 * tests/check_data.py checks every entry has both sides and that the Python compiles;
 * tests/test_content.py runs every Python side on your Python, and tests/test_ui.py ("reference") in the
 * browser's: each must print exactly its `output`.
 */
(function (U) {
  function nl(s) { return /\n$/.test(s) ? s : s + '\n'; }

  U.data.javapyTopics = [
    { id: 'basics', title: 'Basics' },
    { id: 'strings', title: 'Strings' },
    { id: 'collections', title: 'Collections' },
    { id: 'streams', title: 'Streams' },
    { id: 'null', title: 'null and Optional' },
    { id: 'exceptions', title: 'Exceptions' },
    { id: 'classes', title: 'Classes' },
    { id: 'functional', title: 'Functions' },
    { id: 'concurrency', title: 'Concurrency' },
    { id: 'testing', title: 'Testing' },
    { id: 'tooling', title: 'Build and run' },
    { id: 'web', title: 'Web and data' }
  ];

  var E = U.data.javapy = [];
  function add(topic, rows) {
    rows.forEach(function (r) {
      r.topic = topic;
      r.python = nl(r.python);
      if (r.output !== undefined) r.output = nl(r.output);
      E.push(r);
    });
  }

  /* ---------------------------------------------------------------- basics */

  add('basics', [
    { id: 'main', title: 'A program\'s entry point', keywords: ['main', 'public static void main', '__main__'],
      java: String.raw`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from main()");
    }
}`,
      python: String.raw`def main():
    print("Hello from main()")

if __name__ == "__main__":     # true when the file is run, false when it is imported
    main()`,
      output: 'Hello from main()',
      note: 'A Python file runs from top to bottom; no class is needed. The `if __name__ == "__main__":` line is the convention for "only when this file is run directly", so the file can also be imported without starting the program.' },
    { id: 'variables', title: 'Variables and types', keywords: ['int', 'var', 'declaration', 'dynamic typing'],
      java: String.raw`int count = 3;
double price = 9.99;
String name = "Asha";
boolean active = true;
var items = new ArrayList<String>();`,
      python: String.raw`count = 3
price = 9.99
name = "Asha"
active = True
items = []
print(type(count).__name__, type(price).__name__, type(name).__name__, type(active).__name__, type(items).__name__)
count = "three"          # allowed: the name now points at a str
print(count)`,
      output: String.raw`int float str bool list
three`,
      note: 'No declarations: assigning makes the name. The **value** has a type, the name does not, so a name can later point at a value of another type. Type hints (`count: int = 3`) document the intent, and tools check them.' },
    { id: 'constants', title: 'Constants: final', keywords: ['final', 'static final', 'constant', 'Final'],
      java: String.raw`public static final int MAX_USERS = 100;`,
      python: String.raw`from typing import Final

MAX_USERS: Final = 100        # UPPER_CASE says "do not change"; type checkers enforce Final
print(MAX_USERS)`,
      output: '100',
      note: 'Python has no `final`: a constant is a module-level name in UPPER_CASE, and everyone agrees not to change it. `Final` lets a type checker (mypy, your IDE) report an assignment to it.' },
    { id: 'integers', title: 'Integer division and overflow', keywords: ['overflow', 'division', 'modulo', 'BigInteger', 'long'],
      java: String.raw`int big = Integer.MAX_VALUE;
System.out.println(big + 1);        // -2147483648: overflow
System.out.println(7 / 2);          // 3
System.out.println(-7 / 2);         // -3
System.out.println(-7 % 2);         // -1`,
      python: String.raw`big = 2_147_483_647
print(big + 1)          # ints never overflow
print(7 / 2, 7 // 2)    # / is always true division
print(-7 // 2, -7 % 2)  # // rounds down
print(2 ** 64)`,
      output: String.raw`2147483648
3.5 3
-4 1
18446744073709551616`,
      note: 'Python\'s `int` grows as needed: `int`, `long` and `BigInteger` in one. `/` always gives a float; `//` is whole-number division and rounds **down** (toward minus infinity), so it differs from Java for negative numbers, and so does `%`.' },
    { id: 'ternary', title: 'The ternary operator', keywords: ['?:', 'conditional expression'],
      java: String.raw`String label = score >= 50 ? "pass" : "fail";`,
      python: String.raw`score = 72
label = "pass" if score >= 50 else "fail"
print(label)`,
      output: 'pass',
      note: 'The condition goes in the middle: "pass if the score is at least 50, else fail".' },
    { id: 'switch', title: 'switch → match', keywords: ['switch', 'case', 'pattern matching'],
      java: String.raw`String describe(int code) {
    return switch (code) {
        case 200 -> "OK";
        case 301, 302 -> "Redirect";
        case 404 -> "Not found";
        default -> "Other";
    };
}`,
      python: String.raw`def describe(code):
    match code:
        case 200:
            return "OK"
        case 301 | 302:
            return "Redirect"
        case 404:
            return "Not found"
        case _:
            return "Other"

print([describe(c) for c in (200, 302, 404, 500)])`,
      output: "['OK', 'Redirect', 'Not found', 'Other']",
      note: '`match` (Python 3.10+) also takes apart lists, dicts and objects. For a simple lookup like this, a dict is often shorter: `{200: "OK", 404: "Not found"}.get(code, "Other")`.' },
    { id: 'loops', title: 'Counting loops', keywords: ['for', 'range', 'for loop'],
      java: String.raw`for (int i = 0; i < 3; i++) {
    System.out.println(i);
}
for (int i = 10; i > 0; i -= 4) {
    System.out.println(i);
}`,
      python: String.raw`for i in range(3):
    print(i)
for i in range(10, 0, -4):
    print(i)`,
      output: String.raw`0
1
2
10
6
2`,
      note: '`range(start, stop, step)` stops **before** `stop`, like `i < n`. Most Python loops do not count at all: `for item in items:`, and `enumerate(items)` when the index is needed.' },
    { id: 'varargs', title: 'Varargs and named arguments', keywords: ['varargs', '*args', 'keyword arguments', 'overloading'],
      java: String.raw`static int sum(int... nums) {
    return Arrays.stream(nums).sum();
}
sum(1, 2, 3);`,
      python: String.raw`def total(*nums, start=0):
    return start + sum(nums)

print(total(1, 2, 3), total(1, 2, start=10))`,
      output: '6 13',
      note: '`*nums` collects the extra arguments into a tuple. A parameter after it can only be passed by name, which replaces many Java overloads and builders: [[lesson:py-args-kwargs]].' }
  ]);

  /* ---------------------------------------------------------------- strings */

  add('strings', [
    { id: 'stringbuilder', title: 'StringBuilder → join', keywords: ['StringBuilder', 'join', 'concatenation'],
      java: String.raw`StringBuilder sb = new StringBuilder();
for (int i = 0; i < 5; i++) {
    if (sb.length() > 0) sb.append(", ");
    sb.append(i * i);
}
String result = sb.toString();`,
      python: String.raw`result = ", ".join(str(i * i) for i in range(5))
print(result)`,
      output: '0, 1, 4, 9, 16',
      note: 'Build the pieces, then `join` them once: no separator bookkeeping. The items must be strings, hence `str(...)`.' },
    { id: 'string-equals', title: 'Comparing strings: == and is', keywords: ['equals', 'equalsIgnoreCase', '=='],
      java: String.raw`String a = "hello";
String b = new String("hello");
a == b;                      // false: different objects
a.equals(b);                 // true
a.equalsIgnoreCase("HELLO"); // true`,
      python: String.raw`a = "hello"
b = "".join(["hel", "lo"])
print(a == b)                    # == compares the text
print(a is b)                    # is compares the objects
print(a.casefold() == "HELLO".casefold())`,
      output: String.raw`True
False
True`,
      note: 'Python\'s `==` is Java\'s `equals()`; Python\'s `is` is Java\'s `==`. So in Python the obvious comparison is the right one. See [[explain:identity]].' },
    { id: 'substring', title: 'substring and charAt → slicing', keywords: ['substring', 'charAt', 'slice'],
      java: String.raw`String s = "Python";
s.charAt(0);              // 'P'
s.charAt(s.length() - 1); // 'n'
s.substring(1, 4);        // "yth"
s.substring(2);           // "thon"`,
      python: String.raw`s = "Python"
print(s[0], s[-1], s[1:4], s[2:], s[::-1])`,
      output: 'P n yth thon nohtyP',
      note: 'Negative indexes count from the end; `[start:stop]` works the same on lists and tuples. There is no `char` type: `s[0]` is a string of length 1.' },
    { id: 'format', title: 'String.format → f-strings', keywords: ['String.format', 'printf', 'f-string'],
      java: String.raw`String msg = String.format("%-8s|%6.2f|%05d", "pen", 3.14159, 42);`,
      python: String.raw`name, price, qty = "pen", 3.14159, 42
print(f"{name:<8}|{price:6.2f}|{qty:05d}")
print(f"{price=:.1f}")          # name and value, for debugging`,
      output: String.raw`pen     |  3.14|00042
price=3.1`,
      note: 'Anything goes inside the braces, and the part after `:` is the format: `<8` left in 8 columns, `6.2f` two decimals in 6 columns, `05d` zero-padded.' },
    { id: 'text-blocks', title: 'Text blocks → triple quotes', keywords: ['text block', 'multiline string', 'dedent'],
      java: String.raw`String json = """
    {"name": "Asha",
     "city": "Pune"}
    """;`,
      python: String.raw`import textwrap

json_text = textwrap.dedent("""\
    {"name": "Asha",
     "city": "Pune"}
""")
print(json_text, end="")`,
      output: String.raw`{"name": "Asha",
 "city": "Pune"}`,
      note: 'Triple quotes keep the line breaks. Java strips the common indentation for you; in Python, `textwrap.dedent` does it, and the backslash after `"""` skips the first line break.' },
    { id: 'split-join', title: 'split and String.join', keywords: ['split', 'join'],
      java: String.raw`String[] parts = "a,b,,c".split(",");
String joined = String.join("-", parts);`,
      python: String.raw`parts = "a,b,,c".split(",")
print(parts)
print("-".join(parts))
print("  many   spaces  ".split())`,
      output: String.raw`['a', 'b', '', 'c']
a-b--c
['many', 'spaces']`,
      note: 'Python\'s `split` takes plain text, not a regular expression, and keeps empty parts. With no argument it splits on any run of whitespace and drops the empty ends.' }
  ]);

  /* ---------------------------------------------------------------- collections */

  add('collections', [
    { id: 'arraylist', title: 'ArrayList → list', keywords: ['ArrayList', 'List', 'add', 'size'],
      java: String.raw`List<String> names = new ArrayList<>();
names.add("Asha");
names.add(0, "Ravi");
names.remove("Asha");
int n = names.size();
boolean has = names.contains("Ravi");`,
      python: String.raw`names = []
names.append("Asha")
names.insert(0, "Ravi")
names.remove("Asha")
print(names, len(names), "Ravi" in names)`,
      output: "['Ravi'] 1 True",
      note: '`len(x)` replaces `.size()` and `.length`, and `in` replaces `.contains()`. A list can hold values of different types.' },
    { id: 'hashmap', title: 'HashMap → dict', keywords: ['HashMap', 'Map', 'put', 'entrySet', 'getOrDefault'],
      java: String.raw`Map<String, Integer> stock = new HashMap<>();
stock.put("pen", 5);
stock.put("ink", 2);
int pens = stock.getOrDefault("pen", 0);
for (Map.Entry<String, Integer> e : stock.entrySet()) {
    System.out.println(e.getKey() + "=" + e.getValue());
}`,
      python: String.raw`stock = {}
stock["pen"] = 5
stock["ink"] = 2
pens = stock.get("pen", 0)
for item, qty in stock.items():
    print(f"{item}={qty}")
print(pens, len(stock))`,
      output: String.raw`pen=5
ink=2
5 2`,
      note: 'A dict keeps the order keys were added in, like a `LinkedHashMap`. `d[key]` raises `KeyError` for a missing key; `d.get(key, default)` does not.' },
    { id: 'hashset', title: 'HashSet → set', keywords: ['HashSet', 'Set', 'retainAll', 'intersection'],
      java: String.raw`Set<String> seen = new HashSet<>(List.of("a", "b"));
seen.add("a");
Set<String> both = new HashSet<>(seen);
both.retainAll(Set.of("b", "c"));`,
      python: String.raw`seen = {"a", "b"}
seen.add("a")
both = seen & {"b", "c"}
print(len(seen), both)`,
      output: "2 {'b'}",
      note: 'Set algebra has operators: `|` union, `&` intersection, `-` difference. An empty set is `set()`, because `{}` is an empty dict.' },
    { id: 'arrays', title: 'Arrays → lists', keywords: ['array', 'int[]', 'Arrays.sort', 'new int'],
      java: String.raw`int[] scores = {90, 70, 85};
int[] zeros = new int[5];
Arrays.sort(scores);
System.out.println(Arrays.toString(scores));`,
      python: String.raw`scores = [90, 70, 85]
zeros = [0] * 5
scores.sort()
print(scores, zeros)
grid = [[0] * 3 for _ in range(2)]      # not [[0] * 3] * 2: that repeats one row
print(grid)`,
      output: String.raw`[70, 85, 90] [0, 0, 0, 0, 0]
[[0, 0, 0], [0, 0, 0]]`,
      note: 'Python uses lists where Java uses arrays (the `array` module and NumPy exist for numbers in bulk). A list prints itself; no `Arrays.toString` needed.' },
    { id: 'immutable', title: 'List.of → tuple', keywords: ['List.of', 'immutable', 'tuple', 'unmodifiable'],
      java: String.raw`List<Integer> point = List.of(3, 4);
point.add(5);   // UnsupportedOperationException`,
      python: String.raw`point = (3, 4)
x, y = point
print(x, y)
try:
    point[0] = 9
except TypeError as e:
    print("TypeError:", e)`,
      output: String.raw`3 4
TypeError: 'tuple' object does not support item assignment`,
      note: 'A tuple is a fixed sequence: it cannot change, so it can be a dict key. Unpacking (`x, y = point`) takes it apart.' },
    { id: 'computeifabsent', title: 'computeIfAbsent → defaultdict', keywords: ['computeIfAbsent', 'defaultdict', 'group', 'multimap'],
      java: String.raw`Map<Character, List<String>> byLetter = new TreeMap<>();
for (String w : List.of("apple", "avocado", "bean")) {
    byLetter.computeIfAbsent(w.charAt(0), k -> new ArrayList<>()).add(w);
}`,
      python: String.raw`from collections import defaultdict

by_letter = defaultdict(list)
for w in ["apple", "avocado", "bean"]:
    by_letter[w[0]].append(w)
print(dict(by_letter))`,
      output: "{'a': ['apple', 'avocado'], 'b': ['bean']}",
      note: 'A `defaultdict(list)` makes the empty list the first time a key is used. `dict.setdefault(key, [])` does the same for an ordinary dict.' },
    { id: 'comparator', title: 'Comparator → key=', keywords: ['Comparator', 'comparing', 'thenComparing', 'sort', 'key'],
      java: String.raw`people.sort(Comparator.comparing(Person::age)
                      .thenComparing(Person::name, Comparator.reverseOrder()));`,
      python: String.raw`people = [("Asha", 30), ("Ravi", 25), ("Li", 30)]
people.sort(key=lambda p: p[0], reverse=True)    # the second key first
people.sort(key=lambda p: p[1])                  # then the main key: sorts are stable
print(people)`,
      output: "[('Ravi', 25), ('Li', 30), ('Asha', 30)]",
      note: 'A `key=` function says what to sort by; returning a tuple sorts by several fields at once (`key=lambda p: (p[1], p[0])`). For a reversed second field, sort twice: Python\'s sort is stable.' },
    { id: 'deque', title: 'ArrayDeque → deque', keywords: ['ArrayDeque', 'Deque', 'Queue', 'stack'],
      java: String.raw`Deque<Integer> queue = new ArrayDeque<>();
queue.offerLast(1);
queue.offerLast(2);
queue.offerFirst(0);
int first = queue.pollFirst();`,
      python: String.raw`from collections import deque

queue = deque()
queue.append(1)
queue.append(2)
queue.appendleft(0)
first = queue.popleft()
print(first, queue)`,
      output: '0 deque([1, 2])',
      note: 'A `deque` is fast at both ends. A plain list is a fine **stack** (`append` and `pop`), but `pop(0)` on a long list is slow.' },
    { id: 'priorityqueue', title: 'PriorityQueue → heapq', keywords: ['PriorityQueue', 'heap', 'heapq'],
      java: String.raw`PriorityQueue<Integer> pq = new PriorityQueue<>(List.of(5, 1, 3));
pq.add(2);
pq.poll();   // 1
pq.poll();   // 2`,
      python: String.raw`import heapq

pq = [5, 1, 3]
heapq.heapify(pq)
heapq.heappush(pq, 2)
print(heapq.heappop(pq), heapq.heappop(pq))`,
      output: '1 2',
      note: '`heapq` keeps a plain list in heap order; the smallest item is always `pq[0]`. Push `(priority, item)` tuples to order things by priority.' },
    { id: 'treemap', title: 'TreeMap → sorted()', keywords: ['TreeMap', 'SortedMap', 'sorted'],
      java: String.raw`TreeMap<String, Integer> scores = new TreeMap<>(Map.of("ravi", 7, "asha", 9, "li", 8));
for (var e : scores.entrySet()) System.out.println(e.getKey() + " " + e.getValue());`,
      python: String.raw`scores = {"ravi": 7, "asha": 9, "li": 8}
for name in sorted(scores):
    print(name, scores[name])
print(sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[0])`,
      output: String.raw`asha 9
li 8
ravi 7
('asha', 9)`,
      note: 'Python has no sorted map built in: sort when you read, with `sorted(d)` or `sorted(d.items(), key=...)`. (The `sortedcontainers` package has one.)' }
  ]);

  /* ---------------------------------------------------------------- streams */

  add('streams', [
    { id: 'filter-map', title: 'filter, map, collect → a list comprehension', keywords: ['stream', 'filter', 'map', 'collect', 'comprehension'],
      java: String.raw`List<Integer> result = nums.stream()
    .filter(n -> n % 2 == 0)
    .map(n -> n * n)
    .collect(Collectors.toList());`,
      python: String.raw`nums = [1, 2, 3, 4, 5, 6]
result = [n * n for n in nums if n % 2 == 0]
print(result)`,
      output: '[4, 16, 36]',
      note: 'Read it as "n squared, for each n in nums, if n is even". [[lesson:py-comprehensions]] has more.' },
    { id: 'grouping', title: 'groupingBy → defaultdict and Counter', keywords: ['groupingBy', 'counting', 'Counter'],
      java: String.raw`Map<Integer, List<String>> byLength = words.stream()
    .collect(Collectors.groupingBy(String::length));
Map<String, Long> counts = words.stream()
    .collect(Collectors.groupingBy(w -> w, Collectors.counting()));`,
      python: String.raw`from collections import Counter, defaultdict

words = ["fig", "kiwi", "fig", "pear", "plum"]
by_length = defaultdict(list)
for w in words:
    by_length[len(w)].append(w)
print(dict(by_length))
print(Counter(words))`,
      output: String.raw`{3: ['fig', 'fig'], 4: ['kiwi', 'pear', 'plum']}
Counter({'fig': 2, 'kiwi': 1, 'pear': 1, 'plum': 1})`,
      note: '`Counter` is `groupingBy(..., counting())` in one call, with extras such as `most_common(3)`.' },
    { id: 'reduce-sum', title: 'sum, average, max → built-ins', keywords: ['sum', 'average', 'max', 'min', 'reduce', 'statistics'],
      java: String.raw`int total = nums.stream().mapToInt(Integer::intValue).sum();
double avg = nums.stream().mapToInt(Integer::intValue).average().orElse(0);
int max = Collections.max(nums);`,
      python: String.raw`nums = [4, 8, 15, 16, 23, 42]
print(sum(nums), sum(nums) / len(nums), max(nums), min(nums))
import statistics
print(statistics.mean(nums), statistics.median(nums))`,
      output: String.raw`108 18.0 42 4
18 15.5`,
      note: '`sum`, `max` and `min` work on any iterable; the `statistics` module adds `mean`, `median` and `stdev`. `functools.reduce` exists but is rarely the clearest way.' },
    { id: 'anymatch', title: 'anyMatch and allMatch → any and all', keywords: ['anyMatch', 'allMatch', 'noneMatch'],
      java: String.raw`boolean anyNegative = nums.stream().anyMatch(n -> n < 0);
boolean allEven = nums.stream().allMatch(n -> n % 2 == 0);
boolean noneHuge = nums.stream().noneMatch(n -> n > 100);`,
      python: String.raw`nums = [2, 4, -6]
print(any(n < 0 for n in nums), all(n % 2 == 0 for n in nums), not any(n > 100 for n in nums))`,
      output: 'True True True',
      note: 'With a generator expression inside, `any` and `all` stop at the first answer, just like the Java versions.' },
    { id: 'findfirst', title: 'findFirst → next()', keywords: ['findFirst', 'orElse', 'next'],
      java: String.raw`Optional<String> first = names.stream()
    .filter(n -> n.startsWith("R"))
    .findFirst();
String name = first.orElse("nobody");`,
      python: String.raw`names = ["Asha", "Ravi", "Rina"]
first = next((n for n in names if n.startswith("R")), "nobody")
print(first)
print(next((n for n in names if n.startswith("Z")), "nobody"))`,
      output: String.raw`Ravi
nobody`,
      note: '`next(generator, default)` takes the first match and stops; the default plays the part of `orElse`.' },
    { id: 'flatmap', title: 'flatMap → a nested comprehension', keywords: ['flatMap', 'flatten', 'nested'],
      java: String.raw`List<String> everyone = teams.stream()
    .flatMap(t -> t.members().stream())
    .toList();`,
      python: String.raw`teams = [["Asha", "Ravi"], ["Li"], []]
everyone = [member for team in teams for member in team]
print(everyone)`,
      output: "['Asha', 'Ravi', 'Li']",
      note: 'The `for` clauses go in the same order as nested loops would: outer first. `itertools.chain.from_iterable(teams)` does the same lazily.' },
    { id: 'distinct', title: 'distinct, sorted, limit', keywords: ['distinct', 'limit', 'sorted', 'skip'],
      java: String.raw`List<Integer> top3 = nums.stream()
    .distinct()
    .sorted(Comparator.reverseOrder())
    .limit(3)
    .toList();`,
      python: String.raw`nums = [5, 3, 5, 9, 1, 9, 7]
print(sorted(set(nums), reverse=True)[:3])
print(list(dict.fromkeys(nums)))       # distinct, keeping the first-seen order`,
      output: String.raw`[9, 7, 5]
[5, 3, 9, 1, 7]`,
      note: '`set` removes duplicates (and the order); `dict.fromkeys` removes them and keeps the order. A slice, `[:3]`, is `limit(3)`; `[3:]` is `skip(3)`.' },
    { id: 'joining', title: 'Collectors.joining → str.join', keywords: ['joining', 'join'],
      java: String.raw`String text = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.joining(", ", "[", "]"));`,
      python: String.raw`names = ["asha", "ravi"]
print("[" + ", ".join(n.upper() for n in names) + "]")`,
      output: '[ASHA, RAVI]',
      note: '`join` is a method of the separator and takes any iterable of strings, a generator expression included.' },
    { id: 'tomap', title: 'Collectors.toMap → a dict comprehension', keywords: ['toMap', 'dict comprehension'],
      java: String.raw`Map<String, Integer> lengths = words.stream()
    .collect(Collectors.toMap(w -> w, String::length));`,
      python: String.raw`words = ["pen", "pencil"]
lengths = {w: len(w) for w in words}
inverted = {v: k for k, v in lengths.items()}
print(lengths, inverted)`,
      output: "{'pen': 3, 'pencil': 6} {3: 'pen', 6: 'pencil'}",
      note: 'A duplicate key does not throw as `toMap` does: the last value wins.' },
    { id: 'lazy', title: 'A lazy Stream → a generator expression', keywords: ['lazy', 'Stream.iterate', 'generator', 'infinite'],
      java: String.raw`Stream.iterate(1, n -> n * 2)
      .filter(n -> n > 100)
      .findFirst();   // 128: only as many values as needed`,
      python: String.raw`from itertools import count

powers = (2 ** n for n in count())          # endless, but lazy
print(next(p for p in powers if p > 100))`,
      output: '128',
      note: 'Round brackets make a generator: nothing is computed until a value is asked for, so an endless source is fine. [[lesson:py-lazy-pipelines]] builds whole pipelines this way.' }
  ]);

  /* ---------------------------------------------------------------- null and Optional */

  add('null', [
    { id: 'optional', title: 'Optional and null checks', keywords: ['Optional', 'null', 'None', 'orElse', 'map'],
      java: String.raw`Optional<User> user = repo.findById(7);
String city = user.map(User::address)
                  .map(Address::city)
                  .orElse("unknown");`,
      python: String.raw`users = {7: {"address": {"city": "Pune"}}, 8: {"address": None}}

def city_of(user_id):
    user = users.get(user_id)
    if user is None or user["address"] is None:
        return "unknown"
    return user["address"]["city"]

print(city_of(7), city_of(8), city_of(9))`,
      output: 'Pune unknown unknown',
      note: 'Python has no `Optional` wrapper: a function returns the value or `None`, and the type hint says so (`-> User | None`). Check with `is None` and return early.' },
    { id: 'null-default', title: 'A default for null', keywords: ['default', 'requireNonNullElse', 'or'],
      java: String.raw`String name = input != null ? input : "guest";
String same = Objects.requireNonNullElse(input, "guest");`,
      python: String.raw`for given in ["Asha", None, ""]:
    print(repr(given if given is not None else "guest"), repr(given or "guest"))`,
      output: String.raw`'Asha' 'Asha'
'guest' 'guest'
'' 'guest'`,
      note: '`x or default` is short, but it replaces **every** falsy value: `""`, `0` and `[]` too. When those are valid, write `x if x is not None else default`.' },
    { id: 'npe', title: 'NullPointerException → AttributeError', keywords: ['NullPointerException', 'NPE', 'AttributeError', 'NoneType'],
      java: String.raw`String s = null;
s.length();     // NullPointerException`,
      python: String.raw`s = None
try:
    s.upper()
except AttributeError as e:
    print("AttributeError:", e)`,
      output: "AttributeError: 'NoneType' object has no attribute 'upper'",
      note: 'When you see `\'NoneType\' object has no attribute`, something was `None` where an object was expected: often a function that forgot to `return`.' },
    { id: 'requirenonnull', title: 'Objects.requireNonNull → raise early', keywords: ['requireNonNull', 'validation', 'ValueError'],
      java: String.raw`public Order(String id) {
    this.id = Objects.requireNonNull(id, "id must not be null");
}`,
      python: String.raw`class Order:
    def __init__(self, order_id: str):
        if order_id is None:
            raise ValueError("order_id must not be None")
        self.order_id = order_id

try:
    Order(None)
except ValueError as e:
    print("ValueError:", e)
print(Order("A-1").order_id)`,
      output: String.raw`ValueError: order_id must not be None
A-1`,
      note: 'Check at the boundary and raise a `ValueError` (or `TypeError`) with a clear message, so the failure points at the caller, not at some later line.' }
  ]);

  /* ---------------------------------------------------------------- exceptions */

  add('exceptions', [
    { id: 'try-catch', title: 'try / catch / finally', keywords: ['try', 'catch', 'finally', 'except'],
      java: String.raw`try {
    int n = Integer.parseInt(text);
} catch (NumberFormatException e) {
    System.out.println("bad number: " + e.getMessage());
} finally {
    System.out.println("done");
}`,
      python: String.raw`text = "12a"
try:
    n = int(text)
except ValueError as e:
    print("bad number:", e)
finally:
    print("done")`,
      output: String.raw`bad number: invalid literal for int() with base 10: '12a'
done`,
      note: '`catch (E e)` is `except E as e:`. Python adds an `else:` block that runs only when nothing was raised.' },
    { id: 'try-with-resources', title: 'try-with-resources → with', keywords: ['try-with-resources', 'AutoCloseable', 'with', 'close'],
      java: String.raw`try (BufferedWriter w = Files.newBufferedWriter(Path.of("log.txt"))) {
    w.write("started");
}   // closed here, even after an exception`,
      python: String.raw`with open("log.txt", "w", encoding="utf-8") as w:
    w.write("started")
print(w.closed)
with open("log.txt", encoding="utf-8") as r:
    print(r.read())`,
      output: String.raw`True
started`,
      note: 'Anything with `__enter__` and `__exit__` works in `with`: files, locks, database connections. `contextlib.contextmanager` makes your own in a few lines.' },
    { id: 'custom-exception', title: 'Your own exception class', keywords: ['custom exception', 'extends RuntimeException', 'Exception'],
      java: String.raw`public class InsufficientFundsException extends RuntimeException {
    private final double shortBy;
    public InsufficientFundsException(double shortBy) {
        super("short by " + shortBy);
        this.shortBy = shortBy;
    }
}`,
      python: String.raw`class InsufficientFundsError(Exception):
    def __init__(self, short_by):
        super().__init__(f"short by {short_by}")
        self.short_by = short_by

try:
    raise InsufficientFundsError(25.5)
except InsufficientFundsError as e:
    print(e, e.short_by)`,
      output: 'short by 25.5 25.5',
      note: 'Subclass `Exception` and end the name in `Error`. Often the whole class is `class InsufficientFundsError(Exception): pass`.' },
    { id: 'multi-catch', title: 'Multi-catch → a tuple of types', keywords: ['multi-catch', 'except tuple'],
      java: String.raw`try {
    load(value);
} catch (NumberFormatException | NullPointerException e) {
    System.out.println(e.getClass().getSimpleName());
}`,
      python: String.raw`def load(value):
    try:
        return int(value)
    except (TypeError, ValueError) as e:
        return type(e).__name__

print(load("7"), load("x"), load(None))`,
      output: '7 ValueError TypeError',
      note: 'One `except` with a tuple of types; or several `except` blocks in a row, checked from the top.' },
    { id: 'checked', title: 'Checked exceptions and throws', keywords: ['checked exception', 'throws', 'IOException'],
      java: String.raw`String read(Path p) throws IOException {
    return Files.readString(p);
}`,
      python: String.raw`def read(path):
    """Read a file. Raises FileNotFoundError if it is missing."""
    with open(path, encoding="utf-8") as f:
        return f.read()

try:
    read("nowhere.txt")
except OSError as e:
    print(type(e).__name__)`,
      output: 'FileNotFoundError',
      note: 'Every Python exception is unchecked: no `throws` clause and no forced `catch`. Say in the docstring what a function raises.' },
    { id: 'cause', title: 'Exception chaining: the cause', keywords: ['cause', 'chained exception', 'raise from'],
      java: String.raw`catch (SQLException e) {
    throw new RepositoryException("save failed", e);
}`,
      python: String.raw`class RepositoryError(Exception):
    pass

def save():
    try:
        {}["connection"]
    except KeyError as e:
        raise RepositoryError("save failed") from e

try:
    save()
except RepositoryError as e:
    print(e, "| cause:", repr(e.__cause__))`,
      output: "save failed | cause: KeyError('connection')",
      note: '`raise ... from e` stores the original as `__cause__`, and the traceback shows both, like Java\'s "Caused by:".' }
  ]);

  /* ---------------------------------------------------------------- classes */

  add('classes', [
    { id: 'pojo', title: 'A POJO with getters and setters', keywords: ['POJO', 'getter', 'setter', 'bean', 'class'],
      java: String.raw`public class Person {
    private String name;
    private int age;
    public Person(String name, int age) { this.name = name; this.age = age; }
    public String getName() { return name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
}`,
      python: String.raw`class Person:
    def __init__(self, name, age):
        self.name = name          # plain attributes: no getters or setters
        self.age = age

p = Person("Asha", 30)
p.age += 1
print(p.name, p.age)`,
      output: 'Asha 31',
      note: 'Python code reads and writes attributes directly. If you later need a check, turn the attribute into a property (next entry) and no caller changes. [[lesson:py-classes]].' },
    { id: 'property-validation', title: 'A setter with validation → @property', keywords: ['setter', 'property', 'validation'],
      java: String.raw`public void setAge(int age) {
    if (age < 0) throw new IllegalArgumentException("age < 0");
    this.age = age;
}`,
      python: String.raw`class Person:
    def __init__(self, age):
        self.age = age            # goes through the setter below

    @property
    def age(self):
        return self._age

    @age.setter
    def age(self, value):
        if value < 0:
            raise ValueError("age < 0")
        self._age = value

p = Person(30)
p.age = 31
try:
    p.age = -1
except ValueError as e:
    print("ValueError:", e)
print(p.age)`,
      output: String.raw`ValueError: age < 0
31`,
      note: 'Callers still write `p.age = 31`; the property runs the check. The value lives in `_age`, the underscore meaning "internal". [[lesson:py-properties]].' },
    { id: 'overloading', title: 'Constructor overloading → defaults and @classmethod', keywords: ['overloading', 'constructor', 'factory', 'classmethod'],
      java: String.raw`public Point() { this(0, 0); }
public Point(int x, int y) { this.x = x; this.y = y; }
public static Point fromString(String s) { ... }`,
      python: String.raw`class Point:
    def __init__(self, x=0, y=0):
        self.x, self.y = x, y

    @classmethod
    def from_string(cls, text):
        x, y = map(int, text.split(","))
        return cls(x, y)

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

print(Point(), Point(1, 2), Point.from_string("3,4"))`,
      output: 'Point(0, 0) Point(1, 2) Point(3, 4)',
      note: 'Python has no overloading: one `__init__` with default values covers most cases, and a `@classmethod` gives a named alternative constructor. [[lesson:py-classmethods]].' },
    { id: 'static', title: 'static fields and methods', keywords: ['static', 'class attribute', 'staticmethod'],
      java: String.raw`class Account {
    static int count = 0;
    Account() { count++; }
    static int total() { return count; }
}`,
      python: String.raw`class Account:
    count = 0                    # a class attribute: one for the whole class

    def __init__(self):
        Account.count += 1

    @staticmethod
    def total():
        return Account.count

Account()
Account()
print(Account.total(), Account.count)`,
      output: '2 2',
      note: 'Names assigned in the class body are class attributes, shared by every object. Many Java static utilities become plain module-level functions in Python.' },
    { id: 'equals-hashcode', title: 'toString, equals, hashCode → @dataclass', keywords: ['equals', 'hashCode', 'toString', 'Lombok', '@Data', 'dataclass'],
      java: String.raw`// about 40 lines: fields, a constructor, equals(), hashCode(), toString()
// or with Lombok:
@Data
public class Product {
    private String sku;
    private double price;
}`,
      python: String.raw`from dataclasses import dataclass

@dataclass
class Product:
    sku: str
    price: float

a = Product("P-1", 9.5)
print(a, a == Product("P-1", 9.5))`,
      output: "Product(sku='P-1', price=9.5) True",
      note: '`@dataclass` writes `__init__`, `__repr__` (toString) and `__eq__` (equals) from the fields. [[lesson:py-dataclasses-enums]].' },
    { id: 'record', title: 'record → frozen dataclass', keywords: ['record', 'immutable', 'frozen', 'with'],
      java: String.raw`public record Point(int x, int y) { }
var p = new Point(1, 2);
var moved = new Point(p.x() + 1, p.y());`,
      python: String.raw`from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Point:
    x: int
    y: int

p = Point(1, 2)
moved = replace(p, x=p.x + 1)
print(p, moved, {p, Point(1, 2)} == {p})`,
      output: 'Point(x=1, y=2) Point(x=2, y=2) True',
      note: '`frozen=True` makes the fields read-only and adds `__hash__`, so points can go in sets. `dataclasses.replace` makes a changed copy. A `NamedTuple` is the other light-weight record.' },
    { id: 'inheritance', title: 'extends and super → class Child(Parent)', keywords: ['extends', 'super', '@Override', 'inheritance'],
      java: String.raw`class Animal {
    String speak() { return "..."; }
}
class Dog extends Animal {
    @Override
    String speak() { return "Woof (" + super.speak() + ")"; }
}`,
      python: String.raw`class Animal:
    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):                         # overriding needs no annotation
        return f"Woof ({super().speak()})"

print(Dog().speak(), isinstance(Dog(), Animal))`,
      output: 'Woof (...) True',
      note: 'The parent goes in brackets. Every method can be overridden, and there is no `@Override` (`typing.override` exists for type checkers). [[lesson:py-inheritance]].' },
    { id: 'interface', title: 'interface → ABC or Protocol', keywords: ['interface', 'implements', 'abstract', 'ABC', 'Protocol'],
      java: String.raw`interface Shape {
    double area();
}
class Square implements Shape {
    public double area() { return side * side; }
}`,
      python: String.raw`from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Square(Shape):
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side ** 2

print(Square(3).area(), isinstance(Square(3), Shape))`,
      output: '9 True',
      note: 'An ABC refuses to be instantiated until every abstract method exists. A `typing.Protocol` is the other option: any class with an `area()` method matches, without inheriting. [[lesson:py-abc-protocols]].' },
    { id: 'enum', title: 'enum → Enum', keywords: ['enum', 'Enum', 'values'],
      java: String.raw`enum Planet {
    MERCURY(3.303e+23), EARTH(5.976e+24);
    final double mass;
    Planet(double mass) { this.mass = mass; }
}`,
      python: String.raw`from enum import Enum

class Planet(Enum):
    MERCURY = 3.303e+23
    EARTH = 5.976e+24

    @property
    def mass(self):
        return self.value

print(Planet.EARTH, Planet.EARTH.mass, len(Planet))
print([p.name for p in Planet])`,
      output: String.raw`Planet.EARTH 5.976e+24 2
['MERCURY', 'EARTH']`,
      note: 'Each member has a `name` and a `value`; iterate the class for `values()`, and `Planet["EARTH"]` is `valueOf("EARTH")`. Methods and properties work as in Java enums.' },
    { id: 'instanceof', title: 'instanceof and casts', keywords: ['instanceof', 'cast', 'isinstance'],
      java: String.raw`if (shape instanceof Circle c) {
    System.out.println(c.radius());
}`,
      python: String.raw`class Circle:
    def __init__(self, radius):
        self.radius = radius

for shape in [Circle(2), "not a shape"]:
    if isinstance(shape, Circle):          # no cast needed afterwards
        print(shape.radius)
    else:
        print("skipped", type(shape).__name__)`,
      output: String.raw`2
skipped str`,
      note: 'There are no casts: once you know what an object is, use it. Often you skip the check altogether and just call the method (duck typing).' },
    { id: 'singleton', title: 'Singleton → a module, or a cached function', keywords: ['singleton', 'cache', 'module'],
      java: String.raw`public enum Config {
    INSTANCE;
    final Map<String, String> values = loadValues();
}`,
      python: String.raw`import functools

@functools.cache
def get_config():
    print("loading config once")
    return {"debug": False}

print(get_config() is get_config())`,
      output: String.raw`loading config once
True`,
      note: 'A module is imported once per program, so its module-level values are already singletons. For something built lazily, cache the function that builds it.' },
    { id: 'anonymous-class', title: 'Anonymous classes → functions', keywords: ['anonymous class', 'listener', 'callback'],
      java: String.raw`button.addActionListener(new ActionListener() {
    public void actionPerformed(ActionEvent e) {
        clicks.incrementAndGet();
    }
});`,
      python: String.raw`def make_button():
    listeners = []
    def click():
        for listener in listeners:
            listener()
    return listeners, click

listeners, click = make_button()
count = {"clicks": 0}
listeners.append(lambda: count.update(clicks=count["clicks"] + 1))
listeners.append(lambda: print("clicked"))
click()
click()
print(count["clicks"])`,
      output: String.raw`clicked
clicked
2`,
      note: 'Where Java needs an object implementing a one-method interface, Python passes the function itself, a `def` or a `lambda`.' }
  ]);

  /* ---------------------------------------------------------------- functions */

  add('functional', [
    { id: 'lambda', title: 'Lambdas and functional interfaces', keywords: ['lambda', 'Function', 'Predicate', 'BiFunction'],
      java: String.raw`Function<Integer, Integer> square = x -> x * x;
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;
Predicate<String> isEmpty = String::isEmpty;
square.apply(5);`,
      python: String.raw`square = lambda x: x * x
add = lambda a, b: a + b
is_empty = lambda s: not s
print(square(5), add(2, 3), is_empty(""))`,
      output: '25 5 True',
      note: 'No functional interfaces to pick from: every function is called with `()`. PEP 8 prefers `def` over assigning a lambda to a name; lambdas shine as arguments.' },
    { id: 'method-ref', title: 'Method references → the function itself', keywords: ['method reference', '::', 'map'],
      java: String.raw`names.stream().map(String::toUpperCase).forEach(System.out::println);`,
      python: String.raw`names = ["asha", "ravi"]
for upper in map(str.upper, names):
    print(upper)
shout = print                     # a function is a value: no :: needed
shout("done")`,
      output: String.raw`ASHA
RAVI
done`,
      note: '`str.upper` is the method itself, ready to call on any string. A bound method such as `"x".upper` remembers its object too.' },
    { id: 'higher-order', title: 'Passing behaviour: functions as arguments', keywords: ['higher-order function', 'callback', 'UnaryOperator'],
      java: String.raw`static int applyTwice(IntUnaryOperator f, int x) {
    return f.applyAsInt(f.applyAsInt(x));
}
applyTwice(x -> x + 3, 10);`,
      python: String.raw`def apply_twice(f, x):
    return f(f(x))

def add_three(x):
    return x + 3

print(apply_twice(add_three, 10), apply_twice(lambda s: s + "!", "hi"))`,
      output: '16 hi!!',
      note: 'No interface types: `apply_twice` works with any callable and any value the callable accepts. A hint such as `Callable[[int], int]` documents it.' },
    { id: 'iterator', title: 'An Iterator class → a generator', keywords: ['Iterator', 'hasNext', 'generator', 'yield'],
      java: String.raw`class Evens implements Iterator<Integer> {
    private int current = 0;
    private final int limit;
    Evens(int limit) { this.limit = limit; }
    public boolean hasNext() { return current < limit; }
    public Integer next() { int v = current; current += 2; return v; }
}`,
      python: String.raw`def evens(limit):
    n = 0
    while n < limit:
        yield n
        n += 2

print(list(evens(9)))
for e in evens(5):
    print(e)`,
      output: String.raw`[0, 2, 4, 6, 8]
0
2
4`,
      note: '`yield` pauses the function and keeps its local variables, so the state machine Java spreads over fields and `hasNext` is just a loop. [[lesson:py-generators]].' },
    { id: 'supplier', title: 'Supplier and lazy values', keywords: ['Supplier', 'lazy', 'cached_property', 'memoize'],
      java: String.raw`private Report report;
Report getReport() {
    if (report == null) report = buildExpensiveReport();
    return report;
}`,
      python: String.raw`from functools import cached_property

class Dashboard:
    @cached_property
    def report(self):
        print("building the report (once)")
        return {"rows": 3}

d = Dashboard()
print(d.report["rows"], d.report["rows"])`,
      output: String.raw`building the report (once)
3 3`,
      note: '`cached_property` runs the method on first access and stores the result on the object. For a plain function, `functools.cache`.' }
  ]);

  /* ---------------------------------------------------------------- concurrency */

  add('concurrency', [
    { id: 'executor', title: 'ExecutorService → ThreadPoolExecutor', keywords: ['ExecutorService', 'thread pool', 'Future', 'concurrent.futures'], runtimes: ['server'],
      java: String.raw`ExecutorService pool = Executors.newFixedThreadPool(4);
List<Future<Integer>> futures = new ArrayList<>();
for (int n : List.of(1, 2, 3)) futures.add(pool.submit(() -> n * n));
for (Future<Integer> f : futures) System.out.println(f.get());
pool.shutdown();`,
      python: String.raw`from concurrent.futures import ThreadPoolExecutor

def square(n):
    return n * n

with ThreadPoolExecutor(max_workers=4) as pool:
    print(list(pool.map(square, [1, 2, 3])))`,
      output: '[1, 4, 9]',
      note: 'The `with` block shuts the pool down. Threads help with waiting (network, files); for CPU-heavy work in CPython, use `ProcessPoolExecutor`, because of the GIL ([[lesson:py-threads]], [[lesson:py-multiprocessing]]). Needs Python on your PC.' },
    { id: 'completablefuture', title: 'CompletableFuture → asyncio', keywords: ['CompletableFuture', 'async', 'await', 'asyncio'],
      java: String.raw`CompletableFuture<String> a = CompletableFuture.supplyAsync(() -> fetch("a"));
CompletableFuture<String> b = CompletableFuture.supplyAsync(() -> fetch("b"));
CompletableFuture.allOf(a, b).join();`,
      python: String.raw`import asyncio

async def fetch(name):
    await asyncio.sleep(0.01)
    return name.upper()

async def main():
    a, b = await asyncio.gather(fetch("a"), fetch("b"))
    print(a, b)

asyncio.run(main())`,
      output: 'A B',
      note: '`async def` functions run on one thread and take turns at each `await`; `gather` runs several at once and waits for all.' },
    { id: 'synchronized', title: 'synchronized → threading.Lock', keywords: ['synchronized', 'lock', 'thread safety', 'race condition'], runtimes: ['server'],
      java: String.raw`private int count = 0;
synchronized void increment() { count++; }`,
      python: String.raw`import threading

count = 0
lock = threading.Lock()

def work():
    global count
    for _ in range(10_000):
        with lock:
            count += 1

threads = [threading.Thread(target=work) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(count)`,
      output: '40000',
      note: '`with lock:` is the `synchronized` block. `count += 1` is several steps, so without the lock two threads can lose updates. Needs Python on your PC: a browser gives Python no threads.' },
    { id: 'sleep', title: 'Thread.sleep and measuring time', keywords: ['sleep', 'nanoTime', 'perf_counter', 'timing'],
      java: String.raw`long start = System.nanoTime();
long total = LongStream.range(0, 1_000_000).sum();
long micros = (System.nanoTime() - start) / 1_000;
Thread.sleep(10);`,
      python: String.raw`import time

start = time.perf_counter()
total = sum(range(1_000_000))
elapsed = time.perf_counter() - start
print(total, elapsed > 0)
time.sleep(0.01)          # pause this thread for 10 ms
print("slept")`,
      output: String.raw`499999500000 True
slept`,
      note: '`time.perf_counter()` is the clock for measuring, in seconds as a float. `time.sleep` takes seconds, not milliseconds.' }
  ]);

  /* ---------------------------------------------------------------- testing */

  add('testing', [
    { id: 'junit', title: 'A JUnit test → a pytest test', keywords: ['JUnit', 'pytest', '@Test', 'assertEquals', 'assert'],
      java: String.raw`class CalculatorTest {
    @Test
    void addsTwoNumbers() {
        assertEquals(5, Calculator.add(2, 3));
    }
}`,
      python: String.raw`def add(a, b):
    return a + b

# test_calculator.py: pytest finds every function named test_*
def test_adds_two_numbers():
    assert add(2, 3) == 5          # a plain assert; pytest shows both values when it fails

def test_adds_strings():
    assert add("a", "b") == "ab"

for test in [test_adds_two_numbers, test_adds_strings]:   # what pytest does for you
    test()
    print("passed:", test.__name__)`,
      output: String.raw`passed: test_adds_two_numbers
passed: test_adds_strings`,
      note: 'pytest needs no class and no assertion methods: a function named `test_...` with a plain `assert`. Running `pytest` finds and runs them all (it is installed with pip: [[lesson:py-pytest]]).' },
    { id: 'assertthrows', title: 'assertThrows → pytest.raises', keywords: ['assertThrows', 'pytest.raises', 'exception test'], runs: false,
      why: 'It needs pytest, which is not part of Python: `pip install pytest`, then run `pytest` in the folder. [[lesson:py-pytest]] covers it.',
      java: String.raw`@Test
void rejectsNegativeAmounts() {
    assertThrows(IllegalArgumentException.class, () -> account.withdraw(-1));
}`,
      python: String.raw`import pytest

def withdraw(amount):
    if amount < 0:
        raise ValueError("negative amount")

def test_rejects_negative_amounts():
    with pytest.raises(ValueError, match="negative"):
        withdraw(-1)`,
      note: 'The test passes only if the block raises that exception; `match=` also checks the message with a regular expression.' },
    { id: 'mockito', title: 'Mockito → unittest.mock', keywords: ['Mockito', 'mock', 'verify', 'when'],
      java: String.raw`PaymentGateway gateway = mock(PaymentGateway.class);
when(gateway.charge(100)).thenReturn(true);
service.checkout(100);
verify(gateway).charge(100);`,
      python: String.raw`from unittest.mock import Mock

gateway = Mock()
gateway.charge.return_value = True

def checkout(gateway, amount):
    return "paid" if gateway.charge(amount) else "declined"

print(checkout(gateway, 100))
gateway.charge.assert_called_once_with(100)
print(gateway.charge.call_count)`,
      output: String.raw`paid
1`,
      note: 'A `Mock` accepts any method call and records it. `return_value` is `thenReturn`; `assert_called_once_with` is `verify`. `unittest.mock.patch` replaces a name for the length of a test.' }
  ]);

  /* ---------------------------------------------------------------- build and run */

  add('tooling', [
    { id: 'maven', title: 'Maven dependencies → venv and pip', keywords: ['Maven', 'pom.xml', 'pip', 'venv', 'dependency', 'requirements.txt'], runs: false, javaLang: 'text',
      why: 'The commands go in a terminal, not in Python. [[lesson:py-venv-pip]] goes through venv and pip step by step.',
      java: String.raw`<!-- pom.xml -->
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>4.12.0</version>
</dependency>

mvn install`,
      python: String.raw`# In a terminal, not in Python:
#   python -m venv .venv            once per project: a private folder of packages
#   .venv\Scripts\activate          Windows (macOS and Linux: source .venv/bin/activate)
#   pip install requests==2.32.3    like adding a <dependency>
#   pip freeze > requirements.txt   the exact versions, to commit
#   pip install -r requirements.txt on another machine
from importlib import metadata

print(metadata.version("pip"))`,
      note: 'Each project gets its own virtual environment, so versions never clash, like Maven\'s per-project dependencies. `pyproject.toml` is the modern project file, Python\'s `pom.xml`.' },
    { id: 'run-args', title: 'Running a program with arguments', keywords: ['java -jar', 'args', 'sys.argv', 'command line'],
      java: String.raw`// java -jar app.jar --port 8080
public static void main(String[] args) {
    int port = 8000;
    for (int i = 0; i < args.length - 1; i++)
        if (args[i].equals("--port")) port = Integer.parseInt(args[i + 1]);
    System.out.println("starting on port " + port);
}`,
      python: String.raw`import sys

def main(argv):
    port = int(argv[argv.index("--port") + 1]) if "--port" in argv else 8000
    print(f"starting on port {port}")

if __name__ == "__main__":
    main(["--port", "8080"])       # from a terminal: main(sys.argv[1:])`,
      output: 'starting on port 8080',
      note: '`python app.py --port 8080` puts the arguments in `sys.argv[1:]`. For real options and a `--help`, use `argparse` ([[ref:mod-argparse]]).' },
    { id: 'properties', title: 'application.properties → environment and JSON', keywords: ['properties', 'configuration', 'environment variable', 'json', '@Value'],
      java: '@Value("${server.port:8080}")\nint port;\nString url = System.getenv().getOrDefault("DB_URL", "jdbc:h2:mem:test");',
      python: String.raw`import json
import os

port = int(os.environ.get("PYLEARN_DEMO_PORT", "8080"))
with open("settings.json", "w", encoding="utf-8") as f:
    json.dump({"db_url": "sqlite:///app.db", "debug": True}, f)
with open("settings.json", encoding="utf-8") as f:
    settings = json.load(f)
print(port, settings["db_url"], settings["debug"])`,
      output: '8080 sqlite:///app.db True',
      note: 'Read settings from environment variables with a default, and from a JSON or TOML file (`tomllib` reads TOML). Libraries such as pydantic-settings add Spring-like binding.' }
  ]);

  /* ---------------------------------------------------------------- web and data */

  add('web', [
    { id: 'spring-fastapi', title: 'A Spring REST controller → FastAPI', keywords: ['Spring', 'Spring Boot', 'FastAPI', 'REST', '@RestController', '@GetMapping'], runs: false,
      why: 'It needs FastAPI (`pip install fastapi uvicorn`) and runs as a server: `uvicorn main:app --reload`. The Projects (batch 5) build one next to its Spring Boot version.',
      java: String.raw`@RestController
@RequestMapping("/users")
class UserController {
    @GetMapping("/{id}")
    User get(@PathVariable int id) { return service.find(id); }

    @PostMapping
    User create(@Valid @RequestBody User user) { return service.save(user); }
}`,
      python: String.raw`from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class User(BaseModel):          # validated like @Valid, from the type hints
    name: str
    age: int

@app.get("/users/{user_id}")
def get_user(user_id: int):
    return {"id": user_id}

@app.post("/users")
def create_user(user: User):
    return user`,
      note: 'Decorators play the part of Spring\'s annotations; type hints drive conversion and validation (pydantic), and FastAPI writes the OpenAPI page at `/docs` for you.' },
    { id: 'http-client', title: 'HttpClient and URLEncoder → urllib', keywords: ['HttpClient', 'URLEncoder', 'urllib', 'requests', 'http'],
      java: String.raw`String url = "https://api.example.com/search?q="
    + URLEncoder.encode("chai & samosa", StandardCharsets.UTF_8) + "&page=2";
HttpRequest req = HttpRequest.newBuilder(URI.create(url))
    .header("Accept", "application/json").build();`,
      python: String.raw`from urllib.parse import urlencode, urlparse
from urllib.request import Request

url = "https://api.example.com/search?" + urlencode({"q": "chai & samosa", "page": 2})
print(url)
print(urlparse(url).netloc)
req = Request(url, headers={"Accept": "application/json"})
print(req.get_method(), req.get_header("Accept"))
# urllib.request.urlopen(req) would send it; most projects use the requests or httpx package`,
      output: String.raw`https://api.example.com/search?q=chai+%26+samosa&page=2
api.example.com
GET application/json`,
      note: 'The standard library can send requests (`urllib.request.urlopen`), but almost every project installs `requests` or `httpx`, which read like `HttpClient` with less code.' },
    { id: 'jdbc', title: 'JDBC → sqlite3', keywords: ['JDBC', 'SQL', 'database', 'sqlite', 'PreparedStatement'], runtimes: ['server'],
      java: String.raw`try (Connection c = DriverManager.getConnection("jdbc:sqlite::memory:");
     PreparedStatement ps = c.prepareStatement("SELECT name FROM users WHERE age > ?")) {
    ps.setInt(1, 30);
    ResultSet rs = ps.executeQuery();
    while (rs.next()) System.out.println(rs.getString("name"));
}`,
      python: String.raw`import sqlite3

con = sqlite3.connect(":memory:")
con.execute("CREATE TABLE users (name TEXT, age INTEGER)")
con.executemany("INSERT INTO users VALUES (?, ?)", [("Asha", 34), ("Ravi", 28)])
for row in con.execute("SELECT name FROM users WHERE age > ?", (30,)):
    print(row[0])
con.close()`,
      output: 'Asha',
      note: 'Every Python database driver follows one API (DB-API): `connect`, `execute` with `?` placeholders, rows as tuples. Never build SQL with f-strings. Needs Python on your PC: the browser\'s Python has no `sqlite3` loaded.' }
  ]);
})(window.PYLT);
