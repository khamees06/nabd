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
