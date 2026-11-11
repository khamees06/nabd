  /* ---------- boot ---------- */
  function boot() {
    document.body.appendChild(progress);
    document.body.appendChild(sweep);
    splitHeroWords();
    heroParallax();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('resize', fitNurseChat, { passive: true });
    onViewChange();

    // Views switch by toggling .hidden; rooms and lists are injected later.
    let pending = false;
    new MutationObserver(list => {
      // Ignore the monitor's own beat/alarm class flips and live heart-rate number.
      if (list.every(m => {
        const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        return el && el.closest('.nb-mon');
      })) return;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        onViewChange();
        fitNurseChat();
        releaseStuck();
        observeReveals();
        observeCounts();
        enhanceMonitors();
      });
    }).observe(document.getElementById('main-container') || document.body, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['class']
    });
  }

  // Loaded with defer after script.js: wait for DOMContentLoaded so the app's
  // own init (session restore, first render) runs before this layer.
  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', boot);
