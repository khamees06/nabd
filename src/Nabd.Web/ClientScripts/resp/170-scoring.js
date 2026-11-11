  // The unasked questions whose true answers would have raised the right diagnosis most.
  function bestMissed(truth) {
    const base = S.steps[S.steps.length - 1].p[truth];
    const out = [];
    heads.forEach((n, g) => {
      if (S.asked.has(g) || !T.evidences[n] || isDerived(g)) return;
      const asked = net(S.asked); const plus = new Set(asked); plus.add(g);
      const gain = predict(plus)[truth] - base;
      if (gain > 0.02) out.push({ g, gain });
    });
    return out.sort((a, b) => b.gain - a.gain).slice(0, 3);
  }

  function spark(truth) {
    const pts = S.steps.map((s, i) => [i, s.p[truth]]);
    const n = Math.max(1, pts.length - 1);
    const path = pts.map(([i, p]) => `${(i / n * 300).toFixed(1)},${(78 - p * 70).toFixed(1)}`).join(' ');
    return `<svg class="rs-spark" viewBox="-6 0 312 86" role="img" aria-label="احتمال التشخيص الصحيح بعد كل سؤال"><line x1="0" y1="78" x2="300" y2="78"/><polyline points="${path}"/>${pts.map(([i, p]) => `<circle cx="${(i / n * 300).toFixed(1)}" cy="${(78 - p * 70).toFixed(1)}" r="2.6"><title>${esc(S.steps[i].label)}: ${pct(p)}</title></circle>`).join('')}</svg>`;
  }

  // Severity is DDXPlus's label for the disease (1 = most severe), not for this patient. Missing an
  // urgent review for 1-2 costs points; for 3 the decision depends on the patient in front of you,
  // so either answer is accepted; for the mild 4-5 an urgent call is over-triage.
  function triage(sev, urgent) {
    if (sev <= 2) return { ok: urgent, html: `<p class="rs-danger"><b>حالة قد تسوء بسرعة.</b> ${urgent ? 'أحسنت، طلبت تقييماً عاجلاً.' : 'كان يجب أن تطلب تقييماً عاجلاً من الطبيب.'}</p>` };
    if (sev === 3) return { ok: true, html: '<p class="rs-warnline">مرض متوسط الخطورة: قرار التقييم العاجل يعتمد على حال المريض (التنفس والأكسجين والوعي)، فلم نخصم على أي اختيار.</p>' };
    return { ok: !urgent, html: urgent ? '<p class="rs-warnline">الحالة بسيطة غالباً، ولم تكن تحتاج تقييماً عاجلاً.</p>' : '' };
  }
  // History is part of the skill: question points start at three questions.
  const qPoints = asked => (asked < 3 ? 0 : Math.max(0, 15 - Math.max(0, asked - 10)));

