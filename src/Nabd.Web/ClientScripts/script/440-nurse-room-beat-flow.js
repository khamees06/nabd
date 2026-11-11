    /* ----- beat flow ----- */
    function nrNextBeat() {
      ns.bi++;
      if (ns.bi >= ns.c.beats.length) return nrStartHandoff();
      const b = ns.c.beats[ns.bi];
      ns.waive = false; ns.postShown = false; ns.ri = 0;
      if (b.sys) nrSay('sys', b.sys);
      if (b.doc) nrSay('doctor', b.doc);
      if (b.ord) ns.stage = 'order';
      else { ns.stage = 'acts'; (b.do || []).forEach(id => ns.authed.add(id)); }
      nrSideOrders(); nrRenderPrompt(); nrGuide();
      if (ns.stage === 'acts') nrCheck();
    }
    function nrGuide() {
      const g = document.getElementById('nr-guide'); if (!g) return;
      const b = ns.c.beats[ns.bi];
      g.innerHTML = (ns.c.guided && !ns.osce && b && b.hint) ? `<div class="nb-hint">تلميح: ${nrEsc(b.hint)}</div>` : '';
    }
    function nrCheck() {
      if (!ns || ns.stage !== 'acts') return nrRenderPrompt();
      const b = ns.c.beats[ns.bi]; if (!b) return;
      const pend = (b.do || []).filter(id => !nrHas(id));
      if (pend.length && !ns.waive) return nrRenderPrompt();
      if (b.post && !ns.postShown) {
        ns.postShown = true;
        if (b.post.labs) nrSayHtml(nbLabsTable(b.post.labs), 'action');
        if (b.post.img) nrSayHtml(`${nbImg(b.post.img.key, 'nr-img')}<p class="nr-cap">${nrEsc(b.post.img.cap)}</p>`, 'action');
      }
      if (b.rep && b.rep.length) { ns.stage = 'report'; ns.ri = 0; return nrRenderPrompt(); }
      nrEndBeat();
    }
    function nrEndBeat() { ns.bdone.add(ns.bi); nrNextBeat(); }
    function nrOrd(choice) {
      const b = ns.c.beats[ns.bi], o = b.ord; if (!o || ns.stage !== 'order') return;
      const say = ['حاضر، سأنفّذ الأمر.', 'أريد أن أتأكد من الأمر قبل أن أنفّذه.', 'لن أنفّذ هذا الأمر لأنه غير آمن لهذا المريض، وأبلغك بذلك.'][choice];
      nrSay('nurse', say);
      const safeOrder = o.a === 0;
      const ok = safeOrder ? choice === 0 : choice !== 0;
      ns.clock += 1;
      if (ok) {
        if (!safeOrder) { nrSay('doctor', o.reply || 'أحسنت.'); nrCoach('الأمر غير آمن: ' + o.why + (choice === 1 ? '' : ' (الاستيضاح أولاً ثم الرفض عند الحاجة هو الأفضل.)')); }
        (b.do || []).forEach(id => ns.authed.add(id));
      } else if (safeOrder) {
        nrSay('doctor', 'هذا أمر قياسي وآمن، يمكنك تنفيذه.'); nrCoach(o.why);
        (b.do || []).forEach(id => ns.authed.add(id));
      } else {
        ns.safety.push(o.crit || 'نُفّذ أمر غير آمن.');
        nrBad(o.bad); nrCoach(o.why);
        ns.waive = true; (b.do || []).forEach(id => ns.skipped.add(id));
      }
      ns.ordRes.push({ ok, text: '«' + b.doc + '» ' + (ok ? (safeOrder ? 'نُفّذ بشكل صحيح.' : 'تصرفت بأمان: ' + o.why) : (safeOrder ? 'كان أمراً قياسياً وآمناً ويُنفَّذ. ' : 'نُفّذ أمر غير آمن. ') + o.why) });
      ns.stage = 'acts'; nrSideOrders(); nrCheck();
    }
    function nrRep(orig) {
      const b = ns.c.beats[ns.bi], r = b.rep[ns.ri]; if (!r || ns.stage !== 'report') return;
      nrSay('nurse', r.o[orig]);
      const ok = orig === 0;
      if (ok) { if (r.reply) nrSay('doctor', r.reply); }
      else { nrSay('doctor', 'البلاغ غير مكتمل أو غير دقيق. سأتابع بنفسي.'); nrCoach('الأفضل: ' + r.o[0] + ' — ' + r.why); const cr = r.crit && r.crit[orig]; if (cr) ns.safety.push(cr); }
      ns.repRes.push({ ok, text: r.q + ' ' + (ok ? r.why : 'الأفضل: ' + r.o[0] + ' — ' + r.why) });
      ns.ri++;
      if (ns.ri >= b.rep.length) nrEndBeat(); else nrRenderPrompt();
    }
    function nrStartHandoff() {
      ns.stage = 'handoff'; ns.hi = 0; ns.bi = ns.c.beats.length;
      nrSay('sys', 'انتهت المهمة العاجلة. سلّم الحالة إلى «' + ns.c.handoff.to + '» بصيغة ISBAR.');
      nrSideOrders(); nrRenderPrompt();
    }
    function nrHo(orig) {
      const it = ns.c.handoff.items[ns.hi]; if (!it || ns.stage !== 'handoff') return;
      nrSay('nurse', it.o[orig]);
      const ok = orig === it.a;
      if (!ok) nrCoach('الأفضل: ' + it.o[it.a] + ' — ' + it.why);
      ns.hoRes.push({ ok, text: it.q + ': ' + (ok ? it.why : 'الأفضل: ' + it.o[it.a] + ' — ' + it.why) });
      ns.hi++;
      if (ns.hi >= ns.c.handoff.items.length) nrFinish(); else nrRenderPrompt();
    }
    function nrOptsHtml(arr, cls) {
      const order = nbShuffle(arr.length); ns.shuf = order;
      return order.map((oi, j) => `<button type="button" class="nb-opt ${cls}" data-oi="${oi}"><b>${'أبجد'[j]}</b><span>${nrEsc(arr[oi])}</span></button>`).join('');
    }
    function nrRenderPrompt() {
      const p = document.getElementById('nr-prompt'); if (!p || !ns) return;
      if (ns.stage === 'done') { p.innerHTML = ''; return; }
      if (ns.overlay) { nrOverlay(p); nrPinFeed(); nrRevealPrompt(p); return; }
      const b = ns.c.beats[ns.bi];
      if (ns.stage === 'order') {
        p.innerHTML = `<div class="nr-p"><div class="nr-p-h">أمر من الطبيب: كيف تتصرف؟</div><div class="nr-opts3"><button type="button" data-c="0">نفّذ الأمر</button><button type="button" data-c="1">استوضح من الطبيب</button><button type="button" data-c="2">ارفض وأبلغ</button></div></div>`;
        p.querySelectorAll('[data-c]').forEach(x => x.onclick = () => nrOrd(+x.dataset.c));
      } else if (ns.stage === 'acts') {
        const pend = (b.do || []).filter(id => !nrHas(id)).map(nrAct).filter(Boolean);
        p.innerHTML = pend.length ? `<div class="nr-wait"><b>دورك الآن</b><span>نفّذ المطلوب من «الإجراءات» أو اسأل المريض.</span>${ns.c.guided && !ns.osce ? '<ul>' + pend.map(a => `<li>${nrEsc(a.label)}</li>`).join('') + '</ul>' : ''}</div>` : '';
      } else if (ns.stage === 'report') {
        const r = b.rep[ns.ri];
        p.innerHTML = `<div class="nr-p"><div class="nr-p-h">${nrEsc(r.q)}</div>${nrOptsHtml(r.o, 'nr-o')}</div>`;
        p.querySelectorAll('.nr-o').forEach(x => x.onclick = () => nrRep(+x.dataset.oi));
      } else if (ns.stage === 'handoff') {
        const it = ns.c.handoff.items[ns.hi];
        p.innerHTML = `<div class="nr-p"><div class="nr-p-h">${nrEsc(it.q)}</div>${nrOptsHtml(it.o, 'nr-h')}</div>`;
        p.querySelectorAll('.nr-h').forEach(x => x.onclick = () => nrHo(+x.dataset.oi));
      }
      nrPinFeed();
      if (ns.stage !== 'acts') nrRevealPrompt(p);
    }
    function nrPinFeed() { const f = document.getElementById('nr-feed'); if (!f) return; const pin = () => { f.scrollTop = f.scrollHeight; }; requestAnimationFrame(pin); f.querySelectorAll('img').forEach(i => { if (!i.complete) i.addEventListener('load', pin, { once: true }); }); }
    function nrRevealPrompt(p) { if (!window.matchMedia('(max-width: 1023px)').matches) return; requestAnimationFrame(() => p.scrollIntoView({ block: 'nearest', behavior: 'smooth' })); }
    function nrHint() {
      if (!ns || ns.stage === 'done') return;
      if (ns.osce) { showToast('التلميحات معطّلة في وضع الامتحان.'); return; }
      const b = ns.c.beats[ns.bi];
      if (ns.stage === 'order') return nrCoach('اسأل نفسك: هل الأمر آمن لهذا المريض (الحساسية، الجرعة، الأدوية الأخرى)؟ إن شككت فاستوضح.');
      if (ns.stage === 'acts' && b) {
        const pend = (b.do || []).filter(id => !nrHas(id)).map(nrAct).filter(Boolean)[0];
        if (b.hint) nrCoach(b.hint);
        if (pend) nrCoach('ابحث في تبويب «' + ({ measure: 'قياسات', proc: 'إجراءات', med: 'أدوية ومحاليل' }[pend.g] || '') + '».');
        return;
      }
      if (ns.stage === 'report') return nrCoach('البلاغ الجيد يبدأ بالمريض والمشكلة، ثم الأرقام، ثم الحساسية والخلفية، ثم ما تطلبه.');
      if (ns.stage === 'handoff') return nrCoach('في التسليم: الوضع بالأرقام، الخلفية والحساسية وما أُعطي أو رُفض، التقييم، ثم التوصية بما يلزم بعدك.');
    }

