  function makeMonitor(root, cfg) {
    const svg = root.querySelector('svg');
    if (!svg) return;
    root.dataset.mon = '1';
    root.classList.add('nb-mon');
    const host = svg.parentElement;
    host.classList.add('nb-mon-host');
    const canvas = document.createElement('canvas');
    canvas.className = 'nb-mon-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'تخطيط القلب ونبض الأكسجين بشكل مباشر');
    host.insertBefore(canvas, svg);
    svg.style.display = 'none';

    const bar = document.createElement('div');
    bar.className = 'nb-mon-bar';
    bar.innerHTML = '<span><i class="k-ecg">II</i> تخطيط · <i class="k-pleth">Pleth</i> أكسجين</span>'
      + '<button type="button" class="nb-mon-sound" aria-pressed="false">الصوت: مغلق</button>';
    host.after(bar);
    const soundBtn = bar.querySelector('.nb-mon-sound');
    soundBtn.addEventListener('click', e => {
      const was = soundBtn.getAttribute('aria-pressed') === 'true';
      // mobile audit 2026-11-07: a tap while the sound is on but asleep («اضغط لتفعيله») wakes it, it does not mute.
      if (e.isTrusted && was && audio && audio.state !== 'running' && audio.state !== 'closed') {
        const p = audio.resume();
        if (p && p.catch) p.catch(() => {});
        soundLabel(soundBtn);
        return;
      }
      const on = !was;
      if (on) window.nbAudio();
      if (audio && audio.resume) { const p = audio.resume(); if (p && p.catch) p.catch(() => {}); }
      soundBtn.setAttribute('aria-pressed', String(on));
      root.dataset.sound = on ? '1' : '';
      soundLabel(soundBtn);
      // Only the trainee's own tap is remembered; the room's automatic on/off is not a choice.
      if (e.isTrusted) { try { localStorage.setItem('nbSound', on ? '1' : '0'); } catch (x) { /* private mode */ } }
    });

    const info = document.createElement('div');
    info.className = 'nb-mon-info';
    info.hidden = true;
    info.setAttribute('aria-live', 'polite');
    root.appendChild(info);

    // Tiles: tap or Enter shows the normal range for that reading.
    let picked = null;
    function prepTiles() {
      cfg.tiles().forEach(t => {
        if (t.el.dataset.tile) return;
        t.el.dataset.tile = t.key;
        t.el.classList.add('nb-mon-tile');
        t.el.setAttribute('role', 'button');
        t.el.setAttribute('tabindex', '0');
        t.el.setAttribute('aria-label', 'اعرف المعدل الطبيعي');
      });
    }
    // A room can supply its own normal ranges and alarm limits (the respiratory room has children).
    const rangeOf = key => (cfg.range && cfg.range(key)) || RANGES[key];
    const warnOf = (key, raw) => (cfg.warn ? cfg.warn(key, raw) : typeof window.nrWarn === 'function' && window.nrWarn(key, raw));
    function pick(tile) {
      const key = tile.dataset.tile;
      if (!rangeOf(key)) return;
      if (picked === key) { picked = null; info.hidden = true; }
      else { picked = key; info.textContent = rangeOf(key); info.hidden = false; }
      root.querySelectorAll('.nb-mon-tile').forEach(t => t.classList.toggle('is-picked', t.dataset.tile === picked));
    }
    root.addEventListener('click', e => {
      const tile = e.target.closest('.nb-mon-tile');
      if (tile && root.contains(tile)) pick(tile);
    });
    root.addEventListener('keydown', e => {
      const tile = e.target.closest('.nb-mon-tile');
      if (tile && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(tile); }
    });

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, x = 0, last = performance.now(), clock = 0;
    let lastE = null, lastP = null;
    let spo2 = NaN, resp = 16, hrAlarm = false, lastCheck = 0;
    // base: the case's heart rate as the app wrote it. hrNow: the rate the heart is beating at,
    // which drifts around base and eases toward a new base after a change. The HR tile then shows
    // the rate measured from the drawn beats, so the number always matches the trace.
    let base = NaN, hrNow = NaN, drift = 0;
    let beatT = 0, rr = 0.8, prevRR = 0.8, rDone = false;
    const recent = [];
    let hrEl = null, appWrote = true;
    // mobile audit 2026-11-07: no pulse tone while the room is paused (the start briefing), and a new case
    // (data-run, set by er.js) starts the heart at its own rate instead of easing from the last case's.
    const quiet = () => !!(cfg.quiet && cfg.quiet());
    let runSeen = root.dataset.run;
    const watch = new MutationObserver(() => { appWrote = true; });

    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      x = 0; lastE = lastP = null;
      if (reduceMotion) drawStatic();
    }
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(canvas);

    // Pick up the case value whenever the app writes the HR tile (or renders a new one).
    function readBase() {
      const el = cfg.hr();
      if (el !== hrEl) {
        watch.disconnect();
        if (el) watch.observe(el, { childList: true, characterData: true, subtree: true });
        hrEl = el;
        appWrote = true;
      }
      if (!appWrote) return;
      appWrote = false;
      const was = base;
      base = firstNum(el);
      if (!(was > 0) || !(base > 0)) {
        // A first reading starts the heart at that rate.
        hrNow = base;
        recent.length = 0;
        if (base > 0) rr = prevRR = 60 / base;
      } else {
        // A later change (treatment, deterioration) eases in: keep showing the measured rate.
        showRate();
      }
    }

    function readVitals() {
      prepTiles();
      if (root.dataset.run !== runSeen) { runSeen = root.dataset.run; base = NaN; appWrote = true; }
      readBase();
      spo2 = firstNum(cfg.spo2());
      hrAlarm = false;
      resp = 16;
      cfg.tiles().forEach(t => {
        // Same thresholds the nursing room already uses (nrWarn in script.js). The heart rate
        // alarm follows the case value, so the drifting display does not make it flicker.
        const raw = t.key === 'bp' ? t.val().textContent.trim() : t.key === 'hr' ? base : firstNum(t.val());
        const known = t.key === 'bp' ? /\d+\/\d+/.test(raw) : !isNaN(raw);
        const bad = known && !!warnOf(t.key, raw);
        t.el.classList.toggle('nb-alarm', bad && !t.el.classList.contains('warn'));
        if (t.key === 'hr' && bad) hrAlarm = true;
        if (t.key === 'rr' && raw > 0) resp = raw;
      });
      root.classList.toggle('is-live', base > 0);
    }

    // Next beat-to-beat interval: a slow drift of a few beats a minute, faster beats on
    // breathing in (respiratory sinus arrhythmia, weaker at fast rates), and a little noise.
    function nextRR() {
      const target = hrNow > 0 ? hrNow : 75;
      drift = Math.max(-2.5, Math.min(2.5, drift * 0.96 + gauss() * 0.35));
      const rsa = 0.03 * Math.max(0.2, Math.min(1, (110 - target) / 40)) * Math.sin(2 * Math.PI * clock * resp / 60);
      return Math.max(0.25, (60 / Math.max(20, target + drift)) * (1 + rsa + gauss() * 0.01));
    }

    // Like a bedside monitor: the shown rate is the average of the last few beats.
    function showRate() {
      // An app write still waiting in the observer queue must be read first, or the
      // takeRecords() below would swallow it along with our own write.
      if (watch.takeRecords().length) appWrote = true;
      if (appWrote) { readBase(); return; }
      if (!(base > 0) || recent.length < 3 || !hrEl) return;
      const s = String(Math.round(60 / (recent.reduce((a, b) => a + b, 0) / recent.length)));
      if (hrEl.textContent.trim() === s) return;
      hrEl.textContent = s;
      watch.takeRecords(); // our own write, not the app's
    }

    const ecgColor = () => !(base > 0) ? 'rgba(244, 248, 250, .28)' : hrAlarm ? '#FF7873' : '#4CC283';
    const yE = v => H * 0.40 - (base > 0 ? v * H * 0.33 : 0);
    const yP = v => H * 0.94 - (spo2 > 0 ? v * H * 0.26 * Math.max(0.35, Math.min(1, (spo2 - 78) / 20)) : 0);
    // Ventricular tachycardia: wide, fast and regular, nothing like a sinus beat.
    const inVT = () => !!cfg.vt && cfg.vt();
    const ecgAt = (t, cur, prev) => (inVT() ? 0.8 * Math.sin(2 * Math.PI * t / cur) : ecgBeat(t, cur) + ecgBeat(t + prev, prev));
    const plethAt = t => plethBeat(t) + plethBeat(t + prevRR);

    function onBeat() {
      recent.push(prevRR);
      if (recent.length > 4) recent.shift();
      showRate();
      const v = cfg.hr();
      if (v) { v.classList.remove('nb-beat'); void v.offsetWidth; v.classList.add('nb-beat'); }
      const dot = cfg.dot();
      if (dot) { dot.classList.remove('nb-dot-beat'); void dot.offsetWidth; dot.classList.add('nb-dot-beat'); }
      if (root.dataset.sound && !quiet()) beep(spo2);
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      const period = base > 0 ? 60 / base : 1;
      ctx.lineWidth = 1.6;
      [[t => yE(ecgAt(t, period, period)), ecgColor()], [t => yP(plethBeat(t) + plethBeat(t + period)), 'rgba(108, 201, 206, .85)']].forEach(([fy, col]) => {
        ctx.strokeStyle = col;
        ctx.beginPath();
        for (let px = 0; px <= W; px += 1) {
          const y = fy(((px / W) * 4) % period);
          if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
        }
        ctx.stroke();
      });
    }

    function frame(now) {
      if (!root.isConnected) return; // the nursing room was closed
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (root.offsetParent === null || !W) return;
      if (now - lastCheck > 400) {
        lastCheck = now;
        const before = base;
        readVitals();
        if (reduceMotion && before !== base) drawStatic();
      }
      if (reduceMotion) {
        // mobile audit 2026-11-07: with Reduce Motion nothing moves, but the pulse tone still follows the heart rate.
        if (root.dataset.sound && base > 0) {
          beatT += dt;
          if (beatT >= 60 / base) { beatT = 0; if (!quiet()) beep(spo2); }
        }
        return;
      }

      if (base > 0 && hrNow > 0) hrNow += (base - hrNow) * (1 - Math.exp(-dt / 2.5));
      const pxPerSec = W / 4; // four seconds across the screen
      const nx = x + dt * pxPerSec;
      const steps = Math.max(1, Math.ceil(nx - x));
      const h = dt / steps;

      // Advance the heart sample by sample; a frame can cross at most one beat boundary.
      const ptsE = [], ptsP = [];
      for (let s = 1; s <= steps; s++) {
        clock += h;
        beatT += h;
        if (beatT >= rr) { beatT -= rr; prevRR = rr; rr = nextRR(); rDone = false; }
        if (!rDone && beatT >= R_AT) { rDone = true; if (base > 0) onBeat(); }
        const px = x + (nx - x) * (s / steps);
        ptsE.push([px, yE(ecgAt(beatT, rr, prevRR))]);
        ptsP.push([px, yP(plethAt(beatT) * (1 + 0.04 * Math.sin(2 * Math.PI * clock * resp / 60)))]);
      }

      // Erase just ahead of the write head, like a real sweep monitor.
      ctx.clearRect(x, 0, Math.min(W - x, (nx - x) + 14), H);
      ctx.lineWidth = 1.7;
      ctx.lineJoin = 'round';
      for (const [kind, pts, col] of [['e', ptsE, ecgColor()], ['p', ptsP, 'rgba(108, 201, 206, .9)']]) {
        ctx.strokeStyle = col;
        ctx.beginPath();
        let prev = kind === 'e' ? lastE : lastP;
        if (prev) ctx.moveTo(prev[0], prev[1]);
        for (const pt of pts) {
          if (!prev) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]);
          prev = pt;
        }
        ctx.stroke();
        if (kind === 'e') lastE = prev; else lastP = prev;
      }
      x = nx;
      if (x >= W) { x = 0; lastE = lastP = null; }
    }

    size();
    readVitals();
    requestAnimationFrame(frame);
  }

