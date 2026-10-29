/*
 * Practice, part 1: the patterns every kata is filed under, and the Easy katas.
 *
 * Kata shape (U.data.katas; the other levels are in data/katas-medium.js and data/katas-hard.js):
 *   {id, level: 'Easy'|'Medium'|'Hard', title, summary, patterns: [ids from U.data.kataPatterns],
 *    keywords?: [..] (more words search should find it by),
 *    learn?: ['lesson:py-collections', 'ref:mod-heapq'] (where what it needs is taught),
 *    java?: Markdown (how a Java developer would do it),
 *    task: Markdown, starter, solution, hints: [..], checks: [{label (Markdown), code (Python)}]}
 *
 * A kata is a challenge like a lesson's: the same checks and helpers (see the top of py/checker.py),
 * and the tests prove that the starter fails and the solution passes, on your Python and in the
 * browser's. Code is written with String.raw so it reads exactly as Python.
 */
(function (U) {
  U.data.kataPatterns = [
    { id: 'hashing', title: 'Dicts and sets' },
    { id: 'counting', title: 'Counter' },
    { id: 'strings', title: 'Strings' },
    { id: 'slicing', title: 'Slicing' },
    { id: 'sorting', title: 'Sorting with a key' },
    { id: 'one-pass', title: 'One pass, a running value' },
    { id: 'two-pointers', title: 'Two pointers' },
    { id: 'sliding-window', title: 'Sliding window' },
    { id: 'prefix-sums', title: 'Prefix sums' },
    { id: 'stack', title: 'Stack' },
    { id: 'deque', title: 'deque' },
    { id: 'heapq', title: 'heapq' },
    { id: 'bisect', title: 'Binary search and bisect' },
    { id: 'recursion', title: 'Recursion and backtracking' },
    { id: 'graphs', title: 'Graphs and grids' },
    { id: 'dp', title: 'Dynamic programming' },
    { id: 'design', title: 'Design a class' },
    { id: 'parsing', title: 'Parsing' },
    { id: 'math', title: 'Arithmetic' }
  ];

  var K = U.data.katas = U.data.katas || [];

  K.push(
    {
      id: 'fizzbuzz', level: 'Easy', title: 'FizzBuzz',
      summary: 'The classic warm-up: numbers, with Fizz, Buzz and FizzBuzz for multiples of 3, 5 and both.',
      patterns: ['math'], keywords: ['modulo', 'loop', 'range'],
      learn: ['lesson:py-loops', 'lesson:py-if'],
      java: 'The same `%` and the same order of tests. Python builds the list with `append` (or a comprehension) instead of an `ArrayList`, and `str(n)` replaces `String.valueOf(n)`.',
      task: 'Write `fizzbuzz(n)`, which returns a **list of strings** for the numbers 1 to `n`: `"Fizz"` for a multiple of 3, `"Buzz"` for a multiple of 5, `"FizzBuzz"` for a multiple of both, and the number itself (as text) otherwise. `fizzbuzz(5)` is `["1", "2", "Fizz", "4", "Buzz"]`, and `fizzbuzz(0)` is `[]`.',
      starter: String.raw`def fizzbuzz(n):
    result = []
    for i in range(n):
        if i % 3 == 0:
            result.append("Fizz")
        elif i % 5 == 0:
            result.append("Buzz")
        else:
            result.append(i)
    return result


print(fizzbuzz(15))
`,
      solution: String.raw`def fizzbuzz(n):
    result = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            result.append("FizzBuzz")
        elif i % 3 == 0:
            result.append("Fizz")
        elif i % 5 == 0:
            result.append("Buzz")
        else:
            result.append(str(i))
    return result


print(fizzbuzz(15))
`,
      hints: [
        '`range(n)` counts 0 to n - 1. For 1 to n, write `range(1, n + 1)`.',
        'Test for 15 (both) first: once `i % 3 == 0` has matched, the `elif` lines below it are skipped.',
        'The list holds strings: `str(i)`, not `i`.'
      ],
      checks: [
        { label: '`fizzbuzz(5)` is `["1", "2", "Fizz", "4", "Buzz"]`', code: String.raw`assert fizzbuzz(5) == ["1", "2", "Fizz", "4", "Buzz"]` },
        { label: '15 is `"FizzBuzz"`', code: String.raw`assert fizzbuzz(15)[-1] == "FizzBuzz"` },
        { label: 'Every item is a string', code: String.raw`assert all(isinstance(x, str) for x in fizzbuzz(20)), fizzbuzz(20)` },
        { label: '`fizzbuzz(0)` is empty, and 100 numbers give 100 items', code: String.raw`assert fizzbuzz(0) == []
assert len(fizzbuzz(100)) == 100 and fizzbuzz(100).count("FizzBuzz") == 6` }
      ]
    },
    {
      id: 'reverse-words', level: 'Easy', title: 'Reverse the words',
      summary: 'Turn "the sky is blue" into "blue is sky the", whatever spaces surround the words.',
      patterns: ['strings', 'slicing'], keywords: ['split', 'join', 'reverse'],
      learn: ['lesson:py-strings', 'lesson:py-slicing', 'ref:str-split', 'ref:str-join'],
      java: 'In Java: `String[] words = s.trim().split("\\\\s+")`, reverse the array, `String.join(" ", ...)`. Python\'s `split()` with no argument already splits on any run of whitespace and drops the empty pieces at the ends.',
      task: 'Write `reverse_words(text)`, which returns the words of `text` in the opposite order, separated by single spaces. Extra spaces anywhere (before, between, after the words) disappear: `reverse_words("  the sky  is blue ")` is `"blue is sky the"`. A text with no words gives `""`.',
      starter: String.raw`def reverse_words(text):
    words = text.split(" ")
    words.reverse()
    return " ".join(words)


print(repr(reverse_words("  the sky  is blue ")))
`,
      solution: String.raw`def reverse_words(text):
    return " ".join(text.split()[::-1])


print(repr(reverse_words("  the sky  is blue ")))
`,
      hints: [
        '`text.split(" ")` keeps an empty string for every extra space. `text.split()`, with no argument, splits on any whitespace and keeps only the words.',
        '`words[::-1]` is a reversed copy; `" ".join(...)` glues the words with single spaces.'
      ],
      checks: [
        { label: '`"the sky is blue"` becomes `"blue is sky the"`', code: String.raw`assert reverse_words("the sky is blue") == "blue is sky the"` },
        { label: 'Extra spaces disappear', code: String.raw`assert reverse_words("  the sky  is blue ") == "blue is sky the"` },
        { label: 'Tabs and new lines count as spaces too', code: String.raw`assert reverse_words("one\ttwo\nthree") == "three two one"` },
        { label: 'No words gives `""`; one word stays itself', code: String.raw`assert reverse_words("   ") == ""
assert reverse_words("hello") == "hello"` }
      ]
    },
    {
      id: 'palindrome', level: 'Easy', title: 'Palindrome, ignoring case and punctuation',
      summary: '"A man, a plan, a canal: Panama" reads the same backwards, once only letters and digits count.',
      patterns: ['strings', 'two-pointers'], keywords: ['palindrome', 'isalnum', 'reverse'],
      learn: ['lesson:py-strings', 'lesson:py-slicing', 'lesson:py-comprehensions'],
      java: 'Java filters with `Character.isLetterOrDigit` in a loop or a stream. Python\'s `ch.isalnum()` is the same test, a generator expression builds the cleaned text, and `s[::-1]` reverses it, with no `StringBuilder`.',
      task: 'Write `is_palindrome(text)`: `True` when `text` reads the same forwards and backwards, counting only letters and digits and ignoring case. `"A man, a plan, a canal: Panama"` is one; `"race a car"` is not. An empty text counts as a palindrome.',
      starter: String.raw`def is_palindrome(text):
    return text == text[::-1]


print(is_palindrome("A man, a plan, a canal: Panama"))
`,
      solution: String.raw`def is_palindrome(text):
    cleaned = "".join(ch.lower() for ch in text if ch.isalnum())
    return cleaned == cleaned[::-1]


print(is_palindrome("A man, a plan, a canal: Panama"))
`,
      hints: [
        'Build a cleaned version first: keep `ch.lower()` for each `ch` where `ch.isalnum()` is true.',
        'Then compare the cleaned text with `cleaned[::-1]`. (The two-pointer way, an index from each end moving inwards, uses no extra string: try it too.)'
      ],
      checks: [
        { label: 'The Panama sentence is a palindrome', code: String.raw`assert is_palindrome("A man, a plan, a canal: Panama") is True` },
        { label: '`"race a car"` is not', code: String.raw`assert is_palindrome("race a car") is False` },
        { label: 'Case does not matter: `"Abba"`', code: String.raw`assert is_palindrome("Abba") is True` },
        { label: 'Digits count: `"12321"` is one, `"0P"` is not', code: String.raw`assert is_palindrome("12321") is True
assert is_palindrome("0P") is False` },
        { label: 'An empty text, or only punctuation, is a palindrome', code: String.raw`assert is_palindrome("") is True and is_palindrome(".,!") is True` }
      ]
    },
    {
      id: 'two-sum', level: 'Easy', title: 'Two sum',
      summary: 'Find the two positions whose numbers add up to a target, in one pass with a dict.',
      patterns: ['hashing'], keywords: ['dict', 'hashmap', 'complement', 'interview'],
      learn: ['lesson:py-dicts-sets', 'ref:fn-enumerate'],
      java: 'The usual Java answer keeps a `HashMap<Integer, Integer>` from value to index. In Python that is a plain dict, `enumerate` gives the index and the value together, and `need in seen` replaces `containsKey`.',
      task: 'Write `two_sum(nums, target)`, which returns `[i, j]` with `i < j` and `nums[i] + nums[j] == target`. Exactly one such pair exists. `two_sum([2, 7, 11, 15], 9)` is `[0, 1]`.\n\nThe starter tries every pair, which is slow for long lists (n² steps). Do it in **one pass**: remember the numbers seen so far in a dict, from value to position.',
      starter: String.raw`def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]


print(two_sum([2, 7, 11, 15], 9))
`,
      solution: String.raw`def two_sum(nums, target):
    seen = {}                        # value -> its position
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            return [seen[need], i]
        seen[n] = i


print(two_sum([2, 7, 11, 15], 9))
`,
      hints: [
        'For each number `n`, the number it needs is `target - n`. Has it been seen already, earlier in the list?',
        '`seen = {}` maps a value to its position. Check `need in seen` **before** adding `n`, so a number is never paired with itself.'
      ],
      checks: [
        { label: '`two_sum([2, 7, 11, 15], 9)` is `[0, 1]`', code: String.raw`assert two_sum([2, 7, 11, 15], 9) == [0, 1]` },
        { label: 'A number is not used twice: `two_sum([3, 2, 4], 6)` is `[1, 2]`', code: String.raw`assert two_sum([3, 2, 4], 6) == [1, 2]` },
        { label: 'The same value at two positions: `two_sum([3, 3], 6)` is `[0, 1]`', code: String.raw`assert two_sum([3, 3], 6) == [0, 1]` },
        { label: 'Negative numbers', code: String.raw`assert two_sum([-4, 10, 7, -3], 4) == [2, 3]` },
        { label: 'It makes one pass (no loop inside a loop)', code: String.raw`loops = [n for n in ast.walk(tree) if isinstance(n, (ast.For, ast.While))]
nested = any(isinstance(m, (ast.For, ast.While)) and m is not n for n in loops for m in ast.walk(n))
assert not nested, "a loop inside a loop tries every pair: keep the numbers seen so far in a dict instead"` }
      ]
    },
    {
      id: 'anagrams', level: 'Easy', title: 'Anagrams',
      summary: '"listen" and "silent" use the same letters the same number of times: compare their Counters.',
      patterns: ['counting'], keywords: ['anagram', 'counter', 'letters'],
      learn: ['lesson:py-collections', 'ref:mod-collections'],
      java: 'Java counts into an `int[26]` or a `Map<Character, Integer>` with `merge`. `collections.Counter` does the counting in one call, and two Counters compare with `==`.',
      task: 'Write `is_anagram(a, b)`: `True` when `a` and `b` contain the same letters the same number of times, ignoring case and spaces. `"Dormitory"` and `"dirty room"` are anagrams; `"rat"` and `"car"` are not; `"aab"` and `"abb"` are not either (same letters, different counts).',
      starter: String.raw`def is_anagram(a, b):
    return set(a) == set(b)


print(is_anagram("Dormitory", "dirty room"))
`,
      solution: String.raw`from collections import Counter


def is_anagram(a, b):
    def letters(text):
        return Counter(text.lower().replace(" ", ""))
    return letters(a) == letters(b)


print(is_anagram("Dormitory", "dirty room"))
`,
      hints: [
        'A set forgets how many times a letter appears, so `"aab"` and `"abb"` look the same. `Counter("aab")` is `Counter({"a": 2, "b": 1})`.',
        'Clean both texts the same way first: `.lower()` and `.replace(" ", "")`.'
      ],
      checks: [
        { label: '`"listen"` and `"silent"`', code: String.raw`assert is_anagram("listen", "silent") is True` },
        { label: 'Case and spaces are ignored: `"Dormitory"`, `"dirty room"`', code: String.raw`assert is_anagram("Dormitory", "dirty room") is True` },
        { label: 'Different letters: `"rat"`, `"car"`', code: String.raw`assert is_anagram("rat", "car") is False` },
        { label: 'Same letters, different counts: `"aab"`, `"abb"`', code: String.raw`assert is_anagram("aab", "abb") is False` },
        { label: 'It uses `collections.Counter`', code: String.raw`assert calls("Counter"), "count the letters with collections.Counter"` }
      ]
    },
    {
      id: 'first-unique', level: 'Easy', title: 'First unique character',
      summary: 'The position of the first character that appears only once: count everything, then look again.',
      patterns: ['counting', 'strings'], keywords: ['unique', 'counter', 'index'],
      learn: ['lesson:py-collections', 'ref:fn-enumerate'],
      java: 'Two passes in Java too: count into a `HashMap` (or an `int[26]`), then scan the string again. `Counter` is the first pass; `enumerate` gives positions in the second.',
      task: 'Write `first_unique(text)`, which returns the **index** of the first character that appears exactly once in `text`, or `-1` when there is none. `first_unique("leetcode")` is `0` (`l`), `first_unique("loveleetcode")` is `2` (`v`), and `first_unique("aabb")` is `-1`.',
      starter: String.raw`def first_unique(text):
    for i, ch in enumerate(text):
        if ch not in text[:i]:
            return i
    return -1


print(first_unique("loveleetcode"))
`,
      solution: String.raw`from collections import Counter


def first_unique(text):
    counts = Counter(text)
    for i, ch in enumerate(text):
        if counts[ch] == 1:
            return i
    return -1


print(first_unique("loveleetcode"))
`,
      hints: [
        'The starter finds the first character not seen **before** it, but a unique one must not appear **after** it either.',
        'Count every character first with `Counter(text)`, then walk `enumerate(text)` and return the first index whose count is 1.'
      ],
      checks: [
        { label: '`first_unique("leetcode")` is 0', code: String.raw`assert first_unique("leetcode") == 0` },
        { label: '`first_unique("loveleetcode")` is 2', code: String.raw`assert first_unique("loveleetcode") == 2` },
        { label: 'None unique: `first_unique("aabb")` is -1', code: String.raw`assert first_unique("aabb") == -1` },
        { label: 'An empty text gives -1; `"z"` gives 0', code: String.raw`assert first_unique("") == -1 and first_unique("z") == 0` }
      ]
    },
    {
      id: 'max-profit', level: 'Easy', title: 'Best time to buy and sell',
      summary: 'The biggest profit from one buy and a later sell, in one pass, keeping the lowest price so far.',
      patterns: ['one-pass'], keywords: ['stock', 'minimum', 'profit', 'interview'],
      learn: ['lesson:py-loops', 'ref:fn-min', 'ref:fn-max'],
      java: 'Identical logic to Java: a running minimum and a running best, updated with `Math.min` and `Math.max`. Python\'s `min` and `max` are built in, and `float("inf")` stands in for `Integer.MAX_VALUE`.',
      task: 'Write `max_profit(prices)`. `prices[i]` is a share\'s price on day `i`. Buy on one day and sell on a **later** day: return the biggest profit, or `0` when no sale makes money. `max_profit([7, 1, 5, 3, 6, 4])` is `5` (buy at 1, sell at 6).',
      starter: String.raw`def max_profit(prices):
    return max(prices) - min(prices)


print(max_profit([7, 1, 5, 3, 6, 4]))
`,
      solution: String.raw`def max_profit(prices):
    lowest = float("inf")
    best = 0
    for price in prices:
        lowest = min(lowest, price)
        best = max(best, price - lowest)
    return best


print(max_profit([7, 1, 5, 3, 6, 4]))
`,
      hints: [
        '`max(prices) - min(prices)` is wrong when the highest price comes **before** the lowest one: you cannot sell before you buy.',
        'Walk the prices once. Keep the lowest price so far; selling today earns `price - lowest`. Keep the best of those.'
      ],
      checks: [
        { label: '`[7, 1, 5, 3, 6, 4]` gives 5', code: String.raw`assert max_profit([7, 1, 5, 3, 6, 4]) == 5` },
        { label: 'Prices only fall: 0', code: String.raw`assert max_profit([7, 6, 4, 3, 1]) == 0` },
        { label: 'The highest price comes first: `[9, 1, 2]` gives 1', code: String.raw`assert max_profit([9, 1, 2]) == 1` },
        { label: 'No prices, or one, give 0', code: String.raw`assert max_profit([]) == 0 and max_profit([5]) == 0` }
      ]
    },
    {
      id: 'valid-parentheses', level: 'Easy', title: 'Valid parentheses',
      summary: 'Do the (, [ and { brackets close in the right order? A list used as a stack answers it.',
      patterns: ['stack'], keywords: ['brackets', 'stack', 'balanced', 'interview'],
      learn: ['lesson:py-lists', 'lesson:py-dicts-sets'],
      java: 'Java uses a `Deque<Character>` with `push` and `pop` (`Stack` is legacy). A Python list is the stack: `append` pushes, `pop()` takes the last item, and `stack[-1]` peeks.',
      task: 'Write `is_valid(text)`: `True` when every bracket in `text` (`()`, `[]`, `{}`) is closed by the same kind, in the right order. Other characters are ignored. `"([]{})"` and `"f(x[0])"` are valid; `"(]"`, `"([)]"`, `"(("` and `")"` are not.',
      starter: String.raw`def is_valid(text):
    return text.count("(") == text.count(")") and text.count("[") == text.count("]") and text.count("{") == text.count("}")


print(is_valid("([)]"))
`,
      solution: String.raw`PAIRS = {")": "(", "]": "[", "}": "{"}


def is_valid(text):
    stack = []
    for ch in text:
        if ch in "([{":
            stack.append(ch)
        elif ch in PAIRS:
            if not stack or stack.pop() != PAIRS[ch]:
                return False
    return not stack


print(is_valid("([)]"))
`,
      hints: [
        'Counting cannot see the order: `"([)]"` has matching counts but closes `[` with `)`.',
        'Push each opening bracket onto a list. A closing one must match the **last** opening one: `stack.pop()`. A dict `{")": "(", ...}` says which one matches.',
        'At the end, the stack must be empty (`"(("` leaves two). A closing bracket with an empty stack is wrong too (`")"`).'
      ],
      checks: [
        { label: '`"([]{})"` and `"f(x[0])"` are valid', code: String.raw`assert is_valid("([]{})") is True and is_valid("f(x[0])") is True` },
        { label: 'The wrong kind: `"(]"`', code: String.raw`assert is_valid("(]") is False` },
        { label: 'The wrong order: `"([)]"`', code: String.raw`assert is_valid("([)]") is False` },
        { label: 'Left open: `"(("`; closed too soon: `")("`', code: String.raw`assert is_valid("((") is False and is_valid(")(") is False` },
        { label: 'No brackets at all is valid', code: String.raw`assert is_valid("") is True and is_valid("abc") is True` }
      ]
    },
    {
      id: 'merge-sorted', level: 'Easy', title: 'Merge two sorted lists',
      summary: 'The merge step of merge sort: walk both lists with a pointer each, always taking the smaller head.',
      patterns: ['two-pointers'], keywords: ['merge', 'sorted', 'merge sort'],
      learn: ['lesson:py-lists', 'lesson:py-loops'],
      java: 'The same two indexes as in Java. Python\'s `result.extend(a[i:])` copies whatever is left of one list in one line.',
      task: 'Write `merge(a, b)`, which takes two lists already sorted in ascending order and returns one sorted list with every item of both. Do it in one walk with two positions, `i` in `a` and `j` in `b`: no `sorted()` and no `.sort()`. `merge([1, 4, 9], [2, 3, 10, 11])` is `[1, 2, 3, 4, 9, 10, 11]`.',
      starter: String.raw`def merge(a, b):
    return a + b


print(merge([1, 4, 9], [2, 3, 10, 11]))
`,
      solution: String.raw`def merge(a, b):
    result = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            result.append(a[i])
            i += 1
        else:
            result.append(b[j])
            j += 1
    result.extend(a[i:])
    result.extend(b[j:])
    return result


print(merge([1, 4, 9], [2, 3, 10, 11]))
`,
      hints: [
        'While both lists have items left, compare `a[i]` with `b[j]`, append the smaller one and move that position on.',
        'When one list runs out, everything left in the other is already in order: `result.extend(a[i:])` and `result.extend(b[j:])`.'
      ],
      checks: [
        { label: 'The example merges in order', code: String.raw`assert merge([1, 4, 9], [2, 3, 10, 11]) == [1, 2, 3, 4, 9, 10, 11]` },
        { label: 'Repeated values are all kept', code: String.raw`assert merge([1, 2, 2], [2, 3]) == [1, 2, 2, 2, 3]` },
        { label: 'One list empty', code: String.raw`assert merge([], [1, 2]) == [1, 2] and merge([5], []) == [5]` },
        { label: 'The input lists are not changed', code: String.raw`a, b = [1, 3], [2]
merge(a, b)
assert a == [1, 3] and b == [2]` },
        { label: 'No `sorted()` or `.sort()`', code: String.raw`assert not calls("sorted") and not calls("sort"), "merge by walking both lists; sorting again would be n log n instead of n"` }
      ]
    },
    {
      id: 'missing-number', level: 'Easy', title: 'The missing number',
      summary: 'The numbers 0 to n with one left out: the expected sum minus the real sum names it.',
      patterns: ['math', 'one-pass'], keywords: ['sum', 'gauss', 'missing'],
      learn: ['lesson:py-numbers', 'ref:fn-sum'],
      java: 'Same arithmetic as Java, without the overflow worry: a Python `int` never overflows, so `n * (n + 1) // 2` is safe for any n.',
      task: 'Write `missing_number(nums)`. `nums` holds every whole number from 0 to `n` except one, in any order (so it has `n` items). Return the missing one. `missing_number([3, 0, 1])` is `2`; `missing_number([0, 1])` is `2`; `missing_number([1])` is `0`.',
      starter: String.raw`def missing_number(nums):
    for i in range(len(nums)):
        if i not in nums:
            return i


print(missing_number([3, 0, 1]))
`,
      solution: String.raw`def missing_number(nums):
    n = len(nums)
    return n * (n + 1) // 2 - sum(nums)


print(missing_number([3, 0, 1]))
`,
      hints: [
        'The starter never returns the biggest number, n itself: `range(len(nums))` stops before it. It is also slow, since `in` on a list searches the whole list.',
        '0 + 1 + ... + n is `n * (n + 1) // 2`. Subtract `sum(nums)`: what is left is the missing number.'
      ],
      checks: [
        { label: '`[3, 0, 1]` is missing 2', code: String.raw`assert missing_number([3, 0, 1]) == 2` },
        { label: 'The missing one is the biggest: `[0, 1]` is missing 2', code: String.raw`assert missing_number([0, 1]) == 2` },
        { label: 'The missing one is 0: `[1]`', code: String.raw`assert missing_number([1]) == 0` },
        { label: 'A long shuffled list', code: String.raw`import random
nums = list(range(10001))
nums.remove(4321)
random.Random(7).shuffle(nums)
assert missing_number(nums) == 4321` }
      ]
    },
    {
      id: 'top-words', level: 'Easy', title: 'The most common words',
      summary: 'Count words with Counter, then sort by count, highest first, and alphabetically on a tie.',
      patterns: ['counting', 'sorting'], keywords: ['word count', 'counter', 'most_common', 'sorted key', 'tie'],
      learn: ['lesson:py-collections', 'lesson:py-zip-enumerate-sorted', 'lesson:py-text'],
      java: 'Java: `Collectors.groupingBy(w -> w, counting())`, then a `Comparator` on the count reversed, `thenComparing` the word. In Python, `Counter` counts, and one sort key `(-count, word)` gives both orders at once.',
      task: 'Write `top_words(text, n)`, which returns the `n` most common words as `(word, count)` tuples, most common first. Words are compared in lower case, and only letters count (`re.findall(r"[a-z]+", text.lower())`). **Ties go alphabetically**, so the answer is always the same. `top_words("b a c b a b", 2)` is `[("b", 3), ("a", 2)]`.',
      starter: String.raw`import re
from collections import Counter


def top_words(text, n):
    words = re.findall(r"[a-z]+", text.lower())
    return Counter(words).most_common(n)


print(top_words("the cat and the hat and the bat", 3))
`,
      solution: String.raw`import re
from collections import Counter


def top_words(text, n):
    counts = Counter(re.findall(r"[a-z]+", text.lower()))
    return sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:n]


print(top_words("the cat and the hat and the bat", 3))
`,
      hints: [
        '`most_common` keeps tied words in the order they first appeared, not alphabetical order: `"bat"` before `"at"` stays that way.',
        'Sort `counts.items()` yourself, with `key=lambda item: (-item[1], item[0])`: the minus puts higher counts first, and the word breaks ties. Then take `[:n]`.'
      ],
      checks: [
        { label: '`top_words("b a c b a b", 2)`', code: String.raw`assert top_words("b a c b a b", 2) == [("b", 3), ("a", 2)]` },
        { label: 'Ties go alphabetically', code: String.raw`assert top_words("pear fig apple fig apple pear kiwi", 3) == [("apple", 2), ("fig", 2), ("pear", 2)]` },
        { label: 'Case and punctuation are ignored', code: String.raw`assert top_words("The cat. THE dog, the end!", 1) == [("the", 3)]` },
        { label: 'Asking for more words than there are returns them all', code: String.raw`assert top_words("one two", 5) == [("one", 1), ("two", 1)]` }
      ]
    },
    {
      id: 'chunks', level: 'Easy', title: 'Split a list into chunks',
      summary: 'Pages of a list: slices of a fixed size, the last one possibly shorter.',
      patterns: ['slicing'], keywords: ['batch', 'chunk', 'page', 'range step', 'batched'],
      learn: ['lesson:py-slicing', 'lesson:py-comprehensions', 'lesson:py-itertools'],
      java: 'Java loops with `subList(i, Math.min(i + size, n))`. A Python slice never goes past the end, so `items[i:i + size]` needs no `min`, and `range(0, n, size)` steps by the chunk size.',
      task: 'Write `chunks(items, size)`, which returns a list of lists, each holding `size` items in order, the last one possibly shorter. `chunks([1, 2, 3, 4, 5], 2)` is `[[1, 2], [3, 4], [5]]`. A `size` below 1 raises `ValueError`.',
      starter: String.raw`def chunks(items, size):
    result = []
    for i in range(len(items) // size):
        result.append(items[i * size:(i + 1) * size])
    return result


print(chunks([1, 2, 3, 4, 5], 2))
`,
      solution: String.raw`def chunks(items, size):
    if size < 1:
        raise ValueError("size must be at least 1")
    return [items[i:i + size] for i in range(0, len(items), size)]


print(chunks([1, 2, 3, 4, 5], 2))
`,
      hints: [
        '`len(items) // size` rounds down, so the short last chunk is lost.',
        '`range(0, len(items), size)` gives each chunk\'s start: 0, 2, 4. A slice past the end just stops, so `items[4:6]` is `[5]`.',
        'Check `size < 1` first and `raise ValueError(...)`: `range` with a step of 0 would raise a confusing error of its own.'
      ],
      checks: [
        { label: '`chunks([1, 2, 3, 4, 5], 2)` keeps the short last chunk', code: String.raw`assert chunks([1, 2, 3, 4, 5], 2) == [[1, 2], [3, 4], [5]]` },
        { label: 'An exact fit', code: String.raw`assert chunks(list("abcdef"), 3) == [["a", "b", "c"], ["d", "e", "f"]]` },
        { label: 'A size bigger than the list, and an empty list', code: String.raw`assert chunks([1, 2], 10) == [[1, 2]] and chunks([], 3) == []` },
        { label: 'A size of 0 raises `ValueError`', code: String.raw`try:
    chunks([1], 0)
except ValueError:
    pass
else:
    raise AssertionError("chunks([1], 0) should raise ValueError")` }
      ]
    },
    {
      id: 'roman-to-int', level: 'Easy', title: 'Roman numerals to numbers',
      summary: 'XIV is 14: a smaller numeral before a bigger one is subtracted. A dict holds the values.',
      patterns: ['hashing', 'parsing'], keywords: ['roman', 'numerals', 'convert'],
      learn: ['lesson:py-dicts-sets', 'lesson:py-zip-enumerate-sorted'],
      java: 'Java would use a `Map<Character, Integer>` or a `switch`. The Python dict literal `{"I": 1, ...}` is the table, and `zip(text, text[1:])` walks each numeral with the one after it.',
      task: 'Write `roman_to_int(text)` for numerals made of I (1), V (5), X (10), L (50), C (100), D (500) and M (1000). Values add up (`"VIII"` is 8), except that a numeral **smaller than the one after it** is subtracted: `"IV"` is 4, `"XC"` is 90, `"MCMXCIV"` is 1994. Lower-case letters work too.',
      starter: String.raw`VALUES = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(text):
    return sum(VALUES[ch] for ch in text)


print(roman_to_int("MCMXCIV"))
`,
      solution: String.raw`VALUES = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(text):
    values = [VALUES[ch] for ch in text.upper()]
    total = 0
    for i, value in enumerate(values):
        if i + 1 < len(values) and value < values[i + 1]:
            total -= value
        else:
            total += value
    return total


print(roman_to_int("MCMXCIV"))
`,
      hints: [
        'Turn the text into a list of values first: `[VALUES[ch] for ch in text.upper()]`.',
        'Walk it with `enumerate`. If the next value is bigger, this one is subtracted; otherwise it is added.'
      ],
      checks: [
        { label: '`"III"` is 3 and `"VIII"` is 8', code: String.raw`assert roman_to_int("III") == 3 and roman_to_int("VIII") == 8` },
        { label: 'Subtraction: `"IV"` is 4, `"IX"` is 9, `"XC"` is 90', code: String.raw`assert [roman_to_int(t) for t in ("IV", "IX", "XC")] == [4, 9, 90]` },
        { label: '`"MCMXCIV"` is 1994', code: String.raw`assert roman_to_int("MCMXCIV") == 1994` },
        { label: 'Lower case works: `"xiv"` is 14', code: String.raw`assert roman_to_int("xiv") == 14` }
      ]
    },
    {
      id: 'dedupe', level: 'Easy', title: 'Remove duplicates, keep the order',
      summary: 'Drop repeated items but keep the first of each where it was: a set remembers what was seen.',
      patterns: ['hashing'], keywords: ['unique', 'distinct', 'set', 'order', 'dict.fromkeys'],
      learn: ['lesson:py-dicts-sets'],
      java: 'Java\'s answer is a `LinkedHashSet`, or `stream().distinct()`. Python\'s `set` has no order, but a dict keeps insertion order: `list(dict.fromkeys(items))` is the one-line version. A loop with a `seen` set is the version that also works with a key.',
      task: 'Write `dedupe(items, key=None)`, which returns a new list with only the first of each repeated item, in their original order. With a `key` function, two items count as the same when their keys are equal: `dedupe(["Ann", "bob", "ann", "Bob"], key=str.lower)` is `["Ann", "bob"]`.',
      starter: String.raw`def dedupe(items, key=None):
    return list(set(items))


print(dedupe([3, 1, 3, 2, 1]))
`,
      solution: String.raw`def dedupe(items, key=None):
    seen = set()
    result = []
    for item in items:
        k = key(item) if key else item
        if k not in seen:
            seen.add(k)
            result.append(item)
    return result


print(dedupe([3, 1, 3, 2, 1]))
`,
      hints: [
        '`list(set(items))` loses the order (and ignores `key`).',
        'Walk the items with a `seen = set()`. Work out `k = key(item) if key else item`; if `k` is new, add it to `seen` and append the item.'
      ],
      checks: [
        { label: 'The first of each, in order', code: String.raw`assert dedupe([3, 1, 3, 2, 1]) == [3, 1, 2]` },
        { label: 'Strings too', code: String.raw`assert dedupe(list("mississippi")) == ["m", "i", "s", "p"]` },
        { label: 'With `key=str.lower`', code: String.raw`assert dedupe(["Ann", "bob", "ann", "Bob"], key=str.lower) == ["Ann", "bob"]` },
        { label: 'The input list is not changed', code: String.raw`a = [1, 1]
dedupe(a)
assert a == [1, 1]` }
      ]
    }
  );
})(window.PYLT);
