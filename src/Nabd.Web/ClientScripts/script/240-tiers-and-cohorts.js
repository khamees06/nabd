    /* ===== Phase 1c: unlock tiers, OSCE, retry, retake, mistakes, notes, cohorts ===== */
    const NB_HIST_KEY = 'nabd_placement_hist';
    const NB_COMMENTS_KEY = 'nabd_comments_v1';
    const NB_COHORTS = {
      'NUR-JU-2026': { uni: 'الجامعة الأردنية', name: 'شعبة التمريض السريري' },
      'MED-JUST-2026': { uni: 'جامعة العلوم والتكنولوجيا الأردنية', name: 'شعبة الطب السريري' },
      'NUR-MEU-2026': { uni: 'جامعة الشرق الأوسط', name: 'شعبة التمريض' }
    };
    let nbQHost = 'nb-quiz-main', nbQModal = false, nbOsceTimer = null, nbOsceActive = false;

    function nbHost() { return document.getElementById(nbQHost); }
    function nbCohortFor(code) {
      const c = (code || '').trim().toUpperCase();
      return NB_COHORTS[c] ? Object.assign({ code: c }, NB_COHORTS[c]) : null;
    }
    function nbTier(c) { return { 'سهل': 1, 'متوسط': 2, 'متقدم': 3 }[c.levelLabel] || 2; }
    function nbBaseTier(u) {
      if (u && u.role === 'professor') return 3;
      const pl = nbGetPlacement();
      return pl ? pl.level : nbDerivedLevel(u || { role: 'student', year: 1 });
    }
    function nbUnlockedTier(u, hist) {
      let t = nbBaseTier(u);
      (hist || (u && u.history) || []).forEach(h => {
        if (h && h.caseId && h.passed && h.num >= 70 && nbCaseObj(h.caseId)) t = Math.max(t, Math.min(3, nbTier(nbCaseObj(h.caseId)) + 1));
      });
      return t;
    }
    function nbLockInfo(c) {
      const u = authState && authState.user;
      if (!u) return null;
      const need = nbTier(c), have = nbUnlockedTier(u);
      if (need <= have) return null;
      return `الحالة مقفلة: اجتز حالة من مستوى «${NB_LEVELS[need - 1].name}» بدرجة 70% أو أكثر لفتحها.`;
    }

