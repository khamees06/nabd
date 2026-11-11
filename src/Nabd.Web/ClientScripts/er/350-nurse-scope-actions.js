  // The trainee's actions, judged against the nurse's scope.
  function nurseAct(a, text) {
    if (!E || E.over) return;
    const N = E.nurse, id = a.id, meta = actOf(id), care = E.c.care[id] || {};
    if (!meta) return;
    if (id === 'call_senior' || id === 'call_icu') {
      if (!reached()) escalate(text);
      else if (id === 'call_icu') sys(docKnows());
      return;
    }
    const tx = norm(text || '');
    if (id === 'airway' && BLS_AIR.test(tx) && !ADV_AIR.test(tx)) { basicAirway(); return; }
    if (id === 'bp_repeat' || id === 'temp') {
      N.vchecks.push(E.sim);
      const prev = E.done.get(id);
      E.done.set(id, prev ? { ...prev, n: prev.n + 1, last: E.sim } : { at: E.sim, last: E.sim, n: 1, dose: '', ok: 'good', amt: 0, top: 0 });
      log('check', meta.ar);
      if (id === 'temp') { E.tempKnown = true; if (N.tempAt === null) N.tempAt = E.sim; paint(); sys('الحرارة الآن ' + E.c.temp.toFixed(1) + ' °C.'); }
      else { E.bpAt = 0; paint(); sys('على المونيتور الآن: ' + spokenVitals() + '.'); }
      return;
    }
    let ord = N.orders.find(o => o.kind === 'act' && o.id === id && openOrd(o));
    // An order the case file gives in repeated boluses stays open for the next one, within its own limits.
    if (!ord) ord = N.orders.find(o => o.kind === 'act' && o.id === id && o.repeat && !o.cancelled && o.doneAt != null);
    if (id === 'oxygen') {
      if (ord) { nurseExec(ord, a, text); return; }
      // Already running: saying the device again without a new flow changes nothing.
      if (E.done.has('oxygen') && !a.dose) { const d = E.done.get('oxygen').dose; sys('الأكسجين يعمل بالفعل' + (d ? ' (' + d + ')' : '') + '.'); return; }
      if (Math.round(live().spo2) < O2_OWN || E.done.has('oxygen')) { ownOxygen(a, text); return; }
      const sp = Math.round(live().spo2);
      if (!N.notIndicated.some(x => x.id === id && E.sim - x.at < 1)) { N.notIndicated.push({ id, at: E.sim, spo2: sp }); log('scope', 'أكسجين والإشباع ضمن الهدف'); }
      sys('لم يُنفَّذ: الإشباع ' + sp + '% ضمن الهدف، وبروتوكول الأكسجين المستقل يبدأ عند إشباع أقل من ' + O2_OWN + '%.');
      return;
    }
    if (ord) { nurseExec(ord, a, text); return; }
    if (NURSE_OWN.has(id)) { order(a, text); return; }
    const allergen = (care.allergyKw && allergicTo(a, care, text)) || (care.harm && care.needFact === 'allergy');
    scopeGap('act', id, allergen ? 'allergen' : id === 'airway' || DOCTOR_ONLY.has(id) ? 'doctor-step' : '');
  }
  // Opening the airway or bagging: recorded, no definitive-airway effect, and the doctor is needed now.
  function basicAirway() {
    const N = E.nurse;
    N.bls.push(E.sim);
    log('action', 'فتح المجرى الهوائي أو التهوية بالأمبو (إنعاش أساسي)');
    sys('سُجّل: فتح المجرى الهوائي والتهوية بالأمبو من الإنعاش الأساسي ضمن صلاحيتك. التنبيب والتهوية غير الغازية بقرار الطبيب.');
    if (!reached() && E.stage >= 3) escalate('', true);
    else if (!reached()) dOnce('bls', 'وبنفس الوقت بلّغ ' + docW() + ' فوراً.');
  }
  function ownOxygen(a, text) {
    if (!a.dose) {
      ask({ type: 'dose', a: { ...a }, name: actOf('oxygen').ar, tip: '', sug: undefined, ask: 'The nurse instructor asked which oxygen device and flow the trainee will use. good = a device and a flow in L/min, partial = roughly right, wrong = unsafe, na = not a reply, withdraw = the trainee drops it.' }, 'أكسجين، تمام. أي وسيلة وعلى كم لتر؟', 'd');
      return;
    }
    order(a, text);
  }
