    /* retake level modal */
    function nbOpenLevelModal(opts) {
      opts = opts || {};
      const at = document.getElementById('level-aside-title'), ax = document.getElementById('level-aside-text');
      const cb = document.getElementById('level-modal-close'); if (cb) cb.textContent = opts.onboard ? 'تخطي (سأبدأ كمبتدئ)' : 'إغلاق';
      if (at) at.textContent = opts.onboard ? 'مرحباً بك: لنحدّد مستواك' : 'إعادة اختبار المستوى';
      if (ax) ax.textContent = opts.onboard ? 'ثمانية أسئلة قصيرة تحدّد مستواك وتبني لك مساراً مناسباً. إن تخطّيتها نتعامل معك كمبتدئ تماماً.' : 'نكرر الاختبار بين فترة وأخرى لقياس تحسّنك وتحديث الغرف المقترحة.';
      nbQuiz = { track: null, qs: [], i: 0, ans: [] };
      nbQHost = 'nb-quiz-modal-main'; nbQModal = true;
      const m = document.getElementById('level-modal'); m.classList.remove('hidden'); m.classList.add('flex');
      const _u = (opts && opts.u) || authState.user; const _tr = _u && nbTrackOf(_u);
      if (_tr) nbStartQuiz(_tr); else nbRenderQuiz();
    }
    function nbCloseLevelModal() {
      const m = document.getElementById('level-modal'); m.classList.add('hidden'); m.classList.remove('flex');
      nbQHost = 'nb-quiz-main'; nbQModal = false;
      nbQuiz = { track: null, qs: [], i: 0, ans: [] };
      nbRenderQuiz();
      if (authState.user) { renderHomePath(authState.user); renderClinicalCaseCards(); }
    }

