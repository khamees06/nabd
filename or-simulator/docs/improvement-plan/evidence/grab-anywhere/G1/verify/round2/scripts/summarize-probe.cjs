const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const b = j.qa.body, ind = j.independent;
  const clin = ind.perSkin.find((s) => /^Clinical/.test(s.material));
  const nonPriv = ind.perSkin.filter((s) => !s.privacy);
  const segs = b.proxies.segments;
  const minOut = Math.min(...segs.filter((x) => x.outsideInner !== null).map((x) => x.outsideInner));
  const minOutSeg = segs.find((x) => x.outsideInner === minOut)?.id;
  // lowest vertex independent vs sample
  const lowAgree = segs.map((s) => ({ id: s.id, lowestIsSample: s.lowestIsSample, lowestVertex: s.lowestVertex, ind: ind.lowest[s.id.replace('.L', 'L').replace('.R', 'R')]?.vertex }));
  const disagreeLow = lowAgree.filter((x) => x.ind !== undefined && x.lowestVertex !== undefined && x.ind !== x.lowestVertex);
  const pen = j.qa.pen;
  console.log(JSON.stringify({ file: f, browser: j.browserVersion, readyMs: j.readyMs,
    triSeg: { implAssigned: b.gates.triSegAssignedFraction, implSingle: b.gates.triSegSingleWeightFraction, indClinical: [clin.assigned, clin.triangles, clin.singleFraction], nonPrivacyAssignedAll: nonPriv.every((s) => s.assigned === s.triangles), nonPrivTris: nonPriv.reduce((a, s) => a + s.triangles, 0) },
    outsideInner: { min: minOut, seg: minOutSeg, segments: segs.length, allGe95: segs.every((x) => x.outsideInner === null || x.outsideInner >= 0.95) },
    lowest: { allSample: b.gates.lowestRestVertexIsSample, n: segs.length, disagreeWithIndependent: disagreeLow.length, keys: Object.keys(ind.lowest).length },
    supports: { implWorstMm: j.qa.supports.check.worstErrorMm, implSamples: j.qa.supports.check.samples, ownSamples: ind.supportsOwnRaycast.samples, ownWorstMm: ind.supportsOwnRaycast.worstSameMeshErrMm,
      arm: ind.supportsOwnRaycast.boxes.filter((x) => /armboard_(pad|top)/.test(x.name)).map((x) => [x.name, x.topY.toFixed(4), x.x.map((v) => v.toFixed(3)).join('..'), x.z.map((v) => v.toFixed(3)).join('..')]),
      pads: ind.supportsOwnRaycast.boxes.filter((x) => /_pad$/.test(x.name) && !/armboard/.test(x.name)).map((x) => [x.name, x.topY.toFixed(5)]) },
    penetration: { impl: { supportMaxMm: pen.supportMaxMm, supportP95Mm: pen.supportP95Mm, over2mm: pen.over2mm, belowTopMaxMm: pen.belowTopMaxMm, belowTopP95Mm: pen.belowTopP95Mm, belowTopOver2mm: pen.belowTopOver2mm, downward: pen.supportDownward, sideExit: pen.sideExit, selfMaxMm: pen.selfMaxMm }, independent: ind.penetration },
    joints: { hard: j.qa.joints.hardCount, warn: j.qa.joints.warnCount, label: j.qa.joints.label, warnList: Object.entries(j.qa.joints.joints).flatMap(([id, x]) => x.warn.map((w) => id + ':' + w.motion + ' ' + w.valueDeg.toFixed(2))) },
    timing: { ...b.timing, bodyMs: j.qa.bodyMs, penMs: j.qa.penMs },
    poseVersion: j.poseVersion, errors: j.errors, console: j.console.map((m) => m.type + ':' + m.text.slice(0, 80)) }, null, 0));
}
