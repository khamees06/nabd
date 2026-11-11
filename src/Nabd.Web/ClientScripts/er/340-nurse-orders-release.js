  /* ---------- nurse mode: the doctor's orders ---------- */
  function orderDue(o) {
    const N = E.nurse, g = o.gate || {};
    if (o.when === 'phone') return true;
    if (o.when === 'gated') return (!g.needTest || (E.tests[g.needTest] && E.tests[g.needTest].back)) && (!g.needDone || E.done.has(g.needDone));
    if (o.when === 'collapse') return N.present && (fell() || untreatedSbp() < 90 || E.stage >= 3) && (!g.needDone || E.done.has(g.needDone));
    if (o.when === 'vt') return N.present && E.vtNow;
    if (o.when === 'stage3') return N.present && E.stage >= 3;
    return false;
  }
  // An order's own stop rule (CTPA once the pressure falls, NIV at stage 3).
  const cancelNow = src => !!((src.cancelSbp && untreatedSbp() < src.cancelSbp) || (src.cancelStage && E.stage >= src.cancelStage));
  // What the doctor says for one order: the step's name, the case file's own words, and the single dose chosen.
  const ordItem = o => o.ar + (o.show ? ' ' + o.show : '') + (o.pick ? '، الجرعة: ' + o.pick : '');
  // Returns true when the doctor said something.
  function releaseOrders() {
    if (!E || E.over || !NM()) return false;
    const N = E.nurse, X = N.esc;
    if (!reached() || X.awaiting) return false;
    // Waiting on the answer to «في حساسية من أدوية؟»: the drugs wait, the tests and the rest do not;
    // and nothing waits once the patient is critical.
    if (N.holdRel && (E.stage >= 3 || E.vtNow)) N.holdRel = null;
    const fresh = [], cancelled = [];
    for (const [key, o] of Object.entries(N.nm.orders)) {
      const id = o.id || key;
      if (N.orders.some(x => x.key === key) || !orderDue(o)) continue;
      if (N.holdRel && o.kind === 'act' && !o.reminder && !o.doctorDoes && isDrug(id)) continue;
      const care = E.c.care[id];
      if (o.kind === 'act' && !o.doctorDoes && care && tooEarly(care)) continue;
      // An order its own stop rule already rules out is never given (no CT ordered and cancelled in one breath).
      if (cancelNow(o)) continue;
      const meta = o.kind === 'test' ? testOf(id) : actOf(id);
      if (!meta) continue;
      const ord = { key, id, kind: o.kind, ar: meta.ar, show: o.show || '', exec: o.exec || '', pick: o.pick || '', at: E.sim, doneAt: null, cancelled: false, reminder: !!o.reminder, doctorDoes: !!o.doctorDoes, optional: !!o.optional, repeat: !!o.repeat, when: o.when, line: o.line || '' };
      // A step already done on the nurse's own counts as done.
      const before = o.kind === 'test' ? (E.tests[id] ? E.tests[id].at : null) : !o.doctorDoes && E.done.has(id) ? E.done.get(id).at : null;
      if (before !== null) ord.doneAt = before;
      N.orders.push(ord);
      fresh.push(ord);
    }
    for (const o of N.orders) {
      const src = N.nm.orders[o.key] || {};
      if (o.cancelled || o.doneAt != null) continue;
      if (cancelNow(src)) { o.cancelled = true; o.cancelAt = E.sim; cancelled.push(o); log('order', 'ألغى الطبيب: ' + o.ar); }
    }
    const first = fresh.length && N.ordersAt === null;
    if (fresh.length) { if (first) N.ordersAt = E.sim; N.relTurn = E.turns; N.rbTurns = 2; }
    let spoke = false;
    cancelled.forEach(o => { const src = N.nm.orders[o.key]; if (src.cancelLine) { docSay(src.cancelLine); spoke = true; } });
    const speak = fresh.filter(o => !o.doctorDoes && !o.cancelled);
    const acts = speak.filter(o => o.kind === 'act' && !o.reminder), tests = speak.filter(o => o.kind === 'test' && !o.reminder), rem = speak.filter(o => o.reminder && o.doneAt == null);
    // One line for everything released now; each item is only the step's name and the case file's own words.
    const item = ordItem;
    if (acts.length || tests.length || rem.length) spoke = true;
    if (acts.length || tests.length || rem.length) {
      let lead = first ? (N.present ? 'تمام. بدي: ' : 'تمام، ' + comes() + '. لحد ما أوصل بدي: ') : fresh.some(o => o.when === 'gated' && ((N.nm.orders[o.key] || {}).gate || {}).needTest) ? 'طلعت النتيجة. هسا بدي: ' : fresh.some(o => o.when === 'gated') ? 'تمام. هسا بدي: ' : 'هسا بدي: ';
      if (N.relLead && !first) lead = N.relLead;
      let line = '';
      if (acts.length || tests.length) line = lead + acts.map(item).join('، و') + (tests.length ? (acts.length ? '. وبدي ' : '') + tests.map(item).join('، و') : '') + '.';
      else if (first) line = N.present ? 'تمام.' : 'تمام، ' + comes() + '.';
      if (rem.length) line += (line ? ' ' : '') + 'ولسا ما انعمل: ' + rem.map(o => o.ar).join('، و') + '.';
      docSay(line);
    }
    fresh.forEach(o => log('order', 'أمر الطبيب: ' + item(o)));
    fresh.filter(o => o.doctorDoes && o.when !== 'vt').forEach(docDoes);
    // VT with a pulse: the doctor shocks while it lasts.
    N.orders.filter(o => o.doctorDoes && o.when === 'vt').forEach(o => { if (E.vtNow && N.present && E.sim - N.lastShock > 0.3) docDoes(o); });
    buildOrders();
    return spoke;
  }
  // What the doctor does with his own hands: no credit to the nurse.
  function docDoes(o) {
    const N = E.nurse, id = o.id, meta = actOf(id), care = E.c.care[id] || {};
    if (!meta || E.over) return;
    N.docDoing = true;
    try {
      if (id === 'shock') {
        // As many shocks as the catalog allows; after that the VT is the trainee's failure to escalate in time.
        const prev = E.done.get('shock');
        if (!E.vtNow || (prev && prev.n >= ((meta.repeat || {}).max || 6))) return;
        N.lastShock = E.sim;
        give({ id, dose: '', agent: '' }, meta, care);
        sys(N.sex === 'F' ? 'أجرت الطبيبة صدمة كهربائية متزامنة.' : 'أجرى الطبيب صدمة كهربائية متزامنة.');
      } else if (id === 'airway') {
        if (!E.done.has('airway')) give({ id, dose: '', agent: '' }, meta, care);
        else log('action', 'تنبيب على يد ' + docT());
        N.interv.push({ id, at: E.sim, ar: meta.ar, byDoc: true });
        if (o.line) docSay(o.line);
      } else {
        if (!E.done.has(id)) give({ id, dose: '', agent: '' }, meta, care);
        if (id === 'cath_lab') docSay('فعّلت القسطرة. جهّزوه للنقل.');
      }
      o.doneAt = E.sim;
    } finally { N.docDoing = false; }
  }
