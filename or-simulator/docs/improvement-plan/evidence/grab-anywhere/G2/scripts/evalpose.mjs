// Gate readout for one supine pose candidate (F27 applied, head excluded: the ring is fitted to the head).
import { pose, supportsAt, skinPositions, vSeg, SEGMENTS, cd, bone } from './model.mjs';
export const sup = supportsAt(0.9, 0.0525);
const PAD = 0.9, EDGE = 0.282;
const ALLOW = { pelvis: 5, shank: 5, foot: 5 };
// Lateral body envelope for the arm self check: per (y, z) cell of 6 mm, the largest |x| of the trunk and
// thigh skin on each side. An arm vertex medial of that envelope is inside the body's side.
const CELL = 0.006;
const BODY = new Set(['chest', 'abdomen', 'pelvis', 'thigh.L', 'thigh.R']);
export function evaluate(over) {
  pose(over);
  const P = skinPositions();
  const lowOver = {}, lowPlane = {};
  let deep = 0, deepAllowed = 0, maxDepth = 0, offEdgeLow = 0;
  const env = [new Map(), new Map()];
  for (let i = 0; i < P.length / 3; i++) {
    const seg = SEGMENTS[vSeg[i]]; if (!seg) continue;
    const id = seg.id, x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    if (BODY.has(id)) {
      const m = env[x > 0 ? 0 : 1], key = Math.round(y / CELL) * 100000 + Math.round(z / CELL);
      if (!(m.get(key) >= Math.abs(x))) m.set(key, Math.abs(x));
    }
    if (lowPlane[id] === undefined || y < lowPlane[id]) lowPlane[id] = y;
    const s = sup.supportAt(x, z);
    if (s.kind !== 'floor') {
      const g = (y - s.y) * 1000;
      if (lowOver[id] === undefined || g < lowOver[id]) lowOver[id] = g;
      if (g < -2) { deep++; if (g < -(ALLOW[seg.part] ?? 2)) deepAllowed++; }
      if (-g > maxDepth) maxDepth = -g;
    } else if (seg.limb === 'arm' && y < PAD + 0.01 && Math.abs(x) > EDGE - 0.001) offEdgeLow++;
  }
  const self = {};
  for (let i = 0; i < P.length / 3; i++) {
    const seg = SEGMENTS[vSeg[i]]; if (!seg || seg.limb !== 'arm') continue;
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    // The axilla joins the upper arm to the chest: the upper arm is checked against the trunk below z -0.36 only.
    if (seg.part === 'upperArm' && z < -0.36) continue;
    const m = env[x > 0 ? 0 : 1], key = Math.round(y / CELL) * 100000 + Math.round(z / CELL);
    const e = m.get(key);
    if (e === undefined) continue;
    const d = (e - Math.abs(x)) * 1000;
    if (d > (self[seg.id] ?? 0)) self[seg.id] = d;
  }
  // Upper arm flatness: the lowest gap over the middle third between the shoulder and elbow joints.
  const uaMid = {};
  for (const [S, sgn] of [['L', 1], ['R', -1]]) {
    const z0 = cd(bone('upperarm01.' + S)).z, z1 = cd(bone('lowerarm01.' + S)).z, lo = z0 + (z1 - z0) / 3, hi = z0 + 2 * (z1 - z0) / 3;
    const k = SEGMENTS.findIndex((x) => x.id === 'upperArm.' + S);
    let m = Infinity;
    for (let i = 0; i < P.length / 3; i++) {
      if (vSeg[i] !== k) continue; const z = P[i * 3 + 2]; if (z < lo || z > hi) continue;
      const s2 = sup.supportAt(P[i * 3], z); if (s2.kind === 'floor') continue;
      m = Math.min(m, (P[i * 3 + 1] - s2.y) * 1000);
    }
    uaMid[S] = m;
  }
  const r = (v) => (v === undefined ? null : +v.toFixed(2));
  const out = { over: Object.fromEntries(Object.entries(lowOver).map(([k, v]) => [k, r(v)])),
    plane: Object.fromEntries(Object.entries(lowPlane).map(([k, v]) => [k, r((v - PAD) * 1000)])),
    deep, deepAllowed, maxDepth: r(maxDepth), offEdgeLow, self: Object.fromEntries(Object.entries(self).map(([k, v]) => [k, r(v)])),
    uaMid: { L: r(uaMid.L), R: r(uaMid.R) }, wrist: ['wrist.L', 'wrist.R'].map((n) => +Math.abs(cd(bone(n)).x).toFixed(4)) };
  return out;
}
