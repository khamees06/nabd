import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'src');

async function walk(directory) {
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}

test('all relative JavaScript imports resolve to real files', async () => {
  const files = await walk(sourceRoot);
  const unresolved = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
      const target = path.resolve(path.dirname(file), match[1]);
      try { await access(target); }
      catch { unresolved.push(`${path.relative(root, file)} -> ${match[1]}`); }
    }
  }
  assert.deepEqual(unresolved, []);
});
