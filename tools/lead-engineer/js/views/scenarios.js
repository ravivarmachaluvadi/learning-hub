/*
 * views/scenarios.js - the scenario list (#/scenarios, #/scenarios?track=pm) and the player
 * (#/scenarios/<id>).
 *
 * A scenario is a short situation at work. Each decision shows what people say, then 3 or 4 things
 * you could do, in a new order every time. Your choice is locked, its consequence is explained, and
 * three meters move:
 *
 *   trust     how far your manager and stakeholders can rely on what you say
 *   delivery  the chance the work lands on time and works
 *   team      your team's health, growth and willingness to speak up
 *
 * An option either leads to another decision ("next") or ends the scenario with a debrief: your
 * path, what strong leads do, the model script, and a box to say it in your own words (which
 * "Ask Claude" turns into a coaching prompt). Results are kept in "lelt.scenarios.done" as
 * {id: {plays, best, total, at, path: [{step, opt, grade}]}} - best and total describe the last play.
 *
 * Opened from "A week as a lead" (#/scenarios/<id>?week=1), the player shows the day and the
 * scenario's place in the week, records the first play in the week (js/views/week.js), and offers
 * the way back.
 */
(function (U) {
  'use strict';
  var h = U.h;

  var METERS = [
    { id: 'trust', name: 'Trust', what: 'How far your manager and stakeholders can rely on what you say.' },
    { id: 'delivery', name: 'Delivery', what: 'The chance the work lands on time and works.' },
    { id: 'team', name: 'Team', what: 'Your team\'s health, growth and willingness to speak up.' }
  ];
  var GRADE = {
    best: { title: 'Strong choice', kind: 'tip', label: 'Strong' },
    ok: { title: 'Workable, but there is a better move', kind: 'info', label: 'Workable' },
    poor: { title: 'Risky choice', kind: 'warn', label: 'Risky' }
  };
  var LETTERS = 'ABCD';

  function results() { return U.store.get('scenarios.done', {}); }
  function signed(v) { return v > 0 ? '+' + v : String(v); }

  /* ---------- the list ---------- */

  function listPage(root, query) {
    var all = U.data.scenarios || [];
    var done = results();
    var only = query.track && U.track(query.track) ? query.track : null;
    var played = all.filter(function (s) { return done[s.id]; }).length;
    var tracks = (U.data.tracks || []).filter(function (t) { return all.some(function (s) { return s.track === t.id; }); });

    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Scenarios'),
      h('p', null, 'Real situations from a lead\'s week. Read what people say, choose what you would do, and see what happens next. ' +
        'There is rarely one perfect answer; "strong" means the move most experienced leads would make in that setting. ' +
        'You have played ' + played + ' of ' + all.length + '.')));
    root.appendChild(h('a', { class: 'card wk-promo', href: '#/week' },
      h('div', { class: 'card-kicker' }, 'Practice under pressure'),
      h('b', null, 'A week as a lead: '), '12 mixed scenarios, Monday to Friday, scored area by area against how you rated yourself →'));
    root.appendChild(h('div', { class: 'meter-legend' }, METERS.map(function (m) {
      return h('span', null, h('b', null, m.name + ': '), m.what);
    })));
    root.appendChild(h('div', { class: 'chips filter-chips', role: 'group', 'aria-label': 'Show scenarios from' },
      h('a', { class: 'chip' + (only ? '' : ' selected'), href: '#/scenarios' }, 'All'),
      tracks.map(function (t) {
        return h('a', { class: 'chip' + (only === t.id ? ' selected' : ''), href: '#/scenarios?track=' + t.id }, t.name);
      })));
    var grid = h('div', { class: 'cards sc-cards' });
    all.filter(function (s) { return !only || s.track === only; }).forEach(function (s) {
      var r = done[s.id];
      grid.appendChild(h('a', { class: 'card sc-card' + (r ? ' played' : ''), href: '#/scenarios/' + s.id, 'data-id': s.id, 'data-track': s.track },
        h('div', { class: 'row' }, U.trackBadge(s.track), h('span', { class: 'spacer' }),
          r ? h('span', { class: 'badge ' + (r.best === r.total ? 'badge-ok' : 'badge-warn') }, 'Strong ' + r.best + ' of ' + r.total) : null),
        h('h3', null, s.title),
        h('p', { class: 'muted' }, s.summary)));
    });
    root.appendChild(grid);
  }

  /* ---------- the player ---------- */

  function playPage(root, s, query) {
    var t = U.track(s.track);
    var path, totals, stepsBox, meterEls = {};
    var week = query.week && U.week ? U.week.info(s.id) : null;

    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/scenarios' }, 'Scenarios'), ' › ',
      h('a', { href: '#/scenarios?track=' + s.track }, t ? t.name : s.track)));
    root.appendChild(h('div', { class: 'page-head' },
      h('div', { class: 'row' }, U.trackBadge(s.track)),
      h('h1', null, s.title),
      h('p', null, s.summary)));
    if (week) {
      root.appendChild(h('div', { class: 'sc-week callout callout-info' },
        h('b', null, 'A week as a lead · ' + week.day + ' · ' + week.n + ' of ' + week.total),
        week.recorded ? h('span', { class: 'sc-week-done' }, ' · Already played this week: your first answer counts, so this play will not change it.') : null,
        ' ', h('a', { class: 'sc-week-link', href: '#/week' }, 'Back to your week')));
    }

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
        h('p', { class: 'faint', style: { margin: '8px 0 0' } }, 'Each choice moves these. They show the likely effect, not a score to maximise.')));
    root.appendChild(h('div', { class: 'sc-layout' }, main, side));

    main.appendChild(h('div', { class: 'card sc-role' },
      h('dl', { class: 'sc-facts' },
        h('dt', null, 'Your role'), h('dd', { html: U.mdInline(s.role) }),
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
      totals = { trust: 0, delivery: 0, team: 0 };
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
      if (week) U.week.record(s.id, path);

      var own = h('textarea', { class: 'input sc-own', rows: 4, 'aria-label': 'What you would actually say',
        placeholder: 'Write the words you would really use, then ask Claude to coach you on them.' });
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
        h('h3', null, 'What strong leads do'),
        h('ul', { class: 'sc-points' }, d.points.map(function (p) { return h('li', { html: U.mdInline(p) }); })),
        h('h3', null, 'The model script'),
        h('div', { class: 'sc-script', html: U.md(d.script) }),
        d.analogy ? U.callout('analogy', 'The engineer\'s analogy', U.md(d.analogy)) : null,
        (s.links || []).length ? [h('h3', null, 'Practise next'), h('ul', { class: 'sc-links' }, s.links.map(function (r) {
          var m = /^(\w+):(.+)$/.exec(r);
          return h('li', null, h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) }));
        }))] : null,
        h('h3', null, 'Say it in your own words'),
        h('p', { class: 'muted' }, 'Reading the model script is not the same as saying it. Write what you would actually say in this situation. ' +
          '"Ask Claude" copies a coaching prompt with your words; paste it into Claude.'),
        own,
        h('div', { class: 'row' },
          h('button', { class: 'btn sc-claude', type: 'button', onclick: function () { U.askClaude(prompt(own.value)); } }, 'Ask Claude for feedback'),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn sc-again', type: 'button', onclick: function () { start(); window.scrollTo(0, 0); } }, 'Play again'),
          week ? h('a', { class: 'btn btn-primary sc-week-back', href: '#/week' }, 'Back to your week →')
            : nextScenario() ? h('a', { class: 'btn btn-primary', href: '#/scenarios/' + nextScenario().id }, 'Next scenario →') : null));
      stepsBox.appendChild(box);
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function nextScenario() {
      var all = U.data.scenarios || [];
      return all[all.indexOf(s) + 1] || null;
    }

    function prompt(ownWords) {
      var lines = ['I am a lead engineer (recently promoted from senior engineer) practising a workplace scenario. Please coach me.', '',
        'Scenario: ' + s.title, 'My role: ' + U.plain(s.role), 'The setting: ' + U.plain(s.setting), 'What is at stake: ' + U.plain(s.stakes), '',
        'What happened, and what I chose:'];
      path.forEach(function (p) {
        var st = s.steps[p.step];
        st.lines.forEach(function (ln) { lines.push(ln.narrate ? '- ' + U.plain(ln.narrate) : '- ' + ln.who + ': "' + U.plain(ln.say) + '"'); });
        lines.push('- I chose: ' + U.plain(st.options[p.opt].text));
      });
      lines.push('', 'In my own words, I would say:', ownWords.trim() || '(I have not written my own words yet: please give me two ways to say it.)', '',
        'Please: 1) tell me what works and what does not in my wording, 2) rewrite it the way a respected lead engineer would say it: short, specific, with a date or a next step, ' +
        '3) give me one hard follow-up question the other person might ask, and a good answer to it.');
      return lines.join('\n');
    }

    start();
  }

  U.views.scenarios = {
    render: function (root, params, query) {
      if (!params[0]) return listPage(root, query);
      var s = U.find('scenarios', params[0]);
      if (!s) {
        root.appendChild(h('div', { class: 'card' }, h('h1', null, 'Scenario not found'),
          h('p', null, 'There is no scenario called "' + params[0] + '".'), h('a', { class: 'btn', href: '#/scenarios' }, '← All scenarios')));
        return;
      }
      playPage(root, s, query || {});
    }
  };
  U.route('scenarios', U.views.scenarios);
})(window.LELT);
