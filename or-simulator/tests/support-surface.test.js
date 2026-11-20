import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createSupportSurface, supportKind, roundedBoxSd } from '../src/patient/SupportSurface.js';

// An eight-vertex box like the table-top GLB's pads (three.js BoxGeometry has 24 vertices).
function box8(name, min, max, material = 'Medical PU upholstery - deep teal') {
  const p = [];
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) p.push(x, y, z);
  const index = [0, 1, 3, 0, 3, 2, 4, 6, 7, 4, 7, 5, 0, 4, 5, 0, 5, 1, 2, 3, 7, 2, 7, 6, 0, 2, 6, 0, 6, 4, 1, 5, 7, 1, 7, 3];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  geometry.setIndex(index);
  const material3 = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  material3.name = material;
  const mesh = new THREE.Mesh(geometry, material3);
  mesh.name = name;
  return mesh;
}
// A table top in the GLB's layout (local frame of the top asset; pads 75 mm thick, top 0.0525 above it).
function table(deck = 0.9) {
  const top = new THREE.Group();
  top.add(box8('back_pad', [-0.2825, -0.0225, -0.701], [0.2825, 0.0525, -0.019]));
  top.add(box8('head_pad', [-0.2525, -0.0225, -0.981], [0.2525, 0.0525, -0.739]));
  top.add(box8('L_armboard_top', [-0.591, 0.033, -0.6925], [-0.366, 0.051, -0.2475]));
  top.add(box8('L_armboard_pad', [-0.601, -0.0225, -0.705], [-0.356, 0.0325, -0.235], 'PU edge piping'));
  top.add(box8('radiolucent_deck', [-0.31, -0.1025, -1.01], [0.31, -0.0475, 1.01], 'Anodized dark alloy'));
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.23, 20), new THREE.MeshBasicMaterial());
  rail.name = 'L_side_rail_front';
  rail.rotation.x = Math.PI / 2;
  rail.position.set(-0.33, -0.035, -0.065);
  top.add(rail);
  top.position.y = deck;
  const scene = new THREE.Scene();
  scene.add(top);
  scene.updateMatrixWorld(true);
  return { scene, top };
}

test('mesh names map to support kinds', () => {
  assert.equal(supportKind('head_pad'), 'pad');
  assert.equal(supportKind('leg_L_pad'), 'pad');
  assert.equal(supportKind('R_armboard_top'), 'armboard');
  assert.equal(supportKind('L_armboard_pad'), 'armboard');
  assert.equal(supportKind('headrest_top'), 'headrest');
  assert.equal(supportKind('L_side_rail_front'), 'rail');
  assert.equal(supportKind('rail_socket_031_025'), 'rail');
  assert.equal(supportKind('back_side_trim_02775'), 'trim');
  assert.equal(supportKind('radiolucent_deck'), 'deck');
  assert.equal(supportKind('deck_fastener_024_018'), 'fitting');
});

test('pad tops agree with a raycast of the drawn table within 1 mm, before and after a deck move', () => {
  const { scene, top } = table(0.9);
  const supports = createSupportSurface({ root: top });
  const ray = new THREE.Raycaster();
  const check = () => {
    let worst = 0, n = 0;
    for (const b of supports.resting) {
      for (let i = 0; i <= 6; i++) for (let k = 0; k <= 6; k++) {
        const x = b.centre[0] - b.half[0] + 0.005 + (2 * b.half[0] - 0.01) * i / 6;
        const z = b.centre[2] - b.half[2] + 0.005 + (2 * b.half[2] - 0.01) * k / 6;
        ray.set(new THREE.Vector3(x, 3, z), new THREE.Vector3(0, -1, 0));
        const hit = ray.intersectObject(top, true)[0];
        if (!hit) continue;
        worst = Math.max(worst, Math.abs(supports.supportAt(x, z).y - hit.point.y));
        n++;
      }
    }
    return { worst, n };
  };
  const at90 = check();
  assert.ok(at90.n > 100 && at90.worst < 0.001, JSON.stringify(at90));
  assert.ok(Math.abs(supports.supportAt(0, -0.3).y - 0.9525) < 1e-6);
  assert.equal(supports.supportAt(0, -0.3).kind, 'pad');
  assert.ok(Math.abs(supports.supportAt(-0.45, -0.45).y - 0.951) < 1e-6);
  // F27-style deck change: the drawn top and the supports move together.
  top.position.y = 0.8475;
  scene.updateMatrixWorld(true);
  supports.setDeck(0.8475);
  const lowered = check();
  assert.ok(lowered.worst < 0.001, JSON.stringify(lowered));
  assert.ok(Math.abs(supports.supportAt(0, -0.3).y - 0.9) < 1e-6);
});

test('signed distance: inside a pad is negative, the floor holds off the table, cylinders are rounded', () => {
  const { top } = table(0.9);
  const supports = createSupportSurface({ root: top });
  assert.ok(Math.abs(supports.sd([0, 0.9525 + 0.02, -0.3]) - 0.02) < 1e-6);
  assert.ok(Math.abs(supports.sd([0, 0.9525 - 0.01, -0.3]) + 0.01) < 1e-6);
  assert.equal(supports.kind([0, 0.94, -0.3]), 'pad');
  assert.ok(Math.abs(supports.sd([3, 0.25, 0]) - 0.25) < 1e-9);
  assert.equal(supports.kind([3, 0.25, 0]), 'floor');
  const rail = supports.boxes.find((b) => b.kind === 'rail');
  assert.ok(Math.abs(rail.round - 0.014) < 1e-6, `rail rounding ${rail.round}`);
  // A point just beside the rail's round side: about its distance to the cylinder, not to the box corner.
  const corner = [-0.33 - 0.014 * Math.SQRT1_2 - 0.003, 0.9 - 0.035 + 0.014 * Math.SQRT1_2 + 0.003, 0];
  assert.ok(Math.abs(supports.nearest(corner).distance - 0.003 * Math.SQRT2) < 5e-4);
  assert.ok(Math.abs(roundedBoxSd(0, 2, 0, { centre: [0, 0, 0], half: [1, 1, 1], round: 0 }) - 1) < 1e-12);
});

test('resting surfaces have no bottom face: depth below the top however thick the pad, pointing up (G1 fix V2)', () => {
  const { top } = table(0.9);
  // A fitting box above the back pad's footprint: supportAt reads resting surfaces only.
  top.add(box8('deck_fastener_test', [0.1, 0.06, -0.31], [0.11, 0.2, -0.29], 'Anodized dark alloy'));
  top.updateMatrixWorld(true);
  const supports = createSupportSurface({ root: top });
  // Float32 vertex positions: 1e-6 m tolerance. Pads are 75 mm thick (0.8775–0.9525 at deck 0.9). 51.8 mm below the top: the depth is 51.8 mm, not the
  // 23.2 mm to the pad's bottom face that a plain box distance reads, and the way out is up.
  const deep = supports.nearest([0, 0.9525 - 0.0518, -0.3]);
  assert.ok(Math.abs(deep.distance + 0.0518) < 1e-6, `${deep.distance}`);
  assert.deepEqual(deep.normal, [0, 1, 0]);
  assert.equal(deep.column, true);
  assert.ok(Math.abs(supports.depthBelowTop([0, 0.9525 - 0.0518, -0.3]).depth - 0.0518) < 1e-6);
  assert.equal(deep.kind, 'pad');
  // Deeper than the pad itself (below its bottom face, still above the deck stack's bottom): still measured
  // from the top. The deck below reaches −0.1025 m in the top's frame (0.7975 m).
  assert.ok(Math.abs(supports.sd([0, 0.9525 - 0.12, -0.3]) + 0.12) < 1e-6);
  const back = supports.resting.find((b) => b.name === 'back_pad');
  assert.ok(Math.abs(back.stackBottom + 0.1025) < 1e-6, `stack bottom ${back.stackBottom}`);
  // Under the table (below the stack): not a pad penetration; the distance is to the stack's bottom.
  const under = supports.nearest([0, 0.75, -0.3]);
  assert.ok(Math.abs(under.distance - (0.7975 - 0.75)) < 1e-6, `${under.distance}`);
  assert.ok(under.normal[1] < -0.99, 'pushed down, away from the table');
  // Pressed into a pad's side near its edge, far below its top (a hand beside the table): the way out is the
  // side, 2 mm, not up through 30 mm of pad; the plain depth below the top still reads 30 mm.
  const side = supports.nearest([0.2825 - 0.002, 0.9525 - 0.03, -0.3]);
  assert.ok(Math.abs(side.distance + 0.002) < 1e-6, `${side.distance}`);
  assert.deepEqual(side.normal, [1, 0, 0]);
  assert.ok(Math.abs(supports.depthBelowTop([0.2825 - 0.002, 0.9525 - 0.03, -0.3]).depth - 0.03) < 1e-6);
  // Above a top or off every resting footprint: no depth below a top.
  assert.equal(supports.depthBelowTop([0, 0.96, -0.3]).depth, 0);
  assert.equal(supports.depthBelowTop([0.9, 0.5, -0.3]).depth, 0);
  // Beside a pad and below its top: the side distance, positive.
  const beside = supports.nearest([0.2825 + 0.01, 0.93, -0.3]);
  assert.ok(beside.distance > 0.0099 && beside.distance < 0.0101, `${beside.distance}`);
  assert.ok(beside.normal[0] > 0.99);
  // Above the top: the gap.
  assert.ok(Math.abs(supports.sd([0, 0.9525 + 0.004, -0.3]) - 0.004) < 1e-6);
  // Arm board stack: the deepest reading comes from the top board (0.951), not the pad under it (0.9325).
  assert.ok(Math.abs(supports.sd([-0.45, 0.92, -0.45]) + (0.951 - 0.92)) < 1e-6);
  // Rails keep their full signed distance (side contact): inside the rail, the nearest face.
  const rail = supports.nearest([-0.33, 0.9 - 0.035 + 0.01, -0.1]);
  assert.equal(rail.kind, 'rail');
  assert.ok(rail.distance < 0 && rail.distance > -0.014, `${rail.distance}`);
  // supportAt ignores the fitting above the back pad.
  assert.ok(Math.abs(supports.supportAt(0.105, -0.3).y - 0.9525) < 1e-6);
  assert.equal(supports.supportAt(0.105, -0.3).name, 'back_pad');
  // The summary carries each resting surface's stack bottom.
  assert.ok(supports.summary().resting.every((b) => Number.isFinite(b.stackBottomY)));
});

// G2: a mesh that carries its own exact support (the gel head ring) stands in for its bounding box.
test('a mesh with its own support (the head ring): its drawn top, its column, a raycast and the deck move agree', async () => {
  const { buildHeadRing } = await import('../src/render/GeometryFixes.js');
  const { scene, top } = table(0.9 - 0.0525);
  scene.updateMatrixWorld(true);
  const ring = buildHeadRing({ centre: [0, -0.722] });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(ring.positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(ring.index, 1));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  mesh.name = 'head_ring_gel';
  mesh.userData.support = ring.support;
  // On the pads (their tops at 0.900 m world after F27), centred at z −0.722.
  mesh.position.copy(top.worldToLocal(new THREE.Vector3(0, 0.9, -0.722)));
  top.add(mesh);
  scene.updateMatrixWorld(true);
  const supports = createSupportSurface({ root: top });
  const entry = supports.resting.find((b) => b.name === 'head_ring_gel');
  assert.equal(entry.kind, 'headrest');
  const crestX = 0.11 * (1 + 0.25) / 2;
  assert.ok(Math.abs(supports.supportAt(crestX, -0.722).y - (0.9 + 0.05)) < 1e-6, 'the crest over the back pad');
  assert.equal(supports.supportAt(crestX, -0.722).name, 'head_ring_gel');
  // The hole: the pad below (back_pad ends at −0.701, head_pad starts at −0.739: the hole centre is over the gap).
  assert.equal(supports.supportAt(0, -0.722).kind, 'floor');
  assert.equal(supports.supportAt(0, -0.6).name, 'back_pad', 'beyond the ring, the back pad');
  // Inside the gel: minus the depth below its top, the way out up; that depth is the "sinking" reading too.
  const inside = supports.nearest([crestX, 0.9 + 0.05 - 0.004, -0.722]);
  assert.ok(Math.abs(inside.distance + 0.004) < 1e-6, `${inside.distance}`);
  assert.deepEqual(inside.normal, [0, 1, 0]);
  assert.equal(inside.kind, 'headrest');
  assert.ok(Math.abs(supports.depthBelowTop([crestX, 0.9 + 0.05 - 0.004, -0.722]).depth - 0.004) < 1e-6);
  assert.ok(Math.abs(supports.sd([crestX, 0.9 + 0.05 + 0.003, -0.722]) - 0.003) < 1e-6);
  // Every point of its footprint against a raycast of the whole table top.
  const ray = new THREE.Raycaster();
  let worst = 0, n = 0;
  for (let i = 0; i <= 24; i++) for (let k = 0; k <= 24; k++) {
    const x = -0.11 + 0.22 * i / 24, z = -0.722 - 0.1 + 0.2 * k / 24;
    ray.set(new THREE.Vector3(x, 3, z), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObject(top, true)[0];
    if (!hit || !['head_ring_gel', 'back_pad', 'head_pad'].includes(hit.object.name)) continue;
    worst = Math.max(worst, Math.abs(supports.supportAt(x, z).y - hit.point.y));
    n++;
  }
  assert.ok(n > 300 && worst < 1e-6, JSON.stringify({ n, worst }));
  // The ring follows the deck with the drawn top.
  top.position.y -= 0.1;
  scene.updateMatrixWorld(true);
  supports.setDeck(top.position.y);
  assert.ok(Math.abs(supports.supportAt(crestX, -0.722).y - (0.8 + 0.05)) < 1e-6);
  // A rotated mesh with its own support is refused (its queries are in its own axes).
  mesh.rotation.y = 0.3;
  scene.updateMatrixWorld(true);
  assert.throws(() => createSupportSurface({ root: top }), /rotated or scaled/);
});

test('only drawn meshes support the patient: a hidden mesh is left out (G2: the carrier under the lowered deck)', () => {
  const { top } = table(0.9);
  const hidden = box8('central_carrier', [-0.22, -0.2, -0.34], [0.22, -0.1, 0.38], 'Brushed stainless steel');
  top.add(hidden);
  top.updateMatrixWorld(true);
  const shown = createSupportSurface({ root: top });
  hidden.visible = false;
  const drawn = createSupportSurface({ root: top });
  assert.equal(drawn.boxes.length, shown.boxes.length - 1);
  assert.ok(!drawn.boxes.some((b) => b.name === 'central_carrier'));
  // The back pad's stack now ends at the deck's bottom (0.7975 m), not the hidden carrier's (0.70 m).
  const back = (s) => s.resting.find((b) => b.name === 'back_pad').stackBottom;
  assert.ok(Math.abs(back(shown) + 0.2) < 1e-6 && Math.abs(back(drawn) + 0.1025) < 1e-6, `${back(shown)} ${back(drawn)}`);
});
