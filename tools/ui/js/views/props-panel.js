/*
 * views/props-panel.js - two Playground side panels.
 *
 * Properties: follows the CSS rule under the cursor. Lists the properties declared in it, then all
 *   catalogue properties by group, each with a control (a value list, a slider, a colour picker).
 *   Changing a control writes the declaration into the CSS editor; the preview follows. Groups
 *   that cannot apply to this element say why (e.g. Flexbox needs display: flex).
 *
 * Inspect: shows what the preview reported for a clicked element - its box sizes, display and the
 *   CSS rules that apply to it - and highlights its line in the HTML editor.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var FLEX = /^(inline-)?flex$/, GRID = /^(inline-)?grid$/;

  function norm(sel) { return String(sel).replace(/\s+/g, ' ').replace(/\s*([>+~,])\s*/g, '$1').trim().toLowerCase(); }
  function lastDecl(rule, prop) {
    var found = null;
    rule.decls.forEach(function (d) { if (d.prop === prop) found = d; });
    return found;
  }

  /* ===================================================================================
   * Properties panel
   * =================================================================================== */

  function createProps(o) {
    var cm = o.cssEditor.cm;
    var preview = o.preview;
    var el = h('div', { class: 'props-panel' });
    var target = h('div', { class: 'props-target', 'aria-live': 'polite' });
    var filter = h('input', { class: 'input input-small', type: 'search', placeholder: 'Find a property…', 'aria-label': 'Find a property' });
    var body = h('div', { class: 'props-body' });
    el.appendChild(h('div', { class: 'props-head' }, target, filter));
    el.appendChild(body);

    var current = null;      // {key, index, selector}
    var rows = [];           // [{name, el, set(declared), computed(v)}]
    var groupNotes = {};     // group name -> note element
    var openGroups = {};     // remembered across rebuilds
    var seq = 0;

    function targetRule() {
      var m = U.cssModel.parse(cm.getValue());
      var r = U.cssModel.ruleAt(m, cm.indexFromPos(cm.getCursor()));
      if (r && r.keyframes) r = null;
      return { model: m, rule: r, index: r ? m.rules.indexOf(r) : -1 };
    }

    function ruleNow() {
      if (!current) return null;
      var m = U.cssModel.parse(cm.getValue());
      var r = m.rules[current.index];
      if (!r || r.selector !== current.selector) {
        r = m.rules.filter(function (x) { return x.selector === current.selector; })[0] || null;
      }
      return r;
    }

    /** Write `prop: value;` into the target rule (replace the value, or add a line before "}"). */
    function setDecl(prop, value) {
      var r = ruleNow();
      if (!r) return;
      var text = cm.getValue();
      var d = lastDecl(r, prop);
      if (d && d.valueStart >= 0) {
        cm.replaceRange(value, cm.posFromIndex(d.valueStart), cm.posFromIndex(d.valueEnd), '+props');
        return;
      }
      var inner = text.slice(r.open + 1, r.close);
      var trimmed = inner.replace(/\s+$/, '');
      var at = r.open + 1 + trimmed.length;
      var indent = r.decls.length ? (/^\s*/.exec(cm.getLine(r.decls[0].line)) || [''])[0] || '  ' : '  ';
      var ins = (trimmed && !/[;{]$/.test(trimmed) ? ';' : '') + '\n' + indent + prop + ': ' + value + ';';
      if (text.slice(at, r.close).indexOf('\n') < 0) ins += '\n';
      cm.replaceRange(ins, cm.posFromIndex(at), cm.posFromIndex(at), '+props');
    }

    function removeDecl(prop) {
      var r = ruleNow();
      if (!r) return;
      var d = lastDecl(r, prop);
      if (!d) return;
      var text = cm.getValue();
      var end = d.end < text.length && text.charAt(d.end) === ';' ? d.end + 1 : d.end;
      var from = cm.posFromIndex(d.start), to = cm.posFromIndex(end);
      var lineText = cm.getLine(from.line);
      if (!lineText.slice(0, from.ch).trim() && !lineText.slice(to.line === from.line ? to.ch : lineText.length).trim()) {
        cm.replaceRange('', { line: from.line, ch: 0 }, { line: from.line + 1, ch: 0 }, '+props');
      } else {
        cm.replaceRange('', from, to, '+props');
      }
    }

    function syncTyped(ctlEl, declared) {
      if (!ctlEl || declared == null) return;
      var m = /^(-?[\d.]+)([a-z%]*)$/i.exec(String(declared).trim());
      var range = ctlEl.querySelector('input[type=range]'), num = ctlEl.querySelector('input[type=number]');
      var unit = ctlEl.querySelector('select');
      // a colour control is the <input type=color> itself, so querySelector (which searches inside) would miss it
      var col = ctlEl.matches('input[type=color]') ? ctlEl : ctlEl.querySelector('input[type=color]');
      if (m && range && num) {
        if (document.activeElement !== range) range.value = m[1];
        if (document.activeElement !== num) num.value = m[1];
        if (unit && m[2] && [].some.call(unit.options, function (op) { return op.value === m[2]; })) unit.value = m[2];
      } else if (col && ctlEl.contains(col) && document.activeElement !== col) {
        col.value = U.editorAssist.toHex(declared);
      }
    }

    function makeRow(name) {
      var p = U.find('cssProperties', name);
      var row = h('div', { class: 'prop-row', 'data-prop': name });
      var label = h('span', { class: 'prop-name', tabindex: '0' }, name);
      function tipOn(e) {
        var r = label.getBoundingClientRect();
        U.editorAssist.showTip(U.editorAssist.cssPropTip(name), e && e.clientX ? e.clientX : r.left, r.bottom - 10);
      }
      label.addEventListener('mouseenter', tipOn);
      label.addEventListener('focus', tipOn);
      label.addEventListener('mouseleave', U.editorAssist.hideTipSoon);
      label.addEventListener('blur', U.editorAssist.hideTipSoon);

      var sel = h('select', { class: 'select input-small', 'aria-label': name + ' value' });
      sel.appendChild(h('option', { value: '' }, '- not set -'));
      (p ? p.values : []).forEach(function (v) { sel.appendChild(h('option', { value: v.value, title: U.editorAssist.plain(v.desc) }, v.value)); });
      (U.data.cssGlobalValues || []).forEach(function (v) { sel.appendChild(h('option', { value: v.value, title: U.editorAssist.plain(v.desc) }, v.value)); });
      var custom = null;
      sel.addEventListener('change', function () { if (sel.value === '') removeDecl(name); else setDecl(name, sel.value); });

      var typed = null;
      var spec = p && (p.inputs || []).filter(function (s) { return s.type !== 'builder'; })[0];
      if (spec && U.cssControls) typed = U.cssControls.part(spec, function () { setDecl(name, typed.get()); });

      var computedEl = h('span', { class: 'prop-computed' });
      var rm = h('button', { class: 'btn btn-small btn-ghost prop-rm', type: 'button', title: 'Remove ' + name + ' from this rule', 'aria-label': 'Remove ' + name }, '×');
      rm.addEventListener('click', function () { removeDecl(name); });
      row.appendChild(h('div', { class: 'prop-line' }, label, computedEl, rm));
      row.appendChild(h('div', { class: 'prop-ctl' }, sel, typed ? typed.el : null));

      return {
        name: name, el: row,
        set: function (declared) {
          row.classList.toggle('is-set', declared != null);
          rm.hidden = declared == null;
          if (document.activeElement === sel) return;
          if (declared == null) { sel.value = ''; return; }
          var has = [].some.call(sel.options, function (op) { return op.value === declared; });
          if (!has) {
            if (!custom) { custom = h('option', { value: declared }, declared); sel.insertBefore(custom, sel.options[1]); }
            custom.value = custom.textContent = declared;
          }
          sel.value = declared;
          syncTyped(typed && typed.el, declared);
        },
        computed: function (v) { computedEl.textContent = v ? 'now: ' + v : ''; computedEl.title = v ? 'What the browser is using right now' : ''; }
      };
    }

    function section(title, open, key) {
      var d = h('details', { class: 'fold props-group', open: open });
      var note = h('span', { class: 'props-note' });
      d.appendChild(h('summary', null, title, note));
      if (key) {
        groupNotes[key] = note;
        d.addEventListener('toggle', function () { openGroups[key] = d.open; });
      }
      return d;
    }

    function build(rule) {
      body.innerHTML = '';
      rows = [];
      groupNotes = {};
      var declared = [];
      rule.decls.forEach(function (d) { if (declared.indexOf(d.prop) < 0 && d.value !== null) declared.push(d.prop); });
      var inRule = section('In this rule (' + declared.length + ')', true, null);
      if (!declared.length) inRule.appendChild(h('p', { class: 'faint' }, 'Nothing yet. Open a group below and pick a value.'));
      declared.forEach(function (n) { var r = makeRow(n); rows.push(r); inRule.appendChild(r.el); });
      body.appendChild(inRule);
      var order = (U.cssRef && U.cssRef.ORDER) || [];
      order.forEach(function (g) {
        var props = (U.data.cssProperties || []).filter(function (p) { return p.group === g; });
        if (!props.length) return;
        var sec = section(g + ' (' + props.length + ')', !!openGroups[g], g);
        props.forEach(function (p) { var r = makeRow(p.name); rows.push(r); sec.appendChild(r.el); });
        body.appendChild(sec);
      });
      applyFilter();
    }

    function applyFilter() {
      var q = filter.value.trim().toLowerCase();
      rows.forEach(function (r) { r.el.hidden = !!q && r.name.indexOf(q) < 0; });
      if (q) U.$$('details.props-group', body).forEach(function (d) { d.open = true; });
    }
    filter.addEventListener('input', applyFilter);

    function update(rule) {
      rows.forEach(function (r) {
        var d = lastDecl(rule, r.name);
        r.set(d && d.value !== null ? d.value : null);
      });
      var mine = ++seq;
      var sel = U.cssModel.matchableSelector(rule.selector);
      preview.ask({
        type: 'eval',
        code: 'function (doc) { var e; try { e = doc.querySelectorAll(' + JSON.stringify(sel) + '); } catch (x) { return { invalid: true }; }' +
          ' if (!e.length) return { count: 0 }; var f = e[0], c = getComputedStyle(f), p = f.parentElement ? getComputedStyle(f.parentElement) : null;' +
          ' var names = ' + JSON.stringify(rows.map(function (r) { return r.name; })) + ', vals = {};' +
          ' names.forEach(function (n) { vals[n] = c.getPropertyValue(n).trim(); });' +
          ' return { count: e.length, tag: f.tagName.toLowerCase(), display: c.display, position: c.position, parentDisplay: p ? p.display : "block", values: vals }; }'
      }).then(function (res) {
        if (mine !== seq || !res) return;
        var head = h('div', null, h('code', null, rule.selector),
          h('span', { class: 'faint' }, res.invalid ? ' - not a valid selector' : ' - matches ' + res.count + ' element' + (res.count === 1 ? '' : 's') + (res.tag ? ' (first: <' + res.tag + '>)' : '')));
        target.innerHTML = '';
        target.appendChild(head);
        rows.forEach(function (r) { r.computed(res.values ? res.values[r.name] : ''); });
        var flexOk = FLEX.test(res.display || '') || FLEX.test(res.parentDisplay || '');
        var gridOk = GRID.test(res.display || '') || GRID.test(res.parentDisplay || '');
        if (groupNotes.Flexbox) groupNotes.Flexbox.textContent = res.count && !flexOk ? ' - not active: not a flex container (display: ' + res.display + ') and its parent is not one either' : '';
        if (groupNotes.Grid) groupNotes.Grid.textContent = res.count && !gridOk ? ' - not active: not a grid container (display: ' + res.display + ') and its parent is not one either' : '';
        if (groupNotes.Positioning) groupNotes.Positioning.textContent = res.count && res.position === 'static' ? ' - top/left/z-index need position other than static' : '';
      });
    }

    function sync() {
      var t = targetRule();
      if (!t.rule) {
        current = null;
        target.innerHTML = '';
        target.appendChild(h('span', { class: 'faint' }, 'Put the cursor inside a CSS rule (between { and }), or use Inspect to pick an element.'));
        body.innerHTML = '';
        rows = [];
        return;
      }
      var key = t.index + '|' + t.rule.selector;
      if (!current || current.key !== key) {
        current = { key: key, index: t.index, selector: t.rule.selector };
        build(t.rule);
      }
      update(t.rule);
    }
    var syncSoon = U.debounce(sync, 150);
    cm.on('cursorActivity', syncSoon);
    cm.on('change', syncSoon);
    sync();
    return { el: el, refresh: syncSoon, sync: sync };
  }

  /* ===================================================================================
   * Inspect panel
   * =================================================================================== */

  function createInspector(o) {
    var el = h('div', { class: 'inspect-panel' });
    var marked = null;
    function empty() {
      el.innerHTML = '';
      el.appendChild(h('p', { class: 'faint' }, 'Press "Inspect" above the preview, then click anything in the preview to see its size, its box and the CSS rules that style it.'));
    }
    function highlight(info) {
      var cmH = o.htmlEditor.cm;
      if (marked !== null) { cmH.removeLineClass(marked, 'wrap', 'inspect-line'); marked = null; }
      if (!info) return;
      var src = cmH.getValue().replace(/<!--[\s\S]*?-->/g, function (c) { return c.replace(/[^\n]/g, ' '); });
      var re = new RegExp('<' + info.tag + '(?=[\\s>/])', 'gi'), m, n = 0;
      while ((m = re.exec(src))) {
        if (n === info.index) {
          marked = cmH.posFromIndex(m.index).line;
          cmH.addLineClass(marked, 'wrap', 'inspect-line');
          cmH.scrollIntoView({ line: marked, ch: 0 }, 60);
          return;
        }
        n++;
      }
    }
    function goToRule(rule) {
      var cm = o.cssEditor.cm;
      var model = U.cssModel.parse(cm.getValue());
      var want = norm(rule.selector);
      var r = model.rules.filter(function (x) { return norm(x.selector) === want && (!rule.media || norm(x.media || '').indexOf(norm(rule.media)) >= 0); })[0] ||
        model.rules.filter(function (x) { return norm(x.selector) === want; })[0];
      if (!r) { U.toast('That rule is not in the CSS editor'); return; }
      var pos = cm.posFromIndex(r.open + 1);
      if (r.decls.length) pos = cm.posFromIndex(r.decls[0].start);
      cm.focus();
      cm.setCursor(pos);
      cm.scrollIntoView(pos, 80);
      if (o.onRule) o.onRule();
    }
    function four(a) { return a.join(' / '); }
    function show(info) {
      el.innerHTML = '';
      highlight(info);
      if (!info) { empty(); return; }
      var name = '<' + info.tag + (info.id ? '#' + info.id : '') + (info.classes.length ? '.' + info.classes.join('.') : '') + '>';
      el.appendChild(h('div', { class: 'inspect-title' }, h('code', null, name), info.text ? h('span', { class: 'faint' }, ' "' + info.text + '"') : null));
      el.appendChild(h('div', { class: 'facts' },
        h('span', null, 'display: ', h('b', null, info.display)),
        h('span', null, 'position: ', h('b', null, info.position)),
        h('span', null, 'size: ', h('b', null, info.width + ' × ' + info.height + 'px'))));
      // a small box-model picture with the real numbers
      function layer(cls, tag, v, inner) {
        return '<div class="bm-layer ' + cls + '"><span class="bm-tag">' + tag + '</span><span class="bm-n t">' + v[0] + '</span><span class="bm-n r">' + v[1] + '</span>' +
          '<span class="bm-n b">' + v[2] + '</span><span class="bm-n l">' + v[3] + '</span>' + inner + '</div>';
      }
      el.appendChild(h('div', {
        class: 'bm bm-small', title: 'margin ' + four(info.margin) + ' · border ' + four(info.border) + ' · padding ' + four(info.padding),
        html: layer('bm-margin', 'margin', info.margin, layer('bm-border', 'border', info.border, layer('bm-padding', 'padding', info.padding,
          '<div class="bm-content">' + info.contentWidth + ' × ' + info.contentHeight + '</div>')))
      }));
      el.appendChild(h('h4', { style: { margin: '12px 0 6px' } }, 'CSS rules that style it (later ones win ties)'));
      if (!info.rules.length) {
        el.appendChild(h('p', { class: 'faint' }, 'No rule in your CSS matches this element: it only has the browser\'s default styles. Add one, e.g. ' +
          (info.classes.length ? '.' + info.classes[0] : info.tag) + ' { … }.'));
      }
      info.rules.forEach(function (r) {
        var spec = U.specificity ? U.specificity(r.matched[0])[0] : null;
        el.appendChild(h('button', { class: 'inspect-rule', type: 'button', onclick: function () { goToRule(r); } },
          h('code', null, r.selector),
          r.media ? h('span', { class: 'badge' }, '@media ' + r.media) : null,
          spec ? h('span', { class: 'badge badge-accent', title: 'specificity (ids, classes, types)' }, spec.a + ',' + spec.b + ',' + spec.c) : null,
          h('span', { class: 'faint' }, 'edit →')));
      });
    }
    empty();
    return { el: el, show: show, clear: function () { highlight(null); empty(); } };
  }

  U.propsPanel = { create: createProps };
  U.inspector = { create: createInspector };
})(window.UILT);
