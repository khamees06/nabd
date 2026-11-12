// Opens a page in headless Chrome, optionally runs JavaScript in it, and optionally saves a screenshot.
// Used for baseline and visual-regression checks of both the legacy site and the ASP.NET Core host.
//
// Usage:
//   node tools/legacy/browser-probe.mjs --url http://127.0.0.1:5180/ --width 1440 --height 900
//        [--js "return document.title"] [--js-file steps.js] [--shot out.png] [--full] [--wait 3000]
//        [--reduced-motion] [--mobile] [--init-js "code run before the page's own scripts"] [--errors]
// --errors adds the page's uncaught exceptions and console errors to the printed JSON: { value, errors }.
// --scale 2 renders at a device pixel ratio of 2 (a sharper screenshot at twice the pixel size); default 1.
// --block "*fonts.googleapis.com*,*fonts.gstatic.com*" makes requests to matching URLs fail at once, so a run
// does not depend on other hosts (a slow font host otherwise keeps the page from starting).
// The script given with --js / --js-file is the body of an async function; its return value is printed as JSON.
// Chrome is started with a throwaway profile and closed at the end.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : undefined; };
const flag = name => argv.includes('--' + name);
const url = opt('url');
if (!url) { console.error('missing --url'); process.exit(2); }
const width = Number(opt('width') || 1440), height = Number(opt('height') || 900), scale = Number(opt('scale') || 1);
const wait = Number(opt('wait') || 3000);
const js = opt('js-file') ? fs.readFileSync(opt('js-file'), 'utf8') : opt('js');
const shot = opt('shot');
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const port = 9500 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'nabd-probe-'));
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, nextId = 0;
const pageErrors = [];
const pending = new Map();
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async body => {
  const r = await send('Runtime.evaluate', { expression: `(async () => { ${body} })()`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
  return r.result.value;
};

let code = 0;
try {
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); } catch { /* not up yet */ }
    if (!target) await sleep(200);
  }
  if (!target) throw new Error('Chrome did not start');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', m => {
    const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') pageErrors.push('exception: ' + ((d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description) || d.params.exceptionDetails.text));
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') pageErrors.push('console.error: ' + d.params.args.map(a => a.value || a.description || '').join(' '));
    const p = d.id && pending.get(d.id);
    if (!p) return;
    pending.delete(d.id);
    if (d.error) p.reject(new Error(d.error.message)); else p.resolve(d.result);
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: flag('mobile') || width < 600 });
  if (flag('reduced-motion')) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (opt('block')) { await send('Network.enable'); await send('Network.setBlockedURLs', { urls: opt('block').split(',') }); }
  if (opt('init-js')) await send('Page.addScriptToEvaluateOnNewDocument', { source: opt('init-js') });
  await send('Page.navigate', { url });
  await sleep(wait);
  if (js) { const value = await evaluate(js); console.log(JSON.stringify(flag('errors') ? { value, errors: pageErrors } : value)); }
  else if (flag('errors')) console.log(JSON.stringify({ errors: pageErrors }));
  if (shot) {
    if (flag('full')) {
      await evaluate(`for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 500)); return 1;`);
    }
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: flag('full') });
    fs.mkdirSync(path.dirname(path.resolve(shot)), { recursive: true });
    fs.writeFileSync(shot, Buffer.from(r.data, 'base64'));
    console.error('saved ' + shot);
  }
} catch (e) {
  console.error('probe failed: ' + e.message);
  code = 1;
} finally {
  try { ws && ws.close(); } catch { /* closing */ }
  chrome.kill();
  await sleep(300);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome may still hold a file */ }
  process.exit(code);
}
