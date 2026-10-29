/*
 * editor-assist.js - "learn while you type" for every code editor.
 *
 *   Autocomplete from the tool's own catalogue: only the values a CSS property accepts, the
 *     attributes an HTML tag has, each with its description. Ctrl+Space opens it any time.
 *   Live try: moving through a value list with Up/Down previews each value (host's onTry);
 *     Esc puts the real code back.
 *   Hover tooltips on CSS properties, values and selectors, HTML tags, attributes and values,
 *     and JavaScript DOM methods. Ctrl+click opens the reference page.
 *   Number scrubbing: Alt+Up / Alt+Down on a number (Shift: x10, Ctrl: x0.1).
 *   Colour swatches: a little square before each colour; click it to pick a new one.
 *   Warnings gutter: "why doesn't this line do anything?" (computed in the preview, see lintCss),
 *     and for JavaScript: misspelt names, == instead of ===, event names that never fire, and
 *     selectors that find nothing in the page (see lintJs).
 *
 * js/editor.js calls attach(cm, mode, opts) for each editable editor.
 */
(function (U) {
  'use strict';
  var h = U.h;
  function CM() { return window.CodeMirror; }

  /* ===================================================================================
   * Catalogue lookups
   * =================================================================================== */

  var TAG_ALIAS = { h2: 'h1', h3: 'h1', h4: 'h1', h5: 'h1', h6: 'h1', dt: 'dl', dd: 'dl', source: 'picture', figcaption: 'figure' };
  function cssProp(name) { return name ? U.find('cssProperties', String(name).toLowerCase()) : null; }
  function htmlEl(tag) { tag = String(tag || '').toLowerCase(); return U.find('htmlElements', TAG_ALIAS[tag] || tag); }
  function htmlAttr(tag, name) {
    name = String(name || '').toLowerCase();
    var el = htmlEl(tag);
    var own = el && (el.attributes || []).filter(function (a) { return a.name === name; })[0];
    if (own) return { attr: own, entry: el };
    var g = (U.data.htmlGlobalAttrs || []).filter(function (a) { return a.name === name; })[0];
    if (g) return { attr: g, entry: el, global: true };
    if (/^data-/.test(name)) return { attr: { name: name, kind: 'text', desc: 'A `data-` attribute is yours to invent: extra information for JavaScript (`el.dataset`) and CSS (`[' + name + ']`).' }, entry: el, global: true };
    if (/^on[a-z]+$/.test(name)) return { attr: { name: name, kind: 'text', desc: 'An inline event handler: JavaScript that runs on the `' + name.slice(2) + '` event. `addEventListener` in a script is the cleaner way.' }, entry: el, global: true };
    return null;
  }

  var plainCache = {};
  function plain(md) {
    if (!md) return '';
    if (plainCache[md]) return plainCache[md];
    var d = document.createElement('div');
    d.innerHTML = U.md(md);
    return (plainCache[md] = d.textContent.replace(/\s+/g, ' ').trim());
  }
  function shortOf(md, n) {
    var t = plain(md);
    var cut = t.search(/[.:;]\s/);
    if (cut > 0 && cut < (n || 70)) t = t.slice(0, cut);
    return t.length > (n || 70) ? t.slice(0, (n || 70) - 1) + '…' : t;
  }

  var UNITS = {
    px: 'CSS pixels - a fixed size.', em: 'multiples of the element\'s own font size.', rem: 'multiples of the root (html) font size, usually 16px.',
    '%': 'a percentage of something - usually the parent\'s size.', vw: '1% of the viewport width.', vh: '1% of the viewport height.',
    fr: 'a fraction of the free space in a grid.', s: 'seconds.', ms: 'milliseconds.', deg: 'degrees (360 = a full turn).', turn: 'full turns.', ch: 'the width of a "0" in the current font.'
  };

  /* ===================================================================================
   * Autocomplete
   * =================================================================================== */

  var info = null; // the description box next to the hint list
  function showInfo(item, node) {
    if (!item || !item.info || !node || !node.parentNode) { hideInfo(); return; }
    if (!info) { info = h('div', { class: 'hint-info', role: 'note' }); document.body.appendChild(info); }
    info.innerHTML = '';
    info.appendChild(h('div', { class: 'hint-info-title' }, item.info.title,
      item.example ? h('span', { class: 'badge', style: { marginLeft: '6px' } }, 'example value') : null));
    info.appendChild(h('div', { class: 'hint-info-body', html: item.info.html || '' }));
    if (item.info.foot) info.appendChild(h('div', { class: 'hint-info-foot' }, item.info.foot));
    var r = node.parentNode.getBoundingClientRect();
    info.style.display = 'block';
    var w = Math.min(340, window.innerWidth - 24);
    var left = r.right + 6;
    if (left + w > window.innerWidth - 8) left = Math.max(8, r.left - w - 6);
    info.style.left = left + 'px';
    info.style.top = Math.max(8, Math.min(r.top, window.innerHeight - info.offsetHeight - 8)) + 'px';
    info.style.width = w + 'px';
  }
  function hideInfo() { if (info) info.style.display = 'none'; }

  function renderItem(el, self, item) {
    el.setAttribute('data-value', item.value);
    el.appendChild(h('span', { class: 'hint-text' + (item.example ? ' hint-example' : '') }, item.label || item.value));
    if (item.short) el.appendChild(h('span', { class: 'hint-desc' }, item.short));
  }

  /** Wrap a list into show-hint data, wiring the live try and the info box. */
  function finish(cm, list, fromIdx, toIdx, selected) {
    if (!list.length) return null;
    list.forEach(function (it) { it.render = renderItem; if (it.text === undefined) it.text = it.value; });
    var data = { list: list, from: cm.posFromIndex(fromIdx), to: cm.posFromIndex(toIdx), selectedHint: Math.max(0, selected || 0) };
    var st = cm.state.uiltAssist || {};
    var first = true, tried = false;
    function restore() { if (tried && st.onTry) { tried = false; st.onTry(null); } }
    CM().on(data, 'select', function (item, node) {
      showInfo(item, node);
      if (first) { first = false; return; } // the automatic first highlight is not a choice
      if (st.onTry && item.tryText !== undefined) {
        var full = cm.getValue(), a = cm.indexFromPos(data.from), b = cm.indexFromPos(data.to);
        tried = true;
        st.onTry(full.slice(0, a) + item.tryText + full.slice(b));
      }
    });
    CM().on(data, 'update', function () { hideInfo(); restore(); });
    CM().on(data, 'close', function () { hideInfo(); restore(); });
    return data;
  }

  function openSoon(cm) { setTimeout(function () { if (cm.showHint) cm.showHint({ completeSingle: false }); }, 20); }

  /* ---------- CSS ---------- */

  /** The CSS variables (custom properties) declared in a stylesheet, first declaration of each. */
  function cssVariables(text) {
    var out = [], seen = {};
    U.cssModel.parse(text).rules.forEach(function (r) {
      r.decls.forEach(function (d) {
        if (d.prop.indexOf('--') !== 0 || d.value === null || seen[d.prop]) return;
        seen[d.prop] = true;
        out.push({ name: d.prop, value: d.value, line: d.line, selector: r.selector });
      });
    });
    return out;
  }

  /** Inside "var(": the variables this stylesheet declares. */
  function cssVarList(cm, base, idx, typed) {
    var rest = /^[\w-]*/.exec(base.text.slice(idx))[0];
    var list = cssVariables(base.text).filter(function (v) { return v.name.indexOf(typed.toLowerCase()) === 0; }).map(function (v) {
      return {
        value: v.name, short: v.value, tryText: v.name,
        info: { title: 'var(' + v.name + ')', html: U.md('Declared in `' + v.selector + '`, line ' + (v.line + 1) + ': `' + v.name + ': ' + v.value + '`'), foot: 'Use ↑ ↓ to preview each variable, Enter to keep it, Esc to undo.' }
      };
    });
    return finish(cm, list, base.offset + idx - typed.length, base.offset + idx + rest.length, 0);
  }

  function cssValueList(cm, base, ctx, idx) {
    var inVar = /var\(\s*(-{0,2}[\w-]*)$/i.exec(base.text.slice(ctx.valueStart, idx));
    if (inVar) return cssVarList(cm, base, idx, inVar[1]);
    var p = cssProp(ctx.prop);
    if (!p) return CM().hint.css ? CM().hint.css(cm) : null;
    var typed = base.text.slice(ctx.valueStart, idx).trim().toLowerCase();
    var whole = base.text.slice(ctx.valueStart, ctx.valueEnd).trim().toLowerCase();
    var items = p.values.map(function (v) { return { value: v.value, desc: v.desc, example: !!v.example }; })
      .concat((U.data.cssGlobalValues || []).map(function (g) { return { value: g.value, desc: g.desc, global: true }; }));
    var list = items, selected = 0;
    var exact = items.map(function (it) { return it.value.toLowerCase(); }).indexOf(whole);
    if (exact >= 0) selected = exact;                       // a complete value: show them all, starting there
    else if (typed) {
      list = items.filter(function (it) { return it.value.toLowerCase().indexOf(typed) === 0; })
        .concat(items.filter(function (it) { return it.value.toLowerCase().indexOf(typed) > 0; }));
      if (!list.length) list = items;
    }
    return finish(cm, list.map(function (it) {
      return {
        value: it.value, short: shortOf(it.desc), example: it.example, tryText: it.value,
        info: { title: p.name + ': ' + it.value, html: U.md(it.desc), foot: it.global ? 'Works on every property.' : 'Use ↑ ↓ to preview each value, Enter to keep it, Esc to undo.' }
      };
    }), base.offset + ctx.valueStart, base.offset + ctx.valueEnd, selected);
  }

  var extraProps = null;
  function cssPropertyNames() {
    if (extraProps) return extraProps;
    var spec = CM().resolveMode ? CM().resolveMode('text/css') : {};
    var known = {};
    (U.data.cssProperties || []).forEach(function (p) { known[p.name] = true; });
    extraProps = Object.keys(spec.propertyKeywords || {}).filter(function (n) { return !known[n]; }).sort();
    return extraProps;
  }

  function cssPropertyList(cm, base, ctx, idx) {
    var typed = base.text.slice(ctx.start, idx).toLowerCase();
    var after = base.text.slice(ctx.end, ctx.end + 40);
    var hasColon = /^\s*:/.test(after);
    var cat = (U.data.cssProperties || []).slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; });
    var pick = cat.filter(function (p) { return !typed || p.name.indexOf(typed) === 0; })
      .concat(typed ? cat.filter(function (p) { return p.name.indexOf(typed) > 0; }) : []);
    var others = cssPropertyNames().filter(function (n) { return typed && n.indexOf(typed) === 0; });
    var list = pick.map(function (p) {
      return { value: p.name, short: p.short || shortOf(p.summary), info: { title: p.name, html: U.md(p.summary), foot: 'Initial value: ' + p.initial + ' · ' + (p.inherited ? 'inherited' : 'not inherited') }, prop: p.name };
    }).concat(others.map(function (n) { return { value: n, short: '', prop: n }; }));
    list.forEach(function (it) {
      it.hint = function (c, data, self) {
        c.replaceRange(self.prop + (hasColon ? '' : ': '), self.from || data.from, self.to || data.to, 'complete');
        if (!hasColon) openSoon(c);
      };
    });
    return finish(cm, list, base.offset + ctx.start, base.offset + ctx.end, 0);
  }

  function cssHint(cm, base) {
    var idx = cm.indexFromPos(cm.getCursor()) - base.offset;
    if (idx < 0 || idx > base.text.length) return null;
    var ctx = U.cssModel.context(base.text, idx);
    if (ctx.kind === 'value') return cssValueList(cm, base, ctx, idx);
    if (ctx.kind === 'property') return cssPropertyList(cm, base, ctx, idx);
    return null;
  }

  /* ---------- HTML ---------- */

  function quotesOpen(s) {
    var dq = 0, sq = 0;
    for (var i = 0; i < s.length; i++) { var c = s.charAt(i); if (c === '"' && sq % 2 === 0) dq++; else if (c === "'" && dq % 2 === 0) sq++; }
    return dq % 2 === 1 || sq % 2 === 1;
  }

  /** If idx is inside a <style> element or a style="" attribute, the CSS there: {text, offset, body}. */
  function cssRegionAt(doc, idx) {
    var re = /<style[^>]*>([\s\S]*?)(<\/style>|$)/gi, m;
    while ((m = re.exec(doc))) {
      var start = m.index + m[0].indexOf('>') + 1, end = start + m[1].length;
      if (idx >= start && idx <= end) return { text: doc.slice(start, end), offset: start };
      if (m[0].length === 0) re.lastIndex++;
    }
    var sa = /\sstyle\s*=\s*(["'])([^"']*)/gi;
    while ((m = sa.exec(doc))) {
      var vs = m.index + m[0].length - m[2].length;
      if (idx >= vs && idx <= vs + m[2].length) return { text: '{' + m[2] + '}', offset: vs - 1, body: true };
    }
    return null;
  }

  function tagList(cm, fromIdx, toIdx, typed) {
    var items = [];
    (U.data.htmlElements || []).forEach(function (e) {
      var tags = e.tag === 'h1' ? ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] : e.tag === 'dl' ? ['dl', 'dt', 'dd'] :
        e.tag === 'picture' ? ['picture', 'source'] : e.tag === 'figure' ? ['figure', 'figcaption'] : [e.tag];
      tags.forEach(function (t) { items.push({ value: t, short: e.short || shortOf(e.summary), info: { title: '<' + t + '>', html: U.md(e.summary), foot: 'Default display: ' + e.display } }); });
    });
    var known = {};
    items.forEach(function (it) { known[it.value] = true; });
    Object.keys(CM().htmlSchema || {}).forEach(function (t) { if (!known[t] && t !== '!top' && t !== '!attrs') items.push({ value: t, short: '' }); });
    typed = typed.toLowerCase();
    var list = items.filter(function (it) { return it.value.indexOf(typed) === 0; });
    list.sort(function (a, b) { return (b.short ? 1 : 0) - (a.short ? 1 : 0) || (a.value < b.value ? -1 : 1); });
    return finish(cm, list, fromIdx, toIdx, 0);
  }

  function attrList(cm, tag, fromIdx, toIdx, typed, inTag, doc) {
    var el = htmlEl(tag);
    var present = {};
    inTag.replace(/\s([\w:-]+)(?=\s*=|\s|$)/g, function (_, n) { present[n.toLowerCase()] = true; });
    var attrs = (el ? el.attributes || [] : []).concat((U.data.htmlGlobalAttrs || []).filter(function (g) {
      return !(el && (el.attributes || []).some(function (a) { return a.name === g.name; }));
    }));
    typed = typed.toLowerCase();
    var after = doc.slice(toIdx, toIdx + 3);
    var hasEq = /^\s*=/.test(after);
    var list = attrs.filter(function (a) { return a.name.indexOf(typed) === 0 && (!present[a.name] || a.name === typed); }).map(function (a) {
      return {
        value: a.name, short: shortOf(a.desc), attr: a,
        info: { title: a.name + (el && (el.attributes || []).indexOf(a) >= 0 ? ' on <' + tag + '>' : ' (any element)'), html: U.md(a.desc), foot: a.kind === 'enum' ? a.values.length + ' possible values' : a.kind === 'boolean' ? 'On/off: just write the name.' : '' }
      };
    });
    list.forEach(function (it) {
      it.hint = function (c, data, self) {
        var from = self.from || data.from, to = self.to || data.to;
        if (self.attr.kind === 'boolean' || hasEq) { c.replaceRange(self.value, from, to, 'complete'); return; }
        c.replaceRange(self.value + '=""', from, to, 'complete');
        var at = c.indexFromPos(from) + self.value.length + 2;
        c.setCursor(c.posFromIndex(at));
        if (self.attr.kind === 'enum' || self.attr.suggestions) openSoon(c);
      };
    });
    return finish(cm, list, fromIdx, toIdx, 0);
  }

  function attrValueList(cm, tag, name, fromIdx, idx, typed, doc, quote) {
    var found = htmlAttr(tag, name);
    if (!found) return null;
    var a = found.attr;
    var close = doc.indexOf(quote, idx);
    var gt = doc.indexOf('>', idx);
    var toIdx = close >= 0 && (gt < 0 || close < gt) ? close : idx;
    var values = a.kind === 'enum' ? a.values : (a.suggestions || []).map(function (s) { return typeof s === 'string' ? { value: s, desc: '' } : s; });
    if (!values.length) return null;
    var whole = doc.slice(fromIdx, toIdx).toLowerCase();
    var exact = values.map(function (v) { return String(v.value).toLowerCase(); }).indexOf(whole);
    typed = typed.toLowerCase();
    var list = values;
    if (exact < 0 && typed) {
      list = values.filter(function (v) { return String(v.value).toLowerCase().indexOf(typed) === 0; });
      if (!list.length) list = values;
    }
    return finish(cm, list.map(function (v) {
      return {
        value: String(v.value), label: v.value === '' ? '(empty)' : String(v.value), short: shortOf(v.desc || ''), tryText: String(v.value),
        info: { title: name + '="' + v.value + '"', html: U.md(v.desc || ''), foot: 'Use ↑ ↓ to preview each value, Enter to keep it, Esc to undo.' }
      };
    }), fromIdx, toIdx, Math.max(0, exact));
  }

  function htmlHint(cm) {
    var cur = cm.getCursor();
    var tok = cm.getTokenAt(cur);
    var inner = CM().innerMode(cm.getMode(), tok.state);
    var doc = cm.getValue(), idx = cm.indexFromPos(cur);
    if (inner.mode.name === 'css') { var reg = cssRegionAt(doc, idx); return reg ? cssHint(cm, reg) : null; }
    if (inner.mode.name === 'javascript') return CM().hint.javascript ? CM().hint.javascript(cm) : null;
    var lt = doc.lastIndexOf('<', idx - 1), gt = doc.lastIndexOf('>', idx - 1);
    if (lt < 0 || gt > lt) return null;                       // in text content, not in a tag
    var inTag = doc.slice(lt, idx);
    if (/^<\//.test(inTag)) return CM().hint.html ? CM().hint.html(cm) : null;
    var m = /^<([\w-]*)$/.exec(inTag);
    if (m) return tagList(cm, idx - m[1].length, idx + ((/^[\w-]*/.exec(doc.slice(idx)) || [''])[0].length), m[1]);
    var tag = (/^<([\w-]+)/.exec(inTag) || [])[1];
    if (!tag) return null;
    if (quotesOpen(inTag)) {
      var mv = /([\w:-]+)\s*=\s*(["'])([^"']*)$/.exec(inTag);
      if (!mv) return null;
      if (mv[1].toLowerCase() === 'style') { var sreg = cssRegionAt(doc, idx); return sreg ? cssHint(cm, sreg) : null; }
      return attrValueList(cm, tag.toLowerCase(), mv[1].toLowerCase(), idx - mv[3].length, idx, mv[3], doc, mv[2]);
    }
    var ma = /\s([\w:-]*)$/.exec(inTag);
    // replace only what was typed: a word right after the cursor is another attribute, not part of this one
    if (ma) return attrList(cm, tag.toLowerCase(), idx - ma[1].length, idx, ma[1], inTag, doc);
    return null;
  }

  function hint(cm, mode) {
    if (mode === 'css') return cssHint(cm, { text: cm.getValue(), offset: 0 });
    if (mode === 'html') return htmlHint(cm);
    return CM().hint.javascript ? CM().hint.javascript(cm) : null;
  }

  /** Open the list by itself while typing, where a list helps. */
  function onInput(cm, change, mode) {
    if (change.origin !== '+input' || !cm.showHint || cm.state.completionActive) return;
    var ch = change.text.join('');
    if (mode === 'js') { if (ch === '.') cm.showHint({ completeSingle: false }); return; }
    var cur = cm.getCursor();
    var before = cm.getRange({ line: cur.line, ch: Math.max(0, cur.ch - 4) }, cur);
    if (/^[a-z-]$/i.test(ch) || ch === ':' || ch === '<' || ch === '"' || ch === "'" ||
        (ch === ' ' && /:\s$/.test(before)) || (ch === ' ' && mode === 'html') || (ch === '(' && /var\($/i.test(before))) {
      cm.showHint({ completeSingle: false });
    }
  }

  /* ===================================================================================
   * Hover tooltips
   * =================================================================================== */

  var tip = null, tipHideTimer = null;
  function showTip(data, x, y) {
    clearTimeout(tipHideTimer);
    if (!tip) {
      tip = h('div', { class: 'learn-tip', role: 'tooltip' });
      tip.addEventListener('mouseenter', function () { clearTimeout(tipHideTimer); });
      tip.addEventListener('mouseleave', function () { hideTipSoon(); });
      document.body.appendChild(tip);
    }
    tip.innerHTML = '';
    tip.appendChild(h('div', { class: 'learn-tip-title' }, data.title, data.kind ? h('span', { class: 'learn-tip-kind' }, data.kind) : null));
    if (data.html) tip.appendChild(h('div', { class: 'learn-tip-body', html: data.html }));
    if (data.foot) tip.appendChild(h('div', { class: 'learn-tip-foot', html: data.foot }));
    if (data.link) tip.appendChild(h('div', { class: 'learn-tip-link' }, h('a', { href: data.link }, 'Open in the reference ↗'), h('span', { class: 'faint' }, ' or Ctrl+click')));
    tip.style.display = 'block';
    var w = tip.offsetWidth, hh = tip.offsetHeight;
    var left = Math.min(x + 12, window.innerWidth - w - 8), top = y + 18;
    if (top + hh > window.innerHeight - 8) top = Math.max(8, y - hh - 12);
    tip.style.left = Math.max(8, left) + 'px';
    tip.style.top = top + 'px';
  }
  function hideTip() { clearTimeout(tipHideTimer); if (tip) tip.style.display = 'none'; }
  function hideTipSoon() { clearTimeout(tipHideTimer); tipHideTimer = setTimeout(hideTip, 250); }

  /* --- what is under the mouse --- */

  function cssPropTip(name) {
    var p = cssProp(name);
    if (p) return { title: p.name, kind: 'CSS property', html: U.md(p.summary), foot: 'Initial value: <code>' + U.esc(p.initial) + '</code> · ' + (p.inherited ? 'inherited by children' : 'not inherited'), link: '#/css/' + p.name };
    if (window.CSS && CSS.supports && CSS.supports(name, 'initial')) return { title: name, kind: 'CSS property', html: '<p>A real CSS property that this tool does not cover yet.</p>', link: null };
    return { title: name, kind: 'not a property', html: '<p>The browser does not know this property, so the line is ignored. A typo?</p>' };
  }

  function cssValueTip(prop, word, wholeValue) {
    var p = cssProp(prop);
    var w = String(word).toLowerCase();
    var pool = (p ? p.values : []).concat(U.data.cssGlobalValues || []);
    var v = pool.filter(function (x) { return String(x.value).toLowerCase() === w; })[0] ||
      pool.filter(function (x) { return String(x.value).toLowerCase() === String(wholeValue).toLowerCase(); })[0];
    if (v) return { title: (p ? p.name : prop) + ': ' + v.value, kind: 'value', html: U.md(v.desc), link: p ? '#/css/' + p.name + '?v=' + encodeURIComponent(v.value) : null };
    var num = /^-?[\d.]+([a-z%]*)$/i.exec(word);
    if (num) {
      var unit = num[1].toLowerCase();
      return { title: word, kind: 'value', html: '<p>' + (unit ? '<code>' + unit + '</code>: ' + U.esc(UNITS[unit] || 'a CSS unit.') : 'A plain number.') + '</p>',
        foot: 'Alt+↑ / Alt+↓ changes it by 1 (Shift: 10).', link: p ? '#/css/' + p.name : null };
    }
    if (p) return { title: p.name + ': ' + wholeValue, kind: 'value', html: U.md(p.summary), link: '#/css/' + p.name };
    return null;
  }

  function selectorTip(selector, word) {
    var spec = U.specificity ? U.specificity(selector)[0] : null;
    var w = String(word).trim(), what;
    if (w.charAt(0) === '.') what = 'Class selector: matches every element with <code>class="' + U.esc(w.slice(1)) + '"</code>.';
    else if (w.charAt(0) === '#') what = 'Id selector: matches the one element with <code>id="' + U.esc(w.slice(1)) + '"</code>.';
    else if (w.charAt(0) === ':') what = 'Pseudo-class or pseudo-element: a state (like :hover) or a part (like ::before) of the element.';
    else if (/^[a-z][\w-]*$/i.test(w) && htmlEl(w)) what = 'Type selector: every <code>&lt;' + U.esc(w) + '&gt;</code> element.';
    else if (/^[>+~]$/.test(w)) what = { '>': 'Child combinator: the right side must be a direct child of the left.', '+': 'Next-sibling combinator: right after the left element.', '~': 'Sibling combinator: any later sibling.' }[w];
    else what = 'Part of the selector: which elements this rule styles.';
    return {
      title: selector, kind: 'selector', html: '<p>' + what + '</p>',
      foot: spec ? 'Specificity (ids, classes, types): <b>' + spec.a + ', ' + spec.b + ', ' + spec.c + '</b>' : '',
      link: '#/explain/specificity'
    };
  }

  var CSS_FUNCS = {
    'var': '`var(--name)` reads a **CSS variable**. Give it a fallback for when the variable is not set: `var(--brand, blue)`.',
    calc: '`calc()` does arithmetic with mixed units, worked out by the browser at layout time: `calc(100% - 40px)` is "the full width minus 40 pixels". Put spaces around `+` and `-`.',
    min: '`min(a, b)` uses the smaller value: `width: min(100%, 600px)` is the full width on a phone, and never more than 600px.',
    max: '`max(a, b)` uses the larger value: `font-size: max(16px, 1.2vw)` grows with the screen but never goes below 16px.',
    clamp: '`clamp(min, preferred, max)` uses the preferred value, kept between a minimum and a maximum: `font-size: clamp(16px, 4vw, 28px)`.'
  };

  function cssVarTip(text, name, declaring) {
    var v = cssVariables(text).filter(function (x) { return x.name === name; })[0];
    var link = '#/lessons/css-variables';
    if (declaring) {
      return { title: name, kind: 'CSS variable', link: link,
        html: U.md('Declares a **CSS variable** (a custom property)' + (v ? ' on `' + v.selector + '`' : '') + '. Read it anywhere inside with `var(' + name + ')`.'),
        foot: 'Like colour and font, it is inherited: children see it, and a rule deeper in the page can override it.' };
    }
    if (!v) return { title: name, kind: 'CSS variable', link: link, html: U.md('This stylesheet never declares `' + name + '`, so the property falls back to its default (or to the fallback in `var(' + name + ', fallback)`). A typo?') };
    return { title: name, kind: 'CSS variable', link: link, html: U.md('A **CSS variable** (custom property). Declared in `' + v.selector + '`, line ' + (v.line + 1) + ': `' + name + ': ' + v.value + '`.') };
  }

  function cssTipAt(cm, base, index, tok) {
    var i = index - base.offset;
    if (i < 0 || i > base.text.length) return null;
    var ctx = U.cssModel.context(base.text, i + 1 <= base.text.length ? i + 1 : i);
    var word = tok.string.trim();
    if (!word || /^[{}:;,()]$/.test(word)) return null;
    var j = i;
    while (j < base.text.length && /[\w-]/.test(base.text.charAt(j))) j++;
    if (/^--[\w-]+$/.test(word)) return cssVarTip(base.text, word, /^\s*:/.test(base.text.slice(j)));
    var fn = word.toLowerCase();
    if (base.text.charAt(j) === '(' && CSS_FUNCS.hasOwnProperty(fn)) return { title: fn + '()', kind: 'CSS function', html: U.md(CSS_FUNCS[fn]), link: fn === 'var' ? '#/lessons/css-variables' : null };
    if (/property/.test(tok.type || '') || ctx.kind === 'property') return cssPropTip(word.toLowerCase());
    if (ctx.kind === 'value') return cssValueTip(ctx.prop, word, base.text.slice(ctx.valueStart, ctx.valueEnd).trim());
    if (ctx.kind === 'selector') return selectorTip(ctx.rule.selector, word);
    return null;
  }

  function htmlTipAt(cm, pos, tok, state) {
    var type = tok.type || '';
    var tag = state && state.tagName ? String(state.tagName).toLowerCase() : '';
    if (/tag/.test(type) && !/bracket/.test(type)) {
      var name = tok.string.replace(/[<\/>\s]/g, '').toLowerCase();
      var e = htmlEl(name);
      if (!e) return null;
      return { title: '<' + name + '>', kind: 'HTML element', html: U.md(e.summary), foot: 'Default display: <b>' + U.esc(e.display) + '</b>' + (e.void ? ' · no closing tag' : ''), link: '#/html/' + e.tag };
    }
    if (/attribute/.test(type)) {
      var f = htmlAttr(tag, tok.string);
      if (!f) return null;
      var target = f.entry ? f.entry.tag : 'div';
      return { title: tok.string + (f.global ? ' (any element)' : ' on <' + tag + '>'), kind: 'attribute', html: U.md(f.attr.desc), link: '#/html/' + target + '?attr=' + encodeURIComponent(f.attr.name) };
    }
    if (/string/.test(type)) {
      var lineText = cm.getLine(pos.line).slice(0, tok.start);
      var an = /([\w:-]+)\s*=\s*$/.exec(lineText);
      if (!an) return null;
      var fa = htmlAttr(tag, an[1]);
      if (!fa) return null;
      var val = tok.string.replace(/^["']|["']$/g, '');
      var v = (fa.attr.values || []).filter(function (x) { return String(x.value) === val; })[0];
      var tgt = fa.entry ? fa.entry.tag : 'div';
      if (v) return { title: an[1] + '="' + val + '"', kind: 'value', html: U.md(v.desc), link: '#/html/' + tgt + '?attr=' + encodeURIComponent(an[1]) + '&v=' + encodeURIComponent(val) };
      return { title: an[1], kind: 'attribute', html: U.md(fa.attr.desc), link: '#/html/' + tgt + '?attr=' + encodeURIComponent(an[1]) };
    }
    return null;
  }

  /* JavaScript: identifiers from the JS reference's "What you will use" tables. */
  var jsIndex = null;
  var JS_WORDS = {
    document: ['The page itself, as an object: the root of the DOM tree. `document.querySelector(...)` searches it.', 'select'],
    window: ['The browser tab: global functions like `setTimeout` and `fetch` live on it.', 'timers'],
    console: ['Prints to the console panel: `console.log(value)` is JavaScript\'s `System.out.println`.', 'basics'],
    log: ['`console.log(...)` prints values to the console panel.', 'basics'],
    let: ['A variable that can be reassigned, scoped to its `{ }` block.', 'basics'],
    var: ['The old way to declare variables (function-scoped). Prefer `let` and `const`.', 'basics'],
    return: ['Ends the function and gives back a value, as in Java.', 'functions'],
    async: ['Marks a function that can `await`; it always returns a Promise.', 'fetch'],
    await: ['Waits for a Promise (inside an `async` function) without freezing the page.', 'fetch'],
    this: ['Inside a regular function called on an object: that object. Arrow functions keep the surrounding `this`.', 'functions'],
    null: ['Deliberately "no value".', 'basics'],
    undefined: ['"Never set": a missing variable value, property or argument.', 'basics']
  };
  var PLACEHOLDERS = /^(el|e|a|b|x|y|fn|obj|arr|s|k|v|c|n|ms|sel|tag|url|data|text|items|item|node|parent|list|key|id|cond|f|i|p|r|d|u|users|res|response|options|method|headers|body|value2|pos|html|input|form|checkbox|start|someName|prop|type|name|ids|classes)$/;
  function buildJsIndex() {
    jsIndex = {};
    (U.data.jsTopics || []).forEach(function (t) {
      (t.api || []).forEach(function (a) {
        (a.name.match(/[A-Za-z_$][\w$]*/g) || []).forEach(function (w) {
          if (PLACEHOLDERS.test(w) || (w.length < 4 && !/^(add|let|var|new|try)$/.test(w))) return;
          if (!Object.prototype.hasOwnProperty.call(jsIndex, w)) jsIndex[w] = { topic: t, api: a };
        });
      });
    });
  }
  function jsTipAt(tok) {
    var w = tok.string.trim();
    if (!/^[A-Za-z_$][\w$]*$/.test(w)) return null;
    var kw = Object.prototype.hasOwnProperty.call(JS_WORDS, w) ? JS_WORDS[w] : null;
    if (kw) { var topic = U.find('jsTopics', kw[1]); return { title: w, kind: 'JavaScript', html: U.md(kw[0]), link: topic ? '#/js/' + topic.id : null }; }
    if (!jsIndex) buildJsIndex();
    var hit = Object.prototype.hasOwnProperty.call(jsIndex, w) ? jsIndex[w] : null;
    if (hit) return { title: hit.api.name, kind: 'JavaScript', html: U.md(hit.api.desc), foot: 'From: ' + U.esc(hit.topic.title), link: '#/js/' + hit.topic.id };
    return null;
  }

  function tipAt(cm, mode, x, y) {
    var pos = cm.coordsChar({ left: x, top: y }, 'window');
    var line = cm.getLine(pos.line);
    if (line === undefined || line === null || pos.ch >= line.length) return null;
    var box = cm.charCoords(pos, 'window');
    if (y < box.top - 2 || y > box.bottom + 2 || x < box.left - 12 || x > box.right + 12) return null;
    var tok = cm.getTokenAt({ line: pos.line, ch: pos.ch + 1 }, true);
    if (!tok || !tok.string.trim() || tok.start > pos.ch) return null;
    var inner = CM().innerMode(cm.getMode(), tok.state);
    var name = inner.mode.name;
    var index = cm.indexFromPos({ line: pos.line, ch: pos.ch });
    if (name === 'css') {
      if (mode === 'css') return cssTipAt(cm, { text: cm.getValue(), offset: 0 }, index, tok);
      var reg = cssRegionAt(cm.getValue(), index);
      return reg ? cssTipAt(cm, reg, index, tok) : null;
    }
    if (name === 'xml') {
      if (/string/.test(tok.type || '') && /^["']?\s*[\w-]+\s*:/.test(tok.string.replace(/^["']/, '')) && /style\s*=\s*$/.test(cm.getLine(pos.line).slice(0, tok.start))) {
        var sreg = cssRegionAt(cm.getValue(), index);
        if (sreg) {
          var wordTok = { string: (cm.findWordAt(pos) && cm.getRange(cm.findWordAt(pos).anchor, cm.findWordAt(pos).head)) || tok.string, type: '' };
          return cssTipAt(cm, sreg, index, wordTok);
        }
      }
      return htmlTipAt(cm, pos, tok, inner.state);
    }
    if (name === 'javascript') return jsTipAt(tok);
    return null;
  }

  function attachTooltips(cm, mode) {
    var wrapper = cm.getWrapperElement();
    var timer = null;
    wrapper.addEventListener('mousemove', function (e) {
      clearTimeout(timer);
      var x = e.clientX, y = e.clientY;
      timer = setTimeout(function () {
        if (cm.state.completionActive) return;
        var t = null;
        try { t = tipAt(cm, mode, x, y); } catch (err) { t = null; }
        if (t) showTip(t, x, y); else hideTipSoon();
      }, 280);
    });
    wrapper.addEventListener('mouseleave', function () { clearTimeout(timer); hideTipSoon(); });
    wrapper.addEventListener('mousedown', function (e) {
      if (!(e.ctrlKey || e.metaKey)) { hideTip(); return; }
      var t = null;
      try { t = tipAt(cm, mode, e.clientX, e.clientY); } catch (err) { t = null; }
      if (t && t.link) { e.preventDefault(); hideTip(); U.go(t.link); }
    });
    cm.on('keydown', hideTip);
    cm.on('scroll', hideTip);
  }

  /* ===================================================================================
   * Number scrubbing
   * =================================================================================== */

  function decimals(s) { var m = /\.(\d+)/.exec(String(s)); return m ? m[1].length : 0; }
  function scrub(cm, delta) {
    var cur = cm.getCursor(), line = cm.getLine(cur.line);
    var re = /-?(?:\d+\.?\d*|\.\d+)/g, m, hit = null;
    while ((m = re.exec(line))) {
      if (m.index <= cur.ch && cur.ch <= m.index + m[0].length) { hit = m; break; }
    }
    if (!hit) return CM().Pass;
    var prev = line.charAt(hit.index - 1);
    if (/[A-Za-z_#$]/.test(prev) && hit[0].charAt(0) !== '-') return CM().Pass; // h1, #4353c9, x2: not a number
    var d = Math.max(decimals(hit[0]), decimals(Math.abs(delta)));
    var next = (parseFloat(hit[0]) + delta).toFixed(d);
    if (d > 0) next = next.replace(/0+$/, '').replace(/\.$/, '');
    if (next === '-0') next = '0';
    var from = { line: cur.line, ch: hit.index }, to = { line: cur.line, ch: hit.index + hit[0].length };
    cm.replaceRange(next, from, to, '+scrub');
    cm.setCursor({ line: cur.line, ch: Math.min(hit.index + next.length, Math.max(hit.index, cur.ch + (next.length - hit[0].length))) });
    return undefined;
  }
  function keys() {
    function k(delta) { return function (cm) { return scrub(cm, delta); }; }
    return { 'Alt-Up': k(1), 'Alt-Down': k(-1), 'Shift-Alt-Up': k(10), 'Shift-Alt-Down': k(-10), 'Ctrl-Alt-Up': k(0.1), 'Ctrl-Alt-Down': k(-0.1) };
  }

  /* ===================================================================================
   * Colour swatches
   * =================================================================================== */

  var namedColours = null;
  function isNamedColour(w) {
    if (!namedColours) {
      var spec = CM().resolveMode ? CM().resolveMode('text/css') : {};
      namedColours = spec.colorKeywords || {};
    }
    w = w.toLowerCase();
    return w !== 'transparent' && w !== 'currentcolor' && !!namedColours[w];
  }
  var canvasCtx = null;
  function toHex(colour) {
    if (!canvasCtx) canvasCtx = document.createElement('canvas').getContext('2d');
    canvasCtx.fillStyle = '#000000';
    canvasCtx.fillStyle = colour;
    var v = canvasCtx.fillStyle;
    if (v.charAt(0) === '#') return v.slice(0, 7);
    var m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(v);
    if (!m) return '#000000';
    return '#' + [m[1], m[2], m[3]].map(function (n) { return ('0' + (+n).toString(16)).slice(-2); }).join('');
  }
  function coloursIn(value) {
    var out = [], re = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^()]*\)|\b[a-zA-Z]+\b/g, m;
    while ((m = re.exec(value))) {
      var t = m[0];
      if (/^[a-z]+$/i.test(t) && !isNamedColour(t)) continue;
      if (window.CSS && CSS.supports && !CSS.supports('color', t)) continue;
      out.push({ index: m.index, text: t });
    }
    return out;
  }
  /** Every declaration value in the editor, as [{start, value}] with absolute positions. */
  function cssValuesIn(doc, mode) {
    var out = [];
    function fromModel(text, offset) {
      U.cssModel.parse(text).rules.forEach(function (r) {
        r.decls.forEach(function (d) { if (d.value) out.push({ start: offset + d.valueStart, value: d.value }); });
      });
    }
    if (mode === 'css') { fromModel(doc, 0); return out; }
    var re = /<style[^>]*>([\s\S]*?)<\/style>/gi, m;
    while ((m = re.exec(doc))) fromModel(m[1], m.index + m[0].indexOf('>') + 1);
    var starts = U.cssModel.lineStarts(doc);
    var sa = /\sstyle\s*=\s*(["'])([^"']*)\1/gi;
    while ((m = sa.exec(doc))) {
      var vs = m.index + m[0].indexOf(m[1]) + 1;
      U.cssModel.parseDecls(doc, vs, vs + m[2].length, starts).forEach(function (d) { if (d.value) out.push({ start: d.valueStart, value: d.value }); });
    }
    return out;
  }

  function attachSwatches(cm, mode) {
    var marks = [], dragging = false;
    function clear() { marks.forEach(function (mk) { mk.clear(); }); marks = []; }
    function add(index, text) {
      var from = cm.posFromIndex(index), to = cm.posFromIndex(index + text.length);
      var input = h('input', { type: 'color', tabindex: '-1', 'aria-label': 'Pick a colour instead of ' + text });
      input.value = toHex(text);
      var sw = h('span', { class: 'cm-swatch', 'data-colour': text, title: 'Click to pick a colour' }, input);
      sw.style.setProperty('--sw', text);
      var range = cm.markText(from, to, { inclusiveLeft: true, inclusiveRight: true, clearWhenEmpty: false });
      input.addEventListener('input', function () {
        var r = range.find();
        if (!r) return;
        dragging = true;
        cm.replaceRange(input.value, r.from, r.to, '+swatch');
        sw.setAttribute('data-colour', input.value);
        sw.style.setProperty('--sw', input.value);
      });
      input.addEventListener('change', function () { dragging = false; scanSoon(); });
      marks.push(range, cm.setBookmark(from, { widget: sw, insertLeft: true, handleMouseEvents: true }));
    }
    function scan() {
      if (dragging) return;
      cm.operation(function () {
        clear();
        cssValuesIn(cm.getValue(), mode).forEach(function (v) {
          coloursIn(v.value).forEach(function (c) { add(v.start + c.index, c.text); });
        });
      });
    }
    var scanSoon = U.debounce(scan, 250);
    cm.on('change', function (c, change) { if (change.origin !== '+swatch') scanSoon(); });
    scan();
  }

  /* ===================================================================================
   * Warnings gutter + the lint itself
   * =================================================================================== */

  function setLint(cm, list) {
    var title = (cm.state.uiltAssist || {}).mode === 'js' ? 'Worth a second look' : 'Why this line does nothing';
    cm.state.uiltLintList = list;
    cm.operation(function () {
      cm.clearGutter('uilt-lint');
      (cm.state.uiltLintLines || []).forEach(function (l) { cm.removeLineClass(l, 'wrap', 'lint-line'); });
      cm.state.uiltLintLines = [];
      var byLine = {};
      list.forEach(function (w) { (byLine[w.line] = byLine[w.line] || []).push(w.msg); });
      Object.keys(byLine).forEach(function (ln) {
        var line = +ln;
        if (line >= cm.lineCount()) return;
        var msgs = byLine[ln];
        var el = h('span', { class: 'lint-marker', 'data-msg': msgs.map(plain).join(' | '), tabindex: '0', 'aria-label': 'Warning: ' + msgs.map(plain).join(' ') }, '⚠');
        function show() {
          var r = el.getBoundingClientRect();
          showTip({ title: title, kind: 'hint', html: msgs.map(function (m) { return U.md(m); }).join('') }, r.right, r.top);
        }
        el.addEventListener('mouseenter', show);
        el.addEventListener('focus', show);
        el.addEventListener('mouseleave', hideTipSoon);
        cm.setGutterMarker(line, 'uilt-lint', el);
        cm.addLineClass(line, 'wrap', 'lint-line');
        cm.state.uiltLintLines.push(line);
      });
    });
  }

  function editDistance(a, b) {
    var dp = [];
    for (var i = 0; i <= a.length; i++) { dp[i] = [i]; }
    for (var j = 1; j <= b.length; j++) dp[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
    }
    return dp[a.length][b.length];
  }
  function suggestProperty(name) {
    var best = null, bestD = 3;
    (U.data.cssProperties || []).map(function (p) { return p.name; }).concat(cssPropertyNames()).forEach(function (n) {
      var d = editDistance(name, n);
      if (d < bestD) { bestD = d; best = n; }
    });
    return best;
  }

  /**
   * Check a stylesheet against what the preview shows. Resolves with [{line, msg}] (0-based lines).
   * The browser-side part (which elements match, their display / position) runs in the preview.
   */
  function lintCss(preview, text) {
    var model = U.cssModel.parse(text);
    var rules = model.rules.filter(function (r) { return !r.keyframes && r.selector; });
    var out = [];
    var query = rules.map(function (r) {
      var decls = r.decls.filter(function (d) { return d.value !== null && d.prop.indexOf('--') !== 0; });
      r._decls = decls;
      return {
        sel: U.cssModel.matchableSelector(r.selector),
        pseudoElement: /::?(before|after|first-line|first-letter|placeholder|marker|selection)/i.test(r.selector),
        decls: decls.map(function (d) { return { prop: d.prop, value: d.value }; })
      };
    });
    rules.forEach(function (r) {
      r._decls.forEach(function (d) {
        if (!d.value || !window.CSS || !CSS.supports) return; // still typing
        var v = d.value.replace(/!important\s*$/i, '').trim();
        if (!CSS.supports(d.prop, 'initial')) {
          var s = suggestProperty(d.prop);
          out.push({ line: d.line, msg: '`' + d.prop + '` is not a CSS property, so the browser skips this line.' + (s ? ' Did you mean `' + s + '`?' : '') });
        } else if (v && !/var\(/i.test(v) && !CSS.supports(d.prop, v)) {
          out.push({ line: d.line, msg: 'The browser rejects `' + v + '` as a value for `' + d.prop + '`, so it skips this line. Hover the property to see what it accepts.' });
        }
      });
    });
    if (!rules.length) return Promise.resolve(out);
    return preview.ask({ type: 'lint', rules: query, conditions: U.data.cssConditions || [] }).then(function (res) {
      (res || []).forEach(function (r, i) {
        var rule = rules[i];
        if (!r) return;
        if (r.invalid) out.push({ line: rule.line, msg: '`' + rule.selector + '` is not a valid selector, so the browser skips the whole rule.' });
        else if (r.nothing) out.push({ line: rule.line, msg: '`' + rule.selector + '` matches nothing in your HTML, so this rule has no effect. Check the spelling of the class, id or tag.' });
        (r.warnings || []).forEach(function (w) {
          var d = rule._decls[w.decl];
          if (d) out.push({ line: d.line, msg: w.msg });
        });
      });
      return out;
    }, function () { return out; });
  }

  /* ===================================================================================
   * JavaScript warnings: mistakes the browser stays quiet about, or only reports later
   * =================================================================================== */

  /**
   * Blank out strings, template literals, comments and regular expressions (keeping every position
   * and line break), so the rules below only ever look at code. Also returns the string literals:
   * [{start: the opening quote's position, value, template}].
   */
  function jsScan(text) {
    var out = text.split(''), strings = [], i = 0, n = text.length;
    function blank(a, b) { for (var k = a; k < b; k++) if (out[k] !== '\n') out[k] = ' '; }
    while (i < n) {
      var ch = text.charAt(i), nx = text.charAt(i + 1);
      if (ch === '/' && nx === '/') { var e1 = text.indexOf('\n', i); e1 = e1 < 0 ? n : e1; blank(i, e1); i = e1; continue; }
      if (ch === '/' && nx === '*') { var e2 = text.indexOf('*/', i + 2); e2 = e2 < 0 ? n : e2 + 2; blank(i, e2); i = e2; continue; }
      if (ch === '"' || ch === "'" || ch === '`') {
        var j = i + 1, val = '';
        while (j < n && text.charAt(j) !== ch && (ch === '`' || text.charAt(j) !== '\n')) {
          if (text.charAt(j) === '\\') { val += text.charAt(j + 1); j += 2; continue; }
          val += text.charAt(j);
          j++;
        }
        strings.push({ start: i, value: val, template: ch === '`' });
        blank(i + 1, Math.min(j, n));
        i = j + 1;
        continue;
      }
      if (ch === '/') {
        // a "/" after an operator, a bracket or a keyword like return starts a regular expression
        var p = i - 1;
        while (p >= 0 && /\s/.test(out[p])) p--;
        var before = p < 0 ? '' : out[p];
        var word = /[\w$]+$/.exec(out.slice(Math.max(0, p - 12), p + 1).join(''));
        if (before === '' || /[(,=:[!&|?{};+\-*%<>~^]/.test(before) || (word && /^(return|typeof|case|do|else|in|of|new|delete|void|throw|yield|await)$/.test(word[0]))) {
          var k = i + 1, inClass = false;
          while (k < n && text.charAt(k) !== '\n') {
            var c = text.charAt(k);
            if (c === '\\') { k += 2; continue; }
            if (c === '[') inClass = true;
            else if (c === ']') inClass = false;
            else if (c === '/' && !inClass) break;
            k++;
          }
          blank(i + 1, k);
          i = k + 1;
          continue;
        }
      }
      i++;
    }
    return { code: out.join(''), strings: strings };
  }

  function words(s) { var o = {}; s.split(' ').forEach(function (w) { o[w] = true; }); return o; }
  /* what these well-known objects really have: anything else after "document." is a typo */
  var JS_RECEIVERS = {
    document: words('getElementById getElementsByClassName getElementsByTagName getElementsByName querySelector querySelectorAll createElement createElementNS createTextNode createDocumentFragment createComment addEventListener removeEventListener dispatchEvent body head title documentElement scrollingElement cookie forms images links fonts styleSheets activeElement fullscreenElement readyState hidden visibilityState location referrer URL defaultView hasFocus getSelection elementFromPoint exitFullscreen startViewTransition append prepend write'),
    console: words('log info warn error debug table dir clear group groupEnd groupCollapsed time timeEnd timeLog count countReset assert trace'),
    JSON: words('parse stringify'),
    Math: words('abs ceil floor round trunc sign max min pow sqrt cbrt random PI E hypot log log2 log10 exp sin cos tan atan atan2 asin acos'),
    localStorage: words('getItem setItem removeItem clear key length'),
    sessionStorage: words('getItem setItem removeItem clear key length')
  };
  /* members of elements, events, arrays, strings and responses: a different spelling is suspicious */
  var JS_MEMBERS = Object.keys(words(
    'addEventListener removeEventListener dispatchEvent querySelector querySelectorAll getElementsByClassName getElementsByTagName ' +
    'appendChild removeChild insertBefore replaceChild replaceChildren append prepend remove before after replaceWith cloneNode contains ' +
    'closest matches setAttribute getAttribute removeAttribute hasAttribute toggleAttribute classList className innerHTML outerHTML ' +
    'innerText textContent firstElementChild lastElementChild nextElementSibling previousElementSibling parentElement parentNode ' +
    'childNodes children insertAdjacentHTML insertAdjacentElement insertAdjacentText dataset style value valueAsNumber checked ' +
    'disabled selected selectedIndex options focus blur click submit reset requestSubmit reportValidity checkValidity scrollIntoView ' +
    'scrollTo getBoundingClientRect offsetWidth offsetHeight clientWidth clientHeight scrollTop scrollHeight scrollWidth ' +
    'preventDefault stopPropagation stopImmediatePropagation currentTarget target defaultPrevented eventPhase toggle ' +
    'forEach filter reduce find findIndex some every includes indexOf lastIndexOf push pop shift unshift splice slice join concat ' +
    'sort reverse flat flatMap keys values entries split trim trimStart trimEnd toUpperCase toLowerCase startsWith endsWith padStart ' +
    'padEnd replaceAll charAt substring toFixed toString toLocaleString then catch finally json text status statusText headers ' +
    'length showModal close show play pause currentTime getComputedStyle setProperty getPropertyValue removeProperty ' +
    'onclick ondblclick oninput onchange onsubmit onkeydown onkeyup onload onmouseover onmouseout onmouseenter onmouseleave ' +
    'onfocus onblur onscroll onresize'));
  var JS_MEMBER_SET = words(JS_MEMBERS.join(' '));
  var JS_MEMBER_LOWER = {};
  JS_MEMBERS.forEach(function (m) { JS_MEMBER_LOWER[m.toLowerCase()] = m; });
  var JS_MISSPELT = { getElementsById: 'getElementById', getElementByClassName: 'getElementsByClassName', getElementByTagName: 'getElementsByTagName', querySelectAll: 'querySelectorAll', querySelectorall: 'querySelectorAll' };
  var JS_GLOBALS = 'setTimeout setInterval clearTimeout clearInterval requestAnimationFrame fetch alert confirm prompt parseInt parseFloat isNaN structuredClone console document window JSON Math localStorage sessionStorage'.split(' ');
  var JS_GLOBAL_LOWER = {};
  JS_GLOBALS.forEach(function (g) { JS_GLOBAL_LOWER[g.toLowerCase()] = g; });
  var JS_EVENTS = words('click dblclick auxclick contextmenu mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
    'pointerdown pointerup pointermove pointerover pointerout pointerenter pointerleave pointercancel touchstart touchend touchmove ' +
    'touchcancel wheel keydown keyup keypress input beforeinput change submit reset invalid focus blur focusin focusout select ' +
    'load DOMContentLoaded beforeunload unload resize scroll scrollend hashchange popstate storage message error online offline ' +
    'visibilitychange copy cut paste drag dragstart dragend dragenter dragleave dragover drop animationstart animationend ' +
    'animationiteration transitionstart transitionend transitionrun toggle close cancel play pause ended timeupdate volumechange ' +
    'loadeddata loadedmetadata canplay canplaythrough seeking seeked waiting playing progress compositionstart compositionend ' +
    'selectionchange slotchange fullscreenchange');
  var JS_EVENT_LIST = Object.keys(JS_EVENTS);

  function nearest(name, candidates, maxD) {
    var best = null, bestD = maxD + 1;
    candidates.forEach(function (c) {
      if (Math.abs(c.length - name.length) > maxD) return;
      var d = editDistance(name, c);
      if (d < bestD) { bestD = d; best = c; }
    });
    return best;
  }

  /** Names the code declares itself (its own functions, variables, object keys and methods). */
  function declaredNames(code) {
    var out = {}, m;
    var res = [/\b(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g, /([A-Za-z_$][\w$]*)\s*:/g, /^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/gm];
    res.forEach(function (re) { while ((m = re.exec(code))) out[m[1]] = true; });
    return out;
  }

  function lineFinder(text) {
    var starts = [0];
    for (var i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
    return function (idx) {
      var lo = 0, hi = starts.length - 1;
      while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (starts[mid] <= idx) lo = mid; else hi = mid - 1; }
      return lo;
    };
  }

  function wordCount(text, name) {
    var esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (text.match(new RegExp('(^|[^\\w-])' + esc + '(?![\\w-])', 'g')) || []).length;
  }

  /**
   * Check JavaScript for the mistakes a beginner (and a Java developer) makes most. Resolves with
   * [{line, msg}] (0-based lines). Whether a selector finds anything is asked of the preview, after
   * the code has run there.
   */
  function lintJs(preview, text) {
    var scan = jsScan(text || ''), code = scan.code, out = [];
    var lineOf = lineFinder(code), declared = declaredNames(code), m;
    var byStart = {};
    scan.strings.forEach(function (s) { byStart[s.start] = s; });
    function warn(idx, msg) { out.push({ line: lineOf(idx), msg: msg }); }
    function sorted() { return out.sort(function (a, b) { return a.line - b.line; }); }

    // 1. == and != convert types; x == null is the one common deliberate use, so it is left alone
    var eq = /(^|[^=!<>])(==|!=)(?!=)/g;
    while ((m = eq.exec(code))) {
      var at = m.index + m[1].length;
      if (/^\s*null\b/.test(code.slice(at + 2)) || /\bnull\s*$/.test(code.slice(0, at))) continue;
      var strict = m[2] === '==' ? '===' : '!==';
      warn(at, '`' + m[2] + '` converts both sides before comparing, so `"1" == 1` and `0 == ""` are both `true`. Use `' + strict +
        '`: it compares without converting (and, unlike Java\'s `==`, it compares strings by their text).');
    }

    // 2. misspelt names: getElementByID, innerHtml, onClick, stopPropogation(), console.Log
    var dot = /\.\s*([A-Za-z_$][\w$]*)/g;
    while ((m = dot.exec(code))) {
      var name = m[1], idx = m.index + m[0].length - name.length;
      var isCall = /^\s*\(/.test(code.slice(idx + name.length));
      var recv = (/([A-Za-z_$][\w$]*)\s*$/.exec(code.slice(0, m.index)) || [])[1];
      var fix = null;
      if (recv && JS_RECEIVERS.hasOwnProperty(recv)) {
        var known = JS_RECEIVERS[recv];
        if (known[name]) continue;
        var keys = Object.keys(known);
        fix = keys.filter(function (k) { return k.toLowerCase() === name.toLowerCase(); })[0] || nearest(name, keys, Math.min(3, Math.floor(name.length / 2)));
      } else if (!JS_MEMBER_SET[name] && !declared[name]) {
        var lower = JS_MEMBER_LOWER[name.toLowerCase()];
        if (lower && (lower.length >= 7 || /^on/.test(lower))) fix = lower;
        else if (JS_MISSPELT[name]) fix = JS_MISSPELT[name];
        else if (isCall && name.length >= 9) fix = nearest(name, JS_MEMBERS.filter(function (x) { return x.length >= 9; }), name.length >= 12 ? 2 : 1);
      }
      if (!fix) continue;
      var shown = recv ? recv + '.' + name : name;
      if (/^on[a-z]+$/.test(fix) && !isCall) {
        warn(idx, '`' + name + '` is not a DOM property: event properties are all lower case, `' + fix + '`. Assigning to `' + name + '` just stores your function, and the browser never calls it.');
      } else if (isCall) {
        warn(idx, '`' + shown + '` does not exist' + (fix.toLowerCase() === name.toLowerCase() ? ' (JavaScript names are case-sensitive)' : '') +
          ', so calling it throws "TypeError: ' + shown + ' is not a function". Did you mean `' + fix + '`?');
      } else {
        warn(idx, '`' + shown + '` does not exist' + (fix.toLowerCase() === name.toLowerCase() ? ' (JavaScript names are case-sensitive)' : '') +
          ': reading it gives `undefined` and writing it does nothing. Did you mean `' + fix + '`?');
      }
    }
    var glob = /(^|[^\w$.])([A-Za-z_$][\w$]*)(?=\s*[.(])/g;
    while ((m = glob.exec(code))) {
      var g = m[2], real = JS_GLOBAL_LOWER[g.toLowerCase()];
      if (!real || real === g || declared[g] || typeof window[g] !== 'undefined') continue;
      warn(m.index + m[1].length, '`' + g + '` does not exist (JavaScript names are case-sensitive): did you mean `' + real + '`? As written it throws "ReferenceError: ' + g + ' is not defined".');
    }

    // 3. event names: "onclick" and typos never fire, and the browser cannot tell you (any name is allowed)
    var ev = /\b(?:addEventListener|removeEventListener)\s*\(\s*(["'`])/g;
    while ((m = ev.exec(code))) {
      var s = byStart[m.index + m[0].length - 1];
      if (!s || /\$\{/.test(s.value) || JS_EVENTS[s.value]) continue;
      var v = s.value, base = v.replace(/^on/i, '');
      if (/^on/i.test(v) && JS_EVENTS[base.toLowerCase()]) {
        warn(s.start, 'Event names have no "on" prefix: listen for `"' + base.toLowerCase() + '"`. (`' + v + '` is the name of a *property*: `el.' + v.toLowerCase() + ' = …`.) As written, this listener never runs.');
        continue;
      }
      var same = JS_EVENT_LIST.filter(function (e) { return e.toLowerCase() === v.toLowerCase(); })[0];
      var near = same || (v.length >= 4 ? nearest(v, JS_EVENT_LIST, v.length >= 6 ? 2 : 1) : null);
      if (!same && near && v.indexOf(near) === 0) continue; // "clicked", "loaded": your own event names, built on a real one
      if (near) warn(s.start, 'There is no `"' + v + '"` event, so this listener never runs - and the browser does not complain, because any name is allowed for your own events. Did you mean `"' + near + '"`?');
    }

    // 4. selectors: a missing dot or #, a # in getElementById, or nothing in the page matches
    var queries = [];
    var sel = /\b(querySelector|querySelectorAll|getElementById|getElementsByClassName|getElementsByTagName)\s*\(\s*(["'`])/g;
    while ((m = sel.exec(code))) {
      var str = byStart[m.index + m[0].length - 1], fn = m[1];
      if (!str || /\$\{/.test(str.value) || !str.value.trim()) continue;
      var arg = str.value.trim();
      if (fn === 'getElementById' && arg.charAt(0) === '#') {
        warn(str.start, '`getElementById` takes the id itself, without the `#`: `getElementById("' + arg.slice(1) + '")`. As written it looks for `id="' + arg + '"` and returns `null`.');
        continue;
      }
      if (fn === 'getElementsByClassName' && arg.charAt(0) === '.') {
        warn(str.start, '`getElementsByClassName` takes class names without the dot: `getElementsByClassName("' + arg.slice(1) + '")`.');
        continue;
      }
      queries.push({ fn: fn, arg: arg, at: str.start, how: fn === 'getElementById' ? 'id' : fn === 'getElementsByClassName' ? 'class' : fn === 'getElementsByTagName' ? 'tag' : 'css' });
    }
    if (!queries.length || !preview) return Promise.resolve(sorted());
    return preview.ask({ type: 'selectors', items: queries.map(function (q) { return { how: q.how, arg: q.arg }; }) }).then(function (res) {
      (res || []).forEach(function (r, k) {
        var q = queries[k];
        if (!r || r.count) return;
        var lit = '`"' + q.arg + '"`';
        if (r.invalid) { warn(q.at, lit + ' is not a valid CSS selector, so `' + q.fn + '` throws a SyntaxError.'); return; }
        if (q.how === 'css' && (r.asClass || r.asId)) {
          var better = r.asClass ? '.' + q.arg : '#' + q.arg;
          warn(q.at, lit + ' looks for a `<' + q.arg + '>` tag, and there is none. Did you mean `"' + better + '"`? Classes need a dot, ids a `#`.');
          return;
        }
        // the script may create these elements itself: then their names appear elsewhere in it
        var names = q.how === 'css' ? (q.arg.match(/[A-Za-z][\w-]*/g) || []) : [q.arg];
        if (names.some(function (nm) { return wordCount(text, nm) > 1; })) return;
        var what = q.how === 'id' ? 'There is no element with `id="' + q.arg + '"` in your HTML, so `getElementById` returns `null`.'
          : q.fn === 'querySelector' ? lit + ' matches nothing in your HTML, so `querySelector` returns `null`, and using the result throws "Cannot read properties of null".'
          : lit + ' matches nothing in your HTML, so the list `' + q.fn + '` returns is empty.';
        warn(q.at, what + ' Check the spelling, and the dot or `#`.');
      });
      return sorted();
    }, function () { return sorted(); });
  }

  /* ===================================================================================
   * Attach to an editor
   * =================================================================================== */

  function attach(cm, mode, opts) {
    cm.state.uiltAssist = { onTry: opts.onTry || null, mode: mode };
    cm.on('inputRead', function (c, change) { onInput(c, change, mode); });
    attachTooltips(cm, mode);
    if (mode === 'css' || mode === 'html') attachSwatches(cm, mode);
    if (mode === 'html' && U.emmet) U.emmet.attach(cm);
  }

  U.editorAssist = {
    attach: attach, hint: hint, keys: keys, setLint: setLint, lintCss: lintCss, lintJs: lintJs,
    showTip: showTip, hideTip: hideTip, hideTipSoon: hideTipSoon, cssPropTip: cssPropTip, cssValueTip: cssValueTip,
    toHex: toHex, plain: plain, shortOf: shortOf
  };
})(window.UILT);
