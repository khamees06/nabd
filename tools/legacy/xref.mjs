// Cross-reference of the legacy scripts: for every top-level declaration, where else its name appears.
// A name with no other occurrence anywhere (scripts and index.html, where inline handlers call globals)
// is a dead-code CANDIDATE; the audit still has to confirm it by reading the code, because a name can be
// reached through a computed property or a string built at run time.
//
// Usage: node tools/legacy/xref.mjs <site folder> [--json out.json]
// Prints a Markdown table per script, unreferenced names first.
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const root = argv[0];
const jsonOut = argv.includes('--json') ? argv[argv.indexOf('--json') + 1] : null;
if (!root) { console.error('usage: node xref.mjs <site folder> [--json out.json]'); process.exit(2); }

const SCRIPTS = [
  { file: 'script.js', indent: 4 },   // one classic script, 4-space top level
  { file: 'er.js', indent: 2 },       // inside one wrapper function
  { file: 'resp.js', indent: 2 },
  { file: 'motion.js', indent: 2 },
  { file: 'terms.js', indent: 2 },
  { file: 'ui.js', indent: 2 },
];
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const sources = Object.fromEntries([...SCRIPTS.map(s => s.file), 'index.html'].map(f => [f, read(f)]));

// Long data lines (embedded images) cannot hold identifiers worth counting and make the scan slow.
const scanText = Object.fromEntries(Object.entries(sources).map(([f, t]) => [f, t.split('\n').map(l => (l.length > 3000 ? l.slice(0, 200) : l)).join('\n')]));

const declRe = indent => new RegExp(`^ {${indent}}(?:async\\s+)?(function\\*?|const|let|var|class)\\s+([A-Za-z_$][\\w$]*)`);
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const count = (text, name) => (text.match(new RegExp(`(?<![\\w$])${escapeRe(name)}(?![\\w$])`, 'g')) || []).length;

const report = {};
for (const { file, indent } of SCRIPTS) {
  const lines = sources[file].split('\n');
  const re = declRe(indent);
  const rows = [];
  lines.forEach((line, i) => {
    const m = line.length < 3000 ? re.exec(line) : re.exec(line.slice(0, 200));
    if (!m) return;
    const name = m[2];
    const own = count(scanText[file], name) - 1; // minus the declaration itself
    const elsewhere = Object.entries(scanText).filter(([f]) => f !== file).map(([f, t]) => [f, count(t, name)]).filter(([, n]) => n > 0);
    rows.push({ name, kind: m[1], line: i + 1, sameFile: own, elsewhere: Object.fromEntries(elsewhere) });
  });
  report[file] = rows;
}

if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(report, null, 1));

for (const [file, rows] of Object.entries(report)) {
  const dead = rows.filter(r => r.sameFile === 0 && Object.keys(r.elsewhere).length === 0);
  const onlyElsewhere = rows.filter(r => r.sameFile === 0 && Object.keys(r.elsewhere).length > 0);
  console.log(`\n## ${file}: ${rows.length} top-level declarations, ${dead.length} with no other occurrence anywhere, ${onlyElsewhere.length} used only from other files\n`);
  if (dead.length) {
    console.log('| name | kind | line |\n|---|---|---|');
    dead.forEach(r => console.log(`| ${r.name} | ${r.kind} | ${r.line} |`));
  }
  if (onlyElsewhere.length) {
    console.log('\nUsed only from other files:\n\n| name | line | where |\n|---|---|---|');
    onlyElsewhere.forEach(r => console.log(`| ${r.name} | ${r.line} | ${Object.entries(r.elsewhere).map(([f, n]) => `${f} ×${n}`).join(', ')} |`));
  }
}
