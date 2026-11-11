  /* chat fix 2026-11-08 (doctor room): one open question; the reply to THIS message first; an older question only
     as one short tail of this reply, then parked (named once, never deleted in silence). */
  const shortTip = p => (p.tip || '').split(' (أو')[0].split('، ')[0];
  const nameOf = p => p.name || (p.a && actOf(p.a.id) ? actOf(p.a.id).ar : 'الدوا');
  const spk = p => (p.a && SPOKEN[p.a.id]) || nameOf(p);
  // (live check 2026-11-08) Doctor room: a proposal is named in speech, never as a note («والأكسجين: nasal 2 لتر»):
  // inside a sentence «والأكسجين nasal 2 لتر», asked on its own «والأكسجين، بقترح nasal 2 لتر، ماشي؟».
  const named = p => { const t = shortTip(p); if (!t) return spk(p); return norm(t).includes(norm(nameOf(p)).split(' ')[0]) ? t : spk(p) + (NM() ? ': ' : ' ') + t; };
  const namedAsk = p => { const t = shortTip(p); return NM() || !t || norm(t).includes(norm(nameOf(p)).split(' ')[0]) ? named(p) : spk(p) + '، بقترح ' + t; };
  const shortAsk = p => p.type === 'unsafe' ? 'و' + spk(p) + '؟ بعطيه ولا لأ؟' : p.type === 'dose' ? (p.sug ? 'و' + namedAsk(p) + '، ماشي؟' : 'و' + spk(p) + (!NM() && p.a && p.a.sayName ? ': قديش الجرعة؟' : ': أي نوع وقديش؟')) : '';
  // (chat fix 2 2026-11-08) Doctor room: a drug held for an allergy is refused with its reason and an alternative asked.
  const parkLine = (list, tail) => { const d = list.filter(q => q.type === 'dose'), u = list.filter(q => q.type === 'unsafe'); const out = [d.length ? 'ما أعطيت ' + d.map(spk).join(' و') + ' لسا، بستنى كلمتك.' : '', ...u.map(q => (!NM() && q.allergic ? 'ما رح أعطي ' + spk(q) + '، عند' + hisHer() + ' حساسية منه. بدك بديل؟' : 'ما رح أعطي ' + spk(q) + ' قبل ما تأكدلي.'))].filter(Boolean).join(' '); return tail ? 'و' + out : out; };
  // The nurse asks which drug and how much; she never names one, so the order stays the trainee's.
  const VAGUE_LINE = { drug: 'أي دوا بالزبط دكتور، وقديش؟', needle: 'أي إبرة بالزبط دكتور؟ احكيلي اسم الدوا وجرعته.', analgesic: 'أي مسكن بالزبط دكتور، وقديش؟', bp: 'للضغط؟ أي دوا بالزبط، وقديش؟', fever: 'للحرارة؟ أي دوا بالزبط، وقديش؟', labs: 'أي فحوصات بدك أسحب يا دكتور؟' };
  const vagueLine = (k, sub, again) => (again ? (k === 'labs' ? 'دكتور، احكيلي أسماء الفحوصات، وبسحبها فوراً.' : 'دكتور، احكيلي اسم الدوا وجرعته، وبجهّزه فوراً.') : k === 'labs' || k === 'analgesic' ? VAGUE_LINE[k] : VAGUE_LINE[sub] || VAGUE_LINE.drug);
  const FAM = [['analgesia', 'opioid', 'paracetamol'], ['anticoag', 'thrombolysis'], ['nitrate', 'antihypertensive', 'diuretic', 'beta_blocker'], ['fluids', 'noradrenaline', 'adrenaline'], ['neb_salbutamol', 'neb_ipratropium', 'aminophylline', 'magnesium'], ['insulin', 'dextrose'], ['sedative', 'airway'], ['antacid', 'aspirin']];
  const sameFam = (x, y) => x !== y && FAM.some(f => f.includes(x) && f.includes(y));
  const BARE = /^(?:اه|ايوه|ايوا|نعم|تمام|ماشي|اوكي|اوك|طيب|لا|لاء|لا خلص|خلص)$/;
  // Only behind a vague order: the proposal it interrupted joins the next real order's proposal.
  function restoreHeld() {
    if (!E.held || !E.held.length) return;
    for (const h of E.held) if (h !== E.pending && !h.caveat && !E.queue.some(([q]) => q === h || (q.type === h.type && q.a && h.a && q.a.id === h.a.id)) && !(E.done.has(h.a.id) && !(actOf(h.a.id).repeat))) E.queue.push([h, shortAsk(h).replace(/^و/, 'دكتور، '), 'n']);
    E.held = [];
  }
  // A new question took the slot: what was open is named once, here, and parked (never asked again unless re-ordered).
  function parkOld(list, newType) {
    for (const q of list) { if (q.caveat) continue; if (q.type === 'dose' && ((q.asks || 0) < 2 && (newType === 'unsafe' || newType === 'which') || q.turnAt === E.turns || (!NM() && E.queue.some(([u]) => u.type === 'unsafe' && u.def && u.def.early && ((E.c.care[u.a.id] || {}).stableHarm || {}).unlessDone === q.a.id)))) E.held.push(q); else { if (q.type === 'dose') E.parked.push(q); E.parkNote.push(q); } }
  }
  // A note on what was parked is its own bubble, never glued to the reply about this message.
  // (chat fix 2 2026-11-08) What she said she is waiting on is remembered for one message: a plain yes then gives it.
  const notePark = list => { const d = list.filter(q => q.type === 'dose'); d.forEach(q => { q.parkTurn = E.turns; }); E.lastPark = d.length ? { turn: E.turns, items: d } : E.lastPark; };
  function sayPark(tail) { const list = E.parkNote; E.parkNote = []; if (!list.length) return; E.lastN = null; nurse(parkLine(list, tail)); E.lastN = null; notePark(list); }
  function sayTail(tl) {
    const all = tl.p.type === 'dose' ? [tl.p, ...E.queue.filter(([q]) => q.type === 'dose').map(([q]) => q)] : [tl.p];
    const list = tl.park ? all.filter(q => !q.caveat) : all;
    if (tl.park) {
      E.queue = E.queue.filter(([q]) => !all.includes(q) || list.includes(q));
      if (!list.length) { E.pending = null; nextQuestion(); return; }
      E.lastN = null;
      nurse(parkLine(list));
      E.lastN = null;
      notePark(list);
      E.parked.push(...list.filter(q => q.type === 'dose'));
      E.queue = E.queue.filter(([q]) => !list.includes(q));
      E.pending = null;
      nextQuestion();
    } else {
      // (live check 2026-11-08) Doctor room: oxygen she said was not needed («مش واطي») is not asked again: closed in silence.
      if (!NM() && tl.p.caveat) { E.queue = E.queue.filter(([q]) => q !== tl.p); if (E.pending === tl.p) E.pending = null; E.cavClosed = { p: tl.p, turn: E.turns }; nextQuestion(); return; }
      list.forEach(q => { q.asks = (q.asks || 1) + 1; });
      // (chat fix 2 2026-11-08) Doctor room: a drug with no proposal is asked by name and dose, never «والمضاد، ماشي؟».
      const sg = list.filter(q => q.sug), ns = list.filter(q => !q.sug);
      nurse(list.length > 1 ? (NM() ? 'و' + list.map(named).join('، و') + '، ماشي؟' : (sg.length ? 'و' + sg.map(named).join('، و') + '، ماشي؟' : '') + (ns.length ? (sg.length ? ' ' : '') + 'و' + ns.map(q => spk(q) + ': أي نوع وقديش؟').join(' و') : '')) : shortAsk(tl.p));
    }
  }
