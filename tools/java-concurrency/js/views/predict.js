/*
 * views/predict.js - Predict the output (#/predict): short programs, each built around one trap of concurrent Java; a
 * developer falls into (data/predict.js). A round deals 10: read the program, type what it prints, and
 * Check (Ctrl+Enter), or "I don't know". The answer is marked against the stored output, which
 * tests/test_content.py proves the program prints, so nothing is compiled to mark it and the page works
 * opened from disk. After an answer: your lines beside the real ones (the different lines marked), the
 * guess most people make and why, what really happens, and where it is taught; Run it (through jclearn)
 * and Open in the Playground.
 *
 * Marking (U.predict.mark): line by line. Spaces at the end of a line and empty lines at the end do not
 * count. A line that differs only in its spaces counts as right, with a note that shows the exact output
 * ("[1, 2]", not "[1,2]"). Anything else is wrong.
 *
 * Misses come back, in boxes as the lesson quizzes' (views/quiz.js), kept in "jclt.predict.review" as
 * {id: {box, due}}: a wrong answer -> box 0, due at once; a right answer to a due program -> the next box
 * (a day, then three days), then learned. A round deals the due programs first, then ones never seen
 * ("jclt.predict.seen"), then the rest. The round in progress is "jclt.predict.current" (a reload resumes
 * it); finished rounds go into "jclt.predict.history" (the last 20). ?seed=<n> deals a repeatable round.
 *
 * The mock interview (views/mock.js) asks predictions too, through U.predict.mark, record and result.
 * For the tests: JCLT.predict = {mark, deal, current, record, result}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var ROUND = 10, HISTORY = 20;
  var DAY = 24 * 60 * 60 * 1000;
  var WAIT = [0, DAY, 3 * DAY];
  var LEARNED = WAIT.length;
  var TOPICS = { threads: 'Threads', memory: 'The memory model', locks: 'Locks', interrupts: 'Interruption', executors: 'Executors', futures: 'Futures',
    collections: 'Concurrent collections', synchronizers: 'Synchronizers and atomics', streams: 'Parallel streams', virtual: 'Virtual threads',
    structured: 'Structured concurrency', scoped: 'Scoped values' };

  function all() { return U.data.predictions || []; }
  function review() { return U.store.get('predict.review', {}); }
  function current() { return U.store.get('predict.current', null); }
  function save(c) { U.store.set('predict.current', c); }
  function history() { return U.store.get('predict.history', []); }

  /** The lines of a text, as they are compared: line ends without spaces, no empty lines at the end. */
  function lines(text) {
    var ls = String(text || '').replace(/\r\n?/g, '\n').split('\n').map(function (l) { return l.replace(/\s+$/, ''); });
    while (ls.length && ls[ls.length - 1] === '') ls.pop();
    return ls;
  }
  function squash(s) { return s.replace(/\s+/g, ''); }

  /** Mark an answer against the real output: {right, spacing, yours: [different?], real: [different?]}. */
  function mark(answer, output) {
    var a = lines(answer), o = lines(output);
    var same = a.length === o.length;
    if (same && a.every(function (l, i) { return l === o[i]; })) {
      return { right: true, spacing: false, yours: a.map(function () { return false; }), real: o.map(function () { return false; }) };
    }
    if (same && a.every(function (l, i) { return squash(l) === squash(o[i]); })) {
      return { right: true, spacing: true, yours: a.map(function (l, i) { return l !== o[i]; }), real: o.map(function (l, i) { return l !== a[i]; }) };
    }
    return { right: false, spacing: false,
      yours: a.map(function (l, i) { return i >= o.length || squash(l) !== squash(o[i]); }),
      real: o.map(function (l, i) { return i >= a.length || squash(l) !== squash(a[i]); }) };
  }

  /** Move a program between boxes after an answer (see the top of this file). */
  function record(id, right) {
    var r = review(), s = r[id], now = Date.now();
    var seen = U.store.get('predict.seen', {});
    seen[id] = new Date().toISOString();
    U.store.set('predict.seen', seen);
    if (!right) r[id] = { box: 0, due: now };
    else if (s && s.due <= now) {
      var box = s.box + 1;
      if (box >= LEARNED) delete r[id]; else r[id] = { box: box, due: now + WAIT[box] };
    } else return;
    U.store.set('predict.review', r);
  }

  /** A new round: {seed, deck: [ids], i, results: [{id, right, spacing, answer}]}. Nothing is saved. */
  function deal(o) {
    o = o || {};
    var seed = o.seed || (Date.now() % 2147483647);
    var rand = U.rng(seed), r = review(), seen = U.store.get('predict.seen', {}), now = Date.now();
    var ps = all();
    var due = ps.filter(function (p) { return r[p.id] && r[p.id].due <= now; }).sort(function (a, b) { return r[a.id].due - r[b.id].due; });
    var fresh = U.shuffled(ps.filter(function (p) { return !seen[p.id] && due.indexOf(p) < 0; }), rand);
    var rest = U.shuffled(ps.filter(function (p) { return seen[p.id] && due.indexOf(p) < 0; }), rand);
    var deck = due.concat(fresh, rest).slice(0, o.size || ROUND).map(function (p) { return p.id; });
    return { seed: seed, deck: deck, i: 0, results: [], startedAt: Date.now() };
  }

  function codeLines(cls, ls, diffs) {
    return h('div', { class: 'pr-lines ' + cls }, ls.length ? ls.map(function (l, i) {
      return h('div', { class: 'pr-line' + (diffs[i] ? ' diff' : '') }, l || ' ');
    }) : h('div', { class: 'pr-line pr-nothing' }, '(nothing)'));
  }

  /** What an answer shows: your lines and the real ones, the trap, what really happens, where it is taught. */
  function result(p, answer) {
    var m = mark(answer, p.output);
    var box = h('div', { class: 'pr-result' },
      h('div', { class: 'pr-verdict ' + (m.right ? 'ok' : 'bad') }, m.right ? '✓ Right' : (lines(answer).length ? '✗ Not quite' : '✗ Here is what it prints')),
      h('div', { class: 'pr-compare' },
        h('div', { class: 'pr-col pr-yours' }, h('div', { class: 'pr-col-head' }, 'You wrote'), codeLines('', lines(answer), m.yours)),
        h('div', { class: 'pr-col pr-real' }, h('div', { class: 'pr-col-head' }, 'It prints'), codeLines('', lines(p.output), m.real))),
      m.spacing ? h('p', { class: 'pr-spacing faint' }, 'Counted right: only the spacing differs. Java prints exactly the lines on the right.') : null,
      m.right ? null : U.callout('warn', 'The trap', U.md('Most people write:\n\n```text\n' + p.guess.replace(/\n$/, '') + '\n```\n\n' + p.trap)),
      U.callout('tip', 'What really happens', U.md(p.why)),
      (p.learn || []).length ? h('div', { class: 'row see-also pr-learn' }, h('span', { class: 'faint' }, 'Learn it in:'), p.learn.map(function (r) {
        var x = /^(\w+):(.+)$/.exec(r);
        return h('a', { class: 'btn btn-small', href: U.linkFor(x[1], x[2]), html: U.labelFor(x[1], x[2]) });
      })) : null);
    U.$$('.callout-warn', box).forEach(function (c) { c.classList.add('pr-trap'); });
    U.$$('.callout-tip', box).forEach(function (c) { c.classList.add('pr-why'); });
    return U.enhance(box);
  }

  /** The program, the box to type into, Check and "I don't know"; once answered, the result, Run it and
   *  Open in the Playground. opts: {answered: text or null, onAnswer(text, mark), next: element or null, head: [..],
   *  cls, inputId, checkId, skipId (the mock interview's own)}. */
  function card(p, opts) {
    var el = h('div', { class: 'card pr-card' + (opts.cls ? ' ' + opts.cls : ''), 'data-pid': p.id });
    var answer = h('textarea', { class: 'stdin-box pr-answer', id: opts.inputId || 'pr-answer', rows: '4', spellcheck: 'false', autocomplete: 'off',
      'aria-label': 'What the program prints, one line per printed line', placeholder: 'What does it print? One line per printed line.' });
    var check = h('button', { class: 'btn btn-primary', id: opts.checkId || 'pr-check', type: 'button', title: 'Ctrl+Enter' }, 'Check (Ctrl+Enter)');
    var skip = h('button', { class: 'btn btn-ghost', id: opts.skipId || 'pr-skip', type: 'button' }, 'I don\'t know');
    var after = h('div', { class: 'pr-after' });
    el.appendChild(h('div', { class: 'row fc-meta' }, opts.head || null, h('span', { class: 'spacer' }), h('span', { class: 'badge' }, TOPICS[p.topic] || p.topic)));
    el.appendChild(h('div', { class: 'pr-code' }, U.codeBlock(p.code, 'java', { playground: false }).el));
    el.appendChild(h('label', { class: 'stdin-label', for: answer.id }, 'What does it print?'));
    el.appendChild(answer);
    el.appendChild(h('div', { class: 'row pr-buttons' }, check, skip));
    el.appendChild(after);

    function answered(text) {
      el.setAttribute('data-result', mark(text, p.output).right ? 'right' : 'wrong');
      answer.value = text;
      answer.readOnly = true;
      check.disabled = skip.disabled = true;
      after.innerHTML = '';
      after.appendChild(result(p, text));
      var holder = h('div'), panel = null, running = false;
      var run = h('button', { class: 'btn btn-small pr-run', type: 'button' }, '▶ Run it');
      run.addEventListener('click', function () {
        if (running) return;
        running = true;
        if (panel) panel.el.remove();
        panel = U.runPanel({ title: 'The program, run on your JDK' });
        holder.appendChild(panel.el);
        panel.start();
        U.run.exec({ code: p.code }, panel.append).then(function (res) { panel.show(res); running = false; });
      });
      after.appendChild(h('div', { class: 'row pr-actions' }, run,
        h('button', { class: 'btn btn-small pr-open', type: 'button', onclick: function () { U.openInPlayground({ title: 'Predict the output', code: p.code }); } }, 'Open in the Playground'),
        h('span', { class: 'spacer' }), opts.next || null));
      after.appendChild(holder);
      if (opts.next) opts.next.focus({ preventScroll: true });
    }
    function submit(text) {
      if (answer.readOnly) return;
      if (opts.onAnswer) opts.onAnswer(text, mark(text, p.output));
      answered(text);
    }
    check.addEventListener('click', function () { submit(answer.value); });
    skip.addEventListener('click', function () { submit(''); });
    answer.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(answer.value); }
    });
    if (opts.answered !== null && opts.answered !== undefined) answered(opts.answered);
    else setTimeout(function () { if (answer.isConnected) answer.focus({ preventScroll: true }); }, 0);
    return el;
  }

  /* ---------- the start page ---------- */

  function startPage(root, query) {
    var ps = all(), r = review(), now = Date.now();
    var due = ps.filter(function (p) { return r[p.id] && r[p.id].due <= now; }).length;
    var seen = Object.keys(U.store.get('predict.seen', {})).length;
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/practice' }, 'Practice'), ' › Predict the output'));
    root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Predict the output'),
      h('p', null, ps.length + ' short programs, each built around a trap of concurrent Java: run() against start(), a flag that clears itself, what a pool does before it grows, ' +
        'a reduce that gives another answer in parallel, a scoped value in a fork and in an executor. Read the program, type what it prints, and see why. ' +
        'Interviewers ask "what does this print?" often, and it is the quickest way to find what you only thought you knew.')));
    var start = h('button', { class: 'btn btn-primary', id: 'pr-start', type: 'button', onclick: function () {
      save(deal({ seed: +query.seed || 0 }));
      U.render();
    } }, 'Start a round of ' + Math.min(ROUND, ps.length) + ' →');
    root.appendChild(h('div', { class: 'card narrow' },
      h('div', { class: 'row' }, h('b', null, seen + ' of ' + ps.length + ' seen · ' + due + ' due for review'), h('span', { class: 'spacer' }), start),
      h('p', { class: 'faint', style: { margin: '8px 0 0' } }, 'Type the output a line per printed line; Ctrl+Enter checks. Spaces at the end of a line do not count, and a line that differs only in its spacing counts as right. ' +
        'The ones you miss come first in your next round, then again after a day and three days.')));
    var hist = history();
    root.appendChild(h('h2', null, 'Your rounds'));
    if (!hist.length) root.appendChild(h('p', { class: 'muted' }, 'None yet. Your scores are kept here, the last ' + HISTORY + '.'));
    else root.appendChild(h('ul', { class: 'card narrow mock-history pr-history' }, hist.map(function (x) {
      return h('li', null, h('b', null, new Date(x.at).toLocaleString()), ' · ' + x.right + ' of ' + x.total + ' right');
    })));
  }

  /* ---------- a program of the round ---------- */

  function roundPage(root, c) {
    var p = U.find('predictions', c.deck[c.i]);
    if (!p) { c.i++; save(c); U.render(); return; }
    var done = c.results[c.i];
    var last = c.i === c.deck.length - 1;
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/practice' }, 'Practice'), ' › Predict the output'));
    root.appendChild(h('h1', { class: 'pr-h1' }, 'Predict the output'));
    var next = h('button', { class: 'btn btn-primary', id: 'pr-next', type: 'button', onclick: function () {
      var cur = current();
      if (!cur || !cur.results[cur.i]) return;
      cur.i++;
      if (cur.i >= cur.deck.length) finish(cur);
      save(cur);
      U.render();
    } }, last ? 'See your score →' : 'Next program →');
    root.appendChild(h('div', { class: 'pr-stage' }, card(p, {
      head: h('span', { class: 'pr-count' }, 'Program ' + (c.i + 1) + ' of ' + c.deck.length),
      answered: done ? done.answer : null, next: next,
      onAnswer: function (text, m) {
        var cur = current();
        if (!cur || cur.results[cur.i]) return;
        cur.results[cur.i] = { id: p.id, right: m.right, spacing: m.spacing, answer: text };
        record(p.id, m.right);
        save(cur);
      }
    })));
    root.appendChild(h('div', { class: 'row mock-foot' }, h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-small btn-ghost', id: 'pr-end', type: 'button', onclick: function (e) {
        var b = e.currentTarget;
        if (!b.getAttribute('data-armed')) { b.setAttribute('data-armed', '1'); b.textContent = 'Click again to stop this round'; return; }
        U.store.del('predict.current');
        U.render();
      } }, 'Stop the round')));
  }

  function finish(c) {
    var right = c.results.filter(function (x) { return x && x.right; }).length;
    var hist = history();
    hist.unshift({ at: new Date().toISOString(), right: right, total: c.deck.length, ids: c.deck });
    U.store.set('predict.history', hist.slice(0, HISTORY));
    c.done = true;
  }

  /* ---------- the score ---------- */

  function summaryPage(root, c) {
    var right = c.results.filter(function (x) { return x && x.right; }).length;
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/practice' }, 'Practice'), ' › Predict the output'));
    root.appendChild(h('h1', { class: 'pr-h1' }, 'Predict the output'));
    root.appendChild(h('div', { class: 'card pr-summary' },
      h('h2', { style: { marginTop: 0 } }, 'Round done: ' + right + ' of ' + c.deck.length + ' right'),
      h('ol', { class: 'pr-rows' }, c.deck.map(function (id, i) {
        var p = U.find('predictions', id) || { topic: id }, x = c.results[i] || {};
        return h('li', { 'data-pid': id, 'data-result': x.right ? 'right' : 'wrong' }, h('span', { class: 'mark' }, x.right ? '✓ ' : '✗ '),
          TOPICS[p.topic] || p.topic, x.spacing ? h('span', { class: 'faint' }, ' (spacing)') : null);
      })),
      h('p', { class: 'muted' }, right === c.deck.length ? 'Every one right. The next round deals programs you have not seen.' :
        'The ones you missed come first in your next round, then again after a day and three days, until you know them.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', id: 'pr-again', type: 'button', onclick: function () { save(deal({})); U.render(); } }, 'Another round →'),
        h('button', { class: 'btn', id: 'pr-done', type: 'button', onclick: function () { U.store.del('predict.current'); U.go('#/practice'); } }, 'Back to Practice'))));
  }

  U.views.predict = {
    render: function (root, params, query) {
      var c = current();
      if (!c) startPage(root, query || {});
      else if (c.i >= c.deck.length) summaryPage(root, c);
      else roundPage(root, c);
    }
  };
  U.predict = { mark: mark, deal: deal, current: current, record: record, result: result, card: card, topics: TOPICS };
  U.route('predict', U.views.predict);
})(window.JCLT);
