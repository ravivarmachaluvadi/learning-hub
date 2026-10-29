/*
 * The Reference (#/reference), part 1: its groups, the built-in functions, the built-in constants and
 * the built-in exceptions. The other parts: data/reference-types.js (the methods of str, list, dict,
 * set and tuple), data/reference-language.js (keywords, operators, special methods) and
 * data/reference-modules.js (the 25 most-used standard-library modules).
 *
 * Entry shape: {id, group, name, title, sig, summary (Markdown), java (Markdown), example (Python),
 *               output (exactly what the example prints), covers?: [other names it explains],
 *               stdin?, runtimes?: ['server'], docs?, members?: [names, for a module's autocomplete]}
 *
 * tests/check_data.py proves the Reference covers every public name in this Python's dir(builtins),
 * dir(str), dir(list), dir(dict), dir(set), dir(tuple) and every keyword (enumerated, never typed in).
 * tests/test_content.py runs every example on your Python and tests/test_ui.py ("reference") in the
 * browser's: each must print exactly its `output`.
 */
(function (U) {
  var R = U.data.reference = U.data.reference || [];
  var BS = String.fromCharCode(92), NL = String.fromCharCode(10);   // a backslash and a newline, spelled out
  function nl(s) { return /\n$/.test(s) ? s : s + '\n'; }
  function add(group, prefix, titleOf, rows) {
    rows.forEach(function (r) {
      var e = { id: prefix + (r.key || r.name).toLowerCase(), group: group, name: r.name, title: r.title || titleOf(r.name),
        sig: r.sig, summary: r.summary, java: r.java, example: nl(r.example), output: nl(r.output) };
      ['covers', 'stdin', 'runtimes', 'docs', 'members'].forEach(function (k) { if (r[k]) e[k] = r[k]; });
      R.push(e);
    });
  }

  U.data.refGroups = [
    { id: 'functions', title: 'Built-in functions', docs: 'https://docs.python.org/3/library/functions.html',
      intro: 'Always there, with no import: `print`, `len`, `range`, and the types you call to make or convert values (`int("42")`, `list(...)`). Java spreads these over `Math`, `Integer`, `Collections` and `System`.' },
    { id: 'constants', title: 'Built-in constants', docs: 'https://docs.python.org/3/library/constants.html',
      intro: '`True`, `False` and `None` (Java\'s `true`, `false` and `null`), and two rarer ones.' },
    { id: 'str', title: 'str methods', docs: 'https://docs.python.org/3/library/stdtypes.html#string-methods',
      intro: 'Every method of `str`. A string never changes: each method returns a **new** string, as in Java.' },
    { id: 'list', title: 'list methods', docs: 'https://docs.python.org/3/library/stdtypes.html#mutable-sequence-types',
      intro: 'Every method of `list`, Python\'s `ArrayList`. Most change the list in place and return `None`.' },
    { id: 'dict', title: 'dict methods', docs: 'https://docs.python.org/3/library/stdtypes.html#mapping-types-dict',
      intro: 'Every method of `dict`, Python\'s `HashMap`, which also keeps the order keys were added in, like a `LinkedHashMap`.' },
    { id: 'set', title: 'set methods', docs: 'https://docs.python.org/3/library/stdtypes.html#set-types-set-frozenset',
      intro: 'Every method of `set`, Python\'s `HashSet`. Most also have an operator: `|` union, `&` intersection, `-` difference, `^` symmetric difference.' },
    { id: 'tuple', title: 'tuple methods', docs: 'https://docs.python.org/3/library/stdtypes.html#common-sequence-operations',
      intro: 'A tuple cannot change, so it has only two methods. Everything else is the common sequence operations: `len`, `in`, indexing, slicing.' },
    { id: 'keywords', title: 'Keywords', docs: 'https://docs.python.org/3/reference/lexical_analysis.html#keywords',
      intro: 'Every reserved word, and the four soft keywords (`match`, `case`, `_`, `type`), which are keywords only where their statement allows.' },
    { id: 'operators', title: 'Operators', docs: 'https://docs.python.org/3/reference/expressions.html',
      intro: 'What each operator does, and the special method a class defines to support it.' },
    { id: 'dunders', title: 'Special methods', docs: 'https://docs.python.org/3/reference/datamodel.html#special-method-names',
      intro: 'The "dunder" (double underscore) methods Python calls for you: `len(x)` calls `x.__len__()`, `a == b` calls `a.__eq__(b)`. They are how your classes join in with the language.' },
    { id: 'exceptions', title: 'Built-in exceptions', docs: 'https://docs.python.org/3/library/exceptions.html',
      intro: 'Every built-in exception, the common ones one by one and the rare ones with their family. All of them are unchecked: there is no `throws`.' },
    { id: 'modules', title: 'Standard-library modules', docs: 'https://docs.python.org/3/library/index.html',
      intro: 'The 25 modules you will import most, each with the names you will use. They come with Python: no pip, no Maven.' }
  ];

  /* ---------------------------------------------------------------- built-in functions */

  add('functions', 'fn-', function (n) { return n + '()'; }, [
    { name: 'abs', sig: 'abs(x)', summary: 'The absolute value of a number; for a complex number, its length.', java: '`Math.abs(x)`',
      example: String.raw`print(abs(-7), abs(3.5), abs(-0.25))
print(abs(3 + 4j))          # a complex number's length`,
      output: String.raw`7 3.5 0.25
5.0` },
    { name: 'aiter', title: 'aiter() and anext()', covers: ['anext'], sig: 'aiter(async_iterable), anext(async_iterator[, default])',
      summary: 'The `async` versions of `iter()` and `next()`, for asynchronous generators and iterators. Use them inside an `async def`, with `await`.',
      java: 'No direct equivalent; reactive streams (`Flow.Publisher`) fill this role.',
      example: String.raw`import asyncio

async def countdown(n):
    while n > 0:
        yield n
        n -= 1

async def main():
    it = aiter(countdown(2))
    print(await anext(it))
    print(await anext(it))
    print(await anext(it, "done"))

asyncio.run(main())`,
      output: String.raw`2
1
done` },
    { name: 'all', sig: 'all(iterable)', summary: '`True` when every item is truthy (and for an empty iterable). Stops at the first false one.', java: '`stream.allMatch(predicate)`',
      example: String.raw`print(all([True, 1, "x"]))
print(all([1, 0, 2]))
print(all([]))                      # True: nothing failed
scores = [72, 88, 95]
print(all(s >= 50 for s in scores))`,
      output: String.raw`True
False
True
True` },
    { name: 'any', sig: 'any(iterable)', summary: '`True` when at least one item is truthy. Stops at the first true one; `False` for an empty iterable.', java: '`stream.anyMatch(predicate)`',
      example: String.raw`print(any([0, "", None, 3]))
print(any([]))                      # False: nothing passed
words = ["apple", "Kiwi", "fig"]
print(any(w[0].isupper() for w in words))`,
      output: String.raw`True
False
True` },
    { name: 'ascii', sig: 'ascii(obj)', summary: 'Like `repr()`, but every character outside ASCII is written as a backslash escape: `' + BS + 'xe9` for é.', java: 'No direct equivalent (Apache Commons `StringEscapeUtils.escapeJava`).',
      example: String.raw`print(ascii("café"), ascii("naïve"))
print(repr("café"))`,
      output: "'caf" + BS + "xe9' 'na" + BS + "xefve'" + NL + "'café'" },
    { name: 'bin', sig: 'bin(n)', summary: 'An integer as a binary string starting with `0b`. `int(text, 2)` goes back; the format spec `b` leaves the prefix out.', java: '`Integer.toBinaryString(n)`',
      example: String.raw`print(bin(10), bin(-5))
print(int("1010", 2))
print(f"{10:08b}")`,
      output: String.raw`0b1010 -0b101
10
00001010` },
    { name: 'bool', sig: 'bool(x)', summary: 'The type of `True` and `False`, and the truth value of anything: zero, empty containers, `""` and `None` are false; everything else is true.', java: '`boolean`. Java has no truthiness: write `x != 0` or `!s.isEmpty()`.',
      example: String.raw`print(bool(0), bool(42), bool(""), bool("no"), bool([]), bool([0]))
print(bool(None), True + True)`,
      output: String.raw`False True False True False True
False 2` },
    { name: 'breakpoint', sig: 'breakpoint()', summary: 'Stops the program in the debugger (`pdb`) at this line: inspect the variables, then type `c` to continue. The environment variable `PYTHONBREAKPOINT=0` turns every call off. Lesson: [[lesson:py-logging-debugging]].', java: 'A breakpoint in IntelliJ\'s gutter, but written in the code.',
      example: String.raw`import os
os.environ["PYTHONBREAKPOINT"] = "0"    # 0 turns breakpoint() off, so this example runs straight through
total = 0
for n in range(3):
    total += n
    breakpoint()                        # with the debugger on, Python would stop here
print("total:", total)`,
      output: String.raw`total: 3` },
    { name: 'bytearray', sig: 'bytearray(source)', summary: 'A sequence of bytes that can change: set single bytes, append, extend.', java: '`byte[]`, or a `ByteArrayOutputStream`',
      example: String.raw`data = bytearray(b"hello")
data[0] = ord("J")
data.extend(b"!!")
print(data, len(data))
print(data.decode())`,
      output: String.raw`bytearray(b'Jello!!') 7
Jello!!` },
    { name: 'bytes', sig: 'bytes(source), b"..."', summary: 'An unchangeable sequence of bytes: what files, sockets and hashes deal in. `text.encode()` makes bytes, `data.decode()` makes text.', java: '`byte[] b = s.getBytes(StandardCharsets.UTF_8)`',
      example: String.raw`b = "naïve".encode("utf-8")
print(b, len(b))
print(b.decode("utf-8"))
print(bytes([72, 105]), b[0])`,
      output: String.raw`b'na\xc3\xafve' 6
naïve
b'Hi' 110` },
    { name: 'callable', sig: 'callable(obj)', summary: '`True` when `obj(...)` can be called: functions, classes, methods, and objects with a `__call__` method.', java: 'Roughly `obj instanceof Function`.',
      example: String.raw`def greet():
    return "hi"

print(callable(greet), callable(len), callable(str), callable("text"))`,
      output: String.raw`True True True False` },
    { name: 'chr', sig: 'chr(code)', summary: 'The one-character string for a Unicode code point. `ord()` goes back.', java: '`(char) 65`, or `Character.toString(8364)`',
      example: String.raw`print(chr(65), chr(97), chr(8364))
print([chr(c) for c in range(ord("a"), ord("e"))])`,
      output: String.raw`A a €
['a', 'b', 'c', 'd']` },
    { name: 'classmethod', sig: '@classmethod', summary: 'Makes a method receive the **class** (`cls`) instead of an object. Used for alternative constructors, which then work for subclasses too. Lesson: [[lesson:py-classmethods]].', java: 'A `static` factory method, `Temperature.fromFahrenheit(212)`, but one that knows which subclass it was called on.',
      example: String.raw`class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @classmethod
    def from_fahrenheit(cls, f):
        return cls((f - 32) * 5 / 9)

t = Temperature.from_fahrenheit(212)
print(t.celsius, type(t).__name__)`,
      output: String.raw`100.0 Temperature` },
    { name: 'compile', sig: 'compile(source, filename, mode)', summary: 'Turns source text into a code object that `exec()` or `eval()` runs. Reports syntax errors without running anything.', java: 'The compiler API, `javax.tools.JavaCompiler`.',
      example: String.raw`code = compile("x * 2 + 1", "<formula>", "eval")
print(eval(code, {"x": 5}))
try:
    compile("x = (1,", "<typed>", "exec")
except SyntaxError as e:
    print("SyntaxError:", e.msg)`,
      output: String.raw`11
SyntaxError: '(' was never closed` },
    { name: 'complex', sig: 'complex(real, imag)', summary: 'A complex number. Literals use `j`: `3 + 4j`.', java: 'None built in (Apache Commons Math `Complex`).',
      example: String.raw`z = complex(3, 4)
print(z, z.real, z.imag, abs(z))
print((1 + 2j) * (3 - 1j))`,
      output: String.raw`(3+4j) 3.0 4.0 5.0
(5+5j)` },
    { name: 'license', title: 'copyright, credits and license', covers: ['copyright', 'credits'], sig: 'license(), credits, copyright',
      summary: 'Helpers for the interactive prompt (`>>>`): typing them shows Python\'s license, credits and copyright. Programs never use them.',
      java: '`java -version` shows similar information.', docs: 'https://docs.python.org/3/library/constants.html#constants-added-by-the-site-module',
      example: String.raw`print(callable(license), callable(credits))
print(type(copyright).__name__)`,
      output: String.raw`True True
_Printer` },
    { name: 'delattr', sig: 'delattr(obj, name)', summary: 'Deletes an attribute named by a string: `delattr(c, "debug")` is `del c.debug`.', java: 'No equivalent: a Java object\'s fields are fixed when the class compiles.',
      example: String.raw`class Config:
    pass

c = Config()
c.debug = True
print(hasattr(c, "debug"))
delattr(c, "debug")              # the same as: del c.debug
print(hasattr(c, "debug"))`,
      output: String.raw`True
False` },
    { name: 'dict', sig: 'dict(**kwargs), dict(pairs)', summary: 'Makes a dictionary: from keyword arguments, from (key, value) pairs, or from another mapping. The methods are in the [[ref:dict-get|dict group]].', java: '`new HashMap<>()`, `Map.of("a", 1, "b", 2)`',
      example: String.raw`print(dict(a=1, b=2))
print(dict([("x", 10), ("y", 20)]))
print(dict(zip(["k1", "k2"], [1, 2])))
print(dict.fromkeys("ab", 0))`,
      output: String.raw`{'a': 1, 'b': 2}
{'x': 10, 'y': 20}
{'k1': 1, 'k2': 2}
{'a': 0, 'b': 0}` },
    { name: 'dir', sig: 'dir(obj)', summary: 'The names an object has: its attributes and methods, sorted. Handy at the prompt to see what you can call.', java: 'Reflection: `obj.getClass().getMethods()`.',
      example: String.raw`class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def norm(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

p = Point(3, 4)
print([n for n in dir(p) if not n.startswith("_")])
print(len(dir(str)) > 40)`,
      output: String.raw`['norm', 'x', 'y']
True` },
    { name: 'divmod', sig: 'divmod(a, b)', summary: 'The whole-number quotient and the remainder at once: `(a // b, a % b)`.', java: '`a / b` and `a % b`; for negative numbers, `Math.floorDiv` and `Math.floorMod`.',
      example: String.raw`print(divmod(17, 5))
minutes, seconds = divmod(135, 60)
print(f"{minutes}:{seconds:02}")
print(divmod(-7, 2))`,
      output: String.raw`(3, 2)
2:15
(-4, 1)` },
    { name: 'enumerate', sig: 'enumerate(iterable, start=0)', summary: 'Gives (index, item) pairs, so a loop has both without counting by hand.', java: 'A `for (int i = 0; i < list.size(); i++)` loop with `list.get(i)`.',
      example: String.raw`for i, fruit in enumerate(["apple", "fig"]):
    print(i, fruit)
for n, line in enumerate(["first", "second"], start=1):
    print(f"{n}. {line}")`,
      output: String.raw`0 apple
1 fig
1. first
2. second` },
    { name: 'eval', sig: 'eval(expression, globals=None)', summary: 'Works out one expression written as text. Never use it on input you did not write: it runs anything. For data, `ast.literal_eval` is safe.', java: 'No equivalent (a `ScriptEngine` comes closest).',
      example: String.raw`print(eval("2 ** 10"))
print(eval("x + y", {"x": 3, "y": 4}))
import ast
print(ast.literal_eval("[1, 2, {'a': 3}]"))    # safe for data: no calls allowed`,
      output: String.raw`1024
7
[1, 2, {'a': 3}]` },
    { name: 'exec', sig: 'exec(source, globals=None)', summary: 'Runs statements written as text, in a namespace you give it. Like `eval`, never on input you did not write.', java: 'No equivalent (JShell\'s API comes closest).',
      example: String.raw`namespace = {}
exec("def double(n):\n    return n * 2\nresult = double(21)", namespace)
print(namespace["result"])
print(callable(namespace["double"]))`,
      output: String.raw`42
True` },
    { name: 'exit', title: 'exit() and quit()', covers: ['quit'], sig: 'exit(code=None), quit(code=None)',
      summary: 'Leave the interactive prompt. In a program, use `sys.exit()`, which always exists: `exit` and `quit` are added by the `site` module for the prompt.',
      java: '`System.exit(0)`', docs: 'https://docs.python.org/3/library/constants.html#exit',
      example: String.raw`import sys
print("checking the input")
if len(sys.argv) > 99:
    sys.exit("too many arguments")
print("all good")
sys.exit(0)                     # exit code 0: success
print("never printed")`,
      output: String.raw`checking the input
all good` },
    { name: 'filter', sig: 'filter(function, iterable)', summary: 'The items for which the function returns true, lazily. With `None`, the truthy items. A comprehension with `if` is the usual way.', java: '`stream.filter(n -> n > 0)`',
      example: String.raw`nums = [5, -2, 0, 8, -1]
print(list(filter(lambda n: n > 0, nums)))
print(list(filter(None, ["", "a", None, "b"])))
print([n for n in nums if n > 0])          # the usual way`,
      output: String.raw`[5, 8]
['a', 'b']
[5, 8]` },
    { name: 'float', sig: 'float(x)', summary: 'A 64-bit floating-point number, Java\'s `double`. `float("3.14")` parses text; `inf` and `nan` are allowed.', java: '`double`, `Double.parseDouble("3.14")`',
      example: String.raw`print(float("3.14"), float(7), float("1e3"))
print(float("inf") > 10 ** 100, float("nan") == float("nan"))
print(0.1 + 0.2)`,
      output: String.raw`3.14 7.0 1000.0
True False
0.30000000000000004` },
    { name: 'format', sig: 'format(value, spec)', summary: 'Formats one value with a format spec, the same mini-language as after the `:` in an f-string.', java: '`String.format("%,.2f", x)`',
      example: String.raw`print(format(1234567.891, ",.2f"))
print(format(0.256, ".1%"))
print(format(42, "08b"), format(255, "x"))
print(format("left", "<8") + "|")`,
      output: String.raw`1,234,567.89
25.6%
00101010 ff
left    |` },
    { name: 'frozenset', sig: 'frozenset(iterable)', summary: 'A set that cannot change, so it can be a dict key or an item of another set.', java: '`Set.of(...)` (an unmodifiable set)',
      example: String.raw`vowels = frozenset("aeiou")
print("e" in vowels, len(vowels))
pairs = {frozenset({"a", "b"}): "linked"}   # a set cannot be a key; a frozenset can
print(pairs[frozenset({"b", "a"})])`,
      output: String.raw`True 5
linked` },
    { name: 'getattr', sig: 'getattr(obj, name, default)', summary: 'Reads an attribute named by a string, with an optional default when it is missing.', java: 'Reflection: `obj.getClass().getField(name).get(obj)`.',
      example: String.raw`class User:
    name = "Asha"

u = User()
print(getattr(u, "name"))
print(getattr(u, "email", "no email"))
method = "upper"
print(getattr("python", method)())`,
      output: String.raw`Asha
no email
PYTHON` },
    { name: 'globals', sig: 'globals()', summary: 'The module\'s variables, as a live dict.', java: 'No equivalent; the nearest thing is a class\'s static fields.',
      example: String.raw`counter = 10

def show():
    print(globals()["counter"])

show()
print("counter" in globals(), "show" in globals())`,
      output: String.raw`10
True True` },
    { name: 'hasattr', sig: 'hasattr(obj, name)', summary: '`True` when the object has an attribute of that name. The way to ask "can it do this?" in duck typing.', java: '`obj instanceof SomeInterface`, or reflection.',
      example: String.raw`print(hasattr("text", "upper"), hasattr([], "upper"))

class Duck:
    def quack(self):
        return "Quack"

for thing in [Duck(), 42]:
    print(hasattr(thing, "quack"))`,
      output: String.raw`True False
True
False` },
    { name: 'hash', sig: 'hash(obj)', summary: 'The number a dict or set uses to find a key. Equal values have equal hashes; lists and dicts have none, because they can change. See [[explain:dict-hashing]].', java: '`obj.hashCode()`',
      example: String.raw`print(hash(42), hash(42) == hash(42.0))
print(hash((1, 2)) == hash((1, 2)))
try:
    hash([1, 2])
except TypeError as e:
    print("TypeError:", e)`,
      output: String.raw`42 True
True
TypeError: unhashable type: 'list'` },
    { name: 'help', sig: 'help(obj)', summary: 'Prints the documentation of a function, class or module, built from its docstrings. At the prompt, `help()` alone starts an interactive help.', java: 'Javadoc, shown by the IDE.',
      example: String.raw`def area(width, height):
    """Return the area of a rectangle."""
    return width * height

help(area)`,
      output: String.raw`Help on function area in module __main__:

area(width, height)
    Return the area of a rectangle.

` },
    { name: 'hex', sig: 'hex(n)', summary: 'An integer as a hexadecimal string starting with `0x`. `int(text, 16)` goes back.', java: '`Integer.toHexString(n)`',
      example: String.raw`print(hex(255), hex(-16))
print(int("ff", 16), int("0xff", 0))
print(f"{255:x} {255:#06x}")`,
      output: String.raw`0xff -0x10
255 255
ff 0x00ff` },
    { name: 'id', sig: 'id(obj)', summary: 'A number that identifies an object while it lives (in CPython, its memory address). `a is b` means `id(a) == id(b)`.', java: '`System.identityHashCode(obj)`',
      example: String.raw`a = [1, 2]
b = a
c = [1, 2]
print(id(a) == id(b), id(a) == id(c))
print(a is b, a is c)          # is compares identities`,
      output: String.raw`True False
True False` },
    { name: 'input', sig: 'input(prompt="")', summary: 'Prints the prompt and reads one line typed by the user, without its newline. It is always a string: convert with `int()` or `float()`.', java: '`new Scanner(System.in).nextLine()`',
      stdin: 'Asha\n30\n',
      example: String.raw`name = input("Your name: ")
age = int(input("Your age: "))
print(f"{name} will be {age + 1} next year")`,
      output: String.raw`Your name: Asha
Your age: 30
Asha will be 31 next year` },
    { name: 'int', sig: 'int(x), int(text, base)', summary: 'A whole number of any size: Python\'s `int` never overflows. Parses text, cuts the fraction off a float (toward zero).', java: '`int`, `long` and `BigInteger` in one; `Integer.parseInt("42")`',
      example: String.raw`print(int("42") + 1, int(3.99), int(-3.99))
print(int("ff", 16), int("101", 2))
print(2 ** 100)`,
      output: String.raw`43 3 -3
255 5
1267650600228229401496703205376` },
    { name: 'isinstance', sig: 'isinstance(obj, type_or_tuple)', summary: '`True` when the object is of that type or a subclass. Give a tuple to accept several types.', java: '`x instanceof Integer`',
      example: String.raw`print(isinstance(5, int), isinstance(5, (int, float)), isinstance(True, int))
print(isinstance("5", int))`,
      output: String.raw`True True True
False` },
    { name: 'issubclass', sig: 'issubclass(cls, parent)', summary: '`True` when one class inherits from another (or is it).', java: '`Animal.class.isAssignableFrom(Dog.class)`',
      example: String.raw`class Animal:
    pass

class Dog(Animal):
    pass

print(issubclass(Dog, Animal), issubclass(Animal, Dog), issubclass(bool, int))`,
      output: String.raw`True False True` },
    { name: 'iter', sig: 'iter(iterable), iter(callable, sentinel)', summary: 'An iterator over something: what a `for` loop calls first. With two arguments, it calls the function until it returns the sentinel. Lesson: [[lesson:py-iterators]].', java: '`list.iterator()`',
      example: String.raw`it = iter([10, 20])
print(next(it), next(it), next(it, "end"))
import io
lines = io.StringIO("a\nb\n\nc\n")
print(list(iter(lines.readline, "\n")))      # read lines until a blank one`,
      output: String.raw`10 20 end
['a\n', 'b\n']` },
    { name: 'len', sig: 'len(obj)', summary: 'The number of items in anything: characters in a string, items in a list, keys in a dict. One function instead of Java\'s four spellings.', java: '`s.length()`, `list.size()`, `map.size()`, `array.length`',
      example: String.raw`print(len("hello"), len([1, 2, 3]), len({"a": 1}), len(range(10)))`,
      output: String.raw`5 3 1 10` },
    { name: 'list', sig: 'list(iterable)', summary: 'Makes a list from anything you can loop over. The methods are in the [[ref:list-append|list group]].', java: '`new ArrayList<>(collection)`',
      example: String.raw`print(list("abc"))
print(list(range(3)))
print(list({"x": 1, "y": 2}))       # a dict gives its keys`,
      output: String.raw`['a', 'b', 'c']
[0, 1, 2]
['x', 'y']` },
    { name: 'locals', sig: 'locals()', summary: 'The current function\'s local variables, as a dict (a snapshot: changing it does not change the variables).', java: 'No equivalent.',
      example: String.raw`def describe(name, age):
    city = "Pune"
    print(locals())

describe("Asha", 30)`,
      output: String.raw`{'name': 'Asha', 'age': 30, 'city': 'Pune'}` },
    { name: 'map', sig: 'map(function, iterable, ...)', summary: 'Calls the function on each item, lazily. A comprehension is usually clearer: `[f(x) for x in items]`.', java: '`stream.map(x -> x * x)`',
      example: String.raw`print(list(map(str.upper, ["a", "b"])))
print(list(map(lambda x: x * x, [1, 2, 3])))
print(list(map(pow, [2, 3], [3, 2])))
print([x * x for x in [1, 2, 3]])            # the usual way`,
      output: String.raw`['A', 'B']
[1, 4, 9]
[8, 9]
[1, 4, 9]` },
    { name: 'max', sig: 'max(iterable, key=None, default=...), max(a, b, ...)', summary: 'The largest item. `key=` says what to compare by; `default=` is returned for an empty iterable instead of an error.', java: '`Math.max(a, b)`, `Collections.max(list)`, `stream.max(comparator)`',
      example: String.raw`print(max(3, 9, 4), max([2.5, 1.5]))
words = ["fig", "banana", "kiwi"]
print(max(words, key=len))
print(max([], default=0))`,
      output: String.raw`9 2.5
banana
0` },
    { name: 'memoryview', sig: 'memoryview(bytes_like)', summary: 'A window onto the bytes of another object, without copying them. Slicing it makes a smaller window.', java: '`ByteBuffer.wrap(bytes, offset, length)`',
      example: String.raw`data = bytearray(b"abcdef")
view = memoryview(data)[2:4]     # no copy: a window onto data
view[0] = ord("X")
print(data, view.tobytes())`,
      output: String.raw`bytearray(b'abXdef') b'Xd'` },
    { name: 'min', sig: 'min(iterable, key=None, default=...), min(a, b, ...)', summary: 'The smallest item, with the same `key=` and `default=` as `max()`.', java: '`Math.min(a, b)`, `Collections.min(list)`',
      example: String.raw`print(min(3, 9, 4), min("python"))
prices = {"pen": 10, "book": 250, "clip": 2}
print(min(prices, key=prices.get))`,
      output: String.raw`3 h
clip` },
    { name: 'next', sig: 'next(iterator, default)', summary: 'The next item from an iterator; with a default, returns it instead of raising `StopIteration` at the end.', java: '`iterator.next()`; `stream.filter(...).findFirst()` for the "first match" idiom',
      example: String.raw`words = iter(["one", "two"])
print(next(words))
print(next(words))
print(next(words, "no more"))
first_even = next((n for n in [3, 5, 8, 9] if n % 2 == 0), None)
print(first_even)`,
      output: String.raw`one
two
no more
8` },
    { name: 'object', sig: 'object()', summary: 'The base class of every class. A bare `object()` is a unique marker value.', java: '`java.lang.Object`',
      example: String.raw`o = object()
print(type(o).__name__, isinstance(5, object), isinstance(str, object))

class Plain:            # every class inherits from object
    pass

print(Plain.__mro__)`,
      output: String.raw`object True True
(<class '__main__.Plain'>, <class 'object'>)` },
    { name: 'oct', sig: 'oct(n)', summary: 'An integer as an octal string starting with `0o` (file permissions are the usual use).', java: '`Integer.toOctalString(n)`',
      example: String.raw`print(oct(8), oct(493))
print(int("755", 8))`,
      output: String.raw`0o10 0o755
493` },
    { name: 'open', sig: 'open(path, mode="r", encoding=None)', summary: 'Opens a file. Always inside `with`, so it is closed even after an error, and always with `encoding="utf-8"` for text. Modes: `"r"`, `"w"` (replace), `"a"` (append), `"b"` for bytes.', java: '`Files.newBufferedReader(path)` in try-with-resources; `Files.readAllLines(path)`',
      example: String.raw`with open("notes.txt", "w", encoding="utf-8") as f:
    f.write("first line\n")
    f.write("second line\n")

with open("notes.txt", encoding="utf-8") as f:
    for line in f:
        print(line.rstrip())

with open("notes.txt", "a", encoding="utf-8") as f:
    print("appended", file=f)
with open("notes.txt", encoding="utf-8") as f:
    print(len(f.readlines()))`,
      output: String.raw`first line
second line
3` },
    { name: 'ord', sig: 'ord(char)', summary: 'The Unicode code point of a one-character string. `chr()` goes back.', java: '`(int) \'A\'`, `s.codePointAt(0)`',
      example: String.raw`print(ord("A"), ord("a"), ord("€"))
print(ord("b") - ord("a"))`,
      output: String.raw`65 97 8364
1` },
    { name: 'pow', sig: 'pow(base, exp, mod=None)', summary: '`base ** exp`; with a third argument, the remainder modulo it, computed fast (and with `-1`, the modular inverse).', java: '`Math.pow(2, 10)` (a double), `BigInteger.modPow`',
      example: String.raw`print(pow(2, 10), 2 ** 10)
print(pow(3, 4, 5))            # (3 ** 4) % 5
print(pow(2, -1))
print(pow(38, -1, 97))          # the number x with 38 * x % 97 == 1`,
      output: String.raw`1024 1024
1
0.5
23` },
    { name: 'print', sig: 'print(*values, sep=" ", end="\\n", file=sys.stdout)', summary: 'Writes values separated by `sep` and followed by `end`. `end=""` stays on the line; `file=` writes elsewhere.', java: '`System.out.println(...)`; `System.out.print(...)` is `end=""`',
      example: String.raw`print("a", "b", 3)
print("a", "b", sep="-")
print("no newline", end="")
print(" ... continued")
print(f"{'total':<8}{42:>5}")`,
      output: String.raw`a b 3
a-b
no newline ... continued
total      42` },
    { name: 'property', sig: '@property', summary: 'Turns a method into something read like an attribute, `c.area` with no parentheses; `@area.setter` adds a setter. Lesson: [[lesson:py-properties]].', java: 'A getter, `getArea()`, read as if it were a field.',
      example: String.raw`class Circle:
    def __init__(self, radius):
        self.radius = radius

    @property
    def area(self):
        return round(3.14159 * self.radius ** 2, 2)

c = Circle(2)
print(c.area)            # no parentheses: it reads like a field
c.radius = 3
print(c.area)`,
      output: String.raw`12.57
28.27` },
    { name: 'range', sig: 'range(stop), range(start, stop, step=1)', summary: 'The numbers from start up to (not including) stop. It stores only its three numbers, so `range(10**9)` costs nothing.', java: 'A counting `for` loop; `IntStream.range(0, 5)`',
      example: String.raw`print(list(range(5)))
print(list(range(2, 10, 3)))
print(list(range(5, 0, -1)))
r = range(0, 1_000_000_000)
print(len(r), 999 in r, r[10])         # no billion numbers are stored`,
      output: String.raw`[0, 1, 2, 3, 4]
[2, 5, 8]
[5, 4, 3, 2, 1]
1000000000 True 10` },
    { name: 'repr', sig: 'repr(obj)', summary: 'The developer\'s view of a value: strings get their quotes. What the prompt and lists show; `!r` in an f-string. `__repr__` defines it.', java: '`toString()`, the way a debugger shows it',
      example: String.raw`name = "Asha"
print(name, repr(name))
print(repr(3.0), repr([1, "a"]), repr(None))
print(f"{name!r} has {len(name)} letters")`,
      output: String.raw`Asha 'Asha'
3.0 [1, 'a'] None
'Asha' has 4 letters` },
    { name: 'reversed', sig: 'reversed(sequence)', summary: 'The items from last to first, lazily. The sequence itself is not changed.', java: '`Collections.reverse(list)` (in place); `new StringBuilder(s).reverse()`',
      example: String.raw`print(list(reversed([1, 2, 3])))
print("".join(reversed("stressed")))
print(*reversed(range(3)))`,
      output: String.raw`[3, 2, 1]
desserts
2 1 0` },
    { name: 'round', sig: 'round(x, ndigits=None)', summary: 'Rounds to the nearest; a tie goes to the **even** neighbour ("banker\'s rounding"), so `round(2.5)` is 2. Floats like 2.675 are not stored exactly.', java: '`Math.round(x)`, which rounds a tie up; `BigDecimal.setScale(2, RoundingMode.HALF_EVEN)`',
      example: String.raw`print(round(3.14159, 2), round(2.5), round(3.5), round(-2.5))
print(round(1234, -2))
print(round(2.675, 2))          # 2.67: 2.675 is stored as 2.67499999...`,
      output: String.raw`3.14 2 4 -2
1200
2.67` },
    { name: 'set', sig: 'set(iterable)', summary: 'Makes a set: no duplicates, no order, fast `in`. `{}` is an empty **dict**; an empty set is `set()`. The methods are in the [[ref:set-add|set group]].', java: '`new HashSet<>(list)`',
      example: String.raw`print(set([3, 1, 3, 2]))
print(set("hello") == {"h", "e", "l", "o"})
empty = set()            # {} would be an empty dict
print(type(empty).__name__, type({}).__name__)`,
      output: String.raw`{1, 2, 3}
True
set dict` },
    { name: 'setattr', sig: 'setattr(obj, name, value)', summary: 'Sets an attribute named by a string: `setattr(s, "theme", "dark")` is `s.theme = "dark"`.', java: 'Reflection: `field.set(obj, value)`.',
      example: String.raw`class Settings:
    pass

s = Settings()
for key, value in {"theme": "dark", "size": 14}.items():
    setattr(s, key, value)
print(s.theme, s.size)
print(vars(s))`,
      output: String.raw`dark 14
{'theme': 'dark', 'size': 14}` },
    { name: 'slice', sig: 'slice(start, stop, step)', summary: 'The object behind `[start:stop:step]`, for a slice you want to name or reuse.', java: '`s.substring(2, 6)`, `list.subList(2, 6)`',
      example: String.raw`letters = "abcdefgh"
middle = slice(2, 6)
every_other = slice(None, None, 2)
print(letters[middle], letters[every_other], letters[2:6])
print(middle.start, middle.stop, middle.step)`,
      output: String.raw`cdef aceg cdef
2 6 None` },
    { name: 'sorted', sig: 'sorted(iterable, key=None, reverse=False)', summary: 'A new sorted list. `key=` gives what to sort by (a tuple sorts by several things); the sort is stable.', java: '`list.stream().sorted(Comparator.comparing(...)).toList()`',
      example: String.raw`print(sorted([3, 1, 2]))
print(sorted("banana"))
people = [("Ravi", 34), ("Asha", 29), ("Li", 34)]
print(sorted(people, key=lambda p: p[1]))
print(sorted(people, key=lambda p: (-p[1], p[0])))
print(sorted(["b", "A", "c"], key=str.lower, reverse=True))`,
      output: String.raw`[1, 2, 3]
['a', 'a', 'a', 'b', 'n', 'n']
[('Asha', 29), ('Ravi', 34), ('Li', 34)]
[('Li', 34), ('Ravi', 34), ('Asha', 29)]
['c', 'b', 'A']` },
    { name: 'staticmethod', sig: '@staticmethod', summary: 'A function kept inside a class that gets neither the object nor the class. Often a plain module-level function is simpler.', java: 'A `static` method.',
      example: String.raw`class MathUtil:
    @staticmethod
    def clamp(value, low, high):
        return max(low, min(value, high))

print(MathUtil.clamp(15, 0, 10), MathUtil.clamp(-3, 0, 10))`,
      output: String.raw`10 0` },
    { name: 'str', sig: 'str(obj), str(bytes, encoding)', summary: 'Text. `str(x)` is the readable form of any value (its `__str__`). The methods are in the [[ref:str-split|str group]].', java: '`String.valueOf(x)`, `x.toString()`',
      example: String.raw`print(str(42) + "!", str(3.0), str([1, 2]), str(None))
print(str(b"hi", "utf-8"))
print(len(str(2 ** 100)))`,
      output: String.raw`42! 3.0 [1, 2] None
hi
31` },
    { name: 'sum', sig: 'sum(iterable, start=0)', summary: 'Adds the items up. Since Python 3.12 it adds floats with extra care, so ten times 0.1 makes exactly 1.0.', java: '`stream.mapToInt(...).sum()`',
      example: String.raw`print(sum([1, 2, 3]), sum(range(101)))
print(sum([0.1] * 10), 0.1 + 0.1 + 0.1)
print(sum([[1], [2, 3]], []))`,
      output: String.raw`6 5050
1.0 0.30000000000000004
[1, 2, 3]` },
    { name: 'super', sig: 'super()', summary: 'The next class in the method resolution order, to call an overridden method from the override. Lesson: [[lesson:py-inheritance]].', java: '`super.speak()`',
      example: String.raw`class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f"{self.name} makes a sound"

class Dog(Animal):
    def speak(self):
        return super().speak() + ": Woof"

print(Dog("Rex").speak())`,
      output: String.raw`Rex makes a sound: Woof` },
    { name: 'tuple', sig: 'tuple(iterable)', summary: 'Makes a tuple: a fixed sequence that cannot change. One item needs a comma: `(5,)`.', java: 'A `record`, or `List.of(...)`',
      example: String.raw`point = tuple([3, 4])
print(point, tuple("ab"), tuple())
single = (5,)                 # one item needs the comma
print(type(single).__name__, type((5)).__name__)`,
      output: String.raw`(3, 4) ('a', 'b') ()
tuple int` },
    { name: 'type', sig: 'type(obj), type(name, bases, dict)', summary: 'The class of an object. With three arguments it makes a new class, which is what a `class` statement does.', java: '`obj.getClass()`',
      example: String.raw`print(type(42), type("a").__name__, type([]) is list)
Point = type("Point", (), {"x": 0})        # type() with 3 arguments makes a class
print(Point.__name__, Point.x)`,
      output: String.raw`<class 'int'> str True
Point 0` },
    { name: 'vars', sig: 'vars(obj)', summary: 'An object\'s attributes as a dict (its `__dict__`).', java: 'No equivalent; reflection over the fields.',
      example: String.raw`class Book:
    def __init__(self, title, pages):
        self.title = title
        self.pages = pages

print(vars(Book("Python", 300)))`,
      output: String.raw`{'title': 'Python', 'pages': 300}` },
    { name: 'zip', sig: 'zip(*iterables, strict=False)', summary: 'Walks several iterables side by side, giving tuples; stops at the shortest (`strict=True` makes unequal lengths an error).', java: 'No equivalent: a loop over the indexes.',
      example: String.raw`names = ["Asha", "Ravi", "Li"]
ages = [29, 34, 41]
for name, age in zip(names, ages):
    print(name, age)
print(dict(zip(names, ages)))
print(list(zip([1, 2, 3], "ab")))         # stops at the shortest`,
      output: String.raw`Asha 29
Ravi 34
Li 41
{'Asha': 29, 'Ravi': 34, 'Li': 41}
[(1, 'a'), (2, 'b')]` }
  ]);

  /* ---------------------------------------------------------------- built-in constants */

  add('constants', 'const-', function (n) { return n; }, [
    { name: 'True', title: 'True and False', covers: ['False'], sig: 'True, False', summary: 'The two `bool` values, with a capital letter. `bool` is a subclass of `int`, so `True == 1`.', java: '`true`, `false`',
      example: String.raw`print(True, False, type(True).__name__)
print(True == 1, False == 0, True + True)
print(5 > 3, not True)`,
      output: String.raw`True False bool
True True 2
True False` },
    { name: 'None', sig: 'None', summary: 'The one "no value" object, returned by functions that return nothing. Test for it with `is None`.', java: '`null`',
      example: String.raw`def find(items, target):
    for i, x in enumerate(items):
        if x == target:
            return i
    return None

result = find([4, 5], 9)
print(result, result is None)
print(type(None).__name__, bool(None))`,
      output: String.raw`None True
NoneType False` },
    { name: 'Ellipsis', sig: '... (Ellipsis)', summary: 'The value written `...`. Used as a placeholder body ("to do") and in type hints and array slicing.', java: 'No equivalent.',
      example: String.raw`print(..., Ellipsis, ... is Ellipsis)

def todo():
    ...                    # a placeholder body, like pass

print(todo())`,
      output: String.raw`Ellipsis Ellipsis True
None` },
    { name: 'NotImplemented', sig: 'return NotImplemented', summary: 'What `__eq__`, `__add__` and the other operator methods return to say "I cannot handle that type": Python then tries the other operand.', java: 'No equivalent; `equals` returns `false` for other types.',
      example: String.raw`class Meters:
    def __init__(self, n):
        self.n = n

    def __eq__(self, other):
        if not isinstance(other, Meters):
            return NotImplemented          # "I don't know": Python tries the other side
        return self.n == other.n

print(Meters(3) == Meters(3), Meters(3) == 3)`,
      output: String.raw`True False` }
  ]);

  /* ---------------------------------------------------------------- built-in exceptions */

  add('exceptions', 'exc-', function (n) { return n; }, [
    { name: 'Exception', title: 'Exception and BaseException', covers: ['BaseException'], sig: 'class Exception(BaseException)',
      summary: 'The base of every error a program should catch. `BaseException` sits above it and also holds `KeyboardInterrupt` and `SystemExit`, so `except Exception:` lets Ctrl+C through.',
      java: '`Exception`; `BaseException` is like `Throwable`.',
      example: String.raw`try:
    int("abc")
except Exception as e:
    print(type(e).__name__, "is an Exception:", isinstance(e, Exception))
print(issubclass(Exception, BaseException), issubclass(KeyboardInterrupt, Exception))
print([c.__name__ for c in ValueError.__mro__])`,
      output: String.raw`ValueError is an Exception: True
True False
['ValueError', 'Exception', 'BaseException', 'object']` },
    { name: 'ValueError', sig: 'class ValueError(Exception)', summary: 'The right type but a wrong value: `int("forty-two")`. Raise it yourself for bad arguments.', java: '`IllegalArgumentException`, `NumberFormatException`',
      example: String.raw`for text in ["42", "forty-two"]:
    try:
        print(int(text) * 2)
    except ValueError as e:
        print("ValueError:", e)`,
      output: String.raw`84
ValueError: invalid literal for int() with base 10: 'forty-two'` },
    { name: 'TypeError', sig: 'class TypeError(Exception)', summary: 'An operation on the wrong type, found when the line runs: adding a string to a number, calling with the wrong arguments.', java: 'Mostly a compile error in Java; at run time, `ClassCastException`.',
      example: String.raw`try:
    print("Total: " + 5)
except TypeError as e:
    print("TypeError:", e)
try:
    len(5)
except TypeError as e:
    print("TypeError:", e)`,
      output: String.raw`TypeError: can only concatenate str (not "int") to str
TypeError: object of type 'int' has no len()` },
    { name: 'KeyError', sig: 'class KeyError(LookupError)', summary: 'A dict has no such key. `d.get(key, default)` asks without the risk.', java: 'None: `map.get` returns `null` instead.',
      example: String.raw`ages = {"Asha": 29}
try:
    print(ages["Ravi"])
except KeyError as e:
    print("KeyError:", e)
print(ages.get("Ravi", "unknown"))`,
      output: String.raw`KeyError: 'Ravi'
unknown` },
    { name: 'IndexError', title: 'IndexError and LookupError', covers: ['LookupError'], sig: 'class IndexError(LookupError)',
      summary: 'A sequence index out of range. `LookupError` is the parent of `IndexError` and `KeyError`.', java: '`IndexOutOfBoundsException`',
      example: String.raw`items = [10, 20, 30]
try:
    print(items[3])
except IndexError as e:
    print("IndexError:", e)
print(items[-1])
try:
    {}["x"]
except LookupError as e:          # catches IndexError and KeyError
    print(type(e).__name__)`,
      output: String.raw`IndexError: list index out of range
30
KeyError` },
    { name: 'AttributeError', sig: 'class AttributeError(Exception)', summary: 'The object has no attribute or method of that name: often a Java name such as `push`, or a `None` where an object was expected.', java: 'A compile error ("cannot find symbol"); on `null`, `NullPointerException`.',
      example: String.raw`try:
    [1, 2].push(3)
except AttributeError as e:
    print("AttributeError:", e)
try:
    None.upper()
except AttributeError as e:
    print("AttributeError:", e)`,
      output: String.raw`AttributeError: 'list' object has no attribute 'push'
AttributeError: 'NoneType' object has no attribute 'upper'` },
    { name: 'NameError', title: 'NameError and UnboundLocalError', covers: ['UnboundLocalError'], sig: 'class NameError(Exception)',
      summary: 'A name nobody assigned (often a typo). `UnboundLocalError`: a function assigns the name, so it is local there, but it is read before the assignment.', java: 'A compile error.',
      example: String.raw`try:
    print(totl)
except NameError as e:
    print("NameError:", e)

count = 0

def add_one():
    count += 1

try:
    add_one()
except UnboundLocalError as e:
    print("UnboundLocalError:", e)`,
      output: String.raw`NameError: name 'totl' is not defined
UnboundLocalError: cannot access local variable 'count' where it is not associated with a value` },
    { name: 'ZeroDivisionError', title: 'ZeroDivisionError and other arithmetic errors', covers: ['ArithmeticError', 'OverflowError', 'FloatingPointError'], sig: 'class ZeroDivisionError(ArithmeticError)',
      summary: 'Division by zero, for floats too. `OverflowError`: a float result too large. `ArithmeticError` is their parent (`FloatingPointError` is no longer raised).',
      java: '`ArithmeticException: / by zero`, for ints only: Java\'s `1.0 / 0` is `Infinity`.',
      example: String.raw`import math

for a, b in [(10, 2), (1, 0)]:
    try:
        print(a / b)
    except ZeroDivisionError as e:
        print("ZeroDivisionError:", e)
try:
    math.exp(1000)
except OverflowError as e:
    print("OverflowError:", e)
print(issubclass(ZeroDivisionError, ArithmeticError))`,
      output: String.raw`5.0
ZeroDivisionError: division by zero
OverflowError: math range error
True` },
    { name: 'FileNotFoundError', sig: 'class FileNotFoundError(OSError)', summary: 'Opening or reading a file that does not exist.', java: '`FileNotFoundException`, `NoSuchFileException`',
      example: String.raw`try:
    open("missing.txt", encoding="utf-8")
except FileNotFoundError as e:
    print("FileNotFoundError:", e.filename, "-", e.strerror)
print(issubclass(FileNotFoundError, OSError))`,
      output: String.raw`FileNotFoundError: missing.txt - No such file or directory
True` },
    { name: 'OSError', title: 'OSError and its family', sig: 'class OSError(Exception)',
      covers: ['IOError', 'EnvironmentError', 'WindowsError', 'BlockingIOError', 'ChildProcessError', 'ConnectionError', 'BrokenPipeError', 'ConnectionAbortedError',
        'ConnectionRefusedError', 'ConnectionResetError', 'FileExistsError', 'InterruptedError', 'IsADirectoryError', 'NotADirectoryError', 'PermissionError', 'ProcessLookupError', 'TimeoutError'],
      summary: 'Anything the operating system refuses: files, folders, permissions, processes, network connections. Each case has a subclass (`PermissionError`, `FileExistsError`, `ConnectionRefusedError`, `TimeoutError`…). `IOError`, `EnvironmentError` and, on Windows, `WindowsError` are old names for `OSError` itself.',
      java: '`IOException` and its subclasses.',
      example: String.raw`import os

os.makedirs("reports", exist_ok=True)
try:
    os.mkdir("reports")
except FileExistsError as e:
    print(type(e).__name__, "is an OSError:", isinstance(e, OSError))
print(IOError is OSError, EnvironmentError is OSError)
print(issubclass(PermissionError, OSError), issubclass(TimeoutError, OSError))`,
      output: String.raw`FileExistsError is an OSError: True
True True
True True` },
    { name: 'ImportError', title: 'ImportError and ModuleNotFoundError', covers: ['ModuleNotFoundError'], sig: 'class ModuleNotFoundError(ImportError)',
      summary: '`ModuleNotFoundError`: no module of that name (not installed, or a typo). `ImportError`: the module exists but has no such name.', java: '`ClassNotFoundException`, `NoClassDefFoundError`',
      example: String.raw`try:
    import numpyy
except ModuleNotFoundError as e:
    print("ModuleNotFoundError:", e)
try:
    from math import squareroot
except ImportError as e:
    print("ImportError for", e.name)`,
      output: String.raw`ModuleNotFoundError: No module named 'numpyy'
ImportError for math` },
    { name: 'StopIteration', title: 'StopIteration, StopAsyncIteration and GeneratorExit', covers: ['StopAsyncIteration', 'GeneratorExit'], sig: 'class StopIteration(Exception)',
      summary: 'How an iterator says "no more items": `for` loops catch it for you. `StopAsyncIteration` is the `async` version; `GeneratorExit` is raised inside a generator when it is closed.',
      java: '`NoSuchElementException` from `iterator.next()`',
      example: String.raw`it = iter([1])
print(next(it))
try:
    next(it)
except StopIteration:
    print("StopIteration: the iterator is used up")

def gen():
    try:
        yield 1
    finally:
        print("cleanup on close")

g = gen()
next(g)
g.close()              # raises GeneratorExit inside the generator`,
      output: String.raw`1
StopIteration: the iterator is used up
cleanup on close` },
    { name: 'AssertionError', sig: 'class AssertionError(Exception)', summary: 'An `assert` that failed. pytest reports these with the values involved.', java: '`AssertionError` (Java\'s `assert` is off unless `-ea`)',
      example: String.raw`def average(nums):
    assert nums, "average() needs at least one number"
    return sum(nums) / len(nums)

print(average([2, 4]))
try:
    average([])
except AssertionError as e:
    print("AssertionError:", e)`,
      output: String.raw`3.0
AssertionError: average() needs at least one number` },
    { name: 'RuntimeError', title: 'RuntimeError and RecursionError', covers: ['RecursionError', 'PythonFinalizationError'], sig: 'class RecursionError(RuntimeError)',
      summary: 'An error that fits no other type. `RecursionError`: too many nested calls (the limit is about 1,000). `PythonFinalizationError` happens only while Python shuts down.',
      java: '`RuntimeException`; `StackOverflowError` for too deep recursion.',
      example: String.raw`def forever(n):
    return forever(n + 1)

try:
    forever(0)
except RecursionError as e:
    print("RecursionError:", e)
print(issubclass(RecursionError, RuntimeError))`,
      output: String.raw`RecursionError: maximum recursion depth exceeded
True` },
    { name: 'NotImplementedError', sig: 'class NotImplementedError(RuntimeError)', summary: 'Raise it in a method a subclass must provide. (Not the same as the constant `NotImplemented`.) `abc.abstractmethod` is the stricter way.', java: '`UnsupportedOperationException`, or an `abstract` method.',
      example: String.raw`class Shape:
    def area(self):
        raise NotImplementedError("subclasses must define area()")

class Square(Shape):
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side ** 2

print(Square(3).area())
try:
    Shape().area()
except NotImplementedError as e:
    print("NotImplementedError:", e)`,
      output: String.raw`9
NotImplementedError: subclasses must define area()` },
    { name: 'SyntaxError', title: 'SyntaxError, IndentationError and TabError', covers: ['IndentationError', 'TabError'], sig: 'class IndentationError(SyntaxError)',
      summary: 'Code Python cannot read, found before anything runs. `IndentationError`: the blocks do not line up; `TabError`: tabs and spaces mixed.', java: 'A compile error.',
      example: String.raw`for source in ["x = (1, 2", "if True:\nprint('hi')", "print('ok')"]:
    try:
        compile(source, "snippet", "exec")
        print("compiles:", source)
    except SyntaxError as e:
        print(type(e).__name__ + ":", e.msg)`,
      output: String.raw`SyntaxError: '(' was never closed
IndentationError: expected an indented block after 'if' statement on line 1
compiles: print('ok')` },
    { name: 'KeyboardInterrupt', title: 'KeyboardInterrupt and SystemExit', covers: ['SystemExit'], sig: 'class KeyboardInterrupt(BaseException)',
      summary: 'Ctrl+C, and `sys.exit()`. Both derive from `BaseException`, not `Exception`, so `except Exception:` does not stop the user or the exit.',
      java: 'Ctrl+C runs shutdown hooks; `System.exit` cannot be caught.',
      example: String.raw`import sys

try:
    sys.exit(3)
except SystemExit as e:
    print("SystemExit with code", e.code)
print(issubclass(KeyboardInterrupt, Exception), issubclass(SystemExit, BaseException))
try:
    raise KeyboardInterrupt
except KeyboardInterrupt:
    print("Ctrl+C was pressed (here: pretended)")`,
      output: String.raw`SystemExit with code 3
False True
Ctrl+C was pressed (here: pretended)` },
    { name: 'UnicodeError', title: 'Unicode errors', covers: ['UnicodeDecodeError', 'UnicodeEncodeError', 'UnicodeTranslateError'], sig: 'class UnicodeDecodeError(UnicodeError)',
      summary: 'Bytes that are not valid in the encoding (decoding), or text the encoding cannot hold (encoding). `errors="replace"` puts a marker in instead.', java: '`CharacterCodingException`, `MalformedInputException`',
      example: String.raw`data = "café".encode("utf-8")
try:
    data.decode("ascii")
except UnicodeDecodeError as e:
    print("UnicodeDecodeError:", e.reason, "at byte", e.start)
try:
    "café".encode("ascii")
except UnicodeEncodeError as e:
    print("UnicodeEncodeError:", e.reason)
print(data.decode("ascii", errors="replace"))`,
      output: String.raw`UnicodeDecodeError: ordinal not in range(128) at byte 3
UnicodeEncodeError: ordinal not in range(128)
caf${'\uFFFD\uFFFD'}` },
    { name: 'ExceptionGroup', title: 'ExceptionGroup and BaseExceptionGroup', covers: ['BaseExceptionGroup'], sig: 'ExceptionGroup(message, [exceptions])',
      summary: 'Several errors raised together (from parallel tasks, or a validation that collects every problem). `except*` handles each type inside the group.', java: 'Suppressed exceptions, `e.addSuppressed(other)`, come closest.',
      example: String.raw`def check(order):
    errors = []
    if not order.get("item"):
        errors.append(ValueError("no item"))
    if order.get("qty", 0) <= 0:
        errors.append(ValueError("qty must be positive"))
    if errors:
        raise ExceptionGroup("invalid order", errors)

try:
    check({"qty": 0})
except* ValueError as group:
    for e in group.exceptions:
        print("ValueError:", e)`,
      output: String.raw`ValueError: no item
ValueError: qty must be positive` },
    { name: 'EOFError', sig: 'class EOFError(Exception)', summary: '`input()` found no more input (end of file, or Ctrl+Z / Ctrl+D typed).', java: '`NoSuchElementException` from `Scanner.nextLine()`',
      stdin: 'yes\nno\n',
      example: String.raw`answers = []
while True:
    try:
        answers.append(input())
    except EOFError:            # input() found no more lines
        break
print(answers)`,
      output: String.raw`yes
no
['yes', 'no']` },
    { name: 'Warning', title: 'Warnings', sig: 'warnings.warn(message, category)',
      covers: ['UserWarning', 'DeprecationWarning', 'PendingDeprecationWarning', 'SyntaxWarning', 'RuntimeWarning', 'FutureWarning', 'ImportWarning', 'UnicodeWarning', 'BytesWarning', 'ResourceWarning', 'EncodingWarning'],
      summary: 'A warning is printed, not raised, unless a filter says otherwise. The categories: `UserWarning` (the default), `DeprecationWarning`, `FutureWarning`, `SyntaxWarning`, `RuntimeWarning`, `ResourceWarning` (an unclosed file), `EncodingWarning` (an `open()` without an encoding) and a few rarer ones.',
      java: '`@Deprecated`, and the compiler\'s warnings.',
      example: String.raw`import warnings

def old_api():
    warnings.warn("old_api() is deprecated; use new_api()", DeprecationWarning, stacklevel=2)
    return 1

with warnings.catch_warnings(record=True) as caught:
    warnings.simplefilter("always")
    old_api()
print(caught[0].category.__name__, "-", caught[0].message)
print(issubclass(DeprecationWarning, Warning), issubclass(Warning, Exception))`,
      output: String.raw`DeprecationWarning - old_api() is deprecated; use new_api()
True True` },
    { name: 'MemoryError', title: 'Rare errors: MemoryError, ReferenceError and others', covers: ['ReferenceError', 'SystemError', 'BufferError'], sig: 'class MemoryError(Exception)',
      summary: '`MemoryError`: out of memory. `ReferenceError`: a weak reference whose object is gone. `SystemError`: a bug inside Python itself. `BufferError`: a buffer that cannot be changed right now.',
      java: '`OutOfMemoryError` (an `Error`, not an `Exception`).',
      example: String.raw`import weakref

class Node:
    pass

n = Node()
proxy = weakref.proxy(n)
del n                      # the last strong reference is gone, so is the object
try:
    print(proxy.value)
except ReferenceError as e:
    print("ReferenceError:", e)
print(issubclass(MemoryError, Exception))`,
      output: String.raw`ReferenceError: weakly-referenced object no longer exists
True` }
  ]);
})(window.PYLT);
