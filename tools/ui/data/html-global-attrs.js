/*
 * Global attributes: allowed on every HTML element. Shown in a fold on each element page.
 *
 * Attribute shape (same as element attributes in html-*.js):
 *   { name, kind: 'enum'|'boolean'|'text'|'number'|'color', desc, values: [{value, desc}] (enum),
 *     example (text: pre-filled suggestion), min/max/step (number) }
 */
(function (U) {
  U.data.htmlGlobalAttrs = [
    {
      name: 'id', kind: 'text', example: 'intro',
      desc: 'A unique name for this one element. CSS targets it with `#intro`, JavaScript with `document.getElementById("intro")`, and a link with `href="#intro"` jumps to it. No two elements on a page may share an id.'
    },
    {
      name: 'class', kind: 'text', example: 'card highlight',
      desc: 'One or more labels, separated by spaces. Many elements can share a class, and CSS targets it with `.card`. This is the main hook for styling and for finding elements from JavaScript.'
    },
    {
      name: 'style', kind: 'text', example: 'color: crimson; font-weight: bold',
      desc: 'CSS written directly on the element (an "inline style"). Good for quick experiments. In real pages prefer a class: inline styles cannot be reused and beat almost every other rule.'
    },
    {
      name: 'title', kind: 'text', example: 'Extra information',
      desc: 'Text shown as a tooltip when the mouse rests on the element. Touch screens never show it, so do not put anything essential only here.'
    },
    {
      name: 'hidden', kind: 'boolean',
      desc: 'Hides the element completely, as if it were not there (the same as `display: none`). Remove the attribute to show it again; JavaScript does this with `el.hidden = false`.'
    },
    {
      name: 'lang', kind: 'enum',
      desc: 'The language of the text inside. Screen readers use it to pick the right voice, and browsers use it for hyphenation, quotation marks and fonts. Usually set once on `<html>`.',
      values: [
        { value: 'en', desc: 'English.' },
        { value: 'en-IN', desc: 'English as used in India (language + region).' },
        { value: 'hi', desc: 'Hindi.' },
        { value: 'te', desc: 'Telugu.' },
        { value: 'fr', desc: 'French.' },
        { value: 'ja', desc: 'Japanese.' },
        { value: 'ar', desc: 'Arabic (also needs `dir="rtl"` to run right to left).' }
      ]
    },
    {
      name: 'dir', kind: 'enum',
      desc: 'Text direction. Changes which side text starts from and the order of inline content.',
      values: [
        { value: 'ltr', desc: 'Left to right, as in English. The default.' },
        { value: 'rtl', desc: 'Right to left, as in Arabic, Hebrew and Urdu. Text aligns to the right and punctuation moves.' },
        { value: 'auto', desc: 'The browser decides from the first strong letter of the text. Useful for user-written text.' }
      ]
    },
    {
      name: 'tabindex', kind: 'enum',
      desc: 'Controls whether the element can receive keyboard focus with the Tab key. Links, buttons and form fields are focusable already.',
      values: [
        { value: '0', desc: 'Make it focusable, in the normal document order. Use this for custom interactive widgets.' },
        { value: '-1', desc: 'Focusable only from JavaScript (`el.focus()`), skipped by the Tab key. Used for dialogs and error messages.' },
        { value: '1', desc: 'A positive number jumps the queue: focused before everything else. Avoid it; it makes tab order confusing.' }
      ]
    },
    {
      name: 'contenteditable', kind: 'enum',
      desc: 'Lets the user edit the element\'s text directly in the page, like a mini word processor. Click the preview text to try it.',
      values: [
        { value: 'true', desc: 'Editable, including pasting formatted text.' },
        { value: 'plaintext-only', desc: 'Editable, but pasted formatting is dropped.' },
        { value: 'false', desc: 'Not editable (useful inside an editable area).' }
      ]
    },
    {
      name: 'draggable', kind: 'enum',
      desc: 'Whether the element can be dragged with the mouse (the start of drag-and-drop, which needs JavaScript to finish).',
      values: [
        { value: 'true', desc: 'Can be dragged; try dragging the preview element.' },
        { value: 'false', desc: 'Cannot be dragged. Links and images are draggable by default; this turns it off.' }
      ]
    },
    {
      name: 'spellcheck', kind: 'enum',
      desc: 'Whether the browser underlines spelling mistakes in editable text (inputs, textareas, contenteditable).',
      values: [
        { value: 'true', desc: 'Check spelling.' },
        { value: 'false', desc: 'Do not check, e.g. for code or usernames.' }
      ]
    },
    {
      name: 'inert', kind: 'boolean',
      desc: 'Makes the element and everything inside it unclickable and unfocusable, and hides it from screen readers. Used behind open dialogs.'
    },
    {
      name: 'role', kind: 'enum',
      desc: 'Tells assistive technology (screen readers) what the element is, when the tag alone does not say. Prefer the right tag (`<button>`, `<nav>`) over a role whenever possible.',
      values: [
        { value: 'button', desc: 'Behaves as a button. You must also add keyboard support yourself, which is why `<button>` is better.' },
        { value: 'navigation', desc: 'A group of navigation links (same meaning as `<nav>`).' },
        { value: 'alert', desc: 'An important message; screen readers announce it immediately.' },
        { value: 'status', desc: 'A polite status message, announced when the user is idle.' },
        { value: 'img', desc: 'Treat the element as one image (e.g. an emoji or icon group). Pair it with `aria-label`.' },
        { value: 'presentation', desc: 'Remove the element\'s meaning; it is only for looks.' }
      ]
    },
    {
      name: 'aria-label', kind: 'text', example: 'Close dialog',
      desc: 'An invisible name read by screen readers. Use it when the visible content does not say what the element is, e.g. a button that only shows "×".'
    },
    {
      name: 'aria-hidden', kind: 'enum',
      desc: 'Hides the element from screen readers while keeping it visible. For decorative icons.',
      values: [
        { value: 'true', desc: 'Screen readers skip it.' },
        { value: 'false', desc: 'Normal: screen readers read it.' }
      ]
    },
    {
      name: 'data-user-id', kind: 'text', example: '42',
      desc: 'Any attribute that starts with `data-` is yours to invent: `data-user-id`, `data-price`, `data-state`. It stores extra information for your JavaScript (`el.dataset.userId`) and CSS (`[data-state="open"]`). Browsers ignore it otherwise.'
    }
  ];
})(window.UILT);
