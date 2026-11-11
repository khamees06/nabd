    function startSimulationSession(caseId, isEmergencyMode = false, goToSim = true, restoreScratchpad = true) {
      if (goToSim && !isEmergencyMode) { navigateTo('home'); return; }
      try { updateSimLevelHint(caseId); nbStartOsce(caseId); } catch (e) {}
      if (goToSim && (!authState.isAuthenticated || !authState.user)) {
        openAuthModal('login', 'يرجى تسجيل الدخول لبدء جلسة المحاكاة.');
        return;
      }

      activeCaseId = caseId;
      isEmergencyRandomMode = isEmergencyMode;
      selectedWorkupCategory = 'all';
      const c = CASES_DB[caseId] || CASES_DB.case_cardio_dm;

      simState = {
        caseData: c,
        startTimeMs: Date.now(),
        emotion: 'worried',
        vitalsMeasured: false,
        vitalsTimestamp: null,
        askedQuestionsLog: [],
        askedIds: new Set(),
        requestedWorkups: [],
        safetyMistakes: [],
        submittedDiagnosis: '',
        submittedSummary: '',
        unjustifiedWorkups: [],
        submittedHandover: '',
        submittedRecipient: 'doctor',
        sbarSubmitted: false,
        sessionCompleted: false
      };

      const savedPad = (restoreScratchpad && authState.user) ? loadScratchpadText(authState.user.id, caseId) : '';
      const padEl = document.getElementById('nurse-scratchpad');
      if (padEl) padEl.value = savedPad;
      const diagInp = document.getElementById('handover-diagnosis-input');
      if (diagInp) diagInp.value = '';
      const sumInp = document.getElementById('handover-summary-input');
      if (sumInp) sumInp.value = '';
      const actInp = document.getElementById('handover-action-input');
      if (actInp) actInp.value = '';

      // Reset Vitals Display
      document.getElementById('sim-v-hr').textContent = '--';
      document.getElementById('sim-v-bp').textContent = '--/--';
      document.getElementById('sim-v-spo2').textContent = '--%';
      document.getElementById('sim-v-temp').textContent = '--.-';
      document.getElementById('sim-vitals-note').textContent = 'اضغط «قياس العلامات الآن» لعرض القراءات.';

      const chatBox = document.getElementById('sim-chat-messages');
      if (chatBox) {
        chatBox.innerHTML = '';
        const firstRowBanner = document.createElement('div');
        firstRowBanner.id = 'sim-inline-patient-card';
        firstRowBanner.className = 'bg-white border border-teal-200/90 rounded-2xl p-3 shadow-2xs space-y-2 transition-all';
        firstRowBanner.innerHTML = `
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2.5 min-w-0">
              <div id="sim-avatar-container" class="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center shrink-0 overflow-hidden"></div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <h1 id="sim-case-heading" class="text-xs sm:text-sm font-bold text-slate-900 truncate">${c.patient.name}</h1>
                  <span id="sim-patient-age-badge" class="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">${c.patient.age} سنة</span>
                  <span id="sim-mode-badge" class="text-xs font-semibold px-2 py-0.5 rounded-full ${isEmergencyMode ? 'bg-sky-50 text-sky-900 border border-sky-200' : 'bg-teal-50 text-teal-800 border border-teal-200/60'}">${isEmergencyMode ? 'حالة طوارئ عشوائية' : 'تدريب تخصصي · ' + c.deptName}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                  <span id="sim-emotion-text">متألم</span>
                  <span>·</span>
                  <span id="sim-evidence-count" class="font-bold text-teal-700 font-num">0 أدلة مسجلة</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <label class="flex items-center gap-1 text-xs font-medium text-slate-600 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                <input type="checkbox" id="sim-tts-toggle" class="rounded text-teal-600 focus:ring-0" />
                <span>نطق صوتي</span>
              </label>
            </div>
          </div>
          <div id="sim-beginner-steps-bar" class="hidden pt-2 border-t border-teal-100 flex items-center justify-between gap-1.5 flex-wrap text-xs">
            <span class="font-bold text-teal-900">دليل خطوات المبتدئين (سنة ١-٢):</span>
            <div class="flex items-center gap-1 flex-wrap">
              <span id="beg-step-1" class="px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-semibold">١. استجوب المريض</span>
              <span class="text-slate-400">←</span>
              <span id="beg-step-2" class="px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-semibold">٢. قس العلامات</span>
              <span class="text-slate-400">←</span>
              <span id="beg-step-3" class="px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-semibold">٣. اطلب الفحوصات وحللها بالشات</span>
              <span class="text-slate-400">←</span>
              <span id="beg-step-4" class="px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-semibold">٤. سلّم SBAR</span>
            </div>
          </div>
          <div id="sim-inline-intro-note" class="text-xs text-teal-900 bg-teal-50/70 border border-teal-200/60 px-3 py-1.5 rounded-xl font-medium">
            ${isEmergencyMode
              ? `حالة طوارئ: التخصص والتشخيص مخفيان حتى تستقصيهما.`
              : `اسأل المريض لتكشف السوابق والحساسية.`}
          </div>
        `;
        chatBox.appendChild(firstRowBanner);
      }

      renderSimAvatar();
      updateSimEvidenceCounter();
      updateBeginnerStepsBar();
      renderSuggestedQuestions();
      renderWorkupCatalog();
      renderRequestedWorkupLog();

      appendSimBubble('patient', c.patient.name, c.patient.initialGreeting);

      switchSimSideTab('vitals');
      if (goToSim) {
        safeStorageSet(STORAGE_KEYS.ACTIVE_SIM, { caseId: caseId, isEmergencyMode: isEmergencyMode, view: 'sim' });
        navigateTo('sim');
      }
    }

