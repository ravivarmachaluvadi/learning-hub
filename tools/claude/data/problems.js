/*
 * problems.js - the situations the tool was built around, shown as a table on the home page.
 *
 *   U.data.problems = [{id, problem, habit (Markdown), links: ['kind:id']}]
 */
(function (U) {
  'use strict';
  U.data.problems = [
    { id: 'verbose-answers',
      problem: 'Your manager asks a quick question; Claude\'s reply is long and reads like AI',
      habit: 'Say who reads it, how long it may be and what goes first. Paste-check it before sending. Make "quick answers" the default in CLAUDE.md.',
      links: ['playbook:manager-answer', 'tool:crisp', 'tool:reply', 'kit:crisp', 'kit:claude-md-quick-answers'] },
    { id: 'context-fills',
      problem: 'A big feature fills the context: slow, vague replies and a lot of usage',
      habit: 'Plan phases in ROADMAP.md, build one phase per session, write down what it delivered, then `/clear`.',
      links: ['playbook:phase-loop', 'tool:phases', 'kit:phase-plan', 'kit:phase-close', 'cheat:clear', 'explainer:context-fills', 'lesson:document-and-clear'] },
    { id: 'many-repos',
      problem: 'A PRD needs changes in several repos you do not know',
      habit: 'One session over all repos, a one-page map of each, a requirement-by-repo table, contracts first.',
      links: ['playbook:multi-repo-feature', 'tool:multirepo', 'kit:repo-onboard', 'kit:open-workspace', 'lesson:repos-workspace', 'prompt:repos-matrix'] },
    { id: 'docs-too-big',
      problem: 'The docs are huge; you cannot find the one command you need',
      habit: 'Learn the top 20 by heart; search the rest here with Ctrl K.',
      links: ['playbook:first-week', 'cheat:key-shift-tab', 'cheat:context', 'lesson:first-session'] },
    { id: 'not-really-done',
      problem: 'Claude says it is done, but it is not',
      habit: 'Ask for evidence: the real test output, the diff, the running app. Never accept "it should work".',
      links: ['prompt:phase-prove', 'prompt:tests-run', 'cheat:verify', 'cheat:diff'] },
    { id: 'wrong-way',
      problem: 'Claude goes the wrong way and the corrections pile up',
      habit: 'Stop early with Esc. Rewind to before the wrong turn and ask again with the facts, instead of patching on top.',
      links: ['cheat:key-esc', 'cheat:rewind', 'prompt:debug-reset', 'lesson:rewind-checkpoints'] },
    { id: 'rules-ignored',
      problem: 'Claude asks permission for every command, or does something your CLAUDE.md said never to do',
      habit: 'Permission rules for what must or must not run, enforced by Claude Code; a short, specific CLAUDE.md for how to work, which Claude only tries to follow.',
      links: ['tool:permissions', 'lesson:permission-rules', 'tool:claudemd', 'lesson:instructions-not-followed'] },
    { id: 'same-every-time',
      problem: 'You paste the same procedure into chat again and again, or wish something just happened after every edit',
      habit: 'A repeated procedure becomes a skill you run with `/name`; a side task that floods the chat becomes a subagent; "every time, without fail" becomes a hook.',
      links: ['lesson:which-extension', 'tool:skill', 'tool:agent', 'tool:hook', 'explainer:what-loads', 'kit:format-on-edit'] },
    { id: 'contract-breaks',
      problem: 'A change to a shared API or type works in your repo, then breaks another repo when it deploys',
      habit: 'List the contracts that change. Make each change backwards compatible (expand, migrate, contract), ship providers first and consumers next, remove old forms last, and raise one PR per repo in that order.',
      links: ['explainer:rollout-order', 'playbook:contract-change', 'kit:contract-change', 'tool:multirepo', 'lesson:repos-contracts'] }
  ];
})(window.CLT);
