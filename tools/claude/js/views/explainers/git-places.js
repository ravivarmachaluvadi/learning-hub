/*
 * explainers/git-places.js - "Where is my change? Git in four places" (#/explain/git-places).
 *
 * A change lives in the working folder, the staging area, your local commits or the remote
 * (git-scm.com, "Recording Changes to the Repository"). Each button is one git step; the four boxes
 * count what is where, and the log says in plain English what happened, refusing what git would
 * refuse and warning where a team would (a push straight to main).
 */
(function (U) {
  'use strict';
  var h = U.h;
  U.explainers = U.explainers || {};

  var START = { branch: 'main', working: 0, staged: 0, ahead: 0, pushed: 0, pr: false };
  var ACTIONS = [
    ['branch', 'git switch -c feature', 'Make a branch'],
    ['edit', 'Claude edits a file', 'Edit'],
    ['add', 'git add', 'Stage'],
    ['unstage', 'git restore --staged', 'Unstage'],
    ['restore', 'git restore', 'Discard the edit'],
    ['commit', 'git commit', 'Commit'],
    ['reset', 'git reset --soft HEAD~1', 'Undo the last commit'],
    ['push', 'git push', 'Push'],
    ['pr', 'gh pr create', 'Open a PR']
  ];
  var PLACES = [['working', 'Working folder', 'Files on disk, as edited'], ['staged', 'Staged', 'In the next commit'],
    ['local', 'Your commits', 'On your branch, not shared'], ['remote', 'GitHub', 'Pushed: others can see it']];

  /** One step: returns {state, entry: {action, kind: ok | refused | warn, text}}. */
  function apply(s, action) {
    var n = Object.assign({}, s), kind = 'ok', text;
    function no(t) { kind = 'refused'; text = t; }
    if (action === 'branch') {
      if (n.branch !== 'main') no('You are already on the branch `' + n.branch + '`.');
      else { n.branch = 'feature'; text = 'A new branch, `feature`. Your edits come with you; main stays as it was.'; }
    } else if (action === 'edit') {
      n.working += 1;
      text = 'The change is in your working folder only. Nothing is saved in git yet; `/rewind` can still undo Claude\'s edit.';
    } else if (action === 'add') {
      if (!n.working) no('Nothing to stage: the working folder has no changes.');
      else { n.staged += n.working; n.working = 0; text = 'Staged: the change is chosen for the next commit. Check `git status` and `/diff` before you commit.'; }
    } else if (action === 'unstage') {
      if (!n.staged) no('Nothing is staged.');
      else { n.working += n.staged; n.staged = 0; text = 'Back in the working folder: the change is kept, just not chosen for the commit.'; }
    } else if (action === 'restore') {
      if (!n.working) no('The working folder has no changes to discard.');
      else { n.working = 0; text = 'Discarded: the files are back to the last commit. That edit is gone for good.'; }
    } else if (action === 'commit') {
      if (!n.staged) no('Nothing to commit: stage a change first.');
      else { n.ahead += 1; n.staged = 0; text = 'Saved as a commit on `' + n.branch + '`. Still only on your PC: `git push` shares it. `/rewind` does not undo a commit.'; }
    } else if (action === 'reset') {
      if (!n.ahead) no('No unpushed commit to undo. Once pushed, undo with `git revert`, which adds a new commit.');
      else { n.ahead -= 1; n.staged += 1; text = 'The last commit is undone and its changes are staged again, ready to fix and commit.'; }
    } else if (action === 'push') {
      if (!n.ahead) no('Nothing to push: every commit is already on the remote.');
      else {
        n.pushed += n.ahead; n.ahead = 0;
        if (n.branch === 'main') { kind = 'warn'; text = 'Pushed straight to main, with no PR and no review. Most teams protect main against this: make a branch first.'; }
        else text = 'The branch is on GitHub. Open a PR to ask for it to be merged into main.';
      }
    } else if (action === 'pr') {
      if (n.branch === 'main') no('A PR merges a branch into main: make a branch first.');
      else if (!n.pushed) no('Push the branch first: GitHub cannot see your commits yet.');
      else if (n.pr) no('This branch already has a PR; new pushes update it.');
      else { n.pr = true; text = 'A pull request: the diff, the CI checks and the reviewers\' comments, all in one place. New pushes to the branch update it.'; }
    } else {
      no('Unknown step.');
    }
    if (kind === 'refused') n = s;
    return { state: n, entry: { action: action, kind: kind, text: text } };
  }

  /** Run a list of steps from the start: {state, log}. */
  function run(actions) {
    var s = Object.assign({}, START), log = [];
    (actions || []).forEach(function (a) { var r = apply(s, a); s = r.state; log.push(r.entry); });
    return { state: s, log: log };
  }

  var ex = U.explainers['git-places'] = { ACTIONS: ACTIONS, apply: apply, run: run };

  ex.render = function (box) {
    var steps = [];
    var boxes = h('div', { class: 'gp-boxes' });
    var log = h('ol', { class: 'gp-log', id: 'gp-log', 'aria-live': 'polite' });
    var branch = h('p', { class: 'muted gp-branch' });
    box.appendChild(h('div', { class: 'row gp-actions' }, ACTIONS.map(function (a) {
      return h('button', { class: 'btn btn-small', type: 'button', id: 'gp-act-' + a[0], title: a[1], onclick: function () { steps.push(a[0]); draw(); } },
        a[2], h('code', { class: 'gp-cmd' }, a[1]));
    }), h('span', { class: 'spacer' }), h('button', { class: 'btn btn-small btn-ghost', type: 'button', id: 'gp-reset', onclick: function () { steps = []; draw(); } }, 'Start again')));
    box.appendChild(branch);
    box.appendChild(boxes);
    box.appendChild(h('h3', null, 'What happened'));
    box.appendChild(log);

    function draw() {
      var r = run(steps), s = r.state;
      var counts = { working: s.working, staged: s.staged, local: s.ahead, remote: s.pushed };
      branch.innerHTML = U.mdInline('On branch `' + s.branch + '`' + (s.pr ? ', with an open pull request' : '') + '.');
      boxes.innerHTML = '';
      PLACES.forEach(function (p, i) {
        boxes.appendChild(h('div', { class: 'gp-box' + (counts[p[0]] ? ' gp-has' : ''), 'data-place': p[0] },
          h('div', { class: 'gp-name' }, p[1]), h('div', { class: 'gp-count' }, String(counts[p[0]])),
          h('div', { class: 'faint gp-what' }, p[2] + (p[0] === 'remote' && s.pr ? ' · PR open' : ''))));
        if (i < PLACES.length - 1) boxes.appendChild(h('div', { class: 'gp-arrow', 'aria-hidden': 'true' }, '→'));
      });
      log.innerHTML = '';
      if (!r.log.length) log.appendChild(h('li', { class: 'faint' }, 'Press a step above. Try: Make a branch, Edit, Stage, Commit, Push, Open a PR.'));
      r.log.forEach(function (e) {
        var a = ACTIONS.filter(function (x) { return x[0] === e.action; })[0];
        log.appendChild(h('li', { class: 'gp-entry gp-' + e.kind, 'data-kind': e.kind },
          h('code', null, a ? a[1] : e.action), ': ', e.kind === 'refused' ? h('b', null, 'Refused. ') : e.kind === 'warn' ? h('b', null, 'Careful. ') : null,
          h('span', { html: U.mdInline(e.text) })));
      });
    }
    draw();
  };
})(window.CLT);
