    /* =========================================================================
       8. INITIALIZATION & COMPLETE EVENT LISTENERS
       ========================================================================= */
    /* =========================================================================
       phase8 2026-11-07: ACADEMIC SECTION
       Role guidance on the student home, ER case assignment by section, the
       student side of the portal, student progress and the academic advisor.
       Built only on data the app already holds (getProfCohortList(),
       NB_COHORTS, NB_COMMENTS_KEY, data/er-cases.json, the user's own ER
       history) plus two localStorage keys: 'nabd_v2_assignments' and
       'nabd_v2_advisor'. Nothing here is shared between devices.
       Plain function declarations and `var` so nothing hits a TDZ if a render
       runs early.
       ========================================================================= */
    var nb8CasesCache = null, nb8CasesLoading = null;
    function nb8Keys() { return { assign: 'nabd_v2_assignments', advisor: 'nabd_v2_advisor', tab: 'nb8_prof_tab' }; }
    function nb8Esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
    function nb8IsProf(u) { return !!u && (u.role === 'professor' || u.role === 'doctor'); }
    function nb8Count(n) { return n === 1 ? 'طالب واحد' : n === 2 ? 'طالبان' : (n >= 3 && n <= 10) ? `${n} طلاب` : `${n} طالباً`; }
    function nb8FmtDate(iso) {
      try { const d = new Date(iso + 'T00:00:00'); return isNaN(d) ? String(iso) : d.toLocaleDateString('ar-JO', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return String(iso); }
    }
    // The course codes the page already printed (NUR-402, NUR-405, MED-410), each with one section from NB_COHORTS.
    function nb8Courses() {
      return [
        { course: 'NUR-402', track: 'nursing', section: 'NUR-JU-2026' },
        { course: 'NUR-405', track: 'nursing', section: 'NUR-MEU-2026' },
        { course: 'MED-410', track: 'medicine', section: 'MED-JUST-2026' }
      ];
    }
    function nb8StuTrack(stu) { return /الطب/.test((stu && stu.specialty) || '') ? 'medicine' : 'nursing'; }
    // Demo cohort records carry no section; they sit in the first section of their track.
    function nb8StuSection(stu) { return (stu && stu.section) || (nb8StuTrack(stu) === 'medicine' ? 'MED-JUST-2026' : 'NUR-JU-2026'); }
    function nb8UserSection(u) {
      if (!u) return null;
      if (u.cohort && NB_COHORTS[u.cohort]) return u.cohort;
      return ({ rana: 'NUR-JU-2026', med_student: 'MED-JUST-2026' })[u.id] || null; // demo accounts only
    }
    function nb8LocalStudents() {
      const map = safeStorageGet(STORAGE_KEYS.ACCOUNTS_MAP, {}) || {};
      return Object.values(map).filter(a => a && !a.isDemo && a.role === 'student' && a.cohort);
    }
    // phase8 2026-11-07 (review): drop malformed entries so a damaged store never breaks the home page.
    function nb8GetAssignments() { const a = safeStorageGet(nb8Keys().assign, []); return Array.isArray(a) ? a.filter(x => x && typeof x === 'object' && typeof x.caseId === 'string' && typeof x.section === 'string') : []; }
    function nb8SaveAssignments(list) { safeStorageSet(nb8Keys().assign, list); }
    function nb8GetAdvisor() { const a = safeStorageGet(nb8Keys().advisor, {}); return (a && typeof a === 'object' && !Array.isArray(a)) ? a : {}; }

    // ER cases: reuse what er.js already loaded, otherwise fetch the same file once.
    function nb8LoadErCases() {
      if (nb8CasesCache) return Promise.resolve(nb8CasesCache);
      try { const D = window.__nbER && window.__nbER.D; if (D && Array.isArray(D.cases)) { nb8CasesCache = D.cases; return Promise.resolve(nb8CasesCache); } } catch (e) {}
      if (!nb8CasesLoading) {
        nb8CasesLoading = fetch('data/er-cases.json')
          .then(r => { if (!r.ok) throw new Error('cases'); return r.json(); })
          .then(j => { nb8CasesCache = Array.isArray(j.cases) ? j.cases : []; return nb8CasesCache; })
          .catch(e => { nb8CasesLoading = null; throw e; });
      }
      return nb8CasesLoading;
    }
    // Neutral label for students: bed + patient + the arrival line. Never the diagnosis.
    function nb8CaseLabel(c) {
      if (!c) return { title: 'حالة من غرفة الطوارئ', line: '' };
      const p = c.patient || {};
      const who = p.name ? `${p.name}${p.age ? '، ' + p.age + ' سنة' : ''}` : '';
      return { title: [c.bed, who].filter(Boolean).join(' · ') || 'حالة من غرفة الطوارئ', line: p.arrival || '' };
    }
    function nb8AssignDone(u, a) {
      // mobile audit 2026-11-07: a nurse-role run of the case (er_<id>_n) counts too, so a nursing class can finish it.
      return ((u && u.history) || []).find(h => h && (h.caseId === 'er_' + a.caseId || h.caseId === 'er_' + a.caseId + '_n') && (h.ts || 0) >= (a.ts || 0)) || null;
    }

    // Opens the ER room on the assigned case: er.js open() reads ?case= when it starts a new case.
    async function nb8OpenAssignedCase(caseId) {
      if (!authState.isAuthenticated || !authState.user) { openAuthModal('login', 'يرجى تسجيل الدخول أولاً لدخول غرفة الطوارئ.'); return; }
      if (typeof window.nbOpenER !== 'function') { showToast('غرفة الطوارئ لم تُحمَّل بعد. حاول بعد لحظة.'); return; }
      const hash = location.hash || '';
      const setCase = (id) => {
        try {
          const q = new URLSearchParams(location.search);
          if (id) q.set('case', id); else q.delete('case');
          const qs = q.toString();
          history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : '') + hash);
        } catch (e) {}
      };
      setCase(caseId);
      try { await window.nbOpenER(); } catch (e) { console.error(e); } finally { setCase(null); }
      try {
        const E = window.__nbER && window.__nbER.E;
        if (E && E.c && E.c.id !== caseId && !E.over) showToast('لديك حالة جارية في الغرفة. أنهِها أولاً، ثم افتح الواجب من جديد.');
      } catch (e) {}
    }

