/*
 * Lessons, track 6: Tooling and quality. The lesson shape is described at the top of
 * data/lessons-basics.js; every ```python block must run (tests/test_content.py runs them all).
 * A ```python-norun block is Python that needs a package this tool does not install (pytest): it must
 * compile (tests/check_data.py) but is not run. ```console blocks are terminal commands.
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  function fence(lang, src) { return '```' + lang + '\n' + src.replace(/^\n+|\s+$/g, '') + '\n```'; }
  function py(src) { return fence('python', src); }
  function norun(src) { return fence('python-norun', src); }
  function con(src) { return fence('console', src); }
  function text(src) { return fence('text', src); }

  /* Python put in front of some checks. */

  // py-pytest: run the learner's test_ functions against a planted bug (a "mutant" of parse_price)
  var MUTANTS = String.raw`
def failures(impl):
    """The names of the test_ functions that fail when parse_price is impl."""
    tests = [f for n, f in sorted(globals().items()) if n.startswith("test_") and callable(f)]
    if not tests:
        return []
    g = tests[0].__globals__
    real = g["parse_price"]
    g["parse_price"] = impl
    failed = []
    try:
        for t in tests:
            try:
                t()
            except Exception:
                failed.append(t.__name__)
    finally:
        g["parse_price"] = real
    return failed


def checked(cleaned):
    if not cleaned:
        raise ValueError("empty price")
    value = float(cleaned)
    if value < 0:
        raise ValueError("negative price")
    return value


def no_dollar(text):
    return round(checked(text.strip().replace(",", "")), 2)


def no_commas(text):
    return round(checked(text.strip().removeprefix("$")), 2)


def allows_negative(text):
    cleaned = text.strip().removeprefix("$").replace(",", "")
    if not cleaned:
        raise ValueError("empty price")
    return round(float(cleaned), 2)


def drops_cents(text):
    return float(int(checked(text.strip().removeprefix("$").replace(",", ""))))
`;

  // py-logging-debugging: call process(order) and record what it logged
  var LOGGED = String.raw`
import logging


class Grab(logging.Handler):
    def __init__(self):
        super().__init__(logging.DEBUG)
        self.records = []

    def emit(self, record):
        self.records.append(record)


def logged(order):
    """process(order), recorded: (result, printed, [(level, message)], records)."""
    lg = logging.getLogger("orders")
    grab, old = Grab(), lg.level
    lg.addHandler(grab)
    lg.setLevel(logging.DEBUG)
    try:
        result, printed = capture(process, order)
    finally:
        lg.removeHandler(grab)
        lg.setLevel(old)
    return result, printed, [(r.levelname, r.getMessage()) for r in grab.records], grab.records
`;

  // py-argparse: the exit code argparse stops with for these arguments, or None
  var EXIT_CODE = String.raw`
def exit_code(argv):
    try:
        build_parser().parse_args(argv)
    except SystemExit as e:
        return e.code
    return None
`;

  L.push(
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'py-type-hints', track: 'tooling',
      title: 'Type hints and generics',
      summary: 'Annotate parameters, return values and variables; list[int], dict[str, float] and X | None; generic functions and classes with [T]; TypedDict, Literal and Protocol. Python ignores hints when it runs; mypy and your IDE check them, the way javac would.',
      keywords: ['type hints', 'typing', 'annotations', 'generics', 'mypy', 'pyright', 'pylance', 'optional', 'typevar', 'union', 'callable', 'typeddict', 'literal', 'static typing', 'type checker', 'list[int]'],
      docs: 'https://docs.python.org/3/library/typing.html',
      body: [
        'Java checks every type when it compiles. Python never checks types by itself, but since Python 3.5 you can **write them down**: a type hint after a name, and `->` before a function\'s colon for what it returns. Python stores the hints and otherwise ignores them. A separate tool, a **type checker** such as mypy or pyright (built into VS Code\'s Python extension), reads them and reports mistakes before the program runs, much as `javac` would.',
        py(String.raw`
def area(width: float, height: float) -> float:
    return width * height

count: int = 0
names: list[str] = ["Asha", "Ravi"]

print(area(2, 3.5))
print(area("ab", 2))             # no error: Python does not check hints, and "ab" * 2 is "abab"
print(area.__annotations__)`),
        'A type checker would refuse the second call. Its report looks like this:',
        con(String.raw`
> python -m pip install mypy
> mypy shapes.py
shapes.py:8: error: Argument 1 to "area" has incompatible type "str"; expected "float"  [arg-type]
Found 1 error in 1 file (checked 1 source file)`),
        '## The everyday types',
        '| Java | Python hint |\n|---|---|\n| `int`, `double`, `boolean`, `String` | `int`, `float`, `bool`, `str` |\n| `List<String>` | `list[str]` |\n| `Map<String, Integer>` | `dict[str, int]` |\n| `Set<Long>` | `set[int]` |\n| a pair of two types | `tuple[str, int]` |\n| any number of ints | `tuple[int, ...]` |\n| a nullable `User`, `Optional<User>` | `User \\| None` |\n| `Function<String, Integer>` | `Callable[[str], int]` (from `collections.abc`) |\n| `Object` | `object`; or `Any`, which switches checking off |\n| `void` | `-> None` |',
        '`X | None` is how Python says "may be missing": the function returns `None`, not an `Optional` object. A checker then insists that you test for `None` before using the value. After an `isinstance` test, it knows the narrower type:',
        py(String.raw`
def find_user(users: dict[int, str], user_id: int) -> str | None:
    return users.get(user_id)            # None when missing, and the hint says so

def describe(value: int | str) -> str:
    if isinstance(value, int):           # from here on, the checker knows value is an int
        return f"number {value:,}"
    return f"text {value!r}"

print(find_user({1: "asha"}, 2))
print(describe(1500), describe("hi"))`),
        '## Generic functions and classes',
        'Python 3.12 added Java-like type parameters in square brackets. `def first[T](...)` is Java\'s `<T> T first(...)`, and `class Stack[T]` is `class Stack<T>`:',
        py(String.raw`
def first[T](items: list[T], default: T) -> T:
    return items[0] if items else default

class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

s = Stack[int]()
s.push(1)
s.push(2)
print(s.pop(), first(["a", "b"], "none"), first([], 0))
print(first.__type_params__, Stack.__type_params__)`),
        'Older code, and libraries that support older Pythons, spell the same thing `T = TypeVar("T")` and `class Stack(Generic[T]):`. Like Java\'s generics, Python\'s exist only for the checker: `Stack[int]` and `Stack[str]` are the same class when the program runs.',
        '## Describing shapes',
        'A few more tools from `typing` describe data you did not define yourself, such as a dict read from JSON:',
        py(String.raw`
from typing import Literal, Protocol, TypedDict

class Order(TypedDict):                  # the keys a dict must have, and their types
    id: str
    total: float

Status = Literal["open", "paid", "shipped"]     # only these three strings

class HasTotal(Protocol):                # any object with a .total fits: no "implements"
    total: float

def label(order: Order, status: Status) -> str:
    return f"{order['id']}: {status}"

print(label({"id": "A1", "total": 9.5}, "paid"))`),
        '`Protocol` is covered with interfaces in [[lesson:py-abc-protocols]].',
        '## Where hints do change what happens',
        'Python itself ignores hints, but code can read them, and some libraries are built on that: `dataclasses` makes its fields from them ([[lesson:py-dataclasses-enums]]), and FastAPI and Pydantic check and convert request data with them. `typing.get_type_hints` reads them:',
        py(String.raw`
import typing
from dataclasses import dataclass, fields

@dataclass
class Product:
    name: str
    price: float
    tags: list[str]

print(typing.get_type_hints(Product))
print([f.name for f in fields(Product)])`),
        '## How much to type',
        'Hints are optional, and a project can add them a little at a time ("gradual typing"). A good start: every function\'s parameters and return value, but not every local variable, which the checker works out itself. `Any` marks a value the checker should not question; `# type: ignore` silences one line. `mypy --strict` asks for hints everywhere.',
        '| Tool | What it does |\n|---|---|\n| mypy | the original type checker: `mypy src/` |\n| pyright / Pylance | a faster checker, built into VS Code |\n| ruff | a linter and formatter (style, unused imports, likely bugs), not a type checker |'
      ].join('\n\n'),
      java: 'Java\'s types are part of the language: the compiler requires them and refuses a program that breaks them. Python\'s hints are optional, checked by a separate tool, and **ignored when the program runs**, so a wrong hint never causes an error by itself. The vocabulary maps closely: `list[str]` is `List<String>`, `X | None` replaces `Optional<X>` (you return `None` itself), and `def first[T](...)` is a generic method. Generics are erased at run time in both languages.',
      js: 'Hints are to Python what TypeScript is to JavaScript: annotations a checker reads and the running program ignores. The difference is that Python needs no compile step: the hints live in the `.py` file and the interpreter skips them.',
      example: {
        code: String.raw`import typing
from collections.abc import Callable
from dataclasses import dataclass


@dataclass(frozen=True)
class Item:
    sku: str
    price: float
    qty: int


def total_value(items: list[Item]) -> float:
    return sum(i.price * i.qty for i in items)


def find(items: list[Item], sku: str) -> Item | None:
    return next((i for i in items if i.sku == sku), None)


def index_by[K, V](values: list[V], key: Callable[[V], K]) -> dict[K, V]:
    return {key(v): v for v in values}


stock = [Item("pen", 1.5, 10), Item("pad", 3.0, 4)]
print(total_value(stock))
print(find(stock, "pad"), find(stock, "ink"))
print(sorted(index_by(stock, lambda i: i.sku)))
print(typing.get_type_hints(find))
`,
        note: 'Change `find(stock, "pad")` to `find(stock, 7)`: it still runs (it just finds nothing). A type checker would point at the `7`.'
      },
      challenge: {
        title: 'Type it, then make it generic',
        task: [
          '1. Give `average` hints: it takes a `list[float]` and returns a `float`. `average([])` returns `0.0` instead of failing.',
          '2. `find_email(emails, user)` takes a `dict[str, str]` and a `str`, and returns the address, or `None` when the user has none. Its return hint says so: `str | None`.',
          '3. Make `first` generic with the `[T]` syntax: `first(items: list[T], default: T) -> T` returns the first item, or `default` for an empty list.',
          '4. Make `Pair` a generic class, `Pair[K, V]`, whose `swap()` returns a new `Pair` with the key and the value swapped.'
        ].join('\n\n'),
        starter: String.raw`def average(numbers):
    return sum(numbers) / len(numbers)


def find_email(emails, user):
    return emails[user]


def first(items, default):
    return items[0]


class Pair:
    def __init__(self, key, value):
        self.key = key
        self.value = value

    def swap(self):
        return Pair(self.value, self.key)


print(average([2.0, 4.0]), first(["a"], "-"))
`,
        solution: String.raw`def average(numbers: list[float]) -> float:
    if not numbers:
        return 0.0
    return sum(numbers) / len(numbers)


def find_email(emails: dict[str, str], user: str) -> str | None:
    return emails.get(user)


def first[T](items: list[T], default: T) -> T:
    return items[0] if items else default


class Pair[K, V]:
    def __init__(self, key: K, value: V) -> None:
        self.key = key
        self.value = value

    def swap(self) -> "Pair[V, K]":
        return Pair(self.value, self.key)


print(average([2.0, 4.0]), average([]), find_email({"asha": "asha@example.com"}, "ravi"))
print(first([], "-"), Pair("a", 1).swap().key)
`,
        hints: [
          'Hints go after each parameter name and after `->`: `def average(numbers: list[float]) -> float:`.',
          '`emails.get(user)` returns `None` for a missing key, which is exactly what the hint `-> str | None` promises.',
          'Generic syntax: `def first[T](items: list[T], default: T) -> T:` and `class Pair[K, V]:`. Inside the class, write the return hint of `swap` in quotes, `-> "Pair[V, K]"`, because the name `Pair` does not exist yet while its body runs.'
        ],
        checks: [
          { label: '`average` takes `list[float]` and returns `float`', code: 'import typing\nassert typing.get_type_hints(average) == {"numbers": list[float], "return": float}' },
          { label: '`average` works, and gives `0.0` for an empty list', code: 'assert average([1.0, 2.0]) == 1.5\nassert average([]) == 0.0' },
          { label: '`find_email` is hinted `(dict[str, str], str) -> str | None`', code: 'import typing\nhints = typing.get_type_hints(find_email)\nassert hints.get("emails") == dict[str, str] and hints.get("user") is str, f"the parameters are hinted {hints}"\nassert hints.get("return") == (str | None), f"the return hint is {hints.get(\'return\')}: it can be None"' },
          { label: '`find_email` returns the address, or `None`', code: 'emails = {"asha": "asha@example.com"}\nassert find_email(emails, "asha") == "asha@example.com"\nassert find_email(emails, "ravi") is None' },
          { label: '`first` is generic: `first[T](items: list[T], default: T) -> T`', code: 'import typing\nparams = getattr(first, "__type_params__", ())\nassert len(params) == 1, "declare one type parameter: def first[T](...)"\nT = params[0]\nassert typing.get_type_hints(first) == {"items": list[T], "default": T, "return": T}' },
          { label: '`first` returns the default for an empty list', code: 'assert first([3, 4], 0) == 3\nassert first([], "none") == "none"' },
          { label: '`Pair[K, V]` is generic, and `swap()` swaps', code: 'assert [p.__name__ for p in getattr(Pair, "__type_params__", ())] == ["K", "V"], "write class Pair[K, V]:"\ns = Pair("a", 1).swap()\nassert (s.key, s.value) == (1, "a")' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'py-packages', track: 'tooling',
      title: 'Packages, imports and pyproject.toml',
      summary: 'A package is a folder of modules. Absolute and relative imports, __init__.py and __all__, running a package with python -m, the src layout, and pyproject.toml: the file that does pom.xml\'s job.',
      keywords: ['package', '__init__.py', 'import', 'relative import', '__all__', '__main__.py', 'python -m', 'pyproject.toml', 'pom.xml', 'src layout', 'wheel', 'jar', 'setuptools', 'tomllib', 'project'],
      docs: 'https://docs.python.org/3/tutorial/modules.html#packages',
      body: [
        'A **module** is one `.py` file ([[lesson:py-modules]]). A **package** is a folder of modules, imported with dots: `import shop.pricing` loads `shop/pricing.py`. A real project is a package plus one more file, `pyproject.toml`, which says what the project is called, which Python it needs and which other packages it uses: the job of Maven\'s `pom.xml`.',
        '## A package is a folder',
        text(String.raw`
shop/
├── __init__.py      runs on "import shop"; often brings the main names to the top
├── pricing.py       import shop.pricing
├── cart.py          import shop.cart
└── __main__.py      runs on "python -m shop"`),
        'This program builds the package and imports it (in your own projects you would simply create the files):',
        py(String.raw`
from pathlib import Path

Path("shop").mkdir(exist_ok=True)
Path("shop/__init__.py").write_text('from .pricing import with_tax\n__all__ = ["with_tax"]\n', encoding="utf-8")
Path("shop/pricing.py").write_text("TAX = 0.18\n\ndef with_tax(amount):\n    return round(amount * (1 + TAX), 2)\n", encoding="utf-8")

import shop
from shop.pricing import TAX
print(shop.with_tax(100), TAX)
print(shop.__name__, shop.pricing.__name__, shop.__file__.endswith("__init__.py"))`),
        '## Absolute and relative imports',
        'From outside, a module is named by its full path: `from shop.pricing import TAX`. Inside the package, a dot means "my own package": `from .pricing import TAX` in `shop/cart.py`, and `from ..util import x` reaches the package one level up. Relative imports keep working if the package is renamed or moved.',
        'They only work in a module that belongs to a package. A file started directly (`python shop/cart.py`) belongs to none, so its relative imports fail with "attempted relative import with no known parent package". That is why projects run their code as a module: `python -m shop.cart`.',
        '## `__init__.py` and `__all__`',
        'Importing a package runs its `__init__.py`. It is often empty; it may also lift the main names to the top (`from .cart import Cart`), so users write `from shop import Cart` without knowing the inner layout. `__all__` lists the public names: it is what `from shop import *` takes, and tools read it as the package\'s API. Python has no `public` or `private`: a leading underscore (`_util.py`, `_helper()`) means "internal, do not rely on it".',
        '## `python -m` and `__main__.py`',
        '`python -m shop` runs the package as a program: Python imports `shop`, then runs `shop/__main__.py` with `__name__` set to `"__main__"`. `runpy.run_module` does the same from inside a program:',
        py(String.raw`
import runpy
from pathlib import Path

Path("tools").mkdir(exist_ok=True)
Path("tools/__init__.py").write_text("", encoding="utf-8")
Path("tools/__main__.py").write_text('print("tools runs as a program; its __name__ is", __name__)\n', encoding="utf-8")

runpy.run_module("tools", run_name="__main__")      # what "python -m tools" does`),
        '## pyproject.toml: the project file',
        'One file in the project folder describes the project. Its format is TOML: sections in `[brackets]`, then `key = value` lines.',
        text(String.raw`
[build-system]
requires = ["setuptools>=69"]
build-backend = "setuptools.build_meta"

[project]
name = "shop"
version = "1.2.0"
requires-python = ">=3.11"
dependencies = [
    "requests>=2.31",
]

[project.optional-dependencies]
dev = ["pytest>=8", "mypy"]

[project.scripts]
shop = "shop.__main__:main"`),
        '| Maven `pom.xml` | `pyproject.toml` |\n|---|---|\n| `groupId`, `artifactId`, `version` | `name`, `version` (no group: names on PyPI are global) |\n| `<dependencies>` | `dependencies = [...]` |\n| `<scope>test</scope>` | an extra: `[project.optional-dependencies] dev = [...]` |\n| `<build><plugins>` | `[build-system]` |\n| `Main-Class` in the manifest | `[project.scripts]`: a command created on install |\n| `mvn package` makes a `.jar` | `python -m build` makes a `.whl`, a wheel |\n| `mvn install` | `pip install .`; or `pip install -e .`, "editable", while you work on it |',
        'Python reads TOML with the standard `tomllib` module:',
        py(String.raw`
import tomllib

text = """
[project]
name = "shop"
version = "1.2.0"
dependencies = ["requests>=2.31"]
"""
project = tomllib.loads(text)["project"]
print(project["name"], project["version"], project["dependencies"])`),
        '## The src layout',
        text(String.raw`
shop-project/
├── pyproject.toml
├── README.md
├── src/
│   └── shop/
│       ├── __init__.py
│       └── pricing.py
└── tests/
    └── test_pricing.py`),
        'It is Maven\'s `src/main/java` and `src/test/java`. The `src/` folder keeps the package out of the project folder, so the tests cannot import it by accident from there: they use the installed package (`pip install -e .`), exactly as a user would. The next lesson, [[lesson:py-venv-pip]], installs it into a virtual environment.'
      ].join('\n\n'),
      java: 'A package is a folder, as in Java, but no file declares `package shop;`: the folder decides. Importing a module runs it once, like a static initializer. There is no `public`: every top-level name can be imported, `_name` means internal, and `__all__` lists the public API. `pyproject.toml` does the work of `pom.xml`, a wheel (`.whl`) is the `.jar`, PyPI is Maven Central, and `python -m shop` is `java -cp ... shop.Main`.',
      example: {
        code: String.raw`import runpy
import sys
from pathlib import Path

files = {
    "shop/__init__.py": 'from .cart import Cart\n__all__ = ["Cart"]\n__version__ = "1.0.0"\n',
    "shop/pricing.py": "TAX = 0.18\n\ndef with_tax(amount):\n    return round(amount * (1 + TAX), 2)\n",
    "shop/cart.py": (
        "from .pricing import with_tax\n\n"
        "class Cart:\n"
        "    def __init__(self):\n"
        "        self.items = []\n\n"
        "    def add(self, name, price):\n"
        "        self.items.append((name, price))\n\n"
        "    def total(self):\n"
        "        return with_tax(sum(p for _, p in self.items))\n"
    ),
    "shop/__main__.py": (
        "from shop import Cart, __version__\n\n"
        "cart = Cart()\n"
        "cart.add('tea', 100)\n"
        "print(f'shop {__version__}: total with tax {cart.total()}')\n"
    ),
}
for name, source in files.items():
    Path(name).parent.mkdir(parents=True, exist_ok=True)
    Path(name).write_text(source, encoding="utf-8")

import shop

print(shop.__all__, shop.__version__)
print(sorted(m for m in sys.modules if m.startswith("shop")))
runpy.run_module("shop", run_name="__main__")      # python -m shop
`,
        note: 'Importing `shop` also loaded `shop.cart` and `shop.pricing`: its `__init__.py` imports the cart, and the cart imports the prices.'
      },
      challenge: {
        title: 'Turn a file into a package',
        task: [
          'The starter writes one file, `textkit.py`. Make it a package folder, `textkit/`, instead. The program writes the files from the `files` dict, as the example does; the checks then import your package.',
          '1. `textkit/_util.py` holds the helper `words(text)`; `textkit/slug.py` holds `slugify(text)`; `textkit/stats.py` holds `word_count(text)`.',
          '2. `slug.py` and `stats.py` get `words` with a **relative** import: `from ._util import words`.',
          '3. `textkit/__init__.py` brings `slugify` and `word_count` to the top, lists them in `__all__`, and sets `__version__ = "0.1.0"`.',
          '4. `textkit/__main__.py` makes `python -m textkit` print `textkit 0.1.0`.',
          '5. A `pyproject.toml` beside the folder names the project `textkit`, version `0.1.0`.'
        ].join('\n\n'),
        starter: String.raw`from pathlib import Path

files = {
    "textkit.py": (
        "import re\n\n"
        "def words(text):\n"
        "    return re.findall(r'[a-z0-9]+', text.lower())\n\n"
        "def slugify(text):\n"
        "    return '-'.join(words(text))\n\n"
        "def word_count(text):\n"
        "    return len(words(text))\n"
    ),
}

for name, source in files.items():
    Path(name).parent.mkdir(parents=True, exist_ok=True)
    Path(name).write_text(source, encoding="utf-8")

import textkit

print(textkit.slugify("Hello, World!"), textkit.word_count("one two three"))
`,
        solution: String.raw`from pathlib import Path

files = {
    "textkit/_util.py": (
        "import re\n\n"
        "def words(text):\n"
        "    return re.findall(r'[a-z0-9]+', text.lower())\n"
    ),
    "textkit/slug.py": (
        "from ._util import words\n\n"
        "def slugify(text):\n"
        "    return '-'.join(words(text))\n"
    ),
    "textkit/stats.py": (
        "from ._util import words\n\n"
        "def word_count(text):\n"
        "    return len(words(text))\n"
    ),
    "textkit/__init__.py": (
        "from .slug import slugify\n"
        "from .stats import word_count\n\n"
        "__all__ = ['slugify', 'word_count']\n"
        "__version__ = '0.1.0'\n"
    ),
    "textkit/__main__.py": (
        "from textkit import __version__\n\n"
        "print(f'textkit {__version__}')\n"
    ),
    "pyproject.toml": (
        "[project]\n"
        'name = "textkit"\n'
        'version = "0.1.0"\n'
    ),
}

for name, source in files.items():
    Path(name).parent.mkdir(parents=True, exist_ok=True)
    Path(name).write_text(source, encoding="utf-8")

import textkit

print(textkit.slugify("Hello, World!"), textkit.word_count("one two three"))
`,
        hints: [
          'Change the keys of `files` to paths inside the folder, such as `"textkit/slug.py"`. The loop already creates the folder (`mkdir(parents=True)`).',
          'In `slug.py`: `from ._util import words`, then the `slugify` function. The dot means "the package I am in".',
          '`__init__.py`: `from .slug import slugify`, `from .stats import word_count`, `__all__ = [\'slugify\', \'word_count\']` and `__version__ = \'0.1.0\'`. `__main__.py`: `from textkit import __version__`, then print it.',
          'The `pyproject.toml` text needs a `[project]` line, then `name = "textkit"` and `version = "0.1.0"`.'
        ],
        checks: [
          { label: '`textkit` is a package folder, not one file', code: 'import textkit\nassert hasattr(textkit, "__path__"), "textkit is still a single file: put the modules in a textkit/ folder"' },
          { label: '`textkit.slug.slugify` and `textkit.stats.word_count` work', code: 'import textkit.slug, textkit.stats\nassert textkit.slug.slugify("Hello, World!") == "hello-world"\nassert textkit.stats.word_count("one two  three") == 3' },
          { label: '`slug.py` and `stats.py` import `words` relatively', code: 'from pathlib import Path\nfor f in ("textkit/slug.py", "textkit/stats.py"):\n    t = ast.parse(Path(f).read_text(encoding="utf-8"))\n    assert any(isinstance(n, ast.ImportFrom) and n.level == 1 for n in ast.walk(t)), f"{f} should use a relative import: from ._util import words"' },
          { label: '`__init__.py` exports both, with `__all__` and `__version__`', code: 'import textkit\nassert sorted(getattr(textkit, "__all__", [])) == ["slugify", "word_count"]\nassert textkit.slugify("A b") == "a-b" and textkit.word_count("a b") == 2\nassert getattr(textkit, "__version__", None) == "0.1.0"' },
          { label: '`python -m textkit` prints `textkit 0.1.0`', code: 'import runpy\n_, printed = capture(runpy.run_module, "textkit", run_name="__main__")\nassert printed.strip() == "textkit 0.1.0", f"python -m textkit printed {printed!r}"' },
          { label: '`pyproject.toml` names the project and its version', code: 'import tomllib\nfrom pathlib import Path\nproject = tomllib.loads(Path("pyproject.toml").read_text(encoding="utf-8")).get("project", {})\nassert (project.get("name"), project.get("version")) == ("textkit", "0.1.0")' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'py-venv-pip', track: 'tooling',
      title: 'Virtual environments and pip: Maven\'s job',
      summary: 'Why every project gets its own virtual environment, the commands for venv and pip, requirements.txt and lock files, version specifiers such as >=2.31,<3 and ~=2.31, and the Maven commands they replace.',
      keywords: ['venv', 'virtual environment', 'pip', 'pypi', 'requirements.txt', 'maven', 'dependency', 'install', 'version', 'pin', 'uv', 'poetry', 'site-packages', 'activate', 'lock file', 'semver'],
      docs: 'https://docs.python.org/3/tutorial/venv.html',
      body: [
        'Maven keeps every version of every library in `~/.m2` and picks the ones your `pom.xml` asks for each time it builds. Python works differently: `import requests` finds exactly **one** installed copy, in the environment\'s `site-packages` folder. If two projects need different versions of `requests`, they need two environments. A **virtual environment** (venv) is that: a folder with its own `site-packages`, made for one project.',
        con(String.raw`
> python -m venv .venv                      (once per project: makes the .venv folder)
> .venv\Scripts\activate                    (Windows; on macOS and Linux: source .venv/bin/activate)
(.venv) > python -m pip install requests==2.32.3
(.venv) > python -m pip list
(.venv) > python -m pip freeze > requirements.txt
(.venv) > deactivate`),
        'Activating only puts the venv\'s `python` and `pip` first on the `PATH`; you can also call `.venv\\Scripts\\python` directly. Another developer (or the build server) repeats the set-up from the file: `python -m venv .venv`, activate, `python -m pip install -r requirements.txt`. Keep `.venv` out of git, as you keep `target/` out.',
        '## Which environment am I in?',
        py(String.raw`
import sys, sysconfig

print("this Python:", sys.version.split()[0])
print("in a virtual environment:", sys.prefix != sys.base_prefix)
print("packages are installed into:", sysconfig.get_paths()["purelib"])`),
        'Inside a venv, `sys.prefix` is the venv folder, while `sys.base_prefix` is the Python it was made from. `python -m pip` is safer than plain `pip`: it is always the pip of that exact Python.',
        '## Which packages, which versions?',
        py(String.raw`
from importlib import metadata

for name in ["pip", "requests", "pytest"]:
    try:
        print(name, metadata.version(name))
    except metadata.PackageNotFoundError:
        print(name, "is not installed here")`),
        '## Version specifiers',
        'A requirement names a package and, optionally, the versions it accepts (PEP 440):',
        '| Write | Means | Maven |\n|---|---|---|\n| `requests` | any version | (no version: not allowed) |\n| `requests==2.32.3` | exactly this one: a **pin** | `2.32.3` |\n| `requests>=2.31` | 2.31 or newer | `[2.31,)` |\n| `requests>=2.31,<3` | from 2.31, below 3 | `[2.31,3.0)` |\n| `requests~=2.31` | compatible: at least 2.31, below 3 | about `[2.31,3.0)` |\n| `requests~=2.31.4` | at least 2.31.4, below 2.32 | about `[2.31.4,2.32)` |\n| `requests!=2.30.0` | anything but that one | (exclusions) |',
        'Versions compare as numbers, part by part: 2.10 is newer than 2.9, and 2.31 is the same as 2.31.0.',
        '## Ranges for libraries, pins for applications',
        '`pyproject.toml` ([[lesson:py-packages]]) lists what the project needs, as ranges (`requests>=2.31,<3`), so it can be installed next to other packages. An application you deploy also wants a **lock**: the exact version of every package, including the ones your packages pulled in, so every install is identical. `pip freeze > requirements.txt` writes one; pip-tools, Poetry and uv write lock files.',
        '| Tool | What it adds |\n|---|---|\n| `venv` + `pip` | built into Python: enough for most work |\n| pip-tools | `pip-compile` turns your ranges into a pinned `requirements.txt` |\n| Poetry | one tool for the venv, dependencies, a lock file and publishing |\n| uv | the same jobs, written in Rust and very fast: `uv venv`, `uv add requests`, `uv lock` |\n| pipx | installs a command-line tool (such as `ruff`) into a venv of its own |',
        '| Maven | pip |\n|---|---|\n| Maven Central | PyPI, the Python Package Index |\n| `~/.m2/repository` | the venv\'s `site-packages` |\n| `mvn install` | `python -m pip install .` |\n| `mvn dependency:tree` | `python -m pip show requests` (what it requires and who requires it) |\n| `mvn versions:display-dependency-updates` | `python -m pip list --outdated` |\n| `mvn -U` | `python -m pip install -U requests` |',
        '**In this tool:** pylearn runs your programs on the Python that started it. Start it from an activated venv (`python pylearn.py`) and your programs see that venv\'s packages. The badge\'s details list the packages the Projects use and whether each is installed.'
      ].join('\n\n'),
      java: 'Maven resolves versions per build from one shared local repository; Python installs one version per environment, so each project gets its own environment instead. `pip` plus a venv together do Maven\'s dependency job; there is no build lifecycle (`compile`, `test`, `package`) to learn, because Python needs no compile step. Version ranges look different (`>=2.31,<3` rather than `[2.31,3.0)`) but mean the same, and `pip freeze` is the closest thing to a lock file built in.',
      example: {
        code: String.raw`import platform
import sys
import sysconfig
from importlib import metadata

print(f"Python {platform.python_version()} on {sys.platform}")
print("virtual environment:", "yes" if sys.prefix != sys.base_prefix else "no")
print("site-packages:", sysconfig.get_paths()["purelib"])

for name in ["pip", "pytest", "requests", "fastapi"]:
    try:
        version = metadata.version(name)
    except metadata.PackageNotFoundError:
        version = "missing: python -m pip install " + name
    print(f"  {name:<9} {version}")
print(len(list(metadata.distributions())), "packages installed in all")
`,
        note: 'Run it in the browser too: the in-browser Python has its own, different set of packages.'
      },
      challenge: {
        title: 'Read a requirements file',
        task: [
          'Write the part of pip that reads requirements and compares versions.',
          '1. `parse_version("2.31.0")` returns `(2, 31, 0)`: a tuple of whole numbers.',
          '2. `parse_requirement("requests>=2.31,<3")` returns `("requests", [(">=", (2, 31)), ("<", (3,))])`. The name is lowercased; spaces are allowed (`"Flask == 3.0.2"`); a bare name (`"rich"`) has no constraints. The operators are `==`, `!=`, `>=`, `<=`, `>`, `<` and `~=`.',
          '3. `satisfies(version, constraints)` is `True` when the version string meets every constraint. Versions compare as numbers, part by part, with missing parts counting as 0: `"2.31"` equals `"2.31.0"`, and `"2.10"` is newer than `"2.9"`.',
          '4. `~=` is the compatible release: `~=2.31` means at least 2.31 and below 3; `~=2.31.4` means at least 2.31.4 and below 2.32.',
          '5. `read_requirements(text)` returns `{name: constraints}` for each line of a requirements file, skipping blank lines and comments (a `#` starts one, also after a requirement).'
        ].join('\n\n'),
        starter: String.raw`def parse_version(text):
    return tuple(text.split("."))


def parse_requirement(line):
    name, _, version = line.partition(">=")
    return name, [(">=", parse_version(version))]


def satisfies(version, constraints):
    return all(version >= ".".join(map(str, wanted)) for op, wanted in constraints)


def read_requirements(text):
    return dict(parse_requirement(line) for line in text.splitlines())


print(parse_requirement("requests>=2.31"))
print(satisfies("2.9", [(">=", (2, 31))]))
`,
        solution: String.raw`import re

OPERATORS = ("==", "!=", ">=", "<=", "~=", ">", "<")      # two-character ones first


def parse_version(text):
    return tuple(int(part) for part in text.strip().split("."))


def parse_requirement(line):
    m = re.match(r"\s*([A-Za-z0-9_.-]+)\s*(.*)", line)
    name, rest = m.group(1).lower(), m.group(2)
    constraints = []
    for part in rest.split(","):
        part = part.strip()
        if part:
            op = next(o for o in OPERATORS if part.startswith(o))
            constraints.append((op, parse_version(part[len(op):])))
    return name, constraints


def padded(a, b):
    n = max(len(a), len(b))
    return a + (0,) * (n - len(a)), b + (0,) * (n - len(b))


def holds(version, op, wanted):
    v, w = padded(version, wanted)
    if op == "~=":
        upper = wanted[:-2] + (wanted[-2] + 1,)        # ~=2.31 -> below 3; ~=2.31.4 -> below 2.32
        below, top = padded(version, upper)
        return v >= w and below < top
    return {"==": v == w, "!=": v != w, ">=": v >= w, "<=": v <= w, ">": v > w, "<": v < w}[op]


def satisfies(version, constraints):
    v = parse_version(version)
    return all(holds(v, op, wanted) for op, wanted in constraints)


def read_requirements(text):
    result = {}
    for line in text.splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            name, constraints = parse_requirement(line)
            result[name] = constraints
    return result


print(parse_requirement("requests>=2.31,<3"))
print(satisfies("2.9", [(">=", (2, 31))]), satisfies("2.31.0", [("~=", (2, 31))]))
`,
        hints: [
          '`parse_version`: split on `"."` and turn each part into an `int`: `tuple(int(p) for p in text.split("."))`. Tuples of numbers compare part by part, which is exactly the version order.',
          '`parse_requirement`: a regular expression such as `\\s*([A-Za-z0-9_.-]+)\\s*(.*)` splits off the name; then split the rest on `","` and find which operator each part starts with. Check the two-character operators before `>` and `<`.',
          'For comparing, pad the shorter tuple with zeros so `(2, 31)` and `(2, 31, 0)` are equal. `~=` with `(2, 31)` means `>= (2, 31)` and `< (3,)`: drop the last part and add 1 to the new last one.',
          '`read_requirements`: cut every line at `"#"`, strip it, skip it if empty, and parse the rest.'
        ],
        checks: [
          { label: '`parse_version` gives a tuple of numbers', code: 'assert parse_version("2.31.0") == (2, 31, 0)\nassert parse_version("10") == (10,)' },
          { label: '`parse_requirement` splits the name and each constraint', code: 'assert parse_requirement("requests>=2.31,<3") == ("requests", [(">=", (2, 31)), ("<", (3,))])\nassert parse_requirement("Flask == 3.0.2") == ("flask", [("==", (3, 0, 2))])\nassert parse_requirement("rich") == ("rich", [])\nassert parse_requirement("idna!=3.1") == ("idna", [("!=", (3, 1))])' },
          { label: '`satisfies` compares versions as numbers', code: 'assert satisfies("2.10", [(">", (2, 9))])\nassert satisfies("2.31.0", [("==", (2, 31))])\nassert satisfies("2.31.5", parse_requirement("requests>=2.31,<3")[1])\nassert not satisfies("3.0", parse_requirement("requests>=2.31,<3")[1])\nassert not satisfies("3.1", [("!=", (3, 1))])' },
          { label: '`~=` is the compatible release', code: 'assert satisfies("2.99", [("~=", (2, 31))]) and not satisfies("3.0", [("~=", (2, 31))])\nassert not satisfies("2.30", [("~=", (2, 31))])\nassert satisfies("2.31.9", [("~=", (2, 31, 4))]) and not satisfies("2.32.0", [("~=", (2, 31, 4))])' },
          { label: '`read_requirements` skips blank lines and comments', code: 'text = "# app\\nrequests>=2.31,<3\\n\\nrich  # pretty output\\nFlask==3.0.2\\n"\nassert read_requirements(text) == {"requests": [(">=", (2, 31)), ("<", (3,))], "rich": [], "flask": [("==", (3, 0, 2))]}' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'py-pytest', track: 'tooling',
      title: 'pytest: tests without the boilerplate',
      summary: 'Test files and test functions with plain assert; what pytest reports when one fails; pytest.raises, fixtures, parametrize and the tmp_path fixture; mocks from unittest.mock; and a JUnit 5 to pytest table.',
      keywords: ['pytest', 'test', 'testing', 'junit', 'unit test', 'assert', 'fixture', 'parametrize', 'raises', 'mock', 'unittest', 'tdd', 'assertequals', 'assertthrows', 'mockito', 'test runner'],
      docs: 'https://docs.python.org/3/library/unittest.mock.html',
      body: [
        '**pytest** is the test framework most Python projects use. It is not part of Python (`python -m pip install pytest`; its documentation is at docs.pytest.org). Where JUnit wants a class, an annotation on every method and `assertEquals`, pytest wants a file named `test_*.py`, functions named `test_*`, and Python\'s own `assert`:',
        norun(String.raw`
# test_pricing.py
from shop.pricing import with_tax


def test_adds_18_percent():
    assert with_tax(100) == 118.0


def test_zero_stays_zero():
    assert with_tax(0) == 0`),
        con(String.raw`
> python -m pytest -q
..                                                                       [100%]
2 passed in 0.01s`),
        'When an `assert` fails, pytest rewrites it to show both sides, so `assertEquals(expected, actual)` is not needed:',
        con(String.raw`
    def test_adds_18_percent():
>       assert with_tax(100) == 118.5
E       assert 118.0 == 118.5
E        +  where 118.0 = with_tax(100)`),
        '## What pytest does, in a few lines',
        'At heart a test runner finds the functions whose names start with `test_`, calls each one, and counts the ones that raise. This program does exactly that, without pytest:',
        py(String.raw`
def add(a, b):
    return a + b

def test_add():
    assert add(2, 3) == 5

def test_add_negative():
    assert add(-2, -3) == -6       # wrong on purpose: the sum is -5

passed = failed = 0
for name, func in list(globals().items()):
    if name.startswith("test_") and callable(func):
        try:
            func()
            passed += 1
        except AssertionError:
            failed += 1
            print("FAILED", name)
print(f"{passed} passed, {failed} failed")`),
        'pytest adds the reports, finding test files in folders, fixtures, plugins and much more; but a test stays an ordinary function, which is why it needs no framework to read.',
        '## Testing that something fails: pytest.raises',
        norun(String.raw`
import pytest

def test_rejects_negative_amounts():
    with pytest.raises(ValueError, match="negative"):
        with_tax(-5)`),
        'The test passes only if the block raises a `ValueError` whose message contains "negative". `pytest.raises` is a context manager ([[lesson:py-context-managers]]): JUnit\'s `assertThrows`.',
        '## Set-up: fixtures instead of @BeforeEach',
        norun(String.raw`
import pytest

@pytest.fixture
def cart():
    c = Cart()
    c.add("tea", 100)
    return c                      # every test that asks for "cart" gets a fresh one

def test_total(cart):
    assert cart.total() == 118.0

def test_clear(cart):
    cart.clear()
    assert cart.total() == 0

def test_report(tmp_path):        # a built-in fixture: a new empty folder for this test
    report = tmp_path / "report.txt"
    report.write_text("ok")
    assert report.read_text() == "ok"`),
        'A test asks for a fixture by naming it as a parameter; pytest calls the fixture and passes in what it returns. A fixture that `yield`s instead of returning runs the code after the `yield` once the test is over: the teardown. Built-in fixtures include `tmp_path`, `monkeypatch` (change a setting or an environment variable for one test) and `capsys` (what the test printed).',
        '## Many cases: parametrize',
        norun(String.raw`
import pytest

@pytest.mark.parametrize("amount, expected", [(100, 118.0), (0, 0), (9.99, 11.79)])
def test_with_tax(amount, expected):
    assert with_tax(amount) == expected`),
        '## Mocks',
        'Mocks come with Python, in `unittest.mock`, and work the same with pytest:',
        py(String.raw`
from unittest.mock import Mock

def welcome(user, mailer):
    if user["email"]:
        mailer.send(user["email"], "Welcome!")

mailer = Mock()
welcome({"email": "asha@example.com"}, mailer)
mailer.send.assert_called_once_with("asha@example.com", "Welcome!")
welcome({"email": ""}, mailer)
print("send was called", mailer.send.call_count, "time")`),
        '| JUnit 5 | pytest |\n|---|---|\n| a test class with `@Test` methods | `test_*` functions in a `test_*.py` file (classes are optional) |\n| `assertEquals(5, add(2, 3))` | `assert add(2, 3) == 5` |\n| `assertTrue(ok)`, `assertNull(x)` | `assert ok`, `assert x is None` |\n| `assertThrows(E.class, () -> f())` | `with pytest.raises(E): f()` |\n| `@BeforeEach`, `@AfterEach` | a fixture; `yield` separates set-up and teardown |\n| `@ParameterizedTest` | `@pytest.mark.parametrize` |\n| `@Disabled` | `@pytest.mark.skip` |\n| `@TempDir` | the `tmp_path` fixture |\n| Mockito `mock()`, `verify()` | `Mock()`, `assert_called_once_with()` |\n| `mvn test` | `pytest`; `-x` stops at the first failure, `-k word` runs matching tests |',
        'Python also ships `unittest`, a JUnit-style framework with test classes and `self.assertEqual` ([[ref:mod-unittest]]). pytest runs those tests too, so older projects can move over slowly.',
        '**In this tool:** pytest is not installed, so the challenge writes pytest-style tests (plain functions and plain `assert`) and runs them without it. A small `raises` helper stands in for `pytest.raises`. With pytest installed, the same tests run unchanged.'
      ].join('\n\n'),
      java: 'A pytest test is a plain function with plain `assert`: no class, no `@Test`, no assertion library. The test runner finds it by its name. Fixtures replace `@BeforeEach`/`@AfterEach` and are requested by parameter name, the way Spring injects a bean; `parametrize` is `@ParameterizedTest`; `pytest.raises` is `assertThrows`; `unittest.mock` covers what Mockito does.',
      example: {
        code: String.raw`class Cart:
    def __init__(self):
        self.items = {}

    def add(self, name, price, qty=1):
        if price < 0:
            raise ValueError("price cannot be negative")
        self.items[name] = self.items.get(name, 0) + price * qty

    def total(self):
        return sum(self.items.values())


# the tests: plain functions with plain asserts, exactly as pytest wants them
def test_empty_cart_totals_zero():
    assert Cart().total() == 0


def test_adds_quantities():
    cart = Cart()
    cart.add("tea", 30, qty=2)
    cart.add("tea", 30)
    assert cart.total() == 90


def test_rejects_negative_price():
    try:
        Cart().add("tea", -1)
    except ValueError as e:
        assert "negative" in str(e)
    else:
        raise AssertionError("no ValueError was raised")


def test_a_failure_on_purpose():
    assert Cart().total() == 1, "this one fails, to show a failure report"


# a tiny runner: what "pytest -q" does for you
results = {}
for name, func in list(globals().items()):
    if name.startswith("test_") and callable(func):
        try:
            func()
            results[name] = "passed"
        except AssertionError as e:
            results[name] = f"FAILED: {e}"
for name, outcome in results.items():
    print(f"{name:<30} {outcome}")
print(sum(r == "passed" for r in results.values()), "passed,", sum(r != "passed" for r in results.values()), "failed")
`,
        note: 'With pytest installed, save the class and the four `test_` functions as `test_cart.py` and run `python -m pytest`: the report says the same, with more detail.'
      },
      challenge: {
        title: 'Tests that catch bugs',
        task: [
          '`parse_price` below works. Your job is to write the tests that would catch someone breaking it. The checks plant one bug at a time in `parse_price` and run your tests against it: a good test suite fails for every bug.',
          '1. Write at least five `test_` functions with plain `assert`s. They all pass on the real `parse_price`, which you leave as it is.',
          '2. Your tests catch each planted bug: a `parse_price` that forgets the `$` sign, one that forgets the thousands commas, one that accepts negative prices, and one that cuts off the cents.',
          '3. Test the error cases with the `raises` helper, the way you would with `pytest.raises`: `with raises(ValueError): parse_price("-5")`.'
        ].join('\n\n'),
        starter: String.raw`from contextlib import contextmanager


def parse_price(text):
    """Turn "$1,299.50" into 1299.5. Spaces and the $ sign are optional; commas group thousands.
    Raises ValueError for an empty text, a negative price, or text that is not a number."""
    cleaned = text.strip().removeprefix("$").replace(",", "")
    if not cleaned:
        raise ValueError("empty price")
    value = float(cleaned)
    if value < 0:
        raise ValueError("negative price")
    return round(value, 2)


@contextmanager
def raises(expected):
    """A stand-in for pytest.raises, so these tests run without installing pytest."""
    try:
        yield
    except expected:
        return
    raise AssertionError(f"{expected.__name__} was not raised")


def test_plain_number():
    assert parse_price("12") == 12


if __name__ == "__main__":
    for name, func in list(globals().items()):
        if name.startswith("test_"):
            func()
            print("passed", name)
`,
        solution: String.raw`from contextlib import contextmanager


def parse_price(text):
    """Turn "$1,299.50" into 1299.5. Spaces and the $ sign are optional; commas group thousands.
    Raises ValueError for an empty text, a negative price, or text that is not a number."""
    cleaned = text.strip().removeprefix("$").replace(",", "")
    if not cleaned:
        raise ValueError("empty price")
    value = float(cleaned)
    if value < 0:
        raise ValueError("negative price")
    return round(value, 2)


@contextmanager
def raises(expected):
    """A stand-in for pytest.raises, so these tests run without installing pytest."""
    try:
        yield
    except expected:
        return
    raise AssertionError(f"{expected.__name__} was not raised")


def test_plain_number():
    assert parse_price("12") == 12


def test_dollar_sign_and_spaces():
    assert parse_price("  $5.25 ") == 5.25


def test_thousands_commas():
    assert parse_price("$1,299.50") == 1299.5


def test_keeps_the_cents():
    assert parse_price("0.99") == 0.99


def test_rejects_negative_prices():
    with raises(ValueError):
        parse_price("-5")


def test_rejects_empty_and_text():
    with raises(ValueError):
        parse_price("   ")
    with raises(ValueError):
        parse_price("abc")


if __name__ == "__main__":
    for name, func in list(globals().items()):
        if name.startswith("test_"):
            func()
            print("passed", name)
`,
        hints: [
          'Think of each bug and write the test that would notice it: a price with a `$` in front, one with a comma (`"1,299"`), one with cents (`"0.99"`), and a negative one.',
          'A test for an error: `with raises(ValueError):` and the call inside the block. The test fails if the call does not raise.',
          'Each test is a function `def test_something():` with one or two `assert parse_price(...) == ...` lines. Keep each test about one thing: its name then says what broke.'
        ],
        checks: [
          { label: 'At least five `test_` functions', code: 'tests = [n for n, f in globals().items() if n.startswith("test_") and callable(f)]\nassert len(tests) >= 5, f"only {len(tests)} so far: {tests}"\nassert uses("Assert"), "use plain assert statements"' },
          { label: '`parse_price` itself is unchanged', code: 'assert parse_price(" $1,299.50 ") == 1299.5 and parse_price("7") == 7.0\nfor bad in ("-1", "", "abc"):\n    try:\n        parse_price(bad)\n    except ValueError:\n        pass\n    else:\n        raise AssertionError(f"parse_price({bad!r}) should raise ValueError: leave it as it was")' },
          { label: 'All your tests pass on the real `parse_price`', code: MUTANTS + 'failed = failures(parse_price)\nassert not failed, f"these tests fail on the correct parse_price: {failed}"' },
          { label: 'They catch a `parse_price` that forgets the `$` sign', code: MUTANTS + 'assert failures(no_dollar), "no test failed: add one with a $ sign, such as parse_price(\\"$5\\")"' },
          { label: 'They catch one that forgets the thousands commas', code: MUTANTS + 'assert failures(no_commas), "no test failed: add one with a comma, such as parse_price(\\"1,299\\")"' },
          { label: 'They catch one that accepts negative prices', code: MUTANTS + 'assert failures(allows_negative), "no test failed: check that parse_price(\\"-5\\") raises ValueError"' },
          { label: 'They catch one that cuts off the cents', code: MUTANTS + 'assert failures(drops_cents), "no test failed: add one with cents, such as parse_price(\\"0.99\\")"' },
          { label: 'Error cases are tested with `raises`', code: 'assert calls("raises"), "test an error case: with raises(ValueError): ..."' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'py-logging-debugging', track: 'tooling',
      title: 'Logging and the debugger',
      summary: 'The logging module instead of print: levels, one logger per module, basicConfig and formats, handlers and files, logging an exception with its traceback. Then breakpoint() and the pdb commands, fed here from the Input box.',
      keywords: ['logging', 'logger', 'log', 'level', 'debug', 'info', 'warning', 'error', 'basicconfig', 'handler', 'slf4j', 'log4j', 'logback', 'pdb', 'breakpoint', 'debugger', 'traceback', 'exception'],
      docs: 'https://docs.python.org/3/howto/logging.html',
      blockStdin: 'p items\np total\np total / len(items)\nc\n',
      body: [
        '`print` is for a program\'s output. **Logging** is for messages *about* the program: each one has a level, the name of the code that sent it, and a time, and the program decides where they go and how much detail to keep, without changing the code that logs. Python\'s `logging` module is built in: what SLF4J and Logback are in Java.',
        py(String.raw`
import logging

logging.basicConfig(level=logging.DEBUG, format="%(levelname)-8s %(name)s: %(message)s")
log = logging.getLogger("orders")

log.debug("connecting to %s", "db-1")       # details, for whoever is debugging
log.info("order %s accepted", "A17")         # the normal course of events
log.warning("stock low: %d left", 3)         # unexpected, but the program carries on
log.error("payment failed for %s", "A18")    # an operation failed
log.critical("database unreachable")         # the program cannot go on`),
        '| Level | Number | Use it for | SLF4J |\n|---|---|---|---|\n| `DEBUG` | 10 | detail you need only while hunting a bug | `debug` (and `trace`) |\n| `INFO` | 20 | the normal course of events | `info` |\n| `WARNING` | 30 | something unexpected; the default level shown | `warn` |\n| `ERROR` | 40 | an operation failed | `error` |\n| `CRITICAL` | 50 | the program cannot continue | (Log4j\'s `fatal`) |',
        'Log messages go to standard error, not standard output, so they never mix with what the program prints as its result (here they show in the error colour). Pass the values as arguments, `log.info("order %s", order_id)`, rather than an f-string: the text is then only built if the message is actually shown, like SLF4J\'s `{}` placeholders.',
        '## One logger per module',
        'Each module asks for its own logger with `log = logging.getLogger(__name__)`, so the name says where a message came from. Logger names form a tree along the dots: `shop.cart` is a child of `shop`, and a level set on `shop` applies to everything below it. Configure logging **once**, in the program\'s entry point, never inside a library:',
        py(String.raw`
import logging

logging.basicConfig(level=logging.WARNING, format="%(name)s %(levelname)s %(message)s")
logging.getLogger("shop").setLevel(logging.DEBUG)       # more detail from our own code only

logging.getLogger("shop.cart").debug("added tea")       # shown: shop.cart is under shop
logging.getLogger("urllib3").info("connection pool")    # hidden: everything else stays at WARNING
logging.getLogger("urllib3").warning("retrying")        # shown`),
        '## Logging an exception',
        'Inside an `except` block, `log.exception(...)` logs at `ERROR` level and adds the traceback, so you keep the whole story without letting the program crash:',
        py(String.raw`
import logging

logging.basicConfig(format="%(levelname)s %(message)s")
log = logging.getLogger("import")

for line in ["4", "x", "5"]:
    try:
        print(20 / int(line))
    except ValueError:
        log.exception("skipped the bad line %r", line)`),
        '## Formats, handlers and files',
        'A **handler** sends messages somewhere: the screen (`StreamHandler`), a file (`FileHandler`, `RotatingFileHandler`), the network. A **formatter** decides how a line looks, with fields such as `%(asctime)s`, `%(levelname)s`, `%(name)s`, `%(funcName)s`, `%(lineno)d` and `%(message)s`. `logging.config.dictConfig` sets everything up from one dict, the way `logback.xml` does.',
        py(String.raw`
import logging
from pathlib import Path

log = logging.getLogger("app")
log.setLevel(logging.INFO)
handler = logging.FileHandler("app.log", encoding="utf-8")
handler.setFormatter(logging.Formatter("%(levelname)s|%(funcName)s|%(message)s"))
log.addHandler(handler)

def start():
    log.info("started")

start()
handler.close()
print(Path("app.log").read_text(encoding="utf-8"))`),
        '## The debugger: breakpoint()',
        'Put `breakpoint()` on a line and the program stops there and opens **pdb**, Python\'s debugger. You type commands; it answers. In this tool the commands come from the **Input** box, one per line, as if you typed them in a terminal. This block was run with the input `p items`, `p total`, `p total / len(items)` and `c`:',
        py(String.raw`
def average(items):
    total = 0
    for x in items:
        total += x
    breakpoint()                  # stops here and reads debugger commands
    return total / len(items)

print(average([4, 8, 9]))`),
        '| pdb command | What it does | IntelliJ |\n|---|---|---|\n| `p expr` | print a value (`pp` for a pretty one) | Evaluate Expression |\n| `n` | run the next line, stepping over calls | Step Over (F8) |\n| `s` | step into the call on this line | Step Into (F7) |\n| `r` | run until this function returns | Step Out |\n| `c` | continue to the next breakpoint | Resume (F9) |\n| `l` | list the source around this line | the editor |\n| `w` | where: the call stack | Frames |\n| `b 12` | set a breakpoint at line 12 | a click in the gutter |\n| `q` | quit | Stop |',
        'IDEs such as VS Code and PyCharm drive the same machinery with buttons. `PYTHONBREAKPOINT=0` switches every `breakpoint()` off, but they should never stay in finished code.'
      ].join('\n\n'),
      java: 'Java needs a facade and an implementation (SLF4J with Logback or Log4j); Python has one built-in module. `logging.getLogger(__name__)` is `LoggerFactory.getLogger(MyClass.class)`, `%s` placeholders are `{}`, and `basicConfig` or `dictConfig` replace `logback.xml`. `breakpoint()` is a breakpoint written into the code; pdb is a command-line debugger like `jdb`.',
      example: {
        code: String.raw`import logging

logging.basicConfig(level=logging.DEBUG, format="%(levelname)-7s %(name)s.%(funcName)s: %(message)s")
log = logging.getLogger("orders")


def total(order):
    log.debug("pricing %s with %d items", order["id"], len(order["items"]))
    return sum(qty * price for qty, price in order["items"])


def process(orders):
    done = 0
    for order in orders:
        try:
            amount = total(order)
        except (KeyError, TypeError):
            log.exception("order %s is malformed, skipped", order.get("id", "?"))
            continue
        if amount > 1000:
            log.warning("order %s is large: %.2f", order["id"], amount)
        log.info("order %s done: %.2f", order["id"], amount)
        done += 1
    return done


orders = [
    {"id": "A1", "items": [(2, 30.0), (1, 15.5)]},
    {"id": "A2", "items": [(10, 120.0)]},
    {"id": "A3"},
]
print(process(orders), "of", len(orders), "orders processed")
`,
        note: 'Change `level=logging.DEBUG` to `logging.INFO`: the `pricing` lines disappear, and no other line of code changes.'
      },
      challenge: {
        title: 'From print to logging',
        task: [
          '1. Make a logger for the module: `log = logging.getLogger("orders")`.',
          '2. `process(order)` logs instead of printing: `DEBUG` `processing A1` when it starts; `INFO` `order A1 done: 60.00` (the total with two decimals) when it succeeds; and also `WARNING` `large order A2` when the total is over 1000. It returns the total.',
          '3. A malformed order (no `"items"`, or an item that is not a pair of numbers) is logged with `log.exception(...)`, so the traceback is kept, and `process` returns `None` instead of crashing.',
          '4. `process` prints nothing at all.',
          '5. `main()` sets logging up with `logging.basicConfig(level=logging.INFO, ...)`, and is called only under `if __name__ == "__main__":`.'
        ].join('\n\n'),
        starter: String.raw`def process(order):
    print("processing", order["id"])
    total = sum(qty * price for qty, price in order["items"])
    print(f"order {order['id']} done: {total:.2f}")
    if total > 1000:
        print("large order", order["id"])
    return total


def main():
    for order in [{"id": "A1", "items": [(2, 30.0)]}, {"id": "A2"}]:
        process(order)


if __name__ == "__main__":
    main()
`,
        solution: String.raw`import logging

log = logging.getLogger("orders")


def process(order):
    log.debug("processing %s", order.get("id"))
    try:
        total = sum(qty * price for qty, price in order["items"])
    except (KeyError, TypeError, ValueError):
        log.exception("order %s is malformed", order.get("id"))
        return None
    log.info("order %s done: %.2f", order["id"], total)
    if total > 1000:
        log.warning("large order %s", order["id"])
    return total


def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    for order in [{"id": "A1", "items": [(2, 30.0)]}, {"id": "A2", "items": [(9, 200.0)]}, {"id": "A3"}]:
        process(order)


if __name__ == "__main__":
    main()
`,
        hints: [
          '`import logging` at the top, then `log = logging.getLogger("orders")`. Replace each `print` in `process` with `log.debug`, `log.info` or `log.warning`, passing the values as arguments: `log.info("order %s done: %.2f", order["id"], total)`.',
          'Wrap the line that computes the total in `try:`; in `except (KeyError, TypeError, ValueError):` call `log.exception("order %s is malformed", order.get("id"))` and `return None`.',
          'Use `order.get("id")` in the first message, so an order without an id cannot crash the logging itself. Put `logging.basicConfig(level=logging.INFO)` as the first line of `main()`.'
        ],
        checks: [
          { label: '`log` is the `"orders"` logger', code: 'import logging\nassert isinstance(globals().get("log"), logging.Logger), "make log = logging.getLogger(\\"orders\\")"\nassert log.name == "orders"' },
          { label: 'A good order logs `DEBUG` and `INFO`, and returns the total', code: LOGGED + 'result, printed, recs, raw = logged({"id": "A1", "items": [(2, 30.0)]})\nassert result == 60.0\nassert ("DEBUG", "processing A1") in recs, f"the records were {recs}"\nassert ("INFO", "order A1 done: 60.00") in recs, f"the records were {recs}"\nassert not any(level == "WARNING" for level, _ in recs), "a small order is not large"' },
          { label: 'A total over 1000 also logs a `WARNING`', code: LOGGED + 'result, printed, recs, raw = logged({"id": "A2", "items": [(9, 200.0)]})\nassert result == 1800.0 and ("WARNING", "large order A2") in recs, f"the records were {recs}"' },
          { label: 'A malformed order is logged with its traceback, and gives `None`', code: LOGGED + 'for bad in ({"id": "A3"}, {"id": "A4", "items": [("x", 2)]}):\n    result, printed, recs, raw = logged(bad)\n    assert result is None, f"process({bad}) returned {result!r} instead of None"\n    assert any(r.levelname == "ERROR" and r.exc_info for r in raw), "log the error with log.exception(...) inside the except block"' },
          { label: '`process` prints nothing', code: LOGGED + 'for order in ({"id": "A1", "items": [(1, 2.0)]}, {"id": "A2", "items": [(9, 200.0)]}, {"id": "A3"}):\n    printed = logged(order)[1]\n    assert printed == "", f"process printed {printed!r}: log it instead"' },
          { label: '`main()` calls `logging.basicConfig`', code: 'main_def = next((n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef) and n.name == "main"), None)\nassert main_def, "define main()"\nnames = [getattr(c.func, "attr", getattr(c.func, "id", "")) for c in ast.walk(main_def) if isinstance(c, ast.Call)]\nassert "basicConfig" in names, "call logging.basicConfig(level=logging.INFO) inside main()"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'py-context-managers', track: 'tooling',
      title: 'Context managers: with, __enter__ and __exit__',
      summary: 'What with does: __enter__, __exit__ and the exception it receives; writing a context manager as a class and with @contextmanager; ExitStack, suppress and other standard ones; Java\'s try-with-resources and @Transactional, in Python.',
      keywords: ['with', 'context manager', '__enter__', '__exit__', 'contextmanager', 'contextlib', 'try-with-resources', 'autocloseable', 'exitstack', 'suppress', 'cleanup', 'finally', 'resource', 'transaction', 'lock'],
      docs: 'https://docs.python.org/3/reference/datamodel.html#context-managers',
      body: [
        '`with open(path) as f:` closes the file however the block ends: normally, by `return`, or by an exception. That is Java\'s try-with-resources. The object after `with` is a **context manager**, and anything can be one: a file, a lock, a database transaction, a timer, a temporary setting.',
        '## What with does',
        'A context manager has two methods. `__enter__` runs before the block, and what it returns is what `as` receives. `__exit__` runs after the block, always, and is told whether an exception is on its way out:',
        py(String.raw`
class Resource:
    def __init__(self, name):
        self.name = name

    def __enter__(self):
        print("open", self.name)
        return self                     # what "as r" receives

    def __exit__(self, exc_type, exc, tb):
        print("close", self.name, "after", exc_type.__name__ if exc_type else "no error")
        return False                    # False: let the exception carry on upwards

with Resource("db") as r:
    print("using", r.name)

try:
    with Resource("file"):
        raise KeyError("missing")
except KeyError:
    print("the KeyError still reached the caller")`),
        'If `__exit__` returns `True`, the exception is **swallowed** and the program continues after the `with` block. That is rarely what you want; it is how `contextlib.suppress` works.',
        '## The short way: @contextmanager',
        'Most context managers are written as a generator with one `yield`. Everything before the `yield` is `__enter__`, the `yield` is where the block runs, and everything after it is `__exit__`:',
        py(String.raw`
import time
from contextlib import contextmanager

@contextmanager
def timer(label):
    start = time.perf_counter()
    try:
        yield                          # the with-block runs here
    finally:
        print(f"{label} took {time.perf_counter() - start:.3f} s")

with timer("summing"):
    total = sum(range(1_000_000))
print(total)`),
        'The `try`/`finally` matters: an exception in the block is raised again at the `yield`, so without it the clean-up after the `yield` would be skipped.',
        '## Several at once, and ExitStack',
        py(String.raw`
from contextlib import ExitStack, suppress
from pathlib import Path

for name in ["a.txt", "b.txt"]:
    Path(name).write_text(name.upper(), encoding="utf-8")

with open("a.txt", encoding="utf-8") as a, open("b.txt", encoding="utf-8") as b:
    print(a.read(), b.read())

names = ["a.txt", "b.txt"]
with ExitStack() as stack:                 # as many resources as you find at run time
    files = [stack.enter_context(open(n, encoding="utf-8")) for n in names]
    print([f.read() for f in files])
print("all closed:", all(f.closed for f in files))

with suppress(FileNotFoundError):          # ignore exactly this error, nothing else
    Path("missing.txt").unlink()
print("carried on")`),
        '| Context manager | Sets up, then cleans up |\n|---|---|\n| `open(path)` | opens the file, then closes it |\n| `threading.Lock()` | takes the lock, then releases it: Java\'s `synchronized` |\n| `contextlib.suppress(E)` | nothing, then swallows `E` |\n| `contextlib.redirect_stdout(f)` | sends `print` to `f`, then back |\n| `tempfile.TemporaryDirectory()` | makes a folder, then deletes it |\n| `decimal.localcontext()` | changes the precision, then restores it |\n| `unittest.mock.patch(...)` | replaces something for a test, then puts it back |\n| `pytest.raises(E)` | nothing, then fails unless `E` was raised |',
        'The same idea gives Python its version of Spring\'s `@Transactional`: the example on the right commits a transaction when the block succeeds and rolls it back when it raises.'
      ].join('\n\n'),
      java: '`with` is try-with-resources, and `__exit__` is `AutoCloseable.close()`, with two differences. `__exit__` receives the exception (if any), so it can act on it, such as rolling a transaction back; and it can swallow it by returning `True`. And any object can be a context manager, so the pattern covers locks (`with lock:` instead of `lock()` and `unlock()` in `finally`), transactions, timers and temporary settings, not just closing things.',
      example: {
        code: String.raw`import copy
from contextlib import contextmanager


class Database:
    def __init__(self):
        self.data = {"asha": 100, "ravi": 50}

    @contextmanager
    def transaction(self):
        snapshot = copy.deepcopy(self.data)
        try:
            yield self.data
        except Exception:
            self.data = snapshot              # roll back every change
            print("  rolled back")
            raise
        else:
            print("  committed")


def transfer(db, src, dst, amount):
    with db.transaction() as data:
        data[src] -= amount
        if data[src] < 0:
            raise ValueError(f"{src} cannot pay {amount}")
        data[dst] += amount


db = Database()
transfer(db, "asha", "ravi", 30)
print(db.data)
try:
    transfer(db, "ravi", "asha", 500)
except ValueError as e:
    print("refused:", e)
print(db.data)
`,
        note: 'The second transfer took 500 from Ravi before it failed; the rollback put it back.'
      },
      challenge: {
        title: 'Three context managers',
        task: [
          '1. `Timer` is a class: `with Timer() as t:` gives the `Timer` itself, and after the block `t.elapsed` holds how long the block took, in seconds. It sets `elapsed` even when the block raises, and it never swallows the exception.',
          '2. `temp_value(obj, name, value)` is written with `@contextmanager`: inside the block, `obj.<name>` is `value`; afterwards the old value is back, also when the block raised.',
          '3. `ignore(*kinds)` is a class: it swallows exceptions of the given kinds (and their subclasses), and lets every other exception through.'
        ].join('\n\n'),
        starter: String.raw`import time
from contextlib import contextmanager


class Timer:
    def __enter__(self):
        self.start = time.perf_counter()

    def __exit__(self, exc_type, exc, tb):
        self.elapsed = time.perf_counter() - self.start
        return True


@contextmanager
def temp_value(obj, name, value):
    setattr(obj, name, value)
    yield


class ignore:
    def __init__(self, *kinds):
        self.kinds = kinds

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


with Timer() as t:
    sum(range(100_000))
print(t)
`,
        solution: String.raw`import time
from contextlib import contextmanager


class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        self.elapsed = 0.0
        return self

    def __exit__(self, exc_type, exc, tb):
        self.elapsed = time.perf_counter() - self.start
        return False


@contextmanager
def temp_value(obj, name, value):
    old = getattr(obj, name)
    setattr(obj, name, value)
    try:
        yield obj
    finally:
        setattr(obj, name, old)


class ignore:
    def __init__(self, *kinds):
        self.kinds = kinds

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return exc_type is not None and issubclass(exc_type, self.kinds)


with Timer() as t:
    sum(range(100_000))
print(f"{t.elapsed:.4f} s")
with ignore(KeyError):
    {}["missing"]
print("the KeyError was ignored")
`,
        hints: [
          '`Timer.__enter__` must `return self`, so that `as t` receives the timer. `__exit__` returns `False`, which lets any exception continue.',
          '`temp_value`: remember `old = getattr(obj, name)`, set the new value, then `try: yield` and `finally: setattr(obj, name, old)`. The `finally` is what restores it after an exception.',
          '`ignore.__exit__` receives the exception\'s class as `exc_type` (`None` when there was none). Return `True` to swallow it: `exc_type is not None and issubclass(exc_type, self.kinds)`; `issubclass` accepts a tuple of classes.'
        ],
        checks: [
          { label: '`with Timer() as t` gives the timer, which measures the block', code: 'import time\nwith Timer() as t:\n    time.sleep(0.05)\nassert isinstance(t, Timer), "__enter__ should return self, so that \'as t\' gets the Timer"\nassert 0.04 <= t.elapsed < 5, f"elapsed is {t.elapsed}"' },
          { label: '`Timer` lets an exception through, and still sets `elapsed`', code: 't = Timer()\ntry:\n    with t:\n        raise KeyError("boom")\nexcept KeyError:\n    pass\nelse:\n    raise AssertionError("the KeyError was swallowed: __exit__ must return False")\nassert t.elapsed >= 0' },
          { label: '`temp_value` sets the value, then restores it', code: 'class Settings:\n    pass\ns = Settings()\ns.debug = False\nwith temp_value(s, "debug", True):\n    assert s.debug is True, "inside the block the new value should be set"\nassert s.debug is False, "after the block the old value should be back"' },
          { label: '`temp_value` restores it after an exception too', code: 'class Settings:\n    pass\ns = Settings()\ns.level = 1\ntry:\n    with temp_value(s, "level", 5):\n        raise RuntimeError("boom")\nexcept RuntimeError:\n    pass\nassert s.level == 1, f"after an error the value is still {s.level}: restore it in a finally"' },
          { label: '`temp_value` is a generator with `@contextmanager`', code: 'import inspect\nassert inspect.isgeneratorfunction(getattr(temp_value, "__wrapped__", None)), "write temp_value as a generator decorated with @contextmanager"' },
          { label: '`ignore` swallows the kinds it was given, and their subclasses', code: 'with ignore(KeyError, ZeroDivisionError):\n    {}["x"]\nwith ignore(KeyError, ZeroDivisionError):\n    1 / 0\nwith ignore(LookupError):\n    [][1]' },
          { label: '`ignore` lets other exceptions through', code: 'try:\n    with ignore(KeyError):\n        int("x")\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("ignore(KeyError) swallowed a ValueError")' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'py-argparse', track: 'tooling',
      title: 'Command-line programs with argparse',
      summary: 'sys.argv, then argparse: positional arguments, options with types and defaults, flags, choices, generated --help, errors with exit code 2, and subcommands like git\'s. The main(argv) shape that makes a command-line program testable.',
      keywords: ['argparse', 'command line', 'cli', 'sys.argv', 'arguments', 'options', 'flags', 'subcommand', 'help', 'exit code', 'main', 'picocli', 'args', 'parser', 'sys.exit'],
      docs: 'https://docs.python.org/3/library/argparse.html',
      body: [
        'A program started as `python wc.py --lines notes.txt` finds its arguments in `sys.argv`, a list of strings: `["wc.py", "--lines", "notes.txt"]`, the program\'s own name first. (In this tool every program runs as `python main.py`, so `sys.argv` is `["main.py"]`.) Reading that list by hand gets messy fast; the standard `argparse` module does it for you.',
        '## argparse',
        'You describe the arguments; `argparse` reads them, converts their types, checks them, writes the `--help` text, and reports mistakes:',
        py(String.raw`
import argparse

parser = argparse.ArgumentParser(prog="greet", description="Say hello.")
parser.add_argument("name")                                    # positional: required
parser.add_argument("-t", "--times", type=int, default=1)      # an option that takes a value
parser.add_argument("--shout", action="store_true")            # a flag: True when given

args = parser.parse_args(["Asha", "--times", "2", "--shout"])  # without a list: reads sys.argv
print(args)
for _ in range(args.times):
    message = f"Hello, {args.name}!"
    print(message.upper() if args.shout else message)`),
        '`parse_args()` with no list reads `sys.argv[1:]`. Passing a list, as here, is how you try a parser out, and how tests call it.',
        py(String.raw`
import argparse

parser = argparse.ArgumentParser(prog="greet", description="Say hello.")
parser.add_argument("name", help="who to greet")
parser.add_argument("-t", "--times", type=int, default=1, help="how many times (default: 1)")
parser.print_help()`),
        'A mistake on the command line makes `argparse` print the usage and an error to standard error and stop the program with **exit code 2**, by raising `SystemExit`:',
        py(String.raw`
import argparse

parser = argparse.ArgumentParser(prog="greet")
parser.add_argument("--times", type=int)
try:
    parser.parse_args(["--times", "lots"])
except SystemExit as e:
    print("argparse stopped with exit code", e.code)`),
        '| `add_argument(...)` option | What it does |\n|---|---|\n| `type=int` (or `float`, `pathlib.Path`, any function) | converts the text, and reports a bad value |\n| `default=...` | the value when the option is not given |\n| `choices=["low", "high"]` | only these values are accepted |\n| `action="store_true"` | a flag without a value |\n| `action="count"` | `-vvv` gives 3 |\n| `nargs="+"`, `"*"`, `"?"` | one or more, any number, an optional one |\n| `required=True` | an option that must be given |\n| `dest="name"`, `metavar="FILE"` | the attribute name, the name in the help |',
        '## Subcommands',
        'Tools like `git` and `pip` have commands with arguments of their own (`git commit -m ...`, `pip install ...`). `add_subparsers` builds that:',
        py(String.raw`
import argparse

parser = argparse.ArgumentParser(prog="notes")
sub = parser.add_subparsers(dest="command", required=True)
add = sub.add_parser("add", help="add a note")
add.add_argument("text")
show = sub.add_parser("list", help="list the notes")
show.add_argument("--limit", type=int, default=10)

print(parser.parse_args(["add", "buy milk"]))
print(parser.parse_args(["list", "--limit", "3"]))`),
        '## The shape of a command-line program',
        py(String.raw`
import argparse
import sys


def main(argv=None):
    parser = argparse.ArgumentParser(prog="shout")
    parser.add_argument("words", nargs="+")
    args = parser.parse_args(argv)             # None: read sys.argv[1:]
    if any(not w.isalpha() for w in args.words):
        print("shout: only letters, please", file=sys.stderr)
        return 1                               # an exit code: not 0 means it failed
    print(" ".join(args.words).upper() + "!")
    return 0


if __name__ == "__main__":
    print("exit code", main(["hello", "world"]))   # a real program: sys.exit(main())`),
        '`main(argv=None)` takes the arguments as a list and returns an exit code, 0 for success. The program itself ends with `sys.exit(main())`, which passes `sys.argv`; a test calls `main(["hello"])` directly and checks what it printed and returned. Results go to standard output and messages to `sys.stderr`, so the output can be piped into another program. Bigger tools often use the third-party `click` or `typer` libraries, which build the parser from a function\'s parameters.'
      ].join('\n\n'),
      java: '`sys.argv` is `String[] args`, with the program\'s name at index 0. `argparse` does what picocli or Apache Commons CLI do in Java, without annotations: you call `add_argument` for each option. `sys.exit(code)` is `System.exit(code)`, and `if __name__ == "__main__":` plays the part of `public static void main`.',
      example: {
        code: String.raw`import argparse
import sys
from pathlib import Path


def build_parser():
    p = argparse.ArgumentParser(prog="wc", description="Count lines, words and characters.")
    p.add_argument("files", nargs="+", type=Path, help="the files to count")
    p.add_argument("-l", "--lines", action="store_true", help="only lines")
    p.add_argument("-w", "--words", action="store_true", help="only words")
    return p


def main(argv=None):
    args = build_parser().parse_args(argv)
    status = 0
    for path in args.files:
        try:
            text = path.read_text(encoding="utf-8")
        except FileNotFoundError:
            print(f"wc: {path}: no such file", file=sys.stderr)
            status = 1
            continue
        counts = {"lines": text.count("\n"), "words": len(text.split()), "chars": len(text)}
        wanted = [k for k in ("lines", "words") if getattr(args, k)] or list(counts)
        print(path.name, " ".join(f"{k}={counts[k]}" for k in wanted))
    return status


Path("poem.txt").write_text("roses are red\nviolets are blue\n", encoding="utf-8")
print("exit code", main(["poem.txt"]))                          # python wc.py poem.txt
print("exit code", main(["--words", "poem.txt", "missing.txt"]))
`,
        note: 'Try `main(["--help"])`: argparse prints the help it wrote from the `help=` texts, then stops the program with exit code 0.'
      },
      challenge: {
        title: 'A todo command',
        task: [
          '1. `build_parser()` returns an `ArgumentParser` with three subcommands, whose name goes to `args.command` (one is required):',
          '- `add TEXT [--priority {low,normal,high}]`, the priority `normal` by default;\n- `list [--all]`;\n- `done ID`, where ID is a whole number.',
          '2. `main(argv, todos)` parses `argv`, updates the list `todos` (each todo is a dict `{"text", "priority", "done"}`) and returns 0. `add` prints `added 1: buy milk` (the todo\'s number, counting from 1); `list` prints each open todo as `1. buy milk [normal]`, and with `--all` the done ones too, marked ` (done)`; `done 1` marks the first todo done and prints `done 1: buy milk`.',
          '3. `done` with a number that is not on the list prints `no todo 7` to `sys.stderr` and returns 1.',
          '4. Bad input (an unknown priority, `done x`, no command at all) is argparse\'s job: it prints the usage and exits with code 2.'
        ].join('\n\n'),
        starter: String.raw`import sys


def build_parser():
    return None


def main(argv, todos):
    command = argv[0]
    if command == "add":
        todos.append({"text": argv[1], "priority": "normal", "done": False})
        print("added", argv[1])
    elif command == "list":
        for todo in todos:
            print(todo["text"])
    return 0


if __name__ == "__main__":
    todos = []
    main(["add", "buy milk"], todos)
    main(["list"], todos)
`,
        solution: String.raw`import argparse
import sys


def build_parser():
    parser = argparse.ArgumentParser(prog="todo")
    sub = parser.add_subparsers(dest="command", required=True)
    add = sub.add_parser("add", help="add a todo")
    add.add_argument("text")
    add.add_argument("--priority", choices=["low", "normal", "high"], default="normal")
    show = sub.add_parser("list", help="show the todos")
    show.add_argument("--all", action="store_true", help="also the done ones")
    done = sub.add_parser("done", help="mark a todo done")
    done.add_argument("id", type=int)
    return parser


def main(argv, todos):
    args = build_parser().parse_args(argv)
    if args.command == "add":
        todos.append({"text": args.text, "priority": args.priority, "done": False})
        print(f"added {len(todos)}: {args.text}")
    elif args.command == "list":
        for number, todo in enumerate(todos, start=1):
            if args.all or not todo["done"]:
                mark = " (done)" if todo["done"] else ""
                print(f"{number}. {todo['text']} [{todo['priority']}]{mark}")
    elif args.command == "done":
        if not 1 <= args.id <= len(todos):
            print(f"no todo {args.id}", file=sys.stderr)
            return 1
        todo = todos[args.id - 1]
        todo["done"] = True
        print(f"done {args.id}: {todo['text']}")
    return 0


if __name__ == "__main__":
    todos = []
    for argv in (["add", "buy milk"], ["add", "call mom", "--priority", "high"], ["done", "1"], ["list", "--all"]):
        main(argv, todos)
`,
        hints: [
          '`sub = parser.add_subparsers(dest="command", required=True)`, then one `sub.add_parser("add")` per command, each with its own `add_argument` calls.',
          '`choices=["low", "normal", "high"]` with `default="normal"` makes argparse refuse other priorities; `type=int` on `done`\'s `id` refuses `x`. Both exit with code 2 for you.',
          'In `main`, `args = build_parser().parse_args(argv)`, then branch on `args.command`. Number the todos with `enumerate(todos, start=1)`; for an error, `print(..., file=sys.stderr)` and `return 1`.'
        ],
        checks: [
          { label: '`add` takes a text and a priority, `normal` by default', code: 'a = build_parser().parse_args(["add", "buy milk"])\nassert (a.command, a.text, a.priority) == ("add", "buy milk", "normal")\nassert build_parser().parse_args(["add", "x", "--priority", "high"]).priority == "high"' },
          { label: 'Bad input exits with code 2', code: EXIT_CODE + 'assert exit_code(["add", "x", "--priority", "urgent"]) == 2, "an unknown priority should be refused: use choices="\nassert exit_code(["done", "x"]) == 2, "done needs a number: use type=int"\nassert exit_code([]) == 2, "a command is required: add_subparsers(dest=\\"command\\", required=True)"' },
          { label: '`done` takes a whole number; `list` has `--all`', code: 'assert build_parser().parse_args(["done", "3"]).id == 3\nassert build_parser().parse_args(["list", "--all"]).all is True\nassert build_parser().parse_args(["list"]).all is False' },
          { label: '`main` adds and lists todos', code: 'todos = []\ncode, printed = capture(main, ["add", "buy milk"], todos)\nassert code == 0 and printed == "added 1: buy milk\\n", f"add returned {code} and printed {printed!r}"\ncapture(main, ["add", "call mom", "--priority", "high"], todos)\nassert todos[1] == {"text": "call mom", "priority": "high", "done": False}, f"todos is {todos}"\n_, printed = capture(main, ["list"], todos)\nassert printed == "1. buy milk [normal]\\n2. call mom [high]\\n", f"list printed {printed!r}"' },
          { label: '`done` marks a todo; `list --all` shows it', code: 'todos = [{"text": "a", "priority": "low", "done": False}, {"text": "b", "priority": "normal", "done": False}]\ncode, printed = capture(main, ["done", "1"], todos)\nassert code == 0 and todos[0]["done"] and printed == "done 1: a\\n", f"done returned {code} and printed {printed!r}"\nassert capture(main, ["list"], todos)[1] == "2. b [normal]\\n"\nassert capture(main, ["list", "--all"], todos)[1] == "1. a [low] (done)\\n2. b [normal]\\n"' },
          { label: 'An unknown todo number goes to stderr, with exit code 1', code: 'import contextlib, io\ntodos = [{"text": "a", "priority": "low", "done": False}]\nout, err = io.StringIO(), io.StringIO()\nwith contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):\n    code = main(["done", "7"], todos)\nassert code == 1, f"main returned {code}"\nassert "no todo 7" in err.getvalue() and out.getvalue() == "", f"stdout {out.getvalue()!r}, stderr {err.getvalue()!r}"' }
        ]
      }
    }
  );
})(window.PYLT);
