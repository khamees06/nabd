    function nbDerivedLevel(u) {
      if (u.role === 'professor') return 0;
      if (u.role === 'practitioner') return 2;
      return (u.year || 4) <= 2 ? 1 : (u.year || 4) === 3 ? 2 : 3;
    }

    function renderHomePath(u) {
      const box = document.getElementById('home-path');
      if (!box || !u) return;
      try { nbMaybeOnboard(u); renderLearnPath(u); renderTrackHome(u); } catch (e) { console.error(e); }
      if (u.role === 'professor') {
        box.classList.add('hidden'); document.getElementById('home-extra')?.classList.add('hidden');
        const code = u.cohort || (u.id === 'doctor' ? 'NUR-JU-2026' : 'MED-JUST-2026');
        const ic = document.getElementById('prof-invite-code'); if (ic) ic.textContent = code;
        return;
      }
      box.classList.remove('hidden');
      const pl = nbGetPlacement();
      const level = pl ? pl.level : nbDerivedLevel(u);
      const lv = NB_LEVELS[level];
      document.getElementById('path-level').textContent = lv.name;
      document.getElementById('path-level-src').textContent = 'تقدير من أدائك وسنتك الدراسية';
      const st = u.stats || {};
      const num = (x) => { const n = parseInt(x, 10); return isNaN(n) ? null : n; };
      const avg = num(st.avgEr);
      document.getElementById('path-k1').textContent = st.completed != null ? st.completed : 0;
      document.getElementById('path-k2').textContent = st.avgSpec || '--';
      document.getElementById('path-k3').textContent = st.avgEr || '--';
      const d = document.getElementById('path-donut');
      d.setAttribute('stroke-dashoffset', String(314 - 314 * (avg == null ? 0 : avg) / 100));
      document.getElementById('path-donut-txt').textContent = avg == null ? '--' : avg + '%';
      document.getElementById('path-tip').textContent = NB_TIPS[level][0];
      const tier = nbUnlockedTier(u);
      const rh = document.getElementById('path-rooms');
      rh.innerHTML = nbRecoHtml(nbRecommend(u));
      document.getElementById('home-skip-note')?.classList.toggle('hidden', !(pl && pl.skipped));
      rh.querySelectorAll('[data-room]').forEach(b => b.addEventListener('click', () => nbOpenRoom(b.dataset.room)));
      const hist = safeStorageGet(nbHistKey(), []);
      document.getElementById('path-hist').innerHTML = hist.length < 2 ? '' : hist.map(x => `<i title="${x.pct}%" style="height:${Math.max(12, x.pct)}%"></i>`).join('');
      const last = hist[hist.length - 1] || (pl && !pl.skipped ? { ts: pl.ts || Date.now() } : null);
      document.getElementById('path-retake-note').textContent = !last ? (pl && pl.skipped ? '' : 'لم تُجرِ اختبار المستوى بعد.') : (Date.now() - last.ts > 30 * 864e5 ? 'مرّ أكثر من شهر على آخر اختبار مستوى. حان وقت إعادته.' : '');
      const ot = document.getElementById('osce-toggle'); if (ot) ot.checked = nbOsceOn();
      nbRenderMistakes(u);
      nbRenderNotes(u);
      try { renderClinicalCaseCards(); } catch (e) {}
      document.getElementById('home-extra')?.classList.remove('hidden');
    }

    function updateSimLevelHint(caseId) {
      const el = document.getElementById('sim-level-hint');
      if (!el) return;
      const u = authState && authState.user;
      const pl = nbGetPlacement();
      const level = pl ? pl.level : (u ? nbDerivedLevel(u) : 2);
      if (level >= 3 || !CASES_DB[caseId]) { el.classList.remove('on'); el.textContent = ''; return; }
      el.textContent = 'تلميح الغرفة: ' + (NB_ROOM_HINTS[caseId] || '') + (level === 1 ? ' ابدأ بالأسئلة المقترحة أسفل المحادثة.' : '');
      el.classList.add('on');
    }


