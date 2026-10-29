/*
 * Explainers: pages that answer one hard question by running real Python as you click
 * (js/views/explainers.js draws them). Lessons link to one with [[explain:names]].
 *
 * Explainer shape: {id, title, summary, keywords, intro (Markdown), experiments: [experiment]}
 * Experiment shape: {id, title, text (Markdown), view: 'trace' | 'run',
 *                    runtimes?: ['server'] when it needs threads or processes, with runtimeWhy (Markdown),
 *                    controls: [{id, label, kind?: 'choice' | 'stepper', button?: the stepper's
 *                                button text (default "next(g)"), options: [{value, label}]}],
 *                    variants: [{when: {controlId: value, ...}, code, stdin?, expect: [..], note?,
 *                                expectError?, at?: {event?, func?, line?}}]}
 *   view 'trace' draws the program with Visualize's picture (py/tracer.py), starting at the first step
 *   that matches `at` (default: the last step); view 'run' shows the code and what it printed.
 *   Every combination of the controls' values has exactly one variant (tests/check_data.py checks it).
 *   expect lists text the variant prints, in that order; tests/test_content.py runs every variant on
 *   your Python and checks it (the error's traceback counts as printed when expectError is set).
 */
(function (U) {
  function lines() { return [].slice.call(arguments).join('\n') + '\n'; }
  function product(controls) {
    var combos = [{}];
    controls.forEach(function (c) {
      var next = [];
      combos.forEach(function (cb) {
        c.options.forEach(function (o) { var x = Object.assign({}, cb); x[c.id] = o.value; next.push(x); });
      });
      combos = next;
    });
    return combos;
  }

  /* ---------------------------------------------------------------- names and objects */

  var copyHow = {
    alias: { line: 'b = a                      # b is a second name for the same list', imp: false,
      out: ['a = [1, [2, 3, 99], 4]', 'b = [1, [2, 3, 99], 4]', 'a is b: True', 'a[1] is b[1]: True'],
      note: '`b = a` copies nothing. There is one list with two names, so every change through `b` shows through `a`. In the picture: two arrows into one box. Java does the same with `List<Object> b = a;`.' },
    slice: { line: 'b = a[:]                   # a new list with the same items', imp: false,
      out: ['a = [1, [2, 3, 99]]', 'b = [1, [2, 3, 99], 4]', 'a is b: False', 'a[1] is b[1]: True'],
      note: '`a[:]` is a **shallow** copy: a new outer list, but its items are the same objects. So `b.append(4)` changes only `b`, while the inner list is shared and `99` shows in both. In the picture: two outer boxes, both pointing at one inner list.' },
    copy: { line: 'b = copy.copy(a)           # the same as a[:]: a shallow copy', imp: true,
      out: ['a = [1, [2, 3, 99]]', 'b = [1, [2, 3, 99], 4]', 'a is b: False', 'a[1] is b[1]: True'],
      note: '`copy.copy` makes the same shallow copy as `a[:]`, `list(a)` or `a.copy()`: the outer list is new, the inner one is shared.' },
    deep: { line: 'b = copy.deepcopy(a)       # copies the inner lists too', imp: true,
      out: ['a = [1, [2, 3]]', 'b = [1, [2, 3, 99], 4]', 'a is b: False', 'a[1] is b[1]: False'],
      note: '`copy.deepcopy` copies everything inside, all the way down, so nothing is shared and `a` is untouched. It is slower and rarely needed: most code builds new data instead of copying old data.' }
  };

  function plusVariant(op, kind) {
    var start = kind === 'list' ? '[1, 2]' : '(1, 2)', more = kind === 'list' ? '[3]' : '(3,)';
    var same = op === 'inplace' && kind === 'list';
    var shown = kind === 'list' ? ['[1, 2, 3]', same ? '[1, 2, 3]' : '[1, 2]'] : ['(1, 2, 3)', '(1, 2)'];
    var notes = {
      'new list': '`a + [3]` builds a **new** list, and `a =` moves the name `a` to it. `b` still points at the old list, which is unchanged.',
      'inplace list': '`a += [3]` on a list changes the list **itself** (it calls `list.__iadd__`, which extends it), so `a` and `b` still share one list and both show `[1, 2, 3]`. For a list, `+=` is not the same as `a = a + ...`.',
      'new tuple': 'A tuple cannot change, so `a + (3,)` builds a new one and `a` moves to it. `b` keeps the old tuple.',
      'inplace tuple': 'A tuple cannot change, so for a tuple `+=` has to build a new tuple, just like `a = a + (3,)`. The same is true for `int` and `str`: `n += 1` always makes `n` point at a new number.'
    };
    return {
      when: { op: op, kind: kind },
      code: lines('a = ' + start, 'b = a', 'before = id(a)', op === 'new' ? 'a = a + ' + more : 'a += ' + more, '',
        'print("a =", a, " b =", b)', 'print("a is still the same object:", id(a) == before)', 'print("a is b:", a is b)'),
      expect: ['a = ' + shown[0] + '  b = ' + shown[1], 'a is still the same object: ' + (same ? 'True' : 'False'), 'a is b: ' + (same ? 'True' : 'False')],
      note: notes[(op === 'new' ? 'new ' : 'inplace ') + kind]
    };
  }

  var argBody = {
    append: { line: '    items.append(4)            # changes the list both names share', out: ['inside:  [1, 2, 3, 4]', 'outside: [1, 2, 3, 4]'],
      note: 'Calling `change(nums)` binds the parameter `items` to the **same** list `nums` points at: Python passes the reference, never a copy. So changing the list inside is seen outside. Java does exactly the same with an `ArrayList` argument.' },
    rebind: { line: '    items = items + [4]        # a new list, for the local name only', out: ['inside:  [1, 2, 3, 4]', 'outside: [1, 2, 3]'],
      note: 'Assigning to `items` moves only the **local** name to a new list. The caller\'s `nums` still points at the old one, unchanged. A function cannot make the caller\'s variable point somewhere else; it can only change the object both share.' },
    slice: { line: '    items[:] = [9]             # replaces the contents of the shared list', out: ['inside:  [9]', 'outside: [9]'],
      note: '`items[:] = ...` replaces everything **inside** the list both names share, so the caller sees `[9]`. It is how a function empties or refills a list it was given.' }
  };

  /* ---------------------------------------------------------------- scope */

  var legbControls = [
    { id: 'name', label: 'The name looked up', options: [{ value: 'x', label: '`x`' }, { value: 'len', label: '`len` (a built-in)' }] },
    { id: 'local', label: 'Local (inside inner)', options: [{ value: 'yes', label: 'assigned' }, { value: 'no', label: 'not assigned' }] },
    { id: 'enclosing', label: 'Enclosing (inside outer)', options: [{ value: 'yes', label: 'assigned' }, { value: 'no', label: 'not assigned' }] },
    { id: 'global', label: 'Global (the module)', options: [{ value: 'yes', label: 'assigned' }, { value: 'no', label: 'not assigned' }] }
  ];
  function legbVariant(when) {
    var n = when.name;
    var code = [];
    if (when.global === 'yes') code.push(n + ' = "global"', '');
    code.push('def outer():');
    if (when.enclosing === 'yes') code.push('    ' + n + ' = "enclosing"');
    code.push('    def inner():');
    if (when.local === 'yes') code.push('        ' + n + ' = "local"');
    code.push('        print("found:", ' + n + ')', '    inner()', '', 'outer()');
    var levels = [['Local', when.local], ['Enclosing', when.enclosing], ['Global', when.global]];
    var found = null, trail = [];
    levels.forEach(function (l) {
      if (found) return;
      if (l[1] === 'yes') { found = l[0]; trail.push('**' + l[0] + '**: found'); } else trail.push(l[0] + ': not there');
    });
    var v = { when: when, code: lines.apply(null, code) };
    if (found) {
      v.expect = ['found: ' + found.toLowerCase()];
      v.note = 'Python looked in ' + trail.join(' → ') + '. It stops at the first scope that has the name, in the order **L**ocal, **E**nclosing, **G**lobal, **B**uilt-in (LEGB).' +
        (n === 'len' ? ' Here a variable named `len` hides the built-in `len()` in that scope: calling `len(...)` there would now fail. Avoid naming variables after built-ins (`list`, `dict`, `sum`, `max`, `id`, `input`).' : '');
    } else if (n === 'len') {
      v.expect = ['found: <built-in function len>'];
      v.note = 'Python looked in ' + trail.join(' → ') + ' → **Built-in**: found. The built-in scope, the module `builtins`, is the last place Python looks; that is where `print`, `len` and `range` live.';
    } else {
      v.expect = ["NameError: name 'x' is not defined"];
      v.expectError = 'NameError';
      v.note = 'Python looked in ' + trail.join(' → ') + ' → Built-in: not there either, so it raises `NameError`. Python finds names when the line **runs**, not when the program is read, which is why the error only appears once `inner()` is called.';
    }
    return v;
  }

  /* ---------------------------------------------------------------- generators */

  var pauseLabels = ['made g, not started', 'next(g) once', 'next(g) twice', 'next(g) 3 times', 'next(g) 4 times'];
  function pauseVariant(k) {
    var code = ['def countdown(n):', '    print("  start")', '    while n > 0:', '        print("  about to yield", n)', '        yield n',
      '        print("  resumed")', '        n -= 1', '    print("  finished")', '', 'g = countdown(3)', 'print("made g; nothing has run yet")'];
    for (var i = 0; i < k; i++) code.push('print("next(g) ->", next(g))');
    var expect = ['made g; nothing has run yet'];
    if (k >= 1) expect.push('  start', '  about to yield 3', 'next(g) -> 3');
    if (k >= 2) expect.push('  resumed', '  about to yield 2', 'next(g) -> 2');
    if (k >= 3) expect.push('  resumed', '  about to yield 1', 'next(g) -> 1');
    var notes = [
      'Calling `countdown(3)` runs **none** of its body: it only builds a generator object, shown in the picture as "not started". The body starts on the first `next(g)`.',
      'The first `next(g)` runs the body from the top until the first `yield`, then **pauses** there and hands back 3. In the picture the generator is "paused at line 5", and its own variable `n` is kept inside it.',
      'The second `next(g)` resumes right after the `yield`, with `n` still 3: it prints "resumed", counts down and pauses at the `yield` again, handing back 2. A normal function would have started over from the top.',
      'Each `next(g)` runs just far enough to produce one value. Nothing is computed ahead of time, which is why a generator can walk a huge file, or an endless sequence, in a few bytes of memory.',
      'The fourth `next(g)` resumes, the loop ends, "finished" prints, and the function returns. With nothing left to yield, `next()` raises `StopIteration`. That is exactly how a `for` loop knows to stop: it calls `next()` until `StopIteration`, and catches it for you.'
    ];
    var v = { when: { calls: String(k) }, code: lines.apply(null, code), note: notes[k] };
    if (k === 4) {
      expect.push('  resumed', '  finished', 'StopIteration');
      v.expectError = 'StopIteration';
    }
    v.expect = expect;
    return v;
  }

  /* ---------------------------------------------------------------- decorators */

  var DECO = lines(
    'def bold(func):',
    '    print("decorating with bold")',
    '    def wrapper():',
    '        print("  enter bold")',
    '        result = "<b>" + func() + "</b>"',
    '        print("  leave bold")',
    '        return result',
    '    return wrapper',
    '',
    'def italic(func):',
    '    print("decorating with italic")',
    '    def wrapper():',
    '        print("  enter italic")',
    '        result = "<i>" + func() + "</i>"',
    '        print("  leave italic")',
    '        return result',
    '    return wrapper',
    '');
  function orderVariant(stack) {
    var decos = { bi: ['bold', 'italic'], ib: ['italic', 'bold'], b: ['bold'] }[stack];
    var code = DECO + decos.map(function (d) { return '@' + d; }).join('\n') + '\ndef hello():\n    print("    hello runs")\n    return "hello"\n\nprint("calling hello()")\nprint(hello())\n';
    var tags = { bold: 'b', italic: 'i' };
    var expect = decos.slice().reverse().map(function (d) { return 'decorating with ' + d; }).concat(['calling hello()'])
      .concat(decos.map(function (d) { return '  enter ' + d; })).concat(['    hello runs'])
      .concat(decos.slice().reverse().map(function (d) { return '  leave ' + d; }));
    var result = 'hello';
    decos.slice().reverse().forEach(function (d) { result = '<' + tags[d] + '>' + result + '</' + tags[d] + '>'; });
    expect.push(result);
    var notes = {
      bi: 'Decorators are applied **bottom up**, when the `def` runs: first `italic(hello)`, then `bold(...)` of that, so `hello = bold(italic(hello))`. Calling it runs them **top down**: the outer wrapper (`bold`) starts first, calls the inner one, which calls the real `hello`, and the results come back out in reverse, like nested method calls.',
      ib: 'Swap the two lines and the nesting swaps too: `hello = italic(bold(hello))`. Now `italic` is outermost, so it is entered first and its tag ends up outside: `<i><b>hello</b></i>`. Order matters whenever decorators do different things, such as a timer around a cache, or a login check around logging.',
      b: 'One decorator: `@bold` above the `def` means exactly `hello = bold(hello)`. "decorating with bold" prints when the `def` runs, before `hello` is ever called: a decorator runs once, at definition time, and returns the function that will be called from then on.'
    };
    return { when: { stack: stack }, code: code, expect: expect, note: notes[stack] };
  }

  /* ---------------------------------------------------------------- batch 4: shared by the explainers below */

  var SERVER_WHY = 'A browser gives Python no threads or processes, so these timings can only be taken with your own Python.';
  var TOY_LABELS = ['start', 'turn 1', 'turn 2', 'turn 3', 'turn 4', 'turn 5'];
  var TOY_LOOP = String.raw`import heapq

clock = 0.0
ready = []          # (name, coroutine): can run now, first come, first served
sleeping = []       # a heap of (wake-up time, order, name, coroutine)
count = 0


def worker(name, pauses):
    """A coroutine written as a generator: yield p means 'wake me in p seconds'."""
    for p in pauses:
        print(f"    {name} runs, then waits {p} s")
        yield p
    print(f"    {name} runs to its end")


def turn():
    """One turn: if nothing is ready, jump the clock to the next wake-up; then run one coroutine."""
    global clock, count
    if not ready:
        clock = sleeping[0][0]
        while sleeping and sleeping[0][0] == clock:
            _, _, name, coro = heapq.heappop(sleeping)
            ready.append((name, coro))
            print(f"  the clock jumps to {clock:.1f} s: {name} wakes up")
    name, coro = ready.pop(0)
    try:
        pause = next(coro)                      # run it until it waits again
    except StopIteration:
        return
    count += 1
    heapq.heappush(sleeping, (clock + pause, count, name, coro))


def state():
    r = ", ".join(n for n, _ in ready) or "nothing"
    s = ", ".join(f"{n} until {t:.1f} s" for t, _, n, _ in sorted(sleeping)) or "nothing"
    print(f"  ready: {r} | sleeping: {s}")


ready = [("A", worker("A", [0.3])), ("B", worker("B", [0.1, 0.1]))]
`;

  // [the line, the expected count after it, what happened]
  var REF_STEPS = [
    ['a = Thing()', '1 reference', 'A new object, and one reference to it: the name `a`. (`sys.getrefcount` itself would report more: its own argument, and the variable in `references()`. The program subtracts those.)'],
    ['b = a', '2 references', '`b = a` copies the reference, not the object: two names, one object, two references.'],
    ['items = [a, a]', '4 references', 'A list holds a reference in each slot: the same object twice in a list adds two.'],
    ['holder.thing = a', '5 references', 'An attribute of another object is one more reference. Anything that can reach the object keeps it alive.'],
    ['del b', '4 references', '`del b` deletes the name `b`, not the object: one reference fewer, and the object lives on through the others.'],
    ['items.clear()', '2 references', 'Emptying the list drops its two references. Down to two: `a` and `holder.thing`.'],
    ['a = None', '1 reference', '`a = None` points the name somewhere else. The object is still alive, because `holder.thing` refers to it.'],
    ['holder.thing = None', 'freed: nothing refers to it', 'The last reference is gone, so CPython frees the object **at once**, on this very line: no waiting for a garbage collector, as on the JVM. (The program asks about the object through a weak reference, `weakref.ref`, which does not count.)']
  ];

  U.data.explainers = [
    {
      id: 'names', title: 'Names and objects',
      summary: 'A variable is a name tied to an object, never a box holding a copy. See aliasing, shallow and deep copies, a = a + [x] versus a += [x], and lists passed to functions.',
      keywords: ['variable', 'reference', 'alias', 'aliasing', 'copy', 'deepcopy', 'shallow copy', 'mutable', 'immutable', 'id', 'is', '+=', 'pass by reference', 'pass by value'],
      intro: 'In Python every value is an object, and a variable is only a **name** tied to one. Assignment ties a name to an object; it never copies the object. This is how Java treats object references, applied to everything, even numbers. Pick an option in each experiment: the program runs on real Python, and the picture is drawn from what Python actually did (the same picture as [[viz:aliasing|Visualize]]).',
      experiments: [
        {
          id: 'copies', title: 'Two names, or two lists?', view: 'trace',
          text: 'The list `a` holds a number and another list. The second line makes `b` from `a`; then the program changes `b`, and the list inside `b`. Which changes does `a` see?',
          controls: [{ id: 'how', label: 'Make b with', options: [
            { value: 'alias', label: '`b = a`' }, { value: 'slice', label: '`b = a[:]`' }, { value: 'copy', label: '`copy.copy(a)`' }, { value: 'deep', label: '`copy.deepcopy(a)`' }] }],
          variants: Object.keys(copyHow).map(function (k) {
            var c = copyHow[k];
            return {
              when: { how: k },
              code: (c.imp ? 'import copy\n\n' : '') + lines('a = [1, [2, 3]]', c.line, 'b.append(4)                # change b itself', 'b[1].append(99)            # change the list inside b', '',
                'print("a =", a)', 'print("b =", b)', 'print("a is b:", a is b)', 'print("a[1] is b[1]:", a[1] is b[1])'),
              expect: c.out, note: c.note
            };
          })
        },
        {
          id: 'plus', title: 'a = a + [3] or a += [3]?', view: 'trace',
          text: '`b = a` gives the object a second name. Then `a` grows by one item. Does `b` see it? The answer depends on the operator and on whether the object can change at all.',
          controls: [
            { id: 'op', label: 'Grow a with', options: [{ value: 'new', label: '`a = a + ...`' }, { value: 'inplace', label: '`a += ...`' }] },
            { id: 'kind', label: 'a is', options: [{ value: 'list', label: 'a list' }, { value: 'tuple', label: 'a tuple' }] }],
          variants: product([{ id: 'op', options: [{ value: 'new' }, { value: 'inplace' }] }, { id: 'kind', options: [{ value: 'list' }, { value: 'tuple' }] }])
            .map(function (w) { return plusVariant(w.op, w.kind); })
        },
        {
          id: 'args', title: 'Passing a list to a function', view: 'trace',
          text: 'Does a function get the caller\'s list, or a copy? The picture stops just before `change` returns, while both frames exist: follow the arrows from `nums` and from `items`.',
          controls: [{ id: 'body', label: 'Inside change', options: [
            { value: 'append', label: '`items.append(4)`' }, { value: 'rebind', label: '`items = items + [4]`' }, { value: 'slice', label: '`items[:] = [9]`' }] }],
          variants: Object.keys(argBody).map(function (k) {
            var b = argBody[k];
            return {
              when: { body: k }, at: { event: 'return', func: 'change' },
              code: lines('def change(items):', b.line, '    print("inside: ", items)', '', 'nums = [1, 2, 3]', 'change(nums)', 'print("outside:", nums)'),
              expect: b.out, note: b.note
            };
          })
        }
      ]
    },

    {
      id: 'scope', title: 'Scope and closures',
      summary: 'How Python finds a name (Local, Enclosing, Global, Built-in), why assigning makes a name local, and how a closure keeps variables alive after its function returned.',
      keywords: ['scope', 'legb', 'global', 'nonlocal', 'closure', 'unboundlocalerror', 'nameerror', 'late binding', 'lambda', 'shadowing', 'built-in'],
      intro: 'A **scope** is a region of code with its own names: each function call has one (its frame), the module has one (the globals), and Python\'s built-ins have one. Reading a name searches them from the inside out; assigning a name puts it in the current scope, unless you say otherwise. A **closure** is a function that keeps using a variable of the function it was created in. Lesson: [[lesson:py-scope]].',
      experiments: [
        {
          id: 'legb', title: 'Where does Python find the name? (LEGB)', view: 'run',
          text: '`inner` is defined inside `outer`, which is in the module. Choose where the name is assigned; `inner` prints the one Python finds.',
          controls: legbControls,
          variants: product(legbControls).map(legbVariant)
        },
        {
          id: 'assign', title: 'Assigning makes a name local', view: 'trace',
          text: '`add_one` should add 1 to the module\'s `count`. Reading a global from a function works, but **assigning** to it does not do what a Java developer expects.',
          controls: [{ id: 'fix', label: 'add_one', options: [
            { value: 'none', label: '`count += 1`' }, { value: 'global', label: '`global count`' }, { value: 'return', label: 'returns a value' }] }],
          variants: [
            { when: { fix: 'none' }, expectError: 'UnboundLocalError',
              code: lines('count = 0', '', 'def add_one():', '    count += 1          # assigns count, so count is local here', '', 'add_one()', 'print("count =", count)'),
              expect: ['UnboundLocalError'],
              note: 'Because `add_one` **assigns** to `count`, Python decides, when it reads the `def`, that `count` is local to the whole function. `count += 1` first reads that local, which has no value yet: `UnboundLocalError`. (Java would not compile this. Python only finds out when the line runs.)' },
            { when: { fix: 'global' },
              code: lines('count = 0', '', 'def add_one():', '    global count        # count means the module\'s count', '    count += 1', '', 'add_one()', 'add_one()', 'print("count =", count)'),
              expect: ['count = 2'],
              note: '`global count` tells Python that `count` in this function is the module\'s variable, so the assignment changes it. It works, but a function that changes globals is hard to test and to reuse; the next option is the usual style.' },
            { when: { fix: 'return' },
              code: lines('count = 0', '', 'def add_one(n):', '    return n + 1        # take a value, return a value', '', 'count = add_one(count)', 'count = add_one(count)', 'print("count =", count)'),
              expect: ['count = 2'],
              note: 'No shared state at all: the function takes a value and returns a new one, and the caller decides where it goes. This is the Python style, and the same advice as in Java: avoid mutable static fields.' }
          ]
        },
        {
          id: 'closure', title: 'A closure keeps its variables', view: 'trace',
          text: '`make_counter` returns the inner function `increment`, and then its own frame is gone. Yet `increment` keeps counting. Look at the function objects in the picture: each holds the `count` it captured.',
          controls: [{ id: 'keyword', label: 'Inside increment', options: [{ value: 'nonlocal', label: '`nonlocal count`' }, { value: 'missing', label: 'no `nonlocal`' }] }],
          variants: [
            { when: { keyword: 'nonlocal' },
              code: lines('def make_counter():', '    count = 0', '    def increment():', '        nonlocal count', '        count += 1', '        return count', '    return increment', '',
                'c1 = make_counter()', 'c2 = make_counter()', 'print(c1(), c1(), c1())', 'print(c2())', 'print("c1 captured:", c1.__code__.co_freevars, "=", c1.__closure__[0].cell_contents)'),
              expect: ['1 2 3', '1', "c1 captured: ('count',) = 3"],
              note: 'Each call of `make_counter` makes a new `count`, and the `increment` created in that call captures it: Python keeps the variable in a **cell** that lives as long as the function does. So `c1` and `c2` count separately. `nonlocal count` lets `increment` assign to the captured variable instead of making a new local one.' },
            { when: { keyword: 'missing' }, expectError: 'UnboundLocalError',
              code: lines('def make_counter():', '    count = 0', '    def increment():', '        count += 1', '        return count', '    return increment', '',
                'c1 = make_counter()', 'print("c1 captured:", c1.__code__.co_freevars)', 'print(c1())'),
              expect: ['c1 captured: ()', 'UnboundLocalError'],
              note: 'Without `nonlocal`, `count += 1` assigns, so `count` is local to `increment`, and `increment` captures nothing: its `co_freevars` is empty. The first call then reads a local with no value. This is Java\'s rule from the other side: a Java lambda may only capture variables that are effectively final; Python lets you change them, but you must say so with `nonlocal`.' }
          ]
        },
        {
          id: 'late', title: 'Closures in a loop: late binding', view: 'trace',
          text: 'Three small functions are made in a loop, each meant to return its own `i`. What do they return when called afterwards?',
          controls: [{ id: 'style', label: 'Each function is', options: [{ value: 'late', label: '`lambda: i`' }, { value: 'default', label: '`lambda i=i: i`' }] }],
          variants: [
            { when: { style: 'late' },
              code: lines('def make_funcs():', '    funcs = []', '    for i in range(3):', '        funcs.append(lambda: i)', '    return funcs', '', 'funcs = make_funcs()', 'print([f() for f in funcs])'),
              expect: ['[2, 2, 2]'],
              note: 'All three lambdas captured the same variable `i`, not its value at the time: in the picture each function shows "captured i" pointing at one shared 2. They look `i` up when they are **called**, after the loop has finished. Java avoids this by allowing only effectively final captures.' },
            { when: { style: 'default' },
              code: lines('def make_funcs():', '    funcs = []', '    for i in range(3):', '        funcs.append(lambda i=i: i)', '    return funcs', '', 'funcs = make_funcs()', 'print([f() for f in funcs])'),
              expect: ['[0, 1, 2]'],
              note: 'A default value is worked out when the `lambda` is **created**, so `i=i` stores the current value in each function (the picture shows "default i" as 0, 1 and 2). This is the usual fix; `functools.partial` is another.' }
          ]
        }
      ]
    },

    {
      id: 'generators', title: 'Generators: paused functions',
      summary: 'A generator is a function that pauses at each yield and resumes on next(). Watch one pause mid-function, see lazy and eager pipelines run in a different order, and measure the memory.',
      keywords: ['generator', 'yield', 'next', 'stopiteration', 'lazy', 'iterator', 'generator expression', 'memory', 'getsizeof', 'stream'],
      intro: 'A function with `yield` in it is a **generator function**: calling it runs nothing and returns a generator object. Each `next()` runs the body until the next `yield`, hands that value out, and **pauses** the function with all its local variables kept, until the next `next()`. That is how Python gets lazy sequences, the job Java\'s `Iterator` and `Stream` do. Lesson: [[lesson:py-comprehensions]].',
      experiments: [
        {
          id: 'pause', title: 'Paused in the middle of a function', view: 'trace',
          text: 'Press **next(g)** to call `next()` once more. Each press runs the program again with one more call, and the picture shows where the generator is paused and what its `n` is.',
          controls: [{ id: 'calls', label: 'Calls so far', kind: 'stepper', options: pauseLabels.map(function (l, k) { return { value: String(k), label: l }; }) }],
          variants: [0, 1, 2, 3, 4].map(pauseVariant)
        },
        {
          id: 'lazy', title: 'Eager list or lazy generator?', view: 'run',
          text: 'The same pipeline twice: `numbers()` makes values, a comprehension squares them, a loop uses them. Square brackets build the whole list first; round brackets make a generator that works one value at a time. Compare the order of the lines.',
          controls: [{ id: 'brackets', label: 'squares =', options: [{ value: 'list', label: '`[n * n for ...]`' }, { value: 'gen', label: '`(n * n for ...)`' }] }],
          variants: ['list', 'gen'].map(function (b) {
            var open = b === 'list' ? '[' : '(', close = b === 'list' ? ']' : ')';
            return {
              when: { brackets: b },
              code: lines('def numbers():', '    for n in range(1, 4):', '        print("  make", n)', '        yield n', '',
                'squares = ' + open + 'n * n for n in numbers()' + close, 'print("squares is ready")', 'for s in squares:', '    print("use", s)'),
              expect: b === 'list' ? ['  make 1', '  make 2', '  make 3', 'squares is ready', 'use 1', 'use 4', 'use 9'] :
                ['squares is ready', '  make 1', 'use 1', '  make 2', 'use 4', '  make 3', 'use 9'],
              note: b === 'list' ? 'The list comprehension runs to the end before the next line: every value is made, squared and stored first, then used. Like `stream.collect(toList())`.' :
                'The generator expression does nothing until the loop asks for a value; then each value is made, squared and used before the next one is made, like a Java `Stream` pipeline, which is lazy until its terminal operation. Nothing is stored.'
            };
          })
        },
        {
          id: 'memory', title: 'How much memory?', view: 'run',
          text: 'A list holds all its items at once; a generator holds only its paused state. `sys.getsizeof` measures each, on the Python running this page.',
          controls: [{ id: 'n', label: 'How many squares', options: [{ value: '10', label: '10' }, { value: '1000', label: '1,000' }, { value: '100000', label: '100,000' }, { value: '1000000', label: '1,000,000' }] }],
          variants: ['10', '1000', '100000', '1000000'].map(function (n) {
            return {
              when: { n: n },
              code: lines('import sys', '', 'n = ' + n, 'as_list = [x * x for x in range(n)]', 'as_gen = (x * x for x in range(n))', '',
                'print(f"list of {n:,} squares: {sys.getsizeof(as_list):,} bytes")', 'print(f"generator of them:   {sys.getsizeof(as_gen):,} bytes")',
                'print("same total:", sum(as_list) == sum(as_gen))'),
              expect: ['list of', 'bytes', 'generator of them:', 'bytes', 'same total: True'],
              note: 'The list grows with `n`; the generator stays the same small size however many values it will produce. (`getsizeof` counts the list\'s own slots, one pointer per item, not the numbers themselves, so the real gap is bigger still.) The catch: a generator can be walked **once**. After `sum(as_gen)` it is used up.'
            };
          })
        }
      ]
    },

    {
      id: 'decorators', title: 'Decorators: wrapping order',
      summary: 'What @ does (f = deco(f)), the order stacked decorators apply and run in, why functools.wraps matters, and decorators that take arguments.',
      keywords: ['decorator', '@', 'wrapper', 'functools.wraps', 'wraps', 'higher-order function', 'annotation', 'aop', 'proxy'],
      intro: 'A **decorator** is a function that takes a function and returns a replacement, usually a wrapper that does something before and after calling the original. `@name` above a `def` is shorthand for `f = name(f)`. It looks like a Java annotation, but it is plain code that runs: closer to a Spring AOP proxy around a bean. Lesson: [[lesson:py-decorators]].',
      experiments: [
        {
          id: 'what', title: 'What @ really does', view: 'trace',
          text: 'Both versions do the same thing. In the picture, `greet` ends up pointing at `wrapper`, which keeps the original function as its captured `func`.',
          controls: [{ id: 'syntax', label: 'Written as', options: [{ value: 'at', label: '`@shout`' }, { value: 'manual', label: '`greet = shout(greet)`' }] }],
          variants: ['at', 'manual'].map(function (s) {
            return {
              when: { syntax: s },
              code: lines('def shout(func):', '    def wrapper(name):', '        return func(name).upper() + "!"', '    return wrapper', '',
                (s === 'at' ? '@shout\n' : '') + 'def greet(name):', '    return f"hello, {name}"', s === 'manual' ? '\ngreet = shout(greet)   # what @shout does' : '', '',
                'print(greet("asha"))', 'print("greet is now:", greet.__name__)'),
              expect: ['HELLO, ASHA!', 'greet is now: wrapper'],
              note: s === 'at' ? '`@shout` runs `shout(greet)` right after the `def`, and the name `greet` is tied to what it returns: the wrapper. Calls to `greet` now go through `wrapper`, which calls the original (captured as `func`) and changes the result.' :
                'Written out by hand it is just a function call and an assignment, which is all `@` is. Notice that `greet.__name__` is now "wrapper": the original name is lost. The `functools.wraps` experiment below fixes that.'
            };
          })
        },
        {
          id: 'order', title: 'Stacked decorators: which runs first?', view: 'run',
          text: '`bold` wraps the result in `<b>`, `italic` in `<i>`; both print as they decorate and as they run. Choose the stack above `hello` and follow the order of the lines.',
          controls: [{ id: 'stack', label: 'Above def hello', options: [{ value: 'bi', label: '`@bold` then `@italic`' }, { value: 'ib', label: '`@italic` then `@bold`' }, { value: 'b', label: '`@bold` only' }] }],
          variants: ['bi', 'ib', 'b'].map(orderVariant)
        },
        {
          id: 'wraps', title: 'Why functools.wraps', view: 'run',
          text: 'A wrapper replaces the function, so tools that read its name or documentation (`help()`, logging, pytest, FastAPI) see the wrapper instead. `@functools.wraps(func)` copies them over.',
          controls: [{ id: 'wraps', label: 'The wrapper', options: [{ value: 'plain', label: 'without `@wraps`' }, { value: 'wraps', label: 'with `@functools.wraps(func)`' }] }],
          variants: ['plain', 'wraps'].map(function (w) {
            return {
              when: { wraps: w },
              code: (w === 'wraps' ? 'import functools\n\n' : '') + lines('def logged(func):') + (w === 'wraps' ? '    @functools.wraps(func)\n' : '') +
                lines('    def wrapper(*args):', '        print(f"calling {func.__name__}{args}")', '        return func(*args)', '    return wrapper', '',
                  '@logged', 'def add(a, b):', '    """Add two numbers."""', '    return a + b', '', 'print(add(2, 3))', 'print("name:", add.__name__)', 'print("doc: ", add.__doc__)'),
              expect: w === 'wraps' ? ['calling add(2, 3)', '5', 'name: add', 'doc:  Add two numbers.'] : ['calling add(2, 3)', '5', 'name: wrapper', 'doc:  None'],
              note: w === 'wraps' ? '`functools.wraps(func)` is itself a decorator: it copies `__name__`, `__doc__` and more from `func` onto `wrapper`, and stores the original as `add.__wrapped__`. Use it in every decorator you write.' :
                'Without it, `add` reports the wrapper\'s name and has no documentation. The program still works, but error messages, `help(add)` and frameworks that look functions up by name now see "wrapper".'
            };
          })
        },
        {
          id: 'args', title: 'A decorator that takes arguments', view: 'trace',
          text: '`@repeat(n)` first calls `repeat(n)`, which returns the real decorator. That makes three nested functions; in the picture the final `wrapper` has captured both `times` and `func`.',
          controls: [{ id: 'times', label: 'repeat(...)', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }] }],
          variants: ['1', '2', '3'].map(function (t) {
            var expect = [];
            for (var i = 0; i < +t; i++) expect.push('Go, Asha!');
            return {
              when: { times: t },
              code: lines('def repeat(times):', '    def decorate(func):', '        def wrapper(*args):', '            for _ in range(times):', '                func(*args)', '        return wrapper', '    return decorate', '',
                '@repeat(' + t + ')', 'def cheer(name):', '    print(f"Go, {name}!")', '', 'cheer("Asha")'),
              expect: expect,
              note: '`@repeat(' + t + ')` means `cheer = repeat(' + t + ')(cheer)`: `repeat` returns `decorate`, which returns `wrapper`. Each level remembers what it was given, so `wrapper` knows both how many times and what to call. Spring\'s `@Retryable(maxAttempts = 3)` is the same idea, built with a proxy.'
            };
          })
        }
      ]
    },

    {
      id: 'dict-hashing', title: 'How a dict finds a key',
      summary: 'A dict turns each key into a number, its hash, uses it to pick a slot, and tries other slots when one is taken. See collisions, why a list cannot be a key, and why 1, 1.0 and True are one key.',
      keywords: ['dict', 'hash', 'hashing', 'hash table', 'hashmap', 'slot', 'collision', 'probing', 'hashable', 'unhashable', 'key', '__hash__', 'hashcode'],
      intro: 'A `dict` is a **hash table**, like Java\'s `HashMap`. To store a key, Python calls `hash(key)`, uses the last few bits of that number as a slot number, and looks there. If another key already sits in that slot (a **collision**), it tries other slots in a fixed order until it finds a free one. Looking a key up repeats the same steps, so it takes about the same time however big the dict is. A `set` works the same way, without the values. Lesson: [[lesson:py-equality]].',
      experiments: [
        {
          id: 'slots', title: 'Which slot does each key land in?', view: 'run',
          text: 'CPython keeps its slot table hidden, so this program rebuilds it with the same formula CPython uses (`Objects/dictobject.c`), for a new dict\'s 8 slots. A small whole number is its own hash, which makes the arithmetic easy to follow. The last line asks the real dict.',
          controls: [{ id: 'keys', label: 'Keys to add', options: [
            { value: 'spread', label: '3, 4, 5' }, { value: 'clash', label: '1, 9, 17' }, { value: 'many', label: '1, 9, 17, 25, 33' }] }],
          variants: [
            slotsVariant('spread', [3, 4, 5], ['key  3: hash  3 -> slot 3', 'key  4: hash  4 -> slot 4', 'key  5: hash  5 -> slot 5', 'index table: [None, None, None, 3, 4, 5, None, None]'],
              'Each key\'s hash, kept to its last 3 bits (`hash & 7`, the same as `% 8` here), is a free slot: no collisions, one look per key. This is the usual case, and why `key in d` is fast.'),
            slotsVariant('clash', [1, 9, 17], ['key  1: hash  1 -> slot 1', 'key  9: hash  9 -> slot 6  (slot 1 taken, then tried [6])', 'key 17: hash 17 -> slot 7  (slot 1 taken, then tried [6, 7])', 'index table: [None, 1, None, None, None, None, 9, 17]'],
              '1, 9 and 17 all end in the same 3 bits (`001`), so all three want slot 1: a **collision**. The second key probes on to slot 6, the third to 6 and then 7. The next slot to try is worked out from the current one and the higher bits of the hash (`i = 5 * i + 1 + perturb`), so keys that collide spread out instead of piling up. A lookup follows the same path, comparing each key it meets with `==`.'),
            slotsVariant('many', [1, 9, 17, 25, 33], ['key 25: hash 25 -> slot 4  (slot 1 taken, then tried [6, 7, 4])', 'key 33: hash 33 -> slot 5  (slot 1 taken, then tried [7, 4, 5])', 'index table: [None, 1, None, None, 25, 33, 9, 17]'],
              'Five keys in eight slots: the table is getting full and each collision costs more tries. Notice 33 takes a different path from 25: its higher bits (`perturb`) are not zero. CPython never lets it get this crowded: a dict grows (doubling its table and re-placing every key) once it is two-thirds full, so a lookup stays a try or two. Java\'s `HashMap` resizes at three-quarters full.')
          ]
        },
        {
          id: 'keys', title: 'Which values can be keys?', view: 'run',
          text: 'A key\'s hash must never change while it is in the dict, or the dict looks in the wrong slot. So Python refuses keys that can change. Try each one.',
          controls: [{ id: 'key', label: 'Use as the key', options: [
            { value: 'tuple', label: 'a tuple' }, { value: 'list', label: 'a list' }, { value: 'frozenset', label: 'a frozenset' }, { value: 'mutated', label: 'an object that changes' }] }],
          variants: [
            { when: { key: 'tuple' },
              code: lines('point = (1, 2)', 'places = {point: "home"}', 'print("same hash for an equal tuple:", hash(point) == hash((1, 2)))', 'print("lookup with an equal tuple:", places[(1, 2)])'),
              expect: ['same hash for an equal tuple: True', 'lookup with an equal tuple: home'],
              note: 'A tuple cannot change, so its hash (worked out from its items) cannot either. Equal tuples have equal hashes, so a **different but equal** tuple finds the entry: lookups go by value, not by object.' },
            { when: { key: 'list' },
              code: lines('point = [1, 2]', 'try:', '    places = {point: "home"}', 'except TypeError as e:', '    print("TypeError:", e)', 'print("as a tuple:", {tuple(point): "home"})'),
              expect: ["TypeError: unhashable type: 'list'", "as a tuple: {(1, 2): 'home'}"],
              note: 'A list can change, so it has no hash at all (`list.__hash__` is `None`). Java lets you use an `ArrayList` as a `HashMap` key and silently breaks if you change it; Python refuses up front. Convert to a tuple when you need a list as a key.' },
            { when: { key: 'frozenset' },
              code: lines('tags = frozenset({"python", "java"})', 'groups = {tags: "polyglot"}', 'print(groups[frozenset({"java", "python"})])', 'try:', '    {{"python"}: 1}', 'except TypeError as e:', '    print("a set:", e)'),
              expect: ['polyglot', "a set: unhashable type: 'set'"],
              note: 'A `set` can change, so it cannot be a key; a `frozenset` cannot change, so it can. Items in a set must be hashable for the same reason.' },
            { when: { key: 'mutated' },
              code: lines('class Badge:', '    def __init__(self, name):', '        self.name = name', '', '    def __eq__(self, other):', '        return isinstance(other, Badge) and self.name == other.name', '',
                '    def __hash__(self):', '        return hash(self.name)          # depends on a field that can change', '',
                'b = Badge("gold")', 'owners = {b: "Asha"}', 'print("before:", b in owners)', 'b.name = "silver"                       # its hash changes now', 'print("after: ", b in owners)', 'print("still stored:", list(owners.values()))'),
              expect: ['before: True', 'after:  False', "still stored: ['Asha']"],
              note: 'Python trusts your `__hash__`. After `b.name` changes, `b` hashes to a different slot, so the dict looks there and finds nothing, although the entry is still inside. Hash only fields that never change: make them read-only, or use `@dataclass(frozen=True)`. Java has exactly this bug with a mutable key in a `HashMap`.' }
          ]
        },
        {
          id: 'equal-keys', title: '1, 1.0 and True: one key', view: 'run',
          text: 'A dict decides that two keys are the same key when their hashes match **and** they are `==`. Which of these values are the same key?',
          controls: [{ id: 'keys', label: 'Store under', options: [{ value: 'numbers', label: '`1`, `1.0` and `True`' }, { value: 'mixed', label: '`1` and `"1"`' }] }],
          variants: [
            { when: { keys: 'numbers' },
              code: lines('d = {}', 'd[1] = "int"', 'd[1.0] = "float"', 'd[True] = "bool"', 'print(d)', 'print(hash(1), hash(1.0), hash(True), 1 == 1.0 == True)'),
              expect: ["{1: 'bool'}", '1 1 1 True'],
              note: '`1 == 1.0 == True`, and Python guarantees that equal numbers have equal hashes, so all three are **one** key: the dict keeps the first key object (`1`) and the last value. In Java, `Integer` 1 and `Long` 1L are different `HashMap` keys, because `Integer.equals(Long)` is false.' },
            { when: { keys: 'mixed' },
              code: lines('d = {}', 'd[1] = "int"', 'd["1"] = "str"', 'print(d)', 'print(1 == "1")'),
              expect: ["{1: 'int', '1': 'str'}", 'False'],
              note: 'A number and a string are never equal in Python (no automatic conversion, unlike JavaScript), so they are two keys. Data read from a file or JSON often has `"1"` where you expected `1`: convert with `int()` before using it as a key.' }
          ]
        }
      ]
    },

    {
      id: 'mro', title: 'The method resolution order',
      summary: 'Build a class hierarchy, including the diamond that Java does not allow, and see the order Python searches it: which method runs, and where super() goes next.',
      keywords: ['mro', 'method resolution order', 'inheritance', 'multiple inheritance', 'diamond', 'super', 'c3', 'mixin', '__mro__'],
      intro: 'When you call `obj.method()`, Python searches the object\'s class, then the classes it inherits from, in one fixed order: the **method resolution order** (MRO), which `Class.__mro__` shows. With one parent per class it is simply up the chain, as in Java. Python also allows several parents (Java allows that only for interfaces); then the order follows the **C3** rule: a class always comes before its parents, and parents keep the order they are listed in. Lesson: [[lesson:py-inheritance]].',
      experiments: [
        {
          id: 'diamond', title: 'Which hello() runs?', view: 'run',
          text: '`B` and `C` both inherit from `A`, and `D` inherits from both: a **diamond**. Choose the order of `D`\'s parents and which classes define their own `hello`; `D` defines none.',
          controls: [
            { id: 'bases', label: 'class D(...)', options: [{ value: 'BC', label: '`D(B, C)`' }, { value: 'CB', label: '`D(C, B)`' }] },
            { id: 'own', label: 'hello() is defined in', options: [{ value: 'BC', label: 'A, B and C' }, { value: 'C', label: 'A and C' }, { value: 'A', label: 'A only' }] }],
          variants: product([{ id: 'bases', options: [{ value: 'BC' }, { value: 'CB' }] }, { id: 'own', options: [{ value: 'BC' }, { value: 'C' }, { value: 'A' }] }]).map(diamondVariant)
        },
        {
          id: 'super', title: 'super() follows the MRO, not the parent', view: 'run',
          text: 'Each `greet` prints a line and passes the call on. Compare `super().greet()` with calling the parent class by name, the way Java code calls `super`.',
          controls: [
            { id: 'bases', label: 'class D(...)', options: [{ value: 'BC', label: '`D(B, C)`' }, { value: 'CB', label: '`D(C, B)`' }] },
            { id: 'call', label: 'B and C pass on with', options: [{ value: 'super', label: '`super().greet()`' }, { value: 'direct', label: '`A.greet(self)`' }] }],
          variants: product([{ id: 'bases', options: [{ value: 'BC' }, { value: 'CB' }] }, { id: 'call', options: [{ value: 'super' }, { value: 'direct' }] }]).map(superVariant)
        },
        {
          id: 'conflict', title: 'An order that cannot exist', view: 'run',
          text: '`X` lists its parents as `A, B`. Choose how `Y` lists them, then let `Z` inherit from both `X` and `Y`.',
          controls: [{ id: 'order', label: 'class Y(...)', options: [{ value: 'same', label: '`Y(A, B)`' }, { value: 'swapped', label: '`Y(B, A)`' }] }],
          variants: ['same', 'swapped'].map(function (o) {
            return {
              when: { order: o },
              code: lines('class A:', '    pass', '', 'class B:', '    pass', '', 'class X(A, B):', '    pass', '', 'class Y(' + (o === 'same' ? 'A, B' : 'B, A') + '):', '    pass', '',
                'try:', '    class Z(X, Y):', '        pass', '    print("MRO:", " -> ".join(k.__name__ for k in Z.__mro__))', 'except TypeError as e:', '    print("TypeError:", e)'),
              expect: o === 'same' ? ['MRO: Z -> X -> Y -> A -> B -> object'] : ['TypeError: Cannot create a consistent method resolution order (MRO)'],
              note: o === 'same' ? 'Both parents agree that `A` comes before `B`, so C3 can merge their orders: `Z`, then `X` and `Y` (in the order listed), then `A`, `B`, `object`.' :
                '`X` says `A` before `B`; `Y` says `B` before `A`. No single order keeps both promises, so Python refuses to create `Z` at all, when the `class` statement runs. Java avoids the question by allowing only one superclass.'
            };
          })
        }
      ]
    },

    {
      id: 'identity', title: '== versus is',
      summary: 'Equal values, or the same object? See what == and is answer for copies and aliases, how the small-integer cache and string interning make is look right by accident, and what == does for your own class.',
      keywords: ['is', '==', 'identity', 'equality', 'equals', 'id', 'small integer cache', 'interning', 'reference equality', 'same object'],
      intro: '`a == b` asks whether two values are **equal**: it calls `a.__eq__(b)`, which is Python\'s `equals()`. `a is b` asks whether two names point at the **same object**, which is what Java\'s `==` does for objects. You almost always want `==`; `is` is for `None` (`x is None`) and for checking aliasing. Lesson: [[lesson:py-references]].',
      experiments: [
        {
          id: 'lists', title: 'Same object, or equal objects?', view: 'trace',
          text: 'Make `b` in one of four ways and compare it with `a`. In the picture, one box with two arrows is one object; two boxes are two objects, however alike.',
          controls: [{ id: 'make', label: 'b =', options: [
            { value: 'alias', label: '`a`' }, { value: 'copy', label: '`list(a)`' }, { value: 'literal', label: '`[1, 2, 3]`' }, { value: 'other', label: '`[3, 2, 1]`' }] }],
          variants: [
            identityVariant('alias', 'b = a', true, true, '`b = a` copies nothing: one list, two names. So `is` is true, and `==` is true because an object always equals itself.'),
            identityVariant('copy', 'b = list(a)', true, false, '`list(a)` builds a **new** list with the same items: equal (`==` compares the items one by one) but not the same object. Java: `a.equals(b)` true, `a == b` false.'),
            identityVariant('literal', 'b = [1, 2, 3]', true, false, 'Writing the same list again also makes a new list. Equal content, two objects.'),
            identityVariant('other', 'b = [3, 2, 1]', false, false, 'Same items in another order: lists compare position by position, so they are not equal (a `set` would be).')
          ]
        },
        {
          id: 'small-ints', title: 'The small-integer cache', view: 'run',
          text: 'Two equal numbers, made while the program runs. Are they the same object? Try numbers inside and outside the range -5 to 256.',
          controls: [{ id: 'n', label: 'Both are', options: [{ value: '256', label: '256' }, { value: '257', label: '257' }, { value: '-5', label: '-5' }, { value: '-6', label: '-6' }] }],
          variants: ['256', '257', '-5', '-6'].map(function (n) {
            var cached = n === '256' || n === '-5';
            return {
              when: { n: n },
              code: lines('a = int("' + n + '")          # made while the program runs', 'b = int("' + n + '")', 'print("a == b:", a == b)', 'print("a is b:", a is b)'),
              expect: ['a == b: True', 'a is b: ' + (cached ? 'True' : 'False')],
              note: cached ? 'CPython makes one object for each integer from -5 to 256 when it starts, and hands those out every time, so equal small integers are the **same** object. Code that compares numbers with `is` seems to work, until a number gets bigger. (Java caches `Integer` values from -128 to 127 the same way, with the same trap for `==`.)' :
                'Outside -5 to 256, each `int(...)` makes a new object: equal, but not identical. Always compare numbers with `==`. (Numbers written as constants in one file may share an object, which hides the problem even more: the program here builds them with `int()` on purpose.)'
            };
          })
        },
        {
          id: 'strings', title: 'Strings: interning', view: 'run',
          text: 'Two equal strings: written as literals, built while the program runs, or passed through `sys.intern`.',
          controls: [{ id: 'how', label: 'Make them', options: [{ value: 'literals', label: 'two literals' }, { value: 'built', label: 'one built with join' }, { value: 'interned', label: '`sys.intern` both' }] }],
          variants: [
            { when: { how: 'literals' }, code: lines('a = "hello"', 'b = "hello"', 'print("a == b:", a == b)', 'print("a is b:", a is b)'),
              expect: ['a == b: True', 'a is b: True'],
              note: 'Python stores a constant that appears twice in a file once, and keeps short name-like strings in a shared table (it **interns** them), so these two literals are one object. Like Java\'s string pool for literals.' },
            { when: { how: 'built' }, code: lines('a = "hello"', 'b = "".join(["hel", "lo"])', 'print("a == b:", a == b)', 'print("a is b:", a is b)'),
              expect: ['a == b: True', 'a is b: False'],
              note: 'A string built at run time is a new object. Same text, so `==` is true; different objects, so `is` is false. This is why `is` must never be used to compare text: whether it "works" depends on how the string was made.' },
            { when: { how: 'interned' }, code: lines('import sys', '', 'a = sys.intern("hello")', 'b = sys.intern("".join(["hel", "lo"]))', 'print("a == b:", a == b)', 'print("a is b:", a is b)'),
              expect: ['a == b: True', 'a is b: True'],
              note: '`sys.intern` returns the one shared copy of a string, so interned equal strings are identical. Python does this for names in your code to make dict lookups faster; you rarely need it yourself. Java: `String.intern()`.' }
          ]
        },
        {
          id: 'eq', title: '== on your own class', view: 'run',
          text: 'Two `Point` objects with the same coordinates. What does `==` say, with and without an `__eq__` method?',
          controls: [{ id: 'eq', label: 'Point has', options: [{ value: 'none', label: 'no `__eq__`' }, { value: 'defined', label: 'an `__eq__`' }] }],
          variants: ['none', 'defined'].map(function (v) {
            var code = ['class Point:', '    def __init__(self, x, y):', '        self.x, self.y = x, y'];
            if (v === 'defined') code.push('', '    def __eq__(self, other):', '        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)');
            code.push('', 'p, q = Point(1, 2), Point(1, 2)', 'print("p == q:", p == q)', 'print("p is q:", p is q)', 'print("p == p:", p == p)');
            return {
              when: { eq: v }, code: lines.apply(null, code),
              expect: v === 'none' ? ['p == q: False', 'p is q: False', 'p == p: True'] : ['p == q: True', 'p is q: False', 'p == p: True'],
              note: v === 'none' ? 'Without `__eq__`, a class inherits `object.__eq__`, which compares identity: `==` behaves like `is`. Exactly Java\'s rule: without an `equals` override, `equals` is `==`.' :
                'With `__eq__`, `==` compares the values you chose. The two points are equal but still two objects. Defining `__eq__` also makes the class unhashable until you add a matching `__hash__` (see [[explain:dict-hashing]]).'
            };
          })
        }
      ]
    },

    {
      id: 'concurrency', title: 'Threads, processes and asyncio',
      summary: 'The same work done one after the other, in threads, in processes and as coroutines, timed on your PC: where the GIL matters, why a race loses updates, and how many workers a pool needs.',
      keywords: ['concurrency', 'parallel', 'thread', 'threads', 'process', 'processes', 'asyncio', 'gil', 'global interpreter lock', 'race condition', 'lock', 'threadpoolexecutor', 'processpoolexecutor', 'cpu-bound', 'io-bound', 'speed-up'],
      intro: 'Python has three ways to do several things at once. **Threads** share one Python and take turns at running Python code (the GIL), but a thread that waits lets the others run. **Processes** are separate Pythons, each with its own GIL, so they really compute at the same time. **asyncio** runs coroutines on one thread, switching at every `await`. Which one wins depends on whether the work **waits** (the network, a disk) or **computes**. Every experiment here times real work on your PC, so the numbers are your machine\'s. Lessons: [[lesson:py-threads]], [[lesson:py-multiprocessing]], [[lesson:py-asyncio]].',
      experiments: [
        {
          id: 'four-ways', title: 'The same work, four ways', view: 'run', runtimes: ['server'], runtimeWhy: SERVER_WHY,
          text: 'Four tasks that either **wait** 0.3 s each (like a network call) or **compute** for a similar time (a busy countdown). Each program first runs them one after the other, then the way you choose, and prints both times.',
          controls: [
            { id: 'work', label: 'Each task', options: [{ value: 'wait', label: 'waits' }, { value: 'compute', label: 'computes' }] },
            { id: 'way', label: 'Run the four', options: [{ value: 'threads', label: 'in 4 threads' }, { value: 'processes', label: 'in 4 processes' }, { value: 'asyncio', label: 'as coroutines' }] }],
          variants: product([{ id: 'work', options: [{ value: 'wait' }, { value: 'compute' }] }, { id: 'way', options: [{ value: 'threads' }, { value: 'processes' }, { value: 'asyncio' }] }]).map(fourWaysVariant)
        },
        {
          id: 'lost-updates', title: 'Does the GIL stop a race?', view: 'run', runtimes: ['server'], runtimeWhy: SERVER_WHY,
          text: 'Four threads each add 1 to a shared balance 1,000 times: read it, then write it back plus one. The `time.sleep(0)` between the read and the write lets another thread in at the worst moment, which in real code happens only now and then.',
          controls: [{ id: 'lock', label: 'The update is', options: [{ value: 'none', label: 'unprotected' }, { value: 'lock', label: 'inside `with lock:`' }] }],
          variants: ['none', 'lock'].map(lostUpdatesVariant)
        },
        {
          id: 'workers', title: 'How many workers?', view: 'run', runtimes: ['server'], runtimeWhy: SERVER_WHY,
          text: 'Eight tasks that each wait 0.2 s, handed to a thread pool. Change how many threads the pool may use.',
          controls: [{ id: 'workers', label: 'max_workers', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '4', label: '4' }, { value: '8', label: '8' }, { value: '16', label: '16' }] }],
          variants: ['1', '2', '4', '8', '16'].map(workersVariant)
        }
      ]
    },

    {
      id: 'event-loop', title: 'The asyncio event loop',
      summary: 'Step through a twenty-line event loop to see coroutines wait and resume; then watch real asyncio run coroutines one after another, together, or as tasks, and stall when one of them blocks.',
      keywords: ['event loop', 'asyncio', 'coroutine', 'await', 'async', 'scheduler', 'task', 'gather', 'create_task', 'blocking', 'non-blocking', 'concurrency', 'yield'],
      intro: 'An **event loop** is a loop around two lists: the coroutines that are **ready** to run, and the ones **sleeping** until some moment. Each turn it takes the next ready coroutine and runs it until it waits again; when nothing is ready, it jumps ahead to the next wake-up. asyncio\'s loop is exactly that, plus waiting on network connections. The first experiment is a whole event loop in twenty lines, built from generators ([[lesson:py-generators]]); the others use the real one. Lesson: [[lesson:py-asyncio]].',
      experiments: [
        {
          id: 'toy-loop', title: 'An event loop, one turn at a time', view: 'run',
          text: 'Coroutine `A` waits 0.3 s once; coroutine `B` waits 0.1 s twice. Their `yield` means "wake me after this many seconds". The clock is the loop\'s own, so it jumps instead of really waiting. Press **next turn** to run the loop one more turn.',
          controls: [{ id: 'turns', label: 'Turns so far', kind: 'stepper', button: 'next turn', options: TOY_LABELS.map(function (l, k) { return { value: String(k), label: l }; }) }],
          variants: TOY_LABELS.map(function (l, k) { return toyVariant(k); })
        },
        {
          id: 'together', title: 'One after another, or together?', view: 'run',
          text: '`A` waits 0.3 s and `B` waits 0.2 s. Each line shows the time since the program started. Choose how `main` runs them.',
          controls: [{ id: 'how', label: 'main does', options: [{ value: 'await', label: '`await A`, then `await B`' }, { value: 'gather', label: '`await gather(A, B)`' }, { value: 'tasks', label: '`create_task` both, then `await`' }] }],
          variants: ['await', 'gather', 'tasks'].map(togetherVariant)
        },
        {
          id: 'blocking', title: 'One blocking call stops everything', view: 'run',
          text: 'A heartbeat coroutine ticks every 0.1 s. Another coroutine does 0.45 s of slow work. Does the heartbeat keep ticking meanwhile?',
          controls: [{ id: 'work', label: 'The slow work', options: [{ value: 'await', label: '`await asyncio.sleep(0.45)`' }, { value: 'busy', label: 'a busy loop for 0.45 s' }] }],
          variants: ['await', 'busy'].map(blockingVariant)
        }
      ]
    },

    {
      id: 'memory', title: 'Memory: reference counts, cycles and __slots__',
      summary: 'Count the references to an object line by line until it is freed; see a reference cycle survive until the garbage collector runs, and a weak reference avoid it; and measure what an object costs with and without __slots__.',
      keywords: ['memory', 'reference count', 'refcount', 'getrefcount', 'garbage collection', 'gc', 'cycle', 'weakref', 'weak reference', '__slots__', 'slots', 'tracemalloc', 'getsizeof', 'dataclass', 'namedtuple', 'leak'],
      intro: 'CPython counts the references to every object (names, list slots, attributes) and frees the object the moment the count reaches zero. Objects that refer to each other in a circle never reach zero, so a second mechanism, the cycle collector (`gc`), finds and frees them from time to time. The experiments below make both visible, then measure what one object costs. Lessons: [[lesson:py-memory]], [[lesson:py-walrus-slots]].',
      experiments: [
        {
          id: 'refcount', title: 'Counting references', view: 'run',
          text: 'One object, and the references to it, added and removed one line at a time. After each line the program prints how many references the object has. Press **next line**.',
          controls: [{ id: 'step', label: 'Lines run', kind: 'stepper', button: 'next line', options: REF_STEPS.map(function (s, k) { return { value: String(k), label: s[0] }; }) }],
          variants: REF_STEPS.map(function (s, k) { return refVariant(k); })
        },
        {
          id: 'cycles', title: 'A cycle, and who frees it', view: 'run',
          text: 'Two nodes, `a` and `b`, with `a.next = b`. Choose how `b` refers back to `a`, and whether the garbage collector runs after the names are deleted. The automatic collector is switched off, so nothing happens behind your back; each node prints a line when it is freed.',
          controls: [
            { id: 'back', label: 'b.back is', options: [{ value: 'none', label: 'not set' }, { value: 'strong', label: '`a` (a cycle)' }, { value: 'weak', label: '`weakref.ref(a)`' }] },
            { id: 'collect', label: 'Afterwards', options: [{ value: 'no', label: 'nothing' }, { value: 'yes', label: '`gc.collect()`' }] }],
          variants: product([{ id: 'back', options: [{ value: 'none' }, { value: 'strong' }, { value: 'weak' }] }, { id: 'collect', options: [{ value: 'no' }, { value: 'yes' }] }]).map(cycleVariant)
        },
        {
          id: 'slots', title: 'What does one object cost?', view: 'run',
          text: '50,000 points with an `x` and a `y`, made five ways. `tracemalloc` measures the memory they took, list slot included; `sys.getsizeof` reports the size of one object on its own. The numbers are this Python\'s: a 64-bit PC and the in-browser Python (32-bit WebAssembly) differ.',
          controls: [{ id: 'kind', label: 'Point is', options: [{ value: 'plain', label: 'a plain class' }, { value: 'slots', label: 'a class with `__slots__`' }, { value: 'dataclass', label: '`@dataclass`' }, { value: 'dataclass-slots', label: '`@dataclass(slots=True)`' }, { value: 'namedtuple', label: 'a `namedtuple`' }] }],
          variants: ['plain', 'slots', 'dataclass', 'dataclass-slots', 'namedtuple'].map(slotsSizeVariant)
        }
      ]
    }
  ];

  /* ---------------------------------------------------------------- helpers for the batch 3 explainers */

  function slotsVariant(id, keys, expect, note) {
    var code = lines(
      'import sys',
      '',
      'def slot_order(h, size):',
      '    """The slots CPython\'s dict tries for a hash, in order (Objects/dictobject.c)."""',
      '    mask = size - 1',
      '    perturb = h & ((1 << sys.hash_info.width) - 1)    # C treats the hash as unsigned',
      '    i = h & mask',
      '    while True:',
      '        yield i',
      '        perturb >>= 5',
      '        i = (i * 5 + perturb + 1) & mask',
      '',
      'keys = [' + keys.join(', ') + ']',
      'table = [None] * 8',
      'for key in keys:',
      '    tried = []',
      '    for slot in slot_order(hash(key), 8):',
      '        tried.append(slot)',
      '        if table[slot] is None:',
      '            table[slot] = key',
      '            break',
      '    extra = "" if len(tried) == 1 else f"  (slot {tried[0]} taken, then tried {tried[1:]})"',
      '    print(f"key {key:>2}: hash {hash(key):>2} -> slot {tried[-1]}{extra}")',
      'print("index table:", table)',
      'd = dict.fromkeys(keys)',
      'print("the real dict finds every key:", all(k in d for k in keys))');
    return { when: { keys: id }, code: code, expect: expect.concat(['the real dict finds every key: True']), note: note };
  }

  function diamondVariant(w) {
    var own = { BC: ['B', 'C'], C: ['C'], A: [] }[w.own];
    var code = ['class A:', '    def hello(self):', '        return "A.hello"', ''];
    ['B', 'C'].forEach(function (k) {
      code.push('class ' + k + '(A):');
      if (own.indexOf(k) >= 0) code.push('    def hello(self):', '        return "' + k + '.hello"');
      else code.push('    pass');
      code.push('');
    });
    var bases = w.bases === 'BC' ? ['B', 'C'] : ['C', 'B'];
    code.push('class D(' + bases.join(', ') + '):', '    pass', '', 'print("MRO:", " -> ".join(k.__name__ for k in D.__mro__))', 'print("D().hello() runs", D().hello())');
    var mro = ['D'].concat(bases, ['A', 'object']);
    var found = mro.filter(function (k) { return k === 'A' || own.indexOf(k) >= 0; })[0];
    var why = found === 'A' ? 'Neither `B` nor `C` defines `hello`, so the search reaches `A`.' :
      w.own === 'C' && bases[0] === 'B' ? 'This is the surprise: `B` has no `hello`, and the next class searched is **`C`**, not `B`\'s parent `A`, because C3 puts `A` after every class that inherits from it. So a method of `D`\'s second parent wins over one of `B`\'s own parent.' :
        'The first class in the MRO that defines `hello` wins: `' + found + '`, because it is listed ' + (bases[0] === found ? 'first' : 'before `A`') + '.';
    return {
      when: { bases: w.bases, own: w.own }, code: lines.apply(null, code),
      expect: ['MRO: ' + mro.join(' -> '), 'D().hello() runs ' + found + '.hello'],
      note: 'The MRO is `' + mro.join(' → ') + '`: `D` first, its parents in the order written, then `A` once, then `object`. ' + why
    };
  }

  function superVariant(w) {
    var bases = w.bases === 'BC' ? ['B', 'C'] : ['C', 'B'];
    var code = ['class A:', '    def greet(self):', '        print("  A.greet")', ''];
    ['B', 'C'].forEach(function (k) {
      code.push('class ' + k + '(A):', '    def greet(self):');
      if (w.call === 'super') code.push('        print("  ' + k + '.greet, then super()")', '        super().greet()');
      else code.push('        print("  ' + k + '.greet, then A.greet")', '        A.greet(self)');
      code.push('');
    });
    code.push('class D(' + bases.join(', ') + '):', '    def greet(self):', '        print("  D.greet, then super()")', '        super().greet()', '',
      'print("MRO:", " -> ".join(k.__name__ for k in D.__mro__))', 'D().greet()');
    var expect = ['MRO: D -> ' + bases.join(' -> ') + ' -> A -> object', '  D.greet, then super()'];
    if (w.call === 'super') expect.push('  ' + bases[0] + '.greet, then super()', '  ' + bases[1] + '.greet, then super()', '  A.greet');
    else expect.push('  ' + bases[0] + '.greet, then A.greet', '  A.greet');
    return {
      when: { bases: w.bases, call: w.call }, code: lines.apply(null, code), expect: expect,
      note: w.call === 'super' ? '`super()` means "the **next class in the MRO** of the object", not "my parent". In `' + bases[0] + '`, the next class after it is `' + bases[1] + '`, a class `' + bases[0] + '` knows nothing about. So every `greet` runs exactly once, `A`\'s last. This cooperation is what makes mixins work, and the reason to always call `super()` rather than the parent by name.' :
        'Calling `A.greet(self)` by name skips the MRO: `' + bases[0] + '` jumps straight to `A`, and `' + bases[1] + '.greet` **never runs**. With single inheritance both ways look the same, which is how this bug hides until someone adds a second parent.'
    };
  }

  function identityVariant(id, line, eq, same, note) {
    return {
      when: { make: id },
      code: lines('a = [1, 2, 3]', line, 'print("a == b:", a == b)', 'print("a is b:", a is b)'),
      expect: ['a == b: ' + (eq ? 'True' : 'False'), 'a is b: ' + (same ? 'True' : 'False')], note: note
    };
  }

  /* ---------------------------------------------------------------- helpers for the batch 4 explainers */

  function fourWaysVariant(w) {
    var wait = w.work === 'wait';
    var countdown = ['    n = 15_000_000                   # computing: a busy countdown', '    while n > 0:', '        n -= 1'];
    var code = w.way === 'asyncio' ? ['import asyncio', 'import time'] :
      ['import time', 'from concurrent.futures import ' + (w.way === 'threads' ? 'ThreadPoolExecutor' : 'ProcessPoolExecutor')];
    code.push('', '', 'def task(i):');
    code = code.concat(wait ? ['    time.sleep(0.3)                  # waiting: like a network call'] : countdown);
    code.push('    return i', '');
    if (w.way === 'asyncio') {
      code.push('', 'async def coro(i):');
      code = code.concat(wait ? ['    await asyncio.sleep(0.3)         # waiting, and letting the others run'] :
        ['    n = 15_000_000                   # computing: it never awaits', '    while n > 0:', '        n -= 1']);
      code.push('    return i', '', '', 'async def all_four():', '    return list(await asyncio.gather(*(coro(i) for i in range(4))))', '');
    }
    var what = wait ? 'waiting' : 'computing';
    var label = { threads: 'in 4 threads', processes: 'in 4 processes', asyncio: 'as coroutines' }[w.way];
    code.push('', 'if __name__ == "__main__":', '    t0 = time.perf_counter()', '    alone = [task(i) for i in range(4)]', '    one_by_one = time.perf_counter() - t0', '', '    t0 = time.perf_counter()');
    if (w.way === 'asyncio') code.push('    together = asyncio.run(all_four())');
    else code.push('    with ' + (w.way === 'threads' ? 'ThreadPoolExecutor' : 'ProcessPoolExecutor') + '(max_workers=4) as pool:', '        together = list(pool.map(task, range(4)))');
    code.push('    elapsed = time.perf_counter() - t0', '',
      '    print(f"4 ' + what + ' tasks, one after the other: {one_by_one:.2f} s")',
      '    print(f"4 ' + what + ' tasks, ' + label + ': {elapsed:.2f} s")',
      '    print(f"speed-up: {one_by_one / elapsed:.1f}x; the same results: {alone == together}")');
    var notes = {
      'wait threads': 'Sleeping, like waiting for the network or a disk, **releases the GIL**, so the four waits overlap: about 0.3 s instead of 1.2 s, a speed-up close to 4. This is what threads are for in Python: work that waits.',
      'wait processes': 'The waits overlap here too, but starting four new Pythons costs time of its own (more on Windows), so the speed-up is smaller than with threads. Processes are the wrong tool for waiting.',
      'wait asyncio': 'One thread, and still about 0.3 s: each `await asyncio.sleep` hands control back to the event loop, which runs the next coroutine. Coroutines are much cheaper than threads, so this scales to thousands of waits ([[explain:event-loop]]).',
      'compute threads': 'No speed-up, and often a small slow-down: the GIL lets only one thread run Python code at a time, so the four countdowns take turns. (Python 3.13\'s experimental free-threaded build lifts this limit; the standard Python keeps it.)',
      'compute processes': 'Each process is a separate Python with its own GIL, so on a PC with several free cores the countdowns really run at the same time. The speed-up stays below 4: starting the processes costs time, and it depends on how many cores are free.',
      'compute asyncio': 'No speed-up at all: a coroutine that never `await`s never gives the loop a chance to run another one, so the four run one after the other. asyncio overlaps waiting, not computing.'
    };
    return {
      when: { work: w.work, way: w.way }, code: lines.apply(null, code),
      expect: ['4 ' + what + ' tasks, one after the other:', '4 ' + what + ' tasks, ' + label + ':', 'speed-up:', 'the same results: True'],
      note: notes[w.work + ' ' + w.way]
    };
  }

  function lostUpdatesVariant(lock) {
    var body = lock === 'lock' ?
      ['        with lock:                     # one thread at a time from here...', '            current = balance', '            time.sleep(0)', '            balance = current + 1      # ...to here'] :
      ['        current = balance              # read', '        time.sleep(0)                  # another thread may run here', '        balance = current + 1          # write'];
    var code = ['import threading', 'import time', '', 'balance = 0'];
    if (lock === 'lock') code.push('lock = threading.Lock()');
    code = code.concat(['', '', 'def deposit_many(n):', '    global balance', '    for _ in range(n):']).concat(body).concat(['', '',
      'threads = [threading.Thread(target=deposit_many, args=(1000,)) for _ in range(4)]', 'for t in threads:', '    t.start()', 'for t in threads:', '    t.join()',
      'print("expected 4000, got", balance)', 'print("lost updates:", balance != 4000)']);
    return {
      when: { lock: lock }, code: lines.apply(null, code),
      expect: lock === 'lock' ? ['expected 4000, got 4000', 'lost updates: False'] : ['expected 4000, got', 'lost updates: True'],
      note: lock === 'lock' ?
        'The `with lock:` block lets one thread in at a time, so each read-change-write finishes before the next one starts and no update is lost. Java\'s `synchronized` does the same.' :
        'Two threads read the same balance, both add one, and the second write overwrites the first: an update is lost, many times over. The GIL does not prevent it: it keeps Python\'s own data structures safe, not your read-then-write. Without the `sleep(0)` the window is tiny and the bug shows up only now and then, which is worse: it passes the tests and fails in production.'
    };
  }

  function workersVariant(w) {
    var notes = {
      1: 'One worker does the tasks one after another: 8 × 0.2 s, about 1.6 s. A pool with one thread is just a queue.',
      2: 'Two tasks wait at a time: four rounds of 0.2 s, about 0.8 s.',
      4: 'Four at a time: two rounds, about 0.4 s.',
      8: 'One worker per task: all eight wait at the same time, one round, about 0.2 s.',
      16: 'No faster than 8: there are only eight tasks, so the pool never needs more than eight threads. For waiting work, size a pool by how many waits you want in flight; for computing work in processes, by the number of cores (`os.cpu_count()`).'
    };
    return {
      when: { workers: w },
      code: lines('import time', 'from concurrent.futures import ThreadPoolExecutor', '', '', 'def task(i):', '    time.sleep(0.2)                  # waiting, like a network call', '    return i', '', '',
        't0 = time.perf_counter()', 'with ThreadPoolExecutor(max_workers=' + w + ') as pool:', '    results = list(pool.map(task, range(8)))', 'took = time.perf_counter() - t0',
        'print(f"8 tasks of 0.2 s with max_workers=' + w + ': {took:.2f} s")', 'print("rounds of waiting:", round(took / 0.2))'),
      expect: ['8 tasks of 0.2 s with max_workers=' + w + ':', 'rounds of waiting'],
      note: notes[w]
    };
  }

  function toyVariant(k) {
    var expect = [
      ['start: clock 0.0 s', 'ready: A, B | sleeping: nothing'],
      ['turn 1', 'A runs, then waits 0.3 s', 'ready: B | sleeping: A until 0.3 s'],
      ['turn 2', 'B runs, then waits 0.1 s', 'ready: nothing | sleeping: B until 0.1 s, A until 0.3 s'],
      ['turn 3', 'the clock jumps to 0.1 s: B wakes up', 'B runs, then waits 0.1 s', 'ready: nothing | sleeping: B until 0.2 s, A until 0.3 s'],
      ['turn 4', 'the clock jumps to 0.2 s: B wakes up', 'B runs to its end', 'ready: nothing | sleeping: A until 0.3 s'],
      ['turn 5', 'the clock jumps to 0.3 s: A wakes up', 'A runs to its end', 'all done at 0.3 s']
    ];
    var notes = [
      'Both coroutines are ready, and none of their code has run: making a coroutine runs nothing, like calling a generator function. The loop will run them in turn, first come, first served.',
      'The loop runs `A` until its `yield`, the toy\'s `await`. `A` asks to sleep 0.3 s, so the loop parks it in the sleeping list with its wake-up time. `A` is paused with its variables kept, exactly like a generator.',
      '`B` runs until it asks to sleep 0.1 s. Now nothing is ready: both are waiting, and no time has passed. One thread has started two waits that overlap.',
      'With nothing ready, the loop jumps to the earliest wake-up: `B`, at 0.1 s. (A real loop would sleep the thread until then, or until a network connection has data.) `B` resumes right after its `yield` and asks for another 0.1 s.',
      '`B` wakes at 0.2 s and runs to its end: its generator raises `StopIteration`, and the loop lets it go. In asyncio this is the moment a task\'s result becomes available to whoever `await`s it.',
      '`A` wakes at 0.3 s and finishes. All done at 0.3 s: the total is the **longest** wait, not the sum of the waits (0.5 s). That is the whole point of an event loop. In asyncio the `yield` is hidden inside `await asyncio.sleep(...)`, but the loop works the same way.'
    ];
    var code = TOY_LOOP + lines('TURNS = ' + k, 'print("start: clock 0.0 s")', 'state()', 'for i in range(1, TURNS + 1):', '    print(f"turn {i}")', '    turn()', '    state()',
      'if not ready and not sleeping:', '    print(f"all done at {clock:.1f} s")');
    return { when: { turns: String(k) }, code: code, expect: expect.slice(0, k + 1).reduce(function (a, b) { return a.concat(b); }, []), note: notes[k] };
  }

  function togetherVariant(how) {
    var body = {
      await: ['    await job("A", 0.3)', '    await job("B", 0.2)'],
      gather: ['    print(await asyncio.gather(job("A", 0.3), job("B", 0.2)))'],
      tasks: ['    a = asyncio.create_task(job("A", 0.3))', '    b = asyncio.create_task(job("B", 0.2))', '    print(f"  {stamp()}  both tasks created; main goes on")', '    await a', '    await b']
    }[how];
    var code = ['import asyncio', 'import time', '', 't0 = time.perf_counter()', '', '', 'def stamp():', '    return f"{time.perf_counter() - t0:.1f} s"', '', '',
      'async def job(name, seconds):', '    print(f"  {stamp()}  {name} starts")', '    await asyncio.sleep(seconds)', '    print(f"  {stamp()}  {name} ends")', '    return name', '', '',
      'async def main():'].concat(body).concat(['    print(f"total: {stamp()}")', '', '', 'asyncio.run(main())']);
    return {
      when: { how: how }, code: lines.apply(null, code),
      expect: {
        await: ['A starts', 'A ends', 'B starts', 'B ends', 'total:'],
        gather: ['A starts', 'B starts', 'B ends', 'A ends', "['A', 'B']", 'total:'],
        tasks: ['both tasks created; main goes on', 'A starts', 'B starts', 'B ends', 'A ends', 'total:']
      }[how],
      note: {
        await: '`await job("A", 0.3)` waits for `A` to finish before the next line even starts `B`: about 0.5 s in all, the sum of the two. Awaiting coroutines one by one is as sequential as calling functions.',
        gather: '`gather` starts both at once and waits for both: `B` ends first, then `A`, and the total is about 0.3 s, the longer wait. The result keeps the order you gave, `[\'A\', \'B\']`, whatever order they finished in. Java: `CompletableFuture.allOf`.',
        tasks: '`create_task` schedules a coroutine and returns at once, so `main` carries on: the "created" line comes first, and the jobs start only when `main` reaches its first `await` and gives the loop a turn. About 0.3 s in all, as with `gather`.'
      }[how]
    };
  }

  function blockingVariant(work) {
    var slow = work === 'await' ? ['    await asyncio.sleep(0.45)                 # waits, and lets the loop run the others'] :
      ['    end = time.perf_counter() + 0.45          # computes without ever awaiting', '    while time.perf_counter() < end:', '        pass'];
    var code = ['import asyncio', 'import time', '', 't0 = time.perf_counter()', 'ticks = []', 'slow = {}', '', '',
      'async def heartbeat():', '    for _ in range(7):', '        ticks.append(time.perf_counter() - t0)', '        print(f"  {ticks[-1]:.2f} s  tick")', '        await asyncio.sleep(0.1)', '', '',
      'async def slow_work():', '    slow["start"] = time.perf_counter() - t0', '    print(f"  {slow[\'start\']:.2f} s  slow work starts")'].concat(slow).concat([
      '    slow["end"] = time.perf_counter() - t0', '    print(f"  {slow[\'end\']:.2f} s  slow work ends")', '', '',
      'async def main():', '    await asyncio.gather(heartbeat(), slow_work())', '', '',
      'asyncio.run(main())', 'during = [t for t in ticks if slow["start"] < t < slow["end"]]', 'print("ticks while the slow work ran:", len(during))', 'print("the heartbeat kept going:", len(during) >= 2)']);
    return {
      when: { work: work }, code: lines.apply(null, code),
      expect: work === 'await' ? ['slow work starts', 'tick', 'tick', 'slow work ends', 'the heartbeat kept going: True'] :
        ['tick', 'slow work starts', 'slow work ends', 'tick', 'ticks while the slow work ran: 0', 'the heartbeat kept going: False'],
      note: work === 'await' ?
        '`await asyncio.sleep(0.45)` hands control back to the loop for the whole wait, so the heartbeat keeps ticking every 0.1 s meanwhile. Waiting for the network with an async library behaves the same way.' :
        'The busy loop never reaches an `await`, so the event loop cannot switch: not a single tick for 0.45 s, and then the late ticks come in a hurry. A long calculation, a library that is not async (such as `requests`) and, on your own Python, `time.sleep` all stall every coroutine like this. Hand such work to a thread with `await asyncio.to_thread(...)`, or to a process.'
    };
  }

  function refVariant(k) {
    var code = ['import sys', 'import weakref', '', '', 'class Thing:', '    pass', '', '', 'class Holder:', '    pass', '', '',
      'def references():', '    obj = watch()                     # a weak reference: it does not count', '    if obj is None:', '        return "freed: nothing refers to it"',
      '    n = sys.getrefcount(obj) - 2      # minus obj here, minus getrefcount\'s own argument', '    return f"{n} reference" + ("" if n == 1 else "s")', '', '',
      'def show(line):', '    print(f"{line:<22}{references()}")', '', '', 'holder = Holder()', 'a = Thing()', 'watch = weakref.ref(a)', 'show("a = Thing()")'];
    for (var i = 1; i <= k; i++) code.push(REF_STEPS[i][0], 'show("' + REF_STEPS[i][0] + '")');
    var expect = [];
    for (var j = 0; j <= k; j++) expect.push(REF_STEPS[j][0], REF_STEPS[j][1]);
    return { when: { step: String(k) }, code: lines.apply(null, code), expect: expect, note: REF_STEPS[k][2] };
  }

  function cycleVariant(w) {
    var back = {
      none: '# b.back is not set: a refers to b, nothing refers back',
      strong: 'b.back = a                      # b refers back to a: a cycle',
      weak: 'b.back = weakref.ref(a)         # a weak reference back: no cycle'
    }[w.back];
    var code = ['import gc', 'import weakref', '', 'finalizers = []', '', '', 'class Node:', '    def __init__(self, name):', '        self.name = name',
      '        finalizers.append(weakref.finalize(self, print, f"  {name} is freed"))', '', '',
      'gc.disable()                    # the automatic collector is off: nothing happens behind our back', 'a, b = Node("a"), Node("b")', 'a.next = b', back,
      'print("del a, b")', 'del a, b', 'print("the names are gone")'];
    if (w.collect === 'yes') code.push('gc.collect()                    # run the cycle collector now', 'print("after gc.collect()")');
    code.push('alive = [f.peek()[0].name for f in finalizers if f.alive]', 'print("still alive at the end:", alive or "nothing")',
      'for f in finalizers:', '    f.detach()                  # tidy up quietly', 'gc.collect()', 'gc.enable()');
    var freedAtDel = ['del a, b', 'a is freed', 'b is freed', 'the names are gone'];
    var expect = {
      none: freedAtDel.concat(w.collect === 'yes' ? ['after gc.collect()'] : []).concat(['still alive at the end: nothing']),
      strong: w.collect === 'yes' ? ['the names are gone', 'is freed', 'is freed', 'after gc.collect()', 'still alive at the end: nothing'] :
        ['del a, b', 'the names are gone', "still alive at the end: ['a', 'b']"],
      weak: freedAtDel.concat(w.collect === 'yes' ? ['after gc.collect()'] : []).concat(['still alive at the end: nothing'])
    }[w.back];
    var notes = {
      'none no': 'No cycle: deleting `a` drops its count to zero, so it is freed at once, and with it its reference to `b`; deleting `b` frees `b`. All of it happens inside the `del` line, without any garbage collector.',
      'none yes': 'The same: reference counting had already freed both, so the collector finds nothing of theirs to do. Most objects in most programs are freed this way.',
      'strong no': 'With `b.back = a`, each node holds the other. After `del a, b` nothing can reach them, but each still has a count of one, so reference counting cannot free them. With the collector off they stay to the end: in a long-running program, a leak.',
      'strong yes': '`gc.collect()` runs the cycle collector, which finds groups of objects that only refer to each other and frees them. Normally it runs by itself from time to time; switching it off made the gap visible.',
      'weak no': 'A weak reference back to `a` does not count, so there is no cycle: both nodes are freed by reference counting as soon as their names go. This is how a child can point at its parent without keeping the whole tree alive.',
      'weak yes': 'Nothing left for the collector: the weak back link let reference counting do all the work. Had `b` survived, `b.back()` would now return `None`.'
    };
    return { when: { back: w.back, collect: w.collect }, code: lines.apply(null, code), expect: expect, note: notes[w.back + ' ' + w.collect] };
  }

  function slotsSizeVariant(kind) {
    var imports = { dataclass: 'from dataclasses import dataclass', 'dataclass-slots': 'from dataclasses import dataclass', namedtuple: 'from collections import namedtuple' }[kind];
    var defs = {
      plain: ['class Point:', '    def __init__(self, x, y):', '        self.x, self.y = x, y'],
      slots: ['class Point:', '    __slots__ = ("x", "y")', '', '    def __init__(self, x, y):', '        self.x, self.y = x, y'],
      dataclass: ['@dataclass', 'class Point:', '    x: float', '    y: float'],
      'dataclass-slots': ['@dataclass(slots=True)', 'class Point:', '    x: float', '    y: float'],
      namedtuple: ['Point = namedtuple("Point", "x y")']
    }[kind];
    var hasDict = kind === 'plain' || kind === 'dataclass';
    var code = ['import sys', 'import tracemalloc'].concat(imports ? [imports] : []).concat(['', '']).concat(defs).concat(['', '',
      'tracemalloc.start()', 'points = [Point(1.5, 2.5) for _ in range(50_000)]', 'size = tracemalloc.get_traced_memory()[0]', 'tracemalloc.stop()', '',
      'p = points[0]', 'print(f"{size / len(points):.0f} bytes per point, list slot included")', 'print("getsizeof(p):", sys.getsizeof(p), "bytes, the object alone")',
      'print("has a __dict__:", hasattr(p, "__dict__"))']);
    var notes = {
      plain: 'An ordinary object can take new attributes at any time, so it keeps room for a `__dict__`. Compare its bytes per point with the class that has `__slots__`. (`sys.getsizeof` does not count all of that room, so trust `tracemalloc` for the real cost.)',
      slots: '`__slots__` fixes the attributes, so there is no `__dict__` and each point is smaller. With 50,000 points the saving adds up; with millions it can decide whether the data fits in memory at all.',
      dataclass: 'A dataclass writes `__init__`, `__repr__` and `__eq__` for you, but its objects are ordinary objects, with a `__dict__`: the same size as the plain class.',
      'dataclass-slots': '`slots=True` gives the dataclass `__slots__`: the convenience of a dataclass at the size of a slotted class.',
      namedtuple: 'A named tuple stores its values the way a tuple does, with names on top: no `__dict__`, and it cannot be changed after it is made.'
    };
    return {
      when: { kind: kind }, code: lines.apply(null, code),
      expect: ['bytes per point, list slot included', 'getsizeof(p):', 'has a __dict__: ' + (hasDict ? 'True' : 'False')], note: notes[kind]
    };
  }
})(window.PYLT);
