/*CHAT-EN-START*/
  /* ---------- 2026-11-08 (owner): the ward's English terms in the chat ----------
     What the staff and the room say (the nurse, the doctor, the supervisor, the room's notes, the examination and the
     alarms) shows its clinical terms in English, the way they are said on a Jordanian ward: «الـBP 90 على 60»,
     «اعطيته aspirin 300 mg». The patient and the relative keep their own words, and so does the trainee.
     This changes only what is shown on the page: the room's memory, the scoring and what is sent to the server keep the
     original Arabic, so the room behaves exactly as before. The rules run in order; phrases come before their words. */
  // If a browser cannot build one of these patterns, the chat keeps its Arabic instead of the room failing to start.
  const chatEn = (() => { try {
    const L ='\\u0621-\\u064A\\u0671-\\u06D3';            // an Arabic letter (the tatweel is one too)
    const NOT_L = '(^|[^' + L + '])';
    const END = '(?![' + L + '])';
    const MARKS = '[\\u064B-\\u0652\\u0640]*';            // harakat and tatweel may sit between letters
    const ALT = { 'ا': '[اأإآ]', 'أ': '[اأإآ]', 'إ': '[اأإآ]', 'آ': '[اأإآ]', 'ة': '[ةه]', 'ي': '[يى]', 'ى': '[يى]' };
    const esc = c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // A spelling-tolerant pattern for an Arabic word or phrase («الأكسجين» also matches «الاكسجين»).
    const pat = w => [...w].map(ch => (ch === ' ' ? '\\s+' : (ALT[ch] || esc(ch)) + MARKS)).join('');
    const any = ws => ws.slice().sort((a, b) => b.length - a.length).map(pat).join('|');
    // A leading «و/ف» joins an English word directly; «ب/ل/ك/ع» take a tatweel: «لـtachycardia».
    const lead = (p, art) => (p || '') + (art === 'لل' ? 'للـ' : art ? 'الـ' : p && /[بلكع]$/.test(p) ? 'ـ' : '');
    const PRE = '([وف]?[بلكع]?)';
    const rules = [];
    const raw = (re, fn) => rules.push([re, fn]);
    // A word or phrase said as one English term. Without «bare» it may carry «ال/لل»: «بالأكسجين» → «بالـO2».
    // «not» is a lookahead the match must fail (a phrase that means something else), «notBefore» a lookbehind.
    const EMIT = new Set(); // every English term this list writes (the gloss tidy-up touches only these)
    const term = (words, en, opt = {}) => {
      EMIT.add(en);
      const art = opt.bare ? '()' : '(ال|لل)?';
      raw(new RegExp((opt.notBefore ? '(?<!' + opt.notBefore + ')' : '') + NOT_L + PRE + art + '(?:' + any(words) + ')' + END + (opt.not ? '(?!' + opt.not + ')' : ''), 'g'),
        (m, a, p, ar) => a + lead(p, ar) + en);
    };
    const tail = s => (s === 'ها' || s === 'تها' ? 'تبعها' : 'تبعه');
    // A two-word phrase whose both words carry the article («الوذمة الرئوية»): a leading «ب/ل/و...» keeps the article
    // on the English word («بالـpulmonary edema», «للـICU»), never «بـالـ...».
    const def = (pairs, en) => {
      EMIT.add(en);
      for (const [a1, a2] of pairs) {
        raw(new RegExp(NOT_L + PRE + '(ال|لل)' + pat(a1) + '\\s+' + pat('ال' + a2) + END, 'g'), (m, a, p, ar) => a + lead(p, ar) + en);
        raw(new RegExp(NOT_L + PRE + '()' + pat(a1) + '\\s+' + pat(a2) + END, 'g'), (m, a, p) => a + lead(p, '') + en);
      }
    };

    /* 1. Phrases that hold «ضغط» or «حرارة» but are not a reading, and the saturation by name. */
    term(['نسبة الأكسجين', 'تشبع الأكسجين', 'نسبة الأوكسجين', 'تشبع الأوكسجين', 'الإشباع', 'التشبع', 'الساتوريشن', 'ساتوريشن'], 'SpO2', { bare: true });
    term(['التنفس بالضغط الإيجابي', 'الضغط الإيجابي', 'ضغط إيجابي'], 'positive pressure', { bare: true });
    term(['رافع ضغط', 'رافعات الضغط', 'رافع الضغط', 'رافعات ضغط', 'مقبض أوعية', 'مقبض الأوعية', 'مقبضات الأوعية', 'مقبضات أوعية'], 'vasopressor');
    term(['خافض ضغط وريدي', 'خافض للضغط وريدي'], 'IV antihypertensive');
    term(['خافض ضغط', 'خافض للضغط', 'خافضات الضغط'], 'antihypertensive');
    term(['خافض حرارة', 'خافض للحرارة', 'خافض الحرارة'], 'antipyretic');
    term(['ارتفاع ضغط الدم'], 'HTN', { bare: true });
    term(['السكر الوريدي', 'سكر وريدي', 'سكر بالوريد'], 'IV dextrose', { bare: true });
    // «تحت ضغط 90» is a BP under 90.
    raw(new RegExp(NOT_L + pat('تحت') + '\\s+(?:ال)?' + pat('ضغط') + END + '\\s*(?=\\d)', 'g'), (m, a) => a + 'BP تحت ');
    // The pulse that is felt (or is there at all) is «pulse»; a rate is HR (below).
    term(['النبض المحيطي', 'نبض محيطي', 'نبض الأطراف'], 'peripheral pulse', { bare: true });
    raw(new RegExp(NOT_L + '([وف]?(?:' + any(['في', 'فيه', 'بدون', 'بلا', 'ما في', 'مافي', 'له', 'إله', 'لها', 'إلها']) + '))\\s+(?:ال)?' + pat('نبض') + END, 'g'), (m, a, w) => a + w + ' pulse');

    /* 2. A vital sign followed by its number reads as the monitor label: «النبض 125» → «الـHR 125».
          Oxygen with a number is a saturation only with «%»; «أكسجين 6 لتر» is a flow. */
    const PCT = '\\d+(?:\\.\\d+)?\\s*%';
    for (const [ar, en, need] of [['نبض', 'HR', ''], ['ضغط', 'BP', ''], ['تنفس', 'RR', ''], ['حرارة', 'Temp', ''], ['أكسجين', 'SpO2', PCT], ['أوكسجين', 'SpO2', PCT], ['سكر', 'glucose', '']]) {
      raw(new RegExp(NOT_L + '([وف]?)(?:ال)?(?:(?:معدل|سرعة|نسبة|قراءة)\\s+(?:ال)?)?' + pat(ar) + '(?:ه|ها|و)?' + END + '(\\s*[:=]?\\s*)(?=' + (need || '\\d') + ')', 'g'), (m, a, w, sp) => a + w + 'الـ' + en + (sp || ' '));
    }
    /* 3. A reading that moves or is judged. «النبض طالع» is the rate (HR), unless the pulse's feel is meant
          («سريع وضعيف»); breathing is a rate only when a number moves («التنفس نزل من 29»); «الأكسجين تمام» is the saturation. */
    const SOFT = '(?:\\s+(?:' + any(['لسا', 'كمان', 'برضه', 'عم', 'شوي']) + '))?';
    const FEEL = '(?![^.،؟!]{0,25}' + '(?:' + any(['ضعيف', 'ضعيفة', 'قوي', 'قوية', 'خيطي', 'متساوي', 'بينحس', 'مش محسوس']) + '))';
    const MOVED = '(?=\\s+(?:' + any(['نزل', 'طلع', 'زاد', 'هبط', 'ارتفع', 'صار']) + ')\\s+(?:من\\s+|ل\\u0640?\\s*)?\\d)';
    const SAT = '(?=' + SOFT + '\\s+(?:' + any(['طالع', 'طالعة', 'نازل', 'نازلة', 'عالي', 'عالية', 'واطي', 'واطية', 'نزل', 'نزلت', 'طلع', 'طلعت', 'هبط', 'تمام', 'منيح', 'منيحة', 'طبيعي', 'طبيعية', 'ماسك', 'ماسكة', 'ماسكين']) + ')' + END + ')';
    // «النبض» is the rate (HR) unless its feel follows; «تنفس» and «أكسجين» need their context.
    for (const [ar, en, after] of [['نبض', 'HR', FEEL], ['تنفس', 'RR', MOVED], ['أكسجين', 'SpO2', SAT], ['أوكسجين', 'SpO2', SAT]]) {
      raw(new RegExp(NOT_L + PRE + '(ال|لل)' + pat(ar) + END + after, 'g'), (m, a, p, ar2) => a + lead(p, ar2) + en);
      raw(new RegExp(NOT_L + '([وف]?)' + pat(ar) + '(ه|ها|و)' + END + after, 'g'), (m, a, w, s) => a + w + 'الـ' + en + ' ' + tail(s));
    }
    // «زاد النبض»، «نزل الضغط»: the verb first.
    raw(new RegExp(NOT_L + '(' + any(['زاد', 'نزل', 'طلع', 'هبط', 'ارتفع', 'بطأ', 'بطّأ', 'تسارع']) + ')\\s+(?:ال)' + pat('نبض') + END, 'g'), (m, a, v) => a + v + ' الـHR');

    /* 4. History: «ضغط وسكري» is hypertension and diabetes, not a reading. DKA before diabetes. */
    term(['الحماض الكيتوني السكري', 'حماض كيتوني سكري', 'الحماض الكيتوني', 'حماض كيتوني'], 'DKA', { bare: true });
    raw(new RegExp(NOT_L + '(?:ال)?' + pat('ضغط') + '\\s*و\\s*(?:ال)?' + pat('سكري') + END, 'g'), (m, a) => a + 'HTN وDM');
    raw(new RegExp(NOT_L + '(?:ال)?' + pat('سكري') + '\\s*و\\s*(?:ال)?' + pat('ضغط') + END, 'g'), (m, a) => a + 'DM وHTN');
    // «عنده ضغط على صدره» is pressure on the chest, not hypertension.
    const ON_BODY = '(?!\\s*(?:' + any(['على', 'عال', 'ع', 'في', 'ب', 'بال']) + ')?\\s*(?:ال)?(?:' + any(['صدر', 'صدره', 'صدرها', 'راس', 'راسه', 'راسها', 'بطن', 'بطنه', 'بطنها', 'قلب', 'قلبه', 'قلبها']) + ')' + END + ')';
    raw(new RegExp(NOT_L + '(' + any(['عنده', 'عندها', 'عندو', 'مريض', 'مريضة', 'مرضى']) + ')\\s+' + pat('ضغط') + END + ON_BODY, 'g'), (m, a, w) => a + w + ' HTN');
    raw(new RegExp(NOT_L + '(' + any(['عنده', 'عندها', 'عندو']) + ')\\s+(?:ال)?(?:' + any(['سكر', 'سكري']) + ')' + END, 'g'), (m, a, w) => a + w + ' DM');
    // «مراقبة لصيقة للسكر» watches the glucose; otherwise «للسكر» is what a drug is for («حبوب للسكر»، «جليكلازيد للسكر»).
    raw(new RegExp(NOT_L + '(' + any(['لصيقة', 'مراقبة', 'متابعة', 'قياس', 'قيس', 'قيسي', 'قيسيله', 'قيسيلها', 'قيسوا', 'فحص', 'تحليل', 'ضبط']) + ')\\s+' + 'لل' + pat('سكر') + END, 'g'), (m, a, w) => a + w + ' للـglucose');
    raw(new RegExp(NOT_L + '([وف]?)' + 'لل' + pat('سكر') + END, 'g'), (m, a, w) => a + w + 'للـDM');
    term(['هبوط السكر', 'هبوط سكر', 'نقص السكر', 'نقص سكر'], 'hypoglycemia', { bare: true });
    // «مريض سكري» is a diabetic patient; otherwise «سكري» names the disease.
    raw(new RegExp(NOT_L + '(' + any(['مريض', 'مريضة', 'مرضى']) + ')\\s+' + pat('سكري') + END, 'g'), (m, a, w) => a + w + ' diabetic');
    raw(new RegExp(NOT_L + '([وف]?)' + pat('سكري') + END + '(?=\\s+(?:' + any(['متعرق', 'متعرقة', 'عرقان', 'عرقانة', 'كبير', 'كبيرة', 'مسن', 'مسنة', 'قديم', 'يسمي', 'بيسمي', 'يحكي', 'بيحكي', 'بيقول', 'يقول']) + ')' + END + ')', 'g'), (m, a, w) => a + w + 'diabetic');
    term(['السكري'], 'DM', { bare: true });
    term(['سكري', 'سكّري'], 'DM', { bare: true });
    term(['سكر الدم'], 'blood glucose');

    /* 5. Drugs, by their ward names; the «مضاد ...» phrases before «مضاد» alone. */
    term(['مضاد صفيحات ثان', 'مضاد صفيحات ثاني', 'مضاد صفيحات تاني', 'مضاد الصفيحات الثاني'], 'second antiplatelet');
    term(['مضاد صفيحات', 'مضادات الصفيحات', 'مضاد الصفيحات', 'مضادات صفيحات'], 'antiplatelet');
    term(['مضاد استفراغ', 'مضاد للاستفراغ', 'مضاد الاستفراغ', 'مضاد إقياء', 'مضاد للإقياء', 'مضادات الاستفراغ'], 'antiemetic');
    term(['مضاد حموضة', 'مضاد للحموضة', 'مضاد الحموضة', 'دواء معدة', 'دوا معدة', 'دواء للمعدة', 'دوا للمعدة'], 'antacid');
    term(['مضاد للفيروس', 'مضاد فيروسات', 'مضاد الفيروسات', 'مضادات الفيروسات', 'مضاد فيروسي'], 'antiviral');
    term(['مضادات التخثر', 'مضادات تخثر'], 'anticoagulants');
    term(['مضاد تخثر', 'مضاد للتخثر', 'مضاد التخثر', 'مضاد تجلط', 'مضاد للتجلط'], 'anticoagulant');
    term(['مضاد غثيان', 'مضاد للغثيان', 'مضاد ترجيع', 'مضاد للترجيع'], 'antiemetic');
    term(['مضاد حساسية', 'مضاد للحساسية', 'مضاد هيستامين', 'مضادات الهيستامين', 'مضاد الهيستامين'], 'antihistamine');
    term(['مضادات حيوية', 'المضادات الحيوية'], 'antibiotics', { bare: true });
    term(['مضاد حيوي وريدي', 'مضاد حيوي', 'مضاد الحيوي'], 'antibiotic');
    // «مضاد» alone is the antibiotic only when no word naming another family follows it («مضاد اكتئاب» stays).
    term(['مضاد'], 'antibiotic', { not: '\\s+(?:ل|ال|لل|' + any(['اكتئاب', 'تشنج', 'تشنجات', 'اختلاج', 'صرع', 'التهاب', 'فطري', 'فطريات', 'فيروس', 'ذهان', 'قلق', 'إسهال', 'سعال', 'كحة', 'نزف', 'تخثر', 'هيستامين', 'حساسية', 'غثيان', 'ترجيع']) + ')' });
    term(['مسكن أفيوني', 'مسكنات أفيونية', 'مسكن مخدر'], 'opioid');
    term(['مسكن NSAID'], 'NSAID', { bare: true });
    term(['مسكن بسيط'], 'simple analgesia');
    term(['مسكنات'], 'analgesics');
    term(['مسكن', 'مسكّن'], 'analgesic');
    term(['مميع دم', 'مميع الدم', 'مميعات الدم', 'مميع'], 'anticoagulant');
    term(['مذيب خثرة', 'مذيب الخثرة', 'مذيب جلطة', 'مذيب الجلطة', 'مذيبات الخثرة', 'مذيب'], 'thrombolytic');
    term(['مدر بول', 'مدر للبول', 'مدرات البول'], 'diuretic');
    term(['بيتا بلوكر'], 'beta blocker');
    term(['مهدئ', 'مهدّئ'], 'sedative');
    // The neb phrases before the drug names, or «بخار سالبيوتامول» would read «neb salbutamol».
    term(['بخار سالبيوتامول', 'سالبيوتامول بخار'], 'salbutamol neb');
    term(['بخار فنتولين', 'فنتولين بخار'], 'Ventolin neb');
    term(['بخار إبراتروبيوم', 'إبراتروبيوم بخار', 'بخار أتروفنت', 'أتروفنت بخار'], 'ipratropium neb');
    const DRUGS = [
      [['أسبرين', 'اسبيرين'], 'aspirin'], [['فنتولين'], 'Ventolin'], [['سالبيوتامول', 'سالبوتامول'], 'salbutamol'],
      [['إبراتروبيوم', 'ابراتروبيم', 'أتروفنت'], 'ipratropium'], [['هيدروكورتيزون'], 'hydrocortisone'], [['بريدنيزولون'], 'prednisolone'],
      [['ستيرويد', 'ستيرويدات', 'كورتيزون'], 'steroid'], [['مغنيسيوم', 'مغنيزيوم', 'ماغنيسيوم'], 'magnesium'],
      [['نورأدرينالين', 'نورادرينالين', 'نوربينفرين'], 'noradrenaline'], [['أدرينالين', 'ادرنالين', 'ابينفرين'], 'adrenaline'],
      [['أتروبين'], 'atropine'], [['أميودارون', 'كوردارون'], 'amiodarone'], [['أمينوفيلين'], 'aminophylline'],
      [['سيفترياكسون'], 'ceftriaxone'], [['تازوسين'], 'Tazocin'], [['بنسلين', 'بنسيلين', 'بنيسيلين'], 'penicillin'],
      [['باراسيتامول'], 'paracetamol'], [['بنادول'], 'Panadol'], [['بروفين'], 'Brufen'], [['فولتارين'], 'Voltaren'], [['إيبوبروفين'], 'ibuprofen'],
      [['مورفين', 'مورفينا'], 'morphine'], [['فنتانيل', 'فنتانل'], 'fentanyl'], [['هيبارين'], 'heparin'], [['إينوكسابارين', 'كليكسان'], 'enoxaparin'],
      [['نترات', 'نيتروجليسرين', 'نيترو'], 'nitrates'], [['إنسولين'], 'insulin'], [['اكترابيد'], 'Actrapid'], [['دكستروز'], 'dextrose'],
      [['فوروسيمايد', 'فيوروسيمايد', 'لازكس', 'لازيكس'], 'furosemide'], [['بيكربونات', 'بيكاربونات'], 'bicarbonate'],
      [['بوتاسيوم'], 'potassium'], [['صوديوم'], 'sodium'], [['كلوبيدوغريل', 'كلوبيدوجريل', 'بلافيكس'], 'clopidogrel'], [['تيكاغريلور', 'تيكاجريلور'], 'ticagrelor'],
      [['ميتوبرولول'], 'metoprolol'], [['لابيتالول'], 'labetalol'], [['نيكارديبين'], 'nicardipine'], [['هيدرالازين'], 'hydralazine'],
      [['أوندانسيترون', 'زوفران'], 'ondansetron'], [['ميتوكلوبراميد'], 'metoclopramide'], [['ديازيبام'], 'diazepam'], [['ميدازولام'], 'midazolam'],
      [['ثيوفيلين'], 'theophylline'], [['ليفوفيد'], 'Levophed'], [['أوميبرازول'], 'omeprazole'], [['جافيسكون'], 'Gaviscon'],
      [['ليفوفلوكساسين'], 'levofloxacin'], [['سيبروفلوكساسين'], 'ciprofloxacin'], [['أزيثرومايسين'], 'azithromycin'], [['فانكومايسين'], 'vancomycin'],
      [['ميروبينيم'], 'meropenem'], [['بيبراسيلين'], 'piperacillin'], [['أمبيسيلين'], 'ampicillin'], [['أموكسيسيلين'], 'amoxicillin'],
      [['فلوكلوكساسيلين'], 'flucloxacillin'], [['كلوكساسيلين'], 'cloxacillin'], [['ميترونيدازول'], 'metronidazole']
    ];
    for (const [ws, en] of DRUGS) term(ws, en);

    /* 6. Fluids, routes, devices and procedures. */
    term(['سوائل وريدية', 'سوايل وريدية'], 'IV fluids');
    term(['سوائل', 'سوايل'], 'fluids');
    term(['نورمال سلاين', 'نورمل سلاين', 'سلاين', 'محلول ملحي'], 'normal saline');
    term(['رينجر لاكتات', 'رينجر'], 'Ringer');
    raw(new RegExp(NOT_L + '(و?)(?:' + any(['بالوريد', 'عالوريد', 'وريدياً', 'وريديا']) + ')' + END, 'g'), (m, a, w) => a + w + 'IV');
    raw(new RegExp(NOT_L + '(و?)(?:' + any(['بالعضل', 'عالعضل', 'عضلياً', 'عضليا']) + ')' + END, 'g'), (m, a, w) => a + w + 'IM');
    raw(new RegExp(NOT_L + '(و?)(?:' + any(['تحت الجلد']) + ')' + END, 'g'), (m, a, w) => a + w + 'SC');
    raw(new RegExp(NOT_L + '(و?)(?:' + any(['عن طريق الفم', 'فموي', 'فموياً']) + ')' + END, 'g'), (m, a, w) => a + w + 'PO');
    term(['خط وريدي', 'خط وريد', 'كانيولا', 'كانولا', 'كنيولا', 'كانيولات'], 'cannula');
    term(['وريدي', 'وريدية'], 'IV', { bare: true });
    term(['قسطرة بولية', 'قسطرة بول', 'قسطرة للبول', 'فولي'], 'Foley catheter');
    // «تفعيل القسطرة» keeps its verb: «تفعيل الـcath lab». «القسطرة» alone is left as it is (a Foley or the cath lab).
    raw(new RegExp(NOT_L + '([وف]?[بل]?)(' + any(['تفعيل', 'فريق', 'غرفة', 'مختبر', 'مركز']) + ')\\s+' + pat('القسطرة') + END, 'g'), (m, a, p, w) => a + (p || '') + w + ' الـcath lab');
    term(['كاث لاب'], 'cath lab');
    term(['نيبولايزر', 'نبولايزر', 'بخار', 'جلسة بخار', 'جلسة تبخير'], 'neb');
    term(['بخاخ'], 'inhaler');
    // «ماسك» alone is also «holding» («ماسك صدره»), so only the oxygen phrases change.
    term(['ماسك بكيس', 'ماسك مع كيس', 'ماسك الكيس', 'ماسك ريزيرفوار', 'ماسك بخزان'], 'non-rebreather mask');
    term(['ماسك فنتوري', 'ماسك فينتوري'], 'Venturi mask');
    term(['ماسك أكسجين', 'ماسك الأكسجين', 'قناع أكسجين', 'قناع الأكسجين'], 'O2 mask');
    term(['قناع وجه', 'قناع الوجه'], 'face mask');
    term(['قناع'], 'mask');
    term(['أكسجين', 'أوكسجين'], 'O2');
    term(['مونيتر', 'مونيتور'], 'monitor');
    term(['تنبيب', 'التنبيب الرغامي', 'أنبوب تنفس'], 'intubation');
    term(['الإنعاش الأساسي'], 'BLS', { bare: true });
    term(['الإنعاش المتقدم'], 'ALS', { bare: true });
    term(['إنعاش قلبي رئوي', 'إنعاش قلبي', 'ضغطات صدر', 'ضغطات الصدر', 'تدليك قلب'], 'CPR');
    def([['صدمة', 'كهربائية']], 'DC shock');
    term(['صدمة كهربا'], 'DC shock');
    term(['ديفيب', 'ديفب', 'مزيل الرجفان', 'جهاز الصدمات'], 'defib');
    def([['عناية', 'حثيثة'], ['عناية', 'مركزة']], 'ICU');
    // «العناية» with its article is the unit («دخل العناية»، «للعناية»); «بعناية» (carefully), «العناية بالمريض»,
    // «العناية التمريضية» and «خطة العناية» are care, not the unit.
    raw(new RegExp(NOT_L + '(?<!' + pat('خطة') + '\\s+)' + PRE + '(ال|لل)' + pat('عناية') + END + '(?!\\s+(?:' + any(['بالمريض', 'بالمريضة', 'بالمرضى', 'به', 'بها', 'بهم', 'بالجرح', 'بالفم', 'بالجلد', 'التمريضية', 'الطبية', 'الصحية', 'اللازمة', 'الكاملة', 'الجيدة', 'اليومية']) + ')' + END + ')', 'g'), (m, a, p, ar) => a + lead(p, ar) + 'ICU');
    term(['الإنعاش'], 'resus', { bare: true });
    // «تأمين مجرى الهواء» keeps its verb: «تأمين الـairway».
    raw(new RegExp(NOT_L + PRE + '(?:' + any(['مجرى الهواء', 'مجرى التنفس']) + ')' + END, 'g'), (m, a, p) => a + (p ? (/ل$/.test(p) ? p.slice(0, -1) + 'للـ' : p + 'الـ') : 'الـ') + 'airway');
    raw(new RegExp(NOT_L + '([وف]?[بل]?)(' + any(['طبيب', 'دكتور']) + ')\\s+' + pat('التخدير') + END, 'g'), (m, a, p, w) => a + (p || '') + w + ' الـanesthesia');

    /* 7. Tests and places. */
    term(['تخطيط قلب', 'تخطيط القلب', 'تخطيط للقلب', 'تخطيط'], 'ECG');
    term(['صورة صدر', 'صورة الصدر', 'صورة للصدر', 'أشعة صدر', 'أشعة الصدر', 'أشعة للصدر'], 'chest X-ray');
    term(['طبقي شرايين الرئة', 'طبقي للرئة', 'طبقي رئة'], 'CTPA');
    term(['طبقي دماغ', 'طبقي للدماغ', 'طبقي راس', 'طبقي للراس'], 'CT head');
    term(['طبقي بطن', 'طبقي للبطن'], 'CT abdomen');
    term(['طبقي'], 'CT');
    term(['إيكو بجانب السرير', 'ألتراساوند بجانب السرير'], 'POCUS');
    term(['إيكو'], 'echo');
    term(['ألتراساوند', 'التراساوند', 'سونار'], 'ultrasound', { bare: true });
    // The radiology department is a place («النقل إلى الأشعة»); otherwise «الأشعة» is imaging.
    raw(new RegExp(NOT_L + '(' + any(['إلى', 'على', 'عن']) + ')\\s+' + pat('الأشعة') + END, 'g'), (m, a, w) => a + w + ' الـradiology');
    term(['أشعة'], 'imaging');
    term(['غازات الدم الشرياني', 'غازات الدم', 'غازات دم', 'غازات'], 'ABG');
    term(['تعداد دم', 'تعداد الدم', 'صورة دم كاملة'], 'CBC');
    term(['وظائف الكلى', 'وظائف كلى'], 'KFT');
    term(['وظائف الكبد', 'وظائف كبد'], 'LFT');
    term(['أملاح'], 'electrolytes');
    term(['زراعة بول', 'زراعة البول', 'زراعة للبول'], 'urine culture');
    term(['زراعة بلغم', 'زراعة البلغم', 'زراعة القشع'], 'sputum culture');
    term(['زراعة دم', 'زراعة الدم', 'زراعات دم'], 'blood culture');
    // «الزراعة» alone in this room is the blood culture (the only culture the cases hold).
    term(['زراعة'], 'blood culture', { not: '\\s+(?:' + any(['بول', 'البول', 'بلغم', 'البلغم', 'جرح', 'الجرح']) + ')' });
    term(['مؤشرات الالتهاب', 'مؤشرات التهاب'], 'inflammatory markers');
    term(['تخثر الدم', 'وظائف التخثر', 'فحص التخثر'], 'coag');
    term(['فحص بول', 'فحص البول', 'تحليل بول', 'تحليل البول'], 'urinalysis');
    term(['مسحة فيروسات', 'مسحة الفيروسات'], 'viral PCR');
    term(['ذروة الجريان', 'قياس ذروة الجريان'], 'peak flow');
    term(['كيتونات الدم', 'كيتونات بالدم'], 'serum ketones');
    term(['كيتونات'], 'ketones');
    term(['تروبونين'], 'troponin');
    term(['لاكتات'], 'lactate');
    term(['دي دايمر', 'دي-دايمر'], 'D-dimer');
    term(['كرياتينين'], 'creatinine');
    def([['فحوصات', 'مخبرية'], ['فحوص', 'مخبرية']], 'labs');
    term(['تحاليل'], 'labs');
    term(['فحوصات', 'فحوص'], 'investigations');
    def([['علامات', 'حيوية']], 'vitals');
    term(['مختبر'], 'lab');
    term(['طوارئ', 'طوارىء'], 'ER');
    term(['تشخيص تفريقي'], 'DDx');
    term(['تشخيص'], 'diagnosis');
    term(['جرعة'], 'dose');

    /* 8. Diagnoses and findings. */
    term(['احتشاء رئوي', 'الاحتشاء الرئوي'], 'pulmonary infarction', { bare: true });
    term(['احتشاء عضلة القلب', 'احتشاء عضلة قلبية', 'احتشاء قلبي', 'احتشاء بالقلب', 'جلطة قلبية', 'جلطة بالقلب'], 'MI');
    term(['انصمام رئوي', 'الانصمام الرئوي', 'جلطة رئوية', 'جلطة بالرئة', 'انصمام'], 'PE');
    term(['تجلط الأوردة العميقة', 'جلطة بالساق', 'جلطة الساق'], 'DVT');
    term(['صدمة إنتانية'], 'septic shock');
    term(['صدمة قلبية'], 'cardiogenic shock');
    term(['صدمة نزفية'], 'hemorrhagic shock');
    term(['صدمة تحسسية', 'صدمة حساسية', 'صدمة الحساسية'], 'anaphylactic shock');
    term(['إنتان', 'تسمم دم', 'تسمم بالدم'], 'sepsis');
    // In this room «صدمة» is mostly the electric one («يحتاج صدمة فورية»، «بعد الصدمة»); after «أو/عند/في/علامات»
    // or as «بصدمة» («دخل بصدمة») it is the state.
    raw(new RegExp(NOT_L + '(' + any(['أو', 'عند', 'في', 'حالة', 'بحالة', 'علامات', 'علامة', 'وعلامات']) + ')\\s+(ال)?' + pat('صدمة') + END, 'g'), (m, a, w, ar) => a + w + ' ' + (ar ? 'الـ' : '') + 'shock');
    raw(new RegExp(NOT_L + '([وف]?)ب' + pat('صدمة') + END, 'g'), (m, a, w) => a + w + 'بـshock');
    term(['صدمة'], 'DC shock');
    term(['ربو'], 'asthma');
    term(['التهاب رئوي', 'ذات الرئة', 'التهاب بالرئة'], 'pneumonia');
    term(['استرواح الصدر', 'استرواح صدر', 'استرواح صدري', 'استرواح'], 'pneumothorax');
    term(['وذمة رئة قلبية', 'وذمة رئوية قلبية'], 'cardiogenic pulmonary edema');
    term(['وذمة رئة حادة', 'وذمة رئوية حادة'], 'acute pulmonary edema');
    def([['وذمة', 'رئوية']], 'pulmonary edema');
    term(['وذمة رئة', 'وذمة الرئة', 'وذمة بالرئة'], 'pulmonary edema');
    term(['وذمة'], 'edema');
    term(['خراخر', 'كراكر'], 'crackles', { bare: true });
    term(['تنفس قصبي'], 'bronchial breathing', { bare: true });
    term(['احتكاك جنبي'], 'pleural rub', { bare: true });
    raw(new RegExp(NOT_L + '([وف]?)' + pat('أوردة الرقبة') + '\\s+(?:' + any(['منتفخة', 'مرفوعة', 'ممتلئة', 'بارزة', 'متوسعة']) + ')' + END, 'g'), (m, a, w) => a + w + 'الـJVP مرفوع');
    term(['أوردة الرقبة'], 'neck veins', { bare: true });
    term(['تورم pitting', 'وذمة pitting'], 'pitting edema', { bare: true });
    term(['تيبس رقبة', 'تيبس بالرقبة', 'تيبس الرقبة'], 'neck stiffness', { bare: true });
    term(['ضعف طرف', 'ضعف بالأطراف', 'ضعف بطرف'], 'limb weakness', { bare: true });
    term(['صفير زفيري'], 'expiratory wheeze');
    term(['صفير'], 'wheeze');
    term(['ضيق التنفس', 'ضيق النفس', 'ضيق نفس', 'ضيق بالنفس', 'ضيقة نفس', 'صعوبة التنفس', 'صعوبة بالتنفس'], 'SOB', { bare: true });
    term(['تسرع القلب', 'تسرع قلب', 'تسرع بالقلب'], 'tachycardia', { bare: true });
    term(['بطء القلب', 'بطء قلب', 'بطء بالقلب'], 'bradycardia', { bare: true });
    term(['رجفان أذيني'], 'AF', { bare: true });
    term(['جفاف'], 'dehydration');
    term(['قصور كلوي', 'القصور الكلوي', 'ضعف الكلى', 'ضعف كلوي'], 'renal impairment', { bare: true });
    term(['فشل كلوي', 'الفشل الكلوي', 'فشل الكلى'], 'renal failure', { bare: true });
    // «حساسية الفحص» is a test's sensitivity, not an allergy.
    term(['حساسية', 'تحسس'], 'allergy', { not: '\\s+(?:' + any(['الفحص', 'الاختبار', 'فحص', 'عالية', 'منخفضة', 'قليلة']) + ')' });
    term(['نزيف', 'نزف'], 'bleeding');
    term(['ألم صدري قلبي', 'وجع صدر قلبي'], 'cardiac chest pain', { bare: true });
    term(['وجع صدر', 'وجع بالصدر', 'وجع الصدر', 'ألم صدري', 'ألم بالصدر', 'ألم الصدر', 'ألم في الصدر', 'الألم الصدري'], 'chest pain', { bare: true });
    term(['وجع بطن', 'وجع بالبطن', 'وجع البطن', 'ألم بطني', 'ألم بالبطن', 'ألم البطن'], 'abdominal pain', { bare: true });
    term(['استفراغ', 'ترجيع', 'إقياء'], 'vomiting');
    term(['غثيان', 'لعيان نفس'], 'nausea');
    term(['صداع'], 'headache');
    term(['إسهال'], 'diarrhea');

    /* 9. The remaining vital signs, without a number. «الضغط» is not a reading in «تحت الضغط» (stress),
          «الضغط على الربلة» (pressing on) or «تنفسي بالضغط» (ventilation); those stay Arabic. */
    const NOT_BP_AFTER = '\\s*(?:' + any(['على', 'عن', 'ع']) + ')' + END;
    raw(new RegExp(NOT_L + '(?<!(?:' + any(['تحت', 'من', 'عند', 'تنفسي', 'يخفف', 'يخفف أيضاً']) + ')\\s+)' + PRE + '(ال|لل)' + pat('ضغط') + END + '(?!' + NOT_BP_AFTER + ')', 'g'), (m, a, p, ar) => a + lead(p, ar) + 'BP');
    raw(new RegExp(NOT_L + '([وف]?)' + pat('ضغط') + '(ه|ها|و)' + END, 'g'), (m, a, w, s) => a + w + 'الـBP ' + tail(s));
    raw(new RegExp(NOT_L + '([وف]?)' + pat('ضغط') + '\\s+(' + any(['مرتفع', 'عالي', 'واطي', 'منخفض', 'نازل', 'طالع']) + ')' + END, 'g'), (m, a, w, x) => a + w + 'BP ' + x);
    raw(new RegExp(NOT_L + PRE + '(ال|لل)' + pat('نبض') + END, 'g'), (m, a, p, ar) => a + lead(p, ar) + 'pulse');
    raw(new RegExp(NOT_L + '([وف]?)' + pat('نبض') + '(ه|ها|و)' + END, 'g'), (m, a, w, s) => a + w + 'الـpulse ' + tail(s));
    // «للحرارة» (a drug for it) is the fever; «الحرارة» is the temperature.
    raw(new RegExp(NOT_L + '([وف]?)' + 'لل' + pat('حرارة') + END, 'g'), (m, a, w) => a + w + 'للـfever');
    raw(new RegExp(NOT_L + PRE + '(ال|لل)' + pat('حرارة') + END, 'g'), (m, a, p, ar) => a + lead(p, ar) + 'temp');
    raw(new RegExp(NOT_L + '([وف]?)' + pat('حرار') + '(ته|تها|تو)' + END, 'g'), (m, a, w, s) => a + w + 'الـtemp ' + tail(s));
    raw(new RegExp(NOT_L + '(و?)(?:' + any(['حرارة', 'سخونة']) + ')' + END, 'g'), (m, a, w) => a + w + 'fever');
    raw(new RegExp(NOT_L + PRE + '(ال)' + pat('سكر') + END, 'g'), (m, a, p, ar) => a + lead(p, ar) + 'glucose');
    raw(new RegExp(NOT_L + '([وف]?)' + pat('سكر') + '(ه|ها|و)' + END, 'g'), (m, a, w, s) => a + w + 'الـglucose ' + tail(s));
    term(['معدل التنفس', 'سرعة التنفس'], 'RR', { bare: true });

    /* 10. Units after a number, then compound units («units/كغ/ساعة» → «units/kg/h»). */
    const UNIT = (ws, en) => raw(new RegExp('(\\d)\\s*(?:' + any(ws) + ')' + END, 'g'), (m, d) => d + ' ' + en);
    UNIT(['لتر بالدقيقة', 'لتر في الدقيقة', 'لتر/دقيقة', 'ليتر بالدقيقة', 'لتر بالدقيقه'], 'L/min');
    UNIT(['ميكروغرام/دقيقة', 'ميكروغرام بالدقيقة', 'ميكرو غرام بالدقيقة', 'مكغ/دقيقة'], 'mcg/min');
    UNIT(['ملي غرام', 'ملغم', 'ملغ', 'مغ', 'ملجم', 'ملليغرام'], 'mg');
    UNIT(['ميكروغرام', 'ميكرو غرام', 'مكغ'], 'mcg');
    UNIT(['ملي مول', 'مليمول', 'ملمول'], 'mmol');
    UNIT(['ملي', 'مل', 'سي سي'], 'ml');
    UNIT(['لتر', 'ليتر', 'لترات'], 'L');
    UNIT(['وحدات', 'وحدة'], 'units');
    UNIT(['جرام', 'غرام', 'غم', 'غ'], 'g');
    UNIT(['كيلو', 'كغ', 'كيلوغرام'], 'kg');
    raw(new RegExp('([A-Za-z])\\s*/\\s*(?:' + any(['كغ', 'كيلو']) + ')' + END, 'g'), (m, x) => x + '/kg');
    raw(new RegExp('([A-Za-z])\\s*/\\s*(?:' + any(['ساعة', 'ساعه']) + ')' + END, 'g'), (m, x) => x + '/h');
    raw(new RegExp('([A-Za-z])\\s*/\\s*(?:' + any(['دقيقة', 'دقيقه']) + ')' + END, 'g'), (m, x) => x + '/min');

    /* 11. Tidy up, only around the drug words this list writes (English already in the line is left alone):
          «allergy الـaspirin» → «aspirin allergy», «dose antibiotic» → «dose من الـantibiotic», and an English
          gloss that now repeats itself («sepsis (sepsis)»). */
    const DRUG_EN = DRUGS.map(d => d[1]).concat(['NSAID', 'antibiotic', 'antibiotics', 'second antiplatelet', 'antiplatelet', 'antiemetic', 'antacid', 'antiviral', 'antihistamine', 'opioid', 'analgesic', 'analgesics', 'anticoagulant', 'thrombolytic', 'diuretic', 'sedative', 'IV antihypertensive', 'antihypertensive', 'vasopressor', 'antipyretic', 'IV fluids', 'fluids', 'normal saline']);
    const DRUG_RE = '(?:' + DRUG_EN.slice().sort((a, b) => b.length - a.length).map(esc).join('|') + ')(?![A-Za-z])';
    raw(new RegExp('(?<![A-Za-z])allergy\\s+(?:الـ)?(' + DRUG_RE + ')', 'g'), (m, d) => d + ' allergy');
    raw(new RegExp('(?<![A-Za-z])dose\\s+(?=' + DRUG_RE + ')', 'g'), () => 'dose من الـ');
    // In a list of readings «التنفس» is the rate: «الـBP، الـHR، التنفس» → «… الـRR».
    raw(new RegExp('(الـ(?:BP|HR|pulse)\\s*،\\s*)(و?)' + pat('التنفس') + END, 'g'), (m, x, w) => x + w + 'الـRR');
    const EMIT_RE = [...EMIT].filter(x => /^[A-Za-z]/.test(x)).sort((a, b) => b.length - a.length).map(esc).join('|');
    raw(new RegExp('(?<![A-Za-z0-9])(' + EMIT_RE + ')((?:\\s+[' + L + ']+){0,2})\\s*\\(\\s*\\1\\s*\\)', 'gi'), (m, x, between) => x + between);
    return text => {
      let s = String(text == null ? '' : text);
      if (!/[؀-ۿ]/.test(s)) return s;
      for (const [re, fn] of rules) { re.lastIndex = 0; s = s.replace(re, fn); }
      return s;
    };
  } catch (e) { return text => String(text == null ? '' : text); } })();
/*CHAT-EN-END*/
  // Who speaks the ward's English terms on the page (the patient, the relative and the trainee keep their words).
  const EN_WHO = new Set(['n', 'd', 'sys', 'exam', 'alarm']);
  const shown = (who, text) => (REAL && EN_WHO.has(who) ? chatEn(text) : text);

