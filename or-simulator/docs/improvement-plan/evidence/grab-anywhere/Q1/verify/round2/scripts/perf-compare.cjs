// M8/M9 (overlay median) and rAF/render rates per view and segment: a verifier perf run against P0 and Q1.
const fs = require('fs');
const [,, runFile, ...refs] = process.argv;
const load = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const pick = (doc) => {
  const by = {};
  for (const r of doc.runs) {
    for (const seg of ['idle', 'active']) {
      const s = r[seg]; if (!s) continue;
      const k = `${r.view}.${seg}`;
      (by[k] ??= []).push({ M8: s.overlay.M8_drawCalls.median, M9: s.overlay.M9_triangles.median, fps: s.rafFps, renderFps: s.renderRateFps,
        shadowCalls: s.render?.shadowCalls?.median ?? null, errors: (r.consoleErrors ?? []).length });
    }
  }
  const mean = (a, f) => Number((a.reduce((x, y) => x + y[f], 0) / a.length).toFixed(1));
  return Object.fromEntries(Object.entries(by).map(([k, a]) => [k, { M8: mean(a, 'M8'), M9: mean(a, 'M9'), fps: mean(a, 'fps'), renderFps: mean(a, 'renderFps'),
    shadowCalls: a[0].shadowCalls, errors: a.reduce((x, y) => x + y.errors, 0), runs: a.length }]));
};
const run = pick(load(runFile));
const out = { run: runFile, rows: {} };
const refDocs = refs.map((spec) => { const [name, f] = spec.split('='); return [name, pick(load(f))]; });
for (const [k, v] of Object.entries(run)) {
  const row = { verify: v };
  for (const [name, ref] of refDocs) {
    const r = ref[k]; if (!r) continue;
    row[name] = r;
    row[`${name}_M8risePct`] = Number(((v.M8 / r.M8 - 1) * 100).toFixed(2));
    row[`${name}_M9risePct`] = Number(((v.M9 / r.M9 - 1) * 100).toFixed(2));
  }
  out.rows[k] = row;
}
console.log(JSON.stringify(out, null, 1));
