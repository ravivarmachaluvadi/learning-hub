/*
 * css-model.js - a small, forgiving CSS reader for the editors.
 *
 * It finds rules (selector + declarations) with their character positions, so the autocomplete
 * knows which property a value belongs to, the "why doesn't this work?" warnings know which line
 * to mark, and the Properties panel knows where to write. It never throws on half-typed CSS.
 *
 *   var m = UILT.cssModel.parse(text);
 *   m.rules  -> [{selector, selStart, selEnd, open, close, decls, media, keyframes, line}]
 *   decl     -> {prop, value, start, valueStart, valueEnd, end, line}
 *   UILT.cssModel.context(text, index) -> {kind: 'value'|'property'|'selector'|'none', ...}
 */
(function (U) {
  'use strict';

  function skipComment(text, i) { var e = text.indexOf('*/', i + 2); return e < 0 ? text.length : e + 2; }
  function skipString(text, i) {
    var q = text.charAt(i), j = i + 1;
    while (j < text.length && text.charAt(j) !== q && text.charAt(j) !== '\n') { if (text.charAt(j) === '\\') j++; j++; }
    return j + 1;
  }

  function lineStarts(text) {
    var starts = [0];
    for (var i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
    return starts;
  }
  function lineOf(starts, index) {
    var lo = 0, hi = starts.length - 1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (starts[mid] <= index) lo = mid; else hi = mid - 1; }
    return lo;
  }

  /** Find the "}" that closes the block opened at index `open` (skipping strings and comments). */
  function matchingClose(text, open) {
    var depth = 0;
    for (var i = open; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === '/' && text.charAt(i + 1) === '*') { i = skipComment(text, i) - 1; continue; }
      if (ch === '"' || ch === "'") { i = skipString(text, i) - 1; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) return i; }
    }
    return text.length; // unclosed: the rule runs to the end
  }

  /** Declarations inside a block body text[from, to). Positions are absolute. */
  function parseDecls(text, from, to, starts) {
    var decls = [], segStart = from, i = from, depth = 0;
    function flush(end) {
      var seg = text.slice(segStart, end);
      var colon = -1, k, d = 0;
      for (k = 0; k < seg.length; k++) {
        var c = seg.charAt(k);
        if (c === '(') d++; else if (c === ')') d--;
        else if (c === ':' && d === 0) { colon = k; break; }
      }
      var lead = seg.length - seg.replace(/^\s+/, '').length;
      if (colon < 0) {
        if (seg.trim()) decls.push({ prop: seg.trim().toLowerCase(), value: null, start: segStart + lead, valueStart: -1, valueEnd: -1, end: end, line: lineOf(starts, segStart + lead), incomplete: true });
        return;
      }
      var rawVal = seg.slice(colon + 1);
      var vLead = rawVal.length - rawVal.replace(/^\s+/, '').length;
      var valueStart = segStart + colon + 1 + vLead;
      var valueText = rawVal.trim();
      decls.push({
        prop: seg.slice(0, colon).trim().toLowerCase(),
        value: valueText,
        start: segStart + lead,
        valueStart: valueStart,
        valueEnd: valueStart + valueText.length,
        end: end,
        line: lineOf(starts, segStart + lead)
      });
    }
    while (i < to) {
      var ch = text.charAt(i);
      if (ch === '/' && text.charAt(i + 1) === '*') {
        if (!text.slice(segStart, i).trim()) { i = skipComment(text, i); segStart = i; continue; }
        i = skipComment(text, i); continue;
      }
      if (ch === '"' || ch === "'") { i = skipString(text, i); continue; }
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === ';' && depth === 0) { flush(i); segStart = i + 1; }
      i++;
    }
    flush(to);
    return decls.filter(function (d) { return d.prop; });
  }

  function parse(text) {
    text = String(text || '');
    var starts = lineStarts(text);
    var rules = [], groups = [];
    var i = 0, n = text.length, segStart = 0;
    while (i < n) {
      var ch = text.charAt(i);
      if (ch === '/' && text.charAt(i + 1) === '*') {
        i = skipComment(text, i);
        if (!text.slice(segStart, i).replace(/\/\*[\s\S]*?\*\//g, '').trim()) segStart = i;
        continue;
      }
      if (ch === '"' || ch === "'") { i = skipString(text, i); continue; }
      if (ch === ';') { segStart = i + 1; i++; continue; } // e.g. @import url(...);
      if (ch === '}') {
        if (groups.length && groups[groups.length - 1].close === i) groups.pop();
        segStart = i + 1; i++; continue;
      }
      if (ch === '{') {
        var head = text.slice(segStart, i).replace(/\/\*[\s\S]*?\*\//g, function (c) { return c.replace(/[^\n]/g, ' '); });
        var lead = head.length - head.replace(/^\s+/, '').length;
        var sel = head.trim();
        var parent = groups[groups.length - 1] || null;
        if (sel.charAt(0) === '@') {
          groups.push({
            at: sel, close: matchingClose(text, i),
            keyframes: /^@(-\w+-)?keyframes\b/i.test(sel) || !!(parent && parent.keyframes),
            media: /^@media\b/i.test(sel) ? sel : (parent && parent.media) || null
          });
          segStart = i + 1; i++; continue;
        }
        var close = matchingClose(text, i);
        rules.push({
          selector: sel,
          selStart: segStart + lead,
          selEnd: segStart + lead + sel.length,
          open: i,
          close: close,
          decls: parseDecls(text, i + 1, Math.min(close, n), starts),
          media: parent ? parent.media : null,
          keyframes: !!(parent && parent.keyframes),
          line: lineOf(starts, segStart + lead)
        });
        i = close + 1; segStart = i;
        continue;
      }
      i++;
    }
    return { text: text, rules: rules, starts: starts };
  }

  /** The innermost rule whose block contains index (between "{" and "}"), or whose selector does. */
  function ruleAt(model, index) {
    for (var k = 0; k < model.rules.length; k++) {
      var r = model.rules[k];
      if ((index > r.open && index <= r.close) || (index >= r.selStart && index <= r.open)) return r;
    }
    return null;
  }

  /**
   * What is at `index`? For the autocomplete and the tooltips.
   *   {kind: 'value', prop, valueStart, valueEnd, rule}       - in a declaration's value
   *   {kind: 'property', start, end, rule}                     - where a property name goes
   *   {kind: 'selector', rule}                                 - in a selector
   *   {kind: 'none'}
   * valueEnd stops at ";" "}" or the end of the line, so a half-typed value never swallows the
   * next declaration.
   */
  function context(text, index) {
    var model = parse(text);
    var rule = ruleAt(model, index);
    if (!rule) return { kind: 'none', model: model };
    if (index <= rule.open) return { kind: 'selector', rule: rule, model: model };
    // the text of the current declaration, from the last ";" or "{" to the cursor
    var k = index - 1;
    while (k > rule.open && text.charAt(k) !== ';' && text.charAt(k) !== '{') k--;
    var segStart = k + 1;
    var before = text.slice(segStart, index);
    var colon = before.indexOf(':');
    if (colon >= 0) {
      var prop = before.slice(0, colon).trim().toLowerCase();
      var vs = segStart + colon + 1;
      while (vs < index && /[ \t]/.test(text.charAt(vs))) vs++;
      var ve = index;
      while (ve < text.length && !/[;}\n]/.test(text.charAt(ve))) ve++;
      while (ve > vs && /\s/.test(text.charAt(ve - 1))) ve--;
      return { kind: 'value', prop: prop, valueStart: vs, valueEnd: Math.max(ve, index), rule: rule, model: model };
    }
    var ps = index;
    while (ps > segStart && /[\w-]/.test(text.charAt(ps - 1))) ps--;
    var pe = index;
    while (pe < text.length && /[\w-]/.test(text.charAt(pe))) pe++;
    return { kind: 'property', start: ps, end: pe, rule: rule, model: model };
  }

  /** Remove the parts of a selector that depend on the moment (hover, focus) or select pseudo-elements. */
  function matchableSelector(sel) {
    return String(sel)
      .replace(/::?(before|after|first-line|first-letter|placeholder|marker|selection|backdrop|file-selector-button)(?![\w-])/gi, '')
      .replace(/:(hover|focus-within|focus-visible|focus|active|visited|target)(?![\w-])/gi, '')
      .trim() || '*';
  }

  U.cssModel = { parse: parse, parseDecls: parseDecls, ruleAt: ruleAt, context: context, lineStarts: lineStarts, lineOf: lineOf, matchableSelector: matchableSelector };
})(window.UILT);
