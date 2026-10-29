/*
 * The Reference, part 4: the 25 standard-library modules you will import most. The entry shape is
 * described at the top of data/reference-builtins.js; `members` lists the names autocomplete offers
 * after "module." (js/assist.js). Examples work in a fresh folder and print nothing that depends on
 * the computer (no paths, dates of today or process ids), so the stored output always matches.
 */
(function (U) {
  var R = U.data.reference = U.data.reference || [];
  function nl(s) { return /\n$/.test(s) ? s : s + '\n'; }
  function add(rows) {
    rows.forEach(function (r) {
      var e = { id: 'mod-' + r.name, group: 'modules', name: r.name, title: r.name, sig: r.sig || 'import ' + r.name,
        summary: r.summary, java: r.java, example: nl(r.example), output: nl(r.output), members: r.members,
        docs: 'https://docs.python.org/3/library/' + r.name + '.html' };
      if (r.runtimes) e.runtimes = r.runtimes;
      R.push(e);
    });
  }

  add([
    { name: 'os', summary: 'The operating system: folders, files, environment variables. `os.path` joins and splits paths (`pathlib` is the modern way).',
      java: '`java.io.File`, `java.nio.file.Files`, `System.getenv`',
      members: ['getcwd', 'listdir', 'makedirs', 'mkdir', 'remove', 'rename', 'environ', 'getenv', 'path', 'walk', 'sep', 'cpu_count', 'scandir'],
      example: String.raw`import os

os.makedirs("data/raw", exist_ok=True)
for name in ["b.txt", "a.txt"]:
    with open(os.path.join("data", "raw", name), "w", encoding="utf-8") as f:
        f.write(name)
print(sorted(os.listdir(os.path.join("data", "raw"))))
print(os.path.exists("data"), os.path.splitext("report.csv"))
print(os.environ.get("NO_SUCH_SETTING", "default"))`,
      output: String.raw`['a.txt', 'b.txt']
True ('report', '.csv')
default` },
    { name: 'sys', summary: 'The running interpreter: the command-line arguments, the standard streams, `exit`, the module search path and the version.',
      java: '`System.out`, `System.err`, `System.exit`, the `args` of `main`',
      members: ['argv', 'exit', 'path', 'version', 'version_info', 'platform', 'stdin', 'stdout', 'stderr', 'modules', 'getrecursionlimit', 'setrecursionlimit', 'executable', 'getsizeof'],
      example: String.raw`import sys

print(sys.version_info >= (3, 10))
print(type(sys.argv).__name__, len(sys.path) > 0)
sys.stdout.write("written to standard output\n")
print("an error message", file=sys.stderr)`,
      output: String.raw`True
list True
written to standard output
an error message` },
    { name: 'pathlib', summary: 'Paths as objects: join them with `/`, read and write whole files in one call, list folders with `glob`.',
      java: '`java.nio.file.Path` and `Files.writeString` / `readString`',
      members: ['Path', 'PurePath', 'PurePosixPath', 'PureWindowsPath'],
      example: String.raw`from pathlib import Path

folder = Path("reports")
folder.mkdir(exist_ok=True)
report = folder / "summary.txt"
report.write_text("total: 42\n", encoding="utf-8")
print(report.name, report.stem, report.suffix)
print(report.read_text(encoding="utf-8").strip())
print([p.name for p in folder.glob("*.txt")])`,
      output: String.raw`summary.txt summary .txt
total: 42
['summary.txt']` },
    { name: 're', summary: 'Regular expressions: `search` finds the first match anywhere, `findall` every match, `sub` replaces. Write patterns as raw strings, `r"\\d+"`.',
      java: '`java.util.regex.Pattern` and `Matcher`',
      members: ['search', 'match', 'fullmatch', 'findall', 'finditer', 'sub', 'split', 'compile', 'escape', 'IGNORECASE', 'MULTILINE'],
      example: String.raw`import re

text = "Call 555-1234 or 555-9876 before 6pm"
print(re.findall(r"\d{3}-\d{4}", text))
m = re.search(r"(\d+)(am|pm)", text)
print(m.group(0), m.group(1), m.group(2))
print(re.sub(r"\d", "#", "pin 4321"))
print(bool(re.fullmatch(r"[a-z]+@[a-z]+\.com", "asha@mail.com")))`,
      output: String.raw`['555-1234', '555-9876']
6pm 6 pm
pin ####
True` },
    { name: 'json', summary: 'JSON text to and from dicts, lists, strings, numbers, `True`/`False` (`true`/`false`) and `None` (`null`).',
      java: 'Jackson\'s `ObjectMapper`, or Gson',
      members: ['dumps', 'loads', 'dump', 'load', 'JSONDecodeError'],
      example: String.raw`import json

order = {"id": 7, "items": ["pen", "ink"], "paid": True, "note": None}
text = json.dumps(order)
print(text)
back = json.loads(text)
print(back["items"][1], back == order)
print(json.dumps({"b": 1, "a": 2}, indent=2, sort_keys=True))`,
      output: String.raw`{"id": 7, "items": ["pen", "ink"], "paid": true, "note": null}
ink True
{
  "a": 2,
  "b": 1
}` },
    { name: 'csv', summary: 'Reads and writes CSV files with quoting done right. `DictReader` gives each row as a dict keyed by the header. Open the file with `newline=""`.',
      java: 'OpenCSV or Apache Commons CSV',
      members: ['reader', 'writer', 'DictReader', 'DictWriter', 'QUOTE_MINIMAL', 'QUOTE_ALL'],
      example: String.raw`import csv

with open("people.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "city"])
    writer.writerow(["Asha", "Pune, MH"])

with open("people.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        print(row["name"], "|", row["city"])
with open("people.csv", encoding="utf-8") as f:
    print(f.read().splitlines()[1])`,
      output: String.raw`Asha | Pune, MH
Asha,"Pune, MH"` },
    { name: 'datetime', summary: 'Dates, times, and the time between them (`timedelta`). `fromisoformat` and `isoformat` read and write the standard text form.',
      java: '`java.time`: `LocalDate`, `LocalDateTime`, `Duration`',
      members: ['date', 'datetime', 'timedelta', 'timezone', 'time'],
      example: String.raw`from datetime import date, datetime, timedelta

start = date(2026, 10, 10)
print(start + timedelta(days=30), start.strftime("%d %b %Y"), start.weekday())
meeting = datetime.fromisoformat("2026-10-10T14:30")
print(meeting.hour, (meeting + timedelta(hours=2)).isoformat())
print((date(2026, 12, 25) - start).days)`,
      output: String.raw`2026-11-09 10 Oct 2026 5
14 2026-10-10T16:30:00
76` },
    { name: 'time', summary: 'Clocks and sleeping: `perf_counter()` for measuring how long something takes, `time()` for the current moment in seconds, `sleep()` to wait.',
      java: '`System.nanoTime()`, `System.currentTimeMillis()`, `Thread.sleep`',
      members: ['time', 'sleep', 'perf_counter', 'monotonic', 'strftime', 'gmtime', 'localtime', 'time_ns'],
      example: String.raw`import time

start = time.perf_counter()
time.sleep(0.01)
elapsed = time.perf_counter() - start
print(elapsed > 0)
print(time.strftime("%Y-%m-%d", time.gmtime(0)))
print(type(time.time()).__name__)`,
      output: String.raw`True
1970-01-01
float` },
    { name: 'math', summary: 'Maths functions and constants for floats: roots, rounding down and up, logarithms, trigonometry, `isclose` for comparing floats.',
      java: '`java.lang.Math`',
      members: ['sqrt', 'pi', 'e', 'inf', 'nan', 'ceil', 'floor', 'trunc', 'isclose', 'gcd', 'lcm', 'log', 'log10', 'log2', 'exp', 'sin', 'cos', 'tan', 'factorial', 'comb', 'perm', 'hypot', 'fsum', 'prod', 'isqrt'],
      example: String.raw`import math

print(math.sqrt(2), math.pi)
print(math.floor(-2.5), math.ceil(2.1), math.trunc(-2.5))
print(math.isclose(0.1 + 0.2, 0.3), math.gcd(12, 18), math.factorial(5))
print(math.hypot(3, 4), math.log10(1000), math.comb(5, 2))`,
      output: String.raw`1.4142135623730951 3.141592653589793
-3 3 -2
True 6 120
5.0 3.0 10` },
    { name: 'random', summary: 'Pseudo-random numbers, choices and shuffles. `seed()` makes them repeat (for tests); `secrets` is the module for passwords and tokens.',
      java: '`java.util.Random`, `ThreadLocalRandom`',
      members: ['random', 'randint', 'randrange', 'choice', 'choices', 'shuffle', 'sample', 'seed', 'uniform', 'gauss'],
      example: String.raw`import random

random.seed(42)                  # the same "random" numbers every run
print(random.randint(1, 6), random.randint(1, 6))
print(random.choice(["red", "green", "blue"]))
deck = list(range(5))
random.shuffle(deck)
print(deck, random.sample(range(100), 3))`,
      output: String.raw`6 1
red
[3, 4, 0, 1, 2] [94, 13, 86]` },
    { name: 'collections', summary: 'Extra containers: `Counter` counts, `defaultdict` groups, `deque` is a fast double-ended queue, `namedtuple` a light record. Lesson: [[lesson:py-collections]].',
      java: '`HashMap.merge` for counting, `ArrayDeque`, a `record`',
      members: ['Counter', 'defaultdict', 'deque', 'namedtuple', 'OrderedDict', 'ChainMap'],
      example: String.raw`from collections import Counter, defaultdict, deque, namedtuple

print(Counter("mississippi").most_common(2))
groups = defaultdict(list)
for word in ["apple", "bean", "avocado"]:
    groups[word[0]].append(word)
print(dict(groups))
queue = deque([1, 2, 3], maxlen=3)
queue.append(4)
print(queue)
print(queue.popleft())
Point = namedtuple("Point", "x y")
print(Point(1, 2), Point(1, 2).x)`,
      output: String.raw`[('i', 4), ('s', 4)]
{'a': ['apple', 'avocado'], 'b': ['bean']}
deque([2, 3, 4], maxlen=3)
2
Point(x=1, y=2) 1` },
    { name: 'itertools', summary: 'Building blocks for iterators: endless counters, chaining, slicing, grouping, combinations, running totals, batches. Lesson: [[lesson:py-itertools]].',
      java: 'No direct equivalent; parts of `Stream` and Guava\'s `Iterables`.',
      members: ['count', 'cycle', 'repeat', 'chain', 'islice', 'groupby', 'product', 'permutations', 'combinations', 'accumulate', 'pairwise', 'batched', 'zip_longest', 'takewhile', 'dropwhile', 'starmap', 'tee'],
      example: String.raw`from itertools import chain, combinations, groupby, islice, count, accumulate, batched

print(list(chain([1, 2], (3,), "ab")))
print(list(combinations("ABC", 2)))
print([(k, len(list(g))) for k, g in groupby("aaabcc")])
print(list(islice(count(10, 5), 3)), list(accumulate([1, 2, 3, 4])))
print(list(batched(range(7), 3)))`,
      output: String.raw`[1, 2, 3, 'a', 'b']
[('A', 'B'), ('A', 'C'), ('B', 'C')]
[('a', 3), ('b', 1), ('c', 2)]
[10, 15, 20] [1, 3, 6, 10]
[(0, 1, 2), (3, 4, 5), (6,)]` },
    { name: 'functools', summary: 'Tools for functions: `reduce`, `partial` (fix some arguments), `lru_cache` and `cache` (remember results), `wraps` for decorators. Lesson: [[lesson:py-functools-recursion]].',
      java: '`stream.reduce`, a memo map or Caffeine cache',
      members: ['reduce', 'partial', 'lru_cache', 'cache', 'wraps', 'total_ordering', 'cached_property', 'singledispatch', 'cmp_to_key'],
      example: String.raw`from functools import reduce, partial, lru_cache

print(reduce(lambda acc, x: acc * x, [1, 2, 3, 4], 1))
power_of_two = partial(pow, 2)
print(power_of_two(10))

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(80), fib.cache_info().hits)`,
      output: String.raw`24
1024
23416728348467685 78` },
    { name: 'typing', summary: 'Names for type hints: `Optional`, `Callable`, `TypedDict`, `Protocol`, `Literal`… Hints are not checked when the program runs; tools such as mypy and your IDE check them. Lesson: [[lesson:py-type-hints]].',
      java: 'Generics, `Optional<T>`, interfaces, but checked by the compiler.',
      members: ['Optional', 'Union', 'Any', 'Callable', 'TypedDict', 'Protocol', 'Literal', 'Final', 'TypeVar', 'Generic', 'NamedTuple', 'Self', 'overload', 'get_type_hints', 'runtime_checkable'],
      example: String.raw`from typing import Optional, TypedDict, get_type_hints

class Movie(TypedDict):
    title: str
    year: int

def find(movies: list[Movie], year: int) -> Optional[Movie]:
    return next((m for m in movies if m["year"] == year), None)

films: list[Movie] = [{"title": "Lagaan", "year": 2001}]
print(find(films, 2001), find(films, 1999))
print(get_type_hints(find)["year"].__name__)`,
      output: String.raw`{'title': 'Lagaan', 'year': 2001} None
int` },
    { name: 'dataclasses', summary: 'Writes `__init__`, `__repr__` and `__eq__` for a class from its typed fields; `frozen=True` makes it immutable and hashable. Lesson: [[lesson:py-dataclasses-enums]].',
      java: '`record Point(int x, int y)`, or Lombok\'s `@Data`',
      members: ['dataclass', 'field', 'asdict', 'astuple', 'replace', 'fields', 'FrozenInstanceError', 'KW_ONLY'],
      example: String.raw`from dataclasses import dataclass, field, asdict, replace

@dataclass(frozen=True)
class Point:
    x: int
    y: int = 0

@dataclass
class Route:
    name: str
    stops: list = field(default_factory=list)

p = Point(1)
print(p, p == Point(1, 0), replace(p, y=5))
r = Route("A")
r.stops.append(p)
print(asdict(r))`,
      output: String.raw`Point(x=1, y=0) True Point(x=1, y=5)
{'name': 'A', 'stops': [{'x': 1, 'y': 0}]}` },
    { name: 'enum', summary: 'Enumerations: a fixed set of named values, each a single object you compare with `is`. `auto()` numbers them.',
      java: '`enum Status { TODO, DOING, DONE }`',
      members: ['Enum', 'IntEnum', 'StrEnum', 'Flag', 'auto', 'unique'],
      example: String.raw`from enum import Enum, auto

class Status(Enum):
    TODO = auto()
    DOING = auto()
    DONE = auto()

print(Status.DOING, Status.DOING.name, Status.DOING.value)
print(Status["DONE"], Status(1), [s.name for s in Status])
print(Status.TODO is Status(1))`,
      output: String.raw`Status.DOING DOING 2
Status.DONE Status.TODO ['TODO', 'DOING', 'DONE']
True` },
    { name: 'abc', summary: 'Abstract base classes: a class with `@abstractmethod` methods cannot be instantiated until a subclass provides them. Lesson: [[lesson:py-abc-protocols]].',
      java: 'An `abstract class`, or an `interface`',
      members: ['ABC', 'abstractmethod', 'ABCMeta'],
      example: String.raw`from abc import ABC, abstractmethod

class Repository(ABC):
    @abstractmethod
    def find(self, key): ...

    def find_or(self, key, default):
        found = self.find(key)
        return default if found is None else found

class MemoryRepo(Repository):
    def __init__(self):
        self.data = {"a": 1}

    def find(self, key):
        return self.data.get(key)

print(MemoryRepo().find_or("a", 0), MemoryRepo().find_or("z", 0))
try:
    Repository()
except TypeError as e:
    print("TypeError:", e)`,
      output: String.raw`1 0
TypeError: Can't instantiate abstract class Repository without an implementation for abstract method 'find'` },
    { name: 'logging', summary: 'Log messages with levels (DEBUG, INFO, WARNING, ERROR) through named loggers. Configure once at start-up; pass values as arguments, not in an f-string, so unused messages cost nothing. Lesson: [[lesson:py-logging-debugging]].',
      java: 'SLF4J with Logback: `LoggerFactory.getLogger(...)`',
      members: ['getLogger', 'basicConfig', 'debug', 'info', 'warning', 'error', 'exception', 'critical', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'Formatter', 'StreamHandler', 'FileHandler'],
      example: String.raw`import logging
import sys

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s", stream=sys.stdout, force=True)
log = logging.getLogger("orders")
log.debug("not shown: below INFO")
log.info("order %s created", 42)
log.warning("stock low: %d left", 3)`,
      output: String.raw`INFO orders: order 42 created
WARNING orders: stock low: 3 left` },
    { name: 'argparse', summary: 'Command-line options for a program: positional arguments, `--flags`, types, defaults, and a generated `--help`. Lesson: [[lesson:py-argparse]].',
      java: 'picocli, or Apache Commons CLI',
      members: ['ArgumentParser', 'Namespace', 'FileType'],
      example: String.raw`import argparse

parser = argparse.ArgumentParser(prog="resize")
parser.add_argument("file")
parser.add_argument("--width", type=int, default=800)
parser.add_argument("--verbose", action="store_true")
args = parser.parse_args(["photo.png", "--width", "640"])
print(args.file, args.width, args.verbose)
print(args)`,
      output: String.raw`photo.png 640 False
Namespace(file='photo.png', width=640, verbose=False)` },
    { name: 'subprocess', summary: 'Runs other programs and captures what they print. Pass the command as a list, not one string. Needs Python on your PC: a browser cannot start programs.',
      java: '`ProcessBuilder`',
      runtimes: ['server'],
      members: ['run', 'PIPE', 'CalledProcessError', 'check_output', 'Popen', 'DEVNULL'],
      example: String.raw`import subprocess
import sys

result = subprocess.run([sys.executable, "-c", "print(6 * 7)"], capture_output=True, text=True)
print(result.returncode, result.stdout.strip())`,
      output: String.raw`0 42` },
    { name: 'shutil', summary: 'File operations on whole files and folders: copy, move, delete a tree, make an archive.',
      java: '`Files.copy`, `Files.move`, `Files.walk` for deleting a tree',
      members: ['copy', 'copy2', 'copytree', 'move', 'rmtree', 'which', 'disk_usage', 'make_archive'],
      example: String.raw`import os
import shutil

os.makedirs("src", exist_ok=True)
with open("src/a.txt", "w", encoding="utf-8") as f:
    f.write("hello")
shutil.copytree("src", "backup")
shutil.move("backup/a.txt", "backup/b.txt")
print(sorted(os.listdir("backup")))
shutil.rmtree("src")
print(os.path.exists("src"))`,
      output: String.raw`['b.txt']
False` },
    { name: 'contextlib', summary: 'Helpers for `with`: `@contextmanager` turns a generator into a context manager, `suppress` ignores chosen errors, `redirect_stdout` captures prints. Lesson: [[lesson:py-context-managers]].',
      java: 'try-with-resources and a small `AutoCloseable` class',
      members: ['contextmanager', 'suppress', 'closing', 'redirect_stdout', 'ExitStack', 'nullcontext'],
      example: String.raw`from contextlib import contextmanager, suppress, redirect_stdout
import io
import os

@contextmanager
def opened(name):
    print("open", name)
    try:
        yield name.upper()
    finally:
        print("close", name)

with opened("log") as handle:
    print("using", handle)
with suppress(FileNotFoundError):
    os.remove("does-not-exist.txt")
buffer = io.StringIO()
with redirect_stdout(buffer):
    print("captured")
print(repr(buffer.getvalue()))`,
      output: String.raw`open log
using LOG
close log
'captured\n'` },
    { name: 'heapq', summary: 'A priority queue kept in a plain list: `heappush`, `heappop` (always the smallest), `nsmallest` and `nlargest`.',
      java: '`PriorityQueue`',
      members: ['heappush', 'heappop', 'heapify', 'heapreplace', 'nlargest', 'nsmallest', 'merge'],
      example: String.raw`import heapq

tasks = []
heapq.heappush(tasks, (2, "write tests"))
heapq.heappush(tasks, (1, "fix bug"))
heapq.heappush(tasks, (3, "refactor"))
print(heapq.heappop(tasks))
print(heapq.nsmallest(2, [7, 1, 5, 3]), heapq.nlargest(1, [7, 1, 5, 3]))`,
      output: String.raw`(1, 'fix bug')
[1, 3] [7]` },
    { name: 'asyncio', summary: 'Runs many waiting tasks (network calls, timers) on one thread: `async def`, `await`, `gather`, `create_task`. `asyncio.run(main())` starts it. Lesson: [[lesson:py-asyncio]].',
      java: '`CompletableFuture`, or virtual threads',
      members: ['run', 'sleep', 'gather', 'create_task', 'wait_for', 'Queue', 'TaskGroup', 'timeout', 'Event', 'Lock'],
      example: String.raw`import asyncio

async def download(name, delay):
    await asyncio.sleep(delay)
    print("finished", name)
    return len(name)

async def main():
    sizes = await asyncio.gather(download("slow.txt", 0.03), download("a.txt", 0.01))
    print(sizes)

asyncio.run(main())`,
      output: String.raw`finished a.txt
finished slow.txt
[8, 5]` },
    { name: 'unittest', summary: 'The built-in test framework, xUnit style: `TestCase` classes and `assertEqual`. Most projects use pytest, which also runs these: [[lesson:py-pytest]].',
      java: 'JUnit: `@Test` and `assertEquals`',
      members: ['TestCase', 'main', 'mock', 'TextTestRunner', 'TestLoader', 'defaultTestLoader', 'skip', 'skipIf'],
      example: String.raw`import io
import unittest

def add(a, b):
    return a + b

class AddTest(unittest.TestCase):
    def test_numbers(self):
        self.assertEqual(add(2, 3), 5)

    def test_strings(self):
        self.assertEqual(add("a", "b"), "ab")

suite = unittest.defaultTestLoader.loadTestsFromTestCase(AddTest)
result = unittest.TextTestRunner(stream=io.StringIO()).run(suite)
print(result.testsRun, result.wasSuccessful())`,
      output: String.raw`2 True` }
  ]);
})(window.PYLT);
