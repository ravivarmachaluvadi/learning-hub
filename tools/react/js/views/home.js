/*
 * views/home.js - the start page (#/): where to begin, what is in the tool, a plain-JS-to-React map,
 * where React comes from, and backing up your data.
 */
(function (U) {
  'use strict';
  var h = U.h;

  // [in plain JavaScript, in React, where to learn it]
  var PRIMER = [
    ['`document.createElement`, `appendChild`', 'A component returns JSX; React builds the DOM', 'lesson:r-first-component'],
    ['`el.className = "card"`', '`<div className="card">`', 'lesson:r-jsx'],
    ['`el.style.color = "red"`', '`style={{ color: "red" }}`', 'lesson:r-jsx'],
    ['A function that builds a piece of the page', 'A component: `function Card(props)`', 'lesson:r-props'],
    ['Passing values to that function', 'Props: `<Card title="Hi" />`', 'lesson:r-props'],
    ['`wrapper.appendChild(child)`', '`children`: `<Card>…</Card>`', 'lesson:r-children'],
    ['`if (x) el.hidden = false`', '`{x && <p>…</p>}` or a ternary', 'lesson:r-conditional'],
    ['`items.forEach(i => ul.appendChild(li))`', '`{items.map(i => <li key={i.id}>…</li>)}`', 'lesson:r-lists-keys'],
    ['`btn.addEventListener("click", fn)`', '`<button onClick={fn}>`', 'lesson:r-events'],
    ['A variable plus a `render()` you call by hand', '`const [count, setCount] = useState(0)`', 'lesson:r-state-basics'],
    ['`count++` changes the variable at once', 'The setter asks for the next render; this render keeps its value', 'lesson:r-state-snapshot'],
    ['`user.age = 31; render();`', '`setUser({ ...user, age: 31 })`: a new object', 'lesson:r-state-objects'],
    ['`todos.push(todo); render();`', '`setTodos([...todos, todo])`, `filter`, `map`', 'lesson:r-state-arrays'],
    ['`form.elements.email.value` on submit', '`value={email} onChange={…}`: a controlled input', 'lesson:r-forms'],
    ['A shared variable two widgets redraw from', 'State lifted to the common parent, passed down as props', 'lesson:r-lifting-state'],
    ['One `update(state, event)` with a `switch`', '`useReducer(reducer, initialState)` and `dispatch`', 'lesson:r-use-reducer'],
    ['Extra work after `render()`: `document.title = …`', '`useEffect(() => { … }, [deps])`: runs after React has drawn', 'lesson:r-effects'],
    ['`addEventListener` and `removeEventListener`, `setInterval` and `clearInterval`', 'An effect that returns its cleanup', 'lesson:r-effect-cleanup'],
    ['`fetch(url).then(render)`', '`fetch` in an effect; the cleanup drops a stale answer', 'lesson:r-fetching'],
    ['A variable outside your functions: `let timerId`', '`useRef`: it survives renders, and changing it draws nothing', 'lesson:r-refs'],
    ['`document.querySelector("#name").focus()`', '`<input ref={nameRef} />`, then `nameRef.current.focus()`', 'lesson:r-dom-refs'],
    ['A helper you reuse on every page: `debounce(fn, 300)`', 'A custom hook: `useDebounce(value, 300)`', 'lesson:r-custom-hooks'],
    ['`renderPage({ header: headerEl })`: pass a built piece, not its data', '`children` and slot props: `<Page header={<Header />}>`', 'lesson:r-composition'],
    ['A global variable every module reads', 'Context: `<ThemeContext value={…}>`, read with `useContext`', 'lesson:r-context'],
    ['`try { drawWidget(); } catch { showError(); }`', 'An error boundary around the widget', 'lesson:r-error-boundaries'],
    ['`document.body.append(menu)` for a menu its box would clip', '`createPortal(menu, document.body)`', 'lesson:r-portals'],
    ['Calling only the `render()` of what changed', 'State kept low; `memo` to skip a re-render', 'lesson:r-memo'],
    ['A cache in front of a slow function', '`useMemo(() => slow(a), [a])`', 'lesson:r-usememo-usecallback'],
    ['`debounce(render, 200)` to keep typing smooth', '`useDeferredValue(query)`, or `startTransition`', 'lesson:r-transitions'],
    ['`await import(\'./chart.js\')` when it is first needed', '`lazy(() => import(\'./Chart\'))` inside `<Suspense>`', 'lesson:r-lazy-suspense'],
    ['A scroll listener and a small pool of row elements', 'A virtualised list: render only the visible slice', 'lesson:r-long-lists'],
    ['`e.preventDefault()`, `new FormData(form)`, `fetch`, then `form.reset()`', '`<form action={save}>`: an Action gets the `FormData`; the form resets itself', 'lesson:r-actions'],
    ['Errors written into the page by the submit handler', '`useActionState`: the action returns the errors; React draws them', 'lesson:r-use-action-state'],
    ['`e.submitter.disabled = true` in every form', 'One `SubmitButton` that asks its form: `useFormStatus()`', 'lesson:r-use-form-status'],
    ['`heart.classList.add("liked")`, and remove it if the request fails', '`useOptimistic`: shown at once, undone by itself on failure', 'lesson:r-use-optimistic'],
    ['`await fetch(…)`, with "Loading…" drawn by hand', '`use(promise)` inside `<Suspense>`', 'lesson:r-use'],
    ['`document.title = "Inbox (3)"`', '`<title>Inbox (3)</title>` from any component (React 19)', 'lesson:r-react-19-upgrade'],
    ['A Thymeleaf page, then a script that adds the listeners', 'Server rendering, then `hydrateRoot` attaches React to that HTML', 'lesson:r-rendering-strategies'],
    ['Server code for the page, a little script for the clicks', 'Server Components, and Client Components for what reacts', 'lesson:r-server-components'],
    ['Clicking through the page by hand before each release', 'Tests that click and type as a user does: React Testing Library', 'lesson:r-testing']
  ];

  function sections(c) {
    return [
      ['#/lessons', c.lessons + ' lessons', 'Lessons', 'From your first component to React 19, each next to the plain-JS way you know. A checked challenge and a short quiz end every lesson.'],
      ['#/interview', c.questions + ' questions', 'Interview Q&A', 'The React questions interviews ask, from your own notes: the 30-second answer, the full answer, the follow-ups. Practise them as flashcards.'],
      ['#/build', c.builds + ' problems', 'Machine coding', 'Build the components interviews ask for against a timer, checked by clicking and typing in your component the way a user would.'],
      ['#/mock', 'Rehearse', 'Mock interview', 'Questions answered out loud against a clock, a follow-up after each, then a timed machine-coding round. A scorecard says what to revise, and your grades move the flashcards too.'],
      ['#/explain', U.plural(c.explainers, 'explainer', 'explainers'), 'Explainers', 'The ideas that trip people up, taken apart one move at a time, then run in real React to compare: why three setCount(count + 1) add one, when an effect and its cleanup run, the stale closure, why a list item keeps or loses its state.'],
      ['#/reference', c.api + ' hooks and APIs', 'Reference', 'Every hook and API the editor knows, on one page: the signature, what it does, the snippet, its lesson, react.dev and the interview questions about it.'],
      ['#/glossary', c.glossary + ' terms', 'Glossary', 'React\'s words in plain language, each linked to where it is taught: reconciliation, hydration, Server Components, stale closure…'],
      ['#/javascript', c.javascript + ' shorthands', 'JavaScript for React', 'Coming from Java? The shorthand React code is written in (=>, const [a, b] =, ..., ?.), each next to the same thing written out and the nearest Java, and run to prove they print the same.'],
      ['#/playground', 'Run anything', 'Playground', 'Write any component and watch it run. Templates, saved snippets, a pretend /api for data, and tests that run too.']
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
      var builds = U.data.builds || [];
      var c = { lessons: lessons.length, quiz: U.quiz.questions().length, questions: (U.data.questions || []).length, builds: builds.length,
        explainers: (U.data.explainers || []).length, api: (U.data.api || []).length, glossary: (U.data.glossary || []).length, javascript: (U.data.javascript || []).length,
        fast: (U.data.questions || []).filter(function (q) { return q.weight === 3; }).length,
        checks: lessons.reduce(function (n, l) { return n + l.challenge.checks.length; }, 0) + builds.reduce(function (n, b) { return n + b.checks.length; }, 0) };

      // --- hero: the same counter in plain JavaScript and in React
      var plain = U.codeBlock('let count = 0;\nconst btn = document.querySelector("#btn");\n\nfunction render() {\n  btn.textContent = `Clicked ${count} times`;\n}\n\nbtn.addEventListener("click", () => {\n  count++;\n  render();     // you redraw by hand\n});\nrender();', 'js', { label: 'Plain JavaScript' });
      var react = U.codeBlock("import { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Clicked {count} times\n    </button>\n  );   // React redraws for you\n}", 'jsx', { label: 'React', title: 'Home page example' });
      root.appendChild(h('section', { class: 'hero' },
        h('div', null,
          h('div', { class: 'card-kicker' }, 'After HTML, CSS and JavaScript'),
          h('h1', null, 'Learn React 19 by running it, and get ready for the interview'),
          h('p', null, 'Every idea is shown next to the plain JavaScript you already know, every example runs live, every lesson ends with a challenge the tool checks for you, ' +
            'and the interview questions and machine-coding problems for each topic come with it.'),
          h('div', { class: 'row', style: { marginTop: '14px' } },
            resume ? h('a', { class: 'btn btn-primary', href: '#/lessons/' + resume.id }, finished ? 'Continue: ' + resume.title + ' →' : 'Start lesson 1 →') :
              h('a', { class: 'btn btn-primary', href: '#/build' }, 'All lessons done - try machine coding →'),
            h('a', { class: 'btn', href: '#/interview/cards' }, 'Flashcards'),
            h('a', { class: 'btn', href: '#/interview/cards?weight=3', title: 'The ' + c.fast + ' questions asked in almost every React round' }, '★★★ fast track'),
            h('a', { class: 'btn', href: '#/mock', title: 'Questions against the clock, then a machine-coding round' }, 'Mock interview'),
            h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { if (U.openSearch) U.openSearch(); } }, 'Search (Ctrl K)')),
          h('div', { class: 'stat-row' },
            h('div', { class: 'stat' }, h('b', null, c.lessons), h('span', null, 'lessons')),
            h('div', { class: 'stat' }, h('b', null, c.questions), h('span', null, 'interview questions')),
            h('div', { class: 'stat' }, h('b', null, c.builds), h('span', null, 'machine-coding problems')),
            h('div', { class: 'stat' }, h('b', null, c.checks), h('span', null, 'checks')))),
        h('div', { class: 'hero-code' }, plain.el, react.el,
          h('p', { class: 'faint js-hero-link', html: U.mdInline('New to `() =>` or `const [count, setCount] =`? [[js:arrow-functions|JavaScript for React]] takes them apart, next to Java.') }))));

      // --- what is waiting for review
      var review = U.quiz.reviewCard();
      if (review) { review.style.marginTop = '18px'; root.appendChild(review); }
      var cardsDue = U.cards.due().length;
      if (cardsDue) {
        root.appendChild(h('div', { class: 'card review-card', style: { marginTop: '12px' } },
          h('div', { class: 'row' }, h('b', null, U.plural(cardsDue, 'flashcard is', 'flashcards are') + ' due'), h('span', { class: 'spacer' }),
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

      // --- how to use
      root.appendChild(h('h2', null, 'How to use it'));
      root.appendChild(U.enhance(h('div', { class: 'card', html: U.md(
        '1. **Do the lessons in order.** Read the explanation, change the **Example** and watch the preview update, then solve the **Challenge**: "Check my answer" (Ctrl+Enter) renders your component and ticks each check. A short quiz ends each lesson. ' +
          'Coming from Java, or rusty on modern JavaScript? **JavaScript for React** takes apart the shorthand the lessons use (`=>`, `...`, `const [a, b] =`), and a lesson that uses one for the first time links it.\n' +
        '2. **Each track brings its interview questions and machine-coding problems.** When a track is done, practise its questions as **flashcards** and build its problems against the **timer** (start it: a solve records a time only if the timer ran).\n' +
        '3. **Interview soon?** The **★★★ fast track** drills the ' + c.fast + ' questions asked in almost every React round; the **Mock interview** rehearses a whole round, questions against the clock and then a problem, and tells you what to revise; the **Explainers** take the hardest ideas apart step by step.\n' +
        '4. **Stuck?** Hints come one at a time. A syntax error is underlined as you type; an error while your component runs marks its line, and the console says why. **Show solution** puts the answer in the editor to study; a pass with it does not count until you **Reset** and write it yourself.\n' +
        '5. **Missed a quiz question, or a flashcard?** It comes back until you know it: a day later, then three days, then a week.\n' +
        '6. **Let the editor teach you.** Type `use` for the hooks, `<` for tags, or press **Ctrl+Space**: picking `useState` writes the whole line and adds its import. Hover a hook for its card. A **⚠** in the margin is a React habit to change; hover it for why (and a fix). Under an error, the console says **what it means**. **Shift+Alt+F** tidies the code.\n' +
        '7. **See what rendered.** Turn on **Highlight renders** above any preview: each component that renders flashes, named, as React DevTools shows it, and the line under the preview lists them. The Performance lessons are built on it.\n' +
        '8. **Want to try something?** The **Playground** runs any component, with `fetch(\'/api/users\')` for pretend data.\n' +
        '9. **Give the code room.** Drag the line between the lesson and the code, or the grip under the editor; each stays where you leave it. **Full screen** puts the text beside the code across the whole window, **Hide text** gives the code all of it, and **Esc** leaves.\n' +
        '10. **Looking for something?** Press **Ctrl K** (or **/**) and type: `useState`, `cleanup`, `context`, `memo`, `useOptimistic`, `hydration`… The **Reference** lists every hook and API, with its lesson; the **Glossary** explains React\'s words.\n' +
        '11. **Everything you do is stored in this browser only.** No account. Keep a backup file with **Your data** below.') })));

      // --- plain JS -> React
      root.appendChild(h('h2', null, 'If you know plain JavaScript, you already know…'));
      root.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null, h('th', null, 'In plain JavaScript'), h('th', null, 'In React'), h('th', null, 'Lesson'))),
        h('tbody', null, PRIMER.map(function (r) {
          var m = /^(\w+):(.+)$/.exec(r[2]);
          return h('tr', null, h('td', { html: U.mdInline(r[0]) }), h('td', { html: U.mdInline(r[1]) }),
            h('td', null, h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) })));
        })))));

      // --- where React comes from
      root.appendChild(h('h2', { id: 'how-it-runs' }, 'Where React comes from'));
      root.appendChild(U.reactExplainer());

      // --- back up and restore
      root.appendChild(h('h2', { id: 'your-data' }, 'Your data'));
      root.appendChild(dataCard(finished));
      if (query && query.at) {
        var target = document.getElementById(query.at);
        if (target) setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 0);
      }
    }
  };

  /** How React runs here. Also shown by the header's badge. */
  U.reactExplainer = function () {
    var s = U.react.state;
    var now = s === 'loading' ? 'Loading the JSX translator and React…' : s === 'unavailable' ? '**Code cannot run now:** ' + U.react.problem + ' Lessons, quizzes and flashcards still work.' :
      '**Ready:** React ' + U.react.VERSION + ' runs your code.';
    return h('div', { class: 'card react-card', html: U.md(
      now + '\n\n' +
      '- **Your code runs in your browser.** The JSX you write is translated to plain JavaScript in this page by Babel ' + U.react.BABEL + ', then runs inside a sandboxed preview with React ' + U.react.VERSION + '. Nothing is installed and no server is needed.\n' +
      '- **No internet needed.** Babel and React are files in this folder (`vendor/`), so code runs offline as well as on: on a train, or with the wifi down.\n' +
      '- **It is the development build of React,** the one you use while building an app: its warnings (a missing `key`, a wrong prop) appear in the console under each preview, as they would in your browser\'s DevTools.') });
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
      var name = 'react-learning-tool-backup-' + localDate(new Date()) + '.json';
      U.download(name, JSON.stringify(U.backup.collect(), null, 2), 'application/json');
      say('Downloaded ' + name + '. Keep it somewhere safe, such as OneDrive.');
    }
    function ask(obj, info) {
      var when = new Date(info.savedAt);
      say('This backup is from ' + (isNaN(when) ? 'an unknown date' : when.toLocaleString()) + ' and holds ' +
        U.plural(info.lessons, 'finished lesson', 'finished lessons') + ', ' + U.plural(info.builds, 'solved problem', 'solved problems') + ', ' +
        U.plural(info.cards, 'practised flashcard', 'practised flashcards') + ' and ' + U.plural(info.snippets, 'saved snippet', 'saved snippets') +
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
      h('p', { style: { marginTop: 0 } }, 'Your lesson progress (' + finished + ' done), quiz and flashcard reviews, machine-coding times, saved Playground snippets (' + snippets + ') and settings live only in this browser. ' +
        'Clearing the browser\'s data deletes them. A backup file keeps them safe and moves them to another browser or PC.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: backUp }, 'Back up to a file'),
        h('button', { class: 'btn', type: 'button', onclick: function () { fileInput.click(); } }, 'Restore from a file…'),
        fileInput),
      msg, confirmRow);
  }
  U.route('home', U.views.home);
})(window.RLT);
