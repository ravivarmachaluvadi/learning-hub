/*
 * views/kit.js - ready-made files to install (#/kit, #/kit/<id>).
 *
 * Each item (data/kit.js, built from kit/kit.md and the files under kit/) shows how to use it and
 * each of its files exactly as written, with where it goes, Copy and Download. Skills can also be
 * installed with:  python -I tools/install_kit.py --to "$HOME\.claude" <ids>
 */
(function (U) {
  'use strict';
  var h = U.h;

  var KINDS = [
    ['skill', 'Skills', 'Folders with a SKILL.md. The name becomes a /command; Claude can also load a skill on its own when its description matches what you ask.'],
    ['snippet', 'Snippets', 'Text to paste into a file you already have, such as your CLAUDE.md.'],
    ['template', 'Templates', 'Files to copy into a repo and fill in, or to have Claude fill in.'],
    ['agent', 'Subagents', 'Helpers with their own context window: Claude delegates a task, and only the summary comes back.'],
    ['hook', 'Hooks', 'Commands that run at fixed points, every time. Each is a settings.json fragment to merge, and the script it runs.'],
    ['statusline', 'Status line', 'A script whose output Claude Code shows under the prompt.'],
    ['rule', 'Rules', 'Instructions that load for matching files.'],
    ['settings', 'Settings', 'settings.json fragments.'],
    ['workflow', 'GitHub workflows', 'Files for a repo\'s .github/workflows folder that run Claude in GitHub Actions.'],
    ['script', 'Scripts', 'PowerShell scripts that start Claude for one job: a session over several repos, a headless run. Get-Help shows how to use each.']
  ];
  var KIND_LABEL = {};
  KINDS.forEach(function (k) { KIND_LABEL[k[0]] = k[1].replace(/s$/, ''); });
  KIND_LABEL.statusline = 'Status line';

  function listPage(root) {
    root.appendChild(h('div', { class: 'page-head' },
      h('h1', null, 'Kit'),
      h('p', null, 'Ready-made files for your Claude Code setup. Open one to see it in full, where it goes and how to use it; copy or download it, ' +
        'or install the skills with the script in the tool\'s tools folder.')));
    KINDS.forEach(function (k) {
      var items = (U.data.kit || []).filter(function (x) { return x.kind === k[0]; });
      if (!items.length) return;
      root.appendChild(h('h2', null, k[1]));
      root.appendChild(h('p', { class: 'muted' }, k[2]));
      root.appendChild(h('div', { class: 'cards' }, items.map(function (x) {
        return h('a', { class: 'card kit-card', href: '#/kit/' + x.id, 'data-id': x.id },
          h('div', { class: 'row' }, h('span', { class: 'badge' }, KIND_LABEL[x.kind] || x.kind), U.trackBadge(x.track)),
          h('h3', null, x.title),
          h('p', { class: 'muted' }, x.summary));
      })));
    });
  }

  function fileCard(f, i) {
    var name = f.path.split('/').pop();
    return h('section', { class: 'card kit-file', 'data-i': i },
      h('div', { class: 'row' },
        h('h2', { class: 'kit-path' }, h('code', null, f.path)),
        h('span', { class: 'spacer' }),
        h('button', { class: 'btn btn-small kit-download', type: 'button', onclick: function () {
          U.download(name, f.text, /\.json$/.test(name) ? 'application/json' : /\.md$/.test(name) ? 'text/markdown' : 'text/plain');
        } }, 'Download ' + name),
        h('button', { class: 'btn btn-small btn-primary kit-copy', type: 'button', onclick: function () { U.copy(f.text); } }, 'Copy')),
      h('p', { class: 'kit-install' }, 'Goes in: ', h('code', null, f.install)),
      h('pre', { class: 'kit-text' }, f.text));
  }

  U.views.kit = {
    render: function (root, params) {
      if (!params[0]) return listPage(root);
      var k = U.find('kit', params[0]);
      if (!k) {
        root.appendChild(h('div', { class: 'card' }, h('h1', null, 'Kit item not found'),
          h('p', null, 'There is no kit item called "' + params[0] + '".'), h('a', { class: 'btn', href: '#/kit' }, '← The whole kit')));
        return;
      }
      root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/kit' }, 'Kit'), ' › ', k.title));
      root.appendChild(h('div', { class: 'page-head' },
        h('div', { class: 'row' }, h('span', { class: 'badge' }, KIND_LABEL[k.kind] || k.kind), U.trackBadge(k.track)),
        h('h1', null, k.title),
        h('p', { class: 'lesson-summary' }, k.summary)));
      root.appendChild(h('div', { class: 'card kit-how lesson-text', html: U.md(k.how) }));
      k.files.forEach(function (f, i) { root.appendChild(fileCard(f, i)); });
      if ((k.related || []).length) {
        root.appendChild(h('h2', null, 'Related'));
        root.appendChild(h('ul', { class: 'plain-list kit-related' }, k.related.map(function (r) {
          var m = /^(\w+):(.+)$/.exec(r);
          return h('li', null, h('a', { href: U.linkFor(m[1], m[2]), html: U.labelFor(m[1], m[2]) }));
        })));
      }
    }
  };
  U.route('kit', U.views.kit);
})(window.CLT);
