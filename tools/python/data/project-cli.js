/*
 * Project: logstat, a command-line log analyzer.
 *
 * Project shape (U.data.projects; one file per project, data/project-*.js):
 *   {id, title, summary, keywords: [..], docs: 'https://docs.python.org/3/...',
 *    intro: Markdown (what you build and what you learn), java: Markdown (the Java way, for the
 *    "Coming from Java" box), finish: Markdown (how to run the finished program outside the tool),
 *    packages: [PyPI packages any step needs: exactly the union of the steps' packages],
 *    steps: [{title, summary, body: Markdown (what is new, next to Java), task: Markdown,
 *             starter, solution, stdin?, hints: [..], checks: [{label, code}],
 *             runtimes?: ['server'] with runtimeWhy, packages?: ['pytest'] (implies runtimes
 *             ['server']), timeout?: seconds for a run (default 10)}]}
 *
 * A step is a challenge like a lesson's: the same checks and helpers (top of py/checker.py), and the
 * tests prove its starter fails and its solution passes. Each step's starter is the step before's
 * solution plus what this step adds, so the pieces below are put together rather than copied.
 */
(function (U) {
  var P = U.data.projects = U.data.projects || [];

  function fence(lang, src) { return '```' + lang + '\n' + src.replace(/^\n+|\s+$/g, '') + '\n```'; }
  function java(src) { return fence('java', src); }
  function con(src) { return fence('console', src); }
  function text(src) { return fence('text', src); }
  function norun(src) { return fence('python-norun', src); }

  /* ---------- the program, piece by piece ---------- */

  var IMPORTS_1 = String.raw`from dataclasses import dataclass
from datetime import datetime
`;
  var IMPORTS_2 = String.raw`import math
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
`;
  var IMPORTS_3 = String.raw`import argparse
import json
import math
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
`;
  var IMPORTS_4 = String.raw`import argparse
import json
import math
import subprocess
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
`;

  var REQUEST = String.raw`

@dataclass(frozen=True)
class Request:
    """One line of the access log."""
    time: datetime
    method: str
    path: str
    status: int
    ms: int
`;

  var PARSE = String.raw`

def parse_line(text):
    """One log line -> a Request. A line that is not one raises ValueError saying what is wrong."""
    fields = text.split()
    if len(fields) != 5:
        raise ValueError(f"expected 5 fields, got {len(fields)}")
    time, method, path, status, ms = fields
    try:
        when = datetime.fromisoformat(time)
    except ValueError:
        raise ValueError(f"bad time {time!r}") from None
    if not status.isdigit():
        raise ValueError(f"bad status {status!r}")
    if not (ms.endswith("ms") and ms[:-2].isdigit()):
        raise ValueError(f"bad duration {ms!r}")
    return Request(when, method, path, int(status), int(ms[:-2]))


def read_requests(lines):
    """The requests in lines (any iterable of strings), and a problem for each bad line."""
    requests, problems = [], []
    for number, line in enumerate(lines, start=1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        try:
            requests.append(parse_line(line))
        except ValueError as e:
            problems.append(f"line {number}: {e}")
    return requests, problems
`;

  var SUMMARY = String.raw`

def percentile(values, share):
    """Nearest rank: the smallest value with at least share of all the values at or below it."""
    ordered = sorted(values)
    return ordered[max(0, math.ceil(share * len(ordered)) - 1)]


def summarize(requests, top=3):
    """The numbers the report shows."""
    by_path = defaultdict(list)
    for r in requests:
        by_path[r.path].append(r.ms)
    averages = {path: sum(times) / len(times) for path, times in by_path.items()}
    slowest = sorted(averages.items(), key=lambda item: (-item[1], item[0]))[:top]
    classes = Counter(f"{r.status // 100}xx" for r in requests)
    return {
        "requests": len(requests),
        "by_class": dict(sorted(classes.items())),
        "error_rate": round(classes["5xx"] / len(requests), 3) if requests else 0.0,
        "p95_ms": percentile([r.ms for r in requests], 0.95) if requests else None,
        "slowest": [(path, round(average, 1)) for path, average in slowest],
    }


def format_text(summary):
    """The summary as the lines a person reads."""
    lines = [f"requests: {summary['requests']}"]
    if summary["requests"]:
        lines.append("by status: " + ", ".join(f"{k} {v}" for k, v in summary["by_class"].items()))
        lines.append(f"5xx rate: {summary['error_rate']:.1%}")
        lines.append(f"p95: {summary['p95_ms']} ms")
        lines.append("slowest:")
        lines += [f"  {path}  {average:.1f} ms" for path, average in summary["slowest"]]
    return "\n".join(lines)
`;

  var CLI = String.raw`

def positive(text):
    """argparse type: a whole number of 1 or more."""
    value = int(text)
    if value < 1:
        raise argparse.ArgumentTypeError(f"must be 1 or more, not {value}")
    return value


def build_parser():
    parser = argparse.ArgumentParser(prog="logstat", description="Summarize web server access logs.")
    parser.add_argument("files", nargs="*", metavar="FILE", help="log files; none, or -, reads standard input")
    parser.add_argument("--top", type=positive, default=3, help="how many of the slowest paths to show (default: 3)")
    parser.add_argument("--format", choices=["text", "json"], default="text", help="text (default) or json")
    return parser


def main(argv=None):
    """The command line: logstat [FILE ...] [--top N] [--format text|json]. -> the exit code."""
    args = build_parser().parse_args(argv)
    status, requests = 0, []
    for name in args.files or ["-"]:
        if name == "-":
            lines = sys.stdin.read().splitlines()
        else:
            try:
                lines = Path(name).read_text(encoding="utf-8").splitlines()
            except FileNotFoundError:
                print(f"logstat: {name}: no such file", file=sys.stderr)
                status = 1
                continue
        found, problems = read_requests(lines)
        requests += found
        for problem in problems:
            print(f"logstat: {name}: {problem}", file=sys.stderr)
    summary = summarize(requests, args.top)
    print(json.dumps(summary, indent=2) if args.format == "json" else format_text(summary))
    return status
`;

  var RUN = String.raw`

def run_logstat(*args, stdin=""):
    """Run this program as its own process, as a user would: -> (exit code, stdout, stderr)."""
    done = subprocess.run([sys.executable, __file__, *args], input=stdin, capture_output=True,
                          text=True, encoding="utf-8", timeout=30)
    return done.returncode, done.stdout, done.stderr


if __name__ == "__main__":
    sys.exit(main())
`;

  var SAMPLE = String.raw`

SAMPLE = """\
# access log, one request per line
2026-10-11T09:15:02 GET /api/orders 200 123ms
2026-10-11T09:15:03 POST /api/orders 201 340ms
2026-10-11T09:15:03 GET /api/orders/7 404 8ms
2026-10-11T09:15:04 oops

2026-10-11T09:15:05 GET /api/orders 500 1201ms
"""
`;

  var DEMO_1 = SAMPLE + String.raw`
requests, problems = read_requests(SAMPLE.splitlines())
for request in requests:
    print(request)
print("problems:", problems)
`;
  var DEMO_2 = SAMPLE + String.raw`
requests, problems = read_requests(SAMPLE.splitlines())
print(format_text(summarize(requests)))
`;
  var DEMO_3 = SAMPLE + String.raw`
Path("access.log").write_text(SAMPLE, encoding="utf-8")      # a file to read
print("exit code", main(["access.log"]))                      # python logstat.py access.log
print("exit code", main(["access.log", "--format", "json", "--top", "1"]))
print("exit code", main(["missing.log"]))
`;

  // the log the checks use, the same as SAMPLE
  var LOG = String.raw`LOG = """# access log, one request per line
2026-10-11T09:15:02 GET /api/orders 200 123ms
2026-10-11T09:15:03 POST /api/orders 201 340ms
2026-10-11T09:15:03 GET /api/orders/7 404 8ms
2026-10-11T09:15:04 oops

2026-10-11T09:15:05 GET /api/orders 500 1201ms
"""
`;
  var REPORT = String.raw`REPORT = """requests: 4
by status: 2xx 2, 4xx 1, 5xx 1
5xx rate: 25.0%
p95: 1201 ms
slowest:
  /api/orders  554.7 ms
  /api/orders/7  8.0 ms
"""
`;
  // main(argv) called in this process: -> (exit code, stdout, stderr); argparse's SystemExit gives its code
  var CLI_CALL = LOG + REPORT + String.raw`import contextlib, io, sys


def cli(*argv, stdin=""):
    out, err, saved = io.StringIO(), io.StringIO(), sys.stdin
    sys.stdin = io.StringIO(stdin)
    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            try:
                code = main(list(argv))
            except SystemExit as e:
                code = e.code
    finally:
        sys.stdin = saved
    return code, out.getvalue(), err.getvalue()


from pathlib import Path as _Path
_Path("a.log").write_text(LOG, encoding="utf-8")
`;
  var REQS = LOG + String.raw`reqs, _ = read_requests(LOG.splitlines())
`;

  P.push({
    id: 'cli', title: 'logstat: a command-line log analyzer',
    summary: 'A real command-line tool that reads web server logs and reports on them, built in four steps: parsing, numbers, argparse with exit codes and standard streams, and running it as a separate process.',
    keywords: ['cli', 'command line', 'argparse', 'logs', 'stdin', 'stderr', 'exit code', 'subprocess', 'dataclass', 'picocli', 'tool'],
    docs: 'https://docs.python.org/3/library/argparse.html',
    packages: [],
    intro: [
      'You will build `logstat`, a small tool of the kind every team ends up writing. Given access logs, one request per line,',
      text(String.raw`
2026-10-11T09:15:02 GET /api/orders 200 123ms
2026-10-11T09:15:03 POST /api/orders 201 340ms`),
      'it reports how many requests there were, how they split by status class, the share of server errors, the 95th-percentile time and the slowest paths, as text for people or JSON for other programs:',
      con(String.raw`
> python logstat.py access.log --top 2
requests: 4
by status: 2xx 2, 4xx 1, 5xx 1
5xx rate: 25.0%
p95: 1201 ms
slowest:
  /api/orders  554.7 ms
  /api/orders/7  8.0 ms`),
      'What it practises: a frozen dataclass as a record, `datetime` and clear `ValueError`s for bad input (step 1); `Counter`, `defaultdict`, sorting with a key and f-string formats (step 2); `argparse`, reading files or standard input, writing errors to standard error, and exit codes (step 3); running the finished program as its own process with `subprocess`, the way an end-to-end test does (step 4). The first three steps run in either Python; the fourth starts a process, which needs your PC.'
    ].join('\n\n'),
    java: 'In Java this would be a picocli (or Apache Commons CLI) application packaged as a jar and started with `java -jar logstat.jar access.log`. The pieces map one to one: a `record Request(...)` is the frozen dataclass, `LocalDateTime.parse` is `datetime.fromisoformat`, `Collectors.groupingBy` is `defaultdict` and `Counter`, picocli\'s annotations are `argparse.add_argument`, `System.err` is `sys.stderr`, `System.exit` is `sys.exit`, and `ProcessBuilder` is `subprocess.run`. What Python needs no counterpart for is the build: the `.py` file is the program.',
    finish: [
      'Download the step 4 code (**Download main.py** on that step) and save it as `logstat.py`. Then, in a terminal in the same folder:',
      con(String.raw`
python logstat.py access.log                  # one file
python logstat.py today.log yesterday.log     # several, added up
python logstat.py access.log --format json    # for another program
type access.log | python logstat.py           # standard input (Command Prompt)
Get-Content access.log | python logstat.py -  # standard input (PowerShell)
python logstat.py --help                      # the help argparse wrote`),
      'To make `logstat` a command you can run from any folder, give it a `pyproject.toml` (the [[lesson:py-packages]] lesson) with an entry point, and install it in a virtual environment:',
      text(String.raw`
[project]
name = "logstat"
version = "1.0"

[project.scripts]
logstat = "logstat:main"`),
      con(String.raw`
python -m pip install -e .
logstat access.log`),
      'pip writes a small `logstat.exe` launcher that calls `main()` and exits with what it returns, the way a jar\'s `Main-Class` is started by `java -jar`.'
    ].join('\n\n'),
    steps: [
      {
        title: 'Parse a log line',
        summary: 'A frozen dataclass for one request, a parser that says what is wrong with a bad line, and a reader that collects bad lines instead of stopping.',
        body: [
          'A log line has five fields separated by spaces: a time, a method, a path, a status code and a duration ending in `ms`. Each line becomes a `Request`, a **frozen dataclass**: Python\'s record. `frozen=True` makes assigning to a field raise an error, and the dataclass writes `__init__`, `__repr__` and `__eq__` for you.',
          java(String.raw`
record Request(LocalDateTime time, String method, String path, int status, int ms) {}`),
          'Converting the fields can fail: `datetime.fromisoformat("yesterday")` and `int("abc")` raise `ValueError`. A parser should say **what** was wrong in words a user understands, so catch the low-level error and raise your own: `raise ValueError(f"bad time {time!r}") from None`. (`from None` hides the original error in the traceback; `!r` puts quotes around the value, so an empty or spaced value is visible.)',
          'A real log has bad lines: a truncated write, a comment, a blank line. A tool that stops at the first one is useless on a 2 GB log. So the reader keeps going, collects a message for each bad line with its **line number**, and returns both lists. `enumerate(lines, start=1)` numbers the lines the way an editor does.',
          '| Java | Python |\n|---|---|\n| `LocalDateTime.parse(s)` | `datetime.fromisoformat(s)` |\n| `Integer.parseInt(s)` throws `NumberFormatException` | `int(s)` raises `ValueError` |\n| `s.split("\\\\s+")` | `s.split()` |\n| `s.endsWith("ms")`, `s.substring(0, s.length() - 2)` | `s.endswith("ms")`, `s[:-2]` |\n| a checked exception with a message | `raise ValueError("...")` |'
        ].join('\n\n'),
        task: [
          '1. `Request` is given: a frozen dataclass with `time` (a `datetime`), `method`, `path`, `status` (an `int`) and `ms` (an `int`).',
          '2. `parse_line(text)` returns a `Request` with the fields converted, so `"... 200 123ms"` gives `status=200, ms=123`. A bad line raises `ValueError` with exactly one of these messages: `expected 5 fields, got 2`, `bad time \'yesterday\'`, `bad status \'OK\'`, `bad duration \'12\'` (the duration must be digits followed by `ms`).',
          '3. `read_requests(lines)` takes any iterable of lines and returns `(requests, problems)`. It skips blank lines and lines starting with `#`; for each bad line it adds `"line N: <message>"` to `problems`, where N counts every line from 1, and goes on.'
        ].join('\n\n'),
        starter: IMPORTS_1 + REQUEST + String.raw`

def parse_line(text):
    time, method, path, status, ms = text.split()
    return Request(time, method, path, status, ms)


def read_requests(lines):
    requests = [parse_line(line) for line in lines]
    return requests, []
` + DEMO_1,
        solution: IMPORTS_1 + REQUEST + PARSE + DEMO_1,
        hints: [
          'Split first and check the count: `fields = text.split()`, then `if len(fields) != 5: raise ValueError(f"expected 5 fields, got {len(fields)}")`.',
          'For the time: `try: when = datetime.fromisoformat(time)` / `except ValueError: raise ValueError(f"bad time {time!r}") from None`. For the status, `status.isdigit()`; for the duration, `ms.endswith("ms") and ms[:-2].isdigit()`.',
          'In `read_requests`, `for number, line in enumerate(lines, start=1):`, strip the line, `continue` on blank or `#` lines, and wrap `parse_line` in `try` / `except ValueError as e:`, appending `f"line {number}: {e}"`.'
        ],
        checks: [
          { label: '`parse_line` converts each field', code: String.raw`from datetime import datetime
r = parse_line("2026-10-11T09:15:02 GET /api/orders 200 123ms")
assert r == Request(datetime(2026, 10, 11, 9, 15, 2), "GET", "/api/orders", 200, 123), f"got {r!r}"` },
          { label: 'A `Request` is frozen', code: String.raw`import dataclasses
r = parse_line("2026-10-11T09:15:02 GET / 200 1ms")
try:
    r.status = 500
except dataclasses.FrozenInstanceError:
    pass
else:
    raise AssertionError("a Request should be frozen: @dataclass(frozen=True)")` },
          { label: 'Each bad line raises `ValueError` with its message', code: String.raw`def message(line):
    try:
        parse_line(line)
    except ValueError as e:
        return str(e)
    return "no error"
assert message("2026-10-11T09:15:04 oops") == "expected 5 fields, got 2"
assert message("yesterday GET / 200 5ms") == "bad time 'yesterday'"
assert message("2026-10-11T09:15:04 GET / OK 5ms") == "bad status 'OK'"
assert message("2026-10-11T09:15:04 GET / 200 12") == "bad duration '12'"` },
          { label: '`read_requests` skips blanks and comments, and reports bad lines with their numbers', code: REQS + String.raw`reqs, problems = read_requests(LOG.splitlines())
assert len(reqs) == 4, f"{len(reqs)} requests"
assert problems == ["line 5: expected 5 fields, got 2"], f"problems: {problems}"` },
          { label: '`read_requests` takes any iterable, such as a generator', code: String.raw`lines = (f"2026-10-11T09:00:0{i} GET /p{i} 200 {i}ms" for i in range(3))
reqs, problems = read_requests(lines)
assert [r.path for r in reqs] == ["/p0", "/p1", "/p2"] and problems == []` }
        ]
      },
      {
        title: 'The numbers in the report',
        summary: 'Count by status class with Counter, group times by path with defaultdict, a percentile, the slowest paths by a sort key, and the text a person reads.',
        body: [
          'The report needs four numbers, and each has a standard-library tool:',
          '| Number | How | Java |\n|---|---|---|\n| requests per status class (2xx, 4xx...) | `Counter(f"{r.status // 100}xx" for r in requests)` | `groupingBy(..., counting())` |\n| average time per path | `defaultdict(list)`, then `sum(times) / len(times)` | `groupingBy(Request::path, averagingInt(Request::ms))` |\n| the slowest paths, ties alphabetically | `sorted(items, key=lambda i: (-i[1], i[0]))[:top]` | `Comparator.comparing(...).reversed().thenComparing(...)` |\n| the 95th-percentile time | sort, then pick by rank | the same, by hand |',
          'A **percentile** answers "how slow are the slow requests?" better than the average: p95 = 1201 ms means 95% of requests took 1201 ms or less. The nearest-rank method takes the sorted values and returns the one at position `ceil(0.95 × n)`, counting from 1. (The `statistics` module has `quantiles`, which interpolates between values; nearest rank always returns a time that really happened.)',
          '`Counter` returns 0 for a key it has never seen, without adding it: `classes["5xx"]` is safe even with no server errors. `dict(sorted(classes.items()))` gives a dict with its keys in order, since dicts keep the order keys were added.',
          'f-strings format numbers with a spec after a colon: `f"{0.25:.1%}"` is `25.0%`, `f"{554.666:.1f}"` is `554.7`. That is `String.format("%.1f", x)`, with the value written in place.'
        ].join('\n\n'),
        task: [
          '1. `summarize(requests, top=3)` returns a dict with these keys:',
          '- `"requests"`: how many;\n- `"by_class"`: counts per status class, `{"2xx": 2, "4xx": 1, "5xx": 1}`, keys in order, only the classes that occur;\n- `"error_rate"`: the share of 5xx responses, rounded to 3 decimals (`0.0` with no requests);\n- `"p95_ms"`: the 95th-percentile time by nearest rank (`None` with no requests);\n- `"slowest"`: up to `top` `(path, average ms rounded to 1 decimal)` tuples, slowest first, ties alphabetically.',
          '2. `format_text(summary)` returns the report as text, lines joined with `"\\n"`, no newline at the end. With no requests it is just `requests: 0`. For the sample log:',
          text(String.raw`
requests: 4
by status: 2xx 2, 4xx 1, 5xx 1
5xx rate: 25.0%
p95: 1201 ms
slowest:
  /api/orders  554.7 ms
  /api/orders/7  8.0 ms`)
        ].join('\n\n'),
        starter: IMPORTS_2 + REQUEST + PARSE + String.raw`

def summarize(requests, top=3):
    """The numbers the report shows."""
    return {"requests": len(requests)}


def format_text(summary):
    """The summary as the lines a person reads."""
    return f"requests: {summary['requests']}"
` + DEMO_2,
        solution: IMPORTS_2 + REQUEST + PARSE + SUMMARY + DEMO_2,
        hints: [
          'Group the times: `by_path = defaultdict(list)`, then `by_path[r.path].append(r.ms)` for each request; averages are `sum(times) / len(times)`.',
          'Percentile by nearest rank: `ordered = sorted(values)`, then `ordered[max(0, math.ceil(0.95 * len(ordered)) - 1)]`.',
          'In `format_text`, build a list of lines and `"\\n".join(lines)`. `f"{rate:.1%}"` writes a share as a percentage.'
        ],
        checks: [
          { label: 'Counts per status class, and the 5xx rate', code: REQS + String.raw`s = summarize(reqs)
assert s.get("requests") == 4 and s.get("by_class") == {"2xx": 2, "4xx": 1, "5xx": 1}, f"got {s}"
assert list(s["by_class"]) == ["2xx", "4xx", "5xx"], "the classes in order"
assert s.get("error_rate") == 0.25, f"error_rate is {s.get('error_rate')}"` },
          { label: 'p95 by nearest rank', code: String.raw`from datetime import datetime
t = datetime(2026, 10, 11)
assert summarize([Request(t, "GET", "/", 200, ms) for ms in range(1, 101)])["p95_ms"] == 95
assert summarize([Request(t, "GET", "/", 200, ms) for ms in (5, 1, 9)])["p95_ms"] == 9` },
          { label: 'The slowest paths: average, rounded, ties alphabetical, at most `top`', code: String.raw`from datetime import datetime
t = datetime(2026, 10, 11)
reqs = [Request(t, "GET", p, 200, ms) for p, ms in [("/b", 10), ("/a", 10), ("/c", 1), ("/c", 2), ("/d", 50)]]
assert summarize(reqs, top=3)["slowest"] == [("/d", 50.0), ("/a", 10.0), ("/b", 10.0)]
assert summarize(reqs, top=5)["slowest"][-1] == ("/c", 1.5)` },
          { label: 'No requests', code: String.raw`assert summarize([]) == {"requests": 0, "by_class": {}, "error_rate": 0.0, "p95_ms": None, "slowest": []}, summarize([])` },
          { label: 'The text report, exactly', code: REQS + REPORT + String.raw`got = format_text(summarize(reqs))
assert got == REPORT.rstrip("\n"), "got:\n" + got
assert format_text(summarize([])) == "requests: 0"` }
        ]
      },
      {
        title: 'The command line',
        summary: 'argparse with a custom type and choices, files or standard input, errors on standard error, and an exit code.',
        body: [
          'A command-line tool has a contract with whoever calls it, often another program in a pipeline:',
          '- **arguments**: files to read, and options; `argparse` reads them, refuses bad ones with exit code 2, and writes `--help`;\n- **standard input**: with no file (or `-`), read the lines piped in, as `grep` and `sort` do;\n- **standard output**: only the report, so it can be piped on (`> report.json`);\n- **standard error**: everything else, such as warnings and errors, so it never mixes into the report;\n- **the exit code**: 0 when all went well, 1 when a file was missing, 2 for bad arguments.',
          'An argparse `type` is any function that turns text into a value. `type=int` is one; your own can check more and raise `argparse.ArgumentTypeError` with a message argparse shows the user:',
          java(String.raw`
// picocli: the same contract, with annotations
@Command(name = "logstat")
class LogStat implements Callable<Integer> {
    @Parameters(arity = "0..*") List<Path> files;
    @Option(names = "--top") int top = 3;
    public Integer call() { ...; return 0; }        // the exit code
}`),
          '`main(argv=None)` takes the arguments as a list and **returns** the exit code instead of calling `sys.exit` itself: a test can then call `main(["a.log"])` and look at what it printed and returned. `argv=None` makes `parse_args` read `sys.argv[1:]`, the real command line. Only argparse exits on its own, for bad arguments and `--help`, by raising `SystemExit`.'
        ].join('\n\n'),
        task: [
          '1. `build_parser()` returns a parser for `logstat [FILE ...] [--top N] [--format {text,json}]`: any number of files (stored as `args.files`, a list of names), `--top` a whole number of **1 or more** (default 3; `0` or `x` is refused with exit code 2), `--format` `text` (default) or `json`.',
          '2. `main(argv=None)` reads every file named, or standard input when there are none or the name is `-`, adds up the requests, and prints one report to standard output: `format_text(...)`, or the summary as `json.dumps(summary, indent=2)`. It returns the exit code.',
          '3. A file that does not exist: `logstat: NAME: no such file` on standard error, exit code 1, and the other files are still read. Each bad line: `logstat: NAME: line N: message` on standard error (the exit code stays 0).'
        ].join('\n\n'),
        starter: IMPORTS_3 + REQUEST + PARSE + SUMMARY + String.raw`

def build_parser():
    parser = argparse.ArgumentParser(prog="logstat")
    parser.add_argument("file")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    requests, problems = read_requests(Path(args.file).read_text().splitlines())
    print(format_text(summarize(requests)))
    return 0
` + DEMO_3,
        solution: IMPORTS_3 + REQUEST + PARSE + SUMMARY + CLI + DEMO_3,
        hints: [
          '`add_argument("files", nargs="*")` takes any number of files, none included. For `--top`, write `def positive(text):` that returns `int(text)` and raises `argparse.ArgumentTypeError(...)` below 1, then `type=positive`.',
          'Loop over `args.files or ["-"]`. For `"-"`, `sys.stdin.read().splitlines()`; otherwise `Path(name).read_text(encoding="utf-8").splitlines()` inside `try` / `except FileNotFoundError:`.',
          'Messages go to `print(..., file=sys.stderr)`. Print the report once, after every file, and `return status`.'
        ],
        checks: [
          { label: 'The arguments: files, `--top`, `--format`', code: String.raw`a = build_parser().parse_args([])
assert (a.files, a.top, a.format) == ([], 3, "text"), f"defaults: {a}"
a = build_parser().parse_args(["x.log", "y.log", "--top", "5", "--format", "json"])
assert (a.files, a.top, a.format) == (["x.log", "y.log"], 5, "json"), f"got {a}"` },
          { label: 'Bad arguments exit with code 2', code: CLI_CALL + String.raw`for argv in (["--top", "0"], ["--top", "x"], ["--format", "xml"]):
    code, out, err = cli(*argv)
    assert code == 2 and "usage" in err, f"{argv}: exit code {code}, stderr {err!r}"` },
          { label: 'A file: the text report, warnings on standard error', code: CLI_CALL + String.raw`code, out, err = cli("a.log", "--top", "2")
assert code == 0, f"exit code {code}"
assert out == REPORT, "stdout:\n" + out
assert err == "logstat: a.log: line 5: expected 5 fields, got 2\n", f"stderr: {err!r}"` },
          { label: 'No file, or `-`, reads standard input', code: CLI_CALL + String.raw`assert cli(stdin=LOG)[:2] == (0, REPORT), cli(stdin=LOG)
assert cli("-", stdin=LOG)[:2] == (0, REPORT)` },
          { label: 'Several files add up; `--format json`', code: CLI_CALL + String.raw`import json
code, out, err = cli("a.log", "a.log", "--format", "json", "--top", "1")
data = json.loads(out)
assert code == 0 and data["requests"] == 8 and data["slowest"] == [["/api/orders", 554.7]], data` },
          { label: 'A missing file: a message, exit code 1, the other files still read', code: CLI_CALL + String.raw`code, out, err = cli("nope.log", "a.log")
assert code == 1, f"exit code {code}"
assert "logstat: nope.log: no such file" in err, f"stderr: {err!r}"
assert out.startswith("requests: 4"), f"stdout: {out!r}"` }
        ]
      },
      {
        title: 'Run it as a real program',
        summary: 'The __main__ guard, sys.exit with main\'s code, and an end-to-end test that starts the program as its own process with subprocess.',
        runtimes: ['server'],
        runtimeWhy: 'This step starts the program as a separate process with `subprocess`, and a browser gives Python no processes.',
        stdin: String.raw`2026-10-11T09:15:02 GET /api/orders 200 123ms
2026-10-11T09:15:03 POST /api/orders 201 340ms
2026-10-11T09:15:03 GET /api/orders/7 404 8ms
2026-10-11T09:15:05 GET /api/orders 500 1201ms`,
        body: [
          'Calling `main([...])` tests the logic. It does not test what a user actually runs: `python logstat.py access.log` in a terminal, with real standard streams and a real exit code. Two things make that work.',
          '**The guard.** When Python runs a file directly, its `__name__` is `"__main__"`; when another file imports it, `__name__` is the module\'s name. So the last lines',
          norun(String.raw`
if __name__ == "__main__":
    sys.exit(main())`),
          'run the program only when it is started, and hand `main`\'s return value to the operating system as the exit code. This is `public static void main` plus `System.exit(...)`. Top-level code outside the guard would also run in every process and every import, which is why the demo lines of the earlier steps are gone now.',
          '**A separate process.** `subprocess.run` starts a program, as `ProcessBuilder` does, and waits for it:',
          java(String.raw`
Process p = new ProcessBuilder("java", "-jar", "logstat.jar", "a.log").start();
String out = new String(p.getInputStream().readAllBytes());
int code = p.waitFor();`),
          '`subprocess.run([sys.executable, "logstat.py", "a.log"], input=text, capture_output=True, text=True)` returns a `CompletedProcess` with `.returncode`, `.stdout` and `.stderr`. `sys.executable` is the Python running this program, so the child uses the same one; `input=` is piped to its standard input; `text=True` (with `encoding="utf-8"`) gives strings rather than bytes; `timeout=` stops a child that hangs. `__file__` is the path of this program, whatever its file is called.',
          'The tool runs this step\'s program with no arguments and the lines in the input box below as standard input, the same as `type access.log | python logstat.py`.'
        ].join('\n\n'),
        task: [
          '1. End the program with the `__main__` guard: `sys.exit(main())`. Remove the demo lines: run as a process, the program must print only its report.',
          '2. Write `run_logstat(*args, stdin="")`, which runs this program as its own process with those arguments and that standard input, and returns `(exit code, stdout, stderr)`. Use `subprocess.run` with `sys.executable` and `__file__`.',
          'The checks run it for real: `logstat a.log`, a pipe on standard input, a missing file (exit code 1) and a bad option (exit code 2, with the usage on standard error).'
        ].join('\n\n'),
        starter: IMPORTS_4 + REQUEST + PARSE + SUMMARY + CLI + String.raw`

def run_logstat(*args, stdin=""):
    """Run this program as its own process: -> (exit code, stdout, stderr)."""
    return 0, "", ""


main(["--help"])
`,
        solution: IMPORTS_4 + REQUEST + PARSE + SUMMARY + CLI + RUN,
        hints: [
          'Replace the last line with `if __name__ == "__main__":` and, indented under it, `sys.exit(main())`.',
          '`done = subprocess.run([sys.executable, __file__, *args], input=stdin, capture_output=True, text=True, encoding="utf-8", timeout=30)`, then `return done.returncode, done.stdout, done.stderr`.'
        ],
        checks: [
          { label: '`logstat a.log`: exit code 0 and the report', code: LOG + REPORT + String.raw`from pathlib import Path
Path("a.log").write_text(LOG, encoding="utf-8")
code, out, err = run_logstat("a.log", "--top", "2")
assert code == 0 and out == REPORT, f"exit code {code}, stdout {out!r}, stderr {err[-300:]!r}"
assert "line 5" in err, f"the bad line goes to stderr: {err!r}"` },
          { label: 'A pipe on standard input', code: LOG + REPORT + String.raw`code, out, err = run_logstat(stdin=LOG)
assert code == 0 and out == REPORT, f"exit code {code}, stdout {out!r}"` },
          { label: 'A missing file: exit code 1, the message on standard error', code: String.raw`code, out, err = run_logstat("nope.log")
assert code == 1 and "logstat: nope.log: no such file" in err, f"exit code {code}, stderr {err!r}"` },
          { label: 'A bad option: exit code 2, the usage on standard error', code: String.raw`code, out, err = run_logstat("--format", "xml")
assert code == 2 and "usage: logstat" in err and out == "", f"exit code {code}, stdout {out!r}, stderr {err!r}"` },
          { label: 'It really starts a process (`subprocess.run` with `sys.executable`)', code: String.raw`assert calls("run") and "sys.executable" in src, "start it with subprocess.run([sys.executable, __file__, ...])"` }
        ]
      }
    ]
  });
})(window.PYLT);
