/*
 * tools/crisp.js - the crisp reply checker (#/tools/crisp).
 *
 * Paste a reply you are about to send to your manager. Two kinds of findings:
 *   - wording: AI-sounding and padded phrases, marked in the text (data/lint-rules.js, "crisp" set);
 *   - shape: the answer not first, too long, headings, too many bullets, dashes, emoji, no date for a
 *     "when" question, no yes or no for a yes-or-no question (data/tool-checks.js, "crisp").
 * It then writes a "make it crisp" prompt to paste back into Claude. The draft is kept in
 * "clt.tool.crisp".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit;
  var ID = 'crisp';
  var WORD_LIMIT = 60, SENTENCE_LIMIT = 30, BULLET_LIMIT = 5;

  var KINDS = [['status', 'Status: "Is it on track?"'], ['when', 'When: "When will it be ready?"'], ['yesno', 'Yes or no'],
    ['why', 'Why: "Why did it break?"'], ['other', 'Something else']];
  var EMPTY = { question: '', kind: 'status', text: '' };

  var SAMPLES = {
    weak: { question: 'When will saved search be ready?', kind: 'when', text: [
      'Great question! Here\'s a quick breakdown of where we are with saved search.',
      '',
      '## Current status',
      'Let me delve into the details. We have built a robust and seamless backend, and the team has been leveraging our existing search infrastructure. ' +
        'It\'s worth noting that the UI still has a few remaining items to wrap up. Overall, things are moving in the right direction and we are in a good position.',
      '',
      '## Next steps',
      '- Finish the UI',
      '- Write tests',
      '- Fix any remaining issues',
      '',
      'I hope this helps! Let me know if you have any other questions.'].join('\n') },
    strong: { question: 'When will saved search be ready?', kind: 'when',
      text: 'Not this week: saved search will be ready Tue 27 Oct. The backend is done; the UI needs 3 more days. It depends on the QA environment being back by Mon 26 Oct.' }
  };

  // openers that push the answer out of the first line
  var PREAMBLE = /^(?:(?:great|good|excellent) question|thanks? (?:for (?:asking|the question)|you)|(?:certainly|absolutely|of course|sure)\b|so,|well,|here(?:'|’)?s\b|here is\b|let me\b|to answer\b|i (?:looked|checked|went|dug)\b|based on\b|as (?:requested|discussed|you asked)\b|in response to\b)/i;
  var YESNO = /^(?:yes|no|not|nope|mostly|partly|partially|both|neither|it depends)\b/i;
  var BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/;
  var HEADING = /^\s*(?:#{1,6}\s+\S|\*\*[^*\n]+\*\*:?\s*$)/;
  var EMOJI = /\p{Extended_Pictographic}/u;

  function wordCount(t) { return String(t || '').split(/\s+/).filter(function (w) { return /[A-Za-z0-9]/.test(w); }).length; }
  function sentences(t) {
    return String(t || '').split(/(?<=[.!?])\s+|\n+/).map(function (s) { return s.replace(BULLET, '').trim(); })
      .filter(function (s) { return /[A-Za-z0-9]/.test(s); });
  }
  function lines(t) { return String(t || '').split('\n'); }

  /** The numbers the screen shows. */
  function compute(st) {
    var ss = sentences(st.text);
    return {
      words: wordCount(st.text),
      sentences: ss.length,
      longest: ss.reduce(function (m, s) { return Math.max(m, wordCount(s)); }, 0),
      bullets: lines(st.text).filter(function (l) { return BULLET.test(l); }).length,
      dashes: (String(st.text || '').match(/[—–]/g) || []).length,
      phrases: U.lint.find(st.text, (U.data.lintRules || {}).crisp || []).length
    };
  }

  var RULES = ['preamble', 'too-long', 'long-sentence', 'headings', 'many-bullets', 'dashes', 'emoji', 'when-no-date', 'yesno-not-first'];

  /** The shape checks, as [{rule}]. An empty reply has nothing to check. */
  function check(st) {
    var text = String(st.text || '').trim();
    if (!text) return [];
    var c = compute(st), out = [];
    var first = (sentences(text)[0] || '').trim();
    function add(rule) { out.push({ rule: rule }); }
    if (PREAMBLE.test(first)) add('preamble');
    if (c.words > WORD_LIMIT) add('too-long');
    if (c.longest > SENTENCE_LIMIT) add('long-sentence');
    if (lines(text).some(function (l) { return HEADING.test(l); })) add('headings');
    if (c.bullets > BULLET_LIMIT) add('many-bullets');
    if (c.dashes >= 2) add('dashes');
    if (EMOJI.test(text)) add('emoji');
    if (st.kind === 'when' && !U.lint.hasDate(text)) add('when-no-date');
    if (st.kind === 'yesno' && !YESNO.test(first)) add('yesno-not-first');
    return out;
  }

  /** The prompt to paste back into Claude. */
  function prompt(st) {
    var hits = U.lint.find(st.text, (U.data.lintRules || {}).crisp || []);
    var phrases = [];
    hits.forEach(function (x) { var p = '"' + x.text + '"'; if (phrases.indexOf(p) < 0) phrases.push(p); });
    var rules = (U.data.toolChecks || {}).crisp || [];
    var shape = check(st).map(function (f) {
      var r = rules.filter(function (x) { return x.id === f.rule; })[0];
      return r ? '- ' + r.msg + ' ' + r.fix : null;
    }).filter(Boolean);
    return [
      'Rewrite this reply so I can paste it into Slack or Teams for my manager.',
      '',
      'Their question: ' + (String(st.question || '').trim() || '(not given)'),
      '',
      'The reply must: answer first; at most 3 sentences and ' + WORD_LIMIT + ' words; plain words; no preamble, sign-off, headings, bullet points or emoji.' +
        (st.kind === 'when' ? ' It needs a date or a range, and what it depends on.' : '') +
        (st.kind === 'yesno' ? ' It starts with yes, no, mostly or not yet.' : '') +
        ' Use only the facts in my draft; if a fact the answer needs is missing, ask me for it instead of inventing it.',
      phrases.length ? '\nRemove these phrases: ' + phrases.join(', ') + '.' : '',
      shape.length ? '\nAlso fix:\n' + shape.join('\n') : '',
      '',
      'My draft:',
      String(st.text || '').trim()
    ].filter(function (x, i, all) { return x !== '' || (all[i - 1] !== ''); }).join('\n');
  }

  var tool = U.tools[ID] = { EMPTY: EMPTY, rules: RULES, check: check, compute: compute, prompt: prompt, state: null };

  tool.render = function (root) {
    var st = tool.state = K.load(ID, EMPTY);
    var form = K.form(st, changed);

    var question = form.input('question', { id: 'cr-question', placeholder: 'Their question, as they wrote it' });
    var kind = form.select('kind', KINDS, { id: 'cr-kind' });
    var text = form.textarea('text', { id: 'cr-text', rows: 12, placeholder: 'Paste the reply you are about to send…' });

    var marked = h('div', { class: 'st-check-out cr-marked', id: 'cr-marked' });
    var lintList = h('ul', { class: 'st-findings', id: 'cr-lint' });
    var stats = h('div', { class: 'cr-stats', id: 'cr-stats' });
    var checks = K.checksCard(ID, 'The shape is right: answer first, short, plain.', function () { K.focus(text); });
    var output = K.outputCard({ id: 'cr-output', title: 'Make it crisp: the prompt', copyId: 'cr-copy',
      note: 'Paste this into Claude, or use /crisp with the question next time.' });

    root.appendChild(h('div', { class: 'tool-layout' },
      h('div', { class: 'card' },
        K.samples([['cr-sample-weak', 'Example: a long AI reply', function () { load(SAMPLES.weak); }],
          ['cr-sample-strong', 'Example: a crisp reply', function () { load(SAMPLES.strong); }]], 'cr-clear', function () { load(EMPTY); }),
        h('div', { class: 'field-row' },
          K.field('cr-question', 'Their question', null, question),
          K.field('cr-kind', 'Kind of question', null, kind)),
        K.field('cr-text', 'The reply', 'Claude\'s draft or yours. Nothing leaves this browser.', text),
        h('h2', null, 'Your reply, marked'),
        marked),
      h('div', { class: 'st-side' },
        h('div', { class: 'card' }, h('h2', null, 'Size'), stats),
        checks.el,
        h('div', { class: 'card' }, h('h2', null, 'Wording'), lintList),
        output.el)));

    function load(next) {
      K.replace(st, next);
      form.fill();
      changed();
    }

    function stat(key, value, label, bad) {
      return h('div', { class: 'stat' + (bad ? ' stat-bad' : ''), 'data-stat': key }, h('b', null, String(value)), h('span', null, label));
    }

    function changed() {
      U.store.set('tool.' + ID, st);
      var rules = (U.data.lintRules || {}).crisp || [];
      var hits = U.lint.find(st.text, rules);
      marked.innerHTML = st.text ? U.lint.highlight(st.text, hits) : '<span class="faint">Your reply appears here with the phrases to fix marked.</span>';
      var c = compute(st);
      stats.innerHTML = '';
      stats.appendChild(stat('words', c.words, 'words (aim: ' + WORD_LIMIT + ' or fewer)', c.words > WORD_LIMIT));
      stats.appendChild(stat('sentences', c.sentences, 'sentences (aim: 3)', c.sentences > 3));
      stats.appendChild(stat('longest', c.longest, 'words in the longest sentence', c.longest > SENTENCE_LIMIT));
      stats.appendChild(stat('phrases', c.phrases, 'phrases to fix', c.phrases > 0));
      checks.show(check(st));
      lintList.innerHTML = '';
      var seen = {};
      hits.forEach(function (x) {
        if (seen[x.rule.id]) return;
        seen[x.rule.id] = true;
        lintList.appendChild(h('li', { 'data-rule': x.rule.id },
          h('mark', { class: 'lint-mark' }, x.text), ' ', h('span', null, x.rule.msg), h('span', { class: 'st-fix' }, x.rule.fix)));
      });
      if (!hits.length) lintList.appendChild(h('li', { class: 'st-ok' }, st.text ? '✓ No AI-sounding or padded phrases.' : 'Nothing to check yet.'));
      output.set(st.text.trim() ? prompt(st) : '');
    }
    form.fill();
    changed();
  };
})(window.CLT);
