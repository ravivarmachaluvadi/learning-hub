/*
 * Project: a data script that pulls JSON over HTTP and writes a report. The project shape is described
 * at the top of data/project-cli.js.
 *
 * Standard library only (urllib, json, csv, decimal). From step 2 on, the program talks HTTP to a
 * stand-in API it starts itself (Python's own http.server, in a thread), and the checks start a fake
 * API of their own that can be told to answer 503, 429 or 404, or to be slow. Sockets and threads
 * need the Python on your PC.
 */
(function (U) {
  var P = U.data.projects = U.data.projects || [];

  function fence(lang, src) { return '```' + lang + '\n' + src.replace(/^\n+|\s+$/g, '') + '\n```'; }
  function java(src) { return fence('java', src); }
  function con(src) { return fence('console', src); }
  function norun(src) { return fence('python-norun', src); }

  var WHY = 'This step talks HTTP to a small server it starts in a thread, and a browser gives Python neither network sockets nor threads.';

  /* ---------- the program, piece by piece ---------- */

  var IMPORTS_1 = String.raw`import json
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal, InvalidOperation
`;
  var IMPORTS_2 = String.raw`import json
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal, InvalidOperation
`;
  var IMPORTS_3 = String.raw`import json
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal, InvalidOperation
`;
  var IMPORTS_4 = String.raw`import json
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal, InvalidOperation
`;
  var IMPORTS_5 = String.raw`import argparse
import csv
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
`;

  var PARSE = String.raw`

@dataclass(frozen=True)
class Order:
    id: int
    customer: str
    total: Decimal
    created: datetime


@dataclass
class Page:
    """One page of the API's answer: its good orders, the link to the next page, what was wrong."""
    orders: list
    next: str | None = None
    problems: list = field(default_factory=list)


def parse_order(raw):
    """One order as the API sends it (a dict) -> an Order. Anything wrong raises ValueError."""
    for key in ("id", "customer", "total", "created"):
        if key not in raw:
            raise ValueError(f"missing {key}")
    try:
        total = Decimal(str(raw["total"]))
    except InvalidOperation:
        raise ValueError(f"bad total {raw['total']!r}") from None
    if total < 0:
        raise ValueError(f"negative total {total}")
    try:
        created = datetime.fromisoformat(raw["created"])
    except (TypeError, ValueError):
        raise ValueError(f"bad date {raw['created']!r}") from None
    return Order(int(raw["id"]), str(raw["customer"]).strip().lower(), total, created)


def parse_page(text):
    """The JSON text of one page -> a Page. A bad order is skipped, with a problem saying why."""
    data = json.loads(text)
    page = Page(orders=[], next=data.get("next"))
    for raw in data.get("orders", []):
        try:
            page.orders.append(parse_order(raw))
        except ValueError as e:
            page.problems.append(f"order {raw.get('id', '?')}: {e}")
    return page
`;

  var FETCH = String.raw`

USER_AGENT = "orders-report/1.0"


def fetch_text(url, timeout=5):
    """GET url -> the body as text. An HTTP error status raises urllib.error.HTTPError."""
    request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8")


def fetch_page(url):
    return parse_page(fetch_text(url))
`;

  var FETCH_RETRY = String.raw`

USER_AGENT = "orders-report/1.0"
RETRY_STATUSES = {429, 503}


def fetch_text(url, timeout=5, attempts=3, sleep=time.sleep):
    """GET url -> the body as text. A 429 or 503 answer, or a connection problem, is tried again, up
    to attempts times in all, after waiting what the server's Retry-After header asks, or else 0.5 s,
    then 1 s, then 2 s... Any other HTTP error status raises urllib.error.HTTPError at once."""
    request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT})
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read().decode("utf-8")
        except urllib.error.HTTPError as e:            # before URLError: an HTTPError is a URLError too
            if e.code not in RETRY_STATUSES or attempt == attempts:
                raise
            wait = float(e.headers.get("Retry-After") or 0.5 * 2 ** (attempt - 1))
        except (urllib.error.URLError, ConnectionError, TimeoutError):
            if attempt == attempts:
                raise
            wait = 0.5 * 2 ** (attempt - 1)
        sleep(wait)


def fetch_page(url):
    return parse_page(fetch_text(url))
`;

  var PAGES = String.raw`

def iter_orders(url, problems=None):
    """Every order of every page, following each page's next link, fetched only as they are needed.
    The problems of each page are added to problems, a list, when one is given."""
    seen = set()
    while url:
        if url in seen:
            raise ValueError(f"the pages loop back to {url}")
        seen.add(url)
        page = fetch_page(url)
        if problems is not None:
            problems.extend(page.problems)
        yield from page.orders
        url = urllib.parse.urljoin(url, page.next) if page.next else None
`;

  var REPORT = String.raw`

def write_report(orders, folder):
    """customers.csv (each customer's orders and total, biggest total first) and summary.json, in
    folder. -> the two paths."""
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    per_customer = defaultdict(lambda: [0, Decimal("0")])
    for o in orders:
        per_customer[o.customer][0] += 1
        per_customer[o.customer][1] += o.total
    rows = sorted(per_customer.items(), key=lambda item: (-item[1][1], item[0]))
    csv_path = folder / "customers.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["customer", "orders", "total"])
        for customer, (count, total) in rows:
            writer.writerow([customer, count, f"{total:.2f}"])
    summary = {
        "orders": len(orders),
        "customers": len(per_customer),
        "revenue": f"{sum((o.total for o in orders), Decimal('0')):.2f}",
        "first": min(o.created for o in orders).isoformat() if orders else None,
        "last": max(o.created for o in orders).isoformat() if orders else None,
    }
    json_path = folder / "summary.json"
    json_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return csv_path, json_path


def day(text):
    """argparse type: a date written 2026-10-05."""
    return date.fromisoformat(text)


def build_parser():
    parser = argparse.ArgumentParser(prog="orders-report", description="Pull orders from the API and write a report.")
    parser.add_argument("--api", required=True, help="the first page's URL")
    parser.add_argument("--out", default="report", help="the folder for the report (default: report)")
    parser.add_argument("--since", type=day, help="only orders created on or after this day, such as 2026-10-05")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    problems = []
    orders = [o for o in iter_orders(args.api, problems) if args.since is None or o.created.date() >= args.since]
    for problem in problems:
        print(f"skipped {problem}", file=sys.stderr)
    csv_path, json_path = write_report(orders, args.out)
    print(f"wrote {csv_path} and {json_path} ({len(orders)} orders)")
    return 0
`;

  // the program's own stand-in API, from step 2 on
  var STAND_IN = String.raw`

def stand_in_api():
    """A stand-in for the real API, so this program runs offline: two pages of orders, served from
    files by Python's own web server in a background thread. -> (its address, the server)."""
    import threading
    from functools import partial
    from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
    from pathlib import Path

    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *args):          # no line on stderr for each request
            pass

    pages = {
        "orders-1.json": {"orders": [
            {"id": 1, "customer": "Ann", "total": "19.99", "created": "2026-10-01T09:30:00"},
            {"id": 2, "customer": "bob", "total": 5.01, "created": "2026-10-02T14:00:00"},
            {"id": 3, "customer": "ann", "total": "oops", "created": "2026-10-02T15:00:00"}],
            "next": "orders-2.json"},
        "orders-2.json": {"orders": [
            {"id": 4, "customer": "cy", "total": "120.00", "created": "2026-10-05T11:00:00"},
            {"id": 5, "customer": "ann", "total": "7.50", "created": "2026-10-06T16:45:00"}],
            "next": None},
    }
    Path("api").mkdir(exist_ok=True)
    for name, page in pages.items():
        Path("api", name).write_text(json.dumps(page), encoding="utf-8")
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Quiet, directory="api"))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{server.server_address[1]}/", server
`;

  var DEMO_1 = String.raw`

PAGE = """{
  "orders": [
    {"id": 1, "customer": " Ann ", "total": "19.99", "created": "2026-10-01T09:30:00"},
    {"id": 2, "customer": "bob", "total": 5.01, "created": "2026-10-02T14:00:00"},
    {"id": 3, "total": "7.00", "created": "2026-10-02T15:00:00"},
    {"id": 4, "customer": "cy", "total": "abc", "created": "2026-10-03T08:00:00"}
  ],
  "next": "/orders?page=2"
}"""

page = parse_page(PAGE)
for order in page.orders:
    print(order)
print("next:", page.next)
print("problems:", page.problems)
print("revenue:", sum(o.total for o in page.orders))
`;
  var DEMO_2 = String.raw`

if __name__ == "__main__":
    base, server = stand_in_api()
    print(fetch_text(base + "orders-1.json")[:80], "...")
    page = fetch_page(base + "orders-1.json")
    print(len(page.orders), "orders, next:", page.next, "problems:", page.problems)
    try:
        fetch_text(base + "no-such-page.json")
    except urllib.error.HTTPError as e:
        print("HTTP error", e.code)
    server.shutdown()
`;
  var DEMO_3 = String.raw`

if __name__ == "__main__":
    base, server = stand_in_api()
    problems = []
    for order in iter_orders(base + "orders-1.json", problems):
        print(order.id, order.customer, order.total)
    print("problems:", problems)
    server.shutdown()
`;
  var DEMO_4 = String.raw`

if __name__ == "__main__":
    base, server = stand_in_api()
    waits = []
    try:
        fetch_text("http://127.0.0.1:0/", sleep=waits.append)     # nothing can listen on port 0
    except urllib.error.URLError as e:
        print("gave up after waiting", waits, "seconds:", e.reason)
    print(len(list(iter_orders(base + "orders-1.json"))), "orders")
    server.shutdown()
`;
  var DEMO_5 = String.raw`

if __name__ == "__main__":
    base, server = stand_in_api()
    code = main(["--api", base + "orders-1.json", "--out", "report"])
    print(Path("report/customers.csv").read_text(encoding="utf-8"))
    print(Path("report/summary.json").read_text(encoding="utf-8"))
    server.shutdown()
    sys.exit(code)
`;

  /* ---------- what the checks share ---------- */

  // A fake orders API on 127.0.0.1: pages by path, planned failures, a delay; it records each request.
  var FAKE_API = String.raw`import json as _json, threading as _threading, time as _time
from http.server import BaseHTTPRequestHandler as _Base, ThreadingHTTPServer as _Server


class FakeApi:
    """pages: {"/orders?page=1": {...}}. fail: {path: [(status, retry_after or None), ...]}, answered
    first, in order. delay: seconds before each answer. hits: [(path, {header: value})] of every request."""

    def __init__(self, pages, fail=None, delay=0):
        self.pages, self.fail, self.delay, self.hits = pages, {k: list(v) for k, v in (fail or {}).items()}, delay, []
        api = self

        class Handler(_Base):
            def log_message(self, *args):
                pass

            def do_GET(self):
                api.hits.append((self.path, {k.lower(): v for k, v in self.headers.items()}))
                if api.delay:
                    _time.sleep(api.delay)
                planned = api.fail.get(self.path)
                if planned:
                    status, retry_after = planned.pop(0)
                    self.send_response(status)
                    if retry_after is not None:
                        self.send_header("Retry-After", str(retry_after))
                    self.send_header("Content-Length", "0")
                    self.end_headers()
                    return
                if self.path not in api.pages:
                    self.send_response(404)
                    self.send_header("Content-Length", "0")
                    self.end_headers()
                    return
                body = _json.dumps(api.pages[self.path]).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

        self.server = _Server(("127.0.0.1", 0), Handler)
        self.server.handle_error = lambda *args: None       # a client that gave up is not news
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"
        _threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.server.shutdown()
        self.server.server_close()


def order(i, customer="ann", total="10.00", created="2026-10-01T09:00:00"):
    return {"id": i, "customer": customer, "total": total, "created": created}


THREE_PAGES = {
    "/orders?page=1": {"orders": [order(1), order(2)], "next": "/orders?page=2"},
    "/orders?page=2": {"orders": [order(3), {"id": 4, "customer": "x"}], "next": "/orders?page=3"},
    "/orders?page=3": {"orders": [order(5)], "next": None},
}
`;
  var ORDERS = String.raw`from datetime import datetime as _dt
from decimal import Decimal as _D
ORDERS = [Order(1, "ann", _D("19.99"), _dt(2026, 10, 1, 9, 30)), Order(2, "bob", _D("5.01"), _dt(2026, 10, 2, 14, 0)),
          Order(4, "cy", _D("120.00"), _dt(2026, 10, 5, 11, 0)), Order(5, "ann", _D("7.50"), _dt(2026, 10, 6, 16, 45))]
`;
  var CALL_MAIN = String.raw`import contextlib as _cl, io as _io


def run_main(*argv):
    out, err = _io.StringIO(), _io.StringIO()
    with _cl.redirect_stdout(out), _cl.redirect_stderr(err):
        try:
            code = main(list(argv))
        except SystemExit as e:
            code = e.code
    return code, out.getvalue(), err.getvalue()


REPORT_PAGES = {
    "/orders?page=1": {"orders": [order(1, "Ann", "19.99", "2026-10-01T09:30:00"), order(2, "bob", 5.01, "2026-10-02T14:00:00"),
                                  order(3, "ann", "oops")], "next": "/orders?page=2"},
    "/orders?page=2": {"orders": [order(4, "cy", "120.00", "2026-10-05T11:00:00"), order(5, "ann", "7.50", "2026-10-06T16:45:00")],
                       "next": None},
}
`;

  P.push({
    id: 'data', title: 'A data script: JSON over HTTP to a report',
    summary: 'A script that pulls orders from a paginated JSON API and writes a CSV and a JSON report, built in five steps: exact money with Decimal, urllib, following pages lazily, retries with backoff, and the report with its command line.',
    keywords: ['data', 'script', 'json', 'http', 'urllib', 'api', 'rest client', 'pagination', 'retry', 'backoff', 'csv', 'decimal', 'httpclient', 'etl', 'report'],
    docs: 'https://docs.python.org/3/library/urllib.request.html',
    packages: [],
    intro: [
      'Most real Python is a script like this one: pull data from a service, clean it, and write something a person or another system uses. You will write `orders-report`, which reads every page of an orders API,',
      con(String.raw`
GET /orders?page=1   ->  {"orders": [{"id": 1, "customer": "ann", "total": "19.99", "created": "2026-10-01T09:30:00"}, ...],
                          "next": "/orders?page=2"}`),
      'skips the records that are broken, and writes `customers.csv` (orders and total per customer) and `summary.json`.',
      '| Step | What it adds | Runs |\n|---|---|---|\n| 1 | parse and check the JSON, money as `Decimal` | either Python |\n| 2 | fetch a page with `urllib.request` | your PC |\n| 3 | follow the pages, lazily, with a generator | your PC |\n| 4 | retry on 503 and 429, with backoff | your PC |\n| 5 | the CSV and JSON report, and the command line | your PC |',
      'Only the standard library is used, so it runs anywhere Python does. From step 2 on, the program starts a **stand-in API**, Python\'s own web server serving two JSON files, so it runs offline; the checks bring a fake API of their own that can be told to fail on purpose.'
    ].join('\n\n'),
    java: [
      'In Java this is `HttpClient` plus Jackson, `BigDecimal` for money, and a CSV library such as OpenCSV. The Python versions come with the language:',
      '| Java | Python |\n|---|---|\n| `HttpClient.send(request, BodyHandlers.ofString())` | `urllib.request.urlopen(request)` |\n| Jackson `ObjectMapper.readTree` | `json.loads` (gives dicts and lists) |\n| `BigDecimal` | `decimal.Decimal` |\n| a record | a frozen dataclass |\n| Resilience4j `Retry` | a loop with `try`/`except` and `time.sleep` |\n| OpenCSV `CSVWriter` | `csv.writer` |\n| a `Stream` over pages | a generator with `yield from` |',
      'One behaviour differs: Java\'s `HttpClient` returns a 404 or 503 response like any other, while `urlopen` **raises** `urllib.error.HTTPError` for any status of 400 or more. Many teams use the `requests` or `httpx` packages instead of `urllib`; the code keeps the same shape.'
    ].join('\n\n'),
    finish: [
      'Download step 5\'s code and save it as `orders_report.py`. Point it at a real API by its first page\'s URL (the `stand_in_api()` part is only for running offline here):',
      con(String.raw`
python orders_report.py --api https://shop.example.com/api/orders?page=1 --out report
python orders_report.py --api ... --since 2026-10-01      # only October onwards
python orders_report.py --help`),
      'To run it every night: Windows Task Scheduler (`schtasks /create /sc daily /st 06:00 /tr "python C:\\path\\orders_report.py --api ..."`), or `cron` on Linux. Write problems to standard error, as it does, so a scheduler\'s log shows them.',
      'With the `httpx` package (`python -m pip install httpx`), fetching and retrying get shorter:',
      norun(String.raw`
import httpx

transport = httpx.HTTPTransport(retries=3)          # retries connection failures
with httpx.Client(transport=transport, timeout=5, headers={"User-Agent": "orders-report/1.0"}) as client:
    response = client.get(url)
    response.raise_for_status()                     # an error status raises, as urlopen does
    page = response.json()`),
      'For larger data, `pandas` reads the CSV straight into a table (`pandas.read_csv("report/customers.csv")`) for grouping and charts, roughly where Java would reach for Spark or a database.'
    ].join('\n\n'),
    steps: [
      {
        title: 'Parse and check the JSON',
        summary: 'json.loads, a frozen dataclass per order, money as Decimal, and broken records skipped with a reason instead of stopping the run.',
        body: [
          '`json.loads(text)` turns JSON into Python values: objects become dicts, arrays lists, numbers `int` or `float`, `null` `None`. There are no classes to declare, as Jackson needs; you check the fields yourself and build the objects you want.',
          '**Money is never a float.** `0.1 + 0.2` is `0.30000000000000004` in Python as in Java. `decimal.Decimal` is `BigDecimal`: `Decimal("0.1") + Decimal("0.2") == Decimal("0.3")`. Build it **from text**: `Decimal(0.1)` copies the float\'s binary error, so for a total the API sent as a JSON number, write `Decimal(str(raw["total"]))`. A text that is not a number raises `decimal.InvalidOperation`.',
          java(String.raw`
BigDecimal total = new BigDecimal(node.get("total").asText());     // from text, never from a double`),
          'Real data has broken records. A script that stops at the first one helps nobody, so each bad order is **skipped and reported**: `parse_order` raises a `ValueError` saying what is wrong, and `parse_page` collects those messages. A text that is not JSON at all is another matter: `json.loads` raises `json.JSONDecodeError` (a `ValueError`), and the whole page is unusable.',
          '`@dataclass` with `field(default_factory=list)` gives each `Page` its own list, the dataclass way of avoiding a shared default.'
        ].join('\n\n'),
        task: [
          '1. `parse_order(raw)` returns an `Order` with `id` an int, `customer` stripped and lower-case, `total` a `Decimal` (the API sends it as text or as a number) and `created` a `datetime`. Otherwise it raises `ValueError` with one of: `missing customer` (any of the four fields), `bad total \'abc\'`, `negative total -5.00`, `bad date \'2026-13-01\'`.',
          '2. `parse_page(text)` returns a `Page`: the good orders in order, `next` (the next page\'s link, or `None` when there is none), and `problems`, one `"order <id>: <message>"` per skipped order.'
        ].join('\n\n'),
        starter: IMPORTS_1 + String.raw`

@dataclass(frozen=True)
class Order:
    id: int
    customer: str
    total: Decimal
    created: datetime


@dataclass
class Page:
    """One page of the API's answer: its good orders, the link to the next page, what was wrong."""
    orders: list
    next: str | None = None
    problems: list = field(default_factory=list)


def parse_order(raw):
    return Order(raw["id"], raw["customer"], float(raw["total"]), raw["created"])


def parse_page(text):
    data = json.loads(text)
    return Page(orders=[parse_order(raw) for raw in data["orders"]], next=data["next"])
` + DEMO_1,
        solution: IMPORTS_1 + PARSE + DEMO_1,
        hints: [
          'Check the four keys first: `for key in ("id", "customer", "total", "created"): if key not in raw: raise ValueError(f"missing {key}")`.',
          '`Decimal(str(raw["total"]))` inside `try` / `except InvalidOperation:`; `datetime.fromisoformat(...)` inside `try` / `except ValueError:`. Raise your own `ValueError` with the message, `from None`.',
          'In `parse_page`, `data.get("next")` is `None` when the key is missing. Wrap each `parse_order` in `try` / `except ValueError as e:` and append `f"order {raw.get(\'id\', \'?\')}: {e}"`.'
        ],
        checks: [
          { label: 'An order is converted: id, customer, Decimal total, datetime', code: String.raw`from datetime import datetime
from decimal import Decimal
o = parse_order({"id": "1", "customer": " Ann ", "total": "19.99", "created": "2026-10-01T09:30:00"})
assert o == Order(1, "ann", Decimal("19.99"), datetime(2026, 10, 1, 9, 30)), f"got {o!r}"` },
          { label: 'Money is exact, whether the API sent text or a number', code: String.raw`from decimal import Decimal
a = parse_order({"id": 1, "customer": "a", "total": "0.10", "created": "2026-10-01T00:00:00"})
b = parse_order({"id": 2, "customer": "b", "total": 0.20, "created": "2026-10-01T00:00:00"})
assert isinstance(a.total, Decimal) and a.total + b.total == Decimal("0.30"), f"{a.total!r} + {b.total!r}"` },
          { label: 'Each broken order raises `ValueError` with its message', code: String.raw`def message(**raw):
    base = {"id": 9, "customer": "x", "total": "1.00", "created": "2026-10-01T00:00:00"}
    base.update(raw)
    base = {k: v for k, v in base.items() if v is not None}
    try:
        parse_order(base)
    except ValueError as e:
        return str(e)
    return "no error"
assert message(customer=None) == "missing customer", message(customer=None)
assert message(total="abc") == "bad total 'abc'", message(total="abc")
assert message(total="-5.00") == "negative total -5.00", message(total="-5.00")
assert message(created="2026-13-01") == "bad date '2026-13-01'", message(created="2026-13-01")` },
          { label: '`parse_page`: good orders, the next link, a problem per skipped order', code: String.raw`import json
text = json.dumps({"orders": [
    {"id": 1, "customer": "a", "total": "1.00", "created": "2026-10-01T00:00:00"},
    {"id": 3, "total": "7.00", "created": "2026-10-02T00:00:00"},
    {"id": 4, "customer": "c", "total": "abc", "created": "2026-10-03T00:00:00"},
    {"id": 5, "customer": "d", "total": 2, "created": "2026-10-04T00:00:00"}], "next": "/orders?page=2"})
page = parse_page(text)
assert [o.id for o in page.orders] == [1, 5] and page.next == "/orders?page=2", page
assert page.problems == ["order 3: missing customer", "order 4: bad total 'abc'"], page.problems` },
          { label: 'The last page: no `next`', code: String.raw`assert parse_page('{"orders": []}').next is None and parse_page('{"orders": [], "next": null}').next is None` },
          { label: 'Text that is not JSON raises `ValueError`', code: String.raw`try:
    parse_page("<html>Bad gateway</html>")
except ValueError:
    pass
else:
    raise AssertionError("a page that is not JSON should raise ValueError")` }
        ]
      },
      {
        title: 'Fetch a page over HTTP',
        summary: 'urllib.request with headers and a timeout, reading and decoding the body, and HTTPError for an error status.',
        runtimes: ['server'], runtimeWhy: WHY,
        body: [
          '`urllib.request` is the standard library\'s HTTP client. Build a `Request` with the headers you send, open it with a **timeout** (without one, a server that never answers blocks your script forever), read the body as bytes and decode it:',
          norun(String.raw`
request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "orders-report/1.0"})
with urllib.request.urlopen(request, timeout=5) as response:
    text = response.read().decode("utf-8")`),
          java(String.raw`
HttpRequest request = HttpRequest.newBuilder(URI.create(url))
    .header("Accept", "application/json").timeout(Duration.ofSeconds(5)).build();
String text = client.send(request, HttpResponse.BodyHandlers.ofString()).body();`),
          '| What happens | urllib |\n|---|---|\n| status 200 | the response; `.status`, `.headers`, `.read()` |\n| status 400 or more | raises `urllib.error.HTTPError` (with `.code` and `.headers`) |\n| no connection, a bad host | raises `urllib.error.URLError` (with `.reason`) |\n| too slow | raises `TimeoutError`, or a `URLError` wrapping it |',
          'Send a `User-Agent` naming your script: API owners use it to see who calls them, and some refuse the default `Python-urllib/3.13`.',
          'The `stand_in_api()` function at the end of the program serves two pages from files with `http.server`, which is also a one-liner in a terminal (`python -m http.server`, Java 18\'s `jwebserver`). It runs only under `if __name__ == "__main__":`, so the checks never start it.'
        ].join('\n\n'),
        task: [
          '1. `fetch_text(url, timeout=5)` sends a GET with the headers `Accept: application/json` and `User-Agent: orders-report/1.0`, gives up after `timeout` seconds, and returns the body decoded as UTF-8. An error status raises `urllib.error.HTTPError` (urlopen does that already: do not hide it).',
          '2. `fetch_page(url)` returns the `Page` for that URL.'
        ].join('\n\n'),
        starter: IMPORTS_2 + PARSE + String.raw`

USER_AGENT = "orders-report/1.0"


def fetch_text(url, timeout=5):
    """GET url -> the body as text. An HTTP error status raises urllib.error.HTTPError."""
    return "{}"


def fetch_page(url):
    return parse_page(fetch_text(url))
` + STAND_IN + DEMO_2,
        solution: IMPORTS_2 + PARSE + FETCH + STAND_IN + DEMO_2,
        hints: [
          '`request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT})`.',
          '`with urllib.request.urlopen(request, timeout=timeout) as response:` then `return response.read().decode("utf-8")`.'
        ],
        checks: [
          { label: '`fetch_text` returns the body', code: FAKE_API + String.raw`with FakeApi(THREE_PAGES) as api:
    text = fetch_text(api.url + "/orders?page=1")
assert _json.loads(text) == THREE_PAGES["/orders?page=1"], text[:200]` },
          { label: 'It sends `Accept` and `User-Agent`', code: FAKE_API + String.raw`with FakeApi(THREE_PAGES) as api:
    fetch_text(api.url + "/orders?page=1")
headers = api.hits[-1][1]
assert headers.get("accept") == "application/json", headers
assert headers.get("user-agent") == "orders-report/1.0", headers` },
          { label: 'A 404 raises `HTTPError` with code 404', code: FAKE_API + String.raw`import urllib.error
with FakeApi(THREE_PAGES) as api:
    try:
        fetch_text(api.url + "/nothing-here")
    except urllib.error.HTTPError as e:
        assert e.code == 404, e.code
    else:
        raise AssertionError("a 404 should raise urllib.error.HTTPError")` },
          { label: 'A server too slow for the timeout raises instead of waiting', code: FAKE_API + String.raw`import time, urllib.error
with FakeApi(THREE_PAGES, delay=2) as api:
    t0 = time.monotonic()
    try:
        fetch_text(api.url + "/orders?page=1", timeout=0.3)
    except (TimeoutError, urllib.error.URLError):
        took = time.monotonic() - t0
    else:
        raise AssertionError("with timeout=0.3 a 2-second answer should raise")
    assert took < 1.5, f"it waited {took:.1f} s: pass the timeout to urlopen"` },
          { label: '`fetch_page` parses what it fetched', code: FAKE_API + String.raw`with FakeApi(THREE_PAGES) as api:
    page = fetch_page(api.url + "/orders?page=2")
assert [o.id for o in page.orders] == [3] and page.next == "/orders?page=3" and len(page.problems) == 1, page` }
        ]
      },
      {
        title: 'Follow the pages',
        summary: 'A generator that yields every order of every page, fetching the next page only when it is needed, resolving relative links, and refusing to loop.',
        runtimes: ['server'], runtimeWhy: WHY,
        body: [
          'An API splits a long list into pages, each with a link to the next. A **generator** hides that: the caller writes `for order in iter_orders(first_url):` and never sees a page. It is also **lazy**: the next page is fetched only when the loop asks for an order beyond the current page, so a caller that stops early (`next(...)`, a `break`, `itertools.islice`) never downloads the rest. That is a Java `Stream` whose source fetches on demand, built from a `while` loop and `yield from` (the [[lesson:py-generators]] and [[lesson:py-yield-from]] lessons).',
          java(String.raw`
Stream<Order> orders = Stream.iterate(firstPage, Objects::nonNull, page -> page.next() == null ? null : fetch(page.next()))
    .flatMap(page -> page.orders().stream());`),
          '`next` links are often **relative** (`/orders?page=2` or `orders-2.json`). `urllib.parse.urljoin(current_url, link)` resolves one against the page it came from, exactly as a browser resolves a link, and leaves an absolute link alone.',
          'Defensive code for a data script: an API with a bug can send a `next` link back to a page already read. Keep the URLs seen in a set and raise an error rather than loop forever.'
        ].join('\n\n'),
        task: [
          'Write a generator `iter_orders(url, problems=None)` that yields every order, page after page, starting at `url`:',
          '- fetch each page only when it is needed;\n- follow `next` with `urllib.parse.urljoin`, so relative and absolute links both work; stop when there is none;\n- add each page\'s problems to `problems` when a list is given;\n- raise `ValueError` if a page\'s `next` leads back to a page already read.'
        ].join('\n\n'),
        starter: IMPORTS_3 + PARSE + FETCH + String.raw`

def iter_orders(url, problems=None):
    page = fetch_page(url)
    return page.orders
` + STAND_IN + DEMO_3,
        solution: IMPORTS_3 + PARSE + FETCH + PAGES + STAND_IN + DEMO_3,
        hints: [
          '`while url:` fetch the page, `yield from page.orders`, then `url = urllib.parse.urljoin(url, page.next) if page.next else None`.',
          'Before fetching, `if url in seen: raise ValueError(...)`, then `seen.add(url)`. And `if problems is not None: problems.extend(page.problems)`.'
        ],
        checks: [
          { label: 'Every order of three pages, in order', code: FAKE_API + String.raw`with FakeApi(THREE_PAGES) as api:
    ids = [o.id for o in iter_orders(api.url + "/orders?page=1")]
assert ids == [1, 2, 3, 5], ids` },
          { label: 'Lazy: the first order needs only the first page', code: FAKE_API + String.raw`with FakeApi(THREE_PAGES) as api:
    first = next(iter(iter_orders(api.url + "/orders?page=1")))
assert first.id == 1 and [p for p, _ in api.hits] == ["/orders?page=1"], f"requests made: {[p for p, _ in api.hits]}"` },
          { label: 'Relative and absolute `next` links', code: FAKE_API + String.raw`pages = {"/a/one": {"orders": [order(1)], "next": "two"}, "/a/two": {"orders": [order(2)], "next": None}}
with FakeApi(pages) as api:
    pages["/a/two"]["next"] = api.url + "/b/three"
    pages["/b/three"] = {"orders": [order(3)], "next": None}
    ids = [o.id for o in iter_orders(api.url + "/a/one")]
assert ids == [1, 2, 3], ids` },
          { label: 'Problems from every page', code: FAKE_API + String.raw`problems = []
with FakeApi(THREE_PAGES) as api:
    list(iter_orders(api.url + "/orders?page=1", problems))
assert problems == ["order 4: missing total"], problems` },
          { label: 'A loop back to a page already read raises `ValueError`', code: FAKE_API + String.raw`pages = {"/p1": {"orders": [order(1)], "next": "/p2"}, "/p2": {"orders": [order(2)], "next": "/p1"}}
with FakeApi(pages) as api:
    try:
        for _ in iter_orders(api.url + "/p1"):
            pass
    except ValueError:
        pass
    else:
        raise AssertionError("pages that loop should raise ValueError")
assert len(api.hits) == 2, f"{len(api.hits)} requests"` },
          { label: 'It is a generator', code: String.raw`import types
assert isinstance(iter_orders("http://127.0.0.1:0/"), types.GeneratorType), "use yield, so nothing is fetched until the loop asks"` }
        ]
      },
      {
        title: 'Retries with backoff',
        summary: 'Try again on 503, 429 and connection errors, waiting longer each time or as long as Retry-After says, with the sleep passed in so tests do not wait.',
        runtimes: ['server'], runtimeWhy: WHY,
        body: [
          'Services fail for a moment: a deploy, an overloaded instance, a rate limit. A script that gives up at the first **503 Service Unavailable** or **429 Too Many Requests** fails every few nights for nothing. The standard answer is to **retry with exponential backoff**: wait 0.5 s, then 1 s, then 2 s, so a struggling server gets room. When the server sends a `Retry-After` header (seconds), wait that long instead.',
          'Retry only what can succeed later. A 404 or a 400 will be the same next time: raise it at once. And retry only requests that are safe to repeat, such as this GET; repeating a POST can create the order twice.',
          java(String.raw`
RetryConfig config = RetryConfig.custom()
    .maxAttempts(3)
    .intervalFunction(IntervalFunction.ofExponentialBackoff(500, 2))
    .retryOnResult(response -> response.statusCode() == 503 || response.statusCode() == 429)
    .build();`),
          'Two details. **The order of `except` clauses**: `HTTPError` is a subclass of `URLError`, so it must come first, or the general clause catches it. **Testability**: a test cannot wait seconds for every retry, so the sleeping function is a parameter, `sleep=time.sleep`. A test passes `sleep=waits.append` and gets the list of waits instead, the way a Java test injects a `Clock`.'
        ].join('\n\n'),
        task: [
          'Change `fetch_text` to `fetch_text(url, timeout=5, attempts=3, sleep=time.sleep)`:',
          '- a **429 or 503** answer, or a connection problem (`urllib.error.URLError`, `ConnectionError`, `TimeoutError`), is tried again, up to `attempts` tries in all;\n- before each retry, call `sleep(seconds)`: the `Retry-After` header\'s value when the answer has one, otherwise 0.5, then 1, then 2...;\n- any other error status is raised at once; after the last attempt, the last error is raised; no sleep after the last attempt.'
        ].join('\n\n'),
        starter: IMPORTS_4 + PARSE + FETCH + PAGES + STAND_IN + String.raw`

if __name__ == "__main__":
    base, server = stand_in_api()
    print(len(list(iter_orders(base + "orders-1.json"))), "orders")
    server.shutdown()
`,
        solution: IMPORTS_4 + PARSE + FETCH_RETRY + PAGES + STAND_IN + DEMO_4,
        hints: [
          '`for attempt in range(1, attempts + 1):` with a `try` around the `urlopen` that returns. In `except urllib.error.HTTPError as e:`, re-raise unless `e.code in (429, 503)` and attempts are left; otherwise work out the wait.',
          'The wait: `float(e.headers.get("Retry-After") or 0.5 * 2 ** (attempt - 1))`. Then a second `except (urllib.error.URLError, ConnectionError, TimeoutError):` for connection problems, after the `HTTPError` one.',
          'Call `sleep(wait)` at the end of the loop body, after the `try`; a `raise` on the last attempt means it is never reached then.'
        ],
        checks: [
          { label: 'Two 503s, then success: waits 0.5 s and 1 s', code: FAKE_API + String.raw`waits = []
with FakeApi(THREE_PAGES, fail={"/orders?page=1": [(503, None), (503, None)]}) as api:
    text = fetch_text(api.url + "/orders?page=1", sleep=waits.append)
assert _json.loads(text)["next"] == "/orders?page=2", text[:100]
assert len(api.hits) == 3 and waits == [0.5, 1.0], f"{len(api.hits)} requests, waits {waits}"` },
          { label: 'A 429 with `Retry-After: 2` waits 2 s', code: FAKE_API + String.raw`waits = []
with FakeApi(THREE_PAGES, fail={"/orders?page=1": [(429, 2)]}) as api:
    fetch_text(api.url + "/orders?page=1", sleep=waits.append)
assert waits == [2.0], waits` },
          { label: 'A 404 is raised at once: one request, no wait', code: FAKE_API + String.raw`import urllib.error
waits = []
with FakeApi(THREE_PAGES) as api:
    try:
        fetch_text(api.url + "/missing", sleep=waits.append)
    except urllib.error.HTTPError as e:
        assert e.code == 404
    else:
        raise AssertionError("a 404 should raise HTTPError")
assert len(api.hits) == 1 and waits == [], f"{len(api.hits)} requests, waits {waits}"` },
          { label: '503 every time: gives up after 3 tries, raising the 503', code: FAKE_API + String.raw`import urllib.error
waits = []
with FakeApi(THREE_PAGES, fail={"/orders?page=1": [(503, None)] * 5}) as api:
    try:
        fetch_text(api.url + "/orders?page=1", sleep=waits.append)
    except urllib.error.HTTPError as e:
        assert e.code == 503
    else:
        raise AssertionError("after 3 failed tries it should raise the last error")
assert len(api.hits) == 3 and waits == [0.5, 1.0], f"{len(api.hits)} requests, waits {waits}"` },
          { label: 'A connection problem is retried too', code: String.raw`import urllib.error
waits = []
try:
    fetch_text("http://127.0.0.1:0/", sleep=waits.append)        # nothing can listen on port 0
except urllib.error.URLError:
    pass
else:
    raise AssertionError("an address that cannot be reached should raise URLError")
assert waits == [0.5, 1.0], f"waits {waits}"` },
          { label: 'By default it really sleeps (`sleep=time.sleep`)', code: String.raw`import inspect, time
assert inspect.signature(fetch_text).parameters["sleep"].default is time.sleep` }
        ]
      },
      {
        title: 'The report and its command line',
        summary: 'A CSV per customer and a JSON summary, Decimal formatted as money, csv with newline="", and argparse with a required option and a date type.',
        runtimes: ['server'], runtimeWhy: WHY,
        body: [
          '**CSV.** `csv.writer` quotes fields that need it (a comma in a name) and writes the line endings CSV expects. Open the file with `newline=""`: otherwise, on Windows, every row would end in `\\r\\r\\n` and Excel would show a blank line between rows.',
          norun(String.raw`
with path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["customer", "orders", "total"])
    writer.writerow(["ann", 2, "27.49"])`),
          '**Money in output.** `f"{total:.2f}"` writes a `Decimal` with two decimals. JSON has no decimal type: `json.dumps` refuses a `Decimal`, and converting it to `float` would bring the rounding errors back. Write money into JSON as a **string**, `"152.50"`, as payment APIs do.',
          '**Grouping.** `defaultdict(lambda: [0, Decimal("0")])` starts each customer at no orders and no money: `groupingBy` with a collector, by hand. Sort the customers by total, highest first, with `key=lambda item: (-total, name)`.',
          '**The command line**, as in the [[project:cli]] project: `--api` is `required=True`, `--since` has a `type` that turns `2026-10-05` into a `date` (a bad date is argparse\'s job, exit code 2), and `main` returns 0. Problems go to standard error, the result line to standard output.',
          java(String.raw`
try (CSVWriter writer = new CSVWriter(Files.newBufferedWriter(path))) {
    writer.writeNext(new String[] {"customer", "orders", "total"});
}`)
        ].join('\n\n'),
        task: [
          '1. `write_report(orders, folder)` creates `folder` if needed and writes:',
          '- `customers.csv`: a header `customer,orders,total`, then one row per customer with the number of orders and the total with two decimals, biggest total first (ties alphabetically);\n- `summary.json`: `{"orders": 4, "customers": 3, "revenue": "152.50", "first": "2026-10-01T09:30:00", "last": "2026-10-06T16:45:00"}`, revenue as a string with two decimals, `first` and `last` the earliest and latest `created` (`None` with no orders).',
          'It returns the two paths.',
          '2. `main(argv=None)`: `--api URL` (required), `--out FOLDER` (default `report`), `--since 2026-10-05` (only orders created on or after that day). It reads every page, prints each problem to standard error as `skipped order 3: ...`, writes the report, prints `wrote ... and ... (N orders)`, and returns 0.'
        ].join('\n\n'),
        starter: IMPORTS_5 + PARSE + FETCH_RETRY + PAGES + String.raw`

def write_report(orders, folder):
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    with open(folder / "customers.csv", "w") as f:
        for o in orders:
            f.write(f"{o.customer},{o.total}\n")
    return folder / "customers.csv", None


def main(argv=None):
    return 0
` + STAND_IN + DEMO_5,
        solution: IMPORTS_5 + PARSE + FETCH_RETRY + PAGES + REPORT + STAND_IN + DEMO_5,
        hints: [
          'Totals per customer: `per_customer = defaultdict(lambda: [0, Decimal("0")])`, then for each order add 1 and its total. Sort `per_customer.items()` with `key=lambda item: (-item[1][1], item[0])`.',
          '`with csv_path.open("w", newline="", encoding="utf-8") as f:` and `csv.writer(f).writerow([...])`. In the summary, `f"{revenue:.2f}"` and `created.isoformat()`.',
          'In `main`: `problems = []`, `orders = [o for o in iter_orders(args.api, problems) if args.since is None or o.created.date() >= args.since]`.'
        ],
        checks: [
          { label: '`customers.csv`: header, then biggest total first', code: ORDERS + String.raw`import csv
csv_path, json_path = write_report(ORDERS, "out1")
with open(csv_path, newline="", encoding="utf-8") as f:
    rows = list(csv.reader(f))
assert rows == [["customer", "orders", "total"], ["cy", "1", "120.00"], ["ann", "2", "27.49"], ["bob", "1", "5.01"]], rows` },
          { label: 'No blank lines between rows (`newline=""`)', code: ORDERS + String.raw`csv_path, _ = write_report(ORDERS, "out2")
raw = open(csv_path, "rb").read()
assert b"\r\r\n" not in raw and raw.count(b"\n") == 4, raw[:120]` },
          { label: '`summary.json`: counts, revenue as text, first and last', code: ORDERS + String.raw`import json
_, json_path = write_report(ORDERS, "out3")
data = json.loads(open(json_path, encoding="utf-8").read())
assert data == {"orders": 4, "customers": 3, "revenue": "152.50", "first": "2026-10-01T09:30:00", "last": "2026-10-06T16:45:00"}, data` },
          { label: 'No orders: a header and an empty summary', code: String.raw`import json
csv_path, json_path = write_report([], "out4")
assert open(csv_path, encoding="utf-8").read().splitlines() == ["customer,orders,total"]
assert json.loads(open(json_path, encoding="utf-8").read()) == {"orders": 0, "customers": 0, "revenue": "0.00", "first": None, "last": None}` },
          { label: '`main` end to end: two pages, a skipped order, the report', code: FAKE_API + CALL_MAIN + String.raw`import json
with FakeApi(REPORT_PAGES) as api:
    code, out, err = run_main("--api", api.url + "/orders?page=1", "--out", "out5")
assert code == 0 and "(4 orders)" in out, f"exit code {code}, stdout {out!r}, stderr {err!r}"
assert err == "skipped order 3: bad total 'oops'\n", f"stderr {err!r}"
assert json.loads(open("out5/summary.json", encoding="utf-8").read())["revenue"] == "152.50"` },
          { label: '`--since` keeps later orders; `--api` is required', code: FAKE_API + CALL_MAIN + String.raw`import json
with FakeApi(REPORT_PAGES) as api:
    code, out, err = run_main("--api", api.url + "/orders?page=1", "--out", "out6", "--since", "2026-10-05")
assert code == 0 and "(2 orders)" in out, f"exit code {code}, stdout {out!r}"
assert json.loads(open("out6/summary.json", encoding="utf-8").read())["revenue"] == "127.50"
assert run_main()[0] == 2 and run_main("--api", "x", "--since", "soon")[0] == 2` }
        ]
      }
    ]
  });
})(window.PYLT);
