  // "Gave aspirin" about a drug nobody gave is the one lie plain text can show (both handover sheets use it).
  const claimedIn = s => /(اعطيت|عطيت|اعطيناه|اعطيناها|عطيناه|عطيناها|اخذ|اخد|gave|given|started)/.test(s) && D.actions.some(a => a.limits && !E.done.has(a.id) && hasAny(s, a.kw) && !/(بدي|اقترح|نحتاج|يحتاج|تحتاج|لازم|need|plan)/.test(s));
  function localGrade(end) {
    const d = norm(end.dx), s = norm(end.sbar), c = E.c;
    const close = (c.dx.close || []).some(w => hasAny(d, [w]));
    const right = !close && c.dx.accept.some(w => hasAny(d, [w]));
    // "Gave aspirin" about a drug nobody gave is the one lie plain text can show.
    const claimed = claimedIn(s);
    return { dx: right ? 'right' : close ? 'close' : 'wrong', s: s.length > 15, b: /(عنده|عندها|تاريخ|history|قصه)/.test(s), a: /\d/.test(s), r: /(بدي|اقترح|نحتاج|لازم|توصيه|plan)/.test(s), invented: claimed, note: '' };
  }

  function score(end) {
    const c = E.c, keys = Object.entries(c.care).filter(([, d]) => d.key);
    const safety = [];
    keys.forEach(([id, d]) => {
      const x = doneAs(id);
      safety.push({ id, d, at: x ? x.at : null, state: !x ? 'missed' : x.at <= d.by ? 'ontime' : 'late' });
    });
    Object.entries(c.results).filter(([, r]) => r.by).forEach(([id, r]) => {
      const x = E.tests[id];
      safety.push({ id, d: r, at: x ? x.at : null, state: !x ? 'missed' : x.at <= r.by ? 'ontime' : 'late' });
    });
    const per = 40 / Math.max(1, safety.length);
    const place = end ? dispoCheck(end.dispo) : null;
    let safe = safety.reduce((s, k) => s + (k.state === 'ontime' ? per : k.state === 'late' ? per / 2 : 0), 0) - E.harms.length * 10 - Math.min(9, E.wrongDoses.length * 3) - E.unneeded.length * 2 - (place === 'bad' ? 10 : 0);
    if (E.outcome === 'arrest') safe = Math.min(safe, 10);
    safe = clamp(safe, 0, 40);
    const dxPts = !end ? 0 : end.grade.dx === 'right' ? 15 : end.grade.dx === 'close' ? 8 : 0;
    const ts = Object.values(E.tests);
    let testPts = 15;
    // phase8 2026-11-07: an accepted written justification takes back the 'no' penalty; 'harm' stays whatever is written.
    ts.forEach(t => { testPts -= t.ind === 'harm' ? 6 : t.ind === 'no' ? (t.justOk === true ? 0 : 3) : 0; if (!['good', 'ungraded'].includes(t.reasonOk) && t.ind !== 'no' && t.ind !== 'harm') testPts -= 1.5; if (t.read === 'wrong') testPts -= 2; });
    // Staying out of the scanner in shock is the right call, not a missed test.
    const missedTests = Object.entries(c.results).filter(([id, r]) => r.ind === 'indicated' && !E.tests[id] && !(r.whenShock && fell())).map(([id]) => id);
    testPts = clamp(testPts - missedTests.length * 3, 0, 15);
    const reds = [...c.facts, ...c.exam].filter(f => f.red);
    const got = reds.filter(f => E.facts.has(f.id) || E.exam.has(f.id));
    const hist = reds.length ? 10 * got.length / reds.length : 10;
    const m = E.comm;
    const comm = clamp((m.introduced ? 2 : 0) + (m.explained ? 4 : 0) + (m.empathy ? 2 : 0) + (m.rude ? 0 : 2) - m.jargon, 0, 10);
    const g = end && end.grade;
    const hand = !end ? 0 : clamp((g.s ? 1.5 : 0) + (g.b ? 1.5 : 0) + (g.a ? 1.5 : 0) + (g.r ? 1.5 : 0) + (place === 'right' ? 4 : 0) - (g.invented ? 3 : 0), 0, 10);
    const total = Math.round(safe + dxPts + testPts + hist + comm + hand);
    return { total, safe, dxPts, testPts, hist, comm, hand, safety, missedTests, reds, got, place };
  }
  // Where the patient belongs can change during the case: a PE that collapsed is an ICU patient.
  const fell = () => !!E.c.collapse && (E.topStage >= 3 || E.done.has(E.c.collapse.need));
  const dispoRight = () => (fell() ? E.c.collapse.dispo : E.c.dispo);
  function dispoCheck(place) {
    if ((E.c.dispoBad || []).includes(place)) return 'bad';
    return place === dispoRight() || (!fell() && (E.c.dispoAlso || []).includes(place)) ? 'right' : 'wrong';
  }
  const DISPO = { icu: 'العناية الحثيثة', hdu: 'مراقبة عالية في الطوارئ', cath: 'القسطرة', ward: 'طابق عادي', home: 'البيت' };

