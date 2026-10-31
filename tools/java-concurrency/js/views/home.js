/*
 * views/home.js - the start page (#/): where to begin, what is in the tool, where your Java runs, the
 * "then and now" map (the way you wrote it before Java 21, the way Java 25 lets you write it), and backing
 * up your data. The Kotlin Learning Tool's, for Java concurrency.
 */
(function (U) {
  'use strict';
  var h = U.h;

  // [what you wrote before, what Java 21 to 25 gives you, where to learn it]
  var THEN_NOW = [
    ['A fixed pool of 200 platform threads, sized by guesswork', 'A virtual thread per task: `Executors.newVirtualThreadPerTaskExecutor()`', 'lesson:vt-create'],
    ['`new Thread(r).start()`, `setDaemon`, `setName`', '`Thread.ofVirtual().name("worker-", 0).start(r)`', 'lesson:vt-create'],
    ['Callbacks and `CompletableFuture` chains so threads never block', 'Plain blocking code: a virtual thread unmounts while it waits', 'lesson:vt-blocking'],
    ['A pool\'s size as the limit on calls to a slow service', 'A `Semaphore` around the call; never pool virtual threads', 'lesson:vt-limit'],
    ['`synchronized` around I/O pins the carrier (Java 21 to 23)', 'Java 24 and later: `synchronized` no longer pins', 'lesson:vt-pinning'],
    ['`ThreadLocal` caches of costly objects', 'Shared or pooled objects; `ScopedValue` for context', 'lesson:vt-threadlocals'],
    ['`jstack`, a text thread dump', '`jcmd <pid> Thread.dump_to_file -format=json`, JFR\'s virtual-thread events', 'lesson:vt-observe'],
    ['`invokeAll`, then cancelling the rest by hand on a failure', '`StructuredTaskScope`: a failure cancels the siblings (preview in 25)', 'lesson:sc-failure'],
    ['`CompletableFuture.anyOf`, then cancelling the losers', '`Joiner.anySuccessfulResultOrThrow()`: the losers are cancelled', 'lesson:sc-joiners'],
    ['A timeout on every call, adding up', 'One deadline for the whole fan-out: `withTimeout`', 'lesson:sc-timeouts'],
    ['`InheritableThreadLocal` for request context', '`ScopedValue`, bound for a call and inherited by forked subtasks (final in 25)', 'lesson:sv-inheritance'],
    ['`parallelStream()` with blocking calls inside', '`Gatherers.mapConcurrent(n, fn)` on virtual threads (Java 24)', 'lesson:sv-map-concurrent'],
    ['Double-checked locking for a lazy singleton', 'The holder idiom, or `StableValue` (preview in 25)', 'lesson:sv-lazy-init'],
    ['`server.tomcat.threads.max=400`', '`spring.threads.virtual.enabled=true` (Spring Boot 3.2 and later)', 'track:spring'],
    ['`@Async` on a `ThreadPoolTaskExecutor`', 'The same `@Async` on a virtual-thread `SimpleAsyncTaskExecutor`', 'track:spring']
  ];

  // what the tool holds: [link, kicker, title, text]
  function sections(c) {
    return [
      ['#/lessons', c.lessons + ' lessons', 'Lessons', 'Virtual threads, structured concurrency and scoped values now; the memory model, java.util.concurrent and Spring in production arrive batch by batch. Each lesson shows where you meet it at work and ends with a checked challenge, a short quiz and the interview questions on it.'],
      ['#/explain', c.explainers + ' explainers', 'Explainers', 'What happens inside, a step at a time, with a picture: virtual threads on one carrier, synchronized on Java 21 and on 25, a scope tree cancelling its subtasks, scoped values binding and rebinding. Every printed line is proved by a real run.'],
      ['#/versions', 'Java 19 to 27', 'Java versions', 'Every concurrency JEP: when virtual threads, structured concurrency, scoped values, gatherers and stable values were previews or final, and what changes in 26 and 27.'],
      ['#/interview', c.questions + ' questions', 'Interview Q&A', 'The questions Java backend interviews ask about concurrency, each with the answer to give in 30 seconds, the full answer with code that runs, and the follow-ups that come next. Practise them as flashcards, the ★★★ ones first.'],
      ['#/playground', 'Run anything', 'Playground', 'Write any Java 25 and run it, preview features on: a compact source file needs no class and no imports. Templates for virtual threads and executors; save snippets, download Main.java.'],
      ['#/glossary', c.glossary + ' terms', 'Glossary', 'Carrier thread, continuation, pinning, mount, Little\'s law and more, in plain language, each linked to where it is taught.']
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
        explainers: (U.data.explainers || []).length };

      // --- hero: the same fan-out, the way it was written on a pool, and on virtual threads
      var before = U.codeBlock('ExecutorService pool = Executors.newFixedThreadPool(200);\ntry {\n    List<Future<String>> futures = new ArrayList<>();\n    for (String id : ids) {\n        futures.add(pool.submit(() -> fetch(id)));   // 200 at most\n    }\n    for (Future<String> f : futures) {\n        results.add(f.get());\n    }\n} finally {\n    pool.shutdown();\n}', 'java', { label: 'Before: a pool sized by guesswork', playground: false });
      var after = U.codeBlock('try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    List<Future<String>> futures = new ArrayList<>();\n    for (String id : ids) {\n        futures.add(executor.submit(() -> fetch(id)));   // one each\n    }\n    for (Future<String> f : futures) {\n        results.add(f.get());\n    }\n}   // close() waits for every task', 'java', { label: 'Java 21 and later: a virtual thread per task', playground: false });
      root.appendChild(h('section', { class: 'hero' },
        h('div', null,
          h('div', { class: 'card-kicker' }, 'Java 25 LTS, for a Java developer'),
          h('h1', null, 'Learn Java concurrency by running it: virtual threads, structured concurrency, and how Spring uses them'),
          h('p', null, 'Every example compiles and runs on your PC\'s JDK 25, every lesson shows where you meet the idea at work, and every lesson ends with a challenge the tool checks for you and the interview questions that build on it. The checks prove what your code did at the same time without timing it, so they give the same answer on any PC.'),
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
        h('div', { class: 'hero-code' }, before.el, after.el)));

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

      // --- where your Java runs
      root.appendChild(h('h2', { id: 'how-it-runs' }, 'Where your Java runs'));
      root.appendChild(U.runtimeExplainer());

      // --- how to use
      root.appendChild(h('h2', null, 'How to use it'));
      root.appendChild(h('div', { class: 'card', html: U.md(
        '1. **Start the tool with `jclearn.cmd`** (double-click it in the JavaConcurrencyLearningTool folder), or with the desktop shortcut that `python jclearn.py --install-shortcuts` makes once. It opens this page at http://127.0.0.1:8028, where your code compiles and runs on your JDK 25.\n' +
        '2. **Do the lessons in order.** Read the explanation and the **Where you meet this at work** box, change the **Example** and run it (Ctrl+Enter), then solve the **Challenge**: "Check my answer" compiles your program, runs it, and ticks each check, saying what it found ("at most 1 call was in flight: the calls ran one after another").\n' +
        '3. **How a check knows what ran at the same time.** A challenge hands your code a pretend service. Each call to it waits until the others arrive, and the service counts how many were in flight together, on which kind of thread, and which were cancelled. Nothing is timed, so a check gives the same answer on a fast PC and a busy one.\n' +
        '4. **Stuck?** Hints come one at a time. A compile error lists every error with its line; an exception shows only your code\'s lines; both come with a plain-language hint for the mistakes made most in concurrent code (a lambda that cannot throw `InterruptedException`, a loop variable used in a lambda, a virtual thread made non-daemon…).\n' +
        '5. **Missed a quiz question?** It comes back in your review until you know it: after a day, then three days.\n' +
        '6. **Practise the interview questions** as flashcards: read the question, answer out loud, reveal, and grade yourself. Cards you knew come back after 1, 3, 7 and 21 days; cards you missed, at once. Start with the ★★★ ones.\n' +
        '7. **Want to try something?** The **Playground** runs any Java 25 program. Type what `IO.readln()` should read into the Input box, one line per call.\n' +
        '8. **Want more room for the code?** Drag the line between the two columns, or the bar under an editor; both are remembered. **Full screen**, beside the code, puts the text and the code across the whole window; **Esc** leaves.\n' +
        '9. **Looking for something?** Press **Ctrl K** (or **/**) and type: `pinning`, `carrier`, `Semaphore`, `joiner`, `scoped value`, `Spring`…\n' +
        '10. **See it happen.** The **Explainers** step through a program with a picture (Step, Back, Play, or the ← → keys); **Java versions** says what is final or preview in each release. A ⚠ in an editor\'s margin marks a concurrency habit (a swallowed interrupt, a pool of virtual threads, `get()` before `join()`): hover it for the better way.\n' +
        '11. **Everything you do is stored in this browser only.** No account. Keep a backup file with **Your data** below.') }));

      // --- then and now
      root.appendChild(h('h2', null, 'The way you wrote it, and the way Java 25 lets you'));
      root.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null, h('th', null, 'Before Java 21'), h('th', null, 'Java 21 to 25'), h('th', null, 'Where to learn it'))),
        h('tbody', null, THEN_NOW.map(function (r) {
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

  /** How Java runs here, and what state it is in. Also used by the badge's dialog. */
  U.runtimeExplainer = function () {
    var info = U.run.info;
    var now = info.state === 'loading' ? 'Looking for the local server…' :
      info.state === 'offline' ? 'Now: **reading only.** This page was not opened through jclearn, so code cannot run.' :
        info.state === 'error' ? 'Now: **the compiler could not start**: ' + (info.detail || 'unknown error') + '.' :
          info.state === 'warming' ? 'Now: **Java ' + info.java + '**, warming up (the first compile after a start takes about a second).' :
            'Now: **Java ' + info.java + '**, on this PC (' + info.cores + ' processor cores), through `jclearn`.';
    return h('div', { class: 'card runtime-card', html: U.md(
      now + '\n\n' +
      '- **Start it with `jclearn.cmd`.** Double-click it in the JavaConcurrencyLearningTool folder (or run `python jclearn.py`). It opens http://127.0.0.1:8028 and compiles and runs every program with the JDK 25 installed on this PC, preview features on (structured concurrency is a preview API in Java 25). It works offline. Keep its window open while you learn.\n' +
      '- **Why it is fast.** One JVM keeps the Java compiler loaded, so a compile takes well under a tenth of a second after the first. Each program then runs in a fresh JVM of its own, so a program that never ends (a deadlock, say) can be stopped.\n' +
      '- **Opened from disk** (`index.html`), or on the public Learning Hub, every lesson, quiz, interview question and flashcard can be read, but nothing runs: Java must be compiled first, and no browser runs a JDK with virtual threads.\n\n' +
      '**Your progress is kept separately for each address.** Browsers store data per address, so lessons finished at http://127.0.0.1:8028 do not show at `file://…/index.html`, and the other way round. To move it, use **Back up to a file** in one and **Restore from a file** in the other (bottom of the home page).') });
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
      var name = 'java-concurrency-learning-tool-backup-' + localDate(new Date()) + '.json';
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
        'Clearing the browser\'s data deletes them. A backup file keeps them safe and moves them to another browser, another PC, or between the page opened from disk and the one jclearn serves.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: backUp }, 'Back up to a file'),
        h('button', { class: 'btn', type: 'button', onclick: function () { fileInput.click(); } }, 'Restore from a file…'),
        fileInput),
      msg, confirmRow);
  }
  U.route('home', U.views.home);
})(window.JCLT);
