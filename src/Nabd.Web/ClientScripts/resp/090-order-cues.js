  // Typed orders ("اعمل صورة صدر", "بدي CBC") go to the tests, not to the patient.
  const TEST_CUES = {
    cxr: ['صوره صدر', 'صوره للصدر', 'اشعه صدر', 'اشعه للصدر', 'اشعه الصدر', 'x-ray', 'xray', 'cxr'],
    ctpa: ['صوره طبقيه', 'طبقي', 'ctpa', 'ct'],
    neck_xray: ['اشعه رقبه', 'اشعه للرقبه', 'صوره رقبه', 'صوره للرقبه'],
    cbc: ['cbc', 'تعداد دم', 'صوره دم', 'فحص دم'],
    crp: ['crp', 'مؤشرات الالتهاب', 'procalcitonin'],
    abg: ['abg', 'غازات'],
    ddimer: ['دايمر', 'd-dimer', 'ddimer'],
    viral_pcr: ['pcr', 'مسحه فيروسات', 'مسحه انفلونزا', 'مسحه كورونا'],
    strep: ['strep', 'عقديات', 'مسحه حلق', 'مسحه للحلق'],
    sputum: ['زراعه بلغم', 'فحص بلغم', 'عينه بلغم', 'afb', 'genexpert'],
    ecg: ['تخطيط قلب', 'تخطيط للقلب', 'ecg', 'ekg'],
    peak_flow: ['peak flow', 'ذروه الجريان', 'spirometry', 'سبايرومتري']
  };
  function matchTests(text) {
    const t = ' ' + norm(text) + ' ';
    return Object.keys(TEST_CUES).filter(id => TEST_CUES[id].some(c => t.includes(' ' + c + ' ') || (c.includes(' ') && t.includes(c))));
  }
  const VITAL_CUE = /(قيس|قس|اقيس|نقيس|افحص) .*(العلامات|الضغط|النبض|الحراره|الاكسجين)|vitals|علامات حيويه/;

