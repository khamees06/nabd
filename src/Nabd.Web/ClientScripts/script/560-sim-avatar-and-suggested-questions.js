    function renderSimAvatar() {
      const c = simState.caseData;
      if (!c) return;
      const emo = simState.emotion;
      const isFemale = c.patient.gender === 'female';
      const isChild = c.patient.age < 12;

      let mouth = 'M 42 62 Q 50 58 58 62';
      let emoLabel = 'متألم';
      if (emo === 'open' || emo === 'relaxed') {
        mouth = 'M 41 59 Q 50 65 59 59';
        emoLabel = 'يتجاوب';
      }

      const emoEl = document.getElementById('sim-emotion-text');
      if (emoEl) emoEl.textContent = emoLabel;
      const container = document.getElementById('sim-avatar-container');
      if (!container) return;
      const safeAlt = `صورة رمزية للمريض ${c.patient.name}`;

      container.innerHTML = `<span class="v7-sim-av" role="img" aria-label="${safeAlt}">${(c.patient.name || '?').charAt(0)}</span>`;
    }

    function renderSuggestedQuestions() {
      const c = simState.caseData;
      const row = document.getElementById('sim-suggested-questions');
      if (!row || !c) return;
      row.innerHTML = '';

      c.questions.forEach(q => {
        const asked = simState.askedIds.has(q.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `sim-q-chip px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all focus-ring ${
          asked
            ? 'bg-teal-50 border-teal-300 text-teal-800'
            : 'bg-slate-50 hover:bg-teal-50/50 border-slate-200 text-slate-700'
        }`;
        btn.textContent = (asked ? '✓ ' : '') + q.label;
        btn.addEventListener('click', () => processChatTurn(q.prompt, q));
        row.appendChild(btn);
      });
    }

