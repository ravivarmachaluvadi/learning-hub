/*
 * tools/multirepo.js - the multi-repo feature planner (#/tools/multirepo).
 *
 * Enter the repos (name, path, stack, role, test command), the requirements (which repos each one
 * changes) and the contracts between the repos (who provides each, who consumes it, and whether the
 * change is new, breaking or a removal). The planner writes the command that starts one session over
 * every repo, a /repo-onboard line and an onboarding prompt per repo, a trace prompt, a map of who
 * provides what (a picture and Mermaid), the impact matrix, a safe order of work and ROADMAP.md.
 *
 * The order: repos are put in waves so that every provider of a new or breaking contract comes
 * before its consumers; a breaking change is sent in both forms by its provider until the consumers
 * have moved (expand, migrate), and the old forms go in a last phase (contract). Removals wait for
 * that last phase too. The draft is kept in "clt.tool.multirepo".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit;
  var ID = 'multirepo';

  function repo() { return { name: '', path: '', stack: '', role: 'service', test: '' }; }
  function req() { return { id: '', text: '', repos: '' }; }
  function contract() { return { name: '', kind: 'endpoint', provider: '', consumers: '', change: 'add' }; }
  var EMPTY = { feature: '', prd: '', main: '', repos: [repo(), repo()], reqs: [req()], contracts: [contract()] };

  var ROLES = [['frontend', 'Front end'], ['service', 'Service'], ['library', 'Library'], ['other', 'Other']];
  var KINDS = [['endpoint', 'Endpoint'], ['type', 'Shared type'], ['event', 'Event'], ['table', 'Table'], ['config', 'Config']];
  var CHANGES = [['add', 'New (compatible)'], ['change', 'Breaking change'], ['remove', 'Removal']];
  function label(pairs, v) { var p = pairs.filter(function (x) { return x[0] === v; })[0]; return p ? p[1] : v; }

  var SAMPLES = {
    strong: { feature: 'Saved search', prd: 'docs/prd-saved-search.md (PRD-142)', main: 'web-app',
      repos: [
        { name: 'web-app', path: 'C:\\code\\web-app', stack: 'TypeScript, React, Vite', role: 'frontend', test: 'pnpm test' },
        { name: 'search-api', path: 'C:\\code\\search-api', stack: 'Rust, axum, sqlx', role: 'service', test: 'cargo test' },
        { name: 'shared-types', path: 'C:\\code\\shared-types', stack: 'TypeScript types and a Rust crate', role: 'library', test: 'pnpm test && cargo test' }],
      reqs: [
        { id: 'R1', text: 'A user can save the current search with a name of up to 60 characters', repos: 'web-app, search-api, shared-types' },
        { id: 'R2', text: 'Saved searches are listed in the sidebar, newest first', repos: 'web-app, search-api' },
        { id: 'R3', text: 'Saving a 51st search returns 409 and the UI shows "Limit of 50 reached"', repos: 'web-app, search-api' },
        { id: 'R4', text: 'The search response renames filters to facets (PRD section 4.2)', repos: 'web-app, search-api, shared-types' }],
      contracts: [
        { name: 'SavedSearch type', kind: 'type', provider: 'shared-types', consumers: 'web-app, search-api', change: 'add' },
        { name: 'POST and GET /saved-searches', kind: 'endpoint', provider: 'search-api', consumers: 'web-app', change: 'add' },
        { name: 'GET /search response: filters becomes facets', kind: 'endpoint', provider: 'search-api', consumers: 'web-app', change: 'change' }] },
    weak: { feature: 'Saved search', prd: '', main: '',
      repos: [
        { name: 'web-app', path: '', stack: 'TypeScript', role: 'frontend', test: '' },
        { name: 'search-api', path: 'C:\\code\\search-api', stack: 'Rust', role: 'service', test: 'cargo test' },
        { name: 'analytics', path: 'C:\\code\\analytics', stack: 'Python', role: 'service', test: 'pytest' }],
      reqs: [
        { id: 'R1', text: 'Improve the search experience', repos: 'web-app' },
        { id: 'R2', text: 'Save searches', repos: 'web-app, search-api' }],
      contracts: [{ name: 'Saved searches API', kind: 'endpoint', provider: '', consumers: 'web-app', change: 'add' }] }
  };

  var VAGUE = /\b(?:improve[sd]?|better|nicer?|faster|user[- ]friendly|intuitive|seamless(?:ly)?|robust|easy|easier|modern|cleaner|optimi[sz]e[sd]?|enhance[sd]?|smooth(?:er)?)\b/i;

  function trim(s) { return String(s || '').trim(); }
  function list(s) { return String(s || '').split(',').map(trim).filter(Boolean); }
  function unique(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function slug(s) { return trim(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'feature'; }
  function psq(s) { return "'" + String(s).replace(/'/g, "''") + "'"; }
  function spaced(s) { return /\s/.test(s) ? '"' + s + '"' : s; }
  function cell(s) { return trim(s).replace(/\|/g, '\\|').replace(/\n+/g, ' '); }
  function joinAnd(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  /** The named repos, requirements and contracts, trimmed; blank rows dropped. */
  function model(st) {
    var repos = (st.repos || []).filter(function (r) { return trim(r.name); }).map(function (r) {
      return { name: trim(r.name), path: trim(r.path), stack: trim(r.stack), role: r.role || 'other', test: trim(r.test) };
    });
    var byName = {};
    repos.forEach(function (r) { if (!byName[r.name]) byName[r.name] = r; });
    var reqs = (st.reqs || []).filter(function (r) { return trim(r.text); }).map(function (r, i) {
      return { id: trim(r.id) || 'R' + (i + 1), text: trim(r.text), repos: list(r.repos) };
    });
    var contracts = (st.contracts || []).filter(function (c) { return trim(c.name); }).map(function (c) {
      return { name: trim(c.name), kind: c.kind || 'endpoint', provider: trim(c.provider), consumers: list(c.consumers), change: c.change || 'add' };
    });
    return { repos: repos, names: unique(repos.map(function (r) { return r.name; })), byName: byName, reqs: reqs, contracts: contracts };
  }

  function mainRepo(m, st) { return m.byName[trim(st.main)] || m.repos[0] || null; }

  /** The order of work: {waves, cycle, cleanup, phases, contracts, edges}. */
  function plan(st) {
    var m = model(st);
    function known(n) { return !!m.byName[n]; }
    var cs = m.contracts.filter(function (c) { return known(c.provider); }).map(function (c) {
      return Object.assign({}, c, { consumers: unique(c.consumers.filter(function (n) { return known(n) && n !== c.provider; })) });
    });
    var touched = {};
    m.reqs.forEach(function (r) { r.repos.forEach(function (n) { if (known(n)) touched[n] = true; }); });
    cs.forEach(function (c) { touched[c.provider] = true; c.consumers.forEach(function (n) { touched[n] = true; }); });
    var nodes = m.names.filter(function (n) { return touched[n]; });
    // a provider of a new or breaking contract comes before its consumers; removals wait for the last phase
    var preds = {};
    nodes.forEach(function (n) { preds[n] = {}; });
    cs.forEach(function (c) { if (c.change !== 'remove') c.consumers.forEach(function (n) { preds[n][c.provider] = true; }); });
    var done = {}, waves = [], left = nodes.slice();
    while (left.length) {
      var wave = left.filter(function (n) { return Object.keys(preds[n]).every(function (p) { return done[p]; }); });
      if (!wave.length) break;
      wave.forEach(function (n) { done[n] = true; });
      waves.push(wave);
      left = left.filter(function (n) { return !done[n]; });
    }
    var cycle = left.length ? left : null;
    if (cycle) waves.push(cycle);

    function testOf(n) { return m.byName[n].test ? '`' + m.byName[n].test + '` passes in ' + n : 'the tests pass in ' + n; }
    var phases = waves.map(function (wave) {
      function inWave(n) { return wave.indexOf(n) >= 0; }
      var ids = m.reqs.filter(function (r) { return r.repos.some(inWave); }).map(function (r) { return r.id; });
      var uses = [], provides = [], moves = [], proof = [];
      cs.forEach(function (c) {
        if (inWave(c.provider)) {
          if (c.change === 'add') { provides.push('Adds ' + c.name + ' (backwards compatible).'); proof.push('a test calls ' + c.name); }
          if (c.change === 'change') {
            provides.push('Sends both the old and the new form of ' + c.name + '.');
            proof.push('a contract test shows the old and the new form of ' + c.name + ' both work');
          }
        } else if (c.consumers.some(inWave)) {
          if (c.change === 'add') uses.push(c.name);
          if (c.change === 'change') moves.push('Switches to the new form of ' + c.name + '.');
          if (c.change === 'remove') moves.push('Stops using ' + c.name + '.');
        }
      });
      var providers = unique(cs.filter(function (c) { return !inWave(c.provider) && c.change !== 'remove' && c.consumers.some(inWave); })
        .map(function (c) { return c.provider; }));
      if (providers.length && ids.length) proof.push('end to end, ' + ids.join(', ') + ' work against ' + joinAnd(providers));
      var delivers = [ids.length ? ids.join(', ') + ' in ' + joinAnd(wave) + '.' : 'Changes in ' + joinAnd(wave) + '.']
        .concat(uses.length ? ['Uses ' + uses.join(', ') + '.'] : [], provides, moves);
      return { name: joinAnd(wave), repos: wave, reqs: ids, delivers: delivers.join(' '), done: wave.map(testOf).concat(proof).join('; ') + '.' };
    });
    var later = cs.filter(function (c) { return c.change !== 'add'; });
    var cleanup = unique(later.map(function (c) { return c.provider; }));
    if (later.length) {
      phases.push({ name: 'Remove the old forms', repos: cleanup, reqs: [],
        delivers: later.map(function (c) {
          return c.provider + (c.change === 'change' ? ' removes the old form of ' : ' removes ') + c.name + ', once no repo uses it.';
        }).join(' '),
        done: 'A search of every repo finds no use of the old forms; ' + cleanup.map(testOf).join('; ') + '.' });
    }
    // one arrow per provider and consumer pair, with every contract between them
    var edges = [], byPair = {};
    cs.forEach(function (c) {
      c.consumers.forEach(function (n) {
        var key = c.provider + '>' + n;
        if (!byPair[key]) { byPair[key] = { from: c.provider, to: n, labels: [] }; edges.push(byPair[key]); }
        byPair[key].labels.push(c.name);
      });
    });
    return { waves: waves, cycle: cycle, cleanup: cleanup, phases: phases, contracts: cs, edges: edges };
  }

  /** The commands that start one session over every repo (PowerShell). */
  function startCommands(st) {
    var m = model(st), main = mainRepo(m, st);
    if (!main) return '';
    var others = m.repos.filter(function (r) { return r !== main && r.path; });
    var name = slug(st.feature) + '-explore';
    var add = others.map(function (r) { return psq(r.path); });
    return ['Set-Location ' + psq(main.path || '<the path of ' + main.name + '>'),
      '$env:CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = "1"',
      'claude -n ' + psq(name) + ' --permission-mode plan' + (add.length ? ' --add-dir ' + add.join(' ') : ''),
      '',
      "# or, with the kit's open-workspace.ps1 (it puts the variable and your folder back afterwards):",
      '.\\open-workspace.ps1 -Main ' + psq(main.path || main.name) + (add.length ? ' -Add ' + add.join(',') : '') + ' -Name ' + psq(name)].join('\n');
  }

  function onboardSkill(st) {
    var m = model(st), main = mainRepo(m, st);
    if (!main) return '';
    return '/repo-onboard ' + [main].concat(m.repos.filter(function (r) { return r !== main; }))
      .map(function (r) { return spaced(r.path || r.name); }).join(' ');
  }

  function onboardPrompt(st, r) {
    var m = model(st), others = m.names.filter(function (n) { return n !== r.name; });
    return 'Use an Explore subagent to map ' + r.name + ' (' + (r.path || 'path unknown') + ') for an engineer who must ship "' + (trim(st.feature) || 'the feature') +
      '" in it this week. Return at most one page: its purpose in two lines; stack and versions from the build files; the exact install, build, test, lint and run commands, copied from the files (' +
      (r.test ? 'I expect `' + r.test + '`' : 'I do not know them yet') + '); the folders that matter; entry points with file:line; how it talks to ' +
      (others.length ? joinAnd(others) : 'other services') + ', with file:line; five conventions, each with one example; where the tests live. Verified facts only; mark anything you inferred.';
  }

  function tracePrompt(st) {
    var m = model(st);
    return 'Find the existing feature most like "' + (trim(st.feature) || 'the feature') + '" across ' + (m.names.length ? joinAnd(m.names) : 'the repos') +
      ', and trace it end to end with the flow-tracer subagent (or an Explore subagent): numbered steps with file:line, the data at each hop, and every contract it crosses between the repos. ' +
      'This trace is the template the new code should copy. Do not change any code.';
  }

  function mermaid(st) {
    var p = plan(st), m = model(st);
    function id(n) { return n.replace(/[^A-Za-z0-9]/g, '_'); }
    function safe(s) { return String(s).replace(/["|]/g, "'"); }
    var out = ['flowchart TD'];
    [].concat.apply([], p.waves).forEach(function (n) { out.push('  ' + id(n) + '["' + safe(n) + '<br>' + label(ROLES, m.byName[n].role).toLowerCase() + '"]'); });
    p.edges.forEach(function (e) { out.push('  ' + id(e.from) + ' -->|' + e.labels.map(safe).join('<br>') + '| ' + id(e.to)); });
    return out.join('\n');
  }

  /** The impact matrix in Markdown: a column per repo up to 4 repos; past that, a row per requirement and repo (5 columns at most). */
  function matrixMarkdown(st) {
    var m = model(st), p = plan(st);
    if (!m.reqs.length) return '';
    function req(r) { return cell(r.id + ' ' + r.text); }
    if (m.names.length <= 4) {
      return ['| Requirement | ' + m.names.join(' | ') + ' |', '|---|' + m.names.map(function () { return '---|'; }).join('')].concat(m.reqs.map(function (r) {
        return '| ' + req(r) + ' | ' + m.names.map(function (n) { return r.repos.indexOf(n) >= 0 ? 'changes' : '-'; }).join(' | ') + ' |';
      })).join('\n');
    }
    var rows = ['| Requirement | Repo | Contracts on its side |', '|---|---|---|'];
    m.reqs.forEach(function (r) {
      r.repos.filter(function (n) { return m.byName[n]; }).forEach(function (n) {
        var cs = p.contracts.filter(function (c) { return c.provider === n || c.consumers.indexOf(n) >= 0; }).map(function (c) { return c.name; });
        rows.push('| ' + req(r) + ' | ' + n + ' | ' + (cs.length ? cell(cs.join(', ')) : '-') + ' |');
      });
    });
    return rows.join('\n');
  }

  /** ROADMAP.md for the plan, in the shape the /phase-* skills read, with the repos and contracts added. */
  function roadmap(st) {
    var m = model(st), p = plan(st), main = mainRepo(m, st), feature = trim(st.feature) || '<feature>';
    var out = ['# Roadmap: ' + feature, ''];
    if (trim(st.prd)) out.push('- PRD: ' + trim(st.prd));
    if (main) out.push('- Main repo: ' + main.name + '; also ' + (m.names.filter(function (n) { return n !== main.name; }).join(', ') || 'none'));
    out.push('', 'Each phase runs in a fresh Claude Code session (/clear first) over every repo (see "Start a session"). To start a phase, say: ' +
      '"Build phase N of ' + feature + '; read ROADMAP.md first." or type /phase-next.', '');
    out.push('| Phase | What it delivers | Status |', '|---|---|---|');
    p.phases.forEach(function (x, i) { out.push('| ' + (i + 1) + ' ' + cell(x.name) + ' | ' + cell(x.delivers) + ' | planned |'); });
    p.phases.forEach(function (x, i) {
      out.push('', '## Phase ' + (i + 1) + ': ' + x.name, '', '**Repos:** ' + x.repos.join(', '), '', '**Delivers:** ' + x.delivers, '', '**Done means:** ' + x.done);
    });
    out.push('', '## Repos', '', '| Repo | Path | Stack | Role | Test command |', '|---|---|---|---|---|');
    m.repos.forEach(function (r) {
      out.push('| ' + cell(r.name) + ' | ' + cell(r.path) + ' | ' + cell(r.stack) + ' | ' + label(ROLES, r.role).toLowerCase() + ' | ' + (r.test ? '`' + cell(r.test) + '`' : '') + ' |');
    });
    out.push('', '## Contracts', '', '| Contract | Kind | Provider | Consumers | Change |', '|---|---|---|---|---|');
    p.contracts.forEach(function (c) {
      out.push('| ' + cell(c.name) + ' | ' + label(KINDS, c.kind).toLowerCase() + ' | ' + c.provider + ' | ' + c.consumers.join(', ') + ' | ' + label(CHANGES, c.change).toLowerCase() + ' |');
    });
    out.push('', 'A breaking change takes three steps: the provider sends both forms, each consumer moves to the new one, then the old form is removed.');
    var md = matrixMarkdown(st);
    if (md) out.push('', '## Which repo each requirement changes', '', md);
    var start = startCommands(st).split('\n').slice(0, 3).join('\n');
    if (start) out.push('', '## Start a session', '', '```powershell', start, '```');
    var order = unique([].concat.apply([], p.phases.map(function (x) { return x.repos; })));
    out.push('', '## Pull requests', '', 'One per repo, merged in this order, each linking the others: ' +
      order.map(function (n, i) { return (i + 1) + ' ' + n; }).join(', ') + '.');
    out.push('', '## Decisions and open questions', '', '- (add decisions here as they are made, with who made them)', '',
      '## How every phase is done', '',
      '1. Read this file; restate the phase\'s "done means"; plan it and wait for approval.',
      '2. Write the tests first and watch them fail.',
      '3. Build until they pass; run each changed repo\'s test command and show the output.',
      '4. Update this file: mark the phase done and add "What phase N delivered" (built, changed from the plan, not checked).',
      '5. Commit in each repo following its conventions, then /clear before the next phase.', '');
    return out.join('\n');
  }

  /** The phase planner's state for these phases. */
  function toPhases(st) {
    var m = model(st), p = plan(st);
    return { feature: trim(st.feature), goal: '', prd: trim(st.prd),
      repos: m.repos.map(function (r) { return r.name + (r.stack ? ' (' + r.stack + ')' : ''); }).join(', '),
      test: m.repos.filter(function (r) { return r.test; }).map(function (r) { return r.test + ' (' + r.name + ')'; }).join('; '),
      phases: p.phases.map(function (x) { return { name: x.name, delivers: x.delivers, done: x.done }; }) };
  }

  var RULES = ['no-feature', 'too-few-repos', 'repo-no-path', 'repo-dup', 'no-main', 'req-no-repo', 'req-unknown-repo', 'req-vague',
    'repo-untouched', 'repo-no-test', 'contract-no-provider', 'contract-no-consumer', 'contract-repo-untouched', 'cycle'];

  function check(st) {
    var out = [], m = model(st), seen = {};
    function known(n) { return !!m.byName[n]; }
    if (!trim(st.feature)) out.push({ rule: 'no-feature', where: 'feature', at: ['field', 'mr-feature'] });
    if (m.names.length < 2) out.push({ rule: 'too-few-repos', where: 'repos', at: ['list', 'mr-repos', 0, 'name'] });
    var touchedByReq = {}, party = {};
    m.reqs.forEach(function (r) { r.repos.forEach(function (n) { touchedByReq[n] = true; }); });
    m.contracts.forEach(function (c) { if (c.provider) party[c.provider] = true; c.consumers.forEach(function (n) { party[n] = true; }); });
    (st.repos || []).forEach(function (raw, i) {
      var n = trim(raw.name);
      if (!n) return;
      var where = 'Repo ' + n;
      if (seen[n.toLowerCase()]) out.push({ rule: 'repo-dup', where: where, at: ['list', 'mr-repos', i, 'name'] });
      seen[n.toLowerCase()] = true;
      if (!trim(raw.path)) out.push({ rule: 'repo-no-path', where: where, at: ['list', 'mr-repos', i, 'path'] });
      if (!touchedByReq[n] && !party[n]) out.push({ rule: 'repo-untouched', where: where, at: ['list', 'mr-repos', i, 'name'] });
      if (touchedByReq[n] && !trim(raw.test)) out.push({ rule: 'repo-no-test', where: where, at: ['list', 'mr-repos', i, 'test'] });
    });
    if (!known(trim(st.main))) out.push({ rule: 'no-main', where: 'main', at: ['field', 'mr-main'] });
    (st.reqs || []).forEach(function (raw, i) {
      if (!trim(raw.text)) return;
      var where = trim(raw.id) || 'R' + (i + 1), names = list(raw.repos);
      if (!names.length) out.push({ rule: 'req-no-repo', where: where, at: ['list', 'mr-reqs', i, 'repos'] });
      var bad = names.filter(function (n) { return !known(n); });
      if (bad.length) out.push({ rule: 'req-unknown-repo', where: where, detail: bad.join(', '), at: ['list', 'mr-reqs', i, 'repos'] });
      if (VAGUE.test(raw.text) && !/\d/.test(raw.text)) out.push({ rule: 'req-vague', where: where, detail: trim(raw.text), at: ['list', 'mr-reqs', i, 'text'] });
    });
    (st.contracts || []).forEach(function (raw, i) {
      if (!trim(raw.name)) return;
      var where = trim(raw.name), prov = trim(raw.provider), cons = list(raw.consumers);
      if (!known(prov)) out.push({ rule: 'contract-no-provider', where: where, at: ['list', 'mr-contracts', i, 'provider'] });
      if (!cons.length || cons.some(function (n) { return !known(n); }) || cons.every(function (n) { return n === prov; })) {
        out.push({ rule: 'contract-no-consumer', where: where, at: ['list', 'mr-contracts', i, 'consumers'] });
      }
      var idle = [prov].concat(cons).filter(function (n) { return known(n) && !touchedByReq[n]; });
      if (idle.length) out.push({ rule: 'contract-repo-untouched', where: where, detail: unique(idle).join(', '), at: ['list', 'mr-reqs', 0, 'repos'] });
    });
    var p = plan(st);
    if (p.cycle) out.push({ rule: 'cycle', where: 'contracts', detail: p.cycle.join(', '), at: ['list', 'mr-contracts', 0, 'provider'] });
    return out;
  }

  var tool = U.tools[ID] = { EMPTY: EMPTY, rules: RULES, check: check, plan: plan, model: model, startCommands: startCommands, onboardPrompt: onboardPrompt,
    tracePrompt: tracePrompt, mermaid: mermaid, matrixMarkdown: matrixMarkdown, roadmap: roadmap, toPhases: toPhases, state: null };

  /* ---------- the flow map, drawn ---------- */

  function drawMap(box, st) {
    var p = plan(st), m = model(st);
    box.innerHTML = '';
    if (!p.waves.length) { box.appendChild(h('p', { class: 'faint' }, 'Add repos and contracts to see the map.')); return; }
    // as wide as the widest row needs, so a column of single boxes stays readable on a phone
    var widest = Math.max.apply(null, p.waves.map(function (w) { return w.length; }));
    var W = Math.max(380, widest * 205), BW = 168, BH = 46, ROW = 104, PAD = 24;
    var at = {};
    p.waves.forEach(function (wave, r) {
      wave.forEach(function (n, i) { at[n] = { x: (W / (wave.length + 1)) * (i + 1), y: PAD + r * ROW + BH / 2, row: r }; });
    });
    var H = PAD * 2 + (p.waves.length - 1) * ROW + BH;
    var svg = K.svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'mr-svg', role: 'img', 'aria-label': 'Which repo provides contracts to which' },
      K.svg('defs', null, K.svg('marker', { id: 'mr-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
        K.svg('path', { d: 'M0 0L10 5L0 10z', class: 'mr-arrowhead' }))));
    p.edges.forEach(function (e, k) {
      var a = at[e.from], b = at[e.to], d;
      if (!a || !b) return;
      if (b.row - a.row === 1 || b.row <= a.row) {
        d = 'M' + a.x + ' ' + (a.y + BH / 2) + ' L' + b.x + ' ' + (b.y - BH / 2 - 2);
      } else {
        var bend = BW / 2 + 46 + k * 10;  // around the boxes in between
        d = 'M' + (a.x + BW / 2) + ' ' + a.y + ' C' + (a.x + bend + 40) + ' ' + a.y + ' ' + (b.x + bend + 40) + ' ' + b.y + ' ' + (b.x + BW / 2 + 2) + ' ' + b.y;
      }
      svg.appendChild(K.svg('path', { d: d, class: 'mr-edge', 'data-from': e.from, 'data-to': e.to, 'marker-end': 'url(#mr-arrow)' }));
    });
    Object.keys(at).forEach(function (n) {
      var c = at[n];
      svg.appendChild(K.svg('g', { class: 'mr-node role-' + m.byName[n].role, 'data-repo': n },
        K.svg('rect', { x: c.x - BW / 2, y: c.y - BH / 2, width: BW, height: BH, rx: 9 }),
        K.svg('text', { x: c.x, y: c.y - 3, 'text-anchor': 'middle', class: 'mr-node-name' }, n.length > 20 ? n.slice(0, 19) + '…' : n),
        K.svg('text', { x: c.x, y: c.y + 13, 'text-anchor': 'middle', class: 'mr-node-role' }, label(ROLES, m.byName[n].role).toLowerCase())));
    });
    box.appendChild(svg);
    if (p.edges.length) {
      box.appendChild(h('ul', { class: 'plain-list mr-edges' }, p.edges.map(function (e) {
        return h('li', null, h('b', null, e.from), ' → ', h('b', null, e.to), ': ', e.labels.join('; '));
      })));
    }
    if (p.cycle) box.appendChild(h('p', { class: 'bad-text' }, 'These repos provide to each other, so no order is safe: ' + p.cycle.join(', ') + '.'));
  }

  /* ---------- the screen ---------- */

  tool.render = function (root) {
    var st = tool.state = K.load(ID, EMPTY);
    var form = K.form(st, changed);
    var el = {
      feature: form.input('feature', { id: 'mr-feature', placeholder: 'Saved search' }),
      prd: form.input('prd', { id: 'mr-prd', placeholder: 'docs/prd-saved-search.md or a ticket link' }),
      main: form.input('main', { id: 'mr-main', placeholder: 'web-app (one of the repo names below)' })
    };
    var repos = K.rows({ id: 'mr-repos', noun: 'repo', list: function () { return st.repos; }, blank: repo, changed: changed, cols: [
      { key: 'name', label: 'Repo', ph: 'search-api', size: '0.9fr' },
      { key: 'path', label: 'Path', ph: 'C:\\code\\search-api', size: '1.3fr' },
      { key: 'stack', label: 'Stack', ph: 'Rust, axum', size: '1fr' },
      { key: 'role', label: 'Role', type: 'select', options: ROLES, size: '0.8fr' },
      { key: 'test', label: 'Test command', ph: 'cargo test', size: '1fr' }] });
    var reqs = K.rows({ id: 'mr-reqs', noun: 'requirement', list: function () { return st.reqs; }, blank: req, changed: changed, cols: [
      { key: 'id', label: 'Id', ph: 'R1', size: '0.3fr' },
      { key: 'repos', label: 'Repos it changes', ph: 'web-app, search-api', size: '2fr' },
      { key: 'text', label: 'Requirement (testable)', type: 'textarea', full: true, ph: 'A user can save a search with a name of up to 60 characters' }] });
    var contracts = K.rows({ id: 'mr-contracts', noun: 'contract', list: function () { return st.contracts; }, blank: contract, changed: changed, cols: [
      { key: 'name', label: 'Contract', ph: 'POST /saved-searches', size: '1.5fr' },
      { key: 'kind', label: 'Kind', type: 'select', options: KINDS, size: '0.8fr' },
      { key: 'provider', label: 'Provider', ph: 'search-api', size: '0.9fr' },
      { key: 'consumers', label: 'Consumers', ph: 'web-app', size: '1fr' },
      { key: 'change', label: 'Change', type: 'select', options: CHANGES, size: '1fr' }] });
    var checks = K.checksCard(ID, 'Every repo has a path and a test command, every requirement and contract names known repos, and there is a safe order.', function (f) {
      if (!f.at) return;
      if (f.at[0] === 'field') K.focus(U.$('#' + f.at[1]));
      else K.focus(K.cell(f.at[1], f.at[2], f.at[3]));
    });
    var startOut = K.outputCard({ id: 'mr-start-output', title: 'Start one session over every repo', copyId: 'mr-start-copy',
      note: 'PowerShell. Run it from anywhere; the variable stays set in that terminal (the kit script puts it back).' });
    var skillPre = h('pre', { class: 'st-output', id: 'mr-onboard-skill' });
    var onboard = h('div', { class: 'pp-prompts', id: 'mr-onboard' });
    var tracePre = h('pre', { class: 'st-output', id: 'mr-trace-output' });
    var mapBox = h('div', { id: 'mr-map', class: 'mr-map' });
    var merPre = h('pre', { class: 'st-output', id: 'mr-mermaid-output' });
    var matrixWrap = h('div', { class: 'table-wrap' });
    var mdPre = h('pre', { class: 'st-output', id: 'mr-matrix-output' });
    var orderBox = h('ol', { id: 'mr-order', class: 'mr-order' });
    var roadPre = h('pre', { class: 'st-output', id: 'mr-roadmap-output' });

    root.appendChild(h('div', { class: 'tool-layout' },
      h('div', { class: 'card' },
        K.samples([['mr-sample-strong', 'Example: a feature in 3 repos', function () { load(SAMPLES.strong); }],
          ['mr-sample-weak', 'Example: a weak plan', function () { load(SAMPLES.weak); }]], 'mr-clear', function () { load(EMPTY); }),
        K.field('mr-feature', 'Feature', null, el.feature),
        h('div', { class: 'field-row' },
          K.field('mr-prd', 'PRD or ticket', null, el.prd),
          K.field('mr-main', 'Main repo', 'Where most of the work is: the session starts there.', el.main))),
      h('div', { class: 'st-side' }, checks.el, startOut.el)));
    root.appendChild(h('div', { class: 'card mr-inputs' },
      h('h2', null, 'Repos'), h('p', { class: 'faint mr-hint' }, 'Every repo the feature touches. Copy each test command from package.json, Cargo.toml or CI.'), repos.el,
      h('h2', null, 'Requirements'), h('p', { class: 'faint mr-hint' }, 'Numbered and testable, each with the repos it changes, separated by commas.'), reqs.el,
      h('h2', null, 'Contracts between the repos'),
      h('p', { class: 'faint mr-hint' }, 'Endpoints, shared types, events, tables or config one repo relies on another for, that this feature adds, breaks or removes.'), contracts.el));

    root.appendChild(h('h2', null, 'Onboarding: a map of each repo'));
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row' }, h('span', { class: 'ph-label' }, 'With the kit\'s /repo-onboard skill'), h('span', { class: 'spacer' }),
        h('button', { class: 'btn btn-small', type: 'button', id: 'mr-onboard-skill-copy', onclick: function () { U.copy(skillPre.textContent); } }, 'Copy')),
      skillPre,
      h('p', { class: 'faint', style: { margin: '6px 0 0' } }, 'Or one prompt per repo, in the same session; Claude runs the subagents in parallel when you paste them together.')));
    root.appendChild(onboard);
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row' }, h('h3', { style: { margin: 0 } }, 'Then trace the most similar feature'), h('span', { class: 'spacer' }),
        h('button', { class: 'btn btn-small', type: 'button', id: 'mr-trace-copy', onclick: function () { U.copy(tracePre.textContent); } }, 'Copy')),
      tracePre));

    root.appendChild(h('h2', null, 'Who provides what'));
    root.appendChild(h('div', { class: 'tool-pair' },
      h('div', { class: 'card' }, h('p', { class: 'muted', style: { marginTop: 0 } }, 'An arrow goes from the repo that provides a contract to the repos that use it. Providers come first in the order of work.'), mapBox),
      h('div', { class: 'card' },
        h('div', { class: 'row' }, h('h3', { style: { margin: 0 } }, 'The same map in Mermaid'), h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-small', type: 'button', id: 'mr-mermaid-copy', onclick: function () { U.copy(merPre.textContent); } }, 'Copy')),
        h('p', { class: 'faint', style: { margin: '6px 0' } }, 'For a design doc or a PR description: GitHub draws it.'), merPre)));

    root.appendChild(h('h2', null, 'Impact matrix'));
    root.appendChild(h('div', { class: 'card' }, matrixWrap,
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('span', { class: 'ph-label' }, 'Markdown'), h('span', { class: 'spacer' }),
        h('button', { class: 'btn btn-small', type: 'button', id: 'mr-matrix-copy', onclick: function () { U.copy(mdPre.textContent); } }, 'Copy')),
      mdPre));

    root.appendChild(h('h2', null, 'The order of work'));
    root.appendChild(h('div', { class: 'card' },
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'One phase per session. Providers before consumers; a breaking change is sent in both forms until every consumer has moved; old forms go last. One PR per repo, merged in this order.'),
      orderBox,
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', id: 'mr-to-phases', type: 'button', onclick: function () {
          U.store.set('tool.phases', toPhases(st));
          U.toast('Sent ' + U.plural(plan(st).phases.length, 'phase') + ' to the phase planner');
          location.hash = '#/tools/phases';
        } }, 'Send to the phase planner →'))));

    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'ROADMAP.md'), h('span', { class: 'spacer' }),
        h('button', { class: 'btn btn-small', id: 'mr-download', type: 'button', onclick: function () { U.download('ROADMAP.md', roadPre.textContent, 'text/markdown'); } }, 'Download'),
        h('button', { class: 'btn btn-small btn-primary', id: 'mr-roadmap-copy', type: 'button', onclick: function () { U.copy(roadPre.textContent); } }, 'Copy')),
      h('p', { class: 'faint', style: { margin: '6px 0 0' } }, 'Save it in the main repo and commit it: the /phase-next and /phase-close skills read it.'),
      roadPre));

    function load(next) {
      K.replace(st, next);
      form.fill();
      repos.draw();
      reqs.draw();
      contracts.draw();
      changed();
    }
    function changed() {
      U.store.set('tool.' + ID, st);
      checks.show(check(st));
      startOut.set(startCommands(st));
      skillPre.textContent = onboardSkill(st);
      var m = model(st), p = plan(st);
      onboard.innerHTML = '';
      m.repos.forEach(function (r) {
        var text = onboardPrompt(st, r);
        onboard.appendChild(h('section', { class: 'card mr-onboard', 'data-repo': r.name },
          h('div', { class: 'row' }, h('h3', { style: { margin: 0 } }, r.name), h('span', { class: 'spacer' }),
            h('button', { class: 'btn btn-small', type: 'button', onclick: function () { U.copy(text); } }, 'Copy')),
          h('pre', { class: 'st-output' }, text)));
      });
      tracePre.textContent = tracePrompt(st);
      drawMap(mapBox, st);
      merPre.textContent = mermaid(st);
      matrixWrap.innerHTML = '';
      if (m.reqs.length && m.names.length) {
        matrixWrap.appendChild(h('table', { class: 'table mr-matrix', id: 'mr-matrix' },
          h('thead', null, h('tr', null, h('th', null, 'Requirement'), m.names.map(function (n) { return h('th', null, n); }))),
          h('tbody', null, m.reqs.map(function (r) {
            return h('tr', null, h('td', null, h('b', null, r.id), ' ', r.text), m.names.map(function (n) {
              var on = r.repos.indexOf(n) >= 0;
              return h('td', { class: on ? 'mr-on' : 'faint' }, on ? 'changes' : '-');
            }));
          }))));
      } else matrixWrap.appendChild(h('p', { class: 'faint' }, 'Add requirements and repos to see the matrix.'));
      mdPre.textContent = matrixMarkdown(st);
      orderBox.innerHTML = '';
      p.phases.forEach(function (x, i) {
        orderBox.appendChild(h('li', { class: 'mr-phase', 'data-phase': i + 1 },
          h('b', null, x.name), x.name !== joinAnd(x.repos) ? h('span', { class: 'faint' }, ' · ' + x.repos.join(', ')) : null,
          h('p', { html: U.mdInline(x.delivers) }), h('p', { class: 'faint', html: U.mdInline('Done means: ' + x.done) })));
      });
      roadPre.textContent = roadmap(st);
    }
    form.fill();
    changed();
  };
})(window.CLT);
