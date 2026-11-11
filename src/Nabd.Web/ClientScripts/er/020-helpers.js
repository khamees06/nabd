  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  // Marks only: U+0660-0669 sit inside the mark range, and those are digits.
  const norm = s => String(s).replace(/[ً-ٰٟـ]/g, '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[؟?!.,،:؛()"'«»\-_/]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pickOf = list => list[Math.floor(Math.random() * list.length)];
  const testOf = id => D.tests.find(t => t.id === id);
  const actOf = id => D.actions.find(a => a.id === id);
  /* phase8 2026-11-07: a real page has a body; the Node harness's fake document has none, so the start
     briefing and the injected panel parts never block or pause it. */
  const REAL = typeof document !== 'undefined' && !!document.body && typeof document.addEventListener === 'function';
  /* phase8 2026-11-07: a test outside the case's indication ('no') or dangerous now ('harm') is out of indication.
     It is never blocked: its result shows at once, in amber, and the trainee justifies it at handover. */
  const offInd = t => !!t && (t.ind === 'no' || t.ind === 'harm');
  const OFF_BADGE = 'فحص خارج الاستطباب المباشر';
  const clk = t => String(Math.floor(t)).padStart(2, '0') + ':' + String(Math.floor((t % 1) * 60)).padStart(2, '0');
  const wordsIn = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  /* phase8 2026-11-07: the same rule as evaluateScientificJustification in script.js, graded here, no paid call. */
  function justGood(justText) {
    const t = (justText || '').trim();
    if (t.length < 10) return false;
    if (/^(هيك|بس هيك|للتجربة|تجربة|احتياط|فقط|ما بعرف|لا أعلم|عشوائي)$/.test(t)) return false;
    const scientificKeywords = /(تفريقي|تشخيص|استبعاد|تأكيد|تمييز|أعراض|مضاعفات|إقفار|احتشاء|خثرة|انصمام|التهاب|عدوى|إنتان|كلى|كرياتينين|جفاف|شوارد|أملاح|حموضة|حماض|أكسجة|تهوية|نزيف|فقر دم|حمل|تروية|عصبي|وعائي|قلب|رئة|سوائل|ضغط|سكري|كيتون)/;
    return scientificKeywords.test(t) || t.split(/\s+/).length >= 5;
  }

