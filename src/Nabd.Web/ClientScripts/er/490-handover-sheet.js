  /* ---------- ending ---------- */
  function openEnd() {
    if (!E || E.over) return;
    if (NM()) { openEndNurse(); return; }
    const box = $('er-sheet'), my = E, keep = E.draft || {};
    /* phase8 2026-11-07: every out-of-indication test ordered needs a written justification before handover. */
    const offs = Object.values(E.tests).filter(offInd), keepJ = keep.just || {};
    const justBlock = offs.length ? `<div class="er-just" role="group" aria-labelledby="er-just-h">
        <p class="er-just-h" id="er-just-h">⚠️ تبرير الفحوصات/الصور الإضافية التي طلبتها خارج الاستطباب الأساسي للحالة:</p>
        ${offs.map(t => { const m = testOf(t.id) || {}; return `<label>${esc(m.ar)} <bdi dir="ltr">${esc(m.en)}</bdi><textarea id="er-just-${esc(t.id)}" data-just="${esc(t.id)}" rows="2" maxlength="400" placeholder="ما الذي أردت أن تؤكده أو تستبعده بهذا الفحص؟"></textarea></label>`; }).join('')}
        <p class="er-small">اكتب ثلاث كلمات على الأقل لكل فحص. يُقبل التبرير إذا ربط الفحص بسؤال سريري واضح.</p>
      </div>` : '';
    box.hidden = false;
    box.innerHTML = `<div class="er-pane" role="dialog" aria-modal="true" aria-labelledby="er-end-h">
      <h3 id="er-end-h">سلّم الحالة للأخصائي</h3>
      <label>تشخيصك<input id="er-dx" type="text" maxlength="120" autocomplete="off"></label>
      <label>إلى أين يذهب المريض؟<select id="er-dispo"><option value="">اختر</option><option value="icu">العناية الحثيثة</option><option value="hdu">مراقبة عالية في الطوارئ</option><option value="cath">القسطرة</option><option value="ward">طابق عادي</option><option value="home">البيت</option></select></label>
      <label>التسليم (SBAR)<textarea id="er-sbar" rows="5" maxlength="800" placeholder="الوضع، الخلفية، التقييم مع الأرقام، التوصية"></textarea></label>
      ${justBlock}
      <div class="er-pane-f"><button type="button" class="s" id="er-end-x">رجوع للمريض</button><button type="button" class="p" id="er-end-go" disabled>سلّم</button></div>
    </div>`;
    $('er-dx').value = keep.dx || ''; $('er-dispo').value = keep.dispo || ''; $('er-sbar').value = keep.sbar || '';
    offs.forEach(t => { const el = $('er-just-' + t.id); if (el) el.value = keepJ[t.id] || ''; }); // phase8
    const check = () => {
      // phase8 2026-11-07: the justifications live in the draft too, so closing the sheet keeps them.
      const just = {};
      offs.forEach(t => { const el = $('er-just-' + t.id); just[t.id] = el ? el.value : ''; });
      my.draft = { dx: $('er-dx').value, dispo: $('er-dispo').value, sbar: $('er-sbar').value, just };
      const justDone = offs.every(t => wordsIn(just[t.id]) >= 3);
      $('er-end-go').disabled = !($('er-dx').value.trim() && $('er-dispo').value && $('er-sbar').value.trim() && justDone);
    };
    ['er-dx', 'er-dispo', 'er-sbar'].forEach(id => $(id).addEventListener('input', check));
    offs.forEach(t => { const el = $('er-just-' + t.id); if (el) el.addEventListener('input', check); }); // phase8
    check();
    $('er-end-x').onclick = () => { box.hidden = true; autoFocus($('er-input')); };
    $('er-end-go').onclick = async () => {
      $('er-end-go').disabled = true;
      $('er-end-go').textContent = 'لحظة...';
      const end = { dx: $('er-dx').value.trim(), dispo: $('er-dispo').value, sbar: $('er-sbar').value.trim() };
      // phase8 2026-11-07: each justification is kept on its test and graded locally.
      offs.forEach(t => { const el = $('er-just-' + t.id), v = String((el && el.value) || '').trim().slice(0, 400); t.justify = v; t.justOk = justGood(v); });
      const g = await call({ mode: 'grade', dxText: end.dx, sbar: end.sbar, harms: E.harms.map(h => h.label) }, 12000);
      // The heart can stop while the handover is being read: that ending stands.
      if (E !== my || E.over) return;
      end.grade = g && g.dx ? { ...g, graded: true } : localGrade(end);
      E.outcome = E.risk < E.c.risk.watch && !keyMissing().length ? 'stable' : 'unstable';
      box.hidden = true;
      conclude(end);
    };
    autoFocus($('er-dx'));
  }
