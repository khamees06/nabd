  let audio = null;
  // mobile audit 2026-11-07: one sound context for the whole page. er.js plays its alarms on it too, so waking it
  // after a phone call or a locked screen brings back the pulse tone and the alarms together.
  const SND_ON = 'الصوت: مفتوح', SND_OFF = 'الصوت: مغلق', SND_WAIT = 'الصوت: اضغط لتفعيله';
  function soundLabel(btn) {
    const on = btn.getAttribute('aria-pressed') === 'true';
    btn.textContent = !on ? SND_OFF : audio && audio.state !== 'running' ? SND_WAIT : SND_ON;
  }
  const syncSoundLabels = () => document.querySelectorAll('.nb-mon-sound').forEach(soundLabel);
  window.nbAudio = () => {
    if (!audio) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audio = new Ctx();
      if (audio.addEventListener) audio.addEventListener('statechange', syncSoundLabels);
    }
    return audio;
  };
  // A phone suspends sound on a call, a locked screen or a page opened without a tap; the next touch wakes it,
  // as long as the trainee left the sound on. A tap on the sound button itself is left to that button.
  function wakeAudio(e) {
    if (!audio || audio.state === 'running' || audio.state === 'closed') return;
    if (e && e.target && e.target.closest && e.target.closest('.nb-mon-sound')) return;
    if (!document.querySelector('.nb-mon-sound[aria-pressed="true"]')) return;
    const p = audio.resume();
    if (p && p.catch) p.catch(() => {});
  }
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(t => document.addEventListener(t, wakeAudio, true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wakeAudio(); });
  window.addEventListener('pageshow', () => wakeAudio());
  function beep(spo2) {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    // Like a bedside oximeter: lower saturation, lower pitch. The heart-rate alarm is the red tile and the
    // room's own alarm tones, so the pulse tone always follows SpO2 (mobile audit 2026-11-07).
    osc.frequency.value = 520 + Math.max(0, Math.min(20, (spo2 || 98) - 80)) * 14;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

