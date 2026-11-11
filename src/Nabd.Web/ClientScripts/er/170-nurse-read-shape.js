  // Which people a message calls, and which comes first.
  function nurseVocs(t) {
    const R = E.nurse.rx;
    let iDoc = t.search(R.docv);
    const iSup = t.search(R.supv), iComp = t.search(R.compv);
    if (iDoc >= 0) {
      const m = t.slice(iDoc).match(R.docv);
      if (m && !/يا\s/.test(m[0]) && DOC_3P.test(t.slice(iDoc + m.index + m[0].length))) iDoc = -1;
    }
    let first = iDoc >= 0 && (iSup < 0 || iDoc <= iSup) ? 'doc' : iSup >= 0 ? 'sup' : null;
    // "يا أم يزن، دكتور طارق جاي": the relative is spoken to first.
    if (iComp >= 0 && (first === null || iComp < (first === 'doc' ? iDoc : iSup))) first = 'comp';
    const call = CALL_N.test(t), help = HELP_CALL.test(t);
    return { first, call, help, gen: SUPV_GEN.test(t), voc: (first !== null && first !== 'comp') || call || help };
  }
  // Every action and test a message names, whatever it says about it.
  const mentionedIds = t => [...E.nurse.acts.filter(a => hasAny(t, a.kw)).map(a => a.id), ...D.tests.filter(x => hasAny(t, x.kw)).map(x => x.id)];
  const openOrd = o => !o.cancelled && o.doneAt == null && !o.doctorDoes;
  // Who a message is for, in the nurse room; the same rules for the offline reader and the server's reading.
  // It only annotates the reading: apply() commits what it means.
  function nurseShape(read, t, text, online) {
    const N = E.nurse, X = N.esc;
    read.actions = (read.actions || []).slice(); read.tests = (read.tests || []).slice();
    read.facts = read.facts || []; read.exam = read.exam || []; read.tone = { ...(read.tone || {}) };
    const v = nurseVocs(t);
    if (v.voc) { read.facts = []; read.exam = []; }
    if (/(?:^| )(?:انا|معك|اسمي)(?: \S+)? (?:ال)?ممرض|ممرضتك|ممرضك(?: |$)/.test(t)) read.tone.introduced = true;
    if (AIRWAY_ASSESS.test(t)) { read.actions = read.actions.filter(a => a.id !== 'airway'); read.airwayAssess = true; }
    if (DRAW.test(t) && !read.tests.some(x => (testOf(x.id) || {}).group === 'lab')) read.draw = true;
    const callAct = read.actions.some(a => a.id === 'call_senior' || a.id === 'call_icu');
    read.escalate = v.call || v.help || callAct;
    read.help = v.help;
    const hasQ = /[؟?]/.test(text), rbPhrase = /(بعيد الاوامر|خليني اعيد|يعني بدك)/.test(t);
    const open = N.orders.filter(openOrd), openIds = open.map(o => o.id);
    // Review fixes 2026-11-07. A band on the wrist is not the allergy question.
    if (BAND.test(t) && !hasQ) { read.facts = read.facts.filter(f => f !== 'allergy'); read.band = true; }
    // An open order by the short name nurses use ("بعتت الكلى", "عطيته ليفو"), or "the drug" when one drug is open.
    if (!read.actions.length && !read.tests.length && open.length && EXEC_V.test(t) && !hasQ) {
      const hit = open.filter(o => ORDER_ALIAS[o.id] && ORDER_ALIAS[o.id].test(t));
      const drugs = open.filter(o => o.kind === 'act' && !o.reminder && isDrug(o.id));
      if (!hit.length && /(?:^| )(?:ال)?(?:دوا|دواء|ابره|حقنه|علاج)(?: |$)/.test(t)) {
        if (drugs.length === 1) hit.push(drugs[0]);
        else if (drugs.length > 1) { read.whichDrug = drugs.map(o => o.ar); read.noHelp = true; }
      }
      hit.forEach(o => (o.kind === 'test' ? read.tests.push({ id: o.id, reason: '', reason_ok: 'none' }) : read.actions.push({ id: o.id, agent: '', dose: '' })));
      if (hit.length) { read.facts = []; read.exam = []; }
    }
    if (!read.actions.length && !read.tests.length && /(?:خلصت|نفذت|عملت)\S* (?:كل )?(?:ال)?اوامر|(?:خلصت|عملت) كل (?:ا)?شي/.test(t)) { read.allOrders = true; read.facts = []; read.exam = []; }
    // "بقترح نعطيها فنتولين", "الدكتور رح يعطيها كورتيزون": a drug named, nothing given, no gap.
    if (SUGGEST.test(t)) {
      const plain = !/(بقترح|اقترح|نقترح)/.test(t);
      const keep = id => NURSE_OWN.has(id) || NURSE_TESTS.has(id) || id === 'oxygen' || (plain && openIds.includes(id));
      const sug = [...read.actions.map(a => a.id), ...read.tests.map(x => x.id)].filter(id => !keep(id));
      if (sug.length) { read.suggested = sug; read.noHelp = true; read.actions = read.actions.filter(a => keep(a.id)); read.tests = read.tests.filter(x => keep(x.id)); }
      else if (!read.actions.length && !read.tests.length && !read.facts.length && !read.exam.length) { read.planOnly = true; read.noHelp = true; }
      // A drug named in a plan is not a history question.
      if (!hasQ) read.facts = read.facts.filter(f => !HIST_FACTS.has(f) || f === 'allergy');
    }
    // Executing an order names its carrier ("بوتاسيوم عالسوائل") or an order already done: those are mentions.
    if (read.actions.some(a => openIds.includes(a.id)) || read.tests.some(x => openIds.includes(x.id))) {
      const doneOrd = id => N.orders.some(o => o.id === id && o.doneAt != null && !o.repeat) && !openIds.includes(id);
      const vehicle = id => id === 'fluids' && !openIds.includes('fluids') && /(?:عال|علي ال|على ال|مع ال|بال|في ال|ع ال)(?:سوائل|محلول|سيروم|سلاين)/.test(t);
      read.actions = read.actions.filter(a => !(doneOrd(a.id) || vehicle(a.id)));
      read.tests = read.tests.filter(x => !doneOrd(x.id));
    }
    const mentioned = mentionedIds(t);
    const namesOpen = mentioned.some(id => openIds.includes(id)) || read.actions.some(a => openIds.includes(a.id)) || read.tests.some(x => openIds.includes(x.id));
    // The doctor asked about allergies: a short answer in the next turns is for him.
    const allergen = Object.values(E.c.care).some(d => d.allergyKw && hasAny(t, d.allergyKw)) || /(اسبرين|aspirin|بنسلين|بنسيلين|penicillin|بروفين|ibuprofen)/.test(t);
    // («عنده ضغط وسكري» is history, not this answer: «ما عنده» alone, or with an allergy word, is.)
    const ALLERGY_ANS = /^(?:لا|لاء|لأ|اه|ايوه|ايوا|نعم|اكيد|مافي|ما في|ما بعرف|مش عارف|ما سالت\S*|لسا ما سالت\S*|مش متاكد\S*|nkda|no|yes)(?: |$)|^ما (?:عنده|عندها)$/;
    if (N.allergyAskedByDoc && !N.allergyAnswered && E.turns - N.allergyAskTurn <= 3 && !hasQ && !/(?:^| )(?:عندك|انت|انتي|معك|بتتحسس\S*)(?: |$)/.test(t)
      && ((ALLERGY_ANS.test(t) && wordsIn(t) <= 6) || ALLERGY_W.test(t) || (allergen && wordsIn(t) <= 4))) read.allergyReply = true;
    // Within the same turns, history said in the third person adds to the SBAR the doctor just heard.
    const histAdd = N.allergyAskedByDoc && !N.allergyAnswered && E.turns - N.allergyAskTurn <= 3 && !hasQ && !read.allergyReply && !read.actions.length && !read.tests.length
      && HIST_RX.test(t) && /(?:^| )(?:عنده|عندها|هو|هي|المريض\S*)(?: |$)/.test(t);
    // Read back or given while the doctor still waits for the allergy answer: the drugs he has not ordered yet.
    const heldIds = N.holdRel ? Object.entries(N.nm.orders).filter(([k, o]) => o.kind === 'act' && !o.reminder && !o.doctorDoes && isDrug(o.id || k) && orderDue(o)).map(([k, o]) => o.id || k) : [];
    const namesHeld = heldIds.length && (mentioned.some(id => heldIds.includes(id)) || read.actions.some(a => heldIds.includes(a.id)));
    if (namesHeld && !hasQ && !rbPhrase && read.actions.some(a => heldIds.includes(a.id))) { read.heldGive = read.actions.filter(a => heldIds.includes(a.id)).map(a => a.id); read.actions = read.actions.filter(a => !heldIds.includes(a.id)); }
    const dxQ = /(?:^| )(?:ال)?تشخيص|diagnos/.test(t) && !read.facts.length && !read.exam.length && !read.actions.length && !read.tests.length;
    const recWin = X.sbar && !X.sbar.none && E.turns - N.escDoneTurn <= 2 && /(?:^| )(?:تعال|تعالي|بسرعه|شوفها|شوفه|محتاجك|بحتاجك)(?: |$)/.test(t) && !read.actions.length && !read.tests.length;
    let to;
    if (read.allergyReply && v.first !== 'sup' && v.first !== 'comp') to = 'nurse';
    else if (v.first === 'comp') to = 'companion';
    else if (v.first === 'doc' || v.call || v.help) to = 'nurse';
    else if (v.first === 'sup') to = 'supervisor';
    else if (read.to === 'companion') to = 'companion';
    else if (read.toPat) to = 'patient';
    else if (X.awaiting) to = 'nurse';
    else if (N.rbTurns > 0 && X.calledAt !== null && namesOpen && (hasQ || rbPhrase)) to = 'nurse';
    else if (namesHeld && (hasQ || rbPhrase)) { to = 'nurse'; read.heldAsk = true; }
    else if (histAdd) { to = 'nurse'; read.facts = []; }
    else if (recWin) to = 'nurse';
    else if (dxQ) to = N.present ? 'nurse' : 'supervisor';
    else if ((read.suggested || read.planOnly) && !read.actions.length && !read.tests.length) to = 'supervisor';
    else if (read.heldGive && !read.actions.length && !read.tests.length) to = 'self';
    else if (read.whichDrug) to = 'supervisor';
    else if (v.gen && !read.actions.length && !read.tests.length) to = 'supervisor';
    else if (read.actions.length || read.tests.length) to = 'self';
    else if ((read.airwayAssess || read.draw || read.band || read.allOrders) && !read.facts.length && !read.exam.length) to = 'self';
    else if ((VITALS_Q.test(t) || NURSE_VITALS.test(t)) && !/(?:عندك|عنده|عندها|بتاخد|بياخد|بتاخذ|بيوخذ|معك)/.test(t)
      && ((!read.facts.length && !read.exam.length) || /(?:كم|قديش|شو) (?:ال)?(?:ضغط|نبض|اكسجين|ارقام|حراره|تنفس|ساتورشن|spo2|sat|سات)|(?:ال)?(?:ضغط|نبض|اكسجين|ارقام|حراره|تنفس|spo2|sat|سات)\S* (?:كم|قديش)/.test(t))) { read.facts = []; read.exam = []; read.actions = [{ id: 'bp_repeat', agent: '', dose: '' }]; to = 'self'; }
    else if (online && read.to === 'nurse' && !read.actions.length && !read.tests.length) to = 'nurse';
    else if (online && read.to === 'supervisor') to = 'supervisor';
    else to = 'patient';
    // Re-routed to the relative: telling them what happens next is explaining.
    if (to === 'companion' && read.to !== 'companion') read.tone.explained = read.tone.explained || /(?:^| )[وف]?(?:رح|راح|عم ن\S*|بنعطي|بنعمل|الوضع|حالتها|حالته|جاي|جايه|بيجي|بتيجي)(?: |$)/.test(t);
    // Explaining the plan to the relative ("رح نعطيها بخار") asks them nothing.
    if (to === 'companion' && read.tone.explained && !hasQ) read.facts = [];
    if (read.suggested && (to === 'patient' || to === 'companion') && !hasQ) { read.tone.explained = true; read.facts = []; }
    // Messages to the doctor never execute; a read-back is noted; a plain "I'm giving X" with an open order does run.
    if (to === 'nurse') {
      read.mentioned = [...new Set([...read.actions.map(a => a.id), ...read.tests.map(x => x.id), ...mentioned])];
      if (namesOpen && (hasQ || rbPhrase)) read.readBack = true;
      if (namesOpen && !hasQ && !rbPhrase && !X.awaiting && X.sbar !== null && !v.call && !v.help && !read.allergyReply && (read.actions.length || read.tests.length)) { read.readBack = true; to = 'self'; }
      else { read.actions = []; read.tests = []; }
    }
    if (to === 'nurse' && read.allergyReply) read.facts = [];
    // A drug named in "I'm giving X" is not a history question; words to the doctor are not asked of the patient.
    if (to === 'nurse' || (to === 'self' && !hasQ)) { read.facts = []; read.exam = to === 'nurse' ? [] : read.exam; }
    read.to = to;
    read.toDoc = to === 'nurse';
    if (to === 'supervisor') read.kind = 'help'; else if (read.kind === 'help') read.kind = 'other';
    return read;
  }
