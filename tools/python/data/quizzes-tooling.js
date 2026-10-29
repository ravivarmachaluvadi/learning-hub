/*
 * Quizzes for track 6 (Tooling and quality). The question shape is described at the top of
 * data/quizzes-basics.js.
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};
  function py() { return '```python\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q['py-type-hints'] = [
    {
      q: 'What happens when this runs?\n\n' + py('def double(n: int) -> int:', '    return n * 2', '', 'print(double("ab"))'),
      choices: ['It prints `abab`', 'It raises `TypeError`, because `"ab"` is not an `int`', 'It does not start: the hint is checked first'],
      answer: 0,
      why: 'Python stores type hints but never checks them while running, and `"ab" * 2` is `"abab"`. A type checker such as mypy would report the call before you ran it.'
    },
    {
      q: 'Which hint means "a list of strings, or no list at all"?',
      choices: ['`list[str] | None`', '`list[str | None]`', '`List<String>`'],
      answer: 0,
      why: '`X | None` is the whole value that may be missing. `list[str | None]` is a list whose items may be `None`. `List<String>` is Java syntax.'
    },
    {
      q: 'Which Java method matches `def first[T](items: list[T]) -> T:`?',
      choices: ['`<T> T first(List<T> items)`', '`Object first(List<Object> items)`', '`void first(List<?> items)`'],
      answer: 0,
      why: 'The square brackets after the name declare a type parameter, like `<T>` before a Java method\'s return type (Python 3.12+).'
    },
    {
      q: 'Which of these reads type hints while the program runs?',
      choices: ['`@dataclass`, which makes its fields from them', 'The `for` loop', '`print`'],
      answer: 0,
      why: 'Python itself ignores hints, but code can read them: `dataclasses`, FastAPI and Pydantic are built on that (`typing.get_type_hints`).'
    }
  ];

  Q['py-packages'] = [
    {
      q: 'For the package folder `shop/`, which file runs on `import shop`?',
      choices: ['`shop/__init__.py`', '`shop/__main__.py`', '`shop/shop.py`'],
      answer: 0,
      why: 'Importing a package runs its `__init__.py`. `__main__.py` runs on `python -m shop`.'
    },
    {
      q: 'In `shop/cart.py`, what does `from .pricing import TAX` import?',
      choices: ['`TAX` from `shop/pricing.py`, in the same package', '`TAX` from a top-level module named `pricing`', '`TAX` from a `pricing.py` in the current working folder'],
      answer: 0,
      why: 'The leading dot means "my own package". It keeps working if the package is renamed, and only works inside a package.'
    },
    {
      q: 'What does `python -m shop` run?',
      choices: ['`shop/__main__.py`, after importing the package', 'Only `shop/__init__.py`', 'A function called `main` in the package'],
      answer: 0,
      why: '`-m` runs a module as a program. For a package that means its `__main__.py`, with `__name__` set to `"__main__"`.'
    },
    {
      q: 'Which job does `pyproject.toml` do, like Maven\'s `pom.xml`?',
      choices: ['It names the project and lists the packages it depends on', 'It holds the installed packages', 'It replaces every `__init__.py`'],
      answer: 0,
      why: 'It describes the project: name, version, Python version, dependencies, how to build it. The packages themselves are installed into an environment.'
    }
  ];

  Q['py-venv-pip'] = [
    {
      q: 'Why does each Python project get its own virtual environment?',
      choices: ['An environment holds only one version of each package, and projects may need different ones', 'Python cannot import anything outside a virtual environment', 'pip refuses to install without one'],
      answer: 0,
      why: '`import requests` finds exactly one installed copy per environment. Maven keeps every version in `~/.m2` and picks per build; Python gives each project its own `site-packages` instead.'
    },
    {
      q: 'Which versions does `requests~=2.31` accept?',
      choices: ['2.31 or newer, below 3', 'Exactly 2.31', '2.31.0 to 2.31.9 only'],
      answer: 0,
      why: '`~=` is the compatible release: drop the last part and stay below the next value of the new last one. `~=2.31.4` would mean at least 2.31.4, below 2.32.'
    },
    {
      q: 'Which command writes down the exact versions installed, so another machine can install the same?',
      choices: ['`python -m pip freeze > requirements.txt`', '`python -m venv .venv`', '`python -m pip list --outdated`'],
      answer: 0,
      why: '`pip freeze` prints every installed package as `name==version`. `pip install -r requirements.txt` installs exactly those.'
    },
    {
      q: 'How can a program tell that it runs inside a virtual environment?',
      choices: ['`sys.prefix != sys.base_prefix`', '`"venv" in sys.version`', '`sys.argv[0] == ".venv"`'],
      answer: 0,
      why: 'In a venv, `sys.prefix` is the venv folder and `sys.base_prefix` the Python it was made from; outside one they are the same.'
    }
  ];

  Q['py-pytest'] = [
    {
      q: 'How does pytest find the tests?',
      choices: ['Functions named `test_...` in files named `test_*.py`', 'Methods annotated with `@Test`', 'Every function in the project'],
      answer: 0,
      why: 'pytest goes by names: no annotations or base classes are needed. A test is an ordinary function.'
    },
    {
      q: 'What replaces JUnit\'s `assertEquals(5, add(2, 3))`?',
      choices: ['`assert add(2, 3) == 5`', '`pytest.equals(5, add(2, 3))`', '`assertEquals(5, add(2, 3))` from the `pytest` module'],
      answer: 0,
      why: 'Python\'s own `assert`. When it fails, pytest shows both sides of the `==` and how they were computed.'
    },
    {
      q: 'Every test needs a fresh `Cart`, as `@BeforeEach` would give. In pytest you:',
      choices: ['Write a fixture called `cart` and name `cart` as the test\'s parameter', 'Add `@pytest.before` above a set-up function', 'Make one `Cart` at the top of the file for every test to share'],
      answer: 0,
      why: 'A fixture is a function marked `@pytest.fixture`; pytest calls it for each test that asks for it by name. A shared object would leak changes from one test into the next.'
    },
    {
      q: 'Where do mocks come from in Python?',
      choices: ['`unittest.mock`, part of the standard library', 'Only from a package installed with pip', 'Nowhere: pytest cannot use mocks'],
      answer: 0,
      why: '`unittest.mock.Mock` records its calls (`assert_called_once_with`) and works the same under pytest. It does what Mockito does.'
    }
  ];

  Q['py-logging-debugging'] = [
    {
      q: 'After `logging.basicConfig(level=logging.WARNING)`, which call\'s message appears?',
      choices: ['`log.error("disk full")`', '`log.info("started")`', '`log.debug("x = 3")`'],
      answer: 0,
      why: 'Only messages at the set level or above are shown: WARNING, ERROR and CRITICAL. INFO and DEBUG are dropped.'
    },
    {
      q: 'Why write `log.info("user %s", name)` rather than `log.info(f"user {name}")`?',
      choices: ['The text is built only if the message is actually shown', 'f-strings are not allowed in log calls', 'It makes the line appear in a different colour'],
      answer: 0,
      why: 'logging fills in `%s` only when the message passes the level filter, like SLF4J\'s `{}`. Both forms work; the first does less work for hidden messages.'
    },
    {
      q: 'Inside an `except` block, what does `log.exception("failed")` add over `log.error("failed")`?',
      choices: ['The traceback of the exception being handled', 'It raises the exception again', 'It stops the program'],
      answer: 0,
      why: '`log.exception` logs at ERROR level and appends the traceback, so the details are kept while the program carries on.'
    },
    {
      q: 'In pdb, which command runs the next line without stepping into the functions it calls?',
      choices: ['`n`', '`s`', '`c`'],
      answer: 0,
      why: '`n` (next) steps over, like F8 in IntelliJ. `s` steps into a call; `c` continues to the next breakpoint.'
    }
  ];

  Q['py-context-managers'] = [
    {
      q: 'What does this print?\n\n' + py('class C:', '    def __enter__(self):', '        print("in")', '        return 42', '', '    def __exit__(self, *exc):', '        print("out")', '', 'with C() as x:', '    print(x)'),
      choices: ['`in`, then `42`, then `out`', '`in`, then a `C` object, then `out`', '`42`, then `in`, then `out`'],
      answer: 0,
      why: '`__enter__` runs first, and `as x` receives what it **returns**, here 42. `__exit__` runs after the block.'
    },
    {
      q: 'When does `__exit__` run?',
      choices: ['Whenever the block ends: normally, by `return`, or by an exception', 'Only when the block ends without an error', 'Only when an exception happens'],
      answer: 0,
      why: 'That guarantee is the point of `with`, as `close()` is for try-with-resources. `__exit__` is told whether an exception is passing.'
    },
    {
      q: 'An exception is passing through, and `__exit__` returns `True`. What happens?',
      choices: ['The exception is swallowed, and the program continues after the `with` block', 'The exception is raised twice', 'The program stops at once'],
      answer: 0,
      why: 'A true return value tells Python the exception was handled. `contextlib.suppress` works this way; most context managers return `False` (or nothing).'
    },
    {
      q: 'In a `@contextmanager` generator, why put the `yield` inside `try`/`finally`?',
      choices: ['So the clean-up after the `yield` runs even when the block raises', 'Because every generator needs a `try`', 'So that the block runs twice'],
      answer: 0,
      why: 'An exception in the block is raised again at the `yield`. Without `finally`, the lines after the `yield` would be skipped.'
    }
  ];

  Q['py-argparse'] = [
    {
      q: 'The program is started as `python tool.py --verbose data.csv`. What is `sys.argv`?',
      choices: ['`["tool.py", "--verbose", "data.csv"]`', '`["--verbose", "data.csv"]`', '`"--verbose data.csv"`'],
      answer: 0,
      why: 'A list of strings with the program\'s name first. `parse_args()` reads `sys.argv[1:]`.'
    },
    {
      q: 'An option has `type=int`, and the user types `--times lots`. What happens?',
      choices: ['argparse prints the usage and an error, and exits with code 2', '`args.times` is set to 0', 'Your code gets a `ValueError` to handle'],
      answer: 0,
      why: 'argparse checks the arguments itself and stops the program with `SystemExit(2)`, the usual exit code for bad command-line usage.'
    },
    {
      q: 'Which `add_argument` makes a flag: `True` when given, `False` otherwise?',
      choices: ['`parser.add_argument("--all", action="store_true")`', '`parser.add_argument("--all", type=bool)`', '`parser.add_argument("--all", nargs=0)`'],
      answer: 0,
      why: '`store_true` takes no value. `type=bool` is a trap: it would turn the text `"False"` into `True`, because any non-empty string is true.'
    },
    {
      q: 'Why write `def main(argv=None):` and call `parser.parse_args(argv)`?',
      choices: ['So a test can call `main([...])` with its own arguments', 'Because argparse refuses to read `sys.argv` itself', 'To make the program start faster'],
      answer: 0,
      why: '`parse_args(None)` reads `sys.argv[1:]`, so the real program works as before, while a test passes a list and checks the result.'
    }
  ];
})(window.PYLT);
