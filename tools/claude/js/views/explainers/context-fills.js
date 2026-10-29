/*
 * explainers/context-fills.js - "How the context fills" (#/explain/context-fills).
 *
 * Press steps (read a file, run the tests, ask a subagent, /compact, /clear…) and watch two meters:
 * how full the context window is, and how many tokens have been sent in total, since every request
 * carries the whole conversation. The token counts are illustrative, not measured: the docs give the
 * mechanism (what loads, what survives compaction), not fixed sizes.
 *
 *   CLT.explainers['context-fills'].simulate(stepIds, windowSize) -> {used, sent, requests, pct, parts}
 */
(function (U) {
  'use strict';
  var h = U.h;
  U.explainers = U.explainers || {};

  // what loads before you type (illustrative sizes)
  var START = { system: 14000, memory: 3500, listings: 3000 };
  var PARTS = [
    ['system', 'System prompt and tools'], ['memory', 'CLAUDE.md and auto memory'], ['listings', 'Skill descriptions and MCP tool names'],
    ['chat', 'Your messages and replies'], ['files', 'Files read'], ['output', 'Command output']];
  var RECENT_FILES = 15000;   // after /compact: up to five recently changed files are read again
  var SUMMARY = 6000;         // the size of a compaction summary

  // each step: what it adds, how many requests it makes, and what it shows
  var ACTIONS = [
    { id: 'ask', label: 'Ask a question', add: { chat: 1500 }, requests: 1,
      note: 'Your message and the reply join the conversation, and are sent again with every request after this one.' },
    { id: 'read', label: 'Read a 400-line file', add: { files: 6000, chat: 500 }, requests: 2,
      note: 'The whole file stays in the window. Two requests: one to decide to read it, one to answer with it.' },
    { id: 'tests', label: 'Run the full test suite', add: { output: 12000, chat: 800 }, requests: 2,
      note: 'Every line of output stays. Quiet flags (cargo test -q) or "show only the failures" keep it small.' },
    { id: 'log', label: 'Read a 3,000-line log', add: { output: 40000, chat: 800 }, requests: 2,
      note: 'One big read can take a fifth of a 200K window, and it rides along with every later request.' },
    { id: 'explore', label: 'Explore 20 files yourself', add: { files: 60000, chat: 2000 }, requests: 6,
      note: 'Broad exploration in your own session: all of it lands in your window.' },
    { id: 'subagent', label: 'A subagent explores them', add: { chat: 2500 }, requests: 2,
      note: 'The subagent reads in its own window; only its summary comes back. (Its own requests still count against your usage.)' },
    { id: 'btw', label: '/btw side question', add: {}, requests: 1, aside: true,
      note: 'Answered from what is already in context, and never added to the history.' },
    { id: 'compact', label: '/compact', requests: 1, compact: true,
      note: 'The conversation becomes a summary; CLAUDE.md and memory are re-read; up to five recently changed files come back. Reading everything to summarise it is one large request.' },
    { id: 'clear', label: '/clear', requests: 0, clear: true,
      note: 'A new conversation: only what loads at the start remains. Costs nothing; the old session can be resumed.' }
  ];
  function action(id) { return ACTIONS.filter(function (a) { return a.id === id; })[0]; }

  function total(p) { return PARTS.reduce(function (n, k) { return n + (p[k[0]] || 0); }, 0); }

  /** Run the steps in order. */
  function simulate(steps, size) {
    size = size || 200000;
    var p = Object.assign({ chat: 0, files: 0, output: 0 }, START), sent = 0, requests = 0;
    (steps || []).forEach(function (id) {
      var a = action(id);
      if (!a) return;
      if (a.clear) { p = Object.assign({ chat: 0, files: 0, output: 0 }, START); return; }
      if (a.compact) {
        sent += total(p); requests += 1;   // reading the conversation to summarise it
        p.chat = SUMMARY; p.files = Math.min(p.files, RECENT_FILES); p.output = 0;
        return;
      }
      Object.keys(a.add).forEach(function (k) { p[k] += a.add[k]; });
      for (var i = 0; i < a.requests; i++) { sent += total(p); requests += 1; }
    });
    var used = total(p);
    return { used: used, sent: sent, requests: requests, pct: used / size * 100, parts: p, size: size };
  }

  function fmt(n) { return Math.round(n).toLocaleString('en-GB'); }

  var ex = U.explainers['context-fills'] = { simulate: simulate, ACTIONS: ACTIONS, START: START };

  ex.render = function (box) {
    var steps = [], size = 200000;
    var used = h('b', { id: 'cf-used' }), sent = h('b', { id: 'cf-sent' });
    var bar = h('div', { class: 'cf-bar', role: 'img', 'aria-label': 'How full the context window is' });
    var log = h('ol', { class: 'cf-log', id: 'cf-log' });
    var sizeBtns = [[200000, '200K window', 'cf-size-200k'], [1000000, '1M window', 'cf-size-1m']].map(function (s) {
      return h('button', { class: 'chip', type: 'button', id: s[2], onclick: function () { size = s[0]; draw(); } }, s[1]);
    });

    box.appendChild(h('div', { class: 'row cf-sizes' }, h('span', { class: 'faint' }, 'Model window:'), sizeBtns));
    box.appendChild(h('div', { class: 'cf-actions' }, ACTIONS.map(function (a) {
      return h('button', { class: 'btn btn-small', type: 'button', id: 'cf-act-' + a.id,
        onclick: function () { steps.push(a.id); draw(); } }, a.label);
    }), h('button', { class: 'btn btn-small btn-ghost', type: 'button', id: 'cf-reset', onclick: function () { steps = []; draw(); } }, 'Start over')));
    box.appendChild(h('div', { class: 'cf-meters' },
      h('p', null, 'In the window: ', used),
      h('p', null, 'Sent so far: ', sent)));
    box.appendChild(h('div', { class: 'cf-bar-wrap' }, bar,
      h('div', { class: 'cf-zone', title: 'This tool\'s rule of thumb, not a documented threshold' }, h('span', null, 'past 60%: finish the step, then clear or compact'))));
    box.appendChild(h('ul', { class: 'cf-legend' }, PARTS.map(function (k) {
      return h('li', null, h('span', { class: 'cf-swatch cf-' + k[0] }), k[1]);
    })));
    box.appendChild(h('h3', null, 'What happened'));
    box.appendChild(log);

    function draw() {
      var r = simulate(steps, size);
      sizeBtns.forEach(function (b, i) { b.classList.toggle('selected', (i === 0 ? 200000 : 1000000) === size); });
      used.textContent = fmt(r.used) + ' of ' + fmt(size) + ' tokens (' + Math.round(r.pct) + '%)';
      sent.textContent = fmt(r.sent) + ' tokens in ' + U.plural(r.requests, 'request');
      bar.innerHTML = '';
      PARTS.forEach(function (k) {
        var n = r.parts[k[0]] || 0;
        if (!n) return;
        bar.appendChild(h('span', { class: 'cf-seg cf-' + k[0], style: { width: Math.min(100, n / size * 100) + '%' }, title: k[1] + ': ' + fmt(n) }));
      });
      log.innerHTML = '';
      log.appendChild(h('li', { class: 'faint' }, 'Session start: ' + fmt(START.system + START.memory + START.listings) + ' tokens load before you type.'));
      var prev = simulate([], size);
      steps.forEach(function (id, i) {
        var now = simulate(steps.slice(0, i + 1), size), a = action(id);
        var d = now.used - prev.used;
        log.appendChild(h('li', null, h('b', null, a.label), ' ', h('span', { class: 'badge' + (d > 0 ? ' badge-warn' : d < 0 ? ' badge-ok' : '') }, (d > 0 ? '+' : '') + fmt(d)), ' ', h('span', { class: 'muted' }, a.note)));
        prev = now;
      });
      if (!steps.length) log.appendChild(h('li', { class: 'faint' }, 'Press a step above.'));
    }
    draw();
  };
})(window.CLT);
