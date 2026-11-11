  function nurseStageRise(s) {
    const N = E.nurse, X = N.esc;
    if (X.calledAt !== null && X.reNeeded === null) { X.reNeeded = s; X.reNeededAt = E.sim; }
    if (s >= 2 && !reached()) dOnce('4', 'المريض عم يتدهور. اتصل ب' + docW() + ' هسا، وجهّز الـSBAR.');
    if ((s === 3 || E.vtNow) && !reached()) {
      sys(N.sex === 'F' ? 'سمعت الطبيبة إنذار المونيتور وحضرت إلى السرير.' : 'سمع الطبيب إنذار المونيتور وحضر إلى السرير.');
      X.by = 'alarm'; N.alarmAt = E.sim;
      doctorArrives();
    } else if (s >= 2 && X.calledAt !== null && !N.present && !X.awaiting) later(0.2, doctorArrives);
    releaseOrders();
  }
  function nurseTick() {
    const N = E.nurse, X = N.esc;
    if (E.over) return;
    const v = live();
    // One oxygen threshold for the nurse's own protocol, the instructor's nudge and its words.
    if (N.lowAt === null && v.spo2 < O2_OWN) N.lowAt = E.sim;
    if (N.allergyAt === null && E.facts.has('allergy')) N.allergyAt = E.sim;
    if (E.tempKnown && N.tempAt === null) N.tempAt = E.sim;
    if (E.sim >= 2 && !N.vchecks.length) dOnce('1', 'العلامات الحيوية كاملة انقاست؟ ابدأ بالـABCDE.');
    if (N.lowAt !== null && E.sim - N.lowAt >= 1 && v.spo2 < O2_OWN && !E.done.has('oxygen')) dOnce('2', 'الـSpO2 تحت ' + O2_OWN + '. شو بيسمحلك بروتوكول القسم تعمل هسا بدون ما تستنى أمر؟');
    if (!reached() && E.sim > escBy()) dOnce('3', 'الأرقام هاي شو بتحكيلك؟ مين لازم يعرف فيها هسا؟');
    if (N.orders.some(o => openOrd(o) && !o.reminder && E.sim - o.at >= 3)) dOnce('8', 'في أوامر من ' + docW() + ' لسا ما تنفّذت. شو أولويتك؟');
    // The allergy question went unanswered for a minute: the orders come anyway.
    if (N.holdRel && E.sim - N.holdRel.at >= 1) { N.holdRel = null; releaseOrders(); }
    // An open order its own stop rule now rules out is cancelled at once, so the panel never offers a stale one.
    if (N.orders.some(o => openOrd(o) && cancelNow(N.nm.orders[o.key] || {}))) releaseOrders();
    // The doctor waits on the line, then comes.
    if (X.awaiting && X.awaitAt !== null) {
      if (!X.nagged && E.sim - X.awaitAt >= 1.5) { X.nagged = true; docSay('ألو؟ شو الوضع عندك؟'); }
      else if (E.sim - X.awaitAt >= 3) escGiveUp();
    }
  }

