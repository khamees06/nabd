    /* =========================================================================
       6. SBAR HANDOVER SUBMISSION & EVIDENCE-BASED REPORT GENERATION
       ========================================================================= */
    function openHandoverModal() {
      const modal = document.getElementById('handover-modal');
      if (!modal) return;
      const c = simState.caseData;
      const expectedIds = (c && c.expectedWorkupIds) ? c.expectedWorkupIds : [];
      const extraWorkups = simState.requestedWorkups.filter(r => !expectedIds.includes(r.id) && !r.isViolation);
      const extraBox = document.getElementById('handover-extra-workups-box');
      const extraList = document.getElementById('handover-extra-workups-list');

      if (extraBox && extraList) {
        if (extraWorkups.length > 0) {
          extraBox.classList.remove('hidden');
          extraList.innerHTML = '';
          extraWorkups.forEach(w => {
            const row = document.createElement('div');
            row.className = 'space-y-1';
            row.innerHTML = `
              <label class="text-xs font-bold text-amber-900 block">مبرر طلب (${w.title}):</label>
              <input type="text" data-extra-wid="${w.id}" value="${w.studentJustification || ''}" placeholder="اكتب السبب العلمي أو التشخيص التفريقي لطلب هذا الفحص..." class="extra-workup-just-input w-full p-2 rounded-lg bg-white border border-amber-300 text-xs" />
            `;
            extraList.appendChild(row);
          });
        } else {
          extraBox.classList.add('hidden');
          extraList.innerHTML = '';
        }
      }

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeHandoverModal() {
      const modal = document.getElementById('handover-modal');
      if (!modal) return;
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

