  function unsafe(a, meta, def, allergic) {
    const need = allergic ? 'allergy' : def.needFact;
    const known = need ? E.facts.has(need) || (allergic && E.reacted) : true;
    const pending = { type: 'unsafe', a, def, allergic, ask: `The nurse challenged the unsafe order ${meta.en}. good = the trainee cancels or changes it, wrong = the trainee insists, na = not a reply.` };
    // Asked and known: the nurse stops it. Never asked: nobody in the room knows, and it is given.
    if (known) {
      // (chat fix 2 2026-11-08) Doctor room: the step it waits for (the fluids before the insulin) is offered with it,
      // in the same question, so a yes starts the safe order first.
      const pre = !NM() && !allergic && def.early && ((E.c.care[a.id] || {}).stableHarm || {}).unlessDone;
      if (pre && !E.done.has(pre) && actOf(pre) && !(E.pending && E.pending.type === 'dose' && E.pending.a.id === pre) && !E.queue.some(([q]) => q.type === 'dose' && q.a.id === pre)) order({ id: pre, agent: '', dose: '' }, '');
      ask(pending, (!allergic && def.challenge) || `دكتور، ${meta.ar}؟ في قصة حساسية، متأكد؟`);
      log('harm', 'أوقفت الممرضة أمراً غير آمن: ' + meta.ar);
      if (!E.caught.some(x => x.ar === meta.ar)) E.caught.push({ id: a.id, ar: meta.ar, why: allergic ? def.allergyEffect : def.why });
      return;
    }
    // A bare drug name read without the server is not yet an order for something dangerous.
    if (a.bare) { ask(pending, `${meta.ar}؟ بدك إياه هسا؟`); return; }
    harm(a, meta, def, allergic);
  }

  function harm(a, meta, def, allergic, insisted) {
    // Kept apart from E.done: a trap earns no step, and a safe drug can still follow an allergic reaction.
    E.harmed.add(a.id);
    if (allergic) E.reacted = true;
    if (!NM()) E.lastGiven = { id: a.id, turn: E.turns, at: E.sim };
    // (chat fix 2 2026-11-08) Doctor room: given on his word after her challenge, she says what she gave.
    const nm = (!NM() && a.sayName) || SPOKEN[a.id] || meta.ar, dz = !NM() && a.dose && a.dose.length <= 30 ? a.dose : '';
    nurse(NM() ? 'حاضر.' : insisted ? `حاضر، على مسؤوليتك دكتور. أعطيت${hisHer()} ${SPOKEN[a.id] || meta.ar}.` : `حاضر، ${dz ? (norm(dz).includes(norm(nm)) ? dz : nm + ' ' + dz) : nm}.`);
    // Given too early it still works, and it cannot be given twice.
    if (def.counts) { E.done.set(a.id, { at: E.sim, last: E.sim, n: 1, dose: a.dose || '', ok: 'early', amt: 0, top: 0 }); if (def.slow) E.effects.push({ id: a.id, from: E.sim + (def.onset || 0), slow: def.slow }); }
    if (def.off && !def.risk) { E.unneeded.push({ label: def.label, why: def.why }); log('harm', def.label); return; }
    const label = allergic ? meta.ar + ' رغم الحساسية' : def.label || meta.ar;
    E.harms.push({ at: E.sim, label, why: allergic ? def.allergyEffect : def.why, risk: allergic ? def.allergyRisk || 18 : def.risk || 12 });
    const risk = allergic ? def.allergyRisk || 18 : def.risk || 12;
    later(0.3, () => {
      // Anaphylaxis leaves time to treat it: that decision is the lesson.
      E.risk = clamp(E.risk + risk, 0, allergic && def.anaphylaxis ? Math.max(E.risk, 88) : 100);
      if (allergic && def.anaphylaxis && !E.anaph) E.anaph = { at: E.sim, treated: null };
      E.bpAt = 0;
      paint();
      log('harm', 'أذى: ' + label);
      alert(allergic ? def.allergyEffect : def.effect || 'ساءت حالة المريض بعد الدواء.');
      E.anx = clamp(E.anx + 20, 0, 100);
      // No alarm sounds below the urgent stage: the relative reacts to what they see.
      director(E.stage >= 2 ? 'alarm' : 'worse');
      coach('harm');
    });
  }

