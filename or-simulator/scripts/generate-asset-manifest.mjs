import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetRoot = path.join(root, 'assets');
const output = path.join(assetRoot, 'asset-manifest.json');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && full !== output) files.push(full);
  }
  return files;
}

const files = (await walk(assetRoot)).sort();
const assets = [];
for (const full of files) {
  const [bytes, info] = await Promise.all([readFile(full), stat(full)]);
  assets.push({
    path: path.relative(root, full).split(path.sep).join('/'),
    bytes: info.size,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}
const manifest = { schemaVersion: 1, generatedAt: new Date().toISOString(), assetCount: assets.length, totalBytes: assets.reduce((sum, item) => sum + item.bytes, 0), assets };
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`Wrote ${assets.length} asset entries (${manifest.totalBytes.toLocaleString()} bytes) to assets/asset-manifest.json\n`);
