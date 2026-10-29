/*
 * Machine coding: the components interviews ask you to build against the clock, each the React
 * version of a plain-JS page in java-interview-practice/AAScratches/11-UI-Practice/01-Components
 * (the `plainjs` field names it). Each batch adds the problems of the track it builds
 * (tests/check_data.py's PLANNED_BUILDS lists which).
 *
 * Problem shape: {id, track, level: 'Easy'|'Medium'|'Hard', minutes (the target), title, summary,
 *   keywords, task (Markdown), starter, solution, css?, hints: [..], checks: [..] (as a lesson
 *   challenge's, see js/challenge.js), followups: [what the interviewer asks once it works],
 *   learn: ['lesson:<id>'], plainjs: the plain-JS page's file name}
 *
 * The checks click, hover and type in the component the way a user would, so they pass for any
 * reasonable solution, not just the one given; the task names the class names they look for.
 */
(function (U) {
  var B = U.data.builds = U.data.builds || [];

  B.push(
    {
      id: 'counter', track: 'foundations', level: 'Easy', minutes: 15, plainjs: 'A01_Counter.html',
      title: 'Counter',
      summary: 'A number with −, + and Reset that never goes below 0. The warm-up most UI rounds start with.',
      keywords: ['counter', 'increment', 'decrement', 'useState', 'disabled', 'reset'],
      task: 'Build a counter: a number with **−**, **+** and **Reset** buttons.\n\n' +
        '- It starts at 0 and never goes below 0.\n' +
        '- The − button is disabled while the count is 0.\n\n' +
        'For the checks: the number goes in `<output className="count">`, and the buttons have `aria-label` `decrement`, `increment` and `reset` (screen readers read a lone "−" badly anyway).',
      starter: `import { useState } from 'react';

export default function Counter() {
  return (
    <div className="counter">
      <button aria-label="decrement">−</button>
      <output className="count">0</output>
      <button aria-label="increment">+</button>
      <button aria-label="reset">Reset</button>
    </div>
  );
}
`,
      solution: `import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="counter">
      <button aria-label="decrement" disabled={count === 0} onClick={() => setCount(c => Math.max(0, c - 1))}>−</button>
      <output className="count">{count}</output>
      <button aria-label="increment" onClick={() => setCount(c => c + 1)}>+</button>
      <button aria-label="reset" onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
`,
      css: '.counter { display: flex; gap: 8px; align-items: center; } .count { font-size: 28px; font-weight: 700; min-width: 2ch; text-align: center; } button { min-width: 40px; height: 36px; }',
      hints: [
        'One piece of state is the whole model: `const [count, setCount] = useState(0);`. Show `{count}` in the `<output>`.',
        'Disable − from the state: `disabled={count === 0}`. React keeps the attribute in step on every render.',
        'Guard the minimum in the update too: `setCount(c => Math.max(0, c - 1))`. The function form always starts from the latest value.'
      ],
      checks: [
        { label: 'It starts at 0, with − disabled', fn: `function (doc, win, t) {
  if (t.text('.count') !== '0') return 'it starts at ' + t.text('.count');
  var dec = doc.querySelector('button[aria-label="decrement"]');
  if (!dec) return 'no button with aria-label="decrement"';
  return dec.disabled || '− is not disabled at 0';
}` },
        { label: '+ three times shows 3, and − is enabled', fn: `async function (doc, win, t) {
  var inc = doc.querySelector('button[aria-label="increment"]');
  if (!inc) return 'no button with aria-label="increment"';
  await t.click(inc); await t.click(inc); await t.click(inc);
  if (t.text('.count') !== '3') return 'it shows ' + t.text('.count');
  return !doc.querySelector('button[aria-label="decrement"]').disabled || '− is still disabled';
}` },
        { label: '− then shows 2', fn: `async function (doc, win, t) {
  await t.click('button[aria-label="decrement"]');
  return t.text('.count') === '2' || 'it shows ' + t.text('.count');
}` },
        { label: 'Reset goes back to 0 and disables − again', fn: `async function (doc, win, t) {
  var reset = doc.querySelector('button[aria-label="reset"]');
  if (!reset) return 'no button with aria-label="reset"';
  await t.click(reset);
  if (t.text('.count') !== '0') return 'it shows ' + t.text('.count');
  return doc.querySelector('button[aria-label="decrement"]').disabled || '− is not disabled after Reset';
}` }
      ],
      followups: [
        'Why `setCount(c => c + 1)` and not `setCount(count + 1)`? What happens if one click calls it three times?',
        'Add a step: + and − move by a number typed in an input. Is the step state, and is the count still one piece of state?',
        'Add a maximum of 10 and disable + at the top.',
        'Keep the count across reloads: read localStorage in `useState(() => …)` and write it in an effect.',
        'Two counters on one page: what does each keep, and why does that come for free in React?'
      ],
      learn: ['lesson:r-state-basics', 'lesson:r-events']
    },
    {
      id: 'star-rating', track: 'foundations', level: 'Easy', minutes: 25, plainjs: 'A02_StarRating.html',
      title: 'Star rating',
      summary: 'Five stars: click to rate, hover to preview, click the same star again to clear.',
      keywords: ['star rating', 'rating', 'stars', 'hover', 'onMouseEnter', 'onMouseLeave', 'useState'],
      task: 'Build a 5-star rating.\n\n' +
        '- Clicking a star sets the rating to it; clicking the **current** rating again clears it to 0.\n' +
        '- Hovering a star lights that many stars as a preview, without changing the rating; leaving the stars shows the rating again.\n' +
        '- Under the stars, a `<p className="rating-text">` says `3 of 5`, or `No rating` at 0.\n\n' +
        'For the checks: five `<button className="star">` inside a `<div className="stars">`, and a lit star also has the class `on` (`className="star on"`).',
      starter: `import { useState } from 'react';

export default function StarRating() {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div>
      <div className="stars">
        {stars.map(n => (
          <button key={n} className="star" aria-label={n + (n === 1 ? ' star' : ' stars')}>★</button>
        ))}
      </div>
      <p className="rating-text">No rating</p>
    </div>
  );
}
`,
      solution: `import { useState } from 'react';

export default function StarRating() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;
  const stars = [1, 2, 3, 4, 5];
  return (
    <div>
      <div className="stars" onMouseLeave={() => setHover(0)}>
        {stars.map(n => (
          <button
            key={n}
            className={n <= shown ? 'star on' : 'star'}
            aria-label={n + (n === 1 ? ' star' : ' stars')}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n === rating ? 0 : n)}
          >
            ★
          </button>
        ))}
      </div>
      <p className="rating-text">{rating ? rating + ' of 5' : 'No rating'}</p>
    </div>
  );
}
`,
      css: '.stars { display: inline-flex; gap: 2px; } .star { font-size: 28px; line-height: 1; border: 0; background: none; color: #c9ced6; cursor: pointer; padding: 2px; } .star.on { color: #f5a623; } .rating-text { margin: 6px 0 0; }',
      hints: [
        'Two numbers are the whole state: `rating` (what was chosen) and `hover` (what the mouse is on, 0 when away).',
        'A star is lit when `n <= (hover || rating)`: the hover wins while it is set, otherwise the rating shows.',
        '`onMouseEnter` on each star sets `hover`; one `onMouseLeave` on the `.stars` container sets it back to 0. The text uses `rating` only.'
      ],
      checks: [
        { label: 'It starts with no star lit, and "No rating"', fn: `function (doc, win, t) {
  if (t.count('.stars .star') !== 5) return 'found ' + t.count('.stars .star') + ' .star buttons in .stars';
  if (t.count('.star.on')) return t.count('.star.on') + ' stars are lit';
  return t.text('.rating-text') === 'No rating' || 'the text says "' + t.text('.rating-text') + '"';
}` },
        { label: 'Clicking the 3rd star lights 3 and says "3 of 5"', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.star')[2]);
  if (t.count('.star.on') !== 3) return t.count('.star.on') + ' stars are lit';
  return t.text('.rating-text') === '3 of 5' || 'the text says "' + t.text('.rating-text') + '"';
}` },
        { label: 'Hovering the 5th star lights 5, but the text stays "3 of 5"', fn: `async function (doc, win, t) {
  await t.hover(doc.querySelectorAll('.star')[4]);
  if (t.count('.star.on') !== 5) return 'while hovering, ' + t.count('.star.on') + ' stars are lit';
  return t.text('.rating-text') === '3 of 5' || 'the text changed to "' + t.text('.rating-text') + '"';
}` },
        { label: 'Leaving the stars lights 3 again', fn: `async function (doc, win, t) {
  await t.leave('.stars');
  return t.count('.star.on') === 3 || 'after leaving, ' + t.count('.star.on') + ' stars are lit';
}` },
        { label: 'Clicking the 3rd star again clears it: "No rating"', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.star')[2]);
  if (t.count('.star.on')) return t.count('.star.on') + ' stars are still lit';
  return t.text('.rating-text') === 'No rating' || 'the text says "' + t.text('.rating-text') + '"';
}` }
      ],
      followups: [
        'Why two pieces of state, `rating` and `hover`, rather than one?',
        'Make it reusable and controlled: `<StarRating value={v} onChange={setV} max={10} />`. Where does the state live now?',
        'Accessibility: `role="radiogroup"`, each star `role="radio"` with `aria-checked`, and the arrow keys moving the rating.',
        'Half stars: two hit areas per star, giving n − 0.5 for the left half.',
        'A read-only version showing an average such as 3.7.'
      ],
      learn: ['lesson:r-state-basics', 'lesson:r-lists-keys', 'lesson:r-events']
    },
    {
      id: 'accordion', track: 'foundations', level: 'Easy', minutes: 20, plainjs: 'A03_Accordion.html',
      title: 'Accordion',
      summary: 'Titles that open their section, one section at a time, with aria-expanded kept right.',
      keywords: ['accordion', 'collapse', 'expand', 'aria-expanded', 'toggle', 'one open', 'useState'],
      task: 'Build an accordion from the given `items` (each has a `title` and a `body`).\n\n' +
        '- Each title is a `<button className="acc-title">`; clicking it shows that item\'s body.\n' +
        '- Only one body is open at a time: opening one closes the others.\n' +
        '- Clicking the open title closes it, so everything is closed.\n' +
        '- Each button\'s `aria-expanded` is `"true"` exactly when its body shows.\n\n' +
        'For the checks: a body is a `<div className="acc-body">`, rendered only while it is open (or kept in the page with the `hidden` attribute while closed).',
      starter: `import { useState } from 'react';

const items = [
  { title: 'Shipping', body: 'Orders ship within 2 working days.' },
  { title: 'Returns', body: 'Return anything within 30 days.' },
  { title: 'Warranty', body: 'Every product has a 1-year warranty.' }
];

export default function Accordion() {
  return (
    <div className="accordion">
      {items.map(item => (
        <div key={item.title} className="acc-item">
          <button className="acc-title">{item.title}</button>
          <div className="acc-body">{item.body}</div>
        </div>
      ))}
    </div>
  );
}
`,
      solution: `import { useState } from 'react';

const items = [
  { title: 'Shipping', body: 'Orders ship within 2 working days.' },
  { title: 'Returns', body: 'Return anything within 30 days.' },
  { title: 'Warranty', body: 'Every product has a 1-year warranty.' }
];

export default function Accordion() {
  const [open, setOpen] = useState(-1);
  return (
    <div className="accordion">
      {items.map((item, i) => (
        <div key={item.title} className="acc-item">
          <button
            className="acc-title"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            {item.title}
          </button>
          {open === i && <div className="acc-body">{item.body}</div>}
        </div>
      ))}
    </div>
  );
}
`,
      css: '.accordion { max-width: 360px; border: 1px solid #ccd; border-radius: 8px; overflow: hidden; } .acc-item + .acc-item { border-top: 1px solid #ccd; } .acc-title { display: block; width: 100%; text-align: left; padding: 10px 12px; border: 0; background: #f4f6f9; font-weight: 600; cursor: pointer; } .acc-body { padding: 10px 12px; }',
      hints: [
        'One index is the whole state: `const [open, setOpen] = useState(-1);`, -1 meaning "all closed". "Only one open" then needs no extra code: two open panels cannot even be written down.',
        'Toggle in the click: `setOpen(open === i ? -1 : i)`.',
        'Render the body only for the open item, `{open === i && <div className="acc-body">…</div>}`, and set `aria-expanded={open === i}` on the button.'
      ],
      checks: [
        { label: 'It starts with every body closed', fn: `function (doc, win, t) {
  var open = [].filter.call(doc.querySelectorAll('.acc-body'), function (b) { return !b.hidden; }).length;
  if (t.count('.acc-title') !== 3) return 'found ' + t.count('.acc-title') + ' .acc-title buttons';
  return open === 0 || open + ' bodies show at the start';
}` },
        { label: 'Clicking "Shipping" opens it, with aria-expanded="true"', fn: `async function (doc, win, t) {
  var b = doc.querySelectorAll('.acc-title')[0];
  await t.click(b);
  var open = [].filter.call(doc.querySelectorAll('.acc-body'), function (x) { return !x.hidden; });
  if (open.length !== 1 || !/2 working days/.test(open[0].textContent)) return open.length + ' bodies show: ' + open.map(function (x) { return x.textContent.trim(); }).join(' | ');
  return doc.querySelectorAll('.acc-title')[0].getAttribute('aria-expanded') === 'true' || 'its aria-expanded is ' + doc.querySelectorAll('.acc-title')[0].getAttribute('aria-expanded');
}` },
        { label: 'Clicking "Returns" opens it and closes Shipping', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.acc-title')[1]);
  var open = [].filter.call(doc.querySelectorAll('.acc-body'), function (x) { return !x.hidden; });
  if (open.length !== 1 || !/30 days/.test(open[0].textContent)) return open.length + ' bodies show: ' + open.map(function (x) { return x.textContent.trim(); }).join(' | ');
  var ex = [].map.call(doc.querySelectorAll('.acc-title'), function (x) { return x.getAttribute('aria-expanded'); }).join(',');
  return ex === 'false,true,false' || 'aria-expanded reads ' + ex;
}` },
        { label: 'Clicking "Returns" again closes everything', fn: `async function (doc, win, t) {
  await t.click(doc.querySelectorAll('.acc-title')[1]);
  var open = [].filter.call(doc.querySelectorAll('.acc-body'), function (x) { return !x.hidden; }).length;
  if (open) return open + ' bodies still show';
  var ex = [].map.call(doc.querySelectorAll('.acc-title'), function (x) { return x.getAttribute('aria-expanded'); }).join(',');
  return ex === 'false,false,false' || 'aria-expanded reads ' + ex;
}` }
      ],
      followups: [
        'Why is one index better state than a true/false per item?',
        'Allow several open at once: the state becomes a `Set` of indexes. What changes in the toggle, and why must you build a new Set rather than `add` to the old one?',
        'Keyboard: Arrow Up / Down move between titles, Home / End jump to the first / last.',
        'Make it controlled: the parent passes `openIndex` and `onChange`. When would you want that?',
        'Animate the height without measuring in JavaScript (CSS `grid-template-rows: 0fr` → `1fr`).'
      ],
      learn: ['lesson:r-state-basics', 'lesson:r-conditional', 'lesson:r-lists-keys']
    }
  );
})(window.RLT);
