import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createBodySegments, SEGMENT_INDEX, SEGMENTS } from '../src/patient/BodySegments.js';
import { fitBodyProxies, measureSkinPenetration, ellipseSd } from '../src/patient/BodyProxies.js';
import { rigidFromElements } from '../src/patient/JointModel.js';
import { buildRig, skinnedMesh, tube } from './fake-rig.mjs';

// A partial body: an elliptic forearm tube, a round upper-arm tube and two thigh tubes, all on the fake rig.
function body({ thighGap = 0.0 } = {}) {
  const rig = buildRig();
  if (thighGap) {
    // Move the right thigh's tube toward the left one (the left and right thighs are not adjacent).
    for (const name of ['upperleg01.R', 'upperleg02.R', 'lowerleg01.R']) rig.positions[name] = [rig.positions[name][0] + thighGap, ...rig.positions[name].slice(1)];
  }
  const parts = [
    tube(rig, 'lowerarm01.L', 'wrist.L', { rx: 0.04, ry: 0.03, weights: () => ({ 'lowerarm01.L': 1 }) }),
    tube(rig, 'upperarm01.L', 'lowerarm01.L', { r: 0.05, weights: () => ({ 'upperarm01.L': 1 }) }),
    tube(rig, 'upperleg01.L', 'lowerleg01.L', { r: 0.075, weights: () => ({ 'upperleg01.L': 1 }) }),
    tube(rig, 'upperleg01.R', 'lowerleg01.R', { r: 0.075, weights: () => ({ 'upperleg01.R': 1 }) }),
  ];
  const vertices = [], triangles = [];
  for (const part of parts) {
    const base = vertices.length;
    vertices.push(...part.vertices);
    triangles.push(...part.triangles.map((t) => t.map((k) => k + base)));
  }
  const mesh = skinnedMesh(rig, vertices, triangles, 'Clinical skin • photo albedo and pores');
  const segments = createBodySegments([mesh]);
  const v = new THREE.Vector3();
  const rest = new Float64Array(vertices.length * 3);
  for (let i = 0; i < vertices.length; i++) rest.set(mesh.getVertexPosition(i, v).applyMatrix4(mesh.matrixWorld).toArray(), i * 3);
  const index = new Map(rig.bones.map((b, i) => [b.name, i]));
  const proxies = fitBodyProxies({ segments, skin: mesh, restPositions: rest, frameOf: (i) => rigidFromElements(rig.bones[i].matrixWorld.elements),
    boneIndexOf: (name) => index.get(name), superior: [0, 1, 0] });
  return { rig, mesh, segments, proxies, rest };
}

test('ellipse distance is exact on the axes and signed', () => {
  assert.ok(Math.abs(ellipseSd(0.05, 0, 0.04, 0.03) - 0.01) < 1e-12);
  assert.ok(Math.abs(ellipseSd(0, -0.04, 0.04, 0.03) - 0.01) < 1e-12);
  assert.ok(ellipseSd(0, 0, 0.04, 0.03) < 0);
});

test('proxies follow the skin: axis, at least 95 % of the skin outside the inner proxy, tight fit', () => {
  const { proxies, rig } = body();
  const summary = proxies.summary();
  const fitted = summary.segments.filter((s) => s.fittedOn);
  assert.deepEqual(fitted.map((s) => s.id).sort(), ['forearm.L', 'thigh.L', 'thigh.R', 'upperArm.L']);
  for (const s of fitted) {
    assert.ok(s.outsideInner >= 0.95, `${s.id} ${s.outsideInner}`);
    assert.ok(s.innerGapMm.p50 >= 0 && s.innerGapMm.p50 < 2, `${s.id} gap ${s.innerGapMm.p50} mm`);
    assert.ok(s.lowestIsSample, `${s.id}: the lowest rest vertex is a sample`);
    assert.ok(s.samples >= 24 && s.samples <= 40, `${s.id} samples ${s.samples}`);
  }
  // The forearm's axis runs from the elbow to the wrist; its cross-section keeps the 40 × 30 mm ellipse.
  const fore = proxies.proxies[proxies.proxyOf('forearm.L')];
  const elbow = new THREE.Vector3(...rig.positions['lowerarm01.L']), wrist = new THREE.Vector3(...rig.positions['wrist.L']);
  const axis = new THREE.Vector3(...fore.e0);
  assert.ok(axis.dot(wrist.clone().sub(elbow).normalize()) > 0.999);
  const forearm = summary.segments.find((s) => s.id === 'forearm.L');
  const mid = forearm.innerSemiAxesMm[5];
  assert.ok(Math.abs(Math.max(...mid) - 40) <= 2 && Math.abs(Math.min(...mid) - 30) <= 2, JSON.stringify(mid));
  // Signed distance: inside the axis, outside 1 cm off the skin.
  proxies.refresh();
  const centre = elbow.clone().lerp(wrist, 0.5);
  const j = proxies.proxyOf('forearm.L');
  assert.ok(proxies.sd(j, centre.toArray()) < -0.025);
  const sideways = centre.clone().addScaledVector(new THREE.Vector3(...fore.e1), 0.05);
  assert.ok(Math.abs(proxies.sd(j, sideways.toArray()) - 0.01) < 0.002, `${proxies.sd(j, sideways.toArray())}`);
});

test('samples and proxies ride on their bones', () => {
  const { proxies, rig, mesh } = body();
  const v = new THREE.Vector3();
  const fore = SEGMENT_INDEX['forearm.L'], j = proxies.proxyOf('forearm.L');
  const skinnedAt = (i) => mesh.getVertexPosition(proxies.samples.vertex[i], v).applyMatrix4(mesh.matrixWorld).toArray();
  proxies.refresh();
  const before = proxies.samplesOf(fore).map((i) => proxies.sd(j, skinnedAt(i)));
  rig.turnWorld('lowerarm01.L', [0.3, 1, 0.2], 35);
  proxies.refresh();
  let worst = 0, worstSd = 0;
  proxies.samplesOf(fore).forEach((i, k) => {
    const skinned = skinnedAt(i);
    worst = Math.max(worst, new THREE.Vector3(...skinned).distanceTo(new THREE.Vector3(...proxies.samplePosition(i))));
    worstSd = Math.max(worstSd, Math.abs(proxies.sd(j, skinned) - before[k]));
  });
  assert.ok(worst < 1e-9, `sample vs re-skinned vertex ${worst}`);
  // A rigid move of the bone moves skin and proxy together: every distance stays what it was at rest.
  assert.ok(worstSd < 1e-9, `skin-to-proxy distance changed by ${worstSd}`);
});

test('rest overlap of non-adjacent segments becomes an allowance; penetration is measured on skin vertices', () => {
  const { proxies, mesh, segments, rest } = body({ thighGap: 0.2 });
  const summary = proxies.summary();
  assert.ok(summary.restOverlapMm['thigh.R|thigh.L'] > 0, JSON.stringify(summary.restOverlapMm));
  const j = proxies.proxyOf('thigh.L');
  let found = 0;
  for (const i of proxies.samplesOf(SEGMENT_INDEX['thigh.R'])) if (proxies.allowance(i, j) > 0.002) found++;
  assert.ok(found > 0);
  // Adjacent pairs are never tested: the upper arm and the forearm overlap at the elbow without an allowance.
  for (const i of proxies.samplesOf(SEGMENT_INDEX['forearm.L'])) assert.equal(proxies.allowance(i, proxies.proxyOf('upperArm.L')), 0);
  // A support plane at y = 1.0: the measured depth is the lowest vertex's depth below it.
  const count = rest.length / 3;
  const supports = { sd: (p) => p[1] - 1.0 };
  const pen = measureSkinPenetration({ count, positionOf: (i, out) => { out[0] = rest[i * 3]; out[1] = rest[i * 3 + 1]; out[2] = rest[i * 3 + 2]; },
    segmentOf: (i) => segments.recordOf(mesh).vSeg[i], supports, proxies });
  let lowest = Infinity;
  for (let i = 0; i < count; i++) lowest = Math.min(lowest, rest[i * 3 + 1]);
  assert.ok(Math.abs(pen.supportMaxMm - (1.0 - lowest) * 1000) < 1e-6);
  assert.ok(pen.selfMaxMm > 0 && /thigh/.test(pen.selfWorstPair));
  // G2: a resting plane at y = 1.0 with supportAt and depthBelowTop: each segment's lowest skin over it, and
  // compression declared per part (the shank here may sink 5 mm, everything else 2 mm).
  const plane = { sd: (p) => p[1] - 1.0, depthBelowTop: (p) => ({ depth: Math.max(0, 1.0 - p[1]) }), supportAt: () => ({ y: 1.0, kind: 'pad', name: 'plane' }) };
  const vSeg = segments.recordOf(mesh).vSeg;
  const pen2 = measureSkinPenetration({ count, positionOf: (i, out) => { out[0] = rest[i * 3]; out[1] = rest[i * 3 + 1]; out[2] = rest[i * 3 + 2]; },
    segmentOf: (i) => vSeg[i], supports: plane, proxies, allowanceMm: { shank: 5 } });
  let expectOver = 0;
  const lowestBy = {};
  for (let i = 0; i < count; i++) {
    const seg = SEGMENTS[vSeg[i]];
    const depth = (1.0 - rest[i * 3 + 1]) * 1000;
    if (depth > (seg?.part === 'shank' ? 5 : 2)) expectOver++;
    if (seg) lowestBy[seg.id] = Math.min(lowestBy[seg.id] ?? Infinity, rest[i * 3 + 1]);
  }
  assert.equal(pen2.belowTopOverAllowance, expectOver);
  assert.deepEqual(pen2.allowanceMm, { shank: 5 });
  for (const [id, y] of Object.entries(lowestBy)) {
    assert.ok(Math.abs(pen2.bySegment[id].lowestGapMm - (y - 1.0) * 1000) < 1e-9, id);
    assert.equal(pen2.bySegment[id].lowestY, y);
    assert.equal(pen2.bySegment[id].lowestGapSupport, 'plane');
  }
});
