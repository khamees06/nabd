  function mount() {
    const v = $('view-resp');
    if (!v || v.dataset.ready) return;
    v.dataset.ready = '1';
    const box = $('rs-submit');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'rs-submit-h');
    $('rs-form').addEventListener('submit', e => { e.preventDefault(); onAsk($('rs-input').value); });
    $('rs-feed').addEventListener('click', e => {
      const b = e.target.closest('.rs-chip');
      if (b && !S.done) { b.parentElement.remove(); askGroup(b.dataset.g); }
      if (e.target.id === 'rs-retry') open();
    });
    $('rs-qlist').addEventListener('click', e => {
      const b = e.target.closest('.rs-q');
      if (!b || S.done) return;
      const g = b.dataset.g;
      say('me', b.textContent);
      askGroup(g);
      $('rs-qlist').querySelector(`[data-g="${g}"]`)?.focus();
    });
    $('rs-qsearch').addEventListener('input', e => renderQuestionList(e.target.value));
    $('rs-measure').addEventListener('click', measure);
    $('rs-tests').addEventListener('click', e => { const b = e.target.closest('.rs-t'); if (b) orderTest(b.dataset.t); });
    v.querySelector('.rs-jump').addEventListener('click', e => {
      const b = e.target.closest('[data-jump]');
      if (!b) return;
      const card = $(b.dataset.jump);
      const d = card.querySelector('details');
      if (d) d.open = true;
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('rs-dx-btn').addEventListener('click', openSubmit);
    $('rs-new').addEventListener('click', () => (M ? begin() : open()));
    // Switching mode mid-case would let a student peek at the bars, so it starts a new patient.
    $('rs-mode').addEventListener('change', e => { S.exam = e.target.value === 'exam'; if (S.pt && !S.done) begin(); else if (M) renderBars(); });
  }

