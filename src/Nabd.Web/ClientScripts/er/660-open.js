  // Only the offline path needs the act model, so the room never waits for it.
  const loadAct = () => fetch('data/er-act.json', { signal: timeout(4000) }).then(r => r.json()).then(m => { ACT = { ...m, index: new Map(m.grams.map((g, i) => [g, i])), bias: m.bias.map(x => x / 100), w: m.w.map(r => r.map(x => x / 100)) }; }).catch(e => console.warn('er-act', e));
  const load = () => D ? Promise.resolve() : (loading = loading || fetch('data/er-cases.json').then(r => { if (!r.ok) throw new Error('cases'); return r.json(); }).then(j => { D = j; }).catch(e => { loading = null; throw e; }));

  async function open() {
    if (typeof navigateTo === 'function' && navigateTo('er') === false) return;
    // Review fix 2026-11-07: a role switched in one session's briefing does not carry into the next entry
    // from home; the track decides again. (The Node harness sets the role itself, so only a real page resets.)
    if (REAL) roleWanted = null;
    mount();
    // Sound needs the click that brought the student here.
    // mobile audit 2026-11-07: the alarms share motion.js's context, so waking one wakes both. Sound turns on by
    // itself only if the trainee has not muted it (motion.js remembers the trainee's own tap in nbSound).
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!ac) ac = typeof window.nbAudio === 'function' ? window.nbAudio() : Ctx ? new Ctx() : null;
    if (ac && ac.resume) ac.resume();
    const sound = document.querySelector('.er-mon .nb-mon-sound');
    let soundPref = null;
    try { soundPref = localStorage.getItem('nbSound'); } catch (e) { /* no storage */ }
    if (sound && sound.getAttribute('aria-pressed') !== 'true' && soundPref !== '0') sound.click();
    if (REAL) guardBack();
    try {
      await Promise.all([load(), ping()]);
      if (!ACT) loadAct();
      // (chat fix 2026-11-08) The trained history finder loads with the room, so the first offline read («مدخن؟»)
      // already has it; before, it loaded only after the server had failed.
      loadFind();
      if (!E || E.over) begin(new URLSearchParams(location.search).get('case') || undefined);
      else if (briefOpen()) $('er-brief-go').focus(); // phase8 2026-11-07
      else autoFocus($('er-input'));
    } catch (e) {
      console.error(e);
      $('er-feed').innerHTML = '<div class="er-msg k-sys"><p>تعذّر تحميل الحالات. تحقق من الاتصال ثم أعد المحاولة.</p></div>';
    }
  }

