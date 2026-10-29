/*
 * views/explainers/people.js - the pictures for the people explainers (the text is in
 * data/explainers.js): Tuckman's stages and situational leadership. Each registers
 * LELT.explainers[id] = {render(container)}.
 */
(function (U) {
  'use strict';
  var h = U.h, S = U.toolKit.svg;
  U.explainers = U.explainers || {};

  /* ---------- Tuckman's stages ---------- */

  // "done" is a sketch of how much the team gets done at each stage, for the picture only: not data
  var STAGES = [
    { id: 'forming', name: 'Forming', done: 0.42,
      see: 'People are polite and careful. They wait to be told what to do, ask what the rules are, and avoid disagreeing.',
      needs: 'Direction: a clear goal, roles, how work flows, and permission to ask anything.',
      lead: 'Be clear and present. Set the goal and the first working agreements, pair people up, and make the first wins small and quick.',
      say: '"Here is what we are here to do, and how we will work for now. We will change it together once we know each other."' },
    { id: 'storming', name: 'Storming', done: 0.25,
      see: 'Disagreements surface: how to review code, who decides the design, whose way is right. Some people push; some go quiet.',
      needs: 'Help with conflict: keep it about the work, make sure quiet people are heard, and turn arguments into decisions.',
      lead: 'Do not suppress it and do not take sides. Facilitate: name the disagreement, agree how to decide, and write the result into a working agreement.',
      say: '"We disagree about reviews, which is normal at this stage. Let us put both options on the table and agree how we decide by Friday."' },
    { id: 'norming', name: 'Norming', done: 0.62,
      see: 'Agreements stick. People help each other, give feedback more easily, and the team starts to feel like "us".',
      needs: 'Room, and a bit of challenge: let the team own more of its decisions.',
      lead: 'Step back from deciding. Ask the team to run its own retros and planning, and praise the habits you want to keep.',
      say: '"You agreed this yourselves, and it is working. What would you like to own next?"' },
    { id: 'performing', name: 'Performing', done: 0.9,
      see: 'The team solves problems without you, disagrees openly and quickly, and delivers steadily.',
      needs: 'Stretch and protection: harder goals, growth for each person, and a shield from churn.',
      lead: 'Delegate widely, remove obstacles, and protect the team from changes that would send it back to forming.',
      say: '"What is the hardest thing we could take on next quarter? What is slowing you down that I could remove?"' },
    { id: 'adjourning', name: 'Adjourning', done: 0.5,
      see: 'The project ends or the team breaks up. People feel the loss, or look ahead and drift.',
      needs: 'Closure: recognition, a look back, and a good handover.',
      lead: 'Mark the ending. Thank people specifically, hold a retrospective of the whole project, and make sure knowledge is handed over.',
      say: '"Before we split up, let us look back at what we built and what we learned, and say thank you properly."' }
  ];

  U.explainers.tuckman = {
    render: function (box) {
      var at = 0, note = '';
      var buttons = h('div', { class: 'row tk-buttons' }), chart = h('div', { class: 'tk-chart-box' });
      var explain = h('div', { class: 'tk-explain callout callout-info' }), noteEl = h('p', { class: 'tk-note' });
      box.appendChild(buttons);
      box.appendChild(chart);
      box.appendChild(h('div', { class: 'row tk-actions' },
        h('button', { class: 'btn btn-primary', id: 'tk-next', type: 'button', onclick: function () { note = ''; at = (at + 1) % STAGES.length; draw(); } }, 'Next stage →'),
        h('button', { class: 'btn', id: 'tk-join', type: 'button', onclick: function () {
          var from = STAGES[at].name;
          at = 0;
          note = 'Someone joined during ' + from.toLowerCase() + ': the team forms again. A strong team gets back faster, but it still goes through the stages.';
          draw();
        } }, 'Someone joins the team')));
      box.appendChild(noteEl);
      box.appendChild(explain);

      function draw() {
        var st = STAGES[at];
        buttons.innerHTML = '';
        STAGES.forEach(function (x, i) {
          buttons.appendChild(h('button', { class: 'btn btn-small tk-stage' + (i === at ? ' btn-primary' : ''), type: 'button', 'data-stage': x.id,
            'aria-pressed': i === at ? 'true' : 'false', onclick: function () { note = ''; at = i; draw(); } }, (i + 1) + '. ' + x.name));
        });
        var W = U.toolKit.chartWidth(chart, 640), H = 210, L = 30, R = 30, T = 24, B = 44;
        function x(i) { return L + i / (STAGES.length - 1) * (W - L - R); }
        function y(v) { return T + (1 - v) * (H - T - B); }
        var d = STAGES.map(function (s, i) {
          if (!i) return 'M' + x(0) + ' ' + y(s.done);
          var px = x(i - 1), cx = (px + x(i)) / 2;
          return 'C' + cx + ' ' + y(STAGES[i - 1].done) + ' ' + cx + ' ' + y(s.done) + ' ' + x(i) + ' ' + y(s.done);
        }).join(' ');
        var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tk-chart', role: 'img', 'aria-label': 'The five stages; now: ' + st.name },
          S('line', { class: 'cone-grid', x1: L, x2: W - R, y1: H - B, y2: H - B }),
          S('path', { class: 'tk-line', d: d }),
          STAGES.map(function (s, i) {
            return [S('circle', { class: 'tk-dot' + (i === at ? ' now' : ''), cx: x(i), cy: y(s.done), r: i === at ? 9 : 5 }),
              S('text', { class: 'hist-tick' + (i === at ? ' cone-tick-now' : ''), x: x(i), y: H - B + 18, 'text-anchor': i === 0 ? 'start' : i === STAGES.length - 1 ? 'end' : 'middle' },
                W < 460 ? String(i + 1) : s.name)];
          }),
          S('text', { class: 'hist-tick', x: L, y: T - 8 }, 'how much the team gets done (a sketch, not data)'),
          S('text', { class: 'hist-tick', x: (W + L - R) / 2, y: H - 6, 'text-anchor': 'middle' }, 'time →'));
        chart.innerHTML = '';
        chart.appendChild(svg);
        noteEl.textContent = note;
        noteEl.hidden = !note;
        explain.dataset.stage = st.id;
        explain.innerHTML = '';
        explain.appendChild(h('div', { class: 'callout-title' }, (at + 1) + '. ' + st.name));
        explain.appendChild(h('p', null, h('b', null, 'What you see: '), st.see));
        explain.appendChild(h('p', null, h('b', null, 'What the team needs: '), st.needs));
        explain.appendChild(h('p', null, h('b', null, 'What you do: '), st.lead));
        explain.appendChild(h('p', null, h('b', null, 'Say: '), st.say));
      }
      draw();
    }
  };

  /* ---------- situational leadership ---------- */

  var STYLES = {
    S1: { name: 'Directing', level: 'D1', who: 'an enthusiastic beginner', delegate: [2, 3],
      what: 'Lots of direction, less support needed: they are keen but do not yet know how. Say what, how and when; check often; you make the decisions.',
      say: '"Here is how I would approach it, step by step. Let us look at it together tomorrow morning."' },
    S2: { name: 'Coaching', level: 'D2', who: 'a disillusioned learner', delegate: [3, 4],
      what: 'Lots of direction and lots of support: they have some skill but have hit the hard part and lost confidence. Explain why, ask for their ideas, encourage; you still decide.',
      say: '"Here is the plan and why. What would you change? It is normal for this part to feel hard; you are further along than it feels."' },
    S3: { name: 'Supporting', level: 'D3', who: 'a capable but cautious performer', delegate: [4, 5],
      what: 'Little direction, lots of support: they know how, but are unsure or unmotivated. Listen, ask questions, help them decide; they make the decisions.',
      say: '"You know how to do this. What is your plan? What is making you hesitate?"' },
    S4: { name: 'Delegating', level: 'D4', who: 'a self-reliant achiever', delegate: [6, 7],
      what: 'Little direction, little support: they are skilled and confident. Agree the outcome and how you will hear about progress, then get out of the way.',
      say: '"It is yours. Tell me when it is done, or straight away if anything changes the date."' }
  };
  // where each style sits on the chart: x = directive behaviour, y = supportive behaviour
  var SPOT = { S1: [0.75, 0.25], S2: [0.75, 0.75], S3: [0.25, 0.75], S4: [0.25, 0.25] };

  /** Development level from competence and commitment, each 1 to 5. */
  function styleOf(skill, will) {
    if (skill <= 1) return will >= 3 ? 'S1' : 'S2';
    if (skill === 2) return 'S2';
    if (skill >= 4 && will >= 4) return 'S4';
    return 'S3';
  }

  U.explainers['situational-leadership'] = {
    styleOf: styleOf,
    render: function (box) {
      function slider(id, label, value, lo, hi) {
        var input = h('input', { type: 'range', class: 'range', id: id, min: '1', max: '5', step: '1' });
        input.value = String(value);
        return { input: input, el: h('div', { class: 'field' }, h('label', { for: id }, label), input,
          h('div', { class: 'row sl-scale faint' }, h('span', null, lo), h('span', { class: 'spacer' }), h('span', null, hi))) };
      }
      var skill = slider('sl-skill', 'Competence for this task', 1, 'never done it', 'expert');
      var will = slider('sl-will', 'Commitment: confidence and motivation for this task', 5, 'unsure, reluctant', 'confident, keen');
      var result = h('div', { class: 'sl-result callout callout-tip' }), chart = h('div', { class: 'sl-chart-box' });
      var dele = h('p', { class: 'sl-delegate', id: 'sl-delegate' });
      box.appendChild(h('div', { class: 'sl-layout' },
        h('div', null, skill.el, will.el, result, dele),
        chart));

      function draw() {
        var st = styleOf(+skill.input.value, +will.input.value), x = STYLES[st];
        result.dataset.style = st;
        result.dataset.level = x.level;
        result.innerHTML = '';
        result.appendChild(h('div', { class: 'callout-title' }, x.level + ', ' + x.who + ': use ' + st + ', ' + x.name));
        result.appendChild(h('p', null, x.what));
        result.appendChild(h('p', null, h('b', null, 'Say: '), x.say));
        var lv = U.data.delegationLevels || [];
        dele.innerHTML = '';
        dele.appendChild(h('b', null, 'In the delegation planner: '));
        dele.appendChild(document.createTextNode('about level ' + x.delegate[0] + ' or ' + x.delegate[1] + ' (' +
          x.delegate.map(function (n) { return (lv[n - 1] || {}).name; }).join(' or ') + '), a rough match. '));
        dele.appendChild(h('a', { href: '#/tools/delegate' }, 'Open the planner'));

        var W = 320, H = 300, L = 34, B = 34, T = 10, R = 10, w = W - L - R, hh = H - T - B;
        var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'sl-chart', role: 'img', 'aria-label': 'The four styles; this task calls for ' + x.name },
          ['S3', 'S2', 'S4', 'S1'].map(function (k) {
            var p = SPOT[k], qx = L + (p[0] > 0.5 ? w / 2 : 0), qy = T + (p[1] > 0.5 ? 0 : hh / 2);
            return [S('rect', { class: 'sl-quad' + (k === st ? ' now' : ''), x: qx + 2, y: qy + 2, width: w / 2 - 4, height: hh / 2 - 4, rx: 8 }),
              S('text', { class: 'sl-quad-label' + (k === st ? ' now' : ''), x: qx + w / 4, y: qy + hh / 4 - 4, 'text-anchor': 'middle' }, k),
              S('text', { class: 'sl-quad-name' + (k === st ? ' now' : ''), x: qx + w / 4, y: qy + hh / 4 + 16, 'text-anchor': 'middle' }, STYLES[k].name)];
          }),
          S('circle', { class: 'sl-dot', cx: L + SPOT[st][0] * w, cy: T + (1 - SPOT[st][1]) * hh + 30, r: 7 }),
          S('text', { class: 'hist-tick', x: L + w / 2, y: H - 8, 'text-anchor': 'middle' }, 'directing behaviour →'),
          S('text', { class: 'hist-tick', x: 12, y: T + hh / 2, 'text-anchor': 'middle', transform: 'rotate(-90 12 ' + (T + hh / 2) + ')' }, 'supporting behaviour →'));
        chart.innerHTML = '';
        chart.appendChild(svg);
      }
      skill.input.addEventListener('input', draw);
      will.input.addEventListener('input', draw);
      draw();
    }
  };
})(window.LELT);
