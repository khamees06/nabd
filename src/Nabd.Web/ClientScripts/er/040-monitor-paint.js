  const fix = (n, d = 0) => { const p = 10 ** d; return Math.round(n * p) / p; };
  const wobble = n => (Math.random() - 0.5) * n;
  function paint() {
    const v = live();
    $('er-v-hr').textContent = Math.round(v.hr + wobble(2));
    $('er-v-spo2').textContent = Math.round(clamp(v.spo2 + wobble(1), 40, 100));
    $('er-v-rr').textContent = Math.round(v.rr + wobble(1.5));
    E.show = v;
    if (E.sim >= E.bpAt) {
      E.bp = [Math.round(v.sbp), Math.round(v.dbp)];
      E.bpAt = E.sim + (E.stage >= 2 ? BP_SICK : BP_EVERY);
      E.bpTime = E.sim;
      $('er-v-bp').textContent = E.bp.join('/');
    }
    $('er-v-bpt').textContent = 'قبل ' + Math.max(0, Math.floor(E.sim - E.bpTime)) + ' د';
    $('er-v-temp').textContent = E.tempKnown ? E.c.temp.toFixed(1) : '--.-';
  }
  const vitalsLine = () => { const v = E.show || live(); return `HR ${Math.round(v.hr)}, BP ${E.bp.join('/')}, RR ${Math.round(v.rr)}, SpO2 ${Math.round(v.spo2)}%`; };
  // The same numbers as a nurse says them out loud.
  const spokenVitals = () => { const v = E.show || live(); return `الضغط ${E.bp.join(' على ')}، النبض ${Math.round(v.hr)}، التنفس ${Math.round(v.rr)}، والـSpO2 ${Math.round(v.spo2)}%`; };

  // Adult limits; a reading outside them lights its tile (motion.js asks here).
  window.nbErVitals = {
    warn(k, x) {
      if (k === 'hr') return x > 110 || x < 50;
      if (k === 'rr') return x > 24 || x < 10;
      if (k === 'spo2') return x <= 92;
      if (k === 'bp') { const s = parseInt(String(x), 10); return s < 100 || s >= 180; }
      if (k === 'temp') return x >= 38;
      return false;
    }
  };

