/*
 * views/explainers/arch.js - the picture for the architecture explainer (the text is in
 * data/explainers.js): Conway's law. Registers LELT.explainers[id] = {render(container)}.
 *
 * A product of three areas (checkout, refunds, catalogue), each with a screen, a service and its
 * data: nine parts. Two ways to split the teams: by layer (front end, back end, database) or by
 * product area. A change touches some parts; the teams involved are the owners of those parts, and
 * the conversations between them are n(n-1)/2.
 */
(function (U) {
  'use strict';
  var h = U.h, S = U.toolKit.svg;
  U.explainers = U.explainers || {};

  var AREAS = [['checkout', 'Checkout'], ['refunds', 'Refunds'], ['catalogue', 'Catalogue']];
  var LAYERS = [['ui', 'Screen'], ['api', 'Service'], ['data', 'Data']];
  var ORGS = [
    { id: 'layers', title: 'Teams by layer', teams: [['ui', 'Front-end team', 'front-end'], ['api', 'Back-end team', 'back-end'], ['data', 'Database team', 'database']],
      owner: function (area, layer) { return layer; } },
    { id: 'streams', title: 'Teams by product area', teams: [['checkout', 'Checkout team', 'checkout'], ['refunds', 'Refunds team', 'refunds'], ['catalogue', 'Catalogue team', 'catalogue']],
      owner: function (area) { return area; } }
  ];
  var CHANGES = [
    { id: 'refunds', title: 'Customers request a refund in the app', touches: [['refunds', 'ui'], ['refunds', 'api'], ['refunds', 'data']] },
    { id: 'status', title: 'Show the refund status on the checkout page', touches: [['checkout', 'ui'], ['refunds', 'api']] },
    { id: 'db', title: 'Upgrade PostgreSQL everywhere', touches: [['checkout', 'data'], ['refunds', 'data'], ['catalogue', 'data']] }
  ];

  function find(list, id) { return list.filter(function (x) { return (x.id || x[0]) === id; })[0]; }

  /** The teams a change involves under an organisation, and the conversations between them. */
  function involved(org, change) {
    var teams = [];
    change.touches.forEach(function (t) { var o = org.owner(t[0], t[1]); if (teams.indexOf(o) < 0) teams.push(o); });
    return { teams: teams, paths: teams.length * (teams.length - 1) / 2 };
  }

  function verdict(org, change, r) {
    var names = r.teams.map(function (t) { return find(org.teams, t)[2]; });
    if (r.teams.length === 1) {
      return change.id === 'db'
        ? 'One team does all of it, in its own backlog: cross-cutting technical work is what teams by layer are good at.'
        : 'One team can build, test and ship it alone: no handoffs and no waiting on another backlog. This is what teams by product area are for.';
    }
    var list = names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] + ' teams';
    if (change.id === 'db') {
      return 'The ' + list + ' each have to do it, in their own backlogs and at their own pace. Product-area teams pay on cross-cutting work like this: give it an owner, such as a platform team, or it is done three times, three ways.';
    }
    if (org.id === 'layers') {
      return 'The ' + list + ' must all change their part, and the feature waits for the slowest backlog: ' + U.plural(r.teams.length - 1, 'handoff') +
        ' at least, ' + U.plural(r.paths, 'conversation') + ' to keep in step, and a contract between each layer to agree first.';
    }
    return 'The ' + list + ' must agree an interface between their parts: ' + U.plural(r.paths, 'conversation') + '. Some features always cross a boundary; what matters is how often.';
  }

  U.explainers['conways-law'] = {
    render: function (box) {
      var st = { org: 'layers', change: 'refunds' };
      var orgs = h('div', { class: 'chips cw-orgs', role: 'group', 'aria-label': 'How the teams are split' });
      var changes = h('div', { class: 'chips cw-changes', role: 'group', 'aria-label': 'What has to change' });
      var pic = h('div', { class: 'cw-pic' }), legend = h('ul', { class: 'cw-legend' }), result = h('div', { class: 'cw-result callout callout-info' });
      box.appendChild(h('span', { class: 'field-label' }, 'How the teams are split'));
      box.appendChild(orgs);
      box.appendChild(h('span', { class: 'field-label' }, 'What has to change'));
      box.appendChild(changes);
      box.appendChild(h('div', { class: 'cw-layout' }, h('div', null, pic, legend), result));

      function draw() {
        var org = find(ORGS, st.org), change = find(CHANGES, st.change), r = involved(org, change);
        orgs.innerHTML = '';
        ORGS.forEach(function (o) {
          orgs.appendChild(h('button', { class: 'chip cw-org' + (o.id === org.id ? ' selected' : ''), type: 'button', 'data-org': o.id,
            'aria-pressed': o.id === org.id ? 'true' : 'false', onclick: function () { st.org = o.id; draw(); } }, o.title));
        });
        changes.innerHTML = '';
        CHANGES.forEach(function (c) {
          changes.appendChild(h('button', { class: 'chip cw-change' + (c.id === change.id ? ' selected' : ''), type: 'button', 'data-change': c.id,
            'aria-pressed': c.id === change.id ? 'true' : 'false', onclick: function () { st.change = c.id; draw(); } }, c.title));
        });

        // the nine parts: product areas across, layers down, coloured by the team that owns them
        var W = U.toolKit.chartWidth(pic, 460), L = 66, T = 24, cw = (W - L - 6) / 3, ch = 46, gap = 6, H = T + 3 * (ch + gap) + 4;
        var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'cw-svg cw-grid', role: 'img',
          'aria-label': change.title + ': ' + U.plural(r.teams.length, 'team') + ' involved' });
        AREAS.forEach(function (a, i) { svg.appendChild(S('text', { class: 'hist-tick', x: L + i * cw + (cw - gap) / 2, y: 16, 'text-anchor': 'middle' }, a[1])); });
        LAYERS.forEach(function (l, j) {
          svg.appendChild(S('text', { class: 'hist-tick', x: L - 8, y: T + j * (ch + gap) + ch / 2 + 4, 'text-anchor': 'end' }, l[1]));
          AREAS.forEach(function (a, i) {
            var owner = org.owner(a[0], l[0]), team = org.teams.map(function (t) { return t[0]; }).indexOf(owner);
            var touched = change.touches.some(function (t) { return t[0] === a[0] && t[1] === l[0]; });
            svg.appendChild(S('rect', { class: 'cw-part cw-t' + team + (touched ? ' cw-touched' : ''), x: L + i * cw, y: T + j * (ch + gap), width: cw - gap, height: ch, rx: 6 }));
            if (touched) svg.appendChild(S('text', { class: 'cw-mark', x: L + i * cw + (cw - gap) / 2, y: T + j * (ch + gap) + ch / 2 + 5, 'text-anchor': 'middle' }, 'changes'));
          });
        });
        pic.innerHTML = '';
        pic.appendChild(svg);
        legend.innerHTML = '';
        org.teams.forEach(function (t, k) {
          var on = r.teams.indexOf(t[0]) >= 0;
          legend.appendChild(h('li', { class: on ? 'on' : null }, h('span', { class: 'cw-swatch cw-t' + k }), on ? h('b', null, t[1]) : t[1]));
        });
        result.dataset.teams = String(r.teams.length);
        result.dataset.paths = String(r.paths);
        result.innerHTML = '';
        result.appendChild(h('div', { class: 'callout-title' }, change.title));
        result.appendChild(h('p', { class: 'cw-count' }, h('b', null, U.plural(r.teams.length, 'team')), ' involved · ', h('b', null, U.plural(r.paths, 'conversation')), ' between them'));
        result.appendChild(h('p', null, verdict(org, change, r)));
      }
      draw();
    }
  };
})(window.LELT);
