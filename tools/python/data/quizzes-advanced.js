/*
 * Quizzes for track 7 (Advanced Python). The question shape is described at the top of
 * data/quizzes-basics.js.
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};
  function py() { return '```python\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q['py-match'] = [
    {
      q: 'What does this print?\n\n' + py('def f(x):', '    match x:', '        case [a, b]:', '            return "two"', '        case [a, *rest]:', '            return "many"', '        case _:', '            return "other"', '', 'print(f([1]), f("ab"))'),
      choices: ['`many other`', '`other two`', '`many two`'],
      answer: 0,
      why: '`[1]` has one item: not two, but `[a, *rest]` fits with `rest` empty. A string never matches a sequence pattern, so `"ab"` falls through to `case _`.'
    },
    {
      q: '`RED = "red"` is a constant. What does `case RED:`, as the only case, do?',
      choices: ['It matches any value and binds it to a new name `RED`', 'It compares the value with the constant `"red"`', 'It is a syntax error'],
      answer: 0,
      why: 'A bare name in a pattern captures. To compare with a constant, use a dotted name (`Color.RED`) or the literal itself.'
    },
    {
      q: 'No case matches, and there is no `case _`. What happens?',
      choices: ['Nothing: no case runs, and the program carries on', 'A `MatchError` is raised', 'The first case runs'],
      answer: 0,
      why: 'Unlike a Java `switch` over a sealed type, Python never requires the cases to cover every value.'
    },
    {
      q: 'Does `case {"type": "click", "x": x}:` match `{"type": "click", "x": 1, "y": 2}`?',
      choices: ['Yes: a mapping pattern ignores the keys it does not name', 'No: the dict must have exactly those keys', 'Only if the pattern ends with `**rest`'],
      answer: 0,
      why: 'Mapping patterns check only the keys they mention, which suits JSON with optional fields. `**rest` would collect the other keys if you wanted them.'
    }
  ];

  Q['py-walrus-slots'] = [
    {
      q: 'What does this print?\n\n' + py('print([y for x in [1, 2, 3] if (y := x * 10) > 15])'),
      choices: ['`[20, 30]`', '`[2, 3]`', '`[True, True]`'],
      answer: 0,
      why: '`(y := x * 10)` computes the value once, tests it, and keeps it as `y` for the front of the comprehension.'
    },
    {
      q: 'Which line is a syntax error?',
      choices: ['`x := 5` on a line of its own', '`if (n := len(items)) > 3: print(n)`', '`while (line := f.readline()): print(line)`'],
      answer: 0,
      why: '`:=` belongs inside an expression; as a whole statement Python wants plain `=`.'
    },
    {
      q: 'A class has `__slots__ = ("x", "y")`. What does `p.z = 1` do?',
      choices: ['It raises `AttributeError`', 'It adds `z` to `p.__dict__`', 'It adds `z` to the slots'],
      answer: 0,
      why: 'With slots, objects have no `__dict__`, only the listed attributes. A misspelt attribute fails loudly, as a Java field would.'
    },
    {
      q: 'What is the main reason to give a class `__slots__`?',
      choices: ['Many small objects: each takes less memory, and a misspelt attribute raises', 'It makes the objects immutable', 'It lets the methods run in parallel'],
      answer: 0,
      why: 'Slots save the per-object dict. They do not freeze anything: `p.x = 5` still works. For immutability, use `@dataclass(frozen=True)`.'
    }
  ];

  Q['py-descriptors'] = [
    {
      q: 'Which methods make a class attribute a **data** descriptor, which wins over the object\'s own `__dict__`?',
      choices: ['`__get__` and `__set__`', '`__get__` only', '`__getattr__`'],
      answer: 0,
      why: 'A descriptor with `__set__` (or `__delete__`) comes first in the lookup. One with only `__get__`, such as a method, is overridden by a value in the object\'s `__dict__`.'
    },
    {
      q: 'In `__get__(self, obj, objtype)`, what is `obj` when the attribute is read on the class, as in `Order.quantity`?',
      choices: ['`None`', 'The class `Order`', 'The descriptor itself'],
      answer: 0,
      why: 'There is no object, so `obj` is `None` (the class arrives as `objtype`). Descriptors usually return themselves then.'
    },
    {
      q: 'Why must a descriptor store each value on the object (`obj.__dict__`) rather than on itself?',
      choices: ['One descriptor is shared by every object of the class', 'A descriptor cannot have attributes', 'It makes reading faster'],
      answer: 0,
      why: 'The descriptor lives on the class. A value stored on it would be one value for all objects: every thermostat would share one target.'
    },
    {
      q: 'Why does calling `g.hello()` pass `g` as `self`?',
      choices: ['Functions are descriptors: looking one up on an object returns a bound method', 'Python copies every method onto every object', 'The compiler adds `self` to every call'],
      answer: 0,
      why: 'The function\'s `__get__` returns a bound method that remembers `g` and passes it as the first argument.'
    }
  ];

  Q['py-metaclasses'] = [
    {
      q: 'For an ordinary `class Dog:`, what is `type(Dog)`?',
      choices: ['`type`', '`Dog`', '`object`'],
      answer: 0,
      why: 'A class is an object, and its class, its metaclass, is `type`. (`object` is the base class, a different thing.)'
    },
    {
      q: 'When does a base class\'s `__init_subclass__` run?',
      choices: ['When a subclass is created, as its `class` statement runs', 'Each time an object of a subclass is created', 'The first time a subclass is used'],
      answer: 0,
      why: 'It runs once per subclass, at definition time: typically while the module is imported.'
    },
    {
      q: 'How does `name="csv"` in `class Csv(Exporter, name="csv"):` reach the base class?',
      choices: ['As the keyword argument `name` of `Exporter.__init_subclass__`', 'As a class attribute `Csv.name`', 'It is ignored'],
      answer: 0,
      why: 'Keyword arguments on a `class` line (other than `metaclass`) are passed to `__init_subclass__`.'
    },
    {
      q: 'You want every subclass of a base class registered automatically. What is the simplest tool?',
      choices: ['`__init_subclass__` on the base class', 'A metaclass', 'A `__new__` method on every subclass'],
      answer: 0,
      why: 'It runs for every subclass without any work in the subclasses. A metaclass also can, but is more machinery than this needs.'
    }
  ];

  Q['py-memory'] = [
    {
      q: 'When does CPython free an object that is not part of a cycle?',
      choices: ['As soon as its reference count reaches zero', 'When the garbage collector next runs, some time later', 'Only when the program ends'],
      answer: 0,
      why: 'Reference counting frees it at once. The `gc` collector exists for the cycles that counting cannot free.'
    },
    {
      q: 'What does `del x` do?',
      choices: ['Removes the name `x`; the object is freed only if nothing else refers to it', 'Frees the object, even if other names use it', 'Sets the object to `None`'],
      answer: 0,
      why: '`del` deletes a reference, never an object directly. Other names, lists or attributes may still hold it.'
    },
    {
      q: 'Two objects refer to each other, and nothing else refers to either. What frees them?',
      choices: ['The cycle collector, the `gc` module', 'Reference counting, at once', 'Nothing: they stay until the program ends'],
      answer: 0,
      why: 'Each keeps the other\'s count at one, so counting cannot free them; the cycle collector finds such unreachable groups.'
    },
    {
      q: 'What does calling a `weakref.ref` give after its object has been freed?',
      choices: ['`None`', 'The object, kept alive by the reference', 'It raises `ReferenceError`'],
      answer: 0,
      why: 'A weak reference does not keep its object alive; once it is gone, calling the reference returns `None`. (A `weakref.proxy` raises `ReferenceError` instead.)'
    }
  ];

  Q['py-threads'] = [
    {
      q: 'Why do threads not speed up a pure-Python loop that only computes?',
      choices: ['The GIL lets only one thread at a time run Python code', 'The operating system runs Python on one core only', 'Starting a thread takes longer than the loop'],
      answer: 0,
      why: 'In the standard CPython the threads take turns. They help when they wait (network, files), because waiting releases the GIL.'
    },
    {
      q: 'Five requests that each wait 0.2 s run in a `ThreadPoolExecutor` with 5 workers. About how long does it take?',
      choices: ['0.2 s', '1.0 s', '0.04 s'],
      answer: 0,
      why: 'The waits overlap, so the total is about the longest single wait.'
    },
    {
      q: 'A task in a pool raised an exception. What does `future.result()` do?',
      choices: ['It raises the same exception', 'It returns `None`', 'It returns the exception object'],
      answer: 0,
      why: 'Like Java\'s `Future.get()` (which wraps it in an `ExecutionException`), the failure surfaces where you ask for the result.'
    },
    {
      q: 'What is Python\'s version of a `synchronized` block?',
      choices: ['`with lock:`, using a `threading.Lock`', 'A built-in `@synchronized` decorator', 'Nothing: the GIL already prevents races'],
      answer: 0,
      why: 'The GIL protects Python\'s internals, not your read-change-write sequences. A lock makes one thread at a time run the block.'
    }
  ];

  Q['py-multiprocessing'] = [
    {
      q: 'Why do processes speed up CPU-heavy work when threads do not?',
      choices: ['Each process is a separate Python with its own GIL', 'Processes share memory faster than threads', 'Processes run at a higher priority'],
      answer: 0,
      why: 'Separate interpreters compute truly in parallel, one per core. The price is that they share no memory.'
    },
    {
      q: 'Why must the code that starts the pool be under `if __name__ == "__main__":`?',
      choices: ['Each worker imports your file, and without the guard would run that code again', 'ProcessPoolExecutor looks for that exact line', 'It makes the workers start faster'],
      answer: 0,
      why: 'On Windows and macOS a worker is a fresh Python that imports the main file to find your functions. The guard keeps the pool code to the original process.'
    },
    {
      q: 'Why does `pool.map(lambda x: x * x, items)` fail in a `ProcessPoolExecutor`?',
      choices: ['Functions are sent to workers by name, and a lambda has none to look up', 'Lambdas are too slow for processes', '`map` only accepts built-in functions'],
      answer: 0,
      why: 'Everything sent to a worker is pickled; a function is pickled as "module.name". Define the function at the top level of the file.'
    },
    {
      q: 'A worker appends to a global list. What does the main process see?',
      choices: ['Nothing changes: the worker changed its own copy', 'The appended items', 'An error'],
      answer: 0,
      why: 'Processes share no memory. Send results back as return values.'
    }
  ];

  Q['py-asyncio'] = [
    {
      q: 'For `async def fetch(name): ...`, what does the call `fetch("a")` return?',
      choices: ['A coroutine object: nothing has run yet', 'The value `fetch` returns', 'A new thread'],
      answer: 0,
      why: 'Like a generator, a coroutine starts only when it is awaited (or wrapped in a task).'
    },
    {
      q: '`a()` and `b()` each sleep 1 s with `await asyncio.sleep(1)`. How long do `await a(); await b()` and `await asyncio.gather(a(), b())` take?',
      choices: ['About 2 s, then about 1 s', 'About 1 s each', 'About 2 s each'],
      answer: 0,
      why: 'Awaiting one after the other waits for each in turn; `gather` runs them at the same time.'
    },
    {
      q: 'A coroutine calls `time.sleep(1)`. What happens to the other coroutines?',
      choices: ['They all wait a second: the event loop is blocked', 'They keep running on other threads', 'asyncio notices and switches to them'],
      answer: 0,
      why: 'All coroutines share one thread and switch only at an `await`. Use `await asyncio.sleep(1)`, or `await asyncio.to_thread(...)` for blocking work.'
    },
    {
      q: 'Which is closest to Java\'s `CompletableFuture.allOf(a, b)`?',
      choices: ['`await asyncio.gather(a, b)`', '`asyncio.run(a, b)`', '`await asyncio.sleep(a, b)`'],
      answer: 0,
      why: '`gather` runs the awaitables together and returns all their results, in order.'
    }
  ];

  Q['py-performance'] = [
    {
      q: 'Why take the **minimum** of several `timeit` runs?',
      choices: ['The fastest run is the one least disturbed by everything else on the computer', 'timeit forbids averages', 'Each run is faster than the one before'],
      answer: 0,
      why: 'Other programs only ever add time. The minimum is closest to the cost of the code itself.'
    },
    {
      q: 'In cProfile\'s report, what is `tottime`?',
      choices: ['Time spent in the function\'s own code, not in what it called', 'Time including every function it called', 'Time since the program started'],
      answer: 0,
      why: '`cumtime` includes the calls; `tottime` does not. Sort by `tottime` to find the code that is slow itself.'
    },
    {
      q: '`if x in items:` inside a loop over 10,000 items is slow. What is the usual fix?',
      choices: ['Turn `items` into a set once, before the loop', 'Sort the list first', 'Use a `while` loop instead'],
      answer: 0,
      why: '`in` scans a whole list but hashes straight to the answer in a set: a big-O change, which beats any micro-trick.'
    },
    {
      q: 'What does `dis.dis(f)` show?',
      choices: ['The bytecode instructions CPython runs for `f`', 'The C source code of `f`', 'The machine code a JIT made for `f`'],
      answer: 0,
      why: 'It is Python\'s `javap -c`: the instructions the interpreter executes, one by one.'
    }
  ];
})(window.PYLT);
