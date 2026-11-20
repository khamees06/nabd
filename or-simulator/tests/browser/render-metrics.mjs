// Image metrics for the visual quality plan (docs/improvement-plan/13_VISUAL_QUALITY_PLAN.md, cluster Q1).
//
// Pure functions on decoded screenshots plus the page-side probes that feed them. Every metric runs in Node
// on the PNG bytes Playwright returns, so Chrome, Edge and WebKit are measured by the same code and no
// browser colour management can touch the pixels. The decoder handles what page.screenshot() writes
// (8-bit RGB or RGBA, not interlaced); anything else throws, so a metric is never computed on garbage.
//
// Not a test file: Playwright collects *.spec.mjs only and `node --test` does not match this name.
// Unit tests: tests/render-metrics.test.js.
import zlib from 'node:zlib';

// ------------------------------------------------------------------ PNG
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

// Returns { width, height, data } with data as RGBA bytes (alpha 255 when the PNG has none).
export function decodePng(bytes) {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('not a PNG');
  let offset = 8, width = 0, height = 0, depth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('latin1', offset + 4, offset + 8);
    const body = buf.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0); height = body.readUInt32BE(4);
      depth = body[8]; colorType = body[9]; interlace = body[12];
    } else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    offset += 12 + length;
  }
  const channels = CHANNELS[colorType];
  if (depth !== 8 || !channels || interlace !== 0) {
    throw new Error(`unsupported PNG (bit depth ${depth}, colour type ${colorType}, interlace ${interlace})`);
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const rows = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const value = raw[src + x];
      const left = x >= channels ? rows[dst + x - channels] : 0;
      const up = y > 0 ? rows[dst - stride + x] : 0;
      const upLeft = x >= channels && y > 0 ? rows[dst - stride + x - channels] : 0;
      let out;
      if (filter === 0) out = value;
      else if (filter === 1) out = value + left;
      else if (filter === 2) out = value + up;
      else if (filter === 3) out = value + ((left + up) >> 1);
      else if (filter === 4) out = value + paeth(left, up, upLeft);
      else throw new Error(`bad PNG filter ${filter}`);
      rows[dst + x] = out & 0xff;
    }
  }
  const data = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i++, j += channels) {
    const o = i * 4;
    if (channels >= 3) { data[o] = rows[j]; data[o + 1] = rows[j + 1]; data[o + 2] = rows[j + 2]; }
    else { data[o] = data[o + 1] = data[o + 2] = rows[j]; }
    data[o + 3] = channels === 4 ? rows[j + 3] : channels === 2 ? rows[j + 1] : 255;
  }
  return { width, height, data };
}

function crc32(bytes) {
  let crc = ~0;
  for (const b of bytes) {
    crc ^= b;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

// RGBA PNG with filter 0 on every row; used by the unit tests and for evidence crops.
export function encodePng({ width, height, data }) {
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    Buffer.from(data.buffer, data.byteOffset + y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  }
  const chunk = (type, body) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(body.length, 0);
    head.write(type, 4, 'latin1');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
    return Buffer.concat([head, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([PNG_SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// ------------------------------------------------------------------ regions
// A rectangle is [x0, y0, x1, y1] in image pixels (x1, y1 exclusive), clamped to the image.
export function clampRect(img, [x0, y0, x1, y1]) {
  const cx = (v) => Math.max(0, Math.min(img.width, Math.round(v)));
  const cy = (v) => Math.max(0, Math.min(img.height, Math.round(v)));
  return [cx(x0), cy(y0), cx(x1), cy(y1)];
}

// A rectangle given as fractions of a box ({ left, top, width, height } in image pixels).
export function fractionRect(box, [fx0, fy0, fx1, fy1]) {
  return [box.left + fx0 * box.width, box.top + fy0 * box.height, box.left + fx1 * box.width, box.top + fy1 * box.height];
}

export const luma709 = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function* pixelsIn(img, rect) {
  const [x0, y0, x1, y1] = clampRect(img, rect);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) yield (y * img.width + x) * 4;
}

const round = (v, digits = 2) => (Number.isFinite(v) ? Number(v.toFixed(digits)) : null);

// Mean, standard deviation and clipped share (luma ≥ 245) of Rec. 709 luma in a rectangle. The C6 lamp
// check used the same luma and clip rule on a canvas readback; this is the same number from the PNG.
export function lumaStats(img, rect) {
  let n = 0, sum = 0, sum2 = 0, clipped = 0;
  for (const o of pixelsIn(img, rect)) {
    const l = luma709(img.data[o], img.data[o + 1], img.data[o + 2]);
    n += 1; sum += l; sum2 += l * l;
    if (l >= 245) clipped += 1;
  }
  const mean = n ? sum / n : NaN;
  return { pixels: n, meanLuma: round(mean, 1), sdLuma: round(n ? Math.sqrt(Math.max(0, sum2 / n - mean * mean)) : NaN, 2),
    clippedPct: round(n ? 100 * clipped / n : NaN, 2) };
}

export function lumaRegions(img, regions) {
  return Object.fromEntries(Object.entries(regions).map(([name, rect]) => [name, lumaStats(img, rect)]));
}

// ------------------------------------------------------------------ hue
// HSV hue in degrees (0–360) and saturation (0–1) of an 8-bit sRGB pixel; hue is null for greys.
export function hueSat(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), c = max - min;
  if (max === 0 || c === 0) return { hue: null, sat: 0 };
  let h;
  if (max === r) h = ((g - b) / c) % 6;
  else if (max === g) h = (b - r) / c + 2;
  else h = (r - g) / c + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { hue: h, sat: c / max };
}

// Signed hue in degrees, −180…180, so skin hues around 0–40° and a few just below 0 average correctly.
const signedHue = (h) => (h > 180 ? h - 360 : h);

// The skin filter for the hue metric: reddish-orange hues (−25…65°), visible saturation, not black and
// not clipped. It keeps lit and shaded skin and drops greys, the teal pads and the white drapes.
export function isSkinPixel(r, g, b) {
  const { hue, sat } = hueSat(r, g, b);
  if (hue === null) return false;
  const s = signedHue(hue);
  const l = luma709(r, g, b);
  return s >= -25 && s <= 65 && sat >= 0.12 && l >= 18 && l < 245;
}

// Skin hue by luma tercile (Q3: spread ≤ 3°). Skin pixels in the rectangle are sorted by luma and cut into
// three groups of equal size; each group reports its mean hue and mean luma. spreadDeg is max − min of the
// three mean hues; the overall mean hue and the luma standard deviation catch a hue shift or a flat look.
export function skinHueTerciles(img, rect) {
  const samples = [];
  let considered = 0;
  for (const o of pixelsIn(img, rect)) {
    const r = img.data[o], g = img.data[o + 1], b = img.data[o + 2];
    considered += 1;
    if (!isSkinPixel(r, g, b)) continue;
    samples.push({ l: luma709(r, g, b), h: signedHue(hueSat(r, g, b).hue) });
  }
  samples.sort((a, b) => a.l - b.l);
  const n = samples.length;
  const groups = [0, 1, 2].map((k) => samples.slice(Math.floor(k * n / 3), Math.floor((k + 1) * n / 3)));
  const mean = (list, key) => list.reduce((a, s) => a + s[key], 0) / (list.length || NaN);
  const terciles = groups.map((list, k) => ({ tercile: ['shade', 'mid', 'light'][k], pixels: list.length,
    meanHueDeg: round(mean(list, 'h'), 2), meanLuma: round(mean(list, 'l'), 1) }));
  const hues = terciles.map((t) => t.meanHueDeg).filter((h) => h !== null);
  const meanL = mean(samples, 'l');
  const sdL = Math.sqrt(samples.reduce((a, s) => a + (s.l - meanL) ** 2, 0) / (n || NaN));
  return { pixelsConsidered: considered, skinPixels: n, skinSharePct: round(considered ? 100 * n / considered : NaN, 1),
    meanHueDeg: round(mean(samples, 'h'), 2), meanLuma: round(meanL, 1), sdLuma: round(sdL, 2), terciles,
    spreadDeg: hues.length === 3 ? round(Math.max(...hues) - Math.min(...hues), 2) : null };
}

// ------------------------------------------------------------------ differences
// Per-pixel luma difference between two images in a rectangle (the shimmer metric compares two frames
// whose cameras differ by half a pixel; Q5 allows it to rise by ≤ 10 %).
export function lumaDifference(a, b, rect) {
  if (a.width !== b.width || a.height !== b.height) throw new Error('images differ in size');
  const diffs = [];
  for (const o of pixelsIn(a, rect)) {
    diffs.push(Math.abs(luma709(a.data[o], a.data[o + 1], a.data[o + 2]) - luma709(b.data[o], b.data[o + 1], b.data[o + 2])));
  }
  diffs.sort((x, y) => x - y);
  const n = diffs.length;
  const q = (p) => (n ? diffs[Math.min(n - 1, Math.floor(p * (n - 1) + 0.5))] : NaN);
  return { pixels: n, meanAbs: round(diffs.reduce((s, d) => s + d, 0) / (n || NaN), 3), p95: round(q(0.95), 2), max: round(q(1), 2),
    over4Pct: round(n ? 100 * diffs.filter((d) => d > 4).length / n : NaN, 2) };
}

// Exact pixel comparison: how many pixels differ in any of R, G, B, and by how much. Rectangles in
// `exclude` are skipped (used only for regions that animate by design, and always listed in the readout).
export function pixelDiff(a, b, rect = [0, 0, a.width, a.height], exclude = []) {
  if (a.width !== b.width || a.height !== b.height) throw new Error('images differ in size');
  const skip = exclude.map((r) => clampRect(a, r));
  let pixels = 0, differing = 0, maxDelta = 0, sumDelta = 0;
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  const [x0, y0, x1, y1] = clampRect(a, rect);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (skip.some(([sx0, sy0, sx1, sy1]) => x >= sx0 && x < sx1 && y >= sy0 && y < sy1)) continue;
      const o = (y * a.width + x) * 4;
      const d = Math.max(Math.abs(a.data[o] - b.data[o]), Math.abs(a.data[o + 1] - b.data[o + 1]), Math.abs(a.data[o + 2] - b.data[o + 2]));
      pixels += 1;
      if (d > 0) {
        differing += 1; sumDelta += d; maxDelta = Math.max(maxDelta, d);
        box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x + 1); box[3] = Math.max(box[3], y + 1);
      }
    }
  }
  return { pixels, differing, differingPct: round(pixels ? 100 * differing / pixels : NaN, 4), maxChannelDelta: maxDelta,
    meanDeltaOfDiffering: round(differing ? sumDelta / differing : 0, 2), differingBox: differing ? box : null, excluded: exclude };
}

// Mean luma of small square patches centred on screen points ({ name: { x, y } }); half = half side in px.
export function patchLuma(img, centres, half = 6) {
  return Object.fromEntries(Object.entries(centres).map(([name, p]) => [name, p
    ? { x: round(p.x, 1), y: round(p.y, 1), ...lumaStats(img, [p.x - half, p.y - half, p.x + half + 1, p.y + half + 1]) }
    : null]));
}

// ------------------------------------------------------------------ page-side probes
// three.js announces its scenes and renderer on window.__THREE_DEVTOOLS__ (its devtools hook). Installed
// as an init script, before the app runs; read-only unless a test calls one of the explicit setters below.
export const RENDER_HOOK = () => {
  if (window.__q1) return;
  window.__q1 = { scenes: [], renderers: [] };
  const hook = window.__THREE_DEVTOOLS__ ?? new EventTarget();
  hook.addEventListener('observe', (e) => {
    const d = e.detail;
    if (d?.isScene) window.__q1.scenes.push(d);
    else if (d && typeof d.render === 'function' && d.domElement) window.__q1.renderers.push(d);
  });
  window.__THREE_DEVTOOLS__ = hook;
};

// WebGL-level draw counter, independent of three.js's own bookkeeping: wraps the four WebGL 2 draw calls on
// the prototype and counts them (and the triangles of TRIANGLES draws) only while window.__gl.on is set, so
// the app's own frames pass through untouched. Installed as an init script, before the app creates its
// context. countedFrame below switches it on around one frame.
export const GL_DRAW_COUNTER = () => {
  if (window.__gl) return;
  window.__gl = { on: false, draws: 0, tris: 0 };
  const proto = WebGL2RenderingContext.prototype;
  // name, index of the vertex count, index of the instance count (null: one instance)
  for (const [name, countAt, instancesAt] of [['drawElements', 1, null], ['drawArrays', 2, null],
    ['drawElementsInstanced', 1, 4], ['drawArraysInstanced', 2, 3]]) {
    const original = proto[name];
    proto[name] = function countedDraw(...args) {
      if (window.__gl.on) {
        window.__gl.draws += 1;
        if (args[0] === 4) window.__gl.tris += (args[countAt] / 3) * (instancesAt === null ? 1 : args[instancesAt]);
      }
      return original.apply(this, args);
    };
  }
};

// One frame through the app's renderer, scene and camera with GL_DRAW_COUNTER on, and the ?qa readout of that
// same frame (read in the same task, so no app frame can come between). Needs RENDER_HOOK and GL_DRAW_COUNTER.
export const countedFrame = (page) => page.evaluate(() => {
  const scene = window.__q1.scenes.find((s) => s.getObjectByName('Trainee anatomical right hand'));
  let camera = null;
  scene.traverse((c) => { if (!camera && c.isPerspectiveCamera) camera = c; });
  const renderer = window.__q1.renderers[0];
  Object.assign(window.__gl, { draws: 0, tris: 0, on: true });
  try {
    renderer.render(scene, camera);
  } finally {
    window.__gl.on = false;
  }
  const s = window.__studioQA.getRenderStats();
  return { glDraws: window.__gl.draws, glTris: window.__gl.tris, calls: s.calls, tris: s.tris, shadowCalls: s.shadowCalls,
    shadowTris: s.shadowTris, liveInfoCalls: renderer.info.render.calls, liveInfoTris: renderer.info.render.triangles,
    shadowMapRender: renderer.shadowMap.render.name, render: renderer.render.name };
});

// The rendered pixels themselves: one frame drawn now through the app's renderer, scene and camera, read back
// in the same task (toDataURL works there although the canvas has no preserveDrawingBuffer). This is what
// the renderer produced, without the page's DOM overlays and without the compositor: Playwright WebKit on
// Windows screenshots the drill view (V2) as a blank canvas at the base commit too, while this readback
// shows it. Coordinates are canvas pixels (the drawing buffer; device pixel ratio 1 in these runs).
// `offset` ({ dx, dy } CSS px) renders that one frame with a sub-pixel camera shift (shimmer metric).
export async function readCanvas(page, offset = null) {
  const url = await page.evaluate((o) => {
    const scene = window.__q1.scenes.find((s) => s.getObjectByName('Trainee anatomical right hand'));
    let camera = null;
    scene.traverse((c) => { if (!camera && c.isPerspectiveCamera) camera = c; });
    const renderer = window.__q1.renderers[0];
    const canvas = renderer.domElement;
    const aspect = camera.aspect;
    if (o) {
      const b = canvas.getBoundingClientRect();
      camera.setViewOffset(b.width, b.height, o.dx, o.dy, b.width, b.height);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
    try {
      renderer.render(scene, camera);
      return canvas.toDataURL('image/png');
    } finally {
      if (o) { camera.clearViewOffset(); camera.aspect = aspect; camera.updateProjectionMatrix(); renderer.render(scene, camera); }
    }
  }, offset);
  return decodePng(Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
}

// World points → canvas (drawing-buffer) pixels through the main scene's camera, the camera the app renders
// with; `page` gives the same point in page pixels (for outlines drawn over the page).
export const projectToCanvas = (page, points) => page.evaluate((list) => {
  const scene = window.__q1.scenes.find((s) => s.getObjectByName('Trainee anatomical right hand'));
  let camera = null;
  scene.traverse((o) => { if (!camera && o.isPerspectiveCamera) camera = o; });
  const element = document.querySelector('#viewport canvas');
  const box = element.getBoundingClientRect();
  const V = scene.position.constructor;
  return Object.fromEntries(Object.entries(list).map(([name, p]) => {
    if (!p) return [name, null];
    const v = new V(p[0], p[1], p[2]).project(camera);
    if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) return [name, null];
    const fx = (v.x + 1) / 2, fy = (1 - v.y) / 2;
    return [name, { x: fx * element.width, y: fy * element.height, page: { x: box.left + fx * box.width, y: box.top + fy * box.height } }];
  }));
}, points);

// World positions of named patient bones (sanitised names, as three.js stores them: "lowerarm01.L" is
// "lowerarm01L"). The patient is the scene's largest skinned mesh outside the trainee and supervisor.
export const boneWorld = (page, names) => page.evaluate((list) => {
  const scene = window.__q1.scenes.find((s) => s.getObjectByName('Trainee anatomical right hand'));
  const excluded = ['Trainee anatomical left hand', 'Trainee anatomical right hand', 'Rigged supervising clinician']
    .map((n) => scene.getObjectByName(n));
  const inside = (o) => { for (let p = o; p; p = p.parent) if (excluded.includes(p)) return true; return false; };
  let patient = null;
  scene.traverse((o) => {
    if (o.isSkinnedMesh && !inside(o) && (!patient || o.geometry.attributes.position.count > patient.geometry.attributes.position.count)) patient = o;
  });
  const V = scene.position.constructor;
  const out = {};
  for (const name of list) {
    const bone = patient.skeleton.bones.find((b) => b.name === name);
    out[name] = bone ? bone.getWorldPosition(new V()).toArray() : null;
  }
  return out;
}, names);

// Is a world point the visible patient surface along the view? Casts the camera ray through each point
// against the patient's main skin as drawn now (skinned vertex positions, Möller–Trumbore on every
// triangle) and reports where the first hit lies. A joint band is "visible" when the first skin hit is
// within maxOffset metres of the joint (the near surface of that limb); a hit farther away means another
// part of the body (usually the torso) hides it. Only the patient's skin is tested, not gloves or tools.
export const skinAlongView = (page, points, maxOffset = 0.1) => page.evaluate(({ list, maxOffset }) => {
  const scene = window.__q1.scenes.find((s) => s.getObjectByName('Trainee anatomical right hand'));
  let camera = null;
  scene.traverse((o) => { if (!camera && o.isPerspectiveCamera) camera = o; });
  let patient = null;
  scene.getObjectByName('VirtualPatient').traverse((o) => {
    if (o.isSkinnedMesh && (!patient || o.geometry.attributes.position.count > patient.geometry.attributes.position.count)) patient = o;
  });
  const V = scene.position.constructor;
  const count = patient.geometry.attributes.position.count;
  const P = new Float64Array(count * 3);
  const v = new V();
  for (let i = 0; i < count; i++) {
    patient.getVertexPosition(i, v).applyMatrix4(patient.matrixWorld);
    P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z;
  }
  const index = patient.geometry.index;
  const tris = index ? index.count / 3 : count / 3;
  const corner = (t, k) => (index ? index.getX(t * 3 + k) : t * 3 + k);
  const eye = camera.getWorldPosition(new V());
  const out = {};
  for (const [name, p] of Object.entries(list)) {
    if (!p) { out[name] = null; continue; }
    const d = [p[0] - eye.x, p[1] - eye.y, p[2] - eye.z];
    const len = Math.hypot(...d);
    d[0] /= len; d[1] /= len; d[2] /= len;
    let best = Infinity;
    for (let t = 0; t < tris; t++) {
      const a = corner(t, 0) * 3, b = corner(t, 1) * 3, c = corner(t, 2) * 3;
      const e1 = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]];
      const e2 = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
      const h = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
      const det = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
      if (Math.abs(det) < 1e-12) continue;
      const s = [eye.x - P[a], eye.y - P[a + 1], eye.z - P[a + 2]];
      const u = (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]) / det;
      if (u < 0 || u > 1) continue;
      const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
      const w = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) / det;
      if (w < 0 || u + w > 1) continue;
      const dist = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det;
      if (dist > 1e-6 && dist < best) best = dist;
    }
    const offset = Number.isFinite(best) ? Math.abs(best - len) : null;
    out[name] = { visible: offset !== null && offset <= maxOffset, firstSkinHitM: Number.isFinite(best) ? Number(best.toFixed(4)) : null,
      jointDistanceM: Number(len.toFixed(4)), offsetM: offset === null ? null : Number(offset.toFixed(4)) };
  }
  return out;
}, { list: points, maxOffset });
