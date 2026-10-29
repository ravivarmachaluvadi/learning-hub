/*
 * The Reference, part 3: keywords, operators and special methods. The entry shape is described at
 * the top of data/reference-builtins.js. True, False and None are keywords too; their entries are in
 * the constants group.
 */
(function (U) {
  var R = U.data.reference = U.data.reference || [];
  var SIMPLE = 'https://docs.python.org/3/reference/simple_stmts.html#', COMPOUND = 'https://docs.python.org/3/reference/compound_stmts.html#',
    EXPR = 'https://docs.python.org/3/reference/expressions.html#', MODEL = 'https://docs.python.org/3/reference/datamodel.html#object.';
  function nl(s) { return /\n$/.test(s) ? s : s + '\n'; }
  function add(group, prefix, rows) {
    rows.forEach(function (r) {
      var e = { id: prefix + (r.key || r.name.replace(/_/g, '')), group: group, name: r.name, title: r.title || r.name,
        sig: r.sig, summary: r.summary, java: r.java, example: nl(r.example), output: nl(r.output) };
      ['covers', 'docs'].forEach(function (k) { if (r[k]) e[k] = r[k]; });
      if (!e.docs && group === 'dunders' && /^__\w+__$/.test(r.name)) e.docs = MODEL + r.name;
      R.push(e);
    });
  }

  /* ---------------------------------------------------------------- keywords */

  add('keywords', 'kw-', [
    { name: 'and', sig: 'a and b', docs: EXPR + 'boolean-operations',
      summary: '`True` when both sides are. It stops early: when the left side is falsy it is the result, and the right side is never worked out.',
      java: '`&&`',
      example: String.raw`age = 25
has_ticket = True
print(age >= 18 and has_ticket)
print(repr(0 and 5), repr(3 and 5), repr("" and "x"))`,
      output: String.raw`True
0 5 ''` },
    { name: 'as', sig: 'import x as y, with ... as f, except E as e', docs: SIMPLE + 'the-import-statement',
      summary: 'Gives something a name: a module under a shorter name, the object a `with` opened, the exception an `except` caught.',
      java: 'The variable in `catch (E e)` and in try-with-resources.',
      example: String.raw`import statistics as stats
print(stats.mean([2, 4, 9]))
try:
    1 / 0
except ZeroDivisionError as e:
    print("caught:", e)
with open("a.txt", "w", encoding="utf-8") as f:
    print(type(f).__name__)`,
      output: String.raw`5
caught: division by zero
TextIOWrapper` },
    { name: 'assert', sig: 'assert condition, message', docs: SIMPLE + 'the-assert-statement',
      summary: 'Raises `AssertionError` with the message when the condition is false. For catching bugs, not for checking user input: `python -O` removes asserts.',
      java: '`assert amount > 0 : "..."`, but Java\'s asserts are off unless you run with `-ea`; Python\'s are on.',
      example: String.raw`def withdraw(balance, amount):
    assert amount > 0, f"amount must be positive, got {amount}"
    return balance - amount

print(withdraw(100, 30))
try:
    withdraw(100, -5)
except AssertionError as e:
    print("AssertionError:", e)`,
      output: String.raw`70
AssertionError: amount must be positive, got -5` },
    { name: 'async', title: 'async and await', covers: ['await'], sig: 'async def f(): ... await other()', docs: COMPOUND + 'coroutines',
      summary: '`async def` makes a coroutine function; `await` pauses it until another coroutine or task finishes, letting other work run meanwhile. `asyncio.run(main())` starts the whole thing.',
      java: '`CompletableFuture` chains (`thenCompose`, `allOf`), or virtual threads.',
      example: String.raw`import asyncio

async def fetch(name, seconds):
    await asyncio.sleep(seconds)
    return f"{name} done"

async def main():
    results = await asyncio.gather(fetch("a", 0.02), fetch("b", 0.01))
    print(results)

asyncio.run(main())`,
      output: String.raw`['a done', 'b done']` },
    { name: 'break', title: 'break and continue', covers: ['continue'], sig: 'break, continue', docs: SIMPLE + 'the-break-statement',
      summary: '`break` leaves the innermost loop; `continue` skips to its next round. Python has no labelled `break`: move the loops into a function and `return`.',
      java: 'The same `break` and `continue`, without labels.',
      example: String.raw`for n in range(10):
    if n % 2 == 0:
        continue          # skip to the next n
    if n > 6:
        break             # leave the loop
    print(n)`,
      output: String.raw`1
3
5` },
    { name: 'class', sig: 'class Name(Base): ...', docs: COMPOUND + 'class-definitions',
      summary: 'Defines a class. Attributes are made by assigning to `self.x` in `__init__`; names assigned in the class body are class attributes, shared like `static` fields. Lesson: [[lesson:py-classes]].',
      java: '`class Counter { static int total; String name; ... }`',
      example: String.raw`class Counter:
    total = 0                     # a class attribute, shared (like static)

    def __init__(self, name):
        self.name = name          # an instance attribute
        Counter.total += 1

a, b = Counter("a"), Counter("b")
print(a.name, b.name, Counter.total)`,
      output: String.raw`a b 2` },
    { name: 'def', sig: 'def name(params): ...', docs: COMPOUND + 'function-definitions',
      summary: 'Defines a function. It runs when the `def` line runs, making a function object; default values are worked out then, once.',
      java: 'A method, but it can live outside any class.',
      example: String.raw`def greet(name, greeting="Hello"):
    """Return a greeting."""
    return f"{greeting}, {name}!"

print(greet("Asha"))
print(greet("Ravi", greeting="Hi"))
print(greet.__doc__)`,
      output: String.raw`Hello, Asha!
Hi, Ravi!
Return a greeting.` },
    { name: 'del', sig: 'del name, del items[i], del d[key], del obj.attr', docs: SIMPLE + 'the-del-statement',
      summary: 'Removes a name, a list item or slice, a dict key or an attribute. It deletes the name, not the object: the object goes when nothing refers to it.',
      java: '`list.remove(0)`, `map.remove("a")`; a local variable cannot be removed.',
      example: String.raw`nums = [10, 20, 30, 40]
del nums[0]
del nums[1:]
print(nums)
d = {"a": 1, "b": 2}
del d["a"]
print(d)
x = 5
del x
print("x" in globals())`,
      output: String.raw`[20]
{'b': 2}
False` },
    { name: 'if', title: 'if, elif and else', covers: ['elif', 'else'], sig: 'if a: ... elif b: ... else: ...', docs: COMPOUND + 'the-if-statement',
      summary: 'Runs the first block whose condition is true. `elif` is Java\'s `else if`. `x if cond else y` is the expression form. (`else` also follows `for`, `while` and `try`.)',
      java: '`if / else if / else`, and `cond ? a : b`',
      example: String.raw`for temp in [5, 22, 35]:
    if temp < 10:
        print(temp, "cold")
    elif temp < 30:
        print(temp, "pleasant")
    else:
        print(temp, "hot")
print("even" if 4 % 2 == 0 else "odd")`,
      output: String.raw`5 cold
22 pleasant
35 hot
even` },
    { name: 'try', title: 'try, except, else and finally', covers: ['except', 'finally'], sig: 'try: ... except E as e: ... else: ... finally: ...', docs: COMPOUND + 'the-try-statement',
      summary: '`except` handles an error of that type; `else` runs only when nothing was raised; `finally` always runs. Lesson: [[lesson:py-exceptions]].',
      java: '`try / catch / finally`',
      example: String.raw`def parse(text):
    try:
        value = int(text)
    except ValueError:
        print(f"{text!r} is not a number")
        return None
    else:
        print("parsed", value)       # only when nothing was raised
        return value
    finally:
        print("finally always runs")

parse("42")
parse("x")`,
      output: String.raw`parsed 42
finally always runs
'x' is not a number
finally always runs` },
    { name: 'for', sig: 'for item in iterable: ... else: ...', docs: COMPOUND + 'the-for-statement',
      summary: 'Walks over the items of anything iterable. There is no counting `for (;;)`: count with `range()`. An `else` block runs when the loop ends without `break`.',
      java: '`for (String s : list)`, the enhanced for loop',
      example: String.raw`for ch in "ab":
    print(ch.upper())
for i, word in enumerate(["x", "y"]):
    print(i, word)
for n in [2, 3, 4]:
    if n % 5 == 0:
        break
else:
    print("no multiple of 5")      # runs because the loop did not break`,
      output: String.raw`A
B
0 x
1 y
no multiple of 5` },
    { name: 'import', title: 'import and from', covers: ['from'], sig: 'import module, from module import name', docs: SIMPLE + 'the-import-statement',
      summary: 'Loads a module (once; later imports reuse it) and binds a name to it, or to names inside it. Lesson: [[lesson:py-modules]].',
      java: '`import java.util.*;`, but a Python import also runs the module\'s code the first time.',
      example: String.raw`import math
from collections import Counter
from os import path as os_path

print(math.sqrt(16))
print(Counter("hello").most_common(1))
print(os_path.splitext("photo.png"))`,
      output: String.raw`4.0
[('l', 2)]
('photo', '.png')` },
    { name: 'global', sig: 'global name', docs: SIMPLE + 'the-global-statement',
      summary: 'Says that a name in this function means the module\'s variable, so assigning to it changes the global. Usually a sign that the function should return a value instead.',
      java: 'Writing to a `static` field.',
      example: String.raw`count = 0

def increment():
    global count
    count += 1

increment()
increment()
print(count)`,
      output: String.raw`2` },
    { name: 'nonlocal', sig: 'nonlocal name', docs: SIMPLE + 'the-nonlocal-statement',
      summary: 'Says that a name means the variable of the enclosing function, so a closure can change it. Lesson: [[lesson:py-closures]].',
      java: 'A lambda cannot change a captured local (it must be effectively final); Java code uses an `AtomicInteger` or a one-element array instead.',
      example: String.raw`def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

c = make_counter()
print(c(), c(), c())`,
      output: String.raw`1 2 3` },
    { name: 'in', sig: 'x in container, x not in container', docs: EXPR + 'membership-test-operations',
      summary: 'Asks whether a container holds something: a substring, a list item, a dict **key**. Also the "in" of a `for` loop.',
      java: '`s.contains("py")`, `list.contains(3)`, `map.containsKey("k")`',
      example: String.raw`print("py" in "python", 3 in [1, 2, 3], "k" in {"k": 1}, 4 not in {1, 2})
for x in (1, 2):
    print(x)`,
      output: String.raw`True True True True
1
2` },
    { name: 'is', sig: 'a is b, a is not b', docs: EXPR + 'is-not',
      summary: 'Whether two names refer to the **same object**. Use it for `None` (`x is None`); compare values with `==`. See [[explain:identity]].',
      java: '`==` on objects (reference equality)',
      example: String.raw`a = [1, 2]
b = a
c = [1, 2]
print(a == c, a is c, a is b)
value = None
print(value is None, value is not None)`,
      output: String.raw`True False True
True False` },
    { name: 'lambda', sig: 'lambda params: expression', docs: EXPR + 'lambda',
      summary: 'A small function with no name and one expression, for a `key=` or a callback. Anything longer deserves a `def`. Lesson: [[lesson:py-lambdas]].',
      java: '`x -> x * x`',
      example: String.raw`square = lambda x: x * x
print(square(5))
pairs = [(1, "b"), (2, "a")]
print(sorted(pairs, key=lambda p: p[1]))`,
      output: String.raw`25
[(2, 'a'), (1, 'b')]` },
    { name: 'not', sig: 'not x', docs: EXPR + 'boolean-operations',
      summary: '`True` when x is falsy. `not in` and `is not` are their own operators.',
      java: '`!`',
      example: String.raw`print(not True, not 0, not [], not "x")
print(3 not in [1, 2], "a" is not None)`,
      output: String.raw`False True True False
True True` },
    { name: 'or', sig: 'a or b', docs: EXPR + 'boolean-operations',
      summary: '`True` when either side is. It returns the first truthy value (or the last value), which makes `name or "guest"` a default.',
      java: '`||`; for a default, `Objects.requireNonNullElse(name, "guest")`',
      example: String.raw`name = "" or "guest"
print(name)
print(None or 0 or [] or "last")
print(1 or 2)`,
      output: String.raw`guest
last
1` },
    { name: 'pass', sig: 'pass', docs: SIMPLE + 'the-pass-statement',
      summary: 'Does nothing. A block cannot be empty in Python, so `pass` fills it.',
      java: 'An empty block, `{ }`',
      example: String.raw`class Placeholder:
    pass

def not_written_yet():
    pass

print(not_written_yet(), Placeholder.__name__)`,
      output: String.raw`None Placeholder` },
    { name: 'raise', sig: 'raise Error("message") from cause', docs: SIMPLE + 'the-raise-statement',
      summary: 'Raises an exception. `raise ... from e` keeps the original error as the cause; a bare `raise` inside `except` re-raises.',
      java: '`throw new IllegalArgumentException(...)`, and `new E(message, cause)`',
      example: String.raw`def set_age(age):
    if age < 0:
        raise ValueError(f"age cannot be negative: {age}")
    return age

try:
    set_age(-1)
except ValueError as e:
    print("ValueError:", e)
try:
    try:
        {}["key"]
    except KeyError as e:
        raise LookupError("config is incomplete") from e
except LookupError as e:
    print(e, "<- caused by", repr(e.__cause__))`,
      output: String.raw`ValueError: age cannot be negative: -1
config is incomplete <- caused by KeyError('key')` },
    { name: 'return', sig: 'return value', docs: SIMPLE + 'the-return-statement',
      summary: 'Ends the function and hands back a value; several values come back as one tuple. A function without `return` returns `None`.',
      java: '`return`; two values need a record or an array.',
      example: String.raw`def min_max(items):
    return min(items), max(items)     # several values: one tuple

low, high = min_max([4, 1, 9])
print(low, high)

def nothing():
    return

print(nothing())`,
      output: String.raw`1 9
None` },
    { name: 'while', sig: 'while condition: ... else: ...', docs: COMPOUND + 'the-while-statement',
      summary: 'Repeats while the condition is true. There is no `do ... while`: write `while True:` and `break`.',
      java: '`while`; `do { } while` becomes `while True:` with a `break`',
      example: String.raw`n = 5
while n > 0:
    n -= 2
print(n)
attempts = 0
while True:
    attempts += 1
    if attempts == 3:
        break
print(attempts)`,
      output: String.raw`-1
3` },
    { name: 'with', sig: 'with expression as name: ...', docs: COMPOUND + 'the-with-statement',
      summary: 'Runs a block inside a context manager, which always gets to clean up (close the file, release the lock), even after an error.',
      java: 'try-with-resources, `try (var f = ...) { }`',
      example: String.raw`from contextlib import contextmanager

@contextmanager
def tag(name):
    print(f"<{name}>")
    yield
    print(f"</{name}>")

with tag("p"):
    print("hello")

with open("out.txt", "w", encoding="utf-8") as f:
    f.write("saved")
print(f.closed)`,
      output: String.raw`<p>
hello
</p>
True` },
    { name: 'yield', sig: 'yield value, yield from iterable', docs: SIMPLE + 'the-yield-statement',
      summary: 'Makes a function a generator: each `yield` hands out one value and pauses the function until the next one is asked for. Lesson: [[lesson:py-generators]].',
      java: 'An `Iterator` class that keeps its state in fields between `next()` calls.',
      example: String.raw`def countdown(n):
    while n > 0:
        yield n
        n -= 1

print(list(countdown(3)))
gen = countdown(2)
print(next(gen), next(gen))`,
      output: String.raw`[3, 2, 1]
2 1` },
    { name: 'match', title: 'match and case', covers: ['case', '_'], sig: 'match subject: case pattern: ...', docs: COMPOUND + 'the-match-statement',
      summary: 'Structural pattern matching (Python 3.10+): compares a value against shapes, binding names as it goes. `case _:` matches anything. `match`, `case` and `_` are soft keywords: still usable as names elsewhere. Lesson: [[lesson:py-match]].',
      java: 'A `switch` with record and type patterns (Java 21).',
      example: String.raw`def describe(command):
    match command.split():
        case ["go", direction]:
            return f"moving {direction}"
        case ["look"]:
            return "looking around"
        case ["quit" | "exit"]:
            return "bye"
        case _:
            return "unknown command"

for c in ["go north", "look", "exit", "dance"]:
    print(describe(c))`,
      output: String.raw`moving north
looking around
bye
unknown command` },
    { name: 'type', title: 'type (type aliases)', sig: 'type Name = annotation', docs: SIMPLE + 'the-type-statement',
      summary: 'Declares a type alias (Python 3.12+). A soft keyword: `type(x)` is still the built-in function.',
      java: 'No type aliases in Java.',
      example: String.raw`type Point = tuple[float, float]          # a type alias
type Matrix = list[list[float]]

def distance(a: Point, b: Point) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5

print(distance((0, 0), (3, 4)))
print(Point.__value__)
print(type(5).__name__)                   # still the built-in function too`,
      output: String.raw`5.0
tuple[float, float]
int` }
  ]);

  /* ---------------------------------------------------------------- operators */

  add('operators', 'op-', [
    { key: 'arithmetic', name: '+', title: 'Arithmetic: + - * / // % **', sig: 'a + b, a - b, a * b, a / b, a // b, a % b, a ** b', docs: EXPR + 'binary-arithmetic-operations',
      summary: '`/` always gives a float; `//` divides and rounds **down**; `%` takes the sign of the right side; `**` is power. `+` and `*` also join and repeat strings and lists. Methods: `__add__`, `__sub__`, `__mul__`, `__truediv__`, `__floordiv__`, `__mod__`, `__pow__`.',
      java: 'Java\'s `7 / 2` is 3 (whole numbers) and `-7 % 2` is -1; Python\'s `7 / 2` is 3.5 and `-7 % 2` is 1. Power is `Math.pow`.',
      example: String.raw`print(7 + 2, 7 - 2, 7 * 2, 7 / 2)
print(7 // 2, 7 % 2, 7 ** 2)
print(-7 // 2, -7 % 2)            # rounds down, not toward zero
print("ab" * 3, [0] * 3, "a" + "b")`,
      output: String.raw`9 5 14 3.5
3 1 49
-4 1
ababab [0, 0, 0] ab` },
    { key: 'comparison', name: '==', title: 'Comparison: == != < <= > >=', sig: 'a == b, a != b, a < b, a <= b, a > b, a >= b', docs: EXPR + 'comparisons',
      summary: '`==` compares values (it calls `__eq__`), for strings too. Comparisons chain: `1 < x < 10`. Strings, lists and tuples compare item by item. Methods: `__eq__`, `__ne__`, `__lt__`, `__le__`, `__gt__`, `__ge__`.',
      java: '`s.equals(t)` and `compareTo`. Java\'s `==` on objects is Python\'s `is`.',
      example: String.raw`x = 5
print(1 < x < 10, x == 5.0, "apple" < "banana", [1, 2] < [1, 3])
print((1, "b") < (1, "c"), "Z" < "a")`,
      output: String.raw`True True True True
True True` },
    { key: 'bitwise', name: '&', title: 'Bitwise: & | ^ ~ << >>', sig: 'a & b, a | b, a ^ b, ~a, a << n, a >> n', docs: EXPR + 'binary-bitwise-operations',
      summary: 'Work on the bits of integers; on sets, `&` `|` `^` are intersection, union and symmetric difference. Methods: `__and__`, `__or__`, `__xor__`, `__invert__`, `__lshift__`, `__rshift__`.',
      java: 'The same, plus `>>>`, which Python does not need: its ints have no fixed width.',
      example: String.raw`a, b = 0b1100, 0b1010
print(a & b, a | b, a ^ b, ~a)
print(1 << 4, 256 >> 2)
print(bin(a & b))
READ, WRITE = 1, 2
perms = READ | WRITE
print(bool(perms & WRITE))`,
      output: String.raw`8 14 6 -13
16 64
0b1000
True` },
    { key: 'assignment', name: '=', title: 'Assignment: = += -= and unpacking', sig: 'a = b, a += b, a, b = b, a, first, *rest = items', docs: SIMPLE + 'assignment-statements',
      summary: '`=` ties a name to an object (it never copies). `x += 1` and the other compound forms change a list in place but make a new int or string. Unpacking assigns several names at once; `*rest` collects the remainder. Methods: `__iadd__` and friends.',
      java: 'The same compound operators; no unpacking and no swap without a temporary variable.',
      example: String.raw`a = b = 0
x, y = 1, 2
x, y = y, x               # swap, no temporary variable
total = 10
total += 5
total //= 4
first, *rest = [1, 2, 3, 4]
print(a, b, x, y, total, first, rest)`,
      output: String.raw`0 0 2 1 3 1 [2, 3, 4]` },
    { key: 'walrus', name: ':=', title: 'The walrus operator :=', sig: '(name := expression)', docs: EXPR + 'assignment-expressions',
      summary: 'Assigns and gives the value in the same expression, so a value can be tested and kept at once. Lesson: [[lesson:py-walrus-slots]].',
      java: 'An assignment used as an expression: `if ((line = reader.readLine()) != null)`',
      example: String.raw`import re

if (m := re.search(r"\d+", "order 66 shipped")):
    print("found", m.group())
data = [4, 9, 2]
if (n := len(data)) > 2:
    print(f"{n} items")`,
      output: String.raw`found 66
3 items` },
    { key: 'conditional', name: 'if-else', title: 'Conditional expression: a if cond else b', sig: 'value_if_true if condition else value_if_false', docs: EXPR + 'conditional-expressions',
      summary: 'Picks one of two values. The condition sits in the middle, which reads like English.',
      java: '`condition ? a : b`',
      example: String.raw`age = 20
status = "adult" if age >= 18 else "minor"
print(status)
print("even" if 7 % 2 == 0 else "odd")`,
      output: String.raw`adult
odd` },
    { key: 'indexing', name: '[]', title: 'Indexing and slicing: [i] and [start:stop:step]', sig: 'seq[i], seq[-1], seq[start:stop:step]', docs: EXPR + 'slicings',
      summary: 'Indexes count from 0, and negative ones from the end. A slice takes a range and never fails for out-of-range ends. Methods: `__getitem__`, `__setitem__`. Lesson: [[lesson:py-slicing]].',
      java: '`s.charAt(0)`, `s.substring(1, 4)`, `list.get(i)`, `list.subList(1, 4)`',
      example: String.raw`s = "python"
print(s[0], s[-1], s[1:4], s[::-1], s[::2])
grid = [[1, 2], [3, 4]]
print(grid[1][0])`,
      output: String.raw`p n yth nohtyp pto
3` },
    { key: 'unpacking', name: '*', title: 'Unpacking: *iterable and **mapping', sig: 'f(*args, **kwargs), [*a, *b], {**d1, **d2}', docs: EXPR + 'calls',
      summary: 'In a call, `*` spreads a list into positional arguments and `**` a dict into keyword arguments; in a list or dict display they merge. Lesson: [[lesson:py-args-kwargs]].',
      java: 'Only varargs: passing an array to `f(String... args)`.',
      example: String.raw`def area(w, h):
    return w * h

size = [3, 4]
opts = {"w": 2, "h": 5}
print(area(*size), area(**opts))
merged = {**opts, "h": 9}
print([*size, *"ab"], merged)`,
      output: String.raw`12 10
[3, 4, 'a', 'b'] {'w': 2, 'h': 9}` },
    { key: 'matmul', name: '@', title: 'Matrix multiplication: @', sig: 'a @ b', docs: EXPR + 'binary-arithmetic-operations',
      summary: 'Reserved for matrix multiplication (NumPy uses it); no built-in type supports it. A class opts in with `__matmul__`. (`@` above a `def` is a decorator, which is something else.)',
      java: 'None.',
      example: String.raw`class Matrix:
    def __init__(self, rows):
        self.rows = rows

    def __matmul__(self, other):
        cols = list(zip(*other.rows))
        return Matrix([[sum(a * b for a, b in zip(r, c)) for c in cols] for r in self.rows])

m = Matrix([[1, 2], [3, 4]]) @ Matrix([[0, 1], [1, 0]])
print(m.rows)`,
      output: String.raw`[[2, 1], [4, 3]]` },
    { key: 'percent', name: '%', title: '% formatting (the old way)', sig: '"%s is %d" % (name, age)', docs: 'https://docs.python.org/3/library/stdtypes.html#printf-style-string-formatting',
      summary: 'On a string, `%` fills `%s`, `%d` and `%.2f` placeholders, C style. Older code and `logging` messages use it; new code uses f-strings.',
      java: '`String.format("%s is %d", name, age)`',
      example: String.raw`print("%s is %d years old" % ("Asha", 29))
print("%.2f" % 3.14159, "%5s|" % "ab")
print(f"{'Asha'} is {29} years old")`,
      output: String.raw`Asha is 29 years old
3.14    ab|
Asha is 29 years old` },
    { key: 'boolean', name: 'and-or-not', title: 'Boolean operators: and, or, not', sig: 'a and b, a or b, not a', docs: EXPR + 'boolean-operations',
      summary: 'Words, not symbols. `and` and `or` stop as soon as the answer is known and return one of their operands, not necessarily `True` or `False`.',
      java: '`&&`, `||`, `!`, which always give a boolean',
      example: String.raw`def check(n):
    print("checked", n)
    return n > 0

print(check(-1) and check(5))       # check(5) never runs
print([] or "default", 0 or None)`,
      output: String.raw`checked -1
False
default None` },
    { key: 'precedence', name: 'precedence', title: 'Operator precedence', sig: '** > unary - > * / // % > + - > comparisons > not > and > or', docs: EXPR + 'operator-precedence',
      summary: 'Which operator binds first. `**` binds tighter than a minus sign in front (`-2 ** 2` is -4), and `not` is lower than comparisons. When in doubt, add brackets.',
      java: 'Much the same, but Java has no `**` and puts `!` above the comparisons.',
      example: String.raw`print(2 + 3 * 4, (2 + 3) * 4)
print(-2 ** 2, (-2) ** 2)
print(not 1 == 2, 1 < 2 == 2)`,
      output: String.raw`14 20
-4 4
True True` }
  ]);

  /* ---------------------------------------------------------------- special methods */

  add('dunders', 'dunder-', [
    { name: '__init__', sig: 'def __init__(self, ...)', summary: 'Sets up a new object: Python has already made it and passes it in as `self`. It returns nothing.', java: 'A constructor.',
      example: String.raw`class Point:
    def __init__(self, x=0, y=0):
        self.x = x
        self.y = y

p = Point(3, 4)
print(p.x, p.y, Point().x)`,
      output: String.raw`3 4 0` },
    { name: '__new__', sig: 'def __new__(cls, ...)', summary: 'Makes the object, before `__init__` runs. Needed only to control creation: singletons, or subclasses of immutable types such as `str`.', java: 'No equivalent; a private constructor with a static factory.',
      example: String.raw`class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

print(Singleton() is Singleton())

class Upper(str):
    def __new__(cls, text):
        return super().__new__(cls, text.upper())     # a str cannot change after it is made

print(Upper("hello"))`,
      output: String.raw`True
HELLO` },
    { name: '__repr__', sig: 'def __repr__(self) -> str', summary: 'The developer\'s description: what the prompt, the debugger and lists show. Make it look like the code that builds the object. Lesson: [[lesson:py-equality]].', java: '`toString()`',
      example: String.raw`class Money:
    def __init__(self, amount, currency):
        self.amount, self.currency = amount, currency

    def __repr__(self):
        return f"Money({self.amount!r}, {self.currency!r})"

m = Money(5, "EUR")
print(repr(m))
print([m])            # containers show their items' repr`,
      output: String.raw`Money(5, 'EUR')
[Money(5, 'EUR')]` },
    { name: '__str__', sig: 'def __str__(self) -> str', summary: 'The readable text, for `print()`, `str()` and f-strings. Without it, `__repr__` is used.', java: '`toString()`',
      example: String.raw`class Money:
    def __init__(self, amount, currency):
        self.amount, self.currency = amount, currency

    def __repr__(self):
        return f"Money({self.amount!r}, {self.currency!r})"

    def __str__(self):
        return f"{self.amount:.2f} {self.currency}"

m = Money(5, "EUR")
print(m)
print(f"{m} / {m!r}")`,
      output: String.raw`5.00 EUR
5.00 EUR / Money(5, 'EUR')` },
    { name: '__eq__', sig: 'def __eq__(self, other) -> bool', summary: 'What `==` means. Return `NotImplemented` for types you do not handle. Defining it sets `__hash__` to `None`: the objects become unhashable until you write `__hash__` too.', java: '`equals()`',
      example: String.raw`class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return (self.x, self.y) == (other.x, other.y)

print(Point(1, 2) == Point(1, 2), Point(1, 2) != Point(2, 1), Point(1, 2) == "x")
print(Point.__hash__)          # defining __eq__ made instances unhashable`,
      output: String.raw`True True False
None` },
    { name: '__hash__', sig: 'def __hash__(self) -> int', summary: 'The number sets and dict keys use. Equal objects must hash equal: hash a tuple of the same fields `__eq__` compares, and do not change those fields afterwards.', java: '`hashCode()`',
      example: String.raw`class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)

    def __hash__(self):
        return hash((self.x, self.y))      # the same fields as __eq__

seen = {Point(1, 2), Point(1, 2), Point(3, 4)}
print(len(seen), Point(1, 2) in seen)`,
      output: String.raw`2 True` },
    { name: '__lt__', title: '__lt__ and the other comparisons', covers: ['__le__', '__gt__', '__ge__', '__ne__'], sig: 'def __lt__(self, other) -> bool',
      summary: '`<` calls `__lt__`, and so do `sorted()`, `min()` and `max()`. `@functools.total_ordering` fills in `<=`, `>` and `>=` from `__eq__` and `__lt__`. `!=` is worked out from `__eq__`.', java: '`Comparable.compareTo`',
      example: String.raw`from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, text):
        self.parts = tuple(int(p) for p in text.split("."))

    def __eq__(self, other):
        return self.parts == other.parts

    def __lt__(self, other):
        return self.parts < other.parts

    def __repr__(self):
        return ".".join(map(str, self.parts))

versions = [Version("1.10"), Version("1.2"), Version("1.9.1")]
print(sorted(versions), Version("2.0") >= Version("1.99"))`,
      output: String.raw`[1.2, 1.9.1, 1.10] True` },
    { name: '__bool__', sig: 'def __bool__(self) -> bool', summary: 'The object\'s truth value in `if obj:`. Without it, `__len__` is used, and without that the object is always true.', java: 'None: Java needs an explicit `isEmpty()`.',
      example: String.raw`class Cart:
    def __init__(self):
        self.items = []

    def __bool__(self):
        return bool(self.items)

cart = Cart()
print("full" if cart else "empty")
cart.items.append("pen")
print("full" if cart else "empty")`,
      output: String.raw`empty
full` },
    { name: '__len__', sig: 'def __len__(self) -> int', summary: 'What `len(obj)` returns; an empty object (length 0) is also falsy.', java: '`size()`',
      example: String.raw`class Playlist:
    def __init__(self, songs):
        self.songs = list(songs)

    def __len__(self):
        return len(self.songs)

p = Playlist(["a", "b", "c"])
print(len(p), bool(p), bool(Playlist([])))`,
      output: String.raw`3 True False` },
    { name: '__getitem__', title: '__getitem__, __setitem__ and __delitem__', covers: ['__setitem__', '__delitem__'], sig: 'def __getitem__(self, key)',
      summary: '`obj[key]`, `obj[key] = value` and `del obj[key]`. An object with `__getitem__` and `__len__` already works in a `for` loop.', java: '`get(key)`, `put(key, value)`, `remove(key)`',
      example: String.raw`class Row:
    def __init__(self, **cells):
        self.cells = cells

    def __getitem__(self, key):
        return self.cells[key]

    def __setitem__(self, key, value):
        self.cells[key] = value

    def __delitem__(self, key):
        del self.cells[key]

r = Row(name="Asha", city="Pune")
r["city"] = "Delhi"
del r["name"]
print(r["city"], r.cells)`,
      output: String.raw`Delhi {'city': 'Delhi'}` },
    { name: '__contains__', sig: 'def __contains__(self, item) -> bool', summary: 'What `item in obj` means. Without it, `in` loops over the object.', java: '`contains()`',
      example: String.raw`class Range:
    def __init__(self, low, high):
        self.low, self.high = low, high

    def __contains__(self, value):
        return self.low <= value <= self.high

working_hours = Range(9, 17)
print(12 in working_hours, 20 in working_hours, 20 not in working_hours)`,
      output: String.raw`True False True` },
    { name: '__iter__', title: '__iter__ and __next__', covers: ['__next__'], sig: 'def __iter__(self), def __next__(self)',
      summary: '`__iter__` returns an iterator; the iterator\'s `__next__` gives the next item or raises `StopIteration`. A generator method is the easy way. Lesson: [[lesson:py-iterators]].', java: '`Iterable.iterator()`, `Iterator.next()` and `hasNext()`',
      example: String.raw`class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1

print(list(Countdown(3)))
for n in Countdown(2):
    print(n)`,
      output: String.raw`[3, 2, 1]
2
1` },
    { name: '__call__', sig: 'def __call__(self, ...)', summary: 'Makes the object callable like a function: `obj(5)`.', java: 'A functional interface\'s `apply`.',
      example: String.raw`class Multiplier:
    def __init__(self, factor):
        self.factor = factor

    def __call__(self, x):
        return x * self.factor

triple = Multiplier(3)
print(triple(5), callable(triple), list(map(triple, [1, 2])))`,
      output: String.raw`15 True [3, 6]` },
    { name: '__enter__', title: '__enter__ and __exit__', covers: ['__exit__'], sig: 'def __enter__(self), def __exit__(self, exc_type, exc, tb)',
      summary: 'Make a class usable in `with`: `__enter__` runs at the start (its result is the `as` name), `__exit__` at the end, error or not. Returning `True` from `__exit__` would swallow the error. Lesson: [[lesson:py-context-managers]].', java: '`AutoCloseable.close()` in try-with-resources',
      example: String.raw`import time

class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc, tb):
        self.seconds = time.perf_counter() - self.start
        print("block finished; error:", exc_type.__name__ if exc_type else None)
        return False                    # let any error carry on

with Timer() as t:
    sum(range(1000))
print(t.seconds >= 0)`,
      output: String.raw`block finished; error: None
True` },
    { name: '__add__', title: '__add__ and the arithmetic methods', covers: ['__radd__', '__iadd__', '__sub__', '__mul__', '__rmul__', '__truediv__', '__floordiv__', '__mod__', '__pow__', '__matmul__'], sig: 'def __add__(self, other)',
      summary: '`a + b` calls `a.__add__(b)`; if that returns `NotImplemented`, Python tries `b.__radd__(a)`. `+=` tries `__iadd__` first. Likewise `__sub__`, `__mul__`, `__truediv__` and the rest. Lesson: [[lesson:py-special-methods]].', java: 'None: Java has no operator overloading (`BigDecimal.add`).',
      example: String.raw`class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __mul__(self, k):
        return Vector(self.x * k, self.y * k)

    __rmul__ = __mul__                  # 3 * v: int cannot, so Python asks v

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

v = Vector(1, 2)
print(v + Vector(3, 4), v * 2, 3 * v)`,
      output: String.raw`Vector(4, 6) Vector(2, 4) Vector(3, 6)` },
    { name: '__neg__', title: '__neg__, __abs__ and the other unary methods', covers: ['__abs__', '__pos__', '__invert__'], sig: 'def __neg__(self)',
      summary: '`-obj`, `abs(obj)`, `+obj` and `~obj`.', java: 'Methods such as `negate()` and `abs()`.',
      example: String.raw`class Money:
    def __init__(self, cents):
        self.cents = cents

    def __neg__(self):
        return Money(-self.cents)

    def __abs__(self):
        return Money(abs(self.cents))

    def __repr__(self):
        return f"Money({self.cents})"

debt = -Money(500)
print(debt, abs(debt))`,
      output: String.raw`Money(-500) Money(500)` },
    { name: '__getattr__', title: '__getattr__ and attribute access', covers: ['__setattr__', '__getattribute__', '__delattr__'], sig: 'def __getattr__(self, name)',
      summary: '`__getattr__` runs only when normal lookup finds nothing: good for proxies and config objects. `__getattribute__` runs for **every** lookup; `__setattr__` and `__delattr__` for assigning and deleting.', java: 'None (dynamic proxies come closest).',
      example: String.raw`class Config:
    def __init__(self, values):
        self._values = values

    def __getattr__(self, name):            # only when normal lookup fails
        try:
            return self._values[name]
        except KeyError:
            raise AttributeError(name) from None

c = Config({"host": "localhost", "port": 8080})
print(c.host, c.port, hasattr(c, "user"))`,
      output: String.raw`localhost 8080 False` },
    { name: '__format__', sig: 'def __format__(self, spec) -> str', summary: 'What the part after `:` in an f-string means for your class: `f"{t:F}"` calls `t.__format__("F")`.', java: '`java.util.Formattable`',
      example: String.raw`class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    def __format__(self, spec):
        if spec == "F":
            return f"{self.celsius * 9 / 5 + 32:.1f} F"
        return f"{self.celsius:.1f} C"

t = Temperature(21.5)
print(f"{t} = {t:F}")`,
      output: String.raw`21.5 C = 70.7 F` },
    { name: '__del__', sig: 'def __del__(self)', summary: 'Runs when the object is about to be destroyed. When that happens is not guaranteed in general: use `with` for clean-up that must happen.', java: '`finalize()`, deprecated for the same reason; use try-with-resources.',
      example: String.raw`class Resource:
    def __init__(self, name):
        self.name = name

    def __del__(self):
        print("cleaning up", self.name)

r = Resource("temp file")
del r                  # the last reference is gone: CPython destroys it now
print("after del")`,
      output: String.raw`cleaning up temp file
after del` },
    { name: '__init_subclass__', sig: 'def __init_subclass__(cls, **kwargs)', summary: 'Runs on the parent class each time a subclass is defined: an easy way to register plugins. Lesson: [[lesson:py-metaclasses]].', java: '`ServiceLoader`, or classpath scanning in Spring.',
      example: String.raw`class Plugin:
    registry = {}

    def __init_subclass__(cls, name, **kwargs):
        super().__init_subclass__(**kwargs)
        Plugin.registry[name] = cls

class CsvExport(Plugin, name="csv"):
    pass

class JsonExport(Plugin, name="json"):
    pass

print({k: v.__name__ for k, v in Plugin.registry.items()})`,
      output: String.raw`{'csv': 'CsvExport', 'json': 'JsonExport'}` },
    { name: '__slots__', sig: '__slots__ = ("x", "y")', summary: 'Fixes the attributes an object may have: no per-object `__dict__`, so less memory, and a typo in an attribute name is an error. Lesson: [[lesson:py-walrus-slots]].', java: 'How every Java object works: its fields are fixed.',
      docs: 'https://docs.python.org/3/reference/datamodel.html#slots',
      example: String.raw`class Point:
    __slots__ = ("x", "y")              # fixed attributes: no __dict__

    def __init__(self, x, y):
        self.x, self.y = x, y

p = Point(1, 2)
try:
    p.z = 3
except AttributeError as e:
    print("AttributeError:", e)
print(hasattr(p, "__dict__"))`,
      output: String.raw`AttributeError: 'Point' object has no attribute 'z' and no __dict__ for setting new attributes
False` },
    { name: '__dict__', title: '__dict__ and __class__', covers: ['__class__'], sig: 'obj.__dict__, obj.__class__',
      summary: 'An object\'s own attributes, as a dict, and the class it belongs to. `vars(obj)` and `type(obj)` are the polite ways to ask.', java: 'Reflection: `getClass().getDeclaredFields()`.',
      docs: 'https://docs.python.org/3/reference/datamodel.html#object.__dict__',
      example: String.raw`class User:
    role = "member"

    def __init__(self, name):
        self.name = name

u = User("Asha")
print(u.__dict__)
print(u.__class__.__name__, "role" in User.__dict__)`,
      output: String.raw`{'name': 'Asha'}
User True` },
    { name: '__name__', title: '__name__ and "__main__"', covers: ['__main__'], sig: 'if __name__ == "__main__":',
      summary: 'A module\'s name, which is `"__main__"` when the file is run as the program rather than imported. Functions and classes have a `__name__` too. Lesson: [[lesson:py-modules]].', java: '`public static void main(String[] args)`',
      docs: 'https://docs.python.org/3/library/__main__.html',
      example: String.raw`def helper():
    pass

print(__name__)
print(helper.__name__, int.__name__)
if __name__ == "__main__":
    print("run as a program, not imported")`,
      output: String.raw`__main__
helper int
run as a program, not imported` },
    { name: '__missing__', sig: 'def __missing__(self, key)', summary: 'In a `dict` subclass: what `d[key]` gives for a missing key, instead of `KeyError`. (`get()` does not call it.)', java: '`map.getOrDefault(key, ...)`',
      example: String.raw`class Defaults(dict):
    def __missing__(self, key):
        return f"<no {key}>"

d = Defaults(name="Asha")
print(d["name"], d["email"], d.get("email"))`,
      output: String.raw`Asha <no email> None` },
    { name: '__post_init__', sig: 'def __post_init__(self)', summary: 'In a dataclass: runs right after the generated `__init__`, to check or derive fields. Lesson: [[lesson:py-dataclasses-enums]].', java: 'A record\'s compact constructor.',
      docs: 'https://docs.python.org/3/library/dataclasses.html#post-init-processing',
      example: String.raw`from dataclasses import dataclass

@dataclass
class Order:
    item: str
    qty: int

    def __post_init__(self):
        if self.qty <= 0:
            raise ValueError("qty must be positive")

print(Order("pen", 2))
try:
    Order("pen", 0)
except ValueError as e:
    print("ValueError:", e)`,
      output: String.raw`Order(item='pen', qty=2)
ValueError: qty must be positive` }
  ]);
})(window.PYLT);
