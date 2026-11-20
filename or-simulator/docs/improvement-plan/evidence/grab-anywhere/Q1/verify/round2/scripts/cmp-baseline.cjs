// Compare a verifier Q1-b run with baseline-Q1.json imageMetrics, field by field (exact equality).
const fs = require('fs');
const [,, baselinePath, ...runs] = process.argv;
const base = JSON.parse(fs.readFileSync(baselinePath, 'utf8')).imageMetrics;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const out = {};
for (const spec of runs) {
  const [browser, file] = spec.split('=');
  const run = JSON.parse(fs.readFileSync(file, 'utf8'));
  const r = run.result ?? run;
  const b = base[browser];
  const rows = {};
  for (const view of ['v1', 'v2']) {
    for (const key of Object.keys(b[view] ?? {})) {
      if (key === 'render') continue;
      rows[`${view}.${key}`] = r[view]?.[key] === undefined ? 'missing in run' : eq(r[view][key], b[view][key]);
    }
    for (const key of Object.keys(r[view] ?? {})) if (!(key in (b[view] ?? {}))) rows[`${view}.${key}`] = rows[`${view}.${key}`] ?? 'not in baseline';
  }
  const diffs = Object.entries(rows).filter(([, v]) => v !== true);
  out[browser] = { browserVersion: run.browserVersion, attempt: run.attempt, compared: Object.keys(rows).length, allEqual: diffs.length === 0, diffs: Object.fromEntries(diffs),
    railBar: r.v1?.luma?.railBar, rail: r.v1?.luma?.rail };
}
console.log(JSON.stringify(out, null, 1));
