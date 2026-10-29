/*
 * Quizzes for track 1 (Basics): three or more questions per lesson, keyed by lesson id.
 *
 * Question shape: {q: Markdown, choices: [Markdown, ...], answer: index of the right choice,
 *                  why: Markdown shown after any answer}.
 * The choices are shuffled every time, so never write "both of the above". A missed question goes
 * into the review (js/views/quiz.js). Every ```python block in a question must compile
 * (tests/check_data.py checks it).
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};
  function py() { return '```python\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q['py-first-program'] = [
    {
      q: 'What does this print?\n\n' + py('x = 5', 'if x > 10:', '    print("big")', 'print("done")'),
      choices: ['`done`', '`big` then `done`', 'Nothing: it is an error'],
      answer: 0,
      why: 'Only the indented line belongs to the `if`. `x > 10` is false, so `print("big")` is skipped; `print("done")` starts at the left edge, so it runs either way.'
    },
    {
      q: 'Which line prints `a-b-c`?',
      choices: ['`print("a", "b", "c", sep="-")`', '`print("a", "b", "c", end="-")`', '`print("a" - "b" - "c")`'],
      answer: 0,
      why: '`sep` is what goes **between** the values (a space by default); `end` is what goes after the last one (a newline by default). Strings cannot be subtracted.'
    },
    {
      q: 'In Python, what ends the block of an `if`?',
      choices: ['The first line that is indented less than the block', 'A closing `}`', 'The keyword `end`'],
      answer: 0,
      why: 'A block is the run of lines indented under the line with the colon. It ends at the first line that goes back to the outer indentation. Python has no braces and no `end` keyword.'
    }
  ];

  Q['py-variables'] = [
    {
      q: 'After these lines, what is `type(x)`?\n\n' + py('x = 10', 'x = "ten"'),
      choices: ['`str`', '`int`', 'An error: x was declared as an int'],
      answer: 0,
      why: 'Names have no type in Python; values do. The second line makes `x` refer to a string, so `type(x)` is `str`. Nothing was declared.'
    },
    {
      q: 'What is Python\'s version of Java\'s `null`?',
      choices: ['`None`', '`null`', '`nil`'],
      answer: 0,
      why: '`None` (capital N) is the single "no value" object. `null` and `nil` are not Python names: using them raises `NameError`.'
    },
    {
      q: 'What do these lines print?\n\n' + py('a, b = 1, 2', 'a, b = b, a', 'print(a, b)'),
      choices: ['`2 1`', '`1 2`', '`2 2`'],
      answer: 0,
      why: 'The right side `b, a` is worked out first, giving the pair `(2, 1)`, and only then are both names assigned. That is why the swap needs no temporary variable.'
    },
    {
      q: 'How do you make a constant in Python?',
      choices: ['Name it in UPPER_CASE; nothing stops a reassignment', 'Write `final MAX = 10`', 'Write `const MAX = 10`'],
      answer: 0,
      why: 'Python has no `final` or `const`. `MAX_RETRIES = 3` is a constant by convention: every Python developer reads an UPPER_CASE name as "do not change".'
    }
  ];

  Q['py-numbers'] = [
    {
      q: 'What is `7 / 2` in Python?',
      choices: ['`3.5`', '`3`', '`3.0`'],
      answer: 0,
      why: '`/` is always true division and gives a float. For Java\'s integer division, use `//`: `7 // 2` is `3`.'
    },
    {
      q: 'What is `-7 // 2`?',
      choices: ['`-4`', '`-3`', '`-3.5`'],
      answer: 0,
      why: '`//` rounds **down** (towards minus infinity), so -3.5 becomes -4. Java\'s `-7 / 2` cuts towards zero and gives -3.'
    },
    {
      q: 'What happens with `2 ** 100` in Python?',
      choices: ['You get the exact 31-digit number', 'It overflows to a negative number', 'It becomes a float in scientific notation'],
      answer: 0,
      why: 'Python ints grow as needed, so there is no overflow, and no need for `long` or `BigInteger`. `**` is the power operator.'
    },
    {
      q: 'How do you add 1 to `count`?',
      choices: ['`count += 1`', '`count++`', '`++count`'],
      answer: 0,
      why: 'Python has no `++` or `--` operators. `count++` is a syntax error; `++count` is valid but means "plus plus count", which leaves it unchanged.'
    }
  ];

  Q['py-strings'] = [
    {
      q: 'What does this print?\n\n' + py('n = 5', 'print(f"n = {n * 2}")'),
      choices: ['`n = 10`', '`n = {n * 2}`', '`n = 52`'],
      answer: 0,
      why: 'In an f-string, the expression inside `{ }` is evaluated and its value is put into the text.'
    },
    {
      q: 'What does `"n = " + 5` do?',
      choices: ['It raises a `TypeError`', 'It gives `"n = 5"`', 'It gives `"n = "` (the 5 is ignored)'],
      answer: 0,
      why: 'Python never turns a number into text by itself; `+` between a `str` and an `int` is an error. Write `f"n = {5}"` or `"n = " + str(5)`.'
    },
    {
      q: 'After these lines, what is `name`?\n\n' + py('name = "ravi"', 'name.upper()'),
      choices: ['`"ravi"`', '`"RAVI"`', '`None`'],
      answer: 0,
      why: 'Strings never change. `upper()` returns a **new** string, which this code throws away. To keep it: `name = name.upper()`.'
    },
    {
      q: 'What is `"Python"[1:4]`?',
      choices: ['`"yth"`', '`"Pyth"`', '`"ytho"`'],
      answer: 0,
      why: 'A slice runs from the first index up to, but not including, the second: positions 1, 2 and 3, which are `y`, `t`, `h`.'
    }
  ];

  Q['py-booleans'] = [
    {
      q: 'Which of these values counts as **true** in an `if`?',
      choices: ['`[0]`', '`[]`', '`""`', '`0`'],
      answer: 0,
      why: 'Empty collections, empty strings, zero and `None` count as false. `[0]` is a list with one item in it, so it is not empty, and it counts as true.'
    },
    {
      q: 'How should you test whether `x` is `None`?',
      choices: ['`x is None`', '`x == null`', '`x.isNone()`'],
      answer: 0,
      why: 'There is exactly one `None` object, and `is` checks for that very object. `x == None` also works in most cases, but the style guides recommend `is None`. `null` is not a Python name.'
    },
    {
      q: 'What does `name or "guest"` give when `name` is `""`?',
      choices: ['`"guest"`', '`""`', '`False`'],
      answer: 0,
      why: '`or` returns its first operand that is true-ish, or the last one. `""` counts as false, so the result is `"guest"`. It is a common way to give a default value.'
    },
    {
      q: 'What is `1 < 3 < 2`?',
      choices: ['`False`', '`True`', 'A `TypeError`'],
      answer: 0,
      why: 'A chained comparison means `1 < 3 and 3 < 2`. The second part is false, so the whole is `False`. (In Java, `1 < 3 < 2` would not even compile.)'
    }
  ];

  Q['py-if'] = [
    {
      q: 'What is Python for Java\'s `else if`?',
      choices: ['`elif`', '`else if`', '`elseif`'],
      answer: 0,
      why: 'Python uses one word, `elif`. Writing `else if` on one line is a syntax error.'
    },
    {
      q: 'What does this print?\n\n' + py('marks = 95', 'if marks >= 60:', '    print("C")', 'elif marks >= 90:', '    print("A")'),
      choices: ['`C`', '`A`', '`C` then `A`'],
      answer: 0,
      why: 'The conditions are tried from the top and only the **first** true branch runs. 95 >= 60 is already true, so `C` is printed and the `elif` is never tried. Test the narrowest case first.'
    },
    {
      q: 'Which line is Python for `String s = n > 0 ? "pos" : "neg";`?',
      choices: ['`s = "pos" if n > 0 else "neg"`', '`s = n > 0 ? "pos" : "neg"`', '`s = if n > 0: "pos" else: "neg"`'],
      answer: 0,
      why: 'Python\'s conditional expression puts the condition in the middle: value-if-true `if` condition `else` value-if-false. There is no `?:` operator.'
    }
  ];

  Q['py-loops'] = [
    {
      q: 'Which numbers does `range(2, 8, 2)` give?',
      choices: ['2, 4, 6', '2, 4, 6, 8', '2, 3, 4, 5, 6, 7'],
      answer: 0,
      why: 'Start at 2, step by 2, and stop **before** 8. The stop value is never included.'
    },
    {
      q: 'When does the `else` of a `for` loop run?',
      choices: ['When the loop finished without `break`', 'When the loop ran zero times, and only then', 'Every time, after the loop'],
      answer: 0,
      why: 'A loop\'s `else` runs when the loop ended normally, which includes a loop that ran zero times. A `break` skips it. It replaces the "found" flag of a search loop.'
    },
    {
      q: 'You need both the position and the value of each item in `names`. What is the Pythonic loop?',
      choices: ['`for i, name in enumerate(names):`', '`for (int i = 0; i < len(names); i++):`', '`for name in names: i = names.index(name)`'],
      answer: 0,
      why: '`enumerate` gives (index, value) pairs. The middle choice is not Python syntax. The last one is slow, and it is also wrong when a name appears twice.'
    },
    {
      q: 'What does Python use instead of Java\'s `do { ... } while (cond);`?',
      choices: ['`while True:` with a `break` when the condition fails', '`do:` ... `while cond`', '`repeat:` ... `until cond`'],
      answer: 0,
      why: 'Python has no do-while loop. The idiom is `while True:`, then the body, then `if not cond: break`.'
    }
  ];

  Q['py-lists'] = [
    {
      q: 'After these lines, what is `nums`?\n\n' + py('nums = [3, 1, 2]', 'nums = nums.sort()'),
      choices: ['`None`', '`[1, 2, 3]`', '`[3, 1, 2]`'],
      answer: 0,
      why: '`sort()` sorts the list in place and returns `None`, and that `None` is then assigned to `nums`. Write either `nums.sort()` on its own, or `nums = sorted(nums)`.'
    },
    {
      q: 'What does this print?\n\n' + py('a = [1, 2]', 'b = a', 'b.append(3)', 'print(a)'),
      choices: ['`[1, 2, 3]`', '`[1, 2]`', 'An error'],
      answer: 0,
      why: '`b = a` does not copy the list: both names refer to the same list, just like two Java references to one `ArrayList`. Use `a.copy()` or `a[:]` for a real copy.'
    },
    {
      q: 'Which expression gives the last item of a list `items`?',
      choices: ['`items[-1]`', '`items[len(items)]`', '`items.last()`'],
      answer: 0,
      why: 'Negative indexes count from the end: `-1` is the last item. `items[len(items)]` is one past the end and raises `IndexError`. Lists have no `last()` method.'
    },
    {
      q: 'Which method adds an item at the end of a list?',
      choices: ['`append`', '`add`', '`push`'],
      answer: 0,
      why: 'Lists use `append` (and `extend` for several items). `add` is the method of a set; `push` is JavaScript\'s.'
    }
  ];

  Q['py-tuples'] = [
    {
      q: 'Which of these is a tuple with one item?',
      choices: ['`(5,)`', '`(5)`', '`[5]`'],
      answer: 0,
      why: 'The comma makes the tuple. `(5)` is just the number 5 in brackets, and `[5]` is a list.'
    },
    {
      q: 'What do these lines print?\n\n' + py('first, *rest = [1, 2, 3, 4]', 'print(rest)'),
      choices: ['`[2, 3, 4]`', '`(2, 3, 4)`', '`2`'],
      answer: 0,
      why: 'The starred name collects every item the other names do not take, and it is always a **list**.'
    },
    {
      q: 'What does `x, y = (1, 2, 3)` do?',
      choices: ['It raises `ValueError: too many values to unpack`', 'It sets x to 1 and y to 2, and ignores the 3', 'It sets x to 1 and y to (2, 3)'],
      answer: 0,
      why: 'Unpacking needs exactly as many names as there are values. Use `x, *y = ...` to collect the rest, or `x, y, _ = ...` to ignore it.'
    },
    {
      q: 'How does a Python function return two values?',
      choices: ['`return a, b`: it returns a tuple, which the caller can unpack', 'It cannot; it must return a list or an object', 'With two `return` statements one after the other'],
      answer: 0,
      why: '`return a, b` returns the tuple `(a, b)`, and the caller writes `x, y = f()`. A second `return` after the first one would never run.'
    }
  ];

  Q['py-dicts-sets'] = [
    {
      q: 'What does `ages["Sam"]` do when `"Sam"` is not a key of `ages`?',
      choices: ['It raises `KeyError`', 'It returns `None`', 'It returns 0'],
      answer: 0,
      why: 'Square brackets require the key to exist. `ages.get("Sam")` returns `None` instead, and `ages.get("Sam", 0)` returns 0.'
    },
    {
      q: 'What is `type({})`?',
      choices: ['`dict`', '`set`', '`list`'],
      answer: 0,
      why: 'Empty braces make an empty **dict**. An empty set is written `set()`. Braces with values, like `{1, 2}`, make a set.'
    },
    {
      q: 'Which loop gives you each key together with its value?',
      choices: ['`for k, v in d.items():`', '`for k, v in d:`', '`for k, v in d.entrySet():`'],
      answer: 0,
      why: 'Looping over a dict itself gives only the keys (so `k, v` would try to unpack each key). `items()` gives (key, value) pairs. `entrySet` is Java.'
    },
    {
      q: 'What is `{"a", "b", "c"} & {"b", "c", "d"}`?',
      choices: ['`{"b", "c"}`', '`{"a", "b", "c", "d"}`', '`{"a"}`'],
      answer: 0,
      why: '`&` is the intersection: the items in both sets. The union is `.union(...)` (or the `|` operator), and `-` is the difference.'
    }
  ];

  Q['py-functions'] = [
    {
      q: 'What does `f()` return?\n\n' + py('def f():', '    x = 1 + 1'),
      choices: ['`None`', '`2`', 'Nothing: it is an error to call it'],
      answer: 0,
      why: 'A function without a `return` statement returns `None`. The value 2 is computed and then thrown away.'
    },
    {
      q: 'Which call is **not** valid for `def greet(name, greeting="Hello"):`?',
      choices: ['`greet(greeting="Hi")`', '`greet("Ravi")`', '`greet(greeting="Hi", name="Ravi")`'],
      answer: 0,
      why: '`name` has no default value, so every call must give it, by position or by name. Keyword arguments may come in any order.'
    },
    {
      q: 'How does Python handle what Java does with method overloading?',
      choices: ['One function with default values and keyword arguments', 'Several functions with the same name and different parameter types', 'With an @Overload decorator'],
      answer: 0,
      why: 'A second `def` with the same name simply replaces the first. Default values (`def connect(host, port=5432)`) cover most overloads, and keyword arguments keep the calls readable.'
    },
    {
      q: 'What does `sorted(["kiwi", "fig", "banana"], key=len)` give?',
      choices: ['`["fig", "kiwi", "banana"]`', '`["banana", "fig", "kiwi"]`', '`[3, 4, 6]`'],
      answer: 0,
      why: '`key=len` passes the function `len` itself; `sorted` calls it on every item and sorts by the results (3, 4, 6). The items themselves come back, not the lengths.'
    }
  ];

  Q['py-exceptions'] = [
    {
      q: 'Which is Python for `catch (NumberFormatException e)`?',
      choices: ['`except ValueError as e:`', '`catch ValueError as e:`', '`except (e: ValueError):`'],
      answer: 0,
      why: 'Python uses `except`, the type, then `as` and a name. `int("abc")` raises `ValueError`, Python\'s counterpart of `NumberFormatException`.'
    },
    {
      q: 'When does the `else` block of a `try` run?',
      choices: ['Only when the `try` block raised no exception', 'Only when an exception was caught', 'Always, like `finally`'],
      answer: 0,
      why: '`else` holds the code that should run only after the `try` succeeded. Keeping it out of the `try` means its own errors are not caught by the `except` by mistake.'
    },
    {
      q: 'Does Python have checked exceptions, like Java\'s `throws IOException`?',
      choices: ['No: any function may raise any exception, and nothing forces you to catch it', 'Yes, with a `raises` clause on the `def` line', 'Only for `OSError` and its subclasses'],
      answer: 0,
      why: 'Python has no checked exceptions and no `throws` clause. The documentation (or a docstring) tells you what a function may raise.'
    },
    {
      q: 'What is wrong with catching everything with `except Exception:`?',
      choices: ['It also hides your own bugs, such as a misspelt name', 'Nothing: it is the recommended style', 'It does not catch `ValueError`'],
      answer: 0,
      why: 'A broad `except` swallows `NameError`, `TypeError` and the like, so a bug looks like "the input was bad". Catch the specific exception you expect.'
    }
  ];

  Q['py-input-files'] = [
    {
      q: 'The user types `42` at `x = input()`. What is `x + 1`?',
      choices: ['A `TypeError`: x is the string "42"', '`43`', '`"421"`'],
      answer: 0,
      why: '`input()` always returns a string. Convert it first: `int(input()) + 1` is 43.'
    },
    {
      q: 'Why open files in a `with` block?',
      choices: ['The file is closed when the block ends, even if an exception happens', 'It is the only way to open a file for writing', 'It makes reading faster'],
      answer: 0,
      why: '`with` is try-with-resources: leaving the block, normally or through an exception, closes the file. Without it you must call `f.close()` yourself.'
    },
    {
      q: 'What does `open("out.txt", "w")` do when out.txt already holds text?',
      choices: ['It empties the file first', 'It adds to the end of the file', 'It raises `FileExistsError`'],
      answer: 0,
      why: '`"w"` means write from scratch. Use `"a"` to append, or `"x"` to fail when the file already exists.'
    },
    {
      q: 'Why pass `encoding="utf-8"` to `open`?',
      choices: ['Otherwise the default depends on the operating system, so the same file can read differently on Windows and Linux', 'Python cannot read text files without it', 'It makes the file smaller'],
      answer: 0,
      why: 'Without an encoding, Python uses the operating system\'s default (often cp1252 on Windows, UTF-8 on Linux and macOS). Naming it makes the program behave the same everywhere.'
    }
  ];
})(window.PYLT);
