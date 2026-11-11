  const STAGES = ['', 'watch', 'urgent', 'critical'];
  function stageCheck() {
    const R = E.c.risk;
    const s = E.risk >= R.critical ? 3 : E.risk >= R.urgent ? 2 : E.risk >= R.watch ? 1 : 0;
    $('view-er').dataset.stage = STAGES[s] || 'calm';
    E.vtNow = !!E.c.vt && s === 3;
    $('view-er').dataset.rhythm = E.vtNow ? 'vt' : '';
    if (s <= E.stage) {
      // Getting better is an event too.
      if (s < E.stage && E.stage >= 2) {
        E.stage = s;
        log('better', 'تحسّن المريض بعد العلاج');
        // The nurse says which numbers moved, not just that they did.
        E.bpAt = 0; paint();
        const v = live();
        nurse(`دكتور، الأرقام أحسن: الـSpO2 ${Math.round(v.spo2)}%، النبض ${Math.round(v.hr)}، الضغط ${E.bp.join(' على ')}.`);
        E.anx = clamp(E.anx - 12, 0, 100);
        E.betterTurn = E.turns;
        director('better');
      }
      return;
    }
    E.stage = s;
    E.topStage = Math.max(E.topStage, s);
    if (NM()) for (let k = 1; k <= s; k++) if (E.nurse.stageAt[k] === undefined) E.nurse.stageAt[k] = E.sim;
    if (E.vtNow && E.vtAt === null) E.vtAt = E.sim;
    if (s >= 2) { E.bpAt = 0; paint(); }
    const L = E.c.stageLines[STAGES[s]] || {};
    log('stage', ['', 'بدأ التدهور', 'تدهور واضح', 'حالة حرجة'][s]);
    if (s >= 2) alert(s === 3 ? 'إنذار حرج: ' + worst() : 'إنذار: ' + worst());
    const told = nurseStage(L);
    if (told) nurse(told);
    // Nurse mode: nobody reads the monitor for the trainee; what the eye sees at the bedside is noted.
    if (NM()) { const seenNow = L.seen || (L.rest || []).join('، و') || forNurse(L.nurse || ''); if (seenNow) say('exam', 'تلاحظ: ' + seenNow); }
    if (L.patient) later(0.15, () => person('p', pickOf(L.patient)));
    // The relative answers a patient who calls for them, unless they are waiting outside.
    if (L.companion && !E.comp.used.has(L.companion) && E.sim >= E.comp.outUntil) {
      E.comp.used.add(L.companion);
      E.comp.lastAt = Math.max(E.comp.lastAt, E.sim + 0.3);
      later(0.3, () => { if (E.sim >= E.comp.outUntil) person('c', L.companion); });
    }
    E.anx = clamp(E.anx + 14, 0, 100);
    director(s >= 2 ? 'alarm' : 'worse');
    if (NM()) nurseStageRise(s);
    else if (s >= 2) coach(s === 3 ? 'critical' : 'urgent');
  }
  // The nurse says a falling number only while the monitor shows it falling: the case lists each
  // sign with its limit ([vital, limit, words, '>' for too high]); what the eye sees is always said.
  function nurseStage(L) {
    if (!L.parts) return L.nurse;
    E.bpAt = 0; paint();
    const v = live(), val = k => (k === 'sbp' ? +E.bp[0] : v[k]);
    const hit = L.parts.filter(([k, lim, , dir]) => (dir === '>' ? val(k) > lim : val(k) < lim)).map(p => p[2]);
    const all = [...hit, ...(L.rest || [])];
    return all.length ? `دكتور، ${all.join('، و')}.` : L.held || L.nurse;
  }
  const worst = () => { const v = live(); return v.spo2 <= 90 ? `SpO2 ${Math.round(v.spo2)}%` : v.sbp < 95 ? `BP ${Math.round(v.sbp)}` : `HR ${Math.round(v.hr)}`; };
  const later = (min, fn) => E.jobs.push({ at: E.sim + min, fn });
  // chat fix 2026-11-08: a conversational beat (an extra answer, a remark, a done line) comes within seconds, in the
  // turn that made it; the trainee's next message drops whatever of it is still waiting (send()).
  const soon = (min, fn) => E.jobs.push({ at: E.sim + Math.min(min, 0.05), fn, conv: true, turn: E.turns });

