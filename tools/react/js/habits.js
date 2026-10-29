/*
 * habits.js - the React-habit warnings (⚠): code that runs, or nearly does, but is not how React
 * wants it. Most are habits from HTML and plain JavaScript (the reverse of the UI Learning Tool,
 * which warns that onClick is a misspelling of onclick).
 *
 *   RLT.reactHabits(code) -> [{line, id, msg, fix?}]   line is 1-based; msg is Markdown; fix, when
 *                         there is one, is {label, change: {from, to, text}} (positions in code)
 *
 * The rules read Babel's tree of the code (RLT.react.parse), not its text: a "class=" in a string or
 * a comment never warns, and every rule knows what is JSX, which function is a component or a hook,
 * and which names come from useState. Code that does not parse gets no warnings: its syntax error
 * shows instead. js/editor.js draws each one as a ⚠ in the gutter, with the message and fix on hover.
 *
 *   class-attr, for-attr     class= and for= on an HTML element: className, htmlFor
 *   lowercase-event          onclick= on an HTML element: onClick
 *   style-string             style="..." : style={{ ... }}
 *   map-key                  .map() returning an element with no key
 *   hook-condition           a hook inside if, ? :, &&, a loop, after an early return, or in a
 *                            function that is neither a component nor a hook (use() itself may be
 *                            conditional)
 *   mutate-state             push/splice/sort... on a useState value, assigning into it, count++
 *   call-in-handler          onClick={save()}: it runs while rendering
 *   missing-import           a React API (data/api.js) used but not imported, with "Add the import"
 *
 * tests/test_ui.py ("warnings") proves each rule fires on its habit and not on the React way, and
 * that no lesson example, solution or template warns.
 */
(function (U) {
  'use strict';

  var EVENTS = {
    onclick: 'onClick', ondblclick: 'onDoubleClick', onchange: 'onChange', oninput: 'onInput', onsubmit: 'onSubmit',
    onkeydown: 'onKeyDown', onkeyup: 'onKeyUp', onkeypress: 'onKeyPress', onmouseenter: 'onMouseEnter',
    onmouseleave: 'onMouseLeave', onmouseover: 'onMouseOver', onmouseout: 'onMouseOut', onmousedown: 'onMouseDown',
    onmouseup: 'onMouseUp', onfocus: 'onFocus', onblur: 'onBlur', onscroll: 'onScroll', oncontextmenu: 'onContextMenu',
    onpointerdown: 'onPointerDown', ontouchstart: 'onTouchStart', ondragstart: 'onDragStart', ondrop: 'onDrop', onload: 'onLoad'
  };
  var MUTATORS = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin'];
  var STATE_HOOKS = ['useState', 'useReducer'];

  function isHookName(n) { return /^use[A-Z0-9]/.test(n || ''); }
  function isComponentName(n) { return /^[A-Z]/.test(n || ''); }
  function reactEvent(n) { return EVENTS[n] || 'on' + n.charAt(2).toUpperCase() + n.slice(3); }

  /** useState, or React.useState: the hook's name; '' for anything else. */
  function calleeName(c) {
    if (c.type === 'Identifier') return c.name;
    if (c.type === 'MemberExpression' && !c.computed && c.object.type === 'Identifier' && c.object.name === 'React' && c.property.type === 'Identifier') return c.property.name;
    return '';
  }

  /** The name a function goes by: its own, the variable it is assigned to (also through memo(...)), 'default'. */
  function functionName(path) {
    var n = path.node, p = path.parentPath;
    if (n.id && n.id.name) return n.id.name;
    if (p && p.isVariableDeclarator() && p.node.id.type === 'Identifier') return p.node.id.name;
    if (p && p.isCallExpression() && p.parentPath && p.parentPath.isVariableDeclarator() && p.parentPath.node.id.type === 'Identifier') return p.parentPath.node.id.name;
    if (p && p.isExportDefaultDeclaration()) return 'default';
    return '';
  }

  /** The first return statement in node, not counting those of functions inside it; null if none. */
  function returnIn(node) {
    if (!node || typeof node.type !== 'string') return null;
    if (node.type === 'ReturnStatement') return node;
    if (/Function/.test(node.type)) return null;
    for (var k in node) {
      if (k === 'loc' || /comments$/i.test(k)) continue;
      var v = node[k], list = Array.isArray(v) ? v : [v];
      for (var i = 0; i < list.length; i++) {
        var r = list[i] && typeof list[i] === 'object' ? returnIn(list[i]) : null;
        if (r) return r;
      }
    }
    return null;
  }

  /**
   * Why a hook call is in the wrong place: {why: 'if' | 'conditional' | 'loop' | 'nested' | 'return'
   * (after an early return, at line)}, or null when it is fine.
   */
  function hookPlace(path) {
    var child = path, p = path.parentPath, top = null, body = null;
    while (p) {
      var n = p.node;
      if (p.isBlockStatement() && p.parentPath && p.parentPath.isFunction()) { top = child.node; body = n.body; }
      if (p.isFunction()) {
        var name = functionName(p);
        if (!(name === 'default' || isComponentName(name) || isHookName(name))) return { why: 'nested' };
        for (var i = 0; body && i < body.indexOf(top); i++) {
          var r = returnIn(body[i]);
          if (r) return { why: 'return', line: r.loc.start.line };
        }
        return null;
      }
      if ((p.isIfStatement() || p.isConditionalExpression()) && child.node !== n.test) return { why: p.isIfStatement() ? 'if' : 'conditional' };
      if (p.isLogicalExpression() && child.node === n.right) return { why: 'conditional' };
      if (p.isSwitchCase() && child.node !== n.test) return { why: 'if' };
      if (p.isLoop()) return { why: 'loop' };
      child = p;
      p = p.parentPath;
    }
    return null;
  }

  /** The JSX a .map() callback returns directly: its arrow body, or its top-level return statements. */
  function returnedJsx(fn) {
    var isJsx = function (n) { return n && (n.type === 'JSXElement' || n.type === 'JSXFragment'); };
    if (isJsx(fn.body)) return [fn.body];
    if (fn.body.type !== 'BlockStatement') return [];
    return fn.body.body.filter(function (s) { return s.type === 'ReturnStatement' && isJsx(s.argument); }).map(function (s) { return s.argument; });
  }

  /** If expr is rooted in a useState (or useReducer) value: {name, setter}; else null. */
  function stateOf(path, expr) {
    var root = expr;
    while (root.type === 'MemberExpression') root = root.object;
    if (root.type !== 'Identifier') return null;
    var b = path.scope.getBinding(root.name);
    if (!b || !b.path.isVariableDeclarator()) return null;
    var d = b.path.node;
    if (d.id.type !== 'ArrayPattern' || d.id.elements[0] !== b.identifier) return null;
    if (!d.init || d.init.type !== 'CallExpression' || STATE_HOOKS.indexOf(calleeName(d.init.callee)) < 0) return null;
    var setter = d.id.elements[1];
    return { name: root.name, setter: setter && setter.type === 'Identifier' ? setter.name : 'the setter' };
  }

  U.reactHabits = function (code) {
    code = String(code || '');
    if (!U.react || !U.react.parse || !code.trim()) return [];
    var parsed = U.react.parse(code);
    if (!parsed.ast) return [];
    var out = [], imported = {};
    function src(n) { return code.slice(n.start, n.end); }
    function warn(node, id, msg, fix) { out.push({ line: node.loc.start.line, id: id, msg: msg, fix: fix || null }); }
    function rename(node, to) { return { label: 'Change it to ' + to, change: { from: node.start, to: node.end, text: to } }; }

    try {
      U.react.traverse(parsed.ast, {
        JSXAttribute: function (path) {
          var a = path.node, name = a.name.type === 'JSXIdentifier' ? a.name.name : '';
          var tag = path.parentPath.node.name, dom = tag.type === 'JSXIdentifier' && /^[a-z]/.test(tag.name);
          if (dom && name === 'class') {
            warn(a, 'class-attr', '`class` is a reserved word in JavaScript, so JSX uses the DOM\'s name for it: `className="…"`.', rename(a.name, 'className'));
          } else if (dom && name === 'for') {
            warn(a, 'for-attr', '`for` is a reserved word in JavaScript, so a label says which input it belongs to with `htmlFor="…"`.', rename(a.name, 'htmlFor'));
          } else if (dom && /^on[a-z]+$/.test(name)) {
            warn(a, 'lowercase-event', 'React\'s events are camelCase: `' + reactEvent(name) + '`, not the HTML attribute `' + name + '`. Its value is a function, `{handleClick}`, not a string of code.', rename(a.name, reactEvent(name)));
          } else if (dom && name === 'style' && a.value && a.value.type === 'StringLiteral') {
            warn(a, 'style-string', '`style` takes an object in React, not a CSS string: `style={{ color: \'red\', fontSize: 14 }}`, with camelCase names (numbers mean px). A string throws an error when this draws.');
          }
          var v = a.value;
          if (/^on[A-Z]/.test(name) && v && v.type === 'JSXExpressionContainer' && v.expression.type === 'CallExpression') {
            var call = v.expression, fn = src(call.callee);
            warn(a, 'call-in-handler', '`' + name + '={' + src(call) + '}` calls `' + fn + '` **while rendering** and hands React what it returns. Pass the function itself, `' + name + '={' + fn + '}`, ' +
              'or wrap a call that needs arguments: `' + name + '={() => ' + src(call) + '}`. (If `' + fn + '(…)` returns a function on purpose, ignore this.)');
          }
        },
        CallExpression: function (path) {
          var n = path.node, c = n.callee;
          if ((c.type === 'MemberExpression' || c.type === 'OptionalMemberExpression') && !c.computed && c.property.name === 'map') {
            var cb = n.arguments[0];
            if (cb && (cb.type === 'ArrowFunctionExpression' || cb.type === 'FunctionExpression')) {
              returnedJsx(cb).forEach(function (j) {
                if (j.type === 'JSXFragment') {
                  warn(j, 'map-key', 'Each item `.map()` returns needs a `key`, and `<>…</>` cannot take one: write `<Fragment key={item.id}>…</Fragment>` (import `Fragment` from \'react\').');
                  return;
                }
                var attrs = j.openingElement.attributes;
                var keyed = attrs.some(function (at) { return at.type === 'JSXSpreadAttribute' || (at.name && at.name.name === 'key'); });
                if (!keyed) warn(j, 'map-key', 'Each item `.map()` returns needs a `key` from the data, `<' + src(j.openingElement.name) + ' key={item.id}>`, so React can tell the items apart when the list changes. (The index works only for a list that never reorders or shrinks.)');
              });
            }
          }
          var hook = calleeName(c);
          if (isHookName(hook)) {
            var place = hookPlace(path), why = place && place.why;
            var lead = 'Hooks must run in the same order on every render, so React can match each one to its state. ';
            if (why === 'return') warn(n, 'hook-condition', lead + 'This `' + hook + '` comes after an early `return` (line ' + place.line + '): a render that returns there skips it, and when the next one does not, React throws "Rendered more hooks than during the previous render". Move every hook above the first `return`.');
            else if (why === 'if') warn(n, 'hook-condition', lead + 'This `' + hook + '` is inside an `if`: some renders skip it, and the hooks after it get the wrong state. Call it at the top of the component and put the condition after it.');
            else if (why === 'conditional') warn(n, 'hook-condition', lead + 'This `' + hook + '` is inside `? :` or `&&`, so some renders skip it. Call it at the top of the component and use its value in the condition.');
            else if (why === 'loop') warn(n, 'hook-condition', lead + 'This `' + hook + '` is inside a loop, so it runs a different number of times when the data changes. Call it once at the top, or move each item into its own component.');
            else if (why === 'nested') warn(n, 'hook-condition', '`' + hook + '` is inside a function that is neither a component nor a hook (an event handler, a callback), where React cannot track it: running it is an "Invalid hook call". Call it at the top of the component and use its value inside the function.');
          }
          if ((c.type === 'MemberExpression') && !c.computed && MUTATORS.indexOf(c.property.name) >= 0) {
            var st = stateOf(path, c.object);
            if (st) warn(n, 'mutate-state', '`' + src(c) + '(…)` changes the state in place. React compares the old and the new value to decide whether to draw again, and it is still the same array, so nothing updates. ' +
              'Make a new array and pass it to the setter: `' + st.setter + '([...' + st.name + ', item])`; to sort or reverse, copy first: `[...' + st.name + '].sort()`.');
          }
        },
        AssignmentExpression: function (path) {
          var left = path.node.left, st = left.type === 'Identifier' || left.type === 'MemberExpression' ? stateOf(path, left) : null;
          if (!st) return;
          if (left.type === 'Identifier') warn(path.node, 'mutate-state', '`' + st.name + ' = …` cannot change state: ask React with the setter, `' + st.setter + '(…)`, and it draws again with the new value.');
          else warn(path.node, 'mutate-state', '`' + src(left) + ' = …` changes the state in place, so React sees the same object and does not draw again. Make a new one and pass it to the setter: `' + st.setter + '({ ...' + st.name + ', field: value })`.');
        },
        UpdateExpression: function (path) {
          var arg = path.node.argument, st = stateOf(path, arg);
          if (st) warn(path.node, 'mutate-state', '`' + src(path.node) + '` tries to change state directly; it is a `const`, and even as a `let` React would not draw again. Ask for the change with the setter: `' + st.setter + '(' + st.name.charAt(0) + ' => ' + st.name.charAt(0) + ' + 1)`.');
        },
        ReferencedIdentifier: function (path) {
          var name = path.node.name, api = U.find('api', name);
          if (!api || imported[name] || path.scope.hasBinding(name)) return;
          imported[name] = true;
          var change = U.assist && U.assist.addImport ? U.assist.addImport(code, name) : null;
          warn(path.node, 'missing-import', '`' + name + '` comes from React, and this file does not import it: when it runs, "' + name + ' is not defined". ' +
            'Add it to the import at the top: `import { ' + name + ' } from \'' + api.module + '\'`.', change ? { label: 'Add the import', change: change } : null);
        }
      });
    } catch (e) {
      return [];   // a tree this file does not expect: better no warning than a broken editor
    }
    out.sort(function (a, b) { return a.line - b.line; });
    return out;
  };
})(window.RLT);
