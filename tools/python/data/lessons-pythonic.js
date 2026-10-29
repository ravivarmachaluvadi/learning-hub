/*
 * Lessons, track 2: Pythonic Python. The lesson shape is described at the top of
 * data/lessons-basics.js; every ```python block must run (tests/test_content.py runs them all).
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  function block(lang, lines) { return '```' + lang + '\n' + lines.join('\n') + '\n```'; }
  function py() { return block('python', [].slice.call(arguments)); }
  function java() { return block('java', [].slice.call(arguments)); }
  function text() { return block('text', [].slice.call(arguments)); }

  L.push(
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'py-comprehensions', track: 'pythonic',
      title: 'Comprehensions: Python\'s answer to streams',
      summary: 'List, dict and set comprehensions replace most loops that build a collection, and most Java stream pipelines. With a condition, nested, and lazy as a generator expression.',
      keywords: ['comprehension', 'list comprehension', 'dict comprehension', 'set comprehension', 'generator expression', 'stream', 'map', 'filter', 'collect', 'pipeline'],
      docs: 'https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions',
      body: [
        'A loop that builds a list is so common that Python has a shorter way to write it: a **comprehension**. Both of these make the same list:',
        py('squares = []',
           'for n in range(1, 6):',
           '    squares.append(n * n)',
           'print(squares)',
           '',
           'squares = [n * n for n in range(1, 6)]',
           'print(squares)          # [1, 4, 9, 16, 25]'),
        'Read `[n * n for n in range(1, 6)]` as "n times n, for each n in range(1, 6)": the value to collect comes first, then the loop.',
        '## Filtering with if',
        'An `if` at the end keeps only the items that pass, like a stream\'s `filter`:',
        py('words = ["apple", "fig", "banana", "kiwi", "cherry"]',
           'long_words = [w.upper() for w in words if len(w) > 4]',
           'print(long_words)       # [\'APPLE\', \'BANANA\', \'CHERRY\']'),
        'To choose between two values instead, put a conditional expression at the front: `x if test else y`.',
        py('labels = ["even" if n % 2 == 0 else "odd" for n in range(4)]',
           'print(labels)           # [\'even\', \'odd\', \'even\', \'odd\']'),
        '## Dict and set comprehensions',
        'Curly brackets with `key: value` make a dict; curly brackets with one value make a set.',
        py('prices = {"tea": 30, "coffee": 45, "juice": 60}',
           'with_tax = {item: round(p * 1.18) for item, p in prices.items()}',
           'print(with_tax)',
           '',
           'lengths = {len(w) for w in ["a", "bb", "cc", "ddd"]}',
           'print(lengths)          # {1, 2, 3}: a set keeps each value once'),
        '## Two for clauses',
        'Several `for` clauses read left to right, in the same order as nested `for` loops would be written:',
        py('pairs = [(x, y) for x in range(1, 3) for y in "ab"]',
           'print(pairs)            # [(1, \'a\'), (1, \'b\'), (2, \'a\'), (2, \'b\')]',
           '',
           'matrix = [[1, 2, 3], [4, 5, 6]]',
           'flat = [n for row in matrix for n in row]',
           'print(flat)             # [1, 2, 3, 4, 5, 6]'),
        '## Generator expressions: lazy, like a stream',
        'Round brackets make a **generator expression**. It computes nothing until something asks for the values, one at a time, so it never builds a list. `sum`, `max`, `min`, `any`, `all` and `"".join` take one directly, without extra brackets:',
        py('total = sum(n * n for n in range(1_000_000))',
           'print(total)',
           'words = ["apple", "fig", "banana"]',
           'print(any(w.startswith("b") for w in words))     # True',
           'print(", ".join(w.title() for w in words))'),
        'See the difference in the order things happen in [[explain:generators]].',
        '## When a loop is better',
        'A comprehension is for building a collection. If the loop prints, writes files or does several things per item, a plain `for` loop reads better. And a comprehension that needs three lines or three nested `for`s is a loop in disguise: write the loop.'
      ].join('\n\n'),
      java: [
        java('List<String> longWords = words.stream()',
             '    .filter(w -> w.length() > 4)',
             '    .map(String::toUpperCase)',
             '    .toList();'),
        'is `[w.upper() for w in words if len(w) > 4]`. `Collectors.toMap(...)` is a dict comprehension, `Collectors.toSet()` a set comprehension, and `.mapToInt(...).sum()` is `sum(...)` over a generator expression. Like a stream, a generator expression is lazy; a list comprehension is eager, like a stream that ends in `.toList()`.'
      ].join('\n\n'),
      js: 'JavaScript has no comprehensions: `words.filter(w => w.length > 4).map(w => w.toUpperCase())` is the same pipeline. Python has `map()` and `filter()` too, but comprehensions are the usual style.',
      example: {
        code: String.raw`orders = [
    {"item": "tea", "qty": 2, "price": 30},
    {"item": "cake", "qty": 1, "price": 120},
    {"item": "coffee", "qty": 3, "price": 45},
    {"item": "water", "qty": 0, "price": 20},
]

# a list comprehension with a filter
names = [o["item"] for o in orders if o["qty"] > 0]
print(names)

# a dict comprehension: item -> line total
totals = {o["item"]: o["qty"] * o["price"] for o in orders if o["qty"]}
print(totals)

# a generator expression straight into sum()
print("grand total:", sum(o["qty"] * o["price"] for o in orders))

# a set comprehension: the different last digits of the prices
print({o["price"] % 10 for o in orders})
`,
        note: 'Change the filter to `if o["price"] < 50` and run it again. Then turn the dict comprehension\'s curly brackets into square ones and read the error.'
      },
      challenge: {
        title: 'Rewrite the loops as comprehensions',
        task: [
          'The starter works, but it builds three results with `for` loops. Replace each loop with one comprehension, keeping the names:',
          '1. `evens_squared`: the squares of the even numbers in `numbers`, in order.',
          '2. `initials`: a dict from each name in `names` to its first letter, upper-cased.',
          '3. `total_length`: the number of letters in all the names together, with `sum()` over a generator expression.',
          '4. Print the three results, as the starter does. No `for` statements may be left (the `for` inside a comprehension is fine).'
        ].join('\n\n'),
        starter: String.raw`numbers = [3, 8, 2, 7, 6, 11, 4]
names = ["asha", "ravi", "li", "sam"]

evens_squared = []
for n in numbers:
    if n % 2 == 0:
        evens_squared.append(n * n)

initials = {}
for name in names:
    initials[name] = name[0].upper()

total_length = 0
for name in names:
    total_length += len(name)

print(evens_squared)
print(initials)
print(total_length)
`,
        solution: String.raw`numbers = [3, 8, 2, 7, 6, 11, 4]
names = ["asha", "ravi", "li", "sam"]

evens_squared = [n * n for n in numbers if n % 2 == 0]
initials = {name: name[0].upper() for name in names}
total_length = sum(len(name) for name in names)

print(evens_squared)
print(initials)
print(total_length)
`,
        hints: [
          '`[n * n for n in numbers if n % 2 == 0]`: the value first, then the `for`, then the condition.',
          'A dict comprehension has a key and a value: `{name: name[0].upper() for name in names}`.',
          '`sum(...)` takes a generator expression directly, with no extra brackets: `sum(len(name) for name in names)`.'
        ],
        checks: [
          { label: '`evens_squared` is `[64, 4, 36, 16]`', code: 'assert evens_squared == [64, 4, 36, 16]' },
          { label: '`initials` maps each name to its capital first letter', code: 'assert initials == {"asha": "A", "ravi": "R", "li": "L", "sam": "S"}' },
          { label: '`total_length` is 13', code: 'assert total_length == 13' },
          { label: 'It works for other numbers', code: 'r = rerun(numbers=[1, 2, 3, 4])\nassert r.evens_squared == [4, 16], f"with numbers = [1, 2, 3, 4], evens_squared is {r.evens_squared}"' },
          { label: 'It uses a list comprehension, a dict comprehension and a generator expression', code: 'assert uses("ListComp"), "evens_squared = [... for ... if ...]"\nassert uses("DictComp"), "initials = {name: ... for name in names}"\nassert uses("GeneratorExp"), "total_length = sum(len(name) for name in names)"' },
          { label: 'No `for` statements are left', code: 'assert not uses("For"), "replace each for loop with a comprehension"' },
          { label: 'It prints the three results', code: 'assert lines == ["[64, 4, 36, 16]", "{\'asha\': \'A\', \'ravi\': \'R\', \'li\': \'L\', \'sam\': \'S\'}", "13"]' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'py-slicing', track: 'pythonic',
      title: 'Slicing: [start:stop:step]',
      summary: 'Take part of a string, list or tuple in one expression: negative positions, steps, reversing, copying, and replacing part of a list.',
      keywords: ['slice', 'slicing', 'substring', 'sublist', 'index', 'negative index', 'reverse', 'step', 'copy', '[::-1]', 'subList'],
      docs: 'https://docs.python.org/3/library/stdtypes.html#common-sequence-operations',
      body: [
        '`seq[start:stop]` gives the items from position `start` up to, but not including, `stop`. It works the same on strings, lists, tuples and ranges. Leave a number out and it means "from the start" or "to the end".',
        py('letters = "abcdefgh"',
           'print(letters[2:5])    # cde: positions 2, 3 and 4',
           'print(letters[:3])     # abc: from the start',
           'print(letters[5:])     # fgh: to the end',
           'print(letters[:])      # the whole thing'),
        '## Negative positions count from the end',
        text('  P   y   t   h   o   n',
             '  0   1   2   3   4   5     counted from the front',
             ' -6  -5  -4  -3  -2  -1     counted from the end'),
        py('letters = "abcdefgh"',
           'print(letters[-1])     # h: the last one',
           'print(letters[-3:])    # fgh: the last three',
           'print(letters[:-2])    # abcdef: all but the last two'),
        '## A step',
        'A third number is the step: every second item, every third, or backwards with a negative step.',
        py('nums = list(range(10))',
           'print(nums[::2])       # [0, 2, 4, 6, 8]',
           'print(nums[1::3])      # [1, 4, 7]',
           'print(nums[::-1])      # [9, 8, ..., 0]: reversed',
           'print("level"[::-1] == "level")   # a palindrome test'),
        '## A slice never fails',
        'An index past the end raises `IndexError`, but a slice is trimmed to what exists:',
        py('short = [1, 2, 3]',
           'print(short[1:100])    # [2, 3]',
           'print(short[5:])       # []'),
        '## A slice is a new object',
        'Slicing a list gives a new list (a shallow copy), so `b = a[:]` is the usual way to copy a list. See what is and is not shared in [[explain:names]].',
        py('a = [1, 2, 3]',
           'b = a[:]',
           'b.append(4)',
           'print(a, b)            # [1, 2, 3] [1, 2, 3, 4]'),
        '## Replacing part of a list',
        'Assigning to a slice replaces those items, and the new part may be longer or shorter. `del` removes a slice. Strings and tuples cannot change, so for them slicing only reads.',
        py('nums = [1, 2, 3, 4, 5]',
           'nums[1:3] = ["two", "three", "and a half"]',
           'print(nums)            # [1, \'two\', \'three\', \'and a half\', 4, 5]',
           'del nums[:2]',
           'print(nums)')
      ].join('\n\n'),
      java: '`s.substring(2, 5)` is `s[2:5]` and `list.subList(2, 5)` is `items[2:5]`, with two differences: a Python slice is a **copy**, not a view of the original, and out-of-range bounds are trimmed instead of throwing `IndexOutOfBoundsException`. Negative positions and steps have no Java equivalent: `new StringBuilder(s).reverse().toString()` is `s[::-1]`, and the last character, `s.charAt(s.length() - 1)`, is `s[-1]`.',
      js: '`s.slice(2, 5)` and `arr.slice(-3)` work like Python slices without a step. Python uses one syntax for strings, lists and tuples.',
      example: {
        code: String.raw`word = "Pythonic"
print(word[0], word[-1])       # the first and last letters
print(word[:6])                # Python
print(word[-3:])               # nic
print(word[::-1])              # cinohtyP

scores = [88, 92, 79, 65, 95, 70]
print("top three:", sorted(scores)[-3:])
print("every other:", scores[::2])

week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
workdays, weekend = week[:5], week[5:]
print(workdays, weekend)
`
      },
      challenge: {
        title: 'Five functions, one slice each',
        task: [
          'Write each function with slices, no loops:',
          '1. `first_and_last(items, n)` returns the first `n` and the last `n` items as one list: `first_and_last([1, 2, 3, 4, 5, 6], 2)` is `[1, 2, 5, 6]`.',
          '2. `middle(text)` returns the text without its first and last character: `middle("python")` is `"ytho"`.',
          '3. `every_other(items)` returns the items at positions 0, 2, 4 and so on, for a list or a string.',
          '4. `is_palindrome(word)` returns `True` when the word reads the same backwards, ignoring upper and lower case.',
          '5. `rotate(items, k)` moves the first `k` items to the end, in a new list: `rotate([1, 2, 3, 4, 5], 2)` is `[3, 4, 5, 1, 2]`.'
        ].join('\n\n'),
        starter: String.raw`def first_and_last(items, n):
    pass


def middle(text):
    pass


def every_other(items):
    pass


def is_palindrome(word):
    pass


def rotate(items, k):
    pass


print(first_and_last([1, 2, 3, 4, 5, 6], 2))
print(middle("python"))
print(every_other("abcdefg"))
print(is_palindrome("Level"))
print(rotate([1, 2, 3, 4, 5], 2))
`,
        solution: String.raw`def first_and_last(items, n):
    return items[:n] + items[-n:]


def middle(text):
    return text[1:-1]


def every_other(items):
    return items[::2]


def is_palindrome(word):
    word = word.lower()
    return word == word[::-1]


def rotate(items, k):
    return items[k:] + items[:k]


print(first_and_last([1, 2, 3, 4, 5, 6], 2))
print(middle("python"))
print(every_other("abcdefg"))
print(is_palindrome("Level"))
print(rotate([1, 2, 3, 4, 5], 2))
`,
        hints: [
          '`items[:n]` is the first n items, `items[-n:]` the last n; `+` joins two lists into a new one.',
          '`text[1:-1]` drops one character at each end. A step of 2, `items[::2]`, takes every other item.',
          'Reversed is `word[::-1]`. For `rotate`, the part from position k on comes first: `items[k:] + items[:k]`.'
        ],
        checks: [
          { label: '`first_and_last([1, 2, 3, 4, 5, 6], 2)` is `[1, 2, 5, 6]`', code: 'assert first_and_last([1, 2, 3, 4, 5, 6], 2) == [1, 2, 5, 6]\nassert first_and_last(list("abcdef"), 1) == ["a", "f"]' },
          { label: '`middle("python")` is `"ytho"`, and `middle("ab")` is `""`', code: 'assert middle("python") == "ytho"\nassert middle("ab") == ""' },
          { label: '`every_other` works on lists and strings', code: 'assert every_other([1, 2, 3, 4, 5]) == [1, 3, 5]\nassert every_other("abcdefg") == "aceg"' },
          { label: '`is_palindrome` ignores case', code: 'assert is_palindrome("Level") is True\nassert is_palindrome("a") and is_palindrome("noon")\nassert is_palindrome("Python") is False' },
          { label: '`rotate([1, 2, 3, 4, 5], 2)` is `[3, 4, 5, 1, 2]`', code: 'assert rotate([1, 2, 3, 4, 5], 2) == [3, 4, 5, 1, 2]\nassert rotate([1, 2, 3], 0) == [1, 2, 3]' },
          { label: '`rotate` returns a new list and leaves the original alone', code: 'orig = [1, 2, 3]\nnew = rotate(orig, 1)\nassert orig == [1, 2, 3] and new is not orig' },
          { label: 'No loops: each function is a slice', code: 'assert uses("Slice"), "use slices such as items[1:-1]"\nassert not uses("For", "While", "ListComp"), "slices can do all five without a loop"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'py-zip-enumerate-sorted', track: 'pythonic',
      title: 'zip, enumerate and sorting with a key',
      summary: 'Loop with a counter (enumerate), walk two lists side by side (zip), and sort or find the max and min by any rule with key=, instead of writing a Comparator.',
      keywords: ['zip', 'enumerate', 'sorted', 'sort', 'key', 'reverse', 'min', 'max', 'comparator', 'index', 'reversed', 'itemgetter', 'ranking'],
      docs: 'https://docs.python.org/3/howto/sorting.html',
      body: [
        '## enumerate: the position and the item',
        'When a loop needs the position too, `enumerate` hands out (position, item) pairs. `start=1` counts from 1 for display.',
        py('fruits = ["apple", "banana", "cherry"]',
           'for i, fruit in enumerate(fruits):',
           '    print(i, fruit)',
           'for n, fruit in enumerate(fruits, start=1):',
           '    print(f"{n}. {fruit}")'),
        'So `for i in range(len(fruits)):` followed by `fruits[i]` is never needed.',
        '## zip: two lists side by side',
        py('names = ["Asha", "Ravi", "Li"]',
           'scores = [91, 78, 85]',
           'for name, score in zip(names, scores):',
           '    print(f"{name}: {score}")',
           'print(dict(zip(names, scores)))     # {\'Asha\': 91, \'Ravi\': 78, \'Li\': 85}'),
        '`zip` stops at the end of the shortest list. Pass `strict=True` to get a `ValueError` when the lengths differ, which is usually a bug.',
        '## sorted and list.sort',
        '`sorted(x)` returns a new sorted list from anything you can loop over. `list.sort()` sorts the list itself and returns `None`, so never write `items = items.sort()`.',
        py('nums = [5, 2, 9, 1]',
           'print(sorted(nums))                 # [1, 2, 5, 9]',
           'print(sorted(nums, reverse=True))   # [9, 5, 2, 1]',
           'nums.sort()',
           'print(nums)'),
        '## key=: sort by anything',
        '`key` is a function Python calls once for each item; the items are put in the order of what it returns.',
        py('words = ["banana", "Kiwi", "apple", "fig"]',
           'print(sorted(words))                    # capital letters first: Kiwi, apple...',
           'print(sorted(words, key=str.lower))     # ignoring case',
           'print(sorted(words, key=len))           # shortest first'),
        '## Several keys: return a tuple',
        'Tuples compare item by item, so a tuple key sorts by its first item, then by the second. To reverse a number key alone, make it negative. Sorting is **stable**: items with equal keys keep the order they had.',
        py('people = [("Asha", 31), ("Ravi", 25), ("Li", 31), ("Sam", 25)]',
           'print(sorted(people, key=lambda p: (p[1], p[0])))     # by age, then name',
           'print(sorted(people, key=lambda p: (-p[1], p[0])))    # oldest first, then name'),
        '`lambda p: (p[1], p[0])` is a one-line function; [[lesson:py-lambdas]] covers it.',
        '## min and max take a key too',
        py('people = [("Asha", 31), ("Ravi", 25), ("Li", 33)]',
           'print(max(people, key=lambda p: p[1]))     # (\'Li\', 33): the oldest',
           'print(min(["kiwi", "banana", "fig"], key=len))'),
        '`reversed(items)` walks a list backwards without copying it.'
      ].join('\n\n'),
      java: [
        java('people.sort(Comparator.comparing(Person::age).thenComparing(Person::name));'),
        'is `people.sort(key=lambda p: (p.age, p.name))`. A key function is called once per item, a `Comparator` once per comparison, and you never write a `compare` that returns -1, 0 or 1. For a reversed key, make a number negative or pass `reverse=True`. Java has no `zip`, and `enumerate` replaces the counting loop `for (int i = 0; i < list.size(); i++)`.'
      ].join('\n\n'),
      js: 'JavaScript\'s `arr.sort()` compares as strings unless given a compare function; Python\'s `sorted` compares the values themselves and takes a key. `arr.entries()` is the nearest thing to `enumerate`.',
      example: {
        code: String.raw`names = ["Asha", "Ravi", "Li", "Sam", "Mei"]
scores = [91, 78, 91, 64, 85]

# zip pairs them; sorted ranks them: highest score first, then by name
ranking = sorted(zip(names, scores), key=lambda pair: (-pair[1], pair[0]))

for place, (name, score) in enumerate(ranking, start=1):
    print(f"{place}. {name:<5}{score}")

best = max(zip(names, scores), key=lambda pair: pair[1])
print("best:", best)
print("shortest name:", min(names, key=len))
`
      },
      challenge: {
        title: 'A leaderboard',
        task: [
          '`players` and `points` are two lists in the same order.',
          '1. `leaderboard(players, points)` returns a list of `(player, points)` tuples, highest points first. Players with equal points are in alphabetical order.',
          '2. `podium(players, points)` returns the lines for the top three, numbered from 1: `"1. Asha (120)"`.',
          '3. Print each line of the podium.',
          'Use `zip`, `sorted(..., key=...)` and `enumerate`; the starter\'s `range(len(...))` loop has to go.'
        ].join('\n\n'),
        starter: String.raw`players = ["Ravi", "Asha", "Li", "Sam", "Mei", "Om"]
points = [95, 120, 95, 80, 110, 60]


def leaderboard(players, points):
    board = []
    for i in range(len(players)):
        board.append((players[i], points[i]))
    return board


def podium(players, points):
    return []


for line in podium(players, points):
    print(line)
`,
        solution: String.raw`players = ["Ravi", "Asha", "Li", "Sam", "Mei", "Om"]
points = [95, 120, 95, 80, 110, 60]


def leaderboard(players, points):
    return sorted(zip(players, points), key=lambda pair: (-pair[1], pair[0]))


def podium(players, points):
    top = leaderboard(players, points)[:3]
    return [f"{place}. {name} ({score})" for place, (name, score) in enumerate(top, start=1)]


for line in podium(players, points):
    print(line)
`,
        hints: [
          '`zip(players, points)` gives the pairs `("Ravi", 95)`, `("Asha", 120)` and so on.',
          'A tuple key sorts by its first item, then its second: `key=lambda pair: (-pair[1], pair[0])`. The minus puts high points first while names stay A to Z.',
          '`for place, (name, score) in enumerate(top, start=1):` unpacks the number and the pair in one go; a comprehension can do the same.'
        ],
        checks: [
          { label: '`leaderboard` is sorted by points, highest first', code: 'board = leaderboard(players, points)\nassert [p for _, p in board] == [120, 110, 95, 95, 80, 60], f"the points come in this order: {[p for _, p in board]}"' },
          { label: 'Equal points are in alphabetical order (Li before Ravi)', code: 'assert leaderboard(players, points)[2:4] == [("Li", 95), ("Ravi", 95)]' },
          { label: '`leaderboard` returns `(player, points)` tuples', code: 'assert leaderboard(["A"], [1]) == [("A", 1)]' },
          { label: '`podium` is the top three, numbered', code: 'assert podium(players, points) == ["1. Asha (120)", "2. Mei (110)", "3. Li (95)"]' },
          { label: 'It prints the podium', code: 'assert lines == ["1. Asha (120)", "2. Mei (110)", "3. Li (95)"]' },
          { label: 'It uses `zip`, `sorted` with a key, and `enumerate`', code: 'assert calls("zip"), "pair the lists with zip(players, points)"\nassert calls("enumerate"), "number the places with enumerate(..., start=1)"\nassert any(isinstance(c, ast.Call) and getattr(c.func, "id", None) == "sorted" and any(k.arg == "key" for k in c.keywords) for c in ast.walk(tree)), "sort with sorted(..., key=...)"' },
          { label: 'No `range(len(...))` loop is left', code: 'assert "range(len(" not in src.replace(" ", ""), "zip and enumerate replace range(len(...))"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'py-collections', track: 'pythonic',
      title: 'The collections module: Counter, defaultdict, deque and namedtuple',
      summary: 'Four ready-made containers: Counter counts things, defaultdict groups them, deque adds and removes fast at both ends, and namedtuple gives a tuple field names.',
      keywords: ['collections', 'counter', 'defaultdict', 'deque', 'namedtuple', 'most_common', 'group by', 'grouping', 'queue', 'frequency', 'counting'],
      docs: 'https://docs.python.org/3/library/collections.html',
      body: [
        '## Counter: count anything',
        py('from collections import Counter',
           '',
           'votes = ["tea", "coffee", "tea", "juice", "tea", "coffee"]',
           'counts = Counter(votes)',
           'print(counts)                      # Counter({\'tea\': 3, \'coffee\': 2, \'juice\': 1})',
           'print(counts["tea"], counts["water"])   # 3 0: a missing key counts as 0',
           'print(counts.most_common(2))       # [(\'tea\', 3), (\'coffee\', 2)]'),
        'A `Counter` is a dict from each thing to how often it appears. It counts the letters of a string too, and `update` adds more:',
        py('from collections import Counter',
           '',
           'letters = Counter("mississippi")',
           'print(letters.most_common(1))      # [(\'i\', 4)]',
           'letters.update("miss")',
           'print(letters["s"])                # 6'),
        '## defaultdict: a dict that fills in missing keys',
        'Grouping with a plain dict needs a check before every append. A `defaultdict` makes the missing value for you:',
        py('from collections import defaultdict',
           '',
           'words = ["apple", "avocado", "banana", "blueberry", "cherry"]',
           'by_letter = defaultdict(list)',
           'for w in words:',
           '    by_letter[w[0]].append(w)       # no "if key not in by_letter" first',
           'print(dict(by_letter))'),
        'The argument is the function that makes a default: `list` makes `[]`, `int` makes `0`, `set` makes an empty set.',
        py('from collections import defaultdict',
           '',
           'totals = defaultdict(int)',
           'for item, amount in [("tea", 30), ("cake", 120), ("tea", 30)]:',
           '    totals[item] += amount',
           'print(dict(totals))                # {\'tea\': 60, \'cake\': 120}'),
        '## deque: a queue open at both ends',
        '`list.pop(0)` moves every remaining item one place; `deque.popleft()` takes constant time. With `maxlen`, a deque keeps only the newest items.',
        py('from collections import deque',
           '',
           'queue = deque(["a", "b"])',
           'queue.append("c")            # at the right',
           'queue.appendleft("z")        # at the left',
           'print(queue.popleft(), queue.pop())    # z c',
           '',
           'recent = deque(maxlen=3)',
           'for page in ["home", "lessons", "loops", "playground"]:',
           '    recent.append(page)',
           'print(list(recent))          # [\'lessons\', \'loops\', \'playground\']'),
        '## namedtuple: a tuple with field names',
        py('from collections import namedtuple',
           '',
           'Point = namedtuple("Point", ["x", "y"])',
           'p = Point(3, 4)',
           'print(p.x, p[1], p)          # by name or by position',
           'x, y = p                     # still a tuple',
           'print(p._replace(x=10))      # a changed copy: tuples cannot change'),
        'For a record with methods, defaults and type hints, a dataclass is usually better; the Objects track covers it. Since Python 3.7 a plain `dict` keeps insertion order, so `OrderedDict` is rarely needed.'
      ].join('\n\n'),
      java: [
        '| Java | Python |\n|---|---|\n' +
        '| `groupingBy(w -> w, counting())` | `Counter(words)` |\n' +
        '| `map.computeIfAbsent(k, x -> new ArrayList<>()).add(v)` | `groups[k].append(v)` with a `defaultdict(list)` |\n' +
        '| `map.merge(word, 1, Integer::sum)` | `counts[word] += 1` |\n' +
        '| `ArrayDeque` | `deque` |\n' +
        '| `record Point(int x, int y)` | `namedtuple("Point", ["x", "y"])`, or a dataclass |',
        'All four are in the standard library, so there is nothing to add to a build file.'
      ].join('\n\n'),
      js: 'JavaScript has `Map` but nothing like `Counter` or `defaultdict`; the usual pattern is `map.set(k, (map.get(k) ?? 0) + 1)`, which is what a `Counter` does for you.',
      example: {
        code: String.raw`from collections import Counter, defaultdict, deque, namedtuple

text = "the quick brown fox jumps over the lazy dog the end"
words = text.split()

counts = Counter(words)
print("most common:", counts.most_common(2))

by_length = defaultdict(list)
for w in words:
    by_length[len(w)].append(w)
print("3-letter words:", by_length[3])

last_three = deque(words, maxlen=3)
print("last three:", list(last_three))

Word = namedtuple("Word", ["text", "count"])
top = Word(*counts.most_common(1)[0])
print(top.text, "appears", top.count, "times")
`
      },
      challenge: {
        title: 'Word statistics',
        task: [
          'For the lower-case `words` of `text`, make:',
          '1. `counts`: a `Counter` of the words.',
          '2. `top_two`: the two most common words with their counts, from `most_common`.',
          '3. `by_first_letter`: a `defaultdict(list)` from each first letter to the different words that start with it, in the order they first appear (each word once).',
          '4. `recent`: a `deque` with `maxlen=3` holding the last three words.',
          'The starter prints all four.'
        ].join('\n\n'),
        starter: String.raw`from collections import Counter, defaultdict, deque

text = "Spam and eggs and spam and ham and SPAM"
words = text.lower().split()

counts = {}
top_two = []
by_first_letter = {}
recent = []

print(counts)
print(top_two)
print(dict(by_first_letter))
print(list(recent))
`,
        solution: String.raw`from collections import Counter, defaultdict, deque

text = "Spam and eggs and spam and ham and SPAM"
words = text.lower().split()

counts = Counter(words)
top_two = counts.most_common(2)

by_first_letter = defaultdict(list)
for w in words:
    if w not in by_first_letter[w[0]]:
        by_first_letter[w[0]].append(w)

recent = deque(words, maxlen=3)

print(counts)
print(top_two)
print(dict(by_first_letter))
print(list(recent))
`,
        hints: [
          '`Counter(words)` counts everything at once; `counts.most_common(2)` is the top two as (word, count) pairs.',
          'With `by_first_letter = defaultdict(list)`, `by_first_letter[w[0]]` is an empty list the first time, so you can `.append(w)` straight away. Check `if w not in by_first_letter[w[0]]:` first, to add each word once.',
          '`deque(words, maxlen=3)` keeps only the last three: older ones fall off the left end.'
        ],
        checks: [
          { label: '`counts` is a `Counter`: "and" 4 times, "spam" 3', code: 'assert isinstance(counts, Counter), f"counts is a {type(counts).__name__}, not a Counter"\nassert counts["and"] == 4 and counts["spam"] == 3 and counts["ham"] == 1' },
          { label: '`top_two` is `[("and", 4), ("spam", 3)]`', code: 'assert top_two == [("and", 4), ("spam", 3)]' },
          { label: '`by_first_letter` is a `defaultdict(list)`', code: 'assert isinstance(by_first_letter, defaultdict) and by_first_letter.default_factory is list, "by_first_letter = defaultdict(list)"' },
          { label: '`by_first_letter` groups the different words by their first letter', code: 'assert dict(by_first_letter) == {"s": ["spam"], "a": ["and"], "e": ["eggs"], "h": ["ham"]}, f"got {dict(by_first_letter)}"' },
          { label: '`recent` is a deque of the last three words', code: 'assert isinstance(recent, deque) and recent.maxlen == 3, "recent = deque(words, maxlen=3)"\nassert list(recent) == ["ham", "and", "spam"]' },
          { label: 'It works for other text', code: 'r = rerun(text="b a b c b a")\nassert r.top_two == [("b", 3), ("a", 2)] and list(r.recent) == ["c", "b", "a"], f"top_two is {r.top_two}, recent is {list(r.recent)}"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'py-text', track: 'pythonic',
      title: 'Working with text: string methods, formatting and re',
      summary: 'Split, join, strip and test strings; line up columns with format specs; and find patterns with regular expressions (the re module).',
      keywords: ['string methods', 'split', 'join', 'strip', 'replace', 'format spec', 'padding', 'regex', 'regular expression', 're', 'findall', 'sub', 'search', 'parse', 'text processing'],
      docs: 'https://docs.python.org/3/library/re.html',
      body: [
        'Strings cannot change, so every method returns a new string. The Basics lesson showed `upper`, `strip` and `split`; these are the rest of the everyday kit.',
        '## split and join',
        py('line = "  Asha, 31 , Pune  "',
           'parts = [p.strip() for p in line.split(",")]',
           'print(parts)                        # [\'Asha\', \'31\', \'Pune\']',
           'print(" | ".join(parts))            # join is a method of the separator',
           'print("a b   c".split())            # no argument: split on any run of spaces',
           'print("key=value=x".split("=", 1))  # at most one split'),
        '`join` needs strings: `", ".join(str(n) for n in [1, 2, 3])`.',
        '## Asking about a string',
        py('code = "PY-2026-0042"',
           'print(code.startswith("PY"), code.endswith("42"))',
           'print("2026".isdigit(), "abc".isalpha(), "   ".isspace())',
           'print(code.count("-"), code.find("2026"), code.find("zzz"))   # find gives -1 when absent',
           'print(code.partition("-"))          # (\'PY\', \'-\', \'2026-0042\')'),
        '## Format specs: columns and numbers',
        'After a colon inside an f-string\'s braces comes a **format spec**: width, alignment, separators and decimals.',
        py('items = [("tea", 30), ("chocolate cake", 120.5), ("water", 20)]',
           'for name, price in items:',
           '    print(f"{name:<16}{price:>8.2f}")',
           'print(f"{1234567:,}")        # 1,234,567',
           'print(f"{0.4567:.1%}")       # 45.7%',
           'print(f"{42:05d}")           # 00042'),
        '| Spec | Means | Example |\n|---|---|---|\n| `<10`, `>10`, `^10` | left, right or centre in 10 characters | `f"{x:>10}"` |\n| `.2f` | 2 decimal places | `3.14` |\n| `,` | a thousands separator | `1,234,567` |\n| `.1%` | a percentage | `45.7%` |\n| `05d` | pad with zeros to 5 digits | `00042` |',
        '## Regular expressions: re',
        'For patterns, use the `re` module. Write patterns as **raw strings**, `r"..."`, so their backslashes reach `re` unchanged.',
        py('import re',
           '',
           'log = "2026-10-09 ERROR disk full; 2026-10-09 WARN slow; 2026-10-10 ERROR timeout"',
           String.raw`print(re.findall(r"\d{4}-\d{2}-\d{2}", log))   # every date`,
           String.raw`print(re.findall(r"ERROR (\w+)", log))          # just the group: ['disk', 'timeout']`,
           String.raw`print(re.sub(r"\d", "#", "card 1234-5678"))     # replace every digit`),
        '## match, search and groups',
        '`re.match` looks only at the start of the string, `re.search` anywhere, `re.fullmatch` at the whole string. Each returns a match object, or `None` when nothing matches, so test it before calling `.group()`.',
        py('import re',
           '',
           String.raw`m = re.match(r"(\w+)@(\w+)\.com", "ravi@example.com")`,
           'if m:',
           '    print(m.group(1), m.group(2))     # ravi example',
           String.raw`print(re.search(r"\d+", "order 66 shipped").group())`,
           String.raw`pattern = re.compile(r"(?P<key>\w+)=(?P<value>\w+)")`,
           'for found in pattern.finditer("a=1 b=2"):',
           '    print(found["key"], found["value"])'),
        'Reach for `re` only when a string method will not do: `"x" in s`, `s.startswith(...)` and `s.split(...)` are simpler and faster.'
      ].join('\n\n'),
      java: '`String.join(", ", list)` is `", ".join(items)`, and `String.format("%-10s%8.2f", a, b)` is `f"{a:<10}{b:8.2f}"`. Python\'s `re` is `java.util.regex`: `re.compile` is `Pattern.compile`, `re.search` is `matcher.find()`, `re.fullmatch` is `matcher.matches()`, and `m.group(1)` is the same. Raw strings save the double backslashes Java needs: Java writes `"\\\\d+"`, Python writes `r"\\d+"`.',
      js: 'JavaScript writes regular expressions as literals, `/\\d+/g`; Python passes a string to `re`. `str.split(",")` works like JavaScript\'s, but `join` is the other way round: `", ".join(items)` in Python, `items.join(", ")` in JavaScript.',
      example: {
        code: String.raw`import re

raw = """
  Asha , asha@example.com , 2026-03-14
  Ravi,ravi.k@mail.in,2025-11-02
  li ,  li@example.com,  2026-01-30
"""

print(f"{'Name':<6}{'Domain':<13}{'Year':>5}")
for line in raw.strip().splitlines():
    name, email, joined = [part.strip() for part in line.split(",")]
    domain = email.split("@")[1]
    year = re.match(r"(\d{4})-", joined).group(1)
    print(f"{name.title():<6}{domain:<13}{year:>5}")

print(re.findall(r"[\w.]+@[\w.]+", raw))
`
      },
      challenge: {
        title: 'Read a log',
        task: [
          '`log` holds lines such as `2026-10-09 14:02:11 ERROR [db] connection lost`. Write:',
          '1. `parse(line)` returns a tuple `(level, source, message)`; for that line, `("ERROR", "db", "connection lost")`. Use `re.match` with groups.',
          '2. `summary(log)` returns a dict from each level to how many lines have it.',
          '3. `report(log)` returns one line per level, sorted by level name, the level padded to 9 characters and then the count: `"ERROR    2"`.',
          '4. Print the report lines.'
        ].join('\n\n'),
        starter: String.raw`import re

log = """2026-10-09 14:02:11 ERROR [db] connection lost
2026-10-09 14:02:15 INFO [web] request served
2026-10-09 14:03:01 WARN [db] slow query
2026-10-09 14:05:42 ERROR [auth] bad token
2026-10-09 14:06:00 INFO [web] request served"""


def parse(line):
    parts = line.split(" ")
    return parts[2], parts[3], parts[4]


def summary(log):
    return {}


def report(log):
    return []


for line in report(log):
    print(line)
`,
        solution: String.raw`import re

log = """2026-10-09 14:02:11 ERROR [db] connection lost
2026-10-09 14:02:15 INFO [web] request served
2026-10-09 14:03:01 WARN [db] slow query
2026-10-09 14:05:42 ERROR [auth] bad token
2026-10-09 14:06:00 INFO [web] request served"""


def parse(line):
    m = re.match(r"\S+ \S+ (\w+) \[(\w+)\] (.*)", line)
    return m.group(1), m.group(2), m.group(3)


def summary(log):
    counts = {}
    for line in log.splitlines():
        level = parse(line)[0]
        counts[level] = counts.get(level, 0) + 1
    return counts


def report(log):
    return [f"{level:<9}{count}" for level, count in sorted(summary(log).items())]


for line in report(log):
    print(line)
`,
        hints: [
          'A pattern for one line: `r"\\S+ \\S+ (\\w+) \\[(\\w+)\\] (.*)"`. That is two runs of non-spaces (the date and the time), the level, the source inside square brackets (written `\\[` and `\\]`, because `[` means something in a pattern), then the rest. `m.group(1)` is the first `( )`.',
          'In `summary`, loop over `log.splitlines()` and count with `counts.get(level, 0) + 1`, or use a `Counter`.',
          '`sorted(d.items())` sorts the pairs by key; `f"{level:<9}{count}"` pads the level to 9 characters.'
        ],
        checks: [
          { label: '`parse` splits a line into (level, source, message)', code: 'assert parse("2026-10-09 14:02:11 ERROR [db] connection lost") == ("ERROR", "db", "connection lost")' },
          { label: '`parse` keeps the whole message, and the source without brackets', code: 'assert parse("2026-01-01 00:00:00 WARN [cache] almost full, 95% used") == ("WARN", "cache", "almost full, 95% used")' },
          { label: '`summary(log)` counts each level', code: 'assert summary(log) == {"ERROR": 2, "INFO": 2, "WARN": 1}' },
          { label: '`report(log)` is sorted, with the level padded to 9 characters', code: 'assert report(log) == ["ERROR    2", "INFO     2", "WARN     1"]' },
          { label: 'It prints the report', code: 'assert lines == ["ERROR    2", "INFO     2", "WARN     1"]' },
          { label: '`parse` uses a regular expression', code: 'assert calls("match") or calls("search") or calls("fullmatch"), "use re.match(...) with groups in parse"' },
          { label: 'It works on another log', code: 'other = "2026-01-01 00:00:00 DEBUG [x] a\\n2026-01-01 00:00:01 DEBUG [y] b"\nassert report(other) == ["DEBUG    2"], f"got {report(other)}"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'py-files-formats', track: 'pythonic',
      title: 'Files and formats: pathlib, csv and json',
      summary: 'Paths with pathlib, CSV files with csv.DictReader and DictWriter, and Python data to JSON and back, all from the standard library.',
      keywords: ['pathlib', 'path', 'file', 'csv', 'json', 'dictreader', 'dictwriter', 'dumps', 'loads', 'serialize', 'glob', 'folder', 'read_text', 'write_text'],
      docs: 'https://docs.python.org/3/library/pathlib.html',
      body: [
        '## pathlib.Path',
        'A `Path` is a file or folder name with methods. The `/` operator joins parts, and `read_text` and `write_text` read or write a whole file in one call.',
        py('from pathlib import Path',
           '',
           'folder = Path("reports")',
           'folder.mkdir(exist_ok=True)',
           'file = folder / "summary.txt"           # / joins path parts',
           'file.write_text("all good\\n", encoding="utf-8")',
           'print(file.read_text(encoding="utf-8"), end="")',
           'print(file.name, file.stem, file.suffix, file.parent)',
           'print(file.exists(), sorted(p.name for p in folder.glob("*.txt")))'),
        '`Path.cwd()` is the current folder and `Path.home()` your home folder. For a file too big to read at once, `with open(path) as f:` and `for line in f:` still work as in [[lesson:py-input-files]].',
        '## CSV',
        '`csv.DictWriter` writes rows from dicts, `csv.DictReader` reads each row back as a dict keyed by the header. Every value comes back as text. Open CSV files with `newline=""`: the csv module handles line endings itself, and without it Windows gets blank lines between rows.',
        py('import csv',
           '',
           'rows = [{"name": "Asha", "city": "Pune", "score": 91},',
           '        {"name": "Ravi", "city": "Hyderabad", "score": 78}]',
           'with open("people.csv", "w", newline="", encoding="utf-8") as f:',
           '    writer = csv.DictWriter(f, fieldnames=["name", "city", "score"])',
           '    writer.writeheader()',
           '    writer.writerows(rows)',
           '',
           'with open("people.csv", newline="", encoding="utf-8") as f:',
           '    for row in csv.DictReader(f):',
           '        print(row["name"], int(row["score"]) + 1)   # the score is text: convert it'),
        '## JSON',
        '`json.dumps` turns Python data into JSON text and `json.loads` turns it back; `json.dump` and `json.load` do the same with a file.',
        py('import json',
           '',
           'data = {"name": "Asha", "skills": ["python", "java"], "active": True, "manager": None}',
           'text = json.dumps(data, indent=2)',
           'print(text)',
           'back = json.loads(text)',
           'print(back["skills"][0], back == data)'),
        '| JSON | Python |\n|---|---|\n| object | `dict` |\n| array | `list` (a tuple becomes a list too) |\n| string | `str` |\n| number | `int` or `float` |\n| `true`, `false` | `True`, `False` |\n| `null` | `None` |',
        'Sets, dates and your own objects are not JSON: `json.dumps` raises `TypeError`. Pass `default=str` to turn them into text, or convert them first.',
        py('import json',
           'from pathlib import Path',
           '',
           'Path("settings.json").write_text(json.dumps({"theme": "dark", "size": 14}), encoding="utf-8")',
           'with open("settings.json", encoding="utf-8") as f:',
           '    settings = json.load(f)',
           'print(settings["theme"], settings["size"] + 1)')
      ].join('\n\n'),
      java: '`pathlib` is `java.nio.file.Path` and `Files`: `Path.of("a", "b")` is `Path("a") / "b"`, `Files.readString(p)` is `p.read_text()`, and `Files.list(dir)` is `p.iterdir()` or `p.glob("*.txt")`. CSV and JSON need no library: in Java you would add OpenCSV and Jackson. `json.loads` gives plain dicts and lists, not your own classes; the nearest thing to Jackson\'s `readValue(text, Person.class)` is building a dataclass from the dict, `Person(**data)`, or Pydantic, which FastAPI uses.',
      js: '`JSON.stringify(obj, null, 2)` is `json.dumps(obj, indent=2)`, and `JSON.parse(text)` is `json.loads(text)`.',
      example: {
        code: String.raw`import csv, json
from pathlib import Path

work = Path("shop")
work.mkdir(exist_ok=True)

# a CSV file, as a spreadsheet would save it
sales = work / "sales.csv"
sales.write_text("item,qty,price\ntea,3,30\ncake,1,120\ntea,2,30\n", encoding="utf-8")

# read it back as dicts and total each item
totals = {}
with open(sales, newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        totals[row["item"]] = totals.get(row["item"], 0) + int(row["qty"]) * int(row["price"])
print(totals)

# save the totals as JSON, then read them back
out = work / "totals.json"
out.write_text(json.dumps(totals, indent=2), encoding="utf-8")
print(out.read_text(encoding="utf-8"))
print(json.loads(out.read_text(encoding="utf-8"))["tea"])
print([p.name for p in sorted(work.iterdir())])
`,
        note: 'Every run has its own empty folder, so the files are made fresh each time and do not land anywhere else.'
      },
      challenge: {
        title: 'CSV in, JSON out',
        task: [
          'The program first writes `students.csv` (given). Then:',
          '1. `load(path)` reads the CSV with `csv.DictReader` and returns a list of dicts with `name` (text) and `score` (an int).',
          '2. `grade(score)` returns `"A"` for 85 and above, `"B"` for 70 and above, otherwise `"C"`.',
          '3. `save_report(students, path)` writes JSON with `json.dump` and `indent=2`: `{"count": 4, "average": 76.25, "grades": {"Asha": "A", ...}}`.',
          '4. The bottom of the starter loads the students, saves `report.json` and prints the file.'
        ].join('\n\n'),
        starter: String.raw`import csv, json
from pathlib import Path

Path("students.csv").write_text("name,score\nAsha,91\nRavi,78\nLi,64\nSam,72\n", encoding="utf-8")


def load(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def grade(score):
    pass


def save_report(students, path):
    pass


students = load("students.csv")
save_report(students, "report.json")
print(Path("report.json").read_text(encoding="utf-8"))
`,
        solution: String.raw`import csv, json
from pathlib import Path

Path("students.csv").write_text("name,score\nAsha,91\nRavi,78\nLi,64\nSam,72\n", encoding="utf-8")


def load(path):
    with open(path, newline="", encoding="utf-8") as f:
        return [{"name": row["name"], "score": int(row["score"])} for row in csv.DictReader(f)]


def grade(score):
    if score >= 85:
        return "A"
    if score >= 70:
        return "B"
    return "C"


def save_report(students, path):
    scores = [s["score"] for s in students]
    report = {
        "count": len(students),
        "average": sum(scores) / len(scores),
        "grades": {s["name"]: grade(s["score"]) for s in students},
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)


students = load("students.csv")
save_report(students, "report.json")
print(Path("report.json").read_text(encoding="utf-8"))
`,
        hints: [
          '`csv.DictReader(f)` gives one dict per row, every value as text: convert with `int(row["score"])`.',
          'Build the report as an ordinary dict first, `{"count": ..., "average": ..., "grades": {...}}`, with a dict comprehension for the grades.',
          '`with open(path, "w", encoding="utf-8") as f:` then `json.dump(report, f, indent=2)`.'
        ],
        checks: [
          { label: '`load` returns dicts with the score as an int', code: 'got = load("students.csv")\nassert len(got) == 4 and got[0] == {"name": "Asha", "score": 91}, f"the first row is {got[0]!r}"' },
          { label: '`grade` gives A, B and C at the right edges', code: 'assert [grade(s) for s in (85, 84, 70, 69, 100)] == ["A", "B", "B", "C", "A"]' },
          { label: '`report.json` holds the count, the average and the grades', code: 'with open("report.json", encoding="utf-8") as f:\n    rep = json.load(f)\nassert rep == {"count": 4, "average": 76.25, "grades": {"Asha": "A", "Ravi": "B", "Li": "C", "Sam": "B"}}, f"report.json holds {rep}"' },
          { label: 'The JSON is indented by 2 spaces', code: 'with open("report.json", encoding="utf-8") as f:\n    assert \'\\n  "count": 4\' in f.read(), "json.dump(report, f, indent=2)"' },
          { label: '`save_report` works for other students', code: 'save_report([{"name": "X", "score": 50}], "other.json")\nwith open("other.json", encoding="utf-8") as f:\n    o = json.load(f)\nassert o == {"count": 1, "average": 50.0, "grades": {"X": "C"}}, f"got {o}"' },
          { label: 'It prints the report file', code: 'assert \'"average": 76.25\' in out and out.lstrip().startswith("{")' },
          { label: 'It uses `csv.DictReader` and `json.dump`', code: 'assert calls("DictReader") and calls("dump")' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'py-modules', track: 'pythonic',
      title: 'Modules, imports and __name__',
      summary: 'Every .py file is a module. The ways to import, your own modules, where Python looks for them, and why scripts end with if __name__ == "__main__":.',
      keywords: ['module', 'import', 'from import', 'import as', 'package', '__name__', '__main__', 'main', 'sys.path', 'standard library', 'namespace', 'entry point'],
      docs: 'https://docs.python.org/3/tutorial/modules.html',
      body: [
        'Every `.py` file is a **module**, and its top-level names (functions, classes, variables) are what it offers to other files. Importing a module runs its file once, top to bottom, and keeps the result: a second `import` of the same module runs nothing.',
        '## The ways to import',
        py('import math                     # use it as math.sqrt',
           'from math import sqrt, pi       # bring names in directly',
           'import statistics as stats      # a shorter name',
           'from collections import Counter',
           '',
           'print(math.sqrt(16), sqrt(25), round(pi, 2))',
           'print(stats.mean([1, 2, 3, 4]))',
           'print(Counter("aab"))'),
        'Avoid `from math import *`: it fills your file with names you cannot see, and a later import can silently replace one.',
        '## Your own module',
        'A program can be split across files. This one writes a small module and imports it; in your own projects you would simply save `geometry.py` next to `main.py`.',
        py('from pathlib import Path',
           '',
           'Path("geometry.py").write_text(',
           String.raw`    'PI = 3.14159\n'`,
           String.raw`    'def circle_area(r):\n'`,
           String.raw`    '    return PI * r * r\n'`,
           String.raw`    'print("geometry.py runs; its __name__ is", __name__)\n',`,
           '    encoding="utf-8")',
           '',
           'import geometry                 # runs geometry.py once',
           'import geometry                 # already loaded: nothing runs again',
           'print(geometry.circle_area(2))',
           'print(__name__)                 # this file: __main__'),
        '## `if __name__ == "__main__":`',
        'A module\'s `__name__` is its name, such as `"geometry"`, when it is imported, but `"__main__"` when Python runs the file directly. So code under this test runs only when the file is started as a program, not when another file (or a test) imports it:',
        py('def add(a, b):',
           '    return a + b',
           '',
           '',
           'def main():',
           '    print("2 + 3 =", add(2, 3))',
           '',
           '',
           'if __name__ == "__main__":',
           '    main()'),
        '## Where Python looks',
        'Python searches the folders in `sys.path`: the folder of the program first, then the standard library, then installed packages (site-packages). So a file of your own named like a standard module, such as `random.py` or `json.py`, hides the real one from your program: a classic puzzle for newcomers.',
        py('import json, sys',
           'print("json" in sys.modules)                   # modules are kept once imported',
           'print(json.__file__.endswith("__init__.py"))   # json is a package: a folder of modules'),
        'A **package** is a folder of modules, usually with an `__init__.py`; `from shop.cart import Cart` imports from `shop/cart.py`. [[lesson:py-packages]] covers packages and `pyproject.toml`.'
      ].join('\n\n'),
      java: 'A module is roughly a Java class used as a namespace, a utility class full of static members, but the unit is the **file**: one module can hold many functions and classes. There is no `public` or `private`: every top-level name can be imported, and a leading underscore (`_helper`) means "internal, please do not use". Importing runs the module\'s top-level code once, like a static initializer. `if __name__ == "__main__":` does the job of `public static void main`: the entry point, run only when the file is started directly.',
      js: 'ES modules: `import { sqrt } from "./math.js"` is `from math import sqrt`. Python has no `export`: every top-level name of a module can be imported.',
      example: {
        code: String.raw`import math
import random as rnd
from datetime import date
from pathlib import Path

print("pi to 3 places:", round(math.pi, 3))
rnd.seed(1)
print("a random choice:", rnd.choice(["tea", "coffee", "juice"]))
print("it is", date.today().year, "or later:", date.today().year >= 2026)

# write a module of our own, then import it
Path("greetings.py").write_text(
    "def hello(name):\n"
    "    return f'Hello, {name}!'\n"
    "\n"
    "if __name__ == '__main__':\n"
    "    print('greetings.py was run directly')\n",
    encoding="utf-8")

import greetings
print(greetings.hello("Ravi"))
print("greetings.__name__ is", greetings.__name__)
print("this file's __name__ is", __name__)
`,
        note: '"greetings.py was run directly" is never printed: the file was imported, so its `__name__` is "greetings".'
      },
      challenge: {
        title: 'Make it importable',
        task: [
          'The starter prints a temperature table as soon as it is loaded, so another file could not import its functions without the table being printed too.',
          '1. Keep `to_celsius(f)` and `to_fahrenheit(c)` as they are.',
          '2. Move the printing into a function `main()`.',
          '3. Call `main()` only under `if __name__ == "__main__":`, at the bottom.',
          'Run as a program it must print the same table. The checks also import your file as a module, the way a test would, and require that importing prints nothing.'
        ].join('\n\n'),
        starter: String.raw`def to_celsius(f):
    return round((f - 32) * 5 / 9, 1)


def to_fahrenheit(c):
    return round(c * 9 / 5 + 32, 1)


print("Temperature table")
for c in (0, 37, 100):
    print(f"{c} C = {to_fahrenheit(c)} F")
`,
        solution: String.raw`def to_celsius(f):
    return round((f - 32) * 5 / 9, 1)


def to_fahrenheit(c):
    return round(c * 9 / 5 + 32, 1)


def main():
    print("Temperature table")
    for c in (0, 37, 100):
        print(f"{c} C = {to_fahrenheit(c)} F")


if __name__ == "__main__":
    main()
`,
        hints: [
          'Indent the printing lines under a new `def main():`.',
          'At the bottom, at the left edge, write `if __name__ == "__main__":` and, indented under it, `main()`.',
          'When a test imports the file, its `__name__` is the module\'s name, not `"__main__"`, so `main()` does not run.'
        ],
        checks: [
          { label: 'Run as a program, it prints the table', code: 'assert lines == ["Temperature table", "0 C = 32.0 F", "37 C = 98.6 F", "100 C = 212.0 F"]' },
          { label: 'The conversions still work', code: 'assert to_celsius(212) == 100.0 and to_celsius(98.6) == 37.0 and to_fahrenheit(-40) == -40.0' },
          { label: '`main()` prints the table', code: 'result, printed = capture(main)\nassert printed.startswith("Temperature table"), f"main() printed {printed!r}"' },
          { label: 'It ends with the `if __name__ == "__main__":` test', code: 'assert any(isinstance(n, ast.If) and "__name__" in ast.unparse(n.test) and "__main__" in ast.unparse(n.test) for n in tree.body), \'end with: if __name__ == "__main__":\'' },
          { label: 'Importing the file prints nothing', code: 'import importlib.util\nspec = importlib.util.spec_from_file_location("temperature", "main.py")\nmod = importlib.util.module_from_spec(spec)\n_, printed = capture(spec.loader.exec_module, mod)\nassert printed == "", f"importing printed {printed!r}: move the printing into main()"\nassert mod.to_celsius(32) == 0.0' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 8 */
    {
      id: 'py-eafp', track: 'pythonic',
      title: 'Pythonic style: EAFP, any/all and PEP 8',
      summary: '"Easier to ask forgiveness than permission": try the operation and handle the exception. Plus any() and all(), truthiness, and the PEP 8 style every Python team expects.',
      keywords: ['eafp', 'lbyl', 'pythonic', 'idiomatic', 'any', 'all', 'pep 8', 'style', 'naming', 'snake_case', 'is none', 'truthiness', 'dict.get', 'zen of python'],
      docs: 'https://docs.python.org/3/glossary.html#term-EAFP',
      body: [
        '## EAFP versus LBYL',
        'Java code usually **looks before it leaps** (LBYL): check that an operation can work, then do it. Python code usually does the operation and handles the exception if it fails: **easier to ask forgiveness than permission** (EAFP).',
        py('ages = {"Asha": 31, "Ravi": 25}',
           '',
           '# look before you leap',
           'if "Li" in ages:',
           '    print(ages["Li"])',
           'else:',
           '    print("unknown")',
           '',
           '# easier to ask forgiveness than permission',
           'try:',
           '    print(ages["Li"])',
           'except KeyError:',
           '    print("unknown")'),
        'EAFP does one lookup instead of two, cannot be caught out by a change between the check and the use (a file deleted between `exists()` and `open()`), and keeps the normal path in plain sight. For simple cases a method already does it: `ages.get("Li", "unknown")`.',
        'Parsing is the classic case. No check matches `int()`\'s rules exactly (`" 42 "`, `"-7"` and `"4_2"` are all accepted), so trying is the reliable test:',
        py('def to_int(text, default=0):',
           '    try:',
           '        return int(text)',
           '    except ValueError:',
           '        return default',
           '',
           'print(to_int("42"), to_int("4x2"), to_int("", default=None))'),
        'Catch the narrowest exception you expect, never a bare `except:`; the editor\'s ⚠ warns about one.',
        '## any() and all()',
        'They answer "is there at least one?" and "are they all?", and stop at the first item that decides it.',
        py('scores = [72, 88, 95, 64]',
           'print(any(s > 90 for s in scores))     # True',
           'print(all(s >= 60 for s in scores))    # True',
           'print(all([]), any([]))                # True False: nothing fails, nothing passes'),
        '## Truthiness instead of comparisons',
        'Empty collections, `""`, `0` and `None` count as false, so test them directly. Compare with `None` using `is`.',
        py('items = []',
           'name = ""',
           'result = None',
           'if not items:',
           '    print("no items")           # not: if len(items) == 0',
           'if not name:',
           '    print("no name")',
           'if result is None:',
           '    print("no result yet")      # not: if result == None'),
        '## PEP 8 in one table',
        '[PEP 8](https://peps.python.org/pep-0008/) is Python\'s style guide, and tools such as ruff and black apply it for you.',
        '| What | Style | Example |\n|---|---|---|\n| variables, functions, modules | `snake_case` | `total_price`, `load_users()` |\n| classes | `CapWords` | `ShoppingCart` |\n| constants | `UPPER_CASE` | `MAX_RETRIES = 3` |\n| internal names | a leading underscore | `_cache` |\n| indentation | 4 spaces, never tabs | |\n| line length | 79 to 99 characters (a team choice) | |\n| comparing with `None` | `is` and `is not` | `if x is None:` |',
        'And `import this` prints the Zen of Python, the 19 rules behind all of it:',
        py('import this')
      ].join('\n\n'),
      java: 'Java leans towards look-before-you-leap, partly because exceptions are costly and checked exceptions are noisy. In Python a `try` costs almost nothing when nothing is raised, and exceptions are the normal way to say "cannot do that": `int("x")` raises `ValueError` where `Integer.parseInt` throws `NumberFormatException`. `stream.anyMatch(p)` and `allMatch(p)` are `any(...)` and `all(...)` over a generator expression. Java names (`camelCase`, `getTotal()`) work in Python but mark the code as written by a Java developer: use `snake_case`, and plain attributes instead of getters.',
      js: 'JavaScript\'s `arr.some(p)` and `arr.every(p)` are `any` and `all`. Where JavaScript uses optional chaining, `user?.name ?? "anon"`, Python uses `dict.get` or EAFP.',
      example: {
        code: String.raw`records = ["42", "17", "n/a", "8", "", "  23 "]

numbers = []
for text in records:
    try:
        numbers.append(int(text))      # int() accepts the spaces in "  23 "
    except ValueError:
        print(f"skipping {text!r}")

print(numbers)
print("any over 40:", any(n > 40 for n in numbers))
print("all positive:", all(n > 0 for n in numbers))

settings = {"theme": "dark"}
print("font size:", settings.get("font_size", 14))   # a default instead of an if

big = [n for n in numbers if n > 100]
if not big:
    print("nothing over 100")
`
      },
      challenge: {
        title: 'Make it Pythonic',
        task: [
          'The starter works, but it is Java written in Python: camelCase names, a length test, a comparison with `None`, and look-before-you-leap parsing. The ⚠ in the editor points at one of them. Rewrite it so that:',
          '1. The functions are named `parse_scores`, `all_passed` and `top_scorer` (and the parameter `pass_mark`).',
          '2. `parse_scores(texts)` converts each text with `int()` inside `try` / `except ValueError`, skipping texts that are not whole numbers. (`int()` accepts `"-5"` and `" 64 "`, which the starter\'s `isdigit()` test wrongly skips.)',
          '3. `all_passed(scores, pass_mark=50)` uses `all()`.',
          '4. `top_scorer(results)` returns the name with the highest score, or `None` for an empty dict: `if not results:` and `max(..., key=...)`.',
          '5. No `== None` and no `len(...) == 0` are left. Print the three results as the starter does.'
        ].join('\n\n'),
        starter: String.raw`def parseScores(texts):
    scores = []
    for t in texts:
        if t.strip().isdigit():
            scores.append(int(t))
    return scores


def allPassed(scores, passMark=50):
    for s in scores:
        if s < passMark:
            return False
    return True


def topScorer(results):
    if len(results) == 0:
        return None
    best = None
    for name in results:
        if best == None or results[name] > results[best]:
            best = name
    return best


scores = parseScores(["91", "78", "abc", "-5", " 64 "])
print(scores)
print(allPassed(scores))
print(topScorer({"Asha": 91, "Ravi": 78, "Li": 95}))
`,
        solution: String.raw`def parse_scores(texts):
    scores = []
    for text in texts:
        try:
            scores.append(int(text))
        except ValueError:
            pass
    return scores


def all_passed(scores, pass_mark=50):
    return all(s >= pass_mark for s in scores)


def top_scorer(results):
    if not results:
        return None
    return max(results, key=results.get)


scores = parse_scores(["91", "78", "abc", "-5", " 64 "])
print(scores)
print(all_passed(scores))
print(top_scorer({"Asha": 91, "Ravi": 78, "Li": 95}))
`,
        hints: [
          'Rename first: `parseScores` becomes `parse_scores`, `passMark` becomes `pass_mark`. Remember the calls at the bottom.',
          'EAFP: inside the loop, `try: scores.append(int(text))` and `except ValueError: pass`.',
          '`all(s >= pass_mark for s in scores)`. For the top scorer, `max(results, key=results.get)` compares the names by their scores.'
        ],
        checks: [
          { label: 'The functions have `snake_case` names', code: 'names = sorted(n.name for n in tree.body if isinstance(n, ast.FunctionDef))\nassert names == ["all_passed", "parse_scores", "top_scorer"], f"the functions are {names}"' },
          { label: '`parse_scores` keeps every whole number, negative ones and padded ones too', code: 'assert parse_scores(["91", "abc", "-5", " 64 ", "3.5", ""]) == [91, -5, 64]' },
          { label: '`parse_scores` uses `try` / `except ValueError`', code: 'fn = next((n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "parse_scores"), None)\nassert fn, "define parse_scores(texts)"\nhandlers = [h for h in ast.walk(fn) if isinstance(h, ast.ExceptHandler)]\nassert handlers and all(h.type is not None and "ValueError" in ast.unparse(h.type) for h in handlers), "try: int(text) / except ValueError:"' },
          { label: '`all_passed` uses `all()`', code: 'assert all_passed([50, 60]) is True and all_passed([49, 90]) is False and all_passed([]) is True\nassert calls("all"), "return all(s >= pass_mark for s in scores)"' },
          { label: '`top_scorer` finds the highest, and `None` for an empty dict', code: 'assert top_scorer({"Asha": 91, "Ravi": 78, "Li": 95}) == "Li"\nassert top_scorer({}) is None' },
          { label: 'No `== None` and no `len(...) == 0`', code: 'flat = src.replace(" ", "")\nassert "==None" not in flat and "!=None" not in flat, "compare with None using is"\nassert not any(isinstance(n, ast.Compare) and isinstance(n.left, ast.Call) and getattr(n.left.func, "id", None) == "len" for n in ast.walk(tree)), "write if not results: instead of comparing len(...)"' },
          { label: 'It prints the three results', code: 'assert lines == ["[91, 78, -5, 64]", "False", "Li"]' }
        ]
      }
    }
  );
})(window.PYLT);
