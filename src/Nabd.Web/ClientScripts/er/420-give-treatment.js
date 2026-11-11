  function give(a, meta, def) {
    const prev = E.done.get(a.id);
    const amt = amountOf(a, def, a.said || '');
    E.done.set(a.id, prev ? { ...prev, n: prev.n + 1, last: E.sim, dose: a.dose || prev.dose, amt: (prev.amt || 0) + amt, top: Math.max(prev.top || 0, amt) } : { at: E.sim, last: E.sim, n: 1, dose: a.dose || '', ok: a._ok || 'good', amt, top: amt });
    settle(q => q.type === 'dose' && q.a.id === a.id);
    log('action', meta.ar + (a.dose ? ' (' + a.dose + ')' : ''));
    if (NM()) nurseGave(a, meta);
    else if (meta.dose) E.lastGiven = { id: a.id, turn: E.turns, at: E.sim };
    // (chat fix 2 2026-11-08) Doctor room: the drug by its name, as typed, or as her proposal names that dose
    // («180» is the ticagrelor), never «مضاد صفيحات ثانٍ 180».
    const named = a.agent && a.agent.length <= 24 ? a.agent : (!NM() && (a.sayName || (/مضاد|مدر|مميع|خافض|ستيرويد|مسكن|مهدئ|ثانٍ/.test(meta.ar) && agentOfSug(def.suggest || meta.suggest, a.dose)))) || (NM() ? meta.ar : meta.ar.replace(/ثانٍ/, 'التاني'));
    // The drug's name once: "سلاين 500 مل سلاين" is not how anyone reads an order back.
    const withName = a.dose && norm(a.dose).includes(norm(named)) ? a.dose : `${named} ${a.dose}`;
    // Asked for the numbers, she reads them at once; "حاضر" is for orders, said once for all of a message's orders.
    if (a.id === 'bp_repeat') { E.bpAt = 0; paint(); nurse(`قست الضغط هسا: ${spokenVitals()}.`); }
    else if (!NM() && a._titr) sayBack(`حاضر، ${a._titr === 'down' ? 'نزّلت' : 'رفعت'} ${SPOKEN[a.id] || meta.ar} لـ${a.dose}.`, meta.ar, a.dose);
    else if (!NM() && a._later) sayBack(`علّقت ${withName} كمان.`, meta.ar, a.dose);
    else sayBack(a.sayDose ? `حاضر، ${a.sayDose}.` : a.dose ? `حاضر، ${withName}.` : (def.rb && !meta.dose ? def.rb : NM() || def.done ? 'حاضر.' : `حاضر، ${SPOKEN[a.id] || meta.ar}.`), meta.ar, a.dose);
    // More of the same adds something; saying the same flow again does not. (Turning a drip up is more of it.)
    const higher = !prev || !(meta.repeat && meta.repeat.up) || amt > (prev.top || 0) || (!NM() && a._titr === 'up');
    const share = prev ? (meta.repeat ? meta.repeat.again : 0) : 1;
    const gain = higher ? (def.slow || 0) * share : 0;
    if (gain) E.effects.push({ id: a.id, from: E.sim + (def.onset || 0), slow: gain });
    const fx = { ...(meta.fx || {}), ...(def.fx || {}) };
    if (a.id === 'oxygen' && def.spo2) fx.spo2 = def.spo2;
    if (higher && share && ['spo2', 'hr', 'rr', 'sbp', 'dbp'].some(k => fx[k])) {
      const before = { ...live() }, ramp = fx.ramp || 0.2, mod = { id: a.id, from: E.sim + 0.03, ramp };
      for (const k of ['spo2', 'hr', 'rr', 'sbp', 'dbp']) if (fx[k]) mod[k] = fx[k] * share;
      E.mods.push(mod);
      answerLater(meta, before, ramp);
    }
    if (a.id === 'adrenaline' && E.anaph && !E.anaph.treated) {
      E.anaph.treated = E.sim;
      later(0.15, () => { E.risk = clamp(E.risk - 18, 0, 100); E.bpAt = 0; paint(); nurse('الضغط بلش يطلع والصفير خف بعد الأدرينالين.', 'بدأ الضغط يرتفع وخفّ الصفير بعد الأدرينالين.'); });
    }
    if (a.id === 'shock' && E.vtNow) {
      later(0.1, () => {
        E.risk = E.c.risk.critical - 5; E.stage = 2; E.vtNow = false; E.shockedAt = E.sim; E.bpAt = 0;
        stageCheck(); paint();
        log('better', 'رجع النظم بعد الصدمة');
        nurse('رجع sinus، وفي نبض. بس لسا مش ثابت.', 'عاد النظم الجيبي وهناك نبض، لكنه غير مستقر بعد.');
      });
    }
    const fin = () => {
      if (a.id === 'temp') { E.tempKnown = true; paint(); }
      if (a.id === 'bp_repeat') return;
      // (chat fix 2 2026-11-08) A drip turned up, or the second bolus, needs no "started" line; a tablet under the tongue
      // is not "started the infusion".
      let done = !NM() && (a._titr || a._later) ? '' : def.done;
      if (!NM() && done && /التسريب/.test(done) && a.dose && !(doseOf(a.dose) || {}).perTime) done = /(?:تحت اللسان|sublingual|(?:^| )sl(?: |$)|بخ\S*|spray)/.test(norm((a.said || '') + ' ' + a.dose)) ? `حطيتل${hisHer()} إياه تحت اللسان، وعيني عالضغط.` : done.replace(/بلّشت التسريب/, 'أعطيته');
      if (done) {
        if (!NM() && E.inApply && E.rbBuf) { const rb = E.rbBuf.filter(x => x[1] === meta.ar).pop(); if (rb && !meta.dose) { rb[0] = done; rb[3] = true; } else E.rbBuf.push([done, meta.ar, '', true]); }
        else sayDone(done);
      }
      if (a.id === 'call_senior' && !NM()) soon(0.02, () => coach('called'));
    };
    if (!NM() && E.inApply) fin(); else if (NM()) later(0.1, fin); else soon(0.03, fin);
    if (NM()) later(0.02, () => releaseOrders());
    // What the relative says about this very step, or else, for a needle or a drug, at most a question about it.
    // (chat fix 2 2026-11-08) A drug by mouth, under the tongue or by nebuliser is no needle.
    const route = norm((a.said || '') + ' ' + (a.dose || '') + ' ' + ((def.suggest || meta.suggest || {}).text || ''));
    const oral = !NM() && /(?:مضغ|(?:^| )حب\S*|فموي|بالفم|(?:^| )po(?: |$)|تحت اللسان|بخار|(?:^| )neb|بخاخ|نيبولايزر)/.test(route) && !/(?:^| )(?:iv|im|sc|وريد\S*|بالوريد|عضل\S*|بالعضل|حقن\S*|ابر\S*|بولس|bolus|push)(?: |$)/.test(norm((a.said || '') + ' ' + (a.dose || '')));
    E.stepKind = a.id === 'iv_access' ? 'needle' : ['foley', 'airway'].includes(a.id) ? 'tube' : a.id === 'fluids' ? 'fluids' : meta.dose && a.id !== 'oxygen' ? (oral ? 'oral' : 'drug') : 'other';
    if (!compOn('onDone', a.id, 0.6) && (meta.dose || ['iv_access', 'fluids', 'foley', 'airway'].includes(a.id))) director('procedure');
  }

