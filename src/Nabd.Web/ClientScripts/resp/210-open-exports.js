  async function open() {
    if (typeof navigateTo === 'function' && navigateTo('resp') === false) return;
    mount();
    const v = $('view-resp');
    v.classList.add('is-loading');
    try {
      await load();
      if (!cues) buildCues();
      v.classList.remove('is-loading');
      // Coming back to the room keeps the patient the student was working on.
      if (!S.pt || S.done) begin();
      else $('rs-input').focus();
    } catch (e) {
      console.error(e);
      v.classList.remove('is-loading');
      ['rs-input', 'rs-send', 'rs-dx-btn'].forEach(id => { $(id).disabled = true; });
      $('rs-feed').innerHTML = '<div class="rs-msg sys"><p>تعذّر تحميل النموذج. تحقق من الاتصال ثم أعد المحاولة.</p><button type="button" class="rs-ghost" id="rs-retry">أعد المحاولة</button></div>';
    }
  }

  window.nbOpenResp = open;
  // Test hook: lets the checks drive a known patient and compare with the Python model.
  window.__nbResp = {
    load: async () => { await load(); if (!cues) buildCues(); },
    predict: (pt, groups) => { const keep = S.pt; S.pt = pt; const p = predict(new Set(groups)); S.pt = keep; return p; },
    start: i => begin(i), ask: g => askGroup(g), state: S, matchLocal: t => matchLocal(t),
    measure: () => measure(), order: id => orderTest(id), result: id => resultFor(id), matchTests: t => matchTests(t),
    get CL() { return CL; },
    get M() { return M; }, get pool() { return POOL; }
  };
