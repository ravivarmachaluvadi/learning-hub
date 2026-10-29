/*
 * Practice, part 2: the Medium katas. The kata shape is described at the top of data/katas-easy.js.
 */
(function (U) {
  var K = U.data.katas = U.data.katas || [];

  K.push(
    {
      id: 'group-anagrams', level: 'Medium', title: 'Group anagrams',
      summary: 'Put words made of the same letters together, keyed by their sorted letters in a defaultdict.',
      patterns: ['hashing', 'sorting'], keywords: ['anagram', 'defaultdict', 'group by'],
      learn: ['lesson:py-collections', 'lesson:py-zip-enumerate-sorted'],
      java: 'Java: `Collectors.groupingBy(w -> sorted(w))` with a helper that sorts the char array. In Python, `"".join(sorted(word))` is the key, and a `defaultdict(list)` starts each group empty.',
      task: 'Write `group_anagrams(words)`, which returns the groups of words that are anagrams of each other. To make the answer exact, sort the words inside each group, and sort the groups (a list of lists sorts by its first word). `group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])` is `[["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]`.',
      starter: String.raw`def group_anagrams(words):
    groups = {}
    for word in words:
        groups.setdefault(len(word), []).append(word)
    return list(groups.values())


print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))
`,
      solution: String.raw`from collections import defaultdict


def group_anagrams(words):
    groups = defaultdict(list)
    for word in words:
        groups["".join(sorted(word))].append(word)
    return sorted(sorted(group) for group in groups.values())


print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))
`,
      hints: [
        'Two words are anagrams when their sorted letters are equal: `"".join(sorted("tea"))` is `"aet"`. Use that as the dict key.',
        '`defaultdict(list)` gives a new empty list the first time a key is used, so `groups[key].append(word)` always works.',
        'Last, `sorted(sorted(g) for g in groups.values())`.'
      ],
      checks: [
        { label: 'The example', code: String.raw`assert group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]) == [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]` },
        { label: 'Same length is not enough: `"ab"` and `"cd"` stay apart', code: String.raw`assert group_anagrams(["ab", "cd", "ba"]) == [["ab", "ba"], ["cd"]]` },
        { label: 'A repeated word stays twice in its group', code: String.raw`assert group_anagrams(["a", "a"]) == [["a", "a"]]` },
        { label: 'No words: no groups', code: String.raw`assert group_anagrams([]) == []` }
      ]
    },
    {
      id: 'top-k-frequent', level: 'Medium', title: 'Top k frequent',
      summary: 'The k most frequent values, with ties broken by value: a heap keeps only what it needs.',
      patterns: ['heapq', 'counting'], keywords: ['priority queue', 'heap', 'nlargest', 'nsmallest', 'frequency'],
      learn: ['lesson:py-collections', 'ref:mod-heapq', 'ref:mod-collections'],
      java: 'Java keeps a `PriorityQueue` of size k with a comparator on the count. Python\'s `heapq` works on a plain list (a min-heap); `heapq.nsmallest(k, items, key=...)` does the whole job, in n log k steps rather than the n log n of a full sort.',
      task: 'Write `top_k_frequent(nums, k)`, which returns the `k` values that occur most often, most frequent first. When two values occur equally often, the **smaller value comes first**. `top_k_frequent([1, 1, 1, 2, 2, 3], 2)` is `[1, 2]`; `top_k_frequent([5, 3, 5, 3, 9], 1)` is `[3]`.\n\nUse `heapq` (the point of this kata): count with `Counter`, then let `heapq.nsmallest` (or `nlargest`) pick the top k with a key.',
      starter: String.raw`from collections import Counter


def top_k_frequent(nums, k):
    return [n for n, _ in Counter(nums).most_common(k)]


print(top_k_frequent([1, 1, 1, 2, 2, 3], 2))
`,
      solution: String.raw`import heapq
from collections import Counter


def top_k_frequent(nums, k):
    counts = Counter(nums)
    return heapq.nsmallest(k, counts, key=lambda n: (-counts[n], n))


print(top_k_frequent([1, 1, 1, 2, 2, 3], 2))
`,
      hints: [
        '`most_common` breaks ties by the order values first appeared, not by value.',
        'The key `(-counts[n], n)` sorts by count, highest first, then by value. `heapq.nsmallest(k, counts, key=...)` takes the k smallest keys (iterating a Counter gives its values).'
      ],
      checks: [
        { label: '`top_k_frequent([1, 1, 1, 2, 2, 3], 2)` is `[1, 2]`', code: String.raw`assert top_k_frequent([1, 1, 1, 2, 2, 3], 2) == [1, 2]` },
        { label: 'A tie goes to the smaller value', code: String.raw`assert top_k_frequent([5, 3, 5, 3, 9], 1) == [3]
assert top_k_frequent([4, 4, 6, 6, 5, 5, 1], 3) == [4, 5, 6]` },
        { label: 'k as big as the number of values returns them all', code: String.raw`assert top_k_frequent([2, 1, 2], 2) == [2, 1]` },
        { label: 'It uses `heapq`', code: String.raw`assert any(isinstance(n, (ast.Import, ast.ImportFrom)) and "heapq" in ast.unparse(n) for n in ast.walk(tree)), "pick the top k with the heapq module"` }
      ]
    },
    {
      id: 'k-closest', level: 'Medium', title: 'The k closest points',
      summary: 'The k points nearest the origin: compare squared distances (no square roots) with a heap.',
      patterns: ['heapq', 'sorting'], keywords: ['distance', 'nearest', 'nsmallest', 'heap'],
      learn: ['ref:mod-heapq', 'lesson:py-tuples', 'lesson:py-lambdas'],
      java: 'Java: a max-heap of size k (`PriorityQueue` with a reversed comparator). Python: `heapq.nsmallest(k, points, key=...)`, where the key is a tuple, so ties are broken by the next item without writing a comparator.',
      task: 'Write `k_closest(points, k)`. `points` is a list of `(x, y)` tuples; return the `k` closest to `(0, 0)`, closest first. On equal distance, the smaller point (as a tuple: by x, then y) comes first. `k_closest([(1, 3), (-2, 2)], 1)` is `[(-2, 2)]`. Do not change the list you are given.',
      starter: String.raw`def k_closest(points, k):
    return sorted(points, key=lambda p: p[0] + p[1])[:k]


print(k_closest([(3, 3), (5, -1), (-2, 4)], 2))
`,
      solution: String.raw`import heapq


def k_closest(points, k):
    return heapq.nsmallest(k, points, key=lambda p: (p[0] ** 2 + p[1] ** 2, p))


print(k_closest([(3, 3), (5, -1), (-2, 4)], 2))
`,
      hints: [
        '`x + y` is not a distance (and goes wrong with negative numbers). The distance is `sqrt(x² + y²)`, but comparing `x ** 2 + y ** 2` gives the same order without the square root.',
        'Make the key a tuple, `(x ** 2 + y ** 2, p)`, so equal distances fall back to the point itself.'
      ],
      checks: [
        { label: '`k_closest([(1, 3), (-2, 2)], 1)` is `[(-2, 2)]`', code: String.raw`assert k_closest([(1, 3), (-2, 2)], 1) == [(-2, 2)]` },
        { label: 'Closest first, negative coordinates included', code: String.raw`assert k_closest([(3, 3), (5, -1), (-2, 4)], 2) == [(3, 3), (-2, 4)]` },
        { label: 'Equal distances: the smaller point first', code: String.raw`assert k_closest([(1, 0), (0, 1), (-1, 0)], 2) == [(-1, 0), (0, 1)]` },
        { label: 'k = 0 gives `[]`, and the list given is not changed', code: String.raw`pts = [(2, 2), (1, 1)]
assert k_closest(pts, 0) == []
k_closest(pts, 1)
assert pts == [(2, 2), (1, 1)]` }
      ]
    },
    {
      id: 'longest-unique', level: 'Medium', title: 'Longest substring without repeats',
      summary: 'A sliding window over the text, and a dict of where each character was last seen.',
      patterns: ['sliding-window', 'hashing'], keywords: ['substring', 'window', 'two pointers', 'interview'],
      learn: ['lesson:py-dicts-sets', 'ref:fn-enumerate'],
      java: 'The same window as in Java: a start index and a `Map<Character, Integer>` of last positions. `enumerate` hands you the index and the character together.',
      task: 'Write `longest_unique(text)`, which returns the **length** of the longest run of consecutive characters with no character repeated. `"abcabcbb"` gives 3 (`"abc"`), `"bbbbb"` gives 1, `"pwwkew"` gives 3 (`"wke"`), and `""` gives 0.',
      starter: String.raw`def longest_unique(text):
    return len(set(text))


print(longest_unique("pwwkew"))
`,
      solution: String.raw`def longest_unique(text):
    last = {}            # character -> where it was last seen
    start = best = 0     # the window is text[start:i + 1]
    for i, ch in enumerate(text):
        if ch in last and last[ch] >= start:
            start = last[ch] + 1
        last[ch] = i
        best = max(best, i - start + 1)
    return best


print(longest_unique("pwwkew"))
`,
      hints: [
        'Keep a window `text[start:i + 1]` with no repeats. When the character at `i` was already seen **inside** the window, move `start` just past where it was seen.',
        'A dict `last` maps each character to its last position. Check `last[ch] >= start`: a sighting before the window does not matter (try `"abba"`).'
      ],
      checks: [
        { label: '`"abcabcbb"` gives 3', code: String.raw`assert longest_unique("abcabcbb") == 3` },
        { label: '`"bbbbb"` gives 1, `""` gives 0', code: String.raw`assert longest_unique("bbbbb") == 1 and longest_unique("") == 0` },
        { label: '`"pwwkew"` gives 3', code: String.raw`assert longest_unique("pwwkew") == 3` },
        { label: 'A repeat from before the window does not count: `"abba"` gives 2', code: String.raw`assert longest_unique("abba") == 2` },
        { label: '`"dvdf"` gives 3', code: String.raw`assert longest_unique("dvdf") == 3` }
      ]
    },
    {
      id: 'binary-search', level: 'Medium', title: 'Binary search: the first position',
      summary: 'Where does a value first appear in a sorted list? Halve the range each step, or let bisect do it.',
      patterns: ['bisect'], keywords: ['binary search', 'bisect_left', 'log n', 'sorted'],
      learn: ['lesson:py-lists'],
      java: 'Java\'s `Collections.binarySearch` returns *some* matching index, not necessarily the first. Python\'s [bisect](https://docs.python.org/3/library/bisect.html) module has `bisect_left`, which returns the first position where the value could be inserted, so it finds the first match.',
      task: 'Write `first_index(nums, target)`. `nums` is sorted in ascending order and may repeat values; return the index of the **first** `target`, or `-1` when it is not there. `first_index([1, 2, 2, 2, 3], 2)` is `1`.\n\nIt must read the list only about log₂(n) times: for a million items, at most 25 reads of `nums[i]`. (The checks hand you a list that counts its reads. A loop over every item reads it a million times.)',
      starter: String.raw`def first_index(nums, target):
    for i in range(len(nums)):
        if nums[i] == target:
            return i
    return -1


print(first_index([1, 2, 2, 2, 3], 2))
`,
      solution: String.raw`from bisect import bisect_left


def first_index(nums, target):
    i = bisect_left(nums, target)
    return i if i < len(nums) and nums[i] == target else -1


print(first_index([1, 2, 2, 2, 3], 2))
`,
      hints: [
        'By hand: `lo, hi = 0, len(nums)`. While `lo < hi`: `mid = (lo + hi) // 2`; if `nums[mid] < target`, the first match is after mid (`lo = mid + 1`), otherwise it is at mid or before (`hi = mid`). At the end `lo` is the first position where `target` could go.',
        'The standard library does that loop for you: `from bisect import bisect_left`, then `i = bisect_left(nums, target)`.',
        'The value at `i` may still not be `target` (or `i` may be `len(nums)`): check before returning `i`.'
      ],
      checks: [
        { label: '`first_index([1, 3, 5, 7], 5)` is 2', code: String.raw`assert first_index([1, 3, 5, 7], 5) == 2` },
        { label: 'The first of several: `first_index([1, 2, 2, 2, 3], 2)` is 1', code: String.raw`assert first_index([1, 2, 2, 2, 3], 2) == 1` },
        { label: 'Not there: below, between and above give -1; so does an empty list', code: String.raw`assert [first_index([10, 20, 30], t) for t in (5, 25, 35)] == [-1, -1, -1]
assert first_index([], 1) == -1` },
        { label: 'A million items, at most 25 reads', code: String.raw`class Probe:
    """A sorted sequence that counts how often it is read."""
    def __init__(self, items):
        self.items, self.reads = items, 0

    def __len__(self):
        return len(self.items)

    def __getitem__(self, i):
        self.reads += 1
        return self.items[i]


p = Probe(range(0, 2_000_000, 2))
assert first_index(p, 1_234_566) == 617_283
assert p.reads <= 25, f"it read the list {p.reads} times; a binary search needs about 20"` }
      ]
    },
    {
      id: 'merge-intervals', level: 'Medium', title: 'Merge overlapping intervals',
      summary: 'Sort the intervals by start, then each one either extends the last merged interval or starts a new one.',
      patterns: ['sorting'], keywords: ['intervals', 'overlap', 'merge', 'calendar'],
      learn: ['lesson:py-zip-enumerate-sorted', 'lesson:py-tuples'],
      java: 'Java sorts with `Comparator.comparingInt(a -> a[0])`. Tuples in Python already sort by their first item, then the second, so plain `sorted(intervals)` is enough.',
      task: 'Write `merge_intervals(intervals)`. Each interval is a `(start, end)` tuple, in any order. Return the merged intervals as tuples, sorted by start; intervals that overlap **or touch** become one: `merge_intervals([(1, 3), (2, 6), (8, 10)])` is `[(1, 6), (8, 10)]`, and `(1, 4), (4, 5)` merge into `(1, 5)`. Do not change the list you are given.',
      starter: String.raw`def merge_intervals(intervals):
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged


print(merge_intervals([(8, 10), (1, 3), (2, 6)]))
`,
      solution: String.raw`def merge_intervals(intervals):
    merged = []
    for start, end in sorted(intervals):
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged


print(merge_intervals([(8, 10), (1, 3), (2, 6)]))
`,
      hints: [
        'The starter is right for intervals already in order. What if they are not?',
        '`sorted(intervals)` sorts tuples by start (then end), and returns a new list, so the one you were given is untouched.'
      ],
      checks: [
        { label: 'Sorted input', code: String.raw`assert merge_intervals([(1, 3), (2, 6), (8, 10), (15, 18)]) == [(1, 6), (8, 10), (15, 18)]` },
        { label: 'Input in any order', code: String.raw`assert merge_intervals([(8, 10), (1, 3), (2, 6)]) == [(1, 6), (8, 10)]` },
        { label: 'Touching intervals merge; one inside another disappears', code: String.raw`assert merge_intervals([(1, 4), (4, 5)]) == [(1, 5)]
assert merge_intervals([(2, 3), (1, 10)]) == [(1, 10)]` },
        { label: 'No intervals, and the list given is not changed', code: String.raw`given = [(5, 6), (1, 2)]
merge_intervals(given)
assert given == [(5, 6), (1, 2)] and merge_intervals([]) == []` }
      ]
    },
    {
      id: 'flatten', level: 'Medium', title: 'Flatten a nested list',
      summary: 'A generator that walks lists inside lists to any depth: recursion with yield from.',
      patterns: ['recursion'], keywords: ['flatten', 'nested', 'generator', 'yield from', 'isinstance'],
      learn: ['lesson:py-yield-from', 'lesson:py-generators', 'lesson:py-functools-recursion'],
      java: 'In Java this is a recursive method that adds to an accumulator list, or a `flatMap` that only goes one level deep. A Python generator with `yield from flatten(item)` hands each item straight back to the caller, at any depth, without building lists in between.',
      task: 'Write a **generator** `flatten(items)` that yields every item of a nested list, in order, at any depth. Lists and tuples count as nesting; a string is one item (not its letters). `list(flatten([1, [2, [3, [4]]], (5, 6)]))` is `[1, 2, 3, 4, 5, 6]`.',
      starter: String.raw`def flatten(items):
    result = []
    for item in items:
        if isinstance(item, list):
            result.extend(item)
        else:
            result.append(item)
    return result


print(list(flatten([1, [2, [3, [4]]], (5, 6)])))
`,
      solution: String.raw`def flatten(items):
    for item in items:
        if isinstance(item, (list, tuple)):
            yield from flatten(item)
        else:
            yield item


print(list(flatten([1, [2, [3, [4]]], (5, 6)])))
`,
      hints: [
        'The starter goes one level deep. For any depth, a nested list has to be flattened the same way: call `flatten` on it.',
        '`yield from flatten(item)` yields everything the inner call yields. `isinstance(item, (list, tuple))` tests for either type, and leaves strings alone.'
      ],
      checks: [
        { label: 'Any depth, tuples too', code: String.raw`assert list(flatten([1, [2, [3, [4]]], (5, 6)])) == [1, 2, 3, 4, 5, 6]` },
        { label: 'Strings stay whole', code: String.raw`assert list(flatten(["ab", ["cd", ["e"]]])) == ["ab", "cd", "e"]` },
        { label: 'Empty lists vanish', code: String.raw`assert list(flatten([[], [[]], [1, []]])) == [1]` },
        { label: 'It is a generator (it yields, it does not build a list)', code: String.raw`import types
assert isinstance(flatten([1]), types.GeneratorType), "use yield, so flatten is a generator"` }
      ]
    },
    {
      id: 'rotate-matrix', level: 'Medium', title: 'Rotate a matrix',
      summary: 'Turn a grid a quarter turn clockwise: reverse the rows, then zip(*rows) reads the columns.',
      patterns: ['slicing'], keywords: ['matrix', 'transpose', 'zip', 'unpacking', 'grid'],
      learn: ['lesson:py-zip-enumerate-sorted', 'lesson:py-slicing', 'lesson:py-args-kwargs'],
      java: 'Java fills a new array with nested loops: `result[j][rows - 1 - i] = m[i][j]`. In Python, `zip(*m)` hands every row to `zip` as a separate argument, so it yields the columns: that is a transpose in one call.',
      task: 'Write `rotate(matrix)`, which returns a **new** matrix (a list of lists) turned 90° clockwise. The matrix need not be square: 2 rows of 3 become 3 rows of 2. `rotate([[1, 2], [3, 4]])` is `[[3, 1], [4, 2]]`. Do not change the matrix you are given.',
      starter: String.raw`def rotate(matrix):
    return [list(row) for row in zip(*matrix)]


print(rotate([[1, 2, 3], [4, 5, 6]]))
`,
      solution: String.raw`def rotate(matrix):
    return [list(column) for column in zip(*matrix[::-1])]


print(rotate([[1, 2, 3], [4, 5, 6]]))
`,
      hints: [
        '`zip(*matrix)` gives the columns: that turns the matrix over its diagonal (a transpose), which is not yet a rotation.',
        'Reverse the order of the rows first, `matrix[::-1]`, then take the columns.'
      ],
      checks: [
        { label: '2 × 2', code: String.raw`assert rotate([[1, 2], [3, 4]]) == [[3, 1], [4, 2]]` },
        { label: '3 × 3', code: String.raw`assert rotate([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) == [[7, 4, 1], [8, 5, 2], [9, 6, 3]]` },
        { label: '2 rows of 3 become 3 rows of 2', code: String.raw`assert rotate([[1, 2, 3], [4, 5, 6]]) == [[4, 1], [5, 2], [6, 3]]` },
        { label: 'Rows are lists, and the matrix given is not changed', code: String.raw`m = [[1, 2], [3, 4]]
r = rotate(m)
assert all(type(row) is list for row in r) and m == [[1, 2], [3, 4]]` },
        { label: 'Four turns give the matrix back', code: String.raw`m = [[1, 2, 3], [4, 5, 6]]
assert rotate(rotate(rotate(rotate(m)))) == m` }
      ]
    },
    {
      id: 'product-except-self', level: 'Medium', title: 'Product of everything else',
      summary: 'For each position, the product of all the other numbers, without division: products from the left, then from the right.',
      patterns: ['prefix-sums'], keywords: ['prefix product', 'suffix', 'no division', 'interview'],
      learn: ['lesson:py-lists', 'lesson:py-loops'],
      java: 'The same two passes as in Java. `range(n - 1, -1, -1)` walks backwards, like `for (int i = n - 1; i >= 0; i--)`; `reversed(range(n))` says it more plainly.',
      task: 'Write `product_except_self(nums)`, which returns a list where item `i` is the product of every number **except** `nums[i]`. `[1, 2, 3, 4]` gives `[24, 12, 8, 6]`. Do it **without division** (it fails when a number is 0): one pass from the left keeps the product of everything before `i`, one from the right the product of everything after it.',
      starter: String.raw`import math


def product_except_self(nums):
    total = math.prod(nums)
    return [total // n for n in nums]


print(product_except_self([1, 2, 3, 4]))
`,
      solution: String.raw`def product_except_self(nums):
    n = len(nums)
    result = [1] * n
    before = 1
    for i in range(n):
        result[i] = before          # everything left of i
        before *= nums[i]
    after = 1
    for i in reversed(range(n)):
        result[i] *= after          # times everything right of i
        after *= nums[i]
    return result


print(product_except_self([1, 2, 3, 4]))
`,
      hints: [
        'Dividing the total by `nums[i]` breaks as soon as a number is 0.',
        'First pass: `result[i]` = product of `nums[0:i]`, built up as you go. Second pass, backwards: multiply `result[i]` by the product of `nums[i + 1:]`.'
      ],
      checks: [
        { label: '`[1, 2, 3, 4]` gives `[24, 12, 8, 6]`', code: String.raw`assert product_except_self([1, 2, 3, 4]) == [24, 12, 8, 6]` },
        { label: 'One zero', code: String.raw`assert product_except_self([2, 0, 3]) == [0, 6, 0]` },
        { label: 'Two zeros, and negative numbers', code: String.raw`assert product_except_self([0, 4, 0]) == [0, 0, 0]
assert product_except_self([-1, 1, 0, -3, 3]) == [0, 0, 9, 0, 0]` },
        { label: 'No division', code: String.raw`assert not uses("Div", "FloorDiv"), "multiply products from the left and from the right instead of dividing"` }
      ]
    },
    {
      id: 'subarray-sum', level: 'Medium', title: 'Subarrays that sum to k',
      summary: 'Count the runs of consecutive numbers that add up to k, negatives included: prefix sums in a Counter.',
      patterns: ['prefix-sums', 'counting'], keywords: ['prefix sum', 'running total', 'subarray', 'defaultdict', 'interview'],
      learn: ['lesson:py-collections', 'lesson:py-dicts-sets'],
      java: 'Java keeps a `HashMap<Integer, Integer>` of running totals with `getOrDefault`. A `Counter` (or `defaultdict(int)`) returns 0 for a total it has not seen, so `count += seen[total - k]` needs no check.',
      task: 'Write `count_subarrays(nums, k)`: how many runs of one or more consecutive numbers add up to exactly `k`? `count_subarrays([1, 1, 1], 2)` is 2. The numbers may be **negative or zero**, which is why the sliding window in the starter fails: with `[1, -1, 0]` and `k = 0` the answer is 3.\n\nThe idea: with a running total, a run ending here sums to `k` when an earlier running total was `total - k`. Count how often each running total has appeared so far.',
      starter: String.raw`def count_subarrays(nums, k):
    count = left = total = 0
    for right, n in enumerate(nums):
        total += n
        while total > k and left <= right:
            total -= nums[left]
            left += 1
        if total == k:
            count += 1
    return count


print(count_subarrays([1, -1, 0], 0))
`,
      solution: String.raw`from collections import Counter


def count_subarrays(nums, k):
    seen = Counter({0: 1})       # running total -> how often it appeared
    total = count = 0
    for n in nums:
        total += n
        count += seen[total - k]
        seen[total] += 1
    return count


print(count_subarrays([1, -1, 0], 0))
`,
      hints: [
        'A sliding window shrinks when the sum is too big, which only makes sense when every number is positive.',
        'Start with `seen = Counter({0: 1})` (the empty start). For each number: add it to `total`, add `seen[total - k]` to the count, then `seen[total] += 1`.'
      ],
      checks: [
        { label: '`count_subarrays([1, 1, 1], 2)` is 2', code: String.raw`assert count_subarrays([1, 1, 1], 2) == 2` },
        { label: '`count_subarrays([1, 2, 3], 3)` is 2', code: String.raw`assert count_subarrays([1, 2, 3], 3) == 2` },
        { label: 'Negative numbers and zeros', code: String.raw`assert count_subarrays([1, -1, 0], 0) == 3
assert count_subarrays([3, 4, 7, 2, -3, 1, 4, 2], 7) == 4` },
        { label: 'Only zeros: every run counts', code: String.raw`assert count_subarrays([0, 0, 0], 0) == 6` },
        { label: 'No numbers: 0', code: String.raw`assert count_subarrays([], 0) == 0` }
      ]
    },
    {
      id: 'grid-path', level: 'Medium', title: 'Shortest path in a grid',
      summary: 'The fewest moves through a maze: a breadth-first search, with a deque as the queue.',
      patterns: ['deque', 'graphs'], keywords: ['bfs', 'breadth first', 'maze', 'queue', 'shortest path'],
      learn: ['lesson:py-collections', 'lesson:py-tuples'],
      java: 'Java\'s BFS uses an `ArrayDeque` with `offer` and `poll`. Python\'s `collections.deque` has `append` and `popleft`, both O(1). (A list\'s `pop(0)` moves every other item, so it is O(n).)',
      task: 'Write `shortest_path(grid)`. `grid` is a list of strings: `"."` is open, `"#"` is a wall. Moving one square up, down, left or right is one move. Return the fewest moves from the top-left square to the bottom-right one, or `-1` when there is no way through (or either end is a wall).\n\n```text\n..#.\n.##.\n....\n```\n\nThis one takes 5 moves: down, down, then right three times.',
      starter: String.raw`def shortest_path(grid):
    return len(grid) - 1 + len(grid[0]) - 1


print(shortest_path(["..#.", ".##.", "...."]))
`,
      solution: String.raw`from collections import deque


def shortest_path(grid):
    rows, cols = len(grid), len(grid[0])
    goal = (rows - 1, cols - 1)
    if grid[0][0] == "#" or grid[goal[0]][goal[1]] == "#":
        return -1
    queue = deque([(0, 0, 0)])           # row, column, moves so far
    seen = {(0, 0)}
    while queue:
        r, c, moves = queue.popleft()
        if (r, c) == goal:
            return moves
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != "#" and (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append((nr, nc, moves + 1))
    return -1


print(shortest_path(["..#.", ".##.", "...."]))
`,
      hints: [
        'Breadth-first search visits every square 1 move away, then every square 2 moves away, and so on, so the first time it reaches the goal is the shortest way.',
        'Keep a `deque` of `(row, col, moves)` and a `seen` set. Take from the front with `popleft()`; put each open, unseen neighbour at the back with `moves + 1`.',
        'Mark a square as seen when you **add** it to the queue, not when you take it out, or it can be added many times.'
      ],
      checks: [
        { label: 'An open 3 × 3 grid takes 4 moves', code: String.raw`assert shortest_path(["...", "...", "..."]) == 4` },
        { label: 'Around the walls: the example takes 5', code: String.raw`assert shortest_path(["..#.", ".##.", "...."]) == 5` },
        { label: 'A long way round', code: String.raw`assert shortest_path([".#...", ".#.#.", "...#."]) == 10` },
        { label: 'No way through, or a wall at either end: -1', code: String.raw`assert shortest_path([".#", "#."]) == -1
assert shortest_path(["#.", ".."]) == -1 and shortest_path(["..", ".#"]) == -1` },
        { label: 'A single open square: 0 moves', code: String.raw`assert shortest_path(["."]) == 0` },
        { label: 'The queue is a deque (`popleft`)', code: String.raw`assert calls("popleft"), "use collections.deque and popleft(): a list's pop(0) moves every other item"` }
      ]
    },
    {
      id: 'islands', level: 'Medium', title: 'Count the islands',
      summary: 'Count the groups of connected land squares: sink each island with a depth-first search, using a stack list.',
      patterns: ['graphs', 'recursion'], keywords: ['dfs', 'depth first', 'flood fill', 'connected components', 'recursion limit'],
      learn: ['lesson:py-functools-recursion', 'lesson:py-dicts-sets'],
      java: 'Java programmers often write the flood fill recursively and get away with it for small grids. Python stops at about 1,000 nested calls (`RecursionError`), so a big island needs the loop version: a list used as a stack.',
      task: 'Write `count_islands(grid)`. `grid` is a list of strings: `"1"` is land, `"0"` is water. Land squares touching up, down, left or right belong to the same island (diagonals do not). Return the number of islands; an empty grid has 0.\n\n```text\n11000\n11000\n00100\n00011\n```\n\nThis grid has 3. The last check uses a 150 × 150 island: a recursive search goes 22,500 calls deep and stops with `RecursionError`, so use an explicit stack.',
      starter: String.raw`def count_islands(grid):
    return sum(row.count("1") for row in grid)


print(count_islands(["11000", "11000", "00100", "00011"]))
`,
      solution: String.raw`def count_islands(grid):
    rows = len(grid)
    cols = len(grid[0]) if grid else 0
    seen = set()

    def sink(r, c):
        stack = [(r, c)]
        while stack:
            r, c = stack.pop()
            if 0 <= r < rows and 0 <= c < cols and grid[r][c] == "1" and (r, c) not in seen:
                seen.add((r, c))
                stack.extend([(r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)])

    islands = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in seen:
                islands += 1
                sink(r, c)
    return islands


print(count_islands(["11000", "11000", "00100", "00011"]))
`,
      hints: [
        'Walk every square. An unseen land square starts a new island: count it, then mark every square of that island as seen.',
        'To mark an island: a list `stack = [(r, c)]`; pop a square, skip it if it is water, outside or seen; otherwise mark it and push its four neighbours.'
      ],
      checks: [
        { label: 'The example has 3 islands', code: String.raw`assert count_islands(["11000", "11000", "00100", "00011"]) == 3` },
        { label: 'Diagonal squares are separate islands', code: String.raw`assert count_islands(["101", "010", "101"]) == 5` },
        { label: 'All water, or no grid: 0', code: String.raw`assert count_islands(["000", "000"]) == 0 and count_islands([]) == 0` },
        { label: 'A winding island is one island', code: String.raw`assert count_islands(["111", "001", "111", "100", "111"]) == 1` },
        { label: 'A 150 × 150 island (too deep for plain recursion)', code: String.raw`assert count_islands(["1" * 150] * 150) == 1` }
      ]
    },
    {
      id: 'lru-cache', level: 'Medium', title: 'LRU cache',
      summary: 'A fixed-size cache that throws out the least recently used entry: an OrderedDict does the bookkeeping.',
      patterns: ['design', 'hashing'], keywords: ['lru', 'cache', 'ordereddict', 'move_to_end', 'linkedhashmap', 'eviction'],
      learn: ['lesson:py-classes', 'lesson:py-collections', 'ref:mod-functools'],
      java: 'The Java answer is a `LinkedHashMap` built with `accessOrder = true` and `removeEldestEntry` overridden. Python\'s `OrderedDict` gives the same two moves directly: `move_to_end(key)` marks an entry as just used, `popitem(last=False)` removes the oldest. (For caching a function\'s results, `functools.lru_cache` is built in.)',
      task: 'Write a class `LRUCache(capacity)` with two methods, both O(1):\n\n- `get(key)` returns the value, or `-1` when the key is not there. Reading a key makes it the most recently used.\n- `put(key, value)` adds or updates a key, which becomes the most recently used. When that makes the cache hold more than `capacity` keys, the **least recently used** one is removed.',
      starter: String.raw`class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.items = {}

    def get(self, key):
        return self.items.get(key, -1)

    def put(self, key, value):
        self.items[key] = value
        if len(self.items) > self.capacity:
            oldest = next(iter(self.items))
            del self.items[oldest]


cache = LRUCache(2)
cache.put("a", 1)
cache.put("b", 2)
cache.get("a")
cache.put("c", 3)
print(cache.get("a"), cache.get("b"), cache.get("c"))
`,
      solution: String.raw`from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.items = OrderedDict()           # oldest first

    def get(self, key):
        if key not in self.items:
            return -1
        self.items.move_to_end(key)          # just used
        return self.items[key]

    def put(self, key, value):
        self.items[key] = value
        self.items.move_to_end(key)
        if len(self.items) > self.capacity:
            self.items.popitem(last=False)   # the least recently used


cache = LRUCache(2)
cache.put("a", 1)
cache.put("b", 2)
cache.get("a")
cache.put("c", 3)
print(cache.get("a"), cache.get("b"), cache.get("c"))
`,
      hints: [
        'The starter removes the oldest **inserted** key. Reading a key must also count as using it.',
        '`from collections import OrderedDict`. In `get`, `self.items.move_to_end(key)`; in `put`, the same after storing; to evict, `self.items.popitem(last=False)`.'
      ],
      checks: [
        { label: 'Stores and reads values; a missing key gives -1', code: String.raw`c = LRUCache(2)
c.put("a", 1)
assert c.get("a") == 1 and c.get("zz") == -1` },
        { label: 'Reading a key keeps it in the cache', code: String.raw`c = LRUCache(2)
c.put("a", 1)
c.put("b", 2)
c.get("a")
c.put("c", 3)
assert (c.get("a"), c.get("b"), c.get("c")) == (1, -1, 3), "b was used least recently, so b goes"` },
        { label: 'Updating a key refreshes it too', code: String.raw`c = LRUCache(2)
c.put("a", 1)
c.put("b", 2)
c.put("a", 10)
c.put("c", 3)
assert (c.get("a"), c.get("b")) == (10, -1)` },
        { label: 'Capacity 1', code: String.raw`c = LRUCache(1)
c.put(1, "x")
c.put(2, "y")
assert c.get(1) == -1 and c.get(2) == "y"` }
      ]
    },
    {
      id: 'moving-average', level: 'Medium', title: 'Moving average of a stream',
      summary: 'The average of the last n values of a stream: a deque with maxlen forgets the old ones by itself.',
      patterns: ['deque', 'design'], keywords: ['moving average', 'window', 'maxlen', 'stream'],
      learn: ['lesson:py-collections', 'lesson:py-classes'],
      java: 'Java keeps an `ArrayDeque` and removes the head by hand when it is full. `deque(maxlen=n)` drops the oldest item on its own when a new one is appended; keeping a running total avoids summing the window every time.',
      task: 'Write a class `MovingAverage(size)` whose `add(value)` method returns the average of the last `size` values added (or of all of them, while there are fewer). With size 3, adding 1, 10, 3, 5 returns 1.0, 5.5, 4.666…, 6.0.\n\nKeep only the last `size` values: a stream can be endless.',
      starter: String.raw`class MovingAverage:
    def __init__(self, size):
        self.size = size
        self.values = []

    def add(self, value):
        self.values.append(value)
        return sum(self.values) / len(self.values)


m = MovingAverage(3)
print([m.add(v) for v in (1, 10, 3, 5)])
`,
      solution: String.raw`from collections import deque


class MovingAverage:
    def __init__(self, size):
        self.window = deque(maxlen=size)
        self.total = 0

    def add(self, value):
        if len(self.window) == self.window.maxlen:
            self.total -= self.window[0]     # about to be pushed out
        self.window.append(value)
        self.total += value
        return self.total / len(self.window)


m = MovingAverage(3)
print([m.add(v) for v in (1, 10, 3, 5)])
`,
      hints: [
        '`deque(maxlen=3)` holds at most 3 items: appending a fourth drops the first.',
        'Keep a running `total`. Before appending to a full deque, subtract the value that is about to drop out: `self.window[0]`.'
      ],
      checks: [
        { label: 'Size 3: 1.0, 5.5, 4.666…, 6.0', code: String.raw`m = MovingAverage(3)
got = [m.add(v) for v in (1, 10, 3, 5)]
assert all(approx(a, b) for a, b in zip(got, [1.0, 5.5, 14 / 3, 6.0])), f"got {got}"` },
        { label: 'Size 1 returns the last value', code: String.raw`m = MovingAverage(1)
assert [m.add(v) for v in (4, 8)] == [4.0, 8.0]` },
        { label: 'After 10,000 values it keeps only the last few', code: String.raw`m = MovingAverage(3)
for v in range(10000):
    m.add(v)
sizes = [len(v) for v in vars(m).values() if hasattr(v, "__len__") and not isinstance(v, str)]
assert sizes and max(sizes) <= 3, f"it holds {max(sizes)} values; keep only the last 3"` },
        { label: 'It uses a `deque`', code: String.raw`assert calls("deque"), "collections.deque(maxlen=size) drops old values by itself"` }
      ]
    }
  );
})(window.PYLT);
