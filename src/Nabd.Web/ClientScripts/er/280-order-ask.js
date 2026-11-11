  function ask(p, line, who = 'n') {
    if (NM() && who === 'n') who = 'd';
    const same = q => q.type === p.type && (q.a ? q.a.id : q.id) === (p.a ? p.a.id : p.id);
    // The same order again while its question is open: the question comes back, not silence.
    if (E.pending && same(E.pending)) { if (!NM()) { E.askedThisTurn = true; E.pending.asks = (E.pending.asks || 1) + 1; const l = E.pending.type === 'dose' ? (E.pending.asks >= 3 ? 'ما بقدر أعطي ' + spk(E.pending) + ' بدون جرعة يا دكتور. ' + (E.pending.sug ? 'بقترح ' + shortTip(E.pending) + '، ماشي؟' : 'قديش بدك؟') : shortAsk(E.pending).replace(/^و/, 'دكتور، ')) : E.pending.type === 'offer' && E.pending.asks >= 2 ? 'دكتور، ' + line.replace(/^دكتور،\s*/, '').split(/(?<=\.)\s+/).slice(-1)[0] : E.pending.type === 'unsafe' && E.pending.asks % 2 === 0 ? 'لسا مش مرتاحة: ' + line.replace(/^دكتور،\s*/, '').replace(/[؟?]?\s*متأكد؟\s*$/, '') + '. متأكد إنك بدك ' + (fem(spk(E.pending)) ? 'إياها' : 'إياه') + '؟' : line; if (E.inApply || E.bufQ) E.qLine = [who, l]; else person(who, l); return; } if ((E.pending.wait || 0) % 2 === 1) person(who, line); return; }
    if (!NM() && E.pending) {
      // (chat fix 2 2026-11-08) Doctor room. The drug she held for its prerequisite, ordered again: the one question again.
      const qd = E.queue.find(([q]) => same(q));
      if (qd && p.type === 'unsafe' && E.pending.type === 'dose' && ((E.c.care[p.a.id] || {}).stableHarm || {}).unlessDone === E.pending.a.id) {
        E.askedThisTurn = true; E.pending.asks = (E.pending.asks || 1) + 1;
        const l3 = E.pending.asks >= 4 ? `${spk(p)} مش قبل ${spk(E.pending)} يا دكتور. أبلّش ${shortTip(E.pending)} هسا؟` : `${spk(E.pending)} لسا ما بلشت يا دكتور. بقترح ${shortTip(E.pending)} أول، و${spk(p)} بعدها. ماشي؟`;
        if (E.inApply || E.bufQ) E.qLine = [who, l3]; else person(who, l3);
        return;
      }
      // A dose she just rejected is asked now, whatever else waits: the others are held and come back after it.
      if (p.retried && p.type === 'dose' && E.pending.type === 'dose' && E.pending !== p) {
        E.queue = E.queue.filter(([q]) => !same(q));
        E.held.push(...[E.pending, ...E.queue.filter(([q]) => q.type === 'dose').map(([q]) => q)].filter(q => q.type === 'dose' && !same(q)));
        E.queue = E.queue.filter(([q]) => q.type !== 'dose');
        if (E.collect) E.collect = E.collect.filter(x => same(x.p));
        E.pending = null;
      }
    }
    if (E.queue.some(([q]) => same(q))) return;
    // A teaching question never holds up an order.
    if (E.pending && E.pending.type === 'interpret' && p.type !== 'interpret') E.pending = null;
    if (!NM() && E.pending) {
      // A reading is asked into silence, or over a proposal already said twice; never queued.
      // (A result that lands on its own, after the turn, never pushes an open question aside.)
      if (p.type === 'interpret' && (!(E.inApply || E.bufQ) || !(E.pending.type === 'dose' && (E.pending.asks || 0) >= 2))) return;
      if (E.pending.type === 'which') { E.pending = null; restoreHeld(); }
      else if (p.type === 'unsafe' && p.def && p.def.early && E.pending.type === 'dose' && ((E.c.care[p.a.id] || {}).stableHarm || {}).unlessDone === E.pending.a.id) {
        // The challenge is "its prerequisite is not in yet" and that prerequisite is the open proposal: one question, safe order.
        const old = E.pending; old.asks = (old.asks || 1) + 1; E.askedThisTurn = true; p.turnAt = E.turns;
        E.queue.push([p, line, who]);
        const l2 = line.replace(/\s*متأكد؟\s*$/, '') + ' بقترح نبلّش ' + shortTip(old) + ' أول، و' + spk(p) + ' بعدها. ماشي؟';
        if (E.inApply || E.bufQ) E.qLine = [who, l2]; else person(who, l2);
        return;
      }
      else if (p.type === 'dose' && E.pending.type === 'unsafe' && E.pending.turnAt === E.turns) { if (!p.line0) p.line0 = line; p.turnAt = E.turns; E.held.push(p); return; }
      else if (!(p.type === 'dose' && E.pending.type === 'dose')) {
        const old = [E.pending, ...E.queue.filter(([q]) => q.type === 'dose').map(([q]) => q)];
        E.queue = E.queue.filter(([q]) => q.type !== 'dose');
        if (E.collect) E.collect = E.collect.filter(x => !old.includes(x.p));
        parkOld(old, p.type);
        E.pending = null;
      }
    }
    if (E.pending) {
      if (p.type === 'dose' && !p.line0) p.line0 = line;
      if (!p.turnAt) p.turnAt = E.turns;
      E.queue.push([p, line, who]);
      // Several doses asked in one message are one proposal, not several questions.
      if (p.type === 'dose' && E.collect) E.collect.push({ p, line });
      else if (NM() && p.type !== 'interpret' && !E.collect) nurse('لحظة دكتور، جاوبني أول عالسؤال اللي فوق.');
      return;
    }
    if (p.type === 'dose' && !p.line0) p.line0 = line;
    E.pending = p;
    p.since = E.sim;
    p.turnAt = E.turns;
    if (p.type === 'dose' && E.collect) { E.collect.push({ p, line }); return; }
    p.asks = (p.asks || 0) + 1; E.askedThisTurn = true;
    // (chat fix 2 2026-11-08) Doctor room: the same offer raised again a moment later is said short, not word for word.
    if (!NM() && p.type === 'offer') { const k = p.id || (p.a && p.a.id); if (E.lastOffer && E.lastOffer.k === k && E.turns - E.lastOffer.turn <= 3) line = 'دكتور، ' + line.replace(/^دكتور،\s*/, '').split(/(?<=\.)\s+/).slice(-1)[0]; E.lastOffer = { k, turn: E.turns }; }
    if (!NM() && (E.inApply || E.bufQ)) { E.qLine = [who, line]; return; }
    person(who, line);
  }
