  /* ---------- 6. live vitals monitor ---------- */
  const RANGES = {
    hr: 'النبض — المعدل الطبيعي للبالغ: 60–100 نبضة في الدقيقة.',
    bp: 'الضغط — الطبيعي تقريباً: الانقباضي 90–139 والانبساطي 60–89 ملم زئبق.',
    spo2: 'الأكسجين — الطبيعي: 95–100% على هواء الغرفة.',
    temp: 'الحرارة — الطبيعي: 36.1–37.5 درجة مئوية.',
    rr: 'التنفس — الطبيعي للبالغ: 12–20 نفساً في الدقيقة.',
    bg: 'السكر — العشوائي الطبيعي تقريباً: 70–140 ملغ/دل.',
    news2: 'NEWS2 — من 0 إلى 4 خطورة منخفضة، 5–6 متوسطة، 7 فأكثر عالية.'
  };
  const keyOfLabel = t => /HR/.test(t) ? 'hr' : /BP/.test(t) ? 'bp' : /SpO2/i.test(t) ? 'spo2'
    : /Temp/i.test(t) ? 'temp' : /RR|التنفس/.test(t) ? 'rr' : /BG|السكر/.test(t) ? 'bg' : /NEWS2/.test(t) ? 'news2' : '';
  const firstNum = el => {
    const m = el && el.textContent.match(/\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  };

  // A lead-II beat drawn in real time (t = seconds since the beat began), so its widths stay
  // true at any rate: PR 0.16 s, QRS about 0.09 s, QT from Bazett with QTc 0.40 s.
  // A fast rate shortens the flat line between beats, not the complexes themselves.
  const bump = (p, c, w, a) => a * Math.exp(-Math.pow((p - c) / w, 2));
  const R_AT = 0.19; // seconds from the start of a beat to its R wave
  function ecgBeat(t, rr) {
    if (t < -0.05 || t > 1.6) return 0;
    const qt = 0.4 * Math.sqrt(rr);
    return bump(t, 0.06, 0.022, 0.12) - bump(t, 0.172, 0.007, 0.12) + bump(t, R_AT, 0.009, 1)
      - bump(t, 0.21, 0.008, 0.28) + bump(t, 0.07 + qt, 0.045 * Math.sqrt(rr), 0.25);
  }
  // The finger pulse arrives about 0.2 s after the R wave, with a dicrotic notch.
  function plethBeat(t) {
    const u = t - R_AT;
    if (u < -0.1 || u > 1.2) return 0;
    return bump(u, 0.22, 0.08, 1) + bump(u, 0.42, 0.07, 0.3);
  }
  function gauss() {
    let u = 0;
    while (!u) u = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
  }

