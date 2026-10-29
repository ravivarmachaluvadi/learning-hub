/*
 * views/tools/journal.js - the reflection journal (#/tools/journal).
 *
 * Each entry follows the US Army's After Action Review: what I expected to happen, what happened,
 * why it was different, and what I will do next time. It has a kind (a win or a lesson), an
 * optional behaviour from the self-assessment, and an optional prompt from data/journal.js.
 * "Suggest a prompt" goes round the prompt groups in turn and skips the prompts used in the last ten
 * entries.
 *
 * The "reflect" wording rules (data/lint-rules.js) read "next time" for wishes ("try harder", "be
 * more careful", "communicate better") and other people's to-dos ("the PM should"). Other checks
 * (data/tool-checks.js): nothing under "what happened", nothing for next time, no "why" when you wrote
 * what you expected, no entry for more than 14 days, and five lessons in a row with no win.
 *
 * Kept in "lelt.tool.journal": the draft (date, kind, promptId, expected, happened, why, next, habit)
 * and entries: [{id, date, kind, promptId, prompt, expected, happened, why, next, habit, at}], newest
 * first, at most 500. It stays in this browser and the backup file.
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { date: '', kind: 'lesson', promptId: '', expected: '', happened: '', why: '', next: '', habit: '', entries: [] };
  var RULES = ['jr-missing', 'jr-no-next', 'jr-no-why', 'jr-vague', 'jr-gap', 'jr-no-wins'];
  var DRAFT = ['expected', 'happened', 'why', 'next'];
  var LABEL = { expected: 'What I expected', happened: 'What happened', why: 'Why it was different', next: 'Next time' };
  var KINDS = [['lesson', 'A lesson: it did not go as I wanted'], ['win', 'A win: it went well, and I want to repeat it']];
  var KEEP = 500, GAP = 14, RECENT = 10, WEEK = 7;
  var DAY = 86400000;

  function str(v) { return String(v === undefined || v === null ? '' : v).trim(); }
  function daysBetween(a, b) { return Math.round((b - a) / DAY); }

  /** Saved entries, newest first. */
  function sorted(entries) {
    return (Array.isArray(entries) ? entries : []).slice().sort(function (a, b) {
      return str(b.date) < str(a.date) ? -1 : str(b.date) > str(a.date) ? 1 : str(b.at) < str(a.at) ? -1 : str(b.at) > str(a.at) ? 1 : 0;
    });
  }

  function check(s) {
    var out = [], today = P.today(s), rules = (U.data.lintRules || {}).reflect || [];
    if (DRAFT.some(function (k) { return str(s[k]); })) {
      if (!str(s.happened)) out.push({ rule: 'jr-missing', where: LABEL.happened, key: 'happened' });
      if (str(s.happened) && !str(s.next)) out.push({ rule: 'jr-no-next', where: LABEL.next, key: 'next' });
      if (str(s.expected) && str(s.happened) && !str(s.why)) out.push({ rule: 'jr-no-why', where: LABEL.why, key: 'why' });
      U.lint.find(s.next, rules).forEach(function (x) {
        out.push({ rule: 'jr-vague', where: LABEL.next, key: 'next', detail: x.text, msg: x.rule.msg, fix: x.rule.fix });
      });
    }
    var list = sorted(s.entries), last = list.length ? P.parseDay(list[0].date) : null;
    if (last && daysBetween(last, today) > GAP) out.push({ rule: 'jr-gap', where: U.plural(daysBetween(last, today), 'day') + ' since the last entry', key: 'save' });
    if (list.length >= 5 && list.slice(0, 5).every(function (e) { return e.kind !== 'win'; })) out.push({ rule: 'jr-no-wins', where: 'Your last 5 entries', key: 'kind' });
    return out;
  }

  function prompt(id) { return (U.data.journalPrompts || []).filter(function (p) { return p.id === id; })[0] || null; }
  function behaviour(id) { return (U.data.assessment || []).filter(function (a) { return a.id === id; })[0] || null; }

  /** The next prompt: from the group after the current (or the last used) one, not used recently. */
  function suggest(s) {
    var prompts = U.data.journalPrompts || [], groups = (U.data.journalGroups || []).map(function (g) { return g.id; });
    var list = sorted(s.entries);
    var recent = list.slice(0, RECENT).map(function (e) { return e.promptId; }).filter(Boolean);
    var lastP = prompt(s.promptId) || prompt((list.filter(function (e) { return e.promptId; })[0] || {}).promptId);
    var from = lastP ? (groups.indexOf(lastP.group) + 1) % groups.length : 0;
    for (var k = 0; k < groups.length; k++) {
      var g = groups[(from + k) % groups.length];
      var c = prompts.filter(function (p) { return p.group === g && p.id !== s.promptId && recent.indexOf(p.id) < 0; });
      if (c.length) return c[0];
    }
    return prompts.filter(function (p) { return p.id !== s.promptId; })[0] || null;
  }

  /** One answer as printed after its label: "Next time I will..." under "Next time" loses its first two words. */
  function answer(e, k) {
    var t = str(e[k]);
    if (k !== 'next') return t;
    var rest = t.replace(/^next time\b[\s,:;.-]*/i, '');
    return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : t;
  }

  function kindLabel(k) { return k === 'win' ? 'A win' : 'A lesson'; }
  function dayText(iso) { var d = P.parseDay(iso); return d ? P.day(d) + ' ' + d.getFullYear() : iso; }

  /** One entry (or the draft) as text to copy. */
  function entryText(e, today) {
    var p = prompt(e.promptId), b = behaviour(e.habit);
    var lines = ['Reflection, ' + dayText(str(e.date) || U.localDate(today)) + ' · ' + kindLabel(e.kind)];
    if (p || str(e.prompt)) lines.push('Prompt: ' + (p ? p.q : str(e.prompt)));
    if (b) lines.push('Habit: ' + b.text);
    lines.push('');
    DRAFT.forEach(function (k) { if (str(e[k])) lines.push(LABEL[k] + ': ' + answer(e, k)); });
    if (!str(e.happened)) lines.push(LABEL.happened + ': [One moment from your week, as a camera would have seen it]');
    if (!str(e.next)) lines.push(LABEL.next + ': [One thing you will do, and when]');
    return lines.join('\n');
  }

  /** The last 7 days, for the 1:1 with your manager. */
  function weekText(s) {
    var today = P.today(s);
    var mine = sorted(s.entries).filter(function (e) { var d = P.parseDay(e.date); return d && daysBetween(d, today) >= 0 && daysBetween(d, today) < WEEK; });
    var from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (WEEK - 1));
    var head = 'My reflections from the last 7 days (' + P.day(from) + ' to ' + P.day(today) + '), for our next 1:1:';
    if (!mine.length) return head + '\n\nNo entries in the last 7 days yet. Save one above and it appears here.';
    return [head, ''].concat(mine.map(function (e) {
      return '- ' + (e.kind === 'win' ? 'Win' : 'Lesson') + ' (' + P.day(P.parseDay(e.date)) + '): ' + str(e.happened) + (str(e.next) ? ' Next time: ' + answer(e, 'next') : '');
    }), ['', 'What I would like your view on: [one question for your manager]']).join('\n');
  }

  /** Every entry as a Markdown document. */
  function markdown(s) {
    var list = sorted(s.entries);
    return ['# Reflection journal', '', U.plural(list.length, 'entry', 'entries') + ', newest first. Exported ' + dayText(U.localDate(P.today(s))) + '.', '']
      .concat(list.map(function (e) {
        var p = prompt(e.promptId), b = behaviour(e.habit);
        return ['## ' + dayText(e.date) + ' · ' + kindLabel(e.kind)].concat(
          p || str(e.prompt) ? ['*' + (p ? p.q : str(e.prompt)) + '*'] : [],
          b ? ['Habit: ' + b.text] : [],
          DRAFT.filter(function (k) { return str(e[k]); }).map(function (k) { return '- **' + LABEL[k] + ':** ' + answer(e, k); }), ['']).join('\n');
      })).join('\n');
  }

  function sample() {
    return { date: U.localDate(P.today()), kind: 'lesson', promptId: 'd-on-the-spot',
      expected: 'I expected the refund API to take a week, as I told Priya on Monday.',
      happened: 'It took two and a half weeks. Reviews and testing took longer than the code, and the payments team needed four days to answer one question.',
      why: 'I gave the estimate on the spot in the meeting, and counted only the coding: no reviews, no testing, no waiting for another team.',
      next: 'Next time I will say "let me break it down and come back by 4 pm", and use the estimation workbench, with the work people forget.',
      habit: 'pm-no-on-the-spot', entries: [] };
  }

  U.tools.journal = {
    EMPTY: EMPTY, rules: RULES, check: check, suggest: suggest, sample: sample, weekText: weekText, markdown: markdown,
    compute: function (s) { return { entries: sorted(s.entries).length, week: weekText(s) }; },
    render: function (root) {
      var s = K.load('journal', EMPTY);
      if (!Array.isArray(s.entries)) s.entries = [];
      var f = K.form(s, function () { refresh(); });
      var habits = [['', 'None']].concat((U.data.assessment || []).map(function (a) {
        var t = U.track(a.track);
        return [a.id, (t ? t.short + ': ' : '') + a.text];
      }));
      var promptText = h('p', { class: 'jr-prompt-text', id: 'jr-prompt-text' });
      // the list cuts a long behaviour short, so the whole of the chosen one is shown under it
      var habitText = h('p', { class: 'jr-habit-text', id: 'jr-habit-text', hidden: true });
      var checks = K.checksCard('journal', 'An honest entry with something specific to do next time.', function (x) {
        K.focus(x.key === 'save' ? U.$('#jr-happened') : U.$('#jr-' + x.key));
      });
      var out = K.outputCard({ id: 'jr-output', title: 'This entry', note: 'Copy it into your own notes, or keep it here: saved entries stay in this browser.',
        prompt: function (text) {
          return 'I am a lead engineer (recently promoted from senior engineer) keeping a weekly reflection journal. Here is one entry. ' +
            'Please coach me: is my "why" the real cause or a symptom? Is "next time" a specific action I control and could check? ' +
            'Suggest a sharper version of "next time", and one question I should ask myself or my team.\n\n' + text;
        } });
      var week = K.outputCard({ id: 'jr-week-output', title: 'The last 7 days, for your manager', note: 'A short list to bring to your next 1:1 with your manager: what went well, and what you are changing.' });
      var filter = h('input', { class: 'input', id: 'jr-filter', type: 'search', placeholder: 'Filter your entries', 'aria-label': 'Filter your entries', oninput: function () { drawEntries(); } });
      var list = h('ul', { class: 'jr-entries', id: 'jr-entries' });
      var countEl = h('span', { class: 'faint' });

      root.appendChild(h('div', { class: 'tool-layout' },
        h('div', { class: 'card st-form' },
          K.samples([['jr-sample', 'Load the example', function () { load(sample()); }]], 'jr-clear', function () { load(K.clone(EMPTY)); }),
          h('div', { class: 'field jr-prompt' }, h('span', { class: 'field-label' }, 'Something to write about (optional)'), promptText,
            h('div', { class: 'row' },
              h('button', { class: 'btn btn-small', id: 'jr-suggest', type: 'button', onclick: function () { var p = suggest(s); s.promptId = p ? p.id : ''; refresh(); } }, 'Suggest a prompt'),
              h('button', { class: 'btn btn-small btn-ghost', id: 'jr-prompt-clear', type: 'button', onclick: function () { s.promptId = ''; refresh(); } }, 'No prompt'))),
          h('div', { class: 'field-row' },
            K.field('jr-date', 'The day', 'Empty means today', f.input('date', { id: 'jr-date', type: 'date' })),
            K.field('jr-kind', 'What kind', null, f.select('kind', KINDS, { id: 'jr-kind' }))),
          K.field('jr-expected', '1. ' + LABEL.expected, 'Before it happened, what did you think would happen?', f.textarea('expected', { id: 'jr-expected', rows: 2, grow: true, placeholder: 'I expected the refund API to take a week.' })),
          K.field('jr-happened', '2. ' + LABEL.happened, 'The facts, as a camera would have seen them', f.textarea('happened', { id: 'jr-happened', rows: 3, grow: true, placeholder: 'It took two and a half weeks.' })),
          K.field('jr-why', '3. ' + LABEL.why, 'The cause, in the system and in what you did; not who to blame', f.textarea('why', { id: 'jr-why', rows: 2, grow: true, placeholder: 'I counted only the coding, not the reviews and testing.' })),
          K.field('jr-next', '4. ' + LABEL.next, 'One thing you will do, and when, that you could check', f.textarea('next', { id: 'jr-next', rows: 2, grow: true, placeholder: 'Before I give a date, I will break the work into tasks.' })),
          K.field('jr-habit', 'The habit it is about (optional)', 'A behaviour from the self-assessment', f.select('habit', habits, { id: 'jr-habit' })),
          habitText,
          h('div', { class: 'row' }, h('button', { class: 'btn btn-primary', id: 'jr-save', type: 'button', onclick: save }, 'Save this entry'))),
        h('div', { class: 'st-side' }, checks.el, out.el, week.el)));

      root.appendChild(h('div', { class: 'card jr-history' },
        h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'Your entries'), countEl, h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small', id: 'jr-download', type: 'button', onclick: function () {
            U.download('reflection-journal-' + U.localDate(new Date()) + '.md', markdown(s), 'text/markdown');
          } }, 'Download as Markdown')),
        h('p', { class: 'muted' }, 'Newest first. They stay in this browser and in the backup file from the home page.'),
        filter, list));
      root.appendChild(guide());

      function load(next) { var keep = s.entries; K.replace(s, next); s.entries = keep; f.fill(); refresh(); }

      function save() {
        if (!str(s.happened)) { U.toast('Write what happened first'); K.focus(U.$('#jr-happened')); return; }
        var p = prompt(s.promptId);
        s.entries.unshift({ id: 'e' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36), date: P.parseDay(s.date) ? s.date : U.localDate(P.today()),
          kind: s.kind === 'win' ? 'win' : 'lesson', promptId: p ? p.id : '', prompt: p ? p.q : '', expected: str(s.expected), happened: str(s.happened),
          why: str(s.why), next: str(s.next), habit: str(s.habit), at: new Date().toISOString() });
        s.entries = sorted(s.entries).slice(0, KEEP);
        ['date', 'promptId', 'expected', 'happened', 'why', 'next', 'habit'].forEach(function (k) { s[k] = ''; });
        s.kind = 'lesson';
        f.fill();
        refresh();
        U.toast('Saved to your journal');
      }

      function drawEntries() {
        var q = str(filter.value).toLowerCase(), all = sorted(s.entries);
        countEl.textContent = U.plural(all.length, 'entry', 'entries');
        list.innerHTML = '';
        if (!all.length) list.appendChild(h('li', { class: 'faint jr-none' }, 'No entries yet. Your first one takes ten minutes.'));
        all.forEach(function (e) {
          var p = prompt(e.promptId);
          var text = [e.date, e.prompt, p ? p.q : '', e.expected, e.happened, e.why, e.next].join(' ').toLowerCase();
          var li = h('li', { 'data-id': e.id, hidden: !!q && text.indexOf(q) < 0 },
            h('div', { class: 'row' },
              h('span', { class: 'badge ' + (e.kind === 'win' ? 'badge-ok' : 'badge-warn') }, e.kind === 'win' ? 'Win' : 'Lesson'),
              h('b', null, P.day(P.parseDay(e.date)) || e.date),
              p || e.prompt ? h('span', { class: 'faint' }, p ? p.q : e.prompt) : null,
              h('span', { class: 'spacer' }),
              h('button', { class: 'btn btn-small btn-ghost jr-del', type: 'button', 'aria-label': 'Delete this entry', onclick: function () {
                s.entries = s.entries.filter(function (x) { return x.id !== e.id; });
                refresh();
              } }, '✕')),
            h('p', { class: 'jr-happened' }, str(e.happened)),
            str(e.next) ? h('p', { class: 'jr-next' }, h('b', null, 'Next time: '), answer(e, 'next')) : null);
          list.appendChild(li);
        });
      }

      function refresh() {
        U.store.set('tool.journal', s);
        var p = prompt(s.promptId);
        promptText.textContent = p ? p.q : 'None. Write about anything from your week, or ask for a prompt.';
        promptText.classList.toggle('faint', !p);
        var b = behaviour(s.habit);
        habitText.textContent = b ? b.text : '';
        habitText.hidden = !b;
        checks.show(check(s));
        out.set(entryText(s, P.today()));
        week.set(weekText(s));
        drawEntries();
      }
      f.fill();
      refresh();
    }
  };

  function guide() {
    return U.section('How to keep a reflection habit', h('div', { html: U.md([
      '1. **Ten minutes, once a week.** Friday afternoon works for most leads: the week is fresh and the next one has not started.',
      '2. **One moment, not the whole week.** A meeting, a decision, a conversation. The four questions work best on something specific.',
      '3. **Write the wins too.** What went well, and why, is what you want to repeat on purpose.',
      '4. **"Next time" is an action you could check:** what, when, with whom. "Communicate better" is a wish; "a two-line update to the PM every Friday" is a plan.',
      '5. **Read back once a month.** The same lesson three times is the habit to work on next; the self-assessment and [[lesson:reflection-and-growth]] help.',
      '',
      'The four questions are the US Army\'s After Action Review. Bring "The last 7 days" to your 1:1 with your manager: it makes the conversation about what you are learning.'
    ].join('\n')) }), false);
  }
})(window.LELT);
