/*
 * views/tools/raid.js - the risk register, kept as a RAID log (#/tools/raid).
 *
 *   Risk        might happen: likelihood x impact (each 1 to 5) gives a score from 1 to 25
 *   Assumption  taken as true without proof: the next action says how and when you will check it
 *   Issue       is happening now: its score is 5 (certain) x impact
 *   Dependency  something you need from someone else (the dependency map holds the detail)
 *
 * Each item has an owner, a date (to review or to finish by), a next action and a status. Scores
 * of 15 or more are high, 5 to 12 medium, 1 to 4 low. The checks flag an open item with no owner,
 * no date, no action, a date in the past, a risk with no score, and vague actions such as "monitor
 * closely" (the "raid" rules in data/lint-rules.js). Exports: a Markdown table, a CSV file, and the
 * top risks for a status update. The log is kept in "lelt.tool.raid".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { items: [] };
  var TYPES = [['risk', 'Risk'], ['assumption', 'Assumption'], ['issue', 'Issue'], ['dependency', 'Dependency']];
  var SCALE = [['', '–'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']];
  var STATUS = [['open', 'Open'], ['closed', 'Closed']];
  var LETTER = { risk: 'R', assumption: 'A', issue: 'I', dependency: 'D' };

  function sample() {
    var today = P.today();
    function wd(n) { return U.localDate(P.addWorkdays(today, n)); }
    function it(type, text, owner, date, l, i, action) { return { type: type, text: text, owner: owner, date: date, likelihood: l, impact: i, action: action, status: 'open' }; }
    return { items: [
      it('risk', 'Only Sameer knows the settlement batch job; if he is away, a failed run can\'t be fixed', 'Divya', wd(5), '3', '4',
        'Divya pairs with Sameer on the next two settlement runs and writes the runbook.'),
      it('risk', 'The bank\'s sandbox may not be ready before our testing starts', 'You', wd(3), '4', '4',
        'Ask the bank for a sandbox date in writing; build a stub of their API so testing can start without it.'),
      it('assumption', 'Finance will not change the refund rules after signing them off', 'Neha', wd(2), '', '',
        'Neha confirms in the sign-off email that rule changes after sign-off move the date.'),
      it('issue', 'Staging is down about 2 hours a day because of the shared database', 'Arjun', wd(4), '', '3',
        'Arjun moves our tests to their own database schema; Platform ticket PLAT-212 raised.'),
      it('dependency', 'Security review slot in week 3', 'You', wd(10), '', '',
        'Slot requested; Farah\'s team confirms the week in writing.')
    ] };
  }

  function level(score) { return score >= 15 ? 'high' : score >= 5 ? 'medium' : 'low'; }

  /** Items with ids (R1, A1...) and scores; the open ones by score; the heat grid of open risks. */
  function compute(s) {
    var n = { risk: 0, assumption: 0, issue: 0, dependency: 0 };
    var items = (s.items || []).map(function (x, row) {
      var type = LETTER[x.type] ? x.type : 'risk';
      if (!String(x.text || '').trim()) return null;
      var l = P.num(x.likelihood), i = P.num(x.impact);
      var score = type === 'risk' ? (l > 0 && i > 0 ? l * i : null) : type === 'issue' ? (i > 0 ? 5 * i : null) : null;
      return { row: row, id: LETTER[type] + (++n[type]), type: type, text: x.text.trim(), owner: String(x.owner || '').trim(), date: x.date || '',
        likelihood: l, impact: i, score: score, level: score ? level(score) : '', action: String(x.action || '').trim(), status: x.status || 'open' };
    }).filter(Boolean);
    var open = items.filter(function (x) { return x.status !== 'closed'; }).sort(function (a, b) {
      return (b.score || 0) - (a.score || 0) || String(a.date || '9999').localeCompare(String(b.date || '9999')) || a.row - b.row;
    });
    return { items: items, open: open, heat: open.filter(function (x) { return x.type === 'risk' && x.score; }) };
  }

  var RULES = ['raid-no-owner', 'raid-no-date', 'risk-no-score', 'no-action', 'raid-overdue', 'raid-vague-action'];

  function check(s) {
    var r = compute(s), today = P.today(s), out = [], rules = (U.data.lintRules || {}).raid || [];
    r.open.slice().sort(function (a, b) { return a.row - b.row; }).forEach(function (x) {
      var where = x.id, d = P.parseDay(x.date);
      if (!x.owner) out.push({ rule: 'raid-no-owner', where: where, row: x.row, key: 'owner' });
      if (!d) out.push({ rule: 'raid-no-date', where: where, row: x.row, key: 'date' });
      else if (d < today) out.push({ rule: 'raid-overdue', where: where, row: x.row, key: 'date' });
      if (x.type === 'risk' && !x.score) out.push({ rule: 'risk-no-score', where: where, row: x.row, key: 'likelihood' });
      if (!x.action) out.push({ rule: 'no-action', where: where, row: x.row, key: 'action' });
      var vague = U.lint.find(x.action, rules)[0];
      if (vague) out.push({ rule: 'raid-vague-action', where: where, row: x.row, key: 'action', detail: vague.text });
    });
    return out;
  }

  function scoreText(x) { return x.score ? x.score + ' (' + x.level + ')' : ''; }
  function dateText(x) { var d = P.parseDay(x.date); return d ? P.day(d) : ''; }
  var COLUMNS = ['ID', 'Type', 'Description', 'Owner', 'Date', 'Score', 'Next action', 'Status'];
  function cells(x) { return [x.id, x.type[0].toUpperCase() + x.type.slice(1), x.text, x.owner, dateText(x), scoreText(x), x.action, x.status]; }

  function markdown(r) {
    var esc = function (v) { return String(v).replace(/\|/g, '\\|').replace(/\n/g, ' '); };
    return ['| ' + COLUMNS.join(' | ') + ' |', '|' + COLUMNS.map(function () { return '---'; }).join('|') + '|']
      .concat(r.items.map(function (x) { return '| ' + cells(x).map(esc).join(' | ') + ' |'; })).join('\n');
  }
  function csv(r) {
    var q = function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return [COLUMNS.join(',')].concat(r.items.map(function (x) { return cells(x).map(q).join(','); })).join('\r\n') + '\r\n';
  }
  function top(r) {
    var list = r.open.filter(function (x) { return x.score; }).slice(0, 3);
    if (!list.length) return 'No scored open risks or issues yet.';
    return ['Top risks and issues this week:'].concat(list.map(function (x) {
      return '- ' + x.id + ' (' + x.level + ', ' + x.score + '): ' + x.text + '. Owner: ' + (x.owner || 'nobody yet') +
        (x.action ? '. Next: ' + x.action.replace(/\.$/, '') : '') + (dateText(x) ? ' (' + dateText(x) + ')' : '') + '.';
    })).join('\n');
  }

  U.tools.raid = {
    EMPTY: EMPTY, rules: RULES, compute: compute, check: check, markdown: markdown, csv: csv,
    render: function (root) {
      var s = K.load('raid', EMPTY);
      var list = K.rows({
        id: 'rd-items', noun: 'item', list: function () { return s.items; }, changed: changed,
        blank: function () { return { type: 'risk', text: '', owner: '', date: '', likelihood: '', impact: '', action: '', status: 'open' }; },
        cols: [
          { key: 'type', label: 'Type', type: 'select', options: TYPES, size: '1.2fr' },
          { key: 'owner', label: 'Owner', ph: 'A person', size: '1.1fr' },
          { key: 'date', label: 'Review or due by', type: 'date', size: '1.2fr' },
          { key: 'likelihood', label: 'Likelihood', type: 'select', options: SCALE, size: '.75fr' },
          { key: 'impact', label: 'Impact', type: 'select', options: SCALE, size: '.75fr' },
          { key: 'status', label: 'Status', type: 'select', options: STATUS, size: '.9fr' },
          { key: 'text', label: 'Description', type: 'textarea', ph: 'What might happen (or is happening), and what it would hit', full: true },
          { key: 'action', label: 'Next action', type: 'textarea', ph: 'Who does what, by when', full: true }
        ]
      });
      var checks = K.checksCard('raid', 'No warnings. Every open item has an owner, a date and a concrete next action.', function (x) {
        K.focus(K.cell('rd-items', x.row, x.key));
      });
      var heat = h('div'), sorted = h('ol', { class: 'rd-list', id: 'rd-list' });
      var md = K.outputCard({ id: 'rd-md', copyId: 'rd-copy-md', title: 'As a Markdown table', note: 'Paste into Confluence, Jira or a README.' });
      var topOut = K.outputCard({ id: 'rd-top', copyId: 'rd-copy-top', title: 'Top risks for your status update' });

      root.appendChild(h('div', { class: 'tool-stack' },
        h('div', { class: 'card st-form' },
          K.samples([['rd-sample', 'Load an example', function () { load(sample()); }]], 'rd-clear', function () { load(K.clone(EMPTY)); }),
          h('p', { class: 'muted' }, 'Likelihood and impact from 1 (rare, minor) to 5 (almost certain, severe). Review the log once a week: close what is done, ' +
            'update the scores, and move anything that happened from Risk to Issue.'),
          list.el),
        checks.el,
        h('div', { class: 'tool-pair' },
          h('div', { class: 'card' }, h('h2', null, 'Open items, highest score first'), sorted),
          h('div', { class: 'card' }, h('h2', null, 'Risk heat map'), heat)),
        h('div', { class: 'tool-pair' }, topOut.el,
          h('div', null, md.el, h('div', { class: 'row', style: { marginTop: '10px' } },
            h('button', { class: 'btn', id: 'rd-csv', type: 'button', onclick: function () {
              U.download('raid-log-' + U.localDate(new Date()) + '.csv', '﻿' + csv(compute(s)), 'text/csv');
            } }, 'Download as CSV (Excel)'))))));

      function load(next) { K.replace(s, next); list.draw(); changed(); }

      function changed() {
        U.store.set('tool.raid', s);
        var r = compute(s);
        checks.show(check(s));
        sorted.innerHTML = '';
        if (!r.open.length) sorted.appendChild(h('li', { class: 'faint' }, 'Nothing open.'));
        r.open.forEach(function (x) {
          sorted.appendChild(h('li', { 'data-id': x.id },
            h('span', { class: 'badge rd-score rd-' + (x.level || 'none') }, x.id + (x.score ? ' · ' + x.score : '')), ' ',
            x.text, h('span', { class: 'faint' }, ' · ' + (x.owner || 'no owner') + (dateText(x) ? ' · ' + dateText(x) : ''))));
        });
        heat.innerHTML = '';
        var rows = [];
        for (var l = 5; l >= 1; l--) {
          var tds = [h('th', { scope: 'row' }, String(l))];
          for (var i = 1; i <= 5; i++) {
            var here = r.heat.filter(function (x) { return x.likelihood === l && x.impact === i; });
            tds.push(h('td', { class: 'rd-' + level(l * i), 'data-l': l, 'data-i': i, title: 'Likelihood ' + l + ' × impact ' + i + ' = ' + l * i },
              here.map(function (x) { return h('span', { class: 'rd-id' }, x.id); })));
          }
          rows.push(h('tr', null, tds));
        }
        heat.appendChild(h('table', { class: 'rd-heat' },
          h('caption', { class: 'faint' }, 'Likelihood (down) × impact (across): open risks'),
          h('tbody', null, rows),
          h('tfoot', null, h('tr', null, h('th'), [1, 2, 3, 4, 5].map(function (i) { return h('th', { scope: 'col' }, String(i)); })))));
        md.set(markdown(r));
        topOut.set(top(r));
      }

      changed();
    }
  };
})(window.LELT);
