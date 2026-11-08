/* =========================================================================
   NABD — medical terminology in English
   2026-11-08 (owner): there is no switch any more. Clinical terms in the
   interface always read the way they are said on the ward (Vitals, ECG,
   ABG, Handover...). Patient speech and the student's own messages stay
   untouched; the ER room's chat has its own wording (er.js, chatTerms).
   Loaded after script.js and motion.js.
   ========================================================================= */
(function () {
  'use strict';

  // Arabic term -> how it is said on the ward. "الـ X" keeps the Arabic article.
  const TERMS = [
    ['شاشة العلامات الحيوية', 'Vitals monitor'],
    ['قياس العلامات الآن', 'Check vitals now'], ['قِس الآن', 'Check vitals now'],
    ['النبض HR', 'HR'], ['الضغط BP', 'BP'], ['الأكسجين SpO2', 'SpO2'], ['الحرارة Temp', 'Temp'],
    ['التنفس RR', 'RR'], ['الوعي AVPU', 'AVPU'], ['السكر BG', 'BG'],
    ['تخطيط القلب الكهربائي', 'ECG'], ['تخطيط القلب', 'ECG'],
    ['غازات الدم الشرياني', 'ABG'], ['غازات الدم', 'ABG'],
    ['تعداد الدم الكامل', 'CBC'], ['وظائف الكلى', 'RFT'], ['فحص البول العام', 'Urinalysis'],
    ['خمائر القلب', 'Cardiac enzymes'], ['سكر الدم', 'Blood glucose'],
    ['ارتفاع ضغط الدم', 'Hypertension'], ['ضغط الدم', 'BP'],
    ['احتشاء عضلة قلبية', 'MI'], ['انصمام رئوي', 'PE'],
    ['القصور الكلوي', 'الـ Renal failure'], ['قصور كلوي', 'Renal failure'],
    ['فقر الدم', 'الـ Anemia'], ['فقر دم', 'Anemia'],
    ['ارتفاع حرارة', 'Fever'], ['الجفاف', 'الـ Dehydration'], ['جفاف', 'Dehydration'],
    ['الألم الصدري', 'الـ Chest pain'], ['ألم صدري', 'Chest pain'],
    ['ضيق التنفس', 'الـ Dyspnea'], ['ضيق نفس', 'Dyspnea'], ['معدل التنفس', 'RR'],
    ['هبوط السكر', 'Hypoglycemia'], ['نقص السكر', 'Hypoglycemia'], ['الإنتان', 'الـ Sepsis'],
    ['السكري', 'DM'],
    ['القلب والأوعية الدموية', 'Cardiology'], ['النسائية والتوليد', 'OB/GYN'], ['العظام والكسور', 'Orthopedics'],
    ['الجهاز الهضمي', 'GI'], ['الجهاز التنفسي', 'Respiratory'], ['الباطنية', 'Internal medicine'],
    ['الأعصاب', 'Neurology'], ['العناية المركزة', 'ICU'], ['غرفة الطوارئ', 'الـ ER'], ['الطوارئ', 'الـ ER'], ['طوارئ', 'ER'],
    ['العلامات والمفكرة', 'Vitals & notes'], ['الإجراءات والأدوية', 'Procedures & meds'],
    ['الإجراءات', 'الـ Procedures'], ['العلامات', 'الـ Vitals'],
    ['الحساسية الدوائية', 'الـ Drug allergy'], ['الحساسية', 'الـ Allergy'],
    ['التشخيص التفريقي', 'الـ DDx'], ['تشخيصاً تفريقياً', 'DDx'], ['التشخيص', 'الـ Diagnosis'],
    ['العلامات الحيوية', 'الـ Vitals'], ['تسليم الحالة', 'Handover'], ['التسليم', 'الـ Handover'],
    ['أوامر الطبيب', "Doctor's orders"], ['القصة المرضية', 'الـ History'], ['التاريخ المرضي', 'الـ History'],
    ['الفحص السريري', 'الـ Physical exam'], ['خطة العلاج', 'Management plan'],
    ['الفحوصات', 'الـ Labs'], ['المختبر', 'الـ Lab'], ['الأشعة', 'الـ Imaging'],
    ['المضاد الحيوي', 'الـ Antibiotic'], ['مضاد حيوي', 'Antibiotic'],
    ['الأنسولين', 'الـ Insulin'], ['إنسولين', 'Insulin'], ['المسكنات', 'الـ Analgesics'], ['مسكن', 'Analgesic'],
    ['الأدوية', 'الـ Meds'], ['الدواء', 'الـ Medication'], ['الجرعة', 'الـ Dose'],
    ['السوائل', 'الـ Fluids'], ['الإماهة', 'الـ Hydration'], ['الوريد', 'الـ IV line'],
    ['الضماد', 'الـ Dressing'], ['النزيف', 'الـ Bleeding'], ['القسطرة', 'الـ Catheter'], ['قسطرة', 'Catheter'],
    ['الحمل', 'الـ Pregnancy'], ['الأكسجين', 'الـ O2']
  ];

  const AR = '\\u0621-\\u064A\\u0671-\\u06D3';
  const byLength = TERMS.slice().sort((a, b) => b[0].length - a[0].length);
  const lookup = new Map(byLength);
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Whole words only: no Arabic letter right before or after the term.
  const RE = new RegExp('(^|[^' + AR + '])(' + byLength.map(t => escape(t[0])).join('|') + ')(?![' + AR + '])', 'g');
  const HAS_AR = /[ء-ي]/;

  // Patient speech and the student's own words are never rewritten.
  const SKIP = [
    '#sim-chat-messages > .flex-col', '.nb-b.patient', '.nb-b.nurse', '.coach-message.is-student',
    // respiratory room: the patient's replies, the student's questions and the question list
    '.rs-msg.pt', '.rs-msg.me', '.rs-chips', '#rs-qlist', '.rs-missed',
    // emergency room: the chat converts its own lines (er.js); the trainee's box is never rewritten; the monitor
    // (.er-mon, its labels and its range notes) stays exactly as it was: the owner's rule is that it does not change
    '.er-msg', '#er-input', '.er-mon',
    'script', 'style', 'textarea', 'noscript', '[data-no-terms]'
  ].join(',');

  const ROOM_KEEP = new Set(['القسطرة', 'قسطرة']);
  const done = new WeakMap(); // text node -> { orig, out }

  function translate(node) {
    const text = node.data;
    if (!text || !HAS_AR.test(text)) return;
    const rec = done.get(node);
    if (rec && rec.out === text) return;
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP)) return;
    const glosses = [];
    // 2026-11-08: inside the ER room (its briefing, sheets and report; the chat does this itself) the ward's English
    // terms come first, from the same list the chat uses (er.js chatEn), then this list.
    const room = parent.closest('#view-er') && window.__nbER && window.__nbER.chatEn;
    const src = room ? window.__nbER.chatEn(text) : text;
    RE.lastIndex = 0;
    const out = src.replace(RE, (m, pre, term, at, whole) => {
      // «القسطرة» in the room is a Foley or the cath lab; the room's own list decides, so it is not «Catheter» here.
      if (room && ROOM_KEEP.has(term)) return m;
      // An assignment's «التسليم» is its submission date («موعد التسليم»، «التسليم: 12/11»), not a handover.
      if (term === 'التسليم' && (/(?:موعد|تاريخ|وقت)\s*$/.test(whole.slice(0, at + pre.length)) || /^\s*:/.test(whole.slice(at + m.length)))) return m;
      const en = lookup.get(term);
      glosses.push(en.replace(/^الـ /, '') + ' — ' + term);
      // In the room the article joins the English word, as the chat writes it («الـHandover»).
      return pre + (room ? en.replace(/^الـ /, 'الـ') : en);
    });
    if (out === text) return;
    done.set(node, { orig: text, out });
    node.data = out;
    if (!('termsTitle' in parent.dataset)) parent.dataset.termsTitle = parent.getAttribute('title') || '';
    parent.title = [...new Set(glosses)].join('\n');
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { translate(root); return; }
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = it.nextNode(); n; n = it.nextNode()) nodes.push(n);
    nodes.forEach(translate);
  }

  function boot() {
    // The old switch saved a choice; English is the only mode now, so the saved key is dropped.
    try { localStorage.removeItem('nabd_terms_lang'); } catch (e) { /* storage blocked */ }
    document.documentElement.dataset.terms = 'en';
    walk(document.body);
    // Views and rooms are rendered on the fly: translate new text as it appears.
    new MutationObserver(list => {
      list.forEach(m => {
        if (m.type === 'characterData') { translate(m.target); return; }
        m.addedNodes.forEach(n => { if (n.nodeType === 1 || n.nodeType === 3) walk(n); });
      });
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
