    function initLandingShowcase() {
      const stage = document.getElementById('nb-stage');
      if (!stage) return;
      const tabs = stage.querySelectorAll('[data-slide]');
      const slides = stage.querySelectorAll('[data-slide-panel]');
      const scenes = stage.querySelectorAll('[data-scene]');
      let cur = 0, timer = null;
      const dur = 8000;
      stage.style.setProperty('--nb-dur', dur / 1000 + 's');
      const show = (n) => {
        cur = (n + tabs.length) % tabs.length;
        tabs.forEach((t, k) => { t.classList.toggle('is-on', k === cur); t.setAttribute('aria-selected', k === cur); });
        slides.forEach((x, k) => x.classList.toggle('is-on', k === cur));
        scenes.forEach((x, k) => x.classList.toggle('is-on', k === cur));
      };
      const start = () => {
        clearInterval(timer);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        stage.classList.remove('is-paused');
        timer = setInterval(() => show(cur + 1), dur);
      };
      const stop = () => { clearInterval(timer); stage.classList.add('is-paused'); };
      tabs.forEach((t, k) => t.addEventListener('click', () => { show(k); start(); }));
      stage.addEventListener('mouseenter', stop);
      stage.addEventListener('mouseleave', start);
      stage.addEventListener('focusin', stop);
      stage.addEventListener('focusout', start);
      start();
    }

