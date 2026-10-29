/*
 * Machine coding, track 4 (Composition and shared state): File explorer, the React version of
 * java-interview-practice/AAScratches/11-UI-Practice/01-Components/C03_FileExplorer.html (the same
 * behaviour and the same test cases), and two React-first problems with no plain-JS page, Modal and
 * Tabs: they say `plainjs: null`, and `plainjsNote` says how the same thing is done without React.
 * The problem shape is described at the top of data/builds.js. Each runs inside <StrictMode>
 * (`strict: true`), as the track's challenges do, so a missing cleanup shows.
 */
(function (U) {
  var B = U.data.builds = U.data.builds || [];

  B.push(
    {
      id: 'file-explorer', track: 'composition', level: 'Hard', minutes: 45, plainjs: 'C03_FileExplorer.html', strict: true,
      title: 'File explorer',
      summary: 'A folder tree from nested data: folders open and close, sub-folders before files and each group A to Z, and new files or folders added in the selected folder, refusing a name already there. A component that renders itself for each folder.',
      keywords: ['file explorer', 'file tree', 'tree view', 'folder tree', 'recursive component', 'recursion', 'nested data', 'immutable update', 'vs code sidebar', 'directory'],
      task: 'Show the folder tree of `START` (a folder has a `children` array, a file has none). The project itself is the root: it is not a row, and it is always open.\n\n' +
        '- Each row is `<div className="row">` with `data-name`: a folder reads `> src/` when closed and `v src/` when open; a file reads its name. A row inside a folder is indented more than the folder.\n' +
        '- In every folder, sub-folders come first, then files, each group A to Z, ignoring case.\n' +
        '- Clicking a folder opens or closes it and selects it (its row gets the class `selected`).\n' +
        '- **Add file** and **Add folder** add the name in the box (`.name`) inside the selected folder, or in the project when none is selected, open that folder, and empty the box.\n' +
        '- A name already in that folder is refused, with `App.js is already in src` in `<p className="message">`. A blank name does nothing.\n' +
        '- Adding makes a new tree and leaves the one already in state as it was: never push into a folder in place.\n\n' +
        'For the checks: the rows are inside `<div className="tree">`; the buttons are `.add-file` and `.add-folder`.',
      starter: `import { useState, Fragment } from 'react';

const START = { name: 'project', children: [
  { name: 'README.md' },
  { name: 'src', children: [
    { name: 'index.js' },
    { name: 'App.js' },
    { name: 'components', children: [{ name: 'Button.js' }] }
  ] }
] };

export default function FileExplorer() {
  const [tree, setTree] = useState(START);

  return (
    <div className="explorer">
      <div className="tools">
        <input className="name" placeholder="name" aria-label="New item name" />
        <button className="add-file">Add file</button>
        <button className="add-folder">Add folder</button>
      </div>
      <p className="message" role="alert"></p>
      <div className="tree" role="tree">
        {tree.children.map(node => (
          <div key={node.name} className={node.children ? 'row folder' : 'row file'} data-name={node.name}>
            {node.children ? '> ' + node.name + '/' : node.name}
          </div>
        ))}
      </div>
    </div>
  );
}
`,
      solution: `import { useState, Fragment } from 'react';

const START = { name: 'project', children: [
  { name: 'README.md' },
  { name: 'src', children: [
    { name: 'index.js' },
    { name: 'App.js' },
    { name: 'components', children: [{ name: 'Button.js' }] }
  ] }
] };

// folders first, then files, each A to Z, ignoring case
function sorted(children) {
  const rank = node => (node.children ? 0 : 1);
  return [...children].sort((a, b) => rank(a) - rank(b) || a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}

// the folder at a path: a list of names from the root
function folderAt(root, path) {
  return path.reduce((folder, name) => folder.children.find(c => c.name === name), root);
}

// a copy of the tree with change() applied to the folder at path: only the folders on the path are copied
function update(node, path, change) {
  if (!path.length) return change(node);
  return { ...node, children: node.children.map(c => (c.name === path[0] ? update(c, path.slice(1), change) : c)) };
}

function Rows({ folder, path, depth, open, selected, onToggle }) {
  return sorted(folder.children).map(node => {
    const p = [...path, node.name];
    const id = p.join('/');
    const indent = { paddingLeft: 6 + depth * 18 };
    if (!node.children) {
      return <div key={id} className="row file" data-name={node.name} style={indent}>{node.name}</div>;
    }
    const isOpen = open.includes(id);
    return (
      <Fragment key={id}>
        <div className={'row folder' + (id === selected ? ' selected' : '')} data-name={node.name} style={indent} onClick={() => onToggle(id)}>
          {(isOpen ? 'v ' : '> ') + node.name + '/'}
        </div>
        {isOpen && <Rows folder={node} path={p} depth={depth + 1} open={open} selected={selected} onToggle={onToggle} />}
      </Fragment>
    );
  });
}

export default function FileExplorer() {
  const [tree, setTree] = useState(START);
  const [open, setOpen] = useState([]);           // the open folders' paths, such as 'src/components'
  const [selected, setSelected] = useState('');   // the selected folder's path; '' is the project
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  function toggle(id) {
    setOpen(open.includes(id) ? open.filter(x => x !== id) : [...open, id]);
    setSelected(id);
  }

  function add(kind) {
    const n = name.trim();
    setMessage('');
    if (!n) return;
    const path = selected ? selected.split('/') : [];
    const folder = folderAt(tree, path);
    if (folder.children.some(c => c.name === n)) {
      setMessage(n + ' is already in ' + folder.name);
      return;
    }
    const item = kind === 'folder' ? { name: n, children: [] } : { name: n };
    setTree(update(tree, path, f => ({ ...f, children: [...f.children, item] })));
    if (selected && !open.includes(selected)) setOpen([...open, selected]);
    setName('');
  }

  return (
    <div className="explorer">
      <div className="tools">
        <input className="name" placeholder="name" aria-label="New item name" value={name} onChange={e => setName(e.target.value)} />
        <button className="add-file" onClick={() => add('file')}>Add file</button>
        <button className="add-folder" onClick={() => add('folder')}>Add folder</button>
      </div>
      <p className="message" role="alert">{message}</p>
      <div className="tree" role="tree">
        <Rows folder={tree} path={[]} depth={0} open={open} selected={selected} onToggle={toggle} />
      </div>
    </div>
  );
}
`,
      css: '.explorer { max-width: 360px; } .tools { display: flex; gap: 6px; margin-bottom: 6px; } .tools input { flex: 1; padding: 4px 6px; } .message { color: #b91c1c; min-height: 1.4em; margin: 0 0 4px; } .row { padding: 3px 6px; border-radius: 4px; white-space: nowrap; } .row.folder { cursor: pointer; font-weight: 600; } .row.selected { background: #e3ecff; }',
      hints: [
        'Keep the tree in state, and four more pieces: the open folders, the selected folder, the name in the box, the message. Store folders by their **path** (`\'src/components\'`), not by the objects themselves: an immutable update makes new objects, so an object you kept would no longer be in the tree.',
        'Draw with a component that renders itself: `Rows` maps a folder\'s sorted children to rows, and for an open folder renders `<Rows folder={node} … depth={depth + 1} />` under its row. Sort a copy: `[...children].sort(…)`, folders first (`a.children ? 0 : 1`), then `localeCompare` on the lower-cased names.',
        'To add, copy only the folders on the path: `update(node, path, change)` returns `change(node)` when the path is empty, and otherwise `{ ...node, children: node.children.map(c => c.name === path[0] ? update(c, path.slice(1), change) : c) }`.',
        'Check for the name first, in the folder at the selected path: `folder.children.some(c => c.name === n)`. Then set the message, or add, open the folder and empty the box.'
      ],
      checks: [
        { label: 'At the start src is closed: "> src/, README.md"', fn: `function (doc) {
  var rows = [].map.call(doc.querySelectorAll('.tree .row'), function (r) { return r.textContent; }).join(', ');
  return rows === '> src/, README.md' || 'the rows are: ' + (rows || 'none');
}` },
        { label: 'Add file "notes.txt" with nothing selected: it goes into the project, in order', fn: `async function (doc, win, t) {
  function rows() { return [].map.call(doc.querySelectorAll('.tree .row'), function (r) { return r.textContent; }).join(', '); }
  await t.type('.name', 'notes.txt');
  await t.click('.add-file');
  if (rows() !== '> src/, notes.txt, README.md') return 'the rows are: ' + rows();
  return doc.querySelector('.name').value === '' || 'the box still says "' + doc.querySelector('.name').value + '"';
}` },
        { label: 'Click src: it opens, sorted, and is selected', fn: `async function (doc, win, t) {
  function rows() { return [].map.call(doc.querySelectorAll('.tree .row'), function (r) { return r.textContent; }).join(', '); }
  await t.click('.tree .row[data-name="src"]');
  if (rows() !== 'v src/, > components/, App.js, index.js, notes.txt, README.md') return 'the rows are: ' + rows();
  var sel = doc.querySelector('.tree .row.selected');
  return (sel && sel.getAttribute('data-name') === 'src') || 'the selected row is ' + (sel ? sel.getAttribute('data-name') : 'none');
}` },
        { label: 'Add file "api.js": it goes into src, A to Z ignoring case', fn: `async function (doc, win, t) {
  function rows() { return [].map.call(doc.querySelectorAll('.tree .row'), function (r) { return r.textContent; }).join(', '); }
  await t.type('.name', 'api.js');
  await t.click('.add-file');
  return rows() === 'v src/, > components/, api.js, App.js, index.js, notes.txt, README.md' || 'the rows are: ' + rows();
}` },
        { label: 'Add file "App.js" again: refused, "App.js is already in src"', fn: `async function (doc, win, t) {
  function rows() { return [].map.call(doc.querySelectorAll('.tree .row'), function (r) { return r.textContent; }).join(', '); }
  await t.type('.name', 'App.js');
  await t.click('.add-file');
  if (t.text('.message') !== 'App.js is already in src') return '.message says "' + t.text('.message') + '"';
  return rows() === 'v src/, > components/, api.js, App.js, index.js, notes.txt, README.md' || 'the rows changed: ' + rows();
}` },
        { label: 'Add folder "hooks": folders first, and the message goes', fn: `async function (doc, win, t) {
  var rows = function () { return [].map.call(doc.querySelectorAll('.tree .row'), function (r) { return r.textContent; }); };
  await t.type('.name', 'hooks');
  await t.click('.add-folder');
  var first = rows().slice(0, 3).join(', ');
  if (first !== 'v src/, > components/, > hooks/') return 'the first three rows are: ' + first;
  return t.text('.message') === '' || '.message still says "' + t.text('.message') + '"';
}` },
        { label: 'Click components: it opens inside src, indented further', fn: `async function (doc, win, t) {
  function rows() { return [].map.call(doc.querySelectorAll('.tree .row'), function (r) { return r.textContent; }).join(', '); }
  await t.click('.tree .row[data-name="components"]');
  if (rows().indexOf('v components/, Button.js') < 0) return 'the rows are: ' + rows();
  var start = function (el) { return el.getBoundingClientRect().left + parseFloat(win.getComputedStyle(el).paddingLeft); };
  return start(doc.querySelector('.tree .row[data-name="Button.js"]')) > start(doc.querySelector('.tree .row[data-name="components"]')) || 'Button.js is not indented further than its folder';
}` },
        { label: 'Click src: it closes, and hides everything inside it', fn: `async function (doc, win, t) {
  function rows() { return [].map.call(doc.querySelectorAll('.tree .row'), function (r) { return r.textContent; }).join(', '); }
  await t.click('.tree .row[data-name="src"]');
  return rows() === '> src/, notes.txt, README.md' || 'the rows are: ' + rows();
}` },
        { label: 'A blank name adds nothing', fn: `async function (doc, win, t) {
  function rows() { return [].map.call(doc.querySelectorAll('.tree .row'), function (r) { return r.textContent; }).join(', '); }
  await t.type('.name', '   ');
  await t.click('.add-file');
  if (t.text('.message')) return 'a blank name gave the message "' + t.text('.message') + '"';
  return rows() === '> src/, notes.txt, README.md' || 'the rows changed: ' + rows();
}` },
        { label: 'Adding into the selected folder while it is closed opens it: "v src/", with the new "lib/" inside', fn: `async function (doc, win, t) {
  var rows = function () { return [].map.call(doc.querySelectorAll('.tree .row'), function (r) { return r.textContent; }); };
  await t.type('.name', 'lib');
  await t.click('.add-folder');
  if (rows()[0] !== 'v src/') return 'src did not open: the rows are ' + rows().join(', ');
  return rows().indexOf('> lib/') > 0 || 'no "> lib/" inside src: the rows are ' + rows().join(', ');
}` },
        { label: 'Adding makes a new tree: the tree from before the add is left as it was', fn: `async function (doc, win, t) {
  // the tree kept in state, read from React (the screen cannot show it: each render draws whatever the tree holds now)
  function trees() {
    var out = [];
    t.components().forEach(function (c) {
      c.states.forEach(function (v) {
        var named = Array.isArray(v) && v.length > 0 && v.every(function (x) { return x && typeof x.name === 'string'; });
        if (v && typeof v === 'object' && (Array.isArray(v.children) || named)) out.push(v);
      });
    });
    return out;
  }
  function names() { return [].map.call(doc.querySelectorAll('.tree .row'), function (r) { return r.getAttribute('data-name'); }); }
  var adds = [['.add-file', 'zz.txt'], ['.add-folder', 'zz']];
  for (var i = 0; i < adds.length; i++) {
    var before = trees();
    if (!before.length) return 'found no tree in state: keep it in useState, as the starter does';
    var was = before.map(function (v) { return JSON.stringify(v); });
    await t.type('.name', adds[i][1]);
    await t.click(adds[i][0]);
    if (names().indexOf(adds[i][1]) < 0) return '"' + adds[i][1] + '" was not added: the rows are ' + names().join(', ');
    for (var k = 0; k < before.length; k++) {
      if (JSON.stringify(before[k]) !== was[k]) return 'adding "' + adds[i][1] + '" changed the tree that was already in state (the old tree now holds it too): it was pushed into a folder in place. Make a new tree instead, copying each folder on the path to the selected one';
    }
  }
}` }
      ],
      followups: [
        'Why keep the open and selected folders as paths, when the plain-JS page keeps references to the data objects?',
        'Rename and delete; then move an item by drag and drop, never into itself or one of its own sub-folders.',
        'Lazy loading: fetch a folder\'s children the first time it opens, and show "Loading…" in its place meanwhile.',
        'Keyboard: arrows move, Right opens or goes in, Left closes or goes to the parent, with `role="tree"` and `role="treeitem"`.',
        'Keep the open folders across reloads.',
        'A tree of 50,000 files: what would you change?'
      ],
      learn: ['lesson:r-composition', 'lesson:r-state-objects', 'lesson:r-lists-keys']
    },
    {
      id: 'modal', track: 'composition', level: 'Medium', minutes: 35, plainjs: null, strict: true,
      title: 'Modal',
      summary: 'A confirmation dialog drawn through a portal: Escape, × and a click on the backdrop close it, a click inside does not, the focus moves in and comes back, and the page behind stops scrolling while it is open.',
      keywords: ['modal', 'dialog', 'confirm dialog', 'popup', 'overlay', 'backdrop', 'portal', 'createPortal', 'focus trap', 'escape key', 'aria-modal', 'scroll lock'],
      plainjsNote: 'Without React you would reach for the `<dialog>` element: `dialog.showModal()` puts it in the browser\'s top layer (above everything, so no portal is needed), makes the rest of the page inert, closes it on Escape, and `dialog.close()` hands the focus back. A hand-made one is a `<div>` appended to `document.body`, a `keydown` listener for Escape, a click listener on the backdrop that checks `e.target === backdrop`, `document.body.style.overflow = \'hidden\'` while it is open, and `opener.focus()` when it closes: the same steps this component takes, written as effects and their cleanups.',
      task: '**Delete project** should ask first. Finish `Modal` so that:\n\n' +
        '- It is drawn through a portal into `document.body`: a `<div className="backdrop">` holding a `<div className="modal">` with `role="dialog"`, `aria-modal="true"` and `aria-labelledby` pointing at its `<h2>` title.\n' +
        '- **Escape**, the **×** button (`className="close"`, `aria-label="Close"`) and a click on the backdrop close it; a click inside the dialog does not.\n' +
        '- When it opens, the focus moves to **Cancel**; when it closes, it goes back to **Delete project**.\n' +
        '- While it is open the page behind cannot scroll: `document.body.style.overflow` is `hidden`, and it is put back on close.\n\n' +
        '**Cancel** closes it; **Delete** closes it and the page says "Project deleted". The previews run in `<StrictMode>`: every effect needs a cleanup that undoes it.',
      starter: `import { useState, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';

function Modal({ title, onClose, children }) {
  // TODO: a portal into document.body; Escape, × and the backdrop close it;
  // the focus goes in and comes back; the page behind does not scroll
  return (
    <div className="backdrop">
      <div className="modal">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function Project() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  return (
    <div className="project">
      <p className="status">{deleted ? 'Project deleted' : 'Project: Quarterly report'}</p>
      <button className="open" onClick={() => setOpen(true)} disabled={deleted}>Delete project</button>
      {open && (
        <Modal title="Delete project?" onClose={() => setOpen(false)}>
          <p>This cannot be undone.</p>
          <div className="actions">
            <button className="cancel" data-autofocus onClick={() => setOpen(false)}>Cancel</button>
            <button className="confirm" onClick={() => { setDeleted(true); setOpen(false); }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
`,
      solution: `import { useState, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';

function Modal({ title, onClose, children }) {
  const titleId = useId();
  const dialogRef = useRef(null);

  // Escape closes it
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // while it is open: the page behind does not scroll, and the focus is inside; on close, both go back
  useEffect(() => {
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (dialogRef.current.querySelector('[data-autofocus]') || dialogRef.current).focus();
    return () => {
      document.body.style.overflow = overflow;
      if (opener && opener.focus) opener.focus();
    };
  }, []);

  return createPortal(
    <div className="backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={dialogRef}>
        <button className="close" aria-label="Close" onClick={onClose}>×</button>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function Project() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  return (
    <div className="project">
      <p className="status">{deleted ? 'Project deleted' : 'Project: Quarterly report'}</p>
      <button className="open" onClick={() => setOpen(true)} disabled={deleted}>Delete project</button>
      {open && (
        <Modal title="Delete project?" onClose={() => setOpen(false)}>
          <p>This cannot be undone.</p>
          <div className="actions">
            <button className="cancel" data-autofocus onClick={() => setOpen(false)}>Cancel</button>
            <button className="confirm" onClick={() => { setDeleted(true); setOpen(false); }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
`,
      css: '.backdrop { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(20, 24, 33, 0.45); } .modal { position: relative; width: min(320px, 90vw); padding: 14px 16px; border-radius: 10px; background: #fff; box-shadow: 0 12px 32px rgba(0,0,0,.25); } .modal h2 { margin: 0 0 6px; font-size: 18px; } .close { position: absolute; top: 6px; right: 8px; border: 0; background: none; font-size: 18px; } .actions { display: flex; justify-content: flex-end; gap: 8px; } .confirm { background: #c62828; color: #fff; border: 1px solid #c62828; border-radius: 6px; }',
      hints: [
        'Return `createPortal(<div className="backdrop" …>…</div>, document.body)` from `Modal`. Give the dialog `role="dialog"`, `aria-modal="true"`, and `aria-labelledby={titleId}` with `const titleId = useId();` and `<h2 id={titleId}>`.',
        'The backdrop closes only on a click on itself: `onClick={e => { if (e.target === e.currentTarget) onClose(); }}`. A click on the dialog bubbles up to it too, with the dialog (or something in it) as `e.target`.',
        'One effect for Escape: add a `keydown` listener on `document` that calls `onClose()`, and remove the same function in its cleanup.',
        'One effect for the rest, run once: remember `document.activeElement` and `document.body.style.overflow`, set the overflow to `hidden`, focus the `[data-autofocus]` button; the cleanup puts the overflow back and calls `opener.focus()`. In StrictMode it runs, cleans up and runs again, and ends right only if the cleanup undoes everything.'
      ],
      checks: [
        { label: 'Delete project opens a dialog in `<body>`, outside `#root`', fn: `async function (doc, win, t) {
  doc.querySelector('.open').focus();   // as a real click would
  await t.click('.open');
  var m = doc.querySelector('.modal');
  if (!m) return 'no .modal after clicking Delete project';
  if (doc.getElementById('root').contains(m)) return 'the dialog is inside #root: draw it with createPortal(…, document.body)';
  return !!m.closest('.backdrop') || 'the .modal is not inside a .backdrop';
}` },
        { label: 'It is a labelled dialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` its title', fn: `function (doc) {
  var m = doc.querySelector('.modal');
  if (m.getAttribute('role') !== 'dialog') return 'role is "' + m.getAttribute('role') + '"';
  if (m.getAttribute('aria-modal') !== 'true') return 'aria-modal is "' + m.getAttribute('aria-modal') + '"';
  var title = doc.getElementById(m.getAttribute('aria-labelledby') || '');
  return (title && title.textContent === 'Delete project?') || 'aria-labelledby does not point at the "Delete project?" title';
}` },
        { label: 'The focus is on Cancel, and the page behind cannot scroll', fn: `function (doc) {
  var a = doc.activeElement;
  if (a !== doc.querySelector('.cancel')) return 'the focus is on ' + (a && a !== doc.body ? '<' + a.tagName.toLowerCase() + ' class="' + a.className + '">' : 'nothing');
  return doc.body.style.overflow === 'hidden' || 'document.body.style.overflow is "' + doc.body.style.overflow + '"';
}` },
        { label: 'A click inside the dialog keeps it open; a click on the backdrop closes it', fn: `async function (doc, win, t) {
  await t.click('.modal p');
  if (!doc.querySelector('.modal')) return 'a click on the text inside the dialog closed it';
  await t.click('.backdrop');
  return !doc.querySelector('.modal') || 'a click on the backdrop did not close it';
}` },
        { label: 'Closed: the focus is back on Delete project, and the page can scroll again', fn: `function (doc) {
  if (doc.body.style.overflow === 'hidden') return 'document.body.style.overflow is still "hidden"';
  var a = doc.activeElement;
  return a === doc.querySelector('.open') || 'the focus is on ' + (a && a !== doc.body ? '<' + a.tagName.toLowerCase() + ' class="' + a.className + '">' : 'nothing');
}` },
        { label: 'Escape closes it', fn: `async function (doc, win, t) {
  doc.querySelector('.open').focus();
  await t.click('.open');
  if (!doc.querySelector('.modal')) return 'it did not open again';
  await t.key(doc.activeElement, 'Escape');
  return !doc.querySelector('.modal') || 'Escape did not close it';
}` },
        { label: '× and Cancel close it too', fn: `async function (doc, win, t) {
  await t.click('.open');
  if (!doc.querySelector('.modal .close')) return 'no .close button in the dialog';
  await t.click('.modal .close');
  if (doc.querySelector('.modal')) return '× did not close it';
  await t.click('.open');
  await t.click('.cancel');
  return !doc.querySelector('.modal') || 'Cancel did not close it';
}` },
        { label: 'Closed, it leaves no keydown listener behind on `document` or `window`', fn: `async function (doc, win, t) {
  var live = [];
  [doc, win].forEach(function (target) {
    var add = target.addEventListener, remove = target.removeEventListener;
    target.addEventListener = function (type, fn, o) { if (type === 'keydown') live.push(fn); return add.call(this, type, fn, o); };
    target.removeEventListener = function (type, fn, o) { var i = type === 'keydown' ? live.indexOf(fn) : -1; if (i >= 0) live.splice(i, 1); return remove.call(this, type, fn, o); };
  });
  try {
    await t.click('.open');
    if (!doc.querySelector('.modal')) return 'it did not open';
    await t.click('.cancel');
  } finally {
    delete doc.addEventListener; delete doc.removeEventListener;
    delete win.addEventListener; delete win.removeEventListener;
  }
  return !live.length || 'after closing, ' + live.length + ' keydown listener(s) are still listening: the Escape effect needs a cleanup that removes the same function';
}` },
        { label: 'Delete closes it, and the project is deleted', fn: `async function (doc, win, t) {
  await t.click('.open');
  await t.click('.confirm');
  if (doc.querySelector('.modal')) return 'Delete did not close the dialog';
  return t.text('.status') === 'Project deleted' || '.status says "' + t.text('.status') + '"';
}` }
      ],
      followups: [
        'Trap the focus: Tab from the last button goes to the first, Shift+Tab from the first to the last.',
        'Two dialogs open at once, one from another: which one does Escape close, and how?',
        'Animate it in and out. What does closing have to wait for?',
        'Make the rest of the page unreachable to screen readers while it is open (`inert`).',
        'When would you use the native `<dialog>` element instead, and what would you lose?',
        'A `useModal()` hook or a `<ModalProvider>`: how would other parts of the app open dialogs?'
      ],
      learn: ['lesson:r-portals', 'lesson:r-effect-cleanup', 'lesson:r-dom-refs']
    },
    {
      id: 'tabs', track: 'composition', level: 'Medium', minutes: 30, plainjs: null, strict: true,
      title: 'Tabs',
      summary: 'Accessible tabs as compound components, `<Tabs>`, `<TabList>`, `<Tab>` and `<TabPanel>`, sharing their state through context: roles and aria attributes, arrow keys, Home and End, a roving tabindex, and two sets on one page that never mix.',
      keywords: ['tabs', 'tab', 'tabpanel', 'tablist', 'compound components', 'compound component', 'context', 'aria-selected', 'roving tabindex', 'keyboard navigation', 'accessibility', 'a11y'],
      plainjsNote: 'Without React, tabs are buttons with `role="tab"` and panels with `hidden`: one click listener on the tab list (event delegation) sets `aria-selected`, moves `tabindex` and flips `hidden` on the panels, and a `keydown` listener moves the focus with the arrow keys, the "roving tabindex" of the WAI-ARIA tabs pattern. Each set of tabs is wired up on its own (`document.querySelectorAll(\'.tabs\').forEach(setUp)`), and the ids that link a tab to its panel are written by hand.',
      task: '`App` uses the tabs as compound components, and must not change. Write `Tabs`, `TabList`, `Tab` and `TabPanel`, sharing the selected tab through **context**:\n\n' +
        '- `Tabs` renders `<div className="tabs">` and starts on `defaultValue`. `TabList` has `role="tablist"` and `aria-label` (the `label` of its `Tabs`).\n' +
        '- Each `Tab` is a `<button role="tab">` with `aria-selected`, an `id`, and `aria-controls` naming its panel. Each `TabPanel` has `role="tabpanel"`, an `id`, and `aria-labelledby` naming its tab. Render every panel, and hide the unselected ones with `hidden`. Ids must be unique on the page: `useId()` helps.\n' +
        '- Clicking a tab selects it. Only the selected tab has `tabIndex={0}`; the others `-1`.\n' +
        '- On a focused tab, **ArrowRight** and **ArrowLeft** select and focus the next and previous tab, wrapping round; **Home** and **End** the first and last.\n' +
        '- The two sets on the page never affect each other.',
      starter: `import { useState, createContext, useContext, useId } from 'react';

// TODO: share the selected tab between these through context
function Tabs({ defaultValue, label, children }) {
  return <div className="tabs">{children}</div>;
}

function TabList({ children }) {
  return <div>{children}</div>;
}

function Tab({ value, children }) {
  return <button>{children}</button>;
}

function TabPanel({ value, children }) {
  return <div>{children}</div>;
}

export default function App() {
  return (
    <div>
      <Tabs defaultValue="profile" label="Account">
        <TabList>
          <Tab value="profile">Profile</Tab>
          <Tab value="security">Security</Tab>
          <Tab value="billing">Billing</Tab>
        </TabList>
        <TabPanel value="profile">Your name and photo.</TabPanel>
        <TabPanel value="security">Password and two-step sign-in.</TabPanel>
        <TabPanel value="billing">Cards and invoices.</TabPanel>
      </Tabs>
      <Tabs defaultValue="day" label="Report">
        <TabList>
          <Tab value="day">Day</Tab>
          <Tab value="week">Week</Tab>
        </TabList>
        <TabPanel value="day">Today's numbers.</TabPanel>
        <TabPanel value="week">This week's numbers.</TabPanel>
      </Tabs>
    </div>
  );
}
`,
      solution: `import { useState, createContext, useContext, useId } from 'react';

const TabsContext = createContext(null);

function useTabs() {
  const tabs = useContext(TabsContext);
  if (!tabs) throw new Error('TabList, Tab and TabPanel must be inside <Tabs>');
  return tabs;
}

function Tabs({ defaultValue, label, children }) {
  const [selected, setSelected] = useState(defaultValue);
  const baseId = useId();
  return (
    <TabsContext value={{ selected, setSelected, baseId, label }}>
      <div className="tabs">{children}</div>
    </TabsContext>
  );
}

function TabList({ children }) {
  const { label, setSelected } = useTabs();

  function onKeyDown(e) {
    const tabs = [...e.currentTarget.querySelectorAll('[role="tab"]')];
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    tabs[next].focus();
    setSelected(tabs[next].dataset.value);
  }

  return <div className="tab-list" role="tablist" aria-label={label} onKeyDown={onKeyDown}>{children}</div>;
}

function Tab({ value, children }) {
  const { selected, setSelected, baseId } = useTabs();
  const on = value === selected;
  return (
    <button
      role="tab"
      id={baseId + '-tab-' + value}
      aria-selected={on}
      aria-controls={baseId + '-panel-' + value}
      tabIndex={on ? 0 : -1}
      data-value={value}
      onClick={() => setSelected(value)}
    >
      {children}
    </button>
  );
}

function TabPanel({ value, children }) {
  const { selected, baseId } = useTabs();
  return (
    <div role="tabpanel" id={baseId + '-panel-' + value} aria-labelledby={baseId + '-tab-' + value} hidden={value !== selected} tabIndex={0}>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <div>
      <Tabs defaultValue="profile" label="Account">
        <TabList>
          <Tab value="profile">Profile</Tab>
          <Tab value="security">Security</Tab>
          <Tab value="billing">Billing</Tab>
        </TabList>
        <TabPanel value="profile">Your name and photo.</TabPanel>
        <TabPanel value="security">Password and two-step sign-in.</TabPanel>
        <TabPanel value="billing">Cards and invoices.</TabPanel>
      </Tabs>
      <Tabs defaultValue="day" label="Report">
        <TabList>
          <Tab value="day">Day</Tab>
          <Tab value="week">Week</Tab>
        </TabList>
        <TabPanel value="day">Today's numbers.</TabPanel>
        <TabPanel value="week">This week's numbers.</TabPanel>
      </Tabs>
    </div>
  );
}
`,
      css: '.tabs { margin-bottom: 14px; max-width: 360px; } [role="tablist"] { display: flex; gap: 2px; border-bottom: 2px solid #ccd; } [role="tab"] { padding: 6px 12px; border: 0; border-radius: 6px 6px 0 0; background: #eef2f7; cursor: pointer; } [role="tab"][aria-selected="true"] { background: #20232a; color: #61dafb; } [role="tabpanel"] { padding: 8px 10px; border: 1px solid #ccd; border-top: 0; border-radius: 0 0 8px 8px; }',
      hints: [
        'In `Tabs`: `const [selected, setSelected] = useState(defaultValue);` and `const baseId = useId();`, then wrap the children in `<TabsContext value={{ selected, setSelected, baseId, label }}>`. Each set has its own `Tabs`, so its own state and its own ids.',
        'A `Tab` reads the context: `aria-selected={value === selected}`, `tabIndex={value === selected ? 0 : -1}`, `id={baseId + \'-tab-\' + value}`, `aria-controls={baseId + \'-panel-\' + value}`; a `TabPanel` the reverse, with `hidden={value !== selected}`.',
        'Keys go on the `TabList` (`onKeyDown`): find the tabs inside it, `[...e.currentTarget.querySelectorAll(\'[role="tab"]\')]`, find the focused one, work out the next index (wrapping with `% tabs.length`), then focus it and select its value (put `data-value={value}` on each tab).'
      ],
      checks: [
        { label: 'Each set has a tablist; the first starts on Profile, showing its panel only', fn: `function (doc) {
  var sets = doc.querySelectorAll('.tabs');
  if (sets.length !== 2) return sets.length + ' .tabs elements (two are right)';
  var s = sets[0];
  if (!s.querySelector('[role="tablist"]')) return 'no role="tablist" in the first set';
  var sel = [].map.call(s.querySelectorAll('[role="tab"]'), function (b) { return b.getAttribute('aria-selected'); }).join(', ');
  if (sel !== 'true, false, false') return 'the tabs\\' aria-selected are: ' + (sel || 'none (role="tab"?)');
  var shown = [].filter.call(s.querySelectorAll('[role="tabpanel"]'), function (p) { return !p.hidden; });
  if (shown.length !== 1) return shown.length + ' panels show in the first set';
  return shown[0].textContent === 'Your name and photo.' || 'the panel shown says "' + shown[0].textContent + '"';
}` },
        { label: 'Each tab and its panel point at each other, with ids unique on the page', fn: `function (doc) {
  var tabs = [].slice.call(doc.querySelectorAll('[role="tab"]'));
  if (tabs.length !== 5) return tabs.length + ' role="tab" buttons (five are right)';
  for (var i = 0; i < tabs.length; i++) {
    var p = doc.getElementById(tabs[i].getAttribute('aria-controls') || '');
    if (!p || p.getAttribute('role') !== 'tabpanel') return 'the tab "' + tabs[i].textContent + '" does not point at a tabpanel with aria-controls (render every panel)';
    if (!tabs[i].id || p.getAttribute('aria-labelledby') !== tabs[i].id) return 'the panel of "' + tabs[i].textContent + '" does not point back at its tab with aria-labelledby';
  }
  var ids = [].map.call(doc.querySelectorAll('[role="tab"], [role="tabpanel"]'), function (e) { return e.id; });
  return ids.length === new Set(ids).size || 'two tabs or panels share an id: use useId() in each Tabs';
}` },
        { label: 'Clicking Security selects it and shows only its panel', fn: `async function (doc, win, t) {
  var s = doc.querySelectorAll('.tabs')[0], tab = s.querySelectorAll('[role="tab"]')[1];
  await t.click(tab);
  if (tab.getAttribute('aria-selected') !== 'true') return 'Security\\'s aria-selected is "' + tab.getAttribute('aria-selected') + '"';
  var shown = [].filter.call(s.querySelectorAll('[role="tabpanel"]'), function (p) { return !p.hidden; }).map(function (p) { return p.textContent; });
  return shown.join(' | ') === 'Password and two-step sign-in.' || 'the panels shown: ' + (shown.join(' | ') || 'none');
}` },
        { label: 'Only the selected tab can be reached with the Tab key: `tabIndex` 0 on it, -1 on the others', fn: `function (doc) {
  var idx = [].map.call(doc.querySelectorAll('.tabs')[0].querySelectorAll('[role="tab"]'), function (b) { return b.tabIndex; }).join(', ');
  return idx === '-1, 0, -1' || 'the tabs\\' tabIndex are: ' + idx;
}` },
        { label: 'ArrowRight: Billing, then Profile (wrapping); ArrowLeft: back to Billing; the focus follows', fn: `async function (doc, win, t) {
  var s = doc.querySelectorAll('.tabs')[0], tabs = s.querySelectorAll('[role="tab"]');
  function now() { var on = [].filter.call(tabs, function (b) { return b.getAttribute('aria-selected') === 'true'; })[0]; return on ? on.textContent : 'none'; }
  tabs[1].focus();
  var steps = [['ArrowRight', 'Billing'], ['ArrowRight', 'Profile'], ['ArrowLeft', 'Billing']];
  for (var i = 0; i < steps.length; i++) {
    await t.key(doc.activeElement, steps[i][0]);
    if (now() !== steps[i][1]) return 'after ' + steps.slice(0, i + 1).map(function (x) { return x[0]; }).join(', ') + ' the selected tab is ' + now();
    if (doc.activeElement.textContent !== steps[i][1]) return 'after ' + steps[i][0] + ' the focus is on "' + doc.activeElement.textContent + '"';
  }
}` },
        { label: 'Home and End select the first and the last tab', fn: `async function (doc, win, t) {
  var tabs = doc.querySelectorAll('.tabs')[0].querySelectorAll('[role="tab"]');
  function now() { var on = [].filter.call(tabs, function (b) { return b.getAttribute('aria-selected') === 'true'; })[0]; return on ? on.textContent : 'none'; }
  await t.key(doc.activeElement, 'Home');
  if (now() !== 'Profile') return 'after Home the selected tab is ' + now();
  await t.key(doc.activeElement, 'End');
  return now() === 'Billing' || 'after End the selected tab is ' + now();
}` },
        { label: 'The second set keeps its own state: Week there leaves the first set on Billing', fn: `async function (doc, win, t) {
  var sets = doc.querySelectorAll('.tabs');
  await t.click(sets[1].querySelectorAll('[role="tab"]')[1]);
  var shown = [].filter.call(sets[1].querySelectorAll('[role="tabpanel"]'), function (p) { return !p.hidden; }).map(function (p) { return p.textContent; }).join(' | ');
  if (shown !== 'This week\\'s numbers.') return 'the second set shows: ' + (shown || 'nothing');
  var first = [].filter.call(sets[0].querySelectorAll('[role="tab"]'), function (b) { return b.getAttribute('aria-selected') === 'true'; }).map(function (b) { return b.textContent; }).join(', ');
  return first === 'Billing' || 'the first set\\'s selected tab is now: ' + (first || 'none');
}` },
        { label: 'The parts share their state through context', fn: `function (doc, win, t) {
  return (/createContext\\s*\\(/.test(t.source()) && /\\buse(?:Context)?\\s*\\(\\s*\\w+Context\\b/.test(t.source())) || 'no createContext(…) read with useContext(…) in the code';
}` }
      ],
      followups: [
        'Why compound components and context, rather than one `<Tabs items={[…]} />` with an array?',
        'Load a panel\'s content only the first time its tab is opened, and keep it afterwards.',
        'Put the selected tab in the URL (`?tab=security`), so a link opens it.',
        'Make `Tabs` controlled as well: `value` and `onChange` from the parent, falling back to its own state.',
        'Automatic or manual activation: should the arrow keys select a tab, or only move the focus until Enter?'
      ],
      learn: ['lesson:r-context', 'lesson:r-composition', 'lesson:r-dom-refs']
    }
  );
})(window.RLT);
