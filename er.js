/* =========================================================
   NABD — the emergency room (er.js)
   One room, one conversation. The patient, the companion, the nurse, the supervisor and the
   monitor all share the same stream; the student never picks who to talk to.
   This file is the source of truth: the clinical clock, the risk, the vitals, the results and who
   speaks next. api/er-chat.js only understands the student and words the lines. Without it the
   room still runs, on the case file's own lines.
   ========================================================= */
(() => {
  'use strict';

  const API = /\.vercel\.app$/.test(location.hostname) ? '/api/er-chat' : 'https://nabd-smoky-one.vercel.app/api/er-chat';
  // Simulated seconds per real second. One to one: the patient has time to answer what the trainee does,
  // and a case lasts as long as the trainee needs, not ten minutes.
  const PACE = 1;
  // The cuff cycles faster once the patient is sick, so the tile is never long behind the nurse.
  const BP_EVERY = 2, BP_SICK = 1;
  // Even a well-treated patient is still a patient in resus.
  const RISK_FLOOR = 20;
  const OFFLINE_NOTE = 'الاتصال بخدمة الفهم غير متاح الآن. الغرفة تعمل بوضع مبسّط، وقد لا تفهم كل جملة.';

  let D = null, loading = null, api = location.protocol === 'file:' ? 'off' : 'try', apiFails = 0, apiRetryAt = 0, apiNoted = false;
  let E = null, tickId = null, last = 0;
  const seen = new Set();
  /* nurse mode 2026-11-07: the trainee can be the ER nurse responsible for the bed instead of the resident.
     Every nurse-only path sits behind NM(); the doctor room is unchanged. roleWanted is the role asked for
     before a case starts (briefing switch or test harness); null means "from the user's track". */
  let roleWanted = null;
  const NM = () => !!E && E.role === 'nurse';
  // Patient, relative and instructor lines were written for a doctor: "يا دكتور" is dropped for the nurse.
  // Third-person «الدكتور» stays.
  const forNurse = s => String(s == null ? '' : s).replace(/(^|[\s،,!؟?.…])يا دكتور(?:ه|ة)?[،,]?\s*/g, '$1').replace(/^(?:دكتور[!،,]?\s*)+/, '').replace(/\s+([.،,!؟?])/g, '$1').trim();

  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  // Marks only: U+0660-0669 sit inside the mark range, and those are digits.
  const norm = s => String(s).replace(/[ً-ٰٟـ]/g, '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[؟?!.,،:؛()"'«»\-_/]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pickOf = list => list[Math.floor(Math.random() * list.length)];
  const testOf = id => D.tests.find(t => t.id === id);
  const actOf = id => D.actions.find(a => a.id === id);
  /* phase8 2026-11-07: a real page has a body; the Node harness's fake document has none, so the start
     briefing and the injected panel parts never block or pause it. */
  const REAL = typeof document !== 'undefined' && !!document.body && typeof document.addEventListener === 'function';
  /* phase8 2026-11-07: a test outside the case's indication ('no') or dangerous now ('harm') is out of indication.
     It is never blocked: its result shows at once, in amber, and the trainee justifies it at handover. */
  const offInd = t => !!t && (t.ind === 'no' || t.ind === 'harm');
  const OFF_BADGE = 'فحص خارج الاستطباب المباشر';
  const clk = t => String(Math.floor(t)).padStart(2, '0') + ':' + String(Math.floor((t % 1) * 60)).padStart(2, '0');
  const wordsIn = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  /* phase8 2026-11-07: the same rule as evaluateScientificJustification in script.js, graded here, no paid call. */
  function justGood(justText) {
    const t = (justText || '').trim();
    if (t.length < 10) return false;
    if (/^(هيك|بس هيك|للتجربة|تجربة|احتياط|فقط|ما بعرف|لا أعلم|عشوائي)$/.test(t)) return false;
    const scientificKeywords = /(تفريقي|تشخيص|استبعاد|تأكيد|تمييز|أعراض|مضاعفات|إقفار|احتشاء|خثرة|انصمام|التهاب|عدوى|إنتان|كلى|كرياتينين|جفاف|شوارد|أملاح|حموضة|حماض|أكسجة|تهوية|نزيف|فقر دم|حمل|تروية|عصبي|وعائي|قلب|رئة|سوائل|ضغط|سكري|كيتون)/;
    return scientificKeywords.test(t) || t.split(/\s+/).length >= 5;
  }

  /* ---------- clinical state ---------- */
  function vitalsAt(risk) {
    const A = E.c.vitals;
    let i = 0;
    while (i < A.length - 2 && risk > A[i + 1].at) i++;
    const a = A[i], b = A[i + 1], f = clamp((risk - a.at) / (b.at - a.at), 0, 1);
    const at = k => a[k] + f * (b[k] - a[k]);
    return { hr: at('hr'), sbp: at('sbp'), dbp: at('dbp'), rr: at('rr'), spo2: at('spo2') };
  }

  // What the treatments given so far have done to the numbers, ramping in over a few seconds.
  function modsNow() {
    const t = { spo2: 0, hr: 0, rr: 0, sbp: 0, dbp: 0 };
    for (const m of E.mods) {
      const f = clamp((E.sim - m.from) / (m.ramp || 0.2), 0, 1);
      for (const k in t) if (m[k]) t[k] += m[k] * f;
    }
    return t;
  }
  function live() {
    const v = vitalsAt(E.risk), m = modsNow();
    v.spo2 = Math.min(99, v.spo2 + clamp(m.spo2, -10, 10));
    // In VT nothing but a shock moves the heart.
    if (!E.vtNow) v.hr = m.hr < 0 ? Math.max(v.hr + clamp(m.hr, -30, 0), Math.min(v.hr, 60)) : v.hr + clamp(m.hr, 0, 30);
    v.rr = m.rr < 0 ? Math.max(v.rr + clamp(m.rr, -10, 0), Math.min(v.rr, 14)) : v.rr + m.rr;
    v.sbp += clamp(m.sbp, -40, 35);
    v.dbp += clamp(m.dbp, -20, 18);
    return v;
  }

  const fix = (n, d = 0) => { const p = 10 ** d; return Math.round(n * p) / p; };
  const wobble = n => (Math.random() - 0.5) * n;
  function paint() {
    const v = live();
    $('er-v-hr').textContent = Math.round(v.hr + wobble(2));
    $('er-v-spo2').textContent = Math.round(clamp(v.spo2 + wobble(1), 40, 100));
    $('er-v-rr').textContent = Math.round(v.rr + wobble(1.5));
    E.show = v;
    if (E.sim >= E.bpAt) {
      E.bp = [Math.round(v.sbp), Math.round(v.dbp)];
      E.bpAt = E.sim + (E.stage >= 2 ? BP_SICK : BP_EVERY);
      E.bpTime = E.sim;
      $('er-v-bp').textContent = E.bp.join('/');
    }
    $('er-v-bpt').textContent = 'قبل ' + Math.max(0, Math.floor(E.sim - E.bpTime)) + ' د';
    $('er-v-temp').textContent = E.tempKnown ? E.c.temp.toFixed(1) : '--.-';
  }
  const vitalsLine = () => { const v = E.show || live(); return `HR ${Math.round(v.hr)}, BP ${E.bp.join('/')}, RR ${Math.round(v.rr)}, SpO2 ${Math.round(v.spo2)}%`; };
  // The same numbers as a nurse says them out loud.
  const spokenVitals = () => { const v = E.show || live(); return `الضغط ${E.bp.join(' على ')}، النبض ${Math.round(v.hr)}، التنفس ${Math.round(v.rr)}، والـSpO2 ${Math.round(v.spo2)}%`; };

  // Adult limits; a reading outside them lights its tile (motion.js asks here).
  window.nbErVitals = {
    warn(k, x) {
      if (k === 'hr') return x > 110 || x < 50;
      if (k === 'rr') return x > 24 || x < 10;
      if (k === 'spo2') return x <= 92;
      if (k === 'bp') { const s = parseInt(String(x), 10); return s < 100 || s >= 180; }
      if (k === 'temp') return x >= 38;
      return false;
    }
  };

  function netRate() {
    let r = E.c.risk.rate;
    for (const a of E.effects) if (E.sim >= a.from) r -= a.slow;
    // Neither settles on its own, whatever else has been given.
    if (E.anaph && !E.anaph.treated) r = Math.max(r, 0) + 3;
    if (E.vtNow) r = Math.max(r, E.c.risk.rate);
    // Supportive care holds a septic patient; only the cause turns him round.
    const hold = E.c.risk.hold;
    if (hold && !E.done.has(hold.until) && E.risk <= hold.at) r = Math.max(r, 0);
    return r;
  }

  function tick(now) {
    if (!E || E.over) return;
    const dt = Math.max(0, Math.min(2, (now - last) / 1000));
    last = now;
    const rate = netRate();
    const step = dt * PACE / 60;
    E.sim += step;
    E.risk = clamp(E.risk + rate * step, RISK_FLOOR, 100);
    E.anxTop = Math.max(E.anxTop, E.anx);
    if (E.sim - E.riskLogAt >= 0.25) { E.riskLog.push([E.sim, E.risk]); E.riskLogAt = E.sim; }
    $('er-clock').textContent = String(Math.floor(E.sim)).padStart(2, '0') + ':' + String(Math.floor((E.sim % 1) * 60)).padStart(2, '0');
    if (E.sim - E.paintAt >= 0.12) { paint(); E.paintAt = E.sim; }
    for (const j of E.jobs.filter(x => E.sim >= x.at)) { E.jobs.splice(E.jobs.indexOf(j), 1); j.fn(); }
    stageCheck();
    if (NM()) nurseTick();
    // The patient is steady: the supervisor asks whether he is ready to hand over, once.
    // (Nurse mode: only once the doctor knows, and the instructor asks for an SBAR handover.)
    if (!E.nudged && E.risk <= E.c.risk.watch - 6 && netRate() <= 0 && !keyMissing().length && E.done.size >= 3 && E.sim > 2 && (!NM() || E.nurse.esc.calledAt !== null || E.nurse.present)) {
      E.nudged = true;
      later(0.2, () => person('d', NM() ? 'الأرقام استقرت. جاهز تسلّم الحالة بصيغة SBAR؟' : pickOf(['الأرقام استقرت. بقي إشي بدك تعمله؟ ولا جاهز تسلّم؟', 'تمام، الوضع أحسن. شو الخطة، والوجهة؟'])));
    }
    // An order waiting on a dose is not given: the nurse says so rather than let him think it was.
    const open = E.pending;
    if (open && open.type === 'dose' && !open.nagged && E.sim - (open.since || 0) > 0.75) {
      open.nagged = true;
      nurse(`دكتور، ${open.name} لسا ما أعطيته. ${open.tip}${open.sug ? '، ماشي؟' : ''}`);
    }
    const hold = E.c.risk.hold;
    if (hold && !E.holdAsked && !E.done.has(hold.until) && E.sim > 7 && E.risk <= hold.at + 1) {
      E.holdAsked = true;
      person('d', NM() ? (E.nurse.orders.some(o => openOrd(o)) ? 'الأرقام ما تحسنت. في أمر من الدكتور لسا ما تنفّذ؟' : 'الأرقام ما تحسنت. لازم الدكتور يعرف؟') : hold.ask || 'الأرقام ثابتة بس ما تحسنت. شو الخطوة الناقصة؟');
    }
    alarm(now);
    if (E.risk >= 100) arrest();
  }

  const STAGES = ['', 'watch', 'urgent', 'critical'];
  function stageCheck() {
    const R = E.c.risk;
    const s = E.risk >= R.critical ? 3 : E.risk >= R.urgent ? 2 : E.risk >= R.watch ? 1 : 0;
    $('view-er').dataset.stage = STAGES[s] || 'calm';
    E.vtNow = !!E.c.vt && s === 3;
    $('view-er').dataset.rhythm = E.vtNow ? 'vt' : '';
    if (s <= E.stage) {
      // Getting better is an event too.
      if (s < E.stage && E.stage >= 2) {
        E.stage = s;
        log('better', 'تحسّن المريض بعد العلاج');
        // The nurse says which numbers moved, not just that they did.
        E.bpAt = 0; paint();
        const v = live();
        nurse(`دكتور، الأرقام أحسن: الـSpO2 ${Math.round(v.spo2)}%، النبض ${Math.round(v.hr)}، الضغط ${E.bp.join(' على ')}.`);
        E.anx = clamp(E.anx - 12, 0, 100);
        director('better');
      }
      return;
    }
    E.stage = s;
    E.topStage = Math.max(E.topStage, s);
    if (NM()) for (let k = 1; k <= s; k++) if (E.nurse.stageAt[k] === undefined) E.nurse.stageAt[k] = E.sim;
    if (E.vtNow && E.vtAt === null) E.vtAt = E.sim;
    if (s >= 2) { E.bpAt = 0; paint(); }
    const L = E.c.stageLines[STAGES[s]] || {};
    log('stage', ['', 'بدأ التدهور', 'تدهور واضح', 'حالة حرجة'][s]);
    if (s >= 2) alert(s === 3 ? 'إنذار حرج: ' + worst() : 'إنذار: ' + worst());
    const told = nurseStage(L);
    if (told) nurse(told);
    // Nurse mode: nobody reads the monitor for the trainee; what the eye sees at the bedside is noted.
    if (NM()) { const seenNow = L.seen || (L.rest || []).join('، و') || forNurse(L.nurse || ''); if (seenNow) say('exam', 'تلاحظ: ' + seenNow); }
    if (L.patient) later(0.15, () => person('p', pickOf(L.patient)));
    // The relative answers a patient who calls for them, unless they are waiting outside.
    if (L.companion && !E.comp.used.has(L.companion) && E.sim >= E.comp.outUntil) {
      E.comp.used.add(L.companion);
      E.comp.lastAt = Math.max(E.comp.lastAt, E.sim + 0.3);
      later(0.3, () => { if (E.sim >= E.comp.outUntil) person('c', L.companion); });
    }
    E.anx = clamp(E.anx + 14, 0, 100);
    director(s >= 2 ? 'alarm' : 'worse');
    if (NM()) nurseStageRise(s);
    else if (s >= 2) coach(s === 3 ? 'critical' : 'urgent');
  }
  // The nurse says a falling number only while the monitor shows it falling: the case lists each
  // sign with its limit ([vital, limit, words, '>' for too high]); what the eye sees is always said.
  function nurseStage(L) {
    if (!L.parts) return L.nurse;
    E.bpAt = 0; paint();
    const v = live(), val = k => (k === 'sbp' ? +E.bp[0] : v[k]);
    const hit = L.parts.filter(([k, lim, , dir]) => (dir === '>' ? val(k) > lim : val(k) < lim)).map(p => p[2]);
    const all = [...hit, ...(L.rest || [])];
    return all.length ? `دكتور، ${all.join('، و')}.` : L.held || L.nurse;
  }
  const worst = () => { const v = live(); return v.spo2 <= 90 ? `SpO2 ${Math.round(v.spo2)}%` : v.sbp < 95 ? `BP ${Math.round(v.sbp)}` : `HR ${Math.round(v.hr)}`; };
  const later = (min, fn) => E.jobs.push({ at: E.sim + min, fn });

  /* ---------- alarm tones ---------- */
  let ac = null, lastAlarm = 0;
  function tone(freq, at, len) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(ac.destination);
    o.start(at);
    o.stop(at + len + 0.02);
  }
  function alarm(now) {
    const mon = document.querySelector('.er-mon');
    if (!ac || E.stage < 2 || !mon || !mon.dataset.sound || now - lastAlarm < (E.stage === 3 ? 2600 : 6000)) return;
    lastAlarm = now;
    const t = ac.currentTime;
    if (E.stage === 3) [0, 0.18, 0.36, 0.75, 0.93].forEach(d => tone(880, t + d, 0.14));
    else [0, 0.3, 0.6].forEach(d => tone(620, t + d, 0.22));
  }

  /* ---------- the stream ---------- */
  const LABEL = () => (NM() ? { p: E.c.patient.name, c: E.c.companion.name, n: 'د. ' + E.nurse.doc, d: 'المشرفة ' + E.c.nurse.name, me: 'أنت' } : { p: E.c.patient.name, c: E.c.companion.name, n: 'الممرضة ' + E.c.nurse.name, d: 'المشرف', me: 'أنت' });
  // Latin runs keep their own order inside Arabic: "12-lead ECG", "5 mg".
  const bidi = s => String(s == null ? '' : s).split(/([A-Za-z0-9](?:[A-Za-z0-9 .,\-/%+]|\([A-Za-z0-9 .,\-/%+]*\))*(?<![ .,\-/+])|[A-Za-z0-9])/).map((x, i) => (i % 2 ? `<bdi dir="ltr">${esc(x)}</bdi>` : esc(x))).join('');
  function say(who, text, extra) {
    const feed = $('er-feed');
    // A result being read stays put; a new line only follows if the reader was already at the end.
    const atEnd = who === 'me' || who === 'lab' || feed.scrollHeight - feed.scrollTop - feed.clientHeight < 90;
    const d = document.createElement('div');
    d.className = 'er-msg k-' + who;
    const label = LABEL()[who];
    d.innerHTML = (label ? `<span class="er-who">${esc(label)}</span>` : '') + (text ? `<p>${bidi(text)}</p>` : '') + (extra || '');
    feed.appendChild(d);
    if (atEnd) feed.scrollTop = who === 'lab' && d.offsetTop ? d.offsetTop - 8 : feed.scrollHeight;
    document.querySelectorAll('.er-p').forEach(p => p.classList.toggle('is-on', p.dataset.who === who));
    return d;
  }
  function person(who, text) {
    if (!E || E.over || !text) return;
    // Nurse mode: nobody in the room calls the nurse «دكتور». A line that was only the address is skipped.
    if (NM() && (who === 'p' || who === 'c' || who === 'd')) { const s = forNurse(text); if (s !== String(text).trim() && !/[\p{L}\p{N}]/u.test(s)) return; text = s; }
    say(who, text);
    E.chat.push({ r: who === 'me' ? 's' : who === 'p' ? 'p' : who === 'c' ? 'c' : who === 'n' ? 'n' : 'd', t: text });
    E.utt++;
  }
  // The ER nurse's line in the doctor room. In nurse mode the trainee is the nurse, so her line is either
  // dropped (alt undefined), said as a plain room note (alt string), or said by the instructor (alt {d}).
  function nurse(text, alt) { if (NM()) return nurseAlt(alt); person('n', text); }
  function nurseAlt(alt) { if (alt === undefined || alt === null) return; if (typeof alt === 'string') sys(alt); else if (alt.d) person('d', alt.d); }
  // Nurse mode: the only way the doctor (n) speaks. Fixed lines only, never model-written.
  const docSay = t => person('n', t);
  const sys = text => say('sys', text);
  function alert(text) { say('alarm', text); }
  const log = (type, text) => E.log.push({ at: E.sim, type, text });

  function typing(who) {
    const d = document.createElement('div');
    d.className = 'er-msg k-' + (who || 'p') + ' er-dots';
    d.innerHTML = '<span></span><span></span><span></span>';
    $('er-feed').appendChild(d);
    $('er-feed').scrollTop = $('er-feed').scrollHeight;
    return d;
  }

  /* ---------- talking to the server ---------- */
  const stateNow = () => ({
    minute: E.sim, vitals: vitalsLine(), done: [...E.done.keys(), ...E.harmed].map(k => actOf(k)?.en || k),
    results: Object.values(E.tests).filter(t => t.back).map(t => testOf(t.id).en + ': ' + resultText(t.id)),
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
  const ping = () => (api === 'off' ? Promise.resolve() : fetch(API + '?ping=1&_=' + Date.now(), { cache: 'no-store', signal: timeout(4500) }).then(r => { if (!r.ok) throw new Error('ping'); }).catch(() => { api = 'off'; apiRetryAt = Date.now() + 15000; loadFind(); }));

  // A line for someone the room has decided should speak; the case's own line is the safety net.
  async function voice(who, speaker, why, fallback) {
    const my = E;
    const r = await call({ mode: 'line', speaker, why }, 9000);
    if (E !== my || E.over) return;
    person(who, (r && r.reply) || fallback);
  }

  /* ---------- reading the student without the server ---------- */
  /* ---------- the act model: short replies when the server cannot be reached ---------- */
  let ACT = null, actRetried = false;
  // nabd-model/lang/train_act.py trains this; the same text steps run here, or the weights mean nothing.
  const actText = s => norm(s).replace(/(.)\1{2,}/g, '$1$1').replace(/\s+/g, ' ').trim();
  const actGrams = (raw, N = ACT) => {
    const text = actText(raw), words = text.split(' ').filter(Boolean);
    const out = ['#w' + Math.min(words.length, 6)];
    if (/[؟?]/.test(raw)) out.push('#q');
    if (/[0-9٠-٩]/.test(raw)) out.push('#d');
    if (/[a-zA-Z]/.test(raw)) out.push('#l');
    for (const w of words) {
      out.push('~' + w);
      const p = ' ' + w + ' ';
      for (let n = N.n[0]; n <= N.n[1]; n++) for (let i = 0; i <= Math.max(p.length - n, 0); i++) out.push(p.slice(i, i + n));
    }
    return out;
  };
  function readAct(raw) {
    if (!ACT) return null;
    if (/^[\d٠-٩][\d٠-٩./\s%\-]*$/.test(raw.trim())) return 'number';
    const count = new Map();
    for (const g of actGrams(raw)) { const i = ACT.index.get(g); if (i !== undefined) count.set(i, (count.get(i) || 0) + 1); }
    const vec = [...count].map(([i, n]) => [i, (1 + Math.log(n)) * ACT.idf[i]]);
    const z = Math.sqrt(vec.reduce((s, [, v]) => s + v * v, 0)) || 1;
    const score = ACT.bias.slice();
    for (const [i, v] of vec) ACT.w[i].forEach((x, k) => { score[k] += x * v / z; });
    return ACT.acts[score.indexOf(Math.max(...score))];
  }
  // The second small model: a history question read into a finding of the Nabd dictionary, for when the server is out of reach.
  let FIND = null, findWanted = false;
  function loadFind() {
    if (FIND || findWanted) return;
    findWanted = true;
    fetch('data/er-find.json', { signal: timeout(8000) }).then(r => r.json()).then(m => { FIND = { ...m, index: new Map(m.grams.map((g, i) => [g, i])) }; }).catch(e => { findWanted = false; console.warn('er-find', e); });
  }
  function readFinding(raw) {
    if (!FIND) return null;
    const count = new Map();
    for (const g of actGrams(raw, FIND)) { const i = FIND.index.get(g); if (i !== undefined) count.set(i, (count.get(i) || 0) + 1); }
    const vec = [...count].map(([i, n]) => [i, (1 + Math.log(n)) * FIND.idf[i]]);
    const z = Math.sqrt(vec.reduce((s, [, v]) => s + v * v, 0)) || 1;
    const score = FIND.bias.slice();
    for (const [i, v] of vec) { const w = FIND.w[i]; for (let k = 0; k < w.length; k += 2) score[w[k]] += (w[k + 1] / FIND.scale) * v / z; }
    const top = Math.max(...score), sum = score.reduce((s, x) => s + Math.exp(x - top), 0), best = score.indexOf(top);
    const id = FIND.classes[best];
    return 1 / sum >= FIND.tau && id !== 'none' ? id : null;
  }

  function socialReply(act, text) {
    const t = norm(text);
    if (act === 'wish') return 'الله يسلمك...';
    if (act === 'thanks') return t.includes('يعطيك') ? 'الله يعافيك...' : 'عفوا...';
    return t.includes('سلام') ? 'وعليكم السلام...' : t.includes('صباح') ? 'صباح النور...' : 'أهلين...';
  }

  // A short Arabic word also stands with a one-letter prefix (وسكر, بسكر), a short Latin one only whole.
  const hasAny = (t, kw) => kw.some(k => {
    const n = norm(k);
    if (!n) return false;
    const p = ' ' + t + ' ';
    if (n.length >= 4) return p.includes(n);
    return (/^[ء-ي]/.test(n) ? [n, 'و' + n, 'ف' + n, 'ب' + n, 'ل' + n] : [n]).some(f => p.includes(' ' + f + ' '));
  });
  // A free-standing number, so the 2 in O2 is not a dose, nor the 85 in "ضغطه 85/50".
  const digits = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g, '.').replace(/(\d)[,،](\d{1,2})(?!\d)/g, '$1.$2').replace(/(\d),(?=\d{3}(?!\d))/g, '$1').replace(/\d+\s*:\s*\d+/g, ' ').replace(/(^|[^\d.])1\s*\/\s*10+(?!\d)/g, '$1 ');
  const DOSE = /(^|[^A-Za-z\d./])(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?(?:\s*(mmol|meq|مليمول|ملي مول|ملي مكافئ|mcg|ug|µg|micrograms?|ميكرو[^\s/]*|mgs?|milligrams?|ملغم?|مغ|مج|ملجم|مليغرام|ملي ?غرام|ملي ?جرام|grams?|gm?|gr|غرام|جرام|غم|جم|غ|ml|cc|مل|ملي|سي سي|lpm|lit(?:er|re)s?|l|لتر|ليتر|لترات|iu|units?|u|وحد[هة]|وحدات|miu|mu|million|مليون|mmol|meq|مليمول|ملي مول|ملي مكافئ)(?![A-Za-z\u0621-\u064A]))?/gi;
  const UNITS = [[/^(mcg|ug|µg|microgram|ميكرو)/i, 'mass', 0.001], [/^(mgs?$|milligram|ملغ|مغ|مج|ملجم|مليغرام|ملي ?غرام|ملي ?جرام)/i, 'mass', 1], [/^(gram|gm?$|gr$|غرام|جرام|غم|جم|غ$)/i, 'mass', 1000],
    [/^(ml|cc|مل$|ملي$|سي سي)/i, 'vol', 1], [/^(lpm|lit|l$|لتر|ليتر)/i, 'vol', 1000], [/^(miu$|mu$|million|مليون)/i, 'unit', 1000000], [/^(iu|unit|u$|وحد)/i, 'unit', 1], [/^(mmol|meq|مليمول|ملي مول|ملي مكافئ)/i, 'mmol', 1]];
  const SCALE = { mcg: ['mass', 0.001], mg: ['mass', 1], g: ['mass', 1000], mL: ['vol', 1], L: ['vol', 1000], u: ['unit', 1], mmol: ['mmol', 1], rate: ['rate', 1], 'u/h': ['urate', 1], 'mcg/min': ['mrate', 1], 'mmol/h': ['krate', 1] };
  const NOT_DOSE_AFTER = /^\s*(?:%|\/\s*\d|دقيق|دقايق|ساع|سنه|سنة|سنين|يوم|ايام|lead|ليد|mins?(?![a-z])|hours?|hrs?(?![a-z])|years?|kg(?![a-z])|كيلو|كغ|مره|مرة|مرات|times?)/i;
  const NOT_DOSE_BEFORE = /(?:عمر\S*|ضغط\S*|نبض\S*|حرار\S*|سكر\S*|spo2|o2|sats?|hr|bp|rr|كل|every|q|target|هدف|الهدف|gcs|سرير|fio2)\s*(?:هو|هي|صار|كان|تقريبا)?\s*$/i;
  const COUNT = /^\s*(?:tabs?|tablets?|حب[هةا]\S*|amps?|امبول\S*|vials?|فيال\S*|puffs?|بخ\S*|ابر\S*|كيس|اكياس|bags?|[x×]\s*\d)/i;
  const PER_KG = /^\s*(?:\/\s*(?:kg|ك|كيلو)|لكل\s*(?:كيلو|كغ)|للكيلو|لكل\s*كجم|بالكيلو|per\s*kg|على\s*الكيلو|ع\s*الكيلو)/i;
  const PER_TIME = /(?:\/\s*(?:(?:kg|كغ|كيلو)\s*\/\s*)?(?:min|h|hr|hour|دقيق|ساع)|per\s*(?:kg\s*per\s*)?(?:min|hour|h(?![a-z]))|بالدقيق|لكل\s*دقيق|(?:في|ب)\s*ال?دقيق|بالساع|(?:في|ب)\s*ال?ساع|لكل\s*ساع)/i;
  const PER_HOUR = /(?:\/\s*(?:(?:kg|كغ|كيلو)\s*\/\s*)?(?:h|hr|hour|ساع)|per\s*(?:kg\s*per\s*)?(?:hour|h(?![a-z]))|بالساع|(?:في|ب)\s*ال?ساع|لكل\s*ساع)/i;
  // { raw, lo, hi, kind, by, perKg, perTime, unsure }. unsure = a dose the numbers cannot judge, such as "2 tabs".
  function doseOf(text) {
    const t = digits(text);
    let best = null;
    for (const m of t.matchAll(DOSE)) {
      const at = m.index + m[1].length, after = t.slice(m.index + m[0].length), before = t.slice(0, at);
      if (!m[4] && (NOT_DOSE_AFTER.test(after) || NOT_DOSE_BEFORE.test(before))) continue;
      if (m[4] && /^\s*\/\s*\d/.test(after)) continue;
      if (/^\s*%/.test(after)) continue;
      const u = m[4] ? UNITS.find(([re]) => re.test(m[4])) : null;
      const unsure = COUNT.test(after) || (u && u[1] === 'mass' && /^\s*(?:in|على|ع|ب|في)\s*\d+\s*(?:ml|cc|مل|سي)/i.test(after));
      const one = { raw: (m[0].slice(m[1].length).trim() + (unsure ? ' ' + after.trim().split(/\s+/).slice(0, 3).join(' ') : '')).trim(), lo: +m[2], hi: +(m[3] || m[2]), kind: u ? u[1] : null, by: u ? u[2] : 1, perKg: PER_KG.test(after), perTime: (!u || u[1] !== 'vol') && PER_TIME.test(after.slice(0, 30)), hour: PER_HOUR.test(after.slice(0, 30)), unsure };
      if (unsure) return one;
      if (u) return one;
      best = best || one;
    }
    return best;
  }
  const doseIn = text => { const d = doseOf(text); return d ? d.raw + (d.perKg ? '/kg' : '') + (d.perTime ? (d.hour ? '/h' : '/min') : '') : ''; };
  // 'ok', 'wrong', or null when the numbers alone cannot tell: then only the reader can object.
  function doseCheck(a, def, text) {
    const limits = def.limits || (actOf(a.id) || {}).limits;
    const d = limits && doseOf(a.dose || text);
    if (!d || d.unsure) return null;
    const name = norm([a.agent, a.said, a.dose, text].filter(Boolean).join(' '));
    const named = limits.filter(l => l.kw && hasAny(name, l.kw));
    const open = limits.filter(l => !l.kw);
    // A drug no limit knows is the reader's to judge.
    if (!named.length && !open.length && a.agent) return null;
    const pool = named.length ? named : open.length ? open : limits;
    const kg = E.c.kg;
    if (d.perTime) {
      // Insulin runs in units an hour; nitrates in micrograms a minute; pressors per kilo per minute.
      if (d.kind === 'unit') {
        const L = pool.filter(l => l.unit === 'u/h');
        if (!L.length || (d.perKg && !kg)) return null;
        const f = (d.hour ? 1 : 60) * (d.perKg ? kg : 1);
        return L.some(l => d.lo * f >= l.lo && d.hi * f <= l.hi) ? 'ok' : 'wrong';
      }
      if (d.kind === 'mmol') {
        const L = pool.filter(l => l.unit === 'mmol/h');
        if (!L.length) return null;
        const f = d.hour ? 1 : 60;
        return L.some(l => d.lo * f >= l.lo && d.hi * f <= l.hi) ? 'ok' : 'wrong';
      }
      if (d.kind === 'mass' && !d.perKg) {
        const L = pool.filter(l => l.unit === 'mcg/min');
        if (!L.length) return null;
        const f = (d.by / 0.001) / (d.hour ? 60 : 1);
        return L.some(l => d.lo * f >= l.lo && d.hi * f <= l.hi) ? 'ok' : 'wrong';
      }
      const rate = pool.filter(l => l.unit === 'rate');
      if (!rate.length || !d.perKg) return null;
      const f = (d.by / 0.001) / (d.hour ? 60 : 1);
      return rate.some(l => d.lo * f >= l.lo && d.hi * f <= l.hi) ? 'ok' : 'wrong';
    }
    if (d.perKg && !kg) return null;
    const fits = l => {
      const [kind, by] = SCALE[l.unit];
      if (kind === 'urate' || kind === 'mrate' || kind === 'krate') return false;
      if (kind === 'rate') return !d.kind && d.lo >= l.lo && d.hi <= l.hi;
      const k = d.perKg ? kg : 1;
      const tries = d.kind ? [d.by] : kind === 'unit' ? [by] : [by, 1, 1000];
      return tries.some(sc => {
        let lo = d.lo * sc * k, hi = d.hi * sc * k;
        // "0.01 mg/kg" is the textbook form of a dose with a ceiling, whatever the weight gives.
        if (l.cap && d.perKg && d.hi * sc <= l.cap * by) { lo = Math.min(lo, l.hi * by); hi = Math.min(hi, l.hi * by); }
        return lo >= l.lo * by && hi <= l.hi * by;
      });
    };
    const same = d.kind ? pool.filter(l => SCALE[l.unit][0] === d.kind) : pool;
    if (!same.length) return a.id === 'oxygen' ? 'wrong' : null;
    return same.some(fits) ? 'ok' : 'wrong';
  }
  // Base units of one dose, for the running total.
  function amountOf(a, def, text) {
    const limits = def.limits || (actOf(a.id) || {}).limits;
    const d = limits && doseOf(a.dose || text);
    if (!d || d.unsure || d.perTime) return 0;
    const k = d.perKg ? E.c.kg || 0 : 1;
    return d.hi * (d.kind ? d.by : SCALE[limits[0].unit][1]) * k;
  }

  // The reply to an open question, offline. Keyword rules cannot truly read free text, so they only ever err towards
  // sparing the patient: a dangerous drug is given on a short, plain yes and nothing else. The model never triggers harm.
  const STOP = /(?:^| )[وف]?(?:لا|ما|مش|مو|ماني|لست|لن|لسا|بلاش|بدون|بدل|غير\S*|ابد|ابدا|ممنوع|مستحيل|لحظه|استن\S*|خلص|رجعي\S*|شكيت|شاكك|شيل\S*|انسي\S*|غلط\S*|وقف\S*|نوقف\S*|الغي\S*|نلغي\S*|la|bala|bla|balash|msh|mish|mesh|wa2f\S*|wa2ef\S*|badal|no|not|don|dont|never|stop|hold|skip|forget|wait|cancel|instead|switch)(?: |$)|معك حق|خليني ات?اكد/;
  // "اه صح 98. خلص. كيتونات": one sentence of up to three words that is a stop.
  const shortStop = text => String(text || '').split(/[.!؟?،,\n]+/).map(x => norm(x).trim()).some(x => x && x.split(' ').length <= 3 && STOP.test(x));
  function offlineAnswer(text, t, { actions, tests, why, toSup, toComp, toNurse, toPat }) {
    const p = E.pending;
    if (!p) return 'na';
    const word = readAct(text);
    const asks = /[؟?]/.test(text);
    if (p.type === 'unsafe') {
      // "Not sure, but give it": the last clause decides.
      const clause = t.split(/ (?:بس|لكن) /).pop();
      if (/(?:^| )ليش لا(?: |$)/.test(clause)) return 'wrong';
      if (toSup || toComp || toPat || asks) return 'na';
      if (/ما بدي (?:اوقف|اغير|الغي)|علي مسووليتي/.test(clause)) return 'wrong';
      const aboutIt = clause.split(' ').length <= 5 || mentionsOf(clause, (actOf(p.a.id) || {}).kw || []).length > 0 || shortStop(text);
      if ((STOP.test(clause) && aboutIt) || actions.some(a => a.id !== p.a.id || (p.allergic && !allergicTo(a, E.c.care[a.id] || {}, text)))) return 'good';
      if (tests.length) return 'na';
      const plain = clause.split(' ').length <= 4 && /^(?:[اتنب]?عطي\S*|كمل\S*|متاكد|اكيد|نعم|ايوا|ايوه|اه|طبعا|yes|sure)(?: |$)/.test(clause);
      return plain ? 'wrong' : word === 'no' || word === 'refuse' ? 'good' : 'na';
    }
    const social = ['greeting', 'wish', 'thanks'].includes(word) || (word === null && /^(?:مرحب|اهل|هلا|السلام|صباح|مساء|شكر|يعطيك|طيب|لا$|ما بعرف|مش عارف)/.test(t));
    if (p.type === 'dose') {
      if (p.sug && ACCEPT.test(t)) return 'good';
      if (toSup || toComp || social || (word === 'unsure' && !doseIn(text)) || /^(?:ما بعرف|مش عارف|مش متذكر|ما بتذكر|مش متاكد)/.test(t)) return 'na';
      // "لا تعطيه" withdraws; "ما تتعبي حالك" said to the patient does not.
      if (/(?:^| )(?:(?:لا|ما) ت?(?:عط|حط|ركب|شغل|بلش|علق|كمل)\S*|بلاش|don t|hold|skip)(?: |$)/.test(t)) return 'withdraw';
      // Milligrams do not answer a question about litres of oxygen.
      if (p.a.id === 'oxygen' && /(?:ملغ|مغ|غرام|mg|mcg)/.test(t)) {
        // ...they answer the next proposal in her list: that one becomes the open question, oxygen waits its turn.
        const i = E.queue.findIndex(([q]) => q.type === 'dose' && q.a.id !== 'oxygen');
        if (i < 0) return 'na';
        const [next] = E.queue.splice(i, 1);
        E.queue.unshift([p, `دكتور، ${p.name}: ${p.tip || 'أي نوع وكم؟'}، ماشي؟`, 'n']);
        E.pending = next[0];
        E.pending.since = E.sim;
        return offlineAnswer(text, t, { actions, tests, why, toSup, toComp, toNurse, toPat });
      }
      if ((word === 'number' || doseIn(text)) && !tests.length && !actions.some(a => a.id !== p.a.id)) return 'partial';
      if (asks || tests.length || actions.some(a => a.id !== p.a.id)) return 'na';
      if (word === 'number' || doseIn(text) || /(?:لتر|ملغ|مغ|غرام|جرع|حبه|حبتين|نص )/.test(t)) return 'partial';
      if (STOP.test(t)) return 'withdraw';
      // "Which one?" is answered by a name; "how much?" is not.
      return !toNurse && actions.length && ((actOf(p.a.id).limits || []).some(l => l.kw)) ? 'partial' : 'na';
    }
    if (p.type === 'reason') {
      // A reason cannot be judged without the server, so it costs nothing either way.
      if (why) return 'ungraded';
      if (/^(?:بلاش|الغي|خلص)/.test(t)) return 'withdraw';
      if ((actions.length && toNurse) || tests.some(x => x.id !== p.id) || toSup || social || asks || t.length < 2 || /اطمني|يا حجه|يا عمي|يا خالتي/.test(t) || ['yes', 'no', 'refuse'].includes(word)) return 'na';
      return word === 'unsure' && t.split(' ').length < 3 ? 'na' : 'ungraded';
    }
    if ((actions.length && toNurse) || tests.some(x => x.id !== p.id) || toComp || /ساعد|شو اعمل|مش عارف|محتار|ما بعرف/.test(t)) return 'na';
    // A reading cannot be judged without the server, so it is taken as said.
    return social || asks || word === 'unsure' || t.length < 2 ? 'na' : 'noted';
  }

  // Orders whose proposal is safe to take as agreed when the trainee says the same order again.
  const REPEAT_OK = ['oxygen', 'fluids', 'paracetamol'];
  // A drug word is not an order: "بلاش اسبرين" and "بتاخدي اسبرين؟" must never give the drug.
  const NEGATED = /(?:^| )[وف]?(?:لا|ما|مش|مو|بلاش|بدون|ممنوع|غير|مستحيل|اياك\S*|اوعك|اوعي|حذار|نتجنب|تجنب\S*|نبعد|اوقف\S*|نوقف|وقف\S*|شيل\S*|الغي\S*|avoid|no|not|never|dont|don t|without|stop|hold|لسا ما)(?: \S+){0,2}$|(?:^| )(?:بدل|بدال|instead of)(?: \S+)?$/;
  // Asking the relative to step out or wait by the door.
  const STEP_OUT = /(?:^| )(?:برا|بره|عالباب|الباب|اطلع\S*|استن\S*|تستن\S*|ابعد\S*|وسع\S*)(?: |$)/;
  const ORDER = /(?:^| )[وف]?(?:خد(?:ي|و|وا)|(?:رح |راح )?[اب](?:حط|ركب|سحب|شغل|علق|عطي|رفع|قعد|جهز)\S*|[اتنبي]?عط[يو]\S*|اعط\S*|حط\S*|ركب\S*|علق\S*|ابدا\S*|بلش\S*|جيب\S*|جهز\S*|شغل\S*|اطلب\S*|اسحب\S*|قيس\S*|افحص\S*|شيك\S*|عيد\S*|نادي\S*|اتصل\S*|ارفع\S*|اعمل\S*|سوي\S*|فعل|فعلي(?:ه|ها)?|فعلو\S*|بدي|بدنا|لازم|خلينا|يلا|give|start|hang|push|need|order|call|get|put|run|draw|repeat|check|activate)(?: |$)/;
  // Words that make a bare drug or procedure name a command ("IV line x2 stat", "فنتولين هلا").
  const URGENT = /(?:^| )(?:stat|ستات|بسرعه|فورا|حالا|هلا|هسا|الان|now|asap)(?: |$)/;
  const HISTORY = /^(?:هل|شو|ليش|كيف|قديش|كم|وين|مين|متي|امتي|لما|بتاخد\S*|بياخد\S*|بتوخذ\S*|بيوخذ\S*|اخذت\S*|اخدت\S*|عملت\S*|عندك|عنده|عندها|في عند\S*|جربت\S*|استعملت\S*|بتستعمل\S*|بيستعمل\S*|بتستخدم\S*|بتتحسس\S*|بيتحسس\S*|صار معك)(?: |$)/;
  const ASKS_ABOUT = /(?:بدي (?:اعرف|اسالك|اتاكد)|لازم اعرف|خلينا نشوف|شو صار|(?:^| )(?:اعطوك|اعطاه|اعطيتي|اخذتي|اخدتي)(?: |$))/;
  // "اعطوه X" is "give him X" unless it asks about the past ("اعطوه شي قبل ما يجي؟").
  const ASKS_PAST3 = /(?:^| )(?:اعطوه|اعطوها)(?: |$)/, PAST_WORD = /(?:قبل|بالبيت|بالاسعاف|امبارح|مبارح|الصبح|من شوي|اخر مره)/;
  // Every mention, from the start of its word, so "ولا تعطيه بنسلين" is seen whichever drug comes first.
  const mentionsOf = (t, kw) => {
    const p = ' ' + t + ' ', out = [];
    kw.forEach(k => {
      const n = norm(k);
      if (!n) return;
      if (n.length < 4) {
        const forms = /^[ء-ي]/.test(n) ? [n, 'و' + n, 'ف' + n, 'ب' + n, 'ل' + n] : [n];
        for (const form of forms) for (let i = p.indexOf(' ' + form + ' '); i >= 0; i = p.indexOf(' ' + form + ' ', i + 1)) out.push(i + 1);
        return;
      }
      for (let i = p.indexOf(n); i >= 0; i = p.indexOf(n, i + 1)) out.push(p.lastIndexOf(' ', i) + 1);
    });
    return out;
  };
  const freeAt = (t, i) => !NEGATED.test((' ' + t + ' ').slice(0, i).trim());
  // The same word means different things; these are the ones trainees actually type.
  // Tests a collision rule adds although none of their own words were typed.
  let FORCED = new Set();
  function collisions(t, ids, ord = ORDER) {
    FORCED = new Set();
    if (/مضاد (?:صفيحات|تخثر|حموض)/.test(t) && !/مضاد حيوي/.test(t)) ids.delete('antibiotics');
    if (/قسطره بول|foley|فولي/.test(t)) { ids.delete('cath_lab'); ids.delete('urine'); }
    else ids.delete('foley');
    if (/رينجر|ringer/.test(t)) ids.delete('lactate');
    if (/brain|دماغ|(?:^| )(?:ل?ل?راس|الراس)(?: |$)/.test(t)) ids.delete('ctpa');
    if (/septic|cardiogenic|انتاني|تاقي|anaphyl/.test(t)) ids.delete('shock');
    if (/nasal|نيزل/.test(t)) ids.delete('iv_access');
    if (/(?:بينزل|ينزل|خافض) (?:ال)?سكر/.test(t)) ids.delete('glucose');
    // "هيدروكورتيزون وريد" names a route; a cannula is asked for by its own words.
    if (ids.has('iv_access') && [...ids].some(id => id !== 'iv_access') && !/(?:كانيولا|كانولا|كنيولا|cannula|canula|iv access|iv line|iv x|(?:بدي|ركب\S*|حط\S*|افتح\S*|جيب\S*|جهز\S*) (?:ال)?iv(?: |$)|خط وريد|افتح\S* وريد|فتح وريد|(?:ركب|حط|جيب)\S* (?:ال)?وريد)/.test(t)) ids.delete('iv_access');
    if (ids.has('noradrenaline')) ids.delete('adrenaline');
    if (ids.has('neb_ipratropium') && !/فنتولين|سالبيوتامول|salbutamol|ventolin/.test(t)) ids.delete('neb_salbutamol');
    if (/ضغط\S* ماسك|ماسك حال/.test(t)) ids.delete('oxygen');
    if (!/راس|سرير|sit|قعد|جلس/.test(t)) ids.delete('sit_up');
    // Asking for a level is a test, not a drug.
    if (/(?:فحص|افحص\S*|اطلب\S*|level|مستوى|قديش|كم|شو) (?:ال)?(?:بوتاسيوم|potassium|مغنيسيوم|magnesium|صوديوم)/.test(t)) { ids.delete('potassium'); ids.delete('magnesium'); if (D.tests.some(x => x.id === 'kft')) { ids.add('kft'); FORCED.add('kft'); } }
    if (/(?:قيد|قلل|خفف)\S* (?:ال)?سوا[ئي]ل|fluid restrict/.test(t)) ids.delete('fluids');
    // Saline as the carrier of another drug is not a fluid order.
    if (/(?:في|على|ب|in) ?\d+ ?(?:مل|ml|cc)/.test(t) && [...ids].some(id => id !== 'fluids')) ids.delete('fluids');
    if (/كابتوبريل|captopril|نيفيديبين|nifedipine|adalat|اداليت/.test(t)) ids.delete('nitrate');
    if (/بطن|abdom|appendi/.test(t)) ids.delete('ctpa');
    if (!ord.test(t) && !/defib|ديفيب|ديفب|cardiovert/.test(t) && t.split(' ').length > 2) ids.delete('shock');
    // "heparin 4000 units IV bolus" is a way of giving heparin.
    if (/bolus|بولس/.test(t) && !/سوائل|سلاين|saline|fluid|محلول|رينجر/.test(t) && [...ids].some(id => id !== 'fluids')) ids.delete('fluids');
    return ids;
  }
  // "اكسجين 5 لتر وفنتولين 5 ملغ": each drug takes the dose written beside it.
  function clauseDose(text, kw, many) {
    if (!many) return doseIn(text);
    const part = text.split(/[،,;؛\n+]|\s+(?:مع|and)\s+|\s+و(?=\S)/).find(p => mentionsOf(norm(p), kw).length);
    return part ? doseIn(part) : '';
  }

  // Latin words glued to Arabic prefixes ("والGTN") are read as the Latin word.
  const nz = s => norm(s).replace(/(^| )(?:وال|بال|لل|ال|و|ب)(?=[a-z])/g, '$1').replace(/([a-z0-9])([ء-ي])/g, '$1 $2').replace(/([ء-ي])([a-z])/g, '$1 $2');
  function localRead(text) {
    const t = nz(text), c = E.c;
    // Nurse mode: first-person acts (بقيس، ركّبت) are acts too, and the nurse's own words for a vitals check count.
    const ORD = NM() ? ORDER_N : ORDER, ACTS = NM() ? E.nurse.acts : D.actions;
    // Every question mark ends a question of its own, and each is read alone.
    const clauseFacts = cl => {
      let fx = c.facts.filter(f => hasAny(cl, f.kw)).map(f => f.id).filter(id => id !== 'allergy' || /حساس|تحسس|allerg/.test(cl));
      // "عنده حساسية من دوا؟" is the allergy question, not the medicines one.
      if (/حساس|تحسس|allerg/.test(cl) && fx.includes('allergy')) fx = ['allergy'];
      return fx;
    };
    const asked = text.split(/[؟?]/).map(x => nz(x).trim()).filter(Boolean);
    let facts = [...new Set((asked.length > 1 ? asked : [t]).flatMap(clauseFacts))].slice(0, 3);
    let exam = c.exam.filter(f => hasAny(t, f.kw) || (NM() && hasAny(firstP(t), f.kw))).map(f => f.id);
    const verb = ORD.test(t);
    // A message can hold a question and an order: every sentence is judged on its own, so a «؟» in one never cancels the other.
    const orderish = p => { const pt = nz(p); return ORD.test(pt) || URGENT.test(pt) || !!doseIn(p); };
    const parts = (text.match(/[^؟?]+[؟?]?/g) || [text]).map(p => p.trim()).filter(Boolean).flatMap(p => {
      if (!p.includes('،') || !/[؟?]\s*$/.test(p)) return [p];
      const cl = p.split('،').map(x => x.trim()).filter(Boolean);
      return cl.length > 1 && cl.slice(0, -1).some(orderish) ? cl : [p];
    });
    const IMPV = /^(?:[اتن]?عط|حط|ركب|علق|ابدا|بلش|جيب|جهز|شغل|قيس|نادي|give|start)/;
    // "ممكن أعطيها X؟" or "بدي أحط X؟" is a plan said as a question: still an order, but never after "اذا" or "لو".
    const FPQ = /(?:^| )(?:بدي|بدنا|ب(?:حط|ركب|عطي|زيد|سحب|شغل|علق)|ممكن (?:انا )?ا?(?:ركب|عطي|حط|سحب))\S*/;
    const asksPart = p => {
      const pt = nz(p);
      const past3 = ASKS_PAST3.test(pt) && (/[؟?]/.test(p) || PAST_WORD.test(pt));
      if (/[؟?]/.test(p)) return (!IMPV.test(pt) && !(FPQ.test(pt) && !/(?:^| )(?:اذا|لو)(?: |$)/.test(pt))) || ASKS_ABOUT.test(pt) || past3;
      return (HISTORY.test(pt) && !ORD.test(pt)) || ASKS_ABOUT.test(pt) || past3;
    };
    const ordParts = parts.filter(p => !asksPart(p));
    const asking = !ordParts.length;
    // What the order-reading below looks at: the sentences that are not questions.
    const tO = ordParts.length === parts.length ? t : nz(ordParts.join(' '));
    const named = list => { const ids = collisions(tO, new Set(list.filter(a => hasAny(tO, a.kw)).map(a => a.id)), ORD); const keep = FORCED; const out = list.filter(a => ids.has(a.id)); FORCED = keep; return out; };
    const stated = named(ACTS);
    const forbids = !asking && stated.some(a => { const at = mentionsOf(tO, a.kw); return at.length && !at.some(i => freeAt(tO, i)); });
    const condBefore = i => /(?:^| )(?:لو(?! سمحت)|اذا)(?: |$)/.test((' ' + tO + ' ').slice(0, i));
    const said = list => (asking ? [] : named(list).filter(a => FORCED.has(a.id) || mentionsOf(tO, a.kw).some(i => freeAt(tO, i) && !condBefore(i))));
    const short = tO.split(' ').length <= 3;
    const ordText = ordParts.join(' ');
    const found = said(ACTS).map(a => { const dose = clauseDose(ordText || text, a.kw, said(ACTS).length > 1); return { a, dose }; });
    // A long sentence with no verb is talk about the drug: the nurse checks instead of acting.
    const drugs = found.filter(x => ORD.test(tO) || URGENT.test(tO) || x.dose || short || (tO.split(' ').length <= 5 && !actOf(x.a.id).dose));
    const unclear = found.find(x => !drugs.includes(x));
    const strict = a => mentionsOf(tO, a.kw).some(i => ORD.test((' ' + tO + ' ').slice(0, i).trim().split(' ').slice(-3).join(' ')));
    // A cannula or a vitals check has no dose: "12-lead" beside it is not one.
    const actions = drugs.map(({ a, dose: d0 }) => { const dose = actOf(a.id).dose ? d0 : ''; return { id: a.id, agent: '', dose, bare: !dose && !strict(a) }; });
    // Keywords missed it: the trained reader looks for a finding this patient's record answers.
    const questionLike = /[؟?]/.test(text) || HISTORY.test(t) || / (?:شو|وين|قديش|كم|متي|امتي|ليش|هل|كيف) /.test(' ' + t + ' ') || /^(?:افحص|اسمع|شوف|بدي اسمع|خليني افحص|بدي افحص)/.test(t);
    if (questionLike && !facts.length && !exam.length && !actions.length) {
      const hit = (c.findMap || {})[readFinding(text)];
      if (hit && c.facts.some(f => f.id === hit)) facts = [hit];
      else if (hit && c.exam.some(f => f.id === hit)) exam = [hit];
    }
    const why = text.match(/(عشان|لان|لأن|بسبب|لاستبعاد|لنفي|rule out|r\/o).*/i);
    const tests = said(D.tests).map(x => ({ id: x.id, reason: why ? why[0] : '', reason_ok: why ? 'ungraded' : 'none' }));
    // "Why is his breathing fast?" is clinical reasoning, a question for the supervisor, not for the patient.
    const reasoning = !facts.length && !exam.length && !actions.length && !tests.length && /^(?:ليش|لماذا|شو (?:سبب|يعني|معني))/.test(t) && /(?:نفسه|نبضه|ضغطه|حالته|وعيه|لونه|نفسها|نبضها|ضغطها|حالتها|وعيها)/.test(t) && !/(?:عندك|بتحس|نفسك|وجعك|حالك|معك)/.test(t);
    const SUPV = /(يا مشرف|يا استاذ|يا دكتور|شو (?:ب)?رايك|ساعدني|مش عارف|محتار|شو اعمل|ممكن (?:انا )?(?:ابدا|اسال)|(?:^| )(?:ننقل|نحول|نحجز|ندخل)\S*)|(?<=^| )(?<!انا |معك |اسمي )(?:دكتور|دكتوره|مشرف|استاذ)(?: |$)/; const NRSV = new RegExp('(?<=^| )(?<!انا )(?:سستر|ستر|ممرضه|نيرس|sister|nurse|' + norm(c.nurse.name) + ')(?: |$)'); const iS = t.search(SUPV), iN = t.search(NRSV); const toSup0 = iS >= 0 && !(iN >= 0 && iN < iS); const nurseVoc = iN >= 0 && !(iS >= 0 && iS < iN); const toSup = toSup0 || (reasoning && !nurseVoc); if (nurseVoc || (toSup0 && /(?:^|(?<!انا |معك |اسمي ))(?:يا )?(?:دكتور|دكتوره|مشرف|استاذ)(?: |$)/.test(t))) { facts = []; exam = []; }
    // "The numbers?" is asked of the nurse, who reads the monitor, never of the patient.
    const toNurse = nurseVoc || new RegExp('(يا ممرض|يا سستر|يا ' + norm(c.nurse.name) + '|اعطي|ركبي|حطي|قيسي|جهزي|الارقام|ارقامه|ارقامها|علامات حيويه|vitals)').test(t);
    const tP = (' ' + t + ' ').replace(new RegExp(' ' + norm(c.companion.name) + ' ', 'g'), ' ');
    const toPat = (c.patient.addr || []).some(w => new RegExp('(?:^| )(?:يا )?' + norm(w) + '(?: |$)').test(tP)) && !t.includes(norm(c.companion.name));
    const toComp0 = /(يا حجه|يا حجي|يا خالتي|يا خاله|يا ست |يا عمي|اطمني|اطمن|هدي حال|ولا يهمك|لازم اشتغل|بعد اذنك|بنتك|ابوك|جوزك|زوجك|مرتك|زوجتك|معك حق|فهمت عليك|ما تخاف|ما تخافي|لا تخاف|لا تخافي|لا تقلق|يا عمو|عمو)/.test(t) || t.includes('يا ' + norm(c.companion.name)) || t.includes(norm(c.companion.name) + ' ');
    const toComp = toComp0 && !toPat;
    // Keywords go first: the model only speaks for a message nothing else could read.
    const act = !facts.length && !exam.length && !actions.length && !tests.length ? readAct(text) : null;
    const social = ['greeting', 'wish', 'thanks'].includes(act);
    const explaining = toComp && /(?:^| )و?(?:رح|راح|بدنا|هسا|ح) ن\S+/.test(t);
    const talkOnly = toComp && (!verb || explaining);
    const to = talkOnly || (toComp && !actions.length) ? 'companion' : toSup && !social ? 'supervisor' : toNurse || actions.length || tests.length ? 'nurse' : 'patient';
    // "Take the adrenaline off" names a drug without ordering it.
    const stopped = E.pending && E.pending.type === 'unsafe' && STOP.test(t) && !/بدل|badal|instead/.test(t) && !toPat
      && (t.split(' ').length <= 5 || mentionsOf(t, (actOf(E.pending.a.id) || {}).kw || []).length > 0 || shortStop(text));
    // A reason or a reading that mentions a drug is not an order for it.
    // Naming a drug with a dose over a reading question is an order, not a reading.
    const answering = E.pending && ['reason', 'interpret'].includes(E.pending.type) && !toNurse && !verb && !drugs.some(x => x.dose);
    const opens = /شو (اللي )?(جابك|صار معك|صاير|مالك|بك|فيك)|احكيلي شو/.test(t);
    const asks = / (شو|وين|قديش|كم|امتي|متي|ليش|هل|ايه|shu)( |$)/.test(' ' + t) && !/شو اخبار/.test(t);
    const small = !asks && (social || (act === null && /^(مرحب|اهلا|هلا|السلام|صباح|مساء)/.test(t)));
    const out = {
      act, text, forbids, unclear: unclear ? actOf(unclear.a.id).ar : '', toPat, named: D.actions.filter(a => hasAny(t, a.kw)).map(a => a.id), typedOrder: (verb || !!doseIn(text)) && !asking,
      to, facts, exam, actions: talkOnly || stopped || answering ? [] : actions, tests: talkOnly ? [] : tests, kind: toSup && !social ? 'help' : actions.length ? 'order' : opens ? 'open' : small ? 'smalltalk' : facts.length ? 'question' : 'other',
      pending_ok: offlineAnswer(text, t, { actions, tests, why, toSup, toComp, toNurse, toPat }),
      tone: {
        introduced: /(انا الدكتور|انا دكتور|انا طالب|اسمي|معك الدكتور)/.test(t), empathy: act === 'wish' || /(بفهم|معك حق|حقك|سلامتها|سلامته|لا تخاف)/.test(t),
        rude: /(اسكت|اخرس|اطلع برا|مش شغلك|مالك دخل|غصب)/.test(t) && !/(لو سمحت|لحظه|شوي|بنشتغل|تفضل)/.test(t), jargon: false,
        explained: toComp && /(?:^| )[وف]?(?:رح|راح|عم ن\S*|بنعطي|بنعمل|الوضع|حالتها|حالته)(?: |$)/.test(t), consent: /(بعد اذنك|ممكن اسمع|ممكن افحص|بتسمح)/.test(t),
      }
    };
    // Nurse mode: who is meant is decided again (the doctor is on the phone, the instructor stands behind).
    return NM() ? nurseShape(out, t, text, false) : out;
  }
  const VITALS_Q = /(ضغط|نبض|اكسجين|ارقام|الرقم|حراره|تنفس|ساتورشن|ساتوريشن|spo2|sat|bp|hr)/;

  /* ---------- nurse mode: reading the trainee (2026-11-07) ---------- */
  // What the nurse does herself is said in the first person: بقيس، ركّبت، بعطيه.
  const SELF = /(?:^| )[وف]?(?:رح |راح |ح|هسا |خليني )?(?:ب|ا)?(?:قيس|قست|عطي|عطيت|اعطيت|ركبت|حطيت|سحبت|علقت|شغلت|رفعت|قعدت|عملت|بعمل|جهزت|بركب|بحط|بعطي|بسحب|بشغل|بعلق)\S*(?: |$)|i'?ll |i will /;
  const ORDER_N = new RegExp(ORDER.source + '|' + SELF.source);
  // The instructor by name or title; the generic "help me" phrases go to her only when nothing else is meant.
  // Review fixes 2026-11-07: the instructor's name alone at the start ("سناء شو الخطوة؟") calls her too.
  const SUPV_N = name => new RegExp('(يا مشرف(?:ه)?|المشرفه|يا استاذ(?:ه)?|يا ' + name + '(?: |$)|^' + name + '(?: |$))');
  const SUPV_GEN = /(ساعديني|ساعدني|شو (?:ب)?رايك|شو اعمل|مش عارف|محتار|بتنصح\S*|انصحيني|نصيحه|شو (?:لازم |بدي |المفروض )?(?:اعمل|نعمل) (?:هسا|بعد|كمان)|شو (?:لازم|المفروض) (?:اعمل|نعمل)|الخطوه الجايه|شو بعد(?: |$))/;
  const DOCV = name => new RegExp('(?:^|\\s)(?:يا\\s+)?(?:دكتور|دكتوره|د)(?:\\s+' + name + ')?(?=\\s|$)|(?:^|\\s)يا\\s+' + name + '(?=\\s|$)|^' + name + '(?=\\s|$)');
  // "دكتور طارق رح يجي" is said about the doctor, not to him.
  const DOC_3P = /^\s+(?:رح|راح|ح|بيجي|بتيجي|جاي|جايه|بيشوف|بتشوف|بيعرف|بتعرف|عرف|عرفت|اجا|اجت|وصل|وصلت|بيطلب|بتطلب|طلب|طلبت|قال|قالت|حكي|حكت|مشغول|مشغوله|بيعطي|بتعطي|علي الطريق|على الطريق|عالطريق)(?:\s|$)/;
  const CALL_N = /(?:اتصل|بتصل|رح اتصل|ناد|بناد|كلم|بكلم|بلغ|ببلغ|خبر|بخبر|اسال|بسال|بدي)\S* (?:علي |على |ب|لل|عال)?(?:ال)?(?:دكتور|دكتوره|طبيب|طبيبه|مقيم)|(?:احكي|بحكي|نحكي|حكيت|رح احكي)\S* (?:مع |لل|ل|عال|علي |على |ب)(?:ال)?(?:دكتور|دكتوره|طبيب|طبيبه|مقيم)|(?:^| )sbar (?:لل|ل|عال)?(?:ال)?(?:دكتور|دكتوره|طبيب|طبيبه)|(?:^| )(?:ال)?(?:دكتور|دكتوره|طبيب|طبيبه)\S* (?:لازم|بد\S*) (?:يعرف|تعرف|يجي|تيجي|يشوف|تشوف)|call (?:the )?doctor|\bpage\b/;
  const HELP_CALL = /(كود|code blue|نادوا فريق|فريق الانعاش|rapid response)/;
  // (The text is normalised: «مجرى» arrives as «مجري».)
  const AIRWAY_ASSESS = /(?:قيم|بقيم|تقييم|افحص|بفحص|assess|check|شيك|بشيك|بتشيك)\S* (?:علي |على |عل )?(?:ال)?(?:airway|مجر[يى] (?:ال)?(?:هوا|تنفس)|ممر الهوائي)|مجر[يى] (?:ال)?(?:هوا(?:ء)?|تنفس) (?:مفتوح|سالك|نظيف)|airway (?:patent|clear|ok)/;
  const DRAW = /(?:سحبت|بسحب|اسحب|رح اسحب)\S* (?:ال)?(?:دم|عينات|عينه)|draw (?:the )?bloods?|blood samples/;
  const NURSE_KW = { bp_repeat: ['بقيس الضغط', 'قست الضغط', 'علامات حيويه', 'العلامات', 'vitals', 'الارقام', 'news'], temp: ['بقيس الحراره', 'قست الحراره'], sit_up: ['رفعت راس', 'برفع راس', 'رفعت السرير', 'قعدتها', 'قعدته', 'بقعدها', 'بقعده', 'رفعت الجلسه'] };
  const NURSE_VITALS = /(علامات حيويه|العلامات|vitals|الارقام|news|(?:^| )(?:ال)?سات(?: |$))/;
  const ALLERGY_W = /(حساسي|تحسس|allerg|nkda)/;
  // A plan or a suggestion names a drug without giving it.
  const SUGGEST = /(بقترح|اقترح|نقترح|بستني|استني (?:ال)?دكتور|لما (?:ي|ت)طلب|بعد ما (?:ي|ت)طلب|قبل ما (?:ي|ت)طلب|(?:^| )(?:ال)?(?:دكتور|دكتوره|طبيب|طبيبه) (?:رح|راح|ح|بي|بت)\S*|ما رح (?:ا|ن)?عطي|ما ب(?:ا|ن)?عطي|بد(?:و|ها) امر|بحتاج امر|(?:^| )(?:رح|راح|ح|هلا|هسا) (?:ب)?ن(?:عطي|حط|ركب|علق|بلش)\S*)/;
  // Steps the nurse says she did, by the short names nurses use; checked against the open orders only.
  const ORDER_ALIAS = { cxr: /(?:^| )(?:ال)?(?:صوره|اشعه)(?! (?:ال)?دم)(?: |$)/, kft: /(?:^| )(?:ال)?كلي(?: |$)/, cbc: /(?:^| )صوره (?:ال)?دم(?: |$)/, urine: /(?:^| )(?:ال)?بول(?: |$)/, blood_culture: /(?:^| )(?:ال)?زراع\S*/, airway: /سيباب|سي باب/, antibiotics: /(?:^| )(?:ال)?ليفو\S*/ };
  const EXEC_V = /(?:^| )[وف]?(?:طلبت|بطلب|بعتت|بعت|ببعت|سحبت|بسحب|ركبت|بركب|عطيت|اعطيت|بعطي|حطيت|علقت|بلشت|ضفت|عملت|خلصت|نفذت)\S*/;
  const BAND = /(سوار|اسواره|سجلت الحساسيه)/;
  // The nurse narrates her examination in the first person: «بسمع صدرها» is «اسمع صدر».
  const firstP = s => (' ' + s + ' ').replace(/ (?:بسمع|سمعت|بتسمع|رح اسمع|خليني اسمع)(?= )/g, ' اسمع').replace(/ (?:بفحص|فحصت|رح افحص|خليني افحص)(?= )/g, ' افحص')
    .replace(/ (?:بشوف|شفت|رح اشوف|خليني اشوف)(?= )/g, ' شوف').replace(/ (اسمع|افحص|شوف) ال(?=\S)/g, ' $1 ').replace(/ شكل(?:ها|ه) العام(?= )/g, ' الشكل العام').replace(/ (?:وعيها|وعيه)(?= )/g, ' وعي').trim();
  // Which people a message calls, and which comes first.
  function nurseVocs(t) {
    const R = E.nurse.rx;
    let iDoc = t.search(R.docv);
    const iSup = t.search(R.supv), iComp = t.search(R.compv);
    if (iDoc >= 0) {
      const m = t.slice(iDoc).match(R.docv);
      if (m && !/يا\s/.test(m[0]) && DOC_3P.test(t.slice(iDoc + m.index + m[0].length))) iDoc = -1;
    }
    let first = iDoc >= 0 && (iSup < 0 || iDoc <= iSup) ? 'doc' : iSup >= 0 ? 'sup' : null;
    // "يا أم يزن، دكتور طارق جاي": the relative is spoken to first.
    if (iComp >= 0 && (first === null || iComp < (first === 'doc' ? iDoc : iSup))) first = 'comp';
    const call = CALL_N.test(t), help = HELP_CALL.test(t);
    return { first, call, help, gen: SUPV_GEN.test(t), voc: (first !== null && first !== 'comp') || call || help };
  }
  // Every action and test a message names, whatever it says about it.
  const mentionedIds = t => [...E.nurse.acts.filter(a => hasAny(t, a.kw)).map(a => a.id), ...D.tests.filter(x => hasAny(t, x.kw)).map(x => x.id)];
  const openOrd = o => !o.cancelled && o.doneAt == null && !o.doctorDoes;
  // Who a message is for, in the nurse room; the same rules for the offline reader and the server's reading.
  // It only annotates the reading: apply() commits what it means.
  function nurseShape(read, t, text, online) {
    const N = E.nurse, X = N.esc;
    read.actions = (read.actions || []).slice(); read.tests = (read.tests || []).slice();
    read.facts = read.facts || []; read.exam = read.exam || []; read.tone = { ...(read.tone || {}) };
    const v = nurseVocs(t);
    if (v.voc) { read.facts = []; read.exam = []; }
    if (/(?:^| )(?:انا|معك|اسمي)(?: \S+)? (?:ال)?ممرض|ممرضتك|ممرضك(?: |$)/.test(t)) read.tone.introduced = true;
    if (AIRWAY_ASSESS.test(t)) { read.actions = read.actions.filter(a => a.id !== 'airway'); read.airwayAssess = true; }
    if (DRAW.test(t) && !read.tests.some(x => (testOf(x.id) || {}).group === 'lab')) read.draw = true;
    const callAct = read.actions.some(a => a.id === 'call_senior' || a.id === 'call_icu');
    read.escalate = v.call || v.help || callAct;
    read.help = v.help;
    const hasQ = /[؟?]/.test(text), rbPhrase = /(بعيد الاوامر|خليني اعيد|يعني بدك)/.test(t);
    const open = N.orders.filter(openOrd), openIds = open.map(o => o.id);
    // Review fixes 2026-11-07. A band on the wrist is not the allergy question.
    if (BAND.test(t) && !hasQ) { read.facts = read.facts.filter(f => f !== 'allergy'); read.band = true; }
    // An open order by the short name nurses use ("بعتت الكلى", "عطيته ليفو"), or "the drug" when one drug is open.
    if (!read.actions.length && !read.tests.length && open.length && EXEC_V.test(t) && !hasQ) {
      const hit = open.filter(o => ORDER_ALIAS[o.id] && ORDER_ALIAS[o.id].test(t));
      const drugs = open.filter(o => o.kind === 'act' && !o.reminder && isDrug(o.id));
      if (!hit.length && /(?:^| )(?:ال)?(?:دوا|دواء|ابره|حقنه|علاج)(?: |$)/.test(t)) {
        if (drugs.length === 1) hit.push(drugs[0]);
        else if (drugs.length > 1) { read.whichDrug = drugs.map(o => o.ar); read.noHelp = true; }
      }
      hit.forEach(o => (o.kind === 'test' ? read.tests.push({ id: o.id, reason: '', reason_ok: 'none' }) : read.actions.push({ id: o.id, agent: '', dose: '' })));
      if (hit.length) { read.facts = []; read.exam = []; }
    }
    if (!read.actions.length && !read.tests.length && /(?:خلصت|نفذت|عملت)\S* (?:كل )?(?:ال)?اوامر|(?:خلصت|عملت) كل (?:ا)?شي/.test(t)) { read.allOrders = true; read.facts = []; read.exam = []; }
    // "بقترح نعطيها فنتولين", "الدكتور رح يعطيها كورتيزون": a drug named, nothing given, no gap.
    if (SUGGEST.test(t)) {
      const plain = !/(بقترح|اقترح|نقترح)/.test(t);
      const keep = id => NURSE_OWN.has(id) || NURSE_TESTS.has(id) || id === 'oxygen' || (plain && openIds.includes(id));
      const sug = [...read.actions.map(a => a.id), ...read.tests.map(x => x.id)].filter(id => !keep(id));
      if (sug.length) { read.suggested = sug; read.noHelp = true; read.actions = read.actions.filter(a => keep(a.id)); read.tests = read.tests.filter(x => keep(x.id)); }
      else if (!read.actions.length && !read.tests.length && !read.facts.length && !read.exam.length) { read.planOnly = true; read.noHelp = true; }
      // A drug named in a plan is not a history question.
      if (!hasQ) read.facts = read.facts.filter(f => !HIST_FACTS.has(f) || f === 'allergy');
    }
    // Executing an order names its carrier ("بوتاسيوم عالسوائل") or an order already done: those are mentions.
    if (read.actions.some(a => openIds.includes(a.id)) || read.tests.some(x => openIds.includes(x.id))) {
      const doneOrd = id => N.orders.some(o => o.id === id && o.doneAt != null && !o.repeat) && !openIds.includes(id);
      const vehicle = id => id === 'fluids' && !openIds.includes('fluids') && /(?:عال|علي ال|على ال|مع ال|بال|في ال|ع ال)(?:سوائل|محلول|سيروم|سلاين)/.test(t);
      read.actions = read.actions.filter(a => !(doneOrd(a.id) || vehicle(a.id)));
      read.tests = read.tests.filter(x => !doneOrd(x.id));
    }
    const mentioned = mentionedIds(t);
    const namesOpen = mentioned.some(id => openIds.includes(id)) || read.actions.some(a => openIds.includes(a.id)) || read.tests.some(x => openIds.includes(x.id));
    // The doctor asked about allergies: a short answer in the next turns is for him.
    const allergen = Object.values(E.c.care).some(d => d.allergyKw && hasAny(t, d.allergyKw)) || /(اسبرين|aspirin|بنسلين|بنسيلين|penicillin|بروفين|ibuprofen)/.test(t);
    // («عنده ضغط وسكري» is history, not this answer: «ما عنده» alone, or with an allergy word, is.)
    const ALLERGY_ANS = /^(?:لا|لاء|لأ|اه|ايوه|ايوا|نعم|اكيد|مافي|ما في|ما بعرف|مش عارف|ما سالت\S*|لسا ما سالت\S*|مش متاكد\S*|nkda|no|yes)(?: |$)|^ما (?:عنده|عندها)$/;
    if (N.allergyAskedByDoc && !N.allergyAnswered && E.turns - N.allergyAskTurn <= 3 && !hasQ && !/(?:^| )(?:عندك|انت|انتي|معك|بتتحسس\S*)(?: |$)/.test(t)
      && ((ALLERGY_ANS.test(t) && wordsIn(t) <= 6) || ALLERGY_W.test(t) || (allergen && wordsIn(t) <= 4))) read.allergyReply = true;
    // Within the same turns, history said in the third person adds to the SBAR the doctor just heard.
    const histAdd = N.allergyAskedByDoc && !N.allergyAnswered && E.turns - N.allergyAskTurn <= 3 && !hasQ && !read.allergyReply && !read.actions.length && !read.tests.length
      && HIST_RX.test(t) && /(?:^| )(?:عنده|عندها|هو|هي|المريض\S*)(?: |$)/.test(t);
    // Read back or given while the doctor still waits for the allergy answer: the drugs he has not ordered yet.
    const heldIds = N.holdRel ? Object.entries(N.nm.orders).filter(([k, o]) => o.kind === 'act' && !o.reminder && !o.doctorDoes && isDrug(o.id || k) && orderDue(o)).map(([k, o]) => o.id || k) : [];
    const namesHeld = heldIds.length && (mentioned.some(id => heldIds.includes(id)) || read.actions.some(a => heldIds.includes(a.id)));
    if (namesHeld && !hasQ && !rbPhrase && read.actions.some(a => heldIds.includes(a.id))) { read.heldGive = read.actions.filter(a => heldIds.includes(a.id)).map(a => a.id); read.actions = read.actions.filter(a => !heldIds.includes(a.id)); }
    const dxQ = /(?:^| )(?:ال)?تشخيص|diagnos/.test(t) && !read.facts.length && !read.exam.length && !read.actions.length && !read.tests.length;
    const recWin = X.sbar && !X.sbar.none && E.turns - N.escDoneTurn <= 2 && /(?:^| )(?:تعال|تعالي|بسرعه|شوفها|شوفه|محتاجك|بحتاجك)(?: |$)/.test(t) && !read.actions.length && !read.tests.length;
    let to;
    if (read.allergyReply && v.first !== 'sup' && v.first !== 'comp') to = 'nurse';
    else if (v.first === 'comp') to = 'companion';
    else if (v.first === 'doc' || v.call || v.help) to = 'nurse';
    else if (v.first === 'sup') to = 'supervisor';
    else if (read.to === 'companion') to = 'companion';
    else if (read.toPat) to = 'patient';
    else if (X.awaiting) to = 'nurse';
    else if (N.rbTurns > 0 && X.calledAt !== null && namesOpen && (hasQ || rbPhrase)) to = 'nurse';
    else if (namesHeld && (hasQ || rbPhrase)) { to = 'nurse'; read.heldAsk = true; }
    else if (histAdd) { to = 'nurse'; read.facts = []; }
    else if (recWin) to = 'nurse';
    else if (dxQ) to = N.present ? 'nurse' : 'supervisor';
    else if ((read.suggested || read.planOnly) && !read.actions.length && !read.tests.length) to = 'supervisor';
    else if (read.heldGive && !read.actions.length && !read.tests.length) to = 'self';
    else if (read.whichDrug) to = 'supervisor';
    else if (v.gen && !read.actions.length && !read.tests.length) to = 'supervisor';
    else if (read.actions.length || read.tests.length) to = 'self';
    else if ((read.airwayAssess || read.draw || read.band || read.allOrders) && !read.facts.length && !read.exam.length) to = 'self';
    else if ((VITALS_Q.test(t) || NURSE_VITALS.test(t)) && !/(?:عندك|عنده|عندها|بتاخد|بياخد|بتاخذ|بيوخذ|معك)/.test(t)
      && ((!read.facts.length && !read.exam.length) || /(?:كم|قديش|شو) (?:ال)?(?:ضغط|نبض|اكسجين|ارقام|حراره|تنفس|ساتورشن|spo2|sat|سات)|(?:ال)?(?:ضغط|نبض|اكسجين|ارقام|حراره|تنفس|spo2|sat|سات)\S* (?:كم|قديش)/.test(t))) { read.facts = []; read.exam = []; read.actions = [{ id: 'bp_repeat', agent: '', dose: '' }]; to = 'self'; }
    else if (online && read.to === 'nurse' && !read.actions.length && !read.tests.length) to = 'nurse';
    else if (online && read.to === 'supervisor') to = 'supervisor';
    else to = 'patient';
    // Re-routed to the relative: telling them what happens next is explaining.
    if (to === 'companion' && read.to !== 'companion') read.tone.explained = read.tone.explained || /(?:^| )[وف]?(?:رح|راح|عم ن\S*|بنعطي|بنعمل|الوضع|حالتها|حالته|جاي|جايه|بيجي|بتيجي)(?: |$)/.test(t);
    // Explaining the plan to the relative ("رح نعطيها بخار") asks them nothing.
    if (to === 'companion' && read.tone.explained && !hasQ) read.facts = [];
    if (read.suggested && (to === 'patient' || to === 'companion') && !hasQ) { read.tone.explained = true; read.facts = []; }
    // Messages to the doctor never execute; a read-back is noted; a plain "I'm giving X" with an open order does run.
    if (to === 'nurse') {
      read.mentioned = [...new Set([...read.actions.map(a => a.id), ...read.tests.map(x => x.id), ...mentioned])];
      if (namesOpen && (hasQ || rbPhrase)) read.readBack = true;
      if (namesOpen && !hasQ && !rbPhrase && !X.awaiting && X.sbar !== null && !v.call && !v.help && !read.allergyReply && (read.actions.length || read.tests.length)) { read.readBack = true; to = 'self'; }
      else { read.actions = []; read.tests = []; }
    }
    if (to === 'nurse' && read.allergyReply) read.facts = [];
    // A drug named in "I'm giving X" is not a history question; words to the doctor are not asked of the patient.
    if (to === 'nurse' || (to === 'self' && !hasQ)) { read.facts = []; read.exam = to === 'nurse' ? [] : read.exam; }
    read.to = to;
    read.toDoc = to === 'nurse';
    if (to === 'supervisor') read.kind = 'help'; else if (read.kind === 'help') read.kind = 'other';
    return read;
  }
  // The teaching questions come in turn and none twice; after the last, the supervisor lets the trainee work.
  function teachLine() {
    E.teachAt = (E.teachAt || 0);
    const after = ['كمّل، أنا هون إذا احتجتني. احكيلي أهم رقم وشو خطوتك الجاية.', 'شو تغيّر بالأرقام بعد آخر إشي عملته؟', 'لخّصلي الحالة بجملتين: شو عندك، وشو ناقص؟'];
    if (E.teachAt >= E.c.teach.length) return after[(E.teachAt++ - E.c.teach.length) % after.length];
    return E.c.teach[E.teachAt++];
  }
  // Offline, the supervisor answers the kind of question asked; he never names the diagnosis.
  function supervisorLine(read, t) {
    const c = E.c, drug = (read.named || []).map(id => ({ id, care: c.care[id] || {}, meta: actOf(id) })).find(x => x.meta && x.meta.dose);
    const reasoningQ = /(?:^| )(?:ليش|ليه|لماذا|why|متي|امتي|لو|اذا|وقتها)(?: |$)/.test(t);
    if (drug && (!reasoningQ || /\d\s*(?:ملغ|مغ|غرام|mg|mcg|ml|مل|وحد|unit)/.test(t))) {
      const dose = doseIn(read.text || '');
      if (drug.care.harm || drug.care.off) return `${drug.meta.ar}؟ فكّر منيح قبل ما تعطيه: شو ممكن يعمل بهالمريض بالذات؟`;
      if (!dose) return `${drug.meta.ar}، ماشي. شو الجرعة والطريق اللي ببالك؟ احكيها وبراجعك.`;
      const ok = doseCheck({ id: drug.id, dose, said: read.text }, drug.care, read.text);
      if (ok === 'ok') return `${drug.meta.ar} ${dose} مزبوط، اطلبه من الممرضة.`;
      if (ok === 'wrong') return `لا، ${drug.meta.ar} ${dose} مش مزبوط. ${drug.care.dose ? 'المعتاد: ' + drug.care.dose : 'راجع الجرعة.'}`;
      return `${drug.meta.ar} ${dose}: اكتبه للممرضة بالجرعة والطريق، وهي بتراجعك إذا في إشي.`;
    }
    if (/(?:ننقل|نحول|نحجز|ندخل|عنايه|icu|طابق|البيت|نروح|اطلع)/.test(t)) return 'الوجهة بتقررها حسب استجابته للعلاج وثبات الأرقام. شو آخر أرقام عندك، وتحسن ولا لأ؟';
    if (/(?:ممكن (?:انا )?ابدا|من وين ابدا|شو اعمل|مش عارف|محتار|ساعدني)/.test(t)) return 'ابدأ هسا ولا تستنى: ABC أول. شو أهم رقم عالمونيتور، وشو أول order بدك تطلبه؟';
    if (!reasoningQ && (/(?:صح|مزبوط)$/.test(t) || /(?:صح|مزبوط) /.test(t))) return 'شو الدليل اللي عندك؟ احكيلي أهم نتيجة أو علامة بتدعمه.';
    return teachLine();
  }
  // Offline, the nurse says what she sees and what nurses start with, reads a result's numbers, and asks what is wanted.
  function nurseLine(read, t) {
    const v = E.show || live(), c = E.c;
    const asked = D.tests.filter(x => hasAny(t, x.kw) && E.tests[x.id] && E.tests[x.id].back).map(x => x.id);
    if (asked.length) return asked.map(id => resultBrief(id)).join(' ');
    if (/(?:شو (?:ب)?رايك|نبدا|ابدا|شو نعمل|من وين)/.test(t)) {
      const first = [];
      if (Math.round(v.spo2) < 94 && !E.done.has('oxygen')) first.push('الأكسجين');
      if (!E.done.has('iv_access')) first.push('الكانيولا');
      return `دكتور، الـSpO2 ${Math.round(v.spo2)}% والنبض ${Math.round(v.hr)}.${first.length ? ' عادةً بنبلش ب' + first.join(' و') + '، ' : ' '}شو بتطلب؟`;
    }
    if (/(?:حجم|غيج|gauge|g )/.test(t) && /(?:كانيولا|كانولا|كنيولا|cannula)/.test(t)) return 'غيج 18 عالأقل، كبيرة كفاية للسوائل والدم. أركّبها؟';
    if (VITALS_Q.test(t)) return spokenVitals() + '.';
    return 'تمام، شو بدك أعمل؟';
  }
  // A result said aloud: its name and its first two values.
  function resultBrief(id) {
    const r = c0().results[id] || {}, meta = testOf(id);
    const rows = (r.rows || []).slice(0, 2).map(x => x[0] + ' ' + x[1] + (x[2] ? ' ' + x[2] : ''));
    return `${meta.ar}: ${rows.length ? rows.join('، ') : (r.report || '').slice(0, 90)}.`;
  }
  const c0 = () => E.c;
  function localReply(read) {
    const c = E.c, t = norm(read.text || '');
    if (E.pending && read.pending_ok !== 'na') return null;
    if (read.to === 'supervisor') return NM() ? instructorLine(read, t) : supervisorLine(read, t);
    const held = read.facts.map(id => c.facts.find(x => x.id === id)).filter(Boolean);
    // A question inside an order is still a question: someone answers it.
    if (held.length) {
      const comp = held.find(x => x.who && x.who !== 'patient'), pat = held.find(x => x.who !== 'companion');
      const f = read.to === 'companion' ? comp || pat : pat || comp;
      const askedTo = read.to;
      read.to = f === pat && !(read.to === 'companion' && f.who === 'both') ? 'patient' : 'companion';
      read.saidFact = f.id;
      // A message with several questions gets every answer, each from whoever holds it, one line after another.
      held.filter(x => x !== f).forEach((x, k) => {
        const compHas = x.who && x.who !== 'patient', patHas = x.who !== 'companion';
        const who = askedTo === 'companion' ? (compHas ? 'c' : 'p') : (patHas ? 'p' : 'c');
        later(0.3 * (k + 1), () => { if (who === 'p' && E.stage === 3) return; person(who, x.say); E.facts.add(x.id); });
      });
      return f.say;
    }
    // Nurse mode: a step she did and the room recorded needs no reply from anyone.
    if (NM() && read.to !== 'companion' && (read.to === 'self' || read.draw || read.airwayAssess || read.band || read.allOrders)) return null;
    if (read.forbids && !read.actions.length && !NM()) { read.to = 'nurse'; return 'تمام، ما بعطيه.'; }
    // Telling the family the plan names the treatment; it does not order it.
    if (read.unclear && read.to !== 'companion' && !NM()) { read.to = 'nurse'; return `${read.unclear}؟ بدك إياه؟`; }
    // Nurse mode: the doctor's words come from docLine in apply(), never from here.
    if (read.to === 'nurse' && NM()) return null;
    if (read.to === 'nurse' && !read.actions.length && !read.tests.length) {
      return nurseLine(read, t);
    }
    // An order with a question about the numbers: she reads them before she reads the order back.
    if (read.to === 'nurse' && read.actions.length && !read.actions.some(a => ['bp_repeat', 'temp'].includes(a.id)) && VITALS_Q.test(t) && /(?:كم|قديش|كام|شو)/.test(t)) return spokenVitals() + '.';
    if (read.to === 'nurse' && read.actions.some(a => a.id === 'iv_access') && /(?:حجم|غيج|gauge)/.test(t)) return 'غيج 18 عالأقل، كبيرة كفاية للسوائل والدم.';
    if (read.to === 'nurse') return null;
    // Spoken to, the relative answers what was said; being told what is happening settles them.
    if (read.to === 'companion') {
      const L = c.companion.lines, kind = read.tone.explained || read.tone.empathy ? 'heard' : 'answer';
      const own = fresh(L[kind] || []), other = fresh(L[kind === 'heard' ? 'answer' : 'heard'] || []);
      // Out of words, a relative just nods: a short reply, never the same speech again.
      const x = own.length ? pickOf(own).say : other.length ? pickOf(other).say : pickOf(['طيب يا دكتور.', 'ماشي.', 'إن شاء الله خير.', 'طيب.']);
      E.comp.used.add(x);
      return x;
    }
    if (read.actions.length || read.tests.length || read.exam.length) return null;
    if (read.kind === 'open') return c.patient.opening;
    if (read.kind === 'smalltalk') return socialReply(read.act, read.text);
    // The plan told to the patient ("هلا بنعطيكي بخار"): a nod, not confusion.
    if (NM() && read.suggested && read.to === 'patient') return 'طيب...';
    // An order nobody could place belongs to the nurse, not to the patient.
    if (read.typedOrder && NM()) { read.to = 'supervisor'; read.noHelp = true; return 'شو الخطوة بالزبط؟'; }
    if (NM() && read.tone && read.tone.introduced) return 'أهلين.';
    if (read.typedOrder) { read.to = 'nurse'; return 'مش فاهمة عليك دكتور، شو بالزبط بدك؟'; }
    if (/[؟?]/.test(read.text || '')) return c.patient.sex === 'F' ? 'مش فاهمة قصدك يا دكتور... شو بالزبط؟' : 'مش فاهم قصدك يا دكتور... شو بالزبط؟';
    // Nobody in a resus bay leaves a doctor unanswered: the patient says what a patient would.
    return c.patient.sex === 'F' ? pickOf(['مش فاهمة عليك يا دكتور...', 'مش قادرة أركّز... شو قصدك؟', 'ما بعرف يا دكتور...']) : pickOf(['مش فاهم عليك يا دكتور...', 'مش قادر أركّز... شو قصدك؟', 'ما بعرف يا دكتور...']);
  }

  /* ---------- a message from the student ---------- */
  let chain = Promise.resolve();
  function send(text) {
    text = (text || '').trim();
    if (!text || !E || E.over) return;
    person('me', text);
    E.started = true;
    E.typedThisTurn = false;
    const my = E;
    // A message still queued when the case ends goes nowhere and costs nothing.
    chain = chain.then(() => (E === my && !E.over ? handle(text) : null)).catch(e => console.error(e));
  }

  async function handle(text) {
    if (NM()) return handleNurse(text);
    const my = E;
    const dots = typing();
    const pending = E.pending;
    const r = await call({ text, pending: pending ? { ask: pending.ask } : undefined });
    if (!r && !ACT && !actRetried) { actRetried = true; await loadAct(); }
    dots.remove();
    if (E !== my || E.over) return;
    const read = (r && r.read) || localRead(text);
    read.text = text;
    // The server's reading survives even when its voice failed: the case's own line says it.
    const spoken = r && !r.voiceFailed;
    if (r && !spoken) read.to = r.to;
    // localReply may hand a line to the companion, so read.to is only final after it.
    const reply = spoken ? (r.held ? teachLine() : r.reply) : localReply(read);
    apply(read, text, spoken ? r.to : read.to, reply);
  }

  // An unanswered question comes back, and nothing is given on silence.
  function remind(open) {
    open.wait = (open.wait || 0) + 1;
    if (open.type === 'interpret') {
      if (open.wait >= 2) {
        settle(q => q === open);
        // A question left unanswered is closed out loud, once a case, not dropped in silence.
        if (!E.readNudged) { E.readNudged = true; person('d', `طيب، ارجعلي عالـ${testOf(open.id).en} لما تخلّص هالخطوة.`); }
      }
      return;
    }
    // She names the drug she is waiting on: a busy doctor has forgotten which one.
    const nm = open.name || (open.a && actOf(open.a.id) ? actOf(open.a.id).ar : 'الدوا');
    if (open.wait >= 4) {
      nurse(open.type === 'unsafe' ? `ما رح أعطي ${nm} قبل ما تأكدلي.` : open.type === 'dose' ? `ما بعطي ${nm} بدون جرعة. احكيلي لما تقرر.` : 'ما بطلبه بدون استطباب. احكيلي لما تقرر.');
      settle(q => q === open);
    } else if (open.wait % 2 === 0) {
      nurse(open.type === 'unsafe' ? `دكتور، ${nm}: بعطيه ولا لأ؟` : open.type === 'dose' ? (open.tip ? `دكتور، ${nm}: ${open.tip}${open.sug ? '، ماشي؟' : ''}` : `دكتور، ${nm}: قديش بدك؟`) : 'دكتور، لسا مستنية جوابك على طلبك.');
    }
  }

  function apply(read, text, to, reply) {
    const t = read.tone || {};
    E.collect = [];
    E.rbBuf = [];
    E.turns++;
    if (t.introduced) E.comm.introduced = true;
    if (t.consent) E.comm.consent = true;
    if (t.rude) { E.comm.rude++; E.anx = clamp(E.anx + 24, 0, 100); log('comm', 'كلام جارح أو متجاهل للأهل'); }
    if (t.empathy) { E.comm.empathy = true; }
    if (t.jargon && (to === 'companion' || to === 'patient')) { E.comm.jargon++; E.anx = clamp(E.anx + 7, 0, 100); }
    // Orders, tests, an examination or history from the patient: the doctor is working.
    const working = (read.actions || []).length || (read.tests || []).length || (read.exam || []).length || (to === 'patient' && (read.facts || []).length);
    if (working) E.busyTurn = E.turns;
    if (to === 'companion') {
      const c = E.comp;
      c.asked = null; c.ignored = 0; c.unheard = 0; c.heardTurn = E.turns;
      c.addressed++;
      // Asked to wait outside, the relative is out of the room for a while; spoken to again, back in.
      c.outUntil = STEP_OUT.test(norm(text)) ? E.sim + 3 : 0;
      if (t.explained || t.empathy) { E.comm.explained = true; E.anx = clamp(E.anx - 24, 0, 100); c.lastTurn = E.turns + 1; c.lastAt = E.sim; c.gen++; c.explainedTurn = E.turns; log('comm', 'شرح للأهل فهدأوا'); }
      else E.anx = clamp(E.anx - 6, 0, 100);
    } else {
      // Seeing the team work steadies a relative; a question left hanging does not.
      const waited = E.comp.asked !== null ? E.turns - E.comp.asked : 0;
      E.anx = clamp(E.anx + (working ? -1 : waited === 3 ? 6 : waited > 3 ? 2 : 1), 0, 100);
      if (to === 'patient' && t.explained) E.comm.explained = true;
    }

    let open = E.pending;
    // Words to the relative answer nobody's open question. (Offline, "patient" is only the default reader's guess.)
    if (open && to === 'companion' && !(read.actions || []).length && !(read.tests || []).length) read.pending_ok = 'na';
    if (open && open.type === 'dose' && dropNamed(text)) { open = null; read.actions = []; }
    // A bare yes to the nurse's proposal is an answer whoever reads it, unless the reader heard a refusal.
    if (open && open.type === 'dose' && open.sug && ACCEPT.test(norm(text)) && !(read.actions || []).length && !['withdraw', 'wrong'].includes(read.pending_ok)) read.pending_ok = 'good';
    // Acting is not reading: an order sent over a teaching question is no misread result.
    if (open && open.type === 'interpret' && ((read.actions || []).length || (read.tests || []).length)) read.pending_ok = 'na';
    // What a "yes" gave is read back before the nurse's next question.
    if (open && read.pending_ok && read.pending_ok !== 'na') { resolve(read.pending_ok, text); flushBack(); E.rbBuf = []; }
    // Talking to the relative does not use up the supervisor's question.
    else if (open && !(open.type === 'interpret' && to === 'companion') && !((open.type === 'dose' || open.type === 'reason') && (to === 'patient' || to === 'companion') && !(read.actions || []).length && !(read.tests || []).length) && (open.type === 'unsafe' || ![...(read.actions || []), ...(read.tests || [])].some(x => x.id === (open.a ? open.a.id : open.id) && (x.dose || x.reason)))) remind(open);
    // A patient the nurse calls unresponsive does not recite a history, and nothing unheard counts as asked.
    const mute = E.stage === 3 && (to === 'patient' || to === 'room');
    const line = mute ? pickOf((E.c.stageLines.critical || {}).patient || ['...']) : reply;
    if (line && !mute && (to === 'patient' || to === 'companion' || to === 'room')) {
      (read.saidFact ? [read.saidFact] : read.facts || []).forEach(id => {
        const f = E.c.facts.find(x => x.id === id);
        if (f && (to === 'companion' ? f.who && f.who !== 'patient' : f.who !== 'companion')) {
          // Some answers the nurse acts on at once, such as an allergy going on the chart and a band.
          if (f.nurseNote && !E.facts.has(id)) later(0.3, () => nurse(f.nurseNote));
          E.facts.add(id);
        }
      });
    }
    if (NM()) nursePre(read, text, to);
    (read.exam || []).forEach(examine);
    if (line) person(to === 'companion' ? 'c' : to === 'nurse' ? 'n' : to === 'supervisor' ? 'd' : 'p', line);
    if (to === 'supervisor' && !read.noHelp) E.helps++;
    const answered = E.resolved && open ? (open.a ? open.a.id : open.id) : null;
    const swapped = a => open && open.type === 'unsafe' && open.allergic && !allergicTo(a, E.c.care[a.id] || {}, text);
    const once = (x, i, all) => all.findIndex(y => y.id === x.id) === i;
    (read.actions || []).filter(once).filter(a => a.id !== answered || swapped(a)).forEach(a => (NM() ? nurseAct(a, text) : order(a, text)));
    (read.tests || []).filter(once).filter(x => x.id !== answered).forEach(x => (NM() ? nurseTest(x.id, x.reason, x.reason_ok) : orderTest(x.id, x.reason, x.reason_ok)));
    flushBack();
    const col = (E.collect || []).filter(x => E.pending === x.p || E.queue.some(([q]) => q === x.p));
    E.collect = null;
    if (col.length) {
      const first = (col.find(x => x.p === E.pending) || col[0]).line;
      const held = E.queue.find(([q]) => q.type === 'unsafe');
      // Safety first: a "yes" must never land on a question the trainee did not mean.
      if (E.pending && E.pending.type === 'dose' && held) {
        E.queue = [[E.pending, first, 'n'], ...E.queue.filter(x => x !== held)];
        E.pending = held[0];
        E.pending.since = E.sim;
        person(NM() && held[2] === 'n' ? 'd' : held[2], held[1]);
      } else if (!E.pending || E.pending.type === 'dose') openDoses(first);
    }
    // The senior is standing in the room: asking him is calling him.
    if (!NM() && to === 'supervisor' && read.kind === 'help' && E.c.care.call_senior && !E.done.has('call_senior')) E.done.set('call_senior', { at: E.sim, last: E.sim, n: 1, dose: '', ok: 'good', amt: 0 });
    E.resolved = false;
    if (NM()) nursePost(read, to);
    director(to === 'companion' ? 'addressed' : 'turn');
  }

  function examine(id) {
    const x = E.c.exam.find(f => f.id === id);
    if (!x) return;
    const firstTime = !E.exam.has(id);
    E.exam.add(id);
    const out = E.anaph && !E.anaph.treated && x.sayReact ? x.sayReact : E.stage === 3 && x.sayCritical ? x.sayCritical : x.say;
    say('exam', out);
    E.chat.push({ r: NM() ? 's' : 'n', t: 'فحص: ' + out });
    if (NM() && firstTime) E.nurse.examAt[id] = E.sim;
    if (firstTime) log('exam', 'فحصت: ' + out);
  }

  /* ---------- orders ---------- */
  // One open question at a time, the rest wait their turn.
  // Only a bare yes accepts: "تمام بلاش الكورتيزون" and "اه لحظة" are not a yes.
  const YES_WORD = 'اه|ايوا|ايوه|نعم|تمام|ماشي|اوكي|اوك|ok|okay|yes|اكيد|طيب|موافق|مزبوط|نمشي|نفذي?|يلا';
  const ACCEPT = new RegExp('^(?:' + YES_WORD + '|زي ما (?:قلتي|اقترحتي)|علي كلامك)(?: (?:' + YES_WORD + '|دكتوره?|سستر|كلهم|هيك|اعطيهم|عطيهم|ابدئي))*$');
  const YES_FIRST = new RegExp('^(?:' + YES_WORD + ')(?: |$)');
  const bundleLine = list => 'حاضر دكتور. بقترح: ' + list.map((p, i) => `${'١٢٣٤٥٦٧٨'[i]}) ${p.name}: ${p.tip || 'أي نوع وكم؟'}`).join(' — ') + ' — موافق؟ أو غيّر أي واحد.';
  // All open doses are one question, with the ones she has a proposal for first.
  function openDoses(first) {
    const items = [...(E.pending ? [[E.pending, first, 'n']] : []), ...E.queue.filter(([q]) => q.type === 'dose')];
    if (!items.length) return;
    items.sort((a, b) => (b[0].sug ? 1 : 0) - (a[0].sug ? 1 : 0));
    E.queue = [...items.slice(1), ...E.queue.filter(([q]) => q.type !== 'dose')];
    E.pending = items[0][0];
    E.pending.since = E.sim;
    const doseLine = items.length === 1 ? items[0][1] : bundleLine(items.map(i => i[0]));
    nurse(doseLine, { d: doseLine });
  }
  // A safety challenge goes first, then the proposals together, then the rest.
  function nextQuestion() {
    if (E.pending || !E.queue.length) return;
    const i = E.queue.findIndex(([q]) => q.type === 'unsafe');
    if (i >= 0) {
      const [n] = E.queue.splice(i, 1), care = E.c.care[n[0].a.id];
      // The fluids went in while the challenge waited: the order now goes through.
      if (n[0].def.early && care && !tooEarly(care)) { order({ ...n[0].a }, ''); nextQuestion(); return; }
      ask(...n);
      return;
    }
    if (E.queue.some(([q]) => q.type === 'dose')) { openDoses(); return; }
    ask(...E.queue.shift());
  }
  // "بلاش الكورتيزون" while proposals are open takes that one out, and only that one.
  function dropNamed(text) {
    const t = norm(text), isDose = q => q && q.type === 'dose';
    const off = [E.pending, ...E.queue.map(([q]) => q)].filter(isDose).filter(p => { const at = mentionsOf(t, actOf(p.a.id).kw); return at.length && !at.some(i => freeAt(t, i)); });
    if (!off.length) return false;
    E.queue = E.queue.filter(([q]) => !off.includes(q));
    if (off.includes(E.pending)) E.pending = null;
    nurse(`تمام، شلت ${off.map(p => p.name).join(' و')}.`);
    if (YES_FIRST.test(t)) {
      const rest = [E.pending, ...E.queue.map(([q]) => q)].filter(q => isDose(q) && q.sug);
      E.queue = E.queue.filter(([q]) => !rest.includes(q));
      if (rest.includes(E.pending)) E.pending = null;
      rest.forEach(q => order({ ...q.a, dose: q.sug, sayDose: q.tip.split(' (أو')[0].split('، ')[0], _asked: true }, text));
    }
    nextQuestion();
    return true;
  }
  function ask(p, line, who = 'n') {
    if (NM() && who === 'n') who = 'd';
    const same = q => q.type === p.type && (q.a ? q.a.id : q.id) === (p.a ? p.a.id : p.id);
    // The same order again while its question is open: the question comes back, not silence.
    if (E.pending && same(E.pending)) { if ((E.pending.wait || 0) % 2 === 1) person(who, line); return; }
    if (E.queue.some(([q]) => same(q))) return;
    // A teaching question never holds up an order.
    if (E.pending && E.pending.type === 'interpret' && p.type !== 'interpret') E.pending = null;
    if (E.pending) {
      E.queue.push([p, line, who]);
      // Several doses asked in one message are one proposal, not several questions.
      if (p.type === 'dose' && E.collect) E.collect.push({ p, line });
      else if (p.type !== 'interpret' && !E.collect) nurse('لحظة دكتور، جاوبني أول عالسؤال اللي فوق.');
      return;
    }
    E.pending = p;
    p.since = E.sim;
    if (p.type === 'dose' && E.collect) { E.collect.push({ p, line }); return; }
    person(who, line);
  }
  // "levofloxacin instead of penicillin" names the allergen without ordering it; only the word
  // right before each mention decides, so "tazocin without delay" is still tazocin.
  const allergicTo = (a, def, text) => {
    if (!def.allergyKw) return false;
    const written = norm(a.agent ? a.agent + ' ' + (a.dose || '') : text);
    const at = [];
    def.allergyKw.forEach(k => {
      const word = norm(k);
      for (let i = written.indexOf(word); i >= 0; i = written.indexOf(word, i + 1)) at.push([i, word.length]);
    });
    // Spellings and typos nobody listed: amoxycillin, co-amoxyclav, اوغمانتين.
    if (def.allergyStem) for (const m of written.matchAll(new RegExp(def.allergyStem, 'g'))) at.push([m.index, m[0].length]);
    return at.some(([i, n]) => {
      const start = written.lastIndexOf(' ', i) + 1;
      const before = written.slice(0, start).trim().split(' ').slice(-3).join(' ');
      return freeAt(written, start + 1) && !/(حساسيه|حساسيته|allerg\w*)( من| to)?( ?ب?ال)?$/.test(before) && !/^allerg/.test(written.slice(i + n).trim());
    });
  };

  // An order the case file never planned for: the nurse asks why, as she would.
  const offCase = meta => ({
    harm: true, off: true, risk: meta.risky ? 8 : 0, label: meta.ar + ' دون استطباب',
    why: meta.risky ? 'لا استطباب له في هذه الحالة، وقد يضر المريض.' : 'لا استطباب له في هذه الحالة، ولم يغيّر شيئاً.',
    challenge: `دكتور، ${meta.ar}؟ شو الاستطباب هون؟ متأكد؟`, effect: 'ساءت حالة المريض.',
  });
  // Safe only once the patient is sick enough: by the reading on the monitor when the case gives one.
  // A pressor holding the number up does not mean the pressure is holding.
  const untreatedSbp = () => Math.min(vitalsAt(E.risk).sbp, Number(E.bp[0]) || 999);
  const tooEarly = def => {
    const h = def.stableHarm;
    if (!h) return false;
    if (E.anaph && !E.anaph.treated) return false;
    if (h.unlessDone && E.done.has(h.unlessDone)) return false;
    if (h.sbp) return untreatedSbp() >= h.sbp;
    if (h.hrAbove) return E.vtNow || live().hr > h.hrAbove;
    return E.stage < (h.stage || 3);
  };
  // Beside adrenaline these are fair during anaphylaxis, whatever the case file planned.
  const ADJUNCT = ['neb_salbutamol', 'steroid'];
  // IV push with a pulse is the classic fatal error in anaphylaxis.
  const ivPush = t => /(?:^| )(?:iv|وريد\S*|push|بوش|bolus)(?: |$)/.test(t) && !/(?:^| )(?:im|عضل\S*|بالعضل|فخذ\S*|infusion|تسريب|مضخه|بطيء)(?: |$)/.test(t);
  // The numbers and the reader can each object; neither can overrule the other's objection.
  const SUBCUT = /(?:^| )(?:تحت الجلد|subcut\S*|sc|s c|sq)(?: |$)/;
  const doseBad = (a, def, text, reader) => doseCheck(a, def, text) === 'wrong' || reader === 'wrong' || (a.id === 'adrenaline' && E.anaph && !E.anaph.treated && ivPush(norm((a.dose || '') + ' ' + text))) || (def.ivOnly && SUBCUT.test(norm((a.dose || '') + ' ' + text)));

  function again(a, meta, def, prev) {
    const r = meta.repeat;
    if (!r || def.once) { nurse(`${meta.ar}؟ عملناه من شوي.`, 'سبق أن نفّذت هذا قبل قليل.'); return false; }
    if (prev.n >= r.max) { nurse(`${meta.ar} أخدنا كفاية منه، شو الخطوة الجاية؟`, 'بلغ هذا الحد الأقصى المقرر، فلم يُنفَّذ.'); return false; }
    if (E.sim - prev.last < r.gap) { nurse(`${meta.ar}؟ لسا معطيينه، خلينا نشوف تأثيره.`, 'انتظر أثر ما أعطيته أولاً.'); return false; }
    return true;
  }

  function overTotal(a, meta, def) {
    const cap = def.total || meta.total, prev = E.done.get(a.id);
    if (!cap || !prev) return false;
    if ((prev.amt || 0) + amountOf(a, def, a.said || '') <= cap.hi * SCALE[cap.unit][1]) return false;
    badDose({ ...a, dose: a.dose + ' (فوق المجموع)' }, meta, def);
    nurse(`دكتور، مجموع ${meta.ar} صار فوق الحد. ما بقدر أزيد.`, 'تجاوز ذلك الكمية المقررة، فلم يُنفَّذ.');
    return true;
  }

  /* =========================================================
     NURSE MODE (2026-11-07). The trainee is the ER nurse responsible for the bed. The ER doctor (n) is
     outside and comes when called; the clinical nurse instructor (d) stands behind the trainee. Scope follows
     typical ED nursing protocols: assessment, vitals, positioning, oxygen for low SpO2, a cannula, bedside tests,
     drawing blood and escalation are the nurse's own; drugs, fluids, lab tests and imaging need the doctor's order.
     The doctor's orders come only from the case file (case.nurseMode, pinned by patch-12); his and the instructor's
     words are fixed lines, never model-written. Cases and these lines are not physician-reviewed.
     ========================================================= */
  const NURSE_OWN = new Set(['sit_up', 'iv_access', 'temp', 'bp_repeat', 'cpr', 'call_senior', 'call_icu']); // oxygen: see nurseAct
  const NURSE_TESTS = new Set(['ecg', 'glucose', 'peak_flow']); // abg and lactate need an order even though the catalog calls them bedside
  const DOCTOR_ONLY = new Set(['cath_lab', 'call_surgery', 'shock']); // plus airway support and a urinary catheter: by order only
  const REASSESS_WIN = 5, ESC_SPOKEN_MIN = 8, O2_OWN = 94;
  // Basic airway support (opening the airway, bag-valve-mask) is basic life support: the nurse's own.
  const BLS_AIR = /امبو|ambu|bvm|ambu bag|jaw thrust|chin lift|فتح (?:ال)?مجري|افتح (?:ال)?مجري|شفط|suction|رفع (?:ال)?فك|دفع (?:ال)?فك|رفع (?:ال)?ذقن/;
  const ADV_AIR = /تنبيب|نبب|intubat|انبوب|cpap|bipap|niv|rsi|بايباب|سيباب|سي باب|ضغط ايجابي/;
  const OWN_KEYS = ['oxygen', 'iv_access', 'sit_up'];
  const SCOPE_NOTE = 'الأدوية والسوائل والفحوصات المخبرية والتصوير خارج صلاحية التمريض المستقلة في بروتوكولات الطوارئ المعتادة';
  const isDrug = id => !!(actOf(id) || {}).dose && id !== 'oxygen';
  function newNurseState(c) {
    const nm = c.nurseMode, doc = nm.doctor.name;
    return {
      nm, doc, sex: nm.doctor.sex, present: false,
      esc: { calledAt: null, by: null, awaiting: false, awaitAt: null, asked: null, before: null, buf: '', turns: 0, unans: 0, sbar: null, reNeeded: null, reNeededAt: null, updateAt: null, contacts: [], hello: false, nagged: false },
      orders: [], ordersAt: null, relTurn: -99, rbTurns: 0, readBack: false,
      scope: [], scopeSaid: new Set(), notIndicated: [], given: [], interv: [], vchecks: [], stageAt: {}, lowAt: null, drawn: null, airwayAt: null, tempAt: null, allergyAt: null, examAt: {},
      said: new Set(), teachAt: 0, reassess7: 0, last7: -9, allergyToldDoc: false, allergyAskedByDoc: false, bandNoted: false, docDoing: false, lastShock: -9, alarmAt: null,
      allergyAskTurn: -99, allergyAnswered: false, allergyGuess: null, holdRel: null, escDoneTurn: -99, helpAt: [], bls: [],
      acts: D.actions.map(a => (NURSE_KW[a.id] ? { ...a, kw: a.kw.concat(NURSE_KW[a.id]) } : a)),
      rx: { docv: DOCV(norm(doc)), supv: SUPV_N(norm(c.nurse.name)), compv: compVoc(c) },
    };
  }
  // The relative called by name or by a kinship word, never by a word this patient is also called by.
  function compVoc(c) {
    const pat = new Set((c.patient.addr || []).map(w => norm(w).replace(/^يا /, '')));
    const words = ['حجه', 'حجي', 'خالتي', 'خاله', 'خالتو', 'عمي', 'عمو'].filter(w => !pat.has(w)).concat([norm(c.companion.name)]).join('|');
    return new RegExp('(?:^| )يا (?:' + words + ')(?= |$)|^(?:' + words + ')(?= |$)');
  }
  const comes = () => (E.nurse.sex === 'F' ? 'جاية' : 'جاي');
  const docW = () => (E.nurse.sex === 'F' ? 'الدكتورة' : 'الدكتور');
  const docT = () => (E.nurse.sex === 'F' ? 'الطبيبة' : 'الطبيب');
  const docKnows = () => (E.nurse.sex === 'F' ? 'الطبيبة على علم بالحالة، وهي من تطلب العناية المركزة.' : 'الطبيب على علم بالحالة، وهو من يطلب العناية المركزة.');
  const docTitle = () => (E.nurse.sex === 'F' ? 'الدكتورة ' : 'الدكتور ') + E.nurse.doc;
  const reached = () => E.nurse.esc.calledAt !== null || E.nurse.present;
  // The escalation deadline: a number of minutes, or (STEMI) two minutes after the ECG, ten at most.
  function escBy() {
    const b = E.nurse.nm.escBy;
    if (typeof b === 'number') return b;
    const t = E.tests[b.after];
    return t ? Math.min(t.at + b.plus, b.max) : b.max;
  }
  // The instructor's fixed lines: each once.
  function dOnce(key, line) {
    const N = E.nurse;
    if (!E || E.over || N.said.has(key)) return false;
    N.said.add(key); E.hints++; person('d', line);
    return true;
  }
  // Every number in a message, without the 2 of SpO2 or the 12 of 12-lead.
  const numsIn = raw => (digits(String(raw || '')).replace(/sp ?o2|o2|12[ -]?lead|١٢ ?ليد/gi, ' ').replace(/\d+(?:\.\d+)?\s*(?:ملغ|مغ|ملجم|mg|mcg|ميكرو\S*|ml|مل|cc|لتر|ليتر|l\/min|lpm|units?|وحد\S*|mmol|مليمول|غرام|جرام|g\b|kg|كيلو|سنه|سنة|سنين|عام|ساعه|ساعة|ساعات|دقيق\S*|يوم|ايام)/gi, ' ').match(/\d+(?:\.\d+)?/g) || []).map(Number);
  const HIST_RX = /(معروف|معروفه|مزمن|مزمنه|تاريخ مرضي|قصه مرضيه|history|امراض|حساسي|تحسس|allerg|nkda|سكري|ربو|بخاخ|انسولين|عمليه|جراحه|حبوب منع|ادويته|ادويتها|(?:بياخد|بتاخد|بياخذ|بتاخذ|بيستعمل|بتستعمل) (?:\S+ )?(?:دوا|ادوي|حبوب|حب|بخاخ|انسولين|علاج|مميع|اسبرين|كورتيزون)|(?:عنده|عندها|مريض|مريضه) (?:ال)?(?:ضغط|سكري|ربو|قلب|كلي|قصور|صرع|جلطه|ذبحه)(?! *\d))/;
  const HIST_FACTS = new Set(['known', 'meds', 'allergy', 'icu', 'steroids_recent', 'controller', 'reliever', 'pill', 'surgery', 'clot_family', 'ckd', 'nsaid', 'prior', 'insulin', 'lung_hx', 'family', 'family_c', 'pregnant', 'bleeding', 'pde5', 'recent_care', 'sugar_home', 'smoke', 'clinic', 'illness', 'father_stop']);
  // A message read for SBAR. Two points a part; A only with real readings, checked against the monitor.
  function gradeSbar(raw) {
    const t = norm(raw), c = E.c, N = E.nurse;
    const who = [c.patient.name, ...(c.patient.addr || [])].map(norm).filter(Boolean).some(w => (' ' + t + ' ').includes(' ' + w + ' ') || (w.length >= 4 && t.includes(w)));
    const s = t.length >= 15 && (who || /(مريض|مريضه|سرير|عمره|عمرها)/.test(t) || /(قلقان|قلقانه|خايف|متخوف|بتسوء|بتتدهور|تعبان|تعبانه|ضيق|وجع|نازل|نازله)/.test(t));
    // Review fix 2026-11-07: B is history (conditions, medicines, allergy), never a reading («ضغطها 130») or a symptom («عندها ضيق»).
    const b = HIST_RX.test(t) || c.facts.filter(f => E.facts.has(f.id) && HIST_FACTS.has(f.id)).some(f => hasAny(t, f.kw));
    const nums = numsIn(raw), v = E.show || live(), bp = (E.bp || []).map(Number);
    const ref = [[v.spo2, 2], [v.hr, 8], [v.rr, 4], [bp[0], 10], [bp[1], 8], ...(E.tempKnown ? [[c.temp, 0.3]] : [])].filter(([x]) => Number.isFinite(x));
    const hits = nums.filter(n => ref.some(([x, tol]) => Math.abs(n - x) <= tol)).length;
    const a = nums.length >= 2 && hits >= 2, aWrong = nums.length >= 2 && hits === 0;
    const orderIds = Object.entries((N && N.nm.orders) || {}).map(([k, o]) => o.id || k);
    const goodSuggest = mentionedIds(t).some(id => orderIds.includes(id) && !NURSE_OWN.has(id));
    const r = /(تيجي|تعال|تعالي|تشوف|تقيم|بحتاج|محتاج|بقترح|اقترح|لازم|ممكن تطلب|اوامر|order|عاجل|فورا|حالا)/.test(t) || goodSuggest;
    return { s, b, a, r, aWrong, goodSuggest, allergy: ALLERGY_W.test(t), half: {} };
  }

  /* ---------- nurse mode: one message ---------- */
  async function handleNurse(text) {
    const my = E, N = E.nurse;
    // The doctor is on the line waiting for the SBAR: the message goes to him, with no server call.
    if (N.esc.awaiting) {
      const rd = localRead(text), v = nurseVocs(nz(text));
      // An SBAR names the patient: only a short line, or the instructor called by name, goes elsewhere.
      const elsewhere = (v.first === 'sup') || ((rd.to === 'patient' || rd.to === 'companion') && wordsIn(text) <= 6 && v.first !== 'doc');
      if (!elsewhere) { escTurn(text); return; }
    }
    const dots = typing();
    const pending = E.pending;
    const r = await call({ text, pending: pending ? { ask: pending.ask } : undefined });
    if (!r && !ACT && !actRetried) { actRetried = true; await loadAct(); }
    dots.remove();
    if (E !== my || E.over) return;
    let read;
    if (r && r.read) { read = r.read; read.text = text; nurseShape(read, nz(text), text, true); }
    else { read = localRead(text); read.text = text; }
    // The server may voice the patient, the relative or the instructor; never the doctor.
    const voiced = r && !r.voiceFailed && r.reply && r.to === read.to && ['patient', 'companion', 'supervisor'].includes(read.to);
    const reply = voiced ? r.reply : r && r.held && read.to === 'supervisor' ? instructorLine(read, norm(text)) : localReply(read);
    apply(read, text, read.to, reply);
  }
  function escTurn(text) {
    E.turns++;
    E.busyTurn = E.turns;
    escReply(text);
    director('turn');
  }
  // What apply() commits for a nurse-mode reading, before the actions run.
  function nursePre(read, text) {
    const N = E.nurse, X = N.esc, t = nz(text);
    if (read.readBack && N.orders.length && !N.readBack && E.turns - N.relTurn <= 2) N.readBack = true;
    if (read.airwayAssess && N.airwayAt === null) { N.airwayAt = E.sim; sys('سُجّل تقييمك للمجرى الهوائي.'); }
    if (read.draw && N.drawn === null) { N.drawn = E.sim; sys('سُحبت عينات الدم وحُفظت لحين طلب الطبيب.'); }
    // The allergy band goes on only for an allergy the trainee has asked about.
    if (read.band || BAND.test(t)) {
      if (E.facts.has('allergy')) { if (!N.bandNoted) { N.bandNoted = true; sys('سُجّلت الحساسية على الملف ووُضع سوار الحساسية.'); } }
      else if (read.band) sys('لم تُسأل الحساسية بعد: اسأل المريض أو أهله أولاً.');
    }
    if (read.allOrders) {
      const open = N.orders.filter(o => openOrd(o) && !o.reminder);
      sys(!N.orders.length ? 'لم يصدر أي أمر من الطبيب بعد.' : open.length ? 'لم يُنفَّذ بعد من أوامر الطبيب: ' + open.map(o => o.ar).join('، و') + '.' : 'نُفِّذت كل أوامر الطبيب.');
    }
    if (read.toDoc && reached() && ALLERGY_W.test(t) && !read.allergyReply) N.allergyToldDoc = true;
    // The doctor's own allergy question, answered.
    if (read.allergyReply && read.toDoc) { allergyAnswer(t); read.actions = []; read.tests = []; return; }
    // A drug the doctor will order once he hears about allergies: not given, and no scope gap.
    if (read.heldGive && read.heldGive.length) sys('لم يُنفَّذ: لم يطلب الطبيب الأدوية بعد، فهو ينتظر جوابك عن الحساسية.');
    if (read.heldAsk && read.toDoc) { docSay('قلّي أول: في حساسية من أدوية؟'); read.actions = []; read.tests = []; return; }
    const icu = (read.actions || []).some(a => a.id === 'call_icu');
    if (read.help) helpCall();
    if (read.escalate || read.toDoc) {
      // A call said to the relative or a code call is not the SBAR itself.
      if (!reached()) { escalate(text, read.to === 'companion' || read.help); if (read.help) later(0.2, doctorArrives); }
      else if (read.help) { X.contacts.push({ at: E.sim, kind: 'update' }); if (X.reNeeded !== null && X.updateAt === null) X.updateAt = E.sim; if (!N.present) later(0.2, doctorArrives); }
      else if (icu) sys(docKnows());
      else if (read.escalate) reEscalate(read, text);
      else docLine(read, t);
    }
    read.actions = (read.actions || []).filter(a => a.id !== 'call_senior' && a.id !== 'call_icu');
  }
  // "نادوا فريق الإنعاش": recorded as its own step.
  function helpCall() {
    const N = E.nurse;
    N.helpAt.push({ at: E.sim, stage: E.stage, vt: !!E.vtNow });
    log('action', 'نداء فريق الإنعاش');
    sys('سُجّل نداء فريق الإنعاش.');
  }
  // The answer to «في حساسية من أدوية؟»; the orders the doctor held for it follow.
  function allergyAnswer(t) {
    const N = E.nurse;
    N.allergyAnswered = true;
    const unknown = /(ما بعرف|مش عارف|ما سالت|مش متاكد)/.test(t);
    if (unknown) docSay('اسأل هسا قبل أي دوا.');
    else {
      // "No allergy" said before anyone asked the patient or the family is a guess, not a report.
      const neg = /^(?:لا|لاء|لأ|مافي|ما في|ما عنده|ما عندها)(?: |$)/.test(t) || /(?:ما في|مافي|ما عند\S*) حساسي/.test(t);
      if (neg && !E.facts.has('allergy')) N.allergyGuess = E.sim;
      else N.allergyToldDoc = true;
    }
    const held = !!N.holdRel;
    N.holdRel = null;
    N.relLead = unknown ? 'بدي: ' : 'تمام. بدي: ';
    const spoke = held && releaseOrders();
    N.relLead = null;
    if (!spoke && !unknown) docSay('تمام.');
  }
  function nursePost(read, to) {
    const N = E.nurse, X = N.esc;
    if (N.rbTurns > 0 && N.relTurn < E.turns) N.rbTurns--;
    if (X.awaiting && ['patient', 'companion', 'supervisor'].includes(to)) {
      X.unans++;
      if (X.unans === 2 && !X.nagged) { X.nagged = true; docSay('ألو؟ شو الوضع عندك؟'); }
      else if (X.unans >= 4) escGiveUp();
    }
  }

  /* ---------- nurse mode: escalation ---------- */
  function escalate(text, quiet) {
    const N = E.nurse, X = N.esc;
    if (X.calledAt === null) X.calledAt = E.sim;
    X.by = X.by || 'call';
    X.contacts.push({ at: E.sim, kind: 'call' });
    if (!E.done.has('call_senior')) E.done.set('call_senior', { at: E.sim, last: E.sim, n: 1, dose: '', ok: 'good', amt: 0 });
    log('action', 'إبلاغ الطبيب');
    sys('اتصلتَ ب' + docTitle() + '.');
    X.awaiting = true; X.awaitAt = E.sim;
    if (!quiet && wordsIn(text) >= ESC_SPOKEN_MIN) { X.hello = true; escReply(text); return; }
    // A short call keeps what it said about the patient ("دكتور سامر، المريضة تعبانة كتير"): its S counts.
    if (!quiet && text) {
      const rest = nz(text).replace(new RegExp(N.rx.docv.source, 'g'), ' ').replace(new RegExp(CALL_N.source, 'g'), ' ').replace(/(?:^| )يا(?= |$)/g, ' ').replace(/\s+/g, ' ').trim();
      if (wordsIn(rest) >= 2) X.buf = rest;
    }
    later(0.15, () => { if (!E.over && X.awaiting && !X.hello) { X.hello = true; X.awaitAt = E.sim; docSay('أهلين، معك ' + N.doc + '. شو الوضع؟'); } });
  }
  function reEscalate(read, text) {
    const N = E.nurse, X = N.esc;
    X.contacts.push({ at: E.sim, kind: 'update' });
    if (X.reNeeded !== null && X.updateAt === null) X.updateAt = E.sim;
    if (!N.present) { sys('اتصلتَ ب' + docTitle() + ' مرة أخرى.'); docSay('تمام، ' + comes() + '.'); later(0.3, doctorArrives); }
    else docLine(read, nz(text));
    releaseOrders();
  }
  // The SBAR, collected over one or two messages; one clarifying question at most.
  function escReply(text) {
    const N = E.nurse, X = N.esc;
    X.buf = (X.buf + ' ' + text).trim();
    X.turns++;
    X.hello = true;
    const g = gradeSbar(X.buf);
    if (!X.asked && (!g.a || !g.b)) {
      X.before = { s: g.s, b: g.b, a: g.a, r: g.r };
      X.asked = !g.a ? 'a' : 'b';
      X.hello = true;
      docSay(X.asked === 'a' ? 'عطيني الأرقام: الضغط، النبض، التنفس، والـSpO2.' : E.c.patient.sex === 'F' ? 'شو قصتها؟ أمراض مزمنة، أدوية، حساسية؟' : 'شو قصته؟ أمراض مزمنة، أدوية، حساسية؟');
      return;
    }
    // A part supplied only after the doctor asked for it is worth half.
    if (X.before) g.half = { s: g.s && !X.before.s, b: g.b && !X.before.b, a: g.a && !X.before.a, r: g.r && !X.before.r };
    escFinish(g);
  }
  function escFinish(g) {
    const N = E.nurse, X = N.esc;
    X.sbar = g; X.awaiting = false; N.escDoneTurn = E.turns;
    if (g.allergy) N.allergyToldDoc = true;
    const drug = Object.entries(N.nm.orders).some(([k, o]) => o.kind === 'act' && o.when === 'phone' && !o.reminder && isDrug(o.id || k));
    // Review fix 2026-11-07: a prescriber who asks about allergies waits for the answer before the drugs
    // (a minute at most, and never once the patient is critical).
    if (drug && !g.allergy) { N.allergyAskedByDoc = true; N.allergyAskTurn = E.turns; N.holdRel = { at: E.sim }; }
    releaseOrders();
    if (N.holdRel) docSay(N.orders.length ? 'وقبل الأدوية: في حساسية من أدوية؟' : 'في حساسية من أدوية؟');
    if (!N.present) later(E.stage >= 2 ? 0.2 : 1.5, doctorArrives);
  }
  // Nobody answered the doctor on the phone: he comes to see for himself, with no SBAR to go on.
  function escGiveUp() {
    const N = E.nurse, X = N.esc;
    if (!X.awaiting) return;
    X.awaiting = false;
    X.sbar = { s: false, b: false, a: false, r: false, aWrong: false, goodSuggest: false, allergy: false, half: {}, none: true };
    docSay('طيب، ' + comes() + ' ' + (E.c.patient.sex === 'F' ? 'أشوفها' : 'أشوفه') + ' بنفسي.');
    releaseOrders();
    later(0.2, doctorArrives);
  }
  function doctorArrives() {
    if (!E || E.over || !NM() || E.nurse.present) return;
    const N = E.nurse;
    N.present = true;
    nurseChips();
    sys((N.sex === 'F' ? 'وصلت ' : 'وصل ') + docTitle() + ' إلى السرير.');
    const icu = E.c.care.call_icu;
    if (icu && icu.key && !E.done.has('call_icu')) E.done.set('call_icu', { at: E.sim, last: E.sim, n: 1, dose: '', ok: 'good', amt: 0 });
    releaseOrders();
  }
  function nurseStageRise(s) {
    const N = E.nurse, X = N.esc;
    if (X.calledAt !== null && X.reNeeded === null) { X.reNeeded = s; X.reNeededAt = E.sim; }
    if (s >= 2 && !reached()) dOnce('4', 'المريض عم يتدهور. اتصل ب' + docW() + ' هسا، وجهّز الـSBAR.');
    if ((s === 3 || E.vtNow) && !reached()) {
      sys(N.sex === 'F' ? 'سمعت الطبيبة إنذار المونيتور وحضرت إلى السرير.' : 'سمع الطبيب إنذار المونيتور وحضر إلى السرير.');
      X.by = 'alarm'; N.alarmAt = E.sim;
      doctorArrives();
    } else if (s >= 2 && X.calledAt !== null && !N.present && !X.awaiting) later(0.2, doctorArrives);
    releaseOrders();
  }
  function nurseTick() {
    const N = E.nurse, X = N.esc;
    if (E.over) return;
    const v = live();
    // One oxygen threshold for the nurse's own protocol, the instructor's nudge and its words.
    if (N.lowAt === null && v.spo2 < O2_OWN) N.lowAt = E.sim;
    if (N.allergyAt === null && E.facts.has('allergy')) N.allergyAt = E.sim;
    if (E.tempKnown && N.tempAt === null) N.tempAt = E.sim;
    if (E.sim >= 2 && !N.vchecks.length) dOnce('1', 'العلامات الحيوية كاملة انقاست؟ ابدأ بالـABCDE.');
    if (N.lowAt !== null && E.sim - N.lowAt >= 1 && v.spo2 < O2_OWN && !E.done.has('oxygen')) dOnce('2', 'الـSpO2 تحت ' + O2_OWN + '. شو بيسمحلك بروتوكول القسم تعمل هسا بدون ما تستنى أمر؟');
    if (!reached() && E.sim > escBy()) dOnce('3', 'الأرقام هاي شو بتحكيلك؟ مين لازم يعرف فيها هسا؟');
    if (N.orders.some(o => openOrd(o) && !o.reminder && E.sim - o.at >= 3)) dOnce('8', 'في أوامر من ' + docW() + ' لسا ما تنفّذت. شو أولويتك؟');
    // The allergy question went unanswered for a minute: the orders come anyway.
    if (N.holdRel && E.sim - N.holdRel.at >= 1) { N.holdRel = null; releaseOrders(); }
    // An open order its own stop rule now rules out is cancelled at once, so the panel never offers a stale one.
    if (N.orders.some(o => openOrd(o) && cancelNow(N.nm.orders[o.key] || {}))) releaseOrders();
    // The doctor waits on the line, then comes.
    if (X.awaiting && X.awaitAt !== null) {
      if (!X.nagged && E.sim - X.awaitAt >= 1.5) { X.nagged = true; docSay('ألو؟ شو الوضع عندك؟'); }
      else if (E.sim - X.awaitAt >= 3) escGiveUp();
    }
  }

  /* ---------- nurse mode: the doctor's orders ---------- */
  function orderDue(o) {
    const N = E.nurse, g = o.gate || {};
    if (o.when === 'phone') return true;
    if (o.when === 'gated') return (!g.needTest || (E.tests[g.needTest] && E.tests[g.needTest].back)) && (!g.needDone || E.done.has(g.needDone));
    if (o.when === 'collapse') return N.present && (fell() || untreatedSbp() < 90 || E.stage >= 3) && (!g.needDone || E.done.has(g.needDone));
    if (o.when === 'vt') return N.present && E.vtNow;
    if (o.when === 'stage3') return N.present && E.stage >= 3;
    return false;
  }
  // An order's own stop rule (CTPA once the pressure falls, NIV at stage 3).
  const cancelNow = src => !!((src.cancelSbp && untreatedSbp() < src.cancelSbp) || (src.cancelStage && E.stage >= src.cancelStage));
  // What the doctor says for one order: the step's name, the case file's own words, and the single dose chosen.
  const ordItem = o => o.ar + (o.show ? ' ' + o.show : '') + (o.pick ? '، الجرعة: ' + o.pick : '');
  // Returns true when the doctor said something.
  function releaseOrders() {
    if (!E || E.over || !NM()) return false;
    const N = E.nurse, X = N.esc;
    if (!reached() || X.awaiting) return false;
    // Waiting on the answer to «في حساسية من أدوية؟»: the drugs wait, the tests and the rest do not;
    // and nothing waits once the patient is critical.
    if (N.holdRel && (E.stage >= 3 || E.vtNow)) N.holdRel = null;
    const fresh = [], cancelled = [];
    for (const [key, o] of Object.entries(N.nm.orders)) {
      const id = o.id || key;
      if (N.orders.some(x => x.key === key) || !orderDue(o)) continue;
      if (N.holdRel && o.kind === 'act' && !o.reminder && !o.doctorDoes && isDrug(id)) continue;
      const care = E.c.care[id];
      if (o.kind === 'act' && !o.doctorDoes && care && tooEarly(care)) continue;
      // An order its own stop rule already rules out is never given (no CT ordered and cancelled in one breath).
      if (cancelNow(o)) continue;
      const meta = o.kind === 'test' ? testOf(id) : actOf(id);
      if (!meta) continue;
      const ord = { key, id, kind: o.kind, ar: meta.ar, show: o.show || '', exec: o.exec || '', pick: o.pick || '', at: E.sim, doneAt: null, cancelled: false, reminder: !!o.reminder, doctorDoes: !!o.doctorDoes, optional: !!o.optional, repeat: !!o.repeat, when: o.when, line: o.line || '' };
      // A step already done on the nurse's own counts as done.
      const before = o.kind === 'test' ? (E.tests[id] ? E.tests[id].at : null) : !o.doctorDoes && E.done.has(id) ? E.done.get(id).at : null;
      if (before !== null) ord.doneAt = before;
      N.orders.push(ord);
      fresh.push(ord);
    }
    for (const o of N.orders) {
      const src = N.nm.orders[o.key] || {};
      if (o.cancelled || o.doneAt != null) continue;
      if (cancelNow(src)) { o.cancelled = true; o.cancelAt = E.sim; cancelled.push(o); log('order', 'ألغى الطبيب: ' + o.ar); }
    }
    const first = fresh.length && N.ordersAt === null;
    if (fresh.length) { if (first) N.ordersAt = E.sim; N.relTurn = E.turns; N.rbTurns = 2; }
    let spoke = false;
    cancelled.forEach(o => { const src = N.nm.orders[o.key]; if (src.cancelLine) { docSay(src.cancelLine); spoke = true; } });
    const speak = fresh.filter(o => !o.doctorDoes && !o.cancelled);
    const acts = speak.filter(o => o.kind === 'act' && !o.reminder), tests = speak.filter(o => o.kind === 'test' && !o.reminder), rem = speak.filter(o => o.reminder && o.doneAt == null);
    // One line for everything released now; each item is only the step's name and the case file's own words.
    const item = ordItem;
    if (acts.length || tests.length || rem.length) spoke = true;
    if (acts.length || tests.length || rem.length) {
      let lead = first ? (N.present ? 'تمام. بدي: ' : 'تمام، ' + comes() + '. لحد ما أوصل بدي: ') : fresh.some(o => o.when === 'gated') ? 'طلعت النتيجة. هسا بدي: ' : 'هسا بدي: ';
      if (N.relLead && !first) lead = N.relLead;
      let line = '';
      if (acts.length || tests.length) line = lead + acts.map(item).join('، و') + (tests.length ? (acts.length ? '. وبدي ' : '') + tests.map(item).join('، و') : '') + '.';
      else if (first) line = N.present ? 'تمام.' : 'تمام، ' + comes() + '.';
      if (rem.length) line += (line ? ' ' : '') + 'ولسا ما انعمل: ' + rem.map(o => o.ar).join('، و') + '.';
      docSay(line);
    }
    fresh.forEach(o => log('order', 'أمر الطبيب: ' + item(o)));
    fresh.filter(o => o.doctorDoes && o.when !== 'vt').forEach(docDoes);
    // VT with a pulse: the doctor shocks while it lasts.
    N.orders.filter(o => o.doctorDoes && o.when === 'vt').forEach(o => { if (E.vtNow && N.present && E.sim - N.lastShock > 0.3) docDoes(o); });
    buildOrders();
    return spoke;
  }
  // What the doctor does with his own hands: no credit to the nurse.
  function docDoes(o) {
    const N = E.nurse, id = o.id, meta = actOf(id), care = E.c.care[id] || {};
    if (!meta || E.over) return;
    N.docDoing = true;
    try {
      if (id === 'shock') {
        // As many shocks as the catalog allows; after that the VT is the trainee's failure to escalate in time.
        const prev = E.done.get('shock');
        if (!E.vtNow || (prev && prev.n >= ((meta.repeat || {}).max || 6))) return;
        N.lastShock = E.sim;
        give({ id, dose: '', agent: '' }, meta, care);
        sys(N.sex === 'F' ? 'أجرت الطبيبة صدمة كهربائية متزامنة.' : 'أجرى الطبيب صدمة كهربائية متزامنة.');
      } else if (id === 'airway') {
        if (!E.done.has('airway')) give({ id, dose: '', agent: '' }, meta, care);
        else log('action', 'تنبيب على يد ' + docT());
        N.interv.push({ id, at: E.sim, ar: meta.ar, byDoc: true });
        if (o.line) docSay(o.line);
      } else {
        if (!E.done.has(id)) give({ id, dose: '', agent: '' }, meta, care);
        if (id === 'cath_lab') docSay('فعّلت القسطرة. جهّزوه للنقل.');
      }
      o.doneAt = E.sim;
    } finally { N.docDoing = false; }
  }
  // The trainee's actions, judged against the nurse's scope.
  function nurseAct(a, text) {
    if (!E || E.over) return;
    const N = E.nurse, id = a.id, meta = actOf(id), care = E.c.care[id] || {};
    if (!meta) return;
    if (id === 'call_senior' || id === 'call_icu') {
      if (!reached()) escalate(text);
      else if (id === 'call_icu') sys(docKnows());
      return;
    }
    const tx = norm(text || '');
    if (id === 'airway' && BLS_AIR.test(tx) && !ADV_AIR.test(tx)) { basicAirway(); return; }
    if (id === 'bp_repeat' || id === 'temp') {
      N.vchecks.push(E.sim);
      const prev = E.done.get(id);
      E.done.set(id, prev ? { ...prev, n: prev.n + 1, last: E.sim } : { at: E.sim, last: E.sim, n: 1, dose: '', ok: 'good', amt: 0, top: 0 });
      log('check', meta.ar);
      if (id === 'temp') { E.tempKnown = true; if (N.tempAt === null) N.tempAt = E.sim; paint(); sys('الحرارة الآن ' + E.c.temp.toFixed(1) + ' °C.'); }
      else { E.bpAt = 0; paint(); sys('على المونيتور الآن: ' + spokenVitals() + '.'); }
      return;
    }
    let ord = N.orders.find(o => o.kind === 'act' && o.id === id && openOrd(o));
    // An order the case file gives in repeated boluses stays open for the next one, within its own limits.
    if (!ord) ord = N.orders.find(o => o.kind === 'act' && o.id === id && o.repeat && !o.cancelled && o.doneAt != null);
    if (id === 'oxygen') {
      if (ord) { nurseExec(ord, a, text); return; }
      // Already running: saying the device again without a new flow changes nothing.
      if (E.done.has('oxygen') && !a.dose) { const d = E.done.get('oxygen').dose; sys('الأكسجين يعمل بالفعل' + (d ? ' (' + d + ')' : '') + '.'); return; }
      if (Math.round(live().spo2) < O2_OWN || E.done.has('oxygen')) { ownOxygen(a, text); return; }
      const sp = Math.round(live().spo2);
      if (!N.notIndicated.some(x => x.id === id && E.sim - x.at < 1)) { N.notIndicated.push({ id, at: E.sim, spo2: sp }); log('scope', 'أكسجين والإشباع ضمن الهدف'); }
      sys('لم يُنفَّذ: الإشباع ' + sp + '% ضمن الهدف، وبروتوكول الأكسجين المستقل يبدأ عند إشباع أقل من ' + O2_OWN + '%.');
      return;
    }
    if (ord) { nurseExec(ord, a, text); return; }
    if (NURSE_OWN.has(id)) { order(a, text); return; }
    const allergen = (care.allergyKw && allergicTo(a, care, text)) || (care.harm && care.needFact === 'allergy');
    scopeGap('act', id, allergen ? 'allergen' : id === 'airway' || DOCTOR_ONLY.has(id) ? 'doctor-step' : '');
  }
  // Opening the airway or bagging: recorded, no definitive-airway effect, and the doctor is needed now.
  function basicAirway() {
    const N = E.nurse;
    N.bls.push(E.sim);
    log('action', 'فتح المجرى الهوائي أو التهوية بالأمبو (إنعاش أساسي)');
    sys('سُجّل: فتح المجرى الهوائي والتهوية بالأمبو من الإنعاش الأساسي ضمن صلاحيتك. التنبيب والتهوية غير الغازية بقرار الطبيب.');
    if (!reached() && E.stage >= 3) escalate('', true);
    else if (!reached()) dOnce('bls', 'وبنفس الوقت بلّغ ' + docW() + ' فوراً.');
  }
  function ownOxygen(a, text) {
    if (!a.dose) {
      ask({ type: 'dose', a: { ...a }, name: actOf('oxygen').ar, tip: '', sug: undefined, ask: 'The nurse instructor asked which oxygen device and flow the trainee will use. good = a device and a flow in L/min, partial = roughly right, wrong = unsafe, na = not a reply, withdraw = the trainee drops it.' }, 'أكسجين، تمام. أي وسيلة وعلى كم لتر؟', 'd');
      return;
    }
    order(a, text);
  }
  // A drug that names a different agent than the order (ceftriaxone for levofloxacin).
  function agentClash(id, text, exec) {
    const lim = (((E.c.care[id] || {}).limits) || (actOf(id) || {}).limits || []).filter(l => l.kw);
    const t = norm(text), x = norm(exec || '');
    const inT = lim.filter(l => hasAny(t, l.kw)), inX = lim.filter(l => hasAny(x, l.kw));
    return inT.length > 0 && !inT.some(l => inX.includes(l));
  }
  // The dose typed against the dose ordered, in base units (per hour for rates), with a little rounding room.
  function sameDose(typed, exec) {
    const a = doseOf(typed), b = doseOf(exec);
    if (!a || a.unsure || !b) return true;
    if (a.kind && b.kind && a.kind !== b.kind) return false;
    if (!!a.perTime !== !!b.perTime && a.kind) return false;
    const base = d => { const by = d.kind ? d.by : (b.kind ? b.by : 1), k = d.perKg ? (E.c.kg || 1) : 1, per = d.perTime && !d.hour ? 60 : 1; return [d.lo * by * k * per, d.hi * by * k * per]; };
    const [alo, ahi] = base(a), [blo, bhi] = base(b);
    return alo >= blo * 0.85 - 1e-9 && ahi <= bhi * 1.15 + 1e-9;
  }
  // Giving what the doctor ordered: the right agent, the dose as written, then the room's usual physiology.
  function nurseExec(ord, a, text) {
    const id = ord.id, meta = actOf(id), care = E.c.care[id] || {};
    if (text && ((care.allergyKw && allergicTo({ ...a, agent: a.agent || '' }, care, text)) || agentClash(id, text, ord.exec))) { scopeGap('act', id, 'wrong-agent', ord); return; }
    if (ord.reminder) {
      if (id === 'oxygen') { ownOxygen(a.dose ? a : { ...a, dose: ord.exec }, text); return; }
      order({ ...a, dose: a.dose || ord.exec }, text);
      return;
    }
    let dose = a.dose || '';
    // "علقتله لتر سلاين": a litre with no number is still one litre.
    if (!dose && id === 'fluids' && /(?:^| )(?:لتر|ليتر)(?: |$)/.test(norm(text || ''))) dose = '1 L';
    if (dose && (!sameDose(dose, ord.exec) || doseBad({ id, dose, said: text }, care, text))) {
      const ref = ord.pick ? ord.pick : ord.show || ord.exec;
      E.wrongDoses.push({ id, ar: meta.ar, dose, ref });
      log('dose', 'جرعة مختلفة عن الأمر: ' + meta.ar + ' ' + dose);
      sys('لم يُعطَ: الجرعة التي كتبتها تختلف عن أمر الطبيب (' + ref + ').');
      return;
    }
    order({ ...a, id, agent: '', dose: ord.exec, _asked: true, _ok: 'good' }, text);
  }
  // Called from give() in nurse mode: what was given, for safety and reassessment.
  function nurseGave(a, meta) {
    const N = E.nurse;
    if (meta.dose || a.id === 'airway') {
      const at = E.sim;
      if (!N.docDoing || a.id === 'airway') N.interv.push({ id: a.id, at, ar: meta.ar, byDoc: N.docDoing });
      later(3, () => {
        if (E.over || N.vchecks.some(x => x > at) || N.reassess7 >= 2 || E.sim - N.last7 < 2) return;
        N.reassess7++; N.last7 = E.sim; E.hints++;
        person('d', 'بعد آخر تدخل، شو تغيّر بالأرقام؟');
      });
    }
    if (isDrug(a.id) && !N.docDoing) {
      N.given.push({ id: a.id, at: E.sim, allergyAsked: E.facts.has('allergy') });
      if (!E.facts.has('allergy')) later(0.01, () => dOnce('6', 'عطيت الدوا قبل ما تسأل عن الحساسية؟ اسأل هسا وبلّغ ' + docW() + '.'));
    }
    const o = N.orders.find(x => x.kind === 'act' && x.id === a.id && openOrd(x));
    if (o && !N.docDoing) o.doneAt = E.sim;
    buildOrders();
  }
  function nurseTest(id, reason, ok) {
    if (!E || E.over) return false;
    releaseOrders(); // a cancellation due now (CTPA in shock) is applied before the request
    const N = E.nurse, ord = N.orders.find(o => o.kind === 'test' && o.id === id && openOrd(o));
    if (NURSE_TESTS.has(id) || ord || E.tests[id]) {
      orderTest(id, reason, ok);
      const o = N.orders.find(x => x.kind === 'test' && x.id === id && x.doneAt == null && !x.cancelled);
      if (o && E.tests[id]) o.doneAt = E.tests[id].at;
      buildOrders();
      return true;
    }
    // A click on an order the doctor cancelled this very moment (CTPA as the pressure fell) is no attempt.
    if (N.orders.some(o => o.kind === 'test' && o.id === id && o.cancelled && o.cancelAt === E.sim)) { sys('أُلغي هذا الطلب قبل تنفيذه.'); buildOrders(); return false; }
    scopeGap('test', id);
    return false;
  }
  // Out of the nurse's own scope: nothing is given, nothing changes in the patient; it is recorded.
  function scopeGap(kind, id, why, ord) {
    const N = E.nurse, meta = kind === 'test' ? testOf(id) : actOf(id), ar = (meta || {}).ar || id;
    N.scope.push({ id, kind, at: E.sim, why: why || 'no-order' });
    log('scope', 'دون أمر طبيب: ' + ar);
    if (why === 'wrong-agent') {
      sys('لم يُعطَ: ما كتبته ليس الدواء الذي طلبه الطبيب (' + ((ord && (ord.show || ord.ar)) || ar) + ').');
      E.hints++; person('d', 'هاد مش الدوا اللي انطلب.');
      return;
    }
    // Airway support beyond basic life support, the cath lab and a shock are the doctor's steps, not drugs.
    const note = why === 'doctor-step' ? (id === 'airway' ? 'التنبيب والتهوية غير الغازية بقرار الطبيب، أما فتح المجرى والتهوية بالأمبو فضمن صلاحيتك' : 'هذا إجراء يقرره الطبيب ويجريه') : SCOPE_NOTE;
    if (!N.scopeSaid.has(id)) { N.scopeSaid.add(id); sys('لم يُنفَّذ: ' + ar + ' يحتاج أمراً من الطبيب (' + note + ').'); }
    else sys('لم يُنفَّذ: يحتاج أمر طبيب.');
    const F = E.nurse.sex === 'F';
    if (why === 'allergen' && E.facts.has('allergy')) { dOnce('allergen:' + id, 'استنى! ' + (E.c.patient.sex === 'F' ? 'المريضة عندها' : 'المريض عنده') + ' حساسية من هاد الدوا، وأصلاً الدوا بدو أمر من ' + docW() + '.'); return; }
    const distinct = [...new Set(N.scope.filter(x => x.why !== 'wrong-agent').map(x => x.id))];
    if (distinct.length <= 3 && distinct.includes(id)) dOnce('5:' + id, 'هاد بدو أمر من ' + docW() + '. إذا شايفه لازم، بلّغ' + (F ? 'ها' : 'ه') + ' واقترحه.');
  }

  /* ---------- nurse mode: the doctor's and the instructor's lines (fixed) ---------- */
  const DX_Q = /(?:شو (?:عنده|عندها|التشخيص)|تشخيص|diagnos)/;
  function docLine(read, t) {
    const N = E.nurse, X = N.esc, c = E.c;
    const ordIds = N.orders.filter(o => !o.cancelled).map(o => o.id);
    const ment = (read.mentioned || mentionedIds(t)).filter(id => !NURSE_OWN.has(id));
    let line;
    // An allergy statement is heard as one, even when it names a drug ("عنده حساسية من البنسلين").
    if (ALLERGY_W.test(t)) line = 'تمام.';
    else if (DX_Q.test(t)) {
      const g = N.nm.dxAfter, dx = fell() && c.collapse && c.collapse.dx ? c.collapse.dx : g.text;
      line = reached() && (!g.gate || (E.tests[g.gate] && E.tests[g.gate].back)) ? 'الأغلب ' + dx + '.' : 'التشخيص لسا قيد التقييم.';
    } else if (/(?:^| )(?:تعال|تعالي|بسرعه|شوفها|شوفه|محتاجك|بحتاجك)(?: |$)/.test(t) && !read.readBack && !ment.length) {
      if (N.present) line = 'أنا هون.';
      else { line = comes() + '.'; later(0.2, doctorArrives); }
    } else if (read.readBack || ment.some(id => ordIds.includes(id))) line = 'آه، زي ما حكينا.';
    else if (ment.length) {
      const id = ment[0], care = c.care[id], res = c.results[id];
      const bad = testOf(id) && !actOf(id) ? !res || res.ind === 'no' || res.ind === 'harm' : !care || care.harm || care.off;
      line = bad ? 'لا، مش مناسب هسا.' : 'خلينا نخلّص الأوامر اللي حكيناها أول.';
    } else if (/(?:شو (?:بدك|اعمل|نعمل|الخطه|كمان بدك)|في اشي تاني|شو الاوامر|اوامر)/.test(t)) {
      const open = N.orders.filter(openOrd);
      line = open.length ? 'لسا بدي: ' + open.map(o => o.ar).join('، و') + '.' : 'تمام، كمّل وراقب.';
    } else if (/\d/.test(digits(t)) || /(صار|تغير|نزل|طلع|بتسوء|ساء|تدهور|اسوا|احسن|تحسن)/.test(t)) {
      if (X.reNeeded !== null && X.updateAt === null) X.updateAt = E.sim;
      line = 'تمام، كمّل وراقب، وخبّرني إذا تغيّر إشي.';
    } else if (N.allergyAskedByDoc && !N.allergyAnswered && !N.allergyToldDoc) line = 'تمام. وفي حساسية من أدوية؟';
    else line = 'تمام، شو كمان؟';
    docSay(line);
  }
  function instructorLine(read, t) {
    const named = [...new Set([...(read.named || []), ...mentionedIds(t)])];
    const toDoc = E.nurse.sex === 'F' ? 'للدكتورة' : 'للدكتور';
    if (read.whichDrug) return 'أي دوا بالزبط؟ المفتوح من الأوامر: ' + read.whichDrug.join('، و') + '.';
    if (read.suggested && read.suggested.length) return reached() ? 'اقتراح منطقي، احكيه ' + toDoc + '.' : 'اقتراح منطقي، احكيه ' + toDoc + ' بالـR تبع الـSBAR.';
    if (read.planOnly) return 'صح، الأدوية بأمر. شو بتقدر تعمل هسا ضمن صلاحيتك؟';
    if (DX_Q.test(t)) return 'التشخيص شغلة ' + docW() + '. إنت شو شايف بالأرقام وبالمريض؟';
    const drug = named.find(id => isDrug(id) || (actOf(id) && DOCTOR_ONLY.has(id)));
    if (drug) return actOf(drug).ar + ' بدو أمر طبيب. إذا شايفه لازم، اقترحه ' + (E.nurse.sex === 'F' ? 'عالدكتورة' : 'عالدكتور') + ' بالـR تبع الـSBAR.';
    if (named.some(id => NURSE_OWN.has(id) || id === 'oxygen' || NURSE_TESTS.has(id))) return 'هاد ضمن صلاحيتك. اعمله وراقب الاستجابة.';
    const T = ['شو أهم رقم على المونيتور هسا، وشو بيعني بالـABCDE؟', 'قبل أي دوا: سألت عن الحساسية والأدوية؟', 'بعد كل تدخل: شو تغيّر بالأرقام؟', 'إذا بدك تبلّغ ' + docW() + ' هسا: شو الـS والـB والـA والـR؟', 'شو بتقدر تعمل لحالك ضمن البروتوكول، وشو بدو أمر؟'];
    return T[E.nurse.teachAt++ % T.length];
  }

  /* ---------- nurse mode: the side panel ---------- */
  function nurseChips() {
    if (!NM() || typeof document.querySelector !== 'function') return;
    const n = document.querySelector('.er-p[data-who="n"] b'), d = document.querySelector('.er-p[data-who="d"] b'), np = document.querySelector('.er-p[data-who="n"]');
    if (n) n.textContent = 'د. ' + E.nurse.doc + (E.nurse.present ? '' : ' (خارج الغرفة)');
    if (np && np.dataset) { if (E.nurse.present) delete np.dataset.out; else np.dataset.out = '1'; }
    if (d) d.textContent = 'المشرفة';
  }
  const ordTime = t => `<bdi dir="ltr" class="font-num">${clk(t)}</bdi>`;
  function buildOrders() {
    if (!E || !NM()) return;
    const N = E.nurse, box = $('er-ord'), list = $('er-ord-list');
    const open = N.orders.filter(o => openOrd(o) && !o.reminder).length;
    const tb = $('er-test');
    if (tb && tb.dataset) tb.dataset.badge = open ? String(open) : '';
    if (!box || !list) return;
    box.hidden = !N.orders.length;
    const was = REAL && document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.ord : '';
    const rows = [...N.orders].sort((a, b) => (openOrd(b) ? 1 : 0) - (openOrd(a) ? 1 : 0) || a.at - b.at);
    list.innerHTML = rows.map(o => {
      const drug = o.kind === 'act' && !!(actOf(o.id) || {}).dose;
      const state = o.cancelled ? '<span class="er-ord-chip is-x">أُلغي</span>' : o.doneAt != null ? `<span class="er-ord-chip is-done">نُفِّذ عند ${ordTime(o.doneAt)}</span>` : '<span class="er-ord-chip is-wait">بانتظار التنفيذ</span>';
      const tags = (o.reminder ? '<span class="er-ord-chip is-rem">تذكير</span>' : '') + (o.doctorDoes ? '<span class="er-ord-chip is-doc">يجريه الطبيب</span>' : '');
      const btn = openOrd(o) ? `<button type="button" data-ord="${o.kind}:${esc(o.id)}">${o.kind === 'test' ? 'اطلب' : drug ? 'أعطِ' : 'نفّذ'}</button>` : '';
      return `<li class="er-ord-row${openOrd(o) ? ' is-open' : ''}"><p><b>${esc(o.ar)}</b>${o.show ? ` <bdi>${esc(o.show)}</bdi>` : ''}${o.pick ? `، الجرعة: <bdi dir="ltr">${esc(o.pick)}</bdi>` : ''}</p><p class="er-ord-meta"><small>صدر عند ${ordTime(o.at)}</small>${tags}${state}</p>${btn}</li>`;
    }).join('');
    if (was) { const b = list.querySelector('[data-ord="' + was + '"]'); if (b && b.focus) b.focus({ preventScroll: true }); }
  }
  // A click on an order in the panel: the trainee's line, then the same path as typing it.
  function execOrder(kind, id) {
    if (!E || E.over || !NM()) return false;
    E.started = true;
    const o = E.nurse.orders.find(x => x.kind === kind && x.id === id && openOrd(x));
    if (!o) return false;
    const meta = kind === 'test' ? testOf(id) : actOf(id);
    person('me', (kind === 'test' ? 'طلبت ' : isDrug(id) || id === 'oxygen' ? 'أعطيت ' : 'نفّذت ') + meta.ar);
    E.rbBuf = []; E.collect = [];
    if (kind === 'test') nurseTest(id, '', '');
    else nurseAct({ id, dose: '', agent: '' }, '');
    flushBack();
    const col = (E.collect || []).filter(x => E.pending === x.p || E.queue.some(([q]) => q === x.p));
    E.collect = null;
    if (col.length && (!E.pending || E.pending.type === 'dose')) openDoses(col[0].line);
    buildOrders();
    return true;
  }
  const nurseTag = id => {
    if (!NM()) return '';
    const ord = E.nurse.orders.some(o => o.kind === 'test' && o.id === id && !o.cancelled);
    return NURSE_TESTS.has(id) ? '<em class="er-tag er-tag-own">سريري: ضمن صلاحيتك</em>' : ord ? '<em class="er-tag er-tag-ord">أمر الطبيب</em>' : '<em class="er-tag er-tag-need">يحتاج أمر طبيب</em>';
  };
  // The role, chosen before a case starts only.
  const canSwitch = () => !!E && !E.over && !E.started && E.turns === 0 && E.sim < 0.05;
  function setRole(v) {
    const role = v === 'nurse' ? 'nurse' : v === 'doctor' ? 'doctor' : null;
    if (!role || !canSwitch()) return false;
    if (role === E.role) return true;
    roleWanted = role;
    begin(E.c.id, { role });
    return true;
  }

  function order(a, text) {
    const meta = actOf(a.id);
    if (!meta) return;
    a.said = a.said || text;
    if (a.id === 'cpr') { nurse(E.stage === 3 ? 'لسا في نبض ضعيف دكتور، شو بدك قبل ما يوقف؟' : 'في نبض دكتور، مش وقت إنعاش.', { d: 'في نبض، مش وقت ضغطات. بلّغ الدكتور فوراً.' }); if (NM() && E.stage === 3 && E.nurse.esc.calledAt === null && !E.nurse.present) escalate(''); return; }
    if (a.id === 'sedative' && E.done.has('airway')) { nurse('طبيب التخدير رح يعطي المهدئ مع التنبيب.'); return; }
    const care = E.c.care[a.id], treating = E.anaph && !E.anaph.treated;
    let def = care || (E.anaph && ADJUNCT.includes(a.id) ? {} : offCase(meta));
    const early = tooEarly(def);
    if (early) def = { ...def, ...def.stableHarm, harm: true, early: true };
    if (def.after && E.tests[def.after] && E.tests[def.after].back) def = {};
    const said = norm(text);
    if (meta.pushHarm && /(?:بوتاسيوم|kcl|potassium)(?: \S+){0,4} (?:push|بوش|bolus|بولس|دفعه|مباشر\S*|stat)(?: |$)|(?:^| )(?:push|بوش|bolus|بولس|دفعه)(?: \S+){0,2} (?:بوتاسيوم|kcl|potassium)/.test(said)) def = { ...def, ...meta.pushHarm };
    if (def.niHarm && E.stage === 3 && /cpap|bipap|niv|بايباب|سي باب|قناع/.test(said) && !/intubat|تنبيب|نبب|(?:^| )rsi(?: |$)|انبوب/.test(said)) def = { ...def, ...def.niHarm };
    if (def.invasiveHarm && E.stage < 3 && /intubat|تنبيب|نبب|(?:^| )rsi(?: |$)|انبوب/.test(said)) def = { ...def, ...def.invasiveHarm };
    // Some orders wait for a number or for an earlier step; the nurse says which.
    if (!def.harm && def.needTest && !(E.tests[def.needTest] && E.tests[def.needTest].back)) { nurse(def.needLine || `دكتور، قبل ${meta.ar} بدنا نتيجة ${testOf(def.needTest).ar}.`, 'لم يُنفَّذ بعد: يلزم أولاً ' + testOf(def.needTest).ar + '.'); return; }
    if (!def.harm && def.needDone && !E.done.has(def.needDone)) { nurse(def.needLine || `دكتور، قبل ${meta.ar} ما عملنا ${actOf(def.needDone).ar}.`, 'لم يُنفَّذ بعد: يلزم أولاً ' + actOf(def.needDone).ar + '.'); return; }
    const allergic = allergicTo(a, def, text);
    // An order insisted on too early does not stop the same order once it is right.
    if (!allergic && E.harmed.has(a.id) && !def.allergyKw && (early || !(care && care.stableHarm))) { nurse(`${meta.ar}؟ عملناه من شوي.`, 'سبق أن نفّذت هذا قبل قليل.'); return; }
    const prev = E.done.get(a.id);
    const rescue = (treating && a.id === 'adrenaline') || (E.vtNow && a.id === 'shock');
    if (!allergic && prev && !rescue && !again(a, meta, def, prev)) return;
    // Some relatives react the moment a drug they fear is really going in.
    if (!prev) compOn('onOrder', a.id, 0.05, true);
    if (def.harm || allergic) { unsafe(a, meta, def, allergic); return; }
    const sg = treating && a.id === 'adrenaline' ? { text: 'أدرينالين 0.5 ملغ عضل بالفخذ', dose: '0.5 mg IM' } : def.suggest || meta.suggest || null;
    const propose = sg ? (sg.dose ? `بقترح ${sg.text}، ماشي؟` : sg.text) : '';
    if (meta.dose && !a.dose && !a._asked) {
      // The same safe order said again is "yes, as you proposed": nobody waits on a proposal for oxygen.
      const open = E.pending && E.pending.type === 'dose' && E.pending.a.id === a.id ? E.pending : E.queue.map(x => x[0]).find(q => q.type === 'dose' && q.a.id === a.id);
      if (open && open.sug && REPEAT_OK.includes(a.id)) {
        if (open !== E.pending) E.queue = E.queue.filter(([q]) => q !== open);
        order({ ...open.a, dose: open.sug, sayDose: open.tip.split(' (أو')[0].split('، ')[0], _asked: true, _ok: 'good' }, text);
        return;
      }
      ask({ type: 'dose', a, name: meta.ar, tip: sg ? sg.text : '', sug: sg ? sg.dose : undefined, ask: `The nurse asked the dose of ${meta.en}. Reference: ${def.dose || 'standard dose'}.${sg ? ` She proposed: ${sg.text}${sg.dose ? ' A plain yes accepting her proposal = "good".' : ''}` : ''} good = a correct dose or flow, partial = roughly right, wrong = unsafe or wrong, na = not a reply, withdraw = the trainee cancels the order.` }, sg ? `${meta.ar}، حاضر. ${propose}` : (def.rb || `${meta.ar}، كم الجرعة؟`));
      return;
    }
    // A number written with the order gets the same check as one given to the nurse.
    if (def.ivOnly && SUBCUT.test(norm((a.dose || '') + ' ' + text))) {
      E.wrongDoses.push({ ar: meta.ar, dose: 'تحت الجلد', ref: def.dose || '' });
      ask({ type: 'dose', a: { ...a, dose: '' }, retried: true, name: meta.ar, tip: sg ? sg.text : '', sug: sg ? sg.dose : undefined, ask: `The nurse said ${meta.en} must run IV here, not under the skin. good = an IV rate, na = not a reply.` }, `دكتور، تحت الجلد ما بينفع بهالحالة، بدنا تسريب وريدي. ${sg ? 'بقترح ' + sg.text + '، ماشي؟' : ''}`);
      return;
    }
    if (a.dose && !a._asked && doseBad(a, def, text, a.dose_ok)) {
      badDose(a, meta, def);
      ask({ type: 'dose', a: { ...a, dose: '' }, retried: true, name: meta.ar, tip: sg ? sg.text : '', sug: sg ? sg.dose : undefined, ask: `The nurse rejected the dose of ${meta.en}. Reference: ${def.dose || 'standard dose'}.${sg ? ` She proposed: ${sg.text}${sg.dose ? ' A plain yes accepting it = "good".' : ''}` : ''} good = a correct dose, wrong = still wrong, na = not a reply, withdraw = the trainee cancels the order.` }, `دكتور، ${meta.ar} ${a.dose}؟ هاي الجرعة مش مناسبة. ${propose || 'راجعها.'}`);
      return;
    }
    // An infusion step needs a rate; a single dose is not the infusion.
    if (def.rateOnly && a.dose && !(doseOf(a.dose) || {}).perTime) {
      ask({ type: 'dose', a: { ...a, dose: '' }, retried: true, name: meta.ar, tip: sg ? sg.text : '', sug: sg ? sg.dose : undefined, ask: `The nurse asked for the infusion rate of ${meta.en}, not a single dose. Reference: ${def.dose || ''}. good = a rate per hour, wrong = a single dose again, na = not a reply.` }, `دكتور، بدنا تسريب مش جرعة وحدة: قديش بالساعة؟ ${sg ? 'بقترح ' + sg.text + '، ماشي؟' : ''}`);
      return;
    }
    if (a.dose && overTotal(a, meta, def)) return;
    give(a, meta, def);
  }
  const badDose = (a, meta, def) => { E.wrongDoses.push({ ar: meta.ar, dose: a.dose, ref: def.dose || '' }); log('harm', `جرعة غير صحيحة: ${meta.ar} ${a.dose}`); };

  // An order can arrive whole while its own question is still open: that question is then spent.
  function settle(same) {
    E.queue = E.queue.filter(([q]) => !same(q));
    if (!E.pending || !same(E.pending)) return;
    E.pending = null;
    nextQuestion();
  }

  // The room answers an order: the numbers move, the nurse says how, and the patient says how he feels.
  // Treatments given close together are answered together, in one line.
  function answerLater(meta, before, ramp) {
    const at = E.sim + ramp + 0.1;
    if (E.resp) { E.resp.names.push(meta.ar); E.resp.ids.push(meta.id); E.resp.at = Math.max(E.resp.at, at); return; }
    E.resp = { names: [meta.ar], ids: [meta.id], before, at, risk: E.risk };
    const fire = () => {
      if (!E || E.over || !E.resp) return;
      if (E.sim < E.resp.at - 0.001) { E.jobs.push({ at: E.resp.at, fn: fire }); return; }
      const x = E.resp;
      E.resp = null;
      // A dying patient's numbers can fall on their own: that is no credit to the drug.
      if (E.stage < 3 && E.risk <= x.risk + 2) respond(x.names, x.ids, x.before);
    };
    E.jobs.push({ at, fn: fire });
  }
  // What a nurse calls each treatment when she says what it did.
  const SPOKEN = { oxygen: 'الأكسجين', fluids: 'السوايل', antibiotics: 'المضاد', neb_salbutamol: 'البخار', neb_ipratropium: 'البخار', steroid: 'الكورتيزون', magnesium: 'المغنيسيوم', adrenaline: 'الأدرينالين', noradrenaline: 'النورأدرينالين', atropine: 'الأتروبين', nitrate: 'النترات', diuretic: 'المدر', insulin: 'الإنسولين', potassium: 'البوتاسيوم', opioid: 'المسكّن', sit_up: 'القعدة', airway: 'التنفس الصناعي', anticoag: 'المميع', aspirin: 'الأسبرين', iv_access: 'الكانيولا' };
  function respond(names, ids, before) {
    if (!E || E.over) return;
    E.bpAt = 0;
    paint();
    const v = live(), n = k => Math.round(v[k]), b = k => Math.round(before[k]);
    const parts = [];
    // Said the way a nurse says it at the bedside, not a chart entry.
    if (n('spo2') - b('spo2') >= 2) parts.push(`الـSpO2 طلعت من ${b('spo2')} لـ${n('spo2')}`);
    if (b('rr') - n('rr') >= 3) parts.push(`التنفس نزل من ${b('rr')} لـ${n('rr')}`);
    if (b('hr') - n('hr') >= 5) parts.push(`النبض نزل من ${b('hr')} لـ${n('hr')}`);
    else if (n('hr') - b('hr') >= 8 && before.hr < 60) parts.push(`النبض طلع من ${b('hr')} لـ${n('hr')}`);
    if (n('sbp') - b('sbp') >= 5 || (E.c.hyper && b('sbp') - n('sbp') >= 8)) parts.push(`الضغط صار ${n('sbp')} على ${n('dbp')}`);
    if (!parts.length) return;
    const who = [...new Set(ids.map((id, i) => SPOKEN[id] || names[i]))].join(' و');
    nurse(`بعد ${who}، ${parts.join('، و')}.`);
    // The relative sees it too.
    E.anx = clamp(E.anx - 5, 0, 100);
    if (!E.vtNow && E.stage < 3) {
      const by = E.c.improveBy || {}, own = ids.find(id => by[id] && !E.saidBy.has(id));
      if (own) E.saidBy.add(own);
      const line = own ? by[own] : E.improved < (E.c.improve || []).length ? E.c.improve[E.improved++] : '';
      if (line) later(0.08, () => person('p', line));
    }
  }

  // A message with three orders gets one "حاضر، X، وY، وZ." and one "done" line, not six lines.
  const joinSaid = list => list.map(([t, name]) => t.replace(/^حاضر[،.]?\s*/, '').replace(/[.。]\s*$/, '').trim() || name).join('، و');
  function sayBack(text, name, dose) {
    if (NM() && E.nurse.docDoing) return;
    if (E.rbBuf) E.rbBuf.push([text, name, dose]);
    else nurse(text, 'نُفِّذ: ' + name + (dose ? ' (' + dose + ')' : '') + '.');
  }
  function flushBack() {
    const list = E.rbBuf || [];
    E.rbBuf = null;
    if (NM()) { if (list.length) sys('نُفِّذ: ' + list.map(([, n, d]) => n + (d ? ' (' + d + ')' : '')).join('، و') + '.'); return; }
    if (list.length === 1) nurse(list[0][0]);
    else if (list.length > 1) nurse(`حاضر، ${joinSaid(list)}.`);
  }
  function sayDone(text) {
    if (!E.doneBuf) { E.doneBuf = []; later(0.005, () => { const list = E.doneBuf || []; E.doneBuf = null; if (list.length) nurse(list.length === 1 ? list[0] : list.map(t => t.replace(/[.。]\s*$/, '')).join('، و') + '.'); }); }
    E.doneBuf.push(text);
  }

  function give(a, meta, def) {
    const prev = E.done.get(a.id);
    const amt = amountOf(a, def, a.said || '');
    E.done.set(a.id, prev ? { ...prev, n: prev.n + 1, last: E.sim, dose: a.dose || prev.dose, amt: (prev.amt || 0) + amt, top: Math.max(prev.top || 0, amt) } : { at: E.sim, last: E.sim, n: 1, dose: a.dose || '', ok: a._ok || 'good', amt, top: amt });
    settle(q => q.type === 'dose' && q.a.id === a.id);
    log('action', meta.ar + (a.dose ? ' (' + a.dose + ')' : ''));
    if (NM()) nurseGave(a, meta);
    const named = a.agent && a.agent.length <= 24 ? a.agent : meta.ar;
    // The drug's name once: "سلاين 500 مل سلاين" is not how anyone reads an order back.
    const withName = a.dose && norm(a.dose).includes(norm(named)) ? a.dose : `${named} ${a.dose}`;
    // Asked for the numbers, she reads them at once; "حاضر" is for orders, said once for all of a message's orders.
    if (a.id === 'bp_repeat') { E.bpAt = 0; paint(); nurse(`قست الضغط هسا: ${spokenVitals()}.`); }
    else sayBack(a.sayDose ? `حاضر، ${a.sayDose}.` : a.dose ? `حاضر، ${withName}.` : (def.rb && !meta.dose ? def.rb : 'حاضر.'), meta.ar, a.dose);
    // More of the same adds something; saying the same flow again does not.
    const higher = !prev || !(meta.repeat && meta.repeat.up) || amt > (prev.top || 0);
    const share = prev ? (meta.repeat ? meta.repeat.again : 0) : 1;
    const gain = higher ? (def.slow || 0) * share : 0;
    if (gain) E.effects.push({ id: a.id, from: E.sim + (def.onset || 0), slow: gain });
    const fx = { ...(meta.fx || {}), ...(def.fx || {}) };
    if (a.id === 'oxygen' && def.spo2) fx.spo2 = def.spo2;
    if (higher && share && ['spo2', 'hr', 'rr', 'sbp', 'dbp'].some(k => fx[k])) {
      const before = { ...live() }, ramp = fx.ramp || 0.2, mod = { id: a.id, from: E.sim + 0.03, ramp };
      for (const k of ['spo2', 'hr', 'rr', 'sbp', 'dbp']) if (fx[k]) mod[k] = fx[k] * share;
      E.mods.push(mod);
      answerLater(meta, before, ramp);
    }
    if (a.id === 'adrenaline' && E.anaph && !E.anaph.treated) {
      E.anaph.treated = E.sim;
      later(0.15, () => { E.risk = clamp(E.risk - 18, 0, 100); E.bpAt = 0; paint(); nurse('الضغط بلش يطلع والصفير خف بعد الأدرينالين.', 'بدأ الضغط يرتفع وخفّ الصفير بعد الأدرينالين.'); });
    }
    if (a.id === 'shock' && E.vtNow) {
      later(0.1, () => {
        E.risk = E.c.risk.critical - 5; E.stage = 2; E.vtNow = false; E.shockedAt = E.sim; E.bpAt = 0;
        stageCheck(); paint();
        log('better', 'رجع النظم بعد الصدمة');
        nurse('رجع sinus، وفي نبض. بس لسا مش ثابت.', 'عاد النظم الجيبي وهناك نبض، لكنه غير مستقر بعد.');
      });
    }
    later(0.1, () => {
      if (a.id === 'temp') { E.tempKnown = true; paint(); }
      if (a.id === 'bp_repeat') return;
      if (def.done) sayDone(def.done);
      if ((a.id === 'call_senior' || a.id === 'call_icu') && !NM()) coach('called');
    });
    if (NM()) later(0.02, () => releaseOrders());
    // What the relative says about this very step, or else, for a needle or a drug, at most a question about it.
    if (!compOn('onDone', a.id, 0.6) && (meta.dose || ['iv_access', 'fluids', 'foley', 'airway'].includes(a.id))) director('procedure');
  }

  function unsafe(a, meta, def, allergic) {
    const need = allergic ? 'allergy' : def.needFact;
    const known = need ? E.facts.has(need) || (allergic && E.reacted) : true;
    const pending = { type: 'unsafe', a, def, allergic, ask: `The nurse challenged the unsafe order ${meta.en}. good = the trainee cancels or changes it, wrong = the trainee insists, na = not a reply.` };
    // Asked and known: the nurse stops it. Never asked: nobody in the room knows, and it is given.
    if (known) {
      ask(pending, (!allergic && def.challenge) || `دكتور، ${meta.ar}؟ في قصة حساسية، متأكد؟`);
      log('harm', 'أوقفت الممرضة أمراً غير آمن: ' + meta.ar);
      if (!E.caught.some(x => x.ar === meta.ar)) E.caught.push({ id: a.id, ar: meta.ar, why: allergic ? def.allergyEffect : def.why });
      return;
    }
    // A bare drug name read without the server is not yet an order for something dangerous.
    if (a.bare) { ask(pending, `${meta.ar}؟ بدك إياه هسا؟`); return; }
    harm(a, meta, def, allergic);
  }

  function harm(a, meta, def, allergic) {
    // Kept apart from E.done: a trap earns no step, and a safe drug can still follow an allergic reaction.
    E.harmed.add(a.id);
    if (allergic) E.reacted = true;
    nurse('حاضر.');
    // Given too early it still works, and it cannot be given twice.
    if (def.counts) { E.done.set(a.id, { at: E.sim, last: E.sim, n: 1, dose: a.dose || '', ok: 'early', amt: 0, top: 0 }); if (def.slow) E.effects.push({ id: a.id, from: E.sim + (def.onset || 0), slow: def.slow }); }
    if (def.off && !def.risk) { E.unneeded.push({ label: def.label, why: def.why }); log('harm', def.label); return; }
    const label = allergic ? meta.ar + ' رغم الحساسية' : def.label || meta.ar;
    E.harms.push({ at: E.sim, label, why: allergic ? def.allergyEffect : def.why, risk: allergic ? def.allergyRisk || 18 : def.risk || 12 });
    const risk = allergic ? def.allergyRisk || 18 : def.risk || 12;
    later(0.3, () => {
      // Anaphylaxis leaves time to treat it: that decision is the lesson.
      E.risk = clamp(E.risk + risk, 0, allergic && def.anaphylaxis ? Math.max(E.risk, 88) : 100);
      if (allergic && def.anaphylaxis && !E.anaph) E.anaph = { at: E.sim, treated: null };
      E.bpAt = 0;
      paint();
      log('harm', 'أذى: ' + label);
      alert(allergic ? def.allergyEffect : def.effect || 'ساءت حالة المريض بعد الدواء.');
      E.anx = clamp(E.anx + 20, 0, 100);
      // No alarm sounds below the urgent stage: the relative reacts to what they see.
      director(E.stage >= 2 ? 'alarm' : 'worse');
      coach('harm');
    });
  }

  function resolve(grade, text) {
    const p = E.pending;
    E.pending = null;
    E.resolved = true;
    if (grade === 'withdraw') {
      nurse('تمام، لغيته.');
    } else if (p.type === 'dose' && allergicTo({ agent: '' }, E.c.care[p.a.id] || {}, text)) {
      // "Give an antibiotic." "Which?" "Augmentin." is the same order as naming it outright.
      unsafe({ ...p.a, dose: text.slice(0, 40), _asked: true }, actOf(p.a.id), E.c.care[p.a.id], true);
    } else if (p.type === 'dose') {
      const meta = actOf(p.a.id), def = E.c.care[p.a.id] || {};
      const accepted = ACCEPT.test(norm(text));
      const a = { ...p.a, dose: doseIn(text) || (accepted && p.sug) || '', _asked: true, _ok: grade, said: (p.a.said || '') + ' ' + text };
      if (accepted && p.sug && !doseIn(text)) a.sayDose = p.tip.split(' (أو')[0].split('، ')[0];
      // "Yes" to "which one?" names nothing.
      if (accepted && !p.sug) { E.pending = p; E.resolved = false; nurse('أي نوع بالزبط، وقديش؟', { d: 'أي وسيلة، وعلى كم بالزبط؟' }); return; }
      if (doseBad({ ...a, dose: '' }, def, text, grade)) {
        badDose({ ...a, dose: a.dose || text.slice(0, 24) }, meta, def);
        if (!p.retried) {
          E.pending = { ...p, retried: true };
          nurse('دكتور، هاي الجرعة مش مزبوطة، راجعها.', 'الكمية غير مناسبة، فلم يُنفَّذ. راجعها.');
          return;
        }
        nurse('هاي الجرعة ما بقدر أعطيها. اطلبه من جديد بجرعة صحيحة، أو اسأل المشرف.', 'لم يُنفَّذ: الكمية غير مناسبة.');
      } else if (!(a.dose && overTotal(a, meta, def))) {
        give(a, meta, def);
        // One "yes" takes every other proposal she made in the same breath.
        if (accepted) for (const item of E.queue.filter(([q]) => q.type === 'dose' && q.sug)) { E.queue.splice(E.queue.indexOf(item), 1); order({ ...item[0].a, dose: item[0].sug, sayDose: item[0].tip.split(' (أو')[0].split('، ')[0], _asked: true }, text); }
      }
    } else if (p.type === 'reason') {
      if (grade === 'wrong' && !p.retried) {
        E.pending = { ...p, retried: true };
        nurse('هاد السبب مش راكب مع الحالة. شو بدك تشوف فيه؟');
        return;
      }
      submitTest(p.id, text.slice(0, 120), grade === 'good' ? 'good' : grade === 'ungraded' ? 'ungraded' : 'weak');
    } else if (p.type === 'unsafe') {
      const care = E.c.care[p.a.id];
      if (grade === 'wrong' && p.def.early && care && !tooEarly(care)) { nurse('هسا صار وقته، ببلش فيه.'); order({ ...p.a }, text); }
      else if (grade === 'wrong') harm(p.a, actOf(p.a.id), p.def, p.allergic);
      else nurse('تمام، ما بعطيه.');
    } else if (p.type === 'interpret' && grade === 'noted') {
      person('d', 'طيب، كمّل.');
    } else if (p.type === 'interpret') {
      E.tests[p.id].read = grade;
      log('read', `قراءة ${testOf(p.id).en}: ${grade === 'good' ? 'صحيحة' : grade === 'partial' ? 'ناقصة' : 'خاطئة'}`);
      // The instruction goes first and the findings are cut to fit; the diagnosis never reaches the supervisor's words.
      const en = testOf(p.id).en, found = resultText(p.id);
      const brief = head => head + found.slice(0, Math.max(0, 295 - head.length));
      if (grade === 'good') person('d', pickOf(['تمام، هيك القراءة.', 'صح، كمّل.', 'مزبوط، طيب شو الخطوة الجاية؟']));
      else if (grade === 'partial') voice('d', 'supervisor', brief(`The trainee read the ${en} partly right. Say it is right so far, then point to the one finding they left out, by its lead, value or place, and ask what it means. Never name the diagnosis, the artery or the procedure. Findings: `), `صح لحد هون، بس في إشي ناقص بالـ${en}. شو كمان شايف؟`);
      else voice('d', 'supervisor', brief(`The trainee misread the ${en}. Point to one lead or value that does not fit their reading and ask them to look again. Never name the diagnosis, the artery or the procedure. Findings: `), `ارجع للـ${en} مرة ثانية، في إشي مش راكب مع قراءتك.`);
    }
    nextQuestion();
  }

  /* ---------- tests ---------- */
  /* phase8 2026-11-07: a test outside the indication is no longer questioned on the spot; the question
     moves to the handover sheet (a written justification). The 'harm' response below is unchanged. */
  const ASK_NO_NOW = false;
  // A test is a click or a sentence away and its result lands in the chat at once.
  function orderTest(id, reason, ok, quiet) {
    const meta = testOf(id);
    if (!meta) return;
    const have = E.tests[id];
    if (have) {
      if (have.el && have.el.scrollIntoView) have.el.scrollIntoView({ block: 'center' });
      if (!quiet) nurse(have.back ? `طلع من شوي، ${resultBrief(id)}` : `نتيجة ${meta.ar} لسا ما طلعت.`, have.back ? 'النتيجة صدرت من قبل.' : 'النتيجة لم تصدر بعد.');
      return;
    }
    submitTest(id, reason || '', reason ? (ok === 'good' || ok === 'ungraded' ? ok : 'weak') : 'ungraded');
  }

  function submitTest(id, reason, reasonOk) {
    settle(q => q.type === 'reason' && q.id === id);
    const meta = testOf(id), res = E.c.results[id] || {};
    // Some tests are fine until the patient crashes.
    const shocked = res.whenShock && untreatedSbp() < 90;
    const ind = shocked ? res.whenShock : res.ind || 'no', why = shocked ? res.shockWhy : res.why;
    if (res.before && E.done.has(res.before)) E.lateTests.push({ ar: meta.ar, why: res.beforeWhy });
    E.tests[id] = { id, at: E.sim, reason, reasonOk, ind, why, back: false, read: null };
    log('test', `طلب ${meta.en}${reason ? ' (' + reason + ')' : ''}`);
    // Blood is drawn through the cannula: ordered in the same breath, the results come after it is in.
    const iv = E.done.get('iv_access');
    if (iv && E.sim - iv.at < 0.05) later(0.12, () => { resultBack(id); buildRecords(); });
    else { resultBack(id); buildRecords(); }
    if (ind === 'harm') {
      E.risk = clamp(E.risk + 6, 0, 100);
      voice('d', 'supervisor', `The trainee ordered ${meta.en}, which is dangerous right now: ${why} Stop them firmly and ask what it would change.`, `استنى، ليش ${meta.en} هسا؟ شو رح يغيّر بالـmanagement والمريض مش stable؟`);
    } else if (ASK_NO_NOW && ind === 'no' && E.askedNo < 2) {
      E.askedNo++;
      voice('d', 'supervisor', `The trainee ordered ${meta.en}, not needed here: ${res.why} Ask one short question about what it would change, without giving the answer.`, `${meta.en}؟ شو رح يغيّر بالخطة هسا؟`);
    }
    // A test is work being done, from the chat or from the records panel.
    E.busyTurn = E.turns;
    if (!compOn('onTest', id, 0.3)) director('turn');
  }

  const resultText = id => {
    const r = E.c.results[id] || {};
    return (r.rows || []).map(x => x[0] + ' ' + x[1] + (x[2] ? ' ' + x[2] : '')).join(', ') + (r.report || '');
  };
  function labCard(id) {
    const meta = testOf(id), r = E.c.results[id] || {};
    const table = (r.rows || []).length ? `<table class="er-lab" dir="ltr"><thead><tr><th>Test</th><th>Result</th><th>Reference</th></tr></thead><tbody>${r.rows.map(x =>
      `<tr${x[4] ? ' class="is-flag"' : ''}><td>${esc(x[0])}</td><td><b>${esc(x[1])}</b>${x[2] ? ` <small>${esc(x[2])}</small>` : ''}${x[4] ? ` <i>${esc(x[4])}</i>` : ''}</td><td>${esc(x[3])}</td></tr>`).join('')}</tbody></table>` : '';
    /* phase8 2026-11-07: an out-of-indication result is shown in full, marked amber with its badge. */
    const off = offInd(E.tests[id]);
    return `<div class="er-card${off ? ' is-off' : ''}">${off ? `<span class="er-off-badge">${OFF_BADGE}</span>` : ''}<div class="er-card-h"><b>${esc(meta.ar)}</b><bdi dir="ltr">${esc(meta.en)}</bdi></div>${table}${r.report ? `<p class="er-report" dir="ltr">${esc(r.report)}</p>` : ''}</div>`;
  }
  function resultBack(id) {
    const t = E.tests[id], res = E.c.results[id] || {};
    t.back = true;
    // A culture drawn is not a result yet: nothing to read for hours.
    const waiting = /incubat/i.test(res.report || '');
    t.el = say('lab', '', labCard(id));
    if (NM()) later(0.02, () => releaseOrders());
    if (offInd(t) && t.el && t.el.classList) t.el.classList.add('is-off'); // phase8 2026-11-07
    if (waiting) nurse('سحبت الزراعة من مكانين، والنتيجة بعد يوم أو يومين.', 'سُحبت الزراعة، ونتيجتها بعد يوم أو يومين.');
    if (!waiting && res.key && (res.ind === 'indicated' || res.ind === 'acceptable') && E.readAsks < 3) {
      E.readAsks++;
      ask({ type: 'interpret', id, ask: `The supervisor asked the trainee to read the ${testOf(id).en}. Reference reading: ${res.key}. good = matches, partial = incomplete, wrong = contradicts, na = not a reply.` }, pickOf([`شو بتقرأ بالـ${testOf(id).en}؟`, `طيب، الـ${testOf(id).en} شو بيحكيلك؟`]), 'd');
    }
  }

  /* ---------- who speaks next ---------- */
  // Runs after anything anyone says or does, never on a timer. A relative speaks when something
  // they can see has just happened, says each thing once, and lets a doctor who is working work.
  const lineOf = x => (typeof x === 'string' ? x : x && x.say) || '';
  const compPool = k => (E.c.companion.lines || {})[k] || [];
  // A line can wait for its moment: {say, stage} only once the patient is that sick,
  // {say, unless} or {say, fact} only while the trainee has not found that fact,
  // {say, after} not before that simulated minute (a confession comes late).
  const fresh = list => list.map(x => (typeof x === 'string' ? { say: x } : x))
    .filter(x => x.say && !E.comp.used.has(x.say) && !(x.stage && E.stage < x.stage) && !(x.after && E.sim < x.after) && !(x.unless && E.facts.has(x.unless)) && !(x.when && !E.facts.has(x.when)) && !(x.fact && E.facts.has(x.fact)));
  const busyNow = () => E.turns - E.busyTurn <= 1;
  function compSay(x, after = 0) {
    const c = E.comp;
    c.used.add(x.say);
    c.lastTurn = E.turns; c.lastAt = Math.max(c.lastAt, E.sim + after); c.count++;
    // A question still waiting to be said is dropped once the doctor has explained.
    const gen = c.gen;
    later(after, () => {
      if ((E.comp.gen !== gen && /[؟?]/.test(x.say)) || E.sim < E.comp.outUntil) { E.comp.count--; return; }
      person('c', x.say);
      const told = (E.c.companion.tells || {})[x.say];
      if (told) E.facts.add(told);
      // A line can carry the nurse's answer to it.
      if (x.nurse) later(0.15, () => nurse(x.nurse));
    });
    // Twice unheard while the doctor works: the nurse settles the relative and nudges the doctor once.
    if (++c.unheard >= 2 && !c.nurseStep && E.c.companion.nurse && E.stage < 3) {
      c.nurseStep = true;
      later(after + 0.5, () => {
        if (E.comp.gen !== gen) { E.comp.nurseStep = false; return; }
        nurse(E.c.companion.nurse, { d: 'أهل المريض خايفين. كلمة وحدة منك بتفرق.' }); if (!NM()) E.anx = clamp(E.anx - 10, 0, 100); E.comp.lastAt = E.sim;
      });
    }
  }
  // A line tied to what was just done or asked for: the relative sees it happen.
  function compOn(kind, id, after, always) {
    const list = fresh(((E.c.companion.lines || {})[kind] || {})[id] || []);
    if (!list.length || E.sim < E.comp.outUntil) return false;
    // Just told what is happening, a relative does not ask about it again.
    if (/[؟?]/.test(list[0].say) && E.turns - E.comp.explainedTurn <= 3) { E.comp.used.add(list[0].say); return false; }
    // The first moments belong to the doctor: a remark about this step waits a little,
    // and two remarks stand a minute apart, or the later one is let go.
    if (!always) {
      after = Math.max(after, 1.5 - E.sim);
      if (E.comp.lastAt > E.sim + after - 1) {
        const push = E.comp.lastAt + 1 - E.sim;
        if (push - after > 1.5) return false;
        after = push;
      }
    }
    compSay(list[0], after);
    return true;
  }

  function director(evt) {
    if (!E || E.over || evt === 'addressed') return;
    const a = E.anx, turns = E.turns - E.comp.lastTurn, mins = E.sim - E.comp.lastAt;
    // Waiting outside, the relative comes back in only for a crisis.
    if (E.sim < E.comp.outUntil) { if (evt === 'alarm' && E.stage >= 3) E.comp.outUntil = 0; else return; }
    if (evt === 'alarm' || evt === 'worse') { if (mins >= 0.5) breakIn(evt); return; }
    // The first moments belong to the doctor: the relative said their piece on arrival.
    if (E.turns < 3 && E.sim < 1.5) return;
    if (evt === 'better') { if (mins >= 0.5) breakIn('calm'); return; }
    if (turns < 3 || mins < 1.2) return;
    const has = k => fresh(compPool(k)).length > 0;
    if (evt === 'procedure') {
      if (E.comp.procs < 2 && has('procedure') && Math.random() < clamp(a / 110, 0.2, 0.6)) { E.comp.procs++; breakIn('procedure'); }
      return;
    }
    // A lull. A doctor at work hears only something worth hearing; one who is not
    // hears the question that went unanswered, and real anger only after real neglect.
    const waited = E.comp.asked !== null ? E.turns - E.comp.asked : 0;
    if (busyNow()) { if (has('info') && Math.random() < 0.3) breakIn('info'); return; }
    if (!E.comp.angry && a >= 85 && E.comp.ignored >= 2 && !E.comm.explained && waited >= 3 && has('angry')) { breakIn('angry'); return; }
    const unheard = waited >= 3 || E.turns - E.comp.heardTurn >= 5;
    if (unheard && E.comp.ignored < 2 && a >= 45 && has('ignored') && Math.random() < 0.6) { breakIn('ignored'); return; }
    const pick = [has('info') && 'info', E.turns >= 4 && E.comp.extra < 2 && has('extra') && 'extra'].filter(Boolean);
    if (pick.length && Math.random() < 0.55) breakIn(pickOf(pick));
  }

  function breakIn(trig) {
    const list = fresh(compPool(trig));
    if (!list.length) {
      // Fresh words only for what the relative can see; a demand is said once or not at all.
      const why = { alarm: 'the monitor alarm just went off and you are scared', worse: 'your relative looks worse than a minute ago: say what you see', calm: 'your relative looks a little better after the treatment: relief, a short thanks, and one practical question about what comes next' }[trig];
      if (why && api !== 'off') { const c = E.comp; c.lastTurn = E.turns; c.lastAt = E.sim; c.count++; voice('c', 'companion', why, ''); }
      return;
    }
    // The line written for this stage of illness comes first.
    const now = list.filter(x => x.stage && x.stage <= E.stage);
    const x = now.length ? now[now.length - 1] : pickOf(list.filter(y => !y.stage).length ? list.filter(y => !y.stage) : list);
    // Fear comes a beat after the alarm and the nurse, not on top of them.
    compSay(x, trig === 'alarm' || trig === 'worse' ? 0.25 : 0);
    if (trig === 'extra') E.comp.extra++;
    // Only a plain question to the doctor waits for an answer; a cry at the alarm does not.
    if (trig === 'ignored') { E.comp.ignored++; E.comp.asked = E.turns; }
    if (trig === 'angry') { E.comp.angry = true; log('comm', 'انزعج المرافق لأن أحداً لم يشرح له ما يجري'); }
  }

  // The supervisor is in the room and speaks when the moment calls for it.
  function coach(why) {
    if (E.over || NM()) return; // nurse mode: the instructor has her own fixed lines
    const missing = keyMissing().map(k => k.label).join('، ');
    if (why === 'called') { person('d', 'أنا هون. شو عندك؟ بجملتين: situation وأهم رقم.'); return; }
    if (why === 'harm') { voice('d', 'supervisor', 'Something the trainee ordered just harmed the patient. Say it calmly, ask what changed and what they do now.', 'وقف. شو تغيّر بعد آخر دوا؟ شو بتعمل هسا؟'); return; }
    if (why === 'urgent' && !missing) return;
    E.hint = Math.min(E.hint + 1, E.c.teach.length - 1);
    E.hints++;
    const fallback = E.c.teach[E.hint];
    voice('d', 'supervisor', why === 'critical'
      ? `The patient is about to arrest.${E.vtNow ? ' Unstable VT is on the monitor and only a shock will end it: say so.' : ''} Key steps not done: ${missing || 'none'}. Tell the trainee directly and briefly what matters now, without naming the disease.`
      : `The patient is getting worse. Key steps not done: ${missing || 'none'}. Ask one sharp question that points at the priority.`, fallback);
  }
  // Calling ICU is escalating too.
  const doneAs = id => E.done.get(id) || (id === 'call_senior' ? E.done.get('call_icu') : undefined);
  const keyMissing = () => Object.entries(E.c.care).filter(([id, d]) => d.key && !doneAs(id)).map(([id, d]) => ({ id, ...d }));

  function arrest() {
    if (E.over) return;
    E.outcome = 'arrest';
    log('stage', 'توقف قلبي تنفسي');
    alert('توقف: لا يوجد نبض واضح. فريق الإنعاش يستلم المريض.');
    nurse('كود! كود! بلشنا إنعاش!', 'توقف القلب. نُودي على فريق الإنعاش.');
    conclude(null);
  }

  /* ---------- ending ---------- */
  function openEnd() {
    if (!E || E.over) return;
    if (NM()) { openEndNurse(); return; }
    const box = $('er-sheet'), my = E, keep = E.draft || {};
    /* phase8 2026-11-07: every out-of-indication test ordered needs a written justification before handover. */
    const offs = Object.values(E.tests).filter(offInd), keepJ = keep.just || {};
    const justBlock = offs.length ? `<div class="er-just" role="group" aria-labelledby="er-just-h">
        <p class="er-just-h" id="er-just-h">⚠️ تبرير الفحوصات/الصور الإضافية التي طلبتها خارج الاستطباب الأساسي للحالة:</p>
        ${offs.map(t => { const m = testOf(t.id) || {}; return `<label>${esc(m.ar)} <bdi dir="ltr">${esc(m.en)}</bdi><textarea id="er-just-${esc(t.id)}" data-just="${esc(t.id)}" rows="2" maxlength="400" placeholder="ما الذي أردت أن تؤكده أو تستبعده بهذا الفحص؟"></textarea></label>`; }).join('')}
        <p class="er-small">اكتب ثلاث كلمات على الأقل لكل فحص. يُقبل التبرير إذا ربط الفحص بسؤال سريري واضح.</p>
      </div>` : '';
    box.hidden = false;
    box.innerHTML = `<div class="er-pane" role="dialog" aria-modal="true" aria-labelledby="er-end-h">
      <h3 id="er-end-h">سلّم الحالة للأخصائي</h3>
      <label>تشخيصك<input id="er-dx" type="text" maxlength="120" autocomplete="off"></label>
      <label>إلى أين يذهب المريض؟<select id="er-dispo"><option value="">اختر</option><option value="icu">العناية الحثيثة</option><option value="hdu">مراقبة عالية في الطوارئ</option><option value="cath">القسطرة</option><option value="ward">طابق عادي</option><option value="home">البيت</option></select></label>
      <label>التسليم (SBAR)<textarea id="er-sbar" rows="5" maxlength="800" placeholder="الوضع، الخلفية، التقييم مع الأرقام، التوصية"></textarea></label>
      ${justBlock}
      <div class="er-pane-f"><button type="button" class="s" id="er-end-x">رجوع للمريض</button><button type="button" class="p" id="er-end-go" disabled>سلّم</button></div>
    </div>`;
    $('er-dx').value = keep.dx || ''; $('er-dispo').value = keep.dispo || ''; $('er-sbar').value = keep.sbar || '';
    offs.forEach(t => { const el = $('er-just-' + t.id); if (el) el.value = keepJ[t.id] || ''; }); // phase8
    const check = () => {
      // phase8 2026-11-07: the justifications live in the draft too, so closing the sheet keeps them.
      const just = {};
      offs.forEach(t => { const el = $('er-just-' + t.id); just[t.id] = el ? el.value : ''; });
      my.draft = { dx: $('er-dx').value, dispo: $('er-dispo').value, sbar: $('er-sbar').value, just };
      const justDone = offs.every(t => wordsIn(just[t.id]) >= 3);
      $('er-end-go').disabled = !($('er-dx').value.trim() && $('er-dispo').value && $('er-sbar').value.trim() && justDone);
    };
    ['er-dx', 'er-dispo', 'er-sbar'].forEach(id => $(id).addEventListener('input', check));
    offs.forEach(t => { const el = $('er-just-' + t.id); if (el) el.addEventListener('input', check); }); // phase8
    check();
    $('er-end-x').onclick = () => { box.hidden = true; $('er-input').focus(); };
    $('er-end-go').onclick = async () => {
      $('er-end-go').disabled = true;
      $('er-end-go').textContent = 'لحظة...';
      const end = { dx: $('er-dx').value.trim(), dispo: $('er-dispo').value, sbar: $('er-sbar').value.trim() };
      // phase8 2026-11-07: each justification is kept on its test and graded locally.
      offs.forEach(t => { const el = $('er-just-' + t.id), v = String((el && el.value) || '').trim().slice(0, 400); t.justify = v; t.justOk = justGood(v); });
      const g = await call({ mode: 'grade', dxText: end.dx, sbar: end.sbar, harms: E.harms.map(h => h.label) }, 12000);
      // The heart can stop while the handover is being read: that ending stands.
      if (E !== my || E.over) return;
      end.grade = g && g.dx ? { ...g, graded: true } : localGrade(end);
      E.outcome = E.risk < E.c.risk.watch && !keyMissing().length ? 'stable' : 'unstable';
      box.hidden = true;
      conclude(end);
    };
    $('er-dx').focus();
  }
  // "Gave aspirin" about a drug nobody gave is the one lie plain text can show (both handover sheets use it).
  const claimedIn = s => /(اعطيت|عطيت|اعطيناه|اعطيناها|عطيناه|عطيناها|اخذ|اخد|gave|given|started)/.test(s) && D.actions.some(a => a.limits && !E.done.has(a.id) && hasAny(s, a.kw) && !/(بدي|اقترح|نحتاج|يحتاج|تحتاج|لازم|need|plan)/.test(s));
  function localGrade(end) {
    const d = norm(end.dx), s = norm(end.sbar), c = E.c;
    const close = (c.dx.close || []).some(w => hasAny(d, [w]));
    const right = !close && c.dx.accept.some(w => hasAny(d, [w]));
    // "Gave aspirin" about a drug nobody gave is the one lie plain text can show.
    const claimed = claimedIn(s);
    return { dx: right ? 'right' : close ? 'close' : 'wrong', s: s.length > 15, b: /(عنده|عندها|تاريخ|history|قصه)/.test(s), a: /\d/.test(s), r: /(بدي|اقترح|نحتاج|لازم|توصيه|plan)/.test(s), invented: claimed, note: '' };
  }

  function score(end) {
    const c = E.c, keys = Object.entries(c.care).filter(([, d]) => d.key);
    const safety = [];
    keys.forEach(([id, d]) => {
      const x = doneAs(id);
      safety.push({ id, d, at: x ? x.at : null, state: !x ? 'missed' : x.at <= d.by ? 'ontime' : 'late' });
    });
    Object.entries(c.results).filter(([, r]) => r.by).forEach(([id, r]) => {
      const x = E.tests[id];
      safety.push({ id, d: r, at: x ? x.at : null, state: !x ? 'missed' : x.at <= r.by ? 'ontime' : 'late' });
    });
    const per = 40 / Math.max(1, safety.length);
    const place = end ? dispoCheck(end.dispo) : null;
    let safe = safety.reduce((s, k) => s + (k.state === 'ontime' ? per : k.state === 'late' ? per / 2 : 0), 0) - E.harms.length * 10 - Math.min(9, E.wrongDoses.length * 3) - E.unneeded.length * 2 - (place === 'bad' ? 10 : 0);
    if (E.outcome === 'arrest') safe = Math.min(safe, 10);
    safe = clamp(safe, 0, 40);
    const dxPts = !end ? 0 : end.grade.dx === 'right' ? 15 : end.grade.dx === 'close' ? 8 : 0;
    const ts = Object.values(E.tests);
    let testPts = 15;
    // phase8 2026-11-07: an accepted written justification takes back the 'no' penalty; 'harm' stays whatever is written.
    ts.forEach(t => { testPts -= t.ind === 'harm' ? 6 : t.ind === 'no' ? (t.justOk === true ? 0 : 3) : 0; if (!['good', 'ungraded'].includes(t.reasonOk) && t.ind !== 'no' && t.ind !== 'harm') testPts -= 1.5; if (t.read === 'wrong') testPts -= 2; });
    // Staying out of the scanner in shock is the right call, not a missed test.
    const missedTests = Object.entries(c.results).filter(([id, r]) => r.ind === 'indicated' && !E.tests[id] && !(r.whenShock && fell())).map(([id]) => id);
    testPts = clamp(testPts - missedTests.length * 3, 0, 15);
    const reds = [...c.facts, ...c.exam].filter(f => f.red);
    const got = reds.filter(f => E.facts.has(f.id) || E.exam.has(f.id));
    const hist = reds.length ? 10 * got.length / reds.length : 10;
    const m = E.comm;
    const comm = clamp((m.introduced ? 2 : 0) + (m.explained ? 4 : 0) + (m.empathy ? 2 : 0) + (m.rude ? 0 : 2) - m.jargon, 0, 10);
    const g = end && end.grade;
    const hand = !end ? 0 : clamp((g.s ? 1.5 : 0) + (g.b ? 1.5 : 0) + (g.a ? 1.5 : 0) + (g.r ? 1.5 : 0) + (place === 'right' ? 4 : 0) - (g.invented ? 3 : 0), 0, 10);
    const total = Math.round(safe + dxPts + testPts + hist + comm + hand);
    return { total, safe, dxPts, testPts, hist, comm, hand, safety, missedTests, reds, got, place };
  }
  // Where the patient belongs can change during the case: a PE that collapsed is an ICU patient.
  const fell = () => !!E.c.collapse && (E.topStage >= 3 || E.done.has(E.c.collapse.need));
  const dispoRight = () => (fell() ? E.c.collapse.dispo : E.c.dispo);
  function dispoCheck(place) {
    if ((E.c.dispoBad || []).includes(place)) return 'bad';
    return place === dispoRight() || (!fell() && (E.c.dispoAlso || []).includes(place)) ? 'right' : 'wrong';
  }
  const DISPO = { icu: 'العناية الحثيثة', hdu: 'مراقبة عالية في الطوارئ', cath: 'القسطرة', ward: 'طابق عادي', home: 'البيت' };

  /* phase8 2026-11-07 (made a helper for the nurse report, 2026-11-07): the tests table rows, in order of time.
     src adds the nurse report's «المصدر» column; the doctor report passes none and is unchanged. */
  const justCell = t => {
    if (!offInd(t)) return '—';
    if (t.justOk === undefined) return 'لم تكتب تبريراً';
    return `${t.justify ? esc(t.justify) : 'لم تكتب تبريراً'}<small class="${t.justOk ? 'j-ok' : 'j-no'}">${t.justOk ? 'مقبول' : 'غير مقنع'}</small>`;
  };
  const testRows = (reasoned, src) => Object.values(E.tests).sort((a, b) => a.at - b.at).map(t => `<tr${offInd(t) ? ' class="is-off"' : ''}><td><span dir="ltr">${esc(testOf(t.id).en)}</span>${offInd(t) ? `<span class="er-off-badge">${OFF_BADGE}</span>` : ''}</td><td class="font-num" dir="ltr">${clk(t.at)}</td><td class="i-${t.ind}">${IND[t.ind]}</td>${src ? `<td>${src(t)}</td>` : ''}${reasoned ? `<td>${RSN[t.reasonOk] || ''}${t.reason ? `<small>${esc(t.reason)}</small>` : ''}</td>` : ''}<td>${justCell(t)}</td><td>${esc(t.why || '')}</td></tr>`).join('');

  function chart() {
    const W = 640, H = 150, pts = E.riskLog, maxT = Math.max(1, pts[pts.length - 1][0]);
    const x = t => 8 + t / maxT * (W - 16), y = r => H - 10 - r / 100 * (H - 20);
    const line = pts.map(p => x(p[0]).toFixed(1) + ',' + y(p[1]).toFixed(1)).join(' ');
    const R = E.c.risk;
    const marks = E.log.filter(l => l.type === 'action' || l.type === 'harm').map(l => `<circle cx="${x(l.at).toFixed(1)}" cy="${y(riskAt(l.at)).toFixed(1)}" r="4" class="${l.type === 'harm' ? 'm-harm' : 'm-act'}"><title>${esc(l.text)}</title></circle>`).join('');
    return `<svg class="er-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="نسبة الخطر خلال الحالة"><text class="t" x="10" y="16">100%</text><text class="t" x="10" y="${H - 12}">0%</text><text class="t" x="${W - 10}" y="${H - 12}" text-anchor="end">${mm(maxT)}</text><line class="g-crit" x1="8" x2="${W - 8}" y1="${y(R.critical)}" y2="${y(R.critical)}"/><line class="g-urg" x1="8" x2="${W - 8}" y1="${y(R.urgent)}" y2="${y(R.urgent)}"/><polyline points="${line}"/>${marks}</svg>`;
  }
  const riskAt = t => { let r = E.riskLog[0][1]; for (const p of E.riskLog) { if (p[0] > t) break; r = p[1]; } return r; };
  const mm = t => { const m = Math.floor(t), s = Math.floor((t % 1) * 60); return `${m}:${String(s).padStart(2, '0')}`; };
  const IND = { indicated: 'مناسب', acceptable: 'مقبول', no: 'غير مطابق للاستطباب', harm: 'خطر الآن' };
  const RSN = { good: 'مبرّر', weak: 'تبرير ضعيف', none: 'بلا تبرير', ungraded: 'لم يُقيَّم' };

  function conclude(end) {
    if (E.over) return;
    E.over = true;
    E.riskLog.push([E.sim, E.risk]);
    cancelAnimationFrame(tickId);
    $('er-sheet').hidden = true;
    if ($('er-records')) $('er-records').classList.remove('is-open');
    const sound = document.querySelector('.er-mon .nb-mon-sound');
    if (sound && sound.getAttribute('aria-pressed') === 'true') { sound.click(); soundBack = true; }
    $('view-er').dataset.stage = 'calm';
    $('view-er').dataset.rhythm = '';
    $('er-input').disabled = true;
    ['er-send', 'er-test', 'er-end'].forEach(id => { $(id).disabled = true; });
    if (NM()) { concludeNurse(end); return; }
    const c = E.c, s = score(end);
    // A score cannot buy back a harmed patient: these fail the case whatever the number says.
    const fails = [];
    if (E.outcome === 'arrest') fails.push('توقف القلب');
    if (s.place === 'bad') fails.push(`وجهة خطرة: ${DISPO[end.dispo]}`);
    if (E.harms.some(h => h.risk >= 8)) fails.push('أذى وصل إلى المريض');
    if (s.safety.some(k => k.state === 'missed')) fails.push('خطوة أساسية لم تحدث');
    if (end && E.vtNow) fails.push('VT لم يُعالج');
    if (end && fell() && !E.done.has(c.collapse.need)) fails.push('الهبوط لم يُعالج');
    if (end && E.anaph && !E.anaph.treated) fails.push('التأق لم يُعالج');
    if (end && !Object.keys(E.tests).length) fails.push('لم تطلب أي فحص');
    // Without the server the diagnosis is matched by word, which is too blunt to fail anyone on.
    if (end && end.grade.dx === 'wrong' && end.grade.graded) fails.push('التشخيص خاطئ');
    const passed = s.total >= 70 && !fails.length;
    const head = E.outcome === 'arrest' ? 'توقف قلب المريض قبل أن تستقر حالته' : E.outcome === 'stable' ? 'سلّمت المريض مستقراً' : 'سلّمت المريض وهو غير مستقر';
    const good = [], gaps = [];
    s.safety.forEach(k => {
      if (k.state === 'ontime') good.push(`${k.d.label}: عند الدقيقة ${mm(k.at)}`);
      else gaps.push(`<b>${esc(k.d.label)}</b>: ${k.state === 'late' ? 'تأخر إلى الدقيقة ' + mm(k.at) : 'لم يحدث'}. ${esc(k.d.why)}`);
    });
    E.harms.forEach(h => gaps.push(`<b>${esc(h.label)}</b>: ${esc(h.why)}`));
    if (E.anaph) {
      if (E.anaph.treated) good.push(`عالجت التأق بالأدرينالين عند الدقيقة ${mm(E.anaph.treated)}.`);
      else gaps.push('<b>التأق</b>: لم تعطِ adrenaline IM، وهو العلاج الأول للتأق قبل أي شيء آخر.');
    }
    if (E.vtAt !== null) {
      if (E.vtNow) gaps.push('<b>VT غير مستقر</b>: انتهت الحالة والـVT مستمر. الـVT بهبوط ضغط لا يتوقف وحده ويحتاج صدمة فورية.');
      else if (E.done.has('shock')) good.push(`عالجت الـVT بصدمة عند الدقيقة ${mm(E.done.get('shock').at)}.`);
    }
    if (fell() && !E.done.has(E.c.collapse.need)) gaps.push(`<b>الهبوط</b>: ${esc(E.c.collapse.needWhy)}`);
    E.wrongDoses.forEach(w => gaps.push(`<b>جرعة غير صحيحة</b>: ${esc(w.ar)} ${esc(w.dose)}.${w.ref ? ' المرجع: ' + esc(w.ref) : ''}`));
    E.unneeded.forEach(u => gaps.push(`<b>${esc(u.label)}</b>: ${esc(u.why)}`));
    E.caught.filter(x => !E.harmed.has(x.id)).forEach(x => gaps.push(`<b>أوقفتك الممرضة في ${esc(x.ar)}</b>: ${esc(x.why || '')} في الواقع قد لا يوقفك أحد.`));
    E.lateTests.forEach(x => gaps.push(`<b>${esc(x.ar)} بعد المضاد</b>: ${esc(x.why)}`));
    Object.values(E.tests).filter(t => t.read === 'wrong' || t.read === 'partial').forEach(t => gaps.push(`<b>قراءة ${esc(testOf(t.id).en)}</b>: ${t.read === 'wrong' ? 'خاطئة' : 'ناقصة'}. القراءة الصحيحة: ${esc(c.results[t.id].key)}`));
    if (end) {
      const place = `اخترت ${DISPO[end.dispo]}`, whyPlace = fell() ? c.collapse.why : c.dispoWhy;
      if (s.place === 'right') good.push(`الوجهة صحيحة: ${DISPO[end.dispo]}.`);
      else gaps.push(`<b>الوجهة</b>: ${place}، والصحيح ${DISPO[dispoRight()]}. ${esc(whyPlace)}`);
      const miss = [['s', 'الوضع'], ['b', 'الخلفية'], ['a', 'التقييم بالأرقام'], ['r', 'التوصية']].filter(([k]) => !end.grade[k]).map(([, v]) => v);
      if (miss.length) gaps.push(`<b>التسليم</b>: ناقصه ${miss.join('، ')}.`);
      if (end.grade.invented) gaps.push('<b>التسليم</b>: ذكرت ما لم يحدث. التسليم الخاطئ يضلل من يستلم المريض.');
    }
    s.reds.filter(f => !s.got.includes(f)).forEach(f => gaps.push(`<b>لم تصل إليك هذه المعلومة</b>: «${esc(f.say)}»`));
    s.missedTests.forEach(id => gaps.push(`<b>فحص لازم لم تطلبه</b>: ${esc(testOf(id).ar)}. ${esc(c.results[id].why)}`));
    /* phase8 2026-11-07: the written justifications of out-of-indication tests. A dangerous test stays a gap even when argued well. */
    Object.values(E.tests).filter(t => offInd(t) && t.justOk === false).forEach(t => gaps.push(`<b>فحص خارج الاستطباب</b>: ${esc(testOf(t.id).ar)}. تبريرك لم يكن مقنعاً. ${esc(t.why || '')}`));
    Object.values(E.tests).filter(t => t.ind === 'no' && t.justOk === true).forEach(t => good.push(`برّرت طلب ${testOf(t.id).ar} تبريراً مقبولاً.`));
    Object.values(E.tests).filter(t => t.ind === 'harm' && t.justOk === true).forEach(t => gaps.push(`<b>فحص خارج الاستطباب</b>: ${esc(testOf(t.id).ar)}. تبريرك مقبول، لكن هذا الفحص يعرّض المريض للخطر في وضعه الحالي. ${esc(t.why || '')}`));
    if (E.comm.introduced) good.push('عرّفت بنفسك.');
    if (E.comm.explained) good.push('شرحت ما يجري بكلام مفهوم.');
    else gaps.push(`<b>التواصل</b>: لم تشرح لـ${esc(c.companion.name)} ما يجري، وتدخلت ${E.comp.count} مرة.`);
    if (E.comm.rude) gaps.push('<b>التواصل</b>: خرج منك كلام جارح تحت الضغط.');
    const riskTop = Math.round(Math.max(...E.riskLog.map(p => p[1]))), riskEnd = Math.round(E.risk), anxTop = Math.round(E.anxTop);
    const reasoned = Object.values(E.tests).some(t => t.reason);
    /* phase8 2026-11-07: in order of time, with the time ordered, the justification column and the amber rows. */
    const tests = testRows(reasoned);
    const box = $('er-debrief');
    box.hidden = false;
    box.innerHTML = `<div class="er-report-page">
      <div class="er-score" tabindex="-1"><b class="font-num">${s.total}</b><div><strong>${head}</strong><span>${passed ? 'مجتاز' : fails.length ? 'غير مجتاز: ' + esc(fails.join('، ')) : 'غير مجتاز'} · مدة الحالة ${mm(E.sim)}</span></div></div>
      <p><b>التشخيص الصحيح:</b> ${esc(fell() && c.collapse.dx ? c.collapse.dx : c.dx.ar)}${end ? ` · <b>كتبت:</b> ${esc(end.dx)}` : ''}</p>
      <ul class="er-parts">
        <li>سلامة المريض <b class="font-num">${Math.round(s.safe)} / 40</b></li><li>التشخيص <b class="font-num">${s.dxPts} / 15</b></li>
        <li>الفحوصات <b class="font-num">${Math.round(s.testPts)} / 15</b></li><li>القصة وعلامات الخطر <b class="font-num">${Math.round(s.hist)} / 10</b></li>
        <li>التواصل <b class="font-num">${Math.round(s.comm)} / 10</b></li><li>التسليم والوجهة <b class="font-num">${s.hand} / 10</b></li>
      </ul>
      <h4>الخطر خلال الحالة</h4>${chart()}<p class="er-small">أعلى خطر <b class="font-num">${riskTop}%</b> · عند النهاية <b class="font-num">${riskEnd}%</b> · أعلى ضغط من الأهل <b class="font-num">${anxTop}%</b></p>
      ${good.length ? `<h4>أحسنت</h4><ul class="er-good">${good.map(g => `<li>${esc(g)}</li>`).join('')}</ul>` : ''}
      ${gaps.length ? `<h4>ما يجب أن يتغير</h4><ul class="er-gaps">${gaps.map(g => `<li>${g}</li>`).join('')}</ul>` : ''}
      <h4>سجل الفحوصات المطلوبة وتوقيت طلبها في الجلسة</h4>${tests ? `<div class="er-scroll"><table class="er-tests"><thead><tr><th>الفحص</th><th>وقت الطلب</th><th>الاستطباب</th>${reasoned ? '<th>تبريرك عند الطلب</th>' : ''}<th>التبرير عند التسليم</th><th>لماذا</th></tr></thead><tbody>${tests}</tbody></table></div>` : '<p>لم تطلب أي فحص.</p>'}
      ${end && end.grade.note ? `<h4>تسليمك</h4><p>${esc(end.grade.note)}</p>` : ''}
      <h4>الخلاصة</h4><p>${esc(c.brief)}</p>
      <p class="er-small">طلبت مساعدة المشرف ${E.helps} مرة، وبادر هو ${E.hints} مرة. الحالات والدرجات تدريبية ولم يراجعها طبيب بعد.</p>
      <div class="er-pane-f"><button type="button" class="s" id="er-home">الرئيسية</button><button type="button" class="s" id="er-again">أعد الحالة نفسها</button><button type="button" class="p" id="er-next">الحالة التالية</button></div>
    </div>`;
    const keepRole = E.role;
    $('er-again').onclick = () => begin(c.id, { role: keepRole });
    $('er-next').onclick = () => begin(undefined, { role: keepRole });
    $('er-home').onclick = () => { if (typeof navigateTo === 'function') navigateTo('home'); };
    lastReport = E;
    box.querySelector('.er-score').focus({ preventScroll: true });
    box.scrollTop = 0;
    save(s, passed, end);
  }

  /* ---------- nurse mode: the handover, the score and the report (2026-11-07) ---------- */
  const SBAR_BOX = [
    ['s', 'S · الوضع', 'الوضع: من المريض، وأين هو، وما الذي يحدث الآن؟'],
    ['b', 'B · الخلفية', 'الخلفية: الأمراض المزمنة، الأدوية، الحساسية، وما أُعطي حتى الآن.'],
    ['a', 'A · التقييم', 'التقييم: آخر علامات حيوية بالأرقام، وما تغيّر بعد التدخلات.'],
    ['r', 'R · التوصية', 'التوصية: ما يحتاجه المستلم، من المراقبة والأوامر المعلّقة ومتى يُبلَّغ الطبيب.'],
  ];
  const orderedTest = id => E.nurse.orders.some(o => o.kind === 'test' && o.id === id && !o.cancelled && !o.reminder);
  const SEC_N = ['التقييم الأولي (ABCDE)', 'التعرف على التدهور والتصعيد', 'التدخلات ضمن نطاق التمريض', 'سلامة الدواء', 'المتابعة وإعادة التقييم', 'التواصل', 'التسليم (SBAR)'];
  function openEndNurse() {
    const box = $('er-sheet'), my = E, keep = E.draft || {};
    // Only a bedside test the nurse chose herself can be out of indication; an ordered test never is.
    const offs = Object.values(E.tests).filter(t => offInd(t) && !orderedTest(t.id)), keepJ = keep.just || {};
    const justBlock = offs.length ? `<div class="er-just" role="group" aria-labelledby="er-just-h">
        <p class="er-just-h" id="er-just-h">⚠️ تبرير الفحوصات السريرية التي أجريتها خارج الاستطباب الأساسي للحالة:</p>
        ${offs.map(t => { const m = testOf(t.id) || {}; return `<label>${esc(m.ar)} <bdi dir="ltr">${esc(m.en)}</bdi><textarea id="er-just-${esc(t.id)}" data-just="${esc(t.id)}" rows="2" maxlength="400" placeholder="ما الذي أردت أن تعرفه بهذا الفحص؟"></textarea></label>`; }).join('')}
        <p class="er-small">اكتب ثلاث كلمات على الأقل لكل فحص.</p>
      </div>` : '';
    box.hidden = false;
    box.innerHTML = `<div class="er-pane er-pane-n" role="dialog" aria-modal="true" aria-labelledby="er-end-h">
      <h3 id="er-end-h">سلّم الحالة للممرض/ة المستلم/ة (SBAR)</h3>
      <p class="er-small">التسليم التمريضي بصيغة SBAR فقط: لا يُطلب منك تشخيص ولا وجهة.</p>
      ${SBAR_BOX.map(([k, l, ph]) => `<label>${l}<textarea id="er-sbar-${k}" rows="2" maxlength="300" placeholder="${ph}"></textarea></label>`).join('')}
      ${justBlock}
      <div class="er-pane-f"><button type="button" class="s" id="er-end-x">رجوع للمريض</button><button type="button" class="p" id="er-end-go" disabled>سلّم</button></div>
    </div>`;
    SBAR_BOX.forEach(([k]) => { $('er-sbar-' + k).value = (keep.parts || {})[k] || ''; });
    offs.forEach(t => { const el = $('er-just-' + t.id); if (el) el.value = keepJ[t.id] || ''; });
    const check = () => {
      const just = {}, parts = {};
      offs.forEach(t => { const el = $('er-just-' + t.id); just[t.id] = el ? el.value : ''; });
      SBAR_BOX.forEach(([k]) => { parts[k] = $('er-sbar-' + k).value; });
      my.draft = { parts, just };
      $('er-end-go').disabled = !(SBAR_BOX.every(([k]) => wordsIn(parts[k]) >= 3) && offs.every(t => wordsIn(just[t.id]) >= 3));
    };
    SBAR_BOX.forEach(([k]) => $('er-sbar-' + k).addEventListener('input', check));
    offs.forEach(t => { const el = $('er-just-' + t.id); if (el) el.addEventListener('input', check); });
    check();
    $('er-end-x').onclick = () => { box.hidden = true; $('er-input').focus(); };
    $('er-end-go').onclick = async () => {
      $('er-end-go').disabled = true;
      $('er-end-go').textContent = 'لحظة...';
      const parts = {};
      SBAR_BOX.forEach(([k]) => { parts[k] = String($('er-sbar-' + k).value || '').trim(); });
      const sbar = 'S: ' + parts.s + '\nB: ' + parts.b + '\nA: ' + parts.a + '\nR: ' + parts.r;
      const end = { sbar, parts, nurse: true };
      offs.forEach(t => { const el = $('er-just-' + t.id), v = String((el && el.value) || '').trim().slice(0, 400); t.justify = v; t.justOk = justGood(v); });
      const g = await call({ mode: 'grade', role: 'nurse', sbar, harms: E.harms.map(h => h.label) }, 12000);
      if (E !== my || E.over) return;
      const local = gradeHandoverNurse(end);
      // The server reads S, B, A and R; the room still checks what only it can see (an intervention named, a drug claimed).
      end.grade = g && g.dx ? { ...local, s: !!g.s, b: !!g.b, a: !!g.a, r: !!g.r, invented: !!g.invented || local.invented, note: typeof g.note === 'string' ? g.note.slice(0, 240) : '', graded: true } : local;
      E.outcome = E.risk < E.c.risk.watch && !nurseKeyMissing().length ? 'stable' : 'unstable';
      box.hidden = true;
      conclude(end);
    };
    $('er-sbar-s').focus();
  }
  // Offline, the four boxes graded by rule; A only with readings that match the monitor at the end.
  function gradeHandoverNurse(end) {
    const P = end.parts || {}, all = norm(end.sbar || '');
    const gs = gradeSbar(P.s || ''), gb = gradeSbar(P.b || ''), ga = gradeSbar((P.a || '') + ' ' + (P.s || '')), gr = gradeSbar(P.r || '');
    const s = gs.s || norm(P.s || '').length >= 25;
    const r = gr.r || /(راقب|مراقب|متابع|اعاده|اعيد|بلغ|تبليغ|ينتظر|انتظار|معلق|الاوامر|اتصل)/.test(norm(P.r || ''));
    const mention = [...E.done.keys()].filter(id => !['bp_repeat', 'temp', 'call_senior', 'call_icu'].includes(id)).some(id => hasAny(all, (E.nurse.acts.find(a => a.id === id) || actOf(id) || {}).kw || []));
    // «عنده مرض مزمن ما بعرف» is no background: an unknown history counts only beside a named condition or the allergy status.
    const pb = norm(P.b || ''), unsure = /(ما بعرف|مش عارف|مش متاكد|ما بعرفش)/.test(pb);
    const b = gb.b && (!unsure || ALLERGY_W.test(pb) || /(سكري|ربو|ضغط(?! *\d)|قلب|كلي|قصور|صرع|جلطه|بخاخ|انسولين)/.test(pb));
    return { dx: 'wrong', s, b, a: ga.a, aWrong: ga.aWrong, r, mention, allergy: ALLERGY_W.test(all), invented: claimedNurse(end.sbar || ''), note: '' };
  }
  // The same lie check, clause by clause, so "allergic to aspirin" beside "gave salbutamol" is not a claim.
  const claimedNurse = raw => String(raw).split(/[،,.\n؛;]+/).map(norm).some(cl => /(اعطيت|عطيت|اعطيناه|اعطيناها|عطيناه|عطيناها|اخذ|اخد|gave|given|started)/.test(cl) && !ALLERGY_W.test(cl)
    && D.actions.some(a => a.limits && !E.done.has(a.id) && hasAny(cl, a.kw) && !/(بدي|اقترح|نحتاج|يحتاج|تحتاج|لازم|need|plan)/.test(cl)));
  const nurseOwnKeys = () => Object.entries(E.c.care).filter(([id, d]) => d.key && d.by && OWN_KEYS.includes(id));
  const keyOrders = () => E.nurse.orders.filter(o => o.kind === 'act' && !o.reminder && !o.cancelled && !o.doctorDoes && !o.optional && ((E.c.care[o.id] || {}).key || o.when === 'collapse'));
  const nurseKeyMissing = () => [...nurseOwnKeys().filter(([id]) => !E.done.has(id)).map(([id]) => id), ...keyOrders().filter(o => o.doneAt == null).map(o => o.id)];
  function scoreNurse(end) {
    const c = E.c, N = E.nurse, X = N.esc;
    // 1. ABCDE /15: each part 2 (full by minute 3, half by 6; one of two parts = half), plus red flags 5.
    const tf = t => (t === null || t === undefined ? 0 : t <= 3 ? 1 : t <= 6 ? 0.5 : 0);
    const exAt = ids => { const ts = ids.map(id => N.examAt[id]).filter(x => x !== undefined); return ts.length ? Math.min(...ts) : null; };
    const minOf = list => { const ts = list.filter(x => x !== null && x !== undefined); return ts.length ? Math.min(...ts) : null; };
    const v1 = N.vchecks.length ? N.vchecks[0] : null, glu = E.tests.glucose ? E.tests.glucose.at : null;
    const pair = (t1, t2) => (t1 !== null && t2 !== null ? [2 * tf(Math.max(t1, t2)), Math.max(t1, t2)] : t1 !== null || t2 !== null ? [tf(t1 !== null ? t1 : t2), null] : [0, null]);
    const one = t => [2 * tf(t), t];
    const circ = ['perfusion', 'hydration', 'volume', 'heart'].filter(id => c.exam.some(f => f.id === id));
    const parts = {
      a: one(minOf([N.airwayAt, exAt(['consciousness', 'general', 'work'])])),
      b: pair(v1, exAt(['chest', 'work'])),
      c: circ.length ? pair(v1, exAt(circ)) : one(v1),
      d: pair(exAt(['consciousness', 'general']), glu),
      e: one(minOf([N.tempAt, exAt(['abdomen', 'legs', 'neuro', 'perfusion', 'hydration'])])),
    };
    const reds = [...c.facts, ...c.exam].filter(f => f.red), got = reds.filter(f => E.facts.has(f.id) || E.exam.has(f.id));
    const assess = clamp(Object.values(parts).reduce((t, [p]) => t + p, 0) + (reds.length ? 5 * got.length / reds.length : 5), 0, 15);
    const abcdeAt = Object.values(parts).every(([p]) => p === 2) ? Math.max(...Object.values(parts).map(([, t]) => t)) : null;
    // 2. recognising deterioration and escalating /20
    const ESC = escBy(), called = X.calledAt, s2 = N.stageAt[2];
    const timing = X.by === 'alarm' || called === null ? 0 : called <= ESC && (s2 === undefined || called < s2) ? 10 : 5;
    const sb = X.sbar, half = (sb && sb.half) || {};
    const sbPart = k => (!sb || sb.none || !sb[k] ? 0 : half[k] ? 1 : 2);
    const sbarPts = ['s', 'b', 'a', 'r'].reduce((t, k) => t + sbPart(k), 0);
    const rose = called !== null && Object.values(N.stageAt).some(at => at > called);
    const follow = called === null ? 0 : !rose || (X.updateAt !== null && X.reNeededAt !== null && X.updateAt - X.reNeededAt <= 2) ? 2 : 0;
    const escPts = timing + sbarPts + follow;
    // 3. interventions within nursing scope /20
    const own = nurseOwnKeys().map(([id, d]) => { const x = E.done.get(id); return { id, d, at: x ? x.at : null, state: !x ? 'missed' : x.at <= d.by ? 'ontime' : 'late' }; });
    const pk = own.length ? 8 / own.length : 0;
    const a8 = own.length ? own.reduce((t, k) => t + (k.state === 'ontime' ? pk : k.state === 'late' ? pk / 2 : 0), 0) : 8;
    const bed = [...NURSE_TESTS].filter(id => (c.results[id] || {}).ind === 'indicated').map(id => { const r = c.results[id], by = r.by || 10, x = E.tests[id]; return { id, by, why: r.why, at: x ? x.at : null, state: !x ? 'missed' : x.at <= by ? 'ontime' : 'late' }; });
    const pb = bed.length ? 4 / bed.length : 0;
    const b4 = bed.length ? bed.reduce((t, k) => t + (k.state === 'ontime' ? pb : k.state === 'late' ? pb / 2 : 0), 0) : 4;
    const ords = N.orders.filter(o => !o.reminder && !o.cancelled && !o.doctorDoes).map(o => ({ o, lag: o.doneAt == null ? null : Math.max(0, o.doneAt - o.at) }));
    const po = ords.length ? 8 / ords.length : 0;
    const c8 = ords.reduce((t, r) => t + (r.lag === null ? 0 : r.lag <= 3 ? po : r.lag <= 6 ? po / 2 : 0), 0);
    const gapIds = [...new Set(N.scope.filter(x => x.why !== 'wrong-agent').map(x => x.id))];
    const interv = clamp(a8 + b4 + c8 - Math.min(6, gapIds.length * 2) - N.notIndicated.length * 2, 0, 20);
    // 4. medication safety /15
    const first = N.given[0] || null;
    const allergyPts = first ? (first.allergyAsked ? 5 : N.allergyAt !== null ? 2 : 0) : N.allergyAt !== null ? 5 : 0;
    // Review fixes 2026-11-07: telling the doctor is scored from the doctor's side only; no dose credit with no drug
    // given or an ordered key drug never given; cultures drawn after the antibiotic cost 2 each.
    const toldPts = N.allergyToldDoc ? 3 : 0;
    const drugMissed = keyOrders().some(o => isDrug(o.id) && o.doneAt == null);
    const dosePts = !N.given.length || drugMissed ? 0 : Math.max(0, 4 - 2 * E.wrongDoses.length);
    const rbPts = N.ordersAt !== null && N.readBack ? 3 : 0;
    const med = clamp(allergyPts + toldPts + dosePts + rbPts - 2 * E.lateTests.length, 0, 15);
    // 5. follow-up and reassessment /10
    const iv = N.interv, covered = iv.filter(x => N.vchecks.some(t => t > x.at && t <= x.at + REASSESS_WIN));
    const r7 = iv.length ? 7 * covered.length / iv.length : N.vchecks.some(t => t > 3) ? 7 : 0;
    let gapMax = 0;
    if (N.vchecks.length) { const ts = [...N.vchecks, E.sim]; for (let i = 1; i < ts.length; i++) gapMax = Math.max(gapMax, ts[i] - ts[i - 1]); }
    const cont = !N.vchecks.length ? 0 : gapMax <= 5 ? 3 : gapMax <= 8 ? 1.5 : 0;
    const reass = r7 + cont;
    // 6. communication /10: as in the doctor room
    const m = E.comm;
    const comm = clamp((m.introduced ? 2 : 0) + (m.explained ? 4 : 0) + (m.empathy ? 2 : 0) + (m.rude ? 0 : 2) - m.jargon, 0, 10);
    // 7. the SBAR handover /10
    const g = end && end.grade;
    const hand = !end ? 0 : clamp((g.s ? 2 : 0) + (g.b ? 2 : 0) + (g.a ? 3 : 0) + (g.r ? 2 : 0) + (g.mention ? 1 : 0) - (g.invented ? 3 : 0), 0, 10);
    const total = Math.round(assess + escPts + interv + med + reass + comm + hand);
    // These fail the case whatever the number says.
    const fails = [];
    if (E.outcome === 'arrest') fails.push('توقف القلب');
    if (X.by === 'alarm' || called === null) fails.push('لم تبلّغ الطبيب');
    if (own.some(k => k.state === 'missed')) fails.push('خطوة أساسية ضمن صلاحيتك لم تحدث');
    if (keyOrders().some(o => o.doneAt == null)) fails.push('أمر طبيب أساسي لم يُنفّذ');
    if (E.harms.some(h => h.risk >= 8)) fails.push('أذى وصل إلى المريض');
    if (!N.vchecks.length) fails.push('لم تُعِد قياس العلامات الحيوية');
    if (N.given.length && N.allergyAt === null && (c.facts.find(f => f.id === 'allergy') || {}).red) fails.push('أعطيت دواءً دون السؤال عن الحساسية والمريض لديه حساسية مسجّلة');
    return { total, assess, escPts, interv, med, reass, comm, hand, parts, abcdeAt, reds, got, timing, sbarPts, follow, rose, own, bed, ords, gapIds, first, toldPts, rbPts, iv, covered, gapMax, fails, ESC };
  }
  function concludeNurse(end) {
    const c = E.c, N = E.nurse, X = N.esc, s = scoreNurse(end);
    const fails = s.fails, passed = s.total >= 70 && !fails.length;
    const head = E.outcome === 'arrest' ? 'توقف قلب المريض قبل أن تستقر حالته' : E.outcome === 'stable' ? 'سلّمت المريض مستقراً' : 'سلّمت المريض وهو غير مستقر';
    // Review fix 2026-11-07: «أحسنت» and «ما يجب أن يتغير» are grouped under the seven sections.
    const good = SEC_N.map(() => []), gaps = SEC_N.map(() => []);
    let sec = 0;
    const G = x => good[sec].push(x), P = x => gaps[sec].push(x);
    // 1. ABCDE
    sec = 0;
    if (s.abcdeAt !== null) G(`أكملت التقييم الأولي ABCDE عند الدقيقة ${mm(s.abcdeAt)}.`);
    else {
      const PART = { a: 'المجرى الهوائي', b: 'التنفس', c: 'الدوران', d: 'الوعي وسكر الدم', e: 'الحرارة والفحص الكامل' };
      const miss = Object.entries(s.parts).filter(([, [p]]) => p < 2).map(([k]) => PART[k]);
      if (miss.length) P(`<b>التقييم الأولي</b>: لم تقيّم ${miss.join('، ')} في الدقائق الأولى.`);
    }
    s.reds.filter(f => !s.got.includes(f)).forEach(f => P(`<b>لم تصل إليك هذه المعلومة</b>: «${esc(forNurse(f.say))}»`));
    // 2. escalation
    sec = 1;
    const ecg = E.tests.ecg;
    if (s.timing === 10) G(`أبلغت الطبيب عند الدقيقة ${mm(X.calledAt)}، قبل أن تتدهور الحالة.`);
    else if (s.timing === 5) P(`<b>التصعيد</b>: تأخر إبلاغ الطبيب إلى الدقيقة ${mm(X.calledAt)}، ${typeof N.nm.escBy === 'number' ? 'وكانت العلامات الحيوية عند وصول المريض تستدعي إبلاغاً فورياً.' : 'وكان تخطيط القلب يستدعي إبلاغاً فورياً.'}`);
    else if (X.by === 'alarm') P(`<b>التصعيد</b>: لم تبلّغ ${docT()}، و${N.sex === 'F' ? 'حضرت' : 'حضر'} بسبب إنذار المونيتور عند الدقيقة ${mm(N.alarmAt)}.`);
    else P('<b>التصعيد</b>: لم تبلّغ الطبيب.');
    if (X.sbar && X.sbar.none) P('<b>رسالة التصعيد</b>: لم تقدّم للطبيب رسالة SBAR حين سألك عن الوضع.');
    else if (X.sbar) {
      const miss = [['s', 'الوضع'], ['b', 'الخلفية'], ['a', 'التقييم بالأرقام'], ['r', 'التوصية']].filter(([k]) => !X.sbar[k]).map(([, v]) => v);
      if (miss.length) P(`<b>رسالة التصعيد</b>: ناقصها ${miss.join('، ')}.`);
      if (X.sbar.aWrong) P('<b>رسالة التصعيد</b>: ذكرت أرقاماً لا تطابق المونيتور.');
      if (X.sbar.goodSuggest) G('اقترحت على الطبيب ما تحتاجه الحالة.');
    }
    if (typeof N.nm.escBy !== 'number' && ecg && X.calledAt !== null && X.calledAt >= ecg.at) G(`سجّلت تخطيط القلب عند الدقيقة ${mm(ecg.at)} وأبلغت الطبيب بعده بـ${fix(X.calledAt - ecg.at, 1)} دقيقة.`);
    if (s.rose && s.follow === 0) P('<b>بعد التدهور</b>: لم تُحدّث الطبيب حين ساءت الأرقام.');
    const code = N.helpAt.find(h => h.stage >= 2 || h.vt);
    if (code) G(`ناديت فريق الإنعاش عند الدقيقة ${mm(code.at)} والحالة حرجة.`);
    // 3. interventions within nursing scope
    sec = 2;
    s.own.forEach(k => { if (k.state === 'ontime') G(`${k.d.label}: عند الدقيقة ${mm(k.at)}.`); else P(`<b>${esc(k.d.label)}</b>: ${k.state === 'late' ? 'تأخر إلى الدقيقة ' + mm(k.at) : 'لم يحدث'}. ${esc(k.d.why || '')}`); });
    s.bed.forEach(k => { const ar = testOf(k.id).ar; if (k.state === 'ontime') G(`${ar}: عند الدقيقة ${mm(k.at)}.`); else P(`<b>${esc(ar)}</b>: ${k.state === 'late' ? 'تأخر إلى الدقيقة ' + mm(k.at) : 'لم يحدث'}. ${esc(k.why || '')}`); });
    s.ords.forEach(({ o, lag }) => { if (lag === null) P(`<b>أمر الطبيب</b>: ${esc(o.ar)} لم يُنفّذ.`); else G(`نفّذت أمر ${o.ar} بعد ${fix(lag, 1)} دقيقة من صدوره.`); });
    if (s.gapIds.length) {
      const ars = s.gapIds.map(id => (actOf(id) || testOf(id) || {}).ar || id);
      const whys = s.gapIds.map(id => c.care[id]).filter(d => d && d.harm && d.why).map(d => d.why);
      P(`<b>خارج نطاق التمريض المستقل</b>: حاولت ${esc(ars.join('، '))} دون أمر طبيب، فلم يُنفَّذ. الأدوية والسوائل والفحوصات المخبرية والتصوير تحتاج أمراً من الطبيب في بروتوكولات الطوارئ المعتادة.${whys.length ? ' ومن ملف الحالة: ' + esc(whys.join(' ')) : ''}`);
    }
    N.scope.filter(x => x.why === 'wrong-agent').forEach(x => P(`<b>دواء غير الذي طُلب</b>: ${esc((actOf(x.id) || {}).ar || x.id)}، فلم يُعطَ.`));
    if (N.notIndicated.length) P('<b>الأكسجين</b>: طلبته والإشباع ضمن الهدف.');
    const ivx = E.done.get('iv_access');
    if (N.drawn !== null && ivx && Math.abs(N.drawn - ivx.at) <= 1) G('سحبت عينات الدم مبكراً مع الكانيولا.');
    if (N.bls.length) G(`فتحت المجرى الهوائي أو هوّيت بالأمبو عند الدقيقة ${mm(N.bls[0])} (إنعاش أساسي ضمن صلاحيتك).`);
    E.harms.forEach(h => P(`<b>${esc(h.label)}</b>: ${esc(h.why)}`));
    // 4. medication safety
    sec = 3;
    if (s.first) {
      if (s.first.allergyAsked) G('سألت عن الحساسية قبل أول دواء.');
      else P(`<b>الحساسية</b>: أعطيت ${esc((actOf(s.first.id) || {}).ar || '')} قبل أن تسأل عن الحساسية.`);
    }
    if (N.bandNoted && E.facts.has('allergy')) G('سجّلت الحساسية على الملف ووضعت سوار الحساسية.');
    // Told to the doctor is the doctor's side only; the gap shows only once there was a doctor to tell.
    if (s.toldPts) G('ذكرت حالة الحساسية للطبيب.');
    else if (N.allergyGuess !== null) P('<b>الحساسية</b>: أخبرت الطبيب أن لا حساسية قبل أن تسأل المريض أو أهله.');
    else if (X.calledAt !== null) P('<b>الحساسية</b>: لم تذكر للطبيب حالة الحساسية.');
    E.wrongDoses.forEach(w => P(`<b>جرعة مختلفة عن الأمر</b>: ${esc(w.ar)} ${esc(w.dose)}. الأمر: ${esc(w.ref || '')}.`));
    // Cultures drawn after the first antibiotic dose (the case file's own reason).
    E.lateTests.forEach(x => P(`<b>${esc(x.ar)} بعد المضاد</b>: ${esc(x.why)}`));
    if (N.ordersAt !== null) { if (s.rbPts) G('أعدت قراءة أوامر الطبيب الشفهية للتأكد منها.'); else P('<b>إعادة قراءة الأمر</b>: لم تُعِد قراءة أوامر الطبيب الشفهية للتأكد منها.'); }
    // 5. reassessment
    sec = 4;
    if (s.iv.length) G(`أعدت قياس العلامات الحيوية بعد ${s.covered.length} من ${s.iv.length} تدخلات.`);
    s.iv.filter(x => !s.covered.includes(x)).forEach(x => P(`<b>إعادة التقييم</b>: بعد ${esc(x.ar)} عند الدقيقة ${mm(x.at)} لم تُعِد قياس العلامات الحيوية خلال 5 دقائق.`));
    if (N.vchecks.length && s.gapMax > 5) P(`<b>المراقبة</b>: مرّت ${fix(s.gapMax, 1)} دقائق دون قياس للعلامات الحيوية.`);
    if (!N.vchecks.length) P('<b>المراقبة</b>: لم تُعِد قياس العلامات الحيوية خلال الحالة.');
    // 6. communication (as in the doctor room)
    sec = 5;
    if (E.comm.introduced) G('عرّفت بنفسك.');
    if (E.comm.explained) G('شرحت ما يجري بكلام مفهوم.');
    else P(`<b>التواصل</b>: لم تشرح لـ${esc(c.companion.name)} ما يجري، وتدخلت ${E.comp.count} مرة.`);
    if (E.comm.rude) P('<b>التواصل</b>: خرج منك كلام جارح تحت الضغط.');
    // 7. handover
    sec = 6;
    if (end) {
      const miss = [['s', 'الوضع'], ['b', 'الخلفية'], ['a', 'التقييم بالأرقام'], ['r', 'التوصية']].filter(([k]) => !end.grade[k]).map(([, v]) => v);
      if (miss.length) P(`<b>التسليم</b>: ناقصه ${miss.join('، ')}.`);
      if (end.grade.invented) P('<b>التسليم</b>: ذكرت ما لم يحدث. التسليم الخاطئ يضلل من يستلم المريض.');
      if (end.grade.allergy) G('ذكرت حالة الحساسية في التسليم.');
    }
    const secs = SEC_N.map((h, i) => (good[i].length || gaps[i].length ? `<section class="er-sec"><h5>${h}</h5>`
      + (good[i].length ? `<p class="er-sec-k">أحسنت</p><ul class="er-good">${good[i].map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '')
      + (gaps[i].length ? `<p class="er-sec-k">ما يجب أن يتغير</p><ul class="er-gaps">${gaps[i].map(x => `<li>${x}</li>`).join('')}</ul>` : '') + '</section>' : '')).join('');
    const riskTop = Math.round(Math.max(...E.riskLog.map(p => p[1]))), riskEnd = Math.round(E.risk), anxTop = Math.round(E.anxTop);
    const reasoned = Object.values(E.tests).some(t => t.reason);
    const src = t => (orderedTest(t.id) ? 'أمر الطبيب' : NURSE_TESTS.has(t.id) ? 'ضمن صلاحيتك' : 'أمر الطبيب');
    const tried = [...new Map(N.scope.filter(x => x.kind === 'test' && !E.tests[x.id]).map(x => [x.id, x])).values()];
    const blocked = tried.map(x => `<tr class="is-blocked"><td><span dir="ltr">${esc(testOf(x.id).en)}</span></td><td class="font-num" dir="ltr">${clk(x.at)}</td><td>—</td><td>محاولة دون أمر</td>${reasoned ? '<td>—</td>' : ''}<td>—</td><td>لم يُنفَّذ: يحتاج أمراً من الطبيب.</td></tr>`).join('');
    const tests = testRows(reasoned, src) + blocked;
    const box = $('er-debrief');
    box.hidden = false;
    box.innerHTML = `<div class="er-report-page er-report-n">
      <div class="er-score" tabindex="-1"><b class="font-num">${s.total}</b><div><strong>${head}</strong><span>${passed ? 'مجتاز' : fails.length ? 'غير مجتاز: ' + esc(fails.join('، ')) : 'غير مجتاز'} · مدة الحالة ${mm(E.sim)}</span></div></div>
      <p><b>دورك:</b> ممرض/ة الطوارئ المسؤول/ة عن السرير</p>
      <ul class="er-parts">
        <li>التقييم الأولي (ABCDE) <b class="font-num">${Math.round(s.assess)} / 15</b></li><li>التعرف على التدهور والتصعيد <b class="font-num">${Math.round(s.escPts)} / 20</b></li>
        <li>التدخلات ضمن نطاق التمريض <b class="font-num">${Math.round(s.interv)} / 20</b></li><li>سلامة الدواء <b class="font-num">${Math.round(s.med)} / 15</b></li>
        <li>المتابعة وإعادة التقييم <b class="font-num">${Math.round(s.reass)} / 10</b></li><li>التواصل <b class="font-num">${Math.round(s.comm)} / 10</b></li>
        <li>التسليم (SBAR) <b class="font-num">${Math.round(s.hand)} / 10</b></li>
      </ul>
      <h4>الخطر خلال الحالة</h4>${chart()}<p class="er-small">أعلى خطر <b class="font-num">${riskTop}%</b> · عند النهاية <b class="font-num">${riskEnd}%</b> · أعلى ضغط من الأهل <b class="font-num">${anxTop}%</b></p>
      ${secs ? `<h4>الملاحظات حسب الأقسام</h4>${secs}` : ''}
      <h4>سجل الفحوصات المطلوبة وتوقيت طلبها في الجلسة</h4>${tests ? `<div class="er-scroll"><table class="er-tests"><thead><tr><th>الفحص</th><th>وقت الطلب</th><th>الاستطباب</th><th>المصدر</th>${reasoned ? '<th>تبريرك عند الطلب</th>' : ''}<th>التبرير عند التسليم</th><th>لماذا</th></tr></thead><tbody>${tests}</tbody></table></div>` : '<p>لم تُجرِ أي فحص.</p>'}
      ${end && end.grade.note ? `<h4>تسليمك</h4><p>${esc(end.grade.note)}</p>` : ''}
      <p><b>تشخيص الطبيب (للاطلاع، لا يُقيَّم)</b>: ${esc(fell() && c.collapse.dx ? c.collapse.dx : c.dx.ar)}</p>
      <h4>لماذا كانت الحالة خطرة؟</h4><p>${esc(c.brief)}</p>
      <p class="er-small">طلبت مساعدة المشرفة ${E.helps} مرة، وبادرت هي ${E.hints} مرة. حُدّد نطاق التمريض هنا وفق بروتوكولات الطوارئ المعتادة، وقد يختلف من مستشفى لآخر. الحالات والدرجات وعبارات الطبيب والمشرفة تدريبية ولم يراجعها طبيب بعد.</p>
      <div class="er-pane-f"><button type="button" class="s" id="er-home">الرئيسية</button><button type="button" class="s" id="er-again">أعد الحالة نفسها</button><button type="button" class="p" id="er-next">الحالة التالية</button></div>
    </div>`;
    $('er-again').onclick = () => begin(c.id, { role: 'nurse' });
    $('er-next').onclick = () => begin(undefined, { role: 'nurse' });
    $('er-home').onclick = () => { if (typeof navigateTo === 'function') navigateTo('home'); };
    lastReport = E;
    box.querySelector('.er-score').focus({ preventScroll: true });
    box.scrollTop = 0;
    save(s, passed, end);
  }

  function save(s, passed, end) {
    try {
      const u = typeof authState !== 'undefined' && authState.user;
      if (!u) return;
      u.history = u.history || [];
      // nurse mode 2026-11-07: a nurse run is its own entry (er_<id>_n); avgEr below still counts it (open owner item).
      const nm = NM();
      u.history.unshift({ caseTitle: (nm ? 'غرفة الطوارئ (دور التمريض) · ' : 'غرفة الطوارئ · ') + E.c.dx.ar, mode: 'غرفة الطوارئ', correct: nm ? !!passed : !!(end && end.grade.dx === 'right'), workupCount: Object.keys(E.tests).length,
        questions: E.facts.size, score: `${s.total}% (${passed ? 'مجتاز' : 'غير مجتاز'})`, caseId: 'er_' + E.c.id + (nm ? '_n' : ''), num: s.total, passed, ts: Date.now(), date: new Date().toISOString().slice(0, 10) });
      u.stats = u.stats || {};
      u.stats.completed = u.history.length;
      const mine = u.history.filter(h => /^er_/.test(h.caseId || ''));
      u.stats.avgEr = Math.round(mine.reduce((a, h) => a + (h.num || 0), 0) / mine.length) + '%';
      if (typeof saveAccountToStorage === 'function') saveAccountToStorage(u);
      if (typeof renderHomePath === 'function') renderHomePath(u);
    } catch (e) { console.error(e); }
  }

  /* ---------- the records column ---------- */
  const PANELS = [['heart', 'القلب'], ['blood', 'الدم'], ['chem', 'الكيمياء والغازات'], ['imaging', 'الأشعة'], ['other', 'البول وأخرى']];
  let recFilter = 'all', recQuery = '';
  /* phase8 2026-11-07: the investigations centre. The chips follow the reference wording; tests are grouped by
     where they are done (bedside, lab and urine, imaging and tracings), and the 12-lead ECG sits with imaging
     and tracings as in the reference. Only tests the case has a result for are listed. */
  const CATS = [['bed', 'سريري'], ['lab', 'مختبر وبول'], ['img', 'أشعة وتخطيط']];
  const catOf = t => (t.id === 'ecg' ? 'img' : t.group);
  const panelName = k => (PANELS.find(p => p[0] === k) || ['', ''])[1];
  let recView = 'order';
  function buildRecords() {
    const f = $('er-rec-f'), list = $('er-rec-list');
    if (!f || !list || !D || !E) return;
    if (recFilter !== 'all' && !CATS.some(([k]) => k === recFilter)) recFilter = 'all';
    f.innerHTML = [['all', 'الكل'], ...CATS].map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${k === recFilter}">${l}</button>`).join('');
    const q = norm(recQuery);
    const was = document.activeElement, keep = was && was.dataset ? (was.dataset.t ? `[data-t="${was.dataset.t}"]` : was.dataset.f ? `[data-f="${was.dataset.f}"]` : was.dataset.go ? `[data-go="${was.dataset.go}"]` : was.dataset.ord ? `[data-ord="${was.dataset.ord}"]` : '') : '';
    list.innerHTML = CATS.filter(([k]) => recFilter === 'all' || recFilter === k).map(([k, label]) => {
      const items = D.tests.filter(t => catOf(t) === k && E.c.results[t.id] && (!q || norm(t.ar + ' ' + t.en + ' ' + (t.kw || []).join(' ') + ' ' + label + ' ' + panelName(t.panel)).includes(q)));
      if (!items.length) return '';
      return `<section class="er-rec-sec"><h4>${label}</h4><div>${items.map(t => {
        const x = E.tests[t.id], off = offInd(x);
        return `<button type="button" class="er-t${x ? ' is-done' : ''}${off ? ' is-off' : ''}" data-t="${t.id}"><span dir="ltr">${esc(t.en)}</span><small>${esc(t.ar)}</small>${nurseTag(t.id)}${x ? `<i aria-label="${off ? 'تم الطلب، خارج الاستطباب المباشر' : 'تم الطلب'}">✓${off ? '<em class="er-off-dot" aria-hidden="true"></em>' : ''}</i>` : ''}</button>`;
      }).join('')}</div></section>`;
    }).join('') || '<p class="er-small">لا يوجد فحص بهذا الاسم.</p>';
    buildLog();
    if (keep) { const n = $('er-records').querySelector(keep); if (n && n.focus) n.focus({ preventScroll: true }); }
  }
  /* phase8 2026-11-07: the results log, newest first; a row takes the trainee to the result card in the chat. */
  function buildLog() {
    const box = $('er-rec-log'), tab = $('er-rec-logtab'), rec = $('er-records');
    if (!box || !E) return;
    const rows = Object.values(E.tests).sort((a, b) => b.at - a.at);
    if (tab) tab.textContent = `السجل (${rows.length})`;
    if (rec && rec.dataset) rec.dataset.view = recView;
    if (REAL) document.querySelectorAll('#er-rec-tabs [data-v]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.v === recView)));
    box.innerHTML = `<h4 class="er-log-h">سجل الفحوصات</h4>` + (rows.length ? `<ol class="er-log">${rows.map(t => {
      const m = testOf(t.id) || {}, off = offInd(t), waiting = /incubat/i.test((E.c.results[t.id] || {}).report || '');
      const state = !t.back ? 'بانتظار النتيجة' : waiting ? 'سُحبت العينة، والنتيجة بعد يوم أو يومين' : 'النتيجة جاهزة';
      return `<li class="er-log-row${off ? ' is-off' : ''}">${off ? `<span class="er-off-badge">${OFF_BADGE}</span>` : ''}<button type="button" data-go="${esc(t.id)}"${t.back ? '' : ' disabled'}><b>${esc(m.ar)}</b><bdi dir="ltr">${esc(m.en)}</bdi><span class="er-log-meta"><span class="font-num" dir="ltr">${clk(t.at)}</span> · <span class="${t.back ? 'is-ready' : ''}">${state}</span></span>${t.back ? '<span class="er-log-go">اعرض النتيجة في المحادثة</span>' : ''}</button></li>`;
    }).join('')}</ol>` : '<p class="er-small">لم تطلب أي فحص بعد. كل فحص تطلبه يظهر هنا مع وقت طلبه.</p>');
  }
  function setRecView(v) {
    recView = v === 'log' ? 'log' : 'order';
    buildLog();
  }
  // phase8 2026-11-07: scroll the chat to a result card and flash it.
  function goResult(id) {
    const t = E && E.tests[id];
    if (!t || !t.el) return;
    if (!wide()) toggleRecords(false);
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (t.el.scrollIntoView) t.el.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' });
    t.el.classList.remove('er-flash');
    void t.el.offsetWidth;
    t.el.classList.add('er-flash');
    setTimeout(() => t.el.classList.remove('er-flash'), 1800);
  }
  const wide = () => window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;
  function toggleRecords(force) {
    const r = $('er-records');
    if (!r) return;
    if (wide()) { const q = $('er-rec-q'); if (q) q.focus(); return; }
    r.classList.toggle('is-open', force === undefined ? !r.classList.contains('is-open') : force);
  }
  // Touching a test is ordering it: the trainee's line appears, and the result right after it.
  function panelTest(id) {
    if (!E || E.over) return;
    const meta = testOf(id);
    if (!meta) return;
    E.started = true;
    // Nurse mode: a click is an attempt, and a lab test or an image without an order is not done.
    if (NM()) { if (!E.tests[id]) person('me', 'طلبتُ ' + meta.ar); nurseTest(id, '', ''); if (!wide()) toggleRecords(false); return; }
    if (!E.tests[id]) { person('me', `بدي ${meta.en}`); orderTest(id, '', '', true); }
    else orderTest(id, '', '', true);
    if (!wide()) toggleRecords(false);
  }

  /* ---------- starting ---------- */
  let soundBack = false, lastReport = null;
  function begin(id, opts = {}) {
    if (tickId) cancelAnimationFrame(tickId);
    const prevNurse = !!E && E.role === 'nurse';
    if (soundBack) { soundBack = false; const b = document.querySelector('.er-mon .nb-mon-sound'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); }
    const list = D.cases;
    let c = id ? list.find(x => x.id === id) : null;
    if (!c) {
      const fresh = list.filter(x => !seen.has(x.id));
      if (!fresh.length) seen.clear();
      c = pickOf(fresh.length ? fresh : list);
    }
    seen.add(c.id);
    // nurse mode 2026-11-07: the role draws no random number, so the doctor room's sequence is unchanged.
    let role = opts.role === 'nurse' || opts.role === 'doctor' ? opts.role : roleWanted || (briefTrack() === 'nursing' ? 'nurse' : 'doctor');
    if (role === 'nurse' && !c.nurseMode) role = 'doctor';
    E = {
      role, started: false,
      c, sim: 0, risk: c.risk.start, anx: c.companion.start, stage: 0, done: new Map(), effects: [], jobs: [], tests: {}, facts: new Set(), exam: new Set(),
      chat: [], log: [], riskLog: [[0, c.risk.start]], riskLogAt: 0, paintAt: -1, bpAt: 0, bpTime: 0, bp: ['--', '--'], tempKnown: false, utt: 0, turns: 0,
      comp: { lastTurn: -9, lastAt: -9, count: 0, asked: null, addressed: 0, used: new Set(), extra: 0, angry: false, ignored: 0, procs: 0, unheard: 0, nurseStep: false, heardTurn: 0, gen: 0, outUntil: 0, explainedTurn: -9 }, busyTurn: -9, comm: { introduced: false, explained: false, empathy: false, consent: false, rude: 0, jargon: 0 },
      harms: [], harmed: new Set(), reacted: false, caught: [], pending: null, queue: [], wrongDoses: [], unneeded: [], lateTests: [], askedNo: 0, hint: -1, hints: 0, helps: 0, readAsks: 0, over: false, outcome: null, resolved: false,
      topStage: 0, anxTop: c.companion.start, vtNow: false, vtAt: null, shockedAt: null, anaph: null, draft: null,
      mods: [], improved: 0, nudged: false, collect: null, resp: null, saidBy: new Set(), holdAsked: false,
      paused: false // phase8 2026-11-07: true while the briefing is open; the clock stands still
    };
    if (role === 'nurse') { E.readAsks = 3; E.nurse = newNurseState(c); }
    recFilter = 'all'; recQuery = ''; recView = 'order';
    if ($('er-rec-q')) $('er-rec-q').value = '';
    buildRecords();
    if ($('er-records')) $('er-records').classList.remove('is-open');
    chain = Promise.resolve();
    $('er-feed').innerHTML = '';
    $('er-debrief').hidden = true;
    $('er-sheet').hidden = true;
    $('er-input').disabled = false;
    $('er-input').value = '';
    ['er-send', 'er-test', 'er-end'].forEach(x => { $(x).disabled = false; });
    const p = c.patient;
    $('er-bed').textContent = c.bed;
    $('er-who').textContent = `${p.name}، ${p.age} سنة`;
    document.querySelector('.er-p[data-who="c"] b').textContent = c.companion.rel;
    document.querySelector('.er-p[data-who="n"] b').textContent = c.nurse.name;
    document.querySelector('.er-p[data-who="p"] b').textContent = p.name;
    if (NM()) nurseChips();
    else if (prevNurse) { document.querySelector('.er-p[data-who="d"] b').textContent = 'المشرف'; const np = document.querySelector('.er-p[data-who="n"]'); if (np && np.dataset) delete np.dataset.out; }
    if ($('er-ord')) { $('er-ord').hidden = true; if ($('er-ord-list')) $('er-ord-list').innerHTML = ''; }
    if ($('er-test') && $('er-test').dataset) $('er-test').dataset.badge = '';
    $('er-v-bp').textContent = '--/--';
    $('view-er').dataset.rhythm = '';
    // phase8 2026-11-07: on a real page the start briefing says this, so the chat does not repeat it.
    if (!REAL) sys(NM() ? 'أنت ممرض/ة الطوارئ المسؤول/ة عن السرير. قيّم المريض، وراقب المونيتور، واتصل بالطبيب عند الحاجة، ونفّذ أوامره، وسلّم الحالة بصيغة SBAR.' : 'أنت الطبيب المقيم في الطوارئ. تكلم مع الموجودين، واكتب أوامرك وأدويتك وجرعاتها، واطلب الفحوصات، وسلّم الحالة عندما تنتهي.');
    if (api === 'off' && location.protocol !== 'file:') { apiNoted = true; sys(OFFLINE_NOTE); }
    sys(p.arrival);
    person('p', p.opening);
    nurse(c.nurse.handoff);
    if (NM()) {
      // The instructor triaged the patient: she hands over and stays behind the trainee. The doctor is elsewhere.
      person('d', c.nurse.handoff);
      const F = E.nurse.sex === 'F';
      sys('سلّمتك المشرفة ' + c.nurse.name + ' المريض، وستبقى خلفك تعلّمك. ' + (F ? 'الطبيبة المقيمة ' : 'الطبيب المقيم ') + E.nurse.doc + (F ? ' مشغولة بمريض آخر؛ اتصل بها حين تحتاجها.' : ' مشغول بمريض آخر؛ اتصل به حين تحتاجه.'));
    }
    if (c.companion.lines.enter) {
      const x = lineOf(pickOf(c.companion.lines.enter));
      person('c', x);
      E.comp.used.add(x); E.comp.lastTurn = 0; E.comp.lastAt = 0;
    }
    paint();
    last = performance.now();
    // phase8 2026-11-07: while the briefing is open (E.paused) the loop only keeps `last` current, so time does not jump on resume.
    const loop = now => { if (!E || E.over) return; if (E.paused) last = now; else if (!document.hidden && !$('view-er').classList.contains('hidden')) tick(now); else last = now; tickId = requestAnimationFrame(loop); };
    tickId = requestAnimationFrame(loop);
    if (!showBrief()) $('er-input').focus();
  }

  /* ---------- phase8 2026-11-07: the start briefing ---------- */
  // What to do, who is in the room and the trainee's role, from the case file and the track. Never the diagnosis
  // and never which tests are indicated. Real pages only: the Node harness never sees it.
  function briefTrack() {
    try {
      const u = (typeof authState !== 'undefined' && authState.user) || null;
      return u && typeof nbTrackOf === 'function' ? nbTrackOf(u) : null;
    } catch (e) { return null; }
  }
  // nurse mode 2026-11-07: the role switch, usable only before the session starts.
  function roleSwitch() {
    const nurseOn = E.role === 'nurse';
    if (!canSwitch()) return `<p class="er-role-now"><b>دوري في الغرفة:</b> ${nurseOn ? 'ممرض/ة' : 'طبيب'}. <span class="er-small">يتغيّر الدور قبل بدء الجلسة فقط.</span></p>`;
    return `<div class="er-role-sw" role="radiogroup" aria-label="دوري في الغرفة"><span class="er-role-l">دوري في الغرفة:</span><button type="button" role="radio" data-role="doctor" aria-checked="${!nurseOn}" tabindex="${nurseOn ? -1 : 0}">طبيب</button><button type="button" role="radio" data-role="nurse" aria-checked="${nurseOn}" tabindex="${nurseOn ? 0 : -1}">ممرض/ة</button><span class="er-small">يتغيّر الدور قبل بدء الجلسة فقط.</span></div>`;
  }
  function briefHtmlNurse() {
    const c = E.c, p = c.patient, comp = c.companion || {}, nurseName = (c.nurse && c.nurse.name) || '', N = E.nurse, F = N.sex === 'F';
    return `<div class="er-pane er-brief" role="dialog" aria-modal="true" aria-labelledby="er-brief-h" aria-describedby="er-brief-now">
      <header class="er-brief-top">
        <h3 id="er-brief-h">حالتك في غرفة الطوارئ</h3>
        <p class="er-brief-who"><span class="er-brief-bed">${esc(c.bed)}</span><b>${esc(p.name)}</b>، ${esc(p.age)} سنة</p>
      </header>
      ${roleSwitch()}
      <section class="er-brief-now" id="er-brief-now"><h4>ما تعرفه الآن</h4><p>${esc(p.arrival)}</p></section>
      <section><h4>من معك في الغرفة</h4><ul class="er-brief-people">
        <li><i data-who="p" aria-hidden="true"></i><span><b>المريض</b>: ${esc(p.name)}</span></li>
        ${comp.name ? `<li><i data-who="c" aria-hidden="true"></i><span><b>المرافق</b>: ${esc(comp.name)}${comp.rel ? ` (${esc(comp.rel)})` : ''}</span></li>` : ''}
        <li><i data-who="d" aria-hidden="true"></i><span><b>المشرفة التمريضية ${esc(nurseName)}</b>: استلمت المريض في الفرز وسلّمتك إياه، وتبقى خلفك؛ تسألها إذا احترت، وتعلّمك أولويات التمريض، ولا تعطيك التشخيص.</span></li>
        <li><i data-who="n" aria-hidden="true"></i><span><b>${F ? 'الطبيبة المقيمة' : 'الطبيب المقيم'} ${esc(N.doc)}</b>: ${F ? 'مشغولة بمريض آخر، وترد على الهاتف أو تحضر حين تتصل بها. هي من تعطي الأوامر الطبية.' : 'مشغول بمريض آخر، ويرد على الهاتف أو يحضر حين تتصل به. هو من يعطي الأوامر الطبية.'}</span></li>
      </ul></section>
      <section><h4>دورك</h4><p>أنت ممرض/ة الطوارئ المسؤول/ة عن هذا السرير. تقيّم المريض بطريقة ABCDE، وتراقب المونيتور، وتتعرّف على التدهور، وتبلّغ الطبيب برسالة SBAR واضحة، وتنفّذ أوامره بأمان، ثم تسلّم الحالة.</p></section>
      <section class="er-brief-scope"><h4>نطاق صلاحياتك <small>(حسب بروتوكولات الطوارئ المعتادة، وقد تختلف بين المستشفيات)</small></h4>
        <p><b>تستطيع وحدك:</b> التقييم الكامل والقصة ومنها الحساسية والأدوية، قياس العلامات الحيوية وإعادتها، وضعية المريض، الأكسجين عند انخفاض الإشباع وفق البروتوكول، تركيب كانيولا، سحب عينات الدم، تسجيل تخطيط القلب، سكر الدم الشعري، ذروة الجريان، والاتصال بالطبيب أو طلب فريق الإنعاش.</p>
        <p><b>تحتاج أمر طبيب:</b> الأدوية، السوائل الوريدية، الفحوصات المخبرية، والتصوير. (بعض المستشفيات تعتمد أوامر دائمة لأدوية معيّنة؛ هذه الغرفة تطلب أمراً لكل دواء.)</p>
      </section>
      <section><h4>ما المطلوب منك</h4><ol class="er-brief-steps">
        <li>استلم المريض وقيّمه بطريقة ABCDE، واسأل عن الحساسية والأدوية.</li>
        <li>قِس العلامات الحيوية وأعد قياسها، وانتبه لأي تدهور.</li>
        <li>ابدأ ما يسمح به نطاقك دون انتظار.</li>
        <li>اتصل بالطبيب حين تستدعي الحالة ذلك، وقدّم له رسالة SBAR بالأرقام.</li>
        <li>نفّذ أوامر الطبيب من قائمة «أوامر الطبيب»، وتحقق من الحساسية قبل كل دواء، وأعد التقييم بعد كل تدخل.</li>
        <li>حين تنتهي اضغط «سلّم الحالة» واكتب التسليم بصيغة SBAR، ثم اقرأ تقريرك.</li>
      </ol></section>
      <section class="er-brief-tips"><h4>نصائح قصيرة</h4><ul>
        <li>اكتب ما تفعله بصيغة المتكلم: «بقيس الضغط»، «ركّبت كانيولا»، «بتصل بالدكتور».</li>
        <li>نادِ الشخص باسمه ليعرف أنك تكلمه.</li>
        <li>تظهر قائمة أوامر الطبيب في لوحة الفحوصات بعد أن يعطيك أوامره.</li>
        <li>تسير ساعة الحالة مع الوقت الحقيقي، لكن أثر العلاج وتغيّر حالة المريض يظهران أسرع من الواقع.</li>
        <li>زر «عرض التعليمات» أعلى الغرفة يعيد هذه النافذة متى شئت.</li>
      </ul></section>
      <p class="er-small">للتدريب فقط. الحالات لم يراجعها طبيب بعد.</p>
      <footer class="er-pane-f er-brief-f"><button type="button" class="p" id="er-brief-go">ابدأ الجلسة</button></footer>
    </div>`;
  }
  function briefHtml() {
    if (NM()) return briefHtmlNurse();
    const c = E.c, p = c.patient, comp = c.companion || {}, nurseName = (c.nurse && c.nurse.name) || '';
    const role = briefTrack() === 'nursing'
      ? 'أنت تتولى في هذه الغرفة دور المسؤول عن الحالة (يناديك الفريق «دكتور»)، وتركيزك: التقييم المنهجي ABCDE، قراءة المونيتور والإنذار المبكر، السؤال عن الحساسية والأدوية قبل أي دواء، ومتابعة الاستجابة بعد كل إجراء، ثم تسليم الحالة بصيغة SBAR.'
      : 'أنت الطبيب المقيم المناوب، والحالة مسؤوليتك من الاستقبال حتى التسليم.';
    return `<div class="er-pane er-brief" role="dialog" aria-modal="true" aria-labelledby="er-brief-h" aria-describedby="er-brief-now">
      <header class="er-brief-top">
        <h3 id="er-brief-h">حالتك في غرفة الطوارئ</h3>
        <p class="er-brief-who"><span class="er-brief-bed">${esc(c.bed)}</span><b>${esc(p.name)}</b>، ${esc(p.age)} سنة</p>
      </header>
      ${roleSwitch()}
      <section class="er-brief-now" id="er-brief-now"><h4>ما تعرفه الآن</h4><p>${esc(p.arrival)}</p></section>
      <section><h4>من معك في الغرفة</h4><ul class="er-brief-people">
        <li><i data-who="p" aria-hidden="true"></i><span><b>المريض</b>: ${esc(p.name)}</span></li>
        ${comp.name ? `<li><i data-who="c" aria-hidden="true"></i><span><b>المرافق</b>: ${esc(comp.name)}${comp.rel ? ` (${esc(comp.rel)})` : ''}</span></li>` : ''}
        <li><i data-who="n" aria-hidden="true"></i><span><b>الممرضة${nurseName ? ' ' + esc(nurseName) : ''}</b>: تنفّذ طلباتك وتقرأ لك المونيتور.</span></li>
        <li><i data-who="d" aria-hidden="true"></i><span><b>المشرف</b>: تسأله إذا احترت، ولا يعطيك التشخيص.</span></li>
      </ul></section>
      <section><h4>دورك</h4><p>${esc(role)}</p></section>
      <section><h4>ما المطلوب منك</h4><ol class="er-brief-steps">
        <li>اسأل المريض والمرافق عن القصة والأعراض والحساسية والأدوية. اكتب بالعربية أو باللهجة كما تتكلم عادة.</li>
        <li>افحص المريض، واطلب الفحوصات من لوحة الفحوصات (زر «الفحوصات» على الهاتف) أو بالكتابة في المحادثة.</li>
        <li>اطلب العلاج من الممرضة باسم الدواء والجرعة والطريق.</li>
        <li>راقب المونيتور واستجابة المريض بعد كل إجراء.</li>
        <li>حين تنتهي اضغط «سلّم الحالة» واكتب التشخيص والوجهة والتسليم بصيغة SBAR.</li>
        <li>اقرأ تقريرك في النهاية لتعرف ما أحسنت فيه وما يجب أن يتغير.</li>
      </ol></section>
      <section class="er-brief-tips"><h4>نصائح قصيرة</h4><ul>
        <li>نادِ الشخص باسمه ليعرف أنك تكلمه.</li>
        <li>تسير ساعة الحالة مع الوقت الحقيقي، لكن أثر العلاج وتغيّر حالة المريض يظهران أسرع من الواقع.</li>
        <li>الفحص خارج الاستطباب يظهر بالأصفر، وستُسأل عن تبريره عند التسليم.</li>
        <li>زر «عرض التعليمات» أعلى الغرفة يعيد هذه النافذة متى شئت.</li>
      </ul></section>
      <p class="er-small">للتدريب فقط. الحالات لم يراجعها طبيب بعد.</p>
      <footer class="er-pane-f er-brief-f"><button type="button" class="p" id="er-brief-go">ابدأ الجلسة</button></footer>
    </div>`;
  }
  function briefKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeBrief(); return; }
    // Focus stays inside the dialog: Tab cycles over the role switch (while it can be used) and the start button.
    if (e.key === 'Tab') {
      e.preventDefault();
      const w = $('er-brief'), sw = w ? [...w.querySelectorAll('[data-role]')] : [], go = $('er-brief-go');
      const stops = [...(sw.length ? [sw.find(b => b.getAttribute('aria-checked') === 'true') || sw[0]] : []), go].filter(Boolean);
      const i = stops.indexOf(document.activeElement);
      const next = stops[(i + (e.shiftKey ? stops.length - 1 : 1)) % stops.length] || go;
      if (next) next.focus();
      return;
    }
    // The arrow keys move inside the radio group.
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.target && e.target.dataset && e.target.dataset.role) {
      e.preventDefault();
      setRole(e.target.dataset.role === 'nurse' ? 'doctor' : 'nurse');
      const b = $('er-brief') && $('er-brief').querySelector('[data-role][aria-checked="true"]');
      if (b) b.focus();
    }
  }
  function showBrief() {
    if (!REAL || !E) return false;
    let w = $('er-brief');
    if (!w) {
      w = document.createElement('div');
      w.id = 'er-brief';
      w.className = 'er-sheet er-brief-wrap';
      (document.querySelector('#view-er .er-room') || $('view-er')).appendChild(w);
      w.addEventListener('keydown', briefKey);
    }
    w.innerHTML = briefHtml();
    w.hidden = false;
    if (!E.over) E.paused = true;
    $('er-brief-go').onclick = closeBrief;
    w.querySelectorAll('[data-role]').forEach(b => { b.onclick = () => { const v = b.dataset.role; if (setRole(v)) { const x = $('er-brief').querySelector('[data-role="' + v + '"]'); if (x) x.focus({ preventScroll: true }); } }; });
    const pane = w.querySelector('.er-brief');
    if (pane) pane.scrollTop = 0;
    $('er-brief-go').focus({ preventScroll: true });
    return true;
  }
  function closeBrief() {
    const w = $('er-brief');
    if (w) w.hidden = true;
    if (!E) return;
    E.paused = false;
    if (!E.over && $('er-sheet').hidden) $('er-input').focus();
  }
  const briefOpen = () => { const w = REAL && $('er-brief'); return !!(w && !w.hidden); };

  function mount() {
    const v = $('view-er');
    if (v.dataset.ready) return;
    v.dataset.ready = '1';
    $('er-form').addEventListener('submit', e => { e.preventDefault(); const i = $('er-input'); send(i.value); i.value = ''; });
    $('er-test').addEventListener('click', () => toggleRecords());
    const rec = $('er-records');
    /* phase8 2026-11-07: the investigations centre's header, its two views (order | log) and the
       «عرض التعليمات» button beside the clock. Injected here because index.html is not edited by er.js work. */
    if (REAL) {
      const hb = rec.querySelector('.er-rec-h b');
      if (hb) hb.textContent = 'طلب الفحوصات والصور والتخطيط';
      rec.setAttribute('aria-label', 'طلب الفحوصات والصور والتخطيط');
      const head = rec.querySelector('.er-rec-h');
      if (head && !$('er-rec-tabs')) {
        const tabs = document.createElement('div');
        tabs.id = 'er-rec-tabs';
        tabs.className = 'er-rec-tabs';
        tabs.setAttribute('role', 'tablist');
        tabs.setAttribute('aria-label', 'طلب الفحوصات أو سجلها');
        tabs.innerHTML = '<button type="button" role="tab" data-v="order" aria-selected="true">طلب</button><button type="button" role="tab" data-v="log" id="er-rec-logtab" aria-selected="false">السجل (0)</button>';
        head.after(tabs);
      }
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
      const list = $('er-rec-list');
      if (list && !$('er-rec-log')) {
        const log = document.createElement('div');
        log.id = 'er-rec-log';
        log.className = 'er-rec-log';
        list.after(log);
      }
      rec.dataset.view = 'order';
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
      // phase8 2026-11-07: the view tabs and the log rows.
      const ord = e.target.closest('[data-ord]');
      if (ord) { const [k, id] = ord.dataset.ord.split(':'); execOrder(k, id); return; }
      const v = e.target.closest('[data-v]'), go = e.target.closest('[data-go]');
      if (v) { setRecView(v.dataset.v); return; }
      if (go) { goResult(go.dataset.go); return; }
      const f = e.target.closest('[data-f]'), t = e.target.closest('[data-t]');
      if (f) { recFilter = f.dataset.f; buildRecords(); }
      else if (t) panelTest(t.dataset.t);
      else if (e.target.closest('#er-rec-x')) toggleRecords(false);
    });
    $('er-rec-q').addEventListener('input', e => { recQuery = e.target.value; buildRecords(); });
    $('er-end').addEventListener('click', openEnd);
    $('er-sheet').addEventListener('keydown', e => { if (e.key === 'Escape') { $('er-sheet').hidden = true; $('er-input').focus(); } });
  }

  // Only the offline path needs the act model, so the room never waits for it.
  const loadAct = () => fetch('data/er-act.json', { signal: timeout(4000) }).then(r => r.json()).then(m => { ACT = { ...m, index: new Map(m.grams.map((g, i) => [g, i])), bias: m.bias.map(x => x / 100), w: m.w.map(r => r.map(x => x / 100)) }; }).catch(e => console.warn('er-act', e));
  const load = () => D ? Promise.resolve() : (loading = loading || fetch('data/er-cases.json').then(r => { if (!r.ok) throw new Error('cases'); return r.json(); }).then(j => { D = j; }).catch(e => { loading = null; throw e; }));

  async function open() {
    if (typeof navigateTo === 'function' && navigateTo('er') === false) return;
    // Review fix 2026-11-07: a role switched in one session's briefing does not carry into the next entry
    // from home; the track decides again. (The Node harness sets the role itself, so only a real page resets.)
    if (REAL) roleWanted = null;
    mount();
    // Sound needs the click that brought the student here.
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!ac && Ctx) ac = new Ctx();
    if (ac && ac.resume) ac.resume();
    const sound = document.querySelector('.er-mon .nb-mon-sound');
    if (sound && sound.getAttribute('aria-pressed') !== 'true') sound.click();
    try {
      await Promise.all([load(), ping()]);
      if (!ACT) loadAct();
      if (!E || E.over) begin(new URLSearchParams(location.search).get('case') || undefined);
      else if (briefOpen()) $('er-brief-go').focus(); // phase8 2026-11-07
      else $('er-input').focus();
    } catch (e) {
      console.error(e);
      $('er-feed').innerHTML = '<div class="er-msg k-sys"><p>تعذّر تحميل الحالات. تحقق من الاتصال ثم أعد المحاولة.</p></div>';
    }
  }

  window.nbOpenER = open;
  // The last report can be read again until the next case starts.
  window.nbErReport = () => {
    if (!lastReport || lastReport !== E || !E.over || typeof navigateTo !== 'function') return false;
    navigateTo('er');
    $('er-debrief').hidden = false;
    return true;
  };
  // Test hook for the browser checks.
  window.__nbER = { begin: id => begin(id), beginAs: (id, o) => begin(id, o), set role(v) { roleWanted = v === 'nurse' ? 'nurse' : v === 'doctor' ? 'doctor' : null; }, get role() { return E && E.role; }, get nurse() { return E && E.nurse; }, setRole, execOrder, gradeSbar, nurseAct, nurseTest, strip: forNurse, releaseOrders, buildOrders, escBy, send, orderTest, panelTest, buildRecords, modsNow, live, allergicTo, readAct, get E() { return E; }, get D() { return D; }, set api(v) { api = v; apiRetryAt = v === 'off' ? Infinity : 0; if (v === 'off') loadFind(); }, get api() { return api; }, readFinding, doseCheck, doseOf, doseIn, doseBad, jump(min) { if (E) E.sim += min; }, localRead, end: conclude, score, setRisk(r) { E.risk = r; },
    /* phase8 2026-11-07 */ justGood, offInd, showBrief, closeBrief, buildLog, setRecView, get real() { return REAL; } };
})();
