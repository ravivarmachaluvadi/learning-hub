/*
 * views/projects.js - Projects (#/projects, #/projects/<id>, #/projects/<id>/<step number>): guided
 * builds of a real program, one checked step at a time. Each step is a challenge like a lesson's
 * (U.challenge, js/challenge.js). Its editor starts from a working version of the step before, plus
 * what this step adds, so any step can be picked up on its own.
 *
 * A step can need things a browser cannot give Python (threads, sockets, subprocess) or a PyPI
 * package (pytest, fastapi): it says runtimes: ['server'] and why. In the in-browser Python it shows
 * how to start pylearn; on your PC, a package the Python running your code lacks is named with the
 * exact pip command (U.packagesNote). The tool never installs anything itself. A step page has the
 * lessons' divider and full screen (js/layout.js).
 *
 * The project shape is described at the top of data/project-cli.js.
 * For the tests: PYLT.currentChallenge = {kind: 'step', id: 'cli/2', challenge, editor, check}.
 */
(function (U) {
  'use strict';
  var h = U.h;

  function projects() { return U.data.projects || []; }
  function done() { return U.store.get('projects.done', {}); }
  function markDone(key) { var d = done(); d[key] = new Date().toISOString(); U.store.set('projects.done', d); }
  function serverOnly(s) { return !!(s.runtimes && s.runtimes.indexOf('browser') < 0); }
  function finished(p) { var d = done(); return p.steps.filter(function (s, i) { return d[p.id + '/' + (i + 1)]; }).length; }

  /** "steps 2 to 5 need your PC" */
  function pcSteps(p) {
    var nums = p.steps.map(function (s, i) { return serverOnly(s) ? i + 1 : 0; }).filter(Boolean);
    if (!nums.length) return '';
    if (nums.length === p.steps.length) return 'every step needs your PC';
    var run = nums[nums.length - 1] - nums[0] === nums.length - 1 && nums.length > 1;
    return (nums.length === 1 ? 'step ' + nums[0] + ' needs' : 'steps ' + (run ? nums[0] + ' to ' + nums[nums.length - 1] : nums.join(', ')) + ' need') + ' your PC';
  }

  function packageBadges(packages) {
    return (packages || []).map(function (x) { return h('span', { class: 'badge', title: 'A PyPI package: pip install ' + x }, 'pip: ' + x); });
  }

  /* ---------- the list (#/projects) ---------- */

  function list(root) {
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Projects'),
      h('p', null, 'Guided builds of real programs, the kind you would write at work, one checked step at a time. Each step explains what is new ' +
        'next to the Java you know, then you write it, and the tool checks it. Most steps need Python on your PC (pylearn): they use files, ' +
        'processes, sockets or packages from PyPI that a browser cannot give Python.')));
    root.appendChild(h('div', { class: 'cards' }, projects().map(function (p) {
      var n = finished(p);
      return h('a', { class: 'card project-card', href: '#/projects/' + p.id },
        h('div', { class: 'card-kicker' }, U.plural(p.steps.length, 'step', 'steps') + (pcSteps(p) ? ' · ' + pcSteps(p) : '')),
        h('h3', null, p.title),
        h('p', { class: 'muted', style: { margin: 0 } }, p.summary),
        p.packages.length ? h('div', { class: 'kata-meta' }, packageBadges(p.packages)) : null,
        h('div', { class: 'row', style: { marginTop: '10px' } }, h('small', { class: 'faint' }, n + ' of ' + p.steps.length + ' steps done')),
        h('div', { class: 'progress', style: { marginTop: '4px' } }, h('span', { style: { width: n / p.steps.length * 100 + '%' } })));
    })));
  }

  /* ---------- a project (#/projects/<id>) ---------- */

  function projectPage(root, p, query) {
    var d = done();
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/projects' }, 'Projects')));
    var text = h('div', { class: 'project-page' });
    root.appendChild(text);
    text.appendChild(h('h1', null, p.title));
    text.appendChild(h('p', { class: 'entry-summary' }, p.summary));
    if (p.packages.length || pcSteps(p)) {
      text.appendChild(h('div', { class: 'kata-meta' }, pcSteps(p) ? h('span', { class: 'badge' }, pcSteps(p)) : null, packageBadges(p.packages)));
    }
    text.appendChild(U.enhance(h('div', { class: 'lesson-body', html: U.md(p.intro) })));
    text.appendChild(U.enhance(U.callout('java', 'Coming from Java', U.md(p.java))));
    text.appendChild(h('h2', null, 'The steps'));
    p.steps.forEach(function (s, i) {
      var key = p.id + '/' + (i + 1);
      text.appendChild(h('a', { class: 'lesson-row step-row' + (d[key] ? ' done' : ''), href: '#/projects/' + key },
        h('span', { class: 'lesson-num', 'aria-label': d[key] ? 'done' : 'step ' + (i + 1) }, d[key] ? '✓' : String(i + 1)),
        h('span', { class: 'lesson-row-text' }, h('b', null, s.title), h('small', null, s.summary || '')),
        serverOnly(s) ? h('span', { class: 'badge', title: 'Runs only with Python on your PC (pylearn)' }, 'your PC') : null,
        h('span', { class: 'kata-badges' }, packageBadges(s.packages))));
    });
    text.appendChild(h('h2', { id: 'finish' }, 'Run it for real'));
    text.appendChild(U.enhance(h('div', { class: 'lesson-body', html: U.md(p.finish) })));
    text.appendChild(h('p', { class: 'faint' }, 'More in the official documentation: ',
      h('a', { href: p.docs, target: '_blank', rel: 'noopener' }, 'docs.python.org ↗')));
    if (query && query.at) {
      var target = document.getElementById(query.at);
      if (target) setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 0);
    }
  }

  /* ---------- a step (#/projects/<id>/<n>) ---------- */

  function stepPage(root, p, n) {
    var s = p.steps[n - 1], key = p.id + '/' + n;
    var next = p.steps[n];
    var allowed = U.run.supports(s);
    var text = h('div', { class: 'lesson-text' });
    var work = h('div', { class: 'lesson-work' });
    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/projects' }, 'Projects'), ' › ',
      h('a', { href: '#/projects/' + p.id }, p.title), ' › step ' + n + ' of ' + p.steps.length));
    var layout = h('div', { class: 'lesson-layout' }, text, work);
    root.appendChild(layout);
    U.layout.split(layout, { key: 'lesson', def: 49, minLeft: 260, minRight: 380, label: 'Resize the step and the code' });
    var fs = U.layout.full(layout, { kind: 'work', text: text, work: work });

    text.appendChild(h('h1', null, 'Step ' + n + ': ' + s.title));
    if (s.summary) text.appendChild(h('p', { class: 'entry-summary' }, s.summary));
    text.appendChild(U.enhance(h('div', { class: 'lesson-body', html: U.md(s.body) })));
    text.appendChild(h('h2', null, 'Your task'));
    text.appendChild(h('div', { class: 'task' }, h('div', { class: 'task-title' }, s.title), U.enhance(h('div', { html: U.md(s.task) }))));
    text.appendChild(h('div', { class: 'row lesson-nav' },
      n > 1 ? h('a', { class: 'btn', href: '#/projects/' + p.id + '/' + (n - 1) }, '← Step ' + (n - 1) + ': ' + p.steps[n - 2].title) :
        h('a', { class: 'btn', href: '#/projects/' + p.id }, '← ' + p.title),
      h('span', { class: 'spacer' }),
      next ? h('a', { class: 'btn btn-primary', href: '#/projects/' + p.id + '/' + (n + 1) }, 'Step ' + (n + 1) + ': ' + next.title + ' →') :
        h('a', { class: 'btn btn-primary', href: '#/projects/' + p.id + '?at=finish' }, 'Finish: run it for real →')));

    var download = h('button', { class: 'btn btn-small', type: 'button', title: 'Save the code in the editor as main.py' }, 'Download main.py');
    work.appendChild(h('div', { class: 'ed-tabs' }, h('b', null, 'Your program'), h('span', { class: 'spacer' }), h('span', { class: 'faint' }, 'Ctrl+Enter checks'),
      fs.hideBtn, fs.btn));
    if (!allowed) work.appendChild(U.serverNote('This step needs Python on your PC', s.runtimeWhy, '#/projects/' + key));
    var slot = h('div');
    work.appendChild(slot);
    if (allowed && (s.packages || []).length) {
      U.run.ready().then(function () { var note = U.packagesNote(s.packages); if (note && slot.isConnected) slot.appendChild(note); });
    }
    var area = U.challenge(work, {
      challenge: s, storeKey: 'projects.work.' + key, showTask: false, allowed: function () { return allowed; },
      extraButtons: [download],
      onPass: function () {
        markDone(key);
        return '🎉 All checks pass - step complete!' + (next ? ' Next: step ' + (n + 1) + ', ' + next.title + '.' : ' The project is built: see "Run it for real" on its page.');
      }
    });
    download.addEventListener('click', function () { U.download('main.py', area.editor.get(), 'text/x-python'); });
    U.currentChallenge = { kind: 'step', id: key, challenge: s, editor: area.editor, check: area.run };
  }

  U.views.projects = {
    render: function (root, params, query) {
      var p = params[0] && U.find('projects', params[0]);
      var n = params[1] ? parseInt(params[1], 10) : 0;
      if (p && n >= 1 && n <= p.steps.length) stepPage(root, p, n);
      else if (p) projectPage(root, p, query);
      else list(root);
    },
    destroy: function () { U.currentChallenge = null; }
  };
  U.route('projects', U.views.projects);
})(window.PYLT);
