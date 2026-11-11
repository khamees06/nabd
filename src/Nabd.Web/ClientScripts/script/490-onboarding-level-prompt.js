    function nbMaybeOnboard(u) {
      return;
      if (!u || u.role === 'professor') return;
      if (nbGetPlacement()) return;
      const guest = safeStorageGet(NB_PLACEMENT_KEY, null);
      if (guest) { safeStorageSet(nbPlacementKey(), guest); if (!u.track && guest.track) { u.track = guest.track; saveAccountToStorage(u); } return; }
      if (window.__nbOnboarded === u.id) return;
      window.__nbOnboarded = u.id;
      setTimeout(() => { if (authState.user && authState.user.id === u.id && !nbGetPlacement()) nbOpenLevelModal({ onboard: true, u }); }, 120);
    }
