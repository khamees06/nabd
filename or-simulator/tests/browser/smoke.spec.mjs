// Nabd v1.5 browser smoke protocol: flows S1–S9 and visual baselines V1–V4
// (docs/improvement-plan/09_ACCEPTANCE_AND_VALIDATION_PLAN.md §2.2, §2.3; protocol in SMOKE_PROTOCOL.md).
// Read-only with respect to the app: it only clicks, types, moves the mouse and reads the ?qa hook.
// Every test starts from a fresh page load, so S6 and S7 never inherit drill state (F31).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const SERVER = process.env.NABD_SMOKE_SERVER === 'vite' ? 'vite-preview' : 'serve';
const EVIDENCE = path.resolve(process.env.NABD_EVIDENCE_DIR || path.join(root, 'docs/improvement-plan/evidence/baseline-p0'));
const HEADED = process.env.NABD_SMOKE_HEADED === '1';
const ENTRY = '/?qa&debug=1';
const TOOLS = ['grasper', 'scope', 'scissors', 'needleHolder'];
// F19 (CrewController.js:232-233): scissors (VERIFIED R20) and needle holder built their blades from
// `undefined` lengths, which caused `computeBoundingSphere(): Computed radius is NaN`. Fixed in T1 step 10
// (the code now reads `.config.length`); both tools are now normal checks. Keep this set for any future
// known failure: a tool listed here is expected to fail.
const F19_KNOWN = new Set();
const F19_NOTE = 'F19 — fixed in T1 step 10';
const AIM_POINT = [0.109, 1.245, -0.12]; // NabdRuntime.js:5375 (aimPoint)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------- fixtures
const test = base.extend({
  // Worker-scoped launch probe: Firefox does not start in this environment ("spawn UNKNOWN").
  firefoxLaunch: [async ({ browserName, playwright }, use) => {
    if (browserName !== 'firefox') { await use({ ok: true }); return; }
    let result;
    try {
      const browser = await playwright.firefox.launch({ timeout: 30_000 });
      result = { ok: true, version: browser.version() };
      await browser.close();
    } catch (error) {
      result = { ok: false, error: String(error?.message ?? error).split('\n').slice(0, 3).join(' | ').slice(0, 400) };
    }
    const dir = path.join(EVIDENCE, 'smoke', `${SERVER}-firefox-headless`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'firefox-launch.json'), JSON.stringify({ when: new Date().toISOString(), ...result }, null, 2));
    await use(result);
  }, { scope: 'worker' }],

  nabd: async ({ page, browser, browserName, baseURL }, use, testInfo) => {
    const project = testInfo.project.name;
    const mode = project === 'webkit' || project === 'firefox' ? 'headless' : HEADED ? 'headed' : 'headless';
    const smokeDir = path.join(EVIDENCE, 'smoke', `${SERVER}-${project}-${mode}`);
    const visualDir = path.join(EVIDENCE, 'visual', `${SERVER}-${project}-${mode}`);
    const origin = new URL(baseURL).origin;
    const log = { console: [], pageErrors: [], responses: [], failed: [], foreign: [] };
    page.on('console', (m) => log.console.push({ type: m.type(), text: m.text().slice(0, 600), at: Date.now() }));
    page.on('pageerror', (e) => log.pageErrors.push({ text: String(e?.message ?? e).slice(0, 600), at: Date.now() }));
    page.on('request', (r) => {
      const url = r.url();
      if (!url.startsWith(origin) && !/^(data|blob|about):/.test(url)) log.foreign.push(url);
    });
    page.on('response', (r) => log.responses.push({ path: r.url().replace(origin, ''), status: r.status(), type: r.request().resourceType() }));
    // r is the Request itself: r.failure(), not r.request().failure() (that threw inside the handler).
    page.on('requestfailed', (r) => log.failed.push({ url: r.url().replace(origin, ''), error: r.failure()?.errorText ?? null }));

    const errorsOf = (from = { c: 0, p: 0 }) => [
      ...log.console.slice(from.c).filter((m) => m.type === 'error').map((m) => `console.error: ${m.text}`),
      ...log.pageErrors.slice(from.p).map((e) => `pageerror: ${e.text}`),
    ];
    const helper = {
      project, mode, log, smokeDir, visualDir,
      mark: () => ({ c: log.console.length, p: log.pageErrors.length }),
      errorsSince: (mark) => errorsOf(mark),
      async boot() {
        const started = Date.now();
        await page.goto(ENTRY, { waitUntil: 'load' });
        await page.locator('#model-status[data-state="ready"]').waitFor({ state: 'attached', timeout: 60_000 });
        const readyMs = Date.now() - started;
        await page.waitForFunction(() => Boolean(window.__studioQA), null, { timeout: 10_000 });
        return { readyMs };
      },
      sim: () => page.evaluate(() => window.__studioQA.getSimulationState()),
      qa: (name) => page.evaluate((n) => window.__studioQA[n](), name),
      text: (selector) => page.locator(selector).first().evaluate((el) => el.textContent.trim()),
      async waitFor(fn, arg, timeout = 15_000) {
        return page.waitForFunction(fn, arg, { timeout, polling: 100 });
      },
      async waitIdle(timeout = 20_000) {
        await page.waitForFunction(() => !window.__studioQA.workMoving(), null, { timeout, polling: 100 });
      },
      async cameraSteady(timeout = 10_000) {
        const end = Date.now() + timeout;
        let previous = await helper.qa('getCamera');
        while (Date.now() < end) {
          await sleep(250);
          const current = await helper.qa('getCamera');
          if (current.every((v, i) => Math.abs(v - previous[i]) < 1e-4)) return current;
          previous = current;
        }
        return previous;
      },
      counters: () => page.evaluate(() => {
        const read = (key) => document.querySelector(`.nabd-diagnostics [data-metric="${key}"]`)?.textContent ?? null;
        const number = (text) => (text ? Number(text.replace(/[^0-9.]/g, '')) : null);
        const raw = { fps: read('fps'), frame: read('frame'), draw: read('draw'), triangles: read('triangles'), assets: read('assets'), events: read('events') };
        return { raw, drawCalls: number(raw.draw), triangles: number(raw.triangles), overlayFps: number(raw.fps) };
      }),
      cameraJson: () => page.evaluate(() => {
        const s = window.__studioQA.getSimulationState();
        return { getCamera: window.__studioQA.getCamera(), cameraRotation: s.cameraRotation, cameraFov: s.cameraFov,
          mode: s.mode, workMoving: window.__studioQA.workMoving(),
          detailView: document.getElementById('detail-view')?.textContent ?? null,
          cameraLabel: document.getElementById('camera-detail-label')?.textContent ?? null };
      }),
      save(name, data, dir = smokeDir) {
        fs.mkdirSync(dir, { recursive: true });
        const file = path.join(dir, `${name}.json`);
        fs.writeFileSync(file, JSON.stringify({
          flow: name, server: SERVER, project, mode, browser: browserName, browserVersion: browser.version(),
          capturedAt: new Date().toISOString(), attempt: test.info().retry,
          webglContextLostMessages: log.console.filter((m) => /context lost/i.test(m.text)).length, ...data,
        }, null, 2));
        return file;
      },
      async shot(name, dir = smokeDir) {
        fs.mkdirSync(dir, { recursive: true });
        const file = path.join(dir, `${name}.jpg`);
        await page.screenshot({ path: file, type: 'jpeg', quality: 90 });
        return file;
      },
      // Moves the mouse in small steps; a held grip follows the pointer.
      async glide(x, y, steps = 12) { await page.mouse.move(x, y, { steps }); },
    };
    await use(helper);
  },
});

test.skip(({ browserName, firefoxLaunch }) => browserName === 'firefox' && !firefoxLaunch.ok,
  'Firefox BLOCKED in this environment: the Playwright Firefox build fails to launch ("spawn UNKNOWN"); error text in smoke/<server>-firefox-headless/firefox-launch.json');

// ---------------------------------------------------------------- shared steps
const wristY = async (nabd) => (await nabd.qa('getJoints')).leftArm[2][1];

async function enterDrill(page, nabd) {
  await page.click('#forearm-practice');
  await nabd.waitFor(() => {
    const s = window.__studioQA.getSimulationState();
    return s.forearm && s.abdomen.ready && !window.__studioQA.workMoving();
  }, null, 25_000);
  await nabd.cameraSteady();
  await sleep(500);
}

async function approach(page, nabd) {
  await page.click('[data-work-approach="-1"]');
  await nabd.waitIdle();
  await nabd.cameraSteady();
  await sleep(500);
}

// Click the patient's left wrist (optionally offset in pixels); returns the click point.
async function clickWrist(page, nabd, [dx, dy] = [0, 0]) {
  const s = await nabd.sim();
  const wrist = s.practice.wrist;
  expect(wrist, 'left wrist is on screen').toBeTruthy();
  const point = { x: wrist.x + dx, y: wrist.y + dy };
  await page.mouse.click(point.x, point.y);
  return point;
}

// Grip the wrist after «اقترب». Observed in P0 (Chrome, headless): a click sometimes leaves the glove
// stalled about 13 cm short of the wrist until the 3.2 s hold timeout reports out of reach (about 1 attempt
// in 4–6), at times on repeated clicks at the same pixel. A trainee would click again a little elsewhere on
// the wrist skin, so up to 5 attempts at small pixel offsets are made; every attempt is recorded
// (nabd.gripAttempts) and saved by the flow.
const GRIP_OFFSETS = [[0, 0], [0, -6], [6, 0], [-6, 0], [0, 6]];
async function gripForearm(page, nabd, maxAttempts = GRIP_OFFSETS.length) {
  const attempts = [];
  nabd.gripAttempts = attempts;
  for (let i = 1; i <= maxAttempts; i += 1) {
    const started = Date.now();
    const point = await clickWrist(page, nabd, GRIP_OFFSETS[i - 1]);
    const outcome = await page.waitForFunction(() => {
      const s = window.__studioQA.getSimulationState();
      if (s.forearm?.state === 'gripped') return 'gripped';
      // Since P1 C5 a reach that times out says «تعذّر الإمساك …» (no contact) instead of «خارج مدى …».
      const text = document.getElementById('trainee-status').textContent;
      return text.includes('خارج مدى') || text.includes('تعذّر الإمساك') ? 'out of reach (hold timeout)' : false;
    }, null, { timeout: 6_000, polling: 100 }).then((h) => h.jsonValue(), () => 'no grip within 6 s');
    attempts.push({ attempt: i, offsetPx: GRIP_OFFSETS[i - 1], outcome, ms: Date.now() - started, glove: (await nabd.sim()).crew.wrists });
    if (outcome === 'gripped') return point;
    await sleep(1000);
  }
  throw new Error(`forearm grip failed after ${maxAttempts} attempts: ${JSON.stringify(attempts.map((a) => a.outcome))}`);
}

// Distance between two 3-vectors.
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// ---------------------------------------------------------------- S1
test('S1 boot and assets', async ({ page, nabd }) => {
  const { readyMs } = await nabd.boot();
  await sleep(2500);
  const s = await nabd.sim();
  const responses = nabd.log.responses;
  const isModule = (r) => SERVER === 'serve' ? /^\/src\/.+\.js(\?|$)/.test(r.path) : /\.(m?js)(\?|$)/.test(r.path) && !r.path.includes('/vendor/rapier/');
  const modules = responses.filter(isModule);
  const glbs = responses.filter((r) => /\.glb(\?|$)/.test(r.path));
  const rapier = responses.filter((r) => r.path.includes('/vendor/rapier/rapier.mjs'));
  const notOk = responses.filter((r) => r.status >= 400);
  const ui = await page.evaluate(() => ({
    forearmEnabled: !document.getElementById('forearm-practice').disabled,
    anatomyEnabled: !document.getElementById('anatomy-toggle').disabled,
    trainingToolEnabled: !document.getElementById('training-tool').disabled,
    modelStatus: document.getElementById('model-status').textContent,
    qaKeys: Object.keys(window.__studioQA),
    nabdSimulationKeys: Object.keys(window.NabdSimulation ?? {}),
    webgl: (() => { const g = document.createElement('canvas').getContext('webgl2'); if (!g) return 'NO WEBGL2';
      const d = g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER); })(),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    devicePixelRatio, userAgent: navigator.userAgent,
  }));
  const counters = await nabd.counters();
  const camera = await nabd.cameraJson();
  const errors = nabd.errorsSince();
  nabd.save('S1-boot', {
    readyMs, ui, supervisorVisible: s.supervisorVisible, handsVisible: s.handsVisible, mode: s.mode,
    assetStatus: await nabd.qa('getAssetStatus'), counters, camera,
    network: {
      modules: { count: modules.length, allOk: modules.every((r) => r.status === 200), list: modules },
      glbs: { count: glbs.length, allOk: glbs.every((r) => r.status === 200), list: glbs },
      rapier, notOk, failed: nabd.log.failed, foreignOrigin: nabd.log.foreign, totalResponses: responses.length,
    },
    M11: errors.length, errors, warnings: nabd.log.console.filter((m) => m.type === 'warning').map((m) => m.text),
  });
  await nabd.shot('S1-boot');

  expect(ui.qaKeys).toEqual(expect.arrayContaining(['getTargets', 'getAssetStatus', 'getSimulationState', 'getScopePixels',
    'getState', 'getCamera', 'workMoving', 'getJoints', 'setPose']));
  expect(s.supervisorVisible).toBe(true);
  expect(ui.forearmEnabled).toBe(true);
  if (SERVER === 'serve') expect(modules.length, '29 JavaScript modules (R3 + SkinPickCache.js + render/LookDev.js + the five G1 patient modules + render/GeometryFixes.js)').toBe(29);
  expect(modules.every((r) => r.status === 200)).toBe(true);
  expect(glbs.length, '9 GLBs (R3)').toBe(9);
  expect(glbs.every((r) => r.status === 200)).toBe(true);
  expect(rapier.map((r) => r.status)).toEqual([200]);
  expect(nabd.log.foreign, 'INV-10: no request beyond the app origin').toEqual([]);
  expect(errors, 'M11 = 0').toEqual([]);
});

// ---------------------------------------------------------------- S2
test('S2 forearm drill', async ({ page, nabd }) => {
  await nabd.boot();
  const mark = nabd.mark();
  const restWristY = await wristY(nabd);
  await enterDrill(page, nabd);
  const entry = await nabd.sim();
  const statusOnEntry = await nabd.text('#trainee-status');
  const cameraOnEntry = await nabd.cameraJson();

  // Click the wrist before «اقترب»: the audit saw "out of reach" (R8). Observed in P0: the click starts
  // a reach ("approaching"), the hand cannot close on the wrist from this station, and the 3.2 s hold
  // timeout (BedsideInteraction.js, holdTimeout) then reports out of reach. Record the path and timing.
  // In Playwright WebKit (and in Chrome since P1 C2) the same click grips the wrist from this station
  // instead; that outcome is recorded and the grip is released before «اقترب».
  const clickedAt = Date.now();
  const preClick = await clickWrist(page, nabd);
  const seen = [];
  let outOfReachAfterMs = null;
  let preApproachOutcome = 'none within 7 s';
  while (Date.now() - clickedAt < 7_000) {
    const status = await nabd.text('#trainee-status');
    const state = (await nabd.sim()).forearm?.state ?? null;
    const last = seen.at(-1);
    if (!last || last.status !== status || last.forearmState !== state) seen.push({ ms: Date.now() - clickedAt, status, forearmState: state });
    if (status.includes('خارج مدى') || status.includes('تعذّر الإمساك')) { outOfReachAfterMs = Date.now() - clickedAt; preApproachOutcome = 'out of reach'; break; }
    if (state === 'gripped') { preApproachOutcome = 'gripped before approach'; break; }
    await sleep(150);
  }
  const statusBeforeApproach = await nabd.text('#trainee-status');
  const forearmBeforeApproach = (await nabd.sim()).forearm;
  if (preApproachOutcome !== 'out of reach') {
    // Release without moving (same pointer position), then let the forearm settle back.
    await page.mouse.move(preClick.x, preClick.y);
    await page.mouse.down();
    await page.mouse.up();
    await nabd.waitFor(() => window.__studioQA.getSimulationState().forearm?.state === 'idle', null, 6_000).catch(() => {});
    await sleep(2500);
  }
  await sleep(300);

  await approach(page, nabd);
  const cameraAfterApproach = await nabd.cameraJson();
  await nabd.shot('S2-after-approach');

  const gripPoint = await gripForearm(page, nabd);
  const gripped = await nabd.sim();
  const statusGripped = await nabd.text('#trainee-status');
  await nabd.glide(gripPoint.x, gripPoint.y - 90, 15);
  await sleep(1200);
  const lifted = await nabd.sim();
  const liftedWristY = await wristY(nabd);
  await nabd.shot('S2-grip-lift');
  const errors = nabd.errorsSince(mark);
  nabd.save('S2-forearm-drill', {
    restWristY, statusOnEntry, cameraOnEntry, entryForearm: entry.forearm, entryRegion: entry.abdomen.region,
    preApproachClick: { outcome: preApproachOutcome, outOfReachAfterMs, sequence: seen }, statusBeforeApproach, forearmBeforeApproach, cameraAfterApproach,
    approachMovedM: dist(cameraOnEntry.getCamera, cameraAfterApproach.getCamera),
    gripAttempts: nabd.gripAttempts, statusGripped, forearmGripped: gripped.forearm, forearmLifted: lifted.forearm,
    liftedWristY, wristLiftM: liftedWristY - restWristY, grip: lifted.grip, crew: lifted.crew,
    M11: errors.length, errors,
  });

  expect(entry.forearm).not.toBeNull();
  // P1 (C2, item 6): the P0 "out of reach" here was a stalled reach (the glove jumped, the forearm sweep
  // stopped it about 13 cm short, and the 3.2 s timeout fired). With the hand moving at human speed
  // the same click now grips the wrist from this station (about 0.4 s, as WebKit already did), so
  // either outcome is recorded; a reach that neither grips nor reports within 7 s still fails.
  expect.soft(['out of reach', 'gripped before approach'], 'pre-«اقترب» click grips or reports out of reach (R8)').toContain(preApproachOutcome);
  expect(dist(cameraOnEntry.getCamera, cameraAfterApproach.getCamera), '«اقترب» moved the trainee').toBeGreaterThan(0.01);
  expect(gripped.forearm.state).toBe('gripped');
  expect(liftedWristY - restWristY, 'forearm lifted off the arm board').toBeGreaterThan(0.01);
  expect(errors, 'M11 = 0').toEqual([]);
});

// ---------------------------------------------------------------- S3
test('S3 support and release', async ({ page, nabd }) => {
  await nabd.boot();
  const mark = nabd.mark();
  const restWristY = await wristY(nabd);
  await enterDrill(page, nabd);
  await approach(page, nabd);
  const gripPoint = await gripForearm(page, nabd);
  const lift = { x: gripPoint.x, y: gripPoint.y - 90 };
  await nabd.glide(lift.x, lift.y, 15);
  await sleep(1000);
  const liftedWristY = await wristY(nabd);

  await expect(page.locator('#forearm-assist')).toBeEnabled();
  await page.click('#forearm-assist');
  await expect(page.locator('#forearm-feedback')).toHaveText('المشرف مسنّد الساعد', { timeout: 15_000 });
  const supported = await nabd.sim();
  const assistLabelSupported = await nabd.text('#forearm-assist');

  // Release: return to the exact last pointer position (no drag), then click without moving.
  await page.mouse.move(lift.x, lift.y);
  await page.mouse.down();
  await page.mouse.up();
  await sleep(1800);
  const released = await nabd.sim();
  const releasedWristY = await wristY(nabd);
  const feedbackAfterRelease = await nabd.text('#forearm-feedback');
  await nabd.shot('S3-after-release-supported');

  await page.click('#forearm-assist'); // «إنهاء المساندة»
  await sleep(3500);
  const ended = await nabd.sim();
  const endedWristY = await wristY(nabd);
  const errors = nabd.errorsSince(mark);
  nabd.save('S3-support-release', {
    gripAttempts: nabd.gripAttempts, restWristY, liftedWristY, assistLabelSupported, supportGap: supported.forearm.supportGap, forearmSupported: supported.forearm,
    feedbackAfterRelease, forearmReleased: released.forearm, releasedWristY,
    raisedAfterReleaseM: releasedWristY - restWristY,
    afterEndSupport: { forearm: ended.forearm, wristY: endedWristY, aboveRestM: endedWristY - restWristY,
      feedback: await nabd.text('#forearm-feedback'), assistLabel: await nabd.text('#forearm-assist') },
    M11: errors.length, errors,
  });

  expect(supported.forearm.supportGap).toBeLessThan(0.020);
  expect(released.forearm.state).toBe('idle');
  expect(releasedWristY - restWristY, 'forearm stays raised after release (R11)').toBeGreaterThan(0.5 * (liftedWristY - restWristY));
  expect(errors, 'M11 = 0').toEqual([]);
});

// ---------------------------------------------------------------- S4
test('S4 training session (golden trace)', async ({ page, nabd }) => {
  await nabd.boot();
  const mark = nabd.mark();
  const steps = [];
  const record = async (step, extra = {}) => {
    const s = await nabd.sim();
    steps.push({ step, phase: s.phase, results: s.practice.results, retries: s.practice.retries, lift: s.practice.lift,
      count: await nabd.text('#training-count'), instruction: await nabd.text('#training-instruction'),
      feedback: await nabd.text('#training-feedback'), ...extra });
    return s;
  };
  const phaseIs = (p, timeout = 8_000) => nabd.waitFor((x) => window.__studioQA.getSimulationState().phase === x, p, timeout);

  // Step 1: start with the side-panel button (#training-action), then the monitor question.
  await page.click('#training-action');
  await phaseIs('monitor');
  await record('started', { startedWith: '#training-action' });
  await page.click('#training-action');
  await expect.poll(() => page.evaluate(() => document.getElementById('vitals-dialog').open)).toBe(true);
  await sleep(600);
  await nabd.shot('S4-step1-monitor-dialog');
  await page.click('#vitals-confirm');
  await phaseIs('pickup');
  await sleep(900);
  await record('step1-monitor-done');

  // Step 2: pick the instrument handle on the tray.
  let s = await nabd.sim();
  const handle = s.practice.tool;
  expect(handle, 'tool handle on screen').toBeTruthy();
  await page.mouse.click(handle.x, handle.y);
  await phaseIs('aim', 8_000);
  await record('step2-pickup-done', { clickedHandle: handle });

  // Step 3: steer until the tip reaches the ring (aimPointer is the QA's pointer target for the aim point).
  s = await nabd.sim();
  let aim = s.practice.aimPointer;
  await nabd.glide(aim.x, aim.y, 20);
  const offsets = [[0, 0], [0, -12], [0, 12], [-12, 0], [12, 0], [0, -24], [0, 24], [-24, 0], [24, 0], [-12, -12], [12, 12], [12, -12], [-12, 12]];
  let tries = 0;
  for (const [dx, dy] of offsets) {
    if ((await nabd.sim()).phase !== 'aim') break;
    tries += 1;
    await nabd.glide(aim.x + dx, aim.y + dy, 6);
    await sleep(700);
  }
  await phaseIs('deposit', 4_000);
  s = await record('step3-aim-done', { aimPointer: aim, aimTries: tries, tipToAimM: dist((await nabd.sim()).instrument.tip, AIM_POINT) });

  // Step 4: move over the tray and click to release.
  const tray = s.practice.tray;
  await nabd.glide(tray.x, tray.y, 20);
  await sleep(1200);
  await page.mouse.down();
  await page.mouse.up();
  await phaseIs('wrist', 6_000);
  await sleep(1000);
  await record('step4-deposit-done', { trayPointer: tray });

  // Step 5: grip the wrist, lift it ≥ 5.2 cm, put it back, release.
  s = await nabd.sim();
  const wrist = s.practice.wrist;
  await page.mouse.click(wrist.x, wrist.y);
  await nabd.waitFor(() => window.__studioQA.getSimulationState().grip === 'wrist', null, 6_000);
  let lifted = 0;
  for (const dy of [40, 70, 100, 130, 160]) {
    await nabd.glide(wrist.x, wrist.y - dy, 8);
    await sleep(500);
    lifted = (await nabd.sim()).practice.lift;
    if (lifted >= 0.052) break;
  }
  await nabd.shot('S4-step5-wrist-lifted');
  await nabd.glide(wrist.x, wrist.y, 12);
  await sleep(900);
  await page.mouse.down();
  await page.mouse.up();
  await phaseIs('complete', 6_000);
  s = await record('step5-wrist-done', { wristPointer: wrist, maxLiftM: lifted });
  const resultText = await nabd.text('#training-results');
  await nabd.shot('S4-complete');

  const events = await page.evaluate(() => window.NabdSimulation.getEvents());
  const errors = nabd.errorsSince(mark);
  const trace = events.map((e) => `${e.event}@${e.stage}`);
  nabd.save('S4-training-session', {
    steps, finalPhase: s.phase, results: s.practice.results, retries: s.practice.retries, resultText,
    goldenTrace: trace, eventCount: events.length, events, M11: errors.length, errors,
  });

  expect(s.phase).toBe('complete');
  expect(s.practice.results).toEqual(['monitor', 'pickup', 'aim', 'deposit', 'wrist']);
  expect(errors, 'M11 = 0').toEqual([]);
});

// ---------------------------------------------------------------- S5
for (const tool of TOOLS) {
  test(`S5 instruments — ${tool} (tray view)`, async ({ page, nabd }) => {
    if (F19_KNOWN.has(tool)) {
      test.info().annotations.push({ type: 'known-failure', description: `${F19_NOTE} (CrewController.js:232-233; R20)` });
      test.fail(true, F19_NOTE);
    }
    await nabd.boot();
    const mark = nabd.mark();
    await page.selectOption('#training-tool', tool);
    await page.click('#trainee-tray-view');
    await sleep(2500);
    await nabd.cameraSteady();
    const s = await nabd.sim();
    const errors = nabd.errorsSince(mark);
    const nan = errors.filter((e) => e.includes('NaN'));
    const shot = await nabd.shot(`S5-${tool}-tray`);
    const readout = {
      tool, selected: await page.inputValue('#training-tool'), source: await page.inputValue('#training-source'),
      crew: { toolVisible: s.crew.toolVisible, mode: s.crew.mode, toolPosition: s.crew.toolPosition },
      M11: errors.length, nanErrors: nan.length, errors, knownF19: F19_KNOWN.has(tool), screenshot: path.basename(shot),
    };
    nabd.save(`S5-${tool}`, readout);
    // Per-tool console counts, collected in one file per project (tests run serially).
    const summaryFile = path.join(nabd.smokeDir, 'S5-summary.json');
    let summary = {};
    try { summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8')); } catch { summary = {}; }
    summary.server = SERVER; summary.project = nabd.project;
    summary.tools = { ...(summary.tools ?? {}), [tool]: { M11: errors.length, nanErrors: nan.length, knownF19: F19_KNOWN.has(tool), at: new Date().toISOString() } };
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    expect(nan, `no "Computed radius is NaN" errors for ${tool}`).toEqual([]);
    expect(errors, 'M11 = 0').toEqual([]);
  });
}

test('S5 instruments — staff handover (#training-source = staff)', async ({ page, nabd }) => {
  await nabd.boot();
  const mark = nabd.mark();
  await page.selectOption('#training-source', 'staff');
  await page.click('#training-action');
  await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'monitor');
  await page.click('#training-action');
  await expect.poll(() => page.evaluate(() => document.getElementById('vitals-dialog').open)).toBe(true);
  await page.click('#vitals-confirm');
  await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'pickup');
  let offered = true;
  try {
    await nabd.waitFor(() => window.__studioQA.getSimulationState().crew.offer > 0.92, null, 10_000);
  } catch { offered = false; }
  await sleep(800);
  const s = await nabd.sim();
  await nabd.shot('S5-staff-handover');
  const errors = nabd.errorsSince(mark);
  nabd.save('S5-staff-handover', {
    source: 'staff', phase: s.phase, offeredWithin10s: offered,
    crew: { mode: s.crew.mode, offer: s.crew.offer, toolVisible: s.crew.toolVisible, offeredPoint: s.crew.offeredPoint },
    instruction: await nabd.text('#training-instruction'), M11: errors.length, errors,
    note: 'Handover observed up to the offer only (the pickup from the supervisor hand is exercised in S4 with the tray source).',
  });
  expect(s.phase).toBe('pickup');
  expect(offered, 'supervisor offers the instrument').toBe(true);
  expect(errors, 'M11 = 0').toEqual([]);
});

// ---------------------------------------------------------------- S6
const PRESETS = ['camera-room', 'camera-surgeon', 'camera-anesthesia', 'camera-instruments', 'camera-overview',
  'camera-left', 'camera-right', 'camera-overhead', 'camera-torso', 'camera-abdomen', 'camera-face'];

test('S6 room view and camera presets', async ({ page, nabd }) => {
  await nabd.boot();
  const mark = nabd.mark();
  await enterDrill(page, nabd);
  const drillActive = (await nabd.sim()).forearm !== null;
  // P1 (C5, item 10, F31), intended change: the room view is refused while the drill is open (P0 ended the
  // drill silently). The refusal is recorded; the drill is then closed with its own button and the room view
  // opens (a 1.2 s glide since P1 C5, item 8).
  await page.click('#toggle-trainee-mode');
  await sleep(600);
  const refusedState = await nabd.sim();
  const refusal = { mode: refusedState.mode, drillKept: refusedState.forearm !== null, status: await nabd.text('#trainee-status') };
  await page.click('#forearm-practice');
  await sleep(300);
  await page.click('#toggle-trainee-mode');
  await sleep(1500);
  const afterToggle = await nabd.sim();
  const teardown = {
    drillActiveBefore: drillActive, refusal, forearmAfter: afterToggle.forearm, mode: afterToggle.mode,
    forearmButtonPressed: await page.getAttribute('#forearm-practice', 'aria-pressed'),
    supervisorVisible: afterToggle.supervisorVisible, handsVisible: afterToggle.handsVisible,
  };
  const presets = [];
  const allShots = nabd.project === 'chrome';
  for (const id of PRESETS) {
    // A real pointer click lands on whatever element is on top at the button's centre. P0 observed that
    // #anatomy-toggle covers #camera-overview at 1440×900; record it and then click through the DOM.
    const topmost = await page.locator(`#${id}`).evaluate((el) => {
      const box = el.getBoundingClientRect();
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return top === el || el.contains(top) ? null : (top?.id ? `#${top.id}` : top?.tagName ?? 'none');
    });
    if (topmost) await page.locator(`#${id}`).dispatchEvent('click');
    else await page.click(`#${id}`);
    await sleep(900);
    await nabd.cameraSteady();
    await sleep(600);
    presets.push({ id, obstructedBy: topmost, clickedVia: topmost ? 'dispatchEvent (DOM click)' : 'pointer click',
      pressed: await page.getAttribute(`#${id}`, 'aria-pressed'), camera: await nabd.cameraJson(), counters: await nabd.counters() });
    if (id === 'camera-room' || allShots) await nabd.shot(`S6-${id}`);
  }
  const obstructed = presets.filter((p) => p.obstructedBy).map((p) => `${p.id} covered by ${p.obstructedBy}`);
  if (obstructed.length) test.info().annotations.push({ type: 'observation', description: `Preset buttons not reachable by pointer: ${obstructed.join('; ')}` });
  const errors = nabd.errorsSince(mark);
  nabd.save('S6-room-presets', { teardown, obstructed, presets, M11: errors.length, errors });

  expect(refusal, 'room view refused while the drill is open (P1 C5, F31)').toEqual({ mode: true, drillKept: true, status: 'أغلق تمرين الساعد أولًا ثم افتح معاينة الغرفة' });
  expect(teardown.forearmAfter, 'the drill was closed with its own button before the room view').toBeNull();
  expect(afterToggle.mode).toBe(false);
  expect(presets.every((p) => p.pressed === 'true')).toBe(true);
  expect(errors, 'M11 = 0').toEqual([]);
});

// ---------------------------------------------------------------- S7
test('S7 internal anatomy', async ({ page, nabd }) => {
  await nabd.boot();
  const mark = nabd.mark();
  await page.click('#anatomy-toggle');
  await nabd.waitFor(() => window.__studioQA.getSimulationState().anatomy?.active === true);
  await sleep(1500);
  const opened = (await nabd.sim()).anatomy;
  const readoutAll = await nabd.text('#anatomy-readout');
  const attribution = await nabd.text('.anatomy-source a');
  const options = await page.$$eval('#anatomy-organ option', (list) => list.map((o) => ({ value: o.value, label: o.textContent })));
  await page.selectOption('#anatomy-organ', 'appendix');
  await sleep(1500);
  const selectedApp = (await nabd.sim()).anatomy;
  await page.check('#anatomy-isolate');
  await sleep(1500);
  const isolated = (await nabd.sim()).anatomy;
  const readoutIsolated = await nabd.text('#anatomy-readout');
  await nabd.shot('S7-appendix-isolated');
  await page.click('#anatomy-reset');
  await sleep(1500);
  await nabd.cameraSteady();
  const reset = (await nabd.sim()).anatomy;
  await nabd.shot('S7-anatomy-full');
  const errors = nabd.errorsSince(mark);
  const brief = (a) => a && { active: a.active, keyCount: a.keys.length, visibleCount: a.visible.length, visible: a.visible, selected: a.selected, attached: a.attached };
  nabd.save('S7-anatomy', {
    keys: opened.keys, opened: brief(opened), readoutAll, attribution, optionCount: options.length,
    appendixOption: options.find((o) => o.value === 'appendix') ?? null,
    appendixSelected: brief(selectedApp), appendixIsolated: brief(isolated), readoutIsolated,
    afterReset: brief(reset), counters: await nabd.counters(), camera: await nabd.cameraJson(), M11: errors.length, errors,
  });

  expect(opened.keys.length).toBe(35);
  expect(readoutAll).toContain('35');
  expect(attribution).toContain('BodyParts3D');
  expect(isolated.selected).toBe('appendix');
  expect(isolated.visible).toContain('appendix');
  expect(errors, 'M11 = 0').toEqual([]);
});

// ---------------------------------------------------------------- S8
// Camera-space x of a world point for a camera with Euler 'YXZ' rotation (yaw = rotation[1]).
const cameraSpaceX = (point, cam) => {
  const yaw = cam.cameraRotation[1];
  const right = [Math.cos(yaw), 0, -Math.sin(yaw)];
  return (point[0] - cam.getCamera[0]) * right[0] + (point[2] - cam.getCamera[2]) * right[2];
};

test('S8 hands and locomotion', async ({ page, nabd }) => {
  await nabd.boot();
  const mark = nabd.mark();
  const cam0 = await nabd.cameraJson();
  const s0 = await nabd.sim();
  const handButtons = async () => ({
    left: await page.getAttribute('#trainee-reach-left', 'aria-pressed'),
    right: await page.getAttribute('#trainee-reach-right', 'aria-pressed'),
  });
  const hands = { initial: await handButtons() };
  await page.click('#trainee-reach-left');
  await sleep(500);
  hands.afterLeftButton = { buttons: await handButtons(), crew: (await nabd.sim()).crew };
  await page.click('#trainee-reach-right');
  await sleep(500);
  hands.afterRightButton = { buttons: await handButtons(), crew: (await nabd.sim()).crew };
  await page.keyboard.press('KeyQ');
  await sleep(300);
  hands.afterQ = await handButtons();
  await page.keyboard.press('KeyE');
  await sleep(300);
  hands.afterE = await handButtons();
  const lateral = {
    leftGloveCameraX: cameraSpaceX(s0.crew.wrists.left, cam0),
    rightGloveCameraX: cameraSpaceX(s0.crew.wrists.right, cam0),
  };

  // Hold D for 2 s in the free bedside view (U14).
  const beforeD = await nabd.qa('getCamera');
  await page.keyboard.down('KeyD');
  await sleep(2000);
  await page.keyboard.up('KeyD');
  await sleep(400);
  const afterD = await nabd.qa('getCamera');

  // Work-walk controls exist only at a workstation: open the abdomen work area first.
  await page.click('#trainee-focus-abdomen');
  await nabd.waitFor(() => { const s = window.__studioQA.getSimulationState(); return s.abdomen.ready && !window.__studioQA.workMoving(); }, null, 25_000);
  await nabd.cameraSteady();
  const atStation = await nabd.cameraJson();
  const sideAtStation = await nabd.text('#work-side');
  await page.click('[data-work-step="1"]');
  await sleep(300);
  await nabd.waitIdle();
  await nabd.cameraSteady();
  const afterStep = await nabd.cameraJson();
  await page.click('#work-other-side');
  await sleep(300);
  await nabd.waitIdle(30_000);
  await nabd.cameraSteady();
  const afterOtherSide = await nabd.cameraJson();
  const sideAfterOtherSide = await nabd.text('#work-side');
  await nabd.shot('S8-other-side');
  const errors = nabd.errorsSince(mark);
  nabd.save('S8-hands-locomotion', {
    hands, lateralOrderingAtRest: lateral, crewAtRest: s0.crew,
    holdD2s: { before: beforeD, after: afterD, movedM: dist(beforeD, afterD) },
    workWalk: { atStation, sideAtStation, afterStep, stepMovedM: dist(atStation.getCamera, afterStep.getCamera),
      afterOtherSide, sideAfterOtherSide, otherSideMovedM: dist(afterStep.getCamera, afterOtherSide.getCamera) },
    M11: errors.length, errors,
  });

  expect(hands.afterLeftButton.buttons).toEqual({ left: 'true', right: 'false' });
  expect(hands.afterRightButton.buttons).toEqual({ left: 'false', right: 'true' });
  expect(hands.afterQ).toEqual({ left: 'true', right: 'false' });
  expect(hands.afterE).toEqual({ left: 'false', right: 'true' });
  expect(lateral.leftGloveCameraX, 'INV-3 lateral ordering: left glove at camera-space x < 0').toBeLessThan(0);
  expect(lateral.rightGloveCameraX).toBeGreaterThan(0);
  expect(errors, 'M11 = 0').toEqual([]);
});

// ---------------------------------------------------------------- S9
test('S9 port and scope', async ({ page, nabd }) => {
  await nabd.boot();
  const mark = nabd.mark();
  await page.selectOption('#training-tool', 'scope');
  await page.click('#trainee-tray-view');
  await sleep(1200);
  await nabd.cameraSteady();
  let s = await nabd.sim();
  const handle = s.practice.tool;
  await page.mouse.click(handle.x, handle.y);
  await nabd.waitFor(() => window.__studioQA.getSimulationState().grip === 'tool', null, 8_000);
  await expect(page.locator('#open-tool-field')).toBeVisible();
  await page.click('#open-tool-field');
  await nabd.waitFor(() => { const x = window.__studioQA.getSimulationState(); return x.abdomen.ready && !window.__studioQA.workMoving() && x.instrument.portScreen; }, null, 25_000);
  await nabd.cameraSteady();
  s = await nabd.sim();
  const port = s.instrument.portScreen;
  await nabd.glide(port.x, port.y, 20);
  const offsets = [[0, 0], [0, -8], [0, 8], [-8, 0], [8, 0], [0, -16], [0, 16]];
  for (const [dx, dy] of offsets) {
    if ((await nabd.sim()).instrument.aligned) break;
    await nabd.glide(port.x + dx, port.y + dy, 4);
    await sleep(500);
  }
  await nabd.waitFor(() => window.__studioQA.getSimulationState().instrument.aligned === true, null, 4_000);
  const aligned = (await nabd.sim()).instrument;
  for (let i = 0; i < 6; i += 1) {
    await page.click('#tool-depth-controls [data-tool-depth="1"]');
    await sleep(250);
  }
  await page.click('#tool-depth-controls [data-tool-roll="1"]');
  await sleep(800);
  const inserted = await nabd.sim();
  const depthText = await nabd.text('#tool-depth-value');
  await nabd.shot('S9-scope-inserted');
  await expect(page.locator('#scope-view')).toBeVisible();
  await page.click('#scope-view');
  await sleep(1500);
  const monitor = await nabd.sim();
  const pixels = await nabd.qa('getScopePixels');
  const signal = await nabd.text('#scope-signal');
  await nabd.shot('S9-scope-monitor');
  await page.click('#scope-view');
  await sleep(800);
  const errors = nabd.errorsSince(mark);
  nabd.save('S9-port-scope', {
    portScreen: port, aligned, depthText,
    inserted: { instrument: inserted.instrument, scope: inserted.scope },
    monitorLook: { scope: monitor.scope, signal, pixels, cameraLabel: await nabd.text('#camera-detail-label') },
    M11: errors.length, errors,
  });

  expect(aligned.aligned).toBe(true);
  expect(inserted.instrument.percent).toBeGreaterThan(0);
  expect(monitor.scope.live).toBe(true);
  expect(monitor.scope.lookingAtMonitor).toBe(true);
  expect(pixels.length).toBe(12);
  expect(errors, 'M11 = 0').toEqual([]);
});

// ---------------------------------------------------------------- V1–V4 visual baselines (09 §2.3)
// Wait until workMoving() is false, then a fixed settle time of 2 s (PROPOSED), then capture.
async function captureView(page, nabd, name) {
  await nabd.waitIdle();
  await nabd.cameraSteady();
  await sleep(2000);
  const camera = await nabd.cameraJson();
  const counters = await nabd.counters();
  const shot = await nabd.shot(name, nabd.visualDir);
  nabd.save(name, { camera, counters, screenshot: path.basename(shot), settleMs: 2000 }, nabd.visualDir);
  return { camera, counters };
}

test('V1 default bedside view', async ({ page, nabd }) => {
  await nabd.boot();
  const mark = nabd.mark();
  const { counters } = await captureView(page, nabd, 'V1-default-bedside');
  expect(counters.drawCalls).toBeGreaterThan(0);
  expect(nabd.errorsSince(mark)).toEqual([]);
});

test('V2 forearm drill after approach', async ({ page, nabd }) => {
  await nabd.boot();
  const mark = nabd.mark();
  await enterDrill(page, nabd);
  await approach(page, nabd);
  const { counters } = await captureView(page, nabd, 'V2-forearm-drill-after-approach');
  expect(counters.drawCalls).toBeGreaterThan(0);
  expect(nabd.errorsSince(mark)).toEqual([]);
});

test('V3 room view preset', async ({ page, nabd }) => {
  await nabd.boot();
  const mark = nabd.mark();
  await page.click('#toggle-trainee-mode');
  await sleep(500);
  await page.click('#camera-room');
  await sleep(900);
  const { counters } = await captureView(page, nabd, 'V3-room-camera-room');
  expect(counters.drawCalls).toBeGreaterThan(0);
  expect(nabd.errorsSince(mark)).toEqual([]);
});

test('V4 internal anatomy full view', async ({ page, nabd }) => {
  await nabd.boot();
  const mark = nabd.mark();
  await page.click('#anatomy-toggle');
  await nabd.waitFor(() => window.__studioQA.getSimulationState().anatomy?.active === true);
  await sleep(500);
  await page.click('#anatomy-reset');
  await sleep(900);
  const { counters } = await captureView(page, nabd, 'V4-anatomy-full');
  expect(counters.drawCalls).toBeGreaterThan(0);
  expect(nabd.errorsSince(mark)).toEqual([]);
});
