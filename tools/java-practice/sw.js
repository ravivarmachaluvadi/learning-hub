/* site_sw.js - the website copy's service worker (tools/build_site.py fills it in and writes it as
   sw.js), so the site opens without internet after one visit (6 Nov 2026, Ravi: "works offline").

   - On install it saves CORE (the page, its scripts, every file's text and the practice data) in
     a cache named after this build, and VENDOR (the editor's core, saved once: their paths carry
     the library version, so they never change).
   - Online, the page and its data always come from the network (the copy is refreshed as they
     come), so a new build shows at once; only offline does the saved copy answer.
   - Anything else under vendor/ (a language the editor loads later, the diagram library) is
     saved the first time it is used, and answered from the cache after that.
   - A new build has a new sw.js; it saves the new copy, takes over, and deletes the old one.

   To remove it one day: publish a sw.js whose install handler calls self.registration.unregister(). */
'use strict';
const VERSION = "site-adf554b6ab";
const CORE = ["./", "static.js", "outcheck.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "data/tree.json", "data/files.json", "data/practice.json", "drive-sync.js"];
const VENDOR = ["vendor/marked@18.0.14/lib/marked.umd.js", "vendor/monaco-editor@0.52.2/min/vs/base/browser/ui/codicons/codicon/codicon.ttf", "vendor/monaco-editor@0.52.2/min/vs/base/worker/workerMain.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/css/css.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/html/html.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/ini/ini.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/java/java.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/javascript/javascript.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/kotlin/kotlin.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/markdown/markdown.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/python/python.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/shell/shell.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/sql/sql.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/typescript/typescript.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/xml/xml.js", "vendor/monaco-editor@0.52.2/min/vs/basic-languages/yaml/yaml.js", "vendor/monaco-editor@0.52.2/min/vs/editor/editor.main.css", "vendor/monaco-editor@0.52.2/min/vs/editor/editor.main.js", "vendor/monaco-editor@0.52.2/min/vs/loader.js"];
const SITE_CACHE = 'java-practice-' + VERSION, VENDOR_CACHE = 'java-practice-vendor';
const SCOPE = new URL(self.registration.scope).pathname;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const site = await caches.open(SITE_CACHE);
    await site.addAll(CORE.map(u => new Request(u, { cache: 'reload' })));   // all or nothing: the old copy stays
    const vendor = await caches.open(VENDOR_CACHE);
    for (const u of VENDOR) {
      if (await vendor.match(u)) continue;
      const res = await fetch(u);
      if (res.ok) await vendor.put(u, res);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith('java-practice-') && k !== SITE_CACHE && k !== VENDOR_CACHE) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

/* no-cache: ask the server every time (a 304 when nothing changed). GitHub Pages lets browsers
   keep a file 10 minutes, so without it a new build showed up to 10 minutes late (6 Nov test). */
async function networkFirst(req) {
  const cache = await caches.open(SITE_CACHE);
  try {
    const res = await fetch(req.url, { cache: 'no-cache' });
    if (res.ok) await cache.put(req.url, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req.url, { ignoreSearch: true })
      || (req.mode === 'navigate' ? await cache.match(SCOPE) : undefined);
    if (hit) return hit;
    throw e;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(VENDOR_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) await cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(SCOPE)) return;   // fonts and the rest: as usual
  event.respondWith(url.pathname.startsWith(SCOPE + 'vendor/') ? cacheFirst(req) : networkFirst(req));
});
