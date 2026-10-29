/*
 * Playground templates: starting points in the Playground's "Templates…" menu.
 * Template shape: {id, title, code, stdin?}. tests/test_content.py runs every one of them.
 */
(function (U) {
  U.data.templates = [
    {
      id: 'hello', title: 'Hello, input',
      code: String.raw`name = input("What is your name? ")
print(f"Hello, {name}!")
print(f"Your name has {len(name)} letters.")
`,
      stdin: 'Ravi\n'
    },
    {
      id: 'fizzbuzz', title: 'FizzBuzz',
      code: String.raw`for i in range(1, 21):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)
`
    },
    {
      id: 'word-count', title: 'Count words',
      code: String.raw`text = """Python is easy to read. Python is easy to write.
Readability counts."""

counts = {}
for word in text.lower().replace(".", "").split():
    counts[word] = counts.get(word, 0) + 1

for word, n in sorted(counts.items(), key=lambda pair: -pair[1]):
    print(f"{word:<12}{n}")
`
    },
    {
      id: 'guess', title: 'Guess the number',
      code: String.raw`import random

random.seed(7)                 # the same "random" number every run, so the input below works
secret = random.randint(1, 20)
for attempt in range(1, 6):
    guess = int(input(f"Guess {attempt}: "))
    if guess == secret:
        print("Got it!")
        break
    print("Too low" if guess < secret else "Too high")
else:
    print(f"Out of guesses: it was {secret}")
`,
      stdin: '10\n15\n13\n12\n11\n'
    },
    {
      id: 'functions', title: 'Functions and errors',
      code: String.raw`def average(numbers):
    """The mean of a list of numbers; raises ValueError for an empty list."""
    if not numbers:
        raise ValueError("average of an empty list")
    return sum(numbers) / len(numbers)


for data in ([4, 8, 15, 16, 23, 42], []):
    try:
        print(f"average of {data} = {average(data):.2f}")
    except ValueError as e:
        print("error:", e)
`
    }
  ];
})(window.PYLT);
