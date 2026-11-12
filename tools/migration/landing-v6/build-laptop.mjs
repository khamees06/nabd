// Draws the laptop of the landing's simulation showcase (V6.4) as one SVG: a dark lid with a thin bezel, the
// aluminium base seen from the front and a little from above, a keyboard and a trackpad in true perspective,
// the hinge, the front edge with its notch, and the shadow it casts on the table. The screen itself is left
// empty: the page lays the real screenshot over it (the numbers printed at the end are its position).
//
// The base is a horizontal plane seen in perspective. A point at (u, v) on it, u across from 0 (left) to 1
// (right) and v in depth from 0 (the hinge) to 1 (the front edge), is drawn where a camera about a metre in
// front of the laptop would see it: widths and heights shrink with distance (1/depth), so the back edge is
// narrower than the front edge, the rows of keys get shallower toward the hinge, and every edge stays straight.
// The physical sizes are those of a common 13-inch laptop (deck 304 x 215 mm, key pitch 18 mm).
//
// usage: node tools/migration/landing-v6/build-laptop.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const OUT = path.join(REPO, 'src', 'Nabd.Web', 'wwwroot', 'img', 'landing', 'v64', 'laptop.svg');

// ---- the drawing's frame ----
const W = 1280;            // width of the drawing (the base plus room for the blurred shadow at both sides)
const XC = W / 2;          // centre line
const WF = 1150;           // width of the base's front edge
const R = 0.835;           // back edge / front edge (perspective)
const WB = WF * R;         // width of the back edge, which is also the lid's width
const LID_TOP = 10;
const BEZEL = { side: 24, top: 26, bottom: 40 };
const SCREEN_W = WB - 2 * BEZEL.side;
const SCREEN_H = SCREEN_W / 1.6;                   // a 16:10 screen
const LID_H = BEZEL.top + SCREEN_H + BEZEL.bottom;
const YB = LID_TOP + LID_H;                        // the hinge: back edge of the base
const DECK_H = 178;                                // drawn depth of the base
const YF = YB + DECK_H;                            // front edge of the base
const EDGE = 13;                                   // thickness of the front edge
const H = Math.ceil(YF + EDGE + 70);               // room for the blurred shadow below

// ---- physical base (mm) ----
const DW = 304, DD = 215;

const s = v => 1 / (1 / R - v * (1 / R - 1));      // 1/depth, normalised: R at the hinge, 1 at the front
const P = (u, v) => {
  const k = s(v);
  return [XC + (u - 0.5) * WF * k, YB + DECK_H * (k - R) / (1 - R)];
};
const mm = (x, y) => P(x / DW, y / DD);             // a point given in millimetres on the deck
const f = n => Math.round(n * 10) / 10;
const pt = ([x, y]) => `${f(x)} ${f(y)}`;
const quad = (x0, y0, x1, y1) => [mm(x0, y0), mm(x1, y0), mm(x1, y1), mm(x0, y1)];
const poly = q => 'M' + q.map(pt).join('L') + 'Z';

// A rounded quadrilateral on the deck: corners cut by a fraction of the side lengths and joined with curves.
function roundedQuad(q, r) {
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let d = '';
  for (let i = 0; i < 4; i++) {
    const p = q[i], prev = q[(i + 3) % 4], next = q[(i + 1) % 4];
    const a = lerp(p, prev, r), b = lerp(p, next, r);
    d += (i === 0 ? 'M' : 'L') + pt(a) + 'Q' + pt(p) + ' ' + pt(b);
  }
  return d + 'Z';
}

const parts = [];
const add = s => parts.push(s);

// ---- defs ----
add(`<defs>
<linearGradient id="deck" x1="0" y1="${f(YB)}" x2="0" y2="${f(YF)}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#b4bcc3"/><stop offset=".35" stop-color="#cfd5da"/><stop offset="1" stop-color="#e7ebee"/></linearGradient>
<linearGradient id="deckSheen" x1="${f(XC - WF / 2)}" y1="0" x2="${f(XC + WF / 2)}" y2="0" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity=".28"/><stop offset=".58" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="hingeShade" x1="0" y1="${f(YB)}" x2="0" y2="${f(YB + 34)}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#0b1a22" stop-opacity=".34"/><stop offset="1" stop-color="#0b1a22" stop-opacity="0"/></linearGradient>
<linearGradient id="edge" x1="0" y1="${f(YF)}" x2="0" y2="${f(YF + EDGE)}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#d9dee2"/><stop offset=".25" stop-color="#a9b1b8"/><stop offset="1" stop-color="#7d868e"/></linearGradient>
<linearGradient id="well" x1="0" y1="${f(YB)}" x2="0" y2="${f(YF)}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#0d1013"/><stop offset="1" stop-color="#1a1e22"/></linearGradient>
<linearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#3a3f45"/><stop offset="1" stop-color="#25292e"/></linearGradient>
<linearGradient id="pad" x1="0" y1="${f(mm(0, 124)[1])}" x2="0" y2="${f(mm(0, 204)[1])}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#c3cad0"/><stop offset="1" stop-color="#dde2e6"/></linearGradient>
<linearGradient id="lid" x1="0" y1="${LID_TOP}" x2="0" y2="${f(YB)}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#2c3238"/><stop offset="1" stop-color="#181c20"/></linearGradient>
<linearGradient id="hinge" x1="0" y1="${f(YB - 4)}" x2="0" y2="${f(YB + 9)}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#3b4249"/><stop offset=".5" stop-color="#14181c"/><stop offset="1" stop-color="#2a3036"/></linearGradient>
<filter id="blurWide" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="blurTight" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="3.2"/></filter>
</defs>`);

// ---- shadow on the table ----
const yShadow = YF + EDGE;
add(`<ellipse cx="${XC}" cy="${f(yShadow + 6)}" rx="${f(WF / 2 + 18)}" ry="20" fill="#0b2531" opacity=".30" filter="url(#blurWide)"/>`);
add(`<ellipse cx="${XC}" cy="${f(yShadow + 1)}" rx="${f(WF / 2 - 14)}" ry="5" fill="#0b2531" opacity=".55" filter="url(#blurTight)"/>`);

// ---- base: front edge (thickness), then the deck ----
const fl = [XC - WF / 2, YF], fr = [XC + WF / 2, YF];
add(`<path d="M${pt([fl[0] + 2, YF - 2])}L${pt([fr[0] - 2, YF - 2])}Q${pt([fr[0] + 1, YF])} ${pt([fr[0] - 3, YF + EDGE * .55])}Q${pt([fr[0] - 8, YF + EDGE])} ${pt([fr[0] - 22, YF + EDGE])}L${pt([fl[0] + 22, YF + EDGE])}Q${pt([fl[0] + 8, YF + EDGE])} ${pt([fl[0] + 3, YF + EDGE * .55])}Q${pt([fl[0] - 1, YF])} ${pt([fl[0] + 2, YF - 2])}Z" fill="url(#edge)"/>`);
// the opening notch, a shallow scoop in the middle of the front edge
add(`<path d="M${pt([XC - 78, YF])}Q${pt([XC - 60, YF + 6.5])} ${pt([XC, YF + 6.5])}Q${pt([XC + 60, YF + 6.5])} ${pt([XC + 78, YF])}Z" fill="#8b949b" opacity=".55"/>`);

const deckCorners = [P(0, 0), P(1, 0), P(1, 1), P(0, 1)];
const deckPath = roundedQuad(deckCorners, 0.018);
add(`<path d="${deckPath}" fill="url(#deck)"/>`);
add(`<path d="${deckPath}" fill="url(#deckSheen)" opacity=".7"/>`);
add(`<path d="${deckPath}" fill="url(#hingeShade)"/>`);
// a bright chamfer along the front edge
add(`<path d="M${pt(P(0.02, 1))}L${pt(P(0.98, 1))}" stroke="#f6f8f9" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>`);

// ---- keyboard: a dark well and the keys ----
const PITCH = 18, GAP = 3.1, KX0 = 17, KY0 = 13, FN_ROW = 10.5;
// the keys span x from KX0 + 0.6 to KX0 + 0.6 + 15 pitches - one gap, and y likewise; the well is 2 mm wider
add(`<path d="${roundedQuad(quad(KX0 + 0.6 - 2, KY0 + 0.6 - 2, KX0 + 0.6 + 15 * PITCH - GAP + 2, KY0 + 0.6 + FN_ROW + 5 * PITCH - GAP + 2), 0.02)}" fill="url(#well)"/>`);

const rows = [
  { h: FN_ROW, keys: [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5] },
  { h: PITCH, keys: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2] },
  { h: PITCH, keys: [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5] },
  { h: PITCH, keys: [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25] },
  { h: PITCH, keys: [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75] },
  { h: PITCH, keys: [1, 1, 1, 1.25, 5.5, 1.25, 1, 'arrows'] },
];
let y = KY0 + 0.6;
const caps = [];
const key = (x0, y0, x1, y1) => {
  const q = quad(x0, y0, x1, y1);
  // the side of the key that faces the viewer, then its top
  const lift = 2.2 * s((y1) / DD);
  const side = [q[3], q[2], [q[2][0], q[2][1] + lift], [q[3][0], q[3][1] + lift]];
  caps.push(`<path d="${poly(side)}" fill="#07090b"/>`);
  caps.push(`<path d="${roundedQuad(q, 0.14)}" fill="url(#cap)"/>`);
  caps.push(`<path d="M${pt(q[0])}L${pt(q[1])}" stroke="#555c63" stroke-width=".8" opacity=".75"/>`);
};
for (const row of rows) {
  let x = KX0 + 0.6;
  for (const k of row.keys) {
    if (k === 'arrows') {
      // left and right half height at the bottom; up and down stacked in the middle
      const half = (row.h - GAP) / 2, yTop = y, yBottom = y + row.h - GAP;
      key(x, yTop + half + GAP / 4, x + PITCH - GAP, yBottom);
      key(x + PITCH, yTop, x + 2 * PITCH - GAP, yTop + half - GAP / 4);
      key(x + PITCH, yTop + half + GAP / 4, x + 2 * PITCH - GAP, yBottom);
      key(x + 2 * PITCH, yTop + half + GAP / 4, x + 3 * PITCH - GAP, yBottom);
      x += 3 * PITCH;
      continue;
    }
    key(x, y, x + k * PITCH - GAP, y + row.h - GAP);
    x += k * PITCH;
  }
  y += row.h;
}
add(caps.join(''));

// ---- trackpad ----
const pad = quad(DW / 2 - 64, 124, DW / 2 + 64, 204);
add(`<path d="${roundedQuad(pad, 0.05)}" fill="url(#pad)" stroke="#9ea7ae" stroke-width="1"/>`);
add(`<path d="M${pt(mm(DW / 2 - 61, 124.8))}L${pt(mm(DW / 2 + 61, 124.8))}" stroke="#eef1f3" stroke-width="1" opacity=".8"/>`);

// ---- hinge and lid ----
add(`<rect x="${f(XC - WB / 2 + 56)}" y="${f(YB - 4)}" width="${f(WB - 112)}" height="13" rx="6.5" fill="url(#hinge)"/>`);
const lx = XC - WB / 2, ly = LID_TOP;
add(`<path d="M${f(lx)} ${f(ly + 24)}Q${f(lx)} ${f(ly)} ${f(lx + 24)} ${f(ly)}H${f(lx + WB - 24)}Q${f(lx + WB)} ${f(ly)} ${f(lx + WB)} ${f(ly + 24)}V${f(YB - 6)}Q${f(lx + WB)} ${f(YB)} ${f(lx + WB - 6)} ${f(YB)}H${f(lx + 6)}Q${f(lx)} ${f(YB)} ${f(lx)} ${f(YB - 6)}Z" fill="#aab2b9"/>`);
add(`<path d="M${f(lx + 2.5)} ${f(ly + 24)}Q${f(lx + 2.5)} ${f(ly + 2.5)} ${f(lx + 24)} ${f(ly + 2.5)}H${f(lx + WB - 24)}Q${f(lx + WB - 2.5)} ${f(ly + 2.5)} ${f(lx + WB - 2.5)} ${f(ly + 24)}V${f(YB - 6)}Q${f(lx + WB - 2.5)} ${f(YB - 1.5)} ${f(lx + WB - 7)} ${f(YB - 1.5)}H${f(lx + 7)}Q${f(lx + 2.5)} ${f(YB - 1.5)} ${f(lx + 2.5)} ${f(YB - 6)}Z" fill="url(#lid)"/>`);
const sx = lx + BEZEL.side, sy = ly + BEZEL.top;
add(`<rect x="${f(sx - 1)}" y="${f(sy - 1)}" width="${f(SCREEN_W + 2)}" height="${f(SCREEN_H + 2)}" rx="3" fill="#05070a"/>`);
// camera
add(`<circle cx="${XC}" cy="${f(ly + BEZEL.top / 2 + 1)}" r="4.2" fill="#0b0f13" stroke="#30373e" stroke-width="1.2"/><circle cx="${f(XC - 1.2)}" cy="${f(ly + BEZEL.top / 2)}" r="1.2" fill="#4b6a80"/>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n${parts.join('\n')}\n</svg>\n`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, svg);
const pc = (n, of) => (n / of * 100).toFixed(4) + '%';
console.log(`${path.relative(REPO, OUT)}  ${W} x ${H}  ${svg.length} bytes`);
console.log(`screen: left ${pc(sx, W)}  top ${pc(sy, H)}  width ${pc(SCREEN_W, W)}  height ${pc(SCREEN_H, H)}`);
