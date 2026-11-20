import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import {
  TONE_MAPPING_NAMES, toneMappingName, shadowMapUpdates, createGpuTimer, installRenderCounters, casterCensus, createLookDev,
} from '../src/render/LookDev.js';

// A stand-in for WebGLRenderer with the same order of work as three r180's render(): shadow pass first,
// then info.reset() (autoReset), then the main pass. Each caster light costs 5 draws and 100 triangles in
// the shadow pass; the main pass costs mainCalls (10) draws and 1000 triangles; offscreen renders cost 3
// and 30. Like three, the draws count into whatever renderer.info is now, and render() returns at once
// while it knows the context is lost.
//
// Context loss, as three r180 does it: the renderer registers its own canvas listeners in its constructor
// (so before anyone else's); on 'webglcontextlost' it sets its lost flag; on 'webglcontextrestored'
// (onContextRestore → initGLContext) it builds NEW info and shadowMap objects, copies autoReset and the
// shadow settings over, and render() uses the new ones from then on. rebuild() does the same swap without
// any event (a renderer with no canvas events, to test the check before every render).
function fakeRenderer({ canvas = null, gl = null } = {}) {
  const makeInfo = () => ({ autoReset: true, render: { calls: 0, triangles: 0 }, programs: [{}, {}, {}],
    reset() { this.render.calls = 0; this.render.triangles = 0; } });
  const makeShadowMap = () => ({ enabled: true, autoUpdate: true, needsUpdate: false, type: 1,
    render(lights) {
      if (this.enabled === false || (this.autoUpdate === false && this.needsUpdate === false) || lights.length === 0) return;
      for (const light of lights) {
        if (light.shadow.autoUpdate === false && light.shadow.needsUpdate === false) continue;
        renderer.info.render.calls += 5; renderer.info.render.triangles += 100;
        light.shadow.needsUpdate = false;
      }
      this.needsUpdate = false;
    } });
  let target = null;
  let contextLost = false;
  const log = [];
  const renderer = {
    info: makeInfo(), toneMapping: 4, toneMappingExposure: 0.88, mainCalls: 10,
    domElement: canvas,
    getContext: gl ? () => gl : undefined,
    getPixelRatio: () => 1.25,
    getRenderTarget: () => target,
    setRenderTarget: (t) => { target = t; },
    shadowMap: makeShadowMap(),
    lights: [],
    render(scene, camera) {
      log.push({ scene, camera, target });
      if (contextLost) return undefined;
      this.shadowMap.render(this.lights, scene, camera);
      if (this.info.autoReset) this.info.reset();
      const main = target === null;
      this.info.render.calls += main ? this.mainCalls : 3;
      this.info.render.triangles += main ? 1000 : 30;
      return main ? 'main' : 'offscreen';
    },
    rebuild() {
      const { autoReset } = this.info;
      const { enabled, autoUpdate, needsUpdate, type } = this.shadowMap;
      this.info = Object.assign(makeInfo(), { autoReset });
      this.shadowMap = Object.assign(makeShadowMap(), { enabled, autoUpdate, needsUpdate, type });
    },
    loseContext() { gl?.lose(); canvas.dispatchEvent(new Event('webglcontextlost')); },
    restoreContext() { gl?.restore(); canvas.dispatchEvent(new Event('webglcontextrestored')); },
  };
  canvas?.addEventListener('webglcontextlost', () => { contextLost = true; });
  canvas?.addEventListener('webglcontextrestored', () => { contextLost = false; renderer.rebuild(); });
  return { renderer, log };
}
const caster = (autoUpdate = true, needsUpdate = false) => ({ shadow: { autoUpdate, needsUpdate } });

test('tone mapping names match three r180 constants', () => {
  const expected = { NoToneMapping: 'None', LinearToneMapping: 'Linear', ReinhardToneMapping: 'Reinhard', CineonToneMapping: 'Cineon',
    ACESFilmicToneMapping: 'ACESFilmic', CustomToneMapping: 'Custom', AgXToneMapping: 'AgX', NeutralToneMapping: 'Neutral' };
  for (const [constant, name] of Object.entries(expected)) assert.equal(toneMappingName(THREE[constant]), name, constant);
  assert.equal(Object.keys(TONE_MAPPING_NAMES).length, 8);
  assert.equal(toneMappingName(99), 'unknown(99)');
});

test('shadowMapUpdates follows the skip rule of WebGLShadowMap.render', async () => {
  const map = { enabled: true, autoUpdate: true, needsUpdate: false };
  assert.equal(shadowMapUpdates(map, [caster(), caster()]), 2);
  assert.equal(shadowMapUpdates(map, []), 0);
  assert.equal(shadowMapUpdates({ ...map, enabled: false }, [caster()]), 0);
  assert.equal(shadowMapUpdates({ ...map, autoUpdate: false }, [caster()]), 0, 'frozen map');
  assert.equal(shadowMapUpdates({ ...map, autoUpdate: false, needsUpdate: true }, [caster()]), 1, 'map asked once');
  assert.equal(shadowMapUpdates(map, [caster(false, false), caster(false, true), caster()]), 2, 'frozen light skipped');
  // The rule above is the one three.js runs. If three is ever re-bundled, these lines must still exist in
  // the npm source and in the inlined copy, or the counter would drift from what the renderer does.
  const npm = await readFile(new URL('../node_modules/three/src/renderers/webgl/WebGLShadowMap.js', import.meta.url), 'utf8');
  assert.match(npm, /if \( scope\.enabled === false \) return;/);
  assert.match(npm, /if \( scope\.autoUpdate === false && scope\.needsUpdate === false \) return;/);
  assert.match(npm, /if \( lights\.length === 0 \) return;/);
  assert.match(npm, /if \( shadow\.autoUpdate === false && shadow\.needsUpdate === false \) continue;/);
  const bundle = await readFile(new URL('../src/app/NabdRuntime.js', import.meta.url), 'utf8');
  assert.match(bundle, /this\.render=function\(R,I,D\)\{if\(m\.enabled===!1\|\|m\.autoUpdate===!1&&m\.needsUpdate===!1\|\|R\.length===0\)return;/);
  assert.match(bundle, /if\(H\.autoUpdate===!1&&H\.needsUpdate===!1\)continue;/);
  // …and the inlined render() runs the shadow pass before info.reset(), which is why M8 never saw it.
  assert.match(bundle, /Se\.render\(X,M,O\),Ae===!0&&re\.endShadows\(\),this\.info\.autoReset===!0&&this\.info\.reset\(\)/);
});

test('render counters split shadow and main passes per frame without changing the render', () => {
  const { renderer, log } = fakeRenderer();
  renderer.lights = [caster(), caster()];
  const scene = {}, camera = {}, target = {};
  const plainRender = renderer.render;
  const counters = installRenderCounters(renderer);
  assert.notEqual(renderer.render, plainRender);

  assert.equal(renderer.render(scene, camera), 'main', 'returns the original result');
  assert.deepEqual(log.at(-1), { scene, camera, target: null }, 'same arguments');
  let frame = counters.lastFrame();
  assert.deepEqual(frame, { calls: 10, tris: 1000, shadowCalls: 10, shadowTris: 200, shadowUpdates: 2, renders: 1 });
  assert.equal(renderer.info.render.calls, 10, 'info still shows the main pass only (autoReset kept)');
  assert.equal(renderer.info.autoReset, true);

  // An offscreen render (scope feed) before the main pass belongs to the same frame.
  renderer.setRenderTarget(target);
  assert.equal(renderer.render(scene, camera), 'offscreen');
  renderer.setRenderTarget(null);
  assert.deepEqual(counters.lastFrame(), frame, 'an offscreen render does not end the frame');
  renderer.render(scene, camera);
  frame = counters.lastFrame();
  assert.deepEqual(frame, { calls: 10, tris: 1000, shadowCalls: 20, shadowTris: 400, shadowUpdates: 4, renders: 2 });

  // Frozen shadows: the pass is skipped and the frame adds 0 updates.
  renderer.shadowMap.autoUpdate = false;
  renderer.render(scene, camera);
  assert.deepEqual(counters.lastFrame(), { calls: 10, tris: 1000, shadowCalls: 0, shadowTris: 0, shadowUpdates: 0, renders: 1 });
  renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
  assert.equal(counters.lastFrame().shadowUpdates, 2, 'one requested update redraws both maps');
  assert.deepEqual(counters.totals(), { frames: 4, renders: 5, shadowUpdates: 8, shadowCalls: 40, shadowTris: 800, lostFrames: 0 });

  assert.equal(counters.uninstall(), true);
  assert.equal(renderer.render, plainRender, 'originals restored');
});

test('render counters do not unwrap a wrapper installed on top of them', () => {
  const { renderer } = fakeRenderer();
  const counters = installRenderCounters(renderer);
  const ours = renderer.render;
  renderer.render = function testHook(...args) { return ours.apply(this, args); };
  assert.equal(counters.uninstall(), false);
  assert.equal(renderer.render.name, 'testHook');
});

// Fake WebGL 2 context with EXT_disjoint_timer_query_webgl2: each query resolves `lag` polls later.
// lose()/restore() follow the WebGL 2 rules that matter here: while lost, createQuery and getExtension
// return null, every other call is a no-op, and getQueryParameter answers true for QUERY_RESULT_AVAILABLE and
// null for the result; after a restore, queries of the old context are rejected (INVALID_OPERATION, logged)
// and the extension must be fetched again on the new context before TIME_ELAPSED_EXT is accepted.
function fakeGl({ ext = true, lag = 2 } = {}) {
  const queries = new Set();
  let disjoint = false, active = null, polls = 0, lost = false, generation = 0, extGeneration = -1;
  const E = { TIME_ELAPSED_EXT: 0x88bf, GPU_DISJOINT_EXT: 0x8fbb };
  const foreign = (q, call) => { if (q.generation === generation) return false; gl.log.push(`INVALID_OPERATION: ${call}`); return true; };
  const gl = {
    QUERY_RESULT: 0x8866, QUERY_RESULT_AVAILABLE: 0x8867, log: [],
    getExtension: (name) => {
      if (lost || !ext || name !== 'EXT_disjoint_timer_query_webgl2') return null;
      extGeneration = generation;
      return E;
    },
    createQuery: () => { if (lost) return null; const q = { ns: 0, ready: Infinity, generation }; queries.add(q); return q; },
    deleteQuery: (q) => { if (lost || foreign(q, 'deleteQuery')) return; queries.delete(q); },
    beginQuery: (t, q) => {
      if (lost) return;
      assert.equal(t, E.TIME_ELAPSED_EXT);
      assert.equal(extGeneration, generation, 'the extension was fetched on this context');
      assert.equal(active, null, 'one active query');
      active = q;
    },
    endQuery: () => { if (lost) return; active.ready = polls + lag; active.ns = gl.nextNs; active = null; },
    getParameter: (p) => (lost ? null : p === E.GPU_DISJOINT_EXT ? disjoint : null),
    getQueryParameter: (q, p) => {
      if (lost) return p === gl.QUERY_RESULT_AVAILABLE ? true : null;
      if (foreign(q, 'getQueryParameter')) return null;
      if (p === gl.QUERY_RESULT_AVAILABLE) { polls += 1; return polls > q.ready; }
      return q.ns;
    },
    isContextLost: () => lost,
    lose: () => { lost = true; active = null; },
    restore: () => { lost = false; generation += 1; queries.clear(); },
    nextNs: 2_000_000,
    setDisjoint: (v) => { disjoint = v; },
    live: () => queries.size,
  };
  return gl;
}
const settle = (timer) => { let read = null; for (let k = 0; k < 20 && (!read || read.pending); k += 1) read = timer.read(); return read; };

test('GPU timer reports the median main-pass time in ms, drops disjoint results, and is absent without the extension', () => {
  assert.equal(createGpuTimer(null).available, false);
  const none = createGpuTimer(fakeGl({ ext: false }));
  assert.equal(none.available, false);
  assert.equal(none.setEnabled(true), false);
  assert.equal(none.begin(), false);
  assert.equal(none.read(), null);

  const gl = fakeGl();
  const timer = createGpuTimer(gl, { keep: 5 });
  assert.equal(timer.available, true);
  assert.equal(timer.begin(), false, 'off by default');
  timer.setEnabled(true);
  for (const ms of [2, 4, 3, 9, 1, 5]) {
    gl.nextNs = ms * 1e6;
    assert.equal(timer.begin(), true);
    timer.end();
  }
  let read = null;
  for (let k = 0; k < 20 && (!read || read.pending); k += 1) read = timer.read();
  assert.equal(read.samples, 5, 'keeps the last 5');
  assert.equal(read.medianMs, 4, 'median of 4, 3, 9, 1, 5');
  gl.nextNs = 50e6;
  timer.begin(); timer.end();
  gl.setDisjoint(true);
  read = timer.read();
  assert.equal(read.discarded, 1);
  assert.equal(read.pending, 0);
  assert.equal(gl.live(), 0, 'every query deleted');
  gl.setDisjoint(false);
  timer.setEnabled(false);
  assert.equal(timer.read(), null);
});

test('GPU timer across a context loss: no fake 0 ms samples, old queries dropped, extension fetched again', () => {
  const gl = fakeGl();
  const timer = createGpuTimer(gl, { keep: 10 });
  timer.setEnabled(true);
  for (const ms of [3, 3, 3]) { gl.nextNs = ms * 1e6; timer.begin(); timer.end(); }
  assert.equal(settle(timer).samples, 3);
  gl.nextNs = 3e6;
  timer.begin(); timer.end(); // in flight when the context goes
  gl.lose();
  // A lost context reports every query as available with a null result; polling then would add 0 ms samples.
  assert.equal(timer.begin(), false, 'no query while the context is lost');
  for (let k = 0; k < 5; k += 1) timer.read();
  assert.deepEqual([timer.read().samples, timer.read().medianMs], [3, 3], 'nothing read from the lost context');
  gl.restore();
  timer.reset();
  assert.equal(timer.resets, 1);
  assert.equal(timer.enabled, true, 'the on/off choice survives the restore');
  assert.equal(timer.read(), null, 'samples of the old context are forgotten');
  for (const ms of [7, 7, 7]) { gl.nextNs = ms * 1e6; assert.equal(timer.begin(), true); timer.end(); }
  const after = settle(timer);
  assert.deepEqual([after.samples, after.medianMs, after.dropped], [3, 7, 1]);
  assert.deepEqual(gl.log, [], 'no query of the old context was passed to the new one');
  assert.equal(gl.live(), 0);
});

test('render counters follow the info and shadowMap that three builds on a context restore', () => {
  const gl = fakeGl({ ext: false });
  const { renderer } = fakeRenderer({ canvas: new EventTarget(), gl });
  renderer.lights = [caster(), caster()];
  const scene = {}, camera = {};
  const counters = installRenderCounters(renderer);
  renderer.render(scene, camera);
  const frame = { calls: 10, tris: 1000, shadowCalls: 10, shadowTris: 200, shadowUpdates: 2, renders: 1 };
  assert.deepEqual(counters.lastFrame(), frame);
  const oldMap = renderer.shadowMap, oldInfo = renderer.info, plainShadow = oldMap.render;
  assert.equal(plainShadow.name, 'countedShadowRender');

  // Lost: three draws nothing; those frames are counted apart and leave the rendered-frame numbers alone.
  renderer.loseContext();
  renderer.render(scene, camera);
  renderer.render(scene, camera);
  assert.deepEqual(counters.lastFrame(), frame, 'last rendered frame kept');
  assert.deepEqual(counters.totals(), { frames: 1, renders: 1, shadowUpdates: 2, shadowCalls: 10, shadowTris: 200, lostFrames: 2 });
  assert.deepEqual(counters.context(), { losses: 1, restores: 0, rebuilds: 0, lost: true });

  // Restored: new objects. The main pass now costs 7 draws, so a counter still reading the old info would say 10.
  renderer.restoreContext();
  assert.notEqual(renderer.shadowMap, oldMap, 'three-like rebuild replaced the shadow map');
  assert.notEqual(renderer.info, oldInfo, '…and the info');
  assert.deepEqual(counters.context(), { losses: 1, restores: 1, rebuilds: 1, lost: false });
  assert.equal(renderer.shadowMap.render.name, 'countedShadowRender', 'the new map is wrapped on the restore event');
  assert.notEqual(oldMap.render.name, 'countedShadowRender', 'the dead map got its own function back');
  renderer.mainCalls = 7;
  renderer.render(scene, camera);
  assert.deepEqual(counters.lastFrame(), { ...frame, calls: 7 }, 'shadow pass counted again, main pass read from the new info');
  assert.equal(oldInfo.render.calls, 10, 'the old info is frozen');
  assert.deepEqual(counters.totals(), { frames: 2, renders: 2, shadowUpdates: 4, shadowCalls: 20, shadowTris: 400, lostFrames: 2 });

  assert.equal(counters.uninstall(), true);
  assert.equal(renderer.shadowMap.render.name, 'render', 'uninstall unwraps the current map');
  renderer.restoreContext(); // listeners removed: nothing counts any more
  assert.equal(counters.context().restores, 1);
});

test('render counters follow a rebuilt renderer before the next frame even without restore events', () => {
  const { renderer } = fakeRenderer();
  renderer.lights = [caster()];
  const counters = installRenderCounters(renderer);
  renderer.render({}, {});
  renderer.rebuild();
  renderer.mainCalls = 4;
  renderer.render({}, {});
  assert.deepEqual(counters.lastFrame(), { calls: 4, tris: 1000, shadowCalls: 5, shadowTris: 100, shadowUpdates: 1, renders: 1 });
  assert.deepEqual(counters.context(), { losses: 0, restores: 0, rebuilds: 1, lost: false });
  assert.equal(counters.uninstall(), true);
});

test('LookDev readout after a context restore: counts, lost frames and a reset GPU timer', () => {
  const scene = new THREE.Scene();
  const gl = fakeGl();
  const { renderer } = fakeRenderer({ canvas: new EventTarget(), gl });
  renderer.lights = [caster()];
  const look = createLookDev({ renderer, scene, qa: true, gpuTimer: true });
  for (let k = 0; k < 3; k += 1) renderer.render(scene, {});
  const before = look.readout();
  assert.deepEqual([before.contextLost, before.contextLosses, before.contextRestores, before.rendererRebuilds, before.lostFrames, before.gpuTimerResets],
    [false, 0, 0, 0, 0, 0]);
  renderer.loseContext();
  renderer.render(scene, {});
  assert.deepEqual([look.readout().contextLost, look.readout().lostFrames, look.readout().frames], [true, 1, 3]);
  renderer.restoreContext();
  for (let k = 0; k < 8; k += 1) renderer.render(scene, {});
  const r = look.readout();
  assert.deepEqual([r.contextLost, r.contextLosses, r.contextRestores, r.rendererRebuilds, r.lostFrames, r.gpuTimerResets, r.gpuTimer],
    [false, 1, 1, 1, 1, 1, 'on']);
  assert.deepEqual([r.calls, r.shadowCalls, r.shadowTris, r.shadowUpdates, r.frames], [10, 5, 100, 11, 11]);
  assert.ok(r.gpuSamples > 0, 'the timer measures again on the restored context');
  assert.deepEqual(gl.log, []);
});

test('caster census counts what the shadow pass draws for each light', () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  scene.add(camera);
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.name = 'Key';
  light.castShadow = true;
  light.position.set(0, 5, 1); // not straight down: lookAt with up parallel to the view is degenerate
  Object.assign(light.shadow.camera, { left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 10 });
  light.shadow.camera.updateProjectionMatrix();
  scene.add(light, light.target);
  const spot = new THREE.SpotLight(0xffffff, 1);
  spot.name = 'Lamp (no shadow)';
  scene.add(spot);

  const box = () => new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const mat = () => new THREE.MeshStandardMaterial();
  const room = new THREE.Group(); room.name = 'Room';
  const patient = new THREE.Group(); patient.name = 'Patient';
  scene.add(room, patient);
  const add = (parent, name, x, options = {}) => {
    const mesh = new THREE.Mesh(options.geometry ?? box(), options.material ?? mat());
    mesh.name = name; mesh.position.x = x; mesh.castShadow = options.cast ?? true;
    if (options.frustumCulled === false) mesh.frustumCulled = false;
    // The main pass computes each culled geometry's sphere on its first frame; do what it would have done.
    mesh.geometry.computeBoundingSphere();
    parent.add(mesh);
    return mesh;
  };
  add(room, 'inside', 0);
  add(room, 'outside', 5);
  add(room, 'outside but never culled', 5, { frustumCulled: false });
  add(room, 'not a caster', 0, { cast: false });
  const hidden = new THREE.Group(); hidden.visible = false; room.add(hidden);
  add(hidden, 'under a hidden parent', 0);
  add(patient, 'other layer', 0).layers.set(3);
  const grouped = box();
  grouped.clearGroups(); grouped.addGroup(0, 12, 0); grouped.addGroup(12, 12, 1); grouped.addGroup(24, 12, 2);
  const invisible = mat(); invisible.visible = false;
  add(patient, 'three groups, one hidden material', 0.1, { geometry: grouped, material: [mat(), invisible, mat()] });
  scene.updateMatrixWorld(true);
  light.shadow.updateMatrices(light); // what WebGLShadowMap does before drawing each light

  const [summary] = casterCensus(scene, { camera });
  assert.equal(casterCensus(scene, { camera }).length, 1, 'only lights that cast');
  assert.equal(summary.light, 'Key');
  assert.equal(summary.type, 'DirectionalLight');
  assert.equal(summary.lit, true);
  assert.deepEqual(summary.mapSize, [512, 512]);
  assert.equal(summary.casters, 6);
  assert.equal(summary.visible, 4, 'hidden parent and other layer excluded');
  assert.equal(summary.drawn, 3, 'outside the shadow frustum excluded unless never culled');
  assert.equal(summary.alwaysDrawn, 1);
  assert.equal(summary.drawCalls, 4, '1 + 1 + 2 visible groups');
  assert.equal(summary.sphereMissing, 0);

  const [detail] = casterCensus(scene, { camera, detail: true });
  assert.deepEqual(detail.groups.map((g) => [g.group, g.casters, g.visible, g.drawn, g.alwaysDrawn]),
    [['Room', 4, 3, 2, 1], ['Patient', 2, 1, 1, 0]]);

  // A skinned caster whose bounding sphere was never computed is counted as drawn and is not computed here.
  const skinned = new THREE.SkinnedMesh(box(), mat());
  skinned.castShadow = true;
  skinned.bind(new THREE.Skeleton([new THREE.Bone()]));
  patient.add(skinned);
  scene.updateMatrixWorld(true);
  assert.equal(skinned.boundingSphere, null);
  const [withSkin] = casterCensus(scene, { camera });
  assert.equal(withSkin.sphereMissing, 1);
  assert.equal(withSkin.drawn, 4);
  assert.equal(skinned.boundingSphere, null, 'census is read-only');
});

test('LookDev readout: without qa nothing is wrapped; with qa the counters feed the readout', () => {
  const scene = new THREE.Scene();
  const plain = fakeRenderer().renderer;
  const before = plain.render;
  const off = createLookDev({ renderer: plain, scene });
  assert.equal(plain.render, before, 'no wrapper without ?qa');
  assert.equal(off.counters, null);
  plain.render(scene, {});
  const r0 = off.readout();
  assert.equal(r0.calls, 10);
  assert.equal(r0.shadowCalls, null);
  assert.equal(r0.gpuTimer, null);

  const { renderer } = fakeRenderer();
  renderer.lights = [caster()];
  renderer.getContext = () => fakeGl({ ext: false });
  const look = createLookDev({ renderer, scene, qa: true });
  renderer.render(scene, {});
  const r = look.readout();
  for (const key of ['calls', 'tris', 'shadowCalls', 'shadowTris', 'shadowUpdates', 'programs', 'casters', 'envReady',
    'toneMapping', 'exposure', 'pixelRatio', 'gpuMs']) assert.ok(key in r, key);
  assert.deepEqual([r.calls, r.tris, r.shadowCalls, r.shadowTris, r.shadowUpdates, r.frames], [10, 1000, 5, 100, 1, 1]);
  assert.deepEqual([r.programs, r.envReady, r.toneMapping, r.exposure, r.pixelRatio, r.gpuMs, r.gpuTimer, r.infoAutoReset],
    [3, false, 'ACESFilmic', 0.88, 1.25, null, 'unavailable', true]);
  assert.deepEqual(r.casters, []);
  assert.deepEqual(look.setGpuTimer(true), { available: false, enabled: false });
  look.setEnvReady(true);
  assert.equal(look.readout().envReady, true);
  assert.throws(() => createLookDev({ scene }), TypeError);
});
