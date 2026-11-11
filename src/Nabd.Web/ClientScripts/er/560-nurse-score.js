  function scoreNurse(end) {
    const c = E.c, N = E.nurse, X = N.esc;
    // 1. ABCDE /15: each part 2 (full by minute 3, half by 6; one of two parts = half), plus red flags 5.
    const tf = t => (t === null || t === undefined ? 0 : t <= 3 ? 1 : t <= 6 ? 0.5 : 0);
    const exAt = ids => { const ts = ids.map(id => N.examAt[id]).filter(x => x !== undefined); return ts.length ? Math.min(...ts) : null; };
    const minOf = list => { const ts = list.filter(x => x !== null && x !== undefined); return ts.length ? Math.min(...ts) : null; };
    const v1 = N.vchecks.length ? N.vchecks[0] : null, glu = E.tests.glucose ? E.tests.glucose.at : null;
    const pair = (t1, t2) => (t1 !== null && t2 !== null ? [2 * tf(Math.max(t1, t2)), Math.max(t1, t2)] : t1 !== null || t2 !== null ? [tf(t1 !== null ? t1 : t2), null] : [0, null]);
    const one = t => [2 * tf(t), t];
    const circ = ['perfusion', 'hydration', 'volume', 'heart'].filter(id => c.exam.some(f => f.id === id));
    const parts = {
      a: one(minOf([N.airwayAt, exAt(['consciousness', 'general', 'work'])])),
      b: pair(v1, exAt(['chest', 'work'])),
      c: circ.length ? pair(v1, exAt(circ)) : one(v1),
      d: pair(exAt(['consciousness', 'general']), glu),
      e: one(minOf([N.tempAt, exAt(['abdomen', 'legs', 'neuro', 'perfusion', 'hydration'])])),
    };
    const reds = [...c.facts, ...c.exam].filter(f => f.red), got = reds.filter(f => E.facts.has(f.id) || E.exam.has(f.id));
    const assess = clamp(Object.values(parts).reduce((t, [p]) => t + p, 0) + (reds.length ? 5 * got.length / reds.length : 5), 0, 15);
    const abcdeAt = Object.values(parts).every(([p]) => p === 2) ? Math.max(...Object.values(parts).map(([, t]) => t)) : null;
    // 2. recognising deterioration and escalating /20
    const ESC = escBy(), called = X.calledAt, s2 = N.stageAt[2];
    const timing = X.by === 'alarm' || called === null ? 0 : called <= ESC && (s2 === undefined || called < s2) ? 10 : 5;
    const sb = X.sbar, half = (sb && sb.half) || {};
    const sbPart = k => (!sb || sb.none || !sb[k] ? 0 : half[k] ? 1 : 2);
    const sbarPts = ['s', 'b', 'a', 'r'].reduce((t, k) => t + sbPart(k), 0);
    const rose = called !== null && Object.values(N.stageAt).some(at => at > called);
    const follow = called === null ? 0 : !rose || (X.updateAt !== null && X.reNeededAt !== null && X.updateAt - X.reNeededAt <= 2) ? 2 : 0;
    const escPts = timing + sbarPts + follow;
    // 3. interventions within nursing scope /20
    const own = nurseOwnKeys().map(([id, d]) => { const x = E.done.get(id); return { id, d, at: x ? x.at : null, state: !x ? 'missed' : x.at <= d.by ? 'ontime' : 'late' }; });
    const pk = own.length ? 8 / own.length : 0;
    const a8 = own.length ? own.reduce((t, k) => t + (k.state === 'ontime' ? pk : k.state === 'late' ? pk / 2 : 0), 0) : 8;
    const bed = [...NURSE_TESTS].filter(id => (c.results[id] || {}).ind === 'indicated').map(id => { const r = c.results[id], by = r.by || 10, x = E.tests[id]; return { id, by, why: r.why, at: x ? x.at : null, state: !x ? 'missed' : x.at <= by ? 'ontime' : 'late' }; });
    const pb = bed.length ? 4 / bed.length : 0;
    const b4 = bed.length ? bed.reduce((t, k) => t + (k.state === 'ontime' ? pb : k.state === 'late' ? pb / 2 : 0), 0) : 4;
    const ords = N.orders.filter(o => !o.reminder && !o.cancelled && !o.doctorDoes).map(o => ({ o, lag: o.doneAt == null ? null : Math.max(0, o.doneAt - o.at) }));
    const po = ords.length ? 8 / ords.length : 0;
    const c8 = ords.reduce((t, r) => t + (r.lag === null ? 0 : r.lag <= 3 ? po : r.lag <= 6 ? po / 2 : 0), 0);
    const gapIds = [...new Set(N.scope.filter(x => x.why !== 'wrong-agent').map(x => x.id))];
    const interv = clamp(a8 + b4 + c8 - Math.min(6, gapIds.length * 2) - N.notIndicated.length * 2, 0, 20);
    // 4. medication safety /15
    const first = N.given[0] || null;
    const allergyPts = first ? (first.allergyAsked ? 5 : N.allergyAt !== null ? 2 : 0) : N.allergyAt !== null ? 5 : 0;
    // Review fixes 2026-11-07: telling the doctor is scored from the doctor's side only; no dose credit with no drug
    // given or an ordered key drug never given; cultures drawn after the antibiotic cost 2 each.
    const toldPts = N.allergyToldDoc ? 3 : 0;
    const drugMissed = keyOrders().some(o => isDrug(o.id) && o.doneAt == null);
    const dosePts = !N.given.length || drugMissed ? 0 : Math.max(0, 4 - 2 * E.wrongDoses.length);
    const rbPts = N.ordersAt !== null && N.readBack ? 3 : 0;
    const med = clamp(allergyPts + toldPts + dosePts + rbPts - 2 * E.lateTests.length, 0, 15);
    // 5. follow-up and reassessment /10
    const iv = N.interv, covered = iv.filter(x => N.vchecks.some(t => t > x.at && t <= x.at + REASSESS_WIN));
    const r7 = iv.length ? 7 * covered.length / iv.length : N.vchecks.some(t => t > 3) ? 7 : 0;
    let gapMax = 0;
    if (N.vchecks.length) { const ts = [...N.vchecks, E.sim]; for (let i = 1; i < ts.length; i++) gapMax = Math.max(gapMax, ts[i] - ts[i - 1]); }
    const cont = !N.vchecks.length ? 0 : gapMax <= 5 ? 3 : gapMax <= 8 ? 1.5 : 0;
    const reass = r7 + cont;
    // 6. communication /10: as in the doctor room
    const m = E.comm;
    const comm = clamp((m.introduced ? 2 : 0) + (m.explained ? 4 : 0) + (m.empathy ? 2 : 0) + (m.rude ? 0 : 2) - m.jargon, 0, 10);
    // 7. the SBAR handover /10
    const g = end && end.grade;
    const hand = !end ? 0 : clamp((g.s ? 2 : 0) + (g.b ? 2 : 0) + (g.a ? 3 : 0) + (g.r ? 2 : 0) + (g.mention ? 1 : 0) - (g.invented ? 3 : 0), 0, 10);
    const total = Math.round(assess + escPts + interv + med + reass + comm + hand);
    // These fail the case whatever the number says.
    const fails = [];
    if (E.outcome === 'arrest') fails.push('توقف القلب');
    if (X.by === 'alarm' || called === null) fails.push('لم تبلّغ الطبيب');
    if (own.some(k => k.state === 'missed')) fails.push('خطوة أساسية ضمن صلاحيتك لم تحدث');
    if (keyOrders().some(o => o.doneAt == null)) fails.push('أمر طبيب أساسي لم يُنفّذ');
    if (E.harms.some(h => h.risk >= 8)) fails.push('أذى وصل إلى المريض');
    if (!N.vchecks.length) fails.push('لم تُعِد قياس العلامات الحيوية');
    if (N.given.length && N.allergyAt === null && (c.facts.find(f => f.id === 'allergy') || {}).red) fails.push('أعطيت دواءً دون السؤال عن الحساسية والمريض لديه حساسية مسجّلة');
    return { total, assess, escPts, interv, med, reass, comm, hand, parts, abcdeAt, reds, got, timing, sbarPts, follow, rose, own, bed, ords, gapIds, first, toldPts, rbPts, iv, covered, gapMax, fails, ESC };
  }
