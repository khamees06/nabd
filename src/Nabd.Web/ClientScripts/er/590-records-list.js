  /* ---------- the records column ---------- */
  const PANELS = [['heart', 'القلب'], ['blood', 'الدم'], ['chem', 'الكيمياء والغازات'], ['imaging', 'الأشعة'], ['other', 'البول وأخرى']];
  let recFilter = 'all', recQuery = '';
  /* phase8 2026-11-07: the investigations centre; tests are grouped by where they are done (bedside, lab and urine,
     imaging and tracings), and the 12-lead ECG sits with imaging and tracings. Only tests the case has a result for are listed.
     2026-11-08 (owner): the names are in English, as on the ward, and the list is one column of cards: the test's name
     (its Arabic name on hover, and the search still finds it in Arabic) and «طلب ←», or the state of the result, on the left.
     The order log is folded into the cards. */
  const CATS = [['bed', 'Bedside', 'سريري'], ['lab', 'Lab', 'مختبر وبول'], ['img', 'Imaging & ECG', 'أشعة وتخطيط']];
  const catOf = t => (t.id === 'ecg' ? 'img' : t.group);
  const panelName = k => (PANELS.find(p => p[0] === k) || ['', ''])[1];
  function buildRecords() {
    const f = $('er-rec-f'), list = $('er-rec-list');
    if (!f || !list || !D || !E) return;
    if (recFilter !== 'all' && !CATS.some(([k]) => k === recFilter)) recFilter = 'all';
    f.innerHTML = [['all', 'الكل'], ...CATS].map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${k === recFilter}">${l}</button>`).join('');
    const q = norm(recQuery);
    const was = document.activeElement, keep = was && was.dataset ? (was.dataset.t ? `[data-t="${was.dataset.t}"]` : was.dataset.f ? `[data-f="${was.dataset.f}"]` : was.dataset.ord ? `[data-ord="${was.dataset.ord}"]` : '') : '';
    list.innerHTML = CATS.filter(([k]) => recFilter === 'all' || recFilter === k).map(([k, label, arLabel]) => {
      const items = D.tests.filter(t => catOf(t) === k && E.c.results[t.id] && (!q || norm(t.ar + ' ' + t.en + ' ' + (t.kw || []).join(' ') + ' ' + label + ' ' + arLabel + ' ' + panelName(t.panel)).includes(q)));
      if (!items.length) return '';
      return `<section class="er-rec-sec"><h4>${label}</h4><div>${items.map(t => {
        const x = E.tests[t.id], off = offInd(x);
        // A culture drawn is not a result yet: its card says when the result comes, as the old log did.
        const incubating = x && x.back && /incubat/i.test((E.c.results[t.id] || {}).report || '');
        const state = !x ? '<span class="er-tc-go">طلب ←</span>' : incubating ? '<span class="er-tc-wait">سُحبت العينة · النتيجة بعد يوم أو يومين</span>' : x.back ? '<span class="er-tc-go">النتيجة ←</span>' : '<span class="er-tc-wait">بانتظار النتيجة</span>';
        return `<button type="button" class="er-tc${x ? ' is-done' : ''}${off ? ' is-off' : ''}" data-t="${t.id}" title="${esc(t.ar)}"><span class="er-tc-main"><span class="er-tc-en"><bdi dir="ltr">${esc(t.en)}</bdi></span>${nurseTag(t.id)}</span>${x ? `<i aria-label="${off ? 'تم الطلب، خارج الاستطباب المباشر' : 'تم الطلب'}">✓${off ? '<em class="er-off-dot" aria-hidden="true"></em>' : ''}</i>` : ''}${state}</button>`;
      }).join('')}</div></section>`;
    }).join('') || '<p class="er-small">لا يوجد فحص بهذا الاسم.</p>';
    buildLog();
    if (keep) { const n = $('er-records').querySelector(keep); if (n && n.focus) n.focus({ preventScroll: true }); }
  }
  /* 2026-11-08 (owner): the separate order log is gone (each card carries its test's state); the «Labs» tab counts the tests. */
  function buildLog() {
    const n = $('er-labs-n');
    if (n && E) n.textContent = `(${Object.keys(E.tests).length})`;
  }
  // phase8 2026-11-07: scroll the chat to a result card and flash it.
  function goResult(id) {
    const t = E && E.tests[id];
    if (!t || !t.el) return;
    if (!wide()) toggleRecords(false);
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (t.el.scrollIntoView) t.el.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' });
    t.el.classList.remove('er-flash');
    void t.el.offsetWidth;
    t.el.classList.add('er-flash');
    setTimeout(() => t.el.classList.remove('er-flash'), 1800);
  }
