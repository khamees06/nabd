  function netRate() {
    let r = E.c.risk.rate;
    for (const a of E.effects) if (E.sim >= a.from) r -= a.slow;
    // Neither settles on its own, whatever else has been given.
    if (E.anaph && !E.anaph.treated) r = Math.max(r, 0) + 3;
    if (E.vtNow) r = Math.max(r, E.c.risk.rate);
    // Supportive care holds a septic patient; only the cause turns him round.
    const hold = E.c.risk.hold;
    if (hold && !E.done.has(hold.until) && E.risk <= hold.at) r = Math.max(r, 0);
    return r;
  }

  function tick(now) {
    if (!E || E.over) return;
    const dt = Math.max(0, Math.min(2, (now - last) / 1000));
    last = now;
    const rate = netRate();
    const step = dt * PACE / 60;
    E.sim += step;
    E.risk = clamp(E.risk + rate * step, RISK_FLOOR, 100);
    E.anxTop = Math.max(E.anxTop, E.anx);
    if (E.sim - E.riskLogAt >= 0.25) { E.riskLog.push([E.sim, E.risk]); E.riskLogAt = E.sim; }
    $('er-clock').textContent = String(Math.floor(E.sim)).padStart(2, '0') + ':' + String(Math.floor((E.sim % 1) * 60)).padStart(2, '0');
    if (E.sim - E.paintAt >= 0.12) { paint(); E.paintAt = E.sim; }
    for (const j of E.jobs.filter(x => E.sim >= x.at)) { E.jobs.splice(E.jobs.indexOf(j), 1); j.fn(); }
    stageCheck();
    if (NM()) nurseTick();
    // The patient is steady: the supervisor asks whether he is ready to hand over, once.
    // (Nurse mode: only once the doctor knows, and the instructor asks for an SBAR handover.)
    if (!E.nudged && E.risk <= E.c.risk.watch - 6 && netRate() <= 0 && !keyMissing().length && E.done.size >= 3 && E.sim > 2 && (!NM() || E.nurse.esc.calledAt !== null || E.nurse.present) && (NM() || E.turns - (E.dTurn ?? -9) >= 2 || E.sim - (E.dAt ?? -9) >= 1)) {
      E.nudged = true;
      later(0.2, () => person('d', NM() ? 'الأرقام استقرت. جاهز تسلّم الحالة بصيغة SBAR؟' : pickOf(['الأرقام استقرت. بقي إشي بدك تعمله؟ ولا جاهز تسلّم؟', 'تمام، الوضع أحسن. شو الخطة، والوجهة؟'])));
    }
    // An order waiting on a dose is not given: the nurse says so rather than let him think it was.
    const open = E.pending;
    if (open && open.type === 'dose' && !open.nagged && E.sim - (open.since || 0) > 0.75 && (NM() || E.turns === open.turnAt)) {
      open.nagged = true;
      nurse(`دكتور، ${open.name} لسا ما أعطيته. ${open.tip}${open.sug ? '، ماشي؟' : ''}`);
    }
    const hold = E.c.risk.hold;
    if (hold && !E.holdAsked && !E.done.has(hold.until) && E.sim > 7 && E.risk <= hold.at + 1) {
      E.holdAsked = true;
      person('d', NM() ? (E.nurse.orders.some(o => openOrd(o)) ? 'الأرقام ما تحسنت. في أمر من الدكتور لسا ما تنفّذ؟' : 'الأرقام ما تحسنت. لازم الدكتور يعرف؟') : hold.ask || 'الأرقام ثابتة بس ما تحسنت. شو الخطوة الناقصة؟');
    }
    alarm(now);
    if (E.risk >= 100) arrest();
  }

