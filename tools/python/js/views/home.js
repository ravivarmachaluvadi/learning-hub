/*
 * views/home.js - the start page (#/): where to begin, what is in the tool, how your Python runs,
 * a Java-to-Python map, and backing up your data.
 */
(function (U) {
  'use strict';
  var h = U.h;

  // [in Java, in Python, where to learn it]
  var PRIMER = [
    ['`public static void main(String[] args)` in a class', 'Code at the top of a file runs, top to bottom', 'lesson:py-first-program'],
    ['`{ }` around blocks', 'A colon, then the block indented by 4 spaces', 'lesson:py-first-program'],
    ['`int count = 0;`', '`count = 0` (no type, no semicolon)', 'lesson:py-variables'],
    ['`long`, overflow, `BigInteger`', '`int`, which never overflows', 'lesson:py-numbers'],
    ['`"Total: " + total`', '`f"Total: {total}"`', 'lesson:py-strings'],
    ['`true`, `false`, `null`, `&&`, `||`, `!`', '`True`, `False`, `None`, `and`, `or`, `not`', 'lesson:py-booleans'],
    ['`else if`', '`elif`', 'lesson:py-if'],
    ['`for (int i = 0; i < n; i++)`', '`for i in range(n):`', 'lesson:py-loops'],
    ['`List<String>` / `ArrayList`', '`list`: `["a", "b"]`', 'lesson:py-lists'],
    ['A `record` returning two values', 'A tuple: `return low, high`', 'lesson:py-tuples'],
    ['`Map<K, V>` / `Set<T>`', '`dict`: `{"a": 1}` / `set`: `{1, 2}`', 'lesson:py-dicts-sets'],
    ['Overloads for optional parameters', 'Default and keyword arguments', 'lesson:py-functions'],
    ['Checked exceptions, `throws`', 'No checked exceptions; `try` / `except` / `raise`', 'lesson:py-exceptions'],
    ['`Scanner`, try-with-resources', '`input()`, `with open(...) as f:`', 'lesson:py-input-files'],
    ['`list.stream().filter(...).map(...).toList()`', '`[x * 2 for x in items if x > 0]`', 'lesson:py-comprehensions'],
    ['`s.substring(1, 4)`, `list.subList(1, 4)`', '`s[1:4]`, `items[1:4]`', 'lesson:py-slicing'],
    ['`Collectors.groupingBy(..., counting())`', '`Counter(words)`', 'lesson:py-collections'],
    ['`String... args` (varargs)', '`*args` and `**kwargs`', 'lesson:py-args-kwargs'],
    ['`x -> x * 2`, `Function<T, R>`', '`lambda x: x * 2`, any function', 'lesson:py-lambdas'],
    ['A Spring AOP aspect (`@Transactional`)', 'A decorator: `@retry`, `@cache`', 'lesson:py-decorators'],
    ['Fields, a constructor, getters and setters', 'A `class` with `__init__(self, ...)` and plain attributes', 'lesson:py-classes'],
    ['`equals()`, `hashCode()`, `toString()`', '`__eq__`, `__hash__`, `__repr__`', 'lesson:py-equality'],
    ['`record Point(int x, int y)`, Lombok `@Data`', '`@dataclass(frozen=True)`, `@dataclass`', 'lesson:py-dataclasses-enums'],
    ['`interface`, `abstract class`', 'An `ABC` with `@abstractmethod`, or a `Protocol`', 'lesson:py-abc-protocols'],
    ['An `Iterator` with `hasNext()` and `next()`', 'A generator: a function with `yield`', 'lesson:py-generators'],
    ['A lazy `Stream` pipeline', 'Chained generator expressions', 'lesson:py-lazy-pipelines'],
    ['`List<String>`, `Optional<User>` in a signature', 'Type hints: `list[str]`, `User | None`', 'lesson:py-type-hints'],
    ['`pom.xml`, `mvn install`', '`pyproject.toml`, `pip install` in a virtual environment', 'lesson:py-venv-pip'],
    ['`@Test`, `assertEquals(5, add(2, 3))`', 'A `test_` function with `assert add(2, 3) == 5`', 'lesson:py-pytest'],
    ['`AutoCloseable` for try-with-resources', '`__enter__` and `__exit__`, or `@contextmanager`', 'lesson:py-context-managers'],
    ['A `switch` with patterns (Java 21)', '`match` and `case`', 'lesson:py-match'],
    ['`ExecutorService`, `synchronized`', '`ThreadPoolExecutor`, `with lock:`', 'lesson:py-threads'],
    ['A parallel stream for CPU-heavy work', '`ProcessPoolExecutor`', 'lesson:py-multiprocessing'],
    ['`CompletableFuture.allOf(a, b)`', '`await asyncio.gather(a, b)`', 'lesson:py-asyncio']
  ];

  // what the tool holds
  function sections(c) {
    return [
      ['#/lessons', c.lessons + ' lessons', 'Lessons', 'From your first line to advanced Python, each next to the Java you know. A checked challenge and a short quiz end every lesson.', 0],
      ['#/practice', c.katas + ' katas', 'Practice', 'Small exercises from easy to hard, most of them the patterns interviews ask for: a dict for lookups, two pointers, a sliding window, heapq, BFS, dynamic programming.', 0],
      ['#/projects', c.projects + ' guided builds', 'Projects', 'Real programs, one checked step at a time: a command-line tool, a pytest suite, a FastAPI service next to its Spring Boot twin, a script that pulls JSON over HTTP.', 0],
      ['#/playground', 'Run anything', 'Playground', 'Write any Python and run it, with an input box for input(). Save snippets, start from templates, download a .py file.', 0],
      ['#/visualize', 'Step through code', 'Visualize', 'Run a program one step at a time and watch every name point at its object: frames, objects and arrows, drawn from what Python really did.', 0],
      ['#/explain', c.explainers + ' explainers', 'Explainers', 'Pages that run real Python as you click: names and objects, scope and closures, generators, decorators, how a dict finds a key, the MRO, == versus is, threads versus processes versus asyncio, the event loop, and memory.', 0],
      ['#/reference', c.reference + ' entries', 'Reference', 'Every built-in function, every method of str, list, dict, set and tuple, every keyword, operators, special methods, exceptions and 25 modules, each with an example that runs and its Java equivalent.', 0],
      ['#/java', c.javapy + ' translations', 'Java ↔ Python', 'What you write in Java, next to the Python for it: collections, streams, Optional, records, interfaces, JUnit, Maven, Spring.', 0],
      ['#/glossary', c.glossary + ' terms', 'Glossary', 'Python words in plain language: iterable, hashable, dunder, MRO, duck typing, GIL and more.', 0]
    ];
  }

  U.views.home = {
    render: function (root, params, query) {
      var lessons = U.data.lessons || [];
      var done = U.store.get('lessons.done', {});
      var finished = lessons.filter(function (l) { return done[l.id]; }).length;
      var nextLesson = lessons.filter(function (l) { return !done[l.id]; })[0];
      var lastLesson = U.find('lessons', U.store.get('lessons.last', ''));
      var resume = lastLesson && !done[lastLesson.id] ? lastLesson : nextLesson;
      var katas = U.data.katas || [], projects = U.data.projects || [];
      var c = { lessons: lessons.length, quiz: U.quiz.questions().length, katas: katas.length, projects: projects.length,
        checks: lessons.reduce(function (n, l) { return n + l.challenge.checks.length; }, 0) + katas.reduce(function (n, k) { return n + k.checks.length; }, 0) +
          projects.reduce(function (n, p) { return n + p.steps.reduce(function (m, s) { return m + s.checks.length; }, 0); }, 0),
        explainers: (U.data.explainers || []).length, reference: (U.data.reference || []).length, javapy: (U.data.javapy || []).length,
        glossary: (U.data.glossary || []).length };

      // --- hero: the same program in Java and in Python
      var java = U.codeBlock('import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<String> names = List.of("Asha", "Ravi", "Li");\n        for (String n : names) {\n            if (n.length() > 2) {\n                System.out.println("Hello, " + n + "!");\n            }\n        }\n    }\n}', 'java', { label: 'Java' });
      var py = U.codeBlock('names = ["Asha", "Ravi", "Li"]\nfor n in names:\n    if len(n) > 2:\n        print(f"Hello, {n}!")', 'python', { label: 'Python', title: 'Home page example' });
      root.appendChild(h('section', { class: 'hero' },
        h('div', null,
          h('div', { class: 'card-kicker' }, 'For a Java developer'),
          h('h1', null, 'Learn Python by running it, from your first line to advanced topics'),
          h('p', null, 'Every idea is shown next to the Java you already know, every example runs for real, and every lesson ends with a challenge the tool checks for you.'),
          h('div', { class: 'row', style: { marginTop: '14px' } },
            resume ? h('a', { class: 'btn btn-primary', href: '#/lessons/' + resume.id }, finished ? 'Continue: ' + resume.title + ' →' : 'Start lesson 1 →') :
              h('a', { class: 'btn btn-primary', href: '#/playground' }, 'All lessons done - open the Playground →'),
            h('a', { class: 'btn', href: '#/playground' }, 'Open the Playground'),
            h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { if (U.openSearch) U.openSearch(); } }, 'Search (Ctrl K)')),
          h('div', { class: 'stat-row' },
            h('div', { class: 'stat' }, h('b', null, c.lessons), h('span', null, 'lessons')),
            h('div', { class: 'stat' }, h('b', null, c.katas), h('span', null, 'katas')),
            h('div', { class: 'stat' }, h('b', null, c.checks), h('span', null, 'checks')),
            h('div', { class: 'stat' }, h('b', null, c.quiz), h('span', null, 'quiz questions')))),
        h('div', { class: 'hero-code' }, java.el, py.el)));

      // --- quiz questions waiting for review
      var review = U.quiz.reviewCard();
      if (review) { review.style.marginTop = '18px'; root.appendChild(review); }

      // --- progress
      if (finished || U.store.get('last', null)) {
        var last = U.store.get('last', null);
        root.appendChild(h('div', { class: 'card', style: { marginTop: '18px' } },
          h('div', { class: 'row' }, h('b', null, 'Your progress: ' + finished + ' of ' + lessons.length + ' lessons'), h('span', { class: 'spacer' }),
            last && last !== '#/' ? h('a', { href: last }, 'Back to where you were →') : null),
          h('div', { class: 'progress', style: { marginTop: '8px' } }, h('span', { style: { width: (lessons.length ? finished / lessons.length * 100 : 0) + '%' } }))));
      }

      // --- what is inside
      root.appendChild(h('h2', null, 'What is inside'));
      root.appendChild(h('div', { class: 'cards' }, sections(c).map(function (s) {
        var inner = [h('div', { class: 'card-kicker' + (s[4] ? ' kicker-later' : '') }, s[1]), h('h3', null, s[2]), h('p', { class: 'muted', style: { margin: 0 } }, s[3])];
        return s[0] ? h('a', { class: 'card', href: s[0] }, inner) : h('div', { class: 'card card-later' }, inner);
      })));

      // --- where your Python runs
      root.appendChild(h('h2', { id: 'how-it-runs' }, 'Where your Python runs'));
      root.appendChild(U.runtimeExplainer());

      // --- how to use
      root.appendChild(h('h2', null, 'How to use it'));
      root.appendChild(h('div', { class: 'card', html: U.md(
        '1. **Do the lessons in order.** Read the explanation, change the **Example** and run it (Ctrl+Enter), then solve the **Challenge**: "Check my answer" runs your program and ticks each check. A short quiz ends each lesson.\n' +
        '2. **Stuck?** Hints come one at a time. Errors come with a plain-language hint for the mistakes a Java developer makes most (`true`, `.length`, `else if`, `"n = " + 5`), and the line is marked in the editor.\n' +
        '3. **Missed a quiz question?** It comes back in your review until you know it: after a day, then three days.\n' +
        '4. **Then practise and build.** **Practice** has katas from easy to hard, the patterns interviews ask for. **Projects** grow a real program step by step: a command-line tool, a pytest suite, a FastAPI service next to Spring Boot, a script that pulls JSON over HTTP.\n' +
        '5. **Want to try something?** The **Playground** runs any program. Type what `input()` should read into the Input box, one line per call. **Visualize** steps through it and draws every name as an arrow to its object.\n' +
        '6. **Writing Java by habit?** A ⚠ in the editor margin marks lines like `x++`, `else if`, `true`, `== None` or `items=[]` as you type; hover it to see what Python wants instead. A red wavy underline and a ✕ mark a syntax error, found by Python itself a moment after you stop typing.\n' +
        '7. **Not sure what a name does?** In any editor, hover it (`len`, `.append`, `ValueError`) to see its **Reference** entry; Ctrl+click opens it. Autocomplete offers names as you type, and Ctrl+Space opens it any time.\n' +
        '8. **Want more room for the code?** Drag the line between the two columns, or the bar under an editor; both are remembered. **Full screen**, beside the code, puts the text and the code across the whole window (the browser\'s tabs go too), each scrolling on its own; **Esc** leaves.\n' +
        '9. **Looking for something?** Press **Ctrl K** (or **/**) and type: `f-string`, `dict`, `HashMap`, `Optional`, `dataclass`…\n' +
        '10. **Everything you do is stored in this browser only.** No account. Keep a backup file with **Your data** below.') }));

      // --- Java primer
      root.appendChild(h('h2', null, 'If you know Java, you already know…'));
      root.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null, h('th', null, 'In Java'), h('th', null, 'In Python'), h('th', null, 'Lesson'))),
        h('tbody', null, PRIMER.map(function (r) {
          var m = /^(\w+):(.+)$/.exec(r[2]);
          return h('tr', null, h('td', { html: U.mdInline(r[0]) }), h('td', { html: U.mdInline(r[1]) }),
            h('td', null, h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) })));
        })))));

      // --- back up and restore
      root.appendChild(h('h2', { id: 'your-data' }, 'Your data'));
      root.appendChild(dataCard(finished));
      if (query && query.at) {
        var target = document.getElementById(query.at);
        if (target) setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 0);
      }
    }
  };

  /** The two ways Python runs here, which one is active, and how to switch. Also used by the badge. */
  U.runtimeExplainer = function () {
    var info = U.run.info;
    var server = info.runtime === 'server';
    var now = info.state === 'loading' ? 'Python is still loading.' :
      info.state === 'error' ? 'Python could not be started: ' + (info.detail || 'unknown error') + '.' :
        server ? 'Now: **your own Python ' + info.python + '**, through the local server (`pylearn`).' :
          'Now: **Python ' + info.python + ' inside this browser** (Pyodide ' + U.run.PYODIDE + ').';
    return h('div', { class: 'card runtime-card', html: U.md(
      now + '\n\n' +
      '- **Your own Python (recommended).** Double-click `pylearn.cmd` in the PythonLearningTool folder (or run `python pylearn.py`). It opens http://127.0.0.1:8026 and runs every program on the Python installed on this PC, exactly like `python main.py`. Works offline. Threads, processes and pip packages work. Keep its window open while you learn.\n' +
      '- **A desktop shortcut.** Run `python pylearn.py --install-shortcuts` once in the PythonLearningTool folder: a **Python Learning Tool** icon appears on your Desktop and in the Start menu, and double-clicking it does the same as `pylearn.cmd`. `--remove-shortcuts` takes them away.\n' +
      '- **Python in the browser.** Double-click `index.html`. Python runs inside the page; the first time it downloads about 12 MB, so it needs internet. A browser gives Python no threads, processes or pip packages, so the few lessons that need them say so.\n\n' +
      '**Your progress is kept separately for each.** Browsers store data per address, so lessons finished at http://127.0.0.1:8026 do not show at `file://…/index.html`, and the other way round. To move it, use **Back up to a file** in one and **Restore from a file** in the other (bottom of the home page).') });
  };

  function localDate(d) {
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /** "Back up to a file" and "Restore from a file", with a confirmation before anything is replaced. */
  function dataCard(finished) {
    var snippets = Object.keys(U.store.get('playground.snippets', {})).length;
    var msg = h('p', { class: 'backup-msg', 'aria-live': 'polite' });
    var confirmRow = h('div', { class: 'row', hidden: true });
    var fileInput = h('input', { type: 'file', accept: '.json,application/json', hidden: true, 'aria-label': 'Restore from a backup file' });

    function say(text, bad) { msg.textContent = text; msg.classList.toggle('bad', !!bad); }
    function backUp() {
      var name = 'python-learning-tool-backup-' + localDate(new Date()) + '.json';
      U.download(name, JSON.stringify(U.backup.collect(), null, 2), 'application/json');
      say('Downloaded ' + name + '. Keep it somewhere safe, such as OneDrive.');
    }
    function ask(obj, info) {
      var when = new Date(info.savedAt);
      say('This backup is from ' + (isNaN(when) ? 'an unknown date' : when.toLocaleString()) + ' and holds ' +
        U.plural(info.lessons, 'finished lesson', 'finished lessons') + ', ' + U.plural(info.katas, 'solved kata', 'solved katas') + ', ' +
        U.plural(info.steps, 'finished project step', 'finished project steps') + ' and ' + U.plural(info.snippets, 'saved snippet', 'saved snippets') +
        '. Restoring replaces everything this browser holds for the tool now.');
      confirmRow.innerHTML = '';
      confirmRow.appendChild(h('button', { class: 'btn btn-primary', type: 'button', onclick: function () {
        confirmRow.hidden = true;
        if (U.backup.restore(obj)) { U.toast('Restored your data'); U.render(); }
        else say('Could not restore: the browser refused to store the data (blocked or full). Nothing was changed.', true);
      } }, 'Replace my data'));
      confirmRow.appendChild(h('button', { class: 'btn', type: 'button', onclick: function () { confirmRow.hidden = true; say('Cancelled. Nothing was changed.'); } }, 'Cancel'));
      confirmRow.hidden = false;
    }
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        fileInput.value = '';
        var obj = null;
        try { obj = JSON.parse(reader.result); } catch (e) { obj = null; }
        var info = U.backup.inspect(obj);
        confirmRow.hidden = true;
        if (info.ok) ask(obj, info); else say(info.msg, true);
      };
      reader.readAsText(file);
    });

    return h('div', { class: 'card' },
      h('p', { style: { marginTop: 0 } }, 'Your lesson progress (' + finished + ' done), quiz reviews, saved Playground snippets (' + snippets + ') and settings live only in this browser, at this address. ' +
        'Clearing the browser\'s data deletes them. A backup file keeps them safe and moves them to another browser, another PC, or between the two ways of running the tool.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: backUp }, 'Back up to a file'),
        h('button', { class: 'btn', type: 'button', onclick: function () { fileInput.click(); } }, 'Restore from a file…'),
        fileInput),
      msg, confirmRow);
  }
  U.route('home', U.views.home);
})(window.PYLT);
