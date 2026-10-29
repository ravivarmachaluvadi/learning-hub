/*
 * views/common.js - building blocks shared by the reference pages:
 * the filterable sidebar, value chips with descriptions, and the tips / mistakes / related footer.
 */
(function (U) {
  'use strict';
  var h = U.h;

  /**
   * Filterable, grouped list of entries.
   * opts: {items, groupOf(item), order: [group names], label(item), sub(item), href(item),
   *        isActive(item), placeholder, toggleLabel, ariaLabel, match(item, q)}
   */
  U.refSidebar = function (opts) {
    var filter = h('input', { class: 'input ref-filter', type: 'search', placeholder: opts.placeholder || 'Filter…', 'aria-label': opts.placeholder || 'Filter' });
    var list = h('nav', { class: 'ref-list', 'aria-label': opts.ariaLabel || 'Entries' });
    var side = h('aside', { class: 'ref-side' },
      h('div', { class: 'ref-side-head' },
        h('button', { class: 'btn btn-small ref-toggle', type: 'button', onclick: function () { side.classList.toggle('open'); } }, opts.toggleLabel || 'Browse the list'),
        filter),
      list);
    function matches(item, q) {
      if (!q) return true;
      if (opts.match) return opts.match(item, q);
      return (opts.label(item) + ' ' + (opts.sub ? opts.sub(item) : '')).toLowerCase().indexOf(q) >= 0;
    }
    function draw() {
      var q = filter.value.trim().toLowerCase();
      list.innerHTML = '';
      var groups = {};
      opts.items.forEach(function (it) {
        if (!matches(it, q)) return;
        var g = opts.groupOf(it);
        (groups[g] = groups[g] || []).push(it);
      });
      var order = (opts.order || []).concat(Object.keys(groups).filter(function (g) { return (opts.order || []).indexOf(g) < 0; }));
      var any = false;
      order.forEach(function (g) {
        if (!groups[g]) return;
        any = true;
        list.appendChild(h('div', { class: 'ref-group-title' }, g));
        groups[g].forEach(function (it) {
          list.appendChild(h('a', {
            class: 'ref-item' + (opts.isActive(it) ? ' active' : ''),
            href: opts.href(it),
            title: opts.sub ? opts.sub(it) : null
          }, h('span', { class: 'mono' }, opts.label(it)), opts.sub ? h('small', null, opts.sub(it)) : null));
        });
      });
      if (!any) list.appendChild(h('div', { class: 'console-empty' }, 'Nothing matches "' + filter.value + '".'));
    }
    filter.addEventListener('input', draw);
    draw();
    setTimeout(function () {
      var act = list.querySelector('.active');
      if (act && act.scrollIntoView && side.offsetParent) {
        var lt = list.getBoundingClientRect(), at = act.getBoundingClientRect();
        if (at.top < lt.top || at.bottom > lt.bottom) list.scrollTop += at.top - lt.top - lt.height / 3;
      }
    }, 0);
    return side;
  };

  /**
   * A row of value chips with a description box underneath.
   * opts: {values: [{value, desc, label, example}], get(), set(value), hover(value|null),
   *        none: {label, desc} (adds an "unset" chip; its value is undefined), name}
   * Returns {el, sync()} - call sync() after the value changes elsewhere.
   */
  U.chipGroup = function (opts) {
    var chips = h('div', { class: 'chips', role: 'group', 'aria-label': opts.name || 'Values' });
    var desc = h('div', { class: 'value-desc', 'aria-live': 'polite' });
    var all = (opts.none ? [{ value: undefined, label: opts.none.label || '(not set)', desc: opts.none.desc || 'Not set: the browser uses its default.', none: true }] : []).concat(opts.values);
    var hovering = null;

    function descFor(v) {
      for (var i = 0; i < all.length; i++) if (all[i].value === v) return all[i];
      return null;
    }
    function show(item, isHover) {
      desc.classList.toggle('is-hover', !!isHover);
      if (!item) { desc.innerHTML = '<span class="faint">A custom value is set.</span>'; return; }
      var text = U.md(item.desc).replace(/^<p>|<\/p>$/g, '');
      desc.innerHTML = (isHover ? '<b>Preview: </b>' : '') + (item.none ? text : '<code>' + U.esc(item.label || item.value) + '</code> - ' + text);
    }
    all.forEach(function (item) {
      var b = h('button', {
        type: 'button',
        class: 'chip' + (item.none ? ' chip-none' : '') + (item.example ? ' chip-example' : ''),
        'data-value': item.none ? '' : item.value,
        title: item.example ? 'Example value' : null
      }, item.label || item.value);
      function enter() { hovering = item; show(item, true); if (opts.hover) opts.hover(item.value, true); }
      function leave() {
        if (hovering !== item) return;
        hovering = null;
        show(descFor(opts.get()), false);
        if (opts.hover) opts.hover(null, false);
      }
      b.addEventListener('mouseenter', enter);
      b.addEventListener('focus', enter);
      b.addEventListener('mouseleave', leave);
      b.addEventListener('blur', leave);
      b.addEventListener('click', function () {
        hovering = null;
        opts.set(item.value);
        sync();
        if (opts.hover) opts.hover(null, false);
      });
      item.button = b;
      chips.appendChild(b);
    });
    function sync() {
      var v = opts.get();
      all.forEach(function (item) {
        var on = item.value === v;
        item.button.classList.toggle('selected', on);
        item.button.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (!hovering) show(descFor(v), false);
    }
    sync();
    return { el: h('div', null, chips, desc), sync: sync, chips: chips };
  };

  /** A labelled on/off switch. */
  U.switchControl = function (label, checked, onChange) {
    var input = h('input', { type: 'checkbox' });
    input.checked = !!checked;
    input.addEventListener('change', function () { onChange(input.checked); });
    var el = h('label', { class: 'switch' }, input, h('span', { class: 'switch-track', 'aria-hidden': 'true' }), h('span', null, label));
    return { el: el, input: input, set: function (v) { input.checked = !!v; } };
  };

  /** Footer with tips, common mistakes, related entries and an external reference link. */
  U.entryFooter = function (entry, kind, mdnUrl) {
    var parts = [];
    if (entry.tips && entry.tips.length) {
      parts.push(U.callout('tip', 'Tips', '<ul class="list-tidy">' + entry.tips.map(function (t) { return '<li>' + U.md(t).replace(/^<p>|<\/p>$/g, '') + '</li>'; }).join('') + '</ul>'));
    }
    if (entry.mistakes && entry.mistakes.length) {
      parts.push(U.callout('warn', 'Common mistakes', '<ul class="list-tidy">' + entry.mistakes.map(function (t) { return '<li>' + U.md(t).replace(/^<p>|<\/p>$/g, '') + '</li>'; }).join('') + '</ul>'));
    }
    var rel = (entry.related || []).map(function (r) {
      var k = kind, id = r;
      var m = /^(\w+):(.+)$/.exec(r);
      if (m) { k = m[1]; id = m[2]; }
      return h('a', { href: U.linkFor(k, id), html: U.labelFor(k, id) });
    });
    if (rel.length || mdnUrl) {
      parts.push(h('div', { class: 'card' },
        rel.length ? h('div', null, h('h3', null, 'Related'), h('div', { class: 'related' }, rel)) : null,
        mdnUrl ? h('p', { class: 'faint', style: { margin: rel.length ? '12px 0 0' : '0' } },
          'Full reference: ', h('a', { href: mdnUrl, target: '_blank', rel: 'noopener' }, 'MDN Web Docs ↗'),
          ' (the standard documentation, written by browser makers).') : null));
    }
    return h('div', { class: 'stack', style: { marginTop: '20px' } }, parts);
  };

  /** Escape a value for use inside a double-quoted HTML attribute. */
  U.escAttr = function (v) { return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); };
})(window.UILT);
