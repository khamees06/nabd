    /* Login & Logout Actions with Strict Account Isolation */
    function loginWithAccount(accountObj, toastText, targetView = 'home') {
      const stored = getAccountFromStorageOrDefault(accountObj.id) || JSON.parse(JSON.stringify(accountObj));
      authState.isAuthenticated = true;
      authState.user = stored;
      saveAccountToStorage(stored);
      safeStorageSet(STORAGE_KEYS.ACTIVE_USER_ID, stored.id);

      hasCompletedSessionInRun = false;
      simState.sessionCompleted = false;
      simState.sbarSubmitted = false;

      syncAuthShellUI();
      closeAuthModal();
      navigateTo(targetView);
      // phase8 2026-11-07: the welcome toast also says what this role does here
      if (toastText) { let hint = ''; try { hint = nb8RoleHint(stored); } catch (e) {} showToast(hint ? `${toastText} ${hint}` : toastText); }
    }

    // Demo entry for judges: signs in a ready account without registration.
    // Students get a placement matching their year so the level quiz does not
    // interrupt the demo; the professor lands on the university dashboard.
    function nbDemoLogin(id) {
      const acc = DEMO_ACCOUNTS[id];
      if (!acc) return;
      const track = nbTrackOf(acc);
      if (track) {
        const key = NB_PLACEMENT_KEY + '_' + acc.id;
        if (!safeStorageGet(key, null)) {
          const level = nbDerivedLevel(acc);
          safeStorageSet(key, { track, level, pct: parseInt(acc.stats?.avgSpec, 10) || 0, weak: [], rooms: nbPickRooms(level, [], level, track), demo: true, ts: Date.now() });
        }
      }
      loginWithAccount(JSON.parse(JSON.stringify(acc)), `دخول تجريبي: ${acc.name}`, 'home');
    }

    function logoutUser() {
      authState.isAuthenticated = false;
      authState.user = null;
      hasCompletedSessionInRun = false;
      simState.sessionCompleted = false;
      simState.sbarSubmitted = false;
      try {
        safeStorageRemove(STORAGE_KEYS.ACTIVE_USER_ID);
        safeStorageRemove(STORAGE_KEYS.ACTIVE_SIM);
      } catch (e) {}
      closeAccountDropdown();
      closeSidebar();
      syncAuthShellUI();
      navigateTo('index');
      showToast('تم تسجيل الخروج والعودة إلى الصفحة التعريفية العامة.');
    }

    function openAuthModal(defaultTab = 'login', noticeMessage = '', focusSelector = '') {
      closeSidebar();
      closeAccountDropdown();
      const modal = document.getElementById('auth-modal');
      const errBox = document.getElementById('login-error-msg');
      const regErr = document.getElementById('reg-error-msg');
      if (!modal) return;
      if (errBox) {
        if (noticeMessage) {
          errBox.textContent = noticeMessage;
          errBox.classList.remove('hidden');
        } else {
          errBox.classList.add('hidden');
        }
      }
      if (regErr) regErr.classList.add('hidden');
      switchAuthModalTab(defaultTab);
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      // 2026-11-08 (owner: the X "sticks" on phones): the box opens at its top with the page behind it still,
      // and a text field is focused only with a mouse. On a phone the keyboard used to open at once, so the first
      // tap on ✕ only closed the keyboard, the box jumped, and the tap missed.
      const card = modal.querySelector('.nb-auth-simple'), main = modal.querySelector('.nb-auth-main');
      if (card) card.scrollTop = 0;
      if (main) main.scrollTop = 0;
      const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      // The page lock is for touch screens (the page scrolled under the finger); on a desktop it would only make the
      // scrollbar jump.
      if (!finePointer) document.documentElement.classList.add('nb-auth-open');
      window.setTimeout(() => {
        // A focusSelector (e.g. the demo accounts) avoids focusing a text field,
        // so phones do not open the keyboard over the options. On touch, focus goes to the box's title (no keyboard).
        const target = focusSelector
          ? document.querySelector(focusSelector)
          : !finePointer ? document.getElementById('auth-modal-title')
          : defaultTab === 'register' ? document.getElementById('reg-name') : document.getElementById('login-email');
        target?.focus({ preventScroll: !focusSelector });
      }, 0);
    }

    function closeAuthModal() {
      const modal = document.getElementById('auth-modal');
      if (!modal) return;
      if (modal.contains(document.activeElement)) document.activeElement.blur();
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.documentElement.classList.remove('nb-auth-open');
    }


