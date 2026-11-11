  /* ---------- alarm tones ---------- */
  let ac = null, lastAlarm = 0;
  function tone(freq, at, len) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(ac.destination);
    o.start(at);
    o.stop(at + len + 0.02);
  }
  function alarm(now) {
    const mon = document.querySelector('.er-mon');
    if (!ac || E.stage < 2 || !mon || !mon.dataset.sound || now - lastAlarm < (E.stage === 3 ? 2600 : 6000)) return;
    lastAlarm = now;
    const t = ac.currentTime;
    if (E.stage === 3) [0, 0.18, 0.36, 0.75, 0.93].forEach(d => tone(880, t + d, 0.14));
    else [0, 0.3, 0.6].forEach(d => tone(620, t + d, 0.22));
  }

