    /* =========================================================================
       7B. INTERACTIVE AI CLINICAL COACH (#view-coach)
       ========================================================================= */
    let coachRuntime = {
      activeIdx: 0,
      masteredIds: new Set()
    };

    function getCoachMasteredSet() {
      const uid = (authState.user && authState.user.id) ? authState.user.id : 'guest';
      const map = safeStorageGet('nabd_v2_coach_mastered', {});
      return new Set(map[uid] || []);
    }

    function saveCoachMasteredSet(setObj) {
      const uid = (authState.user && authState.user.id) ? authState.user.id : 'guest';
      const map = safeStorageGet('nabd_v2_coach_mastered', {});
      map[uid] = Array.from(setObj);
      safeStorageSet('nabd_v2_coach_mastered', map);
    }

