/*
 * views/tools/rfc.js - the design doc (RFC) builder (#/tools/rfc).
 *
 * The header (title, author, reviewers, who decides and by when, status) and the sections in
 * data/docs.js: the problem, goals, non-goals, quality requirements (rows of a quality and a target),
 * the proposed design, alternatives (rows: what is good and bad about each), risks, rollout and
 * rollback, open questions. The document always has every required section under its heading.
 * It also writes the review request: who decides, on which day, and comments two working days
 * before that.
 *
 * Checks (data/tool-checks.js): a missing section, no decider or no date, fewer than two
 * alternatives, an alternative with no downside, a quality target with no number, vague goals or
 * targets (the "prd" wording rules in data/lint-rules.js), and a rollout with no way back.
 * Kept in "lelt.tool.rfc".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { title: '', author: '', reviewers: '', decider: '', decideBy: '', status: 'draft', problem: '', goals: '', nonGoals: '',
    nfrs: [], proposal: '', alternatives: [], risks: '', rollout: '', questions: '' };
  var RULES = ['rfc-missing', 'rfc-no-decider', 'rfc-alternatives', 'rfc-alt-downside', 'rfc-nfr-number', 'rfc-vague', 'rfc-no-rollback'];
  var QUALITIES = [['latency', 'Speed'], ['throughput', 'Load'], ['availability', 'Availability'], ['data', 'Data'],
    ['security', 'Security'], ['cost', 'Cost'], ['other', 'Other']];
  var STATUS = [['draft', 'Draft'], ['review', 'In review'], ['accepted', 'Accepted'], ['rejected', 'Rejected']];
  // a rollout that can be undone says how: a rollback, a flag, the old path kept
  var BACK = /\broll(?:s|ed|ing)?[- ]?back\b|\brevert\b|\bfeature[- ]flags?\b|\bflag (?:off|on)\b|\btoggle\b|\bkill[- ]switch\b|\bswitch(?:ing)? (?:it|the flag|them) off\b|\bundo\b|\bold (?:path|form|version|flow) (?:stays|kept|running)\b|\bfall ?back\b/i;

  function str(v) { return String(v === undefined || v === null ? '' : v).trim(); }
  function lines(t) { return str(t).split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
  function bullets(t) { return lines(t).map(function (x) { return '- ' + x; }).join('\n'); }
  function label(list, v) { var x = list.filter(function (o) { return o[0] === v; })[0]; return x ? x[1] : v; }
  function firstName(n) { return str(n).split(/[\s(,]/)[0]; }
  function names(list) { return list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1]; }
  function nfrsOf(s) { return (s.nfrs || []).filter(function (n) { return str(n.target); }); }
  function altsOf(s) { return (s.alternatives || []).filter(function (a) { return str(a.name); }); }

  /** The text of each section, keyed as in data/docs.js. */
  function bodies(s) {
    return {
      problem: str(s.problem), goals: bullets(s.goals), nonGoals: bullets(s.nonGoals),
      nfrs: nfrsOf(s).map(function (n) { return '- ' + label(QUALITIES, n.quality || 'other') + ': ' + str(n.target); }).join('\n'),
      proposal: str(s.proposal),
      alternatives: altsOf(s).map(function (a, i) {
        return [(i + 1) + '. ' + str(a.name)].concat(str(a.good) ? ['   Good: ' + str(a.good)] : [], str(a.bad) ? ['   Bad: ' + str(a.bad)] : []).join('\n');
      }).join('\n'),
      risks: bullets(s.risks), rollout: str(s.rollout), questions: bullets(s.questions)
    };
  }

  function compute(s) {
    var by = P.parseDay(s.decideBy);
    return { bodies: bodies(s), decideBy: by ? U.localDate(by) : null, commentsBy: by ? U.localDate(P.addWorkdays(by, -2)) : null,
      alternatives: altsOf(s).length, nfrs: nfrsOf(s).length };
  }

  function check(s) {
    var b = bodies(s), out = [], prd = (U.data.lintRules || {}).prd || [];
    if (!str(s.title)) out.push({ rule: 'rfc-missing', where: 'Title', key: 'title' });
    out = out.concat(K.docMissing('rfc', b, 'rfc-missing'));
    if (!str(s.decider)) out.push({ rule: 'rfc-no-decider', where: 'Who decides', key: 'decider' });
    else if (!P.parseDay(s.decideBy)) out.push({ rule: 'rfc-no-decider', where: 'Decision by', key: 'decideBy' });
    var alts = altsOf(s);
    if (alts.length < 2) out.push({ rule: 'rfc-alternatives', where: 'Alternatives', key: 'alternatives' });
    alts.forEach(function (a) { if (!str(a.bad)) out.push({ rule: 'rfc-alt-downside', where: str(a.name), key: 'alternatives' }); });
    nfrsOf(s).forEach(function (n) {
      if (!/\d/.test(n.target)) out.push({ rule: 'rfc-nfr-number', where: label(QUALITIES, n.quality || 'other'), key: 'nfrs' });
    });
    lines(s.goals).forEach(function (g) {
      U.lint.find(g, prd).forEach(function (x) { out.push({ rule: 'rfc-vague', where: 'Goals', key: 'goals', detail: x.text, msg: x.rule.msg, fix: x.rule.fix }); });
    });
    nfrsOf(s).forEach(function (n) {
      U.lint.find(n.target, prd).forEach(function (x) { out.push({ rule: 'rfc-vague', where: label(QUALITIES, n.quality || 'other'), key: 'nfrs', detail: x.text, msg: x.rule.msg, fix: x.rule.fix }); });
    });
    if (str(s.rollout) && !BACK.test(s.rollout)) out.push({ rule: 'rfc-no-rollback', where: 'Rollout and rollback', key: 'rollout' });
    return out;
  }

  /** The design doc, in Markdown. */
  function compose(s) {
    var by = P.parseDay(s.decideBy), rev = lines(s.reviewers);
    var head = ['Author: ' + (str(s.author) || '[You]'), 'Reviewers: ' + (rev.length ? rev.join(', ') : '[Who reviews it]'),
      'Decider: ' + (str(s.decider) || '[Who decides]'), 'Decision by: ' + (by ? P.day(by) : '[A day]'), 'Status: ' + label(STATUS, s.status || 'draft')];
    return ['# RFC: ' + (str(s.title) || '[Title]'), '', head.join(' · '), '', K.docText('rfc', bodies(s))].join('\n');
  }

  /** The message asking for a review, with the decider, the decision day and a "comments by" day. */
  function request(s) {
    var r = compute(s), title = str(s.title) || '[the design]', rev = lines(s.reviewers).map(firstName).filter(Boolean);
    var by = r.decideBy ? P.day(P.parseDay(r.decideBy)) : '[a day]', comments = r.commentsBy ? P.day(P.parseDay(r.commentsBy)) : '[two days before]';
    var problem = lines(s.problem)[0] || '';
    var qs = lines(s.questions);
    var out = ['Subject: Design review: ' + title + ', decision by ' + by, '', 'Hi ' + (rev.length ? names(rev) : '[reviewers]') + ',', '',
      'Please review the design doc for ' + title + '.' + (problem ? ' The problem it solves: ' + problem.charAt(0).toLowerCase() + problem.slice(1) : ''),
      '', (str(s.decider) || '[Who decides]') + ' decides on ' + by + '. Please add your comments in the doc by ' + comments +
        ', so there is time to answer them. If anything needs a conversation, I will set up 30 minutes before the decision.'];
    if (qs.length) { out.push('', 'Where I most need your view:'); qs.forEach(function (q) { out.push('- ' + q); }); }
    else out.push('', 'I would most like your view on the alternatives, the risks and the rollout plan.');
    out.push('', 'Thank you!');
    return out.join('\n');
  }

  function sample() {
    var today = P.today();
    return {
      title: 'Saved cards at checkout', author: 'You (lead engineer, Checkout)', reviewers: 'Kiran (Platform lead)\nDeepa (Security)\nNeha (Product Owner)',
      decider: 'Neha', decideBy: U.localDate(P.addWorkdays(today, 8)), status: 'review',
      problem: 'Returning customers type their card details on every order. 38% of our orders come from returning customers, and 12% of them abandon the payment step, against 7% for UPI payments.',
      goals: 'Returning customers pay with a saved card in two taps.\nPayment-step drop-off for returning customers falls from 12% to under 8% by 31 Jan.',
      nonGoals: 'Saving UPI IDs or wallets.\nA screen to manage cards beyond deleting one.\nCustomers who check out as guests.',
      nfrs: [
        { quality: 'latency', target: 'The saved-cards list loads in under 300 ms for 95% of requests at 200 requests a second.' },
        { quality: 'availability', target: 'If the card service is down, checkout still works: 99.9% of checkouts succeed each month.' },
        { quality: 'security', target: 'We store only the payment provider\'s tokens and the last 4 digits; no card number ever reaches our servers (RBI card-on-file rules).' },
        { quality: 'data', target: 'A deleted card disappears from the customer\'s phone and web account within 1 minute.' }
      ],
      proposal: 'The checkout service asks the payment provider to tokenise the card when the customer ticks "Save this card". We keep the token, the last 4 digits, the card brand and the expiry month in a new saved_cards table that only the checkout service reads.\n' +
        'At checkout, the app shows saved cards first; paying sends the token and the CVV to the provider. Deleting a card deletes our row and asks the provider to delete the token.',
      alternatives: [
        { name: 'Do nothing', good: 'No work and no new risk.', bad: 'Drop-off stays at 12%, about 900 lost orders a week.' },
        { name: 'Build our own card vault', good: 'No fee per token.', bad: 'RBI rules no longer let merchants store card numbers; it would also mean a PCI DSS audit and months of work.' },
        { name: 'The provider\'s hosted checkout page', good: 'The least work: two weeks.', bad: 'Customers leave our app for a redirect, and we lose control of the payment screen.' }
      ],
      risks: 'Some cards cannot be tokenised: those customers enter the card as they do today.\nThe provider charges for each token: Finance has approved the cost for up to 2 lakh tokens.\nA second database table to keep consistent with the provider: a nightly job compares the two.',
      rollout: 'Behind a feature flag: staff first, then 10% of returning customers for a week, then everyone.\nWe watch payment success and drop-off on the checkout dashboard at each step.\nRoll back by switching the flag off; the old card form stays in the app until 31 Jan.',
      questions: 'Do we ask for the CVV on saved cards every time? (Neha, with the provider)\nHow long do we keep a token for a card that has not been used? (Deepa)'
    };
  }

  function kebab(k) { return k.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); }); }
  function sec(key) { return ((U.data.docSections || {}).rfc || []).filter(function (x) { return x.key === key; })[0] || { title: key, ph: '' }; }

  U.tools.rfc = {
    EMPTY: EMPTY, rules: RULES, check: check, compute: compute, compose: compose, request: request, sample: sample,
    render: function (root) {
      var s = K.load('rfc', EMPTY);
      ['nfrs', 'alternatives'].forEach(function (k) { if (!Array.isArray(s[k])) s[k] = []; });
      var f = K.form(s, function () { refresh(); });
      function changed() { refresh(); }
      var nfrs = K.rows({
        id: 'rf-nfrs', noun: 'quality target', list: function () { return s.nfrs; }, changed: changed,
        blank: function () { return { quality: 'latency', target: '' }; },
        cols: [
          { key: 'quality', label: 'Quality', type: 'select', options: QUALITIES, size: '1fr' },
          { key: 'target', label: 'Target, with a number', type: 'textarea', rows: 1, ph: 'Under 300 ms for 95% of requests at 200 a second', size: '3fr' }
        ]
      });
      var alts = K.rows({
        id: 'rf-alternatives', noun: 'alternative', list: function () { return s.alternatives; }, changed: changed,
        blank: function () { return { name: '', good: '', bad: '' }; },
        cols: [
          { key: 'name', label: 'Alternative', ph: 'Do nothing' },
          { key: 'good', label: 'Good', type: 'textarea', rows: 1, full: true, ph: 'No work' },
          { key: 'bad', label: 'Bad, or why not', type: 'textarea', rows: 1, full: true, ph: 'Drop-off stays at 12%' }
        ]
      });
      var checks = K.checksCard('rfc', 'Every section is there, with numbers, real alternatives, a way back and someone who decides.', function (x) {
        if (x.key === 'nfrs' || x.key === 'alternatives') K.focus(U.$('#rf-' + x.key + ' input, #rf-' + x.key + ' select') || U.$('#rf-' + x.key + '-add'));
        else K.focus(U.$('#rf-' + kebab(x.key)));
      });
      var doc = K.outputCard({ id: 'rf-output', title: 'The design doc', note: 'Markdown: paste it into Confluence, Google Docs or a pull request.',
        prompt: function (text) {
          return 'I am a lead engineer. Here is a design doc I am about to send for review. Review it as a principal engineer would: ' +
            'what is unclear, which failure modes and quality requirements are missing, whether the alternatives are fair, and whether the rollout can be undone safely. ' +
            'Be specific and short.\n\n' + text;
        } });
      var req = K.outputCard({ id: 'rf-request-output', title: 'The review request', note: 'Send it with the link to the doc.' });

      function area(key, rows, hint) {
        var x = sec(key), id = 'rf-' + kebab(key);
        return K.field(id, x.title, hint || null, f.textarea(key, { id: id, rows: rows || 3, placeholder: x.ph, grow: true }));
      }
      root.appendChild(h('div', { class: 'tool-layout' },
        h('div', { class: 'card st-form' },
          K.samples([['rf-sample', 'Load the example', function () { K.replace(s, sample()); f.fill(); nfrs.draw(); alts.draw(); refresh(); }]],
            'rf-clear', function () { K.replace(s, EMPTY); f.fill(); nfrs.draw(); alts.draw(); refresh(); }),
          K.field('rf-title', 'Title', null, f.input('title', { id: 'rf-title', placeholder: 'Saved cards at checkout' })),
          h('div', { class: 'field-row' },
            K.field('rf-author', 'Author', null, f.input('author', { id: 'rf-author', placeholder: 'You' })),
            K.field('rf-status', 'Status', null, f.select('status', STATUS, { id: 'rf-status' }))),
          K.field('rf-reviewers', 'Reviewers', 'One per line, with their team', f.textarea('reviewers', { id: 'rf-reviewers', rows: 2, placeholder: 'Kiran (Platform lead)', grow: true })),
          h('div', { class: 'field-row' },
            K.field('rf-decider', 'Who decides', 'One person', f.input('decider', { id: 'rf-decider', placeholder: 'Neha' })),
            K.field('rf-decide-by', 'Decision by', null, f.input('decideBy', { id: 'rf-decide-by', type: 'date' }))),
          area('problem', 3), area('goals', 3, 'One per line'), area('nonGoals', 2, 'One per line'),
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, sec('nfrs').title), nfrs.el,
            h('small', { class: 'faint' }, 'Speed, load, availability, security, data and cost: each target needs a number someone can test.')),
          area('proposal', 5),
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, sec('alternatives').title), alts.el,
            h('small', { class: 'faint' }, 'At least two, one of them "Do nothing". Each with why you turned it down.')),
          area('risks', 3, 'One per line'), area('rollout', 3, 'The steps to users, and how to undo it in minutes'), area('questions', 2, 'Optional, one per line, with who can answer')),
        h('div', { class: 'st-side' }, checks.el, doc.el, req.el)));
      root.appendChild(K.docParts('rfc', 'rf-parts'));
      root.appendChild(guide());

      function refresh() {
        U.store.set('tool.rfc', s);
        checks.show(check(s));
        doc.set(compose(s));
        req.set(request(s));
      }
      f.fill();
      refresh();
    }
  };

  function guide() {
    return U.section('How to get a design reviewed and decided', h('div', { html: U.md([
      '1. **Write it before you build**, when changing your mind costs a document, not a sprint. One to five pages is plenty for most changes.',
      '2. **Start with the problem and the goals**, so reviewers judge the design against the need, not against their taste.',
      '3. **Put numbers on the quality requirements.** "Fast" and "scalable" cannot be designed for; "p95 under 300 ms at 200 requests a second" can.',
      '4. **Show the alternatives fairly**, including doing nothing. A reviewer who sees their idea considered argues less and helps more.',
      '5. **Name one decider and a date**, and ask for comments two days before it. Then decide: disagree and commit beats six weeks in review.',
      '6. **Record the decision** in a [[tool:adr|decision record]] the same day.',
      '',
      'More in [[lesson:rfcs-and-adrs]], [[lesson:design-reviews]] and [[lesson:nfrs-tradeoffs]]; practise it in [[scenario:rfc-stuck-in-review]] and [[scenario:make-it-scalable]].'
    ].join('\n')) }), false);
  }
})(window.LELT);
