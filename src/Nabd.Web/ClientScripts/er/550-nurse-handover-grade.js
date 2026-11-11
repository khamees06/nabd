  // Offline, the four boxes graded by rule; A only with readings that match the monitor at the end.
  function gradeHandoverNurse(end) {
    const P = end.parts || {}, all = norm(end.sbar || '');
    const gs = gradeSbar(P.s || ''), gb = gradeSbar(P.b || ''), ga = gradeSbar((P.a || '') + ' ' + (P.s || '')), gr = gradeSbar(P.r || '');
    const s = gs.s || norm(P.s || '').length >= 25;
    const r = gr.r || /(راقب|مراقب|متابع|اعاده|اعيد|بلغ|تبليغ|ينتظر|انتظار|معلق|الاوامر|اتصل)/.test(norm(P.r || ''));
    const mention = [...E.done.keys()].filter(id => !['bp_repeat', 'temp', 'call_senior', 'call_icu'].includes(id)).some(id => hasAny(all, (E.nurse.acts.find(a => a.id === id) || actOf(id) || {}).kw || []));
    // «عنده مرض مزمن ما بعرف» is no background: an unknown history counts only beside a named condition or the allergy status.
    const pb = norm(P.b || ''), unsure = /(ما بعرف|مش عارف|مش متاكد|ما بعرفش)/.test(pb);
    const b = gb.b && (!unsure || ALLERGY_W.test(pb) || /(سكري|ربو|ضغط(?! *\d)|قلب|كلي|قصور|صرع|جلطه|بخاخ|انسولين)/.test(pb));
    return { dx: 'wrong', s, b, a: ga.a, aWrong: ga.aWrong, r, mention, allergy: ALLERGY_W.test(all), invented: claimedNurse(end.sbar || ''), note: '' };
  }
  // The same lie check, clause by clause, so "allergic to aspirin" beside "gave salbutamol" is not a claim.
  const claimedNurse = raw => String(raw).split(/[،,.\n؛;]+/).map(norm).some(cl => /(اعطيت|عطيت|اعطيناه|اعطيناها|عطيناه|عطيناها|اخذ|اخد|gave|given|started)/.test(cl) && !ALLERGY_W.test(cl)
    && D.actions.some(a => a.limits && !E.done.has(a.id) && hasAny(cl, a.kw) && !/(بدي|اقترح|نحتاج|يحتاج|تحتاج|لازم|need|plan)/.test(cl)));
  const nurseOwnKeys = () => Object.entries(E.c.care).filter(([id, d]) => d.key && d.by && OWN_KEYS.includes(id));
  const keyOrders = () => E.nurse.orders.filter(o => o.kind === 'act' && !o.reminder && !o.cancelled && !o.doctorDoes && !o.optional && ((E.c.care[o.id] || {}).key || o.when === 'collapse'));
  const nurseKeyMissing = () => [...nurseOwnKeys().filter(([id]) => !E.done.has(id)).map(([id]) => id), ...keyOrders().filter(o => o.doneAt == null).map(o => o.id)];
