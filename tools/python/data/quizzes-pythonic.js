/*
 * Quizzes for track 2 (Pythonic Python). The question shape is described at the top of
 * data/quizzes-basics.js.
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};
  function py() { return '```python\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q['py-comprehensions'] = [
    {
      q: 'What does this print?\n\n' + py('print([x * 2 for x in range(5) if x % 2])'),
      choices: ['`[2, 6]`', '`[0, 4, 8]`', '`[2, 6, 10]`'],
      answer: 0,
      why: '`x % 2` is 1 (true) for the odd numbers, 1 and 3, so only they pass the filter and are doubled: `[2, 6]`. `range(5)` stops before 5.'
    },
    {
      q: 'Which comprehension does what `names.stream().map(String::length).collect(Collectors.toSet())` does?',
      choices: ['`{len(n) for n in names}`', '`[len(n) for n in names]`', '`{n: len(n) for n in names}`'],
      answer: 0,
      why: 'Curly brackets with one value make a set, like `toSet()`. Square brackets make a list, and `key: value` in curly brackets makes a dict.'
    },
    {
      q: 'What happens when this line runs?\n\n' + py('squares = (n * n for n in range(10 ** 9))'),
      choices: ['It finishes at once: a generator expression computes values only when they are asked for', 'It takes a long time and a lot of memory, building a billion squares', 'A SyntaxError: a tuple needs commas'],
      answer: 0,
      why: 'Round brackets around a comprehension make a lazy generator, like a Java stream before its terminal operation. Nothing is computed until something such as `sum(squares)` or a `for` loop asks for the values.'
    },
    {
      q: 'What is the first item of `[(x, y) for x in "ab" for y in "12"]`, and the second?',
      choices: ["`('a', '1')`, then `('a', '2')`", "`('a', '1')`, then `('b', '1')`", 'An error: a comprehension may have only one `for`'],
      answer: 0,
      why: 'The `for` clauses nest left to right, like loops written one inside the other: the first `for` is the outer loop, so `y` changes fastest.'
    }
  ];

  Q['py-slicing'] = [
    {
      q: 'What is `"abcdef"[1:4]`?',
      choices: ["`'bcd'`", "`'bcde'`", "`'abcd'`"],
      answer: 0,
      why: 'A slice starts at position 1 (`b`, counting from 0) and stops **before** position 4, so it takes positions 1, 2 and 3.'
    },
    {
      q: '`nums = [1, 2, 3]`. What is `nums[5:]`?',
      choices: ['`[]`', 'An `IndexError`', '`None`'],
      answer: 0,
      why: 'A slice is trimmed to the items that exist, so a start past the end gives an empty list. Only an index, `nums[5]`, raises `IndexError`.'
    },
    {
      q: 'After `b = a[:]` and `b.append(9)`, has `a` changed?',
      choices: ['No: `a[:]` made a new list', 'Yes: `a` and `b` are the same list', 'It is an error: a list cannot be sliced into itself'],
      answer: 0,
      why: 'A slice of a list is a new list (a shallow copy), so appending to `b` leaves `a` alone. `b = a` would have made two names for one list.'
    },
    {
      q: 'What is `"python"[::-2]`?',
      choices: ["`'nhy'`", "`'pto'`", "`'nohtyp'`"],
      answer: 0,
      why: 'A step of -2 starts at the end and goes backwards two at a time: positions 5, 3 and 1, which are `n`, `h` and `y`. `[::-1]` would reverse the whole string.'
    }
  ];

  Q['py-zip-enumerate-sorted'] = [
    {
      q: 'What does this print?\n\n' + py('for i, x in enumerate("ab", start=1):', '    print(i, x)'),
      choices: ['`1 a` then `2 b`', '`0 a` then `1 b`', '`a 1` then `b 2`'],
      answer: 0,
      why: '`enumerate` hands out (number, item) pairs, and `start=1` makes the numbering begin at 1 instead of 0.'
    },
    {
      q: 'What is `list(zip([1, 2, 3], "ab"))`?',
      choices: ["`[(1, 'a'), (2, 'b')]`", "`[(1, 'a'), (2, 'b'), (3, None)]`", 'A `ValueError`, because the lengths differ'],
      answer: 0,
      why: '`zip` stops at the end of the shortest input, so the 3 has no partner and is dropped. Pass `strict=True` to get a `ValueError` instead.'
    },
    {
      q: '`nums = [3, 1, 2]` and then `result = nums.sort()`. What is `result`?',
      choices: ['`None`: `sort()` changes the list itself and returns nothing', '`[1, 2, 3]`', '`[3, 1, 2]`'],
      answer: 0,
      why: '`list.sort()` sorts in place and returns `None`. `sorted(nums)` is the one that returns a new sorted list.'
    },
    {
      q: 'How do you sort `words` by length, longest first?',
      choices: ['`sorted(words, key=len, reverse=True)`', '`sorted(words, key=-len)`', '`sorted(words, comparator=len)`'],
      answer: 0,
      why: '`key` takes a function, here `len`, and `reverse=True` flips the order. You cannot negate a function, and `sorted` has no comparator parameter.'
    }
  ];

  Q['py-collections'] = [
    {
      q: '`c = Counter("hello")`. What are `c["l"]` and `c["z"]`?',
      choices: ['`2` and `0`', '`2` and a `KeyError`', '`1` and `None`'],
      answer: 0,
      why: 'A Counter counts each letter, and "hello" has two `l`s. Unlike a plain dict, a Counter answers 0 for something it has never seen.'
    },
    {
      q: 'Why use `defaultdict(list)` to group items, instead of a plain dict?',
      choices: ['A missing key gets an empty list automatically, so you can append straight away', 'It keeps the keys sorted', 'It allows lists as keys'],
      answer: 0,
      why: '`groups[key].append(x)` works the first time too: the defaultdict calls `list()` to make the missing value. With a plain dict you would need `setdefault` or an `if` first, like Java\'s `computeIfAbsent`.'
    },
    {
      q: 'Which removes the first item quickly, however long the sequence is?',
      choices: ['`deque.popleft()`', '`list.pop(0)`', '`list.remove(items[0])`'],
      answer: 0,
      why: 'A deque is built for both ends. `list.pop(0)` moves every remaining item one place to the left, so it gets slower as the list grows.'
    },
    {
      q: '`Point = namedtuple("Point", ["x", "y"])` and `p = Point(1, 2)`. What is `p.x + p[1]`?',
      choices: ['`3`', 'An error: a tuple has no attributes', '`12`'],
      answer: 0,
      why: 'A namedtuple is a tuple whose items also have names, so `p.x` is 1 and `p[1]` is 2.'
    }
  ];

  Q['py-text'] = [
    {
      q: 'What is `", ".join(["a", "b", "c"])`?',
      choices: ["`'a, b, c'`", "`['a, b, c']`", 'An `AttributeError`: lists have no `join`'],
      answer: 0,
      why: '`join` is a method of the separator string: it puts `", "` between the items and returns one string. In Java the separator is the first argument: `String.join(", ", list)`.'
    },
    {
      q: 'What does `print(f"{7:03d}|{2.5:>6.1f}|")` print?',
      choices: ['`007|   2.5|`', '`7  |2.5   |`', '`003|2.5|`'],
      answer: 0,
      why: '`03d` pads the number with zeros to 3 digits, and `>6.1f` shows one decimal place, right-aligned in 6 characters.'
    },
    {
      q: 'What does `re.match(r"\\d+", "order 66")` return?',
      choices: ['`None`, because `match` only looks at the start of the string', 'A match for "66"', 'A `ValueError`'],
      answer: 0,
      why: '`re.match` anchors at the beginning, and "order 66" starts with a letter. `re.search` looks anywhere and would find "66".'
    },
    {
      q: 'Why write patterns as raw strings, such as `r"\\d+"`?',
      choices: ['So the backslashes reach `re` unchanged: in a normal string, `"\\b"` is a backspace character', 'Raw strings make the pattern faster', '`re` only accepts raw strings'],
      answer: 0,
      why: 'In a raw string a backslash is just a backslash. In a normal string Python reads escapes first: `"\\b"` becomes a backspace and `"\\d"` only works because Python leaves unknown escapes alone, with a warning.'
    }
  ];

  Q['py-files-formats'] = [
    {
      q: 'What is `Path("data") / "2026" / "sales.csv"`?',
      choices: ['A Path to `data/2026/sales.csv`: `/` joins path parts', 'A `TypeError`: you cannot divide a path', 'The text "data/2026/sales.csv"'],
      answer: 0,
      why: 'pathlib gives `/` a meaning for paths: join the parts with the right separator for the system (a backslash on Windows). The result is still a Path, with all its methods.'
    },
    {
      q: 'A CSV cell holds 91. Reading it with `csv.DictReader`, what type is `row["score"]`?',
      choices: ['`str`: the csv module gives every value as text', '`int`', '`float`'],
      answer: 0,
      why: 'CSV has no types, so every value comes back as a string, "91". Convert it yourself with `int(row["score"])`.'
    },
    {
      q: 'What does `json.dumps({"ok": True, "x": None})` return?',
      choices: ['`\'{"ok": true, "x": null}\'`', '`"{\'ok\': True, \'x\': None}"`', 'A `TypeError`: `None` is not JSON'],
      answer: 0,
      why: 'JSON writes the Python values its own way: `True` becomes `true` and `None` becomes `null`, and the strings get double quotes. `json.loads` turns them back.'
    },
    {
      q: 'Why open a CSV file with `newline=""`?',
      choices: ['The csv module handles line endings itself; without it, Windows can get a blank line after every row', 'It makes the file smaller', 'Every file must be opened that way'],
      answer: 0,
      why: 'The csv module writes its own line endings and reads quoted values that contain line breaks. `newline=""` stops Python from translating them a second time.'
    }
  ];

  Q['py-modules'] = [
    {
      q: '`shop.py` contains the line `print(__name__)`. What does `import shop` print?',
      choices: ['`shop`', '`__main__`', 'Nothing: imported files do not print'],
      answer: 0,
      why: 'An imported module\'s `__name__` is its own name. Only the file Python runs directly is called `"__main__"`, which is why `if __name__ == "__main__":` works.'
    },
    {
      q: 'What does `from math import sqrt` do?',
      choices: ['It brings the name `sqrt` into this module, so you can call `sqrt(9)`', 'It copies math.py next to your file', 'It imports everything from math'],
      answer: 0,
      why: 'It loads the module (once) and binds just that name in your module. `import math` would bind the module instead, so you would write `math.sqrt(9)`.'
    },
    {
      q: 'You save a file called `random.py` next to your program, and `import random` stops working as expected. Why?',
      choices: ['The program\'s own folder is searched first, so your random.py hides the standard module', 'Python forbids file names that match standard modules', '`random` has to be installed with pip'],
      answer: 0,
      why: 'The first entry of `sys.path` is the program\'s folder, so your file is found before the standard library. Rename the file.'
    },
    {
      q: 'What happens when a module is imported a second time?',
      choices: ['Nothing runs again: Python keeps the module in `sys.modules` after the first import', 'Its code runs again from the top', 'An `ImportError`'],
      answer: 0,
      why: 'A module runs once per program; every later `import` gets the same module object. That is why module-level code works like a Java static initializer.'
    }
  ];

  Q['py-eafp'] = [
    {
      q: 'Which of these is the EAFP style?',
      choices: ['`try: value = d[key]` and `except KeyError: value = 0`', '`if key in d: value = d[key]`', '`value = d[key] if key in d else 0`'],
      answer: 0,
      why: 'EAFP ("easier to ask forgiveness than permission") does the operation and handles the failure. The other two check first, which is look-before-you-leap. (For a dict, `d.get(key, 0)` is simplest of all.)'
    },
    {
      q: 'What is `all([])`?',
      choices: ['`True`', '`False`', 'A `ValueError`: the list is empty'],
      answer: 0,
      why: '`all` is true when no item is false, and an empty list has no false item. `any([])` is `False`, because no item is true.'
    },
    {
      q: 'What does PEP 8 call a constant holding the maximum number of retries?',
      choices: ['`MAX_RETRIES`', '`maxRetries`', '`MaxRetries`'],
      answer: 0,
      why: 'Constants are `UPPER_CASE` with underscores, like Java\'s `static final` fields. Variables and functions are `snake_case`, classes `CapWords`.'
    },
    {
      q: 'Why `if x is None:` rather than `if x == None:`?',
      choices: ['`is` checks identity, which no class can change; `==` calls `__eq__`, which a class can redefine', '`is` is shorter to type', '`== None` raises an error'],
      answer: 0,
      why: 'There is only one `None` object, so `is None` is exact and cannot be fooled by a strange `__eq__`. PEP 8 asks for it, and the editor\'s ⚠ flags `== None`.'
    }
  ];
})(window.PYLT);
