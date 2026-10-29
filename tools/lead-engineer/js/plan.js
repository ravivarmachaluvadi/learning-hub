/*
 * plan.js - the arithmetic behind the planning tools and the explainers: three-point (PERT)
 * estimates, a seeded Monte Carlo simulation, percentiles, Brooks's law, and working-day dates.
 *
 * Nothing here touches the page, so the browser tests call these functions directly and compare
 * them with numbers worked out by hand.
 *
 *   PERT        a task estimated as optimistic (o), most likely (m) and pessimistic (p) has an
 *               expected value of (o + 4m + p) / 6 and a spread (standard deviation) of (p - o) / 6.
 *   simulation  each trial draws every task from a "beta-PERT" distribution (the curve PERT's
 *               formula comes from, so its average is the PERT value) and adds them up; 10,000
 *               trials give the spread of possible totals. The random numbers come from a seeded
 *               generator, so the same input always gives the same answer.
 */
(function (U) {
  'use strict';

  /** A seeded random number generator (mulberry32): the same seed always gives the same sequence in [0, 1). */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** One task's PERT numbers: {mean, sd}. */
  function pert(o, m, p) { return { mean: (o + 4 * m + p) / 6, sd: (p - o) / 6 }; }

  /** The PERT total of several tasks [{o, m, p}]: means add up; spreads add as the square root of the summed squares. */
  function pertTotal(tasks) {
    var mean = 0, v = 0;
    tasks.forEach(function (t) { var x = pert(t.o, t.m, t.p); mean += x.mean; v += x.sd * x.sd; });
    return { mean: mean, sd: Math.sqrt(v) };
  }

  /** A standard normal number (Box-Muller). */
  function normal(rand) {
    var u = 1 - rand(), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** A gamma-distributed number with shape a >= 1 (Marsaglia and Tsang's method). */
  function gamma(rand, a) {
    var d = a - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      var x = normal(rand), v = 1 + c * x;
      if (v <= 0) continue;
      v = v * v * v;
      var u = rand();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  /** One draw from the beta-PERT distribution between o and p, peaking at m. Its average is (o + 4m + p) / 6. */
  function betaPert(rand, o, m, p) {
    if (!(p > o)) return m;
    var a = 1 + 4 * (m - o) / (p - o), b = 1 + 4 * (p - m) / (p - o);
    var x = gamma(rand, a), y = gamma(rand, b);
    return o + (p - o) * x / (x + y);
  }

  /** The value below which a share q of the sorted numbers fall (nearest rank). */
  function percentile(sorted, q) {
    if (!sorted.length) return NaN;
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
  }

  /**
   * Simulate the work many times. tasks: [{kind, o, m, p}], in days of focused work. opts: {seed,
   * trials, people, focus}. Work is shared between the people and slowed by the focus factor (the
   * share of a day spent on this work); "wait" tasks (waiting on others) are calendar time that no
   * number of people shortens, so they are added on top.
   * Returns {days: sorted working days per trial, p50, p85, mean}.
   */
  function simulate(tasks, opts) {
    opts = opts || {};
    var rand = rng(opts.seed === undefined ? 42 : opts.seed);
    var n = opts.trials || 10000, rate = (opts.people || 1) * (opts.focus || 1);
    var days = new Array(n), sum = 0;
    for (var i = 0; i < n; i++) {
      var work = 0, wait = 0;
      for (var j = 0; j < tasks.length; j++) {
        var t = tasks[j], x = betaPert(rand, t.o, t.m, t.p);
        if (t.kind === 'wait') wait += x; else work += x;
      }
      days[i] = work / rate + wait;
      sum += days[i];
    }
    days.sort(function (a, b) { return a - b; });
    return { days: days, p50: percentile(days, 0.5), p85: percentile(days, 0.85), mean: sum / n };
  }

  /** Counts of values in equal-width bins: {bins: [{from, to, count}], min, max}. */
  function histogram(sorted, nBins) {
    var min = sorted[0], max = sorted[sorted.length - 1], bins = [];
    var w = (max - min) / nBins || 1;
    for (var i = 0; i < nBins; i++) bins.push({ from: min + i * w, to: min + (i + 1) * w, count: 0 });
    sorted.forEach(function (v) { bins[Math.min(nBins - 1, Math.floor((v - min) / w))].count++; });
    return { bins: bins, min: min, max: max };
  }

  /**
   * Brooks's law, as a rough model: n people have `weeks` of work left; k people join. For the first
   * `ramp` weeks the newcomers produce nothing and teaching them costs the team a tenth of its time
   * per newcomer (at most half). After that everyone works at full speed, which is generous.
   * Returns {weeks, helps, pathsBefore, pathsAfter}: the new duration, whether it beats `weeks`, and
   * the communication paths n(n-1)/2 before and after.
   */
  function brooks(n, k, weeks, ramp) {
    var tax = Math.min(0.5, 0.1 * k), effort = n * weeks, during = n * (1 - tax) * ramp, out;
    if (!k) out = weeks;
    else if (effort <= during) out = effort / (n * (1 - tax));
    else out = ramp + (effort - during) / (n + k);
    return { weeks: out, helps: out < weeks - 0.05, pathsBefore: paths(n), pathsAfter: paths(n + k) };
  }
  function paths(n) { return n * (n - 1) / 2; }

  /* ---------- working-day dates ---------- */

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /** "2026-11-02" as a local date, or null. */
  function parseDay(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function isWorkday(d) { return d.getDay() !== 0 && d.getDay() !== 6; }
  function plusDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }

  /**
   * The day n working days of work end, when the work starts on `start`: the start counts as day 1
   * (or the next Monday, if it is a weekend). A negative n counts back that many working days.
   */
  function addWorkdays(start, n) {
    var d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    if (n < 0) {
      for (var back = 0; back < -n;) { d = plusDays(d, -1); if (isWorkday(d)) back++; }
      return d;
    }
    while (!isWorkday(d)) d = plusDays(d, 1);
    for (var done = 1; done < n;) { d = plusDays(d, 1); if (isWorkday(d)) done++; }
    return d;
  }

  /** Working days from a to b, both counted: Mon 2 Nov to Fri 13 Nov is 10. Zero when b is before a. */
  function workdaysBetween(a, b) {
    var n = 0;
    for (var d = new Date(a.getFullYear(), a.getMonth(), a.getDate()); d <= b; d = plusDays(d, 1)) if (isWorkday(d)) n++;
    return n;
  }

  /** "Thu 12 Nov": a day a reader can plan on (and the vague-wording checker recognises). */
  function day(d) { return d ? DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] : ''; }

  /** Today, or the state's own "today" (the tool checks' examples carry a fixed one). */
  function today(state) { return parseDay(state && state.today) || parseDay(U.localDate(new Date())); }

  /** A number from a form field, or NaN. */
  function num(v) { var n = typeof v === 'number' ? v : parseFloat(String(v === undefined || v === null ? '' : v).replace(',', '.')); return isFinite(n) ? n : NaN; }
  /** A number rounded to `places` decimals, as text: 22 -> "22.0". */
  function fixed(v, places) { return isFinite(v) ? v.toFixed(places === undefined ? 1 : places) : '-'; }

  U.plan = {
    rng: rng, pert: pert, pertTotal: pertTotal, betaPert: betaPert, percentile: percentile, simulate: simulate,
    histogram: histogram, brooks: brooks, paths: paths,
    parseDay: parseDay, addWorkdays: addWorkdays, workdaysBetween: workdaysBetween, day: day, today: today, plusDays: plusDays, isWorkday: isWorkday,
    num: num, fixed: fixed
  };
})(window.LELT);
