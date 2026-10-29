/*
 * views/recreate.js - "Recreate this" challenges (#/recreate and #/recreate/<id>).
 *
 * You see a finished design (the target) and write CSS until your preview matches it. The target and
 * your page run in two previews of the same size. After every change the preview bridge measures, on
 * both pages, the elements the challenge lists in `compare` (data/recreate.js): each element's box
 * and a few computed styles. Every difference is listed in plain words ("`.card` is 40px narrower");
 * when none is left, it is a match.
 *
 * Three ways to look at the two pages:
 *   - side by side;
 *   - overlay: the target laid over yours, with a slider for its opacity;
 *   - difference: the target blended over yours with mix-blend-mode: difference, so identical
 *     pixels turn black and anything different lights up.
 *
 * The line between the designs and the code can be dragged (both pages are measured again at the new
 * width), the grip under the editor sets its height, and Full screen puts the two across the whole
 * window, each scrolling on its own (js/layout.js).
 */
(function (U) {
  'use strict';
  var h = U.h;
  var TOL = 2; // px a box may be off and still count as the same
  var MODES = [
    ['side', 'Side by side', 'The target next to yours (above it, on a narrow screen). Both are measured at this width.'],
    ['overlay', 'Overlay', 'Yours, with the target laid over it. Slide to fade the target in and out.'],
    ['diff', 'Difference', 'Black means identical. Anything that lights up is a difference.']
  ];

  function challenges() { return U.data.recreate || []; }
  function done() { return U.store.get('recreate.done', {}); }
  function markDone(id) {
    var d = done();
    if (d[id]) return;
    d[id] = new Date().toISOString();
    U.store.set('recreate.done', d);
  }

  /* ---------- comparing the two measured pages ---------- */

  function rgba(v) {
    var m = /^rgba?\(([^)]+)\)$/.exec(v || '');
    if (!m) return null;
    var p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return p.length >= 3 ? { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 } : null;
  }

  /** A corner radius as drawn: "999px" and "50%" both give a full curve, never more than half the box. */
  function drawnRadius(v, box) {
    var first = String(v || '0').split(/\s+/)[0], half = Math.min(box.w, box.h) / 2;
    var r = parseFloat(first) || 0;
    if (/%$/.test(first)) r = r / 100 * Math.min(box.w, box.h);
    return Math.min(r, half);
  }

  /** Do two computed values agree? `mine` and `target` are the measured boxes, for radii. */
  function sameValue(prop, a, b, mine, target) {
    if (/\?$/.test(prop)) return (a === 'none') === (b === 'none'); // only "is there one at all"
    var ca = rgba(a), cb = rgba(b);
    if (ca && cb) {
      if (ca.a === 0 && cb.a === 0) return true; // two kinds of transparent
      return Math.abs(ca.r - cb.r) <= 6 && Math.abs(ca.g - cb.g) <= 6 && Math.abs(ca.b - cb.b) <= 6 && Math.abs(ca.a - cb.a) <= 0.05;
    }
    if (/radius/.test(prop)) return Math.abs(drawnRadius(a, mine) - drawnRadius(b, target)) <= 1.5;
    if (/^-?[\d.]+px$/.test(a) && /^-?[\d.]+px$/.test(b)) return Math.abs(parseFloat(a) - parseFloat(b)) <= 1;
    return a === b;
  }

  var LABELS = { 'border-top-left-radius': 'border-radius', 'border-top-width': 'border width', 'text-decoration-line': 'text-decoration', 'list-style-type': 'list-style' };
  function label(prop) { prop = prop.replace(/\?$/, ''); return LABELS[prop] || prop; }
  function ordinal(n) {
    var s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] || 'th';
    return n + s;
  }
  function px(n) { return Math.round(n); }

  /** "is 20px narrower, and sits 12px too low" - or null when the boxes agree. */
  function geometry(t, m) {
    var size = [], pos = [];
    var dw = m.w - t.w, dh = m.h - t.h, dx = m.x - t.x, dy = m.y - t.y;
    if (Math.abs(dw) > TOL) size.push(px(Math.abs(dw)) + 'px ' + (dw < 0 ? 'narrower' : 'wider'));
    if (Math.abs(dh) > TOL) size.push(px(Math.abs(dh)) + 'px ' + (dh < 0 ? 'shorter' : 'taller'));
    if (Math.abs(dx) > TOL) pos.push(px(Math.abs(dx)) + 'px too far ' + (dx < 0 ? 'left' : 'right'));
    if (Math.abs(dy) > TOL) pos.push(px(Math.abs(dy)) + 'px too ' + (dy < 0 ? 'high' : 'low'));
    if (!size.length && !pos.length) return null;
    var out = [];
    if (size.length) out.push('is ' + size.join(' and ') + ' (yours ' + px(m.w) + ' × ' + px(m.h) + 'px, the target ' + px(t.w) + ' × ' + px(t.h) + 'px)');
    if (pos.length) out.push('sits ' + pos.join(' and '));
    return out.join(', and ');
  }

  /**
   * Compare the target's measurements with yours. Each "fact" is one thing that must agree: how many
   * elements match a selector, one element's box, one property of one element.
   * Returns {score: 0-100 (100 only when every fact agrees), facts, ok, messages: [Markdown]}.
   */
  function compare(ch, target, mine) {
    var facts = 0, ok = 0, messages = [];
    ch.compare.forEach(function (item, i) {
      var t = (target[i] && target[i].els) || [], m = (mine[i] && mine[i].els) || [];
      var props = item.props || [];
      facts++;
      if (t.length === m.length) ok++;
      else if (!m.length) messages.push('Nothing in yours matches `' + item.sel + '`; the target has ' + (t.length === 1 ? 'one' : t.length) + '. Did the HTML change?');
      else messages.push('The target has ' + t.length + ' elements matching `' + item.sel + '`; yours has ' + m.length + '.');
      t.forEach(function (te, j) {
        var me = m[j];
        var who = '`' + item.sel + '`' + (t.length > 1 ? ' (the ' + ordinal(j + 1) + ')' : '');
        facts += 1 + props.length;
        if (!me) return; // already counted as missing
        var g = geometry(te, me);
        if (g) messages.push(who + ' ' + g + '.'); else ok++;
        props.forEach(function (p) {
          var a = me.props[p], b = te.props[p];
          if (sameValue(p, a, b, me, te)) { ok++; return; }
          if (/\?$/.test(p)) messages.push(who + (b === 'none' ? ' has a ' + label(p) + '; the target has none.' : ' has no ' + label(p) + '; the target has one.'));
          else messages.push(who + ' ' + label(p) + ': yours is `' + (a || '(nothing)') + '`, the target\'s is `' + b + '`.');
        });
      });
    });
    return { score: facts ? Math.floor(ok / facts * 100) : 0, facts: facts, ok: ok, messages: messages };
  }

  /** Measure both previews and compare them. Resolves with null if a preview did not answer within 6 s. */
  function measure(ch, target, mine) {
    var items = ch.compare.map(function (c) { return { sel: c.sel, props: c.props || [] }; });
    var both = Promise.all([target.ask({ type: 'layout', items: items }), mine.ask({ type: 'layout', items: items })]);
    var late = new Promise(function (resolve) { setTimeout(function () { resolve([null, null]); }, 6000); });
    return Promise.race([both, late]).then(function (r) {
      return r[0] && r[1] ? compare(ch, r[0], r[1]) : null;
    });
  }

  /* ---------- the list (#/recreate) ---------- */

  function list(root) {
    var d = done(), all = challenges();
    var matched = all.filter(function (c) { return d[c.id]; }).length;
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Recreate this'),
      h('p', null, 'Each challenge shows a finished design. Write the CSS until your preview matches it: the tool measures both pages ' +
        'and tells you in plain words what is still different. Look at them side by side, laid over each other, or as a difference ' +
        'picture where everything that matches turns black.')));
    root.appendChild(h('div', { class: 'card', style: { maxWidth: '640px', marginBottom: '16px' } },
      h('b', null, matched + ' of ' + all.length + ' designs matched'),
      h('div', { class: 'progress', style: { marginTop: '8px' } }, h('span', { style: { width: (all.length ? matched / all.length * 100 : 0) + '%' } }))));
    var cards = h('div', { class: 'cards' });
    root.appendChild(cards);
    all.forEach(function (c) {
      var thumbBox = h('div');
      cards.appendChild(h('a', { class: 'card rc-card' + (d[c.id] ? ' done' : ''), href: '#/recreate/' + c.id },
        thumbBox,
        h('div', { class: 'card-kicker' }, c.level + (d[c.id] ? ' · ✓ matched' : '')),
        h('h3', null, c.title),
        h('p', { class: 'muted', style: { margin: 0 } }, c.summary)));
      // created inside the page, so it stays registered (see the note in challengePage)
      U.preview.create(thumbBox, { height: 130, title: c.title + ' (the target)', className: 'rc-thumb', lazy: true }).render({ html: c.html, css: c.css });
    });
  }

  /* ---------- one challenge (#/recreate/<id>) ---------- */

  function challengePage(root, ch, view) {
    var all = challenges(), idx = all.indexOf(ch), next = all[idx + 1];
    var key = 'recreate.work.' + ch.id;
    var saved = U.store.get(key, null);
    var cur = { html: saved ? saved.html : ch.html, css: saved ? saved.css : ch.starter };

    root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/recreate' }, 'Recreate this'), ' › challenge ' + (idx + 1) + ' of ' + all.length));
    root.appendChild(h('div', { class: 'entry-head' }, h('h1', { style: { fontFamily: 'var(--sans)' } }, ch.title), h('span', { class: 'badge badge-accent' }, ch.level),
      done()[ch.id] ? h('span', { class: 'badge badge-ok' }, '✓ matched') : null));
    root.appendChild(h('p', { class: 'entry-summary' }, ch.summary));
    root.appendChild(h('div', { class: 'task', style: { maxWidth: '900px', margin: '6px 0 16px' } }, h('div', { class: 'task-title' }, 'What to look for'),
      h('div', { html: U.md(ch.brief + ' The HTML is given: write the CSS until your preview matches the target.') })));

    var look = h('div', { class: 'rc-look' });
    var work = h('div', { class: 'rc-work' });
    var layout = h('div', { class: 'rc-layout' }, look, work);
    root.appendChild(layout);
    U.layout.split(layout, { key: 'recreate', minLeft: 300, minRight: 340, label: 'Resize the designs and the code' });
    var fs = U.layout.full(layout, { kind: 'recreate', work: work, panes: true });

    // --- the two previews and the three views
    var mode = U.store.get('recreate.mode', 'side');
    if (!MODES.some(function (m) { return m[0] === mode; })) mode = 'side';
    var opacity = U.store.get('recreate.opacity', 50);
    var stage = h('div', { class: 'rc-stage' });
    var caption = h('p', { class: 'faint rc-caption' });
    var range = h('input', { type: 'range', min: 0, max: 100, value: opacity, 'aria-label': 'Opacity of the target' });
    var opacityBox = h('label', { class: 'rc-opacity' }, 'Target opacity', range);
    var modeBtns = h('div', { class: 'rc-modes', role: 'group', 'aria-label': 'How to compare' });
    MODES.forEach(function (m) {
      modeBtns.appendChild(h('button', { class: 'btn btn-small', type: 'button', 'data-mode': m[0], onclick: function () { setMode(m[0]); } }, m[1]));
    });
    modeBtns.appendChild(opacityBox);
    var targetSlot = h('div', { class: 'rc-slot rc-target' }, h('div', { class: 'preview-label rc-label' }, 'Target'));
    var mineSlot = h('div', { class: 'rc-slot rc-mine' }, h('div', { class: 'preview-label rc-label' }, h('span', { class: 'live-dot' }), 'Yours'));
    stage.appendChild(targetSlot);
    stage.appendChild(mineSlot);
    look.appendChild(modeBtns);
    look.appendChild(caption);
    look.appendChild(stage);
    // each preview goes straight into the page: creating a preview forgets the ones not in the page yet
    var checkSoon = U.debounce(function () { if (!trying) check(); }, 300);
    var tp = U.preview.create(targetSlot, { height: ch.height || 220, title: 'Target design', className: 'rc-preview', onReady: checkSoon });
    var mp = U.preview.create(mineSlot, {
      height: ch.height || 220, title: 'Your version', className: 'rc-preview',
      onReady: function () { checkSoon(); lintSoon(); }
    });

    function setMode(m) {
      mode = m;
      U.store.set('recreate.mode', m);
      stage.className = 'rc-stage rc-mode-' + m;
      U.$$('button', modeBtns).forEach(function (b) {
        var on = b.getAttribute('data-mode') === m;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      opacityBox.hidden = m !== 'overlay';
      caption.textContent = MODES.filter(function (x) { return x[0] === m; })[0][2];
    }
    function setOpacity(v) {
      stage.style.setProperty('--rc-opacity', String(v / 100));
      U.store.set('recreate.opacity', v);
    }
    range.addEventListener('input', function () { setOpacity(+range.value); });
    setOpacity(opacity);
    setMode(mode);
    // the comparison depends on the width: measure again whenever the stage changes size
    var lastWidth = 0;
    var ro = window.ResizeObserver ? new ResizeObserver(function () {
      var w = Math.round(stage.getBoundingClientRect().width);
      if (w !== lastWidth) { lastWidth = w; checkSoon(); }
    }) : null;
    if (ro) ro.observe(stage);
    view._ro = ro;

    // --- the editors: CSS first, the given HTML second
    var tabs = h('div', { class: 'ed-tabs', role: 'tablist' });
    var eds = {};
    var edBox = h('div');
    // in the page before the editors exist: CodeMirror measures itself when it is created
    work.appendChild(h('div', { class: 'row' }, tabs, h('span', { class: 'spacer' }), fs.btn));
    work.appendChild(edBox);
    ['css', 'html'].forEach(function (m, i) {
      tabs.appendChild(h('button', { class: 'btn btn-small' + (i ? '' : ' active'), type: 'button', role: 'tab', 'data-mode': m, onclick: function () { showEditor(m); } }, U.editor.LABELS[m]));
      var wrap = h('div', { hidden: i > 0 });
      edBox.appendChild(wrap);
      eds[m] = U.editor.create(wrap, {
        mode: m, value: cur[m], height: U.layout.editorHeight('recreate', 300), lint: m === 'css',
        onChange: changed, onTry: function (text) { tryRender(m, text); }
      });
      eds[m].wrap = wrap;
    });
    work.appendChild(U.layout.grip({ kind: 'recreate', editors: [eds.css, eds.html], def: 300 }).el);
    function showEditor(m) {
      U.$$('button', tabs).forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-mode') === m); });
      ['css', 'html'].forEach(function (k) { eds[k].wrap.hidden = k !== m; });
      eds[m].refresh();
    }

    function snapshot() { return { html: eds.html.get(), css: eds.css.get() }; }
    var renderSoon = U.debounce(function () { mp.render(snapshot()); }, 250);
    function changed() { U.store.set(key, snapshot()); renderSoon(); }
    var trying = false;
    function tryRender(kind, text) {
      if (text === null) { trying = false; mp.render(snapshot()); return; }
      trying = true;
      var s = snapshot();
      s[kind] = text;
      mp.render(s);
    }
    var lintSoon = U.debounce(function () {
      if (trying || !U.editorAssist) return;
      var css = eds.css.get();
      U.editorAssist.lintCss(mp, css).then(function (l) { if (!trying && eds.css.get() === css) eds.css.setLint(l); });
    }, 500);

    // --- how close: score, differences, hints, solution
    var scoreEl = h('b', { class: 'rc-score', 'data-score': '' }, '…');
    var bar = h('span', { style: { width: '0%' } });
    var diffs = h('ul', { class: 'rc-diffs', 'aria-live': 'polite' });
    var status = h('div');
    var hintBox = h('div');
    var result = h('div', { class: 'card rc-result' },
      h('div', { class: 'row' }, h('span', null, 'How close you are:'), scoreEl, h('span', { class: 'spacer' }),
        h('button', { class: 'btn btn-small', type: 'button', onclick: function () { check(); } }, 'Check again')),
      h('div', { class: 'progress', style: { marginTop: '8px' } }, bar),
      status, diffs);
    work.appendChild(result);

    var hintsShown = 0;
    var hintBtn = h('button', { class: 'btn btn-small', type: 'button' }, 'Hint');
    hintBtn.addEventListener('click', function () {
      if (hintsShown >= ch.hints.length) return;
      hintBox.appendChild(U.enhance(U.callout('tip', 'Hint ' + (hintsShown + 1), U.md(ch.hints[hintsShown]))));
      hintsShown++;
      if (hintsShown >= ch.hints.length) hintBtn.disabled = true;
    });
    var solBtn = h('button', { class: 'btn btn-small btn-ghost', type: 'button' }, 'Show the target\'s CSS');
    solBtn.addEventListener('click', function () {
      if (!solBtn.getAttribute('data-armed')) { solBtn.setAttribute('data-armed', '1'); solBtn.textContent = 'Click again to replace your CSS with it'; return; }
      solBtn.removeAttribute('data-armed');
      solBtn.textContent = 'Show the target\'s CSS';
      set(ch.css).then(check);
    });
    work.appendChild(h('div', { class: 'row' }, hintBtn,
      h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: function () { set(ch.starter).then(check); } }, 'Start over'),
      solBtn));
    work.appendChild(hintBox);
    if (ch.related && ch.related.length) {
      work.appendChild(h('div', { class: 'related', style: { marginTop: '6px' } }, ch.related.map(function (r) {
        var m = /^(\w+):(.+)$/.exec(r);
        return h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) });
      })));
    }
    work.appendChild(h('div', { class: 'row', style: { marginTop: '8px' } },
      h('a', { class: 'btn', href: '#/recreate' }, '← All designs'), h('span', { class: 'spacer' }),
      next ? h('a', { class: 'btn btn-primary', href: '#/recreate/' + next.id }, 'Next: ' + next.title + ' →') : null));

    function show(r) {
      result.setAttribute('data-result', r.score === 100 ? 'pass' : 'fail');
      scoreEl.textContent = r.score + '%';
      scoreEl.setAttribute('data-score', r.score);
      bar.style.width = r.score + '%';
      diffs.innerHTML = '';
      status.innerHTML = '';
      if (r.score === 100) {
        markDone(ch.id);
        status.appendChild(h('div', { class: 'celebrate', style: { marginTop: '10px' } }, '🎉 It matches!' + (next ? ' Next: ' + next.title : ' That was the last design.')));
        return;
      }
      status.appendChild(h('p', { class: 'faint', style: { margin: '10px 0 4px' } }, r.messages.length === 1 ? 'One difference is left:' : r.messages.length + ' differences are left:'));
      r.messages.slice(0, 6).forEach(function (msg) { diffs.appendChild(h('li', { html: U.md(msg).replace(/^<p>|<\/p>$/g, '') })); });
      if (r.messages.length > 6) diffs.appendChild(h('li', { class: 'faint' }, '… and ' + (r.messages.length - 6) + ' more. Fix these first: one change often fixes several.'));
    }

    // checks never overlap; one asked for during a check runs straight after it
    var running = null, again = false;
    function check() {
      if (running) { again = true; return running; }
      running = attempt(0).then(function (r) {
        if (r) show(r);
        else {
          status.innerHTML = '';
          status.appendChild(h('p', { class: 'faint' }, 'The previews did not answer this time. Click "Check again".'));
        }
        var rerun = again;
        again = false;
        running = null;
        return rerun ? check() : r;
      });
      return running;
    }
    function attempt(n) {
      return measure(ch, tp, mp).then(function (r) {
        if (r || n >= 3) return r;
        return new Promise(function (res) { setTimeout(res, 200); }).then(function () { return attempt(n + 1); });
      }, function () { return null; });
    }

    /** Replace your CSS (and put the given HTML back); resolves once your preview shows it. */
    function set(css) {
      eds.html.set(ch.html, true);
      eds.css.set(css, true);
      U.store.set(key, { html: ch.html, css: css });
      return mp.render({ html: ch.html, css: css });
    }

    tp.render({ html: ch.html, css: ch.css });
    mp.render(cur);
    U.currentRecreate = { challenge: ch, set: set, check: check, editors: eds, target: tp, mine: mp };
  }

  U.views.recreate = {
    render: function (root, params) {
      var ch = params[0] && U.find('recreate', params[0]);
      if (ch) challengePage(root, ch, this); else list(root);
    },
    destroy: function () {
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
      U.currentRecreate = null;
    }
  };
  U.recreateTools = { compare: compare, measure: measure };
  U.route('recreate', U.views.recreate);
})(window.UILT);
