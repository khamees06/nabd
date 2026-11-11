  /* ---------- who speaks next ---------- */
  // Runs after anything anyone says or does, never on a timer. A relative speaks when something
  // they can see has just happened, says each thing once, and lets a doctor who is working work.
  const lineOf = x => (typeof x === 'string' ? x : x && x.say) || '';
  const compPool = k => (E.c.companion.lines || {})[k] || [];
  // A line can wait for its moment: {say, stage} only once the patient is that sick,
  // {say, unless} or {say, fact} only while the trainee has not found that fact,
  // {say, after} not before that simulated minute (a confession comes late).
  const fresh = list => list.map(x => (typeof x === 'string' ? { say: x } : x))
    .filter(x => x.say && !E.comp.used.has(x.say) && !(x.stage && E.stage < x.stage) && !(x.after && E.sim < x.after) && !(x.unless && E.facts.has(x.unless)) && !(x.when && !E.facts.has(x.when)) && !(x.fact && E.facts.has(x.fact)));
  const busyNow = () => E.turns - E.busyTurn <= 1;
  function compSay(x, after = 0) {
    const c = E.comp;
    if (!NM() && c.sayTurn === E.turns) return;
    c.sayTurn = E.turns;
    c.used.add(x.say);
    c.lastTurn = E.turns; c.lastAt = Math.max(c.lastAt, E.sim + after); c.count++; c.sayAt = E.sim;
    // A question still waiting to be said is dropped once the doctor has explained.
    const gen = c.gen, madeTurn = E.turns;
    (NM() ? later : soon)(after, () => {
      if ((E.comp.gen !== gen && /[؟?]/.test(x.say)) || E.sim < E.comp.outUntil) { E.comp.count--; return; }
      // (chat fix 2026-11-08) Doctor room: spoken to since, the relative has nothing stale to add.
      if (!NM() && E.comp.heardTurn > madeTurn) { E.comp.count--; return; }
      person('c', x.say);
      const told = (E.c.companion.tells || {})[x.say];
      if (told) E.facts.add(told);
      // A line can carry the nurse's answer to it.
      if (x.nurse) (NM() ? later : soon)(0.15, () => nurse(x.nurse));
    });
    // Twice unheard while the doctor works: the nurse settles the relative and nudges the doctor once.
    if (++c.unheard >= 2 && !c.nurseStep && E.c.companion.nurse && E.stage < 3 && NM()) {
      c.nurseStep = true;
      later(after + 0.5, () => {
        if (E.comp.gen !== gen) { E.comp.nurseStep = false; return; }
        nurse(E.c.companion.nurse, { d: 'أهل المريض خايفين. كلمة وحدة منك بتفرق.' }); if (!NM()) E.anx = clamp(E.anx - 10, 0, 100); E.comp.lastAt = E.sim;
      });
    }
  }
  // A line tied to what was just done or asked for: the relative sees it happen.
  function compOn(kind, id, after, always) {
    const list = fresh(((E.c.companion.lines || {})[kind] || {})[id] || []);
    if (!list.length || E.sim < E.comp.outUntil) return false;
    // Just told what is happening, a relative does not ask about it again.
    if (/[؟?]/.test(list[0].say) && E.turns - E.comp.explainedTurn <= 3) { E.comp.used.add(list[0].say); return false; }
    /* (chat fix 2026-11-08) Doctor room: a remark comes with its step, in the same turn, or never. The first two
       messages belong to the doctor; two remarks stand three messages and a minute apart; at most three a case.
       (Nurse room: the minute-and-a-half hold and the one-minute spacing, as before.) */
    if (!always && !NM()) {
      if (E.turns < 3 || E.turns - E.comp.lastTurn < 3 || E.sim - (E.comp.sayAt ?? -9) < 1 || (E.comp.reacts || 0) >= 3) return false;
      E.comp.reacts = (E.comp.reacts || 0) + 1;
    } else if (!always) {
      after = Math.max(after, 1.5 - E.sim);
      if (E.comp.lastAt > E.sim + after - 1) {
        const push = E.comp.lastAt + 1 - E.sim;
        if (push - after > 1.5) return false;
        after = push;
      }
    }
    compSay(list[0], after);
    return true;
  }

