  function order(a, text) {
    const meta = actOf(a.id);
    if (!meta) return;
    if (!NM() && E.parked && E.parked.length) E.parked = E.parked.filter(q => q.a.id !== a.id);
    // (chat fix 2 2026-11-08) The drug he just asked for: a dose said on its own in the next message is for it.
    if (!NM() && E.inApply && meta.dose && a.id !== 'oxygen') E.lastOrdered = { id: a.id, turn: E.turns };
    a.said = a.said || text;
    if (a.id === 'cpr') { nurse(E.stage === 3 ? 'لسا في نبض ضعيف دكتور، شو بدك قبل ما يوقف؟' : 'في نبض دكتور، مش وقت إنعاش.', { d: 'في نبض، مش وقت ضغطات. بلّغ الدكتور فوراً.' }); if (NM() && E.stage === 3 && E.nurse.esc.calledAt === null && !E.nurse.present) escalate(''); return; }
    if (a.id === 'sedative' && E.done.has('airway')) { nurse('طبيب التخدير رح يعطي المهدئ مع التنبيب.'); return; }
    const care = E.c.care[a.id], treating = E.anaph && !E.anaph.treated;
    let def = care || (E.anaph && ADJUNCT.includes(a.id) ? {} : offCase(meta));
    const early = tooEarly(def);
    if (early) def = { ...def, ...def.stableHarm, harm: true, early: true };
    if (def.after && E.tests[def.after] && E.tests[def.after].back) def = {};
    const said = norm(text);
    if (meta.pushHarm && /(?:بوتاسيوم|kcl|potassium)(?: \S+){0,4} (?:push|بوش|bolus|بولس|دفعه|مباشر\S*|stat)(?: |$)|(?:^| )(?:push|بوش|bolus|بولس|دفعه)(?: \S+){0,2} (?:بوتاسيوم|kcl|potassium)/.test(said)) def = { ...def, ...meta.pushHarm };
    if (def.niHarm && E.stage === 3 && /cpap|bipap|niv|بايباب|سي باب|قناع/.test(said) && !/intubat|تنبيب|نبب|(?:^| )rsi(?: |$)|انبوب/.test(said)) def = { ...def, ...def.niHarm };
    if (def.invasiveHarm && E.stage < 3 && /intubat|تنبيب|نبب|(?:^| )rsi(?: |$)|انبوب/.test(said)) def = { ...def, ...def.invasiveHarm };
    // Some orders wait for a number or for an earlier step; the nurse says which.
    if (!def.harm && def.needTest && !(E.tests[def.needTest] && E.tests[def.needTest].back) && !NM() && /[؟?]\s*$/.test(def.needLine || '') && !E.tests[def.needTest]) { ask({ type: 'offer', id: def.needTest, ask: `The nurse offered to order ${testOf(def.needTest).en} before ${meta.en}. good = yes, withdraw = no, na = not a reply.` }, def.needLine); return; }
    if (!def.harm && def.needTest && !(E.tests[def.needTest] && E.tests[def.needTest].back)) { nurse(def.needLine || `دكتور، قبل ${meta.ar} بدنا نتيجة ${testOf(def.needTest).ar}.`, 'لم يُنفَّذ بعد: يلزم أولاً ' + testOf(def.needTest).ar + '.'); return; }
    if (!def.harm && def.needDone && !E.done.has(def.needDone) && !NM() && /[؟?]\s*$/.test(def.needLine || '')) { ask({ type: 'offer', a: { id: def.needDone }, ask: `The nurse offered to start ${actOf(def.needDone).en} before ${meta.en}. good = yes, withdraw = no, na = not a reply.` }, def.needLine); return; }
    if (!def.harm && def.needDone && !E.done.has(def.needDone)) { nurse(def.needLine || `دكتور، قبل ${meta.ar} ما عملنا ${actOf(def.needDone).ar}.`, 'لم يُنفَّذ بعد: يلزم أولاً ' + actOf(def.needDone).ar + '.'); return; }
    const allergic = allergicTo(a, def, text);
    // An order insisted on too early does not stop the same order once it is right.
    if (!allergic && E.harmed.has(a.id) && !def.allergyKw && (early || !(care && care.stableHarm))) { nurse(`${meta.ar}؟ عملناه من شوي.`, 'سبق أن نفّذت هذا قبل قليل.'); return; }
    const prev = E.done.get(a.id);
    const rescue = (treating && a.id === 'adrenaline') || (E.vtNow && a.id === 'shock');
    /* (chat fix 2 2026-11-08) Doctor room: turning up or down what is running («ارفعوا النيترو ل 20»، «زيدلها الأكسجين»)
       is a new rate, checked like any dose; with no number she offers the next step the case suggests, or asks how much. */
    if (!NM() && a._titr && prev && !def.harm && !allergic) {
      const sg0 = def.suggest || meta.suggest || null, sq = sg0 && sg0.dose ? { a, sug: sg0.dose } : null;
      let dose = a.dose ? doseFor(sq, a.dose) || a.dose : '';
      // A drip turned up keeps its time: «ل 20 ميكرو» on a GTN running per minute is 20 mcg/min.
      const pd = doseOf(prev.dose || ''), nd = dose && doseOf(dose);
      if (pd && pd.perTime && nd && !nd.perTime) dose = dose + (pd.hour ? '/h' : '/min');
      const sp = SPOKEN[a.id] || meta.ar;
      if (!dose) {
        // Oxygen: the larger device the case names beside its proposal («(أو قناع 10 لتر)»).
        const cur = (doseOf(prev.dose || '') || {}).hi || 0;
        const steps = sg0 ? String(sg0.text).split(/\s*\(أو\s*|\)\s*/).map(s => s.trim()).filter(Boolean).map(s => ({ tip: s.replace(/[،,].*$/, ''), n: ((doseOf(s) || {}).hi) || 0 })).filter(s => s.n) : [];
        const next = a._titr === 'up' && a.id === 'oxygen' ? steps.filter(s => s.n > cur).sort((x, y) => x.n - y.n)[0] : null;
        if (next) { ask({ type: 'dose', a: { ...a }, name: meta.ar, tip: next.tip, sug: next.n + ' L/min', ask: `The nurse offered to turn ${meta.en} up to ${next.tip}. good = yes or a flow, na = not a reply, withdraw = no.` }, `${sp} هسا ${prev.dose || ''}. أعلّيه لـ${next.tip}، ماشي؟`.replace(/ +\./, '.')); return; }
        if (a._titr === 'up' && a.id === 'oxygen' && cur && steps.length && cur >= Math.max(...steps.map(s => s.n))) { nurse(`${sp} على أعلى إشي عندي هون: ${prev.dose}.`); return; }
        ask({ type: 'dose', a: { ...a }, name: meta.ar, tip: '', sug: undefined, ask: `The nurse asked the new rate of ${meta.en}. good = a correct dose, wrong = unsafe, na = not a reply, withdraw = the trainee cancels.` }, `لقديش ${a._titr === 'up' ? 'أرفع' : 'أنزّل'} ${sp} يا دكتور؟`);
        return;
      }
      if (doseBad({ ...a, dose }, def, dose, a.dose_ok)) { badDose({ ...a, dose }, meta, def); nurse(`دكتور، ${sp} ${dose}؟ هاي الجرعة مش مناسبة. راجعها.`); return; }
      give({ ...a, dose, _asked: true }, meta, def);
      return;
    }
    if (!allergic && prev && !rescue && !again(a, meta, def, prev)) return;
    // Some relatives react the moment a drug they fear is really going in.
    if (!prev) compOn('onOrder', a.id, 0.05, true);
    if (def.harm || allergic) { unsafe(a, meta, def, allergic); return; }
    const sg = treating && a.id === 'adrenaline' ? { text: 'أدرينالين 0.5 ملغ عضل بالفخذ', dose: '0.5 mg IM' } : def.suggest || meta.suggest || null;
    // (chat fix 2026-11-08) The trainee named his own drug («اعطوه مورفين»): she asks its dose, she does not propose another.
    const ownAgent = !NM() && meta.dose && !a.dose && a.sayName && sg && sg.dose && !norm(sg.text).includes(norm(a.sayName));
    let propose = sg && !ownAgent ? (sg.dose ? `بقترح ${sg.text}، ماشي؟` : sg.text) : '';
    // (chat fix 2026-11-08) A culture already drawn is not asked about again.
    if (!NM() && E.tests.blood_culture) propose = propose.replace(/\s*بسحب زراع[هة] الدم قبل[؟?]/, '');
    // (chat fix 2 2026-11-08) Oxygen the case gives only below a number: with the SpO2 above it she says so and asks.
    let caveat = false;
    // (With a flow named, she gives it and says the number she sees.)
    if (!NM() && a.id === 'oxygen' && sg && /مع إنه/.test(sg.text) && a.dose && !a._asked && !a.sayDose && Math.round(live().spo2) >= 90) a.sayDose = `أكسجين ${a.dose}، مع إنه الـSpO2 ${Math.round(live().spo2)}%`;
    if (!NM() && a.id === 'oxygen' && sg && /مع إنه/.test(sg.text) && !a.dose) { const n = Math.round(live().spo2), base = sg.text.split('،')[0]; caveat = n >= 90; propose = caveat ? `الـSpO2 ${n}%، يعني مش واطي. إذا بدك إياه برضو بحط ${base}، ماشي؟` : `بقترح ${base}، ماشي؟`; }
    // (chat fix 2 2026-11-08) Doctor room: oxygen ordered by its device («ماسك»، «nasal»، «non-rebreather») takes the flow
    // the case's own proposal gives that device; nothing is invented.
    if (!NM() && a.id === 'oxygen' && !a.dose && !a._asked && sg && !caveat) {
      const said = norm(text);
      const dev = /non ?rebreather|(?:^| )nrb(?: |$)|ريزرفوار|reservoir/.test(said) ? /non.?rebreather/i : /(?:^| )(?:ال)?(?:ماسك|قناع|mask)(?: |$)/.test(said) ? /قناع|mask|ماسك/i : /nasal|نيزل|(?:^| )(?:انفي|انفيه)(?: |$)/.test(said) ? /nasal/i : null;
      const part = dev && String(sg.text).split(/\s*\(أو\s*|\)\s*/).map(x => x.replace(/[،,].*$/, '').trim()).find(x => dev.test(x));
      const n = part && (doseOf(part) || {}).hi;
      if (n) { a.dose = n + ' L/min'; a.sayDose = part; }
    }
    if (meta.dose && !a.dose && !a._asked) {
      // The same safe order said again is "yes, as you proposed": nobody waits on a proposal for oxygen.
      const open = E.pending && E.pending.type === 'dose' && E.pending.a.id === a.id ? E.pending : E.queue.map(x => x[0]).find(q => q.type === 'dose' && q.a.id === a.id);
      if (open && open.sug && REPEAT_OK.includes(a.id)) {
        if (open !== E.pending) E.queue = E.queue.filter(([q]) => q !== open);
        order({ ...open.a, dose: open.sug, sayDose: open.tip.split(' (أو')[0].split('، ')[0], _asked: true, _ok: 'good' }, text);
        return;
      }
      if (ownAgent) { ask({ type: 'dose', a, name: a.sayName, tip: '', sug: undefined, ask: `The nurse asked the dose of ${a.sayName} (${meta.en}). Reference: ${def.dose || 'standard dose'}. good = a correct dose, partial = roughly right, wrong = unsafe or wrong, na = not a reply, withdraw = the trainee cancels the order.` }, `${a.sayName}، حاضر. قديش الجرعة؟`); return; }
      ask({ type: 'dose', a, name: meta.ar, tip: sg ? sg.text : '', sug: sg ? sg.dose : undefined, caveat, ask: `The nurse asked the dose of ${meta.en}. Reference: ${def.dose || 'standard dose'}.${sg ? ` She proposed: ${sg.text}${sg.dose ? ' A plain yes accepting her proposal = "good".' : ''}` : ''} good = a correct dose or flow, partial = roughly right, wrong = unsafe or wrong, na = not a reply, withdraw = the trainee cancels the order.` }, sg ? (caveat || !NM() ? (!NM() ? (norm(sg.text).includes(norm(meta.ar).split(' ')[0]) && !caveat ? '' : `${meta.ar}؟ `) + propose.replace(/\s*\(أو\s*([^()]*)\)/g, '، أو $1') : `${meta.ar}؟ ${propose}`) : `${meta.ar}، حاضر. ${propose}`) : (def.rb || `${meta.ar}، كم الجرعة؟`));
      return;
    }
    // A number written with the order gets the same check as one given to the nurse.
    if (def.ivOnly && SUBCUT.test(norm((a.dose || '') + ' ' + text))) {
      E.wrongDoses.push({ ar: meta.ar, dose: 'تحت الجلد', ref: def.dose || '' });
      ask({ type: 'dose', a: { ...a, dose: '' }, retried: true, name: meta.ar, tip: sg ? sg.text : '', sug: sg ? sg.dose : undefined, ask: `The nurse said ${meta.en} must run IV here, not under the skin. good = an IV rate, na = not a reply.` }, `دكتور، تحت الجلد ما بينفع بهالحالة، بدنا تسريب وريدي. ${sg ? 'بقترح ' + sg.text + '، ماشي؟' : ''}`);
      return;
    }
    if (a.dose && !a._asked && doseBad(a, def, text, a.dose_ok)) {
      badDose(a, meta, def);
      // (chat fix 2 2026-11-08) Doctor room: the drug by the name he typed, and «راجعها» for his own agent.
      const bn = !NM() && a.sayName ? a.sayName : meta.ar, own = !NM() && a.sayName && !(sg && sg.dose && norm(sg.text).includes(norm(a.sayName)));
      ask({ type: 'dose', a: { ...a, dose: '' }, retried: true, name: !NM() && a.sayName ? a.sayName : meta.ar, tip: sg && !own ? sg.text : '', sug: sg && !own ? sg.dose : undefined, ask: `The nurse rejected the dose of ${meta.en}. Reference: ${def.dose || 'standard dose'}.${sg ? ` She proposed: ${sg.text}${sg.dose ? ' A plain yes accepting it = "good".' : ''}` : ''} good = a correct dose, wrong = still wrong, na = not a reply, withdraw = the trainee cancels the order.` }, `دكتور، ${bn} ${a.dose}؟ هاي الجرعة مش مناسبة. ${own ? 'راجعها: قديش بدك؟' : propose || 'راجعها.'}`);
      return;
    }
    // An infusion step needs a rate; a single dose is not the infusion.
    if (def.rateOnly && a.dose && !(doseOf(a.dose) || {}).perTime) {
      ask({ type: 'dose', a: { ...a, dose: '' }, retried: true, name: meta.ar, tip: sg ? sg.text : '', sug: sg ? sg.dose : undefined, ask: `The nurse asked for the infusion rate of ${meta.en}, not a single dose. Reference: ${def.dose || ''}. good = a rate per hour, wrong = a single dose again, na = not a reply.` }, `دكتور، بدنا تسريب مش جرعة وحدة: قديش بالساعة؟ ${sg ? 'بقترح ' + sg.text + '، ماشي؟' : ''}`);
      return;
    }
    if (a.dose && overTotal(a, meta, def)) return;
    give(a, meta, def);
  }
  const badDose = (a, meta, def) => { E.wrongDoses.push({ ar: meta.ar, dose: a.dose, ref: def.dose || '' }); log('harm', `جرعة غير صحيحة: ${meta.ar} ${a.dose}`); };

  // An order can arrive whole while its own question is still open: that question is then spent.
  function settle(same) {
    E.queue = E.queue.filter(([q]) => !same(q));
    if (!NM()) { if (E.held) E.held = E.held.filter(q => !same(q)); if (E.parked) E.parked = E.parked.filter(q => !same(q)); }
    if (!E.pending || !same(E.pending)) return;
    E.pending = null;
    nextQuestion();
  }

