    function nbRenderResult() {
      const host = nbHost();
      let score = 0, max = 0; const wrong = []; const weakCount = {};
      nbQuiz.qs.forEach((q, k) => {
        max += q.d;
        if (nbQuiz.ans[k] === q.a) score += q.d; else { wrong.push(q); weakCount[q.t] = (weakCount[q.t] || 0) + q.d; }
      });
      const pct = Math.round(score / max * 100);
      const level = pct < 45 ? 1 : pct < 78 ? 2 : 3;
      const weak = Object.keys(weakCount).sort((a, b) => weakCount[b] - weakCount[a]).slice(0, 3);
      const rooms = nbPickRooms(level, weak, level, nbQuiz.track);
      safeStorageSet(nbPlacementKey(), { track: nbQuiz.track, level, pct, weak, rooms, ts: Date.now() });
      safeStorageSet(nbHistKey(), [...safeStorageGet(nbHistKey(), []), { ts: Date.now(), pct, level }].slice(-8));
      if (authState.user) { authState.user.track = nbQuiz.track; saveAccountToStorage(authState.user); }
      const lv = NB_LEVELS[level];
      host.innerHTML = `
        <div style="display:flex;gap:1.2rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">
          <div><div class="nb-score font-num">${pct}%</div><div style="font-size:.74rem;color:#4F6A77">نتيجة تحديد المستوى</div></div>
          <div><span class="nb-level ${lv.cls}">مستواك المقترح: ${lv.name}</span><div style="font-size:.8rem;color:#425D69;margin-top:.4rem;max-width:22rem">${weak.length ? 'نقاط تحتاج تركيزاً: ' + weak.map(t => NB_TOPIC_NAMES[t]).join('، ') + '.' : 'أجبت إجابات قوية في جميع المحاور.'}</div></div>
        </div>
        <div class="nb-res-grid">
          <div class="nb-box"><h4>تلميحات لغرف المحاكاة</h4><ul>${NB_TIPS[level].map(x => `<li>${x}</li>`).join('')}</ul></div>
          <div class="nb-box"><h4>غرف مقترحة</h4>${nbRoomsHtml(rooms)}</div>
        </div>
        ${wrong.length ? `<div class="nb-box" style="margin-top:1rem"><h4>مراجعة الأسئلة التي أخطأت فيها</h4>${wrong.map(q => `<div class="nb-review"><b>${q.q}</b><br>الإجابة الصحيحة: ${q.o[q.a]}. ${q.why}</div>`).join('')}</div>` : ''}
        <div class="nb-cta" style="margin-top:1.1rem"><button type="button" class="p focus-ring" id="nb-res-register">${nbQModal ? 'حفظ والعودة للوحة' : 'أنشئ حسابك وابدأ بهذا المستوى'}</button><button type="button" class="g focus-ring" id="nb-res-retry">أعد الاختبار</button></div>`;
      host.querySelectorAll('[data-room]').forEach(b => b.addEventListener('click', () => nbOpenRoom(b.dataset.room)));
      document.getElementById('nb-res-retry')?.addEventListener('click', () => { nbQuiz = { track: null, qs: [], i: 0, ans: [] }; nbRenderQuiz(); });
      document.getElementById('nb-res-register')?.addEventListener('click', () => {
        if (nbQModal) { nbCloseLevelModal(); showToast('تم تحديث مستواك وغرفك المقترحة.'); return; }
        openAuthModal('register');
        nbSetRegRole(nbQuiz.track === 'medicine' ? 'medicine' : 'nursing');
        const y = document.getElementById('reg-year'); if (y) y.value = level === 1 ? '1' : level === 2 ? '3' : '4';
      });
    }

