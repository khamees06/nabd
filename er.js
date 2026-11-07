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

  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  // Marks only: U+0660-0669 sit inside the mark range, and those are digits.
  const norm = s => String(s).replace(/[ً-ٰٟـ]/g, '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[؟?!.,،:؛()"'«»\-_/]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pickOf = list => list[Math.floor(Math.random() * list.length)];
  const testOf = id => D.tests.find(t => t.id === id);
  const actOf = id => D.actions.find(a => a.id === id);

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
    $('er-v-bpt').textContent = 'قبل ' + Math.floor(E.sim - E.bpTime) + ' د';
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
    const dt = Math.min(2, (now - last) / 1000);
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
    // The patient is steady: the supervisor asks whether he is ready to hand over, once.
    if (!E.nudged && E.risk <= E.c.risk.watch - 6 && netRate() <= 0 && !keyMissing().length && E.done.size >= 3 && E.sim > 2) {
      E.nudged = true;
      later(0.2, () => person('d', pickOf(['الأرقام استقرت. بقي إشي بدك تعمله؟ ولا جاهز تسلّم؟', 'تمام، الوضع أحسن. شو الخطة، والوجهة؟'])));
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
      person('d', hold.ask || 'الأرقام ثابتة بس ما تحسنت. شو الخطوة الناقصة؟');
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
    if (E.vtNow && E.vtAt === null) E.vtAt = E.sim;
    if (s >= 2) { E.bpAt = 0; paint(); }
    const L = E.c.stageLines[STAGES[s]] || {};
    log('stage', ['', 'بدأ التدهور', 'تدهور واضح', 'حالة حرجة'][s]);
    if (s >= 2) alert(s === 3 ? 'إنذار حرج: ' + worst() : 'إنذار: ' + worst());
    const told = nurseStage(L);
    if (told) nurse(told);
    if (L.patient) later(0.15, () => person('p', pickOf(L.patient)));
    // The relative answers a patient who calls for them, unless they are waiting outside.
    if (L.companion && !E.comp.used.has(L.companion) && E.sim >= E.comp.outUntil) {
      E.comp.used.add(L.companion);
      E.comp.lastAt = Math.max(E.comp.lastAt, E.sim + 0.3);
      later(0.3, () => { if (E.sim >= E.comp.outUntil) person('c', L.companion); });
    }
    E.anx = clamp(E.anx + 14, 0, 100);
    director(s >= 2 ? 'alarm' : 'worse');
    if (s >= 2) coach(s === 3 ? 'critical' : 'urgent');
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
  const LABEL = () => ({ p: E.c.patient.name, c: E.c.companion.name, n: 'الممرضة ' + E.c.nurse.name, d: 'المشرف', me: 'أنت' });
  // Latin runs keep their own order inside Arabic: "12-lead ECG", "5 mg".
  const bidi = s => String(s == null ? '' : s).split(/([A-Za-z0-9][A-Za-z0-9 .,-/%+]*[A-Za-z0-9%]|[A-Za-z0-9])/).map((x, i) => (i % 2 ? `<bdi dir="ltr">${esc(x)}</bdi>` : esc(x))).join('');
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
    say(who, text);
    E.chat.push({ r: who === 'me' ? 's' : who === 'p' ? 'p' : who === 'c' ? 'c' : who === 'n' ? 'n' : 'd', t: text });
    E.utt++;
  }
  const nurse = text => person('n', text);
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
        body: JSON.stringify({ case: E.c.id, risk: E.risk, anx: E.anx, state: stateNow(), history: E.chat.slice(-14), ...body })
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
  const ping = () => (api === 'off' ? Promise.resolve() : fetch(API + '?ping=1', { signal: timeout(2500) }).then(r => { if (!r.ok) throw new Error('ping'); }).catch(() => { api = 'off'; apiRetryAt = Date.now() + 60000; loadFind(); }));

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

  const hasAny = (t, kw) => kw.some(k => { const n = norm(k); return n && (' ' + t + ' ').includes(n.length < 4 ? ' ' + n + ' ' : n); });
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
  function offlineAnswer(text, t, { actions, tests, why, toSup, toComp, toNurse }) {
    const p = E.pending;
    if (!p) return 'na';
    const word = readAct(text);
    const asks = /[؟?]/.test(text);
    if (p.type === 'unsafe') {
      // "Not sure, but give it": the last clause decides.
      const clause = t.split(/ (?:بس|لكن) /).pop();
      if (/(?:^| )ليش لا(?: |$)/.test(clause)) return 'wrong';
      if (toSup || toComp || asks) return 'na';
      if (/ما بدي (?:اوقف|اغير|الغي)|علي مسووليتي/.test(clause)) return 'wrong';
      if (STOP.test(clause) || actions.some(a => a.id !== p.a.id || (p.allergic && !allergicTo(a, E.c.care[a.id] || {}, text)))) return 'good';
      if (tests.length) return 'na';
      const plain = clause.split(' ').length <= 4 && /^(?:[اتنب]?عطي\S*|كمل\S*|متاكد|اكيد|نعم|ايوا|ايوه|اه|طبعا|yes|sure)(?: |$)/.test(clause);
      return plain ? 'wrong' : word === 'no' || word === 'refuse' ? 'good' : 'na';
    }
    const social = ['greeting', 'wish', 'thanks'].includes(word) || (word === null && /^(?:مرحب|اهل|هلا|السلام|صباح|مساء|شكر|يعطيك|طيب|لا$|ما بعرف|مش عارف)/.test(t));
    if (p.type === 'dose') {
      if (p.sug && ACCEPT.test(t)) return 'good';
      if (toSup || toComp || social || word === 'unsure' || /^(?:ما بعرف|مش عارف|مش متذكر|ما بتذكر|مش متاكد)/.test(t)) return 'na';
      if (/(?:^| )(?:لا ت\S*|ما ت\S*|بلاش|don t|hold|skip)(?: |$)/.test(t)) return 'withdraw';
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

  // A drug word is not an order: "بلاش اسبرين" and "بتاخدي اسبرين؟" must never give the drug.
  const NEGATED = /(?:^| )[وف]?(?:لا|ما|مش|مو|بلاش|بدون|ممنوع|غير|مستحيل|اياك\S*|اوعك|اوعي|حذار|نتجنب|تجنب\S*|نبعد|اوقف\S*|نوقف|وقف\S*|شيل\S*|الغي\S*|avoid|no|not|never|dont|don t|without|stop|hold|لسا ما)(?: \S+){0,2}$|(?:^| )(?:بدل|بدال|instead of)(?: \S+)?$/;
  // Asking the relative to step out or wait by the door.
  const STEP_OUT = /(?:^| )(?:برا|بره|عالباب|الباب|اطلع\S*|استن\S*|تستن\S*|ابعد\S*|وسع\S*)(?: |$)/;
  const ORDER = /(?:^| )[وف]?(?:[اتنبي]?عط[يو]\S*|اعط\S*|حط\S*|ركب\S*|علق\S*|ابدا\S*|بلش\S*|جيب\S*|جهز\S*|شغل\S*|اطلب\S*|اسحب\S*|قيس\S*|افحص\S*|شيك\S*|عيد\S*|نادي\S*|اتصل\S*|ارفع\S*|اعمل\S*|سوي\S*|فعل|فعلي(?:ه|ها)?|فعلو\S*|بدي|بدنا|لازم|خلينا|يلا|give|start|hang|push|need|order|call|get|put|run|draw|repeat|check|activate)(?: |$)/;
  const HISTORY = /^(?:هل|شو|ليش|كيف|قديش|كم|وين|مين|متي|امتي|لما|بتاخد\S*|بياخد\S*|بتوخذ\S*|بيوخذ\S*|اخذت\S*|اخدت\S*|عملت\S*|عندك|عنده|عندها|في عند\S*|جربت\S*|استعملت\S*|بتستعمل\S*|بيستعمل\S*|بتستخدم\S*|بتتحسس\S*|بيتحسس\S*|صار معك)(?: |$)/;
  const ASKS_ABOUT = /(?:بدي (?:اعرف|اسالك|اتاكد)|لازم اعرف|خلينا نشوف|شو صار|(?:^| )(?:اعطوك|اعطوه|اعطوها|اعطاه|اعطيتي|اخذتي|اخدتي)(?: |$))/;
  // Every mention, from the start of its word, so "ولا تعطيه بنسلين" is seen whichever drug comes first.
  const mentionsOf = (t, kw) => {
    const p = ' ' + t + ' ', out = [];
    kw.forEach(k => {
      const n = norm(k);
      if (!n) return;
      const w = n.length < 4 ? ' ' + n + ' ' : n;
      for (let i = p.indexOf(w); i >= 0; i = p.indexOf(w, i + 1)) out.push(n.length < 4 ? i + 1 : p.lastIndexOf(' ', i) + 1);
    });
    return out;
  };
  const freeAt = (t, i) => !NEGATED.test((' ' + t + ' ').slice(0, i).trim());
  // The same word means different things; these are the ones trainees actually type.
  // Tests a collision rule adds although none of their own words were typed.
  let FORCED = new Set();
  function collisions(t, ids) {
    FORCED = new Set();
    if (/مضاد (?:صفيحات|تخثر|حموض)/.test(t) && !/مضاد حيوي/.test(t)) ids.delete('antibiotics');
    if (/قسطره بول|foley|فولي/.test(t)) { ids.delete('cath_lab'); ids.delete('urine'); }
    else ids.delete('foley');
    if (/رينجر|ringer/.test(t)) ids.delete('lactate');
    if (/brain|دماغ|(?:^| )(?:ل?ل?راس|الراس)(?: |$)/.test(t)) ids.delete('ctpa');
    if (/septic|cardiogenic|انتاني|تاقي|anaphyl/.test(t)) ids.delete('shock');
    if (/nasal|نيزل/.test(t)) ids.delete('iv_access');
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
    if (!ORDER.test(t) && !/defib|ديفيب|ديفب|cardiovert/.test(t) && t.split(' ').length > 2) ids.delete('shock');
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

  function localRead(text) {
    const t = norm(text).replace(/(^| )(?:وال|بال|لل|ال|و|ب)(?=[a-z])/g, '$1'), c = E.c;
    let facts = c.facts.filter(f => hasAny(t, f.kw)).map(f => f.id).filter(id => id !== 'allergy' || /حساس|تحسس|allerg/.test(t)).slice(0, 3);
    // "عنده حساسية من دوا؟" is the allergy question, not the medicines one.
    if (/حساس|تحسس|allerg/.test(t) && facts.includes('allergy')) facts = ['allergy'];
    let exam = c.exam.filter(f => hasAny(t, f.kw)).map(f => f.id);
    const verb = ORDER.test(t);
    const asking = /[؟?]/.test(text) ? !/^(?:[اتن]?عط|حط|ركب|علق|ابدا|بلش|جيب|جهز|شغل|قيس|نادي|give|start)/.test(t) || ASKS_ABOUT.test(t) : (HISTORY.test(t) && !verb) || ASKS_ABOUT.test(t);
    const named = list => { const ids = collisions(t, new Set(list.filter(a => hasAny(t, a.kw)).map(a => a.id))); const keep = FORCED; const out = list.filter(a => ids.has(a.id)); FORCED = keep; return out; };
    const stated = named(D.actions);
    const forbids = !asking && stated.some(a => { const at = mentionsOf(t, a.kw); return at.length && !at.some(i => freeAt(t, i)); });
    const said = list => (asking ? [] : named(list).filter(a => FORCED.has(a.id) || mentionsOf(t, a.kw).some(i => freeAt(t, i))));
    const short = t.split(' ').length <= 3;
    const found = said(D.actions).map(a => { const dose = clauseDose(text, a.kw, said(D.actions).length > 1); return { a, dose }; });
    // A long sentence with no verb is talk about the drug: the nurse checks instead of acting.
    const drugs = found.filter(x => verb || x.dose || short);
    const unclear = found.find(x => !drugs.includes(x));
    const strict = a => mentionsOf(t, a.kw).some(i => ORDER.test((' ' + t + ' ').slice(0, i).trim().split(' ').slice(-3).join(' ')));
    const actions = drugs.map(({ a, dose }) => ({ id: a.id, agent: '', dose, bare: !dose && !strict(a) }));
    // Keywords missed it: the trained reader looks for a finding this patient's record answers.
    const questionLike = /[؟?]/.test(text) || HISTORY.test(t) || / (?:شو|وين|قديش|كم|متي|امتي|ليش|هل|كيف) /.test(' ' + t + ' ') || /^(?:افحص|اسمع|شوف|بدي اسمع|خليني افحص|بدي افحص)/.test(t);
    if (questionLike && !facts.length && !exam.length && !actions.length) {
      const hit = (c.findMap || {})[readFinding(text)];
      if (hit && c.facts.some(f => f.id === hit)) facts = [hit];
      else if (hit && c.exam.some(f => f.id === hit)) exam = [hit];
    }
    const why = text.match(/(عشان|لان|لأن|بسبب|لاستبعاد|لنفي|rule out|r\/o).*/i);
    const tests = said(D.tests).map(x => ({ id: x.id, reason: why ? why[0] : '', reason_ok: why ? 'ungraded' : 'none' }));
    const toSup = /(يا مشرف|يا استاذ|يا دكتور|شو رايك|ساعدني|مش عارف|محتار|شو اعمل)/.test(t);
    // "The numbers?" is asked of the nurse, who reads the monitor, never of the patient.
    const toNurse = new RegExp('(يا ممرض|يا سستر|يا ' + norm(c.nurse.name) + '|اعطي|ركبي|حطي|قيسي|جهزي|الارقام|ارقامه|ارقامها|علامات حيويه|vitals)').test(t);
    const toComp = /(يا حجه|يا حجي|يا خالتي|يا خاله|يا ست |يا عمي|اطمني|اطمن|هدي حال|ولا يهمك|لازم اشتغل|بعد اذنك|بنتك|ابوك|جوزك|زوجك|مرتك|زوجتك|معك حق|فهمت عليك|ما تخاف|ما تخافي|لا تخاف|لا تخافي|لا تقلق|يا عمو|عمو)/.test(t) || t.includes('يا ' + norm(c.companion.name)) || t.includes(norm(c.companion.name) + ' ');
    // Keywords go first: the model only speaks for a message nothing else could read.
    const act = !facts.length && !exam.length && !actions.length && !tests.length ? readAct(text) : null;
    const social = ['greeting', 'wish', 'thanks'].includes(act);
    const explaining = toComp && /(?:^| )و?(?:رح|راح|بدنا|هسا|ح) ن\S+/.test(t);
    const talkOnly = toComp && (!verb || explaining);
    const to = talkOnly || (toComp && !actions.length) ? 'companion' : toSup && !social ? 'supervisor' : toNurse || actions.length || tests.length ? 'nurse' : 'patient';
    // "Take the adrenaline off" names a drug without ordering it.
    const stopped = E.pending && E.pending.type === 'unsafe' && STOP.test(t) && !/بدل|badal|instead/.test(t);
    // A reason or a reading that mentions a drug is not an order for it.
    // Naming a drug with a dose over a reading question is an order, not a reading.
    const answering = E.pending && ['reason', 'interpret'].includes(E.pending.type) && !toNurse && !verb && !drugs.some(x => x.dose);
    const opens = /شو (اللي )?(جابك|صار معك|صاير|مالك|بك|فيك)|احكيلي شو/.test(t);
    const asks = / (شو|وين|قديش|كم|امتي|متي|ليش|هل|ايه|shu)( |$)/.test(' ' + t) && !/شو اخبار/.test(t);
    const small = !asks && (social || (act === null && /^(مرحب|اهلا|هلا|السلام|صباح|مساء)/.test(t)));
    return {
      act, text, forbids, unclear: unclear ? actOf(unclear.a.id).ar : '', typedOrder: (verb || !!doseIn(text)) && !asking,
      to, facts, exam, actions: talkOnly || stopped || answering ? [] : actions, tests: talkOnly ? [] : tests, kind: toSup && !social ? 'help' : actions.length ? 'order' : opens ? 'open' : small ? 'smalltalk' : facts.length ? 'question' : 'other',
      pending_ok: offlineAnswer(text, t, { actions, tests, why, toSup, toComp, toNurse }),
      tone: {
        introduced: /(انا الدكتور|انا دكتور|انا طالب|اسمي|معك الدكتور)/.test(t), empathy: act === 'wish' || /(بفهم|معك حق|حقك|سلامتها|سلامته|لا تخاف)/.test(t),
        rude: /(اسكت|اخرس|اطلع برا|مش شغلك|مالك دخل|غصب)/.test(t), jargon: false,
        explained: toComp && /(رح|عم ن|بنعطي|بنعمل|الوضع|حالتها|حالته)/.test(t), consent: /(بعد اذنك|ممكن اسمع|ممكن افحص|بتسمح)/.test(t),
      }
    };
  }
  function localReply(read) {
    const c = E.c, t = norm(read.text || '');
    if (E.pending && read.pending_ok !== 'na') return null;
    if (read.to === 'supervisor') return pickOf(c.teach);
    const held = read.facts.map(id => c.facts.find(x => x.id === id)).filter(Boolean);
    // A question inside an order is still a question: someone answers it.
    if (held.length) {
      const comp = held.find(x => x.who && x.who !== 'patient'), pat = held.find(x => x.who !== 'companion');
      const f = read.to === 'companion' ? comp || pat : pat || comp;
      read.to = f === pat && !(read.to === 'companion' && f.who === 'both') ? 'patient' : 'companion';
      read.saidFact = f.id;
      return f.say;
    }
    if (read.forbids && !read.actions.length) { read.to = 'nurse'; return 'تمام، ما بعطيه.'; }
    // Telling the family the plan names the treatment; it does not order it.
    if (read.unclear && read.to !== 'companion') { read.to = 'nurse'; return `${read.unclear}؟ بدك إياه؟`; }
    if (read.to === 'nurse' && !read.actions.length && !read.tests.length) {
      return /(ضغط|نبض|اكسجين|ارقام|حراره|تنفس|spo2|bp|hr)/.test(t) ? spokenVitals() + '.' : 'تمام، شو بدك أعمل؟';
    }
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
    // An order nobody could place belongs to the nurse, not to the patient.
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
    E.typedThisTurn = false;
    const my = E;
    // A message still queued when the case ends goes nowhere and costs nothing.
    chain = chain.then(() => (E === my && !E.over ? handle(text) : null)).catch(e => console.error(e));
  }

  async function handle(text) {
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
    const reply = spoken ? (r.held ? pickOf(E.c.teach) : r.reply) : localReply(read);
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
      nurse(open.type === 'unsafe' ? `دكتور، ${nm}: بعطيه ولا لأ؟` : open.type === 'dose' ? (open.tip ? `دكتور، ${nm}: ${open.tip}` : `دكتور، ${nm}: قديش بدك؟`) : 'دكتور، لسا مستنية جوابك على طلبك.');
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
    else if (open && !(open.type === 'interpret' && to === 'companion') && (open.type === 'unsafe' || ![...(read.actions || []), ...(read.tests || [])].some(x => x.id === (open.a ? open.a.id : open.id) && (x.dose || x.reason)))) remind(open);
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
    (read.exam || []).forEach(examine);
    if (line) person(to === 'companion' ? 'c' : to === 'nurse' ? 'n' : to === 'supervisor' ? 'd' : 'p', line);
    if (to === 'supervisor') E.helps++;
    const answered = E.resolved && open ? (open.a ? open.a.id : open.id) : null;
    const swapped = a => open && open.type === 'unsafe' && open.allergic && !allergicTo(a, E.c.care[a.id] || {}, text);
    const once = (x, i, all) => all.findIndex(y => y.id === x.id) === i;
    (read.actions || []).filter(once).filter(a => a.id !== answered || swapped(a)).forEach(a => order(a, text));
    (read.tests || []).filter(once).filter(x => x.id !== answered).forEach(x => orderTest(x.id, x.reason, x.reason_ok));
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
        person(held[2], held[1]);
      } else if (!E.pending || E.pending.type === 'dose') openDoses(first);
    }
    // The senior is standing in the room: asking him is calling him.
    if (to === 'supervisor' && read.kind === 'help' && E.c.care.call_senior && !E.done.has('call_senior')) E.done.set('call_senior', { at: E.sim, last: E.sim, n: 1, dose: '', ok: 'good', amt: 0 });
    E.resolved = false;
    director(to === 'companion' ? 'addressed' : 'turn');
  }

  function examine(id) {
    const x = E.c.exam.find(f => f.id === id);
    if (!x) return;
    const firstTime = !E.exam.has(id);
    E.exam.add(id);
    const out = E.anaph && !E.anaph.treated && x.sayReact ? x.sayReact : E.stage === 3 && x.sayCritical ? x.sayCritical : x.say;
    say('exam', out);
    E.chat.push({ r: 'n', t: 'فحص: ' + out });
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
    nurse(items.length === 1 ? items[0][1] : bundleLine(items.map(i => i[0])));
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
    if (!r || def.once) { nurse(`${meta.ar}؟ عملناه من شوي.`); return false; }
    if (prev.n >= r.max) { nurse(`${meta.ar} أخدنا كفاية منه، شو الخطوة الجاية؟`); return false; }
    if (E.sim - prev.last < r.gap) { nurse(`${meta.ar}؟ لسا معطيينه، خلينا نشوف تأثيره.`); return false; }
    return true;
  }

  function overTotal(a, meta, def) {
    const cap = def.total || meta.total, prev = E.done.get(a.id);
    if (!cap || !prev) return false;
    if ((prev.amt || 0) + amountOf(a, def, a.said || '') <= cap.hi * SCALE[cap.unit][1]) return false;
    badDose({ ...a, dose: a.dose + ' (فوق المجموع)' }, meta, def);
    nurse(`دكتور، مجموع ${meta.ar} صار فوق الحد. ما بقدر أزيد.`);
    return true;
  }

  function order(a, text) {
    const meta = actOf(a.id);
    if (!meta) return;
    a.said = a.said || text;
    if (a.id === 'cpr') { nurse(E.stage === 3 ? 'لسا في نبض ضعيف دكتور، شو بدك قبل ما يوقف؟' : 'في نبض دكتور، مش وقت إنعاش.'); return; }
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
    if (!def.harm && def.needTest && !(E.tests[def.needTest] && E.tests[def.needTest].back)) { nurse(def.needLine || `دكتور، قبل ${meta.ar} بدنا نتيجة ${testOf(def.needTest).ar}.`); return; }
    if (!def.harm && def.needDone && !E.done.has(def.needDone)) { nurse(def.needLine || `دكتور، قبل ${meta.ar} ما عملنا ${actOf(def.needDone).ar}.`); return; }
    const allergic = allergicTo(a, def, text);
    // An order insisted on too early does not stop the same order once it is right.
    if (!allergic && E.harmed.has(a.id) && !def.allergyKw && (early || !(care && care.stableHarm))) { nurse(`${meta.ar}؟ عملناه من شوي.`); return; }
    const prev = E.done.get(a.id);
    const rescue = (treating && a.id === 'adrenaline') || (E.vtNow && a.id === 'shock');
    if (!allergic && prev && !rescue && !again(a, meta, def, prev)) return;
    // Some relatives react the moment a drug they fear is really going in.
    if (!prev) compOn('onOrder', a.id, 0.05, true);
    if (def.harm || allergic) { unsafe(a, meta, def, allergic); return; }
    const sg = treating && a.id === 'adrenaline' ? { text: 'أدرينالين 0.5 ملغ عضل بالفخذ', dose: '0.5 mg IM' } : def.suggest || meta.suggest || null;
    const propose = sg ? (sg.dose ? `بقترح ${sg.text}، ماشي؟` : sg.text) : '';
    if (meta.dose && !a.dose && !a._asked) {
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
  function sayBack(text, name) {
    if (E.rbBuf) E.rbBuf.push([text, name]);
    else nurse(text);
  }
  function flushBack() {
    const list = E.rbBuf || [];
    E.rbBuf = null;
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
    const named = a.agent && a.agent.length <= 24 ? a.agent : meta.ar;
    // The drug's name once: "سلاين 500 مل سلاين" is not how anyone reads an order back.
    const withName = a.dose && norm(a.dose).includes(norm(named)) ? a.dose : `${named} ${a.dose}`;
    // Asked for the numbers, she reads them at once; "حاضر" is for orders, said once for all of a message's orders.
    if (a.id === 'bp_repeat') { E.bpAt = 0; paint(); nurse(`قست الضغط هسا: ${spokenVitals()}.`); }
    else sayBack(a.sayDose ? `حاضر، ${a.sayDose}.` : a.dose ? `حاضر، ${withName}.` : (def.rb && !meta.dose ? def.rb : 'حاضر.'), meta.ar);
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
      later(0.15, () => { E.risk = clamp(E.risk - 18, 0, 100); E.bpAt = 0; paint(); nurse('الضغط بلش يطلع والصفير خف بعد الأدرينالين.'); });
    }
    if (a.id === 'shock' && E.vtNow) {
      later(0.1, () => {
        E.risk = E.c.risk.critical - 5; E.stage = 2; E.vtNow = false; E.shockedAt = E.sim; E.bpAt = 0;
        stageCheck(); paint();
        log('better', 'رجع النظم بعد الصدمة');
        nurse('رجع sinus، وفي نبض. بس لسا مش ثابت.');
      });
    }
    later(0.1, () => {
      if (a.id === 'temp') { E.tempKnown = true; paint(); }
      if (a.id === 'bp_repeat') return;
      if (def.done) sayDone(def.done);
      if (a.id === 'call_senior' || a.id === 'call_icu') coach('called');
    });
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
      if (accepted && !p.sug) { E.pending = p; E.resolved = false; nurse('أي نوع بالزبط، وقديش؟'); return; }
      if (doseBad({ ...a, dose: '' }, def, text, grade)) {
        badDose({ ...a, dose: a.dose || text.slice(0, 24) }, meta, def);
        if (!p.retried) {
          E.pending = { ...p, retried: true };
          nurse('دكتور، هاي الجرعة مش مزبوطة، راجعها.');
          return;
        }
        nurse('هاي الجرعة ما بقدر أعطيها. اطلبه من جديد بجرعة صحيحة، أو اسأل المشرف.');
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
  // A test is a click or a sentence away and its result lands in the chat at once.
  function orderTest(id, reason, ok, quiet) {
    const meta = testOf(id);
    if (!meta) return;
    const have = E.tests[id];
    if (have) {
      if (have.el && have.el.scrollIntoView) have.el.scrollIntoView({ block: 'center' });
      if (!quiet) nurse(`نتيجة ${meta.ar} موجودة فوق بالمحادثة.`);
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
    } else if (ind === 'no' && E.askedNo < 2) {
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
    return `<div class="er-card"><div class="er-card-h"><b>${esc(meta.ar)}</b><bdi dir="ltr">${esc(meta.en)}</bdi></div>${table}${r.report ? `<p class="er-report" dir="ltr">${esc(r.report)}</p>` : ''}</div>`;
  }
  function resultBack(id) {
    const t = E.tests[id], res = E.c.results[id] || {};
    t.back = true;
    // A culture drawn is not a result yet: nothing to read for hours.
    const waiting = /incubat/i.test(res.report || '');
    t.el = say('lab', '', labCard(id));
    if (waiting) nurse('سحبت الزراعة من مكانين، والنتيجة بعد يوم أو يومين.');
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
        nurse(E.c.companion.nurse); E.anx = clamp(E.anx - 10, 0, 100); E.comp.lastAt = E.sim;
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
    if (E.over) return;
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
    nurse('كود! كود! بلشنا إنعاش!');
    conclude(null);
  }

  /* ---------- ending ---------- */
  function openEnd() {
    if (!E || E.over) return;
    const box = $('er-sheet'), my = E, keep = E.draft || {};
    box.hidden = false;
    box.innerHTML = `<div class="er-pane" role="dialog" aria-modal="true" aria-labelledby="er-end-h">
      <h3 id="er-end-h">سلّم الحالة للأخصائي</h3>
      <label>تشخيصك<input id="er-dx" type="text" maxlength="120" autocomplete="off"></label>
      <label>إلى أين يذهب المريض؟<select id="er-dispo"><option value="">اختر</option><option value="icu">العناية الحثيثة</option><option value="hdu">مراقبة عالية في الطوارئ</option><option value="cath">القسطرة</option><option value="ward">طابق عادي</option><option value="home">البيت</option></select></label>
      <label>التسليم (SBAR)<textarea id="er-sbar" rows="5" maxlength="800" placeholder="الوضع، الخلفية، التقييم مع الأرقام، التوصية"></textarea></label>
      <div class="er-pane-f"><button type="button" class="s" id="er-end-x">رجوع للمريض</button><button type="button" class="p" id="er-end-go" disabled>سلّم</button></div>
    </div>`;
    $('er-dx').value = keep.dx || ''; $('er-dispo').value = keep.dispo || ''; $('er-sbar').value = keep.sbar || '';
    const check = () => {
      my.draft = { dx: $('er-dx').value, dispo: $('er-dispo').value, sbar: $('er-sbar').value };
      $('er-end-go').disabled = !($('er-dx').value.trim() && $('er-dispo').value && $('er-sbar').value.trim());
    };
    ['er-dx', 'er-dispo', 'er-sbar'].forEach(id => $(id).addEventListener('input', check));
    check();
    $('er-end-x').onclick = () => { box.hidden = true; $('er-input').focus(); };
    $('er-end-go').onclick = async () => {
      $('er-end-go').disabled = true;
      $('er-end-go').textContent = 'لحظة...';
      const end = { dx: $('er-dx').value.trim(), dispo: $('er-dispo').value, sbar: $('er-sbar').value.trim() };
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
  function localGrade(end) {
    const d = norm(end.dx), s = norm(end.sbar), c = E.c;
    const close = (c.dx.close || []).some(w => hasAny(d, [w]));
    const right = !close && c.dx.accept.some(w => hasAny(d, [w]));
    // "Gave aspirin" about a drug nobody gave is the one lie plain text can show.
    const claimed = /(اعطيت|عطيت|اعطيناه|اعطيناها|عطيناه|عطيناها|اخذ|اخد|gave|given|started)/.test(s) && D.actions.some(a => a.limits && !E.done.has(a.id) && hasAny(s, a.kw) && !/(بدي|اقترح|نحتاج|يحتاج|تحتاج|لازم|need|plan)/.test(s));
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
    ts.forEach(t => { testPts -= t.ind === 'harm' ? 6 : t.ind === 'no' ? 3 : 0; if (!['good', 'ungraded'].includes(t.reasonOk) && t.ind !== 'no' && t.ind !== 'harm') testPts -= 1.5; if (t.read === 'wrong') testPts -= 2; });
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
    if (E.comm.introduced) good.push('عرّفت بنفسك.');
    if (E.comm.explained) good.push('شرحت ما يجري بكلام مفهوم.');
    else gaps.push(`<b>التواصل</b>: لم تشرح لـ${esc(c.companion.name)} ما يجري، وتدخلت ${E.comp.count} مرة.`);
    if (E.comm.rude) gaps.push('<b>التواصل</b>: خرج منك كلام جارح تحت الضغط.');
    const riskTop = Math.round(Math.max(...E.riskLog.map(p => p[1]))), riskEnd = Math.round(E.risk), anxTop = Math.round(E.anxTop);
    const reasoned = Object.values(E.tests).some(t => t.reason);
    const tests = Object.values(E.tests).map(t => `<tr><td dir="ltr">${esc(testOf(t.id).en)}</td><td class="i-${t.ind}">${IND[t.ind]}</td>${reasoned ? `<td>${RSN[t.reasonOk] || ''}${t.reason ? `<small>${esc(t.reason)}</small>` : ''}</td>` : ''}<td>${esc(t.why || '')}</td></tr>`).join('');
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
      <h4>الفحوصات</h4>${tests ? `<div class="er-scroll"><table class="er-tests"><thead><tr><th>الفحص</th><th>الاستطباب</th>${reasoned ? '<th>تبريرك</th>' : ''}<th>لماذا</th></tr></thead><tbody>${tests}</tbody></table></div>` : '<p>لم تطلب أي فحص.</p>'}
      ${end && end.grade.note ? `<h4>تسليمك</h4><p>${esc(end.grade.note)}</p>` : ''}
      <h4>الخلاصة</h4><p>${esc(c.brief)}</p>
      <p class="er-small">طلبت مساعدة المشرف ${E.helps} مرة، وبادر هو ${E.hints} مرة. الحالات والدرجات تدريبية ولم يراجعها طبيب بعد.</p>
      <div class="er-pane-f"><button type="button" class="s" id="er-home">الرئيسية</button><button type="button" class="s" id="er-again">أعد الحالة نفسها</button><button type="button" class="p" id="er-next">الحالة التالية</button></div>
    </div>`;
    $('er-again').onclick = () => begin(c.id);
    $('er-next').onclick = () => begin();
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
      u.history.unshift({ caseTitle: 'غرفة الطوارئ · ' + E.c.dx.ar, mode: 'غرفة الطوارئ', correct: !!(end && end.grade.dx === 'right'), workupCount: Object.keys(E.tests).length,
        questions: E.facts.size, score: `${s.total}% (${passed ? 'مجتاز' : 'غير مجتاز'})`, caseId: 'er_' + E.c.id, num: s.total, passed, ts: Date.now(), date: new Date().toISOString().slice(0, 10) });
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
  function buildRecords() {
    const f = $('er-rec-f'), list = $('er-rec-list');
    if (!f || !list || !D || !E) return;
    f.innerHTML = [['all', 'الكل'], ...PANELS].map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${k === recFilter}">${l}</button>`).join('');
    const q = norm(recQuery);
    const was = document.activeElement, keep = was && was.dataset ? (was.dataset.t ? `[data-t="${was.dataset.t}"]` : was.dataset.f ? `[data-f="${was.dataset.f}"]` : '') : '';
    list.innerHTML = PANELS.filter(([k]) => recFilter === 'all' || recFilter === k).map(([k, label]) => {
      const items = D.tests.filter(t => t.panel === k && (!q || norm(t.ar + ' ' + t.en + ' ' + (t.kw || []).join(' ') + ' ' + label).includes(q)));
      if (!items.length) return '';
      return `<section class="er-rec-sec"><h4>${label}</h4><div>${items.map(t => `<button type="button" class="er-t${E.tests[t.id] ? ' is-done' : ''}" data-t="${t.id}"><span dir="ltr">${esc(t.en)}</span><small>${esc(t.ar)}</small>${E.tests[t.id] ? '<i aria-label="تم الطلب">✓</i>' : ''}</button>`).join('')}</div></section>`;
    }).join('') || '<p class="er-small">لا يوجد فحص بهذا الاسم.</p>';
    if (keep) { const n = $('er-records').querySelector(keep); if (n && n.focus) n.focus({ preventScroll: true }); }
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
    if (!E.tests[id]) { person('me', `بدي ${meta.en}`); orderTest(id, '', '', true); }
    else orderTest(id, '', '', true);
    if (!wide()) toggleRecords(false);
  }

  /* ---------- starting ---------- */
  let soundBack = false, lastReport = null;
  function begin(id) {
    if (tickId) cancelAnimationFrame(tickId);
    if (soundBack) { soundBack = false; const b = document.querySelector('.er-mon .nb-mon-sound'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); }
    const list = D.cases;
    let c = id ? list.find(x => x.id === id) : null;
    if (!c) {
      const fresh = list.filter(x => !seen.has(x.id));
      if (!fresh.length) seen.clear();
      c = pickOf(fresh.length ? fresh : list);
    }
    seen.add(c.id);
    E = {
      c, sim: 0, risk: c.risk.start, anx: c.companion.start, stage: 0, done: new Map(), effects: [], jobs: [], tests: {}, facts: new Set(), exam: new Set(),
      chat: [], log: [], riskLog: [[0, c.risk.start]], riskLogAt: 0, paintAt: -1, bpAt: 0, bpTime: 0, bp: ['--', '--'], tempKnown: false, utt: 0, turns: 0,
      comp: { lastTurn: -9, lastAt: -9, count: 0, asked: null, addressed: 0, used: new Set(), extra: 0, angry: false, ignored: 0, procs: 0, unheard: 0, nurseStep: false, heardTurn: 0, gen: 0, outUntil: 0, explainedTurn: -9 }, busyTurn: -9, comm: { introduced: false, explained: false, empathy: false, consent: false, rude: 0, jargon: 0 },
      harms: [], harmed: new Set(), reacted: false, caught: [], pending: null, queue: [], wrongDoses: [], unneeded: [], lateTests: [], askedNo: 0, hint: -1, hints: 0, helps: 0, readAsks: 0, over: false, outcome: null, resolved: false,
      topStage: 0, anxTop: c.companion.start, vtNow: false, vtAt: null, shockedAt: null, anaph: null, draft: null,
      mods: [], improved: 0, nudged: false, collect: null, resp: null, saidBy: new Set(), holdAsked: false
    };
    recFilter = 'all'; recQuery = '';
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
    $('er-v-bp').textContent = '--/--';
    $('view-er').dataset.rhythm = '';
    sys('أنت الطبيب المقيم في الطوارئ. تكلم مع الموجودين، واكتب أوامرك وأدويتك وجرعاتها، واطلب الفحوصات، وسلّم الحالة عندما تنتهي.');
    if (api === 'off' && location.protocol !== 'file:') { apiNoted = true; sys(OFFLINE_NOTE); }
    sys(p.arrival);
    person('p', p.opening);
    nurse(c.nurse.handoff);
    if (c.companion.lines.enter) {
      const x = lineOf(pickOf(c.companion.lines.enter));
      person('c', x);
      E.comp.used.add(x); E.comp.lastTurn = 0; E.comp.lastAt = 0;
    }
    paint();
    last = performance.now();
    const loop = now => { if (!E || E.over) return; if (!document.hidden && !$('view-er').classList.contains('hidden')) tick(now); else last = now; tickId = requestAnimationFrame(loop); };
    tickId = requestAnimationFrame(loop);
    $('er-input').focus();
  }

  function mount() {
    const v = $('view-er');
    if (v.dataset.ready) return;
    v.dataset.ready = '1';
    $('er-form').addEventListener('submit', e => { e.preventDefault(); const i = $('er-input'); send(i.value); i.value = ''; });
    $('er-test').addEventListener('click', () => toggleRecords());
    const rec = $('er-records');
    rec.addEventListener('click', e => {
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
  window.__nbER = { begin: id => begin(id), send, orderTest, panelTest, buildRecords, modsNow, live, allergicTo, readAct, get E() { return E; }, get D() { return D; }, set api(v) { api = v; apiRetryAt = v === 'off' ? Infinity : 0; if (v === 'off') loadFind(); }, get api() { return api; }, readFinding, doseCheck, doseOf, doseIn, doseBad, jump(min) { if (E) E.sim += min; }, localRead, end: conclude, score, setRisk(r) { E.risk = r; } };
})();
