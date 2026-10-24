/* =========================================================================
   NABD — medical terminology switch (عربي / EN)
   In EN mode, clinical terms in the interface read the way they are said on
   the ward (Vitals, ECG, ABG, Handover...). Patient speech and the student's
   own messages stay untouched. Switching back restores the exact original
   text. Loaded after script.js and motion.js.
   ========================================================================= */
(function () {
  'use strict';

  const KEY = 'nabd_terms_lang';

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
    'script', 'style', 'textarea', 'noscript', '[data-no-terms]', '.nb-terms'
  ].join(',');

  const done = new WeakMap(); // text node -> { orig, out }
  let mode = 'ar';
  try { mode = localStorage.getItem(KEY) === 'en' ? 'en' : 'ar'; } catch (e) { /* storage blocked: default */ }

  function flash(el) {
    if (!el || !el.classList) return;
    el.classList.remove('nb-term-flash');
    void el.offsetWidth;
    el.classList.add('nb-term-flash');
    setTimeout(() => el.classList.remove('nb-term-flash'), 800);
  }

  function translate(node, animate) {
    const text = node.data;
    if (!text || !HAS_AR.test(text)) return;
    const rec = done.get(node);
    if (rec && rec.out === text) return;
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP)) return;
    const glosses = [];
    RE.lastIndex = 0;
    const out = text.replace(RE, (m, pre, term) => {
      const en = lookup.get(term);
      glosses.push(en.replace(/^الـ /, '') + ' — ' + term);
      return pre + en;
    });
    if (out === text) return;
    done.set(node, { orig: text, out });
    node.data = out;
    if (!('termsTitle' in parent.dataset)) parent.dataset.termsTitle = parent.getAttribute('title') || '';
    parent.title = [...new Set(glosses)].join('\n');
    if (animate) flash(parent);
  }

  function restore(node, animate) {
    const rec = done.get(node);
    if (!rec) return;
    done.delete(node);
    if (node.data !== rec.out) return; // the app rewrote it meanwhile: keep the app's text
    node.data = rec.orig;
    const parent = node.parentElement;
    if (parent && 'termsTitle' in parent.dataset) {
      if (parent.dataset.termsTitle) parent.title = parent.dataset.termsTitle; else parent.removeAttribute('title');
      delete parent.dataset.termsTitle;
    }
    if (animate) flash(parent);
  }

  function walk(root, fn, animate) {
    if (!root) return;
    if (root.nodeType === 3) { fn(root, animate); return; }
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = it.nextNode(); n; n = it.nextNode()) nodes.push(n);
    nodes.forEach(n => fn(n, animate));
  }

  function setMode(next, animate) {
    mode = next;
    try { localStorage.setItem(KEY, mode); } catch (e) { /* storage blocked */ }
    document.documentElement.dataset.terms = mode;
    walk(document.body, mode === 'en' ? translate : restore, animate);
    document.querySelectorAll('.nb-terms button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === mode)));
  }

  function buildSwitch() {
    const menu = document.getElementById('user-menu-btn');
    const slot = menu && menu.parentElement && menu.parentElement.parentElement;
    if (!slot || slot.querySelector('.nb-terms')) return;
    const group = document.createElement('div');
    group.className = 'nb-terms';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'لغة المصطلحات الطبية');
    group.innerHTML = '<span>المصطلحات</span>'
      + '<button type="button" data-lang="ar" title="المصطلحات الطبية بالعربية">ع</button>'
      + '<button type="button" data-lang="en" title="Medical terms in English, as used on the ward">EN</button>';
    group.addEventListener('click', e => {
      const b = e.target.closest('button[data-lang]');
      if (b && b.dataset.lang !== mode) setMode(b.dataset.lang, true);
    });
    slot.insertBefore(group, slot.firstChild);
  }

  function boot() {
    buildSwitch();
    setMode(mode, false);
    // Views and rooms are rendered on the fly: translate new text as it appears.
    new MutationObserver(list => {
      if (mode !== 'en') return;
      list.forEach(m => {
        if (m.type === 'characterData') { translate(m.target, false); return; }
        m.addedNodes.forEach(n => { if (n.nodeType === 1 || n.nodeType === 3) walk(n, translate, false); });
      });
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
