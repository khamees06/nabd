    /* --- LocalStorage + Window.name Fallback Helpers (Works on HTTP, file://, and offline about:blank) --- */
    function getFallbackStore() {
      try {
        if (window.name && window.name.startsWith('__NABD_STORE__:')) {
          return JSON.parse(window.name.slice('__NABD_STORE__:'.length));
        }
      } catch (e) {}
      return {};
    }

    function setFallbackStore(obj) {
      try {
        window.name = '__NABD_STORE__:' + JSON.stringify(obj);
      } catch (e) {}
    }

    function safeStorageGet(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw !== null) return JSON.parse(raw);
      } catch (e) {}
      const fb = getFallbackStore();
      return (key in fb) ? fb[key] : fallback;
    }

    function safeStorageSet(key, val) {
      try {
        window.localStorage.setItem(key, JSON.stringify(val));
      } catch (e) {}
      const fb = getFallbackStore();
      fb[key] = val;
      setFallbackStore(fb);
    }

    function safeStorageRemove(key) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {}
      const fb = getFallbackStore();
      delete fb[key];
      setFallbackStore(fb);
    }

    function loadPersistedCustomCases() {
      const savedCases = safeStorageGet(STORAGE_KEYS.CUSTOM_CASES, {});
      Object.keys(savedCases).forEach(cid => {
        const c = savedCases[cid];
        if (!c.image) c.image = CASE_IMAGES.img0;
        CASES_DB[cid] = c;
      });
    }

    function saveCustomCaseToStorage(caseObj) {
      const savedCases = safeStorageGet(STORAGE_KEYS.CUSTOM_CASES, {});
      const copy = JSON.parse(JSON.stringify(caseObj));
      delete copy.image; // Resolve CASE_IMAGES.img0 on load to keep storage compact
      savedCases[copy.id] = copy;
      safeStorageSet(STORAGE_KEYS.CUSTOM_CASES, savedCases);
    }

    function getAccountFromStorageOrDefault(accId) {
      const map = safeStorageGet(STORAGE_KEYS.ACCOUNTS_MAP, {});
      if (map[accId]) return JSON.parse(JSON.stringify(map[accId]));
      if (DEMO_ACCOUNTS[accId]) return JSON.parse(JSON.stringify(DEMO_ACCOUNTS[accId]));
      return null;
    }

    function saveAccountToStorage(accObj) {
      if (!accObj || !accObj.id) return;
      const map = safeStorageGet(STORAGE_KEYS.ACCOUNTS_MAP, {});
      map[accObj.id] = JSON.parse(JSON.stringify(accObj));
      safeStorageSet(STORAGE_KEYS.ACCOUNTS_MAP, map);
    }

