// Compares the computed styles of the V6.2 prototype with the landing the application serves, element by
// element, at one viewport. It lists every element whose rendering-relevant styles differ, which finds
// legacy application rules that still reach the landing (an ID rule, an !important rule) and any slip in
// the converted markup.
//
// usage: node tools/legacy/landing-style-diff.mjs --proto <prototype.html> --app http://127.0.0.1:5199/ [--width 1440] [--height 900] [--max 60]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d; };
const proto = path.resolve(opt('proto'));
const app = opt('app', 'http://127.0.0.1:5199/');
const width = opt('width', '1440'), height = opt('height', '900'), max = Number(opt('max', 60));

const PROPS = ['display', 'position', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color', 'background-color', 'background-image',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'width', 'height',
  'border-top-width', 'border-top-color', 'border-bottom-width', 'border-bottom-color', 'border-right-width', 'border-left-width', 'border-radius', 'box-shadow',
  'text-align', 'gap', 'grid-template-columns', 'opacity', 'transform', 'object-fit', 'top', 'left', 'z-index', 'max-width', 'min-height'];
// Roots to compare: [prototype selector, application selector]
const ROOTS = [['header.site-header', '#public-header'], ['#mainContent', '#view-index .nabd-landing'], ['footer.site-footer', '#site-footer']];
// Parts the application adds to the prototype on purpose (docs/ui-integration-map.md): left out of the
// comparison so that the rest still lines up element by element.
const APP_ONLY = '#footer-app-links, .nl-footer-credits, #public-header > .nl-skip-link';
const collect = (isApp) => `
  document.querySelectorAll('img').forEach(i => i.loading = 'eager');
  await document.fonts.ready; await new Promise(r => setTimeout(r, 800));
  const PROPS = ${JSON.stringify(PROPS)};
  const roots = ${JSON.stringify(ROOTS)}.map(p => document.querySelector(p[${isApp ? 1 : 0}]));
  const norm = c => [...c].map(x => x.replace(/^nl-/, '')).filter(x => x !== 'nabd-landing' && x !== 'hidden').sort().join('.');
  const appOnly = ${isApp ? JSON.stringify(APP_ONLY) : 'null'};
  return roots.map(root => root ? [root, ...root.querySelectorAll('*')].filter(el => (!el.closest('svg') || el.tagName === 'svg') && !(appOnly && el.closest(appOnly))).flatMap(el => {
    const r = el.getBoundingClientRect();
    const key = el.tagName.toLowerCase() + (el.classList.length ? '.' + norm(el.classList) : '');
    const text = (el.childNodes[0] && el.childNodes[0].nodeType === 3 ? el.childNodes[0].textContent.trim().slice(0, 24) : '');
    const box = [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)];
    const styles = cs => PROPS.map(p => cs.getPropertyValue(p).replace(/url\\([^)]*\\)/g, 'url()'));
    // The element itself, then its ::before / ::after when they are drawn (decorations live there).
    return [{ key, text, box, s: styles(getComputedStyle(el)) }, ...['::before', '::after'].map(pe => getComputedStyle(el, pe)).map((cs, k) =>
      cs.getPropertyValue('content') !== 'none' && cs.getPropertyValue('display') !== 'none' ? { key: key + (k ? '::after' : '::before'), text, box, s: [...styles(cs), cs.getPropertyValue('box-sizing'), cs.getPropertyValue('right'), cs.getPropertyValue('bottom')] } : null).filter(Boolean)];
  }) : null);`;
const run = (url, isApp) => {
  const file = path.join(HERE, '..', '..', '.work', `_style-${isApp ? 'app' : 'proto'}.js`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, collect(isApp));
  const out = execFileSync(process.execPath, [path.join(HERE, 'browser-probe.mjs'), '--url', url, '--width', width, '--height', height, '--js-file', file, '--reduced-motion', '--wait', '1500',
    '--block', '*fonts.googleapis.com*,*fonts.gstatic.com*'], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] });
  return JSON.parse(out.trim().split('\n').pop());
};
const P = run(pathToFileURL(proto).href, false), A = run(app, true);
let shown = 0, total = 0;
ROOTS.forEach(([ps, as], ri) => {
  const p = P[ri], a = A[ri];
  if (!p || !a) { console.log(`root ${ps} / ${as}: missing (${!!p}/${!!a})`); return; }
  // Align the two element lists by key, in order (greedy with a small look-ahead).
  let i = 0, j = 0;
  const unmatched = [];
  while (i < p.length && j < a.length) {
    if (p[i].key === a[j].key) {
      const diffs = [...PROPS, 'box-sizing', 'right', 'bottom'].map((prop, k) => (p[i].s[k] !== a[j].s[k] ? `${prop}: ${p[i].s[k]} -> ${a[j].s[k]}` : null)).filter(Boolean);
      if (diffs.length) { total++; if (shown++ < max) console.log(`[${as}] ${a[j].key} "${a[j].text}" box ${a[j].box}\n    ${diffs.join('\n    ')}`); }
      i++; j++; continue;
    }
    const ahead = a.slice(j, j + 12).findIndex(x => x.key === p[i].key);
    if (ahead > 0) { for (let k = 0; k < ahead; k++) unmatched.push('app-only ' + a[j + k].key); j += ahead; }
    else { unmatched.push('prototype-only ' + p[i].key); i++; }
  }
  console.log(`--- ${ps} vs ${as}: ${p.length} / ${a.length} elements; unmatched: ${unmatched.length ? unmatched.slice(0, 12).join(', ') : 'none'}`);
});
console.log(`${total} element(s) with differences at ${width}x${height}`);
