/*
 * views/javascript.js - JavaScript for React (#/javascript, #/javascript/<id>): the shorthand modern
 * JavaScript is written in, as React code uses it. Each entry gives what it means, the shorthand, the
 * same thing written out, the nearest Java and where Java differs, the trap, and the lesson where it is
 * first met. Its Run button runs run.js in a preview (a plain module, no component): the shorthand
 * prints run.prints, then the written-out form prints them again, and the page says whether the two
 * matched. run.java, shown under it, prints the same lines (tests/test_ui.py runs it with the JDK).
 *
 * The filter narrows the entries as you type; #/javascript/<id> scrolls to one and marks it; Ctrl K
 * finds each (js/app.js), and any text can link one with [[js:<id>]]. The lessons show a "New
 * JavaScript in this lesson" box for the entries whose `first` they are (views/lessons.js). The
 * entries are in data/javascript.js.
 */
(function (U) {
  'use strict';
  var h = U.h;
  // the UI Learning Tool sits next to this folder in the github folder; it opens from disk too
  var UILT = '../UILearningTool/index.html#/js/';

  function plain(md) { return String(md || '').replace(/`/g, '').replace(/\*\*/g, '').replace(/\[\[\w+:([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, id, l) { return l || id; }); }

  /** "lesson 6: Lists and keys", the lesson's place in the course and its title. */
  function lessonName(id) {
    var all = U.data.lessons || [], l = U.find('lessons', id);
    return l ? 'lesson ' + (all.indexOf(l) + 1) + ': ' + l.title : id;
  }

  /** The Run button, the console it prints to, and the verdict: did both forms print run.prints? */
  function runArea(e, entry) {
    var prints = e.run.prints;
    var out = h('div', { class: 'js-run-out', hidden: true });
    var verdict = h('p', { class: 'js-verdict', role: 'status', hidden: true });
    var runner = h('div', { class: 'js-runner', 'aria-hidden': 'true' });   // the preview: nothing to see, only the console
    var preview = null, panel = null, lines = [];
    var btn = h('button', { class: 'btn btn-primary btn-small js-run-btn', type: 'button', onclick: run }, '▶ Run both forms');

    function run() {
      if (!preview) {
        panel = U.preview.console(out);
        preview = U.preview.create(runner, {
          height: 1, script: true, title: 'Runs the code of ' + e.title,
          onConsole: function (c) { panel.add(c); if (c.level !== 'clear') lines.push(c); }
        });
      }
      panel.clear();
      lines = [];
      out.hidden = false;
      verdict.hidden = true;
      btn.disabled = true;
      entry.setAttribute('data-run', 'running');
      preview.render({ code: e.run.js }, { force: true }).then(function (r) {
        btn.disabled = false;
        entry.setAttribute('data-run', r.state === 'ready' ? 'ready' : 'error');
        var n = prints.length;
        var said = lines.filter(function (l) { return l.level === 'log' || l.level === 'info'; }).map(function (l) { return l.text; });
        var bad = lines.some(function (l) { return l.level === 'error' || l.level === 'warn'; });
        function same(part) { return part.length === n && part.every(function (x, i) { return x === prints[i]; }); }
        var ok = r.state === 'ready' && !bad && same(said.slice(0, n)) && same(said.slice(n));
        verdict.hidden = false;
        verdict.setAttribute('data-same', ok ? 'true' : 'false');
        verdict.className = 'js-verdict ' + (ok ? 'ok' : 'bad');
        verdict.textContent = ok ? '✓ The shorthand and the written-out form printed the same ' + U.plural(n, 'line', 'lines') + ', the ' + (n === 1 ? 'one' : 'ones') + ' the Java below prints.'
          : '✗ The two forms did not print the same lines. Each should print: ' + prints.join(' | ');
      });
    }

    return h('div', { class: 'js-run' },
      h('h3', null, 'Run it'),
      h('p', { class: 'muted' }, 'This program prints through the shorthand, then through the written-out form. Both should print the same:'),
      h('pre', { class: 'js-prints' }, prints.join('\n')),
      h('div', { class: 'js-run-code' }, U.codeBlock(e.run.js, 'jsx', { label: 'run.js', playground: false }).el),
      h('div', { class: 'row' }, btn),
      out, verdict, runner,
      h('details', { class: 'js-java-run' },
        h('summary', null, 'The same in Java: it prints these lines too'),
        U.codeBlock(e.run.java, 'java', { label: 'Main.java' }).el,
        h('p', { class: 'faint' }, 'To run it: save it as Main.java and type java Main.java (Java 21 or later runs a single file without compiling it first).')));
  }

  function entryCard(e) {
    var first = e.first ? U.find('lessons', e.first) : null;
    var el = h('article', { class: 'js-entry card', id: 'js-' + e.id, 'data-id': e.id });
    el.appendChild(h('div', { class: 'js-head' },
      h('h2', null, e.title),
      h('p', { class: 'js-first faint' }, first ? ['First met in ', h('a', { href: '#/lessons/' + first.id }, lessonName(first.id))] :
        'No lesson here uses it; React code elsewhere does.')));
    el.appendChild(h('div', { class: 'js-says', html: U.md(e.says) }));
    el.appendChild(h('div', { class: 'js-forms' },
      h('div', { class: 'js-short' }, U.codeBlock(e.short, 'jsx', { label: 'The shorthand', playground: false }).el),
      h('div', { class: 'js-long' }, U.codeBlock(e.long, 'jsx', { label: e.longLabel || 'Written out', playground: false }).el),
      h('div', { class: 'js-java' }, U.codeBlock(e.java, 'java', { label: e.javaLabel || 'The nearest Java' }).el)));
    el.appendChild(U.callout('java', 'Next to Java', U.md(e.javaNote)));
    var trap = U.callout('warn', 'The trap', U.md(e.trap));
    trap.classList.add('js-trap');
    el.appendChild(trap);
    el.appendChild(runArea(e, el));
    if (e.uilt) {
      el.appendChild(h('p', { class: 'js-more faint' },
        h('a', { href: UILT + e.uilt, title: 'Opens the UI Learning Tool, if it sits next to this folder' }, 'More in the UI Learning Tool, with Java side by side ↗')));
    }
    U.enhance(el);
    return el;
  }

  U.views.javascript = {
    render: function (root, params) {
      var entries = U.data.javascript || [];
      root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'JavaScript for React'),
        h('p', { html: U.mdInline('React code is written in modern JavaScript shorthand: `=>`, `const [a, b] =`, `...`, `?.`. Here are the ' + entries.length +
          ' that React code leans on, in the order the lessons first use them. Each gives the shorthand, the same thing written out, and the nearest Java, ' +
          'with where Java differs and the trap. Each runs: both forms print the same lines. A lesson that uses one for the first time links it, in a "New JavaScript in this lesson" box.') })));
      root.appendChild(h('nav', { class: 'js-index row', 'aria-label': 'The entries' }, entries.map(function (e) {
        return h('a', { class: 'btn btn-small', href: '#/javascript/' + e.id }, e.title);
      })));
      var filter = h('input', { class: 'input js-filter', id: 'js-filter', type: 'search', autocomplete: 'off', spellcheck: 'false',
        placeholder: 'Filter: a word, or Java (lambda, Optional…)', 'aria-label': 'Filter the entries' });
      var empty = h('p', { class: 'muted js-empty', hidden: true });
      var list = h('div', { class: 'js-list' });
      root.appendChild(filter);
      root.appendChild(empty);
      root.appendChild(list);
      var rows = entries.map(function (e) {
        var el = entryCard(e);
        list.appendChild(el);
        return { el: el, hay: [e.title, (e.keywords || []).join(' '), plain(e.says), e.short, e.long, e.java, plain(e.javaNote), plain(e.trap)].join(' ').toLowerCase() };
      });
      function apply() {
        var words = filter.value.toLowerCase().trim().split(/\s+/).filter(Boolean), shown = 0;
        rows.forEach(function (r) {
          r.el.hidden = !words.every(function (w) { return r.hay.indexOf(w) >= 0; });
          if (!r.el.hidden) shown++;
        });
        empty.hidden = shown > 0;
        empty.textContent = 'No entry matches "' + filter.value + '". Try a shorter word, or Ctrl K to search the lessons too.';
      }
      filter.addEventListener('input', apply);
      apply();
      if (params[0]) {
        var el = document.getElementById('js-' + params[0]);
        if (el) {
          el.classList.add('js-on');
          setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 0);   // after the router's scroll to the top
        }
      }
    }
  };
  U.route('javascript', U.views.javascript);
})(window.RLT);
