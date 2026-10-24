/* =========================================================================
   NABD v7 — small UI glue for the redesigned drawer.
   The drawer shows who is signed in and which page is open. It reads what
   script.js already writes into the header, so no app logic changes here.
   ========================================================================= */
(function () {
  'use strict';

  function signedIn() {
    const h = document.getElementById('app-header');
    return !!h && !h.classList.contains('hidden');
  }

  function syncUser() {
    const av = document.getElementById('side-user-av');
    const name = document.getElementById('side-user-name');
    if (!av || !name) return;
    if (signedIn()) {
      const full = (document.getElementById('dropdown-user-name')?.textContent || '').trim();
      const initials = (document.getElementById('user-avatar-fallback')?.textContent || '').trim();
      name.textContent = full || 'حسابي';
      av.textContent = initials || full.charAt(0) || 'ن';
    } else {
      name.textContent = 'نَبْض الأردن';
      av.textContent = 'ن';
    }
  }

  function markCurrent() {
    const open = [...document.querySelectorAll('#main-container > section')].find(s => !s.classList.contains('hidden'));
    const id = open ? open.id : '';
    document.querySelectorAll('#app-sidebar [data-v7-view]').forEach(b => {
      b.classList.toggle('is-current', b.dataset.v7View === id);
    });
  }

  function onOpen() { syncUser(); markCurrent(); }

  function boot() {
    ['app-open-sidebar-btn', 'public-open-sidebar-btn'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', onOpen);
    });
    // The name and role arrive after sign-in; keep the card in step.
    const src = document.getElementById('dropdown-user-name');
    if (src) new MutationObserver(syncUser).observe(src, { childList: true, characterData: true, subtree: true });
    // Signing out swaps the headers: reset the card to the guest view.
    const appHeader = document.getElementById('app-header');
    if (appHeader) new MutationObserver(syncUser).observe(appHeader, { attributes: true, attributeFilter: ['class'] });
    onOpen();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
