  function bodyMap() {
    const marks = [];
    KINDS.forEach(([ev, kind, label]) => {
      if (!S.asked.has(M.encoder.ev_group[evIndex[ev]])) return;
      (S.tok.get(ev) || []).forEach(v => { if (LOC[v]) marks.push({ kind, label, v, at: LOC[v] }); });
    });
    const host = $('rs-body');
    if (!marks.length) { host.hidden = true; return; }
    host.hidden = false;
    const fig = view => {
      const own = marks.filter(m => m.at[0] === view);
      // When everything marked in a view sits on the head and neck, zoom in on them.
      const zoom = own.length && own.every(m => m.at[2] < 100);
      const box = zoom ? '40 0 120 108' : '0 0 200 444';
      const r = zoom ? 2.4 : 5;
      const pains = own.filter(m => m.kind === 'pain');
      const lines = own.filter(m => m.kind === 'spread').flatMap(s => pains.map(p => `<line class="rs-spread-line" x1="${p.at[1]}" y1="${p.at[2]}" x2="${s.at[1]}" y2="${s.at[2]}" style="stroke-width:${zoom ? 0.8 : 1.6}"/>`)).join('');
      const dots = own.map(m => `<circle class="rs-dot k-${m.kind}" cx="${m.at[1]}" cy="${m.at[2]}" r="${r}" style="stroke-width:${zoom ? 0.8 : 1.5}"><title>${esc(m.label + ': ' + (T.values[m.v] || m.v))}</title></circle>`).join('');
      return `<figure><svg viewBox="${box}" role="img" aria-label="${view === 'f' ? 'الجسم من الأمام' : 'الجسم من الخلف'}">${FIGURE}${lines}${dots}</svg><figcaption>${view === 'f' ? 'من الأمام' : 'من الخلف'}</figcaption></figure>`;
    };
    const legend = KINDS.filter(([, kind]) => marks.some(m => m.kind === kind)).map(([, kind, label]) =>
      `<li><i class="k-${kind}"></i>${label}: ${esc(joinAr([...new Set(marks.filter(m => m.kind === kind).map(m => T.values[m.v] || m.v))]))}</li>`).join('');
    host.innerHTML = `<h3>أين يشعر المريض؟</h3><div class="rs-figs">${fig('f')}${fig('b')}</div><ul class="rs-legend">${legend}</ul>`;
  }

