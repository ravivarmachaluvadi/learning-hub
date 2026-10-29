/*
 * explainers/permission-match.js - "Which permission rule matches" (#/explain/permission-match).
 *
 * A fixed rule set like a TypeScript repo's, a list of calls to try (or your own), and a mode. The
 * check runs through CLT.perm (js/perm.js) and lights up where it stopped: deny, ask, allow or the
 * mode. SAMPLES[i].want is each call's decision in Manual mode; the browser tests click every one.
 */
(function (U) {
  'use strict';
  var h = U.h;
  U.explainers = U.explainers || {};

  var RULES = {
    deny: ['Read(./.env)', 'Bash(curl *)', 'Bash(rm -rf *)'],
    ask: ['Bash(git push *)'],
    allow: ['Bash(pnpm test *)', 'Bash(pnpm lint *)', 'Bash(git commit *)']
  };
  var SAMPLES = [
    { tool: 'Bash', input: 'pnpm test src/cart', want: 'allow', why: 'an allow rule' },
    { tool: 'Bash', input: 'git push origin main', want: 'ask', why: 'an ask rule' },
    { tool: 'Bash', input: 'cat .env', want: 'deny', why: 'a Read deny reaches cat' },
    { tool: 'Bash', input: 'pnpm test && git push', want: 'ask', why: 'one part matches ask' },
    { tool: 'Bash', input: 'git -C . push origin main', want: 'ask', why: 'slips past the rule: the mode asks' },
    { tool: 'Bash', input: 'timeout 60 pnpm test', want: 'allow', why: 'timeout is stripped' },
    { tool: 'Bash', input: 'rm -rf build && pnpm test', want: 'deny', why: 'one part matches deny' },
    { tool: 'Bash', input: 'ls src', want: 'allow', why: 'read-only: no rule needed' },
    { tool: 'Bash', input: 'pnpm install', want: 'ask', why: 'no rule: the mode decides' },
    { tool: 'Read', input: '.env', want: 'deny', why: 'a Read deny' },
    { tool: 'Edit', input: 'src/cart.ts', want: 'ask', why: 'Manual asks before edits' }
  ];
  var STAGES = [['deny', 'Deny rules'], ['ask', 'Ask rules'], ['allow', 'Allow rules'], ['mode', 'The mode']];

  var ex = U.explainers['permission-match'] = { RULES: RULES, SAMPLES: SAMPLES };

  ex.render = function (box) {
    var st = { tool: 'Bash', input: SAMPLES[0].input, mode: 'default' };
    var lists = h('div', { class: 'pmx-lists' }, ['deny', 'ask', 'allow'].map(function (k) {
      return h('div', { class: 'pmx-list pmx-' + k, 'data-list': k }, h('h3', null, k),
        h('ul', null, RULES[k].map(function (r) { return h('li', { 'data-rule': r }, h('code', null, r)); })));
    }));
    var samples = h('div', { class: 'pmx-samples' }, SAMPLES.map(function (s, i) {
      return h('button', { class: 'btn btn-small pmx-sample', type: 'button', 'data-i': i, title: s.why, onclick: function () {
        st.tool = s.tool; st.input = s.input; toolSel.value = s.tool; input.value = s.input; show();
      } }, (s.tool === 'Bash' ? '' : s.tool + ': ') + s.input);
    }));
    var toolSel = h('select', { class: 'select', id: 'pmx-tool', 'aria-label': 'Tool' }, ['Bash', 'Read', 'Edit', 'WebFetch'].map(function (t) { return h('option', { value: t }, t); }));
    var input = h('input', { class: 'input', id: 'pmx-input', 'aria-label': 'Command, path or URL', spellcheck: 'false' });
    var modeSel = h('select', { class: 'select', id: 'pmx-mode', 'aria-label': 'Mode' }, U.perm.MODES.map(function (m) { return h('option', { value: m[0] }, m[1]); }));
    var flow = h('ol', { class: 'pmx-flow' }, STAGES.map(function (s) { return h('li', { 'data-stage': s[0] }, s[1]); }));
    var result = h('div', { class: 'pmx-result', id: 'pmx-result', 'aria-live': 'polite' });
    var trace = h('ol', { class: 'pmx-steps', id: 'pmx-steps' });

    box.appendChild(h('h3', null, 'The rules'));
    box.appendChild(lists);
    box.appendChild(h('h3', null, 'Try a call'));
    box.appendChild(samples);
    box.appendChild(h('div', { class: 'field-row pmx-custom' },
      h('div', { class: 'field' }, h('label', { for: 'pmx-tool' }, 'Tool'), toolSel),
      h('div', { class: 'field pmx-input-field' }, h('label', { for: 'pmx-input' }, 'Command, path or URL'), input),
      h('div', { class: 'field' }, h('label', { for: 'pmx-mode' }, 'Mode'), modeSel)));
    box.appendChild(flow);
    box.appendChild(result);
    box.appendChild(trace);
    toolSel.addEventListener('change', function () { st.tool = toolSel.value; show(); });
    input.addEventListener('input', function () { st.input = input.value; show(); });
    modeSel.addEventListener('change', function () { st.mode = modeSel.value; show(); });

    function show() {
      var r = U.perm.evaluate(RULES, { tool: st.tool, input: st.input }, { mode: st.mode, scope: 'project' });
      var stage = r.list === 'readonly' ? 'allow' : r.list || 'mode';
      U.$$('li', flow).forEach(function (li) {
        var s = li.getAttribute('data-stage'), at = STAGES.map(function (x) { return x[0]; });
        li.classList.toggle('reached', at.indexOf(s) <= at.indexOf(stage));
        li.classList.toggle('stopped', s === stage);
      });
      U.$$('.pmx-list li', lists).forEach(function (li) { li.classList.toggle('hit', li.getAttribute('data-rule') === r.rule); });
      result.setAttribute('data-decision', r.decision);
      result.innerHTML = '';
      result.appendChild(h('b', null, r.label));
      result.appendChild(h('span', { class: 'muted' }, ' ' + r.reason));
      trace.innerHTML = '';
      r.steps.forEach(function (s) { trace.appendChild(h('li', { html: U.mdInline(s) })); });
    }
    toolSel.value = st.tool; input.value = st.input; modeSel.value = st.mode;
    show();
  };
})(window.CLT);
