  function enhanceMonitors() {
    const sim = document.querySelector('#side-pane-vitals > div');
    if (sim && !sim.dataset.mon) {
      const ids = [['hr', 'sim-v-hr'], ['bp', 'sim-v-bp'], ['spo2', 'sim-v-spo2'], ['temp', 'sim-v-temp']];
      makeMonitor(sim, {
        hr: () => document.getElementById('sim-v-hr'),
        spo2: () => document.getElementById('sim-v-spo2'),
        dot: () => sim.querySelector('.animate-pulse'),
        tiles: () => ids.map(([key, id]) => {
          const v = document.getElementById(id);
          return v ? { key, el: v.parentElement, val: () => v } : null;
        }).filter(Boolean)
      });
    }
    const er = document.querySelector('.er-mon:not([data-mon])');
    if (er) {
      const ids = [['hr', 'er-v-hr'], ['spo2', 'er-v-spo2'], ['rr', 'er-v-rr'], ['temp', 'er-v-temp'], ['bp', 'er-v-bp']];
      makeMonitor(er, {
        hr: () => document.getElementById('er-v-hr'),
        spo2: () => document.getElementById('er-v-spo2'),
        dot: () => er.querySelector('.er-mon-dot'),
        vt: () => document.getElementById('view-er').dataset.rhythm === 'vt',
        quiet: () => { const b = document.getElementById('er-brief'); return !!(b && !b.hidden); },
        warn: (key, raw) => (window.nbErVitals ? window.nbErVitals.warn(key, raw) : ''),
        tiles: () => ids.map(([key, id]) => {
          const v = document.getElementById(id);
          return v ? { key, el: v.parentElement, val: () => v } : null;
        }).filter(Boolean)
      });
    }
    const rs = document.querySelector('.rs-mon:not([data-mon])');
    if (rs) {
      const ids = [['hr', 'rs-v-hr'], ['bp', 'rs-v-bp'], ['spo2', 'rs-v-spo2'], ['temp', 'rs-v-temp'], ['rr', 'rs-v-rr']];
      makeMonitor(rs, {
        hr: () => document.getElementById('rs-v-hr'),
        spo2: () => document.getElementById('rs-v-spo2'),
        dot: () => rs.querySelector('.rs-mon-dot'),
        range: key => window.nbRespVitals && window.nbRespVitals.range(key),
        warn: (key, raw) => (window.nbRespVitals ? window.nbRespVitals.warn(key, raw) : ''),
        tiles: () => ids.map(([key, id]) => {
          const v = document.getElementById(id);
          return v ? { key, el: v.parentElement, val: () => v } : null;
        }).filter(Boolean)
      });
    }
    document.querySelectorAll('.nr2-mon:not([data-mon])').forEach(root => {
      const cells = () => [...root.querySelectorAll('#nr-mon .nr2-cell')];
      const cellFor = key => cells().find(c => keyOfLabel(c.querySelector('.nr2-l')?.textContent || '') === key);
      makeMonitor(root, {
        hr: () => cellFor('hr')?.querySelector('.nr2-v'),
        spo2: () => cellFor('spo2')?.querySelector('.nr2-v'),
        dot: () => root.querySelector('.nr2-mh .dot'),
        tiles: () => cells().map(c => {
          const key = keyOfLabel(c.querySelector('.nr2-l')?.textContent || '');
          return key ? { key, el: c, val: () => c.querySelector('.nr2-v') } : null;
        }).filter(Boolean)
      });
    });
  }

