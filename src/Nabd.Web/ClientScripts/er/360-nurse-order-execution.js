  // A drug that names a different agent than the order (ceftriaxone for levofloxacin).
  function agentClash(id, text, exec) {
    const lim = (((E.c.care[id] || {}).limits) || (actOf(id) || {}).limits || []).filter(l => l.kw);
    const t = norm(text), x = norm(exec || '');
    const inT = lim.filter(l => hasAny(t, l.kw)), inX = lim.filter(l => hasAny(x, l.kw));
    return inT.length > 0 && !inT.some(l => inX.includes(l));
  }
  // The dose typed against the dose ordered, in base units (per hour for rates), with a little rounding room.
  function sameDose(typed, exec) {
    const a = doseOf(typed), b = doseOf(exec);
    if (!a || a.unsure || !b) return true;
    if (a.kind && b.kind && a.kind !== b.kind) return false;
    if (!!a.perTime !== !!b.perTime && a.kind) return false;
    const base = d => { const by = d.kind ? d.by : (b.kind ? b.by : 1), k = d.perKg ? (E.c.kg || 1) : 1, per = d.perTime && !d.hour ? 60 : 1; return [d.lo * by * k * per, d.hi * by * k * per]; };
    const [alo, ahi] = base(a), [blo, bhi] = base(b);
    return alo >= blo * 0.85 - 1e-9 && ahi <= bhi * 1.15 + 1e-9;
  }
  // Giving what the doctor ordered: the right agent, the dose as written, then the room's usual physiology.
  function nurseExec(ord, a, text) {
    const id = ord.id, meta = actOf(id), care = E.c.care[id] || {};
    if (text && ((care.allergyKw && allergicTo({ ...a, agent: a.agent || '' }, care, text)) || agentClash(id, text, ord.exec))) { scopeGap('act', id, 'wrong-agent', ord); return; }
    if (ord.reminder) {
      if (id === 'oxygen') { ownOxygen(a.dose ? a : { ...a, dose: ord.exec }, text); return; }
      order({ ...a, dose: a.dose || ord.exec }, text);
      return;
    }
    let dose = a.dose || '';
    // "علقتله لتر سلاين": a litre with no number is still one litre.
    if (!dose && id === 'fluids' && /(?:^| )(?:لتر|ليتر)(?: |$)/.test(norm(text || ''))) dose = '1 L';
    if (dose && (!sameDose(dose, ord.exec) || doseBad({ id, dose, said: text }, care, text))) {
      const ref = ord.pick ? ord.pick : ord.show || ord.exec;
      E.wrongDoses.push({ id, ar: meta.ar, dose, ref });
      log('dose', 'جرعة مختلفة عن الأمر: ' + meta.ar + ' ' + dose);
      sys('لم يُعطَ: الجرعة التي كتبتها تختلف عن أمر الطبيب (' + ref + ').');
      return;
    }
    order({ ...a, id, agent: '', dose: ord.exec, _asked: true, _ok: 'good' }, text);
  }
