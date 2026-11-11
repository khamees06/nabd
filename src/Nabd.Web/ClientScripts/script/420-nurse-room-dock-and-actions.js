    /* ----- dock (ask / measure / procedures / meds) ----- */
    function nrDock() {
      if (!ns) return;
      const strip = document.getElementById('nr-strip');
      if (strip) {
        strip.innerHTML = ns.c.ask.map(q => `<button type="button" class="${ns.asked.has(q.id) ? 'used' : ''}" data-id="${q.id}">${nrEsc(q.label)}${ns.asked.has(q.id) ? ' ✓' : ''}</button>`).join('');
        strip.querySelectorAll('button').forEach(b => b.onclick = () => nrAsk(b.dataset.id));
      }
      const tabs = document.getElementById('nr-tabs'), list = document.getElementById('nr-list'); if (!tabs || !list) return;
      if (ns.tab === 'ask') ns.tab = 'measure';
      tabs.innerHTML = NR_TABS.filter(t => t[0] !== 'ask').map(([k, t]) => `<button type="button" role="tab" aria-selected="${ns.tab === k}" class="${ns.tab === k ? 'on' : ''}" data-t="${k}">${t}</button>`).join('');
      tabs.querySelectorAll('button').forEach(b => b.onclick = () => { ns.tab = b.dataset.t; nrDock(); });
      const ids = ns.order[ns.tab];
      list.innerHTML = ids.map(id => { const a = nrAct(id); const used = ns.done.has(id); return `<button type="button" class="nr-chip ${used ? 'used' : ''}" data-id="${id}"><span>${nrEsc(a.label)}</span>${used ? '<i>✓</i>' : ''}</button>`; }).join('') || '<p class="nr-empty">لا توجد عناصر هنا.</p>';
      list.querySelectorAll('.nr-chip').forEach(b => b.onclick = () => nrDoAct(b.dataset.id));
    }
    function nrNorm(t) { return String(t).replace(/[ً-ٟـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[؟?!.,،:؛()]/g, ' ').toLowerCase(); }
    function nrMatchAsk(text) {
      const stop = new Set(['هل', 'ماذا', 'كم', 'متي', 'عن', 'في', 'من', 'على', 'انت', 'عندك', 'لديك', 'كان', 'كيف', 'اين']);
      const tk = nrNorm(text).split(/\s+/).filter(w => w.length > 2 && !stop.has(w));
      let best = null, bs = 0;
      ns.c.ask.forEach(q => { const hay = nrNorm(q.label + ' ' + q.q); let sc = 0; tk.forEach(w => { const w2 = w.replace(/^(ال|و|ب|ل)/, ''); if (w2.length > 2 && hay.includes(w2)) sc++; }); if (sc > bs) { bs = sc; best = q; } });
      return bs >= 1 ? best : null;
    }
    function nrSend() {
      const inp = document.getElementById('nr-input'); if (!inp || !ns || ns.stage === 'done') return;
      const t = inp.value.trim(); if (!t) return; inp.value = '';
      nrSay('nurse', t);
      const q = nrMatchAsk(t);
      if (q) { nrSay('patient', q.a); ns.asked.add(q.id); ns.clock += 1; nrMonitor(); nrDock(); }
      else nrSay('patient', 'عذراً، لم أفهم. أعد صياغة سؤالك أو اختر من الأسئلة أدناه.');
    }
    function nrAsk(id) {
      if (!ns || ns.stage === 'done') return;
      const q = ns.c.ask.find(x => x.id === id); if (!q) return;
      nrSay('nurse', q.q); nrSay('patient', q.a);
      ns.asked.add(id); ns.clock += 1; nrMonitor(); nrDock();
    }

    /* ----- actions ----- */
    function nrMissing(a) {
      if (a.id === 'news2') { const need = ['hr', 'bp', 'rr', 'spo2', 'temp', 'avpu'].filter(k => !ns.shown.has(k)); return need.length ? 'قياس العلامات الحيوية كاملة (' + need.map(k => NR_VN[k]).join('، ') + ')' : ''; }
      if (!a.requires) return '';
      const ra = nrAct(a.requires);
      if (ra) return (nrHas(a.requires) || ns.skipped.has(a.requires)) ? '' : ra.label;
      return ns.shown.has(a.requires) ? '' : 'قياس ' + (NR_VN[a.requires] || a.requires);
    }
    function nrDoAct(id) {
      if (!ns || ns.stage === 'done' || ns.overlay) return;
      const a = nrAct(id); if (!a) return;
      if (ns.done.has(id) && a.g !== 'measure') { nrSay('sys', 'هذا الإجراء نُفّذ مسبقاً.'); return; }
      const miss = nrMissing(a);
      if (miss) { nrSay('coach', 'لا يمكنك هذا الآن. أنجز أولاً: ' + miss + '.'); return; }
      if (a.seq) return nrOpenSeq(a);
      if (a.calc) return nrOpenCalc(a);
      if (a.chk) return nrOpenChk(a);
      nrApply(a);
    }
    function nrApply(a, text, notes) {
      ns.done.add(a.id); ns.clock += a.min || 0;
      if (a.g === 'med' && !a.unsafe) {
        const ok = ns.authed.has(a.id) || (a.alt && ns.authed.has(a.alt));
        if (!ok) { ns.safety.push('إعطاء دواء أو محلول دون أمر طبي: ' + a.label + '.'); nrCoach('لم يصدر أمر طبي بهذا الدواء بعد. لا يُعطى دواء دون أمر.'); }
      }
      if (a.patch) Object.assign(ns.v, a.patch);
      const r = text != null ? text : (a.rf ? a.rf(ns) : a.r);
      (a.reveal || []).forEach(k => ns.shown.add(k));
      if (a.id === 'news2') ns.news2 = nbNews2(ns.v);
      nrSay('action', r, { title: a.label });
      (notes || []).forEach(nrCoach);
      if (a.unsafe) { ns.safety.push(a.unsafe); nrBad(a.bad); }
      nrMonitor(); nrDock(); nrSideOrders(); nrCheck();
    }
