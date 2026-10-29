/*
 * Lessons, track 4: Objects and classes. The lesson shape is described at the top of
 * data/lessons-basics.js; every ```python block must run (tests/test_content.py runs them all).
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  function block(lang, lines) { return '```' + lang + '\n' + lines.join('\n') + '\n```'; }
  function py() { return block('python', [].slice.call(arguments)); }

  L.push(
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'py-classes', track: 'objects',
      title: 'Classes, objects and self',
      summary: 'Defining a class, __init__ and self, attributes made by assignment, methods, class attributes shared like static fields, and Python\'s "no private" convention.',
      keywords: ['class', 'object', 'self', '__init__', 'constructor', 'attribute', 'method', 'instance', 'static', 'class attribute', 'private', 'underscore', 'oop', 'this'],
      docs: 'https://docs.python.org/3/tutorial/classes.html',
      body: [
        'A class bundles data with the functions that work on it, as in Java. The Python version is much shorter:',
        py('class Account:',
           '    def __init__(self, owner, balance=0):',
           '        self.owner = owner          # an attribute appears when you assign it',
           '        self.balance = balance',
           '',
           '    def deposit(self, amount):',
           '        self.balance += amount',
           '        return self.balance',
           '',
           'acc = Account("Asha")              # no new: call the class',
           'acc.deposit(50)',
           'print(acc.owner, acc.balance)'),
        '## __init__ and self',
        '`__init__` runs right after the object is made and fills it in, like a constructor. Its first parameter, `self`, is the new object. **Every method gets the object as its first parameter**, which Java passes invisibly as `this`. Calling `acc.deposit(50)` is short for `Account.deposit(acc, 50)`:',
        py('class Greeter:',
           '    def __init__(self, name):',
           '        self.name = name',
           '',
           '    def greet(self):',
           '        return f"Hello, {self.name}"',
           '',
           'g = Greeter("Ravi")',
           'print(g.greet())',
           'print(Greeter.greet(g))           # the same call, spelled out'),
        'Inside a method, an attribute always needs `self.`: a bare `name` would be a local variable, or a `NameError`.',
        '## Attributes are made by assignment',
        'There are no field declarations. Assigning `self.x = ...` creates the attribute, and code outside can even add one (usually a bad idea). `vars(obj)` shows what an object holds:',
        py('class Point:',
           '    def __init__(self, x, y):',
           '        self.x = x',
           '        self.y = y',
           '',
           'p = Point(3, 4)',
           'p.label = "corner"                # allowed, but surprising to readers',
           'print(vars(p))'),
        '## Class attributes: shared by every object',
        'A name assigned in the class body belongs to the class, like a `static` field. Every object can read it:',
        py('class Order:',
           '    tax_rate = 0.18                 # one value for the whole class',
           '    count = 0',
           '',
           '    def __init__(self, amount):',
           '        self.amount = amount',
           '        Order.count += 1            # change it through the class',
           '',
           '    def total(self):',
           '        return round(self.amount * (1 + self.tax_rate), 2)',
           '',
           'a, b = Order(100), Order(50)',
           'print(a.total(), b.total(), Order.count)'),
        'Careful with a **mutable** class attribute: a list in the class body is one list shared by every object. Give each object its own in `__init__`:',
        py('class Team:',
           '    members = []                    # one list for ALL teams: a bug',
           '',
           'red, blue = Team(), Team()',
           'red.members.append("Asha")',
           'print(blue.members)                # blue sees red\'s member',
           '',
           'class FixedTeam:',
           '    def __init__(self):',
           '        self.members = []           # a new list for each team',
           '',
           'red, blue = FixedTeam(), FixedTeam()',
           'red.members.append("Asha")',
           'print(blue.members)'),
        '## No private: a naming convention',
        'Python has no `private` or `protected`. A leading underscore, `_code`, means "internal: do not use from outside", and everyone respects it. Two underscores, `__key`, make Python rename the attribute (to `_Vault__key`) so that a subclass cannot clash with it by accident. Neither is security.',
        py('class Vault:',
           '    def __init__(self):',
           '        self._code = 1234               # internal, by convention',
           '        self.__key = "k"                # renamed by Python',
           '',
           'v = Vault()',
           'print(v._code)                         # works: the underscore is only a warning sign',
           'print(list(vars(v)))'),
        '## Printing an object',
        'Printing an object of your own class shows its type and memory address, such as `<__main__.Point object at 0x0000021F...>`. The lesson [[lesson:py-equality]] adds a `__repr__` that prints something useful, and [[lesson:py-dataclasses-enums]] writes one for you.',
        '| Java | Python |\n|---|---|\n| `class Account { ... }` | `class Account:` |\n| constructor `Account(String owner)` | `def __init__(self, owner):` |\n| `this.owner = owner;` | `self.owner = owner` |\n| field declarations | none: assigning creates the attribute |\n| `new Account("Asha")` | `Account("Asha")` |\n| `static int count;` | `count = 0` in the class body |\n| `private` | a leading underscore, by convention |'
      ].join('\n\n'),
      java: 'A Python class has no field declarations, no access modifiers and no overloaded constructors. `self` is Java\'s `this`, written out as the first parameter of every method. Instead of several constructors, `__init__` takes default values (`balance=0`). And there are no getters and setters: code reads `acc.balance` directly; [[lesson:py-properties]] shows how to add logic later without changing the callers.',
      js: 'JavaScript classes are close: `constructor` is `__init__` and `this` is `self`, but Python passes `self` explicitly and has no `new`.',
      example: {
        code: String.raw`class BankAccount:
    interest_rate = 0.04                 # shared by every account
    opened = 0

    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        self.history = []                # each account gets its own list
        BankAccount.opened += 1

    def deposit(self, amount):
        self.balance += amount
        self.history.append(("deposit", amount))

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError(f"{self.owner} has only {self.balance}")
        self.balance -= amount
        self.history.append(("withdraw", amount))

    def add_interest(self):
        self.deposit(round(self.balance * self.interest_rate, 2))


asha = BankAccount("Asha", 100)
ravi = BankAccount("Ravi")
asha.deposit(50)
asha.add_interest()
try:
    ravi.withdraw(10)
except ValueError as e:
    print("refused:", e)
print(asha.owner, asha.balance, asha.history)
print(vars(ravi))
print("accounts opened:", BankAccount.opened)
`,
        note: 'Press **Visualize** to see two account objects, each with its own `history` list.'
      },
      challenge: {
        title: 'A shopping cart',
        task: [
          '1. `Cart(owner)` stores the owner as `cart.owner` and starts empty.',
          '2. `add(name, price, qty=1)` adds an item; adding the same name again adds to its quantity.',
          '3. `total()` returns the price of everything in the cart, and `count()` the number of items (the quantities added up).',
          '4. `remove(name)` removes an item completely; removing an item that is not there raises `KeyError`.',
          '5. Two carts never share items.'
        ].join('\n\n'),
        starter: String.raw`class Cart:
    items = {}              # hmm: one dict for every cart?

    def __init__(self, owner):
        pass

    def add(self, name, price, qty=1):
        pass

    def total(self):
        return 0


cart = Cart("Asha")
cart.add("pen", 10, 3)
cart.add("book", 250)
print(cart.total())
`,
        solution: String.raw`class Cart:
    def __init__(self, owner):
        self.owner = owner
        self.items = {}                 # name -> [price, qty], one dict per cart

    def add(self, name, price, qty=1):
        if name in self.items:
            self.items[name][1] += qty
        else:
            self.items[name] = [price, qty]

    def total(self):
        return sum(price * qty for price, qty in self.items.values())

    def count(self):
        return sum(qty for _, qty in self.items.values())

    def remove(self, name):
        del self.items[name]            # raises KeyError when it is not there


cart = Cart("Asha")
cart.add("pen", 10, 3)
cart.add("book", 250)
print(cart.owner, cart.total(), cart.count())
`,
        hints: [
          'Store the owner in `__init__`: `self.owner = owner`. Every attribute is set through `self`.',
          'The class-level `items = {}` is **one** dict shared by every cart. Make a new one per cart in `__init__`: `self.items = {}`.',
          'Keep `self.items[name] = [price, qty]`. Then `total()` is `sum(price * qty for price, qty in self.items.values())`, and `remove` is just `del self.items[name]`.'
        ],
        checks: [
          { label: '`Cart("Asha").owner` is `"Asha"`', code: 'assert Cart("Asha").owner == "Asha"' },
          { label: '`add` and `total`: 3 pens at 10 and a book at 250 cost 280', code: 'c = Cart("x")\nc.add("pen", 10, 3)\nc.add("book", 250)\nassert c.total() == 280' },
          { label: 'Adding the same item again adds to its quantity', code: 'c = Cart("x")\nc.add("pen", 10)\nc.add("pen", 10, 2)\nassert c.count() == 3, f"count() is {c.count()}"\nassert c.total() == 30' },
          { label: 'An empty cart: `total()` and `count()` are 0', code: 'c = Cart("x")\nassert c.total() == 0 and c.count() == 0' },
          { label: '`remove` deletes an item; a missing one raises `KeyError`', code: 'c = Cart("x")\nc.add("pen", 10)\nc.remove("pen")\nassert c.count() == 0\ntry:\n    c.remove("pen")\nexcept KeyError:\n    pass\nelse:\n    raise AssertionError("removing a missing item should raise KeyError")' },
          { label: 'Two carts never share items', code: 'a, b = Cart("a"), Cart("b")\na.add("pen", 10)\nassert b.count() == 0, "b sees a\'s pen: give each cart its own dict in __init__"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'py-references', track: 'objects',
      title: 'References and copies: == versus is',
      summary: 'Every name is a reference to an object, numbers included. Aliasing, == against is, shallow and deep copies, the [[x] * 3] * 3 trap, and what a function receives.',
      keywords: ['reference', 'alias', 'aliasing', 'copy', 'deepcopy', 'shallow copy', 'deep copy', 'is', '==', 'identity', 'equality', 'mutable', 'immutable', 'pass by reference', 'id'],
      docs: 'https://docs.python.org/3/library/copy.html',
      body: [
        'Java has two kinds of variables: primitives hold a value, object variables hold a **reference**. In Python every variable is a reference, even to a number. Assignment ties a name to an object and copies nothing. [[explain:names]] shows it in pictures.',
        py('a = [1, 2, 3]',
           'b = a                  # a second name for the same list',
           'b.append(4)',
           'print(a)               # a sees it',
           'print(a is b)'),
        '## == compares values, is compares objects',
        '`==` asks "equal values?" and calls `__eq__`, Python\'s `equals()`. `is` asks "the same object?", which is Java\'s `==` on objects. So in Python the comparison you reach for first, `==`, is the right one for strings and lists:',
        py('x = [1, 2]',
           'y = [1, 2]',
           'print(x == y, x is y)          # equal, but two lists',
           'name = "".join(["As", "ha"])',
           'print(name == "Asha")          # compare text with ==, never with is'),
        'Use `is` for one everyday job: comparing with `None` (`if result is None:`), because there is only one `None`. [[explain:identity]] shows why `is` on numbers and strings sometimes *seems* to work.',
        '## Immutable objects are safe to share',
        'Numbers, strings and tuples cannot change, so sharing them is harmless: `+=` on an `int` makes a new int and moves only that one name.',
        py('n = 10',
           'm = n',
           'n += 1                 # a new int: m still points at 10',
           'print(n, m)',
           's = "hi"',
           't = s',
           's += "!"',
           'print(s, t)'),
        '## Copies: shallow and deep',
        'A **shallow** copy is a new container holding the **same** items. A **deep** copy copies the items too, all the way down:',
        py('import copy',
           '',
           'grid = [[1, 2], [3, 4]]',
           'shallow = grid.copy()          # also list(grid) or grid[:]',
           'deep = copy.deepcopy(grid)',
           'grid[0].append(99)',
           'print(shallow)                 # the inner lists are shared',
           'print(deep)                    # nothing is shared'),
        '| To copy | Shallow | Deep |\n|---|---|---|\n| a list | `items.copy()`, `list(items)`, `items[:]` | `copy.deepcopy(items)` |\n| a dict | `d.copy()`, `dict(d)` | `copy.deepcopy(d)` |\n| a set | `s.copy()`, `set(s)` | `copy.deepcopy(s)` |\n| any object | `copy.copy(obj)` | `copy.deepcopy(obj)` |',
        '## The [["."] * 3] * 3 trap',
        '`*` on a list repeats **references**. Repeating a list of lists gives several references to one inner list:',
        py('board = [["."] * 3] * 3        # three references to ONE row',
           'board[0][0] = "X"',
           'print(board)',
           'board = [["."] * 3 for _ in range(3)]   # three separate rows',
           'board[0][0] = "X"',
           'print(board)'),
        '## What a function receives',
        'A function gets a reference to the caller\'s object, never a copy, exactly as Java does with objects. It can change a list it was given; assigning to the parameter only moves the local name:',
        py('def add_item(items):',
           '    items.append("new")        # changes the caller\'s list',
           '',
           'def replace(items):',
           '    items = ["other"]          # moves the local name only',
           '',
           'basket = ["old"]',
           'add_item(basket)',
           'replace(basket)',
           'print(basket)')
      ].join('\n\n'),
      java: 'Python works like Java\'s object references for every value: there are no primitives, so an `int` behaves like an `Integer` that cannot change. The comparison operators swap roles: Python\'s `==` is Java\'s `equals()`, and Python\'s `is` is Java\'s `==`. Java has no general deep copy (`clone()` is shallow and awkward); Python\'s `copy.deepcopy` handles any object graph, cycles included.',
      js: 'JavaScript is the same: objects and arrays are shared by reference, `===` on objects compares identity, and `structuredClone(x)` is the deep copy.',
      example: {
        code: String.raw`import copy

team = {"name": "Core", "members": ["Asha", "Ravi"]}
alias = team                       # the same dict
shallow = team.copy()              # a new dict, the same members list
deep = copy.deepcopy(team)         # a new dict and a new list

team["members"].append("Li")
team["name"] = "Platform"

print("alias:  ", alias)
print("shallow:", shallow)
print("deep:   ", deep)
print(alias is team, shallow == team, deep["members"] == ["Asha", "Ravi"])
`,
        note: 'Press **Visualize**: `team` and `alias` are two arrows into one box; `shallow` is a second box sharing the members list; `deep` shares nothing.'
      },
      challenge: {
        title: 'Snapshot a game board',
        task: [
          '1. `make_board(n)` returns an n × n board: a list of n rows, each a list of n `"."`. Each row must be its own list.',
          '2. `snapshot(board)` returns a copy that shares nothing with `board`: changing either never changes the other.',
          '3. `same_position(a, b)` returns `True` when two boards hold the same marks, even when they are different objects.',
          '4. `reset(board)` sets every cell back to `"."` **in place**: other names for the board, and its rows, see the change.'
        ].join('\n\n'),
        starter: String.raw`def make_board(n):
    return [["."] * n] * n


def snapshot(board):
    return board


def same_position(a, b):
    return a is b


def reset(board):
    board = make_board(len(board))


board = make_board(3)
board[0][0] = "X"
print(board)
`,
        solution: String.raw`import copy


def make_board(n):
    return [["."] * n for _ in range(n)]


def snapshot(board):
    return copy.deepcopy(board)


def same_position(a, b):
    return a == b


def reset(board):
    for row in board:
        for i in range(len(row)):
            row[i] = "."


board = make_board(3)
board[0][0] = "X"
saved = snapshot(board)
board[1][1] = "O"
print(board, saved, same_position(board, saved))
reset(board)
print(board)
`,
        hints: [
          '`[["."] * n] * n` repeats one row n times. Build a new row each time: `[["."] * n for _ in range(n)]`.',
          '`copy.deepcopy(board)` copies the rows too. (`board.copy()` would share them.)',
          '`==` compares lists item by item, all the way down; `is` asks whether they are one object.',
          '`board = ...` inside `reset` only moves the local name. Change the cells instead: `row[i] = "."` for every row and index.'
        ],
        checks: [
          { label: '`make_board(3)` is 3 rows of 3 dots', code: 'assert make_board(3) == [["."] * 3 for _ in range(3)]' },
          { label: 'Each row is its own list: one mark changes one row', code: 'b = make_board(3)\nb[0][0] = "X"\nassert b[1][0] == ".", f"one mark changed every row: {b}"' },
          { label: '`snapshot` equals the board but shares no rows', code: 'b = make_board(2)\nb[0][0] = "X"\ns = snapshot(b)\nassert s == b and s is not b\nassert all(r1 is not r2 for r1, r2 in zip(s, b)), "the copy shares rows with the board: make a deep copy"' },
          { label: 'Changing the board after a snapshot leaves the snapshot alone', code: 'b = make_board(2)\ns = snapshot(b)\nb[1][1] = "O"\nassert s[1][1] == ".", f"the snapshot changed too: {s}"' },
          { label: '`same_position` compares the marks, not the objects', code: 'a = make_board(2)\nb = make_board(2)\nassert same_position(a, b)\nb[0][1] = "X"\nassert not same_position(a, b)' },
          { label: '`reset` clears the board in place', code: 'b = make_board(2)\nalias = b\nrow = b[0]\nb[0][0] = "X"\nb[1][1] = "O"\nreset(b)\nassert alias == make_board(2), f"other names do not see the reset: {alias}"\nassert b[0] is row, "reset should change the rows, not replace them"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'py-equality', track: 'objects',
      title: '__repr__, __eq__ and __hash__: Python\'s toString, equals and hashCode',
      summary: 'Make your objects print well, compare by value, and work as dict keys and set items: Python\'s toString, equals and hashCode, and the rule that ties the last two together.',
      keywords: ['__repr__', '__str__', '__eq__', '__hash__', 'repr', 'str', 'equals', 'hashcode', 'tostring', 'hashable', 'notimplemented', 'dict key', 'set', 'unhashable'],
      docs: 'https://docs.python.org/3/reference/datamodel.html#basic-customization',
      body: [
        'Out of the box, your objects print as `<__main__.Money object at 0x...>`, are equal only to themselves, and work as dict keys by identity. Three special methods change that: `__repr__`, `__eq__` and `__hash__`.',
        '## __repr__ and __str__: toString',
        'Python has two text forms. `__repr__` is for developers: the prompt, the debugger, lists and error messages show it, and it should look like the code that makes the object. `__str__` is for people: `print()`, `str()` and f-strings use it, and fall back to `__repr__` when it is missing.',
        py('class Money:',
           '    def __init__(self, amount, currency):',
           '        self.amount = amount',
           '        self.currency = currency',
           '',
           '    def __repr__(self):',
           '        return f"Money({self.amount!r}, {self.currency!r})"',
           '',
           '    def __str__(self):',
           '        return f"{self.amount:.2f} {self.currency}"',
           '',
           'm = Money(5, "EUR")',
           'print(m)               # __str__',
           'print(repr(m))         # __repr__',
           'print([m, m])          # a list shows its items\' __repr__',
           'print(f"{m!r}")'),
        'If you write only one, write `__repr__`: it serves both.',
        '## __eq__: equals',
        '`a == b` calls `a.__eq__(b)`. The default compares identity, like Java\'s default `equals`. Return `NotImplemented` (not `False`) for a type you do not handle, so that Python can ask the other side:',
        py('class Money:',
           '    def __init__(self, amount, currency):',
           '        self.amount = amount',
           '        self.currency = currency',
           '',
           '    def __eq__(self, other):',
           '        if not isinstance(other, Money):',
           '            return NotImplemented',
           '        return (self.amount, self.currency) == (other.amount, other.currency)',
           '',
           'print(Money(5, "EUR") == Money(5, "EUR"))',
           'print(Money(5, "EUR") != Money(5, "USD"))      # != uses __eq__ too',
           'print(Money(5, "EUR") == 5)                    # NotImplemented, then False'),
        '## __hash__: hashCode, and the rule that comes with it',
        'Java\'s rule is "override `hashCode` whenever you override `equals`", and breaking it causes quiet bugs. Python enforces it: **defining `__eq__` sets `__hash__` to `None`**, so the objects can no longer be set items or dict keys until you write a `__hash__`:',
        py('class Money:',
           '    def __init__(self, amount, currency):',
           '        self.amount = amount',
           '        self.currency = currency',
           '',
           '    def __eq__(self, other):',
           '        return isinstance(other, Money) and (self.amount, self.currency) == (other.amount, other.currency)',
           '',
           'try:',
           '    {Money(5, "EUR")}',
           'except TypeError as e:',
           '    print("TypeError:", e)'),
        'Hash the **same fields** `__eq__` compares, as a tuple. Equal objects then have equal hashes, which is all a dict needs:',
        py('class Money:',
           '    def __init__(self, amount, currency):',
           '        self.amount = amount',
           '        self.currency = currency',
           '',
           '    def __eq__(self, other):',
           '        if not isinstance(other, Money):',
           '            return NotImplemented',
           '        return (self.amount, self.currency) == (other.amount, other.currency)',
           '',
           '    def __hash__(self):',
           '        return hash((self.amount, self.currency))',
           '',
           'prices = {Money(5, "EUR"): "coffee"}',
           'print(prices[Money(5, "EUR")])               # an equal object finds the entry',
           'print(len({Money(1, "EUR"), Money(1, "EUR"), Money(2, "EUR")}))'),
        'One more rule: a field you hash must not change while the object is in a dict or set, or the object is lost there. [[explain:dict-hashing]] shows it happen. In practice, objects you hash should be immutable.',
        '## Let a dataclass write them',
        'All three are boilerplate that `@dataclass` writes from the fields, and `@dataclass(frozen=True)` also makes the object immutable and hashable: [[lesson:py-dataclasses-enums]].',
        '| Java | Python | Called by |\n|---|---|---|\n| `toString()` | `__repr__`, `__str__` | `repr()`, `print()`, f-strings |\n| `equals(Object o)` | `__eq__(self, other)` | `==` and `!=` |\n| `hashCode()` | `__hash__(self)` | `hash()`, dicts, sets |\n| `compareTo` | `__lt__` and friends | `<`, `sorted()`: [[lesson:py-special-methods]] |'
      ].join('\n\n'),
      java: 'The trio maps one to one: `toString` is `__repr__` (and `__str__`), `equals` is `__eq__`, `hashCode` is `__hash__`. Two differences protect you. A class that defines `__eq__` without `__hash__` becomes unhashable, instead of silently breaking a `HashMap`. And `__eq__` returns `NotImplemented` for a foreign type instead of `false`, which lets the other operand answer. In both languages, never hash a field that can change.',
      example: {
        code: String.raw`class ISBN:
    def __init__(self, code):
        self.code = code.replace("-", "")      # "978-0-13" and "978013" are one ISBN

    def __repr__(self):
        return f"ISBN({self.code!r})"

    def __eq__(self, other):
        if not isinstance(other, ISBN):
            return NotImplemented
        return self.code == other.code

    def __hash__(self):
        return hash(self.code)


a = ISBN("978-0-13-468599-1")
b = ISBN("9780134685991")
print(a, b, a == b, a is b)
shelf = {a: "Effective Java"}
print(shelf[b])                                 # found through an equal key
print(len({a, b}), a == "9780134685991")
`,
        note: 'Delete `__hash__` and run it again: the line that builds `shelf` fails with `unhashable type`.'
      },
      challenge: {
        title: 'Money that compares by value',
        task: [
          '1. `repr(Money(5, "EUR"))` is `Money(5, \'EUR\')`.',
          '2. `str(Money(5, "EUR"))`, and so `print`, gives `5.00 EUR`.',
          '3. Two `Money` objects are equal when both the amount and the currency are equal.',
          '4. Comparing a `Money` with something else, such as `Money(1, "EUR") == 1`, is simply `False`: `__eq__` returns `NotImplemented` for other types.',
          '5. Equal `Money` objects work as one dict key and one set item.'
        ].join('\n\n'),
        starter: String.raw`class Money:
    def __init__(self, amount, currency):
        self.amount = amount
        self.currency = currency


price = Money(5, "EUR")
print(price, price == Money(5, "EUR"))
`,
        solution: String.raw`class Money:
    def __init__(self, amount, currency):
        self.amount = amount
        self.currency = currency

    def __repr__(self):
        return f"Money({self.amount!r}, {self.currency!r})"

    def __str__(self):
        return f"{self.amount:.2f} {self.currency}"

    def __eq__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return (self.amount, self.currency) == (other.amount, other.currency)

    def __hash__(self):
        return hash((self.amount, self.currency))


price = Money(5, "EUR")
print(price, repr(price), price == Money(5, "EUR"))
`,
        hints: [
          '`__repr__` returns text that looks like the call: `f"Money({self.amount!r}, {self.currency!r})"`. The `!r` puts quotes around the string.',
          '`__str__` formats the amount with two decimals: `f"{self.amount:.2f} {self.currency}"`.',
          'In `__eq__`, first `if not isinstance(other, Money): return NotImplemented`, then compare the tuples `(self.amount, self.currency)`.',
          'Defining `__eq__` makes the class unhashable. Add `def __hash__(self): return hash((self.amount, self.currency))`.'
        ],
        checks: [
          { label: '`repr(Money(5, "EUR"))` is `Money(5, \'EUR\')`', code: String.raw`assert repr(Money(5, "EUR")) == "Money(5, 'EUR')"` },
          { label: '`str(Money(5, "EUR"))` is `5.00 EUR`', code: 'assert str(Money(5, "EUR")) == "5.00 EUR"\nassert str(Money(2.5, "USD")) == "2.50 USD"' },
          { label: 'Equal amount and currency means equal', code: 'assert Money(5, "EUR") == Money(5, "EUR")\nassert Money(5, "EUR") != Money(5, "USD")\nassert Money(5, "EUR") != Money(6, "EUR")' },
          { label: '`__eq__` returns `NotImplemented` for other types, so `Money(1, "EUR") == 1` is `False`', code: 'assert (Money(1, "EUR") == 1) is False\nassert Money(1, "EUR").__eq__(1) is NotImplemented, "return NotImplemented for other types"\nassert Money(1, "EUR").__eq__(Money(1, "EUR")) is True' },
          { label: 'Usable as a dict key: an equal object finds the entry', code: 'd = {Money(5, "EUR"): "coffee"}\nassert d[Money(5, "EUR")] == "coffee"' },
          { label: 'Equal objects are one set item', code: 'assert len({Money(1, "EUR"), Money(1, "EUR"), Money(1, "USD")}) == 2' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'py-special-methods', track: 'objects',
      title: 'Operators and containers: special methods',
      summary: 'Give your classes operators and container behaviour: len(), [], in, for, +, *, <, abs() and calling an object, each through one special method.',
      keywords: ['special methods', 'dunder', 'operator overloading', '__len__', '__getitem__', '__contains__', '__iter__', '__add__', '__radd__', '__mul__', '__rmul__', '__lt__', 'total_ordering', '__call__', '__bool__', 'comparable'],
      docs: 'https://docs.python.org/3/reference/datamodel.html#emulating-container-types',
      body: [
        'Python\'s operators and many built-in functions are calls to special methods: `len(x)` calls `x.__len__()`, `x[i]` calls `x.__getitem__(i)`, and `a + b` calls `a.__add__(b)`. Define the method and your class works with the operator. Java keeps operators for its built-in types; Python lets any class join in.',
        '| You write | Python calls | Java equivalent |\n|---|---|---|\n| `len(x)` | `x.__len__()` | `x.size()` |\n| `x[i]`, `x[i] = v` | `__getitem__`, `__setitem__` | `get(i)`, `set(i, v)` |\n| `v in x` | `x.__contains__(v)` | `x.contains(v)` |\n| `for v in x` | `x.__iter__()` | `Iterable.iterator()` |\n| `a + b`, `a * b` | `a.__add__(b)`, `a.__mul__(b)` | none |\n| `a < b`, `sorted(xs)` | `a.__lt__(b)` | `Comparable.compareTo` |\n| `abs(x)`, `-x` | `__abs__`, `__neg__` | none |\n| `bool(x)`, `if x:` | `__bool__`, else `__len__` | none |\n| `x(...)` | `x.__call__(...)` | a functional interface |',
        '## A container: __len__, __getitem__, __contains__',
        py('class Playlist:',
           '    def __init__(self, *songs):',
           '        self.songs = list(songs)',
           '',
           '    def __len__(self):',
           '        return len(self.songs)',
           '',
           '    def __getitem__(self, index):',
           '        return self.songs[index]           # ints and slices both work',
           '',
           '    def __contains__(self, song):',
           '        return song in self.songs',
           '',
           'p = Playlist("Intro", "Theme", "Outro")',
           'print(len(p), p[0], p[-1], p[1:])',
           'print("Theme" in p, bool(Playlist()))',
           'for song in p:                     # __getitem__ alone makes it loop',
           '    print(song)'),
        'An empty container is falsy: without `__bool__`, Python uses `__len__`. And with `__getitem__`, a `for` loop already works, by asking for index 0, 1, 2… until `IndexError`. The cleaner way to loop is `__iter__`: [[lesson:py-iterators]].',
        '## Arithmetic: __add__, __mul__ and the reflected __rmul__',
        'Return a **new** object, and return `NotImplemented` for a type you cannot handle. For `3 * v`, Python first asks `int.__mul__(3, v)`, which returns `NotImplemented`, then tries the **reflected** method `v.__rmul__(3)`:',
        py('class Vector:',
           '    def __init__(self, x, y):',
           '        self.x, self.y = x, y',
           '',
           '    def __add__(self, other):',
           '        if not isinstance(other, Vector):',
           '            return NotImplemented',
           '        return Vector(self.x + other.x, self.y + other.y)',
           '',
           '    def __mul__(self, k):',
           '        return Vector(self.x * k, self.y * k)',
           '',
           '    def __rmul__(self, k):         # k * vector',
           '        return self * k',
           '',
           '    def __repr__(self):',
           '        return f"Vector({self.x}, {self.y})"',
           '',
           'v = Vector(1, 2)',
           'print(v + Vector(3, 4), v * 3, 3 * v)',
           'try:',
           '    v + 5',
           'except TypeError as e:',
           '    print("TypeError:", e)'),
        '`+=` uses `__iadd__` when there is one (lists have it, which is why `+=` extends a list in place), and otherwise `__add__` and an assignment.',
        '## Ordering: __lt__ and @total_ordering',
        '`sorted()`, `min()` and `max()` need only `<`. Define `__eq__` and `__lt__`, and `functools.total_ordering` fills in `<=`, `>` and `>=`:',
        py('from functools import total_ordering',
           '',
           '@total_ordering',
           'class Version:',
           '    def __init__(self, text):',
           '        self.parts = tuple(int(p) for p in text.split("."))',
           '',
           '    def __eq__(self, other):',
           '        return self.parts == other.parts',
           '',
           '    def __lt__(self, other):',
           '        return self.parts < other.parts      # tuples compare item by item',
           '',
           '    def __repr__(self):',
           '        return "v" + ".".join(map(str, self.parts))',
           '',
           'releases = [Version("1.10"), Version("1.2"), Version("1.9")]',
           'print(sorted(releases), max(releases))',
           'print(Version("2.0") >= Version("1.99"))'),
        'Often you need none of this: `sorted(items, key=lambda r: r.parts)` sorts by a key, like `Comparator.comparing`.',
        '## Calling an object: __call__',
        py('class Discount:',
           '    def __init__(self, percent):',
           '        self.percent = percent',
           '',
           '    def __call__(self, price):',
           '        return round(price * (1 - self.percent / 100), 2)',
           '',
           'festive = Discount(20)',
           'print(festive(250), list(map(festive, [10, 99])))'),
        'Every special method is listed in the Reference: [[ref:dunder-len]], [[ref:dunder-getitem]], [[ref:dunder-add]], [[ref:dunder-lt]].'
      ].join('\n\n'),
      java: 'Java has no operator overloading: `BigDecimal` needs `a.add(b)`, and collections need `size()`, `get()` and `contains()`. In Python those are special methods behind `len()`, `[]`, `in` and `+`, so your class reads like a built-in type. `Comparable.compareTo` becomes `__lt__`, one method answering "less than?" instead of returning -1, 0 or 1, and a functional interface becomes `__call__`. For an operand type you do not support, return `NotImplemented`; never raise.',
      example: {
        code: String.raw`from functools import total_ordering


@total_ordering
class Money:
    def __init__(self, cents):
        self.cents = cents

    def __add__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return Money(self.cents + other.cents)

    def __radd__(self, other):          # sum() starts from 0, so 0 + Money must work
        if other == 0:
            return self
        return NotImplemented

    def __mul__(self, times):
        return Money(self.cents * times)

    __rmul__ = __mul__

    def __eq__(self, other):
        return isinstance(other, Money) and self.cents == other.cents

    def __lt__(self, other):
        return self.cents < other.cents

    def __bool__(self):
        return self.cents != 0

    def __repr__(self):
        return f"Money({self.cents / 100:.2f})"


basket = [Money(250), Money(1999), Money(75)]
print(sum(basket), max(basket), sorted(basket))
print(3 * Money(100), bool(Money(0)))
`,
        note: '`sum()` starts from `0`, so `0 + Money(250)` must work: that is what `__radd__` is for.'
      },
      challenge: {
        title: 'A 2D vector',
        task: [
          '1. `Vector(1, 2) + Vector(3, 4)` is `Vector(4, 6)`, and vectors with the same coordinates are equal.',
          '2. `Vector(1, 2) * 3` and `3 * Vector(1, 2)` are both `Vector(3, 6)`.',
          '3. `abs(Vector(3, 4))` is its length, `5.0`.',
          '4. `v[0]` and `v[1]` are the coordinates, and `x, y = v` unpacks a vector.',
          '5. `repr(Vector(1, 2))` is `Vector(1, 2)`.',
          '6. Adding something that is not a vector, `Vector(1, 2) + 5`, raises `TypeError`.'
        ].join('\n\n'),
        starter: String.raw`class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def add(self, other):              # Java style: v.add(w)
        return Vector(self.x + other.x, self.y + other.y)


v = Vector(1, 2).add(Vector(3, 4))
print(v.x, v.y)
`,
        solution: String.raw`import math


class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        if not isinstance(other, Vector):
            return NotImplemented
        return Vector(self.x + other.x, self.y + other.y)

    def __mul__(self, k):
        return Vector(self.x * k, self.y * k)

    def __rmul__(self, k):
        return self * k

    def __eq__(self, other):
        return isinstance(other, Vector) and (self.x, self.y) == (other.x, other.y)

    def __abs__(self):
        return math.hypot(self.x, self.y)

    def __getitem__(self, i):
        return (self.x, self.y)[i]

    def __len__(self):
        return 2

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"


v = Vector(1, 2) + Vector(3, 4)
print(v, 3 * v, abs(Vector(3, 4)))
`,
        hints: [
          '`a + b` calls `a.__add__(b)`. Return a **new** `Vector`, or `NotImplemented` when `other` is not a vector: Python then raises the `TypeError` for you.',
          '`3 * v` first asks `int`, which gives up, then calls `v.__rmul__(3)`. It can simply `return self * k`.',
          '`abs()` calls `__abs__`: `math.hypot(self.x, self.y)`. Indexing calls `__getitem__(i)`: `return (self.x, self.y)[i]`, and unpacking then works too.',
          '`==` needs `__eq__`, and `repr()` needs `__repr__`.'
        ],
        checks: [
          { label: '`Vector(1, 2) + Vector(3, 4) == Vector(4, 6)`', code: 'assert Vector(1, 2) + Vector(3, 4) == Vector(4, 6)\nassert Vector(1, 2) != Vector(2, 1)' },
          { label: '`v * 3` and `3 * v` both work', code: 'assert Vector(1, 2) * 3 == Vector(3, 6)\nassert 3 * Vector(1, 2) == Vector(3, 6), "3 * v needs __rmul__"' },
          { label: '`abs(Vector(3, 4))` is 5.0', code: 'assert abs(Vector(3, 4)) == 5.0' },
          { label: 'Indexing and unpacking: `v[0]`, `v[1]`, `x, y = v`', code: 'v = Vector(7, 8)\nassert v[0] == 7 and v[1] == 8\nx, y = v\nassert (x, y) == (7, 8)' },
          { label: '`repr(Vector(1, 2))` is `Vector(1, 2)`', code: 'assert repr(Vector(1, 2)) == "Vector(1, 2)"' },
          { label: '`Vector(1, 2) + 5` raises `TypeError`', code: 'try:\n    Vector(1, 2) + 5\nexcept TypeError:\n    pass\nelse:\n    raise AssertionError("adding a number should raise TypeError: return NotImplemented")' },
          { label: 'Uses special methods, not `add()`', code: 'assert "__add__" in vars(Vector), "define __add__, so that + works"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'py-properties', track: 'objects',
      title: 'Properties: getters and setters without the boilerplate',
      summary: 'Start with plain attributes; when you need a check or a computed value, turn the attribute into a property without changing any caller. Read-only properties, setters that validate, and cached_property.',
      keywords: ['property', '@property', 'getter', 'setter', 'validation', 'computed attribute', 'read-only', 'cached_property', 'encapsulation', 'private', 'lombok'],
      docs: 'https://docs.python.org/3/library/functions.html#property',
      body: [
        'In Java you write `private double radius;` with `getRadius()` and `setRadius()` from day one, in case you need logic later. Python code skips that: attributes are public, and when logic is needed, a **property** adds it without changing a single caller.',
        '## Start with a plain attribute',
        py('class Circle:',
           '    def __init__(self, radius):',
           '        self.radius = radius',
           '',
           'c = Circle(2)',
           'c.radius = 3              # callers read and write it directly',
           'print(c.radius)'),
        '## A computed, read-only property',
        '`@property` turns a method into something read like an attribute, with no parentheses. Without a setter, assigning to it is an error:',
        py('import math',
           '',
           'class Circle:',
           '    def __init__(self, radius):',
           '        self.radius = radius',
           '',
           '    @property',
           '    def area(self):',
           '        return round(math.pi * self.radius ** 2, 2)',
           '',
           'c = Circle(2)',
           'print(c.area)             # computed each time it is read',
           'c.radius = 3',
           'print(c.area)',
           'try:',
           '    c.area = 10',
           'except AttributeError as e:',
           '    print("AttributeError:", e)'),
        '## A setter that checks',
        'Now say a radius must never be negative. Make `radius` a property that keeps the value in `_radius` (the underscore means "internal") and give it a setter that checks. `__init__` assigns `self.radius`, so it goes through the check too:',
        py('class Circle:',
           '    def __init__(self, radius):',
           '        self.radius = radius               # runs the setter below',
           '',
           '    @property',
           '    def radius(self):',
           '        return self._radius',
           '',
           '    @radius.setter',
           '    def radius(self, value):',
           '        if value < 0:',
           '            raise ValueError(f"radius must be >= 0, got {value}")',
           '        self._radius = value',
           '',
           'c = Circle(2)',
           'c.radius = 5                               # callers did not change',
           'print(c.radius)',
           'try:',
           '    Circle(-1)',
           'except ValueError as e:',
           '    print("ValueError:", e)'),
        'That is why Python skips Java\'s getters and setters: going from a plain attribute to a property changes nothing for the code that uses it.',
        '## A setter that converts',
        'A property can also keep two views of one value in step:',
        py('class Timer:',
           '    def __init__(self):',
           '        self.seconds = 0',
           '',
           '    @property',
           '    def minutes(self):',
           '        return self.seconds / 60',
           '',
           '    @minutes.setter',
           '    def minutes(self, value):',
           '        self.seconds = value * 60',
           '',
           't = Timer()',
           't.minutes = 2.5',
           'print(t.seconds, t.minutes)'),
        '## Expensive values: cached_property',
        '`functools.cached_property` computes the value on the first read and stores it on the object; later reads cost nothing:',
        py('from functools import cached_property',
           '',
           'class Report:',
           '    def __init__(self, rows):',
           '        self.rows = rows',
           '',
           '    @cached_property',
           '    def total(self):',
           '        print("  adding up", len(self.rows), "rows")',
           '        return sum(self.rows)',
           '',
           'r = Report([5, 10, 20])',
           'print(r.total, r.total)'),
        '| Java | Python |\n|---|---|\n| `private double radius;` | `self._radius` (internal by convention) |\n| `getRadius()` | `@property def radius(self)` |\n| `setRadius(double r)` | `@radius.setter def radius(self, r)` |\n| a getter with no setter | a property with no setter: read-only |\n| a lazily initialised field | `@cached_property` |'
      ].join('\n\n'),
      java: 'Properties remove the reason for Java\'s getter and setter boilerplate. Write plain public attributes; the day you need validation or a computed value, replace the attribute with a property of the same name, and every `obj.radius` in the code keeps working. Under the hood a property is a **descriptor**, an object that intercepts attribute access ([[lesson:py-descriptors]]). Kotlin and C# properties are the closest relatives.',
      js: 'JavaScript\'s `get area() { }` and `set radius(v) { }` in a class are the same idea.',
      example: {
        code: String.raw`class Product:
    def __init__(self, name, price, discount=0):
        self.name = name
        self.price = price                  # goes through the setter
        self.discount = discount

    @property
    def price(self):
        return self._price

    @price.setter
    def price(self, value):
        if value < 0:
            raise ValueError(f"price cannot be negative: {value}")
        self._price = round(value, 2)

    @property
    def final_price(self):                  # read-only: computed from the others
        return round(self.price * (1 - self.discount / 100), 2)


tea = Product("Chai", 120, discount=10)
print(tea.name, tea.price, tea.final_price)
tea.price = 99.999
print(tea.price, tea.final_price)
for bad in (lambda: setattr(tea, "price", -5), lambda: setattr(tea, "final_price", 1)):
    try:
        bad()
    except (ValueError, AttributeError) as e:
        print(type(e).__name__ + ":", e)
print(vars(tea))
`,
        note: '`vars(tea)` shows `_price`: the value behind the property.'
      },
      challenge: {
        title: 'A temperature that keeps its units in step',
        task: [
          '1. `Temperature(25)` stores degrees Celsius: `t.celsius` is 25.',
          '2. `t.fahrenheit` is computed (`celsius * 9 / 5 + 32`), and assigning `t.fahrenheit = 212` sets the Celsius value to 100.',
          '3. `t.kelvin` is `celsius + 273.15` and read-only: assigning to it raises `AttributeError`.',
          '4. Nothing may go below absolute zero, -273.15 °C: `Temperature(-300)` and `t.celsius = -300` raise `ValueError`.',
          '5. Use `@property` for all three, so callers never call a method.'
        ].join('\n\n'),
        starter: String.raw`class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    def get_fahrenheit(self):
        return self.celsius * 9 / 5 + 32

    def set_fahrenheit(self, value):
        self.celsius = (value - 32) * 5 / 9


t = Temperature(25)
print(t.celsius, t.get_fahrenheit())
`,
        solution: String.raw`class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius               # checked by the setter

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError(f"below absolute zero: {value}")
        self._celsius = value

    @property
    def fahrenheit(self):
        return self.celsius * 9 / 5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value):
        self.celsius = (value - 32) * 5 / 9

    @property
    def kelvin(self):
        return self.celsius + 273.15


t = Temperature(25)
print(t.celsius, t.fahrenheit, t.kelvin)
t.fahrenheit = 212
print(t.celsius)
`,
        hints: [
          'A read-only computed value: `@property` above `def kelvin(self): return self.celsius + 273.15`.',
          'A settable one needs two methods with the same name: `@property def fahrenheit(self)` and `@fahrenheit.setter def fahrenheit(self, value)`. The setter converts and stores Celsius.',
          'For the check, make `celsius` a property too, keeping the value in `self._celsius`. In `__init__`, assign `self.celsius = celsius`, so the setter checks it.'
        ],
        checks: [
          { label: '`Temperature(25).celsius` is 25', code: 'assert Temperature(25).celsius == 25' },
          { label: '`fahrenheit` reads like an attribute: 25 °C is 77 °F', code: 'assert Temperature(25).fahrenheit == 77' },
          { label: 'Setting `fahrenheit` to 212 sets `celsius` to 100', code: 't = Temperature(0)\nt.fahrenheit = 212\nassert approx(t.celsius, 100), f"celsius is {t.celsius}"' },
          { label: '`kelvin` is `celsius + 273.15`', code: 'assert approx(Temperature(25).kelvin, 298.15)' },
          { label: '`kelvin` is read-only', code: 't = Temperature(1)\ntry:\n    t.kelvin = 0\nexcept AttributeError:\n    pass\nelse:\n    raise AssertionError("assigning kelvin should raise AttributeError: give it no setter")' },
          { label: 'Below -273.15 °C raises `ValueError`, from the constructor and from the setter', code: 'for make in (lambda: Temperature(-300), lambda: setattr(Temperature(0), "celsius", -300)):\n    try:\n        make()\n    except ValueError:\n        continue\n    raise AssertionError("-300 should raise ValueError")\nassert Temperature(-273.15).celsius == -273.15' },
          { label: 'All three are properties', code: 'for name in ("celsius", "fahrenheit", "kelvin"):\n    assert isinstance(vars(Temperature).get(name), property), f"make {name} a @property"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'py-inheritance', track: 'objects',
      title: 'Inheritance, super() and the MRO',
      summary: 'Subclasses, overriding and super(), isinstance, several parents (which Java allows only for interfaces), mixins, and the method resolution order that decides which method runs.',
      keywords: ['inheritance', 'subclass', 'extends', 'super', 'override', 'mro', 'method resolution order', 'multiple inheritance', 'mixin', 'diamond', 'isinstance', 'issubclass', 'polymorphism'],
      docs: 'https://docs.python.org/3/tutorial/classes.html#inheritance',
      body: [
        'The parent class goes in brackets. A subclass inherits every method and can override any of them; `super()` calls the version it replaced:',
        py('class Employee:',
           '    def __init__(self, name, salary):',
           '        self.name = name',
           '        self.salary = salary',
           '',
           '    def annual_pay(self):',
           '        return self.salary',
           '',
           '    def describe(self):',
           '        return f"{self.name}: {self.annual_pay()}"',
           '',
           'class Manager(Employee):',
           '    def __init__(self, name, salary, bonus):',
           '        super().__init__(name, salary)       # let the parent set its part',
           '        self.bonus = bonus',
           '',
           '    def annual_pay(self):                    # overrides Employee.annual_pay',
           '        return super().annual_pay() + self.bonus',
           '',
           'staff = [Employee("Asha", 100), Manager("Ravi", 120, 30)]',
           'for person in staff:',
           '    print(person.describe())                 # each uses its own annual_pay'),
        'Two things a Java developer might not expect: every method can be overridden (there is no `final`, and no `@Override` is needed), and `__init__` is inherited like any other method, so a subclass without its own `__init__` uses the parent\'s. When you do write one, call `super().__init__(...)`, or the parent\'s attributes are never set.',
        '## isinstance and issubclass',
        py('class Animal:',
           '    pass',
           '',
           'class Dog(Animal):',
           '    pass',
           '',
           'rex = Dog()',
           'print(isinstance(rex, Dog), isinstance(rex, Animal), isinstance(rex, object))',
           'print(issubclass(Dog, Animal), type(rex) is Animal)'),
        '`isinstance` respects inheritance; `type(x) is C` does not. Prefer `isinstance`, and prefer not checking at all: call the method and let each class do its part.',
        '## Several parents, and mixins',
        'A Python class may inherit from several classes. The common, safe use is a **mixin**: a small class that adds one ability and holds no state of its own, much like a Java interface with default methods:',
        py('import json',
           '',
           'class JsonMixin:',
           '    def to_json(self):',
           '        return json.dumps(vars(self))',
           '',
           'class Point:',
           '    def __init__(self, x, y):',
           '        self.x, self.y = x, y',
           '',
           'class JsonPoint(JsonMixin, Point):',
           '    pass',
           '',
           'print(JsonPoint(1, 2).to_json())'),
        '## The method resolution order (MRO)',
        'With several parents, which method wins? Python searches the classes in one fixed order, the **MRO**, which `Class.__mro__` shows. A class always comes before its parents, and parents keep the order you listed them in:',
        py('class A:',
           '    def who(self):',
           '        return "A"',
           '',
           'class B(A):',
           '    def who(self):',
           '        return "B"',
           '',
           'class C(A):',
           '    def who(self):',
           '        return "C"',
           '',
           'class D(B, C):',
           '    pass',
           '',
           'print([k.__name__ for k in D.__mro__])',
           'print(D().who())'),
        '`super()` follows the same order: it means "the next class in the MRO", which is not always the parent you can see. That is what lets every class in a hierarchy cooperate, each calling `super()` once. Step through it in [[explain:mro]].',
        '| Java | Python |\n|---|---|\n| `class Dog extends Animal` | `class Dog(Animal):` |\n| `super(name)` in a constructor | `super().__init__(name)` |\n| `super.speak()` | `super().speak()` |\n| `@Override` | nothing (`typing.override` exists for type checkers) |\n| a `final` method or class | nothing (`typing.final` exists for type checkers) |\n| `implements A, B` | `class C(A, B):` (several parents) |\n| `x instanceof Dog` | `isinstance(x, Dog)` |'
      ].join('\n\n'),
      java: 'Single inheritance works as in Java, with `super()` instead of `super`. The differences: every method is overridable, `__init__` is inherited, and a class may have several parents. Java avoids the "diamond" (two parents sharing a grandparent) by allowing only one superclass plus interfaces; Python allows it and resolves it with the MRO, worked out by the C3 algorithm. In practice, use extra parents only for small mixins, and prefer composition (an attribute holding another object) to deep hierarchies: the same advice as in Java.',
      example: {
        code: String.raw`class Shape:
    def __init__(self, name):
        self.name = name

    def area(self):
        raise NotImplementedError

    def __str__(self):
        return f"{self.name} with area {self.area():.2f}"


class Rectangle(Shape):
    def __init__(self, width, height):
        super().__init__("rectangle")
        self.width, self.height = width, height

    def area(self):
        return self.width * self.height


class Square(Rectangle):
    def __init__(self, side):
        super().__init__(side, side)
        self.name = "square"


class LoggedMixin:
    def area(self):
        result = super().area()             # the next class in the MRO
        print(f"  [{type(self).__name__}.area() -> {result}]")
        return result


class LoggedSquare(LoggedMixin, Square):
    pass


for shape in [Rectangle(2, 3), Square(4), LoggedSquare(5)]:
    print(shape)
print([k.__name__ for k in LoggedSquare.__mro__])
`,
        note: '`LoggedMixin.area` calls `super().area()`, which finds `Rectangle.area` through the MRO, although `LoggedMixin` has no parent of its own.'
      },
      challenge: {
        title: 'Employees and managers',
        task: [
          '1. `Employee(name, salary)` is given: `annual_pay()` returns the salary, and `describe()` returns `"<name> (<role>): <annual pay>"`, where `role` is a class attribute.',
          '2. Make `Manager(name, salary, bonus)` a subclass of `Employee`. Its `__init__` lets `Employee.__init__` set the name and salary, through `super()`.',
          '3. A manager\'s `annual_pay()` is the employee pay plus the bonus, also through `super()`.',
          '4. `describe()` stays written once, in `Employee`, and works for both.',
          '5. `JsonMixin` gets a method `to_dict()` returning a copy of the object\'s attributes as a dict, so `Contractor(JsonMixin, Employee)` has it.'
        ].join('\n\n'),
        starter: String.raw`class Employee:
    role = "employee"

    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def annual_pay(self):
        return self.salary

    def describe(self):
        return f"{self.name} ({self.role}): {self.annual_pay()}"


class Manager:                      # copy-pasted, not inherited
    role = "manager"

    def __init__(self, name, salary, bonus):
        self.name = name
        self.salary = salary
        self.bonus = bonus


class JsonMixin:
    pass


class Contractor(JsonMixin, Employee):
    role = "contractor"


print(Employee("Asha", 100).describe())
`,
        solution: String.raw`class Employee:
    role = "employee"

    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def annual_pay(self):
        return self.salary

    def describe(self):
        return f"{self.name} ({self.role}): {self.annual_pay()}"


class Manager(Employee):
    role = "manager"

    def __init__(self, name, salary, bonus):
        super().__init__(name, salary)
        self.bonus = bonus

    def annual_pay(self):
        return super().annual_pay() + self.bonus


class JsonMixin:
    def to_dict(self):
        return dict(vars(self))


class Contractor(JsonMixin, Employee):
    role = "contractor"


print(Employee("Asha", 100).describe())
print(Manager("Ravi", 100, bonus=20).describe())
print(Contractor("Li", 70).to_dict())
`,
        hints: [
          '`class Manager(Employee):` makes the subclass. Its `__init__` starts with `super().__init__(name, salary)`, then sets `self.bonus`.',
          'Override `annual_pay` in `Manager`: `return super().annual_pay() + self.bonus`. `describe()` then works unchanged, because it calls `self.annual_pay()`.',
          'The mixin needs one method: `def to_dict(self): return dict(vars(self))`. `vars(self)` is the object\'s attribute dict, and `dict(...)` copies it.'
        ],
        checks: [
          { label: '`Manager` is a subclass of `Employee`', code: 'assert issubclass(Manager, Employee)\nassert isinstance(Manager("R", 1, 1), Employee)' },
          { label: '`Manager.__init__` lets the parent set name and salary through `super()`', code: 'import inspect\nm = Manager("Ravi", 100, 20)\nassert (m.name, m.salary, m.bonus) == ("Ravi", 100, 20)\nassert "super()" in inspect.getsource(Manager.__init__), "call super().__init__(name, salary)"' },
          { label: 'A manager\'s pay is the salary plus the bonus, through `super()`', code: 'import inspect\nassert Manager("Ravi", 100, 20).annual_pay() == 120\nassert "super()" in inspect.getsource(Manager.annual_pay), "use super().annual_pay() + self.bonus"' },
          { label: '`describe()` is inherited and uses each class\'s role and pay', code: 'assert Employee("Asha", 50).describe() == "Asha (employee): 50"\nassert Manager("Ravi", 100, 20).describe() == "Ravi (manager): 120"\nassert "describe" not in vars(Manager), "describe() should be inherited, not copied"' },
          { label: '`Contractor` gets `to_dict()` from the mixin', code: 'c = Contractor("Li", 70)\nassert c.to_dict() == {"name": "Li", "salary": 70}\nassert [k.__name__ for k in Contractor.__mro__] == ["Contractor", "JsonMixin", "Employee", "object"]' },
          { label: '`to_dict()` returns a copy, not the object\'s own dict', code: 'c = Contractor("Li", 70)\nd = c.to_dict()\nd["name"] = "changed"\nassert c.name == "Li", "return dict(vars(self)), a copy"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'py-abc-protocols', track: 'objects',
      title: 'Interfaces: abstract base classes and Protocols',
      summary: 'Python\'s two answers to Java interfaces: an ABC with @abstractmethod, which refuses to be instantiated until a subclass provides the methods, and a Protocol, which any class with the right methods satisfies. And duck typing, which needs neither.',
      keywords: ['interface', 'abstract', 'abstract class', 'abc', 'abstractmethod', 'protocol', 'duck typing', 'structural typing', 'runtime_checkable', 'implements', 'collections.abc', 'iterable'],
      docs: 'https://docs.python.org/3/library/abc.html',
      body: [
        'Java code leans on interfaces: a method takes a `Shape`, and only classes that `implement Shape` can be passed. Python\'s default is **duck typing**: a function calls `shape.area()`, and any object with an `area()` method works, with nothing declared:',
        py('class Square:',
           '    def __init__(self, side):',
           '        self.side = side',
           '',
           '    def area(self):',
           '        return self.side ** 2',
           '',
           'class Circle:',
           '    def __init__(self, r):',
           '        self.r = r',
           '',
           '    def area(self):',
           '        return round(3.14159 * self.r ** 2, 2)',
           '',
           'def total_area(shapes):',
           '    return sum(s.area() for s in shapes)      # anything with .area() will do',
           '',
           'print(total_area([Square(2), Circle(1)]))'),
        'That is flexible, but it states nothing up front: a missing method shows only as an `AttributeError` when the line runs. Two tools write the contract down.',
        '## Abstract base classes (ABC)',
        'Inherit from `abc.ABC` and mark methods `@abstractmethod`. The class cannot be instantiated, and neither can a subclass until it provides every abstract method. The error comes when an object is **created**, not later when the missing method would be called:',
        py('from abc import ABC, abstractmethod',
           '',
           'class Shape(ABC):',
           '    @abstractmethod',
           '    def area(self): ...',
           '',
           '    def describe(self):                       # a normal method, shared by all',
           '        return f"{type(self).__name__} of area {self.area()}"',
           '',
           'class Square(Shape):',
           '    def __init__(self, side):',
           '        self.side = side',
           '',
           '    def area(self):',
           '        return self.side ** 2',
           '',
           'class Blob(Shape):                            # forgot area()',
           '    pass',
           '',
           'print(Square(3).describe())',
           'for cls in (Shape, Blob):',
           '    try:',
           '        cls()',
           '    except TypeError as e:',
           '        print("TypeError:", e)'),
        'An ABC is Java\'s abstract class, and with only abstract methods, an interface. The `...` body is a placeholder, like `pass`.',
        '## Protocols: structural typing',
        'A `typing.Protocol` lists the methods a type must have. A class matches if it **has** them; it never inherits from the protocol. That is duck typing written down, and type checkers (mypy, your IDE) check it. With `@runtime_checkable`, `isinstance` checks it too (method names only, not their parameters):',
        py('from typing import Protocol, runtime_checkable',
           '',
           '@runtime_checkable',
           'class HasArea(Protocol):',
           '    def area(self) -> float: ...',
           '',
           'class Square:                                 # no mention of HasArea',
           '    def area(self):',
           '        return 4.0',
           '',
           'def largest(shapes: list[HasArea]) -> float:',
           '    return max(s.area() for s in shapes)',
           '',
           'print(largest([Square()]), isinstance(Square(), HasArea), isinstance("text", HasArea))'),
        '## Which one?',
        '| Use | When |\n|---|---|\n| nothing (duck typing) | small programs, or when any object with the method should do |\n| an ABC | you own the hierarchy and want shared code, plus an error the moment a subclass is incomplete |\n| a Protocol | you want to describe what you accept from code you do not own, without forcing anyone to inherit |',
        '## The standard library\'s ABCs',
        '`collections.abc` defines the interfaces behind the built-in types: `Iterable`, `Sequence`, `Mapping`, `Callable`. Use them to ask what an object can do:',
        py('from collections.abc import Iterable, Mapping, Sequence',
           '',
           'for value in ([1, 2], "text", {"a": 1}, 42):',
           '    print(type(value).__name__, isinstance(value, Iterable), isinstance(value, Sequence), isinstance(value, Mapping))')
      ].join('\n\n'),
      java: 'An ABC with only `@abstractmethod`s is a Java `interface`; with some normal methods it is an `abstract class`, or an interface with `default` methods. Python checks it when an object is created, where Java checks at compile time. A `Protocol` has no Java equivalent: it is structural typing, as in Go or TypeScript, where a class satisfies an interface by having the methods rather than by declaring `implements`. Much Python code uses neither and relies on duck typing.',
      example: {
        code: String.raw`from abc import ABC, abstractmethod
from typing import Protocol, runtime_checkable


class Notifier(ABC):
    """The interface every notifier implements."""

    @abstractmethod
    def send(self, to, message): ...

    def broadcast(self, people, message):       # shared code, written once
        return [self.send(p, message) for p in people]


class EmailNotifier(Notifier):
    def send(self, to, message):
        return f"email to {to}: {message}"


class SmsNotifier(Notifier):
    def send(self, to, message):
        return f"sms to {to}: {message[:20]}"


@runtime_checkable
class Closeable(Protocol):
    def close(self) -> None: ...


class Connection:                               # never mentions Closeable
    def close(self):
        print("connection closed")


for n in (EmailNotifier(), SmsNotifier()):
    print(n.broadcast(["asha", "ravi"], "The build is green again"))
for thing in (Connection(), EmailNotifier()):
    if isinstance(thing, Closeable):
        thing.close()
    else:
        print(type(thing).__name__, "has nothing to close")
`,
        note: '`Connection` matches `Closeable` without inheriting from it: that is a Protocol.'
      },
      challenge: {
        title: 'Shapes with a contract',
        task: [
          '1. `Shape` is an abstract base class with two abstract methods, `area()` and `perimeter()`. `Shape()` raises `TypeError`, and so does a subclass that leaves either method out.',
          '2. `Shape` also has a normal method `describe()` returning, for example, `"Rectangle with area 12.00"`: the class name and the area to two decimals.',
          '3. `Rectangle(width, height)` and `Circle(radius)` implement both methods.',
          '4. `HasArea` is a runtime-checkable `Protocol` with an `area()` method, and `total_area(items)` adds up the areas, raising `TypeError` for an item that has no `area()`.'
        ].join('\n\n'),
        starter: String.raw`import math


class Shape:
    def area(self):
        return 0

    def perimeter(self):
        return 0


class Rectangle(Shape):
    def __init__(self, width, height):
        self.width, self.height = width, height


class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius


def total_area(items):
    return sum(item.area() for item in items)


print(total_area([Rectangle(3, 4), Circle(1)]))
`,
        solution: String.raw`import math
from abc import ABC, abstractmethod
from typing import Protocol, runtime_checkable


class Shape(ABC):
    @abstractmethod
    def area(self): ...

    @abstractmethod
    def perimeter(self): ...

    def describe(self):
        return f"{type(self).__name__} with area {self.area():.2f}"


class Rectangle(Shape):
    def __init__(self, width, height):
        self.width, self.height = width, height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)


class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius ** 2

    def perimeter(self):
        return 2 * math.pi * self.radius


@runtime_checkable
class HasArea(Protocol):
    def area(self) -> float: ...


def total_area(items):
    for item in items:
        if not isinstance(item, HasArea):
            raise TypeError(f"{item!r} has no area()")
    return sum(item.area() for item in items)


print(Rectangle(3, 4).describe(), total_area([Rectangle(3, 4), Circle(1)]))
`,
        hints: [
          '`from abc import ABC, abstractmethod`, then `class Shape(ABC):` with `@abstractmethod` above `def area(self): ...` and `def perimeter(self): ...`.',
          '`describe` is an ordinary method in `Shape`: `f"{type(self).__name__} with area {self.area():.2f}"`. It calls whichever `area()` the subclass has.',
          'For the protocol: `from typing import Protocol, runtime_checkable`, then `@runtime_checkable` above `class HasArea(Protocol):` with `def area(self) -> float: ...`. In `total_area`, test each item with `isinstance(item, HasArea)` and raise `TypeError` when it fails.'
        ],
        checks: [
          { label: '`Shape()` raises `TypeError`: it is abstract', code: 'try:\n    Shape()\nexcept TypeError:\n    pass\nelse:\n    raise AssertionError("Shape() should fail: inherit from ABC and mark the methods @abstractmethod")' },
          { label: 'A subclass without `perimeter()` cannot be created', code: 'class Half(Shape):\n    def area(self):\n        return 1\ntry:\n    Half()\nexcept TypeError:\n    pass\nelse:\n    raise AssertionError("a subclass missing perimeter() should not be instantiable")' },
          { label: '`Rectangle(3, 4)`: area 12, perimeter 14', code: 'r = Rectangle(3, 4)\nassert r.area() == 12 and r.perimeter() == 14' },
          { label: '`Circle(1)`: area π, perimeter 2π', code: 'import math\nc = Circle(1)\nassert approx(c.area(), math.pi) and approx(c.perimeter(), 2 * math.pi)' },
          { label: '`describe()` is written once, in `Shape`', code: 'assert Rectangle(3, 4).describe() == "Rectangle with area 12.00"\nassert Circle(1).describe() == "Circle with area 3.14"\nassert "describe" not in vars(Rectangle)' },
          { label: '`HasArea` is a runtime-checkable Protocol: any class with `area()` matches', code: 'class Plain:\n    def area(self):\n        return 2\nassert isinstance(Plain(), HasArea) and not isinstance("x", HasArea)\nassert approx(total_area([Rectangle(1, 2), Plain()]), 4)' },
          { label: '`total_area` refuses an item without `area()`', code: 'try:\n    total_area([Rectangle(1, 1), "not a shape"])\nexcept TypeError:\n    pass\nelse:\n    raise AssertionError("an item without area() should raise TypeError")' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 8 */
    {
      id: 'py-dataclasses-enums', track: 'objects',
      title: 'Dataclasses and enums: Python\'s records and enums',
      summary: '@dataclass writes __init__, __repr__ and __eq__ from typed fields, like a Java record or Lombok; frozen dataclasses are immutable and hashable. Enum gives named constants, like a Java enum.',
      keywords: ['dataclass', '@dataclass', 'record', 'lombok', '@data', 'field', 'default_factory', 'frozen', 'immutable', 'replace', 'asdict', '__post_init__', 'enum', 'auto', 'strenum', 'intenum', 'namedtuple'],
      docs: 'https://docs.python.org/3/library/dataclasses.html',
      body: [
        '## @dataclass: the boilerplate written for you',
        'Write the fields with type hints, and `@dataclass` generates `__init__`, `__repr__` and `__eq__`:',
        py('from dataclasses import dataclass',
           '',
           '@dataclass',
           'class Book:',
           '    title: str',
           '    author: str',
           '    pages: int = 0                 # a default: fields with defaults go last',
           '',
           'b = Book("Dune", "Herbert", 412)',
           'print(b)',
           'print(b == Book("Dune", "Herbert", 412), b.pages)'),
        'The type hints are required (they say what is a field), but as everywhere in Python, they are not checked when the program runs: `Book("Dune", "Herbert", "many")` is accepted.',
        '## Mutable defaults: field(default_factory=...)',
        'A list default would be shared by every object (the trap from [[lesson:py-mutable-defaults]]), so dataclasses refuse it. Give a factory that makes a new one each time:',
        py('from dataclasses import dataclass, field',
           '',
           '@dataclass',
           'class Playlist:',
           '    name: str',
           '    songs: list[str] = field(default_factory=list)',
           '',
           'a, b = Playlist("a"), Playlist("b")',
           'a.songs.append("Intro")',
           'print(a, b)'),
        '## frozen=True: a record',
        '`frozen=True` makes the fields read-only after `__init__` and adds a `__hash__`, so the objects work as dict keys and set items: a Java `record`. `dataclasses.replace` makes a changed copy:',
        py('from dataclasses import dataclass, replace, FrozenInstanceError',
           '',
           '@dataclass(frozen=True)',
           'class Point:',
           '    x: int',
           '    y: int',
           '',
           'p = Point(1, 2)',
           'try:',
           '    p.x = 5',
           'except FrozenInstanceError as e:',
           '    print("FrozenInstanceError:", e)',
           'moved = replace(p, x=5)',
           'print(p, moved, {p: "start"}[Point(1, 2)])'),
        '## Checking values: __post_init__',
        py('from dataclasses import dataclass',
           '',
           '@dataclass',
           'class Order:',
           '    item: str',
           '    qty: int',
           '',
           '    def __post_init__(self):                 # runs after the generated __init__',
           '        if self.qty <= 0:',
           '            raise ValueError(f"qty must be positive, got {self.qty}")',
           '',
           'try:',
           '    Order("pen", 0)',
           'except ValueError as e:',
           '    print("ValueError:", e)'),
        'Also useful: `order=True` adds `<` and friends (comparing the fields in order), `asdict(obj)` gives a dict (handy for JSON), and `slots=True` saves memory.',
        '## Enums',
        'An `Enum` is a fixed set of named values, each one object. Members have a `name` and a `value`; iterate the class to get them all, and look one up by value or by name:',
        py('from enum import Enum',
           '',
           'class Status(Enum):',
           '    TODO = "todo"',
           '    DOING = "doing"',
           '    DONE = "done"',
           '',
           's = Status.DOING',
           'print(s, s.name, s.value)',
           'print(Status("done"), Status["TODO"], [m.value for m in Status])',
           'print(s is Status.DOING, s == "doing")          # compare members, not strings'),
        '`auto()` numbers the values when they do not matter. `StrEnum` and `IntEnum` members also **are** strings or ints, so they equal their values; handy for JSON and databases. Enums can have methods and properties, as in Java:',
        py('from enum import Enum, auto',
           '',
           'class Size(Enum):',
           '    SMALL = auto()',
           '    MEDIUM = auto()',
           '    LARGE = auto()',
           '',
           '    def bigger(self):',
           '        members = list(Size)',
           '        return members[min(members.index(self) + 1, len(members) - 1)]',
           '',
           'print(Size.SMALL.value, Size.SMALL.bigger(), Size.LARGE.bigger())'),
        '| Java | Python |\n|---|---|\n| `record Point(int x, int y)` | `@dataclass(frozen=True)` with fields `x: int` and `y: int` |\n| Lombok `@Data` | `@dataclass` |\n| a record\'s compact constructor | `__post_init__` |\n| a hand-written `withX(5)` | `dataclasses.replace(p, x=5)` |\n| `enum Status { TODO, DONE }` | `class Status(Enum):` with `TODO = "todo"`… |\n| `Status.valueOf("TODO")` | `Status["TODO"]` (by name) or `Status("todo")` (by value) |\n| `Status.values()` | `list(Status)` |\n| `status.ordinal()` | none: use `auto()` values, or `list(Status).index(s)` |'
      ].join('\n\n'),
      java: '`@dataclass` is Lombok\'s `@Data` built into the language, and `@dataclass(frozen=True)` is a `record`: a generated constructor, `toString`, `equals`, and (when frozen) `hashCode`. Python enums work like Java enums: one object per member, with a name and a value, iterable, allowed to have methods. One difference: a Python enum member does not equal its value (`Status.DONE != "done"`) unless the enum is a `StrEnum` or `IntEnum`. `typing.NamedTuple` is a third, older record type: a tuple with named fields.',
      example: {
        code: String.raw`from dataclasses import dataclass, field, asdict, replace
from enum import Enum


class Priority(Enum):
    LOW = 1
    HIGH = 2


@dataclass(frozen=True)
class Task:
    title: str
    priority: Priority = Priority.LOW
    tags: tuple[str, ...] = ()


@dataclass
class Sprint:
    name: str
    tasks: list[Task] = field(default_factory=list)

    def urgent(self):
        return [t.title for t in self.tasks if t.priority is Priority.HIGH]


s = Sprint("Sprint 7")
s.tasks.append(Task("Fix login", Priority.HIGH, ("auth",)))
s.tasks.append(Task("Write docs"))
s.tasks.append(replace(s.tasks[1], title="Review docs"))
print(s.urgent())
print(s.tasks[0])
print(asdict(s)["tasks"][2])
print(len({Task("A"), Task("A"), Task("B")}))       # frozen: hashable
`,
        note: 'Press **Visualize** to see `replace` build a new `Task` while the old one stays as it was.'
      },
      challenge: {
        title: 'A task board',
        task: [
          '1. `Status` is an `Enum` with members `TODO`, `DOING` and `DONE`, whose values are `"todo"`, `"doing"` and `"done"`.',
          '2. `Task` is a frozen dataclass with `title` (a string) and `status` (default `Status.TODO`): it prints as `Task(title=\'x\', status=<Status.TODO: \'todo\'>)`, compares by value, and cannot be changed.',
          '3. `advance(task)` returns a **new** task one status further (TODO, then DOING, then DONE; DONE stays DONE), made with `dataclasses.replace`.',
          '4. `Board` is a dataclass with a `name` and a list of `tasks` that starts empty: a new list for every board.',
          '5. `board.titles(status)` returns the titles of the tasks with that status, in order.'
        ].join('\n\n'),
        starter: String.raw`class Task:
    def __init__(self, title, status="todo"):
        self.title = title
        self.status = status


class Board:
    def __init__(self, name, tasks=None):
        self.name = name
        self.tasks = tasks or []


board = Board("Sprint 1")
board.tasks.append(Task("Write tests"))
print(board.tasks[0].title, board.tasks[0].status)
`,
        solution: String.raw`from dataclasses import dataclass, field, replace
from enum import Enum


class Status(Enum):
    TODO = "todo"
    DOING = "doing"
    DONE = "done"


@dataclass(frozen=True)
class Task:
    title: str
    status: Status = Status.TODO


def advance(task):
    order = list(Status)
    position = min(order.index(task.status) + 1, len(order) - 1)
    return replace(task, status=order[position])


@dataclass
class Board:
    name: str
    tasks: list[Task] = field(default_factory=list)

    def titles(self, status):
        return [t.title for t in self.tasks if t.status is status]


board = Board("Sprint 1")
board.tasks.append(Task("Write tests"))
board.tasks.append(advance(Task("Fix login")))
print(board.titles(Status.TODO), board.titles(Status.DOING))
`,
        hints: [
          '`class Status(Enum):` with `TODO = "todo"` and so on. `list(Status)` gives the members in order.',
          '`@dataclass(frozen=True)` above `class Task:` with the fields `title: str` and `status: Status = Status.TODO`.',
          '`advance`: find the position with `list(Status).index(task.status)`, move one on (but not past the end), and `return replace(task, status=...)`.',
          '`Board` needs `tasks: list[Task] = field(default_factory=list)`, so every board gets a new list.'
        ],
        checks: [
          { label: '`Status` is an Enum with the values todo, doing, done', code: 'import enum\nassert issubclass(Status, enum.Enum)\nassert [s.value for s in Status] == ["todo", "doing", "done"]\nassert Status("doing") is Status.DOING' },
          { label: '`Task` is a dataclass that prints and compares by value', code: String.raw`assert repr(Task("x")) == "Task(title='x', status=<Status.TODO: 'todo'>)", repr(Task("x"))
assert Task("x") == Task("x", Status.TODO) and Task("x") != Task("y")` },
          { label: '`Task` is frozen: changing it raises an error, and it is hashable', code: 'import dataclasses\nt = Task("x")\ntry:\n    t.title = "y"\nexcept dataclasses.FrozenInstanceError:\n    pass\nelse:\n    raise AssertionError("use @dataclass(frozen=True)")\nassert len({Task("x"), Task("x")}) == 1' },
          { label: '`advance` returns a new task one status further', code: 't = Task("x")\nt2 = advance(t)\nassert t2 == Task("x", Status.DOING) and t.status is Status.TODO\nassert advance(t2).status is Status.DONE\nassert advance(advance(t2)).status is Status.DONE' },
          { label: 'Each board gets its own list of tasks', code: String.raw`a, b = Board("a"), Board("b")
a.tasks.append(Task("x"))
assert b.tasks == [], "use field(default_factory=list)"
assert repr(Board("z")) == "Board(name='z', tasks=[])"` },
          { label: '`titles(status)` lists the matching titles in order', code: 'b = Board("s")\nb.tasks += [Task("a"), Task("b", Status.DONE), Task("c")]\nassert b.titles(Status.TODO) == ["a", "c"] and b.titles(Status.DONE) == ["b"]' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 9 */
    {
      id: 'py-classmethods', track: 'objects',
      title: 'classmethod and staticmethod',
      summary: 'Methods that belong to the class: @classmethod for alternative constructors that also work for subclasses, @staticmethod for helpers, and why many Java static methods become plain functions.',
      keywords: ['classmethod', 'staticmethod', 'static', 'factory', 'alternative constructor', 'cls', 'from_string', 'class method', 'static method', 'utility class', 'overloading'],
      docs: 'https://docs.python.org/3/library/functions.html#classmethod',
      body: [
        'Java\'s `static` does two jobs, and Python has a decorator for each, plus a third option Java lacks: a plain function in the module.',
        '| Kind | Receives | Typical use |\n|---|---|---|\n| a normal method | the object, `self` | anything that works on one object |\n| `@classmethod` | the class, `cls` | alternative constructors, class-wide counters |\n| `@staticmethod` | nothing | a helper that belongs with the class |\n| a module function | nothing | the default for code that needs no class at all |',
        '## @classmethod: alternative constructors',
        'Python has one `__init__` and no overloading. Other ways to make an object are class methods, by convention named `from_...`. They receive the class as `cls` and call it:',
        py('class Person:',
           '    def __init__(self, name, born):',
           '        self.name = name',
           '        self.born = born',
           '',
           '    @classmethod',
           '    def from_text(cls, text):              # "Asha,1994"',
           '        name, year = text.split(",")',
           '        return cls(name, int(year))',
           '',
           'p = Person.from_text("Asha,1994")',
           'print(p.name, p.born, type(p).__name__)'),
        'The standard library is full of them: `dict.fromkeys`, `datetime.fromisoformat`, `int.from_bytes`.',
        '## Why cls, not the class name',
        'Because `cls` is whatever class the method was called on, an alternative constructor also builds **subclasses**. A Java static factory that says `new Person(...)` cannot:',
        py('class Person:',
           '    def __init__(self, name):',
           '        self.name = name',
           '',
           '    @classmethod',
           '    def from_upper(cls, text):',
           '        return cls(text.title())',
           '',
           'class Student(Person):',
           '    pass',
           '',
           's = Student.from_upper("RAVI")',
           'print(type(s).__name__, s.name)            # a Student, made by Person\'s method'),
        '## @staticmethod: a helper in the class',
        'A static method gets neither the object nor the class. Use it for a helper that is about the class but needs none of its data:',
        py('class Password:',
           '    def __init__(self, text):',
           '        if not Password.is_strong(text):',
           '            raise ValueError("too weak")',
           '        self.text = text',
           '',
           '    @staticmethod',
           '    def is_strong(text):',
           '        return len(text) >= 8 and any(c.isdigit() for c in text)',
           '',
           'print(Password.is_strong("hunter2"), Password.is_strong("correct-horse-9"))'),
        '## Often, just a function',
        'Java puts every function in a class, so utility classes full of static methods are normal (`Math`, `Collections`, `StringUtils`). In Python a module is already a namespace: `math.sqrt` is a plain function in the `math` module. Write a module-level function unless the code clearly belongs with one class.',
        '## Class attributes through cls',
        py('class Ticket:',
           '    issued = 0',
           '',
           '    def __init__(self):',
           '        Ticket.issued += 1',
           '',
           '    @classmethod',
           '    def count(cls):',
           '        return cls.issued',
           '',
           'Ticket()',
           'Ticket()',
           'print(Ticket.count())')
      ].join('\n\n'),
      java: 'A Java `static` method becomes either a `@classmethod`, when it builds objects or uses class-wide state (it gets `cls`, so it works correctly for subclasses), or a `@staticmethod`, for a plain helper. Very often the Python answer is neither: a module-level function, because a module is already a namespace. Constructor overloading becomes one `__init__` with default values, plus named `@classmethod` factories such as `from_text`.',
      example: {
        code: String.raw`from datetime import date


class Invoice:
    VAT = 0.18
    created = 0

    def __init__(self, number, amount, issued):
        self.number = number
        self.amount = amount
        self.issued = issued
        Invoice.created += 1

    @classmethod
    def from_csv(cls, line):                   # "INV-7,1200,2026-10-10"
        number, amount, issued = line.split(",")
        return cls(number, float(amount), date.fromisoformat(issued))

    @staticmethod
    def with_vat(amount):
        return round(amount * (1 + Invoice.VAT), 2)

    def total(self):
        return self.with_vat(self.amount)


class CreditNote(Invoice):
    def total(self):
        return -super().total()


rows = ["INV-7,1200,2026-10-10", "INV-8,99.5,2026-10-11"]
invoices = [Invoice.from_csv(r) for r in rows]
refund = CreditNote.from_csv("CN-1,100,2026-10-12")
for doc in invoices + [refund]:
    print(type(doc).__name__, doc.number, doc.issued, doc.total())
print("created:", Invoice.created)
`,
        note: '`CreditNote.from_csv` returns a `CreditNote`, because `from_csv` builds `cls(...)`.'
      },
      challenge: {
        title: 'Colors from hex codes',
        task: [
          '1. `Color(r, g, b)` is given (a dataclass). Add a class method `Color.from_hex("#ff8800")` that returns `Color(255, 136, 0)`; the `#` is optional.',
          '2. Add a class method `Color.from_name(name)` that looks the name up in the class attribute `NAMES` (name to hex code); an unknown name raises `ValueError`.',
          '3. Both must build the class they are called on: `AlphaColor.from_hex(...)` returns an `AlphaColor`.',
          '4. Add a static method `Color.clamp(value)` that keeps a number between 0 and 255.'
        ].join('\n\n'),
        starter: String.raw`from dataclasses import dataclass


@dataclass
class Color:
    r: int
    g: int
    b: int

    NAMES = {"red": "#ff0000", "green": "#00ff00", "white": "#ffffff"}


class AlphaColor(Color):
    pass


def color_from_hex(text):          # a Java habit: a factory outside the class
    text = text.lstrip("#")
    return Color(int(text[0:2], 16), int(text[2:4], 16), int(text[4:6], 16))


print(color_from_hex("#ff8800"))
`,
        solution: String.raw`from dataclasses import dataclass


@dataclass
class Color:
    r: int
    g: int
    b: int

    NAMES = {"red": "#ff0000", "green": "#00ff00", "white": "#ffffff"}

    @classmethod
    def from_hex(cls, text):
        text = text.lstrip("#")
        return cls(int(text[0:2], 16), int(text[2:4], 16), int(text[4:6], 16))

    @classmethod
    def from_name(cls, name):
        if name not in cls.NAMES:
            raise ValueError(f"unknown color: {name}")
        return cls.from_hex(cls.NAMES[name])

    @staticmethod
    def clamp(value):
        return max(0, min(255, value))


class AlphaColor(Color):
    pass


print(Color.from_hex("#ff8800"), AlphaColor.from_name("white"), Color.clamp(300))
`,
        hints: [
          'Move the factory into the class as `@classmethod def from_hex(cls, text):` and end it with `return cls(...)`, not `Color(...)`.',
          '`from_name` can reuse `from_hex`: `return cls.from_hex(cls.NAMES[name])`, after checking `if name not in cls.NAMES: raise ValueError(...)`.',
          '`@staticmethod def clamp(value): return max(0, min(255, value))`: no `self`, no `cls`.'
        ],
        checks: [
          { label: '`Color.from_hex("#ff8800")` is `Color(255, 136, 0)`', code: 'assert Color.from_hex("#ff8800") == Color(255, 136, 0)\nassert Color.from_hex("00ff00") == Color(0, 255, 0)' },
          { label: '`from_hex` is a class method', code: 'assert isinstance(vars(Color).get("from_hex"), classmethod), "put @classmethod above def from_hex(cls, text)"' },
          { label: 'Called on a subclass, it builds the subclass', code: 'c = AlphaColor.from_hex("#000000")\nassert type(c) is AlphaColor, f"got a {type(c).__name__}: build cls(...), not Color(...)"' },
          { label: '`from_name` looks the name up in `NAMES`', code: 'assert Color.from_name("red") == Color(255, 0, 0)\nassert type(AlphaColor.from_name("white")) is AlphaColor' },
          { label: 'An unknown name raises `ValueError`', code: 'try:\n    Color.from_name("mauve")\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("an unknown name should raise ValueError")' },
          { label: '`clamp` is a static method keeping 0 to 255', code: 'assert isinstance(vars(Color).get("clamp"), staticmethod)\nassert (Color.clamp(300), Color.clamp(-5), Color.clamp(128)) == (255, 0, 128)' }
        ]
      }
    }
  );
})(window.PYLT);
