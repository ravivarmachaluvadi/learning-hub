/*
 * Lessons, track 3: Functions in depth. The lesson shape is described at the top of
 * data/lessons-basics.js; every ```python block must run (tests/test_content.py runs them all).
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  function block(lang, lines) { return '```' + lang + '\n' + lines.join('\n') + '\n```'; }
  function py() { return block('python', [].slice.call(arguments)); }
  function java() { return block('java', [].slice.call(arguments)); }

  L.push(
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'py-args-kwargs', track: 'functions',
      title: '*args, **kwargs and keyword-only arguments',
      summary: 'Functions that take any number of arguments, arguments that must be named, positional-only parameters, and unpacking a list or dict into a call.',
      keywords: ['*args', '**kwargs', 'args', 'kwargs', 'varargs', 'keyword-only', 'positional-only', 'unpacking', 'splat', 'parameters', 'arguments', 'named arguments'],
      docs: 'https://docs.python.org/3/tutorial/controlflow.html#more-on-defining-functions',
      body: [
        '## *args: any number of positional arguments',
        'A parameter with one star collects the extra positional arguments into a **tuple**:',
        py('def total(*numbers):',
           '    print(type(numbers).__name__, numbers)',
           '    return sum(numbers)',
           '',
           'print(total(1, 2, 3))',
           'print(total())'),
        '## **kwargs: any number of named arguments',
        'Two stars collect the extra keyword arguments into a **dict**:',
        py('def describe(name, **details):',
           '    print(name, details)',
           '',
           'describe("Asha", city="Pune", role="engineer")'),
        'The names `args` and `kwargs` are only a convention; the stars do the work.',
        '## The full order',
        py('def f(a, b=2, *args, key, flag=False, **kwargs):',
           '    print(a, b, args, key, flag, kwargs)',
           '',
           'f(1, key="k")',
           'f(1, 3, 4, 5, key="k", flag=True, extra="x")'),
        '| Part | Example | Is passed |\n|---|---|---|\n| normal parameters | `a`, `b=2` | by position or by name |\n| `*args` | the extra positional arguments | as a tuple |\n| after `*args` (or a bare `*`) | `key`, `flag=False` | by name only |\n| `**kwargs` | the extra named arguments | as a dict |',
        '## Keyword-only arguments: a bare *',
        'Parameters after a bare `*` can only be given by name. That keeps calls readable, `connect("db", port=6000)` instead of `connect("db", 6000, 10)`, and lets you add or reorder settings later without breaking callers.',
        py('def connect(host, *, port=5432, timeout=3):',
           '    return f"{host}:{port} (timeout {timeout}s)"',
           '',
           'print(connect("db", port=6000))',
           'connect("db", 6000)        # raises TypeError'),
        '## Positional-only arguments: a /',
        'Parameters before a `/` cannot be given by name. Built-ins use it (`len(obj, /)`) so the parameter names are not part of the contract and may change.',
        py('def power(base, exp, /):',
           '    return base ** exp',
           '',
           'print(power(2, 10))',
           'power(base=2, exp=10)      # raises TypeError'),
        '## Unpacking into a call',
        'In a call, `*` spreads a list or tuple into positional arguments and `**` spreads a dict into keyword arguments:',
        py('def area(width, height):',
           '    return width * height',
           '',
           'size = [3, 4]',
           'print(area(*size))                     # area(3, 4)',
           'opts = {"width": 5, "height": 2}',
           'print(area(**opts))                    # area(width=5, height=2)',
           'print(*["a", "b", "c"], sep="-")       # print("a", "b", "c", sep="-")'),
        'Together, `def wrapper(*args, **kwargs): return func(*args, **kwargs)` passes on any call unchanged. That is the heart of every decorator: [[lesson:py-decorators]].'
      ].join('\n\n'),
      java: '`int total(int... numbers)` is `def total(*numbers)`, but Python collects them into a tuple and also has **named** arguments, which Java has no syntax for: `**kwargs` collects them into a dict, where Java code passes a `Map<String, Object>` or uses a builder. Keyword-only parameters give Python what the builder pattern gives Java: calls that name each setting, `connect("db", port=6000, timeout=10)`, instead of a row of numbers. Spreading `f(*items)` is like passing an array to a varargs method, but it works for any function.',
      js: 'JavaScript\'s rest parameter `(...nums)` is `*nums`, and the spread `f(...arr)` is `f(*arr)`. For named options JavaScript passes one object, `f({ port: 6000 })`; Python has real keyword arguments.',
      example: {
        code: String.raw`def log(level, *messages, sep=" ", **context):
    text = sep.join(str(m) for m in messages)
    extra = " ".join(f"{k}={v}" for k, v in context.items())
    print(f"[{level}] {text}" + (f" ({extra})" if extra else ""))

log("INFO", "server", "started")
log("WARN", "disk", "91%", "full", sep="-")
log("ERROR", "payment failed", user="asha", order=1042)

args = ["DEBUG", "unpacked", "from a list"]
log(*args)
settings = {"sep": " / ", "region": "in"}
log("INFO", "a", "b", **settings)
`,
        note: 'In the last call `sep` matches a parameter, so it is not part of `context`; `region` matches none, so it is.'
      },
      challenge: {
        title: 'An HTML tag builder',
        task: [
          '1. `tag(name, *children, **attrs)` returns an HTML string: `tag("p", "Hello")` is `<p>Hello</p>`.',
          '2. Several children are joined with nothing between them: `tag("p", "a", "b")` is `<p>ab</p>`.',
          '3. Keyword arguments become attributes, in the order given: `tag("a", "Docs", href="/docs")` is `<a href="/docs">Docs</a>`.',
          '4. `class` is a Python keyword, so a trailing underscore is dropped: `class_="note"` becomes `class="note"`.',
          '5. `page(title, *paragraphs, lang="en")` returns `<html lang="en"><h1>title</h1><p>…</p>…</html>`, built with `tag`. `lang` must be keyword-only.'
        ].join('\n\n'),
        starter: String.raw`def tag(name, text):
    return "<" + name + ">" + text + "</" + name + ">"


def page(title, text):
    return tag("html", tag("h1", title) + tag("p", text))


print(tag("p", "Hello"))
print(page("Python", "Easy to read."))
`,
        solution: String.raw`def tag(name, *children, **attrs):
    attributes = "".join(f' {key.rstrip("_")}="{value}"' for key, value in attrs.items())
    return f"<{name}{attributes}>" + "".join(children) + f"</{name}>"


def page(title, *paragraphs, lang="en"):
    return tag("html", tag("h1", title), *(tag("p", p) for p in paragraphs), lang=lang)


print(tag("p", "Hello"))
print(page("Python", "Easy to read.", "Fun to write."))
`,
        hints: [
          '`def tag(name, *children, **attrs):`: `children` is a tuple of the extra positional arguments, `attrs` a dict of the keyword ones.',
          'Build the attributes with a generator expression: `"".join(f\' {k.rstrip("_")}="{v}"\' for k, v in attrs.items())`. A dict keeps the order the keywords were given in.',
          'In `page`, a parameter written after `*paragraphs` is keyword-only. Pass the paragraphs on with a star: `tag("html", tag("h1", title), *(tag("p", p) for p in paragraphs), lang=lang)`.'
        ],
        checks: [
          { label: '`tag("p", "Hello")` is `<p>Hello</p>`', code: 'assert tag("p", "Hello") == "<p>Hello</p>"' },
          { label: 'Several children are joined: `tag("p", "a", "b", "c")` is `<p>abc</p>`', code: 'assert tag("p", "a", "b", "c") == "<p>abc</p>"\nassert tag("div") == "<div></div>"' },
          { label: 'Keyword arguments become attributes, in order', code: String.raw`assert tag("a", "Docs", href="/docs", target="_blank") == '<a href="/docs" target="_blank">Docs</a>'` },
          { label: '`class_="note"` becomes `class="note"`', code: String.raw`assert tag("div", "x", class_="note") == '<div class="note">x</div>'` },
          { label: '`page` takes any number of paragraphs', code: String.raw`assert page("T", "x", "y") == '<html lang="en"><h1>T</h1><p>x</p><p>y</p></html>'
assert page("T") == '<html lang="en"><h1>T</h1></html>'` },
          { label: '`lang` can be given by name only', code: String.raw`assert page("T", "x", lang="hi") == '<html lang="hi"><h1>T</h1><p>x</p></html>'
import inspect
p = inspect.signature(page).parameters.get("lang")
assert p is not None and p.kind is p.KEYWORD_ONLY, "put lang after *paragraphs, so it can only be given by name"` },
          { label: '`tag` has `*children` and `**attrs`', code: 'import inspect\nkinds = [p.kind for p in inspect.signature(tag).parameters.values()]\nassert inspect.Parameter.VAR_POSITIONAL in kinds and inspect.Parameter.VAR_KEYWORD in kinds, "def tag(name, *children, **attrs):"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'py-mutable-defaults', track: 'functions',
      title: 'The mutable default argument trap',
      summary: 'A default value is made once, when def runs, so a list or dict default is shared by every call. Why it happens, how to see it, and the None fix.',
      keywords: ['mutable default', 'default argument', 'trap', 'gotcha', 'none', 'sentinel', '__defaults__', 'shared state', 'list default', 'default value'],
      docs: 'https://docs.python.org/3/tutorial/controlflow.html#default-argument-values',
      body: [
        'This is Python\'s most famous trap. A function adds an item to a list, and the list is optional:',
        py('def add_item(item, items=[]):',
           '    items.append(item)',
           '    return items',
           '',
           'print(add_item("a"))     # [\'a\']',
           'print(add_item("b"))     # [\'a\', \'b\']: not [\'b\']!'),
        '## Why: a default is made once, when def runs',
        'A `def` statement runs once. While it runs, Python works out each default value, here one empty list, and stores it on the function object. Every call that leaves `items` out gets **that same list**, so what one call appends, the next call sees.',
        py('def add_item(item, items=[]):',
           '    items.append(item)',
           '    return items',
           '',
           'add_item("a")',
           'print(add_item.__defaults__)      # ([\'a\'],): the list lives on the function'),
        'Watch the function object hold on to the list in [[viz:mutable-default|Visualize]]. The ⚠ warnings in this tool\'s editors flag a `[]`, `{}` or `set()` default as you type.',
        '## The fix: None, and a new object inside',
        py('def add_item(item, items=None):',
           '    if items is None:',
           '        items = []                # a new list for every call',
           '    items.append(item)',
           '    return items',
           '',
           'print(add_item("a"))     # [\'a\']',
           'print(add_item("b"))     # [\'b\']'),
        'Test with `is None`, not `if not items:`. A caller who passes their own empty list wants that list filled; `not items` would quietly replace it.',
        '## Any default that is worked out',
        'The same holds for a default that calls something. It is called once, at definition time:',
        py('import time',
           '',
           'def stamp(when=time.time()):      # worked out once, when def runs',
           '    return when',
           '',
           'first = stamp()',
           'time.sleep(0.01)',
           'print(stamp() == first)           # True: the same moment, every call'),
        'Numbers, strings, tuples, `None`, `True` and `False` are safe defaults, because they cannot be changed.',
        '## When None is a real value',
        'If callers may pass `None` on purpose, use a private marker object instead:',
        py('_MISSING = object()',
           '',
           'def get(d, key, default=_MISSING):',
           '    if key in d:',
           '        return d[key]',
           '    if default is _MISSING:',
           '        raise KeyError(key)',
           '    return default',
           '',
           'print(get({"a": 1}, "b", None))   # None, given on purpose')
      ].join('\n\n'),
      java: 'Java has no default arguments: you write overloads, and each call of `addItem(item)` runs `new ArrayList<>()` again. In Python the default expression runs **once**, when the `def` statement runs, and its result is stored on the function object (`f.__defaults__`), much like a `static final` field shared by every call. Mutating that shared list is the bug; the `None` default is the Python way to say "make a fresh one".',
      js: 'JavaScript works out default parameters on every call, so `function add(item, items = [])` gets a new array each time. Developers coming from JavaScript fall into this trap too.',
      example: {
        code: String.raw`def register(name, roles=None):
    """Return a user record; each user gets a list of roles of their own."""
    if roles is None:
        roles = []
    roles.append("member")
    return {"name": name, "roles": roles}

asha = register("Asha")
ravi = register("Ravi")
asha["roles"].append("admin")
print(asha)
print(ravi)                          # no admin: separate lists

def broken(name, roles=[]):          # the trap, for comparison
    roles.append("member")
    return {"name": name, "roles": roles}

a = broken("A")
b = broken("B")
print(a["roles"], b["roles"], a["roles"] is b["roles"])
print("broken's default is now:", broken.__defaults__)
`,
        note: 'Press **Visualize** to see `broken` and both records point at one list.'
      },
      challenge: {
        title: 'Fix the shared state',
        task: [
          'Each function in the starter has the trap: it works the first time and goes wrong on the second call. Fix all three with a `None` default, without changing what a single call returns:',
          '1. `add_tag(tag, tags=...)` returns the tags with `tag` appended.',
          '2. `count_words(text, counts=...)` returns a dict of word counts, adding to `counts` when one is passed in.',
          '3. `collect(item, seen=...)` returns the set `seen` with `item` added.',
          'A container the caller passes in must still be the one that is filled and returned.'
        ].join('\n\n'),
        starter: String.raw`def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags


def count_words(text, counts={}):
    for word in text.split():
        counts[word] = counts.get(word, 0) + 1
    return counts


def collect(item, seen=set()):
    seen.add(item)
    return seen


print(add_tag("python"))
print(add_tag("java"))
print(count_words("a b a"))
print(count_words("c"))
print(collect(1), collect(2))
`,
        solution: String.raw`def add_tag(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags


def count_words(text, counts=None):
    if counts is None:
        counts = {}
    for word in text.split():
        counts[word] = counts.get(word, 0) + 1
    return counts


def collect(item, seen=None):
    if seen is None:
        seen = set()
    seen.add(item)
    return seen


print(add_tag("python"))
print(add_tag("java"))
print(count_words("a b a"))
print(count_words("c"))
print(collect(1), collect(2))
`,
        hints: [
          'Change each default to `None`, and make the container at the top of the body: `if tags is None: tags = []`.',
          'Use `is None`, not `if not tags:`. An empty list passed in by the caller is falsy too, and should still be the list that gets filled.',
          'An empty set is written `set()`; `{}` is an empty dict.'
        ],
        checks: [
          { label: 'Two calls of `add_tag` give two separate lists', code: String.raw`first, second = add_tag("x"), add_tag("y")
assert second == ["y"], f"the second call returned {second}: it still holds what earlier calls added"` },
          { label: '`add_tag` still fills a list you pass in', code: 'mine = ["a"]\nassert add_tag("b", mine) is mine and mine == ["a", "b"]\nempty = []\nassert add_tag("z", empty) is empty, "a list passed in, even an empty one, must be the one filled"' },
          { label: 'Two calls of `count_words` count separately', code: 'assert count_words("x y") == {"x": 1, "y": 1} and count_words("y") == {"y": 1}' },
          { label: '`count_words` adds to a dict you pass in', code: 'd = {"x": 5}\nassert count_words("x", d) is d and d == {"x": 6}' },
          { label: 'Two calls of `collect` give two separate sets', code: 'assert collect("p") == {"p"} and collect("q") == {"q"}' },
          { label: 'Every default is `None`', code: 'for fn in (add_tag, count_words, collect):\n    assert all(d is None for d in fn.__defaults__), f"{fn.__name__} still has the default {fn.__defaults__}: use None"' },
          { label: 'It prints separate results', code: 'assert lines == ["[\'python\']", "[\'java\']", "{\'a\': 2, \'b\': 1}", "{\'c\': 1}", "{1} {2}"]' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'py-scope', track: 'functions',
      title: 'Scope: LEGB, global and nonlocal',
      summary: 'How Python finds a name (Local, Enclosing, Global, Built-in), why blocks have no scope of their own, why assigning makes a name local, global and nonlocal, and shadowing built-ins.',
      keywords: ['scope', 'legb', 'local', 'global', 'nonlocal', 'enclosing', 'built-in', 'unboundlocalerror', 'nameerror', 'shadowing', 'namespace', 'block scope'],
      docs: 'https://docs.python.org/3/reference/executionmodel.html#resolution-of-names',
      body: [
        'A **scope** is a region of code with its own names. Reading a name searches four of them, from the inside out, and stops at the first one that has it:',
        '| Scope | What it holds | Made |\n|---|---|---|\n| **L**ocal | the names assigned in the current function, and its parameters | at each call |\n| **E**nclosing | the names of the functions it is nested in | when they run |\n| **G**lobal | the names at the top level of the module (the file) | when the module runs |\n| **B**uilt-in | `print`, `len`, `range`, `ValueError` and the rest | when Python starts |',
        py('x = "global"',
           '',
           'def outer():',
           '    x = "enclosing"',
           '    def inner():',
           '        print(x)          # not local, so found in outer',
           '    inner()',
           '',
           'outer()',
           'print(x)                  # the global x was never changed'),
        'Try every combination in [[explain:scope]].',
        '## Blocks have no scope',
        'Unlike Java, `if`, `for`, `while`, `with` and `try` blocks do not get their own names: a name assigned inside one still exists after it. Only functions, classes, modules and comprehensions make scopes.',
        py('for i in range(3):',
           '    last = i * 10',
           'print(i, last)            # 2 20: both still exist after the loop',
           '',
           'if True:',
           '    message = "made inside an if"',
           'print(message)'),
        '## Assigning makes a name local, in the whole function',
        'When Python reads a `def`, every name **assigned** anywhere in it becomes local to the whole function. So this fails, even though a global `count` exists:',
        py('count = 0',
           '',
           'def increment():',
           '    count += 1            # assigns count, so count is local here, and has no value yet',
           '',
           'increment()               # raises UnboundLocalError'),
        '## global',
        '`global count` says that `count` in this function is the module\'s variable:',
        py('count = 0',
           '',
           'def increment():',
           '    global count',
           '    count += 1',
           '',
           'increment()',
           'increment()',
           'print(count)              # 2'),
        'It works, but functions that change globals are hard to test and reuse. Usually it is better to take a value and return a new one.',
        '## nonlocal',
        '`nonlocal` does the same for a variable of an **enclosing** function. That is how an inner function keeps state, as [[lesson:py-closures]] shows:',
        py('def make_counter():',
           '    count = 0',
           '    def increment():',
           '        nonlocal count',
           '        count += 1',
           '        return count',
           '    return increment',
           '',
           'counter = make_counter()',
           'counter()',
           'print(counter())          # 2'),
        '## Changing an object is not assigning a name',
        'A function may freely change a global list or dict: `items.append(x)` and `settings["k"] = v` assign no name, so no `global` is needed.',
        py('settings = {"debug": False}',
           'history = []',
           '',
           'def enable_debug():',
           '    settings["debug"] = True',
           '    history.append("debug on")',
           '',
           'enable_debug()',
           'print(settings, history)'),
        '## Shadowing built-ins',
        'Built-ins are only the last scope searched, so a variable of yours can hide one:',
        py('list = [1, 2, 3]          # hides the built-in list() in this module',
           'print(list)',
           'del list                  # removes the global; the built-in shows through again',
           'print(list("abc"))'),
        'Never name a variable `list`, `dict`, `str`, `sum`, `max`, `min`, `id`, `input`, `type` or `filter`. The error comes later, far from the cause: `TypeError: \'list\' object is not callable`.'
      ].join('\n\n'),
      java: 'Java has **block** scope: a variable declared inside the `{ }` of an `if` or a `for` is gone at the `}`. Python has **function** scope: the loop variable and anything assigned in a block are still there after it. Java checks names when it compiles; Python looks a name up when the line runs, which is why a misspelt name is a `NameError` only once that line is reached. A Java lambda may capture only effectively final variables; a Python inner function may assign to an outer variable once it says `nonlocal`. Python\'s globals belong to one module (file), roughly a class\'s static fields, not to the whole program.',
      js: 'Python\'s scoping is close to JavaScript\'s old `var` (function scope), not to `let` and `const` (block scope). `nonlocal` has no JavaScript equivalent, because JavaScript closures can always assign to outer variables.',
      example: {
        code: String.raw`TAX_RATE = 0.18                      # a global constant: reading it anywhere is fine

def price_with_tax(price):
    total = price * (1 + TAX_RATE)   # total is local to this call
    return round(total, 2)

print(price_with_tax(100))

def make_accumulator():
    total = 0                        # enclosing: it belongs to make_accumulator
    def add(amount):
        nonlocal total               # assign to the enclosing total
        total += amount
        return total
    return add

add = make_accumulator()
add(10)
print(add(5))

for n in range(3):
    square = n * n
print("after the loop:", n, square)  # loop names live on: no block scope
`
      },
      challenge: {
        title: 'Fix the scope bugs',
        task: [
          'Each function in the starter breaks one scope rule:',
          '1. `record(amount)` should add `amount` to the global `total` and return the new total. It raises `UnboundLocalError`: fix it with `global`.',
          '2. `make_greeter(greeting)` returns a function `greet(name)` that also counts, in `calls`, how many greetings that greeter has made. It raises `UnboundLocalError`: fix it with `nonlocal`.',
          '3. `summary(words)` returns the words sorted, and the words longer than 3 letters. It names a variable `list`, which hides the built-in `list()` it needs two lines later. Rename the variable `ordered`.'
        ].join('\n\n'),
        starter: String.raw`total = 0


def record(amount):
    total += amount
    return total


def make_greeter(greeting):
    calls = 0
    def greet(name):
        calls += 1
        return f"{greeting}, {name}! (greeting number {calls})"
    return greet


def summary(words):
    list = sorted(words)
    long_words = list(filter(lambda w: len(w) > 3, words))
    return list, long_words


record(10)
print(record(5))
hello = make_greeter("Hello")
hello("Asha")
print(hello("Ravi"))
print(summary(["pear", "fig", "banana", "kiwi"]))
`,
        solution: String.raw`total = 0


def record(amount):
    global total
    total += amount
    return total


def make_greeter(greeting):
    calls = 0
    def greet(name):
        nonlocal calls
        calls += 1
        return f"{greeting}, {name}! (greeting number {calls})"
    return greet


def summary(words):
    ordered = sorted(words)
    long_words = list(filter(lambda w: len(w) > 3, words))
    return ordered, long_words


record(10)
print(record(5))
hello = make_greeter("Hello")
hello("Asha")
print(hello("Ravi"))
print(summary(["pear", "fig", "banana", "kiwi"]))
`,
        hints: [
          '`record` assigns to `total`, so Python treats it as local. Add `global total` as the first line of `record`.',
          '`calls` belongs to `make_greeter`. Inside `greet`, write `nonlocal calls` before `calls += 1`.',
          'The variable `list` hides the built-in `list()`, so `list(filter(...))` tries to call a list. Name the variable `ordered`, and return `ordered`.'
        ],
        checks: [
          { label: '`record` adds to the global `total`', code: 'g = record.__globals__\nbefore = g["total"]\nassert record(7) == before + 7, "record should return the new total"\nassert g["total"] == before + 7, "record should change the global total"' },
          { label: '`record(10)` then `record(5)` printed 15', code: 'assert lines[:1] == ["15"]' },
          { label: 'Each greeter counts its own greetings', code: 'g1, g2 = make_greeter("Hi"), make_greeter("Yo")\nassert g1("A") == "Hi, A! (greeting number 1)"\nassert g1("B") == "Hi, B! (greeting number 2)"\nassert g2("C") == "Yo, C! (greeting number 1)", "a new greeter starts again at 1"' },
          { label: '`calls` stays in `make_greeter` (nonlocal, not global)', code: 'assert uses("Nonlocal"), "inside greet: nonlocal calls"\nassert not any(isinstance(n, ast.Global) and "calls" in n.names for n in ast.walk(tree)), "calls belongs to make_greeter: use nonlocal, not global"' },
          { label: '`summary` returns the sorted words and the long ones', code: 'assert summary(["pear", "fig", "banana", "kiwi"]) == (["banana", "fig", "kiwi", "pear"], ["pear", "banana", "kiwi"])' },
          { label: 'No variable hides a built-in', code: 'import builtins\nhidden = sorted({n.id for n in ast.walk(tree) if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store) and hasattr(builtins, n.id)})\nassert not hidden, f"these names hide built-ins: {hidden}"' },
          { label: 'It prints the three results', code: 'assert lines == ["15", "Hello, Ravi! (greeting number 2)", "([\'banana\', \'fig\', \'kiwi\', \'pear\'], [\'pear\', \'banana\', \'kiwi\'])"]' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'py-lambdas', track: 'functions',
      title: 'Lambdas and functions as values',
      summary: 'Functions are objects: store them, pass them, return them. lambda for one-expression functions, the operator module, and when a def is better.',
      keywords: ['lambda', 'anonymous function', 'first-class function', 'higher-order function', 'map', 'filter', 'operator', 'itemgetter', 'callback', 'key function', 'functional interface', 'dispatch table'],
      docs: 'https://docs.python.org/3/tutorial/controlflow.html#lambda-expressions',
      body: [
        '## Functions are values',
        'A function is an object like any other. Without the brackets, its name is the function itself, which you can store, put in a dict, or pass on:',
        py('def shout(text):',
           '    return text.upper() + "!"',
           '',
           'yell = shout                  # no call: the function object itself',
           'print(yell("hi"), yell is shout)',
           'actions = {"shout": shout, "whisper": str.lower}',
           'print(actions["whisper"]("QUIET"))'),
        '## Passing a function',
        py('def apply_twice(func, value):',
           '    return func(func(value))',
           '',
           'def add_three(n):',
           '    return n + 3',
           '',
           'print(apply_twice(add_three, 10))     # 16'),
        '## lambda: a function in one expression',
        '`lambda params: expression` makes the same kind of function object as `def`, without a name and limited to one expression: no statements, no assignments, no `return` (the expression is the result).',
        py('print(sorted(["kiwi", "Apple", "fig"], key=lambda w: w.lower()))',
           'print(list(filter(lambda n: n % 2, range(10))))',
           'print(list(map(lambda n: n * 10, [1, 2, 3])))',
           'print((lambda a, b: a * b)(6, 7))'),
        'A comprehension usually reads better than `map` and `filter` with a lambda: `[n * 10 for n in nums]`. Lambdas shine as the `key` of `sorted`, `min` and `max`, and as small callbacks.',
        '## The operator module',
        'For the most common small functions, `operator` has them ready-made:',
        py('from operator import itemgetter, mul',
           'from functools import reduce',
           '',
           'pairs = [("b", 2), ("a", 3), ("c", 1)]',
           'print(sorted(pairs, key=itemgetter(1)))      # by the second item',
           'print(reduce(mul, [1, 2, 3, 4]))             # 24'),
        '## A dict of functions',
        'A dict from names to functions replaces a long `if`/`elif` chain:',
        py('ops = {',
           '    "+": lambda a, b: a + b,',
           '    "-": lambda a, b: a - b,',
           '    "*": lambda a, b: a * b,',
           '}',
           'print(ops["*"](6, 7))'),
        '## Returning a function',
        py('def multiplier(factor):',
           '    return lambda n: n * factor',
           '',
           'double = multiplier(2)',
           'print(double(5), multiplier(3)(5))'),
        'The returned lambda remembers `factor`: it is a closure, the subject of [[lesson:py-closures]].',
        '## When to write def instead',
        'Use `def` when the function needs more than one expression, a docstring, or a name: a traceback calls every lambda `<lambda>`. PEP 8 also says not to give a lambda a name with `=` (`square = lambda n: n * n`): that is what `def square(n):` is for.'
      ].join('\n\n'),
      java: '`n -> n * n` is `lambda n: n * n`, but Python needs no functional interface: no `Function<Integer, Integer>`, `Predicate`, `BiFunction` or `Supplier`. Any function, lambda or `def`, can be passed anywhere, and a method reference such as `String::toLowerCase` is simply `str.lower`. A Java lambda may have a block of statements; a Python `lambda` is one expression, so anything longer is written as a `def`, even one nested inside another function.',
      js: 'Arrow functions, `n => n * n`, are Python\'s `lambda n: n * n`, but an arrow function may have a `{ }` body of statements and a Python lambda may not.',
      example: {
        code: String.raw`from operator import itemgetter

products = [
    {"name": "pen", "price": 20, "stock": 120},
    {"name": "notebook", "price": 60, "stock": 0},
    {"name": "bag", "price": 900, "stock": 7},
]

print([p["name"] for p in sorted(products, key=lambda p: p["price"], reverse=True)])
print([p["name"] for p in sorted(products, key=itemgetter("stock"))])

in_stock = list(filter(lambda p: p["stock"] > 0, products))
print([p["name"] for p in in_stock])

discounts = {
    "none": lambda price: price,
    "festival": lambda price: price * 0.8,
    "clearance": lambda price: price * 0.5,
}
for name, rule in discounts.items():
    print(f"{name:<10}{rule(900):>7.1f}")
`
      },
      challenge: {
        title: 'A tiny calculator, a sorter and a pipeline',
        task: [
          '1. `OPERATIONS` is a dict from `"+"`, `"-"`, `"*"`, `"/"` and `"**"` to functions of two numbers, written as lambdas.',
          '2. `calculate(expression)` takes text such as `"6 * 7"` (a number, a space, an operator, a space, a number), looks the operator up in `OPERATIONS` and returns the result. The numbers may have decimals, so convert them with `float`. No `if` chain.',
          '3. `sort_by(records, field, descending=False)` returns a new list of the dicts sorted by that field.',
          '4. `apply_all(funcs, value)` returns a list of each function applied to `value`.'
        ].join('\n\n'),
        starter: String.raw`OPERATIONS = {}


def calculate(expression):
    left, op, right = expression.split()
    if op == "+":
        return float(left) + float(right)
    return None


def sort_by(records, field, descending=False):
    return records


def apply_all(funcs, value):
    return []


print(calculate("6 * 7"))
print(sort_by([{"n": 3}, {"n": 1}, {"n": 2}], "n"))
print(apply_all([abs, str, lambda x: x * 2], -4))
`,
        solution: String.raw`OPERATIONS = {
    "+": lambda a, b: a + b,
    "-": lambda a, b: a - b,
    "*": lambda a, b: a * b,
    "/": lambda a, b: a / b,
    "**": lambda a, b: a ** b,
}


def calculate(expression):
    left, op, right = expression.split()
    return OPERATIONS[op](float(left), float(right))


def sort_by(records, field, descending=False):
    return sorted(records, key=lambda r: r[field], reverse=descending)


def apply_all(funcs, value):
    return [f(value) for f in funcs]


print(calculate("6 * 7"))
print(sort_by([{"n": 3}, {"n": 1}, {"n": 2}], "n"))
print(apply_all([abs, str, lambda x: x * 2], -4))
`,
        hints: [
          '`OPERATIONS = {"+": lambda a, b: a + b, ...}`: each value is the function itself, not its result.',
          '`OPERATIONS[op]` is a function, so call it: `OPERATIONS[op](float(left), float(right))`.',
          '`sorted(records, key=lambda r: r[field], reverse=descending)`. For `apply_all`, a comprehension: `[f(value) for f in funcs]`.'
        ],
        checks: [
          { label: '`OPERATIONS` has the five operators, each a function', code: 'assert sorted(OPERATIONS) == sorted(["+", "-", "*", "/", "**"]), f"the keys are {sorted(OPERATIONS)}"\nassert all(callable(f) for f in OPERATIONS.values())\nassert OPERATIONS["**"](2, 10) == 1024 and OPERATIONS["-"](5, 8) == -3' },
          { label: '`calculate` works for every operator', code: 'got = [calculate(e) for e in ("6 * 7", "1.5 + 2", "10 / 4", "2 ** 8", "3 - 10")]\nassert got == [42, 3.5, 2.5, 256, -7], f"got {got}"' },
          { label: '`calculate` looks the operator up (no `if` chain)', code: 'fn = next((n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "calculate"), None)\nassert fn and not any(isinstance(n, ast.If) for n in ast.walk(fn)), "replace the if chain with OPERATIONS[op](...)"' },
          { label: '`sort_by` sorts by any field, up or down', code: 'people = [{"name": "Li", "age": 31}, {"name": "Asha", "age": 25}, {"name": "Ravi", "age": 40}]\nassert [p["name"] for p in sort_by(people, "age")] == ["Asha", "Li", "Ravi"]\nassert [p["name"] for p in sort_by(people, "name", descending=True)] == ["Ravi", "Li", "Asha"]' },
          { label: '`sort_by` returns a new list', code: 'orig = [{"n": 2}, {"n": 1}]\nassert sort_by(orig, "n") is not orig and orig[0]["n"] == 2' },
          { label: '`apply_all` applies each function', code: 'assert apply_all([abs, str, lambda x: x * 2], -4) == [4, "-4", -8]\nassert apply_all([], 1) == []' },
          { label: 'The operations are lambdas', code: 'assert sum(isinstance(n, ast.Lambda) for n in ast.walk(tree)) >= 5, "write each operation as a lambda: lambda a, b: a + b"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'py-closures', track: 'functions',
      title: 'Closures: functions that remember',
      summary: 'An inner function that uses a variable of the function around it keeps that variable alive: counters and factories without a class, the cells behind them, and the loop trap.',
      keywords: ['closure', 'nonlocal', 'free variable', 'cell', 'factory', 'function factory', 'late binding', 'state', 'encapsulation', 'captured variable'],
      docs: 'https://docs.python.org/3/reference/executionmodel.html#naming-and-binding',
      body: [
        '## A function made by a function',
        py('def make_multiplier(factor):',
           '    def multiply(n):',
           '        return n * factor        # factor belongs to make_multiplier',
           '    return multiply',
           '',
           'double = make_multiplier(2)',
           'triple = make_multiplier(3)',
           'print(double(10), triple(10))    # 20 30: each keeps its own factor'),
        '`make_multiplier` has returned, so its frame is gone, yet `multiply` still uses `factor`. A function together with the variables it captured from around it is a **closure**.',
        '## Where the variables live: cells',
        'Python keeps each captured variable in a **cell** attached to the function, and the function lists their names:',
        py('def make_multiplier(factor):',
           '    def multiply(n):',
           '        return n * factor',
           '    return multiply',
           '',
           'double = make_multiplier(2)',
           'print(double.__code__.co_freevars)            # (\'factor\',)',
           'print(double.__closure__[0].cell_contents)    # 2'),
        'Step through one in [[viz:closure|Visualize]]: the function object shows what it captured.',
        '## State, with nonlocal',
        'To **change** a captured variable, the inner function says `nonlocal` (see [[lesson:py-scope]]). Each call of the outer function makes a new variable, so each closure has its own:',
        py('def make_counter(start=0):',
           '    count = start',
           '    def increment():',
           '        nonlocal count',
           '        count += 1',
           '        return count',
           '    return increment',
           '',
           'clicks = make_counter()',
           'clicks()',
           'clicks()',
           'print(clicks())                  # 3',
           'print(make_counter(100)())       # 101: a separate count'),
        '## A closure or a class?',
        'A closure with one function is a lightweight object with one method. Several closures can share state too, but past one or two operations a class says it more clearly.',
        py('def make_account(balance):',
           '    def deposit(amount):',
           '        nonlocal balance',
           '        balance += amount',
           '        return balance',
           '    def get_balance():',
           '        return balance',
           '    return deposit, get_balance',
           '',
           'deposit, get_balance = make_account(100)',
           'deposit(50)',
           'print(get_balance())             # 150'),
        '## The loop trap: late binding',
        'A closure captures the **variable**, not its value at that moment. Functions made in a loop all see the loop variable\'s last value; a default argument freezes the value instead:',
        py('funcs = [lambda: i for i in range(3)]',
           'print([f() for f in funcs])      # [2, 2, 2]',
           '',
           'funcs = [lambda i=i: i for i in range(3)]',
           'print([f() for f in funcs])      # [0, 1, 2]'),
        'The pictures in [[explain:scope]] show why. `functools.partial` is a ready-made way to freeze arguments; [[lesson:py-functools-recursion]] covers it.'
      ].join('\n\n'),
      java: 'Java lambdas and anonymous classes capture variables too, but only **effectively final** ones, so `count++` inside a lambda does not compile and Java developers reach for an `AtomicInteger` or a one-element array. Python captures the variable itself and lets an inner function change it with `nonlocal`. A closure with one function is what Java would write as a small class with one field and one method, and a factory such as `make_multiplier(2)` is a method that returns a lambda: `Function<Integer, Integer> multiplier(int f) { return n -> n * f; }`.',
      js: 'Closures work the same way in JavaScript, which lets an inner function assign to outer variables without any keyword. The loop trap exists there with `var`; `let` gives each pass of the loop its own variable. Python has no `let`, so a default argument (or `functools.partial`) fixes it.',
      example: {
        code: String.raw`def make_rate_limiter(limit):
    """Allow at most limit calls; after that, refuse."""
    used = 0
    def allow(user):
        nonlocal used
        if used >= limit:
            return f"{user}: refused (limit {limit} reached)"
        used += 1
        return f"{user}: allowed ({limit - used} left)"
    return allow

api = make_rate_limiter(2)
for user in ["asha", "ravi", "li"]:
    print(api(user))

premium = make_rate_limiter(5)          # a separate counter
print(premium("li"))
print("api captured:", api.__code__.co_freevars)
`
      },
      challenge: {
        title: 'Three closures',
        task: [
          '1. `make_averager()` returns a function `add(number)` that remembers every number it has been given and returns the average so far: `add(10)` is `10.0`, then `add(20)` is `15.0`.',
          '2. `make_formatter(prefix, width)` returns a function `fmt(value)` that returns the prefix followed by the value right-aligned in `width` characters: `make_formatter("₹", 6)(250)` is `"₹   250"`.',
          '3. `make_toggle(start=False)` returns a function that flips a stored `True`/`False` on each call and returns the new value: the first call of `make_toggle()`\'s function returns `True`, the next `False`.',
          'Every returned function keeps its own state, and nothing is global.'
        ].join('\n\n'),
        starter: String.raw`def make_averager():
    def add(number):
        return number
    return add


def make_formatter(prefix, width):
    pass


def make_toggle(start=False):
    state = start
    def flip():
        state = not state
        return state
    return flip


avg = make_averager()
avg(10)
print(avg(20))
`,
        solution: String.raw`def make_averager():
    numbers = []
    def add(number):
        numbers.append(number)
        return sum(numbers) / len(numbers)
    return add


def make_formatter(prefix, width):
    def fmt(value):
        return f"{prefix}{value:>{width}}"
    return fmt


def make_toggle(start=False):
    state = start
    def flip():
        nonlocal state
        state = not state
        return state
    return flip


avg = make_averager()
avg(10)
print(avg(20))
`,
        hints: [
          'In `make_averager`, make `numbers = []` before `def add`. Appending to it is not an assignment, so no `nonlocal` is needed.',
          '`f"{prefix}{value:>{width}}"`: a format spec can take its width from a variable.',
          '`flip` assigns to `state`, so it needs `nonlocal state` to change the captured variable instead of making a local one.'
        ],
        checks: [
          { label: '`make_averager` keeps a running average', code: 'a = make_averager()\nassert [a(10), a(20), a(60)] == [10.0, 15.0, 30.0]' },
          { label: 'Two averagers are independent', code: 'a, b = make_averager(), make_averager()\na(100)\nassert b(1) == 1.0, "each averager needs its own list of numbers"' },
          { label: 'It printed 15.0', code: 'assert lines == ["15.0"]' },
          { label: '`make_formatter` right-aligns the value after the prefix', code: 'assert make_formatter("₹", 6)(250) == "₹   250"\nassert make_formatter("#", 3)("ab") == "# ab"' },
          { label: '`make_toggle` flips its own state', code: 't = make_toggle()\nassert [t(), t(), t()] == [True, False, True]\nassert make_toggle(True)() is False' },
          { label: 'The returned functions are closures', code: 'assert make_averager().__closure__, "add should use a variable of make_averager"\nassert "state" in make_toggle().__code__.co_freevars, "flip should change make_toggle\'s state, with nonlocal"' },
          { label: 'Nothing is global', code: 'assert not uses("Global"), "keep the state inside the closures"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'py-decorators', track: 'functions',
      title: 'Decorators',
      summary: 'A decorator wraps a function to add behaviour before and after it: timing, logging, retries, caching. The @ syntax, functools.wraps, decorators with arguments, stacking, and the Spring annotations they resemble.',
      keywords: ['decorator', '@', 'wrapper', 'functools.wraps', 'wraps', 'higher-order function', 'aop', 'aspect', 'annotation', 'timing', 'logging', 'retry', 'cross-cutting'],
      docs: 'https://docs.python.org/3/glossary.html#term-decorator',
      body: [
        '## A function that wraps a function',
        'A decorator takes a function and returns a replacement, usually a **wrapper** that does something before and after calling the original:',
        py('def announce(func):',
           '    def wrapper():',
           '        print("before", func.__name__)',
           '        func()',
           '        print("after", func.__name__)',
           '    return wrapper',
           '',
           'def greet():',
           '    print("hello")',
           '',
           'greet = announce(greet)      # greet is now the wrapper',
           'greet()'),
        '## The @ syntax',
        '`@announce` above a `def` is exactly `greet = announce(greet)` right after it:',
        py('def announce(func):',
           '    def wrapper():',
           '        print("before")',
           '        func()',
           '        print("after")',
           '    return wrapper',
           '',
           '@announce',
           'def greet():',
           '    print("hello")',
           '',
           'greet()'),
        '## Any arguments, the result, and functools.wraps',
        'A real wrapper passes on whatever it is called with (`*args, **kwargs`, from [[lesson:py-args-kwargs]]) and returns the original\'s result. `@functools.wraps(func)` copies the original\'s name and docstring onto the wrapper, so error messages, `help()` and frameworks still see the right function.',
        py('import functools, time',
           '',
           'def timed(func):',
           '    @functools.wraps(func)',
           '    def wrapper(*args, **kwargs):',
           '        start = time.perf_counter()',
           '        result = func(*args, **kwargs)',
           '        ms = (time.perf_counter() - start) * 1000',
           '        print(f"{func.__name__} took {ms:.1f} ms")',
           '        return result',
           '    return wrapper',
           '',
           '@timed',
           'def total(n):',
           '    return sum(range(n))',
           '',
           'print(total(100_000))',
           'print(total.__name__)        # total, thanks to functools.wraps'),
        'See what goes wrong without `wraps` in [[explain:decorators]].',
        '## Decorators that take arguments',
        '`@repeat(3)` first calls `repeat(3)`, which returns the decorator. So there are three levels of functions:',
        py('import functools',
           '',
           'def repeat(times):',
           '    def decorate(func):',
           '        @functools.wraps(func)',
           '        def wrapper(*args, **kwargs):',
           '            for _ in range(times):',
           '                result = func(*args, **kwargs)',
           '            return result',
           '        return wrapper',
           '    return decorate',
           '',
           '@repeat(3)',
           'def cheer(name):',
           '    print(f"Go, {name}!")',
           '',
           'cheer("Asha")'),
        '## Stacking',
        'Decorators apply from the bottom up, at definition time, and the top one runs first when the function is called:',
        py('def bold(func):',
           '    return lambda: "<b>" + func() + "</b>"',
           '',
           'def italic(func):',
           '    return lambda: "<i>" + func() + "</i>"',
           '',
           '@bold',
           '@italic',
           'def text():',
           '    return "hi"',
           '',
           'print(text())                # <b><i>hi</i></b>: text = bold(italic(text))'),
        '## Decorators that only register',
        'A decorator does not have to wrap. This one records the function and returns it unchanged, the way web frameworks map URLs to functions:',
        py('handlers = {}',
           '',
           'def on(event):',
           '    def register(func):',
           '        handlers[event] = func',
           '        return func',
           '    return register',
           '',
           '@on("save")',
           'def save_file():',
           '    return "saved"',
           '',
           'print(handlers["save"]())'),
        '## Decorators you will meet',
        '| Decorator | From | What it does |\n|---|---|---|\n| `@functools.cache` | the standard library | remembers results: [[lesson:py-functools-recursion]] |\n| `@property`, `@classmethod`, `@staticmethod` | built in | methods of classes (Objects track) |\n| `@dataclass` | `dataclasses` | writes `__init__`, `__repr__` and `__eq__` for a class |\n| `@pytest.fixture` | pytest | test set-up: [[lesson:py-pytest]] |\n| `@app.get("/users")` | FastAPI | maps a URL to a function, like `@GetMapping` |'
      ].join('\n\n'),
      java: 'A decorator looks like a Java annotation but works the other way round. An annotation is only **metadata**: something else (Spring, JUnit, the compiler) must find it and act. A decorator is ordinary code that runs when the `def` runs and replaces the function. The nearest Java thing is a Spring AOP proxy: `@Transactional`, `@Cacheable` or `@Retryable` make Spring wrap your bean in a proxy that runs code before and after each call, which is exactly what `wrapper` does here, with no framework and no proxy class.',
      js: 'Python decorators inspired the JavaScript and TypeScript decorators proposal. In plain JavaScript you write the same thing as a call: `const timedTotal = timed(total)`.',
      example: {
        code: String.raw`import functools

def log_calls(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        shown = ", ".join([repr(a) for a in args] + [f"{k}={v!r}" for k, v in kwargs.items()])
        print(f"-> {func.__name__}({shown})")
        result = func(*args, **kwargs)
        print(f"<- {func.__name__} returned {result!r}")
        return result
    return wrapper

@log_calls
def area(width, height=1):
    return width * height

@log_calls
def greet(name, punctuation="!"):
    return f"Hello, {name}{punctuation}"

area(3, height=4)
greet("Ravi")
print(area.__name__, "-", area.__wrapped__(2, 5))
`,
        note: '`functools.wraps` also keeps the original as `area.__wrapped__`: calling it skips the logging.'
      },
      challenge: {
        title: 'Write two decorators',
        task: [
          '1. `count_calls(func)`: the decorated function counts its calls in an attribute `calls`. After `f()` twice, `f.calls` is 2. Use `functools.wraps`, so the name and docstring are kept.',
          '2. `retry(times)`: a decorator that takes an argument. The decorated function is called up to `times` times while it raises `ValueError`, and the first result that does not raise is returned. If every try fails, the last `ValueError` is raised again. Other exceptions are not retried.',
          'The bottom of the starter uses both: `greet` is counted, and `flaky` fails twice before it works.'
        ].join('\n\n'),
        starter: String.raw`import functools


def count_calls(func):
    return func


def retry(times):
    def decorate(func):
        return func
    return decorate


@count_calls
def greet(name):
    return f"Hi, {name}"


attempts = []


@retry(3)
def flaky():
    attempts.append(1)
    if len(attempts) < 3:
        raise ValueError("not yet")
    return "worked"


greet("Asha")
greet("Ravi")
print(greet.calls)
print(flaky())
print(len(attempts))
`,
        solution: String.raw`import functools


def count_calls(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)
    wrapper.calls = 0
    return wrapper


def retry(times):
    def decorate(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(times):
                try:
                    return func(*args, **kwargs)
                except ValueError:
                    if attempt == times - 1:
                        raise
        return wrapper
    return decorate


@count_calls
def greet(name):
    return f"Hi, {name}"


attempts = []


@retry(3)
def flaky():
    attempts.append(1)
    if len(attempts) < 3:
        raise ValueError("not yet")
    return "worked"


greet("Asha")
greet("Ravi")
print(greet.calls)
print(flaky())
print(len(attempts))
`,
        hints: [
          'A wrapper is a function object, so it can carry an attribute: set `wrapper.calls = 0` before returning it, and do `wrapper.calls += 1` inside it.',
          '`retry(times)` returns `decorate(func)`, which returns `wrapper(*args, **kwargs)`: three levels. Inside the wrapper, loop `for attempt in range(times):` around `try: return func(*args, **kwargs)`.',
          'In `except ValueError:`, a bare `raise` re-raises the error being handled. Do that on the last try: `if attempt == times - 1: raise`.'
        ],
        checks: [
          { label: '`greet.calls` counts the calls', code: 'before = greet.calls\ngreet("X")\nassert greet.calls == before + 1, f"greet.calls went from {before} to {greet.calls}"' },
          { label: '`count_calls` keeps the name, the docstring and the result', code: '@count_calls\ndef add(a, b=0):\n    """Add."""\n    return a + b\nassert add(2, b=3) == 5 and add.calls == 1\nassert add.__name__ == "add" and add.__doc__ == "Add.", "use @functools.wraps(func) on the wrapper"' },
          { label: 'Each decorated function has its own count', code: '@count_calls\ndef one():\n    return 1\n@count_calls\ndef two():\n    return 2\none()\none()\ntwo()\nassert (one.calls, two.calls) == (2, 1), f"one.calls is {one.calls}, two.calls is {two.calls}"' },
          { label: 'It prints 2, worked and 3', code: 'assert lines == ["2", "worked", "3"]' },
          { label: '`retry` gives up after `times` tries and raises the last ValueError', code: 'tries = []\n@retry(2)\ndef never():\n    tries.append(1)\n    raise ValueError(f"try {len(tries)}")\ntry:\n    never()\n    raise AssertionError("never() should raise ValueError after 2 tries")\nexcept ValueError as e:\n    assert str(e) == "try 2" and len(tries) == 2, f"it raised {e!r} after {len(tries)} tries"' },
          { label: '`retry` does not retry other errors', code: 'tries = []\n@retry(3)\ndef broken():\n    tries.append(1)\n    raise KeyError("x")\ntry:\n    broken()\nexcept KeyError:\n    pass\nassert len(tries) == 1, "only a ValueError is retried"' },
          { label: '`retry` keeps the name', code: 'assert flaky.__name__ == "flaky", "use @functools.wraps(func) in retry too"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'py-functools-recursion', track: 'functions',
      title: 'functools and recursion',
      summary: 'Remember results with @cache, fix arguments with partial, fold with reduce; and recursion in Python: base cases, the 1,000-call limit, and when a loop is better.',
      keywords: ['functools', 'cache', 'lru_cache', 'memoize', 'memoization', 'partial', 'reduce', 'recursion', 'recursive', 'recursionerror', 'recursion limit', 'fibonacci', 'tail call', 'cache_info'],
      docs: 'https://docs.python.org/3/library/functools.html',
      body: [
        '## Recursion',
        'A recursive function calls itself on a smaller problem, until a **base case** answers without calling itself:',
        py('def factorial(n):',
           '    if n <= 1:                # the base case stops the recursion',
           '        return 1',
           '    return n * factorial(n - 1)',
           '',
           'print(factorial(5))          # 120'),
        'Each call has a frame of its own, stacked on the caller\'s; watch them pile up and unwind in [[viz:recursion|Visualize]]. Recursion fits data shaped like a tree, such as lists inside lists:',
        py('def total(nested):',
           '    """Add up the numbers in lists of lists, at any depth."""',
           '    result = 0',
           '    for item in nested:',
           '        if isinstance(item, list):',
           '            result += total(item)',
           '        else:',
           '            result += item',
           '    return result',
           '',
           'print(total([1, [2, 3], [4, [5, [6]]]]))     # 21'),
        '## The recursion limit',
        'Python stops a recursion about 1,000 calls deep with a `RecursionError`, and it never optimizes tail calls: every call keeps its frame until it returns.',
        py('import sys',
           'print(sys.getrecursionlimit())     # usually 1000',
           '',
           'def countdown(n):',
           '    return n if n == 0 else countdown(n - 1)',
           '',
           'print(countdown(500))',
           'countdown(5000)                    # raises RecursionError'),
        '`sys.setrecursionlimit` can raise the limit, but deep recursion is a sign that a loop would be better: `countdown` is just `while n > 0: n -= 1`.',
        '## @cache: remember results',
        '`@cache` stores each result by its arguments, so a repeated call returns at once. It turns this exponential Fibonacci into a fast one:',
        py('from functools import cache',
           '',
           '@cache',
           'def fib(n):',
           '    return n if n < 2 else fib(n - 1) + fib(n - 2)',
           '',
           'print(fib(80))',
           'print(fib.cache_info())'),
        'Without it, `fib(80)` would make more calls than any computer could finish. `@lru_cache(maxsize=128)` keeps only the most recent results, for when the possible arguments are endless. Either way the arguments must be hashable: numbers, strings, tuples, not lists.',
        '## partial: fix some arguments',
        py('from functools import partial',
           '',
           'def power(base, exponent):',
           '    return base ** exponent',
           '',
           'square = partial(power, exponent=2)',
           'two_to_the = partial(power, 2)',
           'print(square(9), two_to_the(10))     # 81 1024',
           'print_csv = partial(print, sep=",")',
           'print_csv("a", "b", "c")'),
        '## reduce: fold a sequence into one value',
        py('from functools import reduce',
           '',
           'print(reduce(lambda acc, n: acc * n, [1, 2, 3, 4, 5], 1))    # 120',
           'print(reduce(lambda a, b: a + b, ["py", "thon", "ic"]))'),
        'Most folds already have a built-in: `sum`, `max`, `min`, `any`, `all`, `"".join` and `math.prod`. Use `reduce` when none of them fits. `functools` also has `wraps` (see [[lesson:py-decorators]]), `total_ordering` and `cached_property`, which the Objects track uses.'
      ].join('\n\n'),
      java: 'Java has no ready-made memoization; you would keep a `HashMap` and call `computeIfAbsent`, which does not even work for recursive calls. `@cache` does it in one line. Like Java, Python has no tail-call optimization, but its limit is lower: about 1,000 frames by default, where Java\'s depends on the thread\'s stack size. `partial` is a lambda that fixes some arguments, and `reduce(f, items, start)` is `stream.reduce(start, f)`.',
      js: 'JavaScript has no standard `cache` decorator or `partial`, though `f.bind(null, 2)` fixes leading arguments the way `partial(f, 2)` does. `arr.reduce((acc, n) => acc * n, 1)` is `reduce(lambda acc, n: acc * n, arr, 1)`.',
      example: {
        code: String.raw`from functools import cache, partial, reduce
import operator

calls = 0

def slow_fib(n):
    global calls
    calls += 1
    return n if n < 2 else slow_fib(n - 1) + slow_fib(n - 2)

print("slow_fib(20) =", slow_fib(20), "after", calls, "calls")

@cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print("fib(20) =", fib(20), fib.cache_info())
print("fib(200) =", fib(200))

money = partial(round, ndigits=2)
print(money(19.98765))

print("product:", reduce(operator.mul, range(1, 11)))
`
      },
      challenge: {
        title: 'Recursion, cached',
        task: [
          '1. `count_paths(rows, cols)` counts the ways to walk from the top-left to the bottom-right square of a grid, moving only right or down. A grid with 1 row or 1 column has 1 path; otherwise `count_paths(r, c)` is `count_paths(r - 1, c) + count_paths(r, c - 1)`. Write it recursively and decorate it with `@cache`: `count_paths(18, 18)` must answer at once.',
          '2. `flatten(nested)` returns a flat list of everything in nested lists, at any depth, in order, using recursion.',
          '3. `depth(nested)` returns how deep the lists go: `depth([1, 2])` is 1, `depth([1, [2, [3]]])` is 3, and `depth([])` is 1.',
          '4. `product(numbers)` multiplies the numbers with `reduce`; `product([])` is 1.'
        ].join('\n\n'),
        starter: String.raw`from functools import cache, reduce


def count_paths(rows, cols):
    pass


def flatten(nested):
    return nested


def depth(nested):
    return 1


def product(numbers):
    result = 1
    for n in numbers:
        result *= n
    return result


print(count_paths(3, 3))
print(flatten([1, [2, [3, 4]], 5]))
print(depth([1, [2, [3]]]))
print(product([2, 3, 4]))
`,
        solution: String.raw`from functools import cache, reduce


@cache
def count_paths(rows, cols):
    if rows == 1 or cols == 1:
        return 1
    return count_paths(rows - 1, cols) + count_paths(rows, cols - 1)


def flatten(nested):
    flat = []
    for item in nested:
        if isinstance(item, list):
            flat.extend(flatten(item))
        else:
            flat.append(item)
    return flat


def depth(nested):
    inner = [depth(item) for item in nested if isinstance(item, list)]
    return 1 + max(inner, default=0)


def product(numbers):
    return reduce(lambda a, b: a * b, numbers, 1)


print(count_paths(3, 3))
print(flatten([1, [2, [3, 4]], 5]))
print(depth([1, [2, [3]]]))
print(product([2, 3, 4]))
`,
        hints: [
          '`count_paths`: `if rows == 1 or cols == 1: return 1`, otherwise add the two smaller grids. Put `@cache` on the line above the `def`.',
          '`flatten`: loop over the items; for a list, `flat.extend(flatten(item))`, otherwise `flat.append(item)`. `depth`: 1 plus the depth of the deepest inner list, `max(..., default=0)` when there is none.',
          '`reduce(lambda a, b: a * b, numbers, 1)`: the third argument is the starting value, which is also the answer for an empty list.'
        ],
        checks: [
          { label: '`count_paths` is right for small grids', code: 'got = [count_paths(1, 5), count_paths(2, 2), count_paths(3, 3), count_paths(3, 7)]\nassert got == [1, 2, 6, 28], f"for (1, 5), (2, 2), (3, 3), (3, 7) got {got}"' },
          { label: '`count_paths` uses `@cache` and answers 18 by 18 at once', code: 'assert hasattr(count_paths, "cache_info"), "decorate count_paths with @cache (from functools)"\nassert count_paths(18, 18) == 2333606220' },
          { label: '`count_paths` calls itself', code: 'fn = next((n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "count_paths"), None)\nassert fn and any(isinstance(c, ast.Call) and getattr(c.func, "id", None) == "count_paths" for c in ast.walk(fn)), "count_paths should call itself on the smaller grids"' },
          { label: '`flatten` works at any depth', code: 'assert flatten([1, [2, [3, [4, [5]]]], [], 6]) == [1, 2, 3, 4, 5, 6]\nassert flatten([]) == []' },
          { label: '`depth` measures the nesting', code: 'got = [depth([]), depth([1, 2]), depth([1, [2, [3]]]), depth([[[[]]]])]\nassert got == [1, 1, 3, 4], f"got {got}"' },
          { label: '`product` uses `reduce`', code: 'assert product([2, 3, 4]) == 24 and product([]) == 1 and product([7]) == 7\nassert calls("reduce"), "product: reduce(lambda a, b: a * b, numbers, 1)"' },
          { label: 'It prints the four results', code: 'assert lines == ["6", "[1, 2, 3, 4, 5]", "3", "24"]' }
        ]
      }
    }
  );
})(window.PYLT);
