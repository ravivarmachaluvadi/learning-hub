/*
 * Lessons, track 5: Iteration. The lesson shape is described at the top of data/lessons-basics.js;
 * every ```python block must run (tests/test_content.py runs them all).
 */
(function (U) {
  var L = U.data.lessons = U.data.lessons || [];

  function block(lang, lines) { return '```' + lang + '\n' + lines.join('\n') + '\n```'; }
  function py() { return block('python', [].slice.call(arguments)); }

  L.push(
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'py-iterators', track: 'iteration',
      title: 'The iterator protocol: what a for loop really does',
      summary: 'Iterables and iterators, iter() and next(), StopIteration, why an iterator can be walked only once, and how to make your own class work in a for loop.',
      keywords: ['iterator', 'iterable', 'iter', 'next', 'stopiteration', '__iter__', '__next__', 'for loop', 'protocol', 'exhausted', 'iterator protocol', 'hasnext', 'iterable interface'],
      docs: 'https://docs.python.org/3/library/stdtypes.html#iterator-types',
      body: [
        'Every `for` loop in Python works the same way, whatever it walks over: a list, a string, a dict, a file, a range. It asks the object for an **iterator** and calls `next()` on it until the iterator says it is finished. That is the **iterator protocol**.',
        '## What a for loop does',
        py('colors = ["red", "green"]',
           'for c in colors:',
           '    print(c)',
           '',
           '# the same loop, written out',
           'it = iter(colors)              # 1. ask for an iterator',
           'while True:',
           '    try:',
           '        c = next(it)           # 2. ask for the next item',
           '    except StopIteration:      # 3. finished: leave the loop',
           '        break',
           '    print(c)'),
        '## Iterable versus iterator',
        'An **iterable** is something you can loop over: it has `__iter__`, which returns a new iterator. An **iterator** hands out the items: it has `__next__`, which returns the next one or raises `StopIteration`. A list is iterable but not an iterator, and each `iter(list)` starts a fresh walk:',
        py('nums = [1, 2, 3]',
           'a, b = iter(nums), iter(nums)',
           'print(next(a), next(a), next(b))          # two independent walks',
           'print(iter(a) is a)                       # an iterator\'s iterator is itself'),
        '## An iterator is used up once',
        'An iterator remembers where it is, and once finished it stays finished. Files, `zip`, `map`, `filter`, `enumerate` and generators are iterators, so a second loop over one of them sees nothing:',
        py('pairs = zip("ab", [1, 2])',
           'print(list(pairs))',
           'print(list(pairs))             # empty: zip is an iterator, already used up',
           'squares = map(lambda x: x * x, [1, 2, 3])',
           'print(sum(squares), sum(squares))'),
        'When you need the items twice, make a list once: `pairs = list(zip(...))`.',
        '## Your own iterator',
        'Give a class `__iter__` and `__next__`, and `for`, `list()`, `sum()`, unpacking and `in` all work with it. The usual design is two classes, like Java\'s `Iterable` and `Iterator`: the collection makes a fresh iterator every time, so it can be looped over again:',
        py('class Countdown:                       # the iterable',
           '    def __init__(self, start):',
           '        self.start = start',
           '',
           '    def __iter__(self):',
           '        return CountdownIterator(self.start)',
           '',
           'class CountdownIterator:               # the iterator: remembers its position',
           '    def __init__(self, current):',
           '        self.current = current',
           '',
           '    def __iter__(self):',
           '        return self',
           '',
           '    def __next__(self):',
           '        if self.current <= 0:',
           '            raise StopIteration',
           '        self.current -= 1',
           '        return self.current + 1',
           '',
           'c = Countdown(3)',
           'print(list(c), list(c), sum(c), 2 in c)'),
        'Writing `__next__` by hand is rarely needed: the next lesson, [[lesson:py-generators]], makes `__iter__` a generator of three lines.',
        '## iter() with a sentinel',
        '`iter(function, sentinel)` calls the function until it returns the sentinel value. It turns a "read until empty" loop into a `for` loop:',
        py('import io',
           '',
           'stream = io.StringIO("line one\\nline two\\n")',
           'for line in iter(stream.readline, ""):     # readline returns "" at the end',
           '    print(line.rstrip())'),
        '| Java | Python |\n|---|---|\n| `Iterable<T>` | has `__iter__` |\n| `Iterator<T>` | has `__next__`, and an `__iter__` returning itself |\n| `it.hasNext()` and `it.next()` | `next(it)`, which raises `StopIteration` at the end |\n| `NoSuchElementException` | `StopIteration` |\n| the for-each loop | `for x in xs:`, calling `iter` and `next` for you |'
      ].join('\n\n'),
      java: 'The protocol is Java\'s `Iterable` and `Iterator` pair, with one difference: there is no `hasNext()`. `__next__` either returns the next item or raises `StopIteration`, and the `for` loop catches it for you. Python uses iterators much more than Java does: `zip`, `map`, `enumerate`, files and generators all return them, so remember that an iterator is used up after one pass.',
      example: {
        code: String.raw`class Paginated:
    """Items from an API, fetched one page at a time while you loop."""

    def __init__(self, items, page_size):
        self.items = items
        self.page_size = page_size

    def __iter__(self):
        return PageIterator(self)


class PageIterator:
    def __init__(self, source):
        self.source = source
        self.page = []
        self.next_index = 0

    def __iter__(self):
        return self

    def __next__(self):
        if not self.page:
            start = self.next_index
            self.page = self.source.items[start:start + self.source.page_size]
            if not self.page:
                raise StopIteration
            print(f"  (fetched items {start} to {start + len(self.page) - 1})")
            self.next_index += len(self.page)
        return self.page.pop(0)


users = Paginated(["asha", "ravi", "li", "mei", "omar"], page_size=2)
for name in users:
    print(name)
print(list(users)[-1], "- a second loop starts again")
`,
        note: 'Each `for` gets a new `PageIterator`, so `users` can be looped over twice.'
      },
      challenge: {
        title: 'A countdown you can loop over twice',
        task: [
          '1. `Countdown(3)` is iterable: `list(Countdown(3))` is `[3, 2, 1]`, and `Countdown(0)` gives nothing.',
          '2. The same `Countdown` object can be looped over more than once, each time from the start.',
          '3. `iter(Countdown(2))` returns an iterator: `next()` gives 2, then 1, then raises `StopIteration`, and an iterator\'s `iter()` is itself.',
          '4. Write `__next__` by hand here: no `yield` (generators are the next lesson).',
          '5. `first_n(iterable, n)` returns a list of the first `n` items, using `iter()` and `next()`. It stops early when the items run out, and works on endless iterators such as `itertools.count()`.'
        ].join('\n\n'),
        starter: String.raw`class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1


def first_n(iterable, n):
    items = []
    for item in iterable:
        items.append(item)
        if len(items) > n:
            break
    return items


c = Countdown(3)
print(list(c), list(c))
`,
        solution: String.raw`class Countdown:
    def __init__(self, start):
        self.start = start

    def __iter__(self):
        return CountdownIterator(self.start)


class CountdownIterator:
    def __init__(self, current):
        self.current = current

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1


def first_n(iterable, n):
    it = iter(iterable)
    items = []
    for _ in range(n):
        try:
            items.append(next(it))
        except StopIteration:
            break
    return items


c = Countdown(3)
print(list(c), list(c), first_n(c, 2))
`,
        hints: [
          'Split it into two classes: `Countdown` stores the start number, and its `__iter__` returns `CountdownIterator(self.start)`, a new one every time.',
          '`CountdownIterator` keeps `self.current`. Its `__iter__` returns `self`; its `__next__` raises `StopIteration` at 0, otherwise counts down and returns the number.',
          '`first_n`: `it = iter(iterable)`, then call `next(it)` up to `n` times, and `break` on `StopIteration`. Never turn the whole iterable into a list: it may be endless.'
        ],
        checks: [
          { label: '`list(Countdown(3))` is `[3, 2, 1]`; `Countdown(0)` gives nothing', code: 'assert list(Countdown(3)) == [3, 2, 1]\nassert list(Countdown(0)) == []' },
          { label: 'One `Countdown` can be looped over twice', code: 'c = Countdown(2)\nassert list(c) == [2, 1]\nassert list(c) == [2, 1], "the second loop got nothing: make __iter__ return a new iterator each time"' },
          { label: 'Its iterator gives 2, then 1, then `StopIteration`', code: 'it = iter(Countdown(2))\nassert iter(it) is it, "an iterator\'s __iter__ returns itself"\nassert next(it) == 2 and next(it) == 1\ntry:\n    next(it)\nexcept StopIteration:\n    pass\nelse:\n    raise AssertionError("after the last item, next() should raise StopIteration")' },
          { label: 'No `yield`: `__next__` is written by hand', code: 'assert not uses("Yield"), "write __next__ by hand here; generators are the next lesson"' },
          { label: '`first_n` takes the first items, also from an endless iterator', code: 'import itertools\nassert first_n(itertools.count(), 3) == [0, 1, 2]\nassert first_n("abcdef", 2) == ["a", "b"]' },
          { label: '`first_n` stops early when the items run out', code: 'assert first_n([1], 5) == [1]\nassert first_n(Countdown(0), 3) == []' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'py-generators', track: 'iteration',
      title: 'Generators and yield',
      summary: 'A function with yield returns a generator: it runs only as far as the next value, pauses with its variables intact, and resumes on the next request. Endless sequences, generators as __iter__, and send() and return in brief.',
      keywords: ['generator', 'yield', 'lazy', 'next', 'generator function', 'infinite', 'endless', 'pause', 'resume', 'generator expression', 'stopiteration', 'send', 'memory'],
      docs: 'https://docs.python.org/3/howto/functional.html#generators',
      body: [
        'Writing an iterator class by hand ([[lesson:py-iterators]]) takes two classes and a `__next__` that keeps its position in fields. A **generator** does the same with one function: put `yield` where you would hand a value out, and Python builds the iterator for you.',
        py('def countdown(n):',
           '    print("  starting")',
           '    while n > 0:',
           '        yield n                # hand out n, then pause right here',
           '        n -= 1',
           '    print("  finished")',
           '',
           'gen = countdown(3)             # runs nothing yet: it only makes a generator',
           'print(type(gen).__name__)',
           'for value in gen:',
           '    print(value)'),
        '## Paused, not finished',
        'Calling a generator function runs **none** of its body. Each `next()` runs it until the next `yield`, hands that value out and **pauses** there, keeping every local variable. The next `next()` resumes right after the `yield`. When the function ends, the generator raises `StopIteration`, which ends a `for` loop. Watch it happen in [[explain:generators]].',
        py('def steps():',
           '    yield "first"',
           '    yield "second"',
           '',
           'g = steps()',
           'print(next(g))',
           'print(next(g))',
           'print(next(g, "no more"))      # finished: the default instead of StopIteration'),
        '## Endless and lazy',
        'Because nothing runs ahead of time, a generator can describe an endless sequence. The caller takes as much as it needs, with `itertools.islice`, `next()` or a `break`:',
        py('from itertools import islice',
           '',
           'def fibonacci():',
           '    a, b = 0, 1',
           '    while True:                # never ends, and that is fine',
           '        yield a',
           '        a, b = b, a + b',
           '',
           'print(list(islice(fibonacci(), 10)))',
           'for n in fibonacci():',
           '    if n > 100:',
           '        print("first above 100:", n)',
           '        break'),
        'It saves memory too: a generator over a 10 GB log file holds one line at a time, where a list would hold all of them.',
        '## A generator as __iter__',
        'The quickest way to make a class iterable: make `__iter__` a generator. Each `for` calls `__iter__`, which starts a new generator, so the object can be looped over again and again:',
        py('class Countdown:',
           '    def __init__(self, start):',
           '        self.start = start',
           '',
           '    def __iter__(self):',
           '        n = self.start',
           '        while n > 0:',
           '            yield n',
           '            n -= 1',
           '',
           'c = Countdown(3)',
           'print(list(c), list(c))'),
        '## Generator expressions',
        'For a simple case, a comprehension in round brackets is a generator too: `(x * x for x in nums)`. Passed straight to a function it needs no extra brackets: `sum(x * x for x in nums)`.',
        '## Two more things a generator can do',
        '`return value` inside a generator ends it, and the value travels inside the `StopIteration` (and to `yield from`: [[lesson:py-yield-from]]). `gen.send(value)` resumes a paused generator and makes the `yield` expression evaluate to `value`: that is how coroutines began, and today `asyncio` builds on the idea. You will rarely need either yourself.',
        py('def running_average():',
           '    total, count = 0, 0',
           '    average = None',
           '    while True:',
           '        value = yield average          # send() delivers the value here',
           '        total += value',
           '        count += 1',
           '        average = total / count',
           '',
           'avg = running_average()',
           'next(avg)                              # run to the first yield',
           'print(avg.send(10), avg.send(20), avg.send(60))'),
        '| Java | Python |\n|---|---|\n| an `Iterator` class with fields for its position | a function with `yield` |\n| `Stream.iterate(seed, f)` | an endless `while True:` generator |\n| `stream.limit(10)` | `itertools.islice(gen, 10)` |\n| a stream can be used once | a generator can be walked once |'
      ].join('\n\n'),
      java: 'Java has no `yield` for iterators (its `yield` in a `switch` is something else), so a lazy sequence means a hand-written `Iterator` that keeps its state in fields, or a `Stream`. A Python generator keeps its state in ordinary local variables while it is paused, so the code reads like a normal loop. Like a `Stream`, a generator is lazy and can be used only once.',
      js: 'JavaScript\'s `function*` and `yield` are the same idea: generators are iterators, and `for...of` loops over them.',
      example: {
        code: String.raw`def read_orders(lines):
    """Parse 'id,amount' lines lazily, skipping blank lines and comments."""
    for number, line in enumerate(lines, start=1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        order_id, amount = line.split(",")
        print(f"  parsed line {number}")
        yield order_id, float(amount)


def big_ones(orders, limit):
    for order_id, amount in orders:
        if amount >= limit:
            yield order_id


raw = ["# exported orders", "A1,120", "", "A2,15.5", "A3,999", "A4,300"]
big = big_ones(read_orders(raw), 100)
print("nothing parsed yet")
print(next(big))
print(next(big))
print("the rest:", list(big))
`,
        note: 'The `parsed line` messages show that each line is parsed only when the next order is asked for.'
      },
      challenge: {
        title: 'Three generators',
        task: [
          '1. `fibonacci()` is an endless generator: 0, 1, 1, 2, 3, 5, …',
          '2. `chunks(items, size)` yields lists of `size` items (the last one may be shorter), lazily, so it also works on endless input.',
          '3. `records(lines)` yields each line with the surrounding spaces stripped, skipping blank lines and lines that start with `#`.',
          '4. All three must be generator functions, using `yield`, not functions that build and return a list.'
        ].join('\n\n'),
        starter: String.raw`def fibonacci(n):
    result = [0, 1]
    while len(result) < n:
        result.append(result[-1] + result[-2])
    return result[:n]


def chunks(items, size):
    return [items[i:i + size] for i in range(0, len(items), size)]


def records(lines):
    return [line.strip() for line in lines]


print(fibonacci(10))
print(chunks([1, 2, 3, 4, 5], 2))
`,
        solution: String.raw`from itertools import islice


def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b


def chunks(items, size):
    chunk = []
    for item in items:
        chunk.append(item)
        if len(chunk) == size:
            yield chunk
            chunk = []
    if chunk:
        yield chunk


def records(lines):
    for line in lines:
        line = line.strip()
        if line and not line.startswith("#"):
            yield line


print(list(islice(fibonacci(), 10)))
print(list(chunks([1, 2, 3, 4, 5], 2)))
print(list(records(["# header", "  a ", "", "b"])))
`,
        hints: [
          '`fibonacci`: keep `a, b = 0, 1`, then `while True:` with `yield a` and `a, b = b, a + b`. An endless loop is fine in a generator: it pauses at each `yield`.',
          '`chunks`: collect items into a list; when it reaches `size`, `yield` it and start a new list. After the loop, `yield` the leftover if it is not empty. Never call `len(items)`: an endless iterator has no length.',
          '`records`: loop, strip, and `yield` only the lines that are not empty and do not start with `#`.'
        ],
        checks: [
          { label: 'All three are generator functions', code: 'import inspect\nfor f in (fibonacci, chunks, records):\n    assert inspect.isgeneratorfunction(f), f"{f.__name__} should use yield, not return a list"' },
          { label: '`fibonacci()` starts 0, 1, 1, 2, 3, 5, 8, 13, 21, 34', code: 'from itertools import islice\nassert list(islice(fibonacci(), 10)) == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]' },
          { label: '`fibonacci()` never stops', code: 'from itertools import islice\nassert list(islice(fibonacci(), 100, 101)) == [354224848179261915075]' },
          { label: '`chunks` groups items, the last group shorter', code: 'assert list(chunks([1, 2, 3, 4, 5, 6, 7], 3)) == [[1, 2, 3], [4, 5, 6], [7]]\nassert list(chunks([], 3)) == []' },
          { label: '`chunks` works lazily on endless input', code: 'from itertools import count, islice\nassert list(islice(chunks(count(), 2), 2)) == [[0, 1], [2, 3]]' },
          { label: '`records` skips blank lines and `#` lines', code: 'assert list(records(["# header", "  a  ", "", "   ", "b", "#x"])) == ["a", "b"]' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'py-lazy-pipelines', track: 'iteration',
      title: 'Lazy pipelines: generators instead of streams',
      summary: 'Chain generators into pipelines that process one item at a time, the way a Java Stream does: filter and map stages, stopping early with next() and any(), and a table of Stream operations in Python.',
      keywords: ['stream', 'pipeline', 'lazy', 'generator', 'map', 'filter', 'findfirst', 'anymatch', 'short-circuit', 'flatmap', 'limit', 'islice', 'big file', 'java streams', 'collect'],
      docs: 'https://docs.python.org/3/howto/functional.html',
      body: [
        'A Java stream is a pipeline, `source → filter → map → collect`, where nothing runs until the terminal operation pulls items through, one at a time. Generators build exactly that. Each stage is a generator reading from the stage before it:',
        py('def read(lines):',
           '    for line in lines:',
           '        print("  read", line)',
           '        yield line',
           '',
           'def numbers(lines):',
           '    return (int(line) for line in lines if line.strip().isdigit())',
           '',
           'def doubled(nums):',
           '    return (n * 2 for n in nums)',
           '',
           'pipeline = doubled(numbers(read(["4", "x", "10", "7"])))',
           'print("built the pipeline; nothing has run")',
           'print(list(pipeline))'),
        'The `read` lines appear only once `list()` pulls items: one item at a time travels through every stage.',
        '## Stopping as soon as you know',
        'Because items are pulled one at a time, a pipeline stops early when its consumer stops asking, like `findFirst()` or `anyMatch()`:',
        py('def checked(values):',
           '    for v in values:',
           '        print("  checking", v)',
           '        yield v',
           '',
           'data = [3, 8, 12, 5, 20]',
           'print(next(v for v in checked(data) if v > 10))          # findFirst',
           'print(any(v > 10 for v in checked(data)))                # anyMatch'),
        'Both lines stop at 12: 5 and 20 are never checked.',
        '## Stream operations in Python',
        '| Java Stream | Python, lazily |\n|---|---|\n| `filter(p)` | `(x for x in xs if p(x))` |\n| `map(f)` | `(f(x) for x in xs)`, or `map(f, xs)` |\n| `flatMap(f)` | `(y for x in xs for y in f(x))` |\n| `limit(n)`, `skip(n)` | `islice(xs, n)`, `islice(xs, n, None)` |\n| `takeWhile(p)` | `itertools.takewhile(p, xs)` |\n| `distinct()` | a generator that remembers a `seen` set |\n| `peek(f)` | a generator that calls `f(x)` and yields `x` |\n| `findFirst()` | `next(xs, default)` |\n| `anyMatch`, `allMatch` | `any(...)`, `all(...)` |\n| `count()` | `sum(1 for _ in xs)` |\n| `collect(toList())` | `list(xs)` |\n| `collect(groupingBy(f))` | a loop into a `defaultdict(list)` |\n| `reduce`, `sum`, `max` | `functools.reduce`, `sum`, `max` |',
        '## A generator for any stage',
        'A stage Python has no built-in for is a short generator:',
        py('from itertools import islice',
           '',
           'def distinct(items):',
           '    seen = set()',
           '    for item in items:',
           '        if item not in seen:',
           '            seen.add(item)',
           '            yield item',
           '',
           'words = "the cat and the hat and the bat".split()',
           'print(list(islice(distinct(words), 4)))'),
        '## Big files in constant memory',
        'A file is an iterator over its lines, so a pipeline over a file holds one line at a time, however big the file is:',
        py('with open("access.log", "w", encoding="utf-8") as f:',
           '    for i in range(1000):',
           '        f.write(f"GET /page/{i % 7} {200 if i % 50 else 500}\\n")',
           '',
           'with open("access.log", encoding="utf-8") as f:',
           '    errors = (line.split()[1] for line in f if line.rstrip().endswith("500"))',
           '    print(sum(1 for _ in errors), "errors")'),
        '## List or generator?',
        'Use a generator when the data is big, endless, or only partly needed. Use a list when you need the items more than once, need `len()` or indexing, or want to print them: a generator can be walked only once, like a stream.'
      ].join('\n\n'),
      java: 'Generator pipelines are Python\'s `Stream`: lazy, pulled one item at a time by the consumer, stopping early, and usable once. The difference is the spelling: each stage is a generator expression or a small generator function rather than a method in a chain, and the terminal operations are ordinary built-ins (`list`, `sum`, `any`, `next`, `max`). There is no parallel stream; [[lesson:py-multiprocessing]] covers `concurrent.futures` for that.',
      example: {
        code: String.raw`from collections import Counter
from itertools import islice

LOG = """2026-10-10 INFO  login asha
2026-10-10 ERROR db timeout
2026-10-10 INFO  login ravi
garbage line
2026-10-11 ERROR db timeout
2026-10-11 WARN  disk 91%
2026-10-11 ERROR payment declined"""


def parse(lines):
    for line in lines:
        parts = line.split(maxsplit=2)
        if len(parts) == 3 and parts[1] in {"INFO", "WARN", "ERROR"}:
            yield {"day": parts[0], "level": parts[1], "msg": parts[2]}


def only(level, records):
    return (r for r in records if r["level"] == level)


records = list(parse(LOG.splitlines()))
print(Counter(r["level"] for r in records))
print([r["msg"] for r in only("ERROR", records)])
print(next((r["day"] for r in only("WARN", records)), "no warnings"))
print([r["msg"] for r in islice(only("INFO", records), 1)])
`,
        note: '`records` is a list because it is used four times; every stage on top of it is lazy.'
      },
      challenge: {
        title: 'A lazy log pipeline',
        task: [
          '1. `parse(lines)` is a generator yielding `{"level": ..., "msg": ...}` for lines such as `"ERROR: disk full"`; a line without `": "` is skipped.',
          '2. `errors(records)` yields only the records whose level is `"ERROR"`.',
          '3. `first_error(lines)` returns the message of the first error, or `None` when there is none. It must stop reading as soon as it finds one.',
          '4. `count_by_level(lines)` returns a dict counting the records of each level.'
        ].join('\n\n'),
        starter: String.raw`def parse(lines):
    result = []
    for line in lines:
        level, msg = line.split(": ", 1)
        result.append({"level": level, "msg": msg})
    return result


def errors(records):
    return [r for r in records if r["level"] == "ERROR"]


def first_error(lines):
    found = errors(parse(lines))
    return found[0]["msg"]


def count_by_level(lines):
    return {}


lines = ["INFO: started", "ERROR: disk full", "INFO: retry"]
print(first_error(lines))
`,
        solution: String.raw`from collections import Counter


def parse(lines):
    for line in lines:
        if ": " in line:
            level, msg = line.split(": ", 1)
            yield {"level": level, "msg": msg}


def errors(records):
    return (r for r in records if r["level"] == "ERROR")


def first_error(lines):
    return next((r["msg"] for r in errors(parse(lines))), None)


def count_by_level(lines):
    return dict(Counter(r["level"] for r in parse(lines)))


lines = ["INFO: started", "ERROR: disk full", "INFO: retry"]
print(first_error(lines), count_by_level(lines))
`,
        hints: [
          '`parse`: loop over the lines, skip any line without `": "`, split it once with `line.split(": ", 1)`, and `yield` the dict.',
          '`errors` can be one generator expression: `(r for r in records if r["level"] == "ERROR")`.',
          '`first_error`: `next((r["msg"] for r in errors(parse(lines))), None)`. `next` pulls items only up to the first match, and the default covers "no error".',
          '`count_by_level`: `Counter(r["level"] for r in parse(lines))`, turned into a dict.'
        ],
        checks: [
          { label: '`parse` is a generator and skips lines without `": "`', code: 'import inspect\nassert inspect.isgeneratorfunction(parse), "parse should yield its records"\nassert list(parse(["INFO: up", "junk", "ERROR: down"])) == [{"level": "INFO", "msg": "up"}, {"level": "ERROR", "msg": "down"}]' },
          { label: '`errors` keeps only the ERROR records', code: 'recs = [{"level": "INFO", "msg": "a"}, {"level": "ERROR", "msg": "b"}]\nassert list(errors(recs)) == [{"level": "ERROR", "msg": "b"}]' },
          { label: '`first_error` finds the first error\'s message', code: 'assert first_error(["INFO: a", "ERROR: disk full", "ERROR: later"]) == "disk full"' },
          { label: '`first_error` returns `None` when there is no error', code: 'assert first_error(["INFO: a", "WARN: b"]) is None\nassert first_error([]) is None' },
          { label: '`first_error` stops reading at the first error', code: 'def source():\n    yield "INFO: start"\n    yield "ERROR: disk full"\n    raise AssertionError("first_error read past the first error: make the pipeline lazy")\nassert first_error(source()) == "disk full"' },
          { label: '`count_by_level` counts the records of each level', code: 'assert count_by_level(["INFO: a", "ERROR: b", "INFO: c", "junk"]) == {"INFO": 2, "ERROR": 1}' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'py-itertools', track: 'iteration',
      title: 'itertools: the iterator toolbox',
      summary: 'The standard toolbox for iterators: count, cycle and repeat; islice, chain and zip_longest; accumulate and pairwise; groupby; product, permutations and combinations; takewhile and batched. Each lazy, each a loop you no longer write.',
      keywords: ['itertools', 'islice', 'chain', 'groupby', 'accumulate', 'combinations', 'permutations', 'product', 'count', 'cycle', 'repeat', 'zip_longest', 'pairwise', 'batched', 'takewhile', 'dropwhile'],
      docs: 'https://docs.python.org/3/library/itertools.html',
      body: [
        'The `itertools` module holds building blocks for iterators. Each returns a lazy iterator, so they combine with generators and work on endless input. Java has no direct equivalent; a few match `Stream` methods.',
        '## Endless sources: count, cycle, repeat',
        py('from itertools import count, cycle, repeat, islice',
           '',
           'print(list(islice(count(100, 10), 4)))              # 100, 110, 120, ...',
           'print(list(islice(cycle("AB"), 5)))                 # A, B, A, B, ...',
           'print(list(repeat("-", 3)))',
           'for ticket, desk in zip(count(1), cycle(["desk 1", "desk 2"])):',
           '    if ticket > 3:',
           '        break',
           '    print(ticket, desk)'),
        '## Slicing and joining: islice, chain, zip_longest',
        py('from itertools import chain, islice, zip_longest',
           '',
           'print(list(islice("abcdefgh", 2, 6, 2)))             # like [2:6:2], for any iterator',
           'print(list(chain([1, 2], (3,), "ab")))               # one after another',
           'nested = [[1, 2], [3], []]',
           'print(list(chain.from_iterable(nested)))             # flatten one level',
           'print(list(zip_longest("abc", [1, 2], fillvalue="-")))'),
        '## Running results and neighbours: accumulate, pairwise',
        py('from itertools import accumulate, pairwise',
           'import operator',
           '',
           'sales = [5, 3, 8, 2]',
           'print(list(accumulate(sales)))                       # running total',
           'print(list(accumulate(sales, max)))                  # running maximum',
           'print(list(accumulate([1, 2, 3, 4], operator.mul)))  # running product',
           'print([b - a for a, b in pairwise([10, 13, 19, 20])])  # differences'),
        '## Grouping: groupby',
        '`groupby` groups **consecutive** items with the same key, so sort by that key first. It is a run-length tool, not SQL\'s `GROUP BY` (for that, use a `defaultdict`):',
        py('from itertools import groupby',
           '',
           'print([(ch, len(list(run))) for ch, run in groupby("aaabccaa")])',
           'people = [("Asha", "IN"), ("Li", "CN"), ("Ravi", "IN")]',
           'by_country = sorted(people, key=lambda p: p[1])',
           'for country, group in groupby(by_country, key=lambda p: p[1]):',
           '    print(country, [name for name, _ in group])'),
        '## Choosing: product, permutations, combinations',
        py('from itertools import product, permutations, combinations',
           '',
           'print(list(product("AB", [1, 2])))                  # every pair: nested loops',
           'print(list(permutations("ABC", 2)))                 # order matters',
           'print(list(combinations("ABCD", 2)))                # order does not',
           'print(len(list(combinations(range(10), 3))))'),
        '## Cutting: takewhile, dropwhile, batched',
        py('from itertools import takewhile, dropwhile, batched',
           '',
           'readings = [3, 5, 9, 2, 8]',
           'print(list(takewhile(lambda r: r < 9, readings)))   # up to the first 9',
           'print(list(dropwhile(lambda r: r < 9, readings)))   # from the first 9 on',
           'print(list(batched(range(7), 3)))                   # Python 3.12+'),
        '| You need | itertools |\n|---|---|\n| numbers forever | `count(start, step)` |\n| the first n items of anything | `islice(it, n)` |\n| several iterables as one | `chain(a, b)`, `chain.from_iterable(xs)` |\n| zip without losing the longest | `zip_longest` |\n| running totals | `accumulate` |\n| neighbouring pairs | `pairwise` |\n| runs of equal items | `groupby` (sort first) |\n| nested loops over choices | `product` |\n| orderings and selections | `permutations`, `combinations` |\n| fixed-size batches | `batched(it, n)` |',
        'All of them are listed in the Reference: [[ref:mod-itertools]].'
      ].join('\n\n'),
      java: 'Java\'s nearest equivalents are spread out: `Stream.iterate` for `count`, `limit` and `skip` for `islice`, `Stream.concat` for `chain`, `takeWhile` and `dropWhile` (Java 9+), and Guava\'s `Iterables.partition` for `batched`. Combinatorics (`product`, `permutations`, `combinations`) usually means nested loops or a library in Java. In Python they are one import away, lazy, and fast, because they are written in C.',
      example: {
        code: String.raw`from itertools import accumulate, batched, chain, combinations, groupby, islice, pairwise

orders = [
    ("2026-10-10", "pen", 3), ("2026-10-10", "ink", 1),
    ("2026-10-11", "pad", 5), ("2026-10-12", "pen", 2), ("2026-10-12", "pad", 1),
]

for day, rows in groupby(orders, key=lambda o: o[0]):          # already sorted by day
    print(day, sum(qty for _, _, qty in rows))

daily = [sum(q for _, _, q in rows) for _, rows in groupby(orders, key=lambda o: o[0])]
print("running total:", list(accumulate(daily)))
print("day-to-day change:", [b - a for a, b in pairwise(daily)])

items = sorted({item for _, item, _ in orders})
print("bundles:", list(combinations(items, 2)))
print("pages:", list(batched(chain(items, ["tape", "glue"]), 2)))
print("first two orders:", [o[1] for o in islice(orders, 2)])
`,
        note: '`groupby` works here because the orders are already sorted by day.'
      },
      challenge: {
        title: 'Five one-liners',
        task: [
          'Write each function with a tool from `itertools`:',
          '1. `pairs_summing_to(nums, target)`: every pair of values at two different positions that add up to `target`, as tuples, in the order `combinations` gives them.',
          '2. `running_total(nums)`: a list of running totals.',
          '3. `runs(text)`: a list of `(character, length)` for each run of equal characters, so `runs("aaab")` is `[("a", 3), ("b", 1)]`.',
          '4. `interleave(a, b)`: the items of `a` and `b` taken in turn; when one runs out, the rest of the other follows.',
          '5. `first_squares_over(limit, n)`: a list of the first `n` square numbers above `limit`, taken from an endless `count()`.'
        ].join('\n\n'),
        starter: String.raw`def pairs_summing_to(nums, target):
    return []


def running_total(nums):
    return nums


def runs(text):
    return [(ch, text.count(ch)) for ch in sorted(set(text))]


def interleave(a, b):
    return [x for pair in zip(a, b) for x in pair]


def first_squares_over(limit, n):
    return [k * k for k in range(n) if k * k > limit]


print(runs("aaabcc"), interleave("abc", [1, 2]))
`,
        solution: String.raw`from itertools import accumulate, chain, combinations, count, groupby, islice, zip_longest

_MISSING = object()


def pairs_summing_to(nums, target):
    return [pair for pair in combinations(nums, 2) if sum(pair) == target]


def running_total(nums):
    return list(accumulate(nums))


def runs(text):
    return [(ch, len(list(group))) for ch, group in groupby(text)]


def interleave(a, b):
    mixed = chain.from_iterable(zip_longest(a, b, fillvalue=_MISSING))
    return [x for x in mixed if x is not _MISSING]


def first_squares_over(limit, n):
    squares = (k * k for k in count(1))
    return list(islice((s for s in squares if s > limit), n))


print(runs("aaabcc"), interleave("abc", [1, 2]), first_squares_over(10, 3))
`,
        hints: [
          '`combinations(nums, 2)` gives every pair of positions once; keep the pairs whose `sum(pair) == target`.',
          '`list(accumulate(nums))` is the running total. `groupby(text)` gives `(character, run)` pairs, and `len(list(run))` is the run\'s length.',
          '`interleave`: `zip_longest(a, b, fillvalue=MISSING)` with a private marker object, flattened with `chain.from_iterable`, dropping the markers. A marker object rather than `None`, so that real `None` items survive.',
          '`first_squares_over`: `(k * k for k in count(1))`, filtered with a generator expression, then `islice(..., n)`.'
        ],
        checks: [
          { label: '`pairs_summing_to([1, 4, 3, 2], 5)` is `[(1, 4), (3, 2)]`', code: 'assert pairs_summing_to([1, 4, 3, 2], 5) == [(1, 4), (3, 2)]\nassert pairs_summing_to([2, 2], 4) == [(2, 2)] and pairs_summing_to([1], 2) == []' },
          { label: '`running_total([1, 2, 3, 4])` is `[1, 3, 6, 10]`', code: 'assert running_total([1, 2, 3, 4]) == [1, 3, 6, 10]\nassert running_total([]) == []' },
          { label: '`runs("aaabccaa")` keeps the runs in order', code: 'assert runs("aaabccaa") == [("a", 3), ("b", 1), ("c", 2), ("a", 2)]\nassert runs("") == []' },
          { label: '`interleave` takes turns and keeps the leftovers', code: 'assert interleave("abc", [1, 2]) == ["a", 1, "b", 2, "c"]\nassert interleave([], [1, 2]) == [1, 2]\nassert interleave([None, 0], ["x"]) == [None, "x", 0]' },
          { label: '`first_squares_over(10, 3)` is `[16, 25, 36]`', code: 'assert first_squares_over(10, 3) == [16, 25, 36]\nassert first_squares_over(0, 2) == [1, 4]' },
          { label: 'Uses `groupby` and `accumulate` from itertools', code: 'assert calls("groupby") and calls("accumulate"), "runs() needs groupby, and running_total() needs accumulate"' }
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'py-yield-from', track: 'iteration',
      title: 'yield from: delegating to another generator',
      summary: 'yield from hands the work to another iterable or generator: flatten nested data, walk trees recursively, chain generators, and receive a sub-generator\'s return value.',
      keywords: ['yield from', 'delegate', 'delegation', 'subgenerator', 'recursive generator', 'recursion', 'flatten', 'tree', 'traversal', 'chain', 'return value', 'generator'],
      docs: 'https://docs.python.org/3/reference/expressions.html#yield-expressions',
      body: [
        '`yield from iterable` yields every item of the iterable, one by one, as if you had written the loop:',
        py('def letters_then_numbers():',
           '    yield from "ab"            # the same as: for x in "ab": yield x',
           '    yield from range(3)',
           '',
           'print(list(letters_then_numbers()))'),
        '## Flattening nested data',
        'It shines in recursion: a generator that calls itself on the nested parts and passes on whatever they yield:',
        py('def flatten(items):',
           '    for item in items:',
           '        if isinstance(item, list):',
           '            yield from flatten(item)       # hand the nested list to another call',
           '        else:',
           '            yield item',
           '',
           'print(list(flatten([1, [2, [3, [4]], 5], [], 6])))'),
        '## Walking a tree',
        'A folder tree, an org chart, a parsed document: a depth-first walk takes a few lines, and it stays lazy, so a caller can stop early:',
        py('tree = {"name": "root", "children": [',
           '    {"name": "src", "children": [{"name": "app.py", "children": []}]},',
           '    {"name": "README.md", "children": []},',
           ']}',
           '',
           'def walk(node, depth=0):',
           '    yield "  " * depth + node["name"]',
           '    for child in node["children"]:',
           '        yield from walk(child, depth + 1)',
           '',
           'for line in walk(tree):',
           '    print(line)'),
        '## Chaining generators',
        py('def header():',
           '    yield "name,qty"',
           '',
           'def rows(data):',
           '    for name, qty in data:',
           '        yield f"{name},{qty}"',
           '',
           'def csv_lines(data):',
           '    yield from header()',
           '    yield from rows(data)',
           '',
           'for line in csv_lines([("pen", 3), ("ink", 1)]):',
           '    print(line)'),
        '## A sub-generator\'s return value',
        'A generator can `return` a value when it finishes. A plain loop over it never sees that value; `result = yield from sub()` receives it, after passing all of `sub`\'s items on:',
        py('def numbered(items):',
           '    count = 0',
           '    for item in items:',
           '        count += 1',
           '        yield f"{count}. {item}"',
           '    return count                       # travels inside StopIteration',
           '',
           'def report(sections):',
           '    total = 0',
           '    for title, items in sections:',
           '        yield title',
           '        total += yield from numbered(items)',
           '    yield f"{total} items"',
           '',
           'for line in report([("Fruit", ["apple", "fig"]), ("Tea", ["chai"])]):',
           '    print(line)'),
        'This is also how coroutines worked before `async` and `await`: Python 3.4\'s `asyncio` was built on `yield from`. Today the everyday uses are the first three: flattening, trees and chaining.',
        '| Without yield from | With yield from |\n|---|---|\n| `for x in sub():` then `yield x` | `yield from sub()` |\n| `itertools.chain(a, b)` inside a generator | `yield from a`, then `yield from b` |\n| a recursive function building lists | a recursive generator, lazy |'
      ].join('\n\n'),
      java: 'Java has no generators, so a recursive traversal either builds a whole `List` (all in memory, with no early stop) or becomes a hand-written iterator with an explicit stack. `Stream.flatMap` is the closest lazy tool, for one level of nesting. `yield from` gives a recursive, lazy traversal in the shape you would draw it.',
      example: {
        code: String.raw`import os


def make_project():
    os.makedirs("project/src/utils", exist_ok=True)
    os.makedirs("project/docs", exist_ok=True)
    for path in ["project/README.md", "project/src/app.py", "project/src/utils/text.py", "project/docs/guide.md"]:
        with open(path, "w", encoding="utf-8") as f:
            f.write("x" * len(path))


def files(folder):
    """Every file under folder, depth first, in name order."""
    for entry in sorted(os.scandir(folder), key=lambda e: e.name):
        if entry.is_dir():
            yield from files(entry.path)
        else:
            yield entry.path.replace(os.sep, "/")


def python_files(folder):
    return (path for path in files(folder) if path.endswith(".py"))


make_project()
for path in files("project"):
    print(path)
print("first .py file:", next(python_files("project")))
`,
        note: '`next(python_files(...))` stops the walk at the first match: the rest of the tree is never read.'
      },
      challenge: {
        title: 'Flatten, walk and chain',
        task: [
          '1. `flatten(nested)` yields every item of nested lists and tuples, at any depth, in order. Strings are items, not containers: `flatten(["ab", ["cd"]])` gives `"ab"` and `"cd"`.',
          '2. `walk(tree)` yields the `"name"` of every node of a tree such as `{"name": "a", "children": [...]}`, depth first: a node, then the subtree of each child in order.',
          '3. `chain_all(*iterables)` yields the items of each iterable in turn, like `itertools.chain`.',
          '4. Use `yield from`, and keep all three lazy.'
        ].join('\n\n'),
        starter: String.raw`def flatten(nested):
    result = []
    for item in nested:
        if isinstance(item, (list, tuple)):
            for inner in item:
                result.append(inner)
        else:
            result.append(item)
    return result


def walk(tree):
    return [tree["name"]] + [child["name"] for child in tree["children"]]


def chain_all(*iterables):
    return list(iterables)


print(flatten([1, [2, [3]]]))
`,
        solution: String.raw`def flatten(nested):
    for item in nested:
        if isinstance(item, (list, tuple)):
            yield from flatten(item)
        else:
            yield item


def walk(tree):
    yield tree["name"]
    for child in tree["children"]:
        yield from walk(child)


def chain_all(*iterables):
    for it in iterables:
        yield from it


tree = {"name": "a", "children": [{"name": "b", "children": [{"name": "c", "children": []}]}, {"name": "d", "children": []}]}
print(list(flatten([1, [2, (3, [4])], "xy"])), list(walk(tree)), list(chain_all("ab", [1])))
`,
        hints: [
          '`flatten`: loop over the items; when an item is a list or tuple, `yield from flatten(item)`, otherwise `yield item`. Testing for `(list, tuple)` leaves strings alone.',
          '`walk`: `yield tree["name"]`, then `for child in tree["children"]: yield from walk(child)`.',
          '`chain_all`: `for it in iterables: yield from it`. Never call `list()` on an input: it may be endless.'
        ],
        checks: [
          { label: '`flatten` handles any depth', code: 'assert list(flatten([1, [2, (3, [4, [5]])], 6])) == [1, 2, 3, 4, 5, 6]\nassert list(flatten([])) == []' },
          { label: 'Strings are items, not containers', code: 'assert list(flatten(["ab", ["cd", ("ef",)]])) == ["ab", "cd", "ef"]' },
          { label: '`walk` visits the tree depth first', code: 'tree = {"name": "a", "children": [{"name": "b", "children": [{"name": "c", "children": []}]}, {"name": "d", "children": []}]}\nassert list(walk(tree)) == ["a", "b", "c", "d"]' },
          { label: '`chain_all` joins any iterables, endless ones too', code: 'from itertools import count, islice\nassert list(chain_all("ab", [1], ())) == ["a", "b", 1]\nassert list(islice(chain_all([0], count(10)), 3)) == [0, 10, 11]' },
          { label: 'All three are generators using `yield from`', code: 'import inspect\nassert uses("YieldFrom"), "use yield from"\nfor f in (flatten, walk, chain_all):\n    assert inspect.isgeneratorfunction(f), f"{f.__name__} should be a generator"' },
          { label: '`walk` is lazy: it stops when the caller stops', code: 'seen = []\nclass Node(dict):\n    def __getitem__(self, key):\n        if key == "name":\n            seen.append(dict.__getitem__(self, "name"))\n        return dict.__getitem__(self, key)\ntree = Node(name="a", children=[Node(name="b", children=[]), Node(name="c", children=[])])\nassert next(walk(tree)) == "a" and seen == ["a"], f"walk read {seen} to give the first name"' }
        ]
      }
    }
  );
})(window.PYLT);
