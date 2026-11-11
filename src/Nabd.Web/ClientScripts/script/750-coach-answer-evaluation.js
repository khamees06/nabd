    function handleCoachStudentSubmission() {
      const inp = document.getElementById('coach-chat-input');
      if (!inp) return;
      const txt = inp.value.trim();
      if (!txt) return;
      inp.value = '';

      const mod = COACH_MODULES_DEFAULT[coachRuntime.activeIdx] || COACH_MODULES_DEFAULT[0];
      appendCoachMessage('student', 'إجابتك السريرية', txt);

      const _cfg = nbCoachApiCfg();
      if (_cfg.on && _cfg.url) {
        nbCoachAsk(txt, mod).then(out => {
          if (out) { const d = document.createElement('div'); d.textContent = out; appendCoachMessage('coach', 'المدرب السريري (تجريبي · API)', `<p class="text-xs text-slate-700" style="white-space:pre-wrap">${d.innerHTML}</p><p class="text-[10px] text-slate-400">رد تجريبي من نموذج لغوي: راجع المعلومة قبل الاعتماد عليها.</p>`); }
              else { appendCoachMessage('coach', 'المدرب السريري', '<p class="text-xs text-slate-500">تعذّر الاتصال بالـ API، لذا استُخدم التقييم المحلي.</p>'); nbCoachLocal(txt, mod); }
        });
        return;
      }
      nbCoachLocal(txt, mod);
    }
    function nbCoachLocal(txt, mod) {
      const lower = txt.toLowerCase();
      let hits = 0;
      mod.keywords.forEach(kw => {
        if (lower.includes(kw)) hits++;
      });

      if (txt.length >= 20 && hits >= 2) {
        coachRuntime.masteredIds.add(mod.id);
        saveCoachMasteredSet(coachRuntime.masteredIds);
        setTimeout(() => {
          appendCoachMessage('coach', 'المدرب السريري', `
            <div class="font-bold text-emerald-800">إجابة ممتازة · ١٠٠٪</div>
            <p class="text-sm text-slate-700">تم إتقان محور ${mod.specialty}.</p>
          `);
          renderInteractiveCoachView();
        }, 150);
      } else {
        setTimeout(() => {
          appendCoachMessage('coach', 'المدرب السريري', `
            <div class="font-bold text-amber-900">إجابة جيدة. أكمل الخطوات الأساسية:</div>
            <p class="text-sm text-slate-700">العلامات الحيوية، الأسئلة المهمة، والتأكد من الحساسية والسلامة.</p>
            <details class="coach-review"><summary>عرض إجابة نموذجية</summary><p>${mod.sampleIdealStudentReply}</p></details>
          `);
        }, 150);
      }
    }

