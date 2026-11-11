    /* ---------- professor side ---------- */
    function nb8Stats(list) {
      const n = list.length;
      const nums = list.map(s => parseInt(s.score, 10)).filter(x => !isNaN(x));
      const st = { n, avg: null, max: null, min: null, pub: 0, nurse: 0, med: 0, flagged: [], allergyHave: 0, allergyAsked: 0, qAll: 0, qAsked: 0, wAll: 0, wOk: 0, best: null };
      if (nums.length) { st.avg = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length); st.max = Math.max(...nums); st.min = Math.min(...nums); }
      list.forEach(s => {
        if (s.isPublished) st.pub++;
        if (nb8StuTrack(s) === 'medicine') st.med++; else st.nurse++;
        if (s.hasUnjustifiedWorkup) st.flagged.push(s);
        let hasA = false, askedA = false;
        (s.inquiryLog || []).forEach(q => { st.qAll++; if (q.asked) st.qAsked++; if (/حساسية/.test(q.topic || '')) { hasA = true; if (q.asked) askedA = true; } });
        if (hasA) { st.allergyHave++; if (askedA) st.allergyAsked++; }
        (s.workupLog || []).forEach(w => { st.wAll++; if (!w.isUnjustified) st.wOk++; });
        if (!st.best || (parseInt(s.score, 10) || 0) > (parseInt(st.best.score, 10) || 0)) st.best = s;
      });
      return st;
    }
    function nb8RenderKpis() {
      const st = nb8Stats(getProfCohortList());
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      const tracks = `تمريض (${st.nurse}) · طب (${st.med})`;
      const flaggedNames = st.flagged.map(s => s.name).join('، ');
      set('home-prof-kpi-total', nb8Count(st.n));
      set('home-prof-kpi-total-sub', tracks);
      set('home-prof-kpi-submitted', `${st.n} / ${st.n}`);
      set('home-prof-kpi-submitted-sub', `${st.pub} منشورة · ${st.n - st.pub} بانتظار الاعتماد`);
      set('home-prof-kpi-avg', st.avg == null ? '--' : `${st.avg}%`);
      set('home-prof-kpi-avg-sub', st.max == null ? '' : `أعلى درجة: ${st.max}% · أدنى درجة: ${st.min}%`);
      set('home-prof-kpi-warn', st.flagged.length ? `فحوصات بلا مبرر مقنع (${st.flagged.length} من ${st.n})` : 'لا فحوصات غير مبررة مسجلة');
      set('home-prof-kpi-warn-sub', flaggedNames);
      set('home-prof-attempts', `المحاولات: ${st.n}`);
      set('home-prof-tab-reports-btn', `مراجعة تقارير الطلاب (${st.n})`);
      set('uni-prof-kpi-count', nb8Count(st.n));
      set('uni-prof-kpi-count-sub', tracks);
      set('uni-prof-kpi-sub', `${st.pub} / ${st.n} منشورة`);
      set('uni-prof-kpi-sub-sub', st.allergyHave ? `سؤال الحساسية: طُرح في ${st.allergyAsked} من ${st.allergyHave} (المحاولات التي تضمّنت هذا البند)` : '');
      set('uni-prof-kpi-avg', st.avg == null ? '--' : `${st.avg}%`);
      set('uni-prof-kpi-avg-sub', st.best ? `أعلى أداء: ${st.best.name} (${st.best.score})` : '');
      set('uni-prof-kpi-warn', st.flagged.length ? `فحوصات بلا مبرر مقنع (${st.flagged.length} من ${st.n})` : 'لا تنبيهات');
      set('uni-prof-kpi-warn-sub', flaggedNames ? `${flaggedNames} (انظر التفاصيل بالجدول)` : '');
    }
    function nb8RenderCourses() {
      const box = document.getElementById('nb8-courses');
      if (!box) return;
      const cohort = getProfCohortList(), locals = nb8LocalStudents(), asg = nb8GetAssignments();
      box.innerHTML = '<div class="nb8-courses-grid">' + nb8Courses().map(co => {
        const sec = NB_COHORTS[co.section] || {};
        const demoN = cohort.filter(s => nb8StuSection(s) === co.section).length;
        const localN = locals.filter(a => a.cohort === co.section).length;
        const asN = asg.filter(a => a.section === co.section).length;
        return `<article class="nb8-course">
          <div class="nb8-course-head"><b dir="ltr">${nb8Esc(co.course)}</b><span>${co.track === 'medicine' ? 'مسار الطب' : 'مسار التمريض'}</span></div>
          <div class="nb8-course-sec"><small>الشعبة</small><b dir="ltr">${nb8Esc(co.section)}</b><span>${nb8Esc(sec.name || '')}${sec.uni ? ' · ' + nb8Esc(sec.uni) : ''}</span></div>
          <ul class="nb8-mini-stats">
            <li><b class="font-num">${demoN}</b><span>في بيانات العرض</span></li>
            <li><b class="font-num">${localN}</b><span>مسجّلون على هذا الجهاز</span></li>
            <li><b class="font-num">${asN}</b><span>واجبات مسندة</span></li>
          </ul>
          <div class="nb8-course-actions"><button type="button" class="focus-ring" data-nb8-copy="${nb8Esc(co.section)}">نسخ رمز الشعبة</button><button type="button" class="focus-ring is-main" data-nb8-assign-to="${nb8Esc(co.section)}">أسند حالة لهذه الشعبة</button></div>
        </article>`;
      }).join('') + '</div><p class="nb8-muted nb8-courses-foot">يكتب الطالب رمز الشعبة عند إنشاء حسابه، أو يضيفه لاحقاً من بوابة المساقات. أرقام «بيانات العرض» محسوبة من سجلات الطلبة التجريبية في الشعبة.</p>';
    }
    function nb8RenderAssignList(cases) {
      const box = document.getElementById('nb8-as-list');
      if (!box) return;
      const byId = {}; (cases || []).forEach(c => { byId[c.id] = c; });
      const list = nb8GetAssignments().slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
      box.innerHTML = list.length ? list.map(a => {
        const c = byId[a.caseId], L = nb8CaseLabel(c);
        return `<div class="nb8-as-row">
          <div class="nb8-as-row-main"><b>${nb8Esc(L.title)}</b><small>التشخيص (للمشرف فقط): ${nb8Esc(c && c.dx ? c.dx.ar : a.caseId)}</small></div>
          <div class="nb8-as-meta"><span dir="ltr">${nb8Esc(a.section)}</span>${a.due ? `<span>التسليم: ${nb8Esc(nb8FmtDate(a.due))}</span>` : '<span>بلا موعد</span>'}${a.note ? `<span class="nb8-as-meta-note" data-no-terms>${nb8Esc(a.note)}</span>` : ''}</div>
          <button type="button" class="focus-ring" data-nb8-unassign="${nb8Esc(a.id)}">إلغاء الإسناد</button>
        </div>`;
      }).join('') : '<p class="nb8-empty">لم تُسند أي حالة بعد.</p>';
    }
    function nb8RenderAssignPane() {
      const secSel = document.getElementById('nb8-as-section');
      if (secSel && !secSel.options.length) {
        secSel.innerHTML = nb8Courses().map(co => `<option value="${nb8Esc(co.section)}">${nb8Esc(co.section)} · ${nb8Esc(co.course)} · ${nb8Esc((NB_COHORTS[co.section] || {}).name || '')}</option>`).join('');
      }
      const caseSel = document.getElementById('nb8-as-case');
      const draw = (cases) => {
        if (caseSel && cases && caseSel.dataset.filled !== '1') {
          caseSel.innerHTML = '<option value="">اختر حالة…</option>' + cases.map(c => `<option value="${nb8Esc(c.id)}">${nb8Esc(nb8CaseLabel(c).title)} — ${nb8Esc(c.dx && c.dx.ar ? c.dx.ar : '')}</option>`).join('');
          caseSel.dataset.filled = '1';
        }
        nb8RenderAssignList(cases);
      };
      draw(nb8CasesCache);
      if (!nb8CasesCache) nb8LoadErCases().then(draw).catch(() => { if (caseSel && caseSel.dataset.filled !== '1') caseSel.innerHTML = '<option value="">تعذّر تحميل الحالات. تحقق من الاتصال.</option>'; });
    }
    function nb8Bar(label, a, b, note) {
      const pct = b ? Math.round(a * 100 / b) : 0;
      return `<div class="nb8-bar"><div class="nb8-bar-top"><span>${nb8Esc(label)}</span><b class="font-num">${a} / ${b}</b></div><div class="nb8-bar-track" role="img" aria-label="${nb8Esc(label)}: ${a} من ${b}"><i style="width:${pct}%"></i></div>${note ? `<small>${nb8Esc(note)}</small>` : ''}</div>`;
    }
    function nb8RenderProgress() {
      const box = document.getElementById('nb8-progress');
      if (!box) return;
      const list = getProfCohortList(), st = nb8Stats(list);
      const ul = (arr) => `<ul>${(arr || []).map(x => `<li>${nb8Esc(x)}</li>`).join('')}</ul>`;
      const rows = list.map(s => {
        const q = (s.inquiryLog || []), w = (s.workupLog || []);
        const qa = q.filter(x => x.asked).length, wo = w.filter(x => !x.isUnjustified).length;
        const sc = parseInt(s.score, 10) || 0;
        return `<tr>
          <td><b>${nb8Esc(s.name)}</b><small>${nb8Esc(s.specialty)} · ${nb8Esc(s.yearLabel)}</small></td>
          <td class="nb8-td-score"><div class="nb8-score-bar"><i style="width:${Math.max(0, Math.min(100, sc))}%"></i></div><b class="font-num">${nb8Esc(s.score)}</b><small>${s.isPublished ? 'منشورة' : 'قيد الاعتماد'}</small></td>
          <td class="font-num">${qa} / ${q.length}</td>
          <td class="font-num">${wo} / ${w.length}</td>
          <td>${ul(s.strengths)}</td>
          <td>${ul(s.weaknesses)}</td>
          <td><button type="button" class="nb8-link focus-ring" data-nb8-open-stu="${nb8Esc(s.id)}">التفاصيل</button></td>
        </tr>`;
      }).join('');
      box.innerHTML = `
        <div class="nb8-bars">
          ${nb8Bar('أسئلة المقابلة المطروحة', st.qAsked, st.qAll, 'من بنود المقابلة المسجلة في محاولات الشعبة')}
          ${nb8Bar('سؤال الحساسية الدوائية', st.allergyAsked, st.allergyHave, 'محاولات سُئل فيها عن الحساسية من بين المحاولات التي تضمّنت هذا البند')}
          ${nb8Bar('فحوصات مبرّرة', st.wOk, st.wAll, 'من مجموع الفحوصات التي طلبها الطلبة')}
          ${nb8Bar('نتائج منشورة', st.pub, st.n, 'نتائج اعتمدها المشرف من مجموع المحاولات')}
        </div>
        <div class="nb8-table-wrap" tabindex="0" role="region" aria-label="تقدّم كل طالب">
          <table class="nb8-table">
            <thead><tr><th>الطالب</th><th>الدرجة</th><th>المقابلة</th><th>فحوصات مبرّرة</th><th>نقاط القوة</th><th>نقاط الضعف</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }
