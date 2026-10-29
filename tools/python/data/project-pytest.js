/*
 * Project: a pytest suite for a shopping cart. The project shape is described at the top of
 * data/project-cli.js.
 *
 * Every step needs pytest, a PyPI package (packages: ['pytest']). Its checks run the learner's tests
 * with pytest.main() inside the run, then plant one bug at a time in the code under test (a copy of
 * main.py with one function's body replaced, saved as another file) and require that the tests now
 * fail: tests that cannot catch a bug do not count. Step 4's checks also cut the network off, so a
 * test that would really call the web service fails.
 */
(function (U) {
  var P = U.data.projects = U.data.projects || [];

  function fence(lang, src) { return '```' + lang + '\n' + src.replace(/^\n+|\s+$/g, '') + '\n```'; }
  function java(src) { return fence('java', src); }
  function con(src) { return fence('console', src); }
  function norun(src) { return fence('python-norun', src); }

  var WHY = '**pytest** is a package from PyPI, and the in-browser Python here does not load packages: this step runs on the Python on your PC.';

  /* ---------- the code under test, as it grows ---------- */

  var HEAD_1 = String.raw`import pytest

# ---------------------------------------------------------------- the code under test
`;
  var HEAD_2 = String.raw`import pytest

# ---------------------------------------------------------------- the code under test

DISCOUNTS = {"SAVE10": 0.10, "HALF": 0.50}
`;
  var HEAD_3 = String.raw`import json

import pytest

# ---------------------------------------------------------------- the code under test

DISCOUNTS = {"SAVE10": 0.10, "HALF": 0.50}
`;
  var HEAD_4 = String.raw`import json
import sys
import urllib.request

import pytest

# ---------------------------------------------------------------- the code under test

DISCOUNTS = {"SAVE10": 0.10, "HALF": 0.50}
RATES_URL = "https://api.example.com/rates?base=USD"


def fetch_rates():
    """Today's exchange rates from a web service, such as {"EUR": 0.92}. Slow, and needs the internet."""
    with urllib.request.urlopen(RATES_URL, timeout=5) as response:
        return json.load(response)
`;

  var CART = String.raw`

class Cart:
    """A shopping cart: item names, each with a price and a quantity."""

    def __init__(self):
        self.items = {}                  # name -> [price, quantity]

    def add(self, name, price, quantity=1):
        if price < 0 or quantity < 1:
            raise ValueError("the price must be 0 or more, and the quantity 1 or more")
        if name in self.items:
            self.items[name][1] += quantity
        else:
            self.items[name] = [price, quantity]

    def total(self):
        return round(sum(price * quantity for price, quantity in self.items.values()), 2)
`;
  var DISCOUNT = String.raw`
    def total_after(self, code=None):
        """The total after a discount code. An unknown code raises ValueError."""
        if code is None:
            return self.total()
        if code not in DISCOUNTS:
            raise ValueError(f"unknown discount code {code!r}")
        return round(self.total() * (1 - DISCOUNTS[code]), 2)
`;
  var FILES = String.raw`
    def save(self, path):
        """Write the cart to a JSON file."""
        path.write_text(json.dumps(self.items), encoding="utf-8")

    @classmethod
    def load(cls, path):
        """A cart read back from a file that save() wrote."""
        cart = cls()
        for name, (price, quantity) in json.loads(path.read_text(encoding="utf-8")).items():
            cart.add(name, price, quantity)
        return cart
`;
  var CURRENCY = String.raw`
    def total_in(self, currency):
        """The total in another currency, at today's rate."""
        if currency == "USD":
            return self.total()
        rates = fetch_rates()
        if currency not in rates:
            raise ValueError(f"no rate for {currency}")
        return round(self.total() * rates[currency], 2)
`;

  var TESTS = String.raw`

# ---------------------------------------------------------------- the tests
`;

  var TESTS_1 = String.raw`

def test_an_empty_cart_costs_nothing():
    assert Cart().total() == 0


def test_the_total_is_price_times_quantity():
    cart = Cart()
    cart.add("pen", 1.50, quantity=2)
    cart.add("notebook", 4.00)
    assert cart.total() == 7.00


def test_adding_an_item_again_adds_to_its_quantity():
    cart = Cart()
    cart.add("pen", 1.50)
    cart.add("pen", 1.50, quantity=2)
    assert cart.items["pen"] == [1.50, 3]


def test_cents_add_up():
    cart = Cart()
    cart.add("a", 0.10)
    cart.add("b", 0.20)
    assert cart.total() == pytest.approx(0.30)
`;
  var TESTS_2 = String.raw`

@pytest.mark.parametrize("code, expected", [(None, 50.0), ("SAVE10", 45.0), ("HALF", 25.0)])
def test_discount_codes(code, expected):
    cart = Cart()
    cart.add("book", 25.0, quantity=2)
    assert cart.total_after(code) == expected


def test_an_unknown_code_is_refused():
    cart = Cart()
    cart.add("book", 25.0)
    with pytest.raises(ValueError, match="unknown discount code"):
        cart.total_after("FREE")


@pytest.mark.parametrize("price, quantity", [(-1, 1), (1, 0)])
def test_bad_items_are_refused(price, quantity):
    with pytest.raises(ValueError):
        Cart().add("x", price, quantity)
`;
  var TESTS_3 = String.raw`

@pytest.fixture
def cart():
    """Two pens and a notebook: a new cart for each test that asks for it."""
    c = Cart()
    c.add("pen", 1.50, quantity=2)
    c.add("notebook", 4.00)
    return c


def test_the_fixture_cart(cart):
    assert cart.total() == 7.00


def test_save_then_load_gives_the_same_cart(cart, tmp_path):
    path = tmp_path / "cart.json"
    cart.save(path)
    assert Cart.load(path).items == cart.items


def test_loading_a_missing_file_fails(tmp_path):
    with pytest.raises(FileNotFoundError):
        Cart.load(tmp_path / "nope.json")
`;
  var TESTS_4 = String.raw`

here = sys.modules[__name__]        # this file's module: where total_in looks fetch_rates up


def test_a_total_in_euros(cart, monkeypatch):
    monkeypatch.setattr(here, "fetch_rates", lambda: {"EUR": 0.5})
    assert cart.total_in("EUR") == 3.50


def test_dollars_need_no_rates(cart, monkeypatch):
    def no_network():
        raise AssertionError("fetch_rates should not be called for USD")
    monkeypatch.setattr(here, "fetch_rates", no_network)
    assert cart.total_in("USD") == 7.00


def test_an_unknown_currency_is_refused(cart, monkeypatch):
    monkeypatch.setattr(here, "fetch_rates", lambda: {"EUR": 0.5})
    with pytest.raises(ValueError, match="no rate for JPY"):
        cart.total_in("JPY")
`;

  var RUNNER = String.raw`

if __name__ == "__main__":
    raise SystemExit(pytest.main(["-q", __file__]))
`;

  /* ---------- what the checks share ---------- */

  // run pytest on a file; plant a bug in a copy of main.py and see whether the tests catch it
  // Each planted bug gets a file of its own (named by a hash of its code), and any module already
  // imported under that name is dropped first: pytest imports a test file once per process, so a
  // second bug written to the same name would silently test the first one again.
  var TOOLS = String.raw`import ast as _ast, contextlib as _contextlib, hashlib as _hashlib, importlib as _importlib
import io as _io, pathlib as _pathlib, sys as _sys
import pytest as _pytest


def run_pytest(path):
    """pytest on one file, quietly: -> (exit code, what it printed). 0: all passed, 1: a test failed."""
    _sys.modules.pop(_pathlib.Path(path).stem, None)
    _importlib.invalidate_caches()
    buf = _io.StringIO()
    with _contextlib.redirect_stdout(buf), _contextlib.redirect_stderr(buf):
        code = _pytest.main(["-q", "-p", "no:cacheprovider", str(path)])
    return int(code), buf.getvalue()


def test_names():
    return [n.name for n in tree.body if isinstance(n, _ast.FunctionDef) and n.name.startswith("test")]


def caught(where, body):
    """Plant a bug: main.py with one function's body replaced ("Cart.total"). True when the tests fail."""
    t = _ast.parse(src)
    owner, _, name = where.rpartition(".")
    scope = next(n for n in t.body if isinstance(n, _ast.ClassDef) and n.name == owner).body if owner else t.body
    fn = next(n for n in scope if isinstance(n, _ast.FunctionDef) and n.name == name)
    fn.body = _ast.parse(body).body
    path = _pathlib.Path("test_planted_" + _hashlib.sha1((where + body).encode()).hexdigest()[:10] + ".py")
    path.write_text(_ast.unparse(t), encoding="utf-8")
    return run_pytest(path)[0] == 1


def decorated(word):
    """The test functions with a decorator mentioning word (parametrize, fixture)."""
    return [n.name for n in tree.body if isinstance(n, _ast.FunctionDef) and any(word in _ast.unparse(d) for d in n.decorator_list)]


def taking(param):
    """The test functions with a parameter of that name (a fixture they ask for)."""
    return [n.name for n in tree.body if isinstance(n, _ast.FunctionDef) and n.name.startswith("test") and param in [a.arg for a in n.args.args]]
`;
  var PASS = String.raw`code, out = run_pytest("main.py")
assert code == 0, "pytest did not pass (exit code " + str(code) + "):\n" + out[-1500:]
`;
  // step 4: a conftest.py that makes any attempt to open a connection fail
  var NO_NETWORK = String.raw`_pathlib.Path("conftest.py").write_text('''import socket
import pytest


@pytest.fixture(autouse=True)
def _no_network(monkeypatch):
    def refuse(*args, **kwargs):
        raise RuntimeError("a test tried to use the network: replace fetch_rates with monkeypatch")
    monkeypatch.setattr(socket, "create_connection", refuse)
    monkeypatch.setattr(socket.socket, "connect", refuse)
''', encoding="utf-8")
`;

  function step(n, extra) {
    var head = [null, HEAD_1, HEAD_2, HEAD_3, HEAD_4][n];
    var methods = [DISCOUNT, FILES, CURRENCY].slice(0, n - 1).join('');
    return head + CART + methods + TESTS + [TESTS_1, TESTS_2, TESTS_3, TESTS_4].slice(0, n - 1).join('') + extra + RUNNER;
  }

  P.push({
    id: 'pytest', title: 'A pytest suite for a shopping cart',
    summary: 'Write the tests a real team would for a shopping cart, in four steps: plain asserts, pytest.raises and parametrize, fixtures and tmp_path, and monkeypatch to keep a web service out of the tests. The checks plant bugs and require your tests to catch them.',
    keywords: ['pytest', 'tests', 'testing', 'junit', 'fixture', 'parametrize', 'raises', 'tmp_path', 'monkeypatch', 'mock', 'mockito', 'tdd', 'unit test'],
    docs: 'https://docs.python.org/3/library/unittest.html',
    packages: ['pytest'],
    intro: [
      'pytest is what most Python teams use where a Java team uses JUnit 5. The [[lesson:py-pytest]] lesson showed the idea with plain functions; here you use the real thing on a small `Cart` class that grows a feature each step: a total, discount codes, saving to a file, and prices in another currency fetched from a web service.',
      'How the checks work, because it is stricter than "the tests pass": after running your tests on the real code, a check **plants a bug** in a copy of the code (say, the total ignores quantities) and runs your tests again. They must fail. A test suite that passes no matter what the code does proves nothing, and that is what this catches. (Teams use the same idea at scale; it is called mutation testing.)',
      'Every step needs pytest on your PC. If it is missing, the step says so and shows the exact install command.'
    ].join('\n\n'),
    java: [
      '| JUnit 5 (+ Mockito) | pytest |\n|---|---|\n| `@Test void total()` in a test class | `def test_total():` in any file named `test_*.py` |\n| `assertEquals(7.0, cart.total())` | `assert cart.total() == 7.0` |\n| `assertEquals(0.3, x, 1e-9)` | `assert x == pytest.approx(0.3)` |\n| `assertThrows(IllegalArgumentException.class, ...)` | `with pytest.raises(ValueError):` |\n| `@ParameterizedTest @CsvSource(...)` | `@pytest.mark.parametrize(...)` |\n| `@BeforeEach` setting a field | a `@pytest.fixture` the test asks for by name |\n| `@TempDir Path dir` | the built-in `tmp_path` fixture |\n| `when(rates.fetch()).thenReturn(...)` | `monkeypatch.setattr(module, "fetch_rates", fake)` |\n| `mvn test` | `pytest` |',
      'The big difference is how little there is: no class, no annotations to import, no assertion library. pytest rewrites a failing `assert` to show both sides, so `assert cart.total() == 7.0` failing prints `assert 5.5 == 7.0` with where 5.5 came from.'
    ].join('\n\n'),
    finish: [
      'In a real project the code and the tests live in separate files, and pytest finds the tests by their names:',
      con(String.raw`
shop/
    pyproject.toml
    src/shop/cart.py          # the code under test
    tests/test_cart.py        # from shop.cart import Cart, fetch_rates
    tests/conftest.py         # fixtures every test file can use`),
      'Then, in a virtual environment with the project installed (`python -m pip install -e . pytest`):',
      con(String.raw`
pytest                        # every test, one dot each
pytest -q                     # quieter
pytest -x                     # stop at the first failure
pytest -k discount            # only tests whose names contain "discount"
pytest tests/test_cart.py::test_cents_add_up   # one test
pytest --lf                   # only the tests that failed last time`),
      'With the code in its own module, `monkeypatch.setattr(cart_module, "fetch_rates", fake)` patches it there: `import shop.cart as cart_module`. A fixture defined in `conftest.py` (like the `cart` one) is available to every test file in that folder without an import, the way a JUnit extension is registered once.',
      'pytest\'s own documentation is at [docs.pytest.org](https://docs.pytest.org/); the standard library\'s older `unittest` (JUnit-style classes) is at docs.python.org, linked below.'
    ].join('\n\n'),
    steps: [
      {
        title: 'First tests',
        summary: 'Test functions with plain assert, how pytest reports a failure, and pytest.approx for money in floats.',
        runtimes: ['server'], runtimeWhy: WHY, packages: ['pytest'], timeout: 30,
        body: [
          'A pytest test is a function whose name starts with `test`, using plain `assert`. pytest finds them, runs each one, and reports a dot for a pass and a full explanation for a failure:',
          con(String.raw`
    def test_the_total_is_price_times_quantity():
        cart = Cart()
        cart.add("pen", 1.50, quantity=2)
        cart.add("notebook", 4.00)
>       assert cart.total() == 7.00
E       assert 5.5 == 7.0
E        +  where 5.5 = total()`),
          'That detail comes from pytest **rewriting** `assert` statements as it imports the test file, so there is no need for `assertEquals` and friends. Here the program runs pytest on itself: `pytest.main(["-q", __file__])` at the bottom does what typing `pytest -q main.py` would.',
          'Floats need care, as in Java: `0.1 + 0.2 == 0.3` is `False`. `pytest.approx(0.3)` compares within a tiny tolerance, like JUnit\'s `assertEquals(expected, actual, delta)`.',
          java(String.raw`
@Test
void totalIsPriceTimesQuantity() {
    Cart cart = new Cart();
    cart.add("pen", 1.50, 2);
    cart.add("notebook", 4.00, 1);
    assertEquals(7.00, cart.total(), 1e-9);
}`),
          'A good test checks one behaviour and is named for it, so a failure reads as a sentence: `test_adding_an_item_again_adds_to_its_quantity` failed.'
        ].join('\n\n'),
        task: [
          'The code under test is `Cart`, at the top: `add(name, price, quantity=1)` (adding an item that is already there adds to its quantity) and `total()`. One test is written. Add **at least two more**, so that your tests:',
          '- check that the total is price **times quantity** (an item with quantity 2);\n- check that adding the **same item again** adds to its quantity instead of replacing it.',
          'Use plain `assert` (no `unittest`). The checks plant each of those two bugs and require a test to fail.'
        ].join('\n\n'),
        starter: step(1, String.raw`

def test_an_empty_cart_costs_nothing():
    assert Cart().total() == 0


# add your tests here
`),
        solution: step(1, TESTS_1),
        hints: [
          'A test builds a cart, calls methods, and asserts: `cart = Cart()`, `cart.add("pen", 1.50, quantity=2)`, `assert cart.total() == 3.00`.',
          'For the second behaviour, add `"pen"` twice and look at `cart.items["pen"]`, which is `[price, quantity]`.'
        ],
        checks: [
          { label: 'At least 3 test functions', code: TOOLS + String.raw`assert len(test_names()) >= 3, f"found {test_names()}"` },
          { label: 'They all pass on the real code', code: TOOLS + PASS },
          { label: 'They catch a total that ignores the quantity', code: TOOLS + String.raw`assert caught("Cart.total", "return round(sum(price for price, quantity in self.items.values()), 2)"), "with this bug your tests still pass: test an item whose quantity is 2"` },
          { label: 'They catch an `add` that replaces an item instead of adding to it', code: TOOLS + String.raw`assert caught("Cart.add", "self.items[name] = [price, quantity]"), "with this bug your tests still pass: add the same item twice and check its quantity"` },
          { label: 'Plain `assert`, no `unittest`', code: String.raw`assert uses("Assert") and "unittest" not in src, "pytest needs only assert"` }
        ]
      },
      {
        title: 'Errors and tables of cases',
        summary: 'pytest.raises for the errors code must raise, and parametrize to run one test over a table of inputs.',
        runtimes: ['server'], runtimeWhy: WHY, packages: ['pytest'], timeout: 30,
        body: [
          'The cart now has discount codes: `total_after(code)` applies `SAVE10` (10% off) or `HALF`, and refuses a code it does not know with `ValueError`. Two pytest tools make testing that short.',
          '**`pytest.raises`** is a `with` block that passes only if the code inside raises that exception; `match=` also checks the message with a regular expression:',
          norun(String.raw`
def test_an_unknown_code_is_refused():
    cart = Cart()
    with pytest.raises(ValueError, match="unknown discount code"):
        cart.total_after("FREE")`),
          '**`@pytest.mark.parametrize`** runs one test once per row of a table, each row reported as its own test (`test_discount_codes[SAVE10-45.0]`):',
          norun(String.raw`
@pytest.mark.parametrize("code, expected", [(None, 50.0), ("SAVE10", 45.0), ("HALF", 25.0)])
def test_discount_codes(code, expected):
    ...`),
          java(String.raw`
@ParameterizedTest
@CsvSource({"SAVE10, 45.0", "HALF, 25.0"})
void discountCodes(String code, double expected) { ... }

assertThrows(IllegalArgumentException.class, () -> cart.totalAfter("FREE"));`),
          'Test the refusals too. Code that should reject bad input, such as a negative price, is only safe if a test proves it does.'
        ].join('\n\n'),
        task: [
          'Keep your first tests, and add:',
          '1. one **parametrized** test of `total_after` over `None`, `"SAVE10"` and `"HALF"`;\n2. a test, with `pytest.raises`, that an unknown code raises `ValueError`;\n3. a test, with `pytest.raises`, that `add` refuses a negative price and a quantity of 0 (parametrize it too, if you like).',
          'The checks plant three bugs: an unknown code silently ignored, a discount applied the wrong way round (charging 10% instead of taking 10% off), and an `add` that accepts anything.'
        ].join('\n\n'),
        starter: step(2, TESTS_1 + String.raw`

# add the discount tests here
`),
        solution: step(2, TESTS_1 + TESTS_2),
        hints: [
          'Put `@pytest.mark.parametrize("code, expected", [(None, 50.0), ("SAVE10", 45.0), ("HALF", 25.0)])` above a test that takes `code` and `expected`, builds a 50.0 cart and asserts `cart.total_after(code) == expected`.',
          '`with pytest.raises(ValueError, match="unknown discount code"):` then the call that must raise, indented below it.'
        ],
        checks: [
          { label: 'A parametrized test', code: TOOLS + String.raw`assert decorated("parametrize"), "use @pytest.mark.parametrize"` },
          { label: '`pytest.raises` for the refusals', code: String.raw`assert calls("raises"), "use with pytest.raises(ValueError):"` },
          { label: 'They all pass on the real code', code: TOOLS + PASS },
          { label: 'They catch an unknown code being ignored', code: TOOLS + String.raw`assert caught("Cart.total_after", "if code is None or code not in DISCOUNTS:\n    return self.total()\nreturn round(self.total() * (1 - DISCOUNTS[code]), 2)"), "with this bug your tests still pass: an unknown code must raise ValueError"` },
          { label: 'They catch a discount applied the wrong way', code: TOOLS + String.raw`assert caught("Cart.total_after", "if code is None:\n    return self.total()\nif code not in DISCOUNTS:\n    raise ValueError(code)\nreturn round(self.total() * DISCOUNTS[code], 2)"), "with this bug your tests still pass: check the totals after SAVE10 and HALF"` },
          { label: 'They catch an `add` that accepts a negative price or a zero quantity', code: TOOLS + String.raw`assert caught("Cart.add", "if name in self.items:\n    self.items[name][1] += quantity\nelse:\n    self.items[name] = [price, quantity]"), "with this bug your tests still pass: add must refuse a price of -1 and a quantity of 0"` }
        ]
      },
      {
        title: 'Fixtures and temporary files',
        summary: 'A fixture builds the cart every test needs; tmp_path gives each test its own empty folder for files.',
        runtimes: ['server'], runtimeWhy: WHY, packages: ['pytest'], timeout: 30,
        body: [
          'Several tests need the same cart. JUnit puts it in a field set up by `@BeforeEach`; pytest uses a **fixture**: a function marked `@pytest.fixture` whose return value is handed to any test that has a **parameter of the same name**. Each test gets a fresh one, so tests never affect each other.',
          norun(String.raw`
@pytest.fixture
def cart():
    c = Cart()
    c.add("pen", 1.50, quantity=2)
    c.add("notebook", 4.00)
    return c


def test_the_fixture_cart(cart):        # pytest calls cart() and passes its result
    assert cart.total() == 7.00`),
          'pytest has built-in fixtures too. **`tmp_path`** is a new empty folder (a `pathlib.Path`) for each test, deleted later: the place to write files, never the current folder. It is JUnit 5\'s `@TempDir`.',
          java(String.raw`
@TempDir Path dir;

@Test
void saveThenLoad() throws IOException {
    Path file = dir.resolve("cart.json");
    cart.save(file);
    assertEquals(cart.items(), Cart.load(file).items());
}`),
          'A fixture can use other fixtures, and can clean up after the test with `yield` instead of `return`: the code after `yield` runs when the test ends, like `@AfterEach`.'
        ].join('\n\n'),
        task: [
          'The cart can now `save(path)` itself to a JSON file and `Cart.load(path)` one back. Add:',
          '1. a fixture `cart` returning a cart with **2 pens at 1.50 and a notebook at 4.00**, used by at least **two** tests;\n2. a test that saving to a file in `tmp_path` and loading it back gives the same items;\n3. a test that loading a file that does not exist raises `FileNotFoundError`.',
          'The checks plant two bugs: `save` forgetting the quantities, and `load` returning an empty cart.'
        ].join('\n\n'),
        starter: step(3, TESTS_1 + TESTS_2 + String.raw`

# add the fixture and the file tests here
`),
        solution: step(3, TESTS_1 + TESTS_2 + TESTS_3),
        hints: [
          '`@pytest.fixture` above `def cart():` that builds and returns the cart. A test asks for it with a parameter: `def test_something(cart):`.',
          'Round trip: `path = tmp_path / "cart.json"`, `cart.save(path)`, then `assert Cart.load(path).items == cart.items`. The test takes both fixtures: `def test_round_trip(cart, tmp_path):`.'
        ],
        checks: [
          { label: 'A fixture named `cart`, used by at least two tests', code: TOOLS + String.raw`assert "cart" in decorated("fixture"), "define it with @pytest.fixture: def cart():"
assert len(taking("cart")) >= 2, f"tests that take cart: {taking('cart')}"` },
          { label: 'A test writes its files in `tmp_path`', code: TOOLS + String.raw`assert taking("tmp_path"), "ask for tmp_path: a fresh folder for each test"` },
          { label: 'They all pass on the real code', code: TOOLS + PASS },
          { label: 'They catch `save` forgetting the quantities', code: TOOLS + String.raw`assert caught("Cart.save", "path.write_text(json.dumps({n: [p, 1] for n, (p, q) in self.items.items()}), encoding='utf-8')"), "with this bug your tests still pass: save a cart with 2 pens and load it back"` },
          { label: 'They catch `load` returning an empty cart', code: TOOLS + String.raw`assert caught("Cart.load", "return cls()"), "with this bug your tests still pass: compare what load returns with what was saved"` }
        ]
      },
      {
        title: 'Keep the web service out: monkeypatch',
        summary: 'Replace a function that calls a web service with a fake for the length of a test, the way Mockito stubs a dependency.',
        runtimes: ['server'], runtimeWhy: WHY, packages: ['pytest'], timeout: 30,
        body: [
          '`total_in(currency)` converts the total with today\'s rate, which `fetch_rates()` gets from a web service. A unit test must not call it: it is slow, needs the internet, and the rate changes every day, so the expected value would too.',
          'pytest\'s built-in **`monkeypatch`** fixture replaces an attribute for one test and puts the original back afterwards. A module\'s functions are attributes of the module, so this swaps `fetch_rates` for a fake:',
          norun(String.raw`
def test_a_total_in_euros(cart, monkeypatch):
    monkeypatch.setattr(here, "fetch_rates", lambda: {"EUR": 0.5})
    assert cart.total_in("EUR") == 3.50`),
          '`here` is the module that holds `fetch_rates`. In this one-file program that is the file itself: `here = sys.modules[__name__]`. In a real project, with the code in `cart.py`, it is `import cart` and `monkeypatch.setattr(cart, "fetch_rates", ...)`. Patch the name **where it is looked up**: `total_in` looks `fetch_rates` up in its own module.',
          java(String.raw`
@Mock RatesClient rates;

@Test
void totalInEuros() {
    when(rates.fetch()).thenReturn(Map.of("EUR", 0.5));
    assertEquals(3.50, cart.totalIn("EUR", rates), 1e-9);
}`),
          'A fake can also check that it was **not** called, by raising if it is: that is Mockito\'s `verify(rates, never()).fetch()`. For the checks here, the network is cut off: a test that reaches the real `fetch_rates` fails with "a test tried to use the network".'
        ].join('\n\n'),
        task: [
          'Add tests for `total_in`, each using `monkeypatch` so `fetch_rates` never runs for real:',
          '1. a total in `"EUR"` with a fake rate of 0.5;\n2. a total in `"USD"` needs **no** rates at all: make the fake raise if it is called;\n3. a currency missing from the rates (`"JPY"`) raises `ValueError`.',
          'The checks plant three bugs: the currency ignored, an unknown currency treated as rate 1, and rates fetched even for dollars.'
        ].join('\n\n'),
        starter: step(4, TESTS_1 + TESTS_2 + TESTS_3 + String.raw`

def test_a_total_in_euros(cart):
    assert cart.total_in("EUR") > 0
`),
        solution: step(4, TESTS_1 + TESTS_2 + TESTS_3 + TESTS_4),
        hints: [
          'Ask for the fixture: `def test_a_total_in_euros(cart, monkeypatch):`, then `monkeypatch.setattr(here, "fetch_rates", lambda: {"EUR": 0.5})` with `here = sys.modules[__name__]` defined once above the tests.',
          'For dollars, the fake is a function that raises: `def no_network(): raise AssertionError("not for USD")`, then `monkeypatch.setattr(here, "fetch_rates", no_network)`.'
        ],
        checks: [
          { label: 'Tests use `monkeypatch`', code: TOOLS + String.raw`assert taking("monkeypatch"), "ask for the monkeypatch fixture: def test_x(cart, monkeypatch):"` },
          { label: 'They all pass with the network cut off', code: TOOLS + NO_NETWORK + PASS },
          { label: 'They catch the currency being ignored', code: TOOLS + NO_NETWORK + String.raw`assert caught("Cart.total_in", "return self.total()"), "with this bug your tests still pass: test a total in EUR with a fake rate"` },
          { label: 'They catch an unknown currency treated as rate 1', code: TOOLS + NO_NETWORK + String.raw`assert caught("Cart.total_in", "if currency == 'USD':\n    return self.total()\nreturn round(self.total() * fetch_rates().get(currency, 1.0), 2)"), "with this bug your tests still pass: JPY must raise ValueError"` },
          { label: 'They catch rates being fetched for dollars', code: TOOLS + NO_NETWORK + String.raw`assert caught("Cart.total_in", "rates = fetch_rates()\nif currency == 'USD':\n    return self.total()\nif currency not in rates:\n    raise ValueError(f'no rate for {currency}')\nreturn round(self.total() * rates[currency], 2)"), "with this bug your tests still pass: for USD, make the fake raise if it is called"` }
        ]
      }
    ]
  });
})(window.PYLT);
