/*
 * views/scenarios.js - the scenario list (#/scenarios, #/scenarios?track=context) and the player
 * (#/scenarios/<id>), under the Practice tab. Adapted from the Lead Engineer Learning Tool.
 *
 * A scenario (data/scenarios.js, from content/scenarios/<track>/*.md) is a moment in a working day
 * with Claude Code. Each decision shows what happens, then 3 or 4 things you could do, in a new order
 * every time. Your choice is locked, its result is explained, and three meters move:
 *
 *   quality  the work is right, and you can prove it
 *   tokens   context and usage are spent well
 *   safety   nothing risky or irreversible happens without a check
 *
 * A choice either leads to another decision ("next") or ends the scenario with a debrief: your path,
 * what experienced users do, what to type (a code block with Copy), links to practise next, the docs it
 * was checked against, and a box for what you would type, which "Ask Claude" turns into a coaching
 * prompt. Results are kept in "clt.scenarios.done" as {id: {plays, best, total, at, path: [{step, opt,
 * grade}]}}; best and total describe the last play.
 *
 * U.practice turns those results into a score per track (strong 5, workable 3, risky 1, averaged over
 * the decisions of each scenario's last play), for the self-assessment's radar and the progress page.
 */
(function (U) {
  'use strict';
  var h = U.h;

  var METERS = [
    { id: 'quality', name: 'Quality', what: 'The work is right, and you can prove it.' },
    { id: 'tokens', name: 'Tokens', what: 'Context and usage are spent well.' },
    { id: 'safety', name: 'Safety', what: 'Nothing risky or irreversible happens without a check.' }
  ];
  var GRADE = {
    best: { title: 'Strong choice', kind: 'tip', label: 'Strong', points: 5 },
    ok: { title: 'Workable, but there is a better move', kind: 'info', label: 'Workable', points: 3 },
    poor: { title: 'Risky choice', kind: 'warn', label: 'Risky', points: 1 }
  };
  var LETTERS = 'ABCD';

  function results() { return U.store.get('scenarios.done', {}) || {}; }
  function signed(v) { return v > 0 ? '+' + v : String(v); }

  /** Practice scores from the scenarios played: {trackId: 1..5} for the tracks with a played scenario. */
  U.practice = {
    scores: function () {
      var done = results(), sum = {}, n = {};
      (U.data.scenarios || []).forEach(function (s) {
        var r = done[s.id];
        if (!r || !Array.isArray(r.path)) return;
        r.path.forEach(function (p) {
          if (!GRADE[p.grade]) return;
          sum[s.track] = (sum[s.track] || 0) + GRADE[p.grade].points;
          n[s.track] = (n[s.track] || 0) + 1;
        });
      });
      var out = {};
      Object.keys(n).forEach(function (t) { out[t] = sum[t] / n[t]; });
      return out;
    },
    /** How many tracks have at least one played scenario, of how many. */
    coverage: function () {
      var s = U.practice.scores(), tracks = U.data.tracks || [];
      return { played: tracks.filter(function (t) { return s[t.id]; }).length, total: tracks.length };
    },
    /** The scores when every track has a played scenario, else null (a radar with gaps would mislead). */
    complete: function () {
      var c = U.practice.coverage();
      return c.played === c.total && c.total ? U.practice.scores() : null;
    }
  };

  /* ---------- the list ---------- */

  function listPage(root, query) {
    var all = U.data.scenarios || [];
    var done = results();
    var only = query.track && U.track(query.track) ? query.track : null;
    var played = all.filter(function (s) { return done[s.id]; }).length;
    var tracks = (U.data.tracks || []).filter(function (t) { return all.some(function (s) { return s.track === t.id; }); });

    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Scenarios'),
      h('p', null, 'Moments from a working day with Claude Code. Read what happens, choose what you would do, and see what follows. ' +
        'There is rarely one perfect answer; "strong" is the move an experienced user would make there, checked against the docs. ' +
        'You have played ' + played + ' of ' + all.length + '.')));
    root.appendChild(h('div', { class: 'cards practice-links' },
      h('a', { class: 'card', href: '#/assess' }, h('div', { class: 'card-kicker' }, 'Where are you?'),
        h('h3', null, 'Self-assessment'), h('p', { class: 'muted' }, '32 everyday habits, rated in five minutes, on a radar with your scenario choices beside it.')),
      h('a', { class: 'card', href: '#/progress' }, h('div', { class: 'card-kicker' }, 'What next?'),
        h('h3', null, 'Your progress'), h('p', { class: 'muted' }, 'Scenarios, lessons and quizzes by track, and what to do next.'))));
    root.appendChild(h('div', { class: 'meter-legend' }, METERS.map(function (m) {
      return h('span', null, h('b', null, m.name + ': '), m.what);
    })));
    root.appendChild(h('div', { class: 'chips filter-chips', role: 'group', 'aria-label': 'Show scenarios from' },
      h('a', { class: 'chip' + (only ? '' : ' selected'), href: '#/scenarios' }, 'All'),
      tracks.map(function (t) {
        return h('a', { class: 'chip' + (only === t.id ? ' selected' : ''), href: '#/scenarios?track=' + t.id }, t.short || t.name);
      })));
    var grid = h('div', { class: 'cards sc-cards' });
    all.filter(function (s) { return !only || s.track === only; }).forEach(function (s) {
      var r = done[s.id];
      grid.appendChild(h('a', { class: 'card sc-card' + (r ? ' played' : ''), href: '#/scenarios/' + s.id, 'data-id': s.id, 'data-track': s.track },
        h('div', { class: 'row' }, U.trackBadge(s.track), h('span', { class: 'spacer' }),
          r ? h('span', { class: 'badge ' + (r.best === r.total ? 'badge-ok' : 'badge-warn') }, 'Strong ' + r.best + ' of ' + r.total) : null),
        h('h3', null, s.title),
        h('p', { class: 'muted', html: U.mdInline(s.summary) })));
    });
    root.appendChild(grid);
  }

  /* ---------- the player ---------- */

  function playPage(root, s) {
    var t = U.track(s.track);
    var path, totals, stepsBox, meterEls = {};

    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/scenarios' }, 'Scenarios'), ' › ',
      h('a', { href: '#/scenarios?track=' + s.track }, t ? t.name : s.track)));
    root.appendChild(h('div', { class: 'page-head' },
      h('div', { class: 'row' }, U.trackBadge(s.track)),
      h('h1', null, s.title),
      h('p', { html: U.mdInline(s.summary) })));

    var main = h('div', { class: 'sc-main' });
    var side = h('aside', { class: 'sc-side' },
      h('div', { class: 'card sc-meters', 'aria-live': 'polite' },
        h('div', { class: 'card-kicker' }, 'How it is going'),
        METERS.map(function (m) {
          var val = h('span', { class: 'meter-val' }, '0');
          var bar = h('span', { class: 'meter-bar' }, h('span', { class: 'meter-fill' }));
          meterEls[m.id] = { val: val, bar: bar };
          return h('div', { class: 'meter', 'data-meter': m.id, title: m.what },
            h('div', { class: 'row' }, h('b', null, m.name), h('span', { class: 'spacer' }), val), bar);
        }),
        h('p', { class: 'faint', style: { margin: '8px 0 0' } }, 'Each choice moves these. They show the likely effect, not a score to chase.')));
    root.appendChild(h('div', { class: 'sc-layout' }, main, side));

    main.appendChild(h('div', { class: 'card sc-role' },
      h('dl', { class: 'sc-facts' },
        h('dt', null, 'You'), h('dd', { html: U.mdInline(s.role) }),
        h('dt', null, 'The setting'), h('dd', { html: U.mdInline(s.setting) }),
        h('dt', null, 'What is at stake'), h('dd', { html: U.mdInline(s.stakes) }))));
    stepsBox = h('div', { class: 'sc-steps' });
    main.appendChild(stepsBox);

    function paintMeters() {
      METERS.forEach(function (m) {
        var v = totals[m.id];
        var el = meterEls[m.id];
        el.val.textContent = signed(v);
        el.val.className = 'meter-val' + (v > 0 ? ' up' : v < 0 ? ' down' : '');
        // the bar is centred: the middle is "no change", and 4 points fill one side
        var fill = el.bar.firstChild, pct = Math.min(50, Math.abs(v) / 4 * 50);
        fill.style.left = (v < 0 ? 50 - pct : 50) + '%';
        fill.style.width = pct + '%';
        fill.className = 'meter-fill' + (v > 0 ? ' up' : v < 0 ? ' down' : '');
      });
    }

    function start() {
      path = [];
      totals = { quality: 0, tokens: 0, safety: 0 };
      stepsBox.innerHTML = '';
      paintMeters();
      showStep(s.start);
    }

    function showStep(key) {
      var st = s.steps[key];
      var box = h('section', { class: 'sc-step', 'data-step': key, 'aria-label': 'Decision ' + (path.length + 1) });
      box.appendChild(h('div', { class: 'sc-dialogue' }, st.lines.map(function (ln) {
        if (ln.narrate) return h('p', { class: 'sc-narrate', html: U.mdInline(ln.narrate) });
        return h('div', { class: 'sc-line' },
          h('div', { class: 'sc-who' }, ln.who),
          h('div', { class: 'sc-say', html: U.mdInline(ln.say) }));
      })));
      box.appendChild(h('h2', { class: 'sc-prompt' }, st.prompt));
      var opts = h('div', { class: 'sc-opts', role: 'group', 'aria-label': st.prompt });
      U.shuffle(st.options.map(function (o, i) { return i; })).forEach(function (i, n) {
        opts.appendChild(h('button', { class: 'sc-opt', type: 'button', 'data-opt': i, onclick: function () { choose(i); } },
          h('span', { class: 'sc-letter', 'aria-hidden': 'true' }, LETTERS[n]),
          h('span', { html: U.mdInline(st.options[i].text) })));
      });
      box.appendChild(opts);
      stepsBox.appendChild(box);
      if (path.length) box.scrollIntoView({ behavior: 'smooth', block: 'start' });

      function choose(i) {
        var o = st.options[i];
        U.$$('.sc-opt', opts).forEach(function (b) {
          b.disabled = true;
          if (+b.getAttribute('data-opt') === i) b.classList.add('chosen', 'grade-' + o.grade);
        });
        path.push({ step: key, opt: i, grade: o.grade });
        METERS.forEach(function (m) { totals[m.id] += (o.meters || {})[m.id] || 0; });
        paintMeters();

        var g = GRADE[o.grade];
        var moved = METERS.filter(function (m) { return (o.meters || {})[m.id]; }).map(function (m) {
          var v = o.meters[m.id];
          return h('span', { class: 'badge ' + (v > 0 ? 'badge-ok' : 'badge-err') }, m.name + ' ' + signed(v));
        });
        var res = h('div', { class: 'sc-result callout callout-' + g.kind, 'data-grade': o.grade },
          h('div', { class: 'callout-title' }, g.title),
          h('div', { class: 'callout-body', html: U.md(o.result) }),
          h('div', { class: 'row sc-moved' }, moved));
        if (o.grade !== 'best') {
          var best = st.options.filter(function (x) { return x.grade === 'best'; })[0];
          res.appendChild(h('p', { class: 'sc-best-was' }, h('b', null, 'The strongest move here: '), h('span', { html: U.mdInline(best.text) })));
        }
        box.appendChild(res);
        var nextBtn = h('button', { class: 'btn btn-primary sc-next', type: 'button', onclick: function () {
          nextBtn.remove();
          if (o.next) showStep(o.next); else debrief();
        } }, o.next ? 'Continue →' : 'See the debrief →');
        box.appendChild(nextBtn);
        nextBtn.focus({ preventScroll: true });
      }
    }

    function debrief() {
      var best = path.filter(function (p) { return p.grade === 'best'; }).length;
      var all = results(), before = all[s.id];
      all[s.id] = { plays: (before ? before.plays || 0 : 0) + 1, best: best, total: path.length, at: new Date().toISOString(), path: path };
      U.store.set('scenarios.done', all);

      var own = h('textarea', { class: 'input sc-own', rows: 4, 'aria-label': 'What you would actually type',
        placeholder: 'The prompt, the commands or the message you would really type here. Then ask Claude to coach you on it.' });
      var d = s.debrief;
      var box = h('section', { class: 'sc-debrief card', 'aria-label': 'Debrief' },
        h('div', { class: 'card-kicker' }, 'Debrief'),
        h('h2', null, best === path.length ? 'Strong all the way: ' + best + ' of ' + path.length :
          'You made the strong move ' + best + ' of ' + path.length + ' times'),
        h('ol', { class: 'sc-path' }, path.map(function (p) {
          var o = s.steps[p.step].options[p.opt];
          return h('li', { 'data-grade': p.grade }, h('span', { class: 'badge grade-badge grade-' + p.grade }, GRADE[p.grade].label), ' ',
            h('span', { html: U.mdInline(o.text) }));
        })),
        h('h3', null, 'What experienced users do'),
        h('ul', { class: 'sc-points' }, d.points.map(function (p) { return h('li', { html: U.mdInline(p) }); })),
        h('h3', null, 'What to type'),
        h('div', { class: 'sc-type', html: U.md('```text\n' + d.type + '\n```') }),
        (s.related || []).length ? [h('h3', null, 'Practise next'), U.linkList(s.related, 'sc-links')] : null,
        h('h3', null, 'Write what you would type'),
        h('p', { class: 'muted' }, 'Reading the strong move is not the same as making it. Write the prompt, commands or message you would really use here. ' +
          '"Ask Claude" copies a coaching prompt with your words in it; paste it into Claude.'),
        own,
        h('div', { class: 'row' },
          h('button', { class: 'btn sc-claude', type: 'button', onclick: function () { U.askClaude(prompt(own.value)); } }, 'Ask Claude for feedback'),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn sc-again', type: 'button', onclick: function () { start(); window.scrollTo(0, 0); } }, 'Play again'),
          nextScenario() ? h('a', { class: 'btn btn-primary', href: '#/scenarios/' + nextScenario().id }, 'Next scenario →') : null),
        h('p', { class: 'faint sc-sources' }, 'Checked against: ', (s.sources || []).map(function (src, i) {
          return [i ? ', ' : '', h('a', { href: src, target: '_blank', rel: 'noopener' }, src.replace(/^https:\/\/code\.claude\.com\/docs\/en\//, 'docs: '))];
        })));
      stepsBox.appendChild(box);
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function nextScenario() {
      var all = U.data.scenarios || [];
      return all[all.indexOf(s) + 1] || null;
    }

    function prompt(ownWords) {
      var lines = ['I am practising how I use Claude Code day to day, on big PRD-driven features in TypeScript and Rust. Please coach me on one scenario.', '',
        'Scenario: ' + s.title, 'Me: ' + U.plain(s.role), 'The setting: ' + U.plain(s.setting), 'What is at stake: ' + U.plain(s.stakes), '',
        'What happened, and what I chose:'];
      path.forEach(function (p) {
        var st = s.steps[p.step];
        st.lines.forEach(function (ln) { lines.push(ln.narrate ? '- ' + U.plain(ln.narrate) : '- ' + ln.who + ': "' + U.plain(ln.say) + '"'); });
        lines.push('- I chose: ' + U.plain(st.options[p.opt].text));
      });
      lines.push('', 'What I would actually type (prompts, commands or the message I would send):',
        ownWords.trim() || '(I have not written it yet: please show me two good ways.)', '',
        'Please: 1) say what works and what does not in what I would type, 2) rewrite it the way an experienced Claude Code user would: short, specific, ' +
        'with the check that proves it worked, 3) name one thing that could still go wrong, and how I would notice it.');
      return lines.join('\n');
    }

    start();
  }

  U.views.scenarios = {
    render: function (root, params, query) {
      if (!params[0]) return listPage(root, query || {});
      var s = U.find('scenarios', params[0]);
      if (!s) {
        root.appendChild(h('div', { class: 'card' }, h('h1', null, 'Scenario not found'),
          h('p', null, 'There is no scenario called "' + params[0] + '".'), h('a', { class: 'btn', href: '#/scenarios' }, '← All scenarios')));
        return;
      }
      playPage(root, s);
    }
  };
  U.route('scenarios', U.views.scenarios);
})(window.CLT);
