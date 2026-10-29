/*
 * explainers/settings-wins.js - "Which setting wins: try it" (#/explain/settings-wins).
 *
 * Fill in a key's value in any of the five layers and see which one Claude Code uses, following
 * code.claude.com/docs/en/settings ("Settings precedence", "Lists merge instead of overriding") and
 * /permission-modes (which files can set auto and bypassPermissions as the default mode).
 *
 *   CLT.explainers['settings-wins'].resolve(key, {managed, cli, local, project, user})
 *     -> {value, from: <layer> | 'merged' | 'ignored' | 'built-in' | 'none', notes: [Markdown]}
 */
(function (U) {
  'use strict';
  var h = U.h;
  U.explainers = U.explainers || {};

  var LAYERS = [
    ['managed', 'Managed', 'your organisation (admin console or a policy file)'],
    ['cli', 'Command line', 'claude --settings \'{...}\', this session only'],
    ['local', 'Local', '.claude/settings.local.json'],
    ['project', 'Shared project', '.claude/settings.json'],
    ['user', 'User', '~/.claude/settings.json']];
  var KEYS = [
    ['model', 'model', 'text', 'sonnet, opus, haiku…'],
    ['outputStyle', 'outputStyle', 'text', 'Concise, Explanatory…'],
    ['permissions.allow', 'permissions.allow (a list)', 'list', 'rules, separated by commas'],
    ['permissions.defaultMode', 'permissions.defaultMode', 'mode', '']];
  var MODES = ['default', 'acceptEdits', 'plan', 'auto', 'dontAsk', 'bypassPermissions'];
  var STYLES = ['Proactive', 'Concise', 'Explanatory', 'Learning', 'default'];
  var NAMES = {}; LAYERS.forEach(function (l) { NAMES[l[0]] = l[1]; });

  function present(v) { return Array.isArray(v) ? v.some(function (x) { return String(x).trim(); }) : v !== undefined && v !== null && String(v).trim() !== ''; }

  function resolve(key, layers) {
    layers = layers || {};
    var order = LAYERS.map(function (l) { return l[0]; }), notes = [];
    if (key === 'permissions.allow') {
      var merged = [];
      order.slice().reverse().forEach(function (l) {
        (layers[l] || []).forEach(function (r) { r = String(r).trim(); if (r && merged.indexOf(r) < 0) merged.push(r); });
      });
      notes.push('Lists merge: every file adds its rules, and none removes another file\'s.');
      notes.push('A deny rule in any file still beats an allow in any other: deny is checked first.');
      return { value: merged, from: merged.length ? 'merged' : 'none', notes: notes };
    }
    for (var i = 0; i < order.length; i++) {
      var l = order[i], v = layers[l];
      if (!present(v)) continue;
      v = String(v).trim();
      if (key === 'permissions.defaultMode') {
        if ((l === 'project' || l === 'local') && v === 'auto') {
          notes.push('`auto` in a project or local file does not take effect. Claude Code then uses the built-in default, not a `defaultMode` from your user file. The built-in default for interactive sessions on 2.1.283 and later is auto.');
          return { value: 'auto', from: 'ignored', notes: notes };
        }
        if ((l === 'project' || l === 'local') && v === 'bypassPermissions') {
          notes.push('`bypassPermissions` in a project or local file does not take effect, and the session starts in Manual (`default`).');
          return { value: 'default', from: 'ignored', notes: notes };
        }
        notes.push('A `--permission-mode` flag beats every file for the session.');
      }
      if (key === 'model') {
        notes.push('`--model` and the `ANTHROPIC_MODEL` variable override the `model` key from any file.');
        if (l === 'managed') notes.push('A managed `model` is the starting default, not a lock: `/model` can still switch, within any `availableModels` list your organisation sets.');
      }
      if (key === 'outputStyle') {
        if (STYLES.indexOf(v) < 0 && STYLES.some(function (s) { return s.toLowerCase() === v.toLowerCase(); })) {
          notes.push('The value is case-sensitive: `' + v + '` matches no style exactly, so you get Default.');
        }
        notes.push('`/output-style` and `/config` save to the local file.');
      }
      return { value: v, from: l, notes: notes };
    }
    if (key === 'permissions.defaultMode') {
      notes.push('Nothing sets it: interactive sessions start in auto on 2.1.283 and later; `claude -p` starts in Manual.');
      return { value: 'auto', from: 'built-in', notes: notes };
    }
    return { value: '', from: 'none', notes: [] };
  }

  var PRESETS = [
    ['Team file beats yours', 'model', { user: 'sonnet', project: 'opus' }],
    ['Your local file wins it back', 'model', { user: 'sonnet', project: 'opus', local: 'sonnet' }],
    ['Managed beats everything', 'outputStyle', { managed: 'Concise', cli: 'Explanatory', user: 'Learning' }],
    ['Lists merge', 'permissions.allow', { user: ['Bash(npm test)'], project: ['Bash(npm run lint)'], local: ['Bash(git commit *)'] }],
    ['A repo tries to turn prompts off', 'permissions.defaultMode', { user: 'plan', project: 'bypassPermissions' }]];

  var ex = U.explainers['settings-wins'] = { resolve: resolve, LAYERS: LAYERS };

  ex.render = function (box) {
    var state = { key: 'model', layers: {} };
    var keySel = h('select', { class: 'select', id: 'sw-key', 'aria-label': 'Setting' }, KEYS.map(function (k) { return h('option', { value: k[0] }, k[1]); }));
    var rows = h('div', { class: 'sw-layers' });
    var result = h('div', { class: 'sw-result', id: 'sw-result', 'aria-live': 'polite' });
    var notes = h('ul', { class: 'sw-notes', id: 'sw-notes' });

    box.appendChild(h('div', { class: 'row sw-presets' }, h('span', { class: 'faint' }, 'Try:'), PRESETS.map(function (p, i) {
      return h('button', { class: 'btn btn-small', type: 'button', 'data-i': i, onclick: function () {
        state.key = p[1];
        state.layers = JSON.parse(JSON.stringify(p[2]));
        Object.keys(state.layers).forEach(function (l) { if (Array.isArray(state.layers[l])) state.layers[l] = state.layers[l].join(', '); });
        keySel.value = p[1];
        build();
      } }, p[0]);
    })));
    box.appendChild(h('div', { class: 'field' }, h('label', { for: 'sw-key' }, 'Setting'), keySel));
    box.appendChild(h('p', { class: 'faint', style: { margin: '0 0 6px' } }, 'Highest first. Leave a layer empty when that file does not set the key.'));
    box.appendChild(rows);
    box.appendChild(result);
    box.appendChild(notes);
    keySel.addEventListener('change', function () { state.key = keySel.value; state.layers = {}; build(); });

    function kind() { return KEYS.filter(function (k) { return k[0] === state.key; })[0]; }
    function values() {
      var out = {};
      LAYERS.forEach(function (l) {
        var v = state.layers[l[0]];
        out[l[0]] = kind()[2] === 'list' ? String(v || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean) : v;
      });
      return out;
    }
    function build() {
      rows.innerHTML = '';
      var k = kind();
      LAYERS.forEach(function (l) {
        var control;
        if (k[2] === 'mode') {
          control = h('select', { class: 'select', id: 'sw-' + l[0], 'aria-label': l[1] }, h('option', { value: '' }, '(not set)'),
            MODES.map(function (m) { return h('option', { value: m }, m); }));
          control.addEventListener('change', function () { state.layers[l[0]] = control.value; show(); });
        } else {
          control = h('input', { class: 'input', id: 'sw-' + l[0], placeholder: '(not set) ' + k[3], 'aria-label': l[1] });
          control.addEventListener('input', function () { state.layers[l[0]] = control.value; show(); });
        }
        control.value = state.layers[l[0]] || '';
        rows.appendChild(h('div', { class: 'sw-layer', 'data-layer': l[0] },
          h('div', { class: 'sw-name' }, h('b', null, l[1]), h('small', { class: 'faint' }, l[2])), control));
      });
      show();
    }
    function show() {
      var r = resolve(state.key, values());
      U.$$('.sw-layer', rows).forEach(function (row) {
        var l = row.getAttribute('data-layer');
        row.classList.toggle('wins', r.from === l);
        row.classList.toggle('merged', r.from === 'merged' && present(values()[l]));
        row.classList.toggle('ignored', r.from === 'ignored' && present(values()[l]) && (l === 'project' || l === 'local') && /^(auto|bypassPermissions)$/.test(String(values()[l])));
      });
      result.innerHTML = '';
      notes.innerHTML = '';
      if (r.from === 'none') {
        result.appendChild(h('p', { class: 'muted' }, 'No layer sets it yet, so Claude Code would use its own default. Fill in a layer, or press one of the examples.'));
        return;
      }
      var val = Array.isArray(r.value) ? r.value.join(', ') : r.value;
      var where = r.from === 'merged' ? 'merged from every file that sets it' : r.from === 'ignored' ? 'a project or local value was ignored' :
        r.from === 'built-in' ? 'the built-in default' : r.from === 'none' ? 'no file sets it' : 'from the ' + NAMES[r.from].toLowerCase() + ' layer';
      result.appendChild(h('p', null, 'Claude Code uses ', h('code', null, val), ' (' + where + ').'));
      r.notes.forEach(function (n) { notes.appendChild(h('li', { html: U.mdInline(n) })); });
    }
    build();
  };
})(window.CLT);
