// Records the approved snapshots of the V6.2 landing regions (tests/Nabd.Tests/LandingBaseline/NAME.html)
// from a running host. The baseline test then requires the served regions to equal them exactly.
//
// This is an approval step, not a way to make a failing test pass: run it only after the change to the
// landing has been compared with the design (tools/legacy/landing-visual-compare.mjs and
// tools/legacy/landing-style-diff.mjs) and accepted, and commit the snapshots together with that change.
//
// usage: node tools/migration/landing-v6/approve-landing-baseline.mjs [--host http://127.0.0.1:5199]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const argv = process.argv.slice(2);
const host = (argv.indexOf('--host') >= 0 ? argv[argv.indexOf('--host') + 1] : 'http://127.0.0.1:5199').replace(/\/$/, '');
const dir = path.join(REPO, 'tests', 'Nabd.Tests', 'LandingBaseline');
const { regions } = JSON.parse(fs.readFileSync(path.join(dir, 'regions.json'), 'utf8'));

const page = (await (await fetch(host + '/')).text()).replace(/\r\n/g, '\n');
for (const { name } of regions) {
  const start = page.indexOf(`<!-- nabd:region ${name} `), endMarker = `<!-- /nabd:region ${name} -->`, end = page.indexOf(endMarker);
  if (start < 0 || end < start || page.indexOf(`<!-- nabd:region ${name} `, start + 1) >= 0) throw new Error(`region ${name}: markers missing or repeated`);
  const text = page.slice(start, end + endMarker.length) + '\n';
  fs.writeFileSync(path.join(dir, `${name}.html`), text);
  console.log(`${name}.html  ${text.length} characters`);
}
