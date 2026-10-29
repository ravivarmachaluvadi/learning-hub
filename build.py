"""
build.py - the public copy of the learning tools and the labs, served by GitHub Pages at
https://ravivarmachaluvadi.github.io/learning-hub/ (for browsers where the private claude.ai artifacts cannot be opened).

It rebuilds this folder from the repos next to it; nothing here is edited by hand:

    index.html, atlas.html, NN-slug/   the Learning Hub's pages, from ../Learning (tools/build-hub.py --site)
    tools/<name>/                      each learning tool: its index.html and the files its artifact.py lists
                                       (stylesheets, scripts, data, vendor/), with vendor/'s version and licence notes

Every page asks search engines not to index it (<meta name="robots" content="noindex">). The tools' sources,
tests and notes stay in their private repos. To update the site: python -I build.py, then commit and push.

    python -I build.py
"""
import json, pathlib, shutil, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
GH = HERE.parent
TOOLS = {   # folder on the site: the tool's repo next to this one
    'claude': 'ClaudeLearningTool', 'lead-engineer': 'LeadEngineerLearningTool', 'ui': 'UILearningTool',
    'react': 'ReactLearningTool', 'python': 'PythonLearningTool', 'kotlin': 'KotlinLearningTool',
}
NOINDEX = '<meta name="robots" content="noindex">'


def run(args, cwd):
    r = subprocess.run(args, cwd=cwd, capture_output=True, text=True, encoding='utf-8')
    if r.returncode:
        sys.exit(f'{" ".join(map(str, args))} failed in {cwd}:\n{r.stderr}')
    return r.stdout


# the labs, the Atlas and the start page
run([sys.executable, '-I', str(GH / 'Learning' / 'tools' / 'build-hub.py'), '--site', str(HERE)], GH / 'Learning')

# the tools: the same files their claude.ai artifacts carry, but with the tool's own index.html
total = 0
for name, repo in TOOLS.items():
    src = GH / repo
    files = [f['path'] if isinstance(f, dict) else f for f in json.loads(run([sys.executable, '-I', 'artifact.py'], src))]
    # vendor/<library>/VERSION.txt and LICENSE, for each library whose files are copied
    notes = sorted(p.relative_to(src).as_posix() for p in (src / 'vendor').rglob('*')
                   if p.name in ('VERSION.txt', 'LICENSE')
                   and any(f.startswith(p.parent.relative_to(src).as_posix() + '/') for f in files))
    out = HERE / 'tools' / name
    shutil.rmtree(out, ignore_errors=True)
    for f in files + notes:
        (out / f).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src / f, out / f)
    page = (src / 'index.html').read_text(encoding='utf-8')
    assert page.count('<meta charset="utf-8">') == 1, f'{repo}/index.html: no single charset meta to put the robots meta after'
    (out / 'index.html').write_text(page.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  ' + NOINDEX, 1),
                                    encoding='utf-8', newline='\n')
    size = sum(p.stat().st_size for p in out.rglob('*') if p.is_file())
    total += size
    print(f'tools/{name}/: {len(files) + len(notes) + 1} files, {size // 1024} KB')

(HERE / '.nojekyll').write_text('', encoding='utf-8')   # serve every file as it is (no Jekyll)
pages = sum(1 for _ in HERE.rglob('*.html'))
print(f'site: {pages} pages; tools {total // 1024} KB; every page has the robots meta: '
      f'{all(NOINDEX in p.read_text(encoding="utf-8") for p in HERE.rglob("*.html"))}')
