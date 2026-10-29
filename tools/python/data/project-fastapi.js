/*
 * Project: a REST API with FastAPI, next to Spring Boot. The project shape is described at the top of
 * data/project-cli.js.
 *
 * Steps 1 and 2 need pydantic, steps 3 to 5 FastAPI (whose TestClient needs httpx): PyPI packages, so
 * every step runs on the Python on your PC. The program calls its own API through FastAPI's TestClient,
 * which hands each request straight to the app: no server, no port. The checks do the same.
 */
(function (U) {
  var P = U.data.projects = U.data.projects || [];

  function fence(lang, src) { return '```' + lang + '\n' + src.replace(/^\n+|\s+$/g, '') + '\n```'; }
  function java(src) { return fence('java', src); }
  function con(src) { return fence('console', src); }
  function norun(src) { return fence('python-norun', src); }

  var WHY_PYDANTIC = '**pydantic** is a package from PyPI, and the in-browser Python here does not load packages: this step runs on the Python on your PC.';
  var WHY_FASTAPI = '**FastAPI** is a package from PyPI, and the in-browser Python here does not load packages: this step runs on the Python on your PC.';

  /* ---------- the program, piece by piece ---------- */

  var IMPORTS_1 = String.raw`from pydantic import BaseModel, ConfigDict, Field, ValidationError
`;
  var IMPORTS_2 = String.raw`import itertools

from pydantic import BaseModel, ConfigDict, Field, ValidationError
`;
  var IMPORTS_3 = String.raw`import itertools

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel, ConfigDict, Field
`;
  var IMPORTS_4 = String.raw`import itertools
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from pydantic import BaseModel, ConfigDict, Field
`;
  var IMPORTS_5 = String.raw`import itertools
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from pydantic import BaseModel, ConfigDict, Field
`;

  var MODELS = String.raw`

class BookmarkIn(BaseModel):
    """What a client sends to save a bookmark."""
    model_config = ConfigDict(str_strip_whitespace=True)

    url: str = Field(pattern=r"^https?://\S+$")
    title: str = Field(min_length=1, max_length=100)
    tags: list[str] = []


class Bookmark(BookmarkIn):
    """A saved bookmark: what the client sent, plus its id."""
    id: int
`;

  var REPOSITORY = String.raw`

class DuplicateUrl(Exception):
    """A bookmark with this URL is already saved."""


class BookmarkRepository:
    """Bookmarks kept in memory, with ids that are never reused."""

    def __init__(self):
        self._items = {}                      # id -> Bookmark, in the order they were added
        self._ids = itertools.count(1)

    def add(self, data):
        if any(b.url == data.url for b in self._items.values()):
            raise DuplicateUrl(data.url)
        bookmark = Bookmark(id=next(self._ids), **data.model_dump())
        self._items[bookmark.id] = bookmark
        return bookmark

    def find(self, bookmark_id):
        return self._items.get(bookmark_id)

    def find_all(self, tag=None):
        return [b for b in self._items.values() if tag is None or tag in b.tags]

    def delete(self, bookmark_id):
        return self._items.pop(bookmark_id, None) is not None
`;

  var ROUTES_3 = String.raw`

app = FastAPI(title="Bookmarks")
repo = BookmarkRepository()


@app.post("/bookmarks", status_code=201)
def create_bookmark(data: BookmarkIn) -> Bookmark:
    return repo.add(data)


@app.get("/bookmarks")
def list_bookmarks(tag: str | None = None) -> list[Bookmark]:
    return repo.find_all(tag)


@app.get("/bookmarks/{bookmark_id}")
def get_bookmark(bookmark_id: int) -> Bookmark:
    bookmark = repo.find(bookmark_id)
    if bookmark is None:
        raise HTTPException(status_code=404, detail="no such bookmark")
    return bookmark


@app.delete("/bookmarks/{bookmark_id}", status_code=204)
def delete_bookmark(bookmark_id: int) -> None:
    if not repo.delete(bookmark_id):
        raise HTTPException(status_code=404, detail="no such bookmark")
`;

  var ROUTES_4 = String.raw`

app = FastAPI(title="Bookmarks")
repo = BookmarkRepository()


@app.exception_handler(DuplicateUrl)
def duplicate_url(request, exc):
    return JSONResponse(status_code=409, content={"detail": f"already saved: {exc}"})


@app.post("/bookmarks", status_code=201)
def create_bookmark(data: BookmarkIn) -> Bookmark:
    return repo.add(data)


@app.get("/bookmarks")
def list_bookmarks(tag: str | None = None,
                   limit: Annotated[int, Query(ge=1, le=100)] = 20,
                   offset: Annotated[int, Query(ge=0)] = 0) -> list[Bookmark]:
    return repo.find_all(tag)[offset:offset + limit]


@app.get("/bookmarks/{bookmark_id}")
def get_bookmark(bookmark_id: int) -> Bookmark:
    bookmark = repo.find(bookmark_id)
    if bookmark is None:
        raise HTTPException(status_code=404, detail="no such bookmark")
    return bookmark


@app.delete("/bookmarks/{bookmark_id}", status_code=204)
def delete_bookmark(bookmark_id: int) -> None:
    if not repo.delete(bookmark_id):
        raise HTTPException(status_code=404, detail="no such bookmark")
`;

  var ROUTES_5 = String.raw`

app = FastAPI(title="Bookmarks")
repo = BookmarkRepository()


def get_repo():
    """The repository the routes use. A test replaces it through app.dependency_overrides."""
    return repo


Repo = Annotated[BookmarkRepository, Depends(get_repo)]


@app.exception_handler(DuplicateUrl)
def duplicate_url(request, exc):
    return JSONResponse(status_code=409, content={"detail": f"already saved: {exc}"})


@app.post("/bookmarks", status_code=201)
def create_bookmark(data: BookmarkIn, repo: Repo) -> Bookmark:
    return repo.add(data)


@app.get("/bookmarks")
def list_bookmarks(repo: Repo, tag: str | None = None,
                   limit: Annotated[int, Query(ge=1, le=100)] = 20,
                   offset: Annotated[int, Query(ge=0)] = 0) -> list[Bookmark]:
    return repo.find_all(tag)[offset:offset + limit]


@app.get("/bookmarks/{bookmark_id}")
def get_bookmark(bookmark_id: int, repo: Repo) -> Bookmark:
    bookmark = repo.find(bookmark_id)
    if bookmark is None:
        raise HTTPException(status_code=404, detail="no such bookmark")
    return bookmark


@app.delete("/bookmarks/{bookmark_id}", status_code=204)
def delete_bookmark(bookmark_id: int, repo: Repo) -> None:
    if not repo.delete(bookmark_id):
        raise HTTPException(status_code=404, detail="no such bookmark")


def client_with(repository):
    """A test client whose routes use this repository instead of the real one."""
    app.dependency_overrides[get_repo] = lambda: repository
    return TestClient(app)
`;

  var DEMO_1 = String.raw`

good = BookmarkIn(url="https://docs.python.org/3/", title="  Python docs ", tags=["python"])
print(good)
saved = Bookmark(id=1, **good.model_dump())
print(saved.model_dump_json())
try:
    BookmarkIn(url="docs.python.org", title="   ")
except ValidationError as e:
    for error in e.errors():
        print(error["loc"], error["msg"])
`;
  var DEMO_2 = String.raw`

repo = BookmarkRepository()
repo.add(BookmarkIn(url="https://docs.python.org/3/", title="Python docs", tags=["python"]))
repo.add(BookmarkIn(url="https://spring.io", title="Spring", tags=["java"]))
print(repo.find_all("python"))
print(repo.find(2))
try:
    repo.add(BookmarkIn(url="https://spring.io", title="Spring again"))
except DuplicateUrl as e:
    print("refused, already saved:", e)
`;
  var DEMO_3 = String.raw`

if __name__ == "__main__":
    client = TestClient(app)                 # sends requests straight to the app: no server, no port
    created = client.post("/bookmarks", json={"url": "https://fastapi.tiangolo.com", "title": "FastAPI", "tags": ["python"]})
    print(created.status_code, created.json())
    print(client.get("/bookmarks", params={"tag": "python"}).json())
    missing = client.get("/bookmarks/99")
    print(missing.status_code, missing.json())
`;
  var DEMO_4 = String.raw`

if __name__ == "__main__":
    client = TestClient(app)
    for site in ("https://fastapi.tiangolo.com", "https://pydantic.dev", "https://fastapi.tiangolo.com"):
        r = client.post("/bookmarks", json={"url": site, "title": site.split("//")[1]})
        print(r.status_code, r.json())
    print(client.get("/bookmarks", params={"limit": 1, "offset": 1}).json())
    bad = client.post("/bookmarks", json={"url": "nope", "title": ""})
    print(bad.status_code, [(e["loc"], e["msg"]) for e in bad.json()["detail"]])
`;
  var DEMO_5 = String.raw`

if __name__ == "__main__":
    fresh = BookmarkRepository()
    client = client_with(fresh)
    print(client.post("/bookmarks", json={"url": "https://pydantic.dev", "title": "Pydantic"}).status_code)
    print(len(fresh.find_all()), "bookmark in the test's repository,", len(repo.find_all()), "in the real one")
`;

  /* ---------- what the checks share ---------- */

  var EXPECT_ERROR = String.raw`def refused(**fields):
    """True when BookmarkIn refuses these fields with a ValidationError."""
    data = {"url": "https://example.com", "title": "Example", **fields}
    try:
        BookmarkIn(**data)
    except ValidationError:
        return True
    return False
`;
  var FRESH = String.raw`from fastapi.testclient import TestClient
repo.__init__()                       # start each check with no bookmarks
client = TestClient(app)


def post(url, title="A page", tags=()):
    return client.post("/bookmarks", json={"url": url, "title": title, "tags": list(tags)})
`;
  var DI = String.raw`from fastapi.routing import APIRoute
from fastapi.testclient import TestClient
app.dependency_overrides.clear()
repo.__init__()
`;

  P.push({
    id: 'fastapi', title: 'A REST API with FastAPI, next to Spring Boot',
    summary: 'A bookmarks service in five steps, each shown next to the Spring Boot code it replaces: pydantic models, a repository, routes, validation and error handlers, and dependency injection with test overrides.',
    keywords: ['fastapi', 'spring boot', 'rest', 'api', 'web', 'http', 'pydantic', 'validation', 'controller', 'dependency injection', 'depends', 'testclient', 'json', 'service', 'backend'],
    docs: 'https://docs.python.org/3/library/typing.html#typing.Annotated',
    packages: ['fastapi', 'httpx', 'pydantic'],
    intro: [
      'FastAPI is the Python web framework that feels most like Spring Boot: routes are functions with decorators (`@app.get` for `@GetMapping`), the request body is a typed class that is validated for you (pydantic for Bean Validation), and dependencies are injected by declaring them as parameters (`Depends` for `@Autowired`). It also writes an OpenAPI description and serves Swagger UI at `/docs`, as springdoc does.',
      'You will build a small bookmarks service, a step at a time:',
      '| Step | Python | Spring Boot |\n|---|---|---|\n| 1 | pydantic models with validation | a `record` with `@NotBlank`, `@Size`, `@Pattern` |\n| 2 | a repository class | `CrudRepository` |\n| 3 | routes: `@app.get`, `@app.post`... | `@RestController` with `@GetMapping`... |\n| 4 | 422 and 409 responses, query limits | `@Valid`, `@ExceptionHandler`, `@Min`/`@Max` |\n| 5 | `Depends`, `dependency_overrides` | `@Autowired`, `@MockBean` |',
      'Each step\'s program calls its own API through FastAPI\'s **TestClient**, which hands requests straight to the app with no server and no port, like Spring\'s `MockMvc`. "Run it for real" at the end starts the real server. Every step needs packages from PyPI (pydantic, then FastAPI); the step names any that are missing, with the install command.'
    ].join('\n\n'),
    java: [
      'The whole service, as Spring Boot would write it (step 5\'s state, roughly):',
      java(String.raw`
public record BookmarkIn(@Pattern(regexp = "https?://\\S+") String url,
                         @NotBlank @Size(max = 100) String title,
                         List<String> tags) {}

@RestController
@RequestMapping("/bookmarks")
class BookmarkController {
    private final BookmarkRepository repo;
    BookmarkController(BookmarkRepository repo) { this.repo = repo; }      // injected

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    Bookmark create(@Valid @RequestBody BookmarkIn data) { return repo.add(data); }

    @GetMapping("/{id}")
    Bookmark get(@PathVariable long id) {
        return repo.find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}`),
      'The same in FastAPI is a module, not a class: the routes are plain functions, and the "bean" they need is a parameter whose default says where it comes from. No component scan, no annotations processor: what you see is what runs. One real difference to know: a request that fails validation gets **422 Unprocessable Entity** in FastAPI, where Spring answers **400 Bad Request**.'
    ].join('\n\n'),
    finish: [
      'Download step 5\'s code as `main.py`. In a terminal, in a virtual environment:',
      con(String.raw`
python -m pip install fastapi uvicorn
uvicorn main:app --reload`),
      '`uvicorn` is the server (Spring Boot embeds Tomcat; FastAPI apps are served by uvicorn), `main:app` names the `app` object in `main.py`, and `--reload` restarts it when the file changes, like Spring DevTools. Then open:',
      '- http://127.0.0.1:8000/docs: Swagger UI, generated from the routes and the models: try every request in the browser;\n- http://127.0.0.1:8000/bookmarks: the list, as JSON;\n- http://127.0.0.1:8000/openapi.json: the OpenAPI description itself.',
      'The tests move to pytest (the [[project:pytest]] project), with the TestClient and an override per test:',
      norun(String.raw`
import pytest
from fastapi.testclient import TestClient
from main import BookmarkRepository, app, get_repo


@pytest.fixture
def client():
    app.dependency_overrides[get_repo] = lambda: BookmarkRepository()   # an empty one per test
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_create_then_get(client):
    created = client.post("/bookmarks", json={"url": "https://pydantic.dev", "title": "Pydantic"})
    assert created.status_code == 201
    assert client.get(f"/bookmarks/{created.json()['id']}").json()["title"] == "Pydantic"`),
      'For a real database, keep the routes and swap the repository: SQLAlchemy or SQLModel play the part of JPA.'
    ].join('\n\n'),
    steps: [
      {
        title: 'The model: pydantic',
        summary: 'Classes whose fields are checked when an object is made: a URL pattern, title lengths, a default list, a subclass with an id.',
        runtimes: ['server'], runtimeWhy: WHY_PYDANTIC, packages: ['pydantic'], timeout: 30,
        body: [
          'A pydantic model looks like a dataclass, but it **checks** the values it is given, converts them when it can, and raises `ValidationError` listing every problem at once. FastAPI uses these models for request and response bodies, so the validation is the API\'s.',
          java(String.raw`
public record BookmarkIn(
    @Pattern(regexp = "https?://\\S+") String url,
    @NotBlank @Size(max = 100) String title,
    List<String> tags) {}`),
          norun(String.raw`
class BookmarkIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    url: str = Field(pattern=r"^https?://\S+$")
    title: str = Field(min_length=1, max_length=100)
    tags: list[str] = []`),
          '| Bean Validation | pydantic |\n|---|---|\n| `@NotNull` | a field with no default is required |\n| `@NotBlank` | `min_length=1` with `str_strip_whitespace=True` |\n| `@Size(max = 100)` | `max_length=100` |\n| `@Pattern(regexp = ...)` | `pattern=...` |\n| `@Min(1)`, `@Max(100)` | `ge=1`, `le=100` |\n| `ConstraintViolationException` | `ValidationError`, with `.errors()` |',
          'A list default such as `tags: list[str] = []` is safe in a pydantic model: unlike a function\'s default (the [[lesson:py-mutable-defaults]] trap), pydantic copies it for every object. A subclass adds fields, so the saved `Bookmark` is the request plus an `id`. `model_dump()` turns a model into a dict, `model_dump_json()` into JSON: Jackson\'s job in Spring.'
        ].join('\n\n'),
        task: [
          '1. `BookmarkIn` has `url` (must start with `http://` or `https://` and contain no spaces), `title` (1 to 100 characters after surrounding spaces are stripped, so `"   "` is refused) and `tags` (a list of strings, empty by default). Anything else raises `ValidationError`.',
          '2. `Bookmark` is a `BookmarkIn` with an `id: int`.'
        ].join('\n\n'),
        starter: IMPORTS_1 + String.raw`

class BookmarkIn(BaseModel):
    url: str
    title: str
    tags: list[str] = []


class Bookmark(BaseModel):
    id: int
` + DEMO_1,
        solution: IMPORTS_1 + MODELS + DEMO_1,
        hints: [
          '`url: str = Field(pattern=r"^https?://\\S+$")` and `title: str = Field(min_length=1, max_length=100)`.',
          '`model_config = ConfigDict(str_strip_whitespace=True)` inside the class strips spaces before the checks run.',
          '`class Bookmark(BookmarkIn):` inherits every field and its checks; add `id: int`.'
        ],
        checks: [
          { label: 'A valid bookmark, with `tags` empty by default', code: String.raw`b = BookmarkIn(url="https://docs.python.org/3/", title="Python docs")
assert (b.url, b.title, b.tags) == ("https://docs.python.org/3/", "Python docs", [])` },
          { label: 'The URL must start with `http://` or `https://`', code: EXPECT_ERROR + String.raw`assert refused(url="docs.python.org") and refused(url="ftp://x.org") and refused(url="https://a b.org")
assert not refused(url="http://localhost:8000/x")` },
          { label: 'The title: 1 to 100 characters, surrounding spaces stripped', code: EXPECT_ERROR + String.raw`assert refused(title="") and refused(title="   ") and refused(title="x" * 101)
assert BookmarkIn(url="https://a.org", title="  Docs ").title == "Docs"` },
          { label: 'Two bookmarks never share a `tags` list', code: String.raw`a = BookmarkIn(url="https://a.org", title="a")
b = BookmarkIn(url="https://b.org", title="b")
a.tags.append("x")
assert b.tags == []` },
          { label: '`Bookmark` is a `BookmarkIn` plus an `id`', code: EXPECT_ERROR + String.raw`assert issubclass(Bookmark, BookmarkIn), "class Bookmark(BookmarkIn):"
data = BookmarkIn(url="https://a.org", title="A", tags=["t"])
assert Bookmark(id=7, **data.model_dump()).model_dump() == {"url": "https://a.org", "title": "A", "tags": ["t"], "id": 7}
try:
    Bookmark(id=1, url="nope", title="A")
except ValidationError:
    pass
else:
    raise AssertionError("a Bookmark checks its fields too")` },
          { label: 'Every problem is reported at once', code: String.raw`try:
    BookmarkIn(url="nope", title="")
except ValidationError as e:
    assert {err["loc"][0] for err in e.errors()} == {"url", "title"}, e.errors()
else:
    raise AssertionError("a bad url and an empty title should raise ValidationError")` }
        ]
      },
      {
        title: 'The repository',
        summary: 'Store, find, list by tag and delete bookmarks in memory, with ids that are never reused and a clear error for a duplicate URL.',
        runtimes: ['server'], runtimeWhy: WHY_PYDANTIC, packages: ['pydantic'], timeout: 30,
        body: [
          'The routes should not know how bookmarks are stored, so storage gets a class of its own: Spring Data\'s repository, written by hand. In memory, a dict from id to bookmark is enough; a database version would keep the same methods.',
          java(String.raw`
interface BookmarkRepository extends CrudRepository<Bookmark, Long> {
    List<Bookmark> findByTagsContaining(String tag);
}
// save(...), findById(id) -> Optional, findAll(), deleteById(id)`),
          '| Spring Data | here |\n|---|---|\n| `save(entity)` | `add(data)`: returns the `Bookmark` with its new id |\n| `findById(id)` returns `Optional` | `find(id)` returns the bookmark or `None` |\n| `findAll()` | `find_all(tag=None)`, in the order they were added |\n| `deleteById(id)` | `delete(id)`: `True` if it was there |',
          'Two traps from Java carry over. Storing the bookmarks in a **class attribute** (`items = {}` in the class body) is a `static` field: every repository would share it. Put it in `__init__` as `self._items`. And numbering with `len(items) + 1` reuses an id after a delete, so an old link would open a different bookmark. `itertools.count(1)` is a counter that only goes up: `next(self._ids)` gives 1, 2, 3...',
          'A duplicate URL is a domain error, not a crash: raise your own exception, `class DuplicateUrl(Exception)`, which step 4 turns into a 409 response.'
        ].join('\n\n'),
        task: [
          '`BookmarkRepository` keeps bookmarks in memory:',
          '- `add(data)` takes a `BookmarkIn`, stores and returns a `Bookmark` with the next id (1, 2, 3...; ids are **never reused**, even after a delete). A URL that is already saved raises `DuplicateUrl`.\n- `find(id)` returns the bookmark, or `None`.\n- `find_all(tag=None)` returns the bookmarks in the order they were added, only those with that tag when one is given.\n- `delete(id)` removes it and returns `True`, or returns `False` when there was none.',
          'Two repositories must not share bookmarks.'
        ].join('\n\n'),
        starter: IMPORTS_2 + MODELS + String.raw`

class DuplicateUrl(Exception):
    """A bookmark with this URL is already saved."""


class BookmarkRepository:
    items = {}

    def add(self, data):
        bookmark = Bookmark(id=len(self.items) + 1, **data.model_dump())
        self.items[bookmark.id] = bookmark
        return bookmark

    def find(self, bookmark_id):
        return self.items[bookmark_id]

    def find_all(self, tag=None):
        return list(self.items.values())

    def delete(self, bookmark_id):
        del self.items[bookmark_id]
        return True
` + DEMO_2,
        solution: IMPORTS_2 + MODELS + REPOSITORY + DEMO_2,
        hints: [
          'In `__init__`: `self._items = {}` and `self._ids = itertools.count(1)`. In `add`, `Bookmark(id=next(self._ids), **data.model_dump())`.',
          '`find` is `self._items.get(bookmark_id)`; `delete` is `self._items.pop(bookmark_id, None) is not None`.',
          'Before adding, `if any(b.url == data.url for b in self._items.values()): raise DuplicateUrl(data.url)`.'
        ],
        checks: [
          { label: 'Ids 1, 2, 3, never reused after a delete', code: String.raw`r = BookmarkRepository()
ids = [r.add(BookmarkIn(url=f"https://{n}.org", title=n)).id for n in ("a", "b", "c")]
assert ids == [1, 2, 3], ids
r.delete(3)
assert r.add(BookmarkIn(url="https://d.org", title="d")).id == 4, "an id must never be given out twice"` },
          { label: '`find`: the bookmark, or `None`', code: String.raw`r = BookmarkRepository()
saved = r.add(BookmarkIn(url="https://a.org", title="A"))
assert r.find(saved.id) == saved and r.find(99) is None` },
          { label: '`find_all`: in order, filtered by tag', code: String.raw`r = BookmarkRepository()
r.add(BookmarkIn(url="https://a.org", title="A", tags=["py"]))
r.add(BookmarkIn(url="https://b.org", title="B", tags=["java"]))
r.add(BookmarkIn(url="https://c.org", title="C", tags=["py", "web"]))
assert [b.title for b in r.find_all()] == ["A", "B", "C"]
assert [b.title for b in r.find_all("py")] == ["A", "C"] and r.find_all("go") == []` },
          { label: '`delete`: `True`, then `False`', code: String.raw`r = BookmarkRepository()
r.add(BookmarkIn(url="https://a.org", title="A"))
assert r.delete(1) is True and r.delete(1) is False and r.find(1) is None` },
          { label: 'A duplicate URL raises `DuplicateUrl`', code: String.raw`r = BookmarkRepository()
r.add(BookmarkIn(url="https://a.org", title="A"))
try:
    r.add(BookmarkIn(url="https://a.org", title="again"))
except DuplicateUrl:
    pass
else:
    raise AssertionError("the same URL twice should raise DuplicateUrl")` },
          { label: 'Two repositories do not share bookmarks', code: String.raw`one, two = BookmarkRepository(), BookmarkRepository()
one.add(BookmarkIn(url="https://a.org", title="A"))
assert two.find_all() == [], "keep the bookmarks in self, set up in __init__, not in the class body (a static field)"` }
        ]
      },
      {
        title: 'Routes',
        summary: 'POST, GET and DELETE as decorated functions: path and query parameters, a validated body, status codes 201 and 204, and 404 with HTTPException.',
        runtimes: ['server'], runtimeWhy: WHY_FASTAPI, packages: ['fastapi', 'httpx'], timeout: 30,
        body: [
          'A route is a function with a decorator naming the method and the path. Its **parameters** say where each input comes from, by their types: a name in the path (`{bookmark_id}`) is a path variable, a pydantic model is the JSON body, anything else is a query parameter. The **return value** becomes the JSON response, checked against the return type.',
          java(String.raw`
@PostMapping("/bookmarks")
@ResponseStatus(HttpStatus.CREATED)
Bookmark create(@Valid @RequestBody BookmarkIn data) { return repo.add(data); }

@GetMapping("/bookmarks/{id}")
Bookmark get(@PathVariable long id) {
    return repo.find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "no such bookmark"));
}`),
          norun(String.raw`
@app.post("/bookmarks", status_code=201)
def create_bookmark(data: BookmarkIn) -> Bookmark:
    return repo.add(data)


@app.get("/bookmarks/{bookmark_id}")
def get_bookmark(bookmark_id: int) -> Bookmark:
    bookmark = repo.find(bookmark_id)
    if bookmark is None:
        raise HTTPException(status_code=404, detail="no such bookmark")
    return bookmark`),
          '| Spring | FastAPI |\n|---|---|\n| `@GetMapping("/x/{id}")` | `@app.get("/x/{id}")` |\n| `@PathVariable long id` | `id: int`, named in the path |\n| `@RequestParam(required = false) String tag` | `tag: str \\| None = None` |\n| `@RequestBody @Valid BookmarkIn data` | `data: BookmarkIn` |\n| `@ResponseStatus(HttpStatus.CREATED)` | `status_code=201` |\n| `ResponseStatusException(NOT_FOUND)` | `HTTPException(status_code=404)` |',
          'The types do the checking: `GET /bookmarks/abc` never reaches your function, because `abc` is not an `int`; FastAPI answers 422 itself. `TestClient(app)` sends requests to the app directly, like `MockMvc`: `client.get("/bookmarks", params={"tag": "py"})` returns a response with `.status_code` and `.json()`.'
        ].join('\n\n'),
        task: [
          'Write four routes on `app`, using the module\'s `repo`:',
          '- `POST /bookmarks` with a `BookmarkIn` body: saves it, answers **201** with the `Bookmark`;\n- `GET /bookmarks`, with an optional `tag` query parameter: the list;\n- `GET /bookmarks/{bookmark_id}`: the bookmark, or **404** with `{"detail": "no such bookmark"}`;\n- `DELETE /bookmarks/{bookmark_id}`: **204** and no body, or 404 as above.'
        ].join('\n\n'),
        starter: IMPORTS_3 + MODELS + REPOSITORY + String.raw`

app = FastAPI(title="Bookmarks")
repo = BookmarkRepository()


@app.get("/bookmarks")
def list_bookmarks():
    return repo.find_all()
` + DEMO_3,
        solution: IMPORTS_3 + MODELS + REPOSITORY + ROUTES_3 + DEMO_3,
        hints: [
          '`@app.post("/bookmarks", status_code=201)` above `def create_bookmark(data: BookmarkIn) -> Bookmark:` that returns `repo.add(data)`.',
          'For a missing bookmark, `raise HTTPException(status_code=404, detail="no such bookmark")`.',
          '`@app.delete("/bookmarks/{bookmark_id}", status_code=204)` on a function that returns nothing (`-> None`).'
        ],
        checks: [
          { label: '`POST /bookmarks`: 201 and the saved bookmark', code: FRESH + String.raw`r = post("https://a.org", "A", ["py"])
assert r.status_code == 201, f"{r.status_code} {r.text}"
assert r.json() == {"url": "https://a.org", "title": "A", "tags": ["py"], "id": 1}, r.json()` },
          { label: '`GET /bookmarks/{id}`: the bookmark, or 404', code: FRESH + String.raw`post("https://a.org", "A")
r = client.get("/bookmarks/1")
assert r.status_code == 200 and r.json()["title"] == "A", f"{r.status_code} {r.text}"
r = client.get("/bookmarks/99")
assert r.status_code == 404 and r.json() == {"detail": "no such bookmark"}, f"{r.status_code} {r.text}"` },
          { label: 'An id that is not a number: 422 from FastAPI', code: FRESH + String.raw`assert client.get("/bookmarks/abc").status_code == 422` },
          { label: '`GET /bookmarks`: all of them, or one tag', code: FRESH + String.raw`post("https://a.org", "A", ["py"])
post("https://b.org", "B", ["java"])
assert [b["title"] for b in client.get("/bookmarks").json()] == ["A", "B"]
assert [b["title"] for b in client.get("/bookmarks", params={"tag": "java"}).json()] == ["B"]` },
          { label: '`DELETE`: 204 and no body, then 404', code: FRESH + String.raw`post("https://a.org", "A")
r = client.delete("/bookmarks/1")
assert r.status_code == 204 and r.content == b"", f"{r.status_code} {r.content!r}"
assert client.get("/bookmarks/1").status_code == 404 and client.delete("/bookmarks/1").status_code == 404` },
          { label: 'The OpenAPI description lists the four operations', code: String.raw`paths = app.openapi()["paths"]
assert set(paths.get("/bookmarks", {})) >= {"get", "post"} and set(paths.get("/bookmarks/{bookmark_id}", {})) >= {"get", "delete"}, list(paths)` }
        ]
      },
      {
        title: 'Validation and errors',
        summary: 'A 422 that names the bad field, a 409 for a duplicate through an exception handler, and limit and offset with bounds.',
        runtimes: ['server'], runtimeWhy: WHY_FASTAPI, packages: ['fastapi', 'httpx'], timeout: 30,
        body: [
          '**Bad input.** A body that fails the model\'s checks never reaches your route: FastAPI answers **422** with a `detail` list, one entry per problem, each with `loc` (where, such as `["body", "title"]`), `msg` and `type`. Spring\'s `@Valid` gives 400 by default; 422 ("I understood the request, but its content is wrong") is FastAPI\'s choice.',
          '**Domain errors.** `repo.add` raises `DuplicateUrl`; uncaught, that would be a 500. An **exception handler** turns an exception type into a response for every route at once: Spring\'s `@ExceptionHandler` in a `@ControllerAdvice`.',
          java(String.raw`
@ExceptionHandler(DuplicateUrl.class)
@ResponseStatus(HttpStatus.CONFLICT)
Map<String, String> duplicate(DuplicateUrl e) { return Map.of("detail", "already saved: " + e.getMessage()); }`),
          norun(String.raw`
@app.exception_handler(DuplicateUrl)
def duplicate_url(request, exc):
    return JSONResponse(status_code=409, content={"detail": f"already saved: {exc}"})`),
          '**Bounded query parameters.** A list endpoint should page: `limit` and `offset`, with limits so nobody asks for a million rows. `Annotated[int, Query(ge=1, le=100)] = 20` is an int query parameter between 1 and 100, 20 by default; out of range gives 422. That is `@RequestParam @Min(1) @Max(100) int limit` in Spring. A slice, `items[offset:offset + limit]`, cuts the page.'
        ].join('\n\n'),
        task: [
          '1. A duplicate URL answers **409** with `{"detail": "already saved: <url>"}`, through an exception handler for `DuplicateUrl`.',
          '2. `GET /bookmarks` takes `limit` (1 to 100, default 20) and `offset` (0 or more, default 0), together with `tag`, and returns that page. Out-of-range values answer 422.',
          '3. A bad body already answers 422, naming the field: keep it that way.'
        ].join('\n\n'),
        starter: IMPORTS_4 + MODELS + REPOSITORY + ROUTES_3 + DEMO_4,
        solution: IMPORTS_4 + MODELS + REPOSITORY + ROUTES_4 + DEMO_4,
        hints: [
          '`@app.exception_handler(DuplicateUrl)` above `def duplicate_url(request, exc):` returning `JSONResponse(status_code=409, content={"detail": f"already saved: {exc}"})`.',
          'Parameters `limit: Annotated[int, Query(ge=1, le=100)] = 20` and `offset: Annotated[int, Query(ge=0)] = 0`, then return `repo.find_all(tag)[offset:offset + limit]`.'
        ],
        checks: [
          { label: 'A bad body: 422, naming the field', code: FRESH + String.raw`r = client.post("/bookmarks", json={"url": "https://a.org", "title": ""})
assert r.status_code == 422, f"{r.status_code} {r.text}"
assert [e["loc"] for e in r.json()["detail"]] == [["body", "title"]], r.json()` },
          { label: 'A duplicate URL: 409 and a message', code: FRESH + String.raw`post("https://a.org")
r = post("https://a.org")
assert r.status_code == 409 and r.json() == {"detail": "already saved: https://a.org"}, f"{r.status_code} {r.text}"` },
          { label: '`limit` and `offset` cut a page', code: FRESH + String.raw`for n in range(1, 6):
    post(f"https://{n}.org", str(n))
ids = lambda **q: [b["id"] for b in client.get("/bookmarks", params=q).json()]
assert ids() == [1, 2, 3, 4, 5] and ids(limit=2) == [1, 2] and ids(limit=2, offset=3) == [4, 5] and ids(offset=9) == []` },
          { label: 'Out-of-range `limit` or `offset`: 422', code: FRESH + String.raw`for q in ({"limit": 0}, {"limit": 101}, {"offset": -1}, {"limit": "many"}):
    r = client.get("/bookmarks", params=q)
    assert r.status_code == 422, f"{q}: {r.status_code}"` },
          { label: 'A tag and a page together', code: FRESH + String.raw`for n in range(1, 7):
    post(f"https://{n}.org", str(n), ["even"] if n % 2 == 0 else [])
assert [b["id"] for b in client.get("/bookmarks", params={"tag": "even", "limit": 2, "offset": 1}).json()] == [4, 6]` }
        ]
      },
      {
        title: 'Dependency injection, and tests that swap it',
        summary: 'Routes receive the repository through Depends, so a test can hand them a fresh one with dependency_overrides, the way @MockBean replaces a bean.',
        runtimes: ['server'], runtimeWhy: WHY_FASTAPI, packages: ['fastapi', 'httpx'], timeout: 30,
        body: [
          'So far every route uses the module\'s `repo` directly, so every test shares one repository and its leftovers: the checks had to wipe it each time. Spring solves this with injection: the controller asks for a `BookmarkRepository`, and a test can supply another one. FastAPI does the same with **`Depends`**: a parameter whose value comes from calling a function.',
          norun(String.raw`
def get_repo():
    return repo


Repo = Annotated[BookmarkRepository, Depends(get_repo)]      # "a BookmarkRepository, from get_repo()"


@app.get("/bookmarks/{bookmark_id}")
def get_bookmark(bookmark_id: int, repo: Repo) -> Bookmark:  # FastAPI calls get_repo() for each request
    ...`),
          java(String.raw`
@RestController
class BookmarkController {
    private final BookmarkRepository repo;
    BookmarkController(BookmarkRepository repo) { this.repo = repo; }   // constructor injection
}

@WebMvcTest(BookmarkController.class)
class BookmarkControllerTest {
    @MockBean BookmarkRepository repo;                                     // replaces the bean
}`),
          'The test side is `app.dependency_overrides`, a dict from a dependency function to its replacement: `app.dependency_overrides[get_repo] = lambda: fresh_repo` makes every route receive `fresh_repo` until the override is removed. A dependency can be anything a request needs: a database session, the current user from a token (Spring Security\'s `@AuthenticationPrincipal`), settings. A dependency that `yield`s instead of returning can also clean up after the request, like a `try`/`finally` around it.'
        ].join('\n\n'),
        task: [
          '1. `get_repo()` returns the module\'s `repo`. Every route takes the repository as a parameter, `repo: Annotated[BookmarkRepository, Depends(get_repo)]` (a type alias `Repo` saves typing it four times), and uses that instead of the global.',
          '2. `client_with(repository)` returns a `TestClient` whose routes all use `repository`: set `app.dependency_overrides[get_repo]`.',
          'Everything from steps 3 and 4 must still work.'
        ].join('\n\n'),
        starter: IMPORTS_5 + MODELS + REPOSITORY + ROUTES_4 + String.raw`

def get_repo():
    """The repository the routes use. A test replaces it through app.dependency_overrides."""
    return repo


def client_with(repository):
    """A test client whose routes use this repository instead of the real one."""
    return TestClient(app)
` + DEMO_5,
        solution: IMPORTS_5 + MODELS + REPOSITORY + ROUTES_5 + DEMO_5,
        hints: [
          'Above the routes: `Repo = Annotated[BookmarkRepository, Depends(get_repo)]`. Then add `repo: Repo` to each route\'s parameters; inside the function, `repo` is now the parameter, not the global.',
          'In `client_with`: `app.dependency_overrides[get_repo] = lambda: repository`, then `return TestClient(app)`.'
        ],
        checks: [
          { label: 'Every route gets the repository from `Depends(get_repo)`', code: DI + String.raw`routes = [r for r in app.routes if isinstance(r, APIRoute)]
missing = [f"{sorted(r.methods)[0]} {r.path}" for r in routes if not any(d.call is get_repo for d in r.dependant.dependencies)]
assert len(routes) == 4 and not missing, f"routes without Depends(get_repo): {missing}"` },
          { label: 'A client with its own repository writes there, not to the real one', code: DI + String.raw`fresh = BookmarkRepository()
client = client_with(fresh)
r = client.post("/bookmarks", json={"url": "https://a.org", "title": "A"})
assert r.status_code == 201, f"{r.status_code} {r.text}"
assert len(fresh.find_all()) == 1 and repo.find_all() == [], "the override's repository should get it"
app.dependency_overrides.clear()` },
          { label: 'Two clients, two repositories, nothing shared', code: DI + String.raw`one, two = BookmarkRepository(), BookmarkRepository()
one.add(BookmarkIn(url="https://only-in-one.org", title="one"))
assert len(client_with(one).get("/bookmarks").json()) == 1
assert client_with(two).get("/bookmarks").json() == []
assert client_with(two).get("/bookmarks/1").status_code == 404
app.dependency_overrides.clear()` },
          { label: 'Steps 3 and 4 still work through the dependency', code: DI + String.raw`client = client_with(BookmarkRepository())
assert client.post("/bookmarks", json={"url": "https://a.org", "title": "A"}).status_code == 201
assert client.post("/bookmarks", json={"url": "https://a.org", "title": "A"}).status_code == 409
assert client.get("/bookmarks", params={"limit": 0}).status_code == 422
assert client.delete("/bookmarks/1").status_code == 204 and client.get("/bookmarks/1").status_code == 404
app.dependency_overrides.clear()` }
        ]
      }
    ]
  });
})(window.PYLT);
