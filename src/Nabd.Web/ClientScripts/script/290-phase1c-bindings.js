    function initPhase1c() {
      document.getElementById('level-modal-close')?.addEventListener('click', () => {
        const u = authState.user;
        if (u && u.role !== 'professor' && !nbGetPlacement()) {
          const tr = nbTrackOf(u) || 'nursing';
          safeStorageSet(nbPlacementKey(), { track: tr, level: 1, pct: 0, weak: [], rooms: [], skipped: true, ts: Date.now() });
          u.track = tr; saveAccountToStorage(u);
          nbCloseLevelModal();
          showToast('تخطّيت اختبار المستوى، لذلك سنتعامل معك كمبتدئ ونبدأ بمسار التعلّم. يمكنك إجراء الاختبار لاحقاً من لوحتك.');
        } else nbCloseLevelModal();
      });
      document.getElementById('skip-take-btn')?.addEventListener('click', () => nbOpenLevelModal({ onboard: true, u: authState.user }));
      document.getElementById('path-retake')?.addEventListener('click', nbOpenLevelModal);
      document.getElementById('osce-toggle')?.addEventListener('change', (e) => { safeStorageSet('nabd_osce', e.target.checked); showToast(e.target.checked ? 'تم تفعيل وضع الامتحان للجلسات القادمة.' : 'تم إيقاف وضع الامتحان.'); });
      document.getElementById('stu-comment-save')?.addEventListener('click', () => {
        const stu = getProfCohortList().find(x => x.id === activeInspectedStudentId); if (!stu) return;
        const txt = (document.getElementById('stu-comment-input').value || '').trim(); if (!txt) return;
        const all = safeStorageGet(NB_COMMENTS_KEY, {});
        all[stu.name] = [{ text: txt, ts: Date.now(), by: authState.user ? authState.user.name : '' }, ...(all[stu.name] || [])];
        safeStorageSet(NB_COMMENTS_KEY, all);
        document.getElementById('stu-comment-status').textContent = 'تم الإرسال ✓';
        nbLoadComment(stu); document.getElementById('stu-comment-status').textContent = 'تم الإرسال ✓';
      });
      document.getElementById('prof-invite-copy')?.addEventListener('click', () => {
        const t = document.getElementById('prof-invite-code').textContent;
        try { navigator.clipboard.writeText(t); showToast('تم نسخ رمز الدعوة'); } catch (e) { showToast(t); }
      });
      const hc = document.getElementById('hero-stat-cases'), hd = document.getElementById('hero-stat-depts');
      if (hc) hc.textContent = Object.keys(CASES_DB).length;
      if (hd) hd.textContent = new Set(Object.values(CASES_DB).map(c => c.deptId)).size;
    }


