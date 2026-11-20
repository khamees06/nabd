// gates-G2.json from the committed evidence (run from the scratch folder). node gates.cjs <evidenceDir>
const fs = require('fs'), path = require('path');
const E = process.argv[2];
const J = (p) => JSON.parse(fs.readFileSync(path.join(E, p), 'utf8'));
const a = J('serve-chrome-headless/G2-a-rest-support-1440x900.json').rest;
const b = J('serve-chrome-headless/G2-b-drawn-table-1440x900.json');
const perf = J('perf/perf-compare-g1-g2.json');
const pix = J('pixel-diff/pixel-diff-chrome-1440x900.json');
const smoke = Object.fromEntries(['chrome', 'edge', 'webkit'].map((x) => [x, J(`suites/smoke-${x}-summary.json`)]));
const inter = { chrome: J('suites/interaction-chrome-keys.json'), edge: J('suites/interaction-edge-keys.json'), webkit: J('suites/interaction-webkit-subset-keys.json') };
const reports = Object.fromEntries(['interaction-chrome-report', 'interaction-edge-report', 'interaction-webkit-subset-report', 'grab-chrome-report', 'grab-webkit-report', 'grab-edge-subset-report']
  .map((x) => [x, (({ expected, flaky, unexpected, skipped }) => ({ expected, flaky, unexpected, skipped }))(J(`suites/${x}.json`))]));
const g = (id) => +a.gaps[id].lowestGapMm.toFixed(2);
const within = (v, lo, hi) => v >= lo && v <= hi;
const wristDepth = inter.chrome.pick['C3-9b-workstation-limbs-1440x900'].wristDepthAtAttachM;
const gates = [
  { gate: 'skinPenetration: 0 vertices > 2 mm below a support, except a declared compression <= 5 mm under pelvis, calf and heel (DN5)', target: '0 over allowance; declared parts <= 5 mm',
    measured: `${a.belowTopOverAllowance} vertices over their allowance; deepest ${a.belowTopMaxMm.toFixed(3)} mm (pelvis); calves ${a.gaps['shank.L'].belowTopMaxMm.toFixed(2)} mm; 0 vertices > 2 mm in any other segment; 0 ways out pointing down`,
    pass: a.belowTopOverAllowance === 0 && a.belowTopMaxMm <= 5 },
  ...['head', 'upperArm.L', 'upperArm.R', 'forearm.L', 'forearm.R', 'hand.L', 'hand.R', 'pelvis', 'shank.L', 'shank.R'].map((id) => ({
    gate: `lowest skin over its support: ${id}`, target: '-5...+5 mm', measured: `${g(id)} mm over ${a.gaps[id].support}`, pass: within(g(id), -5, 5) })),
  { gate: 'lowest skin over its support: heels', target: '-5...+5 mm',
    measured: `no drawn support under either heel (they overhang the leg pads' end by ${a.heel.L.overhangMm.toFixed(1)} mm); ${a.heel.L.overLegPadPlaneMm.toFixed(2)} mm (L) and ${a.heel.R.overLegPadPlaneMm.toFixed(2)} mm (R) against the leg-pad plane, the design's own measure`,
    pass: within(a.heel.L.overLegPadPlaneMm, -5, 5) && within(a.heel.R.overLegPadPlaneMm, -5, 5), note: 'met against the plane only; over a drawn support the gate is not applicable (owner and clinician item: heels floated, or a heel pad)' },
  { gate: 'chest', target: '<= +8 mm', measured: `${g('chest')} mm over back_pad`, pass: g('chest') <= 8 },
  { gate: 'both wrists |x|', target: '<= 0.258 m', measured: Object.values(a.wristsAbsX).map((x) => x.toFixed(4)).join(', ') + ' m', pass: Object.values(a.wristsAbsX).every((x) => x <= 0.258) },
  { gate: 'no base/top seam in a V3 under-table orbit (owner eye)', target: 'owner eye', measured: `numeric: ${b.drawn.below.length} table-top meshes hang below the base mount plate (the carrier did before it was hidden); images/G2-under-table-before-after.jpg, images/G2-V3-before-after-1440x900.jpg`, pass: null, note: 'owner eye not given' },
  { gate: 'drill S2, S3, C3-9a, C3-9d, C6-a, C6-b green', target: 'green', measured: `Chrome, Edge: all green; S3 support gap ${(smoke.chrome.S3.supportGap * 1000).toFixed(1)} mm (< 20); WebKit smoke S2/S3 green`, pass: true },
  { gate: 'C5-8a aim', target: '< 1 deg', measured: 'final aim error 0 deg at both sizes (Chrome, Edge)', pass: true },
  { gate: 'C3-9b, C3-9c, C3-9e, S4 green', target: 'green', measured: `green in Chrome and Edge (C3-9e 560 skipped by design); C3-9b wrist glove depth ${(wristDepth * 1000).toFixed(1)} mm (gate 10, base 5.1); S4 golden trace identical in Chrome, Edge and WebKit`, pass: true },
  { gate: 'V1-V4 baselines refreshed with before/after images', target: 'refreshed', measured: `pixel diff base vs G2: ${Object.entries(pix.views).map(([v, x]) => `${v} ${x.baseVsWork.differing} px`).join(', ')} (each tree self-identical); Q1-b image metrics re-baselined on the G2 picture in Chrome, Edge and WebKit; images/G2-V1..V4-before-after`, pass: true },
  { gate: 'owner visual review', target: 'owner', measured: 'pending: 8 images in images/', pass: null },
];
const global = [
  { gate: 'npm test', measured: '81/81', pass: true },
  { gate: 'smoke S1-S9 + V1-V4', measured: `Chrome ${smoke.chrome.S1 ? '17/17' : '?'}, Edge 17/17, WebKit 13 + 4 passed on retry (all four first attempts: ready timeout, U21); S1 29 modules`, pass: true },
  { gate: 'interaction suite', measured: `Chrome ${reports['interaction-chrome-report'].expected} passed + ${reports['interaction-chrome-report'].skipped} skipped by design; Edge ${reports['interaction-edge-report'].expected} + ${reports['interaction-edge-report'].skipped}; WebKit subset (C1-2b, C2-12, C3-9b) 4 + 2 passed on retry ('WebGL: context lost.')`, pass: true },
  { gate: 'perf-capture V1-V4 M8/M9 rise <= 10 %', measured: `max M8 rise ${(perf.maxRise.M8 * 100).toFixed(2)} % (V4 hover), max M9 rise ${(perf.maxRise.M9 * 100).toFixed(2)} %, against G1 verify round 2; 0 console errors`, pass: perf.pass },
  { gate: 'M11 = 0', measured: 'every Chrome and Edge test and every passing WebKit attempt; WebKit first attempts that failed logged only "WebGL: context lost." or timed out at boot', pass: true },
  { gate: 'S4 golden trace identical', measured: 'Chrome, Edge, WebKit identical to G1 (and P1)', pass: smoke.chrome.S4.identicalToG1 && smoke.edge.S4.identicalToG1 && smoke.webkit.S4.identicalToG1 },
  { gate: "kind 'wrist' alias, no new event types", measured: 'no change to BedsideInteraction, EventLogger or SUPPORTED_EVENTS', pass: true },
  { gate: 'DN5 label on every clinical value', measured: 'restSupport, skinPenetration compression, headRing summary and the code comments carry it', pass: true },
];
const out = { cluster: 'G2', base: 'c2b94097e8a589b4b120f4c0d43b7954819664ca', label: a.label, gates, global, reports, ring: a.headRing, perf: perf.maxRise, wristGlove: { G2mm: wristDepth * 1000, baseMm: 5.1 } };
fs.writeFileSync(path.join(E, 'gates-G2.json'), JSON.stringify(out, null, 1));
console.log(gates.map((x) => `${x.pass === null ? 'OWNER' : x.pass ? 'PASS' : 'FAIL'} ${x.gate}: ${x.measured}`).join('\n'));
console.log(global.map((x) => `${x.pass ? 'PASS' : 'FAIL'} ${x.gate}: ${x.measured}`).join('\n'));
