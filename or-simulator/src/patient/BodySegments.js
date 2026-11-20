// Body segments for grab-anywhere (12_GRAB_ANYWHERE_DESIGN.md §2.2, §2.4, §4.1).
//
// Every bone of the patient rig belongs to one segment (head, neck, chest, abdomen, pelvis and, per side,
// upper arm, forearm, hand, thigh, shank, foot). From the skin weights each triangle gets, once at load, its
// top segment s1 with weight w1 and the second one s2 with w2 (weights below 0.02 are float residue and
// ignored), plus a region name for the QA coverage sweeps. A hit is turned into a segment by the same blend
// the skin uses: the corner weights mixed with the hit's barycentric coordinates.
//
// The shoulder band (clavicle, shoulder01) is not a segment of its own: its weight goes to the upper arm when
// the upper arm's weight is at least the chest's, otherwise to the chest (§2.4, "merged").
//
// Plain arithmetic, no three.js import; skins are read through their geometry attributes only.

export const canonicalBoneName = (name) => String(name).replace(/\s/g, '_').replace(/[[\]./:]/g, '');

export const SEGMENTS = Object.freeze([
  { id: 'head', kind: 'head', part: 'head', side: null },
  { id: 'neck', kind: 'neck', part: 'neck', side: null },
  { id: 'chest', kind: 'trunk', part: 'chest', side: null },
  { id: 'abdomen', kind: 'trunk', part: 'abdomen', side: null },
  { id: 'pelvis', kind: 'trunk', part: 'pelvis', side: null },
  ...['left', 'right'].flatMap((side) => {
    const s = side === 'left' ? 'L' : 'R';
    return [
      { id: `upperArm.${s}`, kind: 'limb', limb: 'arm', part: 'upperArm', side, bone: `upperarm01.${s}`, distal: `lowerarm01.${s}` },
      { id: `forearm.${s}`, kind: 'limb', limb: 'arm', part: 'forearm', side, bone: `lowerarm01.${s}`, distal: `wrist.${s}` },
      { id: `hand.${s}`, kind: 'limb', limb: 'arm', part: 'hand', side, bone: `wrist.${s}`, distal: `finger3-1.${s}` },
      { id: `thigh.${s}`, kind: 'limb', limb: 'leg', part: 'thigh', side, bone: `upperleg01.${s}`, distal: `lowerleg01.${s}` },
      { id: `shank.${s}`, kind: 'limb', limb: 'leg', part: 'shank', side, bone: `lowerleg01.${s}`, distal: `foot.${s}` },
      { id: `foot.${s}`, kind: 'limb', limb: 'leg', part: 'foot', side, bone: `foot.${s}`, distal: `toe2-1.${s}` },
    ];
  }),
].map((segment, index) => Object.freeze({ ...segment, index })));
export const SEGMENT_INDEX = Object.freeze(Object.fromEntries(SEGMENTS.map((s) => [s.id, s.index])));
const SHOULDER = { L: SEGMENTS.length, R: SEGMENTS.length + 1 };
const SLOTS = SEGMENTS.length + 2;

// Segments that share a joint. Self-collision only tests non-adjacent pairs (§4.6).
export const ADJACENT = Object.freeze([
  ['head', 'neck'], ['neck', 'chest'], ['chest', 'abdomen'], ['abdomen', 'pelvis'],
  ...['L', 'R'].flatMap((s) => [['chest', `upperArm.${s}`], [`upperArm.${s}`, `forearm.${s}`], [`forearm.${s}`, `hand.${s}`],
    ['pelvis', `thigh.${s}`], [`thigh.${s}`, `shank.${s}`], [`shank.${s}`, `foot.${s}`]]),
]);
const adjacency = new Set(ADJACENT.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
export const areAdjacent = (a, b) => a === b || adjacency.has(`${a}|${b}`);

// Joint zones between adjacent limb segments (top weight below 0.65): dual anchor in G3.
const ZONES = { 'upperArm|forearm': 'elbow', 'forearm|hand': 'wrist', 'thigh|shank': 'knee', 'shank|foot': 'ankle' };
export const REGIONS = Object.freeze(['forearm', 'hand', 'elbow', 'wrist', 'upperArm', 'shoulder', 'thigh', 'knee', 'shank',
  'ankle', 'foot', 'head', 'neck', 'chest', 'abdomen', 'flank', 'pelvis', 'privacy', 'eyes']);
const REGION_INDEX = Object.fromEntries(REGIONS.map((r, i) => [r, i]));
export const SINGLE_WEIGHT = 0.65;
export const NOISE_WEIGHT = 0.02;
// Trunk triangles whose bind normal is this lateral are "flank" (ASSUMED threshold for the QA regions).
const FLANK_NORMAL_X = 0.7;
// A triangle is in the shoulder region when the shoulder band holds this share of its weight (ASSUMED).
const SHOULDER_SHARE = 0.35;

export function segmentOfBoneName(name) {
  const n = canonicalBoneName(name);
  const side = /L$/.test(n) ? 'L' : /R$/.test(n) ? 'R' : null;
  const sided = (id) => (side ? SEGMENT_INDEX[`${id}.${side}`] : -1);
  if (/^(root|spine05|pelvis[LR])$/.test(n)) return SEGMENT_INDEX.pelvis;
  if (/^spine0[34]$/.test(n)) return SEGMENT_INDEX.abdomen;
  if (/^(spine0[12]|breast[LR])$/.test(n)) return SEGMENT_INDEX.chest;
  if (/^(clavicle|shoulder01)[LR]$/.test(n)) return SHOULDER[side];
  if (/^neck0\d$/.test(n)) return SEGMENT_INDEX.neck;
  if (/^(head|jaw|oris|tongue|levator|special|eye[LR]$|orbicularis|oculi|temporalis|risorius)/.test(n)) return SEGMENT_INDEX.head;
  if (/^upperarm0\d[LR]$/.test(n)) return sided('upperArm');
  if (/^lowerarm0\d[LR]$/.test(n)) return sided('forearm');
  if (/^(wrist|metacarpal\d|finger\d-\d)[LR]$/.test(n)) return sided('hand');
  if (/^upperleg0\d[LR]$/.test(n)) return sided('thigh');
  if (/^lowerleg0\d[LR]$/.test(n)) return sided('shank');
  if (/^(foot|toe\d-\d)[LR]$/.test(n)) return sided('foot');
  return -1;
}

// Adds the shoulder band's weight to the upper arm or the chest (§2.4) and returns the band's share.
function mergeShoulder(acc) {
  let band = 0;
  for (const s of ['L', 'R']) {
    const w = acc[SHOULDER[s]];
    if (!w) continue;
    band += w;
    const arm = SEGMENT_INDEX[`upperArm.${s}`];
    if (acc[arm] >= acc[SEGMENT_INDEX.chest]) acc[arm] += w; else acc[SEGMENT_INDEX.chest] += w;
    acc[SHOULDER[s]] = 0;
  }
  return band;
}
function topTwo(acc, out) {
  let total = 0, s1 = -1, s2 = -1;
  for (let s = 0; s < SEGMENTS.length; s++) {
    const w = acc[s];
    total += w;
    if (w <= 0) continue;
    if (s1 < 0 || w > acc[s1]) { s2 = s1; s1 = s; } else if (s2 < 0 || w > acc[s2]) s2 = s;
  }
  out.s1 = s1; out.s2 = s2; out.total = total;
  out.w1 = s1 >= 0 && total > 0 ? acc[s1] / total : 0;
  out.w2 = s2 >= 0 && total > 0 ? acc[s2] / total : 0;
  return out;
}
function zoneOf(s1, s2, w1) {
  if (s1 < 0 || w1 >= SINGLE_WEIGHT || s2 < 0) return null;
  const a = SEGMENTS[s1], b = SEGMENTS[s2];
  if (a.kind === 'limb' && b.kind === 'limb' && a.side === b.side) return ZONES[`${a.part}|${b.part}`] ?? ZONES[`${b.part}|${a.part}`] ?? null;
  return null;
}
// How a hit on (s1, s2, w1) is grabbed: a limb–limb joint zone gets a dual anchor; trunk–limb takes the
// limb; the neck is moved with the head; fingers and toes are part of the hand and foot already.
function partOf(s1, s2, w1) {
  if (s1 < 0) return { part: null, anchorMode: null };
  const a = SEGMENTS[s1], b = s2 >= 0 ? SEGMENTS[s2] : null;
  if (zoneOf(s1, s2, w1)) return { part: a.id, anchorMode: 'dual' };
  if (w1 < SINGLE_WEIGHT && a.kind === 'trunk' && b?.kind === 'limb') return { part: b.id, anchorMode: 'single' };
  if (a.kind === 'neck') return { part: 'head', anchorMode: 'single' };
  return { part: a.id, anchorMode: 'single' };
}

const isPrivacyMaterial = (material) => [material].flat().some((m) => m?.name?.includes('Local privacy'));
const isEyesMaterial = (material) => [material].flat().some((m) => /^Eyes\b/.test(m?.name ?? ''));

export function createBodySegments(skins, { isPrivacy = (skin) => isPrivacyMaterial(skin.material),
  isEyes = (skin) => isEyesMaterial(skin.material) } = {}) {
  const started = (typeof performance !== 'undefined' ? performance : Date).now();
  const bones = skins[0].skeleton.bones;
  const boneSeg = Int8Array.from(bones, (bone) => segmentOfBoneName(bone.name));
  const unassignedBones = bones.filter((_, i) => boneSeg[i] < 0).map((b) => b.name);
  const acc = new Float64Array(SLOTS);
  const top = { s1: -1, s2: -1, w1: 0, w2: 0, total: 0 };
  const records = new Map();
  const perSegment = SEGMENTS.map(() => ({ triangles: 0, vertices: 0 }));
  const summary = { triangles: 0, nonPrivacyTriangles: 0, assigned: 0, unassigned: 0, singleWeight: 0, privacyTriangles: 0 };

  // Each vertex's influences as (segment slot, weight) pairs, read once from the raw attribute arrays
  // (weights below the noise threshold dropped; a normalised integer weight array is rescaled).
  function influences(skinIndex, skinWeight, count) {
    const slot = new Int8Array(count * 4).fill(-1), weight = new Float32Array(count * 4);
    const ia = skinIndex.array, wa = skinWeight.array, is = skinIndex.itemSize, ws = skinWeight.itemSize;
    const k = !skinWeight.normalized ? 1 : wa instanceof Uint8Array ? 1 / 255 : wa instanceof Uint16Array ? 1 / 65535 : 1;
    for (let v = 0; v < count; v++) {
      for (let r = 0; r < 4; r++) {
        const w = wa[v * ws + r] * k;
        if (w < NOISE_WEIGHT) continue;
        const seg = boneSeg[ia[v * is + r]];
        if (seg >= 0) { slot[v * 4 + r] = seg; weight[v * 4 + r] = w; }
      }
    }
    return { slot, weight };
  }
  function addVertex(inf, v, k, into = acc) {
    for (let r = v * 4, e = r + 4; r < e; r++) if (inf.slot[r] >= 0) into[inf.slot[r]] += inf.weight[r] * k;
  }

  skins.forEach((skin, skinNumber) => {
    const geometry = skin.geometry;
    const { position, skinIndex, skinWeight } = geometry.attributes;
    const index = geometry.index;
    const triCount = index ? index.count / 3 : position.count / 3;
    const ix = index?.array;
    const corner = index ? (t, c) => ix[t * 3 + c] : (t, c) => t * 3 + c;
    const inf = influences(skinIndex, skinWeight, position.count);
    const privacy = isPrivacy(skin), eyes = isEyes(skin);
    const triSeg = new Int8Array(triCount), triSeg2 = new Int8Array(triCount), region = new Int8Array(triCount);
    const triW1 = new Float32Array(triCount), triW2 = new Float32Array(triCount);
    // Per-vertex top segment and weight (proxies and samples use them).
    const vSeg = new Int8Array(position.count), vW1 = new Float32Array(position.count);
    for (let v = 0; v < position.count; v++) {
      acc.fill(0);
      addVertex(inf, v, 1);
      mergeShoulder(acc);
      topTwo(acc, top);
      vSeg[v] = top.s1; vW1[v] = top.w1;
      if (top.s1 >= 0 && !privacy && !eyes) perSegment[top.s1].vertices++;
    }
    const p = [0, 0, 0].map(() => [0, 0, 0]);
    for (let t = 0; t < triCount; t++) {
      acc.fill(0);
      for (let c = 0; c < 3; c++) addVertex(inf, corner(t, c), 1);
      const band = mergeShoulder(acc);
      topTwo(acc, top);
      triSeg[t] = top.s1; triSeg2[t] = top.s2; triW1[t] = top.w1; triW2[t] = top.w2;
      // Region for coverage sweeps.
      let name;
      if (privacy) name = 'privacy';
      else if (eyes) name = 'eyes';
      else if (top.s1 < 0) name = null;
      else {
        const seg = SEGMENTS[top.s1];
        const zone = zoneOf(top.s1, top.s2, top.w1);
        if (zone) name = zone;
        else if (top.total > 0 && band / top.total >= SHOULDER_SHARE && (seg.part === 'upperArm' || seg.id === 'chest')) name = 'shoulder';
        else if (seg.kind === 'trunk') {
          for (let c = 0; c < 3; c++) { const v = corner(t, c); p[c][0] = position.getX(v); p[c][1] = position.getY(v); p[c][2] = position.getZ(v); }
          const ux = p[1][0] - p[0][0], uy = p[1][1] - p[0][1], uz = p[1][2] - p[0][2];
          const wx = p[2][0] - p[0][0], wy = p[2][1] - p[0][1], wz = p[2][2] - p[0][2];
          const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
          const len = Math.hypot(nx, ny, nz) || 1;
          name = Math.abs(nx / len) >= FLANK_NORMAL_X ? 'flank' : seg.part;
        } else name = seg.part;
      }
      region[t] = name ? REGION_INDEX[name] : -1;
      summary.triangles++;
      if (privacy) summary.privacyTriangles++;
      else {
        summary.nonPrivacyTriangles++;
        if (top.s1 >= 0) { summary.assigned++; if (!eyes) perSegment[top.s1].triangles++; } else summary.unassigned++;
        if (top.s1 >= 0 && top.w1 >= SINGLE_WEIGHT) summary.singleWeight++;
      }
    }
    records.set(skin, { skin, skinNumber, privacy, eyes, triCount, triSeg, triSeg2, triW1, triW2, region, vSeg, vW1, corner, inf });
  });

  // The clinical skin alone (the gate population of §8 G1: non-privacy body triangles).
  const clinical = [...records.values()].find((r) => !r.privacy && !r.eyes && r.triCount > 1000) ?? null;
  const clinicalSummary = clinical ? (() => {
    let single = 0, assigned = 0;
    for (let t = 0; t < clinical.triCount; t++) { if (clinical.triSeg[t] >= 0) assigned++; if (clinical.triW1[t] >= SINGLE_WEIGHT) single++; }
    return { triangles: clinical.triCount, assigned, assignedFraction: assigned / clinical.triCount, singleWeightFraction: single / clinical.triCount };
  })() : null;

  // Segment of a three.js intersection with one of the skins: the corners' weights mixed by the hit's
  // barycentric coordinates (hit.barycoord in r180; recomputed from the point when absent). Privacy and eye
  // surfaces are never pickable (12 §3.1: the press becomes a look): their part is null and pickable false,
  // while segment and region still say where the hit is.
  const hitAcc = new Float64Array(SLOTS);
  function ofHit(hit) {
    const record = hit && records.get(hit.object);
    if (!record || !Number.isInteger(hit.faceIndex)) return null;
    const t = hit.faceIndex;
    const bary = hit.barycoord ? [hit.barycoord.x, hit.barycoord.y, hit.barycoord.z] : [1 / 3, 1 / 3, 1 / 3];
    hitAcc.fill(0);
    for (let c = 0; c < 3; c++) addVertex(record.inf, record.corner(t, c), bary[c], hitAcc);
    mergeShoulder(hitAcc);
    const pick = topTwo(hitAcc, { s1: -1, s2: -1, w1: 0, w2: 0, total: 0 });
    const closed = record.privacy || record.eyes;
    const { part, anchorMode } = closed ? { part: null, anchorMode: null } : partOf(pick.s1, pick.s2, pick.w1);
    const seg = pick.s1 >= 0 ? SEGMENTS[pick.s1] : null;
    return {
      pickable: !closed && part !== null,
      segment: seg?.id ?? null, s2: pick.s2 >= 0 ? SEGMENTS[pick.s2].id : null, w1: pick.w1, w2: pick.w2,
      zone: zoneOf(pick.s1, pick.s2, pick.w1), side: seg?.side ?? (pick.s2 >= 0 ? SEGMENTS[pick.s2].side : null),
      part, anchorMode, region: REGIONS[record.region[t]] ?? null, privacy: record.privacy, eyes: record.eyes, triangle: t,
    };
  }
  // Triangles of one region (optionally one side), for the QA coverage sweeps.
  function trianglesOf(regionName, side = null) {
    const want = REGION_INDEX[regionName];
    const out = [];
    for (const record of records.values()) {
      for (let t = 0; t < record.triCount; t++) {
        if (record.region[t] !== want) continue;
        if (side) {
          const s1 = record.triSeg[t], s2 = record.triSeg2[t];
          const triSide = s1 >= 0 ? (SEGMENTS[s1].side ?? (s2 >= 0 ? SEGMENTS[s2].side : null)) : null;
          if (triSide !== side) continue;
        }
        out.push({ skin: record.skin, triangle: t });
      }
    }
    return out;
  }
  const buildMs = (typeof performance !== 'undefined' ? performance : Date).now() - started;
  return {
    segments: SEGMENTS, records, boneSegment: boneSeg, unassignedBones, ofHit, trianglesOf,
    recordOf: (skin) => records.get(skin) ?? null, clinical,
    summary: () => ({
      buildMs, unassignedBones, ...summary, assignedFraction: summary.assigned / Math.max(1, summary.nonPrivacyTriangles),
      singleWeightFraction: summary.singleWeight / Math.max(1, summary.nonPrivacyTriangles), clinical: clinicalSummary,
      segments: SEGMENTS.map((s, i) => ({ id: s.id, ...perSegment[i] })),
      regions: Object.fromEntries(REGIONS.map((r) => [r, [...records.values()].reduce((n, rec) => n + rec.region.reduce((m, x) => m + (x === REGION_INDEX[r] ? 1 : 0), 0), 0)])),
    }),
  };
}

// Deterministic random numbers for the QA sweeps (mulberry32).
export function seededRandom(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
