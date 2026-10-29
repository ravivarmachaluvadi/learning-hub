/*
 * views/home.js - the home page (#/): what the tool is for, the situations new leads struggle with
 * most (data/problems.js), your progress, and backing up your data.
 */
(function (U) {
  'use strict';
  var h = U.h;

  U.views.home = {
    render: function (root) {
      var d = U.data;
      var done = U.store.get('scenarios.done', {});
      var played = (d.scenarios || []).filter(function (s) { return done[s.id]; });
      var strong = played.reduce(function (n, s) { return n + done[s.id].best; }, 0);
      var decisions = played.reduce(function (n, s) { return n + done[s.id].total; }, 0);
      var scores = U.quiz.scores();
      var lessonsDone = (d.lessons || []).filter(function (l) { return scores[l.id]; }).length;
      var assessed = U.store.get('assess', { history: [] }).history.length;

      root.appendChild(h('section', { class: 'hero' },
        h('div', null,
          h('div', { class: 'card-kicker' }, 'Lead Engineer Learning Tool'),
          h('h1', null, 'Practise the part of the job that code does not cover'),
          h('p', null, 'As a lead you are judged on what you say when a manager wants it in a week, how you estimate vague work, ' +
            'how you report status, run a stand-up, ask about a requirement, and get help from teams that do not report to you. ' +
            'These are habits, and habits come from practice. Play the situations, use the tools on real work, and keep the words that work.'),
          h('div', { class: 'row' },
            h('a', { class: 'btn btn-primary', href: assessed ? '#/week' : '#/start' }, assessed ? 'Play a week as a lead →' : 'Start with the self-assessment →'),
            h('a', { class: 'btn', href: '#/scenarios/one-week-ask' }, 'Try "The one-week ask"'),
            h('a', { class: 'btn', href: '#/tools/plan90' }, 'Plan your first 90 days'))),
        h('div', { class: 'stat-row' },
          stat('scenarios', (d.scenarios || []).length, 'scenarios'),
          stat('lessons', (d.lessons || []).length, 'lessons'),
          stat('tools', (d.tools || []).length, (d.tools || []).length === 1 ? 'tool' : 'tools'),
          stat('phrases', (d.phrases || []).length, 'phrases'))));

      var review = U.quiz.reviewCard();
      if (review) root.appendChild(review);

      if (played.length || lessonsDone || assessed) {
        root.appendChild(h('div', { class: 'card progress-card' },
          h('div', { class: 'card-kicker' }, 'Your progress'),
          h('div', { class: 'row' },
            h('span', null, h('b', null, played.length + ' of ' + (d.scenarios || []).length), ' scenarios played' +
              (decisions ? ', the strong move ' + strong + ' of ' + decisions + ' times' : '')),
            h('span', { class: 'faint' }, '·'),
            h('span', null, h('b', null, lessonsDone + ' of ' + (d.lessons || []).length), ' lessons done'),
            h('span', { class: 'faint' }, '·'),
            assessed ? h('a', { href: '#/start' }, 'Your self-assessment (' + assessed + ')') : h('a', { href: '#/start' }, 'Take the self-assessment'),
            h('span', { class: 'spacer' }),
            h('a', { class: 'btn btn-small', href: '#/progress' }, 'See all your progress →'))));
      }

      root.appendChild(h('h2', null, 'The situations new leads struggle with most'));
      root.appendChild(h('p', { class: 'muted' }, 'Each row names the habit to replace and where to practise the new one.'));
      root.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table problems-table' },
        h('thead', null, h('tr', null, h('th', null, 'The situation'), h('th', null, 'The habit to build'), h('th', null, 'Practise it'))),
        h('tbody', null, (d.problems || []).map(function (p) {
          return h('tr', { 'data-id': p.id },
            h('td', null, p.problem),
            h('td', { html: U.mdInline(p.habit) }),
            h('td', null, h('ul', { class: 'plain-list' }, p.links.map(function (r) {
              var m = /^(\w+):(.+)$/.exec(r);
              return h('li', null, h('span', { class: 'badge' }, U.kindLabel(m[1])), ' ', h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) }));
            }))));
        })))));

      root.appendChild(h('h2', null, 'What is inside'));
      root.appendChild(h('div', { class: 'cards' },
        section('#/start', 'Start here', 'Rate 30 everyday behaviours of a lead and see your profile on a radar chart, with where to start.'),
        section('#/scenarios', 'Scenarios', (d.scenarios || []).length + ' situations: choose what you would say, see what happens, and compare with a model script.'),
        section('#/week', 'A week as a lead', 'Twelve mixed scenarios over Monday to Friday, scored area by area and drawn on your radar next to how you rated yourself.'),
        section('#/lessons', 'Lessons', (d.lessons || []).length + ' short lessons with an engineer\'s analogy, common mistakes, what to say and a quiz; plus ' +
          (d.explainers || []).length + ' explainers with a picture you can change.'),
        section('#/tools', 'Tools', (d.tools || []).length + ' working tools for real work: status updates, estimates with P50 and P85 dates, deadline replies, priorities, dependencies, risks, sprint capacity, PRD questions, stand-ups, message templates, 1:1s, feedback, delegation, design docs, decision records, postmortems, the tech-debt case, a reflection journal and a 30-60-90 day plan.'),
        section('#/playbooks', 'Playbooks', (d.playbooks || []).length + ' playbooks: Sprint Planning, refinement, the Sprint Review and the Retrospective, each with an agenda timed for your Sprint; onboarding and offboarding, each step dated from the day someone joins or leaves; and running an incident, by the clock from the minute something breaks.'),
        section('#/phrases', 'Phrasebook', (d.phrases || []).length + ' "instead of… say…" pairs for asking, pushing back, status, deadlines and more.'),
        section('#/glossary', 'Glossary', (d.glossary || []).length + ' terms a lead hears every week, in plain language.'),
        section('#/reading', 'Reading list', (d.reading || []).length + ' books, articles and guides behind the lessons, five of them marked "start here".'),
        section('#/progress', 'Your progress', 'Everything you have done here, area by area, with your radar chart and what to do next.')));

      root.appendChild(h('h2', null, 'How to use it'));
      root.appendChild(h('div', { class: 'card', html: U.md([
        '1. **Take the self-assessment** once, honestly. It points you at your two weakest areas.',
        '2. **New in the role? Plan your first 90 days** with the 30-60-90 plan builder, and agree it with your manager.',
        '3. **Play one scenario a day.** Before you look at the options, decide what you would say. Then compare.',
        '4. **Say it in your own words** at the end of each scenario. Reading a good answer is not the same as being able to say it under pressure.',
        '5. **Use the tools on real work.** Run your next status update through the builder before you send it, your next estimate through the workbench, the next PRD through the question generator, the next hard feedback through the composer, and the next design through the design doc builder.',
        '6. **Open a playbook ten minutes before a meeting** you run: the agenda with times, what to say, what to send afterwards.',
        '7. **Star the phrases** you need, and read them before a hard conversation.',
        '8. **Write a reflection every Friday** in the journal: ten minutes, four questions.',
        '9. **Once a month, play a week as a lead and retake the self-assessment**, and compare the shapes on your progress page.'
      ].join('\n')) }));

      root.appendChild(h('h2', { id: 'your-data' }, 'Your data'));
      root.appendChild(dataCard(played.length, lessonsDone));
      root.appendChild(h('p', { class: 'faint about' }, 'Everything stays in this browser: no account, no server, works offline. ' +
        'Search everything with Ctrl K. The sun and moon button switches light and dark.'));
    }
  };

  function stat(key, n, label) {
    return h('div', { class: 'stat', 'data-stat': key }, h('b', null, String(n)), h('span', null, label));
  }
  function section(href, title, text) {
    return h('a', { class: 'card', href: href }, h('h3', null, title), h('p', { class: 'muted' }, text));
  }

  /** "Back up to a file" and "Restore from a file", with a confirmation before anything is replaced. */
  function dataCard(played, lessonsDone) {
    var msg = h('p', { class: 'backup-msg', 'aria-live': 'polite' });
    var confirmRow = h('div', { class: 'row', hidden: true });
    var fileInput = h('input', { type: 'file', id: 'bk-file', accept: '.json,application/json', hidden: true, 'aria-label': 'Restore from a backup file' });

    function say(text, bad) { msg.textContent = text; msg.classList.toggle('bad', !!bad); }
    function backUp() {
      var name = 'lead-engineer-backup-' + U.localDate(new Date()) + '.json';
      U.download(name, JSON.stringify(U.backup.collect(), null, 2), 'application/json');
      say('Downloaded ' + name + '. Keep it somewhere safe, such as OneDrive.');
    }
    function ask(obj, info) {
      var when = new Date(info.savedAt);
      say('This backup is from ' + (isNaN(when) ? 'an unknown date' : when.toLocaleString()) + ' and holds ' +
        U.plural(info.scenarios, 'scenario result') + ' and ' + U.plural(info.lessons, 'finished lesson') +
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
      h('p', { style: { marginTop: 0 } }, 'Your scenario results (' + played + ' played), lesson progress (' + lessonsDone + ' done), self-assessments, ' +
        'starred phrases and drafts live only in this browser. Clearing the browser\'s data deletes them. A backup file keeps them safe and moves them to another browser or PC.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', id: 'bk-backup', type: 'button', onclick: backUp }, 'Back up to a file'),
        h('button', { class: 'btn', id: 'bk-restore', type: 'button', onclick: function () { fileInput.click(); } }, 'Restore from a file…'),
        fileInput),
      msg, confirmRow);
  }
  U.route('home', U.views.home);
})(window.LELT);
