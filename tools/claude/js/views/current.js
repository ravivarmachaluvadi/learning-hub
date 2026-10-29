/*
 * views/current.js - "Keep it current" (#/current): what the tool's facts were checked against, the
 * steps to re-check them after a Claude Code update, a re-check prompt for any cited docs page, every
 * docs page the tool cites with what cites it, and where the course PDF is out of date.
 *
 * The cited pages and the baseline date come from data/sources.js, which tools/build.py writes from
 * the sources in content/ and tools/docs-baseline.json (recorded by tools/docs_check.py --update).
 */
(function (U) {
  'use strict';
  var h = U.h;
  var DOCS = 'https://code.claude.com/docs/en/';

  // the course deck against the docs (also in ROADMAP.md)
  var PDF = [
    ['The first mode is "Default"', 'It is labelled Manual; its settings value is still `default`, and the CLI also accepts `manual`'],
    ['`/agents` opens a menu to create a subagent', 'Since v2.1.198 it prints a reminder: ask Claude to create the subagent, or edit `.claude/agents/`'],
    ['`#` adds a quick note to memory', 'Not in the current interactive-mode docs; say "remember that…" or use `/memory`'],
    ['Fork a session with `--fork-session`', 'Still works; inside a session, `/branch` branches the conversation and `/fork` copies it into a background session'],
    ['Checkpoints expire after 30 days', 'Snapshots are deleted by the retention sweep, about 30 days by default (`cleanupPeriodDays`); 100 checkpoints per session keep their snapshots'],
    ['MEMORY.md: the first 200 lines load', 'The first 200 lines or 25 KB, whichever comes first'],
    ['`/cost` shows the cost', '`/cost` is an alias of `/usage`, which also shows plan limits and recommendations']
  ];

  /** '2026-10-25' -> '25 Oct 2026' */
  function day(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? +m[3] + ' ' + 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[+m[2] - 1] + ' ' + m[1] : (iso || '?');
  }

  function code(lang, text) { return h('div', { html: U.md('```' + lang + '\n' + text + '\n```') }); }

  function ids(refs, kind) {
    return refs.filter(function (r) { return r.indexOf(kind + ':') === 0; }).map(function (r) { return r.slice(kind.length + 1); });
  }
  var KINDS = [['lesson', 'lesson', 'lessons'], ['scenario', 'scenario', 'scenarios'], ['explainer', 'explainer', 'explainers'], ['cheat', 'cheat-sheet entry', 'cheat-sheet entries']];
  /** "3 lessons, 1 scenario, 43 cheat-sheet entries" */
  function summary(refs) {
    return KINDS.map(function (k) { var n = ids(refs, k[0]).length; return n ? n + ' ' + (n === 1 ? k[1] : k[2]) : null; }).filter(Boolean).join(', ');
  }

  /** The parts of the tool that cite a page, grouped by kind, with the files their text lives in. */
  function citedBy(refs) {
    var out = [];
    ids(refs, 'lesson').forEach(function (id) { var l = U.find('lessons', id); if (l) out.push('- Lesson "' + l.title + '": content/lessons/' + l.track + '/*-' + id + '.md'); });
    ids(refs, 'scenario').forEach(function (id) { var s = U.find('scenarios', id); if (s) out.push('- Scenario "' + s.title + '": content/scenarios/' + s.track + '/*-' + id + '.md'); });
    ids(refs, 'explainer').forEach(function (id) { var x = U.find('explainers', id); if (x) out.push('- Explainer "' + x.title + '": content/explainers.md and js/views/explainers/' + id + '.js'); });
    var cheats = ids(refs, 'cheat').map(function (id) { var c = U.find('cheats', id); return c ? c.name : id; });
    if (cheats.length) out.push('- In content/cheatsheet.md, the ' + (cheats.length === 1 ? 'entry ' : cheats.length + ' entries ') + cheats.join(', '));
    return out;
  }

  function recheckPrompt(src) {
    return ['Claude Code was updated, and this docs page may have changed since the Claude Learning Tool was checked against it:',
      src.url + '.md', '',
      'Read the page. Then read the parts of the tool that cite it:']
      .concat(citedBy(src.cites))
      .concat(['',
        'List every sentence in them that the page now contradicts or no longer supports, quoting the line of the page that says otherwise. ' +
        'Propose the smallest fix for each, and change nothing until I agree. After the fixes, run python -I tools/build.py and python -I tests/check_data.py.'])
      .join('\n');
  }

  function citeLinks(refs) {
    function one(r) {
      var m = /^(\w+):(.+)$/.exec(r);
      return h('li', null, h('span', { class: 'badge' }, U.kindLabel(m[1])), ' ', h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) }));
    }
    return h('details', { class: 'kc-more' }, h('summary', null, summary(refs)), h('ul', { class: 'plain-list kc-cites' }, refs.map(one)));
  }

  U.views.current = {
    render: function (root) {
      var src = U.data.sources || [], base = U.data.docsBaseline || {};
      root.appendChild(h('div', { class: 'page-head' },
        h('h1', null, 'Keep it current'),
        h('p', null, 'Claude Code changes every week or two, and its docs with it. Every lesson, scenario, explainer and cheat-sheet entry here names the docs pages it was checked against. ' +
          'This page shows what that was, and how to find what has changed since.')));

      root.appendChild(h('h2', null, 'What the facts were checked against'));
      root.appendChild(h('div', { class: 'card kc-version', id: 'kc-version' },
        h('p', { style: { marginTop: 0 } }, h('b', null, 'Claude Code ' + (base.version || '?')), ', with the docs as they were on ' + day(base.checked) +
          ': ' + U.plural(base.pages || 0, 'page') + ' recorded by ', h('code', null, 'tools/docs_check.py'), '.'),
        h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
          h('thead', null, h('tr', null, h('th', null, 'Part of the tool'), h('th', null, 'Claude Code'), h('th', null, 'Docs read'))),
          h('tbody', null,
            h('tr', null, h('td', null, 'Batches 1 to 3: the shell, the cheat sheet, the Basics, Context, Memory and Extending lessons'), h('td', null, '2.1.309'), h('td', null, '23 and 24 Oct 2026')),
            h('tr', null, h('td', null, 'Batches 4 and 5: the AI-DLC, Repos and Git lessons, the scenarios'), h('td', null, '2.1.310'), h('td', null, '25 Oct 2026'))))),
        h('p', { class: 'faint', style: { marginBottom: 0 } }, 'The baseline was recorded on ' + day(base.checked) + ', so the check can only show changes made after that day. ' +
          'Pages that batches 1 to 3 relied on may have changed between 23 and 25 Oct 2026; batch 4 re-read the permissions and memory pages.')));

      root.appendChild(h('h2', null, 'After Claude Code updates'));
      var steps = h('ol', { class: 'kc-steps' },
        h('li', null, h('b', null, 'See your version and what changed. '), 'Native installs update themselves in the background (', h('code', null, 'claude doctor'),
          ' shows the last attempt); WinGet and Homebrew installs do not. In a session, ', h('code', null, '/release-notes'),
          ' shows the changelog in a version picker, outside the conversation Claude sees. The same notes are on the ',
          h('a', { href: DOCS + 'changelog', target: '_blank', rel: 'noopener' }, 'changelog page'), '.',
          code('powershell', 'claude --version')),
        h('li', null, h('b', null, 'See which cited pages changed. '), 'From this folder. It downloads each page this tool cites as Markdown, compares it section by section with the baseline, ' +
          'and lists each changed page with the sections that changed and everything in the tool that cites it, plus the changelog\'s versions newer than the baseline. ' +
          'Exit code 1 means something changed.',
          code('powershell', 'python -I tools/docs_check.py')),
        h('li', null, h('b', null, 'Re-check what cites each changed page. '), 'Pick the page below, copy its prompt, and run it in Claude Code in this folder.'),
        h('li', null, h('b', null, 'Fix, rebuild, test, then record. '), 'Edit the files in ', h('code', null, 'content/'), ', never ', h('code', null, 'data/'),
          '. When the tests pass, record today\'s pages as the new baseline and update the version in the README.',
          code('powershell', 'python -I tools/build.py\npython -I tests/check_data.py\npython -I tests/test_ui.py\npython -I tools/docs_check.py --update\npython -I tools/build.py')));
      root.appendChild(steps);

      root.appendChild(h('h2', { id: 'recheck' }, 'Re-check one page'));
      var select = h('select', { class: 'select', id: 'kc-page', 'aria-label': 'The docs page to re-check' }, src.map(function (s) {
        return h('option', { value: s.page }, s.page + ' (' + U.plural(s.cites.length, 'citation') + ')');
      }));
      var out = h('div', { id: 'kc-prompt' });
      function draw() {
        var s = src.filter(function (x) { return x.page === select.value; })[0] || src[0];
        out.innerHTML = '';
        if (s) out.appendChild(code('text', recheckPrompt(s)));
      }
      select.addEventListener('change', draw);
      root.appendChild(h('div', { class: 'card' },
        h('label', { class: 'field-label', for: 'kc-page' }, 'The page that changed'), select, out));
      draw();

      root.appendChild(h('h2', null, 'Signs a fact has gone stale'));
      root.appendChild(h('ul', { class: 'kc-signs' },
        h('li', null, 'A command a lesson names is missing from the ', h('code', null, '/'), ' menu, or does something else.'),
        h('li', null, 'A flag is refused: Claude Code suggests the closest match and exits.'),
        h('li', null, h('code', null, 'claude doctor'), ' reports a settings validation error for a key the tool recommends.'),
        h('li', null, 'A permission rule, hook or skill field behaves differently from what the tool\'s checker says.'),
        h('li', null, 'The docs page an entry links to no longer mentions what the entry says.')));

      root.appendChild(h('h2', null, 'The pages this tool cites'));
      root.appendChild(h('p', { class: 'muted' }, U.plural(src.length, 'docs page') + ', the most cited first. Open a row to see everything that cites the page.'));
      var filter = h('input', { class: 'input', id: 'kc-filter', type: 'search', placeholder: 'Filter pages, such as hooks or permissions', 'aria-label': 'Filter the cited pages' });
      root.appendChild(filter);
      var body = h('tbody', null, src.map(function (s) {
        return h('tr', { 'data-page': s.page, 'data-cites': s.cites.length },
          h('td', null, h('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.page)),
          h('td', null, citeLinks(s.cites)),
          h('td', { class: 'faint' }, s.baseline ? day(s.baseline.checked) : 'not recorded'));
      }));
      root.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table kc-pages', id: 'kc-pages' },
        h('thead', null, h('tr', null, h('th', null, 'Docs page'), h('th', null, 'Cited by'), h('th', null, 'Recorded'))), body)));
      filter.addEventListener('input', function () {
        var q = filter.value.trim().toLowerCase();
        U.$$('tr', body).forEach(function (tr) { tr.hidden = q && tr.getAttribute('data-page').indexOf(q) < 0; });
      });

      root.appendChild(h('h2', null, 'Where the course PDF is out of date'));
      root.appendChild(h('p', { class: 'muted' }, 'The bootcamp deck this tool started from predates these. The tool follows the docs.'));
      root.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table', id: 'kc-pdf' },
        h('thead', null, h('tr', null, h('th', null, 'The PDF says'), h('th', null, 'Claude Code 2.1.309 and later'))),
        h('tbody', null, PDF.map(function (r) { return h('tr', null, h('td', { html: U.mdInline(r[0]) }), h('td', { html: U.mdInline(r[1]) })); })))));
      root.appendChild(h('p', { class: 'faint about' }, 'Checked against: ',
        ['setup', 'changelog', 'commands', 'cli-reference'].map(function (p, i) {
          return [i ? ', ' : '', h('a', { href: DOCS + p, target: '_blank', rel: 'noopener' }, 'docs: ' + p)];
        }), '.'));
    }
  };
  U.route('current', U.views.current);
})(window.CLT);
