    function nbDateOf(h) { return h.date || (h.ts ? new Date(h.ts).toISOString().slice(0, 10) : '--'); }

    function renderProfileDash(u) {
      const dashBtn = document.querySelector('[data-ptab="dash"]');
      const isProf = u.role === 'professor';
      dashBtn?.classList.toggle('hidden', isProf);
      if (isProf) { document.getElementById('profile-pane-dash')?.classList.add('hidden'); return; }
      const $ = id => document.getElementById(id);
      // level
      const pl = nbGetPlacement(); const lvl = pl ? pl.level : nbDerivedLevel(u); const lv = NB_LEVELS[lvl];
      $('dash-level').innerHTML = `<span class="nb-level ${lv.cls}">${lv.name}</span><p class="nb-dsub">${pl ? (pl.skipped ? 'تخطّيت اختبار المستوى فنعاملك كمبتدئ.' : 'نتيجة آخر اختبار: ' + pl.pct + '%') : 'تقدير من سنتك الدراسية.'}</p><p class="nb-dsub">المسار: <b>${nbTrackOf(u) === 'medicine' ? 'الطب' : 'التمريض'}</b> · أعلى مستوى مفتوح: <b>${NB_LEVELS[nbUnlockedTier(u)].name}</b></p><button type="button" class="nb-mini" id="dash-retake">أعد اختبار المستوى</button>`;
      $('dash-retake').onclick = () => nbOpenLevelModal({ u });
      // skills by department
      const g = {};
      (u.history || []).forEach(h => {
        let c = h.caseId ? nbCaseObj(h.caseId) : Object.values(CASES_DB).find(x => x.title === h.caseTitle);
        const n = typeof h.num === 'number' ? h.num : parseInt(h.score, 10);
        if (c && !isNaN(n)) (g[c.deptName] = g[c.deptName] || []).push(n);
      });
      const rows = Object.keys(g).map(d => [d, Math.round(g[d].reduce((a, b) => a + b, 0) / g[d].length), g[d].length]).sort((a, b) => b[1] - a[1]).slice(0, 6);
      $('dash-skills').innerHTML = rows.length ? rows.map(r => `<div class="nb-bar"><div><span>${r[0]}</span><b class="font-num">${r[1]}%</b></div><i><u style="width:${r[1]}%;background:${r[1] >= 85 ? '#0E7540' : r[1] >= 70 ? '#16838A' : '#D28A09'}"></u></i></div>`).join('') : '<p class="nb-dsub">أكمل حالات لتظهر مهاراتك هنا.</p>';
      // coach
      const done = getCoachMasteredSet().size, tot = COACH_MODULES_DEFAULT.length;
      $('dash-coach').innerHTML = `<div class="nb-bar"><div><span>المحاور المتقنة</span><b class="font-num">${done}/${tot}</b></div><i><u style="width:${Math.round(done / tot * 100)}%;background:#1A3643"></u></i></div>${COACH_MODULES_DEFAULT.map(m => `<div class="nb-li"><span>${getCoachMasteredSet().has(m.id) ? '✓' : '○'}</span>${m.title.replace(/^[٠-٩0-9]+\.\s*/, '')}</div>`).join('')}<button type="button" class="nb-mini" id="dash-coach-go">افتح المدرب</button>`;
      $('dash-coach-go').onclick = () => navigateTo('coach');
      // recent
      const rec = (u.history || []).slice(0, 5);
      $('dash-recent').innerHTML = rec.length ? rec.map(h => `<div class="nb-li"><span class="nb-sc">${h.num != null ? h.num + '%' : h.score}</span><div><b>${h.caseTitle}</b><small>${nbDateOf(h)} · ${h.mode}</small></div></div>`).join('') + '<button type="button" class="nb-mini" id="dash-hist-go">كل السجل</button>' : '<p class="nb-dsub">لا جلسات بعد.</p>';
      $('dash-hist-go')?.addEventListener('click', () => switchProfileSubTab('history'));
      nbRenderMistakes(u); nbRenderNotes(u);
    }

    function switchProfileSubTab(ptab) {
      ['dash', 'overview', 'history', 'certificate', 'settings'].forEach(t => {
        document.getElementById('profile-pane-' + t)?.classList.toggle('hidden', t !== ptab);
      });
      document.querySelectorAll('.profile-tab-btn').forEach(btn => {
        const isCurrent = btn.getAttribute('data-ptab') === ptab;
        btn.className = isCurrent
          ? 'profile-tab-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-teal-700 text-white focus-ring'
          : 'profile-tab-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 focus-ring';
      });
    }

