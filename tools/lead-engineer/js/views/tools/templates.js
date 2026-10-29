/*
 * views/tools/templates.js - the message templates (#/tools/templates, ?t=<id> opens one).
 *
 * Pick a template (data/templates.js), fill in its fields, and copy the text. Missing required
 * parts show as [their name]; optional parts that are empty are left out. Checks: an empty
 * required field, a field that needs a date and has none (every line, for a list), and vague
 * wording (the status rules in data/lint-rules.js). What you type is kept per template in
 * "lelt.tool.templates" as {pick, values: {templateId: {field: value}}}.
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit;

  var EMPTY = { pick: 'kickoff', values: {} };
  var RULES = ['tpl-missing', 'tpl-no-date', 'tpl-vague'];

  function templateOf(s) { return U.find('templates', s.pick) || (U.data.templates || [])[0]; }
  function valuesOf(s, t) { return (s.values && s.values[t.id]) || {}; }
  function val(v, f) { return String(v[f.key] === undefined || v[f.key] === null ? '' : v[f.key]); }
  function lines(text) { return String(text || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }

  function check(s) {
    var t = templateOf(s), v = valuesOf(s, t), out = [], rules = (U.data.lintRules || {}).status || [];
    if (!t) return out;
    t.fields.forEach(function (f) {
      var text = val(v, f).trim();
      if (!text) { if (f.req) out.push({ rule: 'tpl-missing', where: f.label, key: f.key }); return; }
      if (f.date && lines(text).some(function (l) { return !U.lint.hasDate(l); })) out.push({ rule: 'tpl-no-date', where: f.label, key: f.key });
      if (!f.options) {
        var hit = U.lint.find(text, rules)[0];
        if (hit) out.push({ rule: 'tpl-vague', where: f.label, key: f.key, detail: hit.text });
      }
    });
    return out;
  }

  /** The template's text with the values filled in (see the top of data/templates.js). */
  function fill(t, v) {
    var byKey = {};
    t.fields.forEach(function (f) { byKey[f.key] = f; });
    var LIST = /^(\s*)(?:([-•*])|(\d+)\.)?(\s*)\{\{(\w+)\}\}\s*$/;
    var blocks = t.body.split(/\n\s*\n/).map(function (block) {
      var had = false, kept = false, out = [];
      block.split('\n').forEach(function (line) {
        var keys = [], m, re = /\{\{(\w+)\}\}/g;
        while ((m = re.exec(line))) keys.push(m[1]);
        if (!keys.length) { out.push(line); return; }
        had = true;
        var skip = keys.some(function (k) { var f = byKey[k]; return f && !f.req && !val(v, f).trim(); });
        if (skip) return;
        kept = true;
        var list = LIST.exec(line), f = list && byKey[list[5]];
        if (f && f.lines && val(v, f).trim()) {
          var indent = list[1], bullet = list[2], num = list[3] ? +list[3] : 0, gap = list[4] || ' ';
          lines(val(v, f)).forEach(function (item, i) {
            out.push(indent + (bullet ? bullet + gap : num ? (num + i) + '.' + gap : '') + item);
          });
          return;
        }
        out.push(line.replace(/\{\{(\w+)\}\}/g, function (_, k) {
          var g = byKey[k], text = g ? lines(val(v, g)).join('; ') : '';
          return text || '[' + (g ? g.label : k) + ']';
        }));
      });
      return had && !kept ? null : out.join('\n');
    });
    return blocks.filter(function (b) { return b !== null; }).join('\n\n');
  }

  U.tools.templates = {
    EMPTY: EMPTY, rules: RULES, check: check, fill: fill,
    compute: function (s) { var t = templateOf(s); return { template: t ? t.id : null, text: t ? fill(t, valuesOf(s, t)) : '' }; },
    render: function (root, query) {
      var s = K.load('templates', EMPTY);
      s.values = s.values && typeof s.values === 'object' ? s.values : {};
      if (query && query.t && U.find('templates', query.t)) s.pick = query.t;
      if (!U.find('templates', s.pick)) s.pick = EMPTY.pick;

      var chips = h('div', { class: 'chips tp-choices', role: 'group', 'aria-label': 'Template' });
      var intro = h('div', { class: 'tp-intro' });
      var fieldsBox = h('div', { class: 'tp-fields', id: 'tp-fields' });
      var checks = K.checksCard('templates', 'Every part is filled in, with dates where they matter and no vague wording.', function (x) {
        K.focus(U.$('#tp-fields [data-field="' + x.key + '"]'));
      });
      var out = K.outputCard({ id: 'tp-output', title: 'The text',
        prompt: function (text) {
          return 'I am a lead engineer. Here is a message I am about to send. Make it shorter and clearer without losing any fact, date or name. ' +
            'Keep the ask and the date in the first two lines, and point out anything vague or anything the reader will have to ask about.\n\n' + text;
        } });
      var parts = h('ul', { class: 'tp-parts', id: 'tp-parts' });

      root.appendChild(h('div', { class: 'card tp-pick' }, h('h2', null, 'Choose a template'), chips, intro));
      root.appendChild(h('div', { class: 'tool-layout' },
        h('div', { class: 'card st-form' },
          K.samples([['tp-sample', 'Load the example', function () { set(K.clone(templateOf(s).sample || {})); }]], 'tp-clear', function () { set({}); }),
          fieldsBox),
        h('div', { class: 'st-side' }, checks.el, out.el)));
      root.appendChild(U.section('Why each part is there', parts, true));

      function set(values) { s.values[s.pick] = values; drawFields(); changed(); }

      function drawChips() {
        chips.innerHTML = '';
        (U.data.templates || []).forEach(function (t) {
          chips.appendChild(h('button', { class: 'chip tp-choice' + (t.id === s.pick ? ' selected' : ''), type: 'button', 'data-t': t.id,
            'aria-pressed': t.id === s.pick ? 'true' : 'false', onclick: function () {
              s.pick = t.id;
              // keep the address in step without re-rendering the page
              try { history.replaceState(null, '', '#/tools/templates?t=' + t.id); } catch (e) { /* file:// may refuse: harmless */ }
              drawChips(); drawFields(); changed();
            } }, t.title));
        });
        var t = templateOf(s);
        intro.innerHTML = '';
        intro.appendChild(h('p', { class: 'muted', style: { margin: '10px 0 0' } }, t.summary));
        intro.appendChild(h('p', { class: 'faint', style: { margin: '4px 0 0' }, html: U.mdInline('**When:** ' + t.when) }));
        parts.innerHTML = '';
        t.parts.forEach(function (p) { parts.appendChild(h('li', null, h('b', null, p.title + ': '), p.why)); });
      }

      function drawFields() {
        var t = templateOf(s), v = s.values[t.id] = s.values[t.id] || {};
        fieldsBox.innerHTML = '';
        t.fields.forEach(function (f) {
          var id = 'tp-f-' + f.key, el;
          if (f.options) {
            el = h('select', { class: 'select', id: id, 'data-field': f.key }, f.options.map(function (o) { return h('option', { value: o[0] }, o[1]); }));
          } else if (f.lines) {
            el = h('textarea', { class: 'input', id: id, rows: f.lines, 'data-field': f.key, placeholder: f.ph || null });
          } else {
            el = h('input', { class: 'input', id: id, 'data-field': f.key, placeholder: f.ph || null });
          }
          el.value = val(v, f);
          el.addEventListener(f.options ? 'change' : 'input', function () { v[f.key] = el.value; changed(); });
          var hint = [f.req ? 'Required' : 'Optional: left out when empty', f.lines ? 'one per line' : '', f.date ? (f.lines ? 'each with a date' : 'a day') : '']
            .filter(Boolean).join(', ');
          fieldsBox.appendChild(K.field(id, f.label, hint, el));
        });
      }

      function changed() {
        U.store.set('tool.templates', s);
        checks.show(check(s));
        out.set(fill(templateOf(s), valuesOf(s, templateOf(s))));
      }

      drawChips();
      drawFields();
      changed();
    }
  };
})(window.LELT);
