import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  swingTwist, composeSwingTwist, nearestOnQuarterEllipse, projectSwing, ellipseValue, clampTwist, qMul, qAngle,
  qFromAxisAngle, qNormalize, qRotate, qConj, invertAffine, rigidFromElements, createJointModel, JOINT_LIMITS,
  dirOfSwing, swingOfDir, swingBoundaryPoint, projectDirection, swingInside, shortestArc, wrapAngle, WARN_DEADBAND_DEG,
} from '../src/patient/JointModel.js';
import { buildRig } from './fake-rig.mjs';

const DEG = Math.PI / 180;
function random(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const model = (rig) => createJointModel({ bones: rig.skeleton.bones, boneInverses: rig.skeleton.boneInverses });
const X = [1, 0, 0];
const angleBetween = (a, b) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
function randomRotation(rand) {
  const u1 = rand(), u2 = rand(), u3 = rand();
  return [Math.sqrt(1 - u1) * Math.sin(2 * Math.PI * u2), Math.sqrt(1 - u1) * Math.cos(2 * Math.PI * u2),
    Math.sqrt(u1) * Math.sin(2 * Math.PI * u3), Math.sqrt(u1) * Math.cos(2 * Math.PI * u3)];
}
const randomAxis = (rand) => [2 * rand() - 1, 2 * rand() - 1, 2 * rand() - 1];

// Clamps a path of inputs and sorts every output step. A step is a JUMP when the output moves more than 2° and
// more than eight times the input step (input steps are 0.1–0.5°); below that the output is continuous, and
// maxRatio reports how much faster than the input it moved (near overhead the shoulder's rotation neutral
// turns with the arm, so the output can move a few times faster than the input there).
// A jump is a TIE when the input sits where two clamp results are equally near. No clamp that puts every
// forbidden input on its limit can avoid ties (a disk cannot be retracted onto its boundary circle). A twist
// tie: the twist reading crossed the point opposite the middle of the range, so the output went from one twist
// bound to the other with the same swing. A swing tie: the input direction is equally far (within two input
// steps) from both projected directions. Any other jump is a defect.
function walk(jm, id, inputs, context) {
  const result = { steps: 0, maxStepDeg: 0, maxRatio: 0, twistTies: [], swingTies: [], defects: [] };
  let previous = null;
  for (const q of inputs) {
    const c = jm.clamp(id, q, context);
    if (previous) {
      const inStep = qAngle(previous.q, q), outStep = qAngle(previous.c.q, c.q);
      result.steps++;
      if (outStep > 2 * DEG && outStep > 8 * inStep) {
        const d = qRotate(previous.q, X), pa = qRotate(previous.c.q, X), pb = qRotate(c.q, X);
        const jump = { outStepDeg: outStep / DEG, swingExcessDeg: Math.min(previous.c.swingExcessDeg, c.swingExcessDeg),
          twistExcessDeg: Math.min(previous.c.twistExcessDeg, c.twistExcessDeg), swingMoveDeg: angleBetween(pa, pb) / DEG };
        if (previous.c.twistAt * c.twistAt === -1 && angleBetween(pa, pb) < 4 * inStep + 1e-9) result.twistTies.push(jump);
        else if (Math.abs(angleBetween(d, pa) - angleBetween(d, pb)) <= 2 * inStep + 1e-9 && angleBetween(pa, pb) > 0.5 * DEG) result.swingTies.push(jump);
        else result.defects.push(jump);
      } else {
        result.maxStepDeg = Math.max(result.maxStepDeg, outStep / DEG);
        if (inStep > 1e-7) result.maxRatio = Math.max(result.maxRatio, outStep / inStep);
      }
    }
    previous = { q, c };
  }
  return result;
}
// Inputs along a straight path in rotation space: q(λ) = R(axis, λ)·start for λ from a to b (degrees).
const line = (start, axis, a, b, step) => {
  const out = [];
  for (let x = a; x <= b + 1e-9; x += step) out.push(qNormalize(qMul(qFromAxisAngle(axis, x * DEG), start)));
  return out;
};

test('swing-twist: decompose and compose round trip within 1e-9', (t) => {
  const rand = random(7);
  let worstParams = 0, worstQuat = 0;
  for (let k = 0; k < 20000; k++) {
    const angle = (Math.PI - 0.01) * Math.sqrt(rand()), dir = 2 * Math.PI * rand();
    const sy = angle * Math.cos(dir), sz = angle * Math.sin(dir), t = (2 * rand() - 1) * (Math.PI - 0.01);
    const back = swingTwist(composeSwingTwist(sy, sz, t));
    worstParams = Math.max(worstParams, Math.abs(back.sy - sy), Math.abs(back.sz - sz), Math.abs(back.t - t));
    const q = qNormalize([2 * rand() - 1, 2 * rand() - 1, 2 * rand() - 1, 2 * rand() - 1]);
    const st = swingTwist(q);
    const r = composeSwingTwist(st.sy, st.sz, st.t);
    const sign = Math.sign(q[0] * r[0] + q[1] * r[1] + q[2] * r[2] + q[3] * r[3]) || 1;
    worstQuat = Math.max(worstQuat, ...q.map((x, i) => Math.abs(x - sign * r[i])));
  }
  t.diagnostic(`round trip: worst parameter error ${worstParams.toExponential(2)} rad, worst quaternion component error ${worstQuat.toExponential(2)}`);
  assert.ok(worstParams <= 1e-9, `parameters ${worstParams}`);
  assert.ok(worstQuat <= 1e-9, `quaternions ${worstQuat}`);
  // The swing really has no x part: twist = rotation about the child's own long axis.
  const st = swingTwist(composeSwingTwist(0.4, -0.7, 1.1));
  const swing = composeSwingTwist(st.sy, st.sz, 0);
  assert.ok(Math.abs(swing[0]) < 1e-15);
});

// Brute force over the boundary: 3,600 samples of each quarter ellipse, then the best one refined by a golden
// section between its neighbours (so the reference is better than its sampling step).
function bruteNearest(axes, y, z) {
  let best = { d: Infinity };
  for (const [sy, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
    const a = sy > 0 ? axes.yPos : axes.yNeg, b = sz > 0 ? axes.zPos : axes.zNeg;
    const point = (t) => [sy * a * Math.cos(t), sz * b * Math.sin(t)];
    const dist = (t) => { const p = point(t); return Math.hypot(p[0] - y, p[1] - z); };
    const N = 3600;
    let k0 = 0;
    for (let k = 1; k <= N; k++) if (dist(k * Math.PI / 2 / N) < dist(k0 * Math.PI / 2 / N)) k0 = k;
    let lo = Math.max(0, (k0 - 1) * Math.PI / 2 / N), hi = Math.min(Math.PI / 2, (k0 + 1) * Math.PI / 2 / N);
    const g = (Math.sqrt(5) - 1) / 2;
    for (let it = 0; it < 60; it++) {
      const m1 = hi - g * (hi - lo), m2 = lo + g * (hi - lo);
      if (dist(m1) < dist(m2)) hi = m2; else lo = m1;
    }
    const t = (lo + hi) / 2;
    if (dist(t) < best.d) best = { d: dist(t), p: point(t), coarse: dist(k0 * Math.PI / 2 / N) };
  }
  return best;
}

test('chart projection (doc 12 §4.5 Newton) matches a 3,600-sample brute force within 0.1° for every joint limit', (t) => {
  const rand = random(11);
  const sets = [];
  const rig = buildRig();
  const jm = model(rig);
  for (const id of jm.ids) {
    for (const context of [{}, { kneeFlexionDeg: 90, elevationDeg: 0 }]) sets.push(jm.limitsOf(id, context).axes);
  }
  let worstLocation = 0, worstDistance = 0, worstBelowBrute = 0, count = 0;
  for (const axes of sets) {
    for (let k = 0; k < 160; k++) {
      // Points outside the ellipse, up to 60° beyond it, in every quadrant.
      const dir = 2 * Math.PI * rand();
      const ys = Math.cos(dir) >= 0 ? axes.yPos : axes.yNeg, zs = Math.sin(dir) >= 0 ? axes.zPos : axes.zNeg;
      const y = Math.cos(dir) * ys * (1.001 + rand()) + Math.cos(dir) * 60 * DEG * rand();
      const z = Math.sin(dir) * zs * (1.001 + rand()) + Math.sin(dir) * 60 * DEG * rand();
      if (ellipseValue(y, z, axes) <= 1) continue;
      const p = projectSwing(y, z, axes);
      const ref = bruteNearest(axes, y, z);
      const d = Math.hypot(p.sy - y, p.sz - z);
      worstLocation = Math.max(worstLocation, Math.hypot(p.sy - ref.p[0], p.sz - ref.p[1]));
      worstDistance = Math.max(worstDistance, Math.abs(d - ref.d));
      worstBelowBrute = Math.max(worstBelowBrute, d - ref.coarse);
      // The projected point lies on the boundary.
      assert.ok(Math.abs(ellipseValue(p.sy, p.sz, axes) - 1) < 1e-9);
      count++;
    }
  }
  t.diagnostic(`projection: ${count} points, worst point difference ${(worstLocation / DEG).toExponential(2)}°, worst distance difference ${(worstDistance / DEG).toExponential(2)}°`);
  assert.ok(count > 3500, `${count} points`);
  assert.ok(worstLocation / DEG <= 0.1, `nearest point differs by ${worstLocation / DEG}°`);
  assert.ok(worstDistance / DEG <= 0.1, `distance differs by ${worstDistance / DEG}°`);
  // Never farther than the best of the 3,600 raw samples.
  assert.ok(worstBelowBrute <= 1e-12, `Newton point farther than a raw sample by ${worstBelowBrute / DEG}°`);
  // Never a radial scale: for an eccentric hinge ellipse the radial point is far from the nearest one.
  const hinge = { yPos: 4 * DEG, yNeg: 4 * DEG, zPos: 150 * DEG, zNeg: 5 * DEG };
  const y = 10 * DEG, z = 100 * DEG, e = Math.sqrt(ellipseValue(y, z, hinge));
  const near = projectSwing(y, z, hinge);
  assert.ok(Math.abs(near.sz - z) < 0.5 * DEG && Math.hypot(near.sy - y / e, near.sz - z / e) > 10 * DEG);
  const [qa, qb] = nearestOnQuarterEllipse(1, 1, 3, 4);
  assert.ok(Math.abs(qa - 0.6) < 1e-12 && Math.abs(qb - 0.8) < 1e-12);
});

test('the clamp is continuous: a continuous input path gives a continuous output path', (t) => {
  const rand = random(5);
  const rig = buildRig();
  const jm = model(rig);
  let worstRatio = 0, worstStep = 0;
  for (const id of jm.ids) {
    // A random walk of the relative rotation with steps of at most 0.25°, through and beyond the limits.
    let q = [0, 0, 0, 1];
    let previous = jm.clamp(id, q, { kneeFlexionDeg: 30, elevationDeg: 40 }).q;
    for (let k = 0; k < 4000; k++) {
      const axis = [2 * rand() - 1, 2 * rand() - 1, 2 * rand() - 1];
      const step = qFromAxisAngle(axis, 0.25 * DEG * rand());
      let next = qNormalize(qMul(step, q));
      // Keep the walk within 150° of neutral: away from the 180° swing where the swing-twist split is
      // undefined, and from the point opposite the middle of every twist range (≥ 170°).
      if (qAngle(next, [0, 0, 0, 1]) > 150 * DEG) next = q;
      const output = jm.clamp(id, next, { kneeFlexionDeg: 30, elevationDeg: 40 }).q;
      const inStep = qAngle(q, next), outStep = qAngle(previous, output);
      worstStep = Math.max(worstStep, outStep);
      if (inStep > 1e-6) worstRatio = Math.max(worstRatio, outStep / inStep);
      q = next; previous = output;
    }
  }
  t.diagnostic(`continuity: largest output step ${(worstStep / DEG).toFixed(3)}° for input steps ≤ 0.25°, largest output/input ratio ${worstRatio.toFixed(3)}`);
  assert.ok(worstStep < 1 * DEG, `largest output step ${worstStep / DEG}° for input steps ≤ 0.25°`);
  assert.ok(worstRatio < 3, `output step / input step up to ${worstRatio}`);
});

test('swing chart maps: the exponential and logarithm agree with swingTwist and with each other', () => {
  const rand = random(13);
  let worst = 0;
  for (let k = 0; k < 5000; k++) {
    const q = randomRotation(rand), st = swingTwist(q);
    const d = qRotate(q, X), e = dirOfSwing(st.sy, st.sz);
    // Vector differences (acos loses digits near 0).
    const gap = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    worst = Math.max(worst, gap(d, e));
    const back = swingOfDir(e);
    if (Math.hypot(st.sy, st.sz) < Math.PI - 1e-6) worst = Math.max(worst, Math.abs(back.sy - st.sy), Math.abs(back.sz - st.sz));
    const b = qRotate(randomRotation(rand), X), arc = shortestArc(d, b);
    worst = Math.max(worst, gap(qRotate(arc, d), b));
    // The shortest arc turns about d × b only: no turn about d itself.
    assert.ok(Math.abs(2 * Math.acos(Math.min(1, arc[3])) - angleBetween(d, b)) < 1e-9);
  }
  assert.ok(worst < 1e-9, `maps disagree by ${worst}`);
  // The boundary curve is closed and lies on the ellipse.
  const axes = { yPos: 1, yNeg: 0.5, zPos: 2, zNeg: 0.3 };
  for (let u = 0; u < 4; u += 0.01) assert.ok(Math.abs(ellipseValue(...swingBoundaryPoint(axes, u), axes) - 1) < 1e-12);
  assert.ok(Math.hypot(...swingBoundaryPoint(axes, 3.999999).map((v, i) => v - swingBoundaryPoint(axes, 0)[i])) < 1e-5);
});

// Brute force on the sphere: 3,600 samples of each quarter of the boundary curve, the best one refined by a
// golden section between its neighbours (as for the chart version above).
function bruteOnSphere(boundary, axes, d) {
  let best = -1, bestCos = -Infinity;
  for (let k = 0; k < boundary.length; k++) {
    const p = boundary[k], c = d[0] * p[0] + d[1] * p[1] + d[2] * p[2];
    if (c > bestCos) { bestCos = c; best = k; }
  }
  const n = boundary.length, at = (u) => dirOfSwing(...swingBoundaryPoint(axes, ((u % 4) + 4) % 4));
  let lo = (best - 1) * 4 / n, hi = (best + 1) * 4 / n;
  const g = (Math.sqrt(5) - 1) / 2, f = (u) => { const p = at(u); return d[0] * p[0] + d[1] * p[1] + d[2] * p[2]; };
  for (let it = 0; it < 60; it++) { const m1 = hi - g * (hi - lo), m2 = lo + g * (hi - lo); if (f(m1) > f(m2)) hi = m2; else lo = m1; }
  const u = (lo + hi) / 2, refined = f(u) > bestCos ? at(u) : boundary[best];
  // The best sample that is more than 1° away from the winner: when it is as near, the input is at a tie.
  let other = Infinity;
  for (const p of boundary) if (angleBetween(p, refined) > 1 * DEG) other = Math.min(other, angleBetween(p, d));
  return { point: refined, angle: angleBetween(refined, d), other };
}

test('swing projection on the sphere matches a 3,600-sample brute force within 0.1° for every joint limit', (t) => {
  const rand = random(23);
  const jm = model(buildRig());
  let worstDistance = 0, worstPoint = 0, count = 0, ties = 0, insideWrong = 0;
  for (const id of jm.ids) {
    for (const context of [{}, { kneeFlexionDeg: 90 }]) {
      const axes = jm.limitsOf(id, context).axes;
      const boundary = [];
      for (let k = 0; k < 4 * 3600; k++) boundary.push(dirOfSwing(...swingBoundaryPoint(axes, k / 3600)));
      for (let k = 0; k < 120; k++) {
        // Directions anywhere on the sphere, and directions just outside the boundary.
        let d = qRotate(randomRotation(rand), X);
        if (k % 2) {
          const b = dirOfSwing(...swingBoundaryPoint(axes, 4 * rand()));
          d = qRotate(qFromAxisAngle(randomAxis(rand), (0.01 + 5 * rand()) * DEG), b);
        }
        const p = projectDirection(d, axes);
        if (p.inside) { if (!swingInside(d, axes)) insideWrong++; continue; }
        const ref = bruteOnSphere(boundary, axes, d);
        worstDistance = Math.max(worstDistance, Math.abs(p.angle - ref.angle));
        if (ref.other - ref.angle > 0.05 * DEG) worstPoint = Math.max(worstPoint, angleBetween(p.d, ref.point));
        else ties++;
        // Never farther than the best of the raw samples.
        assert.ok(p.angle <= ref.angle + 1e-7, `${id}: ${p.angle / DEG}° vs brute ${ref.angle / DEG}°`);
        count++;
      }
    }
  }
  t.diagnostic(`sphere projection: ${count} outside directions, worst distance difference ${(worstDistance / DEG).toExponential(2)}°, worst point difference ${(worstPoint / DEG).toExponential(2)}° (${ties} near-ties skipped for the point)`);
  assert.ok(count > 1500, `${count} points`);
  assert.equal(insideWrong, 0);
  assert.ok(worstDistance / DEG <= 0.1, `distance differs by ${worstDistance / DEG}°`);
  assert.ok(worstPoint / DEG <= 0.1, `nearest point differs by ${worstPoint / DEG}°`);
});

test('near the limits the clamp is continuous: sweeps up to 10° and 25° beyond the limits never jump except at a tie', (t) => {
  // Straight 20° sweeps (0.1° steps) through random rotations pushed up to E degrees out of the allowed range
  // (300 per joint and band). They reach every limit, the shoulder's overhead apex and every 180° chart wrap
  // that lies within E of a limit; nothing keeps them near neutral.
  const jm = model(buildRig());
  const context = { kneeFlexionDeg: 30 };
  const lines = [];
  for (const E of [10, 25]) {
    const rand = random(41 + E);
    for (const id of jm.ids) {
      const total = { steps: 0, maxRatio: 0, twistTies: 0, swingTies: 0, defects: [], minTwistTieDeg: Infinity };
      for (let l = 0; l < 300; l++) {
        const inside = jm.clamp(id, randomRotation(rand), context).q;
        const start = qNormalize(qMul(qFromAxisAngle(randomAxis(rand), E * DEG * rand()), inside));
        const r = walk(jm, id, line(start, randomAxis(rand), -10, 10, 0.1), context);
        total.steps += r.steps; total.maxRatio = Math.max(total.maxRatio, r.maxRatio);
        total.twistTies += r.twistTies.length; total.swingTies += r.swingTies.length; total.defects.push(...r.defects);
        for (const j of r.twistTies) total.minTwistTieDeg = Math.min(total.minTwistTieDeg, j.twistExcessDeg);
      }
      assert.deepEqual(total.defects, [], `${id} within ${E}°: output jumps that are not ties`);
      // A swing tie needs the direction at least 26.7° beyond the limit (the shoulder's nearest, from the
      // medial-axis map in the G1 fix evidence), so neither band reaches one.
      assert.equal(total.swingTies, 0, `${id} within ${E}°: swing ties`);
      if (E === 10) {
        // Within 10° no tie at all, and the output never moves more than 4× faster than the input (the most is
        // the shoulder near overhead with its rotation at a bound, where the rotation neutral turns with the
        // arm, and the elbow at 150° of flexion with its twist at a bound).
        assert.equal(total.twistTies, 0, `${id} within 10°: twist ties`);
        assert.ok(total.maxRatio < 4, `${id} within 10°: output moves ${total.maxRatio}× faster than the input`);
      }
      lines.push(`${id} ≤${E}°: max ratio ${total.maxRatio.toFixed(2)}${total.twistTies ? `, ${total.twistTies} twist ties (≥ ${total.minTwistTieDeg.toFixed(1)}° beyond)` : ''}`);
    }
  }
  t.diagnostic(`near-limit sweeps: ${lines.join('; ')}`);
});

test('sweeps across every joint\'s 180° wrap give continuous output, ties aside', (t) => {
  // In each joint's limit chart: pure swings about eight axes of the y-z plane and pure twists about x, from
  // 150° to 210° in 0.25° steps (through the chart's wrap at 180°), with and without a 30° offset in the
  // other parameter. The only jumps allowed are ties, and every tie lies at least 70° beyond the limit.
  const jm = model(buildRig());
  const context = { kneeFlexionDeg: 30 };
  const lines = [];
  for (const id of jm.ids) {
    const paths = [];
    const angles = [];
    for (let a = 150; a <= 210 + 1e-9; a += 0.25) angles.push(a * DEG);
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, axis = [0, Math.cos(a), Math.sin(a)];
      for (const offset of [0, 30]) paths.push({ name: `swing ${k * 45}° twist ${offset}°`, at: (x) => composeSwingTwist(axis[1] * x, axis[2] * x, offset * DEG) });
    }
    // Twist about the child's own axis, with no swing and with 30° of swing.
    for (const offset of [0, 30]) paths.push({ name: `twist, swing ${offset}°`, at: (x) => composeSwingTwist(0, offset * DEG, x) });
    let jumps = 0, minTie = Infinity;
    for (const path of paths) {
      // The path is pure in the limit chart; the joint's own frame differs only for the shoulder.
      const inputs = angles.map((x) => jm.fromLimitChart(id, path.at(x)));
      const r = walk(jm, id, inputs, context);
      assert.deepEqual(r.defects, [], `${id} ${path.name}: jumps that are not ties`);
      for (const j of [...r.twistTies, ...r.swingTies]) {
        jumps++;
        minTie = Math.min(minTie, Math.max(j.swingExcessDeg, j.twistExcessDeg));
      }
    }
    assert.ok(minTie >= 70, `${id}: a tie only ${minTie}° beyond the limit`);
    lines.push(`${id} ${jumps} ties${jumps ? ` (≥ ${minTie.toFixed(1)}° beyond)` : ''}`);
  }
  t.diagnostic(`wrap sweeps: ${lines.join('; ')}`);
});

test('shoulder overhead (V1): flexion and abduction past 180° hold at the limit without a jump', (t) => {
  // The case that failed G1 verification: from the hanging arm, flexion and abduction swept 170° → 190° in
  // 0.25° steps. Before the fix the output jumped 120° (flexion) and 110° (abduction) at 180.25°.
  const jm = model(buildRig());
  const out = [];
  for (const [id, s] of [['shoulder.L', 1], ['shoulder.R', -1]]) {
    // In the hanging-arm chart: flexion turns +x toward +y (about +z), abduction toward the side (about s·+y).
    for (const [name, axis] of [['flexion', [0, 0, 1]], ['abduction', [0, s, 0]], ['scapular plane', [0, s * Math.SQRT1_2, Math.SQRT1_2]]]) {
      for (const [from, to] of [[170, 190], [150, 210]]) {
        const inputs = line([0, 0, 0, 1], axis, from, to, 0.25).map((q) => jm.fromLimitChart(id, q));
        const r = walk(jm, id, inputs, {});
        assert.deepEqual([...r.defects, ...r.swingTies, ...r.twistTies], [], `${id} ${name} ${from}→${to}`);
        assert.ok(r.maxRatio < 4, `${id} ${name} ${from}→${to}: output step ${r.maxStepDeg}° (ratio ${r.maxRatio})`);
        if (from === 170) out.push(`${id} ${name} max output step ${r.maxStepDeg.toFixed(3)}° for 0.25° input steps`);
      }
      // Past overhead the output stays at the overhead limit: the nearest allowed direction is the overhead
      // apex or the edge of the allowed wedge right beside it (within 1° of it).
      const over = jm.clamp(id, jm.fromLimitChart(id, qFromAxisAngle(axis, 190 * DEG)));
      assert.ok(over.changed);
      assert.ok(Math.abs(jm.angles(id, over.q).elevation - 180) < 1, `${id} ${name}: ${jm.angles(id, over.q).elevation}`);
    }
  }
  t.diagnostic(`overhead sweeps 170→190: ${out.join('; ')}`);
});

test('an overhead humerus keeps a finite rotation limit, continuous on every elevation', (t) => {
  const jm = model(buildRig());
  const out = [];
  for (const [id, s] of [['shoulder.L', 1], ['shoulder.R', -1]]) {
    const lim = jm.limitsOf(id);
    assert.ok(Math.abs((lim.tMax - lim.tMin) / DEG - 160) < 1e-9, 'IR 70 + ER 90 at every elevation (no widening)');
    for (const [name, axis] of [['flexion', [0, 0, 1]], ['abduction', [0, s, 0]]]) {
      for (const elevation of [90, 150, 165, 175, 179.9, 180]) {
        // Turn the humerus a full circle about its own axis at this elevation.
        const swing = qFromAxisAngle(axis, elevation * DEG);
        const inputs = [];
        for (let a = -180; a <= 180; a += 0.5) inputs.push(jm.fromLimitChart(id, qMul(swing, qFromAxisAngle(X, a * DEG))));
        const r = walk(jm, id, inputs, {});
        assert.deepEqual(r.defects, [], `${id} ${name} ${elevation}`);
        // One circle of rotation crosses the point opposite the range's middle once: one tie, nothing else.
        assert.equal(r.twistTies.length + r.swingTies.length, 1, `${id} ${name} ${elevation}: ${r.twistTies.length} twist ties, ${r.swingTies.length} swing ties`);
        let allowed = 0;
        for (const q of inputs) {
          const c = jm.clamp(id, q), ir = jm.angles(id, c.q).internalRotation;
          assert.ok(ir <= 70 + 1e-6 && ir >= -90 - 1e-6, `${id} ${name} ${elevation}: IR ${ir}`);
          if (!c.changed) allowed++;
        }
        // 160° of the 360° stay untouched: the rotation range never opens up overhead.
        assert.ok(Math.abs(allowed * 0.5 - 160) <= 1, `${id} ${name} ${elevation}: ${allowed * 0.5}° allowed`);
        if (elevation >= 175) out.push(`${id} ${name} ${elevation}°: ${allowed * 0.5}° of rotation allowed`);
      }
    }
  }
  t.diagnostic(out.join('; '));
});

test('clampTwist takes the nearer bound in circular distance', () => {
  assert.equal(clampTwist(0.2, -1, 1).t, 0.2);
  assert.equal(clampTwist(1.5, -1, 1).t, 1);
  assert.equal(clampTwist(-3.1, -1, 1).t, -1);
  assert.equal(clampTwist(3.1, -1, 1).t, 1);
});

test('invertAffine and rigidFromElements agree with three.js', () => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(0.3, -1.2, 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, -1.1, 2.2)), new THREE.Vector3(1, 1, 1));
  const inverse = invertAffine(m.elements), ref = m.clone().invert().elements;
  assert.ok(inverse.every((x, i) => Math.abs(x - ref[i]) < 1e-12));
  const r = rigidFromElements(m.elements), q = new THREE.Quaternion().setFromRotationMatrix(m);
  assert.ok(qAngle(r.quaternion, q.toArray()) < 1e-9);
});

test('joint frames come from the rig: hinge rest offset kept, sanitised names, both sides read alike', () => {
  const raw = model(buildRig());
  const sanitized = model(buildRig({ sanitized: true }));
  for (const id of raw.ids) {
    const a = raw.angles(id), b = sanitized.angles(id);
    for (const key of Object.keys(a)) assert.ok(Math.abs(a[key] - b[key]) < 1e-9, `${id} ${key}`);
  }
  // At the bind pose the hinges are pure flexion (the bind triple defines the hinge plane).
  for (const id of ['elbow.L', 'elbow.R', 'knee.L', 'knee.R']) {
    assert.ok(Math.abs(raw.restOffsetDeg[id]) < 1e-9, id);
    const a = raw.angles(id);
    assert.ok(Math.abs(a.offAxis) < 1e-9 && Math.abs(a.twist) < 1e-9, id);
  }
  assert.ok(Math.abs(raw.angles('elbow.L').flexion - 46.4) < 1, `bind elbow flexion ${raw.angles('elbow.L').flexion}`);
  // Mirror-symmetric rig, mirror-symmetric readings.
  for (const kind of ['shoulder', 'hip', 'elbow', 'knee', 'wrist', 'ankle']) {
    const l = raw.angles(`${kind}.L`), r = raw.angles(`${kind}.R`);
    for (const key of ['flexion', 'abduction', 'internalRotation', 'pronation', 'radialDeviation', 'dorsiflexion', 'eversion', 'offAxis']) {
      if (l[key] === undefined) continue;
      assert.ok(Math.abs(l[key] - r[key]) < 1e-6, `${kind} ${key}: ${l[key]} vs ${r[key]}`);
    }
  }
  // The A-pose arm reads as abduction (bind upper arm 40.8° from vertical), not flexion.
  const shoulder = raw.angles('shoulder.L');
  assert.ok(Math.abs(shoulder.abduction - 40.8) < 1 && Math.abs(shoulder.flexion) < 2, JSON.stringify(shoulder));
});

test('anatomical motions read as themselves on both sides', () => {
  const rig = buildRig();
  // Bring both arms down to the side (coronal adduction of the A-pose), then flex, abduct and rotate.
  const upper = (s) => rig.byName.get(`upperarm01.${s}`);
  for (const s of ['L', 'R']) {
    const at = new THREE.Vector3(...rig.positions[`upperarm01.${s}`]);
    const elbow = new THREE.Vector3(...rig.positions[`lowerarm01.${s}`]);
    const down = new THREE.Quaternion().setFromUnitVectors(elbow.clone().sub(at).normalize(), new THREE.Vector3(0, -1, 0));
    rig.setWorldQuaternion(`upperarm01.${s}`, down.multiply(upper(s).getWorldQuaternion(new THREE.Quaternion())));
  }
  const jm = model(rig);
  const base = { L: jm.angles('shoulder.L'), R: jm.angles('shoulder.R') };
  for (const s of ['L', 'R']) assert.ok(base[s].elevation < 1e-6 + 0.01, `${s} hangs: ${base[s].elevation}`);
  // Flexion 30° (about the lateral axis, arm moving forward).
  for (const s of ['L', 'R']) rig.turnWorld(`upperarm01.${s}`, [-1, 0, 0], 30);
  for (const s of ['L', 'R']) {
    const a = jm.angles(`shoulder.${s}`);
    assert.ok(Math.abs(a.flexion - 30) < 1e-6 && Math.abs(a.abduction) < 1e-6, `${s} flexion ${JSON.stringify(a)}`);
    assert.ok(Math.abs(a.internalRotation - base[s].internalRotation) < 1e-6, `${s} flexion is a pure swing`);
  }
  for (const s of ['L', 'R']) rig.turnWorld(`upperarm01.${s}`, [1, 0, 0], 30);
  // Abduction 60° in the coronal plane: a pure swing too (twist unchanged).
  rig.turnWorld('upperarm01.L', [0, 0, 1], 60);
  rig.turnWorld('upperarm01.R', [0, 0, -1], 60);
  for (const s of ['L', 'R']) {
    const a = jm.angles(`shoulder.${s}`);
    assert.ok(Math.abs(a.abduction - 60) < 1e-6 && Math.abs(a.flexion) < 1e-6, `${s} abduction ${JSON.stringify(a)}`);
    assert.ok(Math.abs(a.internalRotation - base[s].internalRotation) < 1e-6);
  }
  rig.turnWorld('upperarm01.L', [0, 0, 1], -60);
  rig.turnWorld('upperarm01.R', [0, 0, -1], -60);
  // Internal rotation 20° about the hanging humerus: the forearm (pointing forward when the elbow bends)
  // turns toward the body, i.e. toward −X on the left and +X on the right.
  rig.turnWorld('upperarm01.L', [0, 1, 0], -20);
  rig.turnWorld('upperarm01.R', [0, 1, 0], 20);
  for (const s of ['L', 'R']) {
    const a = jm.angles(`shoulder.${s}`);
    assert.ok(Math.abs(a.internalRotation - base[s].internalRotation - 20) < 1e-6, `${s} IR ${a.internalRotation} from ${base[s].internalRotation}`);
  }
  // Elbow: a turn about the bind hinge axis is pure flexion.
  const e = jm.angles('elbow.L');
  // The hinge axis turns with the upper arm (bind rotations are the identity on this rig).
  const upperNow = rig.byName.get('upperarm02.L').getWorldQuaternion(new THREE.Quaternion());
  const hinge = new THREE.Vector3(...jm.joints.get('elbow.L').hingeBind).applyQuaternion(upperNow).toArray();
  rig.turnWorld('lowerarm01.L', hinge, 20);
  const e2 = jm.angles('elbow.L');
  assert.ok(Math.abs(e2.flexion - e.flexion - 20) < 1e-6 && Math.abs(e2.offAxis) < 1e-6 && Math.abs(e2.twist) < 1e-6);
});

test('HARD clamps to the table value, WARN classifies, couplings follow the knee', () => {
  const rig = buildRig();
  const jm = model(rig);
  const hinge = jm.joints.get('elbow.L').hingeBind;
  // Elbow flexed to 170° → HARD, clamp returns 150°.
  rig.turnWorld('lowerarm01.L', hinge, 170 - jm.angles('elbow.L').flexion);
  const c = jm.classify('elbow.L');
  assert.equal(c.hard.length, 1);
  assert.ok(Math.abs(c.hard[0].excessDeg - 20) < 1e-6);
  assert.ok(c.warn.some((w) => w.motion === 'flexion'));
  const clamped = jm.clamp('elbow.L', jm.relative('elbow.L'));
  assert.ok(Math.abs(swingTwist(clamped.q).sz / DEG - 150) < 1e-6);
  // Shoulder abduction past 90° → the ASA R1 warning, no HARD.
  const s = jm.classify('shoulder.L');
  assert.equal(s.hard.length, 0);
  rig.turnWorld('upperarm01.L', [0, 0, 1], 95 - s.angles.abduction);
  const s2 = jm.classify('shoulder.L');
  assert.ok(s2.warn.some((w) => w.motion === 'abduction' && Math.abs(w.valueDeg - 95) < 0.5), JSON.stringify(s2.warn));
  assert.equal(s2.hard.length, 0);
  // Hip flexion HARD: 85° with the knee straight, 130° with the knee bent 90° (table values).
  assert.equal(jm.limitsOf('hip.L', { kneeFlexionDeg: 0 }).flexionDeg, JOINT_LIMITS.hip.hard.flexionKneeStraight);
  assert.equal(jm.limitsOf('hip.L', { kneeFlexionDeg: 90 }).flexionDeg, JOINT_LIMITS.hip.hard.flexionKneeBent);
  assert.equal(jm.limitsOf('ankle.R', { kneeFlexionDeg: 0 }).dorsiflexionDeg, 10);
  assert.equal(jm.limitsOf('ankle.R', { kneeFlexionDeg: 45 }).dorsiflexionDeg, 20);
});

test('why the shoulder needs a swing-dependent rotation neutral: an anterior chart alone reads a coronal abduction as 90° of rotation', () => {
  // Frame: x = down, y = front, z = −X (the shoulder's hanging-arm limit chart). A coronal abduction of 90° from
  // the hanging arm is a turn about the front axis.
  const abduct = qFromAxisAngle([0, 1, 0], -90 * DEG);
  const inferior = swingTwist(abduct);
  assert.ok(Math.abs(inferior.t) < 1e-12 && Math.abs(Math.hypot(inferior.sy, inferior.sz) - Math.PI / 2) < 1e-12);
  // The same arm with the reference axis pointing forward (doc 12 §2.4's choice): the frame turned by −90°
  // about z, so the hanging arm is a 90° swing from it.
  const toFront = qFromAxisAngle([0, 0, 1], -90 * DEG);
  const anterior = swingTwist(qMul(toFront, abduct));
  const hanging = swingTwist(toFront);
  assert.ok(Math.abs(hanging.t) < 1e-12);
  assert.ok(Math.abs(Math.abs(anterior.t) - Math.PI / 2) < 1e-9, `anterior-reference twist ${anterior.t / DEG}°`);
});

test('the shoulder: anterior reference, rotation read from a swing-dependent neutral', (t) => {
  const rig = buildRig();
  const jm = model(rig);
  const rand = random(29);
  for (const [id, s] of [['shoulder.L', 1], ['shoulder.R', -1]]) {
    const joint = jm.joints.get(id);
    // The swing-twist split is about the anterior axis: the hanging arm is a 90° swing from it, and the
    // split's singularity (posterior) is 30° beyond the extension stop.
    const hang = jm.fromLimitChart(id, [0, 0, 0, 1]);
    const st = swingTwist(hang);
    assert.ok(Math.abs(Math.hypot(st.sy, st.sz) - Math.PI / 2) < 1e-9 && Math.abs(st.t) < 1e-9, JSON.stringify(st));
    const posterior = qRotate(joint.toLimit, [-1, 0, 0]);
    assert.ok(Math.abs(Math.atan2(posterior[1], posterior[0]) / DEG + 90) < 1e-9, 'posterior = extension 90°');
    // Up to 120° of elevation the rotation reading is the hanging-arm chart's twist, to rounding.
    let worst = 0, n = 0;
    for (let k = 0; k < 4000; k++) {
      const qH = randomRotation(rand);
      const d = qRotate(qH, X);
      if (Math.acos(Math.max(-1, Math.min(1, d[0]))) > 120 * DEG) continue;
      const a = jm.angles(id, jm.fromLimitChart(id, qH));
      worst = Math.max(worst, Math.abs(wrapAngle((a.internalRotation - s * swingTwist(qH).t / DEG) * DEG)));
      n++;
    }
    assert.ok(n > 1000 && worst < 1e-9, `${id}: ${n} rotations, reading differs from the hanging chart by ${worst}`);
    // Coronal abduction onto an arm board (90°) and forward flexion read no rotation.
    for (const axis of [[0, s, 0], [0, 0, 1]]) {
      const a = jm.angles(id, jm.fromLimitChart(id, qFromAxisAngle(axis, 90 * DEG)));
      assert.ok(Math.abs(a.internalRotation) < 1e-9, `${id} ${axis}: IR ${a.internalRotation}`);
    }
    // Overhead, the flexion and the abduction path (180° of rotation apart, Codman) read ±90° from the one
    // overhead neutral; with IR 70 / ER 90 the external one is at its bound and the internal one is clamped
    // by 20° (ASSUMED, DN5).
    const overhead = [[0, 0, 1], [0, s, 0]].map((axis) => jm.angles(id, jm.fromLimitChart(id, qFromAxisAngle(axis, 179.999 * DEG))).internalRotation);
    assert.ok(Math.abs(Math.abs(overhead[0]) - 90) < 0.01 && Math.abs(Math.abs(overhead[1]) - 90) < 0.01, `${id}: ${overhead}`);
    assert.ok(Math.abs(overhead[0] + overhead[1]) < 0.02, `${id}: the two paths read opposite rotations ${overhead}`);
    t.diagnostic(`${id}: overhead by flexion reads IR ${overhead[0].toFixed(2)}°, by abduction IR ${overhead[1].toFixed(2)}°`);
    // The neutral is continuous over the allowed directions, overhead included: 0.1° of arm motion moves it
    // by at most a few tenths of a degree.
    let jump = 0;
    const axes = jm.limitsOf(id).axes;
    for (let k = 0; k < 20000; k++) {
      const dL = qRotate(randomRotation(rand), X);
      if (!swingInside(dL, axes)) continue;
      const dJ = qRotate(qConj(joint.toLimit), dL);
      const e = qRotate(qFromAxisAngle(randomAxis(rand), 0.1 * DEG), dJ);
      if (!swingInside(qRotate(joint.toLimit, e), axes)) continue;
      jump = Math.max(jump, Math.abs(wrapAngle((jm.neutralOffsetDeg(id, e) - jm.neutralOffsetDeg(id, dJ)) * DEG)) / DEG);
    }
    assert.ok(jump < 1, `${id}: the neutral moves ${jump}° for 0.1° of arm motion`);
    t.diagnostic(`${id}: largest neutral change for 0.1° of arm motion over the allowed range ${jump.toFixed(3)}°`);
  }
});

test('a WARN needs the deadband past its threshold, so calibration noise does not warn', () => {
  const rig = buildRig();
  const jm = model(rig);
  assert.equal(WARN_DEADBAND_DEG, 1);
  // Bring the left thigh to vertical (hanging chart neutral), then extend it by 0.5° and by 1.5°.
  const at = rig.byName.get('upperleg01.L');
  const hip = new THREE.Vector3(...rig.positions['upperleg01.L']), knee = new THREE.Vector3(...rig.positions['lowerleg01.L']);
  const down = new THREE.Quaternion().setFromUnitVectors(knee.clone().sub(hip).normalize(), new THREE.Vector3(0, -1, 0));
  rig.setWorldQuaternion('upperleg01.L', down.multiply(at.getWorldQuaternion(new THREE.Quaternion())));
  const flexion0 = jm.angles('hip.L').flexion;
  rig.turnWorld('upperleg01.L', [1, 0, 0], 0.5 + flexion0);
  const small = jm.classify('hip.L');
  assert.ok(Math.abs(small.angles.flexion + 0.5) < 1e-6, `${small.angles.flexion}`);
  assert.ok(!small.warn.some((w) => w.motion === 'extension'), JSON.stringify(small.warn));
  rig.turnWorld('upperleg01.L', [1, 0, 0], 1);
  const past = jm.classify('hip.L');
  assert.ok(past.warn.some((w) => w.motion === 'extension' && Math.abs(w.valueDeg - 1.5) < 1e-6), JSON.stringify(past.warn));
});

test('clamping a clamped rotation changes nothing (outputs on the limit read as allowed)', () => {
  const rand = random(3);
  const jm = model(buildRig());
  let again = 0;
  for (const id of jm.ids) {
    for (let k = 0; k < 500; k++) {
      const once = jm.clamp(id, randomRotation(rand), { kneeFlexionDeg: 30 });
      const twice = jm.clamp(id, once.q, { kneeFlexionDeg: 30 });
      if (twice.changed) again++;
      // The classification of a clamped rotation has no HARD entry either (joints whose limits do not follow
      // the knee: classify reads the rig's own knee).
      if (k % 50 === 0 && !/^(hip|ankle)/.test(id)) assert.equal(jm.classify(id, once.q).hard.length, 0, `${id}: ${JSON.stringify(jm.classify(id, once.q).hard)}`);
    }
  }
  assert.equal(again, 0, `${again} clamped rotations clamped again`);
});
