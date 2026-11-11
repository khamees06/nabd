  /* ---------- nurse mode: one message ---------- */
  async function handleNurse(text) {
    const my = E, N = E.nurse;
    // The doctor is on the line waiting for the SBAR: the message goes to him, with no server call.
    if (N.esc.awaiting) {
      const rd = localRead(text), v = nurseVocs(nz(text));
      // An SBAR names the patient: only a short line, or the instructor called by name, goes elsewhere.
      const elsewhere = (v.first === 'sup') || ((rd.to === 'patient' || rd.to === 'companion') && wordsIn(text) <= 6 && v.first !== 'doc');
      if (!elsewhere) { escTurn(text); return; }
    }
    const dots = typing();
    const pending = E.pending;
    const r = await call({ text, pending: pending ? { ask: pending.ask } : undefined });
    if (!r && !ACT && !actRetried) { actRetried = true; await loadAct(); }
    dots.remove();
    if (E !== my || E.over) return;
    let read;
    if (r && r.read) { read = r.read; read.text = text; nurseShape(read, nz(text), text, true); }
    else { read = localRead(text); read.text = text; }
    // The server may voice the patient, the relative or the instructor; never the doctor.
    const voiced = r && !r.voiceFailed && r.reply && r.to === read.to && ['patient', 'companion', 'supervisor'].includes(read.to);
    const reply = voiced ? r.reply : r && r.held && read.to === 'supervisor' ? instructorLine(read, norm(text)) : localReply(read);
    apply(read, text, read.to, reply);
  }
  function escTurn(text) {
    E.turns++;
    E.busyTurn = E.turns;
    escReply(text);
    director('turn');
  }
  // What apply() commits for a nurse-mode reading, before the actions run.
  function nursePre(read, text) {
    const N = E.nurse, X = N.esc, t = nz(text);
    if (read.readBack && N.orders.length && !N.readBack && E.turns - N.relTurn <= 2) N.readBack = true;
    if (read.airwayAssess && N.airwayAt === null) { N.airwayAt = E.sim; sys('سُجّل تقييمك للمجرى الهوائي.'); }
    if (read.draw && N.drawn === null) { N.drawn = E.sim; sys('سُحبت عينات الدم وحُفظت لحين طلب الطبيب.'); }
    // The allergy band goes on only for an allergy the trainee has asked about.
    if (read.band || BAND.test(t)) {
      if (E.facts.has('allergy')) { if (!N.bandNoted) { N.bandNoted = true; sys('سُجّلت الحساسية على الملف ووُضع سوار الحساسية.'); } }
      else if (read.band) sys('لم تُسأل الحساسية بعد: اسأل المريض أو أهله أولاً.');
    }
    if (read.allOrders) {
      const open = N.orders.filter(o => openOrd(o) && !o.reminder);
      sys(!N.orders.length ? 'لم يصدر أي أمر من الطبيب بعد.' : open.length ? 'لم يُنفَّذ بعد من أوامر الطبيب: ' + open.map(o => o.ar).join('، و') + '.' : 'نُفِّذت كل أوامر الطبيب.');
    }
    if (read.toDoc && reached() && ALLERGY_W.test(t) && !read.allergyReply) N.allergyToldDoc = true;
    // The doctor's own allergy question, answered.
    if (read.allergyReply && read.toDoc) { allergyAnswer(t); read.actions = []; read.tests = []; return; }
    // A drug the doctor will order once he hears about allergies: not given, and no scope gap.
    if (read.heldGive && read.heldGive.length) sys('لم يُنفَّذ: لم يطلب الطبيب الأدوية بعد، فهو ينتظر جوابك عن الحساسية.');
    if (read.heldAsk && read.toDoc) { docSay('قلّي أول: في حساسية من أدوية؟'); read.actions = []; read.tests = []; return; }
    const icu = (read.actions || []).some(a => a.id === 'call_icu');
    if (read.help) helpCall();
    if (read.escalate || read.toDoc) {
      // A call said to the relative or a code call is not the SBAR itself.
      if (!reached()) { escalate(text, read.to === 'companion' || read.help); if (read.help) later(0.2, doctorArrives); }
      else if (read.help) { X.contacts.push({ at: E.sim, kind: 'update' }); if (X.reNeeded !== null && X.updateAt === null) X.updateAt = E.sim; if (!N.present) later(0.2, doctorArrives); }
      else if (icu) sys(docKnows());
      else if (read.escalate) reEscalate(read, text);
      else docLine(read, t);
    }
    read.actions = (read.actions || []).filter(a => a.id !== 'call_senior' && a.id !== 'call_icu');
  }
  // "نادوا فريق الإنعاش": recorded as its own step.
  function helpCall() {
    const N = E.nurse;
    N.helpAt.push({ at: E.sim, stage: E.stage, vt: !!E.vtNow });
    log('action', 'نداء فريق الإنعاش');
    sys('سُجّل نداء فريق الإنعاش.');
  }
  // The answer to «في حساسية من أدوية؟»; the orders the doctor held for it follow.
  function allergyAnswer(t) {
    const N = E.nurse;
    N.allergyAnswered = true;
    const unknown = /(ما بعرف|مش عارف|ما سالت|مش متاكد)/.test(t);
    if (unknown) docSay('اسأل هسا قبل أي دوا.');
    else {
      // "No allergy" said before anyone asked the patient or the family is a guess, not a report.
      const neg = /^(?:لا|لاء|لأ|مافي|ما في|ما عنده|ما عندها)(?: |$)/.test(t) || /(?:ما في|مافي|ما عند\S*) حساسي/.test(t);
      if (neg && !E.facts.has('allergy')) N.allergyGuess = E.sim;
      else N.allergyToldDoc = true;
    }
    const held = !!N.holdRel;
    N.holdRel = null;
    N.relLead = unknown ? 'بدي: ' : 'تمام. بدي: ';
    const spoke = held && releaseOrders();
    N.relLead = null;
    if (!spoke && !unknown) docSay('تمام.');
  }
  function nursePost(read, to) {
    const N = E.nurse, X = N.esc;
    if (N.rbTurns > 0 && N.relTurn < E.turns) N.rbTurns--;
    if (X.awaiting && ['patient', 'companion', 'supervisor'].includes(to)) {
      X.unans++;
      if (X.unans === 2 && !X.nagged) { X.nagged = true; docSay('ألو؟ شو الوضع عندك؟'); }
      else if (X.unans >= 4) escGiveUp();
    }
  }

