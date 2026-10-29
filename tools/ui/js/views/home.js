/*
 * views/home.js - the start page (#/): where to begin, what is in the tool, and a Java-to-web map.
 */
(function (U) {
  'use strict';
  var h = U.h;

  var PRIMER = [
    ['A tree of objects parsed from XML (`org.w3c.dom`)', 'The DOM: the tree the browser builds from HTML', 'explain:dom-tree'],
    ['A class with fields set in its constructor', 'An element: its tag and its attributes', 'html:a'],
    ['A layout manager (`BoxLayout`, `GridBagLayout`)', 'Flexbox and Grid', 'explain:flexbox'],
    ['Method overriding, most specific wins', 'The cascade and specificity', 'explain:specificity'],
    ['Fields inherited from a superclass', 'Inherited CSS properties (colour, font)', 'term:inheritance'],
    ['`ActionListener` on a `JButton`', '`addEventListener("click", …)`', 'js:events'],
    ['An exception travelling up the call stack', 'A click bubbling up through the parent elements', 'explain:bubbling'],
    ['Swing\'s Event Dispatch Thread and `invokeLater`', 'The event loop and `setTimeout(…, 0)`', 'explain:event-loop'],
    ['`final` / a lambda / `List` / `Map`', '`const` / an arrow function / an array / an object', 'js:basics'],
    ['`RestTemplate` returning a `CompletableFuture`', '`fetch()` with `async`/`await`', 'js:fetch'],
    ['Jackson `ObjectMapper`', '`JSON.stringify` / `JSON.parse`', 'js:json'],
    ['`@PostMapping` + `@RequestParam`', 'A `<form>` with named inputs', 'html:form'],
    ['`@Profile` / conditional config', 'Media queries', 'lesson:css-responsive'],
    ['`java.util.prefs.Preferences`', '`localStorage`', 'js:storage']
  ];

  function counts() {
    var els = U.data.htmlElements || [], props = U.data.cssProperties || [];
    var values = 0;
    els.forEach(function (e) { (e.attributes || []).forEach(function (a) { values += (a.values || []).length; }); });
    props.forEach(function (p) { values += (p.values || []).length; });
    return { els: els.length, props: props.length, values: values, lessons: (U.data.lessons || []).length, topics: (U.data.jsTopics || []).length, explainers: (U.data.explainers || []).length, terms: (U.data.glossary || []).length,
      recreate: (U.data.recreate || []).length, recipes: (U.data.recipes || []).length };
  }

  U.views.home = {
    render: function (root) {
      var c = counts();
      var done = U.store.get('lessons.done', {});
      var lessons = U.data.lessons || [];
      var finished = lessons.filter(function (l) { return done[l.id]; }).length;
      var nextLesson = lessons.filter(function (l) { return !done[l.id]; })[0];
      var lastLesson = U.find('lessons', U.store.get('lessons.last', ''));
      var resume = lastLesson && !done[lastLesson.id] ? lastLesson : nextLesson;

      // --- hero
      var preview = U.preview.create(null, { height: 230, title: 'A live example' });
      root.appendChild(h('section', { class: 'hero' },
        h('div', null,
          h('div', { class: 'card-kicker' }, 'For a Java developer new to UI'),
          h('h1', null, 'Learn HTML, CSS and JavaScript by changing things and watching what happens'),
          h('p', null, 'Every element, attribute, CSS property and value has a plain explanation and a live preview. ' +
            'Guided lessons check your work as you type, and the explainers show what the browser is doing.'),
          h('div', { class: 'row', style: { marginTop: '14px' } },
            resume ? h('a', { class: 'btn btn-primary', href: '#/lessons/' + resume.id }, finished ? 'Continue: ' + resume.title + ' →' : 'Start lesson 1 →') :
              h('a', { class: 'btn btn-primary', href: '#/playground' }, 'All lessons done - open the Playground →'),
            h('a', { class: 'btn', href: '#/playground' }, 'Open the Playground'),
            h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { U.openSearch && U.openSearch(); } }, 'Search (Ctrl K)')),
          h('div', { class: 'stat-row' },
            h('div', { class: 'stat' }, h('b', null, c.els), h('span', null, 'HTML elements')),
            h('div', { class: 'stat' }, h('b', null, c.props), h('span', null, 'CSS properties')),
            h('div', { class: 'stat' }, h('b', null, c.values), h('span', null, 'values explained')),
            h('div', { class: 'stat' }, h('b', null, c.lessons), h('span', null, 'lessons')),
            h('div', { class: 'stat' }, h('b', null, c.explainers), h('span', null, 'explainers')))),
        h('div', null, preview.wrap, h('p', { class: 'faint', style: { margin: '6px 0 0' } }, 'A live preview: everything in this tool is real HTML and CSS running in your browser.'))));
      preview.render({
        html: '<div class="card">\n  <img src="avatar.svg" alt="">\n  <div>\n    <b>Hello, Ravi!</b>\n    <p>This card is 12 lines of CSS.</p>\n    <button>Like ♥</button>\n  </div>\n</div>',
        css: 'body { margin: 0; display: grid; place-items: center; height: 100vh; font-family: system-ui, sans-serif; background: linear-gradient(135deg, #eef1fb, #ffe7c2); }\n' +
          '.card { display: flex; gap: 14px; align-items: center; padding: 18px; border-radius: 14px; background: white; box-shadow: 0 8px 24px rgb(0 0 0 / 12%); animation: pop .6s ease-out; }\n' +
          '.card img { width: 64px; border-radius: 50%; }\n.card p { margin: 4px 0 8px; color: #4d5568; }\n' +
          'button { border: 0; border-radius: 999px; padding: 6px 14px; background: #4353c9; color: white; cursor: pointer; transition: transform .2s; }\nbutton:hover { transform: scale(1.08); }\n' +
          '@keyframes pop { from { transform: translateY(12px) scale(.95); opacity: 0; } }'
      });

      // --- quiz questions waiting for review
      var review = U.quiz.reviewCard();
      if (review) { review.style.marginTop = '18px'; root.appendChild(review); }

      // --- progress and continue
      if (finished || U.store.get('last', null)) {
        var last = U.store.get('last', null);
        root.appendChild(h('div', { class: 'card', style: { marginTop: '18px' } },
          h('div', { class: 'row' }, h('b', null, 'Your progress: ' + finished + ' of ' + lessons.length + ' lessons'), h('span', { class: 'spacer' }),
            last && last !== '#/' ? h('a', { href: last }, 'Back to where you were: ' + decodeURIComponent(last.replace(/^#\//, '').replace(/\?.*$/, '')) + ' →') : null),
          h('div', { class: 'progress', style: { marginTop: '8px' } }, h('span', { style: { width: (lessons.length ? finished / lessons.length * 100 : 0) + '%' } }))));
      }

      // --- what is inside
      root.appendChild(h('h2', null, 'What is inside'));
      var sections = [
        ['#/lessons', c.lessons + ' lessons', 'Guided lessons', 'From your first page to fetching data from an API. Each ends with a challenge that is checked as you type, and a short quiz.'],
        ['#/recreate', c.recreate + ' designs', 'Recreate this', 'See a finished design and write the CSS until your preview matches it. The tool names every difference.'],
        ['#/recipes', c.recipes + ' recipes', 'UI pattern recipes', 'Dialog, tabs, dropdown menu, toast, sortable table: how each works, why it is accessible, ready for the Playground.'],
        ['#/html', c.els + ' elements', 'HTML reference', 'Every element with its attributes and every possible value, each with a live preview.'],
        ['#/css', c.props + ' properties', 'CSS reference', 'Every value of every property, a "compare all values" grid, sliders and colour pickers.'],
        ['#/js', c.topics + ' topics', 'JavaScript', 'The DOM, events, forms, storage and fetch - each next to the Java you already know.'],
        ['#/explain', c.explainers + ' explainers', 'Visual explainers', 'Box model, flexbox, grid, positioning, specificity, the DOM tree and units, measured live - plus the event loop and event bubbling.'],
        ['#/playground', 'HTML + CSS + JS', 'Playground', 'Write anything and see it as you type. Save snippets, start from templates, export a file.'],
        ['#/glossary', c.terms + ' terms', 'Glossary', 'The jargon, explained in plain words.']
      ];
      root.appendChild(h('div', { class: 'cards' }, sections.map(function (s) {
        return h('a', { class: 'card', href: s[0] }, h('div', { class: 'card-kicker' }, s[1]), h('h3', null, s[2]), h('p', { class: 'muted', style: { margin: 0 } }, s[3]));
      })));

      // --- how to use
      root.appendChild(h('h2', null, 'How to use it'));
      root.appendChild(h('div', { class: 'card', html: U.md(
        '1. **New to all of this?** Do the lessons in order; each takes a few minutes. The **Example** tab shows the idea, the **Challenge** tab checks your attempt, and a short quiz ends each lesson. Questions you miss come back later in your **review** until you know them.\n' +
        '2. **Want practice?** **Recreate** shows finished designs to rebuild in CSS, with every difference named. **Recipes** are complete dialogs, tabs, menus, toasts and sortable tables to study and reuse.\n' +
        '3. **Looking something up?** Press **Ctrl K** (or **/**) and type: `center`, `flex`, `input`, `border`, `click`…\n' +
        '4. **On a reference page,** hover a value to preview it and click to keep it. "Open in Playground" copies the example so you can keep editing.\n' +
        '5. **In the Playground,** Ctrl+Enter re-runs, Ctrl+S saves. A pretend server answers `fetch("/api/users")`. The Properties and Inspect tabs under the preview show every property of a rule, or of any element you click.\n' +
        '6. **While you type,** lists show only the valid values (↑ ↓ previews each one), hovering any word explains it, Alt+↑ / Alt+↓ changes numbers, and ⚠ marks CSS lines that do nothing and JavaScript worth a second look (`getElementByID`, `==`, a selector that finds nothing) - with the reason.\n' +
        '7. **Press Shift+Alt+F** in any editor to tidy the indentation (or **Format** in the Playground). In HTML, type an Emmet abbreviation such as `ul>li*3` and press **Tab**.\n' +
        '8. **Give the code room.** Drag the line between two columns, or the bar under an editor; each stays where you leave it. **Full screen** puts the page across the whole window (on a lesson, **Hide text** gives the code all of it), and **Esc** leaves.\n' +
        '9. **Everything is stored in this browser only.** No account, no server, works offline. Keep a backup file with **Your data** at the bottom of this page.') }));

      // --- Java primer
      root.appendChild(h('h2', null, 'If you know Java, you already know…'));
      root.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null, h('th', null, 'In Java'), h('th', null, 'On the web'), h('th', null, 'Learn it'))),
        h('tbody', null, PRIMER.map(function (r) {
          var m = /^(\w+):(.+)$/.exec(r[2]);
          return h('tr', null, h('td', { html: U.md(r[0]).replace(/^<p>|<\/p>$/g, '') }), h('td', { html: U.md(r[1]).replace(/^<p>|<\/p>$/g, '') }),
            h('td', null, h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) })));
        })))));

      // --- back up and restore
      root.appendChild(h('h2', { id: 'your-data' }, 'Your data'));
      root.appendChild(dataCard(finished));
    }
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
      var name = 'ui-learning-tool-backup-' + localDate(new Date()) + '.json';
      U.download(name, JSON.stringify(U.backup.collect(), null, 2), 'application/json');
      say('Downloaded ' + name + '. Keep it somewhere safe, such as OneDrive.');
    }
    function ask(obj, info) {
      var when = new Date(info.savedAt);
      say('This backup is from ' + (isNaN(when) ? 'an unknown date' : when.toLocaleString()) + ' and holds ' +
        info.lessons + ' finished lesson' + (info.lessons === 1 ? '' : 's') + ' and ' + info.snippets + ' saved snippet' + (info.snippets === 1 ? '' : 's') +
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
        fileInput.value = ''; // so choosing the same file again fires "change" again
        var obj = null;
        try { obj = JSON.parse(reader.result); } catch (e) { obj = null; }
        var info = U.backup.inspect(obj);
        confirmRow.hidden = true;
        if (info.ok) ask(obj, info); else say(info.msg, true);
      };
      reader.readAsText(file);
    });

    return h('div', { class: 'card' },
      h('p', { style: { marginTop: 0 } }, 'Your lesson progress (' + finished + ' done), saved Playground snippets (' + snippets + ') and settings live only in this browser. ' +
        'Clearing the browser\'s data deletes them. A backup file keeps them safe and moves them to another browser or PC.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: backUp }, 'Back up to a file'),
        h('button', { class: 'btn', type: 'button', onclick: function () { fileInput.click(); } }, 'Restore from a file…'),
        fileInput),
      msg, confirmRow);
  }
  U.route('home', U.views.home);
})(window.UILT);
