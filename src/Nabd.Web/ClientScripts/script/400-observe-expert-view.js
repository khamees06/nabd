    /* ---------------------------- OBSERVE VIEW ---------------------------- */
    let obs = { demo: null, i: 0, auto: null };
    function obsStart(id) {
      navigateTo('home'); return;
      const d = NB_DEMOS[id]; if (!d) return;
      obs = { demo: d, i: -1, auto: null };
      document.getElementById('obs-badge').textContent = 'مشاهدة خبير · ' + d.who;
      document.getElementById('obs-title').textContent = d.title;
      document.getElementById('obs-sub').textContent = d.sub;
      document.getElementById('obs-stream').innerHTML = '';
      document.getElementById('obs-why').textContent = 'اضغط «التالي» لتبدأ المشاهدة. بعد كل خطوة ستعرف لماذا فعل الخبير ذلك.';
      document.getElementById('obs-check').classList.add('hidden');
      document.getElementById('obs-next').disabled = false;
      document.getElementById('obs-next').textContent = 'التالي';
      navigateTo('observe');
      obsNext();
    }
    function obsRenderProg() {
      const n = obs.demo.steps.length;
      document.getElementById('obs-prog').innerHTML = obs.demo.steps.map((_, k) => `<i class="${k <= obs.i ? 'done' : ''}"></i>`).join('');
    }
    function obsNext() {
      const d = obs.demo; if (!d) return;
      if (obs.i >= d.steps.length - 1) { clearInterval(obs.auto); obsShowCheck(); return; }
      obs.i++;
      const st = d.steps[obs.i];
      const div = document.createElement('div');
      if (st.w === 'labs') { div.className = 'nb-b action nr-rich'; div.innerHTML = nbLabsTable(st.labs); }
      else if (st.w === 'image') { div.className = 'nb-b action nr-rich'; div.innerHTML = nbImg(st.key, 'nr-img') + '<p class="nr-cap"></p>'; div.querySelector('.nr-cap').textContent = st.cap || ''; }
      else if (st.w === 'vitals') {
        const fmt = { spo2: v => v + '%' };
        div.className = 'nb-b action nr-rich';
        div.innerHTML = '<small>العلامات الحيوية' + (st.t ? ' · ' + nrEsc(st.t) : '') + '</small><div class="nr-mon">' + Object.keys(st.v).map(k => `<div class="on ${nrWarn(k, st.v[k])}"><small>${NR_VN[k] || k}</small><b class="font-num">${fmt[k] ? fmt[k](st.v[k]) : st.v[k]}</b></div>`).join('') + '</div>';
      }
      else {
        const cls = { nurse: 'nurse', patient: 'patient', doctor: 'doctor', action: 'action', sys: 'sys', think: 'think' }[st.w];
        const label = { nurse: 'الممرض', patient: 'المريض', doctor: 'الطبيب', action: 'إجراء', sys: 'المشهد', think: 'تفكير الخبير' }[st.w];
        div.className = 'nb-b ' + cls;
        div.innerHTML = `<small></small><p></p>`;
        div.querySelector('small').textContent = label;
        div.querySelector('p').textContent = st.t;
      }
      const stream = document.getElementById('obs-stream');
      stream.appendChild(div); stream.scrollTop = stream.scrollHeight;
      document.getElementById('obs-why').textContent = st.why || 'تابع المشهد.';
      obsRenderProg();
      if (obs.i >= d.steps.length - 1) document.getElementById('obs-next').textContent = 'انتهى المشهد: أجب عن سؤالين';
    }
    function obsShowCheck() {
      const d = obs.demo; const box = document.getElementById('obs-check');
      box.classList.remove('hidden');
      box.innerHTML = `<h3 style="margin:0 0 .5rem">اختبر فهمك</h3>` + d.check.map((c, k) => `<div class="nb-q" data-q="${k}"><p class="nb-q-text">${c.q}</p>${c.o.map((o, j) => `<button type="button" class="nb-opt" data-q="${k}" data-o="${j}"><b>${'أبجد'[j]}</b><span>${o}</span></button>`).join('')}</div>`).join('') + `<div id="obs-check-res" style="margin-top:.6rem;font-size:.85rem"></div><button id="obs-check-done" type="button" class="nb-btn" style="margin-top:.6rem;display:none">تم: سجّل المشاهدة</button>`;
      const ans = {};
      box.querySelectorAll('.nb-opt').forEach(b => b.addEventListener('click', () => {
        const k = +b.dataset.q, j = +b.dataset.o;
        box.querySelectorAll(`.nb-opt[data-q="${k}"]`).forEach(x => x.classList.remove('is-sel'));
        b.classList.add('is-sel'); ans[k] = j;
        if (Object.keys(ans).length === d.check.length) {
          const ok = d.check.filter((c, i) => ans[i] === c.a).length;
          document.getElementById('obs-check-res').textContent = ok === d.check.length ? 'إجابات صحيحة. ممتاز.' : `أجبت ${ok} من ${d.check.length} بشكل صحيح. راجع تعليقات الخطوات ثم أكمل.`;
          document.getElementById('obs-check-done').style.display = 'block';
        }
      }));
      document.getElementById('obs-check-done').addEventListener('click', () => {
        const u = authState.user; if (u) { const l = nbLearn(u); if (!l.obs.includes(d.id)) l.obs.push(d.id); saveAccountToStorage(u); }
        showToast('تم تسجيل مشاهدتك.');
        navigateTo('home'); renderHomePath(authState.user);
      });
      box.scrollIntoView({ behavior: 'smooth' });
    }
    function initObserve() {
      document.getElementById('obs-next')?.addEventListener('click', obsNext);
      document.getElementById('obs-exit')?.addEventListener('click', () => { clearInterval(obs.auto); navigateTo('home'); });
      document.getElementById('obs-auto')?.addEventListener('click', (e) => {
        if (obs.auto) { clearInterval(obs.auto); obs.auto = null; e.target.textContent = 'تشغيل تلقائي'; return; }
        e.target.textContent = 'إيقاف التشغيل التلقائي';
        obs.auto = setInterval(() => { if (obs.i >= obs.demo.steps.length - 1) { clearInterval(obs.auto); obs.auto = null; document.getElementById('obs-auto').textContent = 'تشغيل تلقائي'; } obsNext(); }, 4500);
      });
    }

