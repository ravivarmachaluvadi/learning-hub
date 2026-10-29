/*
 * explainers/what-loads.js - "What loads when" (#/explain/what-loads).
 *
 * Turn extensions on or off (CLAUDE.md, a path-scoped rule, a skill Claude may load, a skill only you
 * can run, an MCP server, a custom subagent, a hook), then step through a session and see where each
 * thing ends up: in your context window, in a subagent's own window, or outside any context. The
 * mechanism follows code.claude.com/docs/en/features-overview ("Context cost by feature"), /skills
 * ("Skill content lifecycle"), /sub-agents ("What loads at startup") and /memory; the token counts
 * are illustrative, chosen to show the shape. /context shows the real ones.
 *
 *   CLT.explainers['what-loads'].simulate(featureIds, stepIds) -> {main: [item], sub: [item], outside: [item], notes: [Markdown]}
 *   item: {id, label, tokens}
 */
(function (U) {
  'use strict';
  var h = U.h;
  U.explainers = U.explainers || {};

  var FEATURES = [
    ['claudemd', 'CLAUDE.md', 'The project\'s CLAUDE.md, about 180 lines'],
    ['rule', 'A rule for src/api/**', '.claude/rules/api.md with paths: src/api/**'],
    ['skill', 'Skill: api-conventions', 'A reference skill Claude may load on its own'],
    ['userskill', 'Skill: /deploy', 'disable-model-invocation: true, so only you can run it'],
    ['mcp', 'MCP server: playwright', 'About 20 browser tools, tool search on (the default)'],
    ['agent', 'Subagent: repo-explorer', 'A custom subagent in .claude/agents/'],
    ['hook', 'Hook: format on edit', 'PostToolUse on Edit|Write runs prettier']
  ];
  var STEPS = [
    ['read', 'Claude reads src/api/orders.ts'],
    ['auto', 'Claude picks the api-conventions skill'],
    ['slash', 'You type /deploy staging'],
    ['mcp', 'Claude uses a Playwright tool'],
    ['delegate', 'Claude delegates to a subagent'],
    ['edit', 'Claude edits orders.ts'],
    ['compact', '/compact']
  ];
  // illustrative sizes, in tokens
  var T = { system: 14000, claudemd: 3000, rule: 800, skillDesc: 120, agentDesc: 100, mcpNames: 300, skill: 2000, userskill: 1500, schema: 600,
    mcpResult: 8000, fileRead: 5000, fileEdit: 1200, agentPrompt: 700, agentReads: 60000, agentSummary: 1500, summary: 4000, reattach: 5000 };

  function simulate(features, steps) {
    var on = {};
    (features || []).forEach(function (f) { on[f] = true; });
    var main = [], sub = [], outside = [], notes = [], invoked = [];
    function add(list, id, label, tokens) { if (!list.some(function (x) { return x.id === id; })) list.push({ id: id, label: label, tokens: tokens }); }
    function drop(list, ids) { for (var i = list.length - 1; i >= 0; i--) if (ids.indexOf(list[i].id) >= 0) list.splice(i, 1); }

    // session start
    add(main, 'system', 'Claude Code\'s system prompt and built-in tools', T.system);
    if (on.claudemd) add(main, 'claudemd', 'CLAUDE.md, in full', T.claudemd);
    if (on.skill) add(main, 'skill-desc', 'Skill listing: the name and description of api-conventions', T.skillDesc);
    if (on.mcp) add(main, 'mcp-names', 'MCP: the names of the playwright tools (schemas wait for tool search)', T.mcpNames);
    if (on.agent) add(main, 'agent-desc', 'Subagent listing: the description of repo-explorer', T.agentDesc);
    if (on.userskill) add(outside, 'userskill-file', 'The /deploy skill: nothing loads until you type it', 0);
    if (on.rule) add(outside, 'rule-file', 'The src/api rule: waits for a matching file', 0);
    if (on.hook) add(outside, 'hook', 'The format hook: runs outside Claude\'s context', 0);

    (steps || []).forEach(function (s) {
      if (s === 'read') {
        add(main, 'file-read', 'src/api/orders.ts, read in full', T.fileRead);
        if (on.rule) { add(main, 'rule', 'The src/api rule, loaded by the matching file', T.rule); drop(outside, ['rule-file']); }
      }
      if (s === 'auto' && on.skill) { add(main, 'skill', 'The api-conventions SKILL.md, in full', T.skill); invoked.push('skill'); }
      if (s === 'slash' && on.userskill) { add(main, 'userskill', 'The /deploy SKILL.md, in full', T.userskill); drop(outside, ['userskill-file']); invoked.push('userskill'); }
      if (s === 'mcp' && on.mcp) {
        add(main, 'mcp-schemas', 'The tool\'s full schema, found by tool search', T.schema);
        add(main, 'mcp-result', 'Its result: a page snapshot', T.mcpResult);
      }
      if (s === 'delegate') {
        sub.length = 0;
        if (on.agent) {
          add(sub, 'agent-prompt', 'The repo-explorer system prompt (not Claude Code\'s)', T.agentPrompt);
          if (on.claudemd) add(sub, 'claudemd', 'CLAUDE.md: custom subagents load it too', T.claudemd);
        } else {
          add(sub, 'agent-prompt', 'The built-in Explore agent\'s prompt (Explore skips CLAUDE.md)', T.agentPrompt);
        }
        add(sub, 'agent-task', 'The task Claude wrote for it: it never sees your conversation', 300);
        add(sub, 'agent-reads', 'The 20 files it read', T.agentReads);
        add(main, 'agent-summary', 'The subagent\'s summary: all that comes back', T.agentSummary);
      }
      if (s === 'edit') {
        add(main, 'file-edit', 'The edit to orders.ts', T.fileEdit);
        if (on.hook) notes.push('The format hook ran after the edit, outside the context. It printed nothing, so it added nothing; a hook adds context only when it returns some.');
      }
      if (s === 'compact') {
        var keep = ['system', 'claudemd', 'skill-desc', 'mcp-names', 'agent-desc'];
        var kept = main.filter(function (x) { return keep.indexOf(x.id) >= 0; });
        var skills = main.filter(function (x) { return invoked.indexOf(x.id) >= 0; }).map(function (x) {
          return { id: x.id, label: x.label.replace(', in full', '') + ': re-attached (its first 5,000 tokens)', tokens: Math.min(x.tokens, T.reattach) };
        });
        main.length = 0;
        kept.concat([{ id: 'summary', label: 'The summary of the conversation so far', tokens: T.summary }], skills).forEach(function (x) { main.push(x); });
        if (on.rule && (steps || []).indexOf('read') >= 0) add(outside, 'rule-file', 'The src/api rule: gone with the summary, back when a matching file is read', 0);
        notes.push('After /compact: CLAUDE.md is read again from disk, invoked skills are re-attached (up to 5,000 tokens each, 25,000 in all), and everything else is in the summary. A path-scoped rule is not re-read until Claude touches a matching file again.');
      }
    });
    if ((steps || []).indexOf('auto') >= 0 && !on.skill) notes.push('Turn the api-conventions skill on to see Claude load it.');
    if ((steps || []).indexOf('slash') >= 0 && !on.userskill) notes.push('Turn the /deploy skill on to run it.');
    if ((steps || []).indexOf('mcp') >= 0 && !on.mcp) notes.push('Turn the MCP server on to use its tools.');
    return { main: main, sub: sub, outside: outside, notes: notes };
  }

  function sum(list) { return list.reduce(function (n, x) { return n + x.tokens; }, 0); }
  function fmt(n) { return Math.round(n).toLocaleString('en-GB'); }

  var ex = U.explainers['what-loads'] = { simulate: simulate, FEATURES: FEATURES, STEPS: STEPS };

  ex.render = function (box) {
    var features = FEATURES.map(function (f) { return f[0]; }), steps = [];
    var featureBox = h('div', { class: 'wl-features' }, FEATURES.map(function (f) {
      var input = h('input', { type: 'checkbox', id: 'wl-f-' + f[0], checked: true, onchange: function () {
        features = FEATURES.map(function (x) { return x[0]; }).filter(function (id) { return U.$('#wl-f-' + id, box).checked; });
        draw();
      } });
      return h('label', { class: 'wl-feature', title: f[2] }, input, h('span', null, f[1]));
    }));
    var stepBox = h('div', { class: 'cf-actions wl-steps' }, STEPS.map(function (s) {
      return h('button', { class: 'btn btn-small', type: 'button', id: 'wl-step-' + s[0], onclick: function () { steps.push(s[0]); draw(); } }, s[1]);
    }), h('button', { class: 'btn btn-small btn-ghost', type: 'button', id: 'wl-reset', onclick: function () { steps = []; draw(); } }, 'Start over'));
    var cols = {
      main: h('section', { class: 'wl-col wl-main', 'data-col': 'main' }),
      sub: h('section', { class: 'wl-col wl-sub', 'data-col': 'sub' }),
      outside: h('section', { class: 'wl-col wl-outside', 'data-col': 'outside' })
    };
    var history = h('p', { class: 'faint wl-history', id: 'wl-history' });
    var notes = h('ul', { class: 'wl-notes', id: 'wl-notes' });

    box.appendChild(h('h3', { style: { marginTop: 0 } }, '1. What this project has'));
    box.appendChild(featureBox);
    box.appendChild(h('h3', null, '2. What happens in the session'));
    box.appendChild(stepBox);
    box.appendChild(history);
    box.appendChild(h('div', { class: 'wl-cols' }, cols.main, cols.sub, cols.outside));
    box.appendChild(notes);

    function column(el, title, hint, items) {
      el.innerHTML = '';
      el.appendChild(h('h3', null, title, ' ', h('span', { class: 'badge' }, fmt(sum(items)) + ' tokens')));
      el.appendChild(h('p', { class: 'faint' }, hint));
      el.appendChild(items.length ? h('ul', { class: 'plain-list' }, items.map(function (x) {
        return h('li', { class: 'wl-item', 'data-id': x.id }, h('span', null, x.label), x.tokens ? h('span', { class: 'faint' }, ' ' + fmt(x.tokens)) : null);
      })) : h('p', { class: 'muted' }, 'Nothing.'));
    }
    function draw() {
      var r = simulate(features, steps);
      column(cols.main, 'Your context window', 'Sent with every request until you /clear or /compact.', r.main);
      column(cols.sub, 'A subagent\'s own window', 'Separate: it costs usage, not room in yours.', r.sub);
      column(cols.outside, 'Outside any context', 'Configured, but costing nothing right now.', r.outside);
      history.textContent = steps.length ? 'So far: ' + steps.map(function (s) { return STEPS.filter(function (x) { return x[0] === s; })[0][1]; }).join(' → ') : 'Press a step: this is the session start.';
      notes.innerHTML = '';
      r.notes.forEach(function (n) { notes.appendChild(h('li', { html: U.mdInline(n) })); });
    }
    draw();
  };
})(window.CLT);
