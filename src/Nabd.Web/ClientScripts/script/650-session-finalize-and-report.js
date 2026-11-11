    function finalizeSessionAndBuildReport() {
      if (!authState.isAuthenticated || !authState.user) {
        openAuthModal('login');
        return;
      }

      const c = simState.caseData;
      simState.submittedRecipient = document.getElementById('handover-recipient').value;
      simState.submittedDiagnosis = (document.getElementById('handover-diagnosis-input')?.value || '').trim();
      simState.submittedSummary = document.getElementById('handover-summary-input').value.trim();
      simState.submittedHandover = document.getElementById('handover-action-input').value.trim();

      // Collect justifications for extra workups (both from chat cards and SBAR modal)
      const expectedIds = c.expectedWorkupIds || [];
      simState.unjustifiedWorkups = [];
      simState.justifiedBonusWorkups = [];
      document.querySelectorAll('.extra-workup-just-input').forEach(inp => {
        const wid = inp.getAttribute('data-extra-wid');
        const justTxt = inp.value.trim();
        const wObj = simState.requestedWorkups.find(r => r.id === wid);
        if (wObj && justTxt) {
          wObj.studentJustification = justTxt;
        }
      });

      simState.requestedWorkups.filter(r => !expectedIds.includes(r.id) && !r.isViolation).forEach(wObj => {
        const isSci = evaluateScientificJustification(wObj.studentJustification);
        wObj.isScientificallyJustified = isSci;
        if (isSci) {
          simState.justifiedBonusWorkups.push(wObj.title);
        } else {
          simState.unjustifiedWorkups.push(wObj.title);
        }
      });

      // Check if female abdominal cramps case (dysmenorrhea or GI/pelvic cramps) was diagnosed without asking about menstrual period / pregnancy (q_preg)
      if ((c.id === 'case_obgyn_dysmenorrhea' || c.id === 'case_gi_allergy') && !simState.askedIds.has('q_preg')) {
        const mensesMsg = c.id === 'case_obgyn_dysmenorrhea'
          ? 'خطأ استجواب وتشخيص نسائي: حضرت المريضة بمغص بطني شديد وذهبت لتشخيصات وفحوصات أخرى دون أن تسألها عن الدورة الشهرية (تبين بالنتيجة أنها آلام الدورة الشهرية / عسر طمث أولي) — تُحتسب هذه النقطة ضدك (-15 نقطة).'
          : 'خطأ استجواب وتشخيص نسائي: حضرت المريضة بألم ومغص بطني ولم تسألها عن تاريخ الدورة الشهرية واحتمالية الحمل المبكر قبل التشخيص (-15 نقطة).';
        if (!simState.safetyMistakes.includes(mensesMsg)) {
          simState.safetyMistakes.push(mensesMsg);
        }
      }

      simState.sbarSubmitted = true;
      simState.sessionCompleted = true;
      hasCompletedSessionInRun = true;
      updateBeginnerStepsBar();

      closeHandoverModal();

      const totalQuestions = c.questions.length;
      const askedCount = simState.askedQuestionsLog.length;
      const inquiryScore = totalQuestions > 0 ? Math.round((askedCount / totalQuestions) * 35) : 0;
      const vitalsScore = simState.vitalsMeasured ? 15 : 0;

      const matchedWorkups = simState.requestedWorkups.filter(r => !r.isViolation && expectedIds.includes(r.id));
      const workupScore = expectedIds.length > 0
        ? Math.min(20, Math.round((matchedWorkups.length / expectedIds.length) * 20))
        : 0;

      const hasClinicalEvidence = (askedCount > 0 || simState.vitalsMeasured || matchedWorkups.length > 0);
      const summaryScore = (!hasClinicalEvidence || simState.submittedSummary.length === 0)
        ? 0
        : (simState.submittedSummary.length >= 20 ? 15 : 7);
      const handoverScore = (!hasClinicalEvidence || simState.submittedHandover.length === 0)
        ? 0
        : (simState.submittedHandover.length >= 20 ? 15 : 7);

      const bonusPoints = simState.justifiedBonusWorkups.length * 5;
      const penalty = (simState.safetyMistakes.length * 15) + (simState.unjustifiedWorkups.length * 5);
      const rawTotal = inquiryScore + vitalsScore + workupScore + summaryScore + handoverScore + bonusPoints - penalty;
      const totalScore = Math.max(0, Math.min(100, rawTotal));

      // Record any newly observed weaknesses or strengths into the active user profile
      if (authState.user) {
        authState.user.weaknesses = authState.user.weaknesses || [];
        authState.user.strengths = authState.user.strengths || [];
        simState.unjustifiedWorkups.forEach(uw => {
          const wText = `طلب فحص بعيد عن التشخيص الأساسي (${uw}) في (${c.title}) دون تبرير علمي مقنع.`;
          if (!authState.user.weaknesses.includes(wText)) authState.user.weaknesses.unshift(wText);
        });
        simState.safetyMistakes.forEach(sm => {
          if (!authState.user.weaknesses.includes(sm)) authState.user.weaknesses.unshift(sm);
        });
        simState.justifiedBonusWorkups.forEach(jw => {
          const sText = `تبرير علمي وتشخيص تفريقي سليم لطلب فحص إضافي (${jw}) في (${c.title}) (+5 علامات).`;
          if (!authState.user.strengths.includes(sText)) authState.user.strengths.unshift(sText);
        });
      }
      const isPassing = totalScore >= 60 && simState.safetyMistakes.length === 0;

      const u = authState.user;
      u.history.unshift({
        caseTitle: c.title,
        mode: isEmergencyRandomMode ? 'غرفة الطوارئ العشوائية' : `تدريب تخصصي (${c.deptName})`,
        date: new Date().toISOString().slice(0, 10),
        workupCount: simState.requestedWorkups.length,
        score: `${totalScore}% (${isPassing ? 'مجتاز' : 'غير مجتاز'})`
      });
      u.stats.completed = u.history.length;
      if (isEmergencyRandomMode) u.stats.avgEr = `${totalScore}%`;
      else u.stats.avgSpec = `${totalScore}%`;
      saveAccountToStorage(u);

      document.getElementById('rep-eval-type-badge').textContent = isEmergencyRandomMode
        ? `تقرير مراجعة حالة طوارئ عشوائية · القسم الفعلي: ${c.deptName}`
        : `تقرير المراجعة السريرية التخصصية · ${c.deptName}`;

      document.getElementById('rep-main-title').textContent = isPassing
        ? 'اجتزت الحالة'
        : (totalScore === 0
            ? 'لم تجتز الحالة: لم يُسجَّل أي سؤال أو فحص'
            : 'لم تجتز الحالة: يلزم 60% دون أخطاء سلامة');

      document.getElementById('rep-case-subtitle').textContent = `${c.title} · المريض: ${c.patient.name} (${c.patient.age} سنة) · تشخيصك المستنتج: ${simState.submittedDiagnosis || 'غير مدون'}`;
      document.getElementById('rep-total-score').textContent = `${totalScore}%`;
      try { nbAfterReport(c, totalScore, isPassing, isEmergencyRandomMode); } catch (e) { console.error(e); }

      const passEl = document.getElementById('rep-pass-status');
      passEl.textContent = isPassing ? 'ناجح (مجتاز)' : 'غير مجتاز';
      passEl.className = `text-sm sm:text-base font-bold mt-1 ${isPassing ? 'text-emerald-700' : 'text-rose-700'}`;

      document.getElementById('rep-discovered-count').textContent = `${askedCount}/${totalQuestions}`;

      const vitalsEvidence = simState.vitalsMeasured
        ? `دليل موثق: قِيست العلامات في التوقيت (${simState.vitalsTimestamp}) — HR ${c.vitalsInitial.hr}, BP ${c.vitalsInitial.bp}`
        : 'لم تُقَس العلامات الحيوية.';

      const inquiryEvidence = askedCount > 0
        ? `دليل موثق: طُرحت ${askedCount} أسئلة في التوقيتات (${simState.askedQuestionsLog.map(q => q.timestamp).join('، ')})`
        : 'لا يوجد دليل في سجل المحاولة: لم يُطرح أي سؤال استقصائي للمريض (0 نقطة)';

      const workupEvidence = matchedWorkups.length > 0
        ? `دليل موثق: طُلبت ${matchedWorkups.length} فحوصات أساسية في التوقيتات (${matchedWorkups.map(w => w.timestamp).join('، ')})`
        : 'لا يوجد دليل في سجل المحاولة: لم يُطلب أي فحص أساسي مرتبط بالحالة (0 نقطة)';

      const summaryEvidence = summaryScore > 0
        ? `دليل موثق: كُتب وضع وخلفية SBAR (${simState.submittedSummary.length} حرفاً) استناداً لأدلة الجلسة`
        : 'لا يوجد دليل كافٍ: لم يُكتب ملخص (S & B) أو لا توجد أدلة مسجلة في المحاولة (0 نقطة)';

      const handoverEvidence = handoverScore > 0
        ? `دليل موثق: كُتب تقييم وتوصية SBAR (${simState.submittedHandover.length} حرفاً) استناداً لأدلة الجلسة`
        : 'لا يوجد دليل كافٍ: لم تُكتب توصية (A & R) أو لا توجد أدلة مسجلة في المحاولة (0 نقطة)';

      const compTbody = document.getElementById('rep-competency-tbody');
      compTbody.innerHTML = `
        <tr>
          <td class="px-5 py-3.5 font-bold text-slate-900">١. قياس وتوثيق العلامات الحيوية</td>
          <td class="px-5 py-3.5 font-num text-slate-500">15%</td>
          <td class="px-5 py-3.5 font-semibold ${simState.vitalsMeasured ? 'text-emerald-700' : 'text-rose-700'}">${vitalsEvidence}</td>
          <td class="px-5 py-3.5 font-num font-bold">${vitalsScore} / 15</td>
          <td class="px-5 py-3.5 text-slate-600">${simState.vitalsMeasured ? 'قياس موثق في سجل المحاولة.' : 'لا تُمنح أي درجة دون قياس فعلي موثق بالوقت.'}</td>
        </tr>
        <tr>
          <td class="px-5 py-3.5 font-bold text-slate-900">٢. استقصاء القصة المرضية والحساسية والسوابق</td>
          <td class="px-5 py-3.5 font-num text-slate-500">35%</td>
          <td class="px-5 py-3.5 font-semibold ${askedCount > 0 ? 'text-slate-800' : 'text-rose-700'}">${inquiryEvidence}</td>
          <td class="px-5 py-3.5 font-num font-bold">${inquiryScore} / 35</td>
          <td class="px-5 py-3.5 text-slate-600">${askedCount === totalQuestions ? 'استجواب مكتمل الأدلة.' : 'راجع الجدول الثاني لتفاصيل كل سؤال وتوقيته.'}</td>
        </tr>
        <tr>
          <td class="px-5 py-3.5 font-bold text-slate-900">٣. اختيار الفحوصات الملائمة ومراعاة سلامة المريض</td>
          <td class="px-5 py-3.5 font-num text-slate-500">20%</td>
          <td class="px-5 py-3.5 font-semibold ${(matchedWorkups.length > 0 && simState.safetyMistakes.length === 0) ? 'text-emerald-700' : 'text-rose-700'}">${workupEvidence}</td>
          <td class="px-5 py-3.5 font-num font-bold">${Math.max(0, workupScore - penalty)} / 20</td>
          <td class="px-5 py-3.5 text-slate-600">${simState.safetyMistakes.length === 0 && simState.unjustifiedWorkups.length === 0 ? 'تُحتسب النقاط فقط للفحوصات الأساسية المطلوبة فعلياً.' : [...simState.safetyMistakes, ...simState.unjustifiedWorkups.map(u => 'فحص غير مبرر: ' + u)].join(' — ')}</td>
        </tr>
        <tr>
          <td class="px-5 py-3.5 font-bold text-slate-900">٤. تسليم SBAR: الوضع الحالي والخلفية (S & B)</td>
          <td class="px-5 py-3.5 font-num text-slate-500">15%</td>
          <td class="px-5 py-3.5 font-semibold ${summaryScore > 0 ? 'text-emerald-700' : 'text-rose-700'}">${summaryEvidence}</td>
          <td class="px-5 py-3.5 font-num font-bold">${summaryScore} / 15</td>
          <td class="px-5 py-3.5 text-slate-600">قارن صياغتك مع الإجابة النموذجية في الجدول الرابع.</td>
        </tr>
        <tr>
          <td class="px-5 py-3.5 font-bold text-slate-900">٥. تسليم SBAR: التقييم والتوصية (A & R)</td>
          <td class="px-5 py-3.5 font-num text-slate-500">15%</td>
          <td class="px-5 py-3.5 font-semibold ${handoverScore > 0 ? 'text-emerald-700' : 'text-rose-700'}">${handoverEvidence}</td>
          <td class="px-5 py-3.5 font-num font-bold">${handoverScore} / 15</td>
          <td class="px-5 py-3.5 text-slate-600">توثيق الفحوصات المنفذة وخطة المتابعة في المناوبة التالية.</td>
        </tr>
      `;

      const inqTbody = document.getElementById('rep-inquiry-tbody');
      const perQuestionPoints = (35 / Math.max(1, totalQuestions)).toFixed(1);
      inqTbody.innerHTML = c.questions.map(q => {
        const logEntry = simState.askedQuestionsLog.find(x => x.id === q.id);
        return `
          <tr>
            <td class="px-5 py-3.5 font-bold text-slate-900">${q.label}</td>
            <td class="px-5 py-3.5 font-semibold ${logEntry ? 'text-emerald-700' : 'text-rose-700'}">
              ${logEntry ? 'تم استقصاؤه في الحوار ✓' : 'لم يُطرح في الحوار (0 نقطة)'}
            </td>
            <td class="px-5 py-3.5 font-num font-bold ${logEntry ? 'text-teal-700' : 'text-slate-400'}">
              ${logEntry ? `دليل مسجل (${logEntry.timestamp}) · +${perQuestionPoints} نقطة` : 'لا يوجد دليل في السجل (0)'}
            </td>
            <td class="px-5 py-3.5 text-slate-600">${q.reason}</td>
          </tr>
        `;
      }).join('');

      const workupTbody = document.getElementById('rep-workup-tbody');
      const workupRows = [];
      expectedIds.forEach(eid => {
        const catItem = GENERAL_WORKUP_CATALOG.find(w => w.id === eid);
        const reqItem = simState.requestedWorkups.find(r => r.id === eid);
        workupRows.push(`
          <tr>
            <td class="px-5 py-3.5 font-bold text-slate-900">${catItem ? catItem.title : eid} <span class="text-xs text-teal-700 font-semibold">(فحص أساسي للحالة)</span></td>
            <td class="px-5 py-3.5 font-semibold ${reqItem ? 'text-emerald-700 font-num' : 'text-rose-700'}">
              ${reqItem ? `دليل موثق: طُلب في التوقيت ${reqItem.timestamp} ✓` : 'لا يوجد دليل: لم يُطلب خلال الجلسة (0 نقطة)'}
            </td>
            <td class="px-5 py-3.5 text-slate-600">${reqItem ? (reqItem.studentAnalysis ? 'تحليلك: ' + reqItem.studentAnalysis : reqItem.resultText) : 'فحص أساسي موصى به ضمن السيناريو المرجعي لهذه الحالة.'}</td>
          </tr>
        `);
      });

      simState.requestedWorkups.filter(r => !expectedIds.includes(r.id)).forEach(extra => {
        const statusBadge = extra.isViolation
          ? 'مخالفة سلامة المريض (-15 نقطة — أُضيفت لنقاط الضعف) ✗'
          : (extra.isScientificallyJustified
              ? `تبرير علمي مقبول: «${extra.studentJustification}» — احتُسبت العلامة لصالحك (+5 نقاط) ✓`
              : `فحص غير مبرر (${extra.studentJustification || 'بلا تبرير'}) · -5 ✗`);
        workupRows.push(`
          <tr>
            <td class="px-5 py-3.5 font-bold text-slate-900">${extra.title}</td>
            <td class="px-5 py-3.5 font-num font-semibold ${extra.isViolation || !extra.isScientificallyJustified ? 'text-rose-700' : 'text-emerald-700'}">
              طُلب في التوقيت ${extra.timestamp} (${extra.isViolation ? 'خطأ سلامة' : (extra.isScientificallyJustified ? 'إضافي مبرر علمياً ✓' : 'إضافي غير مبرر ✗')})
            </td>
            <td class="px-5 py-3.5 ${extra.isViolation || !extra.isScientificallyJustified ? 'text-rose-700 font-semibold' : 'text-emerald-800 font-semibold'}">${statusBadge}</td>
          </tr>
        `);
      });
      workupTbody.innerHTML = workupRows.join('');

      const handTbody = document.getElementById('rep-handover-tbody');
      handTbody.innerHTML = `
        <tr>
          <td class="px-5 py-4 font-bold text-slate-900 bg-slate-50/60">(S & B) الوضع الحالي والخلفية المرضية</td>
          <td id="rep-user-summary-cell" class="px-5 py-4 text-slate-700 leading-relaxed"></td>
          <td id="rep-ideal-summary-cell" class="px-5 py-4 text-teal-900 bg-teal-50/40 leading-relaxed font-medium"></td>
        </tr>
        <tr>
          <td class="px-5 py-4 font-bold text-slate-900 bg-slate-50/60">(A & R) التقييم السريري والتوصية</td>
          <td id="rep-user-handover-cell" class="px-5 py-4 text-slate-700 leading-relaxed"></td>
          <td id="rep-ideal-handover-cell" class="px-5 py-4 text-teal-900 bg-teal-50/40 leading-relaxed font-medium"></td>
        </tr>
      `;
      document.getElementById('rep-user-summary-cell').textContent = simState.submittedSummary || 'لم يتم إدخال (S & B) في تسليم SBAR (0 نقطة).';
      document.getElementById('rep-ideal-summary-cell').textContent = c.idealSummary;
      document.getElementById('rep-user-handover-cell').textContent = simState.submittedHandover || 'لم يتم إدخال (A & R) في تسليم SBAR (0 نقطة).';
      document.getElementById('rep-ideal-handover-cell').textContent = c.idealHandover;

      renderProfileView();
      navigateTo('debrief');
    }

