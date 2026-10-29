/*
 * Quizzes for track 4 (Objects and classes). The question shape is described at the top of
 * data/quizzes-basics.js.
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};
  function py() { return '```python\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q['py-classes'] = [
    {
      q: 'What does `self` refer to inside a method?',
      choices: ['The object the method was called on', 'The class itself', 'The module the class is in'],
      answer: 0,
      why: '`acc.deposit(50)` is short for `Account.deposit(acc, 50)`: Python passes the object as the first argument, named `self` by convention. Java passes it invisibly as `this`.'
    },
    {
      q: 'What does this print?\n\n' + py('class Team:', '    members = []', '', 'a, b = Team(), Team()', 'a.members.append("Asha")', 'print(len(b.members))'),
      choices: ['`1`', '`0`', 'An error'],
      answer: 0,
      why: '`members = []` in the class body is a class attribute: **one** list shared by every team, like a `static` field. Give each object its own list in `__init__`: `self.members = []`.'
    },
    {
      q: 'How do you mark an attribute as internal, the way Java uses `private`?',
      choices: ['Start its name with an underscore: `self._balance`', 'Write `private self.balance`', 'List it in `__private__`'],
      answer: 0,
      why: 'Python has no access modifiers. A leading underscore is a convention everyone respects: "internal, do not use from outside". Two underscores also make Python rename the attribute, which prevents clashes in subclasses, not access.'
    },
    {
      q: 'How do you create an object of the class `Point`?',
      choices: ['`Point(1, 2)`', '`new Point(1, 2)`', '`Point.new(1, 2)`'],
      answer: 0,
      why: 'Calling the class makes the object and runs `__init__` on it. Python has no `new` keyword.'
    }
  ];

  Q['py-references'] = [
    {
      q: 'What does this print?\n\n' + py('a = [1, 2]', 'b = a', 'b.append(3)', 'print(a)'),
      choices: ['`[1, 2, 3]`', '`[1, 2]`', 'An error'],
      answer: 0,
      why: '`b = a` copies nothing: both names point at one list, so a change made through `b` shows through `a`. Java object references behave the same way.'
    },
    {
      q: 'Which Python comparison means Java\'s `a.equals(b)`?',
      choices: ['`a == b`', '`a is b`', '`a.equals(b)`'],
      answer: 0,
      why: '`==` calls `__eq__` and compares values. `is` compares identity, which is what Java\'s `==` does for objects.'
    },
    {
      q: 'What does this print?\n\n' + py('board = [["."] * 2] * 2', 'board[0][0] = "X"', 'print(board)'),
      choices: ["`[['X', '.'], ['X', '.']]`", "`[['X', '.'], ['.', '.']]`", 'An error'],
      answer: 0,
      why: '`* 2` repeats the **reference** to one inner list, so both rows are the same list. Build each row on its own: `[["."] * 2 for _ in range(2)]`.'
    },
    {
      q: 'After `copied = items.copy()`, what do `items` and `copied` still share?',
      choices: ['The objects inside the list', 'Nothing at all', 'The list itself'],
      answer: 0,
      why: '`copy()` is a **shallow** copy: a new outer list holding the same items. A list inside is shared; `copy.deepcopy` copies those too.'
    }
  ];

  Q['py-equality'] = [
    {
      q: 'A class defines `__eq__` but not `__hash__`. What happens when you put one of its objects in a set?',
      choices: ['`TypeError: unhashable type`', 'It works, using the identity hash', 'It works, comparing with `__eq__` only'],
      answer: 0,
      why: 'Defining `__eq__` sets `__hash__` to `None`, so the objects cannot be dict keys or set items until you write a `__hash__` that agrees with `__eq__`. Python enforces Java\'s "override hashCode with equals" rule.'
    },
    {
      q: 'Which method does `print(obj)` use?',
      choices: ['`__str__`, or `__repr__` when there is no `__str__`', '`__repr__` only', '`toString`'],
      answer: 0,
      why: '`print` and `str()` use `__str__`, and fall back to `__repr__`. A list shows its items with `__repr__`.'
    },
    {
      q: 'What should `__eq__` return for an object of a type it does not handle?',
      choices: ['`NotImplemented`', '`False`', 'It should raise `TypeError`'],
      answer: 0,
      why: '`NotImplemented` lets Python ask the other operand\'s `__eq__`; when neither knows, `==` falls back to identity and gives `False`. Returning `False` yourself would stop the other side from answering.'
    },
    {
      q: 'Which fields should `__hash__` use?',
      choices: ['The same fields `__eq__` compares, ones that never change', 'Every attribute, lists included', 'The object\'s `id()`'],
      answer: 0,
      why: 'Equal objects must have equal hashes, so hash what `__eq__` compares. And if a hashed field changes while the object is in a dict or set, the object is lost there.'
    }
  ];

  Q['py-special-methods'] = [
    {
      q: 'What does `len(obj)` call?',
      choices: ['`obj.__len__()`', '`obj.length()`', '`obj.size()`'],
      answer: 0,
      why: 'Built-in functions and operators call special methods. Define `__len__` and `len()` works on your objects, and so does `if obj:` when there is no `__bool__`.'
    },
    {
      q: '`3 * v`, where `v` is your `Vector`: `int.__mul__` returns `NotImplemented`. What does Python try next?',
      choices: ['`v.__rmul__(3)`', '`v.__mul__(3)`', 'Nothing: it raises `TypeError` at once'],
      answer: 0,
      why: 'Python tries the **reflected** method of the right operand, `v.__rmul__(3)`. Only when that also returns `NotImplemented` does it raise `TypeError`.'
    },
    {
      q: 'Which two methods does `@functools.total_ordering` need to fill in `<=`, `>` and `>=`?',
      choices: ['`__eq__` and `__lt__`', '`__cmp__` and `__eq__`', '`__lt__` and `__gt__`'],
      answer: 0,
      why: 'Give it equality and one ordering, usually `__lt__`, and it derives the other three. `sorted()`, `min()` and `max()` need only `<`.'
    },
    {
      q: 'A class defines `__len__` but no `__bool__`. When is one of its objects falsy?',
      choices: ['When its length is 0', 'Never', 'When it has no attributes'],
      answer: 0,
      why: 'Without `__bool__`, Python uses `__len__`: a length of 0 is falsy, like an empty list.'
    }
  ];

  Q['py-properties'] = [
    {
      q: 'How is a property read?',
      choices: ['Like an attribute: `c.area`', 'Like a method: `c.area()`', 'Only through `getattr`'],
      answer: 0,
      why: '`@property` makes a method that runs when the attribute is read. Callers cannot tell it from a plain attribute, which is the point.'
    },
    {
      q: 'A property has a getter but no setter. What does `c.area = 5` do?',
      choices: ['Raises `AttributeError`', 'Creates an ordinary attribute named `area`', 'Calls the getter'],
      answer: 0,
      why: 'A property without a setter is read-only: assigning to it raises `AttributeError`.'
    },
    {
      q: 'Why do Python classes usually start with plain public attributes instead of getters and setters?',
      choices: ['A property can replace the attribute later without changing any caller', 'Python cannot have methods named `get_x`', 'Attributes are faster than methods'],
      answer: 0,
      why: 'Changing `self.radius` into a property named `radius` keeps every `c.radius` working. Java needs getters from the start because changing a field into a method would break callers.'
    },
    {
      q: 'Where does a property with a setter usually keep its value?',
      choices: ['In an underscore attribute, such as `self._radius`', 'In an attribute with the same name, `self.radius`', 'In a class attribute'],
      answer: 0,
      why: 'Assigning `self.radius` inside the `radius` setter would call the setter again, forever. The underscore attribute is the storage behind the property.'
    }
  ];

  Q['py-inheritance'] = [
    {
      q: 'How does a subclass\'s `__init__` let the parent set its attributes?',
      choices: ['`super().__init__(name, salary)`', '`Employee(name, salary)`', 'Nothing is needed: it happens automatically'],
      answer: 0,
      why: '`super().__init__(...)` runs the parent\'s `__init__` on the same object. Write your own `__init__` without it and the parent\'s attributes are never set. (A subclass with no `__init__` at all inherits the parent\'s.)'
    },
    {
      q: 'What does this print?\n\n' + py('class A:', '    def who(self):', '        return "A"', '', 'class B(A):', '    pass', '', 'class C(A):', '    def who(self):', '        return "C"', '', 'class D(B, C):', '    pass', '', 'print(D().who())'),
      choices: ['`C`', '`A`', 'An error'],
      answer: 0,
      why: 'The MRO is D, B, C, A. `B` has no `who`, so `C` is searched next, before `A`: a class always comes after every class that inherits from it.'
    },
    {
      q: 'Which is the usual test for "is this a Dog, or a kind of Dog"?',
      choices: ['`isinstance(x, Dog)`', '`type(x) is Dog`', '`x.__class__.__name__ == "Dog"`'],
      answer: 0,
      why: '`isinstance` respects inheritance; `type(x) is Dog` is false for a subclass of `Dog`.'
    },
    {
      q: 'What is a mixin?',
      choices: ['A small class that adds one ability, combined with others through multiple inheritance', 'A class that cannot be instantiated', 'A function that merges two objects'],
      answer: 0,
      why: 'A mixin such as `JsonMixin` adds methods and keeps no state of its own, much like a Java interface with default methods.'
    }
  ];

  Q['py-abc-protocols'] = [
    {
      q: 'When does an abstract base class report a missing abstract method?',
      choices: ['When an object is created', 'When the missing method is called', 'When the module is imported'],
      answer: 0,
      why: 'Instantiating a class that still has abstract methods raises `TypeError` at once, so an incomplete subclass is caught early.'
    },
    {
      q: 'A class has an `area()` method but never mentions `HasArea`, a runtime-checkable Protocol with `area()`. What is `isinstance(obj, HasArea)`?',
      choices: ['`True`', '`False`', 'An error'],
      answer: 0,
      why: 'A Protocol is structural: having the methods is enough, no inheritance needed. It is duck typing, written down.'
    },
    {
      q: 'What is duck typing?',
      choices: ['Using any object that has the methods you call, without checking its type', 'Checking types with `type(x) is`', 'Python\'s word for an interface'],
      answer: 0,
      why: '"If it walks like a duck and quacks like a duck…": the code calls the method and any object that has it works.'
    },
    {
      q: 'Which is closest to a Java interface with only abstract methods?',
      choices: ['A class inheriting from `ABC` with every method marked `@abstractmethod`', 'A dataclass', 'A module'],
      answer: 0,
      why: 'An ABC whose methods are all abstract is a pure interface; add normal methods and it is an abstract class.'
    }
  ];

  Q['py-dataclasses-enums'] = [
    {
      q: 'What does `@dataclass` write for you?',
      choices: ['`__init__`, `__repr__` and `__eq__`', 'Only `__init__`', 'Getters and setters'],
      answer: 0,
      why: 'It reads the typed fields and generates the constructor, the text form and value equality: Lombok\'s `@Data`, built in.'
    },
    {
      q: 'Why is `tags: list = []` refused in a dataclass?',
      choices: ['One list would be shared by every object; use `field(default_factory=list)`', 'Lists cannot be fields', 'Fields cannot have defaults'],
      answer: 0,
      why: 'A default is made once, so every object would share it: the mutable-default trap. `default_factory` makes a new list for each object.'
    },
    {
      q: 'Which dataclass is like a Java `record`?',
      choices: ['`@dataclass(frozen=True)`', '`@dataclass(order=True)`', '`@dataclass(slots=True)`'],
      answer: 0,
      why: '`frozen=True` makes the fields read-only after `__init__` and adds `__hash__`, so the objects are immutable and can be dict keys.'
    },
    {
      q: 'With `class Status(Enum): DONE = "done"`, what is `Status.DONE == "done"`?',
      choices: ['`False`', '`True`', 'An error'],
      answer: 0,
      why: 'An enum member is not its value. Compare members (`status is Status.DONE`), or turn the text into a member with `Status("done")`. A `StrEnum` member would equal the string.'
    }
  ];

  Q['py-classmethods'] = [
    {
      q: 'What does a `@classmethod` receive as its first argument?',
      choices: ['The class it was called on (`cls`)', 'The object (`self`)', 'Nothing'],
      answer: 0,
      why: 'A class method gets the class, which may be a subclass. That is what makes `return cls(...)` build the right type.'
    },
    {
      q: '`Student` inherits `Person.from_text`, a class method ending in `return cls(...)`. What does `Student.from_text(...)` return?',
      choices: ['A `Student`', 'A `Person`', 'An error'],
      answer: 0,
      why: '`cls` is `Student` when the method is called on `Student`, so it builds one. A Java static factory that says `new Person(...)` cannot do this.'
    },
    {
      q: 'Where does a utility function that needs no object and no class usually live in Python?',
      choices: ['In a module, as a plain function', 'In a utility class, as a `@staticmethod`', 'In a `@classmethod`'],
      answer: 0,
      why: 'A module is already a namespace (`math.sqrt`), so a plain function is the default. `@staticmethod` is for a helper that clearly belongs with one class.'
    },
    {
      q: 'Python has no constructor overloading. What replaces two Java constructors `Point()` and `Point(int x, int y)`?',
      choices: ['One `__init__` with default values, plus `@classmethod` factories for other kinds of input', 'Two `__init__` methods', 'A `@staticmethod` named `__init__`'],
      answer: 0,
      why: '`def __init__(self, x=0, y=0)` covers both calls, and a factory such as `Point.from_string("3,4")` covers other inputs.'
    }
  ];
})(window.PYLT);
