    /* =========================================================================
       4. HOME VIEW: CENTERED DEPT FILTER & CASE CARDS
       ========================================================================= */
    function renderDepartmentFilterBar() {
      const bar = document.getElementById('dept-filter-bar');
      if (!bar) return;
      bar.innerHTML = '';

      DEPARTMENTS.forEach(d => {
        const isSelected = d.id === selectedDeptFilter;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        btn.setAttribute('data-dept', d.id);
        btn.className = `dept-pill-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all focus-ring ${
          isSelected
            ? 'bg-teal-700 text-white shadow-xs'
            : 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`;
        btn.textContent = d.name;
        btn.addEventListener('click', () => {
          selectedDeptFilter = d.id;
          renderDepartmentFilterBar();
          renderClinicalCaseCards();
        });
        bar.appendChild(btn);
      });
    }

