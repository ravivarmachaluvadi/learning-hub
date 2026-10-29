/*
 * Machine coding, track 3 (Effects and refs): Autocomplete, Pagination, Carousel and the
 * progress-bar queue, each the React version of its plain-JS page in
 * java-interview-practice/AAScratches/11-UI-Practice/01-Components, with the same behaviour and the
 * same test cases. The problem shape is described at the top of data/builds.js. Like the track's
 * lesson challenges, each runs inside <StrictMode> (`strict: true`), so a missing cleanup shows.
 *
 * Timings are shorter than on a real site so that the checks need not wait long: the carousel
 * moves every second and a progress bar fills in one; the checks wait with t.wait(ms).
 */
(function (U) {
  var B = U.data.builds = U.data.builds || [];

  B.push(
    {
      id: 'autocomplete', track: 'effects', level: 'Hard', minutes: 45, plainjs: 'C01_Autocomplete.html', strict: true,
      title: 'Autocomplete',
      summary: 'A search box with suggestions: debounced by 200 ms, starts-with matches first, the match in bold, arrow keys that wrap, Enter to pick, Escape to close. The most-asked hard UI round.',
      keywords: ['autocomplete', 'typeahead', 'search box', 'suggestions', 'combobox', 'debounce', 'keyboard navigation', 'arrow keys', 'highlight', 'search'],
      task: 'Build a search box with suggestions from `FRUITS` (`search(query)` is written for you: up to 5 names, ignoring case, those that start with the text first).\n\n' +
        '- When typing pauses for **200 ms**, show the matches, with the matching part in **bold** (`<b>`). Nothing shows before the pause, and keystrokes closer together than 200 ms keep it waiting.\n' +
        '- **ArrowDown** and **ArrowUp** move a highlight through the list (the `<li>` gets the class `active`), wrapping round at both ends.\n' +
        '- **Enter** puts the highlighted name in the box and closes the list, which stays closed until you type again. **Escape** closes it too.\n' +
        '- Clicking a suggestion picks it, as Enter does.\n' +
        '- A blank box shows nothing.\n\n' +
        'For the checks: the box is `<input className="search">` and the suggestions are `<li>` elements in a `<ul className="suggestions">` (render no `<li>` while the list is closed).',
      starter: `import { useState, useEffect } from 'react';

const FRUITS = ['Apple', 'Apricot', 'Avocado', 'Banana', 'Blackberry', 'Blueberry', 'Cherry',
  'Grape', 'Grapefruit', 'Mango', 'Pineapple', 'Strawberry'];

function search(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = FRUITS.filter(f => f.toLowerCase().startsWith(q));
  const contains = FRUITS.filter(f => !f.toLowerCase().startsWith(q) && f.toLowerCase().includes(q));
  return starts.concat(contains).slice(0, 5);
}

export default function Autocomplete() {
  return (
    <div className="ac">
      <input className="search" placeholder="Search fruit" autoComplete="off" />
      <ul className="suggestions"></ul>
    </div>
  );
}
`,
      solution: `import { useState, useEffect } from 'react';

const FRUITS = ['Apple', 'Apricot', 'Avocado', 'Banana', 'Blackberry', 'Blueberry', 'Cherry',
  'Grape', 'Grapefruit', 'Mango', 'Pineapple', 'Strawberry'];

function search(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = FRUITS.filter(f => f.toLowerCase().startsWith(q));
  const contains = FRUITS.filter(f => !f.toLowerCase().startsWith(q) && f.toLowerCase().includes(q));
  return starts.concat(contains).slice(0, 5);
}

export default function Autocomplete() {
  const [text, setText] = useState('');
  const [found, setFound] = useState({ q: '', names: [] });   // the last search, and what it searched for
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const id = setTimeout(() => {
      setFound({ q: text.trim().toLowerCase(), names: search(text) });
      setActive(-1);
    }, 200);
    return () => clearTimeout(id);
  }, [text]);

  const shown = open ? found.names : [];

  function pick(name) {
    setText(name);
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (!shown.length) return;
    const n = shown.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive(a => (a === -1 && step < 0 ? n - 1 : (a + step + n) % n));
    } else if (e.key === 'Enter' && active >= 0) {
      pick(shown[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="ac">
      <input
        className="search"
        placeholder="Search fruit"
        autoComplete="off"
        value={text}
        onChange={e => {
          setText(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      {shown.length > 0 && (
        <ul className="suggestions">
          {shown.map((name, i) => {
            const at = name.toLowerCase().indexOf(found.q);
            return (
              <li
                key={name}
                className={i === active ? 'active' : ''}
                onMouseDown={e => {
                  e.preventDefault();
                  pick(name);
                }}
              >
                {name.slice(0, at)}
                <b>{name.slice(at, at + found.q.length)}</b>
                {name.slice(at + found.q.length)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
`,
      css: '.ac { position: relative; width: 280px; } .search { width: 100%; box-sizing: border-box; padding: 6px 8px; font: inherit; } .suggestions { position: absolute; left: 0; right: 0; margin: 2px 0 0; padding: 0; list-style: none; border: 1px solid #bbb; background: #fff; } .suggestions:empty { display: none; } .suggestions li { padding: 6px 8px; cursor: pointer; } .suggestions li.active { background: #dbe9ff; }',
      hints: [
        'Four pieces of state: `text` (the input, controlled), the last search\'s results, whether the list is `open`, and the `active` index (-1 for none). The highlight is an index into the results, not a class you hunt for.',
        'Debounce with an effect on `[text]`: `const id = setTimeout(() => { setFound(search(text)); setActive(-1); }, 200); return () => clearTimeout(id);`. Each keystroke cleans up the timer before it, so only a pause runs the search.',
        'Typing sets `open` to true; picking and Escape set it to false. Show `open ? results : []`: picking sets the text, which starts one more search, and `open` is what keeps that one from reopening the list.',
        'The arrows wrap with `(a + step + n) % n` (and ArrowUp from nothing goes to the last). Bold the match by slicing the name around the position of the text it was searched for. For clicks, use `onMouseDown` with `e.preventDefault()`, which comes before the input loses focus.'
      ],
      checks: [
        { label: 'Typing "ap": nothing at once; after a 200 ms pause, Apple, Apricot, Grape, Grapefruit, Pineapple', fn: `async function (doc, win, t) {
  await t.type('.search', 'ap');
  if (t.count('.suggestions li')) return 'the list showed at once, before the pause';
  await t.wait(320);
  var names = [].map.call(doc.querySelectorAll('.suggestions li'), function (li) { return li.textContent; }).join(', ');
  return names === 'Apple, Apricot, Grape, Grapefruit, Pineapple' || 'the list is: ' + (names || 'empty');
}` },
        { label: 'The matching part is bold: "ap" in Grape', fn: `function (doc) {
  var li = doc.querySelectorAll('.suggestions li')[2], b = li && li.querySelector('b');
  return (b && b.textContent === 'ap') || (b ? 'the bold part of the third name is "' + b.textContent + '"' : 'the third name has no <b>');
}` },
        { label: 'Keystrokes 150 ms apart keep it waiting', fn: `async function (doc, win, t) {
  function names() { return [].map.call(doc.querySelectorAll('.suggestions li'), function (li) { return li.textContent; }).join(', '); }
  await t.type('.search', 'b');
  await t.wait(150);
  await t.type('.search', 'be');
  await t.wait(150);
  return names() === 'Apple, Apricot, Grape, Grapefruit, Pineapple' || '300 ms after "b" but 150 ms after "be", it already searched: ' + (names() || 'empty');
}` },
        { label: 'Typing "berry": Blackberry, Blueberry, Strawberry', fn: `async function (doc, win, t) {
  await t.type('.search', 'berry');
  await t.wait(320);
  var names = [].map.call(doc.querySelectorAll('.suggestions li'), function (li) { return li.textContent; }).join(', ');
  return names === 'Blackberry, Blueberry, Strawberry' || 'the list is: ' + (names || 'empty');
}` },
        { label: 'ArrowDown twice highlights Blueberry; ArrowUp twice wraps round to Strawberry', fn: `async function (doc, win, t) {
  await t.key('.search', 'ArrowDown');
  await t.key('.search', 'ArrowDown');
  var a = doc.querySelector('.suggestions li.active');
  if (!a || a.textContent !== 'Blueberry') return 'after two ArrowDown the highlight is on ' + (a ? a.textContent : 'nothing');
  await t.key('.search', 'ArrowUp');
  await t.key('.search', 'ArrowUp');
  a = doc.querySelector('.suggestions li.active');
  return (a && a.textContent === 'Strawberry') || 'after two ArrowUp the highlight is on ' + (a ? a.textContent : 'nothing');
}` },
        { label: 'Down, Down, Enter: "Blueberry" in the box, and the list closed for good', fn: `async function (doc, win, t) {
  await t.key('.search', 'ArrowDown');
  await t.key('.search', 'ArrowDown');
  await t.key('.search', 'Enter');
  var v = doc.querySelector('.search').value;
  if (v !== 'Blueberry') return 'the box says "' + v + '"';
  if (t.count('.suggestions li')) return 'the list is still open';
  await t.wait(320);
  return !t.count('.suggestions li') || 'the list opened again 200 ms after picking';
}` },
        { label: 'Escape closes the list', fn: `async function (doc, win, t) {
  await t.type('.search', 'gr');
  await t.wait(320);
  if (!t.count('.suggestions li')) return 'typing "gr" showed no list';
  await t.key('.search', 'Escape');
  return !t.count('.suggestions li') || 'after Escape the list still shows ' + t.count('.suggestions li') + ' names';
}` },
        { label: 'Clicking a suggestion picks it', fn: `async function (doc, win, t) {
  await t.type('.search', 'man');
  await t.wait(320);
  var li = doc.querySelector('.suggestions li');
  if (!li) return 'typing "man" showed no list';
  li.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  await t.tick();
  if (li.isConnected) await t.click(li);
  var v = doc.querySelector('.search').value;
  if (v !== 'Mango') return 'the box says "' + v + '"';
  return !t.count('.suggestions li') || 'the list is still open';
}` },
        { label: 'A blank box shows nothing', fn: `async function (doc, win, t) {
  await t.type('.search', '   ');
  await t.wait(320);
  return !t.count('.suggestions li') || 'with only spaces typed, the list shows ' + t.count('.suggestions li') + ' names';
}` }
      ],
      followups: [
        'Fetch the names from a server: cancel the stale request (`AbortController` in the cleanup), and cache answers by query.',
        'Answers arriving out of order: how does the effect\'s cleanup make sure only the latest query\'s answer is shown?',
        'Pull the debounce out into `useDebounce(value, 200)`. What does the component look like then?',
        'Accessibility: `role="combobox"`, `aria-expanded`, `aria-controls`, and `aria-activedescendant` pointing at the highlighted option.',
        'Why `onMouseDown` and not `onClick` on a suggestion, once the list closes when the input loses focus?',
        'Highlighting the match with `<b>`: why is it safe from injection in React, when `innerHTML` would not be?'
      ],
      learn: ['lesson:r-custom-hooks', 'lesson:r-effect-cleanup', 'lesson:r-forms']
    },
    {
      id: 'pagination', track: 'effects', level: 'Medium', minutes: 30, plainjs: 'B02_Pagination.html', strict: true,
      title: 'Pagination',
      summary: '47 items, 5 a page: Prev, the page numbers with "..." where pages are skipped (never hiding just one), Next. One piece of state; everything else is worked out from it.',
      keywords: ['pagination', 'pager', 'paging', 'pages', 'page numbers', 'ellipsis', 'prev next', 'aria-current', 'derived state'],
      task: 'Show the 47 items 5 to a page, with page controls under them: **Prev**, the page numbers, **Next**.\n\n' +
        '- Show only page 1, the last page, and the current page with one page on each side. Put `...` where pages are skipped, but never a `...` that would hide just one page: show that page instead.\n' +
        '- **Prev** is disabled on the first page, **Next** on the last. The current page\'s button has `aria-current="page"`.\n\n' +
        'Examples: page 1 shows `1 2 ... 10`; page 4 shows `1 2 3 4 5 ... 10` (2 is shown: a `...` would hide one page); page 6 shows `1 ... 5 6 7 ... 10`; page 10 shows items 46 and 47 and `1 ... 9 10`.\n\n' +
        'For the checks: the items are `<li>` elements in `<ul className="items">`; inside `<nav className="pager">`, every page is a `<button>` showing its number, and each gap a `<span className="gap">...</span>`.',
      starter: `import { useState } from 'react';

const ITEMS = Array.from({ length: 47 }, (_, i) => 'Item ' + (i + 1));
const PAGE_SIZE = 5;

export default function Pagination() {
  return (
    <div>
      <ul className="items">
        {ITEMS.slice(0, PAGE_SIZE).map(item => <li key={item}>{item}</li>)}
      </ul>
      <nav className="pager" aria-label="Pages"></nav>
    </div>
  );
}
`,
      solution: `import { useState } from 'react';

const ITEMS = Array.from({ length: 47 }, (_, i) => 'Item ' + (i + 1));
const PAGE_SIZE = 5;
const TOTAL = Math.ceil(ITEMS.length / PAGE_SIZE);
const GAP = '...';

function pageList(current, total) {
  const wanted = [...new Set([1, total, current - 1, current, current + 1])]
    .filter(n => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out = [];
  wanted.forEach((n, i) => {
    const prev = wanted[i - 1];
    if (prev !== undefined && n - prev === 2) out.push(n - 1);
    else if (prev !== undefined && n - prev > 2) out.push(GAP);
    out.push(n);
  });
  return out;
}

export default function Pagination() {
  const [page, setPage] = useState(1);
  const start = (page - 1) * PAGE_SIZE;

  return (
    <div>
      <ul className="items">
        {ITEMS.slice(start, start + PAGE_SIZE).map(item => <li key={item}>{item}</li>)}
      </ul>
      <nav className="pager" aria-label="Pages">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
        {pageList(page, TOTAL).map((n, i) =>
          n === GAP ? (
            <span key={'gap-' + i} className="gap">{GAP}</span>
          ) : (
            <button key={n} aria-current={n === page ? 'page' : undefined} onClick={() => setPage(n)}>
              {n}
            </button>
          )
        )}
        <button disabled={page === TOTAL} onClick={() => setPage(page + 1)}>Next</button>
      </nav>
    </div>
  );
}
`,
      css: '.items { list-style: none; padding: 0; min-height: 150px; } .items li { padding: 4px 0; border-bottom: 1px solid #eee; } .pager { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; } .pager button { min-width: 36px; padding: 4px 8px; border: 1px solid #bbb; border-radius: 6px; background: #fff; cursor: pointer; } .pager button[aria-current="page"] { background: #2563eb; border-color: #2563eb; color: #fff; } .pager button:disabled { opacity: .4; cursor: default; } .gap { padding: 0 4px; color: #777; }',
      hints: [
        'The only state is `page`. The items shown are `ITEMS.slice((page - 1) * 5, page * 5)`, and the buttons are worked out from `page` on every render.',
        'Work out the numbers first, as a small sorted set: `[...new Set([1, total, page - 1, page, page + 1])]`, keeping those from 1 to `total`. Only then walk it and decide about the gaps.',
        'Walking the set: between two numbers 2 apart, put the missing page; more than 2 apart, put `...`. Building the row left to right with "near the start, the middle, the end" cases is where off-by-one bugs live.'
      ],
      checks: [
        { label: 'Page 1: items 1 to 5, and 1 2 ... 10', fn: `function (doc) {
  var items = [].map.call(doc.querySelectorAll('.items li'), function (li) { return li.textContent.replace('Item ', ''); }).join(' ');
  var pager = doc.querySelector('.pager');
  var row = pager ? [].map.call(pager.children, function (el) { return el.textContent; }).filter(function (x) { return x !== 'Prev' && x !== 'Next'; }).join(' ') : '(no .pager)';
  return (items + ' | ' + row) === '1 2 3 4 5 | 1 2 ... 10' || 'it shows ' + items + ' | ' + row;
}` },
        { label: 'On page 1, Prev is disabled and 1 has `aria-current="page"`', fn: `function (doc) {
  var prev = [].filter.call(doc.querySelectorAll('.pager button'), function (b) { return b.textContent === 'Prev'; })[0];
  if (!prev) return 'no Prev button';
  if (!prev.disabled) return 'Prev is enabled on page 1';
  var cur = doc.querySelector('.pager [aria-current="page"]');
  return (cur && cur.textContent === '1') || 'the marked page is ' + (cur ? cur.textContent : 'none');
}` },
        { label: 'Next three times: page 4 shows items 16 to 20, and 1 2 3 4 5 ... 10', fn: `async function (doc, win, t) {
  function press(text) { return [].filter.call(doc.querySelectorAll('.pager button'), function (b) { return b.textContent === text; })[0]; }
  for (var i = 0; i < 3; i++) await t.click(press('Next'));
  var items = [].map.call(doc.querySelectorAll('.items li'), function (li) { return li.textContent.replace('Item ', ''); }).join(' ');
  var row = [].map.call(doc.querySelector('.pager').children, function (el) { return el.textContent; }).filter(function (x) { return x !== 'Prev' && x !== 'Next'; }).join(' ');
  return (items + ' | ' + row) === '16 17 18 19 20 | 1 2 3 4 5 ... 10' || 'it shows ' + items + ' | ' + row;
}` },
        { label: 'Then 5, then 6: 1 ... 5 6 7 ... 10, with 6 marked', fn: `async function (doc, win, t) {
  function press(text) { return [].filter.call(doc.querySelectorAll('.pager button'), function (b) { return b.textContent === text; })[0]; }
  await t.click(press('5'));
  await t.click(press('6'));
  var row = [].map.call(doc.querySelector('.pager').children, function (el) { return el.textContent; }).filter(function (x) { return x !== 'Prev' && x !== 'Next'; }).join(' ');
  if (row !== '1 ... 5 6 7 ... 10') return 'the pages are: ' + row;
  var cur = doc.querySelector('.pager [aria-current="page"]');
  return (cur && cur.textContent === '6') || 'the marked page is ' + (cur ? cur.textContent : 'none');
}` },
        { label: 'Page 10: items 46 and 47, 1 ... 9 10, and Next disabled', fn: `async function (doc, win, t) {
  function press(text) { return [].filter.call(doc.querySelectorAll('.pager button'), function (b) { return b.textContent === text; })[0]; }
  await t.click(press('10'));
  var items = [].map.call(doc.querySelectorAll('.items li'), function (li) { return li.textContent.replace('Item ', ''); }).join(' ');
  var row = [].map.call(doc.querySelector('.pager').children, function (el) { return el.textContent; }).filter(function (x) { return x !== 'Prev' && x !== 'Next'; }).join(' ');
  if ((items + ' | ' + row) !== '46 47 | 1 ... 9 10') return 'it shows ' + items + ' | ' + row;
  return press('Next').disabled || 'Next is enabled on the last page';
}` },
        { label: 'Prev from page 10: items 41 to 45, and 1 ... 8 9 10', fn: `async function (doc, win, t) {
  function press(text) { return [].filter.call(doc.querySelectorAll('.pager button'), function (b) { return b.textContent === text; })[0]; }
  await t.click(press('Prev'));
  var items = [].map.call(doc.querySelectorAll('.items li'), function (li) { return li.textContent.replace('Item ', ''); }).join(' ');
  var row = [].map.call(doc.querySelector('.pager').children, function (el) { return el.textContent; }).filter(function (x) { return x !== 'Prev' && x !== 'Next'; }).join(' ');
  return (items + ' | ' + row) === '41 42 43 44 45 | 1 ... 8 9 10' || 'it shows ' + items + ' | ' + row;
}` },
        { label: 'Only the page is state: the items and the buttons are worked out from it', fn: `function (doc, win, t) {
  var n = (t.source().match(/useState\\s*\\(/g) || []).length;
  return n === 1 || 'useState is called ' + n + ' times: keep only the page, and work everything else out while rendering';
}` }
      ],
      followups: [
        'Keep the page in the URL (`?page=4`), so that Back and a reload work. Where does the state live then?',
        'Server-side paging: `fetch(\'/api/items?page=4&size=5\')` in an effect, with a loading state, and the stale-answer protection of the fetching lesson for fast clicks.',
        'Infinite scroll instead: an `IntersectionObserver` on a sentinel under the list, set up in an effect and disconnected in its cleanup.',
        'A "siblings" setting (2 pages on each side) and a page-size picker. What happens to the current page when the size changes?',
        'Why is `pageList` easy to test with no React at all, and what cases would you test?'
      ],
      learn: ['lesson:r-effect-deps', 'lesson:r-lists-keys', 'lesson:r-lifting-state']
    },
    {
      id: 'carousel', track: 'effects', level: 'Medium', minutes: 35, plainjs: 'B05_Carousel.html', strict: true,
      title: 'Carousel',
      summary: 'Four slides on a sliding track: Prev and Next that wrap round, dots, arrow keys, "Slide 2 of 4", and Play/Pause autoplay that pauses while hovered.',
      keywords: ['carousel', 'slider', 'slideshow', 'image carousel', 'autoplay', 'setInterval', 'wrap around', 'modulo', 'dots', 'pause on hover'],
      task: 'Build a carousel of 4 slides that shows one at a time.\n\n' +
        '- **Prev** and **Next** move one slide; Next on the last goes to the first, Prev on the first to the last.\n' +
        '- One dot per slide: clicking a dot jumps to its slide, and the current dot has `aria-current="true"` (the others `"false"`).\n' +
        '- **ArrowLeft** and **ArrowRight** on the carousel work like Prev and Next.\n' +
        '- `<p className="caption">` says `Slide 2 of 4`.\n' +
        '- Slides move by sliding the track sideways: its `transform` is `translateX(-200%)` on slide 3.\n' +
        '- **Play** moves on by itself, one slide every second, and the button then reads **Pause**; Pause stops it. While the mouse is over the carousel, it waits.\n\n' +
        'A second is short so that the checks need not wait long; real carousels wait 3 to 5. For the checks: the carousel is `<div className="carousel">`, the track `<div className="track">`, the buttons `prev`, `next`, `play` and one `dot` per slide.',
      starter: `import { useState, useEffect } from 'react';

const SLIDES = [
  { text: 'Beach', color: '#0ea5e9' },
  { text: 'Forest', color: '#16a34a' },
  { text: 'Desert', color: '#d97706' },
  { text: 'Snow', color: '#64748b' }
];

export default function Carousel() {
  return (
    <div className="carousel" tabIndex={0} aria-label="Photos">
      <div className="viewport">
        <div className="track">
          {SLIDES.map(s => (
            <div key={s.text} className="slide" style={{ background: s.color }}>{s.text}</div>
          ))}
        </div>
      </div>
      <div className="controls">
        <button className="prev" aria-label="Previous slide">Prev</button>
        <div className="dots">
          {SLIDES.map((s, i) => <button key={s.text} className="dot" aria-label={'Go to slide ' + (i + 1)} />)}
        </div>
        <button className="next" aria-label="Next slide">Next</button>
      </div>
      <p className="caption" aria-live="polite">Slide 1 of 4</p>
      <button className="play">Play</button>
    </div>
  );
}
`,
      solution: `import { useState, useEffect } from 'react';

const SLIDES = [
  { text: 'Beach', color: '#0ea5e9' },
  { text: 'Forest', color: '#16a34a' },
  { text: 'Desert', color: '#d97706' },
  { text: 'Snow', color: '#64748b' }
];
const COUNT = SLIDES.length;

export default function Carousel() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);

  function go(i) {
    setIndex((i + COUNT) % COUNT);   // -1 becomes 3, and 4 becomes 0
  }

  useEffect(() => {
    if (!playing || hovered) return;
    const id = setInterval(() => setIndex(i => (i + 1) % COUNT), 1000);
    return () => clearInterval(id);
  }, [playing, hovered]);

  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') go(index - 1);
    if (e.key === 'ArrowRight') go(index + 1);
  }

  return (
    <div
      className="carousel"
      tabIndex={0}
      aria-label="Photos"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="viewport">
        <div className="track" style={{ transform: 'translateX(' + -index * 100 + '%)' }}>
          {SLIDES.map(s => (
            <div key={s.text} className="slide" style={{ background: s.color }}>{s.text}</div>
          ))}
        </div>
      </div>
      <div className="controls">
        <button className="prev" aria-label="Previous slide" onClick={() => go(index - 1)}>Prev</button>
        <div className="dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.text}
              className="dot"
              aria-label={'Go to slide ' + (i + 1)}
              aria-current={i === index ? 'true' : 'false'}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <button className="next" aria-label="Next slide" onClick={() => go(index + 1)}>Next</button>
      </div>
      <p className="caption" aria-live="polite">Slide {index + 1} of {COUNT}</p>
      <button className="play" onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
    </div>
  );
}
`,
      css: '.carousel { width: 360px; max-width: 100%; outline: none; } .viewport { overflow: hidden; border-radius: 10px; } .track { display: flex; transition: transform .3s ease; } .slide { flex: 0 0 100%; height: 150px; display: grid; place-items: center; color: #fff; font-size: 28px; font-weight: 700; } .controls { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; } .dots { display: flex; gap: 6px; } .dot { width: 12px; height: 12px; padding: 0; border-radius: 50%; border: 0; background: #ccc; cursor: pointer; } .dot[aria-current="true"] { background: #2563eb; } .caption { color: #555; margin: 6px 0; }',
      hints: [
        'One number is the state, `index` (from 0), and `go(i)` sets it with `(i + COUNT) % COUNT`: that one line wraps both ways. JavaScript\'s `%` keeps the sign of the left side, so the `+ COUNT` is what makes Prev from the first slide work.',
        'Everything shown is worked out from `index`: the track\'s `style={{ transform: \'translateX(\' + -index * 100 + \'%)\' }}`, the caption, and each dot\'s `aria-current`. Arrow keys: `onKeyDown` on the carousel, which has `tabIndex={0}` so it can take the focus.',
        'Autoplay is an effect on `[playing, hovered]`: when playing and not hovered, `setInterval(…, 1000)`, cleared in the cleanup. Hovering changes `hovered`, so React cleans up the interval; leaving starts a new one.',
        'Inside the interval, use the updater, `setIndex(i => (i + 1) % COUNT)`. The interval keeps the render that started it, so `setIndex(index + 1)` there would keep moving to the same slide.'
      ],
      checks: [
        { label: 'It starts on slide 1: "Slide 1 of 4", dot 1 marked', fn: `function (doc, win, t) {
  var marked = [].map.call(doc.querySelectorAll('.dot'), function (d) { return d.getAttribute('aria-current'); }).indexOf('true') + 1;
  return (t.text('.caption') === 'Slide 1 of 4' && marked === 1) || 'it shows "' + t.text('.caption') + '", dot ' + marked + ' marked';
}` },
        { label: 'Next twice: slide 3, and the track is at translateX(-200%)', fn: `async function (doc, win, t) {
  await t.click('.next');
  await t.click('.next');
  if (t.text('.caption') !== 'Slide 3 of 4') return 'the caption says "' + t.text('.caption') + '"';
  var tr = doc.querySelector('.track').style.transform;
  return tr === 'translateX(-200%)' || 'the track\\'s transform is "' + tr + '"';
}` },
        { label: 'Next twice more wraps round to slide 1; Prev from there goes to slide 4, dot 4 marked', fn: `async function (doc, win, t) {
  await t.click('.next');
  await t.click('.next');
  if (t.text('.caption') !== 'Slide 1 of 4') return 'after Next on the last slide: "' + t.text('.caption') + '"';
  await t.click('.prev');
  var marked = [].map.call(doc.querySelectorAll('.dot'), function (d) { return d.getAttribute('aria-current'); }).indexOf('true') + 1;
  return (t.text('.caption') === 'Slide 4 of 4' && marked === 4) || 'after Prev on the first slide: "' + t.text('.caption') + '", dot ' + marked + ' marked';
}` },
        { label: 'Dot 2 jumps to slide 2', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.dot')[1]);
  return t.text('.caption') === 'Slide 2 of 4' || 'the caption says "' + t.text('.caption') + '"';
}` },
        { label: 'Arrow keys on the carousel: Right, Right, Left lands on slide 3', fn: `async function (doc, win, t) {
  await t.key('.carousel', 'ArrowRight');
  await t.key('.carousel', 'ArrowRight');
  await t.key('.carousel', 'ArrowLeft');
  return t.text('.caption') === 'Slide 3 of 4' || 'the caption says "' + t.text('.caption') + '"';
}` },
        { label: 'Play moves on by itself, a slide a second, and the button reads Pause', fn: `async function (doc, win, t) {
  await t.click('.play');
  if (t.text('.play') !== 'Pause') return 'after Play the button says "' + t.text('.play') + '"';
  await t.wait(1250);
  if (t.text('.caption') !== 'Slide 4 of 4') return 'a second after Play: "' + t.text('.caption') + '"';
  await t.wait(1000);
  return t.text('.caption') === 'Slide 1 of 4' || 'two seconds after Play: "' + t.text('.caption') + '"';
}` },
        { label: 'While the mouse is over the carousel it waits; when it leaves, it goes on', fn: `async function (doc, win, t) {
  await t.hover('.carousel');
  var a = t.text('.caption');
  await t.wait(1300);
  if (t.text('.caption') !== a) return 'while hovered it moved from "' + a + '" to "' + t.text('.caption') + '"';
  await t.leave('.carousel');
  await t.wait(1250);
  return t.text('.caption') !== a || 'after the mouse left it stayed on "' + a + '"';
}` },
        { label: 'Pause stops it', fn: `async function (doc, win, t) {
  await t.click('.play');
  if (t.text('.play') !== 'Play') return 'after Pause the button says "' + t.text('.play') + '"';
  var a = t.text('.caption');
  await t.wait(1300);
  return t.text('.caption') === a || 'after Pause it moved from "' + a + '" to "' + t.text('.caption') + '"';
}` }
      ],
      followups: [
        'Swipe on touch screens: pointer events with a threshold. Where does the start position live, state or a ref?',
        'Respect `prefers-reduced-motion`: no autoplay, and no sliding animation. How do you read a media query in React (and keep up with changes)?',
        'Infinite loop without the jump back: clone the first and last slides at the ends. What happens to the index?',
        'Lazy-load the images: only the current and the next slide get their `src`.',
        'Accessibility: `aria-roledescription="carousel"`, each slide a group labelled "2 of 4", and why autoplay must have a pause control.',
        'Restart the countdown after every manual move. Which dependency does that add to the effect?'
      ],
      learn: ['lesson:r-effect-cleanup', 'lesson:r-effect-deps', 'lesson:r-events']
    },
    {
      id: 'progress-queue', track: 'effects', level: 'Hard', minutes: 45, plainjs: 'C02_ProgressBarQueue.html', strict: true,
      title: 'Progress-bar queue',
      summary: 'Add progress bars that fill in a second, at most 3 at a time; the rest wait in order and start as slots free up. Each shows waiting, running or done, and a line counts them.',
      keywords: ['progress bar', 'progress bars', 'queue', 'concurrency limit', 'upload queue', 'throttle', 'max 3 at a time', 'setInterval', 'derived state', 'useEffectEvent'],
      task: 'An **Add** button adds a progress bar that fills from 0% to 100% in `DURATION` ms (1 second here; the plain-JS page uses 2).\n\n' +
        '- At most **3** bars fill at the same time (`LIMIT`). A bar added while 3 are filling waits, shown empty, and starts as soon as one finishes, in the order they were added.\n' +
        '- Each bar shows its state: `waiting`, `running` or `done`, in its `data-state` attribute.\n' +
        '- `<p className="summary">` counts them: `2 running, 1 waiting, 4 done`.\n\n' +
        'For the checks: each bar is a `<div className="bar">` with the state in `data-state`, holding a `<div className="fill">` whose width is how full it is.',
      starter: `import { useState, useEffect, useEffectEvent } from 'react';

const LIMIT = 3;          // bars that may fill at the same time
const DURATION = 1000;    // ms to fill one bar

export default function ProgressQueue() {
  return (
    <div>
      <button className="add">Add</button>
      <p className="summary">0 running, 0 waiting, 0 done</p>
      <div className="bars"></div>
    </div>
  );
}
`,
      solution: `import { useState, useEffect, useEffectEvent } from 'react';

const LIMIT = 3;          // bars that may fill at the same time
const DURATION = 1000;    // ms to fill one bar

let nextId = 1;

function Bar({ state, onDone }) {
  const [progress, setProgress] = useState(0);   // 0 to 1
  const finished = useEffectEvent(onDone);       // the latest onDone, without restarting the timer

  useEffect(() => {
    if (state !== 'running') return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      const part = Math.min(1, (Date.now() - startedAt) / DURATION);
      setProgress(part);
      if (part === 1) {
        clearInterval(id);
        finished();
      }
    }, 50);
    return () => clearInterval(id);
  }, [state]);

  const width = state === 'done' ? 100 : Math.round(progress * 100);
  return (
    <div className="bar" data-state={state}>
      <div className="fill" style={{ width: width + '%' }} />
      <span className="label">{state}</span>
    </div>
  );
}

export default function ProgressQueue() {
  const [bars, setBars] = useState([]);   // [{ id, done }], in the order they were added

  function add() {
    const id = nextId++;
    setBars(bs => [...bs, { id: id, done: false }]);
  }

  function finish(id) {
    setBars(bs => bs.map(b => (b.id === id ? { ...b, done: true } : b)));
  }

  // worked out on every render: the first LIMIT bars not done are running, the rest wait
  let free = LIMIT;
  const states = bars.map(b => {
    if (b.done) return 'done';
    if (free > 0) {
      free--;
      return 'running';
    }
    return 'waiting';
  });
  const count = s => states.filter(x => x === s).length;

  return (
    <div>
      <button className="add" onClick={add}>Add</button>
      <p className="summary">
        {count('running')} running, {count('waiting')} waiting, {count('done')} done
      </p>
      <div className="bars">
        {bars.map((b, i) => (
          <Bar key={b.id} state={states[i]} onDone={() => finish(b.id)} />
        ))}
      </div>
    </div>
  );
}
`,
      css: '.summary { color: #555; } .bar { position: relative; height: 18px; margin: 8px 0; background: #eee; border-radius: 9px; overflow: hidden; max-width: 380px; } .fill { height: 100%; width: 0; background: #2563eb; } .bar[data-state="done"] .fill { background: #16a34a; } .label { position: absolute; right: 8px; top: 0; font-size: 12px; line-height: 18px; color: #333; }',
      hints: [
        'Keep only what cannot be worked out: the list of bars in the order added, each with whether it is done. Which bars run is worked out on every render: the first `LIMIT` that are not done. Then "at most 3" holds by construction, and a finished bar frees its slot by itself.',
        'Give each bar its own component. Its effect, on `[state]`, starts an interval when the bar becomes `running`: every 50 ms set `progress` from `(Date.now() - startedAt) / DURATION`, and at 1 tell the parent. The cleanup clears the interval.',
        'The parent marks a bar done with an updater, `setBars(bs => bs.map(…))`, so it never works on an old list. Adding works the same way: `setBars(bs => [...bs, { id, done: false }])`.',
        '`onDone` is a new function on every render of the parent, so listing it in the effect\'s dependencies would restart the bar each time another bar changes. Wrap it: `const finished = useEffectEvent(onDone);` and call `finished()`: it always runs the latest `onDone`, and it is not a dependency.'
      ],
      checks: [
        { label: 'At the start: no bars, "0 running, 0 waiting, 0 done"', fn: `function (doc, win, t) {
  if (t.count('.bar')) return t.count('.bar') + ' bars at the start';
  return t.text('.summary') === '0 running, 0 waiting, 0 done' || 'the summary says "' + t.text('.summary') + '"';
}` },
        { label: 'Add five times: three run and two wait, "3 running, 2 waiting, 0 done"', fn: `async function (doc, win, t) {
  for (var i = 0; i < 5; i++) await t.click('.add');
  var states = [].map.call(doc.querySelectorAll('.bar'), function (b) { return (b.getAttribute('data-state') || '?').charAt(0); }).join('');
  if (states !== 'rrrww') return 'the bars are ' + (states || 'none') + ' (r running, w waiting, d done)';
  return t.text('.summary') === '3 running, 2 waiting, 0 done' || 'the summary says "' + t.text('.summary') + '"';
}` },
        { label: 'Half a second in, a running bar is part full and a waiting one empty', fn: `async function (doc, win, t) {
  await t.wait(450);
  function part(b) { return b.querySelector('.fill').getBoundingClientRect().width / b.getBoundingClientRect().width; }
  var bars = doc.querySelectorAll('.bar');
  var p = part(bars[0]);
  if (!(p > 0.2 && p < 0.9)) return 'the first bar is ' + Math.round(p * 100) + '% full after half a second';
  return part(bars[4]) < 0.05 || 'a waiting bar is ' + Math.round(part(bars[4]) * 100) + '% full';
}` },
        { label: 'When the first three finish, the two waiting start: done, done, done, running, running', fn: `async function (doc, win, t) {
  await t.wait(750);
  var states = [].map.call(doc.querySelectorAll('.bar'), function (b) { return (b.getAttribute('data-state') || '?').charAt(0); }).join('');
  return states === 'dddrr' || 'about 1.2 seconds in, the bars are ' + states + ' (r running, w waiting, d done)';
}` },
        { label: 'All five done: "0 running, 0 waiting, 5 done", every bar full', fn: `async function (doc, win, t) {
  for (var i = 0; i < 30 && t.text('.summary') !== '0 running, 0 waiting, 5 done'; i++) await t.wait(50);
  if (t.text('.summary') !== '0 running, 0 waiting, 5 done') return 'the summary says "' + t.text('.summary') + '"';
  var notFull = [].filter.call(doc.querySelectorAll('.bar'), function (b) { return b.querySelector('.fill').getBoundingClientRect().width / b.getBoundingClientRect().width < 0.99; }).length;
  return !notFull || notFull + ' done bars are not full';
}` },
        { label: 'A bar added while slots are free starts at once', fn: `async function (doc, win, t) {
  await t.click('.add');
  var last = doc.querySelectorAll('.bar')[5];
  return (last && last.getAttribute('data-state') === 'running') || 'the new bar is ' + (last ? last.getAttribute('data-state') : 'missing');
}` },
        { label: 'Adding a bar half a second later does not restart the one already filling', fn: `async function (doc, win, t) {
  await t.wait(500);
  await t.click('.add');
  await t.wait(700);   // the sixth bar started 1.2 s ago, the seventh 0.7 s ago
  var bars = doc.querySelectorAll('.bar');
  var sixth = bars[5].getAttribute('data-state'), seventh = bars[6] && bars[6].getAttribute('data-state');
  if (sixth !== 'done') return 'the bar started 1.2 seconds ago is ' + sixth + ': adding the next one restarted it';
  return seventh === 'running' || 'the bar added 0.7 seconds ago is ' + seventh;
}` }
      ],
      followups: [
        'Run real work through the same queue: uploads, at most 3 at a time, with `fetch` instead of a timer.',
        'Pause and resume all; cancel one bar (a waiting one simply leaves the queue). What changes in the state?',
        'Why does the solution keep only "done" per bar, and work "running" and "waiting" out? What goes wrong if each bar stores its own state?',
        '`requestAnimationFrame` instead of `setInterval` for smooth drawing, and why it stops in a background tab.',
        'Before `useEffectEvent`: how would you call the latest `onDone` from the interval? (A ref that an effect keeps up to date.)'
      ],
      learn: ['lesson:r-effect-cleanup', 'lesson:r-effect-deps', 'lesson:r-lifting-state']
    }
  );
})(window.RLT);
