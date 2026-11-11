    function nbRenderQuiz() {
      const host = nbHost();
      if (!host) return;
      const prev = nbGetPlacement();
      if (!nbQuiz.track) {
        host.innerHTML = `
          <h3 style="margin:0 0 .3rem;font-size:1.1rem" class="text-slate-900">ما مسارك؟</h3>
          <p style="font-size:.84rem;color:#425D69;margin:0 0 1rem">نعدّل الأسئلة بحسب تخصصك.</p>
          <div class="nb-track">
            <button type="button" data-track="nursing"><strong>طالب تمريض</strong><span>الأولويات، السلامة الدوائية، تسليم الحالة</span></button>
            <button type="button" data-track="medicine"><strong>طالب طب</strong><span>قرارات التشخيص، مقاييس ومعايير سريرية</span></button>
          </div>
          ${prev ? `<p style="margin-top:1rem;font-size:.8rem;color:#425D69">نتيجتك السابقة: <span class="nb-level ${NB_LEVELS[prev.level].cls}">${NB_LEVELS[prev.level].name}</span></p>` : ''}`;
        host.querySelectorAll('[data-track]').forEach(b => b.addEventListener('click', () => nbStartQuiz(b.dataset.track)));
        return;
      }
      if (nbQuiz.i >= nbQuiz.qs.length) return nbRenderResult();
      const q = nbQuiz.qs[nbQuiz.i];
      const L = ['أ', 'ب', 'ج', 'د'];
      host.innerHTML = `
        <div class="nb-q-prog" aria-hidden="true">${nbQuiz.qs.map((_, k) => `<i class="${k < nbQuiz.i ? 'done' : k === nbQuiz.i ? 'now' : ''}"></i>`).join('')}</div>
        <div class="nb-q-meta">السؤال ${nbQuiz.i + 1} من ${nbQuiz.qs.length}</div>
        <p class="nb-q-text">${q.q}</p>
        <div>${q.o.map((o, k) => `<button type="button" class="nb-opt" data-o="${k}"><b>${L[k]}</b><span>${o}</span></button>`).join('')}</div>
        <div style="margin-top:auto;padding-top:.6rem"><button type="button" id="nb-quiz-restart" style="font-size:.76rem;color:#4F6A77">${(authState.user && nbTrackOf(authState.user)) ? 'إعادة من البداية' : 'تغيير المسار'}</button></div>`;
      host.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => {
        host.querySelectorAll('.nb-opt').forEach(x => x.classList.remove('is-sel'));
        b.classList.add('is-sel');
        nbQuiz.ans[nbQuiz.i] = Number(b.dataset.o);
        setTimeout(() => { nbQuiz.i++; nbRenderQuiz(); }, 260);
      }));
      document.getElementById('nb-quiz-restart')?.addEventListener('click', () => { const t = authState.user && nbTrackOf(authState.user); if (t) nbStartQuiz(t); else { nbQuiz = { track: null, qs: [], i: 0, ans: [] }; nbRenderQuiz(); } });
    }

    function nbStartQuiz(track) {
      nbQuiz = { track, qs: NB_QUIZ_BY_TRACK[track] || NB_QUIZ_BY_TRACK.nursing, i: 0, ans: [] };
      nbRenderQuiz();
    }

