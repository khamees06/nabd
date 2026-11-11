  /* ---------- clinical state ---------- */
  function vitalsAt(risk) {
    const A = E.c.vitals;
    let i = 0;
    while (i < A.length - 2 && risk > A[i + 1].at) i++;
    const a = A[i], b = A[i + 1], f = clamp((risk - a.at) / (b.at - a.at), 0, 1);
    const at = k => a[k] + f * (b[k] - a[k]);
    return { hr: at('hr'), sbp: at('sbp'), dbp: at('dbp'), rr: at('rr'), spo2: at('spo2') };
  }

  // What the treatments given so far have done to the numbers, ramping in over a few seconds.
  function modsNow() {
    const t = { spo2: 0, hr: 0, rr: 0, sbp: 0, dbp: 0 };
    for (const m of E.mods) {
      const f = clamp((E.sim - m.from) / (m.ramp || 0.2), 0, 1);
      for (const k in t) if (m[k]) t[k] += m[k] * f;
    }
    return t;
  }
  function live() {
    const v = vitalsAt(E.risk), m = modsNow();
    v.spo2 = Math.min(99, v.spo2 + clamp(m.spo2, -10, 10));
    // In VT nothing but a shock moves the heart.
    if (!E.vtNow) v.hr = m.hr < 0 ? Math.max(v.hr + clamp(m.hr, -30, 0), Math.min(v.hr, 60)) : v.hr + clamp(m.hr, 0, 30);
    v.rr = m.rr < 0 ? Math.max(v.rr + clamp(m.rr, -10, 0), Math.min(v.rr, 14)) : v.rr + m.rr;
    v.sbp += clamp(m.sbp, -40, 35);
    v.dbp += clamp(m.dbp, -20, 18);
    return v;
  }

