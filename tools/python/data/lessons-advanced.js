/*
 * Lessons, track 7: Advanced Python. The lesson shape is described at the top of
 * data/lessons-basics.js; every ```python block must run (tests/test_content.py runs them all).
 * Threads and processes need the server (runtimes: ['server']): a browser gives Python neither.
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  function fence(lang, src) { return '```' + lang + '\n' + src.replace(/^\n+|\s+$/g, '') + '\n```'; }
  function py(src) { return fence('python', src); }

  /* Python put in front of some checks. */

  // py-performance: objects that count how often == is called on them
  var COUNTED = String.raw`
class Item:
    eq_calls = 0

    def __init__(self, v):
        self.v = v

    def __eq__(self, other):
        Item.eq_calls += 1
        return isinstance(other, Item) and self.v == other.v

    def __hash__(self):
        return hash(self.v)
`;

  // py-asyncio: run limited() with fetch replaced by one that counts how many run at once
  var TRACKED = String.raw`
import asyncio

state = {"now": 0, "most": 0}
g = limited.__globals__
real = g["fetch"]


async def tracked(name, delay):
    state["now"] += 1
    state["most"] = max(state["most"], state["now"])
    try:
        return await real(name, delay)
    finally:
        state["now"] -= 1
`;

  L.push(
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'py-match', track: 'advanced',
      title: 'Pattern matching: match and case',
      summary: 'match compares a value with patterns and takes it apart: literals and |, guards, sequences with *rest, dicts from JSON, objects by their attributes. No fall-through, no exhaustiveness check, and the bare-name trap.',
      keywords: ['match', 'case', 'pattern matching', 'switch', 'structural pattern matching', 'destructuring', 'guard', 'wildcard', '__match_args__', 'record pattern', 'sealed', 'instanceof', 'soft keyword'],
      docs: 'https://docs.python.org/3/tutorial/controlflow.html#match-statements',
      body: [
        '`match` (Python 3.10) compares one value with a list of **patterns**, top to bottom, and runs the first `case` that fits. It starts out like Java\'s `switch`, but a pattern can also take the value apart: a list by its items, a dict by its keys, an object by its attributes, giving names to the parts as it goes. Java 21\'s pattern matching for `switch`, with record patterns, is the same idea.',
        py(String.raw`
def http_status(code):
    match code:
        case 200 | 201 | 204:              # | means "or"
            return "success"
        case 301 | 302:
            return "redirect"
        case 404:
            return "not found"
        case n if 500 <= n < 600:          # a name with a guard: any value, when the if is true
            return f"server error {n}"
        case _:                            # anything else: Java's default
            return "unknown"

print([http_status(c) for c in (201, 404, 503, 999)])`),
        'There is no fall-through and no `break`: one case runs, then the `match` is over. If no case fits and there is no `case _`, nothing happens at all. (Java checks that a `switch` over a sealed type covers every case; Python does not.)',
        '## Taking a list apart',
        'A sequence pattern matches a list or tuple of the right length, item by item. Names capture items; `*rest` takes any number:',
        py(String.raw`
def parse(command):
    match command.split():
        case ["quit"] | ["exit"]:
            return "bye"
        case ["go", direction]:
            return f"going {direction}"
        case ["take", *items] if items:
            return "taking " + ", ".join(items)
        case []:
            return "say something"
        case _:
            return f"unknown: {command}"

for c in ["go north", "take lamp key", "quit", "", "dance"]:
    print(repr(c), "->", parse(c))`),
        '## Dicts, such as parsed JSON',
        'A mapping pattern checks the keys it names and ignores any others. `str(k)` checks the type and captures the value:',
        py(String.raw`
def handle(event):
    match event:
        case {"type": "click", "x": x, "y": y}:
            return f"click at ({x}, {y})"
        case {"type": "key", "key": "q" | "Q"}:
            return "quit"
        case {"type": "key", "key": str(k)}:
            return f"key {k}"
        case {"type": t}:
            return f"ignored {t}"

print(handle({"type": "click", "x": 3, "y": 4, "button": 1}))     # extra keys are fine
print(handle({"type": "key", "key": "Q"}))
print(handle({"type": "key", "key": "a"}))
print(handle({"type": "scroll"}))`),
        '## Objects by their attributes',
        'A class pattern checks `isinstance` and then the attributes. Dataclasses also allow positional patterns, `Point(x, y)`, through the `__match_args__` they define:',
        py(String.raw`
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

@dataclass
class Circle:
    center: Point
    radius: float

def describe(shape):
    match shape:
        case Point(x=0, y=0):
            return "the origin"
        case Point(x=0, y=y):
            return f"on the y axis at {y}"
        case Point(x, y):
            return f"point ({x}, {y})"
        case Circle(center=Point(x=0, y=0), radius=r):
            return f"circle of radius {r} around the origin"
        case Circle():
            return "some other circle"

for s in [Point(0, 0), Point(0, 5), Point(2, 3), Circle(Point(0, 0), 1.5), Circle(Point(1, 1), 2)]:
    print(describe(s))`),
        '## The trap: a bare name captures',
        'In a pattern, a plain name is not a value to compare with: it is a new variable that captures anything. So `case RED:` matches every value. Compare with a dotted name, such as an enum member:',
        py(String.raw`
from enum import Enum

RED = "red"

def wrong(color):
    match color:
        case RED:                 # binds ANY value to a new local name RED
            return f"matched {RED!r}"

class Color(Enum):
    RED = "red"
    BLUE = "blue"

def right(color):
    match color:
        case Color.RED:           # a dotted name is a value: compared with ==
            return "stop"
        case Color.BLUE:
            return "calm"

print(wrong("blue"), right(Color.BLUE))`),
        '| Java 21 | Python |\n|---|---|\n| `case 1, 2 ->` | `case 1 \\| 2:` |\n| `default ->` | `case _:` |\n| `case Integer i when i > 5 ->` | `case int(i) if i > 5:` |\n| `case Point(var x, var y) ->` (a record pattern) | `case Point(x, y):` |\n| `break`, `yield` | nothing: one case runs, no fall-through |\n| exhaustive over a sealed interface | no check: a value no case fits does nothing |',
        '`match` and `case` are **soft keywords**: they are keywords only at the start of these statements, so older code with a variable named `match` still runs.'
      ].join('\n\n'),
      java: 'It is Java 21\'s `switch` with patterns, with three differences. There is no fall-through and no `break`. Python never checks that every case is covered: an unmatched value simply runs no case. And a bare name in a pattern **captures** rather than compares, so constants must be dotted names (`Color.RED`) or literals. In return, `match` takes apart lists and dicts too, not only records, which makes it handy for JSON and for parsing commands.',
      example: {
        code: String.raw`from dataclasses import dataclass


@dataclass
class Deposit:
    amount: float


@dataclass
class Withdraw:
    amount: float


@dataclass
class Transfer:
    to: str
    amount: float


def apply(balance, op):
    match op:
        case Deposit(amount) if amount > 0:
            return balance + amount
        case Withdraw(amount) if amount <= balance:
            return balance - amount
        case Withdraw(amount):
            print(f"  refused: cannot withdraw {amount} from {balance}")
            return balance
        case Transfer(to="savings", amount=amount):
            print(f"  moved {amount} to savings")
            return balance - amount
        case {"op": "deposit", "amount": float(amount) | int(amount)}:    # from JSON
            return balance + amount
        case _:
            raise ValueError(f"unknown operation: {op!r}")


balance = 100
for op in [Deposit(50), Withdraw(500), Withdraw(30), Transfer("savings", 20), {"op": "deposit", "amount": 5}]:
    balance = apply(balance, op)
    print(type(op).__name__, "->", balance)
`,
        note: 'The two `Withdraw` cases are tried in order: the guard decides which one runs.'
      },
      challenge: {
        title: 'A calculator and a router',
        task: [
          '1. `evaluate(expr)` works out a small expression tree. A number is its own value; `("+", a, b)`, `("-", a, b)` and `("*", a, b)` combine the values of `a` and `b`, which are trees too; `("neg", a)` is minus `a`. Anything else raises `ValueError`.',
          '2. `route(method, path)` returns the handler for a request, the way a Spring controller maps URLs: `GET /users` gives `"list users"`, `GET /users/42` gives `"show user 42"`, `POST /users` gives `"create user"`, and `DELETE /users/42` gives `"delete user 42"`, but only when the id is all digits. Anything else gives `"404"`. Split the path with `path.strip("/").split("/")`.',
          '3. Write both with `match`, using sequence patterns.'
        ].join('\n\n'),
        starter: String.raw`def evaluate(expr):
    if isinstance(expr, (int, float)):
        return expr
    if expr[0] == "+":
        return evaluate(expr[1]) + evaluate(expr[2])
    return 0


def route(method, path):
    if method == "GET" and path == "/users":
        return "list users"
    return "404"


print(evaluate(("+", 2, ("+", 1, 1))), route("GET", "/users"))
`,
        solution: String.raw`def evaluate(expr):
    match expr:
        case int() | float():
            return expr
        case ("+", a, b):
            return evaluate(a) + evaluate(b)
        case ("-", a, b):
            return evaluate(a) - evaluate(b)
        case ("*", a, b):
            return evaluate(a) * evaluate(b)
        case ("neg", a):
            return -evaluate(a)
        case _:
            raise ValueError(f"not an expression: {expr!r}")


def route(method, path):
    match method, path.strip("/").split("/"):
        case "GET", ["users"]:
            return "list users"
        case "GET", ["users", user_id]:
            return f"show user {user_id}"
        case "POST", ["users"]:
            return "create user"
        case "DELETE", ["users", user_id] if user_id.isdigit():
            return f"delete user {user_id}"
        case _:
            return "404"


print(evaluate(("*", ("+", 1, 2), ("neg", 4))), route("DELETE", "/users/7"))
`,
        hints: [
          '`case int() | float():` matches any number. `case ("+", a, b):` matches a 3-item tuple starting with `"+"` and names the other two; call `evaluate` on them.',
          'A sequence pattern never matches a string, so `"x"` falls through to `case _:`, where you raise `ValueError`.',
          'Match on a tuple of both values: `match method, path.strip("/").split("/"):` then `case "GET", ["users", user_id]:`. A guard, `if user_id.isdigit()`, limits the `DELETE` case.'
        ],
        checks: [
          { label: 'Numbers, `+`, `-` and `*`', code: 'assert evaluate(5) == 5 and evaluate(2.5) == 2.5\nassert evaluate(("+", 2, 3)) == 5\nassert evaluate(("-", 1, 3)) == -2\nassert evaluate(("*", 4, 2.5)) == 10.0' },
          { label: 'Nested trees and `neg`', code: 'assert evaluate(("*", ("+", 1, 2), ("neg", 4))) == -12\nassert evaluate(("neg", ("neg", 7))) == 7' },
          { label: 'Anything else raises `ValueError`', code: 'for bad in [("/", 1, 2), ("neg",), ("+", 1), "x", None]:\n    try:\n        evaluate(bad)\n    except ValueError:\n        pass\n    else:\n        raise AssertionError(f"evaluate({bad!r}) should raise ValueError")' },
          { label: 'The four routes', code: 'assert route("GET", "/users") == "list users"\nassert route("GET", "/users/42") == "show user 42"\nassert route("POST", "/users") == "create user"\nassert route("DELETE", "/users/42") == "delete user 42"' },
          { label: 'Everything else is `"404"`', code: 'for method, path in [("DELETE", "/users/abc"), ("GET", "/orders"), ("PUT", "/users/1"), ("GET", "/users/1/extra"), ("POST", "/users/5")]:\n    assert route(method, path) == "404", f"route({method!r}, {path!r}) gave {route(method, path)!r}"' },
          { label: 'Both use `match` with sequence patterns', code: 'for name in ("evaluate", "route"):\n    fn = next(n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef) and n.name == name)\n    kinds = {type(n).__name__ for n in ast.walk(fn)}\n    assert "Match" in kinds and "MatchSequence" in kinds, f"{name} should use match with a sequence pattern such as case (\\"+\\", a, b):"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'py-walrus-slots', track: 'advanced',
      title: 'The walrus operator and __slots__',
      summary: 'The := operator, which assigns inside an expression: in if, in while loops that read until empty, and in comprehensions that compute a value once. Then __slots__: fixed attributes, no __dict__, less memory, and a typo that raises instead of passing silently.',
      keywords: ['walrus', ':=', 'assignment expression', 'named expression', '__slots__', 'slots', 'memory', '__dict__', 'attribute', 'dataclass slots', 'while loop', 'readline'],
      docs: 'https://docs.python.org/3/reference/expressions.html#assignment-expressions',
      body: [
        'In Java an assignment is also an expression, so `while ((line = reader.readLine()) != null)` reads and tests at once. Python\'s `=` is a statement and cannot be used that way, but since 3.8 the **walrus operator** `:=` (look at it sideways) assigns and gives the value back, inside an expression:',
        py(String.raw`
import re

line = "ERROR 2026-10-10 disk full"
if (m := re.match(r"(\w+) (\S+) (.*)", line)):
    level, day, message = m.groups()
    print(level, "|", message)

data = [3, 8, 12, 5]
if (n := len(data)) > 3:
    print(f"{n} items is too many")`),
        '## Read until there is nothing left',
        py(String.raw`
import io

stream = io.StringIO("abcdefghij")
while (chunk := stream.read(4)):          # read, test and keep it, in one line
    print(chunk)`),
        '## Compute once in a comprehension',
        'A filter that needs a computed value would otherwise compute it twice: once to test it, once to keep it:',
        py(String.raw`
def slow_square(x):
    print("  computing", x)
    return x * x

nums = [1, 4, 6]
print([y for x in nums if (y := slow_square(x)) > 10])`),
        'Keep `:=` for these shapes and put it in brackets. It cannot stand alone as a statement (`x := 5` is a syntax error), which keeps people from using it where `=` is clearer.',
        '## __slots__: a fixed set of attributes',
        'An ordinary object keeps its attributes in a dict of its own, `__dict__`. That is flexible: any attribute can be added at any time, including a misspelt one, which Python accepts without a word. A class that lists its attributes in `__slots__` gets a fixed layout instead, like a Java class with fields: no `__dict__`, less memory, slightly faster access, and an `AttributeError` for a name that is not in the list.',
        py(String.raw`
class Plain:
    def __init__(self, x, y):
        self.x, self.y = x, y

class Slotted:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x, self.y = x, y

p, s = Plain(1, 2), Slotted(1, 2)
p.colour = "red"                     # a typo, or a new attribute: accepted
print(vars(p))
try:
    s.colour = "red"
except AttributeError as e:
    print("AttributeError:", e)
print(hasattr(p, "__dict__"), hasattr(s, "__dict__"))`),
        'The saving matters when there are many small objects. `tracemalloc` measures it on the Python running this page (the numbers differ between computers):',
        py(String.raw`
import tracemalloc

class Plain:
    def __init__(self, x, y):
        self.x, self.y = x, y

class Slotted:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x, self.y = x, y

def bytes_per_object(cls, n=50_000):
    tracemalloc.start()
    objects = [cls(1.5, 2.5) for _ in range(n)]
    size = tracemalloc.get_traced_memory()[0]
    tracemalloc.stop()
    return size // n

print("plain:  ", bytes_per_object(Plain), "bytes per object")
print("slotted:", bytes_per_object(Slotted), "bytes per object")`),
        'A dataclass gets slots with `@dataclass(slots=True)` (Python 3.10+). Two things to know: a subclass that does not declare `__slots__` itself gets a `__dict__` back, and an object with slots cannot take new attributes, which some libraries expect to do. [[explain:memory]] measures objects with and without slots side by side.'
      ].join('\n\n'),
      java: '`:=` gives Python what Java\'s assignment-as-expression gives, in the places it is useful: `while ((line = r.readLine()) != null)` becomes `while (line := r.readline()):`. `__slots__` gives a Python class what every Java class has: a fixed set of fields, decided by the class, with no way to add one to a single object at run time.',
      example: {
        code: String.raw`import re
from dataclasses import dataclass


@dataclass(slots=True)
class Hit:
    ip: str
    path: str
    status: int


LINE = re.compile(r'(\S+) "GET (\S+)" (\d{3})')
log = """10.0.0.1 "GET /home" 200
garbage
10.0.0.2 "GET /cart" 500
10.0.0.1 "GET /cart" 200"""

hits = [Hit(m[1], m[2], int(m[3])) for line in log.splitlines() if (m := LINE.match(line))]
print(hits)
if (errors := [h for h in hits if h.status >= 500]):
    print(len(errors), "error(s), first on", errors[0].path)
try:
    hits[0].methd = "GET"
except AttributeError as e:
    print("typo caught:", e)
`,
        note: 'Each line is matched once: `m` keeps the match for the `Hit(...)` part of the comprehension.'
      },
      challenge: {
        title: 'Slots and walruses',
        task: [
          '1. `Point(x, y)` declares `__slots__ = ("x", "y")`: its objects have no `__dict__`, and setting any other attribute raises `AttributeError`.',
          '2. `Pixel` is a `@dataclass(slots=True)` with `x: int`, `y: int` and `color: str = "black"`.',
          '3. `parse_settings(lines)` turns lines such as `"port = 8080"` into a dict `{"port": "8080"}`, skipping lines that do not look like `key = value`. Use `re.match` and `:=`.',
          '4. `big_squares(nums, limit)` returns the squares greater than `limit`, computing each square only once, with `:=` in a list comprehension.',
          '5. `chunks(stream, size)` is a generator: it reads `stream.read(size)` in a `while` loop with `:=` and yields each piece until the stream is empty.'
        ].join('\n\n'),
        starter: String.raw`import re
from dataclasses import dataclass


class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y


@dataclass
class Pixel:
    x: int
    y: int
    color: str = "black"


def parse_settings(lines):
    settings = {}
    for line in lines:
        m = re.match(r"\s*(\w+)\s*=\s*(.*?)\s*$", line)
        if m:
            settings[m.group(1)] = m.group(2)
    return settings


def big_squares(nums, limit):
    return [x * x for x in nums if x * x > limit]


def chunks(stream, size):
    while True:
        chunk = stream.read(size)
        if not chunk:
            break
        yield chunk


print(parse_settings(["port = 8080"]), big_squares([1, 4, 6], 10))
`,
        solution: String.raw`import re
from dataclasses import dataclass


class Point:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y


@dataclass(slots=True)
class Pixel:
    x: int
    y: int
    color: str = "black"


def parse_settings(lines):
    settings = {}
    for line in lines:
        if (m := re.match(r"\s*(\w+)\s*=\s*(.*?)\s*$", line)):
            settings[m.group(1)] = m.group(2)
    return settings


def big_squares(nums, limit):
    return [sq for x in nums if (sq := x * x) > limit]


def chunks(stream, size):
    while (chunk := stream.read(size)):
        yield chunk


print(parse_settings(["port = 8080"]), big_squares([1, 4, 6], 10))
`,
        hints: [
          '`__slots__ = ("x", "y")` goes in the class body, above `__init__`. For the dataclass, `@dataclass(slots=True)`.',
          '`if (m := re.match(pattern, line)):` assigns the match and tests it in one go.',
          '`[sq for x in nums if (sq := x * x) > limit]`: the square is computed in the condition and kept as `sq`. And `while (chunk := stream.read(size)):` stops when `read` returns `""`.'
        ],
        checks: [
          { label: '`Point` has slots: no `__dict__`, no new attributes', code: 'assert sorted(getattr(Point, "__slots__", ())) == ["x", "y"], "declare __slots__ = (\\"x\\", \\"y\\")"\np = Point(1, 2)\nassert (p.x, p.y) == (1, 2) and not hasattr(p, "__dict__")\ntry:\n    p.z = 3\nexcept AttributeError:\n    pass\nelse:\n    raise AssertionError("setting p.z should raise AttributeError")' },
          { label: '`Pixel` is a dataclass with slots', code: 'import dataclasses\nassert dataclasses.is_dataclass(Pixel)\nassert hasattr(Pixel, "__slots__") and not hasattr(Pixel(1, 2), "__dict__"), "use @dataclass(slots=True)"\nassert Pixel(1, 2) == Pixel(1, 2, "black") and Pixel(1, 2).color == "black"' },
          { label: '`parse_settings` reads `key = value` lines', code: 'lines = ["host = example.com", "# a comment", "port=8080", "  debug =  yes  ", "nonsense"]\nassert parse_settings(lines) == {"host": "example.com", "port": "8080", "debug": "yes"}' },
          { label: '`big_squares` keeps the squares above the limit', code: 'assert big_squares([1, 4, 6], 10) == [16, 36]\nassert big_squares([], 0) == [] and big_squares([3, -4], 9) == [16]' },
          { label: '`chunks` yields the pieces of a stream', code: 'import io, inspect\nassert inspect.isgeneratorfunction(chunks)\nassert list(chunks(io.StringIO("abcdefg"), 3)) == ["abc", "def", "g"]\nassert list(chunks(io.StringIO(""), 3)) == []' },
          { label: '`:=` in all three functions', code: 'defs = {n.name: n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)}\nmissing = [f for f in ("parse_settings", "big_squares", "chunks") if f not in defs or not any(isinstance(x, ast.NamedExpr) for x in ast.walk(defs[f]))]\nassert not missing, f"use := in {missing}"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'py-descriptors', track: 'advanced',
      title: 'Descriptors: how properties and methods work',
      summary: 'An object on a class with __get__ and __set__ takes over an attribute for every instance. __set_name__, validated fields, the lookup order Python follows, and why property, classmethod and every method are descriptors.',
      keywords: ['descriptor', '__get__', '__set__', '__set_name__', 'property', 'attribute lookup', 'validation', 'field', 'orm', 'bound method', 'data descriptor', 'cached_property', 'bean validation'],
      docs: 'https://docs.python.org/3/howto/descriptor.html',
      body: [
        'A **descriptor** is an object stored on a class that controls an attribute for every object of that class. When Python looks the attribute up and finds an object with a `__get__` method there, it calls that method instead of handing the object back; `__set__` takes over assignment the same way. `@property` is a descriptor, and so is every method.',
        py(String.raw`
class Loud:
    def __set_name__(self, owner, name):        # told its own name when the class is made
        self.name = "_" + name

    def __get__(self, obj, objtype=None):
        if obj is None:                         # looked up on the class itself
            return self
        print(f"  get {self.name[1:]}")
        return getattr(obj, self.name)

    def __set__(self, obj, value):
        print(f"  set {self.name[1:]} = {value!r}")
        setattr(obj, self.name, value)

class Account:
    balance = Loud()                            # one descriptor, shared by every Account

    def __init__(self, balance):
        self.balance = balance                  # goes through Loud.__set__

a = Account(100)
a.balance += 50                                 # a __get__, then a __set__
print(a.balance, vars(a))`),
        '`__get__(self, obj, objtype)` receives the object the attribute was looked up on (`None` when it was looked up on the class), and `__set__(self, obj, value)` the object and the new value. The descriptor is **one** object shared by all accounts, so each account\'s value must be stored on the account, never on the descriptor.',
        '## Validated fields',
        'The everyday use: the same rule on many attributes, written once. This is what Bean Validation\'s `@Positive` does in Java, without annotations or reflection:',
        py(String.raw`
class Positive:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__[self.name]

    def __set__(self, obj, value):
        if not isinstance(value, (int, float)) or value <= 0:
            raise ValueError(f"{self.name} must be a positive number, got {value!r}")
        obj.__dict__[self.name] = value          # kept on the object, under the same name

class Order:
    quantity = Positive()
    price = Positive()

    def __init__(self, quantity, price):
        self.quantity = quantity
        self.price = price

o = Order(3, 9.5)
print(o.quantity * o.price)
try:
    o.quantity = 0
except ValueError as e:
    print("ValueError:", e)`),
        'Storing the value in the object\'s `__dict__` under the attribute\'s own name works because of the lookup order below: a descriptor with `__set__` comes first, so `o.quantity` still goes through it.',
        '## The lookup order',
        '| Order | Where Python looks for `obj.attr` | Examples |\n|---|---|---|\n| 1 | a **data descriptor** on the class (it has `__set__`) | `property`, `Positive` above |\n| 2 | the object\'s own `__dict__` | `self.x = 1` |\n| 3 | a non-data descriptor (only `__get__`) or a plain class attribute | methods, class constants, `functools.cached_property` |\n| 4 | the class\'s `__getattr__`, if it has one | proxies, fallbacks |',
        '## Methods are descriptors',
        'A function stored in a class has a `__get__` too. Looking it up on an object calls that `__get__`, which returns a **bound method**: the function with the object fixed as `self`. That is the whole trick behind `self`:',
        py(String.raw`
class Greeter:
    def hello(self):
        return "hi from " + type(self).__name__

g = Greeter()
f = Greeter.__dict__["hello"]           # the plain function stored in the class
bound = f.__get__(g, Greeter)           # what g.hello does
print(type(f).__name__, "->", type(bound).__name__)
print(bound(), bound.__self__ is g, g.hello() == bound())`),
        '`property`, `classmethod` and `staticmethod` are descriptors written in C. When to write one yourself: when the same behaviour belongs on many attributes or classes (validation, type conversion, lazy loading, columns of an ORM: Django\'s and SQLAlchemy\'s model fields are descriptors). For one attribute of one class, `@property` ([[lesson:py-properties]]) is simpler.'
      ].join('\n\n'),
      java: 'Java has no descriptors. Frameworks reach the same effect from outside the class, with annotations read by reflection or with generated code: Bean Validation\'s `@Positive`, JPA\'s `@Column`, Lombok\'s getters and setters. In Python the field object itself is code that runs on every read and write, which is also how `self` gets passed to methods.',
      example: {
        code: String.raw`class Typed:
    """A field that checks its type and converts the value with a function."""

    def __init__(self, kind, convert=None):
        self.kind, self.convert = kind, convert

    def __set_name__(self, owner, name):
        self.name = name
        owner.fields = getattr(owner, "fields", []) + [name]

    def __get__(self, obj, objtype=None):
        return self if obj is None else obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        if self.convert is not None:
            value = self.convert(value)
        if not isinstance(value, self.kind):
            raise TypeError(f"{self.name} must be {self.kind.__name__}, got {value!r}")
        obj.__dict__[self.name] = value


class Customer:
    name = Typed(str, str.strip)
    age = Typed(int, int)
    email = Typed(str, str.lower)

    def __init__(self, **values):
        for field in self.fields:
            setattr(self, field, values[field])


c = Customer(name="  Asha ", age="34", email="Asha@Example.COM")
print(c.name, c.age, c.email, Customer.fields)
try:
    c.age = "thirty"
except ValueError as e:
    print("ValueError:", e)
print(type(Customer.age).__name__, "on the class itself")
`,
        note: '`__set_name__` also lets each field add its name to the class: `Customer.fields` was never written by hand.'
      },
      challenge: {
        title: 'A bounded number',
        task: [
          '1. `Bounded(low, high)` is a descriptor for numbers: assigning a value outside `low` to `high` (both included) raises `ValueError`, with a message that names the attribute, such as `target must be between 5 and 30, got 40`.',
          '2. Assigning something that is not an `int` or a `float` raises `TypeError`.',
          '3. Each object keeps its own value, stored on the object: two thermostats do not share a target.',
          '4. Read on the class, `Thermostat.target` returns the descriptor itself.',
          '5. It learns the attribute\'s name from `__set_name__`, so it works for any attribute of any class.'
        ].join('\n\n'),
        starter: String.raw`class Bounded:
    def __init__(self, low, high):
        self.low, self.high = low, high

    def __get__(self, obj, objtype=None):
        return self.value

    def __set__(self, obj, value):
        if value < self.low or value > self.high:
            raise ValueError("value out of range")
        self.value = value


class Thermostat:
    target = Bounded(5, 30)
    fan = Bounded(0, 3)

    def __init__(self, target, fan=1):
        self.target = target
        self.fan = fan


t = Thermostat(21)
print(t.target, t.fan)
`,
        solution: String.raw`class Bounded:
    def __init__(self, low, high):
        self.low, self.high = low, high

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__[self.name]

    def __set__(self, obj, value):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{self.name} must be a number, got {value!r}")
        if not self.low <= value <= self.high:
            raise ValueError(f"{self.name} must be between {self.low} and {self.high}, got {value}")
        obj.__dict__[self.name] = value


class Thermostat:
    target = Bounded(5, 30)
    fan = Bounded(0, 3)

    def __init__(self, target, fan=1):
        self.target = target
        self.fan = fan


t = Thermostat(21)
print(t.target, t.fan, Thermostat.target)
`,
        hints: [
          'The starter keeps the value on the descriptor (`self.value`), and there is only one descriptor per class, so every thermostat shares it. Store it on the object instead: `obj.__dict__[self.name] = value`.',
          '`def __set_name__(self, owner, name): self.name = name` runs when the class is created, and tells the descriptor which attribute it is.',
          'In `__get__`, `obj` is `None` when the attribute is read on the class: return `self` then. Check the type first (`isinstance(value, (int, float))`), then the range, and put `self.name` in both messages.'
        ],
        checks: [
          { label: 'Values in range are stored and read back', code: 't = Thermostat(21, 2)\nassert (t.target, t.fan) == (21, 2)\nt.target = 5\nt.target = 30\nassert t.target == 30' },
          { label: 'Each object keeps its own value', code: 'a, b = Thermostat(20), Thermostat(25)\na.fan = 3\nassert (a.target, b.target) == (20, 25), f"a.target is {a.target} and b.target is {b.target}: store the value on the object"\nassert b.fan == 1' },
          { label: 'Out of range: `ValueError` naming the attribute', code: 't = Thermostat(21)\nfor attr, bad in (("target", 40), ("fan", -1)):\n    try:\n        setattr(t, attr, bad)\n    except ValueError as e:\n        assert attr in str(e) and str(bad) in str(e), f"the message was {str(e)!r}: name the attribute and the value"\n    else:\n        raise AssertionError(f"{attr} = {bad} should raise ValueError")' },
          { label: 'Not a number: `TypeError`', code: 't = Thermostat(21)\nfor bad in ("warm", None, [20]):\n    try:\n        t.target = bad\n    except TypeError:\n        pass\n    else:\n        raise AssertionError(f"target = {bad!r} should raise TypeError")' },
          { label: '`Thermostat.target` is the descriptor itself', code: 'assert isinstance(Thermostat.target, Bounded), f"Thermostat.target gave {Thermostat.target!r}: return self when obj is None"' },
          { label: 'Works for any attribute, through `__set_name__`', code: 'assert "__set_name__" in vars(Bounded), "define __set_name__(self, owner, name)"\nclass Speaker:\n    volume = Bounded(0, 10)\ns = Speaker()\ns.volume = 7\nassert s.volume == 7 and vars(s) == {"volume": 7}, f"the object holds {vars(s)}"\ntry:\n    s.volume = 11\nexcept ValueError as e:\n    assert "volume" in str(e), f"the message was {str(e)!r}"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'py-metaclasses', track: 'advanced',
      title: '__init_subclass__ and metaclasses',
      summary: 'Classes are objects made by type. What a class statement does; __init_subclass__ to register or check every subclass (plugins, commands); and metaclasses, the class of a class, for the rare cases that need one.',
      keywords: ['metaclass', 'type', '__init_subclass__', 'class creation', 'registry', 'plugin', '__new__', 'abcmeta', 'final', 'reflection', 'class decorator', 'serviceloader', 'annotation processor'],
      docs: 'https://docs.python.org/3/reference/datamodel.html#customizing-class-creation',
      body: [
        'A class is an object too: it can be stored in a variable, passed to a function, and made while the program runs. Every object has a class; the class of a class is its **metaclass**, which is normally `type`:',
        py(String.raw`
class Dog:
    sound = "woof"

print(type(Dog()), type(Dog), type(type))

Cat = type("Cat", (), {"sound": "meow", "speak": lambda self: self.sound})   # a class made by a call
print(Cat().speak(), Cat.__name__)`),
        'That last line is what every `class` statement does: Python runs the body, collects the names it defines into a dict, and calls `type(name, bases, namespace)`. Two hooks let your code take part.',
        '## __init_subclass__: run code for every subclass',
        'A method named `__init_subclass__` on a class runs each time a subclass of it is created, receiving the new class. Keyword arguments on the subclass\'s `class` line are passed to it. That is enough for a plugin registry:',
        py(String.raw`
import json

class Exporter:
    registry = {}

    def __init_subclass__(cls, name, **kwargs):   # runs for every new subclass
        super().__init_subclass__(**kwargs)
        Exporter.registry[name] = cls

class CsvExporter(Exporter, name="csv"):
    def export(self, rows):
        return "\n".join(",".join(map(str, r)) for r in rows)

class JsonExporter(Exporter, name="json"):
    def export(self, rows):
        return json.dumps(rows)

print(Exporter.registry)
print(Exporter.registry["csv"]().export([[1, 2], [3, 4]]))`),
        'It can also check a subclass and refuse it. The error comes when the `class` statement runs, as the file is imported, before any object exists: the nearest Python gets to a compile error.',
        py(String.raw`
class Shape:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        if "area" not in cls.__dict__:
            raise TypeError(f"{cls.__name__} must define area()")

class Square(Shape):
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side ** 2

try:
    class Blob(Shape):
        pass
except TypeError as e:
    print("TypeError:", e)
print(Square(3).area())`),
        '## Metaclasses',
        'A metaclass is a subclass of `type`. Its `__new__` (or `__init__`) runs whenever a class that uses it is created, and it is inherited by every subclass. `ABC` works through the metaclass `ABCMeta`, `Enum` through `EnumType` (which is why `for c in Color` works on the class itself), and the model base classes of Django and SQLAlchemy have metaclasses too.',
        py(String.raw`
class Registered(type):
    names = []

    def __new__(mcls, name, bases, namespace):
        cls = super().__new__(mcls, name, bases, namespace)
        mcls.names.append(name)
        return cls

class Model(metaclass=Registered):
    pass

class User(Model):              # inherits the metaclass
    pass

print(Registered.names, type(User).__name__)`),
        '| You want to | Use |\n|---|---|\n| register, check or set up every subclass | `__init_subclass__` |\n| change one class after it is made | a class decorator, as `@dataclass` does |\n| control how the class object itself is built, or give classes their own operators | a metaclass |',
        'Since `__init_subclass__` arrived (Python 3.6), most code that once needed a metaclass does not. As Tim Peters put it: if you wonder whether you need a metaclass, you don\'t.'
      ].join('\n\n'),
      java: 'Java classes cannot run code when they are subclassed, and there is no metaclass. Java gets similar effects from outside: an annotation processor or classpath scanning finds the classes (Spring\'s `@Component`, `ServiceLoader`), and `final class` forbids subclassing. In Python a class body is ordinary code, and `__init_subclass__` runs ordinary code for each subclass as it is defined.',
      example: {
        code: String.raw`class Command:
    registry = {}

    def __init_subclass__(cls, name, **kwargs):
        super().__init_subclass__(**kwargs)
        if not callable(cls.__dict__.get("run")):
            raise TypeError(f"command {name!r} ({cls.__name__}) must define run()")
        cls.name = name
        Command.registry[name] = cls

    @classmethod
    def help(cls):
        return ", ".join(sorted(cls.registry))


class Add(Command, name="add"):
    def run(self, *nums):
        return sum(map(float, nums))


class Upper(Command, name="upper"):
    def run(self, *words):
        return " ".join(words).upper()


def dispatch(line):
    name, *args = line.split()
    command = Command.registry.get(name)
    if command is None:
        return f"unknown {name!r}; try: {Command.help()}"
    return command().run(*args)


for line in ["add 2 3.5", "upper hello there", "delete everything"]:
    print(line, "->", dispatch(line))
try:
    class Broken(Command, name="broken"):
        pass
except TypeError as e:
    print("TypeError:", e)
`,
        note: 'Adding a command means writing a class: nothing else in the program changes, and nothing has to list it.'
      },
      challenge: {
        title: 'Commands that register themselves',
        task: [
          '1. Every subclass of `Command` registers itself under the name in its class line: `class Greet(Command, name="greet")` puts `Greet` in `Command.registry["greet"]`. Do it in `__init_subclass__`.',
          '2. A subclass that does not define its own `run` method is refused with a `TypeError` when its `class` statement runs, and is not registered.',
          '3. `dispatch(text)` splits the text into a command name and the rest, and returns `registry[name]().run(rest)`. An unknown name returns `"unknown command: dance"`.',
          '4. Write two commands: `greet` (`run("Asha")` returns `"Hello, Asha!"`) and `shout` (`run("hi there")` returns `"HI THERE!"`).',
          '5. Write the metaclass `Final`: a class made with `metaclass=Final` cannot be subclassed; trying raises `TypeError`, like Java\'s `final class`.'
        ].join('\n\n'),
        starter: String.raw`class Command:
    registry = {}

    def run(self, text):
        raise NotImplementedError


class Greet(Command):
    def run(self, text):
        return f"Hello, {text}!"


Command.registry["greet"] = Greet


def dispatch(text):
    name, _, rest = text.partition(" ")
    return Command.registry[name]().run(rest)


class Final(type):
    pass


print(dispatch("greet Asha"))
`,
        solution: String.raw`class Command:
    registry = {}

    def __init_subclass__(cls, name, **kwargs):
        super().__init_subclass__(**kwargs)
        if "run" not in cls.__dict__:
            raise TypeError(f"{cls.__name__} must define run()")
        Command.registry[name] = cls


class Greet(Command, name="greet"):
    def run(self, text):
        return f"Hello, {text}!"


class Shout(Command, name="shout"):
    def run(self, text):
        return text.upper() + "!"


def dispatch(text):
    name, _, rest = text.partition(" ")
    command = Command.registry.get(name)
    if command is None:
        return f"unknown command: {name}"
    return command().run(rest)


class Final(type):
    def __new__(mcls, name, bases, namespace, **kwargs):
        for base in bases:
            if isinstance(base, Final):
                raise TypeError(f"{base.__name__} is final: it cannot be subclassed")
        return super().__new__(mcls, name, bases, namespace, **kwargs)


print(dispatch("greet Asha"), dispatch("shout hi there"), dispatch("dance now"))
`,
        hints: [
          '`def __init_subclass__(cls, name, **kwargs):` on `Command`; call `super().__init_subclass__(**kwargs)`, then `Command.registry[name] = cls`. The `name="greet"` on the class line arrives as `name`.',
          'Check before registering: `if "run" not in cls.__dict__: raise TypeError(...)`. `cls.__dict__` holds only what the subclass itself defines, not what it inherits.',
          '`Final.__new__(mcls, name, bases, namespace)` runs for every class whose metaclass is `Final`, including subclasses. If any of the `bases` is itself a `Final` class (`isinstance(base, Final)`), raise `TypeError`; otherwise return `super().__new__(...)`.'
        ],
        checks: [
          { label: '`greet` and `shout` are registered', code: 'assert set(Command.registry) >= {"greet", "shout"}, f"the registry holds {sorted(Command.registry)}"\nassert all(issubclass(Command.registry[n], Command) for n in ("greet", "shout"))' },
          { label: '`dispatch` runs a command, or says it is unknown', code: 'assert dispatch("greet Asha") == "Hello, Asha!"\nassert dispatch("shout hi there") == "HI THERE!"\nassert dispatch("dance now") == "unknown command: dance"' },
          { label: 'A new subclass registers itself', code: 'class Echo(Command, name="echo"):\n    def run(self, text):\n        return text\nassert Command.registry.get("echo") is Echo\nassert dispatch("echo same text") == "same text"' },
          { label: 'A command without `run` is refused when it is defined', code: 'try:\n    class Broken(Command, name="broken"):\n        pass\nexcept TypeError:\n    pass\nelse:\n    raise AssertionError("a Command subclass without its own run() should raise TypeError")\nassert "broken" not in Command.registry, "a refused class must not be registered"' },
          { label: 'Registration happens in `__init_subclass__`', code: 'assert "__init_subclass__" in vars(Command), "define __init_subclass__ on Command"' },
          { label: 'A `Final` class cannot be subclassed', code: 'class Leaf(metaclass=Final):\n    pass\nassert type(Leaf) is Final\ntry:\n    class Sub(Leaf):\n        pass\nexcept TypeError:\n    pass\nelse:\n    raise AssertionError("subclassing a class whose metaclass is Final should raise TypeError")' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'py-memory', track: 'advanced',
      title: 'Memory: reference counts, garbage collection and weakref',
      summary: 'CPython frees an object the moment nothing refers to it. sys.getrefcount, del, reference cycles and the gc module, weak references for caches, observers and parent links, and measuring with getsizeof and tracemalloc.',
      keywords: ['memory', 'garbage collection', 'gc', 'reference count', 'refcount', 'getrefcount', 'weakref', 'weak reference', 'cycle', 'leak', 'tracemalloc', 'getsizeof', 'finalize', '__del__', 'weakvaluedictionary', 'weakset'],
      docs: 'https://docs.python.org/3/library/gc.html',
      body: [
        'Every object in CPython counts the references to it: each name, list slot, dict entry or attribute that points at it. When the count falls to zero, the object is freed **at once**. That is **reference counting**, and it makes memory release predictable, unlike the JVM\'s garbage collector, which frees objects at some later moment. `sys.getrefcount` shows the count, one higher than you might expect because the call\'s own argument counts too:',
        py(String.raw`
import sys

class Thing:
    pass

a = Thing()
print(sys.getrefcount(a))      # 2: the name a, and getrefcount's own argument
b = a
items = [a, a]
print(sys.getrefcount(a))      # 5: a, b, two list slots, the argument
del b                          # removes a name, not the object
items.clear()
print(sys.getrefcount(a))`),
        '`weakref.finalize(obj, func)` calls `func` when `obj` is freed, which shows exactly when that happens:',
        py(String.raw`
import weakref

class Connection:
    def __init__(self, name):
        self.name = name
        weakref.finalize(self, print, f"  {name} freed")

def work():
    c = Connection("temp")
    print("  working with", c.name)

print("before")
work()                         # c's last reference goes when work returns
print("after")
conn = Connection("kept")
conn = None                    # the old object loses its last reference: freed now
print("end")`),
        'Even so, close files and connections with `with` ([[lesson:py-context-managers]]), not by relying on when an object dies: other Pythons (PyPy, Jython) do not count references.',
        '## Cycles and the garbage collector',
        'Counting has one blind spot: objects that refer to each other in a circle keep each other\'s counts above zero, even when nothing else can reach them. CPython\'s **cycle collector**, the `gc` module, looks for such groups from time to time and frees them:',
        py(String.raw`
import gc
import weakref

class Node:
    def __init__(self, name):
        self.name = name
        self.other = None
        weakref.finalize(self, print, f"  {name} freed")

gc.disable()                   # switch the automatic collector off, to watch it
a, b = Node("a"), Node("b")
a.other, b.other = b, a        # a cycle
del a, b
print("both names are gone, but the cycle keeps itself alive")
print("gc.collect() found", gc.collect(), "unreachable objects")
gc.enable()`),
        'The collector works in generations: new objects are checked often, objects that survive are checked less and less. `gc.collect()` forces a full run; `gc.get_count()` and `gc.get_threshold()` show when the next one is due.',
        '## Weak references',
        'A **weak reference** points at an object without keeping it alive, like Java\'s `WeakReference`. Calling it gives the object, or `None` once the object has been freed:',
        py(String.raw`
import weakref

class Image:
    def __init__(self, name):
        self.name = name

cache = weakref.WeakValueDictionary()      # holds an entry only while someone uses the image
logo = Image("logo.png")
cache["logo"] = logo
print("logo" in cache)
del logo                                   # the last strong reference
print("logo" in cache)

r = weakref.ref(Image("tmp"))              # nothing else holds it: freed at once
print(r())`),
        '| Need | Weak tool |\n|---|---|\n| a cache that must not keep objects alive | `weakref.WeakValueDictionary` |\n| extra data about objects you do not own | `weakref.WeakKeyDictionary` (Java\'s `WeakHashMap`) |\n| listeners that may disappear | `weakref.WeakSet` |\n| a child that points back at its parent | `weakref.ref(parent)`: no cycle |\n| clean-up when an object dies | `weakref.finalize` (Java\'s `Cleaner`) |',
        '## Measuring memory',
        '`sys.getsizeof(x)` is the size of one object itself, not of what it contains. `tracemalloc` measures what a piece of code allocated, and can say which lines allocated it: the tool for finding a leak.',
        py(String.raw`
import sys
import tracemalloc

print(sys.getsizeof([]), sys.getsizeof([1, 2, 3]), sys.getsizeof("a" * 100))

tracemalloc.start()
data = [str(i) * 10 for i in range(10_000)]
current, peak = tracemalloc.get_traced_memory()
tracemalloc.stop()
print(f"about {current // 1024} KiB for 10,000 strings")`),
        'Watch it happen, and compare objects with and without `__slots__`, in [[explain:memory]].'
      ].join('\n\n'),
      java: 'The JVM finds garbage by tracing from the roots, at moments it chooses; CPython frees most objects the instant their reference count reaches zero, and runs a tracing collector only for cycles. So memory is released predictably, but cycles cost extra work: break them with weak references where you can. The vocabulary carries over: `WeakReference` is `weakref.ref`, `WeakHashMap` is `WeakKeyDictionary`, `Cleaner` is `weakref.finalize`, and a heap profiler is `tracemalloc`. `__del__` exists, but like `finalize()` it is best avoided.',
      example: {
        code: String.raw`import gc
import weakref


class Button:
    def __init__(self):
        self.listeners = weakref.WeakSet()     # does not keep a listener alive

    def on_click(self, listener):
        self.listeners.add(listener)

    def click(self):
        alive = list(self.listeners)
        for listener in alive:
            listener.notify("clicked")
        return len(alive)


class Panel:
    def __init__(self, name):
        self.name = name

    def notify(self, event):
        print(f"  {self.name} saw {event}")


button = Button()
left, right = Panel("left"), Panel("right")
button.on_click(left)
button.on_click(right)
print("listeners called:", button.click())
del right                  # the panel was closed
gc.collect()               # not needed in CPython, which already freed it
print("listeners called:", button.click())
`,
        note: 'With a plain `set`, the closed panel would keep receiving clicks, and could never be freed: a classic leak in observer code, in Java too.'
      },
      challenge: {
        title: 'Weak links',
        task: [
          '1. `Node(name, parent=None)` keeps its children in a list `children`, and its parent through a weak reference: the property `node.parent` returns the parent, or `None` when there is none (or it is gone). Creating `Node("b", parent=a)` appends the new node to `a.children`.',
          'Because the child-to-parent link is weak, a tree has no reference cycles: deleting the last name of the root frees the whole tree at once, even with the garbage collector switched off.',
          '2. `Cache.get(key, factory)` returns the cached object for `key` while somebody still uses it; otherwise it calls `factory()`, stores the result and returns it. Use a `weakref.WeakValueDictionary`, so the cache never keeps an object alive by itself.',
          '3. `EventBus.subscribe(listener)` keeps listeners in a `weakref.WeakSet`; `publish(event)` calls `listener.notify(event)` on every listener still alive, and returns how many it called.'
        ].join('\n\n'),
        starter: String.raw`class Node:
    def __init__(self, name, parent=None):
        self.name = name
        self.children = []
        self.parent = parent
        if parent is not None:
            parent.children.append(self)


class Cache:
    def __init__(self):
        self.items = {}

    def get(self, key, factory):
        if key not in self.items:
            self.items[key] = factory()
        return self.items[key]


class EventBus:
    def __init__(self):
        self.listeners = []

    def subscribe(self, listener):
        self.listeners.append(listener)

    def publish(self, event):
        for listener in self.listeners:
            listener.notify(event)
        return len(self.listeners)


root = Node("root")
print([c.name for c in Node("leaf", parent=root).parent.children])
`,
        solution: String.raw`import weakref


class Node:
    def __init__(self, name, parent=None):
        self.name = name
        self.children = []
        self._parent = None
        if parent is not None:
            self._parent = weakref.ref(parent)
            parent.children.append(self)

    @property
    def parent(self):
        return self._parent() if self._parent is not None else None


class Cache:
    def __init__(self):
        self.items = weakref.WeakValueDictionary()

    def get(self, key, factory):
        item = self.items.get(key)
        if item is None:
            item = factory()
            self.items[key] = item
        return item


class EventBus:
    def __init__(self):
        self.listeners = weakref.WeakSet()

    def subscribe(self, listener):
        self.listeners.add(listener)

    def publish(self, event):
        alive = list(self.listeners)
        for listener in alive:
            listener.notify(event)
        return len(alive)


root = Node("root")
print([c.name for c in Node("leaf", parent=root).parent.children])
`,
        hints: [
          'Store `self._parent = weakref.ref(parent)` and add a property `parent` that calls it: `return self._parent() if self._parent is not None else None`. A weak reference called after its object died returns `None`.',
          '`Cache`: `self.items = weakref.WeakValueDictionary()`; in `get`, `item = self.items.get(key)`, and if that is `None`, make it, store it, return it. Keep it in a local variable while you do: an object with no other reference would vanish from the cache at once.',
          '`EventBus`: `self.listeners = weakref.WeakSet()`. In `publish`, take `alive = list(self.listeners)` first, so the set cannot change while you loop.'
        ],
        checks: [
          { label: 'A node knows its children and its parent', code: 'root = Node("root")\nkid = Node("kid", parent=root)\nassert root.children == [kid] and kid.parent is root and root.parent is None' },
          { label: 'Deleting the root frees the tree, with the collector off', code: 'import gc, weakref\ngc.disable()\ntry:\n    root = Node("root")\n    kid = Node("kid", parent=root)\n    grandkid = Node("grandkid", parent=kid)\n    watch = [weakref.ref(n) for n in (root, kid, grandkid)]\n    del root, kid, grandkid\n    alive = [w() is not None for w in watch]\nfinally:\n    gc.enable()\nassert alive == [False, False, False], f"still alive after del: {alive}; the parent link makes a cycle, so keep it in a weakref"' },
          { label: 'A child\'s `parent` is `None` once the parent is gone', code: 'root = Node("root")\nkid = Node("kid", parent=root)\ndel root\nassert kid.parent is None, f"kid.parent is {kid.parent!r}: it should not keep its parent alive"' },
          { label: '`Cache.get` gives the same object while it is in use', code: 'class Img:\n    pass\nmade = []\ndef factory():\n    made.append(1)\n    return Img()\nc = Cache()\na = c.get("logo", factory)\nb = c.get("logo", factory)\nassert a is b and len(made) == 1, f"factory was called {len(made)} times"' },
          { label: 'The cache does not keep an object alive', code: 'import gc, weakref\nclass Img:\n    pass\nc = Cache()\nfirst = c.get("logo", Img)\nw = weakref.ref(first)\ndel first\ngc.collect()\nassert w() is None, "the cache kept the object alive: use a weakref.WeakValueDictionary"\nassert isinstance(c.get("logo", Img), Img)' },
          { label: '`EventBus` calls only the listeners still alive', code: 'import gc\nclass Listener:\n    def __init__(self):\n        self.seen = []\n\n    def notify(self, event):\n        self.seen.append(event)\nbus = EventBus()\na, b = Listener(), Listener()\nbus.subscribe(a)\nbus.subscribe(b)\nassert bus.publish("x") == 2 and a.seen == b.seen == ["x"]\ndel b\ngc.collect()\nassert bus.publish("y") == 1, "a listener that is gone was still called: keep them in a weakref.WeakSet"\nassert a.seen == ["x", "y"]' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'py-threads', track: 'advanced',
      title: 'Threads and the GIL',
      summary: 'threading.Thread and ThreadPoolExecutor (Python\'s ExecutorService), futures and as_completed; the global interpreter lock and why threads speed up waiting but not computing; races, Lock and queue.Queue.',
      keywords: ['thread', 'threading', 'gil', 'global interpreter lock', 'threadpoolexecutor', 'executorservice', 'future', 'as_completed', 'lock', 'synchronized', 'race condition', 'queue', 'blockingqueue', 'concurrency', 'free-threaded'],
      docs: 'https://docs.python.org/3/library/concurrent.futures.html',
      runtimes: ['server'],
      runtimeWhy: 'A browser gives Python no threads: in the in-browser Python, `threading.Thread(...).start()` fails with "can\'t start new thread".',
      body: [
        'A thread runs a function alongside the rest of the program, as in Java: `threading.Thread(target=f, args=(...))`, then `start()` and `join()`.',
        py(String.raw`
import threading
import time

def download(name, seconds):
    print(f"  {name}: start")
    time.sleep(seconds)                      # waiting, like a network call
    print(f"  {name}: done")

t0 = time.perf_counter()
threads = [threading.Thread(target=download, args=(f"file{i}", 0.3)) for i in range(3)]
for t in threads:
    t.start()
for t in threads:
    t.join()                                 # wait for each one to finish
print(f"3 downloads of 0.3 s took {time.perf_counter() - t0:.1f} s")`),
        '## Thread pools',
        'Day to day you hand work to a pool, as with Java\'s `ExecutorService`. `concurrent.futures.ThreadPoolExecutor` returns a `Future` for each task; `map` gives the results in order, `as_completed` as they finish:',
        py(String.raw`
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

def fetch(url):
    time.sleep(0.2)
    return f"{url}: 200 OK"

urls = [f"https://example.com/page{i}" for i in range(5)]
t0 = time.perf_counter()
with ThreadPoolExecutor(max_workers=5) as pool:          # Executors.newFixedThreadPool(5)
    results = list(pool.map(fetch, urls))                # in the order of urls
print(results[0], f"... 5 pages in {time.perf_counter() - t0:.1f} s")

with ThreadPoolExecutor(max_workers=3) as pool:
    futures = [pool.submit(fetch, u) for u in urls[:3]]  # submit gives a Future
    for f in as_completed(futures):                      # each one as soon as it is done
        print("finished:", f.result())`),
        'Leaving the `with` block waits for every task and shuts the pool down. `future.result()` waits for the result, and raises the task\'s exception if it failed: Java\'s `future.get()`.',
        '## The GIL',
        'CPython lets only **one thread at a time run Python code**, enforced by the **global interpreter lock** (GIL). A thread that waits, for the network, a file, a database or `sleep`, lets go of the lock, so threads are excellent at overlapping waits. Work that keeps the processor busy in Python code does **not** get faster with more threads:',
        py(String.raw`
import threading
import time

def count(n):
    while n > 0:
        n -= 1

N = 2_000_000
t0 = time.perf_counter()
count(N)
count(N)
one_after_the_other = time.perf_counter() - t0

t0 = time.perf_counter()
threads = [threading.Thread(target=count, args=(N,)) for _ in range(2)]
for t in threads:
    t.start()
for t in threads:
    t.join()
in_two_threads = time.perf_counter() - t0
print(f"one after the other: {one_after_the_other:.2f} s, in two threads: {in_two_threads:.2f} s")`),
        'For processor-heavy work, use processes instead ([[lesson:py-multiprocessing]]), or libraries written in C, such as NumPy, that release the GIL while they compute. Python 3.13 also ships an experimental "free-threaded" build without the GIL, a separate download; the standard Python keeps it. [[explain:concurrency]] times threads, processes and asyncio side by side.',
        '## Races and locks',
        'The GIL protects Python\'s own internals, not your data. `self.balance = self.balance + amount` is a read, an addition and a write, and another thread can run between them, so updates can be lost. A `Lock` used with `with` lets one thread at a time into a block, like `synchronized`:',
        py(String.raw`
import threading

class Account:
    def __init__(self):
        self.balance = 0
        self.lock = threading.Lock()

    def deposit(self, amount):
        with self.lock:                      # one thread at a time in here
            current = self.balance
            self.balance = current + amount

acct = Account()

def work():
    for _ in range(10_000):
        acct.deposit(1)

threads = [threading.Thread(target=work) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(acct.balance)`),
        '## Passing work between threads: queue.Queue',
        '`queue.Queue` is thread-safe, like Java\'s `BlockingQueue`: `get()` waits until an item arrives.',
        py(String.raw`
import queue
import threading

jobs = queue.Queue()
done = []

def worker():
    while (job := jobs.get()) is not None:   # None is the signal to stop
        done.append(job * job)
        jobs.task_done()

threads = [threading.Thread(target=worker) for _ in range(3)]
for t in threads:
    t.start()
for n in range(10):
    jobs.put(n)
jobs.join()                                  # wait until every job is marked done
for _ in threads:
    jobs.put(None)
for t in threads:
    t.join()
print(sorted(done))`),
        '| Java | Python |\n|---|---|\n| `new Thread(r).start()`, `join()` | `threading.Thread(target=f).start()`, `join()` |\n| `ExecutorService`, `newFixedThreadPool(n)` | `ThreadPoolExecutor(max_workers=n)` |\n| `Future.get()` | `future.result()` |\n| `invokeAll`, `ExecutorCompletionService` | `pool.map`, `as_completed` |\n| `synchronized`, `ReentrantLock` | `with lock:` (`threading.Lock`, `RLock`) |\n| `AtomicInteger` | a `Lock` around the update (or `itertools.count`) |\n| `BlockingQueue` | `queue.Queue` |\n| `CountDownLatch`, `Semaphore` | `threading.Barrier`, `threading.Semaphore` |\n| threads that run on all cores | threads that take turns: use processes for CPU work |'
      ].join('\n\n'),
      java: 'The API is familiar: `ThreadPoolExecutor` is an `ExecutorService`, futures work the same, `with lock:` is `synchronized`. The difference is the GIL: in the standard CPython, Python code runs on one core at a time, however many threads you start. So Python uses threads for waiting (network, files, databases) and processes for CPU work, where Java would use threads for both.',
      example: {
        code: String.raw`import time
from concurrent.futures import ThreadPoolExecutor, as_completed

SITES = {"example.com": 0.3, "python.org": 0.2, "slow.example": 0.5, "docs.python.org": 0.1}


def check(site):
    """Pretend to request the site: it takes as long as the site is slow."""
    time.sleep(SITES[site])
    if site.startswith("slow"):
        raise TimeoutError(f"{site} did not answer")
    return f"{site} is up"


t0 = time.perf_counter()
for site in SITES:
    try:
        check(site)
    except TimeoutError:
        pass
print(f"one by one: {time.perf_counter() - t0:.1f} s")

t0 = time.perf_counter()
with ThreadPoolExecutor(max_workers=len(SITES)) as pool:
    futures = {pool.submit(check, site): site for site in SITES}
    for future in as_completed(futures):
        try:
            print(" ", future.result())
        except TimeoutError as e:
            print("  failed:", e)
print(f"in threads: {time.perf_counter() - t0:.1f} s")
`,
        note: 'In threads, the whole check takes as long as the slowest site, and the results arrive fastest first.'
      },
      challenge: {
        title: 'Fetch in parallel, count safely',
        task: [
          '1. `fetch_all(urls, fetch)` calls `fetch(url)` for every url at the same time, in a `ThreadPoolExecutor`, and returns the results in the order of `urls`. Five fetches of 0.2 s each must take well under a second.',
          '2. If a fetch raises, `fetch_all` raises the same exception.',
          '3. `first_done(tasks)` runs every function in the list `tasks` in threads, and returns the result of the one that finishes first, like Java\'s `CompletableFuture.anyOf`.',
          '4. `Counter.increment()` is safe to call from many threads at once: protect the count with a `threading.Lock`.'
        ].join('\n\n'),
        starter: String.raw`import threading
import time


def fetch_all(urls, fetch):
    return [fetch(url) for url in urls]


def first_done(tasks):
    return tasks[0]()


class Counter:
    def __init__(self):
        self.value = 0

    def increment(self):
        self.value += 1


def slow_echo(url):
    time.sleep(0.1)
    return url.upper()


print(fetch_all(["a", "b", "c"], slow_echo))
`,
        solution: String.raw`import threading
import time
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait


def fetch_all(urls, fetch):
    with ThreadPoolExecutor(max_workers=max(1, len(urls))) as pool:
        return list(pool.map(fetch, urls))


def first_done(tasks):
    with ThreadPoolExecutor(max_workers=len(tasks)) as pool:
        futures = [pool.submit(task) for task in tasks]
        done, _ = wait(futures, return_when=FIRST_COMPLETED)
        return next(iter(done)).result()


class Counter:
    def __init__(self):
        self.value = 0
        self.lock = threading.Lock()

    def increment(self):
        with self.lock:
            self.value += 1


def slow_echo(url):
    time.sleep(0.1)
    return url.upper()


print(fetch_all(["a", "b", "c"], slow_echo))
`,
        hints: [
          '`with ThreadPoolExecutor(max_workers=len(urls)) as pool: return list(pool.map(fetch, urls))`. `map` keeps the order of its input, and re-raises a task\'s exception when you reach its result.',
          '`first_done`: `submit` every task, then `wait(futures, return_when=FIRST_COMPLETED)` gives a set of the finished ones; return the `.result()` of one of them.',
          '`Counter`: make `self.lock = threading.Lock()` in `__init__`, and do the `+= 1` inside `with self.lock:`.'
        ],
        checks: [
          { label: '`fetch_all` returns the results in the order of the urls', code: 'import time\ndef fake(url):\n    time.sleep(0.05 * (3 - int(url[-1])))     # the later urls finish first\n    return url.upper()\nassert fetch_all(["u0", "u1", "u2"], fake) == ["U0", "U1", "U2"]' },
          { label: '`fetch_all` runs the fetches at the same time', code: 'import time\ndef slow(url):\n    time.sleep(0.2)\n    return url\nt0 = time.perf_counter()\nassert fetch_all([f"u{i}" for i in range(5)], slow) == [f"u{i}" for i in range(5)]\ntook = time.perf_counter() - t0\nassert took < 0.6, f"5 fetches of 0.2 s took {took:.2f} s: run them in a ThreadPoolExecutor"' },
          { label: 'A failed fetch\'s exception reaches the caller', code: 'def broken(url):\n    if url == "bad":\n        raise ConnectionError("bad host")\n    return url\ntry:\n    fetch_all(["ok", "bad", "ok2"], broken)\nexcept ConnectionError as e:\n    assert "bad host" in str(e)\nelse:\n    raise AssertionError("the ConnectionError should reach the caller")' },
          { label: '`first_done` returns the fastest result', code: 'import time\ndef slow():\n    time.sleep(0.4)\n    return "slow"\ndef fast():\n    time.sleep(0.05)\n    return "fast"\nassert first_done([slow, fast]) == "fast"\nassert first_done([fast, slow]) == "fast"' },
          { label: '`Counter` counts correctly from 4 threads, with a `Lock`', code: 'import threading\nc = Counter()\ndef work():\n    for _ in range(20_000):\n        c.increment()\nthreads = [threading.Thread(target=work) for _ in range(4)]\nfor t in threads:\n    t.start()\nfor t in threads:\n    t.join()\nassert c.value == 80_000, f"{c.value}: some increments were lost"\nlock_type = type(threading.Lock())\nassert any(isinstance(v, lock_type) for v in list(vars(c).values()) + list(vars(type(c)).values())), "protect the count with a threading.Lock"' },
          { label: 'Uses a `ThreadPoolExecutor`', code: 'assert calls("ThreadPoolExecutor"), "use concurrent.futures.ThreadPoolExecutor"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'py-multiprocessing', track: 'advanced',
      title: 'Processes: real parallelism for CPU work',
      summary: 'ProcessPoolExecutor runs work in other Python processes, each with its own GIL, so CPU-heavy work uses every core. Why the __main__ guard is required, what can be sent between processes (pickling), and what processes cost.',
      keywords: ['multiprocessing', 'process', 'processpoolexecutor', 'parallel', 'cpu-bound', 'cores', 'pickle', '__main__', 'spawn', 'pool', 'gil', 'forkjoinpool', 'parallel stream', 'cpu_count'],
      docs: 'https://docs.python.org/3/library/concurrent.futures.html#processpoolexecutor',
      runtimes: ['server'],
      runtimeWhy: 'A browser gives Python no processes: in the in-browser Python, a `ProcessPoolExecutor` cannot start.',
      body: [
        'Threads in CPython take turns at running Python code ([[lesson:py-threads]]). A **process** is a separate Python, with its own memory and its own GIL, so several processes really do compute at the same time, one per core. `ProcessPoolExecutor` has the same API as the thread pool:',
        py(String.raw`
import os
import time
from concurrent.futures import ProcessPoolExecutor


def count_primes(limit):
    count = 0
    for n in range(2, limit):
        if all(n % d for d in range(2, int(n ** 0.5) + 1)):
            count += 1
    return count


if __name__ == "__main__":
    jobs = [60_000] * 4
    t0 = time.perf_counter()
    one_by_one = [count_primes(n) for n in jobs]
    t1 = time.perf_counter()
    with ProcessPoolExecutor() as pool:
        in_processes = list(pool.map(count_primes, jobs))
    t2 = time.perf_counter()
    print(f"{os.cpu_count()} cores; the same results: {one_by_one == in_processes}")
    print(f"one by one: {t1 - t0:.2f} s, in processes: {t2 - t1:.2f} s")`),
        '## Why `if __name__ == "__main__":` is required',
        'On Windows and macOS, each worker process starts a fresh Python, which **imports your file** to find the function it must run. Without the guard, that import would run your top-level code again, including the code that starts the pool, in every worker. With the guard, the top-level code runs only in the process you started.',
        '## What travels between processes',
        'Processes share no memory. Arguments and results are copied across by **pickling**: turned into bytes and back. Functions are sent by name, so a function a worker should run must be defined at the top level of the file: not a `lambda`, not a nested function.',
        py(String.raw`
import pickle
from concurrent.futures import ProcessPoolExecutor


def square(x):
    return x * x


if __name__ == "__main__":
    print(len(pickle.dumps(square)), "bytes: a top-level function travels by its name")
    try:
        pickle.dumps(lambda x: x * x)
    except (pickle.PicklingError, AttributeError) as e:
        print(type(e).__name__, "for a lambda: it has no name to look up")
    with ProcessPoolExecutor(max_workers=2) as pool:
        print(list(pool.map(square, range(6))))`),
        'Because nothing is shared, a worker that changes a global variable changes its own copy only; send results back as return values. A worker\'s `print` goes to that process\'s own output, which this tool does not show: return what you want to see.',
        '## What processes cost',
        'Starting a process takes a noticeable fraction of a second (more on Windows), and every argument and result is copied. Processes pay off for **CPU-heavy work in big chunks**: hand each worker a large slice, not one tiny item (`pool.map(f, items, chunksize=100)` groups small ones). For waiting work, threads or asyncio are cheaper. The `multiprocessing` module has the lower-level tools: `Process`, `Queue`, `Pool` and shared memory.',
        '| Java | Python |\n|---|---|\n| a parallel stream, `ForkJoinPool` | `ProcessPoolExecutor` |\n| threads on all cores for CPU work | processes for CPU work (threads share one GIL) |\n| objects shared between threads | copies sent between processes (pickled) |\n| `Runtime.getRuntime().availableProcessors()` | `os.cpu_count()` |'
      ].join('\n\n'),
      java: 'In Java, threads already run on all cores, so a parallel stream or a `ForkJoinPool` is enough for CPU-heavy work. In CPython the GIL lets one thread compute at a time, so that work goes to separate processes, which share nothing: arguments and results are copied (pickled), and the code they run must be importable by name. The pool API is the same as for threads, so switching is a one-word change.',
      example: {
        code: String.raw`import time
from collections import Counter
from concurrent.futures import ProcessPoolExecutor

TEXT = ("the quick brown fox jumps over the lazy dog " * 40_000).split()


def count_words(words):
    """Runs in a worker: gets its own copy of a slice of the list."""
    return Counter(w for w in words if len(w) > 3)


def split(items, parts):
    size = -(-len(items) // parts)          # rounded up
    return [items[i:i + size] for i in range(0, len(items), size)]


if __name__ == "__main__":
    t0 = time.perf_counter()
    alone = count_words(TEXT)
    t1 = time.perf_counter()
    total = Counter()
    with ProcessPoolExecutor(max_workers=4) as pool:
        for part in pool.map(count_words, split(TEXT, 4)):
            total += part                   # merge each worker's answer
    t2 = time.perf_counter()
    print(total.most_common(3))
    print("the same answer:", total == alone)
    print(f"one process: {t1 - t0:.2f} s, four: {t2 - t1:.2f} s (starting them is part of the cost)")
`,
        note: 'Each worker gets a quarter of the words and returns a small `Counter`: big chunks in, small answers out is the shape that suits processes.'
      },
      challenge: {
        title: 'Count primes on every core',
        task: [
          '1. `count_primes(start, stop)` counts the primes `p` with `start <= p < stop`. It is defined at the top level of the file, so worker processes can find it.',
          '2. `split_range(limit, parts)` cuts `0` to `limit` into `parts` ranges, as `(start, stop)` pairs that cover every number exactly once and differ in size by at most one: `split_range(10, 3)` is `[(0, 4), (4, 7), (7, 10)]`.',
          '3. `parallel_count(limit, workers)` counts the primes below `limit` by handing each range of `split_range(limit, workers)` to a `ProcessPoolExecutor`, and adds the answers up.',
          '4. The program\'s own work runs only under `if __name__ == "__main__":`.'
        ].join('\n\n'),
        starter: String.raw`def count_primes(limit):
    return sum(1 for n in range(2, limit) if all(n % d for d in range(2, n)))


def split_range(limit, parts):
    step = limit // parts
    return [(i * step, (i + 1) * step) for i in range(parts)]


def parallel_count(limit, workers):
    return count_primes(limit)


print(parallel_count(2_000, 4))
`,
        solution: String.raw`from concurrent.futures import ProcessPoolExecutor


def is_prime(n):
    return n >= 2 and all(n % d for d in range(2, int(n ** 0.5) + 1))


def count_primes(start, stop):
    return sum(1 for n in range(start, stop) if is_prime(n))


def split_range(limit, parts):
    size, extra = divmod(limit, parts)
    ranges, start = [], 0
    for i in range(parts):
        stop = start + size + (1 if i < extra else 0)
        ranges.append((start, stop))
        start = stop
    return ranges


def parallel_count(limit, workers):
    starts, stops = zip(*split_range(limit, workers))
    with ProcessPoolExecutor(max_workers=workers) as pool:
        return sum(pool.map(count_primes, starts, stops))


if __name__ == "__main__":
    print(parallel_count(20_000, 4))
`,
        hints: [
          '`count_primes(start, stop)`: test each `n` in `range(start, stop)`; a number is prime when it is at least 2 and no `d` from 2 up to its square root divides it.',
          '`split_range`: `size, extra = divmod(limit, parts)`; the first `extra` ranges get one more number. Keep a running `start`, so each range begins where the last one stopped.',
          '`pool.map(count_primes, starts, stops)` passes the i-th start and the i-th stop to each call, like `zip`; `zip(*split_range(...))` splits the pairs into the two lists. Put the `print` at the bottom under `if __name__ == "__main__":`.'
        ],
        checks: [
          { label: '`count_primes(start, stop)` counts the primes in the range', code: 'assert count_primes(0, 30) == 10\nassert count_primes(10, 20) == 4\nassert count_primes(0, 2) == 0 and count_primes(2, 3) == 1' },
          { label: '`split_range` covers everything, in near-equal parts', code: 'assert split_range(10, 3) == [(0, 4), (4, 7), (7, 10)]\nassert split_range(8, 4) == [(0, 2), (2, 4), (4, 6), (6, 8)]\nr = split_range(1001, 7)\nassert r[0][0] == 0 and r[-1][1] == 1001 and all(a[1] == b[0] for a, b in zip(r, r[1:]))\nsizes = [b - a for a, b in r]\nassert max(sizes) - min(sizes) <= 1, f"the sizes are {sizes}"' },
          { label: '`parallel_count(20_000, 4)` finds all 2,262 primes', code: 'assert parallel_count(20_000, 4) == 2262\nassert parallel_count(100, 3) == 25' },
          { label: 'It hands the ranges to a `ProcessPoolExecutor`', code: 'assert calls("ProcessPoolExecutor"), "use concurrent.futures.ProcessPoolExecutor"\nassert calls("map") or calls("submit"), "hand the ranges to the pool with pool.map or pool.submit"' },
          { label: '`count_primes` can travel to a worker', code: 'import pickle\nassert count_primes.__qualname__ == "count_primes", "define count_primes at the top level of the file"\npickle.dumps(count_primes)' },
          { label: 'The program\'s work runs under `if __name__ == "__main__":`', code: 'guards = [n for n in tree.body if isinstance(n, ast.If) and "__name__" in ast.unparse(n.test) and "__main__" in ast.unparse(n.test)]\nassert guards, "put the program\'s own work under if __name__ == \\"__main__\\":"\nloose = [ast.unparse(n)[:40] for n in tree.body if isinstance(n, ast.Expr) and isinstance(n.value, ast.Call)]\nassert not loose, f"these calls run at the top level, also in every worker: {loose}"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 8 */
    {
      id: 'py-asyncio', track: 'advanced',
      title: 'asyncio: async and await',
      summary: 'Coroutines, await and the event loop: thousands of waits on one thread. gather, tasks and TaskGroup, timeouts, a Semaphore to limit how many run at once, and the rule never to block the loop. CompletableFuture and virtual threads, compared.',
      keywords: ['asyncio', 'async', 'await', 'coroutine', 'event loop', 'gather', 'task', 'taskgroup', 'completablefuture', 'virtual threads', 'semaphore', 'timeout', 'non-blocking', 'concurrency', 'to_thread'],
      docs: 'https://docs.python.org/3/library/asyncio.html',
      body: [
        'Threads overlap waiting by letting the operating system switch between them. **asyncio** does the same inside a single thread: functions declared `async def` (coroutines) mark every place where they wait with `await`, and the **event loop** runs another coroutine meanwhile. One thread can keep thousands of network requests in flight this way.',
        py(String.raw`
import asyncio
import time

async def fetch(name, seconds):
    print(f"  {name}: start")
    await asyncio.sleep(seconds)          # waits here; the loop runs the others meanwhile
    print(f"  {name}: done")
    return f"{name} ({seconds} s)"

async def main():
    t0 = time.perf_counter()
    results = await asyncio.gather(fetch("a", 0.3), fetch("b", 0.2), fetch("c", 0.1))
    print(results, f"in {time.perf_counter() - t0:.1f} s")

asyncio.run(main())                       # start the event loop and run main() to its end`),
        'Calling an `async def` function runs none of it: it returns a **coroutine** object, much like a generator ([[lesson:py-generators]]). `await` runs it to its end, pausing whenever it waits; `asyncio.run` starts the loop for the first one.',
        py(String.raw`
import asyncio

async def answer():
    return 42

c = answer()
print(type(c).__name__)                   # nothing has run yet
print(asyncio.run(c))`),
        '## One after another, or together',
        '`await` on one coroutine after another runs them one after another. To overlap them, start them as **tasks** (`asyncio.create_task`), or let `gather` or a `TaskGroup` do it:',
        py(String.raw`
import asyncio
import time

async def job(name, seconds):
    await asyncio.sleep(seconds)
    return name

async def main():
    t0 = time.perf_counter()
    await job("a", 0.2)
    await job("b", 0.2)                            # starts only once a is done
    print(f"one after the other: {time.perf_counter() - t0:.1f} s")

    t0 = time.perf_counter()
    task_a = asyncio.create_task(job("a", 0.2))    # starts now, in the background
    task_b = asyncio.create_task(job("b", 0.2))
    print(await task_a, await task_b, f"as tasks: {time.perf_counter() - t0:.1f} s")

    t0 = time.perf_counter()
    async with asyncio.TaskGroup() as tg:          # waits for all; cancels the rest if one fails
        tasks = [tg.create_task(job(n, 0.2)) for n in "xyz"]
    print([t.result() for t in tasks], f"in a TaskGroup: {time.perf_counter() - t0:.1f} s")

asyncio.run(main())`),
        '## Limits and timeouts',
        py(String.raw`
import asyncio

async def fetch(i, gate, running):
    async with gate:                      # at most 2 inside at the same time
        running.append(i)
        print(f"  {i} starts; running now: {len(running)}")
        await asyncio.sleep(0.1)
        running.remove(i)

async def main():
    gate = asyncio.Semaphore(2)
    running = []
    await asyncio.gather(*(fetch(i, gate, running) for i in range(5)))
    try:
        async with asyncio.timeout(0.1):  # give up on a block that takes too long
            await asyncio.sleep(5)
    except TimeoutError:
        print("gave up after 0.1 s")

asyncio.run(main())`),
        '## The one rule: never block the loop',
        'All coroutines share one thread, so while one of them does something slow **without** `await`, every other one waits: `time.sleep`, a long computation, or a library that is not async (such as `requests`). Use `await asyncio.sleep`, async libraries (httpx, aiohttp, asyncpg), or hand blocking work to a thread with `await asyncio.to_thread(func, ...)`. [[explain:event-loop]] shows the loop stall.',
        '| Java | asyncio |\n|---|---|\n| `CompletableFuture.supplyAsync(() -> f())` | `asyncio.create_task(f())` |\n| `future.join()`, `get()` | `await task` |\n| `CompletableFuture.allOf(a, b)` | `await asyncio.gather(a, b)` |\n| `anyOf(a, b)` | `asyncio.wait(tasks, return_when=FIRST_COMPLETED)` |\n| `orTimeout(1, SECONDS)` | `async with asyncio.timeout(1):` |\n| `StructuredTaskScope` (Java 21 preview) | `asyncio.TaskGroup` |\n| `Semaphore`, `BlockingQueue` | `asyncio.Semaphore`, `asyncio.Queue` |',
        'Java 21\'s **virtual threads** solve the same problem the other way round: code stays blocking, and the JVM parks the cheap thread while it waits. Python makes every wait visible with `await`, and an `async def` can only be awaited from another `async def`, so async code spreads up to the caller. FastAPI, httpx and most new network libraries are built on it.'
      ].join('\n\n'),
      java: 'A coroutine is close to a `CompletableFuture` chain written as straight-line code: `await` replaces `thenApply`/`thenCompose`, `gather` replaces `allOf`, `TaskGroup` is structured concurrency. All coroutines run on one thread, taking turns at each `await`, so there are no data races between `await`s, but anything slow that does not `await` stalls everything. Java\'s virtual threads reach the same scale without `async`/`await` by making blocking cheap.',
      example: {
        code: String.raw`import asyncio
import random
import time

random.seed(4)
PAGES = {f"/page/{i}": random.choice([0.1, 0.2, 0.3]) for i in range(8)}


async def get(path):
    await asyncio.sleep(PAGES[path])          # a network round trip
    if path.endswith("5"):
        raise ConnectionError(f"{path}: connection reset")
    return f"{path}: {int(PAGES[path] * 1000)} ms"


async def crawl(paths, limit):
    gate = asyncio.Semaphore(limit)

    async def one(path):
        async with gate:
            return await get(path)

    return await asyncio.gather(*(one(p) for p in paths), return_exceptions=True)


async def main():
    t0 = time.perf_counter()
    for result in await crawl(list(PAGES), limit=4):
        print(" ", "failed:" if isinstance(result, Exception) else "ok:", result)
    print(f"{len(PAGES)} pages in {time.perf_counter() - t0:.1f} s, at most 4 at a time")


asyncio.run(main())
`,
        note: '`return_exceptions=True` puts a failed page\'s exception into the results instead of cancelling everything.'
      },
      challenge: {
        title: 'Four coroutines',
        task: [
          '1. `fetch(name, delay)` is a coroutine: after `await asyncio.sleep(delay)` it returns `f"{name} done"`.',
          '2. `fetch_all(jobs)` is a coroutine that takes a list of `(name, delay)` pairs, runs them all at the same time and returns their results in the order of `jobs`. Jobs of 0.3, 0.1 and 0.2 s must take about 0.3 s, not 0.6.',
          '3. `with_timeout(coro, seconds)` is a coroutine that returns the result of `coro`, or the string `"timed out"` when it takes longer than `seconds`.',
          '4. `limited(jobs, limit)` works like `fetch_all`, calling `fetch` for each job, but never runs more than `limit` jobs at the same moment: use an `asyncio.Semaphore`.',
          '5. No `time.sleep` anywhere: it would stop the whole event loop.'
        ].join('\n\n'),
        starter: String.raw`import asyncio
import time


def fetch(name, delay):
    time.sleep(delay)
    return f"{name} done"


async def fetch_all(jobs):
    return [fetch(name, delay) for name, delay in jobs]


async def with_timeout(coro, seconds):
    return await coro


async def limited(jobs, limit):
    return [fetch(name, delay) for name, delay in jobs]


print(asyncio.run(fetch_all([("a", 0.1), ("b", 0.1)])))
`,
        solution: String.raw`import asyncio


async def fetch(name, delay):
    await asyncio.sleep(delay)
    return f"{name} done"


async def fetch_all(jobs):
    return await asyncio.gather(*(fetch(name, delay) for name, delay in jobs))


async def with_timeout(coro, seconds):
    try:
        async with asyncio.timeout(seconds):
            return await coro
    except TimeoutError:
        return "timed out"


async def limited(jobs, limit):
    gate = asyncio.Semaphore(limit)

    async def one(name, delay):
        async with gate:
            return await fetch(name, delay)

    return await asyncio.gather(*(one(name, delay) for name, delay in jobs))


print(asyncio.run(fetch_all([("a", 0.1), ("b", 0.1)])))
`,
        hints: [
          '`async def fetch(name, delay):` with `await asyncio.sleep(delay)` inside.',
          '`fetch_all`: `return await asyncio.gather(*(fetch(n, d) for n, d in jobs))`. The `*` spreads the coroutines into separate arguments; `gather` keeps their order.',
          '`with_timeout`: `async with asyncio.timeout(seconds): return await coro`, inside `try`, with `except TimeoutError: return "timed out"`.',
          '`limited`: make `gate = asyncio.Semaphore(limit)` and a small inner coroutine that does `async with gate: return await fetch(name, delay)`; then gather those.'
        ],
        checks: [
          { label: '`fetch` is a coroutine that returns `"<name> done"`', code: 'import asyncio, inspect\nassert inspect.iscoroutinefunction(fetch), "write async def fetch(...)"\nassert asyncio.run(fetch("a", 0.01)) == "a done"' },
          { label: '`fetch_all` runs the jobs together, in order', code: 'import asyncio, time\nt0 = time.perf_counter()\nout = asyncio.run(fetch_all([("a", 0.3), ("b", 0.1), ("c", 0.2)]))\ntook = time.perf_counter() - t0\nassert list(out) == ["a done", "b done", "c done"], f"got {out}"\nassert took < 0.5, f"took {took:.2f} s: run the jobs at the same time with asyncio.gather"' },
          { label: '`with_timeout` returns the result, or `"timed out"`', code: 'import asyncio, time\nassert asyncio.run(with_timeout(fetch("quick", 0.01), 1)) == "quick done"\nt0 = time.perf_counter()\nassert asyncio.run(with_timeout(fetch("slow", 1), 0.1)) == "timed out"\nassert time.perf_counter() - t0 < 0.6, "it should give up after 0.1 s, not wait for the whole second"' },
          { label: '`limited` never runs more than `limit` at once', code: TRACKED + 'g["fetch"] = tracked\ntry:\n    result = asyncio.run(limited([(f"j{i}", 0.05) for i in range(6)], 2))\nfinally:\n    g["fetch"] = real\nassert list(result) == [f"j{i} done" for i in range(6)], f"got {result}"\nassert state["most"] == 2, f"at most {state[\'most\']} job(s) ran at once; the limit was 2 (use an asyncio.Semaphore and gather)"' },
          { label: 'No `time.sleep`', code: 'bad = [n for n in ast.walk(tree) if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr == "sleep" and isinstance(n.func.value, ast.Name) and n.func.value.id == "time"]\nassert not bad, "time.sleep blocks the whole event loop: use await asyncio.sleep(...)"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 9 */
    {
      id: 'py-performance', track: 'advanced',
      title: 'Measuring performance: timeit, cProfile and dis',
      summary: 'Measure before you change anything: timeit for small pieces, cProfile to find where a program spends its time, dis to see the bytecode. Then the changes that usually pay: the right data structure, caching, and letting C code do the looping.',
      keywords: ['performance', 'speed', 'optimize', 'timeit', 'cprofile', 'profile', 'profiler', 'dis', 'bytecode', 'lru_cache', 'cache', 'big o', 'jmh', 'benchmark', 'perf_counter', 'pstats'],
      docs: 'https://docs.python.org/3/library/profile.html',
      body: [
        'The first rule of making code faster: **measure**, because the slow part is rarely where you expect. Python has three measuring tools built in.',
        '## timeit: how fast is this piece?',
        '`timeit` runs a small statement many times and reports the total; `timeit.repeat` does that several times, and the **fastest** run is the one least disturbed by the rest of the computer:',
        py(String.raw`
import timeit

setup = "items = list(range(10_000)); wanted = set(items)"
in_list = min(timeit.repeat("9_999 in items", setup=setup, number=1_000, repeat=5))
in_set = min(timeit.repeat("9_999 in wanted", setup=setup, number=1_000, repeat=5))
print(f"1,000 lookups: in a list {in_list * 1000:.2f} ms, in a set {in_set * 1000:.3f} ms")`),
        'From a terminal: `python -m timeit "sum(range(1000))"`.',
        '## cProfile: where does the time go?',
        'A profiler records every function call of a run: how often each function was called (`ncalls`), the time spent in its own code (`tottime`) and including what it called (`cumtime`):',
        py(String.raw`
import cProfile
import pstats

def normalize(word):
    return word.strip(".,!?").lower()

def count_words(text):
    counts = {}
    for word in text.split():
        w = normalize(word)
        counts[w] = counts.get(w, 0) + 1
    return counts

def report(text):
    counts = count_words(text * 300)
    return sorted(counts.items(), key=lambda kv: -kv[1])[:3]

profiler = cProfile.Profile()
print(profiler.runcall(report, "The cat sat. The cat ran! A dog sat? "))
pstats.Stats(profiler).sort_stats("tottime").print_stats(4)`),
        'From a terminal, `python -m cProfile -s tottime main.py` profiles a whole program. For a program that is already running, the third-party `py-spy` samples it from outside.',
        '## dis: what does Python actually run?',
        'CPython compiles each function to **bytecode**, the instructions its interpreter executes, as `javac` compiles to JVM bytecode. `dis` shows them, like `javap -c`:',
        py(String.raw`
import dis

def add_tax(price):
    return price * 1.18

dis.dis(add_tax)`),
        'Every instruction costs time, which is why a loop written in Python is slower than the same loop inside a built-in written in C: `sum`, `max`, `sorted`, `str.join`, `any` and comprehensions are fast for that reason.',
        '## What usually helps',
        '| Slow | Faster | Why |\n|---|---|---|\n| `x in big_list`, again and again | `x in big_set` | a hash lookup instead of a scan |\n| `text += piece` in a loop, for big text | `"".join(pieces)` | one copy instead of many |\n| the same call with the same arguments, repeated | `@functools.cache` | each answer is computed once |\n| a Python loop that sums, finds or checks | `sum()`, `max()`, `any()`, a comprehension | the loop runs in C |\n| `items.pop(0)`, `items.insert(0, x)` | `collections.deque` | O(1) at both ends |\n| sorting everything to get the top 3 | `heapq.nlargest(3, items)` | no full sort |\n| a global or an attribute looked up in a hot loop | a local variable | locals are the fastest lookup |',
        'A better algorithm beats every trick in that table: first count how much work the code does (its big-O), then measure.',
        py(String.raw`
import functools
import time

@functools.cache                          # remembers every answer
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

t0 = time.perf_counter()
print(fib(300))
print(f"{(time.perf_counter() - t0) * 1000:.2f} ms;", fib.cache_info())`),
        'Without the cache, `fib(300)` would take longer than the universe has existed.'
      ].join('\n\n'),
      java: '`timeit` is a small JMH, `cProfile` is JFR or async-profiler, `dis` is `javap -c`. The big difference is the JIT: the JVM compiles hot code to machine code, while CPython 3.13 interprets bytecode (an experimental JIT is in the works). So the same algorithm in pure Python is usually several times slower than in Java, and fast Python leans on built-ins and on libraries written in C, such as NumPy, for heavy number work.',
      example: {
        code: String.raw`import timeit

words = ["word"] * 5_000


def with_plus():
    text = ""
    for w in words:
        text += w + " "
    return text


def with_join():
    return " ".join(words) + " "


def with_comprehension_and_join():
    return "".join([w + " " for w in words])


assert with_plus() == with_join() == with_comprehension_and_join()
for fn in (with_plus, with_join, with_comprehension_and_join):
    best = min(timeit.repeat(fn, number=50, repeat=5))
    print(f"{fn.__name__:<28} {best / 50 * 1e6:8.1f} microseconds per call")
`,
        note: 'CPython can sometimes grow a string in place, so `+=` is less bad than its reputation; `join` is still the reliable choice. Measure on your own data.'
      },
      challenge: {
        title: 'Faster, and proved',
        task: [
          '1. `common_items(a, b)` returns the items of `a` that are also in `b`, in `a`\'s order, without repeats. It must make about one comparison per item, not one per pair of items: put `b` in a `set` first.',
          '2. `fib(n)`, the recursive Fibonacci, is sped up with `functools.cache` (or `lru_cache`), so that `fib(200)` answers at once.',
          '3. `most_called(func, *args)` runs `func(*args)` under `cProfile` and returns the name of the Python function (not a built-in) that was called the most times. For `report` below, that is `normalize`.',
          '4. `best_time(stmt, setup)` returns the fastest of 5 `timeit` runs of `stmt`, each executing it 1,000 times, in seconds.'
        ].join('\n\n'),
        starter: String.raw`import timeit


def common_items(a, b):
    result = []
    for x in a:
        if x in b and x not in result:
            result.append(x)
    return result


def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)


def normalize(word):
    return word.strip(".,!?").lower()


def report(text):
    counts = {}
    for word in text.split():
        w = normalize(word)
        counts[w] = counts.get(w, 0) + 1
    return sorted(counts, key=lambda w: -counts[w])[:3]


def most_called(func, *args):
    func(*args)
    return func.__name__


def best_time(stmt, setup="pass"):
    return timeit.timeit(stmt, setup, number=1000)


print(common_items([3, 1, 2, 3, 5], [5, 3, 9]), fib(20), report("a b. A c a b"))
`,
        solution: String.raw`import cProfile
import functools
import pstats
import timeit


def common_items(a, b):
    wanted = set(b)
    seen = set()
    result = []
    for x in a:
        if x in wanted and x not in seen:
            seen.add(x)
            result.append(x)
    return result


@functools.cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)


def normalize(word):
    return word.strip(".,!?").lower()


def report(text):
    counts = {}
    for word in text.split():
        w = normalize(word)
        counts[w] = counts.get(w, 0) + 1
    return sorted(counts, key=lambda w: -counts[w])[:3]


def most_called(func, *args):
    profiler = cProfile.Profile()
    profiler.runcall(func, *args)
    stats = pstats.Stats(profiler).stats        # {(file, line, name): (cc, ncalls, tottime, cumtime, callers)}
    python_functions = {key: value for key, value in stats.items() if key[0] != "~"}
    key, _ = max(python_functions.items(), key=lambda kv: kv[1][1])
    return key[2]


def best_time(stmt, setup="pass"):
    return min(timeit.repeat(stmt, setup, number=1000, repeat=5))


print(common_items([3, 1, 2, 3, 5], [5, 3, 9]), fib(200), most_called(report, "a b. A c a b"))
`,
        hints: [
          '`common_items`: `wanted = set(b)` once, then loop over `a`, keeping `x` when `x in wanted` and it is not already in a second set `seen`.',
          'Put `@functools.cache` on the line above `def fib`. The recursive calls go through the cached function too.',
          '`most_called`: `profiler = cProfile.Profile()`, `profiler.runcall(func, *args)`, then `pstats.Stats(profiler).stats` is a dict from `(file, line, name)` to `(cc, ncalls, ...)`. Built-ins have the file `"~"`: skip them, and pick the key with the largest `ncalls`.',
          '`best_time`: `min(timeit.repeat(stmt, setup, number=1000, repeat=5))`.'
        ],
        checks: [
          { label: '`common_items` keeps `a`\'s order, without repeats', code: 'assert common_items([3, 1, 2, 3, 5], [5, 3, 9]) == [3, 5]\nassert common_items(list("banana"), "an") == ["a", "n"]\nassert common_items([], [1]) == [] and common_items([1], []) == []' },
          { label: '`common_items` makes about one comparison per item', code: COUNTED + 'a = [Item(i) for i in range(300)]\nb = [Item(i) for i in range(150, 450)]\nItem.eq_calls = 0\nresult = common_items(a, b)\nassert [x.v for x in result] == list(range(150, 300))\nassert Item.eq_calls < 1000, f"{Item.eq_calls:,} comparisons for 300 items: put b in a set first"' },
          { label: '`fib` is cached, and `fib(200)` is right', code: 'assert hasattr(fib, "cache_info"), "decorate fib with @functools.cache"\nassert fib(90) == 2880067194370816120\nassert fib(200) == 280571172992510140037611932413038677189525' },
          { label: '`most_called(report, ...)` is `"normalize"`', code: 'assert most_called(report, "The cat sat. The cat ran! " * 5) == "normalize"' },
          { label: '`most_called` works for any function, using cProfile', code: 'def leaf(x):\n    return x + 1\ndef branch(n):\n    total = 0\n    for i in range(n):\n        total += leaf(i)\n    return total\nassert most_called(branch, 50) == "leaf"\nassert calls("runcall") or calls("enable") or calls("run"), "profile the call with cProfile.Profile()"' },
          { label: '`best_time` is the fastest of 5 `timeit` runs', code: 't = best_time("sum(range(100))", "pass")\nassert isinstance(t, float) and 0 < t < 1, f"got {t!r}"\nassert calls("repeat"), "use timeit.repeat(..., number=1000, repeat=5) and take the min"' }
        ]
      }
    }
  );
})(window.PYLT);
