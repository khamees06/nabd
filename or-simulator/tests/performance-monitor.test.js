import test from 'node:test';
import assert from 'node:assert/strict';
import { PerformanceMonitor } from '../src/core/PerformanceMonitor.js';

test('PerformanceMonitor samples FPS and renderer counters without requiring browser memory APIs', () => {
  const monitor = new PerformanceMonitor({ sampleWindowMs: 500 });
  const info = { render: { calls: 8, triangles: 1200, points: 3, lines: 4 }, memory: { geometries: 12, textures: 7 }, programs: [{}, {}] };
  monitor.sample(0, info, 0.016, null);
  const metrics = monitor.sample(500, info, 0.020, null);
  assert.equal(metrics.fps, 4);
  assert.equal(metrics.frameMs, 20);
  assert.equal(metrics.calls, 8);
  assert.equal(metrics.triangles, 1200);
  assert.equal(metrics.geometries, 12);
  assert.equal(metrics.textures, 7);
  assert.equal(metrics.programs, 2);
  assert.equal(metrics.heapUsedMB, null);
});
