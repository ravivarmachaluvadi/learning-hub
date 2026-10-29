/*
 * HTML elements, part 4: forms and interactive elements.
 * Entry shape: see html-1-document.js. In previews, submitting a form does not send anything;
 * the message under the preview shows what the browser would have sent.
 */
(function (U) {
  var E = U.data.htmlElements = U.data.htmlElements || [];

  var FORM_CSS = 'label { display: inline-block; margin: 4px 0; }\ninput, select, textarea, button { font: inherit; }';

  E.push(
    {
      tag: 'form', category: 'Forms', display: 'block', short: 'a form that sends data',
      summary: 'A form: collects input fields and sends their values to a server when submitted.',
      description: 'When the user presses a submit button (or Enter in a field), the browser checks the fields (`required`, `type="email"`…), then sends every field that has a `name` to the `action` URL using the `method`. Try submitting with empty fields, then filled in, and read the message under the preview.',
      java: 'The browser builds the request for you: with `method="post"` it is like a Spring `@PostMapping("/signup")` receiving `@RequestParam String name, @RequestParam String email`. The field `name` attributes are the parameter names.',
      attributes: [
        {
          name: 'action', kind: 'text', example: '/signup', desc: 'The URL that receives the data. Not set: the current page.',
          suggestions: ['/signup', '/search', 'https://example.com/api/contact']
        },
        {
          name: 'method', kind: 'enum', desc: 'How to send the data.', unset: 'Not set: GET.',
          values: [
            { value: 'get', desc: 'Values go in the URL: `/search?q=css`. For searches and filters - things you could bookmark. Never for passwords.' },
            { value: 'post', desc: 'Values go in the request body, not the URL. For anything that changes data: sign-ups, orders, logins.' },
            { value: 'dialog', desc: 'Inside a `<dialog>`: closes the dialog instead of sending anything.' }
          ]
        },
        {
          name: 'enctype', kind: 'enum', desc: 'How a POST body is encoded.',
          values: [
            { value: 'application/x-www-form-urlencoded', desc: 'name=Ravi&email=r%40x.com (the default).' },
            { value: 'multipart/form-data', desc: 'Required when the form uploads files (`<input type="file">`).' },
            { value: 'text/plain', desc: 'Plain text; only useful for debugging.' }
          ]
        },
        { name: 'novalidate', kind: 'boolean', desc: 'Skip the browser\'s built-in checks (`required`, email format…) on submit. Useful when your JavaScript validates instead.' },
        {
          name: 'autocomplete', kind: 'enum', desc: 'Whether the browser may fill in fields from what the user typed before.',
          values: [
            { value: 'on', desc: 'Allowed (the default).' },
            { value: 'off', desc: 'Discouraged for the whole form. Browsers may still offer saved passwords.' }
          ]
        },
        {
          name: 'target', kind: 'enum', desc: 'Where to show the server\'s response.',
          values: [
            { value: '_self', desc: 'This tab (the default).' },
            { value: '_blank', desc: 'A new tab.' }
          ]
        }
      ],
      start: { action: '/signup', method: 'post' },
      content: '\n  <label>Name <input name="name" required></label><br>\n  <label>Email <input name="email" type="email" required></label><br>\n  <button>Sign up</button>\n',
      demo: '<form{{attrs}}>{{content}}</form>',
      demoCss: FORM_CSS,
      tips: ['Every field you want sent needs a `name`. A field without a name is silently left out.'],
      mistakes: ['Wrapping inputs in a `<div>` and handling the "submit" click in JavaScript, instead of using a real `<form>`. You lose Enter-to-submit, validation and accessibility for free.'],
      related: ['input', 'label', 'button', 'fieldset', 'js:forms', 'lesson:html-forms'],
      keywords: ['form', 'submit', 'post', 'get', 'action', 'validation', 'request']
    },
    {
      tag: 'label', category: 'Forms', display: 'inline', short: 'caption for a field',
      summary: 'A caption for a form field. Clicking the label focuses (or ticks) its field.',
      description: 'Connect it with `for="the-field-id"`, or wrap the field inside the label. Either way screen readers read the label when the field is focused, and the click area gets bigger - a real help with small checkboxes.',
      attributes: [
        { name: 'for', kind: 'text', example: 'email', desc: 'The `id` of the field this label belongs to. Clear it and clicking the label no longer focuses the field.' }
      ],
      start: { for: 'email' },
      content: 'Email address',
      demo: '<label{{attrs}}>{{content}}</label>\n<input id="email" type="email" placeholder="you@example.com">\n<p>Click the label text: the field gets focus.</p>',
      tips: ['Wrapping works without ids: `<label><input type="checkbox"> Remember me</label>`.'],
      mistakes: ['Using placeholder text instead of a label. The placeholder disappears as soon as you type.'],
      related: ['input', 'form', 'fieldset'],
      keywords: ['label', 'caption', 'for', 'accessibility']
    },
    {
      tag: 'input', category: 'Forms', display: 'inline-block', void: true, short: 'a form field (22 types)',
      summary: 'A form field. Its `type` decides what it is: a text box, a checkbox, a date picker, a slider, a colour picker and more.',
      description: 'One element, many controls. Each `type` brings its own look, its own phone keyboard and its own validation. Hover the type chips to flip through all 22. Fields only send their value when the form is submitted, and only if they have a `name`.',
      java: 'Choosing `type` is like choosing the field\'s Java type: `type="number"` ≈ `int`, `type="checkbox"` ≈ `boolean`, `type="date"` ≈ `LocalDate`. The browser validates the format for you - but the server must validate again.',
      attributes: [
        {
          name: 'type', kind: 'enum', desc: 'What kind of field this is.', unset: 'Not set: a text field (type="text").',
          values: [
            { value: 'text', desc: 'A single line of text. The default.' },
            { value: 'password', desc: 'Text shown as dots. Browsers offer to save and generate passwords for it.' },
            { value: 'email', desc: 'An email address: checked for an @ on submit; phones show a keyboard with @.' },
            { value: 'number', desc: 'A number, with up/down arrows. Use `min`, `max` and `step`. Not for phone numbers or PIN codes (use tel/text).' },
            { value: 'tel', desc: 'A phone number: phones show a number pad. No format check (phone formats vary too much).' },
            { value: 'url', desc: 'A web address: must start with a scheme like https://.' },
            { value: 'search', desc: 'A search box: may show a × to clear it, and the Enter key says "Search" on phones.' },
            { value: 'date', desc: 'A date with a calendar picker. The value is always YYYY-MM-DD, whatever the display format.' },
            { value: 'time', desc: 'A time of day (HH:MM).' },
            { value: 'datetime-local', desc: 'A date and a time, without a time zone.' },
            { value: 'month', desc: 'A year and month (YYYY-MM).' },
            { value: 'week', desc: 'A year and week number (YYYY-W41).' },
            { value: 'color', desc: 'A colour picker. The value is a hex colour like #4353c9.' },
            { value: 'range', desc: 'A slider for an approximate number, between `min` and `max` (default 0-100).' },
            { value: 'checkbox', desc: 'A tick box: on or off. Sends its `value` (default "on") only when ticked.' },
            { value: 'radio', desc: 'One choice from a group: radios with the same `name` form a group, and only one can be selected.' },
            { value: 'file', desc: 'Pick file(s) to upload. Use `accept` to limit types and `multiple` for several. The form needs `enctype="multipart/form-data"`.' },
            { value: 'submit', desc: 'A button that submits the form. Its `value` is the button text. (`<button>` is more flexible.)' },
            { value: 'reset', desc: 'A button that resets every field of the form to its starting value. Rarely a good idea.' },
            { value: 'button', desc: 'A button that does nothing until JavaScript gives it a job.' },
            { value: 'hidden', desc: 'Invisible: sends a value the user does not see, like an id or a security token. Nothing appears in the preview.' },
            { value: 'image', desc: 'A submit button drawn as an image (`src`). Rarely used today.' }
          ]
        },
        { name: 'name', kind: 'text', example: 'email', desc: 'The key under which the value is sent. Without a name, the field is not sent at all.' },
        { name: 'value', kind: 'text', example: 'Hello', desc: 'The starting value (or, for checkbox/radio/submit, the value sent / the button text).' },
        { name: 'placeholder', kind: 'text', example: 'you@example.com', desc: 'A hint shown inside an empty field. It disappears when the user types, so it is not a replacement for a label.' },
        { name: 'required', kind: 'boolean', desc: 'The form cannot be submitted while this field is empty. Try Submit with it empty.' },
        { name: 'disabled', kind: 'boolean', desc: 'Greyed out: cannot be focused or changed, and is not sent with the form.' },
        { name: 'readonly', kind: 'boolean', desc: 'Cannot be changed, but can be focused, selected and copied, and is sent with the form.' },
        { name: 'checked', kind: 'boolean', desc: 'For checkbox and radio: ticked to begin with.' },
        {
          name: 'min', kind: 'text', example: '1', desc: 'The smallest allowed value, for number, range and the date/time types.',
          suggestions: ['0', '1', '2026-01-01', '09:00']
        },
        {
          name: 'max', kind: 'text', example: '10', desc: 'The largest allowed value.',
          suggestions: ['10', '100', '2026-12-31', '18:00']
        },
        {
          name: 'step', kind: 'text', example: '5', desc: 'The allowed increments: `step="5"` allows 0, 5, 10… `step="any"` allows decimals; for type="time", step is in seconds.',
          suggestions: ['1', '5', '0.5', 'any', '900']
        },
        { name: 'minlength', kind: 'number', min: 0, max: 20, example: 3, desc: 'The fewest characters allowed (checked on submit).' },
        { name: 'maxlength', kind: 'number', min: 1, max: 30, example: 10, desc: 'The most characters allowed: the field stops accepting typing at this length.' },
        {
          name: 'pattern', kind: 'text', example: '[0-9]{6}', desc: 'A regular expression the whole value must match, checked on submit. Explain the format in the label or `title`.',
          suggestions: [{ value: '[0-9]{6}', desc: 'an Indian PIN code: exactly 6 digits' }, { value: '[A-Za-z]+', desc: 'letters only' }, { value: '[A-Z]{5}[0-9]{4}[A-Z]', desc: 'a PAN number' }]
        },
        { name: 'size', kind: 'number', min: 2, max: 60, example: 30, desc: 'The visible width, in characters (CSS `width` is more common).' },
        { name: 'multiple', kind: 'boolean', desc: 'For email and file: allow several values (comma-separated emails, or several files).' },
        {
          name: 'accept', kind: 'text', example: 'image/*', desc: 'For type="file": which file types the picker offers.',
          suggestions: ['image/*', '.pdf', '.png,.jpg', 'audio/*,video/*']
        },
        {
          name: 'autocomplete', kind: 'enum', desc: 'Tells the browser what this field is, so it can offer the right saved value (or a password generator).',
          values: [
            { value: 'on', desc: 'The browser may suggest earlier entries.' },
            { value: 'off', desc: 'Do not suggest earlier entries.' },
            { value: 'name', desc: 'The person\'s full name.' },
            { value: 'email', desc: 'An email address.' },
            { value: 'username', desc: 'A login name.' },
            { value: 'current-password', desc: 'The existing password (login forms).' },
            { value: 'new-password', desc: 'A new password (sign-up forms): browsers offer to generate one.' },
            { value: 'tel', desc: 'A phone number.' },
            { value: 'postal-code', desc: 'A postal code / PIN code.' },
            { value: 'one-time-code', desc: 'An OTP: phones offer the code from the SMS just received.' }
          ]
        },
        {
          name: 'inputmode', kind: 'enum', desc: 'Which on-screen keyboard phones show, without changing the type or validation.',
          values: [
            { value: 'text', desc: 'The normal keyboard.' },
            { value: 'numeric', desc: 'Digits only: for PIN codes, OTPs, card numbers.' },
            { value: 'decimal', desc: 'Digits with a decimal point.' },
            { value: 'tel', desc: 'A phone keypad.' },
            { value: 'email', desc: 'A keyboard with @ and .' },
            { value: 'url', desc: 'A keyboard with / and .com' },
            { value: 'search', desc: 'A keyboard whose Enter key says "Search".' },
            { value: 'none', desc: 'No keyboard (the page provides its own).' }
          ]
        },
        { name: 'list', kind: 'text', example: 'fruits', desc: 'The id of a `<datalist>` with suggestions. The demo page has one with id="fruits"; type "a" to see them.' }
      ],
      start: { type: 'text', name: 'answer', placeholder: 'Type here' },
      demo: function (v, content, variant, attrs) {
        var extra = v.type === 'image' ? ' src="avatar.svg" alt="Submit" width="48"' : '';
        return '<form>\n  <label>Your answer: <input' + attrs + extra + '></label>\n  <button>Submit</button>\n</form>\n' +
          '<datalist id="fruits">\n  <option value="Apple">\n  <option value="Banana">\n  <option value="Mango">\n  <option value="Papaya">\n</datalist>';
      },
      demoCss: FORM_CSS,
      tips: ['Pick the most specific `type`: phones show a better keyboard, browsers validate for you, and password managers recognise the field.', 'Style invalid fields with CSS `input:invalid { border-color: red; }`.'],
      mistakes: ['Forgetting `name`: the form submits without that value.', 'Using `type="number"` for things that are not quantities (phone, PIN, card number). Use `type="text"` with `inputmode="numeric"`.'],
      related: ['label', 'form', 'textarea', 'select', 'button', 'datalist', 'js:forms', 'lesson:html-forms'],
      keywords: ['input', 'field', 'textbox', 'checkbox', 'radio', 'date picker', 'slider', 'range', 'password', 'email', 'file upload', 'color picker']
    },
    {
      tag: 'textarea', category: 'Forms', display: 'inline-block', short: 'multi-line text field',
      summary: 'A multi-line text field, for messages, comments and addresses.',
      description: 'Its starting text goes between the tags (not in a `value` attribute). Users can resize it by dragging the corner unless CSS says `resize: none`.',
      attributes: [
        { name: 'name', kind: 'text', example: 'message', desc: 'The key under which the text is sent.' },
        { name: 'rows', kind: 'number', min: 1, max: 15, example: 4, desc: 'Visible height, in lines of text (default 2).' },
        { name: 'cols', kind: 'number', min: 10, max: 80, example: 40, desc: 'Visible width, in characters (default 20).' },
        { name: 'placeholder', kind: 'text', example: 'Write your message…', desc: 'A hint shown while it is empty.' },
        { name: 'maxlength', kind: 'number', min: 1, max: 500, example: 140, desc: 'The most characters allowed.' },
        { name: 'minlength', kind: 'number', min: 0, max: 100, example: 10, desc: 'The fewest characters allowed (checked on submit).' },
        {
          name: 'wrap', kind: 'enum', desc: 'How long lines wrap.',
          values: [
            { value: 'soft', desc: 'Lines wrap on screen, but no line breaks are added to the sent text (the default).' },
            { value: 'hard', desc: 'Wrap points become real line breaks in the sent text (needs `cols`).' },
            { value: 'off', desc: 'No wrapping: long lines scroll sideways.' }
          ]
        },
        { name: 'required', kind: 'boolean', desc: 'Must not be empty on submit.' },
        { name: 'readonly', kind: 'boolean', desc: 'Visible and selectable, but cannot be edited.' },
        { name: 'disabled', kind: 'boolean', desc: 'Greyed out and not sent.' }
      ],
      start: { name: 'message', rows: '4', cols: '40' },
      content: 'The starting text goes between the tags.',
      contentKind: 'text',
      demo: '<form>\n  <label>Message<br>\n    <textarea{{attrs}}>{{content}}</textarea>\n  </label><br>\n  <button>Send</button>\n</form>',
      demoCss: FORM_CSS,
      mistakes: ['Writing `<textarea value="…">`. It has no value attribute; the text goes between the tags.', 'Indenting the closing tag on a new line: the spaces become part of the text.'],
      related: ['input', 'label', 'css:resize'],
      keywords: ['multiline', 'text area', 'message', 'comment box']
    },
    {
      tag: 'select', category: 'Forms', display: 'inline-block', short: 'drop-down list',
      summary: 'A drop-down list of `<option>`s to choose from.',
      description: 'The option with `selected` is chosen at the start; otherwise the first one. Each option\'s `value` is what gets sent. With `multiple` or `size`, it becomes a list box instead of a drop-down.',
      attributes: [
        { name: 'name', kind: 'text', example: 'city', desc: 'The key under which the chosen value is sent.' },
        { name: 'multiple', kind: 'boolean', desc: 'Allow choosing several options (Ctrl/Cmd+click). Shows as a list box.' },
        { name: 'size', kind: 'number', min: 1, max: 8, example: 4, desc: 'How many options are visible at once. More than 1 shows a list box.' },
        { name: 'required', kind: 'boolean', desc: 'A real choice must be made (the first option must have `value=""` to act as the placeholder).' },
        { name: 'disabled', kind: 'boolean', desc: 'Greyed out and not sent.' }
      ],
      start: { name: 'city' },
      content: '\n  <option value="">Choose a city…</option>\n  <optgroup label="South">\n    <option value="blr">Bengaluru</option>\n    <option value="hyd">Hyderabad</option>\n    <option value="che">Chennai</option>\n  </optgroup>\n  <optgroup label="North">\n    <option value="del">Delhi</option>\n    <option value="chd">Chandigarh</option>\n  </optgroup>\n',
      demo: '<form>\n  <label>City <select{{attrs}}>{{content}}</select></label>\n  <button>Go</button>\n</form>',
      demoCss: FORM_CSS,
      related: ['option', 'optgroup', 'datalist', 'input'],
      keywords: ['dropdown', 'drop down', 'combo box', 'list box', 'choose']
    },
    {
      tag: 'option', category: 'Forms', display: 'block', short: 'one choice in a list',
      summary: 'One choice inside a `<select>` or `<datalist>`.',
      description: 'The text between the tags is what the user sees; `value` is what is sent. If `value` is missing, the text is sent.',
      attributes: [
        { name: 'value', kind: 'text', example: 'hyd', desc: 'The value sent with the form.' },
        { name: 'selected', kind: 'boolean', desc: 'Chosen at the start.' },
        { name: 'disabled', kind: 'boolean', desc: 'Visible but cannot be chosen.' },
        { name: 'label', kind: 'text', example: 'HYD', desc: 'A shorter text to show instead of the content.' }
      ],
      start: { value: 'hyd', selected: true },
      content: 'Hyderabad',
      contentKind: 'text',
      demo: '<select size="4">\n  <option value="blr">Bengaluru</option>\n  <option{{attrs}}>{{content}}</option>\n  <option value="che">Chennai</option>\n  <option value="del">Delhi</option>\n</select>',
      related: ['select', 'optgroup', 'datalist'],
      keywords: ['option', 'choice', 'dropdown item']
    },
    {
      tag: 'optgroup', category: 'Forms', display: 'block', short: 'group of options',
      summary: 'A labelled group of options inside a `<select>`. The label is shown in bold and cannot be chosen.',
      description: 'For long lists: group cities by region, products by category.',
      attributes: [
        { name: 'label', kind: 'text', example: 'South', required: true, desc: 'The group heading shown in the list.' },
        { name: 'disabled', kind: 'boolean', desc: 'Every option in the group becomes unavailable.' }
      ],
      start: { label: 'South' },
      content: '\n    <option>Bengaluru</option>\n    <option>Hyderabad</option>\n  ',
      demo: '<select size="6">\n  <optgroup{{attrs}}>{{content}}</optgroup>\n  <optgroup label="North">\n    <option>Delhi</option>\n    <option>Chandigarh</option>\n  </optgroup>\n</select>',
      related: ['select', 'option'],
      keywords: ['option group', 'grouped options']
    },
    {
      tag: 'button', category: 'Forms', display: 'inline-block', short: 'clickable button',
      summary: 'A clickable button. Inside a form it submits the form by default; elsewhere it waits for JavaScript.',
      description: 'Buttons are focusable and work with Enter and Space out of the box, which a clickable `<div>` does not. Always set `type`, so nobody is surprised by an accidental submit.',
      java: 'Like a Swing `JButton`: it does nothing until you attach a listener - except inside a form, where its default action is "submit".',
      attributes: [
        {
          name: 'type', kind: 'enum', desc: 'What the button does on its own.', unset: 'Not set: "submit" inside a form - a frequent surprise.',
          values: [
            { value: 'submit', desc: 'Submits its form (the default inside a form).' },
            { value: 'reset', desc: 'Resets the form\'s fields to their starting values. Type something, then try it.' },
            { value: 'button', desc: 'Does nothing by itself. For buttons driven by JavaScript.' }
          ]
        },
        { name: 'disabled', kind: 'boolean', desc: 'Greyed out and unclickable.' },
        { name: 'name', kind: 'text', example: 'action', desc: 'If the button submits, `name=value` is sent too, so the server knows which button was pressed.' },
        { name: 'value', kind: 'text', example: 'save', desc: 'The value sent with `name`.' }
      ],
      start: { type: 'submit' },
      content: 'Send',
      demo: '<form>\n  <label>Name <input name="name" value="Ravi"></label>\n  <button{{attrs}}>{{content}}</button>\n</form>',
      demoCss: FORM_CSS,
      tips: ['A button can contain other elements, e.g. an icon and text: `<button><svg>…</svg> Save</button>`.'],
      mistakes: ['A `<div onclick>` instead of a button: not focusable, ignores the keyboard, invisible to screen readers.'],
      related: ['form', 'input', 'a', 'js:events', 'css:cursor'],
      keywords: ['button', 'click', 'submit', 'reset']
    },
    {
      tag: 'fieldset', category: 'Forms', display: 'block', short: 'group of fields',
      summary: 'Groups related fields, with a `<legend>` as the group\'s title. Drawn with a border by default.',
      description: 'Essential for radio buttons and checkboxes: the legend gives the question ("Size?") and each label gives an answer. `disabled` on the fieldset disables every field inside at once.',
      attributes: [
        { name: 'disabled', kind: 'boolean', desc: 'Disable every field inside.' },
        { name: 'name', kind: 'text', example: 'shipping', desc: 'A name for the group (used from JavaScript).' }
      ],
      contentKind: 'none',
      demo: '<form>\n  <fieldset{{attrs}}>\n    <legend>Choose a size</legend>\n    <label><input type="radio" name="size" value="s"> Small</label>\n    <label><input type="radio" name="size" value="m" checked> Medium</label>\n    <label><input type="radio" name="size" value="l"> Large</label>\n  </fieldset>\n  <button>Order</button>\n</form>',
      demoCss: FORM_CSS + '\nlabel { margin-right: 10px; }',
      related: ['legend', 'input', 'form'],
      keywords: ['group', 'radio group', 'fieldset', 'border']
    },
    {
      tag: 'legend', category: 'Forms', display: 'block', short: 'title of a fieldset',
      summary: 'The title of a `<fieldset>`. Sits on the fieldset\'s border by default.',
      description: 'Screen readers read it together with each field in the group: "Choose a size, Medium, radio button".',
      attributes: [],
      content: 'Choose a size',
      contentKind: 'text',
      demo: '<fieldset>\n  <legend{{attrs}}>{{content}}</legend>\n  <label><input type="radio" name="size"> Small</label>\n  <label><input type="radio" name="size"> Large</label>\n</fieldset>',
      related: ['fieldset'],
      keywords: ['fieldset title', 'group label']
    },
    {
      tag: 'datalist', category: 'Forms', display: 'none', short: 'suggestions for an input',
      summary: 'A list of suggestions for an `<input>`. Unlike `<select>`, the user may still type anything.',
      description: 'Connect it with the input\'s `list` attribute, matching the datalist\'s `id`. Click the field (or type "a") to see the suggestions.',
      attributes: [],
      start: { id: 'fruits' },
      content: '\n  <option value="Apple">\n  <option value="Banana">\n  <option value="Mango">\n  <option value="Papaya">\n',
      demo: '<label>Favourite fruit <input list="fruits"></label>\n<datalist{{attrs}}>{{content}}</datalist>\n<p>The input\'s list="fruits" points to the datalist\'s id="fruits".</p>',
      related: ['input', 'select', 'option'],
      keywords: ['autocomplete', 'suggestions', 'combobox']
    },
    {
      tag: 'output', category: 'Forms', display: 'inline', short: 'result of a calculation',
      summary: 'Shows the result of a calculation or a user action. Screen readers announce changes to it.',
      description: '`for` lists the ids of the fields the result depends on. The demo updates it with a tiny bit of JavaScript in the form\'s `oninput` attribute. Change the numbers.',
      attributes: [
        { name: 'for', kind: 'text', example: 'a b', desc: 'The ids of the inputs this result is calculated from, separated by spaces.' },
        { name: 'name', kind: 'text', example: 'result', desc: 'Name for scripts (and the form).' }
      ],
      start: { for: 'a b', name: 'result' },
      content: '5',
      contentKind: 'text',
      demo: '<form oninput="result.value = Number(a.value) + Number(b.value)">\n  <input id="a" type="number" value="2"> +\n  <input id="b" type="number" value="3"> =\n  <output{{attrs}}>{{content}}</output>\n</form>',
      demoCss: 'input { width: 60px; }\noutput { font-weight: 700; }',
      related: ['input', 'form', 'js:events'],
      keywords: ['result', 'calculation', 'output']
    },
    {
      tag: 'progress', category: 'Forms', display: 'inline-block', short: 'progress bar',
      summary: 'A progress bar for a task: an upload, a download, steps of a form.',
      description: 'With `value` it shows how far along the task is (value out of `max`). Without `value` it shows an "indeterminate" animation: busy, but unknown how long. Click "(not set)" on value to see it.',
      attributes: [
        { name: 'value', kind: 'number', min: 0, max: 100, example: 70, desc: 'How much is done.' },
        { name: 'max', kind: 'number', min: 1, max: 200, example: 100, desc: 'The total (default 1).' }
      ],
      start: { value: '70', max: '100' },
      content: '70%',
      contentKind: 'text',
      contentHelp: 'Fallback text for old browsers.',
      demo: '<label>Uploading… <progress{{attrs}}>{{content}}</progress></label>',
      demoCss: 'progress { width: 240px; }',
      related: ['meter', 'css:accent-color'],
      keywords: ['progress bar', 'loading', 'upload']
    },
    {
      tag: 'meter', category: 'Forms', display: 'inline-block', short: 'gauge',
      summary: 'A gauge showing a measurement within a known range: disk usage, battery, a score. Changes colour as the value crosses `low` and `high`.',
      description: 'Not for progress (use `<progress>`). The colour depends on where `value` sits relative to `low`, `high` and `optimum`: green in the good zone, yellow in the so-so zone, red in the bad zone. Move the value slider and watch.',
      attributes: [
        { name: 'value', kind: 'number', min: 0, max: 100, example: 60, desc: 'The current measurement.' },
        { name: 'min', kind: 'number', min: 0, max: 50, example: 0, desc: 'The lower bound (default 0).' },
        { name: 'max', kind: 'number', min: 50, max: 100, example: 100, desc: 'The upper bound (default 1).' },
        { name: 'low', kind: 'number', min: 0, max: 100, example: 30, desc: 'Values below this are "low".' },
        { name: 'high', kind: 'number', min: 0, max: 100, example: 80, desc: 'Values above this are "high".' },
        { name: 'optimum', kind: 'number', min: 0, max: 100, example: 90, desc: 'The best value. Its zone (low, middle or high) is drawn green.' }
      ],
      start: { value: '60', min: '0', max: '100', low: '30', high: '80', optimum: '90' },
      content: '60 of 100',
      contentKind: 'text',
      demo: '<label>Battery <meter{{attrs}}>{{content}}</meter></label>',
      demoCss: 'meter { width: 240px; height: 22px; }',
      related: ['progress'],
      keywords: ['gauge', 'meter', 'battery', 'level', 'score']
    },

    /* ---------- Interactive ---------- */
    {
      tag: 'details', category: 'Interactive', display: 'block', short: 'show/hide section',
      summary: 'A section the user can open and close. The first child, `<summary>`, is always visible and toggles the rest.',
      description: 'An accordion with no JavaScript at all. Give several details the same `name` and opening one closes the others (an exclusive accordion).',
      attributes: [
        { name: 'open', kind: 'boolean', desc: 'Open at the start. The browser adds or removes this attribute as the user toggles.' },
        { name: 'name', kind: 'text', example: 'faq', desc: 'Details sharing the same name form a group in which only one can be open. The demo gives the other two the same name when you set it.' }
      ],
      content: '\n  <summary>What is HTML?</summary>\n  <p>The language that describes the structure of web pages.</p>\n',
      demo: function (v, content, variant, attrs) {
        var nm = v.name ? ' name="' + U.escAttr(v.name) + '"' : '';
        return '<details' + attrs + '>' + content + '</details>\n<details' + nm + '>\n  <summary>What is CSS?</summary>\n  <p>The language that describes how pages look.</p>\n</details>\n<details' + nm + '>\n  <summary>What is JavaScript?</summary>\n  <p>The language that makes pages interactive.</p>\n</details>';
      },
      demoCss: 'details { border: 1px solid #d9dde8; border-radius: 6px; padding: 6px 10px; margin: 6px 0; }\nsummary { cursor: pointer; font-weight: 600; }',
      related: ['summary', 'dialog', 'css:cursor'],
      keywords: ['accordion', 'collapse', 'expand', 'toggle', 'faq', 'disclosure']
    },
    {
      tag: 'summary', category: 'Interactive', display: 'list-item', short: 'heading of a details',
      summary: 'The always-visible heading of a `<details>` element. Clicking it opens or closes the details.',
      description: 'It shows a triangle marker by default; restyle or hide it with CSS (`summary::marker` or `list-style: none`).',
      attributes: [],
      content: 'What is HTML? (click me)',
      demo: '<details>\n  <summary{{attrs}}>{{content}}</summary>\n  <p>The language that describes the structure of web pages.</p>\n</details>',
      demoCss: 'summary { cursor: pointer; font-weight: 600; }',
      related: ['details'],
      keywords: ['accordion heading', 'disclosure']
    },
    {
      tag: 'dialog', category: 'Interactive', display: 'none (until open)', short: 'pop-up dialog',
      summary: 'A dialog box: a pop-up for messages, confirmations or small forms.',
      description: 'JavaScript opens it with `dialog.showModal()` (blocks the page behind it, with a dimmed backdrop, Esc to close) or `dialog.show()` (no blocking). A form with `method="dialog"` inside closes it. The `open` attribute shows it non-modally.',
      java: 'Like a modal `JDialog`: while it is open, the window behind it cannot be used.',
      attributes: [
        { name: 'open', kind: 'boolean', desc: 'Shown (non-modal). To open it modally, use the button in the demo, which calls `showModal()`.' },
        { name: 'closedby', kind: 'enum', desc: 'Which user actions may close it (a newer attribute).', values: [
          { value: 'any', desc: 'Esc or a click outside the dialog.' },
          { value: 'closerequest', desc: 'Only Esc (the default for modal dialogs).' },
          { value: 'none', desc: 'Only your own buttons.' }
        ] }
      ],
      content: '\n  <p>Hello from a dialog!</p>\n  <form method="dialog"><button>Close</button></form>\n',
      demo: '<button onclick="document.querySelector(\'dialog\').showModal()">Open dialog</button>\n<dialog{{attrs}}>{{content}}</dialog>',
      demoCss: 'dialog { border: 0; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,.3); }\ndialog::backdrop { background: rgba(20, 30, 60, .45); }',
      previewHeight: 260,
      related: ['details', 'form', 'js:events'],
      keywords: ['modal', 'popup', 'pop-up', 'dialog box', 'alert']
    }
  );
})(window.UILT);
