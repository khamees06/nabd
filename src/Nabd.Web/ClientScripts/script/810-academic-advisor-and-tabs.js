    function nb8Recs(s) {
      const out = [];
      (s.inquiryLog || []).filter(q => !q.asked).forEach(q => out.push('مراجعة سؤال: ' + q.topic));
      (s.workupLog || []).filter(w => w.isUnjustified).forEach(w => out.push('مراجعة مبرر طلب: ' + w.title));
      if (!s.isPublished) out.push('مراجعة المحاولة واعتماد النتيجة قبل نشرها للطالب.');
      if (!out.length) out.push('لا ثغرات مسجلة في هذه المحاولة. يمكن إسناد حالة جديدة من غرفة الطوارئ.');
      return out;
    }
    function nb8AdvStatuses() { return [['', 'بلا تحديد'], ['needs', 'يحتاج متابعة'], ['good', 'يتقدم جيداً'], ['contacted', 'تم التواصل']]; }
    function nb8RenderAdvisorSum() {
      const sum = document.getElementById('nb8-advisor-sum');
      if (!sum) return;
      const adv = nb8GetAdvisor(), list = getProfCohortList();
      sum.innerHTML = nb8AdvStatuses().slice(1).map(([k, l]) => `<span class="nb8-adv-pill is-${k}">${l}: <b class="font-num">${list.filter(s => (adv[s.name] || {}).status === k).length}</b></span>`).join('');
    }
    function nb8RenderAdvisor() {
      const box = document.getElementById('nb8-advisor');
      if (!box) return;
      const adv = nb8GetAdvisor(), list = getProfCohortList();
      const ul = (arr) => `<ul>${(arr || []).map(x => `<li>${nb8Esc(x)}</li>`).join('')}</ul>`;
      box.innerHTML = list.map(s => {
        const r = adv[s.name] || {};
        const opts = nb8AdvStatuses().map(([k, l]) => `<option value="${k}"${(r.status || '') === k ? ' selected' : ''}>${l}</option>`).join('');
        return `<article class="nb8-adv${r.status ? ' is-' + nb8Esc(r.status) : ''}" data-nb8-adv="${nb8Esc(s.id)}">
          <header><div><b>${nb8Esc(s.name)}</b><small>${nb8Esc(s.specialty)} · ${nb8Esc(s.yearLabel)} · <span dir="ltr">${nb8Esc(nb8StuSection(s))}</span></small></div><span class="nb8-score font-num">${nb8Esc(s.score)}</span></header>
          <div class="nb8-adv-grid">
            <div><h4>آخر نتيجة</h4><p><b class="font-num">${nb8Esc(s.score)}</b> · ${s.isPublished ? 'منشورة' : 'قيد الاعتماد'}</p><small>${nb8Esc(s.caseTitle)} · <span class="font-num">${nb8Esc(s.submittedAt)}</span></small>${s.profNote ? `<small class="nb8-adv-prof">ملاحظة المشرف: ${nb8Esc(s.profNote)}</small>` : ''}</div>
            <div><h4>نقاط القوة</h4>${ul(s.strengths)}</div>
            <div><h4>نقاط الضعف</h4>${ul(s.weaknesses)}</div>
            <div><h4>التوصيات</h4>${ul(nb8Recs(s))}</div>
          </div>
          <div class="nb8-adv-form">
            <label><span>حالة المتابعة</span><select data-nb8-adv-status>${opts}</select></label>
            <label class="nb8-adv-wide"><span>ملاحظة إرشادية للطالب</span><textarea data-nb8-adv-note rows="2" maxlength="500" placeholder="تظهر للطالب في ملفه باسم «ملاحظة المرشد الأكاديمي»">${nb8Esc(r.note || '')}</textarea></label>
            <div class="nb8-adv-foot"><button type="button" class="nb8-go focus-ring" data-nb8-adv-save="${nb8Esc(s.id)}">حفظ المتابعة</button><small data-nb8-adv-msg role="status" aria-live="polite">${r.ts ? 'آخر حفظ: ' + new Date(r.ts).toLocaleDateString('ar-JO') : ''}</small></div>
          </div>
        </article>`;
      }).join('');
      nb8RenderAdvisorSum();
    }
    function nb8RenderProf(u) {
      if (!nb8IsProf(u)) return;
      nb8RenderKpis();
      nb8RenderCourses();
      nb8RenderAssignPane();
      nb8RenderProgress();
      nb8RenderAdvisor();
    }
    function nb8RenderAcademic(u) {
      if (!u) return;
      if (nb8IsProf(u)) nb8RenderProf(u); else nb8RenderStudentUni(u);
    }
    function nb8ProfTabs() { return ['courses', 'assign', 'reports', 'progress', 'advisor']; }
    function nb8SetProfTab(tab, focus) {
      const tabs = nb8ProfTabs();
      if (!tabs.includes(tab)) tab = 'courses';
      tabs.forEach(t => {
        const b = document.getElementById('nb8-tab-' + t), p = document.getElementById('nb8-pane-' + t), on = t === tab;
        if (b) { b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; b.classList.toggle('is-on', on); }
        if (p) p.hidden = !on;
      });
      try { sessionStorage.setItem(nb8Keys().tab, tab); } catch (e) {}
      const b = document.getElementById('nb8-tab-' + tab);
      if (b && focus) { b.focus(); try { b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {} }
    }
