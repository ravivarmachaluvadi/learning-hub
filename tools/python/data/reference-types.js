/*
 * The Reference, part 2: every method of str, list, dict, set and tuple. The entry shape is described
 * at the top of data/reference-builtins.js. Sets print in no fixed order, so the set examples print
 * small whole numbers (which happen to come out sorted) or call sorted().
 */
(function (U) {
  var R = U.data.reference = U.data.reference || [];
  function nl(s) { return /\n$/.test(s) ? s : s + '\n'; }
  function add(group, rows) {
    rows.forEach(function (r) {
      var e = { id: group + '-' + r.name, group: group, name: r.name, title: group + '.' + r.name + '()',
        sig: group + '.' + r.sig, summary: r.summary, java: r.java, example: nl(r.example), output: nl(r.output) };
      if (r.covers) e.covers = r.covers;
      R.push(e);
    });
  }

  /* ---------------------------------------------------------------- str */

  add('str', [
    { name: 'capitalize', sig: 'capitalize()', summary: 'The first character in upper case, the rest in lower case.', java: '`s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase()`',
      example: String.raw`print("hello WORLD".capitalize())`, output: 'Hello world' },
    { name: 'casefold', sig: 'casefold()', summary: 'A lower case made for comparing text without case: stronger than `lower()` (the German ß becomes ss).', java: '`equalsIgnoreCase`, which does not handle ß',
      example: String.raw`print("Straße".casefold(), "Straße".lower())
print("STRASSE".casefold() == "Straße".casefold())`, output: String.raw`strasse straße
True` },
    { name: 'center', sig: 'center(width, fillchar=" ")', summary: 'The string in the middle of a field of the given width.', java: 'None built in (Apache Commons `StringUtils.center`).',
      example: String.raw`print("[" + "hi".center(8) + "]")
print("hi".center(8, "*"))`, output: String.raw`[   hi   ]
***hi***` },
    { name: 'count', sig: 'count(sub, start=0, end=len)', summary: 'How many times a substring occurs, without overlaps.', java: 'None built in: `s.chars().filter(c -> c == \'a\').count()` for one character.',
      example: String.raw`print("banana".count("a"), "banana".count("an"), "banana".count("a", 2))`, output: '3 2 2' },
    { name: 'encode', sig: 'encode(encoding="utf-8", errors="strict")', summary: 'The text as `bytes` in an encoding. `bytes.decode()` goes back.', java: '`s.getBytes(StandardCharsets.UTF_8)`',
      example: String.raw`data = "€5".encode("utf-8")
print(len("€5"), len(data))
print(list(data), data.hex())
print(data.decode("utf-8"))`, output: String.raw`2 4
[226, 130, 172, 53] e282ac35
€5` },
    { name: 'endswith', sig: 'endswith(suffix_or_tuple)', summary: '`True` when the string ends with the suffix; a tuple accepts any of several.', java: '`s.endsWith(".csv")`',
      example: String.raw`print("report.csv".endswith(".csv"), "photo.JPG".lower().endswith((".jpg", ".png")))`, output: 'True True' },
    { name: 'expandtabs', sig: 'expandtabs(tabsize=8)', summary: 'Replaces each tab character with spaces up to the next tab stop.', java: 'None built in.',
      example: String.raw`TAB = chr(9)
row = "a" + TAB + "bc" + TAB + "d"
print(row.expandtabs(4) + "|")
print(row.expandtabs(2) + "|")`, output: String.raw`a   bc  d|
a bc  d|` },
    { name: 'find', sig: 'find(sub, start=0, end=len)', summary: 'The index of the first occurrence, or **-1** when it is not there. Use `in` to just ask whether it is there.', java: '`s.indexOf("l")`',
      example: String.raw`print("hello".find("l"), "hello".find("z"), "hello".find("l", 3))`, output: '2 -1 3' },
    { name: 'format', sig: 'format(*args, **kwargs)', summary: 'Fills `{}` fields with values. An f-string is usually clearer; `format` suits a template stored in a variable.', java: '`String.format("%s is %d years old", name, age)`, `MessageFormat`',
      example: String.raw`print("{} is {} years old".format("Asha", 29))
print("{name}: {score:.1f}".format(name="Ravi", score=9.25))
print("{0} {1} {0}".format("a", "b"))`, output: String.raw`Asha is 29 years old
Ravi: 9.2
a b a` },
    { name: 'format_map', sig: 'format_map(mapping)', summary: 'Like `format(**mapping)`: fills `{name}` fields from a dict.', java: 'None built in (template engines).',
      example: String.raw`data = {"city": "Pune", "temp": 31}
print("{city}: {temp} degrees".format_map(data))`, output: 'Pune: 31 degrees' },
    { name: 'index', sig: 'index(sub, start=0, end=len)', summary: 'Like `find()`, but raises `ValueError` when the substring is not there.', java: '`s.indexOf(...)`, which returns -1 instead',
      example: String.raw`print("hello".index("e"))
try:
    "hello".index("z")
except ValueError as e:
    print("ValueError:", e)`, output: String.raw`1
ValueError: substring not found` },
    { name: 'isalnum', sig: 'isalnum()', summary: '`True` when every character is a letter or a digit (and there is at least one).', java: '`s.chars().allMatch(Character::isLetterOrDigit)`',
      example: String.raw`print("abc123".isalnum(), "abc 123".isalnum(), "".isalnum())`, output: 'True False False' },
    { name: 'isalpha', sig: 'isalpha()', summary: '`True` when every character is a letter, in any alphabet (and there is at least one).', java: '`s.chars().allMatch(Character::isLetter)`',
      example: String.raw`print("Python".isalpha(), "Py3".isalpha(), "café".isalpha(), "".isalpha())`, output: 'True False True False' },
    { name: 'isascii', sig: 'isascii()', summary: '`True` when every character is ASCII (an empty string counts).', java: '`StandardCharsets.US_ASCII.newEncoder().canEncode(s)`',
      example: String.raw`print("hello".isascii(), "héllo".isascii(), "".isascii())`, output: 'True False True' },
    { name: 'isdecimal', sig: 'isdecimal()', summary: '`True` when every character is a decimal digit 0 to 9 (in any script): the strictest of the three digit tests, the right one before `int()`.', java: '`s.chars().allMatch(Character::isDigit)`',
      example: String.raw`print("123".isdecimal(), "½".isdecimal(), "²".isdecimal())`, output: 'True False False' },
    { name: 'isdigit', sig: 'isdigit()', summary: '`True` for decimal digits and also superscripts such as ². A minus sign or a dot is not a digit.', java: '`Character.isDigit` (which says no to ²)',
      example: String.raw`print("123".isdigit(), "²".isdigit(), "½".isdigit(), "-5".isdigit())`, output: 'True True False False' },
    { name: 'isidentifier', sig: 'isidentifier()', summary: '`True` when the text could be a Python name. Keywords count too: check them with `keyword.iskeyword`.', java: '`SourceVersion.isIdentifier(s)`',
      example: String.raw`import keyword
print("total_2".isidentifier(), "2total".isidentifier(), "my-name".isidentifier())
print("class".isidentifier(), keyword.iskeyword("class"))`, output: String.raw`True False False
True True` },
    { name: 'islower', sig: 'islower()', summary: '`True` when there is at least one cased letter and all cased letters are lower case.', java: 'None built in.',
      example: String.raw`print("hello".islower(), "Hello".islower(), "abc1".islower(), "123".islower())`, output: 'True False True False' },
    { name: 'isnumeric', sig: 'isnumeric()', summary: 'The widest digit test: also fractions such as ½ and Roman numerals. `float()` still cannot read those.', java: 'None built in.',
      example: String.raw`print("123".isnumeric(), "½".isnumeric(), "Ⅻ".isnumeric(), "1.5".isnumeric())`, output: 'True True True False' },
    { name: 'isprintable', sig: 'isprintable()', summary: '`True` when no character is a control character such as a tab or newline (an empty string counts).', java: 'None built in.',
      example: String.raw`print("hello".isprintable(), ("tab" + chr(9)).isprintable(), "".isprintable())`, output: 'True False True' },
    { name: 'isspace', sig: 'isspace()', summary: '`True` when every character is whitespace and there is at least one.', java: '`s.isBlank()`, which is also true for `""`',
      example: String.raw`print("  \n".isspace(), " a ".isspace(), "".isspace())`, output: 'True False False' },
    { name: 'istitle', sig: 'istitle()', summary: '`True` when each word starts with a capital and goes on in lower case.', java: 'None built in.',
      example: String.raw`print("Hello World".istitle(), "Hello world".istitle(), "HELLO".istitle())`, output: 'True False False' },
    { name: 'isupper', sig: 'isupper()', summary: '`True` when there is at least one cased letter and all cased letters are upper case.', java: 'None built in.',
      example: String.raw`print("HELLO".isupper(), "HELLO1".isupper(), "Hello".isupper())`, output: 'True True False' },
    { name: 'join', sig: 'join(iterable_of_str)', summary: 'Glues strings together with this string between them. It is a method of the **separator**, and the items must already be strings.', java: '`String.join(", ", list)`, `Collectors.joining(", ")`',
      example: String.raw`print(", ".join(["a", "b", "c"]))
print("-".join(str(n) for n in range(3)))
try:
    "-".join([1, 2])
except TypeError as e:
    print("TypeError:", e)`, output: String.raw`a, b, c
0-1-2
TypeError: sequence item 0: expected str instance, int found` },
    { name: 'ljust', sig: 'ljust(width, fillchar=" ")', summary: 'The string at the left of a field of the given width. An f-string does the same with `{s:<10}`.', java: '`String.format("%-10s", s)`',
      example: String.raw`for name, price in [("pen", 10), ("notebook", 250)]:
    print(name.ljust(10, ".") + str(price).rjust(5))`, output: String.raw`pen.......   10
notebook..  250` },
    { name: 'lower', sig: 'lower()', summary: 'A lower-case copy.', java: '`s.toLowerCase()`',
      example: String.raw`print("HeLLo".lower(), "ABC".lower() == "abc")`, output: 'hello True' },
    { name: 'lstrip', sig: 'lstrip(chars=None)', summary: 'Removes whitespace (or the given characters) from the start.', java: '`s.stripLeading()`',
      example: String.raw`print(repr("   hi  ".lstrip()), "xxhixx".lstrip("x"))`, output: "'hi  ' hixx" },
    { name: 'maketrans', sig: 'maketrans(from, to, delete="")', summary: 'Builds the table that `translate()` uses: which characters become which, and which are deleted.', java: 'None built in: a chain of `replace` calls.',
      example: String.raw`table = str.maketrans("ae", "43", "!")
print("Release!".translate(table))
print(table)`, output: String.raw`R3l34s3
{97: 52, 101: 51, 33: None}` },
    { name: 'partition', sig: 'partition(sep)', summary: 'Splits at the first separator into exactly three parts: before, the separator, after. Never fails.', java: '`s.split("=", 2)`, which gives one part when there is no `=`',
      example: String.raw`print("key=value=x".partition("="))
print("novalue".partition("="))`, output: String.raw`('key', '=', 'value=x')
('novalue', '', '')` },
    { name: 'removeprefix', sig: 'removeprefix(prefix)', summary: 'The string without the prefix, if it starts with it; otherwise unchanged. (`lstrip` removes *characters*, not a prefix.)', java: 'None built in.',
      example: String.raw`print("test_login".removeprefix("test_"), "login".removeprefix("test_"))`, output: 'login login' },
    { name: 'removesuffix', sig: 'removesuffix(suffix)', summary: 'The string without the suffix, if it ends with it; otherwise unchanged.', java: 'None built in.',
      example: String.raw`print("report.csv".removesuffix(".csv"), "report.txt".removesuffix(".csv"))`, output: 'report report.txt' },
    { name: 'replace', sig: 'replace(old, new, count=-1)', summary: 'Every occurrence replaced (or only the first `count`). Plain text, not a regular expression.', java: '`s.replace("-", "+")`',
      example: String.raw`print("a-b-c".replace("-", "+"), "a-b-c".replace("-", "", 1))`, output: 'a+b+c ab-c' },
    { name: 'rfind', sig: 'rfind(sub)', summary: 'The index of the **last** occurrence, or -1.', java: '`s.lastIndexOf("/")`',
      example: String.raw`print("a/b/c.txt".rfind("/"), "abc".rfind("z"))`, output: '3 -1' },
    { name: 'rindex', sig: 'rindex(sub)', summary: 'Like `rfind()`, but raises `ValueError` when it is not there.', java: '`s.lastIndexOf(...)`',
      example: String.raw`path = "a/b/c.txt"
print(path[path.rindex("/") + 1:])`, output: 'c.txt' },
    { name: 'rjust', sig: 'rjust(width, fillchar=" ")', summary: 'The string at the right of a field of the given width (`{s:>6}` in an f-string).', java: '`String.format("%6s", s)`',
      example: String.raw`print("42".rjust(6) + "|", "7".rjust(3, "0"))`, output: '    42| 007' },
    { name: 'rpartition', sig: 'rpartition(sep)', summary: 'Like `partition()`, at the **last** separator.', java: '`lastIndexOf` and two `substring` calls',
      example: String.raw`print("archive.tar.gz".rpartition("."))`, output: "('archive.tar', '.', 'gz')" },
    { name: 'rsplit', sig: 'rsplit(sep=None, maxsplit=-1)', summary: 'Like `split()`, but counting `maxsplit` from the right.', java: 'None built in.',
      example: String.raw`print("a,b,c,d".rsplit(",", 1), "a,b,c,d".split(",", 1))`, output: "['a,b,c', 'd'] ['a', 'b,c,d']" },
    { name: 'rstrip', sig: 'rstrip(chars=None)', summary: 'Removes whitespace (or the given characters) from the end: the usual way to drop a line\'s newline.', java: '`s.stripTrailing()`',
      example: String.raw`print(repr("line\n".rstrip()), "3.1400".rstrip("0"))`, output: "'line' 3.14" },
    { name: 'split', sig: 'split(sep=None, maxsplit=-1)', summary: 'A list of the parts. With no separator it splits on any run of whitespace and drops empty parts; with one, every separator counts.', java: '`s.split(",")`, but Java\'s takes a regular expression and drops trailing empty strings',
      example: String.raw`print("a b  c".split())
print("a,b,,c".split(","))
print("k=v=w".split("=", 1))`, output: String.raw`['a', 'b', 'c']
['a', 'b', '', 'c']
['k', 'v=w']` },
    { name: 'splitlines', sig: 'splitlines(keepends=False)', summary: 'The lines, whatever the line endings (`\\n`, `\\r\\n`), without a final empty one.', java: '`s.lines().toList()`',
      example: String.raw`print("one\ntwo\r\nthree".splitlines())
print("a\nb\n".split("\n"), "a\nb\n".splitlines())`, output: String.raw`['one', 'two', 'three']
['a', 'b', ''] ['a', 'b']` },
    { name: 'startswith', sig: 'startswith(prefix_or_tuple)', summary: '`True` when the string starts with the prefix; a tuple accepts any of several. Case matters.', java: '`s.startsWith("http")`',
      example: String.raw`print("https://x.org".startswith(("http://", "https://")), "Python".startswith("py"))`, output: 'True False' },
    { name: 'strip', sig: 'strip(chars=None)', summary: 'Removes whitespace (or the given characters) from both ends.', java: '`s.strip()`',
      example: String.raw`print(repr("  hi \n".strip()), "--title--".strip("-"))`, output: "'hi' title" },
    { name: 'swapcase', sig: 'swapcase()', summary: 'Upper case becomes lower and lower becomes upper.', java: 'None built in.',
      example: String.raw`print("Hello World".swapcase())`, output: 'hELLO wORLD' },
    { name: 'title', sig: 'title()', summary: 'Each word capitalised. It treats an apostrophe as a word break, as the second result shows.', java: 'None built in.',
      example: String.raw`print("the old man".title(), "they're here".title())`, output: "The Old Man They'Re Here" },
    { name: 'translate', sig: 'translate(table)', summary: 'Replaces or deletes single characters through a table from `str.maketrans()`: one pass, however many characters.', java: 'None built in.',
      example: String.raw`table = str.maketrans({"o": "0", "l": None})
print("hello world".translate(table))`, output: 'he0 w0rd' },
    { name: 'upper', sig: 'upper()', summary: 'An upper-case copy (ß becomes SS).', java: '`s.toUpperCase()`',
      example: String.raw`print("hello".upper(), "straße".upper())`, output: 'HELLO STRASSE' },
    { name: 'zfill', sig: 'zfill(width)', summary: 'Pads with zeros on the left, after any sign.', java: '`String.format("%05d", n)`',
      example: String.raw`print("42".zfill(5), "-42".zfill(5), f"{42:05}")`, output: '00042 -0042 00042' }
  ]);

  /* ---------------------------------------------------------------- list */

  add('list', [
    { name: 'append', sig: 'append(item)', summary: 'Adds one item at the end. A list added this way becomes **one** item; `extend` adds its items.', java: '`list.add(x)`',
      example: String.raw`nums = [1, 2]
nums.append(3)
nums.append([4, 5])
print(nums)`, output: '[1, 2, 3, [4, 5]]' },
    { name: 'clear', sig: 'clear()', summary: 'Removes every item, from this very list: every name for it sees the change.', java: '`list.clear()`',
      example: String.raw`items = [1, 2]
alias = items
items.clear()
print(items, alias)`, output: '[] []' },
    { name: 'copy', sig: 'copy()', summary: 'A shallow copy: a new list holding the same items (an inner list is shared). Same as `items[:]` or `list(items)`.', java: '`new ArrayList<>(list)`',
      example: String.raw`a = [1, [2]]
b = a.copy()
b.append(3)
b[1].append(9)
print(a, b)`, output: '[1, [2, 9]] [1, [2, 9], 3]' },
    { name: 'count', sig: 'count(item)', summary: 'How many items are equal to the given one.', java: '`Collections.frequency(list, x)`',
      example: String.raw`print([1, 2, 1, 1].count(1), ["a", "b"].count("z"))`, output: '3 0' },
    { name: 'extend', sig: 'extend(iterable)', summary: 'Adds every item of an iterable at the end. `+=` with a list does the same.', java: '`list.addAll(other)`',
      example: String.raw`a = [1]
a.extend([2, 3])
a.extend("ab")
print(a)`, output: "[1, 2, 3, 'a', 'b']" },
    { name: 'index', sig: 'index(item, start=0)', summary: 'The position of the first equal item; raises `ValueError` when there is none.', java: '`list.indexOf(x)`, which returns -1 instead',
      example: String.raw`letters = ["a", "b", "c", "b"]
print(letters.index("b"), letters.index("b", 2))
try:
    letters.index("z")
except ValueError as e:
    print("ValueError:", e)`, output: String.raw`1 3
ValueError: 'z' is not in list` },
    { name: 'insert', sig: 'insert(index, item)', summary: 'Puts the item before the given position; a position past the end appends.', java: '`list.add(index, x)`',
      example: String.raw`a = ["b", "d"]
a.insert(0, "a")
a.insert(2, "c")
a.insert(99, "e")
print(a)`, output: "['a', 'b', 'c', 'd', 'e']" },
    { name: 'pop', sig: 'pop(index=-1)', summary: 'Removes and returns the last item, or the one at the index: a list is a stack with `append` and `pop`. (`pop(0)` is slow on a long list; use a `deque`.)', java: '`list.remove(list.size() - 1)`; `Deque.pop()`',
      example: String.raw`stack = [1, 2, 3]
top = stack.pop()
print(top, stack)
first = stack.pop(0)
print(first, stack)`, output: String.raw`3 [1, 2]
1 [2]` },
    { name: 'remove', sig: 'remove(item)', summary: 'Removes the first item equal to the given one; raises `ValueError` when there is none.', java: '`list.remove(Object)`, which returns `false` instead',
      example: String.raw`a = ["x", "y", "x"]
a.remove("x")
print(a)
try:
    a.remove("z")
except ValueError as e:
    print("ValueError:", e)`, output: String.raw`['y', 'x']
ValueError: list.remove(x): x not in list` },
    { name: 'reverse', sig: 'reverse()', summary: 'Reverses the list in place and returns `None`. `items[::-1]` makes a reversed copy instead.', java: '`Collections.reverse(list)`',
      example: String.raw`a = [1, 2, 3]
a.reverse()
print(a, a[::-1])`, output: '[3, 2, 1] [1, 2, 3]' },
    { name: 'sort', sig: 'sort(key=None, reverse=False)', summary: 'Sorts the list in place and returns **`None`** (so `x = items.sort()` is a bug). `sorted(items)` returns a new list instead.', java: '`list.sort(Comparator.comparing(...))`',
      example: String.raw`a = [3, 1, 2]
result = a.sort()
print(a, result)
words = ["kiwi", "Fig", "apple"]
words.sort(key=str.lower)
print(words)
words.sort(key=len, reverse=True)
print(words)`, output: String.raw`[1, 2, 3] None
['apple', 'Fig', 'kiwi']
['apple', 'kiwi', 'Fig']` }
  ]);

  /* ---------------------------------------------------------------- dict */

  add('dict', [
    { name: 'clear', sig: 'clear()', summary: 'Removes every key.', java: '`map.clear()`',
      example: String.raw`d = {"a": 1}
d.clear()
print(d, len(d))`, output: '{} 0' },
    { name: 'copy', sig: 'copy()', summary: 'A shallow copy: new keys and values, but a list inside is shared. `copy.deepcopy` copies everything.', java: '`new HashMap<>(map)`',
      example: String.raw`a = {"tags": ["x"]}
b = a.copy()
b["new"] = 1
b["tags"].append("y")
print(a)
print(b)`, output: String.raw`{'tags': ['x', 'y']}
{'tags': ['x', 'y'], 'new': 1}` },
    { name: 'fromkeys', sig: 'fromkeys(keys, value=None)', summary: 'A new dict with these keys, all with one value. Also the shortest way to drop duplicates and keep the order.', java: 'None built in; a `LinkedHashSet` for removing duplicates',
      example: String.raw`print(dict.fromkeys(["a", "b"], 0))
print(list(dict.fromkeys([3, 1, 3, 2])))`, output: String.raw`{'a': 0, 'b': 0}
[3, 1, 2]` },
    { name: 'get', sig: 'get(key, default=None)', summary: 'The value for a key, or the default (`None` unless given) when the key is missing. `d[key]` raises `KeyError` instead.', java: '`map.get(k)`, `map.getOrDefault(k, 0)`',
      example: String.raw`ages = {"Asha": 29}
print(ages.get("Asha"), ages.get("Ravi"), ages.get("Ravi", 0))`, output: '29 None 0' },
    { name: 'items', sig: 'items()', summary: 'A live view of the (key, value) pairs, for looping over both.', java: '`map.entrySet()`',
      example: String.raw`prices = {"pen": 10, "book": 250}
for name, price in prices.items():
    print(name, price)
print(list(prices.items()))`, output: String.raw`pen 10
book 250
[('pen', 10), ('book', 250)]` },
    { name: 'keys', sig: 'keys()', summary: 'A live view of the keys, which supports set operations. A loop over the dict itself gives the keys too.', java: '`map.keySet()`',
      example: String.raw`d = {"b": 2, "a": 1}
print(list(d.keys()), "a" in d)
print(d.keys() & {"a", "z"})`, output: String.raw`['b', 'a'] True
{'a'}` },
    { name: 'pop', sig: 'pop(key, default)', summary: 'Removes a key and returns its value; returns the default when the key is missing (without one, `KeyError`).', java: '`map.remove(k)`',
      example: String.raw`d = {"a": 1, "b": 2}
value = d.pop("a")
print(value, d)
print(d.pop("z", "missing"))`, output: String.raw`1 {'b': 2}
missing` },
    { name: 'popitem', sig: 'popitem()', summary: 'Removes and returns the key added last, as a (key, value) pair.', java: 'None built in.',
      example: String.raw`d = {"a": 1, "b": 2, "c": 3}
last = d.popitem()
print(last, d)`, output: "('c', 3) {'a': 1, 'b': 2}" },
    { name: 'setdefault', sig: 'setdefault(key, default=None)', summary: 'The value for a key, first storing the default if the key is missing. `collections.defaultdict` is the tidier way to group.', java: '`map.computeIfAbsent(k, x -> new ArrayList<>())`',
      example: String.raw`groups = {}
for word in ["apple", "avocado", "banana"]:
    groups.setdefault(word[0], []).append(word)
print(groups)`, output: "{'a': ['apple', 'avocado'], 'b': ['banana']}" },
    { name: 'update', sig: 'update(other, **kwargs)', summary: 'Adds or replaces keys from another dict, pairs or keyword arguments. `a | b` makes a merged new dict; `a |= b` is `update`.', java: '`map.putAll(other)`',
      example: String.raw`d = {"a": 1}
d.update({"b": 2}, c=3)
d.update([("a", 10)])
print(d)
print(d | {"z": 0})`, output: String.raw`{'a': 10, 'b': 2, 'c': 3}
{'a': 10, 'b': 2, 'c': 3, 'z': 0}` },
    { name: 'values', sig: 'values()', summary: 'A live view of the values.', java: '`map.values()`',
      example: String.raw`stock = {"pen": 5, "ink": 0, "pad": 2}
print(list(stock.values()), sum(stock.values()))`, output: '[5, 0, 2] 7' }
  ]);

  /* ---------------------------------------------------------------- set */

  add('set', [
    { name: 'add', sig: 'add(item)', summary: 'Adds an item; adding one that is already there does nothing.', java: '`set.add(x)`',
      example: String.raw`s = {1, 2}
s.add(3)
s.add(2)
print(s, len(s))`, output: '{1, 2, 3} 3' },
    { name: 'clear', sig: 'clear()', summary: 'Removes every item. An empty set prints as `set()`, because `{}` is an empty dict.', java: '`set.clear()`',
      example: String.raw`s = {1, 2}
s.clear()
print(s)`, output: 'set()' },
    { name: 'copy', sig: 'copy()', summary: 'A shallow copy.', java: '`new HashSet<>(set)`',
      example: String.raw`a = {1, 2}
b = a.copy()
b.add(3)
print(a, b)`, output: '{1, 2} {1, 2, 3}' },
    { name: 'difference', sig: 'difference(*others)', summary: 'A new set of the items not in the others: `a - b`.', java: 'A copy, then `removeAll(b)`',
      example: String.raw`a = {1, 2, 3, 4}
b = {3, 4, 5}
print(a.difference(b), a - b, a.difference(b, {1}))`, output: '{1, 2} {1, 2} {2}' },
    { name: 'difference_update', sig: 'difference_update(*others)', summary: 'Removes from this set every item in the others: `a -= b`.', java: '`a.removeAll(b)`',
      example: String.raw`a = {1, 2, 3}
a.difference_update({2, 9})
print(a)
a -= {1}
print(a)`, output: String.raw`{1, 3}
{3}` },
    { name: 'discard', sig: 'discard(item)', summary: 'Removes an item if it is there; no error if it is not (unlike `remove`).', java: '`set.remove(x)`',
      example: String.raw`s = {1, 2}
s.discard(2)
s.discard(99)
print(s)`, output: '{1}' },
    { name: 'intersection', sig: 'intersection(*others)', summary: 'A new set of the items in all of them: `a & b`.', java: 'A copy, then `retainAll(b)`',
      example: String.raw`a = {1, 2, 3}
print(a.intersection({2, 3, 4}), a & {3, 5})`, output: '{2, 3} {3}' },
    { name: 'intersection_update', sig: 'intersection_update(*others)', summary: 'Keeps only the items also in the others: `a &= b`.', java: '`a.retainAll(b)`',
      example: String.raw`a = {1, 2, 3}
a &= {2, 3, 4}
print(a)
a.intersection_update([3])
print(a)`, output: String.raw`{2, 3}
{3}` },
    { name: 'isdisjoint', sig: 'isdisjoint(other)', summary: '`True` when the two have no item in common.', java: '`Collections.disjoint(a, b)`',
      example: String.raw`print({1, 2}.isdisjoint({3}), {1, 2}.isdisjoint([2]))`, output: 'True False' },
    { name: 'issubset', sig: 'issubset(other)', summary: '`True` when every item is also in the other: `a <= b` (`a < b` also needs `a != b`).', java: '`b.containsAll(a)`',
      example: String.raw`print({1, 2}.issubset({1, 2, 3}), {1, 2} <= {1, 2}, {1, 2} < {1, 2})`, output: 'True True False' },
    { name: 'issuperset', sig: 'issuperset(other)', summary: '`True` when this set holds every item of the other: `a >= b`.', java: '`a.containsAll(b)`',
      example: String.raw`print({1, 2, 3}.issuperset([1, 2]), {1, 2, 3} >= {4})`, output: 'True False' },
    { name: 'pop', sig: 'pop()', summary: 'Removes and returns some item (which one is not defined); `KeyError` when the set is empty.', java: 'An iterator\'s `next()` and `remove()`',
      example: String.raw`s = {7}
item = s.pop()
print(item, s)
try:
    s.pop()
except KeyError as e:
    print("KeyError:", e)`, output: String.raw`7 set()
KeyError: 'pop from an empty set'` },
    { name: 'remove', sig: 'remove(item)', summary: 'Removes an item; `KeyError` when it is not there (use `discard` to not care).', java: '`set.remove(x)`, which returns `false` instead',
      example: String.raw`s = {1, 2}
s.remove(1)
print(s)
try:
    s.remove(9)
except KeyError as e:
    print("KeyError:", e)`, output: String.raw`{2}
KeyError: 9` },
    { name: 'symmetric_difference', sig: 'symmetric_difference(other)', summary: 'A new set of the items in exactly one of the two: `a ^ b`.', java: 'None built in.',
      example: String.raw`a = {1, 2, 3}
b = {3, 4}
print(a.symmetric_difference(b), a ^ b)`, output: '{1, 2, 4} {1, 2, 4}' },
    { name: 'symmetric_difference_update', sig: 'symmetric_difference_update(other)', summary: 'Keeps the items in exactly one of the two: `a ^= b`.', java: 'None built in.',
      example: String.raw`a = {1, 2}
a ^= {2, 3}
print(a)
a.symmetric_difference_update([1])
print(a)`, output: String.raw`{1, 3}
{3}` },
    { name: 'union', sig: 'union(*others)', summary: 'A new set of the items in any of them: `a | b`.', java: 'A copy, then `addAll(b)`',
      example: String.raw`print({1, 2}.union([2, 3], (4,)), {1} | {5})`, output: '{1, 2, 3, 4} {1, 5}' },
    { name: 'update', sig: 'update(*others)', summary: 'Adds every item of the others: `a |= b`.', java: '`set.addAll(other)`',
      example: String.raw`tags = {"python"}
tags.update(["java", "go"], {"python"})
print(sorted(tags))
tags |= {"rust"}
print(len(tags))`, output: String.raw`['go', 'java', 'python']
4` }
  ]);

  /* ---------------------------------------------------------------- tuple */

  add('tuple', [
    { name: 'count', sig: 'count(item)', summary: 'How many items are equal to the given one.', java: '`Collections.frequency(list, x)`',
      example: String.raw`print((1, 2, 2, 3).count(2))`, output: '2' },
    { name: 'index', sig: 'index(item)', summary: 'The position of the first equal item; `ValueError` when there is none.', java: '`list.indexOf(x)`',
      example: String.raw`point = ("x", "y", "z")
print(point.index("z"))`, output: '2' }
  ]);
})(window.PYLT);
