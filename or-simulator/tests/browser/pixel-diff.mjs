// Exact pixel comparison of the visual baselines V1–V4 between a base commit and the working tree
// (13_VISUAL_QUALITY_PLAN.md: "V1–V4 pixel diff 0" for every change that must not alter the picture).
// Not a Playwright test (not collected by `playwright test` or `node --test`); run it directly:
//
//   node tests/browser/pixel-diff.mjs --base <git ref> [--browser chrome|edge|webkit] [--views V1,V2,V3,V4]
//        [--size 1440x900] [--port 4301] [--entry "/?qa"] [--repeat 2] [--out <dir>] [--label <name>]
//
// How it stays exact. Two loads of the same tree differ only where the app animates on its own clock: the
// vitals monitor (a sine) and the ?debug=1 overlay text. With prefers-reduced-motion the monitor draws once
// and stops (MonitorUI.js update), and without debug=1 there is no overlay, so two loads of one tree give
// bit-identical canvases (checked on every run: repeat ≥ 2 compares each tree with itself). Nothing is
// masked. Two pictures are compared per view:
//  * rendered: one frame drawn through the app's renderer, scene and camera (three.js devtools hook) and read
//    back from the canvas in the same task. This is the renderer's output and the gate. It also works where
//    Playwright WebKit on Windows screenshots the drill view (V2) as a blank canvas;
//  * page: the page screenshot cropped to the canvas box (what the trainee sees, DOM overlays included).
// The base tree comes from `git archive <ref>` into the system temp folder and is served by its own
// scripts/serve.mjs on port+1; the working tree is served on port. Both servers are stopped at the end.
//
// Output: <out>/<label>.json with, per view and picture, base-vs-work and each tree's self-comparison (pixelDiff
// from render-metrics.mjs: differing pixels, largest channel delta, bounding box of the differences).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from '@playwright/test';
import { decodePng, pixelDiff, lumaStats as luma, RENDER_HOOK, readCanvas } from './render-metrics.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > 0 ? process.argv[index + 1] : fallback;
};
const BASE_REF = arg('base', 'HEAD');
const BROWSER = arg('browser', 'chrome');
const VIEWS = arg('views', 'V1,V2,V3,V4').split(',');
const [WIDTH, HEIGHT] = arg('size', '1440x900').split('x').map(Number);
const PORT = Number(arg('port', 4301));
const ENTRY = arg('entry', '/?qa');
const REPEAT = Math.max(1, Number(arg('repeat', 2)));
const OUT = path.resolve(arg('out', path.join(os.tmpdir(), 'nabd-pixel-diff')));
const LABEL = arg('label', `pixel-diff-${BROWSER}-${WIDTH}x${HEIGHT}`);
const QA = new URLSearchParams(ENTRY.split('?')[1] ?? '').has('qa');
const TIMING_ARGS = ['--disable-renderer-backgrounding', '--disable-background-timer-throttling',
  '--disable-features=CalculateNativeWinOcclusion'];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

// The base tree, exported once per commit.
const baseSha = git('rev-parse', `${BASE_REF}^{commit}`);
const baseDir = path.join(os.tmpdir(), `nabd-tree-${baseSha.slice(0, 12)}`);
if (!fs.existsSync(path.join(baseDir, 'scripts', 'serve.mjs'))) {
  fs.mkdirSync(baseDir, { recursive: true });
  const tar = `nabd-tree-${baseSha.slice(0, 12)}.tar`;
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(os.tmpdir(), tar), baseSha], { cwd: root });
  // Relative names: GNU tar (Git for Windows) reads "C:\..." as a remote host, bsdtar does not care.
  execFileSync('tar', ['-xf', tar, '-C', path.basename(baseDir)], { cwd: os.tmpdir() });
  fs.rmSync(path.join(os.tmpdir(), tar));
}
const trees = [
  { name: 'base', root: baseDir, port: PORT + 1 },
  { name: 'work', root, port: PORT },
];

async function waitQA(page, fn, timeout = 25_000) {
  await page.waitForFunction(fn, null, { timeout, polling: 100 });
}

// Same steps as smoke.spec.mjs V1–V4 and perf-capture.mjs setupView.
async function setupView(page, view) {
  if (view === 'V2') {
    await page.click('#forearm-practice');
    if (QA) await waitQA(page, () => { const s = window.__studioQA.getSimulationState(); return s.forearm && s.abdomen.ready && !window.__studioQA.workMoving(); });
    else await sleep(4000);
    await sleep(800);
    await page.click('[data-work-approach="-1"]');
  } else if (view === 'V3') {
    await page.click('#toggle-trainee-mode');
    await sleep(500);
    await page.click('#camera-room');
    await sleep(900);
  } else if (view === 'V4') {
    await page.click('#anatomy-toggle');
    if (QA) await waitQA(page, () => window.__studioQA.getSimulationState().anatomy?.active === true);
    else await sleep(2000);
    await sleep(500);
    await page.click('#anatomy-reset');
    await sleep(900);
  }
  if (QA) {
    await waitQA(page, () => !window.__studioQA.workMoving());
    // Camera steady: two reads 250 ms apart (SMOKE_PROTOCOL §4).
    let previous = await page.evaluate(() => window.__studioQA.getCamera());
    for (let k = 0; k < 40; k += 1) {
      await sleep(250);
      const current = await page.evaluate(() => window.__studioQA.getCamera());
      if (current.every((v, i) => Math.abs(v - previous[i]) < 1e-4)) break;
      previous = current;
    }
  } else await sleep(3000);
  await sleep(2000);
}

async function capture(browser, tree, view) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, locale: 'en-US', reducedMotion: 'reduce' });
    await context.addInitScript(RENDER_HOOK);
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${String(e?.message ?? e).slice(0, 300)}`));
    try {
      await page.goto(`http://127.0.0.1:${tree.port}${ENTRY}`, { waitUntil: 'load' });
      await page.locator('#model-status[data-state="ready"]').waitFor({ state: 'attached', timeout: 60_000 });
      if (QA) await page.waitForFunction(() => Boolean(window.__studioQA), null, { timeout: 10_000 });
      await setupView(page, view);
      const box = await page.locator('#viewport canvas').first().boundingBox();
      const png = await page.screenshot({ type: 'png' });
      const rendered = await readCanvas(page);
      const readout = QA ? await page.evaluate(() => window.__studioQA.getSimulationState().render ?? null) : null;
      await context.close();
      return { img: decodePng(png), png, rendered, box, errors, attempt, readout };
    } catch (error) {
      await context.close().catch(() => {});
      if (attempt === 2) throw error;
      console.log(`${tree.name} ${view}: attempt ${attempt} failed (${String(error?.message ?? error).split('\n')[0]}); retrying`);
    }
  }
  return null;
}

const servers = trees.map((t) => spawn(process.execPath, [path.join(t.root, 'scripts', 'serve.mjs')],
  { env: { ...process.env, PORT: String(t.port) }, stdio: 'ignore' }));
await sleep(900);
const result = { label: LABEL, startedAt: new Date().toISOString(), browserKind: BROWSER, viewport: `${WIDTH}x${HEIGHT}`, entry: ENTRY,
  reducedMotion: 'reduce', repeat: REPEAT, base: { ref: BASE_REF, sha: baseSha },
  work: { head: git('rev-parse', 'HEAD'), dirtyFiles: git('status', '--porcelain').split('\n').filter(Boolean) },
  method: 'rendered = canvas readback of one frame through the app renderer (the gate); page = PNG screenshot cropped to the canvas box; '
    + 'every R, G, B byte compared; no mask', views: {} };
let browser;
try {
  browser = BROWSER === 'webkit' ? await webkit.launch({ headless: true })
    : await chromium.launch({ channel: BROWSER === 'edge' ? 'msedge' : 'chrome', headless: true, args: TIMING_ARGS });
  result.browserVersion = browser.version();
  fs.mkdirSync(OUT, { recursive: true });
  for (const view of VIEWS) {
    const shots = { base: [], work: [] };
    for (let k = 0; k < REPEAT; k += 1) {
      for (const tree of trees) shots[tree.name].push(await capture(browser, tree, view));
    }
    const box = shots.work[0].box;
    const rect = [box.x, box.y, box.x + box.width, box.y + box.height];
    const brief = (d) => ({ pixels: d.pixels, differing: d.differing, differingPct: d.differingPct, maxChannelDelta: d.maxChannelDelta, differingBox: d.differingBox });
    const entry = {
      canvas: { x: box.x, y: box.y, width: box.width, height: box.height },
      renderedSize: { base: [shots.base[0].rendered.width, shots.base[0].rendered.height], work: [shots.work[0].rendered.width, shots.work[0].rendered.height] },
      baseVsWork: brief(pixelDiff(shots.base[0].rendered, shots.work[0].rendered)),
      baseVsBase: REPEAT > 1 ? brief(pixelDiff(shots.base[0].rendered, shots.base[1].rendered)) : null,
      workVsWork: REPEAT > 1 ? brief(pixelDiff(shots.work[0].rendered, shots.work[1].rendered)) : null,
      page: {
        baseVsWork: brief(pixelDiff(shots.base[0].img, shots.work[0].img, rect)),
        baseVsBase: REPEAT > 1 ? brief(pixelDiff(shots.base[0].img, shots.base[1].img, rect)) : null,
        workVsWork: REPEAT > 1 ? brief(pixelDiff(shots.work[0].img, shots.work[1].img, rect)) : null,
        canvasLumaSd: luma(shots.work[0].img, rect).sdLuma,
      },
      renderedLumaSd: luma(shots.work[0].rendered, [0, 0, shots.work[0].rendered.width, shots.work[0].rendered.height]).sdLuma,
      consoleErrors: { base: shots.base.map((s) => s.errors), work: shots.work.map((s) => s.errors) },
      attempts: { base: shots.base.map((s) => s.attempt), work: shots.work.map((s) => s.attempt) },
      readout: { base: shots.base[0].readout, work: shots.work[0].readout },
    };
    if (entry.baseVsWork.differing > 0 || entry.page.baseVsWork.differing > 0) {
      for (const name of ['base', 'work']) fs.writeFileSync(path.join(OUT, `${LABEL}-${view}-${name}.png`), shots[name][0].png);
      entry.images = [`${LABEL}-${view}-base.png`, `${LABEL}-${view}-work.png`];
    }
    result.views[view] = entry;
    console.log(`${LABEL} ${view}: rendered base vs work ${entry.baseVsWork.differing} differing pixels (max delta ${entry.baseVsWork.maxChannelDelta}); ` +
      `base vs base ${entry.baseVsBase?.differing ?? '-'}; work vs work ${entry.workVsWork?.differing ?? '-'}; page base vs work ${entry.page.baseVsWork.differing}; ` +
      `luma sd rendered ${entry.renderedLumaSd}, page ${entry.page.canvasLumaSd}`);
  }
} catch (error) {
  result.fatal = String(error?.stack ?? error).slice(0, 2000);
  console.error(result.fatal);
} finally {
  await browser?.close().catch(() => {});
  for (const server of servers) server.kill();
}
result.finishedAt = new Date().toISOString();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, `${LABEL}.json`), JSON.stringify(result, null, 2));
console.log(`wrote ${path.join(OUT, `${LABEL}.json`)}`);
process.exitCode = result.fatal || Object.values(result.views).some((v) => v.baseVsWork.differing > 0 || v.page.baseVsWork.differing > 0) ? 1 : 0;
