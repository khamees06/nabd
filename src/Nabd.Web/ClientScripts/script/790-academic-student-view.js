    /* ---------- student side ---------- */
    function nb8AdvisorNoteHtml(u) {
      if (!u) return '';
      const r = nb8GetAdvisor()[u.name];
      if (!r || !r.note) return '';
      return `<div class="nb-item nb8-adv-note"><span><b>ملاحظة المرشد الأكاديمي</b><br><span data-no-terms>${nb8Esc(r.note)}</span><br><small style="color:#4F6A77">${new Date(r.ts || Date.now()).toLocaleDateString('ar-JO')}</small></span></div>`;
    }
    function nb8StudentNotesHtml(u) {
      const adv = nb8AdvisorNoteHtml(u);
      const all = safeStorageGet(NB_COMMENTS_KEY, {}) || {};
      const list = (all[u.name] || []).slice(0, 3);
      const prof = list.map(n => `<div class="nb-item"><span><b>ملاحظة المشرف</b><br>${nb8Esc(n.text)}<br><small style="color:#4F6A77">${new Date(n.ts).toLocaleDateString('ar-JO')}</small></span></div>`).join('');
      return (adv + prof) || '<p class="nb8-empty">لا ملاحظات من المشرف أو المرشد الأكاديمي حالياً.</p>';
    }
    function nb8JoinFormHtml() {
      return `<form class="nb8-join" data-nb8-join novalidate>
        <p>لم تنضم إلى شعبة بعد. اكتب رمز الشعبة الذي أعطاك إياه المشرف لتظهر لك واجباتها.</p>
        <div class="nb8-join-row"><input type="text" dir="ltr" autocomplete="off" aria-label="رمز الشعبة" placeholder="مثال: NUR-JU-2026" data-nb8-join-input><button type="submit" class="nb8-go focus-ring">انضمام</button></div>
        <small data-nb8-join-msg role="status" aria-live="polite"></small>
      </form>`;
    }
    function nb8RenderStudentUni(u) {
      const homeBox = document.getElementById('nb8-home-stu-uni'), fullBox = document.getElementById('nb8-uni-stu');
      if (!homeBox && !fullBox) return;
      if (!u || nb8IsProf(u)) { if (homeBox) homeBox.innerHTML = ''; if (fullBox) fullBox.innerHTML = ''; return; }
      const sec = nb8UserSection(u);
      const coh = sec ? NB_COHORTS[sec] : null;
      const mine = sec ? nb8GetAssignments().filter(a => a.section === sec).sort((a, b) => (b.ts || 0) - (a.ts || 0)) : [];
      const today = new Date().toISOString().slice(0, 10);
      const card = (a, c) => {
        const L = nb8CaseLabel(c);
        const done = nb8AssignDone(u, a);
        const late = !done && a.due && a.due < today;
        return `<article class="nb8-as-card${done ? ' is-done' : ''}">
          <div class="nb8-as-top"><span class="nb8-chip">واجب</span>${a.due ? `<span class="nb8-due${late ? ' is-late' : ''}">${late ? 'انتهى موعد التسليم: ' : 'التسليم: '}${nb8Esc(nb8FmtDate(a.due))}</span>` : ''}</div>
          <h3>${nb8Esc(L.title)}</h3>
          ${L.line ? `<p class="nb8-arrival">${nb8Esc(L.line)}</p>` : ''}
          ${a.note ? `<p class="nb8-as-note"><b>ملاحظة المشرف:</b> <span data-no-terms>${nb8Esc(a.note)}</span></p>` : ''}
          ${done ? `<p class="nb8-done">أنجزت هذه الحالة بعد إسنادها: <span class="font-num">${nb8Esc(done.score || ((done.num != null ? done.num : '--') + '%'))}</span></p>` : ''}
          <button type="button" class="nb8-go focus-ring" data-nb8-open-case="${nb8Esc(a.caseId)}">${done ? 'أعد المحاولة في غرفة الطوارئ' : 'ابدأ الواجب في غرفة الطوارئ'} ←</button>
        </article>`;
      };
      const draw = (cases) => {
        const byId = {}; (cases || []).forEach(c => { byId[c.id] = c; });
        const secLine = sec
          ? `<div class="nb8-secline"><span>شعبتك</span><b dir="ltr">${nb8Esc(sec)}</b><small>${nb8Esc(coh ? coh.name : '')}</small>${u.cohort ? '' : '<span class="nb8-demo-tag">بيانات تجريبية للعرض</span>'}</div>`
          : nb8JoinFormHtml();
        const cards = mine.length
          ? `<div class="nb8-as-grid">${mine.map(a => card(a, byId[a.caseId])).join('')}</div>`
          : (sec ? '<p class="nb8-empty">لا توجد واجبات مسندة لشعبتك حالياً. يمكنك التدرّب في غرفة الطوارئ متى شئت.</p>' : '');
        if (homeBox) homeBox.innerHTML = secLine + cards;
        if (fullBox) {
          const rec = getProfCohortList().find(s => s.name === u.name);
          let res;
          if (rec && rec.isPublished) {
            res = `<article class="nb8-res is-pub"><div class="nb8-as-top"><span class="nb8-chip nb8-chip-ok">نتيجة معتمدة ومنشورة</span><b class="font-num">${nb8Esc(rec.score)}</b></div><h3>${nb8Esc(rec.caseTitle)}</h3><small class="font-num">${nb8Esc(rec.submittedAt)}</small>${rec.profNote ? `<p><b>ملاحظة المشرف:</b> ${nb8Esc(rec.profNote)}</p>` : ''}</article>`;
          } else if (rec) {
            res = `<article class="nb8-res"><div class="nb8-as-top"><span class="nb8-chip nb8-chip-wait">قيد المراجعة · غير منشورة</span></div><h3>تُنشر النتيجة بعد اعتماد المشرف</h3><button type="button" class="nb8-locked focus-ring" data-nb8-locked>النتيجة غير منشورة (مقفلة)</button></article>`;
          } else {
            res = '<p class="nb8-empty">لا توجد نتائج منشورة لك بعد.</p>';
          }
          fullBox.innerHTML = `
            <div class="nb8-card"><div class="nb8-card-head"><div><h2>شعبتك وواجباتك</h2><p>الحالات التي أسندها المشرف لشعبتك. كل واجب يفتح غرفة الطوارئ على الحالة نفسها.</p></div></div>${secLine}${cards}</div>
            <div class="nb8-card"><div class="nb8-card-head"><div><h2>نتائجك المنشورة</h2></div></div>${res}
              <p class="nb8-privacy">لا يُسمح للطالب بالاطلاع على نتائج زملائه أو فتح النتائج غير المنشورة قبل اعتمادها رسمياً.</p></div>
            <div class="nb8-card"><div class="nb8-card-head"><div><h2>ملاحظات المشرف والمرشد الأكاديمي</h2></div></div><div class="nb8-notes">${nb8StudentNotesHtml(u)}</div></div>`;
        }
      };
      draw(nb8CasesCache);
      if (mine.length && !nb8CasesCache) nb8LoadErCases().then(draw).catch(() => {});
    }

