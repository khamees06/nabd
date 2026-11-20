// A small humanoid rig for the grab-anywhere unit tests (not a test file: node --test does not collect it).
// Bone names and bind joint positions follow patient.glb (MakeHuman names, metres, glTF +Y up, +Z forward,
// character left = +X; positions rounded from the skeleton study), with every bone's bind rotation the
// identity. The arms are in the asset's A-pose with the elbows bent forward, so the elbow hinge plane is
// defined the same way as on the real rig; the knees are bent a few degrees.
import * as THREE from 'three';

const CENTRE = {
  root: [0, 0.958, -0.069], spine05: [0, 0.9655, 0.0034], spine04: [0, 1.0535, -0.029], spine03: [0, 1.1211, -0.0196],
  spine02: [0, 1.1838, -0.028], spine01: [0, 1.324, -0.0504], neck01: [0, 1.5351, 0.0118], neck02: [0, 1.5574, 0.0164],
  neck03: [0, 1.5978, 0.0315], head: [0, 1.6343, 0.0476],
};
const LEFT = {
  clavicle: [0.0234, 1.459, 0.0242], shoulder01: [0.1161, 1.4738, 0.0236], upperarm01: [0.2036, 1.4289, 0.0186],
  upperarm02: [0.2452, 1.3708, 0.0189], lowerarm01: [0.3736, 1.2319, 0.0172], lowerarm02: [0.4439, 1.1672, 0.1162],
  wrist: [0.5117, 1.0996, 0.2145], 'finger3-1': [0.5607, 1.0443, 0.3033], 'finger3-2': [0.569, 1.0162, 0.3273],
  pelvis: [0, 0.9655, 0.0034], upperleg01: [0.111, 0.9598, -0.0073], upperleg02: [0.1226, 0.8696, 0.0185],
  lowerleg01: [0.1522, 0.5214, 0.0277], lowerleg02: [0.179, 0.3058, 0.0209], foot: [0.2025, 0.074, 0.0138],
  'toe2-1': [0.19, 0.03, 0.17],
};
const PARENT = {
  spine05: 'root', spine04: 'spine05', spine03: 'spine04', spine02: 'spine03', spine01: 'spine02', neck01: 'spine01',
  neck02: 'neck01', neck03: 'neck02', head: 'neck03',
};
const SIDE_PARENT = {
  clavicle: 'spine01', shoulder01: 'clavicle', upperarm01: 'shoulder01', upperarm02: 'upperarm01', lowerarm01: 'upperarm02',
  lowerarm02: 'lowerarm01', wrist: 'lowerarm02', 'finger3-1': 'wrist', 'finger3-2': 'finger3-1',
  pelvis: 'root', upperleg01: 'pelvis', upperleg02: 'upperleg01', lowerleg01: 'upperleg02', lowerleg02: 'lowerleg01',
  foot: 'lowerleg02', 'toe2-1': 'foot',
};

export function sanitize(name) {
  return THREE.PropertyBinding.sanitizeNodeName(name);
}

// Returns { scene, root, bones, byName, skeleton, world(name), setWorldQuaternion(name, q) }.
export function buildRig({ sanitized = false } = {}) {
  const positions = { ...CENTRE };
  for (const [name, p] of Object.entries(LEFT)) {
    positions[`${name}.L`] = p;
    positions[`${name}.R`] = [-p[0], p[1], p[2]];
  }
  const parents = { ...PARENT };
  for (const [name, parent] of Object.entries(SIDE_PARENT)) {
    for (const s of ['L', 'R']) parents[`${name}.${s}`] = parent === 'root' || parent === 'spine01' ? parent : `${parent}.${s}`;
  }
  const byName = new Map();
  const bones = [];
  for (const name of Object.keys(positions)) {
    const bone = new THREE.Bone();
    bone.name = sanitized ? sanitize(name) : name;
    byName.set(name, bone);
    bones.push(bone);
  }
  for (const [name, bone] of byName) {
    const parent = parents[name];
    const p = new THREE.Vector3(...positions[name]);
    if (parent) {
      byName.get(parent).add(bone);
      p.sub(new THREE.Vector3(...positions[parent]));
    }
    bone.position.copy(p);
  }
  const scene = new THREE.Scene();
  const root = byName.get('root');
  scene.add(root);
  scene.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  const world = (name) => ({ position: byName.get(name).getWorldPosition(new THREE.Vector3()), quaternion: byName.get(name).getWorldQuaternion(new THREE.Quaternion()) });
  function setWorldQuaternion(name, q) {
    const bone = byName.get(name);
    const parentQ = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    bone.quaternion.copy(parentQ.invert().multiply(q)).normalize();
    scene.updateMatrixWorld(true);
  }
  // Turns a bone (and so everything below it) by a world rotation about its own head.
  function turnWorld(name, axis, degrees) {
    const bone = byName.get(name);
    const r = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...axis).normalize(), degrees * Math.PI / 180);
    setWorldQuaternion(name, r.multiply(bone.getWorldQuaternion(new THREE.Quaternion())));
  }
  return { scene, root, bones, byName, skeleton, world, setWorldQuaternion, turnWorld, positions };
}

// A skinned mesh on the rig from a list of vertices, each { p: [x, y, z], w: { boneName: weight } }, and
// triangles as index triples.
export function skinnedMesh(rig, vertices, triangles, materialName = 'Clinical skin') {
  const index = new Map(rig.bones.map((b, i) => [b, i]));
  const position = [], skinIndex = [], skinWeight = [];
  for (const v of vertices) {
    position.push(...v.p);
    const entries = Object.entries(v.w);
    for (let k = 0; k < 4; k++) {
      const [name, weight] = entries[k] ?? [null, 0];
      skinIndex.push(name ? index.get(rig.byName.get(name)) : 0);
      skinWeight.push(weight);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
  geometry.setIndex(triangles.flat());
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  material.name = materialName;
  const mesh = new THREE.SkinnedMesh(geometry, material);
  rig.scene.add(mesh);
  rig.scene.updateMatrixWorld(true);
  mesh.bind(rig.skeleton, mesh.matrixWorld);
  return mesh;
}

// A closed tube of skin around the segment from bone `from` to the joint `to` (radius r, rings × sides),
// weighted fully to `from` except where `blend` gives a weight table along the tube.
export function tube(rig, from, to, { r = 0.04, rings = 12, sides = 16, weights = () => ({ [from]: 1 }), rx = r, ry = r } = {}) {
  const a = new THREE.Vector3(...rig.positions[from]), b = new THREE.Vector3(...rig.positions[to]);
  const axis = b.clone().sub(a).normalize();
  const u = new THREE.Vector3(1, 0, 0).cross(axis);
  if (u.lengthSq() < 1e-6) u.set(0, 0, 1).cross(axis);
  u.normalize();
  const v = axis.clone().cross(u).normalize();
  const vertices = [], triangles = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const c = a.clone().lerp(b, t);
    for (let j = 0; j < sides; j++) {
      const angle = 2 * Math.PI * j / sides;
      const p = c.clone().addScaledVector(u, Math.cos(angle) * rx).addScaledVector(v, Math.sin(angle) * ry);
      vertices.push({ p: p.toArray(), w: weights(t, angle) });
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < sides; j++) {
      const p0 = i * sides + j, p1 = i * sides + (j + 1) % sides, p2 = p0 + sides, p3 = p1 + sides;
      triangles.push([p0, p2, p1], [p1, p2, p3]);
    }
  }
  return { vertices, triangles };
}
