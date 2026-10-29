/*
 * Quizzes for track 5 (Iteration). The question shape is described at the top of
 * data/quizzes-basics.js.
 */
(function (U) {
  var Q = U.data.quizzes = U.data.quizzes || {};
  function py() { return '```python\n' + [].slice.call(arguments).join('\n') + '\n```'; }

  Q['py-iterators'] = [
    {
      q: 'What does a `for` loop call first, to start walking over `items`?',
      choices: ['`iter(items)`', '`items.next()`', '`len(items)`'],
      answer: 0,
      why: 'The loop asks for an iterator with `iter()`, then calls `next()` on it until `StopIteration`.'
    },
    {
      q: 'What does this print?\n\n' + py('pairs = zip("ab", [1, 2])', 'print(len(list(pairs)), len(list(pairs)))'),
      choices: ['`2 0`', '`2 2`', '`0 0`'],
      answer: 0,
      why: '`zip` returns an iterator, and the first `list()` uses it up: the second finds nothing left. Keep `list(zip(...))` when you need the pairs twice.'
    },
    {
      q: 'How does an iterator say it has no more items?',
      choices: ['`__next__` raises `StopIteration`', '`__next__` returns `None`', '`hasNext()` returns `False`'],
      answer: 0,
      why: 'There is no `hasNext()` in Python: `__next__` either returns an item or raises `StopIteration`, which a `for` loop catches.'
    },
    {
      q: 'Why does a collection\'s `__iter__` usually return a **new** iterator?',
      choices: ['So the collection can be looped over again, from the start', 'Because a `for` loop refuses an object whose `__iter__` returns itself', 'To use less memory'],
      answer: 0,
      why: 'An iterator remembers its position and is used up once. A fresh one per `__iter__` call lets each loop start over, as a list does.'
    }
  ];

  Q['py-generators'] = [
    {
      q: 'What does calling a generator function do?',
      choices: ['It returns a generator object; none of the body runs yet', 'It runs the body to the end and returns a list', 'It runs the body up to the first `yield`'],
      answer: 0,
      why: 'The body starts only on the first `next()`, which runs it up to the first `yield` and pauses there.'
    },
    {
      q: 'What does this print?\n\n' + py('def gen():', '    yield 1', '    yield 2', '', 'g = gen()', 'print(next(g), next(g), next(g, "end"))'),
      choices: ['`1 2 end`', '`1 1 1`', 'An error'],
      answer: 0,
      why: 'Each `next()` resumes where the last one paused. After the second `yield` the generator is finished, so the third `next()` returns its default instead of raising `StopIteration`.'
    },
    {
      q: 'Why can `fibonacci()` loop forever with `while True` and still be useful?',
      choices: ['It pauses at each `yield`, and the caller takes only what it needs', 'Python stops an endless loop after 1,000 rounds', 'Generators run in a separate thread'],
      answer: 0,
      why: 'Nothing runs ahead of time: each value is made only when it is asked for, so `islice(fibonacci(), 10)` costs ten steps.'
    },
    {
      q: 'How many times can you loop over one generator object?',
      choices: ['Once', 'As often as you like', 'Twice'],
      answer: 0,
      why: 'A generator is an iterator: once it has finished, it stays finished. Call the generator function again for a new one, or make `__iter__` a generator so each loop gets its own.'
    }
  ];

  Q['py-lazy-pipelines'] = [
    {
      q: 'In a chain of generators, when is the first item read from the source?',
      choices: ['When the consumer (`list`, `next`, a loop) asks for the first result', 'When the first generator is created', 'When the whole chain has been built'],
      answer: 0,
      why: 'Building the chain runs nothing, like a Java stream before its terminal operation. The consumer pulls items through one at a time.'
    },
    {
      q: 'Which is Java\'s `stream.filter(p).findFirst().orElse(d)`?',
      choices: ['`next((x for x in xs if p(x)), d)`', '`[x for x in xs if p(x)][0]`', '`filter(p, xs)[0]`'],
      answer: 0,
      why: '`next` pulls items only up to the first match, and its default replaces `orElse`. The list version builds every match first, and fails on an empty result.'
    },
    {
      q: 'Why can `sum(1 for line in f if "ERROR" in line)` handle a 10 GB file?',
      choices: ['It holds one line at a time', 'Python compresses the file first', '`sum()` reads files in parallel'],
      answer: 0,
      why: 'A file is an iterator over its lines and the generator expression is lazy, so memory use stays the same however big the file is.'
    },
    {
      q: 'When is a list the better choice than a generator?',
      choices: ['When you need the items more than once, or `len()` and indexing', 'When the data is endless', 'Never'],
      answer: 0,
      why: 'A generator can be walked once and has no length. Make a list when you will reuse the items; keep a generator for big, endless or partly needed data.'
    }
  ];

  Q['py-itertools'] = [
    {
      q: 'What is `[(k, len(list(g))) for k, g in groupby("aabaa")]`?',
      choices: ["`[('a', 2), ('b', 1), ('a', 2)]`", "`[('a', 4), ('b', 1)]`", "`[('a', 2), ('b', 1)]`"],
      answer: 0,
      why: '`groupby` groups **consecutive** equal items, so the two runs of `a` stay separate. Sort first for SQL-style grouping, or use a `defaultdict`.'
    },
    {
      q: 'How do you take the first 5 items of an endless iterator?',
      choices: ['`islice(it, 5)`', '`it[:5]`', '`list(it)[:5]`'],
      answer: 0,
      why: 'Iterators cannot be sliced with `[:5]`, and `list(it)` would never finish. `islice` takes five items and stops.'
    },
    {
      q: 'What is `list(accumulate([1, 2, 3]))`?',
      choices: ['`[1, 3, 6]`', '`6`', '`[1, 2, 3]`'],
      answer: 0,
      why: '`accumulate` gives every running total, not just the last one, which is what `sum` gives.'
    },
    {
      q: 'Which gives every unordered pair from four items, each pair once?',
      choices: ['`combinations(items, 2)`', '`permutations(items, 2)`', '`product(items, repeat=2)`'],
      answer: 0,
      why: '`combinations` ignores order and never repeats a position: 6 pairs from 4 items. `permutations` gives 12 ordered pairs, and `product` 16, including pairs like `(a, a)`.'
    }
  ];

  Q['py-yield-from'] = [
    {
      q: 'Leaving its return value aside, what is `yield from sub()` short for?',
      choices: ['`for x in sub(): yield x`', '`return sub()`', '`yield sub()`'],
      answer: 0,
      why: '`yield from` passes on every item of the inner iterable, one at a time. `yield sub()` would hand out the generator object itself, as one item.'
    },
    {
      q: 'What does this print?\n\n' + py('def inner():', '    yield 1', '    return "done"', '', 'def outer():', '    result = yield from inner()', '    yield result', '', 'print(list(outer()))'),
      choices: ["`[1, 'done']`", '`[1]`', "`['done']`"],
      answer: 0,
      why: '`yield from inner()` passes on the 1, and when `inner` returns, its return value becomes the value of the `yield from` expression, which `outer` then yields.'
    },
    {
      q: 'Why is a recursive generator better than a recursive function that returns lists, for a big tree?',
      choices: ['It is lazy: it yields as it goes, and the caller can stop early', 'It uses no recursion', 'A list cannot hold a tree'],
      answer: 0,
      why: 'The list version builds the whole result before returning anything. The generator hands out each node as soon as it reaches it, so `next(walk(tree))` costs one step.'
    }
  ];
})(window.PYLT);
