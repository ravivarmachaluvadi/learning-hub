/*
 * views/playbooks.js - the playbooks (#/playbooks, #/playbooks/<id>): step-by-step guides for the
 * meetings a lead runs. The text is in data/playbooks.js. They live under the Tools tab, and the
 * Tools page lists them too (LELT.views.playbooks.cards()).
 *
 * A playbook page shows what the meeting is for and who decides; an agenda timed for your Sprint
 * length and start time, next to the Scrum Guide's limit; what to say at each step; a prep list you
 * can tick; what to send afterwards; mistakes and sources. The retrospective adds five formats, each
 * drawn as its board (#/playbooks/retrospective?format=sailboat opens one).
 *
 * A timeline playbook (kind: 'timeline': onboarding, offboarding) has dates instead of a start time:
 * you enter them (the first day; the day they told you and the last day), and each step falls a
 * number of working days from one of them, in date order, with a tick that is remembered.
 *
 * An incident playbook (kind: 'incident') runs by the clock: the time it started and the severity
 * give each step its time (minutes after the start) and schedule the stakeholder updates at the
 * severity's rhythm, from the step that sends the first one. Steps tick off; "A new incident" clears
 * the ticks and starts the clock now.
 *
 * Choices are kept in "lelt.playbooks": {weeks, format, pages: {id: {start, prep: [indexes],
 * dates: {dateId: 'YYYY-MM-DD'}, done: [step indexes], sev: severity id}}}.
 */
(function (U) {
  'use strict';
  var h = U.h;

  var WEEKS = [['1', 'One week'], ['2', 'Two weeks'], ['3', 'Three weeks'], ['4', 'Four weeks (one month)']];
  var WEEK_WORD = { 1: 'one-week', 2: 'two-week', 3: 'three-week', 4: 'one-month' };

  function saved() {
    var s = U.store.get('playbooks', {});
    if (!s || typeof s !== 'object') s = {};
    s.pages = s.pages && typeof s.pages === 'object' ? s.pages : {};
    return s;
  }

  /** A step's minutes for a Sprint of `weeks` weeks: a scaling agenda is written for two weeks. */
  function minutesOf(p, step, weeks) { return p.scales ? step.minutes * weeks / 2 : step.minutes; }
  /** The Scrum Guide's limit for this Sprint length, in proportion to its one-month limit. */
  function maxOf(p, weeks) { return p.scales ? p.monthMax * weeks / 4 : 0; }

  function toMinutes(hhmm) {
    var m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ''));
    return m ? +m[1] * 60 + +m[2] : 600;
  }
  function clock(mins) {
    mins = ((mins % 1440) + 1440) % 1440;
    var hh = Math.floor(mins / 60), mm = mins % 60;
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }
  /** 120 -> "2 hours", 90 -> "1 hour 30 minutes", 45 -> "45 minutes". */
  function duration(m) {
    var hrs = Math.floor(m / 60), rest = m % 60;
    if (!hrs) return U.plural(rest, 'minute');
    return U.plural(hrs, 'hour') + (rest ? ' ' + U.plural(rest, 'minute') : '');
  }

  /** The cards for every playbook: on the list page and on the Tools page. */
  function cards() {
    return h('div', { class: 'cards' }, (U.data.playbooks || []).map(function (p) {
      return h('a', { class: 'card playbook-card', href: '#/playbooks/' + p.id, 'data-id': p.id },
        h('div', { class: 'row' }, U.trackBadge(p.track), h('span', { class: 'badge badge-accent' }, 'Playbook')),
        h('h3', null, p.title),
        h('p', { class: 'muted' }, p.summary));
    }));
  }

  function listPage(root) {
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/tools' }, 'Tools'), ' › Playbooks'));
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Playbooks'),
      h('p', null, 'Open a meeting playbook ten minutes before the meeting: an agenda timed for your Sprint, what to prepare, what to say at each step, and what to send afterwards. ' +
        'The onboarding and offboarding playbooks are plans over weeks instead, dated from the days you enter; the incident playbook runs by the clock from the minute something breaks. ' +
        'The lessons explain the ideas; the playbooks are how to do it.')));
    root.appendChild(cards());
    root.appendChild(h('p', { class: 'muted later-note', html: U.mdInline('For the Daily Scrum, use the [[tool:standup|stand-up facilitator]]: a timer, the order, a parking lot and the notes.') }));
  }

  /** The top of every playbook page: crumbs, title, what it is for, who is there. */
  function head(root, p) {
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/tools' }, 'Tools'), ' › ', h('a', { href: '#/playbooks' }, 'Playbooks'), ' › ', p.title));
    root.appendChild(h('article', { class: 'lesson-text playbook' },
      h('div', { class: 'row' }, U.trackBadge(p.track), h('span', { class: 'badge badge-accent' }, 'Playbook')),
      h('h1', null, p.title),
      h('p', { class: 'lesson-summary' }, p.summary),
      U.callout('info', 'What it is for', U.md(p.purpose)),
      h('h2', null, p.kind === 'timeline' ? 'Who is involved' : p.kind === 'incident' ? 'The roles' : 'Who is there, and who decides'),
      h('div', { class: 'lesson-body', html: U.md(p.who) })));
  }

  /** The prep list (ticks remembered), what to send, mistakes, links and sources. */
  function tail(root, p, mine, save, prepTitle, afterNote) {
    var ticked = Array.isArray(mine.prep) ? mine.prep : [];
    root.appendChild(h('div', { class: 'card pb-prep-card' },
      h('h2', null, prepTitle),
      h('ul', { class: 'plain-list pb-prep' }, p.prep.map(function (item, i) {
        var box = h('input', { type: 'checkbox', 'aria-label': 'Prepared: ' + U.plain(item) });
        box.checked = ticked.indexOf(i) >= 0;
        box.addEventListener('change', function () {
          mine.prep = U.$$('.pb-prep input', root).map(function (b, k) { return b.checked ? k : -1; }).filter(function (k) { return k >= 0; });
          save();
        });
        return h('li', null, h('label', { class: 'pb-check' }, box, h('span', { html: U.mdInline(item) })));
      }))));

    var after = h('pre', { class: 'st-output', id: 'pb-after' });
    after.textContent = p.after;
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, { timeline: 'The message to the team', incident: 'The all-clear' }[p.kind] || 'After the meeting: what to send'), h('span', { class: 'spacer' }),
        h('button', { class: 'btn btn-small btn-primary', id: 'pb-copy-after', type: 'button', onclick: function () { U.copy(after.textContent); } }, 'Copy')),
      h('p', { class: 'faint', style: { margin: '6px 0 0' } }, afterNote),
      after));

    root.appendChild(h('div', { class: 'lesson-text' },
      h('h2', null, 'Common mistakes'),
      h('ul', { class: 'pb-mistakes' }, p.mistakes.map(function (m) { return h('li', { html: U.mdInline(m) }); })),
      (p.related || []).length ? [h('h2', null, 'Practise it'), h('ul', { class: 'lesson-related' }, p.related.map(function (r) {
        var m = /^(\w+):(.+)$/.exec(r);
        return h('li', null, h('span', { class: 'badge' }, U.kindLabel(m[1])), ' ', h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) }));
      }))] : null,
      h('h2', null, 'Sources'),
      h('ul', { class: 'lesson-sources pb-sources' }, p.sources.map(function (x) { return h('li', { html: U.mdInline(x) }); }))));
  }

  /** A day `at` working days from `base`, which counts as day 0 (a weekend base moves on to Monday). */
  function dayFrom(base, at) { return at >= 0 ? U.plan.addWorkdays(base, at + 1) : U.plan.addWorkdays(base, at); }

  /** A timeline playbook: steps dated in working days from the dates you enter. */
  function timelinePage(root, p) {
    var P = U.plan, s = saved();
    var mine = s.pages[p.id] = s.pages[p.id] || {};
    mine.dates = mine.dates && typeof mine.dates === 'object' ? mine.dates : {};
    if (!Array.isArray(mine.done)) mine.done = [];
    function save() { U.store.set('playbooks', s); }
    head(root, p);

    var inputs = {};
    function dateOf(id) {
      var d = (p.dates || []).filter(function (x) { return x.id === id; })[0];
      if (!d) return P.today();
      var typed = inputs[id] ? P.parseDay(inputs[id].value) : P.parseDay(mine.dates[id]);
      var day = typed || dayFrom(d.from ? dateOf(d.from) : P.today(), d.offset || 0);
      while (!typed && d.monday && day.getDay() !== 1) day = P.addWorkdays(day, 2);   // the next working day, until a Monday
      return day;
    }
    var fields = (p.dates || []).map(function (d) {
      var el = h('input', { class: 'input', type: 'date', id: 'pb-date-' + d.id });
      el.value = U.localDate(dateOf(d.id));
      inputs[d.id] = el;
      el.addEventListener('input', function () { if (P.parseDay(el.value)) { mine.dates[d.id] = el.value; save(); draw(); } });
      return K().field('pb-date-' + d.id, d.label, d.hint || null, el);
    });
    var span = h('p', { class: 'pb-when', id: 'pb-span' });
    root.appendChild(h('div', { class: 'card pb-controls' },
      h('h2', null, 'Your dates'),
      h('div', { class: 'field-row' }, fields),
      span,
      h('p', { class: 'faint' }, 'Dates count Monday to Friday and skip weekends, not public holidays. Tick a step when it is done; the ticks stay in this browser.'),
      h('div', { class: 'row' }, h('button', { class: 'btn btn-small btn-primary', id: 'pb-copy-plan', type: 'button', onclick: function () {
        U.copy(planText(), 'Plan copied - paste it into your notes or calendar');
      } }, 'Copy the plan'))));

    var tbody = h('tbody');
    root.appendChild(h('div', { class: 'table-wrap pb-agenda-wrap' }, h('table', { class: 'table pb-agenda pb-timeline' },
      h('caption', { class: 'visually-hidden' }, 'The plan'),
      h('thead', null, h('tr', null, h('th', null, 'When'), h('th', null, 'Step and what to say'), h('th', null, 'Done'))),
      tbody)));
    tail(root, p, mine, save, p.prepTitle || 'Before it starts', 'Fill in the [brackets] and send it in the team channel.');

    function steps() {
      return p.agenda.map(function (st, i) { return { step: st, i: i, date: dayFrom(dateOf(st.anchor), st.at) }; })
        .sort(function (a, b) { return a.date - b.date || a.i - b.i; });
    }
    function planText() {
      var rows = steps();
      return [p.title + ': ' + P.day(rows[0].date) + ' to ' + P.day(rows[rows.length - 1].date), '']
        .concat(rows.map(function (r) { return (mine.done.indexOf(r.i) >= 0 ? '[x] ' : '[ ] ') + P.day(r.date) + '  ' + r.step.when + ': ' + r.step.title; }))
        .join('\n');
    }
    function draw() {
      var rows = steps();
      span.innerHTML = '';
      span.appendChild(h('b', null, P.day(rows[0].date) + ' to ' + P.day(rows[rows.length - 1].date)));
      span.appendChild(document.createTextNode(', ' + U.plural(P.workdaysBetween(rows[0].date, rows[rows.length - 1].date), 'working day') + ', ' + U.plural(rows.length, 'step') + '.'));
      tbody.innerHTML = '';
      rows.forEach(function (r) {
        var box = h('input', { type: 'checkbox', 'aria-label': 'Done: ' + r.step.title });
        box.checked = mine.done.indexOf(r.i) >= 0;
        box.addEventListener('change', function () {
          mine.done = mine.done.filter(function (k) { return k !== r.i; });
          if (box.checked) mine.done.push(r.i);
          tr.classList.toggle('is-done', box.checked);
          save();
        });
        var tr = h('tr', { 'data-step': r.i, class: box.checked ? 'is-done' : null },
          h('td', { class: 'pb-when-cell' }, h('span', { class: 'pb-date' }, P.day(r.date)), h('small', { class: 'pb-when-label' }, r.step.when)),
          h('td', null, h('b', null, r.step.title),
            h('div', { class: 'pb-do', html: U.md(r.step.do) }),
            r.step.say ? h('div', { class: 'pb-say' }, h('span', { class: 'ph-label' }, 'Say'), h('span', { html: U.mdInline(r.step.say) })) : null),
          h('td', { class: 'pb-done' }, h('label', { class: 'pb-check' }, box)));
        tbody.appendChild(tr);
      });
    }
    save();
    draw();
  }

  /** An incident playbook: each step at minutes after it started, the updates at the severity's rhythm. */
  function incidentPage(root, p) {
    var s = saved(), sevs = p.severities || [];
    var mine = s.pages[p.id] = s.pages[p.id] || {};
    if (!Array.isArray(mine.done)) mine.done = [];
    function save() { U.store.set('playbooks', s); }
    function now() { var d = new Date(); return clock(d.getHours() * 60 + d.getMinutes()); }
    if (!/^\d{1,2}:\d{2}/.test(mine.start || '')) mine.start = now();
    function sev() { return sevs.filter(function (x) { return x.id === mine.sev; })[0] || sevs[0]; }
    var first = (p.agenda.filter(function (st) { return st.update; })[0] || { at: 15 }).at;
    head(root, p);

    var start = h('input', { class: 'input', type: 'time', id: 'pb-start', 'aria-label': 'It started at' });
    start.value = mine.start;
    var chips = h('div', { class: 'chips pb-sevs', role: 'group', 'aria-label': 'Severity' });
    var means = h('div', { class: 'pb-sev-means', id: 'pb-sev-means' });
    var when = h('p', { class: 'pb-when', id: 'pb-when' });
    root.appendChild(h('div', { class: 'card pb-controls' },
      h('h2', null, 'Your incident'),
      h('div', { class: 'row pb-start-row' },
        K().field('pb-start', 'It started at', 'When the alert fired or the first report came in', start),
        h('button', { class: 'btn btn-small', id: 'pb-now', type: 'button', onclick: function () { start.value = mine.start = now(); save(); draw(); } }, 'Now')),
      h('span', { class: 'field-label' }, 'Severity'), chips, means, when,
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-small btn-primary', id: 'pb-copy-log', type: 'button', onclick: function () {
          U.copy(logText(), 'Incident log copied - paste it into the incident channel');
        } }, 'Copy the incident log'),
        h('button', { class: 'btn btn-small btn-ghost', id: 'pb-reset', type: 'button', onclick: function () {
          mine.done = [];
          start.value = mine.start = now();
          save();
          draw();
        } }, 'A new incident'))));

    var tbody = h('tbody');
    root.appendChild(h('div', { class: 'table-wrap pb-agenda-wrap' }, h('table', { class: 'table pb-agenda pb-incident' },
      h('caption', { class: 'visually-hidden' }, 'The steps'),
      h('thead', null, h('tr', null, h('th', null, 'By'), h('th', null, 'Step and what to say'), h('th', null, 'Done'))),
      tbody)));

    var every = h('p', { class: 'faint', id: 'pb-update-every' });
    var ups = h('ul', { class: 'pb-updates', id: 'pb-updates' });
    var msg = h('pre', { class: 'st-output', id: 'pb-update' });
    msg.textContent = p.update;
    root.appendChild(h('div', { class: 'card pb-prep-card' },
      h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'Stakeholder updates'), h('span', { class: 'spacer' }),
        h('button', { class: 'btn btn-small btn-primary', id: 'pb-copy-update', type: 'button', onclick: function () { U.copy(msg.textContent, 'Update copied - fill in the [brackets]'); } }, 'Copy the update')),
      every, ups, msg));
    root.appendChild(h('div', { class: 'card pb-prep-card', id: 'pb-followup' }, h('h2', null, 'When the impact has stopped'), h('div', { html: U.md(p.followup) })));
    tail(root, p, mine, save, p.prepTitle || 'Before an incident', 'Send it in the incident channel and to everyone who had the updates. Fill in the [brackets].');

    function at0() { return toMinutes(start.value); }
    function updateTimes() {
      var out = [];
      for (var k = 0; k < 6; k++) out.push(at0() + first + k * sev().update);
      return out;
    }
    function logText() {
      var x = sev(), t = at0();
      return ['Incident log: ' + x.title + ', started ' + clock(t), '']
        .concat(p.agenda.map(function (st, i) { return (mine.done.indexOf(i) >= 0 ? '[x] ' : '[ ] ') + clock(t + st.at) + '  ' + st.when + ': ' + st.title; }))
        .concat(['', 'Stakeholder updates due: ' + updateTimes().map(clock).join(', ')]).join('\n');
    }
    function draw() {
      var x = sev(), t = at0();
      chips.innerHTML = '';
      sevs.forEach(function (v) {
        chips.appendChild(h('button', { class: 'chip pb-sev' + (v.id === x.id ? ' selected' : ''), type: 'button', 'data-sev': v.id,
          'aria-pressed': v.id === x.id ? 'true' : 'false', onclick: function () { mine.sev = v.id; save(); draw(); } }, v.title));
      });
      means.innerHTML = '';
      means.appendChild(h('p', null, h('b', null, x.title + ': '), x.means));
      means.appendChild(h('p', { class: 'faint' }, h('b', null, 'Who: '), x.who));
      when.innerHTML = '';
      when.appendChild(h('b', null, 'Started ' + clock(t)));
      when.appendChild(document.createTextNode(', updates every ' + duration(x.update) + ' from ' + clock(t + first) + '.'));
      every.textContent = 'For a ' + x.title.split(':')[0] + ', send an update every ' + duration(x.update) + ', even when nothing has changed: "no change, next update at…" stops people asking.';
      ups.innerHTML = '';
      updateTimes().forEach(function (m, k) { ups.appendChild(h('li', { 'data-at': clock(m) }, h('b', null, clock(m)), h('span', { class: 'faint' }, ' · update ' + (k + 1)))); });
      tbody.innerHTML = '';
      p.agenda.forEach(function (st, i) {
        var box = h('input', { type: 'checkbox', 'aria-label': 'Done: ' + st.title });
        box.checked = mine.done.indexOf(i) >= 0;
        box.addEventListener('change', function () {
          mine.done = mine.done.filter(function (k) { return k !== i; });
          if (box.checked) mine.done.push(i);
          tr.classList.toggle('is-done', box.checked);
          save();
        });
        var tr = h('tr', { 'data-step': i, class: (box.checked ? 'is-done' : '') + (st.update ? ' pb-update-step' : '') || null },
          h('td', null, h('span', { class: 'pb-time' }, clock(t + st.at)), h('small', { class: 'pb-when-label' }, st.when)),
          h('td', null, h('b', null, st.title),
            h('div', { class: 'pb-do', html: U.md(st.do) }),
            st.say ? h('div', { class: 'pb-say' }, h('span', { class: 'ph-label' }, 'Say'), h('span', { html: U.mdInline(st.say) })) : null),
          h('td', { class: 'pb-done' }, h('label', { class: 'pb-check' }, box)));
        tbody.appendChild(tr);
      });
    }
    start.addEventListener('input', function () { if (/^\d{1,2}:\d{2}/.test(start.value)) { mine.start = start.value; save(); draw(); } });
    save();
    draw();
  }

  function page(root, p, query) {
    if (p.kind === 'timeline') return timelinePage(root, p);
    if (p.kind === 'incident') return incidentPage(root, p);
    var s = saved();
    var mine = s.pages[p.id] = s.pages[p.id] || {};
    var weeks = +s.weeks || 2;
    var formats = p.formats || [];
    var fmt = formats.filter(function (f) { return f.id === (query.format || s.format); })[0] || formats[0] || null;
    if (fmt && query.format && fmt.id === query.format) s.format = fmt.id;
    function save() { U.store.set('playbooks', s); }

    head(root, p);

    // your meeting: Sprint length and start time
    var weeksSel = p.scales ? h('select', { class: 'select', id: 'pb-weeks', 'aria-label': 'Sprint length' },
      WEEKS.map(function (w) { return h('option', { value: w[0] }, w[1]); })) : null;
    if (weeksSel) weeksSel.value = String(weeks);
    var start = h('input', { class: 'input', type: 'time', id: 'pb-start', 'aria-label': 'Start time' });
    start.value = mine.start || p.start || '10:00';
    var when = h('p', { class: 'pb-when', id: 'pb-when' });
    var total = h('p', { class: 'pb-total', id: 'pb-total' });
    var max = p.scales ? h('p', { class: 'faint pb-max', id: 'pb-max' }) : h('p', { class: 'faint pb-max' },
      'Refinement is not a Scrum event, so it has no limit; most teams hold one or two sessions like this a week.');
    root.appendChild(h('div', { class: 'card pb-controls' },
      h('h2', null, 'Your meeting'),
      h('div', { class: 'field-row' },
        weeksSel ? K().field('pb-weeks', 'Sprint length', null, weeksSel) : null,
        K().field('pb-start', 'Starts at', null, start)),
      when, total, max,
      h('div', { class: 'row' }, h('button', { class: 'btn btn-small btn-primary', id: 'pb-copy-agenda', type: 'button', onclick: function () {
        U.copy(agendaText(), 'Agenda copied - paste it into the invite');
      } }, 'Copy the agenda for the invite'))));

    // the retrospective's formats and board
    var board = null, fmtWhen = null, fmtChips = null;
    if (formats.length) {
      fmtChips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Retrospective format' });
      fmtWhen = h('p', { class: 'muted pb-format-when' });
      board = h('div', { class: 'pb-board' });
      root.appendChild(h('div', { class: 'card pb-formats' },
        h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'Choose a format'), h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small', id: 'pb-copy-board', type: 'button', onclick: function () {
            U.copy(boardText(), 'Board copied - paste it into Miro or Confluence');
          } }, 'Copy the board')),
        h('p', { class: 'faint' }, 'Rotate formats so the retro never runs on autopilot. The format changes the "Gather data" step.'),
        fmtChips, fmtWhen, board));
    }

    var tbody = h('tbody');
    root.appendChild(h('div', { class: 'table-wrap pb-agenda-wrap' }, h('table', { class: 'table pb-agenda' },
      h('caption', { class: 'visually-hidden' }, 'The agenda'),
      h('thead', null, h('tr', null, h('th', null, 'Time'), h('th', null, 'Step and what to say'), h('th', null, 'Min'))),
      tbody)));

    tail(root, p, mine, save, 'Before the meeting', 'Send it the same day, in the team channel. Fill in the [brackets].');

    function steps() {
      var at = toMinutes(start.value);
      return p.agenda.map(function (st) {
        var m = minutesOf(p, st, weeks), row = { step: st, at: at, minutes: m };
        at += m;
        return row;
      });
    }
    function totalMinutes() { return steps().reduce(function (n, r) { return n + r.minutes; }, 0); }
    function stepTitle(st) { return st.title + (st.format && fmt ? ': ' + fmt.title : ''); }

    function agendaText() {
      var rows = steps(), t = totalMinutes(), s0 = toMinutes(start.value);
      return [p.title + ', ' + clock(s0) + ' to ' + clock(s0 + t) + ' (' + duration(t) + ')' + (p.scales ? ', for a ' + WEEK_WORD[weeks] + ' Sprint' : ''), '']
        .concat(rows.map(function (r) { return clock(r.at) + '  ' + stepTitle(r.step) + ' (' + r.minutes + ' min)'; }))
        .join('\n');
    }
    function boardText() {
      if (!fmt) return '';
      return ['Retrospective: ' + fmt.title, ''].concat(fmt.columns.map(function (c) { return c.title + ': ' + c.prompt; })).join('\n');
    }

    function draw() {
      var rows = steps(), t = totalMinutes(), s0 = toMinutes(start.value);
      when.innerHTML = '';
      when.appendChild(h('b', null, clock(s0) + ' to ' + clock(s0 + t)));
      total.dataset.minutes = String(t);
      total.textContent = duration(t) + (p.scales ? ' for a ' + WEEK_WORD[weeks] + ' Sprint.' : ', one session.');
      if (p.scales) {
        var mx = maxOf(p, weeks);
        max.dataset.minutes = String(mx);
        max.textContent = 'The Scrum Guide\'s limit is ' + duration(p.monthMax) + ' for a one-month Sprint, and usually less for shorter Sprints' +
          (weeks < 4 ? ': in proportion, about ' + duration(mx) + ' for a ' + WEEK_WORD[weeks] + ' Sprint.' : '.');
      }
      tbody.innerHTML = '';
      rows.forEach(function (r, i) {
        tbody.appendChild(h('tr', { 'data-step': i, 'data-minutes': r.minutes, class: r.step.format ? 'pb-format-step' : null },
          h('td', { class: 'pb-time' }, clock(r.at)),
          h('td', null, h('b', null, stepTitle(r.step)),
            h('div', { class: 'pb-do', html: U.md(r.step.do) }),
            r.step.say ? h('div', { class: 'pb-say' }, h('span', { class: 'ph-label' }, 'Say'), h('span', { html: U.mdInline(r.step.say) })) : null),
          h('td', { class: 'pb-min' }, String(r.minutes))));
      });
      if (fmt) {
        fmtChips.innerHTML = '';
        formats.forEach(function (f) {
          fmtChips.appendChild(h('button', { class: 'chip pb-format' + (f.id === fmt.id ? ' selected' : ''), type: 'button', 'data-format': f.id,
            'aria-pressed': f.id === fmt.id ? 'true' : 'false', onclick: function () { fmt = f; s.format = f.id; save(); draw(); } }, f.title));
        });
        fmtWhen.textContent = fmt.when;
        board.innerHTML = '';
        board.style.setProperty('--n', fmt.columns.length);
        fmt.columns.forEach(function (c) { board.appendChild(h('div', { class: 'pb-col' }, h('h3', null, c.title), h('p', null, c.prompt))); });
      }
    }

    if (weeksSel) weeksSel.addEventListener('change', function () { weeks = +weeksSel.value; s.weeks = weeksSel.value; save(); draw(); });
    start.addEventListener('input', function () { if (/^\d{1,2}:\d{2}/.test(start.value)) { mine.start = start.value; save(); draw(); } });
    save();
    draw();
  }

  function K() { return U.toolKit; }

  U.views.playbooks = {
    cards: cards,
    render: function (root, params, query) {
      if (!params[0]) return listPage(root);
      var p = U.find('playbooks', params[0]);
      if (!p) {
        root.appendChild(h('div', { class: 'card' }, h('h1', null, 'Playbook not found'),
          h('p', null, 'There is no playbook called "' + params[0] + '".'), h('a', { class: 'btn', href: '#/playbooks' }, '← All playbooks')));
        return;
      }
      page(root, p, query || {});
    }
  };
  U.route('playbooks', U.views.playbooks);
})(window.LELT);
