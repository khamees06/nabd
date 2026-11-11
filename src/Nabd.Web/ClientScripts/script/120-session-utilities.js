    function getScratchpadKey(userId, caseId) {
      return `${userId || 'guest'}__${caseId || 'default'}`;
    }

    function saveScratchpadText(text) {
      if (!authState.user) return;
      const pads = safeStorageGet(STORAGE_KEYS.SCRATCHPADS, {});
      pads[getScratchpadKey(authState.user.id, activeCaseId)] = text;
      safeStorageSet(STORAGE_KEYS.SCRATCHPADS, pads);
    }

    function loadScratchpadText(userId, caseId) {
      const pads = safeStorageGet(STORAGE_KEYS.SCRATCHPADS, {});
      return pads[getScratchpadKey(userId, caseId)] || '';
    }

    /* Utility: Format elapsed session timestamp MM:SS */
    function getSessionTimestamp() {
      if (!simState.startTimeMs) return '00:01';
      const elapsedSec = Math.max(1, Math.floor((Date.now() - simState.startTimeMs) / 1000));
      const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const secs = String(elapsedSec % 60).padStart(2, '0');
      return `${mins}:${secs}`;
    }

    
    function showToast(msg) {
      const el = document.getElementById('calm-toast');
      const txt = document.getElementById('calm-toast-text');
      if (!el || !txt) return;
      txt.textContent = msg;
      el.classList.remove('hidden');
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => el.classList.add('hidden'), 4500);
    }

    function getRoleArabicName(roleCode) {
      if (roleCode === 'professor' || roleCode === 'doctor') return 'أستاذ جامعي';
      if (roleCode === 'practitioner') return 'ممارس صحي';
      return 'طالب جامعي';
    }

