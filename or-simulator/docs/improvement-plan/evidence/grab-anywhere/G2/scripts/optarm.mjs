// Coordinate search over the arm pose: upper arm and forearm directions, the hand tilt and the wrist twist,
// so that the upper arm, forearm and hand rest on the pad (lowest skin +0.3..+2.5 mm over the drawn
// support), the wrist sits at |x| 0.225..0.252, no arm skin hangs below pad level beyond the pad edge, and
// the arm stays outside the body's side (lateral envelope, <= 1.5 mm).
import { evaluate } from './evalpose.mjs';
const fixed = JSON.parse(process.argv[2] ?? '{}');
let p = { ux: 0.2, uz: -0.34, lx: 0.03, lz: -0.04, tilt: 0.4, twist: 0.19, gy: 0, ...JSON.parse(process.argv[3] ?? '{}') };
const free = (process.argv[4] ?? 'ux,uz,lx,lz,tilt,twist,gy').split(',');
const toOver = (q) => ({ ...fixed, upperArm: [q.ux, -1, q.uz], lowerArm: [q.lx, -1, q.lz], handTilt: q.tilt, wristTwist: q.twist, girdle: [0, q.gy, 0] });
function cost(q) {
  const r = evaluate(toOver(q));
  let c = 0;
  const band = (v, lo, hi, w = 1) => { if (v === null || v === undefined) return 1e4; return v < lo ? w * (lo - v) ** 2 : v > hi ? w * (v - hi) ** 2 : 0; };
  for (const s of ['L', 'R']) {
    c += band(r.over[`upperArm.${s}`], 0.3, 2.5, 4);
    c += band(r.over[`forearm.${s}`], 0.3, 2.5, 4);
    c += band(r.over[`hand.${s}`], 0.3, 2.5, 4);
    for (const part of ['upperArm', 'forearm', 'hand']) c += band(r.self[`${part}.${s}`] ?? 0, -1e9, 1.5, 10);
  }
  const FLAT = Number(process.env.FLAT ?? 1e9);
  for (const s of ['L', 'R']) c += band(r.uaMid[s], -1e9, FLAT, 2);
  for (const w of r.wrist) c += band(w * 1000, 225, 252, 10);
  c += r.offEdgeLow * 10;
  // Stay close to today's directions and wrist (natural look) unless the gates need otherwise.
  c += 20 * ((q.ux - 0.3) ** 2 + (q.lx - 0.1) ** 2) + 2 * (q.tilt ** 2) + 2 * ((q.twist - 0.19) ** 2) + 20 * q.gy * q.gy;
  return { c, r };
}
let best = cost(p);
const steps = Object.fromEntries(free.map((k) => [k, k === 'tilt' || k === 'twist' || k === 'gy' ? 0.08 : 0.04]));
for (let round = 0; round < 60; round++) {
  let improved = false;
  for (const k of Object.keys(steps)) {
    for (const dir of [1, -1]) {
      const q = { ...p, [k]: p[k] + dir * steps[k] };
      const t = cost(q);
      if (t.c < best.c) { best = t; p = q; improved = true; }
    }
  }
  if (!improved) { for (const k of Object.keys(steps)) steps[k] /= 2; if (Math.max(...Object.values(steps)) < 0.0008) break; }
}
console.log(JSON.stringify({ p: Object.fromEntries(Object.entries(p).map(([k, v]) => [k, +v.toFixed(4)])), cost: +best.c.toFixed(3),
  over: best.r.over, uaMid: best.r.uaMid, self: best.r.self, wrist: best.r.wrist, off: best.r.offEdgeLow, deep: best.r.deep, maxDepth: best.r.maxDepth }));
