/*
 * layout.js - room for the code: the divider between two columns, the grip under an editor, and
 * full screen (the browser's too). The React Learning Tool's js/layout.js, adapted: an editor here
 * sits over an output panel, not a live preview, and an explainer page has several two-column blocks.
 *
 *   U.layout.split(layoutEl, {key, def, minLeft, minRight, label})
 *       a divider between the two columns of a grid (.lesson-layout, .pg, .viz-body, .xp-body). Drag
 *       it, or focus it and press the arrow keys (Shift: further), Home or End; a double-click puts it
 *       back at def (percent). Remembered as "jclt.layout.split.<key>"; every divider of that key on
 *       the page moves with it (an explainer has one per experiment). CSS shows it only where the
 *       columns sit side by side.
 *   U.layout.grip({kind, editors, output, def})
 *       a grip to place right under the editor(s): drag it, or the up and down arrows, to make the
 *       editor taller or shorter; a double-click puts back def (px). Remembered as
 *       "jclt.layout.editor.<kind>". In full screen it trades height between the editor and its output
 *       panel (output: {el, setHeight(px | null)}, js/output.js) instead, remembered as
 *       "jclt.layout.share.<kind>" (the editor's share).
 *   U.layout.editorHeight(kind, def)   the height remembered for that kind of editor, else def
 *   U.layout.full(layoutEl, {kind, root, text, work}) -> {btn, hideBtn}
 *       a Full screen button. root (layoutEl unless given) then covers the whole window, over the top
 *       bar, and the browser is asked for its own full screen (refused, the window's stays). When the
 *       browser's full screen is already on (the top bar's button), it is not asked, and leaving keeps it. With
 *       text and work (the two panes of a lesson, kata or step), each pane scrolls on its own, the
 *       editor and its output fill the code's pane, and hideBtn hides the text. With work alone (the
 *       Playground's editor column), the editor fills that column. Esc leaves, once an open
 *       autocomplete list or dialog has closed. Full screen stays for the next page of the same kind
 *       (Next lesson) and ends on any other.
 *   U.layout.refresh(scope)   something in scope came on show (a tab): fit it, redraw its editors
 *   U.layout.leave()          leave full screen
 *   U.layout.beforeRender(), afterRender()   called by the router (core.js) around each page
 *
 * For the tests: JCLT.layout.state() is null or {kind, textHidden, browser}.
 */
(function (U) {
  'use strict';
  var h = U.h;
  var ED_MIN = 120, ED_MAX = 1000, OUT_MIN = 120, SHARE = 0.65;
  var ICON_IN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  var ICON_OUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
  var narrow = window.matchMedia ? window.matchMedia('(max-width: 760px)') : null;   // too narrow for two panes
  var WHOLE_PAGE = { explain: true, visualize: true };   // full screen is the whole page, scrolling as one

  var splits = [], grips = [];
  var state = null;    // in full screen: {kind, area, textHidden, browser, own}
  var carry = null;    // the kind that was full when the page changed
  var asked = false;   // the browser's full screen was asked for and has not answered yet
  var inerted = [];

  function noop() {}
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function shown(el) { return !!el && el.getClientRects().length > 0; }
  /** A remembered number, clamped; null when there is none (a restored backup may hold anything). */
  function remembered(key, lo, hi) {
    var v = U.store.get(key, null);
    return typeof v === 'number' && isFinite(v) ? clamp(v, lo, hi) : null;
  }
  /** CodeMirror measures itself only when the window resizes: after any other change of size, redraw it. */
  function redraw(scope) {
    [].forEach.call((scope || document).querySelectorAll('.CodeMirror'), function (el) {
      if (el.CodeMirror && shown(el)) el.CodeMirror.refresh();
    });
  }
  var frames = {};
  function soon(name, fn) {   // once per animation frame, whatever asks how often
    if (frames[name]) return;
    frames[name] = requestAnimationFrame(function () { frames[name] = null; fn(); });
  }
  function settle() {   // fit and redraw everything on show, once the browser has laid it out
    soon('settle', function () { if (state) fit(); redraw(document.getElementById('view')); });
  }
  // while a divider or a grip is dragged: no text selected, the pointer's shape everywhere (css/app.css)
  function dragging(el, axis) {
    if (axis) document.documentElement.setAttribute('data-drag', axis);
    else document.documentElement.removeAttribute('data-drag');
    el.classList.toggle('dragging', !!axis);
  }
  function press(el, e) {
    if (e.button !== 0) return false;
    e.preventDefault();
    el.focus({ preventScroll: true });
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* the drag still follows the pointer while it is over the page */ }
    return true;
  }

  /* ---------- the divider between two columns ---------- */

  function split(layout, o) {
    var key = 'layout.split.' + o.key;
    var el = h('div', { class: 'splitter', role: 'separator', tabindex: '0', 'aria-orientation': 'vertical',
      'aria-label': o.label || 'Resize the two columns', title: 'Drag to resize · double-click puts it back' },
      h('span', { class: 'splitter-pill', 'aria-hidden': 'true' }));
    layout.insertBefore(el, layout.children[1] || null);
    layout.classList.add('split');
    layout.style.setProperty('--split-min-l', o.minLeft + 'px');
    layout.style.setProperty('--split-min-r', o.minRight + 'px');
    var pct = remembered(key, 1, 99);
    if (pct === null) pct = o.def;

    /** The least and most percent that leave each column its least width ([1, 99] while it is not laid out). */
    function bounds() {
      var W = layout.clientWidth, g = el.offsetWidth;
      if (!W || !g) return [1, 99];
      var lo = (o.minLeft + g / 2) / W * 100, hi = 100 - (o.minRight + g / 2) / W * 100;
      return hi > lo ? [lo, hi] : [lo, lo];
    }
    function aria() {
      var b = bounds();
      el.setAttribute('aria-valuemin', String(Math.round(b[0])));
      el.setAttribute('aria-valuemax', String(Math.round(b[1])));
      el.setAttribute('aria-valuenow', String(Math.round(pct * 10) / 10));
      el.setAttribute('aria-valuetext', 'the left column takes ' + Math.round(pct) + '%');
    }
    function apply(v) {
      var b = bounds();
      pct = Math.round(clamp(v, b[0], b[1]) * 100) / 100;
      layout.style.setProperty('--split', pct + '%');
      aria();
    }
    function set(v, save) {
      apply(v);
      // the other dividers of this key on the page (an explainer's experiments) move with this one
      splits.forEach(function (x) { if (x !== s && x.key === o.key) x.apply(pct); });
      if (save) U.store.set(key, Math.round(pct * 10) / 10);
    }
    function done() { if (state) fit(); redraw(layout.parentNode); }
    function reset() {
      U.store.del(key);
      apply(o.def);
      splits.forEach(function (x) { if (x !== s && x.key === o.key) x.apply(x.def); });
      done();
    }

    var drag = null;
    el.addEventListener('pointerdown', function (e) {
      if (!press(el, e)) return;
      drag = { id: e.pointerId, x: e.clientX, pct: pct, moved: false };
      dragging(el, 'x');
    });
    el.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved && !dx) return;
      drag.moved = true;
      set(drag.pct + dx / (layout.clientWidth || 1) * 100, false);
      soon('split', function () { redraw(layout.parentNode); });
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var moved = drag.moved;
      drag = null;
      dragging(el, null);
      if (moved) { set(pct, true); done(); }   // a click (half a double-click) is not a move
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
    el.addEventListener('keydown', function (e) {
      var b = bounds(), step = e.shiftKey ? 10 : 2, v = null;
      if (e.key === 'ArrowLeft') v = pct - step;
      else if (e.key === 'ArrowRight') v = pct + step;
      else if (e.key === 'Home') v = b[0];
      else if (e.key === 'End') v = b[1];
      if (v === null) return;
      e.preventDefault();   // Visualize's step keys leave a key the divider took alone
      set(v, true);
      done();
    });
    el.addEventListener('dblclick', reset);
    el.addEventListener('focus', aria);
    apply(pct);
    var s = { el: el, key: o.key, def: o.def, layout: layout, aria: aria, apply: apply,
      end: function () { if (drag) { drag = null; dragging(el, null); } } };
    splits.push(s);
    return { el: el, set: function (v) { set(v, true); done(); }, reset: reset };
  }

  /* ---------- the grip under an editor ---------- */

  function editorHeight(kind, def) {
    var v = remembered('layout.editor.' + kind, ED_MIN, ED_MAX);
    return v === null ? def : Math.round(v);
  }

  function grip(o) {
    var key = 'layout.editor.' + o.kind, shareKey = 'layout.share.' + o.kind;
    var el = h('div', { class: 'grip', role: 'separator', tabindex: '0', 'aria-orientation': 'horizontal',
      'aria-label': 'Resize the editor', title: 'Drag to make the editor taller or shorter · double-click puts it back' });
    var g = {
      el: el, kind: o.kind, editors: o.editors, output: o.output || null, def: o.def,
      editor: function () {   // the editor on show
        for (var i = 0; i < g.editors.length; i++) if (shown(g.editors[i].el)) return g.editors[i];
        return null;
      },
      setEditors: function (px) { g.editors.forEach(function (ed) { ed.setHeight(px); }); },
      restore: function () {   // back to the page's own heights, after full screen
        g.setEditors(editorHeight(g.kind, g.def));
        if (g.output) g.output.setHeight(null);
      }
    };
    /** In full screen the editor and the output panel share the height of the code's pane. */
    function trading() { return !!(state && state.area && state.area.work && g.output && state.area.work.contains(el)); }
    function edH() { var ed = g.editor(); return ed ? ed.height() : editorHeight(g.kind, g.def); }
    function aria() {
      var t = trading(), ed = edH();
      el.setAttribute('aria-valuemin', String(ED_MIN));
      el.setAttribute('aria-valuemax', String(t ? Math.round(ed + g.output.el.offsetHeight - OUT_MIN) : ED_MAX));
      el.setAttribute('aria-valuenow', String(ed));
      el.setAttribute('aria-valuetext', 'the editor is ' + ed + ' pixels tall');
    }
    function resize(want, sum, save) {
      if (sum) {
        var ed = Math.round(clamp(want, ED_MIN, Math.max(ED_MIN, sum - OUT_MIN)));
        g.setEditors(ed);
        g.output.setHeight(sum - ed);
        if (save) U.store.set(shareKey, Math.round(ed / sum * 1000) / 1000);
      } else {
        var px = Math.round(clamp(want, ED_MIN, ED_MAX));
        g.setEditors(px);
        if (save) {
          U.store.set(key, px);
          grips.forEach(function (x) { if (x !== g && x.kind === g.kind && !x.trading()) x.setEditors(px); });   // the page's other editors of this kind
        }
      }
      aria();
    }
    function sumNow() { return trading() ? edH() + g.output.el.offsetHeight : 0; }

    var drag = null;
    el.addEventListener('pointerdown', function (e) {
      if (!press(el, e)) return;
      var ed = edH();
      drag = { id: e.pointerId, y: e.clientY, ed: ed, sum: sumNow(), want: ed, moved: false };
      dragging(el, 'y');
    });
    el.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dy = e.clientY - drag.y;
      if (!drag.moved && !dy) return;
      drag.moved = true;
      drag.want = drag.ed + dy;
      resize(drag.want, drag.sum, false);
      soon('grip', function () { redraw(el.parentNode); });
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag;
      drag = null;
      dragging(el, null);
      if (d.moved) { resize(d.want, d.sum, true); redraw(el.parentNode); }
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
    el.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      resize(edH() + dir * (e.shiftKey ? 80 : 20), sumNow(), true);
      redraw(el.parentNode);
    });
    el.addEventListener('dblclick', function () {
      if (trading()) { U.store.del(shareKey); fit(); }
      else {
        U.store.del(key);
        grips.forEach(function (x) { if (x.kind === g.kind && !x.trading()) x.setEditors(x.def); });
      }
      redraw(el.parentNode);
      aria();
    });
    el.addEventListener('focus', aria);
    g.trading = trading;
    g.end = function () { if (drag) { drag = null; dragging(el, null); } };
    grips.push(g);
    return { el: el, def: o.def };
  }

  /* ---------- full screen ---------- */

  function full(layout, o) {
    var area = { kind: o.kind, layout: layout, root: o.root || layout, text: o.text || null, work: o.work || null };
    area.btn = h('button', { class: 'btn btn-small btn-ghost full-btn', type: 'button', 'aria-pressed': 'false' });
    area.btn.addEventListener('click', function () {
      if (state && state.area === area) leave(); else enter(area);
    });
    if (area.text) {
      if (!area.text.id) area.text.id = 'pane-text';
      area.hideBtn = h('button', { class: 'btn btn-small btn-ghost hide-text-btn', type: 'button', 'aria-pressed': 'false', 'aria-controls': area.text.id });
      area.hideBtn.addEventListener('click', function () {
        if (!state || state.area !== area) return;
        state.textHidden = !state.textHidden;
        paint(area);
        fit();
        redraw(area.root);
      });
    }
    paint(area);
    if (state && !state.area && carry === area.kind) activate(area);   // Next lesson, in full screen
    return { btn: area.btn, hideBtn: area.hideBtn || null };
  }

  function paint(area) {
    var on = !!(state && state.area === area);
    area.btn.setAttribute('aria-pressed', String(on));
    area.btn.title = on ? 'Leave full screen (Esc)' : 'Full screen: across the whole window (Esc leaves)';
    area.btn.innerHTML = (on ? ICON_OUT : ICON_IN) + '<span>' + (on ? 'Exit full screen' : 'Full screen') + '</span>';
    var hidden = on && state.textHidden;
    area.layout.classList.toggle('text-hidden', hidden);
    if (area.hideBtn) {
      area.hideBtn.setAttribute('aria-pressed', String(hidden));
      area.hideBtn.textContent = hidden ? '▶ Show text' : '◀ Hide text';
      area.hideBtn.title = hidden ? 'Bring the text back beside the code' : 'Give the code the whole width';
    }
  }

  function enter(area) {
    if (narrow && narrow.matches) return;
    state = { kind: area.kind, area: null, textHidden: false, browser: false, own: false };
    document.documentElement.setAttribute('data-full', area.kind);
    activate(area);
    askBrowser();   // inside the click, so the browser counts it as the user's
    fit();
    redraw(area.root);
  }

  function activate(area) {
    state.area = area;
    area.root.classList.add('fs-root');
    area.layout.classList.add('is-full');
    // what the layer covers cannot be reached with Tab: the top bar, and the rest of the page
    var view = document.getElementById('view'), cover = [document.querySelector('.topbar')];
    for (var n = area.root; n !== view && n.parentNode; n = n.parentNode) {
      [].forEach.call(n.parentNode.children, function (c) { if (c !== n) cover.push(c); });
      if (n.parentNode === view) break;
    }
    cover.forEach(function (c) { if (c && !c.inert) { c.inert = true; inerted.push(c); } });
    paint(area);
  }

  function leave() {
    if (!state) return;
    var area = state.area, own = state.own;
    state = null;
    document.documentElement.removeAttribute('data-full');
    inerted.forEach(function (c) { c.inert = false; });
    inerted = [];
    if (area) {
      area.root.classList.remove('fs-root');
      area.layout.classList.remove('is-full');
      grips.forEach(function (g) { if (area.root.contains(g.el)) g.restore(); });
      paint(area);
      redraw(area.root);
    }
    splits.forEach(function (s) { s.aria(); });
    if (own) exitBrowser();
    else unlockEsc();   // the top bar's full screen was on first: it stays
  }

  function askBrowser() {
    var de = document.documentElement;
    if (!de.requestFullscreen || document.fullscreenElement) return;
    asked = true;
    if (state) state.own = true;   // this full screen asked for the browser's, so leaving it gives that back
    try {
      var p = de.requestFullscreen({ navigationUI: 'hide' });
      if (p && p.then) p.then(null, function () { asked = false; });   // refused (a policy, a test browser): the window's full screen stays
    } catch (e) { asked = false; }
  }

  function exitBrowser() {
    unlockEsc();
    if (!document.fullscreenElement || !document.exitFullscreen) return;
    try {
      var p = document.exitFullscreen();
      if (p && p.then) p.then(null, noop);
    } catch (e) { /* already out */ }
  }

  // In the browser's full screen, Chrome takes Esc for itself. Keyboard Lock hands it to the page, so an
  // open autocomplete list closes first; holding Esc still leaves.
  function lockEsc() {
    var k = navigator.keyboard;
    if (!k || !k.lock) return;
    try {
      var p = k.lock(['Escape']);
      if (p && p.then) p.then(null, noop);
    } catch (e) { /* not offered here: Esc leaves at once */ }
  }
  function unlockEsc() {
    var k = navigator.keyboard;
    if (k && k.unlock) { try { k.unlock(); } catch (e) { /* nothing locked */ } }
  }

  /**
   * Full screen, a lesson, kata or step: the editor and its output panel fill the height of the code's
   * pane (the editor's share as remembered); what follows them (the checklist, hints) is a scroll away.
   * The Playground: the editor fills its column, above what follows it there (the Input box).
   */
  function fit() {
    var area = state && state.area, pane = area && area.work;
    if (!pane) return;
    var cs = getComputedStyle(pane), pr = pane.getBoundingClientRect();
    var visible = pane.clientHeight - parseFloat(cs.paddingBottom || 0);
    grips.forEach(function (g) {
      var ed = g.editor();
      if (!ed || !pane.contains(g.el)) return;   // in a tab not on show: fitted when it comes on show
      var box = ed.el.getBoundingClientRect();
      var top = box.top - pr.top + pane.scrollTop, border = box.height - ed.height();
      if (!g.output) {
        var last = null;
        [].forEach.call(pane.children, function (c) { if (shown(c)) last = c; });
        var tail = last && last !== ed.el ? Math.max(0, last.getBoundingClientRect().bottom - box.bottom) : 0;
        g.setEditors(Math.max(ED_MIN, Math.floor(visible - top - border - tail)));
        return;
      }
      var between = g.output.el.getBoundingClientRect().top - box.bottom;   // the grip, the Input box, the Run bar
      var avail = Math.floor(visible - top - border - between);
      var share = remembered('layout.share.' + g.kind, 0.05, 0.95);
      var e = Math.round(clamp(avail * (share === null ? SHARE : share), ED_MIN, Math.max(ED_MIN, avail - OUT_MIN)));
      g.setEditors(e);
      g.output.setHeight(Math.max(OUT_MIN, avail - e));
    });
  }

  /* ---------- once, for the whole app ---------- */

  // Esc leaves full screen, unless something open above it takes the Esc: an autocomplete list (CodeMirror's,
  // on <body>) or a dialog (the search, where your Python runs). The capture phase sees it before CodeMirror,
  // which claims every Esc.
  document.addEventListener('keydown', function (e) {
    if (!state || e.key !== 'Escape' || e.isComposing) return;
    if (document.querySelector('dialog[open], .CodeMirror-hints')) return;
    leave();
  }, true);
  document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement) {
      if (state) { state.browser = true; lockEsc(); }
      else if (asked) exitBrowser();   // left before the browser answered
      asked = false;
    } else {
      unlockEsc();
      if (state && state.browser) leave();   // the browser's own way out (its Esc, its menu)
    }
  });
  window.addEventListener('resize', function () {
    soon('resize', function () { if (state) fit(); splits.forEach(function (s) { s.aria(); }); });
  });
  if (narrow) {
    var onNarrow = function () { if (narrow.matches) leave(); };
    if (narrow.addEventListener) narrow.addEventListener('change', onNarrow); else if (narrow.addListener) narrow.addListener(onNarrow);
  }

  U.layout = {
    split: split,
    grip: grip,
    editorHeight: editorHeight,
    full: full,
    leave: leave,
    refresh: function (scope) { if (state) fit(); redraw(scope); },
    state: function () { return state && { kind: state.kind, textHidden: !!state.textHidden, browser: !!state.browser }; },
    /** Before a page is drawn: forget the old page's dividers and grips; full screen waits to see the new page. */
    beforeRender: function () {
      splits.concat(grips).forEach(function (x) { x.end(); });
      splits = [];
      grips = [];
      carry = state ? state.kind : null;
      if (state) {
        inerted.forEach(function (c) { c.inert = false; });
        inerted = [];
        state.area = null;
      }
    },
    /** After: a page of the same kind keeps full screen (U.layout.full took it over); any other leaves it. */
    afterRender: function () {
      var kind = carry;
      carry = null;
      if (!state) return;
      if (!state.area) { leave(); return; }
      if (WHOLE_PAGE[kind]) document.getElementById('view').scrollTop = 0;   // the router's scrollTo cannot reach the layer
      settle();
    }
  };
})(window.JCLT);
