/*
 * views/tools/oneonone.js - the 1:1 planner (#/tools/oneonone).
 *
 * The team: each person with a role, a rhythm (weekly, fortnightly, monthly) and a growth goal. A
 * table shows for everyone when the last 1:1 was, when the next is due and how many actions are
 * open: "due" once the rhythm has passed, "overdue" past one and a half times the rhythm.
 *
 * For the chosen person: the next 1:1's agenda (their topics first in the message), questions from
 * the bank (data/oneonone.js; "Suggest" picks three groups in rotation, skipping what was asked in
 * the last four 1:1s, with a growth question when the last three had none), actions that carry over
 * until they are done, and private notes. "Save this 1:1" moves the agenda and notes into the
 * history and drops the actions marked done. Two texts: the message before the 1:1 and the summary
 * after it. Neither ever includes the private notes.
 *
 * Checks (data/tool-checks.js): no people, a 1:1 overdue, a status topic (the "oneone" wording rules
 * in data/lint-rules.js), an action with no date, an overdue action, no growth topic in the last four.
 *
 * Kept in "lelt.tool.oneonone": {current, held, people: [{name, role, rhythm, goal, next,
 * agenda: [{text, from: 'them'|'me', cat}], notes, actions: [{what, who: 'them'|'me', by, done}],
 * log: [{date, topics: [{text, from, cat}], notes, closed: [what]}]}]}. These are notes about real
 * people: they stay in this browser and the backup file.
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { current: 0, held: '', people: [] };
  var RULES = ['oo-no-people', 'oo-overdue', 'oo-status-topic', 'oo-action-no-date', 'oo-action-overdue', 'oo-no-growth'];
  var RHYTHMS = [['7', 'Weekly'], ['14', 'Fortnightly'], ['30', 'Monthly']];
  var ROTATION = ['open', 'workload', 'blockers', 'growth', 'feedback-you', 'team'];
  var KEEP = 100;   // 1:1s kept per person
  var STATUS = { ok: ['On time', 'badge-ok'], due: ['Due', 'badge-warn'], overdue: ['Overdue', 'badge-err'], never: ['No 1:1 yet', 'badge-warn'] };

  function blankPerson() { return { name: '', role: '', rhythm: '7', goal: '', next: '', agenda: [], notes: '', actions: [], log: [] }; }
  /** A saved person with every list in place (the row editors are bound to these objects). */
  function fix(p) {
    var b = blankPerson();
    Object.keys(b).forEach(function (k) { if (p[k] === undefined || p[k] === null || (Array.isArray(b[k]) && !Array.isArray(p[k]))) p[k] = b[k]; });
    return p;
  }
  function str(v) { return String(v === undefined || v === null ? '' : v).trim(); }
  function first(name) { return str(name).split(/[\s(]/)[0]; }
  function norm(t) { return str(t).toLowerCase().replace(/\s+/g, ' '); }
  function plusDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
  /** A day `n` calendar days on, moved to the Monday if it lands on a weekend. */
  function nextWorkday(d, n) { return P.addWorkdays(plusDays(d, n), 1); }
  function rhythmOf(p) { return P.num(p.rhythm) > 0 ? P.num(p.rhythm) : 7; }
  function rhythmWord(p) { var r = RHYTHMS.filter(function (x) { return +x[0] === rhythmOf(p); })[0]; return r ? r[1].toLowerCase() : 'every ' + rhythmOf(p) + ' days'; }
  /** The 1:1s held, newest first. */
  function logOf(p) {
    return (p.log || []).filter(function (l) { return l && P.parseDay(l.date); }).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
  }
  function hadGrowth(entries) { return entries.some(function (l) { return (l.topics || []).some(function (t) { return t.cat === 'growth'; }); }); }

  function compute(s) {
    var today = P.today(s);
    return {
      today: U.localDate(today),
      people: (s.people || []).map(function (p, i) {
        var rhythm = rhythmOf(p), last = (logOf(p)[0] || {}).date || null;
        var days = last ? daysBetween(P.parseDay(last), today) : null;
        return {
          i: i, name: str(p.name) || 'Person ' + (i + 1), rhythm: rhythm, last: last, days: days,
          due: last ? U.localDate(nextWorkday(P.parseDay(last), rhythm)) : U.localDate(today),
          status: days === null ? 'never' : days > rhythm * 1.5 ? 'overdue' : days >= rhythm ? 'due' : 'ok',
          open: (p.actions || []).filter(function (a) { return !a.done && str(a.what); }).length
        };
      })
    };
  }

  function check(s) {
    var out = [], r = compute(s), today = P.today(s), rules = (U.data.lintRules || {}).oneone || [];
    if (!(s.people || []).length) out.push({ rule: 'oo-no-people', where: 'Your team' });
    (s.people || []).forEach(function (p, i) {
      var c = r.people[i];
      if (c.status === 'overdue' || c.status === 'never') out.push({ rule: 'oo-overdue', where: c.name, i: i, detail: c.days === null ? 'no 1:1 yet' : U.plural(c.days, 'day') });
      (p.agenda || []).forEach(function (t, k) {
        var hit = U.lint.find(t.text, rules)[0];
        if (hit) out.push({ rule: 'oo-status-topic', where: c.name, i: i, list: 'oo-agenda', row: k, key: 'text', detail: hit.text, msg: hit.rule.msg, fix: hit.rule.fix });
      });
      (p.actions || []).forEach(function (a, k) {
        if (a.done || !str(a.what)) return;
        var by = P.parseDay(a.by);
        if (!by) out.push({ rule: 'oo-action-no-date', where: c.name, i: i, list: 'oo-actions', row: k, key: 'by', detail: str(a.what) });
        else if (by < today) out.push({ rule: 'oo-action-overdue', where: c.name, i: i, list: 'oo-actions', row: k, key: 'by', detail: str(a.what) });
      });
      var log = logOf(p);
      if (log.length >= 4 && !hadGrowth(log.slice(0, 4))) out.push({ rule: 'oo-no-growth', where: c.name, i: i });
    });
    return out;
  }

  /** Three questions for the next 1:1: three groups in rotation, a growth question if the last three 1:1s had none. */
  function suggest(p) {
    var log = logOf(p), asked = {}, there = {};
    log.slice(0, 4).forEach(function (l) { (l.topics || []).forEach(function (t) { asked[norm(t.text)] = true; }); });
    (p.agenda || []).forEach(function (t) { there[norm(t.text)] = true; });
    var at = log.length % ROTATION.length;
    var groups = ROTATION.slice(at).concat(ROTATION.slice(0, at)).slice(0, 3);
    if (!hadGrowth(log.slice(0, 3)) && groups.indexOf('growth') < 0) groups[2] = 'growth';
    var out = [];
    groups.forEach(function (g) {
      var q = (U.data.oneOnOneQuestions || []).filter(function (x) { return x.group === g && !asked[norm(x.q)] && !there[norm(x.q)]; })[0];
      if (q) out.push({ text: q.q, from: 'me', cat: g });
    });
    return out;
  }

  function nextDate(s, p, c) {
    var today = P.today(s), next = P.parseDay(p.next), due = P.parseDay(c.due);
    return next || (due && due > today ? due : today);
  }
  function who(p, a) { return a.who === 'me' ? 'Me' : first(p.name) || 'You'; }
  function actionLine(p, a) { var by = P.parseDay(a.by); return '- ' + who(p, a) + ': ' + str(a.what) + (by ? ', by ' + P.day(by) : ''); }

  /** The message before the 1:1: their topics first, then yours, then the actions to check. */
  function before(s, i) {
    var p = (s.people || [])[i];
    if (!p) return 'Add a person to see the message.';
    var c = compute(s).people[i], name = first(p.name);
    var theirs = (p.agenda || []).filter(function (t) { return str(t.text) && t.from === 'them'; });
    var mine = (p.agenda || []).filter(function (t) { return str(t.text) && t.from !== 'them'; });
    var open = (p.actions || []).filter(function (a) { return !a.done && str(a.what); });
    var out = ['Hi' + (name ? ' ' + name : '') + ',', '', 'For our 1:1 on ' + P.day(nextDate(s, p, c)) + ':'];
    if (theirs.length) {
      out.push('', 'Your topics first:');
      theirs.forEach(function (t) { out.push('- ' + str(t.text)); });
    } else out.push('', 'It is your meeting, so your topics come first. What would you like to talk about?');
    if (mine.length) {
      out.push('', theirs.length ? 'Then, if we have time:' : 'I would also like to ask you:');
      mine.forEach(function (t) { out.push('- ' + str(t.text)); });
    }
    if (open.length) {
      out.push('', 'Actions to look at from last time:');
      open.forEach(function (a) { out.push(actionLine(p, a)); });
    }
    out.push('', theirs.length ? 'Anything else you would like to add?' : 'Add anything you like, and we will start with yours.');
    return out.join('\n');
  }

  /** The summary after the 1:1: what you talked about and the actions. Never the private notes. */
  function after(s, i) {
    var p = (s.people || [])[i];
    if (!p) return 'Add a person to see the summary.';
    var held = P.parseDay(s.held) || P.today(s), name = first(p.name) || 'them';
    var topics = (p.agenda || []).filter(function (t) { return str(t.text); });
    var open = (p.actions || []).filter(function (a) { return !a.done && str(a.what); });
    var done = (p.actions || []).filter(function (a) { return a.done && str(a.what); });
    var out = ['1:1 with ' + name + ', ' + P.day(held)];
    if (topics.length) {
      out.push('', 'We talked about:');
      topics.forEach(function (t) { out.push('- ' + str(t.text)); });
    }
    if (done.length) {
      out.push('', 'Done since last time:');
      done.forEach(function (a) { out.push('- ' + who(p, a) + ': ' + str(a.what)); });
    }
    out.push('', 'Actions:');
    if (open.length) open.forEach(function (a) { out.push(actionLine(p, a)); });
    else out.push('- None this time.');
    out.push('', 'Next 1:1: ' + P.day(nextWorkday(held, rhythmOf(p))) + '.');
    return out.join('\n');
  }

  /** The example: three people with a history, dated from today. */
  function sample() {
    var today = P.today();
    function ago(n) { return U.localDate(P.addWorkdays(today, -n)); }   // n working days back
    function wd(n) { return U.localDate(P.addWorkdays(today, n)); }
    function held(n, cats) {
      var bank = U.data.oneOnOneQuestions || [];
      return { date: ago(n), notes: '', closed: [], topics: cats.map(function (c) {
        var q = bank.filter(function (x) { return x.group === c; })[n % 3] || bank[0];
        return { text: q.q, from: 'me', cat: c };
      }) };
    }
    return { current: 0, held: '', people: [
      { name: 'Asha', role: 'Developer, 3 years', rhythm: '7', goal: 'Lead a feature end to end by March', next: '',
        agenda: [{ text: 'Joining the architecture review', from: 'them', cat: 'growth' },
          { text: 'What slowed you down this week that you did not mention in stand-up?', from: 'me', cat: 'blockers' }],
        notes: '', actions: [{ what: 'Share the system design course link', who: 'me', by: wd(2), done: false }],
        log: [held(4, ['open', 'workload']), held(9, ['growth']), held(14, ['blockers']), held(19, ['team'])] },
      { name: 'Rahul', role: 'Senior developer', rhythm: '14', goal: 'Become the payments domain expert', next: '',
        agenda: [], notes: '', actions: [{ what: 'Write up the retry design for the team', who: 'them', by: ago(3), done: false }],
        log: [held(18, ['growth', 'blockers']), held(28, ['workload'])] },
      { name: 'Divya', role: 'Developer, 1 year', rhythm: '7', goal: '', next: '',
        agenda: [], notes: '', actions: [],
        log: [held(2, ['open']), held(7, ['workload']), held(12, ['blockers']), held(17, ['team'])] }
    ] };
  }

  U.tools.oneonone = {
    EMPTY: EMPTY, rules: RULES, check: check, compute: compute, suggest: suggest, before: before, after: after, sample: sample,
    render: function (root) {
      var s = K.load('oneonone', EMPTY);
      if (!Array.isArray(s.people)) s.people = [];
      s.people.forEach(fix);
      var groupName = {}, bankGroup = 'open';
      (U.data.oneOnOneGroups || []).forEach(function (g) { groupName[g.id] = g.title; });
      function cur() { return s.people[s.current] || null; }
      function clamp() { s.current = Math.max(0, Math.min(+s.current || 0, s.people.length - 1)); }
      clamp();

      var people = K.rows({
        id: 'oo-people', noun: 'person', list: function () { return s.people; }, blank: blankPerson,
        changed: function () { clamp(); drawPerson(); refresh(); },
        cols: [
          { key: 'name', label: 'Name', ph: 'Asha', size: '1.1fr' },
          { key: 'role', label: 'Role', ph: 'Developer, 3 years', size: '1.3fr' },
          { key: 'rhythm', label: 'Rhythm', type: 'select', options: RHYTHMS, size: '1fr' },
          { key: 'goal', label: 'Their growth goal', ph: 'Ask them; write it in their words', size: '2fr' }
        ]
      });
      var team = h('tbody');
      var chips = h('div', { class: 'chips oo-people', role: 'group', 'aria-label': 'Whose 1:1' });
      var since = h('p', { class: 'oo-since', id: 'oo-since' });
      var goal = h('p', { class: 'faint oo-goal' });
      var nextIn = h('input', { class: 'input', type: 'date', id: 'oo-next' });
      var heldIn = h('input', { class: 'input', type: 'date', id: 'oo-held' });
      var agenda = K.rows({
        id: 'oo-agenda', noun: 'topic', list: function () { return cur() ? cur().agenda : []; },
        blank: function () { return { text: '', from: 'me', cat: '' }; }, changed: function () { refresh(); },
        cols: [
          { key: 'text', label: 'Topic or question', type: 'textarea', ph: 'What would make this week easier?', size: '3fr' },
          { key: 'from', label: 'Whose', type: 'select', options: [['me', 'Mine'], ['them', 'Theirs']], size: '0.9fr' },
          { key: 'cat', label: 'Group', type: 'select', options: [['', 'Other']].concat((U.data.oneOnOneGroups || []).map(function (g) { return [g.id, g.title]; })), size: '1.4fr' }
        ],
        extra: h('button', { class: 'btn btn-small', id: 'oo-suggest', type: 'button', onclick: function () {
          var p = cur();
          if (!p) return;
          var add = suggest(p);
          if (!add.length) { U.toast('Every question in these groups was asked lately: pick one from the bank'); return; }
          add.forEach(function (q) { p.agenda.push(q); });
          agenda.draw();
          refresh();
        } }, 'Suggest three questions')
      });
      var bankChips = h('div', { class: 'chips oo-bank-groups', role: 'group', 'aria-label': 'Question group' });
      var bankWhy = h('p', { class: 'faint oo-bank-why' });
      var bank = h('ul', { class: 'oo-bank', id: 'oo-bank' });
      var actions = K.rows({
        id: 'oo-actions', noun: 'action', list: function () { return cur() ? cur().actions : []; },
        blank: function () { return { what: '', who: 'them', by: '', done: false }; }, changed: function () { refresh(); },
        cols: [
          { key: 'what', label: 'Action', ph: 'Share the system design course link', size: '3fr' },
          { key: 'who', label: 'Who', type: 'select', options: [['them', 'Them'], ['me', 'Me']], size: '0.8fr' },
          { key: 'by', label: 'By', type: 'date', size: '1.3fr' },
          { key: 'done', label: 'Done', type: 'check', size: '0.5fr' }
        ]
      });
      var notes = h('textarea', { class: 'input', id: 'oo-notes', rows: 4, placeholder: 'What you noticed, what they said, what to remember next time' });
      var history = h('ul', { class: 'oo-history', id: 'oo-history' });
      var historyFold = U.section('History', history, false);
      var checks = K.checksCard('oneonone', 'Every 1:1 is on time, the agendas are about the people, and every action has a date.', function (x) {
        if (x.i !== undefined && x.i !== s.current) { s.current = x.i; drawPerson(); refresh(); }
        if (x.list) K.focus(K.cell(x.list, x.row, x.key));
        else if (x.rule === 'oo-no-people') K.focus(U.$('#oo-people-add'));
        else if (x.rule === 'oo-no-growth') K.focus(U.$('.oo-bank-group[data-group="growth"]'));
        else K.focus(U.$('#oo-panel'));
      });
      var beforeOut = K.outputCard({ id: 'oo-before-output', title: 'Before: the message', note: 'Send it a day ahead, so they can add their topics.',
        prompt: function (text) {
          return 'I am a lead engineer preparing a 1:1 with someone on my team. Here is the agenda I plan to send them. ' +
            'Check that it is about them and not a status meeting, suggest one or two better questions, and make the message warmer and shorter.\n\n' + text;
        } });
      var afterOut = K.outputCard({ id: 'oo-after-output', title: 'After: the summary', note: 'What you agreed, for both of you. Your private notes are never included.' });

      root.appendChild(h('div', { class: 'tool-stack' },
        h('div', { class: 'card st-form' },
          K.samples([['oo-sample', 'Load the example', function () { K.replace(s, sample()); s.people.forEach(fix); people.draw(); drawPerson(); refresh(); }]],
            'oo-clear', function () { K.replace(s, EMPTY); people.draw(); drawPerson(); refresh(); }),
          h('h2', null, 'Your team'),
          h('p', { class: 'muted' }, 'Everyone who reports to you. Weekly 1:1s of 30 minutes are the usual rhythm; fortnightly is the least that keeps them useful.'),
          people.el),
        h('div', { class: 'card' }, h('h2', null, 'At a glance'),
          h('div', { class: 'table-wrap' }, h('table', { class: 'table oo-team', id: 'oo-team' },
            h('thead', null, h('tr', null, ['Person', 'Rhythm', 'Last 1:1', 'Next due', 'Open actions'].map(function (x, i) { return h('th', { class: i === 1 ? 'oo-rhythm' : null }, x); }))), team))),
        h('div', { class: 'card oo-panel', id: 'oo-panel', tabindex: '-1' },
          h('h2', null, 'The next 1:1'), chips, since, goal,
          h('div', { class: 'field-row' },
            K.field('oo-next', 'Next 1:1 on', 'Optional: the due date is used otherwise', nextIn),
            K.field('oo-held', 'Held on', 'For the summary and the history; today if empty', heldIn)),
          h('h3', null, 'Agenda'),
          h('p', { class: 'faint' }, 'Their topics go first in the message, whatever the order here. Ask them a day ahead what they want to talk about.'),
          agenda.el,
          h('details', { class: 'fold oo-bank-fold' }, h('summary', null, 'The question bank'), bankChips, bankWhy, bank),
          h('h3', null, 'Actions'),
          h('p', { class: 'faint' }, 'They carry over to the next 1:1 until you tick them done. Yours count most.'),
          actions.el,
          K.field('oo-notes', 'Private notes', 'Never included in the messages. Kept only in this browser and your backup file.', notes),
          h('div', { class: 'row' }, h('button', { class: 'btn btn-primary', id: 'oo-save', type: 'button', onclick: save }, 'Save this 1:1')),
          historyFold),
        h('div', { class: 'tool-pair' }, checks.el, h('div', { class: 'oo-outputs' }, beforeOut.el, afterOut.el))));
      root.appendChild(guide());

      function save() {
        var p = cur();
        if (!p) return;
        var date = P.parseDay(s.held) ? s.held : U.localDate(P.today());
        p.log.unshift({
          date: date, notes: p.notes,
          topics: p.agenda.filter(function (t) { return str(t.text); }).map(function (t) { return { text: str(t.text), from: t.from, cat: t.cat || '' }; }),
          closed: p.actions.filter(function (a) { return a.done && str(a.what); }).map(function (a) { return str(a.what); })
        });
        p.log = logOf(p).slice(0, KEEP);
        p.agenda = [];
        p.notes = '';
        p.next = '';
        p.actions = p.actions.filter(function (a) { return !a.done; });
        s.held = '';
        drawPerson();
        refresh();
        U.toast('Saved your 1:1 with ' + (first(p.name) || 'them'));
      }

      nextIn.addEventListener('input', function () { if (cur()) { cur().next = nextIn.value; refresh(); } });
      heldIn.addEventListener('input', function () { s.held = heldIn.value; refresh(); });
      notes.addEventListener('input', function () { if (cur()) { cur().notes = notes.value; U.store.set('tool.oneonone', s); } });

      function drawBank() {
        bankChips.innerHTML = '';
        (U.data.oneOnOneGroups || []).forEach(function (g) {
          bankChips.appendChild(h('button', { class: 'chip oo-bank-group' + (g.id === bankGroup ? ' selected' : ''), type: 'button', 'data-group': g.id,
            'aria-pressed': g.id === bankGroup ? 'true' : 'false', onclick: function () { bankGroup = g.id; drawBank(); } }, g.title));
        });
        bankWhy.textContent = (U.data.oneOnOneGroups || []).filter(function (g) { return g.id === bankGroup; }).map(function (g) { return g.why; })[0] || '';
        bank.innerHTML = '';
        var p = cur(), recent = {};
        if (p) logOf(p).slice(0, 4).forEach(function (l) { (l.topics || []).forEach(function (t) { recent[norm(t.text)] = true; }); });
        (U.data.oneOnOneQuestions || []).filter(function (q) { return q.group === bankGroup; }).forEach(function (q) {
          bank.appendChild(h('li', { 'data-q': q.id },
            h('span', null, q.q, recent[norm(q.q)] ? h('span', { class: 'badge oo-asked' }, 'asked lately') : null),
            h('button', { class: 'btn btn-small oo-add', type: 'button', disabled: !p, onclick: function () {
              if (!cur()) return;
              cur().agenda.push({ text: q.q, from: 'me', cat: q.group });
              agenda.draw();
              refresh();
            } }, '+ Add')));
        });
      }

      /** Everything that belongs to the chosen person: chips, dates, agenda, actions, notes, history. */
      function drawPerson() {
        clamp();
        var p = cur();
        U.$('#oo-panel').hidden = !p;
        chips.innerHTML = '';
        s.people.forEach(function (x, i) {
          chips.appendChild(h('button', { class: 'chip oo-person' + (i === s.current ? ' selected' : ''), type: 'button', 'data-i': String(i),
            'aria-pressed': i === s.current ? 'true' : 'false', onclick: function () { s.current = i; drawPerson(); refresh(); } }, str(x.name) || 'Person ' + (i + 1)));
        });
        nextIn.value = p ? p.next || '' : '';
        heldIn.value = s.held || '';
        notes.value = p ? p.notes || '' : '';
        agenda.draw();
        actions.draw();
        drawBank();
        history.innerHTML = '';
        var log = p ? logOf(p) : [];
        historyFold.querySelector('summary').textContent = 'History' + (p ? ' with ' + (first(p.name) || 'them') + ' (' + log.length + ')' : '');
        if (!log.length) history.appendChild(h('li', { class: 'faint' }, 'No 1:1 saved yet.'));
        log.forEach(function (l) {
          history.appendChild(h('li', null, h('b', null, P.day(P.parseDay(l.date)) + ' ' + l.date.slice(0, 4)),
            (l.topics || []).length ? h('ul', null, l.topics.map(function (t) { return h('li', null, t.text, t.cat && groupName[t.cat] ? h('span', { class: 'faint' }, ' · ' + groupName[t.cat]) : null); })) : null,
            (l.closed || []).length ? h('p', { class: 'faint' }, 'Done: ' + l.closed.join('; ')) : null,
            str(l.notes) ? h('p', { class: 'oo-note' }, h('span', { class: 'ph-label' }, 'Private notes'), ' ', l.notes) : null));
        });
      }

      function drawTeam(r) {
        team.innerHTML = '';
        if (!r.people.length) {
          team.appendChild(h('tr', null, h('td', { colspan: 5, class: 'faint' }, 'Add the people on your team above.')));
          return;
        }
        r.people.forEach(function (c) {
          var p = s.people[c.i], st = STATUS[c.status];
          team.appendChild(h('tr', { 'data-name': c.name, 'data-status': c.status, 'data-i': String(c.i), class: c.i === s.current ? 'is-now' : null,
            onclick: function () { s.current = c.i; drawPerson(); refresh(); } },
            h('td', null, h('b', null, c.name), str(p.role) ? h('small', { class: 'faint oo-role' }, str(p.role)) : null),
            h('td', { class: 'oo-rhythm' }, RHYTHMS.filter(function (x) { return +x[0] === c.rhythm; }).map(function (x) { return x[1]; })[0] || c.rhythm + ' days'),
            h('td', { class: 'oo-last' }, c.last ? [h('span', null, P.day(P.parseDay(c.last))), h('small', { class: 'faint' }, c.days === 0 ? 'today' : U.plural(c.days, 'day') + ' ago')] : '-'),
            h('td', { class: 'oo-due' }, h('span', { class: 'badge ' + st[1] }, st[0]), ' ', c.status === 'never' ? 'this week' : P.day(P.parseDay(c.due))),
            h('td', { class: 'oo-open' }, String(c.open))));
        });
      }

      function refresh() {
        U.store.set('tool.oneonone', s);
        var r = compute(s), p = cur(), c = p ? r.people[s.current] : null;
        drawTeam(r);
        U.$$('.oo-person', chips).forEach(function (b, i) { b.textContent = str((s.people[i] || {}).name) || 'Person ' + (i + 1); });
        since.textContent = !c ? '' : c.last
          ? 'Last 1:1: ' + (c.days === 0 ? 'today' : U.plural(c.days, 'day') + ' ago') + ' (' + P.day(P.parseDay(c.last)) + '). You meet ' + rhythmWord(p) + '; the next is due ' + P.day(P.parseDay(c.due)) + '.'
          : 'No 1:1 yet. You meet ' + rhythmWord(p) + ': book the first one this week.';
        goal.textContent = p && str(p.goal) ? 'Their goal: ' + str(p.goal) : p ? 'No growth goal written down yet: ask about one in this 1:1.' : '';
        checks.show(check(s));
        beforeOut.set(before(s, s.current));
        afterOut.set(after(s, s.current));
      }

      drawPerson();
      refresh();
    }
  };

  function guide() {
    return U.section('How to run a 1:1 that helps', h('div', { html: U.md([
      '1. **It is their meeting.** Ask a day ahead what they want to talk about, and start with it. Grove\'s rule in *High Output Management*: the agenda is theirs.',
      '2. **Not a status meeting.** Status lives on the board and in the stand-up. Use the 1:1 for what neither of those can reach: how they are, what is in the way, where they want to go.',
      '3. **Protect the rhythm.** Move a 1:1 if you must; do not cancel it. Cancelled 1:1s tell people where they rank.',
      '4. **Write down actions, with dates, and do yours first.** Open the next 1:1 with them.',
      '5. **Ask about growth at least once a month.** People rarely bring up their career themselves.',
      '',
      'More in [[lesson:one-on-ones]]; practise it in [[scenario:first-one-on-ones]] and [[scenario:cancelled-one-on-ones]].'
    ].join('\n')) }), false);
  }
})(window.LELT);
