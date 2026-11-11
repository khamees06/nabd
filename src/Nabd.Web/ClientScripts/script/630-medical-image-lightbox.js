    /* =========================================================================
       5B. MEDICAL IMAGE LIGHTBOX (Zoom 100% - 300% + Quick Note)
       ========================================================================= */
    let activeLightboxZoom = 100;
    let activeLightboxWorkupRef = null;

    function applyLightboxZoom(pct) {
      activeLightboxZoom = Math.max(75, Math.min(350, pct));
      const img = document.getElementById('lightbox-img');
      const badge = document.getElementById('zoom-level-badge');
      if (img) img.style.transform = `scale(${activeLightboxZoom / 100})`;
      if (badge) badge.textContent = `${activeLightboxZoom}%`;
    }

    function openMedicalLightbox(imgSrc, title, workupRef = null) {
      const modal = document.getElementById('medical-image-lightbox');
      const img = document.getElementById('lightbox-img');
      const titleEl = document.getElementById('lightbox-title');
      const noteInp = document.getElementById('lightbox-quick-note');
      if (!modal || !img) return;
      activeLightboxWorkupRef = workupRef;
      img.src = imgSrc;
      if (titleEl) titleEl.textContent = nbBidi(title || 'صورة تشخيصية للتكبير والفحص');
      if (noteInp) noteInp.value = (workupRef && workupRef.studentAnalysis) ? workupRef.studentAnalysis : '';
      applyLightboxZoom(100);
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeMedicalLightbox() {
      const modal = document.getElementById('medical-image-lightbox');
      if (!modal) return;
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

