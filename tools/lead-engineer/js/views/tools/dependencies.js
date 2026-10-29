/*
 * views/tools/dependencies.js - the dependency and stakeholder map (#/tools/dependencies).
 *
 * Two lists:
 *   what you need from other teams   team, a named person, what, needed by, status, what slips if
 *                                    it is late, and why helping serves their own goals
 *   the stakeholders                 name, role, power and interest (high or low), and a RACI
 *                                    letter: Responsible (does the work), Accountable (the one
 *                                    owner of the decision), Consulted, Informed
 *
 * Checks flag a dependency with nobody named, no date, asked but not agreed in writing, due within
 * a week and not agreed, overdue, or with no stated impact; and a RACI with no A, two As, or no R.
 * The power and interest grid says how to keep each person involved. For one dependency, the tool
 * writes the first request and the joint escalation. The draft is kept in "lelt.tool.dependencies".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { project: '', myManager: '', theirManager: '', pick: '0', deps: [], people: [] };
  var STATUS = [['', '–'], ['not-asked', 'Not asked yet'], ['asked', 'Asked, not agreed'], ['agreed', 'Agreed in writing'], ['delivered', 'Delivered']];
  var LEVEL = [['high', 'High'], ['low', 'Low']];
  var RACI = [['', '–'], ['R', 'R: does the work'], ['A', 'A: owns the decision'], ['C', 'C: consulted'], ['I', 'I: informed']];
  var QUADS = [
    { id: 'manage', title: 'Manage closely', what: 'High power, high interest. Involve them in decisions; a short conversation every week.' },
    { id: 'satisfy', title: 'Keep satisfied', what: 'High power, low interest. A short summary every month; ask them before big changes.' },
    { id: 'inform', title: 'Keep informed', what: 'Low power, high interest. The regular status update; invite them to the review or demo.' },
    { id: 'monitor', title: 'Monitor', what: 'Low power, low interest. Release notes are enough; check now and then whether that changed.' }
  ];

  function sample() {
    var today = P.today();
    function wd(n) { return U.localDate(P.addWorkdays(today, n)); }
    return {
      project: 'Customer refunds', myManager: 'Priya', theirManager: 'Rohan', pick: '0',
      deps: [
        { team: 'Platform', person: 'Kiran (Platform lead)', need: 'the refund endpoint on the payment gateway', by: wd(8), status: 'asked',
          impact: 'refunds miss the festive sale', goal: 'their goal this quarter is to move every payment call onto the gateway' },
        { team: 'Security', person: 'Farah (Security lead)', need: 'a security review of the refund flow', by: wd(15), status: 'agreed',
          impact: 'the release waits for the review', goal: 'reviewing before release is cheaper for them than a finding after it' },
        { team: 'Finance', person: 'Deepa (Finance controller)', need: 'sign-off on the refund rules', by: wd(3), status: 'delivered',
          impact: 'we would build the wrong rules', goal: 'refund errors land in their month-end close' }
      ],
      people: [
        { name: 'Neha', role: 'Product Manager', power: 'high', interest: 'high', raci: 'A' },
        { name: 'Priya', role: 'Engineering manager', power: 'high', interest: 'high', raci: 'C' },
        { name: 'Vikram', role: 'VP Engineering', power: 'high', interest: 'low', raci: 'I' },
        { name: 'Anil', role: 'Support lead', power: 'low', interest: 'high', raci: 'I' },
        { name: 'Payments team (you)', role: 'Builds it', power: 'low', interest: 'high', raci: 'R' },
        { name: 'Marketing team', role: 'Announces the feature', power: 'low', interest: 'low', raci: 'I' }
      ]
    };
  }

  function quadOf(p) { return p.power === 'high' ? (p.interest === 'high' ? 'manage' : 'satisfy') : (p.interest === 'high' ? 'inform' : 'monitor'); }
  function named(list, a, b) { return (list || []).map(function (x, i) { return Object.assign({ i: i }, x); }).filter(function (x) { return String(x[a] || '').trim() || String(x[b] || '').trim(); }); }

  function compute(s) {
    var people = named(s.people, 'name', 'role'), grid = {};
    QUADS.forEach(function (q) { grid[q.id] = []; });
    people.forEach(function (p) { grid[quadOf(p)].push(p.i); });
    var raci = { R: [], A: [], C: [], I: [] };
    people.forEach(function (p) { if (raci[p.raci]) raci[p.raci].push(p.name || p.role); });
    return { deps: named(s.deps, 'team', 'need'), people: people, grid: grid, raci: raci };
  }

  var RULES = ['dep-no-person', 'dep-no-date', 'dep-not-written', 'dep-due-soon', 'dep-overdue', 'dep-no-impact', 'raci-no-a', 'raci-many-a', 'raci-no-r'];

  function check(s) {
    var r = compute(s), today = P.today(s), out = [];
    r.deps.forEach(function (d) {
      var where = 'Need ' + (d.i + 1), by = P.parseDay(d.by), open = d.status !== 'agreed' && d.status !== 'delivered';
      if (!String(d.person || '').trim()) out.push({ rule: 'dep-no-person', where: where, row: d.i, key: 'person' });
      if (!by) out.push({ rule: 'dep-no-date', where: where, row: d.i, key: 'by' });
      if (d.status === 'asked') out.push({ rule: 'dep-not-written', where: where, row: d.i, key: 'status' });
      if (by && d.status !== 'delivered' && by < today) out.push({ rule: 'dep-overdue', where: where, row: d.i, key: 'by' });
      else if (by && open && P.workdaysBetween(today, by) <= 5) out.push({ rule: 'dep-due-soon', where: where, row: d.i, key: 'by' });
      if (!String(d.impact || '').trim()) out.push({ rule: 'dep-no-impact', where: where, row: d.i, key: 'impact' });
    });
    if (r.people.some(function (p) { return p.raci; })) {
      if (!r.raci.A.length) out.push({ rule: 'raci-no-a', where: 'RACI' });
      if (r.raci.A.length > 1) out.push({ rule: 'raci-many-a', where: 'RACI', detail: r.raci.A.join(', ') });
      if (!r.raci.R.length) out.push({ rule: 'raci-no-r', where: 'RACI' });
    }
    return out;
  }

  function first(name) { return String(name || '').trim().split(/[\s(]/)[0] || 'there'; }

  /** The first written request for one dependency. */
  function request(s, d) {
    if (!d) return 'Add a dependency to write the request.';
    var by = P.parseDay(d.by), today = P.today(s);
    var confirm = by && P.addWorkdays(today, 2) > by ? today : P.addWorkdays(today, 2);
    var out = ['Hi ' + first(d.person) + ',', '',
      (String(s.project || '').trim() ? 'I lead the ' + s.project.trim() + ' work. ' : '') + 'We need ' + (d.need || 'your help') + ' from ' + (d.team || 'your team') +
        (by ? ' by ' + P.day(by) : '') + '.'];
    if (String(d.impact || '').trim()) out.push('Why it matters: if it is late, ' + d.impact.trim() + '.');
    if (String(d.goal || '').trim()) out.push('It should help your side too: ' + d.goal.trim() + '.');
    out.push('', 'Could you confirm by ' + P.day(confirm) + (by ? ' whether ' + P.day(by) + ' works, or tell me which date does?' : ' when you could do it?') +
      ' If it helps, I can walk your team through exactly what we need in 15 minutes.', '', 'Thanks!');
    return out.join('\n');
  }

  /** The joint escalation to both managers, for when the request did not settle it. */
  function escalation(s, d) {
    if (!d) return 'Add a dependency to write the escalation.';
    if (d.status === 'delivered') return 'This one is delivered: nothing to escalate.';
    var by = P.parseDay(d.by), mine = String(s.myManager || '').trim() || '(your manager)', theirs = String(s.theirManager || '').trim() || '(their manager)';
    var out = ['Hi ' + theirs + ' and ' + mine + ',', '',
      first(d.person) + ' and I agreed to raise this together, so that you can decide quickly.',
      (String(s.project || '').trim() || 'Our project') + ' needs ' + (d.need || 'help') + ' from ' + (d.team || 'the team') + (by ? ' by ' + P.day(by) : '') + '. ' +
        (d.status === 'agreed' ? 'It was agreed, but it is now at risk.' : 'It is not in ' + (d.team || 'their') + '\'s plan yet.')];
    if (String(d.impact || '').trim()) out.push('If it is late: ' + d.impact.trim() + '.');
    out.push('', 'The options we see:',
      '1. ' + (d.team || 'Their team') + ' takes it into the current plan, and something of theirs moves.',
      '2. We build a temporary workaround on our side, and our date moves by a few days.',
      '3. Both plans stay as they are, and our date moves.',
      '', 'Could you agree between you by ' + P.day(P.addWorkdays(P.today(s), 3)) + '? We will both go with what you decide.');
    return out.join('\n');
  }

  function raciText(s, r) {
    var lines = [(String(s.project || '').trim() || 'This project') + ': who does what (RACI)'];
    [['R', 'Responsible (does the work)'], ['A', 'Accountable (owns the decision)'], ['C', 'Consulted (asked before deciding)'], ['I', 'Informed (told after)']].forEach(function (x) {
      lines.push(x[1] + ': ' + (r.raci[x[0]].length ? r.raci[x[0]].join(', ') : '–'));
    });
    return lines.join('\n');
  }

  U.tools.dependencies = {
    EMPTY: EMPTY, rules: RULES, compute: compute, check: check, request: request, escalation: escalation,
    render: function (root) {
      var s = K.load('dependencies', EMPTY);
      var f = K.form(s, changed);
      var deps = K.rows({
        id: 'dp-deps', noun: 'need', list: function () { return s.deps; }, changed: changed,
        blank: function () { return { team: '', person: '', need: '', by: '', status: 'not-asked', impact: '', goal: '' }; },
        cols: [
          { key: 'team', label: 'Team', ph: 'Platform', size: '1fr' },
          { key: 'person', label: 'Person', ph: 'A name, not a team', size: '1.3fr' },
          { key: 'need', label: 'What you need', type: 'textarea', rows: 1, ph: 'The smallest thing that unblocks you', size: '2fr' },
          { key: 'by', label: 'Needed by', type: 'date', size: '1.15fr' },
          { key: 'status', label: 'Status', type: 'select', options: STATUS, size: '1.3fr' },
          { key: 'impact', label: 'If it is late', type: 'textarea', rows: 1, ph: 'What slips, for whom', full: true },
          { key: 'goal', label: 'Why it helps them', type: 'textarea', rows: 1, ph: 'Their own goal this serves', full: true }
        ]
      });
      var people = K.rows({
        id: 'dp-people', noun: 'person', list: function () { return s.people; }, changed: changed,
        blank: function () { return { name: '', role: '', power: 'high', interest: 'high', raci: '' }; },
        cols: [
          { key: 'name', label: 'Name', ph: 'Neha', size: '1.4fr' },
          { key: 'role', label: 'Role', ph: 'Product Manager', size: '1.4fr' },
          { key: 'power', label: 'Power', type: 'select', options: LEVEL, size: '.8fr' },
          { key: 'interest', label: 'Interest', type: 'select', options: LEVEL, size: '.8fr' },
          { key: 'raci', label: 'RACI', type: 'select', options: RACI, size: '1.3fr' }
        ]
      });
      var checks = K.checksCard('dependencies', 'No warnings. Every need has a person, a date and an agreement in writing; the RACI has one owner.', function (x) {
        K.focus(x.row !== undefined ? K.cell('dp-deps', x.row, x.key) : U.$('#dp-people [data-key="raci"]'));
      });
      var grid = h('div', { class: 'dp-grid' });
      var raciOut = h('pre', { class: 'st-output', id: 'dp-raci-out' });
      var pick = h('select', { class: 'select', id: 'dp-pick', 'aria-label': 'Which dependency' });
      pick.addEventListener('change', function () { s.pick = pick.value; changed(); });
      var req = K.outputCard({ id: 'dp-request', copyId: 'dp-copy-request', title: 'The request',
        prompt: function (text) { return 'I am a lead engineer asking another team, which does not report to me, for help. Make this request easy to say yes to: short, specific, polite, with a date. Keep every fact.\n\n' + text; } });
      var esc = K.outputCard({ id: 'dp-escalation', copyId: 'dp-copy-escalation', title: 'The escalation',
        note: 'Send it together with the other team\'s lead, after the request did not settle it. A joint escalation asks for a decision; it does not complain.' });

      root.appendChild(h('div', { class: 'tool-stack' },
        h('div', { class: 'card st-form' },
          K.samples([['dp-sample', 'Load an example', function () { load(sample()); }]], 'dp-clear', function () { load(K.clone(EMPTY)); }),
          h('div', { class: 'field-row three' },
            K.field('dp-project', 'Project', null, f.input('project', { id: 'dp-project', placeholder: 'Customer refunds' })),
            K.field('dp-my-manager', 'Your manager', null, f.input('myManager', { id: 'dp-my-manager', placeholder: 'Priya' })),
            K.field('dp-their-manager', 'Their manager', null, f.input('theirManager', { id: 'dp-their-manager', placeholder: 'Rohan' }))),
          h('h2', null, 'What you need from other teams'), deps.el),
        checks.el,
        h('div', { class: 'card' }, h('h2', null, 'The messages'),
          h('div', { class: 'row' }, h('label', { for: 'dp-pick' }, h('b', null, 'For')), pick)),
        h('div', { class: 'tool-pair' }, req.el, esc.el),
        h('div', { class: 'card st-form' }, h('h2', null, 'The stakeholders'),
          h('p', { class: 'muted' }, 'Everyone who can stop, change or needs to know about the work. Power: can they change the plan? Interest: how much does it affect them?'),
          people.el),
        h('div', { class: 'tool-pair' },
          h('div', { class: 'card' }, h('h2', null, 'Power and interest'), grid),
          h('div', { class: 'card' }, h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'RACI'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small', type: 'button', id: 'dp-copy-raci', onclick: function () { U.copy(raciOut.textContent); } }, 'Copy')), raciOut))));

      function load(next) { K.replace(s, next); f.fill(); deps.draw(); people.draw(); changed(); }

      function changed() {
        U.store.set('tool.dependencies', s);
        var r = compute(s);
        checks.show(check(s));
        grid.innerHTML = '';
        QUADS.forEach(function (q) {
          grid.appendChild(h('div', { class: 'dp-quad dp-q-' + q.id, 'data-group': q.id }, h('b', null, q.title), h('small', null, q.what),
            h('div', { class: 'pr-chips' }, r.grid[q.id].map(function (i) {
              var p = s.people[i];
              return h('span', { class: 'pr-chip dp-chip' }, (p.name || p.role) + (p.raci ? ' · ' + p.raci : ''));
            }))));
        });
        raciOut.textContent = raciText(s, r);
        pick.innerHTML = '';
        r.deps.forEach(function (d) { pick.appendChild(h('option', { value: String(d.i) }, (d.team || 'Need ' + (d.i + 1)) + (d.need ? ': ' + d.need : ''))); });
        var chosen = r.deps.filter(function (d) { return String(d.i) === String(s.pick); })[0] || r.deps[0];
        if (chosen) pick.value = String(chosen.i);
        req.set(request(s, chosen));
        esc.set(escalation(s, chosen));
      }

      f.fill();
      changed();
    }
  };
})(window.LELT);
