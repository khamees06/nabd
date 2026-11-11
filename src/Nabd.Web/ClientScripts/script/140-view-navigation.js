    /* Protected Navigation Guard */
    function navigateTo(viewId, options = {}) {
      if (REMOVED_VIEWS.has(viewId)) { viewId = 'home'; options = {}; }
      const isAuth = Boolean(authState.isAuthenticated && authState.user);

      if (PROTECTED_VIEWS.has(viewId) && !isAuth) {
        currentView = 'index';
        showOnlySection('index');
        closeSidebar();
        openAuthModal('login', 'يرجى تسجيل الدخول للوصول إلى مساحة التدريب السريري.');
        try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
        return false;
      }

      currentView = viewId;
      showOnlySection(viewId);
      // phase8 2026-11-07: assignments and notes may have changed since sign-in (same device, other account)
      if ((viewId === 'university' || viewId === 'home') && authState.user) { try { nb8RenderAcademic(authState.user); } catch (e) { console.error(e); } }

      document.querySelectorAll('.app-nav-btn').forEach(btn => {
        const bView = btn.getAttribute('data-app-view');
        const isActive = bView === viewId && !options.scrollToCases;
        btn.classList.toggle('active', isActive);
      });

      if (viewId === 'coach') {
        renderInteractiveCoachView();
      }

      // Handle Debrief: ONLY show report if SBAR was submitted in the current session!
      if (viewId === 'debrief') {
        if (window.nbErReport && window.nbErReport()) return;
        const emptyEl = document.getElementById('debrief-empty-state');
        const repEl = document.getElementById('debrief-report-content');
        if (hasCompletedSessionInRun && simState.sessionCompleted && simState.sbarSubmitted) {
          emptyEl?.classList.add('hidden');
          repEl?.classList.remove('hidden');
        } else {
          emptyEl?.classList.remove('hidden');
          repEl?.classList.add('hidden');
        }
      }

      closeSidebar();
      closeAccountDropdown();

      if (options.scrollToCases && viewId === 'home') {
        setTimeout(() => {
          const ca = document.getElementById('home-cases-anchor');
          const anchor = (ca && ca.classList.contains('hidden')) ? document.getElementById('home-nurse') : ca;
          if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      } else if (viewId === 'sim') {
        window.scrollTo({ top: 0, behavior: 'auto' });
        const chatInput = document.getElementById('sim-chat-input');
        if (chatInput && window.innerWidth >= 1024) chatInput.focus();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      return true;
    }

    function showOnlySection(viewId) {
      ['index', 'home', 'sim', 'debrief', 'coach', 'profile', 'university', 'observe', 'nurse', 'resp', 'er'].forEach(v => {
        const sec = document.getElementById('view-' + v);
        if (sec) sec.classList.toggle('hidden', v !== viewId);
      });
      const footer = document.getElementById('site-footer');
      if (footer) footer.classList.toggle('hidden', viewId === 'sim' || viewId === 'nurse' || viewId === 'observe' || viewId === 'resp' || viewId === 'er');
      if (viewId === 'profile' && authState.user) { try { renderProfileView(); } catch (e) { console.error(e); } }
    }

