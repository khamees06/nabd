    function nbCaseObj(id) { return CASES_DB[id] || NB_NURSE_CASES[id] || null; }
    function nbTrackOf(u) {
      if (!u || u.role === 'professor') return null;
      if (u.track) return u.track;
      if (u.role === 'practitioner') return 'nursing';
      return /^الطب/.test(u.specialty || '') ? 'medicine' : 'nursing';
    }
    function nbLearn(u) { u.learn = u.learn || { obs: [], guided: [] }; return u.learn; }
    function nbNeedsLearning(u) {
      if (!u || u.role === 'professor') return false;
      if (nbBaseTier(u) !== 1) return false;
      const l = nbLearn(u);
      return !(l.obs.length >= 2 && l.guided.length >= 1);
    }
    function nbGuidedId(u) { return nbTrackOf(u) === 'nursing' ? 'nc_vitals_basic' : NB_MED_GUIDED_ID; }
    function nbDemosFor(u) { return Object.values(NB_DEMOS).filter(d => d.track === nbTrackOf(u)); }

