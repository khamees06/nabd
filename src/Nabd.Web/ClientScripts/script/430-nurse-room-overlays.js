    function nrOpenSeq(a) {
      const s = a.seq;
      const items = [...s.steps.map((t, i) => ({ t, i })), ...(s.extra || []).map((e, j) => ({ t: e.t, i: -1 - j, unsafe: e.unsafe }))];
      ns.overlay = { type: 'seq', a, items, order: nbShuffle(items.length), mine: [] };
      nrRenderPrompt();
    }
    function nrOpenCalc(a) { ns.overlay = { type: 'calc', a }; nrRenderPrompt(); }
    // Surgical safety checklist: the student marks each item as matching or as a problem.
    function nrOpenChk(a) { ns.overlay = { type: 'chk', a, marks: a.chk.items.map(() => null) }; nrRenderPrompt(); }
    function nrChkOverlay(p, ov) {
      const a = ov.a, c = a.chk;
      p.innerHTML = `<div class="nr-p nr-ov nb-chk"><div class="nr-p-h">${nrEsc(nbBidi(a.label))}</div><p class="nr-p-s">${nrEsc(c.q)}</p><ol class="nb-chk-list">${c.items.map((it, k) => `<li><span>${nrEsc(nbBidi(it.t))}</span><div class="nb-chk-b" role="group"><button type="button" data-k="${k}" data-v="1" aria-pressed="false">مطابق</button><button type="button" data-k="${k}" data-v="0" aria-pressed="false">يوجد خلل</button></div></li>`).join('')}</ol><div class="nb-cta" style="margin-top:.6rem"><button type="button" class="p" id="chk-ok">تأكيد القائمة</button><button type="button" class="g" id="chk-cancel">إلغاء</button></div></div>`;
      const sync = () => {
        p.querySelectorAll('.nb-chk-b button').forEach(b => { const on = ov.marks[+b.dataset.k] === +b.dataset.v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
        document.getElementById('chk-ok').disabled = ov.marks.some(m => m === null);
      };
      p.querySelectorAll('.nb-chk-b button').forEach(b => b.onclick = () => { ov.marks[+b.dataset.k] = +b.dataset.v; sync(); });
      sync();
      document.getElementById('chk-cancel').onclick = () => { ns.overlay = null; nrRenderPrompt(); };
      document.getElementById('chk-ok').onclick = () => {
        if (ov.marks.some(m => m === null)) { showToast('راجع كل البنود أولاً.'); return; }
        let right = 0; const notes = [];
        c.items.forEach((it, k) => {
          const saidOk = ov.marks[k] === 1;
          if (saidOk === it.ok) { right++; if (!it.ok) notes.push('أحسنت، أوقفت الفريق عند: ' + it.t + '. ' + it.why); }
          else if (!it.ok) { ns.safety.push(it.unsafe); notes.push('فاتك خلل: ' + it.t + '. ' + it.why); }
          else notes.push('هذا البند كان سليماً: ' + it.t + '.');
        });
        ns.q[a.id] = right / c.items.length;
        ns.overlay = null;
        nrApply(a, right === c.items.length ? 'اكتملت قائمة التحقق بمراجعة صحيحة لكل البنود.' : 'اكتملت قائمة التحقق، لكن المراجعة فاتها شيء.', notes);
        if (window.matchMedia('(max-width: 1023px)').matches) requestAnimationFrame(() => document.getElementById('nr-prompt')?.scrollIntoView({ block: 'end', behavior: 'smooth' }));
      };
    }
    function nrOverlay(p) {
      const ov = ns.overlay, a = ov.a;
      if (ov.type === 'chk') return nrChkOverlay(p, ov);
      if (ov.type === 'seq') {
        const s = a.seq;
        p.innerHTML = `<div class="nr-p nr-ov"><div class="nr-p-h">${nrEsc(a.label)}</div><p class="nr-p-s">${nrEsc(s.q)}</p><div class="nb-seq"><div><h4>الخطوات المتاحة</h4><div id="seq-pool"></div></div><div><h4>ترتيبك</h4><ol id="seq-mine"></ol></div></div><div class="nb-cta" style="margin-top:.6rem"><button type="button" class="p" id="seq-ok">نفّذ الإجراء</button><button type="button" class="s" id="seq-undo">تراجع</button><button type="button" class="g" id="seq-cancel">إلغاء</button></div></div>`;
        const draw = () => {
          document.getElementById('seq-pool').innerHTML = ov.order.map(o => ov.items[o]).filter(it => !ov.mine.includes(it)).map(it => `<button type="button" class="nb-chip" data-id="${ov.items.indexOf(it)}">${nrEsc(it.t)}</button>`).join('');
          document.getElementById('seq-mine').innerHTML = ov.mine.map(it => `<li>${nrEsc(it.t)}</li>`).join('');
          p.querySelectorAll('.nb-chip').forEach(b => b.onclick = () => { ov.mine.push(ov.items[+b.dataset.id]); draw(); });
        };
        draw();
        document.getElementById('seq-undo').onclick = () => { ov.mine.pop(); draw(); };
        document.getElementById('seq-cancel').onclick = () => { ns.overlay = null; nrRenderPrompt(); };
        document.getElementById('seq-ok').onclick = () => {
          const mine = ov.mine; if (!mine.length) { showToast('اختر الخطوات أولاً.'); return; }
          const n = s.steps.length; let match = 0; mine.forEach((it, pos) => { if (it.i === pos) match++; });
          const wrong = mine.filter(it => it.i < 0);
          wrong.forEach(it => { if (it.unsafe) ns.safety.push(it.unsafe); });
          const perfect = match === n && !wrong.length && mine.length === n;
          ns.q[a.id] = Math.max(0, match / n - wrong.length * 0.15);
          ns.overlay = null;
          nrApply(a, perfect ? 'تم تنفيذ الإجراء بالتسلسل الصحيح وبتعقيم سليم.' : 'تم تنفيذ الإجراء لكن ترتيب الخطوات أو بعضها لم يكن صحيحاً.');
          if (!perfect) {
            const ex = wrong.map(it => 'خطوة خاطئة: ' + it.t + (it.unsafe ? ' (' + it.unsafe + ')' : '')).join(' — ');
            nrCoach('الترتيب الصحيح: ' + s.steps.map((t, i) => (i + 1) + '. ' + t).join(' / ') + (ex ? ' — ' + ex : ''));
          }
        };
      } else {
        const c = a.calc;
        p.innerHTML = `<div class="nr-p nr-ov"><div class="nr-p-h">${nrEsc(a.label)}</div><p class="nr-p-s">${nrEsc(c.q)}</p><div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap"><input id="calc-in" type="number" class="nb-calc" placeholder="الناتج" /><span>${nrEsc(c.unit)}</span></div><div class="nb-cta" style="margin-top:.6rem"><button type="button" class="p" id="calc-ok">تأكيد</button><button type="button" class="g" id="calc-cancel">إلغاء</button></div></div>`;
        document.getElementById('calc-cancel').onclick = () => { ns.overlay = null; nrRenderPrompt(); };
        document.getElementById('calc-ok').onclick = () => {
          const v = parseFloat(document.getElementById('calc-in').value); if (isNaN(v)) { showToast('أدخل رقماً.'); return; }
          const ok = Math.abs(v - c.ans) <= c.tol;
          ns.q[a.id] = ok ? 1 : 0; ns.overlay = null;
          if (!ok && c.crit) ns.safety.push(c.crit);
          nrApply(a, ok ? a.r : 'ضُبط الجهاز على ' + v + ' ' + c.unit + '. (الحساب غير صحيح)');
          if (!ok) nrCoach('الناتج الصحيح ' + c.ans + ' ' + c.unit + '. ' + c.why);
        };
      }
    }

