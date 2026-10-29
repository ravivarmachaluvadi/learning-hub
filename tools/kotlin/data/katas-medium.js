/*
 * Practice (batch 5), part 2: the Medium katas. The kata shape is described at the top of data/katas-easy.js.
 */
(function (U) {
  'use strict';
  var K = U.data.katas = U.data.katas || [];

  K.push(
    {
      id: 'group-anagrams', level: 'Medium', kind: 'pattern', title: 'Group anagrams',
      summary: 'Words made of the same letters, grouped: groupBy with the sorted letters as the key.',
      patterns: ['maps', 'strings'], keywords: ['anagrams', 'groupBy', 'sorted', 'key', 'hash map', 'LinkedHashMap'],
      learn: ['lesson:kt-collection-ops', 'lesson:kt-strings', 'ref:groupby'],
      java: 'Java: `words.stream().collect(groupingBy(w -> { char[] c = w.toCharArray(); Arrays.sort(c); return new String(c); }, LinkedHashMap::new, toList()))`. Kotlin\'s `groupBy` keeps the order in which the keys first appear (it builds a `LinkedHashMap`), and `sorted()` works on the `CharArray` directly.',
      task: 'Write `groupAnagrams(words)`: the words grouped so that each group holds words made of exactly the same letters (anagrams). Inside a group the words keep their order, and the groups come in the order of their first word. `groupAnagrams(listOf("eat", "tea", "tan", "ate", "nat", "bat"))` is `[[eat, tea, ate], [tan, nat], [bat]]`. Upper and lower case are different letters.\n\nTwo words are anagrams exactly when their sorted letters are equal: use that as the key.',
      starter: `fun groupAnagrams(words: List<String>): List<List<String>> =
    words.groupBy { it.length }.values.toList()

fun main() {
    println(groupAnagrams(listOf("eat", "tea", "tan", "ate", "nat", "bat")))
}
`,
      solution: `fun groupAnagrams(words: List<String>): List<List<String>> =
    words.groupBy { it.toCharArray().sorted().joinToString("") }.values.toList()

fun main() {
    println(groupAnagrams(listOf("eat", "tea", "tan", "ate", "nat", "bat")))
}
`,
      hints: [
        'Words of the same length are not always anagrams. What do `"eat"`, `"tea"` and `"ate"` have in common that `"tan"` has not?',
        'Sort each word\'s letters: `"eat"`, `"tea"` and `"ate"` all become `"aet"`. That is the key.',
        '`words.groupBy { it.toCharArray().sorted().joinToString("") }.values.toList()`.'
      ],
      checks: [
        { label: 'The example: `[[eat, tea, ate], [tan, nat], [bat]]`', code: `eq(groupAnagrams(listOf("eat", "tea", "tan", "ate", "nat", "bat")), listOf(listOf("eat", "tea", "ate"), listOf("tan", "nat"), listOf("bat")))` },
        { label: 'The letters must match in number too: `"aab"` and `"abb"` are not anagrams', code: `eq(groupAnagrams(listOf("aab", "abb", "bab")), listOf(listOf("aab"), listOf("abb", "bab")))` },
        { label: 'No words: no groups; empty words are anagrams of each other', code: `eq(groupAnagrams(emptyList()), emptyList<List<String>>())
eq(groupAnagrams(listOf("", "a", "")), listOf(listOf("", ""), listOf("a")))` },
        { label: 'Case counts: `"Ab"` and `"bA"` are anagrams, `"ab"` is not one of them', code: `eq(groupAnagrams(listOf("Ab", "ab", "bA")), listOf(listOf("Ab", "bA"), listOf("ab")))` }
      ]
    },
    {
      id: 'longest-unique', level: 'Medium', kind: 'pattern', title: 'The longest stretch without a repeat',
      summary: 'The length of the longest run of characters with no repeat: a sliding window and each character\'s last position.',
      patterns: ['sliding-window', 'maps'], keywords: ['longest substring', 'without repeating', 'sliding window', 'last index', 'hash map'],
      learn: ['lesson:kt-collections', 'lesson:kt-null-safety', 'lesson:kt-strings'],
      java: 'The same window in Java uses a `HashMap<Character, Integer>` (or an `int[]` for plain ASCII). Kotlin\'s `withIndex()` gives the position and the character together, `last[c]` is `null` for a character not seen yet, and `maxOf` keeps the best. The trick is the same in both: when a character repeats inside the window, the window\'s start jumps past its last position, so each character is looked at once.',
      task: 'Write `longestUnique(s)`: the length of the longest **unbroken** stretch of `s` in which no character repeats. `"abcabcbb"` gives 3 (`"abc"`), `"bbbbb"` gives 1, `"pwwkew"` gives 3 (`"wke"`; `"pwke"` is not unbroken), and `""` gives 0.\n\nOne check uses 200,000 characters with stretches 20,000 long, so do it in one pass: a window `start..i`, and a map of where each character was last seen.',
      starter: `fun longestUnique(s: String): Int = s.toSet().size

fun main() {
    println(longestUnique("abcabcbb"))
    println(longestUnique("pwwkew"))
}
`,
      solution: `fun longestUnique(s: String): Int {
    val last = HashMap<Char, Int>()     // each character's last position
    var start = 0
    var best = 0
    for ((i, c) in s.withIndex()) {
        val seen = last[c]
        if (seen != null && seen >= start) start = seen + 1
        last[c] = i
        best = maxOf(best, i - start + 1)
    }
    return best
}

fun main() {
    println(longestUnique("abcabcbb"))
    println(longestUnique("pwwkew"))
}
`,
      hints: [
        'Counting the different characters ignores where they are: in `"pwwkew"` the four different letters never stand together.',
        'Keep a window from `start` to the current position `i`, holding no repeat. Remember each character\'s last position in a `HashMap<Char, Int>`.',
        'When `c` was last seen at a position inside the window (`>= start`), move `start` just past it. Then the window ends at `i` and is `i - start + 1` long.'
      ],
      checks: [
        { label: '`"abcabcbb"` is 3, `"bbbbb"` is 1', code: `eq(longestUnique("abcabcbb"), 3)
eq(longestUnique("bbbbb"), 1)` },
        { label: 'Unbroken: `"pwwkew"` is 3 (`"wke"`), not 4', code: `eq(longestUnique("pwwkew"), 3)` },
        { label: 'A repeat before the window does not move it back: `"abba"` is 2, `"tmmzuxt"` is 5', code: `eq(longestUnique("abba"), 2)
eq(longestUnique("tmmzuxt"), 5)` },
        { label: 'No characters: 0; one: 1', code: `eq(longestUnique(""), 0)
eq(longestUnique("x"), 1)` },
        { label: '200,000 characters, in one pass', code: `val s = buildString { repeat(200_000) { append(Char(0x4E00 + it % 20_000)) } }
eq(longestUnique(s), 20_000)` }
      ]
    },
    {
      id: 'merge-intervals', level: 'Medium', kind: 'pattern', title: 'Merge overlapping intervals',
      summary: 'Overlapping and touching intervals merged: sortedBy, then fold into a list, with a data class and copy.',
      patterns: ['sorting'], keywords: ['intervals', 'merge', 'overlap', 'sortedBy', 'fold', 'data class', 'copy'],
      learn: ['lesson:kt-data-classes', 'lesson:kt-collection-ops'],
      java: 'Java: `intervals.sort(Comparator.comparingInt(Interval::start))`, then a loop over an `ArrayList`. In Kotlin `sortedBy { it.start }` returns a new sorted list (the input is left alone), the `data class` gives `copy(end = …)` and the `==` the checks rely on, and `fold` carries the merged list through the loop.',
      task: 'Given `data class Interval(val start: Int, val end: Int)`, write `merge(intervals)`: the intervals with every overlapping or touching pair merged into one, sorted by start. `[1, 3], [2, 6], [8, 10], [15, 18]` gives `[1, 6], [8, 10], [15, 18]`, and `[1, 4], [4, 5]` gives `[1, 5]`. The input may come in any order.',
      starter: `data class Interval(val start: Int, val end: Int)

fun merge(intervals: List<Interval>): List<Interval> {
    val result = mutableListOf<Interval>()
    for (iv in intervals) {
        val last = result.lastOrNull()
        if (last != null && iv.start < last.end) {
            result[result.lastIndex] = Interval(last.start, iv.end)
        } else {
            result.add(iv)
        }
    }
    return result
}

fun main() {
    println(merge(listOf(Interval(1, 3), Interval(2, 6), Interval(8, 10), Interval(15, 18))))
}
`,
      solution: `data class Interval(val start: Int, val end: Int)

fun merge(intervals: List<Interval>): List<Interval> =
    intervals.sortedBy { it.start }.fold(mutableListOf<Interval>()) { merged, iv ->
        val last = merged.lastOrNull()
        if (last != null && iv.start <= last.end) merged[merged.lastIndex] = last.copy(end = maxOf(last.end, iv.end))
        else merged += iv
        merged
    }

fun main() {
    println(merge(listOf(Interval(1, 3), Interval(2, 6), Interval(8, 10), Interval(15, 18))))
}
`,
      hints: [
        'Overlaps are easy to see once the intervals are sorted by their start: `sortedBy { it.start }`.',
        'Then each interval either overlaps (or touches: `<=`) the last merged one, or starts a new one.',
        'When they merge, the end is the larger of the two ends: one interval can lie inside the other. `last.copy(end = maxOf(last.end, iv.end))`.'
      ],
      checks: [
        { label: 'The example: `[1, 6], [8, 10], [15, 18]`', code: `eq(merge(listOf(Interval(1, 3), Interval(2, 6), Interval(8, 10), Interval(15, 18))), listOf(Interval(1, 6), Interval(8, 10), Interval(15, 18)))` },
        { label: 'Touching intervals merge: `[1, 4]` and `[4, 5]` make `[1, 5]`', code: `eq(merge(listOf(Interval(1, 4), Interval(4, 5))), listOf(Interval(1, 5)))` },
        { label: 'The input in any order', code: `eq(merge(listOf(Interval(8, 10), Interval(1, 3), Interval(2, 4))), listOf(Interval(1, 4), Interval(8, 10)))` },
        { label: 'One inside another: `[1, 10]` and `[2, 3]` make `[1, 10]`', code: `eq(merge(listOf(Interval(1, 10), Interval(2, 3))), listOf(Interval(1, 10)))` },
        { label: 'No intervals: none', code: `eq(merge(emptyList()), emptyList<Interval>())` }
      ]
    },
    {
      id: 'first-position', level: 'Medium', kind: 'pattern', title: 'Binary search: the first position',
      summary: 'The first position holding a value at least the target, in a sorted list, reading about log2 n items.',
      patterns: ['binary-search'], keywords: ['binary search', 'lower bound', 'sorted', 'ushr', 'log n', 'search insert position'],
      learn: ['lesson:kt-loops', 'lesson:kt-numbers'],
      java: 'Java has `Collections.binarySearch`, and Kotlin `binarySearch()`, but with equal values either may land on any of them, and neither gives "the first one at least this". Writing this lower bound yourself is a classic interview question. `ushr 1` is Java\'s `>>> 1`: it halves without the overflow that `(lo + hi) / 2` can hit on huge lists.',
      task: '`xs` is sorted from smallest to largest, and may hold equal values. Write `firstAtLeast(xs, target)`: the first position whose value is at least `target`, or `xs.size` when there is none. `firstAtLeast(listOf(1, 3, 3, 5), 3)` is 1, and with 4 it is 3.\n\nThe starter reads the list from the start. One check counts the items your code reads from a list of 1,000,000: halve the range each time, as a binary search does.',
      starter: `fun firstAtLeast(xs: List<Int>, target: Int): Int {
    for (i in xs.indices) {
        if (xs[i] >= target) return i
    }
    return xs.size
}

fun main() {
    println(firstAtLeast(listOf(1, 3, 3, 5), 3))
    println(firstAtLeast(listOf(1, 3, 3, 5), 4))
}
`,
      solution: `fun firstAtLeast(xs: List<Int>, target: Int): Int {
    var lo = 0
    var hi = xs.size                    // the answer is somewhere in lo..hi
    while (lo < hi) {
        val mid = (lo + hi) ushr 1
        if (xs[mid] < target) lo = mid + 1 else hi = mid
    }
    return lo
}

fun main() {
    println(firstAtLeast(listOf(1, 3, 3, 5), 3))
    println(firstAtLeast(listOf(1, 3, 3, 5), 4))
}
`,
      hints: [
        'Keep a range `lo..hi` that surely holds the answer: at first `0..xs.size` (the size itself means "none").',
        'Look at the middle: when `xs[mid] < target`, the answer is after it (`lo = mid + 1`); otherwise it is `mid` or before it (`hi = mid`).',
        'Stop when `lo == hi`: that is the answer. `(lo + hi) ushr 1` is the middle.'
      ],
      checks: [
        { label: 'The first of equal values: `firstAtLeast(listOf(1, 3, 3, 5), 3)` is 1', code: `eq(firstAtLeast(listOf(1, 3, 3, 5), 3), 1)` },
        { label: 'Between values, and past the end: 4 gives 3, 9 gives 4 (the size)', code: `eq(firstAtLeast(listOf(1, 3, 3, 5), 4), 3)
eq(firstAtLeast(listOf(1, 3, 3, 5), 9), 4)` },
        { label: 'Before the start, and an empty list: 0', code: `eq(firstAtLeast(listOf(1, 3), 0), 0)
eq(firstAtLeast(emptyList(), 5), 0)` },
        { label: 'It reads about log2 n items: at most 42 of 1,000,000', code: `class Counting(val n: Int) : AbstractList<Int>() {
    var reads = 0
    override val size get() = n
    override fun get(index: Int): Int { reads++; return index * 2 }
}
val xs = Counting(1_000_000)
eq(firstAtLeast(xs, 1_200_001), 600_001)
ok(xs.reads <= 42, "read \${xs.reads} of the 1,000,000 items: a binary search reads about 20")` }
      ]
    },
    {
      id: 'subarray-sum', level: 'Medium', kind: 'pattern', title: 'Subarrays that sum to k',
      summary: 'How many unbroken runs add up to k, negative numbers allowed: prefix sums and a map of how often each was seen.',
      patterns: ['prefix-sums', 'maps'], keywords: ['subarray sum', 'prefix sum', 'running sum', 'hash map', 'merge', 'count'],
      learn: ['lesson:kt-collections', 'lesson:kt-null-safety', 'ref:getordefault'],
      java: 'Java: a `HashMap<Integer, Integer>` and `map.merge(sum, 1, Integer::sum)`. Kotlin uses the same `merge` (it is Java\'s, on `HashMap`), or `seen[sum] = (seen[sum] ?: 0) + 1`. The idea: a run ending here adds up to k exactly when an earlier running sum was `sum - k`, so counting the earlier running sums replaces trying every start.',
      task: 'Write `countSubarrays(nums, k)`: how many unbroken runs of `nums` add up to exactly `k`. The numbers may be negative or zero. `countSubarrays(listOf(1, 1, 1), 2)` is 2, `countSubarrays(listOf(1, 2, 3), 3)` is 2 (`[1, 2]` and `[3]`), and `countSubarrays(listOf(1, -1, 0), 0)` is 3.\n\nThe starter\'s sliding window works only when every number is positive. Use running sums: keep how many times each running sum has occurred so far.',
      starter: `fun countSubarrays(nums: List<Int>, k: Int): Int {
    var count = 0
    var sum = 0
    var start = 0
    for (end in nums.indices) {
        sum += nums[end]
        while (sum > k && start <= end) {
            sum -= nums[start]
            start++
        }
        if (sum == k) count++
    }
    return count
}

fun main() {
    println(countSubarrays(listOf(1, 1, 1), 2))
    println(countSubarrays(listOf(1, -1, 0), 0))
}
`,
      solution: `fun countSubarrays(nums: List<Int>, k: Int): Int {
    val seen = HashMap<Int, Int>()      // a running sum -> how many times it has occurred
    seen[0] = 1
    var sum = 0
    var count = 0
    for (x in nums) {
        sum += x
        count += seen[sum - k] ?: 0
        seen.merge(sum, 1, Int::plus)
    }
    return count
}

fun main() {
    println(countSubarrays(listOf(1, 1, 1), 2))
    println(countSubarrays(listOf(1, -1, 0), 0))
}
`,
      hints: [
        'A window that shrinks when the sum is too big assumes adding a number makes the sum bigger. With negative numbers it does not.',
        'Let `sum` be the running sum up to here. The run from just after position `j` to here adds up to `sum - (running sum at j)`. It is `k` when that earlier running sum was `sum - k`.',
        'Count the running sums seen so far in a `HashMap<Int, Int>`, starting with `0` seen once (the empty start). For each number: add `seen[sum - k] ?: 0`, then record `sum`.'
      ],
      checks: [
        { label: '`[1, 1, 1]` and k = 2: 2 runs', code: `eq(countSubarrays(listOf(1, 1, 1), 2), 2)` },
        { label: '`[1, 2, 3]` and k = 3: `[1, 2]` and `[3]`', code: `eq(countSubarrays(listOf(1, 2, 3), 3), 2)` },
        { label: 'Negative numbers and zeros', code: `eq(countSubarrays(listOf(1, -1, 0), 0), 3)
eq(countSubarrays(listOf(3, 4, 7, 2, -3, 1, 4, 2), 7), 4)` },
        { label: 'No numbers: 0', code: `eq(countSubarrays(emptyList(), 5), 0)` },
        { label: '200,000 numbers, in one pass', code: `eq(countSubarrays(List(200_000) { it % 7 + 1 }, 28), 199_994)` }
      ]
    },
    {
      id: 'islands', level: 'Medium', kind: 'pattern', title: 'Count the islands',
      summary: 'Land cells joined up, down, left or right form an island: a breadth-first search over a grid, with a queue.',
      patterns: ['graphs'], keywords: ['islands', 'grid', 'bfs', 'breadth-first search', 'flood fill', 'ArrayDeque', 'connected components'],
      learn: ['lesson:kt-loops', 'lesson:kt-collections', 'lesson:kt-operators'],
      java: 'The Java version is the same breadth-first search: a `boolean[][]` for the cells seen, and an `ArrayDeque<int[]>` as the queue. Kotlin\'s `ArrayDeque` holds `Pair`s (`r to c`), destructured as `val (y, x) = …`, and `ny in grid.indices` replaces two bounds comparisons. A recursive flood fill reads more simply, but a big island means a deep recursion, and the stack overflows.',
      task: '`grid` is a map, one string per row: `#` is land and `.` is water. Land cells that touch up, down, left or right belong to the same island (corners do not join). Write `countIslands(grid)`: how many islands there are.\n\n```text\n##..#\n#...#\n..#..\n.....\n```\n\nhas 3. One check has a single island of 1,000,000 cells, so search with a queue (breadth-first), not with recursion.',
      starter: `fun countIslands(grid: List<String>): Int = grid.sumOf { row -> row.count { it == '#' } }

fun main() {
    println(countIslands(listOf("##..#", "#...#", "..#..", ".....")))
}
`,
      solution: `fun countIslands(grid: List<String>): Int {
    val seen = Array(grid.size) { BooleanArray(grid[it].length) }
    val steps = listOf(0 to 1, 1 to 0, 0 to -1, -1 to 0)
    var islands = 0
    for (r in grid.indices) for (c in grid[r].indices) {
        if (grid[r][c] != '#' || seen[r][c]) continue
        islands++                                   // a new island: mark all of it
        val queue = ArrayDeque(listOf(r to c))
        seen[r][c] = true
        while (queue.isNotEmpty()) {
            val (y, x) = queue.removeFirst()
            for ((dy, dx) in steps) {
                val ny = y + dy
                val nx = x + dx
                if (ny in grid.indices && nx in grid[ny].indices && grid[ny][nx] == '#' && !seen[ny][nx]) {
                    seen[ny][nx] = true
                    queue.addLast(ny to nx)
                }
            }
        }
    }
    return islands
}

fun main() {
    println(countIslands(listOf("##..#", "#...#", "..#..", ".....")))
}
`,
      hints: [
        'Counting land cells counts each island many times. Count an island once, when you first meet one of its cells, then mark all of its cells as seen.',
        'To mark an island, keep a queue of cells to visit (`ArrayDeque`), starting with the first cell; take one out, and put in each land neighbour not seen yet.',
        'The four neighbours: `listOf(0 to 1, 1 to 0, 0 to -1, -1 to 0)`; check `ny in grid.indices && nx in grid[ny].indices` before reading `grid[ny][nx]`.'
      ],
      checks: [
        { label: 'The example has 3 islands', code: `eq(countIslands(listOf("##..#", "#...#", "..#..", ".....")), 3)` },
        { label: 'Cells touching only at a corner are two islands', code: `eq(countIslands(listOf("#.", ".#")), 2)` },
        { label: 'A ring is one island: the water inside does not split it', code: `eq(countIslands(listOf("###", "#.#", "###")), 1)` },
        { label: 'No land, or no grid: 0', code: `eq(countIslands(listOf("...", "...")), 0)
eq(countIslands(emptyList()), 0)` },
        { label: 'A 1,000 x 1,000 grid of land is one island (too deep for a recursive search)', code: `eq(countIslands(List(1_000) { "#".repeat(1_000) }), 1)` }
      ]
    },
    {
      id: 'lru-cache', level: 'Medium', kind: 'pattern', title: 'LRU cache',
      summary: 'A cache that drops the least recently used entry when full: LinkedHashMap in access order, and operator get and set.',
      patterns: ['design', 'maps'], keywords: ['lru', 'cache', 'least recently used', 'LinkedHashMap', 'removeEldestEntry', 'access order', 'operator'],
      learn: ['lesson:kt-operators', 'lesson:kt-objects', 'lesson:kt-generics'],
      java: 'Java\'s answer is the same class: `new LinkedHashMap<>(16, 0.75f, true)` (access order) with `removeEldestEntry` overridden in an anonymous subclass. In Kotlin that subclass is an `object :` expression, and `operator fun get` and `set` let callers write `cache[key]` and `cache[key] = value` instead of `get` and `put`.',
      task: 'Write `class LruCache<K, V>(val capacity: Int)` with:\n\n- `operator fun get(key: K): V?`, the value or `null`; reading a key makes it the most recently used;\n- `operator fun set(key: K, value: V)`, which adds or replaces a value, and when that makes the cache hold more than `capacity` entries, drops the **least recently used** one;\n- `val size: Int`.\n\nA `LinkedHashMap` built with `accessOrder = true` keeps its entries from least to most recently used, and calls `removeEldestEntry` after each `put`.',
      starter: `class LruCache<K, V>(val capacity: Int) {
    private val map = HashMap<K, V>()

    operator fun get(key: K): V? = map[key]

    operator fun set(key: K, value: V) {
        map[key] = value
    }

    val size: Int get() = map.size
}

fun main() {
    val cache = LruCache<String, Int>(2)
    cache["a"] = 1
    cache["b"] = 2
    println(cache["a"])
    cache["c"] = 3
    println(cache["b"])
    println(cache.size)
}
`,
      solution: `class LruCache<K, V>(val capacity: Int) {
    // access order: a get or a put moves the entry to the end, so the first entry is the least recently used
    private val map = object : LinkedHashMap<K, V>(16, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<K, V>?): Boolean = size > capacity
    }

    operator fun get(key: K): V? = map[key]

    operator fun set(key: K, value: V) {
        map[key] = value
    }

    val size: Int get() = map.size
}

fun main() {
    val cache = LruCache<String, Int>(2)
    cache["a"] = 1
    cache["b"] = 2
    println(cache["a"])
    cache["c"] = 3
    println(cache["b"])
    println(cache.size)
}
`,
      hints: [
        'A plain `HashMap` never drops anything, and has no idea of "least recently used".',
        '`LinkedHashMap<K, V>(16, 0.75f, true)`: the `true` puts it in access order, so every `get` and `put` moves that entry to the end.',
        'Subclass it with `object : LinkedHashMap<K, V>(16, 0.75f, true) { override fun removeEldestEntry(eldest: MutableMap.MutableEntry<K, V>?) = size > capacity }`.'
      ],
      checks: [
        { label: 'The example prints `1`, `null`, `2`', code: `eq(output, "1\\nnull\\n2\\n")` },
        { label: 'A full cache drops the least recently used', code: `val c = LruCache<Int, String>(2)
c[1] = "one"
c[2] = "two"
c[3] = "three"
eq(c[1], null)
eq(c[2], "two")
eq(c[3], "three")
eq(c.size, 2)` },
        { label: 'Reading a key makes it the most recently used', code: `val c = LruCache<Int, String>(2)
c[1] = "one"
c[2] = "two"
c[1]
c[3] = "three"
eq(c[2], null)
eq(c[1], "one")` },
        { label: 'Replacing a value keeps one entry, and counts as a use', code: `val c = LruCache<String, Int>(2)
c["a"] = 1
c["b"] = 2
c["a"] = 10
c["c"] = 3
eq(c["a"], 10)
eq(c["b"], null)
eq(c.size, 2)` },
        { label: '100,000 uses: the size never passes the capacity', code: `val c = LruCache<Int, Int>(100)
repeat(100_000) {
    c[it] = it
    c[it / 2]
}
eq(c.size, 100)` }
      ]
    },
    {
      id: 'rw-sealed-when', level: 'Medium', kind: 'rewrite', title: 'instanceof chains to a sealed interface',
      summary: 'if (s instanceof Circle) … else if …, with a throw at the end, becomes a sealed interface and a when with no else.',
      patterns: ['sealed'], keywords: ['instanceof', 'sealed interface', 'sealed class', 'when', 'exhaustive', 'smart cast', 'pattern matching'],
      learn: ['lesson:kt-sealed', 'lesson:kt-conditions', 'q:sealed-classes', 'q:smart-casts'],
      java: 'Java 21 writes this as `sealed interface Shape permits Circle, Rect, Triangle` and a `switch` with type patterns. The `instanceof` chain with a `throw` at the end is the older habit: nothing tells you when a new shape is added. In Kotlin `is` also smart-casts (`s.r`, no cast), and a `when` over a sealed type needs no `else`: add a shape, and every `when` that misses it stops compiling.',
      task: 'The Java below decides what to do with a shape by testing `instanceof` one class after another, and throws if none matches. The Kotlin in the editor does the same with `is`: it works, and prints what the Java prints.\n\nRewrite it so the compiler knows every shape: make `Shape` a **sealed interface** (or sealed class), and write `area` and `describe` as **`when` expressions with no `else`**, so there is no `if (s is …)` chain and no `throw`. The output must not change.',
      original: `import java.util.*;

public class Main {
    interface Shape {}
    static final class Circle implements Shape {
        final double r;
        Circle(double r) { this.r = r; }
    }
    static final class Rect implements Shape {
        final double w, h;
        Rect(double w, double h) { this.w = w; this.h = h; }
    }
    static final class Triangle implements Shape {
        final double base, height;
        Triangle(double base, double height) { this.base = base; this.height = height; }
    }

    static double area(Shape s) {
        if (s instanceof Circle) {
            Circle c = (Circle) s;
            return Math.PI * c.r * c.r;
        } else if (s instanceof Rect) {
            Rect r = (Rect) s;
            return r.w * r.h;
        } else if (s instanceof Triangle) {
            Triangle t = (Triangle) s;
            return t.base * t.height / 2;
        }
        throw new IllegalArgumentException("unknown shape");
    }

    static String describe(Shape s) {
        if (s instanceof Circle) return "circle";
        if (s instanceof Rect) {
            Rect r = (Rect) s;
            return r.w == r.h ? "square" : "rectangle";
        }
        return "triangle";
    }

    public static void main(String[] args) {
        List<Shape> shapes = List.of(new Circle(1), new Rect(2, 3), new Rect(2, 2), new Triangle(4, 5));
        for (Shape s : shapes) {
            System.out.println(describe(s) + " " + String.format("%.2f", area(s)));
        }
    }
}
`,
      starter: `interface Shape
class Circle(val r: Double) : Shape
class Rect(val w: Double, val h: Double) : Shape
class Triangle(val base: Double, val height: Double) : Shape

fun area(s: Shape): Double {
    if (s is Circle) {
        return Math.PI * s.r * s.r
    } else if (s is Rect) {
        return s.w * s.h
    } else if (s is Triangle) {
        return s.base * s.height / 2
    }
    throw IllegalArgumentException("unknown shape")
}

fun describe(s: Shape): String {
    if (s is Circle) return "circle"
    if (s is Rect) {
        return if (s.w == s.h) "square" else "rectangle"
    }
    return "triangle"
}

fun main() {
    val shapes = listOf(Circle(1.0), Rect(2.0, 3.0), Rect(2.0, 2.0), Triangle(4.0, 5.0))
    for (s in shapes) {
        println(describe(s) + " " + "%.2f".format(area(s)))
    }
}
`,
      solution: `import kotlin.math.PI

sealed interface Shape
data class Circle(val r: Double) : Shape
data class Rect(val w: Double, val h: Double) : Shape
data class Triangle(val base: Double, val height: Double) : Shape

fun area(s: Shape): Double = when (s) {
    is Circle -> PI * s.r * s.r
    is Rect -> s.w * s.h
    is Triangle -> s.base * s.height / 2
}

fun describe(s: Shape): String = when (s) {
    is Circle -> "circle"
    is Rect -> if (s.w == s.h) "square" else "rectangle"
    is Triangle -> "triangle"
}

fun main() {
    val shapes = listOf(Circle(1.0), Rect(2.0, 3.0), Rect(2.0, 2.0), Triangle(4.0, 5.0))
    for (s in shapes) println("\${describe(s)} \${"%.2f".format(area(s))}")
}
`,
      hints: [
        '`sealed interface Shape`: every class that implements it must be in this file, so the compiler knows the whole list.',
        '`fun area(s: Shape): Double = when (s) { is Circle -> … is Rect -> … is Triangle -> … }`: inside each branch `s` is already that type.',
        'With a sealed `Shape`, the `when` is exhaustive without `else`, so the `throw` goes away. In `describe`, the triangle gets its own `is Triangle ->` branch rather than being "whatever is left".'
      ],
      checks: [
        { label: 'It prints what the Java prints', code: `eq(output, "circle 3.14\\nrectangle 6.00\\nsquare 4.00\\ntriangle 10.00\\n")` },
        { label: 'The areas and the names are right', code: `eq(area(Rect(3.0, 4.0)), 12.0)
eq(area(Triangle(2.0, 3.0)), 3.0)
eq(describe(Rect(5.0, 5.0)), "square")` },
        { label: '`Shape` is a `sealed interface` (or a `sealed class`)', idiom: true, code: `ok(uses("""\\bsealed\\s+(interface|class)\\s+Shape\\b"""), "declare it as sealed interface Shape")` },
        { label: '`when` decides, with no `else` branch: the compiler checks every shape is covered', idiom: true, code: `ok(uses("""\\bwhen\\s*\\(""") && !uses("""\\belse\\s*->"""), "a when (s) { is Circle -> … } over the sealed type needs no else")` },
        { label: 'No `if (s is …)` chain, and no `throw` for an unknown shape', idiom: true, code: `ok(!uses("""\\bif\\s*\\(\\s*\\w+\\s+is\\b""") && !uses("""\\bthrow\\b"""), "a sealed type has no unknown shapes: when replaces the if chain and the throw")` }
      ]
    },
    {
      id: 'rw-named-args', level: 'Medium', kind: 'rewrite', title: 'A builder to default and named arguments',
      summary: 'A Java Builder with a setter per option becomes one constructor with default values, named arguments and copy.',
      patterns: ['named-args', 'data-classes'], keywords: ['builder pattern', 'default arguments', 'named arguments', 'copy', 'telescoping constructors', 'JvmOverloads'],
      learn: ['lesson:kt-functions', 'lesson:kt-data-classes', 'q:default-named-args'],
      java: 'A builder exists because Java has no default or named arguments: without it, a class with four optional settings needs a constructor per combination. In Kotlin one constructor with defaults covers them all, each call names what it sets (`timeoutSeconds = 5`), and a `data class`\'s `copy(followRedirects = false)` replaces "a new builder from an old object". Java code calling it sees one constructor with all four parameters, unless you add `@JvmOverloads`.',
      task: 'The Java below builds requests with a `Builder`: a setter per option, defaults in its fields, and `build()`. The Kotlin in the editor keeps the builder: it works, and prints what the Java prints.\n\nRewrite `Request` as one class (a **data class**) whose constructor has **default values**, so `Request("u")` is a GET with a 30-second timeout and redirects on. In `main`, set options with **named arguments** (`timeoutSeconds = 5`), and make the third request with **`copy(…)`**. No `Builder` class. The output must not change.',
      original: `public class Main {
    static final class Request {
        final String url;
        final String method;
        final int timeoutSeconds;
        final boolean followRedirects;

        private Request(Builder b) {
            url = b.url; method = b.method; timeoutSeconds = b.timeoutSeconds; followRedirects = b.followRedirects;
        }

        @Override
        public String toString() {
            return method + " " + url + " (timeout " + timeoutSeconds + "s, redirects " + (followRedirects ? "on" : "off") + ")";
        }

        static final class Builder {
            private final String url;
            private String method = "GET";
            private int timeoutSeconds = 30;
            private boolean followRedirects = true;

            Builder(String url) { this.url = url; }
            Builder method(String m) { this.method = m; return this; }
            Builder timeoutSeconds(int t) { this.timeoutSeconds = t; return this; }
            Builder followRedirects(boolean f) { this.followRedirects = f; return this; }
            Request build() { return new Request(this); }
        }
    }

    public static void main(String[] args) {
        Request plain = new Request.Builder("https://example.com").build();
        Request post = new Request.Builder("https://example.com/api").method("POST").timeoutSeconds(5).build();
        Request noRedirects = new Request.Builder(post.url).method(post.method).timeoutSeconds(post.timeoutSeconds).followRedirects(false).build();
        System.out.println(plain);
        System.out.println(post);
        System.out.println(noRedirects);
    }
}
`,
      starter: `class Request private constructor(builder: Builder) {
    val url: String = builder.url
    val method: String = builder.method
    val timeoutSeconds: Int = builder.timeoutSeconds
    val followRedirects: Boolean = builder.followRedirects

    override fun toString(): String =
        method + " " + url + " (timeout " + timeoutSeconds + "s, redirects " + (if (followRedirects) "on" else "off") + ")"

    class Builder(val url: String) {
        var method = "GET"
        var timeoutSeconds = 30
        var followRedirects = true

        fun method(m: String): Builder { method = m; return this }
        fun timeoutSeconds(t: Int): Builder { timeoutSeconds = t; return this }
        fun followRedirects(f: Boolean): Builder { followRedirects = f; return this }
        fun build(): Request = Request(this)
    }
}

fun main() {
    val plain = Request.Builder("https://example.com").build()
    val post = Request.Builder("https://example.com/api").method("POST").timeoutSeconds(5).build()
    val noRedirects = Request.Builder(post.url).method(post.method).timeoutSeconds(post.timeoutSeconds).followRedirects(false).build()
    println(plain)
    println(post)
    println(noRedirects)
}
`,
      solution: `data class Request(
    val url: String,
    val method: String = "GET",
    val timeoutSeconds: Int = 30,
    val followRedirects: Boolean = true,
) {
    override fun toString() = "$method $url (timeout \${timeoutSeconds}s, redirects \${if (followRedirects) "on" else "off"})"
}

fun main() {
    val plain = Request("https://example.com")
    val post = Request("https://example.com/api", method = "POST", timeoutSeconds = 5)
    val noRedirects = post.copy(followRedirects = false)
    println(plain)
    println(post)
    println(noRedirects)
}
`,
      hints: [
        'The builder\'s fields hold the defaults. Put them on the constructor\'s parameters instead: `val method: String = "GET"`.',
        'A caller then passes only what differs, by name: `Request("https://example.com/api", method = "POST", timeoutSeconds = 5)`.',
        'As a `data class`, `post.copy(followRedirects = false)` is the same request with one setting changed. Keep your own `toString()`: the output must not change.'
      ],
      checks: [
        { label: 'It prints what the Java prints', code: `eq(output, "GET https://example.com (timeout 30s, redirects on)\\nPOST https://example.com/api (timeout 5s, redirects on)\\nPOST https://example.com/api (timeout 5s, redirects off)\\n")` },
        { label: 'One constructor with defaults: `Request("u")` is a GET, 30 seconds, redirects on', idiom: true, code: `val r = Request("u")
eq(r.method, "GET")
eq(r.timeoutSeconds, 30)
eq(r.followRedirects, true)` },
        { label: 'Named arguments set the rest: `Request("u", timeoutSeconds = 5)`', idiom: true, code: `eq(Request("u", timeoutSeconds = 5).toString(), "GET u (timeout 5s, redirects on)")` },
        { label: 'No `Builder` class', idiom: true, code: `ok(!uses("""\\bclass\\s+Builder\\b"""), "default arguments replace the builder")` },
        { label: 'The third request made with `copy(…)`', idiom: true, code: `ok(uses("""\\.copy\\s*\\("""), "make the request without redirects with post.copy(followRedirects = false)")` }
      ]
    },
    {
      id: 'rw-comparator', level: 'Medium', kind: 'rewrite', title: 'An anonymous Comparator to compareBy',
      summary: 'Collections.sort with a hand-written compare on three keys, nulls last, becomes sortedWith(compareBy … thenBy …).',
      patterns: ['sorting'], keywords: ['Comparator', 'compareBy', 'thenBy', 'thenByDescending', 'nullsLast', 'sortedWith', 'Collections.sort', 'anonymous class'],
      learn: ['lesson:kt-collection-ops', 'lesson:kt-lambdas', 'ref:compareby', 'ref:thenby'],
      java: 'Java 8 already has `Comparator.comparing(Employee::dept).thenComparing(Employee::salary, reverseOrder()).thenComparing(Employee::manager, nullsLast(naturalOrder()))`; the anonymous class with an `if` per key is the older habit. Kotlin\'s `compareBy`, `thenByDescending` and `thenBy(nullsLast())` read the same way, and `sortedWith` returns a sorted copy, so nothing is sorted in place.',
      task: 'The Java below sorts the staff with an anonymous `Comparator`: by department, then the highest salary first, then by manager, with no manager last. The Kotlin in the editor does the same with an `object : Comparator`: it works, and prints what the Java prints.\n\nRewrite `ordered` with **`sortedWith`** and a comparator built from **`compareBy` and `thenBy…`**, using **`nullsLast()`** for the missing managers. No hand-written `compare`. The output must not change.',
      original: `import java.util.*;

public class Main {
    record Employee(String name, String dept, int salary, String manager) {}

    public static void main(String[] args) {
        List<Employee> staff = new ArrayList<>(List.of(
            new Employee("Asha", "ops", 70, "Li"),
            new Employee("Bo", "dev", 90, null),
            new Employee("Cy", "dev", 90, "Li"),
            new Employee("Di", "ops", 85, null),
            new Employee("Ed", "dev", 75, "Bo")));
        Collections.sort(staff, new Comparator<Employee>() {
            @Override
            public int compare(Employee a, Employee b) {
                int byDept = a.dept().compareTo(b.dept());
                if (byDept != 0) return byDept;
                int bySalary = Integer.compare(b.salary(), a.salary());
                if (bySalary != 0) return bySalary;
                if (a.manager() == null && b.manager() == null) return 0;
                if (a.manager() == null) return 1;
                if (b.manager() == null) return -1;
                return a.manager().compareTo(b.manager());
            }
        });
        for (Employee e : staff) {
            System.out.println(e.dept() + " " + e.salary() + " " + e.name() + " " + e.manager());
        }
    }
}
`,
      starter: `data class Employee(val name: String, val dept: String, val salary: Int, val manager: String?)

fun ordered(staff: List<Employee>): List<Employee> {
    val copy = ArrayList(staff)
    java.util.Collections.sort(copy, object : Comparator<Employee> {
        override fun compare(a: Employee, b: Employee): Int {
            val byDept = a.dept.compareTo(b.dept)
            if (byDept != 0) return byDept
            val bySalary = Integer.compare(b.salary, a.salary)
            if (bySalary != 0) return bySalary
            if (a.manager == null && b.manager == null) return 0
            if (a.manager == null) return 1
            if (b.manager == null) return -1
            return a.manager.compareTo(b.manager)
        }
    })
    return copy
}

fun main() {
    val staff = listOf(
        Employee("Asha", "ops", 70, "Li"),
        Employee("Bo", "dev", 90, null),
        Employee("Cy", "dev", 90, "Li"),
        Employee("Di", "ops", 85, null),
        Employee("Ed", "dev", 75, "Bo"),
    )
    for (e in ordered(staff)) println("\${e.dept} \${e.salary} \${e.name} \${e.manager}")
}
`,
      solution: `data class Employee(val name: String, val dept: String, val salary: Int, val manager: String?)

fun ordered(staff: List<Employee>): List<Employee> =
    staff.sortedWith(
        compareBy<Employee> { it.dept }
            .thenByDescending { it.salary }
            .thenBy(nullsLast()) { it.manager }
    )

fun main() {
    val staff = listOf(
        Employee("Asha", "ops", 70, "Li"),
        Employee("Bo", "dev", 90, null),
        Employee("Cy", "dev", 90, "Li"),
        Employee("Di", "ops", 85, null),
        Employee("Ed", "dev", 75, "Bo"),
    )
    for (e in ordered(staff)) println("\${e.dept} \${e.salary} \${e.name} \${e.manager}")
}
`,
      hints: [
        '`compareBy<Employee> { it.dept }` is a comparator on the first key; `.thenByDescending { it.salary }` adds the second, highest first.',
        '`thenBy { it.manager }` would put the nulls first. `thenBy(nullsLast()) { it.manager }` puts them last.',
        '`staff.sortedWith(comparator)` returns a sorted copy: no `ArrayList`, no `Collections.sort`.'
      ],
      checks: [
        { label: 'It prints what the Java prints', code: `eq(output, "dev 90 Cy Li\\ndev 90 Bo null\\ndev 75 Ed Bo\\nops 85 Di null\\nops 70 Asha Li\\n")` },
        { label: 'Department first, then the highest salary, then the manager, no manager last', code: `val got = ordered(listOf(Employee("x", "b", 1, null), Employee("y", "a", 1, "Z"), Employee("z", "a", 1, null), Employee("w", "a", 2, "Q"))).map { it.name }
eq(got, listOf("w", "y", "z", "x"))` },
        { label: 'The list passed in is left as it was', code: `val input = listOf(Employee("b", "z", 1, null), Employee("a", "a", 1, null))
ordered(input)
eq(input.map { it.name }, listOf("b", "a"))` },
        { label: 'The order built with `compareBy` and `thenBy…`, not a hand-written `compare`', idiom: true, code: `ok(uses("""\\bcompareBy\\w*\\b""") && !uses("""fun\\s+compare\\s*\\("""), "sortedWith(compareBy<Employee> { it.dept }.thenByDescending { … }.thenBy(…) { … })")` },
        { label: '`nullsLast()` for the missing managers', idiom: true, code: `ok(uses("""\\bnullsLast\\s*\\("""), "thenBy(nullsLast()) { it.manager } puts no manager last")` }
      ]
    },
    {
      id: 'rw-use', level: 'Medium', kind: 'rewrite', title: 'try-with-resources to use',
      summary: 'A BufferedReader in try-with-resources and a catch for NumberFormatException become useLines and toIntOrNull.',
      patterns: ['resources'], keywords: ['try-with-resources', 'use', 'useLines', 'close', 'NumberFormatException', 'toIntOrNull', 'mapNotNull', 'checked exceptions'],
      learn: ['lesson:kt-exceptions', 'lesson:kt-sequences', 'ref:use', 'ref:tointornull'],
      java: 'try-with-resources becomes `use { }`, which closes the reader however the block ends; `useLines { }` hands you the lines as a `Sequence` and closes the reader after. Kotlin has no checked exceptions, so nothing declares `throws IOException`. And `toIntOrNull()` returns `null` for text that is not a number, so `mapNotNull` skips it with no `try`/`catch` at all.',
      task: 'The Java below reads the numbers from a text, line by line, skipping lines that are not numbers by catching `NumberFormatException`, and closes the reader with try-with-resources. The Kotlin in the editor does the same with `try`/`finally` and a `catch`: it works, and prints what the Java prints.\n\nRewrite `readNumbers` with **`useLines`** (or `use`), which closes the reader for you, and **`toIntOrNull()`** with `mapNotNull` to skip what is not a number: no `finally`, no `catch`, no `while` loop. The output must not change.',
      original: `import java.io.*;
import java.util.*;

public class Main {
    static List<Integer> readNumbers(String text) throws IOException {
        List<Integer> numbers = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new StringReader(text))) {
            String line;
            while ((line = reader.readLine()) != null) {
                try {
                    numbers.add(Integer.parseInt(line.trim()));
                } catch (NumberFormatException e) {
                    // skip lines that are not numbers
                }
            }
        }
        return numbers;
    }

    public static void main(String[] args) throws IOException {
        List<Integer> nums = readNumbers("10\\n 20 \\nabc\\n\\n30\\n-5");
        System.out.println(nums);
        int total = 0;
        for (int n : nums) total += n;
        System.out.println(total);
    }
}
`,
      starter: `import java.io.BufferedReader
import java.io.StringReader

fun readNumbers(text: String): List<Int> {
    val numbers = ArrayList<Int>()
    val reader = BufferedReader(StringReader(text))
    try {
        var line = reader.readLine()
        while (line != null) {
            try {
                numbers.add(Integer.parseInt(line.trim()))
            } catch (e: NumberFormatException) {
                // skip lines that are not numbers
            }
            line = reader.readLine()
        }
    } finally {
        reader.close()
    }
    return numbers
}

fun main() {
    val nums = readNumbers("10\\n 20 \\nabc\\n\\n30\\n-5")
    println(nums)
    var total = 0
    for (n in nums) total += n
    println(total)
}
`,
      solution: `import java.io.BufferedReader
import java.io.StringReader

fun readNumbers(text: String): List<Int> =
    BufferedReader(StringReader(text)).useLines { lines ->
        lines.mapNotNull { it.trim().toIntOrNull() }.toList()
    }

fun main() {
    val nums = readNumbers("10\\n 20 \\nabc\\n\\n30\\n-5")
    println(nums)
    println(nums.sum())
}
`,
      hints: [
        '`reader.useLines { lines -> … }` gives you the lines as a `Sequence<String>`, and closes the reader when the block ends.',
        '`"abc".toIntOrNull()` is `null`: `lines.mapNotNull { it.trim().toIntOrNull() }` keeps only the numbers.',
        'A `Sequence` is read lazily, so turn it into a list with `toList()` inside the block, while the reader is still open.'
      ],
      checks: [
        { label: 'It prints what the Java prints', code: `eq(output, "[10, 20, 30, -5]\\n55\\n")` },
        { label: 'Lines that are not numbers are skipped; spaces around a number are not a problem', code: `eq(readNumbers(" 7\\nx\\n8 "), listOf(7, 8))
eq(readNumbers(""), emptyList<Int>())` },
        { label: 'The reader is closed by `use` or `useLines`, not `try`/`finally`', idiom: true, code: `ok(uses("""\\buse(Lines)?\\s*\\{""") && !uses("""\\bfinally\\b"""), "useLines { lines -> … } closes the reader for you")` },
        { label: 'No exception used to skip a line: `toIntOrNull()` gives `null`', idiom: true, code: `ok(!uses("""\\bcatch\\b""") && uses("""\\btoIntOrNull\\b"""), "mapNotNull { it.trim().toIntOrNull() } skips what is not a number")` },
        { label: 'No `while` loop reading line by line', idiom: true, code: `ok(!uses("""\\bwhile\\s*\\("""), "useLines gives you every line as a sequence")` }
      ]
    }
  );
})(window.KLT);
