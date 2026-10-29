/*
 * tracks.js - the areas the tool is organised in. Lessons, explainers, tools, playbooks and kit
 * items each carry a track; batches 2 to 4 have lessons for every track but people.
 *
 *   U.data.tracks = [{id, name, short, summary}]
 */
(function (U) {
  'use strict';
  U.data.tracks = [
    { id: 'basics', name: 'Basics: modes, permissions, settings', short: 'Basics',
      summary: 'Starting sessions, permission modes, the keys and commands you use every day, and where settings live.' },
    { id: 'context', name: 'Context and sessions', short: 'Context',
      summary: 'What fills the context window, when to clear, compact or rewind, and how sessions are resumed and branched.' },
    { id: 'memory', name: 'Memory and instructions', short: 'Memory',
      summary: 'CLAUDE.md, rules files and auto memory: how Claude knows your project without being told twice.' },
    { id: 'extend', name: 'Extending Claude', short: 'Extend',
      summary: 'Skills, subagents, hooks, MCP servers and plugins: reusable know-how, helpers and connections.' },
    { id: 'aidlc', name: 'AI-driven development', short: 'AI-DLC',
      summary: 'From PRD to shipped feature with Claude: phases, plans you approve, tests first, proof before done.' },
    { id: 'repos', name: 'Unfamiliar and multiple codebases', short: 'Repos',
      summary: 'Getting productive in repos you do not know, and features that span several of them.' },
    { id: 'git', name: 'Git, GitHub and automation', short: 'Git',
      summary: 'Commits, PRs, worktrees, the GitHub app, headless runs and loops.' },
    { id: 'people', name: 'Working with people', short: 'People',
      summary: 'Answers your manager can read in 20 seconds, status updates and decision requests, without the AI voice.' }
  ];
})(window.CLT);
