/*
 * tools/reply.js - the manager reply builder (#/tools/reply).
 *
 * Fill in the answer, why, how sure you are, what it depends on, any risk and your ask. The builder
 * writes them in that order as one short paragraph to paste into Slack or Teams, and keeps the
 * details for "if they ask more" out of the message. The draft is kept in "clt.tool.reply".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit;
  var ID = 'reply';
  var ANSWER_LIMIT = 30;

  var KINDS = [['status', 'Status: "Is it on track?"'], ['when', 'When: "When will it be ready?"'], ['yesno', 'Yes or no'],
    ['why', 'Why: "Why did it break?"'], ['other', 'Something else']];
  var CONFIDENCE = [['high', 'Sure'], ['medium', 'Fairly sure'], ['low', 'Not sure yet']];
  var EMPTY = { question: '', kind: 'status', answer: '', why: '', confidence: 'high', depends: '', risk: '', ask: '', more: '' };

  var SAMPLES = {
    weak: { question: 'Is search on track?', kind: 'status',
      answer: 'We are making good progress and it is almost done, hopefully we should be in a good position to wrap things up soon once the remaining items are taken care of by the team',
      why: '', confidence: 'low', depends: '', risk: 'some issues with QA', ask: '', more: '' },
    strong: { question: 'Is search on track for Friday?', kind: 'status',
      answer: 'Not for Friday; Tue 27 Oct is realistic', why: 'the UI needs 3 more days', confidence: 'medium',
      depends: 'the QA environment being back by Mon 26 Oct', risk: '', ask: 'Can we move the demo to Tuesday?',
      more: 'Backend: done and on staging\nUI: 3 of 5 screens done\nTests: written for the API, UI tests next' }
  };

  // words that make an answer sound unsure or busy without saying when
  var VAGUE = /\b(?:soon|shortly|almost (?:done|there|ready|finished)|nearly (?:done|there|ready)|in progress|hopefully|should be (?:done|fine|ready|ok)|asap|any ?time now|(?:some|a few|minor) (?:issues|problems)|working on it|looking into it)\b/i;

  function trim(s) { return String(s || '').trim(); }
  function words(s) { return trim(s).split(/\s+/).filter(Boolean).length; }
  function sentence(s) { s = trim(s); return s && !/[.!?]$/.test(s) ? s + '.' : s; }
  function bare(s) { return trim(s).replace(/[.!?]+$/, ''); }

  /** The message to send: answer (and why), what it depends on, the risk, the ask. */
  function message(st) {
    var parts = [];
    if (trim(st.answer)) parts.push(bare(st.answer) + (trim(st.why) ? '; ' + bare(st.why) : '') + '.');
    if (trim(st.depends)) parts.push((st.confidence === 'low' ? 'I am not sure yet: it depends on ' : 'It depends on ') + bare(st.depends) + '.');
    else if (st.confidence === 'low') parts.push('I am not sure yet.');
    if (trim(st.risk)) parts.push('Risk: ' + bare(st.risk) + '.');
    if (trim(st.ask)) parts.push(sentence(st.ask));
    return parts.join(' ');
  }

  /** The notes to keep ready, sent only if they ask. */
  function extra(st) {
    var items = String(st.more || '').split('\n').map(function (l) { return l.replace(/^\s*[-*•]\s*/, '').trim(); }).filter(Boolean);
    return items.length ? 'If they ask more:\n' + items.map(function (l) { return '- ' + l; }).join('\n') : '';
  }

  var RULES = ['no-answer', 'no-date', 'answer-too-long', 'low-no-depends', 'vague-answer', 'risk-no-ask'];

  function check(st) {
    var out = [];
    var said = trim(st.answer) + ' ' + trim(st.why);
    if (!trim(st.answer)) out.push({ rule: 'no-answer', where: 'answer' });
    if ((st.kind === 'when' || st.kind === 'status') && trim(st.answer) && !U.lint.hasDate(said)) out.push({ rule: 'no-date', where: 'answer' });
    if (words(st.answer) > ANSWER_LIMIT) out.push({ rule: 'answer-too-long', where: 'answer' });
    if ((st.confidence === 'low' || st.confidence === 'medium') && !trim(st.depends)) out.push({ rule: 'low-no-depends', where: 'depends' });
    if (VAGUE.test(said) || U.lint.find(said, (U.data.lintRules || {}).crisp || []).length) out.push({ rule: 'vague-answer', where: 'answer' });
    if (trim(st.risk) && !trim(st.ask)) out.push({ rule: 'risk-no-ask', where: 'ask' });
    return out;
  }

  var tool = U.tools[ID] = { EMPTY: EMPTY, rules: RULES, check: check, message: message, extra: extra, state: null };

  tool.render = function (root) {
    var st = tool.state = K.load(ID, EMPTY);
    var form = K.form(st, changed);
    var el = {
      question: form.input('question', { id: 'rp-question', placeholder: 'Is search on track for Friday?' }),
      kind: form.select('kind', KINDS, { id: 'rp-kind' }),
      answer: form.input('answer', { id: 'rp-answer', placeholder: 'Not for Friday; Tue 27 Oct is realistic' }),
      why: form.input('why', { id: 'rp-why', placeholder: 'the UI needs 3 more days' }),
      confidence: form.select('confidence', CONFIDENCE, { id: 'rp-confidence' }),
      depends: form.input('depends', { id: 'rp-depends', placeholder: 'the QA environment being back by Mon 26 Oct' }),
      risk: form.input('risk', { id: 'rp-risk', placeholder: 'optional' }),
      ask: form.input('ask', { id: 'rp-ask', placeholder: 'Can we move the demo to Tuesday?' }),
      more: form.textarea('more', { id: 'rp-more', rows: 4, placeholder: 'One fact per line, for "if they ask more"' })
    };
    var checks = K.checksCard(ID, 'Answer first, with a date, what it depends on and your ask.', function (f) { K.focus(el[f.where]); });
    var output = K.outputCard({ id: 'rp-output', title: 'Your reply', copyId: 'rp-copy', note: 'Read it before you send it: every fact is yours to stand behind.' });
    var extraCard = K.outputCard({ id: 'rp-extra-output', title: 'Keep ready, send only if asked', copyId: 'rp-extra-copy' });

    root.appendChild(h('div', { class: 'tool-layout' },
      h('div', { class: 'card' },
        K.samples([['rp-sample-weak', 'Example: a vague answer', function () { load(SAMPLES.weak); }],
          ['rp-sample-strong', 'Example: a clear answer', function () { load(SAMPLES.strong); }]], 'rp-clear', function () { load(EMPTY); }),
        h('div', { class: 'field-row' },
          K.field('rp-question', 'Their question', null, el.question),
          K.field('rp-kind', 'Kind of question', null, el.kind)),
        K.field('rp-answer', 'The answer, in a few words', 'First words answer the question: yes, no, a date.', el.answer),
        K.field('rp-why', 'Why, in one line', 'Optional.', el.why),
        h('div', { class: 'field-row' },
          K.field('rp-confidence', 'How sure are you?', null, el.confidence),
          K.field('rp-depends', 'It depends on…', 'The one thing that decides it.', el.depends)),
        h('div', { class: 'field-row' },
          K.field('rp-risk', 'Risk', null, el.risk),
          K.field('rp-ask', 'What you need from them', null, el.ask)),
        K.field('rp-more', 'If they ask more', 'Kept out of the message.', el.more)),
      h('div', { class: 'st-side' },
        output.el,
        h('div', { class: 'row' }, h('button', { class: 'btn btn-small', id: 'rp-to-crisp', type: 'button', onclick: function () {
          U.store.set('tool.crisp', { question: st.question, kind: st.kind, text: message(st) });
          U.go('#/tools/crisp');
        } }, 'Check it in the crisp checker →')),
        checks.el,
        extraCard.el)));

    function load(next) {
      K.replace(st, next);
      form.fill();
      changed();
    }
    function changed() {
      U.store.set('tool.' + ID, st);
      output.set(message(st));
      extraCard.set(extra(st));
      checks.show(check(st));
    }
    form.fill();
    changed();
  };
})(window.CLT);
