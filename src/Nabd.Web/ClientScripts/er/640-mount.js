  function mount() {
    const v = $('view-er');
    if (v.dataset.ready) return;
    v.dataset.ready = '1';
    $('er-form').addEventListener('submit', e => { e.preventDefault(); const i = $('er-input'); send(i.value); i.value = ''; });
    $('er-test').addEventListener('click', () => toggleRecords());
    const rec = $('er-records');
    /* phase8 2026-11-07: the doctor's orders box (nurse mode) and the «عرض التعليمات» button beside the clock.
       Injected here because index.html is not edited by er.js work. 2026-11-08: the tests header and the panel
       buttons («Vitals» | «Labs») are in index.html; the order | log views are gone. */
    if (REAL) {
      const side = $('er-side-tabs');
      if (side) side.addEventListener('click', e => { const b = e.target.closest('[data-side]'); if (b) setSide(b.dataset.side); });
      const list0 = $('er-rec-list');
      // nurse mode 2026-11-07: the doctor's orders, above the tests; hidden until there are orders.
      if (list0 && !$('er-ord')) {
        const sec = document.createElement('section');
        sec.id = 'er-ord';
        sec.className = 'er-ord';
        sec.hidden = true;
        sec.setAttribute('aria-label', 'أوامر الطبيب');
        sec.innerHTML = '<h4>أوامر الطبيب</h4><ol id="er-ord-list" class="er-ord-list"></ol>';
        list0.before(sec);
      }
      const top = document.querySelector('#view-er .er-top'), clock = $('er-clock');
      if (top && !$('er-help')) {
        const b = document.createElement('button');
        b.type = 'button';
        b.id = 'er-help';
        b.className = 'er-help';
        b.textContent = 'عرض التعليمات';
        b.setAttribute('aria-haspopup', 'dialog');
        if (clock && clock.parentNode === top) clock.after(b); else top.appendChild(b);
        b.addEventListener('click', () => showBrief());
      }
    }
    rec.addEventListener('click', e => {
      // nurse mode: a row of the doctor's orders.
      const ord = e.target.closest('[data-ord]');
      if (ord) { const [k, id] = ord.dataset.ord.split(':'); execOrder(k, id); return; }
      const f = e.target.closest('[data-f]'), t = e.target.closest('[data-t]');
      if (f) { recFilter = f.dataset.f; buildRecords(); }
      else if (t) panelTest(t.dataset.t);
      else if (e.target.closest('#er-rec-x')) toggleRecords(false);
    });
    $('er-rec-q').addEventListener('input', e => { recQuery = e.target.value; buildRecords(); });
    $('er-end').addEventListener('click', openEnd);
    $('er-sheet').addEventListener('keydown', e => { if (e.key === 'Escape') { $('er-sheet').hidden = true; $('er-input').focus(); } });
    if (REAL) {
      // mobile audit 2026-11-07: when the keyboard or a rotation resizes the conversation, the newest line stays in view
      // if the trainee was reading the end; a line scrolled back to stays put.
      const feed = $('er-feed');
      if (feed && 'ResizeObserver' in window) {
        let pinned = true;
        feed.addEventListener('scroll', () => { pinned = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 90; }, { passive: true });
        new ResizeObserver(() => { if (pinned) feed.scrollTop = feed.scrollHeight; }).observe(feed);
      }
      // Tapping «أرسل» while typing keeps the focus (and the phone keyboard) in the message box.
      const sendB = $('er-send');
      if (sendB) sendB.addEventListener('mousedown', e => { if (document.activeElement === $('er-input')) e.preventDefault(); });
    }
  }

