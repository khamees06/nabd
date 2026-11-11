  const c0 = () => E.c;
  function localReply(read) {
    const c = E.c, t = norm(read.text || '');
    if (E.pending && read.pending_ok !== 'na') return null;
    if (read.to === 'supervisor') return NM() ? instructorLine(read, t) : supervisorLine(read, t);
    if (!NM()) {
      // (chat fix 2 2026-11-08) What was done and what came back, asked: the nurse answers from the room.
      if (read.resultAsk) { read.to = 'nurse'; return resultLine(read); }
      if (read.statusOf || read.statusAll) { read.to = 'nurse'; return statusLine(read); }
      if (read.allergenRef === 'none') { read.to = 'nurse'; return 'ما في حساسية مسجّلة عندي يا دكتور. أي دوا قصدك بالزبط، وقديش؟'; }
      if (read.allergenRef === 'unknown') { read.to = 'nurse'; return 'ما سألنا عن الحساسية لسا، ولا حدا حكالي عنها. أي دوا قصدك بالزبط؟'; }
      if (read.unknownDrug) { read.to = 'nurse'; return `${read.unknownDrug}؟ ما بعرف دوا بهالاسم يا دكتور. شو قصدك؟`; }
      if (read.helpTeam) { read.to = 'nurse'; const v = E.show || live(), first = []; if (Math.round(v.spo2) < 94 && !E.done.has('oxygen')) first.push('الأكسجين'); if (!E.done.has('iv_access')) first.push('الكانيولا'); return `أنا معك دكتور. الـSpO2 ${Math.round(v.spo2)}% والنبض ${Math.round(v.hr)}.${first.length ? ' عادةً بنبلش ب' + first.join(' و') + '. اطلب وبعمله فوراً.' : ' اطلب وبعمله فوراً.'}`; }
      if (read.howIs) { read.to = 'nurse'; return howLine(); }
      if (read.resultsAll) { read.to = 'nurse'; return resultsLine(); }
      if (read.monitorAsk) { read.to = 'nurse'; return monitorLine(); }
      if (read.roomQ) { read.to = 'nurse'; read.clarify = true; const p = E.pending; return `أنا هون دكتور. ${spokenVitals()}.${p && p.type === 'dose' ? ' ' + shortAsk(p).replace(/^و/, 'وبستناك: ') : ''}`; }
      if (read.planLater) { read.to = 'nurse'; const m = testOf(read.planLater.id); return `تمام، كتبتها عالملف: ${m ? m.ar : 'الفحص'} ${read.planLater.when}.`; }
      if (read.patQ && read.to === 'patient') return patLine(read.patQ);
      // A plan for the relative to hear: told to step out or to hush, the relative does so.
      if (read.to === 'companion' && /(?:^| )(?:اطلع\S*|برا|بره|عالباب)(?: |$)/.test(t) && !/[؟?]/.test(read.text || '')) return `ماشي، أنا برا... بس طمنوني علي${hisHer()}.`;
      if (read.to === 'companion' && /(?:^| )(?:اسكت|اسكتي|اخرس|اخرسي)(?: |$)/.test(t)) return 'طيب طيب... بس طمنوني.';
      // (chat fix 2026-11-08) An order with no drug named: the nurse asks which, in one short line.
      if (read.vague && !read.actions.length && !read.tests.length) {
        read.to = 'nurse';
        // (chat fix 2 2026-11-08) «اعطوا دوا للحرارة» right after the paracetamol: she says what he already had.
        const FOR = { fever: ['paracetamol'], analgesic: ['opioid', 'analgesia', 'paracetamol'], bp: ['nitrate', 'antihypertensive'] }[read.vagueSub || (read.vague === 'analgesic' ? 'analgesic' : '')] || [];
        const had = FOR.find(id => E.done.has(id));
        if (had) { const d = E.done.get(had); return `أعطيت${hisHer()} ${SPOKEN[had] || actOf(had).ar}${d.dose ? ' ' + d.dose : ''} ${agoSaid(d.at)}. بدك إشي تاني؟ احكيلي اسمه وجرعته.`; }
        return vagueLine(read.vague, read.vagueSub, !!E.pending && E.pending.type === 'which' && E.pending.vague === read.vague && (E.pending.vagueSub || '') === (read.vagueSub || ''));
      }
      // (chat fix 2 2026-11-08) «قلتلك اعطيها»، «ماشي اعطيه» once it is given: she says she gave it.
      if (/^(?:(?:قلتلك|قلتلكم|يلا|ماشي|اه|طيب|تمام|خلص) )?(?:ا?عطي(?:ه|ها)|اعطو(?:ه|ها)|حطي(?:ه|ها)|علقي(?:ه|ها))$/.test(t) && !(E.pending && E.pending.type === 'dose') && E.lastGiven && E.turns - E.lastGiven.turn <= 2 && !(E.lastPark && E.lastPark.turn === E.turns)) { read.to = 'nurse'; read.clarify = true; const id = E.lastGiven.id, d = E.done.get(id); return `أعطيت${hisHer()} ${SPOKEN[id] || actOf(id).ar} ${agoSaid(d ? d.at : E.lastGiven.at)}.`; }
      // A bare yes or no answers only the question that is open; with none open, it is a nod.
      if ((BARE.test(t) || ACCEPT.test(t)) && !read.actions.length && !read.tests.length && !read.facts.length) {
        const p = E.pending, lastWho = (E.chat.slice().reverse().find(h => h.r !== 's') || {}).r;
        // (chat fix 2 2026-11-08) A yes right after she said what she is still waiting on («بستنى كلمتك») gives it.
        if (ACCEPT.test(t) && E.lastPark && E.lastPark.turn === E.turns && E.lastPark.items.some(q => q.sug && (E.parked || []).includes(q) && !E.done.has(q.a.id))) { read.acceptParked = true; read.to = 'nurse'; read.clarify = true; return null; }
        if (!p) { if (lastWho === 'c') { read.to = 'companion'; } else { read.to = 'nurse'; return ACCEPT.test(t) && !BARE.test(t) ? 'أي دوا بالزبط دكتور؟ احكيلي اسمه وجرعته.' : 'ماشي.'; } }
        else if (p.type === 'interpret') { read.to = 'supervisor'; read.clarify = true; return 'احكيلي شو شايف فيه بالزبط.'; }
        else {
          // (A plain yes to her own proposal is taken in apply(): nothing to ask.)
          if (p.type === 'dose' && p.sug && ACCEPT.test(t)) return null;
          // (chat fix 2 2026-11-08) A yes to "which antibiotic?" names none: it takes the proposals she made beside it.
          if (p.type === 'dose' && !p.sug && ACCEPT.test(t) && E.queue.some(([q]) => q.type === 'dose' && q.sug)) { read.acceptQueued = true; read.to = 'nurse'; read.clarify = true; return null; }
          read.to = 'nurse'; read.clarify = true;
          if (p.type === 'unsafe') return 'يعني أعطيه ' + spk(p) + ' هسا ولا لأ؟';
          // «لا» withdraws the "which drug?" (apply says so); anything else asks for the name once more.
          if (p.type === 'which') return /^(?:لا|لاء|لا خلص|خلص)$/.test(t) ? null : vagueLine(p.vague, p.vagueSub, true);
          return p.sug ? 'يعني ' + named(p) + '؟' : 'أي نوع بالزبط، وقديش؟';
        }
      }
    }
    const held = read.facts.map(id => c.facts.find(x => x.id === id)).filter(Boolean);
    // A question inside an order is still a question: someone answers it.
    if (held.length) {
      const comp = held.find(x => x.who && x.who !== 'patient'), pat = held.find(x => x.who !== 'companion');
      const f = read.to === 'companion' ? comp || pat : pat || comp;
      const askedTo = read.to;
      read.to = f === pat && !(read.to === 'companion' && f.who === 'both') ? 'patient' : 'companion';
      read.saidFact = f.id;
      // A message with several questions gets every answer, each from whoever holds it, one line after another.
      held.filter(x => x !== f).forEach((x, k) => {
        const compHas = x.who && x.who !== 'patient', patHas = x.who !== 'companion';
        const who = askedTo === 'companion' ? (compHas ? 'c' : 'p') : (patHas ? 'p' : 'c');
        (NM() ? later : soon)((NM() ? 0.3 : 0.01) * (k + 1), () => { if (who === 'p' && E.stage === 3) return; person(who, x.say); E.facts.add(x.id); });
      });
      return f.say;
    }
    // Nurse mode: a step she did and the room recorded needs no reply from anyone.
    if (NM() && read.to !== 'companion' && (read.to === 'self' || read.draw || read.airwayAssess || read.band || read.allOrders)) return null;
    if (read.forbids && !read.actions.length && !NM()) { read.to = 'nurse'; return 'تمام، ما بعطيه.'; }
    // Telling the family the plan names the treatment; it does not order it.
    if (read.unclear && read.to !== 'companion' && !NM()) { read.to = 'nurse'; return `${read.unclear}؟ بدك ${fem(read.unclear) ? 'إياها' : 'إياه'}؟`; }
    // Nurse mode: the doctor's words come from docLine in apply(), never from here.
    if (read.to === 'nurse' && NM()) return null;
    if (read.to === 'nurse' && !read.actions.length && !read.tests.length) {
      return nurseLine(read, t);
    }
    // An order with a question about the numbers: she reads them before she reads the order back.
    if (read.to === 'nurse' && read.actions.length && !read.actions.some(a => ['bp_repeat', 'temp'].includes(a.id)) && VITALS_Q.test(t) && /(?:كم|قديش|كام|شو)/.test(t)) return spokenVitals() + '.';
    if (read.to === 'nurse' && read.actions.some(a => a.id === 'iv_access') && /(?:حجم|غيج|gauge)/.test(t)) return 'غيج 18 عالأقل، كبيرة كفاية للسوائل والدم.';
    if (read.to === 'nurse') return null;
    // Spoken to, the relative answers what was said; being told what is happening settles them.
    if (read.to === 'companion') {
      // (chat fix 2 2026-11-08) Doctor room: a question the relative has no answer for gets an honest «ما بعرف», not a nod.
      if (!NM() && /(?:بتوافق\S*|موافق\S*|موافقتك|بتسمح\S*|بتسمحي|نوقع\S*|توقيع|توقعي|توقع)/.test(t)) return `يا ساتر... طيب يا دكتور، اعملوا اللي لازم. بس طمنوني علي${hisHer()}.`;
      if (!NM() && /[؟?]/.test(read.text || '') && !read.facts.length && !read.tone.explained) { const no = plainNo(read, t); if (no) return no; return 'والله ما بعرف بالزبط يا دكتور...'; }
      const L = c.companion.lines, kind = read.tone.explained || read.tone.empathy ? 'heard' : 'answer';
      const own = fresh(L[kind] || []), other = fresh(L[kind === 'heard' ? 'answer' : 'heard'] || []);
      // Out of words, a relative just nods: a short reply, never the same speech again.
      const x = own.length ? pickOf(own).say : other.length ? pickOf(other).say : pickOf(['طيب يا دكتور.', 'ماشي.', 'إن شاء الله خير.', 'طيب.']);
      E.comp.used.add(x);
      return x;
    }
    if (read.actions.length || read.tests.length || read.exam.length) return null;
    // (chat fix 2 2026-11-08) Asked again what is wrong, he says more, not the same opening word for word.
    if (read.kind === 'open') { if (!NM() && E.opened) { const f = ['pain', 'breath', 'onset', 'confusion'].map(id => c.facts.find(x => x.id === id && x.who !== 'companion' && !E.facts.has(x.id))).find(Boolean); if (f) { read.saidFact = f.id; read.facts = [f.id]; return f.say; } } E.opened = true; return c.patient.opening; }
    if (read.kind === 'smalltalk') return socialReply(read.act, read.text);
    // (chat check 2026-11-08) Doctor room: the complaint asked again, or a plain «no», before any «مش فاهم».
    if (!NM() && read.to !== 'nurse' && read.to !== 'supervisor') { const no = plainNo(read, t); if (no) return no; }
    // The plan told to the patient ("هلا بنعطيكي بخار"): a nod, not confusion.
    if (NM() && read.suggested && read.to === 'patient') return 'طيب...';
    // An order nobody could place belongs to the nurse, not to the patient.
    if (read.typedOrder && NM()) { read.to = 'supervisor'; read.noHelp = true; return 'شو الخطوة بالزبط؟'; }
    if (NM() && read.tone && read.tone.introduced) return 'أهلين.';
    if (read.typedOrder && !NM() && !read.toPat) { read.to = 'nurse'; return unplacedReply(read, t); }
    if (read.typedOrder) { read.to = 'nurse'; return 'مش فاهمة عليك دكتور، شو بالزبط بدك؟'; }
    if (/[؟?]/.test(read.text || '')) return c.patient.sex === 'F' ? 'مش فاهمة قصدك يا دكتور... شو بالزبط؟' : 'مش فاهم قصدك يا دكتور... شو بالزبط؟';
    // (chat fix 2 2026-11-08) Doctor room: words of comfort get a nod; a plain statement too, not «مش فاهم».
    if (!NM() && !HISTORY.test(t) && !/^(?:و)?(?:شو|وين|قديش|كم|متي|امتي|ليش|هل|كيف|مين)(?: |$)/.test(t)) return /(?:لا تخاف|ما تخاف|لا تخافي|ما تخافي|اطمن|اطمني|ان شاء الله|بتصير|رح تصير|رح تكون|بتكون منيح|الله يشفي|سلامتك|حبيبي|حبيبتي|ولا يهمك|رح نعطي\S*|رح نساعد\S*|احنا معك|ما تتعب\S*|ارتاح|ارتاحي|خد نفس|خدي نفس|معك|جنبك)/.test(t) ? 'إن شاء الله... الله يخليك.' : pickOf(['طيب يا دكتور...', 'ماشي...']);
    // Nobody in a resus bay leaves a doctor unanswered: the patient says what a patient would.
    return c.patient.sex === 'F' ? pickOf(['مش فاهمة عليك يا دكتور...', 'مش قادرة أركّز... شو قصدك؟', 'ما بعرف يا دكتور...']) : pickOf(['مش فاهم عليك يا دكتور...', 'مش قادر أركّز... شو قصدك؟', 'ما بعرف يا دكتور...']);
  }

