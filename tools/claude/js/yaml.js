/*
 * yaml.js - reads and writes the YAML that skills and subagents start with (their frontmatter).
 *
 * Claude Code reads a SKILL.md's or an agent file's fields from YAML between --- lines. When that YAML
 * does not parse, the skill still loads but with no fields at all, and Claude Code says nothing, so
 * the tools check the YAML the way a YAML parser would. This is the part of YAML such files use:
 * "key: value" maps, nested maps and lists by indentation, "- item" lists, [a, b] and {a: b} on one
 * line, single- and double-quoted strings, | and > blocks, comments, null, booleans and numbers. The
 * browser tests prove it reads every case the same as PyYAML and refuses what PyYAML refuses.
 *
 *   CLT.yaml.parse(text)        -> {ok: true, value, warnings} | {ok: false, error, line}
 *   CLT.yaml.frontmatter(file)  -> {found, fields, body, error, line}   found: the file starts with ---
 *   CLT.yaml.dump(object)       -> YAML text (no --- lines) that reads back as the same object
 */
(function (U) {
  'use strict';

  function Fail(msg, line) { this.msg = msg; this.line = line; }

  /** The line without its comment: a # at the start or after a space, outside quotes. */
  function uncomment(s) {
    var q = null;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (q) {
        if (q === '"' && c === '\\') { i++; continue; }
        if (c === q) {
          if (q === '\'' && s[i + 1] === '\'') { i++; continue; }
          q = null;
        }
      } else if (c === '"' || c === '\'') {
        if (i === 0 || /[\s[{,:]/.test(s[i - 1])) q = c;
      } else if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) {
        return s.slice(0, i);
      }
    }
    return s;
  }
  function indentOf(s) { return s.length - s.replace(/^ +/, '').length; }
  function blankLine(s) { return !uncomment(s).trim(); }

  /* ---------- scalars ---------- */

  var NULLS = /^(?:~|null|Null|NULL)?$/;
  var BOOLS = { 'true': true, 'True': true, 'TRUE': true, 'false': false, 'False': false, 'FALSE': false };
  function plainValue(s) {
    if (NULLS.test(s)) return null;
    if (Object.prototype.hasOwnProperty.call(BOOLS, s)) return BOOLS[s];
    if (/^[-+]?\d+$/.test(s)) return parseInt(s, 10);   // YAML 1.2: 012 is 12 (YAML 1.1 read it as octal)
    if (/^[-+]?(?:\d+\.\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(s)) return parseFloat(s);
    return s;
  }
  /** Can this text be a plain (unquoted) scalar where a value starts? Throws the reason when not. */
  function checkPlain(s, line) {
    if (/^[@`]/.test(s)) throw new Fail('a value cannot start with ' + s[0] + ' unless it is quoted', line);
    if (/^[*&!%]/.test(s)) throw new Fail('a value starting with ' + s[0] + ' is an alias, anchor, tag or directive in YAML: quote it', line);
    if (/^[|>]/.test(s)) throw new Fail('a | or > block must be followed by its lines, indented', line);
    if (/^[-?:](?:\s|$)/.test(s)) throw new Fail('"' + s[0] + ' " cannot start a value here', line);
    if (/:(?:\s|$)/.test(s)) throw new Fail('a ": " inside an unquoted value makes YAML read a second key: quote the value', line);
  }

  function unescapeDouble(body, line) {
    return body.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|.)/g, function (_, e) {
      var map = { n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\', '/': '/', '0': '\0', ' ': ' ', b: '\b', e: '\x1b', a: '\x07', f: '\f', v: '\v', N: '\x85', _: '\xa0' };
      if (e.length > 1) return String.fromCodePoint(parseInt(e.slice(1), 16));
      if (!Object.prototype.hasOwnProperty.call(map, e)) throw new Fail('unknown escape \\' + e + ' in a double-quoted string', line);
      return map[e];
    });
  }
  /** A quoted scalar that starts at s[0]; returns [value, rest of the text]. Lines after a break fold into one space. */
  function quoted(s, line) {
    var q = s[0], i = 1, out = '';
    for (; i < s.length; i++) {
      var c = s[i];
      if (q === '"' && c === '\\') { out += c + s[++i]; continue; }
      if (c === q) {
        if (q === '\'' && s[i + 1] === '\'') { out += '\''; i++; continue; }
        return [q === '"' ? unescapeDouble(out, line) : out, s.slice(i + 1)];
      }
      out += c;
    }
    return null;   // not closed on this text
  }
  function fold(lines) {
    // line breaks inside a quoted or plain scalar become spaces; an empty line becomes a newline
    var out = '';
    lines.forEach(function (l, n) {
      var t = n === 0 ? l.replace(/\s+$/, '') : l.trim();
      if (n === 0) out = t;
      else if (!t) out += '\n';
      else out += (/\n$/.test(out) || !out ? '' : ' ') + t;
    });
    return out;
  }

  /* ---------- [a, b] and {a: b} on a line ---------- */

  function flow(s, pos, line) {
    var open = s[pos], close = open === '[' ? ']' : '}', out = open === '[' ? [] : {}, i = pos + 1;
    function skip() { while (i < s.length && /\s/.test(s[i])) i++; }
    function item() {
      skip();
      if (s[i] === '[' || s[i] === '{') { var r = flow(s, i, line); i = r[1]; return r[0]; }
      if (s[i] === '"' || s[i] === '\'') {
        var qv = quoted(s.slice(i), line);
        if (!qv) throw new Fail('a quoted string is never closed', line);
        i = s.length - qv[1].length;
        return qv[0];
      }
      var start = i;
      while (i < s.length && !/[,\]}]/.test(s[i]) && !(s[i] === ':' && /[\s,\]}]/.test(s[i + 1] || ' '))) i++;
      var raw = s.slice(start, i).trim();
      if (/^[@`*&!|>%]/.test(raw)) throw new Fail('a value cannot start with ' + raw[0] + ' unless it is quoted', line);
      return plainValue(raw);
    }
    for (;;) {
      skip();
      if (i >= s.length) throw new Fail('a ' + open + ' is never closed with ' + close, line);
      if (s[i] === close) return [out, i + 1];
      var v = item();
      skip();
      if (open === '{') {
        if (s[i] !== ':') throw new Fail('{ } holds key: value pairs', line);
        i++;
        out[String(v)] = item();
        skip();
      } else out.push(v);
      if (s[i] === ',') { i++; continue; }
      if (s[i] === close) return [out, i + 1];
      if (i >= s.length) throw new Fail('a ' + open + ' is never closed with ' + close, line);
      throw new Fail('expected , or ' + close + ' in a ' + open + ' list', line);
    }
  }

  /* ---------- blocks ---------- */

  function Parser(text) {
    this.lines = String(text).replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
    this.warnings = [];
    for (var n = 0; n < this.lines.length; n++) {
      if (/^ *\t/.test(this.lines[n]) && !blankLine(this.lines[n].replace(/\t/g, ' '))) throw new Fail('a tab is used to indent: YAML allows spaces only', n + 1);
    }
  }
  Parser.prototype.next = function (i) {   // the next line with content, from i
    while (i < this.lines.length && blankLine(this.lines[i])) i++;
    return i;
  };
  Parser.prototype.block = function (i, indent) {
    i = this.next(i);
    if (i >= this.lines.length) return [null, i];
    var l = uncomment(this.lines[i]).replace(/\s+$/, ''), t = l.trim();
    if (/^-(?:\s|$)/.test(t)) return this.seq(i, indentOf(l));
    if (this.isKey(t)) return this.map(i, indentOf(l));
    return this.scalarAt(t, i, indent - 1);
  };
  /** Is this the start of a "key: value" line? */
  Parser.prototype.isKey = function (t) {
    if (t[0] === '"' || t[0] === '\'') { var q = quoted(t, 0); return !!q && /^\s*:(?:\s|$)/.test(q[1]); }
    if (t[0] === '[' || t[0] === '{') return false;
    return /^[^\s#][^:]*?:(?:\s|$)/.test(t) || /^[^\s#].*?:(?:\s|$)/.test(t) && !/^[-?] /.test(t);
  };
  Parser.prototype.splitKey = function (t, line) {
    if (t[0] === '"' || t[0] === '\'') {
      var q = quoted(t, line), m = /^\s*:(?:\s+|$)/.exec(q[1]);
      return [q[0], q[1].slice(m[0].length)];
    }
    var at = t.search(/:(?:\s|$)/);
    var key = t.slice(0, at).trim();
    if (/^[@`*&!|>%]/.test(key)) throw new Fail('a key cannot start with ' + key[0], line);
    return [key, t.slice(at + 1).replace(/^\s+/, '')];
  };
  Parser.prototype.map = function (i, indent) {
    var out = {}, seen = {};
    for (;;) {
      i = this.next(i);
      if (i >= this.lines.length) return [out, i];
      var raw = this.lines[i], l = uncomment(raw).replace(/\s+$/, ''), ind = indentOf(l);
      if (ind < indent) return [out, i];
      if (ind > indent) throw new Fail('this line is indented more than the key above it: it reads as part of that value, and YAML refuses it', i + 1);
      var t = l.trim();
      if (/^-(?:\s|$)/.test(t)) return [out, i];   // a list at the same indent belongs to the parent
      if (!this.isKey(t)) throw new Fail('expected "key: value" (a space after the colon)', i + 1);
      var kv = this.splitKey(t, i + 1), key = String(kv[0]), rest = kv[1], r;
      if (seen[key]) this.warnings.push({ line: i + 1, msg: 'the key "' + key + '" is given twice; the last one wins' });
      seen[key] = true;
      if (!rest) {
        var j = this.next(i + 1);
        if (j < this.lines.length) {
          var nl = uncomment(this.lines[j]).replace(/\s+$/, ''), ni = indentOf(nl);
          if (ni > indent) { r = this.block(j, ni); out[key] = r[0]; i = r[1]; continue; }
          if (ni === indent && /^-(?:\s|$)/.test(nl.trim())) { r = this.seq(j, ni); out[key] = r[0]; i = r[1]; continue; }
        }
        out[key] = null;
        i++;
        continue;
      }
      r = this.value(rest, raw, i, indent);
      out[key] = r[0];
      i = r[1];
    }
  };
  Parser.prototype.seq = function (i, indent) {
    var out = [];
    for (;;) {
      i = this.next(i);
      if (i >= this.lines.length) return [out, i];
      var raw = this.lines[i], l = uncomment(raw).replace(/\s+$/, ''), ind = indentOf(l), t = l.trim();
      if (ind < indent || (ind === indent && !/^-(?:\s|$)/.test(t))) return [out, i];
      if (ind > indent) throw new Fail('this line is indented more than the list item above it', i + 1);
      var rest = t.replace(/^-\s*/, ''), col = indent + (t.length - rest.length), r;
      if (!rest) {
        var j = this.next(i + 1);
        if (j < this.lines.length && indentOf(this.lines[j]) > indent) { r = this.block(j, indentOf(this.lines[j])); out.push(r[0]); i = r[1]; }
        else { out.push(null); i++; }
        continue;
      }
      if (/^-(?:\s|$)/.test(rest) || this.isKey(rest)) {
        // "- key: value": a map (or a nested list) that starts on the dash's line
        var saved = this.lines[i];
        this.lines[i] = new Array(col + 1).join(' ') + raw.slice(raw.indexOf(rest[0], raw.indexOf('-') + 1));
        r = this.block(i, col);
        this.lines[i] = saved;
        out.push(r[0]);
        i = r[1];
        continue;
      }
      r = this.value(rest, raw, i, indent);
      out.push(r[0]);
      i = r[1];
    }
  };
  /** The value after "key: " or "- " on line i; parent is the indent of the key or dash. */
  Parser.prototype.value = function (rest, raw, i, parent) {
    var c = rest[0], self = this;
    function onlyComment(after, line) {
      if (uncomment(after).trim()) throw new Fail('text after the end of the value: quote the whole value', line);
    }
    if (c === '|' || c === '>') {
      var m = /^([|>])([-+]?)(\d?)\s*$/.exec(rest);
      if (!m) throw new Fail('a | or > block must end its line', i + 1);
      return this.blockScalar(i, parent, m[1], m[2]);
    }
    if (c === '[' || c === '{') {
      var text = uncomment(raw).slice(uncomment(raw).indexOf(c)), j = i;
      for (;;) {
        try {
          var f = flow(text, 0, i + 1);
          onlyComment(text.slice(f[1]), j + 1);
          return [f[0], j + 1];
        } catch (e) {
          var k = this.next(j + 1);
          if (!(e instanceof Fail) || !/never closed/.test(e.msg) || k >= this.lines.length || indentOf(this.lines[k]) <= parent) throw e;
          text += ' ' + uncomment(this.lines[k]).trim();
          j = k;
        }
      }
    }
    if (c === '"' || c === '\'') {
      // rest ends where the line's content ends, so the quote opens rest.length before that, in the raw line too
      var parts = [raw.slice(uncomment(raw).replace(/\s+$/, '').length - rest.length)], j2 = i;
      for (;;) {
        var q = quoted(fold(parts), i + 1);
        if (q) { onlyComment(q[1], j2 + 1); return [q[0], j2 + 1]; }
        j2++;
        if (j2 >= this.lines.length) throw new Fail('a quoted string is never closed', i + 1);
        parts.push(this.lines[j2]);
      }
    }
    return this.scalarAt(rest, i, parent);
  };
  /** A plain scalar starting with t on line i, with any continuation lines indented past parent. */
  Parser.prototype.scalarAt = function (t, i, parent) {
    checkPlain(t, i + 1);
    var parts = [t], j = i + 1;
    for (;;) {
      var k = j;
      while (k < this.lines.length && !this.lines[k].trim()) k++;
      if (k >= this.lines.length) break;
      var l = uncomment(this.lines[k]);
      if (!l.trim()) { j = k + 1; continue; }   // a comment-only line ends nothing
      if (indentOf(l) <= parent) break;
      var more = l.trim();
      if (/:(?:\s|$)/.test(more)) throw new Fail('a ": " inside an unquoted value makes YAML read a second key: quote the value', k + 1);
      for (var e = j; e < k; e++) parts.push('');
      parts.push(more);
      j = k + 1;
    }
    return [plainValue(fold(parts).replace(/\s+$/, '')), j];
  };
  Parser.prototype.blockScalar = function (i, parent, style, chomp) {
    var body = [], j = i + 1, ind = -1;
    while (j < this.lines.length) {
      var l = this.lines[j];
      if (!l.trim()) { body.push(''); j++; continue; }
      var li = indentOf(l);
      if (ind < 0) { if (li <= parent) break; ind = li; }
      if (li < ind) break;
      body.push(l.slice(ind));
      j++;
    }
    while (body.length && body[body.length - 1] === '' && chomp !== '+') body.pop();
    var text;
    if (style === '|') text = body.join('\n');
    else {
      text = '';
      body.forEach(function (l, n) {
        if (n === 0) text = l;
        else if (!l) text += '\n';
        else if (/^\s/.test(l) || /\n$/.test(text)) text += (/\n$/.test(text) ? '' : '\n') + l;
        else text += ' ' + l;
      });
    }
    if (chomp !== '-' && body.length) text += '\n';
    return [text, j];
  };

  function parse(text) {
    try {
      var p = new Parser(text), first = p.next(0);
      if (first >= p.lines.length) return { ok: true, value: null, warnings: [] };
      var r = p.block(first, indentOf(p.lines[first]));
      var rest = p.next(r[1]);
      if (rest < p.lines.length) throw new Fail('this line does not fit the structure above it (check its indent)', rest + 1);
      return { ok: true, value: r[0], warnings: p.warnings };
    } catch (e) {
      if (e instanceof Fail) return { ok: false, error: e.msg, line: e.line };
      throw e;
    }
  }

  /** A file's frontmatter: it counts only when --- is the very first line, as Claude Code reads it. */
  function frontmatter(file) {
    var text = String(file || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    if (!/^---[ \t]*\n/.test(text)) return { found: false, fields: null, body: text, error: null };
    var lines = text.split('\n'), end = -1;
    for (var n = 1; n < lines.length; n++) if (/^---[ \t]*$/.test(lines[n])) { end = n; break; }
    if (end < 0) return { found: true, fields: null, body: '', error: 'the frontmatter is never closed with a --- line', line: lines.length };
    var res = parse(lines.slice(1, end).join('\n'));
    var body = lines.slice(end + 1).join('\n');
    if (!res.ok) return { found: true, fields: null, body: body, error: res.error, line: res.line + 1, yamlLines: end - 1 };
    var v = res.value === null ? {} : res.value;
    if (typeof v !== 'object' || Array.isArray(v)) return { found: true, fields: null, body: body, error: 'the frontmatter is not a set of "key: value" fields', line: 2 };
    return { found: true, fields: v, body: body, error: null, warnings: res.warnings, yamlLines: end - 1 };
  }

  /* ---------- writing ---------- */

  // strings YAML would read as something else, or that need quotes to survive (YAML 1.1 as well as 1.2)
  var SPECIAL = /^(?:~|null|Null|NULL|true|True|TRUE|false|False|FALSE|yes|Yes|YES|no|No|NO|on|On|ON|off|Off|OFF|y|Y|n|N|\.inf|\.nan|-\.inf)$/;
  var NUMBERISH = /^[-+]?(?:[\d_]+(?:\.[\d_]*)?|\.\d+)(?:[eE][-+]?\d+)?$|^0[xob]|^\d+(?::\d+)+$|^\d{4}-\d\d?-\d\d?/;
  function needsQuotes(s) {
    return !s || s !== s.trim() || SPECIAL.test(s) || NUMBERISH.test(s) || /^[-?:,[\]{}#&*!|>'"%@`]/.test(s) ||
      /:(?:\s|$)|\s#|[\n\t\r\u0000-\u001f\u007f\u0085\u2028\u2029]/.test(s);
  }
  function scalar(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean' || typeof v === 'number') return String(v);
    var s = String(v);
    if (!needsQuotes(s)) return s;
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
      .replace(/[\u0000-\u001f\u007f\u0085\u2028\u2029]/g, function (c) { return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4); }) + '"';
  }
  function isMap(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function lines(v, pad) {
    var out = [];
    if (Array.isArray(v)) {
      v.forEach(function (x) {
        if (isMap(x) && Object.keys(x).length) {
          var inner = lines(x, pad + '  ');
          inner[0] = pad + '- ' + inner[0].slice(pad.length + 2);
          out = out.concat(inner);
        } else if (Array.isArray(x) && x.length) {
          out.push(pad + '-');
          out = out.concat(lines(x, pad + '  '));
        } else out.push(pad + '- ' + (Array.isArray(x) ? '[]' : isMap(x) ? '{}' : scalar(x)));
      });
      return out;
    }
    Object.keys(v).forEach(function (k) {
      var x = v[k], key = needsQuotes(k) ? scalar(k) : k;
      if (Array.isArray(x)) {
        if (!x.length) out.push(pad + key + ': []');
        else { out.push(pad + key + ':'); out = out.concat(lines(x, pad + '  ')); }
      } else if (isMap(x)) {
        if (!Object.keys(x).length) out.push(pad + key + ': {}');
        else { out.push(pad + key + ':'); out = out.concat(lines(x, pad + '  ')); }
      } else {
        var s = scalar(x);
        out.push(pad + key + ':' + (s === '' ? '' : ' ' + s));
      }
    });
    return out;
  }
  function dump(obj) { return lines(obj || {}, '').join('\n') + '\n'; }

  U.yaml = { parse: parse, frontmatter: frontmatter, dump: dump, scalar: scalar, needsQuotes: needsQuotes };
})(window.CLT);
