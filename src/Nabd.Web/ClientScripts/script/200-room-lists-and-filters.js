    function nbRecoHtml(r) {
      const K = { practice: 'تدريب', next: 'تقدّم', weak: 'ضعف', new: 'جديد' };
      return r.recs.map(x => { const c = nbCaseObj(x.id); if (!c) return ''; return `<div class="nb-room c"><div style="min-width:0"><span class="nb-rk k-${x.kind}">${K[x.kind]}</span><span class="t">${c.title}</span><div class="m">${c.deptName} · ${c.levelLabel} · ${c.durationMin} دقيقة</div><div class="h">${x.why}</div></div><button type="button" data-room="${x.id}">ابدأ</button></div>`; }).join('')
        + (r.goal ? `<div class="nb-goal">${r.goal}</div>` : '');
    }
    let nbFlt = { lvl: 0, st: 'all' };
    function nbCaseStatus(c, u) { const b = nbBestMap(u)[c.id]; if (nbLockInfo(c)) return 'locked'; return b != null && b >= 70 ? 'done' : 'open'; }
    function nbFltPass(c) { const u = authState.user; if (!u) return true; if (nbFlt.lvl && nbTier(c) !== nbFlt.lvl) return false; if (nbFlt.st !== 'all' && nbCaseStatus(c, u) !== nbFlt.st) return false; return true; }
    function nbFilterBar(hostId, rerender) {
      const h = document.getElementById(hostId); if (!h) return;
      const L = [[0, 'كل المستويات'], [1, 'سهل'], [2, 'متوسط'], [3, 'متقدم']], S = [['all', 'الكل'], ['open', 'المفتوحة'], ['done', 'المكتملة'], ['locked', 'المقفلة']];
      h.innerHTML = `<div>${L.map(x => `<button type="button" data-l="${x[0]}" class="${nbFlt.lvl === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}</div><div>${S.map(x => `<button type="button" data-s="${x[0]}" class="${nbFlt.st === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}</div>`;
      h.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { nbFlt.lvl = +b.dataset.l; rerender(); });
      h.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { nbFlt.st = b.dataset.s; rerender(); });
    }

    function nbRoomsHtml(ids) {
      return ids.map(id => {
        const c = nbCaseObj(id); if (!c) return '';
        const h = NB_ROOM_HINTS[id] || c.hint || 'ابدأ بجمع البيانات ثم العلامات الحيوية.';
        return `<div class="nb-room"><div><div class="t">${c.title}</div><div class="m">${c.deptName} · ${c.levelLabel} · ${c.durationMin} دقيقة</div><div class="h">تلميح: ${h}</div></div><button type="button" data-room="${id}">ابدأ</button></div>`;
      }).join('');
    }

    function nbOpenRoom(id) {
      if (!(authState && authState.isAuthenticated)) { openAuthModal('login', 'سجّل الدخول لتبدأ غرفة المحاكاة المقترحة.'); return; }
      // 2026-11-13 (phone): «ابدأ» in the level-quiz result closes the dialog first, so the room is seen
      if (nbQModal) nbCloseLevelModal();
      document.getElementById('launch-er-random-btn')?.click();
    }

