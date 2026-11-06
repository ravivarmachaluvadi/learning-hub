/* outcheck.js - tools/outcheck.py in JavaScript, line for line, for Code Viewer's website copy,
   which has no server to ask (tools/site_static.js). judge(line) -> true / false / null:
   true when the actual value clearly matches what the line says it expected, false when one
   clearly differs, null when it is not a result line or too unclear to call.

   Keep it in step with outcheck.py: test_codeview.py's OutcheckJsTest runs both over every
   "expected" line the repo's programs print (tools/outcheck_corpus.json) and fails on any
   difference.

   Where Python's re and JavaScript's RegExp differ, this spells Python's meaning out:
   \w and \b are Unicode-aware in Python (W and wordStart / wordEnd below), and (?i:...) is
   written as character classes (ci), which every browser understands. */
(function (root) {
  'use strict';
  const W = '[\\p{L}\\p{N}_]';                                    // Python's \w
  const B = w => `(?<!${W})${w}(?!${W})`;                          // \bword\b
  const ci = w => w.replace(/[a-z]/g, c => `[${c}${c.toUpperCase()}]`);   // (?i:word)

  const ERROR_LINE = new RegExp(`^(Exception in thread|Caused by:|\\s+at |\\s+\\.\\.\\. \\d+ more|Error: )`
                                + `|^(?:${W}|[.$])+(Exception|Error)(: |$)`, 'u');
  const EXPECTED_WORD = new RegExp(B('expected'), 'giu');
  const ARROW = /\s*(?:(?<!<)->|=>|→)\s*/u;
  // Python: \s*(?:\(?\b(?:for |from )?both\)?|\bfrom all \w+|\bfor all(?: \w+)?|\(all\))$  with re.I
  const ALL_MARKER = new RegExp(`\\s*(?:\\(?(?<!${W})(?:for |from )?both\\)?|(?<!${W})from all ${W}+`
                                + `|(?<!${W})for all(?: ${W}+)?|\\(all\\))$`, 'iu');
  // the program's own verdict at the very end: "[OK]", "   OK", "match=true", a tick or a cross
  const OWN_VERDICT = new RegExp(`(?:(?<!${W})${ci('match')}\\s*=\\s*(${ci('true')}|${ci('false')})`
    + `|\\[(${ci('ok')}|${ci('pass')}|${ci('fail')}|${ci('mismatch')})\\]`
    + `|\\s{2,}(OK|PASS|FAIL|MISMATCH)|(✓|✗))\\s*$`, 'u');
  const QUALITATIVE = new RegExp(`(?<!${W})(almost|usually|fewer|more than|less than|at least|at most|about|roughly|`
    + `approximately|never|any|some|one of|either|or|not|varies|random)(?!${W})|[<>~≈]`, 'iu');
  const BOUNDARY = new Set(' :>=|,');
  const SPACE = /\s/u;

  const norm = s => s.trim().replace(/\s+/gu, ' ');
  const rstripChars = (s, chars) => { let e = s.length; while (e > 0 && chars.includes(s[e - 1])) e--; return s.slice(0, e); };
  const pySplit = s => s.split(/\s+/u).filter(Boolean);                   // str.split()
  const afterFirst = (s, sep) => s.slice(s.indexOf(sep) + sep.length);     // s.split(sep, 1)[1]

  /* [index, char, depth, inQuote] - depth counts (), [] and {} outside quotes */
  function scan(s) {
    const out = [];
    let depth = 0, quote = null;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (quote) { out.push([i, ch, depth, true]); if (ch === quote) quote = null; continue; }
      if (ch === '"' || ch === "'") { quote = ch; out.push([i, ch, depth, true]); continue; }
      if (')]}'.includes(ch)) depth--;
      out.push([i, ch, depth, false]);
      if ('([{'.includes(ch)) depth++;
    }
    return out;
  }
  function splitTop(s, sep = ',') {
    const out = [];
    let start = 0;
    for (const [i, ch, depth, q] of scan(s)) if (ch === sep && depth === 0 && !q) { out.push(s.slice(start, i).trim()); start = i + 1; }
    out.push(s.slice(start).trim());
    return out.filter(Boolean);
  }
  function topWords(s) {
    let words = 0, inword = false;
    for (const [, ch, depth, q] of scan(s)) {
      if (depth === 0 && !q && SPACE.test(ch)) inword = false;
      else if (!inword) { words++; inword = true; }
    }
    return words;
  }
  function valueOf(seg) {
    let lastSep = -1, lastSpace = -1;
    for (const [i, ch, depth, q] of scan(seg)) {
      if (depth === 0 && !q) { if (ch === '=' || ch === ':') lastSep = i; else if (ch === ' ') lastSpace = i; }
    }
    if (lastSep >= 0) return seg.slice(lastSep + 1).trim();
    if (lastSpace >= 0) return seg.slice(lastSpace + 1).trim();
    return seg.trim();
  }
  function segments(actual) {
    const parts = splitTop(actual);
    if (parts.length === 1) {
      const named = [...actual.matchAll(new RegExp(`[A-Za-z](?:${W}|-)*\\s*=\\s*(\\S+)`, 'gu'))].map(m => m[1]);
      if (named.length > 1 && new RegExp(`^(?:[A-Za-z](?:${W}|-)*\\s*=\\s*\\S+\\s*)+$`, 'u').test(actual)) return named;
      return parts;
    }
    return parts.map(valueOf);
  }
  function endsWith(actual, want) {
    if (actual === want) return true;
    if (want && actual.endsWith(want) && actual.length > want.length) return BOUNDARY.has(actual[actual.length - want.length - 1]);
    return false;
  }
  function stripTrailingNote(s) {
    s = s.trimEnd();
    if (s.endsWith(')')) {
      let depth = 0;
      for (let i = s.length - 1; i >= 0; i--) {
        depth += s[i] === ')' ? 1 : s[i] === '(' ? -1 : 0;
        if (depth === 0) {
          if (i > 0 && s[i - 1] === ' ') return s.slice(0, i).trimEnd();
          break;
        }
      }
    }
    const m = /\s[-—]\s/u.exec(s);
    return m ? s.slice(0, m.index).trimEnd() : s;
  }
  const count = (s, ch) => s.split(ch).length - 1;
  function firstTopLevel(hits, line) {
    for (const m of hits) {
      const before = line.slice(0, m.index);
      if (count(before, '(') <= count(before, ')') && count(before, '[') <= count(before, ']')) return m;
    }
    return hits[0];
  }

  function judge(line) {
    if (ERROR_LINE.test(line) || /^\s*(-{3}|={3})/u.test(line)) return null;
    const hits = [...line.matchAll(EXPECTED_WORD)];
    if (!hits.length) return null;
    const own = OWN_VERDICT.exec(line);
    if (own && own.index >= hits[0].index + hits[0][0].length) {
      const word = own.slice(1).find(g => g).toLowerCase();
      return ['true', 'ok', 'pass', '✓'].includes(word);
    }
    if (hits.length > 1 && line.includes(' | ')) {
      let parts = line.split(' | ').filter(p => new RegExp(B('expected'), 'iu').test(p));
      parts = parts.slice(0, 1).concat(parts.slice(1).map(p => p.split('expected')[0].includes(':') ? p
        : p.replace(new RegExp(`^(\\s*[A-Za-z](?:${W}|-)*)\\s+`, 'u'), '$1: ')));
      if (parts.length > 1) {
        const results = parts.map(judge);
        if (results.includes(false)) return false;
        return results.every(Boolean) ? true : null;
      }
    }
    return judgeOne(line, firstTopLevel(hits, line));
  }

  function judgeOne(line, cut) {
    const rawLeft = line.slice(0, cut.index);
    let rawRight = line.slice(cut.index + cut[0].length);
    rawRight = rawRight.replace(/^\s*[:=]?/u, '');
    const opened = rawLeft.trimEnd().endsWith('(');
    const leftFull = norm(rawLeft);
    const left = rstripChars(leftFull, ' ,;(|');
    let right = norm(rawRight);
    if (opened && right.endsWith(')')) right = right.slice(0, -1).trimEnd();
    right = rstripChars(right, '.').trim();

    if (!left) return null;
    if (!right) return left.endsWith(':') ? true : null;
    const labelled = left.includes(':') || ARROW.test(left) || new RegExp(B('actual'), 'u').test(left);

    const cands = [];
    const parts = left.split(ARROW);
    if (parts.length > 1) cands.push(parts[parts.length - 1].trim());
    if (left.includes(':')) cands.push(afterFirst(left, ':').trim(), afterFirst(leftFull, ':').trim());
    const am = new RegExp(B('actual') + '\\s*:?\\s*(.*)$', 'u').exec(left);
    if (am) cands.push(am[1].trim());
    if (!labelled) cands.push(left);
    for (const c of [...cands]) {
      const m = /\(([^()]+)\)$/u.exec(c);
      if (m) cands.push(m[1].trim(), c.slice(0, m.index).trim());
    }

    const wants = [right];
    let w = right;
    for (let k = 0; k < 4; k++) {
      const w2 = stripTrailingNote(w).replace(ALL_MARKER, '').trim();
      if (!w2 || w2 === w) break;
      wants.push(w2);
      w = w2;
    }

    for (const want of wants) {
      for (const c of cands) {
        if (!labelled && count(c, '=') > 1) continue;
        if (endsWith(norm(c), want)) return true;
        const segs = segments(c);
        if (segs.length > 1) {
          const exp = splitTop(want).length > 1 ? splitTop(want).map(valueOf) : pySplit(want);
          if (exp.length === segs.length && segs.every((a, i) => norm(a) === norm(exp[i]))) return true;
          if (segs.every(s => norm(s) === want)) return true;
        }
      }
    }

    const core = wants[wants.length - 1];
    if (!labelled || QUALITATIVE.test(core) || topWords(core) > 4) return null;
    const primary = cands[0];
    if (primary === undefined || [...primary].length > 160) return null;
    const segs = segments(primary);
    if (segs.length > 1) return splitTop(core).length === 1 && pySplit(core).length === 1 ? false : null;
    return false;
  }

  /* codeview.py check_lines: one verdict per output line, and the counts the page shows */
  function checkLines(output) {
    let text = String(output).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (text.endsWith('\n')) text = text.slice(0, -1);
    const verdicts = [], checks = { pass: 0, fail: 0, unchecked: 0 };
    for (const line of text.split('\n')) {
      const said = line.toLowerCase().includes('expected');
      const v = said ? judge(line) : null;
      verdicts.push(v);
      if (v === true) checks.pass++;
      else if (v === false) checks.fail++;
      else if (said && !ERROR_LINE.test(line)) checks.unchecked++;
    }
    return { verdicts, checks };
  }

  const api = { judge, checkLines };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.outcheck = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
