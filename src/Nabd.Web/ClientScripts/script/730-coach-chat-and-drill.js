    function appendCoachMessage(role, sender, htmlContent) {
      const box = document.getElementById('coach-chat-messages');
      if (!box) return;
      const wrap = document.createElement('div');
      const isStudent = role === 'student';
      wrap.className = `coach-message ${isStudent ? 'is-student' : 'is-coach'}`;

      const meta = document.createElement('span');
      meta.className = 'coach-message-label';
      meta.textContent = isStudent ? 'أنت' : 'المدرب';

      const bubble = document.createElement('div');
      bubble.className = isStudent
        ? 'coach-bubble coach-bubble-student'
        : 'coach-bubble coach-bubble-coach';

      if (isStudent) bubble.textContent = htmlContent;
      else bubble.innerHTML = htmlContent;

      wrap.appendChild(meta);
      wrap.appendChild(bubble);
      box.appendChild(wrap);
      box.scrollTop = box.scrollHeight;
    }

    function startCoachDrillAtIndex(idx, resetStream = true) {
      coachRuntime.activeIdx = idx;
      const mod = COACH_MODULES_DEFAULT[idx] || COACH_MODULES_DEFAULT[0];
      const badgeEl = document.getElementById('coach-active-module-badge');
      if (badgeEl) badgeEl.textContent = mod.specialty;

      const box = document.getElementById('coach-chat-messages');
      if (box && (resetStream || box.children.length === 0)) {
        box.innerHTML = '';
        const stepList = mod.explanationSteps.map(s => `<li>${s}</li>`).join('');
        const coachDrillTitles = {
          weak_cardio_acs: 'ألم الصدر',
          weak_neuro_stroke: 'أعراض السكتة',
          weak_safety_contrast_preg: 'أمان الفحوصات',
          weak_peds_workup_just: 'جفاف الأطفال'
        };
        const coachDrillPrompts = {
          weak_cardio_acs: 'مريض بألم صدري يمتد للرقبة والكتف، مع تعرّق وسكري وضغط. ما أول ٣ خطواتك؟',
          weak_neuro_stroke: 'مريض بدأ لديه فجأة ثقل بالكلام وضعف في الذراع اليمنى. ما أول ٣ خطواتك؟',
          weak_safety_contrast_preg: 'مريضة بألم أسفل البطن وحمى وتأخر بالدورة أسبوعين. ما الفحوصات الآمنة؟',
          weak_peds_workup_just: 'طفل عمره ٤ سنوات لديه تقيؤ وإسهال وخمول وجفاف. كيف تقيّمه؟'
        };
        const drillTitle = coachDrillTitles[mod.id] || mod.specialty;
        const drillPrompt = coachDrillPrompts[mod.id] || mod.testPrompt;
        appendCoachMessage('coach', 'المدرب السريري', `
          <div class="coach-lesson">
            <h3>${drillTitle}</h3>
            <div class="coach-case">
              <span>الحالة</span>
              <p>${drillPrompt}</p>
            </div>
            <details class="coach-review">
              <summary>مراجعة الخطوات</summary>
              <ol>${stepList}</ol>
            </details>
          </div>
        `);
      }

      const chipsEl = document.getElementById('coach-quick-chips');
      if (chipsEl) {
        chipsEl.innerHTML = '';
        const fillBtn = document.createElement('button');
        fillBtn.type = 'button';
        fillBtn.className = 'px-3 py-1 rounded-xl bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold whitespace-nowrap';
        fillBtn.textContent = 'إجابة نموذجية';
        fillBtn.addEventListener('click', () => {
          const inp = document.getElementById('coach-chat-input');
          if (inp) {
            inp.value = mod.sampleIdealStudentReply;
            inp.focus();
          }
        });
        chipsEl.appendChild(fillBtn);
      }
    }


