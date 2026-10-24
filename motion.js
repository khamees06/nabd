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

  // A recognisable lead-II beat: P wave, QRS complex, T wave (phase 0..1).
  const bump = (p, c, w, a) => a * Math.exp(-Math.pow((p - c) / w, 2));
  const ecgAt = p => bump(p, 0.15, 0.025, 0.12) - bump(p, 0.255, 0.008, 0.12) + bump(p, 0.28, 0.01, 1)
    - bump(p, 0.305, 0.009, 0.28) + bump(p, 0.55, 0.05, 0.25);
  const plethAt = p => bump(p, 0.45, 0.09, 1) + bump(p, 0.66, 0.07, 0.32);

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
    let W = 0, H = 0, x = 0, beats = 0, last = performance.now();
    let lastE = null, lastP = null;
    let hr = NaN, spo2 = NaN, hrAlarm = false, lastCheck = 0;

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

    function readVitals() {
      prepTiles();
      hr = firstNum(cfg.hr());
      spo2 = firstNum(cfg.spo2());
      hrAlarm = false;
      cfg.tiles().forEach(t => {
        // Same thresholds the nursing room already uses (nrWarn in script.js).
        const raw = t.key === 'bp' ? t.val().textContent.trim() : firstNum(t.val());
        const known = t.key === 'bp' ? /\d+\/\d+/.test(raw) : !isNaN(raw);
        const bad = known && typeof window.nrWarn === 'function' && !!window.nrWarn(t.key, raw);
        t.el.classList.toggle('nb-alarm', bad && !t.el.classList.contains('warn'));
        if (t.key === 'hr' && bad) hrAlarm = true;
      });
      root.classList.toggle('is-live', hr > 0);
    }

    const ecgColor = () => !(hr > 0) ? 'rgba(244, 248, 250, .28)' : hrAlarm ? '#FF7873' : '#4CC283';
    const yE = p => H * 0.40 - (hr > 0 ? ecgAt(p) * H * 0.33 : 0);
    const yP = p => H * 0.94 - (spo2 > 0 ? plethAt(p) * H * 0.26 * Math.max(0.35, Math.min(1, (spo2 - 78) / 20)) : 0);

    function onBeat() {
      const v = cfg.hr();
      if (v) { v.classList.remove('nb-beat'); void v.offsetWidth; v.classList.add('nb-beat'); }
      const dot = cfg.dot();
      if (dot) { dot.classList.remove('nb-dot-beat'); void dot.offsetWidth; dot.classList.add('nb-dot-beat'); }
      if (root.dataset.sound) beep(spo2, hrAlarm);
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      const period = hr > 0 ? 60 / hr : 1;
      ctx.lineWidth = 1.6;
      [['ecg', yE, ecgColor()], ['pleth', yP, 'rgba(108, 201, 206, .85)']].forEach(([, fy, col]) => {
        ctx.strokeStyle = col;
        ctx.beginPath();
        for (let px = 0; px <= W; px += 1) {
          const p = ((px / W) * 4 / period) % 1;
          if (px === 0) ctx.moveTo(px, fy(p)); else ctx.lineTo(px, fy(p));
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
        const before = hr;
        readVitals();
        if (reduceMotion && before !== hr) drawStatic();
      }
      if (reduceMotion) return;

      const period = hr > 0 ? 60 / hr : 1;
      const pxPerSec = W / 4; // four seconds across the screen
      const nx = x + dt * pxPerSec;
      const steps = Math.max(1, Math.ceil(nx - x));
      const b0 = beats;
      const b1 = beats + dt / period;

      // Erase just ahead of the write head, like a real sweep monitor.
      ctx.clearRect(x, 0, Math.min(W - x, (nx - x) + 14), H);
      ctx.lineWidth = 1.7;
      ctx.lineJoin = 'round';
      for (const [kind, fy, col] of [['e', yE, ecgColor()], ['p', yP, 'rgba(108, 201, 206, .9)']]) {
        ctx.strokeStyle = col;
        ctx.beginPath();
        let prev = kind === 'e' ? lastE : lastP;
        if (prev) ctx.moveTo(prev[0], prev[1]);
        for (let s = 1; s <= steps; s++) {
          const px = x + (nx - x) * (s / steps);
          const py = fy((b0 + (b1 - b0) * (s / steps)) % 1);
          if (!prev) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          prev = [px, py];
        }
        ctx.stroke();
        if (kind === 'e') lastE = prev; else lastP = prev;
      }
      if (hr > 0 && Math.floor(b1) > Math.floor(b0)) onBeat();
      beats = b1 % 1000;
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
      // Ignore the monitor's own beat/alarm class flips.
      if (list.every(m => m.type === 'attributes' && m.target.closest && m.target.closest('.nb-mon'))) return;
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
