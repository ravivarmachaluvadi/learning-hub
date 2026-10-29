/*
 * perm.js - the permission rule engine: how Claude Code decides whether a tool call runs, asks or is
 * refused, written from code.claude.com/docs/en/permissions and /permission-modes (Claude Code
 * 2.1.309). The permissions tool and the "which permission rule matches" explainer use it; the
 * browser tests (suite "permengine") check it against the examples on those pages.
 *
 *   CLT.perm.parse('Bash(npm run *)')     -> {ok: true, tool, spec, raw} or {ok: false, raw, error}
 *   CLT.perm.evaluate(rules, call, opts)  -> {decision, reason, rule, list, steps: [Markdown]}
 *     rules  {allow: [...], ask: [...], deny: [...]}   rule strings, as in settings.json
 *     call   {tool, input}   tool: Bash | PowerShell | Read | Edit | Write | WebFetch | mcp__<server>__<tool>
 *                            input: the command, the path, or the URL
 *     opts   {mode: default | acceptEdits | plan | auto | dontAsk | bypassPermissions,
 *             scope: project | local | user  (the file the rules live in; it anchors "/" paths)}
 *   decision: 'allow' (runs without asking), 'ask', 'deny', or 'classifier' (auto mode's classifier decides)
 *   list: the list whose rule decided ('deny' | 'ask' | 'allow'), 'readonly' for a read-only command, or null (the mode)
 *
 * It models what the docs describe and says where it simplifies: it cannot know the classifier's
 * verdicts, the full read-only command list, the known-safe variables beyond NODE_ENV, or which
 * documentation sites are pre-approved for WebFetch. Paths are resolved as if the project were
 * C:\Users\you\code\repo and your home folder C:\Users\you.
 */
(function (U) {
  'use strict';

  var HOME = '/c/Users/you';
  var ROOT = HOME + '/code/repo';

  var MODES = [['default', 'Manual'], ['acceptEdits', 'Accept edits'], ['plan', 'Plan'], ['auto', 'Auto'],
    ['dontAsk', 'Don\'t ask'], ['bypassPermissions', 'Bypass permissions']];
  var DECISIONS = { allow: 'Runs without asking', ask: 'Asks you first', deny: 'Refused', classifier: 'The auto mode classifier decides' };

  // the canonical tool names a rule can name (the docs' tools reference); MCP tools are mcp__<server>__<tool>
  var TOOLS = ['Agent', 'AskUserQuestion', 'Bash', 'Cd', 'Edit', 'EndConversation', 'ExitPlanMode', 'Glob', 'Grep', 'Monitor',
    'MultiEdit', 'NotebookEdit', 'PowerShell', 'Read', 'Skill', 'TaskStop', 'TodoWrite', 'WebFetch', 'WebSearch', 'Write'];

  // the wrappers Claude Code strips before matching, and the one known-safe variable the docs name
  var WRAPPER = /^(?:timeout(?:\s+-\S+)*\s+\S+|time|nice(?:\s+-n\s*-?\d+|\s+-\d+)?|nohup|stdbuf(?:\s+-\S+)*|command(?!\s+-v\b)|builtin|noglob)\s+/;
  var SAFE_VARS = ['NODE_ENV'];
  // a sample of the built-in read-only commands; read-only git forms are listed separately
  var READ_ONLY = ['ls', 'cat', 'echo', 'pwd', 'head', 'tail', 'grep', 'find', 'wc', 'which', 'diff', 'stat', 'du', 'cd'];
  var GIT_READ = ['status', 'log', 'diff', 'show', 'blame', 'branch', 'ls-files', 'rev-parse'];
  var FILE_CMDS = ['mkdir', 'touch', 'mv', 'cp'];             // accept edits runs these in your working folders
  var READERS = ['cat', 'head', 'tail', 'less', 'more'];       // Bash commands whose file arguments follow Read rules
  var INTERPRETERS = ['python', 'python3', 'node', 'bash', 'sh', 'zsh', 'pwsh', 'powershell', 'ruby', 'perl', 'deno', 'bun'];
  var PROTECTED_DIRS = ['.git', '.vscode', '.idea', '.husky', '.cargo', '.devcontainer', '.yarn', '.mvn', '.claude'];
  var PROTECTED_FILES = ['.gitconfig', '.gitmodules', '.bashrc', '.bash_profile', '.zshrc', '.zprofile', '.profile', '.envrc', '.npmrc',
    '.yarnrc', '.bazelrc', '.pre-commit-config.yaml', 'lefthook.yml', '.devcontainer.json', '.mcp.json', '.claude.json'];
  var PS_ALIAS = { gci: 'get-childitem', ls: 'get-childitem', dir: 'get-childitem', rm: 'remove-item', del: 'remove-item', erase: 'remove-item',
    ri: 'remove-item', rd: 'remove-item', rmdir: 'remove-item', cat: 'get-content', gc: 'get-content', type: 'get-content',
    cp: 'copy-item', copy: 'copy-item', cpi: 'copy-item', mv: 'move-item', move: 'move-item', mi: 'move-item', cd: 'set-location',
    sl: 'set-location', chdir: 'set-location', pwd: 'get-location', gl: 'get-location', echo: 'write-output', write: 'write-output',
    sls: 'select-string', iwr: 'invoke-webrequest', irm: 'invoke-restmethod', iex: 'invoke-expression', ni: 'new-item' };

  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function code(s) { return '`' + String(s).replace(/`/g, '\'') + '`'; }

  /* ---------- rules ---------- */

  var NAME = /^[A-Za-z_*][\w*-]*$/;
  function parse(raw) {
    var s = String(raw === undefined || raw === null ? '' : raw).trim();
    if (!s) return { ok: false, raw: s, error: 'the rule is empty' };
    var open = s.indexOf('(');
    if (open < 0) return NAME.test(s) ? { ok: true, raw: s, tool: s, spec: null } : { ok: false, raw: s, error: 'not a tool name' };
    if (s.charAt(s.length - 1) !== ')') return { ok: false, raw: s, error: 'the bracket is never closed' };
    var tool = s.slice(0, open), spec = s.slice(open + 1, -1);   // brackets inside the specifier are literal
    if (!NAME.test(tool)) return { ok: false, raw: s, error: 'there is no tool name before the bracket' };
    if (!spec.trim()) return { ok: false, raw: s, error: 'the brackets are empty' };
    return { ok: true, raw: s, tool: tool, spec: spec };
  }
  function knownTool(name) { return TOOLS.indexOf(name) >= 0 || /^mcp__/.test(name) || /\*/.test(name); }

  /* ---------- shell commands ---------- */

  /** Split at && || ; | |& & and newlines, outside quotes. PowerShell's & is the call operator, not a separator. */
  function split(cmd, ps) {
    var parts = [], cur = '', q = null, last = null, i, c, n;
    cmd = String(cmd || '');
    for (i = 0; i < cmd.length; i++) {
      c = cmd.charAt(i); n = cmd.charAt(i + 1);
      if (q) { cur += c; if (c === q) q = null; continue; }
      if (c === '"' || c === '\'') { q = c; cur += c; continue; }
      if (c === '\\' && !ps) { cur += c + n; i++; continue; }
      if ((c === '&' && n === '&') || (c === '|' && n === '|')) { parts.push(cur); cur = ''; last = c + n; i++; continue; }
      if (c === '|' && n === '&' && !ps) { parts.push(cur); cur = ''; last = '|&'; i++; continue; }
      if (c === ';' || c === '|' || c === '\n') { parts.push(cur); cur = ''; last = c; continue; }
      if (c === '&' && !ps) {
        if (/[<>]$/.test(cur) || n === '>') { cur += c; continue; }   // 2>&1, &> file: redirects
        parts.push(cur); cur = ''; last = '&'; continue;
      }
      if (cur.trim()) last = null;
      cur += c;
    }
    parts.push(cur);
    var out = parts.map(function (p) { return p.trim(); }).filter(Boolean);
    return { parts: out, dangling: !cur.trim() && (last === '&&' || last === '||') };
  }
  /** Commands inside $( ) and backticks: deny and ask rules reach them too. */
  function substitutions(cmd) {
    var out = [], re = /\$\(([^()]*)\)|`([^`]*)`/g, m;
    while ((m = re.exec(String(cmd || '')))) out.push(m[1] !== undefined ? m[1] : m[2]);
    return out;
  }
  /** The command as rules see it: wrappers, a bare xargs, loop keywords and (for deny and ask) any leading assignment stripped. */
  function strip(part, forAllow) {
    var s = part.trim(), prev, m;
    do {
      prev = s;
      m = /^([A-Za-z_][A-Za-z0-9_]*)=(?:"[^"]*"|'[^']*'|\S*)\s+/.exec(s);
      if (m && (!forAllow || SAFE_VARS.indexOf(m[1]) >= 0)) s = s.slice(m[0].length);
      s = s.replace(WRAPPER, '');
      if (/^xargs\s+[^-\s]/.test(s)) s = s.replace(/^xargs\s+/, '');
      s = s.replace(/^(?:do|then|else|\{|\()\s+/, '');
    } while (s !== prev);
    return s.replace(/\s+/g, ' ');
  }
  function psCanon(cmd) {
    var s = String(cmd || '').trim().replace(/\s+/g, ' ').toLowerCase();
    var w = s.split(' ');
    if (PS_ALIAS[w[0]]) w[0] = PS_ALIAS[w[0]];
    return w.join(' ');
  }
  /** Does a Bash or PowerShell specifier match one command? */
  function cmdMatch(spec, cmd, ps) {
    var p = String(spec).trim().replace(/\s+/g, ' '), c = String(cmd).trim().replace(/\s+/g, ' ');
    if (/:\*$/.test(p)) p = p.slice(0, -2) + ' *';
    if (ps) { p = psCanon(p); c = psCanon(c); }
    if (p === '*') return true;
    var stars = (p.match(/\*/g) || []).length;
    if (!stars) return p === c;
    if (stars === 1 && / \*$/.test(p)) {
      var base = p.slice(0, -2);
      return c === base || c.indexOf(base + ' ') === 0;
    }
    return new RegExp('^' + p.split('*').map(esc).join('[\\s\\S]*') + '$').test(c);
  }
  function words(s) { return String(s).trim().split(/\s+/); }
  /** In the built-in read-only set (a sample of it), with no write to a file? */
  function readOnly(part, gitAfterCd) {
    var w = words(part), clean = part.replace(/\d?>\s*\/dev\/null/g, '').replace(/\d?>&\d/g, '');
    if (/>/.test(clean)) return false;
    if (w[0] === 'git') {
      if (gitAfterCd || GIT_READ.indexOf(w[1]) < 0) return false;
      if (w[1] === 'branch' && w.slice(2).some(function (a) { return !/^-(?:a|r|v|vv|-list|-all|-remotes|-show-current)$/.test(a); })) return false;
      return true;
    }
    if (READ_ONLY.indexOf(w[0]) < 0) return false;
    if (w[0] === 'find' && /\s-(?:exec|execdir|ok|okdir|delete|fprint\w*|fls|files0-from)\b/.test(' ' + part)) return false;
    return true;
  }
  /** Paths a part reads (cat .env, < file) and writes (> file, tee file), for Read and Edit rules. */
  function fileArgs(part) {
    var w = words(part), reads = [], writes = [], m, re = /(\d?>>?|<)\s*([^\s<>|;&]+)/g;
    if (READERS.indexOf(w[0]) >= 0) reads = w.slice(1).filter(function (a) { return a && a.charAt(0) !== '-' && !/[<>]/.test(a); });
    if (w[0] === 'tee') writes = w.slice(1).filter(function (a) { return a && a.charAt(0) !== '-'; });
    while ((m = re.exec(part))) {
      if (/^&|^\/dev\/null$/.test(m[2])) continue;
      (m[1] === '<' ? reads : writes).push(m[2]);
    }
    return { reads: reads.map(unquote), writes: writes.map(unquote) };
  }
  function unquote(s) { return String(s).replace(/^(['"])(.*)\1$/, '$2'); }

  /* ---------- paths ---------- */

  function normPath(p) {
    p = unquote(String(p || '').trim()).replace(/\\/g, '/');
    var m = /^([A-Za-z]):\/?(.*)$/.exec(p), abs;
    if (m) abs = '/' + m[1].toLowerCase() + '/' + m[2];
    else if (p === '~' || p.indexOf('~/') === 0) abs = HOME + p.slice(1);
    else if (p.charAt(0) === '/') abs = p;
    else abs = ROOT + '/' + p;
    var out = [];
    abs.split('/').forEach(function (seg) {
      if (!seg || seg === '.') return;
      if (seg === '..') out.pop(); else out.push(seg);
    });
    return '/' + out.join('/');
  }
  function globRe(g) {
    var out = '', i, c;
    for (i = 0; i < g.length; i++) {
      c = g.charAt(i);
      if (c === '*' && g.charAt(i + 1) === '*') {
        if (g.charAt(i + 2) === '/') { out += '(?:.*/)?'; i += 2; } else { out += '.*'; i++; }
      } else if (c === '*') out += '[^/]*';
      else if (c === '?') out += '[^/]';
      else out += esc(c);
    }
    return out;
  }
  /** Does a Read or Edit specifier match a path? kind: allow | ask | deny; scope anchors a single leading "/". */
  function pathMatch(spec, path, kind, scope) {
    var s = String(spec).trim().replace(/\\/g, '/'), anchor, rest, anyDepth = false;
    if (s.charAt(0) === '!') return false;   // gitignore negation: carves out of earlier rules (not modelled)
    if (/^[A-Za-z]:/.test(s)) return false;  // a drive letter never matches: paths are compared in POSIX form
    if (s.indexOf('//') === 0) { anchor = ''; rest = s.slice(2); }
    else if (s.indexOf('~/') === 0) { anchor = HOME; rest = s.slice(2); }
    else if (s.charAt(0) === '/') { anchor = scope === 'user' ? HOME + '/.claude' : ROOT; rest = s.slice(1); }
    else {
      anchor = ROOT;
      var explicit = s.indexOf('./') === 0;
      rest = s.replace(/^\.\//, '');
      if (!explicit && rest.replace(/\/$/, '').indexOf('/') < 0) anyDepth = true;          // a bare name: any depth
      if (!explicit && kind !== 'allow' && /^[^/*]+\/\*\*$/.test(rest)) anyDepth = true;  // src/** in deny or ask
    }
    var re = new RegExp('^' + esc(anchor) + '/' + (anyDepth ? '(?:.*/)?' : '') + globRe(rest) + '$');
    return re.test(normPath(path));
  }
  function inside(path) { var p = normPath(path); return p.indexOf(ROOT + '/') === 0 || p === ROOT; }
  function isProtected(path) {
    var segs = normPath(path).split('/');
    var base = segs[segs.length - 1];
    if (PROTECTED_FILES.indexOf(base) >= 0) return true;
    for (var i = 0; i < segs.length - 1; i++) {
      if (PROTECTED_DIRS.indexOf(segs[i]) >= 0) return !(segs[i] === '.claude' && segs[i + 1] === 'worktrees');
      if (segs[i] === '.config' && segs[i + 1] === 'git') return true;
    }
    return false;
  }

  /* ---------- web and MCP ---------- */

  function host(url) {
    var m = /^[a-z][a-z0-9+.-]*:\/\/([^/?#:]+)/i.exec(String(url || '').trim());
    return (m ? m[1] : String(url || '').trim().split('/')[0]).toLowerCase().replace(/\.$/, '');
  }
  function domainMatch(spec, url) {
    var m = /^domain:(.+)$/.exec(String(spec).trim());
    if (!m) return false;
    var p = m[1].toLowerCase().replace(/\.$/, ''), h = host(url);
    if (p === '*') return true;
    if (p.indexOf('*.') === 0) { var base = p.slice(2); return h.length > base.length && h.slice(-(base.length + 1)) === '.' + base; }
    return new RegExp('^' + p.split('*').map(esc).join('[^.]*') + '$').test(h);
  }
  function toolGlob(pattern, name) { return new RegExp('^' + pattern.split('*').map(esc).join('.*') + '$').test(name); }
  /** Does a rule's tool name cover this MCP tool? Allow globs must start with a literal mcp__<server>__. */
  function mcpMatch(ruleTool, tool, kind) {
    if (ruleTool === tool) return true;
    if (/^mcp__[^*]+$/.test(ruleTool) && ruleTool.split('__').length === 2) return tool.indexOf(ruleTool + '__') === 0;
    if (ruleTool.indexOf('*') >= 0) {
      if (kind === 'allow' && !/^mcp__[^*_][^*]*__/.test(ruleTool)) return false;
      return toolGlob(ruleTool, tool);
    }
    return false;
  }

  /* ---------- the decision ---------- */

  function classOf(tool) {
    if (tool === 'Bash' || tool === 'PowerShell') return 'shell';
    if (tool === 'Read' || tool === 'Grep' || tool === 'Glob') return 'read';
    if (tool === 'Edit' || tool === 'Write' || tool === 'NotebookEdit' || tool === 'MultiEdit') return 'edit';
    if (tool === 'WebFetch') return 'web';
    if (/^mcp__/.test(tool)) return 'mcp';
    return 'other';
  }
  /** Rules dropped while auto mode is on: ones that let arbitrary code run. */
  function broad(r) {
    if (r.tool === 'Agent' || r.tool === 'Monitor') return true;
    if (r.tool !== 'Bash' && r.tool !== 'PowerShell') return false;
    if (r.spec === null || r.spec.trim() === '*') return true;
    var s = r.spec.trim();
    if (INTERPRETERS.some(function (i) { return s === i + '*' || s === i + ' *' || s.indexOf(i + '*') === 0; })) return true;
    return /^(?:npm|pnpm|yarn|bun) run \*$|^(?:npm|pnpm|yarn|bun) run:\*$|^npx \*$|^pnpm (?:exec|dlx) \*$/.test(s);
  }

  function evaluate(rules, call, opts) {
    opts = opts || {};
    rules = rules || {};
    var mode = opts.mode || 'default', scope = opts.scope || 'project';
    var tool = String(call.tool || '').trim(), input = String(call.input === undefined ? '' : call.input);
    var cls = classOf(tool), ps = tool === 'PowerShell', steps = [];
    var lists = {};
    ['deny', 'ask', 'allow'].forEach(function (k) {
      lists[k] = (rules[k] || []).map(parse).filter(function (r) { return r.ok; });
    });
    if (mode === 'auto') {
      var dropped = lists.allow.filter(broad);
      if (dropped.length) {
        lists.allow = lists.allow.filter(function (r) { return !broad(r); });
        steps.push('Auto mode drops broad allow rules while it is on: ' + dropped.map(function (r) { return code(r.raw); }).join(', ') + '.');
      }
    }
    function done(decision, reason, rule, list) {
      return { decision: decision, label: DECISIONS[decision], reason: reason, rule: rule ? rule.raw : null, list: list || null, steps: steps };
    }

    // does a rule cover the call (or one command of it)?
    function covers(r, list, target, what) {
      if (cls === 'mcp' || (r.spec === null && /\*/.test(r.tool))) {
        if (cls === 'mcp') return r.spec === null && mcpMatch(r.tool, tool, list);
        return list !== 'allow' && toolGlob(r.tool, tool);   // "*" in deny or ask: every tool
      }
      if (what === 'read' || what === 'edit') {
        var want = what === 'read' ? ['Read'] : (list === 'deny' ? ['Edit', 'Read'] : ['Edit']);  // a Read deny also blocks edits
        if (want.indexOf(r.tool) < 0) return false;
        return r.spec === null || pathMatch(r.spec, target, list, scope);
      }
      if (r.tool !== tool) return false;
      if (r.spec === null) return true;
      if (/^\s*\w+\s*:/.test(r.spec) && !/^domain:/.test(r.spec) && cls !== 'shell') return false;  // Tool(param:value): not modelled
      if (cls === 'shell') return !/^command\s*:/.test(r.spec) && cmdMatch(r.spec, target, ps);
      if (cls === 'web') return domainMatch(r.spec, target);
      return r.spec === target;
    }
    function first(list, target, what) {
      for (var i = 0; i < lists[list].length; i++) if (covers(lists[list][i], list, target, what)) return lists[list][i];
      return null;
    }
    function fallback(reasonIfAsk) {
      if (mode === 'dontAsk') return done('deny', 'Don\'t ask mode refuses anything that would prompt.');
      if (mode === 'bypassPermissions') return done('allow', 'Bypass permissions runs it without asking.');
      if (mode === 'auto') return done('classifier', 'No rule decides it, so the auto mode classifier checks it against your request.');
      return done('ask', reasonIfAsk);
    }

    /* ----- shell commands ----- */
    if (cls === 'shell') {
      var sp = split(input, ps);
      var nested = ps ? [] : substitutions(input).reduce(function (a, s) { return a.concat(split(s).parts); }, []);
      var parts = sp.parts.concat(nested);
      if (!parts.length) return done('ask', 'There is no command to check.');
      steps.push(parts.length > 1 ? 'Split into ' + parts.length + ' commands: ' + parts.map(code).join(', ') + '.' : 'One command: ' + code(parts[0]) + '.');
      var denyForm = parts.map(function (p) { return ps ? p.trim() : strip(p, false); });
      var allowForm = parts.map(function (p) { return ps ? p.trim() : strip(p, true); });
      parts.forEach(function (p, i) {
        if (!ps && denyForm[i] !== p.trim().replace(/\s+/g, ' ')) steps.push('Stripped to ' + code(denyForm[i]) + ' before matching' + (allowForm[i] !== denyForm[i] ? ' deny and ask rules (allow rules see ' + code(allowForm[i]) + ')' : '') + '.');
      });
      // deny: any command, or a file one of them reads or writes
      for (var d = 0; d < parts.length; d++) {
        var rd = first('deny', denyForm[d]);
        if (rd) { steps.push('Deny rule ' + code(rd.raw) + ' matches ' + code(denyForm[d]) + '.'); return done('deny', 'A deny rule matches, and deny is checked first.', rd, 'deny'); }
        if (!ps) {
          var fa = fileArgs(denyForm[d]), fx, fr;
          for (fx = 0; fx < fa.reads.length; fx++) {
            fr = first('deny', fa.reads[fx], 'read');
            if (fr) { steps.push(code(denyForm[d]) + ' reads ' + code(fa.reads[fx]) + ', which deny rule ' + code(fr.raw) + ' covers.'); return done('deny', 'The command reads a file a deny rule covers.', fr, 'deny'); }
          }
          for (fx = 0; fx < fa.writes.length; fx++) {
            fr = first('deny', fa.writes[fx], 'edit');
            if (fr) { steps.push(code(denyForm[d]) + ' writes ' + code(fa.writes[fx]) + ', which deny rule ' + code(fr.raw) + ' covers.'); return done('deny', 'The command writes a file a deny rule covers.', fr, 'deny'); }
          }
        }
      }
      steps.push('Deny rules: none match.');
      for (var a = 0; a < parts.length; a++) {
        var ra = first('ask', denyForm[a]);
        if (ra) {
          steps.push('Ask rule ' + code(ra.raw) + ' matches ' + code(denyForm[a]) + '.');
          if (mode === 'dontAsk') return done('deny', 'Don\'t ask mode refuses an explicit ask match.', ra, 'ask');
          if (mode === 'bypassPermissions') steps.push('An explicit ask rule still asks in bypass: the docs list it among the actions no mode auto-approves.');
          return done('ask', 'An ask rule matches, so it asks whatever the mode.', ra, 'ask');
        }
      }
      steps.push('Ask rules: none match.');
      if (sp.dangling) {
        steps.push('A dangling ' + code('&&') + ' or ' + code('||') + ' cannot be parsed, so no allow rule approves it.');
        return fallback('Manual mode asks for anything no rule approves.');
      }
      var cdThenGit = !ps && parts.some(function (p) { return /^cd\s+(?!\.\s*$)\S/.test(p.trim()); }) && parts.some(function (p) { return /^git\s/.test(p.trim()); });
      var open = [];
      parts.forEach(function (p, i) {
        var ral = first('allow', allowForm[i]);
        if (ral) steps.push(code(allowForm[i]) + ' matches allow rule ' + code(ral.raw) + '.');
        else if (!ps && readOnly(allowForm[i], cdThenGit)) steps.push(code(allowForm[i]) + ' is a read-only command: no rule needed.');
        else { steps.push(code(allowForm[i]) + ' matches no allow rule.'); open.push(allowForm[i]); }
      });
      if (!open.length) {
        if (parts.length > 1) return done('allow', 'Every command is allowed by a rule or read-only.');
        var only = first('allow', allowForm[0]);
        return only ? done('allow', 'An allow rule matches.', only, 'allow') : done('allow', 'A read-only command: it needs no rule in any mode.', null, 'readonly');
      }
      if (mode === 'acceptEdits' && !ps && open.every(function (p) { return FILE_CMDS.indexOf(words(p)[0]) >= 0; })) {
        steps.push('Accept edits runs common file commands (' + FILE_CMDS.map(code).join(', ') + ') in your working folders.');
        return done('allow', 'Accept edits mode runs common file commands without asking.');
      }
      if (mode === 'plan') {
        steps.push('In plan mode, commands outside the read-only set ask, or go to the classifier when auto mode is available (as on your setup).');
        return done('classifier', 'Plan mode: with auto mode available, the classifier reviews commands while you plan; otherwise it asks.');
      }
      if (mode === 'default' || mode === 'acceptEdits') steps.push((mode === 'default' ? 'Manual' : 'Accept edits') + ' mode asks for ' + open.map(code).join(', ') + '.');
      return fallback((parts.length === 1 ? 'No rule covers it' : 'Not every command is covered') +
        (mode === 'acceptEdits' ? ', and accept edits runs only common file commands by itself, so it asks.' : ', so Manual mode asks.'));
    }

    /* ----- file reads and edits ----- */
    if (cls === 'read' || cls === 'edit') {
      var path = input.trim(), abs = normPath(path), what = cls;
      if (!path) return done('ask', 'There is no path to check.');
      steps.push('The path resolves to ' + code(abs) + (inside(path) ? ', inside the working folder.' : ', outside the working folder.'));
      var rdn = first('deny', path, what);
      if (rdn) {
        steps.push('Deny rule ' + code(rdn.raw) + ' covers it' + (what === 'edit' && rdn.tool === 'Read' ? ' (a Read deny also blocks edits)' : '') + '.');
        return done('deny', 'A deny rule covers the path.', rdn, 'deny');
      }
      steps.push('Deny rules: none cover it.');
      var rak = first('ask', path, what);
      if (rak) {
        steps.push('Ask rule ' + code(rak.raw) + ' covers it.');
        if (mode === 'dontAsk') return done('deny', 'Don\'t ask mode refuses an explicit ask match.', rak, 'ask');
        return done('ask', 'An ask rule covers the path.', rak, 'ask');
      }
      steps.push('Ask rules: none cover it.');
      if (what === 'edit') {
        if (mode === 'plan') { steps.push('Plan mode keeps edits blocked until you approve the plan.'); return done('deny', 'Plan mode: edits wait for your approval of the plan.'); }
        if (isProtected(path)) {
          steps.push(code(path) + ' is a protected path: allow rules do not pre-approve it.');
          if (mode === 'bypassPermissions') return done('allow', 'Only bypass writes protected paths without asking.');
          if (mode === 'auto') return done('classifier', 'In auto mode, protected-path writes go to the classifier.');
          if (mode === 'dontAsk') return done('deny', 'Don\'t ask mode refuses protected-path writes.');
          return done('ask', 'Protected paths always ask outside bypass.');
        }
        var ral2 = first('allow', path, what);
        if (ral2) { steps.push('Allow rule ' + code(ral2.raw) + ' covers it.'); return done('allow', 'An allow rule covers the path.', ral2, 'allow'); }
        steps.push('Allow rules: none cover it.');
        if (mode === 'acceptEdits' && inside(path)) { steps.push('Accept edits makes edits in your working folders without asking.'); return done('allow', 'Accept edits mode makes the edit.'); }
        if (mode === 'auto' && inside(path)) { steps.push('Auto mode allows local file work in your working folder.'); return done('allow', 'Auto mode allows file work in the working folder.'); }
        if (mode === 'default') steps.push('Manual mode asks before an edit.');
        return fallback(inside(path) ? 'Manual mode asks before every edit.' : 'An edit outside the working folders asks.');
      }
      var ral3 = first('allow', path, what);
      if (ral3) { steps.push('Allow rule ' + code(ral3.raw) + ' covers it.'); return done('allow', 'An allow rule covers the path.', ral3, 'allow'); }
      if (inside(path)) { steps.push('Reads inside the working folders need no approval in any mode.'); return done('allow', 'Reads in the working folder need no approval.'); }
      steps.push('A read outside the working folders needs your approval.');
      return fallback('A read outside the working folders asks.');
    }

    /* ----- web fetches, MCP tools, everything else ----- */
    var target = cls === 'web' ? input.trim() : input;
    if (cls === 'web') steps.push('The host is ' + code(host(target)) + '.');
    if (cls === 'mcp') steps.push('An MCP tool: server ' + code(tool.split('__')[1] || '') + ', tool ' + code(tool.split('__').slice(2).join('__')) + '.');
    var rd2 = first('deny', target);
    if (rd2) { steps.push('Deny rule ' + code(rd2.raw) + ' matches.'); return done('deny', 'A deny rule matches.', rd2, 'deny'); }
    steps.push('Deny rules: none match.');
    var ra2 = first('ask', target);
    if (ra2) {
      steps.push('Ask rule ' + code(ra2.raw) + ' matches.');
      if (mode === 'dontAsk') return done('deny', 'Don\'t ask mode refuses an explicit ask match.', ra2, 'ask');
      return done('ask', 'An ask rule matches.', ra2, 'ask');
    }
    steps.push('Ask rules: none match.');
    var rl2 = first('allow', target);
    if (rl2) { steps.push('Allow rule ' + code(rl2.raw) + ' matches.'); return done('allow', 'An allow rule matches.', rl2, 'allow'); }
    steps.push('Allow rules: none match.');
    if (cls === 'web') steps.push('Claude Code pre-approves some documentation sites; this tester does not know that list.');
    return fallback('No rule approves it, so it asks.');
  }

  U.perm = {
    parse: parse, evaluate: evaluate, knownTool: knownTool, split: split, substitutions: substitutions, strip: strip, cmdMatch: cmdMatch, pathMatch: pathMatch,
    domainMatch: domainMatch, isProtected: isProtected, normPath: normPath, broad: broad, readOnly: readOnly,
    MODES: MODES, DECISIONS: DECISIONS, TOOLS: TOOLS, HOME: HOME, ROOT: ROOT
  };
})(window.CLT);
