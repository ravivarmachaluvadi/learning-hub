/*
 * Machine coding, track 5 (Performance and internals): Virtualised list and Deferred search. Both are
 * React-first problems, with no plain-JS page in 11-UI-Practice: they say `plainjs: null`, and
 * `plainjsNote` says how the same thing is done without React. The problem shape is described at the
 * top of data/builds.js. Each runs inside <StrictMode> (`strict: true`), as the track's challenges do;
 * the checks count renders with t.renders(), which counts commits, so StrictMode does not double them.
 *
 * The previews are about 200 px tall, so the list boxes are small (five rows) to keep every row the
 * checks look at on the screen, where document.elementFromPoint can find it.
 */
(function (U) {
  var B = U.data.builds = U.data.builds || [];

  B.push(
    {
      id: 'virtual-list', track: 'performance', level: 'Hard', minutes: 45, plainjs: null, strict: true,
      title: 'Virtualised list',
      summary: '10,000 rows with only the visible few in the DOM: "Go to row", a click to select, and arrow keys that move the selection and scroll just enough to keep it in view. The selection survives scrolling away and back.',
      keywords: ['virtual list', 'virtualised list', 'virtualized list', 'virtual scroll', 'windowing', 'long list', 'listbox', 'keyboard navigation', 'scroll into view', 'go to row', 'react-window', 'tanstack virtual'],
      plainjsNote: 'Without React, a virtualised list is a scroll container holding one tall spacer (rows × row height), and a `scroll` listener that works out the first visible row, `Math.floor(scrollTop / rowHeight)`, then moves a small pool of row elements into place and gives each its text. The selection is an index kept in a variable, never a class on an element, because the element showing row 5,000 now will show row 5,012 after a scroll; "keep it in view" is a little arithmetic on `scrollTop`.',
      task: 'Show 10,000 rows, `Row 1` to `Row 10000`, each 32 px tall, in a box 160 px tall (`.viewport`, five rows at a time):\n\n' +
        '- Only the rows in view, plus at most five above and five below, are in the DOM. The inner `<ul className="rows">` is as tall as all the rows, so the scrollbar is right.\n' +
        '- Clicking a row selects it: `aria-selected="true"` and the class `selected` (each row is an `<li className="row" role="option">`).\n' +
        '- **Go to row**: a number in `.goto` and a click on **Go** (`.go`) scroll so that row is at the top of the box, and select it.\n' +
        '- With the box focused (`tabIndex={0}`), **ArrowDown** and **ArrowUp** move the selection to the next or previous row, and scroll just enough to keep it fully in view.\n' +
        '- The selection survives scrolling it out of view and back.',
      starter: `import { useState, useRef } from 'react';

const ROW = 32;
const VIEW = 160;
const COUNT = 10000;

export default function VirtualList() {
  const rows = [];
  for (let i = 0; i < COUNT; i++) {
    rows.push(<li key={i} className="row" role="option" aria-selected={false} style={{ height: ROW }}>Row {i + 1}</li>);
  }

  return (
    <div>
      <form className="tools">
        <input className="goto" type="number" min="1" max={COUNT} placeholder="Row number" aria-label="Go to row" />
        <button className="go">Go</button>
      </form>
      <div className="viewport" style={{ height: VIEW }} tabIndex={0} role="listbox" aria-label="Rows">
        <ul className="rows">{rows}</ul>
      </div>
    </div>
  );
}
`,
      solution: `import { useState, useRef } from 'react';

const ROW = 32;
const VIEW = 160;
const COUNT = 10000;
const OVERSCAN = 5;

export default function VirtualList() {
  const [scrollTop, setScrollTop] = useState(0);
  const [selected, setSelected] = useState(null);   // the selected row's index, or null
  const [target, setTarget] = useState('');
  const viewRef = useRef(null);

  function scrollTo(top) {
    const y = Math.max(0, Math.min(COUNT * ROW - VIEW, top));
    viewRef.current.scrollTop = y;
    setScrollTop(y);
  }

  // select row i, and scroll as little as possible to show all of it
  function select(i) {
    setSelected(i);
    const view = viewRef.current;
    if (i * ROW < view.scrollTop) scrollTo(i * ROW);
    else if ((i + 1) * ROW > view.scrollTop + VIEW) scrollTo((i + 1) * ROW - VIEW);
  }

  function go(e) {
    e.preventDefault();
    const n = parseInt(target, 10);
    if (!(n >= 1 && n <= COUNT)) return;
    setSelected(n - 1);
    scrollTo((n - 1) * ROW);
  }

  function onKeyDown(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    if (selected === null) { select(0); return; }
    select(e.key === 'ArrowDown' ? Math.min(COUNT - 1, selected + 1) : Math.max(0, selected - 1));
  }

  const first = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN);
  const last = Math.min(COUNT - 1, Math.floor((scrollTop + VIEW) / ROW) + OVERSCAN);
  const rows = [];
  for (let i = first; i <= last; i++) {
    rows.push(
      <li key={i} id={'row-' + i} className={i === selected ? 'row selected' : 'row'} role="option" aria-selected={i === selected}
        style={{ position: 'absolute', top: i * ROW, left: 0, right: 0, height: ROW }} onClick={() => select(i)}>
        Row {i + 1}
      </li>
    );
  }

  return (
    <div>
      <form className="tools" onSubmit={go}>
        <input className="goto" type="number" min="1" max={COUNT} value={target} onChange={e => setTarget(e.target.value)} placeholder="Row number" aria-label="Go to row" />
        <button className="go">Go</button>
      </form>
      <div ref={viewRef} className="viewport" style={{ height: VIEW }} tabIndex={0} role="listbox" aria-label="Rows"
        aria-activedescendant={selected === null ? undefined : 'row-' + selected}
        onScroll={e => setScrollTop(e.currentTarget.scrollTop)} onKeyDown={onKeyDown}>
        <ul className="rows" style={{ position: 'relative', height: COUNT * ROW }}>{rows}</ul>
      </div>
    </div>
  );
}
`,
      css: '.tools { display: flex; gap: 6px; margin: 0 0 6px; } .goto { width: 110px; padding: 3px 6px; } .viewport { overflow-y: auto; border: 1px solid #ccd; border-radius: 8px; max-width: 260px; outline-offset: 2px; } .rows { margin: 0; padding: 0; list-style: none; } .row { box-sizing: border-box; line-height: 32px; padding: 0 10px; border-bottom: 1px solid #eef; cursor: pointer; } .row.selected { background: #dbe9ff; font-weight: 700; }',
      hints: [
        'Two pieces of state carry everything: `scrollTop` (set from the box\'s `onScroll`) and the selected row\'s **index**. Never keep the selection on an element: the element that shows row 5,000 now will show another row after a scroll.',
        'The window: `first = Math.max(0, Math.floor(scrollTop / ROW) - 5)`, `last = Math.min(COUNT - 1, Math.floor((scrollTop + VIEW) / ROW) + 5)`. Render those rows with `position: \'absolute\'` and `top: i * ROW`, inside a `<ul>` that is `COUNT * ROW` tall.',
        'To scroll from code, keep a ref on the box and write `box.scrollTop = y` (and set the `scrollTop` state, so the rows render at once). Go to row n is `y = (n - 1) * ROW`.',
        'Keeping row i in view: if `i * ROW` is above `box.scrollTop`, scroll to it; if `(i + 1) * ROW` is below `box.scrollTop + VIEW`, scroll to `(i + 1) * ROW - VIEW`; otherwise do not move.'
      ],
      checks: [
        { label: 'Only the rows in view and a few more are in the DOM: under 30', fn: `function (doc) {
  var n = doc.querySelectorAll('.row').length;
  if (n < 5) return 'only ' + n + ' rows: the box should be full';
  return n < 30 || n + ' rows are in the DOM';
}` },
        { label: 'The box scrolls over all 10,000 rows: 320,000 px', fn: `function (doc) {
  var h = doc.querySelector('.viewport').scrollHeight;
  return Math.abs(h - 320000) <= 2 || 'the box scrolls over ' + h + ' px';
}` },
        { label: 'Clicking Row 3 selects it, and it alone', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.row')[2]);
  var sel = [].map.call(doc.querySelectorAll('.row[aria-selected="true"]'), function (r) { return r.textContent; });
  if (sel.join(', ') !== 'Row 3') return 'the rows with aria-selected="true": ' + (sel.join(', ') || 'none');
  return doc.querySelector('.row[aria-selected="true"]').classList.contains('selected') || 'Row 3 has no class "selected"';
}` },
        { label: 'Go to row 5000: it is at the top of the box, and selected', fn: `async function (doc, win, t) {
  await t.type('.goto', '5000');
  await t.click('.go');
  await t.wait(100);
  var v = doc.querySelector('.viewport');
  if (Math.abs(v.scrollTop - 4999 * 32) > 1) return 'the box is scrolled to ' + Math.round(v.scrollTop) + ' px (Row 5000 starts at ' + 4999 * 32 + ')';
  var r = v.getBoundingClientRect(), hit = doc.elementFromPoint(r.left + 20, r.top + 6), row = hit && hit.closest('.row');
  if (!row || row.textContent !== 'Row 5000') return 'at the top of the box is ' + (row ? row.textContent : 'no row');
  return row.getAttribute('aria-selected') === 'true' || 'Row 5000 is not selected';
}` },
        { label: 'ArrowDown selects Row 5001', fn: `async function (doc, win, t) {
  doc.querySelector('.viewport').focus();
  await t.key('.viewport', 'ArrowDown');
  var sel = doc.querySelector('.row[aria-selected="true"]');
  return (sel && sel.textContent === 'Row 5001') || 'after ArrowDown the selected row is ' + (sel ? sel.textContent : 'none');
}` },
        { label: 'ArrowUp past the top of the box scrolls up just enough: Row 4999 at the top', fn: `async function (doc, win, t) {
  await t.key('.viewport', 'ArrowUp');
  await t.key('.viewport', 'ArrowUp');
  await t.wait(100);
  var sel = doc.querySelector('.row[aria-selected="true"]');
  if (!sel || sel.textContent !== 'Row 4999') return 'after two ArrowUp the selected row is ' + (sel ? sel.textContent : 'none');
  var v = doc.querySelector('.viewport');
  return Math.abs(v.scrollTop - 4998 * 32) <= 1 || 'the box is scrolled to ' + Math.round(v.scrollTop) + ' px: Row 4999 should be just at the top (' + 4998 * 32 + ')';
}` },
        { label: 'ArrowDown past the bottom scrolls down just enough: the selected row is the last one in view', fn: `async function (doc, win, t) {
  for (var i = 0; i < 6; i++) await t.key('.viewport', 'ArrowDown');
  await t.wait(100);
  var sel = doc.querySelector('.row[aria-selected="true"]');
  if (!sel || sel.textContent !== 'Row 5005') return 'after six ArrowDown the selected row is ' + (sel ? sel.textContent : 'none');
  var v = doc.querySelector('.viewport'), r = v.getBoundingClientRect(), s = sel.getBoundingClientRect();
  if (s.top < r.top - 1 || s.bottom > r.bottom + 1) return 'Row 5005 is not fully in view';
  return Math.abs(v.scrollTop - (5005 * 32 - 160)) <= 1 || 'the box is scrolled to ' + Math.round(v.scrollTop) + ' px: just enough is ' + (5005 * 32 - 160);
}` },
        { label: 'The selection survives scrolling away and back', fn: `async function (doc, win, t) {
  var v = doc.querySelector('.viewport'), back = v.scrollTop;
  v.scrollTop = 0;
  await t.wait(100);
  v.scrollTop = back;
  await t.wait(100);
  var sel = doc.querySelector('.row[aria-selected="true"]');
  return (sel && sel.textContent === 'Row 5005') || 'scrolled away and back, the selected row is ' + (sel ? sel.textContent : 'none');
}` }
      ],
      followups: [
        'Rows of different heights: what changes in the arithmetic, and how do libraries measure them?',
        'Page Up, Page Down, Home and End.',
        'Load the rows from a server, a page at a time, as the user scrolls towards them.',
        'Accessibility: `aria-activedescendant`, `aria-setsize` and `aria-posinset`, and what a screen reader hears.',
        'Why is `memo` on the row worth it here, and what would defeat it?',
        'A table with 50 columns as well as 10,000 rows: virtualise in both directions?'
      ],
      learn: ['lesson:r-long-lists', 'lesson:r-dom-refs', 'lesson:r-memo']
    },
    {
      id: 'deferred-search', track: 'performance', level: 'Medium', minutes: 30, plainjs: null, strict: true,
      title: 'Deferred search',
      summary: 'A search over 500 products whose results are slow to draw: with useDeferredValue and memo, the box answers every keystroke at once, the list catches up behind it (dimmed while it is stale), and an outdated list is dropped, not finished.',
      keywords: ['deferred search', 'search', 'useDeferredValue', 'deferred value', 'filter list', 'slow list', 'responsive input', 'stale results', 'concurrent rendering', 'typeahead', 'search as you type'],
      plainjsNote: 'Without React there is no deferred rendering: the usual tool is a debounce, `input.addEventListener(\'input\', debounce(render, 200))`, which waits 200 ms after the last keystroke and then draws the whole list in one go, freezing the page while it does. Drawing the list in chunks with `requestIdleCallback` or `setTimeout` keeps the page responsive, at the cost of code that cancels an outdated drawing by hand: what React does for you here.',
      task: 'Each result takes 0.6 ms to draw, so the list of 500 takes about a third of a second, and typing in the box stutters. Keep the box instant:\n\n' +
        '- Render `ResultList` from `useDeferredValue(query)`, and wrap it in `memo`, so a keystroke updates the box at once and the list follows in the background.\n' +
        '- While the list is behind the box, the `.results` element also has the class `stale` (the CSS dims it).\n' +
        '- Quick typing draws the list for the last text, not once per letter.\n\n' +
        'Keep the names `ResultList` and `ResultRow`: the checks count their renders.',
      starter: `import { useState, useDeferredValue, memo } from 'react';

const SIZES = ['Small', 'Large', 'Tall', 'Round', 'Square'];
const COLOURS = ['Blue', 'Red', 'Green', 'Black', 'White', 'Silver', 'Golden', 'Wooden', 'Steel', 'Glass'];
const THINGS = ['Chair', 'Table', 'Lamp', 'Desk', 'Shelf', 'Clock', 'Mirror', 'Rug', 'Vase', 'Bench'];
const PRODUCTS = [];
SIZES.forEach(s => COLOURS.forEach(c => THINGS.forEach(t => PRODUCTS.push(s + ' ' + c + ' ' + t))));

function ResultRow({ name }) {
  const start = performance.now();
  while (performance.now() - start < 0.6) {}   // each result takes 0.6 ms to draw
  return <li>{name}</li>;
}

function ResultList({ query }) {
  const q = query.trim().toLowerCase();
  const found = PRODUCTS.filter(p => p.toLowerCase().includes(q));
  return (
    <>
      <p className="count">{found.length} results</p>
      <ul className="list">{found.map(p => <ResultRow key={p} name={p} />)}</ul>
    </>
  );
}

export default function Search() {
  const [query, setQuery] = useState('');
  return (
    <div>
      <input className="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search 500 products" />
      <div className="results">
        <ResultList query={query} />
      </div>
    </div>
  );
}
`,
      solution: `import { useState, useDeferredValue, memo } from 'react';

const SIZES = ['Small', 'Large', 'Tall', 'Round', 'Square'];
const COLOURS = ['Blue', 'Red', 'Green', 'Black', 'White', 'Silver', 'Golden', 'Wooden', 'Steel', 'Glass'];
const THINGS = ['Chair', 'Table', 'Lamp', 'Desk', 'Shelf', 'Clock', 'Mirror', 'Rug', 'Vase', 'Bench'];
const PRODUCTS = [];
SIZES.forEach(s => COLOURS.forEach(c => THINGS.forEach(t => PRODUCTS.push(s + ' ' + c + ' ' + t))));

function ResultRow({ name }) {
  const start = performance.now();
  while (performance.now() - start < 0.6) {}   // each result takes 0.6 ms to draw
  return <li>{name}</li>;
}

const ResultList = memo(function ResultList({ query }) {
  const q = query.trim().toLowerCase();
  const found = PRODUCTS.filter(p => p.toLowerCase().includes(q));
  return (
    <>
      <p className="count">{found.length} results</p>
      <ul className="list">{found.map(p => <ResultRow key={p} name={p} />)}</ul>
    </>
  );
});

export default function Search() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const stale = query !== deferredQuery;

  return (
    <div>
      <input className="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search 500 products" />
      <div className={stale ? 'results stale' : 'results'}>
        <ResultList query={deferredQuery} />
      </div>
    </div>
  );
}
`,
      css: '.search { padding: 4px 8px; width: 240px; } .count { margin: 6px 0 4px; color: #667; font-size: 13px; } .list { height: 100px; overflow-y: auto; margin: 0; padding-left: 22px; border: 1px solid #ccd; border-radius: 8px; max-width: 280px; } .stale { opacity: 0.45; }',
      hints: [
        '`const deferredQuery = useDeferredValue(query);` in `Search`, and `<ResultList query={deferredQuery} />`. The input keeps `value={query}`: it must show every keystroke at once.',
        'Wrap the list: `const ResultList = memo(function ResultList({ query }) { … });`. In the urgent render after a keystroke it receives the old `deferredQuery`, the same string as before, so `memo` skips it; without `memo` it would render, slowly, every time.',
        'Stale means the two differ: `const stale = query !== deferredQuery;` and `className={stale ? \'results stale\' : \'results\'}`.'
      ],
      checks: [
        { label: 'Right after a keystroke the box shows it, and the old list stays, marked stale', fn: `async function (doc, win, t) {
  await t.type('.search', 'w');
  if (doc.querySelector('.search').value !== 'w') return 'the box says "' + doc.querySelector('.search').value + '"';
  if (!doc.querySelector('.results.stale')) return 'right after the keystroke the list is not marked stale: it was drawn before the box could update';
  return t.text('.count') === '500 results' || 'right after the keystroke the list already says "' + t.text('.count') + '"';
}` },
        { label: 'Once typing pauses, the list matches the box and is no longer stale', fn: `async function (doc, win, t) {
  for (var i = 0; i < 60 && doc.querySelector('.results.stale'); i++) await t.wait(50);
  if (doc.querySelector('.results.stale')) return 'still stale 3 seconds later';
  var names = [].map.call(doc.querySelectorAll('.list li'), function (li) { return li.textContent; });
  var wrong = names.filter(function (n) { return n.toLowerCase().indexOf('w') < 0; });
  if (!names.length || wrong.length) return names.length ? wrong.length + ' results without "w", such as ' + wrong[0] : 'no results';
  return t.text('.count') === names.length + ' results' || '.count says "' + t.text('.count') + '" for ' + names.length + ' rows';
}` },
        { label: 'Typing four letters quickly draws `ResultList` once or twice, not four times', fn: `async function (doc, win, t) {
  var r = await t.renders(async function () {
    var words = ['r', 'ro', 'rou', 'roun'];
    for (var i = 0; i < words.length; i++) { await t.type('.search', words[i]); await t.wait(20); }
    for (var j = 0; j < 60 && doc.querySelector('.results.stale'); j++) await t.wait(50);
  });
  if (!r.ResultList) return 'ResultList was never drawn for the new text';
  return r.ResultList <= 2 || 'four quick keystrokes drew ResultList ' + r.ResultList + ' times';
}` },
        { label: 'Clearing the box shows all 500 products again', fn: `async function (doc, win, t) {
  await t.type('.search', '');
  for (var i = 0; i < 80 && (doc.querySelector('.results.stale') || t.text('.count') !== '500 results'); i++) await t.wait(50);
  if (t.text('.count') !== '500 results') return '.count says "' + t.text('.count') + '"';
  return doc.querySelectorAll('.list li').length === 500 || doc.querySelectorAll('.list li').length + ' rows';
}` }
      ],
      followups: [
        'Debounce, throttle, or useDeferredValue: when would you pick each?',
        'The search goes to a server instead: where does the deferral help, and where does it not?',
        'Highlight the matching part of each name. Does that change what `memo` can skip?',
        'Show a spinner while the list is stale, but only if it stays stale for more than 300 ms.',
        'The same with `useTransition`: what would you put inside `startTransition`?'
      ],
      learn: ['lesson:r-transitions', 'lesson:r-memo', 'lesson:r-rendering']
    }
  );
})(window.RLT);
