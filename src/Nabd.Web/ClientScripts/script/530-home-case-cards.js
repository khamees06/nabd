    function nbCasesLabel(n) { return n === 1 ? 'حالة واحدة' : n === 2 ? 'حالتان' : n <= 10 ? n + ' حالات' : n + ' حالة'; }
    function renderClinicalCaseCards() {
      const grid = document.getElementById('cases-cards-grid');
      const emptyState = document.getElementById('cases-empty-state');
      const countEl = document.getElementById('filtered-cases-count');
      if (!grid) return;

      const allCases = Object.values(CASES_DB);
      nbFilterBar('case-filter2', renderClinicalCaseCards);
      const filtered = (selectedDeptFilter === 'all'
        ? allCases
        : allCases.filter(c => c.deptId === selectedDeptFilter)).filter(nbFltPass);

      const deptObj = DEPARTMENTS.find(d => d.id === selectedDeptFilter);
      const deptLabel = deptObj ? deptObj.name : 'جميع التخصصات';

      if (filtered.length === 0) {
        if (countEl) countEl.textContent = `لا حالات في «${deptLabel}»`;
        grid.innerHTML = '';
        grid.classList.add('hidden');
        emptyState?.classList.remove('hidden');
        return;
      }

      emptyState?.classList.add('hidden');
      grid.classList.remove('hidden');
      if (countEl) {
        countEl.textContent = selectedDeptFilter === 'all'
          ? nbCasesLabel(filtered.length)
          : `${nbCasesLabel(filtered.length)} في «${deptLabel}»`;
      }

      grid.innerHTML = '';
      filtered.forEach(c => {
        const card = document.createElement('article');
        card.className = 'v7-case';

        card.innerHTML = `
          <div class="v7-case-img"><img src="${NB_CASE_PHOTO[c.id] || c.image}" alt="${c.deptName}" loading="lazy" decoding="async" onerror="nbImgFail(this)"></div>
          <div class="v7-case-body">
            <span class="v7-case-dept">${c.deptName}</span>
            <h3 class="card-title-safe"></h3>
            <p class="card-summary-safe"></p>
          </div>
          <div class="v7-case-foot">
            <span class="v7-case-meta"><span class="nb-lvl-chip">${c.levelLabel}</span><span class="font-num">${c.durationMin} دقيقة</span></span>
            <button type="button" class="start-specialized-case-btn focus-ring">ابدأ الحالة ←</button>
          </div>
        `;

        card.querySelector('.card-title-safe').textContent = c.title;
        card.querySelector('.card-summary-safe').textContent = c.cardSummary.replace(/وحساسية دوائية/g, 'ويتطلب استقصاء السوابق الدوائية');
        const startBtn = card.querySelector('.start-specialized-case-btn');
        const lockMsg = nbLockInfo(c);
        if (lockMsg) {
          card.classList.add('nb-locked', 'is-locked');
          startBtn.textContent = 'مقفلة';
          startBtn.addEventListener('click', () => showToast(lockMsg));
        } else {
          startBtn.addEventListener('click', () => startSimulationSession(c.id, false, true));
        }

        grid.appendChild(card);
      });
    }

