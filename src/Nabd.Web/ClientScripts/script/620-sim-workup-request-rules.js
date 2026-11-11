    function requestWorkupItem(wid) {
      const c = simState.caseData;
      const baseItem = GENERAL_WORKUP_CATALOG.find(w => w.id === wid);
      if (!baseItem || !c) return;

      const override = (c.workupOverrides && c.workupOverrides[wid]) ? c.workupOverrides[wid] : null;
      const timestamp = getSessionTimestamp();

      // Rule A: Ordering medication / antibiotic / analgesic or contrast without asking about allergy first (or when contraindicated by allergy)
      const askedAllergy = Array.from(simState.askedIds).some(id => id.includes('allergy'));
      if (wid === 'w_admin_med' || (wid === 'w_ct_contrast' && c.questions.some(q => q.id.includes('allergy')))) {
        if (!askedAllergy) {
          const vMsg = `خطأ سلامة (-15): طلبت (${baseItem.title}) قبل أن تسأل عن الحساسية الدوائية.`;
          if (!simState.safetyMistakes.includes(vMsg)) simState.safetyMistakes.push(vMsg);
          showToast(vMsg);
          const entry = {
            id: wid,
            title: baseItem.title,
            timestamp: timestamp,
            resultTitle: 'خطأ سلامة دوائية: إغفال السؤال عن الحساسية قبل الإعطاء',
            resultText: vMsg,
            isViolation: true,
            isExpected: false,
            isImaging: false,
            labRows: [{ param: 'Allergy Check Status', val: 'FAILED (لم يُسأل المريض عن الحساسية)', unit: '-', ref: 'Mandatory pre-check' }]
          };
          const existingIdx = simState.requestedWorkups.findIndex(r => r.id === wid);
          if (existingIdx >= 0) simState.requestedWorkups[existingIdx] = entry;
          else simState.requestedWorkups.unshift(entry);
          appendWorkupChatCard(entry);
          updateSimEvidenceCounter();
          updateBeginnerStepsBar();
          renderWorkupCatalog();
          renderRequestedWorkupLog();
          return;
        } else if (wid === 'w_admin_med') {
          const vMsg = `تنبيه سلامة دوائية (نقطة محتسبة ضدك): طلبت إعطاء دواء (${baseItem.title}) يتعارض مع حساسية المريض أو موانع الاستعمال المسجلة. احتُسبت النقطة ضدك.`;
          if (!simState.safetyMistakes.includes(vMsg)) simState.safetyMistakes.push(vMsg);
          showToast(vMsg);
          const entry = {
            id: wid,
            title: baseItem.title,
            timestamp: timestamp,
            resultTitle: 'خطأ سلامة دوائية: إعطاء دواء يتحسس منه المريض',
            resultText: vMsg,
            isViolation: true,
            isExpected: false,
            isImaging: false,
            labRows: [{ param: 'Contraindication / Allergy', val: 'حساسية دوائية مسجلة', unit: '-', ref: 'Do Not Administer' }]
          };
          const existingIdx = simState.requestedWorkups.findIndex(r => r.id === wid);
          if (existingIdx >= 0) simState.requestedWorkups[existingIdx] = entry;
          else simState.requestedWorkups.unshift(entry);
          appendWorkupChatCard(entry);
          updateSimEvidenceCounter();
          updateBeginnerStepsBar();
          renderWorkupCatalog();
          renderRequestedWorkupLog();
          return;
        }
      }

      // Rule B: Ordering X-Ray or CT scan for ANY female patient of childbearing age without asking about pregnancy / menstrual period first
      const isFemaleChildbearing = (c.patient.gender === 'female' && c.patient.age >= 12 && c.patient.age <= 50);
      const isRadiationImaging = (wid === 'w_xray_limb_chest' || wid === 'w_ct_contrast');
      const askedPregnancyOrMenses = Array.from(simState.askedIds).some(id => id.includes('preg') || id.includes('menses') || id.includes('fetal'));
      if (isFemaleChildbearing && isRadiationImaging && !askedPregnancyOrMenses && c.id !== 'case_obgyn_anemia') {
        const vMsg = `تنبيه سلامة إشعاعية (نقطة محتسبة ضدك): طلبت صورة إشعاعية (${baseItem.title}) لامرأة في سن الإنجاب (${c.patient.name}، ${c.patient.age} سنة) دون أن تسألها مسبقاً هل هي حامل أو عن موعد الدورة الشهرية! تم احتساب هذه النقطة ضدك في نقاط الضعف.`;
        if (!simState.safetyMistakes.includes(vMsg)) simState.safetyMistakes.push(vMsg);
        showToast(vMsg);
        const entry = {
          id: wid,
          title: baseItem.title,
          timestamp: timestamp,
          resultTitle: 'خطأ حماية إشعاعية: طلب صورة لامرأة دون سؤالها عن الحمل/الدورة',
          resultText: vMsg,
          isViolation: true,
          isExpected: false,
          isImaging: false,
          labRows: [{ param: 'Pregnancy / LMP Screening', val: 'NOT ASKED (لم تُسأل المريضة عن الحمل)', unit: '-', ref: 'Mandatory before X-Ray/CT' }]
        };
        const existingIdx = simState.requestedWorkups.findIndex(r => r.id === wid);
        if (existingIdx >= 0) simState.requestedWorkups[existingIdx] = entry;
        else simState.requestedWorkups.unshift(entry);
        appendWorkupChatCard(entry);
        updateSimEvidenceCounter();
        updateBeginnerStepsBar();
        renderWorkupCatalog();
        renderRequestedWorkupLog();
        return;
      }

      if (override && override.requiresQuestion && !simState.askedIds.has(override.requiresQuestion)) {
        const vMsg = override.violationMsg;
        if (!simState.safetyMistakes.includes(vMsg)) {
          simState.safetyMistakes.push(vMsg);
        }
        showToast(vMsg);

        const entry = {
          id: wid,
          title: baseItem.title,
          timestamp: timestamp,
          resultTitle: 'تنبيه سلامة المريض قبل إجراء الفحص',
          resultText: vMsg,
          isViolation: true,
          isExpected: false,
          isImaging: false,
          labRows: override.labRows || []
        };
        const existingIdx = simState.requestedWorkups.findIndex(r => r.id === wid);
        if (existingIdx >= 0) simState.requestedWorkups[existingIdx] = entry;
        else simState.requestedWorkups.unshift(entry);

        appendWorkupChatCard(entry);
        updateSimEvidenceCounter();
        updateBeginnerStepsBar();
        renderWorkupCatalog();
        renderRequestedWorkupLog();
        return;
      }

      const resultTitle = override && override.resultTitle ? override.resultTitle : baseItem.defaultResultTitle;
      const resultText = override && override.resultText ? override.resultText : baseItem.defaultResultText;
      const labRows = override && override.labRows ? override.labRows : (baseItem.defaultLabRows || []);
      const isImaging = Boolean((override && override.isImaging) || baseItem.isImaging);
      const imageKey = (override && override.imageKey) ? override.imageKey : baseItem.imageKey;
      const isExpected = (c.expectedWorkupIds || []).includes(wid);

      let entry = simState.requestedWorkups.find(r => r.id === wid && !r.isViolation);
      if (!entry) {
        entry = {
          id: wid,
          title: baseItem.title,
          timestamp: timestamp,
          resultTitle: resultTitle,
          resultText: resultText,
          labRows: labRows,
          isImaging: isImaging,
          imageKey: imageKey,
          isViolation: false,
          isExpected: isExpected,
          studentAnalysis: '',
          studentJustification: '',
          justificationEvaluated: false,
          isScientificallyJustified: false
        };
        simState.requestedWorkups.unshift(entry);
        appendWorkupChatCard(entry);
      } else {
        showToast('تم إرسال نتيجة هذا الفحص مسبقاً في الشات.');
      }

      updateSimEvidenceCounter();
      updateBeginnerStepsBar();
      renderWorkupCatalog();
      renderRequestedWorkupLog();
    }

    function renderRequestedWorkupLog() {
      const statusEl = document.getElementById('workup-log-status');
      if (statusEl) {
        statusEl.textContent = simState.requestedWorkups.length === 0
          ? ''
          : `${simState.requestedWorkups.length} فحوصات أُرسلت للشات`;
      }
    }

