/*
 * views/tools/capacity.js - the sprint capacity calculator (#/tools/capacity).
 *
 * For each person: days off, on-call days and the share of their time on this team. Then
 *
 *   days here       sprint days - public holidays - days off
 *   person-days     (days here - on-call days + on-call days x what an on-call day is worth) x share
 *   normal sprint   the same with no holidays and no days off (or a number you enter)
 *   forecast        recent velocity x (this sprint's person-days / a normal sprint's), with the
 *                   lowest and highest recent velocity scaled the same way as the range
 *   focused days    person-days x focus factor: for teams that plan in hours or days of work
 *
 * The planning message says what changed and suggests a number. Kept in "lelt.tool.capacity".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { sprintDays: '10', holidays: '0', focus: '0.7', oncall: '0.5', velocity: '', usual: '', people: [] };

  function sample() {
    function p(name, leave, oncall, alloc) { return { name: name, leave: leave, oncall: oncall, alloc: alloc }; }
    return { sprintDays: '10', holidays: '1', focus: '0.7', oncall: '0.5', velocity: '31, 28, 35', usual: '',
      people: [p('Asha', '3', '0', '100'), p('Rahul', '0', '5', '100'), p('Divya', '0', '0', '100'), p('Sameer', '0', '0', '50'), p('Kiran', '2', '0', '100')] };
  }

  function velocities(text) {
    return String(text || '').split(/[\s,;]+/).map(P.num).filter(function (v) { return v >= 0; });
  }

  function compute(s) {
    var days = P.num(s.sprintDays) > 0 ? P.num(s.sprintDays) : 10, hol = Math.max(0, P.num(s.holidays) || 0);
    var oc = P.num(s.oncall) >= 0 ? Math.min(1, P.num(s.oncall)) : 0.5, focus = P.num(s.focus) > 0 ? Math.min(1, P.num(s.focus)) : 0.7;
    var people = (s.people || []).map(function (x, i) {
      var share = isFinite(P.num(x.alloc)) ? Math.max(0, P.num(x.alloc)) / 100 : 1;
      var leave = Math.max(0, P.num(x.leave) || 0), on = Math.max(0, P.num(x.oncall) || 0);
      var here = Math.max(0, days - hol - leave), onHere = Math.min(on, here), onNormal = Math.min(on, days);
      return { i: i, name: String(x.name || '').trim(), leave: leave, oncall: onHere, share: share, here: here,
        avail: (here - onHere + onHere * oc) * share, normal: (days - onNormal + onNormal * oc) * share };
    }).filter(function (x) { return x.name; });
    var avail = people.reduce(function (n, x) { return n + x.avail; }, 0);
    var normal = P.num(s.usual) > 0 ? P.num(s.usual) : people.reduce(function (n, x) { return n + x.normal; }, 0);
    var v = velocities(s.velocity), ratio = normal ? avail / normal : 0;
    var avg = v.length ? v.reduce(function (n, x) { return n + x; }, 0) / v.length : NaN;
    return { days: days, holidays: hol, oncallWorth: oc, focus: focus, people: people, avail: avail, normal: normal, ratio: ratio,
      focused: avail * focus, velocities: v, average: avg,
      forecast: avg * ratio, low: v.length ? Math.min.apply(null, v) * ratio : NaN, high: v.length ? Math.max.apply(null, v) * ratio : NaN };
  }

  var RULES = ['cap-no-people', 'cap-few-sprints', 'cap-spread', 'cap-low', 'cap-focus-high', 'cap-leave-over'];

  function check(s) {
    var r = compute(s), out = [];
    if (!r.people.length) out.push({ rule: 'cap-no-people', where: 'People', field: 'cp-people-add' });
    if (r.velocities.length < 3) out.push({ rule: 'cap-few-sprints', where: 'Velocity', field: 'cp-velocity' });
    if (r.velocities.length >= 2 && Math.max.apply(null, r.velocities) > 1.5 * Math.min.apply(null, r.velocities)) {
      out.push({ rule: 'cap-spread', where: 'Velocity', field: 'cp-velocity' });
    }
    if (r.people.length && r.ratio < 0.8) out.push({ rule: 'cap-low', where: 'Capacity', detail: Math.round(r.ratio * 100) + '%', field: 'cp-people-add' });
    if (r.focus > 0.85) out.push({ rule: 'cap-focus-high', where: 'Focus', field: 'cp-focus' });
    r.people.forEach(function (x) { if (x.leave + r.holidays > r.days) out.push({ rule: 'cap-leave-over', where: x.name, row: x.i }); });
    return out;
  }

  function round(v) { return isFinite(v) ? String(Math.round(v)) : '-'; }
  function pct(v) { return Math.round(v * 100) + '%'; }

  /** The message for Sprint Planning: capacity, why, and the suggested forecast. */
  function message(s, r) {
    if (!r.people.length) return 'Add the people on the team to see this sprint\'s capacity.';
    var why = [];
    r.people.forEach(function (x) {
      if (x.leave) why.push(x.name + ' on leave ' + U.plural(x.leave, 'day'));
      if (x.oncall) why.push(x.name + ' on call ' + U.plural(x.oncall, 'day'));
      if (x.share < 1) why.push(x.name + ' at ' + pct(x.share));
    });
    if (r.holidays) why.push(U.plural(r.holidays, 'public holiday'));
    var out = ['Sprint capacity: ' + P.fixed(r.avail) + ' of ' + P.fixed(r.normal) + ' person-days (' + pct(r.ratio) + ' of a normal sprint).'];
    if (why.length) out.push('Why: ' + why.join(', ') + '.');
    if (r.velocities.length) {
      out.push('Our last ' + U.plural(r.velocities.length, 'sprint') + ': ' + r.velocities.join(', ') + ' points (average ' + P.fixed(r.average) + ').');
      out.push('Suggested forecast: about ' + round(r.forecast) + ' points (range ' + round(r.low) + ' to ' + round(r.high) + '). ' +
        'I suggest we plan about ' + round(r.forecast) + ' and keep one stretch item ready in case we finish early.');
    } else {
      out.push('Focused capacity: about ' + P.fixed(r.focused) + ' days of work (' + pct(r.focus) + ' focus). Plan the tasks against that.');
    }
    return out.join('\n');
  }

  U.tools.capacity = {
    EMPTY: EMPTY, rules: RULES, compute: compute, check: check, message: message,
    render: function (root) {
      var s = K.load('capacity', EMPTY);
      var f = K.form(s, changed);
      var focusOut = h('b');
      var people = K.rows({
        id: 'cp-people', noun: 'person', list: function () { return s.people; }, changed: changed,
        blank: function () { return { name: '', leave: '0', oncall: '0', alloc: '100' }; },
        cols: [
          { key: 'name', label: 'Name', ph: 'Asha', size: '1.6fr' },
          { key: 'leave', label: 'Days off', type: 'number', size: '.9fr' },
          { key: 'oncall', label: 'On-call days', type: 'number', size: '.9fr' },
          { key: 'alloc', label: '% on this team', type: 'number', size: '.9fr' }
        ]
      });
      var checks = K.checksCard('capacity', 'No warnings. Plan to the forecast below.', function (x) {
        K.focus(x.row !== undefined ? K.cell('cp-people', x.row, 'leave') : U.$('#' + x.field));
      });
      var result = h('div'), table = h('div');
      var output = K.outputCard({ id: 'cp-output', title: 'For Sprint Planning',
        prompt: function (text) { return 'I am a lead engineer. Here is the capacity note I will share at Sprint Planning. Make it short and clear for the Product Owner, and tell me what they are likely to push back on.\n\n' + text; } });

      root.appendChild(h('div', { class: 'tool-layout' },
        h('div', { class: 'card st-form' },
          K.samples([['cp-sample', 'Load an example', function () { load(sample()); }]], 'cp-clear', function () { load(K.clone(EMPTY)); }),
          h('div', { class: 'field-row three' },
            K.field('cp-days', 'Sprint length', 'Working days', f.input('sprintDays', { id: 'cp-days', inputmode: 'numeric' })),
            K.field('cp-holidays', 'Public holidays', 'Inside this sprint', f.input('holidays', { id: 'cp-holidays', inputmode: 'numeric' })),
            K.field('cp-oncall', 'An on-call day is worth', 'of a normal day', f.select('oncall', [['0', 'nothing'], ['0.5', 'half a day'], ['1', 'a full day']], { id: 'cp-oncall' }))),
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'The team this sprint'), people.el),
          h('div', { class: 'field-row' },
            K.field('cp-velocity', 'Velocity of the last 3 sprints', 'Points done (not planned), most recent last', f.input('velocity', { id: 'cp-velocity', placeholder: '31, 28, 35' })),
            K.field('cp-usual', 'A normal sprint, in person-days', 'Optional: leave empty to use the team with no leave or holidays', f.input('usual', { id: 'cp-usual', inputmode: 'decimal' }))),
          h('div', { class: 'field' }, h('label', { for: 'cp-focus' }, 'Focus factor: ', focusOut),
            f.input('focus', { id: 'cp-focus', type: 'range', min: '0.4', max: '1', step: '0.05', class: 'range' }),
            h('small', { class: 'faint' }, 'Only for teams that plan in days or hours of work: velocity already includes it'))),
        h('div', { class: 'st-side' }, checks.el, h('div', { class: 'card' }, h('h2', null, 'This sprint'), result), output.el)));
      root.appendChild(h('div', { class: 'card', style: { marginTop: '20px' } }, h('h2', null, 'Person by person'), table));

      function load(next) { K.replace(s, next); f.fill(); people.draw(); changed(); }

      function stat(id, value, label) { return h('div', { class: 'stat' }, h('b', { id: id }, value), h('span', null, label)); }

      function changed() {
        U.store.set('tool.capacity', s);
        var r = compute(s);
        focusOut.textContent = pct(r.focus);
        checks.show(check(s));
        result.innerHTML = '';
        result.appendChild(h('div', { class: 'cp-stats' },
          stat('cp-avail', P.fixed(r.avail), 'person-days this sprint'),
          stat('cp-normal', P.fixed(r.normal), 'in a normal sprint'),
          stat('cp-ratio', r.normal ? pct(r.ratio) : '-', 'of normal'),
          stat('cp-focused', P.fixed(r.focused), 'focused days of work'),
          stat('cp-forecast', round(r.forecast), 'points forecast'),
          stat('cp-range', isFinite(r.low) ? round(r.low) + ' to ' + round(r.high) : '-', 'points, the range')));
        table.innerHTML = '';
        table.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'table', id: 'cp-table' },
          h('thead', null, h('tr', null, ['Person', 'Days here', 'On call', 'Share', 'Person-days'].map(function (x) { return h('th', null, x); }))),
          h('tbody', null, r.people.map(function (x) {
            return h('tr', null, h('td', null, x.name), h('td', null, String(x.here)), h('td', null, String(x.oncall)), h('td', null, pct(x.share)), h('td', null, P.fixed(x.avail)));
          })))));
        output.set(message(s, r));
      }

      f.fill();
      changed();
    }
  };
})(window.LELT);
