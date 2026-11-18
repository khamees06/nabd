import test from 'node:test';
import assert from 'node:assert/strict';
import { createSceneManager } from '../src/core/SceneManager.js';

test('SceneManager renders and resizes through the existing renderer', () => {
  const calls = [];
  const scene = {};
  const camera = { aspect: 1, updateProjectionMatrix() { calls.push('projection'); } };
  const renderer = { info: { render: { calls: 4 } }, render(s, c) { calls.push(['render', s, c]); }, setSize(w, h, style) { calls.push(['size', w, h, style]); }, dispose() { calls.push('dispose'); } };
  const manager = createSceneManager({ scene, renderer, camera });
  assert.equal(manager.render(), true);
  assert.equal(manager.resize(800, 600), true);
  assert.equal(camera.aspect, 800 / 600);
  assert.equal(manager.getInfo().render.calls, 4);
  manager.dispose();
  assert.equal(manager.render(), false);
  assert.equal(manager.disposed, true);
  assert.ok(calls.some((call) => Array.isArray(call) && call[0] === 'size'));
});
