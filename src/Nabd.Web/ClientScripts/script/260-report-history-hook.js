    /* after report: history fields, compare, retry, unlock toast */
    function nbAfterReport(c, score, passed, isER) {
      nbStopOsce();
      const u = authState.user; if (!u || !u.history || !u.history[0]) return;
      const h = u.history[0];
      const prevHist = u.history.slice(1);
      const tierBefore = nbUnlockedTier(u, prevHist);
      if (c.id === NB_MED_GUIDED_ID && score >= 50) { const l = nbLearn(u); if (!l.guided.includes(c.id)) l.guided.push(c.id); }
      h.caseId = c.id; h.num = score; h.passed = passed; h.mistakes = [...simState.safetyMistakes]; h.osce = nbOsceActive; h.ts = Date.now();
      const prev = prevHist.find(x => x.caseId === c.id && typeof x.num === 'number');
      const box = document.getElementById('rep-compare');
      if (box) {
        if (prev) {
          const d = score - prev.num;
          box.innerHTML = `<b>مقارنة بمحاولتك السابقة في هذه الحالة:</b> ${prev.num}% ← ${score}% (${d >= 0 ? '+' : ''}${d} نقطة). ${d > 0 ? 'تحسّنت، استمر.' : d === 0 ? 'النتيجة نفسها، راجع الملاحظات أدناه.' : 'تراجعت قليلاً، راجع أخطاء السلامة والتبرير.'}`;
          box.classList.remove('hidden');
        } else { box.classList.add('hidden'); }
      }
      if (nbOsceActive) { const bd = document.getElementById('rep-eval-type-badge'); if (bd) bd.textContent += ' · وضع الامتحان (OSCE)'; }
      const retry = document.getElementById('rep-retry-btn');
      if (retry) retry.onclick = () => startSimulationSession(c.id, !!isER, true, false);
      saveAccountToStorage(u);
      const tierAfter = nbUnlockedTier(u);
      if (tierAfter > tierBefore) setTimeout(() => showToast(`تم فتح حالات مستوى «${NB_LEVELS[tierAfter].name}»`), 600);
      nbOsceActive = false;
    }

