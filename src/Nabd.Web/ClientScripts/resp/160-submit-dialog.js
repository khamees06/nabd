  // Two steps: pick a diagnosis, then submit, so the urgency box can be ticked in any order.
  function openSubmit() {
    if (S.done) return;
    const resp = M.classes.map((c, i) => [c, i]).filter(([c]) => RESP.has(c));
    const other = M.classes.map((c, i) => [c, i]).filter(([c]) => !RESP.has(c));
    const btns = list => list.map(([c, i]) => `<button type="button" class="rs-dx" data-i="${i}" aria-pressed="false">${esc(T.conditions[c] || c)}</button>`)
      .sort((a, b) => a.localeCompare(b, 'ar')).join('');
    const box = $('rs-submit');
    let choice = null;
    box.hidden = false;
    box.innerHTML = `<div class="rs-sheet">
      <div class="rs-sheet-h"><h3 id="rs-submit-h">ما تشخيصك؟</h3><button type="button" class="rs-x" id="rs-submit-x" aria-label="إغلاق">✕</button></div>
      <input id="rs-dx-search" type="search" placeholder="ابحث عن مرض..." autocomplete="off" aria-label="ابحث عن مرض">
      <div class="rs-sheet-body">
        <h4>أمراض الجهاز التنفسي</h4><div class="rs-dxs">${btns(resp)}</div>
        <h4>أمراض أخرى</h4><div class="rs-dxs">${btns(other)}</div>
      </div>
      <div class="rs-sheet-f">
        <label class="rs-urgent"><input type="checkbox" id="rs-urgent"> قد تكون الحالة خطيرة: أطلب تقييماً عاجلاً من الطبيب</label>
        <div class="rs-pick"><span id="rs-pick" aria-live="polite">اختر تشخيصاً من القائمة.</span><button type="button" class="p" id="rs-go" disabled>سلّم</button></div>
      </div>
    </div>`;
    const close = () => { box.hidden = true; $('rs-dx-btn').focus(); };
    $('rs-submit-x').onclick = close;
    box.onclick = e => { if (e.target === box) close(); };
    box.onkeydown = e => { if (e.key === 'Escape') close(); };
    $('rs-dx-search').oninput = e => {
      const f = norm(e.target.value);
      box.querySelectorAll('.rs-dx').forEach(b => { b.hidden = !!f && !norm(b.textContent + ' ' + M.classes[b.dataset.i]).includes(f); });
    };
    box.querySelectorAll('.rs-dx').forEach(b => {
      b.onclick = () => {
        choice = Number(b.dataset.i);
        box.querySelectorAll('.rs-dx').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        $('rs-pick').textContent = 'تشخيصك: ' + b.textContent;
        $('rs-go').disabled = false;
      };
    });
    $('rs-go').onclick = () => { if (choice != null) finish(choice, $('rs-urgent').checked); };
    $('rs-dx-search').focus();
  }

