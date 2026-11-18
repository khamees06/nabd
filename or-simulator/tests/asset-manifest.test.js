import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('asset manifest paths, byte sizes and SHA-256 hashes match the delivered assets', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'assets/asset-manifest.json'), 'utf8'));
  assert.equal(manifest.schemaVersion, 1);
  assert.ok(manifest.assetCount >= 8);
  let totalBytes = 0;
  for (const asset of manifest.assets) {
    const filePath = path.join(root, asset.path);
    const [bytes, info] = await Promise.all([readFile(filePath), stat(filePath)]);
    assert.equal(info.size, asset.bytes, `${asset.path} byte size changed`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, `${asset.path} hash changed`);
    totalBytes += info.size;
  }
  assert.equal(totalBytes, manifest.totalBytes);
});
