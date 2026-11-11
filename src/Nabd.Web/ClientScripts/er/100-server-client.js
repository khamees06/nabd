  /* ---------- talking to the server ---------- */
  const stateNow = () => ({
    minute: E.sim, vitals: vitalsLine(), done: [...E.done.keys(), ...E.harmed].map(k => actOf(k)?.en || k),
    results: Object.values(E.tests).filter(t => t.back).map(t => testOf(t.id).en + ': ' + resultText(t.id)),
    // (live check 2026-11-08) Doctor room: the tests sent and not back yet, so the server never says results are pending
    // when none were sent. Nurse mode sends nothing new (its STATE stays as it was).
    ordered: NM() ? undefined : Object.values(E.tests).filter(t => !t.back).map(t => testOf(t.id).en),
  });
  const timeout = ms => { if (AbortSignal.timeout) return AbortSignal.timeout(ms); const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };
  // Out of reach is rarely for good, so the room says so and keeps knocking once a minute.
  function goOff() {
    api = 'off';
    apiRetryAt = Date.now() + 60000;
    loadFind();
    if (E && !E.over && !apiNoted) { apiNoted = true; sys(OFFLINE_NOTE); }
  }
  async function call(body, ms = 15000) {
    if (api === 'off') {
      if (Date.now() < apiRetryAt || location.protocol === 'file:') return null;
      apiRetryAt = Date.now() + 60000;
      ms = Math.min(ms, 4000);
    }
    try {
      const r = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: timeout(ms),
        body: JSON.stringify({ case: E.c.id, risk: E.risk, anx: E.anx, state: stateNow(), history: E.chat.slice(-14), ...(NM() ? { role: 'nurse', orders: E.nurse.orders.slice(0, 12).map(o => o.ar + ': ' + (o.cancelled ? 'cancelled' : o.doneAt != null ? 'done' : 'pending')) } : {}), ...body })
      });
      if (!r.ok) {
        if ([403, 404, 405, 429, 503].includes(r.status) || ++apiFails >= 3) goOff();
        return null;
      }
      const out = await r.json();
      api = 'on'; apiFails = 0;
      if (apiNoted) { apiNoted = false; if (E && !E.over) sys('رجع الاتصال بخدمة الفهم.'); }
      return out;
    } catch (e) {
      if (api === 'off' || ++apiFails >= 3) goOff();
      return null;
    }
  }
  // A free check before the case starts, so a blocked network never freezes the first messages.
  const ping = () => (api === 'off' ? Promise.resolve() : fetch(API + '?ping=1&_=' + Date.now(), { cache: 'no-store', signal: timeout(4500) }).then(r => { if (r.body && r.body.cancel) r.body.cancel().catch(() => {}); if (!r.ok) throw new Error('ping'); }).catch(() => { api = 'off'; apiRetryAt = Date.now() + 15000; loadFind(); }));

  // A line for someone the room has decided should speak; the case's own line is the safety net.
  async function voice(who, speaker, why, fallback, keep) {
    const my = E, sent = E.sent || 0;
    const r = await call({ mode: 'line', speaker, why }, 9000);
    if (E !== my || E.over) return;
    // (chat fix 2026-11-08) Doctor room: a line that comes back after the trainee's next message is stale and dropped.
    if (!NM() && !keep && (E.sent || 0) !== sent) return;
    person(who, (r && r.reply) || fallback);
  }

