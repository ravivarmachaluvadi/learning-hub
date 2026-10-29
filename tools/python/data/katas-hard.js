/*
 * Practice, part 3: the Hard katas. The kata shape is described at the top of data/katas-easy.js.
 */
(function (U) {
  var K = U.data.katas = U.data.katas || [];

  K.push(
    {
      id: 'running-median', level: 'Hard', title: 'Running median',
      summary: 'The median of a stream after every new number: two heaps, the lower half and the upper half.',
      patterns: ['heapq', 'design'], keywords: ['median', 'two heaps', 'max heap', 'stream', 'priority queue'],
      learn: ['ref:mod-heapq', 'lesson:py-classes'],
      java: 'Java uses two `PriorityQueue`s, one built with `Collections.reverseOrder()`. `heapq` only makes min-heaps, so the usual trick is to store the lower half **negated**: the smallest of `-x` is the largest `x`.',
      task: 'Write a class `RunningMedian` with `add(x)` and `median()`. `median()` returns the middle value of everything added so far, or the average of the two middle values when there is an even number of them; with nothing added it raises `ValueError`. Adding 5, 15, 1, 3 gives medians 5, 10.0, 5, 4.0.\n\nEach `add` must take O(log n), not a sort: keep the lower half in a max-heap (negated values) and the upper half in a min-heap, with sizes equal or the lower half one bigger.',
      starter: String.raw`class RunningMedian:
    def __init__(self):
        self.values = []

    def add(self, x):
        self.values.append(x)

    def median(self):
        return self.values[len(self.values) // 2]


r = RunningMedian()
for x in (5, 15, 1, 3):
    r.add(x)
    print(r.median())
`,
      solution: String.raw`import heapq


class RunningMedian:
    def __init__(self):
        self.low = []    # the lower half, negated: -self.low[0] is its largest value
        self.high = []   # the upper half: self.high[0] is its smallest value

    def add(self, x):
        heapq.heappush(self.low, -x)
        heapq.heappush(self.high, -heapq.heappop(self.low))   # move the lower half's largest up
        if len(self.high) > len(self.low):
            heapq.heappush(self.low, -heapq.heappop(self.high))

    def median(self):
        if not self.low:
            raise ValueError("no values yet")
        if len(self.low) > len(self.high):
            return -self.low[0]
        return (-self.low[0] + self.high[0]) / 2


r = RunningMedian()
for x in (5, 15, 1, 3):
    r.add(x)
    print(r.median())
`,
      hints: [
        'Two heaps: `low` holds the smaller half as negated values (so `-low[0]` is its largest), `high` the larger half (`high[0]` is its smallest). The median sits at their tops.',
        'To add: push `-x` onto `low`, then move `low`\'s largest over to `high` (`heappush(high, -heappop(low))`). If `high` is now bigger than `low`, move its smallest back.',
        'An odd count: the median is `-low[0]`. An even count: the average of `-low[0]` and `high[0]`.'
      ],
      checks: [
        { label: 'Adding 5, 15, 1, 3 gives 5, 10.0, 5, 4.0', code: String.raw`r = RunningMedian()
got = []
for x in (5, 15, 1, 3):
    r.add(x)
    got.append(r.median())
assert got == [5, 10.0, 5, 4.0]` },
        { label: 'Negative numbers and repeats', code: String.raw`r = RunningMedian()
for x in (-1, -1, 7, -10, 2):
    r.add(x)
assert r.median() == -1` },
        { label: 'Matches the sorted median on 500 random numbers', code: String.raw`import random
rng = random.Random(3)
r, seen = RunningMedian(), []
for _ in range(500):
    x = rng.randint(-1000, 1000)
    r.add(x)
    seen.append(x)
    s, n = sorted(seen), len(seen)
    want = s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2
    assert r.median() == want, f"after {n} values: got {r.median()}, expected {want}"` },
        { label: 'No values yet raises `ValueError`', code: String.raw`try:
    RunningMedian().median()
except ValueError:
    pass
else:
    raise AssertionError("median() with no values should raise ValueError")` },
        { label: 'It uses heaps (`heapq.heappush`)', code: String.raw`assert calls("heappush"), "keep the two halves in heaps: each add is then O(log n)"` }
      ]
    },
    {
      id: 'dijkstra', level: 'Hard', title: "Dijkstra's shortest paths",
      summary: 'The cheapest distance from one node to every other in a weighted graph: always expand the closest node next, taken from a heap.',
      patterns: ['heapq', 'graphs'], keywords: ['dijkstra', 'shortest path', 'weighted graph', 'priority queue'],
      learn: ['ref:mod-heapq', 'lesson:py-dicts-sets', 'lesson:py-tuples'],
      java: 'The Java version uses a `PriorityQueue<int[]>` with a comparator on the distance. In Python a heap of `(distance, node)` tuples needs no comparator: tuples compare by their first item.',
      task: 'Write `shortest_paths(graph, start)`. `graph` maps each node to a list of `(neighbour, cost)` pairs, costs 0 or more; a node may also appear only as a neighbour. Return a dict from every node reachable from `start` to its cheapest total cost (`start` itself costs 0). Unreachable nodes are left out.\n\n```python\ngraph = {"A": [("B", 4), ("C", 1)], "C": [("B", 2), ("D", 7)], "B": [("D", 1)]}\n```\n\nFrom `"A"`: A 0, C 1, B 3 (through C), D 4 (through C and B).',
      starter: String.raw`from collections import deque


def shortest_paths(graph, start):
    dist = {start: 0}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for nxt, cost in graph.get(node, []):
            if nxt not in dist:
                dist[nxt] = dist[node] + cost
                queue.append(nxt)
    return dist


graph = {"A": [("B", 4), ("C", 1)], "C": [("B", 2), ("D", 7)], "B": [("D", 1)]}
print(shortest_paths(graph, "A"))
`,
      solution: String.raw`import heapq


def shortest_paths(graph, start):
    dist = {start: 0}
    heap = [(0, start)]
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist[node]:
            continue                       # an old, longer entry for this node
        for nxt, cost in graph.get(node, []):
            nd = d + cost
            if nd < dist.get(nxt, float("inf")):
                dist[nxt] = nd
                heapq.heappush(heap, (nd, nxt))
    return dist


graph = {"A": [("B", 4), ("C", 1)], "C": [("B", 2), ("D", 7)], "B": [("D", 1)]}
print(shortest_paths(graph, "A"))
`,
      hints: [
        'The starter takes the first path it finds to each node, which has the fewest edges, not the lowest cost.',
        'Keep a heap of `(distance so far, node)`. Pop the cheapest; for each neighbour, if going through this node is cheaper than the best known, record it and push it.',
        'A node can be pushed several times. When you pop an entry whose distance is larger than the best recorded, skip it.'
      ],
      checks: [
        { label: 'The example: A 0, C 1, B 3, D 4', code: String.raw`g = {"A": [("B", 4), ("C", 1)], "C": [("B", 2), ("D", 7)], "B": [("D", 1)]}
assert shortest_paths(g, "A") == {"A": 0, "C": 1, "B": 3, "D": 4}` },
        { label: 'More edges can be cheaper', code: String.raw`g = {1: [(2, 10), (3, 1)], 3: [(4, 1)], 4: [(5, 1)], 5: [(2, 1)]}
assert shortest_paths(g, 1)[2] == 4` },
        { label: 'Unreachable nodes are left out', code: String.raw`g = {"a": [("b", 1)], "c": [("a", 1)]}
assert shortest_paths(g, "a") == {"a": 0, "b": 1}` },
        { label: 'A node with no edges, and zero costs', code: String.raw`assert shortest_paths({}, "x") == {"x": 0}
assert shortest_paths({"x": [("y", 0)], "y": [("x", 0)]}, "x") == {"x": 0, "y": 0}` },
        { label: 'It uses a heap', code: String.raw`assert calls("heappop"), "take the closest node next with heapq.heappop"` }
      ]
    },
    {
      id: 'course-order', level: 'Hard', title: 'Course order (topological sort)',
      summary: 'Order courses so every prerequisite comes first, and spot a cycle: Kahn\'s algorithm, with a heap for a fixed order.',
      patterns: ['graphs', 'heapq'], keywords: ['topological sort', 'kahn', 'dependencies', 'build order', 'cycle', 'dag'],
      learn: ['lesson:py-dicts-sets', 'ref:mod-heapq', 'lesson:py-exceptions'],
      java: 'Maven and Gradle do exactly this to order a build. In Java: an in-degree `Map`, a queue of nodes with in-degree 0, an exception when nodes are left over. A heap instead of a queue makes the order unique: always the alphabetically first course that is ready.',
      task: 'Write `course_order(courses, prereqs)`. `courses` is a list of names; `prereqs` a list of `(course, needs)` pairs, meaning `needs` must be taken before `course`. Return all the courses in an order where every prerequisite comes first. When several courses could come next, take the **alphabetically first**. If the prerequisites form a cycle, raise `ValueError`.\n\n`course_order(["db", "web", "intro"], [("db", "intro"), ("web", "db")])` is `["intro", "db", "web"]`.',
      starter: String.raw`def course_order(courses, prereqs):
    return sorted(courses)


print(course_order(["db", "web", "intro"], [("db", "intro"), ("web", "db")]))
`,
      solution: String.raw`import heapq


def course_order(courses, prereqs):
    waiting = {c: 0 for c in courses}        # how many prerequisites each still waits for
    unlocks = {c: [] for c in courses}       # what each course is a prerequisite of
    for course, needs in prereqs:
        waiting[course] += 1
        unlocks[needs].append(course)
    ready = [c for c in courses if waiting[c] == 0]
    heapq.heapify(ready)
    order = []
    while ready:
        c = heapq.heappop(ready)
        order.append(c)
        for nxt in unlocks[c]:
            waiting[nxt] -= 1
            if waiting[nxt] == 0:
                heapq.heappush(ready, nxt)
    if len(order) != len(courses):
        raise ValueError("the prerequisites form a cycle")
    return order


print(course_order(["db", "web", "intro"], [("db", "intro"), ("web", "db")]))
`,
      hints: [
        'Count, for each course, how many prerequisites it waits for, and list what each course unlocks.',
        'The courses waiting for nothing are ready. Take the smallest ready one (a heap: `heapq.heappop`), add it to the order, and lower the count of each course it unlocks; a count that reaches 0 makes that course ready.',
        'If some courses never become ready, they wait on each other: a cycle. Compare `len(order)` with `len(courses)`.'
      ],
      checks: [
        { label: 'The example: intro, db, web', code: String.raw`assert course_order(["db", "web", "intro"], [("db", "intro"), ("web", "db")]) == ["intro", "db", "web"]` },
        { label: 'Independent courses come alphabetically', code: String.raw`assert course_order(["c", "a", "b"], []) == ["a", "b", "c"]` },
        { label: 'A course with two prerequisites waits for both', code: String.raw`got = course_order(["ml", "stats", "python", "art"], [("ml", "stats"), ("ml", "python")])
assert got == ["art", "python", "stats", "ml"]` },
        { label: 'A cycle raises `ValueError`', code: String.raw`try:
    course_order(["a", "b", "c"], [("a", "b"), ("b", "c"), ("c", "a")])
except ValueError:
    pass
else:
    raise AssertionError("a cycle should raise ValueError")` },
        { label: 'No courses: `[]`', code: String.raw`assert course_order([], []) == []` }
      ]
    },
    {
      id: 'edit-distance', level: 'Hard', title: 'Edit distance',
      summary: 'The fewest inserts, deletes and replacements that turn one word into another: dynamic programming, one row at a time.',
      patterns: ['dp'], keywords: ['levenshtein', 'dynamic programming', 'memoize', 'cache', 'spell check'],
      learn: ['lesson:py-functools-recursion', 'ref:mod-functools'],
      java: 'Java fills an `int[m + 1][n + 1]` table. Python can do the same, or write the recursive definition and put `@functools.cache` on it, which stores each answer the first time (Java needs a `HashMap` for that).',
      task: 'Write `edit_distance(a, b)`: the fewest single-character edits (insert, delete or replace) that turn `a` into `b`. `"kitten"` → `"sitting"` takes 3; `"horse"` → `"ros"` takes 3; `""` → `"abc"` takes 3.\n\nThe last check uses 200-character words: trying every combination of edits never finishes, so remember answers you have already worked out (a table, or `@cache`).',
      starter: String.raw`def edit_distance(a, b):
    different = sum(1 for x, y in zip(a, b) if x != y)
    return different + abs(len(a) - len(b))


print(edit_distance("horse", "ros"))
`,
      solution: String.raw`def edit_distance(a, b):
    previous = list(range(len(b) + 1))           # turning "" into b[:j] takes j inserts
    for i, ca in enumerate(a, start=1):
        current = [i]                            # turning a[:i] into "" takes i deletes
        for j, cb in enumerate(b, start=1):
            current.append(min(previous[j] + 1,          # delete ca
                               current[j - 1] + 1,       # insert cb
                               previous[j - 1] + (ca != cb)))  # replace, or keep when equal
        previous = current
    return previous[-1]


print(edit_distance("horse", "ros"))
`,
      hints: [
        'Comparing position by position misses inserts: `"horse"` → `"ros"` deletes the `h`, so every letter after it shifts.',
        'Let `d[i][j]` be the distance between the first `i` letters of `a` and the first `j` of `b`. It is the smallest of `d[i-1][j] + 1` (delete), `d[i][j-1] + 1` (insert) and `d[i-1][j-1] + (a[i-1] != b[j-1])` (replace, free when equal). `d[0][j] = j` and `d[i][0] = i`.',
        'Each row only needs the row before it, so two lists are enough.'
      ],
      checks: [
        { label: '`"kitten"` → `"sitting"`: 3', code: String.raw`assert edit_distance("kitten", "sitting") == 3` },
        { label: '`"horse"` → `"ros"`: 3', code: String.raw`assert edit_distance("horse", "ros") == 3` },
        { label: 'From or to nothing; equal words', code: String.raw`assert edit_distance("", "abc") == 3 and edit_distance("abc", "") == 3 and edit_distance("same", "same") == 0` },
        { label: '`"intention"` → `"execution"`: 5', code: String.raw`assert edit_distance("intention", "execution") == 5` },
        { label: '200-character words, quickly', code: String.raw`assert edit_distance("ab" * 100, "ba" * 100) == 2
assert edit_distance("a" * 200, "a" * 199 + "b") == 1` }
      ]
    },
    {
      id: 'coin-change', level: 'Hard', title: 'Fewest coins',
      summary: 'The fewest coins that make an amount, where taking the biggest coin first can be wrong: build the answer for every smaller amount.',
      patterns: ['dp'], keywords: ['coin change', 'dynamic programming', 'greedy', 'knapsack'],
      learn: ['lesson:py-functools-recursion', 'lesson:py-lists'],
      java: 'The usual Java answer fills an `int[amount + 1]` with `amount + 1` as "impossible". In Python, `float("inf")` says "impossible" directly, and `inf + 1` is still `inf`.',
      task: 'Write `fewest_coins(coins, amount)`: the fewest coins (any number of each value in `coins`) that add up to `amount`, or `-1` when it cannot be done. `fewest_coins([1, 2, 5], 11)` is 3 (5 + 5 + 1). Taking the biggest coin first is **not** always right: with `[1, 3, 4]` and 6, it gives 4 + 1 + 1, but 3 + 3 is better.',
      starter: String.raw`def fewest_coins(coins, amount):
    count = 0
    for coin in sorted(coins, reverse=True):
        while amount >= coin:
            amount -= coin
            count += 1
    return count if amount == 0 else -1


print(fewest_coins([1, 3, 4], 6))
`,
      solution: String.raw`def fewest_coins(coins, amount):
    best = [0] + [float("inf")] * amount      # best[a]: fewest coins for the amount a
    for a in range(1, amount + 1):
        for coin in coins:
            if coin <= a:
                best[a] = min(best[a], best[a - coin] + 1)
    return best[amount] if best[amount] != float("inf") else -1


print(fewest_coins([1, 3, 4], 6))
`,
      hints: [
        'Work out the answer for every amount from 0 up: `best[0] = 0`, and for any other amount `a`, try each coin as the last one: `best[a - coin] + 1`.',
        'Start every `best[a]` at `float("inf")` (not possible yet). At the end, `inf` means -1.'
      ],
      checks: [
        { label: '`fewest_coins([1, 2, 5], 11)` is 3', code: String.raw`assert fewest_coins([1, 2, 5], 11) == 3` },
        { label: 'Biggest-first is wrong here: `[1, 3, 4]` and 6 is 2', code: String.raw`assert fewest_coins([1, 3, 4], 6) == 2` },
        { label: 'Impossible: `[2]` and 3 is -1', code: String.raw`assert fewest_coins([2], 3) == -1` },
        { label: 'An amount of 0 takes 0 coins', code: String.raw`assert fewest_coins([7], 0) == 0` },
        { label: 'A big amount, quickly', code: String.raw`assert fewest_coins([186, 419, 83, 408], 6249) == 20` }
      ]
    },
    {
      id: 'longest-increasing', level: 'Hard', title: 'Longest increasing subsequence',
      summary: 'The length of the longest rising run you can pick out (not necessarily side by side), in n log n with bisect.',
      patterns: ['bisect', 'dp'], keywords: ['lis', 'subsequence', 'patience sorting', 'bisect_left'],
      learn: ['lesson:py-lists'],
      java: 'Java\'s `Arrays.binarySearch` returns a negative insertion point when the value is missing, which then needs decoding. Python\'s `bisect_left` always returns the insertion point. See [bisect](https://docs.python.org/3/library/bisect.html).',
      task: 'Write `lis_length(nums)`: the length of the longest **strictly** increasing subsequence, the numbers picked in order but not necessarily next to each other. `[10, 9, 2, 5, 3, 7, 101, 18]` gives 4 (for example 2, 3, 7, 18).\n\nThe n log n way: keep `tails`, where `tails[k]` is the smallest number that can end a rising subsequence of length `k + 1`. For each number, `bisect_left(tails, n)` says which entry it improves, or that it extends the longest one.',
      starter: String.raw`def lis_length(nums):
    best = run = 0
    for i, n in enumerate(nums):
        run = run + 1 if i and n > nums[i - 1] else 1
        best = max(best, run)
    return best


print(lis_length([10, 9, 2, 5, 3, 7, 101, 18]))
`,
      solution: String.raw`from bisect import bisect_left


def lis_length(nums):
    tails = []
    for n in nums:
        i = bisect_left(tails, n)
        if i == len(tails):
            tails.append(n)        # extends the longest one
        else:
            tails[i] = n           # a smaller end for subsequences of length i + 1
    return len(tails)


print(lis_length([10, 9, 2, 5, 3, 7, 101, 18]))
`,
      hints: [
        'The starter finds the longest run of **neighbours**. A subsequence may skip numbers.',
        'For each `n`: `i = bisect_left(tails, n)`. If `i == len(tails)`, append `n`; otherwise replace `tails[i]` with `n`. The answer is `len(tails)`.',
        '`bisect_left` (not `bisect_right`) keeps it strictly increasing: an equal number replaces, it does not extend.'
      ],
      checks: [
        { label: '`[10, 9, 2, 5, 3, 7, 101, 18]` gives 4', code: String.raw`assert lis_length([10, 9, 2, 5, 3, 7, 101, 18]) == 4` },
        { label: '`[0, 1, 0, 3, 2, 3]` gives 4', code: String.raw`assert lis_length([0, 1, 0, 3, 2, 3]) == 4` },
        { label: 'Strictly increasing: `[7, 7, 7]` gives 1; `[]` gives 0', code: String.raw`assert lis_length([7, 7, 7]) == 1 and lis_length([]) == 0` },
        { label: 'Matches a slow, sure answer on 200 random lists', code: String.raw`import random
def slow(nums):
    best = [1] * len(nums)
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                best[i] = max(best[i], best[j] + 1)
    return max(best, default=0)
rng = random.Random(5)
for _ in range(200):
    nums = [rng.randint(0, 30) for _ in range(rng.randint(0, 40))]
    assert lis_length(nums) == slow(nums), f"{nums}: got {lis_length(nums)}, expected {slow(nums)}"` },
        { label: 'It uses `bisect`', code: String.raw`assert calls("bisect_left") or calls("bisect") or calls("bisect_right"), "find the place in tails with bisect: n log n"` }
      ]
    },
    {
      id: 'trie', level: 'Hard', title: 'Autocomplete with a trie',
      summary: 'A tree of letters for prefix lookups: nested dicts, one level per character.',
      patterns: ['design', 'hashing'], keywords: ['trie', 'prefix tree', 'autocomplete', 'setdefault'],
      learn: ['lesson:py-classes', 'lesson:py-dicts-sets', 'ref:dict-setdefault'],
      java: 'A Java trie has a `Node` class with a `Map<Character, Node>` and a `boolean end`. In Python each node can simply be a dict from character to child dict, with a marker key for "a word ends here"; `setdefault` creates a child only when it is missing.',
      task: 'Write a class `Trie` with:\n\n- `insert(word)`;\n- `contains(word)`: `True` only for a whole word that was inserted;\n- `starts_with(prefix)`: `True` when some inserted word starts with `prefix`;\n- `complete(prefix, limit=10)`: the inserted words that start with `prefix`, **alphabetically**, at most `limit` of them, each once.\n\nStore it as a real trie (nested dicts, one level per letter), not a list of every word: then a lookup costs the length of the word, however many words there are.',
      starter: String.raw`class Trie:
    def __init__(self):
        self.words = []

    def insert(self, word):
        self.words.append(word)

    def contains(self, word):
        return word in self.words

    def starts_with(self, prefix):
        return any(w.startswith(prefix) for w in self.words)

    def complete(self, prefix, limit=10):
        return [w for w in self.words if w.startswith(prefix)]


t = Trie()
for w in ("card", "care", "car", "cat", "dog"):
    t.insert(w)
print(t.complete("ca"))
`,
      solution: String.raw`END = "$"          # the key that marks "a word ends here"


class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node[END] = True

    def _find(self, prefix):
        node = self.root
        for ch in prefix:
            node = node.get(ch)
            if node is None:
                return None
        return node

    def contains(self, word):
        node = self._find(word)
        return node is not None and END in node

    def starts_with(self, prefix):
        return self._find(prefix) is not None

    def complete(self, prefix, limit=10):
        found = []

        def walk(node, text):
            if len(found) >= limit:
                return
            if END in node:
                found.append(text)
            for ch in sorted(k for k in node if k != END):
                walk(node[ch], text + ch)

        start = self._find(prefix)
        if start is not None:
            walk(start, prefix)
        return found[:limit]


t = Trie()
for w in ("card", "care", "car", "cat", "dog"):
    t.insert(w)
print(t.complete("ca"))
`,
      hints: [
        'Each node is a dict from a character to the next node. `insert` walks down with `node = node.setdefault(ch, {})`, then marks the end with a special key, such as `"$"`.',
        'Write one helper that walks down a prefix and returns its node (or `None`). `contains` needs the end mark at that node; `starts_with` only needs the node.',
        'For `complete`, walk the tree below the prefix\'s node, visiting the children in `sorted` order: words then come out alphabetically ("car" before "card").'
      ],
      checks: [
        { label: '`contains` knows whole words, not prefixes', code: String.raw`t = Trie()
t.insert("card")
assert t.contains("card") and not t.contains("car") and not t.contains("cards")` },
        { label: '`starts_with`', code: String.raw`t = Trie()
t.insert("card")
assert t.starts_with("ca") and t.starts_with("card") and t.starts_with("") and not t.starts_with("cb")` },
        { label: '`complete` is alphabetical, each word once', code: String.raw`t = Trie()
for w in ("card", "care", "car", "cat", "dog", "car"):
    t.insert(w)
assert t.complete("ca") == ["car", "card", "care", "cat"], t.complete("ca")
assert t.complete("x") == []` },
        { label: '`complete` stops at `limit`', code: String.raw`t = Trie()
for w in ("ab", "abc", "abd", "abe"):
    t.insert(w)
assert t.complete("ab", limit=2) == ["ab", "abc"]` },
        { label: 'It is a tree, not a list of every word', code: String.raw`t = Trie()
for w in ("one", "two", "three", "four"):
    t.insert(w)
assert not any(isinstance(v, (list, set)) and len(v) >= 3 for v in vars(t).values()), "keep nested dicts, one level per letter"` }
      ]
    },
    {
      id: 'rate-limiter', level: 'Hard', title: 'A sliding-window rate limiter',
      summary: 'At most n requests per user in any window of t seconds: a deque of recent times per user.',
      patterns: ['deque', 'sliding-window', 'design'], keywords: ['rate limit', 'throttle', 'api', 'defaultdict', 'window'],
      learn: ['lesson:py-collections', 'lesson:py-classes'],
      java: 'In a Spring service this is often Bucket4j or Resilience4j\'s `RateLimiter`. Written by hand in Java: a `Map<String, Deque<Long>>`. A `defaultdict(deque)` creates each user\'s deque on first use.',
      task: 'Write a class `RateLimiter(limit, per_seconds)` with `allow(user, now)`, which returns `True` and counts the request when `user` has made fewer than `limit` **allowed** requests in the last `per_seconds` seconds, otherwise `False`. A request at time `t` counts until time `t + per_seconds` (at that moment it no longer does). Times are numbers of seconds and never go backwards. Users are independent.\n\nA fixed window (as in the starter, counting per whole 10 seconds) lets a burst through at the boundary: 3 requests at 9.5 and 3 more at 10.1. A sliding window does not.',
      starter: String.raw`class RateLimiter:
    def __init__(self, limit, per_seconds):
        self.limit, self.window = limit, per_seconds
        self.counts = {}

    def allow(self, user, now):
        bucket = (user, int(now // self.window))
        self.counts[bucket] = self.counts.get(bucket, 0) + 1
        return self.counts[bucket] <= self.limit


r = RateLimiter(3, 10)
print([r.allow("ann", t) for t in (9.0, 9.5, 9.9, 10.1)])
`,
      solution: String.raw`from collections import defaultdict, deque


class RateLimiter:
    def __init__(self, limit, per_seconds):
        self.limit, self.window = limit, per_seconds
        self.recent = defaultdict(deque)        # user -> times of their allowed requests

    def allow(self, user, now):
        times = self.recent[user]
        while times and times[0] <= now - self.window:
            times.popleft()                     # too old to count
        if len(times) < self.limit:
            times.append(now)
            return True
        return False


r = RateLimiter(3, 10)
print([r.allow("ann", t) for t in (9.0, 9.5, 9.9, 10.1)])
`,
      hints: [
        'Keep, for each user, the times of their allowed requests, oldest first: a `deque`.',
        'On each call, first drop the times that no longer count (`times[0] <= now - per_seconds`), with `popleft()`. Then allow when fewer than `limit` remain.',
        'A refused request is not recorded, so it does not use up the window.'
      ],
      checks: [
        { label: '3 per 10 seconds: the fourth request is refused', code: String.raw`r = RateLimiter(3, 10)
assert [r.allow("ann", t) for t in (0, 1, 2, 3)] == [True, True, True, False]` },
        { label: 'No burst at a window boundary', code: String.raw`r = RateLimiter(3, 10)
assert [r.allow("ann", t) for t in (9.0, 9.5, 9.9, 10.1)] == [True, True, True, False]` },
        { label: 'A request stops counting exactly `per_seconds` later', code: String.raw`r = RateLimiter(1, 10)
assert r.allow("ann", 0) and not r.allow("ann", 9.99) and r.allow("ann", 10)` },
        { label: 'Refused requests do not count', code: String.raw`r = RateLimiter(1, 10)
assert r.allow("ann", 0) and not r.allow("ann", 5) and r.allow("ann", 10), "the refused request at 5 must not block 10"` },
        { label: 'Users are independent', code: String.raw`r = RateLimiter(1, 60)
assert r.allow("ann", 0) and r.allow("bob", 0) and not r.allow("ann", 1)` }
      ]
    },
    {
      id: 'meeting-rooms', level: 'Hard', title: 'Meeting rooms',
      summary: 'How many rooms do these meetings need at once? Sort by start, and keep a heap of when each room frees up.',
      patterns: ['heapq', 'sorting'], keywords: ['intervals', 'overlap', 'scheduling', 'min heap', 'calendar'],
      learn: ['ref:mod-heapq', 'lesson:py-tuples'],
      java: 'Java: sort by start time, then a `PriorityQueue<Integer>` of end times. `heapq.heapreplace(ends, end)` pops the earliest end and pushes the new one in one step.',
      task: 'Write `rooms_needed(meetings)`. Each meeting is a `(start, end)` tuple, in any order. Return the smallest number of rooms that fits them all. A meeting that starts exactly when another ends can use its room. `rooms_needed([(0, 30), (5, 10), (15, 20)])` is 2.',
      starter: String.raw`def rooms_needed(meetings):
    rooms = 1 if meetings else 0
    for (s1, e1), (s2, e2) in zip(meetings, meetings[1:]):
        if s2 < e1:
            rooms += 1
    return rooms


print(rooms_needed([(0, 30), (5, 10), (15, 20)]))
`,
      solution: String.raw`import heapq


def rooms_needed(meetings):
    ends = []                                 # when each room in use frees up
    for start, end in sorted(meetings):
        if ends and ends[0] <= start:
            heapq.heapreplace(ends, end)      # reuse the room that frees up first
        else:
            heapq.heappush(ends, end)         # open another room
    return len(ends)


print(rooms_needed([(0, 30), (5, 10), (15, 20)]))
`,
      hints: [
        'Go through the meetings in order of start time: `sorted(meetings)`.',
        'Keep a min-heap of the end times of the rooms in use. If the earliest end (`ends[0]`) is at or before this start, reuse that room (`heapreplace`); otherwise open a new one (`heappush`). The heap\'s size is the answer.'
      ],
      checks: [
        { label: '`[(0, 30), (5, 10), (15, 20)]` needs 2', code: String.raw`assert rooms_needed([(0, 30), (5, 10), (15, 20)]) == 2` },
        { label: 'Out of order, not overlapping: 1', code: String.raw`assert rooms_needed([(7, 10), (2, 4)]) == 1` },
        { label: 'Back to back shares a room', code: String.raw`assert rooms_needed([(1, 5), (5, 8), (8, 9)]) == 1` },
        { label: 'One long meeting under several short ones: 2', code: String.raw`assert rooms_needed([(1, 10), (2, 3), (4, 5), (6, 7)]) == 2` },
        { label: 'Three at once: 3; none: 0', code: String.raw`assert rooms_needed([(1, 4), (2, 5), (3, 6)]) == 3 and rooms_needed([]) == 0` }
      ]
    },
    {
      id: 'calculator', level: 'Hard', title: 'A calculator without eval',
      summary: 'Evaluate "2 + 3 * (4 - 1)" with the right precedence: split it into tokens, then one function per level of the grammar.',
      patterns: ['parsing', 'recursion'], keywords: ['parser', 'recursive descent', 'tokenize', 'expression', 'precedence', 'eval'],
      learn: ['lesson:py-text', 'lesson:py-closures', 'lesson:py-scope'],
      java: 'The same recursive-descent parser you would write in Java, with the methods nested inside one function: they share the token list and the position through `nonlocal` instead of fields.',
      task: 'Write `calculate(text)` for expressions with numbers (`12`, `3.5`), `+ - * /`, parentheses and a leading minus (`-3`, `2 * -4`, `-(1 + 2)`). `*` and `/` come before `+` and `-`; equal levels go left to right; `/` is true division. `calculate("2 + 3 * 4")` is 14 and `calculate("(2 + 3) * 4")` is 20.\n\nAnything else raises `ValueError`: an unknown character (`"2 $ 3"`), an expression that ends too soon (`"2 +"`), a `(` never closed. Do **not** use `eval`.',
      starter: String.raw`import re


def calculate(text):
    tokens = re.findall(r"\d+|[-+*/]", text)
    value = int(tokens[0])
    for op, number in zip(tokens[1::2], tokens[2::2]):
        if op == "+":
            value += int(number)
        elif op == "-":
            value -= int(number)
        elif op == "*":
            value *= int(number)
        else:
            value /= int(number)
    return value


print(calculate("2 + 3 * 4"))
`,
      solution: String.raw`import re


def calculate(text):
    tokens = re.findall(r"\d+(?:\.\d+)?|[-+*/()]", text)
    if "".join(tokens) != "".join(text.split()):
        raise ValueError(f"unexpected character in {text!r}")
    pos = 0

    def peek():
        return tokens[pos] if pos < len(tokens) else None

    def take():
        nonlocal pos
        pos += 1
        return tokens[pos - 1]

    def expression():                 # term (+ term | - term)*
        value = term()
        while peek() in ("+", "-"):
            op, right = take(), term()
            value = value + right if op == "+" else value - right
        return value

    def term():                       # factor (* factor | / factor)*
        value = factor()
        while peek() in ("*", "/"):
            op, right = take(), factor()
            value = value * right if op == "*" else value / right
        return value

    def factor():                     # -factor | number | ( expression )
        if peek() is None:
            raise ValueError("the expression ends too soon")
        token = take()
        if token == "-":
            return -factor()
        if token == "(":
            value = expression()
            if peek() != ")":
                raise ValueError("a ( is never closed")
            take()
            return value
        if token[0].isdigit():
            return float(token) if "." in token else int(token)
        raise ValueError(f"unexpected {token!r}")

    value = expression()
    if peek() is not None:
        raise ValueError(f"unexpected {peek()!r}")
    return value


print(calculate("2 + 3 * 4"))
`,
      hints: [
        'Split into tokens first: `re.findall(r"\\d+(?:\\.\\d+)?|[-+*/()]", text)`. If gluing the tokens back gives less than the text without spaces, some character was not understood.',
        'One function per level: `expression` handles `+` and `-` between terms, `term` handles `*` and `/` between factors, `factor` is a number, a minus followed by a factor, or `(` expression `)`. Each calls the next level down, so `*` binds tighter.',
        'Keep the position in a variable the nested functions change with `nonlocal pos`. After the whole expression, any token left over is an error.'
      ],
      checks: [
        { label: 'Precedence: `2 + 3 * 4` is 14', code: String.raw`assert calculate("2 + 3 * 4") == 14` },
        { label: 'Parentheses: `(2 + 3) * 4` is 20, `2 * (3 + (4 - 1))` is 12', code: String.raw`assert calculate("(2 + 3) * 4") == 20 and calculate("2 * (3 + (4 - 1))") == 12` },
        { label: 'Left to right: `10 - 4 - 3` is 3, `8 / 4 / 2` is 1.0', code: String.raw`assert calculate("10 - 4 - 3") == 3 and calculate("8 / 4 / 2") == 1.0` },
        { label: 'A leading minus, decimals, no spaces', code: String.raw`assert calculate("-3 + 5") == 2 and calculate("2 * -4") == -8 and calculate("-(1 + 2)") == -3
assert calculate("1.5*2") == 3.0 and calculate("7/2") == 3.5` },
        { label: 'Mistakes raise `ValueError`', code: String.raw`for bad in ("2 +", "(1 + 2", "2 $ 3", "1 2", ")"):
    try:
        calculate(bad)
    except ValueError:
        continue
    raise AssertionError(f"calculate({bad!r}) should raise ValueError")` },
        { label: 'No `eval`', code: String.raw`assert not calls("eval") and not calls("exec"), "parse it yourself: eval would run any Python it is given"` }
      ]
    },
    {
      id: 'balanced-parens', level: 'Hard', title: 'Every balanced string of parentheses',
      summary: 'All the ways to write n pairs of parentheses correctly: build them one character at a time and back out of dead ends.',
      patterns: ['recursion'], keywords: ['backtracking', 'generate', 'catalan', 'combinations'],
      learn: ['lesson:py-functools-recursion', 'lesson:py-closures'],
      java: 'The same backtracking as in Java, with an inner function that appends to a list from the enclosing scope (no extra parameter needed, since it only calls `append`).',
      task: 'Write `balanced(n)`, which returns every string of `n` pairs of parentheses that opens and closes correctly, sorted. `balanced(3)` is `["((()))", "(()())", "(())()", "()(())", "()()()"]`, and `balanced(0)` is `[""]`.\n\nBuild each string character by character: you may add `(` while fewer than `n` have been opened, and `)` while fewer have been closed than opened. That never builds a wrong string, so nothing has to be thrown away.',
      starter: String.raw`from itertools import product


def balanced(n):
    found = []
    for chars in product("()", repeat=2 * n):
        text = "".join(chars)
        if text.count("(") == n:
            found.append(text)
    return sorted(found)


print(balanced(2))
`,
      solution: String.raw`def balanced(n):
    found = []

    def build(text, opened, closed):
        if len(text) == 2 * n:
            found.append(text)
            return
        if opened < n:
            build(text + "(", opened + 1, closed)
        if closed < opened:
            build(text + ")", opened, closed + 1)

    build("", 0, 0)
    return found          # "(" sorts before ")", and is tried first: already sorted


print(balanced(2))
`,
      hints: [
        'Equal numbers of `(` and `)` are not enough: `")("` has one of each.',
        'Write `build(text, opened, closed)`. When `text` has `2 * n` characters, keep it. Otherwise try `(` if `opened < n`, and `)` if `closed < opened`.'
      ],
      checks: [
        { label: '`balanced(1)` and `balanced(3)`', code: String.raw`assert balanced(1) == ["()"]
assert balanced(3) == ["((()))", "(()())", "(())()", "()(())", "()()()"]` },
        { label: '`balanced(0)` is `[""]`', code: String.raw`assert balanced(0) == [""]` },
        { label: 'n = 8: all 1,430, every one balanced, sorted, none twice', code: String.raw`def ok(s):
    depth = 0
    for ch in s:
        depth += 1 if ch == "(" else -1
        if depth < 0:
            return False
    return depth == 0
got = balanced(8)
assert len(got) == 1430 and len(set(got)) == 1430, f"{len(got)} strings, {len(set(got))} different"
assert all(ok(s) for s in got) and got == sorted(got)` },
        { label: 'n = 10 (16,796 strings) quickly', code: String.raw`assert len(balanced(10)) == 16796` }
      ]
    },
    {
      id: 'merge-k-sorted', level: 'Hard', title: 'Merge k sorted lists',
      summary: 'Merge many sorted lists in one pass: a heap holds the current head of each list.',
      patterns: ['heapq'], keywords: ['merge', 'k-way merge', 'external sort', 'heap'],
      learn: ['ref:mod-heapq', 'lesson:py-tuples'],
      java: 'Java puts each list\'s head in a `PriorityQueue` with a comparator. Here the heap holds `(value, list number, position)` tuples: the list number breaks ties between equal values, so the tuples never need to compare anything else. (The standard library has this as `heapq.merge`; write it yourself here.)',
      task: 'Write `merge_k(lists)`: one sorted list holding every item of the given sorted lists. Some lists may be empty. Use a heap of the lists\' current first items: no `sorted()`, `.sort()` or `heapq.merge`. With n items in k lists that is n log k steps. `merge_k([[1, 4, 5], [1, 3, 4], [2, 6]])` is `[1, 1, 2, 3, 4, 4, 5, 6]`.',
      starter: String.raw`def merge_k(lists):
    return [x for lst in lists for x in lst]


print(merge_k([[1, 4, 5], [1, 3, 4], [2, 6]]))
`,
      solution: String.raw`import heapq


def merge_k(lists):
    heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
    heapq.heapify(heap)
    merged = []
    while heap:
        value, i, j = heapq.heappop(heap)
        merged.append(value)
        if j + 1 < len(lists[i]):
            heapq.heappush(heap, (lists[i][j + 1], i, j + 1))
    return merged


print(merge_k([[1, 4, 5], [1, 3, 4], [2, 6]]))
`,
      hints: [
        'Start the heap with `(first item, list number, 0)` for each list that is not empty, then `heapq.heapify(heap)`.',
        'Pop the smallest, append its value, and push the next item of the **same** list, if it has one.'
      ],
      checks: [
        { label: 'The example', code: String.raw`assert merge_k([[1, 4, 5], [1, 3, 4], [2, 6]]) == [1, 1, 2, 3, 4, 4, 5, 6]` },
        { label: 'Empty lists, and no lists', code: String.raw`assert merge_k([[], [3], []]) == [3] and merge_k([]) == []` },
        { label: 'Strings merge too', code: String.raw`assert merge_k([["b", "d"], ["a", "c", "e"]]) == ["a", "b", "c", "d", "e"]` },
        { label: 'Many lists, many repeats', code: String.raw`lists = [list(range(i, 300, 7)) for i in range(7)] + [[5] * 10]
got = merge_k(lists)
assert got == sorted(x for lst in lists for x in lst)` },
        { label: 'A heap, not a sort', code: String.raw`assert calls("heappop") and not calls("sorted") and not calls("sort") and not calls("merge"), "merge with heappush and heappop"` }
      ]
    }
  );
})(window.PYLT);
