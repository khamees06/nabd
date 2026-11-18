import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { installSkinPickCache } from '../src/patient/SkinPickCache.js';

// A bent, three-bone tube with a morph target and three materials (front, back and double sided), so the
// raycast walks groups, culls faces, interpolates uv and normal, and blends up to two bones per vertex.
function buildSkin() {
  const geometry = new THREE.CylinderGeometry(0.3, 0.25, 1.8, 24, 18, false);
  const position = geometry.attributes.position;
  const skinIndex = [], skinWeight = [], morph = [];
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i) + 0.9;
    const segment = Math.min(1, Math.floor(y / 0.9));
    const blend = Math.min(1, Math.max(0, (y - segment * 0.9) / 0.9));
    skinIndex.push(segment, segment + 1, 0, 0);
    skinWeight.push(1 - blend, blend, 0, 0);
    morph.push(position.getX(i) * 0.2, 0, position.getZ(i) * 0.15);
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
  geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(morph, 3)];
  geometry.morphTargetsRelative = true;
  const bones = [new THREE.Bone(), new THREE.Bone(), new THREE.Bone()];
  bones[0].position.y = -0.9;
  bones[1].position.y = 0.9; bones[0].add(bones[1]);
  bones[2].position.y = 0.9; bones[1].add(bones[2]);
  const materials = [THREE.FrontSide, THREE.BackSide, THREE.DoubleSide].map((side) => new THREE.MeshBasicMaterial({ side }));
  const mesh = new THREE.SkinnedMesh(geometry, materials);
  mesh.add(bones[0]);
  mesh.position.set(0.1, 1.0, -0.2);
  mesh.rotation.set(0.2, 0.4, 0.1);
  mesh.bind(new THREE.Skeleton(bones));
  mesh.updateMorphTargets();
  const scene = new THREE.Scene();
  scene.add(mesh);
  return { mesh, bones, scene };
}

function pose({ bones, scene, mesh }, a, b, influence) {
  bones[1].rotation.set(a, 0, a * 0.5);
  bones[2].rotation.set(0, b, b);
  mesh.morphTargetInfluences[0] = influence;
  scene.updateMatrixWorld(true);
}

const plain = (hits) => hits.map((hit) => ({
  distance: hit.distance, point: hit.point.toArray(), faceIndex: hit.faceIndex,
  face: { a: hit.face.a, b: hit.face.b, c: hit.face.c, materialIndex: hit.face.materialIndex, normal: hit.face.normal.toArray() },
  uv: hit.uv?.toArray(), normal: hit.normal?.toArray(), object: hit.object.name,
}));

function castAll(mesh) {
  const ray = new THREE.Raycaster();
  const camera = new THREE.PerspectiveCamera(60, 1.4, 0.05, 20);
  camera.position.set(1.6, 1.4, 1.9);
  camera.lookAt(0, 1, 0);
  camera.updateMatrixWorld(true);
  const results = [];
  for (let x = -1; x <= 1.0001; x += 0.1) {
    for (let y = -1; y <= 1.0001; y += 0.1) {
      ray.setFromCamera(new THREE.Vector2(x, y), camera);
      results.push(plain(ray.intersectObject(mesh, false)));
    }
  }
  return results;
}

test('cached skin raycasts return exactly what three.js returns, through bone, morph and position changes', () => {
  const reference = buildSkin();
  const cached = buildSkin();
  const handle = installSkinPickCache(cached.mesh);
  assert.ok(handle, 'cache installs on a plain SkinnedMesh');
  assert.equal(installSkinPickCache(cached.mesh), handle, 'installing twice returns the same cache');
  const steps = [
    [0.5, -0.4, 0.3],
    [0.5, -0.4, 0.3],
    [0.5, 0.7, 0.3],
    [-0.3, 0.7, 0.8],
  ];
  let hits = 0;
  for (const [a, b, influence] of steps) {
    pose(reference, a, b, influence);
    pose(cached, a, b, influence);
    const expected = castAll(reference.mesh);
    const actual = castAll(cached.mesh);
    assert.deepEqual(actual, expected);
    hits += expected.filter((list) => list.length).length;
  }
  assert.ok(hits > 80, `the ray grid hits the tube (${hits} rays hit)`);
  // The abdomen dent moves vertices through the position attribute.
  for (const { mesh } of [reference, cached]) {
    const position = mesh.geometry.attributes.position;
    for (let i = 0; i < 60; i++) position.setXYZ(i, position.getX(i) * 1.3, position.getY(i), position.getZ(i) * 1.3);
    position.needsUpdate = true;
  }
  assert.deepEqual(castAll(cached.mesh), castAll(reference.mesh));
});

test('an unchanged pose reuses every skinned vertex; a moved bone recomputes only the vertices it weights', () => {
  const skin = buildSkin();
  const { stats } = installSkinPickCache(skin.mesh);
  const count = skin.mesh.geometry.attributes.position.count;
  pose(skin, 0.4, 0.2, 0.5);
  castAll(skin.mesh);
  assert.equal(stats.computed, count, 'each vertex is skinned once');
  castAll(skin.mesh);
  assert.equal(stats.computed, count, 'no vertex is skinned again while nothing moved');
  pose(skin, 0.4, 0.9, 0.5);
  castAll(skin.mesh);
  const recomputed = stats.computed - count;
  assert.ok(recomputed > 0 && recomputed < count * 0.75, `only the top bone's vertices (${recomputed} of ${count})`);
});

test('outside a raycast getVertexPosition is three.js\'s own, so direct readers see the current pose', () => {
  const reference = buildSkin();
  const cached = buildSkin();
  installSkinPickCache(cached.mesh);
  pose(reference, 0.3, 0.3, 0.2);
  pose(cached, 0.3, 0.3, 0.2);
  castAll(cached.mesh);
  pose(reference, -0.6, 0.1, 0.9);
  pose(cached, -0.6, 0.1, 0.9);
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i < cached.mesh.geometry.attributes.position.count; i += 7) {
    assert.deepEqual(cached.mesh.getVertexPosition(i, a).toArray(), reference.mesh.getVertexPosition(i, b).toArray());
  }
});

test('non-skinned meshes are left alone', () => {
  assert.equal(installSkinPickCache(new THREE.Mesh(new THREE.BoxGeometry())), null);
  assert.equal(installSkinPickCache(null), null);
});
