// Grab-anywhere and visual-quality checks (docs/improvement-plan/12_GRAB_ANYWHERE_DESIGN.md and
// 13_VISUAL_QUALITY_PLAN.md), one describe block per cluster of the work-list.
//
// Q1 (measure, no visual change):
//  * Q1-a: the ?qa render readout (getSimulationState().render, getRenderStats, renderCensus, setGpuTimer)
//    is present and agrees with the renderer: main-pass counts equal the ?debug=1 overlay (M8/M9), the
//    shadow pass's measured draw calls equal the caster census's prediction, one light-map redraw per
//    frame (today the key light redraws every frame; Q2 changes that).
//  * Q1-c: the readout stays right across a WebGL context loss and restore (forced with WEBGL_lose_context),
//    checked against draw calls counted at the WebGL level; the GPU timer measures again after the restore.
//  * Q1-b: image-metric baselines for the later look clusters, measured on V1 and V2: lamp-luma regions
//    plus the table rail, skin hue by luma tercile, temporal shimmer under a half-pixel camera jitter, and
//    joint-band luma patches at the elbows, axillae and knees.
// The V1–V4 pixel-diff gate is tests/browser/pixel-diff.mjs (it needs the base commit's tree).
//
// G1 (foundations) and G2 (supports and the supine rest on them): see their blocks below.
//
// Same fixture pattern as interaction.spec.mjs: boot /?qa&debug=1, wait for #model-status[data-state="ready"],
// read window.__studioQA. Read-only with respect to the app, except the half-pixel camera offset of the
// shimmer metric (restored within the same task) and test renders through the three.js devtools hook.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect } from '@playwright/test';
import {
  lumaRegions, skinHueTerciles, lumaDifference, patchLuma, RENDER_HOOK, GL_DRAW_COUNTER, countedFrame, readCanvas, projectToCanvas, boneWorld,
  skinAlongView,
} from './render-metrics.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const SERVER = process.env.NABD_SMOKE_SERVER === 'vite' ? 'vite-preview' : 'serve';
const EVIDENCE = path.resolve(process.env.NABD_EVIDENCE_DIR || path.join(root, 'docs/improvement-plan/evidence/grab-anywhere'));
const ENTRY = '/?qa&debug=1';
const WIDE = { width: 1440, height: 900 };
const NARROW = { width: 560, height: 890 };
const sizeName = ({ width, height }) => `${width}x${height}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const round = (x, n = 3) => (Number.isFinite(x) ? Number(x.toFixed(n)) : x);

const test = base.extend({
  cluster: ['Q1', { option: true }],
  nabd: async ({ page, browser, browserName, cluster }, use, testInfo) => {
    const project = testInfo.project.name;
    const dir = path.join(EVIDENCE, cluster, `${SERVER}-${project}-headless`);
    const log = { console: [], pageErrors: [] };
    page.on('console', (m) => log.console.push({ type: m.type(), text: m.text().slice(0, 600) }));
    page.on('pageerror', (e) => log.pageErrors.push({ text: String(e?.message ?? e).slice(0, 600) }));
    const helper = {
      project, dir, log,
      errors: () => [
        ...log.console.filter((m) => m.type === 'error').map((m) => `console.error: ${m.text}`),
        ...log.pageErrors.map((e) => `pageerror: ${e.text}`),
      ],
      contextLost: () => log.console.filter((m) => /context lost/i.test(m.text)).length,
      async boot() {
        await page.goto(ENTRY, { waitUntil: 'load' });
        await page.locator('#model-status[data-state="ready"]').waitFor({ state: 'attached', timeout: 60_000 });
        await page.waitForFunction(() => Boolean(window.__studioQA), null, { timeout: 10_000 });
        await sleep(2000);
      },
      sim: () => page.evaluate(() => window.__studioQA.getSimulationState()),
      waitFor: (fn, arg, timeout = 15_000) => page.waitForFunction(fn, arg, { timeout, polling: 100 }),
      async waitIdle(timeout = 20_000) {
        await page.waitForFunction(() => !window.__studioQA.workMoving(), null, { timeout, polling: 100 });
      },
      async cameraSteady(timeout = 10_000) {
        const end = Date.now() + timeout;
        let previous = await page.evaluate(() => window.__studioQA.getCamera());
        while (Date.now() < end) {
          await sleep(250);
          const current = await page.evaluate(() => window.__studioQA.getCamera());
          if (current.every((v, i) => Math.abs(v - previous[i]) < 1e-4)) return current;
          previous = current;
        }
        return previous;
      },
      canvas: () => page.evaluate(() => {
        const b = document.querySelector('#viewport canvas').getBoundingClientRect();
        return { left: b.left, top: b.top, width: b.width, height: b.height };
      }),
      counters: () => page.evaluate(() => {
        const read = (key) => document.querySelector(`.nabd-diagnostics [data-metric="${key}"]`)?.textContent ?? null;
        const number = (text) => (text ? Number(text.replace(/[^0-9.]/g, '')) : null);
        return { drawCalls: number(read('draw')), triangles: number(read('triangles')) };
      }),
      save(name, data) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify({
          check: name, cluster, server: SERVER, project, browser: browserName, browserVersion: browser.version(),
          viewport: page.viewportSize(), capturedAt: new Date().toISOString(), attempt: testInfo.retry,
          webglContextLostMessages: helper.contextLost(), ...data,
        }, null, 2));
      },
      async shot(name) {
        fs.mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: path.join(dir, `${name}.jpg`), type: 'jpeg', quality: 80 });
      },
    };
    await use(helper);
  },
});

// ================================================================= Q1-a render readout
const READOUT_KEYS = ['calls', 'tris', 'shadowCalls', 'shadowTris', 'shadowUpdates', 'programs', 'casters', 'envReady',
  'toneMapping', 'exposure', 'pixelRatio', 'gpuMs'];

for (const size of [WIDE, NARROW]) {
  test.describe(`Q1 render readout ${sizeName(size)}`, () => {
    test.use({ viewport: size });

    test(`Q1-a the render readout is present and agrees with the renderer (${sizeName(size)})`, async ({ page, nabd }) => {
      await nabd.boot();
      const result = {};
      // Read the readout and the overlay in a quiet moment: the overlay refreshes every 450 ms from the
      // same renderer.info, so two reads agree once the view is still.
      let render = null, overlay = null;
      for (let k = 0; k < 10; k += 1) {
        await sleep(600);
        render = (await nabd.sim()).render;
        overlay = await nabd.counters();
        if (overlay.drawCalls === render.calls && overlay.triangles === render.tris) break;
      }
      result.render = render;
      result.overlay = overlay;
      result.getRenderStats = await page.evaluate(() => window.__studioQA.getRenderStats());
      const census = await page.evaluate(() => window.__studioQA.renderCensus());
      result.census = census;
      result.pixelRatioExpected = await page.evaluate(() => Math.min(window.devicePixelRatio || 1, matchMedia('(max-width: 650px)').matches ? 1.5 : 1.8));

      // Frames counted only when the app renders (dirty flag): the vitals monitor keeps V1 rendering.
      const before = await page.evaluate(() => window.__studioQA.getRenderStats());
      await sleep(1000);
      const after = await page.evaluate(() => window.__studioQA.getRenderStats());
      result.oneSecond = { frames: after.frames - before.frames, shadowUpdates: after.shadowUpdates - before.shadowUpdates };

      // Optional GPU timer (EXT_disjoint_timer_query_webgl2): off by default; where available it reports.
      result.gpuTimerDefault = { gpuTimer: render.gpuTimer, gpuMs: render.gpuMs };
      result.gpuTimerSwitch = await page.evaluate(() => window.__studioQA.setGpuTimer(true));
      if (result.gpuTimerSwitch.available) {
        await page.waitForFunction(() => window.__studioQA.getRenderStats().gpuSamples >= 10, null, { timeout: 8_000, polling: 100 }).catch(() => {});
      }
      const timed = await page.evaluate(() => window.__studioQA.getRenderStats());
      result.gpu = { gpuTimer: timed.gpuTimer, gpuMs: timed.gpuMs, gpuSamples: timed.gpuSamples };
      result.gpuTimerOff = await page.evaluate(() => window.__studioQA.setGpuTimer(false));
      nabd.save(`Q1-a-render-readout-${sizeName(size)}`, { result, errors: nabd.errors() });

      for (const key of READOUT_KEYS) expect(render, `render.${key}`).toHaveProperty(key);
      expect(result.getRenderStats).toEqual(expect.objectContaining(Object.fromEntries(READOUT_KEYS.filter((k) => k !== 'gpuMs' && k !== 'casters')
        .map((k) => [k, expect.anything()]))));
      expect(render.infoAutoReset, 'renderer.info.autoReset stays true (M8/M9 keep their meaning)').toBe(true);
      expect(render.calls, 'main-pass draw calls = the overlay (M8)').toBe(overlay.drawCalls);
      expect(render.tris, 'main-pass triangles = the overlay (M9)').toBe(overlay.triangles);
      expect(render.shadowCalls, 'the shadow pass is counted').toBeGreaterThan(0);
      expect(render.shadowTris).toBeGreaterThan(0);
      expect(render.casters, 'one shadow-casting light (the key light)').toHaveLength(1);
      const key = render.casters[0];
      expect(key.lit).toBe(true);
      expect(render.shadowCalls, 'measured shadow draws = the census prediction').toBe(key.drawCalls);
      expect(key.visible).toBeLessThanOrEqual(key.casters);
      expect(key.drawn).toBeLessThanOrEqual(key.visible);
      expect(census[0].groups.reduce((n, g) => n + g.casters, 0), 'census groups add up').toBe(key.casters);
      expect(render.shadowUpdatesLastFrame).toBe(1);
      expect(render.shadowUpdates, 'today the key light map is redrawn on every frame').toBe(render.frames);
      expect(result.oneSecond.frames, 'the app renders while idle (vitals)').toBeGreaterThan(0);
      expect(result.oneSecond.shadowUpdates).toBe(result.oneSecond.frames);
      expect(render.programs).toBeGreaterThan(0);
      expect(render.envReady).toBe(false);
      expect(render.toneMapping).toBe('ACESFilmic');
      expect(render.exposure).toBe(0.88);
      expect(render.pixelRatio).toBe(result.pixelRatioExpected);
      expect(render.gpuMs, 'GPU timer off by default').toBeNull();
      expect(['off', 'unavailable']).toContain(render.gpuTimer);
      if (result.gpuTimerSwitch.available) {
        expect(result.gpu.gpuTimer).toBe('on');
        expect(result.gpu.gpuMs, 'GPU time of the canvas frame (shadow + main pass) in ms').toBeGreaterThan(0);
      } else {
        expect(result.gpu.gpuMs).toBeNull();
      }
      expect(result.gpuTimerOff.enabled).toBe(false);
      // A session whose context was lost and restored at boot (WebKit here, now and then) must read the same.
      result.context = pickContext(render);
      expect(render.contextLost, 'the readout is from a live context').toBe(false);
      expect(render.rendererRebuilds, 'the counters followed every rebuild of the renderer').toBe(render.contextRestores);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });
  });
}
const pickContext = (r) => ({ contextLost: r.contextLost, contextLosses: r.contextLosses, contextRestores: r.contextRestores,
  rendererRebuilds: r.rendererRebuilds, lostFrames: r.lostFrames, gpuTimerResets: r.gpuTimerResets });

// ================================================================= Q1-c readout across a WebGL context restore
// three r180 builds new renderer.info and renderer.shadowMap objects when a lost context is restored. The
// readout must follow them: before the fix it kept the boot objects and, after a restore, said shadowCalls 0
// and stopped counting light-map redraws while the GL went on drawing both passes. The loss is forced with
// WEBGL_lose_context; every frame is checked against GL_DRAW_COUNTER, which counts at the WebGL level.
test.describe('Q1 context restore 1440x900', () => {
  test.use({ viewport: WIDE });

  test('Q1-c the render readout follows a WebGL context loss and restore (1440x900)', async ({ page, nabd }, testInfo) => {
    test.setTimeout(120_000);
    await page.addInitScript(RENDER_HOOK);
    await page.addInitScript(GL_DRAW_COUNTER);
    await nabd.boot();
    const stats = () => page.evaluate(() => window.__studioQA.getRenderStats());
    const result = {};
    let gpuOn = false, boot = null, overlay = null, render = null;
    const contextConsole = () => nabd.log.console.filter((m) => /context/i.test(m.text)).map((m) => `${m.type}: ${m.text}`);
    // A failed attempt keeps its evidence under its own name, so a WebKit retry can be told apart: WebKit on
    // Windows sometimes loses the restored context again by itself and stops answering (2 of 8 forced restores
    // with this code and 2 of 8 with the code before the fix, each after its own "WebGL: context lost.").
    try {
      result.gpuTimerSwitch = await page.evaluate(() => window.__studioQA.setGpuTimer(true));
      gpuOn = result.gpuTimerSwitch.available;
      if (gpuOn) await nabd.waitFor(() => window.__studioQA.getRenderStats().gpuSamples >= 5, null, 10_000);
      boot = await stats();
      result.boot = { ...pickContext(boot), frames: boot.frames, gpuMs: boot.gpuMs, gpuSamples: boot.gpuSamples };
      result.before = await countedFrame(page);

      result.lose = await page.evaluate(() => {
        const renderer = window.__q1.renderers[0];
        const ext = renderer.getContext().getExtension('WEBGL_lose_context');
        if (!ext) return { extension: false };
        window.__q1.loseContext = ext;
        window.__q1.bootObjects = { shadowMap: renderer.shadowMap, info: renderer.info };
        ext.loseContext();
        return { extension: true };
      });
      expect(result.lose.extension, 'WEBGL_lose_context exists').toBe(true);
      await nabd.waitFor((losses) => window.__studioQA.getRenderStats().contextLosses === losses + 1, boot.contextLosses);
      const lostA = await stats();
      await sleep(1000);
      const lostB = await stats();
      result.whileLost = { contextLost: lostB.contextLost, framesAdded: lostB.frames - lostA.frames, lostFramesAdded: lostB.lostFrames - lostA.lostFrames,
        shadowUpdatesAdded: lostB.shadowUpdates - lostA.shadowUpdates };

      await page.evaluate(() => window.__q1.loseContext.restoreContext());
      await nabd.waitFor((restores) => { const s = window.__studioQA.getRenderStats(); return s.contextRestores === restores + 1 && !s.contextLost; },
        boot.contextRestores);
      // The vitals monitor keeps V1 rendering, so frames go on after the restore; give three time to re-upload.
      await nabd.waitFor((frames) => window.__studioQA.getRenderStats().frames >= frames + 10, lostB.frames, 20_000);
      if (gpuOn) await nabd.waitFor(() => window.__studioQA.getRenderStats().gpuSamples >= 5, null, 10_000);
      result.after = await countedFrame(page);
      result.replaced = await page.evaluate(() => {
        const renderer = window.__q1.renderers[0];
        return { shadowMap: renderer.shadowMap !== window.__q1.bootObjects.shadowMap, info: renderer.info !== window.__q1.bootObjects.info };
      });
      const a = await stats();
      await sleep(1000);
      const b = await stats();
      result.oneSecondAfter = { frames: b.frames - a.frames, shadowUpdates: b.shadowUpdates - a.shadowUpdates };
      // The overlay (M8/M9) reads renderer.info live every 450 ms; it agrees with the readout once the view is still.
      for (let k = 0; k < 10; k += 1) {
        await sleep(600);
        render = await stats();
        overlay = await nabd.counters();
        if (overlay.drawCalls === render.calls && overlay.triangles === render.tris) break;
      }
      result.overlay = overlay;
      result.render = { calls: render.calls, tris: render.tris, shadowCalls: render.shadowCalls, shadowTris: render.shadowTris,
        shadowUpdates: render.shadowUpdates, frames: render.frames, census: render.casters[0], gpuTimer: render.gpuTimer, gpuMs: render.gpuMs,
        gpuSamples: render.gpuSamples, ...pickContext(render) };
      await page.evaluate(() => window.__studioQA.setGpuTimer(false));
      // The app answers a context loss with its own error notice (it asks for a reload); that is app behaviour,
      // recorded here, not part of the readout.
      result.appNotice = await page.evaluate(() => ({ modelStatus: document.querySelector('#model-status')?.dataset.state ?? null,
        loading: document.querySelector('#loading-state')?.hidden === false }));
      nabd.save('Q1-c-context-restore-1440x900', { result, contextConsole: contextConsole(), errors: nabd.errors() });
    } catch (error) {
      nabd.save(`Q1-c-context-restore-1440x900-failed-attempt${testInfo.retry}`, { failedAt: String(error?.message ?? error).slice(0, 400),
        result, contextConsole: contextConsole(), errors: nabd.errors() });
      throw error;
    }

    // Before the loss the readout matches the draws counted at the WebGL level.
    expect(result.before.glDraws, 'GL draws = main + shadow (before)').toBe(result.before.calls + result.before.shadowCalls);
    expect(result.before.glTris).toBe(result.before.tris + result.before.shadowTris);
    expect(result.before.shadowCalls).toBeGreaterThan(0);
    // While lost nothing is drawn: no rendered frame and no light-map redraw is counted; the frames are kept apart.
    expect(result.whileLost.contextLost).toBe(true);
    expect(result.whileLost.framesAdded, 'no rendered frame while lost').toBe(0);
    expect(result.whileLost.shadowUpdatesAdded).toBe(0);
    expect(result.whileLost.lostFramesAdded, 'the app still issued frames').toBeGreaterThan(0);
    // three really rebuilt both objects, so this is the case that went stale before the fix.
    expect(result.replaced).toEqual({ shadowMap: true, info: true });
    expect(result.after.shadowMapRender, 'the new shadow map is wrapped').toBe('countedShadowRender');
    expect(result.after.glDraws, 'GL draws = main + shadow (after the restore)').toBe(result.after.calls + result.after.shadowCalls);
    expect(result.after.glTris).toBe(result.after.tris + result.after.shadowTris);
    expect(result.after.calls, 'main pass read from the live renderer.info').toBe(result.after.liveInfoCalls);
    expect(result.after.tris).toBe(result.after.liveInfoTris);
    expect(result.after.shadowCalls, 'shadow pass counted again').toBeGreaterThan(0);
    expect(result.render.shadowCalls, 'measured shadow draws = the census prediction').toBe(result.render.census.drawCalls);
    expect(result.render.calls, 'main pass = the overlay (M8)').toBe(overlay.drawCalls);
    expect(result.render.tris, 'M9').toBe(overlay.triangles);
    expect(result.oneSecondAfter.frames).toBeGreaterThan(0);
    expect(result.oneSecondAfter.shadowUpdates, 'light-map redraws count again').toBe(result.oneSecondAfter.frames);
    expect(result.render.contextLosses).toBe(boot.contextLosses + 1);
    expect(result.render.contextRestores).toBe(boot.contextRestores + 1);
    expect(result.render.rendererRebuilds).toBe(boot.rendererRebuilds + 1);
    expect(result.render.contextLost).toBe(false);
    if (gpuOn) {
      expect(result.render.gpuTimerResets, 'GPU timer reset on the restore').toBe(boot.gpuTimerResets + 1);
      expect(result.render.gpuTimer).toBe('on');
      expect(result.render.gpuSamples, 'GPU timer measures again').toBeGreaterThanOrEqual(5);
      expect(result.render.gpuMs).toBeGreaterThan(0);
    } else {
      expect(result.render.gpuMs).toBeNull();
    }
    expect(nabd.errors(), 'M11 = 0').toEqual([]);
  });
});

// ================================================================= Q1-b image-metric baselines
// All image metrics read the rendered pixels back from the canvas (readCanvas): no DOM overlay, no compositor,
// and the WebKit drill view is measurable (its page screenshot is a blank canvas, at the base commit too).
// V1 regions in canvas pixels at 1440×900 (canvas box 17, 83, 1054 × 618; page = canvas + (17, 83)).
// canvas, patientTorso, tablePadsNear and room are the C6 lamp-luma regions
// (evidence/p1-interaction/c6-before-after/lamp-luma-V1.json, page pixels there). C6 measured page screenshots,
// so its room rectangle also held a 5 px strip of the «منطقة العمل» button; the readback has none.
// rail is the rectangle below the pad edge on the near side of the table, between the patient's left hand and the
// right glove's sleeve, as first recorded. By rows (canvas y, Chrome): 530-536 the light pad edge (luma about
// 200), 537-549 the black gap under it (about 28), 550-557 the steel side-rail bar, 558-574 the lower frame
// stripes; so only about a fifth of it is the bar. railBar is the bar alone: its six full rows 551-556 (row
// means 142.1-142.9, blue-grey; 550 and 557 are anti-aliased edges), no glove or pad pixel. Q4 ("rail mean and
// contrast up") should be judged on railBar; railRows records the row profile so a later cluster can check the
// bar is still where railBar looks. torsoSkin is a chest and abdomen patch that is 98 % skin. nearLeftHand is
// the back of the patient's left hand and the fingers with the teal pad between them (it was first called
// nearForearm, but it is not the forearm; the forearm is measured in V2 by forearmPatch).
//
// G2 (F27, the supine rest on the pads) changed the V1 picture on purpose: the table top is 52.5 mm lower and the
// arms and hands lie on the pad. The regions that follow what moved were re-placed on the G2 picture (Q1 values in
// brackets): rail [473, 531, 668, 575] and railBar [473, 551, 668, 557] are 18 rows lower, the bar's full rows now
// 569-575 (568 the dark gap, 576 its edge); torsoSkin [603, 257, 823, 312] is 15 rows lower to stay on skin
// (99.9 %; 81 % at the old place); nearLeftHand [463, 477, 543, 517] follows the left hand to its new place.
// The lamp-luma regions keep their rectangles; their reference is now the G2 picture (G2_LAMP_LUMA), measured by
// this test on the G2 tree; the C6 values stay recorded (lumaVsC6). Evidence: evidence/grab-anywhere/G2.
const V1_CANVAS = { left: 17, top: 83, width: 1054, height: 618 };
const V1_REGIONS = {
  canvas: [3, 107, 1053, 557], patientTorso: [543, 217, 883, 337], tablePadsNear: [413, 387, 983, 477],
  room: [483, 7, 743, 117], rail: [473, 549, 668, 593], railBar: [473, 569, 668, 576],
};
const V1_RAIL_ROWS = { x0: 473, x1: 668, y0: 543, y1: 598 };
const V1_SKIN = { patientTorso: [543, 217, 883, 337], torsoSkin: [603, 272, 823, 327], nearLeftHand: [470, 445, 560, 485] };
const C6_LAMP_LUMA = { canvas: 121.6, patientTorso: 144.1, tablePadsNear: 127.3, room: 97.1 };
const G2_LAMP_LUMA = { canvas: 123.7, patientTorso: 142.3, tablePadsNear: 127.4, room: 96.2 };
const JOINT_BONES = ['upperarm01L', 'lowerarm01L', 'upperarm01R', 'lowerarm01R', 'upperleg01L', 'lowerleg01L', 'upperleg01R', 'lowerleg01R'];

// Joint-band points: the elbow and knee joint centres; the axilla 25 % of the way from the shoulder joint to the
// elbow and 5 cm toward the midline (where the upper arm meets the chest wall). A point counts only when the
// first patient skin along the view lies within 10 cm of it (skinAlongView); the torso hides the far elbow
// and axilla in V1 and V2. Q6 compares the same patches at rest (≤ 3 % change).
function jointPoints(w) {
  const axilla = (shoulder, elbow) => {
    const p = shoulder.map((v, i) => v + 0.25 * (elbow[i] - v));
    p[0] -= Math.sign(p[0]) * 0.05;
    return p;
  };
  return {
    elbowL: w.lowerarm01L, elbowR: w.lowerarm01R, axillaL: axilla(w.upperarm01L, w.lowerarm01L), axillaR: axilla(w.upperarm01R, w.lowerarm01R),
    kneeL: w.lowerleg01L, kneeR: w.lowerleg01R,
  };
}
const visibleOnly = (points, visibility) => Object.fromEntries(Object.entries(points).map(([k, p]) => [k, visibility[k]?.visible ? p : null]));

// Shimmer: frames with the camera at offset (0, 0), (½, 0), (0, ½) px and (0, 0) again. The last pair is the
// noise floor (0 when the scene is static); the half-pixel pairs measure how much the skin changes when the
// image moves by less than a pixel, which aliasing and fine normal detail raise (Q5: ≤ +10 %).
async function shimmer(page, rects) {
  const a = await readCanvas(page, { dx: 0, dy: 0 });
  const x = await readCanvas(page, { dx: 0.5, dy: 0 });
  const y = await readCanvas(page, { dx: 0, dy: 0.5 });
  const a2 = await readCanvas(page, { dx: 0, dy: 0 });
  return Object.fromEntries(Object.entries(rects).map(([name, rect]) => [name, {
    rect: rect.map((v) => Math.round(v)),
    halfPixelX: lumaDifference(a, x, rect), halfPixelY: lumaDifference(a, y, rect), noiseFloor: lumaDifference(a, a2, rect),
  }]));
}

// Outlines of the measured regions (canvas pixels) drawn as page overlays for the evidence picture, then removed.
async function outlineShot(page, nabd, name, boxes) {
  const canvas = await nabd.canvas();
  await page.evaluate(({ list, left, top }) => {
    for (const { rect: [x0, y0, x1, y1], color, label } of list) {
      const d = document.createElement('div');
      d.className = 'q1-outline';
      Object.assign(d.style, { position: 'fixed', left: `${left + x0}px`, top: `${top + y0}px`, width: `${x1 - x0}px`, height: `${y1 - y0}px`,
        border: `2px solid ${color}`, zIndex: 99999, pointerEvents: 'none', font: '11px monospace', color, textShadow: '0 0 2px #000' });
      d.textContent = label;
      document.body.append(d);
    }
  }, { list: boxes, left: canvas.left, top: canvas.top });
  await nabd.shot(name);
  await page.evaluate(() => document.querySelectorAll('.q1-outline').forEach((d) => d.remove()));
}
const patchBox = (label, p, half = 6) => ({ rect: [p.x - half, p.y - half, p.x + half + 1, p.y + half + 1], label, color: '#00e5ff' });

test.describe('Q1 image metrics 1440x900', () => {
  test.use({ viewport: WIDE, reducedMotion: 'reduce' });

  test('Q1-b image-metric baselines in V1 and V2: lamp-luma regions with the rail, skin hue terciles, shimmer, joint bands (1440x900)', async ({ page, nabd }) => {
    test.setTimeout(180_000);
    await page.addInitScript(RENDER_HOOK);
    await nabd.boot();
    await nabd.waitIdle();
    await nabd.cameraSteady();
    await sleep(2000);
    const result = { method: 'reducedMotion reduce (the vitals monitor draws once); one frame rendered through the app renderer and read back '
      + 'from the canvas (toDataURL in the same task), decoded in Node; luma = Rec. 709 of the sRGB bytes; regions in canvas pixels' };

    // ---------------- V1
    const canvas = await nabd.canvas();
    result.v1Canvas = canvas;
    const v1 = await readCanvas(page);
    result.v1Buffer = { width: v1.width, height: v1.height };
    result.v1 = { luma: lumaRegions(v1, V1_REGIONS),
      skinHue: Object.fromEntries(Object.entries(V1_SKIN).map(([k, r]) => [k, skinHueTerciles(v1, r)])) };
    const { x0, x1, y0, y1 } = V1_RAIL_ROWS;
    result.v1.railRows = Array.from({ length: y1 - y0 }, (_, k) => [y0 + k, lumaRegions(v1, { row: [x0, y0 + k, x1, y0 + k + 1] }).row.meanLuma]);
    result.v1.lumaVsC6 = Object.fromEntries(Object.entries(C6_LAMP_LUMA).map(([k, v]) => [k, round(result.v1.luma[k].meanLuma - v, 1)]));
    result.v1.lumaVsG2 = Object.fromEntries(Object.entries(G2_LAMP_LUMA).map(([k, v]) => [k, round(result.v1.luma[k].meanLuma - v, 1)]));
    const j1 = jointPoints(await boneWorld(page, JOINT_BONES));
    result.v1.jointVisibility = await skinAlongView(page, j1);
    const p1 = await projectToCanvas(page, visibleOnly(j1, result.v1.jointVisibility));
    result.v1.joints = patchLuma(v1, p1, 6);
    result.v1.shimmer = await shimmer(page, { torsoSkin: V1_SKIN.torsoSkin, nearLeftHand: V1_SKIN.nearLeftHand });
    result.v1.render = await page.evaluate(() => window.__studioQA.getRenderStats());
    await outlineShot(page, nabd, 'Q1-b-metric-regions-V1-1440x900', [
      ...Object.entries(V1_REGIONS).map(([label, rect]) => ({ rect, label, color: '#ffd400' })),
      ...Object.entries(V1_SKIN).filter(([k]) => k !== 'patientTorso').map(([label, rect]) => ({ rect, label, color: '#ff3df0' })),
      ...Object.entries(p1).filter(([, p]) => p).map(([label, p]) => patchBox(label, p)),
    ]);

    // ---------------- V2 (forearm drill after «اقترب»): close view of the left arm
    await page.click('#forearm-practice');
    await nabd.waitFor(() => { const s = window.__studioQA.getSimulationState(); return s.forearm && s.abdomen.ready && !window.__studioQA.workMoving(); }, null, 25_000);
    await nabd.cameraSteady();
    await sleep(500);
    await page.click('[data-work-approach="-1"]');
    await nabd.waitIdle();
    await nabd.cameraSteady();
    await sleep(2000);
    result.v2Canvas = await nabd.canvas();
    const v2 = await readCanvas(page);
    const w2 = await boneWorld(page, [...JOINT_BONES, 'wristL']);
    const j2 = jointPoints(w2);
    const visibility2 = await skinAlongView(page, j2);
    const p2 = await projectToCanvas(page, { ...visibleOnly(j2, visibility2), forearmMid: w2.lowerarm01L.map((v, i) => (v + w2.wristL[i]) / 2) });
    const mid = p2.forearmMid;
    // A 36 × 20 px patch on the middle of the left forearm (inside the arm's outline at this distance).
    const forearmPatch = mid ? [mid.x - 18, mid.y - 10, mid.x + 18, mid.y + 10] : null;
    result.v2 = { joints: patchLuma(v2, p2, 6), jointVisibility: visibility2, forearmMid: mid,
      skinHue: forearmPatch ? { forearmPatch: skinHueTerciles(v2, forearmPatch) } : null,
      luma: forearmPatch ? lumaRegions(v2, { forearmPatch, canvas: [0, 0, v2.width, v2.height] }) : null };
    result.v2.shimmer = forearmPatch ? await shimmer(page, { forearmPatch }) : null;
    result.v2.render = await page.evaluate(() => window.__studioQA.getRenderStats());
    await outlineShot(page, nabd, 'Q1-b-metric-regions-V2-1440x900', [
      ...(forearmPatch ? [{ rect: forearmPatch, label: 'forearmPatch', color: '#ff3df0' }] : []),
      ...Object.entries(p2).filter(([k, p]) => p && k !== 'forearmMid').map(([label, p]) => patchBox(label, p)),
    ]);
    nabd.save('Q1-b-image-metrics-1440x900', { result, errors: nabd.errors() });

    // Sanity only: these are baselines, not gates. The gates that use them belong to Q3–Q6.
    expect(Math.abs(canvas.left - V1_CANVAS.left), 'V1 canvas box as when the regions were defined').toBeLessThanOrEqual(1);
    expect(Math.abs(canvas.top - V1_CANVAS.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(canvas.width - V1_CANVAS.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(canvas.height - V1_CANVAS.height)).toBeLessThanOrEqual(1);
    expect(result.v1Buffer).toEqual({ width: 1054, height: 618 });
    for (const name of Object.keys(V1_REGIONS)) expect(result.v1.luma[name].pixels, name).toBeGreaterThan(0);
    // The lamp-lit picture has not changed since G2 (room excluded: C6's rectangle held DOM pixels; until G2 the
    // reference was C6). This and the hidden far elbow below hold only while nothing changes the look or the
    // pose: Q3-Q6 (look) and later pose changes must update them on purpose, with the new values in their evidence.
    for (const name of ['canvas', 'patientTorso', 'tablePadsNear']) expect(Math.abs(result.v1.lumaVsG2[name]), `${name} vs G2`).toBeLessThanOrEqual(0.5);
    expect(result.v1.skinHue.torsoSkin.skinSharePct, 'the torso patch is skin').toBeGreaterThanOrEqual(90);
    expect(result.v1.skinHue.torsoSkin.spreadDeg).not.toBeNull();
    for (const k of ['elbowL', 'axillaL', 'kneeL']) expect(result.v1.joints[k], `${k} visible in V1`).not.toBeNull();
    expect(result.v1.jointVisibility.elbowR.visible, 'the torso hides the far elbow in V1').toBe(false);
    expect(result.v2.joints.elbowL, 'elbowL visible in V2').not.toBeNull();
    for (const s of Object.values(result.v1.shimmer)) {
      expect(s.noiseFloor.meanAbs, 'a static frame repeats exactly').toBe(0);
      expect(s.halfPixelX.meanAbs, 'a half-pixel shift changes the skin a little').toBeGreaterThan(0);
    }
    expect(mid, 'the forearm is on screen in V2').not.toBeNull();
    expect(result.v2.luma.canvas.sdLuma, 'V2 is a rendered picture, not a blank canvas').toBeGreaterThan(20);
    expect(result.v2.skinHue.forearmPatch.skinSharePct, 'the V2 forearm patch is skin').toBeGreaterThanOrEqual(90);
    expect(result.v2.shimmer.forearmPatch.noiseFloor.meanAbs).toBe(0);
    expect(nabd.errors(), 'M11 = 0').toEqual([]);
  });
});

// ================================================================= G1 grab-anywhere foundations
// G1 builds the data and maths the grab needs, with no behaviour change (12_GRAB_ANYWHERE_DESIGN.md §8 G1):
//  * G1-a: body segments, proxies and supports meet the G1 gates on the live asset;
//  * G1-b: the authored supine pose in the joint model's frames: 0 HARD, WARN listed (DN5 labelled);
//  * G1-c: grabSamples gives area-weighted points per region that the bedside pick hits first;
//  * G1-d: the skin penetration readout (the F27 baseline G2 must fix) and the self-contact readout;
//  * G1-e: a pose round trip: supports follow the deck, the bones the snapshots gained come back bit for bit,
//    the pose version moves;
//  * G1-f (fix V1): the joint clamp on the live rig across the shoulder's overhead limit and every joint's
//    180° chart wrap.
// G1-d also checks the support depth against an independent depth below the drawn resting tops (fix V2).
// The pixel-diff gate (V1–V4 identical) is tests/browser/pixel-diff.mjs against the commit before G1.
const G1_REGIONS = ['forearm', 'hand', 'elbow', 'wrist', 'upperArm', 'shoulder', 'thigh', 'knee', 'shank', 'ankle', 'foot',
  'head', 'neck', 'chest', 'abdomen', 'flank', 'pelvis', 'privacy'];
const LIMB_REGIONS = new Set(['forearm', 'hand', 'elbow', 'wrist', 'upperArm', 'shoulder', 'thigh', 'knee', 'shank', 'ankle', 'foot']);
const SNAPSHOT_BONES = 19;

async function waitPose(page, name) {
  await page.waitForFunction((n) => { const s = window.__studioQA.getState(); return s.pose === n && !s.animating; }, name, { timeout: 20_000, polling: 100 });
}

for (const size of [WIDE, NARROW]) {
  test.describe(`G1 foundations ${sizeName(size)}`, () => {
    test.use({ viewport: size, cluster: 'G1' });

    test(`G1-a segments, proxies and supports meet the G1 gates (${sizeName(size)})`, async ({ page, nabd }) => {
      await nabd.boot();
      const body = await page.evaluate(() => window.__studioQA.bodySegments());
      const supports = await page.evaluate(() => window.__studioQA.supportSurface());
      nabd.save(`G1-a-foundations-${sizeName(size)}`, { body, supports, errors: nabd.errors() });
      // triSeg assigns every non-privacy triangle; at least 92 % have a top weight of 0.65 or more.
      expect(body.segments.unassignedBones).toEqual([]);
      expect(body.gates.triSegAssignedFraction).toBe(1);
      expect(body.gates.triSegSingleWeightFraction).toBeGreaterThanOrEqual(0.92);
      expect(body.segments.clinical.triangles, 'the clinical skin (105,822 triangles)').toBe(105822);
      expect(body.segments.privacyTriangles, 'the privacy surface (1,718 triangles)').toBe(1718);
      // At least 95 % of each segment's vertices outside its inner proxy; each lowest rest vertex is a sample.
      for (const s of body.proxies.segments) {
        expect(s.outsideInner, `${s.id} outside its inner proxy`).toBeGreaterThanOrEqual(0.95);
        expect(s.lowestIsSample, `${s.id} lowest rest vertex is a sample`).toBe(true);
        expect(s.samples, `${s.id} samples`).toBeGreaterThanOrEqual(24);
        expect(s.samples).toBeLessThanOrEqual(40);
      }
      expect(body.proxies.segments).toHaveLength(17);
      // Supports measured from the drawn table: arm boards at |x| 0.356–0.601, z −0.705…−0.235; within 1 mm of
      // a raycast of the GLB everywhere on them. G2 (F27) lowered the drawn top 52.5 mm: the pad tops moved from
      // 0.9525 m to the deck, 0.900 m, and the arm-board tops from 0.951 m to 0.8985 m.
      expect(supports.boxes).toBeGreaterThan(60);
      for (const pad of supports.resting.filter((b) => b.kind === 'pad')) expect(Math.abs(pad.topY - 0.9), pad.name).toBeLessThan(1e-6);
      for (const side of ['L', 'R']) {
        const pad = supports.resting.find((b) => b.name === `${side}_armboard_pad`), top = supports.resting.find((b) => b.name === `${side}_armboard_top`);
        expect(Math.abs(Math.min(...pad.x.map(Math.abs)) - 0.356)).toBeLessThan(1e-6);
        expect(Math.abs(Math.max(...pad.x.map(Math.abs)) - 0.601)).toBeLessThan(1e-6);
        expect(Math.abs(pad.z[0] + 0.705)).toBeLessThan(1e-6);
        expect(Math.abs(pad.z[1] + 0.235)).toBeLessThan(1e-6);
        expect(Math.abs(top.topY - 0.8985)).toBeLessThan(1e-6);
      }
      expect(supports.check.samples).toBeGreaterThan(500);
      expect(supports.check.worstErrorMm, 'pad tops vs the GLB raycast').toBeLessThanOrEqual(1);
      expect(supports.rootRotatedOrScaled).toBe(false);
      expect(body.snapshotBones).toHaveLength(SNAPSHOT_BONES);
      // Recorded, not asserted (machine load): the synchronous build after the patient loads, target ≤ 50 ms in Chrome.
      expect(body.timing.loadMs).toBeGreaterThan(0);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    test(`G1-b the authored supine pose in joint-model frames: no HARD violation (${sizeName(size)})`, async ({ page, nabd }) => {
      await nabd.boot();
      const joints = await page.evaluate(() => window.__studioQA.jointAngles());
      nabd.save(`G1-b-joint-angles-${sizeName(size)}`, { joints, errors: nabd.errors() });
      expect(joints.label, 'every limit and angle is DN5 illustrative').toMatch(/illustrative/);
      expect(Object.keys(joints.joints).sort()).toEqual(['ankle.L', 'ankle.R', 'elbow.L', 'elbow.R', 'hip.L', 'hip.R', 'knee.L', 'knee.R',
        'neck', 'shoulder.L', 'shoulder.R', 'wrist.L', 'wrist.R']);
      for (const [id, j] of Object.entries(joints.joints)) {
        for (const key of ['swingY', 'swingZ', 'twist', 'flex', 'warn', 'hard']) expect(j, `${id}.${key}`).toHaveProperty(key);
        expect(j.hard, `${id} HARD`).toEqual([]);
      }
      expect(joints.hardCount).toBe(0);
      // The forearm's rest offset from the rig's hinge plane and the knee's are kept as the rest pose gives them:
      // 11.4° and 1.4° until G1; 9.7° and 1.6° since the G2 rest pose (arms on the pad, legs re-aimed).
      for (const s of ['L', 'R']) {
        expect(Math.abs(Math.abs(joints.restOffsetDeg[`elbow.${s}`]) - 9.66)).toBeLessThan(0.1);
        expect(Math.abs(Math.abs(joints.restOffsetDeg[`knee.${s}`]) - 1.64)).toBeLessThan(0.1);
      }
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    test(`G1-c grab samples per region are on screen and hit their region first (${sizeName(size)})`, async ({ page, nabd }) => {
      test.setTimeout(240_000);
      await nabd.boot();
      const result = {};
      for (const region of G1_REGIONS) {
        for (const side of LIMB_REGIONS.has(region) ? ['left', 'right'] : [null]) {
          const samples = await page.evaluate(([r, s]) => window.__studioQA.grabSamples(r, 40, s, 7), [region, side]);
          result[`${region}${side ? `.${side}` : ''}`] = { count: samples.length, hitRegion: samples.filter((x) => x.hitRegion === region).length,
            first: samples.slice(0, 3) };
        }
      }
      // The same seed gives the same points.
      const first = await page.evaluate(() => window.__studioQA.grabSamples('forearm', 5, 'left', 7).map((x) => [x.x, x.y]));
      const again = await page.evaluate(() => window.__studioQA.grabSamples('forearm', 5, 'left', 7).map((x) => [x.x, x.y]));
      nabd.save(`G1-c-grab-samples-${sizeName(size)}`, { result, repeatable: JSON.stringify(again) === JSON.stringify(first), errors: nabd.errors() });
      for (const [name, r] of Object.entries(result)) expect(r.hitRegion, `${name}: every sample hits its own region`).toBe(r.count);
      expect(JSON.stringify(again)).toBe(JSON.stringify(first));
      if (size === WIDE) {
        // V1 shows the near (left) side, the head and the trunk: 40 points for every region there.
        for (const name of ['forearm.left', 'hand.left', 'elbow.left', 'wrist.left', 'upperArm.left', 'thigh.left', 'knee.left', 'shank.left',
          'ankle.left', 'foot.left', 'head', 'neck', 'chest', 'abdomen', 'flank', 'pelvis', 'privacy']) expect(result[name].count, name).toBe(40);
      }
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    test(`G1-d skin penetration readout: supports and self contact on re-skinned vertices (${sizeName(size)})`, async ({ page, nabd }) => {
      // The three.js devtools hook gives the test its own handle on the skin for the independent depth check.
      await page.addInitScript(RENDER_HOOK);
      await nabd.boot();
      const penetration = await page.evaluate(() => window.__studioQA.skinPenetration());
      // Independent of SupportSurface's distance: for every re-skinned clinical-skin vertex, the depth below the
      // highest drawn resting top whose footprint holds it (the tops G1-a checks against a GLB raycast), down
      // to the bottom of the table-top stack.
      const independent = await page.evaluate(() => {
        const scene = window.__q1.scenes.find((x) => x.getObjectByName('VirtualPatient'));
        let skin = null;
        scene.getObjectByName('VirtualPatient').traverse((o) => { if (o.isSkinnedMesh && /^Clinical/.test([o.material].flat()[0]?.name ?? '')) skin = o; });
        // Boxes for the GLB's resting meshes; the gel head ring (G2) is not a box: its top over a point is read
        // from its own drawn triangles (world positions, a vertical line through the point, barycentric).
        const resting = window.__studioQA.supportSurface().resting.filter((b) => b.name !== 'head_ring_gel');
        const ring = scene.getObjectByName('head_ring_gel');
        const v = new scene.position.constructor();
        const ringTris = [];
        let ringBox = null, ringBase = null;
        if (ring) {
          ring.updateMatrixWorld(true);
          const pos = ring.geometry.attributes.position, idx = ring.geometry.index.array, p = new scene.position.constructor();
          const world = Array.from({ length: pos.count }, (_, i) => p.fromBufferAttribute(pos, i).applyMatrix4(ring.matrixWorld).toArray());
          for (let t = 0; t < idx.length; t += 3) ringTris.push([world[idx[t]], world[idx[t + 1]], world[idx[t + 2]]]);
          ringBox = world.reduce((b, q) => [Math.min(b[0], q[0]), Math.max(b[1], q[0]), Math.min(b[2], q[2]), Math.max(b[3], q[2])], [Infinity, -Infinity, Infinity, -Infinity]);
          ringBase = ring.getWorldPosition(p).y;
        }
        const ringTop = (x, z) => {
          let top = null;
          for (const [a, b, c] of ringTris) {
            const d = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
            if (Math.abs(d) < 1e-14) continue;
            const l1 = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / d, l2 = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / d;
            if (l1 < -1e-9 || l2 < -1e-9 || 1 - l1 - l2 < -1e-9) continue;
            const y = l1 * a[1] + l2 * b[1] + (1 - l1 - l2) * c[1];
            if (top === null || y > top) top = y;
          }
          return top;
        };
        let max = 0, over2mm = 0, penetrating = 0, belowHalfPad = 0;
        for (let i = 0; i < skin.geometry.attributes.position.count; i++) {
          skin.getVertexPosition(i, v).applyMatrix4(skin.matrixWorld);
          let top = -Infinity;
          for (const b of resting) {
            if (v.x >= b.x[0] && v.x <= b.x[1] && v.z >= b.z[0] && v.z <= b.z[1] && v.y >= b.stackBottomY && b.topY > top) top = b.topY;
          }
          if (ringBox && v.x >= ringBox[0] && v.x <= ringBox[1] && v.z >= ringBox[2] && v.z <= ringBox[3] && v.y >= ringBase) {
            const y = ringTop(v.x, v.z);
            if (y !== null && y > top) top = y;
          }
          const depth = top - v.y;
          if (depth > 0) { penetrating++; max = Math.max(max, depth); if (depth > 0.002) over2mm++; if (depth > 0.0375) belowHalfPad++; }
        }
        return { maxMm: max * 1000, over2mm, penetrating, deeperThanHalfPad: belowHalfPad };
      });
      const restingOver2mm = Object.values(penetration.bySupport).filter((b) => ['pad', 'armboard', 'headrest'].includes(b.kind))
        .reduce((n, b) => n + b.over2mm, 0);
      nabd.save(`G1-d-skin-penetration-${sizeName(size)}`, { penetration, independent, restingOver2mm, errors: nabd.errors() });
      expect(penetration.vertices, 'every clinical-skin vertex').toBe(70278);
      for (const key of ['supportMaxMm', 'supportP95Mm', 'over2mm', 'selfMaxMm']) expect(Number.isFinite(penetration[key]), key).toBe(true);
      // F27 (P1 C6-e): until G2 the patient lay centimetres deep in the drawn pads (51.8 mm below the leg-pad tops,
      // deeper than half the 75 mm pad, which a plain box distance could not read: V2). G2 lowered the table top
      // and posed the rest on it: nothing is deeper than the 5 mm compression G2 declares (its own gates are G2-a).
      expect(penetration.belowTopMaxMm, 'no sinking into the drawn supports since G2').toBeLessThanOrEqual(5);
      expect(Math.abs(penetration.belowTopMaxMm - independent.maxMm), 'deepest vertex = the independent depth below the drawn top').toBeLessThanOrEqual(0.1);
      expect(penetration.belowTopOver2mm, 'vertices > 2 mm below a resting top = the independent count').toBe(independent.over2mm);
      expect(penetration.belowTopVertices).toBe(independent.penetrating);
      expect(independent.deeperThanHalfPad, 'no vertex deeper than half a pad since G2').toBe(0);
      // The signed distance (what the G3 constraint pass will use) reads the deepest vertex in full too, never
      // more than the depth below the top (a pad's side can be nearer), and never points down.
      expect(Math.abs(penetration.supportMaxMm - penetration.belowTopMaxMm), 'the deepest vertex read in full').toBeLessThanOrEqual(0.1);
      expect(penetration.supportMaxMm).toBeLessThanOrEqual(penetration.belowTopMaxMm + 1e-6);
      expect(penetration.supportDownward, 'no penetrating vertex is sent out through the bottom of the table').toBe(0);
      expect(restingOver2mm).toBeLessThanOrEqual(penetration.over2mm);
      expect(penetration.supportMethod).toMatch(/no bottom face/);
      expect(penetration.deck).toBe(0.9);
      expect(Object.keys(penetration.bySegment)).toHaveLength(17);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    test(`G1-e pose round trip: supports follow the deck, snapshot bones come back bit for bit (${sizeName(size)})`, async ({ page, nabd }) => {
      await nabd.boot();
      const before = await page.evaluate(() => ({ pose: window.__studioQA.grabPose(), joints: window.__studioQA.jointAngles() }));
      await page.evaluate(() => window.__studioQA.setPose('sitting'));
      await waitPose(page, 'sitting');
      const sitting = await page.evaluate(() => ({ supports: window.__studioQA.supportSurface(), pose: window.__studioQA.grabPose(), joints: window.__studioQA.jointAngles() }));
      await page.evaluate(() => window.__studioQA.setPose('supine'));
      await waitPose(page, 'supine');
      const after = await page.evaluate(() => ({ pose: window.__studioQA.grabPose(), joints: window.__studioQA.jointAngles(), supports: window.__studioQA.supportSurface() }));
      nabd.save(`G1-e-pose-round-trip-${sizeName(size)}`, { before, sitting: { supports: sitting.supports, poseVersion: sitting.pose.poseVersion,
        hardCount: sitting.joints.hardCount, warnCount: sitting.joints.warnCount }, after, errors: nabd.errors() });
      expect(before.pose.snapshotBones).toHaveLength(SNAPSHOT_BONES);
      // The deck moves for sitting and the supports move with the drawn top.
      expect(sitting.supports.deck).toBeLessThan(0.9);
      expect(Math.abs(sitting.supports.offset - (sitting.supports.deck - 0.9))).toBeLessThan(1e-9);
      expect(sitting.supports.check.worstErrorMm, 'pad tops vs the GLB raycast at the sitting deck').toBeLessThanOrEqual(1);
      expect(sitting.pose.poseVersion, 'a pose change moves the pose version').toBeGreaterThan(before.pose.poseVersion);
      expect(Math.abs(after.supports.offset)).toBeLessThan(1e-12);
      // Nothing moves the bones the snapshots gained: they come back exactly, and so does the supine reading.
      expect(after.pose.snapshotBones).toEqual(before.pose.snapshotBones);
      for (const [id, j] of Object.entries(before.joints.joints)) {
        for (const key of ['swingY', 'swingZ', 'twist']) expect(Math.abs(after.joints.joints[id][key] - j[key]), `${id}.${key}`).toBeLessThan(1e-9);
      }
      expect(after.joints.hardCount).toBe(0);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    test(`G1-f joint clamp on the live rig: overhead shoulder and every 180° wrap (${sizeName(size)})`, async ({ page, nabd }) => {
      await nabd.boot();
      const result = await page.evaluate(() => {
        const qa = window.__studioQA, out = {};
        for (const id of ['shoulder.L', 'shoulder.R']) {
          for (const motion of ['flexion', 'abduction']) {
            out[`${id} ${motion} 170-190`] = qa.jointClampSweep(id, motion, 170, 190, 0.25);
            out[`${id} ${motion} 150-210`] = qa.jointClampSweep(id, motion, 150, 210, 0.25);
          }
          for (const elevation of [150, 175, 180]) out[`${id} twist at ${elevation}`] = qa.jointClampSweep(id, 'twist', -180, 180, 0.5, elevation);
        }
        // Every other joint across its 180° chart wrap (recorded: ties deep beyond the limits are expected,
        // see tests/joint-model.test.js).
        for (const id of ['hip.L', 'hip.R', 'elbow.L', 'elbow.R', 'knee.L', 'knee.R', 'wrist.L', 'wrist.R', 'ankle.L', 'ankle.R', 'neck']) {
          for (const motion of ['flexion', 'abduction']) out[`${id} ${motion} 150-210`] = qa.jointClampSweep(id, motion, 150, 210, 0.25);
        }
        return out;
      });
      nabd.save(`G1-f-joint-clamp-sweeps-${sizeName(size)}`, { result, errors: nabd.errors() });
      for (const id of ['shoulder.L', 'shoulder.R']) {
        for (const motion of ['flexion', 'abduction']) {
          for (const range of ['170-190', '150-210']) {
            const r = result[`${id} ${motion} ${range}`];
            expect(r.label).toMatch(/illustrative/);
            // V1: before the fix the output jumped 120° (flexion) and 110° (abduction) at 180.25°.
            expect(r.jumps, `${id} ${motion} ${range}: no jump`).toEqual([]);
            expect(r.maxRatio, `${id} ${motion} ${range}: output at most 4× faster than the input`).toBeLessThan(4);
          }
          expect(Math.abs(result[`${id} ${motion} 170-190`].end.elevation - 180), 'held at the overhead limit').toBeLessThan(1);
        }
        for (const elevation of [150, 175, 180]) {
          const r = result[`${id} twist at ${elevation}`];
          // A full turn of the humerus crosses the point opposite the middle of its 160° range once: one tie
          // from one bound to the other, nothing else; the rotation stays limited overhead.
          expect(r.jumps, `${id} twist at ${elevation}`).toHaveLength(1);
          expect(r.jumps[0].twistAt[0] * r.jumps[0].twistAt[1]).toBe(-1);
        }
      }
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });
  });
}

// ================================================================= G2 supports and supine rest (F27 package)
// G2 (12_GRAB_ANYWHERE_DESIGN.md §8 G2): the patient rests on what is drawn. The table-top GLB is placed
// PAD_DROP (52.5 mm) lower so its pads sit at the deck (0.900 m); a gel head ring (src/render/GeometryFixes.js)
// supports the occiput; the supine rest is re-posed so the arms lie on the pad beside the body.
//  * G2-a: per segment the lowest re-skinned skin over the drawn support under it (restSupport(), built on
//    skinPenetration()): 0 vertices more than 2 mm below a support except the declared <= 5 mm under pelvis, calf
//    and heel; head, upper arm, forearm, hand, pelvis and calf within -5...+5 mm; chest <= +8 mm; both wrists at
//    |x| <= 0.258 m. The heels overhang the leg pads' end (no drawn support under them): they are checked against
//    the leg-pad plane instead, and the overhang is recorded. Every value is DN5 illustrative.
//  * G2-b: what is drawn: the top 52.5 mm lower, the table's carrier hidden (it would hang below the base's
//    mount plate), the ring on the top with its support equal to a raycast of its triangles, fitted to the head.
//  * G2-c: a pose round trip (sitting and back) brings the same rest on the same supports (the supports follow the
//    drawn top's own height, which is PAD_DROP below the deck).
const G2_GATED = ['head', 'upperArm.L', 'upperArm.R', 'forearm.L', 'forearm.R', 'hand.L', 'hand.R', 'pelvis', 'shank.L', 'shank.R'];
const G2_COMPRESSED = new Set(['pelvis', 'shank.L', 'shank.R', 'foot.L', 'foot.R']);

// One frame of the app's scene from a test camera (three.js devtools hook), as a JPEG data URL.
async function hookShot(page, view) {
  return page.evaluate((v) => new Promise((resolve) => {
    const scene = window.__q1.scenes.find((s) => s.getObjectByName('VirtualPatient'));
    const renderer = window.__q1.renderers[0];
    const render = renderer.render;
    let appCamera = null;
    renderer.render = function (sc, cam) { if (sc === scene && renderer.getRenderTarget() === null) appCamera = cam; return render.call(this, sc, cam); };
    const shoot = () => {
      if (!appCamera) { requestAnimationFrame(shoot); return; }
      renderer.render = render;
      const canvas = renderer.domElement;
      const cam = new appCamera.constructor(v.fov, canvas.width / canvas.height, 0.05, 20);
      cam.position.set(...v.pos);
      cam.lookAt(...v.at);
      cam.updateMatrixWorld(true);
      render.call(renderer, scene, cam);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    requestAnimationFrame(shoot);
  }), view);
}
const G2_VIEWS = {
  // Pad height, from the patient's left: the back, the arm and the head ring on the pads (as C6-e's side view).
  side: { pos: [1.5, 0.965, -0.36], at: [0, 0.94, -0.36], fov: 24 },
  // The occiput on the gel ring.
  headRing: { pos: [0.42, 1.02, -0.98], at: [0, 0.935, -0.72], fov: 30 },
  // Under the table, across the column: the deck on the base's mount plate (no seam, nothing hanging below).
  underTable: { pos: [1.6, 0.6, 0.0], at: [0, 0.76, 0.0], fov: 30 },
};

for (const size of [WIDE, NARROW]) {
  test.describe(`G2 supports and supine rest ${sizeName(size)}`, () => {
    test.use({ viewport: size, cluster: 'G2' });

    test(`G2-a the supine rest lies on the drawn supports: per-segment lowest skin, compression, wrists (${sizeName(size)})`, async ({ page, nabd }) => {
      await nabd.boot();
      const rest = await page.evaluate(() => window.__studioQA.restSupport());
      const joints = await page.evaluate(() => window.__studioQA.jointAngles());
      nabd.save(`G2-a-rest-support-${sizeName(size)}`, { rest, jointHard: joints.hardCount, jointWarn: joints.warnCount, errors: nabd.errors() });
      expect(rest.label).toMatch(/illustrative/);
      expect(rest.deck).toBe(0.9);
      expect(rest.compressionMm, 'declared compression (DN5)').toEqual({ pelvis: 5, shank: 5, foot: 5 });
      // No vertex deeper than its part allows; only the declared parts may go past 2 mm, and never past 5 mm.
      expect(rest.belowTopOverAllowance, 'vertices deeper than their allowance').toBe(0);
      for (const [id, g] of Object.entries(rest.gaps)) {
        if (G2_COMPRESSED.has(id)) expect(g.belowTopMaxMm, `${id} compression`).toBeLessThanOrEqual(5);
        else expect(g.belowTopOver2mm, `${id}: no vertex more than 2 mm below a support`).toBe(0);
      }
      expect(rest.supportDownward, 'no way out through the bottom of the table').toBe(0);
      // Lowest skin over its drawn support: head (on the ring), arms, hands, pelvis and calves within +-5 mm.
      for (const id of G2_GATED) {
        expect(rest.gaps[id].lowestGapMm, `${id} lowest skin over its support`).toBeGreaterThanOrEqual(-5);
        expect(rest.gaps[id].lowestGapMm, `${id} lowest skin over its support`).toBeLessThanOrEqual(5);
      }
      expect(rest.gaps.head.support, 'the head rests on the gel ring').toBe('head_ring_gel');
      for (const id of ['upperArm.L', 'upperArm.R', 'forearm.L', 'forearm.R']) expect(rest.gaps[id].support, `${id} on the back pad`).toBe('back_pad');
      for (const id of ['hand.L', 'hand.R']) expect(rest.gaps[id].support, `${id} on the seat pad`).toBe('seat_pad');
      expect(rest.gaps.chest.lowestGapMm, 'chest <= +8 mm').toBeLessThanOrEqual(8);
      expect(rest.gaps.chest.lowestGapMm).toBeGreaterThanOrEqual(-2);
      // The heels overhang the end of the leg pads (z 0.885): nothing drawn is under them. Against the leg-pad
      // plane they are within +-5 mm, so the leg lies along the pad instead of dipping or lifting off its end.
      for (const s of ['L', 'R']) {
        expect(rest.heel[s].overDrawnSupportMm, `heel ${s}: no drawn support under it`).toBeNull();
        expect(rest.heel[s].overhangMm, `heel ${s} past the leg pad's end`).toBeGreaterThan(0);
        expect(Math.abs(rest.heel[s].overLegPadPlaneMm), `heel ${s} against the leg-pad plane`).toBeLessThanOrEqual(5);
      }
      // Both wrists inside the pad edge (|x| 0.282 m) by the hand's half-thickness.
      for (const [id, x] of Object.entries(rest.wristsAbsX)) expect(x, `${id} wrist |x|`).toBeLessThanOrEqual(0.258);
      expect(rest.padEdgeX).toBeCloseTo(0.282, 3);
      expect(joints.hardCount, 'the G2 rest pose has no HARD joint angle').toBe(0);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    test(`G2-b what is drawn: the lowered top, no carrier under it, the head ring and its support (${sizeName(size)})`, async ({ page, nabd }) => {
      await page.addInitScript(RENDER_HOOK);
      await nabd.boot();
      const drawn = await page.evaluate(() => {
        const scene = window.__q1.scenes.find((s) => s.getObjectByName('VirtualPatient'));
        const top = scene.getObjectByName('Nabd_Operating_Table_Top_GLTF'), base = scene.getObjectByName('Nabd_Operating_Table_Base_GLTF');
        const carrier = top?.getObjectByName('central_carrier'), ring = top?.getObjectByName('head_ring_gel');
        const box = (o) => { o.geometry.computeBoundingBox(); return o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); };
        scene.updateMatrixWorld(true);
        const plate = base?.getObjectByName('table_mount_plate');
        // Any drawn table-top mesh hanging below the base's mount plate over its footprint (the seam check).
        const below = [];
        top?.traverse((o) => {
          if (!o.isMesh || !o.visible || !plate) return;
          const b = box(o), p = box(plate);
          if (b.min.y < p.min.y - 1e-6 && b.max.x > p.min.x && b.min.x < p.max.x && b.max.z > p.min.z && b.min.z < p.max.z) below.push(o.name);
        });
        return { topY: top?.position.y ?? null, carrier: carrier ? { visible: carrier.visible } : null, plateBottomY: plate ? box(plate).min.y : null, below,
          ring: ring ? { parent: ring.parent?.name, castShadow: ring.castShadow, receiveShadow: ring.receiveShadow, material: ring.material.name,
            triangles: ring.geometry.index.count / 3, worldY: ring.getWorldPosition(new scene.position.constructor()).y } : null };
      });
      const supports = await page.evaluate(() => window.__studioQA.supportSurface());
      const rest = await page.evaluate(() => window.__studioQA.restSupport());
      const shots = {};
      if (size === WIDE && nabd.project === 'chrome') {
        fs.mkdirSync(nabd.dir, { recursive: true });
        for (const [name, view] of Object.entries(G2_VIEWS)) {
          const file = `G2-b-${name}-${sizeName(size)}.jpg`;
          fs.writeFileSync(path.join(nabd.dir, file), Buffer.from((await hookShot(page, view)).split(',')[1], 'base64'));
          shots[name] = file;
        }
      }
      nabd.save(`G2-b-drawn-table-${sizeName(size)}`, { drawn, supports, ring: rest.headRing, shots, errors: nabd.errors() });
      expect(drawn.topY, 'the drawn top 52.5 mm below the deck').toBeCloseTo(0.9 - 0.0525, 9);
      expect(drawn.carrier, 'the carrier is not drawn').toEqual({ visible: false });
      expect(drawn.below, 'nothing of the top hangs below the base mount plate').toEqual([]);
      for (const pad of supports.resting.filter((b) => b.kind === 'pad')) expect(Math.abs(pad.topY - 0.9), pad.name).toBeLessThan(1e-6);
      expect(supports.resting.map((b) => b.name)).not.toContain('central_carrier');
      // The ring: on the drawn top, about a thousand triangles, its base on the pads, its support equal to a raycast
      // of the drawn triangles (the supportSurface check covers it), fitted so the head touches it.
      expect(drawn.ring.parent).toBe('Nabd_Operating_Table_Top_GLTF');
      expect(drawn.ring.triangles).toBeGreaterThanOrEqual(800);
      expect(drawn.ring.triangles).toBeLessThanOrEqual(1200);
      expect(drawn.ring.castShadow && drawn.ring.receiveShadow).toBe(true);
      expect(drawn.ring.worldY).toBeCloseTo(0.9, 9);
      const ringSupport = supports.resting.find((b) => b.name === 'head_ring_gel');
      expect(ringSupport.kind).toBe('headrest');
      expect(supports.check.worstErrorMm, 'every resting surface, the ring included, against a raycast').toBeLessThanOrEqual(1);
      expect(rest.headRing.label).toMatch(/illustrative/);
      expect(rest.headRing.centre).toEqual([0, -0.722]);
      expect(rest.headRing.clampedVertices, 'the head presses the gel').toBeGreaterThan(0);
      expect(rest.headRing.maxHeight).toBeLessThanOrEqual(rest.headRing.freeHeight + 1e-9);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    test(`G2-c a pose round trip brings back the same rest on the same supports (${sizeName(size)})`, async ({ page, nabd }) => {
      await nabd.boot();
      const before = await page.evaluate(() => window.__studioQA.restSupport());
      await page.evaluate(() => window.__studioQA.setPose('sitting'));
      await waitPose(page, 'sitting');
      const sitting = await page.evaluate(() => window.__studioQA.supportSurface());
      await page.evaluate(() => window.__studioQA.setPose('supine'));
      await waitPose(page, 'supine');
      const after = await page.evaluate(() => window.__studioQA.restSupport());
      const afterSupports = await page.evaluate(() => window.__studioQA.supportSurface());
      nabd.save(`G2-c-pose-round-trip-${sizeName(size)}`, { before, after, sittingDeck: sitting.deck, sittingOffset: sitting.offset,
        sittingCheck: sitting.check, afterOffset: afterSupports.offset, errors: nabd.errors() });
      // While sitting the supports moved with the drawn top: offset = deck change.
      expect(Math.abs(sitting.offset - (sitting.deck - 0.9))).toBeLessThan(1e-9);
      expect(sitting.check.worstErrorMm).toBeLessThanOrEqual(1);
      expect(Math.abs(afterSupports.offset)).toBeLessThan(1e-12);
      for (const id of Object.keys(before.gaps)) {
        if (before.gaps[id].lowestGapMm === null) { expect(after.gaps[id].lowestGapMm).toBeNull(); continue; }
        expect(Math.abs(after.gaps[id].lowestGapMm - before.gaps[id].lowestGapMm), id).toBeLessThan(1e-6);
      }
      expect(after.belowTopOverAllowance).toBe(0);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });
  });
}
