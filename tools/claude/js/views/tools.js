/*
 * views/tools.js - the tool list (#/tools), the frame around one tool (#/tools/<id>), and the
 * building blocks the tools share (CLT.toolKit).
 *
 * Each tool's screen lives in js/views/tools/<id>.js and registers itself as
 * CLT.tools[id] = {render(container)}. Its title, track and "why" come from data/tools.js.
 *
 * Every tool also exposes its logic, so the tests can run it without the screen:
 *   EMPTY            the blank state
 *   state            the state the screen is showing
 *   compute(state)   the numbers the screen shows (where there are any)
 *   check(state)     what to fix, as [{rule, where}]; each rule's message and fix are data
 *                    (data/tool-checks.js), and `rules` lists every rule the code can raise
 */
(function (U) {
  'use strict';
  var h = U.h;

  // the tools still to come, named so the list shows where the tool is going (no links: no pages yet)
  var LATER = [];

  function listPage(root) {
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Tools'),
      h('p', null, 'Working tools for real work, not exercises. Everything you type stays in this browser, and each tool gives you text or a file to copy: a reply for Slack or Teams, a prompt for Claude, a ROADMAP.md.')));
    root.appendChild(h('div', { class: 'cards' }, (U.data.tools || []).map(function (t) {
      return h('a', { class: 'card tool-card', href: '#/tools/' + t.id, 'data-id': t.id },
        h('div', { class: 'row' }, U.trackBadge(t.track)),
        h('h3', null, t.title),
        h('p', { class: 'muted' }, t.summary));
    })));
    if (!LATER.length) return;
    root.appendChild(h('h2', null, 'Coming in later batches'));
    root.appendChild(h('ul', { class: 'later-list' }, LATER.map(function (x) {
      return h('li', null, x[0], h('span', { class: 'faint' }, ' · batch ' + x[1]));
    })));
  }

  U.views.tools = {
    render: function (root, params) {
      if (!params[0]) return listPage(root);
      var t = U.find('tools', params[0]);
      if (!t || !U.tools[t.id]) {
        root.appendChild(h('div', { class: 'card' }, h('h1', null, 'Tool not found'),
          h('p', null, 'There is no tool called "' + params[0] + '".'), h('a', { class: 'btn', href: '#/tools' }, '← All tools')));
        return;
      }
      root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/tools' }, 'Tools'), ' › ', t.title));
      root.appendChild(h('div', { class: 'page-head' },
        h('div', { class: 'row' }, U.trackBadge(t.track)),
        h('h1', null, t.title),
        h('div', { class: 'tool-why', html: U.md(t.why) })));
      var body = h('div', { class: 'tool-body' });
      root.appendChild(body);
      U.tools[t.id].render(body);
    },
    destroy: function () {
      Object.keys(U.tools).forEach(function (k) { if (U.tools[k].destroy) U.tools[k].destroy(); });
    }
  };
  U.route('tools', U.views.tools);

  /* ---------- the toolkit ---------- */

  var K = U.toolKit = {};

  K.clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  /** The tool's saved state ("clt.tool.<id>") laid over its empty state. */
  K.load = function (id, empty) {
    var saved = U.store.get('tool.' + id, null);
    return Object.assign(K.clone(empty), saved && typeof saved === 'object' ? saved : {});
  };

  /** Replace everything in a state object, keeping the object itself (the form is bound to it). */
  K.replace = function (state, next) {
    Object.keys(state).forEach(function (k) { delete state[k]; });
    Object.assign(state, K.clone(next));
  };

  /** A labelled field: the label, the control, an optional hint under it (so controls in a row line up). */
  K.field = function (id, label, hint, el) {
    return h('div', { class: 'field' }, h('label', { for: id }, label), el, hint ? h('small', { class: 'faint' }, hint) : null);
  };

  /**
   * Form controls bound to state[key]. Text, number and date inputs keep what was typed (a string);
   * Call fill() after the state was replaced.
   */
  K.form = function (state, changed) {
    var binds = [];
    function bind(el, key, read) {
      binds.push({ el: el, key: key });
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () { state[key] = read ? read(el) : el.value; changed(); });
      return el;
    }
    return {
      input: function (key, attrs) { return bind(h('input', Object.assign({ class: 'input' }, attrs)), key); },
      textarea: function (key, attrs) { return bind(h('textarea', Object.assign({ class: 'input' }, attrs)), key); },
      select: function (key, options, attrs) {
        return bind(h('select', Object.assign({ class: 'select' }, attrs), options.map(function (o) { return h('option', { value: o[0] }, o[1]); })), key);
      },
      fill: function () {
        binds.forEach(function (b) { var v = state[b.key]; b.el.value = v === undefined || v === null ? '' : String(v); });
      }
    };
  };

  /**
   * An editable list of rows, one control per column.
   *   o.id      the list's id (its rows are "#<id> .rows-row"; each control has data-key)
   *   o.cols    [{key, label, type: 'text'|'number'|'date'|'select'|'check'|'textarea', options: [[value, label]],
   *              ph, size: a grid column size (default 1fr), full: true for a whole line of its own}]
   *   o.list()  the array of row objects; o.blank() a new row; o.noun "task"; o.changed() after edits
   * Returns {el, draw}; call draw() after the list was replaced.
   */
  K.rows = function (o) {
    var line = o.cols.filter(function (c) { return !c.full; });
    var tmpl = '--cols: ' + line.map(function (c) { return 'minmax(0, ' + (c.size || '1fr') + ')'; }).join(' ') + ' auto';
    var box = h('div', { class: 'rows-list', id: o.id });
    var head = h('div', { class: 'rows-head', style: tmpl, 'aria-hidden': 'true' }, line.map(function (c) { return h('span', null, c.label); }), h('span'));
    var addBtn = h('button', { class: 'btn btn-small', type: 'button', id: o.id + '-add', onclick: function () {
      o.list().push(o.blank());
      draw();
      o.changed();
      var last = U.$$('.rows-row', box).pop();
      var first = last && U.$('input, select', last);
      if (first) first.focus();
    } }, '+ Add ' + (/^[aeiou]/i.test(o.noun) ? 'an ' : 'a ') + o.noun);

    function control(row, i, c) {
      var name = c.label + ' (' + o.noun + ' ' + (i + 1) + ')', el;
      if (c.type === 'select') {
        el = h('select', { class: 'select', 'data-key': c.key, 'aria-label': name }, c.options.map(function (x) { return h('option', { value: x[0] }, x[1]); }));
        el.value = row[c.key] === undefined || row[c.key] === null ? '' : String(row[c.key]);
        el.addEventListener('change', function () { row[c.key] = el.value; o.changed(); });
      } else if (c.type === 'check') {
        el = h('input', { type: 'checkbox', 'data-key': c.key, 'aria-label': name });
        el.checked = !!row[c.key];
        el.addEventListener('change', function () { row[c.key] = el.checked; o.changed(); });
      } else if (c.type === 'textarea') {
        el = h('textarea', { class: 'input', rows: 2, 'data-key': c.key, 'aria-label': name, placeholder: c.ph || null });
        el.value = row[c.key] === undefined || row[c.key] === null ? '' : String(row[c.key]);
        el.addEventListener('input', function () { row[c.key] = el.value; o.changed(); });
      } else {
        el = h('input', { class: 'input', type: c.type === 'date' ? 'date' : 'text', inputmode: c.type === 'number' ? 'decimal' : null,
          'data-key': c.key, 'aria-label': name, placeholder: c.ph || null });
        el.value = row[c.key] === undefined || row[c.key] === null ? '' : String(row[c.key]);
        el.addEventListener('input', function () { row[c.key] = el.value; o.changed(); });
      }
      return h('label', { class: 'rows-cell' + (c.full ? ' rows-full' : '') + (c.type === 'check' ? ' rows-check' : '') },
        h('span', { class: 'rows-label' }, c.label), el);
    }

    function draw() {
      box.innerHTML = '';
      o.list().forEach(function (row, i) {
        box.appendChild(h('div', { class: 'rows-row', style: tmpl, 'data-row': i },
          line.map(function (c) { return control(row, i, c); }),
          h('button', { class: 'btn btn-small btn-ghost rows-remove', type: 'button', 'aria-label': 'Remove ' + o.noun + ' ' + (i + 1), onclick: function () {
            o.list().splice(i, 1);
            draw();
            o.changed();
          } }, '✕'),
          o.cols.filter(function (c) { return c.full; }).map(function (c) { return control(row, i, c); })));
      });
      head.hidden = !o.list().length;
    }
    draw();
    return { el: h('div', { class: 'rows' }, head, box, h('div', { class: 'row rows-actions' }, addBtn, o.extra || null)), draw: draw };
  };

  /**
   * The "Checks" card. show(found) lists [{rule, where, detail}], each described by the tool's
   * entry in data/tool-checks.js; clicking one calls focus(finding).
   */
  K.checksCard = function (toolId, okText, focus) {
    var ok = h('div', { class: 'st-ok-box' });
    var list = h('ul', { class: 'st-findings tool-findings' });
    function show(found) {
      var rules = (U.data.toolChecks || {})[toolId] || [];
      ok.innerHTML = '';
      list.innerHTML = '';
      ok.appendChild(found.length
        ? h('p', { class: 'muted', style: { marginTop: 0 } }, U.plural(found.length, 'thing') + ' to look at.' + (focus ? ' Click one to go to it.' : ''))
        : h('p', { class: 'st-ok' }, '✓ ' + okText));
      found.forEach(function (f) {
        var r = rules.filter(function (x) { return x.id === f.rule; })[0];
        if (!r) { console.error('tool check ' + toolId + '/' + f.rule + ' has no description in data/tool-checks.js'); return; }
        list.appendChild(h('li', { 'data-rule': f.rule, 'data-where': f.where || '', tabindex: 0,
          onclick: function () { if (focus) focus(f); }, onkeydown: function (e) { if (e.key === 'Enter' && focus) focus(f); } },
          f.where ? [h('span', { class: 'badge' }, f.where), ' '] : null,
          f.detail ? [h('mark', { class: 'lint-mark' }, f.detail), ' '] : null,
          h('span', { html: U.mdInline(r.msg) }), h('span', { class: 'st-fix', html: U.mdInline(r.fix) })));
      });
    }
    return { el: h('div', { class: 'card' }, h('h2', null, 'Checks'), ok, list), show: show };
  };

  /** An output card: a title, Copy and Ask Claude, and the text. o: {id, title, prompt(text) for Claude, note}. */
  K.outputCard = function (o) {
    var pre = h('pre', { class: 'st-output', id: o.id });
    var el = h('div', { class: 'card' },
      h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, o.title), h('span', { class: 'spacer' }),
        o.prompt ? h('button', { class: 'btn btn-small', id: o.id.replace(/-output$/, '') + '-claude', type: 'button', onclick: function () {
          U.askClaude(o.prompt(pre.textContent));
        } }, 'Ask Claude') : null,
        h('button', { class: 'btn btn-small btn-primary', id: o.copyId || o.id.replace(/-output$/, '') + '-copy', type: 'button', onclick: function () {
          U.copy(pre.textContent);
        } }, 'Copy')),
      o.note ? h('p', { class: 'faint', style: { margin: '6px 0 0' } }, o.note) : null,
      pre);
    return { el: el, set: function (text) { pre.textContent = text; } };
  };

  /** The row of example and Clear buttons at the top of a tool. buttons: [[id, label, fn]]. */
  K.samples = function (buttons, clearId, clear) {
    return h('div', { class: 'row st-samples' },
      buttons.map(function (b) { return h('button', { class: 'btn btn-small', id: b[0], type: 'button', onclick: b[2] }, b[1]); }),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-small btn-ghost', id: clearId, type: 'button', onclick: clear }, 'Clear'));
  };

  /** Move to a control and show it. */
  K.focus = function (el) { if (el) { el.focus(); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } };

  /** The control for one cell of a row editor: list id, row index, column key. */
  K.cell = function (listId, i, key) { return U.$('#' + listId + ' .rows-row[data-row="' + i + '"] [data-key="' + key + '"]'); };

  /** A small inline SVG element (h() makes HTML elements, which SVG ignores). */
  K.svg = function (tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] !== null && attrs[k] !== undefined) el.setAttribute(k, attrs[k]); });
    function add(k) {
      if (k === null || k === undefined || k === false) return;
      if (Array.isArray(k)) k.forEach(add);
      else el.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
    }
    for (var i = 2; i < arguments.length; i++) add(arguments[i]);
    return el;
  };
})(window.CLT);
