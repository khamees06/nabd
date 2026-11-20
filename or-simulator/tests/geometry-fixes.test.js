import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildHeadRing, createLowestSurface, HEAD_RING_DEFAULTS } from '../src/render/GeometryFixes.js';

// A sphere standing in for the back of the head: its triangles, as world positions plus an index.
function sphere(radius, centre, widthSegments = 48, heightSegments = 32) {
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  geometry.translate(...centre);
  return { geometry, positions: Float64Array.from(geometry.attributes.position.array), index: Array.from(geometry.index.array) };
}
function ringMesh(ring) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(ring.positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(ring.index, 1));
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
}
// Lowest height of every triangle over (x, z), by brute force (Möller–Trumbore from below).
function bruteLowest(positions, index, x, z) {
  const ray = new THREE.Ray(new THREE.Vector3(x, -10, z), new THREE.Vector3(0, 1, 0));
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), hit = new THREE.Vector3();
  let low = null;
  for (let t = 0; t < index.length; t += 3) {
    a.fromArray(positions, index[t] * 3); b.fromArray(positions, index[t + 1] * 3); c.fromArray(positions, index[t + 2] * 3);
    if (ray.intersectTriangle(a, b, c, false, hit) && (low === null || hit.y < low)) low = hit.y;
  }
  return low;
}

test('the lowest surface of a triangle soup equals a brute-force cast from below, and is null off it', () => {
  const { positions, index } = sphere(0.08, [0.01, 0.12, -0.02]);
  const field = createLowestSurface({ positions, index, bounds: [-0.1, 0.12, -0.12, 0.1], cell: 0.008 });
  let worst = 0, n = 0;
  for (let i = 0; i <= 30; i++) for (let k = 0; k <= 30; k++) {
    const x = -0.09 + 0.2 * i / 30, z = -0.11 + 0.18 * k / 30;
    const got = field.at(x, z), want = bruteLowest(positions, index, x, z);
    if (want === null) { assert.equal(got, null, `${x}, ${z}`); continue; }
    worst = Math.max(worst, Math.abs(got - want));
    n++;
  }
  assert.ok(n > 300, `${n} points over the sphere`);
  assert.ok(worst < 1e-9, `worst ${worst}`);
  assert.equal(field.at(0.5, 0), null, 'outside the bounds');
});

test('the head ring is about a thousand triangles inside its footprint, with the free shape where nothing presses on it', () => {
  const ring = buildHeadRing({ centre: [0, -0.72] });
  const { semiAxes: [ax, az], height, segments, rings } = HEAD_RING_DEFAULTS;
  assert.equal(ring.summary.triangles, rings * segments * 2 + segments * 2);
  assert.ok(ring.summary.triangles >= 800 && ring.summary.triangles <= 1200, `${ring.summary.triangles} triangles`);
  for (let i = 0; i < ring.positions.length / 3; i++) {
    const x = ring.positions[i * 3], y = ring.positions[i * 3 + 1], z = ring.positions[i * 3 + 2];
    assert.ok((x / ax) ** 2 + (z / az) ** 2 <= 1 + 1e-6, 'inside the outer footprint');
    assert.ok(y >= 0 && y <= height + 1e-7, 'between the pad and the free height');
  }
  assert.ok(Math.abs(ring.summary.maxHeight - height) < 1e-6, 'nothing presses on it: the crest is the free height');
  assert.equal(ring.summary.clampedVertices, 0);
  // The hole and the outside have no top; the crest is at the middle of the tube.
  assert.equal(ring.support.topAt(0, 0), null);
  assert.equal(ring.support.topAt(ax * 1.02, 0), null);
  assert.ok(Math.abs(ring.support.topAt(ax * (1 + HEAD_RING_DEFAULTS.hole) / 2, 0) - height) < 1e-6);
});

test('the ring support answers with the drawn triangles: topAt equals a raycast of the mesh to float precision', () => {
  const head = sphere(0.075, [0.004, 0.075 + 0.035, -0.012]);
  const field = createLowestSurface({ positions: head.positions, index: head.index, bounds: [-0.13, 0.13, -0.12, 0.12] });
  const ring = buildHeadRing({ centre: [0, 0], below: (x, z) => field.at(x, z) });
  const mesh = ringMesh(ring);
  const ray = new THREE.Raycaster();
  let worst = 0, hits = 0, misses = 0;
  for (let i = 0; i <= 60; i++) for (let k = 0; k <= 60; k++) {
    const x = -0.115 + 0.23 * i / 60, z = -0.105 + 0.21 * k / 60;
    ray.set(new THREE.Vector3(x, 1, z), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObject(mesh, false)[0];
    const top = ring.support.topAt(x, z);
    if (!hit) { if (top !== null) misses++; continue; }
    assert.ok(hit.face.normal.y > 0, 'a downward ray meets a face that points up');
    assert.notEqual(top, null, `${x}, ${z}`);
    worst = Math.max(worst, Math.abs(top - hit.point.y));
    hits++;
  }
  assert.ok(hits > 1500, `${hits} hits`);
  assert.equal(misses, 0, 'no top where the mesh has none');
  assert.ok(worst < 1e-6, `worst ${worst}`);
});

test('a head pressing on the ring: the gel is pushed under the skin, never into it, and touches along a band', () => {
  // Occiput 35 mm above the pad, as in the G2 rest pose; ring free height 55 mm. The back of the asset's head is
  // flatter than a 7.5 cm sphere toward the neck, so the stand-in is a 10 cm sphere.
  const head = sphere(0.1, [0, 0.1 + 0.035, 0], 96, 64);
  const field = createLowestSurface({ positions: head.positions, index: head.index, bounds: [-0.13, 0.13, -0.12, 0.12] });
  const ring = buildHeadRing({ centre: [0, 0], below: (x, z) => field.at(x, z), height: 0.055, clearance: 0.001 });
  assert.ok(ring.summary.clampedVertices > 20, `${ring.summary.clampedVertices} pressed vertices`);
  assert.ok(ring.summary.touchingVertices >= ring.summary.clampedVertices);
  // Every head vertex above the ring stays on or above the drawn top: no penetration, contact within 1 mm.
  let minGap = Infinity;
  for (let i = 0; i < head.positions.length / 3; i++) {
    const top = ring.support.topAt(head.positions[i * 3], head.positions[i * 3 + 2]);
    if (top === null) continue;
    minGap = Math.min(minGap, head.positions[i * 3 + 1] - top);
  }
  assert.ok(minGap >= 0 && minGap <= 0.001 + 1e-9, `lowest head vertex over the ring ${minGap}`);
  // The signed distance: inside the gel it is minus the depth below the top, above it the vertical gap.
  const x = 0.11 * 0.625, top = ring.support.topAt(x, 0);
  assert.ok(Math.abs(ring.support.sd(x, top - 0.003, 0).d + 0.003) < 1e-12);
  assert.equal(ring.support.sd(x, top - 0.003, 0).inside, true);
  // Above it: positive, at most the vertical gap (a nearer slope of the gel can be closer).
  const above = ring.support.sd(x, top + 0.002, 0).d;
  assert.ok(above > 0 && above <= 0.002 + 1e-12, String(above));
  assert.ok(ring.support.sd(0.5, 0.2, 0).d > 0.3, 'far away: the distance to its bounds');
  assert.ok(ring.support.sd(0, 0.01, 0).d > 0, 'in the hole: outside the gel');
});
