  function briefKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeBrief(); return; }
    // Focus stays inside the dialog: Tab cycles over the role switch (while it can be used) and the start button.
    if (e.key === 'Tab') {
      e.preventDefault();
      const w = $('er-brief'), sw = w ? [...w.querySelectorAll('[data-role]')] : [], go = $('er-brief-go');
      const stops = [...(sw.length ? [sw.find(b => b.getAttribute('aria-checked') === 'true') || sw[0]] : []), go].filter(Boolean);
      const i = stops.indexOf(document.activeElement);
      const next = stops[(i + (e.shiftKey ? stops.length - 1 : 1)) % stops.length] || go;
      if (next) next.focus();
      return;
    }
    // The arrow keys move inside the radio group.
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.target && e.target.dataset && e.target.dataset.role) {
      e.preventDefault();
      setRole(e.target.dataset.role === 'nurse' ? 'doctor' : 'nurse');
      const b = $('er-brief') && $('er-brief').querySelector('[data-role][aria-checked="true"]');
      if (b) b.focus();
    }
  }
  function showBrief() {
    if (!REAL || !E) return false;
    let w = $('er-brief');
    if (!w) {
      w = document.createElement('div');
      w.id = 'er-brief';
      w.className = 'er-sheet er-brief-wrap';
      (document.querySelector('#view-er .er-room') || $('view-er')).appendChild(w);
      w.addEventListener('keydown', briefKey);
    }
    w.innerHTML = briefHtml();
    w.hidden = false;
    if (!E.over) E.paused = true;
    $('er-brief-go').onclick = closeBrief;
    w.querySelectorAll('[data-role]').forEach(b => { b.onclick = () => { const v = b.dataset.role; if (setRole(v)) { const x = $('er-brief').querySelector('[data-role="' + v + '"]'); if (x) x.focus({ preventScroll: true }); } }; });
    const pane = w.querySelector('.er-brief');
    if (pane) pane.scrollTop = 0;
    $('er-brief-go').focus({ preventScroll: true });
    return true;
  }
  function closeBrief() {
    const w = $('er-brief');
    if (w) w.hidden = true;
    if (!E) return;
    E.paused = false;
    if (!E.over && $('er-sheet').hidden) autoFocus($('er-input'));
  }
  const briefOpen = () => { const w = REAL && $('er-brief'); return !!(w && !w.hidden); };

