/*
 * views/tools/status.js - the status update builder (#/tools/status).
 *
 * You fill in the parts of a good update: the status (Green, Amber, Red), the target date and how
 * sure you are, a bottom line first, what is done, what comes next (each with a date), blockers (each
 * with who you need and by when), and what you need from the reader. As you type, two kinds of check
 * run:
 *
 *   wording    the "status" rules in data/lint-rules.js: "in progress", "almost done", "soon"...
 *   structure  checks in this file: a Green status with a blocker (a "watermelon"), a next step with
 *              no date, a blocker with nobody named, Amber or Red with no ask, no bottom line...
 *
 * The update is written out for chat (Slack, Teams) or email, ready to copy. The draft is kept in
 * "lelt.tool.status". A second box checks a message you have already written.
 */
(function (U) {
  'use strict';
  var h = U.h;

  var EMPTY = { project: '', rag: '', target: '', confidence: 'high', bluf: '', done: '', next: '', blockers: [], ask: '', format: 'chat' };

  var SAMPLES = {
    weak: {
      project: 'Payment refunds', rag: 'green', target: 'next week', confidence: 'high', bluf: '',
      done: 'Refund API - working on it, almost done',
      next: 'Refund UI - in progress\nTesting will start soon',
      blockers: [{ what: 'Waiting for the platform team to expose the refund endpoint', who: '', when: '' }],
      ask: 'Will update ASAP.', format: 'chat'
    },
    strong: {
      project: 'Payment refunds', rag: 'amber', target: 'Fri 20 Nov', confidence: 'medium',
      bluf: 'Refunds can ship Fri 20 Nov if the Platform team exposes the refund endpoint by Wed 11 Nov; without it, the date moves to Fri 27 Nov.',
      done: 'Refund rules agreed with Finance (Mon 9 Nov)\nRefund API merged and deployed to staging (PR #412)',
      next: 'Refund screen ready for review: Thu 12 Nov\nEnd-to-end tests with the real endpoint: Tue 17 Nov\nRelease to production: Fri 20 Nov',
      blockers: [{ what: 'The refund endpoint on the Platform side has not started', who: 'Kiran (Platform lead)', when: 'Wed 11 Nov' }],
      ask: 'Can you raise the refund endpoint with the Platform manager by Tue 10 Nov? A 10-minute call is enough.', format: 'chat'
    }
  };

  var RAG = [
    { id: 'green', label: 'Green', what: 'The date holds without help from anyone.' },
    { id: 'amber', label: 'Amber', what: 'At risk: the date holds only if something specific happens.' },
    { id: 'red', label: 'Red', what: 'The date will be missed unless someone decides or helps.' }
  ];
  var FIELD = { project: 'Subject', rag: 'Status', target: 'Target date', bluf: 'Bottom line', done: 'Done', next: 'Next', blocker: 'Blocker', ask: 'Need from you' };

  function lines(text) { return String(text || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean); }

  /** Every warning for a draft: [{rule, field, msg, fix, text?}] - wording first, then structure. */
  function check(d) {
    var rules = (U.data.lintRules || {}).status || [];
    var out = [];
    function wording(field, text, label) {
      U.lint.find(text, rules).forEach(function (x) {
        out.push({ rule: x.rule.id, field: field, label: label || FIELD[field], msg: x.rule.msg, fix: x.rule.fix + ' For example: "' + x.rule.good + '"', text: x.text });
      });
    }
    function structure(rule, field, msg, fix, label) { out.push({ rule: rule, field: field, label: label || FIELD[field], msg: msg, fix: fix }); }

    wording('target', d.target);
    wording('bluf', d.bluf);
    wording('done', d.done);
    wording('next', d.next);
    d.blockers.forEach(function (b, i) { wording('blocker', b.what, 'Blocker ' + (i + 1)); });
    wording('ask', d.ask);

    var blockers = d.blockers.filter(function (b) { return b.what.trim(); });
    if (!d.rag) structure('no-rag', 'rag', 'No status chosen.', 'Pick Green, Amber or Red. The colour is the first thing a busy reader looks for.');
    if (!d.target.trim() || !U.lint.hasDate(d.target)) {
      structure('no-target-date', 'target', 'The target has no date that anyone can plan on.', 'Write a day: "Fri 20 Nov". If you are unsure, give a range and say so with the confidence.');
    }
    if (!d.bluf.trim()) {
      structure('no-bluf', 'bluf', 'No bottom line.', 'Start with one sentence a busy reader can stop after: the date, the status, and what it depends on.');
    }
    if (!lines(d.done).length) {
      structure('no-done', 'done', 'Nothing under Done.', 'Even one small step counts. If nothing moved, say why; silence reads as "stuck".');
    }
    lines(d.next).forEach(function (ln, i) {
      if (!U.lint.hasDate(ln)) {
        structure('next-no-date', 'next', 'Next, line ' + (i + 1) + ' has no date: "' + ln + '".', 'Add when it will happen: "Refund screen ready for review: Thu 12 Nov".');
      }
    });
    if (!lines(d.next).length) structure('no-next', 'next', 'Nothing under Next.', 'Say what happens next and when, so the reader knows when to expect news.');
    d.blockers.forEach(function (b, i) {
      if (!b.what.trim()) return;
      if (!b.who.trim()) structure('blocker-no-who', 'blocker', 'Nobody is named for blocker ' + (i + 1) + '.', 'Name the person or team you need. "Waiting for the platform team" is easy to ignore; "Kiran (Platform lead)" is not.', 'Blocker ' + (i + 1));
      if (!b.when.trim() || !U.lint.hasDate(b.when)) structure('blocker-no-when', 'blocker', 'Blocker ' + (i + 1) + ' has no "needed by" date.', 'Say the last day it can arrive without moving your date. That date is what makes it urgent for them.', 'Blocker ' + (i + 1));
    });
    if (d.rag === 'green' && blockers.length) {
      structure('watermelon', 'rag', 'Green with a blocker is a "watermelon": green outside, red inside.', 'If the blocker can move the date, say Amber now. A surprise later costs far more trust than an early Amber.');
    }
    if (d.rag === 'green' && d.confidence === 'low') {
      structure('low-confidence-green', 'rag', 'Green with low confidence does not add up.', 'If you are not sure of the date, it is Amber. Say what would make you sure.');
    }
    if ((d.rag === 'amber' || d.rag === 'red') && !d.ask.trim()) {
      structure('amber-no-ask', 'ask', 'Amber or Red, but no ask.', 'Say the decision or help that would turn it Green, and from whom. Without an ask, Amber is just a worry.');
    }
    return out;
  }

  /** The update written out for chat or email. */
  function write(d) {
    var rag = (RAG.filter(function (r) { return r.id === d.rag; })[0] || { label: '(no status)' }).label.toUpperCase();
    var subject = (d.project.trim() || 'Status update') + ': ' + rag + (d.target.trim() ? ', target ' + d.target.trim() : '');
    var done = lines(d.done), next = lines(d.next), ask = lines(d.ask);
    var blockers = d.blockers.filter(function (b) { return b.what.trim(); }).map(function (b) {
      var need = [b.who.trim() ? 'needed from ' + b.who.trim() : '', b.when.trim() ? 'by ' + b.when.trim() : ''].filter(Boolean).join(' ');
      return b.what.trim() + (need ? ' (' + need + ')' : '');
    });
    var out = [];
    if (d.format === 'email') {
      out.push('Subject: ' + subject, '', 'Hi,', '');
      if (d.bluf.trim()) out.push(d.bluf.trim(), '');
      out.push('Status: ' + rag + ' (confidence: ' + d.confidence + ')');
      if (d.target.trim()) out.push('Target date: ' + d.target.trim());
      section('Done', done, '- ');
      section('Next', next, '- ');
      section('Blockers and risks', blockers, '- ');
      section('Need from you', ask, '- ');
      out.push('', 'Thanks,');
    } else {
      out.push('*' + (d.project.trim() || 'Status update') + ': ' + rag + '*' + (d.target.trim() ? ' · target ' + d.target.trim() : '') + ' · confidence: ' + d.confidence);
      if (d.bluf.trim()) out.push(d.bluf.trim());
      section('Done', done, '• ');
      section('Next', next, '• ');
      section('Blockers and risks', blockers, '• ');
      section('Need from you', ask, '• ');
    }
    return out.join('\n');
    function section(title, items, bullet) {
      if (!items.length) return;
      out.push('', d.format === 'email' ? title + ':' : '*' + title + '*');
      items.forEach(function (x) { out.push(bullet + x); });
    }
  }

  U.tools.status = {
    check: check, write: write,
    render: function (root) {
      var d = Object.assign({}, EMPTY, U.store.get('tool.status', {}));
      d.blockers = (d.blockers || []).map(function (b) { return { what: b.what || '', who: b.who || '', when: b.when || '' }; });

      function field(id, label, hint, el) {
        return h('div', { class: 'field' }, h('label', { for: id }, label), hint ? h('small', { class: 'faint' }, hint) : null, el);
      }
      var project = h('input', { class: 'input', id: 'st-project', placeholder: 'Payment refunds' });
      var target = h('input', { class: 'input', id: 'st-target', placeholder: 'Fri 20 Nov' });
      var confidence = h('select', { class: 'select', id: 'st-confidence' },
        ['high', 'medium', 'low'].map(function (c) { return h('option', { value: c }, c); }));
      var bluf = h('textarea', { class: 'input', id: 'st-bluf', rows: 2, placeholder: 'Ships Fri 20 Nov if the Platform team delivers the endpoint by Wed 11 Nov.' });
      var done = h('textarea', { class: 'input', id: 'st-done', rows: 3, placeholder: 'One item per line' });
      var next = h('textarea', { class: 'input', id: 'st-next', rows: 3, placeholder: 'One item per line, each with a date' });
      var ask = h('textarea', { class: 'input', id: 'st-ask', rows: 2, placeholder: 'The decision or help you need, from whom, by when' });
      var ragBox = h('div', { class: 'rag-choices', role: 'radiogroup', 'aria-label': 'Status' }, RAG.map(function (r) {
        return h('label', { class: 'rag-choice rag-' + r.id },
          h('input', { type: 'radio', name: 'st-rag', value: r.id }), h('b', null, r.label), h('small', null, r.what));
      }));
      var formatBox = h('div', { class: 'row', role: 'radiogroup', 'aria-label': 'Format' },
        h('span', { class: 'faint' }, 'Write it for:'),
        [['chat', 'Chat (Slack, Teams)'], ['email', 'Email']].map(function (f) {
          return h('label', { class: 'radio' }, h('input', { type: 'radio', name: 'st-format', value: f[0] }), ' ' + f[1]);
        }));
      var blockerBox = h('div', { class: 'st-blockers' });
      var addBlocker = h('button', { class: 'btn btn-small', id: 'st-add-blocker', type: 'button', onclick: function () {
        d.blockers.push({ what: '', who: '', when: '' });
        drawBlockers();
        changed();
        var last = U.$$('.st-b-what', blockerBox).pop();
        if (last) last.focus();
      } }, '+ Add a blocker or risk');

      var findingsBox = h('ul', { class: 'st-findings' });
      var okBox = h('div', { class: 'st-ok-box' });
      var output = h('pre', { class: 'st-output', id: 'st-output' });

      var form = h('div', { class: 'card st-form' },
        h('div', { class: 'row st-samples' },
          h('button', { class: 'btn btn-small', id: 'st-sample-weak', type: 'button', onclick: function () { load(SAMPLES.weak); } }, 'Load a weak example'),
          h('button', { class: 'btn btn-small', id: 'st-sample-strong', type: 'button', onclick: function () { load(SAMPLES.strong); } }, 'Load a strong example'),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small btn-ghost', id: 'st-clear', type: 'button', onclick: function () { load(EMPTY); } }, 'Clear')),
        field('st-project', 'What is this update about?', null, project),
        h('fieldset', { class: 'field' }, h('legend', null, 'Status'), ragBox),
        h('div', { class: 'field-row' },
          field('st-target', 'Target date', 'A day, not "next week"', target),
          field('st-confidence', 'How sure are you?', null, confidence)),
        field('st-bluf', 'Bottom line', 'One sentence a busy reader can stop after', bluf),
        field('st-done', 'Done since the last update', null, done),
        field('st-next', 'Next', 'Each line with a date', next),
        h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Blockers and risks'),
          h('small', { class: 'faint' }, 'What is blocked, who you need, and the last day it can arrive'), blockerBox, addBlocker),
        field('st-ask', 'Need from you', 'Required when the status is Amber or Red', ask));

      var side = h('div', { class: 'st-side' },
        h('div', { class: 'card' }, h('h2', null, 'Checks'), okBox, findingsBox),
        h('div', { class: 'card' },
          h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'Your update'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small', id: 'st-claude', type: 'button', onclick: function () {
              U.askClaude('I am a lead engineer. Here is a status update I am about to send to my manager. Make it clearer and shorter without losing any fact. ' +
                'Keep the bottom line first, give every next step a date, and point out anything vague or anything that will make the reader ask a follow-up question.\n\n' + write(d));
            } }, 'Ask Claude'),
            h('button', { class: 'btn btn-small btn-primary', id: 'st-copy', type: 'button', onclick: function () { U.copy(output.textContent); } }, 'Copy')),
          formatBox, output));
      root.appendChild(h('div', { class: 'tool-layout' }, form, side));
      root.appendChild(guide());
      root.appendChild(checker());

      function drawBlockers() {
        blockerBox.innerHTML = '';
        d.blockers.forEach(function (b, i) {
          function inp(cls, key, ph, label) {
            var el = h('input', { class: 'input ' + cls, placeholder: ph, 'aria-label': label + ' (blocker ' + (i + 1) + ')' });
            el.value = b[key];
            el.addEventListener('input', function () { b[key] = el.value; changed(); });
            return el;
          }
          blockerBox.appendChild(h('div', { class: 'st-blocker' },
            inp('st-b-what', 'what', 'What is blocked or at risk', 'What'),
            inp('st-b-who', 'who', 'Needed from (person, team)', 'Needed from'),
            inp('st-b-when', 'when', 'Needed by (a day)', 'Needed by'),
            h('button', { class: 'btn btn-small btn-ghost', type: 'button', 'aria-label': 'Remove blocker ' + (i + 1), onclick: function () {
              d.blockers.splice(i, 1); drawBlockers(); changed();
            } }, '✕')));
        });
      }

      function fill() {
        project.value = d.project; target.value = d.target; confidence.value = d.confidence; bluf.value = d.bluf;
        done.value = d.done; next.value = d.next; ask.value = d.ask;
        U.$$('input[name="st-rag"]', ragBox).forEach(function (r) { r.checked = r.value === d.rag; });
        U.$$('input[name="st-format"]', formatBox).forEach(function (r) { r.checked = r.value === d.format; });
        drawBlockers();
      }

      function load(sample) {
        d = JSON.parse(JSON.stringify(sample));
        fill();
        changed();
      }

      function changed() {
        U.store.set('tool.status', d);
        var found = check(d);
        findingsBox.innerHTML = '';
        okBox.innerHTML = '';
        if (!found.length) {
          okBox.appendChild(h('p', { class: 'st-ok' }, '✓ No warnings. This update says when, how sure you are, and what you need.'));
        } else {
          okBox.appendChild(h('p', { class: 'muted', style: { marginTop: 0 } }, U.plural(found.length, 'thing') + ' to fix before you send it. Click one to go to its field.'));
        }
        found.forEach(function (f) {
          findingsBox.appendChild(h('li', { 'data-rule': f.rule, 'data-field': f.field, tabindex: 0, onclick: function () { focus(f.field); },
            onkeydown: function (e) { if (e.key === 'Enter') focus(f.field); } },
            h('span', { class: 'badge' }, f.label),
            ' ', f.text ? h('mark', { class: 'lint-mark' }, f.text) : null, f.text ? ' ' : null,
            h('span', null, f.msg),
            h('span', { class: 'st-fix' }, f.fix)));
        });
        output.textContent = write(d);
      }

      function focus(field) {
        var el = { project: project, target: target, bluf: bluf, done: done, next: next, ask: ask }[field] ||
          (field === 'blocker' ? U.$('.st-b-what', blockerBox) : U.$('input[name="st-rag"]', ragBox));
        if (el) { el.focus(); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      }

      [[project, 'project'], [target, 'target'], [bluf, 'bluf'], [done, 'done'], [next, 'next'], [ask, 'ask']].forEach(function (p) {
        p[0].addEventListener('input', function () { d[p[1]] = p[0].value; changed(); });
      });
      confidence.addEventListener('change', function () { d.confidence = confidence.value; changed(); });
      ragBox.addEventListener('change', function (e) { d.rag = e.target.value; changed(); });
      formatBox.addEventListener('change', function (e) { d.format = e.target.value; changed(); });

      fill();
      changed();
    }
  };

  /** What makes a good update: the six parts and what the colours mean. */
  function guide() {
    return U.section('What a good status update contains', h('div', { html: U.md([
      '1. **The bottom line first.** One sentence: the date, the status, and what it depends on. Many readers stop here.',
      '2. **A colour that means something.** Green: the date holds without help. Amber: it holds only if something specific happens. Red: it will be missed unless someone decides or helps.',
      '3. **What is done.** Facts that can be checked: "merged", "deployed to staging", "agreed with Finance". Not "working on".',
      '4. **What comes next, with dates.** Each step with a day, so the reader knows when to expect news.',
      '5. **Blockers with names and dates.** Who you need, and the last day it can arrive without moving your date.',
      '6. **The ask.** The decision or help you need from the reader. Amber without an ask is only a worry.'
    ].join('\n')) }), false);
  }

  /** Check a message you have already written: marks each vague phrase and says what to write instead. */
  function checker() {
    var input = h('textarea', { class: 'input', id: 'st-check-input', rows: 4, placeholder: 'Paste a message you are about to send…' });
    var out = h('div', { class: 'st-check-out', id: 'st-check-out' });
    var list = h('ul', { class: 'st-findings', id: 'st-check-findings' });
    function run() {
      var text = input.value;
      var hits = U.lint.find(text, (U.data.lintRules || {}).status || []);
      out.innerHTML = text.trim() ? U.lint.highlight(text, hits).replace(/\n/g, '<br>') : '<span class="faint">The marked copy appears here.</span>';
      list.innerHTML = '';
      hits.forEach(function (x) {
        list.appendChild(h('li', { 'data-rule': x.rule.id }, h('mark', { class: 'lint-mark' }, x.text), ' ', x.rule.msg,
          h('span', { class: 'st-fix' }, x.rule.fix + ' For example: "' + x.rule.good + '"')));
      });
      if (text.trim() && !U.lint.hasDate(text)) {
        list.appendChild(h('li', { 'data-rule': 'no-date' }, 'No date anywhere in this message.',
          h('span', { class: 'st-fix' }, 'A status message without a date makes the reader ask "so when?". Add the day of the next step.')));
      }
      if (text.trim() && !list.children.length) list.appendChild(h('li', { class: 'st-ok' }, '✓ Nothing vague found.'));
    }
    input.addEventListener('input', run);
    run();
    return h('div', { class: 'card st-check' },
      h('h2', null, 'Check a message you already wrote'),
      h('p', { class: 'muted' }, 'Paste any update, email or chat message. Vague phrases are marked, each with a better way to say it.'),
      input, out, list);
  }
})(window.LELT);
