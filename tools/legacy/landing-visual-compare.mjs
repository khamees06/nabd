// Screenshot comparison of the V6.2 landing: the owner's prototype file against the page the application
// serves, at each viewport width, pixel by pixel. Writes, per width, the two full-page screenshots, a
// difference image (differing pixels in red over a faded copy of the application's page) and a report.
//
// The application's footer is taller than the prototype's (it adds the image and data credits), so the
// page is compared in two parts: from the top to the footer, and the footer from its top edge, each over
// the height both pages have.
//
// usage: node tools/legacy/landing-visual-compare.mjs --proto <prototype.html> --app http://127.0.0.1:5199/
//          [--widths 1536,1440,1024,768,390,320] [--height 900] [--out .work/visual] [--tolerance 24]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d; };
const proto = pathToFileURL(path.resolve(opt('proto'))).href;
const app = opt('app', 'http://127.0.0.1:5199/');
const widths = opt('widths', '1536,1440,1024,768,390,320').split(',').map(Number);
const height = opt('height', '900');
const out = path.resolve(opt('out', '.work/visual'));
const tolerance = Number(opt('tolerance', 24)); // largest per-channel difference still counted as equal (anti-aliasing)
fs.mkdirSync(out, { recursive: true });

/* ---------- minimal PNG codec (8-bit RGB/RGBA, not interlaced: what Chrome writes) ---------- */
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = b => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function decode(file) {
  const b = fs.readFileSync(file); let p = 8, w, h, ct; const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString('latin1', p + 4, p + 8), data = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; if (data[8] !== 8 || data[12] !== 0) throw new Error('unsupported PNG'); }
    if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0, up = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      const pa = Math.abs(up - c), pb = Math.abs(a - c), pc = Math.abs(a + up - 2 * c);
      line[i] = (line[i] + [0, a, up, (a + up) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? up : c][f]) & 255;
    }
    for (let x = 0; x < w; x++) { px[(y * w + x) * 4] = line[x * bpp]; px[(y * w + x) * 4 + 1] = line[x * bpp + 1]; px[(y * w + x) * 4 + 2] = line[x * bpp + 2]; px[(y * w + x) * 4 + 3] = bpp === 4 ? line[x * bpp + 3] : 255; }
    prev = line;
  }
  return { w, h, px };
}
function encode(file, w, h, px) {
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const chunk = (type, data) => { const t = Buffer.from(type, 'latin1'), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(data.length); c.writeUInt32BE(crc32(Buffer.concat([t, data]))); return Buffer.concat([l, t, data, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]));
}

/* ---------- screenshots ---------- */
const PREP = `document.querySelectorAll('img').forEach(i => i.loading = 'eager');
  await document.fonts.ready; await new Promise(r => setTimeout(r, 1200));
  const f = document.querySelector(ARG_FOOTER); return { footerTop: Math.round(f.getBoundingClientRect().top + scrollY), docH: document.documentElement.scrollHeight };`;
function shoot(url, footer, file, width) {
  const js = path.join(out, `_prep.js`);
  fs.writeFileSync(js, PREP.replace('ARG_FOOTER', JSON.stringify(footer)));
  const res = execFileSync(process.execPath, [path.join(HERE, 'browser-probe.mjs'), '--url', url, '--width', String(width), '--height', height, '--js-file', js,
    '--reduced-motion', '--wait', '1500', '--full', '--shot', file, '--block', '*fonts.googleapis.com*,*fonts.gstatic.com*'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return JSON.parse(res.trim().split('\n').pop());
}

const rows = [];
for (const width of widths) {
  const pf = path.join(out, `prototype-${width}.png`), af = path.join(out, `app-${width}.png`);
  const pm = shoot(proto, 'footer.site-footer', pf, width), am = shoot(app, '#site-footer', af, width);
  const P = decode(pf), A = decode(af);
  const w = Math.min(P.w, A.w);
  const diff = Buffer.alloc(A.w * A.h * 4);
  for (let i = 0; i < A.px.length; i += 4) { const g = (A.px[i] + A.px[i + 1] + A.px[i + 2]) / 3; diff[i] = diff[i + 1] = diff[i + 2] = 255 - (255 - g) * 0.25; diff[i + 3] = 255; }
  const compare = (pTop, aTop, h) => {
    let n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = ((pTop + y) * P.w + x) * 4, j = ((aTop + y) * A.w + x) * 4;
      if (Math.abs(P.px[i] - A.px[j]) > tolerance || Math.abs(P.px[i + 1] - A.px[j + 1]) > tolerance || Math.abs(P.px[i + 2] - A.px[j + 2]) > tolerance) {
        n++; diff[j] = 230; diff[j + 1] = 20; diff[j + 2] = 30;
      }
    }
    return { n, total: w * h };
  };
  const body = compare(0, 0, Math.min(pm.footerTop, am.footerTop));
  const foot = compare(pm.footerTop, am.footerTop, Math.min(P.h - pm.footerTop, A.h - am.footerTop));
  encode(path.join(out, `diff-${width}.png`), A.w, A.h, diff);
  const pct = r => (100 * r.n / r.total).toFixed(3) + '%';
  rows.push({ width, protoH: P.h, appH: A.h, footerTop: [pm.footerTop, am.footerTop], body: pct(body), bodyPixels: body.n, footer: pct(foot), footerPixels: foot.n });
  console.log(`${String(width).padStart(4)}px  page ${P.h}/${A.h}px  footer at ${pm.footerTop}/${am.footerTop}  header+landing differ ${pct(body)} (${body.n} px)  footer differs ${pct(foot)} (${foot.n} px)`);
}
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ proto: opt('proto'), app, tolerance, rows }, null, 1));
