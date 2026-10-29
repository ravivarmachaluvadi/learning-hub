/*
 * explainers/rollout-order.js - "Which deploy order is safe?" (#/explain/rollout-order).
 *
 * search-api (the provider) and web-app (the consumer) share GET /search. Each version of each side
 * is described by what it sends and needs: the pair works when every response field web-app reads
 * is sent, and every request field search-api requires is sent. Pick a change and an order of
 * deploys; after each deploy the pair either still works or users see errors.
 */
(function (U) {
  'use strict';
  var h = U.h;
  U.explainers = U.explainers || {};

  // provider: {sends: response fields, requires: request fields}; consumer: {reads: response fields, sends: request fields}
  var SCENARIOS = [
    { id: 'add', title: 'Add a field', about: 'search-api adds `facets` to the response; the new web-app shows them.',
      provider: { v1: { label: 'sends results', sends: ['results'], requires: [] }, v2: { label: 'sends results, facets', sends: ['results', 'facets'], requires: [] } },
      consumer: { v1: { label: 'reads results', reads: ['results'], sends: ['q'] }, v2: { label: 'reads results, facets', reads: ['results', 'facets'], sends: ['q'] } },
      plans: ['provider-first', 'consumer-first'] },
    { id: 'rename', title: 'Rename a field', about: 'The response renames `filters` to `facets`.',
      provider: { v1: { label: 'sends filters', sends: ['results', 'filters'], requires: [] },
        both: { label: 'sends filters and facets', sends: ['results', 'filters', 'facets'], requires: [] },
        v2: { label: 'sends facets', sends: ['results', 'facets'], requires: [] } },
      consumer: { v1: { label: 'reads filters', reads: ['results', 'filters'], sends: ['q'] }, v2: { label: 'reads facets', reads: ['results', 'facets'], sends: ['q'] } },
      plans: ['provider-first', 'consumer-first', 'expand-contract'] },
    { id: 'remove', title: 'Remove a field', about: 'search-api stops sending `suggestions`.',
      provider: { v1: { label: 'sends suggestions', sends: ['results', 'suggestions'], requires: [] }, v2: { label: 'stops sending suggestions', sends: ['results'], requires: [] } },
      consumer: { v1: { label: 'reads suggestions', reads: ['results', 'suggestions'], sends: ['q'] }, v2: { label: 'no longer reads them', reads: ['results'], sends: ['q'] } },
      plans: ['provider-first', 'consumer-first'] },
    { id: 'require', title: 'Require a new request field', about: 'search-api starts to require `locale` in every request.',
      provider: { v1: { label: 'does not know locale', sends: ['results'], requires: [] },
        both: { label: 'accepts locale, optional', sends: ['results'], requires: [] },
        v2: { label: 'requires locale', sends: ['results'], requires: ['locale'] } },
      consumer: { v1: { label: 'sends q', reads: ['results'], sends: ['q'] }, v2: { label: 'sends q, locale', reads: ['results'], sends: ['q', 'locale'] } },
      plans: ['provider-first', 'expand-contract'] }
  ];
  var PLANS = {
    'provider-first': { title: 'Provider first', steps: [['provider', 'v2'], ['consumer', 'v2']] },
    'consumer-first': { title: 'Consumer first', steps: [['consumer', 'v2'], ['provider', 'v2']] },
    'expand-contract': { title: 'Expand, migrate, contract', steps: [['provider', 'both'], ['consumer', 'v2'], ['provider', 'v2']] }
  };

  function scenario(id) { return SCENARIOS.filter(function (s) { return s.id === id; })[0] || SCENARIOS[0]; }

  /** Whether one provider version and one consumer version work together, and why. */
  function pair(p, c) {
    var missing = c.reads.filter(function (f) { return p.sends.indexOf(f) < 0; });
    if (missing.length) return { ok: false, why: 'web-app reads `' + missing.join('`, `') + '`, which this search-api does not send.' };
    var unsent = p.requires.filter(function (f) { return c.sends.indexOf(f) < 0; });
    if (unsent.length) return { ok: false, why: 'search-api requires `' + unsent.join('`, `') + '`, which this web-app does not send: every request is rejected.' };
    return { ok: true, why: 'web-app gets everything it reads, and search-api gets everything it requires.' };
  }

  /** After each deploy of a plan: [{side, version, provider, consumer, ok, why}]. The starting pair (both v1) is not listed. */
  function evaluate(id, planId) {
    var s = scenario(id), plan = PLANS[planId];
    if (!plan || s.plans.indexOf(planId) < 0) return [];
    var now = { provider: 'v1', consumer: 'v1' };
    return plan.steps.map(function (step) {
      now[step[0]] = step[1];
      var p = s.provider[now.provider], c = s.consumer[now.consumer], r = pair(p, c);
      return { side: step[0], version: step[1], provider: p.label, consumer: c.label, ok: r.ok, why: r.why };
    });
  }

  var ex = U.explainers['rollout-order'] = { SCENARIOS: SCENARIOS, PLANS: PLANS, evaluate: evaluate, pair: pair };

  ex.render = function (box) {
    var current = { scenario: 'rename', plan: 'provider-first' };
    var sel = h('select', { class: 'select', id: 'ro-scenario', onchange: function () {
      current.scenario = sel.value;
      if (scenario(sel.value).plans.indexOf(current.plan) < 0) current.plan = scenario(sel.value).plans[0];
      draw();
    } }, SCENARIOS.map(function (s) { return h('option', { value: s.id }, s.title); }));
    sel.value = current.scenario;
    var about = h('p', { class: 'muted ro-about' });
    var plans = h('div', { class: 'row ro-plans' });
    var table = h('table', { class: 'table ro-table' });
    var verdict = h('div', { class: 'pmx-result ro-verdict', id: 'ro-verdict', 'aria-live': 'polite' });
    box.appendChild(h('div', { class: 'field' }, h('label', { for: 'ro-scenario' }, 'The change'), sel));
    box.appendChild(about);
    box.appendChild(h('div', { class: 'field-label' }, 'The order of deploys'));
    box.appendChild(plans);
    box.appendChild(h('div', { class: 'table-wrap' }, table));
    box.appendChild(verdict);

    function draw() {
      var s = scenario(current.scenario), steps = evaluate(s.id, current.plan);
      about.innerHTML = U.mdInline(s.about);
      plans.innerHTML = '';
      s.plans.forEach(function (pid) {
        plans.appendChild(h('button', { class: 'btn btn-small ro-plan' + (pid === current.plan ? ' btn-primary' : ''), type: 'button', 'data-plan': pid,
          'aria-pressed': pid === current.plan ? 'true' : 'false', onclick: function () { current.plan = pid; draw(); } }, PLANS[pid].title));
      });
      table.innerHTML = '';
      table.appendChild(h('thead', null, h('tr', null, h('th', null, 'Deploy'), h('th', null, 'search-api'), h('th', null, 'web-app'), h('th', null, 'Works?'))));
      var start = pair(s.provider.v1, s.consumer.v1);
      table.appendChild(h('tbody', null,
        h('tr', { class: 'ro-start' }, h('td', null, 'Before'), h('td', null, s.provider.v1.label), h('td', null, s.consumer.v1.label),
          h('td', null, start.ok ? '✓ yes' : '✕ no')),
        steps.map(function (x, i) {
          return h('tr', { class: 'ro-step ' + (x.ok ? 'ro-ok' : 'ro-bad'), 'data-ok': x.ok ? 'true' : 'false' },
            h('td', null, (i + 1) + '. ' + (x.side === 'provider' ? 'search-api' : 'web-app')),
            h('td', null, x.provider), h('td', null, x.consumer),
            h('td', null, h('b', null, x.ok ? '✓ yes' : '✕ no'), h('div', { class: 'faint', html: U.mdInline(x.why) })));
        })));
      var broken = steps.filter(function (x) { return !x.ok; }).length;
      verdict.setAttribute('data-ok', broken ? 'false' : 'true');
      verdict.setAttribute('data-decision', broken ? 'deny' : 'allow');
      verdict.innerHTML = '';
      verdict.appendChild(h('b', null, broken ? 'Users see errors after ' + U.plural(broken, 'deploy') : 'Every deploy keeps the two working'));
      verdict.appendChild(h('p', null, broken ? 'Until the other side catches up, the pair is broken. Try another order.' :
        'Each step works with the old and the new version of the other side, so each can be merged and deployed on its own.'));
    }
    draw();
  };
})(window.CLT);
