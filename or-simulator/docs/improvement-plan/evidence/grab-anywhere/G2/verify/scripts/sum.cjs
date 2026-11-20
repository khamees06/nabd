// Prints the key numbers of one g2-probe.mjs output.
const r = require(process.argv[2]);
if (r.failure) { console.log('FAILURE', r.failure); process.exit(0); }
const I = r.independent, A = r.app.restSupport;
console.log('ready', r.readyMs, 'errors', r.errors, 'drawnTop', I.drawnTopMeshes, 'hidden', I.hiddenTopMeshes, 'tris', I.triangles);
console.log('perSkin', JSON.stringify(I.perSkin));
for (const [k, e] of Object.entries(I.segments).sort()) {
  console.log(k.padEnd(10), 'n', e.vertices, 'lowGap', e.lowestGapMm?.toFixed(2), e.lowestGapMesh, 'in', e.insideCount, '>2', e.insideOver2mm, '>5', e.insideOver5mm,
    'maxIn', e.maxInsideMm.toFixed(2), e.maxInsideMesh, 'overNothing', e.overNothing, 'lowestY', e.lowestY.toFixed(4));
}
if (A) {
  console.log('APP gaps', JSON.stringify(Object.fromEntries(Object.entries(A.gaps).map(([k, g]) => [k, [g.lowestGapMm == null ? null : +g.lowestGapMm.toFixed(2), g.support, +g.belowTopMaxMm.toFixed(2)]]))));
  console.log('app overAllowance', A.belowTopOverAllowance, 'over2', A.belowTopOver2mm, 'max', A.belowTopMaxMm, 'supportMax', A.supportMaxMm, 'down', A.supportDownward, 'self', A.selfMaxMm);
  console.log('app wrists', JSON.stringify(A.wristsAbsX), 'app heel', JSON.stringify(A.heel));
  console.log('ring', JSON.stringify(A.headRing));
} else if (r.app.pen) {
  console.log('base app pen', 'belowTopMax', r.app.pen.belowTopMaxMm, 'over2', r.app.pen.belowTopOver2mm);
}
console.log('wrists', JSON.stringify(I.wrists));
console.log('heel', JSON.stringify(I.heel));
console.log('under', JSON.stringify(I.underTable));
console.log('others', JSON.stringify(I.othersInTableVolume.map((o) => [o.name, o.parents.join('<'), o.min, o.max])));
console.log('self', JSON.stringify(I.self));
console.log('tween', JSON.stringify(r.tween), 'after', JSON.stringify(r.afterRoundTrip));
if (r.app.joints) console.log('joints hard', r.app.joints.hardCount, 'warn', r.app.joints.warnCount);
console.log('console', JSON.stringify(r.console).slice(0, 800));
