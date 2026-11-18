import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = 'src/app/NabdRuntime.js';
const outputDir = path.join(root, 'dist');
const outputFile = path.join(outputDir, 'Nabd-Clinical-Simulator-v1.5-Preview.html');
const moduleCache = new Map();

async function loadModule(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath);
  const source = await readFile(absolutePath, 'utf8');
  const imports = [];
  const importPattern = /^import\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm;
  let stripped = source.replace(importPattern, (_match, names, specifier) => {
    imports.push({ names: names.split(',').map((name) => name.trim()).filter(Boolean), dependency: path.posix.normalize(path.posix.join(path.posix.dirname(relativePath), specifier)) });
    return '';
  });
  if (/^\s*import\s/m.test(stripped)) throw new Error(`Unsupported import syntax in ${relativePath}`);
  const exports = [];
  const exportPattern = /\bexport\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g;
  for (const match of stripped.matchAll(exportPattern)) exports.push(match[1]);
  stripped = stripped.replace(/\bexport\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/g, '');
  const record = { relativePath, source: stripped, imports, exports };
  moduleCache.set(absolutePath, record);
  for (const item of imports) await loadModule(item.dependency);
  return record;
}

await loadModule(entry);
const ordered = [];
const visited = new Set();
function visit(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (visited.has(absolutePath)) return;
  visited.add(absolutePath);
  const record = moduleCache.get(absolutePath);
  for (const dependency of record.imports) visit(dependency.dependency);
  ordered.push(record);
}
visit(entry);

const bundleParts = ['const __nabdModules = Object.create(null);'];
for (const record of ordered) {
  const absolutePath = path.resolve(root, record.relativePath);
  const moduleKey = path.relative(root, absolutePath).split(path.sep).join('/');
  let body = record.source;
  for (const dependency of record.imports) {
    const dependencyKey = path.relative(root, path.resolve(root, dependency.dependency)).split(path.sep).join('/');
    const bindings = dependency.names.map((name) => {
      const [imported, local] = name.split(/\s+as\s+/);
      return local ? `${imported}: ${local}` : imported;
    }).join(', ');
    body = `const { ${bindings} } = __nabdModules[${JSON.stringify(dependencyKey)}];\n${body}`;
  }
  if (/^\s*export\s/m.test(body)) throw new Error(`Unsupported export syntax in ${record.relativePath}`);
  const returned = record.exports.length ? `return { ${[...new Set(record.exports)].join(', ')} };` : 'return {};';
  bundleParts.push(`__nabdModules[${JSON.stringify(moduleKey)}] = (() => {\n${body}\n${returned}\n})();`);
}
const bundle = `${bundleParts.join('\n\n')}\n`;

const [htmlSource, css] = await Promise.all([
  readFile(path.join(root, 'index.html'), 'utf8'),
  readFile(path.join(root, 'src/styles.css'), 'utf8'),
]);
let html = htmlSource
  .replace('<title>Nabd Clinical Simulation | v1.5 Forearm Contact</title>', '<title>Nabd Clinical Simulation | v1.5 Forearm Contact Preview</title>')
  .replace('<link rel="stylesheet" href="./src/styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="./src/engine.js"></script>', '<!-- NABD_V1_RUNTIME -->');

const embeddedAssets = [
  ['embedded-patient', 'assets/patient/patient.glb'],
  ['embedded-internal-atlas', 'assets/anatomy/internal-atlas.glb'],
  ['asset-operating-table-base', 'assets/operating-table/base.glb'],
  ['asset-operating-table-top', 'assets/operating-table/top.glb'],
  ['asset-surgical-light-pendant-system', 'assets/surgical-system/light-pendant-system.glb'],
  ['asset-anesthesia-workstation', 'assets/anesthesia/workstation.glb'],
  ['asset-glove-left', 'assets/staff/glove-left.glb'],
  ['asset-glove-right', 'assets/staff/glove-right.glb'],
  ['asset-supervisor', 'assets/staff/supervisor.glb'],
];
const assetTags = [];
for (const [id, relativePath] of embeddedAssets) {
  const bytes = await readFile(path.join(root, relativePath));
  assetTags.push(`<script type="application/octet-stream" id="${id}">${bytes.toString('base64')}</script>`);
}
const rapierSource = await readFile(path.join(root, 'vendor/rapier/rapier.mjs'));
const physicsTag = `<script type="application/octet-stream" id="forearm-physics">${rapierSource.toString('base64')}</script>`;
const runtimeTag = `<script>\n${bundle}\n</script>`;
html = html.replace('<!-- NABD_V1_RUNTIME -->', () => `${assetTags.join('\n')}\n${physicsTag}\n${runtimeTag}`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, html);
process.stdout.write(`Built standalone preview: ${path.relative(root, outputFile)} (${(Buffer.byteLength(html) / 1048576).toFixed(2)} MiB)\n`);
