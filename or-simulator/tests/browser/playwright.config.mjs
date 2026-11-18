// Playwright configuration for the Nabd v1.5 browser smoke protocol (S1–S9, V1–V4).
// Human-readable protocol: tests/browser/SMOKE_PROTOCOL.md.
//
// testDir is this folder only, and only *.spec.mjs files are collected, so Playwright never
// picks up the node:test unit files in tests/*.test.js (and `node --test` never picks up
// these files: *.spec.mjs and *.config.mjs are outside its default patterns).
//
// Environment variables (all optional):
//   NABD_SMOKE_SERVER   'serve' (default): node scripts/serve.mjs on NABD_SMOKE_PORT (4301)
//                       'vite':            npx vite preview on NABD_SMOKE_PORT (default 4302);
//                                          needs an existing `npm run build` output in dist/
//   NABD_SMOKE_PORT     port for the server above
//   NABD_SMOKE_HEADED   '1' runs the chrome and edge projects in a visible window
//   NABD_EVIDENCE_DIR   where QA JSON and screenshots go
//                       (default docs/improvement-plan/evidence/baseline-p0)
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const server = process.env.NABD_SMOKE_SERVER === 'vite' ? 'vite' : 'serve';
const port = Number(process.env.NABD_SMOKE_PORT || (server === 'vite' ? 4302 : 4301));
const baseURL = `http://127.0.0.1:${port}`;
const headed = process.env.NABD_SMOKE_HEADED === '1';
// Keep Chromium's frame loop running when the window is covered or in the background.
const timingArgs = ['--disable-renderer-backgrounding', '--disable-background-timer-throttling',
  '--disable-features=CalculateNativeWinOcclusion'];

export default defineConfig({
  testDir: here,
  testMatch: /.*\.spec\.mjs$/,
  outputDir: path.join(os.tmpdir(), `nabd-smoke-results-${server}`),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 240_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['json', { outputFile: path.join(os.tmpdir(), `nabd-smoke-${server}-report.json`) }]],
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  webServer: server === 'vite'
    ? {
      command: `npx vite preview --host 127.0.0.1 --port ${port} --strictPort`,
      cwd: root, url: `${baseURL}/index.html`, reuseExistingServer: false, timeout: 60_000,
      stdout: 'ignore', stderr: 'pipe',
    }
    : {
      command: 'node scripts/serve.mjs',
      cwd: root, env: { PORT: String(port) }, url: `${baseURL}/index.html`, reuseExistingServer: false,
      timeout: 30_000, stdout: 'ignore', stderr: 'pipe',
    },
  projects: [
    {
      // Installed Google Chrome (D9: required). Headless by default; NABD_SMOKE_HEADED=1 for a window.
      name: 'chrome',
      use: { browserName: 'chromium', channel: 'chrome', headless: !headed, launchOptions: { args: timingArgs } },
    },
    {
      // Playwright WebKit on Windows: an approximation of Safari's engine, never "Safari" (U21, AS15).
      // One retry: in this environment WebKit intermittently logs "WebGL: context lost." while booting
      // (about 1 boot in 5–10) and then hangs or recovers late; a retried test is reported as "flaky".
      name: 'webkit',
      retries: 1,
      use: { browserName: 'webkit', headless: true },
    },
    {
      // Installed Microsoft Edge (D9: expected). Functional checks only: when headed and not
      // focused it was throttled to about 1 FPS in this environment.
      name: 'edge',
      use: { browserName: 'chromium', channel: 'msedge', headless: !headed, launchOptions: { args: timingArgs } },
    },
    {
      // Playwright Firefox (D9: expected). The spec skips every test with a recorded reason when the
      // browser cannot be launched in this environment (see the firefoxLaunch fixture).
      name: 'firefox',
      use: { browserName: 'firefox', headless: true },
    },
  ],
});
