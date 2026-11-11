  /* ---------- orders ---------- */
  // One open question at a time, the rest wait their turn.
  // Only a bare yes accepts: "تمام بلاش الكورتيزون" and "اه لحظة" are not a yes.
  // (chat fix 2 2026-11-08) «اعطيه»، «حطيه»، «اطلبي» answer her proposal as a yes does.
  const YES_WORD = 'اه|ايوا|ايوه|نعم|تمام|ماشي|اوكي|اوك|ok|okay|yes|اكيد|طيب|موافق|مزبوط|نمشي|نفذي?|يلا|اعطيه|اعطيها|اعطيهم|عطيه|عطيها|اعطوه|اعطوها|عطوه|عطوها|حطيه|حطيها|حطوه|حطوها|حطيله|حطيلها|علقيه|علقيها|علقوه|ركبيه|ركبوه|نفذو|كملي|كملو|اطلبي|اطلبيه|اطلبيها|اطلبوه|اطلبه|بلشي|بلشو|ابدئي';
  // (live check 2026-11-08) She asks «ماشي عالاتنين؟» / «ماشي عالكل؟»: «ماشي عالاتنين»، «آه الاتنين»، «ماشي على الكل» are that yes.
  const ACCEPT = new RegExp('^(?:' + YES_WORD + '|زي ما (?:قلتي|اقترحتي)|علي كلامك)(?: (?:' + YES_WORD + '|دكتوره?|سستر|كلهم|كله|هيك|اعطيهم|عطيهم|ابدئي|(?:علي )?(?:عال|ع|ال)?(?:اتنين|تنين|ثنين|كل)))*$');
  const YES_FIRST = new RegExp('^(?:' + YES_WORD + ')(?: |$)');
  const bundleLine = list => 'حاضر دكتور. بقترح: ' + list.map((p, i) => `${'١٢٣٤٥٦٧٨'[i]}) ${p.name}: ${p.tip || 'أي نوع وكم؟'}`).join(' — ') + ' — موافق؟ أو غيّر أي واحد.';
  // All open doses are one question, with the ones she has a proposal for first.
  function openDoses(first) {
    let items = [...(E.pending ? [[E.pending, first, 'n']] : []), ...E.queue.filter(([q]) => q.type === 'dose')];
    if (!items.length) return;
    if (!NM()) {
      // (chat fix 2 2026-11-08) Oxygen she already said is not needed («مش واطي») never rides in a bundle and is never
      // parked: with other orders now open, it is closed as not wanted.
      const cav = items.filter(i => i[0].caveat);
      if (cav.length && items.length > cav.length) { E.queue = E.queue.filter(x => !cav.some(i => i[0] === x[0])); if (cav.some(i => i[0] === E.pending)) E.pending = null; items = items.filter(i => !cav.includes(i)); }
      // A proposal already said twice is parked and named once, not said a third time.
      const guard = q => E.queue.some(([u]) => u.type === 'unsafe' && u.def && u.def.early && ((E.c.care[u.a.id] || {}).stableHarm || {}).unlessDone === (q.a && q.a.id));
      const stale = items.filter(i => (i[0].asks || 0) >= 2 && !guard(i[0]));
      if (stale.length) { E.parked.push(...stale.map(i => i[0])); E.parkNote = (E.parkNote || []).concat(stale.map(i => i[0])); E.queue = E.queue.filter(x => !stale.some(i => i[0] === x[0])); if (stale.some(i => i[0] === E.pending)) E.pending = null; items = items.filter(i => !stale.includes(i)); }
      if (!items.length) return;
      E.lastQ = { turn: E.turns, items: items.map(i => i[0]) };
      // The line of the proposal that is new carries the older one beside it.
      items = items.map(i => [i[0], (i[0].asks ? i[1] : i[0].line0) || i[1] || i[0].line0, i[2]]);
    }
    items.sort((a, b) => (b[0].sug ? 1 : 0) - (a[0].sug ? 1 : 0));
    E.queue = [...items.slice(1), ...E.queue.filter(([q]) => q.type !== 'dose')];
    E.pending = items[0][0];
    E.pending.since = E.sim;
    const fresh = items.filter(i => !i[0].asks), olds = items.filter(i => i[0].asks);
    // (chat fix 2 2026-11-08) Doctor room: several new proposals are said as one plain sentence, not a numbered list.
    const dmBundle = list => { const s = list.filter(q => q.sug), n = list.filter(q => !q.sug); return 'حاضر. ' + (s.length ? 'بقترح ' + s.map(named).join('، و') + (s.length > 1 ? '. ماشي عالكل؟' : '، ماشي؟') : '') + (n.length ? (s.length ? ' و' : '') + n.map(q => spk(q) + (q.a && q.a.sayName ? ': قديش الجرعة؟' : ': أي نوع وقديش؟')).join(' و') : ''); };
    // (An older one with no proposal is asked by name and dose after the yes/no part, never «والمضاد. ماشي عالاتنين؟».)
    const oldS = olds.filter(i => i[0].sug), oldN = olds.filter(i => !i[0].sug);
    const doseLine = items.length === 1 ? items[0][1] : !NM() && fresh.length === 1 && fresh[0][0].sug && olds.length ? fresh[0][1].replace(/،\s*ماشي؟\s*$/, '') + (oldS.length ? '، و' + oldS.map(i => named(i[0])).join('، و') + (oldS.length > 1 ? '. ماشي عالكل؟' : '. ماشي عالاتنين؟') : '، ماشي؟') + (oldN.length ? ' و' + oldN.map(i => spk(i[0]) + (i[0].a && i[0].a.sayName ? ': قديش الجرعة؟' : ': أي نوع وقديش؟')).join(' و') : '') : !NM() && !fresh.length ? 'دكتور، ' + dmBundle(items.map(i => i[0])).replace(/^حاضر\. /, '') : NM() ? bundleLine(items.map(i => i[0])) : dmBundle(items.map(i => i[0]));
    if (!NM()) { items.forEach(i => { i[0].asks = (i[0].asks || 0) + 1; }); E.askedThisTurn = true; }
    if (!NM() && (E.inApply || E.bufQ)) { E.qLine = ['n', doseLine]; return; }
    nurse(doseLine, { d: doseLine });
  }
  // A safety challenge goes first, then the proposals together, then the rest.
  function nextQuestion() {
    if (!NM() && E.inApply) { E.deferNext = true; return; }
    if (!NM() && !E.pending && E.held && E.held.length) restoreHeld();
    if (E.pending || !E.queue.length) return;
    const i = E.queue.findIndex(([q]) => q.type === 'unsafe');
    if (i >= 0) {
      const [n] = E.queue.splice(i, 1), care = E.c.care[n[0].a.id];
      // The fluids went in while the challenge waited: the order now goes through.
      if (n[0].def.early && care && !tooEarly(care)) { order({ ...n[0].a }, ''); nextQuestion(); return; }
      ask(...n);
      return;
    }
    if (E.queue.some(([q]) => q.type === 'dose')) { openDoses(); return; }
    ask(...E.queue.shift());
  }
  // "بلاش الكورتيزون" while proposals are open takes that one out, and only that one.
  function dropNamed(text) {
    const t = norm(text), isDose = q => q && q.type === 'dose';
    const off = [E.pending, ...E.queue.map(([q]) => q)].filter(isDose).filter(p => { const at = mentionsOf(t, actOf(p.a.id).kw); return at.length && !at.some(i => freeAt(t, i)); });
    if (!off.length) return false;
    E.queue = E.queue.filter(([q]) => !off.includes(q));
    if (off.includes(E.pending)) E.pending = null;
    nurse(`تمام، شلت ${off.map(p => p.name).join(' و')}.`);
    if (YES_FIRST.test(t)) {
      const rest = [E.pending, ...E.queue.map(([q]) => q)].filter(q => isDose(q) && q.sug);
      E.queue = E.queue.filter(([q]) => !rest.includes(q));
      if (rest.includes(E.pending)) E.pending = null;
      rest.forEach(q => order({ ...q.a, dose: q.sug, sayDose: q.tip.split(' (أو')[0].split('، ')[0], _asked: true }, text));
    }
    nextQuestion();
    return true;
  }
