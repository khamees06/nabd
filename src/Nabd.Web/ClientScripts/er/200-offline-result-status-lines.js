  // A result said aloud: its name and its first two values.
  // (chat fix 2 2026-11-08) Doctor room: the values out of range first (up to three), and a report cut at a sentence's end.
  const rowSaid = x => x[0] + ' ' + x[1] + (x[2] ? ' ' + x[2] : '') + (x[4] === 'H' ? ' (عالي)' : x[4] === 'L' ? ' (واطي)' : x[3] ? ' (طبيعي)' : '');
  const reportCut = (s, n = 170) => { const parts = String(s || '').split(/(?<=\.)\s+/); let out = ''; for (const p of parts) { if (out && (out + ' ' + p).length > n) break; out = out ? out + ' ' + p : p; } return out.replace(/\.\s*$/, ''); };
  function resultBrief(id) {
    const r = c0().results[id] || {}, meta = testOf(id);
    if (!NM()) {
      const all = r.rows || [], flag = all.filter(x => x[4] === 'H' || x[4] === 'L');
      const rows = (flag.length ? flag.slice(0, 3) : all.slice(0, 2)).map(rowSaid);
      return `${meta.ar}: ${rows.length ? rows.join('، ') : reportCut(r.report)}.`;
    }
    const rows = (r.rows || []).slice(0, 2).map(x => x[0] + ' ' + x[1] + (x[2] ? ' ' + x[2] : ''));
    return `${meta.ar}: ${rows.length ? rows.join('، ') : (r.report || '').slice(0, 90)}.`;
  }
  /* (chat fix 2 2026-11-08) Doctor room: questions about what the room did and what came back. */
  // A litre said in words.
  const wordDose = t => (/(?:^| )(?:نص|نصف) (?:لتر|ليتر)(?: |$)/.test(t) ? '500 مل' : /(?:^| )ربع (?:لتر|ليتر)(?: |$)/.test(t) ? '250 مل' : /(?:^| )(?:لتر|ليتر)(?: |$)/.test(t) && !/\d/.test(t) ? '1 لتر' : '');
  // A value asked by name: [what the trainee types, the row it reads, the test that usually holds it].
  const ANALYTE = [
    [/(?:^| )(?:ال)?(?:بوتاسيوم|potassium|k)(?: |$)/, /^K$/, 'kft'], [/(?:^| )(?:ال)?(?:صوديوم|sodium|na)(?: |$)/, /^Na$/, 'kft'],
    [/(?:^| )(?:ال)?(?:كرياتينين|كريتينين|creatinine|creat)(?: |$)/, /creat/i, 'kft'], [/(?:^| )(?:ال)?(?:يوريا|urea)(?: |$)/, /^Urea/i, 'kft'],
    [/(?:^| )(?:ال)?(?:بيكربونات|بيكاربونات|bicarb\S*|hco3)(?: |$)/, /HCO3/, 'abg'], [/(?:^| )(?:pa)?co2(?: |$)|(?:^| )pco2(?: |$)/, /CO2/, 'abg'],
    [/(?:^| )(?:ال)?ph(?: |$)/, /^pH$/, 'abg'], [/(?:^| )(?:ال)?(?:anion gap|الانيون|انيون جاب)(?: |$)/, /Anion/i, 'kft'],
    [/(?:^| )(?:ال)?(?:لاكتيت|لاكتات|لاكتيك|lactate|lactic)(?: |$)/, /^Lactate/i, 'lactate'], [/(?:^| )(?:ال)?(?:تروبونين|تروب|troponin|trop|trops)(?: |$)/, /trop/i, 'troponin'],
    [/(?:^| )(?:ال)?(?:هيموغلوبين|هيموجلوبين|hb|hgb)(?: |$)/, /^Hb$/, 'cbc'], [/(?:^| )(?:wbc|ال?كريات البيض)(?: |$)/, /^WBC$/, 'cbc'], [/(?:^| )(?:ال)?(?:صفائح|صفايح|platelets?|plt)(?: |$)/, /^Plt$/, 'cbc'],
    [/(?:^| )(?:ال)?(?:كيتون\S*|ketones?|bhb)(?: |$)/, /BHB|hydroxy/i, 'ketones'], [/(?:^| )(?:ال)?inr(?: |$)/, /^INR$/, 'coag'],
    [/(?:^| )(?:d dimer|ddimer|دي دايمر|الدايمر|دايمر)(?: |$)/, /dimer/i, 'ddimer'], [/(?:^| )(?:ال)?(?:bnp|probnp)(?: |$)/, /BNP/i, 'bnp'], [/(?:^| )(?:ال)?crp(?: |$)/, /^CRP$/, 'crp'],
    [/(?:^| )(?:ال)?(?:سكر|glucose|جلوكوز)(?: |$)/, /^Glucose$/, 'glucose'],
  ];
  // A keyword from the start of a word, with the article or a one-letter prefix allowed.
  const wordHas = (t, k) => { const n = norm(k); if (!n) return false; if (n.length < 4) return hasAny(t, [k]); return (' ' + t).split(n).slice(0, -1).some(b => /(?:^| )(?:وال|بال|لل|ال|و|ب|ل|ف)?$/.test(b)); };
  const fem = ar => /^(?:\S+[ةه]|كانيولا|سوائل|أشعة|صورة)(?: |$)/.test(String(ar || ''));
  function resultAskOf(t) {
    const quest = /(?:^| )(?:كم|قديش|شو|وين|كيف|طلع\S*|صار|نتيج\S*|level|value|result)(?: |$)/.test(t);
    if (/(?:^| )(?:عندك|عنده|عندها|بالبيت|عاده|بتقيس\S*|بيقيس\S*|كان|كانت|بتاخد\S*|بياخد\S*)(?: |$)/.test(t)) return null;
    // A word that is also a drug («بيكربونات دلوقتي؟») asks for a value only with «كم / شو / طلع».
    if (quest || wordsIn(t) <= 2) for (const [re, row, dflt] of ANALYTE) if (re.test(t) && (quest || !/بيكربونات|بيكاربونات|bicarb/.test(t))) {
      const ids = Object.keys(E.c.results).filter(id => testOf(id) && (E.c.results[id].rows || []).some(x => row.test(x[0])));
      const back = ids.find(id => E.tests[id] && E.tests[id].back), sent = ids.find(id => E.tests[id]);
      const id = back || sent || (ids.includes(dflt) ? dflt : ids[0]) || (testOf(dflt) ? dflt : '');
      if (id) return { id, row, back: !!back, sent: !!sent };
    }
    const T = D.tests.find(x => (x.kw || []).some(k => (norm(k).length >= 4 || /[a-z]/.test(k)) && wordHas(t, k)));
    if (T && ((/(?:^| )(?:شو|كيف|وين)(?: |$)/.test(t) && /(?:^| )(?:طلع\S*|صار|فيه|في|بيحكي|بيبين|نتيج\S*|قرايه|قراءه)(?: |$)/.test(t)) || wordsIn(t) <= 3 || /نتيج/.test(t))) return { id: T.id, row: null, back: !!(E.tests[T.id] && E.tests[T.id].back), sent: !!E.tests[T.id] };
    return null;
  }
  const openFor = id => [E.pending, ...E.queue.map(q => q[0]), ...(E.parked || []), ...(E.held || [])].find(q => q && q.type === 'dose' && q.a && q.a.id === id);
  function statusOfQ(t) {
    // (A long or conditional question about the plan is not "was it given?".)
    if (wordsIn(t) > 9 || /(?:^| )(?:لو|اذا|هل)(?: |$)/.test(t)) return null;
    if (/(?:^| )[وف]?(?:ا?عطيت|حطيت|علقت|اخد|اخذ)\S*(?: \S+)? (?:ال)?(?:دوا|دواء|ادويه|علاج|اشي|شي|الادويه)(?: |$)/.test(t)) return { all: true };
    const a = D.actions.find(x => hasAny(t, x.kw) && (E.done.has(x.id) || E.harmed.has(x.id) || openFor(x.id)));
    if (a && /(?:^| )(?:شو صار|وين صار|وين وصل|ماشي|نازل\S*|شغال\S*|عليه|عليها|ا?عطيت\S*|حطيت\S*|ركبت\S*|علقت\S*|بلشت\S*|اخد\S*|اخذ\S*|كم|قديش|شو)(?: |$)|^(?:و)?(?:ال)?\S+$/.test(t)) return { id: a.id };
    if (!a && /(?:^| )(?:كم|قديش|شو) (?:ال)?اكسجين(?: |$)|(?:^| )(?:ال)?اكسجين (?:كم|قديش)(?: |$)/.test(t)) return { id: 'oxygen' };
    return null;
  }
  const agoSaid = at => { const m = E.sim - at; return m < 0.8 ? 'من شوي' : m < 1.5 ? 'من دقيقة' : m < 2.5 ? 'من دقيقتين' : 'من ' + Math.round(m) + ' دقايق'; };
  const hisHer = () => (E.c.patient.sex === 'F' ? 'ها' : 'ه');
  function resultLine(read) {
    const r = read.resultAsk, meta = testOf(r.id), res = E.c.results[r.id] || {};
    if (!meta) return 'هاد الفحص مش موجود عنا يا دكتور.';
    if (r.back) { const rows = r.row ? (res.rows || []).filter(x => r.row.test(x[0])) : []; return rows.length ? rows.map(rowSaid).join('، ') + '.' : resultBrief(r.id); }
    if (r.sent) return `نتيجة ${meta.ar} لسا ما طلعت.`;
    read.offerTest = r.id;
    return `ما طلبنا ${meta.ar} لسا. ${fem(meta.ar) ? 'أطلبها' : 'أطلبه'}؟`;
  }
  // (chat check 2026-11-08) «شو صار بالفحوصات؟»: every test asked so far, what is back and what is still out.
  function resultsLine() {
    const all = Object.values(E.tests).filter(x => testOf(x.id));
    if (!all.length) return 'ما طلبنا فحوصات لسا يا دكتور. شو بدك أسحب؟';
    const back = all.filter(x => x.back).map(x => testOf(x.id).ar), out = all.filter(x => !x.back).map(x => testOf(x.id).ar);
    return [back.length ? `طلع ${back.join('، و')}، والنتايج قدامك.` : '', out.length ? `لسا بستنى ${out.join(' و')}.` : ''].filter(Boolean).join(' ');
  }
