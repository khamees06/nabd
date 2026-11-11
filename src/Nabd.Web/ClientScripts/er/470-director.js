  function director(evt) {
    if (!E || E.over || evt === 'addressed') return;
    const a = E.anx, turns = E.turns - E.comp.lastTurn, mins = E.sim - E.comp.lastAt;
    // Waiting outside, the relative comes back in only for a crisis.
    if (E.sim < E.comp.outUntil) { if (evt === 'alarm' && E.stage >= 3) E.comp.outUntil = 0; else return; }
    if (evt === 'alarm' || evt === 'worse') { if (mins >= 0.5) breakIn(evt); return; }
    // The first moments belong to the doctor: the relative said their piece on arrival.
    // (chat fix 2026-11-08: in the doctor room, the first two messages, whatever the clock says.)
    if (NM() ? E.turns < 3 && E.sim < 1.5 : E.turns < 3) return;
    if (evt === 'better') { if (mins >= 0.5) breakIn('calm'); return; }
    if (turns < 3 || mins < 1.2) return;
    const has = k => fresh(compPool(k)).length > 0;
    if (!NM() && evt !== 'procedure') {
      /* (chat fix 2026-11-08) Doctor room: a clue, a demand or "nobody answers me" only in a real lull: nothing ordered
         this turn, no question open, the patient not crashing; a demand only when worried and not just reassured. */
      const C = E.comp, orderedNow = E.busyTurn === E.turns, openQ = !!E.pending || !!E.askedThisTurn;
      // (chat fix 2 2026-11-08) Nothing from the relative while the trainee talks to the supervisor.
      if (orderedNow || openQ || E.stage >= 2 || C.count >= 6 || E.lastTo === 'supervisor') return;
      const waited = C.asked !== null ? E.turns - C.asked : 0;
      if (!C.angry && a >= 85 && C.ignored >= 2 && !E.comm.explained && waited >= 3 && has('angry')) { breakIn('angry'); return; }
      const unheard = waited >= 3 || E.turns - C.heardTurn >= 5;
      if (unheard && C.ignored < 2 && a >= 45 && has('ignored') && Math.random() < 0.6) { breakIn('ignored'); return; }
      const extraOk = E.turns >= 4 && C.extra < 1 && a >= 55 && E.stage >= 1 && E.turns - (E.betterTurn ?? -9) > 2 && E.turns - C.explainedTurn > 5 && has('extra');
      const pick = [(C.infos || 0) < 2 && has('info') && 'info', extraOk && 'extra'].filter(Boolean);
      if (pick.length && Math.random() < 0.55) breakIn(pickOf(pick));
      return;
    }
    if (evt === 'procedure') {
      if (E.comp.procs < 2 && has('procedure') && Math.random() < clamp(a / 110, 0.2, 0.6)) { E.comp.procs++; breakIn('procedure'); }
      return;
    }
    // A lull. A doctor at work hears only something worth hearing; one who is not
    // hears the question that went unanswered, and real anger only after real neglect.
    const waited = E.comp.asked !== null ? E.turns - E.comp.asked : 0;
    if (busyNow()) { if (has('info') && Math.random() < 0.3) breakIn('info'); return; }
    if (!E.comp.angry && a >= 85 && E.comp.ignored >= 2 && !E.comm.explained && waited >= 3 && has('angry')) { breakIn('angry'); return; }
    const unheard = waited >= 3 || E.turns - E.comp.heardTurn >= 5;
    if (unheard && E.comp.ignored < 2 && a >= 45 && has('ignored') && Math.random() < 0.6) { breakIn('ignored'); return; }
    const pick = [has('info') && 'info', E.turns >= 4 && E.comp.extra < 2 && has('extra') && 'extra'].filter(Boolean);
    if (pick.length && Math.random() < 0.55) breakIn(pickOf(pick));
  }

  function breakIn(trig) {
    let list = fresh(compPool(trig));
    // (chat fix 2026-11-08) Doctor room: a cannula gets a needle line, a drug a drug line, a tube a tube line.
    if (!NM() && trig === 'procedure') {
      const DRUG = /(?:بتعطو|تعطو|دوا|الدوا|الدواء)/, NEEDLE = /(?:إبرة|الإبرة|ابرة|هالإبرة|هالابرة)/, TUBE = /(?:أنابيب|انابيب)/;
      const k = E.stepKind;
      // (chat fix 2 2026-11-08) A needle line only for a cannula or an injection; oxygen, a tablet or fluids get none.
      list = list.filter(x => !(k !== 'drug' && k !== 'fluids' && k !== 'oral' && DRUG.test(x.say)) && !(k !== 'needle' && k !== 'drug' && NEEDLE.test(x.say)) && !(k !== 'tube' && TUBE.test(x.say)));
    }
    // (chat fix 2 2026-11-08) Doctor room: «اسألني أنا» only while the relative has told nothing yet.
    if (!NM() && E.comp.addressed > 0) list = list.filter(x => !/اسألني|اسالني/.test(x.say));
    if (!list.length) {
      // Fresh words only for what the relative can see; a demand is said once or not at all.
      const why = { alarm: 'the monitor alarm just went off and you are scared', worse: 'your relative looks worse than a minute ago: say what you see', calm: 'your relative looks a little better after the treatment: relief, a short thanks, and one practical question about what comes next' }[trig];
      if (why && api !== 'off') { const c = E.comp; c.lastTurn = E.turns; c.lastAt = E.sim; c.count++; voice('c', 'companion', why, '', trig === 'alarm'); }
      return;
    }
    // The line written for this stage of illness comes first.
    const now = list.filter(x => x.stage && x.stage <= E.stage);
    const x = now.length ? now[now.length - 1] : pickOf(list.filter(y => !y.stage).length ? list.filter(y => !y.stage) : list);
    // Fear comes a beat after the alarm and the nurse, not on top of them.
    compSay(x, trig === 'alarm' || trig === 'worse' ? 0.25 : 0);
    if (trig === 'extra') E.comp.extra++;
    if (trig === 'info') E.comp.infos = (E.comp.infos || 0) + 1;
    // Only a plain question to the doctor waits for an answer; a cry at the alarm does not.
    if (trig === 'ignored') { E.comp.ignored++; E.comp.asked = E.turns; }
    if (trig === 'angry') { E.comp.angry = true; log('comm', 'انزعج المرافق لأن أحداً لم يشرح له ما يجري'); }
  }

