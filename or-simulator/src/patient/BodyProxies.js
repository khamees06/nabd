// Body proxies and contact samples for grab-anywhere (12_GRAB_ANYWHERE_DESIGN.md §2.2, §4.6, §5.2).
//
// Fitted once at load from the skinned rest positions and the skin weights (design B's method):
//  * one proxy per segment, rigid with the segment's bone: an axis (PCA of the segment's vertices for the
//    limbs, the body's long axis for the trunk, neck and head) cut into slices; each slice is an ellipse fitted
//    to the p2–p98 extent of its cross-section (§2.2 "fitted to the p95 extent") and the slices are
//    interpolated between their centres. The INNER proxy (self-collision) shrinks each slice's ellipse to a low
//    quantile of the normalised radius, so that at least 95 % of the segment's vertices lie outside it; the
//    OUTER proxy (pick fallback) uses the 85th percentile. Why not a round capsule at 0.9 × the median radius
//    (§2.2): on patient.glb that leaves only 57–71 % of the dominant vertices outside (the cross-sections are
//    elliptic, hands and feet flat), and an elliptic slice at 0.9 × the median only 78–88 %, while the gate is
//    ≥ 95 % (evidence/grab-anywhere/G1).
//  * contact samples: 24–40 per segment by farthest-point sampling over the vertices whose top segment weight
//    is at least 0.8, seeded with (so always including) the segment's lowest rest vertex; each is stored as its
//    vertex index plus its position in the frame of the vertex's heaviest bone.
//  * rest-overlap allowances: a sample that already lies inside a non-adjacent proxy at rest may stay that
//    deep plus 2 mm (§4.6 step 2).
//
// Plain arithmetic, no three.js import. Bone frames come from the caller's frameOf(boneIndex) as
// {position: [x, y, z], quaternion: [x, y, z, w]} (world, rigid).

import { SEGMENTS, areAdjacent } from './BodySegments.js';

export const INNER_QUANTILE = 0.04;
export const OUTER_QUANTILE = 0.85;
export const SAMPLE_WEIGHT = 0.8;
export const MIN_DOMINANT = 300;
export const ALLOWANCE_MARGIN = 0.002;
const MIN_POINTS = 24;
const FPS_POOL = 3000;
const TRUNK_BONE = { head: 'head', neck: 'neck01', chest: 'spine01', abdomen: 'spine03', pelvis: 'spine05' };

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
function rotate(q, v) {
  const [qx, qy, qz, qw] = q, [vx, vy, vz] = v;
  const tx = 2 * (qy * vz - qz * vy), ty = 2 * (qz * vx - qx * vz), tz = 2 * (qx * vy - qy * vx);
  return [vx + qw * tx + qy * tz - qz * ty, vy + qw * ty + qz * tx - qx * tz, vz + qw * tz + qx * ty - qy * tx];
}
const conj = (q) => [-q[0], -q[1], -q[2], q[3]];
export const toLocal = (frame, p) => rotate(conj(frame.quaternion), [p[0] - frame.position[0], p[1] - frame.position[1], p[2] - frame.position[2]]);
export const toWorld = (frame, p) => { const r = rotate(frame.quaternion, p); return [r[0] + frame.position[0], r[1] + frame.position[1], r[2] + frame.position[2]]; };

// Several quantiles of one sample with a single sort.
function quantiles(values, qs) {
  if (!values.length) return qs.map(() => NaN);
  const a = Float64Array.from(values).sort();
  return qs.map((q) => a[Math.min(a.length - 1, Math.max(0, Math.floor(q * (a.length - 1))))]);
}
const quantile = (values, q) => quantiles(values, [q])[0];
// Largest-variance direction of a symmetric 3×3 (power iteration from a fixed start: deterministic).
function principal(C) {
  let e = unit([1, 0.37, 0.21]);
  for (let it = 0; it < 200; it++) {
    const y = [0, 1, 2].map((a) => C[a][0] * e[0] + C[a][1] * e[1] + C[a][2] * e[2]);
    const n = Math.hypot(y[0], y[1], y[2]);
    if (n < 1e-18) break;
    e = [y[0] / n, y[1] / n, y[2] / n];
  }
  return e;
}
// Signed distance to an axis-aligned ellipse (semi-axes a, b) in 2D: the gradient-normalised approximation,
// exact on the curve's axes and accurate near the curve, which is where contacts are tested.
export function ellipseSd(u, v, a, b) {
  const k0 = Math.hypot(u / a, v / b);
  const k1 = Math.hypot(u / (a * a), v / (b * b));
  if (k1 < 1e-12) return -Math.min(a, b);
  return k0 * (k0 - 1) / k1;
}

export function fitBodyProxies({ segments, skin, restPositions, frameOf, restFrameOf = frameOf, boneIndexOf, superior, slices = 10,
  innerQuantile = INNER_QUANTILE, outerQuantile = OUTER_QUANTILE, now = () => Date.now() }) {
  // segments: createBodySegments(...); skin: the clinical skin; restPositions: Float64Array, world xyz per vertex
  // at the authored rest; restFrameOf(boneIndex): the bone frames at that same rest (default: the current
  // ones, when the fit runs on the rest pose); boneIndexOf(name) → skeleton index; superior: the patient's
  // head direction (world, at rest).
  const started = now();
  const record = segments.recordOf(skin);
  const { skinIndex, skinWeight } = skin.geometry.attributes;
  const count = restPositions.length / 3;
  const R = restPositions;

  // One pass: members of each segment, its dominant members, its lowest vertex, each vertex's heaviest bone.
  const members = SEGMENTS.map(() => []), dominantOf = SEGMENTS.map(() => []), lowest = new Int32Array(SEGMENTS.length).fill(-1);
  const heaviest = new Int16Array(count);
  // Raw attribute arrays (a normalised weight array only rescales, so the heaviest index is the same).
  const wa = skinWeight.array, ia = skinIndex.array, ws = skinWeight.itemSize, is = skinIndex.itemSize;
  for (let i = 0; i < count; i++) {
    let best = 0, w = -1;
    for (let r = 0; r < 4; r++) { const x = wa[i * ws + r]; if (x > w) { w = x; best = ia[i * is + r]; } }
    heaviest[i] = best;
    const s = record.vSeg[i];
    if (s < 0) continue;
    members[s].push(i);
    if (record.vW1[i] >= SAMPLE_WEIGHT) dominantOf[s].push(i);
    if (lowest[s] < 0 || R[i * 3 + 1] < R[lowest[s] * 3 + 1]) lowest[s] = i;
  }
  const restFrames = new Map();
  const restFrame = (bone) => { if (!restFrames.has(bone)) restFrames.set(bone, restFrameOf(bone)); return restFrames.get(bone); };

  const proxies = [], info = [];
  for (const seg of SEGMENTS) {
    const all = members[seg.index], dominant = dominantOf[seg.index];
    // The neck, abdomen and pelvis have no pure vertices (each is blended with a neighbour): fewer than
    // MIN_DOMINANT dominant vertices → fit and sample on all the segment's vertices.
    const fitOn = dominant.length >= MIN_DOMINANT ? dominant : all;
    const n = fitOn.length;
    // A rig without this segment's skin (test rigs, a partial body) gets no proxy and no samples.
    if (n < MIN_POINTS) { info.push({ id: seg.id, vertices: all.length, dominant: dominant.length, fittedOn: null, fitOn, lowest: lowest[seg.index], samples: [], proxy: -1 }); continue; }
    const bone = boneIndexOf(seg.bone ?? TRUNK_BONE[seg.id]);
    const frame = restFrame(bone);
    const c = [0, 0, 0];
    for (const i of fitOn) { c[0] += R[i * 3] / n; c[1] += R[i * 3 + 1] / n; c[2] += R[i * 3 + 2] / n; }
    let cxx = 0, cxy = 0, cxz = 0, cyy = 0, cyz = 0, czz = 0;
    for (const i of fitOn) {
      const x = R[i * 3] - c[0], y = R[i * 3 + 1] - c[1], z = R[i * 3 + 2] - c[2];
      cxx += x * x; cxy += x * y; cxz += x * z; cyy += y * y; cyz += y * z; czz += z * z;
    }
    const C = [[cxx / n, cxy / n, cxz / n], [cxy / n, cyy / n, cyz / n], [cxz / n, cyz / n, czz / n]];
    let e0;
    if (seg.kind === 'limb') {
      e0 = principal(C);
      const toward = [0, 1, 2].map((k) => restFrame(boneIndexOf(seg.distal)).position[k] - frame.position[k]);
      if (dot(e0, toward) < 0) e0 = [-e0[0], -e0[1], -e0[2]];
    } else e0 = unit(superior);
    // Cross-section axes: larger variance across the axis first (2×2 covariance on the plane normal to e0).
    const b1 = unit(cross(e0, Math.abs(e0[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])), b2 = cross(e0, b1);
    const Cb = (x, y) => dot(x, [0, 1, 2].map((a) => dot(C[a], y)));
    const angle = 0.5 * Math.atan2(2 * Cb(b1, b2), Cb(b1, b1) - Cb(b2, b2));
    const e1 = unit([0, 1, 2].map((k) => b1[k] * Math.cos(angle) + b2[k] * Math.sin(angle)));
    const e2 = cross(e0, e1);
    const T = new Float64Array(n), U = new Float64Array(n), V = new Float64Array(n);
    for (let k = 0; k < n; k++) {
      const i = fitOn[k], x = R[i * 3] - c[0], y = R[i * 3 + 1] - c[1], z = R[i * 3 + 2] - c[2];
      T[k] = x * e0[0] + y * e0[1] + z * e0[2]; U[k] = x * e1[0] + y * e1[1] + z * e1[2]; V[k] = x * e2[0] + y * e2[1] + z * e2[2];
    }
    const [lo, hi] = quantiles(T, [0.02, 0.98]);
    const K = slices;
    const buckets = Array.from({ length: K }, () => []);
    for (let k = 0; k < n; k++) buckets[Math.min(K - 1, Math.max(0, Math.floor((T[k] - lo) / (hi - lo) * K)))].push(k);
    let fitted = buckets.map((b, k) => {
      if (b.length < 8) return null;
      const us = b.map((j) => U[j]), vs = b.map((j) => V[j]);
      const [u0, u1] = quantiles(us, [0.02, 0.98]), [v0, v1] = quantiles(vs, [0.02, 0.98]);
      const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, A = Math.max(1e-3, (u1 - u0) / 2), B = Math.max(1e-3, (v1 - v0) / 2);
      const rho = b.map((j) => Math.hypot((U[j] - cu) / A, (V[j] - cv) / B));
      const [inner, outer] = quantiles(rho, [innerQuantile, outerQuantile]);
      return { t: lo + (k + 0.5) * (hi - lo) / K, cu, cv, A, B, inner, outer };
    });
    // A slice with too few points takes the ellipse of the nearest fitted slice.
    fitted = fitted.map((f, k) => {
      if (f) return f;
      let near = -1;
      fitted.forEach((g, j) => { if (g && (near < 0 || Math.abs(j - k) < Math.abs(near - k))) near = j; });
      if (near < 0) throw new Error(`BodyProxies: segment ${seg.id} has too few vertices`);
      return { ...fitted[near], t: lo + (k + 0.5) * (hi - lo) / K };
    });
    // Stored in the bone's rest frame, so the proxy moves rigidly with the bone.
    const iq = conj(frame.quaternion);
    const proxyIndex = proxies.length;
    proxies.push({ id: seg.id, segment: seg.index, bone, lo, hi, slices: fitted,
      centre: toLocal(frame, c), e0: rotate(iq, e0), e1: rotate(iq, e1), e2: rotate(iq, e2) });

    // Farthest-point samples, seeded with the lowest rest vertex, over at most FPS_POOL candidates (an even
    // stride through the segment's vertices: 40 samples need far fewer than the head's 22,000 vertices).
    const want = Math.max(24, Math.min(40, Math.round(fitOn.length / 250)));
    const stride = Math.max(1, Math.ceil(n / FPS_POOL));
    const pool = stride === 1 ? fitOn : fitOn.filter((_, k) => k % stride === 0);
    const m = pool.length;
    const chosen = [];
    const dist = new Float64Array(m).fill(Infinity);
    const take = (vertex) => {
      chosen.push(vertex);
      const x = R[vertex * 3], y = R[vertex * 3 + 1], z = R[vertex * 3 + 2];
      for (let k = 0; k < m; k++) {
        const j = pool[k] * 3, d = (R[j] - x) ** 2 + (R[j + 1] - y) ** 2 + (R[j + 2] - z) ** 2;
        if (d < dist[k]) dist[k] = d;
      }
    };
    if (lowest[seg.index] >= 0) take(lowest[seg.index]);
    while (chosen.length < Math.min(want, m)) {
      let far = 0;
      for (let k = 1; k < m; k++) if (dist[k] > dist[far]) far = k;
      if (!(dist[far] > 0)) break;
      take(pool[far]);
    }
    info.push({ id: seg.id, vertices: all.length, dominant: dominant.length, fittedOn: fitOn === dominant ? 'dominant' : 'all',
      fitOn, lowest: lowest[seg.index], samples: chosen, proxy: proxyIndex });
  }

  const sampleList = info.flatMap((x) => x.samples.map((vertex) => ({ segment: SEGMENTS.findIndex((seg) => seg.id === x.id), vertex })));
  const samples = {
    count: sampleList.length,
    segment: Int8Array.from(sampleList, (x) => x.segment),
    vertex: Int32Array.from(sampleList, (x) => x.vertex),
    bone: Int16Array.from(sampleList, (x) => heaviest[x.vertex]),
    local: new Float64Array(sampleList.length * 3),
  };
  sampleList.forEach(({ vertex }, i) => samples.local.set(toLocal(restFrame(samples.bone[i]), [R[vertex * 3], R[vertex * 3 + 1], R[vertex * 3 + 2]]), i * 3));

  // ---- queries at the current pose. refresh() re-reads the bone frames; until then they are cached, so a
  // caller that moves bones calls refresh() first. Each proxy keeps world → (t, u, v) as a 3×3 plus origin.
  const xf = new Float64Array(proxies.length * 12);
  const frames = new Map();
  function loadTransforms(frameFor) {
    proxies.forEach((proxy, j) => {
      const f = frameFor(proxy.bone);
      const o = toWorld(f, proxy.centre);
      const a = rotate(f.quaternion, proxy.e0), b = rotate(f.quaternion, proxy.e1), d = rotate(f.quaternion, proxy.e2);
      xf.set([a[0], a[1], a[2], b[0], b[1], b[2], d[0], d[1], d[2], o[0], o[1], o[2]], j * 12);
    });
  }
  function refresh() {
    frames.clear();
    loadTransforms(frameOf);
  }
  const frameNow = (bone) => { if (!frames.has(bone)) frames.set(bone, frameOf(bone)); return frames.get(bone); };
  function sliceSd(proxy, t, u, v, layer) {
    const S = proxy.slices, K = S.length;
    const f = (Math.min(proxy.hi, Math.max(proxy.lo, t)) - proxy.lo) / (proxy.hi - proxy.lo) * K - 0.5;
    const k0 = Math.max(0, Math.min(K - 1, Math.floor(f))), k1 = Math.min(K - 1, k0 + 1), w = Math.min(1, Math.max(0, f - k0));
    const a = S[k0], b = S[k1];
    const k = layer === 'outer' ? a.outer + (b.outer - a.outer) * w : a.inner + (b.inner - a.inner) * w;
    const radial = ellipseSd(u - (a.cu + (b.cu - a.cu) * w), v - (a.cv + (b.cv - a.cv) * w), (a.A + (b.A - a.A) * w) * k, (a.B + (b.B - a.B) * w) * k);
    const axial = t < proxy.lo ? proxy.lo - t : t > proxy.hi ? t - proxy.hi : 0;
    if (axial === 0) return radial;
    return radial <= 0 ? axial : Math.hypot(radial, axial);
  }
  // Signed distance (m) from a world point to proxy j ('inner' or 'outer'); positive outside.
  function sd(j, p, layer = 'inner') {
    const o = j * 12, x = p[0] - xf[o + 9], y = p[1] - xf[o + 10], z = p[2] - xf[o + 11];
    return sliceSd(proxies[j], x * xf[o] + y * xf[o + 1] + z * xf[o + 2], x * xf[o + 3] + y * xf[o + 4] + z * xf[o + 5],
      x * xf[o + 6] + y * xf[o + 7] + z * xf[o + 8], layer);
  }
  function samplePosition(i) {
    return toWorld(frameNow(samples.bone[i]), [samples.local[i * 3], samples.local[i * 3 + 1], samples.local[i * 3 + 2]]);
  }

  // Rest-overlap allowances, measured with every proxy and sample placed at the rest pose.
  loadTransforms(restFrame);
  const allowances = new Map(), pairOverlap = {};
  for (let i = 0; i < samples.count; i++) {
    const own = SEGMENTS[samples.segment[i]].id;
    const p = toWorld(restFrame(samples.bone[i]), [samples.local[i * 3], samples.local[i * 3 + 1], samples.local[i * 3 + 2]]);
    proxies.forEach((proxy, j) => {
      if (areAdjacent(own, proxy.id)) return;
      const d = sd(j, p);
      if (d >= 0) return;
      allowances.set(i * 64 + j, -d + ALLOWANCE_MARGIN);
      const key = `${own}|${proxy.id}`;
      pairOverlap[key] = Math.max(pairOverlap[key] ?? 0, -d);
    });
  }
  refresh();
  // The fit readout (QA only) is computed on first request, against the proxies placed at the rest pose they
  // were fitted on (whatever the pose is now): the share of each segment's vertices outside its inner proxy
  // and the skin-to-proxy gap.
  let fit = null;
  function readout() {
    if (fit) return fit;
    const saved = new Float64Array(xf);
    loadTransforms(restFrame);
    const p = [0, 0, 0];
    fit = info.map((x) => {
      const proxy = proxies[x.proxy] ?? null;
      const gaps = new Float64Array(proxy ? x.fitOn.length : 0);
      let outside = 0;
      if (proxy) x.fitOn.forEach((i, k) => {
        p[0] = R[i * 3]; p[1] = R[i * 3 + 1]; p[2] = R[i * 3 + 2];
        gaps[k] = sd(x.proxy, p);
        if (gaps[k] >= 0) outside++;
      });
      const [p50, p95] = quantiles(gaps, [0.5, 0.95]);
      return { id: x.id, vertices: x.vertices, dominant: x.dominant, fittedOn: x.fittedOn,
        outsideInner: gaps.length ? outside / gaps.length : null, innerGapMm: { p50: p50 * 1000, p95: p95 * 1000 },
        samples: x.samples.length, lowestVertex: x.lowest, lowestIsSample: x.samples.includes(x.lowest),
        lowestRestY: x.lowest >= 0 ? R[x.lowest * 3 + 1] : null, lengthM: proxy ? proxy.hi - proxy.lo : null,
        innerSemiAxesMm: proxy ? proxy.slices.map((q) => [Math.round(q.A * q.inner * 1000), Math.round(q.B * q.inner * 1000)]) : null };
    });
    xf.set(saved);
    return fit;
  }
  const buildMs = now() - started;
  return {
    proxies, samples, sd, samplePosition, refresh, proxyOf: (segmentId) => proxies.findIndex((p) => p.id === segmentId),
    samplesOf: (segmentIndex) => { const out = []; for (let i = 0; i < samples.count; i++) if (samples.segment[i] === segmentIndex) out.push(i); return out; },
    allowance: (i, j) => allowances.get(i * 64 + j) ?? 0,
    summary: () => ({ buildMs, innerQuantile, outerQuantile, slices, samples: samples.count, allowances: allowances.size,
      restOverlapMm: Object.fromEntries(Object.entries(pairOverlap).map(([k, v]) => [k, Math.round(v * 10000) / 10])), segments: readout() }),
  };
}

// Re-skins every vertex (positionOf; three.js's own getVertexPosition in the app) and measures it against the
// supports and, per vertex segment, against every non-adjacent inner proxy (§5.2: penetration is measured on
// skin vertices, never on samples). Millimetres; a depth is positive inside. support*: SupportSurface's
// signed distance, which has no bottom face for resting surfaces (the way out of a pad is its top or a side),
// so a vertex sunk deeper than half a pad reads in full. belowTop*: the plain depth below the highest resting
// top over the vertex (the "sinking" reading; a vertex pressed into a pad's side far below its top counts
// that whole depth there). Against the inner proxies the depth is a lower bound: the proxies sit 3–25 mm
// inside the skin (G1 fit).
// G2: per segment also the lowest skin over the resting surface under it (lowestGapMm: skin height minus
// supportAt's top, negative when sunk; null when no vertex of the segment lies over a resting surface) and its
// lowest point (lowestY). allowanceMm: a declared compression per segment part (DN5: pelvis, calf and heel may
// press up to 5 mm into the pad); belowTopOverAllowance counts the vertices deeper than their part allows
// (overMm for every other part).
export function measureSkinPenetration({ count, positionOf, segmentOf, supports, proxies, overMm = 2, allowanceMm = null }) {
  proxies?.refresh();
  const depths = [], below = [];
  let supportMax = 0, over = 0, selfMax = 0, selfPair = null, deepest = null, belowMax = 0, belowOver = 0, downward = 0;
  // Vertices inside a pad whose nearest way out is a side face (pressed in from the side, or sunk near an edge).
  const sideExit = { vertices: 0, maxSideDepthMm: 0, maxBelowTopMm: 0, belowTopMinusSideOver10mm: 0 };
  const bySegment = {}, bySupport = {};
  const entry = (id) => bySegment[id] ?? (bySegment[id] = { minGapMm: Infinity, maxDepthMm: 0, selfMaxMm: 0,
    lowestGapMm: null, lowestGapSupport: null, lowestGapAt: null, lowestY: Infinity, lowestAt: null, belowTopMaxMm: 0, belowTopOver2mm: 0 });
  let overAllowance = 0;
  const p = [0, 0, 0];
  const others = SEGMENTS.map((seg) => (proxies ? proxies.proxies.map((proxy, j) => (areAdjacent(seg.id, proxy.id) ? -1 : j)).filter((j) => j >= 0) : []));
  for (let i = 0; i < count; i++) {
    positionOf(i, p);
    const s = segmentOf(i);
    if (supports) {
      // A plain { sd } (tests, other callers) is accepted: it has no box names.
      const near = supports.nearest ? supports.nearest(p) : { distance: supports.sd(p), box: null, kind: 'support' }, d = near.distance;
      const depth = Math.max(0, -d) * 1000;
      if (depth > 0) {
        depths.push(depth);
        const name = near.box?.name ?? 'floor';
        const b = bySupport[name] ?? (bySupport[name] = { kind: near.kind, vertices: 0, over2mm: 0, maxDepthMm: 0 });
        b.vertices++;
        if (depth > overMm) b.over2mm++;
        if (depth > b.maxDepthMm) b.maxDepthMm = depth;
        // A way out that points down would push the skin out through the bottom of the table (V2).
        if (near.normal && near.normal[1] < -0.5) downward++;
      }
      if (depth > supportMax) { supportMax = depth; deepest = { vertex: i, depthMm: depth, support: near.box?.name ?? 'floor', segment: s >= 0 ? SEGMENTS[s].id : null, y: p[1] }; }
      if (depth > overMm) over++;
      if (supports.depthBelowTop) {
        const b = supports.depthBelowTop(p).depth * 1000;
        if (b > 0) below.push(b);
        if (b > belowMax) belowMax = b;
        if (b > overMm) belowOver++;
        if (s >= 0) {
          const e = entry(SEGMENTS[s].id);
          if (b > e.belowTopMaxMm) e.belowTopMaxMm = b;
          if (b > overMm) e.belowTopOver2mm++;
          if (b > (allowanceMm?.[SEGMENTS[s].part] ?? overMm)) overAllowance++;
        } else if (b > overMm) overAllowance++;
        if (depth > 0 && near.column && near.normal[1] === 0) {
          sideExit.vertices++;
          sideExit.maxSideDepthMm = Math.max(sideExit.maxSideDepthMm, depth);
          sideExit.maxBelowTopMm = Math.max(sideExit.maxBelowTopMm, b);
          if (b - depth > 10) sideExit.belowTopMinusSideOver10mm++;
        }
      }
      if (s >= 0) {
        const e = entry(SEGMENTS[s].id);
        e.minGapMm = Math.min(e.minGapMm, d * 1000); e.maxDepthMm = Math.max(e.maxDepthMm, depth);
        if (p[1] < e.lowestY) { e.lowestY = p[1]; e.lowestAt = [p[0], p[1], p[2]]; }
        if (supports.supportAt) {
          const under = supports.supportAt(p[0], p[2]);
          if (under.kind !== 'floor') {
            const gap = (p[1] - under.y) * 1000;
            if (e.lowestGapMm === null || gap < e.lowestGapMm) { e.lowestGapMm = gap; e.lowestGapSupport = under.name; e.lowestGapAt = [p[0], p[1], p[2]]; }
          }
        }
      }
    }
    if (s >= 0) {
      for (const j of others[s]) {
        const d = proxies.sd(j, p);
        if (d >= 0) continue;
        const depth = -d * 1000;
        if (depth > selfMax) { selfMax = depth; selfPair = `${SEGMENTS[s].id}|${proxies.proxies[j].id}`; }
        const e = entry(SEGMENTS[s].id);
        if (depth > e.selfMaxMm) e.selfMaxMm = depth;
      }
    }
  }
  depths.sort((a, b) => a - b);
  below.sort((a, b) => a - b);
  return {
    vertices: count, supportMaxMm: supportMax, supportP95Mm: depths.length ? depths[Math.floor(0.95 * (depths.length - 1))] : 0,
    supportPenetrating: depths.length, over2mm: over, supportDeepest: deepest, supportDownward: downward, bySupport,
    supportMethod: 'signed distance with no bottom face for resting surfaces (way out through the top or a side); signed box distance for rails, trim, fittings and the deck',
    belowTopMaxMm: belowMax, belowTopP95Mm: below.length ? below[Math.floor(0.95 * (below.length - 1))] : 0, belowTopOver2mm: belowOver, belowTopVertices: below.length,
    allowanceMm: allowanceMm ?? {}, belowTopOverAllowance: overAllowance,
    sideExit,
    selfMaxMm: selfMax, selfWorstPair: selfPair, selfMethod: 'depth inside non-adjacent inner proxies (a lower bound: proxies sit 3-25 mm inside the skin)', bySegment,
  };
}
