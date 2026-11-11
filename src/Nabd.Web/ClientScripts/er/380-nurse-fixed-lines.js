  /* ---------- nurse mode: the doctor's and the instructor's lines (fixed) ---------- */
  const DX_Q = /(?:شو (?:عنده|عندها|التشخيص)|تشخيص|diagnos)/;
  function docLine(read, t) {
    const N = E.nurse, X = N.esc, c = E.c;
    const ordIds = N.orders.filter(o => !o.cancelled).map(o => o.id);
    const ment = (read.mentioned || mentionedIds(t)).filter(id => !NURSE_OWN.has(id));
    let line;
    // An allergy statement is heard as one, even when it names a drug ("عنده حساسية من البنسلين").
    if (ALLERGY_W.test(t)) line = 'تمام.';
    else if (DX_Q.test(t)) {
      const g = N.nm.dxAfter, dx = fell() && c.collapse && c.collapse.dx ? c.collapse.dx : g.text;
      line = reached() && (!g.gate || (E.tests[g.gate] && E.tests[g.gate].back)) ? 'الأغلب ' + dx + '.' : 'التشخيص لسا قيد التقييم.';
    } else if (/(?:^| )(?:تعال|تعالي|بسرعه|شوفها|شوفه|محتاجك|بحتاجك)(?: |$)/.test(t) && !read.readBack && !ment.length) {
      if (N.present) line = 'أنا هون.';
      else { line = comes() + '.'; later(0.2, doctorArrives); }
    } else if (read.readBack || ment.some(id => ordIds.includes(id))) line = 'آه، زي ما حكينا.';
    else if (ment.length) {
      const id = ment[0], care = c.care[id], res = c.results[id];
      const bad = testOf(id) && !actOf(id) ? !res || res.ind === 'no' || res.ind === 'harm' : !care || care.harm || care.off;
      line = bad ? 'لا، مش مناسب هسا.' : 'خلينا نخلّص الأوامر اللي حكيناها أول.';
    } else if (/(?:شو (?:بدك|اعمل|نعمل|الخطه|كمان بدك)|في اشي تاني|شو الاوامر|اوامر)/.test(t)) {
      const open = N.orders.filter(openOrd);
      line = open.length ? 'لسا بدي: ' + open.map(o => o.ar).join('، و') + '.' : 'تمام، كمّل وراقب.';
    } else if (/\d/.test(digits(t)) || /(صار|تغير|نزل|طلع|بتسوء|ساء|تدهور|اسوا|احسن|تحسن)/.test(t)) {
      if (X.reNeeded !== null && X.updateAt === null) X.updateAt = E.sim;
      line = 'تمام، كمّل وراقب، وخبّرني إذا تغيّر إشي.';
    } else if (N.allergyAskedByDoc && !N.allergyAnswered && !N.allergyToldDoc) line = 'تمام. وفي حساسية من أدوية؟';
    else line = 'تمام، شو كمان؟';
    docSay(line);
  }
  function instructorLine(read, t) {
    const named = [...new Set([...(read.named || []), ...mentionedIds(t)])];
    const toDoc = E.nurse.sex === 'F' ? 'للدكتورة' : 'للدكتور';
    if (read.whichDrug) return 'أي دوا بالزبط؟ المفتوح من الأوامر: ' + read.whichDrug.join('، و') + '.';
    if (read.suggested && read.suggested.length) return reached() ? 'اقتراح منطقي، احكيه ' + toDoc + '.' : 'اقتراح منطقي، احكيه ' + toDoc + ' بالـR تبع الـSBAR.';
    if (read.planOnly) return 'صح، الأدوية بأمر. شو بتقدر تعمل هسا ضمن صلاحيتك؟';
    if (DX_Q.test(t)) return 'التشخيص شغلة ' + docW() + '. إنت شو شايف بالأرقام وبالمريض؟';
    const drug = named.find(id => isDrug(id) || (actOf(id) && DOCTOR_ONLY.has(id)));
    if (drug) return actOf(drug).ar + ' بدو أمر طبيب. إذا شايفه لازم، اقترحه ' + (E.nurse.sex === 'F' ? 'عالدكتورة' : 'عالدكتور') + ' بالـR تبع الـSBAR.';
    if (named.some(id => NURSE_OWN.has(id) || id === 'oxygen' || NURSE_TESTS.has(id))) return 'هاد ضمن صلاحيتك. اعمله وراقب الاستجابة.';
    const T = ['شو أهم رقم على المونيتور هسا، وشو بيعني بالـABCDE؟', 'قبل أي دوا: سألت عن الحساسية والأدوية؟', 'بعد كل تدخل: شو تغيّر بالأرقام؟', 'إذا بدك تبلّغ ' + docW() + ' هسا: شو الـS والـB والـA والـR؟', 'شو بتقدر تعمل لحالك ضمن البروتوكول، وشو بدو أمر؟'];
    return T[E.nurse.teachAt++ % T.length];
  }

