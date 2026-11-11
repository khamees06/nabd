    let coachWeaknessOpenOnDesktop = false;

    function toggleCoachWeaknessSidebar(forceState) {
      const panel = document.getElementById('coach-weakness-panel');
      const backdrop = document.getElementById('coach-weakness-backdrop');
      const toggleBtn = document.getElementById('toggle-coach-weakness-btn');
      if (!panel) return;

      if (window.innerWidth < 1024) {
        const shouldOpen = typeof forceState === 'boolean' ? forceState : panel.classList.contains('hidden');
        panel.classList.toggle('hidden', !shouldOpen);
        panel.classList.toggle('flex', shouldOpen);
        backdrop?.classList.toggle('hidden', !shouldOpen);
        toggleBtn?.setAttribute('aria-expanded', String(shouldOpen));
      } else {
        coachWeaknessOpenOnDesktop = typeof forceState === 'boolean' ? forceState : !coachWeaknessOpenOnDesktop;
        panel.classList.toggle('lg:hidden', !coachWeaknessOpenOnDesktop);
        panel.classList.toggle('lg:flex', coachWeaknessOpenOnDesktop);
        toggleBtn?.setAttribute('aria-expanded', String(coachWeaknessOpenOnDesktop));
      }
    }

    function renderInteractiveCoachView() {
      coachRuntime.masteredIds = getCoachMasteredSet();
      const total = COACH_MODULES_DEFAULT.length;
      const doneCount = coachRuntime.masteredIds.size;
      const remCount = Math.max(0, total - doneCount);
      const pct = Math.round((doneCount / total) * 100);

      const pctEl = document.getElementById('coach-mastery-percent');
      if (pctEl) pctEl.textContent = `${pct}% · ${doneCount}/${total}`;
      const barEl = document.getElementById('coach-mastery-bar');
      if (barEl) barEl.style.width = `${pct}%`;
      const remEl = document.getElementById('coach-remaining-count');
      if (remEl) {
        remEl.textContent = doneCount === total
          ? 'أتممت جميع المحاور.'
          : `بقي ${remCount} محاور`;
      }
      const toggleLabelEl = document.getElementById('toggle-coach-weakness-label');
      if (toggleLabelEl) {
        toggleLabelEl.textContent = `المحاور (${remCount})`;
      }

      const queueEl = document.getElementById('coach-weakness-queue');
      if (queueEl) {
        queueEl.innerHTML = '';
        COACH_MODULES_DEFAULT.forEach((mod, idx) => {
          const isDone = coachRuntime.masteredIds.has(mod.id);
          const isActive = idx === coachRuntime.activeIdx;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `w-full p-3.5 rounded-2xl border-2 text-right transition-all flex items-center justify-between gap-2.5 focus-ring ${
            isActive
              ? 'bg-teal-50/90 border-teal-600 text-teal-900 shadow-2xs'
              : (isDone ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800')
          }`;
          btn.innerHTML = `
            <div class="space-y-1 min-w-0">
              <div class="text-xs sm:text-sm font-bold text-slate-900 leading-snug">${mod.title}</div>
              <div class="text-xs font-semibold text-teal-800">${mod.specialty}</div>
            </div>
            <span class="px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 whitespace-nowrap ${
              isDone ? 'bg-emerald-600 text-white' : (isActive ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200')
            }">${isDone ? 'مكتمل ✓' : (isActive ? 'قيد التدريب' : 'تدرّب ←')}</span>
          `;
          btn.addEventListener('click', () => {
            startCoachDrillAtIndex(idx, true);
            renderInteractiveCoachView();
            if (window.innerWidth < 1024) toggleCoachWeaknessSidebar(false);
          });
          queueEl.appendChild(btn);
        });
      }

      startCoachDrillAtIndex(coachRuntime.activeIdx, false);
    }

