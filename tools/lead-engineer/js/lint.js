/*
 * lint.js - finds vague wording in text you are about to send ("in progress", "almost done", "soon").
 *
 * The rules are data (data/lint-rules.js), so adding a phrase never touches this file. Each rule is
 *   {id, re: 'regular expression source', msg: 'what is wrong', fix: 'what to write instead',
 *    example: 'a sentence the rule must flag', good: 'the same sentence rewritten, which no rule flags'}
 * and is matched case-insensitively. Each tool uses its own rule set: the status update builder and
 * the message templates (status), the RAID log (raid), the PRD question generator (prd), the
 * feedback composer (feedback), the 1:1 planner (oneone), the delegation planner (delegate), the design
 * doc builder (prd, on its goals and quality targets), the postmortem builder (blame, and raid on its
 * actions) and the tech-debt business case (debt).
 */
(function (U) {
  'use strict';

  var compiled = {};
  function regexFor(rule) {
    if (!compiled[rule.id]) compiled[rule.id] = new RegExp(rule.re, 'gi');
    var re = compiled[rule.id];
    re.lastIndex = 0;
    return re;
  }

  /**
   * Every place the rules match, as [{rule, start, end, text}] in text order. Where two matches
   * overlap, the earlier (then the longer) one is kept, so each word is marked once.
   */
  function find(text, rules) {
    var hits = [];
    text = String(text || '');
    (rules || []).forEach(function (rule) {
      var re = regexFor(rule), m;
      while ((m = re.exec(text))) {
        if (!m[0]) { re.lastIndex++; continue; }
        hits.push({ rule: rule, start: m.index, end: m.index + m[0].length, text: m[0] });
      }
    });
    hits.sort(function (a, b) { return a.start - b.start || (b.end - b.start) - (a.end - a.start); });
    var kept = [], until = -1;
    hits.forEach(function (x) { if (x.start >= until) { kept.push(x); until = x.end; } });
    return kept;
  }

  /** The text as HTML, with each finding wrapped in <mark> (its title says what is wrong). */
  function highlight(text, hits) {
    text = String(text || '');
    var out = '', at = 0;
    hits.forEach(function (x) {
      out += U.esc(text.slice(at, x.start)) +
        '<mark class="lint-mark" data-rule="' + U.esc(x.rule.id) + '" title="' + U.esc(x.rule.msg) + '">' + U.esc(x.text) + '</mark>';
      at = x.end;
    });
    return out + U.esc(text.slice(at));
  }

  var MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
  var DATE = new RegExp([
    '\\b\\d{1,2}(?:st|nd|rd|th)?\\s+' + MONTH + '(?!\\w)',           // 14 Nov, 3rd March
    '\\b' + MONTH + '\\s+\\d{1,2}(?:st|nd|rd|th)?\\b',                // Nov 14
    '\\b\\d{4}-\\d{2}-\\d{2}\\b',                                    // 2026-11-14
    '\\b\\d{1,2}[/.]\\d{1,2}(?:[/.]\\d{2,4})?\\b',                   // 14/11, 14.11.26
    '\\b(?:(?:mon|tue|tues|wed|thu|thur|thurs|fri)(?:day|sday|nesday|rsday)?|saturday|sunday)\\b', // Friday, Fri ("sat" and "sun" are ordinary words too)
    '\\b(?:today|tomorrow|tonight|noon|eod|end of (?:the )?day)\\b',
    '\\b\\d{1,2}(?::\\d{2})?\\s?(?:am|pm)\\b'                         // 4 pm, 10:30am
  ].join('|'), 'i');

  /** True when the text names a day or a time: "Thu 14 Nov", "tomorrow", "by 4 pm", "2026-11-14". */
  function hasDate(text) { return DATE.test(String(text || '')); }

  U.lint = { find: find, highlight: highlight, hasDate: hasDate };
})(window.LELT);
