  /* ---------- vitals and tests ---------- */
  // DDXPlus records carry no vital signs or results, so data/resp-clinical.json holds illustrative
  // ranges for each condition; each patient's values are drawn inside them. The network never sees them.
  function seeded(a) {
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hasEv = (pt, n) => pt.ev.some(t => t.split('_@_')[0] === n);
  const band = age => (age < 1 ? 'infant' : age < 6 ? 'toddler' : age < 12 ? 'school' : 'adult');

  function vitalsFor(pt) {
    const c = CL.conditions[M.classes[pt.path]];
    const V = c.vitals[pt.age < 1 ? 'infant' : pt.age < 12 ? 'child' : 'adult'];
    const r = S.rng;
    // Breathless patients sit in the worse half of the ranges, the others in the milder half.
    const s = hasEv(pt, 'E_66') ? 0.45 + 0.55 * r() : 0.5 * r();
    const near = () => Math.max(0, Math.min(1, s + (r() - 0.5) * 0.3));
    const at = (k, f) => V[k][0] + f * (V[k][1] - V[k][0]);
    // Fever follows the record: a patient who denies it has a normal temperature.
    const temp = !hasEv(pt, 'E_91') ? 36.5 + 0.8 * r() : c.febrile ? at('temp', r()) : 37.8 + 0.8 * r();
    const sbp = Math.round(at('sbp', r()));
    return {
      s, hr: Math.round(at('hr', near())), sbp, dbp: Math.min(Math.round(at('dbp', r())), sbp - 25),
      rr: Math.round(at('rr', near())), spo2: Math.round(V.spo2[1] - s * (V.spo2[1] - V.spo2[0])), temp: Math.round(temp * 10) / 10
    };
  }

  // Normal ranges by age (PALS-style); a reading outside them lights its tile.
  const NORMAL = {
    infant: { hr: [100, 160], rr: [30, 53], sbp: [72, 104], txt: 'الرضيع' },
    toddler: { hr: [80, 140], rr: [22, 37], sbp: [86, 106], txt: 'الطفل من سنة إلى 5 سنوات' },
    school: { hr: [70, 120], rr: [18, 25], sbp: [97, 115], txt: 'الطفل من 6 إلى 11 سنة' },
    adult: { hr: [50, 110], rr: [12, 21], sbp: [100, 159] }
  };
  window.nbRespVitals = {
    warn(k, v) {
      const N = NORMAL[band(S.pt ? S.pt.age : 30)];
      if (k === 'hr') return v < N.hr[0] || v > N.hr[1];
      if (k === 'rr') return v < N.rr[0] || v > N.rr[1];
      if (k === 'bp') { const s = parseInt(String(v), 10); return s < N.sbp[0] || s > N.sbp[1] + 15; }
      if (k === 'spo2') return v <= 94;
      if (k === 'temp') return v >= 38 || v <= 36;
      return false;
    },
    // Adults keep the monitor's own texts; children get theirs.
    range(k) {
      const N = S.pt && NORMAL[band(S.pt.age)];
      if (!N || !N.txt) return null;
      if (k === 'hr') return `النبض — الطبيعي عند ${N.txt}: ${N.hr[0]}–${N.hr[1]} نبضة في الدقيقة.`;
      if (k === 'rr') return `التنفس — الطبيعي عند ${N.txt}: ${N.rr[0]}–${N.rr[1]} نفساً في الدقيقة.`;
      if (k === 'bp') return `الضغط — الانقباضي الطبيعي عند ${N.txt}: ${N.sbp[0]}–${N.sbp[1]} ملم زئبق.`;
      return null;
    }
  };
  const ECG_REF = { infant: '100-160', toddler: '80-140', school: '70-120', adult: '60-100' };

