/*
 * Lessons, track 1: Basics.
 *
 * Lesson shape:
 *   {id, track, title, summary, keywords: [..], docs: 'https://docs.python.org/3/...',
 *    body: Markdown (U.md: ## headings, lists, | tables |, ```python blocks```, `code`, [[lesson:id]]),
 *    java: Markdown for the "Coming from Java" box, js?: Markdown for the "And in JavaScript" box,
 *    example: {code, stdin?, note?},
 *    challenge: {title, task (Markdown), starter, solution, stdin?, hints: [..],
 *                checks: [{label (Markdown), code (Python: passes when it raises nothing)}]},
 *    runtimes?: ['server'] when the lesson cannot run in the browser, with runtimeWhy?: Markdown,
 *    blockStdin?: input for the ```python blocks in the body (tests/test_content.py runs them all)}
 *
 * Every ```python block in a body must run without an error, unless its last line ends with
 * "# raises SomeError" (it shows that error on purpose). Example, starter and solution code is
 * written with String.raw so it reads exactly as Python. The checks can use the helpers listed at the
 * top of py/checker.py: out, lines, src, tree, uses(), calls(), defines(), rerun(), run_with(),
 * capture(), approx(), error, ast.
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
      id: 'py-first-program', track: 'basics',
      title: 'Your first program: print, comments and indentation',
      summary: 'How a Python file runs, print(), comments, and the indentation that replaces { }.',
      keywords: ['print', 'hello world', 'indentation', 'comments', 'colon', 'block', 'run', 'main'],
      docs: 'https://docs.python.org/3/tutorial/introduction.html',
      body: [
        'Python runs a file from the top to the bottom. There is no class to declare and no `main` method: the first line of the file is the first line that runs.',
        py('print("Hello, world!")',
           'print("Python", 3, "is here")   # print takes any number of values'),
        '## print()',
        '`print(...)` writes its values on one line, separated by spaces, and ends the line. Two keyword arguments change that: `sep` (what goes between the values) and `end` (what goes after the last one).',
        py('print("a", "b", "c", sep="-")    # a-b-c',
           'print("no newline here", end="")',
           'print(" ... continued")',
           'print()                          # an empty line'),
        '## Comments',
        'A comment starts with `#` and runs to the end of the line. There is no `/* ... */`: for several lines, start each one with `#`.',
        '## Indentation is the syntax',
        'Where Java uses `{ }`, Python uses a colon and indentation. The lines of a block are indented by 4 spaces, and the block ends where the indentation goes back:',
        py('temperature = 31',
           'if temperature > 30:',
           '    print("Hot day")         # inside the if',
           '    print("Drink water")     # still inside',
           'print("Done")                # outside: runs either way'),
        'Indentation is not style here, it is meaning. Move the last `print` four spaces to the right and it becomes part of the `if`. Every line of one block must start at the same column, or Python stops with an `IndentationError` before running anything. In this tool\'s editors, **Tab** inserts 4 spaces, **Enter** after a colon indents the next line for you, and **Backspace** removes one level.',
        '## No semicolons',
        'The end of a line ends the statement. A semicolon may separate two statements on one line, but Python code almost never uses one.',
        '## Running a program',
        'Save the code as `main.py` and run `python main.py` (on Windows, `py main.py` also works). The editors in this tool do exactly that when you press **Run** or Ctrl+Enter.'
      ].join('\n\n'),
      java: [
        '`System.out.println(x)` is `print(x)`, and `System.out.print(x)` is `print(x, end="")`. There is no `public static void main`, no class around it, no semicolons and no braces: the colon and the indentation do the work of `{ }`.',
        java('public class Main {',
             '    public static void main(String[] args) {',
             '        if (temperature > 30) {',
             '            System.out.println("Hot day");',
             '        }',
             '    }',
             '}'),
        'Comments use `#` instead of `//`. In Python `//` is an operator: whole-number division.'
      ].join('\n\n'),
      js: 'JavaScript\'s `console.log(a, b)` is `print(a, b)`. JavaScript uses braces like Java; Python\'s indentation-as-syntax is the thing that looks most different.',
      example: {
        code: String.raw`# A first Python program: no class, no main method.
print("Hello from Python!")
print("2 + 3 =", 2 + 3)
print("one", "two", "three", sep=" | ")

hour = 9
if hour < 12:
    print("Good morning")
    print("(this line is inside the if)")
print("This line always runs")
`,
        note: 'Change `hour` to 15 and run it again: the two indented lines are skipped, the last one is not.'
      },
      challenge: {
        title: 'Fix the indentation, then finish the program',
        task: [
          'The starter does not run: Python reports an `IndentationError`. Fix it, then make the program print exactly these three lines:',
          text('Python is fun', '3 * 7 = 21', 'Bye!'),
          '1. The `print` inside the `if` must be indented by 4 spaces.',
          '2. Also inside the `if`, print `3 * 7 = 21`. Let Python work out the 21: print the text `"3 * 7 ="` and the value `3 * 7`.',
          '3. After the `if`, not indented, print `Bye!`.'
        ].join('\n\n'),
        starterBroken: true,
        starter: String.raw`# Fix the indentation, then complete the program.
ready = True
if ready:
print("Python is fun")
`,
        solution: String.raw`# Fix the indentation, then complete the program.
ready = True
if ready:
    print("Python is fun")
    print("3 * 7 =", 3 * 7)
print("Bye!")
`,
        hints: [
          'Put 4 spaces in front of `print("Python is fun")`. In the editor, click at the start of the line and press **Tab**.',
          '`print("3 * 7 =", 3 * 7)` prints the text, a space, then the result of the multiplication.',
          'The last line, `print("Bye!")`, starts at the left edge, so it is not part of the `if`.'
        ],
        checks: [
          { label: 'The program runs without an error', code: 'assert error is None, error and error["type"] + ": " + error["message"]' },
          { label: 'The first line is `Python is fun`', code: 'assert lines[:1] == ["Python is fun"]' },
          { label: 'The second line is `3 * 7 = 21`', code: 'assert lines[1:2] == ["3 * 7 = 21"]' },
          { label: 'Python works out the 21 (your code has `3 * 7`, not 21)', code: 'assert "21" not in src, "print the text \\"3 * 7 =\\" and the value 3 * 7: let Python work out 21"' },
          { label: 'The last line is `Bye!`, printed after the `if`', code: 'assert lines[-1:] == ["Bye!"]\nassert any(l.startswith("print(") and "Bye!" in l for l in src.splitlines()), "the Bye! line should start at the left edge, outside the if"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'py-variables', track: 'basics',
      title: 'Names, values and types',
      summary: 'Variables are names for values. Values have types; names do not. type(), None, and how Python names things.',
      keywords: ['variable', 'assignment', 'type', 'dynamic typing', 'None', 'snake_case', 'constant', 'swap'],
      docs: 'https://docs.python.org/3/library/stdtypes.html',
      body: [
        'In Python a variable is a **name** that refers to a value. You create it by assigning to it. There is no declaration and no type in front:',
        py('city = "Pune"           # a str',
           'population = 7_400_000   # an int; _ groups digits, as in Java',
           'area_km2 = 331.3         # a float',
           'is_capital = False       # a bool',
           'print(city, population, area_km2, is_capital)'),
        '## Values have types, names do not',
        'Every value has a type, and `type(...)` tells you which. The name has no type of its own: later it can refer to a value of another type.',
        py('x = 42',
           'print(type(x))      # <class \'int\'>',
           'x = "forty-two"',
           'print(type(x))      # <class \'str\'>'),
        'This is called **dynamic typing**. Python still checks types, but when a line runs, not before. `"4" + 2` is an error (`TypeError`), because Python never converts silently between text and numbers.',
        '## The basic types',
        '| Type | Example | Nearest in Java |\n|---|---|---|\n| `int` | `42`, `-7`, `10**30` | `int`, `long` and `BigInteger` in one |\n| `float` | `3.14`, `1e-9` | `double` |\n| `str` | `"text"`, `\'text\'` | `String` |\n| `bool` | `True`, `False` | `boolean` |\n| `NoneType` | `None` | `null` |',
        '## None',
        '`None` is the one value meaning "nothing here". A function that returns nothing returns `None`, and a variable can be set to `None` until it gets a real value. Test for it with `is None` (the next lessons explain why).',
        '## Several names at once',
        py('x, y = 1, 2       # two names, two values',
           'a = b = 0         # both names refer to the same 0',
           'x, y = y, x       # swap, with no temporary variable',
           'print(x, y, a, b) # 2 1 0 0'),
        '## How Python names things',
        'Variables and functions use `snake_case` (`total_price`), classes use `PascalCase` (`OrderService`), and constants use `UPPER_CASE` (`MAX_RETRIES = 3`). Python has no `final`: a constant is a constant because everybody agrees not to reassign an UPPER_CASE name. Names are case-sensitive, so `count` and `Count` are two different names.'
      ].join('\n\n'),
      java: [
        '`int count = 0;` becomes `count = 0`. There is no `final`; `MAX_SIZE = 100` is a constant only by the naming convention. `null` is `None`.',
        'Java checks types when it compiles, so a type mistake never runs. Python checks them as each line runs, so the same mistake shows up as an error at that line. Type hints ([[lesson:py-type-hints]]) let an editor or a tool check earlier, the way javac does.'
      ].join('\n\n'),
      js: 'Like JavaScript\'s `let`, a Python name can be reassigned to any type, but there is no `let`/`const`/`var` keyword at all. JavaScript has two "nothing" values, `null` and `undefined`; Python has only `None`.',
      example: {
        code: String.raw`name = "Asha"
age = 31
height_m = 1.68
likes_python = True
nickname = None

print(name, age, height_m, likes_python, nickname)
print(type(name), type(age), type(height_m))
print(type(likes_python), type(nickname))

age = age + 1          # the name now refers to a new value
print("Next year:", age)

a, b = 10, 20
a, b = b, a            # swap without a temporary variable
print("a =", a, "b =", b)
`
      },
      challenge: {
        title: 'Swap, convert and print',
        task: [
          'The starter has three names: `first`, `second` and `count`. Note that `count` is text, not a number.',
          '1. Swap the values of `first` and `second` **in one line**, without a third variable.',
          '2. Create `doubled`: the **number** 6, worked out from `count` (convert it to an `int` first).',
          '3. Print `first`, `second` and `doubled` on one line, so the output is `right left 6`.'
        ].join('\n\n'),
        starter: String.raw`first = "left"
second = "right"
count = "3"   # careful: this is text, not a number

# 1. swap first and second in one line
# 2. doubled: the number 6, worked out from count
# 3. print first, second and doubled
`,
        solution: String.raw`first = "left"
second = "right"
count = "3"   # careful: this is text, not a number

first, second = second, first
doubled = int(count) * 2
print(first, second, doubled)
`,
        hints: [
          'A swap in Python is `a, b = b, a`: the right side is worked out first, then both names are assigned.',
          '`count * 2` would give `"33"`: multiplying text repeats it. Convert first: `int(count) * 2`.',
          '`print(first, second, doubled)` puts a space between the values.'
        ],
        checks: [
          { label: '`first` is now "right" and `second` is "left"', code: 'assert (first, second) == ("right", "left")' },
          { label: 'The swap is one line: `first, second = second, first`', code: 'assert uses("Tuple"), "swap with one line: first, second = second, first"' },
          { label: '`doubled` is the number 6 (an int, not the text "33")', code: 'assert doubled == 6\nassert type(doubled) is int, f"doubled is a {type(doubled).__name__}"' },
          { label: '`doubled` is worked out from `count` with `int(...)`', code: 'assert calls("int"), "convert count with int(count)"\nassert rerun(count="5").doubled == 10, "with count = \\"5\\", doubled should be 10"' },
          { label: 'The output is `right left 6`', code: 'assert out == "right left 6\\n"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'py-numbers', track: 'basics',
      title: 'Numbers and arithmetic',
      summary: 'An int that never overflows, float, the two divisions, %, **, rounding, and why there is no ++.',
      keywords: ['int', 'float', 'division', 'floor division', '//', 'modulo', '%', 'power', '**', 'round', 'math', 'overflow', '+='],
      docs: 'https://docs.python.org/3/library/stdtypes.html#numeric-types-int-float-complex',
      body: [
        'Python has two everyday number types: `int` for whole numbers and `float` for decimals (a 64-bit double, as in Java). Mix them and you get a float.',
        '## The operators',
        '| Operator | Meaning | Example | Result |\n|---|---|---|---|\n| `+ - *` | as in Java | `7 * 2` | `14` |\n| `/` | division, **always** a float | `7 / 2`, `6 / 2` | `3.5`, `3.0` |\n| `//` | floor division: rounds **down** | `7 // 2`, `-7 // 2` | `3`, `-4` |\n| `%` | remainder (takes the sign of the right side) | `7 % 3`, `-7 % 3` | `1`, `2` |\n| `**` | power | `2 ** 10` | `1024` |',
        'Watch the negative cases: Java\'s `-7 / 2` is `-3` (it cuts toward zero), Python\'s `-7 // 2` is `-4` (it rounds down). That makes `n % 2 == 1` work for negative odd numbers in Python too.',
        '## int never overflows',
        py('print(2 ** 100)                # 1267650600228229401496703205376',
           'big = 9_223_372_036_854_775_807  # Long.MAX_VALUE in Java',
           'print(big + 1)                 # no overflow: Python ints grow as needed'),
        '## No ++ or --',
        'Write `count += 1`. The same short forms exist for the other operators: `-=`, `*=`, `/=`, `//=`, `%=`, `**=`.',
        '## Converting and rounding',
        py('print(int("42"), float("3.5"), str(7))   # text to number and back',
           'print(int(3.99))                          # 3: int() cuts off, it does not round',
           'print(round(3.14159, 2), round(2.5), round(3.5))  # 3.14 2 4'),
        '`round` sends a half to the nearest **even** number (`round(2.5)` is `2`), which avoids a bias when many values are rounded. Java\'s `Math.round(2.5)` gives `3`. For money, use the `decimal` module, never floats.',
        '## The math module and built-ins',
        py('import math',
           'print(math.sqrt(16), math.floor(2.7), math.ceil(2.1), math.pi)',
           'print(abs(-5), min(3, 9, 4), max(3, 9, 4), sum([1, 2, 3]))'),
        'Floats behave exactly like Java doubles, rounding errors included: `0.1 + 0.2` is `0.30000000000000004` in both languages.'
      ].join('\n\n'),
      java: [
        'Python\'s `int` is one type that grows as needed: no `int`/`long` overflow and no `BigInteger`. `/` never truncates (`7 / 2` is `3.5`); use `//` for Java\'s integer division, remembering that `//` rounds **down** (`-7 // 2` is `-4`, Java gives `-3`). There is no `++` or `--`: write `n += 1`.',
        '`Math.sqrt`, `Math.PI`, `Math.floor` live in the `math` module (`import math`); `Math.abs`, `Math.min`, `Math.max` are the built-ins `abs`, `min`, `max`, and `min`/`max` take any number of values.'
      ].join('\n\n'),
      js: 'JavaScript has one number type, a double, so `7 / 2` is `3.5` there too; Python adds a real integer type that never loses precision. JavaScript\'s `Math.floor(a / b)` is Python\'s `a // b`.',
      example: {
        code: String.raw`print(7 / 2, 7 // 2, 7 % 2)     # 3.5 3 1
print(-7 // 2, -7 % 2)          # -4 1   (Java: -3 and -1)
print(2 ** 100)                 # exact: ints never overflow
print(0.1 + 0.2)                # floats are doubles, as in Java

import math
print(math.sqrt(16), math.pi)
print(round(3.14159, 2), abs(-5), max(3, 9, 4))

count = 0
count += 1                      # no count++ in Python
print("count:", count)
`
      },
      challenge: {
        title: 'Split a bill',
        task: [
          '`total` is a restaurant bill in rupees and `people` is the number of people sharing it. Create these four variables, then print them on one line:',
          '1. `per_person`: each person\'s share, `total / people`.',
          '2. `rounded`: `per_person` rounded to 2 decimal places.',
          '3. `notes`: how many whole 500-rupee notes fit into the total (use `//`).',
          '4. `left`: the rupees left over after those notes (use `%`).'
        ].join('\n\n'),
        starter: String.raw`total = 2350
people = 3

# your code here
`,
        solution: String.raw`total = 2350
people = 3

per_person = total / people
rounded = round(per_person, 2)
notes = total // 500
left = total % 500
print(per_person, rounded, notes, left)
`,
        hints: [
          '`/` always gives a float: `total / people` is `783.333...`.',
          '`round(x, 2)` keeps 2 decimal places.',
          '`2350 // 500` is how many times 500 fits (4), `2350 % 500` is what remains (350).'
        ],
        checks: [
          { label: '`per_person` is `total / people`', code: 'assert approx(per_person, 2350 / 3), f"got {per_person}"' },
          { label: '`rounded` is 783.33', code: 'assert rounded == 783.33' },
          { label: '`notes` is 4, worked out with `//`', code: 'assert notes == 4\nassert uses("FloorDiv"), "use // for the whole notes"' },
          { label: '`left` is 350, worked out with `%`', code: 'assert left == 350\nassert uses("Mod"), "use % for what is left over"' },
          { label: 'It works for another bill (1999 rupees, 4 people)', code: 'r = rerun(total=1999, people=4)\nassert (r.rounded, r.notes, r.left) == (499.75, 3, 499), f"got {(r.rounded, r.notes, r.left)}"' },
          { label: 'All four values are printed', code: 'assert "783.33" in out and "350" in out, f"the output was {out!r}"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'py-strings', track: 'basics',
      title: 'Strings and f-strings',
      summary: 'Quotes, f-strings, len(), indexing, the string methods you will use every day, and why strings never change.',
      keywords: ['string', 'str', 'f-string', 'format', 'len', 'index', 'slice', 'split', 'join', 'strip', 'upper', 'replace', 'in'],
      docs: 'https://docs.python.org/3/library/stdtypes.html#text-sequence-type-str',
      body: [
        'A string (`str`) is text. Single and double quotes mean the same thing; pick one and use the other when the text contains it. Triple quotes span several lines.',
        py('a = "It\'s easy"',
           'b = \'She said "hi"\'',
           'c = """Line one',
           'Line two"""',
           'print(a, b, c, sep="\\n")'),
        '## f-strings: put values into text',
        'Put an `f` before the quote and write any expression inside `{ }`. After a colon you can say how to format it.',
        py('name, price, qty = "Dosa", 85, 3',
           'print(f"{qty} x {name} = {price * qty} rupees")',
           'print(f"{1234567.891:,.2f}")    # 1,234,567.89  (comma groups, 2 decimals)',
           'print(f"[{name:>8}] [{name:<8}]")  # right / left aligned in 8 characters',
           'print(f"{0.256:.1%}")           # 25.6%'),
        '`+` joins strings, but only strings: `"n = " + 5` is a `TypeError`. Use an f-string, or `str(5)`.',
        '## Length, indexes and slices',
        py('word = "Python"',
           'print(len(word))        # 6',
           'print(word[0], word[-1]) # P n   (-1 is the last character)',
           'print(word[1:4])        # yth   (from 1 up to, not including, 4)',
           'print(word[:2], word[-3:])  # Py hon'),
        '## Everyday methods',
        '| Method | Does | Example result |\n|---|---|---|\n| `s.upper()`, `s.lower()`, `s.title()` | change case | `"PYTHON"` |\n| `s.strip()` | remove spaces at both ends | `"a b"` from `" a b "` |\n| `s.replace(a, b)` | replace every `a` | `"Java".replace("J", "L")` is `"Lava"` |\n| `s.split(sep)` | cut into a list | `"a,b".split(",")` is `["a", "b"]` |\n| `sep.join(items)` | glue a list together | `"-".join(["a", "b"])` is `"a-b"` |\n| `s.startswith(x)`, `s.endswith(x)` | test the ends | `True` / `False` |\n| `s.find(x)`, `s.count(x)` | position (or -1), how many | `"banana".count("a")` is `3` |\n| `x in s` | contains | `"ana" in "banana"` is `True` |',
        '## Strings never change',
        'A string is **immutable**: every method returns a new string and leaves the original alone, so `name.upper()` on its own line does nothing you can see. Keep the result: `name = name.upper()`.'
      ].join('\n\n'),
      java: [
        'The `String` methods map closely: `toUpperCase()` is `upper()`, `trim()` is `strip()`, `contains(x)` is `x in s`, `charAt(i)` is `s[i]`, `length()` is `len(s)`, `substring(1, 4)` is `s[1:4]`, and `String.join(",", list)` is `",".join(list)`. An f-string replaces `String.format(...)` and long `+` chains.',
        '`==` compares the text in Python (Java\'s `equals`). There is no separate `char` type: `s[0]` is a string of length 1. Strings are immutable in both languages.'
      ].join('\n\n'),
      js: 'An f-string is Python\'s template literal: `f"Hi {name}"` does what `${name}` inside backtick quotes does in JavaScript. `split` and `join` exist in both, but in Python `join` belongs to the separator: `"-".join(items)`, where JavaScript writes `items.join("-")`.',
      example: {
        code: String.raw`name = "Ravi"
lang = "python"
price = 1234.5

print(f"{name} is learning {lang.capitalize()}")
print(f"Price: {price:,.2f} rupees")      # 1,234.50
print(len(name), name[0], name[-1], name[1:3])

sentence = "  Java and Python and JavaScript  "
words = sentence.strip().split(" and ")
print(words)
print(" / ".join(words))
print("Python" in sentence, sentence.count("Java"))
print(sentence.strip().upper().replace("AND", "&"))
print("-" * 20)
`
      },
      challenge: {
        title: 'Format a receipt line',
        task: [
          'The starter has an item name with stray spaces, a quantity and a unit price.',
          '1. Tidy `item`: remove the spaces at both ends and use title case, so it becomes `"Masala Dosa"`. Store the result back in `item`.',
          '2. Build `line` **with an f-string**, so it reads exactly `3 x Masala Dosa @ 85.00 = 255.00` (both prices with 2 decimals).',
          '3. Build `code`: the first 3 letters of the tidy item, in capitals (`"MAS"`).',
          '4. Print `line`, then `code`.'
        ].join('\n\n'),
        starter: String.raw`item = "  masala dosa "
qty = 3
unit_price = 85

# 1. tidy item  2. line (f-string)  3. code  4. print line, then code
`,
        solution: String.raw`item = "  masala dosa "
qty = 3
unit_price = 85

item = item.strip().title()
line = f"{qty} x {item} @ {unit_price:.2f} = {qty * unit_price:.2f}"
code = item[:3].upper()
print(line)
print(code)
`,
        hints: [
          'Methods chain: `item.strip().title()`. Strings never change, so assign the result: `item = ...`.',
          'Inside the braces of an f-string, `:.2f` means "2 decimal places": `f"{unit_price:.2f}"`. The total can be an expression: `{qty * unit_price:.2f}`.',
          '`item[:3]` is the first three characters.'
        ],
        checks: [
          { label: '`item` is tidied to `"Masala Dosa"`', code: 'assert item == "Masala Dosa"' },
          { label: '`line` reads `3 x Masala Dosa @ 85.00 = 255.00`', code: 'assert line == "3 x Masala Dosa @ 85.00 = 255.00"' },
          { label: '`line` is built with an f-string', code: 'assert uses("JoinedStr"), "build line with f\\"...\\""' },
          { label: '`line` follows the values (2 x 120 gives `... @ 120.00 = 240.00`)', code: 'r = rerun(qty=2, unit_price=120)\nassert r.line == "2 x Masala Dosa @ 120.00 = 240.00", f"got {r.line!r}"' },
          { label: '`code` is `"MAS"`', code: 'assert code == "MAS"' },
          { label: 'The output is the line, then the code', code: 'assert lines == ["3 x Masala Dosa @ 85.00 = 255.00", "MAS"]' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'py-booleans', track: 'basics',
      title: 'True, False, None and truthiness',
      summary: 'Comparisons, and / or / not, chained comparisons, which values count as false, and testing for None.',
      keywords: ['bool', 'True', 'False', 'None', 'and', 'or', 'not', 'comparison', 'truthy', 'falsy', 'is None', 'chained comparison'],
      docs: 'https://docs.python.org/3/library/stdtypes.html#truth-value-testing',
      body: [
        'The two booleans are `True` and `False`, with capital letters. Comparisons produce them: `==`, `!=`, `<`, `>`, `<=`, `>=`.',
        '## and, or, not',
        'Python spells the logical operators as words: `and`, `or`, `not`. They stop early, like Java\'s `&&` and `||`: in `a and b`, `b` is never evaluated when `a` is false.',
        '## Chained comparisons',
        'A range test reads the way you would write it in maths:',
        py('age = 30',
           'print(18 <= age < 65)       # True: means 18 <= age and age < 65',
           'print(1 < 2 < 3 < 2)        # False'),
        '## Truthiness: every value is true or false',
        'An `if` or `while` accepts any value, not only a bool. These count as **false**; everything else counts as true:',
        '- `False` and `None`\n- zero: `0`, `0.0`\n- empty: `""`, `[]`, `{}`, `()`, `set()`',
        py('cart = []',
           'if not cart:                 # instead of: if len(cart) == 0',
           '    print("the cart is empty")',
           'name = ""',
           'print(name or "guest")       # or gives the first true-ish value: guest'),
        '`or` and `and` return one of their operands, not necessarily a bool. `name or "guest"` is a common way to give a default.',
        '## Testing for None',
        'Write `x is None` and `x is not None`, never `x == None`. `is` asks "is this the very same object?", and there is only one `None`. For everything else compare with `==`; the Objects track explains exactly when `is` and `==` differ.',
        py('middle_name = None',
           'if middle_name is None:',
           '    print("no middle name")')
      ].join('\n\n'),
      java: [
        '`&&`, `||` and `!` are `and`, `or` and `not`. `true`, `false` and `null` are `True`, `False` and `None`.',
        'A Java `if` needs a `boolean`; a Python `if` accepts any value and asks whether it is "truthy". `if (list != null && !list.isEmpty())` becomes `if items:`. And `x == null` becomes `x is None`.'
      ].join('\n\n'),
      js: 'Truthiness works almost as in JavaScript, with one difference worth remembering: an empty list `[]` and an empty dict `{}` are **false** in Python, but true in JavaScript.',
      example: {
        code: String.raw`age = 25
print(age >= 18, age == 30, 18 <= age < 65)

name = ""
print(bool(name), bool("Ravi"), bool(0), bool([]), bool([0]))

display = name or "guest"        # or gives the first truthy value
print("Hello,", display)

middle_name = None
if middle_name is None:
    print("no middle name")

cart = []
if not cart:
    print("the cart is empty")
`
      },
      challenge: {
        title: 'Can they rent the car?',
        task: [
          'Create two variables from the values at the top of the starter, then print them on one line.',
          '1. `can_rent`: `True` when **all** of these hold: the age is from 21 to 75 (both included), `has_licence` is true, and either `country` is `"IN"` or `deposit` is at least 10000. Write the age test as **one chained comparison**.',
          '2. `greeting`: the `nickname` when it is not empty, otherwise `"driver"`. Use `or`.'
        ].join('\n\n'),
        starter: String.raw`age = 30
has_licence = True
country = "US"
deposit = 15000
nickname = ""

# can_rent = ...
# greeting = ...
print(can_rent, greeting)
`,
        solution: String.raw`age = 30
has_licence = True
country = "US"
deposit = 15000
nickname = ""

can_rent = 21 <= age <= 75 and has_licence and (country == "IN" or deposit >= 10000)
greeting = nickname or "driver"
print(can_rent, greeting)
`,
        hints: [
          'The age test as one chained comparison: `21 <= age <= 75`.',
          'Mixing `and` with `or`: put brackets around the `or` part, `(country == "IN" or deposit >= 10000)`, so it is decided first.',
          '`nickname or "driver"` gives `nickname` when it is not empty, otherwise `"driver"`.'
        ],
        checks: [
          { label: 'With the starter\'s values, `can_rent` is `True`', code: 'assert can_rent is True, f"got {can_rent!r}"' },
          { label: 'Age 20 is too young; 21 and 75 are allowed', code: 'assert rerun(age=20, country="IN").can_rent is False, "20 should not be allowed"\nassert rerun(age=21, country="IN").can_rent is True, "21 should be allowed"\nassert rerun(age=75, country="IN").can_rent is True, "75 should be allowed"\nassert rerun(age=76, country="IN").can_rent is False, "76 should not be allowed"' },
          { label: 'No licence, no car', code: 'assert rerun(has_licence=False, country="IN").can_rent is False' },
          { label: 'Outside India the deposit must be at least 10000', code: 'assert rerun(country="UK", deposit=9999).can_rent is False, "9999 is too little"\nassert rerun(country="UK", deposit=10000).can_rent is True, "10000 is enough"\nassert rerun(country="IN", deposit=0).can_rent is True, "in India no deposit is needed"' },
          { label: 'The age test is one chained comparison', code: 'assert any(isinstance(n, ast.Compare) and len(n.ops) == 2 for n in ast.walk(tree)), "write it as 21 <= age <= 75"' },
          { label: '`greeting` uses `or`: "driver", or the nickname when there is one', code: 'assert greeting == "driver"\nassert rerun(nickname="Bunty").greeting == "Bunty"\nassert uses("Or")' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'py-if', track: 'basics',
      title: 'Decisions: if, elif and else',
      summary: 'if / elif / else, nested decisions, the one-line conditional expression, and in for several choices.',
      keywords: ['if', 'elif', 'else', 'else if', 'conditional', 'ternary', 'decision', 'pass', 'switch'],
      docs: 'https://docs.python.org/3/tutorial/controlflow.html#if-statements',
      body: [
        'An `if` takes a condition, a colon and an indented block. `elif` ("else if") adds more conditions; they are tried from the top, and only the first true one runs. `else` catches the rest.',
        py('marks = 72',
           'if marks >= 90:',
           '    grade = "A"',
           'elif marks >= 75:',
           '    grade = "B"',
           'elif marks >= 60:',
           '    grade = "C"',
           'else:',
           '    grade = "F"',
           'print(grade)   # C'),
        'No brackets are needed around the condition. Because the first true branch wins, the order matters: test the narrowest case first.',
        '## The conditional expression',
        'For choosing between two values, Python has a one-line form. It reads like English, with the condition in the middle:',
        py('n = 7',
           'kind = "even" if n % 2 == 0 else "odd"',
           'print(kind)    # odd'),
        '## One of several values: in',
        py('day = "Sun"',
           'if day in ("Sat", "Sun"):',
           '    print("Weekend")'),
        '## An empty block: pass',
        'A block cannot be empty. While you are still writing it, put `pass` there: a statement that does nothing.',
        '## And switch?',
        'Python had no `switch` for a long time; an `if`/`elif` chain or a dictionary did the job. Since Python 3.10 there is `match`, which is far more powerful than Java\'s classic `switch`: [[lesson:py-match]].'
      ].join('\n\n'),
      java: [
        '`else if` is one word, `elif`. The brackets around the condition go (they are allowed, but unusual), and the colon plus indentation replace the braces.',
        '`int max = a > b ? a : b;` becomes `biggest = a if a > b else b`: the value when true comes first, then the condition, then the value when false.'
      ].join('\n\n'),
      js: 'Same as JavaScript apart from the spelling: `else if` is `elif`, and `cond ? a : b` is `a if cond else b`.',
      example: {
        code: String.raw`marks = 72

if marks >= 90:
    grade = "A"
elif marks >= 75:
    grade = "B"
elif marks >= 60:
    grade = "C"
else:
    grade = "F"
print("Grade:", grade)

result = "pass" if marks >= 40 else "fail"   # the conditional expression
print(result)

day = "Sun"
if day in ("Sat", "Sun"):
    print("Weekend")
`
      },
      challenge: {
        title: 'Shipping cost',
        task: [
          'Work out `cost` from `weight_kg` and `express`, then print `Cost: <cost>`.',
          '| Weight | Cost |\n|---|---|\n| 0 or less | `None` (not a valid parcel) |\n| more than 0, up to 1 kg | 40 |\n| more than 1, up to 5 kg | 90 |\n| more than 5 kg | 90, plus 15 for every kg above 5 (7 kg costs 120) |',
          'If `express` is `True`, add 50 to a valid cost. Use `if` with `elif` for the weight bands.'
        ].join('\n\n'),
        starter: String.raw`weight_kg = 7
express = False

# work out cost here (see the table in the task)

print(f"Cost: {cost}")
`,
        solution: String.raw`weight_kg = 7
express = False

if weight_kg <= 0:
    cost = None
elif weight_kg <= 1:
    cost = 40
elif weight_kg <= 5:
    cost = 90
else:
    cost = 90 + 15 * (weight_kg - 5)

if express and cost is not None:
    cost += 50

print(f"Cost: {cost}")
`,
        hints: [
          'Start with the invalid case: `if weight_kg <= 0: cost = None`. Then `elif weight_kg <= 1:` and so on: each `elif` only runs when the ones above were false.',
          'Above 5 kg: `cost = 90 + 15 * (weight_kg - 5)`.',
          'The express charge is a second, separate `if` after the chain: `if express and cost is not None: cost += 50`.'
        ],
        checks: [
          { label: '7 kg costs 120', code: 'assert cost == 120, f"got {cost}"' },
          { label: '0.5 kg and exactly 1 kg cost 40', code: 'assert rerun(weight_kg=0.5).cost == 40\nassert rerun(weight_kg=1).cost == 40, "exactly 1 kg is still in the first band"' },
          { label: '3 kg and exactly 5 kg cost 90', code: 'assert rerun(weight_kg=3).cost == 90\nassert rerun(weight_kg=5).cost == 90, "exactly 5 kg is still 90"' },
          { label: 'Express adds 50 (7 kg express costs 170)', code: 'assert rerun(weight_kg=7, express=True).cost == 170' },
          { label: 'A weight of 0 gives `None`, even with express', code: 'assert rerun(weight_kg=0).cost is None\nassert rerun(weight_kg=-2, express=True).cost is None' },
          { label: 'The bands use `elif`', code: 'assert any(isinstance(n, ast.If) and len(n.orelse) == 1 and isinstance(n.orelse[0], ast.If) for n in ast.walk(tree)), "use elif for the weight bands"' },
          { label: 'It prints `Cost: 120`', code: 'assert out == "Cost: 120\\n"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'py-loops', track: 'basics',
      title: 'Loops: for, range and while',
      summary: 'for over any sequence, range(), while, break and continue, the loop else, and enumerate when you need the index.',
      keywords: ['for', 'loop', 'range', 'while', 'break', 'continue', 'enumerate', 'for else', 'do while', 'iterate'],
      docs: 'https://docs.python.org/3/tutorial/controlflow.html#for-statements',
      body: [
        'Python\'s `for` walks over the items of anything that holds items: a list, a string (character by character), a range of numbers, a file (line by line). It is Java\'s for-each loop; there is no `for (;;)`.',
        py('for fruit in ["apple", "mango", "kiwi"]:',
           '    print(fruit)',
           'for ch in "abc":',
           '    print(ch, end=" ")',
           'print()'),
        '## range(): counting',
        '| Call | Numbers | Java |\n|---|---|---|\n| `range(5)` | 0 1 2 3 4 | `for (i = 0; i < 5; i++)` |\n| `range(2, 6)` | 2 3 4 5 | `for (i = 2; i < 6; i++)` |\n| `range(10, 0, -3)` | 10 7 4 1 | `for (i = 10; i > 0; i -= 3)` |',
        'The stop value is never included, which is why `range(len(items))` gives exactly the valid indexes.',
        '## The index and the value: enumerate',
        py('for position, lang in enumerate(["Java", "Python"], start=1):',
           '    print(position, lang)'),
        'Prefer `enumerate` to `for i in range(len(items))`: it says what you mean and cannot go out of range.',
        '## while',
        py('n = 3',
           'while n > 0:',
           '    print(n)',
           '    n -= 1',
           'print("lift-off")'),
        'There is no `do { } while`. When the body must run at least once, write `while True:` and leave with `break`.',
        '## break, continue, and the loop else',
        '`break` leaves the loop; `continue` skips to the next round. A loop can have an `else`: it runs when the loop finished **without** a `break`. It is made for searches:',
        py('for x in [3, 9, 11]:',
           '    if x % 2 == 0:',
           '        print("first even:", x)',
           '        break',
           'else:',
           '    print("no even number")    # runs: the loop never hit break')
      ].join('\n\n'),
      java: [
        '`for (int i = 0; i < n; i++)` is `for i in range(n):`, and `for (String s : list)` is `for s in list:`. Need the index too? `for i, s in enumerate(list):`.',
        'Python has no `do { } while`: write `while True:` with a `break`. `for … else` has no Java equivalent; it replaces the "found" flag you would set inside a Java loop.'
      ].join('\n\n'),
      js: 'Python\'s `for x in items` is JavaScript\'s `for (const x of items)`. Careful: JavaScript\'s `for...in` walks over keys and indexes, which is a different thing.',
      example: {
        code: String.raw`for fruit in ["apple", "mango", "kiwi"]:
    print(fruit.upper())

for i in range(3):            # 0, 1, 2
    print("i =", i)

for n in range(10, 0, -3):    # 10, 7, 4, 1
    print(n, end=" ")
print()

for position, lang in enumerate(["Java", "Python"], start=1):
    print(position, lang)

n = 27
steps = 0
while n != 1:                 # the Collatz sequence
    n = n // 2 if n % 2 == 0 else 3 * n + 1
    steps += 1
print("steps:", steps)

for x in [3, 9, 11]:
    if x % 2 == 0:
        print("first even:", x)
        break
else:
    print("no even number")
`
      },
      challenge: {
        title: 'FizzBuzz, with a total',
        task: [
          'Print the numbers from 1 to `n`, one per line, but print `Fizz` for multiples of 3, `Buzz` for multiples of 5, and `FizzBuzz` for multiples of both. Use `for` and `range`.',
          'After the loop, print `total: X`, where X is the sum of the numbers that were printed **as numbers** (not the ones replaced by a word). For `n = 15` that is 1 + 2 + 4 + 7 + 8 + 11 + 13 + 14 = 60.'
        ].join('\n\n'),
        starter: String.raw`n = 15

# print 1..n with Fizz / Buzz / FizzBuzz, then the total of the plain numbers
`,
        solution: String.raw`n = 15

total = 0
for i in range(1, n + 1):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)
        total += i
print(f"total: {total}")
`,
        hints: [
          '`range(1, n + 1)` gives 1 to n: the stop value is not included.',
          'Test for 15 (both) first, then 3, then 5. In the `else`, print the number and add it to a `total` that starts at 0 before the loop.',
          'Print the total after the loop, not indented inside it: `print(f"total: {total}")`.'
        ],
        checks: [
          { label: 'For n = 15, the 15 lines are right', code: 'assert lines[:15] == ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]' },
          { label: 'The last line is `total: 60`', code: 'assert lines[-1:] == ["total: 60"]' },
          { label: 'Exactly 16 lines (no extra output)', code: 'assert len(lines) == 16, f"{len(lines)} lines"' },
          { label: 'It follows `n` (n = 5 prints 1 2 Fizz 4 Buzz, total 7)', code: 'r = rerun(n=5)\nassert r.out.split("\\n")[:-1] == ["1", "2", "Fizz", "4", "Buzz", "total: 7"], f"got {r.out!r}"' },
          { label: 'It uses `for` and `range`', code: 'assert uses("For") and calls("range")' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 8 */
    {
      id: 'py-lists', track: 'basics',
      title: 'Lists',
      summary: 'Python\'s ArrayList: create, index, change, add and remove, sort, slice, copy, and check membership.',
      keywords: ['list', 'array', 'append', 'insert', 'pop', 'remove', 'sort', 'sorted', 'slice', 'index', 'copy', 'ArrayList', 'len'],
      docs: 'https://docs.python.org/3/tutorial/datastructures.html#more-on-lists',
      body: [
        'A list is an ordered, changeable sequence. Write it with square brackets; the items can be of any type.',
        py('langs = ["Java", "Python", "Go"]',
           'print(len(langs), langs[0], langs[-1])   # 3 Java Go',
           'langs[2] = "Rust"                          # replace an item',
           'print(langs)'),
        '## Adding and removing',
        '| Code | Does |\n|---|---|\n| `a.append(x)` | add at the end |\n| `a.insert(i, x)` | add at position i |\n| `a.extend(b)` | add every item of b |\n| `a.pop()`, `a.pop(i)` | remove and return the last (or the i-th) item |\n| `a.remove(x)` | remove the first item equal to x (error if missing) |\n| `del a[i]` | remove the item at i |\n| `x in a`, `a.index(x)`, `a.count(x)` | find |',
        '## Sorting: sort() or sorted()',
        py('nums = [5, 2, 9, 1]',
           'ordered = sorted(nums)         # a NEW sorted list; nums is unchanged',
           'nums.sort(reverse=True)        # sorts nums itself, returns None',
           'print(ordered, nums)',
           'words = ["kiwi", "fig", "banana"]',
           'print(sorted(words, key=len))  # sort by length: [\'fig\', \'kiwi\', \'banana\']'),
        'A classic slip: `nums = nums.sort()` sets `nums` to `None`, because `sort()` changes the list in place and returns nothing.',
        '## Slices',
        '`a[start:stop]` is a new list with the items from `start` up to (not including) `stop`. Leave out either end to mean "from the start" or "to the end"; a third number is a step.',
        py('a = [10, 20, 30, 40, 50]',
           'print(a[1:3], a[:2], a[-2:], a[::-1])   # [20, 30] [10, 20] [40, 50] [50, 40, 30, 20, 10]'),
        '## A name is not a copy',
        'Assigning a list to another name does not copy it: both names refer to the same list, exactly as two Java references to one `ArrayList`.',
        py('a = [1, 2]',
           'b = a          # same list',
           'c = a.copy()   # a new list (a[:] does the same)',
           'b.append(3)',
           'print(a, c)    # [1, 2, 3] [1, 2]'),
        '`min`, `max` and `sum` work on any list of numbers: `sum([1, 2, 3])` is `6`.'
      ].join('\n\n'),
      java: [
        'A list is an `ArrayList<Object>` with a literal: `[1, 2, 3]` instead of `new ArrayList<>(List.of(1, 2, 3))`.',
        '| Java | Python |\n|---|---|\n| `list.add(x)` | `a.append(x)` |\n| `list.get(i)`, `list.set(i, x)` | `a[i]`, `a[i] = x` |\n| `list.size()` | `len(a)` |\n| `list.contains(x)` | `x in a` |\n| `Collections.sort(list)` | `a.sort()` |\n| `list.subList(1, 3)` | `a[1:3]` (a copy, not a view) |'
      ].join('\n\n'),
      js: 'Lists behave like JavaScript arrays, but `push` is `append`, and negative indexes work: `a[-1]` is the last item. JavaScript\'s `slice(1, 3)` is `a[1:3]`.',
      example: {
        code: String.raw`langs = ["Java", "Python"]
langs.append("Go")
langs.insert(0, "C")
print(langs, len(langs))

last = langs.pop()
print("popped", last, "->", langs)

scores = [72, 95, 58, 88]
print(sorted(scores), "max:", max(scores), "sum:", sum(scores))
print("top two:", sorted(scores, reverse=True)[:2])

copy = scores.copy()
copy.append(100)
print(scores, copy)          # scores is unchanged

print("Python" in langs, langs.index("Python"))
`
      },
      challenge: {
        title: 'Tidy a playlist',
        task: [
          '1. Add `"Tum Hi Ho"` at the end of `songs`.',
          '2. Remove the **first** `"Kesariya"` (it is there twice).',
          '3. `sorted_songs`: a **new** list with the songs in alphabetical order. `songs` itself keeps its order.',
          '4. `top_two`: the first two songs of `sorted_songs`, taken with a slice.',
          '5. Print how many songs `songs` has, then its last song, each on its own line.'
        ].join('\n\n'),
        starter: String.raw`songs = ["Kesariya", "Naatu Naatu", "Jai Ho", "Kesariya", "Chaiyya Chaiyya"]

# 1. append  2. remove  3. sorted_songs  4. top_two  5. print
`,
        solution: String.raw`songs = ["Kesariya", "Naatu Naatu", "Jai Ho", "Kesariya", "Chaiyya Chaiyya"]

songs.append("Tum Hi Ho")
songs.remove("Kesariya")
sorted_songs = sorted(songs)
top_two = sorted_songs[:2]
print(len(songs))
print(songs[-1])
`,
        hints: [
          '`songs.append("Tum Hi Ho")`, then `songs.remove("Kesariya")`: `remove` takes away only the first match.',
          '`sorted(songs)` returns a new list; `songs.sort()` would reorder `songs` itself, which the task does not want.',
          '`sorted_songs[:2]` is the first two items; `songs[-1]` is the last.'
        ],
        checks: [
          { label: '`songs` has "Tum Hi Ho" at the end and only one "Kesariya"', code: 'assert songs == ["Naatu Naatu", "Jai Ho", "Kesariya", "Chaiyya Chaiyya", "Tum Hi Ho"]' },
          { label: 'It uses `append` and `remove`', code: 'assert calls("append") and calls("remove")' },
          { label: '`sorted_songs` is a new, sorted list', code: 'assert sorted_songs == ["Chaiyya Chaiyya", "Jai Ho", "Kesariya", "Naatu Naatu", "Tum Hi Ho"]\nassert sorted_songs is not songs, "sorted_songs must be a new list"' },
          { label: '`songs` keeps its own order', code: 'assert songs[0] == "Naatu Naatu", "use sorted(songs), not songs.sort()"' },
          { label: '`top_two` is taken with a slice', code: 'assert top_two == ["Chaiyya Chaiyya", "Jai Ho"]\nassert uses("Slice"), "take it with sorted_songs[:2]"' },
          { label: 'It prints 5, then `Tum Hi Ho`', code: 'assert lines == ["5", "Tum Hi Ho"]' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 9 */
    {
      id: 'py-tuples', track: 'basics',
      title: 'Tuples and unpacking',
      summary: 'Fixed groups of values: tuples, unpacking them into names, returning several values, and * to collect the rest.',
      keywords: ['tuple', 'unpacking', 'unpack', 'destructuring', 'star', 'rest', 'multiple return', 'immutable', 'record'],
      docs: 'https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences',
      body: [
        'A tuple is a fixed group of values, written with commas (usually inside round brackets). Unlike a list it cannot be changed after it is made, so it suits a record: a point, a date, a name and an age.',
        py('point = (3, 4)',
           'print(point[0], len(point))   # 3 2',
           'single = (42,)                # one item: the comma makes the tuple',
           'print(type(single), type((42)))  # tuple, and plain int'),
        '## Unpacking',
        'Unpacking reads the parts of a tuple (or a list, or any sequence) into names, in one line. The number of names must match:',
        py('x, y = (3, 4)',
           'name, age, city = ["Asha", 29, "Pune"]',
           'print(x + y, name, city)'),
        'It works in `for` loops too, which is how you loop over pairs:',
        py('students = [("Asha", 91), ("Ravi", 78)]',
           'for name, score in students:',
           '    print(f"{name}: {score}")'),
        '## * collects the rest',
        py('first, *rest = [10, 20, 30, 40]',
           'print(first, rest)          # 10 [20, 30, 40]',
           'head, *middle, tail = "python"',
           'print(head, middle, tail)   # p [\'y\', \'t\', \'h\', \'o\'] n'),
        '## Returning several values',
        'A function returns several values by returning a tuple; the caller unpacks it:',
        py('def low_high(numbers):',
           '    return min(numbers), max(numbers)',
           'low, high = low_high([7, 2, 9])',
           'print(low, high)'),
        'By convention, `_` names a value you do not need: `_, port = ("localhost", 8080)`.'
      ].join('\n\n'),
      java: [
        'Java has no tuple: you would write `record Point(int x, int y) {}` or return an array. A Python tuple is that record without the declaration, and unpacking (`x, y = point`) reads its parts into names in one line.',
        'The nearest Java relative of unpacking is the record pattern of Java 21: `if (obj instanceof Point(int x, int y))`.'
      ].join('\n\n'),
      js: 'Unpacking is JavaScript\'s destructuring: `const [first, ...rest] = items` is `first, *rest = items`.',
      example: {
        code: String.raw`point = (3, 4)
x, y = point
print(x, y, len(point), point[0])

single = (42,)        # the comma makes the tuple, not the brackets
print(type(single), type((42)))

students = [("Asha", 91), ("Ravi", 78), ("Li", 85)]
for name, score in students:
    print(f"{name:<5} {score}")

first, *rest = [10, 20, 30, 40]
print(first, rest)
*_, last = "python"
print(last)

def low_high(numbers):
    return min(numbers), max(numbers)

low, high = low_high([5, 2, 9])
print(low, high)
`
      },
      challenge: {
        title: 'Unpack the records',
        task: [
          '1. Unpack `record` into `emp_id`, `first`, `last`, `age` and `city`, **in one line**.',
          '2. `full_name`: `first` and `last` with a space between (`"Ravi Varma"`).',
          '3. In one line with `*`, unpack `readings` into `first_reading`, `middle` (a list of the readings in between) and `last_reading`.',
          '4. Loop over `team` (a list of `(name, age)` tuples), unpacking each pair in the `for` line, and print `Asha is 29` and `Li is 35`.'
        ].join('\n\n'),
        starter: String.raw`record = ("EMP042", "Ravi", "Varma", 31, "Pune")
readings = [21.5, 22.0, 23.4, 24.1, 22.8]
team = [("Asha", 29), ("Li", 35)]

# 1. unpack record  2. full_name  3. first_reading, *middle, last_reading  4. the loop
`,
        solution: String.raw`record = ("EMP042", "Ravi", "Varma", 31, "Pune")
readings = [21.5, 22.0, 23.4, 24.1, 22.8]
team = [("Asha", 29), ("Li", 35)]

emp_id, first, last, age, city = record
full_name = f"{first} {last}"
first_reading, *middle, last_reading = readings
for name, years in team:
    print(f"{name} is {years}")
`,
        hints: [
          'Five names on the left, one tuple on the right: `emp_id, first, last, age, city = record`.',
          'The starred name takes everything the others do not: `first_reading, *middle, last_reading = readings`.',
          'Unpack in the loop header: `for name, years in team:`.'
        ],
        checks: [
          { label: 'The five fields are unpacked', code: 'assert (emp_id, first, last, age, city) == ("EMP042", "Ravi", "Varma", 31, "Pune")' },
          { label: '...in one line', code: 'assert any(isinstance(n, ast.Assign) and isinstance(n.targets[0], ast.Tuple) and len(n.targets[0].elts) == 5 for n in ast.walk(tree)), "unpack all five in one assignment"' },
          { label: '`full_name` is "Ravi Varma"', code: 'assert full_name == "Ravi Varma"' },
          { label: '`readings` is unpacked with `*`', code: 'assert (first_reading, middle, last_reading) == (21.5, [22.0, 23.4, 24.1], 22.8)\nassert uses("Starred"), "use *middle"' },
          { label: 'The loop unpacks each pair and prints it', code: 'assert lines == ["Asha is 29", "Li is 35"]\nassert any(isinstance(n, ast.For) and isinstance(n.target, ast.Tuple) for n in ast.walk(tree)), "unpack in the for line: for name, years in team:"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 10 */
    {
      id: 'py-dicts-sets', track: 'basics',
      title: 'Dictionaries and sets',
      summary: 'dict is Python\'s HashMap and set its HashSet: create them, look up safely, loop over pairs, count things, and combine sets.',
      keywords: ['dict', 'dictionary', 'map', 'HashMap', 'key', 'value', 'get', 'items', 'set', 'HashSet', 'union', 'intersection', 'count', 'KeyError'],
      docs: 'https://docs.python.org/3/tutorial/datastructures.html#dictionaries',
      body: [
        'A dictionary (`dict`) maps keys to values. Write it with braces and `key: value` pairs; read and write with square brackets.',
        py('ages = {"Asha": 29, "Ravi": 31}',
           'ages["Li"] = 35              # add or replace',
           'print(ages["Ravi"], len(ages), "Asha" in ages)',
           'del ages["Asha"]',
           'print(ages)                  # {\'Ravi\': 31, \'Li\': 35}'),
        '## Missing keys',
        'Reading a key that is not there is an error (`KeyError`), not `null`. When a key may be missing, use `get`, which returns `None` or a default you choose:',
        py('ages = {"Ravi": 31}',
           'print(ages.get("Sam"), ages.get("Sam", 0))   # None 0',
           'ages["Sam"]  # raises KeyError'),
        '## Looping',
        'A loop over a dict walks over its keys. `items()` gives the key and the value together; `values()` gives only the values. Dicts keep the order in which keys were added.',
        py('prices = {"tea": 20, "coffee": 35, "lassi": 50}',
           'for item, price in prices.items():',
           '    print(f"{item}: {price}")',
           'print(sum(prices.values()))'),
        '## Counting',
        'Counting how often things occur is the most common dict job:',
        py('counts = {}',
           'for word in "to be or not to be".split():',
           '    counts[word] = counts.get(word, 0) + 1',
           'print(counts)          # {\'to\': 2, \'be\': 2, \'or\': 1, \'not\': 1}'),
        'Keys must be values that never change: strings, numbers and tuples work, lists do not.',
        '## Sets',
        'A set holds each value at most once, with no order. Membership tests (`x in s`) are fast. Careful: `{}` is an empty **dict**; an empty set is `set()`.',
        py('a = {"java", "python", "sql"}',
           'b = {"python", "go"}',
           'print(a & b)    # in both: {\'python\'}',
           'print(a - b)    # in a, not in b',
           'print(len(a.union(b)))   # 4: everything, once',
           'unique = set([3, 1, 3, 2, 1])',
           'print(sorted(unique))    # [1, 2, 3]')
      ].join('\n\n'),
      java: [
        '`Map<String, Integer> m = new HashMap<>(); m.put("a", 1); m.get("a")` becomes `m = {"a": 1}` and `m["a"]`.',
        'A missing key is an error (`KeyError`), not `null`; `m.get("a")` is the version that returns `None`, and `getOrDefault(k, 0)` is `get(k, 0)`. The order is the insertion order, as with `LinkedHashMap`. `entrySet()` is `items()`, `keySet()` is the dict itself, and `containsKey(k)` is `k in m`.',
        'A set is a `HashSet` with a literal: `{1, 2}`. `retainAll` is `&`, `addAll` is `.union(...)` (or `.update(...)` to change the set), `removeAll` is `-`.'
      ].join('\n\n'),
      js: 'A dict is like a JavaScript object used as a map (or a `Map`), with one difference: keys are not turned into strings, so `1` and `"1"` are two different keys.',
      blockStdin: '',
      example: {
        code: String.raw`menu = {"tea": 20, "coffee": 35}
menu["lassi"] = 50
print(menu["coffee"], menu.get("juice", "not on the menu"))

for item, price in menu.items():
    print(f"{item:<8}{price:>4}")

orders = ["tea", "coffee", "tea", "lassi", "tea"]
counts = {}
for item in orders:
    counts[item] = counts.get(item, 0) + 1
print(counts)

java_devs = {"Asha", "Ravi", "Li"}
python_devs = {"Ravi", "Sam"}
print("both:", java_devs & python_devs)
print("only Java:", sorted(java_devs - python_devs))
`
      },
      challenge: {
        title: 'Count the words',
        task: [
          '1. `counts`: a dict from each word of `text` to how many times it appears.',
          '2. `unique`: the **set** of the words.',
          '3. `most`: the word that appears most often.',
          '4. Print every word with its count, as `the: 3`, one per line, in the order the words first appear in the text.'
        ].join('\n\n'),
        starter: String.raw`text = "the cat and the hat and the bat"

# counts, unique, most, then print "word: count" lines
`,
        solution: String.raw`text = "the cat and the hat and the bat"

counts = {}
for word in text.split():
    counts[word] = counts.get(word, 0) + 1
unique = set(counts)
most = max(counts, key=counts.get)
for word, n in counts.items():
    print(f"{word}: {n}")
`,
        hints: [
          '`text.split()` gives the list of words. For each word: `counts[word] = counts.get(word, 0) + 1`.',
          '`set(counts)` is the set of the keys. A dict keeps the order its keys were added, so a loop over `counts.items()` prints in first-seen order.',
          'For the most frequent word, either loop and remember the best so far, or use `max(counts, key=counts.get)`: the key whose `counts.get(key)` is largest.'
        ],
        checks: [
          { label: '`counts` has every word and its count', code: 'assert counts == {"the": 3, "cat": 1, "and": 2, "hat": 1, "bat": 1}' },
          { label: '`unique` is a set of the words', code: 'assert isinstance(unique, set), f"unique is a {type(unique).__name__}"\nassert unique == {"the", "cat", "and", "hat", "bat"}' },
          { label: '`most` is "the"', code: 'assert most == "the"' },
          { label: 'The lines are printed in first-seen order', code: 'assert lines == ["the: 3", "cat: 1", "and: 2", "hat: 1", "bat: 1"]' },
          { label: 'It works for any text ("b a b c b a")', code: 'r = rerun(text="b a b c b a")\nassert r.counts == {"b": 3, "a": 2, "c": 1} and r.most == "b", f"got {r.counts}, most {r.most!r}"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 11 */
    {
      id: 'py-functions', track: 'basics',
      title: 'Functions',
      summary: 'def, return, default and keyword arguments, docstrings, returning several values, and passing functions around.',
      keywords: ['function', 'def', 'return', 'parameter', 'argument', 'default argument', 'keyword argument', 'docstring', 'None', 'method', 'overloading'],
      docs: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions',
      body: [
        '`def` defines a function: a name, the parameters in brackets, a colon, and an indented body. `return` hands back a value.',
        py('def area(width, height):',
           '    """Return the area of a rectangle."""',
           '    return width * height',
           '',
           'print(area(3, 4))      # 12'),
        'The string right under the `def` line is the **docstring**: the function\'s documentation, shown by `help(area)` and by editors.',
        'A function must be defined before the line that **calls** it runs, which is why programs put their functions at the top. A function without a `return` returns `None`.',
        '## Default and keyword arguments',
        py('def greet(name, greeting="Hello", punctuation="!"):',
           '    return f"{greeting}, {name}{punctuation}"',
           '',
           'print(greet("Ravi"))                       # Hello, Ravi!',
           'print(greet("Asha", "Namaste"))            # Namaste, Asha!',
           'print(greet("Li", punctuation="?"))        # skip one, name another'),
        'Arguments can be passed **by name**, in any order, after the positional ones. That keeps calls readable (`connect(host="db", port=5432, timeout=3)`) and replaces most of what overloading does in Java.',
        '## Several return values',
        py('def min_max(numbers):',
           '    return min(numbers), max(numbers)    # a tuple',
           '',
           'low, high = min_max([7, 2, 9, 4])',
           'print(low, high)'),
        '## Functions are values',
        'A function is an object like any other: you can store it in a variable or pass it to another function. Many built-ins take one, such as the `key` of `sorted`:',
        py('def last_letter(word):',
           '    return word[-1]',
           '',
           'print(sorted(["kiwi", "apple", "fig"], key=last_letter))   # [\'apple\', \'fig\', \'kiwi\']'),
        '## Local names',
        'Names assigned inside a function are local to it: they disappear when it returns and never clash with names outside. Reading an outer name works; assigning to one needs `global` (rarely a good idea). The Functions track covers scope, `*args`, closures and decorators.',
        '## Type hints (optional)',
        'You may annotate parameters and the result: `def area(width: float, height: float) -> float:`. Python does not enforce them when it runs; editors and tools such as mypy read them. [[lesson:py-type-hints]] covers them.'
      ].join('\n\n'),
      java: [
        'No return type, no parameter types, no `public static`, and no overloading: one function with default values (`def connect(host, port=5432)`) replaces several overloads. Callers can name arguments (`connect(port=6000, host="db")`), which Java cannot do.',
        'A function with no `return` returns `None`, the way a `void` method returns nothing. Passing a function, as in `sorted(words, key=last_letter)`, is what Java does with a method reference: `words.sort(Comparator.comparing(Main::lastLetter))`.'
      ].join('\n\n'),
      js: 'Like JavaScript functions, Python functions are values and can have default parameters. Python adds keyword arguments: JavaScript gets the same effect by passing an options object.',
      example: {
        code: String.raw`def greet(name, greeting="Hello"):
    """Return a greeting for name."""
    return f"{greeting}, {name}!"

print(greet("Ravi"))
print(greet("Asha", "Namaste"))
print(greet(greeting="Hi", name="Li"))      # keyword arguments: any order

def min_max(numbers):
    return min(numbers), max(numbers)       # two values, as a tuple

low, high = min_max([7, 2, 9, 4])
print(low, high)

def shout(text):
    print(text.upper())                     # no return statement

result = shout("hey")
print("shout returned", result)
`
      },
      challenge: {
        title: 'A BMI calculator',
        task: [
          'Write three functions, then print one report.',
          '1. `bmi(weight_kg, height_m)` returns the weight divided by the height squared, rounded to 1 decimal place.',
          '2. `category(value)` returns `"underweight"` below 18.5, `"normal"` below 25, `"overweight"` below 30, and `"obese"` otherwise.',
          '3. `report(name, weight_kg, height_m)` returns a string such as `Ravi: BMI 22.9 (normal)`. It should call the other two functions.',
          '4. Print `report("Ravi", 70, 1.75)`.'
        ].join('\n\n'),
        starter: String.raw`def bmi(weight_kg, height_m):
    pass


def category(value):
    pass


def report(name, weight_kg, height_m):
    pass


print(report("Ravi", 70, 1.75))
`,
        solution: String.raw`def bmi(weight_kg, height_m):
    """Body mass index, rounded to 1 decimal place."""
    return round(weight_kg / height_m ** 2, 1)


def category(value):
    if value < 18.5:
        return "underweight"
    elif value < 25:
        return "normal"
    elif value < 30:
        return "overweight"
    return "obese"


def report(name, weight_kg, height_m):
    value = bmi(weight_kg, height_m)
    return f"{name}: BMI {value} ({category(value)})"


print(report("Ravi", 70, 1.75))
`,
        hints: [
          '`height_m ** 2` squares the height; wrap the division in `round(..., 1)`.',
          'In `category`, an `if`/`elif` chain where each branch `return`s. Once a `return` runs, the function ends, so the last line can simply be `return "obese"`.',
          'In `report`, work out the value once, `value = bmi(weight_kg, height_m)`, then build the text with an f-string that also calls `category(value)`.'
        ],
        checks: [
          { label: '`bmi(70, 1.75)` is 22.9 and `bmi(50, 1.6)` is 19.5', code: 'assert bmi(70, 1.75) == 22.9\nassert bmi(50, 1.6) == 19.5' },
          { label: '`category` follows the table, including the edges', code: 'got = [category(x) for x in (17, 18.5, 24.9, 25, 29.9, 30)]\nassert got == ["underweight", "normal", "normal", "overweight", "overweight", "obese"], f"for 17, 18.5, 24.9, 25, 29.9, 30 got {got}"' },
          { label: '`report("Asha", 50, 1.6)` is `Asha: BMI 19.5 (normal)`', code: 'assert report("Asha", 50, 1.6) == "Asha: BMI 19.5 (normal)"' },
          { label: '`report` calls `bmi` and `category`', code: 'fn = next(n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef) and n.name == "report")\nnames = {c.func.id for c in ast.walk(fn) if isinstance(c, ast.Call) and isinstance(c.func, ast.Name)}\nassert {"bmi", "category"} <= names, "inside report, call bmi(...) and category(...)"' },
          { label: 'It prints `Ravi: BMI 22.9 (normal)`', code: 'assert out == "Ravi: BMI 22.9 (normal)\\n"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 12 */
    {
      id: 'py-exceptions', track: 'basics',
      title: 'Exceptions: try, except, raise',
      summary: 'Catching errors with try / except, else and finally, raising your own, and why Python has no checked exceptions.',
      keywords: ['exception', 'try', 'except', 'catch', 'finally', 'else', 'raise', 'throw', 'ValueError', 'error handling', 'checked exceptions'],
      docs: 'https://docs.python.org/3/tutorial/errors.html',
      body: [
        'When something goes wrong while a program runs, Python **raises an exception**. If nothing catches it, the program stops and prints a traceback: the chain of calls that led there, the line, and the error.',
        py('int("abc")  # raises ValueError'),
        '## try and except',
        py('text = "12x"',
           'try:',
           '    number = int(text)',
           'except ValueError:',
           '    print(f"{text!r} is not a whole number")',
           '    number = 0',
           'print(number)'),
        'Catch the **specific** exception you expect. `except ValueError as e:` also gives you the exception object; `str(e)` is its message. Several `except` blocks can follow one `try`, and one block can catch several types: `except (KeyError, IndexError):`.',
        '## else and finally',
        '| Block | Runs |\n|---|---|\n| `try` | the code that may fail |\n| `except X` | only when an X was raised |\n| `else` | only when nothing was raised |\n| `finally` | always, last, even after a `return` |',
        '## Raising your own',
        py('def withdraw(balance, amount):',
           '    if amount > balance:',
           '        raise ValueError(f"cannot withdraw {amount}: balance is {balance}")',
           '    return balance - amount',
           '',
           'try:',
           '    withdraw(100, 250)',
           'except ValueError as e:',
           '    print("Error:", e)'),
        '## The exceptions you will meet most',
        '| Exception | Typical cause |\n|---|---|\n| `ValueError` | right type, wrong value: `int("abc")` |\n| `TypeError` | wrong type: `"n = " + 5` |\n| `KeyError` | a missing dict key |\n| `IndexError` | a list position past the end |\n| `ZeroDivisionError` | dividing by zero |\n| `FileNotFoundError` | opening a file that does not exist |\n| `AttributeError` | a method the object does not have: `[].push(1)` |\n| `NameError` | a name that was never assigned (or is misspelt) |',
        '## Your own exception types',
        'A new exception type is a class that inherits from `Exception`; a docstring is enough as its body. The Objects track explains classes properly.',
        py('class InsufficientFunds(Exception):',
           '    """Raised when an account has too little money."""',
           '',
           'try:',
           '    raise InsufficientFunds("balance 100, needed 250")',
           'except InsufficientFunds as e:',
           '    print(type(e).__name__, "-", e)'),
        'Do not catch everything with a bare `except:` or `except Exception:` "just in case": it also hides your own bugs, such as a misspelt name.'
      ].join('\n\n'),
      java: [
        '`try { } catch (NumberFormatException e) { }` is `try: ... except ValueError as e: ...`, and `throw new IllegalArgumentException("...")` is `raise ValueError("...")`.',
        'There are **no checked exceptions** and no `throws` clause: any function may raise anything, so the documentation (or the code) is where you learn what to expect. Java\'s habit of `catch (Exception e)` is worth dropping: catch the specific exception you expect.',
        'Python adds `else`: code that should run only when the `try` succeeded, kept out of the `try` so its own errors are not caught by mistake. try-with-resources is the `with` statement, in [[lesson:py-input-files]].'
      ].join('\n\n'),
      js: 'JavaScript\'s `try { } catch (e) { }` catches everything, because JavaScript cannot catch by type. Python\'s `except ValueError:` catches only that type and lets other errors through.',
      example: {
        code: String.raw`def parse_age(text):
    try:
        age = int(text)
    except ValueError:
        print(f"{text!r} is not a number")
        return None
    else:
        print("parsed", age)       # only when there was no exception
        return age
    finally:
        print("finally always runs")

parse_age("42")
parse_age("forty")

def withdraw(balance, amount):
    if amount > balance:
        raise ValueError(f"cannot withdraw {amount}: balance is {balance}")
    return balance - amount

try:
    withdraw(100, 250)
except ValueError as e:
    print("Error:", e)
`
      },
      challenge: {
        title: 'Safe division and validation',
        task: [
          '1. `safe_divide(a, b)` returns `a / b`, or `None` when `b` is 0. Catch the `ZeroDivisionError`; do not test `b == 0` first.',
          '2. `parse_quantity(text)` returns `int(text)` when it is a whole number from 1 to 100. For a number outside that range, raise `ValueError("quantity must be 1 to 100")`. For text that is not a number, let `int()` raise its own `ValueError`.',
          '3. `total_items(texts)` adds up `parse_quantity` of every text in the list, skipping (not crashing on) any text that raises `ValueError`. It returns a tuple: the total and how many texts were skipped.'
        ].join('\n\n'),
        starter: String.raw`def safe_divide(a, b):
    return a / b


def parse_quantity(text):
    return int(text)


def total_items(texts):
    total = 0
    for text in texts:
        total += parse_quantity(text)
    return total
`,
        solution: String.raw`def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return None


def parse_quantity(text):
    quantity = int(text)
    if not 1 <= quantity <= 100:
        raise ValueError("quantity must be 1 to 100")
    return quantity


def total_items(texts):
    total = 0
    skipped = 0
    for text in texts:
        try:
            total += parse_quantity(text)
        except ValueError:
            skipped += 1
    return total, skipped
`,
        hints: [
          'In `safe_divide`, put `return a / b` inside a `try`, and `return None` in `except ZeroDivisionError:`.',
          'In `parse_quantity`, convert first (`int()` raises by itself for "abc"), then check the range: `if not 1 <= quantity <= 100: raise ValueError("quantity must be 1 to 100")`.',
          'In `total_items`, wrap the addition in `try` / `except ValueError:` and count the skipped ones; end with `return total, skipped`.'
        ],
        checks: [
          { label: '`safe_divide(10, 4)` is 2.5 and `safe_divide(1, 0)` is `None`', code: 'assert safe_divide(10, 4) == 2.5\nassert safe_divide(1, 0) is None' },
          { label: '`safe_divide` catches `ZeroDivisionError`', code: 'assert uses("Try") and "ZeroDivisionError" in src, "use try / except ZeroDivisionError"' },
          { label: '`parse_quantity("7")` is 7', code: 'assert parse_quantity("7") == 7' },
          { label: '`parse_quantity("0")` and `("101")` raise `ValueError("quantity must be 1 to 100")`', code: 'for t in ("0", "101"):\n    try:\n        parse_quantity(t)\n    except ValueError as e:\n        assert "1 to 100" in str(e), f"the message was {str(e)!r}"\n    else:\n        raise AssertionError(f"parse_quantity({t!r}) raised nothing")' },
          { label: '`parse_quantity("abc")` raises `ValueError`', code: 'try:\n    parse_quantity("abc")\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("parse_quantity(\'abc\') raised nothing")' },
          { label: '`total_items(["3", "x", "200", "10"])` is `(13, 2)`', code: 'assert total_items(["3", "x", "200", "10"]) == (13, 2)\nassert total_items([]) == (0, 0), "an empty list gives (0, 0)"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 13 */
    {
      id: 'py-input-files', track: 'basics',
      title: 'Input and files',
      summary: 'Reading what the user types with input(), converting it, and reading and writing files with with open().',
      keywords: ['input', 'Scanner', 'file', 'open', 'with', 'read', 'write', 'readline', 'pathlib', 'encoding', 'try-with-resources', 'FileNotFoundError'],
      docs: 'https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files',
      blockStdin: 'Ravi\n30\n3 4\n',
      body: [
        '## input()',
        '`input(prompt)` prints the prompt, waits for a line, and returns it **as a string**, without the newline. Convert it yourself when you need a number. In this tool, type the lines into the **Input** box: each `input()` call reads the next line, and the output shows it after the prompt, as a terminal would.',
        py('name = input("Name: ")',
           'age = int(input("Age: "))           # text to number',
           'a, b = input().split()              # two values on one line: "3 4"',
           'print(f"{name} is {age}; {a} + {b} = {int(a) + int(b)}")'),
        '## Opening a file',
        '`open(path, mode, encoding=...)` opens a file. Always use it in a `with` block: the file is closed when the block ends, even if an exception happens inside it. Always say `encoding="utf-8"`, or Python uses the operating system\'s default, which differs between Windows and Linux.',
        '| Mode | Means |\n|---|---|\n| `"r"` (the default) | read |\n| `"w"` | write: creates the file, or empties it first |\n| `"a"` | append to the end |',
        '## Writing, then reading back',
        py('with open("notes.txt", "w", encoding="utf-8") as f:',
           '    f.write("first line\\n")          # write adds no newline by itself',
           '    print("second line", file=f)      # print can write to a file too',
           '',
           'with open("notes.txt", encoding="utf-8") as f:',
           '    for line in f:                    # one line at a time, with its "\\n"',
           '        print(line.rstrip("\\n"))',
           '',
           'with open("notes.txt", encoding="utf-8") as f:',
           '    text = f.read()                   # the whole file as one string',
           'print(len(text.splitlines()), "lines")'),
        '## pathlib: the modern way to handle paths',
        py('from pathlib import Path',
           'p = Path("todo.txt")',
           'p.write_text("buy milk\\ncall home\\n", encoding="utf-8")',
           'print(p.exists(), p.suffix, p.read_text(encoding="utf-8").splitlines())'),
        'Opening a file that does not exist for reading raises `FileNotFoundError`, which you can catch like any other exception.',
        'In this tool, each run gets an empty folder of its own, so a program can create files, read them back and leave nothing behind.'
      ].join('\n\n'),
      java: [
        '`Scanner sc = new Scanner(System.in); String s = sc.nextLine();` is `s = input()`, and `sc.nextInt()` is `int(input())`.',
        'try-with-resources, `try (var r = Files.newBufferedReader(p)) { ... }`, is `with open(p, encoding="utf-8") as f: ...`: the file is closed when the block ends, even after an exception. `Files.readString(p)` is `Path(p).read_text(encoding="utf-8")`, and `Files.writeString(p, s)` is `Path(p).write_text(s, encoding="utf-8")`.'
      ].join('\n\n'),
      example: {
        code: String.raw`name = input("Your name: ")
count = int(input("How many lines? "))

with open("greetings.txt", "w", encoding="utf-8") as f:
    for i in range(1, count + 1):
        f.write(f"{i}. Hello, {name}!\n")

with open("greetings.txt", encoding="utf-8") as f:
    for line in f:
        print("read back:", line.rstrip("\n"))
`,
        stdin: 'Ravi\n3\n',
        note: 'Change the lines in the Input box and run it again.'
      },
      challenge: {
        title: 'A marks report',
        task: [
          'The input is a number `n`, then `n` lines of `name score` (see the input below). Your program should:',
          '1. Read them with `input()`.',
          '2. Write `report.txt` with one line `name: score` for each person who passed (a score of 40 or more), in input order. Use `with open(...)`.',
          '3. Print `passed X of N`, then `average A`, where A is the average of **all** the scores with 1 decimal place.',
          '4. Read `report.txt` back and print what is in it.'
        ].join('\n\n'),
        stdin: '4\nAsha 91\nRavi 35\nLi 68\nSam 40\n',
        starter: String.raw`n = int(input())

# read n lines of "name score", write report.txt, print the summary, then print report.txt
`,
        solution: String.raw`n = int(input())
passed = []
total = 0
for _ in range(n):
    name, score = input().split()
    score = int(score)
    total += score
    if score >= 40:
        passed.append((name, score))

with open("report.txt", "w", encoding="utf-8") as f:
    for name, score in passed:
        f.write(f"{name}: {score}\n")

print(f"passed {len(passed)} of {n}")
print(f"average {total / n:.1f}")

with open("report.txt", encoding="utf-8") as f:
    print(f.read(), end="")
`,
        hints: [
          'Loop `n` times with `for _ in range(n):`; inside, `name, score = input().split()` and then `score = int(score)`.',
          'Collect the passes in a list of `(name, score)` tuples while you add every score to a total. Write the file afterwards: `with open("report.txt", "w", encoding="utf-8") as f:` and `f.write(f"{name}: {score}\\n")`.',
          'Average with one decimal: `f"average {total / n:.1f}"`. To show the file, open it again for reading and `print(f.read(), end="")`.'
        ],
        checks: [
          { label: '`report.txt` lists the three people who passed', code: 'with open("report.txt", encoding="utf-8") as f:\n    got = f.read().splitlines()\nassert got == ["Asha: 91", "Li: 68", "Sam: 40"], f"report.txt holds {got}"' },
          { label: 'It prints `passed 3 of 4`', code: 'assert "passed 3 of 4" in out' },
          { label: 'It prints `average 58.5`', code: 'assert "average 58.5" in out' },
          { label: 'It prints the report it read back', code: 'assert out.rstrip().endswith("Asha: 91\\nLi: 68\\nSam: 40"), "print report.txt at the end"' },
          { label: 'It uses `input()` and `with`', code: 'assert calls("input") and uses("With")' },
          { label: 'It works for other input (2 people: 10 and 50)', code: 'o = run_with("2\\nA 10\\nB 50\\n")\nassert "passed 1 of 2" in o and "average 30.0" in o, f"the output was {o!r}"' }
        ]
      }
    }
  );
})(window.PYLT);
