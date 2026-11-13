// Compares the legacy static site with the ASP.NET Core host in a real browser (headless Chrome).
// For each state (landing, sign-in page, home per role, the ER briefing, ...) and each viewport it opens both
// hosts with the same seeded random numbers, drives the page through the same steps, and compares:
//   - the live DOM (document.documentElement.outerHTML), after undoing the registered differences (seams.json);
//   - the screenshot, pixel for pixel (the PNG bytes), taken with animations off;
//   - uncaught exceptions and console errors.
// Requests to other hosts (web fonts, one remote photo) are blocked on both sides, so a run depends on the two
// hosts only and is repeatable.
//
// Since the V6.2 public landing (ADR 0010) the public header, the landing view and the public footer are a new
// design, compared elsewhere: with the owner's prototype (landing-visual-compare.mjs, landing-style-diff.mjs) and
// with their approved snapshots (LandingV6Tests, LegacySiteBaselineTests). Here they are taken out of both pages:
// each is replaced by a placeholder in the DOM and hidden before the screenshot, together with the landing's own
// stylesheets, fonts and script. Since V6.4 (ADR 0012) the sign-in screen (#auth-modal) is a new design too and is
// taken out the same way; the two things it changes outside itself while it is open, the class nb-auth-open on
// <html> and the page title, are put back to one value on both sides. What is compared is everything else: every
// signed-in view, the ER room, and the rest of the page while the sign-in screen is open. Comments and the whitespace between tags are left out of the DOM comparison (the text of the page,
// comments included, is compared exactly by the baseline tests).
//
// usage: node tools/legacy/compare-hosts.mjs --legacy http://127.0.0.1:5180 --current http://127.0.0.1:5199 [--out folder] [--only state]
// Both hosts must be running. The legacy one: node tools/legacy/serve-static.mjs <checkout of main> 5180
// The current one must have the understanding services switched off (the Development settings do that), because
// the legacy site opened from 127.0.0.1 cannot reach them either; both rooms then start in the same offline mode.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d; };
const hosts = { legacy: opt('legacy', 'http://127.0.0.1:5180'), current: opt('current', 'http://127.0.0.1:5199') };
const OUT = path.resolve(opt('out', path.join(REPO, '.work/visual')));
const only = opt('only');
const seams = JSON.parse(fs.readFileSync(path.join(REPO, 'tests/Nabd.Tests/LegacyBaseline/seams.json'), 'utf8')).seams.filter(s => s.file === 'index.html');

// The same pseudo-random sequence on both hosts, and no animation, so two renders of the same code are identical.
const INIT = `(() => { let a = 20261111; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();`;
const BLOCK = '*fonts.googleapis.com*,*fonts.gstatic.com*,*wikimedia.org*';
const pause = ms => `await new Promise(r => setTimeout(r, ${ms}));`;
// Nothing is done before the page has finished loading and its own start-up has run.
const ready = `for (const t0 = Date.now(); Date.now() - t0 < 20000 && (document.readyState !== 'complete' || !document.documentElement.dataset.terms || typeof nbDemoLogin !== 'function');) ${pause(100)}`;
const settle = pause(1200);
// The parts the V6.2 landing and the V6.4 sign-in pages redesigned, and the files they add (see the note at the top).
const REGIONS = ['#public-header', '#view-index', '#auth-modal', '#site-footer'];
// landing-v6*.css also matches landing-v63.css and landing-v64.css; auth.css is the sign-in screen's stylesheet.
// app-v65.css (V6.5) restyles the signed-in screens with CSS only: it is taken out of the DOM comparison, which
// then still proves that their markup and behaviour are the legacy ones; their screenshots differ on purpose.
const LANDING_FILES = 'link[href*="landing-v6"], link[href$="css/auth.css"], link[href$="css/app-v65.css"], link[href*="noto-sans-arabic"], script[src*="landing.js"]';
// A snapshot is taken only once the page is quiet: fonts in, every image loaded or failed.
const snapshot = `document.querySelectorAll('img').forEach(i => i.loading = 'eager'); await document.fonts.ready;
  for (const t0 = Date.now(); Date.now() - t0 < 12000 && [...document.images].some(i => !i.complete);) ${pause(100)}
  const doc = document.documentElement.cloneNode(true);
  for (const sel of ${JSON.stringify(REGIONS)}) {
    doc.querySelector(sel)?.replaceWith(Object.assign(document.createElement('nabd-region'), { title: sel }));
    document.querySelector(sel)?.style.setProperty('display', 'none', 'important');
  }
  doc.querySelectorAll(${JSON.stringify(LANDING_FILES)}).forEach(e => e.remove());
  doc.classList.remove('nb-auth-open');
  if (!doc.getAttribute('class')) doc.removeAttribute('class');
  doc.querySelector('title').textContent = 'title';
  const comments = [];
  for (const w = document.createTreeWalker(doc, NodeFilter.SHOW_COMMENT); w.nextNode();) comments.push(w.currentNode);
  comments.forEach(c => c.remove());
  ${pause(900)}
  return { html: doc.outerHTML.replace(/>\\s+</g, '>\\n<'), view: (typeof currentView === 'undefined' ? null : currentView) };`;
const STATES = [
  { name: 'landing', js: `${settle} ${snapshot}` },
  { name: 'sign-in', js: `openAuthModal('login'); ${settle} ${snapshot}` },
  { name: 'register', js: `openAuthModal('register'); ${settle} ${snapshot}` },
  { name: 'home-medical-student', js: `nbDemoLogin('med_student'); ${settle} ${snapshot}` },
  { name: 'home-nursing-student', js: `nbDemoLogin('rana'); ${settle} ${snapshot}` },
  { name: 'home-professor', js: `nbDemoLogin('doctor'); ${settle} ${snapshot}` },
  { name: 'university-professor', js: `nbDemoLogin('doctor'); ${settle} navigateTo('university'); ${settle} ${snapshot}` },
  { name: 'profile-student', js: `nbDemoLogin('med_student'); ${settle} navigateTo('profile'); ${settle} ${snapshot}` },
  { name: 'coach-student', js: `nbDemoLogin('med_student'); ${settle} navigateTo('coach'); ${settle} ${snapshot}` },
  { name: 'er-briefing-doctor', js: `nbDemoLogin('med_student'); ${settle} await nbOpenER(); ${pause(2500)} ${snapshot}` },
  { name: 'er-briefing-nurse', js: `nbDemoLogin('rana'); ${settle} await nbOpenER(); ${pause(2500)} ${snapshot}` },
];
const VIEWPORTS = [{ name: 'desktop', w: 1440, h: 900 }, { name: 'phone', w: 390, h: 844 }];

const probe = (url, vp, js, shot) => {
  const file = path.join(OUT, '_step.js');
  fs.writeFileSync(file, ready + '\n' + js);
  const args = [path.join(HERE, 'browser-probe.mjs'), '--url', url + '/', '--width', String(vp.w), '--height', String(vp.h),
    '--js-file', file, '--shot', shot, '--reduced-motion', '--errors', '--init-js', INIT, '--block', BLOCK, '--wait', '1000'];
  // Chrome occasionally fails to start; another try is enough.
  for (let attempt = 1; ; attempt++) {
    try { return JSON.parse(execFileSync(process.execPath, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 }).trim().split('\n').pop()); }
    catch (e) { if (attempt >= 3) throw e; }
  }
};
const undo = html => seams.reduce((t, s) => t.split(s.current).join(s.legacy), html);
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);

fs.mkdirSync(OUT, { recursive: true });
let bad = 0;
const rows = [];
for (const st of STATES.filter(s => !only || s.name === only)) for (const vp of VIEWPORTS) {
  const res = {};
  for (const [k, url] of Object.entries(hosts)) {
    const shot = path.join(OUT, k, `${st.name}-${vp.name}.png`);
    const r = probe(url, vp, st.js, shot);
    res[k] = { html: k === 'current' ? undo(r.value.html) : r.value.html, view: r.value.view, errors: r.errors, png: sha(shot) };
  }
  const dom = res.legacy.html === res.current.html, pixels = res.legacy.png === res.current.png, errs = res.legacy.errors.length === res.current.errors.length;
  if (!dom || !pixels || !errs) bad++;
  let where = '';
  if (!dom) {
    for (const k of ['legacy', 'current']) fs.writeFileSync(path.join(OUT, k, `${st.name}-${vp.name}.html`), res[k].html);
    let i = 0; const a = res.legacy.html, b = res.current.html; while (i < a.length && a[i] === b[i]) i++;
    where = `\n     legacy:  …${a.slice(Math.max(0, i - 70), i + 110).replace(/\n/g, '⏎')}…\n     current: …${b.slice(Math.max(0, i - 70), i + 110).replace(/\n/g, '⏎')}…`;
  }
  rows.push(`| ${st.name} | ${vp.name} | ${res.current.view} | ${dom ? 'identical' : 'DIFFERENT'} | ${pixels ? 'identical' : 'DIFFERENT'} | ${res.legacy.errors.length} / ${res.current.errors.length} |`);
  console.log(`${st.name.padEnd(24)} ${vp.name.padEnd(8)} view=${String(res.current.view).padEnd(10)} dom=${dom ? 'identical' : 'DIFFERENT'} pixels=${pixels ? 'identical' : 'DIFFERENT'} errors(legacy/current)=${res.legacy.errors.length}/${res.current.errors.length}${where}`);
  if (res.current.errors.length) console.log('     current errors: ' + res.current.errors.slice(0, 3).join(' | ').slice(0, 400));
}
fs.writeFileSync(path.join(OUT, 'report.md'), `| state | viewport | view | DOM | screenshot | errors (legacy / current) |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n`);
console.log(bad ? `${bad} state(s) differ` : `all ${rows.length} states identical on both hosts`);
process.exit(bad ? 1 : 0);
