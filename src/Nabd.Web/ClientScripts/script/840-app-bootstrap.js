    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', initNabdApp);
    } else {
      initNabdApp();
    }
  
