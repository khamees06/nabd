  /* ---------- nurse mode: escalation ---------- */
  function escalate(text, quiet) {
    const N = E.nurse, X = N.esc;
    if (X.calledAt === null) X.calledAt = E.sim;
    X.by = X.by || 'call';
    X.contacts.push({ at: E.sim, kind: 'call' });
    if (!E.done.has('call_senior')) E.done.set('call_senior', { at: E.sim, last: E.sim, n: 1, dose: '', ok: 'good', amt: 0 });
    log('action', 'إبلاغ الطبيب');
    sys('اتصلتَ ب' + docTitle() + '.');
    X.awaiting = true; X.awaitAt = E.sim;
    if (!quiet && wordsIn(text) >= ESC_SPOKEN_MIN) { X.hello = true; escReply(text); return; }
    // A short call keeps what it said about the patient ("دكتور سامر، المريضة تعبانة كتير"): its S counts.
    if (!quiet && text) {
      const rest = nz(text).replace(new RegExp(N.rx.docv.source, 'g'), ' ').replace(new RegExp(CALL_N.source, 'g'), ' ').replace(/(?:^| )يا(?= |$)/g, ' ').replace(/\s+/g, ' ').trim();
      if (wordsIn(rest) >= 2) X.buf = rest;
    }
    later(0.15, () => { if (!E.over && X.awaiting && !X.hello) { X.hello = true; X.awaitAt = E.sim; docSay('أهلين، معك ' + N.doc + '. شو الوضع؟'); } });
  }
  function reEscalate(read, text) {
    const N = E.nurse, X = N.esc;
    X.contacts.push({ at: E.sim, kind: 'update' });
    if (X.reNeeded !== null && X.updateAt === null) X.updateAt = E.sim;
    if (!N.present) { sys('اتصلتَ ب' + docTitle() + ' مرة أخرى.'); docSay('تمام، ' + comes() + '.'); later(0.3, doctorArrives); }
    else docLine(read, nz(text));
    releaseOrders();
  }
  // The SBAR, collected over one or two messages; one clarifying question at most.
  function escReply(text) {
    const N = E.nurse, X = N.esc;
    X.buf = (X.buf + ' ' + text).trim();
    X.turns++;
    X.hello = true;
    const g = gradeSbar(X.buf);
    if (!X.asked && (!g.a || !g.b)) {
      X.before = { s: g.s, b: g.b, a: g.a, r: g.r };
      X.asked = !g.a ? 'a' : 'b';
      X.hello = true;
      docSay(X.asked === 'a' ? 'عطيني الأرقام: الضغط، النبض، التنفس، والـSpO2.' : E.c.patient.sex === 'F' ? 'شو قصتها؟ أمراض مزمنة، أدوية، حساسية؟' : 'شو قصته؟ أمراض مزمنة، أدوية، حساسية؟');
      return;
    }
    // A part supplied only after the doctor asked for it is worth half.
    if (X.before) g.half = { s: g.s && !X.before.s, b: g.b && !X.before.b, a: g.a && !X.before.a, r: g.r && !X.before.r };
    escFinish(g);
  }
  function escFinish(g) {
    const N = E.nurse, X = N.esc;
    X.sbar = g; X.awaiting = false; N.escDoneTurn = E.turns;
    if (g.allergy) N.allergyToldDoc = true;
    const drug = Object.entries(N.nm.orders).some(([k, o]) => o.kind === 'act' && o.when === 'phone' && !o.reminder && isDrug(o.id || k));
    // Review fix 2026-11-07: a prescriber who asks about allergies waits for the answer before the drugs
    // (a minute at most, and never once the patient is critical).
    if (drug && !g.allergy) { N.allergyAskedByDoc = true; N.allergyAskTurn = E.turns; N.holdRel = { at: E.sim }; }
    releaseOrders();
    if (N.holdRel) docSay(N.orders.length ? 'وقبل الأدوية: في حساسية من أدوية؟' : 'في حساسية من أدوية؟');
    if (!N.present) later(E.stage >= 2 ? 0.2 : 1.5, doctorArrives);
  }
  // Nobody answered the doctor on the phone: he comes to see for himself, with no SBAR to go on.
  function escGiveUp() {
    const N = E.nurse, X = N.esc;
    if (!X.awaiting) return;
    X.awaiting = false;
    X.sbar = { s: false, b: false, a: false, r: false, aWrong: false, goodSuggest: false, allergy: false, half: {}, none: true };
    docSay('طيب، ' + comes() + ' ' + (E.c.patient.sex === 'F' ? 'أشوفها' : 'أشوفه') + ' بنفسي.');
    releaseOrders();
    later(0.2, doctorArrives);
  }
  function doctorArrives() {
    if (!E || E.over || !NM() || E.nurse.present) return;
    const N = E.nurse;
    N.present = true;
    nurseChips();
    sys((N.sex === 'F' ? 'وصلت ' : 'وصل ') + docTitle() + ' إلى السرير.');
    const icu = E.c.care.call_icu;
    if (icu && icu.key && !E.done.has('call_icu')) E.done.set('call_icu', { at: E.sim, last: E.sim, n: 1, dose: '', ok: 'good', amt: 0 });
    releaseOrders();
  }
