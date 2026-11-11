    function getProfCohortList() {
      return safeStorageGet(STORAGE_KEYS.PROF_COHORT, PROFESSOR_COHORT_DEFAULT);
    }

    function saveProfCohortList(list) {
      safeStorageSet(STORAGE_KEYS.PROF_COHORT, list);
    }

    function renderProfessorCohortTables() {
      const homeTbody = document.getElementById('home-prof-cohort-tbody');
      const uniTbody = document.getElementById('uni-prof-cohort-tbody');
      const filterVal = document.getElementById('prof-cohort-filter')?.value || 'all';
      const cohort = getProfCohortList();

      if (homeTbody) {
        homeTbody.innerHTML = '';
        cohort.forEach(stu => {
          const tr = document.createElement('tr');
          const scoreNum = parseInt(stu.score, 10) || 0;
          const scoreBadgeClass = scoreNum >= 85
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
            : (scoreNum >= 75 ? 'bg-teal-50 text-teal-900 border-teal-300' : 'bg-amber-50 text-amber-900 border-amber-300');
          tr.innerHTML = `
            <td>
              <div class="font-bold text-slate-900 text-xs sm:text-sm">${stu.name}</div>
              <div class="text-xs text-slate-600 font-medium mt-0.5">${stu.specialty} · ${stu.yearLabel}</div>
            </td>
            <td class="max-w-[210px]">
              <div class="font-bold text-slate-900 text-xs leading-snug">${stu.caseTitle}</div>
              <div class="text-xs text-slate-500 font-num mt-0.5 whitespace-nowrap">التسليم: ${stu.submittedAt}</div>
            </td>
            <td class="max-w-[230px]">
              <div class="text-slate-800 font-medium text-xs leading-relaxed">${nbBidi(stu.diagnosis)}</div>
            </td>
            <td>
              <span class="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border ${stu.hasUnjustifiedWorkup ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-emerald-50 text-emerald-900 border-emerald-300'}">${stu.workupSummaryBadge}</span>
            </td>
            <td class="text-center whitespace-nowrap">
              <span class="inline-block px-2.5 py-0.5 rounded-xl border font-num font-bold text-xs sm:text-sm ${scoreBadgeClass}">${stu.score}</span>
              <span class="block text-xs font-semibold mt-0.5 ${stu.isPublished ? 'text-emerald-700' : 'text-amber-800'}">${stu.isPublished ? 'منشورة ✓' : 'قيد الاعتماد'}</span>
            </td>
            <td class="text-center whitespace-nowrap">
              <button type="button" class="prof-open-stu-btn px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-700 text-teal-900 hover:text-white border border-teal-300 text-xs font-bold transition-colors shadow-2xs whitespace-nowrap" data-stu-id="${stu.id}">
                عرض الإجابات ←
              </button>
            </td>
          `;
          homeTbody.appendChild(tr);
        });
      }

      if (uniTbody) {
        uniTbody.innerHTML = '';
        const filtered = cohort.filter(stu => {
          if (filterVal === 'all') return true;
          if (filterVal === 'weakness') return stu.hasUnjustifiedWorkup;
          return stu.specialty.includes(filterVal);
        });
        filtered.forEach(stu => {
          const tr = document.createElement('tr');
          const scoreNum = parseInt(stu.score, 10) || 0;
          const scoreBadgeClass = scoreNum >= 85
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
            : (scoreNum >= 75 ? 'bg-teal-50 text-teal-900 border-teal-300' : 'bg-amber-50 text-amber-900 border-amber-300');
          tr.innerHTML = `
            <td>
              <div class="font-bold text-slate-900 text-xs sm:text-sm">${stu.name}</div>
              <span class="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold font-num">رقم: ${stu.uniId}</span>
            </td>
            <td class="whitespace-nowrap">
              <div class="font-bold text-slate-900 text-xs">${stu.specialty}</div>
              <div class="text-xs text-teal-800 font-semibold mt-0.5">${stu.yearLabel}</div>
            </td>
            <td class="max-w-[200px]">
              <div class="text-slate-900 font-bold text-xs leading-snug">${stu.caseTitle}</div>
              <div class="text-xs text-slate-500 font-num mt-0.5 whitespace-nowrap">${stu.submittedAt}</div>
            </td>
            <td class="max-w-[220px]">
              <div class="text-slate-800 font-medium text-xs leading-relaxed">${nbBidi(stu.diagnosis)}</div>
            </td>
            <td>
              <span class="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border ${stu.hasUnjustifiedWorkup ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-emerald-50 text-emerald-900 border-emerald-300'}">${stu.workupSummaryBadge}</span>
            </td>
            <td class="text-center whitespace-nowrap">
              <span class="inline-block px-2.5 py-0.5 rounded-xl border font-num font-bold text-xs sm:text-sm ${scoreBadgeClass}">${stu.score}</span>
              <span class="block text-xs font-bold mt-0.5 ${stu.isPublished ? 'text-emerald-700' : 'text-amber-800'}">${stu.isPublished ? 'منشورة ✓' : 'قيد الاعتماد'}</span>
            </td>
            <td class="text-center whitespace-nowrap">
              <button type="button" class="prof-open-stu-btn px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-700 text-teal-900 hover:text-white border border-teal-300 text-xs font-bold transition-colors shadow-2xs whitespace-nowrap" data-stu-id="${stu.id}">
                عرض الإجابات ←
              </button>
            </td>
          `;
          uniTbody.appendChild(tr);
        });
      }

      document.querySelectorAll('.prof-open-stu-btn').forEach(btn => {
        btn.addEventListener('click', () => openStudentAttemptDetailModal(btn.getAttribute('data-stu-id')));
      });
    }

