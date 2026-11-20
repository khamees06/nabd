// Compact summary of one Playwright JSON report: per test, every attempt with its status and the first line of
// its error (verifier evidence). node suite-sum.cjs <report.json> <out.json>
const fs = require('fs');
const [file, out] = process.argv.slice(2);
const r = require(file);
const tests = [];
const walk = (s) => {
  for (const x of s.suites || []) walk(x);
  for (const sp of s.specs || []) for (const t of sp.tests) {
    tests.push({ title: sp.title, project: t.projectName, outcome: t.status,
      attempts: t.results.map((res) => ({ retry: res.retry, status: res.status, ms: res.duration,
        error: res.error ? String(res.error.message || '').replace(/\u001b\[[0-9;]*m/g, '').split('\n').filter(Boolean).slice(0, 4).join(' | ').slice(0, 300) : null })) });
  }
};
walk(r);
const count = (k) => tests.filter((t) => t.outcome === k).length;
const summary = { report: file.split(/[\\/]/).pop(), startTime: r.stats?.startTime, durationMs: r.stats?.duration,
  expected: count('expected'), flaky: count('flaky'), unexpected: count('unexpected'), skipped: count('skipped'),
  firstAttemptFailures: tests.filter((t) => t.attempts[0] && t.attempts[0].status !== 'passed' && t.attempts[0].status !== 'skipped').map((t) => ({ title: t.title, error: t.attempts[0].error })),
  tests };
fs.writeFileSync(out, JSON.stringify(summary, null, 1));
console.log(summary.report, 'expected', summary.expected, 'flaky', summary.flaky, 'unexpected', summary.unexpected, 'skipped', summary.skipped);
