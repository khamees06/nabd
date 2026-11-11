    function nrFinish() {
      ns.stage = 'done';
      const c = ns.c, rows = []; let sum = 0, max = 0;
      const addRow = (title, w, frac, items) => { const pts = Math.round(w * frac * 10) / 10; rows.push({ title, pts, max: w, items }); sum += pts; max += w; };
      const keys = c.ask.filter(q => q.key);
      if (keys.length) { const got = keys.filter(q => ns.asked.has(q.id)); addRow('جمع المعلومات من المريض', 20, got.length / keys.length, keys.map(q => ({ ok: ns.asked.has(q.id), text: (ns.asked.has(q.id) ? 'سألت: ' : 'لم تسأل: ') + q.label + '.' }))); }
      const req = []; c.beats.forEach((b, i) => (b.do || []).forEach(id => { if (!req.includes(id) && (nrHas(id) || !ns.skipped.has(id))) req.push(id); }));
      if (req.length) {
        const items = req.map(id => { const a = nrAct(id), d = nrHas(id), q = d ? (ns.q[id] != null ? ns.q[id] : 1) : 0; return { q, ok: q >= 0.99, text: a.label + (d ? (ns.q[id] != null && ns.q[id] < 0.99 ? ' — نُفّذ مع أخطاء.' : ' — نُفّذ.') : ' — لم تنفّذه.') }; });
        addRow('تنفيذ الإجراءات المطلوبة', 25, items.reduce((s, x) => s + x.q, 0) / items.length, items);
      }
      if (ns.ordRes.length) addRow('التعامل مع أوامر الطبيب', 25, ns.ordRes.filter(x => x.ok).length / ns.ordRes.length, ns.ordRes);
      if (ns.repRes.length) addRow('التبليغ للطبيب (SBAR)', 15, ns.repRes.filter(x => x.ok).length / ns.repRes.length, ns.repRes);
      if (ns.hoRes.length) addRow('التسليم (ISBAR)', 15, ns.hoRes.filter(x => x.ok).length / ns.hoRes.length, ns.hoRes);
      c.ask.forEach(q => { if (q.crit && !ns.asked.has(q.id)) ns.safety.push(q.crit); });
      const raw = max ? sum / max * 100 : 0;
      const uniq = [...new Set(ns.safety)];
      const total = Math.max(0, Math.min(100, Math.round(raw - uniq.length * 15)));
      const passed = total >= 70 && uniq.length === 0;
      ns.rows = rows;
      const u = authState.user;
      const tierBefore = nbUnlockedTier(u);
      u.history = u.history || [];
      u.history.unshift({ caseTitle: c.title, mode: 'مسار التمريض (' + c.deptName + ')', date: new Date().toISOString().slice(0, 10), workupCount: 0, score: `${total}% (${passed ? 'مجتاز' : 'غير مجتاز'})`, caseId: c.id, num: total, passed, mistakes: uniq, osce: ns.osce, ts: Date.now() });
      u.stats = u.stats || {}; u.stats.completed = u.history.length; u.stats.avgSpec = total + '%';
      if (c.guided && total >= 50) { const l = nbLearn(u); if (!l.guided.includes(c.id)) l.guided.push(c.id); }
      saveAccountToStorage(u);
      const prev = u.history.slice(1).find(x => x.caseId === c.id && typeof x.num === 'number');
      document.getElementById('nurse-body').innerHTML = `
        <div class="nb-report"><div style="display:flex;gap:1.2rem;align-items:center;flex-wrap:wrap"><div class="nb-score font-num">${total}%</div><div><span class="nb-level ${passed ? 'l3' : 'l2'}">${passed ? 'مجتاز' : 'غير مجتاز'}</span><div style="font-size:.8rem;color:#425D69;margin-top:.4rem">${uniq.length ? 'أخطاء سلامة: ' + uniq.length + ' (كل خطأ يخصم 15 نقطة)' : 'بدون أخطاء سلامة.'}</div>${prev ? `<div style="font-size:.78rem;color:#425D69;margin-top:.2rem">محاولتك السابقة: ${prev.num}% ← الآن ${total}%</div>` : ''}</div></div>
        ${uniq.length ? `<div class="nb-fb bad" style="margin-top:.8rem"><b>أخطاء السلامة:</b><ul style="margin:.3rem 0 0;padding-right:1.1rem">${uniq.map(x => `<li>${nrEsc(x)}</li>`).join('')}</ul></div>` : ''}
        <div class="nb-rows" style="margin-top:.8rem">${rows.map(r => `<details class="nb-row" ${r.pts < r.max ? 'open' : ''}><summary><span>${r.title}</span><b class="font-num">${r.pts} / ${r.max}</b></summary>${r.items.map(i => `<div class="nb-fb ${i.ok ? 'ok' : 'bad'}"><b>${i.ok ? '✓' : '✗'}</b> ${nrEsc(i.text)}</div>`).join('')}</details>`).join('')}</div>
        <div class="nb-cta" style="margin-top:1rem"><button type="button" class="p" id="nurse-retry">حاول الحالة مرة أخرى</button><button type="button" class="s" id="nurse-home">العودة للرئيسية</button></div></div>`;
      document.getElementById('nurse-retry').onclick = () => nurseStart(c.id);
      document.getElementById('nurse-home').onclick = () => { navigateTo('home'); renderHomePath(authState.user); };
      const tierAfter = nbUnlockedTier(u);
      if (tierAfter > tierBefore) setTimeout(() => showToast(`تم فتح حالات مستوى «${NB_LEVELS[tierAfter].name}»`), 500);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function initNurse() {
      document.getElementById('nurse-exit')?.addEventListener('click', () => { if (confirm('الخروج سيلغي هذه المحاولة. هل تريد المتابعة؟')) { navigateTo('home'); renderHomePath(authState.user); } });
    }

