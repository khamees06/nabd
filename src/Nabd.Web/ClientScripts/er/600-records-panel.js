  const wide = () => window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;
  // mobile audit 2026-11-07: on a touch phone a focused text box opens the keyboard over the monitor and the sheet,
  // so the room only moves the focus there by itself on a wide screen or with a mouse. The trainee's own tap still does.
  const autoFocus = el => { if (el && (wide() || !(window.matchMedia && window.matchMedia('(pointer: coarse)').matches))) el.focus(); };
  /* 2026-11-08 (owner): on a wide screen the chat takes the room and one panel sits on its left: «Vitals» shows the monitor,
     «Labs» the tests. The panel not shown only turns invisible (er.css), so the monitor's trace, its pulse tone and its
     alarms keep running while the trainee orders tests. On a phone the buttons are hidden and nothing here changes. */
  function setSide(v) {
    const g = $('er-grid');
    if (!g || !g.dataset) return;
    const side = v === 'labs' ? 'labs' : 'mon';
    g.dataset.side = side;
    ['mon', 'labs'].forEach(k => { const b = $(k === 'mon' ? 'er-tab-mon' : 'er-tab-labs'); if (b && b.setAttribute) b.setAttribute('aria-pressed', String(k === side)); });
  }
  function toggleRecords(force) {
    const r = $('er-records');
    if (!r) return;
    if (wide()) { if (force !== false) { setSide('labs'); const q = $('er-rec-q'); if (q) q.focus(); } return; }
    const open = force === undefined ? !r.classList.contains('is-open') : force;
    r.classList.toggle('is-open', open);
    // mobile audit 2026-11-07: an old search does not stay behind for the next time the sheet opens.
    if (!open && recQuery) { recQuery = ''; const q = $('er-rec-q'); if (q) q.value = ''; buildRecords(); }
  }
  // Touching a test is ordering it: the trainee's line appears, and the result right after it.
  function panelTest(id) {
    if (!E || E.over) return;
    const meta = testOf(id);
    if (!meta) return;
    E.started = true;
    // Nurse mode: a click is an attempt, and a lab test or an image without an order is not done.
    if (NM()) { if (!E.tests[id]) person('me', 'طلبتُ ' + (REAL ? meta.en : meta.ar)); nurseTest(id, '', ''); if (!wide()) toggleRecords(false); return; }
    if (!E.tests[id]) { person('me', `بدي ${meta.en}`); orderTest(id, '', '', true); }
    // 2026-11-08: a card whose result is back takes the trainee to that result in the chat (it was the log's job).
    else if (REAL && E.tests[id].back && E.tests[id].el) goResult(id);
    else orderTest(id, '', '', true);
    if (!wide()) toggleRecords(false);
  }

