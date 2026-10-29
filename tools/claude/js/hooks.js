/*
 * hooks.js - the hook rules: which events exist, when a matcher and an "if" filter let a hook run,
 * and what its exit code and output do. Written from code.claude.com/docs/en/hooks ("Hook
 * lifecycle", "Matcher patterns", "Hook handler fields", "Exit code output", "Exit code 2 behavior
 * per event", "Decision control") for Claude Code 2.1.309. The hook tool and the "what a hook's exit
 * code does" explainer use it; the browser tests (suite "hookengine") check it against the docs'
 * own examples.
 *
 *   CLT.hooks.EVENTS                         [{name, when, matcher, values, block, exit2, decision, tool, context}]
 *   CLT.hooks.matches(event, matcher, value) -> {match, mode: all | exact | regex | ignored | bad-regex | unknown-event, why}
 *   CLT.hooks.ifRuns(event, rule, call)      -> {runs, why}      call: {tool, input}, as for CLT.perm.evaluate
 *   CLT.hooks.outcome(event, exit, stdout, opts)
 *                                            -> {kind, text, claude}
 *        stdout: none (nothing or plain text) | text | json (a JSON object that passes validation) | bad-json
 *        opts: {onFailure: 'block' | 'continue'}
 *        kind: success | decision | blocked | error | feedback | ignored | context
 *   CLT.hooks.toolsMatched(matcher)          the built-in tools a tool-event matcher catches
 */
(function (U) {
  'use strict';

  // name, when it fires, what its matcher filters (null: no matcher support), sample values, can exit 2 block?,
  // what exit 2 does, how it decides with JSON
  var E = [
    ['SessionStart', 'A session begins or resumes', 'how the session started', ['startup', 'resume', 'clear', 'compact', 'fork'], false,
      'Shows stderr to you only', 'Context only: additionalContext, and plain stdout is added for Claude'],
    ['Setup', 'Claude Code starts with --init-only, or --init or --maintenance in -p mode', 'which CLI flag triggered setup', ['init', 'maintenance'], false,
      'Exit code and stderr are ignored', 'None: for side effects'],
    ['InstructionsLoaded', 'A CLAUDE.md or .claude/rules file is loaded into context', 'load reason', ['session_start', 'nested_traversal', 'path_glob_match', 'include', 'compact'], false,
      'Exit code is ignored', 'None: for side effects'],
    ['UserPromptSubmit', 'You submit a prompt, before Claude processes it', null, [], true,
      'Blocks the prompt, so it never reaches Claude', 'Top-level decision: "block" with a reason; additionalContext and plain stdout are added for Claude'],
    ['UserPromptExpansion', 'A command you typed expands into a prompt', 'command name', ['your skill or command names'], true,
      'Blocks the expansion', 'Top-level decision: "block"; plain stdout is added for Claude'],
    ['MessageDisplay', 'Assistant text is displayed', null, [], false,
      'The original text is displayed', 'hookSpecificOutput.displayContent replaces what you see (Claude keeps the original)'],
    ['PreToolUse', 'Before a tool call runs', 'tool name', ['Bash', 'Edit|Write', 'mcp__.*'], true,
      'Blocks the tool call; Claude sees stderr as the reason', 'hookSpecificOutput.permissionDecision: allow, deny, ask or defer'],
    ['PermissionRequest', 'A tool call needs a permission decision', 'tool name', ['Bash', 'Edit|Write'], false,
      'Not honoured: the permission flow carries on unchanged', 'hookSpecificOutput.decision.behavior: allow or deny'],
    ['PostToolUse', 'After a tool call succeeds', 'tool name', ['Edit|Write', 'Bash'], false,
      'Shows stderr to Claude; the tool already ran', 'Top-level decision: "block" with a reason; additionalContext; updatedToolOutput'],
    ['PostToolUseFailure', 'After a tool call fails', 'tool name', ['Bash'], false,
      'Shows stderr to Claude; the tool already failed', 'Top-level decision: "block" with a reason'],
    ['PostToolBatch', 'After a batch of parallel tool calls, before the next model call', null, [], true,
      'Stops the agentic loop before the next model call', 'Top-level decision: "block"'],
    ['PermissionDenied', 'Auto mode denies a tool call', 'tool name', ['Bash'], false,
      'Exit code and stderr are ignored: the denial already happened', 'hookSpecificOutput.retry: true lets the model retry'],
    ['Notification', 'Claude Code sends a notification', 'notification type', ['permission_prompt', 'idle_prompt', 'auth_success', 'elicitation_dialog'], false,
      'Exit code and stderr are ignored', 'None: for side effects (terminalSequence still works)'],
    ['SubagentStart', 'A subagent is spawned', 'agent type', ['Explore', 'Plan', 'general-purpose', 'your agent names'], false,
      'Shows stderr to you only', 'Context only: additionalContext for the subagent'],
    ['SubagentStop', 'A subagent finishes', 'agent type', ['Explore', 'your agent names'], true,
      'Prevents the subagent from stopping', 'Top-level decision: "block" with a reason'],
    ['TaskCreated', 'A task is being created', null, [], true,
      'Rolls back the task creation', 'Exit code, or top-level decision: "block"'],
    ['TaskCompleted', 'A task is being marked completed', null, [], true,
      'Prevents the task from being marked completed', 'Exit code, or continue: false'],
    ['Stop', 'Claude finishes responding', null, [], true,
      'Prevents Claude from stopping: the conversation continues', 'Top-level decision: "block" with a reason; additionalContext'],
    ['StopFailure', 'The turn ends because of an API error', 'error type', ['rate_limit', 'overloaded', 'server_error'], false,
      'Output and exit code are ignored', 'None: for side effects'],
    ['TeammateIdle', 'An agent team teammate is about to go idle', null, [], true,
      'Prevents the teammate from going idle', 'Exit code, or continue: false'],
    ['ConfigChange', 'A configuration file changes during a session', 'configuration source', ['user_settings', 'project_settings', 'local_settings', 'skills'], true,
      'Blocks the change from taking effect (except policy settings)', 'Top-level decision: "block"'],
    ['CwdChanged', 'The working directory changes', null, [], false,
      'Shows stderr to you only', 'None: for side effects'],
    ['DirectoryAdded', 'A working directory is added with /add-dir', 'how it was added', ['slash_command', 'register_repo_root'], false,
      'Stderr goes to the debug log; the directory is already added', 'None: for side effects'],
    ['FileChanged', 'A watched file changes on disk', 'file names to watch', ['.envrc|.env'], false,
      'Shows stderr to you only', 'None: for side effects'],
    ['WorktreeCreate', 'A worktree is being created', null, [], true,
      'Any non-zero exit makes worktree creation fail', 'The command prints the worktree path'],
    ['WorktreeRemove', 'A worktree a WorktreeCreate hook made is removed', null, [], true,
      'Any non-zero exit makes the removal fail if the directory still exists', 'Exit code only'],
    ['PreCompact', 'Before the context is compacted', 'what triggered it', ['manual', 'auto'], true,
      'Blocks compaction', 'Top-level decision: "block"'],
    ['PostCompact', 'After compaction completes', 'what triggered it', ['manual', 'auto'], false,
      'Shows stderr to you only', 'None: for side effects'],
    ['PreModelSwitch', 'Before a model switch you or a client asked for', 'the model switched to', ['claude-opus-5', '.*opus.*'], true,
      'Blocks the switch and shows stderr to you', 'hookSpecificOutput.permissionDecision, or decision: "block"'],
    ['PostModelSwitch', 'After the session\'s model changes', 'the model switched to', ['claude-opus-5'], false,
      'Shows stderr to you only; the model already switched', 'Context only: additionalContext, and plain stdout is added for Claude'],
    ['SessionEnd', 'The session ends', 'why it ended', ['clear', 'resume', 'logout', 'prompt_input_exit', 'other'], false,
      'Shows stderr to you only', 'None: for side effects (all SessionEnd hooks share a 1.5 second budget)'],
    ['Elicitation', 'An MCP server asks for your input during a tool call', 'MCP server name', ['your server names'], true,
      'Declines the request, and no dialog appears', 'hookSpecificOutput.action: accept, decline or cancel'],
    ['ElicitationResult', 'After you answer an MCP elicitation', 'MCP server name', ['your server names'], true,
      'Blocks the response (it becomes a decline)', 'hookSpecificOutput.action, or decision: "block"']
  ];
  var TOOL_EVENTS = ['PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionRequest', 'PermissionDenied'];
  // events whose plain stdout becomes context Claude sees
  var STDOUT_CONTEXT = ['UserPromptSubmit', 'UserPromptExpansion', 'SessionStart', 'PostModelSwitch'];
  var EVENTS = E.map(function (e) {
    return { name: e[0], when: e[1], matcher: e[2], values: e[3], block: e[4], exit2: e[5], decision: e[6],
      tool: TOOL_EVENTS.indexOf(e[0]) >= 0, context: STDOUT_CONTEXT.indexOf(e[0]) >= 0 };
  });
  function event(name) { for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i].name === name) return EVENTS[i]; return null; }

  // the built-in tools a PreToolUse matcher can name (code.claude.com/docs/en/hooks, PreToolUse)
  var TOOLS = ['Bash', 'PowerShell', 'Edit', 'Write', 'Read', 'Glob', 'Grep', 'Agent', 'Workflow', 'WebFetch', 'WebSearch', 'AskUserQuestion',
    'ExitPlanMode', 'NotebookEdit', 'MultiEdit', 'Skill', 'TodoWrite', 'Monitor', 'LSP'];

  function code(s) { return '`' + String(s).replace(/`/g, '\'') + '`'; }

  /* ---------- matchers ---------- */

  function matches(evName, matcher, value) {
    var ev = event(evName);
    if (!ev) return { match: false, mode: 'unknown-event', why: code(evName) + ' is not a hook event (names are case-sensitive).' };
    var m = matcher === undefined || matcher === null ? '' : String(matcher);
    if (ev.matcher === null) {
      return { match: true, mode: 'ignored', why: m ? ev.name + ' has no matcher: ' + code(m) + ' is ignored and the hook fires every time.' : ev.name + ' fires every time.' };
    }
    if (m === '' || m === '*') return { match: true, mode: 'all', why: 'An empty matcher or * matches every ' + ev.matcher + '.' };
    var narrow = ev.name === 'FileChanged' || ev.name === 'StopFailure';
    var exact = narrow ? /^[A-Za-z0-9_|]+$/ : /^[A-Za-z0-9_\- ,|]+$/;
    if (exact.test(m)) {
      var alts = m.split(narrow ? '|' : /[|,]/).map(function (x) { return x.trim(); }).filter(Boolean);
      var hit = alts.indexOf(String(value)) >= 0;
      return { match: hit, mode: 'exact', why: (alts.length > 1 ? 'A list of exact names (' + alts.map(code).join(', ') + ')' : 'An exact name') +
        (hit ? ': ' + code(value) + ' is one of them.' : ': ' + code(value) + ' is not ' + (alts.length > 1 ? 'one of them' : 'it') + ' (case-sensitive).') };
    }
    var re;
    try { re = new RegExp(m); } catch (e) { return { match: false, mode: 'bad-regex', why: code(m) + ' is not a valid regular expression, so it matches nothing.' }; }
    var ok = re.test(String(value));
    return { match: ok, mode: 'regex', why: code(m) + ' holds other characters, so it is a regular expression, tested anywhere in the value' +
      (ok ? ': it finds a match in ' + code(value) + '.' : ': nothing in ' + code(value) + ' matches.') };
  }
  /** Which built-in tools a tool-event matcher catches. */
  function toolsMatched(matcher) {
    return TOOLS.filter(function (t) { return matches('PreToolUse', matcher, t).match; });
  }

  /* ---------- the "if" filter (permission rule syntax) ---------- */

  var EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'];
  function ifRuns(evName, rule, call) {
    var ev = event(evName);
    if (!ev) return { runs: false, why: code(evName) + ' is not a hook event.' };
    var raw = String(rule || '').trim();
    if (!ev.tool) return raw ? { runs: false, why: code('if') + ' is read only on tool events. On ' + ev.name + ', a hook with ' + code('if') + ' set never runs.' }
      : { runs: true, why: 'No ' + code('if') + ': the handler runs whenever its group matches.' };
    if (!raw) return { runs: true, why: 'No ' + code('if') + ': the handler runs whenever its group matches.' };
    var r = U.perm.parse(raw);
    if (!r.ok) return { runs: false, why: code(raw) + ' is not a permission rule (' + r.error + ').' };
    var tool = String(call.tool || ''), input = String(call.input === undefined ? '' : call.input);
    var sameTool = r.tool === tool || (r.tool === 'Edit' && EDIT_TOOLS.indexOf(tool) >= 0);
    if (!sameTool) return { runs: false, why: 'The rule names ' + code(r.tool) + '; this call is ' + code(tool) + '. One rule matches one tool\'s calls.' };
    if (r.spec === null) return { runs: true, why: code(raw) + ' names the tool with no pattern: every call to it.' };
    if (tool === 'Bash' || tool === 'PowerShell') {
      var ps = tool === 'PowerShell', s = U.perm.split(input, ps);
      var parts = s.parts.concat(ps ? [] : U.perm.substitutions(input));
      var hit = parts.map(function (p) { return U.perm.strip(p, false); }).filter(function (p) { return U.perm.cmdMatch(r.spec, p, ps); })[0];
      if (hit) return { runs: true, why: 'The subcommand ' + code(hit) + ' matches ' + code(r.spec) + (parts.length > 1 ? ' (each part of the command is checked).' : '.') };
      var words = r.spec.trim().replace(/:\*$/, ' *').split(/\s+/).filter(function (w) { return w !== '*'; });
      if (!ps && words.length > 1 && /\$\(|`|\$[A-Za-z_{]/.test(input)) {
        return { runs: true, why: 'The pattern names more than the command, and the input holds ' + code('$( )') + ', backticks or a variable: Claude Code cannot tell what it runs, so the hook runs anyway.' };
      }
      return { runs: false, why: 'No subcommand matches ' + code(r.spec) + '.' };
    }
    if (EDIT_TOOLS.indexOf(tool) >= 0 || tool === 'Read' || tool === 'Glob' || tool === 'Grep') {
      var ok = U.perm.pathMatch(r.spec, input, 'allow', 'project');
      return { runs: ok, why: ok ? code(input) + ' matches ' + code(r.spec) + '.' :
        code(input) + ' does not match ' + code(r.spec) + (/^[^/*]+\/\*\*$/.test(r.spec) ? ': a pattern like this matches that folder at the top of the project only; write ' + code('**/' + r.spec) + ' for any depth.' : '.') };
    }
    if (tool === 'WebFetch') {
      var d = U.perm.domainMatch(r.spec, input);
      return { runs: d, why: d ? 'The URL\'s domain matches.' : 'The URL\'s domain does not match.' };
    }
    return { runs: input === r.spec, why: input === r.spec ? 'The input matches the pattern.' : 'The input does not match the pattern.' };
  }

  /* ---------- what an exit code and output do ---------- */

  function outcome(evName, exitCode, stdout, opts) {
    var ev = event(evName) || event('PreToolUse');
    var x = +exitCode, out = stdout || 'none', block = (opts || {}).onFailure === 'block';
    var action = { PreToolUse: 'the tool call', UserPromptSubmit: 'your prompt', UserPromptExpansion: 'the command', Stop: 'Claude stopping',
      SubagentStop: 'the subagent stopping', PreCompact: 'the compaction', ConfigChange: 'the change', PreModelSwitch: 'the model switch',
      PostToolBatch: 'the next model call', TaskCreated: 'the task', TaskCompleted: 'completing the task', TeammateIdle: 'the teammate going idle',
      WorktreeCreate: 'the worktree', WorktreeRemove: 'removing the worktree', Elicitation: 'the request', ElicitationResult: 'the response' }[ev.name] || 'the action';
    function r(kind, text, claude) { return { kind: kind, text: text, claude: claude || '' }; }

    if (ev.name === 'WorktreeCreate' && x !== 0) return r('blocked', 'Any non-zero exit makes worktree creation fail, whatever the JSON says.');
    if (ev.name === 'WorktreeRemove' && x !== 0) return r('blocked', 'Any non-zero exit makes the removal fail if the directory still exists.');
    if (ev.name === 'StopFailure') return r('ignored', 'StopFailure ignores the output and the exit code (only terminalSequence still fires).');

    if (x === 2) {
      if (ev.name === 'Notification' || ev.name === 'Setup' || ev.name === 'InstructionsLoaded' || ev.name === 'PermissionDenied' || ev.name === 'PermissionRequest' || ev.name === 'MessageDisplay') {
        return r('ignored', ev.exit2 + '.');
      }
      if (!ev.block) {
        var toClaude = ev.name === 'PostToolUse' || ev.name === 'PostToolUseFailure';
        return r('feedback', ev.exit2 + '.', toClaude ? 'Claude reads your stderr as feedback on the tool result.' : 'Claude does not see it.');
      }
      return r('blocked', ev.exit2 + '.' + (out === 'json' ? ' The JSON fields are still read, but they cannot undo the block.' : /stderr/.test(ev.exit2) ? '' : ' Your stderr is the reason.'),
        ev.name === 'UserPromptSubmit' ? 'Claude never sees the prompt.' : 'Claude reads your stderr' + (out === 'json' ? ' (or the JSON reason)' : '') + ' as the reason.');
    }
    if (out === 'json') {
      if (x !== 0 && block) return r('blocked', 'With onFailure "block", an exit code other than 0 or 2 counts as a failure even with valid JSON, and ' + action + ' is blocked.');
      return r('decision', (x === 0 ? 'Exit 0 with one valid JSON object: ' : 'Valid JSON with exit ' + x + ': Claude Code ignores the code, and ') +
        'the fields decide (' + ev.decision + ').', 'What Claude sees depends on the fields: a deny reason, additionalContext, or nothing.');
    }
    if (out === 'bad-json') {
      if (block) return r('blocked', 'JSON that does not parse is a failure, and with onFailure "block" ' + action + ' is blocked.');
      return r('error', 'Output that looks like JSON but does not parse (or fails validation) is a non-blocking error: ' + action + ' goes ahead and you see a hook error notice.',
        'Claude does not see the output.');
    }
    if (x === 0) {
      if (out === 'text' && ev.context) return r('context', 'Exit 0: plain stdout is added as context for Claude on ' + ev.name + '.', 'Claude reads your stdout.');
      return r('success', 'Exit 0 with no JSON: no decision, so ' + action + ' goes ahead through the normal permission flow.' +
        (out === 'text' ? ' Plain stdout only reaches the debug log on ' + ev.name + '.' : ''), 'Claude sees nothing from the hook.');
    }
    if (block) return r('blocked', 'With onFailure "block", exit ' + x + ' is a failure and ' + action + ' is blocked, as if it had exited 2.');
    return r('error', 'Exit ' + x + ' is a non-blocking error: ' + action + ' goes ahead, and you see a hook error notice with the first line of stderr. Use exit 2 to block.',
      'Claude does not see stderr.');
  }

  U.hooks = { EVENTS: EVENTS, TOOLS: TOOLS, TOOL_EVENTS: TOOL_EVENTS, event: event, matches: matches, toolsMatched: toolsMatched, ifRuns: ifRuns, outcome: outcome };
})(window.CLT);
