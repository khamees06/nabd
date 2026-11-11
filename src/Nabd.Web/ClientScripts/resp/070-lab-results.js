  const decimals = (r, v) => (r.param === 'pH' || r.hi < 1 ? 2 : String(r.lo).includes('.') || String(r.hi).includes('.') || r.hi <= 30 ? 1 : 0);
  // "4.0-11.0", "< 5", ">= 0.70", "M 13.0-17.0; F 12.0-15.5", "12.0-16.0 (F); 13.5-17.5 (M)"
  function flagOf(ref, v) {
    let s = String(ref);
    if (s.includes(';')) s = s.split(';').find(p => (fem() ? /\bF\b/ : /\bM\b/).test(p)) || s;
    s = s.replace(/\([^)]*\)|\b[MF]\b/g, '').trim();
    let m = s.match(/^(-?[\d.]+)\s*-\s*([\d.]+)$/);
    if (m) return v < +m[1] ? 'lo' : v > +m[2] ? 'hi' : '';
    if ((m = s.match(/^<=?\s*([\d.]+)$/))) return v > +m[1] ? 'hi' : '';
    if ((m = s.match(/^>=?\s*([\d.]+)$/))) return v < +m[1] ? 'lo' : '';
    return '';
  }

  function resultFor(id) {
    if (S.results[id]) return S.results[id];
    const t = CL.conditions[M.classes[S.pt.path]].tests[id] || {};
    const r = S.rng, v = S.vit, b = band(S.pt.age);
    let rows = (t.rows || []).map(x => ({ ...x }));
    if (id === 'peak_flow' && S.pt.age < 6) rows = rows.map(x => ({ param: x.param, text: 'Unable to perform (age)', unit: '', ref: x.ref }));
    rows.forEach(x => {
      if (x.text != null || x.lo == null) return;
      if (id === 'ecg' && /rate/i.test(x.param)) { x.val = v.hr; x.ref = ECG_REF[b]; return; }
      // Oxygen in the blood gas follows the saturation on the monitor.
      if (id === 'abg' && /PaO2/.test(x.param)) { x.val = x.hi - v.s * (x.hi - x.lo); return; }
      x.val = x.lo + r() * (x.hi - x.lo);
    });
    const get = re => rows.find(x => re.test(x.param) && x.val != null);
    if (id === 'abg') {
      // pH from Henderson-Hasselbalch, so the gas is always internally consistent.
      const ph = get(/^pH$/), co2 = get(/PaCO2/), hco3 = get(/HCO3/);
      if (ph && co2 && hco3) ph.val = 6.1 + Math.log10(hco3.val / (0.0307 * co2.val));
    }
    if (id === 'cbc') {
      // Leave room for monocytes and basophils in the differential.
      const n = get(/Neutro/), l = get(/Lympho/), e = get(/Eosino/);
      if (n && l && e && n.val + l.val + e.val > 97) l.val -= n.val + l.val + e.val - 97;
    }
    rows.forEach(x => {
      if (x.val == null) { x.shown = x.text || ''; return; }
      const d = decimals(x, x.val);
      x.val = Number(x.val.toFixed(d));
      x.shown = x.val.toFixed(d);
      x.flag = flagOf(x.ref, x.val);
    });
    return (S.results[id] = { rows, report: t.report || '', summary: t.summary_ar || '' });
  }

