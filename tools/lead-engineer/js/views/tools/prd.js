/*
 * views/tools/prd.js - the PRD question generator (#/tools/prd).
 *
 * Paste a PRD (or a ticket, or a message describing the work). Three kinds of question come out:
 *
 *   vague words    the "prd" rules in data/lint-rules.js ("fast", "all", "etc.", "intuitive"...).
 *                  One question per rule and sentence, numbered as they appear in the marked copy;
 *                  each can be left out, and can carry your own proposal ("95% under 300 ms?"),
 *                  because a proposal is easier to answer than an open question.
 *   the bank       questions every PRD should answer (data/prd.js), marked "not found in the PRD"
 *                  when nothing in the text seems to answer them; you tick the ones to ask.
 *   your own       typed in, each in a group.
 *
 * The message groups them all (data/prd.js, prdGroups) and adapts its ask to how many there are.
 * Checks: no PRD, nobody to send to, no reply date, and three gaps (no problem statement, no
 * success measure, nothing out of scope), each tied to its bank question. The draft is kept in
 * "lelt.tool.prd".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { feature: '', pm: '', replyBy: '', estimateBy: '', text: '', skip: {}, proposals: {}, bank: {}, own: [] };
  var RULES = ['prd-no-text', 'prd-no-pm', 'prd-no-reply-by']
    .concat((U.data.prdBank || []).filter(function (b) { return b.rule; }).map(function (b) { return b.rule; }));

  var WEAK = [
    'Customer refunds: PRD (draft 2)',
    '',
    'Customers should be able to request a refund from the app, just like Amazon.',
    'The refund flow must be intuitive and fast, and work on all devices.',
    'Support all payment methods: cards, UPI, wallets etc.',
    'Notify the customer at every step.',
    'Refund status should be shown in real-time.',
    'Fraud checks must be smart, and refund limits should be configurable by the business.',
    'Payment gateway failures must be handled gracefully.',
    'The system must be scalable for the festive sale and highly available.',
    'Customer bank details must be secure.',
    'Ideally, agents can also refund part of an order.',
    'Approval rules for large refunds: TBD.',
    'Refunds should take minimal time to reach the customer.'
  ].join('\n');

  var STRONG = [
    'Customer refunds in the app: PRD (v3)',
    '',
    'Problem: today, customers who want a refund must call support. Support takes about 1,200 refund calls a week, and customers wait 2 days on average for an answer.',
    'Success: refund calls to support drop from 1,200 to under 400 a week by 31 January.',
    'Users: customers with an order delivered in the last 30 days (about 40,000 a week), and support agents who approve large refunds.',
    'First release: whole-order refunds to the original payment method, for cards, UPI and wallets (3 payment methods).',
    'Out of scope for the first release: partial refunds, refunds to a different account, and cash-on-delivery orders.',
    'Approvals: refunds above 10,000 rupees need a support agent\'s approval; only agents with the Refund Approver role can approve.',
    'Messages: we send an SMS and an email within 5 minutes of each status change; the text is in appendix B.',
    'Speed: 95% of refund requests are confirmed on screen within 2 seconds at 50 requests a second.',
    'Status: the refund status on screen is at most 1 minute old.',
    'Failures: if the payment gateway does not answer in 10 seconds, the customer sees "Refund requested; we will confirm by SMS", and we retry 3 times over 30 minutes. Duplicate requests for the same order are ignored.',
    'Availability: the refund service is up 99.9% of each month; when it is down, the app shows the support number.',
    'Data: card numbers are never stored (PCI DSS), and customer data follows the DPDP Act 2023. Refunds already in progress stay in the existing support tool; there is no migration.',
    'Design: the screens follow Figma design v3; in a test, 4 of 5 customers request a refund without help.',
    'Rollout: 10% of customers from Mon 7 Dec, and everyone from Mon 14 Dec if the error rate stays under 1%. Neha decides.',
    'Support: the support team gets a runbook and a 30-minute training session before the rollout.',
    'Analytics: we record refund requested, approved, paid and failed events on the existing dashboard.',
    'Launch: live for everyone by Mon 14 Dec, before the year-end sale.'
  ].join('\n');

  function sample(strong) {
    var today = P.today();
    function wd(n) { return U.localDate(P.addWorkdays(today, n)); }
    return { feature: 'Customer refunds', pm: 'Neha (Product Manager)', replyBy: wd(3), estimateBy: wd(4),
      text: strong ? STRONG : WEAK, skip: {}, proposals: {}, bank: {}, own: [] };
  }

  /** The text's sentences, with where each starts and ends: split at line ends and at . ! ? before a space. */
  function sentences(text) {
    var out = [], from = 0, re = /\n|[.!?](?=\s|$)/g, m;
    while ((m = re.exec(text))) {
      var to = m[0] === '\n' ? m.index : m.index + 1;
      if (text.slice(from, to).trim()) out.push({ start: from, end: to, text: text.slice(from, to).trim() });
      from = m.index + 1;
    }
    if (text.slice(from).trim()) out.push({ start: from, end: text.length, text: text.slice(from).trim() });
    return out;
  }

  /** Up to about 30 characters either side of the vague words, cut at word boundaries, without the full stop. */
  function quote(sen, x) {
    var t = sen.text.replace(/[.!?]+$/, '');
    if (t.length <= 70) return t;
    var at = Math.max(0, t.toLowerCase().indexOf(x.text.toLowerCase()));
    var from = at > 30 ? t.lastIndexOf(' ', at - 30) + 1 : 0;
    var to = at + x.text.length + 30 < t.length ? t.indexOf(' ', at + x.text.length + 30) : -1;
    if (to < 0) to = t.length;
    return (from > 0 ? '…' : '') + t.slice(from, to).replace(/[,;:]$/, '') + (to < t.length ? '…' : '');
  }

  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function first(name) { return String(name || '').trim().split(/[\s(]/)[0]; }

  function compute(s) {
    var text = String(s.text || ''), rules = (U.data.lintRules || {}).prd || [];
    var sens = sentences(text), hits = U.lint.find(text, rules), qs = [], byKey = {};
    hits.forEach(function (x) {
      var sen = sens.filter(function (z) { return x.start >= z.start && x.start < z.end; })[0] || { text: x.text };
      var sentence = sen.text.toLowerCase().replace(/\s+/g, ' '), key = x.rule.id + '|' + sentence;
      var q = byKey[key];
      if (!q) {
        q = byKey[key] = { key: key, rule: x.rule.id, group: x.rule.group, sentence: sentence, ask: x.rule.ask, why: x.rule.msg, example: x.rule.good,
          quote: quote(sen, x), words: [] };
        qs.push(q);
      }
      if (q.words.indexOf(x.text) < 0) q.words.push(x.text);
      x.q = q;
    });
    qs.forEach(function (q, i) {
      q.n = i + 1;
      q.on = !(s.skip || {})[q.key];
      q.proposal = String((s.proposals || {})[q.key] || '').trim();
    });
    var bank = (U.data.prdBank || []).map(function (b) {
      return { id: b.id, group: b.group, ask: b.ask, rule: b.rule, covered: !!text.trim() && new RegExp(b.look, 'i').test(text), on: !!(s.bank || {})[b.id] };
    });
    var groupIds = (U.data.prdGroups || []).map(function (g) { return g.id; });
    var own = (s.own || []).filter(function (o) { return String(o.q || '').trim(); }).map(function (o) {
      return { q: o.q.trim(), group: groupIds.indexOf(o.group) >= 0 ? o.group : groupIds[groupIds.length - 1] };
    });
    var groups = (U.data.prdGroups || []).map(function (g) {
      // in the message, questions about the same sentence in the same group ("all… etc.") are one item, quoted once
      var items = [], bySentence = {};
      qs.forEach(function (q) {
        if (!q.on || q.group !== g.id) return;
        var it = bySentence[q.sentence];
        if (it) {
          it.text += ' ' + q.ask;
          if (q.proposal) it.proposal = it.proposal ? it.proposal + '; ' + q.proposal : q.proposal;
          return;
        }
        items.push(bySentence[q.sentence] = { text: '"' + q.quote + '": ' + lower(q.ask), proposal: q.proposal });
      });
      bank.forEach(function (b) { if (b.on && b.group === g.id) items.push({ text: b.ask }); });
      own.forEach(function (o) { if (o.group === g.id) items.push({ text: o.q }); });
      return { id: g.id, title: g.title, items: items };
    }).filter(function (g) { return g.items.length; });
    var total = groups.reduce(function (n, g) { return n + g.items.length; }, 0);
    return { hits: hits, questions: qs, bank: bank, groups: groups, total: total };
  }

  function check(s) {
    var out = [], text = String(s.text || '');
    if (!text.trim()) out.push({ rule: 'prd-no-text', where: 'PRD', key: 'text' });
    if (!String(s.pm || '').trim()) out.push({ rule: 'prd-no-pm', where: 'Send to', key: 'pm' });
    if (!P.parseDay(s.replyBy)) out.push({ rule: 'prd-no-reply-by', where: 'Answers needed by', key: 'replyBy' });
    if (text.trim()) {
      (U.data.prdBank || []).forEach(function (b) {
        if (b.rule && !new RegExp(b.look, 'i').test(text)) out.push({ rule: b.rule, where: 'PRD', key: 'bank', bank: b.id });
      });
    }
    return out;
  }

  /** The message to the Product Manager: grouped, numbered, with an ask that fits how many questions there are. */
  function message(s, r) {
    var name = first(s.pm), feature = String(s.feature || '').trim() || 'this', reply = P.parseDay(s.replyBy), est = P.parseDay(s.estimateBy);
    var when = reply ? P.day(reply) : '[a date]';
    var out = ['Hi' + (name ? ' ' + name : '') + ',', ''];
    if (!r.total) {
      out.push('I read the PRD for ' + feature + ' and have no questions that block the estimate. ' +
        (est ? 'I\'ll send it by ' + P.day(est) + '.' : 'I\'ll start on the estimate now.'), '', 'Thanks!');
      return out.join('\n');
    }
    var proposals = r.questions.some(function (q) { return q.on && q.proposal; });
    out.push('To estimate ' + feature + ' properly and build exactly what you need, I have ' + U.plural(r.total, 'question') + ' in ' +
      U.plural(r.groups.length, 'group') + '.' + (proposals ? ' Where I could, I\'ve added a proposal you can accept or change.' : ''));
    out.push(r.total <= 5 ? 'Could you reply here by ' + when + '?' :
      r.total <= 12 ? 'Could we take 20 minutes before ' + when + ', or could you reply in writing by then?' :
        'That is a lot for a chat thread, so could we take 30 minutes before ' + when + '? This list can be the agenda.');
    var n = 0;
    r.groups.forEach(function (g) {
      out.push('', g.title);
      g.items.forEach(function (it) {
        out.push((++n) + '. ' + it.text);
        if (it.proposal) out.push('   Proposal: ' + it.proposal);
      });
    });
    out.push('', est ? 'Once these are answered, I\'ll send the estimate by ' + P.day(est) + '.' : 'Once these are answered, I can give you an estimate you can plan on.',
      '', 'Thanks!');
    return out.join('\n');
  }

  /** The PRD as HTML, each vague phrase marked and numbered like its question. */
  function marked(text, hits) {
    var out = '', at = 0;
    hits.forEach(function (x) {
      out += U.esc(text.slice(at, x.start)) + '<mark class="lint-mark" data-rule="' + U.esc(x.rule.id) + '" title="' + U.esc(x.rule.msg) + '">' +
        U.esc(x.text) + '</mark><sup class="pq-n">' + x.q.n + '</sup>';
      at = x.end;
    });
    return (out + U.esc(text.slice(at))).replace(/\n/g, '<br>');
  }

  /** The quote with its vague words marked. */
  function quoteHtml(q) {
    var html = U.esc(q.quote);
    q.words.forEach(function (w) {
      var re = new RegExp('(' + U.esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i');
      html = html.replace(re, '<mark class="lint-mark">$1</mark>');
    });
    return '"' + html + '"';
  }

  U.tools.prd = {
    EMPTY: EMPTY, rules: RULES, compute: compute, check: check, message: message, sentences: sentences,
    render: function (root) {
      var s = K.load('prd', EMPTY);
      ['skip', 'proposals', 'bank'].forEach(function (k) { if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = {}; });
      if (!Array.isArray(s.own)) s.own = [];
      var lastText = null;
      var f = K.form(s, function () { refresh(); });
      var groupName = {};
      (U.data.prdGroups || []).forEach(function (g) { groupName[g.id] = g.title; });

      var markedBox = h('div', { class: 'st-check-out pq-marked', id: 'pq-marked' });
      var qList = h('ul', { class: 'pq-questions', id: 'pq-questions' });
      var bankList = h('ul', { class: 'pq-bank', id: 'pq-bank' });
      var checks = K.checksCard('prd', 'The PRD says why, how success is measured and what is out of scope, and you know whom to ask and by when.', function (x) {
        if (x.key === 'bank') K.focus(U.$('#pq-bank li[data-bank="' + x.bank + '"] input'));
        else K.focus(U.$({ text: '#pq-text', pm: '#pq-pm', replyBy: '#pq-reply-by' }[x.key]));
      });
      var own = K.rows({
        id: 'pq-own', noun: 'question', list: function () { return s.own; }, changed: function () { refresh(); },
        blank: function () { return { q: '', group: 'decisions' }; },
        cols: [
          { key: 'q', label: 'Question', ph: 'Do refunds above 50,000 rupees need a second approval?', size: '3fr' },
          { key: 'group', label: 'Group', type: 'select', options: (U.data.prdGroups || []).map(function (g) { return [g.id, g.title]; }), size: '1.6fr' }
        ]
      });
      var out = K.outputCard({ id: 'pq-output', title: 'The message',
        note: 'Change the wording to sound like you, then send it. Questions asked early are part of the work, not a favour.',
        prompt: function (text) {
          return 'I am a lead engineer. These are my clarifying questions about a PRD, for the Product Manager. Make them shorter and easier to answer: ' +
            'keep the groups and the proposals, turn open questions into proposals with numbers where you can, and make sure nothing sounds like an apology or a complaint.\n\n' +
            text + '\n\nThe PRD:\n' + (s.text || '');
        } });

      root.appendChild(h('div', { class: 'tool-stack' },
        h('div', { class: 'card st-form' },
          K.samples([['pq-sample-weak', 'Load a vague PRD', function () { load(sample(false)); }], ['pq-sample-strong', 'Load a clear PRD', function () { load(sample(true)); }]],
            'pq-clear', function () { load(K.clone(EMPTY)); }),
          h('div', { class: 'field-row' },
            K.field('pq-feature', 'What is it for?', null, f.input('feature', { id: 'pq-feature', placeholder: 'Customer refunds' })),
            K.field('pq-pm', 'Send the questions to', 'Usually the Product Manager', f.input('pm', { id: 'pq-pm', placeholder: 'Neha (Product Manager)' }))),
          h('div', { class: 'field-row' },
            K.field('pq-reply-by', 'Answers needed by', null, f.input('replyBy', { id: 'pq-reply-by', type: 'date' })),
            K.field('pq-estimate-by', 'Your estimate is due', 'Optional', f.input('estimateBy', { id: 'pq-estimate-by', type: 'date' }))),
          K.field('pq-text', 'The PRD', 'Paste the PRD, the ticket or the message', f.textarea('text', { id: 'pq-text', rows: 12, placeholder: 'Search should be fast and support all filters…' }))),
        h('div', { class: 'tool-pair' },
          checks.el,
          h('div', { class: 'card' }, h('h2', null, 'The PRD, marked'),
            h('p', { class: 'faint', style: { marginTop: 0 } }, 'Each number is a question below, which says what is vague about the marked words.'), markedBox)),
        h('div', { class: 'card' }, h('h2', null, 'Questions from the vague words'),
          h('p', { class: 'muted' }, 'One question for each vague phrase in each sentence. Untick any that the PRD answers elsewhere. ' +
            'Add a proposal where you can: "Would 95% under 300 ms work?" is answered in a minute; "How fast?" can take a day.'),
          qList),
        h('div', { class: 'card' },
          h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'Questions every PRD should answer'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small', id: 'pq-bank-missing', type: 'button', onclick: function () {
              compute(s).bank.forEach(function (b) { if (!b.covered) s.bank[b.id] = true; });
              drawBank(compute(s));
              refresh();
            } }, 'Add every question the PRD does not answer')),
          h('p', { class: 'muted' }, 'Tick the ones to ask. Once a PRD is pasted, each question says whether anything in the text seems to answer it; read the PRD again before you ask.'),
          bankList),
        h('div', { class: 'card st-form' }, h('h2', null, 'Your own questions'), own.el),
        out.el));
      root.appendChild(guide());

      function load(next) { K.replace(s, next); f.fill(); own.draw(); lastText = null; fit(); refresh(); }
      /** Show the whole PRD when one is loaded, up to 24 lines (typing doesn't resize it). */
      function fit() {
        var box = U.$('#pq-text');
        if (box) box.rows = Math.max(8, Math.min(24, String(s.text || '').split('\n').length + 1));
      }

      function drawQuestions(r) {
        qList.innerHTML = '';
        if (!r.questions.length) {
          qList.appendChild(h('li', { class: 'st-ok pq-none' }, String(s.text || '').trim() ? '✓ No vague words found.' : 'Paste a PRD above to see its questions.'));
          return;
        }
        r.questions.forEach(function (q) {
          var inc = h('input', { type: 'checkbox', class: 'pq-include', 'aria-label': 'Ask question ' + q.n });
          inc.checked = q.on;
          inc.addEventListener('change', function () { if (inc.checked) delete s.skip[q.key]; else s.skip[q.key] = true; li.classList.toggle('off', !inc.checked); refresh(); });
          var prop = h('input', { class: 'input pq-proposal', 'aria-label': 'Your proposal for question ' + q.n, placeholder: 'Your proposal (optional)' });
          prop.value = s.proposals[q.key] || '';
          prop.addEventListener('input', function () { if (prop.value.trim()) s.proposals[q.key] = prop.value; else delete s.proposals[q.key]; refresh(); });
          var li = h('li', { class: 'pq-q' + (q.on ? '' : ' off'), 'data-rule': q.rule, 'data-key': q.key, 'data-n': q.n },
            h('div', { class: 'pq-q-head' },
              h('label', { class: 'pq-inc' }, inc, ' Ask'),
              h('span', { class: 'badge pq-num' }, String(q.n)),
              h('span', { class: 'badge' }, groupName[q.group] ? groupName[q.group].split(':')[0].split(',')[0] : q.group)),
            h('p', { class: 'pq-quote', html: quoteHtml(q) }),
            h('p', { class: 'pq-ask' }, q.ask),
            h('small', { class: 'pq-why' }, q.why),
            prop,
            // the example goes under the box, not in its placeholder, where a phone would cut it off
            h('small', { class: 'pq-eg' }, 'For example: ' + q.example));
          qList.appendChild(li);
        });
      }

      function drawBank(r) {
        var pasted = !!String(s.text || '').trim();   // with no PRD yet, every question would say "not found": say nothing
        bankList.innerHTML = '';
        r.bank.forEach(function (b) {
          var box = h('input', { type: 'checkbox', class: 'pq-bank-pick', 'aria-label': 'Ask: ' + b.ask });
          box.checked = b.on;
          box.addEventListener('change', function () { if (box.checked) s.bank[b.id] = true; else delete s.bank[b.id]; refresh(); });
          bankList.appendChild(h('li', { 'data-bank': b.id },
            h('label', { class: 'pb-check' }, box, h('span', null, b.ask)),
            !pasted ? null : b.covered ? h('span', { class: 'badge badge-ok pq-found' }, 'The PRD seems to cover this') :
              h('span', { class: 'badge badge-warn pq-missing' }, 'Not found in the PRD')));
        });
      }

      function refresh() {
        U.store.set('tool.prd', s);
        var r = compute(s);
        checks.show(check(s));
        if (s.text !== lastText) {
          lastText = s.text;
          markedBox.innerHTML = String(s.text || '').trim() ? marked(String(s.text), r.hits) : '<span class="faint">The marked copy appears here.</span>';
          drawQuestions(r);
          drawBank(r);
        }
        out.set(message(s, r));
      }

      f.fill();
      fit();
      refresh();
    }
  };

  /** How to ask: a short guide under the tool. */
  function guide() {
    return U.section('How to ask so that people answer', h('div', { html: U.md([
      '1. **Ask early, in one go.** Questions on day one are cheap; the same questions in week three cost a rebuild. A grouped list respects the PM\'s time more than seven separate pings.',
      '2. **Say why you are asking.** "To estimate it properly and build exactly what you need" makes questions part of the work.',
      '3. **Propose, don\'t just ask.** "Would 95% under 300 ms at peak work?" gets a yes or a number. "How fast?" gets "you know, fast".',
      '4. **Never apologise for a good question.** "Sorry, this might be silly" tells people to take it lightly.',
      '5. **Write the answers down** the same day, with the open questions, their owners and dates. That summary becomes the agreed scope.',
      '',
      'More in [[lesson:clarifying-questions]] and [[lesson:requirements-prd]]; practise it in [[scenario:vague-prd]].'
    ].join('\n')) }), false);
  }
})(window.LELT);
