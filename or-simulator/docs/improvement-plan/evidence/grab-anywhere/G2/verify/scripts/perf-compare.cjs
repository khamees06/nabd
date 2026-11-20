// M8/M9 (overlay draw calls and triangles, median per segment) and frame rates: base tree (c2b9409) against the
// G2 tree, both headed Chrome in the same session, same protocol (runs 1, loads 1, V1-V4). Verifier only.
// node perf-compare.cjs <base.json> <g2.json> <out.json>
const fs = require('fs');
const [baseFile, g2File, outFile] = process.argv.slice(2);
const a0 = require(baseFile), b0 = require(g2File);
const rows = [];
for (const view of ['V1', 'V2', 'V3', 'V4']) for (const seg of ['idle', 'active', 'hover']) {
  const a = a0.runs.find((r) => r.view === view)?.[seg], b = b0.runs.find((r) => r.view === view)?.[seg];
  if (!a || !b) continue;
  const m = (x, k) => x.overlay[k].median;
  rows.push({ view, seg, M8: { base: m(a, 'M8_drawCalls'), g2: m(b, 'M8_drawCalls') }, M9: { base: m(a, 'M9_triangles'), g2: m(b, 'M9_triangles') },
    M8rise: m(b, 'M8_drawCalls') / m(a, 'M8_drawCalls') - 1, M9rise: m(b, 'M9_triangles') / m(a, 'M9_triangles') - 1,
    rafFps: { base: a.rafFps, g2: b.rafFps }, renderRateFps: { base: a.renderRateFps, g2: b.renderRateFps }, p95Ms: { base: a.M7_rafIntervalMs.p95, g2: b.M7_rafIntervalMs.p95 } });
}
const maxRise = { M8: Math.max(...rows.map((r) => r.M8rise)), M9: Math.max(...rows.map((r) => r.M9rise)) };
const errors = { base: a0.runs.reduce((n, r) => n + (r.consoleErrors?.length ?? 0), 0), g2: b0.runs.reduce((n, r) => n + (r.consoleErrors?.length ?? 0), 0) };
const out = { what: 'perf-capture V1-V4, headed Chrome, runs 1, loads 1, base c2b9409 vs G2 ff8705c in one session', gate: 'M8/M9 rise <= 10 %',
  maxRise, pass: maxRise.M8 <= 0.1 && maxRise.M9 <= 0.1, consoleErrors: errors, browser: { base: a0.browserVersion, g2: b0.browserVersion }, rows };
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ maxRise, errors }));
for (const r of rows) console.log(r.view, r.seg, 'M8', r.M8.base, r.M8.g2, (r.M8rise * 100).toFixed(2) + '%', 'M9', r.M9.base, r.M9.g2, (r.M9rise * 100).toFixed(2) + '%', 'fps', r.rafFps.base, r.rafFps.g2, 'p95', r.p95Ms.base, r.p95Ms.g2);
