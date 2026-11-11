  /* =========================================================
     NURSE MODE (2026-11-07). The trainee is the ER nurse responsible for the bed. The ER doctor (n) is
     outside and comes when called; the clinical nurse instructor (d) stands behind the trainee. Scope follows
     typical ED nursing protocols: assessment, vitals, positioning, oxygen for low SpO2, a cannula, bedside tests,
     drawing blood and escalation are the nurse's own; drugs, fluids, lab tests and imaging need the doctor's order.
     The doctor's orders come only from the case file (case.nurseMode, pinned by patch-12); his and the instructor's
     words are fixed lines, never model-written. Cases and these lines are not physician-reviewed.
     ========================================================= */
  const NURSE_OWN = new Set(['sit_up', 'iv_access', 'temp', 'bp_repeat', 'cpr', 'call_senior', 'call_icu']); // oxygen: see nurseAct
  const NURSE_TESTS = new Set(['ecg', 'glucose', 'peak_flow']); // abg and lactate need an order even though the catalog calls them bedside
  const DOCTOR_ONLY = new Set(['cath_lab', 'call_surgery', 'shock']); // plus airway support and a urinary catheter: by order only
  const REASSESS_WIN = 5, ESC_SPOKEN_MIN = 8, O2_OWN = 94;
  // Basic airway support (opening the airway, bag-valve-mask) is basic life support: the nurse's own.
  const BLS_AIR = /امبو|ambu|bvm|ambu bag|jaw thrust|chin lift|فتح (?:ال)?مجري|افتح (?:ال)?مجري|شفط|suction|رفع (?:ال)?فك|دفع (?:ال)?فك|رفع (?:ال)?ذقن/;
  const ADV_AIR = /تنبيب|نبب|intubat|انبوب|cpap|bipap|niv|rsi|بايباب|سيباب|سي باب|ضغط ايجابي/;
  const OWN_KEYS = ['oxygen', 'iv_access', 'sit_up'];
  const SCOPE_NOTE = 'الأدوية والسوائل والفحوصات المخبرية والتصوير خارج صلاحية التمريض المستقلة في بروتوكولات الطوارئ المعتادة';
  const isDrug = id => !!(actOf(id) || {}).dose && id !== 'oxygen';
  function newNurseState(c) {
    const nm = c.nurseMode, doc = nm.doctor.name;
    return {
      nm, doc, sex: nm.doctor.sex, present: false,
      esc: { calledAt: null, by: null, awaiting: false, awaitAt: null, asked: null, before: null, buf: '', turns: 0, unans: 0, sbar: null, reNeeded: null, reNeededAt: null, updateAt: null, contacts: [], hello: false, nagged: false },
      orders: [], ordersAt: null, relTurn: -99, rbTurns: 0, readBack: false,
      scope: [], scopeSaid: new Set(), notIndicated: [], given: [], interv: [], vchecks: [], stageAt: {}, lowAt: null, drawn: null, airwayAt: null, tempAt: null, allergyAt: null, examAt: {},
      said: new Set(), teachAt: 0, reassess7: 0, last7: -9, allergyToldDoc: false, allergyAskedByDoc: false, bandNoted: false, docDoing: false, lastShock: -9, alarmAt: null,
      allergyAskTurn: -99, allergyAnswered: false, allergyGuess: null, holdRel: null, escDoneTurn: -99, helpAt: [], bls: [],
      acts: D.actions.map(a => (NURSE_KW[a.id] ? { ...a, kw: a.kw.concat(NURSE_KW[a.id]) } : a)),
      rx: { docv: DOCV(norm(doc)), supv: SUPV_N(norm(c.nurse.name)), compv: compVoc(c) },
    };
  }
  // The relative called by name or by a kinship word, never by a word this patient is also called by.
  function compVoc(c) {
    const pat = new Set((c.patient.addr || []).map(w => norm(w).replace(/^يا /, '')));
    const words = ['حجه', 'حجي', 'خالتي', 'خاله', 'خالتو', 'عمي', 'عمو'].filter(w => !pat.has(w)).concat([norm(c.companion.name)]).join('|');
    return new RegExp('(?:^| )يا (?:' + words + ')(?= |$)|^(?:' + words + ')(?= |$)');
  }
  const comes = () => (E.nurse.sex === 'F' ? 'جاية' : 'جاي');
  const docW = () => (E.nurse.sex === 'F' ? 'الدكتورة' : 'الدكتور');
  const docT = () => (E.nurse.sex === 'F' ? 'الطبيبة' : 'الطبيب');
  const docKnows = () => (E.nurse.sex === 'F' ? 'الطبيبة على علم بالحالة، وهي من تطلب العناية المركزة.' : 'الطبيب على علم بالحالة، وهو من يطلب العناية المركزة.');
  const docTitle = () => (E.nurse.sex === 'F' ? 'الدكتورة ' : 'الدكتور ') + E.nurse.doc;
  const reached = () => E.nurse.esc.calledAt !== null || E.nurse.present;
  // The escalation deadline: a number of minutes, or (STEMI) two minutes after the ECG, ten at most.
  function escBy() {
    const b = E.nurse.nm.escBy;
    if (typeof b === 'number') return b;
    const t = E.tests[b.after];
    return t ? Math.min(t.at + b.plus, b.max) : b.max;
  }
  // The instructor's fixed lines: each once.
  function dOnce(key, line) {
    const N = E.nurse;
    if (!E || E.over || N.said.has(key)) return false;
    N.said.add(key); E.hints++; person('d', line);
    return true;
  }
  // Every number in a message, without the 2 of SpO2 or the 12 of 12-lead.
  const numsIn = raw => (digits(String(raw || '')).replace(/sp ?o2|o2|12[ -]?lead|١٢ ?ليد/gi, ' ').replace(/\d+(?:\.\d+)?\s*(?:ملغ|مغ|ملجم|mg|mcg|ميكرو\S*|ml|مل|cc|لتر|ليتر|l\/min|lpm|units?|وحد\S*|mmol|مليمول|غرام|جرام|g\b|kg|كيلو|سنه|سنة|سنين|عام|ساعه|ساعة|ساعات|دقيق\S*|يوم|ايام)/gi, ' ').match(/\d+(?:\.\d+)?/g) || []).map(Number);
  const HIST_RX = /(معروف|معروفه|مزمن|مزمنه|تاريخ مرضي|قصه مرضيه|history|امراض|حساسي|تحسس|allerg|nkda|سكري|ربو|بخاخ|انسولين|عمليه|جراحه|حبوب منع|ادويته|ادويتها|(?:بياخد|بتاخد|بياخذ|بتاخذ|بيستعمل|بتستعمل) (?:\S+ )?(?:دوا|ادوي|حبوب|حب|بخاخ|انسولين|علاج|مميع|اسبرين|كورتيزون)|(?:عنده|عندها|مريض|مريضه) (?:ال)?(?:ضغط|سكري|ربو|قلب|كلي|قصور|صرع|جلطه|ذبحه)(?! *\d))/;
  const HIST_FACTS = new Set(['known', 'meds', 'allergy', 'icu', 'steroids_recent', 'controller', 'reliever', 'pill', 'surgery', 'clot_family', 'ckd', 'nsaid', 'prior', 'insulin', 'lung_hx', 'family', 'family_c', 'pregnant', 'bleeding', 'pde5', 'recent_care', 'sugar_home', 'smoke', 'clinic', 'illness', 'father_stop']);
  // A message read for SBAR. Two points a part; A only with real readings, checked against the monitor.
  function gradeSbar(raw) {
    const t = norm(raw), c = E.c, N = E.nurse;
    const who = [c.patient.name, ...(c.patient.addr || [])].map(norm).filter(Boolean).some(w => (' ' + t + ' ').includes(' ' + w + ' ') || (w.length >= 4 && t.includes(w)));
    const s = t.length >= 15 && (who || /(مريض|مريضه|سرير|عمره|عمرها)/.test(t) || /(قلقان|قلقانه|خايف|متخوف|بتسوء|بتتدهور|تعبان|تعبانه|ضيق|وجع|نازل|نازله)/.test(t));
    // Review fix 2026-11-07: B is history (conditions, medicines, allergy), never a reading («ضغطها 130») or a symptom («عندها ضيق»).
    const b = HIST_RX.test(t) || c.facts.filter(f => E.facts.has(f.id) && HIST_FACTS.has(f.id)).some(f => hasAny(t, f.kw));
    const nums = numsIn(raw), v = E.show || live(), bp = (E.bp || []).map(Number);
    const ref = [[v.spo2, 2], [v.hr, 8], [v.rr, 4], [bp[0], 10], [bp[1], 8], ...(E.tempKnown ? [[c.temp, 0.3]] : [])].filter(([x]) => Number.isFinite(x));
    const hits = nums.filter(n => ref.some(([x, tol]) => Math.abs(n - x) <= tol)).length;
    const a = nums.length >= 2 && hits >= 2, aWrong = nums.length >= 2 && hits === 0;
    const orderIds = Object.entries((N && N.nm.orders) || {}).map(([k, o]) => o.id || k);
    const goodSuggest = mentionedIds(t).some(id => orderIds.includes(id) && !NURSE_OWN.has(id));
    const r = /(تيجي|تعال|تعالي|تشوف|تقيم|بحتاج|محتاج|بقترح|اقترح|لازم|ممكن تطلب|اوامر|order|عاجل|فورا|حالا)/.test(t) || goodSuggest;
    return { s, b, a, r, aWrong, goodSuggest, allergy: ALLERGY_W.test(t), half: {} };
  }

