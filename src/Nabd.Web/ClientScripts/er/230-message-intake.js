  /* ---------- a message from the student ---------- */
  let chain = Promise.resolve();
  // (live check 2026-11-08) A message that is only the room's own question to the nurse (see handle()).
  const ROOM_ONLY = /^(?:(?:يا )?(?:سستر|سيستر) )?(?:(?:طمنيني|طمنوني|طمني|طمنينا|طمنونا)(?: (?:عنه|عليه|عنها|عليها))?|(?:شو|كيف) (?:وضعه|وضعها|حالته|حالتها|حاله المريض|وضع المريض|وضع المريضه)|(?:شو|وين) (?:صار|وصلت|طلعت|طلع) (?:ب|في )?(?:ال)?(?:فحوصات|فحوص|نتايج|نتائج|تحاليل)|(?:ركبوله|ركبولها|ركبيله|ركبيلها|ركبوا|ركبي) (?:ال)?(?:مونيتر|مونيتور|monitor))(?: (?:هسا|هلا|هلق|الحين|يا سستر|سستر))?$/;
  function send(text) {
    text = (text || '').trim();
    if (!text || !E || E.over) return;
    E.jobs = E.jobs.filter(j => !j.conv);
    E.sent = (E.sent || 0) + 1;
    person('me', text);
    E.started = true;
    E.typedThisTurn = false;
    const my = E;
    // A message still queued when the case ends goes nowhere and costs nothing.
    chain = chain.then(() => (E === my && !E.over ? handle(text) : null)).catch(e => console.error(e));
  }

  async function handle(text) {
    if (NM()) return handleNurse(text);
    const my = E;
    /* (live check 2026-11-08, paid) The room's own questions to the nurse («طمنيني عنه», «شو وضعه هسا؟», «شو صار
       بالفحوصات؟», «ركبوله مونيتر») are answered from the monitor and the ordered tests, online exactly as offline,
       with no server call: online they went to the relative, to «سؤال للمشرف», or to invented pending results.
       Only when the whole message is that question, and never while a reading is asked: «تمام، وشو صار بالفحوصات؟»,
       «ركبوله مونيتر واسحبوا دم» or «يا لين طمنيني عنك» still go to the server. */
    // A late yes to oxygen she had said was not needed, the turn after it was closed in silence, still gives it.
    if (E.cavClosed) { const cc = E.cavClosed; E.cavClosed = null; if (!E.pending && cc.turn === E.turns && !E.done.has(cc.p.a.id) && ACCEPT.test(norm(text))) E.pending = cc.p; }
    if (ROOM_ONLY.test(norm(text)) && !(E.pending && E.pending.type === 'interpret')) {
      const lr = localRead(text);
      if ((lr.howIs || lr.resultsAll || lr.monitorAsk) && !lr.actions.length && !lr.tests.length) {
        lr.text = text;
        const own = localReply(lr);
        if (own) { apply(lr, text, lr.to, own); return; }
      }
    }
    const dots = typing();
    const pending = E.pending;
    // (live check 2026-11-08) A «which drug?» left behind two messages ago is not the server's open question any more:
    // sent on, the model asked «بالعضل ولا بالوريد؟» about an injection nobody named.
    const sendPending = pending && !(pending.type === 'which' && E.turns - (pending.turnAt || 0) >= 2);
    const r = await call({ text, pending: sendPending ? { ask: pending.ask } : undefined });
    if (!r && !ACT && !actRetried) { actRetried = true; await loadAct(); }
    dots.remove();
    if (E !== my || E.over) return;
    const read = (r && r.read) || localRead(text);
    read.text = text;
    // The server's reading survives even when its voice failed: the case's own line says it.
    const spoken = r && !r.voiceFailed;
    if (r && !spoken) read.to = r.to;
    /* (chat fix 2026-11-08) Doctor room, online: an order with no drug named, an order the reader could place nowhere,
       and a bare yes or no that fits no open question get the room's own precise line, never a free model line. */
    if (r && r.read) {
      if (read.vague === 'none' || !read.vague) read.vague = '';
      const nA = (read.actions || []).length, nT = (read.tests || []).length, t = norm(text);
      if (read.vague && !nA && !nT) read.vagueSub = /(?:^| )[وب]?(?:ال)?(?:ابره|ابر|حقنه)(?: |$)/.test(t) ? 'needle' : /للضغط/.test(t) ? 'bp' : /للحراره/.test(t) ? 'fever' : '';
      const bare = BARE.test(t) && !nA && !nT && !(read.facts || []).length && read.pending_ok === 'na';
      if ((read.vague && !nA && !nT) || bare) {
        if (read.vague) read.facts = [];
        const own = localReply(read);
        if (own) { apply(read, text, read.to, own); return; }
      }
      // (live check 2 2026-11-08) «ماشي عالاتنين» answers her open question: never «ما لقطت الطلب» after the read-back.
      const answered = pending && ['good', 'partial', 'wrong', 'withdraw'].includes(read.pending_ok);
      if (r.unplaced && !nA && !nT && !answered) { read.to = 'nurse'; apply(read, text, 'nurse', unplacedOrder(t)); return; }
    }
    // localReply may hand a line to the companion, so read.to is only final after it.
    let reply = spoken ? (r.held ? teachLine() : r.reply) : localReply(read);
    // (live check 2 2026-11-08) Doctor room: «تمام، وشو صار بالفحوصات؟» — the yes goes through and the room question
    // beside it is answered too, from the monitor and the tests, in the same bubble as the read-back.
    if (!NM() && spoken && !reply && r.read && pending && ['good', 'partial'].includes(read.pending_ok) && !(read.facts || []).length && !(read.tests || []).length) {
      const lr = localRead(text);
      const extra = lr.resultsAll ? resultsLine() : lr.howIs ? howLine() : lr.monitorAsk ? monitorLine() : '';
      if (extra) reply = extra;
    }
    apply(read, text, spoken ? r.to : read.to, reply);
  }

