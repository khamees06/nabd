  // Offline, the nurse says what she sees and what nurses start with, reads a result's numbers, and asks what is wanted.
  function nurseLine(read, t) {
    const v = E.show || live(), c = E.c;
    const asked = D.tests.filter(x => hasAny(t, x.kw) && E.tests[x.id] && E.tests[x.id].back).map(x => x.id);
    if (asked.length) return asked.map(id => resultBrief(id)).join(' ');
    if (/(?:شو (?:ب)?رايك|نبدا|ابدا|شو نعمل|من وين)/.test(t)) {
      const first = [];
      if (Math.round(v.spo2) < 94 && !E.done.has('oxygen')) first.push('الأكسجين');
      if (!E.done.has('iv_access')) first.push('الكانيولا');
      return `دكتور، الـSpO2 ${Math.round(v.spo2)}% والنبض ${Math.round(v.hr)}.${first.length ? ' عادةً بنبلش ب' + first.join(' و') + '، ' : ' '}شو بتطلب؟`;
    }
    if (/(?:حجم|غيج|gauge|g )/.test(t) && /(?:كانيولا|كانولا|كنيولا|cannula)/.test(t)) return 'غيج 18 عالأقل، كبيرة كفاية للسوائل والدم. أركّبها؟';
    // (chat fix 2 2026-11-08) Doctor room: the temperature is said once measured, or offered.
    if (!NM() && /حراره|سخونه|(?:^| )temp/.test(t) && !/(?:ضغط|نبض|اكسجين|ارقام|spo2|sat)/.test(t)) { if (E.tempKnown) return `الحرارة ${E.c.temp.toFixed(1)}.`; read.offerAct = 'temp'; return 'ما قست الحرارة لسا. أقيسها؟'; }
    if (VITALS_Q.test(t)) return spokenVitals() + '.';
    // (chat fix 2026-11-08) Doctor room: an order she could not place gets one precise question, never "what do I do?".
    if (!NM()) return read.typedOrder || /[؟?]/.test(read.text || '') ? unplacedReply(read, t) : wordsIn(t) <= 3 ? 'نعم دكتور؟' : 'حاضر دكتور، عيني عليه.';
    return 'تمام، شو بدك أعمل؟';
  }
  // An order the reader could not place: a drug is asked by name and dose, anything else by its name.
  const unplacedOrder = t => (doseIn(t) ? 'دكتور، شو اسم الدوا بالزبط؟ ما لقطت الاسم.' : /(?:^| )[وف]?(?:[اتنب]?عط|حط|علق|ضيف|جيب|جهز|ابدا|بلش)\S*/.test(t) ? 'أي دوا بالزبط دكتور؟ احكيلي اسمه وجرعته.' : NM() ? 'دكتور، احكيلي اسم الإجراء أو الفحص بالزبط، وبعمله هسا.' : 'ما لقطت الطلب يا دكتور، شو اسمه بالزبط؟');
  // What the nurse says to an order-like message she cannot act on: never a promise she will not keep.
  function unplacedReply(read, t) {
    // «لو لسا واطي… جهزي نورأدرينالين»: a plan for later, held until the doctor says so.
    if (/(?:^| )(?:لو|اذا)(?: |$)/.test(t) && (read.named || []).length) return 'حاضر دكتور، بجهّزه وبستنى كلمتك.';
    if (/[؟?]/.test(read.text || '')) {
      if (/(?:فحص|افحص|اسمع|jvp|crackles|oedema|edema|تورم|air entry)/.test(t)) return 'الفحص عندك دكتور، وأنا معك.';
      if (NM()) return 'مش متأكدة دكتور، القرار إلك.';
      // (chat fix 2 2026-11-08) A drug that would hurt him now gets her challenge, never «القرار إلك».
      const risky = (read.named || []).find(riskyNow);
      if (risky) return riskLine(risky);
      const nd = (read.named || []).find(id => (actOf(id) || {}).dose);
      if (nd) return `${actOf(nd).ar}؟ إذا بدك ${fem(actOf(nd).ar) ? 'إياها' : 'إياه'} احكيلي الجرعة، وإذا مش متأكد اسأل المشرف.`;
      // (live check 2026-11-08) How he is, asked in words the reader missed: the monitor, never «سؤال للمشرف».
      if (/(?:^| )(?:وضعه|وضعها|حالته|حالتها|كيفه|كيفها|كيفو|طمنيني|طمنوني|طمني|تحسن|تحسنت|اتحسن|اتحسنت|اسوا|(?:هو|هي) (?:منيح|منيحه|احسن))(?: |$)/.test(t)) { read.to = 'nurse'; return howLine(); }
      return 'هاد سؤال للمشرف يا دكتور. إذا بدك إشي أعمله، احكيلي اسمه.';
    }
    if (/(?:^| )[وف]?(?:[اتنب]?عط|حط|علق|ضيف|ركب|جيب|جهز|اسحب|ابعت|اطلب|قيس|شغل|ابدا|بلش|اعمل|بدي)\S*/.test(t) || /[a-z]{2,}/.test(t)) return unplacedOrder(t);
    if (NM()) return 'حاضر دكتور.';
    // (chat fix 2 2026-11-08) Never «حاضر» for nothing: a dose alone asks of which drug; anything else asks its name.
    const dz = doseIn(read.text || '');
    if (dz) return `${dz} من أي دوا يا دكتور؟`;
    return 'ما لقطت الطلب يا دكتور. اسم الدوا أو الفحص؟';
  }
  // (chat fix 2 2026-11-08) A drug that would harm this patient now: a trap of the case, or too early by the numbers.
  const riskyNow = id => { const care = E.c.care[id]; if (!care) return !!(actOf(id) || {}).risky; return !!(care.harm || (care.stableHarm && tooEarly(care))); };
  const riskLine = id => { const care = E.c.care[id] || {}, ar = (actOf(id) || {}).ar || ''; const ch = care.harm ? care.challenge : care.stableHarm && care.stableHarm.challenge; return (ch || `دكتور، ${ar}؟ شو الاستطباب هون؟`).replace(/\s*متأكد؟\s*$/, '') + ' ما بجهّزه قبل ما المشرف يوافق.'; };
  // A name with a dose that no drug in the room has: the nurse says she does not know it.
  const KNOWN_W = /^(?:اعط\S*|عط\S*|حط\S*|علق\S*|ضيف\S*|جيب\S*|جهز\S*|ابدا\S*|بلش\S*|ركب\S*|اسحب\S*|ابعت\S*|اطلب\S*|بدي|بدنا|لازم|كمان|هسا|هلا|فورا|حالا|stat|وريد\S*|بالوريد|عضل\S*|بالعضل|تحت|الجلد|جلد|فموي|بالفم|iv|im|sc|po|حقنه|ابره|حبه|حبوب|مل|ملغ|mg|ml|mcg|ميكرو\S*|غرام|وحده|وحدات|units?|يا|سستر|دكتور|المريض|المريضه|للمريض|للمريضه|بسرعه|ببطء|دقيقه|دقايق|ساعه|bolus|بولس|مره|كمان|تسريب|نقط|بالساعه|الساعه|لكل|كيلو|بالكيلو|طيب|ماشي|اوكي|infusion|drip|دلوقتي|الحين|هلا|هسا)$/;
  const unknownName = t => { const w = t.split(' ').map(x => (x.length > 4 ? x.replace(/^[وبلف](?=\S{4})/, '') : x)).filter(x => x && !/\d/.test(x) && x.length >= 5 && !/^لل/.test(x) && !KNOWN_W.test(x) && !norm(E.c.nurse.name).split(' ').includes(x) && !norm(E.c.patient.name).split(' ').includes(x) && !D.actions.some(a => hasAny(x, a.kw)) && !D.tests.some(a => hasAny(x, a.kw))); return w.length === 1 ? w[0] : ''; };
