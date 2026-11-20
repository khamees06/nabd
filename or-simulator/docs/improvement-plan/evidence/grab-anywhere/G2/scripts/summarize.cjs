// Summarise a Playwright JSON report: counts, and per test its outcome, retries and the first line of each
// failed attempt's error (to tell WebKit's known boot and context-loss failures from real ones).
// node summarize.cjs <report.json> [out.json]
const fs = require('fs');
const [file, out] = process.argv.slice(2);
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const tests = [];
const walk = (suite, titles = []) => {
  for (const s of suite.suites ?? []) walk(s, [...titles, s.title]);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const attempts = (t.results ?? []).map((r) => ({ retry: r.retry, status: r.status, ms: r.duration,
        error: r.error ? String(r.error.message ?? '').replace(/\u001b\[[0-9;]*m/g, '').split('\n').filter(Boolean).slice(0, 6).join(' | ').slice(0, 600) : null,
        stdoutContextLost: (r.stdout ?? []).some((x) => /context lost/i.test(x.text ?? '')) }));
      tests.push({ title: spec.title, file: spec.file, project: t.projectName, outcome: t.status, attempts });
    }
  }
};
for (const s of report.suites ?? []) walk(s);
const count = (o) => tests.filter((t) => t.outcome === o).length;
const summary = { report: file, stats: report.stats, expected: count('expected'), flaky: count('flaky'), unexpected: count('unexpected'), skipped: count('skipped'),
  notPassed: tests.filter((t) => t.outcome !== 'expected' && t.outcome !== 'skipped'), skippedTitles: tests.filter((t) => t.outcome === 'skipped').map((t) => t.title) };
console.log(JSON.stringify({ expected: summary.expected, flaky: summary.flaky, unexpected: summary.unexpected, skipped: summary.skipped }, null, 0));
for (const t of summary.notPassed) console.log(t.outcome, t.title, JSON.stringify(t.attempts.map((a) => [a.retry, a.status, a.error?.slice(0, 220)])));
if (out) fs.writeFileSync(out, JSON.stringify({ ...summary, tests: tests.map((t) => ({ title: t.title, project: t.project, outcome: t.outcome, attempts: t.attempts.length })) }, null, 1));
