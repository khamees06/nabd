  function openEndNurse() {
    const box = $('er-sheet'), my = E, keep = E.draft || {};
    // Only a bedside test the nurse chose herself can be out of indication; an ordered test never is.
    const offs = Object.values(E.tests).filter(t => offInd(t) && !orderedTest(t.id)), keepJ = keep.just || {};
    const justBlock = offs.length ? `<div class="er-just" role="group" aria-labelledby="er-just-h">
        <p class="er-just-h" id="er-just-h">⚠️ تبرير الفحوصات السريرية التي أجريتها خارج الاستطباب الأساسي للحالة:</p>
        ${offs.map(t => { const m = testOf(t.id) || {}; return `<label>${esc(m.ar)} <bdi dir="ltr">${esc(m.en)}</bdi><textarea id="er-just-${esc(t.id)}" data-just="${esc(t.id)}" rows="2" maxlength="400" placeholder="ما الذي أردت أن تعرفه بهذا الفحص؟"></textarea></label>`; }).join('')}
        <p class="er-small">اكتب ثلاث كلمات على الأقل لكل فحص.</p>
      </div>` : '';
    box.hidden = false;
    box.innerHTML = `<div class="er-pane er-pane-n" role="dialog" aria-modal="true" aria-labelledby="er-end-h">
      <h3 id="er-end-h">سلّم الحالة للممرض/ة المستلم/ة (SBAR)</h3>
      <p class="er-small">التسليم التمريضي بصيغة SBAR فقط: لا يُطلب منك تشخيص ولا وجهة.</p>
      ${SBAR_BOX.map(([k, l, ph]) => `<label>${l}<textarea id="er-sbar-${k}" rows="2" maxlength="300" placeholder="${ph}"></textarea></label>`).join('')}
      ${justBlock}
      <div class="er-pane-f"><button type="button" class="s" id="er-end-x">رجوع للمريض</button><button type="button" class="p" id="er-end-go" disabled>سلّم</button></div>
    </div>`;
    SBAR_BOX.forEach(([k]) => { $('er-sbar-' + k).value = (keep.parts || {})[k] || ''; });
    offs.forEach(t => { const el = $('er-just-' + t.id); if (el) el.value = keepJ[t.id] || ''; });
    const check = () => {
      const just = {}, parts = {};
      offs.forEach(t => { const el = $('er-just-' + t.id); just[t.id] = el ? el.value : ''; });
      SBAR_BOX.forEach(([k]) => { parts[k] = $('er-sbar-' + k).value; });
      my.draft = { parts, just };
      $('er-end-go').disabled = !(SBAR_BOX.every(([k]) => wordsIn(parts[k]) >= 3) && offs.every(t => wordsIn(just[t.id]) >= 3));
    };
    SBAR_BOX.forEach(([k]) => $('er-sbar-' + k).addEventListener('input', check));
    offs.forEach(t => { const el = $('er-just-' + t.id); if (el) el.addEventListener('input', check); });
    check();
    $('er-end-x').onclick = () => { box.hidden = true; autoFocus($('er-input')); };
    $('er-end-go').onclick = async () => {
      $('er-end-go').disabled = true;
      $('er-end-go').textContent = 'لحظة...';
      const parts = {};
      SBAR_BOX.forEach(([k]) => { parts[k] = String($('er-sbar-' + k).value || '').trim(); });
      const sbar = 'S: ' + parts.s + '\nB: ' + parts.b + '\nA: ' + parts.a + '\nR: ' + parts.r;
      const end = { sbar, parts, nurse: true };
      offs.forEach(t => { const el = $('er-just-' + t.id), v = String((el && el.value) || '').trim().slice(0, 400); t.justify = v; t.justOk = justGood(v); });
      const g = await call({ mode: 'grade', role: 'nurse', sbar, harms: E.harms.map(h => h.label) }, 12000);
      if (E !== my || E.over) return;
      const local = gradeHandoverNurse(end);
      // The server reads S, B, A and R; the room still checks what only it can see (an intervention named, a drug claimed).
      end.grade = g && g.dx ? { ...local, s: !!g.s, b: !!g.b, a: !!g.a, r: !!g.r, invented: !!g.invented || local.invented, note: typeof g.note === 'string' ? g.note.slice(0, 240) : '', graded: true } : local;
      E.outcome = E.risk < E.c.risk.watch && !nurseKeyMissing().length ? 'stable' : 'unstable';
      box.hidden = true;
      conclude(end);
    };
    autoFocus($('er-sbar-s'));
  }
