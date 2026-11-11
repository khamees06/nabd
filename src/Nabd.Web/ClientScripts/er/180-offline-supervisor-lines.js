  // (chat fix 2026-11-08) One list for the stage coaching and the questions: a line is said once, and a line about a
  // step already done or a result already back is skipped.
  function pickTeach() {
    const said = E.teachSaid || (E.teachSaid = new Set());
    const tests = Object.keys(E.tests);
    // (chat fix 2 2026-11-08) The ABC opener is for the first minutes only.
    const stale = l => (/bedside test/i.test(l) && tests.some(id => ['glucose', 'ecg', 'abg', 'ketones'].includes(id))) || (/أول test/.test(l) && tests.length > 0) || (/أول order/.test(l) && E.done.size > 0) || (/history/.test(l) && E.facts.size >= 3) || (/ABC/.test(l) && (E.done.size >= 2 || E.sim > 3));
    const next = (E.c.teach || []).find(l => !said.has(l) && !stale(l));
    if (next) said.add(next);
    return next || null;
  }
  // The teaching questions come in turn and none twice; after the last, the supervisor lets the trainee work.
  function teachLine() {
    if (!NM()) {
      const l = pickTeach();
      if (l) return l;
      const after = ['كمّل، أنا هون إذا احتجتني. احكيلي أهم رقم وشو خطوتك الجاية.', 'شو تغيّر بالأرقام بعد آخر إشي عملته؟', 'لخّصلي الحالة بجملتين: شو عندك، وشو ناقص؟'];
      E.afterAt = E.afterAt || 0;
      return after[E.afterAt++ % after.length];
    }
    E.teachAt = (E.teachAt || 0);
    const after = ['كمّل، أنا هون إذا احتجتني. احكيلي أهم رقم وشو خطوتك الجاية.', 'شو تغيّر بالأرقام بعد آخر إشي عملته؟', 'لخّصلي الحالة بجملتين: شو عندك، وشو ناقص؟'];
    if (E.teachAt >= E.c.teach.length) return after[(E.teachAt++ - E.c.teach.length) % after.length];
    return E.c.teach[E.teachAt++];
  }
  // Offline, the supervisor answers the kind of question asked; he never names the diagnosis.
  function supervisorLine(read, t) {
    // (chat fix 2026-11-08) A reading said unasked is heard, not graded offline, and never answered for the trainee.
    if (read.readingOf && !NM()) return 'تمام، سمعت قراءتك. شو خطوتك الجاية بناءً عليها؟';
    const c = E.c, drug = (read.named || []).map(id => ({ id, care: c.care[id] || {}, meta: actOf(id) })).find(x => x.meta && x.meta.dose);
    const reasoningQ = /(?:^| )(?:ليش|ليه|لماذا|why|متي|امتي|لو|اذا|وقتها)(?: |$)/.test(t);
    /* (chat fix 2 2026-11-08) Doctor room: he answers the kind of question asked, with the room's numbers, and never the
       diagnosis: the diagnosis itself, a patient sent home, a test to read, where the patient goes. */
    if (!NM()) {
      const v = E.show || live(), nums = `الضغط ${E.bp.join(' على ')} والـSpO2 ${Math.round(v.spo2)}%`;
      if (read.dxAsk) return 'التشخيص إنت بتوصله، مش أنا. شو أهم علامتين لقيتهم لهلأ؟';
      if (read.dispoHome) return E.stage >= 1 || +E.bp[0] < 100 || v.spo2 < 92 || keyMissing().length ? `لا، استنى. ${nums}. هاد مش مريض بيت. شو ناقصه قبل ما نقرر وين يروح؟` : 'البيت؟ شو اللي مخليك مرتاح إنه يروّح، وشو بتكتب بالتسليم؟';
      const tz = nz(read.text || '');
      const T = D.tests.find(x => (x.kw || []).some(k => (norm(k).length >= 4 || /[a-z]/.test(k)) && wordHas(tz, k)));
      if (T && !drug && /(?:قرا|قراي|قراء|بتقرا|اقرا|interpret|read|شو (?:بيحكي|طلع|فيه|في|شايف)|شو رايك|شو بتشوف)/.test(t)) {
        if (E.tests[T.id] && E.tests[T.id].back) return T.id === 'ecg' ? 'إنت شو شايف؟ ابدأ بالـrate والـrhythm، وبعدين الـST: وين طالع ووين نازل؟' : 'اقرأها إنت أول: شو أهم رقم فيها، وشو بيعني عند هالمريض؟';
        return E.tests[T.id] ? 'لسا ما طلعت. شو بتتوقع يبين فيها؟' : 'لسا ما طلبته. شو بتتوقع يبين، وشو رح يغيّر بخطتك؟';
      }
      if (/(?:ننقل|نحول|نحجز|ندخل|عنايه|icu|hdu|طابق|cath|القسطره|الوجهه)/.test(t) && !/\d\s*(?:ملغ|مغ|غرام|mg|mcg|ml|مل|وحد|unit)/.test(t)) return `الوجهة حسب استجابت${hisHer()} للعلاج. هسا ${nums}: وين شايف${hisHer()} ${E.c.patient.sex === 'F' ? 'بتروح' : 'بيروح'}، وليش؟`;
    }
    if (drug && (!reasoningQ || /\d\s*(?:ملغ|مغ|غرام|mg|mcg|ml|مل|وحد|unit)/.test(t))) {
      const dose = doseIn(read.text || '');
      if (drug.care.harm || drug.care.off) return `${drug.meta.ar}؟ فكّر منيح قبل ما تعطيه: شو ممكن يعمل ${!NM() && c.patient.sex === 'F' ? 'بهالمريضة' : 'بهالمريض'} بالذات؟`;
      if (!NM()) {
        // Too early by the numbers (lysis with the pressure holding): the indication first.
        if (drug.care.stableHarm && tooEarly(drug.care)) return `${drug.meta.ar}؟ فكّر منيح: شو الاستطباب عند ${c.patient.sex === 'F' ? 'هالمريضة' : 'هالمريض'} هسا، بهالأرقام؟`;
        // Already given: nothing is added on top of it.
        const given = ['anticoag', 'thrombolysis', 'p2y12', 'aspirin'].includes(drug.id) && E.done.get(drug.id);
        if (given) return `أخد ${SPOKEN[drug.id] || drug.meta.ar} ${agoSaid(given.at)}${given.dose ? ' (' + given.dose + ')' : ''}. ما بنضيف فوقه. شو اللي مخليك تفكر بإشي تاني؟`;
        if (/(?:^| )(?:احسن|افضل|vs|مقارنه|بدل)(?: |$)/.test(t)) return 'سؤال منيح. إنت شو بتختار هون، وليش؟ احكيلي سببك وبراجعك.';
      }
      if (!dose) return `${drug.meta.ar}، ماشي. شو الجرعة والطريق اللي ببالك؟ احكيها وبراجعك.`;
      const ok = doseCheck({ id: drug.id, dose, said: read.text }, drug.care, read.text);
      const dn = (!NM() && sayNameOf(drug.id, read.text || '')) || drug.meta.ar;
      if (ok === 'ok') return !NM() && (read.actions || []).some(a => a.id === drug.id) ? `${dn} ${dose} مزبوط، كمّل.` : `${dn} ${dose} مزبوط، اطلبه من الممرضة.`;
      if (ok === 'wrong') return `لا، ${drug.meta.ar} ${dose} مش مزبوط. ${drug.care.dose ? 'المعتاد: ' + drug.care.dose : 'راجع الجرعة.'}`;
      return `${drug.meta.ar} ${dose}: اكتبه للممرضة بالجرعة والطريق، وهي بتراجعك إذا في إشي.`;
    }
    if (/(?:ننقل|نحول|نحجز|ندخل|عنايه|icu|طابق|البيت|نروح|اطلع)/.test(t)) return 'الوجهة بتقررها حسب استجابته للعلاج وثبات الأرقام. شو آخر أرقام عندك، وتحسن ولا لأ؟';
    if (/(?:ممكن (?:انا )?ابدا|من وين ابدا|شو اعمل|مش عارف|محتار|ساعدني)/.test(t)) return 'ابدأ هسا ولا تستنى: ABC أول. شو أهم رقم عالمونيتور، وشو أول order بدك تطلبه؟';
    // (chat fix 2 2026-11-08) Doctor room: "what is your evidence?" once; after that he teaches.
    if (!reasoningQ && (/(?:صح|مزبوط)$/.test(t) || /(?:صح|مزبوط) /.test(t)) && (NM() || !E.evidAsked)) { if (!NM()) E.evidAsked = true; return 'شو الدليل اللي عندك؟ احكيلي أهم نتيجة أو علامة بتدعمه.'; }
    return teachLine();
  }
