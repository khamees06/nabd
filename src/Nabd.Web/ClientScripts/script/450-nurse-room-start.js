    /* ----- start / finish ----- */
    function nurseStart(id) {
      navigateTo('home'); return;
      const c = NB_NURSE_CASES[id]; if (!c) return;
      if (!authState.isAuthenticated) { openAuthModal('login', 'سجّل الدخول لتبدأ حالة التمريض.'); return; }
      const lock = nbLockInfo(c); if (lock) { showToast(lock); return; }
      ns = { c, acts: nrActs(c), bi: -1, stage: 'acts', asked: new Set(), done: new Set(), shown: new Set(), authed: new Set(), skipped: new Set(), bdone: new Set(), v: Object.assign({}, c.vitals), news2: null, clock: 9 * 60, safety: [], q: {}, ordRes: [], repRes: [], hoRes: [], overlay: null, tab: 'measure', osce: nbOsceOn(), waive: false, postShown: false, ri: 0, hi: 0, order: {} };
      ['measure', 'proc', 'med'].forEach(g => { const ids = ns.acts.filter(a => a.g === g).map(a => a.id); ns.order[g] = nbShuffle(ids.length).map(i => ids[i]); });
      document.getElementById('nurse-title').textContent = c.title;
      document.getElementById('nurse-sub').textContent = `${c.patient.name} · ${c.patient.age} سنة · ${c.patient.bio}`;
      document.getElementById('nurse-badge').textContent = (c.guided ? 'تجربة موجّهة' : 'غرفة تمريض') + ' · ' + c.levelLabel + (ns.osce ? ' · وضع الامتحان' : '');
      document.getElementById('nurse-body').innerHTML = `<div class="nr2-app">
        <section class="nr2-chat" aria-label="محادثة الحالة">
          <div id="nr-feed" class="nr2-feed" aria-live="polite"></div>
          <div id="nr-guide"></div>
          <div id="nr-prompt"></div>
          <div id="nr-strip" class="nr2-strip"></div>
          <div class="nr2-bar">
            <input id="nr-input" type="text" placeholder="اكتب سؤالك للمريض..." autocomplete="off" />
            <button type="button" class="send" id="nr-send">إرسال</button>
            <button type="button" class="vt" id="nr-vt2">العلامات</button>
            <button type="button" class="tl" id="nr-tools">الإجراءات</button>
          </div>
        </section>
        <aside class="nr2-panel">
          <div class="nr2-pt"><button type="button" class="on" data-p="mon">العلامات</button><button type="button" data-p="act">الإجراءات والأدوية</button></div>
          <div class="nr2-pane" id="nr-pane-mon">
            <div class="nr2-mon">
              <div class="nr2-mh"><span class="dot"></span><b>العلامات الحيوية</b><span class="nr2-clk"><b id="nr-clock" class="font-num"></b></span><button type="button" id="nr-vitbtn">قِس الآن</button></div>
              <div class="nr2-ecg"><svg viewBox="0 0 400 40" preserveAspectRatio="none" role="img" aria-label="مخطط نبض القلب"><path class="ecg-animated" fill="none" stroke="#1EA25D" stroke-width="1.8" d="M0 22L40 22Q46 16 52 22L65 22L70 28L76 5L82 35L88 22L105 16L115 22L170 22Q176 16 182 22L195 22L200 28L206 5L212 35L218 22L235 16L245 22L300 22Q306 16 312 22L325 22L330 28L336 5L342 35L348 22L365 16L375 22L400 22"/></svg></div>
              <div id="nr-mon" class="nr2-grid font-num"></div>
              <div id="nr-vnote" class="nr2-note"></div>
            </div>
            <div><label for="nr-notes">ملاحظاتك</label><textarea id="nr-notes" placeholder="الحساسية، الأدوية، القراءات..."></textarea></div>
            <div class="nr-sec nr-ords"><h4>أوامر الطبيب</h4><ul id="nr-ordl" class="nr-ordl"></ul></div>
            <button type="button" id="nr-hint" class="nb-btn-ghost" style="width:100%">تلميح</button>
          </div>
          <div class="nr2-pane hidden" id="nr-pane-act">
            <div class="nr-dock" style="border:0;padding:0;background:none"><div id="nr-tabs" class="nr-tabs" role="tablist"></div><div id="nr-list" class="nr-list"></div></div>
          </div>
        </aside></div>`;
      const pcard = document.createElement('div'); pcard.className = 'nr2-pc';
      pcard.innerHTML = `<div class="nr2-pc-h"><div class="nr2-av">${nrEsc(c.patient.name.charAt(0))}</div><h2>${nrEsc(c.patient.name)}</h2><span class="nr2-chip">${c.patient.age} سنة</span>${c.guided ? '<span class="nr2-chip ok">تجربة موجّهة</span>' : ''}<span class="nr2-chip tl">${nrEsc(c.deptName)}</span></div><p>${nrEsc(c.patient.bio)}.</p>`;
      document.getElementById('nr-feed').appendChild(pcard);
      document.querySelectorAll('.nr2-pt button').forEach(b => b.onclick = () => { document.querySelectorAll('.nr2-pt button').forEach(x => x.classList.toggle('on', x === b)); document.getElementById('nr-pane-mon').classList.toggle('hidden', b.dataset.p !== 'mon'); document.getElementById('nr-pane-act').classList.toggle('hidden', b.dataset.p !== 'act'); });
      const gotoAct = () => { document.querySelector('.nr2-pt button[data-p="act"]').click(); document.querySelector('.nr2-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
      document.getElementById('nr-tools').onclick = gotoAct;
      document.getElementById('nr-vitbtn').onclick = () => nrDoAct('vitals');
      document.getElementById('nr-vt2').onclick = () => { nrDoAct('vitals'); document.querySelector('.nr2-pt button[data-p="mon"]').click(); if (window.matchMedia('(max-width: 1023px)').matches) document.querySelector('.nr2-mon').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
      document.getElementById('nr-send').onclick = nrSend;
      document.getElementById('nr-input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nrSend(); } });
      document.getElementById('nr-hint').onclick = nrHint;
      if (ns.osce) document.getElementById('nr-hint').style.display = 'none';
      navigateTo('nurse');
      if (!(c.beats[0] && c.beats[0].sys)) nrSay('sys', c.intro);
      nrMonitor(); nrDock();
      nrNextBeat();
    }
