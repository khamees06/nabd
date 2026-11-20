// Trunk and legs: root height, spine02 extension (<= 3 deg), thigh and shin pitch, so that the chest is
// within +2..+6 mm of the back pad, the pelvis -2..+2, the calf -3..+1, the heel -2..+3 against the leg-pad
// plane (it overhangs the pad's end), thighs and abdomen not below the pads; abdomen skin deformation reported.
import { evaluate } from './evalpose.mjs';
import { pose, skinPositions, vSeg, SEGMENTS } from './model.mjs';
const MAX_S2 = 3 * Math.PI / 180;
pose();
const base = Float64Array.from(skinPositions());
const ABD = SEGMENTS.findIndex((s) => s.id === 'abdomen');
const abdIdx = []; for (let i = 0; i < base.length / 3; i++) if (vSeg[i] === ABD && base[i * 3 + 1] > 1.0) abdIdx.push(i);
let p = { dy: 0, s2: 0, tz: -0.008, sz: -0.037, ...JSON.parse(process.argv[2] ?? '{}') };
const toOver = (q) => ({ position: [0, 0.936 + q.dy / 1000, 0.025], spine: { spine02: q.s2 }, thigh: [0.07, -1, q.tz], shin: [0.05, -1, q.sz] });
function abdomenShift() {
  const P = skinPositions(); let rigid = 0, worst = 0;
  for (const i of abdIdx) { const d = Math.hypot(P[i*3]-base[i*3], P[i*3+1]-base[i*3+1], P[i*3+2]-base[i*3+2]); if (d > worst) worst = d; }
  return worst * 1000;
}
function cost(q) {
  const r = evaluate(toOver(q));
  const band = (v, lo, hi, w = 1) => (v === null || v === undefined ? 1e4 : v < lo ? w * (lo - v) ** 2 : v > hi ? w * (v - hi) ** 2 : 0);
  let c = band(r.over.chest, 2, 6, 4) + band(r.over.pelvis, -2, 2, 4);
  for (const s of ['L', 'R']) c += band(r.over[`shank.${s}`], -3, 1, 4) + band(r.plane[`foot.${s}`], -2, 3, 4) + band(r.over[`thigh.${s}`], -1.5, 1e9, 4);
  c += band(r.over.abdomen, 0, 1e9, 4);
  c += Math.abs(q.s2) > MAX_S2 ? 1e5 * (Math.abs(q.s2) - MAX_S2) : 0;
  c += 0.05 * q.dy * q.dy + 30 * q.s2 * q.s2;
  return { c, r };
}
let best = cost(p);
const steps = { dy: 2, s2: 0.01, tz: 0.008, sz: 0.008 };
for (let round = 0; round < 60; round++) {
  let improved = false;
  for (const k of Object.keys(steps)) for (const dir of [1, -1]) {
    const q = { ...p, [k]: p[k] + dir * steps[k] }; const t = cost(q);
    if (t.c < best.c) { best = t; p = q; improved = true; }
  }
  if (!improved) { for (const k of Object.keys(steps)) steps[k] /= 2; if (steps.s2 < 0.0002) break; }
}
evaluate(toOver(p));
const shift = abdomenShift();
const pick = (o) => Object.fromEntries(['chest', 'pelvis', 'abdomen', 'thigh.L', 'shank.L', 'thigh.R', 'shank.R'].map((k) => [k, o[k]]));
console.log(JSON.stringify({ p: Object.fromEntries(Object.entries(p).map(([k, v]) => [k, +v.toFixed(5)])), s2deg: +(p.s2 * 180 / Math.PI).toFixed(2), cost: +best.c.toFixed(3),
  over: pick(best.r.over), heelPlane: [best.r.plane['foot.L'], best.r.plane['foot.R']], headPlane: best.r.plane.head, deep: best.r.deep, deepAllowed: best.r.deepAllowed, maxDepth: best.r.maxDepth, abdomenMaxShiftMm: +shift.toFixed(2) }));
