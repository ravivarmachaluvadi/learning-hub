/*
 * views/tools/standup.js - the stand-up facilitator (#/tools/standup).
 *
 * Before: the team (one name per line), the timebox (15 minutes), and the order: random (Shuffle
 * deals a new one) or as listed. During: a clock for the whole stand-up and one for the person
 * speaking, against their share of the timebox; what they promised last time next to what they say
 * today, with "did it happen?"; prompts with the follow-up question to ask when the words repeat,
 * are vague (the status rules in data/lint-rules.js), a blocker names nobody, a promise did not
 * happen, or time runs over; a parking lot with the people for each topic. After: the notes, to
 * copy into the team channel or download as Markdown, and a history, so the next stand-up shows
 * today's promises as "last time".
 *
 * Checks (data/tool-checks.js): no team, a name twice, a timebox over 15 minutes, more than 10
 * people, someone with the same promise three stand-ups running, a parked topic with nobody named.
 *
 * Kept in "lelt.tool.standup": {team, minutes, order, plan: [names], live: null | {date, startedAt,
 * turnAt, at, order, entries: {name: {today, blocked, who, kept, absent, secs, done}}, parked},
 * history: [{date, seconds, entries: [{name, today, blocked, who, kept, absent, secs}], parked}]}.
 * The clocks run from timestamps, so a reload in the middle carries on.
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { team: '', minutes: '15', order: 'random', plan: [], live: null, history: [] };
  var RULES = ['su-no-team', 'su-duplicate', 'su-timebox', 'su-big-team', 'su-stuck', 'su-park-no-who'];
  var KEEP = 60;   // stand-ups kept in the history

  function names(s) { return String(s.team || '').split('\n').map(function (n) { return n.trim(); }).filter(Boolean); }
  function samePeople(a, b) { return (a || []).slice().sort().join('\n') === (b || []).slice().sort().join('\n'); }

  /** True when two updates say the same thing: equal once punctuation is gone, or 70% of their words shared. */
  function norm(t) { return String(t || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function same(a, b) {
    a = norm(a); b = norm(b);
    if (!a || !b) return false;
    if (a === b) return true;
    var A = {}, B = {}, inter = 0, union = 0;
    a.split(' ').forEach(function (w) { A[w] = true; });
    b.split(' ').forEach(function (w) { B[w] = true; });
    if (Object.keys(A).length < 3 || Object.keys(B).length < 3) return false;
    Object.keys(A).forEach(function (w) { if (B[w]) inter++; });
    union = Object.keys(A).length + Object.keys(B).length - inter;
    return inter / union >= 0.7;
  }

  /** The latest stand-up before `date` ("YYYY-MM-DD"): on Monday, that is Friday's. */
  function yesterdayOf(history, date) {
    return (history || []).filter(function (m) { return m.date < date; })
      .sort(function (a, b) { return b.date.localeCompare(a.date); })[0] || null;
  }

  /** Names whose last three updates said the same thing. */
  function stuck(history) {
    var by = {}, out = [];
    (history || []).slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).forEach(function (m) {
      (m.entries || []).forEach(function (e) {
        if (e.absent || !String(e.today || '').trim()) return;
        (by[e.name] = by[e.name] || []).push(e.today);
      });
    });
    Object.keys(by).forEach(function (n) { var t = by[n]; if (t.length >= 3 && same(t[0], t[1]) && same(t[1], t[2])) out.push(n); });
    return out;
  }

  function check(s) {
    var out = [], list = names(s), seen = {};
    if (!list.length) out.push({ rule: 'su-no-team', where: 'Team', key: 'team' });
    list.forEach(function (n) {
      var k = n.toLowerCase();
      if (seen[k]) out.push({ rule: 'su-duplicate', where: 'Team', key: 'team', detail: n });
      seen[k] = true;
    });
    if (P.num(s.minutes) > 15) out.push({ rule: 'su-timebox', where: 'Timebox', key: 'minutes' });
    if (list.length > 10) out.push({ rule: 'su-big-team', where: 'Team', key: 'team' });
    stuck(s.history).forEach(function (n) { out.push({ rule: 'su-stuck', where: n }); });
    var last = (s.history || [])[0];
    if (last) (last.parked || []).forEach(function (p) { if (!String(p.who || '').trim()) out.push({ rule: 'su-park-no-who', where: 'Parking lot', detail: p.topic }); });
    return out;
  }

  /** Each person's share of the timebox, in seconds (at least 30, in steps of 5). */
  function target(s, live) {
    var n = (live ? live.order.length : names(s).length) || 1, mins = P.num(s.minutes) > 0 ? P.num(s.minutes) : 15;
    return Math.max(30, Math.round(mins * 60 / n / 5) * 5);
  }
  function mmss(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), r = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  /** What to ask, for the person speaking: [{id, text}]. */
  function signals(entry, last, overTime) {
    var out = [], hit;
    if (!entry || entry.absent) return out;
    if (last && last.today && same(entry.today, last.today)) {
      out.push({ id: 'same', text: 'Same words as last time. Ask: "What\'s left on it, and what would help it move?"' });
    }
    if ((hit = U.lint.find(entry.today, (U.data.lintRules || {}).status || [])[0])) {
      out.push({ id: 'vague', text: '"' + hit.text + '" doesn\'t say what is left or when. Ask: "What\'s left, and when will it be done?"' });
    }
    if (entry.kept === 'no') out.push({ id: 'missed', text: 'Last time\'s promise didn\'t happen. Ask what got in the way: curiously, not as blame.' });
    if (entry.blocked && !String(entry.who || '').trim()) {
      out.push({ id: 'blocked-no-who', text: 'Blocked, but on whom? Ask: "Who do you need, and by when?" Then park it with that person.' });
    }
    if (overTime) out.push({ id: 'over-time', text: 'Over their share of the time. Park it: "Let\'s take that right after stand-up, with the people who need to be there."' });
    return out;
  }

  /** The notes for one stand-up from the history: 'chat' for Slack or Teams, 'md' for the Markdown file. */
  function notes(m, format) {
    if (!m) return 'No stand-ups yet. Start one above; its notes appear here when it ends.';
    var d = P.parseDay(m.date), title = 'Stand-up, ' + (d ? P.day(d) : m.date);
    var here = m.entries.filter(function (e) { return !e.absent; });
    var mins = Math.max(1, Math.round((m.seconds || 0) / 60));
    var summary = mins + ' min · ' + here.length + ' of ' + m.entries.length + ' here';
    var md = format === 'md', bullet = md ? '- ' : '• ';
    var out = md ? ['# ' + title, '', summary, '', '## Updates'] : ['*' + title + '* · ' + summary, ''];
    m.entries.forEach(function (e) {
      var name = md ? '**' + e.name + '**' : e.name, text;
      if (e.absent) text = 'not here';
      else {
        text = String(e.today || '').trim() || 'no update';
        if (e.blocked) text += ' · BLOCKED: needs ' + (String(e.who || '').trim() || 'someone (not named)');
      }
      out.push(bullet + name + ': ' + text);
    });
    if ((m.parked || []).length) {
      out.push('', md ? '## Parking lot' : '*Parking lot*');
      m.parked.forEach(function (p) { out.push(bullet + p.topic + (String(p.who || '').trim() ? ': ' + p.who.trim() : ': (nobody named)')); });
    }
    var kept = { yes: 0, partly: 0, no: 0 };
    m.entries.forEach(function (e) { if (kept[e.kept] !== undefined) kept[e.kept]++; });
    if (kept.yes + kept.partly + kept.no) {
      out.push('', 'Promises from last time: ' + kept.yes + ' kept, ' + kept.partly + ' partly, ' + kept.no + ' not.');
    }
    return out.join('\n');
  }

  function sample() {
    var today = P.today();
    function back(n) { return U.localDate(P.addWorkdays(today, -n)); }
    function meeting(date, todays, parked) {
      return { date: date, seconds: 780, parked: parked || [],
        entries: Object.keys(todays).map(function (n) { return { name: n, today: todays[n], blocked: false, who: '', kept: '', absent: false, secs: 150 }; }) };
    }
    return {
      team: 'Asha\nRahul\nDivya\nSameer\nArjun', minutes: '15', order: 'random', plan: [], live: null,
      history: [
        meeting(back(1), { Asha: 'Refund API: the retry logic, ready for review by 3 pm', Rahul: 'Fix the timeout in the payment client',
          Divya: 'Stub the bank API so testing can start', Sameer: 'Settlement report', Arjun: 'Partial refunds screen: the form and its validation' },
          [{ topic: 'Retry limits for refunds', who: 'Asha, Divya and the lead' }]),
        meeting(back(2), { Asha: 'Refund API: the request model and the controller', Rahul: 'Payment client: reproduce the timeout',
          Divya: 'Bank sandbox access: chase Kiran', Sameer: 'Settlement report', Arjun: 'Partial refunds screen: the layout' }),
        meeting(back(3), { Asha: 'Refund rules: walk through them with Finance', Rahul: 'Review Asha\'s pull request for the refund model',
          Divya: 'Test plan for refunds, with Arjun', Sameer: 'Settlement report', Arjun: 'Partial refunds: designs with Neha' })
      ]
    };
  }

  var timer = null;

  U.tools.standup = {
    EMPTY: EMPTY, rules: RULES, check: check, same: same, yesterdayOf: yesterdayOf, signals: signals, notes: notes,
    compute: function (s) { return { team: names(s), target: target(s, s.live), stuck: stuck(s.history) }; },
    destroy: function () { if (timer) { clearInterval(timer); timer = null; } },
    render: function (root) {
      var s = K.load('standup', EMPTY);
      if (!Array.isArray(s.history)) s.history = [];
      if (!Array.isArray(s.plan)) s.plan = [];
      var f = K.form(s, function () { changed(); });
      var lastOrder = s.order, showDate = null;

      /* ---------- before ---------- */
      var planList = h('ol', { class: 'su-plan', id: 'su-plan' });
      var setup = h('div', { class: 'card st-form su-setup' },
        K.samples([['su-sample', 'Load an example team', function () { load(sample()); }]], 'su-clear', function () { load(K.clone(EMPTY)); }),
        h('div', { class: 'field-row' },
          K.field('su-team', 'The team', 'One name per line', f.textarea('team', { id: 'su-team', rows: 6, placeholder: 'Asha\nRahul\nDivya' })),
          h('div', null,
            K.field('su-minutes', 'Timebox (minutes)', 'The Daily Scrum is 15 minutes', f.input('minutes', { id: 'su-minutes', inputmode: 'numeric' })),
            K.field('su-order', 'Order', null, f.select('order', [['random', 'Random'], ['list', 'As listed']], { id: 'su-order' })))),
        h('div', { class: 'row' }, h('b', null, 'Today\'s order'), h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small', id: 'su-shuffle', type: 'button', onclick: function () {
            s.order = 'random';
            s.plan = U.shuffle(names(s));
            f.fill();
            lastOrder = s.order;
            changed();
          } }, 'Shuffle')),
        planList,
        h('div', { class: 'row' }, h('button', { class: 'btn btn-primary', id: 'su-start', type: 'button', onclick: start }, 'Start the stand-up')));
      var checks = K.checksCard('standup', 'Fifteen minutes, a team of 10 or fewer, and nobody stuck on the same promise.', function (x) {
        if (x.key) K.focus(U.$({ team: '#su-team', minutes: '#su-minutes' }[x.key]));
      });

      /* ---------- during ---------- */
      var clock = h('b', { class: 'su-clock', id: 'su-clock' }, '00:00');
      var left = h('span', { class: 'faint', id: 'su-left' });
      var turnClock = h('b', { class: 'su-turn-clock', id: 'su-turn-clock' }, '00:00');
      var turnTarget = h('span', { class: 'faint', id: 'su-turn-target' });
      var bar = h('span', { class: 'su-bar-fill' });
      var orderList = h('ol', { class: 'su-order', id: 'su-order-list' });
      var current = h('div', { class: 'su-current' });
      var parkTopic = h('input', { class: 'input', id: 'su-park-topic', placeholder: 'The topic', 'aria-label': 'Topic to park' });
      var parkWho = h('input', { class: 'input', id: 'su-park-who', placeholder: 'Who needs to be there', 'aria-label': 'Who needs to be there' });
      var parked = h('ul', { class: 'su-parked', id: 'su-parked' });
      var live = h('div', { class: 'card su-live', id: 'su-live', hidden: true },
        h('div', { class: 'row su-live-head' },
          h('div', { class: 'su-clocks' },
            h('div', null, h('small', { class: 'faint' }, 'Stand-up'), h('div', null, clock, ' ', left)),
            h('div', null, h('small', { class: 'faint' }, 'This person'), h('div', null, turnClock, ' ', turnTarget))),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn', id: 'su-end', type: 'button', onclick: end }, 'End the stand-up')),
        h('span', { class: 'su-bar', 'aria-hidden': 'true' }, bar),
        h('div', { class: 'su-live-grid' },
          h('div', null, h('h3', null, 'Order'), orderList),
          current),
        h('h3', null, 'Parking lot'),
        h('p', { class: 'faint', style: { marginTop: 0 } }, 'Anything that needs more than a minute: the topic, and who needs to be there right after stand-up.'),
        h('div', { class: 'su-park-row' }, parkTopic, parkWho,
          h('button', { class: 'btn btn-small', id: 'su-park-add', type: 'button', onclick: function () {
            if (!s.live || !parkTopic.value.trim()) return;
            s.live.parked.push({ topic: parkTopic.value.trim(), who: parkWho.value.trim() });
            parkTopic.value = ''; parkWho.value = '';
            save(); drawParked();
          } }, 'Park it')),
        parked);

      /* ---------- after ---------- */
      var historySel = h('select', { class: 'select', id: 'su-history', 'aria-label': 'Notes from' });
      historySel.addEventListener('change', function () { showDate = historySel.value; drawNotes(); });
      var out = K.outputCard({ id: 'su-output', title: 'The notes',
        note: 'Post them in the team channel. Tomorrow, today\'s promises show as "last time".',
        prompt: function (text) {
          return 'I am a lead engineer. Here are the notes from today\'s stand-up. Point out work that sounds stuck or vague, blockers that need me today, ' +
            'and the one follow-up conversation I should have after the stand-up. Keep it short.\n\n' + text;
        } });
      var notesCard = h('div', { class: 'su-notes' },
        h('div', { class: 'card row su-history-row' }, h('label', { for: 'su-history' }, h('b', null, 'Notes from')), historySel, h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small', id: 'su-download', type: 'button', onclick: function () {
            var m = shown();
            if (!m) return;
            U.download('standup-' + m.date + '.md', notes(m, 'md') + '\n', 'text/markdown');
          } }, 'Download as Markdown')),
        out.el);

      root.appendChild(h('div', { class: 'tool-stack' }, h('div', { class: 'tool-pair su-top' }, setup, checks.el), live, notesCard));
      root.appendChild(guide());

      function save() { U.store.set('tool.standup', s); }
      function load(next) { K.replace(s, next); f.fill(); lastOrder = s.order; showDate = null; changed(); }

      function changed() {
        var list = names(s);
        if (s.order !== lastOrder || !samePeople(s.plan, list)) s.plan = s.order === 'random' ? U.shuffle(list.slice()) : list.slice();
        if (s.order === 'list') s.plan = list.slice();
        lastOrder = s.order;
        save();
        checks.show(check(s));
        planList.innerHTML = '';
        s.plan.forEach(function (n) { planList.appendChild(h('li', { 'data-name': n }, n)); });
        drawLive();
        drawNotes();
      }

      function start() {
        var order = s.plan.length ? s.plan.slice() : names(s);
        if (!order.length) { K.focus(U.$('#su-team')); return; }
        var now = Date.now();
        s.live = { date: U.localDate(new Date()), startedAt: now, turnAt: now, at: 0, order: order, entries: {}, parked: [] };
        order.forEach(function (n) { s.live.entries[n] = { today: '', blocked: false, who: '', kept: '', absent: false, secs: 0, done: false }; });
        save();
        drawLive();
        var first = U.$('#su-today');
        if (first) first.focus();
      }

      /** Close the current person's turn: their time, and done or absent. */
      function closeTurn(absent) {
        var L = s.live, name = L.order[L.at], now = Date.now();
        if (!name) return;
        var e = L.entries[name];
        e.secs += Math.max(0, (now - L.turnAt) / 1000);
        if (absent) e.absent = true; else e.done = true;
        L.at++;
        L.turnAt = now;
        save();
        drawLive();
        var t = U.$('#su-today');
        if (t) t.focus();
      }

      function end() {
        var L = s.live;
        if (!L) return;
        if (L.order[L.at]) L.entries[L.order[L.at]].secs += Math.max(0, (Date.now() - L.turnAt) / 1000);
        var m = { date: L.date, seconds: Math.max(0, (Date.now() - L.startedAt) / 1000), parked: L.parked.slice(),
          entries: L.order.map(function (n) {
            var e = L.entries[n];
            return { name: n, today: String(e.today || '').trim(), blocked: !!e.blocked, who: String(e.who || '').trim(), kept: e.kept || '', absent: !!e.absent, secs: Math.round(e.secs) };
          }) };
        s.history = [m].concat(s.history.filter(function (x) { return x.date !== m.date; })).slice(0, KEEP);
        s.live = null;
        showDate = m.date;
        changed();
      }

      function drawLive() {
        var L = s.live;
        live.hidden = !L;
        setup.hidden = !!L;
        setup.parentNode.classList.toggle('su-running', !!L);   // the checks take the whole row while the setup is hidden
        if (!L) { if (timer) { clearInterval(timer); timer = null; } return; }
        var last = yesterdayOf(s.history, L.date);
        orderList.innerHTML = '';
        L.order.forEach(function (n, i) {
          var e = L.entries[n];
          orderList.appendChild(h('li', { 'data-name': n, class: [e.done ? 'done' : '', e.absent ? 'absent' : '', i === L.at ? 'current' : ''].join(' ').trim() || null },
            h('span', null, n), e.done ? h('span', { class: 'faint' }, ' ' + mmss(e.secs)) : e.absent ? h('span', { class: 'faint' }, ' not here') : null));
        });
        current.innerHTML = '';
        var name = L.order[L.at];
        if (!name) {
          current.appendChild(h('div', { class: 'su-wrap' },
            h('h3', null, 'Everyone has spoken'),
            h('p', null, 'Ask the team: "Are we still on track for the Sprint Goal? Anything we should change?" Then confirm the parking lot, with names, and end.'),
            h('button', { class: 'btn btn-primary', type: 'button', onclick: end }, 'End the stand-up')));
        } else {
          var e = L.entries[name], prev = last ? (last.entries || []).filter(function (x) { return x.name === name; })[0] : null;
          var today = h('textarea', { class: 'input', id: 'su-today', rows: 2, placeholder: 'What will be finished today, and is anything in the way?' });
          today.value = e.today;
          var kept = h('select', { class: 'select', id: 'su-kept', 'aria-label': 'Did last time\'s promise happen?' },
            [['', 'Did it happen?'], ['yes', 'Yes'], ['partly', 'Partly'], ['no', 'No']].map(function (o) { return h('option', { value: o[0] }, o[1]); }));
          kept.value = e.kept || '';
          var blocked = h('input', { type: 'checkbox', id: 'su-blocked' });
          blocked.checked = !!e.blocked;
          var who = h('input', { class: 'input', id: 'su-who', placeholder: 'Who do they need, by when?', 'aria-label': 'Who they need' });
          who.value = e.who;
          var whoRow = h('div', { class: 'field', hidden: !e.blocked }, who);
          var sig = h('ul', { class: 'su-signals', id: 'su-signals', 'aria-live': 'polite' });
          var said = prev && !prev.absent && prev.today;
          current.appendChild(h('div', { class: 'su-speaker' },
            h('div', { class: 'card-kicker' }, 'Speaking now'),
            h('h3', { id: 'su-current-name' }, name),
            h('div', { class: 'su-pair' },
              h('div', { class: 'su-last' }, h('span', { class: 'ph-label' }, 'Last time' + (last ? ' (' + P.day(P.parseDay(last.date)) + ')' : '')),
                h('p', { id: 'su-yesterday' }, said ? prev.today : prev && prev.absent ? 'Not here last time.' : 'No notes from last time.'),
                said ? kept : null),
              h('div', { class: 'su-now' }, h('label', { class: 'ph-label', for: 'su-today' }, 'Today'), today,
                h('label', { class: 'pb-check su-block' }, blocked, ' Blocked or waiting on someone'), whoRow)),
            sig,
            h('div', { class: 'row' },
              h('button', { class: 'btn btn-primary', id: 'su-next', type: 'button', onclick: function () { closeTurn(false); } },
                L.at === L.order.length - 1 ? 'Done: last person' : 'Next person →'),
              h('button', { class: 'btn', id: 'su-absent', type: 'button', onclick: function () { closeTurn(true); } }, 'Not here today'))));
          today.addEventListener('input', function () { e.today = today.value; save(); drawSignals(); });
          kept.addEventListener('change', function () { e.kept = kept.value; save(); drawSignals(); });
          blocked.addEventListener('change', function () { e.blocked = blocked.checked; whoRow.hidden = !blocked.checked; save(); drawSignals(); });
          who.addEventListener('input', function () { e.who = who.value; save(); drawSignals(); });
        }
        drawParked();
        tick();
        if (!timer) timer = setInterval(tick, 250);
      }

      function drawSignals() {
        var L = s.live, box = U.$('#su-signals');
        if (!L || !box) return;
        var name = L.order[L.at], e = L.entries[name], last = yesterdayOf(s.history, L.date);
        var prev = last ? (last.entries || []).filter(function (x) { return x.name === name; })[0] : null;
        var over = (Date.now() - L.turnAt) / 1000 > target(s, L);
        var list = signals(e, prev && !prev.absent ? prev : null, over);
        var key = list.map(function (x) { return x.id; }).join(',');
        if (box.dataset.key === key) return;   // unchanged: don't redraw on every tick
        box.dataset.key = key;
        box.innerHTML = '';
        list.forEach(function (x) { box.appendChild(h('li', { 'data-signal': x.id }, x.text)); });
      }

      function drawParked() {
        parked.innerHTML = '';
        if (!s.live) return;
        s.live.parked.forEach(function (p, i) {
          parked.appendChild(h('li', null, h('b', null, p.topic), p.who ? h('span', { class: 'muted' }, ' · ' + p.who) : h('span', { class: 'badge badge-warn' }, 'nobody named'),
            h('button', { class: 'btn btn-small btn-ghost', type: 'button', 'aria-label': 'Remove ' + p.topic, onclick: function () {
              s.live.parked.splice(i, 1); save(); drawParked();
            } }, '✕')));
        });
      }

      function tick() {
        var L = s.live;
        if (!L) return;
        var now = Date.now(), total = (P.num(s.minutes) > 0 ? P.num(s.minutes) : 15) * 60, el = Math.max(0, (now - L.startedAt) / 1000);
        clock.textContent = mmss(el);
        left.textContent = el > total ? mmss(el - total) + ' over' : 'of ' + mmss(total);
        left.classList.toggle('su-over', el > total);
        bar.style.width = Math.min(100, el / total * 100) + '%';
        bar.classList.toggle('su-over', el > total);
        var tg = target(s, L), turn = L.order[L.at] ? Math.max(0, (now - L.turnAt) / 1000) : 0;
        turnClock.textContent = mmss(turn);
        turnTarget.dataset.seconds = String(tg);
        turnTarget.textContent = 'of ' + mmss(tg);
        turnClock.classList.toggle('su-over', turn > tg);
        drawSignals();
      }

      function shown() {
        return s.history.filter(function (m) { return m.date === showDate; })[0] || s.history[0] || null;
      }
      function drawNotes() {
        historySel.innerHTML = '';
        s.history.forEach(function (m) { historySel.appendChild(h('option', { value: m.date }, P.day(P.parseDay(m.date)) + ' (' + m.date + ')')); });
        var m = shown();
        if (m) historySel.value = m.date;
        historySel.disabled = !s.history.length;
        out.set(notes(m, 'chat'));
      }

      f.fill();
      changed();
    }
  };

  function guide() {
    return U.section('How to run a stand-up that catches stuck work', h('div', { html: U.md([
      '1. **Start on time**, even if someone is late. Fifteen minutes, whatever the team size.',
      '2. **Listen for the signals:** the same words two days running, "almost done", "no blockers" from someone whose work has not moved.',
      '3. **Ask one curious question**, not an accusation: "What\'s left on it, and what would help it move?"',
      '4. **Park anything longer than a minute**, with the people who need to be there and a time: right after stand-up.',
      '5. **End with the goal:** "Are we still on track for the Sprint Goal?" Then post the notes.',
      '',
      'More in [[lesson:daily-scrum]]; practise it in [[scenario:standup-move-on]] and [[scenario:standup-runs-long]].'
    ].join('\n')) }), false);
  }
})(window.LELT);
