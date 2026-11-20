// Interaction-suite key readouts for G2 from the evidence JSON: C3-9b glove depth and settle, C3-9c, C3-9e, C5-8a aim,
// C6-b, C3-9a grips, C3-9d. node intersum.cjs <evidenceDir> <label> <out.json>
const fs = require('fs'), path = require('path');
const [dir, label, out] = process.argv.slice(2);
const d = path.join(dir, 'interaction', label);
const files = fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.json')) : [];
const read = (f) => JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
const pick = {};
for (const f of files) {
  const j = read(f), r = j.result ?? {};
  const key = f.replace('.json', '');
  if (/^C3-9b/.test(f)) pick[key] = { wristDepthAtAttachM: r.armLift?.penetrationAtAttach?.deepestM, ankleDepthAtAttachM: r.ankles?.[0]?.penetrationAtAttach?.deepestM,
    lift: r.armLift?.lift, settle2sM: [r.ankles?.[0]?.settle?.distanceAt2sM, r.armLift?.settle?.distanceAt2sM, r.regrab?.settle?.distanceAt2sM],
    maxSpeed: [r.ankles?.[0]?.settle?.maxSpeedMs, r.armLift?.settle?.maxSpeedMs, r.regrab?.settle?.maxSpeedMs], attached: r.ankles?.filter((a) => a.attachMs !== null).length };
  else if (/^C5-8a/.test(f)) pick[key] = { aim: JSON.stringify(r).match(/"(finalAimErrorDeg|midWalkAimErrorDeg)":[-0-9.]+/g) };
  else pick[key] = { attempt: j.attempt, errors: (j.errors ?? []).length };
}
fs.writeFileSync(out, JSON.stringify({ label, files: files.length, pick }, null, 1));
console.log(label, files.length, JSON.stringify(Object.fromEntries(Object.entries(pick).filter(([k]) => /C3-9b|C5-8a/.test(k)))).slice(0, 1500));
