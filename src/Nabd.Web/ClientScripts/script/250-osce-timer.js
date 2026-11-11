    /* OSCE */
    function nbOsceOn() { return safeStorageGet('nabd_osce', false) === true; }
    function nbStopOsce() {
      clearInterval(nbOsceTimer); nbOsceTimer = null;
      document.getElementById('sim-osce-bar')?.classList.remove('on');
      ['sim-suggestions-bar', 'sim-beginner-steps-bar'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = ''; });
    }
    function nbStartOsce(caseId) {
      nbStopOsce(); nbOsceActive = false;
      if (!nbOsceOn()) return;
      nbOsceActive = true;
      const mins = (CASES_DB[caseId] && CASES_DB[caseId].durationMin) || 12;
      let left = mins * 60;
      ['sim-suggestions-bar', 'sim-beginner-steps-bar'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
      document.getElementById('sim-level-hint')?.classList.remove('on');
      document.getElementById('sim-osce-bar')?.classList.add('on');
      let started = false;
      const tick = () => {
        const t = document.getElementById('sim-osce-time');
        if (t) t.textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0');
        if (started && document.getElementById('view-sim')?.classList.contains('hidden')) { nbStopOsce(); return; }
        if (left-- <= 0) {
          nbStopOsce();
          showToast('انتهى وقت الامتحان. سلّم الحالة الآن.');
          document.getElementById('open-handover-modal-btn')?.click();
        }
      };
      tick();
      started = true;
      nbOsceTimer = setInterval(tick, 1000);
    }

