  // An unanswered question comes back, and nothing is given on silence.
  function remind(open) {
    open.wait = (open.wait || 0) + 1;
    if (!NM()) {
      // A reading or a reason is never asked again once the trainee moved on; a vague "which drug?" gives back what it held.
      if (open.type === 'which') { E.pending = null; restoreHeld(); nextQuestion(); return; }
      if (open.type === 'interpret' || open.type === 'reason' || open.type === 'offer') { settle(q => q === open); return; }
      // (chat fix 2 2026-11-08) A challenged order is never asked again as "give it or not?": once he moves on, it is
      // closed as not given, said once.
      // The fluids a held insulin waits for are never parked: she keeps asking for them.
      const guards = open.type === 'dose' && open.a && E.queue.some(([q]) => q.type === 'unsafe' && q.def && q.def.early && ((E.c.care[q.a.id] || {}).stableHarm || {}).unlessDone === open.a.id);
      E.tail = { p: open, park: open.type === 'unsafe' || (!guards && (open.asks || 1) >= 2) };
      return;
    }
    if (open.type === 'interpret') {
      if (open.wait >= 2) {
        settle(q => q === open);
        // A question left unanswered is closed out loud, once a case, not dropped in silence.
        if (!E.readNudged) { E.readNudged = true; person('d', `طيب، ارجعلي عالـ${testOf(open.id).en} لما تخلّص هالخطوة.`); }
      }
      return;
    }
    // She names the drug she is waiting on: a busy doctor has forgotten which one.
    const nm = open.name || (open.a && actOf(open.a.id) ? actOf(open.a.id).ar : 'الدوا');
    if (open.wait >= 4) {
      nurse(open.type === 'unsafe' ? `ما رح أعطي ${nm} قبل ما تأكدلي.` : open.type === 'dose' ? `ما بعطي ${nm} بدون جرعة. احكيلي لما تقرر.` : 'ما بطلبه بدون استطباب. احكيلي لما تقرر.');
      settle(q => q === open);
    } else if (open.wait % 2 === 0) {
      nurse(open.type === 'unsafe' ? `دكتور، ${nm}: بعطيه ولا لأ؟` : open.type === 'dose' ? (open.tip ? `دكتور، ${nm}: ${open.tip}${open.sug ? '، ماشي؟' : ''}` : `دكتور، ${nm}: قديش بدك؟`) : 'دكتور، لسا مستنية جوابك على طلبك.');
    }
  }

