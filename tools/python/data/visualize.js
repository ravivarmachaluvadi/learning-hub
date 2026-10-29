/*
 * Visualize examples: the programs in the Visualize page's "Examples…" menu. Lessons link to one with
 * [[viz:aliasing]], which opens #/visualize?example=aliasing, already stepped through.
 *
 * Example shape: {id, title, summary, code, stdin?}. tests/test_content.py traces every one on your
 * Python and requires a clean run of 3 to 300 steps; tests/check_data.py checks that it compiles.
 */
(function (U) {
  U.data.vizExamples = [
    {
      id: 'aliasing', title: 'Two names, one list',
      summary: 'b = a copies nothing: both names point at one list. a[:] makes a real copy.',
      code: String.raw`a = [1, 2]
b = a              # no copy: b is a second name for the same list
b.append(3)
print(a)           # [1, 2, 3]: a sees the change

c = a[:]           # a copy: a new list holding the same items
c.append(4)
print(a, c)
`
    },
    {
      id: 'plus-equals', title: 'a = a + [3] versus a += [3]',
      summary: 'The first builds a new list and moves the name; the second changes the list in place.',
      code: String.raw`a = [1, 2]
b = a
a = a + [3]        # builds a new list: b keeps the old one
print(a, b)

a = [1, 2]
b = a
a += [3]           # changes the list itself: b sees it
print(a, b)
`
    },
    {
      id: 'call', title: 'A function call',
      summary: 'Each call gets a frame of its own for its parameters and locals; return hands a value back.',
      code: String.raw`def area(width, height):
    result = width * height
    return result

w = 3
total = area(w, 4)
print(total)
`
    },
    {
      id: 'recursion', title: 'Recursion: factorial',
      summary: 'One frame per call, stacked, until the base case; then the returns unwind the stack.',
      code: String.raw`def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(4))
`
    },
    {
      id: 'closure', title: 'A closure: make_counter',
      summary: 'The inner function keeps the count variable alive after make_counter has returned.',
      code: String.raw`def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

counter = make_counter()
counter()
counter()
print(counter())
`
    },
    {
      id: 'generator', title: 'A generator, paused and resumed',
      summary: 'Each yield pauses the function with its local variables kept; the for loop resumes it.',
      code: String.raw`def countdown(n):
    while n > 0:
        yield n
        n -= 1

for x in countdown(3):
    print(x)
`
    },
    {
      id: 'objects', title: 'A class and its objects',
      summary: 'Each object has its own attributes; methods live once, on the class.',
      code: String.raw`class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

a = Account("Asha")
b = Account("Ravi", 50)
a.deposit(20)
print(a.balance, b.balance)
`
    },
    {
      id: 'mutable-default', title: 'The mutable default trap',
      summary: 'The default list is made once, when def runs, and every call shares it.',
      code: String.raw`def add(item, items=[]):
    items.append(item)
    return items

print(add("a"))
print(add("b"))    # ['a', 'b']: the same list as last time
`
    },
    {
      id: 'counting', title: 'Counting words in a dict',
      summary: 'A loop filling a dict: watch each key appear and its count grow.',
      code: String.raw`words = "the cat and the hat".split()
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1
print(counts)
`
    }
  ];
})(window.PYLT);
