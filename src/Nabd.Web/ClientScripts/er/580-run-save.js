  function save(s, passed, end) {
    try {
      const u = typeof authState !== 'undefined' && authState.user;
      if (!u) return;
      u.history = u.history || [];
      // nurse mode 2026-11-07: a nurse run is its own entry (er_<id>_n). Averages are kept per role (owner's choice):
      // avgErDoctor / avgErNurse, and avgEr (shown on home, profile, certificate) is the user's own track's role.
      const nm = NM();
      u.history.unshift({ caseTitle: (nm ? 'غرفة الطوارئ (دور التمريض) · ' : 'غرفة الطوارئ · ') + E.c.dx.ar, mode: 'غرفة الطوارئ', correct: nm ? !!passed : !!(end && end.grade.dx === 'right'), workupCount: Object.keys(E.tests).length,
        questions: E.facts.size, score: `${s.total}% (${passed ? 'مجتاز' : 'غير مجتاز'})`, caseId: 'er_' + E.c.id + (nm ? '_n' : ''), num: s.total, passed, ts: Date.now(), date: new Date().toISOString().slice(0, 10) });
      u.stats = u.stats || {};
      u.stats.completed = u.history.length;
      const avgOf = runs => runs.length ? Math.round(runs.reduce((a, h) => a + (h.num || 0), 0) / runs.length) + '%' : '';
      const erRuns = u.history.filter(h => /^er_/.test(h.caseId || ''));
      const docAvg = avgOf(erRuns.filter(h => !/_n$/.test(h.caseId))), nurAvg = avgOf(erRuns.filter(h => /_n$/.test(h.caseId)));
      if (docAvg) u.stats.avgErDoctor = docAvg; else delete u.stats.avgErDoctor;
      if (nurAvg) u.stats.avgErNurse = nurAvg; else delete u.stats.avgErNurse;
      const nursingTrack = typeof nbTrackOf === 'function' && nbTrackOf(u) === 'nursing';
      u.stats.avgEr = (nursingTrack ? nurAvg || docAvg : docAvg || nurAvg) || avgOf(erRuns);
      if (typeof saveAccountToStorage === 'function') saveAccountToStorage(u);
      if (typeof renderHomePath === 'function') renderHomePath(u);
    } catch (e) { console.error(e); }
  }

