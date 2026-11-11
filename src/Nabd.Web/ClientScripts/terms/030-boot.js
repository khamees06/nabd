  function boot() {
    // The old switch saved a choice; English is the only mode now, so the saved key is dropped.
    try { localStorage.removeItem('nabd_terms_lang'); } catch (e) { /* storage blocked */ }
    document.documentElement.dataset.terms = 'en';
    walk(document.body);
    // Views and rooms are rendered on the fly: translate new text as it appears.
    new MutationObserver(list => {
      list.forEach(m => {
        if (m.type === 'characterData') { translate(m.target); return; }
        m.addedNodes.forEach(n => { if (n.nodeType === 1 || n.nodeType === 3) walk(n); });
      });
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', boot);
