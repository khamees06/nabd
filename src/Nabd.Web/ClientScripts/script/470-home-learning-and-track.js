    /* ------------------- HOME: learning path + nursing section ------------------- */
    function renderLearnPath(u) {
      const box = document.getElementById('home-learn'); if (!box) return;
      if (!u || u.role === 'professor') { box.classList.add('hidden'); return; }
      box.classList.remove('hidden');
      const l = nbLearn(u), need = nbNeedsLearning(u), demos = nbDemosFor(u), gid = nbGuidedId(u);
      const guidedDone = l.guided.length >= 1, obsDone = l.obs.length >= 2;
      const gc = nbCaseObj(gid);
      document.getElementById('learn-sub').textContent = need
        ? 'شاهد حالة، جرّب بإرشاد، ثم تدرب وحدك.'
        : 'مسار اختياري لتطوير مهاراتك.';
      document.getElementById('learn-steps').innerHTML = `
        <div class="nb-ls ${obsDone ? 'done' : 'now'}"><span>1</span><div><strong>شاهد خبيراً</strong><small>${Math.min(l.obs.length, 2)} من 2 مطلوبة.</small><div class="nb-demo-grid">${demos.map(d => `<button type="button" data-demo="${d.id}" class="nb-democ ${l.obs.includes(d.id) ? 'done' : ''}">${nbImg(d.icon, 'nb-demo-img')}<span>${l.obs.includes(d.id) ? '✓ ' : ''}${d.title}</span></button>`).join('')}</div></div></div>
        <div class="nb-ls ${guidedDone ? 'done' : (obsDone ? 'now' : '')}"><span>2</span><div><strong>جرّب حالة موجّهة</strong><small>مع تلميحات في كل مرحلة</small><button type="button" data-guided="${gid}" class="nb-mini">${guidedDone ? '✓ ' : ''}${gc ? gc.title : ''}</button></div></div>
        <div class="nb-ls ${obsDone && guidedDone ? 'done' : ''}"><span>3</span><div><strong>تدرّب باستقلالية</strong><small>تُفتح الحالات المتقدمة مع تقدّمك.</small></div></div>`;
      box.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => obsStart(b.dataset.demo)));
      box.querySelectorAll('[data-guided]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.guided;
        if (NB_NURSE_CASES[id]) nurseStart(id); else startSimulationSession(id, false, true);
      }));
    }
    function renderTrackHome(u) {
      const track = nbTrackOf(u);
      const isNurse = track === 'nursing';
      const er = document.getElementById('home-er-card'), cases = document.getElementById('home-cases-anchor'), nh = document.getElementById('home-nurse');
      er?.classList.remove('hidden'); cases?.classList.add('hidden'); nh?.classList.add('hidden');
      document.getElementById('app-nav-er')?.classList.remove('hidden');
      const nc = document.getElementById('app-nav-cases'); if (nc) nc.textContent = (u && u.role !== 'professor' && isNurse) ? 'حالات التمريض' : 'الحالات والتدريب';
      const ws = document.getElementById('home-welcome-sub');
      if (ws && u && u.role !== 'professor') ws.textContent = 'غرفة الطوارئ مفتوحة، وباقي الغرف تُفتح لاحقاً.';
      // phase8 2026-11-07: welcome line by track + the "what will you do now?" card
      if (ws && u && u.role !== 'professor' && track) ws.textContent = isNurse
        ? 'مسار التمريض: في غرفة الطوارئ تتولى الحالة بتقييم منهجي ومراقبة وسلامة دواء. باقي الغرف تُفتح لاحقاً.'
        : 'مسار الطب: في غرفة الطوارئ أنت الطبيب المقيم، من المقابلة حتى تسليم الحالة. باقي الغرف تُفتح لاحقاً.';
      try { nb8RenderGuide(u); } catch (e) { console.error(e); }
      document.getElementById('home-track-chip') && (document.getElementById('home-track-chip').textContent = !track ? '' : (isNurse ? 'مسار التمريض' : 'مسار الطب'));
      return;
      const grid = document.getElementById('nurse-cards'); grid.innerHTML = '';
      nbFilterBar('nurse-filter', () => renderTrackHome(authState.user));
      const _nl = Object.values(NB_NURSE_CASES).filter(c => !c.guided && !c.periop).filter(nbFltPass);
      if (!_nl.length) grid.innerHTML = '<p style="font-size:.82rem;color:#4F6A77;padding:.6rem">لا توجد حالات بهذه المعايير.</p>';
      _nl.forEach(c => {
        const lock = nbLockInfo(c); const el = document.createElement('div');
        el.className = 'v7-case' + (lock ? ' nb-locked-r is-locked' : '');
        el.innerHTML = `<div class="v7-case-img">${nbImg(NB_CASE_IMG[c.id], '')}</div><div class="v7-case-body"><span class="v7-case-dept"></span><h3 class="t"></h3><p class="h"></p></div><div class="v7-case-foot"><span class="v7-case-meta"><span class="nb-lvl-chip"></span><span class="font-num m"></span></span><button type="button">${lock ? 'مقفلة' : 'ابدأ الحالة ←'}</button></div>`;
        el.querySelector('.t').textContent = c.title;
        el.querySelector('.v7-case-dept').textContent = c.deptName;
        el.querySelector('.nb-lvl-chip').textContent = c.levelLabel;
        el.querySelector('.m').textContent = `${c.durationMin} دقيقة`;
        el.querySelector('.h').textContent = c.cardSummary;
        const bt = el.querySelector('button');
        if (lock) bt.onclick = () => showToast(lock); else bt.onclick = () => nurseStart(c.id);
        grid.appendChild(el);
      });
      nbRenderOr();
    }
