/*
 * views/home.js - the home page (#/): what the tool is for, the problems it was built around
 * (data/problems.js), the review when quiz questions are due, a working day on one card, what is
 * inside, practice and keeping the facts current, and backing up your data.
 */
(function (U) {
  'use strict';
  var h = U.h;

  // a working day with Claude Code, in the order you meet each step
  var DAY = [
    '**Start or continue.** `claude -c` picks up where you left off; `claude -n "search-phase-3"` starts a named session. In a phased feature, type `/phase-next`.',
    '**Plan before building.** Anything bigger than one file: Shift+Tab to plan mode (or `/plan ...`), read the plan, correct it, approve.',
    '**Point, do not describe.** `@src/search/api.ts` for the file, `!cargo test` or `!pnpm test` for the real output.',
    '**Stop early.** Esc the moment it heads the wrong way; Esc Esc (or `/rewind`) to undo a wrong turn.',
    '**Watch the context.** `/context` before a long step; `/btw` for side questions that should not stay in the conversation.',
    '**Prove it.** Real test output, `/diff` before every commit, `/verify` for anything a user sees.',
    '**Close and clear.** `/phase-close` writes what the phase delivered and commits; `/rename`, then `/clear`.',
    '**When your manager pings.** `/crisp` and the question: a 3-sentence answer, checked before you send it.'
  ];

  U.views.home = {
    render: function (root) {
      var d = U.data;
      root.appendChild(h('section', { class: 'hero' },
        h('div', null,
          h('div', { class: 'card-kicker' }, 'Claude Learning Tool'),
          h('h1', null, 'The part of Claude Code you use every day'),
          h('p', null, 'The official docs cover everything; this covers what a developer building big, PRD-driven features in TypeScript and Rust reaches for daily: ' +
            'the commands, the prompts that work, step-by-step playbooks, checkers for what you are about to send, and ready-made skills you can install.'),
          h('div', { class: 'row' },
            h('a', { class: 'btn btn-primary', href: '#/cheatsheet?top=1' }, 'The top 20 commands →'),
            h('a', { class: 'btn', href: '#/lessons' }, 'The lessons'),
            h('a', { class: 'btn', href: '#/scenarios' }, 'Practise a scenario'),
            h('a', { class: 'btn', href: '#/playbooks/phase-loop' }, 'The phase loop'))),
        h('div', { class: 'stat-row' },
          stat('lessons', (d.lessons || []).length, 'lessons'),
          stat('scenarios', (d.scenarios || []).length, 'scenarios'),
          stat('cheats', (d.cheats || []).length, 'commands and keys'),
          stat('prompts', (d.prompts || []).length, 'prompts'),
          stat('playbooks', (d.playbooks || []).length, 'playbooks'),
          stat('kit', (d.kit || []).length, 'kit files'))));
      var review = U.quiz.reviewCard();
      if (review) root.appendChild(review);

      root.appendChild(h('h2', null, 'The problems it was built around'));
      root.appendChild(h('p', { class: 'muted' }, 'Each row names the habit that fixes it and where to find the help.'));
      root.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table problems-table' },
        h('thead', null, h('tr', null, h('th', null, 'The problem'), h('th', null, 'The habit'), h('th', null, 'Help'))),
        h('tbody', null, (d.problems || []).map(function (p) {
          return h('tr', { 'data-id': p.id },
            h('td', null, p.problem),
            h('td', { html: U.mdInline(p.habit) }),
            h('td', null, h('ul', { class: 'plain-list' }, p.links.map(function (r) {
              var m = /^(\w+):(.+)$/.exec(r);
              return h('li', null, h('span', { class: 'badge' }, U.kindLabel(m[1])), ' ', h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) }));
            }))));
        })))));

      root.appendChild(h('h2', null, 'A working day with Claude Code'));
      root.appendChild(h('div', { class: 'card daily-card' }, h('ol', null, DAY.map(function (s) {
        return h('li', { html: U.mdInline(s) });
      }))));

      root.appendChild(h('h2', null, 'What is inside'));
      root.appendChild(h('div', { class: 'cards' },
        section('#/lessons', 'Lessons', (d.lessons || []).length + ' short lessons with quizzes: modes and permissions, context and sessions, CLAUDE.md and memory, extending Claude, ' +
          'AI-driven development (AI-DLC), unfamiliar and multiple repos, git and automation. ' +
          (d.explainers || []).length + ' explainers you can change, and a glossary of ' + (d.glossary || []).length + ' terms.'),
        section('#/scenarios', 'Practice', (d.scenarios || []).length + ' scenarios from a working day, each with three meters (quality, tokens, safety) and a debrief with what to type; ' +
          'a self-assessment of ' + (d.assessment || []).length + ' habits on a radar chart; and your progress by track.'),
        section('#/cheatsheet', 'Cheat sheet', (d.cheats || []).length + ' commands, keys, flags, files and settings, each with when to use it and its source in the official docs. Filter by "Top 20".'),
        section('#/prompts', 'Prompts', (d.prompts || []).length + ' prompts that work, each next to the one people usually type and why the difference matters. Copy, fill in, star.'),
        section('#/playbooks', 'Playbooks', (d.playbooks || []).length + ' step-by-step workflows: answering your manager, the phase loop, a feature across unfamiliar repos, ' +
          'a PRD to an approved plan, a contract change across repos, linked PRs, a hotfix in a worktree, Claude in GitHub.'),
        section('#/tools', 'Tools', (d.tools || []).length + ' working tools: the crisp checker and reply builder, the phase and multi-repo planners, the CLAUDE.md, permissions, ' +
          'skill, subagent, hook and MCP builders, and the headless and GitHub Action builder.'),
        section('#/kit', 'Kit', (d.kit || []).length + ' ready-made files: skills such as /crisp, /phase-next and /contract-change, subagents, hooks, CLAUDE.md templates, ' +
          'settings starters, a GitHub workflow and PowerShell scripts, with where each goes.')));

      root.appendChild(h('h2', null, 'Check yourself, and keep it current'));
      root.appendChild(h('div', { class: 'cards' },
        section('#/assess', 'Self-assessment', 'Rate 32 everyday habits in five minutes. The radar shows your strongest and weakest tracks, ' +
          'beside the choices you make in the scenarios, and what to practise first.'),
        section('#/progress', 'Your progress', 'Scenarios played, strong moves, lessons, quiz answers and questions due, by track, with what to do next.'),
        section('#/current', 'Keep it current', 'Claude Code changes every week or two. What the facts were checked against, and how to find what changed since: ' +
          (d.sources || []).length + ' cited docs pages, a script that compares them, and a re-check prompt for each.')));

      root.appendChild(h('h2', { id: 'your-data' }, 'Your data'));
      root.appendChild(dataCard());
      root.appendChild(h('p', { class: 'faint about' }, 'Everything stays in this browser: no account, no server, works offline. ' +
        'Search everything with Ctrl K. The sun and moon button switches light and dark. Facts checked against Claude Code 2.1.309 (23 and 24 Oct 2026) and 2.1.310 (25 Oct 2026): ',
        h('a', { href: '#/current' }, 'keep them current'), '.'));
    }
  };

  function stat(key, n, label) {
    return h('div', { class: 'stat', 'data-stat': key }, h('b', null, String(n)), h('span', null, label));
  }
  function section(href, title, text) {
    return h('a', { class: 'card', href: href }, h('h3', null, title), h('p', { class: 'muted' }, text));
  }

  /** "Back up to a file" and "Restore from a file", with a confirmation before anything is replaced. */
  function dataCard() {
    var msg = h('p', { class: 'backup-msg', 'aria-live': 'polite' });
    var confirmRow = h('div', { class: 'row', hidden: true });
    var fileInput = h('input', { type: 'file', id: 'bk-file', accept: '.json,application/json', hidden: true, 'aria-label': 'Restore from a backup file' });

    function say(text, bad) { msg.textContent = text; msg.classList.toggle('bad', !!bad); }
    function backUp() {
      var name = 'claude-learning-backup-' + U.localDate(new Date()) + '.json';
      U.download(name, JSON.stringify(U.backup.collect(), null, 2), 'application/json');
      say('Downloaded ' + name + '. Keep it somewhere safe, such as OneDrive.');
    }
    function ask(obj, info) {
      var when = new Date(info.savedAt);
      say('This backup is from ' + (isNaN(when) ? 'an unknown date' : when.toLocaleString()) + ' and holds ' +
        U.plural(info.starred, 'starred prompt') + ', ' + U.plural(info.drafts, 'tool draft') + ', ' + U.plural(info.lessons, 'finished lesson') + ', ' +
        U.plural(info.scenarios, 'scenario') + ' played and ' + U.plural(info.assessments, 'self-assessment') +
        '. Restoring replaces everything this browser holds for the tool now.');
      confirmRow.innerHTML = '';
      confirmRow.appendChild(h('button', { class: 'btn btn-primary', id: 'bk-confirm', type: 'button', onclick: function () {
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
      h('p', { style: { marginTop: 0 } }, 'Your starred prompts, the drafts in each tool, your lesson progress, scenario results and self-assessments live only in this browser. ' +
        'Clearing the browser\'s data deletes them. A backup file keeps them safe and moves them to another browser or PC.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', id: 'bk-backup', type: 'button', onclick: backUp }, 'Back up to a file'),
        h('button', { class: 'btn', id: 'bk-restore', type: 'button', onclick: function () { fileInput.click(); } }, 'Restore from a file…'),
        fileInput),
      msg, confirmRow);
  }
  U.route('home', U.views.home);
})(window.CLT);
