  /* ---------- mobile audit 2026-11-07: the phone's back button ----------
     Entering the room adds one history entry. Back then closes the open sheet, or goes home with the case kept
     (its clock stands still while the room is hidden, and entering again resumes it), instead of leaving the site.
     A reload or closing the tab mid-case asks first. Real pages only. */
  let backHooked = false;
  const keepBack = () => { try { history.pushState({ nbER: 1 }, ''); } catch (e) { /* not allowed here */ } };
  function guardBack() {
    if (!window.history || !history.pushState) return;
    if (!backHooked) {
      backHooked = true;
      window.addEventListener('popstate', onBack);
      window.addEventListener('beforeunload', e => { if (E && E.started && !E.over) { e.preventDefault(); e.returnValue = ''; } });
    }
    if (!(history.state && history.state.nbER)) keepBack();
  }
  function onBack() {
    const v = $('view-er');
    if (!v || v.classList.contains('hidden')) return;
    const sheet = $('er-sheet'), rec = $('er-records');
    if (sheet && !sheet.hidden) { sheet.hidden = true; keepBack(); return; }
    if (rec && rec.classList.contains('is-open')) { toggleRecords(false); keepBack(); return; }
    if (typeof navigateTo === 'function') navigateTo('home');
    if (E && !E.over) {
      const t = document.getElementById('calm-toast'), tt = document.getElementById('calm-toast-text');
      if (t && tt) {
        tt.textContent = 'حالتك محفوظة، وساعتها متوقفة حتى تعود. ادخل غرفة الطوارئ لتكملها.';
        t.classList.remove('hidden');
        clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(() => t.classList.add('hidden'), 4500);
      }
    }
  }

