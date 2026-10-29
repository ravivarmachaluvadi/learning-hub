/*
 * habits.js - the Java-habit warnings (⚠): lines a Java developer writes from habit, which Python
 * either rejects (a syntax error, or an error when the line runs) or accepts but reads differently.
 *
 *   PYLT.javaHabits(code) -> [{line, id, msg}]   line is 1-based; msg is Markdown saying what to
 *                                               write instead, and why
 *
 * js/editor.js shows each one as a ⚠ in the gutter of every Python editor, with the message on hover.
 * The rules read only code: strings and comments are blanked out first (every position and line
 * break is kept), so "x++" in a string or "this.x" in a comment never warns. Most rules test one
 * line; the mutable default reads a whole def, which may span lines. A rule marked `only` explains
 * its line by itself (a Java for line would otherwise also warn about its ";", "++" and "{"); a rule
 * marked `top` applies only to a line that starts a statement (not inside brackets, not after "\").
 *
 * tests/test_ui.py ("warnings") proves that each rule fires on its habit and not on the Python way,
 * and that no lesson, template or example warns except where it shows the habit on purpose.
 */
(function (U) {
  'use strict';

  /**
   * Blank out strings and comments, keeping positions. Returns {code, depth: bracket depth at the
   * start of each line, cont: whether each line continues the one before with a backslash}.
   */
  function scan(text) {
    var out = text.split(''), n = text.length, i = 0;
    function blank(a, b) { for (var k = a; k < b; k++) if (out[k] !== '\n') out[k] = ' '; }
    while (i < n) {
      var c = text.charAt(i);
      if (c === '#') {
        var e = text.indexOf('\n', i);
        if (e < 0) e = n;
        blank(i, e);
        i = e;
        continue;
      }
      if (c === '"' || c === "'") {
        var triple = text.substr(i, 3) === c + c + c;
        var j = i + (triple ? 3 : 1);
        while (j < n) {
          var d = text.charAt(j);
          if (d === '\\') { j += 2; continue; }
          if (triple ? text.substr(j, 3) === c + c + c : d === c) { j += triple ? 3 : 1; break; }
          if (d === '\n' && !triple) break;        // an unclosed string ends with its line
          j++;
        }
        blank(i, Math.min(j, n));
        i = j;
        continue;
      }
      i++;
    }
    var code = out.join(''), lines = code.split('\n'), depth = [], cont = [], level = 0;
    lines.forEach(function (l, k) {
      depth.push(level);
      cont.push(k > 0 && /\\\s*$/.test(lines[k - 1]));
      for (var m = 0; m < l.length; m++) {
        var ch = l.charAt(m);
        if (ch === '(' || ch === '[' || ch === '{') level++;
        else if ((ch === ')' || ch === ']' || ch === '}') && level > 0) level--;
      }
    });
    return { code: code, lines: lines, depth: depth, cont: cont };
  }

  var WORD = { 'true': 'True', 'false': 'False', 'null': 'None' };

  var RULES = [
    // Java's for has a ; or a : inside its parentheses; Python's for (a, b) in pairs: unpacks a tuple
    { id: 'c-for', only: true, test: /^\s*for\s*\([^)]*[;:]/,
      msg: 'A Python `for` walks over the items of something; there is no `for (start; test; step)`. Count with `for i in range(n):` (0 to n − 1), or visit each item with `for x in items:`.' },
    { id: 'catch', only: true, test: /^\s*\}?\s*catch\s*\(/,
      msg: 'Python catches with `except`: Java\'s `catch (ValueError e)` is `except ValueError as e:`. There are no braces: indent the handler under it.' },
    { id: 'throw', only: true, test: /^\s*throw\b/,
      msg: 'Python raises with `raise`, and has no `new`: `raise ValueError("bad input")`.' },
    { id: 'comment', only: true, top: true, test: /^\s*(\/\/|\/\*)/,
      msg: 'Comments start with `#` in Python. `//` is whole-number division (`7 // 2` is 3), and there is no `/* */`: start each line of a longer comment with `#`.' },
    { id: 'declaration', top: true, test: /^\s*(final\s+)?(int|long|short|byte|double|float|boolean|char|String|var|(List|Map|Set|ArrayList|HashMap)<[^>]*>)\s+[A-Za-z_]\w*\s*(=|;|$)/,
      msg: 'Python variables have no type in front, and no `final`: write `count = 0`. The type belongs to the value, not to the name. (To document a type, write a hint: `count: int = 0`.)' },
    { id: 'println', test: /\bSystem\s*\.\s*(out|err)\s*\.\s*print(ln|f)?\b/,
      msg: 'Python prints with `print(...)`: `print("Hello")`. `print(a, b)` puts a space between the values, and `print(x, end="")` is Java\'s `System.out.print(x)`.' },
    { id: 'this', test: /(^|[^\w.])this\s*\./,
      msg: 'Python has no `this`. Inside a method the object is the first parameter, called `self` by convention: `self.name = name`.' },
    { id: 'literal', test: /(^|[^\w.])(true|false|null)\b(?!\s*=(?!=))/,
      msg: function (m) {
        var w = m[2];
        return w === 'null' ?
          'Python\'s "no value" is `None`, with a capital N. As written, `null` is just a name nobody defined: a `NameError` when this line runs.' :
          'Python writes `' + WORD[w] + '` with a capital ' + WORD[w].charAt(0) + '. As written, `' + w + '` is just a name nobody defined: a `NameError` when this line runs.';
      } },
    { id: 'operator', test: /&&|\|\||!(?!=)/,
      msg: function (m, line) {
        var found = [];
        if (/&&/.test(line)) found.push('`&&` as `and`');
        if (/\|\|/.test(line)) found.push('`||` as `or`');
        if (/!(?!=)/.test(line)) found.push('`!` as `not`');
        return 'Python writes ' + found.join(', ') + ': `if ready and not done:`. As written, this line is a syntax error.';
      } },
    { id: 'increment', test: /[\w)\]]\s*(\+\+|--)\s*(;|\)|,|\]|$)|(^|[=(\[,:]|\breturn)\s*(\+\+|--)\s*[A-Za-z_(]/,
      msg: function (m) {
        return m[1] ?
          'Python has no `++` or `--`. Write `i += 1` (or `i -= 1`). As written, this line is a syntax error.' :
          '`++i` is legal Python but does nothing: it means `+(+i)`, which is just `i` (and `--i` is `-(-i)`). To add one, write `i += 1`.';
      } },
    { id: 'length', test: /(^|[^\w])(?!self\.|cls\.)[\w)\]]+\.length\b(?!\s*=(?!=))/,
      msg: 'Python has no `.length`: the length of a string, list, dict or anything else is `len(x)`. (If this is your own object with a `length` attribute, ignore this.)' },
    { id: 'size', test: /\.size\s*\(\s*\)/,
      msg: 'Python has no `.size()`: the number of items in anything is `len(x)`. (If your own class has a `size()` method, ignore this.)' },
    { id: 'equals', test: /\.equals\s*\(/,
      msg: 'Compare values with `==` in Python: it calls the class\'s `__eq__`, which is Python\'s `equals()`. (`is` asks whether two names are the same object, like `==` on objects in Java.)' },
    { id: 'else-if', test: /\belse\s+if\b/,
      msg: 'Python writes `else if` as one word: `elif x > 0:`.' },
    { id: 'none-compare', test: /[=!]=\s*None\b|\bNone\s*[=!]=/,
      msg: 'Compare with `None` using `is`: `if x is None:` (or `is not None`). A class can change what `==` means (`__eq__`) but not `is`, and PEP 8, Python\'s style guide, asks for `is`.' },
    { id: 'bare-except', test: /^\s*except\s*:/,
      msg: 'A bare `except:` catches everything, even Ctrl+C (`KeyboardInterrupt`), `sys.exit()` and a misspelt name. Name what you expect: `except ValueError:`, or at least `except Exception:`.' },
    { id: 'new', test: /(^|[^\w.])new\s+[A-Z]\w*\s*[(<]/,
      msg: 'Python has no `new`: calling the class creates the object. Write `Point(1, 2)`.' },
    { id: 'braces', test: function (line, i, s) {
        return /\)\s*\{\s*$/.test(line) || /^\s*(else|try|finally|do)\s*\{\s*$/.test(line) || /^\s*\}\s*(else|while)\b/.test(line) ||
          (/^\s*\}\s*$/.test(line) && s.depth[i] === 0);
      },
      msg: 'Python has no `{ }` blocks: end the line with a colon and indent the block below it: `if x > 1:`, then the body 4 spaces in.' },
    { id: 'semicolon', test: /;\s*$/,
      msg: 'Python ends a statement at the end of the line, so the `;` is not needed. (It is allowed, which is why Python does not complain, but Python code never uses one.)' }
  ];

  var MUTABLE = /^(\[|\{|(list|dict|set|bytearray|defaultdict|deque|Counter|OrderedDict)\s*\()/;

  /** Defaults like items=[] in every def, even one spread over several lines. */
  function mutableDefaults(s) {
    var code = s.code, re = /\bdef\s+[A-Za-z_]\w*\s*\(/g, m, out = [];
    function lineAt(pos) { return code.slice(0, pos).split('\n').length; }
    while ((m = re.exec(code))) {
      var i = m.index + m[0].length, level = 1, partStart = i, parts = [];
      for (; i < code.length; i++) {
        var c = code.charAt(i);
        if (c === '(' || c === '[' || c === '{') level++;
        else if (c === ')' || c === ']' || c === '}') { if (--level === 0) break; }
        else if (c === ',' && level === 1) { parts.push([partStart, i]); partStart = i + 1; }
      }
      parts.push([partStart, i]);
      parts.forEach(function (p) {
        var text = code.slice(p[0], p[1]), inner = 0;
        for (var k = 0; k < text.length; k++) {
          var ch = text.charAt(k);
          if (ch === '(' || ch === '[' || ch === '{') inner++;
          else if (ch === ')' || ch === ']' || ch === '}') inner--;
          else if (ch === '=' && inner === 0 && text.charAt(k + 1) !== '=' && !/[=<>!]/.test(text.charAt(k - 1))) {
            var name = (/^\s*\**([A-Za-z_]\w*)/.exec(text) || [])[1] || 'it';
            if (MUTABLE.test(text.slice(k + 1).trim())) {
              out.push({ line: lineAt(p[0] + k), id: 'mutable-default',
                msg: 'This default is made **once**, when the `def` line runs, and every call that leaves `' + name + '` out shares that one object: ' +
                  'what one call adds, the next call sees. Use `None`, and make a fresh one inside: `' + name + '=None`, then `if ' + name + ' is None: ' + name + ' = []`.' });
            }
            break;
          }
        }
      });
    }
    return out;
  }

  U.javaHabits = function (text) {
    var s = scan(String(text || '')), out = [];
    s.lines.forEach(function (line, i) {
      if (!line.trim()) return;
      var statementStart = s.depth[i] === 0 && !s.cont[i];
      for (var r = 0; r < RULES.length; r++) {
        var rule = RULES[r];
        if (rule.top && !statementStart) continue;
        var m = typeof rule.test === 'function' ? (rule.test(line, i, s) ? [line] : null) : rule.test.exec(line);
        if (!m) continue;
        out.push({ line: i + 1, id: rule.id, msg: typeof rule.msg === 'function' ? rule.msg(m, line) : rule.msg });
        if (rule.only) break;
      }
    });
    out = out.concat(mutableDefaults(s));
    out.sort(function (a, b) { return a.line - b.line; });
    return out;
  };
})(window.PYLT);
