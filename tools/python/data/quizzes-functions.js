/*
 * Quizzes for track 3 (Functions in depth). The question shape is described at the top of
 * data/quizzes-basics.js.
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};
  function py() { return '```python\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q['py-args-kwargs'] = [
    {
      q: 'What does this print?\n\n' + py('def f(*args, **kwargs):', '    print(args, kwargs)', '', 'f(1, 2, x=3)'),
      choices: ["`(1, 2) {'x': 3}`", "`[1, 2] {'x': 3}`", '`(1, 2, 3) {}`'],
      answer: 0,
      why: '`*args` collects the extra positional arguments into a **tuple**, and `**kwargs` collects the named ones into a **dict**.'
    },
    {
      q: 'With `def connect(host, *, port=5432):`, what does `connect("db", 6000)` do?',
      choices: ['A `TypeError`: `port` comes after the bare `*`, so it can only be given by name', 'It sets `port` to 6000', 'It ignores the 6000'],
      answer: 0,
      why: 'Every parameter after a bare `*` is keyword-only. The call must say `connect("db", port=6000)`, which is the point: the call says what 6000 means.'
    },
    {
      q: '`nums = [3, 4]`. What does `print(*nums)` print?',
      choices: ['`3 4`', '`[3, 4]`', '`(3, 4)`'],
      answer: 0,
      why: 'In a call, `*nums` spreads the list into separate arguments, so this is `print(3, 4)`, which puts a space between them.'
    },
    {
      q: 'Which of these `def` lines is valid?',
      choices: ['`def f(a, b=1, *args, c, **kwargs):`', '`def f(**kwargs, *args):`', '`def f(a=1, b):`'],
      answer: 0,
      why: 'The order is: normal parameters (those with defaults last), then `*args`, then keyword-only ones, then `**kwargs`. A parameter without a default cannot follow one with a default.'
    }
  ];

  Q['py-mutable-defaults'] = [
    {
      q: 'What does this print?\n\n' + py('def f(x=[]):', '    x.append(1)', '    return len(x)', '', 'f()', 'print(f())'),
      choices: ['`2`', '`1`', 'An error'],
      answer: 0,
      why: 'The default list is made once, when the `def` runs, and both calls append to that same list. By the second call it holds two items.'
    },
    {
      q: 'When is a default value such as `items=[]` worked out?',
      choices: ['Once, when the `def` statement runs', 'Every time the function is called', 'The first time the function is called'],
      answer: 0,
      why: 'The value is computed when the function is defined and stored on it, in `f.__defaults__`. That is why a list default is shared by every call.'
    },
    {
      q: 'Which of these defaults is safe?',
      choices: ['`count=0`', '`items=[]`', '`cache={}`'],
      answer: 0,
      why: 'A number cannot be changed, so sharing it does no harm: `count += 1` makes a new number. A list or dict default is one object shared by every call.'
    },
    {
      q: 'In the fix, why `if items is None:` rather than `if not items:`?',
      choices: ['A caller who passes an empty list wants that list filled; `not items` would replace it with a new one', '`not items` raises an error for lists', '`is None` is faster'],
      answer: 0,
      why: 'An empty list is falsy too, so `if not items:` cannot tell "nothing was passed" from "an empty list was passed". `is None` asks exactly the right question.'
    }
  ];

  Q['py-scope'] = [
    {
      q: 'What happens?\n\n' + py('x = 1', '', 'def show():', '    print(x)', '    x = 2', '', 'show()'),
      choices: ['An `UnboundLocalError`: `x` is assigned in `show`, so it is local there, and has no value at the `print`', 'It prints 1', 'It prints 2'],
      answer: 0,
      why: 'Python decides when it reads the `def`: a name assigned anywhere in a function is local in the whole function, even on the lines before the assignment.'
    },
    {
      q: 'After `for i in range(3): pass`, what is `i`?',
      choices: ['`2`', 'A `NameError`: `i` is gone after the loop', '`3`'],
      answer: 0,
      why: 'Loops have no scope of their own, so `i` keeps its last value, 2. In Java, `i` would be gone after the loop\'s closing brace.'
    },
    {
      q: 'In which order does Python look a name up?',
      choices: ['Local, Enclosing, Global, Built-in', 'Global, Local, Built-in, Enclosing', 'Built-in first, then Global, then Local'],
      answer: 0,
      why: 'LEGB, from the inside out: the current function, the functions around it, the module, then the built-ins. The first scope that has the name wins.'
    },
    {
      q: 'When do you need `nonlocal`?',
      choices: ['To assign to a variable of an enclosing function from inside an inner function', 'To read any variable from outside the function', 'To create a global variable'],
      answer: 0,
      why: 'Reading an outer name needs nothing. Assigning would make a new local name, unless `nonlocal` (for an enclosing function) or `global` (for the module) says otherwise.'
    }
  ];

  Q['py-lambdas'] = [
    {
      q: '`f = len`. What is `f("abc")`?',
      choices: ['`3`', 'An error: `f` is not a function', '`"len"`'],
      answer: 0,
      why: 'Without brackets, `len` is the function object itself, so `f` is now a second name for it. Functions are values like any other.'
    },
    {
      q: 'Which of these is a valid lambda?',
      choices: ['`lambda x: x * 2`', '`lambda x: return x * 2`', '`lambda x { x * 2 }`'],
      answer: 0,
      why: 'A lambda body is one expression, and its value is the result: there is no `return` and there are no braces.'
    },
    {
      q: 'Java\'s `people.sort(Comparator.comparing(Person::getAge))` is which Python call?',
      choices: ['`people.sort(key=lambda p: p.age)`', '`people.sort(comparator=age)`', '`people.sort(lambda a, b: a.age - b.age)`'],
      answer: 0,
      why: 'Python sorts by a **key**: a function called once per item whose result is compared. There is no comparator parameter.'
    },
    {
      q: 'Why does PEP 8 advise against `square = lambda n: n * n`?',
      choices: ['A `def` gives the function a real name, shown in tracebacks, and room for a docstring', 'Lambdas are slower', 'Lambdas cannot be stored in variables'],
      answer: 0,
      why: 'Both make the same kind of function object, but a lambda\'s name is always `<lambda>`. Use lambdas where a small function is passed straight in, such as `key=`.'
    }
  ];

  Q['py-closures'] = [
    {
      q: 'What does this print?\n\n' + py('def make_adder(n):', '    return lambda x: x + n', '', 'add5 = make_adder(5)', 'print(add5(10))'),
      choices: ['`15`', 'A `NameError`: `n` is gone once `make_adder` returns', '`5`'],
      answer: 0,
      why: 'The lambda captured `n`, so it still has it after `make_adder` has returned: that is a closure.'
    },
    {
      q: 'Where does a closure keep a variable it captured?',
      choices: ['In a cell attached to the function, listed in `f.__closure__`', 'In a global variable', 'Nowhere: the value is copied into the code'],
      answer: 0,
      why: 'Python moves a captured variable into a cell that lives as long as any function using it; `f.__code__.co_freevars` lists the names.'
    },
    {
      q: '`fs = [lambda: i for i in range(3)]`. What is `[f() for f in fs]`?',
      choices: ['`[2, 2, 2]`', '`[0, 1, 2]`', 'An error'],
      answer: 0,
      why: 'All three lambdas captured the same variable `i` and read it when they are called, after the loop has ended at 2. `lambda i=i: i` would freeze each value.'
    },
    {
      q: 'Calling `make()()` raises `UnboundLocalError`. What fixes it?\n\n' + py('def make():', '    n = 0', '    def inc():', '        n += 1', '        return n', '    return inc'),
      choices: ['`nonlocal n` as the first line of `inc`', '`global n` as the first line of `make`', 'Move `n = 0` inside `inc`'],
      answer: 0,
      why: '`n += 1` assigns, so without a declaration `n` is local to `inc`. `nonlocal n` makes it the captured `n` of `make`. Moving `n = 0` into `inc` would reset it on every call.'
    }
  ];

  Q['py-decorators'] = [
    {
      q: 'What does `@deco` above `def f():` mean?',
      choices: ['`f = deco(f)`, run once, right after the `def`', '`deco` is called every time `f` is called, instead of `f`', '`f` is only marked, so that a framework can find it later'],
      answer: 0,
      why: 'The decorator runs once, when the function is defined, and the name is bound to what it returns. That result (usually a wrapper) is what runs on each call.'
    },
    {
      q: 'What does this program print?\n\n' + py('def deco(func):', '    print("decorating")', '    return func', '', '@deco', 'def f():', '    print("f runs")'),
      choices: ['`decorating`', '`decorating` then `f runs`', 'Nothing'],
      answer: 0,
      why: 'The decorator runs when the `def` runs, so "decorating" is printed. `f` itself is never called.'
    },
    {
      q: 'Why use `functools.wraps(func)` on a wrapper?',
      choices: ['It copies the original function\'s name and docstring onto the wrapper', 'It makes the wrapper faster', '`@` does not work without it'],
      answer: 0,
      why: 'Without it the decorated function reports the name "wrapper" and loses its docstring, which confuses tracebacks, `help()` and frameworks that look functions up by name.'
    },
    {
      q: '`@a` is above `@b`, which is above `def f`. When `f()` is called, whose wrapper starts first?',
      choices: ['`a`\'s, because `f = a(b(f))`', '`b`\'s, because it is closest to `f`', 'They run at the same time'],
      answer: 0,
      why: 'Decorators apply bottom up (`b` wraps `f`, then `a` wraps that), so the outermost wrapper, `a`, is entered first and calls `b`\'s wrapper inside it.'
    }
  ];

  Q['py-functools-recursion'] = [
    {
      q: 'What does `@cache` do to a function?',
      choices: ['It stores each result by its arguments, so a repeated call returns it without running the function again', 'It runs the function in the background', 'It runs the function only once, whatever the arguments'],
      answer: 0,
      why: 'A call with arguments seen before returns the stored result. That turns a recursive Fibonacci from exponential to linear time.'
    },
    {
      q: 'A function calls itself with no base case. What does Python do?',
      choices: ['It raises `RecursionError` after about 1,000 calls', 'It runs forever', 'It optimizes the calls into a loop'],
      answer: 0,
      why: 'Every call keeps a frame, and Python stops at its recursion limit (`sys.getrecursionlimit()`, usually 1000). There is no tail-call optimization.'
    },
    {
      q: 'What is `partial(int, base=2)("101")`?',
      choices: ['`5`', '`"101"`', 'A `TypeError`'],
      answer: 0,
      why: '`partial` makes a new function with `base=2` already filled in, so this is `int("101", base=2)`: 101 in binary is 5.'
    },
    {
      q: 'Which needs no `reduce` because a built-in already does it?',
      choices: ['Adding up numbers: `sum(numbers)`', 'Nothing: Python has no built-in folds', 'Sorting a list'],
      answer: 0,
      why: '`sum`, `max`, `min`, `any`, `all`, `"".join` and `math.prod` are the common folds, ready-made. Sorting is not a fold at all.'
    }
  ];
})(window.PYLT);
