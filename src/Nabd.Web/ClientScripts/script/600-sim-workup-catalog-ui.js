    function switchSimSideTab(tabName) {
      ['vitals', 'workup'].forEach(t => {
        document.getElementById('side-pane-' + t)?.classList.toggle('hidden', t !== tabName);
        const btn = document.getElementById('side-tab-' + t);
        if (btn) {
          btn.className = (t === tabName)
            ? 'sim-side-tab py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all bg-white text-teal-800 shadow-2xs border border-slate-200/70 focus-ring'
            : 'sim-side-tab py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900 focus-ring';
        }
      });
    }

    function renderWorkupCatalog() {
      const container = document.getElementById('dynamic-workup-buttons');
      if (!container) return;
      container.innerHTML = '';

      const items = selectedWorkupCategory === 'all'
        ? GENERAL_WORKUP_CATALOG
        : GENERAL_WORKUP_CATALOG.filter(w => w.category === selectedWorkupCategory);

      items.forEach(item => {
        const alreadyRequested = simState.requestedWorkups.some(r => r.id === item.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-2 focus-ring ${
          alreadyRequested
            ? 'bg-teal-50/70 border-teal-300 text-teal-900'
            : 'bg-white hover:border-teal-600 border-slate-200/90 text-slate-800'
        }`;

        const infoDiv = document.createElement('div');
        const titleDiv = document.createElement('div');
        titleDiv.className = 'text-xs font-bold text-slate-900';
        titleDiv.textContent = (alreadyRequested ? '✓ تم الطلب: ' : '') + nbBidi(item.title);

        const subDiv = document.createElement('div');
        subDiv.className = 'text-xs text-slate-500 mt-0.5';
        subDiv.textContent = nbBidi(item.subtitle);

        infoDiv.appendChild(titleDiv);
        infoDiv.appendChild(subDiv);

        const actionSpan = document.createElement('span');
        actionSpan.className = 'text-xs font-bold text-teal-700 shrink-0';
        actionSpan.textContent = alreadyRequested ? 'مُرسل للشات' : 'طلب ←';

        btn.appendChild(infoDiv);
        btn.appendChild(actionSpan);
        btn.addEventListener('click', () => requestWorkupItem(item.id));
        container.appendChild(btn);
      });

      const badge = document.getElementById('workup-count-badge');
      if (badge) badge.textContent = String(simState.requestedWorkups.length);
    }

