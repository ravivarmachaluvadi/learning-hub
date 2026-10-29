/*
 * views/tools/feedback.js - the feedback composer (#/tools/feedback).
 *
 * Feedback as Situation, Behaviour and Impact (the Center for Creative Leadership's model), plus the
 * question you ask before you say what you would like, and a day to look at it again. Two kinds:
 * asking for a change, and praise. The words to say come out in the order that works: what happened,
 * its effect, your question, then the request.
 *
 * The "feedback" wording rules (data/lint-rules.js) flag judging words ("careless", "always",
 * "attitude", "you should", "everyone says"); each is marked in "Your words, checked". Other checks
 * (data/tool-checks.js): a missing part, a situation with no "when", a change asked for in public,
 * no question, feedback more than two weeks old, more than one behaviour at once, and someone in the
 * log who only ever hears what to change.
 *
 * Kept in "lelt.tool.feedback": {kind: 'change'|'praise', who, on, where, situation, behaviour,
 * impact, question, request, followup, log: [{who, date, kind, text}]}. The log is about real
 * people: it stays in this browser and the backup file.
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { kind: 'change', who: '', on: '', where: 'private', situation: '', behaviour: '', impact: '', question: '', request: '', followup: '', log: [] };
  var RULES = ['fb-missing', 'fb-no-when', 'fb-judging', 'fb-public', 'fb-no-question', 'fb-stale', 'fb-one-thing', 'fb-log-balance'];
  var LABEL = { who: 'Who', situation: 'Situation', behaviour: 'Behaviour', impact: 'Impact', question: 'Your question', request: 'What you would like' };
  var CHECKED = ['situation', 'behaviour', 'impact', 'question', 'request'];
  var WHERE = [['private', 'In private'], ['written', 'In a private message'], ['public', 'In front of others']];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var KEEP = 200;   // log entries kept
  // words that place a moment in time, beyond the dates and weekdays LELT.lint.hasDate knows
  var WHEN = /\b(?:yesterday|this (?:morning|afternoon|evening)|last (?:night|week|sprint|month|release)|earlier today)\b|#\d+/i;

  function str(v) { return String(v === undefined || v === null ? '' : v).trim(); }
  function lines(t) { return str(t).split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
  function first(name) { return str(name).split(/[\s(]/)[0]; }
  function saysWhen(t) { return U.lint.hasDate(t) || WHEN.test(t); }
  function isChange(s) { return s.kind !== 'praise'; }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  function check(s) {
    var out = [], rules = (U.data.lintRules || {}).feedback || [], today = P.today(s);
    ['who', 'situation', 'behaviour', 'impact'].concat(isChange(s) ? ['request'] : []).forEach(function (k) {
      if (!str(s[k])) out.push({ rule: 'fb-missing', where: LABEL[k], key: k });
    });
    if (str(s.situation) && !saysWhen(s.situation)) out.push({ rule: 'fb-no-when', where: LABEL.situation, key: 'situation' });
    CHECKED.forEach(function (k) {
      if (k === 'question' && !isChange(s)) return;
      U.lint.find(s[k], rules).forEach(function (x) { out.push({ rule: 'fb-judging', where: LABEL[k], key: k, detail: x.text, msg: x.rule.msg, fix: x.rule.fix }); });
    });
    if (isChange(s) && s.where === 'public') out.push({ rule: 'fb-public', where: 'Where', key: 'where' });
    if (isChange(s) && !/\?/.test(str(s.question))) out.push({ rule: 'fb-no-question', where: LABEL.question, key: 'question' });
    var on = P.parseDay(s.on);
    if (on && daysBetween(on, today) > 14) out.push({ rule: 'fb-stale', where: 'When it happened', key: 'on', detail: U.plural(daysBetween(on, today), 'day') + ' ago' });
    if (lines(s.behaviour).length > 1) out.push({ rule: 'fb-one-thing', where: LABEL.behaviour, key: 'behaviour' });
    balance(s.log).forEach(function (b) { if (b.change >= 2 && !b.praise) out.push({ rule: 'fb-log-balance', where: b.who, key: 'log' }); });
    return out;
  }

  /** Praise and changes per person in the log, in the order they first appear. */
  function balance(log) {
    var by = {}, order = [];
    (log || []).forEach(function (e) {
      var w = str(e.who);
      if (!w) return;
      if (!by[w]) { by[w] = { who: w, praise: 0, change: 0, last: '' }; order.push(w); }
      by[w][e.kind === 'praise' ? 'praise' : 'change']++;
      if (str(e.date) > by[w].last) by[w].last = str(e.date);
    });
    return order.map(function (w) { return by[w]; });
  }

  function sentence(t) { t = str(t); if (!t) return ''; t = t.charAt(0).toUpperCase() + t.slice(1); return /[.!?]$/.test(t) ? t : t + '.'; }
  /** "In Tuesday's stand-up" + "you said..." -> "In Tuesday's stand-up, you said...". */
  function moment(s) {
    var sit = str(s.situation).replace(/[.,;:]+$/, ''), beh = lines(s.behaviour).join(' ').replace(/[.]+$/, '');
    if (/^your? /i.test(beh)) beh = beh.charAt(0).toLowerCase() + beh.slice(1);
    return sentence((sit || '[When and where]') + ', ' + (beh || '[what they did]'));
  }
  function quoted(t) { return '"' + t + '"'; }

  /** The words to say, in the order that works. */
  function words(s) {
    var follow = P.parseDay(s.followup), name = first(s.who);
    var impact = sentence(s.impact) || '[The effect, on whom]';
    if (!isChange(s)) {
      var keep = sentence(s.request);
      var say = moment(s) + ' ' + impact + ' Thank you' + (name ? ', ' + name : '') + '.' + (keep ? ' ' + keep : '');
      return ['Say it soon, specifically, and where it helps them: in front of the team, or to their manager.', '',
        quoted(say), '',
        'Written, for the team channel or their manager:',
        quoted('Thank you' + (name ? ', ' + name : '') + ': ' + moment(s).replace(/^In /, 'in ') + ' ' + impact)].join('\n');
    }
    var open = s.where === 'written' ? 'In a private message, start with the facts. Offer a call if they would rather talk.'
      : s.where === 'public' ? 'This asks for a change, so find a private moment first: "Have you got 15 minutes? There is something I would like your view on."'
        : 'In private: "Have you got 15 minutes? There is something I would like your view on."';
    return [open, '',
      '1. What happened', quoted(moment(s)), '',
      '2. The effect', quoted(impact), '',
      '3. Ask, then listen', quoted(str(s.question) || '[A real question about their side]'),
      'Hear the whole answer before you say anything else. Their reason may change what you ask for.', '',
      '4. What you would like', quoted(sentence(s.request) || '[What you would like instead]'), quoted('What do you think? What would help you do that?'), '',
      '5. When to look at it again', quoted(follow ? 'Shall we look at how it is going on ' + P.day(follow) + '?' : 'Shall we look at how it is going in two weeks?')].join('\n');
  }

  function sample(kind) {
    var today = P.today(), on = P.addWorkdays(today, -2), day = DAYS[on.getDay()];
    if (kind === 'praise') {
      return { kind: 'praise', who: 'Asha', on: U.localDate(on), where: 'public', situation: 'In ' + day + '\'s release',
        behaviour: 'the rollback script you wrote let us undo it in two minutes', impact: 'Customers saw no errors, and the team went home on time.',
        question: '', request: 'Keep writing a rollback script for every risky release.', followup: '', log: [] };
    }
    if (kind === 'weak') {
      return { kind: 'change', who: 'Arjun', on: U.localDate(P.addWorkdays(today, -18)), where: 'public', situation: 'In meetings',
        behaviour: 'You are always late and your attitude is unprofessional', impact: 'Everyone says it is annoying.',
        question: '', request: 'You need to be more professional.', followup: '', log: [] };
    }
    return { kind: 'change', who: 'Divya', on: U.localDate(on), where: 'private', situation: 'In ' + day + '\'s stand-up',
      behaviour: 'you said the payment work would be done soon', impact: 'Anil waited two days to start the integration, because he could not plan around it.',
      question: 'What makes it hard to give a date?', request: 'I would like each update to have a date or a range, and an early warning when it moves.',
      followup: U.localDate(P.addWorkdays(today, 8)), log: [] };
  }

  U.tools.feedback = {
    EMPTY: EMPTY, rules: RULES, check: check, words: words, sample: sample, balance: balance,
    compute: function (s) { return { words: words(s), balance: balance(s.log) }; },
    render: function (root) {
      var s = K.load('feedback', EMPTY);
      if (!Array.isArray(s.log)) s.log = [];
      var f = K.form(s, function () { refresh(); });
      var marked = h('div', { class: 'fb-marked', id: 'fb-marked' });
      var checks = K.checksCard('feedback', 'Specific, about what they did, with its effect and a real question. Ready to say.', function (x) {
        K.focus(x.key === 'log' ? U.$('#fb-log-summary') : U.$('#fb-' + x.key));
      });
      var out = K.outputCard({ id: 'fb-output', title: 'The words to say', note: 'Read it aloud once. Then say it in your own words; the order matters more than the script.',
        prompt: function (text) {
          return 'I am a lead engineer about to give feedback to someone on my team. Here is what I plan to say. ' +
            'Check that it describes behaviour rather than judging the person, that the impact is concrete, and that I ask for their view before I ask for a change. ' +
            'Suggest a kinder, more direct version, and tell me how they might react and how to respond.\n\n' + text;
        } });
      var questionField = K.field('fb-question', 'Your question', 'Ask before you tell: a real question about their side', f.input('question', { id: 'fb-question', placeholder: 'What makes it hard to give a date?' }));
      var followField = K.field('fb-followup', 'Look at it again on', 'Optional: a day to check how it is going', f.input('followup', { id: 'fb-followup', type: 'date' }));
      var requestLabel = h('label', { for: 'fb-request' }, LABEL.request);
      var requestHint = h('small', { class: 'faint' });
      var summary = h('tbody');
      var logList = h('ul', { class: 'fb-log', id: 'fb-log' });

      root.appendChild(h('div', { class: 'tool-layout' },
        h('div', { class: 'card st-form' },
          K.samples([['fb-sample-change', 'Load a change', function () { load(sample('change')); }], ['fb-sample-praise', 'Load a praise', function () { load(sample('praise')); }],
            ['fb-sample-weak', 'Load a judging draft', function () { load(sample('weak')); }]], 'fb-clear', function () { load(K.clone(EMPTY)); }),
          h('div', { class: 'field-row' },
            K.field('fb-kind', 'What kind', null, f.select('kind', [['change', 'Ask for a change'], ['praise', 'Praise something they did']], { id: 'fb-kind' })),
            K.field('fb-who', 'Who', null, f.input('who', { id: 'fb-who', placeholder: 'Divya' }))),
          h('div', { class: 'field-row' },
            K.field('fb-on', 'When it happened', 'Feedback works best within a few days', f.input('on', { id: 'fb-on', type: 'date' })),
            K.field('fb-where', 'Where you will say it', 'A 1:1 or a quiet chat; in front of others means a stand-up, a meeting or the team channel', f.select('where', WHERE, { id: 'fb-where' }))),
          K.field('fb-situation', 'Situation: when and where', 'One moment: "In Tuesday\'s stand-up", "On PR #412"', f.input('situation', { id: 'fb-situation', placeholder: 'In Tuesday\'s stand-up' })),
          K.field('fb-behaviour', 'Behaviour: what they did or said', 'What a camera would have seen. One thing.', f.textarea('behaviour', { id: 'fb-behaviour', rows: 2, placeholder: 'you said the payment work would be done soon' })),
          K.field('fb-impact', 'Impact: the effect, on whom', 'On the work, the customer, the team', f.textarea('impact', { id: 'fb-impact', rows: 2, placeholder: 'Anil waited two days to start the integration.' })),
          questionField,
          h('div', { class: 'field' }, requestLabel, f.textarea('request', { id: 'fb-request', rows: 2, placeholder: 'I would like each update to have a date or a range.' }), requestHint),
          followField),
        h('div', { class: 'st-side' },
          checks.el,
          h('div', { class: 'card' }, h('h2', null, 'Your words, checked'), h('p', { class: 'faint', style: { marginTop: 0 } }, 'Judging words are marked; Checks says what is wrong with each and what to say instead.'), marked),
          out.el)));

      root.appendChild(h('div', { class: 'card fb-log-card' },
        h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'Your feedback log'), h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small btn-primary', id: 'fb-log-add', type: 'button', onclick: addToLog }, 'Add this to the log')),
        h('p', { class: 'muted' }, 'A line for each piece of feedback you give, so you can see who hears only what to change, and who you have not praised in a while. It stays in this browser.'),
        h('div', { class: 'table-wrap' }, h('table', { class: 'table fb-log-summary', id: 'fb-log-summary' },
          h('thead', null, h('tr', null, ['Person', 'Praise', 'Changes', 'Last'].map(function (x) { return h('th', null, x); }))), summary)),
        logList));
      root.appendChild(guide());

      function load(next) { var log = s.log; K.replace(s, next); s.log = log; f.fill(); refresh(); }

      function addToLog() {
        if (!str(s.who)) { U.toast('Fill in who the feedback is for first'); K.focus(U.$('#fb-who')); return; }
        s.log.unshift({ who: str(s.who), date: P.parseDay(s.on) ? s.on : U.localDate(P.today()), kind: isChange(s) ? 'change' : 'praise',
          text: (lines(s.behaviour).join(' ') || str(s.situation)).slice(0, 120) });
        s.log = s.log.slice(0, KEEP);
        refresh();
        U.toast('Added to your feedback log');
      }

      function drawLog() {
        summary.innerHTML = '';
        var b = balance(s.log);
        if (!b.length) summary.appendChild(h('tr', null, h('td', { colspan: 4, class: 'faint' }, 'Nothing logged yet.')));
        b.forEach(function (x) {
          summary.appendChild(h('tr', { 'data-who': x.who }, h('td', null, x.who), h('td', { class: 'fb-praise' }, String(x.praise)),
            h('td', { class: 'fb-change' }, String(x.change)), h('td', null, x.last ? P.day(P.parseDay(x.last)) || x.last : '-')));
        });
        logList.innerHTML = '';
        s.log.forEach(function (e, i) {
          logList.appendChild(h('li', null,
            h('span', { class: 'badge ' + (e.kind === 'praise' ? 'badge-ok' : 'badge-warn') }, e.kind === 'praise' ? 'Praise' : 'Change'),
            ' ', h('b', null, e.who), h('span', { class: 'faint' }, ' · ' + (P.day(P.parseDay(e.date)) || e.date)), ' ', h('span', null, e.text),
            h('button', { class: 'btn btn-small btn-ghost fb-log-del', type: 'button', 'aria-label': 'Delete this entry', onclick: function () {
              s.log.splice(i, 1);
              refresh();
            } }, '✕')));
        });
      }

      function drawMarked() {
        var rules = (U.data.lintRules || {}).feedback || [];
        marked.innerHTML = '';
        CHECKED.forEach(function (k) {
          if (k === 'question' && !isChange(s)) return;
          var t = str(s[k]);
          if (!t) return;
          marked.appendChild(h('p', { class: 'fb-line', 'data-key': k }, h('span', { class: 'ph-label' }, LABEL[k]), h('span', { html: U.lint.highlight(t, U.lint.find(t, rules)).replace(/\n/g, '<br>') })));
        });
        if (!marked.children.length) marked.appendChild(h('p', { class: 'faint' }, 'Your words appear here as you type.'));
      }

      function refresh() {
        U.store.set('tool.feedback', s);
        var change = isChange(s);
        questionField.hidden = !change;
        followField.hidden = !change;
        requestLabel.textContent = change ? 'What you would like instead' : 'What to keep doing (optional)';
        requestHint.textContent = change ? 'One visible action they can take, starting tomorrow' : 'Tells them what to repeat';
        checks.show(check(s));
        drawMarked();
        out.set(words(s));
        drawLog();
      }

      f.fill();
      refresh();
    }
  };

  function guide() {
    return U.section('How to give feedback that lands', h('div', { html: U.md([
      '1. **Soon and in private.** Within a few days, while you both remember. Praise can be public; a change never is.',
      '2. **One moment, one behaviour, its effect.** "In Tuesday\'s stand-up you said soon, and Anil waited two days" can\'t be argued with. "You\'re always vague" can.',
      '3. **Ask before you tell.** "What makes it hard to give a date?" The reason is often fear or an unclear task, and it changes what you ask for.',
      '4. **Ask for one thing they can do tomorrow**, and agree a day to look at it again.',
      '5. **Praise specifically and often.** People who only hear what to change stop listening.',
      '',
      'More in [[lesson:feedback-sbi]]; practise it in [[scenario:vague-updater]] and [[scenario:harsh-reviewer]].'
    ].join('\n')) }), false);
  }
})(window.LELT);
