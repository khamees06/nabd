  function apply(read, text, to, reply) {
    const t = read.tone || {};
    E.collect = [];
    E.rbBuf = [];
    E.turns++;
    if (t.introduced) E.comm.introduced = true;
    if (t.consent) E.comm.consent = true;
    if (t.rude) { E.comm.rude++; E.anx = clamp(E.anx + 24, 0, 100); log('comm', 'كلام جارح أو متجاهل للأهل'); }
    if (t.empathy) { E.comm.empathy = true; }
    if (t.jargon && (to === 'companion' || to === 'patient')) { E.comm.jargon++; E.anx = clamp(E.anx + 7, 0, 100); }
    // Orders, tests, an examination or history from the patient: the doctor is working.
    const working = (read.actions || []).length || (read.tests || []).length || (read.exam || []).length || (to === 'patient' && (read.facts || []).length)
      // (live check 2026-11-08) Doctor room: a «ماشي» that accepts her proposal is an order too.
      || (!NM() && E.pending && E.pending.type === 'dose' && ['good', 'partial'].includes(read.pending_ok));
    if (working) E.busyTurn = E.turns;
    if (to === 'companion') {
      const c = E.comp;
      c.asked = null; c.ignored = 0; c.unheard = 0; c.heardTurn = E.turns;
      c.addressed++;
      // Asked to wait outside, the relative is out of the room for a while; spoken to again, back in.
      c.outUntil = STEP_OUT.test(norm(text)) ? E.sim + 3 : 0;
      if (t.explained || t.empathy) { E.comm.explained = true; E.anx = clamp(E.anx - 24, 0, 100); c.lastTurn = E.turns + 1; c.lastAt = E.sim; c.gen++; c.explainedTurn = E.turns; log('comm', 'شرح للأهل فهدأوا'); }
      else E.anx = clamp(E.anx - 6, 0, 100);
    } else {
      // Seeing the team work steadies a relative; a question left hanging does not.
      const waited = E.comp.asked !== null ? E.turns - E.comp.asked : 0;
      E.anx = clamp(E.anx + (working ? -1 : waited === 3 ? 6 : waited > 3 ? 2 : 1), 0, 100);
      if (to === 'patient' && t.explained) E.comm.explained = true;
    }

    let open = E.pending;
    const DM = !NM(), nA = (read.actions || []).length, nT = (read.tests || []).length;
    if (DM) { E.inApply = true; E.merging = true; E.deferNext = false; E.tail = null; E.askedThisTurn = false; E.held = E.held || []; E.parked = E.parked || []; E.parkNote = []; E.qLine = null; E.lastRead = read; }
    // (chat fix 2 2026-11-08) «شو صار بالأسبرين؟» about a proposal she parked: her answer re-opens it as the open question.
    if (DM && read.reopen && E.pending !== read.reopen && (!E.pending || ['interpret', 'which', 'offer'].includes(E.pending.type))) {
      const q = read.reopen;
      E.parked = E.parked.filter(x => x !== q); E.held = E.held.filter(x => x !== q); E.queue = E.queue.filter(([x]) => x !== q);
      E.pending = q; q.since = E.sim; q.turnAt = E.turns; q.asks = 1; open = null; E.askedThisTurn = true;
    }
    // Words to the relative answer nobody's open question. (Offline, "patient" is only the default reader's guess.)
    if (open && to === 'companion' && !(read.actions || []).length && !(read.tests || []).length) read.pending_ok = 'na';
    if (open && open.type === 'dose' && dropNamed(text)) { open = null; read.actions = []; }
    // A bare yes to the nurse's proposal is an answer whoever reads it, unless the reader heard a refusal.
    if (open && open.type === 'dose' && open.sug && ACCEPT.test(norm(text)) && !(read.actions || []).length && !['withdraw', 'wrong'].includes(read.pending_ok)) read.pending_ok = 'good';
    // Acting is not reading: an order sent over a teaching question is no misread result.
    if (open && open.type === 'interpret' && ((read.actions || []).length || (read.tests || []).length)) read.pending_ok = 'na';
    // What a "yes" gave is read back before the nurse's next question.
    // Nurse mode: a call to the doctor (an SBAR full of numbers, "الاكسجين 89") answers nobody's open dose question.
    if (open && open.type === 'dose' && NM() && read.escalate) read.pending_ok = 'na';
    if (DM && open && open.type === 'which') {
      if (nA || nT) { E.pending = null; open = null; restoreHeld(); }
      else if (/^(?:لا|لاء|لأ|خلص|لا خلص|بلاش|انسي|انسى)$/.test(norm(text))) { E.pending = null; open = null; nurse('تمام.'); restoreHeld(); nextQuestion(); }
      read.pending_ok = 'na';
    }
    if (DM && read.vague && !nA && !nT) {
      const again = !!open && open.type === 'which';
      if (open && !again) { E.held.push(...[open, ...E.queue.filter(([q]) => q.type === 'dose').map(([q]) => q)].filter(q => q.type === 'dose')); E.queue = E.queue.filter(([q]) => q.type !== 'dose'); }
      E.pending = { type: 'which', vague: read.vague, vagueSub: read.vagueSub || '', ask: read.vague === 'labs' ? 'The nurse asked which blood tests the trainee wants. na = not a reply.' : 'The nurse asked which drug and what dose the trainee wants. na = not a reply.', since: E.sim, turnAt: E.turns, wait: again ? (open.wait || 0) + 1 : 0 };
      open = null; read.pending_ok = 'na'; E.askedThisTurn = true;
    }
    if (open && read.pending_ok && read.pending_ok !== 'na') { resolve(read.pending_ok, text); flushBack(); E.rbBuf = []; }
    // Doctor room: the open question is reminded only when the message spoke to the nurse or gave work, never to the patient or relative.
    else if (DM && open) { if (!read.clarify && !((to === 'patient' || to === 'companion' || to === 'supervisor') && !nA && !nT) && (open.type === 'unsafe' || ![...(read.actions || []), ...(read.tests || [])].some(x => x.id === (open.a ? open.a.id : open.id) && (x.dose || x.reason)))) remind(open); }
    else if (open && !(open.type === 'interpret' && to === 'companion') && !((open.type === 'dose' || open.type === 'reason') && (to === 'patient' || to === 'companion') && !(read.actions || []).length && !(read.tests || []).length) && (open.type === 'unsafe' || ![...(read.actions || []), ...(read.tests || [])].some(x => x.id === (open.a ? open.a.id : open.id) && (x.dose || x.reason)))) remind(open);
    // A patient the nurse calls unresponsive does not recite a history, and nothing unheard counts as asked.
    const mute = E.stage === 3 && (to === 'patient' || to === 'room');
    const line = mute ? pickOf((E.c.stageLines.critical || {}).patient || ['...']) : reply;
    if (line && !mute && (to === 'patient' || to === 'companion' || to === 'room')) {
      (read.saidFact ? [read.saidFact] : read.facts || []).forEach(id => {
        const f = E.c.facts.find(x => x.id === id);
        if (f && (to === 'companion' ? f.who && f.who !== 'patient' : f.who !== 'companion')) {
          // Some answers the nurse acts on at once, such as an allergy going on the chart and a band.
          if (f.nurseNote && !E.facts.has(id)) (NM() ? later : soon)(NM() ? 0.3 : 0.02, () => nurse(f.nurseNote));
          E.facts.add(id);
          // (chat fix 2 2026-11-08) The relative's story also tells what their hint lines would say again.
          if (!NM()) (f.covers || []).forEach(x => E.facts.add(x));
        }
      });
    }
    if (NM()) nursePre(read, text, to);
    (read.exam || []).forEach(examine);
    if (line) person(to === 'companion' ? 'c' : to === 'nurse' ? 'n' : to === 'supervisor' ? 'd' : 'p', line);
    // (chat fix 2026-11-08) «أسبرين؟ بدك إياه؟» is a question she waits on: a yes orders it, a no drops it.
    if (DM && read.unclear && read.unclearId && line && to === 'nurse' && !nA && !nT && line.startsWith(read.unclear) && (!E.pending || ['interpret', 'which'].includes(E.pending.type))) {
      E.pending = { type: 'offer', a: { id: read.unclearId }, ask: `The nurse asked whether the trainee wants ${(actOf(read.unclearId) || {}).en || read.unclearId} now. good = yes, withdraw = no, na = not a reply.`, since: E.sim, turnAt: E.turns, asks: 1 };
      E.askedThisTurn = true;
    }
    // (chat fix 2 2026-11-08) «ما طلبنا الأملاح لسا. أطلبها؟»، «ما عليه أكسجين… أحطله؟»: a yes orders it, a no drops it.
    if (DM && line && to === 'nurse' && (read.offerTest || read.offerAct) && (!E.pending || ['interpret', 'which'].includes(E.pending.type))) {
      const en = read.offerTest ? testOf(read.offerTest).en : (actOf(read.offerAct) || {}).en || read.offerAct;
      E.pending = { type: 'offer', ...(read.offerTest ? { id: read.offerTest } : { a: { id: read.offerAct } }), ask: `The nurse offered to start ${en} now. good = yes, withdraw = no, na = not a reply.`, since: E.sim, turnAt: E.turns, asks: 1 };
      E.askedThisTurn = true;
    }
    // (chat fix 2 2026-11-08) A plain yes that answers what she parked, or the proposals beside "which antibiotic?".
    if (DM && (read.acceptParked || read.acceptQueued)) {
      const list = read.acceptParked ? ((E.lastPark || {}).items || []).filter(q => q.sug && E.parked.includes(q) && !E.done.has(q.a.id)) : E.queue.filter(([q]) => q.type === 'dose' && q.sug).map(([q]) => q);
      E.parked = E.parked.filter(q => !list.includes(q)); E.queue = E.queue.filter(([q]) => !list.includes(q));
      // What she parked beside them with no proposal («والمضاد: أي نوع وقديش؟») becomes the open question.
      const rest = read.acceptParked ? ((E.lastPark || {}).items || []).filter(q => !q.sug && E.parked.includes(q) && !E.done.has(q.a.id)) : [];
      if (read.acceptParked) E.lastPark = null;
      list.forEach(q => order({ ...q.a, dose: q.sug, sayDose: shortTip(q), _asked: true, _ok: 'good' }, text));
      if (rest.length && (!E.pending || E.pending.type === 'interpret')) { const q = rest[0]; E.parked = E.parked.filter(x => x !== q); E.pending = q; q.since = E.sim; q.turnAt = E.turns; q.asks = 1; E.qLine = ['n', shortAsk(q)]; }
      if (read.acceptQueued && E.pending && E.pending.type === 'dose') E.qLine = ['n', shortAsk(E.pending)];
    }
    if (to === 'supervisor' && !read.noHelp) E.helps++;
    const answered = E.resolved && open ? (open.a ? open.a.id : open.id) : null;
    const swapped = a => open && open.type === 'unsafe' && open.allergic && !allergicTo(a, E.c.care[a.id] || {}, text);
    const once = (x, i, all) => all.findIndex(y => y.id === x.id) === i;
    (read.actions || []).filter(once).filter(a => a.id !== answered || swapped(a)).forEach(a => (NM() ? nurseAct(a, text) : order(a, text)));
    // (chat fix 2026-11-08) Doctor room: tests alone get a word from the nurse before their results, never silence.
    // (chat fix 2 2026-11-08) A test dangerous right now gets the supervisor's «استنى», not the nurse's «حاضر» beside it.
    const harmNow = id => { const res = E.c.results[id] || {}; return res.ind === 'harm' || (res.whenShock === 'harm' && untreatedSbp() < 90); };
    const newTests = DM && !nA ? (read.tests || []).filter(once).filter(x => x.id !== answered && !E.tests[x.id] && testOf(x.id)) : [];
    const riskT = newTests.filter(x => harmNow(x.id)), safeT = newTests.filter(x => !harmNow(x.id));
    if (safeT.length) nurse(`حاضر، ${safeT.map(x => testOf(x.id).ar).join('، و')}.`);
    if (riskT.length) nurse(`حاضر، ${riskT.map(x => testOf(x.id).ar).join(' و')}. ${(E.c.results[riskT[0].id] || {}).whenShock ? 'بس انتبه: الضغط ' + E.bp.join(' على ') + ' ومش ثابت.' : 'بس انتبه، هاد مش وقته.'}`);
    (read.tests || []).filter(once).filter(x => x.id !== answered).forEach(x => (NM() ? nurseTest(x.id, x.reason, x.reason_ok) : orderTest(x.id, x.reason, x.reason_ok)));
    flushBack();
    const col = (E.collect || []).filter(x => E.pending === x.p || E.queue.some(([q]) => q === x.p));
    E.collect = null;
    if (col.length) {
      const first = (col.find(x => x.p === E.pending) || col[0]).line;
      const held = E.queue.find(([q]) => q.type === 'unsafe');
      // (chat fix 2 2026-11-08) Doctor room: the challenge already folded into the prerequisite's question («السوائل أول،
      // والإنسولين بعدها. ماشي؟») stays behind it: a yes there starts the fluids, never the insulin.
      const folded = !NM() && held && E.pending && E.pending.type === 'dose' && held[0].def && held[0].def.early && ((E.c.care[held[0].a.id] || {}).stableHarm || {}).unlessDone === E.pending.a.id;
      // Safety first: a "yes" must never land on a question the trainee did not mean.
      if (folded) { /* one question already asked */ }
      else if (E.pending && E.pending.type === 'dose' && held) {
        E.queue = [[E.pending, first, 'n'], ...E.queue.filter(x => x !== held)];
        E.pending = held[0];
        E.pending.since = E.sim;
        person(NM() && held[2] === 'n' ? 'd' : held[2], held[1]);
      } else if (!E.pending || E.pending.type === 'dose') openDoses(first);
    }
    if (DM) {
      // The turn closes in this order: what was parked, the one short re-ask, then this turn's own question, last.
      E.inApply = false; E.bufQ = true;
      if (E.deferNext) { E.deferNext = false; nextQuestion(); }
      E.bufQ = false;
      const ql = E.qLine; E.qLine = null;
      // The nurse's own question about this message comes before her note on what she parked.
      if (ql && ql[0] === 'n') { person(...ql); sayPark(); }
      else {
        sayPark();
        const tl = E.tail; E.tail = null;
        if (tl && !E.askedThisTurn && E.pending === tl.p && (to === 'nurse' || nA || nT)) sayTail(tl);
        if (ql) person(...ql);
      }
      /* (chat fix 2 2026-11-08) A key drug, or oxygen while the SpO2 is low, is never lost on a park: on his next order,
         with nothing else open, she names it once more as the open question. */
      if (!E.pending && !E.askedThisTurn && nA) {
        const v = E.show || live();
        const q = (E.parked || []).find(x => !x.reopened && x.sug && x.parkTurn !== E.turns && !E.done.has(x.a.id) && !E.harmed.has(x.a.id) && ((E.c.care[x.a.id] || {}).key || (x.a.id === 'oxygen' && v.spo2 < 92)));
        if (q) {
          q.reopened = true; E.parked = E.parked.filter(x => x !== q);
          E.pending = q; q.since = E.sim; q.turnAt = E.turns; q.asks = 1; E.askedThisTurn = true;
          person('n', (q.a.id === 'oxygen' ? `والـSpO2 ${Math.round(v.spo2)}%: ` : 'و') + namedAsk(q) + '، ماشي؟');
        }
      }
      E.tail = null; E.merging = false;
    }
    E.lastTo = to;
    // The senior is standing in the room: asking him is calling him.
    if (!NM() && to === 'supervisor' && read.kind === 'help' && E.c.care.call_senior && !E.done.has('call_senior')) E.done.set('call_senior', { at: E.sim, last: E.sim, n: 1, dose: '', ok: 'good', amt: 0 });
    E.resolved = false;
    if (NM()) nursePost(read, to);
    director(to === 'companion' ? 'addressed' : 'turn');
  }

  function examine(id) {
    const x = E.c.exam.find(f => f.id === id);
    if (!x) return;
    const firstTime = !E.exam.has(id);
    E.exam.add(id);
    const out = E.anaph && !E.anaph.treated && x.sayReact ? x.sayReact : E.stage === 3 && x.sayCritical ? x.sayCritical : x.say;
    say('exam', out);
    E.chat.push({ r: NM() ? 's' : 'n', t: 'فحص: ' + out });
    if (NM() && firstTime) E.nurse.examAt[id] = E.sim;
    if (firstTime) log('exam', 'فحصت: ' + out);
  }

