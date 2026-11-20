// Procedural geometry that raises the quality of what is drawn (13_VISUAL_QUALITY_PLAN.md §2, "GeometryFixes").
// G2 (12_GRAB_ANYWHERE_DESIGN.md §8 G2) adds the gel head ring the anaesthetised supine patient's head rests on;
// Q2 adds toCreasedNormals here later.
//
// The head ring. The drawn table top has no raised support under the head: once the pads sit where the code
// puts the patient (F27), the occiput would hang 3–5 cm above the back pad. A gel ring fills that gap the way an
// OR does. Its shape is a rounded tube around an elliptic hole (footprint 0.22 × 0.20 m by default) whose free,
// uncompressed height is `height`; where the patient's head lies on it, the gel is pressed down to just under
// the skin (top = min(free shape, lowest skin above it − clearance)). So the head rests on the gel along the
// band where they meet, instead of floating over the hole or sinking into a rigid ring, and the ring follows
// whatever head shape the rest pose gives. Every dimension is DN5 illustrative (needs certified-clinician
// review): gel ring sizes and how far a head sinks into one vary between products and patients.
//
// The ring is a height field over its annulus: one top surface (a polar grid, cosine-spaced across the tube so
// that the rounded edges get more rings) plus a flat bottom annulus on the pad. The same triangles answer the
// support queries (topAt: the exact height of the drawn triangle under a point), so what the patient rests on is
// what is drawn, to float precision. Plain arithmetic, no three.js import: the app builds the BufferGeometry.

const TAU = Math.PI * 2;

// Lowest height of a triangle soup under vertical lines, exact (the drawn triangles, barycentric), for the
// points of a rectangle of the ground plane. positions: world xyz per vertex; index: triangle corners (or null
// for a non-indexed soup); bounds: [minX, maxX, minZ, maxZ]; cell: bucket size (m). at(x, z) → y or null.
export function createLowestSurface({ positions, index = null, bounds, cell = 0.01 }) {
  const [minX, maxX, minZ, maxZ] = bounds;
  const nx = Math.max(1, Math.ceil((maxX - minX) / cell)), nz = Math.max(1, Math.ceil((maxZ - minZ) / cell));
  const buckets = Array.from({ length: nx * nz }, () => []);
  const triangles = index ? index.length / 3 : positions.length / 9;
  const corner = index ? (t, c) => index[t * 3 + c] : (t, c) => t * 3 + c;
  let used = 0;
  for (let t = 0; t < triangles; t++) {
    const a = corner(t, 0) * 3, b = corner(t, 1) * 3, c = corner(t, 2) * 3;
    const x0 = Math.min(positions[a], positions[b], positions[c]), x1 = Math.max(positions[a], positions[b], positions[c]);
    const z0 = Math.min(positions[a + 2], positions[b + 2], positions[c + 2]), z1 = Math.max(positions[a + 2], positions[b + 2], positions[c + 2]);
    if (x1 < minX || x0 > maxX || z1 < minZ || z0 > maxZ) continue;
    used++;
    const i0 = Math.max(0, Math.floor((x0 - minX) / cell)), i1 = Math.min(nx - 1, Math.floor((x1 - minX) / cell));
    const k0 = Math.max(0, Math.floor((z0 - minZ) / cell)), k1 = Math.min(nz - 1, Math.floor((z1 - minZ) / cell));
    for (let i = i0; i <= i1; i++) for (let k = k0; k <= k1; k++) buckets[k * nx + i].push(a, b, c);
  }
  function at(x, z) {
    if (x < minX || x > maxX || z < minZ || z > maxZ) return null;
    const i = Math.min(nx - 1, Math.floor((x - minX) / cell)), k = Math.min(nz - 1, Math.floor((z - minZ) / cell));
    const list = buckets[k * nx + i];
    let low = null;
    for (let n = 0; n < list.length; n += 3) {
      const y = triangleHeight(positions, list[n], list[n + 1], list[n + 2], x, z);
      if (y !== null && (low === null || y < low)) low = y;
    }
    return low;
  }
  return { at, triangles: used };
}

// Height at (x, z) of the triangle (a, b, c) (offsets into a flat xyz array) seen from above, or null when the
// point is outside its ground projection (or the triangle is vertical). Edges count as inside.
function triangleHeight(p, a, b, c, x, z) {
  const ax = p[a], az = p[a + 2], bx = p[b], bz = p[b + 2], cx = p[c], cz = p[c + 2];
  const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
  if (Math.abs(d) < 1e-14) return null;
  const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d;
  const l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d;
  const l3 = 1 - l1 - l2;
  const e = -1e-9;
  if (l1 < e || l2 < e || l3 < e) return null;
  return l1 * p[a + 1] + l2 * p[b + 1] + l3 * p[c + 1];
}

export const HEAD_RING_DEFAULTS = Object.freeze({
  // DN5 illustrative: outer semi-axes across (x) and along (z) the table, hole as a fraction of them, free
  // (uncompressed) height of the gel, gap left under the skin where the head presses it.
  semiAxes: [0.11, 0.10], hole: 0.25, height: 0.05, clearance: 0.0005, segments: 40, rings: 12,
});

// centre: [x, z] of the ring's axis; below(x, z): the lowest skin height above the ring's base at that point
// (metres, base = 0), or null where no skin is above. Positions are local to the ring's origin: (centre x,
// base, centre z). Returns the geometry arrays, the support (local frame) and a summary.
export function buildHeadRing({ centre = [0, 0], below = () => null, ...options } = {}) {
  const { semiAxes: [ax, az], hole, height, clearance, segments, rings } = { ...HEAD_RING_DEFAULTS, ...options };
  if (!(hole > 0 && hole < 1)) throw new Error('GeometryFixes: the hole must be a fraction between 0 and 1');
  const uMid = (hole + 1) / 2, half = (1 - hole) / 2;
  // Ring k of the tube's cross-section (k = 0 inner edge, k = rings outer edge): cosine spacing, so the free
  // profile is a half ellipse sampled evenly in angle (round edges, flat crest).
  const uOf = (k) => uMid - half * Math.cos(Math.PI * k / rings);
  const freeOf = (k) => height * Math.sin(Math.PI * k / rings);
  const loop = segments, topCount = (rings + 1) * loop;
  const positions = new Float32Array((topCount + 2 * loop) * 3);
  let clamped = 0, touching = 0, maxY = 0;
  for (let k = 0; k <= rings; k++) {
    const u = uOf(k), free = k === 0 || k === rings ? 0 : freeOf(k);
    for (let j = 0; j < loop; j++) {
      const th = TAU * j / loop, x = ax * u * Math.cos(th), z = az * u * Math.sin(th);
      const skin = below(centre[0] + x, centre[1] + z);
      let y = free;
      if (skin !== null && skin - clearance < y) { y = Math.max(0, skin - clearance); clamped++; }
      if (skin !== null && skin - clearance - y < 0.002) touching++;
      const o = (k * loop + j) * 3;
      positions[o] = x; positions[o + 1] = y; positions[o + 2] = z;
      if (y > maxY) maxY = y;
    }
  }
  // Bottom annulus on the pad (its own vertices, so the shading of the top does not bend round the edge).
  for (const [n, k] of [[0, 0], [1, rings]]) {
    for (let j = 0; j < loop; j++) {
      const s = (k * loop + j) * 3, o = (topCount + n * loop + j) * 3;
      positions[o] = positions[s]; positions[o + 1] = 0; positions[o + 2] = positions[s + 2];
    }
  }
  const index = new Uint16Array((rings * loop * 2 + loop * 2) * 3);
  let w = 0;
  // Top: counter-clockwise seen from above (+y), so the faces point up (front faces for a downward ray).
  const vid = (k, j) => k * loop + ((j + loop) % loop);
  for (let k = 0; k < rings; k++) {
    for (let j = 0; j < loop; j++) {
      const a = vid(k, j), b = vid(k + 1, j), c = vid(k + 1, j + 1), d = vid(k, j + 1);
      index[w++] = a; index[w++] = c; index[w++] = b;
      index[w++] = a; index[w++] = d; index[w++] = c;
    }
  }
  // Bottom: faces point down.
  const bid = (n, j) => topCount + n * loop + ((j + loop) % loop);
  for (let j = 0; j < loop; j++) {
    const a = bid(0, j), b = bid(1, j), c = bid(1, j + 1), d = bid(0, j + 1);
    index[w++] = a; index[w++] = b; index[w++] = c;
    index[w++] = a; index[w++] = c; index[w++] = d;
  }
  const support = createRingSupport({ positions, index, rings, segments: loop, ax, az, uOf, topTriangles: rings * loop * 2 });
  return {
    positions, index, support,
    summary: {
      triangles: index.length / 3, vertices: positions.length / 3, centre, semiAxes: [ax, az], hole, freeHeight: height, clearance,
      maxHeight: maxY, clampedVertices: clamped, touchingVertices: touching, topVertices: topCount,
    },
  };
}

// Support queries on the ring's own triangles, in its local frame (base y = 0). topAt(x, z): height of the
// drawn top over the point, null in the hole and outside. sd(x, y, z): signed distance, negative inside the
// gel; inside, the way out is up (the patient lies on it); above the top it is the vertical gap; elsewhere the
// distance to the nearest top vertex (a few millimetres coarse next to the ring, exact far from it).
function createRingSupport({ positions, index, rings, segments, ax, az, uOf, topTriangles }) {
  const u0 = uOf(0), u1 = uOf(rings);
  const cellOf = (x, z) => {
    const u = Math.hypot(x / ax, z / az);
    // Inverse of the cosine spacing.
    const c = Math.min(1, Math.max(-1, -(u - (u0 + u1) / 2) / ((u1 - u0) / 2)));
    const k = Math.min(rings - 1, Math.max(0, Math.floor(Math.acos(c) / Math.PI * rings)));
    let th = Math.atan2(z / az, x / ax);
    if (th < 0) th += TAU;
    const j = Math.floor(th / TAU * segments) % segments;
    return [k, j];
  };
  function topAt(x, z) {
    const u = Math.hypot(x / ax, z / az);
    if (u < u0 * 0.97 || u > u1 * 1.001) return null;
    const [k, j] = cellOf(x, z);
    // The containing triangle is in this cell or a neighbour (straight edges against the cell's arcs).
    for (const dk of [0, -1, 1]) {
      const kk = k + dk;
      if (kk < 0 || kk >= rings) continue;
      for (const dj of [0, -1, 1]) {
        const jj = (j + dj + segments) % segments, t = (kk * segments + jj) * 2;
        for (const tt of [t, t + 1]) {
          const y = triangleHeight(positions, index[tt * 3] * 3, index[tt * 3 + 1] * 3, index[tt * 3 + 2] * 3, x, z);
          if (y !== null) return y;
        }
      }
    }
    return null;
  }
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxY = 0;
  const topVertices = (rings + 1) * segments;
  for (let i = 0; i < topVertices; i++) {
    minX = Math.min(minX, positions[i * 3]); maxX = Math.max(maxX, positions[i * 3]);
    minZ = Math.min(minZ, positions[i * 3 + 2]); maxZ = Math.max(maxZ, positions[i * 3 + 2]);
    maxY = Math.max(maxY, positions[i * 3 + 1]);
  }
  function nearestVertex(x, y, z) {
    let best = Infinity;
    for (let i = 0; i < topVertices; i++) {
      const d = (positions[i * 3] - x) ** 2 + (positions[i * 3 + 1] - y) ** 2 + (positions[i * 3 + 2] - z) ** 2;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }
  function sd(x, y, z) {
    const top = topAt(x, z);
    if (top !== null && y >= 0 && y <= top) return { d: -(top - y), normal: [0, 1, 0], inside: true };
    const bx = Math.max(minX - x, 0, x - maxX), by = Math.max(-y, 0, y - maxY), bz = Math.max(minZ - z, 0, z - maxZ);
    const far = Math.hypot(bx, by, bz);
    if (far > 0.03) return { d: far, normal: null, inside: false };
    const near = nearestVertex(x, y, z);
    return { d: top !== null && y > top ? Math.min(y - top, near) : near, normal: null, inside: false };
  }
  return { kind: 'headrest', topAt, sd, bounds: { minX, maxX, minZ, maxZ, maxY }, topTriangles };
}
