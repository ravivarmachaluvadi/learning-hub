/*
 * views/tools/adr.js - the decision record (ADR) builder (#/tools/adr).
 *
 * Michael Nygard's format (title, status, context, decision, consequences), with the decision
 * drivers and the options considered from MADR: number, title, status, date, deciders, what it
 * supersedes or is superseded by; the sections in data/docs.js. Each option has its good and bad
 * points and a tick for the chosen one.
 *
 * Checks (data/tool-checks.js): a missing part, a decision not in the active voice ("We will…"),
 * only one option, no option chosen or more than one, no bad consequence, and "superseded" with no
 * record named. Kept in "lelt.tool.adr".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { number: '', title: '', date: '', status: 'proposed', deciders: '', supersedes: '', supersededBy: '', context: '', drivers: '',
    options: [], decision: '', good: '', bad: '', revisit: '' };
  var RULES = ['adr-missing', 'adr-not-active', 'adr-one-option', 'adr-chosen', 'adr-no-downside', 'adr-superseded'];
  var STATUS = [['proposed', 'Proposed'], ['accepted', 'Accepted'], ['deprecated', 'Deprecated'], ['superseded', 'Superseded']];
  var ACTIVE = /\bwe(?: will| shall| are going to)\b|\bwe['’]ll\b/i;

  function str(v) { return String(v === undefined || v === null ? '' : v).trim(); }
  function lines(t) { return str(t).split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
  function bullets(t) { return lines(t).map(function (x) { return '- ' + x; }).join('\n'); }
  function label(v) { var x = STATUS.filter(function (o) { return o[0] === v; })[0]; return x ? x[1] : v; }
  function optionsOf(s) { return (s.options || []).filter(function (o) { return str(o.name); }); }
  /** "7" or "ADR-7" -> "ADR-007". */
  function adrId(n) { var m = /\d+/.exec(str(n)); return m ? 'ADR-' + ('00' + (+m[0])).slice(-3) : 'ADR-[Number]'; }

  function bodies(s) {
    var cons = [];
    if (lines(s.good).length) cons.push('Good:\n' + bullets(s.good));
    if (lines(s.bad).length) cons.push('Bad, and accepted:\n' + bullets(s.bad));
    return {
      context: str(s.context), drivers: bullets(s.drivers),
      options: optionsOf(s).map(function (o, i) {
        return [(i + 1) + '. ' + str(o.name) + (o.chosen ? ' (chosen)' : '')].concat(str(o.good) ? ['   Good: ' + str(o.good)] : [], str(o.bad) ? ['   Bad: ' + str(o.bad)] : []).join('\n');
      }).join('\n'),
      decision: str(s.decision), consequences: cons.join('\n\n'), revisit: str(s.revisit)
    };
  }

  function compute(s) {
    var opts = optionsOf(s);
    return { id: adrId(s.number), bodies: bodies(s), options: opts.length, chosen: opts.filter(function (o) { return o.chosen; }).length };
  }

  function check(s) {
    var b = bodies(s), out = [], opts = optionsOf(s), chosen = opts.filter(function (o) { return o.chosen; }).length;
    if (!str(s.title)) out.push({ rule: 'adr-missing', where: 'Title', key: 'title' });
    out = out.concat(K.docMissing('adr', b, 'adr-missing'));
    if (str(s.decision) && !ACTIVE.test(s.decision)) out.push({ rule: 'adr-not-active', where: 'Decision', key: 'decision' });
    if (opts.length === 1) out.push({ rule: 'adr-one-option', where: 'Options', key: 'options' });
    if (opts.length && chosen !== 1) out.push({ rule: 'adr-chosen', where: chosen ? U.plural(chosen, 'option') + ' chosen' : 'None chosen', key: 'options' });
    if (!lines(s.bad).length) out.push({ rule: 'adr-no-downside', where: 'Consequences', key: 'bad' });
    if (s.status === 'superseded' && !str(s.supersededBy)) out.push({ rule: 'adr-superseded', where: 'Superseded by', key: 'supersededBy' });
    return out;
  }

  /** The record, in Markdown. */
  function compose(s) {
    var d = P.parseDay(s.date);
    var head = ['Status: ' + label(s.status || 'proposed'), 'Date: ' + (d ? P.day(d) + ' ' + d.getFullYear() : '[Date]'),
      'Deciders: ' + (str(s.deciders) || '[Who decided]')].join(' · ');
    var links = [];
    if (str(s.supersedes)) links.push('Supersedes: ' + str(s.supersedes));
    if (s.status === 'superseded') links.push('Superseded by: ' + (str(s.supersededBy) || '[The record that replaces it]'));
    return ['# ' + adrId(s.number) + ': ' + (str(s.title) || '[What we decided, in a few words]'), '', head]
      .concat(links, ['', K.docText('adr', bodies(s))]).join('\n');
  }

  function sample() {
    return {
      number: '7', title: 'Publish order events through Kafka', date: U.localDate(P.today()), status: 'accepted',
      deciders: 'Neha (Product Owner), Kiran (Platform lead), you', supersedes: '', supersededBy: '',
      context: 'Inventory, invoicing and notifications each read our orders table every minute to find new and changed orders. Every change to the table needs three other teams to test it, the polling adds about 30% to the database load at the sale peak, and a missed poll during a deployment has twice left invoices unsent.',
      drivers: 'No team reads another team\'s database.\nEvents survive a consumer being down for a day, and can be replayed.\nEvents for one order arrive in order.\nSomeone already runs it for us, or it needs no new infrastructure.',
      options: [
        { name: 'Kafka, run by the platform team', good: 'Replay for 7 days; ordering per order id; already runs for two other teams.', bad: 'New to our team; at-least-once delivery, so consumers must handle duplicates.', chosen: true },
        { name: 'RabbitMQ', good: 'Simpler, and two of us have used it.', bad: 'A message is gone once read, so a consumer that is down misses it; nobody runs it for us.', chosen: false },
        { name: 'Keep polling, with a change-log table', good: 'No new technology.', bad: 'Other teams still depend on our schema, and the load at the peak stays.', chosen: false }
      ],
      decision: 'We will publish OrderPlaced, OrderPaid and OrderCancelled events to the orders topic in Kafka, keyed by order id and kept for 7 days. The other teams move off our table by 31 Mar; then we remove their read access.',
      good: 'Other teams stop reading our database, so we can change our schema without them.\nA consumer that was down can replay what it missed.\nThe database load at the peak drops by about a third.',
      bad: 'Consumers must cope with the same event arriving twice.\nWe have to version the event schemas and keep old versions working.\nThe team needs about two days of Kafka training, and on-call learns a new set of alerts.',
      revisit: 'If the platform team stops supporting Kafka, or if fewer than two teams still read the events a year from now.'
    };
  }

  function kebab(k) { return k.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); }); }
  function sec(key) { return ((U.data.docSections || {}).adr || []).filter(function (x) { return x.key === key; })[0] || { title: key, ph: '' }; }

  U.tools.adr = {
    EMPTY: EMPTY, rules: RULES, check: check, compute: compute, compose: compose, sample: sample,
    render: function (root) {
      var s = K.load('adr', EMPTY);
      if (!Array.isArray(s.options)) s.options = [];
      var f = K.form(s, function () { refresh(); });
      var opts = K.rows({
        id: 'ad-options', noun: 'option', list: function () { return s.options; }, changed: function () { refresh(); },
        blank: function () { return { name: '', good: '', bad: '', chosen: false }; },
        cols: [
          { key: 'name', label: 'Option', ph: 'RabbitMQ', size: '3fr' },
          { key: 'chosen', label: 'Chosen', type: 'check', size: '.7fr' },
          { key: 'good', label: 'Good', type: 'textarea', rows: 1, full: true, ph: 'Simpler, and two of us have used it' },
          { key: 'bad', label: 'Bad', type: 'textarea', rows: 1, full: true, ph: 'A message is gone once read' }
        ]
      });
      var checks = K.checksCard('adr', 'A decision someone who was not there can follow, with the options turned down and the costs accepted.', function (x) {
        K.focus(x.key === 'options' ? (U.$('#ad-options input') || U.$('#ad-options-add')) : U.$('#ad-' + kebab(x.key)));
      });
      var out = K.outputCard({ id: 'ad-output', title: 'The decision record', note: 'Markdown: keep it next to the code in docs/adr/, and link it from the design doc.',
        prompt: function (text) {
          return 'I am a lead engineer. Here is an architecture decision record. Check that someone joining the team in a year could understand why we decided this: ' +
            'is the context clear, are the options fair, are the bad consequences honest, and is it clear when we should revisit it? Suggest what is missing.\n\n' + text;
        } });
      function area(key, rows, hint) {
        var x = sec(key), id = 'ad-' + kebab(key);
        return K.field(id, x.title, hint || null, f.textarea(key, { id: id, rows: rows || 3, placeholder: x.ph, grow: true }));
      }

      root.appendChild(h('div', { class: 'tool-layout' },
        h('div', { class: 'card st-form' },
          K.samples([['ad-sample', 'Load the example', function () { K.replace(s, sample()); f.fill(); opts.draw(); refresh(); }]],
            'ad-clear', function () { K.replace(s, EMPTY); f.fill(); opts.draw(); refresh(); }),
          h('div', { class: 'field-row three' },
            K.field('ad-number', 'Number', null, f.input('number', { id: 'ad-number', inputmode: 'numeric', placeholder: '7' })),
            K.field('ad-status', 'Status', null, f.select('status', STATUS, { id: 'ad-status' })),
            K.field('ad-date', 'Date', null, f.input('date', { id: 'ad-date', type: 'date' }))),
          K.field('ad-title', 'Title', 'The decision in a few words, as a verb: "Use…", "Publish…", "Keep…"', f.input('title', { id: 'ad-title', placeholder: 'Publish order events through Kafka' })),
          K.field('ad-deciders', 'Deciders', null, f.input('deciders', { id: 'ad-deciders', placeholder: 'Neha, Kiran, you' })),
          h('div', { class: 'field-row' },
            K.field('ad-supersedes', 'Supersedes', 'Optional: an older record this replaces', f.input('supersedes', { id: 'ad-supersedes', placeholder: 'ADR-004' })),
            K.field('ad-superseded-by', 'Superseded by', 'Only when the status is Superseded', f.input('supersededBy', { id: 'ad-superseded-by', placeholder: 'ADR-019' }))),
          area('context', 4), area('drivers', 3, 'One per line'),
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, sec('options').title), opts.el,
            h('small', { class: 'faint' }, 'At least two, with the chosen one ticked.')),
          area('decision', 3, 'Start with "We will…"'),
          K.field('ad-good', 'Consequences: good', 'One per line', f.textarea('good', { id: 'ad-good', rows: 3, placeholder: 'Other teams stop reading our database.', grow: true })),
          K.field('ad-bad', 'Consequences: bad, and accepted', 'One per line: what becomes harder or costs more', f.textarea('bad', { id: 'ad-bad', rows: 3, placeholder: 'Consumers must cope with duplicates.', grow: true })),
          area('revisit', 2, 'Optional')),
        h('div', { class: 'st-side' }, checks.el, out.el)));
      root.appendChild(K.docParts('adr', 'ad-parts'));
      root.appendChild(guide());

      function refresh() {
        U.store.set('tool.adr', s);
        checks.show(check(s));
        out.set(compose(s));
      }
      f.fill();
      refresh();
    }
  };

  function guide() {
    return U.section('How to keep decision records that get read', h('div', { html: U.md([
      '1. **One decision, one page.** Write it the day the decision is made, while the reasons are fresh.',
      '2. **Keep them with the code**, numbered, in `docs/adr/`. They are reviewed in a pull request like any change.',
      '3. **Never edit an accepted record.** When the decision changes, write a new one that supersedes it, and link the two.',
      '4. **Write the bad consequences.** The costs you accepted are what the next person most needs to know.',
      '',
      'More in [[lesson:rfcs-and-adrs]]; practise it in [[scenario:why-did-we-choose-kafka]].'
    ].join('\n')) }), false);
  }
})(window.LELT);
