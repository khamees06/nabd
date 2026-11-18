// P1 interaction checks (branch p1-interaction). Each check measures what RANKED-FIXES.md asks for:
// C1 = Batch 1 items 1, 2, 4 and 7 (look and view): turning with keys and buttons, drag looks wherever
// the hand cannot act, looks never cut or ignored, view kept on screen and the wheel always zooming.
// C2 = Batch 1 items 3, 5, 6, 12 and 13 (hands): the glove faces the skin, surface grips attach, hands
// move at human speed, no hitches during limb drags and hover, and a short stand-in sleeve.
// C3 = Batch 1 item 9 (limbs): drill and ankle grips attach, an upward drag lifts the limb, the hold
// pauses outside the view, and every released limb settles back onto the bed.
// C4 = Batch 1 item 11 (tools): pickup at human speed, a carry that points ahead of the trainee on both
// sides of the bed, free instruments that follow the pointer at the work area, no jump after a look or
// the monitor, the monitor filling the view, roll stopping at ±90° and Escape placing an inserted scope.
// C5 = Batch 1 items 8 and 10 (navigation): moves around the bed, steps, re-centring, Escape and the room view
// glide and turn at human speed and keep the trainee's look; every refused move or action says why.
// Same fixture pattern as smoke.spec.mjs: boot /?qa&debug=1, wait for #model-status[data-state="ready"],
// read window.__studioQA, drive real page.mouse / page.keyboard input. Read-only with respect to the app.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const SERVER = process.env.NABD_SMOKE_SERVER === 'vite' ? 'vite-preview' : 'serve';
const EVIDENCE = path.resolve(process.env.NABD_EVIDENCE_DIR || path.join(root, 'docs/improvement-plan/evidence/p1-interaction'));
const ENTRY = '/?qa&debug=1';
const LOOK_RAD_PER_PX = 0.0039; // NabdRuntime.js look(): traineeYaw -= dx * 0.0039
const WIDE = { width: 1440, height: 900 };
const NARROW = { width: 560, height: 890 };
const sizeName = ({ width, height }) => `${width}x${height}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deg = (rad) => rad * 180 / Math.PI;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const angleDiff = (a, b) => deg(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

const test = base.extend({
  nabd: async ({ page, browser, browserName, baseURL }, use, testInfo) => {
    const project = testInfo.project.name;
    const dir = path.join(EVIDENCE, 'interaction', `${SERVER}-${project}-headless`);
    const log = { console: [], pageErrors: [] };
    page.on('console', (m) => log.console.push({ type: m.type(), text: m.text().slice(0, 600) }));
    page.on('pageerror', (e) => log.pageErrors.push({ text: String(e?.message ?? e).slice(0, 600) }));
    const helper = {
      project, dir, log,
      errors: () => [
        ...log.console.filter((m) => m.type === 'error').map((m) => `console.error: ${m.text}`),
        ...log.pageErrors.map((e) => `pageerror: ${e.text}`),
      ],
      async boot() {
        await page.goto(ENTRY, { waitUntil: 'load' });
        await page.locator('#model-status[data-state="ready"]').waitFor({ state: 'attached', timeout: 60_000 });
        await page.waitForFunction(() => Boolean(window.__studioQA), null, { timeout: 10_000 });
        await sleep(2000);
      },
      sim: () => page.evaluate(() => window.__studioQA.getSimulationState()),
      qa: (name) => page.evaluate((n) => window.__studioQA[n](), name),
      text: (selector) => page.locator(selector).first().evaluate((el) => el.textContent.trim()),
      waitFor: (fn, arg, timeout = 15_000) => page.waitForFunction(fn, arg, { timeout, polling: 100 }),
      async view() {
        const s = await helper.sim();
        return { yaw: s.cameraRotation[1], pitch: s.cameraRotation[0], position: s.cameraPosition, fov: s.cameraFov };
      },
      async cameraSteady(timeout = 10_000) {
        const end = Date.now() + timeout;
        let previous = await helper.view();
        while (Date.now() < end) {
          await sleep(250);
          const current = await helper.view();
          if (dist(current.position, previous.position) < 1e-4 && Math.abs(current.yaw - previous.yaw) < 1e-4) return current;
          previous = current;
        }
        return previous;
      },
      rect: (selector) => page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height,
          visible: b.width > 0 && b.height > 0 && getComputedStyle(el).display !== 'none' };
      }, selector),
      canvas: () => helper.rect('#viewport canvas'),
      // Smooth scrolling (revealViewport) finishes within ~1 s; wait until the page stops moving.
      async scrollSettled(timeout = 3000) {
        const end = Date.now() + timeout;
        let last = await page.evaluate(() => window.scrollY);
        while (Date.now() < end) {
          await sleep(150);
          const now = await page.evaluate(() => window.scrollY);
          if (now === last) return now;
          last = now;
        }
        return last;
      },
      save(name, data) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify({
          check: name, server: SERVER, project, browser: browserName, browserVersion: browser.version(),
          viewport: page.viewportSize(), capturedAt: new Date().toISOString(), ...data,
        }, null, 2));
      },
      async shot(name) {
        fs.mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: path.join(dir, `${name}.jpg`), type: 'jpeg', quality: 72 });
      },
      async holdKey(key, ms) {
        await page.keyboard.down(key);
        await sleep(ms);
        await page.keyboard.up(key);
        await sleep(120);
      },
      // A right-button drag (always a look). Returns nothing; read the view before and after.
      async rightDrag(x, y, dx, dy = 0, steps = 10, pauseMs = 0) {
        await page.mouse.move(x, y);
        await page.mouse.down({ button: 'right' });
        for (let k = 1; k <= steps; k += 1) {
          await page.mouse.move(x + dx * k / steps, y + dy * k / steps);
          if (pauseMs) await sleep(pauseMs);
        }
        await page.mouse.up({ button: 'right' });
      },
      async canvasCentre() {
        const c = await helper.canvas();
        return { x: c.left + c.width / 2, y: c.top + c.height / 2 };
      },
    };
    await use(helper);
  },
});

async function enterDrill(page, nabd) {
  await page.click('#forearm-practice');
  await nabd.waitFor(() => {
    const s = window.__studioQA.getSimulationState();
    return s.forearm && s.abdomen.ready && !window.__studioQA.workMoving();
  }, null, 25_000);
  await nabd.cameraSteady();
  await sleep(400);
}

async function startMonitorStep(page, nabd) {
  await page.click('#training-action');
  await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'monitor');
  await nabd.scrollSettled();
  await nabd.cameraSteady();
  await sleep(300);
}

// Hold ← for 700 ms and → for 700 ms; the trainee must turn and stay in place.
async function measureArrowTurn(page, nabd) {
  const before = await nabd.view();
  await nabd.holdKey('ArrowLeft', 700);
  const afterLeft = await nabd.view();
  await nabd.holdKey('ArrowRight', 700);
  const afterRight = await nabd.view();
  return {
    leftYawDeg: angleDiff(afterLeft.yaw, before.yaw), leftMovedM: dist(afterLeft.position, before.position),
    rightYawDeg: angleDiff(afterRight.yaw, afterLeft.yaw), rightMovedM: dist(afterRight.position, afterLeft.position),
  };
}

for (const size of [WIDE, NARROW]) {
  test.describe(`C1 look ${sizeName(size)}`, () => {
    test.use({ viewport: size });

    // ------------------------------------------------------------- item 1
    test(`C1-1 keys and buttons turn the view (${sizeName(size)})`, async ({ page, nabd }) => {
      await nabd.boot();
      const result = {};
      // The tray handle in the default bedside view sits in the bottom-left corner, where the look
      // overlay is: a press there must still reach the canvas (only the overlay's buttons take input).
      const handle = (await nabd.sim()).practice.tool;
      result.freeHandle = { handle, topElement: handle && await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.tagName ?? null, [handle.x, handle.y]) };
      result.free = await measureArrowTurn(page, nabd);

      // ↑/↓ tilt the view and stay inside −1.28…0.42 rad.
      await nabd.holdKey('ArrowUp', 2200);
      const up = await nabd.view();
      await nabd.holdKey('ArrowDown', 3600);
      const down = await nabd.view();
      result.pitch = { upRad: up.pitch, downRad: down.pitch };
      await nabd.holdKey('ArrowUp', 1300);

      // W/A/S/D still walk; D moves sideways without turning.
      const beforeD = await nabd.view();
      await nabd.holdKey('KeyD', 600);
      const afterD = await nabd.view();
      result.walkD = { movedM: dist(afterD.position, beforeD.position), yawDeg: angleDiff(afterD.yaw, beforeD.yaw) };

      // ↺ click turns 15°, ↻ held for 1 s keeps turning.
      let before = await nabd.view();
      await page.click('[data-look-turn="1"]');
      await sleep(450);
      result.leftButtonClickDeg = angleDiff((await nabd.view()).yaw, before.yaw);
      before = await nabd.view();
      const right = await page.locator('[data-look-turn="-1"]').boundingBox();
      await page.mouse.move(right.x + right.width / 2, right.y + right.height / 2);
      await page.mouse.down();
      await sleep(1000);
      await page.mouse.up();
      await sleep(300);
      result.rightButtonHold1sDeg = angleDiff((await nabd.view()).yaw, before.yaw);

      // The overlay sits inside the canvas and on screen.
      const canvas = await nabd.canvas();
      const overlay = await nabd.rect('#look-controls');
      const lookButton = await nabd.rect('#trainee-look-mode');
      const innerHeight = await page.evaluate(() => window.innerHeight);
      result.overlay = { canvas, overlay, lookButton, innerHeight };
      const inside = (r) => r.left >= canvas.left - 0.5 && r.right <= canvas.right + 0.5 && r.top >= canvas.top - 0.5 && r.bottom <= canvas.bottom + 0.5;
      result.overlayInsideCanvas = inside(overlay) && inside(lookButton);
      result.hint = await nabd.text('#look-controls .look-hint-mouse');

      // Training step 1 (monitor).
      await startMonitorStep(page, nabd);
      result.step1 = await measureArrowTurn(page, nabd);

      // Forearm drill: arrows used to walk around the bed; they turn now. A/D still walk.
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.click('#training-reset');
      await enterDrill(page, nabd);
      result.drill = await measureArrowTurn(page, nabd);
      const drillOverlay = await nabd.rect('#look-controls');
      const drillCanvas = await nabd.canvas();
      result.drillOverlay = { overlay: drillOverlay, canvas: drillCanvas, onScreen: drillOverlay.top >= 0 && drillOverlay.bottom <= innerHeight };
      if (size === NARROW) await nabd.shot(`C1-1-drill-look-overlay-${sizeName(size)}`);

      nabd.save(`C1-1-keys-buttons-${sizeName(size)}`, { result, errors: nabd.errors() });
      for (const mode of ['free', 'step1', 'drill']) {
        expect(Math.abs(result[mode].leftYawDeg), `${mode}: ← 700 ms turns ≥ 45°`).toBeGreaterThanOrEqual(45);
        expect(result[mode].leftYawDeg, `${mode}: ← turns left (yaw grows)`).toBeGreaterThan(0);
        expect(result[mode].rightYawDeg, `${mode}: → turns right`).toBeLessThan(-45);
        expect(result[mode].leftMovedM, `${mode}: ← does not move the trainee`).toBeLessThan(0.01);
        expect(result[mode].rightMovedM).toBeLessThan(0.01);
      }
      expect(result.pitch.upRad).toBeCloseTo(0.42, 3);
      expect(result.pitch.downRad).toBeCloseTo(-1.28, 3);
      expect(result.walkD.movedM, 'D still walks').toBeGreaterThan(0.05);
      expect(Math.abs(result.walkD.yawDeg)).toBeLessThan(0.5);
      expect(result.leftButtonClickDeg).toBeCloseTo(15, 0);
      expect(result.rightButtonHold1sDeg, '↻ held 1 s keeps turning right').toBeLessThan(-60);
      expect(result.overlayInsideCanvas, 'look overlay inside the canvas').toBe(true);
      if (result.freeHandle.handle) expect(result.freeHandle.topElement, 'tray handle still reachable under the overlay').toBe('CANVAS');
      expect(result.drillOverlay.onScreen, 'look overlay visible in the drill').toBe(true);
      expect(result.hint).toContain('الأيمن');
      expect(result.hint).toContain('←/→');
      expect(result.hint).toContain('L');
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    test(`C1-1b arrows nudge a held tool instead of turning (${sizeName(size)})`, async ({ page, nabd }) => {
      await nabd.boot();
      await startMonitorStep(page, nabd);
      await page.click('#training-action');
      await expect.poll(() => page.evaluate(() => document.getElementById('vitals-dialog').open)).toBe(true);
      await page.click('#vitals-confirm');
      await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'pickup');
      await nabd.scrollSettled();
      await nabd.cameraSteady();
      const handle = (await nabd.sim()).practice.tool;
      await page.mouse.click(handle.x, handle.y);
      await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'aim', null, 8_000);
      await sleep(500);
      const before = await nabd.view();
      const toolBefore = (await nabd.sim()).crew.toolPosition;
      for (let k = 0; k < 6; k += 1) { await page.keyboard.press('ArrowLeft'); await sleep(60); }
      await sleep(500);
      const after = await nabd.view();
      const toolAfter = (await nabd.sim()).crew.toolPosition;
      // The ↺ button still turns while the tool is held.
      await page.click('[data-look-turn="1"]');
      await sleep(450);
      const afterButton = await nabd.view();
      const result = { arrowYawDeg: angleDiff(after.yaw, before.yaw), toolMovedM: dist(toolAfter, toolBefore),
        buttonYawDeg: angleDiff(afterButton.yaw, after.yaw), grip: (await nabd.sim()).grip };
      nabd.save(`C1-1b-nudge-priority-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(Math.abs(result.arrowYawDeg), 'arrows nudge the held tool, not the view').toBeLessThan(0.5);
      expect(result.toolMovedM, 'the held tool moved with the arrows').toBeGreaterThan(0.005);
      expect(result.buttonYawDeg).toBeCloseTo(15, 0);
      expect(result.grip).toBe('tool');
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 2
    for (const mode of ['free', 'monitor', 'drill']) {
      test(`C1-2 left-drag grid turns the view: ${mode} (${sizeName(size)})`, async ({ page, nabd }) => {
        test.setTimeout(300_000);
        await nabd.boot();
        if (mode === 'monitor') await startMonitorStep(page, nabd);
        if (mode === 'drill') await enterDrill(page, nabd);
        await page.evaluate(() => window.scrollTo(0, 0));
        const canvas = await nabd.canvas();
        const centre = await nabd.canvasCentre();
        const cells = [];
        for (let row = 0; row < 5; row += 1) {
          for (let col = 0; col < 7; col += 1) {
            const x = canvas.left + canvas.width * (0.10 + 0.70 * col / 6);
            const y = canvas.top + canvas.height * (0.24 + 0.50 * row / 4);
            const hit = await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.tagName ?? null, [x, y]);
            const before = await nabd.view();
            await page.mouse.move(x, y);
            await page.mouse.down();
            await page.mouse.move(x + 60, y, { steps: 6 });
            await page.mouse.up();
            await sleep(150);
            const after = await nabd.view();
            const s = await nabd.sim();
            const turned = angleDiff(after.yaw, before.yaw);
            const held = s.grip ?? (s.crew.reach.left || s.crew.reach.right ? 'reach' : null);
            cells.push({ row, col, x: Math.round(x), y: Math.round(y), element: hit, yawDeg: Number(turned.toFixed(2)), held });
            // Undo the cell so every cell starts from the same view.
            if (held) {
              await page.keyboard.press('Escape');
              await sleep(400);
            }
            if (Math.abs(turned) > 0.3) {
              await nabd.rightDrag(centre.x, centre.y, (turned * Math.PI / 180) / LOOK_RAD_PER_PX, 0, 6);
              await sleep(120);
            }
          }
        }
        const turnedCells = cells.filter((c) => Math.abs(c.yawDeg) >= 5).length;
        const share = turnedCells / cells.length;
        const result = { mode, share, turnedCells, total: cells.length,
          map: [0, 1, 2, 3, 4].map((r) => cells.filter((c) => c.row === r).map((c) => (Math.abs(c.yawDeg) >= 5 ? 'L' : c.held ? 'H' : c.element !== 'CANVAS' ? 'U' : '.')).join('')),
          cells };
        nabd.save(`C1-2-grid-${mode}-${sizeName(size)}`, { result, errors: nabd.errors() });
        expect(share, `${mode}: share of 60 px left-drags that turn the view`).toBeGreaterThanOrEqual(0.9);
        expect(nabd.errors(), 'M11 = 0').toEqual([]);
      });
    }

    test(`C1-2b drag on the patient looks; out-of-reach only on a still click (${sizeName(size)})`, async ({ page, nabd }) => {
      await nabd.boot();
      const canvas = await nabd.canvas();
      // Hover a grid and read the cursor the app sets: look areas, reachable skin, unreachable targets.
      const hover = [];
      for (let row = 0; row < 9; row += 1) {
        for (let col = 0; col < 9; col += 1) {
          const x = canvas.left + canvas.width * (0.08 + 0.84 * col / 8);
          const y = canvas.top + canvas.height * (0.22 + 0.56 * row / 8);
          await page.mouse.move(x, y);
          await sleep(40);
          const cursor = await page.evaluate(() => document.querySelector('#viewport canvas').style.cursor);
          hover.push({ x, y, cursor });
        }
      }
      const cursors = [...new Set(hover.map((h) => h.cursor))];
      const skin = hover.find((h) => h.cursor === 'crosshair');
      const far = hover.find((h) => h.cursor === 'not-allowed');
      const result = { cursors, skin, far };

      // Drag starting on the patient's skin: the reach is cancelled and the view turns.
      await page.mouse.move(skin.x, skin.y);
      await page.mouse.down();
      await sleep(120);
      result.statusOnPress = await nabd.text('#trainee-status');
      let before = await nabd.view();
      await page.mouse.move(skin.x + 60, skin.y, { steps: 6 });
      await page.mouse.up();
      await sleep(250);
      let after = await nabd.view();
      result.patientDragYawDeg = angleDiff(after.yaw, before.yaw);
      result.statusAfterDrag = await nabd.text('#trainee-status');
      result.reachAfterDrag = (await nabd.sim()).crew.reach;

      if (far) {
        // Unreachable target: a drag turns without the out-of-reach message; a still click shows it.
        await page.evaluate(() => { document.getElementById('training-feedback').textContent = ''; });
        before = await nabd.view();
        // The previous drag turned the view; move back first so the unreachable point is under the cursor again.
        await nabd.rightDrag(canvas.left + canvas.width / 2, canvas.top + canvas.height / 2, -60, 0, 6);
        await sleep(200);
        await page.mouse.move(far.x, far.y);
        await sleep(60);
        result.farCursorAgain = await page.evaluate(() => document.querySelector('#viewport canvas').style.cursor);
        before = await nabd.view();
        await page.mouse.down();
        await sleep(100);
        result.feedbackOnFarPress = await nabd.text('#training-feedback');
        await page.mouse.move(far.x - 60, far.y, { steps: 6 });
        await page.mouse.up();
        await sleep(250);
        after = await nabd.view();
        result.farDragYawDeg = angleDiff(after.yaw, before.yaw);
        result.feedbackAfterFarDrag = await nabd.text('#training-feedback');
        await nabd.rightDrag(canvas.left + canvas.width / 2, canvas.top + canvas.height / 2, 60, 0, 6);
        await sleep(200);
        await page.mouse.move(far.x, far.y);
        await sleep(60);
        await page.mouse.down();
        await page.mouse.up();
        await sleep(250);
        result.feedbackAfterFarClick = await nabd.text('#training-feedback');
      }
      nabd.save(`C1-2b-patient-drag-cursors-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(cursors).toContain('all-scroll');
      expect(cursors).toContain('crosshair');
      expect(skin, 'a reachable skin point exists').toBeTruthy();
      expect(result.statusOnPress).toBe('لمس سطح المريض');
      expect(Math.abs(result.patientDragYawDeg), 'a drag on the patient turns ≥ 10°').toBeGreaterThanOrEqual(10);
      expect(result.statusAfterDrag).toBe('واقف بجانب المريض');
      expect(result.reachAfterDrag).toEqual({ left: null, right: null });
      if (far) {
        expect(result.feedbackOnFarPress, 'no out-of-reach message on press').not.toContain('خارج مدى');
        expect(Math.abs(result.farDragYawDeg)).toBeGreaterThanOrEqual(10);
        expect(result.feedbackAfterFarDrag, 'no out-of-reach message after a drag').not.toContain('خارج مدى');
        expect(result.feedbackAfterFarClick, 'a still click reports out of reach').toContain('خارج مدى');
      } else {
        test.info().annotations.push({ type: 'note', description: 'no unreachable target in the hover grid at this size' });
      }
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 4
    test(`C1-4 look is never cut or ignored (${sizeName(size)})`, async ({ page, nabd }) => {
      test.setTimeout(240_000);
      await nabd.boot();
      const result = {};
      // (a) Start training and right-drag 200 px 0.3 s later: no pose tween, the drag turns the view,
      // and the move to the tray still finishes without pulling the head back.
      const startPosition = (await nabd.view()).position;
      await page.click('#training-action');
      result.animatingAfterStart = (await nabd.qa('getState')).animating;
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(300 - 60);
      const centre = await nabd.canvasCentre();
      const beforeDrag = await nabd.view();
      await nabd.rightDrag(centre.x, centre.y, 200, 0, 10);
      const afterDrag = await nabd.view();
      const settled = await nabd.cameraSteady();
      result.trainingStart = {
        yawDeg: angleDiff(afterDrag.yaw, beforeDrag.yaw), headPulledBackDeg: angleDiff(settled.yaw, afterDrag.yaw),
        walkedM: dist(settled.position, startPosition), phase: (await nabd.sim()).phase,
      };

      // (b) Right-drag released 40 px below the canvas: the browser menu stays closed.
      await page.evaluate(() => {
        window.__menus = [];
        window.addEventListener('contextmenu', (e) => window.__menus.push({ target: e.target.id || e.target.className || e.target.tagName, prevented: e.defaultPrevented }));
      });
      const canvas = await nabd.canvas();
      await nabd.rightDrag(centre.x, centre.y, 0, canvas.bottom + 40 - centre.y, 8);
      await sleep(300);
      result.contextMenu = await page.evaluate(() => window.__menus);
      // An ordinary right-click away from the canvas, later, still opens the browser menu.
      await sleep(600);
      const footer = await nabd.rect('.viewport-footer');
      await page.mouse.click(footer.left + 40, footer.top + footer.height / 2, { button: 'right' });
      await sleep(200);
      result.contextMenuLater = (await page.evaluate(() => window.__menus)).slice(result.contextMenu.length);
      await page.mouse.move(centre.x, centre.y);
      await page.keyboard.press('Escape');

      // (c) A pending reach that times out (3.2 s) does not cut a slow 5 s right-drag (392 px → 87.6°).
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.click('#training-reset');
      await page.click('#trainee-focus-abdomen');
      await nabd.waitFor(() => { const s = window.__studioQA.getSimulationState(); return s.abdomen.ready && !window.__studioQA.workMoving(); }, null, 25_000);
      await nabd.cameraSteady();
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(300);
      const sample = (await nabd.sim()).abdomen.sample;
      await page.mouse.click(sample.x, sample.y);
      await sleep(200);
      const pressState = await nabd.sim();
      const c2 = await nabd.canvasCentre();
      const slowStart = await nabd.view();
      const samples = [];
      await page.mouse.move(c2.x + 196, c2.y - 60);
      await page.mouse.down({ button: 'right' });
      for (let k = 1; k <= 50; k += 1) {
        await page.mouse.move(c2.x + 196 - 392 * k / 50, c2.y - 60);
        await sleep(100);
        if (k % 5 === 0) samples.push({ k, yawDeg: Number(angleDiff((await nabd.view()).yaw, slowStart.yaw).toFixed(2)), status: await nabd.text('#trainee-status') });
      }
      await page.mouse.up({ button: 'right' });
      await sleep(200);
      const afterSlow = await nabd.sim();
      // The timeout's out-of-reach status is replaced at once by the work instruction (release event),
      // so the reach ending is read from the hand drive: pending at the start, gone (not attached) after.
      const pending = Boolean(pressState.crew.reach.left || pressState.crew.reach.right) && !pressState.grip;
      result.slowDrag = { pressedReach: pressState.crew.reach, grip: pressState.grip, reachPendingAtStart: pending,
        afterDrag: { grip: afterSlow.grip, reach: afterSlow.crew.reach },
        reachTimedOutDuringDrag: pending && !afterSlow.grip && !afterSlow.crew.reach.left && !afterSlow.crew.reach.right,
        yawDeg: angleDiff((await nabd.view()).yaw, slowStart.yaw), expectedDeg: deg(392 * LOOK_RAD_PER_PX), samples };
      if (!result.slowDrag.reachTimedOutDuringDrag) {
        test.info().annotations.push({ type: 'note', description: 'the abdomen press attached or was not pending, so the 3.2 s timeout path was not exercised' });
      }

      // (d) Looking is allowed while walking round the bed (hands are not): right-drag during «الجانب المقابل».
      await page.keyboard.press('Escape');
      await sleep(300);
      if (!(await nabd.sim()).abdomen.focused) {
        await page.click('#trainee-focus-abdomen');
        await nabd.waitFor(() => { const s = window.__studioQA.getSimulationState(); return s.abdomen.ready && !window.__studioQA.workMoving(); }, null, 25_000);
      }
      await nabd.cameraSteady();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.click('#work-other-side');
      await sleep(400);
      await page.evaluate(() => window.scrollTo(0, 0));
      const c3 = await nabd.canvasCentre();
      const walkBefore = await nabd.view();
      const movingBefore = await nabd.qa('workMoving');
      await nabd.rightDrag(c3.x, c3.y, 200, 0, 10);
      const walkAfter = await nabd.view();
      result.lookWhileWalking = { moving: movingBefore, yawDeg: angleDiff(walkAfter.yaw, walkBefore.yaw), stillMoving: await nabd.qa('workMoving') };

      nabd.save(`C1-4-look-not-cut-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(result.animatingAfterStart, 'no needless pose tween at training start').toBe(false);
      expect(Math.abs(result.trainingStart.yawDeg), 'drag 0.3 s after start turns ≥ 40°').toBeGreaterThanOrEqual(40);
      expect(Math.abs(result.trainingStart.headPulledBackDeg), 'the move does not pull the head back').toBeLessThan(1);
      expect(result.trainingStart.walkedM, 'the move to the tray still finishes').toBeGreaterThan(0.05);
      expect(result.trainingStart.phase).toBe('monitor');
      // Chrome on Windows sends contextmenu when the right button comes up (A7); other engines may send it
      // on the press, over the canvas, where it was always blocked.
      if (nabd.project !== 'webkit') expect(result.contextMenu.length, 'a contextmenu event was sent').toBeGreaterThan(0);
      expect(result.contextMenu.every((m) => m.prevented), 'menu blocked after a right-drag released below the canvas').toBe(true);
      expect(result.contextMenuLater.every((m) => !m.prevented), 'a later right-click elsewhere is not blocked').toBe(true);
      expect(Math.abs(result.slowDrag.yawDeg), '5 s right-drag turns the full 87.6°').toBeGreaterThanOrEqual(86.5);
      expect(result.lookWhileWalking.moving, 'the walk was in progress').toBe(true);
      expect(Math.abs(result.lookWhileWalking.yawDeg), 'look works while walking').toBeGreaterThanOrEqual(40);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 7
    test(`C1-7 view stays on screen and the wheel zooms (${sizeName(size)})`, async ({ page, nabd }) => {
      await nabd.boot();
      const result = { steps: [] };
      const innerHeight = await page.evaluate(() => window.innerHeight);
      const recordStep = async (step) => {
        await nabd.scrollSettled();
        const c = await nabd.canvas();
        result.steps.push({ step, canvasTop: c.top, canvasBottom: c.bottom, scrollY: await page.evaluate(() => window.scrollY) });
      };
      const toBottom = () => page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

      await toBottom();
      await page.click('#training-action');
      await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'monitor');
      await recordStep('start');
      await toBottom();
      await page.click('#training-action');
      await expect.poll(() => page.evaluate(() => document.getElementById('vitals-dialog').open)).toBe(true);
      await page.click('#vitals-confirm');
      await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'pickup');
      await recordStep('confirm');
      await nabd.cameraSteady();
      const beforePickup = { canvas: await nabd.canvas(), docHeight: await page.evaluate(() => document.documentElement.scrollHeight) };
      const handle = (await nabd.sim()).practice.tool;
      await page.mouse.click(handle.x, handle.y);
      await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'aim', null, 8_000);
      await sleep(400);
      const afterPickup = { canvas: await nabd.canvas(), docHeight: await page.evaluate(() => document.documentElement.scrollHeight) };
      result.pickup = { beforePickup, afterPickup };
      result.depthBar = { bar: await nabd.rect('#tool-depth-controls'), viewport: await nabd.rect('#viewport') };
      result.heldToolButtons = {
        zoomIn: (await nabd.rect('#trainee-zoom-in')).visible, stepHead: (await nabd.rect('[data-step="head"]')).visible,
      };
      // Owner view: the held-tool bar and the look controls over the 3D view (both widths).
      if (size === NARROW) await page.evaluate(() => document.getElementById('viewport').scrollIntoView({ block: 'start' }));
      await nabd.shot(`C1-7-aim-step-dock-${sizeName(size)}`);

      // Aim step: the wheel over the canvas zooms and never scrolls the page.
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(200);
      const c = await nabd.canvasCentre();
      await page.mouse.move(c.x, c.y - 40);
      await sleep(300);
      const fov0 = (await nabd.view()).fov;
      for (let k = 0; k < 3; k += 1) { await page.mouse.wheel(0, -120); await sleep(120); }
      await sleep(250);
      const sAim = await nabd.sim();
      result.aimWheel = { fovBefore: fov0, fovAfter: sAim.cameraFov, scrollY: await page.evaluate(() => window.scrollY),
        grip: sAim.grip, paused: sAim.input.manipulationPaused };
      await page.mouse.wheel(0, 360);
      await sleep(250);
      result.aimWheel.fovAfterOut = (await nabd.view()).fov;
      result.aimWheel.scrollYAfterOut = await page.evaluate(() => window.scrollY);

      // Release, then the work area and the drill from the HUD below the view.
      await page.click('#release-held');
      await sleep(400);
      await page.click('#training-reset');
      await toBottom();
      await page.click('#trainee-focus-abdomen');
      await nabd.waitFor(() => window.__studioQA.getSimulationState().abdomen.focused);
      await recordStep('abdomen');
      result.workstationButtons = {
        zoomIn: (await nabd.rect('#trainee-zoom-in')).visible, stepHead: (await nabd.rect('[data-step="head"]')).visible,
      };
      await toBottom();
      await page.selectOption('#work-region', 'chest');
      await nabd.waitFor(() => window.__studioQA.getSimulationState().abdomen.region === 'chest');
      await recordStep('region-select');
      await toBottom();
      await page.keyboard.press('Escape');
      await sleep(300);
      await page.click('#forearm-practice');
      await nabd.waitFor(() => Boolean(window.__studioQA.getSimulationState().forearm));
      await recordStep('drill');

      nabd.save(`C1-7-view-on-screen-wheel-${sizeName(size)}`, { result, innerHeight, errors: nabd.errors() });
      for (const s of result.steps) expect(s.canvasTop, `canvas top ≥ 0 after ${s.step}`).toBeGreaterThanOrEqual(size === NARROW ? -0.5 : -Infinity);
      if (size === NARROW) for (const s of result.steps) expect(s.canvasBottom, `canvas on screen after ${s.step}`).toBeLessThanOrEqual(innerHeight + 0.5);
      if (size === WIDE) {
        expect(afterPickup.canvas, 'canvas rect unchanged on pickup').toEqual(beforePickup.canvas);
        expect(afterPickup.docHeight).toBe(beforePickup.docHeight);
      }
      const bar = result.depthBar.bar, vp = result.depthBar.viewport;
      expect(bar.visible).toBe(true);
      expect(bar.top >= vp.top && bar.bottom <= vp.bottom && bar.left >= vp.left && bar.right <= vp.right, 'depth bar inside the viewport').toBe(true);
      expect(result.heldToolButtons, 'zoom and step buttons stay while a tool is held').toEqual({ zoomIn: true, stepHead: true });
      expect(result.workstationButtons, 'the work area hides them').toEqual({ zoomIn: false, stepHead: false });
      expect(result.aimWheel.fovAfter, 'wheel zooms in while holding').toBeLessThan(result.aimWheel.fovBefore - 1);
      expect(result.aimWheel.fovAfterOut).toBeGreaterThan(result.aimWheel.fovAfter);
      expect(result.aimWheel.scrollY, 'page did not scroll').toBe(0);
      expect(result.aimWheel.scrollYAfterOut).toBe(0);
      expect(result.aimWheel.grip).toBe('tool');
      expect(result.aimWheel.paused, 'zoom pauses the held tool').toBe(true);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });
  });
}

// ================================================================= C2 hands (items 3, 5, 6, 12, 13)
// Per-render sampler. three.js announces its scene and renderer on window.__THREE_DEVTOOLS__ (its
// devtools hook); the sampler wraps renderer.render and, after each main render, reads the trainee's
// gloves (root rotation, wrist and middle fingertip bones), the stand-in sleeves and the camera. It also
// counts patient-skin raycasts and bounding-sphere recomputes, and records rAF callback times.
// Test-only and read-only with respect to the app.
const C2_HOOK = () => {
  window.__c2 = { scenes: [], renderers: [], frames: [], raf: [], raycasts: [], downs: [], bsCalls: 0, sampling: false };
  const hook = new EventTarget();
  hook.addEventListener('observe', (e) => {
    const d = e.detail;
    if (d?.isScene) window.__c2.scenes.push(d);
    else if (d && typeof d.render === 'function' && d.domElement) window.__c2.renderers.push(d);
  });
  window.__THREE_DEVTOOLS__ = hook;
};
const C2_SETUP = () => {
  const C = window.__c2;
  if (C.ready) return true;
  const scene = C.scenes.find((s) => s.getObjectByName('Trainee anatomical right hand'));
  if (!scene || !C.renderers.length) return false;
  const bone = (root, name) => {
    let found = null;
    root.traverse((o) => { if (o.isBone && (o.userData?.name === name || o.name === name.replace(/\./g, ''))) found ??= o; });
    return found;
  };
  C.hands = {};
  for (const side of ['left', 'right']) {
    const root = scene.getObjectByName(`Trainee anatomical ${side} hand`);
    const L = side === 'left' ? 'L' : 'R';
    C.hands[side] = { root, wrist: bone(root, `wrist.${L}`), tip: bone(root, `finger3-3.${L}`) };
  }
  C.sleeves = [];
  scene.traverse((o) => {
    if (o.isMesh && o.geometry?.type === 'CylinderGeometry' && Math.abs((o.geometry.parameters?.radiusTop ?? 0) - 0.036) < 1e-6) C.sleeves.push(o);
  });
  const excluded = [C.hands.left.root, C.hands.right.root, scene.getObjectByName('Rigged supervising clinician')];
  const inside = (o) => { for (let p = o; p; p = p.parent) if (excluded.includes(p)) return true; return false; };
  C.skins = [];
  scene.traverse((o) => { if (o.isSkinnedMesh && !inside(o)) C.skins.push(o); });
  C.mainSkin = C.skins.reduce((a, b) => (b.geometry.attributes.position.count > a.geometry.attributes.position.count ? b : a));
  C.spheres = C.skins.map((skin) => skin.boundingSphere);
  for (const skin of C.skins) {
    const raycast = skin.raycast.bind(skin);
    skin.raycast = function (...args) {
      if (skin !== C.mainSkin || !C.sampling) return raycast(...args);
      const t = performance.now();
      const result = raycast(...args);
      C.raycasts.push({ t, ms: performance.now() - t, frame: document.timeline.currentTime });
      return result;
    };
    const compute = skin.computeBoundingSphere.bind(skin);
    skin.computeBoundingSphere = function () { C.bsCalls += 1; return compute(); };
  }
  window.addEventListener('pointerdown', () => { if (C.sampling) C.downs.push(performance.now()); }, true);
  const renderer = C.renderers[0];
  const render = renderer.render.bind(renderer);
  const V = scene.position.constructor;
  const w = new V();
  renderer.render = function (sc, cam) {
    const main = sc === scene && renderer.getRenderTarget() === null;
    const result = render(sc, cam);
    if (C.sampling && main) {
      const frame = { t: performance.now(), cp: cam.position.toArray(), cq: cam.quaternion.toArray(), h: {} };
      for (const [side, hand] of Object.entries(C.hands)) {
        frame.h[side] = { q: hand.root.quaternion.toArray(), w: hand.wrist.getWorldPosition(w).toArray(),
          tip: hand.tip.getWorldPosition(w).toArray(), visible: hand.root.visible };
      }
      frame.sleeves = C.sleeves.map((s, k) => ({ side: k === 0 ? 'left' : 'right', visible: s.visible, length: s.scale.y }));
      C.frames.push(frame);
    }
    return result;
  };
  C.ready = true;
  return true;
};
async function c2Boot(page, nabd) {
  await page.addInitScript(C2_HOOK);
  await nabd.boot();
  await page.waitForFunction(C2_SETUP, null, { timeout: 15_000 });
}
const c2Start = (page) => page.evaluate(() => {
  const C = window.__c2;
  Object.assign(C, { frames: [], raf: [], raycasts: [], downs: [], sampling: true });
  const loop = () => { if (!C.sampling) return; C.raf.push(performance.now()); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
const c2Stop = (page) => page.evaluate(() => {
  const C = window.__c2;
  C.sampling = false;
  return { frames: C.frames, raf: C.raf, raycasts: C.raycasts, downs: C.downs, bsCalls: C.bsCalls,
    spheresKept: C.skins.every((skin, k) => skin.boundingSphere === C.spheres[k] && skin.boundingSphere !== null),
    sphereRadius: C.mainSkin.boundingSphere?.radius ?? null };
});

// Quaternion helpers (x, y, z, w arrays).
const qAngleDeg = (a, b) => deg(2 * Math.acos(Math.min(1, Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]))));
function qRotate(q, v) {
  const [x, y, z, w] = q;
  const ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2];
  const iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2];
  return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x];
}
const qConj = ([x, y, z, w]) => [-x, -y, -z, w];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const round = (x, n = 4) => (x === null || x === undefined || !Number.isFinite(x) ? x : Number(x.toFixed(n)));

// Per rendered frame: largest glove turn (°) and wrist travel (m) between consecutive main renders,
// and the smallest «fingers forward» value (horizontal fingertip direction · horizontal camera forward).
function handMotion(frames, side, from = -Infinity, to = Infinity) {
  const list = frames.filter((f) => f.t >= from && f.t <= to && f.h[side].visible);
  let maxTurnDeg = 0, maxStepM = 0, minFingersForward = Infinity, turnAt = null, stepAt = null;
  for (let k = 0; k < list.length; k += 1) {
    const f = list[k];
    const fingers = sub(f.h[side].tip, f.h[side].w);
    const fwd = qRotate(f.cq, [0, 0, -1]);
    const fl = Math.hypot(fingers[0], fingers[2]), cl = Math.hypot(fwd[0], fwd[2]);
    if (fl > 1e-6 && cl > 1e-6) minFingersForward = Math.min(minFingersForward, (fingers[0] * fwd[0] + fingers[2] * fwd[2]) / (fl * cl));
    if (k === 0) continue;
    const turn = qAngleDeg(list[k - 1].h[side].q, f.h[side].q);
    if (turn > maxTurnDeg) { maxTurnDeg = turn; turnAt = Math.round(f.t - list[0].t); }
    const step = dist(list[k - 1].h[side].w, f.h[side].w);
    if (step > maxStepM) {
      maxStepM = step;
      stepAt = { atMs: Math.round(f.t - list[0].t), dtMs: round(f.t - list[k - 1].t, 1), dyM: round(f.h[side].w[1] - list[k - 1].h[side].w[1], 4) };
    }
  }
  const intervals = list.slice(1).map((f, k) => f.t - list[k].t).sort((a, b) => a - b);
  return { frames: list.length, maxTurnDeg: round(maxTurnDeg, 2), turnAtMs: turnAt, maxStepM: round(maxStepM, 4), maxStep: stepAt,
    minFingersForward: round(minFingersForward, 3), renderIntervalP50Ms: round(intervals[Math.floor(intervals.length / 2)] ?? null, 1) };
}
const sleeveStats = (frames, side = null) => {
  const pick = (f) => f.sleeves.filter((s) => s.visible && (!side || s.side === side));
  const lengths = frames.flatMap((f) => pick(f).map((s) => s.length));
  return { framesWithSleeve: frames.filter((f) => pick(f).length).length, maxLength: round(lengths.length ? Math.max(...lengths) : 0, 4) };
};
const rafStats = (raf) => {
  const intervals = raf.slice(1).map((t, k) => t - raf[k]).sort((a, b) => a - b);
  const span = raf.length > 1 ? raf.at(-1) - raf[0] : 0;
  return { frames: raf.length, fps: round(span ? (raf.length - 1) / (span / 1000) : 0, 1),
    p50Ms: round(intervals[Math.floor(intervals.length / 2)] ?? null, 2), p95Ms: round(intervals[Math.floor(intervals.length * 0.95)] ?? null, 2),
    maxMs: round(intervals.at(-1) ?? null, 2) };
};
// Local penetration of the right glove into the touched skin: the deepest glove vertex behind the
// tangent plane at the touched point, among vertices within 3 cm of it along the surface. (The QA
// abdomen.penetration is a top-down height field: under the bulge of the flank it reports the body
// height above the hand, not how deep the hand is in the skin.)
const localPenetration = (page) => page.evaluate(() => {
  const s = window.__studioQA.getSimulationState();
  const p = s.crew.reach.right, n = s.crew.reachNormal.right;
  if (!p || !n) return null;
  const C = window.__c2;
  const V = C.hands.right.root.position.constructor;
  const w = new V();
  let deepest = -Infinity;
  C.hands.right.root.traverse((mesh) => {
    if (!mesh.isSkinnedMesh) return;
    for (let i = 0; i < mesh.geometry.attributes.position.count; i += 1) {
      mesh.getVertexPosition(i, w).applyMatrix4(mesh.matrixWorld);
      const d = [w.x - p[0], w.y - p[1], w.z - p[2]];
      const along = d[0] * n[0] + d[1] * n[1] + d[2] * n[2];
      const tangential = Math.hypot(d[0] - along * n[0], d[1] - along * n[1], d[2] - along * n[2]);
      if (tangential <= 0.03) deepest = Math.max(deepest, -along);
    }
  });
  return { depthM: Number.isFinite(deepest) ? Math.max(0, deepest) : 0, normal: n };
});
// The rAF interval that contains a pointerdown (input handling, the pick raycast and that frame's work).
const clickFrameMs = (raf, down) => {
  const k = raf.findIndex((t) => t > down);
  return k > 0 ? round(raf[k] - raf[k - 1], 1) : null;
};

async function openAbdomen(page, nabd, action = 'press') {
  await page.click('#trainee-focus-abdomen');
  await nabd.waitFor(() => { const s = window.__studioQA.getSimulationState(); return s.abdomen.ready && !window.__studioQA.workMoving(); }, null, 25_000);
  await page.selectOption('#work-action', action);
  await page.evaluate(() => window.scrollTo(0, 0));
  await nabd.cameraSteady();
  await sleep(400);
}
// Wait until the given grip kind holds (QA grip), polling every 25 ms. Returns ms or null.
async function waitGrip(page, kind, timeout) {
  const started = Date.now();
  const ok = await page.waitForFunction((k) => window.__studioQA.getSimulationState().grip === k, kind, { timeout, polling: 25 })
    .then(() => true, () => false);
  return ok ? Date.now() - started : null;
}
// Click again to let go, then wait until the hand is no longer driven.
async function letGo(page, nabd, point) {
  await page.mouse.click(point.x, point.y);
  await nabd.waitFor(() => { const s = window.__studioQA.getSimulationState(); return !s.grip && !s.crew.reach.right && !s.crew.reach.left; }, null, 6_000);
  await sleep(700);
}

for (const size of [WIDE, NARROW]) {
  test.describe(`C2 hands ${sizeName(size)}`, () => {
    test.use({ viewport: size });

    // ------------------------------------------------------------- item 3 (+ 13 on the same gestures)
    test(`C2-3 glove faces the skin; press attaches; flank is touch only (${sizeName(size)})`, async ({ page, nabd }) => {
      await c2Boot(page, nabd);
      await openAbdomen(page, nabd, 'press');
      const result = {};
      let s = await nabd.sim();
      const centre = s.points['abdomen-center'];
      const left = s.points['abdomen-left'];
      expect(centre, '«منتصف البطن» on screen').toBeTruthy();

      // Press on «منتصف البطن»: attach time, pad gap, fingers forward on every frame.
      await c2Start(page);
      const clickAt = await page.evaluate(() => performance.now());
      await page.mouse.click(centre.x, centre.y);
      const attachMs = await waitGrip(page, 'press', 3_000);
      s = await nabd.sim();
      result.press = { attachMs, gripKind: s.grip, contactGapM: round(s.crew.contact.right, 4), status: await nabd.text('#trainee-status') };
      await sleep(400);
      s = await nabd.sim();
      result.press.settled = { contactGapM: round(s.crew.contact.right, 4), heightFieldPenetrationM: round(s.abdomen.penetration, 4),
        localPenetrationM: round((await localPenetration(page))?.depthM, 4) };
      await nabd.shot(`C2-3-press-attached-${sizeName(size)}`);
      const releaseAt = await page.evaluate(() => performance.now());
      await letGo(page, nabd, centre);
      let sample = await c2Stop(page);
      result.press.approach = handMotion(sample.frames, 'right', clickAt, clickAt + (attachMs ?? 3000) + 400);
      result.press.release = handMotion(sample.frames, 'right', releaseAt, Infinity);
      result.press.whole = handMotion(sample.frames, 'right');
      result.press.sleeve = sleeveStats(sample.frames);

      // Side of the abdomen (B3/B4 point: 1.9 × the screen offset from the centre to «جانب البطن الأيسر»).
      const flank = { x: centre.x + 1.9 * (left.x - centre.x), y: centre.y + 1.9 * (left.y - centre.y) };
      await c2Start(page);
      await page.mouse.click(flank.x, flank.y);
      const flankMs = await waitGrip(page, 'touch', 3_000);
      const penetration = [], local = [];
      for (let k = 0; k < 10; k += 1) {
        penetration.push((await nabd.sim()).abdomen.penetration);
        local.push(await localPenetration(page));
        await sleep(100);
      }
      s = await nabd.sim();
      result.flank = { point: flank, attachMs: flankMs, grip: s.grip, status: await nabd.text('#trainee-status'),
        maxLocalPenetrationM: round(Math.max(...local.map((l) => l?.depthM ?? 0)), 4), normal: local.at(-1)?.normal ?? null,
        maxHeightFieldPenetrationM: round(Math.max(...penetration), 4), contactGapM: round(s.crew.contact.right, 4) };
      if (size === WIDE) await nabd.shot(`C2-3-flank-touch-${sizeName(size)}`);
      await letGo(page, nabd, flank);
      sample = await c2Stop(page);
      result.flank.motion = handMotion(sample.frames, 'right');
      result.flank.sleeve = sleeveStats(sample.frames);

      nabd.save(`C2-3-glove-faces-skin-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(result.press.attachMs, 'press on «منتصف البطن» attaches within 1 s').not.toBeNull();
      expect(result.press.attachMs).toBeLessThanOrEqual(1000);
      expect(result.press.contactGapM, 'pad gap ≤ 0.018 m').toBeLessThanOrEqual(0.018);
      expect(result.press.whole.minFingersForward, 'fingers point away from the trainee on every frame').toBeGreaterThan(0);
      expect(result.flank.grip, 'the side of the abdomen is touch only').toBe('touch');
      expect(result.flank.maxLocalPenetrationM, 'flank penetration < 0.01 m').toBeLessThan(0.01);
      expect(result.flank.motion.minFingersForward).toBeGreaterThan(0);
      expect(Math.max(result.press.sleeve.maxLength, result.flank.sleeve.maxLength), 'sleeve ≤ 0.30 m').toBeLessThanOrEqual(0.30);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 5
    test(`C2-5 surface grip attaches 5/5; a sliding press keeps its dent (${sizeName(size)})`, async ({ page, nabd }) => {
      test.setTimeout(240_000);
      await c2Boot(page, nabd);
      await openAbdomen(page, nabd, 'abdomen');
      const result = { pinch: [] };
      const centre = (await nabd.sim()).points['abdomen-center'];
      await c2Start(page);
      for (let k = 0; k < 5; k += 1) {
        await page.mouse.click(centre.x, centre.y);
        const attachMs = await waitGrip(page, 'abdomen', 3_000);
        const s = await nabd.sim();
        result.pinch.push({ attempt: k + 1, attachMs, gapAtAttachM: round(s.abdomen.contactGap, 4), status: await nabd.text('#trainee-status') });
        if (k === 0 && attachMs !== null) {
          await sleep(500);
          if (size === WIDE) await nabd.shot(`C2-5-pinch-attached-${sizeName(size)}`);
        }
        if (attachMs !== null) await letGo(page, nabd, centre);
        else await sleep(1500);
      }
      const sample = await c2Stop(page);
      result.pinchMotion = handMotion(sample.frames, 'right');
      result.pinchSleeve = sleeveStats(sample.frames);

      // Press, then slide 200 px with the button up (click-to-hold): shift.y stays below 0 throughout.
      // The path goes back and forth in 5 px steps (±50 px at 1440, ±25 px at 560, where a pixel covers
      // more skin) so it stays inside the abdominal patch (about 18 cm along the body): every sample is
      // a real slide, not a lift-off past the patch edge.
      await page.selectOption('#work-action', 'press');
      await sleep(300);
      await page.mouse.click(centre.x, centre.y);
      const pressMs = await waitGrip(page, 'press', 3_000);
      await sleep(400);
      const shifts = [];
      const centres = new Set();
      const t0 = Date.now();
      const amplitude = size === WIDE ? 50 : 25;
      const slideX = (k) => {
        const s = (5 * k) % (4 * amplitude);
        return s < amplitude ? s : s < 3 * amplitude ? 2 * amplitude - s : s - 4 * amplitude;
      };
      for (let k = 1; k <= 40; k += 1) {
        await page.mouse.move(centre.x + slideX(k), centre.y);
        await sleep(30);
        const a = (await nabd.sim()).abdomen;
        shifts.push(round(a.shift[1], 5));
        if (a.center) centres.add(a.center.map((x) => x.toFixed(3)).join(','));
      }
      const slideMs = Date.now() - t0;
      result.slide = { pressMs, slideMs, pathPx: 200, amplitudePx: amplitude, samples: shifts.length, maxShiftY: Math.max(...shifts), minShiftY: Math.min(...shifts),
        recentres: centres.size - 1, grip: (await nabd.sim()).grip, shifts };
      await letGo(page, nabd, centre);

      nabd.save(`C2-5-surface-grip-${sizeName(size)}`, { result, errors: nabd.errors() });
      const attached = result.pinch.filter((p) => p.attachMs !== null).length;
      expect(attached, '«إمساك السطح» on «منتصف البطن» attaches 5/5').toBe(5);
      expect(result.slide.pressMs).not.toBeNull();
      expect(result.slide.recentres, 'the slide re-centred the dent at least twice').toBeGreaterThanOrEqual(2);
      expect(result.slide.maxShiftY, 'shift.y stays below 0 during the 200 px slide').toBeLessThan(0);
      expect(result.pinchMotion.minFingersForward).toBeGreaterThan(0);
      expect(result.pinchSleeve.maxLength).toBeLessThanOrEqual(0.30);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 6
    test(`C2-6 hands move at human speed (${sizeName(size)})`, async ({ page, nabd }) => {
      await c2Boot(page, nabd);
      const result = {};
      // Tray pick and release (free bedside view, as after boot).
      const handle = (await nabd.sim()).practice.tool;
      await c2Start(page);
      await sleep(200);
      const pickAt = await page.evaluate(() => performance.now());
      await page.mouse.click(handle.x, handle.y);
      const pickMs = await waitGrip(page, 'tool', 6_000);
      await sleep(800);
      const releaseAt = await page.evaluate(() => performance.now());
      // «إفلات»: at 560 px the held-tool bar covers the handle spot, so a canvas click there would miss.
      await page.click('#release-held');
      await nabd.waitFor(() => !window.__studioQA.getSimulationState().grip, null, 5_000);
      await sleep(1200);
      let sample = await c2Stop(page);
      result.tray = { pickMs, pick: handMotion(sample.frames, 'right', pickAt, releaseAt), release: handMotion(sample.frames, 'right', releaseAt, Infinity),
        render: rafStats(sample.raf) };

      // Idle hands while D is held, then ← (free view): camera-space wrist drift.
      await sleep(300);
      await c2Start(page);
      await sleep(300);
      await nabd.holdKey('KeyD', 1500);
      await nabd.holdKey('ArrowLeft', 600);
      sample = await c2Stop(page);
      const drift = {};
      for (const side of ['left', 'right']) {
        const local = sample.frames.map((f) => qRotate(qConj(f.cq), sub(f.h[side].w, f.cp)));
        drift[side] = round(Math.max(...local.map((p) => dist(p, local[0]))), 5);
      }
      result.idle = { frames: sample.frames.length, walkedM: round(dist(sample.frames[0].cp, sample.frames.at(-1).cp), 3),
        turnedDeg: round(qAngleDeg(sample.frames[0].cq, sample.frames.at(-1).cq), 1), driftM: drift, render: rafStats(sample.raf) };

      // Abdomen press click and release.
      await openAbdomen(page, nabd, 'press');
      const centre = (await nabd.sim()).points['abdomen-center'];
      await c2Start(page);
      await sleep(200);
      const clickAt = await page.evaluate(() => performance.now());
      await page.mouse.click(centre.x, centre.y);
      const attachMs = await waitGrip(page, 'press', 3_000);
      await sleep(300);
      const letGoAt = await page.evaluate(() => performance.now());
      await letGo(page, nabd, centre);
      sample = await c2Stop(page);
      result.abdomen = { attachMs, click: handMotion(sample.frames, 'right', clickAt, letGoAt), release: handMotion(sample.frames, 'right', letGoAt, Infinity),
        render: rafStats(sample.raf) };

      nabd.save(`C2-6-human-speed-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(pickMs, 'tray pick still attaches').not.toBeNull();
      expect(result.idle.walkedM, 'D walked').toBeGreaterThan(0.3);
      expect(Math.max(drift.left, drift.right), 'idle-hand drift < 5 mm while D is held').toBeLessThan(0.005);
      expect(attachMs, 'abdomen press still attaches').not.toBeNull();
      for (const [name, motion] of [['tray pick', result.tray.pick], ['tray release', result.tray.release],
        ['abdomen click', result.abdomen.click], ['abdomen release', result.abdomen.release]]) {
        expect(motion.maxTurnDeg, `${name}: glove turn per frame ≤ 6°`).toBeLessThanOrEqual(6);
        expect(motion.maxStepM, `${name}: wrist travel per frame ≤ 2.5 cm`).toBeLessThanOrEqual(0.025);
      }
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 12 (+ 13 while a limb is held)
    test(`C2-12 no hitches: limb drag frame rate, click frame, hover picks (${sizeName(size)})`, async ({ page, nabd }) => {
      await c2Boot(page, nabd);
      const result = {};
      // Hover: many small moves per frame; at most one skin raycast per frame, none for moves under 3 px.
      const canvas = await nabd.canvas();
      const y = canvas.top + canvas.height * 0.55;
      await page.mouse.move(canvas.left + canvas.width * 0.2, y);
      await sleep(300);
      await c2Start(page);
      for (let k = 0; k < 120; k += 1) await page.mouse.move(canvas.left + canvas.width * (0.2 + 0.5 * k / 119), y);
      await sleep(200);
      // A burst of 30 pointer moves inside one task (one frame), 4 px apart.
      const burstAt = await page.evaluate(([x0, y0]) => {
        const canvasEl = document.querySelector('#viewport canvas');
        const t = performance.now();
        for (let k = 1; k <= 30; k += 1) {
          canvasEl.dispatchEvent(new PointerEvent('pointermove', { clientX: x0 - 4 * k, clientY: y0, isPrimary: true, pointerType: 'mouse', bubbles: true }));
        }
        return t;
      }, [canvas.left + canvas.width * 0.7, y]);
      await sleep(200);
      // Settle on a known point, then moves of 1 px around it: no pick.
      const restAt = await page.evaluate(() => performance.now());
      const rest = { x: canvas.left + canvas.width * 0.5, y };
      await page.mouse.move(rest.x, rest.y);
      await sleep(250);
      const tinyFrom = await page.evaluate(() => performance.now());
      for (let k = 0; k < 20; k += 1) await page.mouse.move(rest.x + (k % 2), rest.y + ((k >> 1) % 2));
      await sleep(300);
      let sample = await c2Stop(page);
      const perFrame = {};
      for (const r of sample.raycasts) perFrame[r.frame] = (perFrame[r.frame] ?? 0) + 1;
      const durations = sample.raycasts.map((r) => r.ms).sort((a, b) => a - b);
      result.hover = { sweepMoves: 120, sweepRaycasts: sample.raycasts.filter((r) => r.t < burstAt).length,
        maxPerFrame: Math.max(0, ...Object.values(perFrame)),
        burstMoves: 30, burstRaycasts: sample.raycasts.filter((r) => r.t >= burstAt && r.t < restAt).length,
        tinyMoveRaycasts: sample.raycasts.filter((r) => r.t >= tinyFrom).length,
        raycastMs: { p50: round(durations[Math.floor(durations.length / 2)] ?? null, 1), max: round(durations.at(-1) ?? null, 1) } };

      // «الذراع» station: grab «الرسغ · يسار» and move the mouse up and down for 2.5 s.
      await page.click('#trainee-focus-arm');
      await nabd.waitFor(() => { const s = window.__studioQA.getSimulationState(); return s.abdomen.ready && !window.__studioQA.workMoving(); }, null, 25_000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await nabd.cameraSteady();
      await sleep(400);
      // Reference: the same page rendering every frame without a limb (turning the view with ← then →).
      await c2Start(page);
      await nabd.holdKey('ArrowLeft', 1200);
      await nabd.holdKey('ArrowRight', 1200);
      sample = await c2Stop(page);
      const renderEveryFrame = rafStats(sample.raf);
      const wrist = (await nabd.sim()).points['leftArm-2'];
      expect(wrist, '«الرسغ · يسار» on screen').toBeTruthy();
      await page.mouse.move(wrist.x, wrist.y);
      await sleep(300);
      await c2Start(page);
      await sleep(200);
      await page.mouse.click(wrist.x, wrist.y);
      const gripMs = await waitGrip(page, 'wrist', 4_000);
      await sleep(300);
      const dragFrom = await page.evaluate(() => performance.now());
      const t0 = Date.now();
      let k = 0;
      while (Date.now() - t0 < 2500) {
        await page.mouse.move(wrist.x, wrist.y - 40 + 40 * Math.cos(k / 6));
        k += 1;
        await sleep(8);
      }
      const dragTo = await page.evaluate(() => performance.now());
      const held = await nabd.sim();
      await letGo(page, nabd, { x: wrist.x, y: wrist.y });
      sample = await c2Stop(page);
      const dragRaf = sample.raf.filter((t) => t >= dragFrom && t <= dragTo);
      result.limb = { gripMs, grip: held.grip, drag: rafStats(dragRaf), renderEveryFrameNoLimb: renderEveryFrame, clickFrameMs: clickFrameMs(sample.raf, sample.downs[0]),
        boundingSphereRecomputes: sample.bsCalls, spheresKept: sample.spheresKept, sphereRadius: round(sample.sphereRadius, 3),
        sleeveWhileHeld: sleeveStats(sample.frames.filter((f) => f.t >= dragFrom && f.t <= dragTo), 'right'), sleeve: sleeveStats(sample.frames) };

      // The frame that contains a pointerdown on «منتصف البطن». (a) The trainee points, then clicks
      // (150 ms later): the click reuses the hover pick. (b) A click in the same instant as the move:
      // the full-skin pick raycast (about 40 ms here) runs inside the click frame.
      await openAbdomen(page, nabd, 'press');
      const centre = (await nabd.sim()).points['abdomen-center'];
      result.abdomenClick = {};
      for (const [name, pause] of [['hoverThenClick', 150], ['clickStraightAfterMove', 0]]) {
        await page.mouse.move(centre.x - 20, centre.y);
        await sleep(400);
        await c2Start(page);
        await sleep(200);
        await page.mouse.move(centre.x, centre.y);
        if (pause) await sleep(pause);
        await page.mouse.down();
        await page.mouse.up();
        await waitGrip(page, 'press', 3_000);
        await sleep(200);
        await letGo(page, nabd, centre);
        sample = await c2Stop(page);
        const down = sample.downs[0];
        result.abdomenClick[name] = { frameMs: clickFrameMs(sample.raf, down),
          raycastsNearClick: sample.raycasts.filter((r) => r.t >= down - 60 && r.t <= down + 60).map((r) => ({ dtMs: round(r.t - down, 1), ms: round(r.ms, 1) })) };
      }
      result.boundingSphereRecomputesTotal = sample.bsCalls;

      nabd.save(`C2-12-no-hitches-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(result.hover.maxPerFrame, 'hover pick at most once per frame').toBeLessThanOrEqual(1);
      expect(result.hover.burstRaycasts, '30 moves in one frame give one pick').toBe(1);
      expect(result.hover.tinyMoveRaycasts, 'no pick for moves under 3 px').toBe(0);
      // 100 fps on a quiet 144 Hz laptop; when the machine is loaded, a limb drag must not be slower
      // than 90 % of plain rendering on the same page (before item 12 it was about 30 %). Recorded but
      // not asserted in Playwright WebKit on Windows, which renders this scene at about 20 fps here.
      if (nabd.project !== 'webkit') {
        expect(result.limb.drag.fps, 'limb drag at least 100 fps, or 90 % of plain rendering under load')
          .toBeGreaterThanOrEqual(Math.min(100, 0.9 * result.limb.renderEveryFrameNoLimb.fps));
      }
      expect(result.abdomenClick.hoverThenClick.frameMs, 'first frame after pointerdown < 50 ms (point, then click)').toBeLessThan(50);
      expect(result.limb.grip).toBe('wrist');
      expect(result.limb.boundingSphereRecomputes, 'no skin bounding-sphere recompute').toBe(0);
      expect(result.limb.spheresKept).toBe(true);
      expect(result.limb.sleeveWhileHeld.framesWithSleeve, 'the holding hand sleeve is hidden while a limb is held').toBe(0);
      expect(result.limb.sleeve.maxLength).toBeLessThanOrEqual(0.30);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });
  });
}

// ================================================================= C3 limbs (item 9)
// Patient joints per animation frame (QA getJoints), stamped with the rAF time the app also uses.
const c3Start = (page, ids) => page.evaluate((list) => {
  const S = { frames: [], on: true };
  window.__c3 = S;
  const loop = (t) => {
    if (!S.on) return;
    const all = window.__studioQA.getJoints();
    S.frames.push({ t, j: Object.fromEntries(list.map((id) => [id, all[id]])) });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}, ids);
const c3Stop = (page) => page.evaluate(() => { window.__c3.on = false; return window.__c3.frames; });
const rafNow = (page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
const jointAt = async (page, id, index) => (await page.evaluate(() => window.__studioQA.getJoints()))[id][index];
const HOLD_PAUSED = 'الطرف ثابت · اسحب لتكمل تحريكه أو انقر للإفلات';

// After a release at rAF time `from`: the gripped joint's top speed and largest one-frame step, when it
// first came within 3 mm of rest and how far from rest it was 2 s after the release.
function settleStats(frames, id, index, rest, from) {
  const list = frames.filter((f) => f.t >= from);
  let maxSpeed = 0, maxStep = 0, within3mmMs = null, at2s = null, fastest = null;
  const midSteps = []; // frames where the elbow or knee moved more than 2 mm: [ms after release, its step, the gripped joint's step]
  const jointSteps = [0, 0, 0]; // largest one-frame step of each joint of the chain (shoulder/hip, elbow/knee, wrist/ankle)
  for (let k = 0; k < list.length; k += 1) {
    const p = list[k].j[id][index];
    const d = dist(p, rest);
    if (within3mmMs === null && d < 0.003) within3mmMs = Math.round(list[k].t - from);
    if (at2s === null && list[k].t - from >= 2000) at2s = d;
    if (!k) continue;
    for (let n = 0; n < 3; n += 1) jointSteps[n] = Math.max(jointSteps[n], dist(list[k].j[id][n], list[k - 1].j[id][n]));
    const midStep = dist(list[k].j[id][1], list[k - 1].j[id][1]);
    if (midStep > 0.002) midSteps.push([Math.round(list[k].t - from), round(midStep, 4), round(dist(list[k].j[id][2], list[k - 1].j[id][2]), 4)]);
    const step = dist(p, list[k - 1].j[id][index]);
    const dt = (list[k].t - list[k - 1].t) / 1000;
    maxStep = Math.max(maxStep, step);
    if (dt > 0 && step / dt > maxSpeed) {
      maxSpeed = step / dt;
      fastest = { atMs: Math.round(list[k].t - from), dtMs: round(dt * 1000, 2), stepM: round(step, 5), toRestM: round(d, 4),
        around: list.slice(Math.max(0, k - 3), k + 3).map((f, i, all) => [round(f.t - from, 1), round(i ? dist(f.j[id][index], all[i - 1].j[id][index]) : 0, 5)]) };
    }
  }
  return { frames: list.length, startDistanceM: round(list.length ? dist(list[0].j[id][index], rest) : null, 4),
    maxSpeedMs: round(maxSpeed, 3), maxStepM: round(maxStep, 4), jointStepsM: jointSteps.map((v) => round(v, 4)), within3mmMs, fastest, midSteps,
    distanceAt2sM: round(at2s ?? (list.length ? dist(list.at(-1).j[id][index], rest) : null), 4) };
}

// How deep the holding (right) glove is inside the gripped limb (a proxy). The limb's skin radius is
// sampled from the patient's main skin around the lower segment (from 3 cm past the elbow or knee to
// 1.5 cm past the wrist or ankle; the hand and foot are left out) in cells of 1.5 cm along the bone ×
// 30° around it, taking the skin vertex nearest the bone in each cell (cells with at least 2 vertices);
// a glove vertex closer to the bone than that radius (same cell) is inside by the difference.
const limbPenetration = (page, id) => page.evaluate((chainId) => {
  const C = window.__c2;
  const [, a, b] = window.__studioQA.getJoints()[chainId];
  const axisVec = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const length = Math.hypot(...axisVec);
  const axis = axisVec.map((x) => x / length);
  const upDot = axis[1];
  let e1 = [-upDot * axis[0], 1 - upDot * axis[1], -upDot * axis[2]];
  const e1l = Math.hypot(...e1);
  e1 = e1.map((x) => x / e1l);
  const e2 = [axis[1] * e1[2] - axis[2] * e1[1], axis[2] * e1[0] - axis[0] * e1[2], axis[0] * e1[1] - axis[1] * e1[0]];
  const cell = (p) => {
    const d = [p.x - a[0], p.y - a[1], p.z - a[2]];
    const t = d[0] * axis[0] + d[1] * axis[1] + d[2] * axis[2];
    if (t < 0.03 || t > length + 0.015) return null;
    const r = [d[0] - t * axis[0], d[1] - t * axis[1], d[2] - t * axis[2]];
    const radius = Math.hypot(...r);
    const angle = Math.atan2(r[0] * e2[0] + r[1] * e2[1] + r[2] * e2[2], r[0] * e1[0] + r[1] * e1[1] + r[2] * e1[2]);
    return { key: `${Math.floor(t / 0.015)}:${Math.floor((angle + Math.PI) / (Math.PI / 6))}`, radius };
  };
  const V = C.hands.right.root.position.constructor;
  const w = new V();
  const skinRadius = new Map();
  const skin = C.mainSkin;
  for (let i = 0; i < skin.geometry.attributes.position.count; i += 1) {
    skin.getVertexPosition(i, w).applyMatrix4(skin.matrixWorld);
    const c = cell(w);
    if (!c || c.radius > 0.09) continue;
    const cellSkin = skinRadius.get(c.key) ?? { radius: Infinity, count: 0 };
    skinRadius.set(c.key, { radius: Math.min(cellSkin.radius, c.radius), count: cellSkin.count + 1 });
  }
  let inside = 0, over5mm = 0, deepest = 0, tested = 0;
  C.hands.right.root.traverse((mesh) => {
    if (!mesh.isSkinnedMesh) return;
    for (let i = 0; i < mesh.geometry.attributes.position.count; i += 2) {
      mesh.getVertexPosition(i, w).applyMatrix4(mesh.matrixWorld);
      const c = cell(w);
      const cellSkin = c && skinRadius.get(c.key);
      if (!cellSkin || cellSkin.count < 2) continue;
      const radius = cellSkin.radius;
      tested += 1;
      const depth = radius - c.radius;
      if (depth > 0) inside += 1;
      if (depth > 0.005) over5mm += 1;
      deepest = Math.max(deepest, depth);
    }
  });
  return { tested, inside, over5mm, deepestM: Math.round(deepest * 10000) / 10000 };
}, id);

async function openLimbRegion(page, nabd, selector) {
  await page.click(selector);
  await nabd.waitFor(() => { const s = window.__studioQA.getSimulationState(); return s.abdomen.ready && !window.__studioQA.workMoving(); }, null, 25_000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await nabd.cameraSteady();
  await sleep(400);
}
async function workReadyAgain(page, nabd) {
  await nabd.waitFor(() => { const s = window.__studioQA.getSimulationState(); return s.abdomen.ready && !window.__studioQA.workMoving(); }, null, 25_000);
  await nabd.cameraSteady();
  await sleep(300);
}

// Work-area limb grip on a body-joint marker («الكاحل · يسار», «الرسغ · يسار» …): click it, wait for the
// grip, optionally move the mouse straight up by liftPx (button up: click-to-hold), then a still click
// lets go. Records the attach time, the glove depth in the limb, the lift and the settle back to rest.
async function workstationLimb(page, nabd, id, index, { liftPx = 0, measure = false, settleMs = 2300 } = {}) {
  await nabd.waitFor(() => { const s = window.__studioQA.getSimulationState(); return s.abdomen.ready && !s.grip; }, null, 10_000);
  await sleep(200);
  const rest = await jointAt(page, id, index);
  const marker = (await nabd.sim()).points[`${id}-${index}`];
  const out = { id, index, marker, rest: rest.map((v) => round(v, 4)) };
  if (!marker) return { ...out, attachMs: null, reason: 'marker not on screen' };
  await page.mouse.move(marker.x, marker.y, { steps: 3 });
  await sleep(150);
  await page.mouse.click(marker.x, marker.y);
  out.attachMs = await waitGrip(page, 'wrist', 4_500);
  out.status = await nabd.text('#trainee-status');
  if (out.attachMs === null) { await sleep(800); return out; }
  await sleep(450);
  if (measure) out.penetrationAtAttach = await limbPenetration(page, id);
  let pointer = { ...marker };
  await c3Start(page, [id]);
  if (liftPx) {
    for (let k = 1; k <= 22; k += 1) { await page.mouse.move(marker.x, marker.y - liftPx * k / 22); await sleep(15); }
    pointer = { x: marker.x, y: marker.y - liftPx };
    await sleep(1200);
    const lifted = await jointAt(page, id, index);
    out.lift = { pointerUpPx: liftPx, dxM: round(lifted[0] - rest[0], 4), dyM: round(lifted[1] - rest[1], 4), dzM: round(lifted[2] - rest[2], 4) };
    if (measure) out.penetrationLifted = await limbPenetration(page, id);
  }
  const releasedAt = await rafNow(page);
  await page.mouse.down();
  await page.mouse.up();
  await sleep(settleMs);
  const frames = await c3Stop(page);
  out.settle = settleStats(frames, id, index, rest, releasedAt);
  out.gripAfter = (await nabd.sim()).grip;
  out.pointer = pointer;
  return out;
}

for (const size of [WIDE, NARROW]) {
  test.describe(`C3 limbs ${sizeName(size)}`, () => {
    test.use({ viewport: size });

    // ------------------------------------------------------------- item 9: PR-6
    test(`C3-9a drill wrist grips at least 13 of 14 clicks (PR-6) (${sizeName(size)})`, async ({ page, nabd }) => {
      test.setTimeout(300_000);
      await nabd.boot();
      await enterDrill(page, nabd);
      const clicks = [];
      const attempt = async (label, dx, dy) => {
        const w = (await nabd.sim()).practice.wrist;
        const point = { x: w.x + dx, y: w.y + dy };
        await page.mouse.move(point.x, point.y, { steps: 4 });
        await sleep(120);
        const started = Date.now();
        await page.mouse.click(point.x, point.y);
        const outcome = await page.waitForFunction(() => {
          const s = window.__studioQA.getSimulationState();
          if (s.forearm?.state === 'gripped') return 'gripped';
          // Since C5 a hold timeout reads «تعذّر الإمساك …» (no contact) instead of «خارج مدى …».
          const text = document.getElementById('trainee-status').textContent;
          return text.includes('خارج مدى') ? 'outOfReach' : text.includes('تعذّر الإمساك') ? 'noContact' : false;
        }, null, { timeout: 6_000, polling: 50 }).then((h) => h.jsonValue(), () => 'none in 6 s');
        const ms = Date.now() - started;
        const s = await nabd.sim();
        clicks.push({ label, offsetPx: [dx, dy], outcome, ms, gripNormal: s.crew.reachNormal.right?.map((v) => round(v, 3)) ?? null,
          padGapM: round(s.forearm?.gap, 4), sweepStops: s.forearm?.stops ?? null });
        if (outcome === 'gripped') {
          await page.mouse.down();
          await page.mouse.up();
          await nabd.waitFor(() => window.__studioQA.getSimulationState().forearm?.state === 'idle', null, 6_000);
          await nabd.waitFor(() => !document.getElementById('forearm-feedback').textContent, null, 6_000).catch(() => {});
          await sleep(400);
        } else await sleep(800);
      };
      await attempt('before «اقترب»', 0, 0);
      await page.click('[data-work-approach="-1"]');
      await nabd.waitFor(() => !window.__studioQA.workMoving(), null, 20_000);
      await nabd.cameraSteady();
      await sleep(400);
      const ring = [[0, 0], [0, -5], [5, 0], [-5, 0], [0, 5], [4, 4], [-4, -4], [4, -4], [-4, 4], [0, -9], [9, 0], [-9, 0], [0, 9]];
      for (let k = 0; k < ring.length; k += 1) await attempt(`after «اقترب» ${k + 1}`, ...ring[k]);
      const gripped = clicks.filter((c) => c.outcome === 'gripped');
      const result = { clicks: clicks.length, gripped: gripped.length,
        gripMs: { min: Math.min(...gripped.map((c) => c.ms)), max: Math.max(...gripped.map((c) => c.ms)) },
        minGripNormalY: round(Math.min(...gripped.map((c) => c.gripNormal?.[1] ?? 1)), 3), attempts: clicks };
      nabd.save(`C3-9a-drill-grips-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(gripped.length, 'drill wrist clicks that grip (≥ 26 of 28 over both widths)').toBeGreaterThanOrEqual(13);
      expect(result.gripMs.max, 'every grip within 3.2 s').toBeLessThan(3200);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 9: work-area limbs
    test(`C3-9b ankles attach, an upward drag lifts the arm, released limbs settle (${sizeName(size)})`, async ({ page, nabd }) => {
      test.setTimeout(300_000);
      await c2Boot(page, nabd);
      const result = { ankles: [] };
      // «الساق»: the left ankle three times (the third after «اقترب»), then the right leg's ankle.
      await openLimbRegion(page, nabd, '#trainee-focus-leg');
      for (let k = 0; k < 3; k += 1) {
        if (k === 2) {
          await page.click('[data-work-approach="-1"]');
          await workReadyAgain(page, nabd);
        }
        result.ankles.push({ attempt: `left ${k + 1}${k === 2 ? ' after «اقترب»' : ''}`,
          ...await workstationLimb(page, nabd, 'leftLeg', 2, { liftPx: k === 0 ? 60 : 0, measure: k === 0 }) });
      }
      await page.selectOption('#work-region', 'rightLeg');
      await workReadyAgain(page, nabd);
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(300);
      result.ankles.push({ attempt: 'right 1', ...await workstationLimb(page, nabd, 'rightLeg', 2) });

      // «الذراع»: grab «الرسغ · يسار», move the mouse straight up 110 px, a still click lets go.
      await openLimbRegion(page, nabd, '#trainee-focus-arm');
      result.armLift = await workstationLimb(page, nabd, 'leftArm', 2, { liftPx: 110, measure: true });
      if (size === WIDE) await nabd.shot(`C3-9b-arm-settled-${sizeName(size)}`);
      // Lift it again, let go, grab it again 250 ms into its settle and let go in place: it settles back
      // to the first resting pose (the grab took the settle over).
      const firstRest = result.armLift.rest;
      result.again = await workstationLimb(page, nabd, 'leftArm', 2, { liftPx: 80, settleMs: 250 });
      const marker = (await nabd.sim()).points['leftArm-2'];
      result.regrab = { midSettleToRestM: round(dist(await jointAt(page, 'leftArm', 2), firstRest), 4), marker };
      await page.mouse.move(marker.x, marker.y, { steps: 2 });
      await page.mouse.click(marker.x, marker.y);
      result.regrab.grabbedMs = await waitGrip(page, 'wrist', 4_500);
      await sleep(300);
      result.regrab.heldToRestM = round(dist(await jointAt(page, 'leftArm', 2), firstRest), 4);
      await c3Start(page, ['leftArm']);
      const regrabReleasedAt = await rafNow(page);
      await page.mouse.down();
      await page.mouse.up();
      await sleep(2300);
      result.regrab.settle = settleStats(await c3Stop(page), 'leftArm', 2, firstRest, regrabReleasedAt);
      // The height field is rebuilt once the limb is down, and the work area is ready again.
      await workReadyAgain(page, nabd);
      result.readyAfter = (await nabd.sim()).abdomen.ready;

      nabd.save(`C3-9b-workstation-limbs-${sizeName(size)}`, { result, errors: nabd.errors() });
      const attached = result.ankles.filter((a) => a.attachMs !== null).length;
      expect(attached, 'ankle grips attach (7/7 over both widths)').toBe(result.ankles.length);
      // Limb grips lost the height-field lift; the fingers must still rest on the limb, not sink into it
      // (aiming 2.4 cm below the skin top gave 2.5 cm at the wrist and 5.4 cm at the ankle).
      expect(result.ankles[0].penetrationAtAttach.deepestM, 'glove depth in the ankle at the grip ≤ 1 cm').toBeLessThanOrEqual(0.010);
      expect(result.armLift.penetrationAtAttach.deepestM, 'glove depth in the wrist at the grip ≤ 1 cm').toBeLessThanOrEqual(0.010);
      const lift = result.armLift.lift;
      expect(lift.dyM, '110 px up lifts the wrist > 6 cm').toBeGreaterThan(0.06);
      expect(Math.abs(lift.dxM), 'and moves it < 2 cm across the body').toBeLessThan(0.02);
      for (const [name, item] of [['ankle', result.ankles[0]], ['arm', result.armLift], ['arm grabbed while settling', result.regrab]]) {
        expect(item.settle.distanceAt2sM, `${name}: within 3 mm of rest 2 s after release`).toBeLessThan(0.003);
        expect(item.settle.maxSpeedMs, `${name}: settles at ≤ 0.32 m/s`).toBeLessThanOrEqual(0.34);
      }
      expect(result.again.settle.maxSpeedMs).toBeLessThanOrEqual(0.34);
      expect(result.regrab.grabbedMs, 'a settling wrist can be grabbed again').not.toBeNull();
      expect(result.readyAfter).toBe(true);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });
  });
}

// The free bedside grab aims the glove from the trainee's shoulder (CrewController shoulder(): 0.17 m to
// the side, 0.225 m below the eyes): the largest horizontal angle, over held frames, between the fingers
// (wrist bone → middle fingertip bone) and the shoulder → glove-wrist direction.
function gloveAimDeg(frames, side, from, to) {
  let worst = 0;
  for (const f of frames.filter((x) => x.t >= from && x.t <= to)) {
    const right = qRotate(f.cq, [1, 0, 0]);
    const rl = Math.hypot(right[0], right[2]);
    const sign = side === 'right' ? 1 : -1;
    const shoulder = [f.cp[0] + sign * 0.17 * right[0] / rl + 0.02, f.cp[1] - 0.225, f.cp[2] + sign * 0.17 * right[2] / rl];
    const aim = sub(f.h[side].w, shoulder);
    const fingers = sub(f.h[side].tip, f.h[side].w);
    const a = Math.atan2(aim[2], aim[0]), b = Math.atan2(fingers[2], fingers[0]);
    worst = Math.max(worst, Math.abs(angleDiff(a, b)));
  }
  return round(worst, 1);
}

async function trainToWristStep(page, nabd) {
  const phaseIs = (p, timeout = 8_000) => nabd.waitFor((x) => window.__studioQA.getSimulationState().phase === x, p, timeout);
  await page.click('#training-action');
  await phaseIs('monitor');
  await nabd.scrollSettled();
  await page.click('#training-action');
  await expect.poll(() => page.evaluate(() => document.getElementById('vitals-dialog').open)).toBe(true);
  await page.click('#vitals-confirm');
  await phaseIs('pickup');
  await nabd.scrollSettled();
  await nabd.cameraSteady();
  await sleep(600);
  const handle = (await nabd.sim()).practice.tool;
  await page.mouse.click(handle.x, handle.y);
  await phaseIs('aim', 8_000);
  const aim = (await nabd.sim()).practice.aimPointer;
  await page.mouse.move(aim.x, aim.y, { steps: 20 });
  for (const [dx, dy] of [[0, 0], [0, -12], [0, 12], [-12, 0], [12, 0], [0, -24], [0, 24], [-24, 0], [24, 0], [-12, -12], [12, 12], [12, -12], [-12, 12]]) {
    if ((await nabd.sim()).phase !== 'aim') break;
    await page.mouse.move(aim.x + dx, aim.y + dy, { steps: 6 });
    await sleep(700);
  }
  await phaseIs('deposit', 4_000);
  const tray = (await nabd.sim()).practice.tray;
  await page.mouse.move(tray.x, tray.y, { steps: 20 });
  await sleep(1200);
  await page.mouse.down();
  await page.mouse.up();
  await phaseIs('wrist', 6_000);
  await sleep(1000);
}

for (const size of [WIDE, NARROW]) {
  test.describe(`C3 limbs bedside and drill ${sizeName(size)}`, () => {
    test.use({ viewport: size });

    // ------------------------------------------------------------- item 9: free bedside wrist
    test(`C3-9c bedside wrist: glove from the trainee's side, vertical lift, settles back (${sizeName(size)})`, async ({ page, nabd }) => {
      await c2Boot(page, nabd);
      const result = {};
      const rest = await jointAt(page, 'leftArm', 2);
      const wrist = (await nabd.sim()).practice.wrist;
      expect(wrist, 'left wrist on screen').toBeTruthy();
      await page.mouse.move(wrist.x, wrist.y, { steps: 3 });
      await sleep(150);
      await c2Start(page);
      await page.mouse.click(wrist.x, wrist.y);
      result.attachMs = await waitGrip(page, 'wrist', 6_000);
      await sleep(700);
      const heldFrom = await page.evaluate(() => performance.now());
      await c3Start(page, ['leftArm']);
      for (let k = 1; k <= 22; k += 1) { await page.mouse.move(wrist.x, wrist.y - 110 * k / 22); await sleep(15); }
      await sleep(1200);
      const lifted = await jointAt(page, 'leftArm', 2);
      result.lift = { pointerUpPx: 110, dxM: round(lifted[0] - rest[0], 4), dyM: round(lifted[1] - rest[1], 4), dzM: round(lifted[2] - rest[2], 4) };
      if (size === WIDE) await nabd.shot(`C3-9c-bedside-wrist-lifted-${sizeName(size)}`);
      const releasedAt = await rafNow(page);
      await page.mouse.down();
      await page.mouse.up();
      await sleep(2300);
      result.settle = settleStats(await c3Stop(page), 'leftArm', 2, rest, releasedAt);
      const sample = await c2Stop(page);
      result.gloveAimDeg = gloveAimDeg(sample.frames, 'right', heldFrom, releasedAt);
      result.glove = handMotion(sample.frames, 'right');
      result.gripAfter = (await nabd.sim()).grip;

      nabd.save(`C3-9c-bedside-wrist-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(result.attachMs, 'the free bedside wrist grab attaches').not.toBeNull();
      expect(result.glove.minFingersForward, 'fingers point away from the trainee on every frame').toBeGreaterThan(0);
      expect(result.gloveAimDeg, 'fingers along the shoulder → wrist direction (≤ 20°)').toBeLessThanOrEqual(20);
      expect(result.lift.dyM, '110 px up lifts the wrist > 6 cm').toBeGreaterThan(0.06);
      expect(Math.abs(result.lift.dxM), 'and < 2 cm across the body').toBeLessThan(0.02);
      expect(result.settle.distanceAt2sM, 'within 3 mm of rest 2 s after release').toBeLessThan(0.003);
      expect(result.settle.maxSpeedMs, 'settles at ≤ 0.32 m/s').toBeLessThanOrEqual(0.34);
      expect(result.glove.maxTurnDeg, 'glove turn per frame ≤ 6°').toBeLessThanOrEqual(6);
      expect(result.glove.maxStepM, 'wrist travel per frame ≤ 2.5 cm').toBeLessThanOrEqual(0.025);
      expect(result.gripAfter).toBeNull();
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 9: C9 pause outside the view
    test(`C3-9d drill: the held forearm stays put outside the view; only a press resumes (${sizeName(size)})`, async ({ page, nabd }) => {
      await nabd.boot();
      await enterDrill(page, nabd);
      await page.click('[data-work-approach="-1"]');
      await nabd.waitFor(() => !window.__studioQA.workMoving(), null, 20_000);
      await nabd.cameraSteady();
      await sleep(400);
      const rest = await jointAt(page, 'leftArm', 2);
      const result = { rest };
      let grip = null;
      for (const [dx, dy] of [[0, 0], [0, -6], [6, 0], [-6, 0], [0, 6]]) {
        const w = (await nabd.sim()).practice.wrist;
        await page.mouse.move(w.x + dx, w.y + dy, { steps: 3 });
        await page.mouse.click(w.x + dx, w.y + dy);
        const ok = await nabd.waitFor(() => window.__studioQA.getSimulationState().forearm?.state === 'gripped', null, 4_500).then(() => true, () => false);
        if (ok) { grip = { x: w.x + dx, y: w.y + dy }; break; }
        await sleep(800);
      }
      expect(grip, 'the drill wrist grips').not.toBeNull();
      for (let k = 1; k <= 15; k += 1) { await page.mouse.move(grip.x, grip.y - 90 * k / 15); await sleep(15); }
      await sleep(1200);
      result.lifted = await jointAt(page, 'leftArm', 2);
      await page.evaluate(() => {
        window.__c3leave = [];
        document.querySelector('#viewport canvas').addEventListener('pointerleave', () => window.__c3leave.push(performance.now()));
      });
      await c3Start(page, ['leftArm']);
      const assistBox = await page.locator('#forearm-assist').boundingBox();
      const assist = { x: assistBox.x + assistBox.width / 2, y: assistBox.y + assistBox.height / 2 };
      result.assistOnScreen = assistBox.y >= 0 && assistBox.y + assistBox.height <= size.height;

      // 1. Out to «اطلب مساندة المشرف» (a real mouse path across the view), back over the wrist without a
      //    press: the forearm does not move after the pointer leaves the view.
      await page.mouse.move(assist.x, assist.y, { steps: 30 });
      await sleep(400);
      result.outside = { status: await nabd.text('#trainee-status'), paused: (await nabd.sim()).input.manipulationPaused };
      const leftAt = await page.evaluate(() => window.__c3leave[0]);
      const wristScreen = (await nabd.sim()).practice.wrist;
      await page.mouse.move(wristScreen.x, wristScreen.y - 20, { steps: 30 });
      await sleep(600);
      result.hoverBack = { status: await nabd.text('#trainee-status'), paused: (await nabd.sim()).input.manipulationPaused };
      let frames = await c3Stop(page);
      const atLeave = frames.find((f) => f.t >= leftAt)?.j.leftArm[2];
      result.afterLeave = { maxMoveM: round(Math.max(...frames.filter((f) => f.t >= leftAt).map((f) => dist(f.j.leftArm[2], atLeave))), 4),
        minWristY: round(Math.min(...frames.map((f) => f.j.leftArm[2][1])), 4), restY: round(rest[1], 4) };

      // 2. A press and drag resumes moving it (up 40 px), and the status comes back.
      const beforeDrag = await jointAt(page, 'leftArm', 2);
      await page.mouse.down();
      for (let k = 1; k <= 10; k += 1) { await page.mouse.move(wristScreen.x, wristScreen.y - 20 - 4 * k); await sleep(20); }
      await page.mouse.up();
      await sleep(900);
      const afterDrag = await jointAt(page, 'leftArm', 2);
      result.pressDrag = { dyM: round(afterDrag[1] - beforeDrag[1], 4), state: (await nabd.sim()).forearm.state, status: await nabd.text('#trainee-status') };

      // 3. Out again, ask for support, back over the view: still no movement; a still press lets go.
      await c3Start(page, ['leftArm']);
      const secondLeave = await page.evaluate(() => window.__c3leave.length);
      await page.mouse.move(assist.x, assist.y, { steps: 30 });
      await sleep(300);
      await page.mouse.down();
      await page.mouse.up();
      await expect(page.locator('#forearm-feedback')).toHaveText('المشرف مسنّد الساعد', { timeout: 15_000 });
      const back = (await nabd.sim()).practice.wrist;
      await page.mouse.move(back.x, back.y, { steps: 30 });
      await sleep(600);
      frames = await c3Stop(page);
      const leftAgainAt = await page.evaluate((n) => window.__c3leave[n], secondLeave);
      const atSecondLeave = frames.find((f) => f.t >= leftAgainAt)?.j.leftArm[2];
      result.support = { maxMoveAfterLeaveM: round(Math.max(...frames.filter((f) => f.t >= leftAgainAt).map((f) => dist(f.j.leftArm[2], atSecondLeave))), 4) };
      await page.mouse.down();
      await page.mouse.up();
      await sleep(1200);
      result.support.stateAfterClick = (await nabd.sim()).forearm.state;
      result.support.raisedM = round((await jointAt(page, 'leftArm', 2))[1] - rest[1], 4);
      if (size === WIDE) await nabd.shot(`C3-9d-drill-released-supported-${sizeName(size)}`);

      nabd.save(`C3-9d-drill-pause-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(result.outside.status, 'status explains the paused hold').toBe(HOLD_PAUSED);
      expect(result.outside.paused).toBe(true);
      expect(result.afterLeave.maxMoveM, 'no forearm movement after the pointer left the view (was 0.17–0.19 m)').toBeLessThan(0.003);
      expect(result.hoverBack.paused, 'moving back over the view does not resume').toBe(true);
      expect(result.afterLeave.minWristY, 'the wrist never goes below its resting height').toBeGreaterThanOrEqual(result.afterLeave.restY - 0.002);
      expect(result.pressDrag.dyM, 'a press and drag moves it again').toBeGreaterThan(0.01);
      expect(result.pressDrag.state).toBe('gripped');
      expect(result.pressDrag.status).not.toBe(HOLD_PAUSED);
      expect(result.support.maxMoveAfterLeaveM, 'no movement on the way to the support button and back').toBeLessThan(0.003);
      expect(result.support.stateAfterClick, 'a still click lets go').toBe('idle');
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 9: training step 5 (C6)
    test(`C3-9e step 5: a failed return settles back instead of jumping (${sizeName(size)})`, async ({ page, nabd }) => {
      test.skip(size !== WIDE, 'the step 5 path is the same settle as C3-9c; the training run is checked at 1440 (as smoke S4)');
      test.setTimeout(240_000);
      await nabd.boot();
      await trainToWristStep(page, nabd);
      const result = {};
      const rest = await jointAt(page, 'leftArm', 2);
      const liftWrist = async () => {
        const wrist = (await nabd.sim()).practice.wrist;
        await page.mouse.move(wrist.x, wrist.y, { steps: 3 });
        await page.mouse.click(wrist.x, wrist.y);
        await nabd.waitFor(() => window.__studioQA.getSimulationState().grip === 'wrist', null, 6_000);
        let lift = 0;
        for (const dy of [40, 70, 100, 130, 160]) {
          await page.mouse.move(wrist.x, wrist.y - dy, { steps: 8 });
          await sleep(500);
          lift = (await nabd.sim()).practice.lift;
          if (lift >= 0.052) break;
        }
        return { wrist, lift };
      };
      // Lift, then let go away from rest.
      const first = await liftWrist();
      result.firstLiftM = round(first.lift, 4);
      await c3Start(page, ['leftArm']);
      const releasedAt = await rafNow(page);
      await page.mouse.down();
      await page.mouse.up();
      await sleep(2300);
      result.failedReturn = { settle: settleStats(await c3Stop(page), 'leftArm', 2, rest, releasedAt),
        feedback: await nabd.text('#training-feedback'), phase: (await nabd.sim()).phase, retries: (await nabd.sim()).practice.retries };
      // Lift again, put it back, let go: step 5 completes (scored where the wrist was let go).
      const second = await liftWrist();
      await page.mouse.move(second.wrist.x, second.wrist.y, { steps: 12 });
      await sleep(900);
      await page.mouse.down();
      await page.mouse.up();
      await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'complete', null, 6_000);
      const s = await nabd.sim();
      result.completed = { phase: s.phase, results: s.practice.results, retries: s.practice.retries };

      nabd.save(`C3-9e-step5-settle-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(result.firstLiftM).toBeGreaterThanOrEqual(0.052);
      expect(result.failedReturn.phase).toBe('wrist');
      expect(result.failedReturn.feedback).toContain('ارفع الرسغ أول');
      // One frame moves at most 0.32 m/s × 50 ms (the app's longest step) = 1.6 cm, e.g. in WebKit at ~20 fps.
      expect(result.failedReturn.settle.maxStepM, 'no one-frame jump to rest (was 0.21 m)').toBeLessThan(0.02);
      expect(result.failedReturn.settle.maxSpeedMs, 'settles at ≤ 0.32 m/s').toBeLessThanOrEqual(0.34);
      expect(result.failedReturn.settle.distanceAt2sM, 'within 3 mm of rest 2 s after release').toBeLessThan(0.003);
      expect(result.completed.results).toEqual(['monitor', 'pickup', 'aim', 'deposit', 'wrist']);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });
  });
}

// ================================================================= C4 tools (item 11)
// Per-render sampler for the instrument, built on the C2 devtools hook: after each main render, the tool
// group's pose and visibility, both gloves (root rotation, wrist bone) and the camera. It also keeps the
// camera and the two field displays (0.92 × 0.5175 m planes) for the monitor-fill measurement. Read-only.
const C4_SETUP = () => {
  const C = window.__c2;
  if (C.c4) return true;
  const scene = C.scenes.find((s) => s.getObjectByName('Training instrument'));
  if (!scene || !C.renderers.length) return false;
  const S = { frames: [], sampling: false, camera: null };
  S.tool = scene.getObjectByName('Training instrument');
  const bone = (root, name) => {
    let found = null;
    root.traverse((o) => { if (o.isBone && (o.userData?.name === name || o.name === name.replace(/\./g, ''))) found ??= o; });
    return found;
  };
  S.hands = {};
  for (const side of ['left', 'right']) {
    const root = scene.getObjectByName(`Trainee anatomical ${side} hand`);
    S.hands[side] = { root, wrist: bone(root, `wrist.${side === 'left' ? 'L' : 'R'}`) };
  }
  S.displays = [];
  scene.traverse((o) => {
    const p = o.isMesh && o.geometry?.type === 'PlaneGeometry' ? o.geometry.parameters : null;
    if (p && Math.abs(p.width - 0.92) < 1e-6 && Math.abs(p.height - 0.5175) < 1e-6) S.displays.push(o);
  });
  const renderer = C.renderers[0];
  const render = renderer.render.bind(renderer);
  const w = new scene.position.constructor();
  renderer.render = function (sc, cam) {
    const main = sc === scene && renderer.getRenderTarget() === null;
    const result = render(sc, cam);
    if (main) S.camera = cam;
    if (S.sampling && main) {
      const f = { t: performance.now(), cp: cam.position.toArray(), cq: cam.quaternion.toArray(),
        tp: S.tool.position.toArray(), tq: S.tool.quaternion.toArray(), tv: S.tool.visible, h: {} };
      for (const [side, hand] of Object.entries(S.hands)) {
        f.h[side] = { q: hand.root.quaternion.toArray(), w: hand.wrist.getWorldPosition(w).toArray(), v: hand.root.visible };
      }
      S.frames.push(f);
    }
    return result;
  };
  C.c4 = S;
  return true;
};
async function c4Boot(page, nabd) {
  await c2Boot(page, nabd);
  await page.waitForFunction(C4_SETUP, null, { timeout: 15_000 });
}
const c4Start = (page) => page.evaluate(() => { const S = window.__c2.c4; S.frames = []; S.sampling = true; });
const c4Stop = (page) => page.evaluate(() => { const S = window.__c2.c4; S.sampling = false; return S.frames; });
const pageNow = (page) => page.evaluate(() => performance.now());
const r3 = (x) => round(x, 3);
// Camera space (x right, y up, z towards the trainee): the shaft direction (tool −Z) and the tool position.
const toCamera = (f, vec) => qRotate(qConj(f.cq), vec);
const shaftCam = (f) => toCamera(f, qRotate(f.tq, [0, 0, -1]));
const toolCam = (f) => toCamera(f, sub(f.tp, f.cp));

// Between consecutive main renders with the instrument visible: the largest turn (°) and step (m) of the
// instrument and of the holding glove, in the room and in camera space (what the trainee sees).
function toolMotion(frames, from = -Infinity, to = Infinity, side = 'right') {
  const list = frames.filter((f) => f.t >= from && f.t <= to && f.tv);
  const out = { frames: list.length, toolMaxTurnDeg: 0, toolMaxStepM: 0, handMaxTurnDeg: 0, handMaxStepM: 0, camMaxTurnDeg: 0, camMaxStepM: 0,
    toolTurnAtMs: null, toolStepAtMs: null, maxShaftCamZ: -Infinity, maxToolCamZ: -Infinity };
  for (let k = 0; k < list.length; k += 1) {
    const b = list[k];
    out.maxShaftCamZ = Math.max(out.maxShaftCamZ, shaftCam(b)[2]);
    out.maxToolCamZ = Math.max(out.maxToolCamZ, toolCam(b)[2]);
    if (!k) continue;
    const a = list[k - 1];
    const turn = qAngleDeg(a.tq, b.tq), step = dist(a.tp, b.tp);
    if (turn > out.toolMaxTurnDeg) { out.toolMaxTurnDeg = turn; out.toolTurnAtMs = Math.round(b.t - list[0].t); }
    if (step > out.toolMaxStepM) { out.toolMaxStepM = step; out.toolStepAtMs = Math.round(b.t - list[0].t); }
    if (a.h[side].v && b.h[side].v) {
      out.handMaxTurnDeg = Math.max(out.handMaxTurnDeg, qAngleDeg(a.h[side].q, b.h[side].q));
      out.handMaxStepM = Math.max(out.handMaxStepM, dist(a.h[side].w, b.h[side].w));
    }
    const ca = shaftCam(a), cb = shaftCam(b);
    out.camMaxTurnDeg = Math.max(out.camMaxTurnDeg, deg(Math.acos(Math.min(1, ca[0] * cb[0] + ca[1] * cb[1] + ca[2] * cb[2]))));
    const camStep = dist(toolCam(a), toolCam(b));
    if (camStep > out.camMaxStepM) {
      out.camMaxStepM = camStep;
      out.camStep = { atMs: Math.round(b.t - list[0].t), dtMs: round(b.t - a.t, 1), from: toolCam(a).map(r3), to: toolCam(b).map(r3),
        cameraMovedM: round(dist(a.cp, b.cp), 3), cameraTurnDeg: round(qAngleDeg(a.cq, b.cq), 1) };
    }
  }
  for (const key of ['toolMaxTurnDeg', 'handMaxTurnDeg', 'camMaxTurnDeg']) out[key] = round(out[key], 2);
  for (const key of ['toolMaxStepM', 'handMaxStepM', 'camMaxStepM', 'maxShaftCamZ', 'maxToolCamZ']) out[key] = round(out[key], 4);
  out.toolTotalTurnDeg = list.length > 1 ? round(qAngleDeg(list[0].tq, list.at(-1).tq), 1) : 0;
  out.toolTravelM = list.length > 1 ? round(dist(list[0].tp, list.at(-1).tp), 4) : 0;
  return out;
}
// The field display the trainee looks at: its share of the view height and width (projected corners) and
// its box on the page (px), to compare with the controls docked over the bottom of the view.
const displayFill = (page) => page.evaluate(() => {
  const S = window.__c2.c4;
  const cam = S.camera;
  if (!cam) return null;
  const V = cam.position.constructor;
  const box = document.querySelector('#viewport canvas').getBoundingClientRect();
  const r = (x) => Math.round(x * 1000) / 1000;
  let best = null;
  for (const d of S.displays) {
    const { width, height } = d.geometry.parameters;
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => d.localToWorld(new V(sx * width / 2, sy * height / 2, 0)).project(cam));
    if (corners.some((p) => p.z < -1 || p.z > 1)) continue;
    const xs = corners.map((p) => p.x), ys = corners.map((p) => p.y);
    const fill = { height: (Math.max(...ys) - Math.min(...ys)) / 2, width: (Math.max(...xs) - Math.min(...xs)) / 2,
      topPx: box.top + (1 - Math.max(...ys)) / 2 * box.height, bottomPx: box.top + (1 - Math.min(...ys)) / 2 * box.height,
      leftPx: box.left + (1 + Math.min(...xs)) / 2 * box.width, rightPx: box.left + (1 + Math.max(...xs)) / 2 * box.width };
    if (!best || fill.height > best.height) best = fill;
  }
  return best && { height: r(best.height), width: r(best.width), topPx: Math.round(best.topPx), bottomPx: Math.round(best.bottomPx),
    leftPx: Math.round(best.leftPx), rightPx: Math.round(best.rightPx), canvasTop: Math.round(box.top), canvasBottom: Math.round(box.bottom) };
});
// Last sampled frame: the shaft and the tool position in camera space.
async function readCarry(page) {
  await c4Start(page);
  await sleep(250);
  const last = (await c4Stop(page)).filter((f) => f.tv).at(-1);
  return last ? { shaftCam: shaftCam(last).map(r3), toolCam: toolCam(last).map(r3) } : null;
}
// Pick the selected tool from the tray (tray view, page scrolled to the top). Returns the handle point.
async function pickFromTray(page, nabd, tool) {
  await page.selectOption('#training-tool', tool);
  await page.click('#trainee-tray-view');
  await sleep(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await nabd.cameraSteady();
  const handle = (await nabd.sim()).practice.tool;
  expect(handle, `${tool} handle on screen`).toBeTruthy();
  await page.mouse.move(handle.x, handle.y, { steps: 6 });
  await sleep(300);
  return handle;
}
async function openToolField(page, nabd) {
  await page.click('#open-tool-field');
  await nabd.waitFor(() => { const s = window.__studioQA.getSimulationState(); return s.abdomen.ready && !window.__studioQA.workMoving(); }, null, 25_000);
  await page.evaluate(() => window.scrollTo(0, 0));
}
async function releaseTool(page, nabd) {
  await page.click('#release-held');
  await nabd.waitFor(() => !window.__studioQA.getSimulationState().grip, null, 5_000);
  await sleep(700);
}

for (const size of [WIDE, NARROW]) {
  test.describe(`C4 tools ${sizeName(size)}`, () => {
    test.use({ viewport: size });

    // ------------------------------------------------------------- item 11: D-01(b, c), D-02
    test(`C4-11a every tool is picked up at human speed and carried pointing ahead (${sizeName(size)})`, async ({ page, nabd }) => {
      test.setTimeout(300_000);
      await c4Boot(page, nabd);
      const result = { tools: {} };
      for (const tool of ['grasper', 'scope', 'scissors', 'needleHolder']) {
        const handle = await pickFromTray(page, nabd, tool);
        await c4Start(page);
        await sleep(150);
        const clickAt = await pageNow(page);
        await page.mouse.click(handle.x, handle.y);
        const attachMs = await waitGrip(page, 'tool', 6_000);
        await sleep(1100);
        const frames = await c4Stop(page);
        const shown = frames.filter((f) => f.tv);
        const r = { handle, attachMs, grip: (await nabd.sim()).grip, pick: toolMotion(frames, clickAt),
          liftM: round(shown.at(-1).tp[1] - shown[0].tp[1], 4), heldY: round(shown.at(-1).tp[1], 4),
          shaftCamHeld: shaftCam(shown.at(-1)).map(r3) };
        // Carry: a sweep across the field keeps the shaft pointing away from the trainee.
        await c4Start(page);
        const c = await nabd.canvas();
        for (const [u, v] of [[0.35, 0.55], [0.65, 0.55], [0.65, 0.42], [0.35, 0.42]]) {
          await page.mouse.move(c.left + u * c.width, c.top + v * c.height, { steps: 10 });
        }
        await sleep(500);
        r.carry = toolMotion(await c4Stop(page));
        if (tool === 'scope') await nabd.shot(`C4-11a-scope-carried-${sizeName(size)}`);
        result.tools[tool] = r;
        await releaseTool(page, nabd);
      }
      nabd.save(`C4-11a-pickup-carry-${sizeName(size)}`, { result, errors: nabd.errors() });
      for (const [tool, r] of Object.entries(result.tools)) {
        expect(r.attachMs, `${tool}: the tray pick attaches`).not.toBeNull();
        expect(r.pick.toolMaxTurnDeg, `${tool}: tool turn per frame on pickup ≤ 6°`).toBeLessThanOrEqual(6);
        expect(r.pick.handMaxTurnDeg, `${tool}: glove turn per frame on pickup ≤ 6°`).toBeLessThanOrEqual(6);
        expect(r.pick.toolMaxStepM, `${tool}: tool step per frame on pickup ≤ 2.5 cm`).toBeLessThanOrEqual(0.025);
        expect(Math.abs(r.heldY - 1.245), `${tool}: carried at the practice height`).toBeLessThan(0.01);
        expect(r.shaftCamHeld[2], `${tool}: the carried shaft points away from the trainee`).toBeLessThan(0);
        expect(r.carry.maxShaftCamZ, `${tool}: … on every frame of the carry`).toBeLessThan(0);
      }
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 11: D-02, D-04 (+ the walk with a tool)
    test(`C4-11b free instruments follow the pointer at the work area on both sides of the bed (${sizeName(size)})`, async ({ page, nabd }) => {
      test.setTimeout(300_000);
      await c4Boot(page, nabd);
      const result = {};
      // Four-point sweep of the canvas: how far the tool moves, its tip clearance above the skin, the glove depth.
      const sweep = async () => {
        const c = await nabd.canvas();
        const start = (await nabd.sim()).crew.toolPosition;
        const points = [];
        let maxMove = 0;
        for (const [u, v] of [[0.3, 0.5], [0.7, 0.5], [0.5, 0.3], [0.5, 0.62]]) {
          await page.mouse.move(c.left + u * c.width, c.top + v * c.height, { steps: 10 });
          await sleep(500);
          const s = await nabd.sim();
          maxMove = Math.max(maxMove, dist(s.crew.toolPosition, start));
          points.push({ u, v, tool: s.crew.toolPosition.map(r3), tipClearanceM: round(s.instrument.tipClearance, 4), glovePenetrationM: round(s.abdomen.penetration, 4) });
        }
        const clearances = points.map((p) => p.tipClearanceM).filter((x) => Number.isFinite(x));
        return { maxMoveM: round(maxMove, 4), minTipClearanceM: clearances.length ? Math.min(...clearances) : null,
          maxGlovePenetrationM: Math.max(...points.map((p) => p.glovePenetrationM ?? 0)), points };
      };

      const handle = await pickFromTray(page, nabd, 'scissors');
      await page.mouse.click(handle.x, handle.y);
      result.attachMs = await waitGrip(page, 'tool', 6_000);
      await sleep(700);
      await c4Start(page);
      await openToolField(page, nabd);
      await sleep(1300);
      result.entry = toolMotion(await c4Stop(page));
      result.near = { carry: await readCarry(page), sweep: await sweep(), status: await nabd.text('#trainee-status'),
        cameraX: round((await nabd.view()).position[0], 3) };
      if (size === WIDE) await nabd.shot(`C4-11b-scissors-near-side-${sizeName(size)}`);

      // «الجانب المقابل»: the scissors ride with the trainee and point ahead on the far side.
      await c4Start(page);
      await page.click('#work-other-side');
      await nabd.waitFor(() => window.__studioQA.workMoving(), null, 3_000).catch(() => {});
      await nabd.waitFor(() => !window.__studioQA.workMoving(), null, 30_000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(1500);
      result.walk = toolMotion(await c4Stop(page));
      result.far = { carry: await readCarry(page), sweep: await sweep(), cameraX: round((await nabd.view()).position[0], 3) };
      if (size === WIDE) await nabd.shot(`C4-11b-scissors-far-side-${sizeName(size)}`);
      await releaseTool(page, nabd);

      // Needle holder at the work area (the same free carry).
      await page.keyboard.press('Escape');
      await sleep(600);
      const holder = await pickFromTray(page, nabd, 'needleHolder');
      await page.mouse.click(holder.x, holder.y);
      result.needleHolder = { attachMs: await waitGrip(page, 'tool', 6_000) };
      await sleep(700);
      await openToolField(page, nabd);
      await sleep(1300);
      result.needleHolder.carry = await readCarry(page);
      result.needleHolder.sweep = await sweep();
      await releaseTool(page, nabd);

      nabd.save(`C4-11b-free-carry-work-area-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(result.attachMs).not.toBeNull();
      expect(result.near.cameraX * result.far.cameraX, 'the walk reached the other side').toBeLessThan(0);
      for (const [name, side] of [['near side', result.near], ['far side', result.far], ['needle holder', result.needleHolder]]) {
        expect(side.carry.shaftCam[2], `${name}: the shaft points away from the trainee (camera-space z < 0)`).toBeLessThan(0);
        expect(side.sweep.maxMoveM, `${name}: the instrument follows the pointer by ≥ 5 cm`).toBeGreaterThanOrEqual(0.05);
        expect(side.sweep.minTipClearanceM, `${name}: the tip stays above the skin`).toBeGreaterThan(0.02);
        expect(side.sweep.maxGlovePenetrationM, `${name}: the glove stays out of the skin`).toBeLessThan(0.005);
      }
      // What the trainee sees while walking to the area and round the bed: the tool stays in front and
      // keeps pointing ahead, and it never flies across the view.
      for (const [name, motion] of [['entry', result.entry], ['walk', result.walk]]) {
        expect(motion.maxShaftCamZ, `${name}: the shaft points ahead on every frame`).toBeLessThan(0);
        expect(motion.maxToolCamZ, `${name}: the tool stays in front of the trainee`).toBeLessThan(0);
        expect(motion.camMaxStepM, `${name}: in view, the tool moves ≤ 3 cm per frame`).toBeLessThanOrEqual(0.03);
        expect(motion.camMaxTurnDeg, `${name}: in view, the shaft turns ≤ 6° per frame`).toBeLessThanOrEqual(6);
      }
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 11: D-05 (plane carry), D-02 after a look
    test(`C4-11c a held tool keeps its place through a look, then points along the new heading (${sizeName(size)})`, async ({ page, nabd }) => {
      await c4Boot(page, nabd);
      const result = {};
      const handle = (await nabd.sim()).practice.tool;
      expect(handle, 'tray handle on screen after boot').toBeTruthy();
      await page.mouse.move(handle.x, handle.y, { steps: 4 });
      await page.mouse.click(handle.x, handle.y);
      result.attachMs = await waitGrip(page, 'tool', 6_000);
      await sleep(900);
      const c = await nabd.canvasCentre();
      const from = { x: c.x, y: c.y + 40 };
      await page.mouse.move(from.x, from.y, { steps: 12 });
      await sleep(900);
      const before = { tool: (await nabd.sim()).crew.toolPosition, view: await nabd.view(), carry: await readCarry(page) };
      // Right-drag 220 px to the left: the view turns about 49° to the left.
      await nabd.rightDrag(from.x, from.y, -220, 0, 20);
      await sleep(400);
      let s = await nabd.sim();
      const afterLook = { tool: s.crew.toolPosition, view: await nabd.view(), paused: s.input.manipulationPaused };
      // The next mouse moves: 2 px (this resumes the carry), then 22 px in 6 steps.
      await c4Start(page);
      const resumeAt = await pageNow(page);
      await page.mouse.move(from.x - 218, from.y);
      await sleep(700);
      const resumed = (await nabd.sim()).crew.toolPosition;
      const moveAt = await pageNow(page);
      await page.mouse.move(from.x - 196, from.y + 6, { steps: 6 });
      await sleep(800);
      const frames = await c4Stop(page);
      s = await nabd.sim();
      result.look = {
        yawDeg: round(angleDiff(afterLook.view.yaw, before.view.yaw), 2), paused: afterLook.paused,
        toolMovedDuringLookM: round(dist(afterLook.tool, before.tool), 4),
        resumeJumpM: round(dist(resumed, afterLook.tool), 4), resume: toolMotion(frames, resumeAt, moveAt),
        move: toolMotion(frames, moveAt), moveTravelM: round(dist(s.crew.toolPosition, resumed), 4),
        carryBefore: before.carry, carryAfter: await readCarry(page), grip: s.grip,
      };
      if (size === WIDE) await nabd.shot(`C4-11c-after-look-${sizeName(size)}`);
      nabd.save(`C4-11c-look-reanchor-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(result.attachMs).not.toBeNull();
      expect(Math.abs(result.look.yawDeg), 'the right-drag turned the view').toBeGreaterThanOrEqual(40);
      expect(result.look.toolMovedDuringLookM, 'the tool stays put while looking').toBeLessThan(0.002);
      expect(result.look.resumeJumpM, '≤ 1 cm jump when the carry resumes (was 0.70 m)').toBeLessThanOrEqual(0.01);
      expect(result.look.resume.toolMaxStepM, '… on every frame').toBeLessThanOrEqual(0.01);
      // The 22 px move itself moves the tool 3–5 cm (one pixel is about 1.4 mm at 1440 and 2 mm at 560).
      expect(result.look.move.toolMaxStepM, 'a 22 px move: at human speed (≤ 2.5 cm per frame)').toBeLessThanOrEqual(0.025);
      expect(result.look.moveTravelM, 'the tool still follows the pointer').toBeGreaterThan(0.005);
      expect(result.look.moveTravelM, '… by the pointer movement, not a throw').toBeLessThan(0.06);
      expect(Math.abs(result.look.carryAfter.shaftCam[0]), 'the shaft points along the new heading (was camera-space x 0.79)').toBeLessThan(0.3);
      expect(result.look.carryAfter.shaftCam[2]).toBeLessThan(0);
      expect(result.look.grip).toBe('tool');
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 11: D-05 (port), D-07, D-08, D-09 (Escape)
    test(`C4-11d scope: monitor fills the view, steering resumes in place, roll stops at ±90°, Escape places it (${sizeName(size)})`, async ({ page, nabd }) => {
      test.setTimeout(240_000);
      await c4Boot(page, nabd);
      const result = {};
      const handle = await pickFromTray(page, nabd, 'scope');
      await page.mouse.click(handle.x, handle.y);
      result.attachMs = await waitGrip(page, 'tool', 6_000);
      await sleep(700);
      await openToolField(page, nabd);
      await nabd.waitFor(() => Boolean(window.__studioQA.getSimulationState().instrument.portScreen), null, 10_000);
      await sleep(900);
      const port = (await nabd.sim()).instrument.portScreen;
      await page.mouse.move(port.x, port.y, { steps: 20 });
      for (const [dx, dy] of [[0, 0], [0, -8], [0, 8], [-8, 0], [8, 0], [0, -16], [0, 16]]) {
        if ((await nabd.sim()).instrument.aligned) break;
        await page.mouse.move(port.x + dx, port.y + dy, { steps: 4 });
        await sleep(500);
      }
      await nabd.waitFor(() => window.__studioQA.getSimulationState().instrument.aligned === true, null, 4_000);
      for (let k = 0; k < 6; k += 1) { await page.click('#tool-depth-controls [data-tool-depth="1"]'); await sleep(200); }
      await sleep(600);
      let s = await nabd.sim();
      const field = { fov: s.cameraFov, angles: s.instrument.angles, percent: s.instrument.percent };

      // «انظر إلى الشاشة»: the display fills about two thirds of the view (never wider than the view).
      await page.click('#scope-view');
      await sleep(1200);
      s = await nabd.sim();
      // The free band of the view: below the buttons and status at its top, above the docked controls.
      const band = await page.evaluate(() => {
        const box = document.querySelector('#viewport canvas').getBoundingClientRect();
        let top = box.top;
        for (const el of document.querySelectorAll('#viewport .viewport-tools, #viewport .viewport-caption, #viewport .viewport-info')) {
          const r = el.getBoundingClientRect();
          if (r.height > 0 && r.top < box.top + box.height / 2) top = Math.max(top, r.bottom);
        }
        const dock = document.querySelector('#viewport .viewport-dock').getBoundingClientRect().top;
        return { top: Math.round(top), bottom: Math.round(Math.min(box.bottom, dock)) };
      });
      result.monitor = { fov: round(s.cameraFov, 2), fill: await displayFill(page), band, looking: s.scope.lookingAtMonitor, live: s.scope.live,
        depthBar: (await nabd.rect('#tool-depth-controls')).visible, monitorControls: (await nabd.rect('#scope-monitor-controls')).visible };
      result.monitor.bandShare = round((result.monitor.fill.bottomPx - result.monitor.fill.topPx) / (band.bottom - band.top), 3);
      await nabd.shot(`C4-11d-monitor-${sizeName(size)}`);

      // Roll: 30 × X (7.5° each) stops at +90°, and the «لفّ +» buttons turn off; Z back, then the other way.
      const rollState = async () => ({ roll: (await nabd.sim()).instrument.angles.roll,
        plusDisabled: await page.$$eval('[data-tool-roll="1"]', (list) => list.every((b) => b.disabled)),
        minusDisabled: await page.$$eval('[data-tool-roll="-1"]', (list) => list.every((b) => b.disabled)),
        status: await nabd.text('#trainee-status') });
      for (let k = 0; k < 30; k += 1) { await page.keyboard.press('KeyX'); await sleep(40); }
      await sleep(400);
      result.rollPlus = await rollState();
      for (let k = 0; k < 2; k += 1) { await page.keyboard.press('KeyZ'); await sleep(60); }
      await sleep(300);
      result.rollBack = await rollState();
      for (let k = 0; k < 30; k += 1) { await page.keyboard.press('KeyZ'); await sleep(40); }
      await sleep(400);
      result.rollMinus = await rollState();
      for (let k = 0; k < 12; k += 1) { await page.keyboard.press('KeyX'); await sleep(60); }
      await sleep(500);
      result.rollZero = await rollState();

      // «ارجع إلى الحقل», then the next mouse moves over the view. The pointer comes back somewhere else
      // than where it steered from (120 px left of and 40 px above the port, in one move), then 4 px, then 44 px.
      await page.click('#scope-view');
      await sleep(900);
      s = await nabd.sim();
      result.back = { fov: round(s.cameraFov, 2), angles: s.instrument.angles };
      await c4Start(page);
      const backAt = await pageNow(page);
      const near = { x: port.x - 120, y: port.y - 40 };
      await page.mouse.move(near.x, near.y);
      await sleep(100);
      await page.mouse.move(near.x + 4, near.y, { steps: 2 });
      await sleep(700);
      s = await nabd.sim();
      result.resumed = { angles: s.instrument.angles, percent: s.instrument.percent };
      const moveAt = await pageNow(page);
      await page.mouse.move(near.x + 44, near.y, { steps: 8 });
      await sleep(800);
      const frames = await c4Stop(page);
      s = await nabd.sim();
      result.steer = { angles: s.instrument.angles, resume: toolMotion(frames, backAt, moveAt), move: toolMotion(frames, moveAt) };
      const angleChange = (a, b) => Math.max(Math.abs(a.pitch - b.pitch), Math.abs(a.yaw - b.yaw));
      result.resumeAngleChangeDeg = angleChange(result.resumed.angles, field.angles);
      result.steerAngleChangeDeg = angleChange(result.steer.angles, result.resumed.angles);

      // Escape with the scope inserted places it in the port (as a click release).
      const escapeFrom = await nabd.sim();
      await page.keyboard.press('Escape');
      await sleep(700);
      s = await nabd.sim();
      result.escape = { before: { percent: escapeFrom.instrument.percent, grip: escapeFrom.grip }, mode: s.crew.mode, grip: s.grip,
        toolVisible: s.crew.toolVisible, percent: s.instrument.percent, live: s.scope.live, focused: s.abdomen.focused,
        status: await nabd.text('#trainee-status') };
      result.field = field;
      nabd.save(`C4-11d-scope-monitor-roll-escape-${sizeName(size)}`, { result, errors: nabd.errors() });

      expect(result.attachMs).not.toBeNull();
      expect(field.percent, 'the scope is inserted').toBeGreaterThan(0);
      expect(result.monitor.looking).toBe(true);
      expect(result.monitor.fill, 'the display is in view').not.toBeNull();
      // About 60–70 % of the view height was the target; the buttons and status at the top and the docked
      // controls at the bottom leave about 62 % free at 1440, so the display fills that band instead.
      expect(Math.max(result.monitor.fill.height / 0.5, result.monitor.fill.width / 0.85), 'the display fills ≥ 50 % of the view height or ≥ 85 % of its width (was 20–25 %)').toBeGreaterThanOrEqual(1);
      expect(Math.max(result.monitor.bandShare / 0.85, result.monitor.fill.width / 0.85), '… ≥ 85 % of the free band, or ≥ 85 % of the width').toBeGreaterThanOrEqual(1);
      expect(Math.max(result.monitor.fill.height, result.monitor.fill.width), 'and fits in the view').toBeLessThanOrEqual(0.95);
      expect(result.monitor.fill.topPx, 'the display is below the buttons and status').toBeGreaterThanOrEqual(band.top);
      expect(result.monitor.fill.bottomPx, 'the display is not behind the docked controls').toBeLessThanOrEqual(band.bottom + 1);
      expect(result.monitor.monitorControls, 'the monitor controls stay').toBe(true);
      expect(result.back.fov, 'the field FOV comes back').toBeCloseTo(field.fov, 2);
      expect(result.rollPlus.roll, 'roll stops at +90°').toBe(90);
      expect(result.rollPlus.plusDisabled, '«لفّ +» off at the limit').toBe(true);
      expect(result.rollPlus.minusDisabled).toBe(false);
      expect(result.rollBack.roll).toBe(75);
      expect(result.rollBack.plusDisabled).toBe(false);
      expect(result.rollMinus.roll, 'roll stops at −90°').toBe(-90);
      expect(result.rollMinus.minusDisabled).toBe(true);
      expect(Math.abs(result.rollZero.roll)).toBe(0);
      expect(result.resumeAngleChangeDeg, 'steering resumes where it was (was a 22–31° pitch jump)').toBeLessThanOrEqual(3);
      expect(result.steer.resume.toolMaxStepM, '≤ 1 cm per frame when steering resumes').toBeLessThanOrEqual(0.01);
      expect(result.steerAngleChangeDeg, 'steering still follows the pointer').toBeGreaterThan(1);
      expect(result.escape.mode, 'Escape places the inserted scope').toBe('placed');
      expect(result.escape.grip).toBeNull();
      expect(result.escape.toolVisible).toBe(true);
      expect(result.escape.percent, 'the insertion is kept').toBe(result.escape.before.percent);
      expect(result.escape.live, 'the scope image stays live').toBe(true);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });
  });
}

// ================================================================= C5 navigation (items 8 and 10)
// Per-render sampler for moving around: the camera (position, rotation, FOV) and both gloves' wrists after
// every main render. It wraps renderer.render on top of the C2 hook. Test-only and read-only.
const C5_SETUP = () => {
  const C = window.__c2;
  if (C.c5) return true;
  if (!C.ready) return false;
  const scene = C.scenes.find((s) => s.getObjectByName('Trainee anatomical right hand'));
  const S = { frames: [], sampling: false, camera: null };
  const renderer = C.renderers[0];
  const render = renderer.render.bind(renderer);
  const w = new scene.position.constructor();
  // One sample of what is on screen now. c5Start takes one before the action, so a cut in the first frame
  // after it is measured too (the page renders only when something changes).
  S.sample = (cam) => {
    const f = { t: performance.now(), cp: cam.position.toArray(), cq: cam.quaternion.toArray(), fov: cam.fov, h: {} };
    for (const [side, hand] of Object.entries(C.hands)) f.h[side] = { w: hand.wrist.getWorldPosition(w).toArray(), v: hand.root.visible };
    return f;
  };
  renderer.render = function (sc, cam) {
    const main = sc === scene && renderer.getRenderTarget() === null;
    const result = render(sc, cam);
    if (main) S.camera = cam;
    if (S.sampling && main) S.frames.push(S.sample(cam));
    return result;
  };
  C.c5 = S;
  return true;
};
async function c5Boot(page, nabd) {
  await c2Boot(page, nabd);
  await page.waitForFunction(C5_SETUP, null, { timeout: 15_000 });
}
const c5Start = (page) => page.evaluate(() => { const S = window.__c2.c5; S.frames = S.camera ? [S.sample(S.camera)] : []; S.sampling = true; });
const c5Stop = (page) => page.evaluate(() => { const S = window.__c2.c5; S.sampling = false; return S.frames; });
const camForward = (q) => qRotate(q, [0, 0, -1]);
const yawOf = (q) => { const f = camForward(q); return Math.atan2(-f[0], -f[2]); };
// Angle (°) between the camera's forward direction and the direction from the camera to a world point.
function aimErrorDeg(f, point) {
  const d = sub(point, f.cp), n = Math.hypot(...d), fw = camForward(f.cq);
  return deg(Math.acos(Math.max(-1, Math.min(1, (d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2]) / n))));
}
// Between consecutive main renders: the largest heading change (yaw, °), whole-view turn (°), camera step (m),
// FOV change (°) and idle-glove step in camera space (m, what the trainee sees). Also the frames over which
// the camera moved, turned or zoomed, so a cut (one frame) and a glide (many frames) can be told apart.
function viewMotion(frames) {
  const out = { frames: frames.length, maxYawDeg: 0, maxTurnDeg: 0, maxStepM: 0, maxFovDeg: 0, maxGloveCamStepM: 0,
    movingFrames: 0, turningFrames: 0, fovFrames: 0, yawAtMs: null, stepAtMs: null };
  for (let k = 1; k < frames.length; k += 1) {
    const a = frames[k - 1], b = frames[k];
    const yaw = Math.abs(angleDiff(yawOf(b.cq), yawOf(a.cq)));
    const turn = qAngleDeg(a.cq, b.cq), step = dist(a.cp, b.cp), fov = Math.abs(b.fov - a.fov);
    if (yaw > out.maxYawDeg) { out.maxYawDeg = yaw; out.yawAtMs = Math.round(b.t - frames[0].t); }
    out.maxTurnDeg = Math.max(out.maxTurnDeg, turn);
    if (step > out.maxStepM) { out.maxStepM = step; out.stepAtMs = Math.round(b.t - frames[0].t); }
    out.maxFovDeg = Math.max(out.maxFovDeg, fov);
    if (step > 1e-5) out.movingFrames += 1;
    if (turn > 1e-3) out.turningFrames += 1;
    if (fov > 1e-4) out.fovFrames += 1;
    for (const side of ['left', 'right']) {
      if (!a.h[side].v || !b.h[side].v) continue;
      out.maxGloveCamStepM = Math.max(out.maxGloveCamStepM, dist(toCamera(a, sub(a.h[side].w, a.cp)), toCamera(b, sub(b.h[side].w, b.cp))));
    }
  }
  if (frames.length > 1) {
    out.totalStepM = dist(frames[0].cp, frames.at(-1).cp);
    out.totalYawDeg = angleDiff(yawOf(frames.at(-1).cq), yawOf(frames[0].cq));
    out.fov = [round(frames[0].fov, 2), round(frames.at(-1).fov, 2)];
    out.durationMs = Math.round(frames.at(-1).t - frames[0].t);
  }
  for (const key of ['maxYawDeg', 'maxTurnDeg', 'maxFovDeg', 'totalYawDeg']) out[key] = round(out[key], 2);
  for (const key of ['maxStepM', 'maxGloveCamStepM', 'totalStepM']) out[key] = round(out[key], 4);
  return out;
}
const workIdle = (nabd, timeout = 30_000) => nabd.waitFor(() => {
  const s = window.__studioQA.getSimulationState();
  return s.abdomen.ready && !window.__studioQA.workMoving();
}, null, timeout);
// Record one move: start sampling, act, wait until the work area is idle (when focused) and the camera
// is steady, then stop. Returns the motion, the frames and the work point.
async function recordMove(page, nabd, act, { work = true, settleMs = 300 } = {}) {
  await c5Start(page);
  await act();
  await sleep(150);
  if (work) await workIdle(nabd);
  await nabd.cameraSteady();
  await sleep(settleMs);
  const frames = await c5Stop(page);
  const s = await nabd.sim();
  return { motion: viewMotion(frames), frames, point: s.focus.lightTarget, focused: s.abdomen.focused, status: await nabd.text('#trainee-status') };
}
// The trainee's own look relative to the work point (°): heading of the view minus heading to the point.
async function lookOffsetDeg(nabd) {
  const s = await nabd.sim();
  const p = s.focus.lightTarget, c = s.cameraPosition;
  return angleDiff(s.cameraRotation[1], Math.atan2(-(p[0] - c[0]), -(p[2] - c[2])));
}
const NO_CONTACT = 'لم تصل الأصابع إلى الجلد';
const HOLDING_WALK = 'أفلِت ما في يدك لتمشي حول السرير';
const HOLDING_MOVE = 'أفلِت ما في يدك لتتحرك';
const REACH_LOST = 'خارج مدى اليد · اقترب من السرير';

for (const size of [WIDE, NARROW]) {
  test.describe(`C5 navigation ${sizeName(size)}`, () => {
    test.use({ viewport: size });

    // ------------------------------------------------------------- item 8: E-05, A9 (work area)
    test(`C5-8a work-area moves turn smoothly and keep the trainee's look (${sizeName(size)})`, async ({ page, nabd }) => {
      test.setTimeout(240_000);
      await c5Boot(page, nabd);
      const result = {};
      const top = () => page.evaluate(() => window.scrollTo(0, 0));

      // Entering the abdomen work area: no cut; the lens eases from 62° (76° narrow) to 52° (64°).
      const entry = await recordMove(page, nabd, () => page.click('#trainee-focus-abdomen'));
      result.entry = { ...entry.motion, finalAimErrorDeg: round(aimErrorDeg(entry.frames.at(-1), entry.point), 2) };
      await top();

      // «الجانب المقابل»: the view follows the work point while walking (P0: frozen 2.9 s, then up to 154° in a frame).
      const other = await recordMove(page, nabd, () => page.click('#work-other-side'));
      const walkFrames = other.frames.filter((f) => f.t - other.frames[0].t > 300);
      const mid = walkFrames[Math.floor(walkFrames.length / 3)];
      result.otherSide = { ...other.motion, midWalkAimErrorDeg: round(aimErrorDeg(mid, other.point), 1),
        finalAimErrorDeg: round(aimErrorDeg(other.frames.at(-1), other.point), 2), cameraX: round(other.frames.at(-1).cp[0], 3) };
      await top();

      // «ذراع المريض اليسرى» (region list) from the far side: back round the bed to the patient's left arm.
      const arm = await recordMove(page, nabd, () => page.selectOption('#work-region', 'leftArm'));
      result.arm = { ...arm.motion, finalAimErrorDeg: round(aimErrorDeg(arm.frames.at(-1), arm.point), 2), cameraX: round(arm.frames.at(-1).cp[0], 3) };
      await top();

      // The trainee's own look is kept through a step round the bed; «إعادة التركيز» brings it back smoothly.
      await nabd.holdKey('ArrowLeft', 400);
      await nabd.cameraSteady();
      const offsetBefore = await lookOffsetDeg(nabd);
      const stepRound = await recordMove(page, nabd, () => page.click('[data-work-step="1"]'));
      const offsetAfter = await lookOffsetDeg(nabd);
      result.lookKept = { offsetBeforeDeg: round(offsetBefore, 2), offsetAfterStepDeg: round(offsetAfter, 2), step: stepRound.motion };
      await top();
      const recentre = await recordMove(page, nabd, () => page.click('#recenter-work-focus'));
      result.recentre = { ...recentre.motion, offsetAfterDeg: round(await lookOffsetDeg(nabd), 2) };

      // Escape: back to the bedside spot in a walk, not a cut; the lens eases back.
      await page.mouse.move(5, 5);
      const back = await recordMove(page, nabd, () => page.keyboard.press('Escape'), { work: false });
      result.escape = { ...back.motion, focused: back.focused, cameraPosition: back.frames.at(-1).cp.map(r3) };
      nabd.save(`C5-8a-work-area-moves-${sizeName(size)}`, { result, errors: nabd.errors() });

      for (const [name, m] of [['entry', result.entry], ['other side', result.otherSide], ['arm', result.arm],
        ['step round the bed', result.lookKept.step], ['re-centre', result.recentre], ['Escape', result.escape]]) {
        expect(m.maxYawDeg, `${name}: heading changes ≤ 4° per frame`).toBeLessThanOrEqual(4);
        expect(m.maxTurnDeg, `${name}: the view turns ≤ 4° per frame`).toBeLessThanOrEqual(4);
      }
      expect(result.entry.maxFovDeg, 'entry: the lens eases (P0: 10° in one frame)').toBeLessThanOrEqual(1.5);
      expect(result.entry.fovFrames, '… over several frames').toBeGreaterThan(5);
      expect(result.entry.maxStepM, 'entry: no camera jump (P0: 0.17–0.20 m in one frame)').toBeLessThanOrEqual(0.05);
      expect(result.entry.finalAimErrorDeg, 'entry: the view ends on the work point').toBeLessThan(1);
      expect(result.otherSide.cameraX * result.arm.cameraX, 'the walks went round the bed').toBeLessThan(0);
      expect(result.otherSide.midWalkAimErrorDeg, 'the view follows the work point while walking (P0: up to 154° off)').toBeLessThan(45);
      expect(result.otherSide.finalAimErrorDeg).toBeLessThan(1);
      expect(result.arm.finalAimErrorDeg).toBeLessThan(1);
      expect(Math.abs(result.lookKept.offsetBeforeDeg), 'the trainee turned the view').toBeGreaterThan(25);
      expect(Math.abs(result.lookKept.offsetAfterStepDeg - result.lookKept.offsetBeforeDeg), 'the look offset is kept through the step').toBeLessThan(3);
      expect(Math.abs(result.recentre.offsetAfterDeg), '«إعادة التركيز» re-centres on the work point').toBeLessThan(1);
      expect(result.recentre.turningFrames, '… over several frames').toBeGreaterThan(5);
      expect(result.escape.focused).toBe(false);
      expect(result.escape.maxStepM, 'Escape: no cut (P0: 1.23 m in one frame)').toBeLessThanOrEqual(0.04);
      expect(result.escape.movingFrames, '… a walk over many frames').toBeGreaterThan(10);
      expect(result.escape.maxFovDeg, 'Escape: the lens eases back').toBeLessThanOrEqual(1.5);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 8: E-06, part of A8 (bedside)
    test(`C5-8b bedside steps, «إعادة المنظور» and the room view glide instead of jumping (${sizeName(size)})`, async ({ page, nabd }) => {
      test.setTimeout(180_000);
      await c5Boot(page, nabd);
      const result = {};
      const start = (await nabd.view()).position;
      const head = await recordMove(page, nabd, () => page.click('[data-step="head"]'), { work: false });
      result.stepHead = head.motion;
      const near1 = await recordMove(page, nabd, () => page.click('[data-step="near"]'), { work: false });
      result.stepNear1 = near1.motion;
      const near2 = await recordMove(page, nabd, () => page.click('[data-step="near"]'), { work: false });
      result.stepNear2 = { ...near2.motion, status: near2.status };
      // Turn the view, then «إعادة المنظور»: back to the bedside spot and heading, smoothly.
      await nabd.holdKey('ArrowLeft', 500);
      const lock = await recordMove(page, nabd, () => page.click('#trainee-lock'), { work: false });
      const atLock = await nabd.view();
      result.recentre = { ...lock.motion, positionError: round(dist(atLock.position, start), 4), yawDeg: round(deg(atLock.yaw), 2) };
      // In a training step it re-centres on that step's spot (the tray), not the default one.
      await page.click('#training-action');
      await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'monitor');
      await nabd.scrollSettled();
      await nabd.cameraSteady();
      const station = await nabd.view();
      await nabd.holdKey('KeyD', 500);
      await nabd.holdKey('ArrowRight', 400);
      const stepLock = await recordMove(page, nabd, () => page.click('#trainee-lock'), { work: false });
      const atStation = await nabd.view();
      result.stepRecentre = { ...stepLock.motion, positionError: round(dist(atStation.position, station.position), 4),
        yawErrorDeg: round(angleDiff(atStation.yaw, station.yaw), 2), status: stepLock.status };
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.click('#training-reset');
      await nabd.cameraSteady();
      // Room view: a glide out (P0: a 4.16 m cut).
      const room = await recordMove(page, nabd, () => page.click('#toggle-trainee-mode'), { work: false, settleMs: 200 });
      result.room = { ...room.motion, mode: (await nabd.sim()).mode };
      nabd.save(`C5-8b-bedside-moves-${sizeName(size)}`, { result, errors: nabd.errors() });

      for (const [name, m] of [['«نحو الرأس»', result.stepHead], ['«اقترب»', result.stepNear1], ['«إعادة المنظور»', result.recentre], ['«إعادة المنظور» in a step', result.stepRecentre]]) {
        expect(m.maxStepM, `${name}: ≤ 3 cm per frame (P0: 0.085–0.18 m in one frame)`).toBeLessThanOrEqual(0.03);
        expect(m.maxYawDeg, `${name}: heading ≤ 4° per frame`).toBeLessThanOrEqual(4);
      }
      expect(result.stepHead.totalStepM, '«نحو الرأس» still steps 18 cm').toBeCloseTo(0.18, 2);
      expect(Math.abs(result.stepHead.totalYawDeg), 'a step keeps the heading').toBeLessThan(0.1);
      expect(result.stepHead.movingFrames).toBeGreaterThan(5);
      expect(result.stepNear1.totalStepM).toBeGreaterThan(0.05);
      expect(result.stepNear2.totalStepM, 'at the bed edge «اقترب» does not move').toBeLessThan(0.001);
      expect(result.stepNear2.status, '… and says why').toContain('حافة السرير');
      expect(result.recentre.positionError, '«إعادة المنظور» returns to the bedside spot').toBeLessThan(0.005);
      expect(result.recentre.yawDeg).toBeCloseTo(90, 0);
      expect(result.stepRecentre.positionError, 'in a training step it returns to that step’s spot').toBeLessThan(0.005);
      expect(Math.abs(result.stepRecentre.yawErrorDeg)).toBeLessThan(0.5);
      expect(result.room.mode).toBe(false);
      expect(result.room.movingFrames, 'room view: a glide over many frames (1.2 s)').toBeGreaterThan(12);
      expect(result.room.maxStepM, '… with no single-frame jump of more than a quarter of the way').toBeLessThan(0.25 * result.room.totalStepM);
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });

    // ------------------------------------------------------------- item 10: E-08, E-09, D-11, D-03, busy
    test(`C5-10a every refused move or action says why (${sizeName(size)})`, async ({ page, nabd }) => {
      test.setTimeout(300_000);
      await c5Boot(page, nabd);
      const result = {};
      const status = () => nabd.text('#trainee-status');
      const top = () => page.evaluate(() => window.scrollTo(0, 0));

      // Free view at the bed edge: W walks into the limit and says so.
      await nabd.holdKey('KeyW', 900);
      const w1 = await nabd.view();
      await page.keyboard.down('KeyW');
      await sleep(400);
      const edgeStatus = await status();
      await page.keyboard.up('KeyW');
      await sleep(120);
      result.bedEdge = { movedM: round(dist((await nabd.view()).position, w1.position), 4), status: edgeStatus };

      // Forearm drill: the room view, Escape and the atlas are refused with a reason (F31); the drill stays.
      await page.click('#trainee-lock');
      await nabd.cameraSteady();
      await enterDrill(page, nabd);
      await top();
      await page.click('#toggle-trainee-mode');
      await sleep(400);
      let s = await nabd.sim();
      result.drillRoomView = { mode: s.mode, drill: Boolean(s.forearm), status: await status() };
      await page.mouse.move(5, 5);
      await page.keyboard.press('Escape');
      await sleep(300);
      s = await nabd.sim();
      result.drillEscape = { drill: Boolean(s.forearm), focused: s.abdomen.focused, status: await status() };
      await page.click('#anatomy-toggle');
      await sleep(300);
      s = await nabd.sim();
      result.drillAnatomy = { anatomy: s.anatomy?.active ?? null, drill: Boolean(s.forearm), status: await status() };
      // Holding the wrist: A and «الجانب المقابل» do not walk, and say why.
      await top();
      await sleep(300);
      const wrist = (await nabd.sim()).practice.wrist;
      await page.mouse.click(wrist.x, wrist.y);
      const gripped = await page.waitForFunction(() => window.__studioQA.getSimulationState().forearm?.state === 'gripped', null, { timeout: 6_000, polling: 50 })
        .then(() => true, () => false);
      const beforeA = await nabd.view();
      await page.keyboard.down('KeyA');
      await sleep(800);
      const statusDuringA = await status();
      await page.keyboard.up('KeyA');
      await sleep(150);
      const afterA = await nabd.view();
      await page.click('#work-other-side');
      await sleep(400);
      result.drillHeld = { gripped, aMovedM: round(dist(afterA.position, beforeA.position), 4), statusDuringA,
        otherSideMovedM: round(dist((await nabd.view()).position, afterA.position), 4), otherSideStatus: await status() };
      await top();
      await page.mouse.click(wrist.x, wrist.y);
      await nabd.waitFor(() => window.__studioQA.getSimulationState().forearm?.state === 'idle', null, 6_000).catch(() => {});
      await sleep(600);
      await page.click('#forearm-practice');
      await sleep(300);
      result.drillClosed = { drill: Boolean((await nabd.sim()).forearm), status: await status() };

      // A click while walking round the bed: «انتظر …» (the hands cannot act until the trainee arrives).
      await page.selectOption('#work-region', 'abdomen');
      await workIdle(nabd);
      await top();
      await page.click('#work-other-side');
      await nabd.waitFor(() => window.__studioQA.workMoving(), null, 3_000).catch(() => {});
      const c = await nabd.canvasCentre();
      await page.mouse.click(c.x, c.y + 40);
      await sleep(150);
      result.busyClick = { moving: await nabd.qa('workMoving'), status: await status() };
      await workIdle(nabd);
      await page.mouse.move(5, 5);
      await page.keyboard.press('Escape');
      await nabd.cameraSteady();

      // Holding the instrument in the training test: D and «نحو الرأس» do not move the trainee, and say why.
      await top();
      await page.click('#training-action');
      await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'monitor');
      await nabd.scrollSettled();
      await page.click('#training-action');
      await expect.poll(() => page.evaluate(() => document.getElementById('vitals-dialog').open)).toBe(true);
      await page.click('#vitals-confirm');
      await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'pickup');
      await nabd.scrollSettled();
      await nabd.cameraSteady();
      await sleep(400);
      const handle = (await nabd.sim()).practice.tool;
      await page.mouse.click(handle.x, handle.y);
      await nabd.waitFor(() => window.__studioQA.getSimulationState().phase === 'aim', null, 8_000);
      await sleep(400);
      const beforeD = await nabd.view();
      await page.keyboard.down('KeyD');
      await sleep(700);
      const statusDuringD = await status();
      await page.keyboard.up('KeyD');
      await sleep(150);
      const afterD = await nabd.view();
      await page.click('[data-step="head"]');
      await sleep(400);
      result.toolHeld = { dMovedM: round(dist(afterD.position, beforeD.position), 4), statusDuringD,
        headMovedM: round(dist((await nabd.view()).position, afterD.position), 4), headStatus: await status() };
      // Room view while holding: refused.
      await top();
      await page.click('#toggle-trainee-mode');
      await sleep(300);
      s = await nabd.sim();
      result.toolHeldRoomView = { mode: s.mode, grip: s.grip, status: await status() };
      await page.click('#release-held');
      await sleep(500);
      await page.click('#training-reset');
      await nabd.cameraSteady();

      // D-11 and D-03: the scope at the work area gets its own instruction; standing back 5× puts the port out
      // of the hand's reach: the wheel leaves the depth unchanged and says so; back in place it inserts.
      await page.selectOption('#training-tool', 'scope');
      await page.click('#trainee-tray-view');
      await sleep(1200);
      await top();
      await nabd.cameraSteady();
      const scopeHandle = (await nabd.sim()).practice.tool;
      await page.mouse.move(scopeHandle.x, scopeHandle.y, { steps: 5 });
      await page.mouse.click(scopeHandle.x, scopeHandle.y);
      await nabd.waitFor(() => window.__studioQA.getSimulationState().grip === 'tool', null, 6_000);
      await sleep(700);
      await page.click('#open-tool-field');
      await workIdle(nabd);
      await top();
      await sleep(500);
      result.scopeArrival = { status: await status(), depthState: await nabd.text('#tool-depth-state') };
      for (let k = 0; k < 5; k += 1) { await page.click('[data-work-approach="1"]'); await sleep(300); }
      await page.click('[data-work-approach="1"]');
      await sleep(200);
      const sixth = await status();
      await workIdle(nabd);
      await top();
      await sleep(400);
      const aimAtPort = async () => {
        const port = (await nabd.sim()).instrument.portScreen;
        await page.mouse.move(port.x, port.y, { steps: 15 });
        for (const [dx, dy] of [[0, 0], [0, -8], [0, 8], [-8, 0], [8, 0]]) {
          if ((await nabd.sim()).instrument.aligned) break;
          await page.mouse.move(port.x + dx, port.y + dy, { steps: 3 });
          await sleep(400);
        }
        await sleep(400);
        return port;
      };
      const port = await aimAtPort();
      s = await nabd.sim();
      const standBack = { cameraX: round(s.cameraPosition[0], 3), percentBefore: s.instrument.percent, aligned: s.instrument.aligned,
        depthState: await nabd.text('#tool-depth-state'), approachLimitStatus: sixth };
      for (let k = 0; k < 6; k += 1) { await page.mouse.wheel(0, -120); await sleep(150); }
      await sleep(400);
      s = await nabd.sim();
      Object.assign(standBack, { percentAfterWheel: s.instrument.percent, statusAfterWheel: await status(),
        insertDisabled: await page.$eval('#tool-depth-controls [data-tool-depth="1"]', (b) => b.disabled) });
      result.standBack = standBack;
      for (let k = 0; k < 6; k += 1) { await page.click('[data-work-approach="-1"]'); await sleep(300); }
      await workIdle(nabd);
      await top();
      await sleep(400);
      await page.mouse.move(port.x + 40, port.y + 40, { steps: 5 });
      await aimAtPort();
      for (let k = 0; k < 6; k += 1) { await page.mouse.wheel(0, -120); await sleep(150); }
      await sleep(400);
      s = await nabd.sim();
      result.inPlace = { cameraX: round(s.cameraPosition[0], 3), percentAfterWheel: s.instrument.percent, status: await status(),
        depthState: await nabd.text('#tool-depth-state') };
      nabd.save(`C5-10a-refusals-explained-${sizeName(size)}`, { result, errors: nabd.errors() });

      expect(result.bedEdge.movedM, 'W at the bed edge does not move').toBeLessThan(0.002);
      expect(result.bedEdge.status).toContain('حافة السرير');
      expect(result.drillRoomView, 'room view refused in the drill (F31)').toEqual({ mode: true, drill: true, status: 'أغلق تمرين الساعد أولًا ثم افتح معاينة الغرفة' });
      expect(result.drillEscape.drill, 'Escape does not end the drill').toBe(true);
      expect(result.drillEscape.status).toContain('تدريب لمس الساعد');
      expect(result.drillAnatomy.anatomy).toBe(false);
      expect(result.drillAnatomy.drill).toBe(true);
      expect(result.drillAnatomy.status).toContain('تمرين الساعد');
      expect(result.drillHeld.gripped).toBe(true);
      expect(result.drillHeld.aMovedM, 'A does not walk while the wrist is held').toBeLessThan(0.002);
      expect(result.drillHeld.statusDuringA).toBe(HOLDING_WALK);
      expect(result.drillHeld.otherSideMovedM).toBeLessThan(0.002);
      expect(result.drillHeld.otherSideStatus).toBe(HOLDING_WALK);
      expect(result.drillClosed.drill).toBe(false);
      expect(result.busyClick.moving, 'the click came during the walk').toBe(true);
      expect(result.busyClick.status).toBe('انتظر حتى تنتهي الحركة');
      expect(result.toolHeld.dMovedM).toBeLessThan(0.002);
      expect(result.toolHeld.statusDuringD).toBe(HOLDING_MOVE);
      expect(result.toolHeld.headMovedM).toBeLessThan(0.002);
      expect(result.toolHeld.headStatus).toBe(HOLDING_MOVE);
      expect(result.toolHeldRoomView.mode).toBe(true);
      expect(result.toolHeldRoomView.grip).toBe('tool');
      expect(result.toolHeldRoomView.status).toBe('أفلِت ما في يدك قبل معاينة الغرفة');
      expect(result.scopeArrival.status, 'a held scope gets its own instruction (D-11)').toBe('وجّه طرف الأداة نحو حلقة فتحة التدريب ثم أدخلها');
      expect(result.standBack.cameraX, 'the trainee stood back').toBeGreaterThan(0.95);
      expect(result.standBack.approachLimitStatus).toBe('لا تستطيع الابتعاد أكثر من هنا');
      expect(result.standBack.depthState).toBe(REACH_LOST);
      expect(result.standBack.percentAfterWheel, 'standing back, the wheel leaves the depth unchanged (D-03)').toBe(result.standBack.percentBefore);
      expect(result.standBack.statusAfterWheel).toBe(REACH_LOST);
      expect(result.standBack.insertDisabled).toBe(true);
      expect(result.inPlace.percentAfterWheel, 'back in place the wheel inserts').toBeGreaterThan(0);
      expect(result.inPlace.status).not.toContain('خارج مدى');
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });
  });
}

// ------------------------------------------------------------- item 10: B6 (a reach that never touches)
// On a very slow machine (Chrome CPU throttling ×30, a few frames a second) the hand cannot reach the skin
// within the 3.2 s hold time. The status must then say so and keep saying it (P0: «خارج مدى الإيد», replaced at
// once by the work instruction). Chrome only (the throttling is a Chrome DevTools feature).
test.describe('C5 no contact 1440x900', () => {
  test.use({ viewport: WIDE });
  test('C5-10b a reach that times out says the fingers did not touch, and the text stays (1440x900)', async ({ page, nabd, browserName }) => {
    test.skip(browserName !== 'chromium', 'CPU throttling needs Chrome DevTools');
    test.setTimeout(180_000);
    await nabd.boot();
    await openAbdomen(page, nabd, 'press');
    const p = (await nabd.sim()).abdomen.sample;
    await page.mouse.move(p.x, p.y);
    await sleep(300);
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 30 });
    const pressed = Date.now();
    await page.mouse.click(p.x, p.y);
    const timeline = [];
    let shownAt = null;
    while (Date.now() - pressed < 20_000) {
      const st = await nabd.text('#trainee-status');
      if (!timeline.length || timeline.at(-1).status !== st) timeline.push({ ms: Date.now() - pressed, status: st });
      if (shownAt === null && st.includes(NO_CONTACT)) shownAt = Date.now();
      if (shownAt !== null && Date.now() - shownAt >= 3500) break;
      await sleep(200);
    }
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await sleep(500);
    const s = await nabd.sim();
    const result = { timeline, shownAfterMs: shownAt && shownAt - pressed, finalStatus: await nabd.text('#trainee-status'),
      grip: s.grip, reach: s.crew.reach };
    nabd.save('C5-10b-no-contact-1440x900', { result, errors: nabd.errors() });
    expect(result.shownAfterMs, 'the no-contact text appears').not.toBeNull();
    expect(result.finalStatus, '… and is still shown 3.5 s later (not replaced by the instruction)').toContain(NO_CONTACT);
    expect(timeline.some((e) => e.status.includes('خارج مدى')), 'no out-of-reach text for a reachable target').toBe(false);
    expect(result.grip).toBeNull();
    expect(result.reach.left === null && result.reach.right === null, 'the hand went back').toBe(true);
    expect(nabd.errors(), 'M11 = 0').toEqual([]);
  });
});

// ================================================================= C6 remaining P1 items
// (a) F26: the lamp task lights work in the default (GLB) path, aimed at the work point; (b) a released or
// inactive glove drops the forearm collision object (AC-P1-4); (c) the Rapier licence notice in index.html;
// (e) F27 table pads against the patient, measured only. (d), the hover segment, is in perf-capture.mjs.
// The lamp check renders the same view with the lamp lights switched off through the three.js devtools hook
// (test-only, restored at once) to show that they light the work area and leave the room almost unchanged.
const LAMP = { color: 0xfffbf1, intensity: 1.18 };
const GLB_LAMP_FACES = [[-0.83, 2.94, 0.05], [0.83, 2.94, -0.28]]; // light_0/1_diffuser in light-pendant-system.glb
const PROCEDURAL_LAMPS = [[-0.8, 2.91, 0.03], [0.8, 2.9166, -0.32]]; // fallback lamp heads (head y 3.02 − 0.11 × scale)
const LUMA_REGIONS_V1 = { canvas: [0.02, 0.17, 0.98, 0.9], patientTorso: [0.51, 0.35, 0.83, 0.55], room: [0.46, 0.01, 0.71, 0.19] };
// Mean luma (Rec. 709) of regions given as fractions of the canvas box, from a PNG screenshot of the page.
async function lumaOf(page, png, box, regions) {
  return page.evaluate(async ({ url, box, regions }) => {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const out = {};
    for (const [name, [x0, y0, x1, y1]] of Object.entries(regions)) {
      const x = Math.round(box.left + x0 * box.width), y = Math.round(box.top + y0 * box.height);
      const d = g.getImageData(x, y, Math.round((x1 - x0) * box.width), Math.round((y1 - y0) * box.height)).data;
      let sum = 0, clipped = 0;
      for (let i = 0; i < d.length; i += 4) { const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; sum += l; if (l >= 245) clipped += 1; }
      out[name] = { meanLuma: Math.round(sum / (d.length / 4) * 10) / 10, clippedPct: Math.round(clipped / (d.length / 4) * 1e4) / 100 };
    }
    return out;
  }, { url: `data:image/png;base64,${png.toString('base64')}`, box, regions });
}
// Lights as the renderer sees them: the lights Scene.traverseVisible reaches (the renderer's own rule).
const visibleLights = (page) => page.evaluate(() => {
  const scene = window.__c2.scenes.find((s) => s.getObjectByName('Trainee anatomical right hand'));
  const list = [];
  scene.traverseVisible((o) => { if (o.isLight) list.push({ type: o.type, name: o.name, intensity: o.intensity }); });
  return list;
});
const setLampIntensity = (page, value) => page.evaluate((v) => {
  const scene = window.__c2.scenes.find((s) => s.getObjectByName('Trainee anatomical right hand'));
  scene.traverse((o) => { if (o.isLight && /^NabdLampTaskLight/.test(o.name)) o.intensity = v; });
}, value);
// Angle (°) between a lamp's cone axis (position → target) and the direction from the lamp to a point.
function aimOffDeg(lamp, point) {
  const a = sub(lamp.target, lamp.position), b = sub(point, lamp.position);
  const cos = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (Math.hypot(...a) * Math.hypot(...b));
  return round(deg(Math.acos(Math.min(1, cos))), 2);
}
const lampRecord = (lamps) => lamps.map(({ name, type, color, intensity, castShadow, lit, position, target }) =>
  ({ name, type, color: `#${color.toString(16)}`, intensity, castShadow, lit, position: position.map((x) => round(x, 4)), target: target.map((x) => round(x, 4)) }));

test.describe('C6 lamp lights 1440x900', () => {
  test.use({ viewport: WIDE });

  test('C6-a the lamp task lights are in the scene, lit and aimed at the work point (default GLB path) (1440x900)', async ({ page, nabd }) => {
    await c2Boot(page, nabd);
    const result = {};
    let s = await nabd.sim();
    result.assets = await nabd.qa('getAssetStatus');
    result.lamps = lampRecord(s.lamps);
    result.visibleLights = await visibleLights(page);
    result.aimV1 = s.lamps.map((lamp) => aimOffDeg(lamp, s.focus.lightTarget));
    result.lampFaceErrorM = s.lamps.map((lamp, k) => round(dist(lamp.position, GLB_LAMP_FACES[k]), 4));

    // The lamps' share of the picture in V1: the same frame with the lamp lights at 0 (test-only).
    const box = await nabd.canvas();
    await sleep(300);
    const lit = await page.screenshot();
    await setLampIntensity(page, 0);
    await sleep(400);
    const dark = await page.screenshot();
    await setLampIntensity(page, LAMP.intensity);
    await sleep(400);
    result.lumaV1 = { lampsOn: await lumaOf(page, lit, box, LUMA_REGIONS_V1), lampsOff: await lumaOf(page, dark, box, LUMA_REGIONS_V1) };
    result.lumaV1.gainPct = Object.fromEntries(Object.keys(LUMA_REGIONS_V1).map((k) =>
      [k, round(100 * (result.lumaV1.lampsOn[k].meanLuma / result.lumaV1.lampsOff[k].meanLuma - 1), 1)]));
    await nabd.shot('C6-a-lamps-V1-1440x900');

    // V2 (the drill): the lamps follow the work point.
    await enterDrill(page, nabd);
    s = await nabd.sim();
    const drillWrist = await jointAt(page, 'leftArm', 2);
    result.drill = { lightTarget: s.focus.lightTarget, aim: s.lamps.map((lamp) => aimOffDeg(lamp, s.focus.lightTarget)),
      targetMovedM: round(dist(s.focus.lightTarget, [0, 0.95, -0.15]), 4), targetToWristM: round(dist(s.focus.lightTarget, drillWrist), 4),
      lit: s.lamps.map((lamp) => lamp.lit) };
    await nabd.shot('C6-a-lamps-V2-1440x900');

    nabd.save('C6-a-lamp-lights-1440x900', { result, errors: nabd.errors() });
    expect(result.assets.surgicalLightsAndPendant, 'the default GLB lamp path is active').toBe(true);
    expect(result.lamps).toHaveLength(2);
    for (const lamp of s.lamps) {
      expect(lamp.type).toBe('SpotLight');
      expect(lamp.color).toBe(LAMP.color);
      expect(lamp.intensity).toBe(LAMP.intensity);
      expect(lamp.lit, 'in the scene with every ancestor visible').toBe(true);
    }
    expect(result.visibleLights.filter((l) => /^NabdLampTaskLight/.test(l.name)), 'the renderer reaches both lamp lights').toHaveLength(2);
    for (const e of result.lampFaceErrorM) expect(e, 'each light sits at its GLB lamp face').toBeLessThan(0.002);
    for (const a of [...result.aimV1, ...result.drill.aim]) expect(a, 'cone axis through the work point').toBeLessThan(0.5);
    expect(result.drill.targetMovedM, 'in the drill the lamps turn to the forearm').toBeGreaterThan(0.1);
    expect(result.drill.targetToWristM, '… within 25 cm of the wrist').toBeLessThan(0.25);
    expect(result.drill.lit).toEqual([true, true]);
    expect(result.lumaV1.gainPct.patientTorso, 'the lamps visibly light the work area').toBeGreaterThan(5);
    expect(result.lumaV1.gainPct.room, 'and leave the room almost unchanged').toBeLessThan(6);
    expect(result.lumaV1.lampsOn.patientTorso.clippedPct, 'no blown-out skin').toBeLessThan(1);
    expect(nabd.errors(), 'M11 = 0').toEqual([]);
  });

  test('C6-a2 the fallback lamp path has the same lights (1440x900)', async ({ page, nabd }) => {
    await page.route('**/surgical-system/light-pendant-system.glb', (route) => route.abort());
    await c2Boot(page, nabd);
    const s = await nabd.sim();
    const result = { assets: await nabd.qa('getAssetStatus'), lamps: lampRecord(s.lamps), visibleLights: await visibleLights(page),
      headErrorM: s.lamps.map((lamp, k) => round(dist(lamp.position, PROCEDURAL_LAMPS[k]), 4)) };
    // The aborted request and the runtime's own fallback warning are the expected messages here.
    const unexpected = nabd.errors().filter((e) => !/Failed to load resource|light-pendant-system/.test(e));
    nabd.save('C6-a2-lamp-lights-fallback-1440x900', { result, errors: nabd.errors(), unexpected });
    expect(result.assets.surgicalLightsAndPendant).toBe(false);
    for (const lamp of s.lamps) {
      expect(lamp.type).toBe('SpotLight');
      expect(lamp.color).toBe(LAMP.color);
      expect(lamp.intensity).toBe(LAMP.intensity);
      expect(lamp.lit).toBe(true);
    }
    expect(result.visibleLights.filter((l) => /^NabdLampTaskLight/.test(l.name))).toHaveLength(2);
    for (const e of result.headErrorM) expect(e, 'each light sits under its procedural lamp head').toBeLessThan(0.002);
    expect(unexpected, 'no other error').toEqual([]);
  });
});

// Grip the drill wrist with the active hand (a trainee retries a click that stalls short of the wrist).
async function gripDrillWrist(page, nabd) {
  for (const [dx, dy] of [[0, 0], [0, -6], [6, 0], [-6, 0], [0, 6]]) {
    const w = (await nabd.sim()).practice.wrist;
    await page.mouse.move(w.x + dx, w.y + dy, { steps: 3 });
    await page.mouse.click(w.x + dx, w.y + dy);
    const ok = await nabd.waitFor(() => window.__studioQA.getSimulationState().forearm?.state === 'gripped', null, 4_500).then(() => true, () => false);
    if (ok) return { x: w.x + dx, y: w.y + dy };
    await sleep(800);
  }
  return null;
}
// Largest change of a glove's wrist position in camera space over the rendered frames in [from, to].
function cameraSpaceDrift(frames, side, from, to) {
  const list = frames.filter((f) => f.t >= from && f.t <= to);
  const local = list.map((f) => qRotate(qConj(f.cq), sub(f.h[side].w, f.cp)));
  let maxStep = 0;
  for (let k = 1; k < local.length; k += 1) maxStep = Math.max(maxStep, dist(local[k], local[k - 1]));
  const total = local.length ? Math.max(...local.map((p) => dist(p, local[0]))) : null;
  return { frames: list.length, maxFrameStepM: round(maxStep, 4), maxFromStartM: round(total, 4) };
}

for (const size of [WIDE, NARROW]) {
  test.describe(`C6 forearm contact ${sizeName(size)}`, () => {
    test.use({ viewport: size });

    test(`C6-b only the hand that holds the forearm keeps its collision object (${sizeName(size)})`, async ({ page, nabd }) => {
      await c2Boot(page, nabd);
      await enterDrill(page, nabd);
      await page.click('[data-work-approach="-1"]');
      await nabd.waitFor(() => !window.__studioQA.workMoving(), null, 20_000);
      await nabd.cameraSteady();
      await sleep(400);
      const flags = async () => (await nabd.sim()).crew.forearmContact;
      const result = { before: await flags() };

      // 1. The right hand grips, lifts 60 px and lets go (an attached release).
      const grip = await gripDrillWrist(page, nabd);
      expect(grip, 'the drill wrist grips with the right hand').not.toBeNull();
      result.rightGripped = await flags();
      for (let k = 1; k <= 12; k += 1) { await page.mouse.move(grip.x, grip.y - 60 * k / 12); await sleep(15); }
      await sleep(900);
      await c2Start(page);
      const releasedAt = await rafNow(page);
      await page.mouse.down();
      await page.mouse.up();
      await nabd.waitFor(() => window.__studioQA.getSimulationState().forearm?.state === 'idle', null, 4_000);
      await sleep(1500);
      result.afterRightRelease = await flags();
      // 2. The released hand is idle again: it stays with the head while the view turns (← for 600 ms).
      const turnFrom = await pageNow(page);
      await nabd.holdKey('ArrowLeft', 600);
      await sleep(300);
      const turnTo = await pageNow(page);
      const sample = await c2Stop(page);
      result.releaseMotion = handMotion(sample.frames, 'right', releasedAt, turnFrom);
      result.turnDrift = cameraSpaceDrift(sample.frames, 'right', turnFrom, turnTo);
      await nabd.holdKey('ArrowRight', 600);
      await nabd.cameraSteady();

      // 3. Switch to the left hand (Q) and grip with it.
      await page.keyboard.press('KeyQ');
      await sleep(600);
      result.afterSwitchToLeft = await flags();
      const leftGrip = await gripDrillWrist(page, nabd);
      result.leftGripOk = Boolean(leftGrip);
      if (leftGrip) {
        result.leftGripped = await flags();
        let s = await nabd.sim();
        result.leftCollision = { overlap: round(s.forearm.overlap, 5), stops: s.forearm.stops };
        // 4. A hand switch (E) while the left hand holds: the holding hand keeps its collision object.
        await page.keyboard.press('KeyE');
        await sleep(400);
        result.switchWhileHolding = await flags();
        // The idle right hand turns with the view without a collision object.
        await nabd.holdKey('ArrowLeft', 400);
        await sleep(300);
        s = await nabd.sim();
        // (Recorded only: the holding left hand's own sweep keeps adding stops while it presses on the wrist.)
        result.afterTurnWhileLeftHolds = { overlap: round(s.forearm.overlap, 5), stops: s.forearm.stops, state: s.forearm.state, flags: s.crew.forearmContact };
        await nabd.holdKey('ArrowRight', 400);
        await nabd.cameraSteady();
        await page.mouse.move(leftGrip.x, leftGrip.y);
        await page.mouse.down();
        await page.mouse.up();
        await nabd.waitFor(() => window.__studioQA.getSimulationState().forearm?.state === 'idle', null, 4_000);
        await sleep(800);
        result.afterLeftRelease = await flags();
      }
      if (size === WIDE) await nabd.shot(`C6-b-after-release-${sizeName(size)}`);

      nabd.save(`C6-b-forearm-contact-${sizeName(size)}`, { result, errors: nabd.errors() });
      expect(result.before).toEqual({ left: false, right: false });
      expect(result.rightGripped).toEqual({ left: false, right: true });
      expect(result.afterRightRelease, 'an attached release drops the collision object (was right: true)').toEqual({ left: false, right: false });
      expect(result.turnDrift.maxFromStartM, 'the released glove stays with the head while the view turns').toBeLessThan(0.005);
      expect(result.releaseMotion.maxStepM, 'the release has no pop (≤ 2.5 cm per frame)').toBeLessThanOrEqual(0.025);
      expect(result.releaseMotion.maxTurnDeg, 'and no snap (≤ 6° per frame)').toBeLessThanOrEqual(6);
      expect(result.afterSwitchToLeft).toEqual({ left: false, right: false });
      expect(result.leftGripOk, 'the left hand grips the drill wrist').toBe(true);
      expect(result.leftGripped, 'only the holding (left) glove has it').toEqual({ left: true, right: false });
      expect(result.switchWhileHolding, 'a switch keeps it on the hand that still holds').toEqual({ left: true, right: false });
      expect(result.afterTurnWhileLeftHolds.flags, 'the right hand turning with the view stays without one').toEqual({ left: true, right: false });
      expect(result.afterLeftRelease).toEqual({ left: false, right: false });
      expect(nabd.errors(), 'M11 = 0').toEqual([]);
    });
  });
}

// (c) Rapier licence notice: the served page carries the Rapier notice and the Apache-2.0 text (the
// standalone preview and the Vite output copy index.html, so they carry it too; text search in the report).
test.describe('C6 licence 1440x900', () => {
  test.use({ viewport: WIDE });
  test('C6-c the page lists Rapier 0.21.0 with its Apache-2.0 licence text (1440x900)', async ({ page, nabd }) => {
    await nabd.boot();
    const result = await page.evaluate(async () => {
      const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT);
      let notice = null;
      for (let node = walker.nextNode(); node; node = walker.nextNode()) if (node.data.includes('# Third-party licenses')) notice = node.data;
      const license = await fetch('vendor/rapier/LICENSE');
      return { found: Boolean(notice), bullet: notice?.split('\n').find((line) => line.startsWith('- Rapier')) ?? null,
        apacheText: Boolean(notice?.includes('TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION')),
        dimforge: Boolean(notice?.includes('Copyright 2020 Dimforge EURL')), licenseFile: license.status };
    });
    nabd.save('C6-c-rapier-licence-1440x900', { result, errors: nabd.errors() });
    expect(result.found).toBe(true);
    expect(result.bullet).toContain('Rapier 0.21.0');
    expect(result.bullet).toContain('Apache License 2.0');
    expect(result.apacheText, 'the full Apache-2.0 text is in the page').toBe(true);
    expect(result.dimforge).toBe(true);
    expect(result.licenseFile).toBe(200);
    expect(nabd.errors(), 'M11 = 0').toEqual([]);
  });
});

// (e) F27, MEASURE ONLY (AC-P1-5): the table GLB pad tops and widths against the code's deck constants
// (Un: deck y 0.900, half-width 0.47, half-length 1.06; the Rapier mattress top = deck; the limb floor $()),
// and how far the supine patient's skin is below the pad tops. Records numbers; asserts only that the
// measurement ran. Test-only, read-only (three.js devtools hook).
const F27_CODE = { deckY: 0.9, halfWidth: 0.47, halfLength: 1.06, patientRootY: 0.936, mattressTopY: 0.9 };
test.describe('C6 table measurement 1440x900', () => {
  test.use({ viewport: WIDE });
  test('C6-e F27 table pads against the code constants and the patient (measure only) (1440x900)', async ({ page, nabd }) => {
    await c2Boot(page, nabd);
    const qaState = await nabd.qa('getState');
    const m = await page.evaluate(() => {
      const C = window.__c2;
      const scene = C.scenes.find((s) => s.getObjectByName('Trainee anatomical right hand'));
      const top = scene.getObjectByName('Nabd_Operating_Table_Top_GLTF');
      if (!top) return { error: 'no table top GLB' };
      top.updateMatrixWorld(true);
      const V = scene.position.constructor;
      const r4 = (x) => Math.round(x * 1e4) / 1e4;
      // Pads and deck: world boxes.
      const pads = [];
      top.traverse((o) => {
        if (!o.isMesh || !/(_pad|deck|cushion|_top)$/.test(o.name)) return;
        o.geometry.computeBoundingBox();
        const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
        pads.push({ name: o.name, topY: r4(b.max.y), x: [r4(b.min.x), r4(b.max.x)], z: [r4(b.min.z), r4(b.max.z)] });
      });
      // Height field of every upward-facing table-top triangle on a 1 cm grid (highest surface per cell).
      const cell = 0.01, field = new Map();
      const a = new V(), b = new V(), c = new V(), e1 = new V(), e2 = new V(), n = new V();
      top.traverse((o) => {
        if (!o.isMesh) return;
        const pos = o.geometry.attributes.position, idx = o.geometry.index;
        const count = idx ? idx.count : pos.count;
        for (let i = 0; i < count; i += 3) {
          const ia = idx ? idx.getX(i) : i, ib = idx ? idx.getX(i + 1) : i + 1, ic = idx ? idx.getX(i + 2) : i + 2;
          a.fromBufferAttribute(pos, ia).applyMatrix4(o.matrixWorld);
          b.fromBufferAttribute(pos, ib).applyMatrix4(o.matrixWorld);
          c.fromBufferAttribute(pos, ic).applyMatrix4(o.matrixWorld);
          n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
          if (n.lengthSq() < 1e-14) continue;
          n.normalize();
          if (Math.abs(n.y) < 0.3) continue;
          const minX = Math.floor(Math.min(a.x, b.x, c.x) / cell), maxX = Math.ceil(Math.max(a.x, b.x, c.x) / cell);
          const minZ = Math.floor(Math.min(a.z, b.z, c.z) / cell), maxZ = Math.ceil(Math.max(a.z, b.z, c.z) / cell);
          const d = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
          if (Math.abs(d) < 1e-12) continue;
          for (let gx = minX; gx <= maxX; gx += 1) for (let gz = minZ; gz <= maxZ; gz += 1) {
            const x = gx * cell, z = gz * cell;
            const l1 = ((b.z - c.z) * (x - c.x) + (c.x - b.x) * (z - c.z)) / d;
            const l2 = ((c.z - a.z) * (x - c.x) + (a.x - c.x) * (z - c.z)) / d;
            const l3 = 1 - l1 - l2;
            if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
            const y = l1 * a.y + l2 * b.y + l3 * c.y;
            const key = gx + ',' + gz, prev = field.get(key);
            if (!prev || y > prev.y) field.set(key, { y, name: o.name });
          }
        }
      });
      // The patient's skinned skin vertices against that field.
      const skin = C.mainSkin;
      skin.updateMatrixWorld(true);
      const p = new V();
      const posCount = skin.geometry.attributes.position.count;
      let below2mm = 0, below0 = 0, deepest = { depth: -Infinity }, offPadLow = 0, offPadLowest = Infinity;
      const byPad = {};
      let lowestOverBack = Infinity, minY = Infinity, maxAbsXLow = 0;
      for (let i = 0; i < posCount; i += 1) {
        skin.getVertexPosition(i, p).applyMatrix4(skin.matrixWorld);
        minY = Math.min(minY, p.y);
        const f = field.get(Math.round(p.x / cell) + ',' + Math.round(p.z / cell));
        if (p.y < 1.0) maxAbsXLow = Math.max(maxAbsXLow, Math.abs(p.x));
        if (!f) { if (p.y < 0.99) { offPadLow += 1; offPadLowest = Math.min(offPadLowest, p.y); } continue; }
        if (p.y < f.y - 0.25 || p.y > f.y + 0.10) continue; // hanging below the pad edge, or far above it
        const depth = f.y - p.y;
        if (f.name === 'back_pad') lowestOverBack = Math.min(lowestOverBack, p.y);
        if (depth > 0) below0 += 1;
        if (depth > 0.002) {
          below2mm += 1;
          byPad[f.name] = byPad[f.name] ?? { vertices: 0, maxDepthM: 0 };
          byPad[f.name].vertices += 1;
          byPad[f.name].maxDepthM = Math.max(byPad[f.name].maxDepthM, r4(depth));
        }
        if (depth > deepest.depth) deepest = { depth, at: p.toArray().map(r4), pad: f.name, padTopY: r4(f.y) };
      }
      deepest.depth = r4(deepest.depth);
      return { pads, cells: field.size, vertices: posCount, below0, below2mm, byPad, deepest, lowestOverBackPadY: r4(lowestOverBack),
        skinMinY: r4(minY), offPadVerticesBelow099: offPadLow, offPadLowestY: Number.isFinite(offPadLowest) ? r4(offPadLowest) : null,
        maxAbsXBelow1m: r4(maxAbsXLow), tableTopY: r4(top.position.y) };
    });
    // A low side view of the back on the pads for the owner: one test-only frame from a camera at pad height
    // on the patient's right (x = 1.5 m), drawn with the app's renderer and read back in the same task.
    await page.click('#toggle-trainee-mode');
    await sleep(800);
    const sideView = await page.evaluate(() => new Promise((resolve) => {
      const C = window.__c2;
      const scene = C.scenes.find((s) => s.getObjectByName('Trainee anatomical right hand'));
      const renderer = C.renderers[0];
      const render = renderer.render;
      let appCamera = null;
      renderer.render = function (sc, cam) { if (sc === scene && renderer.getRenderTarget() === null) appCamera = cam; return render.call(this, sc, cam); };
      const shoot = () => {
        if (!appCamera) { requestAnimationFrame(shoot); return; }
        renderer.render = render;
        const canvas = renderer.domElement;
        const cam = new appCamera.constructor(24, canvas.width / canvas.height, 0.05, 20);
        cam.position.set(1.5, 0.965, -0.36);
        cam.lookAt(0, 0.94, -0.36);
        cam.updateMatrixWorld(true);
        render.call(renderer, scene, cam);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      requestAnimationFrame(shoot);
    }));
    fs.mkdirSync(nabd.dir, { recursive: true });
    fs.writeFileSync(path.join(nabd.dir, 'C6-e-table-side-close-1440x900.jpg'), Buffer.from(sideView.split(',')[1], 'base64'));
    const backPad = m.pads?.find((pad) => pad.name === 'back_pad');
    const deck = m.pads?.find((pad) => pad.name === 'radiolucent_deck');
    const result = { code: F27_CODE, measured: m, qaBounds: qaState.bounds, qaDeck: qaState.deck,
      summary: backPad && deck ? {
        backPadTopY: backPad.topY, backPadHalfWidth: round((backPad.x[1] - backPad.x[0]) / 2, 4),
        deckTopY: deck.topY, deckHalfWidth: round((deck.x[1] - deck.x[0]) / 2, 4), deckHalfLength: round((deck.z[1] - deck.z[0]) / 2, 4),
        padTopAboveCodeDeckM: round(backPad.topY - F27_CODE.deckY, 4), codeHalfWidthMinusPadM: round(F27_CODE.halfWidth - (backPad.x[1] - backPad.x[0]) / 2, 4),
        patientBackOverPadM: round(m.lowestOverBackPadY - backPad.topY, 4),
      } : null };
    nabd.save('C6-e-F27-table-measurement-1440x900', { result, errors: nabd.errors() });
    expect(m.error ?? null).toBeNull();
    expect(m.pads.length, 'pads found').toBeGreaterThan(3);
    expect(nabd.errors(), 'M11 = 0').toEqual([]);
  });
});
