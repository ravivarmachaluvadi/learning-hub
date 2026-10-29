/*
 * Practice (batch 5), part 1: the patterns every kata is filed under, and the Easy katas (views/practice.js).
 *
 * Kata shape (U.data.katas; the other levels are in data/katas-medium.js and data/katas-hard.js):
 *   {id, level: 'Easy'|'Medium'|'Hard', kind: 'pattern'|'rewrite', title, summary,
 *    patterns: [ids from U.data.kataPatterns], keywords: [..] (more words search should find it by),
 *    learn: ['lesson:kt-collections', 'ref:groupby', 'q:null-safety'] (where what it needs is taught),
 *    java: Markdown (the "Coming from Java" note), task: Markdown,
 *    original?: a rewrite's Java program (a class Main), shown read-only beside the task with a Run of its own,
 *    starter, solution, hints: [..], timeout?: seconds,
 *    checks: [{label (Markdown), code (Kotlin), idiom?: true}]}
 *
 * A kata is a challenge like a lesson's: the same checks and helpers (see runner/Harness.kt, class Ctx), and
 * tests/test_content.py proves that every starter fails and every solution passes, with near misses that
 * fail the check predicted. An idiom check reads the code (uses(…)) or calls the API the kata asks for; a
 * rewrite's starter is the Java written in Kotlin the way a Java developer writes it first: it passes every
 * other check, fails only idiom checks, and prints what its Java original prints (the tests run both).
 * Where a check needs a big input to tell a fast answer from a slow one, it counts what the answer reads
 * when it can, and otherwise gives it 200,000 items against the check's 4 seconds.
 * Code is written in template literals: a Kotlin ${…} is written \${…}, and a Kotlin "\n" is "\\n".
 */
(function (U) {
  'use strict';
  U.data.kataPatterns = [
    { id: 'maps', title: 'Maps and sets' },
    { id: 'counting', title: 'Counting' },
    { id: 'strings', title: 'Strings' },
    { id: 'sorting', title: 'Sorting and comparators' },
    { id: 'one-pass', title: 'One pass, a running value' },
    { id: 'two-pointers', title: 'Two pointers' },
    { id: 'sliding-window', title: 'Sliding window' },
    { id: 'prefix-sums', title: 'Prefix sums' },
    { id: 'stack', title: 'Stacks and queues' },
    { id: 'heap', title: 'Heap (PriorityQueue)' },
    { id: 'binary-search', title: 'Binary search' },
    { id: 'recursion', title: 'Recursion' },
    { id: 'graphs', title: 'Graphs and grids' },
    { id: 'dp', title: 'Dynamic programming' },
    { id: 'design', title: 'Design a class' },
    { id: 'parsing', title: 'Parsing' },
    { id: 'sequences', title: 'Sequences' },
    { id: 'coroutines', title: 'Coroutines' },
    { id: 'flow', title: 'Flow' },
    { id: 'math', title: 'Arithmetic' },
    { id: 'data-classes', title: 'Data classes' },
    { id: 'null-safety', title: 'Null safety' },
    { id: 'collection-ops', title: 'Collection operations' },
    { id: 'extensions', title: 'Extension functions' },
    { id: 'sealed', title: 'Sealed types and when' },
    { id: 'named-args', title: 'Default and named arguments' },
    { id: 'resources', title: 'Resources and exceptions' }
  ];

  var K = U.data.katas = U.data.katas || [];

  K.push(
    {
      id: 'fizzbuzz', level: 'Easy', kind: 'pattern', title: 'FizzBuzz',
      summary: 'The classic warm-up: the numbers 1 to n, with Fizz, Buzz and FizzBuzz for multiples of 3, 5 and both, as one expression.',
      patterns: ['math'], keywords: ['fizzbuzz', 'modulo', 'when', 'map', 'range', 'warm-up'],
      learn: ['lesson:kt-conditions', 'lesson:kt-loops', 'lesson:kt-collection-ops'],
      java: 'The same `%` and the same order of tests. Kotlin builds the list in one expression, `(1..n).map { … }`, and a `when` with no subject replaces the `if`/`else if` ladder: each branch is a condition, and the first one that is true wins. `i.toString()` is Java\'s `String.valueOf(i)`.',
      task: 'Write `fizzbuzz(n)`, which returns a **list of strings** for the numbers 1 to `n`: `"Fizz"` for a multiple of 3, `"Buzz"` for a multiple of 5, `"FizzBuzz"` for a multiple of both, and the number itself (as text) otherwise. `fizzbuzz(5)` is `["1", "2", "Fizz", "4", "Buzz"]`, and `fizzbuzz(0)` is empty.\n\nWrite it as one expression: map the range `1..n`, choosing the word with a `when` that has no subject.',
      starter: `fun fizzbuzz(n: Int): List<String> {
    val result = mutableListOf<String>()
    for (i in 0 until n) {
        if (i % 3 == 0) result.add("Fizz")
        else if (i % 5 == 0) result.add("Buzz")
        else result.add(i.toString())
    }
    return result
}

fun main() {
    println(fizzbuzz(15).joinToString(" "))
}
`,
      solution: `fun fizzbuzz(n: Int): List<String> = (1..n).map { i ->
    when {
        i % 15 == 0 -> "FizzBuzz"
        i % 3 == 0 -> "Fizz"
        i % 5 == 0 -> "Buzz"
        else -> i.toString()
    }
}

fun main() {
    println(fizzbuzz(15).joinToString(" "))
}
`,
      hints: [
        '`0 until n` counts 0 to n - 1. For 1 to n, the range is `1..n`.',
        'Test for 15 (a multiple of both) first: once `i % 3 == 0` has matched, the branches after it are skipped.',
        '`(1..n).map { i -> when { … } }`: a `when` without `(subject)` takes a condition in each branch.'
      ],
      checks: [
        { label: '`fizzbuzz(5)` is `["1", "2", "Fizz", "4", "Buzz"]`', code: `eq(fizzbuzz(5), listOf("1", "2", "Fizz", "4", "Buzz"))` },
        { label: '15 and 30 are `"FizzBuzz"`', code: `eq(fizzbuzz(30)[14], "FizzBuzz")
eq(fizzbuzz(30)[29], "FizzBuzz")` },
        { label: '`fizzbuzz(0)` is empty', code: `eq(fizzbuzz(0), emptyList<String>())` },
        { label: 'A `when` with no subject chooses the word', idiom: true, code: `ok(uses("""\\bwhen\\s*\\{"""), "choose the word with when { … }: no subject, a condition in each branch")` }
      ]
    },
    {
      id: 'two-sum', level: 'Easy', kind: 'pattern', title: 'Two sum',
      summary: 'The positions of the two numbers that add up to a target, in one pass, with a map of the numbers seen so far.',
      patterns: ['maps', 'one-pass'], keywords: ['two sum', 'hash map', 'pair', 'withIndex', 'one pass', 'complement'],
      learn: ['lesson:kt-collections', 'lesson:kt-null-safety', 'lesson:kt-loops'],
      java: 'Java uses the same `HashMap<Integer, Integer>`. Kotlin adds `withIndex()` to walk positions and values together, `map[key]` for `get` and `put`, and `?.let { return … }` for "if the key is there, answer at once". A `Pair` built with `to` replaces a two-element `int[]`, and the `?` in `Pair<Int, Int>?` says there may be no answer.',
      task: 'Write `twoSum(nums, target)`, which returns the positions `i to j` (with `i < j`) of the two numbers in `nums` that add up to `target`, or `null` when no two do. There is at most one answer. `twoSum(listOf(2, 7, 11, 15), 9)` is `(0, 1)`.\n\nThe starter tries every pair: right, but a loop inside a loop. One check gives it 200,000 numbers. Do it in **one pass**: remember each number\'s position in a map, and for each new number look up the one it needs.',
      starter: `fun twoSum(nums: List<Int>, target: Int): Pair<Int, Int>? {
    for (i in nums.indices) {
        for (j in i + 1 until nums.size) {
            if (nums[i] + nums[j] == target) return i to j
        }
    }
    return null
}

fun main() {
    println(twoSum(listOf(2, 7, 11, 15), 9))
    println(twoSum(listOf(3, 3), 6))
    println(twoSum(listOf(1, 2), 7))
}
`,
      solution: `fun twoSum(nums: List<Int>, target: Int): Pair<Int, Int>? {
    val seen = HashMap<Int, Int>()          // a number -> its position
    for ((i, x) in nums.withIndex()) {
        seen[target - x]?.let { return it to i }
        seen[x] = i
    }
    return null
}

fun main() {
    println(twoSum(listOf(2, 7, 11, 15), 9))
    println(twoSum(listOf(3, 3), 6))
    println(twoSum(listOf(1, 2), 7))
}
`,
      hints: [
        'For each number `x`, the number it needs is `target - x`. Has it been seen already, and where?',
        'Keep a `HashMap<Int, Int>` from a number to its position. Look up `target - x` **before** adding `x`, so a number never pairs with itself.',
        '`for ((i, x) in nums.withIndex())` gives the position and the value; `seen[target - x]?.let { return it to i }` answers as soon as the pair is found.'
      ],
      checks: [
        { label: '`twoSum(listOf(2, 7, 11, 15), 9)` is `(0, 1)`', code: `eq(twoSum(listOf(2, 7, 11, 15), 9), 0 to 1)` },
        { label: 'A number may pair with an equal one, but not with itself', code: `eq(twoSum(listOf(3, 3), 6), 0 to 1)
eq(twoSum(listOf(3, 2, 4), 6), 1 to 2)` },
        { label: 'No pair: `null`', code: `eq(twoSum(listOf(1, 2), 7), null)
eq(twoSum(emptyList(), 0), null)` },
        { label: '200,000 numbers, in one pass (a loop inside a loop takes too long)', code: `val n = 200_000
val nums = List(n) { it * 2 }
eq(twoSum(nums, nums[n - 2] + nums[n - 1]), (n - 2) to (n - 1))` }
      ]
    },
    {
      id: 'palindrome', level: 'Easy', kind: 'pattern', title: 'Palindrome, ignoring case and punctuation',
      summary: 'Does a sentence read the same both ways, counting only letters and digits? Two pointers moving inwards.',
      patterns: ['strings', 'two-pointers'], keywords: ['palindrome', 'two pointers', 'isLetterOrDigit', 'lowercaseChar', 'reversed'],
      learn: ['lesson:kt-strings', 'lesson:kt-conditions'],
      java: 'In Java you would call `Character.isLetterOrDigit(c)` and `Character.toLowerCase(c)`. In Kotlin they are members of `Char`: `c.isLetterOrDigit()`, `c.lowercaseChar()`. `s.lastIndex` is `s.length() - 1`, `s[i]` is `s.charAt(i)`, and a `when` with no subject replaces the `if`/`else if` ladder.',
      task: 'Write `isPalindrome(s)`: `true` when `s` reads the same forwards and backwards once you keep only its letters and digits and ignore case. `"A man, a plan, a canal: Panama"` is a palindrome; `"race a car"` is not; an empty string is.\n\nUse two positions, one from each end, moving inwards and skipping what is not a letter or a digit, so nothing is copied.',
      starter: `fun isPalindrome(s: String): Boolean {
    val lower = s.lowercase()
    return lower == lower.reversed()
}

fun main() {
    println(isPalindrome("A man, a plan, a canal: Panama"))
    println(isPalindrome("race a car"))
}
`,
      solution: `fun isPalindrome(s: String): Boolean {
    var i = 0
    var j = s.lastIndex
    while (i < j) {
        when {
            !s[i].isLetterOrDigit() -> i++
            !s[j].isLetterOrDigit() -> j--
            s[i].lowercaseChar() != s[j].lowercaseChar() -> return false
            else -> { i++; j-- }
        }
    }
    return true
}

fun main() {
    println(isPalindrome("A man, a plan, a canal: Panama"))
    println(isPalindrome("race a car"))
}
`,
      hints: [
        'The starter compares every character, commas and spaces included. Only letters and digits count.',
        'Start `i` at 0 and `j` at `s.lastIndex`. While `i < j`: skip a non-letter on either side, else compare the two characters ignoring case.',
        '`c.isLetterOrDigit()` and `c.lowercaseChar()` are members of `Char`.'
      ],
      checks: [
        { label: '`"A man, a plan, a canal: Panama"` is a palindrome', code: `ok(isPalindrome("A man, a plan, a canal: Panama"), "it reads amanaplanacanalpanama both ways")` },
        { label: '`"race a car"` is not', code: `ok(!isPalindrome("race a car"), "raceacar is not the same backwards")` },
        { label: 'Digits count and case does not: `"0P"` is not one, `"No \'x\' in Nixon"` is', code: `ok(!isPalindrome("0P"), "0P: the digit counts, so it is not a palindrome")
ok(isPalindrome("No 'x' in Nixon"), "noxinnixon reads the same both ways")` },
        { label: 'An empty string, and one with no letters, are palindromes', code: `ok(isPalindrome("") && isPalindrome(".,!"), "nothing to compare: true")` }
      ]
    },
    {
      id: 'first-unique', level: 'Easy', kind: 'pattern', title: 'First unique character',
      summary: 'The first character that occurs only once: count with groupingBy, then find it, or null.',
      patterns: ['counting', 'strings'], keywords: ['first unique', 'non-repeating', 'groupingBy', 'eachCount', 'firstOrNull', 'frequency'],
      learn: ['lesson:kt-collection-ops', 'lesson:kt-null-safety'],
      java: 'Java counts with `s.chars().mapToObj(c -> (char) c).collect(groupingBy(identity(), counting()))`, or a `HashMap` and `merge`. Kotlin: `s.groupingBy { it }.eachCount()`. And `firstOrNull { … }` returns `null` when nothing matches, so the result is a `Char?`: no sentinel such as `\'\\u0000\'`, no `Optional`.',
      task: 'Write `firstUnique(s)`: the first character of `s` that occurs exactly once in it, or `null` when there is none. `firstUnique("swiss")` is `\'w\'`; `firstUnique("aabb")` is `null`. Upper and lower case are different characters.\n\nCount every character first, with `groupingBy { it }.eachCount()`, then find the first whose count is 1.',
      starter: `fun firstUnique(s: String): Char? {
    val seen = mutableSetOf<Char>()
    for (c in s) {
        if (c !in seen) return c
        seen.add(c)
    }
    return null
}

fun main() {
    println(firstUnique("swiss"))
    println(firstUnique("aabb"))
}
`,
      solution: `fun firstUnique(s: String): Char? {
    val counts = s.groupingBy { it }.eachCount()
    return s.firstOrNull { counts[it] == 1 }
}

fun main() {
    println(firstUnique("swiss"))
    println(firstUnique("aabb"))
}
`,
      hints: [
        'The starter returns the first character it has not seen yet, which is always the first character. A later repeat is what makes a character not unique.',
        '`s.groupingBy { it }.eachCount()` is a `Map<Char, Int>` of how often each character occurs.',
        'Then `s.firstOrNull { counts[it] == 1 }`: in the string\'s own order, and `null` when none is.'
      ],
      checks: [
        { label: '`firstUnique("swiss")` is `\'w\'`', code: `eq(firstUnique("swiss"), 'w')` },
        { label: '`firstUnique("leetcode")` is `\'l\'`, `firstUnique("loveleetcode")` is `\'v\'`', code: `eq(firstUnique("leetcode"), 'l')
eq(firstUnique("loveleetcode"), 'v')` },
        { label: 'Nothing unique: `null`', code: `eq(firstUnique("aabb"), null)
eq(firstUnique(""), null)` },
        { label: 'Case counts: `firstUnique("aA")` is `\'a\'`', code: `eq(firstUnique("aA"), 'a')` }
      ]
    },
    {
      id: 'valid-brackets', level: 'Easy', kind: 'pattern', title: 'Valid brackets',
      summary: 'Is every (, [ and { closed by its own kind, in the right order? A stack, and a when over the characters.',
      patterns: ['stack'], keywords: ['balanced', 'brackets', 'parentheses', 'stack', 'ArrayDeque', 'removeLastOrNull'],
      learn: ['lesson:kt-conditions', 'lesson:kt-collections', 'lesson:kt-null-safety'],
      java: 'Java\'s usual stack is `Deque<Character> stack = new ArrayDeque<>()` with `push` and `pop`. Kotlin\'s own `ArrayDeque` has `addLast` and `removeLastOrNull()`, which gives `null` on an empty stack instead of throwing, so one comparison also covers "nothing left to close". A `when` branch can list several values: `\'(\', \'[\', \'{\' -> …`.',
      task: 'Write `isBalanced(s)`: `true` when every `(`, `[` and `{` in `s` is closed by the same kind of bracket, in the right order, and nothing is closed that was not opened. Other characters are ignored. `"{[()]}"` and `"a(b)c"` are balanced; `"(]"`, `"([)]"`, `"(()"` and `")("` are not.',
      starter: `fun isBalanced(s: String): Boolean {
    var open = 0
    for (c in s) {
        if (c == '(' || c == '[' || c == '{') open++
        if (c == ')' || c == ']' || c == '}') open--
    }
    return open == 0
}

fun main() {
    println(isBalanced("{[()]}"))
    println(isBalanced("([)]"))
}
`,
      solution: `fun isBalanced(s: String): Boolean {
    val pairs = mapOf(')' to '(', ']' to '[', '}' to '{')
    val stack = ArrayDeque<Char>()
    for (c in s) {
        when (c) {
            '(', '[', '{' -> stack.addLast(c)
            ')', ']', '}' -> if (stack.removeLastOrNull() != pairs[c]) return false
        }
    }
    return stack.isEmpty()
}

fun main() {
    println(isBalanced("{[()]}"))
    println(isBalanced("([)]"))
}
`,
      hints: [
        'Counting is not enough: `"(]"` opens one and closes one, but the wrong kind. Remember *which* brackets are open.',
        'Push each opening bracket on a stack (`ArrayDeque<Char>`, `addLast`). A closing one must match the last opened one: `removeLastOrNull()`.',
        'A map from each closing bracket to its opening one keeps the `when` short. At the end the stack must be empty.'
      ],
      checks: [
        { label: 'Nested and in order: `"{[()]}"` and `"a(b)c[d]"` are balanced', code: `ok(isBalanced("{[()]}") && isBalanced("a(b)c[d]"), "both are balanced")` },
        { label: 'The wrong kind closes: `"(]"` is not', code: `ok(!isBalanced("(]"), "( is closed by ]")` },
        { label: 'Crossed: `"([)]"` is not', code: `ok(!isBalanced("([)]"), "[ is still open when ) comes")` },
        { label: 'Left open, or closed before it opens: `"(()"` and `")("` are not', code: `ok(!isBalanced("(()"), "one ( is never closed")
ok(!isBalanced(")("), ") comes before any (")` }
      ]
    },
    {
      id: 'max-profit', level: 'Easy', kind: 'pattern', title: 'Best time to buy and sell',
      summary: 'The best profit from buying on one day and selling on a later one: one pass, keeping the lowest price so far.',
      patterns: ['one-pass'], keywords: ['stock', 'buy and sell', 'max profit', 'running minimum', 'one pass', 'minOf', 'maxOf'],
      learn: ['lesson:kt-variables', 'lesson:kt-loops'],
      java: 'The same loop in Java. `minOf` and `maxOf` replace `Math.min` and `Math.max`, and `Int.MAX_VALUE` is `Integer.MAX_VALUE`. Kotlin also has `prices.min()`, but the overall minimum forgets the order of the days, which is the whole problem.',
      task: '`prices[i]` is the price on day `i`. Write `maxProfit(prices)`: the most you can make by buying on one day and selling on a **later** day, or 0 when no profit is possible. `maxProfit(listOf(7, 1, 5, 3, 6, 4))` is 5 (buy at 1, sell at 6); falling prices give 0.\n\nDo it in one pass: keep the lowest price seen so far, and the best profit from selling today.',
      starter: `fun maxProfit(prices: List<Int>): Int {
    if (prices.isEmpty()) return 0
    return prices.max() - prices.min()
}

fun main() {
    println(maxProfit(listOf(7, 1, 5, 3, 6, 4)))
    println(maxProfit(listOf(7, 6, 4, 3, 1)))
}
`,
      solution: `fun maxProfit(prices: List<Int>): Int {
    var lowest = Int.MAX_VALUE
    var best = 0
    for (p in prices) {
        lowest = minOf(lowest, p)
        best = maxOf(best, p - lowest)
    }
    return best
}

fun main() {
    println(maxProfit(listOf(7, 1, 5, 3, 6, 4)))
    println(maxProfit(listOf(7, 6, 4, 3, 1)))
}
`,
      hints: [
        'The highest price minus the lowest ignores the order: the highest may come before the lowest.',
        'Walk the days once. Before looking at today\'s price as a sale, the best buy is the lowest price of the days so far.',
        '`lowest = minOf(lowest, p)`, then `best = maxOf(best, p - lowest)`. Start `lowest` at `Int.MAX_VALUE` and `best` at 0.'
      ],
      checks: [
        { label: '`[7, 1, 5, 3, 6, 4]`: buy at 1, sell at 6, profit 5', code: `eq(maxProfit(listOf(7, 1, 5, 3, 6, 4)), 5)` },
        { label: 'Falling prices: no profit, 0', code: `eq(maxProfit(listOf(7, 6, 4, 3, 1)), 0)` },
        { label: 'Sell after you buy, and the cheapest day is not always the day to buy: `[5, 1, 3]` is 2, `[2, 9, 1, 3]` is 7', code: `eq(maxProfit(listOf(5, 1, 3)), 2)
eq(maxProfit(listOf(2, 9, 1, 3)), 7)` },
        { label: 'No days, or one: 0', code: `eq(maxProfit(emptyList()), 0)
eq(maxProfit(listOf(4)), 0)` },
        { label: '200,000 prices, in one pass', code: `val prices = List(200_000) { if (it < 100_000) 200_000 - it else it }
eq(maxProfit(prices), 99_999)` }
      ]
    },
    {
      id: 'top-words', level: 'Easy', kind: 'pattern', title: 'The most common words',
      summary: 'The k most frequent words of a text, ties in alphabetical order: groupingBy, eachCount and a two-key comparator.',
      patterns: ['counting', 'sorting', 'strings'], keywords: ['word count', 'top k', 'frequency', 'groupingBy', 'eachCount', 'compareByDescending', 'thenBy', 'Regex'],
      learn: ['lesson:kt-collection-ops', 'lesson:kt-strings', 'ref:groupingby', 'ref:sortedwith'],
      java: 'Java: `Arrays.stream(text.toLowerCase().split("\\\\W+")).collect(groupingBy(w -> w, counting()))`, then a stream of the entries sorted with `Map.Entry.comparingByValue().reversed()` and a second comparator for ties. Kotlin chains the same steps on the collection itself: `groupingBy { it }.eachCount()`, then `sortedWith(compareByDescending { … }.thenBy { … })`, `take(k)` and `map`.',
      task: 'Write `topWords(text, k)`: the `k` most common words in `text`, most common first. A word is a run of the letters a to z, compared in lower case (`"The"`, `"the,"` and `"THE"` are one word). When two words are equally common, the one first in alphabetical order comes first. `topWords("the cat and the hat and the bat", 2)` is `["the", "and"]`.',
      starter: `fun topWords(text: String, k: Int): List<String> {
    val counts = mutableMapOf<String, Int>()
    for (w in text.split(" ")) {
        counts[w] = (counts[w] ?: 0) + 1
    }
    return counts.entries.sortedByDescending { it.value }.take(k).map { it.key }
}

fun main() {
    println(topWords("the cat and the hat and the bat", 2))
}
`,
      solution: `fun topWords(text: String, k: Int): List<String> =
    Regex("[a-z]+").findAll(text.lowercase())
        .map { it.value }
        .groupingBy { it }
        .eachCount()
        .entries
        .sortedWith(compareByDescending<Map.Entry<String, Int>> { it.value }.thenBy { it.key })
        .take(k)
        .map { it.key }

fun main() {
    println(topWords("the cat and the hat and the bat", 2))
}
`,
      hints: [
        'Splitting on spaces keeps punctuation (`"the,"`) and case (`"The"`). Lower-case the text, then find the runs of letters with `Regex("[a-z]+").findAll(…)`.',
        '`groupingBy { it }.eachCount()` counts each word.',
        'Sort the entries with `compareByDescending<Map.Entry<String, Int>> { it.value }.thenBy { it.key }`: the count first, then the word for ties.'
      ],
      checks: [
        { label: '`topWords("the cat and the hat and the bat", 2)` is `["the", "and"]`', code: `eq(topWords("the cat and the hat and the bat", 2), listOf("the", "and"))` },
        { label: 'Case and punctuation do not make a new word', code: `eq(topWords("The cat. the dog, THE end!", 1), listOf("the"))` },
        { label: 'Ties in alphabetical order', code: `eq(topWords("b a c b a c", 3), listOf("a", "b", "c"))` },
        { label: 'More asked for than there are: all of them; an empty text: none', code: `eq(topWords("one two", 5), listOf("one", "two"))
eq(topWords("", 3), emptyList<String>())` }
      ]
    },
    {
      id: 'rw-data-class', level: 'Easy', kind: 'rewrite', title: 'A JavaBean to a data class',
      summary: 'A class with a constructor, getters, equals, hashCode and toString, written by hand: one data class line, and copy for a change.',
      patterns: ['data-classes'], keywords: ['javabean', 'pojo', 'data class', 'equals', 'hashCode', 'toString', 'copy', 'record'],
      learn: ['lesson:kt-data-classes', 'lesson:kt-constructors', 'q:data-classes'],
      java: 'A `data class` writes `equals`, `hashCode`, `toString`, `copy` and `component1()`… from the properties in its primary constructor. `val` gives each property its getter (Java still calls `getName()`), and `copy(age = …)` replaces "a new object with one field changed". Java 16\'s `record` is the nearest Java has; a data class can also have `var` properties and default values.',
      task: 'The Java below is a value class written the long way. The Kotlin in the editor is the same class written as a Java developer writes it first: it compiles and prints what the Java prints, but it is still Java in Kotlin\'s clothes.\n\nRewrite it the Kotlin way: `Person` becomes a **data class**, with no hand-written `equals`, `hashCode`, `toString` or getters; compare with `==`; and make the older person with **`copy(age = …)`**. The output must not change.',
      original: `import java.util.*;

public class Main {
    static final class Person {
        private final String name;
        private final int age;

        Person(String name, int age) {
            this.name = name;
            this.age = age;
        }

        String getName() { return name; }
        int getAge() { return age; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Person)) return false;
            Person p = (Person) o;
            return age == p.age && name.equals(p.name);
        }

        @Override
        public int hashCode() { return Objects.hash(name, age); }

        @Override
        public String toString() { return "Person(name=" + name + ", age=" + age + ")"; }
    }

    public static void main(String[] args) {
        Person asha = new Person("Asha", 30);
        Person twin = new Person("Asha", 30);
        System.out.println(asha);
        System.out.println(asha.equals(twin));
        Set<Person> people = new HashSet<>(List.of(asha, twin));
        System.out.println(people.size());
        Person older = new Person(asha.getName(), asha.getAge() + 1);
        System.out.println(older);
    }
}
`,
      starter: `class Person(name: String, age: Int) {
    private val name: String = name
    private val age: Int = age

    fun getName(): String = name
    fun getAge(): Int = age

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Person) return false
        return age == other.age && name == other.name
    }

    override fun hashCode(): Int = java.util.Objects.hash(name, age)

    override fun toString(): String = "Person(name=" + name + ", age=" + age + ")"
}

fun main() {
    val asha = Person("Asha", 30)
    val twin = Person("Asha", 30)
    println(asha)
    println(asha.equals(twin))
    val people = hashSetOf(asha, twin)
    println(people.size)
    val older = Person(asha.getName(), asha.getAge() + 1)
    println(older)
}
`,
      solution: `data class Person(val name: String, val age: Int)

fun main() {
    val asha = Person("Asha", 30)
    val twin = Person("Asha", 30)
    println(asha)
    println(asha == twin)
    val people = hashSetOf(asha, twin)
    println(people.size)
    val older = asha.copy(age = asha.age + 1)
    println(older)
}
`,
      hints: [
        'Everything the class body does by hand, a `data class` does for you, from the properties in its constructor: `data class Person(val name: String, val age: Int)`.',
        'With `val` properties, `asha.name` replaces `asha.getName()`; `==` calls `equals`.',
        '`asha.copy(age = asha.age + 1)` is a new `Person` with only the age changed.'
      ],
      checks: [
        { label: 'It prints what the Java prints', code: `eq(output, "Person(name=Asha, age=30)\\ntrue\\n1\\nPerson(name=Asha, age=31)\\n")` },
        { label: '`Person` is a value: equal by content, the same hash code, a readable `toString`', code: `val a = Person("Li", 7)
val b = Person("Li", 7)
eq(a, b)
eq(a.hashCode(), b.hashCode())
eq(a.toString(), "Person(name=Li, age=7)")` },
        { label: '`Person` is a `data class`', idiom: true, code: `ok(uses("""\\bdata\\s+class\\s+Person\\b"""), "declare it as data class Person(val name: String, val age: Int)")` },
        { label: 'No hand-written `equals`, `hashCode`, `toString` or getters', idiom: true, code: `ok(!uses("""fun\\s+(equals|hashCode|toString|get[A-Z]\\w*)\\s*\\("""), "the data class writes equals, hashCode and toString, and val gives the getters")` },
        { label: 'The older person made with `copy(age = …)`', idiom: true, code: `ok(uses("""\\.copy\\s*\\(\\s*age\\s*="""), "make the changed person with asha.copy(age = asha.age + 1)")` },
        { label: 'Compared with `==`, not `.equals(…)`', idiom: true, code: `ok(!uses("""\\.equals\\s*\\("""), "a == b calls equals for you")` }
      ]
    },
    {
      id: 'rw-null-checks', level: 'Easy', kind: 'rewrite', title: 'Null checks to ?. and ?:',
      summary: 'Nested if (x != null && x.getY() != null) checks become a chain of safe calls with an Elvis default.',
      patterns: ['null-safety'], keywords: ['null check', 'safe call', 'elvis', '?.', '?:', 'NullPointerException', 'optional chaining'],
      learn: ['lesson:kt-null-safety', 'q:null-safety', 'q:npe-in-kotlin'],
      java: 'Every `if (x != null && x.getY() != null …)` chain becomes one expression: `?.` stops at the first `null` and gives `null`, and `?:` supplies the default. Declaring the types as `Customer?` and `String?` is what makes it safe: the compiler then refuses `order.customer.address` without a check. `!!` ("I promise it is not null") brings the `NullPointerException` back, so idiomatic code almost never needs it.',
      task: 'The Java below guards every step against `null`. The Kotlin in the editor does the same with `!= null` and `== null` checks: it works, and prints what the Java prints.\n\nRewrite `cityOf` and `nameLength` with **safe calls** (`?.`) and the **Elvis operator** (`?:`): each becomes a single expression, with no `!= null`, no `== null` and no `!!`. The output must not change.',
      original: `import java.util.*;

public class Main {
    record Address(String city) {}
    record Customer(String name, Address address) {}
    record Order(int id, Customer customer) {}

    static String cityOf(Order order) {
        if (order != null && order.customer() != null && order.customer().address() != null
                && order.customer().address().city() != null) {
            return order.customer().address().city().toUpperCase();
        }
        return "UNKNOWN";
    }

    static int nameLength(Customer c) {
        if (c == null) return 0;
        String n = c.name();
        if (n == null) return 0;
        return n.length();
    }

    public static void main(String[] args) {
        Order full = new Order(1, new Customer("Asha", new Address("Pune")));
        Order noAddress = new Order(2, new Customer("Ravi", null));
        Order noCustomer = new Order(3, null);
        for (Order o : Arrays.asList(full, noAddress, noCustomer, null)) {
            System.out.println(cityOf(o));
        }
        System.out.println(nameLength(full.customer()));
        System.out.println(nameLength(new Customer(null, null)));
        System.out.println(nameLength(null));
    }
}
`,
      starter: `data class Address(val city: String?)
data class Customer(val name: String?, val address: Address?)
data class Order(val id: Int, val customer: Customer?)

fun cityOf(order: Order?): String {
    if (order != null && order.customer != null && order.customer.address != null
        && order.customer.address.city != null) {
        return order.customer.address.city.uppercase()
    }
    return "UNKNOWN"
}

fun nameLength(c: Customer?): Int {
    if (c == null) return 0
    val n = c.name
    if (n == null) return 0
    return n.length
}

fun main() {
    val full = Order(1, Customer("Asha", Address("Pune")))
    val noAddress = Order(2, Customer("Ravi", null))
    val noCustomer = Order(3, null)
    for (o in listOf(full, noAddress, noCustomer, null)) {
        println(cityOf(o))
    }
    println(nameLength(full.customer))
    println(nameLength(Customer(null, null)))
    println(nameLength(null))
}
`,
      solution: `data class Address(val city: String?)
data class Customer(val name: String?, val address: Address?)
data class Order(val id: Int, val customer: Customer?)

fun cityOf(order: Order?): String = order?.customer?.address?.city?.uppercase() ?: "UNKNOWN"

fun nameLength(c: Customer?): Int = c?.name?.length ?: 0

fun main() {
    val full = Order(1, Customer("Asha", Address("Pune")))
    val noAddress = Order(2, Customer("Ravi", null))
    val noCustomer = Order(3, null)
    for (o in listOf(full, noAddress, noCustomer, null)) {
        println(cityOf(o))
    }
    println(nameLength(full.customer))
    println(nameLength(Customer(null, null)))
    println(nameLength(null))
}
`,
      hints: [
        '`order?.customer` is `null` when `order` is `null`, and otherwise the customer. Chain it: `order?.customer?.address?.city`.',
        'Calls go on the same way: `…city?.uppercase()`. The whole chain is `null` as soon as any step is.',
        'The Elvis operator gives the default: `chain ?: "UNKNOWN"`, and `c?.name?.length ?: 0`.'
      ],
      checks: [
        { label: 'It prints what the Java prints', code: `eq(output, "PUNE\\nUNKNOWN\\nUNKNOWN\\nUNKNOWN\\n4\\n0\\n0\\n")` },
        { label: 'A `null` at any level gives the default', code: `eq(cityOf(Order(9, Customer("X", Address(null)))), "UNKNOWN")
eq(cityOf(Order(9, Customer("X", Address("Goa")))), "GOA")
eq(nameLength(Customer("Li", null)), 2)` },
        { label: 'No `!= null` or `== null` checks: safe calls (`?.`) instead', idiom: true, code: `ok(!uses("""[!=]=\\s*null\\b"""), "chain safe calls: order?.customer?.address?.city")` },
        { label: 'The default given with the Elvis operator `?:`', idiom: true, code: `ok(uses("""\\?:"""), "give the default with ?: \\"UNKNOWN\\" and ?: 0")` },
        { label: 'No `!!`', idiom: true, code: `ok(!uses("""!!"""), "!! throws on null: a safe call and a default never do")` }
      ]
    },
    {
      id: 'rw-collection-ops', level: 'Easy', kind: 'rewrite', title: 'A loop and a map to collection operations',
      summary: 'A for loop filling a TreeMap of totals, and another filling a list: filter, groupBy, sumOf and distinct instead.',
      patterns: ['collection-ops'], keywords: ['loop', 'accumulator', 'groupBy', 'sumOf', 'mapValues', 'toSortedMap', 'distinct', 'streams', 'collectors'],
      learn: ['lesson:kt-collection-ops', 'lesson:kt-lambdas', 'q:collection-operations'],
      java: 'A Java loop that filters, groups and adds becomes a pipeline on the list itself: `filter`, `groupBy` (a `Map<K, List<V>>`), `mapValues` with `sumOf`, and `toSortedMap()` for the `TreeMap`\'s order. Java\'s streams can do the same (`collect(groupingBy(…, TreeMap::new, summingInt(…)))`); Kotlin needs no `stream()` and no collectors, and the results are read-only.',
      task: 'The Java below totals the sales of 20 or more per region, and lists the products of the big sales once each. The Kotlin in the editor is the same two loops, filling a `TreeMap` and an `ArrayList` by hand: it works, and prints what the Java prints.\n\nRewrite `regionTotals` and `bigProducts` as **collection operations**: no loop over `sales`, and no map or list filled by hand. Keep `main` as it is; the output must not change.',
      original: `import java.util.*;

public class Main {
    record Sale(String region, String product, int amount) {}

    public static void main(String[] args) {
        List<Sale> sales = List.of(
            new Sale("north", "tea", 120), new Sale("south", "tea", 80),
            new Sale("north", "coffee", 200), new Sale("east", "tea", 15),
            new Sale("south", "coffee", 40), new Sale("north", "tea", 30));
        Map<String, Integer> totals = new TreeMap<>();
        for (Sale s : sales) {
            if (s.amount() >= 20) {
                Integer old = totals.get(s.region());
                if (old == null) old = 0;
                totals.put(s.region(), old + s.amount());
            }
        }
        for (Map.Entry<String, Integer> e : totals.entrySet()) {
            System.out.println(e.getKey() + ": " + e.getValue());
        }
        List<String> big = new ArrayList<>();
        for (Sale s : sales) {
            if (s.amount() >= 100 && !big.contains(s.product())) big.add(s.product());
        }
        System.out.println(big);
    }
}
`,
      starter: `import java.util.TreeMap

data class Sale(val region: String, val product: String, val amount: Int)

fun regionTotals(sales: List<Sale>): Map<String, Int> {
    val totals = TreeMap<String, Int>()
    for (s in sales) {
        if (s.amount >= 20) {
            var old = totals.get(s.region)
            if (old == null) old = 0
            totals.put(s.region, old + s.amount)
        }
    }
    return totals
}

fun bigProducts(sales: List<Sale>): List<String> {
    val big = ArrayList<String>()
    for (s in sales) {
        if (s.amount >= 100 && !big.contains(s.product)) big.add(s.product)
    }
    return big
}

fun main() {
    val sales = listOf(
        Sale("north", "tea", 120), Sale("south", "tea", 80),
        Sale("north", "coffee", 200), Sale("east", "tea", 15),
        Sale("south", "coffee", 40), Sale("north", "tea", 30),
    )
    for ((region, total) in regionTotals(sales)) println("$region: $total")
    println(bigProducts(sales))
}
`,
      solution: `data class Sale(val region: String, val product: String, val amount: Int)

fun regionTotals(sales: List<Sale>): Map<String, Int> =
    sales.filter { it.amount >= 20 }
        .groupBy { it.region }
        .mapValues { (_, list) -> list.sumOf { it.amount } }
        .toSortedMap()

fun bigProducts(sales: List<Sale>): List<String> =
    sales.filter { it.amount >= 100 }.map { it.product }.distinct()

fun main() {
    val sales = listOf(
        Sale("north", "tea", 120), Sale("south", "tea", 80),
        Sale("north", "coffee", 200), Sale("east", "tea", 15),
        Sale("south", "coffee", 40), Sale("north", "tea", 30),
    )
    for ((region, total) in regionTotals(sales)) println("$region: $total")
    println(bigProducts(sales))
}
`,
      hints: [
        'Read the loop as steps: keep the sales of 20 or more (`filter`), put them in groups by region (`groupBy`), add up each group (`mapValues` with `sumOf`).',
        'The `TreeMap` was only there for the alphabetical order: `toSortedMap()` gives the same.',
        '`bigProducts`: `filter`, then `map { it.product }`, then `distinct()`, which keeps the first of each in order.'
      ],
      checks: [
        { label: 'It prints what the Java prints', code: `eq(output, "north: 350\\nsouth: 120\\n[tea, coffee]\\n")` },
        { label: '`regionTotals` adds each region\'s sales of 20 or more, the regions in alphabetical order', code: `val t = regionTotals(listOf(Sale("b", "x", 5), Sale("b", "y", 25), Sale("a", "x", 20)))
eq(t.toList(), listOf("a" to 20, "b" to 25))` },
        { label: '`bigProducts` lists each product of a sale of 100 or more once, in order', code: `eq(bigProducts(listOf(Sale("a", "y", 100), Sale("b", "x", 150), Sale("c", "y", 300))), listOf("y", "x"))` },
        { label: 'No loop over `sales`: collection operations instead', idiom: true, code: `ok(!uses("""\\bfor\\s*\\(\\s*\\w+\\s+in\\s+sales\\b"""), "filter, groupBy, sumOf and map replace the loops over sales")` },
        { label: 'No map or list filled by hand (`TreeMap()`, `ArrayList()`, `put`, `add`)', idiom: true, code: `ok(!uses("""\\b(TreeMap|HashMap|ArrayList|mutableMapOf|mutableListOf)\\b|\\.(put|add)\\s*\\("""), "let groupBy, mapValues and map build the results")` }
      ]
    },
    {
      id: 'rw-extensions', level: 'Easy', kind: 'rewrite', title: 'A static utility class to extension functions',
      summary: 'StringUtils.initials(s) becomes s.initials(): top-level extension functions instead of a class of static methods.',
      patterns: ['extensions', 'strings'], keywords: ['utility class', 'static methods', 'StringUtils', 'extension function', 'receiver', 'helpers'],
      learn: ['lesson:kt-extensions', 'lesson:kt-strings', 'q:extension-functions'],
      java: 'A Java utility class (`final`, a private constructor, `static` methods) becomes top-level extension functions: `fun String.initials()` is called as `name.initials()`, and inside it `this` is the string. A `String?` receiver can even be called on `null`. They compile to static methods of `MainKt`, so Java still calls `MainKt.initials(name)`. The standard library is built the same way: `isNullOrBlank()`, `take`, `split` are all extensions.',
      task: 'The Java below keeps three string helpers in a utility class of `static` methods. The Kotlin in the editor does the same with an `object`: it works, and prints what the Java prints.\n\nRewrite the three helpers as **extension functions** at the top level, called on the string: `"ada lovelace".initials()`, `"Kotlin".truncate(5)`, and `isBlankOrNull()` on a `String?`. Build the initials with `split`, `filter` and `joinToString` rather than a `StringBuilder` loop. The output must not change.',
      original: `public class Main {
    static final class StringUtils {
        private StringUtils() {}

        static String initials(String fullName) {
            StringBuilder sb = new StringBuilder();
            for (String part : fullName.trim().split("\\\\s+")) {
                if (!part.isEmpty()) sb.append(Character.toUpperCase(part.charAt(0)));
            }
            return sb.toString();
        }

        static boolean isBlankOrNull(String s) {
            return s == null || s.trim().isEmpty();
        }

        static String truncate(String s, int max) {
            return s.length() <= max ? s : s.substring(0, max - 3) + "...";
        }
    }

    public static void main(String[] args) {
        System.out.println(StringUtils.initials("grace brewster hopper"));
        System.out.println(StringUtils.initials("  ada   lovelace "));
        System.out.println(StringUtils.isBlankOrNull(null) + " " + StringUtils.isBlankOrNull("  ") + " " + StringUtils.isBlankOrNull("x"));
        System.out.println(StringUtils.truncate("Kotlin coroutines", 10));
        System.out.println(StringUtils.truncate("Flow", 10));
    }
}
`,
      starter: `object StringUtils {
    fun initials(fullName: String): String {
        val sb = StringBuilder()
        for (part in fullName.trim().split(Regex("\\\\s+"))) {
            if (!part.isEmpty()) sb.append(part[0].uppercaseChar())
        }
        return sb.toString()
    }

    fun isBlankOrNull(s: String?): Boolean {
        return s == null || s.trim().isEmpty()
    }

    fun truncate(s: String, max: Int): String {
        return if (s.length <= max) s else s.substring(0, max - 3) + "..."
    }
}

fun main() {
    println(StringUtils.initials("grace brewster hopper"))
    println(StringUtils.initials("  ada   lovelace "))
    println(StringUtils.isBlankOrNull(null).toString() + " " + StringUtils.isBlankOrNull("  ") + " " + StringUtils.isBlankOrNull("x"))
    println(StringUtils.truncate("Kotlin coroutines", 10))
    println(StringUtils.truncate("Flow", 10))
}
`,
      solution: `fun String.initials(): String =
    split(' ').filter { it.isNotEmpty() }.joinToString("") { it.first().uppercase() }

fun String?.isBlankOrNull(): Boolean = this == null || isBlank()

fun String.truncate(max: Int): String = if (length <= max) this else take(max - 3) + "..."

fun main() {
    val missing: String? = null
    println("grace brewster hopper".initials())
    println("  ada   lovelace ".initials())
    println("\${missing.isBlankOrNull()} \${"  ".isBlankOrNull()} \${"x".isBlankOrNull()}")
    println("Kotlin coroutines".truncate(10))
    println("Flow".truncate(10))
}
`,
      hints: [
        '`fun String.initials(): String = …` declares an extension: call it as `"ada lovelace".initials()`; inside, `this` is the string, so `split(…)` and `length` need no receiver.',
        'Declare the receiver as `String?` for a function that must accept `null`: `fun String?.isBlankOrNull() = this == null || isBlank()`. (The standard library already has `isNullOrBlank()`.)',
        'For the initials: `split(\' \')`, keep the non-empty parts, and `joinToString("") { it.first().uppercase() }`.'
      ],
      checks: [
        { label: 'It prints what the Java prints', code: `eq(output, "GBH\\nAL\\ntrue true false\\nKotlin ...\\nFlow\\n")` },
        { label: 'Each helper is an extension, called on the string', idiom: true, code: `eq("ada lovelace".initials(), "AL")
eq("Kotlin".truncate(5), "Ko...")
val none: String? = null
ok(none.isBlankOrNull(), "a null String? is blank or null")` },
        { label: 'No utility `object` or class holding them', idiom: true, code: `ok(!uses("""\\b(object|class)\\s+StringUtils\\b"""), "make them top-level: fun String.initials() = …")` },
        { label: 'No `StringBuilder` loop: `split`, `filter` and `joinToString`', idiom: true, code: `ok(!uses("""StringBuilder|\\bfor\\s*\\("""), "build the initials with split, filter and joinToString")` }
      ]
    }
  );
})(window.KLT);
