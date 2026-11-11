    // Operating-room section on the nursing home: the three phases in order.
    function nbRenderOr() {
      const grid = document.getElementById('or-cards'); if (!grid) return;
      const phase = { 1: 'المرحلة 1 · قبل العملية', 2: 'المرحلة 2 · داخل غرفة العمليات', 3: 'المرحلة 3 · غرفة الإفاقة' };
      grid.innerHTML = '';
      Object.values(NB_NURSE_CASES).filter(c => c.periop).sort((a, b) => a.periop - b.periop).forEach(c => {
        const lock = nbLockInfo(c); const el = document.createElement('div');
        el.className = 'v7-case' + (lock ? ' nb-locked-r is-locked' : '');
        el.innerHTML = `<div class="v7-case-img">${nbImg(NB_CASE_IMG[c.id], '')}</div><div class="v7-case-body"><span class="v7-case-dept"></span><h3 class="t"></h3><p class="h"></p></div><div class="v7-case-foot"><span class="v7-case-meta"><span class="nb-lvl-chip"></span><span class="font-num m"></span></span><button type="button">${lock ? 'مقفلة' : 'ابدأ الحالة ←'}</button></div>`;
        el.querySelector('.t').textContent = c.title;
        el.querySelector('.v7-case-dept').textContent = phase[c.periop];
        el.querySelector('.nb-lvl-chip').textContent = c.levelLabel;
        el.querySelector('.m').textContent = `${c.durationMin} دقيقة`;
        el.querySelector('.h').textContent = c.cardSummary;
        const bt = el.querySelector('button');
        if (lock) bt.onclick = () => showToast(lock); else bt.onclick = () => nurseStart(c.id);
        grid.appendChild(el);
      });
    }
