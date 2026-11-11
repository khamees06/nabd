  // 2026-11-08: a missed fact is quoted in the patient's or the relative's own words, so the page's English terms leave
  // it alone; a missed examination finding is the room's clinical line and reads like the chat.
  const quoteOf = (f, said) => (E.c.exam.includes(f) ? esc(said) : `<span data-no-terms>${esc(said)}</span>`);
  /* phase8 2026-11-07 (made a helper for the nurse report, 2026-11-07): the tests table rows, in order of time.
     src adds the nurse report's «المصدر» column; the doctor report passes none and is unchanged. */
  const justCell = t => {
    if (!offInd(t)) return '—';
    if (t.justOk === undefined) return 'لم تكتب تبريراً';
    return `${t.justify ? `<span data-no-terms>${esc(t.justify)}</span>` : 'لم تكتب تبريراً'}<small class="${t.justOk ? 'j-ok' : 'j-no'}">${t.justOk ? 'مقبول' : 'غير مقنع'}</small>`;
  };
  const testRows = (reasoned, src) => Object.values(E.tests).sort((a, b) => a.at - b.at).map(t => `<tr${offInd(t) ? ' class="is-off"' : ''}><td><span dir="ltr">${esc(testOf(t.id).en)}</span>${offInd(t) ? `<span class="er-off-badge">${OFF_BADGE}</span>` : ''}</td><td class="font-num" dir="ltr">${clk(t.at)}</td><td class="i-${t.ind}">${IND[t.ind]}</td>${src ? `<td>${src(t)}</td>` : ''}${reasoned ? `<td>${RSN[t.reasonOk] || ''}${t.reason ? `<small data-no-terms>${esc(t.reason)}</small>` : ''}</td>` : ''}<td>${justCell(t)}</td><td>${esc(t.why || '')}</td></tr>`).join('');

  function chart() {
    const W = 640, H = 150, pts = E.riskLog, maxT = Math.max(1, pts[pts.length - 1][0]);
    const x = t => 8 + t / maxT * (W - 16), y = r => H - 10 - r / 100 * (H - 20);
    const line = pts.map(p => x(p[0]).toFixed(1) + ',' + y(p[1]).toFixed(1)).join(' ');
    const R = E.c.risk;
    const marks = E.log.filter(l => l.type === 'action' || l.type === 'harm').map(l => `<circle cx="${x(l.at).toFixed(1)}" cy="${y(riskAt(l.at)).toFixed(1)}" r="4" class="${l.type === 'harm' ? 'm-harm' : 'm-act'}"><title>${esc(l.text)}</title></circle>`).join('');
    return `<svg class="er-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="نسبة الخطر خلال الحالة"><text class="t" x="10" y="16">100%</text><text class="t" x="10" y="${H - 12}">0%</text><text class="t" x="${W - 10}" y="${H - 12}" text-anchor="end">${mm(maxT)}</text><line class="g-crit" x1="8" x2="${W - 8}" y1="${y(R.critical)}" y2="${y(R.critical)}"/><line class="g-urg" x1="8" x2="${W - 8}" y1="${y(R.urgent)}" y2="${y(R.urgent)}"/><polyline points="${line}"/>${marks}</svg>`;
  }
  const riskAt = t => { let r = E.riskLog[0][1]; for (const p of E.riskLog) { if (p[0] > t) break; r = p[1]; } return r; };
  const mm = t => { const m = Math.floor(t), s = Math.floor((t % 1) * 60); return `${m}:${String(s).padStart(2, '0')}`; };
  const IND = { indicated: 'مناسب', acceptable: 'مقبول', no: 'غير مطابق للاستطباب', harm: 'خطر الآن' };
  const RSN = { good: 'مبرّر', weak: 'تبرير ضعيف', none: 'بلا تبرير', ungraded: 'لم يُقيَّم' };

