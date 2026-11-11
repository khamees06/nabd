  /* ---------- the network ---------- */
  // Questions answered by implication (see IMPLIED) stay out of the input: the network only
  // knows the record, where that answer is missing.
  const net = asked => (S.derived.size ? new Set([...asked].filter(g => !S.derived.has(g))) : asked);
  function encode(asked) {
    const E = M.encoder, x = new Map();
    E.evidences.forEach((n, i) => { if (asked.has(E.ev_group[i])) x.set(E.asked_base + i, 1); });
    for (const tok of S.pt.ev) {
      const g = E.ev_group[evIndex[tok.split('_@_')[0]]];
      const c = E.value_col[tok];
      if (asked.has(g) && c != null) x.set(c, 1);
    }
    x.set(E.age_col, S.pt.age / E.age_scale);
    if (S.pt.sex === 'F') x.set(E.sex_col, 1);
    return x;
  }

  function predict(asked) {
    const x = encode(asked);
    let h = Float32Array.from(L[0].b);
    for (const [c, v] of x) {
      const off = c * L[0].cols;
      for (let j = 0; j < L[0].cols; j++) h[j] += v * L[0].w[off + j];
    }
    for (let k = 1; k < L.length; k++) {
      for (let j = 0; j < h.length; j++) if (h[j] < 0) h[j] = 0;
      const o = Float32Array.from(L[k].b);
      for (let i = 0; i < L[k].rows; i++) {
        const v = h[i];
        if (!v) continue;
        const off = i * L[k].cols;
        for (let j = 0; j < L[k].cols; j++) o[j] += v * L[k].w[off + j];
      }
      h = o;
    }
    const mx = Math.max(...h);
    let sum = 0;
    const p = Array.from(h, v => { const e = Math.exp(v - mx); sum += e; return e; });
    return p.map(v => v / sum);
  }

