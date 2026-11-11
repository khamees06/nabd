    let activeInspectedStudentId = null;

    function openStudentAttemptDetailModal(stuId) {
      const cohort = getProfCohortList();
      const stu = cohort.find(s => s.id === stuId) || cohort[0];
      if (!stu) return;
      activeInspectedStudentId = stu.id;
      try { nbLoadComment(stu); } catch (e) {}

      document.getElementById('stu-modal-role-badge').textContent = `${stu.specialty} · ${stu.yearLabel} (الرقم الجامعي: ${stu.uniId})`;
      const pubBadge = document.getElementById('stu-modal-pub-badge');
      pubBadge.textContent = stu.isPublished ? 'الدرجة معتمدة ومنشورة للطالب ✓' : 'قيد المراجعة (غير منشورة بعد)';
      pubBadge.className = stu.isPublished
        ? 'px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold'
        : 'px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold';

      document.getElementById('stu-modal-title').textContent = `ملف محاولة الطالب: ${stu.name}`;
      document.getElementById('stu-modal-subtitle').textContent = `${stu.caseTitle} · وقت التسليم: ${stu.submittedAt}`;
      document.getElementById('stu-modal-diagnosis').textContent = nbBidi(stu.diagnosis);
      document.getElementById('stu-modal-workup-summary').textContent = `${stu.vitalsInfo} | ${stu.workupLog.length} فحوصات`;
      document.getElementById('stu-modal-score').textContent = stu.score;

      const askedCount = stu.inquiryLog.filter(i => i.asked).length;
      document.getElementById('stu-modal-inq-count').textContent = `سأل ${askedCount} من ${stu.inquiryLog.length} محاور أساسية`;

      const inqTbody = document.getElementById('stu-modal-inquiry-tbody');
      inqTbody.innerHTML = stu.inquiryLog.map(i => `
        <tr>
          <td class="px-4 py-2.5 font-bold text-slate-900">${i.topic}</td>
          <td class="px-4 py-2.5 font-num font-semibold ${i.asked ? 'text-emerald-700' : 'text-rose-700'}">${i.asked ? 'طُرح في (' + i.time + ') ✓' : 'لم يُطرح ✗'}</td>
          <td class="px-4 py-2.5 text-slate-700">
            <div class="font-semibold text-teal-900">س: ${i.qText}</div>
            <div class="text-slate-500 mt-0.5">ج: ${i.aText}</div>
          </td>
          <td class="px-4 py-2.5 font-semibold ${i.asked ? 'text-emerald-700' : 'text-rose-700'}">${i.eval}</td>
        </tr>
      `).join('');

      const wTbody = document.getElementById('stu-modal-workup-tbody');
      wTbody.innerHTML = '';
      stu.workupLog.forEach(w => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="px-4 py-2.5 font-bold text-slate-900">${w.title}<br><span class="text-xs text-slate-400 font-num">توقيت الطلب: ${w.time}</span></td>
          <td class="px-4 py-2.5 text-slate-700 font-num">
            <div>${w.rawSummary}</div>
            ${w.isImaging && w.imageKey && DIAG_IMAGES[w.imageKey] ? `<button type="button" class="stu-modal-zoom-img-btn mt-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold">معاينة وتكبير الصورة المرفقة</button>` : ''}
          </td>
          <td class="px-4 py-2.5 text-slate-800 font-medium">${w.studentAnalysis || '--'}</td>
          <td class="px-4 py-2.5">
            <div class="font-bold ${w.isUnjustified ? 'text-rose-700' : 'text-emerald-700'}">${w.relationStatus}</div>
            ${w.studentJustification ? `<div class="text-xs text-slate-600 mt-0.5">تبرير الطالب: «${w.studentJustification}»</div>` : ''}
          </td>
        `;
        if (w.isImaging && w.imageKey && DIAG_IMAGES[w.imageKey]) {
          const zBtn = tr.querySelector('.stu-modal-zoom-img-btn');
          if (zBtn) {
            zBtn.addEventListener('click', () => {
              const imgObj = DIAG_IMAGES[w.imageKey];
              openMedicalLightbox(imgObj.url || imgObj.fallback, `${w.title} — محاولة ${stu.name}`);
            });
          }
        }
        wTbody.appendChild(tr);
      });

      document.getElementById('stu-modal-scratchpad').textContent = stu.scratchpad;
      document.getElementById('stu-modal-sbar-sb').textContent = stu.sbarSB;
      document.getElementById('stu-modal-sbar-ar').textContent = stu.sbarAR;

      const strList = document.getElementById('stu-modal-strengths');
      strList.innerHTML = stu.strengths.map(s => `<li>${s}</li>`).join('');
      const weakList = document.getElementById('stu-modal-weaknesses');
      weakList.innerHTML = stu.weaknesses.map(w => `<li>${w}</li>`).join('');

      document.getElementById('stu-modal-prof-note').value = stu.profNote || '';

      const modal = document.getElementById('student-attempt-detail-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeStudentAttemptDetailModal() {
      const modal = document.getElementById('student-attempt-detail-modal');
      if (!modal) return;
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

