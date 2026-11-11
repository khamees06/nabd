  // Orders whose proposal is safe to take as agreed when the trainee says the same order again.
  const REPEAT_OK = ['oxygen', 'fluids', 'paracetamol'];
  // A drug word is not an order: "بلاش اسبرين" and "بتاخدي اسبرين؟" must never give the drug.
  const NEGATED = /(?:^| )[وف]?(?:لا|ما|مش|مو|مفيش|مافي|بلاش|بدون|ممنوع|غير|مستحيل|اياك\S*|اوعك|اوعي|حذار|نتجنب|تجنب\S*|نبعد|اوقف\S*|نوقف|وقف\S*|شيل\S*|الغي\S*|avoid|no|not|never|dont|don t|without|stop|hold|لسا ما)(?: \S+){0,2}$|(?:^| )(?:بدل|بدال|instead of)(?: \S+)?$/;
  // Asking the relative to step out or wait by the door.
  const STEP_OUT = /(?:^| )(?:برا|بره|عالباب|الباب|اطلع\S*|استن\S*|تستن\S*|ابعد\S*|وسع\S*)(?: |$)/;
  const ORDER = /(?:^| )[وف]?(?:خد(?:ي|و|وا)|(?:رح |راح )?[اب](?:حط|ركب|سحب|شغل|علق|عطي|رفع|قعد|جهز)\S*|[اتنبي]?عط[يو]\S*|اعط\S*|حط\S*|ركب\S*|علق\S*|ابدا\S*|بلش\S*|جيب\S*|جهز\S*|شغل\S*|اطلب\S*|اسحب\S*|قيس\S*|افحص\S*|شيك\S*|عيد\S*|نادي\S*|اتصل\S*|ناد(?:و|وا)\S*|ابعت\S*|ضيف(?:ي|و|وا)\S*|ارفع\S*|اعمل\S*|سوي\S*|فعل|فعلي(?:ه|ها)?|فعلو\S*|بدي|بدنا|لازم|خلينا|يلا|give|start|hang|push|need|order|call|get|put|run|draw|repeat|check|activate)(?: |$)/;
  // Words that make a bare drug or procedure name a command ("IV line x2 stat", "فنتولين هلا").
  const URGENT = /(?:^| )(?:stat|ستات|بسرعه|فورا|حالا|هلا|هسا|الان|now|asap)(?: |$)/;
  const HISTORY = /^(?:هل|شو|ليش|كيف|قديش|كم|وين|مين|متي|امتي|لما|بتاخد\S*|بياخد\S*|بتوخذ\S*|بيوخذ\S*|اخذت\S*|اخدت\S*|عملت\S*|عندك|عنده|عندها|في عند\S*|جربت\S*|استعملت\S*|بتستعمل\S*|بيستعمل\S*|بتستخدم\S*|بتتحسس\S*|بيتحسس\S*|صار معك)(?: |$)/;
  const ASKS_ABOUT = /(?:بدي (?:اعرف|اسالك|اتاكد)|لازم اعرف|خلينا نشوف|شو صار|(?:^| )(?:اعطوك|اعطاه|اعطيتي|اخذتي|اخدتي)(?: |$))/;
  // "اعطوه X" is "give him X" unless it asks about the past ("اعطوه شي قبل ما يجي؟").
  const ASKS_PAST3 = /(?:^| )(?:اعطوه|اعطوها)(?: |$)/, PAST_WORD = /(?:قبل|بالبيت|بالاسعاف|امبارح|مبارح|الصبح|من شوي|اخر مره)/;
  // Every mention, from the start of its word, so "ولا تعطيه بنسلين" is seen whichever drug comes first.
  const mentionsOf = (t, kw) => {
    const p = ' ' + t + ' ', out = [];
    kw.forEach(k => {
      const n = norm(k);
      if (!n) return;
      if (n.length < 4) {
        const forms = /^[ء-ي]/.test(n) ? [n, 'و' + n, 'ف' + n, 'ب' + n, 'ل' + n] : [n];
        for (const form of forms) for (let i = p.indexOf(' ' + form + ' '); i >= 0; i = p.indexOf(' ' + form + ' ', i + 1)) out.push(i + 1);
        return;
      }
      for (let i = p.indexOf(n); i >= 0; i = p.indexOf(n, i + 1)) out.push(p.lastIndexOf(' ', i) + 1);
    });
    return out;
  };
  const freeAt = (t, i) => !NEGATED.test((' ' + t + ' ').slice(0, i).trim());
  // The same word means different things; these are the ones trainees actually type.
  // Tests a collision rule adds although none of their own words were typed.
  let FORCED = new Set();
  function collisions(t, ids, ord = ORDER) {
    FORCED = new Set();
    if (/مضاد (?:لل)?(?:صفيحات|تخثر|حموض|استفراغ|ترجيع|غثيان)/.test(t) && !/مضاد حيوي/.test(t)) ids.delete('antibiotics');
    // (chat fix 2026-11-08) «مضاد تخثر» is the drug; the clotting test is asked for by its own words.
    if (/مضاد (?:لل)?تخثر/.test(t) && !/(?:فحص|تحليل|اطلب\S*|اسحب\S*|ابعت\S*|نتيجه) (?:ال)?تخثر|inr|ptt|coag/.test(t)) ids.delete('coag');
    // «ليفوفيد» is noradrenaline, not levofloxacin.
    if (/ليفوفيد|levophed/.test(t) && !/(?:^| )ليفو(?: |$)|ليفوفلوك|levoflox|مضاد/.test(t)) ids.delete('antibiotics');
    // An opioid named is the painkiller meant; «مسكن» beside it is not a second (NSAID) order.
    if (ids.has('opioid')) ids.delete('analgesia');
    // Potassium "on the fluids" names the carrier, not a fluid order (doctor room; the nurse room has its own rule).
    if (E && !NM() && /(?:عال|على ال|علي ال|مع ال|بال|في ال)(?:سوا[ئي]ل|محلول|سيروم|سلاين)/.test(t) && [...ids].some(id => id !== 'fluids' && actOf(id))) ids.delete('fluids');
    if (/قسطره بول|foley|فولي/.test(t)) { ids.delete('cath_lab'); ids.delete('urine'); }
    else ids.delete('foley');
    if (/رينجر|ringer/.test(t)) ids.delete('lactate');
    if (/brain|دماغ|(?:^| )(?:ل?ل?راس|الراس)(?: |$)/.test(t)) ids.delete('ctpa');
    if (/septic|cardiogenic|انتاني|تاقي|anaphyl/.test(t)) ids.delete('shock');
    if (/nasal|نيزل/.test(t)) ids.delete('iv_access');
    if (/(?:بينزل|ينزل|خافض) (?:ال)?سكر/.test(t)) ids.delete('glucose');
    // "هيدروكورتيزون وريد" names a route; a cannula is asked for by its own words.
    if (ids.has('iv_access') && [...ids].some(id => id !== 'iv_access') && !/(?:كانيولا|كانولا|كنيولا|cannula|canula|iv access|iv line|iv x|(?:بدي|ركب\S*|حط\S*|افتح\S*|جيب\S*|جهز\S*) (?:ال)?iv(?: |$)|خط وريد|افتح\S* وريد|فتح وريد|(?:ركب|حط|جيب)\S* (?:ال)?وريد)/.test(t)) ids.delete('iv_access');
    if (ids.has('noradrenaline')) ids.delete('adrenaline');
    if (ids.has('neb_ipratropium') && !/فنتولين|سالبيوتامول|salbutamol|ventolin/.test(t)) ids.delete('neb_salbutamol');
    if (/ضغط\S* ماسك|ماسك حال/.test(t)) ids.delete('oxygen');
    if (!/راس|سرير|sit|قعد|جلس/.test(t)) ids.delete('sit_up');
    // Asking for a level is a test, not a drug.
    if (/(?:فحص|افحص\S*|اطلب\S*|level|مستوى|قديش|كم|شو) (?:ال)?(?:بوتاسيوم|potassium|مغنيسيوم|magnesium|صوديوم)/.test(t)) { ids.delete('potassium'); ids.delete('magnesium'); if (D.tests.some(x => x.id === 'kft')) { ids.add('kft'); FORCED.add('kft'); } }
    if (/(?:قيد|قلل|خفف)\S* (?:ال)?سوا[ئي]ل|fluid restrict/.test(t)) ids.delete('fluids');
    // Saline as the carrier of another drug is not a fluid order.
    if (/(?:في|على|ب|in) ?\d+ ?(?:مل|ml|cc)/.test(t) && [...ids].some(id => id !== 'fluids')) ids.delete('fluids');
    if (/كابتوبريل|captopril|نيفيديبين|nifedipine|adalat|اداليت/.test(t)) ids.delete('nitrate');
    if (/بطن|abdom|appendi/.test(t)) ids.delete('ctpa');
    if (!ord.test(t) && !/defib|ديفيب|ديفب|cardiovert/.test(t) && t.split(' ').length > 2) ids.delete('shock');
    if (E && !NM()) {
      // (chat fix 2 2026-11-08) Doctor room: a Latin word is named from its start («inotrope» is no troponin).
      for (const id of [...ids]) {
        const a = D.tests.find(x => x.id === id) || D.actions.find(x => x.id === id);
        const hit = a ? (a.kw || []).map(norm).filter(n => n && hasAny(t, [n])) : [];
        if (hit.length && hit.every(n => /^[a-z]/.test(n) && n.length >= 4 && !(' ' + t).includes(' ' + n))) ids.delete(id);
      }
      /* (chat fix 2 2026-11-08) Doctor room. «SBP تحت 90 او shock» is a state: a shock is ordered by an electrical word,
         by a give-verb right before it, or alone, or while VT is on the monitor. */
      if (ids.has('shock') && !E.vtNow && !/defib|ديفيب|ديفب|cardiovert|كارديوفير|(?:^| )dc(?: |$)|جول|joule|كهربا|(?:^| )اصدم\S*|synchron/.test(t)
        && !/(?:^| )(?:[اتنب]?عط\S*|اعمل\S*|جهز\S*|give|deliver)(?: \S+)? (?:ال)?(?:صدمه|shock)(?: |$)/.test(t) && !/^(?:ال)?(?:صدمه|shock)(?: (?:هسا|هلا|فورا|حالا|now|stat))?$/.test(t)) ids.delete('shock');
      // A route word («5 مل وريدي») is not a cannula: a cannula is asked for by its own words.
      if (ids.has('iv_access') && !hasAny(t, ((actOf('iv_access') || {}).kw || []).filter(k => norm(k) !== 'وريد')) && (doseIn(t) || /(?:^| )(?:بالوريد|عالوريد|وريدي|وريديه|بالعرق)(?: |$)/.test(t)) && !/(?:كانيولا|كانولا|كنيولا|كانيوله|cannula|canula|iv access|iv line|iv x|ivx|خط وريد|افتح\S* (?:ال)?وريد|فتح وريد|(?:ركب|حط|جيب)\S* (?:ال)?(?:وريد|iv))/.test(t)) ids.delete('iv_access');
      // Thrombolysis by its misspellings and by what it does («نذيب الجلطة»), unless the word is negated.
      const LY = /altepl\S*|alteplse|(?:^| )lysis(?: |$)|thrombolys\S*|ليسيس|(?:ا|ال)?لتيبلاز|(?:^| )(?:ن|ت|ي)?(?:ذيب|ذوب|ذوّب)\S* (?:ال)?(?:جلط|خثر)\S*|تذويب (?:ال)?(?:جلط|خثر)\S*/;
      const ly = t.match(LY);
      if (ly && !ids.has('thrombolysis') && D.actions.some(a => a.id === 'thrombolysis') && freeAt(t, ly.index + 1)) { ids.add('thrombolysis'); FORCED.add('thrombolysis'); }
    }
    // "heparin 4000 units IV bolus" is a way of giving heparin.
    if (/bolus|بولس/.test(t) && !/سوائل|سلاين|saline|fluid|محلول|رينجر/.test(t) && [...ids].some(id => id !== 'fluids')) ids.delete('fluids');
    return ids;
  }
  // "اكسجين 5 لتر وفنتولين 5 ملغ": each drug takes the dose written beside it.
  function clauseDose(text, kw, many) {
    if (!many) return doseIn(text);
    const part = text.split(/[،,;؛\n+]|\s+(?:مع|and)\s+|\s+و(?=\S)/).find(p => mentionsOf(norm(p), kw).length);
    return part ? doseIn(part) : '';
  }

