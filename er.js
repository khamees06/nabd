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
  // Simulated seconds per real second: a case runs in minutes, the way a resus bay feels.
  const PACE = 2;
  // Once treatment is holding and the room is only waiting for results, time moves on faster.
  const WAIT_PACE = 8;
  const BP_EVERY = 5;

  let D = null, loading = null, api = location.protocol === 'file:' ? 'off' : 'try', apiFails = 0;
  let E = null, tickId = null, last = 0;
  const seen = new Set();

  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const norm = s => String(s).replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي')
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

  function live() {
    const v = vitalsAt(E.risk);
    const o = E.c.care.oxygen;
    if (E.done.has('oxygen') && o && o.spo2 && E.sim >= E.done.get('oxygen').at + 0.5) v.spo2 = Math.min(99, v.spo2 + o.spo2);
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
      E.bpAt = E.sim + BP_EVERY;
      E.bpTime = E.sim;
      $('er-v-bp').textContent = E.bp.join('/');
    }
    $('er-v-bpt').textContent = 'قبل ' + Math.floor(E.sim - E.bpTime) + ' د';
    $('er-v-temp').textContent = E.tempKnown ? E.c.temp.toFixed(1) : '--.-';
  }
  const vitalsLine = () => { const v = E.show || live(); return `HR ${Math.round(v.hr)}, BP ${E.bp.join('/')}, RR ${Math.round(v.rr)}, SpO2 ${Math.round(v.spo2)}%`; };

  // Adult limits; a reading outside them lights its tile (motion.js asks here).
  window.nbErVitals = {
    warn(k, x) {
      if (k === 'hr') return x > 110 || x < 50;
      if (k === 'rr') return x > 24 || x < 10;
      if (k === 'spo2') return x <= 92;
      if (k === 'bp') return parseInt(String(x), 10) < 100;
      if (k === 'temp') return x >= 38;
      return false;
    }
  };

  function netRate() {
    let r = E.c.risk.rate;
    for (const a of E.effects) if (E.sim >= a.from) r -= a.slow;
    return r;
  }

  function tick(now) {
    if (!E || E.over) return;
    const dt = Math.min(2, (now - last) / 1000);
    last = now;
    const rate = netRate();
    const step = dt * (rate <= 0 && E.jobs.length ? WAIT_PACE : PACE) / 60;
    E.sim += step;
    E.risk = clamp(E.risk + rate * step, 0, 100);
    if (E.sim - E.riskLogAt >= 0.25) { E.riskLog.push([E.sim, E.risk]); E.riskLogAt = E.sim; }
    $('er-clock').textContent = String(Math.floor(E.sim)).padStart(2, '0') + ':' + String(Math.floor((E.sim % 1) * 60)).padStart(2, '0');
    if (E.sim - E.paintAt >= 0.12) { paint(); E.paintAt = E.sim; }
    for (const j of E.jobs.filter(x => E.sim >= x.at)) { E.jobs.splice(E.jobs.indexOf(j), 1); j.fn(); }
    stageCheck();
    alarm(now);
    if (E.risk >= 100) arrest();
  }

  const STAGES = ['', 'watch', 'urgent', 'critical'];
  function stageCheck() {
    const R = E.c.risk;
    const s = E.risk >= R.critical ? 3 : E.risk >= R.urgent ? 2 : E.risk >= R.watch ? 1 : 0;
    $('view-er').dataset.stage = STAGES[s] || 'calm';
    if (s <= E.stage) {
      // Getting better is an event too.
      if (s < E.stage && E.stage >= 2) { E.stage = s; log('better', 'تحسّن المريض بعد العلاج'); nurse('دكتور، الأرقام عم تتحسن.'); director('better'); }
      return;
    }
    E.stage = s;
    const L = E.c.stageLines[STAGES[s]] || {};
    log('stage', ['', 'بدأ التدهور', 'تدهور واضح', 'حالة حرجة'][s]);
    if (s >= 2) alert(s === 3 ? 'إنذار حرج: ' + worst() : 'إنذار: ' + worst());
    if (L.nurse) nurse(L.nurse);
    if (L.patient) later(0.15, () => person('p', pickOf(L.patient)));
    E.anx = clamp(E.anx + 14, 0, 100);
    director(s >= 2 ? 'alarm' : 'worse');
    if (s >= 2) coach(s === 3 ? 'critical' : 'urgent');
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
  function say(who, text, extra) {
    const feed = $('er-feed');
    const d = document.createElement('div');
    d.className = 'er-msg k-' + who;
    const label = LABEL()[who];
    d.innerHTML = (label ? `<span class="er-who">${esc(label)}</span>` : '') + (text ? `<p>${esc(text)}</p>` : '') + (extra || '');
    feed.appendChild(d);
    feed.scrollTop = feed.scrollHeight;
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
  async function call(body, ms = 15000) {
    if (api === 'off') return null;
    try {
      const r = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(ms),
        body: JSON.stringify({ case: E.c.id, risk: E.risk, anx: E.anx, state: stateNow(), history: E.chat.slice(-14), ...body })
      });
      if (!r.ok) {
        if ([403, 404, 405, 503].includes(r.status) || ++apiFails >= 3) api = 'off';
        return null;
      }
      api = 'on'; apiFails = 0;
      return await r.json();
    } catch (e) {
      if (++apiFails >= 3) api = 'off';
      return null;
    }
  }

  // A line for someone the room has decided should speak; the case's own line is the safety net.
  async function voice(who, speaker, why, fallback) {
    const my = E;
    const r = await call({ mode: 'line', speaker, why }, 9000);
    if (E !== my || E.over) return;
    person(who, (r && r.reply) || fallback);
  }

  /* ---------- reading the student without the server ---------- */
  const hasAny = (t, kw) => kw.some(k => { const n = norm(k); return n && (' ' + t + ' ').includes(n.length < 4 ? ' ' + n + ' ' : n); });
  function localRead(text) {
    const t = norm(text), c = E.c;
    const facts = c.facts.filter(f => hasAny(t, f.kw)).map(f => f.id).filter(id => id !== 'allergy' || t.includes('حساس') || t.includes('allerg')).slice(0, 3);
    const exam = c.exam.filter(f => hasAny(t, f.kw)).map(f => f.id);
    const actions = D.actions.filter(a => hasAny(t, a.kw)).filter((a, i, all) => a.id !== 'adrenaline' || !all.some(x => x.id === 'noradrenaline')).map(a => ({ id: a.id, agent: '', dose: (text.match(/\d[\d.]*\s*[^\s،,]*/) || [''])[0] }));
    const why = text.match(/(عشان|لان|لأن|بسبب|لاستبعاد|لنفي|rule out|r\/o).*/i);
    const tests = D.tests.filter(x => hasAny(t, x.kw)).map(x => ({ id: x.id, reason: why ? why[0] : '', reason_ok: why ? 'weak' : 'none' }));
    const toSup = /(يا مشرف|يا استاذ|يا دكتور|شو رايك|ساعدني|مش عارف|محتار|شو اعمل)/.test(t);
    const toNurse = new RegExp('(يا ممرض|يا سستر|يا ' + norm(c.nurse.name) + '|اعطي|ركبي|حطي|قيسي|جهزي)').test(t);
    const toComp = /(يا حجه|يا حجي|يا خالتي|يا عمي|اطمني|اطمن|هدي حال|ولا يهمك|لازم اشتغل|بعد اذنك)/.test(t);
    const to = toComp ? 'companion' : toSup ? 'supervisor' : toNurse || actions.length || tests.length ? 'nurse' : 'patient';
    return {
      to, facts, exam, actions: toComp ? [] : actions, tests: toComp ? [] : tests, kind: toSup ? 'help' : actions.length ? 'order' : /^(مرحب|اهلا|هلا|السلام|صباح|مساء)/.test(t) ? 'smalltalk' : facts.length ? 'question' : 'other',
      pending_ok: !E.pending ? 'na' : E.pending.type === 'unsafe' ? (/(متاكد|اعطي|عطيه|كملي|نعم|ايوا|اه )/.test(t) ? 'wrong' : 'good') : t.length > 1 ? 'partial' : 'na',
      tone: {
        introduced: /(انا الدكتور|انا دكتور|انا طالب|اسمي|معك الدكتور)/.test(t), empathy: /(بفهم|معك حق|حقك|سلامتها|سلامته|لا تخاف)/.test(t),
        rude: /(اسكت|اخرس|اطلع برا|مش شغلك|مالك دخل|غصب)/.test(t), jargon: false,
        explained: toComp && /(رح|عم ن|بنعطي|بنعمل|الوضع|حالتها|حالته)/.test(t), consent: /(بعد اذنك|ممكن اسمع|ممكن افحص|بتسمح)/.test(t),
      }
    };
  }
  function localReply(read) {
    const c = E.c;
    if (E.pending && read.pending_ok !== 'na') return null;
    if (read.to === 'supervisor') return pickOf(c.teach);
    if (read.to === 'nurse') return read.actions.length || read.tests.length ? null : 'تمام، شو بدك أعمل؟';
    if (read.to === 'companion') {
      const f = read.facts.map(id => c.facts.find(x => x.id === id)).find(x => x && x.who && x.who !== 'patient');
      return f ? f.say : pickOf(read.tone.explained ? c.companion.lines.calm : c.companion.lines.ignored);
    }
    if (read.actions.length || read.tests.length || read.exam.length) return null;
    const f = read.facts.map(id => c.facts.find(x => x.id === id)).find(x => x && x.who !== 'companion');
    if (f) return f.say;
    if (read.facts.length) { read.to = 'companion'; return c.facts.find(x => x.id === read.facts[0]).say; }
    return read.kind === 'smalltalk' ? 'أهلين...' : null;
  }

  /* ---------- a message from the student ---------- */
  let chain = Promise.resolve();
  function send(text) {
    text = (text || '').trim();
    if (!text || !E || E.over) return;
    person('me', text);
    E.typedThisTurn = false;
    chain = chain.then(() => handle(text)).catch(e => console.error(e));
  }

  async function handle(text) {
    const my = E;
    const dots = typing();
    const pending = E.pending;
    const r = await call({ text, pending: pending ? { ask: pending.ask } : undefined });
    dots.remove();
    if (E !== my || E.over) return;
    const read = (r && r.read) || localRead(text);
    apply(read, text, r ? r.to : read.to, r ? (r.held ? pickOf(E.c.teach) : r.reply) : localReply(read));
  }

  function apply(read, text, to, reply) {
    const t = read.tone || {};
    E.turns++;
    if (t.introduced) E.comm.introduced = true;
    if (t.consent) E.comm.consent = true;
    if (t.rude) { E.comm.rude++; E.anx = clamp(E.anx + 24, 0, 100); log('comm', 'كلام جارح أو متجاهل للأهل'); }
    if (t.empathy) { E.comm.empathy = true; }
    if (t.jargon && (to === 'companion' || to === 'patient')) { E.comm.jargon++; E.anx = clamp(E.anx + 7, 0, 100); }
    if (to === 'companion') {
      E.comp.asked = false;
      E.comp.addressed++;
      if (t.explained || t.empathy) { E.comm.explained = true; E.anx = clamp(E.anx - 24, 0, 100); E.comp.last = E.utt + 3; log('comm', 'شرح للأهل فهدأوا'); }
      else E.anx = clamp(E.anx - 6, 0, 100);
    } else {
      E.anx = clamp(E.anx + (E.comp.asked ? 8 : 3), 0, 100);
      if (to === 'patient' && t.explained) E.comm.explained = true;
    }

    const open = E.pending;
    if (open && read.pending_ok && read.pending_ok !== 'na') resolve(read.pending_ok, text);
    else if (open && (open.type === 'dose' || open.type === 'reason') && (open.wait = (open.wait || 0) + 1) === 2) nurse('دكتور، لسا مستنية جوابك على طلبك.');
    (read.facts || []).forEach(id => E.facts.add(id));
    (read.exam || []).forEach(examine);
    if (reply) person(to === 'companion' ? 'c' : to === 'nurse' ? 'n' : to === 'supervisor' ? 'd' : 'p', reply);
    if (to === 'supervisor') { E.helps++; }
    const answered = E.resolved && open ? (open.a ? open.a.id : open.id) : null;
    const swapped = a => open && open.type === 'unsafe' && open.allergic && !allergicTo(a, E.c.care[a.id] || {}, text);
    (read.actions || []).filter(a => a.id !== answered || swapped(a)).forEach(a => order(a, text));
    (read.tests || []).filter(x => x.id !== answered).forEach(x => orderTest(x.id, x.reason, x.reason_ok));
    E.resolved = false;
    director(to === 'companion' ? 'addressed' : 'turn');
  }

  function examine(id) {
    const x = E.c.exam.find(f => f.id === id);
    if (!x) return;
    const firstTime = !E.exam.has(id);
    E.exam.add(id);
    const out = E.stage === 3 && x.sayCritical ? x.sayCritical : x.say;
    say('exam', out);
    E.chat.push({ r: 'n', t: 'فحص: ' + out });
    if (firstTime) log('exam', 'فحصت: ' + out);
  }

  /* ---------- orders ---------- */
  // One open question at a time, the rest wait their turn.
  function ask(p, line, who = 'n') {
    if (E.pending) { E.queue.push([p, line, who]); return; }
    E.pending = p;
    person(who, line);
  }
  // "levofloxacin instead of penicillin" names the allergen without ordering it; only the word
  // right before each mention decides, so "tazocin without delay" is still tazocin.
  const allergicTo = (a, def, text) => {
    if (!def.allergyKw) return false;
    const written = norm(a.agent ? a.agent + ' ' + (a.dose || '') : text);
    return def.allergyKw.some(k => {
      const word = norm(k);
      for (let i = written.indexOf(word); i >= 0; i = written.indexOf(word, i + 1)) {
        const before = written.slice(0, i).trim().split(' ').slice(-3).join(' ');
        if (!/(بدل|بدون|مش|غير|حساسيه|حساسيته|allerg\w*)( من| to)?( ?ب?ال)?$/.test(before) && !/^allerg/.test(written.slice(i + word.length).trim())) return true;
      }
      return false;
    });
  };

  function order(a, text) {
    const meta = actOf(a.id);
    let def = E.c.care[a.id] || {};
    if (!meta) return;
    if (def.stableHarm && E.stage < 3) def = { ...def, ...def.stableHarm, harm: true };
    const allergic = allergicTo(a, def, text);
    if (!allergic && (E.done.has(a.id) || (E.harmed.has(a.id) && !def.allergyKw))) { nurse(`${meta.ar}؟ عملناه من شوي.`); return; }
    if (def.harm || allergic) { unsafe(a, meta, def, allergic); return; }
    if (meta.dose && !a.dose && !a._asked) {
      ask({ type: 'dose', a, ask: `The nurse asked the dose of ${meta.en}. Reference: ${def.dose || 'standard dose'}. good = a correct dose or flow, partial = roughly right, wrong = unsafe or wrong, na = not a reply.` }, def.rb || `${meta.ar}، كم الجرعة؟`);
      return;
    }
    give(a, meta, def);
  }

  function give(a, meta, def) {
    E.done.set(a.id, { at: E.sim, dose: a.dose || '', ok: a._ok || 'good' });
    log('action', meta.ar + (a.dose ? ' (' + a.dose + ')' : ''));
    const named = a.agent && a.agent.length <= 24 ? a.agent : meta.ar;
    nurse(a.dose ? `حاضر، ${named} ${a.dose}.` : (def.rb && !meta.dose ? def.rb : 'حاضر.'));
    if (def.slow) E.effects.push({ id: a.id, from: E.sim + (def.onset || 0), slow: def.slow });
    later(0.5, () => {
      if (a.id === 'temp') { E.tempKnown = true; paint(); }
      if (a.id === 'bp_repeat') { E.bpAt = 0; paint(); nurse(`الضغط ${E.bp.join('/')}.`); return; }
      if (def.done) nurse(def.done);
      if (a.id === 'call_senior' || a.id === 'call_icu') coach('called');
    });
    E.anx = clamp(E.anx + 2, 0, 100);
    director('procedure');
  }

  function unsafe(a, meta, def, allergic) {
    const need = allergic ? 'allergy' : def.needFact;
    const known = need ? E.facts.has(need) || (allergic && E.reacted) : true;
    // Asked and known: the nurse stops it. Never asked: nobody in the room knows, and it is given.
    if (known) {
      ask({ type: 'unsafe', a, def, allergic, ask: `The nurse challenged the unsafe order ${meta.en}. good = the trainee cancels or changes it, wrong = the trainee insists, na = not a reply.` }, (!allergic && def.challenge) || `دكتور، ${meta.ar}؟ في قصة حساسية، متأكد؟`);
      log('harm', 'أوقفت الممرضة أمراً غير آمن: ' + meta.ar);
      E.caught.push(a.id);
      return;
    }
    harm(a, meta, def, allergic);
  }

  function harm(a, meta, def, allergic) {
    // Kept apart from E.done: a trap earns no step, and a safe drug can still follow an allergic reaction.
    E.harmed.add(a.id);
    if (allergic) E.reacted = true;
    const label = allergic ? meta.ar + ' رغم الحساسية' : def.label || meta.ar;
    E.harms.push({ at: E.sim, label, why: allergic ? def.allergyEffect : def.why });
    nurse('حاضر.');
    const risk = allergic ? def.allergyRisk || 18 : def.risk || 12;
    later(0.8, () => {
      E.risk = clamp(E.risk + risk, 0, 100);
      log('harm', 'أذى: ' + label);
      alert(allergic ? def.allergyEffect : def.effect || 'ساءت حالة المريض بعد الدواء.');
      E.anx = clamp(E.anx + 20, 0, 100);
      director('alarm');
      coach('harm');
    });
  }

  function resolve(grade, text) {
    const p = E.pending;
    E.pending = null;
    E.resolved = true;
    if (p.type === 'dose' && allergicTo({ agent: '' }, E.c.care[p.a.id] || {}, text)) {
      // "Give an antibiotic." "Which?" "Augmentin." is the same order as naming it outright.
      unsafe({ ...p.a, dose: text.slice(0, 40), _asked: true }, actOf(p.a.id), E.c.care[p.a.id], true);
    } else if (p.type === 'dose') {
      if (grade === 'wrong' && !p.retried) {
        E.pending = { ...p, retried: true };
        E.wrongDoses++;
        nurse('دكتور، هاي الجرعة مش مزبوطة، راجعها.');
        return;
      }
      const a = { ...p.a, dose: text.slice(0, 40), _asked: true, _ok: grade };
      give(a, actOf(a.id), E.c.care[a.id] || {});
    } else if (p.type === 'reason') {
      submitTest(p.id, text.slice(0, 120), grade === 'good' ? 'good' : 'weak');
    } else if (p.type === 'unsafe') {
      if (grade === 'wrong') harm(p.a, actOf(p.a.id), p.def, p.allergic);
      else nurse('تمام، ما بعطيه.');
    } else if (p.type === 'interpret') {
      E.tests[p.id].read = grade;
      log('read', `قراءة ${testOf(p.id).en}: ${grade === 'good' ? 'صحيحة' : grade === 'partial' ? 'ناقصة' : 'خاطئة'}`);
      if (grade === 'good') person('d', pickOf(['تمام، هيك القراءة.', 'صح، كمّل.', 'مزبوط، طيب شو الخطوة الجاية؟']));
      else voice('d', 'supervisor', `The trainee misread the ${testOf(p.id).en}. Reference reading: ${E.c.results[p.id].key}. Point to the exact value that does not fit and ask them to look again; explain only that value.`, `ارجع للـ${testOf(p.id).en} مرة ثانية، في إشي مش راكب مع قراءتك.`);
    }
    const next = E.queue.shift();
    if (next) ask(...next);
  }

  /* ---------- tests ---------- */
  function orderTest(id, reason, ok) {
    const meta = testOf(id);
    if (!meta) return;
    if (E.tests[id]) { nurse(E.tests[id].back ? `نتيجة ${meta.ar} طلعت، فوق بالمحادثة.` : `${meta.ar} مطلوب، لسا ما طلع.`); return; }
    if (!reason) {
      ask({ type: 'reason', id, ask: `The nurse asked why ${meta.en} is needed. Sound reason here: ${(E.c.results[id] || {}).good || 'there is none in this patient'}. good = a sound reason, partial = vague, wrong = a reason that does not fit, na = not a reply.` }, pickOf([`ليش بدك ${meta.ar}؟ لازم أكتب الاستطباب على الطلب.`, `${meta.ar}؟ شو أكتب سبب الطلب؟`]));
      return;
    }
    submitTest(id, reason, ok || 'weak');
  }

  function submitTest(id, reason, reasonOk) {
    const meta = testOf(id), res = E.c.results[id] || {};
    E.tests[id] = { id, at: E.sim, reason, reasonOk, ind: res.ind || 'no', back: false, read: null };
    log('test', `طلب ${meta.en} (${reason})`);
    nurse(`طلبته، النتيجة بعد حوالي ${meta.tat === 1 ? 'دقيقة' : meta.tat === 2 ? 'دقيقتين' : meta.tat <= 10 ? meta.tat + ' دقايق' : meta.tat + ' دقيقة'}.`);
    later(meta.tat, () => resultBack(id));
    if (res.ind === 'harm') {
      E.risk = clamp(E.risk + 6, 0, 100);
      voice('d', 'supervisor', `The trainee ordered ${meta.en}, which is dangerous right now: ${res.why} Stop them firmly and ask what it would change.`, `استنى، ليش ${meta.en} هلأ؟ شو رح يغيّر بالـmanagement والمريض مش stable؟`);
    } else if (res.ind === 'no' && !E.askedNo) {
      E.askedNo = true;
      voice('d', 'supervisor', `The trainee ordered ${meta.en}, not needed here: ${res.why} Ask one short question about what it would change, without giving the answer.`, `${meta.en}؟ شو رح يغيّر بالخطة هلأ؟`);
    }
    director('turn');
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
    say('lab', '', labCard(id));
    nurse(waiting ? 'سحبتها، والنتيجة بدها يومين.' : `طلعت نتيجة ${testOf(id).ar}.`);
    if (!waiting && res.key && (res.ind === 'indicated' || res.ind === 'acceptable') && E.readAsks < 3) {
      E.readAsks++;
      ask({ type: 'interpret', id, ask: `The supervisor asked the trainee to read the ${testOf(id).en}. Reference reading: ${res.key}. good = matches, partial = incomplete, wrong = contradicts, na = not a reply.` }, pickOf([`شو بتقرأ بالـ${testOf(id).en}؟`, `طيب، الـ${testOf(id).en} شو بيحكيلك؟`]), 'd');
    }
    director('result');
  }

  /* ---------- who speaks next ---------- */
  // Runs after anything anyone says or does, never on a timer. The companion breaks in when
  // something has just happened and worry is high enough, with chance deciding the moment.
  function director(evt) {
    if (!E || E.over) return;
    if (evt === 'addressed') return;
    const a = E.anx, since = E.utt - E.comp.last;
    const force = evt === 'alarm' || evt === 'worse';
    if (since < (force ? 1 : 3)) return;
    let p = 0;
    if (force) p = 1;
    else if (evt === 'procedure') p = clamp(a / 110, 0.2, 0.75);
    else if (evt === 'result') p = clamp(a / 150, 0.1, 0.5);
    else if (evt === 'typing') p = clamp((a - 30) / 130, 0, 0.45);
    else if (evt === 'better') p = 0.4;
    else p = clamp((a - 22) / 90, 0.08, 0.65);
    if (Math.random() > p) return;
    breakIn(evt);
  }

  function breakIn(evt) {
    const L = E.c.companion.lines, a = E.anx;
    let trig = evt === 'alarm' ? 'alarm' : evt === 'worse' ? 'worse' : evt === 'procedure' ? 'procedure' : evt === 'better' ? 'calm' : a >= 78 ? 'angry' : 'ignored';
    if (!E.comp.extra && L.extra && a >= 45 && Math.random() < 0.35) { trig = 'extra'; E.comp.extra = true; }
    const pool = L[trig] && L[trig].length ? L[trig] : L.ignored;
    const unused = pool.filter(x => !E.comp.used.has(x));
    const line = pickOf(unused.length ? unused : pool);
    E.comp.used.add(line);
    E.comp.last = E.utt + 1;
    E.comp.count++;
    if (trig !== 'calm') E.comp.asked = true;
    if (trig === 'angry') log('comm', 'غضب المرافق وطلب أخصائياً');
    const why = { alarm: 'the monitor alarm just went off', worse: 'your relative looks worse', procedure: 'someone is doing something to your relative and nobody told you what', calm: 'things look a bit better', angry: 'nobody is answering you and you want a senior doctor now', ignored: 'nobody has told you what is happening', extra: `you push for this: ${line}` }[trig];
    // The case's lines are short and real; a fresh line keeps repeats away once they run out.
    if (!unused.length && api !== 'off') voice('c', 'companion', why, line);
    else person('c', line);
  }

  // The supervisor is in the room and speaks when the moment calls for it.
  function coach(why) {
    if (E.over) return;
    const missing = keyMissing().map(k => k.label).join('، ');
    if (why === 'called') { person('d', 'شو عندك؟ بجملتين: situation وأهم رقم.'); return; }
    if (why === 'harm') { voice('d', 'supervisor', 'Something the trainee ordered just harmed the patient. Say it calmly, ask what changed and what they do now.', 'وقف. شو تغيّر بعد آخر دوا؟ شو بتعمل هلأ؟'); return; }
    if (why === 'urgent' && !missing) return;
    E.hint = Math.min(E.hint + 1, E.c.teach.length - 1);
    E.hints++;
    const fallback = E.c.teach[E.hint];
    voice('d', 'supervisor', why === 'critical'
      ? `The patient is about to arrest. Key steps not done: ${missing || 'none'}. Tell the trainee directly and briefly what matters now, without naming the disease.`
      : `The patient is getting worse. Key steps not done: ${missing || 'none'}. Ask one sharp question that points at the priority.`, fallback);
  }
  const keyMissing = () => Object.entries(E.c.care).filter(([id, d]) => d.key && !E.done.has(id)).map(([id, d]) => ({ id, ...d }));

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
    const box = $('er-sheet');
    box.hidden = false;
    box.innerHTML = `<div class="er-pane" role="dialog" aria-modal="true" aria-labelledby="er-end-h">
      <h3 id="er-end-h">سلّم الحالة للأخصائي</h3>
      <label>تشخيصك<input id="er-dx" type="text" maxlength="120" autocomplete="off"></label>
      <label>إلى أين يذهب المريض؟<select id="er-dispo"><option value="">اختر</option><option value="icu">العناية الحثيثة</option><option value="hdu">مراقبة عالية في الطوارئ</option><option value="cath">القسطرة</option><option value="ward">طابق عادي</option><option value="home">البيت</option></select></label>
      <label>التسليم (SBAR)<textarea id="er-sbar" rows="5" maxlength="800" placeholder="الوضع، الخلفية، التقييم مع الأرقام، التوصية"></textarea></label>
      <div class="er-pane-f"><button type="button" class="s" id="er-end-x">رجوع للمريض</button><button type="button" class="p" id="er-end-go" disabled>سلّم</button></div>
    </div>`;
    const check = () => { $('er-end-go').disabled = !($('er-dx').value.trim() && $('er-dispo').value && $('er-sbar').value.trim()); };
    ['er-dx', 'er-dispo', 'er-sbar'].forEach(id => $(id).addEventListener('input', check));
    $('er-end-x').onclick = () => { box.hidden = true; $('er-input').focus(); };
    $('er-end-go').onclick = async () => {
      $('er-end-go').disabled = true;
      $('er-end-go').textContent = 'لحظة...';
      const end = { dx: $('er-dx').value.trim(), dispo: $('er-dispo').value, sbar: $('er-sbar').value.trim() };
      const g = await call({ mode: 'grade', dxText: end.dx, sbar: end.sbar }, 12000);
      end.grade = g && g.dx ? g : localGrade(end);
      E.outcome = E.risk < E.c.risk.watch ? 'stable' : 'unstable';
      box.hidden = true;
      conclude(end);
    };
    $('er-dx').focus();
  }
  function localGrade(end) {
    const d = norm(end.dx), s = norm(end.sbar);
    return { dx: E.c.dx.accept.some(w => d.includes(norm(w))) ? 'right' : 'wrong', s: s.length > 15, b: /(عنده|عندها|تاريخ|history|قصه)/.test(s), a: /\d/.test(s), r: /(بدي|اقترح|نحتاج|لازم|توصيه|plan)/.test(s), note: '' };
  }

  function score(end) {
    const c = E.c, keys = Object.entries(c.care).filter(([, d]) => d.key);
    const safety = [];
    keys.forEach(([id, d]) => {
      const x = E.done.get(id);
      safety.push({ id, d, at: x ? x.at : null, state: !x ? 'missed' : x.at <= d.by ? 'ontime' : 'late' });
    });
    Object.entries(c.results).filter(([, r]) => r.by).forEach(([id, r]) => {
      const x = E.tests[id];
      safety.push({ id, d: r, at: x ? x.at : null, state: !x ? 'missed' : x.at <= r.by ? 'ontime' : 'late' });
    });
    const per = 40 / Math.max(1, safety.length);
    let safe = safety.reduce((s, k) => s + (k.state === 'ontime' ? per : k.state === 'late' ? per / 2 : 0), 0) - E.harms.length * 10;
    if (E.outcome === 'arrest') safe = Math.min(safe, 10);
    safe = clamp(safe, 0, 40);
    const dxPts = !end ? 0 : end.grade.dx === 'right' ? 15 : end.grade.dx === 'close' ? 8 : 0;
    const ts = Object.values(E.tests);
    let testPts = 15;
    ts.forEach(t => { testPts -= t.ind === 'harm' ? 6 : t.ind === 'no' ? 3 : 0; if (t.reasonOk !== 'good' && t.ind !== 'no' && t.ind !== 'harm') testPts -= 1.5; if (t.read === 'wrong') testPts -= 2; });
    const missedTests = Object.entries(c.results).filter(([id, r]) => r.ind === 'indicated' && !E.tests[id]).map(([id]) => id);
    testPts = clamp(testPts - missedTests.length * 3, 0, 15);
    const reds = [...c.facts, ...c.exam].filter(f => f.red);
    const got = reds.filter(f => E.facts.has(f.id) || E.exam.has(f.id));
    const hist = reds.length ? 10 * got.length / reds.length : 10;
    const m = E.comm;
    const comm = clamp((m.introduced ? 2 : 0) + (m.explained ? 4 : 0) + (m.empathy ? 2 : 0) + (m.rude ? 0 : 2) - m.jargon, 0, 10);
    const g = end && end.grade;
    const hand = !end ? 0 : (g.s ? 2 : 0) + (g.b ? 2 : 0) + (g.a ? 2 : 0) + (g.r ? 2 : 0) + (end.dispo === c.dispo ? 2 : 0);
    const total = Math.round(safe + dxPts + testPts + hist + comm + hand);
    return { total, safe, dxPts, testPts, hist, comm, hand, safety, missedTests, reds, got };
  }

  function chart() {
    const W = 640, H = 150, pts = E.riskLog, maxT = Math.max(1, pts[pts.length - 1][0]);
    const x = t => 8 + t / maxT * (W - 16), y = r => H - 10 - r / 100 * (H - 20);
    const line = pts.map(p => x(p[0]).toFixed(1) + ',' + y(p[1]).toFixed(1)).join(' ');
    const R = E.c.risk;
    const marks = E.log.filter(l => l.type === 'action' || l.type === 'harm').map(l => `<circle cx="${x(l.at).toFixed(1)}" cy="${y(riskAt(l.at)).toFixed(1)}" r="4" class="${l.type === 'harm' ? 'm-harm' : 'm-act'}"><title>${esc(l.text)}</title></circle>`).join('');
    return `<svg class="er-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="نسبة الخطر خلال الحالة"><line class="g-crit" x1="8" x2="${W - 8}" y1="${y(R.critical)}" y2="${y(R.critical)}"/><line class="g-urg" x1="8" x2="${W - 8}" y1="${y(R.urgent)}" y2="${y(R.urgent)}"/><polyline points="${line}"/>${marks}</svg>`;
  }
  const riskAt = t => { let r = E.riskLog[0][1]; for (const p of E.riskLog) { if (p[0] > t) break; r = p[1]; } return r; };
  const mm = t => { const m = Math.floor(t), s = Math.floor((t % 1) * 60); return `${m}:${String(s).padStart(2, '0')}`; };
  const IND = { indicated: 'مناسب', acceptable: 'مقبول', no: 'غير مطابق للاستطباب', harm: 'خطر الآن' };
  const RSN = { good: 'مبرّر', weak: 'تبرير ضعيف', none: 'بلا تبرير' };

  function conclude(end) {
    E.over = true;
    E.riskLog.push([E.sim, E.risk]);
    cancelAnimationFrame(tickId);
    $('view-er').dataset.stage = 'calm';
    $('er-input').disabled = true;
    ['er-send', 'er-test', 'er-end'].forEach(id => { $(id).disabled = true; });
    const c = E.c, s = score(end);
    const passed = s.total >= 70 && E.outcome !== 'arrest';
    const head = E.outcome === 'arrest' ? 'توقف قلب المريض قبل أن تستقر حالته' : E.outcome === 'stable' ? 'سلّمت المريض مستقراً' : 'سلّمت المريض وهو غير مستقر';
    const good = [], gaps = [];
    s.safety.forEach(k => {
      if (k.state === 'ontime') good.push(`${k.d.label}: عند الدقيقة ${mm(k.at)}`);
      else gaps.push(`<b>${esc(k.d.label)}</b>: ${k.state === 'late' ? 'تأخر إلى الدقيقة ' + mm(k.at) : 'لم يحدث'}. ${esc(k.d.why)}`);
    });
    E.harms.forEach(h => gaps.push(`<b>${esc(h.label)}</b>: ${esc(h.why)}`));
    if (E.wrongDoses) gaps.push('<b>الجرعات</b>: راجعتك الممرضة في جرعة غير صحيحة.');
    if (E.caught.length) gaps.push('أوقفت الممرضة أمراً غير آمن. في الواقع قد لا يوقفه أحد.');
    s.reds.filter(f => !s.got.includes(f)).forEach(f => gaps.push(`<b>لم تصل إليك هذه المعلومة</b>: «${esc(f.say)}»`));
    s.missedTests.forEach(id => gaps.push(`<b>فحص لازم لم تطلبه</b>: ${esc(testOf(id).ar)}. ${esc(c.results[id].why)}`));
    if (E.comm.introduced) good.push('عرّفت بنفسك.');
    if (E.comm.explained) good.push('شرحت ما يجري بكلام مفهوم.');
    else gaps.push(`<b>التواصل</b>: لم تشرح لـ${esc(c.companion.name)} ما يجري، وتدخلت ${E.comp.count} مرة.`);
    if (E.comm.rude) gaps.push('<b>التواصل</b>: خرج منك كلام جارح تحت الضغط.');
    const tests = Object.values(E.tests).map(t => `<tr><td dir="ltr">${esc(testOf(t.id).en)}</td><td class="i-${t.ind}">${IND[t.ind]}</td><td>${RSN[t.reasonOk] || ''}${t.reason ? `<small>${esc(t.reason)}</small>` : ''}</td><td>${esc((c.results[t.id] || {}).why || '')}</td></tr>`).join('');
    const box = $('er-debrief');
    box.hidden = false;
    box.innerHTML = `<div class="er-report-page">
      <div class="er-score" tabindex="-1"><b class="font-num">${s.total}</b><div><strong>${head}</strong><span>${passed ? 'مجتاز' : 'غير مجتاز'} · مدة الحالة ${mm(E.sim)}</span></div></div>
      <p><b>التشخيص الصحيح:</b> ${esc(c.dx.ar)}${end ? ` · <b>كتبت:</b> ${esc(end.dx)}` : ''}</p>
      <ul class="er-parts">
        <li>سلامة المريض <b class="font-num">${Math.round(s.safe)} / 40</b></li><li>التشخيص <b class="font-num">${s.dxPts} / 15</b></li>
        <li>الفحوصات <b class="font-num">${Math.round(s.testPts)} / 15</b></li><li>القصة وعلامات الخطر <b class="font-num">${Math.round(s.hist)} / 10</b></li>
        <li>التواصل <b class="font-num">${Math.round(s.comm)} / 10</b></li><li>التسليم والوجهة <b class="font-num">${s.hand} / 10</b></li>
      </ul>
      <h4>الخطر خلال الحالة</h4>${chart()}
      ${good.length ? `<h4>أحسنت</h4><ul class="er-good">${good.map(g => `<li>${esc(g)}</li>`).join('')}</ul>` : ''}
      ${gaps.length ? `<h4>ما يجب أن يتغير</h4><ul class="er-gaps">${gaps.map(g => `<li>${g}</li>`).join('')}</ul>` : ''}
      <h4>الفحوصات</h4>${tests ? `<div class="er-scroll"><table class="er-tests"><thead><tr><th>الفحص</th><th>الاستطباب</th><th>تبريرك</th><th>لماذا</th></tr></thead><tbody>${tests}</tbody></table></div>` : '<p>لم تطلب أي فحص.</p>'}
      ${end && end.grade.note ? `<h4>تسليمك</h4><p>${esc(end.grade.note)}</p>` : ''}
      <h4>الخلاصة</h4><p>${esc(c.brief)}</p>
      <p class="er-small">طلبت مساعدة المشرف ${E.helps} مرة، وبادر هو ${E.hints} مرة. الحالات والدرجات تدريبية ولم يراجعها طبيب بعد.</p>
      <div class="er-pane-f"><button type="button" class="s" id="er-home">الرئيسية</button><button type="button" class="s" id="er-again">أعد الحالة نفسها</button><button type="button" class="p" id="er-next">الحالة التالية</button></div>
    </div>`;
    $('er-again').onclick = () => begin(c.id);
    $('er-next').onclick = () => begin();
    $('er-home').onclick = () => { if (typeof navigateTo === 'function') navigateTo('home'); };
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
        questions: E.facts.size, score: `${s.total}% (${passed ? 'مجتاز' : 'غير مجتاز'})`, caseId: 'er_' + E.c.id, num: s.total, passed, ts: Date.now() });
      u.stats = u.stats || {};
      u.stats.completed = u.history.length;
      if (typeof saveAccountToStorage === 'function') saveAccountToStorage(u);
    } catch (e) { console.error(e); }
  }

  /* ---------- test order sheet ---------- */
  function openTests() {
    if (!E || E.over) return;
    const box = $('er-sheet');
    let pick = null;
    box.hidden = false;
    const groups = [['bed', 'بجانب السرير'], ['lab', 'المختبر'], ['img', 'الأشعة']];
    box.innerHTML = `<div class="er-pane" role="dialog" aria-modal="true" aria-labelledby="er-t-h">
      <h3 id="er-t-h">طلب فحص</h3>
      ${groups.map(([g, label]) => `<h4>${label}</h4><div class="er-tlist">${D.tests.filter(t => t.group === g).map(t => `<button type="button" class="er-t" data-t="${t.id}" aria-pressed="false"${E.tests[t.id] ? ' disabled' : ''}>${esc(t.en)}<small>${esc(t.ar)}</small></button>`).join('')}</div>`).join('')}
      <label>لماذا تطلبه؟ وماذا سيغيّر؟<input id="er-why" type="text" maxlength="140" autocomplete="off"></label>
      <div class="er-pane-f"><button type="button" class="s" id="er-t-x">رجوع للمريض</button><button type="button" class="p" id="er-t-go" disabled>اطلب</button></div>
    </div>`;
    const check = () => { $('er-t-go').disabled = !(pick && $('er-why').value.trim()); };
    box.querySelectorAll('.er-t').forEach(b => { b.onclick = () => { pick = b.dataset.t; box.querySelectorAll('.er-t').forEach(x => x.setAttribute('aria-pressed', String(x === b))); check(); $('er-why').focus(); }; });
    $('er-why').addEventListener('input', check);
    $('er-t-x').onclick = () => { box.hidden = true; $('er-input').focus(); };
    $('er-t-go').onclick = () => {
      box.hidden = true;
      const why = $('er-why').value.trim();
      person('me', `بدي ${testOf(pick).en}، ${why}`);
      const id = pick;
      chain = chain.then(async () => {
        const r = await call({ text: `اطلب ${testOf(id).en} لأن ${why}`, pending: { ask: `Judge this reason for ${testOf(id).en}. Sound reason here: ${(E.c.results[id] || {}).good || 'none in this patient'}. good, partial, wrong.` } });
        const g = r && r.read ? r.read.pending_ok : 'partial';
        if (E && !E.over) orderTest(id, why, g === 'good' ? 'good' : 'weak');
      }).catch(e => console.error(e));
      $('er-input').focus();
    };
  }

  /* ---------- starting ---------- */
  function begin(id) {
    if (tickId) cancelAnimationFrame(tickId);
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
      comp: { last: -9, count: 0, asked: false, addressed: 0, used: new Set(), extra: false }, comm: { introduced: false, explained: false, empathy: false, consent: false, rude: 0, jargon: 0 },
      harms: [], harmed: new Set(), reacted: false, caught: [], pending: null, queue: [], wrongDoses: 0, hint: -1, hints: 0, helps: 0, readAsks: 0, over: false, outcome: null, resolved: false
    };
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
    sys(p.arrival);
    person('p', p.opening);
    nurse(c.nurse.handoff);
    if (c.companion.lines.enter) { E.comp.last = E.utt + 1; person('c', pickOf(c.companion.lines.enter)); E.comp.asked = true; }
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
    // Starting to type is an event like any other: a worried relative does not wait for you to finish.
    $('er-input').addEventListener('input', () => { if (E && !E.typedThisTurn && $('er-input').value.length >= 3) { E.typedThisTurn = true; director('typing'); } });
    $('er-test').addEventListener('click', openTests);
    $('er-end').addEventListener('click', openEnd);
    $('er-sheet').addEventListener('keydown', e => { if (e.key === 'Escape') { $('er-sheet').hidden = true; $('er-input').focus(); } });
  }

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
      await load();
      if (!E || E.over) begin();
      else $('er-input').focus();
    } catch (e) {
      console.error(e);
      $('er-feed').innerHTML = '<div class="er-msg k-sys"><p>تعذّر تحميل الحالات. تحقق من الاتصال ثم أعد المحاولة.</p></div>';
    }
  }

  window.nbOpenER = open;
  // Test hook for the browser checks.
  window.__nbER = { begin: id => begin(id), send, allergicTo, get E() { return E; }, get D() { return D; }, set api(v) { api = v; }, get api() { return api; }, jump(min) { if (E) E.sim += min; }, localRead, end: conclude, score, setRisk(r) { E.risk = r; } };
})();
