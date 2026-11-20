// Look development for the operating room (docs/improvement-plan/13_VISUAL_QUALITY_PLAN.md).
//
// Q1 builds only the measurement part: honest render counters for the ?qa readout, so every later look
// change (Q2 shadow scheduling, Q3 tone mapping, Q4 image-based lighting, Q6 contact occlusion) is judged
// against numbers instead of guesses. Nothing here changes what is drawn:
//  * renderer.info.autoReset stays true, so the overlay's draw calls and triangles (M8/M9) keep meaning
//    "main pass of the last render", exactly as in the P0/P1 baselines;
//  * the shadow pass runs inside WebGLRenderer.render before info.reset(), so its draws never reach M8.
//    The wrapper on renderer.shadowMap.render reads the info deltas around it and keeps them separately;
//  * the wrappers call the originals with the same arguments and return their results;
//  * after a WebGL context loss and restore three.js replaces renderer.info and renderer.shadowMap; the
//    counters follow the new objects (installRenderCounters), so the readout never reads a dead one.
//
// Like the other domain modules this file does not import three.js: it reads plain properties of the
// objects the runtime hands over, so it runs in node against npm three@0.180.0 in the unit tests.

// WebGLRenderer.toneMapping codes in three r180 (constants.js: NoToneMapping 0 … NeutralToneMapping 7).
export const TONE_MAPPING_NAMES = Object.freeze({
  0: 'None', 1: 'Linear', 2: 'Reinhard', 3: 'Cineon', 4: 'ACESFilmic', 5: 'Custom', 6: 'AgX', 7: 'Neutral',
});

export function toneMappingName(code) {
  return TONE_MAPPING_NAMES[code] ?? `unknown(${code})`;
}

// three r180 WebGLShadowMap.render skips the whole pass when shadows are off, the map is frozen
// (autoUpdate and needsUpdate both false) or no light casts; then it skips each light whose shadow is
// frozen the same way. The count of light maps it redraws follows that rule exactly.
export function shadowMapUpdates(shadowMap, lights) {
  if (!shadowMap.enabled || (shadowMap.autoUpdate === false && shadowMap.needsUpdate === false) || !lights?.length) return 0;
  let updates = 0;
  for (const light of lights) {
    const shadow = light?.shadow;
    if (!shadow || (shadow.autoUpdate === false && shadow.needsUpdate === false)) continue;
    updates += 1;
  }
  return updates;
}

// Optional GPU time of one canvas frame through EXT_disjoint_timer_query_webgl2 (WebGL 2). The query
// brackets the whole renderer.render() call to the canvas, and three.js draws the shadow pass inside that
// call, so gpuMs is shadow pass + main pass (offscreen renders such as the scope feed are not included).
// Chrome and Edge may expose the extension; WebKit and real Safari do not, so gpuMs is null there and frame
// pacing is the measure. Results arrive a few frames late; a disjoint event (GPU reset, power change)
// discards the pending ones.
//
// A lost WebGL context takes its queries and its extension object with it. While the context is lost the
// timer neither starts nor polls queries (createQuery returns null then, and WebGL reports every query as
// available with a null result, which would read as 0 ms). reset() is called when the context is restored:
// it drops the queries of the old context without passing them to the new one (WebGL rejects objects
// from an earlier context) and fetches the extension again.
export function createGpuTimer(gl, { keep = 60 } = {}) {
  let ext = null;
  let available = false;
  const pending = [];
  const recent = [];
  let active = null;
  let enabled = false;
  let discarded = 0;
  let dropped = 0;
  let resets = 0;

  function connect() {
    ext = gl?.getExtension?.('EXT_disjoint_timer_query_webgl2') ?? null;
    available = Boolean(ext && typeof gl.createQuery === 'function');
  }
  const lost = () => gl?.isContextLost?.() === true;
  connect();

  function poll() {
    if (!available || lost()) return;
    if (gl.getParameter(ext.GPU_DISJOINT_EXT)) {
      for (const query of pending) gl.deleteQuery(query);
      discarded += pending.length;
      pending.length = 0;
      return;
    }
    while (pending.length && gl.getQueryParameter(pending[0], gl.QUERY_RESULT_AVAILABLE)) {
      const query = pending.shift();
      const ns = gl.getQueryParameter(query, gl.QUERY_RESULT);
      // Results that arrive after the timer was switched off are dropped, so a later read starts clean.
      if (enabled && Number.isFinite(ns)) recent.push(ns / 1e6);
      gl.deleteQuery(query);
      if (recent.length > keep) recent.shift();
    }
  }
  return {
    get available() { return available; },
    get enabled() { return enabled; },
    get resets() { return resets; },
    setEnabled(on) {
      enabled = Boolean(on) && available;
      if (!enabled) { recent.length = 0; }
      return enabled;
    },
    begin() {
      if (!enabled || active || lost()) return false;
      poll();
      // A few frames in flight are normal; a long backlog means results stopped arriving, so stop timing.
      if (pending.length > 8) return false;
      const query = gl.createQuery();
      if (!query) return false;
      active = query;
      gl.beginQuery(ext.TIME_ELAPSED_EXT, active);
      return true;
    },
    end() {
      if (!active) return;
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      pending.push(active);
      active = null;
    },
    // After a context restore: forget the old context's queries and samples, fetch the extension again and
    // keep the on/off choice if the restored context still has the extension.
    reset() {
      dropped += pending.length + (active ? 1 : 0);
      pending.length = 0;
      active = null;
      recent.length = 0;
      resets += 1;
      const wasEnabled = enabled;
      connect();
      enabled = wasEnabled && available;
    },
    // Median of the last `keep` frame times in milliseconds, or null.
    read() {
      poll();
      if (!recent.length) return null;
      const sorted = [...recent].sort((a, b) => a - b);
      return { medianMs: sorted[Math.floor(sorted.length / 2)], samples: sorted.length, pending: pending.length, discarded, dropped, resets };
    },
  };
}

// Wraps renderer.render and renderer.shadowMap.render to count, per main frame, the shadow pass's draw
// calls and triangles and the number of light maps redrawn. A "main frame" ends with a render to the
// canvas (render target null); offscreen renders before it (the scope feed) add their shadow passes to
// the same frame, because they cost the same GPU time in that frame.
//
// WebGL context loss. When a lost context is restored, three r180 (onContextRestore → initGLContext)
// builds new renderer.info and renderer.shadowMap objects, and its render() uses the new ones from then
// on. So nothing here keeps either object: info is read from the renderer at every use, and the shadow
// map that was wrapped is compared with renderer.shadowMap on the restore event and before every render;
// a new map is wrapped before its first frame (counted in rebuilds). Frames issued while the context is
// lost draw nothing (three returns at once once it knows, and before its lost event every GL call is a
// no-op although info still counts), so they are counted as lostFrames and leave frames, shadowUpdates
// and the last-frame numbers alone: those always describe frames that reached the canvas.
export function installRenderCounters(renderer, { gpuTimer = null } = {}) {
  const originalRender = renderer.render;
  const gl = renderer.getContext?.() ?? null;
  const canvas = renderer.domElement ?? null;
  const pending = { shadowCalls: 0, shadowTris: 0, shadowUpdates: 0, renders: 0 };
  const last = { calls: 0, tris: 0, shadowCalls: 0, shadowTris: 0, shadowUpdates: 0, renders: 0 };
  const totals = { frames: 0, renders: 0, shadowUpdates: 0, shadowCalls: 0, shadowTris: 0, lostFrames: 0 };
  const context = { losses: 0, restores: 0, rebuilds: 0 };
  const lost = () => gl?.isContextLost?.() === true;
  const clearPending = () => { pending.shadowCalls = 0; pending.shadowTris = 0; pending.shadowUpdates = 0; pending.renders = 0; };

  function wrapShadowMap(map) {
    const original = map.render;
    const wrapper = function countedShadowRender(lights, scene, camera) {
      const counts = renderer.info.render;
      const calls = counts.calls, tris = counts.triangles;
      const updates = shadowMapUpdates(map, lights);
      const result = original.call(this, lights, scene, camera);
      pending.shadowCalls += counts.calls - calls;
      pending.shadowTris += counts.triangles - tris;
      pending.shadowUpdates += updates;
      return result;
    };
    map.render = wrapper;
    return { map, original, wrapper };
  }
  let wrapped = wrapShadowMap(renderer.shadowMap);
  let seenInfo = renderer.info;

  // Follows a rebuilt renderer: wraps the new shadow map (and gives the old one its own function back,
  // so uninstall has only the current map to deal with), drops the frame in progress and resets the GPU
  // timer, whose queries belonged to the old context. Returns whether anything had been replaced.
  function follow() {
    if (renderer.shadowMap === wrapped.map && renderer.info === seenInfo) return false;
    if (renderer.shadowMap !== wrapped.map) {
      if (wrapped.map.render === wrapped.wrapper) wrapped.map.render = wrapped.original;
      wrapped = wrapShadowMap(renderer.shadowMap);
    }
    seenInfo = renderer.info;
    context.rebuilds += 1;
    clearPending();
    gpuTimer?.reset();
    return true;
  }
  // three registers its own listeners in the WebGLRenderer constructor, before these, so on the restore
  // event the new objects already exist. The check before every render covers any other order.
  const onLost = () => { context.losses += 1; clearPending(); };
  const onRestored = () => { context.restores += 1; if (!follow()) gpuTimer?.reset(); };
  canvas?.addEventListener?.('webglcontextlost', onLost, false);
  canvas?.addEventListener?.('webglcontextrestored', onRestored, false);

  const render = function countedRender(scene, camera) {
    follow();
    const main = renderer.getRenderTarget() === null;
    const lostBefore = lost();
    const timing = main && !lostBefore && gpuTimer ? gpuTimer.begin() : false;
    let result;
    try {
      result = originalRender.call(this, scene, camera);
    } finally {
      if (timing) gpuTimer.end();
    }
    if (lostBefore || lost()) {
      if (main) totals.lostFrames += 1;
      clearPending();
      return result;
    }
    pending.renders += 1;
    if (main) {
      const counts = renderer.info.render;
      Object.assign(last, { calls: counts.calls, tris: counts.triangles }, pending);
      totals.frames += 1;
      totals.renders += pending.renders;
      totals.shadowUpdates += pending.shadowUpdates;
      totals.shadowCalls += pending.shadowCalls;
      totals.shadowTris += pending.shadowTris;
      clearPending();
    }
    return result;
  };
  renderer.render = render;

  return {
    lastFrame: () => ({ ...last }),
    totals: () => ({ ...totals }),
    context: () => ({ ...context, lost: lost() }),
    gpuTimer,
    // Puts the originals back only if nobody wrapped them after us (a test hook may chain on top).
    uninstall() {
      let restored = true;
      canvas?.removeEventListener?.('webglcontextlost', onLost, false);
      canvas?.removeEventListener?.('webglcontextrestored', onRestored, false);
      if (wrapped.map.render === wrapped.wrapper) wrapped.map.render = wrapped.original; else restored = false;
      if (renderer.render === render) renderer.render = originalRender; else restored = false;
      return restored;
    },
  };
}

function reachable(object, root) {
  for (let o = object; o; o = o.parent) {
    if (o.visible === false) return false;
    if (o === root) return true;
  }
  return false;
}

// The census groups casters by their top-level object below the scene. The room is one unnamed Group with
// about 70 children, so for an unnamed top level the key also names the second level ("Group/Scene").
function topGroup(object, root) {
  const chain = [];
  for (let o = object; o && o !== root; o = o.parent) chain.unshift(o);
  const [top, second] = chain;
  if (top.name || !second) return top.name || top.type;
  return `${top.type}/${second.name || second.type}`;
}

// Which meshes each shadow-casting light draws, by the shadow pass's own rule (three r180 WebGLShadowMap
// renderObject): the object and every ancestor visible, its layers seen by the main camera, castShadow,
// and inside the light's shadow frustum unless frustumCulled is false. The frustum is the one three.js
// computed at its last shadow render (LightShadow.getFrustum); objects whose bounding sphere was never
// computed are counted as drawn (the pass would compute it) and listed, never computed here.
export function casterCensus(scene, { camera = null, detail = false } = {}) {
  const lights = [];
  const casters = [];
  scene.traverse((o) => {
    if (o.isLight && o.castShadow && o.shadow) lights.push(o);
    if ((o.isMesh || o.isLine || o.isPoints) && o.castShadow) casters.push(o);
  });
  const sphereOf = (o) => (o.boundingSphere !== undefined ? o.boundingSphere : o.geometry?.boundingSphere ?? null);
  return lights.map((light) => {
    const frustum = light.shadow.getFrustum?.() ?? null;
    const summary = { light: light.name || light.type, type: light.type, lit: reachable(light, scene),
      mapSize: light.shadow.mapSize ? [light.shadow.mapSize.x, light.shadow.mapSize.y] : null,
      autoUpdate: light.shadow.autoUpdate !== false,
      casters: casters.length, visible: 0, drawn: 0, alwaysDrawn: 0, drawCalls: 0, sphereMissing: 0 };
    const groups = detail ? new Map() : null;
    for (const o of casters) {
      const seen = reachable(o, scene) && (!camera || o.layers.test(camera.layers));
      let drawn = false;
      if (seen) {
        summary.visible += 1;
        if (!o.frustumCulled) { drawn = true; summary.alwaysDrawn += 1; }
        else if (!frustum) drawn = true;
        else if (sphereOf(o) === null) { drawn = true; summary.sphereMissing += 1; }
        else drawn = frustum.intersectsObject(o);
      }
      if (drawn) {
        summary.drawn += 1;
        const materials = o.material;
        summary.drawCalls += Array.isArray(materials)
          ? (o.geometry?.groups ?? []).filter((g) => materials[g.materialIndex]?.visible).length
          : (materials?.visible ? 1 : 0);
      }
      if (groups) {
        const name = topGroup(o, scene);
        const g = groups.get(name) ?? { group: name, casters: 0, visible: 0, drawn: 0, alwaysDrawn: 0 };
        g.casters += 1;
        if (seen) g.visible += 1;
        if (drawn) g.drawn += 1;
        if (seen && !o.frustumCulled) g.alwaysDrawn += 1;
        groups.set(name, g);
      }
    }
    if (groups) summary.groups = [...groups.values()].sort((a, b) => b.casters - a.casters);
    return summary;
  });
}

// The look-development state and its ?qa readout. With qa false nothing is wrapped and readout() still
// answers from the renderer's own fields (counters are then null).
export function createLookDev({ renderer, scene, camera = null, qa = false, gpuTimer = false } = {}) {
  if (!renderer || !scene) throw new TypeError('LookDev needs the renderer and the scene.');
  const timer = qa ? createGpuTimer(renderer.getContext?.()) : null;
  if (timer && gpuTimer) timer.setEnabled(true);
  const counters = qa ? installRenderCounters(renderer, { gpuTimer: timer }) : null;
  // Set by the environment capture of Q4; false until then (there is no environment map today).
  let envReady = false;

  // Every renderer field is read here, at call time: renderer.info is a new object after a context restore.
  // The caster census walks the scene (about 0.2-1 ms); this runs when the QA API is asked, never per frame.
  function readout() {
    const frame = counters?.lastFrame() ?? null;
    const totals = counters?.totals() ?? null;
    const context = counters?.context() ?? null;
    const gpu = timer?.read() ?? null;
    return {
      calls: frame ? frame.calls : renderer.info.render.calls,
      tris: frame ? frame.tris : renderer.info.render.triangles,
      shadowCalls: frame?.shadowCalls ?? null,
      shadowTris: frame?.shadowTris ?? null,
      // Cumulative light-map redraws since boot; Q2 checks that idle and look-only frames add 0.
      shadowUpdates: totals?.shadowUpdates ?? null,
      shadowUpdatesLastFrame: frame?.shadowUpdates ?? null,
      frames: totals?.frames ?? null,
      rendersLastFrame: frame?.renders ?? null,
      programs: renderer.info.programs?.length ?? null,
      casters: casterCensus(scene, { camera }),
      envReady,
      toneMapping: toneMappingName(renderer.toneMapping),
      exposure: renderer.toneMappingExposure,
      pixelRatio: renderer.getPixelRatio(),
      // GPU time of the canvas frame: shadow pass + main pass (see createGpuTimer). Median over the last 60.
      gpuMs: gpu ? Number(gpu.medianMs.toFixed(3)) : null,
      gpuTimer: timer ? (timer.available ? (timer.enabled ? 'on' : 'off') : 'unavailable') : null,
      gpuSamples: gpu?.samples ?? 0,
      gpuTimerResets: timer?.resets ?? null,
      infoAutoReset: renderer.info.autoReset,
      // WebGL context loss: whether it is lost now, lost and restored events since boot, how often the
      // counters followed a rebuilt renderer.info/shadowMap, and canvas frames issued while lost (not in frames).
      contextLost: context?.lost ?? null,
      contextLosses: context?.losses ?? null,
      contextRestores: context?.restores ?? null,
      rendererRebuilds: context?.rebuilds ?? null,
      lostFrames: totals?.lostFrames ?? null,
    };
  }
  return {
    counters,
    readout,
    census: (options = {}) => casterCensus(scene, { camera, ...options }),
    setGpuTimer: (on) => ({ available: Boolean(timer?.available), enabled: timer ? timer.setEnabled(on) : false }),
    get envReady() { return envReady; },
    setEnvReady(value) { envReady = Boolean(value); },
  };
}
