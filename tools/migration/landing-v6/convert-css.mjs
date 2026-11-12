// Converts the stylesheet of the V6.2 landing prototype into the scoped stylesheet the application serves
// (src/Nabd.Web/wwwroot/css/landing-v6.css), without changing what it renders.
//
// What it does to each rule, keeping the prototype's cascade order and selector specificity:
//   - every class gets the "nl-" prefix (.hero -> .nl-hero): the landing's classes can no longer meet the
//     legacy application's classes (.btn, .container, .hero, .modal, .section ... exist in both);
//   - :root, html and body become the landing's root class .nabd-landing (set on the public header, the
//     landing view, the public footer and the landing dialog);
//   - a selector with no class at all (img, button, a, *, :focus-visible, :lang(ar)) is confined to the
//     landing with :where(.nabd-landing), which adds no specificity;
//   - html scroll behaviour is dropped (it would change scrolling in the whole application; the landing's
//     script scrolls to its sections instead);
//   - rules for the prototype's own sign-in screens are dropped: the application keeps its existing sign-in;
//   - keyframe names get the "nl-" prefix too.
// It prints every selector it scoped or dropped, for review.
//
// usage: node tools/migration/landing-v6/convert-css.mjs <prototype.html> <out.css> [classes.json]
import fs from 'node:fs';

const [, , input, output, classesOut] = process.argv;
if (!input || !output) { console.error('usage: convert-css.mjs <prototype.html> <out.css> [classes.json]'); process.exit(2); }
const html = fs.readFileSync(input, 'utf8');
const css = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));

/* ---------- parse into a tree of rules ---------- */
function parse(text) {
  const out = []; let i = 0;
  const skipWs = () => { while (i < text.length) { if (/\s/.test(text[i])) i++; else if (text.startsWith('/*', i)) { const e = text.indexOf('*/', i + 2); out.push({ comment: text.slice(i, e + 2) }); i = e + 2; } else break; } };
  function readBlock() { // from after '{' to the matching '}'
    let depth = 1, j = i, q = null;
    for (; j < text.length; j++) {
      const c = text[j];
      if (q) { if (c === q && text[j - 1] !== '\\') q = null; continue; }
      if (c === '"' || c === "'") q = c;
      else if (text.startsWith('/*', j)) j = text.indexOf('*/', j + 2) + 1;
      else if (c === '{') depth++;
      else if (c === '}' && --depth === 0) break;
    }
    const body = text.slice(i, j); i = j + 1; return body;
  }
  while (true) {
    skipWs(); if (i >= text.length) break;
    const open = text.indexOf('{', i);
    const prelude = text.slice(i, open).trim(); i = open + 1;
    const body = readBlock();
    if (/^@(media|supports)/.test(prelude)) out.push({ at: prelude, rules: parse(body) });
    else if (/^@keyframes/.test(prelude)) out.push({ keyframes: prelude, body });
    else out.push({ selector: prelude, body });
  }
  return out;
}
const tree = parse(css);

/* ---------- collect the prototype's classes ---------- */
const classes = new Set();
const classRe = /\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g;
(function walk(rules) { for (const r of rules) { if (r.rules) walk(r.rules); else if (r.selector) for (const m of r.selector.matchAll(classRe)) classes.add(m[1]); } })(tree);
for (const m of html.slice(html.indexOf('<body')).matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).filter(Boolean).forEach(c => classes.add(c));

/* ---------- transform selectors ---------- */
const report = { scoped: new Set(), dropped: new Set(), root: new Set() };
const DROP = /(^|[\s>+~,(])body\.(auth-mode)|\.auth-|#mainContent|\.skip-link\b(?=.*auth)/;
function splitList(sel) { // split a selector list on top-level commas
  const parts = []; let depth = 0, cur = '';
  for (const c of sel) { if (c === '(') depth++; if (c === ')') depth--; if (c === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += c; }
  if (cur.trim()) parts.push(cur.trim()); return parts;
}
const renameClasses = s => s.replace(classRe, (m, c) => `.nl-${c}`);
function transformComplex(sel) {
  if (/auth-|body\.auth-mode|#mainContent/.test(sel)) { report.dropped.add(sel); return []; }
  if (/^html\b/.test(sel)) { report.dropped.add(sel); return []; }
  if (/^body\.modal-open\b/.test(sel)) return [sel.replace(/^body\.modal-open/, 'html.nl-modal-open')].map(renameClassesExceptState);
  let s = sel.replace(/^:root\b/, '.nabd-landing').replace(/^body\b/, '.nabd-landing');
  if (s !== sel) { report.root.add(sel); return [renameClasses(s.replace(/^\.nabd-landing/, '\u0000')).replace('\u0000', '.nabd-landing')]; }
  if (/\./.test(s)) return [renameClasses(s)];
  // No class anywhere: confine to the landing without adding specificity.
  report.scoped.add(sel);
  if (/^\*/.test(s)) return [`:where(.nabd-landing)${s.slice(1) || ''}`.replace(/^:where\(\.nabd-landing\)$/, ':where(.nabd-landing)'), `:where(.nabd-landing) ${s}`];
  if (/^:lang\(/.test(s)) return [`:where(.nabd-landing)${s}`, `:where(.nabd-landing) ${s}`];
  return [`:where(.nabd-landing) ${s}`];
}
function renameClassesExceptState(s) { return s.replace(/\.(?!nl-modal-open)(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g, (m, c) => `.nl-${c}`); }
function transformSelector(list) {
  const out = []; for (const part of splitList(list)) out.push(...transformComplex(part));
  return [...new Set(out)].join(',\n');
}
const renameKeyframes = body => body.replace(/\bmodalIn\b/g, 'nl-modalIn');
// The application sets html { font-size: 15px } for its own pages; the prototype was designed at the browser's
// 16px. A rem length becomes the pixel length it had in the prototype, so the landing renders at its designed
// size whatever the application's root size is. Media queries keep their rem: those are always relative to
// the browser's initial 16px, never to html's font-size.
const remToPx = body => body.replace(/(-?\d*\.?\d+)rem\b/g, (m, n) => `${+(parseFloat(n) * 16).toFixed(3)}px`);

/* ---------- the guard: what the legacy application forces on the landing ---------- */
// The legacy stylesheets (style.css, theme.css) set some properties with !important on every button, b,
// strong and heading, and others through the IDs the landing has to keep (#public-header,
// #public-login-btn, #public-register-btn, #site-footer, #view-index h2/h3). An ordinary rule of the
// landing cannot win against those. The guard repeats the prototype's own declarations of exactly those
// properties as !important inside a cascade layer: an important declaration in a layer wins over every
// unlayered important declaration, whatever its specificity (CSS Cascade 5), and the guard's declarations
// compete only with each other, by the prototype's own specificity and order. The prototype's own
// !important declarations go to the earlier layer, which wins among important layers, so they stay on top.
// The list was taken from tools/legacy/landing-style-diff.mjs and docs/ui-integration-audit.md.
const FONT = ['font', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height'];
const PAINT = ['color', 'background', 'background-color', 'background-image', 'box-shadow', 'backdrop-filter', 'border', 'border-color', 'border-width', 'border-style',
  'border-top', 'border-bottom', 'border-right', 'border-left', 'border-top-color', 'border-top-width', 'border-bottom-color', 'border-bottom-width', 'border-radius'];
const GUARD_BY_SUBJECT = { // subject class (of the selector's last compound) -> properties the legacy rules force on it
  'nl-site-header': [...PAINT, 'height', 'min-height'],
  // theme.css hides #public-header nav below 1100px with !important; the V6.2 nav stays until 820px.
  'nl-main-nav': ['gap', 'row-gap', 'column-gap', 'display'],
  // theme.css sizes #public-login-btn / #public-register-btn with !important padding.
  ...Object.fromEntries(['nl-btn', 'nl-btn-copper', 'nl-btn-outline-light'].map(c => [c, [...PAINT, 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding-inline', 'padding-block', 'min-height']])),
  'nl-site-footer': [...PAINT, 'margin-top'],
  'nl-modal': [...PAINT, 'z-index'],
};
// A guarded property must be guarded in every rule that can set it on the same element, or a rule left
// outside the guard loses to it. So a class that appears together with a guarded class on any element of
// the prototype (class="btn btn-copper premium-institution-btn") gets the same guarded properties.
const GUARD_BASE = { ...GUARD_BY_SUBJECT };
for (const m of html.slice(html.indexOf('<body')).matchAll(/class="([^"]+)"/g)) {
  const list = m[1].split(/\s+/).filter(Boolean).map(c => 'nl-' + c);
  const props = [...new Set(list.flatMap(c => GUARD_BASE[c] || []))];
  if (props.length) for (const c of list) GUARD_BY_SUBJECT[c] = [...new Set([...(GUARD_BY_SUBJECT[c] || []), ...props])];
}
function splitDecls(body) { // top-level declarations of a rule body
  const out = []; let depth = 0, cur = '', q = null;
  for (const c of body) {
    if (q) { if (c === q) q = null; cur += c; continue; }
    if (c === '"' || c === "'") q = c;
    if (c === '(') depth++; if (c === ')') depth--;
    if (c === ';' && depth === 0) { if (cur.trim()) out.push(cur.trim()); cur = ''; } else cur += c;
  }
  if (cur.trim()) out.push(cur.trim()); return out;
}
const subjectClasses = complex => { const last = complex.split(/\s*[\s>+~]\s*(?![^(]*\))/).pop(); return [...last.matchAll(/\.(nl-[\w-]+)/g)].map(m => m[1]); };
function guardRules(rules, strong) { // the same tree, with only the guarded declarations, all !important
  const out = [];
  for (const r of rules) {
    if (r.rules) { const inner = guardRules(r.rules, strong); if (inner.length) out.push({ at: r.at, rules: inner }); continue; }
    if (!r.selector) continue;
    const sel = transformSelector(r.selector); if (!sel) continue;
    const decls = splitDecls(r.body).map(d => { const k = d.indexOf(':'); return { prop: d.slice(0, k).trim().toLowerCase(), value: d.slice(k + 1).trim() }; })
      .filter(d => /!\s*important$/i.test(d.value) === strong);
    const bySelector = new Map(); // complex selector -> guarded declarations
    for (const complex of splitList(sel.replace(/,\n/g, ','))) {
      const allowed = new Set([...FONT, ...subjectClasses(complex).flatMap(c => GUARD_BY_SUBJECT[c] || [])]);
      const keep = decls.filter(d => allowed.has(d.prop)).map(d => `${d.prop}: ${remToPx(renameKeyframes(d.value.replace(/\s*!\s*important$/i, '')))} !important`);
      if (keep.length) bySelector.set(complex, keep.join('; '));
    }
    // Consecutive selectors with the same declarations stay one rule, as in the prototype.
    const groups = [];
    for (const [complex, body] of bySelector) { const g = groups[groups.length - 1]; if (g && g.body === body) g.sels.push(complex); else groups.push({ sels: [complex], body }); }
    for (const g of groups) out.push({ selector: g.sels.join(',\n'), body: ` ${g.body}; ` });
  }
  return out;
}
const emitPlain = (rules, indent = '') => rules.map(r => r.at ? `${indent}${r.at} {\n${emitPlain(r.rules, indent + '  ')}${indent}}\n` : `${indent}${r.selector} {${r.body}}\n`).join('');

/* ---------- the font faces (self-hosted, wwwroot/fonts/noto-sans-arabic, SIL OFL 1.1) ---------- */
const FONT_FACES = `/* Noto Sans Arabic v2.010, self-hosted (wwwroot/fonts/noto-sans-arabic/LICENSE.md, SIL Open Font License 1.1).
   The prototype names "Noto Sans Arabic" first in --font-ar; these faces make it the same font on every machine. */
@font-face { font-family: "Noto Sans Arabic"; font-style: normal; font-weight: 100 599; font-display: swap; src: url(../fonts/noto-sans-arabic/NotoSansArabic-Regular.woff2) format("woff2"); }
@font-face { font-family: "Noto Sans Arabic"; font-style: normal; font-weight: 600 900; font-display: swap; src: url(../fonts/noto-sans-arabic/NotoSansArabic-Bold.woff2) format("woff2"); }
`;

/* ---------- write ---------- */
function emit(rules, indent = '') {
  let s = '';
  for (const r of rules) {
    if (r.comment) { s += `${indent}${r.comment}\n`; continue; }
    if (r.keyframes) { s += `${indent}${r.keyframes.replace(/modalIn/, 'nl-modalIn')} {${r.body}}\n`; continue; }
    if (r.at) { const inner = emit(r.rules, indent + '  '); if (inner.trim()) s += `${indent}${r.at} {\n${inner}${indent}}\n`; continue; }
    const sel = transformSelector(r.selector);
    if (!sel) continue;
    s += `${indent}${sel} {${remToPx(renameKeyframes(r.body))}}\n`;
  }
  return s;
}
const header = `/* =========================================================================
   Nabd public landing page, design V6.2.
   Generated from the owner's prototype (Nabd-Index-Prototype-V6.2.html) by
   tools/migration/landing-v6/convert-css.mjs, then kept by hand. Read docs/ui-design-system.md first.

   Isolation rules (the rest of the application must not change):
   - every class is prefixed "nl-"; the legacy stylesheets use no such class;
   - the design tokens live on .nabd-landing, the class carried by each landing root
     (public header, landing view, public footer, landing dialog);
   - element rules are confined with :where(.nabd-landing), which adds no specificity, so the
     prototype's own specificity, and therefore its rendering, is kept;
   - the order of the rules is the prototype's: later refinement blocks deliberately override earlier ones;
   - the guard at the end repeats the few properties the legacy stylesheets force with !important or ID
     rules (fonts everywhere; paint on the header, its buttons, the footer and the dialog) inside cascade
     layers, so the prototype's values win again (see tools/migration/landing-v6/convert-css.mjs).
   Do not edit this file by hand: change the prototype or the converter and regenerate it. Integration
   rules written for the application live in landing-v6-shell.css.
   ========================================================================= */
`;
const guard = `
/* =========================================================================
   Guard (generated): the prototype's own declarations of the properties the legacy stylesheets force,
   repeated as !important inside layers. Layered important declarations win over unlayered ones.
   ========================================================================= */
/* Layer order: for important declarations an earlier layer wins. Other stylesheets fill three more:
   nl-refine (landing-v63.css, auth-v63.css: the V6.3 refinements, above everything else),
   nl-guard-shell (landing-v6-shell.css: fonts of the elements the application adds; above the prototype) and
   nl-guard-defaults (landing-v6-shell.css: browser defaults the prototype relied on; below every prototype declaration). */
@layer nl-refine, nl-guard-own-important, nl-guard-shell, nl-guard, nl-guard-defaults;
@layer nl-guard-own-important {
${emitPlain(guardRules(tree, true), '  ')}}
@layer nl-guard {
${emitPlain(guardRules(tree, false), '  ')}}
`;
fs.writeFileSync(output, header + FONT_FACES + emit(tree) + guard);
if (classesOut) fs.writeFileSync(classesOut, JSON.stringify([...classes].sort(), null, 1));
console.log(`classes: ${classes.size}`);
console.log('root (:root/body ->.nabd-landing):', [...report.root].join(' | '));
console.log('scoped with :where(.nabd-landing):', [...report.scoped].join(' | '));
console.log('dropped:', [...report.dropped].join(' | '));
