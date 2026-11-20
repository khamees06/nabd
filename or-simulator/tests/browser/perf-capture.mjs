// Performance capture for Nabd v1.5 per docs/improvement-plan/09_ACCEPTANCE_AND_VALIDATION_PLAN.md §2.4.
// Not a Playwright test (not collected by `playwright test` or `node --test`); run it directly:
//
//   node tests/browser/perf-capture.mjs --browser chrome   (headed installed Chrome, timing args)
//   node tests/browser/perf-capture.mjs --browser webkit --runs 1 --loads 0   (WebKit on Windows, headless)
//
// Options: --port 4301 --runs 3 --settle 10 --idle 30 --active 30 --hover 30 --loads 3 --views V1,V2,V3,V4
//          --out <dir> --label <name> --gpu 1   (--hover 0 skips the hover segment; --gpu 1 loads ?qa&debug=1&gpu=1,
//          which times each canvas frame, shadow pass + main pass, on the GPU where EXT_disjoint_timer_query_webgl2 exists)
//
// Read-only with respect to the app. An init script adds measurement probes only:
//  * its own requestAnimationFrame loop that records frame timestamps (M7: rAF interval);
//  * a counter on WebGL clear() calls, so frames in which the app rendered can be told apart from
//    frames in which it did not (render rate; the ?debug=1 overlay FPS is the rAF rate, 09 §2.4);
//  * a 5 ms poll for #model-status[data-state="ready"] and an enabled #forearm-practice (M10).
// M8/M9 come from the ?debug=1 overlay, sampled once per second. Since Q1 the same sample also reads the
// ?qa render readout (__studioQA.getRenderStats): the shadow pass's draw calls and triangles, which the overlay
// never counted, the light-map redraws per second and, with --gpu 1, the GPU time of each canvas frame (shadow pass + main pass).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > 0 ? process.argv[index + 1] : fallback;
};
const BROWSER = arg('browser', 'chrome');
const PORT = Number(arg('port', 4301));
const RUNS = Number(arg('runs', 3));
const SETTLE_S = Number(arg('settle', 10));
const IDLE_S = Number(arg('idle', 30));
const ACTIVE_S = Number(arg('active', 30));
const HOVER_S = Number(arg('hover', 30));
const LOADS = Number(arg('loads', 3));
const OUT = path.resolve(arg('out', path.join(root, 'docs/improvement-plan/evidence/baseline-p0/perf')));
const LABEL = arg('label', BROWSER === 'chrome' ? 'chrome-headed' : 'webkit-on-windows-headless');
const VIEWS = (arg('views', 'V1,V2,V3,V4')).split(',');
const GPU = arg('gpu', '0') === '1';
const BASE = `http://127.0.0.1:${PORT}`;
const ENTRY = `${BASE}/?qa&debug=1${GPU ? '&gpu=1' : ''}`;
const TIMING_ARGS = ['--disable-renderer-backgrounding', '--disable-background-timer-throttling',
  '--disable-features=CalculateNativeWinOcclusion', '--window-position=0,0'];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PROBE = () => {
  const P = window.__nabdPerf = { recording: false, frames: [], renders: [], clears: 0, readyAt: null, forearmAt: null, overlay: [] };
  const raf = window.requestAnimationFrame.bind(window);
  let lastClears = 0;
  const loop = (ts) => {
    if (P.recording) { P.frames.push(ts); P.renders.push(P.clears - lastClears); }
    lastClears = P.clears;
    raf(loop);
  };
  raf(loop);
  for (const Ctx of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
    if (!Ctx) continue;
    const clear = Ctx.prototype.clear;
    Ctx.prototype.clear = function patchedClear(mask) { P.clears += 1; return clear.call(this, mask); };
  }
  const poll = setInterval(() => {
    const status = document.getElementById('model-status');
    if (P.readyAt === null && status?.dataset.state === 'ready') P.readyAt = performance.now();
    const forearm = document.getElementById('forearm-practice');
    if (P.forearmAt === null && forearm && !forearm.disabled) P.forearmAt = performance.now();
    if (P.readyAt !== null && P.forearmAt !== null) clearInterval(poll);
  }, 5);
  const readOverlay = () => {
    const q = (k) => document.querySelector(`.nabd-diagnostics [data-metric="${k}"]`)?.textContent ?? null;
    const r = window.__studioQA?.getRenderStats?.() ?? null;
    return { t: performance.now(), fps: q('fps'), frame: q('frame'), draw: q('draw'), triangles: q('triangles'),
      render: r && { calls: r.calls, tris: r.tris, shadowCalls: r.shadowCalls, shadowTris: r.shadowTris, shadowUpdates: r.shadowUpdates,
        frames: r.frames, programs: r.programs, gpuMs: r.gpuMs } };
  };
  P.start = () => {
    P.frames = []; P.renders = []; P.overlay = [readOverlay()]; P.recording = true;
    P.visibility = [{ t: performance.now(), state: document.visibilityState, focus: document.hasFocus() }];
    P.timer = setInterval(() => P.overlay.push(readOverlay()), 1000);
  };
  P.stop = () => {
    P.recording = false;
    clearInterval(P.timer);
    P.visibility.push({ t: performance.now(), state: document.visibilityState, focus: document.hasFocus() });
    return { frames: P.frames, renders: P.renders, overlay: P.overlay, visibility: P.visibility };
  };
};

const quantile = (sorted, q) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1) + 0.5))] : null;
const round = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v) ? null : Number(v.toFixed(d)));
const num = (text) => (text ? Number(String(text).replace(/[^0-9.]/g, '')) : null);
// The ?qa render readout sampled with the overlay (Q1): per-frame values as min/median/max, cumulative
// counters as rates over the segment.
function renderSummary(overlay) {
  const samples = overlay.map((o) => o.render).filter(Boolean);
  if (samples.length < 2) return null;
  const stat = (key) => { const v = samples.map((s) => s[key]).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
    return v.length ? { min: v[0], median: quantile(v, 0.5), max: v.at(-1) } : null; };
  const spanS = (overlay.at(-1).t - overlay.find((o) => o.render).t) / 1000;
  const first = samples[0], last = samples.at(-1);
  return { samples: samples.length, calls: stat('calls'), tris: stat('tris'), shadowCalls: stat('shadowCalls'), shadowTris: stat('shadowTris'),
    programs: stat('programs'), gpuMs: stat('gpuMs'),
    appRendersPerS: round((last.frames - first.frames) / (spanS || 1), 1), shadowUpdatesPerS: round((last.shadowUpdates - first.shadowUpdates) / (spanS || 1), 1) };
}
function summarise({ frames, renders, overlay, visibility }) {
  const intervals = frames.slice(1).map((t, i) => t - frames[i]);
  const sorted = [...intervals].sort((a, b) => a - b);
  const durationS = frames.length > 1 ? (frames.at(-1) - frames[0]) / 1000 : 0;
  const rendered = renders.slice(1).filter((n) => n > 0).length;
  const stat = (values) => { const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
    return v.length ? { min: v[0], median: quantile(v, 0.5), max: v.at(-1) } : null; };
  return {
    durationS: round(durationS, 2), frames: frames.length,
    M7_rafIntervalMs: { median: round(quantile(sorted, 0.5)), p95: round(quantile(sorted, 0.95)), p99: round(quantile(sorted, 0.99)),
      max: round(sorted.at(-1)), mean: round(intervals.reduce((a, b) => a + b, 0) / (intervals.length || 1)) },
    rafFps: round((frames.length - 1) / (durationS || 1), 1),
    renderedFrames: rendered, renderRateFps: round(rendered / (durationS || 1), 1),
    framesOver33ms: intervals.filter((x) => x > 33.34).length, framesOver50ms: intervals.filter((x) => x > 50).length,
    overlay: {
      M8_drawCalls: stat(overlay.map((o) => num(o.draw))), M9_triangles: stat(overlay.map((o) => num(o.triangles))),
      overlayFps: stat(overlay.map((o) => num(o.fps))), overlayFrameMs: stat(overlay.map((o) => num(o.frame))),
    },
    render: renderSummary(overlay),
    visibility,
    rawIntervalsMs: intervals.map((x) => round(x, 2)),
  };
}

async function canvasCenter(page) {
  const box = await page.locator('#viewport canvas').first().boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

async function waitQA(page, fn, arg, timeout = 25_000) {
  await page.waitForFunction(fn, arg, { timeout, polling: 100 });
}

async function setupView(page, view) {
  if (view === 'V2') {
    await page.click('#forearm-practice');
    await waitQA(page, () => { const s = window.__studioQA.getSimulationState(); return s.forearm && s.abdomen.ready && !window.__studioQA.workMoving(); });
    await sleep(800);
    await page.click('[data-work-approach="-1"]');
    await waitQA(page, () => !window.__studioQA.workMoving());
  } else if (view === 'V3') {
    await page.click('#toggle-trainee-mode');
    await sleep(500);
    await page.click('#camera-room');
  } else if (view === 'V4') {
    await page.click('#anatomy-toggle');
    await waitQA(page, () => window.__studioQA.getSimulationState().anatomy?.active === true);
    await sleep(500);
    await page.click('#anatomy-reset');
  }
  await waitQA(page, () => !window.__studioQA.workMoving());
}

// Continuous input that forces a render every frame (09 §2.4 "active" segment).
async function activeInput(page, view, seconds) {
  const { x: cx, y: cy } = await canvasCenter(page);
  const end = Date.now() + seconds * 1000;
  const t0 = Date.now();
  let moves = 0;
  let mode;
  if (view === 'V1') {
    mode = 'look: right-button drag on the canvas';
    await page.mouse.move(cx, cy);
    await page.mouse.down({ button: 'right' });
    while (Date.now() < end) {
      const t = (Date.now() - t0) / 1000;
      await page.mouse.move(cx + 140 * Math.sin(2 * Math.PI * t / 4), cy + 45 * Math.sin(2 * Math.PI * t / 3));
      moves += 1;
      await sleep(4);
    }
    await page.mouse.up({ button: 'right' });
  } else if (view === 'V2') {
    mode = 'lift: forearm grip held, pointer moved up and down';
    const wrist = await page.evaluate(() => window.__studioQA.getSimulationState().practice.wrist);
    // The first click sometimes stalls short of the wrist (see SMOKE_PROTOCOL S2); retry like a trainee.
    let gripAttempts = 0;
    for (; gripAttempts < 3; gripAttempts += 1) {
      await page.mouse.click(wrist.x, wrist.y);
      const ok = await page.waitForFunction(() => window.__studioQA.getSimulationState().forearm?.state === 'gripped'
        || document.getElementById('trainee-status').textContent.includes('خارج مدى'), null, { timeout: 6_000, polling: 100 })
        .then(() => page.evaluate(() => window.__studioQA.getSimulationState().forearm?.state === 'gripped'), () => false);
      if (ok) break;
      await sleep(600);
    }
    mode = `lift: forearm grip held (grip on attempt ${gripAttempts + 1}), pointer moved up and down`;
    await waitQA(page, () => window.__studioQA.getSimulationState().forearm?.state === 'gripped', null, 2_000);
    let last = { x: wrist.x, y: wrist.y };
    while (Date.now() < end) {
      const t = (Date.now() - t0) / 1000;
      last = { x: wrist.x, y: wrist.y - 55 - 45 * Math.sin(2 * Math.PI * t / 3) };
      await page.mouse.move(last.x, last.y);
      moves += 1;
      await sleep(4);
    }
    await page.mouse.down();
    await page.mouse.up();
  } else {
    mode = 'orbit: left-button drag on the canvas';
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    while (Date.now() < end) {
      const t = (Date.now() - t0) / 1000;
      await page.mouse.move(cx + 160 * Math.sin(2 * Math.PI * t / 5), cy + 35 * Math.sin(2 * Math.PI * t / 4));
      moves += 1;
      await sleep(4);
    }
    await page.mouse.up();
  }
  return { mode, pointerMoves: moves };
}

// Hover segment (09 §2.4, PR-10): continuous pointer movement with no button pressed, across the patient
// and the room. Every move runs the app's hover pick (cursor and target hints), the worst everyday input
// found in P0 (P0-unknowns U7, PR-1); the rendering it causes is whatever the app does on hover.
async function hoverInput(page, seconds) {
  const { x: cx, y: cy, box } = await canvasCenter(page);
  const end = Date.now() + seconds * 1000;
  const t0 = Date.now();
  let moves = 0;
  await page.mouse.move(cx, cy);
  while (Date.now() < end) {
    const t = (Date.now() - t0) / 1000;
    await page.mouse.move(cx + 0.42 * box.width * Math.sin(2 * Math.PI * t / 6), cy + 0.36 * box.height * Math.sin(2 * Math.PI * t / 4.3));
    moves += 1;
    await sleep(4);
  }
  return { mode: 'hover: no button, Lissajous across 84 % × 72 % of the canvas (patient and room)', pointerMoves: moves };
}

function systemInfo() {
  const info = { node: process.version, platform: process.platform, release: os.release(), cpu: os.cpus()[0]?.model,
    logicalCpus: os.cpus().length, totalMemGB: round(os.totalmem() / 2 ** 30, 1) };
  try {
    const ps = execFileSync('powershell', ['-NoProfile', '-Command',
      'Get-CimInstance Win32_VideoController | Select-Object Name,DriverVersion,CurrentRefreshRate,CurrentHorizontalResolution,CurrentVerticalResolution | ConvertTo-Json -Compress; ' +
      '(Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber | ConvertTo-Json -Compress); ' +
      '(Get-CimInstance Win32_Battery | Select-Object BatteryStatus,EstimatedChargeRemaining | ConvertTo-Json -Compress); ' +
      '(Get-CimInstance Win32_ComputerSystem | Select-Object Manufacturer,Model | ConvertTo-Json -Compress)'], { encoding: 'utf8', timeout: 30_000 });
    const [video, osInfo, battery, system] = ps.trim().split(/\r?\n/).map((line) => { try { return JSON.parse(line); } catch { return line; } });
    Object.assign(info, { video, os: osInfo, battery, system,
      powerNote: 'Win32_Battery.BatteryStatus 2 = on AC power (mains)' });
  } catch (error) { info.powershellError = String(error.message).slice(0, 200); }
  return info;
}

async function pageInfo(page) {
  return page.evaluate(() => {
    const g = document.createElement('canvas').getContext('webgl2');
    const d = g?.getExtension('WEBGL_debug_renderer_info');
    return {
      gpu: g ? (d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)) : 'NO WEBGL2',
      gpuVendor: g && d ? g.getParameter(d.UNMASKED_VENDOR_WEBGL) : null,
      userAgent: navigator.userAgent, viewport: { width: innerWidth, height: innerHeight }, devicePixelRatio,
      screen: { width: screen.width, height: screen.height, availWidth: screen.availWidth, availHeight: screen.availHeight },
      window: { outerWidth, outerHeight, screenX, screenY },
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      visibility: document.visibilityState, hasFocus: document.hasFocus(),
    };
  });
}

async function launch() {
  if (BROWSER === 'webkit') return webkit.launch({ headless: true });
  return chromium.launch({ channel: BROWSER === 'edge' ? 'msedge' : 'chrome', headless: false, args: TIMING_ARGS });
}

async function newPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
  await context.addInitScript(PROBE);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${String(e.message).slice(0, 300)}`));
  return { context, page, errors };
}

async function loadOnce(page) {
  const started = Date.now();
  await page.goto(ENTRY, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.__nabdPerf?.readyAt !== null && window.__nabdPerf?.forearmAt !== null, null, { timeout: 120_000, polling: 50 });
  return page.evaluate((wallMs) => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    return {
      M10_readyMs: Math.round(window.__nabdPerf.readyAt), M10_forearmEnabledMs: Math.round(window.__nabdPerf.forearmAt),
      domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null, loadEventMs: nav ? Math.round(nav.loadEventEnd) : null,
      resources: resources.length, transferKB: Math.round(resources.reduce((a, r) => a + (r.transferSize || 0), 0) / 1024),
      wallClockToReadyDetectedMs: Date.now() - wallMs,
    };
  }, started);
}

const server = spawn(process.execPath, [path.join(root, 'scripts/serve.mjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'pipe' });
await sleep(900);
const result = { label: LABEL, browserKind: BROWSER, startedAt: new Date().toISOString(),
  protocol: { runs: RUNS, settleS: SETTLE_S, idleS: IDLE_S, activeS: ACTIVE_S, hoverS: HOVER_S, loads: LOADS, views: VIEWS, entry: ENTRY.replace(BASE, ''),
    server: `node scripts/serve.mjs (PORT=${PORT})`, launchArgs: BROWSER === 'webkit' ? [] : TIMING_ARGS,
    headed: BROWSER !== 'webkit', viewport: '1440x900' },
  system: systemInfo(), loads: { cold: [], warm: [] }, runs: [] };
let browser;
try {
  browser = await launch();
  result.browserVersion = browser.version();
  if (BROWSER === 'webkit') result.note = 'Playwright WebKit on Windows (headless): an approximation of Safari\'s engine, not Safari (U21, AS15).';

  // M10: cold loads (fresh context each: empty HTTP cache) and warm loads (reload in one context).
  for (let i = 0; i < LOADS; i += 1) {
    const { context, page, errors } = await newPage(browser);
    result.loads.cold.push({ ...(await loadOnce(page)), consoleErrors: errors.length });
    if (i === 0) result.page = await pageInfo(page);
    await context.close();
  }
  if (LOADS > 0) {
    const { context, page, errors } = await newPage(browser);
    await loadOnce(page);
    for (let i = 0; i < LOADS; i += 1) result.loads.warm.push({ ...(await loadOnce(page)), consoleErrors: errors.length });
    await context.close();
  }

  result.failedAttempts = [];
  for (let run = 1; run <= RUNS; run += 1) {
    for (const view of VIEWS) {
     for (let attempt = 1; attempt <= 2; attempt += 1) {
      const { context, page, errors } = await newPage(browser);
      try {
      const load = await Promise.race([loadOnce(page),
        sleep(90_000).then(() => { throw new Error('ready not reached within 90 s'); })]);
      if (!result.page) result.page = await pageInfo(page);
      await page.bringToFront();
      await setupView(page, view);
      await sleep(SETTLE_S * 1000);
      await page.evaluate(() => window.__nabdPerf.start());
      await sleep(IDLE_S * 1000);
      const idle = summarise(await page.evaluate(() => window.__nabdPerf.stop()));
      await page.evaluate(() => window.__nabdPerf.start());
      const input = await activeInput(page, view, ACTIVE_S);
      const active = summarise(await page.evaluate(() => window.__nabdPerf.stop()));
      let hover = null;
      if (HOVER_S > 0) {
        await sleep(1000);
        await page.evaluate(() => window.__nabdPerf.start());
        const hoverMoves = await hoverInput(page, HOVER_S);
        hover = { ...summarise(await page.evaluate(() => window.__nabdPerf.stop())), input: hoverMoves };
      }
      const entry = { run, view, load, idle, active: { ...active, input }, hover, consoleErrors: errors };
      result.runs.push(entry);
      console.log(`${LABEL} run ${run} ${view}: idle rAF ${idle.rafFps} fps (render ${idle.renderRateFps}), median ${idle.M7_rafIntervalMs.median} ms; ` +
        `active rAF ${active.rafFps} fps (render ${active.renderRateFps}), median ${active.M7_rafIntervalMs.median} ms, p95 ${active.M7_rafIntervalMs.p95} ms; ` +
        (hover ? `hover rAF ${hover.rafFps} fps (render ${hover.renderRateFps}), median ${hover.M7_rafIntervalMs.median} ms, p95 ${hover.M7_rafIntervalMs.p95} ms; ` : '') +
        `draw ${active.overlay.M8_drawCalls?.median} tri ${active.overlay.M9_triangles?.median}; ` +
        `shadow ${active.render?.shadowCalls?.median} / ${active.render?.shadowTris?.median}, ${active.render?.shadowUpdatesPerS} maps/s` +
        (GPU ? `, gpu ${active.render?.gpuMs?.median} ms` : '') + `; errors ${errors.length}`);
      await context.close();
      break;
      } catch (error) {
        // One retry per view and run (WebKit on Windows sometimes loses its WebGL context at boot).
        result.failedAttempts.push({ run, view, attempt, error: String(error?.message ?? error).split('\n')[0].slice(0, 300), consoleErrors: errors });
        console.log(`${LABEL} run ${run} ${view}: attempt ${attempt} failed: ${String(error?.message ?? error).split('\n')[0]}`);
        await Promise.race([context.close(), sleep(10_000)]).catch(() => {});
      }
     }
    }
  }
} catch (error) {
  result.fatal = String(error?.stack ?? error).slice(0, 2000);
  console.error(result.fatal);
} finally {
  await browser?.close().catch(() => {});
  server.kill();
}
result.finishedAt = new Date().toISOString();
fs.mkdirSync(OUT, { recursive: true });
const raw = result.runs.map((r) => ({ run: r.run, view: r.view, idle: r.idle.rawIntervalsMs, active: r.active.rawIntervalsMs, hover: r.hover?.rawIntervalsMs ?? null }));
for (const r of result.runs) { delete r.idle.rawIntervalsMs; delete r.active.rawIntervalsMs; if (r.hover) delete r.hover.rawIntervalsMs; }
fs.writeFileSync(path.join(OUT, `${LABEL}.json`), JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(OUT, `${LABEL}-raf-intervals.json`), JSON.stringify(raw));
console.log(`wrote ${path.join(OUT, `${LABEL}.json`)}`);
