    /* =========================================================================
       5. SIMULATION ENGINE (Direct Under-Header Chat + Interactive Lab/Imaging)
       ========================================================================= */
    function updateSimEvidenceCounter() {
      const el = document.getElementById('sim-evidence-count');
      if (!el) return;
      const count = simState.askedQuestionsLog.length + (simState.vitalsMeasured ? 1 : 0) + simState.requestedWorkups.length;
      el.textContent = `${count} أدلة مسجلة`;
    }

    function updateBeginnerStepsBar() {
      const bar = document.getElementById('sim-beginner-steps-bar');
      if (!bar) return;
      const u = authState.user;
      const isBeginner = Boolean(u && u.role === 'student' && (Number(u.year) === 1 || Number(u.year) === 2));
      bar.classList.toggle('hidden', !isBeginner);
      if (!isBeginner) return;

      const setStepStyle = (elId, done) => {
        const el = document.getElementById(elId);
        if (!el) return;
        el.className = done
          ? 'px-2 py-0.5 rounded-lg border border-emerald-300 bg-emerald-100 text-emerald-900 font-bold transition-all'
          : 'px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-semibold transition-all';
      };
      setStepStyle('beg-step-1', simState.askedQuestionsLog.length > 0);
      setStepStyle('beg-step-2', simState.vitalsMeasured);
      setStepStyle('beg-step-3', simState.requestedWorkups.length > 0);
      setStepStyle('beg-step-4', simState.sbarSubmitted);
    }

    function hideInlinePatientBannerOnContinue() {
      const banner = document.getElementById('sim-inline-patient-card');
      if (banner && !banner.classList.contains('hidden')) {
        banner.classList.add('hidden');
      }
    }

