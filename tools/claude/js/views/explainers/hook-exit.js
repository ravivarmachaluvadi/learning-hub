/*
 * explainers/hook-exit.js - "What a hook's exit code does" (#/explain/hook-exit).
 *
 * Pick an event, an exit code and what the script prints, and see what Claude Code does: the
 * action goes ahead, is blocked, a warning appears, or nothing changes. Below, the whole table for
 * the event. It runs on the hook engine (js/hooks.js), the same rules the hook tool's tester uses,
 * written from code.claude.com/docs/en/hooks ("Exit code output", "Exit code 2 behavior per event").
 */
(function (U) {
  'use strict';
  var h = U.h;
  U.explainers = U.explainers || {};

  var EVENTS = ['PreToolUse', 'PostToolUse', 'Stop', 'UserPromptSubmit', 'SessionStart', 'Notification', 'PermissionRequest', 'SubagentStop', 'PreCompact'];
  var EXITS = [['0', '0'], ['2', '2'], ['1', '1 (or any other)']];
  var OUTS = [['none', 'nothing'], ['text', 'plain text'], ['json', 'a valid JSON object'], ['bad-json', 'JSON that does not parse']];
  var LABEL = { success: 'Goes ahead', decision: 'The JSON decides', blocked: 'Blocked', error: 'Warning only: it goes ahead', feedback: 'Too late to block: stderr is shown',
    ignored: 'Ignored', context: 'stdout reaches Claude' };

  var ex = U.explainers['hook-exit'] = { EVENTS: EVENTS };

  ex.render = function (box) {
    function select(id, opts, value) {
      var s = h('select', { class: 'select', id: id, onchange: draw }, opts.map(function (o) { return h('option', { value: o[0] }, o[1]); }));
      s.value = value;
      return s;
    }
    var ev = select('he-event', EVENTS.map(function (e) { return [e, e]; }), 'PreToolUse');
    var code = select('he-exit', EXITS, '2');
    var out = select('he-stdout', OUTS, 'none');
    var fail = h('input', { type: 'checkbox', id: 'he-onfailure', onchange: draw });
    var about = h('p', { class: 'muted', id: 'he-about' });
    var result = h('div', { class: 'pmx-result he-result', id: 'he-result', 'aria-live': 'polite' });
    var table = h('table', { class: 'table he-table', id: 'he-table' });

    box.appendChild(h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { for: 'he-event' }, 'The event'), ev),
      h('div', { class: 'field' }, h('label', { for: 'he-exit' }, 'The script exits'), code),
      h('div', { class: 'field' }, h('label', { for: 'he-stdout' }, 'and prints to stdout'), out)));
    box.appendChild(h('label', { class: 'he-fail' }, fail, ' The hook sets "onFailure": "block" (command and http hooks, 2.1.295 and later)'));
    box.appendChild(about);
    box.appendChild(result);
    box.appendChild(h('h3', null, 'Every combination for this event'));
    box.appendChild(h('div', { class: 'table-wrap' }, table));

    function draw() {
      var e = U.hooks.event(ev.value), opts = { onFailure: fail.checked ? 'block' : '' };
      about.innerHTML = U.mdInline('**' + e.name + '**: ' + e.when + '. ' + (e.block ? 'It can block: exit 2 ' + e.exit2.charAt(0).toLowerCase() + e.exit2.slice(1) + '.' :
        'It cannot block. Exit 2: ' + e.exit2.charAt(0).toLowerCase() + e.exit2.slice(1) + '.') + ' To decide with JSON: ' + e.decision + '.');
      var r = U.hooks.outcome(e.name, code.value, out.value, opts);
      result.setAttribute('data-kind', r.kind);
      result.setAttribute('data-decision', r.kind === 'blocked' ? 'deny' : r.kind === 'error' ? 'ask' : 'allow');
      result.innerHTML = '';
      result.appendChild(h('b', null, LABEL[r.kind] || r.kind));
      result.appendChild(h('p', { html: U.mdInline(r.text) }));
      if (r.claude) result.appendChild(h('p', { class: 'muted', html: U.mdInline(r.claude) }));
      table.innerHTML = '';
      table.appendChild(h('thead', null, h('tr', null, h('th', null, 'stdout'), EXITS.map(function (x) { return h('th', null, 'exit ' + x[1]); }))));
      table.appendChild(h('tbody', null, OUTS.map(function (o) {
        return h('tr', null, h('td', null, o[1]), EXITS.map(function (x) {
          var c = U.hooks.outcome(e.name, x[0], o[0], opts);
          var here = x[0] === code.value && o[0] === out.value;
          return h('td', { class: 'he-cell' + (here ? ' he-here' : ''), 'data-kind': c.kind }, LABEL[c.kind] || c.kind);
        }));
      })));
    }
    draw();
  };
})(window.CLT);
