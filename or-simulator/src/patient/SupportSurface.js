// What the patient rests on (12_GRAB_ANYWHERE_DESIGN.md §2.2, §4.6, §5.2): rounded boxes measured at load
// from the drawn table-top GLB, so the supports always match what is drawn (before and after F27), plus the
// floor at y = 0 off the table. The boxes are kept in the table top's own frame and follow setDeckHeight.
//
// Every mesh of the table top becomes one box: its vertices' bounding box in the top's frame. A mesh with
// eight vertices is a plain box (rounding 0, exact); any other mesh (rails, hinges, sockets: cylinders and
// tori) gets the rounding of its smaller cross-section half-extent, so a cylinder becomes a capsule-like box.
//
// Resting surfaces (pads, arm boards, head rest) have NO BOTTOM FACE: the patient lies on them and the stack
// below a pad is solid table, so the way out of a pad is through its top or a side, never down through it (G1
// verification V2: a plain box distance measured calves 51.8 mm below the 75 mm leg pads as 23.2 mm, to the
// pad's bottom face, and its direction pointed down). Inside a resting footprint, between the top and the
// bottom of the table-top stack under it (below that a point is under the table, not in the pad), the signed
// distance is minus the nearest of the depth below the top and the distances to the four sides, with that
// face's normal. A point pressed into a pad's side near its edge (a hand beside the table) therefore reads its
// side depth, a point sunk from above its depth below the top. depthBelowTop(p) gives the plain depth below
// the highest resting top over a point (the "sinking" reading). Rails, trim, fittings and the deck keep the
// ordinary signed box distance.
//
// A mesh may carry its own exact support in mesh.userData.support (G2: the gel head ring, a height field whose
// top is not a box): { kind, topAt(x, z) → y | null, sd(x, y, z) → { d, normal, inside }, bounds } in the mesh's
// local frame, which must only be translated against the table top. It then stands in for the bounding box:
// a resting surface whose column is the support itself (from its base, the pad it sits on, to its top).
//
// Plain arithmetic, no three.js import: meshes are read through matrixWorld.elements and position.array.

import { invertAffine } from './JointModel.js';

// Kinds by mesh name in assets/operating-table/top.glb (pads, arm boards, head rest, rails, piping, deck).
export function supportKind(name) {
  const n = String(name);
  // Small fittings first: their names also contain "deck", "headrest" or "armboard".
  if (/fastener|hinge|_joint|stem|_pin/.test(n)) return 'fitting';
  if (/armboard_(top|pad|plate)/.test(n)) return 'armboard';
  if (/^headrest_(top|cushion)/.test(n)) return 'headrest';
  if (/_pad$/.test(n)) return 'pad';
  if (/rail|socket/.test(n)) return 'rail';
  if (/trim|_edge$/.test(n)) return 'trim';
  if (/deck|_support$|carrier/.test(n)) return 'deck';
  if (/hand_control/.test(n)) return 'control';
  return 'fitting';
}
// Kinds a patient can lie on (their tops are the "pad tops" of the G1 gate).
export const RESTING_KINDS = Object.freeze(['pad', 'armboard', 'headrest']);

// Signed distance from (x, y, z) to a box (centre c, half-extents h, rounding r); positive outside.
export function roundedBoxSd(x, y, z, box) {
  const r = box.round;
  const qx = Math.abs(x - box.centre[0]) - (box.half[0] - r);
  const qy = Math.abs(y - box.centre[1]) - (box.half[1] - r);
  const qz = Math.abs(z - box.centre[2]) - (box.half[2] - r);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0));
  return outside + Math.min(Math.max(qx, qy, qz), 0) - r;
}

function multiply(a, b) {
  // Column-major 4×4 product a·b.
  const out = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return out;
}

export function createSupportSurface({ root, meshes = null, floorY = 0, now = () => Date.now() }) {
  // root: the table top (its matrixWorld up to date); meshes: optional list (default: root's mesh descendants).
  const started = now();
  // Only what is drawn supports the patient: a hidden mesh (G2: the table's carrier under the lowered deck) is left out.
  const list = meshes ?? (() => { const out = []; root.traverse((o) => { if (o.isMesh && o.visible) out.push(o); }); return out; })();
  // A copy: three.js updates matrixWorld.elements in place when the deck moves.
  const base = Array.from(root.matrixWorld.elements);
  const rootInverse = invertAffine(base);
  // The table top only translates (setDeckHeight moves its y); boxes keep the frame they were measured in and
  // setDeck(y), with y the top's new world height (its own origin, not the deck the patient is posed on: since
  // G2 the drawn top sits PAD_DROP lower), adds the change since then.
  const measuredAt = base[13];
  const rotated = Math.abs(base[0] - 1) + Math.abs(base[5] - 1) + Math.abs(base[10] - 1) + Math.abs(base[1]) + Math.abs(base[2]) + Math.abs(base[4]) > 1e-9;
  let offset = 0;
  const boxes = [];
  for (const mesh of list) {
    const m = multiply(rootInverse, mesh.matrixWorld.elements);
    const own = mesh.userData?.support;
    if (own && typeof own.topAt === 'function') {
      const turned = Math.abs(m[0] - 1) + Math.abs(m[5] - 1) + Math.abs(m[10] - 1) + Math.abs(m[1]) + Math.abs(m[2]) + Math.abs(m[4]) > 1e-9;
      if (turned) throw new Error(`SupportSurface: ${mesh.name} carries its own support but is rotated or scaled against the table top`);
      const t = [m[12], m[13], m[14]], b = own.bounds;
      boxes.push({ name: mesh.name, kind: own.kind ?? 'headrest', field: own, t, stackBottom: t[1],
        centre: [t[0] + (b.minX + b.maxX) / 2, t[1] + b.maxY / 2, t[2] + (b.minZ + b.maxZ) / 2],
        half: [(b.maxX - b.minX) / 2, b.maxY / 2, (b.maxZ - b.minZ) / 2], round: 0, vertices: mesh.geometry.attributes.position.count });
      continue;
    }
    const a = mesh.geometry.attributes.position, p = a.array, size = a.itemSize;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < a.count; i++) {
      const x = p[i * size], y = p[i * size + 1], z = p[i * size + 2];
      const v = [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
      for (let k = 0; k < 3; k++) { if (v[k] < lo[k]) lo[k] = v[k]; if (v[k] > hi[k]) hi[k] = v[k]; }
    }
    if (!(lo[0] <= hi[0])) continue;
    const half = [0, 1, 2].map((k) => (hi[k] - lo[k]) / 2);
    const sorted = [...half].sort((x, y) => x - y);
    boxes.push({ name: mesh.name, kind: supportKind(mesh.name), centre: [0, 1, 2].map((k) => (lo[k] + hi[k]) / 2), half,
      round: a.count === 8 ? 0 : Math.min(sorted[0], sorted[1]), vertices: a.count });
  }
  const resting = boxes.filter((b) => RESTING_KINDS.includes(b.kind));
  // Bottom of the stack under each resting box: the lowest bottom of any box whose footprint overlaps it.
  for (const box of resting) {
    if (box.field) continue;
    let bottom = box.centre[1] - box.half[1];
    for (const other of boxes) {
      const overlapX = Math.abs(other.centre[0] - box.centre[0]) < other.half[0] + box.half[0];
      const overlapZ = Math.abs(other.centre[2] - box.centre[2]) < other.half[2] + box.half[2];
      if (overlapX && overlapZ) bottom = Math.min(bottom, other.centre[1] - other.half[1]);
    }
    box.stackBottom = bottom;
    const top = box.centre[1] + box.half[1];
    box.column = { centre: [box.centre[0], (top + bottom) / 2, box.centre[2]], half: [box.half[0], (top - bottom) / 2, box.half[2]], round: box.round };
  }

  const toTable = (p) => {
    const x = p[0], y = p[1] - offset, z = p[2];
    return [rootInverse[0] * x + rootInverse[4] * y + rootInverse[8] * z + rootInverse[12],
      rootInverse[1] * x + rootInverse[5] * y + rootInverse[9] * z + rootInverse[13],
      rootInverse[2] * x + rootInverse[6] * y + rootInverse[10] * z + rootInverse[14]];
  };
  const tableTopY = (box) => base[13] + offset + box.centre[1] + box.half[1];
  // Top of a box at (x, z) of its footprint (table frame): flat within the rounding band, then dropping along
  // the rounding; null outside the footprint.
  function localTop(box, x, z) {
    if (box.field) {
      const y = box.field.topAt(x - box.t[0], z - box.t[2]);
      return y === null ? null : y + box.t[1];
    }
    const dx = Math.abs(x - box.centre[0]) - box.half[0], dz = Math.abs(z - box.centre[2]) - box.half[2];
    if (dx > 0 || dz > 0) return null;
    const ex = Math.max(0, dx + box.round), ez = Math.max(0, dz + box.round);
    const e = Math.hypot(ex, ez);
    const drop = box.round > 0 && e > 0 ? box.round - Math.sqrt(Math.max(0, box.round * box.round - Math.min(e, box.round) ** 2)) : 0;
    return box.centre[1] + box.half[1] - drop;
  }
  // Signed distance in the table frame to one support box, with the way out when it is inside: no bottom face
  // for resting boxes (see the header).
  function boxSd(box, x, y, z) {
    if (box.field) {
      const r = box.field.sd(x - box.t[0], y - box.t[1], z - box.t[2]);
      return { d: r.d, normal: r.inside ? [0, 1, 0] : null };
    }
    if (!box.column) return { d: roundedBoxSd(x, y, z, box), normal: null };
    const top = localTop(box, x, z);
    if (top !== null && y <= top && y >= box.stackBottom) {
      const ox = x - box.centre[0], oz = z - box.centre[2];
      const sx = box.half[0] - Math.abs(ox), sz = box.half[2] - Math.abs(oz), up = top - y;
      if (up <= sx && up <= sz) return { d: -up, normal: [0, 1, 0] };
      return sx <= sz ? { d: -sx, normal: [Math.sign(ox) || 1, 0, 0] } : { d: -sz, normal: [0, 0, Math.sign(oz) || 1] };
    }
    return { d: roundedBoxSd(x, y, z, box.column), normal: null };
  }

  function nearest(p) {
    const [x, y, z] = toTable(p);
    let best = p[1] - floorY, which = null, inside = null;
    for (const box of boxes) {
      const r = boxSd(box, x, y, z);
      if (r.d < best) { best = r.d; which = box; inside = r.normal; }
    }
    // The way out: the nearest face inside a resting column (top or side), up off the floor; otherwise the
    // box distance's gradient (central differences; table frame = world axes because the top only translates).
    let normal = inside ?? [0, 1, 0];
    if (which && !inside) {
      const h = 1e-5, g = (dx, dy, dz) => boxSd(which, x + dx, y + dy, z + dz).d;
      const n = [g(h, 0, 0) - g(-h, 0, 0), g(0, h, 0) - g(0, -h, 0), g(0, 0, h) - g(0, 0, -h)];
      const len = Math.hypot(n[0], n[1], n[2]);
      normal = len > 0 ? [n[0] / len, n[1] / len, n[2] / len] : [0, 1, 0];
    }
    return { distance: best, box: which, kind: which ? which.kind : 'floor', normal, column: !!inside };
  }
  // Signed distance (m) from a world point to the nearest support or the floor; negative = inside (for a
  // resting surface: the depth below its top).
  const sd = (p) => nearest(p).distance;
  // Depth (m, positive below) of a world point under the highest resting top over it, down to the bottom of
  // that surface's stack; 0 above it or outside every resting footprint. The "sinking" reading of §5.2.
  function depthBelowTop(p) {
    const [x, y, z] = toTable(p);
    let depth = 0, which = null;
    for (const box of resting) {
      const top = localTop(box, x, z);
      if (top === null || y < box.stackBottom) continue;
      if (top - y > depth) { depth = top - y; which = box; }
    }
    return { depth, box: which, kind: which ? which.kind : null };
  }
  // Highest resting surface under (x, z) in world (the floor when none): { y, kind, name }.
  function supportAt(x, z) {
    const [tx, , tz] = toTable([x, 0, z]);
    let top = { y: floorY, kind: 'floor', name: null };
    for (const box of resting) {
      const t = localTop(box, tx, tz);
      if (t === null) continue;
      const y = base[13] + offset + t;
      if (y > top.y) top = { y, kind: box.kind, name: box.name };
    }
    return top;
  }
  const buildMs = now() - started;
  return {
    boxes, resting, sd, nearest, supportAt, depthBelowTop, kind: (p) => nearest(p).kind,
    setDeck(y) { offset = y - measuredAt; },
    get offset() { return offset; },
    summary: () => ({
      buildMs, boxes: boxes.length, deckMeasuredAt: measuredAt, offset, rootRotatedOrScaled: rotated,
      kinds: boxes.reduce((n, b) => ({ ...n, [b.kind]: (n[b.kind] ?? 0) + 1 }), {}),
      resting: resting.map((b) => ({ name: b.name, kind: b.kind, topY: tableTopY(b), stackBottomY: base[13] + offset + b.stackBottom,
        x: [b.centre[0] - b.half[0], b.centre[0] + b.half[0]], z: [b.centre[2] - b.half[2], b.centre[2] + b.half[2]] })),
    }),
  };
}
