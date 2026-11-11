
  /* ---------- 4. scroll progress + a sweep on every view change ---------- */
  const progress = document.createElement('div');
  progress.className = 'nb-progress';
  progress.setAttribute('aria-hidden', 'true');
  const sweep = document.createElement('div');
  sweep.className = 'nb-sweep';
  sweep.setAttribute('aria-hidden', 'true');

  let scrollTick = false;
  function onScroll() {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      scrollTick = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      releaseStuck();
    });
  }

  let currentView = '';
  function visibleView() {
    const s = [...document.querySelectorAll('#main-container > section')].find(x => !x.classList.contains('hidden'));
    return s ? s.id : '';
  }
  function onViewChange() {
    const v = visibleView();
    if (v === currentView) return;
    const first = !currentView;
    currentView = v;
    if (!first && !reduceMotion) {
      sweep.classList.remove('is-on');
      void sweep.offsetWidth;
      sweep.classList.add('is-on');
    }
    requestAnimationFrame(() => { releaseStuck(); observeReveals(); observeCounts(); enhanceMonitors(); });
  }

  /* ---------- nursing room on phones: chat fills the space left on screen ----------
     The stylesheet gives the chat 80dvh below a title block of varying height,
     which pushed the message box under the bottom edge. */
  function fitNurseChat() {
    const chat = document.querySelector('#view-nurse:not(.hidden) .nr2-chat');
    if (!chat) return;
    if (window.innerWidth >= 1024) { chat.style.height = ''; return; }
    const top = chat.getBoundingClientRect().top + window.scrollY;
    chat.style.height = Math.max(380, window.innerHeight - top - 12) + 'px';
  }

  /* ---------- 5. hero parallax on pointer move ---------- */
  function heroParallax() {
    const hero = document.querySelector('#view-index .nb-hero');
    if (!hero || reduceMotion || !finePointer) return;
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      hero.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--px', '0');
      hero.style.setProperty('--py', '0');
    });
  }

