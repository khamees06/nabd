import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  createBodySegments, segmentOfBoneName, canonicalBoneName, SEGMENTS, SEGMENT_INDEX, areAdjacent, seededRandom,
} from '../src/patient/BodySegments.js';
import { createPoseVersion } from '../src/patient/PoseVersion.js';
import { buildRig, skinnedMesh, sanitize } from './fake-rig.mjs';

// A strip of skin from the shoulder band down the left arm, with hand-set weights:
//  0–2  clavicle 0.6 + upperarm01 0.4   → shoulder band merged into the upper arm (arm ≥ chest)
//  3–5  clavicle 0.6 + spine01 0.4      → merged into the chest (chest > arm)
//  6–8  upperarm01 1 (+ a 0.01 noise weight on a right-side bone, ignored)
//  9–11 upperarm02 0.5 + lowerarm01 0.5 → elbow zone (top weight below 0.65)
//  12–14 lowerarm01 0.9 + lowerarm02 0.1
function armStrip(rig) {
  const weights = [
    { 'clavicle.L': 0.6, 'upperarm01.L': 0.4 }, { 'clavicle.L': 0.6, 'spine01': 0.4 },
    { 'upperarm01.L': 0.99, 'wrist.R': 0.01 }, { 'upperarm02.L': 0.5, 'lowerarm01.L': 0.5 }, { 'lowerarm01.L': 0.9, 'lowerarm02.L': 0.1 },
  ];
  const vertices = [];
  weights.forEach((w, row) => {
    for (let k = 0; k < 3; k++) vertices.push({ p: [0.2 + 0.05 * row, 1.4 - 0.05 * row, 0.01 * k], w });
  });
  const triangles = [];
  for (let row = 0; row < weights.length; row++) triangles.push([row * 3, row * 3 + 1, row * 3 + 2]);
  return skinnedMesh(rig, vertices, triangles);
}

test('bone names map to segments with the raw and the sanitised (three.js GLTFLoader) spelling', () => {
  const names = ['upperarm01.L', 'lowerarm02.R', 'wrist.L', 'finger3-2.R', 'metacarpal2.L', 'upperleg02.L', 'lowerleg01.R', 'foot.L',
    'toe2-1.R', 'neck02', 'head', 'jaw', 'orbicularis03.L', 'eye.R', 'oris06', 'spine01', 'breast.R', 'spine04', 'spine05', 'root', 'pelvis.L'];
  const expected = ['upperArm.L', 'forearm.R', 'hand.L', 'hand.R', 'hand.L', 'thigh.L', 'shank.R', 'foot.L', 'foot.R', 'neck', 'head',
    'head', 'head', 'head', 'head', 'chest', 'chest', 'abdomen', 'pelvis', 'pelvis', 'pelvis'];
  names.forEach((name, i) => {
    assert.equal(SEGMENTS[segmentOfBoneName(name)]?.id, expected[i], name);
    assert.equal(SEGMENTS[segmentOfBoneName(sanitize(name))]?.id, expected[i], sanitize(name));
  });
  assert.equal(canonicalBoneName('finger3-1.L'), 'finger3-1L');
  assert.equal(segmentOfBoneName('mystery'), -1);
  assert.ok(areAdjacent('upperArm.L', 'forearm.L') && areAdjacent('chest', 'upperArm.R') && !areAdjacent('forearm.L', 'chest'));
});

test('triangle segments: shoulder band merge, noise weights ignored, joint zones, hits by barycentre', () => {
  for (const sanitized of [false, true]) {
    const rig = buildRig({ sanitized });
    const mesh = armStrip(rig);
    const segments = createBodySegments([mesh]);
    const r = segments.recordOf(mesh);
    const id = (t) => SEGMENTS[r.triSeg[t]].id;
    assert.equal(id(0), 'upperArm.L');
    assert.equal(id(1), 'chest');
    assert.equal(id(2), 'upperArm.L');
    assert.equal(r.triW1[2], 1, 'the 0.01 weight on a right-side bone is float residue');
    assert.equal(r.triSeg2[2], -1);
    assert.equal(id(3), 'upperArm.L');
    assert.ok(Math.abs(r.triW1[3] - 0.5) < 1e-6 && SEGMENTS[r.triSeg2[3]].id === 'forearm.L');
    assert.equal(id(4), 'forearm.L');
    const s = segments.summary();
    assert.equal(s.assignedFraction, 1);
    assert.deepEqual(s.unassignedBones, []);
    const regions = [...r.region].map((x) => ['forearm', 'hand', 'elbow', 'wrist', 'upperArm', 'shoulder'][x] ?? x);
    assert.equal(regions[0], 'shoulder');
    assert.equal(regions[3], 'elbow');
    assert.equal(regions[4], 'forearm');
    // A hit blends the corner weights by its barycentric coordinates.
    const hit = { object: mesh, faceIndex: 3, barycoord: new THREE.Vector3(1 / 3, 1 / 3, 1 / 3) };
    const at = segments.ofHit(hit);
    assert.equal(at.zone, 'elbow');
    assert.equal(at.anchorMode, 'dual');
    assert.equal(at.side, 'left');
    assert.ok(Math.abs(at.w1 - 0.5) < 1e-6);
    const single = segments.ofHit({ object: mesh, faceIndex: 4, barycoord: new THREE.Vector3(1, 0, 0) });
    assert.equal(single.segment, 'forearm.L');
    assert.equal(single.anchorMode, 'single');
    assert.equal(segments.ofHit({ object: new THREE.Mesh(), faceIndex: 0 }), null);
    assert.equal(segments.trianglesOf('elbow', 'left').length, 1);
    assert.equal(segments.trianglesOf('elbow', 'right').length, 0);
  }
});

test('privacy and eyes surfaces are labelled, and the clinical skin carries the gate numbers', () => {
  const rig = buildRig();
  const quad = (name, weight, y) => skinnedMesh(rig, [0, 1, 2, 3].map((k) => ({ p: [0.1 * (k % 2), y + 0.1 * (k >> 1), 0.05], w: weight })), [[0, 1, 2], [1, 3, 2]], name);
  const body = quad('Clinical skin • photo albedo and pores', { spine03: 1 }, 1.1);
  const privacy = quad('Local privacy • opaque blurred skin', { spine05: 1 }, 0.9);
  const eyes = quad('Eyes • brown iris and sclera', { 'eye.L': 1 }, 1.6);
  const segments = createBodySegments([body, privacy, eyes]);
  assert.equal(segments.ofHit({ object: privacy, faceIndex: 0 }).region, 'privacy');
  assert.equal(segments.ofHit({ object: privacy, faceIndex: 0 }).privacy, true);
  // Privacy and eyes are never pickable: no part, pickable false (G3's pick refuses them).
  for (const [object, face] of [[privacy, 0], [eyes, 1]]) {
    const at = segments.ofHit({ object, faceIndex: face });
    assert.equal(at.part, null);
    assert.equal(at.pickable, false);
  }
  assert.equal(segments.ofHit({ object: body, faceIndex: 0 }).pickable, segments.ofHit({ object: body, faceIndex: 0 }).part !== null);
  assert.equal(segments.ofHit({ object: eyes, faceIndex: 1 }).region, 'eyes');
  assert.equal(segments.ofHit({ object: body, faceIndex: 0 }).region, 'abdomen');
  const s = segments.summary();
  assert.equal(s.privacyTriangles, 2);
  assert.equal(s.nonPrivacyTriangles, 4);
});

test('the hip–trunk zone takes the limb and the neck moves with the head', () => {
  const rig = buildRig();
  const mesh = skinnedMesh(rig, [
    { p: [0.1, 0.9, 0], w: { 'pelvis.L': 0.4, 'upperleg01.L': 0.6 } }, { p: [0.12, 0.9, 0], w: { 'pelvis.L': 0.4, 'upperleg01.L': 0.6 } },
    { p: [0.1, 0.88, 0], w: { 'pelvis.L': 0.4, 'upperleg01.L': 0.6 } },
    { p: [0, 1.55, 0], w: { neck02: 1 } }, { p: [0.01, 1.55, 0], w: { neck02: 1 } }, { p: [0, 1.56, 0], w: { neck02: 1 } },
  ], [[0, 1, 2], [3, 4, 5]]);
  const segments = createBodySegments([mesh]);
  const hip = segments.ofHit({ object: mesh, faceIndex: 0, barycoord: new THREE.Vector3(1, 0, 0) });
  assert.equal(hip.segment, 'thigh.L');
  assert.equal(hip.part, 'thigh.L');
  const neck = segments.ofHit({ object: mesh, faceIndex: 1, barycoord: new THREE.Vector3(1, 0, 0) });
  assert.equal(neck.segment, 'neck');
  assert.equal(neck.part, 'head');
  assert.equal(SEGMENT_INDEX['foot.R'], SEGMENTS.length - 1);
});

test('seeded random numbers repeat', () => {
  const a = seededRandom(42), b = seededRandom(42);
  for (let k = 0; k < 10; k++) assert.equal(a(), b());
});

test('pose version: changes once per pose change, never for an unchanged or rewritten pose', () => {
  const rig = buildRig();
  const pose = createPoseVersion(rig.bones);
  const v0 = pose.read();
  assert.equal(pose.read(), v0, 'nothing moved');
  rig.turnWorld('neck01', [0, 1, 0], 10);
  const v1 = pose.read();
  assert.equal(v1, v0 + 1, 'a turned neck is a pose change (the old pick key held only the limb tips)');
  assert.equal(pose.read(), v1);
  // Writing the same rotation again does not count.
  const q = rig.byName.get('neck01').quaternion.clone();
  rig.byName.get('neck01').quaternion.copy(q);
  rig.scene.updateMatrixWorld(true);
  assert.equal(pose.read(), v1);
  assert.equal(pose.bump(), v1 + 1);
  assert.equal(pose.bones, rig.bones.length);
});
