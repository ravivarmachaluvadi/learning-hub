/*
 * views/home.js - the start page (#/): where to begin, what is in the tool, where your Kotlin runs, a
 * Java-to-Kotlin map, and backing up your data. The Python Learning Tool's, for Kotlin.
 */
(function (U) {
  'use strict';
  var h = U.h;

  // [in Java, in Kotlin, where to learn it]
  var PRIMER = [
    ['`public static void main(String[] args)` in a class', '`fun main()` at the top level of a file', 'lesson:kt-first-program'],
    ['`final var city = "Pune";`', '`val city = "Pune"`', 'lesson:kt-variables'],
    ['`long l = i;` (widened for you)', '`val l: Long = i.toLong()`', 'lesson:kt-numbers'],
    ['`"Total: " + total`', '`"Total: $total"`', 'lesson:kt-strings'],
    ['`s.length()`, `s.charAt(0)`, `s.equals(t)`', '`s.length`, `s[0]`, `s == t`', 'lesson:kt-strings'],
    ['`a > b ? a : b`', '`if (a > b) a else b`', 'lesson:kt-conditions'],
    ['`switch` with `break`', '`when`, which never falls through', 'lesson:kt-conditions'],
    ['`for (int i = 0; i < n; i++)`', '`for (i in 0 until n)`', 'lesson:kt-loops'],
    ['Overloads for optional parameters', 'Default and named arguments', 'lesson:kt-functions'],
    ['Any reference may be `null`', '`String` never is; `String?` may be', 'lesson:kt-null-safety'],
    ['`s != null ? s : "none"`, `Optional`', '`s ?: "none"`, `s?.trim()`', 'lesson:kt-null-safety'],
    ['Checked exceptions, `throws`', 'No checked exceptions; `try` is an expression', 'lesson:kt-exceptions'],
    ['`List.of(...)`, `new ArrayList<>()`', '`listOf(...)`, `mutableListOf()`', 'lesson:kt-collections'],
    ['`map.put(k, v)`, `map.get(k)`', '`map[k] = v`, `map[k]`', 'lesson:kt-collections'],
    ['`==` on references, `.equals()` for content', '`==` is `equals`; `===` is the reference', 'q:equality'],
    ['`void`, `Object`', '`Unit`, `Any`; and `Nothing` for code that never returns', 'q:any-unit-nothing'],
    ['A private field, a getter and a setter', 'A property: `var name: String`, with `get()` and `set(value)` when needed', 'lesson:kt-properties'],
    ['A bean with getters, setters, `equals`, `hashCode`', 'A `data class`', 'lesson:kt-data-classes'],
    ['`static` methods and fields', 'Top-level functions, or a `companion object`', 'lesson:kt-objects'],
    ['Any class can be extended unless it is `final`', 'A class is final unless it is `open`', 'lesson:kt-visibility'],
    ['`x instanceof Dog`, then a cast', '`x is Dog`, and `x` is a `Dog` from then on', 'lesson:kt-inheritance'],
    ['`Function<T, R>`, `x -> x * 2`', '`(T) -> R`, `{ it * 2 }`', 'lesson:kt-lambdas'],
    ['Streams: `list.stream().filter(...).map(...).toList()`', '`list.filter { … }.map { … }`', 'lesson:kt-collection-ops'],
    ['A utility method `StringUtils.isBlank(s)`', 'An extension function: `s.isBlank()`', 'lesson:kt-extensions'],
    ['A builder: `new Server.Builder().port(80).build()`', '`Server().apply { port = 80 }`', 'lesson:kt-scope-functions'],
    ['`? extends T`, `? super T`', '`out T`, `in T`', 'lesson:kt-generics'],
    ['`<T extends Comparable<T>>`', '`<T : Comparable<T>>`', 'lesson:kt-generics'],
    ['`a.equals(b)`; `a == b` for the same object', '`a == b`; `a === b`', 'lesson:kt-equality'],
    ['A decorator that forwards every method by hand', '`class Logged(r: Repo) : Repo by r`', 'lesson:kt-class-delegation'],
    ['A field created on first use, with a null check', '`val config by lazy { load() }`', 'lesson:kt-property-delegates'],
    ['`a.add(b)`, `list.get(i)`', '`a + b`, `list[i]`: operators you can define', 'lesson:kt-operators'],
    ['`String s = javaObj.getName();` (may be null)', 'Declare what you expect: `val s: String? = javaObj.name`', 'lesson:kt-java-from-kotlin'],
    ['`static` methods for Java callers', '`@JvmStatic`, `@JvmOverloads`, `@JvmField`', 'lesson:kt-kotlin-from-java'],
    ['`new StringBuilder()`, then many `append` calls', '`buildString { append(…) }`', 'lesson:kt-build-functions'],
    ['`String.class`, `obj.getClass()`', '`String::class.java`, `obj::class`', 'lesson:kt-annotations'],
    ['JUnit\'s `assertEquals(expected, actual)`', '`kotlin.test`: `assertEquals`, `assertFailsWith<…>`', 'lesson:kt-testing'],
    ['Threads, virtual threads, `Thread.sleep`', 'Coroutines: `launch`, and `delay`, which frees the thread', 'lesson:kt-coroutines-threads'],
    ['`CompletableFuture`, `thenCompose`', 'A `suspend` function, written like blocking code', 'lesson:kt-suspend'],
    ['`supplyAsync(…)` for each task, then `join()`', '`async { … }` for each, then `awaitAll()`', 'lesson:kt-launch-async'],
    ['`StructuredTaskScope` (a preview API)', '`coroutineScope { }`: structure by default', 'lesson:kt-structured-concurrency'],
    ['An executor for blocking work', '`withContext(Dispatchers.IO) { … }`', 'lesson:kt-dispatchers'],
    ['`synchronized`, `ReentrantLock`', '`Mutex.withLock { }`, which suspends instead of blocking', 'lesson:kt-shared-state'],
    ['`BlockingQueue`', '`Channel`: `send` and `receive` suspend', 'lesson:kt-channels'],
    ['Reactor\'s `Flux`, RxJava', '`Flow`: a cold stream of suspending values', 'lesson:kt-flow-basics'],
    ['`subscribeOn`, `onBackpressureBuffer`', '`flowOn`, `buffer()`, `conflate()`', 'lesson:kt-flow-buffering'],
    ['`LiveData`, a value with listeners', '`StateFlow`; `SharedFlow` for events', 'lesson:kt-stateflow-sharedflow']
  ];

  // what the tool holds: [link, kicker, title, text]
  function sections(c) {
    return [
      ['#/lessons', c.lessons + ' lessons', 'Lessons', 'From your first line of Kotlin to coroutines and Flow, each idea next to the Java you know. A checked challenge, a short quiz and the interview questions on it end every lesson.'],
      ['#/practice', c.katas + ' katas', 'Practice', 'Checked exercises from easy to hard: the patterns interviews ask for, written the Kotlin way (two sum, a sliding window, LRU cache, a topological sort, a worker pool, a search box as a Flow), and ' + c.rewrites + ' Java programs to rewrite as idiomatic Kotlin.'],
      ['#/predict', c.predictions + ' programs', 'Predict the output', 'Short programs built around the traps a Java developer falls into: boxed numbers and ===, init order, scope functions, return in forEach, the order coroutines run in. Type what each prints, then see why.'],
      ['#/interview', c.questions + ' questions', 'Interview Q&A', 'The questions Kotlin interviews ask most, each with the answer to give in 30 seconds, the full answer with code that runs, and the follow-ups that come next. Practise them as flashcards, the ★★★ fast track first: all ' + c.fast + ' of its questions are here.'],
      ['#/mock', 'A timed rehearsal', 'Mock interview', 'Questions answered out loud against a clock with a follow-up after each, then "what does this print?", then a kata against its own clock. A scorecard says what to revise.'],
      ['#/playground', 'Run anything', 'Playground', 'Write any Kotlin and run it, coroutines included, with an Input box for readln(). Save snippets, start from templates, download a .kt file.'],
      ['#/glossary', c.glossary + ' terms', 'Glossary', 'Kotlin\'s words in plain language: smart cast, platform type, Elvis operator, Nothing, and more, each with the Java idea it matches.'],
      ['#/playground', 'As you type', 'Help in every editor', 'Suggestions as you type (Ctrl+Space), and a name\'s Reference entry when you hover it. A ⚠ in the margin marks Java written from habit (new, String s = …, System.out.println), even opened from disk. Through ktlearn, compile errors are underlined a moment after you stop typing, with the compiler\'s message and a hint.'],
      ['#/java', c.javakt + ' translations', 'Kotlin ↔ Java', 'What you write in Java every day, next to the Kotlin for it: Optional, streams, records, static, try-with-resources and more. Both sides are whole programs, and both run and print the same.'],
      ['#/reference', c.reference + ' entries', 'Reference', 'The standard library\'s most-used functions and every Kotlin keyword, each with an example that runs, what it prints, and its Java equivalent.'],
      ['#/explain', c.explainers + ' explainers', 'Explainers', 'What happens inside, a step at a time, with a picture: a suspend function as a state machine, a cancellation tree, cold and hot flows on a timeline, inline or not. Every step is proved by a real run.']
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
      var c = { lessons: lessons.length, quiz: U.quiz.questions().length, questions: (U.data.questions || []).length,
        checks: lessons.reduce(function (n, l) { return n + l.challenge.checks.length; }, 0),
        glossary: (U.data.glossary || []).length, fast: (U.data.questions || []).filter(function (q) { return q.weight === 3; }).length,
        javakt: (U.data.javakt || []).length, reference: (U.data.reference || []).length, explainers: (U.data.explainers || []).length,
        katas: (U.data.katas || []).length, rewrites: (U.data.katas || []).filter(function (k) { return k.kind === 'rewrite'; }).length,
        predictions: (U.data.predictions || []).length };

      // --- hero: the same program in Java and in Kotlin
      var java = U.codeBlock('record User(String name, String email) {}\n\npublic class Main {\n    public static void main(String[] args) {\n        var users = List.of(new User("Asha", null), new User("Ravi", "ravi@example.com"));\n        for (User u : users) {\n            String email = u.email() != null ? u.email() : "no email";\n            System.out.println(u.name() + ": " + email);\n        }\n    }\n}', 'java', { label: 'Java' });
      var kt = U.codeBlock('data class User(val name: String, val email: String?)\n\nfun main() {\n    val users = listOf(User("Asha", null), User("Ravi", "ravi@example.com"))\n    for (u in users) {\n        println("${u.name}: ${u.email ?: "no email"}")\n    }\n}', 'kotlin', { label: 'Kotlin', title: 'Home page example' });
      root.appendChild(h('section', { class: 'hero' },
        h('div', null,
          h('div', { class: 'card-kicker' }, 'For a Java developer'),
          h('h1', null, 'Learn Kotlin by running it, and practise the questions interviews ask'),
          h('p', null, 'Every idea is shown next to the Java you already know, every example compiles and runs on your PC, and every lesson ends with a challenge the tool checks for you and the interview questions that build on it.'),
          h('div', { class: 'row', style: { marginTop: '14px' } },
            resume ? h('a', { class: 'btn btn-primary', href: '#/lessons/' + resume.id }, finished ? 'Continue: ' + resume.title + ' →' : 'Start lesson 1 →') :
              h('a', { class: 'btn btn-primary', href: '#/interview' }, 'All lessons done - practise the interview questions →'),
            h('a', { class: 'btn', href: '#/interview/cards?weight=3' }, '★★★ flashcards'),
            h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { if (U.openSearch) U.openSearch(); } }, 'Search (Ctrl K)')),
          h('div', { class: 'stat-row' },
            h('div', { class: 'stat' }, h('b', null, c.lessons), h('span', null, 'lessons')),
            h('div', { class: 'stat' }, h('b', null, c.checks), h('span', null, 'checks')),
            h('div', { class: 'stat' }, h('b', null, c.quiz), h('span', null, 'quiz questions')),
            h('div', { class: 'stat' }, h('b', null, c.questions), h('span', null, 'interview questions')))),
        h('div', { class: 'hero-code' }, java.el, kt.el)));

      // --- what is waiting: quiz reviews and flashcards
      var review = U.quiz.reviewCard();
      if (review) { review.style.marginTop = '18px'; root.appendChild(review); }
      var due = U.cards ? U.cards.due().length : 0;
      if (due) {
        root.appendChild(h('div', { class: 'card review-card', style: { marginTop: '12px' } },
          h('div', { class: 'row' }, h('b', null, U.plural(due, 'flashcard is', 'flashcards are') + ' due'), h('span', { class: 'spacer' }),
            h('a', { class: 'btn btn-primary btn-small', href: '#/interview/cards' }, 'Practise now →'))));
      }

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
        return h('a', { class: 'card', href: s[0] }, h('div', { class: 'card-kicker' }, s[1]), h('h3', null, s[2]), h('p', { class: 'muted', style: { margin: 0 } }, s[3]));
      })));

      // --- where your Kotlin runs
      root.appendChild(h('h2', { id: 'how-it-runs' }, 'Where your Kotlin runs'));
      root.appendChild(U.runtimeExplainer());

      // --- how to use
      root.appendChild(h('h2', null, 'How to use it'));
      root.appendChild(h('div', { class: 'card', html: U.md(
        '1. **Start the tool with `ktlearn.cmd`** (double-click it in the KotlinLearningTool folder), or with the desktop shortcut that `python ktlearn.py --install-shortcuts` makes once. It opens this page at http://127.0.0.1:8027, where your code compiles and runs.\n' +
        '2. **Do the lessons in order.** Read the explanation, change the **Example** and run it (Ctrl+Enter), then solve the **Challenge**: "Check my answer" compiles your program, runs it, and ticks each check, saying what it found ("got 1.0, expected 2.0").\n' +
        '3. **Help as you type.** Names are suggested as you type (Ctrl+Space shows them any time), and hovering a name shows its Reference entry (Ctrl+click opens it). A ⚠ in the editor\'s margin marks a line written the Java way (`new`, `String s = …`, `a ? b : c`, `System.out.println`); hover it to see the Kotlin way. A moment after you stop typing, the code is compiled (nothing runs) and each error is underlined, with a ✕ in the margin: hover it for the compiler\'s message and a hint.\n' +
        '4. **Stuck?** Hints come one at a time. When you run, a compile error lists every error with its line, and an exception shows only your code\'s lines, both with a plain-language hint for the mistakes a Java developer makes most.\n' +
        '5. **Missed a quiz question?** It comes back in your review until you know it: after a day, then three days.\n' +
        '6. **Practise the interview questions** as flashcards: read the question, answer out loud, reveal, and grade yourself. Cards you knew come back after 1, 3, 7 and 21 days; cards you missed, at once. Start with the ★★★ fast track.\n' +
        '7. **Practise.** **Practice** has katas from easy to hard, checked like a lesson\'s challenge: the patterns interviews ask for, written the Kotlin way, and Java programs to rewrite as idiomatic Kotlin (their Java-shaped starter already works: make it idiomatic). **Predict the output** deals short programs built around the traps a Java developer falls into. Before an interview, the **Mock interview** rehearses a round against the clock.\n' +
        '8. **Want to try something?** The **Playground** runs any program, coroutines included. Type what `readln()` should read into the Input box, one line per call. **Kotlin ↔ Java** shows the Kotlin for what you would write in Java, and runs both sides; the **Reference** has every keyword and the functions you will use most; the **Explainers** take apart what happens inside a suspend function, a cancelled tree of coroutines and a flow, a step at a time.\n' +
        '9. **Want more room for the code?** Drag the line between the two columns, or the bar under an editor; both are remembered. **Full screen**, beside the code, puts the text and the code across the whole window; **Esc** leaves.\n' +
        '10. **Looking for something?** Press **Ctrl K** (or **/**) and type: `null`, `when`, `val`, `range`, `smart cast`…\n' +
        '11. **Everything you do is stored in this browser only.** No account. Keep a backup file with **Your data** below.') }));

      // --- Java primer
      root.appendChild(h('h2', null, 'If you know Java, you already know…'));
      root.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null, h('th', null, 'In Java'), h('th', null, 'In Kotlin'), h('th', null, 'Where to learn it'))),
        h('tbody', null, PRIMER.map(function (r) {
          var m = /^(\w+):(.+)$/.exec(r[2]);
          var t = m[1] === 'track' ? U.find('tracks', m[2]) : null;
          var built = !t || (U.data.lessons || []).some(function (l) { return l.track === t.id; });
          return h('tr', null, h('td', { html: U.mdInline(r[0]) }), h('td', { html: U.mdInline(r[1]) }),
            h('td', null, h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) }), built ? null : h('span', { class: 'faint' }, ' (batch ' + t.batch + ')')));
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

  /** How Kotlin runs here, and what state it is in. Also used by the badge's dialog. */
  U.runtimeExplainer = function () {
    var info = U.run.info;
    var now = info.state === 'loading' ? 'Looking for the local server…' :
      info.state === 'offline' ? 'Now: **reading only.** This page was not opened through ktlearn, so code cannot run.' :
        info.state === 'error' ? 'Now: **the compiler could not start**: ' + (info.detail || 'unknown error') + '.' :
          info.state === 'warming' ? 'Now: **Kotlin ' + info.kotlin + '**, warming up (the first compile after a start takes a few seconds).' :
            'Now: **Kotlin ' + info.kotlin + ' on Java ' + info.java + '**, on this PC, through `ktlearn`.';
    return h('div', { class: 'card runtime-card', html: U.md(
      now + '\n\n' +
      '- **Start it with `ktlearn.cmd`.** Double-click it in the KotlinLearningTool folder (or run `python ktlearn.py`). It opens http://127.0.0.1:8027, compiles every program with the `kotlinc` installed on this PC and runs it on this PC\'s JDK. It works offline. Keep its window open while you learn.\n' +
      '- **Why it is fast.** One JVM keeps the Kotlin compiler loaded, so after the first compile (about 3 to 5 seconds, once per start) a Run takes well under a second. Each program then runs in a fresh JVM of its own, so a program that never ends can be stopped.\n' +
      '- **Opened from disk** (`index.html`), every lesson, quiz, interview question and flashcard can be read, but nothing runs: Kotlin must be compiled first, and no Kotlin compiler runs inside a web page.\n\n' +
      '**Your progress is kept separately for each address.** Browsers store data per address, so lessons finished at http://127.0.0.1:8027 do not show at `file://…/index.html`, and the other way round. To move it, use **Back up to a file** in one and **Restore from a file** in the other (bottom of the home page).') });
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
      var name = 'kotlin-learning-tool-backup-' + localDate(new Date()) + '.json';
      U.download(name, JSON.stringify(U.backup.collect(), null, 2), 'application/json');
      say('Downloaded ' + name + '. Keep it somewhere safe, such as OneDrive.');
    }
    function ask(obj, info) {
      var when = new Date(info.savedAt);
      say('This backup is from ' + (isNaN(when) ? 'an unknown date' : when.toLocaleString()) + ' and holds ' +
        U.plural(info.lessons, 'finished lesson', 'finished lessons') + ', ' + U.plural(info.cards, 'practised flashcard', 'practised flashcards') + ' and ' +
        U.plural(info.snippets, 'saved snippet', 'saved snippets') + '. Restoring replaces everything this browser holds for the tool now.');
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
      h('p', { style: { marginTop: 0 } }, 'Your lesson progress (' + finished + ' done), quiz reviews, flashcard boxes, saved Playground snippets (' + snippets + ') and settings live only in this browser, at this address. ' +
        'Clearing the browser\'s data deletes them. A backup file keeps them safe and moves them to another browser, another PC, or between the page opened from disk and the one ktlearn serves.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: backUp }, 'Back up to a file'),
        h('button', { class: 'btn', type: 'button', onclick: function () { fileInput.click(); } }, 'Restore from a file…'),
        fileInput),
      msg, confirmRow);
  }
  U.route('home', U.views.home);
})(window.KLT);
