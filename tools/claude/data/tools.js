/*
 * tools.js - the tools' titles and descriptions. Each tool's screen is js/views/tools/<id>.js.
 *
 *   U.data.tools = [{id, title, track, summary, why (Markdown), keywords}]
 */
(function (U) {
  'use strict';
  U.data.tools = [
    { id: 'crisp', title: 'Crisp reply checker', track: 'people',
      summary: 'Paste a reply before you send it: it marks the AI-sounding and padded phrases, checks the length and shape, and writes a "make it crisp" prompt.',
      why: 'A reply that opens with "Great question!", says "robust" and ends with "I hope this helps" tells your manager a chatbot wrote it, and hides the answer. ' +
        'Paste Claude\'s draft (or your own) here before it goes to Slack or Teams. Everything stays in this browser.',
      keywords: ['verbose', 'ai sounding', 'too long', 'manager', 'slack', 'short', 'rewrite', 'check reply', 'crisp'] },
    { id: 'reply', title: 'Manager reply builder', track: 'people',
      summary: 'Fill in the answer, the date, how sure you are and what you need; get a 2 to 4 line reply plus the notes to keep ready.',
      why: 'Quick questions deserve quick answers: the answer first, a date if they asked when, what it depends on, and your ask. ' +
        'The builder puts them in that order and keeps the details out of the message, ready if they ask.',
      keywords: ['manager', 'status', 'when', 'reply', 'answer', 'date', 'slack', 'update'] },
    { id: 'phases', title: 'Phase planner', track: 'aidlc',
      summary: 'Plan a feature as phases: get ROADMAP.md, a start prompt and a close prompt for every phase, so each phase runs in its own short session.',
      why: 'Every message re-sends the whole conversation, so long sessions get slow and expensive. ' +
        'Phases in ROADMAP.md let you `/clear` between them without losing anything: the next session reads the file. ' +
        'Each phase should leave something usable and have a "done means" a test can prove.',
      keywords: ['phase', 'phases', 'roadmap', 'plan', 'clear', 'tokens', 'big feature', 'prd', 'sessions'] },
    { id: 'claudemd', title: 'CLAUDE.md builder and checker', track: 'memory',
      summary: 'Build a short project CLAUDE.md from a TypeScript or Rust preset, or paste yours: it marks vague rules and secrets, and checks length, test commands, emphasis and formatter rules.',
      why: 'CLAUDE.md is read at the start of every session, so every line costs context, and a long or vague file is followed less well. ' +
        'The docs\' test for each line: would removing it make Claude make mistakes? This tool applies the docs\' include and leave-out lists, ' +
        'and writes a prompt asking Claude to check the file against your repo. Everything stays in this browser.',
      keywords: ['claude.md', 'claude md', 'memory', 'instructions', 'project instructions', 'init', 'check claude.md', 'too long', 'secrets', 'typescript', 'rust'] },
    { id: 'permissions', title: 'Permissions builder and rule tester', track: 'basics',
      summary: 'Write allow, ask and deny rules or import your settings.json, get the file, and test any command, path or URL against the rules in any mode, step by step.',
      why: 'Rules are checked deny, then ask, then allow, and the first match decides; a rule matches the text Claude writes, not the program. ' +
        'Test a command here before you trust a rule, and let the checks catch the shapes the docs warn about: a `*` before the subcommand, ' +
        'Windows paths, path rules that never match, an allow that a deny always catches. The tool never edits your settings files.',
      keywords: ['permission', 'permissions', 'permission rule', 'allow', 'ask', 'deny', 'settings.json', 'rules', 'test rule', 'prompts', 'bash rule', 'powershell'] },
    { id: 'skill', title: 'Skill builder and checker', track: 'extend',
      summary: 'Build a SKILL.md from fields, or paste one: it checks the YAML the way Claude Code reads it, the description Claude matches on, who may run it, and the fields Claude Code ignores without a word.',
      why: 'A skill is a folder with a SKILL.md: YAML frontmatter, then the instructions. If the YAML does not parse, the skill still loads with **no fields at all**: ' +
        'no description to match, no `disable-model-invocation`, and nothing tells you. A misspelt field such as `allowed_tools` is ignored the same way. ' +
        'This tool writes the frontmatter so YAML reads it back exactly, and checks a pasted one against the fields in the docs. Everything stays in this browser.',
      keywords: ['skill', 'skills', 'skill.md', 'frontmatter', 'yaml', 'slash command', 'custom command', 'description', 'disable-model-invocation', 'allowed-tools', 'context fork', 'check skill'] },
    { id: 'agent', title: 'Subagent builder and checker', track: 'extend',
      summary: 'Build a custom subagent file (or start from the kit\'s repo-explorer, flow-tracer and test-runner), or paste one: it checks the fields, the tools and the description, and writes the --agents command to try it for one session.',
      why: 'A subagent is a Markdown file in `.claude/agents/`: YAML frontmatter, then its system prompt. Claude Code **skips the file without a word** when it has no name or no description, ' +
        'when the name holds a colon, or when the YAML does not parse; a misspelt field such as `max_turns` is ignored. A reviewer that can edit files, or an explorer with every tool, ' +
        'is the other common mistake. The tool catches both, and gives you a `claude --agents` command to try the agent before you save it.',
      keywords: ['subagent', 'subagents', 'agent', 'agents', 'custom agent', '.claude/agents', 'agents json', 'tools', 'model', 'explore', 'reviewer', 'delegate'] },
    { id: 'hook', title: 'Hook builder and tester (PowerShell, Node and bash)', track: 'extend',
      summary: 'Build a hook from the kit\'s templates or from scratch, or paste a settings.json: get the hooks block and the script, test whether a call makes it run and what its exit code does, and catch the shapes that silently never fire.',
      why: 'A hook is a command Claude Code runs at a fixed point, every time: before a tool call, after an edit, when Claude stops. It is the only way to make something **certain**, ' +
        'but a hook that never fires looks exactly like one that works: a matcher on an event that has none, an `if` on a non-tool event, a script that "blocks" with exit 1. ' +
        'This tool uses the same rules as the docs to tell you, and never edits your settings files.',
      keywords: ['hook', 'hooks', 'pretooluse', 'posttooluse', 'stop hook', 'notification', 'matcher', 'exit code', 'exit 2', 'settings.json', 'powershell', 'format on save', 'block'] },
    { id: 'mcp', title: 'MCP command builder', track: 'extend',
      summary: 'Pick Playwright, Chrome DevTools, Context7, GitHub or Jira, or describe your own server: get the claude mcp add command for PowerShell and the .mcp.json entry, with secrets kept in environment variables. Or paste a .mcp.json to check it.',
      why: 'An MCP server gives Claude tools for a system it cannot otherwise reach: a browser, your issue tracker, live library docs. The command is short but easy to get subtly wrong: ' +
        'options after the `--`, a token pasted into a file the whole team commits, a URL with no `type`. The builder writes the command each vendor documents, and checks the rest.',
      keywords: ['mcp', 'mcp server', 'claude mcp add', '.mcp.json', 'playwright', 'chrome devtools', 'context7', 'github', 'jira', 'atlassian', 'connect', 'tools'] },
    { id: 'multirepo', title: 'Multi-repo feature planner', track: 'repos',
      summary: 'Enter the repos, the requirements and the contracts between the repos: get the command that starts one session over all of them, an onboarding prompt per repo, a map of who provides what, the impact matrix, a safe order of work and ROADMAP.md.',
      why: 'A feature across repos fails at the edges: a repo nobody mapped, a contract changed on one side, a consumer deployed before its provider. ' +
        'This planner turns what you know (repos, requirements, contracts) into the order the docs and experience agree on: **providers before consumers, breaking changes in three steps, old forms removed last**. ' +
        'Send the phases to the [[tool:phases|phase planner]] when you are happy. Everything stays in this browser.',
      keywords: ['multi repo', 'multiple repos', 'several repos', 'planner', 'impact matrix', 'contracts', 'order of work', 'add-dir', 'workspace', 'flow map', 'onboarding', 'prd', 'repos'] },
    { id: 'automation', title: 'Headless and GitHub Action builder', track: 'git',
      summary: 'Build a claude -p command for PowerShell or bash with its tools, mode and caps, or a GitHub workflow for the Claude Code GitHub Action, or paste an old workflow to check it.',
      why: 'Claude in a script or in CI runs with nobody to answer a prompt. Without a mode and tools chosen on purpose it either can do nothing (every approval denied) or too much (bypass); ' +
        'without caps a loop can run up a bill. The builder writes the command or the workflow the docs describe, quotes it for your shell, and flags the rest: an old `@beta` workflow, a key in the YAML, `GITHUB_TOKEN` that stops CI.',
      keywords: ['headless', 'claude -p', 'print mode', 'github action', 'github actions', '@claude', 'workflow', 'ci', 'automation', 'allowedTools', 'max turns', 'script', 'schedule', 'cron'] }
  ];
})(window.CLT);
