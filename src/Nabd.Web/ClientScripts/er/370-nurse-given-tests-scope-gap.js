  // Called from give() in nurse mode: what was given, for safety and reassessment.
  function nurseGave(a, meta) {
    const N = E.nurse;
    if (meta.dose || a.id === 'airway') {
      const at = E.sim;
      if (!N.docDoing || a.id === 'airway') N.interv.push({ id: a.id, at, ar: meta.ar, byDoc: N.docDoing });
      later(3, () => {
        if (E.over || N.vchecks.some(x => x > at) || N.reassess7 >= 2 || E.sim - N.last7 < 2) return;
        N.reassess7++; N.last7 = E.sim; E.hints++;
        person('d', 'بعد آخر تدخل، شو تغيّر بالأرقام؟');
      });
    }
    if (isDrug(a.id) && !N.docDoing) {
      N.given.push({ id: a.id, at: E.sim, allergyAsked: E.facts.has('allergy') });
      // Live check 2026-11-07: after a guessed "no allergy" to the doctor, say plainly that it was a guess.
      if (!E.facts.has('allergy')) later(0.01, () => dOnce('6', N.allergyGuess !== null
        ? 'حكيت لل' + docW().slice(2) + ' ما في حساسية، بس ما سألت المريض ولا أهله. اسأل هسا قبل الجرعة الجاية.'
        : 'عطيت الدوا قبل ما تسأل عن الحساسية؟ اسأل هسا وبلّغ ' + docW() + '.'));
    }
    const o = N.orders.find(x => x.kind === 'act' && x.id === a.id && openOrd(x));
    if (o && !N.docDoing) o.doneAt = E.sim;
    buildOrders();
  }
  function nurseTest(id, reason, ok) {
    if (!E || E.over) return false;
    releaseOrders(); // a cancellation due now (CTPA in shock) is applied before the request
    const N = E.nurse, ord = N.orders.find(o => o.kind === 'test' && o.id === id && openOrd(o));
    if (NURSE_TESTS.has(id) || ord || E.tests[id]) {
      orderTest(id, reason, ok);
      const o = N.orders.find(x => x.kind === 'test' && x.id === id && x.doneAt == null && !x.cancelled);
      if (o && E.tests[id]) o.doneAt = E.tests[id].at;
      buildOrders();
      return true;
    }
    // A click on an order the doctor cancelled this very moment (CTPA as the pressure fell) is no attempt.
    if (N.orders.some(o => o.kind === 'test' && o.id === id && o.cancelled && o.cancelAt === E.sim)) { sys('أُلغي هذا الطلب قبل تنفيذه.'); buildOrders(); return false; }
    scopeGap('test', id);
    return false;
  }
  // Out of the nurse's own scope: nothing is given, nothing changes in the patient; it is recorded.
  function scopeGap(kind, id, why, ord) {
    const N = E.nurse, meta = kind === 'test' ? testOf(id) : actOf(id), ar = (meta || {}).ar || id;
    N.scope.push({ id, kind, at: E.sim, why: why || 'no-order' });
    log('scope', 'دون أمر طبيب: ' + ar);
    if (why === 'wrong-agent') {
      sys('لم يُعطَ: ما كتبته ليس الدواء الذي طلبه الطبيب (' + ((ord && (ord.show || ord.ar)) || ar) + ').');
      E.hints++; person('d', 'هاد مش الدوا اللي انطلب.');
      return;
    }
    // Airway support beyond basic life support, the cath lab and a shock are the doctor's steps, not drugs.
    const note = why === 'doctor-step' ? (id === 'airway' ? 'التنبيب والتهوية غير الغازية بقرار الطبيب، أما فتح المجرى والتهوية بالأمبو فضمن صلاحيتك' : 'هذا إجراء يقرره الطبيب ويجريه') : SCOPE_NOTE;
    if (!N.scopeSaid.has(id)) { N.scopeSaid.add(id); sys('لم يُنفَّذ: ' + ar + ' يحتاج أمراً من الطبيب (' + note + ').'); }
    else sys('لم يُنفَّذ: يحتاج أمر طبيب.');
    const F = E.nurse.sex === 'F';
    if (why === 'allergen' && E.facts.has('allergy')) { dOnce('allergen:' + id, 'استنى! ' + (E.c.patient.sex === 'F' ? 'المريضة عندها' : 'المريض عنده') + ' حساسية من هاد الدوا، وأصلاً الدوا بدو أمر من ' + docW() + '.'); return; }
    const distinct = [...new Set(N.scope.filter(x => x.why !== 'wrong-agent').map(x => x.id))];
    if (distinct.length <= 3 && distinct.includes(id)) dOnce('5:' + id, 'هاد بدو أمر من ' + docW() + '. إذا شايفه لازم، بلّغ' + (F ? 'ها' : 'ه') + ' واقترحه.');
  }

