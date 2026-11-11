    function nbPickRooms(level, weak, tier, track) {
      const maxT = tier || level;
      const pool = track === 'nursing' ? Object.values(NB_NURSE_CASES).filter(c => !c.guided) : Object.values(CASES_DB);
      const ids = [];
      const want = { 1: 'سهل', 2: 'متوسط', 3: 'متقدم' }[level];
      if (track !== 'nursing') weak.forEach(t => (NB_TOPIC_ROOMS[t] || []).forEach(id => { if (CASES_DB[id] && nbTier(CASES_DB[id]) <= maxT && !ids.includes(id)) ids.push(id); }));
      if (track === 'nursing') {
        const map = { safety: ['nc_chest', 'nc_wound'], wound: ['nc_wound'], hypo: ['nc_hypo'], iv: ['nc_iv'], emergency: ['nc_sepsis', 'nc_chest'], handover: ['nc_vitals_basic'], role: ['nc_chest'] };
        weak.forEach(t => (map[t] || []).forEach(id => { const c = NB_NURSE_CASES[id]; if (c && !c.guided && nbTier(c) <= maxT && !ids.includes(id)) ids.push(id); }));
      }
      pool.forEach(c => { if (c.levelLabel === want && nbTier(c) <= maxT && !ids.includes(c.id)) ids.push(c.id); });
      pool.forEach(c => { if (nbTier(c) <= maxT && !ids.includes(c.id)) ids.push(c.id); });
      return ids.slice(0, 3);
    }


    /* ===== Smart recommendations + case filters ===== */
    const NB_WEAK_MAP_N = { safety: ['nc_chest', 'nc_iv', 'nc_sugar'], wound: ['nc_wound', 'nc_bleed'], hypo: ['nc_hypo', 'nc_sugar'], iv: ['nc_iv'], emergency: ['nc_sepsis', 'nc_chest', 'nc_fever'], handover: ['nc_vitals_basic', 'nc_bp'], role: ['nc_bp', 'nc_fever'] };
    function nbPoolFor(u) {
      return nbTrackOf(u) === 'nursing' ? Object.values(NB_NURSE_CASES).filter(c => !c.guided) : Object.values(CASES_DB).filter(c => c.id !== NB_MED_GUIDED_ID);
    }
    function nbBestMap(u) {
      const best = {}; (u.history || []).forEach(h => { if (h.caseId && typeof h.num === 'number') best[h.caseId] = Math.max(best[h.caseId] == null ? -1 : best[h.caseId], h.num); });
      return best;
    }
    function nbRecommend(u) {
      const pool = nbPoolFor(u), best = nbBestMap(u), tier = nbUnlockedTier(u);
      const open = pool.filter(c => nbTier(c) <= tier);
      const recs = [], add = (c, kind, why) => { if (c && recs.length < 3 && !recs.some(r => r.id === c.id)) recs.push({ id: c.id, kind, why }); };
      // 1) needs practice: attempted but below 70
      open.filter(c => best[c.id] != null && best[c.id] < 70).sort((a, b) => best[a.id] - best[b.id])
        .forEach(c => add(c, 'practice', `آخر أفضل نتيجة ${best[c.id]}% في «${c.deptName}». أعدها لتثبّت المهارة.`));
      // 2) progress: strong departments -> next tier
      const byDept = {}; open.forEach(c => { if (best[c.id] != null) (byDept[c.deptName] = byDept[c.deptName] || []).push(best[c.id]); });
      Object.keys(byDept).filter(d => byDept[d].reduce((a, b) => a + b, 0) / byDept[d].length >= 85).forEach(d => {
        const cur = Math.max(...open.filter(c => c.deptName === d && best[c.id] != null).map(nbTier));
        const nxt = open.filter(c => best[c.id] == null && nbTier(c) > cur).sort((a, b) => nbTier(a) - nbTier(b) || (a.deptName === d ? -1 : 1))[0]
          || open.filter(c => best[c.id] == null).sort((a, b) => nbTier(b) - nbTier(a))[0];
        if (nxt) add(nxt, 'next', `أتقنت «${d}» (${Math.round(byDept[d].reduce((a, b) => a + b, 0) / byDept[d].length)}%). انتقل لمستوى أعلى.`);
      });
      // 3) weak topics from the placement quiz
      const pl = nbGetPlacement();
      if (pl && pl.weak) pl.weak.forEach(t => {
        const ids = nbTrackOf(u) === 'nursing' ? (NB_WEAK_MAP_N[t] || []) : (NB_TOPIC_ROOMS[t] || []);
        ids.map(nbCaseObj).filter(c => c && !c.guided && nbTier(c) <= tier && best[c.id] == null).forEach(c => add(c, 'weak', `ضعف ظهر في اختبار المستوى: ${NB_TOPIC_NAMES[t] || t}.`));
      });
      // 4) new at your level
      open.filter(c => best[c.id] == null).sort((a, b) => nbTier(a) - nbTier(b)).forEach(c => add(c, 'new', 'حالة جديدة مناسبة لمستواك.'));
      // 5) refresh passed cases
      open.filter(c => best[c.id] != null).sort((a, b) => best[a.id] - best[b.id]).forEach(c => add(c, 'practice', `راجعها وارفع نتيجتك (${best[c.id]}%).`));
      const locked = pool.filter(c => nbTier(c) > tier).sort((a, b) => nbTier(a) - nbTier(b))[0];
      return { recs, goal: locked ? `لفتح «${locked.title}» اجتز حالة من مستوى «${NB_LEVELS[nbTier(locked) - 1].name}» بدرجة 70% أو أكثر.` : '' };
    }
