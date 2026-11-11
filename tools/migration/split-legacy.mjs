// Cuts the frozen legacy site into the source files of the ASP.NET Core project, following tools/migration/split-plan.json:
//   scripts  ->  src/Nabd.Web/ClientScripts/<bundle>/NNN-name.js  (+ bundles.json, + a README per bundle)
//   markup   ->  src/Nabd.Web/Views/**.cshtml                      (a layout, one view, partial views)
//   styles   ->  src/Nabd.Web/wwwroot/css/*.css
// The cut is lossless: joining the fragments of a bundle in order gives back the legacy file, and the composed
// views give back index.html, except for the intentional differences listed in
// tests/Nabd.Tests/LegacyBaseline/seams.json. The baseline tests of Nabd.Tests check exactly that.
//
// This tool was run once to perform the migration and is kept as its record. Running it again overwrites the
// generated files with the legacy text, so it is not part of the build.
// usage: node tools/migration/split-legacy.mjs [--check]     (--check validates the plan and writes nothing)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = path.join(REPO, 'tests/Nabd.Tests/LegacyBaseline/site');
const WEB = path.join(REPO, 'src/Nabd.Web');
const CHECK = process.argv.includes('--check');
const plan = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/migration/split-plan.json'), 'utf8'));
const seams = JSON.parse(fs.readFileSync(path.join(REPO, 'tests/Nabd.Tests/LegacyBaseline/seams.json'), 'utf8')).seams;

const fail = msg => { console.error('split-legacy: ' + msg); process.exit(1); };
const linesOf = file => fs.readFileSync(path.join(SITE, file), 'utf8').split('\n');
const slice = (lines, from, to) => lines.slice(from - 1, to).join('\n');
const write = (file, text) => { if (CHECK) return; fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
const count = (text, piece) => text.split(piece).length - 1;

// Each intentional difference must fit the legacy file exactly as often as it says.
for (const s of seams) {
  const n = count(fs.readFileSync(path.join(SITE, s.file), 'utf8'), s.legacy);
  if (n !== s.count) fail(`seam for ${s.file} expected ${s.count} match(es), found ${n}: ${s.legacy.slice(0, 60)}`);
}
const applySeams = (file, text) => seams.filter(s => s.file === file).reduce((t, s) => t.split(s.legacy).join(s.current), text);

/* ---------- scripts ---------- */
const bundles = [];
for (const [bundle, spec] of Object.entries(plan.scripts)) {
  const lines = linesOf(spec.source);
  // The last line of every legacy file ends with a line feed, so the split gives one empty item at the end.
  const total = lines.length - 1;
  const first = spec.open ? spec.open[1] + 1 : 1, last = spec.close ? spec.close[0] - 1 : total;
  let next = first;
  const dir = path.join(WEB, 'ClientScripts', bundle);
  if (!CHECK) fs.rmSync(dir, { recursive: true, force: true });
  const entry = { name: bundle, output: spec.source, fragments: [] };
  const rows = [];
  if (spec.open) { write(path.join(dir, '_open.txt'), slice(lines, spec.open[0], spec.open[1]) + '\n'); entry.open = `${bundle}/_open.txt`; }
  spec.fragments.forEach((f, i) => {
    if (f.from !== next) fail(`${bundle}: fragment ${f.name} starts at ${f.from}, expected ${next}`);
    if (f.to < f.from) fail(`${bundle}: fragment ${f.name} is empty`);
    next = f.to + 1;
    const legacy = slice(lines, f.from, f.to);
    try { new vm.Script(spec.open ? `(function () {\n'use strict';\n${legacy}\n})` : legacy); } catch (e) { fail(`${bundle}: fragment ${f.name} (${f.from}-${f.to}) is not a complete unit: ${e.message}`); }
    const file = `${String((i + 1) * 10).padStart(3, '0')}-${f.name.replace(/\.js$/, '')}.js`;
    write(path.join(dir, file), applySeams(spec.source, legacy) + '\n');
    entry.fragments.push(`${bundle}/${file}`);
    rows.push(`| ${file} | ${f.from}–${f.to} | ${f.layer || ''} | ${f.responsibility || ''} |`);
  });
  if (next !== last + 1) fail(`${bundle}: fragments end at ${next - 1}, expected ${last}`);
  if (spec.close) { write(path.join(dir, '_close.txt'), slice(lines, spec.close[0], spec.close[1]) + '\n'); entry.close = `${bundle}/_close.txt`; }
  bundles.push(entry);
  write(path.join(dir, 'README.md'),
    `# ${spec.source} — source fragments\n\n` +
    `The browser receives these files joined in the order below as \`/js/${spec.source}\`` +
    (spec.open ? `, between \`_open.txt\` (the file header and the opening of the wrapper function) and \`_close.txt\` (its closing line)` : '') +
    `.\nThe code is the legacy \`${spec.source}\`, cut at statement boundaries and otherwise unchanged; ` +
    `\`LegacySiteBaselineTests\` fails if the joined text differs from the legacy file by anything not listed in \`tests/Nabd.Tests/LegacyBaseline/seams.json\`.\n\n` +
    `The "layer" column says where each responsibility belongs in the layered design; it is the map for moving code out of the browser, one fragment at a time.\n\n` +
    `| file | legacy lines | layer | responsibility |\n|---|---|---|---|\n${rows.join('\n')}\n`);
  console.log(`${spec.source}: ${spec.fragments.length} fragments, lines ${first}-${last}`);
}
write(path.join(WEB, 'ClientScripts', 'bundles.json'), JSON.stringify({
  note: 'The script bundles the page loads and the source fragments each one is joined from, in order. Read by ClientBundleProvider.',
  bundles,
}, null, 1) + '\n');

/* ---------- markup ---------- */
const html = linesOf(plan.html.source);
const partialCall = file => `@await Html.PartialAsync("~/${file}")`;
// A composing file holds legacy lines and calls to partial views; a partial holds a line range. No file ends with
// a line feed: the line feed after each call in the composing file is the one the legacy text had there.
function compose(parts, from, to) {
  let next = from;
  const out = [];
  for (const p of parts) {
    if (p.body) { out.push('@RenderBody()'); next = plan.html.view.parts[plan.html.view.parts.length - 1].to + 1; continue; }
    if (p.from !== next) fail(`markup: part at ${p.from} expected to start at ${next}`);
    next = p.to + 1;
    if (p.literal) { out.push(slice(html, p.from, p.to)); continue; }
    out.push(partialCall(p.partial));
    const text = p.parts ? compose(p.parts, p.from, p.to) : slice(html, p.from, p.to);
    // Razor leaves an "@" between two word characters alone (an e-mail address); any other "@" would be read as code.
    if (!p.parts && text.replace(/\w@\w/g, '').includes('@')) fail(`markup: ${p.partial} holds an "@" that Razor would read as code`);
    write(path.join(WEB, p.partial), applySeams(plan.html.source, text));
  }
  if (next !== to + 1) fail(`markup: parts end at ${next - 1}, expected ${to}`);
  return out.join('\n');
}
const view = plan.html.view, layout = plan.html.layout;
write(path.join(WEB, view.file), compose(view.parts, view.parts[0].from, view.parts[view.parts.length - 1].to));
const total = html.length - 1;
write(path.join(WEB, layout.file), applySeams(plan.html.source, compose(layout.parts, 1, total)) + '\n');
console.log(`${plan.html.source}: ${total} lines into a layout, a view and partial views`);

/* ---------- styles ---------- */
for (const f of fs.readdirSync(SITE).filter(f => f.endsWith('.css'))) write(path.join(WEB, 'wwwroot/css', f), applySeams(f, fs.readFileSync(path.join(SITE, f), 'utf8')));
console.log(CHECK ? 'plan is valid; nothing written' : 'written');
