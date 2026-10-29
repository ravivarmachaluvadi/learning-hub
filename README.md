# Learning Hub

**Open it:** <https://ravivarmachaluvadi.github.io/learning-hub/>

Six learning tools and 71 study labs (distributed systems, databases, the JVM, system design), as plain
static pages that open in any browser. Every page asks search engines not to index it. Progress (finished
lessons, quiz reviews, drafts) stays in the browser you use.

| Part | Where | What works here |
|---|---|---|
| Labs | [start page](https://ravivarmachaluvadi.github.io/learning-hub/), [Systems Atlas](https://ravivarmachaluvadi.github.io/learning-hub/atlas.html) | Each lab's notes (README, exercises, solutions folded), its visualization, extra documents |
| Claude Learning Tool | [tools/claude/](https://ravivarmachaluvadi.github.io/learning-hub/tools/claude/) | Everything |
| Lead Engineer Learning Tool | [tools/lead-engineer/](https://ravivarmachaluvadi.github.io/learning-hub/tools/lead-engineer/) | Everything |
| UI Learning Tool | [tools/ui/](https://ravivarmachaluvadi.github.io/learning-hub/tools/ui/) | Everything, live previews included |
| React Learning Tool | [tools/react/](https://ravivarmachaluvadi.github.io/learning-hub/tools/react/) | Everything; components run on React 19.3 |
| Python Learning Tool | [tools/python/](https://ravivarmachaluvadi.github.io/learning-hub/tools/python/) | Python runs in the page (Pyodide from cdn.jsdelivr.net, about 12 MB the first time) |
| Kotlin Learning Tool | [tools/kotlin/](https://ravivarmachaluvadi.github.io/learning-hub/tools/kotlin/) | Reading; running Kotlin needs the tool's local server |

## How it is made

Nothing here is edited by hand. `python -I build.py` rebuilds the folder from the repos next to it: the labs
and the start page from `Learning` (its `tools/build-hub.py --site`), and each tool's page and runtime files
from that tool's repo (the files its `artifact.py` lists). To update the site, run it, then commit and push.

Every page asks for a few files from outside: Google Fonts, and from cdnjs Mermaid 11.12.0 (the labs'
diagrams) and highlight.js 11.9.0 (code colours). The Python tool loads Pyodide from jsDelivr. Without them
the pages still work: system fonts, diagrams shown as their text, plain code.

## Third-party code

Each tool's `vendor/` folder holds unmodified copies of open-source libraries, all under the MIT licence:
CodeMirror 5.65.19, js-beautify 1.15.1, @babel/standalone 8.0.6, Prettier 3.9.9, React and ReactDOM 19.3.0.
Each library's `VERSION.txt` says where it came from.
