  // The room answers an order: the numbers move, the nurse says how, and the patient says how he feels.
  // Treatments given close together are answered together, in one line.
  function answerLater(meta, before, ramp) {
    const at = E.sim + ramp + 0.1;
    if (E.resp) { E.resp.names.push(meta.ar); E.resp.ids.push(meta.id); E.resp.at = Math.max(E.resp.at, at); return; }
    E.resp = { names: [meta.ar], ids: [meta.id], before, at, risk: E.risk };
    const fire = () => {
      if (!E || E.over || !E.resp) return;
      if (E.sim < E.resp.at - 0.001) { E.jobs.push({ at: E.resp.at, fn: fire }); return; }
      const x = E.resp;
      E.resp = null;
      // A dying patient's numbers can fall on their own: that is no credit to the drug.
      if (E.stage < 3 && E.risk <= x.risk + 2) respond(x.names, x.ids, x.before);
    };
    E.jobs.push({ at, fn: fire });
  }
  // What a nurse calls each treatment when she says what it did.
  const SPOKEN = { oxygen: 'الأكسجين', fluids: 'السوايل', antibiotics: 'المضاد', neb_salbutamol: 'البخار', neb_ipratropium: 'البخار', steroid: 'الكورتيزون', magnesium: 'المغنيسيوم', adrenaline: 'الأدرينالين', noradrenaline: 'النورأدرينالين', atropine: 'الأتروبين', nitrate: 'النترات', diuretic: 'المدر', insulin: 'الإنسولين', potassium: 'البوتاسيوم', opioid: 'المسكّن', sit_up: 'القعدة', airway: 'التنفس الصناعي', anticoag: 'المميع', aspirin: 'الأسبرين', iv_access: 'الكانيولا' };
  function respond(names, ids, before) {
    if (!E || E.over) return;
    E.bpAt = 0;
    paint();
    const v = live(), n = k => Math.round(v[k]), b = k => Math.round(before[k]);
    const parts = [];
    // Said the way a nurse says it at the bedside, not a chart entry.
    if (n('spo2') - b('spo2') >= 2) parts.push(`الـSpO2 طلعت من ${b('spo2')} لـ${n('spo2')}`);
    if (b('rr') - n('rr') >= 3) parts.push(`التنفس نزل من ${b('rr')} لـ${n('rr')}`);
    if (b('hr') - n('hr') >= 5) parts.push(`النبض نزل من ${b('hr')} لـ${n('hr')}`);
    else if (n('hr') - b('hr') >= 8 && before.hr < 60) parts.push(`النبض طلع من ${b('hr')} لـ${n('hr')}`);
    if (n('sbp') - b('sbp') >= 5 || (E.c.hyper && b('sbp') - n('sbp') >= 8)) parts.push(`الضغط صار ${n('sbp')} على ${n('dbp')}`);
    if (!parts.length) return;
    const who = [...new Set(ids.map((id, i) => SPOKEN[id] || names[i]))].join(' و');
    nurse(`بعد ${who}، ${parts.join('، و')}.`);
    // The relative sees it too.
    E.anx = clamp(E.anx - 5, 0, 100);
    if (!E.vtNow && E.stage < 3) {
      const by = E.c.improveBy || {}, own = ids.find(id => by[id] && !E.saidBy.has(id));
      if (own) E.saidBy.add(own);
      const line = own ? by[own] : E.improved < (E.c.improve || []).length ? E.c.improve[E.improved++] : '';
      if (line) later(0.08, () => person('p', line));
    }
  }

  // A message with three orders gets one "حاضر، X، وY، وZ." and one "done" line, not six lines.
  const joinSaid = list => list.map(([t, name]) => t.replace(/^حاضر[،.]?\s*/, '').replace(/[.。]\s*$/, '').trim() || name).join('، و');
  function sayBack(text, name, dose) {
    if (NM() && E.nurse.docDoing) return;
    if (E.rbBuf) E.rbBuf.push([text, name, dose]);
    else nurse(text, 'نُفِّذ: ' + name + (dose ? ' (' + dose + ')' : '') + '.');
  }
  function flushBack() {
    const list = E.rbBuf || [];
    E.rbBuf = null;
    if (NM()) { if (list.length) sys('نُفِّذ: ' + list.map(([, n, d]) => n + (d ? ' (' + d + ')' : '')).join('، و') + '.'); return; }
    if (list.some(x => x[3])) { const rb = list.filter(x => !x[3]), dn = list.filter(x => x[3]); nurse([rb.length ? (rb.length === 1 ? rb[0][0] : 'حاضر، ' + joinSaid(rb) + '.') : '', dn.length ? dn.map(x => x[0].replace(/[.。]\s*$/, '')).join('، و') + '.' : ''].filter(Boolean).join(' ')); return; }
    if (list.length === 1) nurse(list[0][0]);
    else if (list.length > 1) nurse(`حاضر، ${joinSaid(list)}.`);
  }
  function sayDone(text) {
    if (!E.doneBuf) { E.doneBuf = []; later(0.005, () => { const list = E.doneBuf || []; E.doneBuf = null; if (list.length) nurse(list.length === 1 ? list[0] : list.map(t => t.replace(/[.。]\s*$/, '')).join('، و') + '.'); }); }
    E.doneBuf.push(text);
  }

