// Joint model for grab-anywhere (12_GRAB_ANYWHERE_DESIGN.md §2.4, §4.5).
//
// Every joint gets two constant frames, one on the parent bone and one on the child bone, built from the rig
// itself (bind-pose positions and the elbow and knee hinge planes). The relative rotation
// qRel = (qParent·fParent)⁻¹·(qChild·fChild) is then split into a swing (sy, sz: the y and z parts of its
// rotation vector, the child's long axis being +x) and a twist about +x.
//
// Limits. The swing is limited by a quadrant ellipse (one semi-axis per half-axis) drawn in a "limit chart":
// the joint's own chart, except for the shoulder (below). An outside direction is moved to the NEAREST point
// of the allowed region measured on the sphere of directions (never a radial scale, which injected energy in
// design C's prototype), by the shortest rotation that carries the child axis there; the twist is then
// clamped about the child's own axis. WARN is a classification only; HARD clamps.
//
// Why the projection is on the sphere and not in the chart (G1 verification V1): the chart (the rotation
// vector of the swing) wraps at 180° of swing, where every direction of the chart's circle |s| = π is the same
// arm direction. A chart-nearest projection therefore jumps there, and it is far from nearest wherever the
// chart is strongly distorted. Measured on the sphere, the only places left where the output can jump are
// inputs that are equally far from two separate parts of the allowed region (the medial axis of the
// forbidden region), deep beyond every HARD stop. No clamp that puts every forbidden input on the limit can
// avoid such a place (a disk cannot be retracted onto its boundary circle); the unit tests measure where it
// lies for every joint. projectSwing (the chart's Newton projection of §4.5) stays exported and tested.
//
// Shoulder. The swing-twist split uses an anterior reference axis (doc 12 §2.4: the ceiling when supine), so
// the split's singularity is posterior, 30° beyond the extension HARD stop and outside the allowed range. The
// swing limit keeps its clinical description from the hanging arm (flexion, extension, abduction, adduction):
// the limit chart is the hanging-arm chart, reached by a constant rotation. Humeral rotation is measured from
// a swing-dependent neutral: up to 120° of elevation it is the hanging arm carried by the shortest arc (so a
// coronal abduction onto an arm board reads 0° of rotation, not the 90° an anterior reference alone would
// read, and every reading matches the hanging-arm chart there); from 120° to 180° it blends into one overhead
// neutral halfway between the flexion and abduction paths (Codman's paradox: those two paths reach overhead
// 180° of rotation apart). The rotation limit therefore stays a finite IR/ER range all the way overhead and is
// continuous there.
//
// Plain arithmetic on [x, y, z, w] arrays: no three.js import (the bones are read through their matrixWorld
// and the skeleton's boneInverses), so the module runs and is unit-tested in node.
//
// Every limit, threshold and coupling below is DN5 "illustrative — needs certified-clinician review"
// (CR-09, CR-36): AAOS normal values, the CDC joint ROM study and the ASA 2018 advisory as listed in §2.4,
// plus the ASSUMED values marked where they are introduced.

const DEG = Math.PI / 180;
// Every limit, angle threshold and coupling of this module is a clinical value (DN5).
export const DN5_LABEL = 'illustrative — needs certified-clinician review (DN5; CR-09, CR-36)';
// A WARN needs the angle at least this far past its threshold, so that calibration noise of the authored rest
// (0.46° of hip extension on patient.glb) does not raise a warning (ASSUMED, DN5).
export const WARN_DEADBAND_DEG = 1;

// ---------------------------------------------------------------- quaternion and vector helpers
export function qMul(a, b, out = [0, 0, 0, 1]) {
  const ax = a[0], ay = a[1], az = a[2], aw = a[3], bx = b[0], by = b[1], bz = b[2], bw = b[3];
  out[0] = ax * bw + aw * bx + ay * bz - az * by;
  out[1] = ay * bw + aw * by + az * bx - ax * bz;
  out[2] = az * bw + aw * bz + ax * by - ay * bx;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}
export const qConj = (a) => [-a[0], -a[1], -a[2], a[3]];
export function qNormalize(a) {
  const n = Math.hypot(a[0], a[1], a[2], a[3]) || 1;
  return [a[0] / n, a[1] / n, a[2] / n, a[3] / n];
}
export function qFromAxisAngle(axis, angle) {
  const n = Math.hypot(axis[0], axis[1], axis[2]) || 1, s = Math.sin(angle / 2) / n;
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
}
export function qRotate(q, v) {
  // v' = q v q*, written out (same as three.js Vector3.applyQuaternion).
  const [qx, qy, qz, qw] = q, [vx, vy, vz] = v;
  const tx = 2 * (qy * vz - qz * vy), ty = 2 * (qz * vx - qx * vz), tz = 2 * (qx * vy - qy * vx);
  return [vx + qw * tx + qy * tz - qz * ty, vy + qw * ty + qz * tx - qx * tz, vz + qw * tz + qx * ty - qy * tx];
}
// Angle in radians between two rotations (sign of the quaternion ignored).
export function qAngle(a, b) {
  const d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);
  return 2 * Math.acos(Math.min(1, d));
}
// Rotation from three orthonormal columns (same branch order as three.js setFromRotationMatrix).
export function qFromColumns(x, y, z) {
  const m11 = x[0], m21 = x[1], m31 = x[2], m12 = y[0], m22 = y[1], m32 = y[2], m13 = z[0], m23 = z[1], m33 = z[2];
  const trace = m11 + m22 + m33;
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1);
    return [(m32 - m23) * s, (m13 - m31) * s, (m21 - m12) * s, 0.25 / s];
  }
  if (m11 > m22 && m11 > m33) {
    const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
    return [0.25 * s, (m12 + m21) / s, (m13 + m31) / s, (m32 - m23) / s];
  }
  if (m22 > m33) {
    const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
    return [(m12 + m21) / s, 0.25 * s, (m23 + m32) / s, (m13 - m31) / s];
  }
  const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
  return [(m13 + m31) / s, (m23 + m32) / s, 0.25 * s, (m21 - m12) / s];
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const unit = (a) => scale(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
// Angle wrapped into (−π, π].
export const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const X_AXIS = [1, 0, 0];
// Orthonormal frame with x along `x` and y as close to `yHint` as possible; z = x × y.
export function frameXY(x, yHint) {
  const ex = unit(x);
  const ey = unit(sub(yHint, scale(ex, dot(yHint, ex))));
  return qFromColumns(ex, ey, cross(ex, ey));
}
// Orthonormal frame with x along `x` and z as close to `zHint` as possible; y = z × x.
export function frameXZ(x, zHint) {
  const ex = unit(x);
  const ez = unit(sub(zHint, scale(ex, dot(zHint, ex))));
  return qFromColumns(ex, cross(ez, ex), ez);
}
// World rotation and position of a column-major 4×4 (three.js Matrix4.elements), scale removed.
export function rigidFromElements(e) {
  const x = unit([e[0], e[1], e[2]]), y = unit([e[4], e[5], e[6]]), z = unit([e[8], e[9], e[10]]);
  return { position: [e[12], e[13], e[14]], quaternion: qNormalize(qFromColumns(x, y, z)) };
}
// Inverse of an affine column-major 4×4 (bind matrices are stored inverted in skeleton.boneInverses).
export function invertAffine(e) {
  const a = e[0], b = e[4], c = e[8], d = e[1], f = e[5], g = e[9], h = e[2], i = e[6], k = e[10];
  // Cofactors of M = [[a b c] [d f g] [h i k]]; the inverse is their transpose over the determinant.
  const A = f * k - g * i, B = -(d * k - g * h), C = d * i - f * h;
  const r = 1 / (a * A + b * B + c * C);
  // Column-major inverse: m[0..2] is its first column, m[3..5] the second, m[6..8] the third.
  const m = [
    A * r, B * r, C * r,
    -(b * k - c * i) * r, (a * k - c * h) * r, -(a * i - b * h) * r,
    (b * g - c * f) * r, -(a * g - c * d) * r, (a * f - b * d) * r,
  ];
  const tx = e[12], ty = e[13], tz = e[14];
  return [
    m[0], m[1], m[2], 0,
    m[3], m[4], m[5], 0,
    m[6], m[7], m[8], 0,
    -(m[0] * tx + m[3] * ty + m[6] * tz), -(m[1] * tx + m[4] * ty + m[7] * tz), -(m[2] * tx + m[5] * ty + m[8] * tz), 1,
  ];
}
// Shortest rotation carrying unit vector a onto unit vector b (b = −a: a half turn about a perpendicular).
export function shortestArc(a, b) {
  const w = 1 + dot(a, b);
  if (w < 1e-12) {
    const p = unit(cross(a, Math.abs(a[0]) < 0.9 ? X_AXIS : [0, 1, 0]));
    return [p[0], p[1], p[2], 0];
  }
  const c = cross(a, b);
  return qNormalize([c[0], c[1], c[2], w]);
}

// ---------------------------------------------------------------- swing-twist about +x
// q = swing · twist: the twist turns the child about its own long axis (+x of the child frame) first, then
// the swing tilts that axis. sy, sz are the swing's rotation vector (radians); t is in [-π, π].
export function swingTwist(q) {
  let [x, y, z, w] = q;
  if (w < 0) { x = -x; y = -y; z = -z; w = -w; }
  const n = Math.hypot(x, w);
  if (n < 1e-12) {
    // Swing of exactly 180°: the twist is undefined; report it as 0 and the whole rotation as swing.
    const m = Math.hypot(y, z) || 1;
    return { sy: Math.PI * y / m, sz: Math.PI * z / m, t: 0 };
  }
  const tx = x / n, tw = w / n;
  const t = 2 * Math.atan2(tx, tw);
  // swing = q · twist⁻¹ has no x part (see the derivation in the unit test).
  const sw = n, syq = (y * w - z * x) / n, szq = (z * w + y * x) / n;
  const s = Math.hypot(syq, szq);
  if (s < 1e-15) return { sy: 0, sz: 0, t };
  const angle = 2 * Math.atan2(s, sw);
  return { sy: angle * syq / s, sz: angle * szq / s, t };
}
export function composeSwingTwist(sy, sz, t) {
  const angle = Math.hypot(sy, sz);
  const k = angle < 1e-15 ? 0.5 : Math.sin(angle / 2) / angle;
  const swing = [0, sy * k, sz * k, Math.cos(angle / 2)];
  return qMul(swing, [Math.sin(t / 2), 0, 0, Math.cos(t / 2)]);
}
// The child axis that a swing (sy, sz) points to (the chart's exponential map): +sz tilts +x toward +y, +sy
// tilts it toward −z (the rotation vector's own convention).
export function dirOfSwing(sy, sz) {
  const a = Math.hypot(sy, sz);
  if (a < 1e-15) return [1, 0, 0];
  const s = Math.sin(a) / a;
  return [Math.cos(a), s * sz, -s * sy];
}
// The swing of the shortest arc from +x to the direction d (the chart's logarithm, |s| in [0, π]). At the
// antipode (d = −x) every chart direction is the same arm direction; `fallback` (a unit [y, z]) is used.
export function swingOfDir(d, fallback = [1, 0]) {
  const r = Math.hypot(d[1], d[2]);
  const a = Math.atan2(r, d[0]);
  if (r < 1e-15) return a < 1 ? { sy: 0, sz: 0 } : { sy: a * fallback[0], sz: a * fallback[1] };
  return { sy: -a * d[2] / r, sz: a * d[1] / r };
}

// ---------------------------------------------------------------- quadrant ellipse
// Nearest point on the quarter ellipse (semi-axes a along x, b along y) to an outside point with x, y ≥ 0.
// Newton on the parametric angle θ of f(θ) = (a² − b²)·cosθ·sinθ − x·a·sinθ + y·b·cosθ, 8 steps, θ kept in
// [0, π/2] (design C's verified method; the unit test checks it against a brute force).
export function nearestOnQuarterEllipse(a, b, x, y, steps = 8) {
  let t = Math.atan2(a * y, b * x);
  for (let i = 0; i < steps; i++) {
    const c = Math.cos(t), s = Math.sin(t);
    const f = (a * a - b * b) * c * s - x * a * s + y * b * c;
    const df = (a * a - b * b) * (c * c - s * s) - x * a * c - y * b * s;
    if (Math.abs(df) < 1e-15) break;
    t = Math.min(Math.PI / 2, Math.max(0, t - f / df));
  }
  return [a * Math.cos(t), b * Math.sin(t)];
}
// Semi-axes per half-axis: yPos for sy ≥ 0, yNeg for sy < 0, zPos, zNeg likewise (radians, all > 0).
export function ellipseValue(sy, sz, axes) {
  const a = sy >= 0 ? axes.yPos : axes.yNeg, b = sz >= 0 ? axes.zPos : axes.zNeg;
  return (sy / a) ** 2 + (sz / b) ** 2;
}
// Nearest point of the ellipse in the chart plane (doc 12 §4.5). Kept for reference: clamp() projects on the
// sphere (projectDirection below).
export function projectSwing(sy, sz, axes) {
  if (ellipseValue(sy, sz, axes) <= 1) return { sy, sz, excess: 0 };
  const a = sy >= 0 ? axes.yPos : axes.yNeg, b = sz >= 0 ? axes.zPos : axes.zNeg;
  const [py, pz] = nearestOnQuarterEllipse(a, b, Math.abs(sy), Math.abs(sz));
  const ny = sy < 0 ? -py : py, nz = sz < 0 ? -pz : pz;
  return { sy: ny, sz: nz, excess: Math.hypot(sy - ny, sz - nz) };
}
// The boundary of the allowed swing region as one closed curve, u in [0, 4): quadrant by quadrant from +y to
// +z, −y, −z and back to +y (so the curve is continuous across the axes).
export function swingBoundaryPoint(axes, u) {
  const k = Math.min(3, Math.max(0, Math.floor(u))), f = (u - k) * Math.PI / 2, c = Math.cos(f), s = Math.sin(f);
  switch (k) {
    case 0: return [axes.yPos * c, axes.zPos * s];
    case 1: return [-axes.yNeg * s, axes.zPos * c];
    case 2: return [-axes.yNeg * c, -axes.zNeg * s];
    default: return [axes.yPos * s, -axes.zNeg * c];
  }
}
// True when the direction d lies in the allowed swing region of `axes`.
export function swingInside(d, axes) {
  const s = swingOfDir(d);
  if (Math.hypot(d[1], d[2]) < 1e-15 && d[0] < 0) {
    // The antipode is allowed only where a semi-axis reaches 180° (the shoulder's overhead point).
    return Math.max(axes.yPos, axes.yNeg, axes.zPos, axes.zNeg) >= Math.PI - 1e-12;
  }
  return ellipseValue(s.sy, s.sz, axes) <= 1 + 1e-12;
}
// Nearest point (on the sphere of directions) of the allowed region's boundary to the direction d: a coarse
// pass over the closed boundary curve (32 points per quadrant, cached per limit set), then a golden-section
// refinement of the best local maxima of cos(angle). Returns { d, swing: [sy, sz], angle } (radians).
const COARSE = 32, REFINE = 30, KEEP = 4, MARGIN = 0.02;
// Excess below this (radians, 5.7e-8°) is rounding, not a limit violation.
export const LIMIT_TOLERANCE = 1e-9;
const coarseCache = new Map();
function coarseBoundary(axes) {
  const key = `${axes.yPos},${axes.yNeg},${axes.zPos},${axes.zNeg}`;
  let points = coarseCache.get(key);
  if (!points) {
    points = new Float64Array(4 * COARSE * 3);
    for (let k = 0; k < 4 * COARSE; k++) {
      const [y, z] = swingBoundaryPoint(axes, k / COARSE);
      points.set(dirOfSwing(y, z), k * 3);
    }
    if (coarseCache.size >= 64) coarseCache.delete(coarseCache.keys().next().value);
    coarseCache.set(key, points);
  }
  return points;
}
export function nearestOnSwingBoundary(d, axes) {
  const points = coarseBoundary(axes), n = 4 * COARSE;
  const c = new Float64Array(n);
  let best = -Infinity;
  for (let k = 0; k < n; k++) {
    c[k] = d[0] * points[k * 3] + d[1] * points[k * 3 + 1] + d[2] * points[k * 3 + 2];
    if (c[k] > best) best = c[k];
  }
  // Seeds: the local maxima of the coarse pass. Where the boundary collapses onto one direction (the
  // shoulder's overhead apex, a whole quarter of the curve) the samples tie; only the two ends of such a
  // plateau are seeds, because the nearest point lies at the apex or just beyond one of its ends.
  const seeds = [];
  const same = (a, b) => Math.abs(c[a] - c[b]) < 1e-14;
  for (let k = 0; k < n; k++) {
    if (c[k] < best - MARGIN) continue;
    const prev = (k + n - 1) % n, next = (k + 1) % n;
    if (c[k] >= c[prev] && c[k] >= c[next] && !(same(k, prev) && same(k, next))) seeds.push(k);
  }
  if (!seeds.length) seeds.push(c.indexOf(best));
  seeds.sort((a, b) => c[b] - c[a]);
  const value = (u) => {
    const [y, z] = swingBoundaryPoint(axes, ((u % 4) + 4) % 4);
    const p = dirOfSwing(y, z);
    return d[0] * p[0] + d[1] * p[1] + d[2] * p[2];
  };
  const g = (Math.sqrt(5) - 1) / 2;
  let top = { u: 0, cos: -Infinity };
  for (const k of seeds.slice(0, KEEP)) {
    let lo = (k - 1) / COARSE, hi = (k + 1) / COARSE;
    let m1 = hi - g * (hi - lo), m2 = lo + g * (hi - lo), f1 = value(m1), f2 = value(m2);
    for (let it = 0; it < REFINE; it++) {
      if (f1 > f2) { hi = m2; m2 = m1; f2 = f1; m1 = hi - g * (hi - lo); f1 = value(m1); }
      else { lo = m1; m1 = m2; f1 = f2; m2 = lo + g * (hi - lo); f2 = value(m2); }
    }
    const u = (lo + hi) / 2, f = value(u);
    // The coarse point itself is a fallback when the refinement found nothing better.
    const coarse = { u: k / COARSE, cos: c[k] };
    const pick = f >= coarse.cos ? { u, cos: f } : coarse;
    if (pick.cos > top.cos) top = pick;
  }
  const swing = swingBoundaryPoint(axes, ((top.u % 4) + 4) % 4);
  return { d: dirOfSwing(swing[0], swing[1]), swing, angle: Math.acos(Math.max(-1, Math.min(1, top.cos))) };
}
// The allowed direction nearest to d: d itself when inside, else the nearest boundary point.
export function projectDirection(d, axes) {
  if (swingInside(d, axes)) return { d, angle: 0, inside: true };
  const near = nearestOnSwingBoundary(d, axes);
  // On the boundary to rounding (a clamped output read back, or the shoulder's overhead apex read from another
  // quadrant): inside, so clamping a clamped rotation changes nothing.
  if (near.angle < LIMIT_TOLERANCE) return { d, angle: 0, inside: true };
  return { d: near.d, angle: near.angle, inside: false };
}
// Twist range [min, max] (radians, min < 0 < max); outside it the nearer bound in circular distance wins, so
// the clamp only jumps at the point opposite the middle of the range.
export function clampTwist(t, min, max) {
  if (t >= min - LIMIT_TOLERANCE && t <= max + LIMIT_TOLERANCE) return { t, excess: 0 };
  const toMin = Math.abs(wrapAngle(t - min)), toMax = Math.abs(wrapAngle(t - max));
  return toMax <= toMin ? { t: max, excess: toMax } : { t: min, excess: toMin };
}

// ---------------------------------------------------------------- the joint table (DN5)
// Degrees from anatomical neutral, patient supine (12 §2.4). HARD = physical stop for a flaccid patient,
// WARN = shown to the trainee and logged. Shoulder adduction 70 and the shoulder's rotation-neutral blend, the
// ankle abduction ±25, the hinge tolerance ±4 and the hip and ankle coupling spans are ASSUMED (noted below).
export const JOINT_LIMITS = Object.freeze({
  shoulder: {
    hard: { flexion: 180, extension: 60, abduction: 180,
      // "Adduction across the chest 45": with the hanging-arm limit chart, a medial semi-axis of 70° lets a
      // horizontal adduction at 90° flexion reach 45° (ASSUMED derivation; a pure coronal adduction from
      // the side is stopped earlier by the trunk through self-collision).
      adduction: 70,
      internalRotation: 70, externalRotation: 90,
      // The rotation neutral is the hanging arm's up to the first elevation and blends into one overhead
      // neutral by the second (ASSUMED; see the header).
      neutralBlendDeg: [120, 180] },
    warn: { flexion: 90, extension: 10, abduction: 90, externalRotationWhenAbducted: 60, abductedFrom: 60 },
  },
  elbow: { hard: { flexion: 150, hyperextension: 5, offAxis: 4, twist: 4 }, warn: { flexion: 90, hyperextension: 0 } },
  wrist: {
    hard: { flexion: 85, extension: 75, radialDeviation: 25, ulnarDeviation: 35, pronation: 85, supination: 90 },
    // "Full pronation on an arm board" (ASA): flagged from 80° (ASSUMED threshold).
    warn: { flexion: 60, extension: 60, pronation: 80 },
  },
  hip: {
    // Flexion is coupled to the knee: 85° with the knee straight, 130° once it is bent 90° (linear between;
    // the 90° span is ASSUMED).
    hard: { flexionKneeBent: 130, flexionKneeStraight: 85, extension: 15, abduction: 45, adduction: 30,
      internalRotation: 40, externalRotation: 50, kneeSpanDeg: 90 },
    warn: { flexionKneeBent: 90, flexionKneeStraight: 60, extension: 0, abduction: 30, externalRotationWithFlexion: 30, flexedFrom: 30 },
  },
  knee: { hard: { flexion: 140, hyperextension: 5, offAxis: 4, twist: 4 },
    // "Sustained hyperflexion": flagged above 120° (ASSUMED threshold).
    warn: { flexion: 120, hyperextension: 0 } },
  ankle: {
    // Dorsiflexion is coupled to the knee: 10° with the knee straight, 20° once it is bent 45° (span ASSUMED).
    // Abduction / adduction of the foot is not in the table: ±25° (ASSUMED).
    hard: { dorsiflexionKneeBent: 20, dorsiflexionKneeStraight: 10, plantarflexion: 55, inversion: 35, eversion: 20,
      abduction: 25, adduction: 25, kneeSpanDeg: 45 },
    warn: { dorsiflexionKneeStraight: 10 },
  },
  neck: {
    hard: { flexion: 50, extension: 60, rotation: 80, lateralFlexion: 45 },
    warn: { extension: 15, rotation: 45, lateralFlexion: 20 },
  },
});

// ---------------------------------------------------------------- building the frames from the rig
// Anatomical directions in the rig's bind space (glTF +Y up, +Z forward, character left = +X; DATA-DERIVED
// in the skeleton study). The trunk keeps these directions in every bone frame it carries.
const UP = [0, 1, 0], FRONT = [0, 0, 1], LEFT = [1, 0, 0];
// The hanging-limb frame (x = down, y = front, z = −X) and the shoulder's anterior frame (x = front, y = up,
// z = −X). Both share z, so the hanging-arm limit chart is the anterior chart turned by 90° about z.
const HANGING = frameXY(scale(UP, -1), FRONT), ANTERIOR = frameXY(FRONT, UP);
const ANTERIOR_TO_HANGING = qMul(qConj(HANGING), ANTERIOR);

// Canonical bone names: three.js's GLTFLoader sanitises node names ("upperarm01.L" becomes "upperarm01L").
export const canonical = (name) => String(name).replace(/\s/g, '_').replace(/[[\]./:]/g, '');

export function createJointModel({ bones, boneInverses, restWorld = null, limits = JOINT_LIMITS }) {
  // bones: the skeleton's bones; boneInverses: the matching inverse bind matrices (Matrix4-like with
  // .elements). restWorld(bone) may override how the current world transform is read (tests).
  const byName = new Map(bones.map((bone, index) => [canonical(bone.name), { bone, index }]));
  const need = (name) => {
    const found = byName.get(canonical(name));
    if (!found) throw new Error(`JointModel: missing bone ${name}`);
    return found;
  };
  const bindOf = (name) => rigidFromElements(invertAffine(boneInverses[need(name).index].elements));
  const worldOf = (name) => {
    const { bone } = need(name);
    return restWorld ? restWorld(bone) : rigidFromElements(bone.matrixWorld.elements);
  };
  const hingeBind = (a, b, c) => {
    const pa = bindOf(a).position, pb = bindOf(b).position, pc = bindOf(c).position;
    const upper = unit(sub(pb, pa)), lower = unit(sub(pc, pb));
    return { upper, lower, hinge: unit(cross(upper, lower)) };
  };
  // A bone-local frame from a frame given in bind world: f = q(bind)⁻¹ · J.
  const localFrame = (boneName, worldFrame) => qMul(qConj(bindOf(boneName).quaternion), worldFrame);

  const joints = new Map();
  const add = (def) => joints.set(def.id, def);

  for (const [side, s] of [['L', 1], ['R', -1]]) {
    const sideName = s > 0 ? 'left' : 'right';
    // Shoulder and hip. Limit chart = the hanging limb (inferior x), y = anterior, so +sz is flexion and +sy
    // points to +X (abduction on the left, adduction on the right). The child frame's z is the elbow / knee
    // hinge axis, so a zero twist means the distal hinge flexes in the sagittal plane. The hip's swing-twist
    // split uses that chart too (its 180° swing is 50° beyond the flexion stop); the shoulder's uses the
    // anterior frame (header), with toLimit turning its directions into the hanging-arm chart.
    for (const kind of ['shoulder', 'hip']) {
      const arm = kind === 'shoulder';
      const parent = arm ? `shoulder01.${side}` : `pelvis.${side}`;
      const child = arm ? `upperarm01.${side}` : `upperleg01.${side}`;
      const mid = arm ? `lowerarm01.${side}` : `lowerleg01.${side}`;
      const tip = arm ? `wrist.${side}` : `foot.${side}`;
      const { upper, hinge } = hingeBind(child, mid, tip);
      const zHint = dot(hinge, scale(LEFT, -1)) >= 0 ? hinge : scale(hinge, -1);
      add({ id: `${kind}.${side}`, kind, side: sideName, sign: s, parent, child, mid, tip,
        fParent: localFrame(parent, arm ? ANTERIOR : HANGING), fChild: localFrame(child, frameXZ(upper, zHint)),
        toLimit: arm ? ANTERIOR_TO_HANGING : null });
    }
    // Elbow and knee: hinges about the bind-pose flexion axis (normal of the bind plane of the three joints,
    // positive = flexion). The child frame is calibrated on the authored rest so that the rest is a pure
    // hinge angle: the forearm's 11.4° (knee 1.4°) rest offset from the hinge plane is kept, not corrected.
    for (const kind of ['elbow', 'knee']) {
      const arm = kind === 'elbow';
      const top = arm ? `upperarm01.${side}` : `upperleg01.${side}`;
      const parent = arm ? `upperarm02.${side}` : `upperleg02.${side}`;
      const child = arm ? `lowerarm01.${side}` : `lowerleg01.${side}`;
      const tip = arm ? `wrist.${side}` : `foot.${side}`;
      const { upper, hinge } = hingeBind(top, child, tip);
      add({ id: `${kind}.${side}`, kind, side: sideName, sign: s, parent, child, top, tip,
        fParent: localFrame(parent, frameXZ(upper, hinge)), fChild: null, hingeBind: hinge, toLimit: null });
    }
    // Wrist with forearm rotation: parent lowerarm01, child wrist. x = forearm axis, y = medial (the elbow
    // hinge axis turned to the medial side): at zero twist the palm faces the body (mid-position), +sz is
    // palmar flexion. The hand frame's y is the palm side, found from the rig's own finger-curl axis.
    {
      const parent = `lowerarm01.${side}`, child = `wrist.${side}`;
      const { lower, hinge } = hingeBind(`upperarm01.${side}`, parent, child);
      const medialHinge = scale(hinge, s);
      const hand = unit(sub(bindOf(`finger3-1.${side}`).position, bindOf(child).position));
      // Curling finger3-1 about its local x moves finger3-2 toward the palm (setHandCurl in NabdRuntime.js).
      const f1 = bindOf(`finger3-1.${side}`), f2 = bindOf(`finger3-2.${side}`);
      const palm = cross(qRotate(f1.quaternion, [1, 0, 0]), sub(f2.position, f1.position));
      add({ id: `wrist.${side}`, kind: 'wrist', side: sideName, sign: s, parent, child, toLimit: null,
        fParent: localFrame(parent, frameXY(lower, medialHinge)), fChild: localFrame(child, frameXY(hand, palm)) });
    }
    // Ankle: parent lowerleg02, child foot. x = anterior across the shank, y = up the shank (dorsiflexion);
    // the foot frame: x = the sole's direction (heel to second toe, level in the standing bind), y = up.
    {
      const parent = `lowerleg02.${side}`, child = `foot.${side}`;
      const shank = unit(sub(bindOf(child).position, bindOf(`lowerleg01.${side}`).position));
      const toe = sub(bindOf(`toe2-1.${side}`).position, bindOf(child).position);
      const sole = [toe[0], 0, toe[2]];
      add({ id: `ankle.${side}`, kind: 'ankle', side: sideName, sign: s, parent, child, toLimit: null,
        fParent: localFrame(parent, frameXY(sub(FRONT, scale(shank, dot(FRONT, shank))), scale(shank, -1))),
        fChild: localFrame(child, frameXY(sole, UP)) });
    }
  }
  // Neck and head together (neck01, neck02, neck03 and head share the turn): the head relative to spine01.
  // x = up, y = anterior: +sz flexion, +sy toward the patient's right, +t turns the face to the left.
  add({ id: 'neck', kind: 'neck', side: null, sign: 1, parent: 'spine01', child: 'head', toLimit: null,
    fParent: localFrame('spine01', frameXY(UP, FRONT)), fChild: localFrame('head', frameXY(UP, FRONT)) });

  // Rest calibration of the hinges on the current (authored) pose.
  const restOffsetDeg = {};
  for (const joint of joints.values()) {
    if (joint.fChild) continue;
    const P = worldOf(joint.parent), C = worldOf(joint.child), T = worldOf(joint.tip);
    const frame = qMul(P.quaternion, joint.fParent);
    const lower = unit(sub(T.position, C.position));
    const ex = qRotate(frame, [1, 0, 0]), ey = qRotate(frame, [0, 1, 0]), ez = qRotate(frame, [0, 0, 1]);
    const theta = Math.atan2(dot(lower, ey), dot(lower, ex));
    restOffsetDeg[joint.id] = Math.asin(Math.max(-1, Math.min(1, dot(lower, ez)))) / DEG;
    joint.restFlexionDeg = theta / DEG;
    joint.fChild = qMul(qConj(C.quaternion), qMul(frame, qFromAxisAngle([0, 0, 1], theta)));
  }

  // ---- the shoulder's swing-dependent rotation neutral
  // δ(d): the twist, read in the hanging-arm chart, of the anterior chart's neutral at the arm direction d
  // (joint coordinates). Adding it to the anterior twist gives the hanging-arm twist (t_hang = t_ant + δ).
  const hangingOffset = (joint, dJ) => {
    const s = swingOfDir(dJ);
    return swingTwist(qMul(joint.toLimit, composeSwingTwist(s.sy, s.sz, 0))).t;
  };
  for (const joint of joints.values()) {
    if (joint.kind !== 'shoulder') continue;
    // The overhead neutral: halfway between the flexion path (δ = 0 along it) and the abduction path (δ grows
    // with elevation to ±180° overhead), i.e. δ at the coronal abduction of 90°.
    const lateral = qRotate(qConj(joint.toLimit), dirOfSwing(joint.sign * Math.PI / 2, 0));
    joint.overheadOffset = hangingOffset(joint, lateral);
    joint.neutralBlend = limits.shoulder.hard.neutralBlendDeg.map((x) => x * DEG);
  }
  // Rotation-neutral offset at the arm direction dJ (0 for every joint but the shoulders).
  function neutralOffset(joint, dJ) {
    if (joint.kind !== 'shoulder') return 0;
    const dL = qRotate(joint.toLimit, dJ);
    const elevation = Math.atan2(Math.hypot(dL[1], dL[2]), dL[0]);
    const [e0, e1] = joint.neutralBlend;
    const u = Math.min(1, Math.max(0, (elevation - e0) / (e1 - e0)));
    const w = 1 - u * u * (3 - 2 * u);
    if (w === 0) return joint.overheadOffset;
    return joint.overheadOffset + wrapAngle(hangingOffset(joint, dJ) - joint.overheadOffset) * w;
  }

  // ---- limits per joint and side, in the frame's coordinates (radians)
  function kneeFlexion(side) {
    return Math.max(0, swingTwist(relative(`knee.${side === 'left' ? 'L' : 'R'}`)).sz / DEG);
  }
  function limitsOf(joint, context = {}) {
    const L = limits[joint.kind].hard, s = joint.sign;
    const lateralPos = (lat, med) => (s > 0 ? { yPos: lat, yNeg: med } : { yPos: med, yNeg: lat });
    switch (joint.kind) {
      case 'shoulder': {
        // Axes in the hanging-arm chart. IR = sign·ψ (derivation: +t about the hanging axis turns the front
        // toward −X), ψ being the twist from the swing-dependent neutral.
        const { yPos, yNeg } = lateralPos(L.abduction, L.adduction);
        const ir = L.internalRotation, er = L.externalRotation;
        return { axes: { yPos: yPos * DEG, yNeg: yNeg * DEG, zPos: L.flexion * DEG, zNeg: L.extension * DEG },
          tMin: (s > 0 ? -er : -ir) * DEG, tMax: (s > 0 ? ir : er) * DEG };
      }
      case 'hip': {
        const { yPos, yNeg } = lateralPos(L.abduction, L.adduction);
        const knee = Math.min(1, Math.max(0, (context.kneeFlexionDeg ?? 0) / L.kneeSpanDeg));
        const flexion = L.flexionKneeStraight + (L.flexionKneeBent - L.flexionKneeStraight) * knee;
        const ir = L.internalRotation, er = L.externalRotation;
        return { axes: { yPos: yPos * DEG, yNeg: yNeg * DEG, zPos: flexion * DEG, zNeg: L.extension * DEG },
          tMin: (s > 0 ? -er : -ir) * DEG, tMax: (s > 0 ? ir : er) * DEG, flexionDeg: flexion };
      }
      case 'elbow': case 'knee':
        return { axes: { yPos: L.offAxis * DEG, yNeg: L.offAxis * DEG, zPos: L.flexion * DEG, zNeg: L.hyperextension * DEG },
          tMin: -L.twist * DEG, tMax: L.twist * DEG };
      case 'wrist': {
        // Radial deviation = sign·sy, pronation = sign·t (derivations in the frame comments above).
        const { yPos, yNeg } = s > 0 ? { yPos: L.radialDeviation, yNeg: L.ulnarDeviation } : { yPos: L.ulnarDeviation, yNeg: L.radialDeviation };
        return { axes: { yPos: yPos * DEG, yNeg: yNeg * DEG, zPos: L.flexion * DEG, zNeg: L.extension * DEG },
          tMin: (s > 0 ? -L.supination : -L.pronation) * DEG, tMax: (s > 0 ? L.pronation : L.supination) * DEG };
      }
      case 'ankle': {
        const knee = Math.min(1, Math.max(0, (context.kneeFlexionDeg ?? 0) / L.kneeSpanDeg));
        const dorsi = L.dorsiflexionKneeStraight + (L.dorsiflexionKneeBent - L.dorsiflexionKneeStraight) * knee;
        const { yPos, yNeg } = lateralPos(L.abduction, L.adduction);
        // Eversion = sign·t.
        return { axes: { yPos: yPos * DEG, yNeg: yNeg * DEG, zPos: dorsi * DEG, zNeg: L.plantarflexion * DEG },
          tMin: (s > 0 ? -L.inversion : -L.eversion) * DEG, tMax: (s > 0 ? L.eversion : L.inversion) * DEG, dorsiflexionDeg: dorsi };
      }
      default: // neck
        return { axes: { yPos: L.lateralFlexion * DEG, yNeg: L.lateralFlexion * DEG, zPos: L.flexion * DEG, zNeg: L.extension * DEG },
          tMin: -L.rotation * DEG, tMax: L.rotation * DEG };
    }
  }
  function contextOf(joint) {
    const context = {};
    if (joint.kind === 'hip' || joint.kind === 'ankle') context.kneeFlexionDeg = kneeFlexion(joint.side);
    return context;
  }

  // ---- reading and limiting
  function relative(id) {
    const joint = joints.get(id);
    const P = worldOf(joint.parent).quaternion, C = worldOf(joint.child).quaternion;
    return qMul(qConj(qMul(P, joint.fParent)), qMul(C, joint.fChild));
  }
  // The child axis in joint coordinates and in the limit chart.
  const toLimit = (joint, dJ) => (joint.toLimit ? qRotate(joint.toLimit, dJ) : dJ);
  const fromLimit = (joint, dL) => (joint.toLimit ? qRotate(qConj(joint.toLimit), dL) : dL);
  // The twist from the rotation neutral, ψ, of a rotation whose child axis is dJ.
  const twistFromNeutral = (joint, q, dJ) => wrapAngle(swingTwist(q).t + neutralOffset(joint, dJ));
  // Swing first (the shortest rotation carrying the child axis to the nearest allowed direction), then the
  // twist about the child's own axis at that direction. Shared by clamp() and classify().
  function limit(joint, qRel, lim) {
    const dJ = qRotate(qRel, X_AXIS);
    const swing = projectDirection(toLimit(joint, dJ), lim.axes);
    let q1 = qRel, d1 = dJ;
    if (!swing.inside) {
      d1 = fromLimit(joint, swing.d);
      q1 = qNormalize(qMul(shortestArc(unit(dJ), unit(d1)), qRel));
    }
    const psi = twistFromNeutral(joint, q1, d1);
    const twist = clampTwist(psi, lim.tMin, lim.tMax);
    const delta = twist.t - psi;
    const q = twist.excess > 0 ? qMul(q1, [Math.sin(delta / 2), 0, 0, Math.cos(delta / 2)]) : q1;
    // twistAt: which twist bound holds the output (−1 the lower, +1 the upper, 0 none).
    const twistAt = twist.excess > 0 ? (twist.t === lim.tMax ? 1 : -1) : 0;
    return { q, changed: !swing.inside || twist.excess > 0, swingExcess: swing.angle, twistExcess: twist.excess, psi, twistAt };
  }
  function clamp(id, qRel, context = null) {
    const joint = joints.get(id);
    const lim = limitsOf(joint, context ?? contextOf(joint));
    const r = limit(joint, qRel, lim);
    return { q: r.changed ? r.q : qRel.slice(), changed: r.changed, swingExcessDeg: r.swingExcess / DEG, twistExcessDeg: r.twistExcess / DEG,
      twistAt: r.twistAt };
  }
  // Anatomical angles in degrees (signs: flexion, abduction, internal rotation, radial deviation, pronation,
  // dorsiflexion, eversion, lateral flexion to the right and rotation to the left are positive).
  function angles(id, qRel = relative(id)) {
    const joint = joints.get(id), s = joint.sign;
    const st = swingTwist(qRel);
    const out = { swingY: st.sy / DEG, swingZ: st.sz / DEG, twist: st.t / DEG };
    switch (joint.kind) {
      case 'shoulder': case 'hip': {
        // Child axis in the limit chart: x = down, y = front, z = −X.
        const dJ = qRotate(qRel, X_AXIS), d = toLimit(joint, dJ);
        out.elevation = Math.atan2(Math.hypot(d[1], d[2]), d[0]) / DEG;
        out.flexion = Math.atan2(d[1], d[0]) / DEG;
        out.abduction = Math.atan2(-s * d[2], d[0]) / DEG;
        out.internalRotation = s * twistFromNeutral(joint, qRel, dJ) / DEG;
        if (joint.toLimit) { const l = swingOfDir(d); out.limitSwingY = l.sy / DEG; out.limitSwingZ = l.sz / DEG; }
        break;
      }
      case 'elbow': case 'knee':
        out.flexion = out.swingZ; out.offAxis = out.swingY; break;
      case 'wrist':
        out.flexion = out.swingZ; out.radialDeviation = s * out.swingY; out.pronation = s * out.twist; break;
      case 'ankle':
        out.dorsiflexion = out.swingZ; out.abduction = s * out.swingY; out.eversion = s * out.twist; break;
      default:
        out.flexion = out.swingZ; out.lateralFlexionRight = out.swingY; out.rotationLeft = out.twist;
    }
    return out;
  }
  function classify(id, qRel = relative(id)) {
    const joint = joints.get(id);
    const context = contextOf(joint);
    const lim = limitsOf(joint, context);
    const a = angles(id, qRel);
    const hard = [];
    const r = limit(joint, qRel, lim);
    if (r.swingExcess > 0) hard.push({ motion: 'swing', excessDeg: r.swingExcess / DEG });
    if (r.twistExcess > 0) hard.push({ motion: 'twist', excessDeg: r.twistExcess / DEG, rangeDeg: [lim.tMin / DEG, lim.tMax / DEG] });
    const W = limits[joint.kind].warn, warn = [];
    const flag = (motion, value, threshold) => {
      if (value > threshold + WARN_DEADBAND_DEG) warn.push({ motion, valueDeg: value, thresholdDeg: threshold });
    };
    switch (joint.kind) {
      case 'shoulder':
        flag('flexion', a.flexion, W.flexion); flag('extension', -a.flexion, W.extension); flag('abduction', a.abduction, W.abduction);
        if (a.abduction >= W.abductedFrom) flag('externalRotation', -a.internalRotation, W.externalRotationWhenAbducted);
        break;
      case 'hip': {
        const knee = Math.min(1, Math.max(0, context.kneeFlexionDeg / limits.hip.hard.kneeSpanDeg));
        flag('flexion', a.flexion, W.flexionKneeStraight + (W.flexionKneeBent - W.flexionKneeStraight) * knee);
        flag('extension', -a.flexion, W.extension); flag('abduction', a.abduction, W.abduction);
        if (a.flexion >= W.flexedFrom) flag('externalRotation', -a.internalRotation, W.externalRotationWithFlexion);
        break;
      }
      case 'elbow': case 'knee':
        flag('flexion', a.flexion, W.flexion); flag('hyperextension', -a.flexion, W.hyperextension); break;
      case 'wrist':
        flag('flexion', a.flexion, W.flexion); flag('extension', -a.flexion, W.extension); flag('pronation', a.pronation, W.pronation); break;
      case 'ankle':
        if ((context.kneeFlexionDeg ?? 0) < 5) flag('dorsiflexion', a.dorsiflexion, W.dorsiflexionKneeStraight); break;
      default:
        flag('extension', -a.flexion, W.extension); flag('rotation', Math.abs(a.rotationLeft), W.rotation);
        flag('lateralFlexion', Math.abs(a.lateralFlexionRight), W.lateralFlexion);
    }
    return { id, angles: a, warn, hard, limits: { ...Object.fromEntries(Object.entries(lim.axes).map(([k, v]) => [k, v / DEG])),
      twistMin: lim.tMin / DEG, twistMax: lim.tMax / DEG } };
  }
  function all() {
    const out = {};
    for (const id of joints.keys()) out[id] = classify(id);
    return out;
  }
  return {
    joints, ids: [...joints.keys()], relative, clamp, classify, angles, all, limitsOf: (id, context) => limitsOf(joints.get(id), context ?? {}),
    // The limit chart of a joint: q in joint coordinates → the same rotation in the limit chart, and back.
    toLimitChart: (id, q) => (joints.get(id).toLimit ? qMul(joints.get(id).toLimit, q) : q.slice()),
    fromLimitChart: (id, q) => (joints.get(id).toLimit ? qMul(qConj(joints.get(id).toLimit), q) : q.slice()),
    neutralOffsetDeg: (id, dJ) => neutralOffset(joints.get(id), dJ) / DEG,
    restOffsetDeg, restFlexionDeg: Object.fromEntries([...joints.values()].filter((j) => j.restFlexionDeg !== undefined).map((j) => [j.id, j.restFlexionDeg])),
  };
}
