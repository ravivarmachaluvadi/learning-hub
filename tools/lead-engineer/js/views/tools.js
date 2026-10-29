/*
 * views/tools.js - the tool list (#/tools), the frame around one tool (#/tools/<id>), and the
 * building blocks the tools share (LELT.toolKit).
 *
 * Each tool's screen lives in js/views/tools/<id>.js and registers itself as
 * LELT.tools[id] = {render(container, query)}. Its title, track and "why" come from data/tools.js.
 * The list page also shows the playbooks (js/views/playbooks.js), which live under the Tools tab.
 *
 * The planning tools (batch 2 on) also expose their arithmetic and checks, so the tests can run them
 * without the screen:
 *   EMPTY            the blank state
 *   compute(state)   the numbers the screen shows
 *   check(state)     what to fix, as [{rule, where}]; each rule's message and fix are data
 *                    (data/tool-checks.js), and `rules` lists every rule the code can raise
 */
(function (U) {
  'use strict';
  var h = U.h;

  function listPage(root) {
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Tools'),
      h('p', null, 'Working tools for the real job, not exercises. Everything you type stays in this browser, and each tool gives you text to copy into Slack, Teams or email.')));
    root.appendChild(h('div', { class: 'cards' }, (U.data.tools || []).map(function (t) {
      return h('a', { class: 'card tool-card', href: '#/tools/' + t.id, 'data-id': t.id },
        h('div', { class: 'row' }, U.trackBadge(t.track)),
        h('h3', null, t.title),
        h('p', { class: 'muted' }, t.summary));
    })));
    if ((U.data.playbooks || []).length) {
      root.appendChild(h('h2', null, 'Playbooks'));
      root.appendChild(h('p', { class: 'muted' }, 'Step-by-step guides: for the meetings a lead runs, an agenda timed for your Sprint, what to say at each step and what to send afterwards; for someone joining or leaving, a plan dated from their first or last day.'));
      root.appendChild(U.views.playbooks.cards());
    }
    root.appendChild(h('h2', null, 'Practice and progress'));
    root.appendChild(h('div', { class: 'cards' },
      h('a', { class: 'card', href: '#/week' }, h('h3', null, 'A week as a lead'), h('p', { class: 'muted' }, 'Twelve mixed scenarios over Monday to Friday, scored area by area against how you rated yourself.')),
      h('a', { class: 'card', href: '#/progress' }, h('h3', null, 'Your progress'), h('p', { class: 'muted' }, 'Everything you have done here, per area, with what to do next.')),
      h('a', { class: 'card', href: '#/reading' }, h('h3', null, 'Reading list'), h('p', { class: 'muted' }, 'The books, articles and guides behind the lessons, with five to start with.'))));
  }

  U.views.tools = {
    render: function (root, params, query) {
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
      U.tools[t.id].render(body, query || {});
    },
    destroy: function () {
      Object.keys(U.tools).forEach(function (k) { if (U.tools[k].destroy) U.tools[k].destroy(); });
    }
  };
  U.route('tools', U.views.tools);

  /* ---------- the toolkit ---------- */

  var K = U.toolKit = {};

  K.clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  /** The tool's saved state ("lelt.tool.<id>") laid over its empty state. */
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
   * the arithmetic reads numbers with LELT.plan.num. Call fill() after the state was replaced.
   */
  K.form = function (state, changed) {
    var binds = [], grows = [];
    function bind(el, key, read) {
      binds.push({ el: el, key: key });
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () { state[key] = read ? read(el) : el.value; changed(); });
      return el;
    }
    return {
      input: function (key, attrs) { return bind(h('input', Object.assign({ class: 'input' }, attrs)), key); },
      /** attrs.grow: the box grows to show all its text (from attrs.rows lines) instead of scrolling. */
      textarea: function (key, attrs) {
        var a = Object.assign({ class: 'input' }, attrs), grow = a.grow;
        delete a.grow;
        var el = bind(h('textarea', a), key);
        if (grow) {
          el.dataset.min = String(+a.rows || 2);
          grows.push(el);
          el.addEventListener('input', function () { K.fit(el, +el.dataset.min); });
        }
        return el;
      },
      select: function (key, options, attrs) {
        return bind(h('select', Object.assign({ class: 'select' }, attrs), options.map(function (o) { return h('option', { value: o[0] }, o[1]); })), key);
      },
      fill: function () {
        binds.forEach(function (b) { var v = state[b.key]; b.el.value = v === undefined || v === null ? '' : String(v); });
        grows.forEach(function (el) { K.fit(el, +el.dataset.min); });
      }
    };
  };

  /** Grow a textarea to show all its text, from `min` lines up to `max`, once it is on the page. */
  K.fit = function (el, min, max, later) {
    if (!el.isConnected) {
      if (!later) requestAnimationFrame(function () { K.fit(el, min, max, true); });
      return;
    }
    el.rows = min;
    while (el.scrollHeight > el.clientHeight + 1 && el.rows < (max || 14)) el.rows++;
  };

  /**
   * An editable list of rows, one control per column.
   *   o.id      the list's id (its rows are "#<id> .rows-row"; each control has data-key)
   *   o.cols    [{key, label, type: 'text'|'number'|'date'|'select'|'check'|'textarea', options: [[value, label]],
   *              ph, size: a grid column size (default 1fr), full: true for a whole line of its own under
   *              the row ('top': above it), rows: a textarea's lines (it grows to fit its text)}]
   *   o.list()  the array of row objects; o.blank() a new row; o.noun "task"; o.changed() after edits
   * Returns {el, draw}; call draw() after the list was replaced.
   */
  K.rows = function (o) {
    var line = o.cols.filter(function (c) { return !c.full; });
    var tmpl = '--cols: ' + line.map(function (c) { return 'minmax(0, ' + (c.size || '1fr') + ')'; }).join(' ') + ' auto';
    // with a cell above each row, every cell shows its own label instead of one header for the list
    var labelled = o.cols.some(function (c) { return c.full === 'top'; });
    var box = h('div', { class: 'rows-list' + (labelled ? ' rows-labelled' : ''), id: o.id });
    var head = h('div', { class: 'rows-head', style: tmpl, 'aria-hidden': 'true' }, line.map(function (c) { return h('span', null, c.label); }), h('span'));
    var addBtn = h('button', { class: 'btn btn-small', type: 'button', id: o.id + '-add', onclick: function () {
      o.list().push(o.blank());
      draw();
      o.changed();
      var last = U.$$('.rows-row', box).pop();
      var first = last && U.$('input, select, textarea', last);
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
        el = h('textarea', { class: 'input', rows: c.rows || 2, 'data-key': c.key, 'aria-label': name, placeholder: c.ph || null });
        el.value = row[c.key] === undefined || row[c.key] === null ? '' : String(row[c.key]);
        el.addEventListener('input', function () { row[c.key] = el.value; K.fit(el, c.rows || 2, 6); o.changed(); });
        K.fit(el, c.rows || 2, 6);
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
          o.cols.filter(function (c) { return c.full === 'top'; }).map(function (c) { return control(row, i, c); }),
          line.map(function (c) { return control(row, i, c); }),
          h('button', { class: 'btn btn-small btn-ghost rows-remove', type: 'button', 'aria-label': 'Remove ' + o.noun + ' ' + (i + 1), onclick: function () {
            o.list().splice(i, 1);
            draw();
            o.changed();
          } }, '✕'),
          o.cols.filter(function (c) { return c.full && c.full !== 'top'; }).map(function (c) { return control(row, i, c); })));
      });
      head.hidden = !o.list().length || labelled;
    }
    draw();
    return { el: h('div', { class: 'rows' }, head, box, h('div', { class: 'row rows-actions' }, addBtn, o.extra || null)), draw: draw };
  };

  /**
   * The "Checks" card. show(found) lists [{rule, where, detail, msg, fix}], each described by the
   * tool's entry in data/tool-checks.js (a finding's own msg or fix, such as a wording rule's,
   * replaces the check's); clicking one calls focus(finding).
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
          h('span', null, f.msg || r.msg), h('span', { class: 'st-fix' }, f.fix || r.fix)));
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

  /**
   * A document built from its sections (data/docs.js): bodies is {sectionKey: text}. Every required
   * section appears under its "## " heading, with "[what to write]" while it is empty; an optional
   * section appears once it has text.
   */
  K.docText = function (toolId, bodies) {
    return ((U.data.docSections || {})[toolId] || []).map(function (x) {
      var body = String(bodies[x.key] === undefined || bodies[x.key] === null ? '' : bodies[x.key]).trim();
      if (!body && !x.req) return null;
      return '## ' + x.title + '\n' + (body || '[' + (x.ph || x.title) + ']');
    }).filter(Boolean).join('\n\n');
  };

  /** The required sections that are still empty, as findings of `rule` (key: the section's key). */
  K.docMissing = function (toolId, bodies, rule) {
    return ((U.data.docSections || {})[toolId] || []).filter(function (x) {
      return x.req && !String(bodies[x.key] === undefined || bodies[x.key] === null ? '' : bodies[x.key]).trim();
    }).map(function (x) { return { rule: rule, where: x.title, key: x.key }; });
  };

  /** "Why each section is there": every section of the document with its reason. */
  K.docParts = function (toolId, id) {
    return U.section('Why each section is there', h('ul', { class: 'tp-parts', id: id }, ((U.data.docSections || {})[toolId] || []).map(function (x) {
      return h('li', null, h('b', null, x.title + (x.req ? '' : ' (optional)') + ': '), x.why);
    })), false);
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

  /** The width to draw a chart at: the width of its box, so its text stays the size it was written at. */
  K.chartWidth = function (box, max) { return Math.round(Math.max(300, Math.min(max || 560, (box && box.clientWidth) || max || 520))); };

  /** A histogram of simulated outcomes with P50 and P85 lines. sorted: the trials, sorted; width: see chartWidth. */
  K.histogram = function (sorted, p50, p85, unit, cls, width) {
    var W = width || 520, H = 184, padL = 8, padR = 8, padB = 34, top = 30;
    var svg = K.svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'hist ' + (cls || ''), role: 'img',
      'aria-label': 'How often each outcome came up: half the trials finished within ' + U.plan.fixed(p50) + ' ' + unit + ', 85% within ' + U.plan.fixed(p85) });
    if (!sorted.length) return svg;
    var hist = U.plan.histogram(sorted, 24);
    var maxC = Math.max.apply(null, hist.bins.map(function (b) { return b.count; })) || 1;
    var span = (hist.max - hist.min) || 1, inner = W - padL - padR;
    function x(v) { return padL + (v - hist.min) / span * inner; }
    hist.bins.forEach(function (b) {
      var bh = b.count / maxC * (H - padB - top);
      svg.appendChild(K.svg('rect', { class: 'hist-bar' + (b.to <= p85 + 1e-9 ? ' in85' : ''), x: x(b.from) + 1, y: H - padB - bh,
        width: Math.max(1, inner / hist.bins.length - 2), height: bh }));
    });
    svg.appendChild(K.svg('line', { class: 'hist-axis', x1: padL, x2: W - padR, y1: H - padB, y2: H - padB }));
    // P50 is labelled to the left of its line and P85 to the right, so close values do not overlap
    [[p50, 'P50', -4, 'end'], [p85, 'P85', 4, 'start']].forEach(function (m) {
      var px = x(m[0]);
      svg.appendChild(K.svg('line', { class: 'hist-mark', x1: px, x2: px, y1: top - 4, y2: H - padB }));
      svg.appendChild(K.svg('text', { class: 'hist-label', x: px + m[2], y: top - 12, 'text-anchor': m[3] }, m[1] + ' ' + U.plan.fixed(m[0])));
    });
    svg.appendChild(K.svg('text', { class: 'hist-tick', x: padL, y: H - 12 }, U.plan.fixed(hist.min) + ' ' + unit));
    svg.appendChild(K.svg('text', { class: 'hist-tick', x: W - padR, y: H - 12, 'text-anchor': 'end' }, U.plan.fixed(hist.max) + ' ' + unit));
    return svg;
  };
})(window.LELT);
