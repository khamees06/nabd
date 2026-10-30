/* =========================================================================
   NABD — motion layer + live vitals monitor
   Loaded after script.js. Presentation only: it reads what the app renders
   and never changes clinical values, scores or session state.
   ========================================================================= */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 1. hero headline: word-by-word reveal ---------- */
  function splitHeroWords() {
    const h1 = document.querySelector('#view-index .nb-hero h1');
    if (!h1 || h1.dataset.split || reduceMotion) return;
    h1.dataset.split = '1';
    h1.setAttribute('aria-label', h1.textContent.trim().replace(/\s+/g, ' '));
    // The headline may be split into line spans (one per sentence): keep them.
    const lines = h1.children.length ? [...h1.children] : [h1];
    let i = 0;
    lines.forEach(line => {
      const words = line.textContent.trim().split(/\s+/);
      line.textContent = '';
      line.setAttribute('aria-hidden', 'true');
      words.forEach((w, k) => {
        const mask = document.createElement('span');
        mask.className = 'nb-wm';
        mask.setAttribute('aria-hidden', 'true');
        const word = document.createElement('span');
        word.className = 'nb-w';
        word.style.setProperty('--i', i++);
        word.textContent = w;
        mask.appendChild(word);
        line.appendChild(mask);
        if (k < words.length - 1) line.appendChild(document.createTextNode(' '));
      });
    });
    h1.classList.add('is-split');
  }

  /* ---------- 2. scroll reveals (works in every browser) ----------
     Only on pages that scroll as a document. The sim, nursing, coach and
     observe rooms are fixed-height screens with inner scrolling, so a hidden
     block there (like the chat bar) could never reach the viewport. */
  const REVEAL = [
    '#view-index > :not(.nb-hero)',
    '#view-index .nb-track-card', '#view-index .v7-steps > li', '#view-index .v7-specs > li',
    '#view-home .nb-room',
    '#view-home > .bg-white', '#view-profile > .bg-white', '#view-debrief > .bg-white',
    '#view-university > .bg-white', '#view-university > div > .bg-white',
    'footer li', 'footer h3', 'footer h4'
  ].join(',');
  let revealIO = null;

  function reveal(el, delay) {
    el.style.setProperty('--d', (delay || 0) + 'ms');
    el.classList.add('is-in');
    if (revealIO) revealIO.unobserve(el);
  }

  function observeReveals() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    if (!revealIO) {
      revealIO = new IntersectionObserver(entries => {
        let k = 0;
        entries.forEach(e => { if (e.isIntersecting) reveal(e.target, k++ * 70); });
      }, { threshold: 0 });
    }
    document.querySelectorAll(REVEAL).forEach(el => {
      if (el.dataset.rv || el.offsetParent === null) return;
      el.dataset.rv = '1';
      // Anything already on screen stays put; only content below the fold animates in.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
      el.classList.add('nb-io');
      revealIO.observe(el);
    });
  }

  // Safety net: nothing that is on screen may stay hidden, whatever the reason.
  function releaseStuck() {
    document.querySelectorAll('.nb-io:not(.is-in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (el.offsetParent === null || (r.top < window.innerHeight && r.bottom > 0)) reveal(el, 0);
    });
  }

  /* ---------- 3. count-up for dashboard figures ---------- */
  const COUNT = '#uni-prof-kpi-count, #uni-prof-kpi-avg, #uni-prof-kpi-sub, #profile-stat-sessions, #profile-stat-spec, #profile-stat-er';
  let countIO = null;

  function countUp(el) {
    const text = el.textContent;
    const m = text.match(/\d+/);
    if (!m || /\d\.\d/.test(text)) return;
    const target = parseInt(m[0], 10);
    if (!target) return;
    const start = performance.now();
    const dur = 1100;
    let written = text.replace(m[0], '0');
    el.textContent = written;
    const step = now => {
      if (el.textContent !== written) return; // the app re-rendered it: leave the new value alone
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      written = t < 1 ? text.replace(m[0], String(Math.round(target * eased))) : text;
      el.textContent = written;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function observeCounts() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    if (!countIO) {
      countIO = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          countIO.unobserve(e.target);
          countUp(e.target);
        });
      }, { threshold: 0.5 });
    }
    document.querySelectorAll(COUNT).forEach(el => {
      if (el.dataset.cu || el.offsetParent === null || !/\d/.test(el.textContent)) return;
      el.dataset.cu = '1';
      countIO.observe(el);
    });
  }

  /* ---------- 4. scroll progress + a sweep on every view change ---------- */
  const progress = document.createElement('div');
  progress.className = 'nb-progress';
  progress.setAttribute('aria-hidden', 'true');
  const sweep = document.createElement('div');
  sweep.className = 'nb-sweep';
  sweep.setAttribute('aria-hidden', 'true');

  let scrollTick = false;
  function onScroll() {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      scrollTick = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      releaseStuck();
    });
  }

  let currentView = '';
  function visibleView() {
    const s = [...document.querySelectorAll('#main-container > section')].find(x => !x.classList.contains('hidden'));
    return s ? s.id : '';
  }
  function onViewChange() {
    const v = visibleView();
    if (v === currentView) return;
    const first = !currentView;
    currentView = v;
    if (!first && !reduceMotion) {
      sweep.classList.remove('is-on');
      void sweep.offsetWidth;
      sweep.classList.add('is-on');
    }
    requestAnimationFrame(() => { releaseStuck(); observeReveals(); observeCounts(); enhanceMonitors(); });
  }

  /* ---------- nursing room on phones: chat fills the space left on screen ----------
     The stylesheet gives the chat 80dvh below a title block of varying height,
     which pushed the message box under the bottom edge. */
  function fitNurseChat() {
    const chat = document.querySelector('#view-nurse:not(.hidden) .nr2-chat');
    if (!chat) return;
    if (window.innerWidth >= 1024) { chat.style.height = ''; return; }
    const top = chat.getBoundingClientRect().top + window.scrollY;
    chat.style.height = Math.max(380, window.innerHeight - top - 12) + 'px';
  }

  /* ---------- 5. hero parallax on pointer move ---------- */
  function heroParallax() {
    const hero = document.querySelector('#view-index .nb-hero');
    if (!hero || reduceMotion || !finePointer) return;
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      hero.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--px', '0');
      hero.style.setProperty('--py', '0');
    });
  }

  /* ---------- 6. live vitals monitor ---------- */
  const RANGES = {
    hr: 'النبض — المعدل الطبيعي للبالغ: 60–100 نبضة في الدقيقة.',
    bp: 'الضغط — الطبيعي تقريباً: الانقباضي 90–139 والانبساطي 60–89 ملم زئبق.',
    spo2: 'الأكسجين — الطبيعي: 95–100% على هواء الغرفة.',
    temp: 'الحرارة — الطبيعي: 36.1–37.5 درجة مئوية.',
    rr: 'التنفس — الطبيعي للبالغ: 12–20 نفساً في الدقيقة.',
    bg: 'السكر — العشوائي الطبيعي تقريباً: 70–140 ملغ/دل.',
    news2: 'NEWS2 — من 0 إلى 4 خطورة منخفضة، 5–6 متوسطة، 7 فأكثر عالية.'
  };
  const keyOfLabel = t => /HR/.test(t) ? 'hr' : /BP/.test(t) ? 'bp' : /SpO2/i.test(t) ? 'spo2'
    : /Temp/i.test(t) ? 'temp' : /RR|التنفس/.test(t) ? 'rr' : /BG|السكر/.test(t) ? 'bg' : /NEWS2/.test(t) ? 'news2' : '';
  const firstNum = el => {
    const m = el && el.textContent.match(/\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  };

  // A lead-II beat drawn in real time (t = seconds since the beat began), so its widths stay
  // true at any rate: PR 0.16 s, QRS about 0.09 s, QT from Bazett with QTc 0.40 s.
  // A fast rate shortens the flat line between beats, not the complexes themselves.
  const bump = (p, c, w, a) => a * Math.exp(-Math.pow((p - c) / w, 2));
  const R_AT = 0.19; // seconds from the start of a beat to its R wave
  function ecgBeat(t, rr) {
    if (t < -0.05 || t > 1.6) return 0;
    const qt = 0.4 * Math.sqrt(rr);
    return bump(t, 0.06, 0.022, 0.12) - bump(t, 0.172, 0.007, 0.12) + bump(t, R_AT, 0.009, 1)
      - bump(t, 0.21, 0.008, 0.28) + bump(t, 0.07 + qt, 0.045 * Math.sqrt(rr), 0.25);
  }
  // The finger pulse arrives about 0.2 s after the R wave, with a dicrotic notch.
  function plethBeat(t) {
    const u = t - R_AT;
    if (u < -0.1 || u > 1.2) return 0;
    return bump(u, 0.22, 0.08, 1) + bump(u, 0.42, 0.07, 0.3);
  }
  function gauss() {
    let u = 0;
    while (!u) u = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
  }

  let audio = null;
  function beep(spo2, alarm) {
    if (!audio) return;
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    // Like a bedside oximeter: lower saturation, lower pitch.
    osc.frequency.value = alarm ? 980 : 520 + Math.max(0, Math.min(20, (spo2 || 98) - 80)) * 14;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

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
    soundBtn.addEventListener('click', () => {
      const on = soundBtn.getAttribute('aria-pressed') !== 'true';
      if (on && !audio) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audio = new Ctx();
      }
      if (audio && audio.resume) audio.resume();
      soundBtn.setAttribute('aria-pressed', String(on));
      soundBtn.textContent = on ? 'الصوت: مفتوح' : 'الصوت: مغلق';
      root.dataset.sound = on ? '1' : '';
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
    function pick(tile) {
      const key = tile.dataset.tile;
      if (!RANGES[key]) return;
      if (picked === key) { picked = null; info.hidden = true; }
      else { picked = key; info.textContent = RANGES[key]; info.hidden = false; }
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
      readBase();
      spo2 = firstNum(cfg.spo2());
      hrAlarm = false;
      resp = 16;
      cfg.tiles().forEach(t => {
        // Same thresholds the nursing room already uses (nrWarn in script.js). The heart rate
        // alarm follows the case value, so the drifting display does not make it flicker.
        const raw = t.key === 'bp' ? t.val().textContent.trim() : t.key === 'hr' ? base : firstNum(t.val());
        const known = t.key === 'bp' ? /\d+\/\d+/.test(raw) : !isNaN(raw);
        const bad = known && typeof window.nrWarn === 'function' && !!window.nrWarn(t.key, raw);
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
    const ecgAt = (t, cur, prev) => ecgBeat(t, cur) + ecgBeat(t + prev, prev);
    const plethAt = t => plethBeat(t) + plethBeat(t + prevRR);

    function onBeat() {
      recent.push(prevRR);
      if (recent.length > 4) recent.shift();
      showRate();
      const v = cfg.hr();
      if (v) { v.classList.remove('nb-beat'); void v.offsetWidth; v.classList.add('nb-beat'); }
      const dot = cfg.dot();
      if (dot) { dot.classList.remove('nb-dot-beat'); void dot.offsetWidth; dot.classList.add('nb-dot-beat'); }
      if (root.dataset.sound) beep(spo2, hrAlarm);
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
      if (reduceMotion) return;

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

  /* ---------- boot ---------- */
  function boot() {
    document.body.appendChild(progress);
    document.body.appendChild(sweep);
    splitHeroWords();
    heroParallax();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('resize', fitNurseChat, { passive: true });
    onViewChange();

    // Views switch by toggling .hidden; rooms and lists are injected later.
    let pending = false;
    new MutationObserver(list => {
      // Ignore the monitor's own beat/alarm class flips and live heart-rate number.
      if (list.every(m => {
        const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        return el && el.closest('.nb-mon');
      })) return;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        onViewChange();
        fitNurseChat();
        releaseStuck();
        observeReveals();
        observeCounts();
        enhanceMonitors();
      });
    }).observe(document.getElementById('main-container') || document.body, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['class']
    });
  }

  // Loaded with defer after script.js: wait for DOMContentLoaded so the app's
  // own init (session restore, first render) runs before this layer.
  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
