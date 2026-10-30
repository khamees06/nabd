/* =========================================================
   NABD — respiratory emergency room
   A network trained on DDXPlus (1,025,602 synthetic patients) ranks 49 conditions from the
   answers the student has collected so far. Patients come from the DDXPlus test split, which
   the network never saw. The patient speaks through Claude (api/resp-chat.js) in Jordanian Arabic,
   from the facts of its record only; when Claude is out of reach, it answers from a fixed table.
   ========================================================= */
(() => {
  'use strict';

  const DATA = 'data/';
  const API = /\.vercel\.app$/.test(location.hostname) ? '/api/resp-chat' : 'https://nabd-smoky-one.vercel.app/api/resp-chat';
  const RESP = new Set(['URTI', 'Viral pharyngitis', 'Acute laryngitis', 'Bronchitis', 'Acute rhinosinusitis',
    'Chronic rhinosinusitis', 'Allergic sinusitis', 'Whooping cough', 'Sarcoidosis',
    'Bronchospasm / acute asthma exacerbation', 'Acute COPD exacerbation / infection', 'Pneumonia', 'Influenza',
    'Tuberculosis', 'Bronchiectasis', 'Bronchiolitis', 'Pulmonary neoplasm', 'Pulmonary embolism',
    'Spontaneous pneumothorax', 'Epiglottitis', 'Croup', 'Larygospasm']);
  const NAMES = {
    M: ['أحمد', 'محمد', 'خالد', 'عمر', 'يوسف', 'سامر', 'حسن', 'علي', 'زيد', 'فراس', 'إبراهيم', 'مهند'],
    F: ['سارة', 'ليلى', 'ريم', 'هبة', 'دينا', 'نور', 'رنا', 'لينا', 'مريم', 'سلمى', 'رهف', 'آية']
  };

  let M = null, POOL = null, T = null, L = null, CL = null;
  let evIndex = null, members = null, heads = null, loading = null;
  const S = { pt: null, tok: null, asked: new Set(), derived: new Set(), steps: [], exam: false, done: false, seen: new Set(), caseNo: 0 };

  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  // Isolated left-to-right so "<0.1%" keeps its order inside Arabic text.
  const pct = p => '⁦' + (p >= 0.995 ? '>99' : p < 0.001 ? '<0.1' : p * 100 >= 10 ? Math.round(p * 100) : (p * 100).toFixed(1)) + '%⁩';
  const CHILD = 6; // below this age the mother answers for the child
  const ageAr = n => n < 1 ? 'أقل من سنة' : n === 1 ? 'سنة واحدة' : n === 2 ? 'سنتان' : n <= 10 ? n + ' سنوات' : n + ' سنة';

  /* ---------- data ---------- */
  // One request at a time; a failed load can be tried again.
  const load = () => M ? Promise.resolve() : (loading = loading || fetchAll().catch(e => { loading = null; throw e; }));
  async function fetchAll() {
    const get = f => fetch(DATA + f).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); });
    const [m, p, t, cl] = await Promise.all([get('resp-model.json'), get('resp-patients.json'), get('resp-ar.json'), get('resp-clinical.json')]);
    CL = cl;
    // Weights arrive as int8 with one scale per output unit.
    L = m.layers.map(l => {
      const raw = atob(l.q);
      const w = new Float32Array(raw.length);
      for (let i = 0; i < raw.length; i++) w[i] = ((raw.charCodeAt(i) << 24) >> 24) * l.scale[i % l.cols];
      return { rows: l.rows, cols: l.cols, w, b: Float32Array.from(l.b) };
    });
    evIndex = Object.fromEntries(m.encoder.evidences.map((n, i) => [n, i]));
    members = m.encoder.groups.map(() => []);
    m.encoder.evidences.forEach((n, i) => members[m.encoder.ev_group[i]].push(n));
    members.forEach((list, g) => {
      const parent = m.encoder.groups[g];
      list.sort((a, b) => (a === parent ? -1 : b === parent ? 1 : 0));
    });
    // A few DDXPlus groups are named after a parent that is not itself a question
    // (diabetes sits under E_68, COPD under E_122); their first member leads instead.
    heads = m.encoder.groups.map((parent, g) => (m.meta.evidences[parent] ? parent : members[g][0]));
    M = m; POOL = p.patients.filter(plausible); T = t;
  }

  // DDXPlus draws antecedents without regard to age, so a few toddlers smoke or work in mines.
  // Those records stay out of the room.
  const ADULT_ONLY = new Set(['E_79', 'E_191', 'E_78', 'E_61', 'E_62', 'E_115', 'E_189', 'E_27', 'E_123', 'E_31', 'E_72', 'E_198', 'E_199', 'E_200']);
  const plausible = c => c.age >= 12 || !c.ev.some(t => ADULT_ONLY.has(t.split('_@_')[0]));

  /* ---------- the network ---------- */
  // Questions answered by implication (see IMPLIED) stay out of the input: the network only
  // knows the record, where that answer is missing.
  const net = asked => (S.derived.size ? new Set([...asked].filter(g => !S.derived.has(g))) : asked);
  function encode(asked) {
    const E = M.encoder, x = new Map();
    E.evidences.forEach((n, i) => { if (asked.has(E.ev_group[i])) x.set(E.asked_base + i, 1); });
    for (const tok of S.pt.ev) {
      const g = E.ev_group[evIndex[tok.split('_@_')[0]]];
      const c = E.value_col[tok];
      if (asked.has(g) && c != null) x.set(c, 1);
    }
    x.set(E.age_col, S.pt.age / E.age_scale);
    if (S.pt.sex === 'F') x.set(E.sex_col, 1);
    return x;
  }

  function predict(asked) {
    const x = encode(asked);
    let h = Float32Array.from(L[0].b);
    for (const [c, v] of x) {
      const off = c * L[0].cols;
      for (let j = 0; j < L[0].cols; j++) h[j] += v * L[0].w[off + j];
    }
    for (let k = 1; k < L.length; k++) {
      for (let j = 0; j < h.length; j++) if (h[j] < 0) h[j] = 0;
      const o = Float32Array.from(L[k].b);
      for (let i = 0; i < L[k].rows; i++) {
        const v = h[i];
        if (!v) continue;
        const off = i * L[k].cols;
        for (let j = 0; j < L[k].cols; j++) o[j] += v * L[k].w[off + j];
      }
      h = o;
    }
    const mx = Math.max(...h);
    let sum = 0;
    const p = Array.from(h, v => { const e = Math.exp(v - mx); sum += e; return e; });
    return p.map(v => v / sum);
  }

  /* ---------- the patient ---------- */
  function startPatient(forced) {
    const sev = c => M.meta.severity[M.classes[c.path]];
    // Mostly everyday cases; now and then a dangerous one the student must recognise.
    const r = Math.random();
    const band = r < 0.7 ? [4, 5] : r < 0.9 ? [3] : [1, 2];
    let pick = POOL.filter((c, i) => band.includes(sev(c)) && !S.seen.has(i));
    if (!pick.length) { S.seen.clear(); pick = POOL.filter(c => band.includes(sev(c))); }
    const pt = forced != null ? POOL[forced] : pick[Math.floor(Math.random() * pick.length)];
    S.seen.add(POOL.indexOf(pt));
    S.caseNo++;
    S.pt = pt;
    S.tok = new Map();
    for (const t of pt.ev) {
      const [n, v] = t.split('_@_');
      if (!S.tok.has(n)) S.tok.set(n, []);
      if (v != null) S.tok.get(n).push(v);
    }
    const names = NAMES[pt.sex] || NAMES.M;
    S.name = names[Math.floor(Math.random() * names.length)];
    S.asked = new Set([M.encoder.ev_group[evIndex[pt.init]]]);
    S.derived = new Set();
    // The same patient always has the same readings and results.
    S.rng = seeded(1 + POOL.indexOf(pt) * 7919);
    S.vit = vitalsFor(pt);
    S.measured = false;
    S.tests = [];
    S.results = {};
    S.chat = [];
    S.steps = [{ label: 'الشكوى الأولى', p: predict(S.asked) }];
    S.done = false;
    S.facts = factsFor();
  }

  // What the record says, one line per question in the table's precise wording. The server decides
  // yes or no from this list; Claude only puts the answer into words.
  function factsFor() {
    const out = [];
    const meta = M.meta.evidences;
    heads.forEach((n, g) => {
      // A few DDXPlus records say both "smokes" and "used to smoke": the current habit wins.
      if (n === 'E_191' && S.tok.has('E_79')) return;
      // a: the precise formal wording; j: the same answer as the patient would say it in Jordanian.
      const say = (m, formal) => (meta[m].type === 'B' ? line(m, 'yes', formal) : fillValues(m, line(m, 'yes', formal)));
      if (isDerived(g)) { out.push({ id: n, a: line(n, 'yes', true), j: line(n, 'yes') }); return; }
      members[g].forEach(m => { if (S.tok.has(m) && T.evidences[m]) out.push({ id: m, a: say(m, true), j: say(m, false) }); });
    });
    return out;
  }

  const joinAr = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join('، ') + ' و' + a[a.length - 1];
  function fillValues(name, tpl) {
    const vals = (S.tok.get(name) || []).map(v => (/^\d+$/.test(v) ? v : (T.values[v] || v)));
    return tpl.replace('{v}', joinAr(vals));
  }

  // Below CHILD the mother speaks about her son or daughter; women answer in the feminine.
  const young = () => S.pt.age < CHILD;
  const fem = () => S.pt.sex === 'F';
  // Shown lines are plain Jordanian (yj/nj...); `formal` gives the precise standard-Arabic wording.
  function line(n, key, formal) {
    const t = T.evidences[n];
    const y = key === 'yes';
    if (!t) return y ? 'آه.' : 'لا.';
    if (young()) {
      const s = fem() ? 'f' : 'm';
      return (!formal && t[(y ? 'cyj_' : 'cnj_') + s]) || t[(y ? 'cy_' : 'cn_') + s] || t[key];
    }
    if (!formal) { const j = t[(y ? 'yj' : 'nj') + (fem() ? '_f' : '')]; if (j) return j; }
    return (fem() && t[key + '_f']) || t[key];
  }
  const qText = n => {
    const t = T.evidences[n];
    if (!t) return '';
    return (S.pt && young() && t[fem() ? 'q_cf' : 'q_cm']) || t.q;
  };

  // A DDXPlus record lists only the signs of its own disease's symptom set, so a whooping-cough
  // record never says "cough" and an epiglottitis record never says "sore throat". These signs
  // imply the answer the patient would really give.
  const THROAT = ['V_148', 'V_20', 'V_21', 'V_115', 'V_33'];
  const IMPLIED = {
    E_201: () => ['E_45', 'E_77', 'E_166', 'E_203', 'E_112', 'E_202'].some(n => S.tok.has(n)),
    E_97: () => (S.tok.get('E_55') || []).some(v => THROAT.includes(v))
  };
  const isDerived = g => { const h = heads[g]; return !!IMPLIED[h] && !S.tok.has(h) && IMPLIED[h](); };

  // A question and its follow-ups are answered together, as a patient describes a symptom.
  function answer(g, formal) {
    const head = heads[g];
    const meta = M.meta.evidences;
    if (isDerived(g)) return line(head, 'yes', formal);
    // "Do you smoke?" to a former smoker: no, but he used to (DDXPlus keeps the two apart).
    if (head === 'E_79' && !S.tok.has('E_79') && S.tok.has('E_191')) return line('E_79', 'no', formal) + ' ' + line('E_191', 'yes', formal).replace(/^(آه|نعم)،\s*/, '');
    if (head === 'E_191' && S.tok.has('E_79')) return line('E_79', 'yes', formal);
    if (!S.tok.has(head) && meta[head].type === 'B') return line(head, 'no', formal);
    const parts = members[g].filter(n => S.tok.has(n) && T.evidences[n]).map(n => (meta[n].type === 'B' ? line(n, 'yes', formal) : fillValues(n, line(n, 'yes', formal))));
    return parts.length ? parts.join(' ') : line(head, 'no', formal);
  }

  /* ---------- vitals and tests ---------- */
  // DDXPlus records carry no vital signs or results, so data/resp-clinical.json holds illustrative
  // ranges for each condition; each patient's values are drawn inside them. The network never sees them.
  function seeded(a) {
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hasEv = (pt, n) => pt.ev.some(t => t.split('_@_')[0] === n);
  const band = age => (age < 1 ? 'infant' : age < 6 ? 'toddler' : age < 12 ? 'school' : 'adult');

  function vitalsFor(pt) {
    const c = CL.conditions[M.classes[pt.path]];
    const V = c.vitals[pt.age < 1 ? 'infant' : pt.age < 12 ? 'child' : 'adult'];
    const r = S.rng;
    // Breathless patients sit in the worse half of the ranges, the others in the milder half.
    const s = hasEv(pt, 'E_66') ? 0.45 + 0.55 * r() : 0.5 * r();
    const near = () => Math.max(0, Math.min(1, s + (r() - 0.5) * 0.3));
    const at = (k, f) => V[k][0] + f * (V[k][1] - V[k][0]);
    // Fever follows the record: a patient who denies it has a normal temperature.
    const temp = !hasEv(pt, 'E_91') ? 36.5 + 0.8 * r() : c.febrile ? at('temp', r()) : 37.8 + 0.8 * r();
    const sbp = Math.round(at('sbp', r()));
    return {
      s, hr: Math.round(at('hr', near())), sbp, dbp: Math.min(Math.round(at('dbp', r())), sbp - 25),
      rr: Math.round(at('rr', near())), spo2: Math.round(V.spo2[1] - s * (V.spo2[1] - V.spo2[0])), temp: Math.round(temp * 10) / 10
    };
  }

  // Normal ranges by age (PALS-style); a reading outside them lights its tile.
  const NORMAL = {
    infant: { hr: [100, 160], rr: [30, 53], sbp: [72, 104], txt: 'الرضيع' },
    toddler: { hr: [80, 140], rr: [22, 37], sbp: [86, 106], txt: 'الطفل من سنة إلى 5 سنوات' },
    school: { hr: [70, 120], rr: [18, 25], sbp: [97, 115], txt: 'الطفل من 6 إلى 11 سنة' },
    adult: { hr: [50, 110], rr: [12, 21], sbp: [100, 159] }
  };
  window.nbRespVitals = {
    warn(k, v) {
      const N = NORMAL[band(S.pt ? S.pt.age : 30)];
      if (k === 'hr') return v < N.hr[0] || v > N.hr[1];
      if (k === 'rr') return v < N.rr[0] || v > N.rr[1];
      if (k === 'bp') { const s = parseInt(String(v), 10); return s < N.sbp[0] || s > N.sbp[1] + 15; }
      if (k === 'spo2') return v <= 94;
      if (k === 'temp') return v >= 38 || v <= 36;
      return false;
    },
    // Adults keep the monitor's own texts; children get theirs.
    range(k) {
      const N = S.pt && NORMAL[band(S.pt.age)];
      if (!N || !N.txt) return null;
      if (k === 'hr') return `النبض — الطبيعي عند ${N.txt}: ${N.hr[0]}–${N.hr[1]} نبضة في الدقيقة.`;
      if (k === 'rr') return `التنفس — الطبيعي عند ${N.txt}: ${N.rr[0]}–${N.rr[1]} نفساً في الدقيقة.`;
      if (k === 'bp') return `الضغط — الانقباضي الطبيعي عند ${N.txt}: ${N.sbp[0]}–${N.sbp[1]} ملم زئبق.`;
      return null;
    }
  };
  const ECG_REF = { infant: '100-160', toddler: '80-140', school: '70-120', adult: '60-100' };

  const TILES = { hr: 'rs-v-hr', bp: 'rs-v-bp', spo2: 'rs-v-spo2', temp: 'rs-v-temp', rr: 'rs-v-rr' };
  function showVitals(v) {
    $(TILES.hr).textContent = v ? v.hr : '--';
    $(TILES.bp).textContent = v ? v.sbp + '/' + v.dbp : '--/--';
    $(TILES.spo2).textContent = v ? v.spo2 : '--';
    $(TILES.temp).textContent = v ? v.temp.toFixed(1) : '--.-';
    $(TILES.rr).textContent = v ? v.rr : '--';
    $('rs-v-note').textContent = v ? 'اضغط على أي قراءة لتعرف معدلها الطبيعي.' : 'اضغط «قِس الآن» لعرض القراءات.';
  }
  const vitalsLine = v => `النبض ${v.hr}، الضغط ${v.sbp}/${v.dbp}، الأكسجين ${v.spo2}%، الحرارة ${v.temp.toFixed(1)}، التنفس ${v.rr}`;
  function measure() {
    if (!S.pt || S.done) return;
    showVitals(S.vit);
    if (!S.measured) say('sys', 'قِست العلامات الحيوية: ' + vitalsLine(S.vit) + '.');
    S.measured = true;
  }

  const catOf = id => CL.catalog.find(c => c.id === id);
  function renderTests() {
    const groups = [['img', 'الأشعة'], ['lab', 'المختبر'], ['bed', 'بجانب السرير']];
    $('rs-tests').innerHTML = groups.map(([g, label]) => `<h4>${label}</h4><div class="rs-tlist">${CL.catalog.filter(c => c.group === g).map(c => {
      const on = S.tests.includes(c.id);
      return `<button type="button" class="rs-t${on ? ' is-on' : ''}" data-t="${c.id}" aria-pressed="${on}"><b>${esc(c.ar)}</b><small dir="ltr">${esc(c.en)}</small></button>`;
    }).join('')}</div>`).join('');
    $('rs-tcount').textContent = String(S.tests.length);
  }

  const decimals = (r, v) => (r.param === 'pH' || r.hi < 1 ? 2 : String(r.lo).includes('.') || String(r.hi).includes('.') || r.hi <= 30 ? 1 : 0);
  // "4.0-11.0", "< 5", ">= 0.70", "M 13.0-17.0; F 12.0-15.5", "12.0-16.0 (F); 13.5-17.5 (M)"
  function flagOf(ref, v) {
    let s = String(ref);
    if (s.includes(';')) s = s.split(';').find(p => (fem() ? /\bF\b/ : /\bM\b/).test(p)) || s;
    s = s.replace(/\([^)]*\)|\b[MF]\b/g, '').trim();
    let m = s.match(/^(-?[\d.]+)\s*-\s*([\d.]+)$/);
    if (m) return v < +m[1] ? 'lo' : v > +m[2] ? 'hi' : '';
    if ((m = s.match(/^<=?\s*([\d.]+)$/))) return v > +m[1] ? 'hi' : '';
    if ((m = s.match(/^>=?\s*([\d.]+)$/))) return v < +m[1] ? 'lo' : '';
    return '';
  }

  function resultFor(id) {
    if (S.results[id]) return S.results[id];
    const t = CL.conditions[M.classes[S.pt.path]].tests[id] || {};
    const r = S.rng, v = S.vit, b = band(S.pt.age);
    let rows = (t.rows || []).map(x => ({ ...x }));
    if (id === 'peak_flow' && S.pt.age < 6) rows = rows.map(x => ({ param: x.param, text: 'Unable to perform (age)', unit: '', ref: x.ref }));
    rows.forEach(x => {
      if (x.text != null || x.lo == null) return;
      if (id === 'ecg' && /rate/i.test(x.param)) { x.val = v.hr; x.ref = ECG_REF[b]; return; }
      // Oxygen in the blood gas follows the saturation on the monitor.
      if (id === 'abg' && /PaO2/.test(x.param)) { x.val = x.hi - v.s * (x.hi - x.lo); return; }
      x.val = x.lo + r() * (x.hi - x.lo);
    });
    const get = re => rows.find(x => re.test(x.param) && x.val != null);
    if (id === 'abg') {
      // pH from Henderson-Hasselbalch, so the gas is always internally consistent.
      const ph = get(/^pH$/), co2 = get(/PaCO2/), hco3 = get(/HCO3/);
      if (ph && co2 && hco3) ph.val = 6.1 + Math.log10(hco3.val / (0.0307 * co2.val));
    }
    if (id === 'cbc') {
      // Leave room for monocytes and basophils in the differential.
      const n = get(/Neutro/), l = get(/Lympho/), e = get(/Eosino/);
      if (n && l && e && n.val + l.val + e.val > 97) l.val -= n.val + l.val + e.val - 97;
    }
    rows.forEach(x => {
      if (x.val == null) { x.shown = x.text || ''; return; }
      const d = decimals(x, x.val);
      x.val = Number(x.val.toFixed(d));
      x.shown = x.val.toFixed(d);
      x.flag = flagOf(x.ref, x.val);
    });
    return (S.results[id] = { rows, report: t.report || '', summary: t.summary_ar || '' });
  }

  function labCard(id, open) {
    const c = catOf(id), res = resultFor(id);
    const table = res.rows.length ? `<table class="rs-lab" dir="ltr"><thead><tr><th>Test</th><th>Result</th><th>Reference</th></tr></thead><tbody>${res.rows.map(x =>
      `<tr${x.flag ? ` class="is-${x.flag}"` : ''}><td>${esc(x.param)}</td><td><b>${esc(x.shown)}</b>${x.unit ? ` <small>${esc(x.unit)}</small>` : ''}${x.flag ? ` <i>${x.flag === 'hi' ? 'H' : 'L'}</i>` : ''}</td><td>${esc(x.ref)}</td></tr>`).join('')}</tbody></table>` : '';
    const report = res.report ? `<p class="rs-report" dir="ltr">${esc(res.report)}</p>` : '';
    // In exam mode the meaning waits for the result screen.
    const mean = res.summary && (open || !S.exam) ? `<details class="rs-mean"${open ? ' open' : ''}><summary>ماذا تعني النتيجة؟</summary><p>${esc(res.summary)}</p></details>` : '';
    return `<div class="rs-labcard"><div class="rs-lab-h"><b>${esc(c.ar)}</b><bdi dir="ltr">${esc(c.en)}</bdi></div>${table}${report}${mean}</div>`;
  }

  function orderTest(id) {
    if (!S.pt || S.done || !catOf(id)) return;
    if (S.tests.includes(id)) { say('sys', 'سبق أن طلبت هذا الفحص، ونتيجته في المحادثة أعلاه.'); return; }
    S.tests.push(id);
    say('lab', '', labCard(id));
    renderTests();
    // On a phone the panel sits below the chat: bring the result into view.
    if (window.innerWidth < 1024) document.querySelector('#view-resp .rs-chat').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Typed orders ("اعمل صورة صدر", "بدي CBC") go to the tests, not to the patient.
  const TEST_CUES = {
    cxr: ['صوره صدر', 'صوره للصدر', 'اشعه صدر', 'اشعه للصدر', 'اشعه الصدر', 'x-ray', 'xray', 'cxr'],
    ctpa: ['صوره طبقيه', 'طبقي', 'ctpa', 'ct'],
    neck_xray: ['اشعه رقبه', 'اشعه للرقبه', 'صوره رقبه', 'صوره للرقبه'],
    cbc: ['cbc', 'تعداد دم', 'صوره دم', 'فحص دم'],
    crp: ['crp', 'مؤشرات الالتهاب', 'procalcitonin'],
    abg: ['abg', 'غازات'],
    ddimer: ['دايمر', 'd-dimer', 'ddimer'],
    viral_pcr: ['pcr', 'مسحه فيروسات', 'مسحه انفلونزا', 'مسحه كورونا'],
    strep: ['strep', 'عقديات', 'مسحه حلق', 'مسحه للحلق'],
    sputum: ['زراعه بلغم', 'فحص بلغم', 'عينه بلغم', 'afb', 'genexpert'],
    ecg: ['تخطيط قلب', 'تخطيط للقلب', 'ecg', 'ekg'],
    peak_flow: ['peak flow', 'ذروه الجريان', 'spirometry', 'سبايرومتري']
  };
  function matchTests(text) {
    const t = ' ' + norm(text) + ' ';
    return Object.keys(TEST_CUES).filter(id => TEST_CUES[id].some(c => t.includes(' ' + c + ' ') || (c.includes(' ') && t.includes(c))));
  }
  const VITAL_CUE = /(قيس|قس|اقيس|نقيس|افحص) .*(العلامات|الضغط|النبض|الحراره|الاكسجين)|vitals|علامات حيويه/;

  /* ---------- understanding the question ---------- */
  const norm = s => String(s).replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[؟?!.,،:؛()"'«»\-_/]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const STOP = new Set(['هل', 'لديك', 'عندك', 'تشعر', 'تعاني', 'من', 'في', 'او', 'ما', 'هو', 'هي', 'كان', 'اي', 'عن', 'علي', 'الي', 'مع', 'بعد', 'قبل', 'لك', 'انت', 'حاليا', 'مؤخرا', 'شي', 'شيء', 'اذا', 'يوجد', 'لا', 'نعم', 'اخر', 'الاخيره', 'الماضي', 'ايام', 'بشكل', 'عندكم', 'شو', 'ايش', 'في', 'كيف',
    // Jordanian fillers and pronouns ("عليك حرارة؟", "فيك وجع؟")
    'عليك', 'فيك', 'معك', 'الك', 'بتحس', 'حاسس', 'هلق', 'هسا', 'هسه', 'بدي', 'شوي', 'يعني', 'طيب', 'اخوي', 'عمي', 'خالتي', 'حجي', 'حجه']);
  // Arabic words change shape with clitics and patterns (تدخن، بتدخن، تدخين، دخان), so each word is
  // compared through a few stripped forms and a skeleton without its inner long vowels.
  const PRE = ['وال', 'بال', 'فال', 'لل', 'ال', 'بت', 'بي', 'بن', 'و', 'ف', 'ب', 'ل', 'ت', 'ي', 'ن', 'ا'];
  const SUF = ['تها', 'تين', 'تك', 'تي', 'ته', 'ات', 'ين', 'ون', 'ها', 'كم', 'نا', 'ك', 'ه', 'ي', 'ا'];
  function forms(w) {
    const out = new Set([w]);
    if (STOP.has(w)) return out; // small words compare whole: "لديك" must not shrink to "ديك"
    const add = s => { if (s.length >= 3) out.add(s); };
    PRE.forEach(p => { if (w.startsWith(p)) add(w.slice(p.length)); });
    [...out].forEach(s => SUF.forEach(x => { if (s.endsWith(x)) add(s.slice(0, -x.length)); }));
    [...out].forEach(s => add(s[0] + s.slice(1).replace(/[اوي]/g, '')));
    return out;
  }
  let cues = null;
  function buildCues() {
    const toks = (s, stop) => norm(s).split(' ').filter(w => w.length > 1 && !(stop && STOP.has(w))).map(w => ({ w, f: forms(w) }));
    cues = Object.entries(T.evidences).map(([id, t]) => ({
      id, g: M.encoder.ev_group[evIndex[id]],
      // A cue keeps its small words when it has several ("عندك حساسية"), so it beats a bare "حساسية".
      alt: (t.alt || []).map(a => { const all = toks(a, false); return { len: norm(a).length, toks: all.length > 1 ? all : toks(a, true) }; }).filter(a => a.toks.length),
      words: toks(t.q, true).filter(x => x.w.length > 2)
    }));
  }
  function matchLocal(text) {
    const words = norm(text).split(' ').filter(w => w.length > 1).map(w => ({ w, f: forms(w) }));
    // 1 when the student's word is the cue word or reduces to it; 0.6 when the two only share a
    // three-letter stem, which is weak: "لحميات" (polyps) shrinks to "حمي" (fever).
    const hit = tok => {
      let q = 0;
      for (const x of words) {
        if (x.w === tok.w || x.f.has(tok.w)) return 1;
        // Small words only match whole ("الديكي" shrinks to "لديك").
        if (tok.w.length > 2 && x.w.length > 2 && !STOP.has(x.w)) for (const f of tok.f) if (x.f.has(f)) q = Math.max(q, f.length > 3 ? 1 : 0.6);
      }
      return q;
    };
    const best = new Map();
    for (const c of cues) {
      // The most specific matching cue counts in full; more cues and question words only add a little,
      // so a generic word repeated across many cues ("وجع") cannot outweigh a precise phrase.
      let top = 0, more = 0, qw = 0;
      for (const a of c.alt) {
        let qa = 1;
        for (const t of a.toks) { qa = Math.min(qa, hit(t)); if (!qa) break; }
        if (!qa) continue;
        const w = (2 * a.toks.length + Math.max(a.len, 4) / 6) * qa;
        if (w > top) { if (top) more += 0.4; top = w; } else more += 0.4;
      }
      for (const w of c.words) qw += 0.6 * hit(w);
      const score = top + Math.min(more, 1.2) + Math.min(qw, 1.8);
      if (score > (best.get(c.g)?.score || 0)) best.set(c.g, { g: c.g, id: c.id, score });
    }
    return [...best.values()].filter(b => b.score >= 2.6).sort((a, b) => b.score - a.score);
  }
  const GREET = /^(مرحب|اهلا|هلا|السلام|سلام|صباح|مساء|هاي|كيفك|كيف حالك|كيف الحال|شلونك)/;

  // The patient speaks through Claude on the Vercel site; the GitHub Pages copy and the local test
  // server call the same endpoint across origins. Without a key (404/405/503) or across two failures
  // in a row it is switched off, and the room answers from its table.
  let api = location.protocol === 'file:' ? 'off' : 'try';
  let apiFails = 0;
  async function chatApi(text) {
    if (api === 'off') return null;
    try {
      const r = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          text, history: S.chat.slice(0, -1).slice(-12), facts: S.facts, chief: S.pt.init,
          patient: { age: S.pt.age, sex: S.pt.sex, name: S.name, speaker: young() ? 'mother' : 'self' }
        })
      });
      if (!r.ok) {
        if ([403, 404, 405, 503].includes(r.status) || ++apiFails >= 2) api = 'off';
        return null;
      }
      const j = await r.json();
      if (typeof j.reply !== 'string' || !j.reply.trim()) return null;
      api = 'on'; apiFails = 0;
      return { ids: (Array.isArray(j.ids) ? j.ids : []).filter(id => evIndex[id] != null), reply: j.reply.trim() };
    } catch (e) {
      if (++apiFails >= 2) api = 'off';
      return null;
    }
  }

  /* ---------- body map ---------- */
  // [view, x, y] on a 200 x 440 figure; front view shows the patient's right on the left.
  const LOC = {
    V_62: ['f', 100, 14], V_89: ['f', 100, 27], V_166: ['f', 79, 35], V_167: ['f', 121, 35], V_125: ['f', 90, 39], V_126: ['f', 110, 39],
    V_129: ['f', 75, 45], V_130: ['f', 125, 45], V_122: ['f', 100, 47], V_108: ['f', 86, 51], V_109: ['f', 114, 51], V_110: ['f', 90, 54], V_111: ['f', 110, 54],
    V_32: ['f', 100, 58], V_117: ['f', 96, 56], V_116: ['f', 96, 61], V_188: ['f', 94, 58], V_189: ['f', 106, 58], V_41: ['f', 92, 58], V_42: ['f', 108, 58],
    V_59: ['f', 96, 57], V_60: ['f', 104, 57], V_57: ['f', 96, 60], V_58: ['f', 104, 60], V_91: ['f', 100, 56], V_90: ['f', 100, 61], V_61: ['f', 100, 59],
    V_162: ['f', 100, 62], V_137: ['f', 100, 57], V_115: ['f', 100, 60], V_148: ['f', 100, 63], V_20: ['f', 95, 62], V_21: ['f', 105, 62],
    V_118: ['f', 100, 69], V_121: ['f', 87, 64], V_163: ['f', 100, 73], V_33: ['f', 100, 80], V_174: ['f', 100, 88], V_53: ['f', 90, 80], V_54: ['f', 110, 80],
    V_194: ['f', 56, 100], V_195: ['f', 144, 100], V_101: ['f', 100, 112], V_159: ['f', 82, 128], V_160: ['f', 118, 128], V_29: ['f', 100, 152],
    V_55: ['f', 66, 140], V_56: ['f', 134, 140], V_18: ['f', 64, 118], V_19: ['f', 136, 118], V_197: ['f', 100, 170], V_103: ['f', 80, 172], V_104: ['f', 120, 172],
    V_187: ['f', 100, 200], V_84: ['f', 69, 195], V_85: ['f', 131, 195], V_87: ['f', 80, 226], V_88: ['f', 120, 226], V_49: ['f', 70, 222], V_50: ['f', 130, 222],
    V_14: ['f', 73, 232], V_15: ['f', 127, 232], V_16: ['f', 82, 248], V_17: ['f', 118, 248], V_153: ['f', 100, 250], V_99: ['f', 66, 250], V_100: ['f', 134, 250],
    V_155: ['f', 100, 262], V_158: ['f', 100, 268], V_168: ['f', 96, 268], V_169: ['f', 104, 268], V_36: ['f', 100, 258], V_95: ['f', 97, 262], V_96: ['f', 103, 262],
    V_146: ['f', 98, 263], V_147: ['f', 102, 263], V_139: ['f', 100, 264], V_140: ['f', 99, 264], V_141: ['f', 101, 264], V_186: ['f', 100, 264], V_190: ['f', 100, 262],
    V_185: ['f', 100, 259], V_102: ['f', 100, 264], V_94: ['f', 100, 268],
    V_30: ['f', 50, 140], V_31: ['f', 150, 140], V_45: ['f', 43, 176], V_46: ['f', 157, 176], V_27: ['f', 37, 205], V_28: ['f', 163, 205], V_78: ['f', 37, 212], V_79: ['f', 163, 212],
    V_80: ['f', 32, 238], V_81: ['f', 168, 238], V_142: ['f', 29, 256], V_143: ['f', 171, 256], V_151: ['f', 37, 262], V_152: ['f', 163, 262],
    V_67: ['f', 31, 276], V_68: ['f', 169, 276], V_69: ['f', 28, 280], V_70: ['f', 172, 280], V_63: ['f', 25, 278], V_64: ['f', 175, 278], V_65: ['f', 22, 274], V_66: ['f', 178, 274],
    V_51: ['f', 80, 300], V_52: ['f', 120, 300], V_92: ['f', 81, 342], V_93: ['f', 119, 342], V_172: ['f', 82, 375], V_173: ['f', 118, 375],
    V_34: ['f', 83, 412], V_35: ['f', 117, 412], V_72: ['f', 82, 424], V_73: ['f', 118, 424], V_43: ['f', 75, 425], V_44: ['f', 125, 425],
    V_97: ['f', 88, 432], V_98: ['f', 112, 432], V_131: ['f', 85, 434], V_132: ['f', 115, 434], V_133: ['f', 82, 434], V_134: ['f', 118, 434],
    V_135: ['f', 79, 433], V_136: ['f', 121, 433], V_144: ['f', 76, 432], V_145: ['f', 124, 432],
    V_25: ['b', 100, 40], V_124: ['b', 100, 54], V_26: ['b', 100, 78], V_38: ['b', 100, 86], V_175: ['b', 118, 93], V_176: ['b', 82, 93],
    V_127: ['b', 124, 126], V_128: ['b', 76, 126], V_170: ['b', 121, 152], V_171: ['b', 79, 152], V_39: ['b', 100, 140], V_40: ['b', 100, 205],
    V_37: ['b', 100, 250], V_113: ['b', 118, 190], V_114: ['b', 82, 190], V_82: ['b', 116, 262], V_83: ['b', 84, 262], V_177: ['b', 150, 140], V_178: ['b', 50, 140],
    V_74: ['b', 168, 238], V_75: ['b', 32, 238], V_76: ['b', 171, 256], V_77: ['b', 29, 256], V_105: ['b', 120, 300], V_106: ['b', 80, 300],
    V_47: ['b', 119, 342], V_48: ['b', 81, 342], V_119: ['b', 118, 378], V_120: ['b', 82, 378], V_23: ['b', 117, 412], V_24: ['b', 83, 412],
    V_164: ['b', 117, 428], V_165: ['b', 83, 428], V_149: ['b', 117, 434], V_150: ['b', 83, 434]
  };
  const KINDS = [['E_55', 'pain', 'مكان الألم'], ['E_57', 'spread', 'ينتشر إلى'], ['E_133', 'rash', 'مكان الطفح'], ['E_152', 'swell', 'مكان التورم']];
  const FIGURE = `<g class="rs-fig"><ellipse cx="100" cy="42" rx="23" ry="29"/><rect x="90" y="66" width="20" height="24" rx="6"/>
    <path d="M58 96 Q100 84 142 96 Q152 100 150 114 L144 250 Q100 262 56 250 L50 114 Q48 100 58 96 Z"/>
    <polyline points="56,102 44,176 34,240 29,266"/><polyline points="144,102 156,176 166,240 171,266"/>
    <polyline points="80,248 81,342 83,414"/><polyline points="120,248 119,342 117,414"/>
    <ellipse cx="83" cy="427" rx="9" ry="6"/><ellipse cx="117" cy="427" rx="9" ry="6"/></g>`;

  function bodyMap() {
    const marks = [];
    KINDS.forEach(([ev, kind, label]) => {
      if (!S.asked.has(M.encoder.ev_group[evIndex[ev]])) return;
      (S.tok.get(ev) || []).forEach(v => { if (LOC[v]) marks.push({ kind, label, v, at: LOC[v] }); });
    });
    const host = $('rs-body');
    if (!marks.length) { host.hidden = true; return; }
    host.hidden = false;
    const fig = view => {
      const own = marks.filter(m => m.at[0] === view);
      // When everything marked in a view sits on the head and neck, zoom in on them.
      const zoom = own.length && own.every(m => m.at[2] < 100);
      const box = zoom ? '40 0 120 108' : '0 0 200 444';
      const r = zoom ? 2.4 : 5;
      const pains = own.filter(m => m.kind === 'pain');
      const lines = own.filter(m => m.kind === 'spread').flatMap(s => pains.map(p => `<line class="rs-spread-line" x1="${p.at[1]}" y1="${p.at[2]}" x2="${s.at[1]}" y2="${s.at[2]}" style="stroke-width:${zoom ? 0.8 : 1.6}"/>`)).join('');
      const dots = own.map(m => `<circle class="rs-dot k-${m.kind}" cx="${m.at[1]}" cy="${m.at[2]}" r="${r}" style="stroke-width:${zoom ? 0.8 : 1.5}"><title>${esc(m.label + ': ' + (T.values[m.v] || m.v))}</title></circle>`).join('');
      return `<figure><svg viewBox="${box}" role="img" aria-label="${view === 'f' ? 'الجسم من الأمام' : 'الجسم من الخلف'}">${FIGURE}${lines}${dots}</svg><figcaption>${view === 'f' ? 'من الأمام' : 'من الخلف'}</figcaption></figure>`;
    };
    const legend = KINDS.filter(([, kind]) => marks.some(m => m.kind === kind)).map(([, kind, label]) =>
      `<li><i class="k-${kind}"></i>${label}: ${esc(joinAr([...new Set(marks.filter(m => m.kind === kind).map(m => T.values[m.v] || m.v))]))}</li>`).join('');
    host.innerHTML = `<h3>أين يشعر المريض؟</h3><div class="rs-figs">${fig('f')}${fig('b')}</div><ul class="rs-legend">${legend}</ul>`;
  }

  /* ---------- screen ---------- */
  function say(who, text, extra) {
    const feed = $('rs-feed');
    const d = document.createElement('div');
    d.className = 'rs-msg ' + who;
    const label = who === 'pt' ? (young() ? (fem() ? 'الأم عن طفلتها' : 'الأم عن طفلها') : S.name) : who === 'me' ? 'أنت' : '';
    d.innerHTML = (label ? `<span class="rs-who">${esc(label)}</span>` : '') + (text ? `<p>${esc(text)}</p>` : '') + (extra || '');
    feed.appendChild(d);
    feed.scrollTop = feed.scrollHeight;
    // The conversation so far goes with each question, so the patient keeps the thread.
    if (text && (who === 'pt' || who === 'me')) S.chat.push({ r: who === 'pt' ? 'p' : 's', t: text });
    return d;
  }

  function typing() {
    const d = document.createElement('div');
    d.className = 'rs-msg pt rs-typing';
    d.setAttribute('aria-label', 'المريض يكتب');
    d.innerHTML = '<span></span><span></span><span></span>';
    $('rs-feed').appendChild(d);
    $('rs-feed').scrollTop = $('rs-feed').scrollHeight;
    return d;
  }

  // Count the questions a reply answered: each new one is a step for the model and the score.
  function record(groups) {
    let added = false;
    groups.forEach(g => {
      if (S.asked.has(g)) return;
      S.asked.add(g);
      if (isDerived(g)) S.derived.add(g);
      S.steps.push({ label: qText(heads[g]), g, p: predict(net(S.asked)) });
      added = true;
    });
    if (!added) return;
    renderBars();
    renderAsked();
    bodyMap();
    renderQuestionList($('rs-qsearch').value);
  }

  function renderBars() {
    const box = $('rs-bars');
    const last = S.steps[S.steps.length - 1].p;
    if (S.exam && !S.done) {
      box.innerHTML = '<p class="rs-muted">وضع الامتحان: تظهر احتمالات النموذج بعد أن تسلّم تشخيصك.</p>';
      return;
    }
    const top = last.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 5);
    // Name and number on one line, the bar on its own line below, so nothing crosses the text.
    box.innerHTML = top.map(([p, i]) => `<div class="rs-bar"><span>${esc(T.conditions[M.classes[i]] || M.classes[i])}</span><b class="font-num">${pct(p)}</b><s class="rs-track" aria-hidden="true"><i style="width:${Math.max(2, p * 100).toFixed(1)}%"></i></s></div>`).join('');
  }

  function renderAsked() {
    $('rs-count').textContent = String(S.steps.length - 1);
  }

  const howAreYou = () => young() ? (fem() ? 'بنتي تعبانة شوي، عشان هيك جينا.' : 'ابني تعبان شوي، عشان هيك جينا.')
    : fem() ? 'الحمد لله، بس تعبانة شوي، عشان هيك إجيت.' : 'الحمد لله، بس تعبان شوي، عشان هيك إجيت.';

  async function onAsk(text) {
    text = (text || '').trim();
    if (!text || S.done) return;
    say('me', text);
    const input = $('rs-input');
    input.value = '';
    input.disabled = true;
    const caseNo = S.caseNo;
    try {
      const tests = matchTests(text);
      if (tests.length) { tests.forEach(orderTest); return; }
      if (VITAL_CUE.test(norm(text))) { measure(); return; }
      let groups = null;
      const dots = typing();
      const r = await chatApi(text);
      dots.remove();
      // The student may have submitted or moved to a new patient while the question was out.
      if (S.done || S.caseNo !== caseNo) return;
      if (r) {
        say('pt', r.reply);
        record([...new Set(r.ids.map(id => M.encoder.ev_group[evIndex[id]]))]);
        return;
      }
      {
        const found = matchLocal(text);
        if (found.length && (found.length === 1 || found[1].score < found[0].score * 0.85)) groups = [found[0].g];
        else if (found.length) {
          const chips = found.slice(0, 3).map(f => `<button type="button" class="rs-chip" data-g="${f.g}">${esc(qText(heads[f.g]))}</button>`).join('');
          say('sys', 'هل تقصد أحد هذه الأسئلة؟', `<div class="rs-chips">${chips}</div>`);
        } else if (GREET.test(norm(text))) {
          say('pt', /كيف|شلون/.test(text) ? howAreYou() : 'أهلين.');
        } else {
          say('sys', 'لم أفهم السؤال. جرّب صياغة أخرى، أو اختر من «قائمة الأسئلة».');
        }
      }
      if (groups) groups.forEach(askGroup);
    } finally {
      if (S.caseNo === caseNo && !S.done) { input.disabled = false; input.focus(); }
    }
  }

  function askGroup(g) {
    g = Number(g);
    if (S.done) return;
    if (S.asked.has(g)) {
      say('pt', answer(g), '<small class="rs-again">سبق أن سألت هذا السؤال.</small>');
      return;
    }
    say('pt', answer(g));
    record([g]);
  }

  function renderQuestionList(filter) {
    const f = norm(filter || '');
    const rows = [];
    heads.forEach((n, g) => {
      const t = T.evidences[n];
      if (!t) return;
      const q = qText(n);
      if (f && !norm(q + ' ' + t.q + ' ' + (t.alt || []).join(' ')).includes(f)) return;
      rows.push(`<button type="button" class="rs-q${S.asked.has(g) ? ' is-asked' : ''}" data-g="${g}">${esc(q)}</button>`);
    });
    $('rs-qlist').innerHTML = rows.join('') || '<p class="rs-muted">لا أسئلة بهذه الكلمة.</p>';
  }

  // Two steps: pick a diagnosis, then submit, so the urgency box can be ticked in any order.
  function openSubmit() {
    if (S.done) return;
    const resp = M.classes.map((c, i) => [c, i]).filter(([c]) => RESP.has(c));
    const other = M.classes.map((c, i) => [c, i]).filter(([c]) => !RESP.has(c));
    const btns = list => list.map(([c, i]) => `<button type="button" class="rs-dx" data-i="${i}" aria-pressed="false">${esc(T.conditions[c] || c)}</button>`)
      .sort((a, b) => a.localeCompare(b, 'ar')).join('');
    const box = $('rs-submit');
    let choice = null;
    box.hidden = false;
    box.innerHTML = `<div class="rs-sheet">
      <div class="rs-sheet-h"><h3 id="rs-submit-h">ما تشخيصك؟</h3><button type="button" class="rs-x" id="rs-submit-x" aria-label="إغلاق">✕</button></div>
      <input id="rs-dx-search" type="search" placeholder="ابحث عن مرض..." autocomplete="off" aria-label="ابحث عن مرض">
      <div class="rs-sheet-body">
        <h4>أمراض الجهاز التنفسي</h4><div class="rs-dxs">${btns(resp)}</div>
        <h4>أمراض أخرى</h4><div class="rs-dxs">${btns(other)}</div>
      </div>
      <div class="rs-sheet-f">
        <label class="rs-urgent"><input type="checkbox" id="rs-urgent"> قد تكون الحالة خطيرة: أطلب تقييماً عاجلاً من الطبيب</label>
        <div class="rs-pick"><span id="rs-pick" aria-live="polite">اختر تشخيصاً من القائمة.</span><button type="button" class="p" id="rs-go" disabled>سلّم</button></div>
      </div>
    </div>`;
    const close = () => { box.hidden = true; $('rs-dx-btn').focus(); };
    $('rs-submit-x').onclick = close;
    box.onclick = e => { if (e.target === box) close(); };
    box.onkeydown = e => { if (e.key === 'Escape') close(); };
    $('rs-dx-search').oninput = e => {
      const f = norm(e.target.value);
      box.querySelectorAll('.rs-dx').forEach(b => { b.hidden = !!f && !norm(b.textContent + ' ' + M.classes[b.dataset.i]).includes(f); });
    };
    box.querySelectorAll('.rs-dx').forEach(b => {
      b.onclick = () => {
        choice = Number(b.dataset.i);
        box.querySelectorAll('.rs-dx').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        $('rs-pick').textContent = 'تشخيصك: ' + b.textContent;
        $('rs-go').disabled = false;
      };
    });
    $('rs-go').onclick = () => { if (choice != null) finish(choice, $('rs-urgent').checked); };
    $('rs-dx-search').focus();
  }

  // The unasked questions whose true answers would have raised the right diagnosis most.
  function bestMissed(truth) {
    const base = S.steps[S.steps.length - 1].p[truth];
    const out = [];
    heads.forEach((n, g) => {
      if (S.asked.has(g) || !T.evidences[n] || isDerived(g)) return;
      const asked = net(S.asked); const plus = new Set(asked); plus.add(g);
      const gain = predict(plus)[truth] - base;
      if (gain > 0.02) out.push({ g, gain });
    });
    return out.sort((a, b) => b.gain - a.gain).slice(0, 3);
  }

  function spark(truth) {
    const pts = S.steps.map((s, i) => [i, s.p[truth]]);
    const n = Math.max(1, pts.length - 1);
    const path = pts.map(([i, p]) => `${(i / n * 300).toFixed(1)},${(78 - p * 70).toFixed(1)}`).join(' ');
    return `<svg class="rs-spark" viewBox="-6 0 312 86" role="img" aria-label="احتمال التشخيص الصحيح بعد كل سؤال"><line x1="0" y1="78" x2="300" y2="78"/><polyline points="${path}"/>${pts.map(([i, p]) => `<circle cx="${(i / n * 300).toFixed(1)}" cy="${(78 - p * 70).toFixed(1)}" r="2.6"><title>${esc(S.steps[i].label)}: ${pct(p)}</title></circle>`).join('')}</svg>`;
  }

  // Severity is DDXPlus's label for the disease (1 = most severe), not for this patient. Missing an
  // urgent review for 1-2 costs points; for 3 the decision depends on the patient in front of you,
  // so either answer is accepted; for the mild 4-5 an urgent call is over-triage.
  function triage(sev, urgent) {
    if (sev <= 2) return { ok: urgent, html: `<p class="rs-danger"><b>حالة قد تسوء بسرعة.</b> ${urgent ? 'أحسنت، طلبت تقييماً عاجلاً.' : 'كان يجب أن تطلب تقييماً عاجلاً من الطبيب.'}</p>` };
    if (sev === 3) return { ok: true, html: '<p class="rs-warnline">مرض متوسط الخطورة: قرار التقييم العاجل يعتمد على حال المريض (التنفس والأكسجين والوعي)، فلم نخصم على أي اختيار.</p>' };
    return { ok: !urgent, html: urgent ? '<p class="rs-warnline">الحالة بسيطة غالباً، ولم تكن تحتاج تقييماً عاجلاً.</p>' : '' };
  }
  // History is part of the skill: question points start at three questions.
  const qPoints = asked => (asked < 3 ? 0 : Math.max(0, 15 - Math.max(0, asked - 10)));

  function finish(choice, urgent) {
    S.done = true;
    $('rs-submit').hidden = true;
    const truth = S.pt.path;
    const tName = M.classes[truth];
    const right = choice === truth;
    const tri = triage(M.meta.severity[tName], urgent);
    const asked = S.steps.length - 1;
    const qp = qPoints(asked);
    const score = (right ? 60 : 0) + (tri.ok ? 25 : 0) + qp;
    // A pass needs a history: a right guess from the opening line alone is not one.
    const passed = score >= 70 && asked >= 3;
    const last = S.steps[S.steps.length - 1].p;
    const top = last.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
    const ar = c => esc(T.conditions[M.classes[c]] || M.classes[c]);
    const missed = bestMissed(truth);
    renderBars();
    $('rs-feed').querySelectorAll('.rs-chips').forEach(c => c.remove());

    const html = `<div class="rs-result">
      <div class="rs-score" tabindex="-1"><b class="font-num">${score}%</b><span>${right ? 'تشخيص صحيح' : 'التشخيص غير صحيح'} · ${passed ? 'مجتاز' : 'غير مجتاز'}</span></div>
      ${asked < 3 ? '<p class="rs-warnline">لا تُحسب الحالة ناجحة قبل أن تسأل 3 أسئلة على الأقل: أخذ القصة المرضية جزء من المهارة.</p>' : ''}
      <p><b>التشخيص الصحيح:</b> ${ar(truth)}${right ? '' : ` · <b>اخترت:</b> ${ar(choice)}`}</p>
      ${tri.html}
      <ul class="rs-break">
        <li>التشخيص <b class="font-num">${right ? 60 : 0} / 60</b></li>
        <li>تقدير الخطورة <b class="font-num">${tri.ok ? 25 : 0} / 25</b></li>
        <li>${asked < 3 ? `الأسئلة (${asked}، والحد الأدنى 3)` : `عدد الأسئلة (${asked})`} <b class="font-num">${qp} / 15</b></li>
      </ul>
      <h4>رأي النموذج بعد أسئلتك</h4>
      <ol class="rs-top">${top.map(([p, i]) => `<li>${ar(i)} <b class="font-num">${pct(p)}</b></li>`).join('')}</ol>
      <h4>كيف تغيّر احتمال التشخيص الصحيح مع كل سؤال</h4>${spark(truth)}
      ${missed.length ? `<h4>أسئلة كانت ستقرّبك أكثر</h4><ul class="rs-missed">${missed.map(m => `<li><b>${esc(qText(heads[m.g]))}</b><span>الجواب: ${esc(answer(m.g))}</span></li>`).join('')}</ul>` : ''}
      <h4>العلامات الحيوية</h4>
      <p>${S.measured ? '' : '<b>لم تقسها.</b> في الطوارئ تُقاس أولاً. '}${esc(vitalsLine(S.vit))}.</p>
      <h4>الفحوصات التي طلبتها (${S.tests.length})</h4>
      ${S.tests.length ? `<ul class="rs-missed">${S.tests.map(id => `<li><b>${esc(catOf(id).ar)}</b><span>${esc(resultFor(id).summary)}</span></li>`).join('')}</ul>` : '<p>لم تطلب أي فحص.</p>'}
      <p class="rs-note">النموذج تدرّب على مرضى افتراضيين، ودوره هنا تعليمي فقط.</p>
      <div class="rs-actions"><button type="button" class="p" id="rs-next">مريض جديد</button><button type="button" class="s" id="rs-home">العودة للرئيسية</button></div>
    </div>`;
    const card = say('sys', '', html);
    // Start the reader at the score, not at the buttons below it.
    const feed = $('rs-feed');
    feed.scrollTop += card.getBoundingClientRect().top - feed.getBoundingClientRect().top - 8;
    card.querySelector('.rs-score').focus({ preventScroll: true });
    $('rs-next').onclick = () => begin();
    $('rs-home').onclick = () => { if (typeof navigateTo === 'function') navigateTo('home'); };
    $('rs-input').disabled = true;
    $('rs-send').disabled = true;
    $('rs-dx-btn').disabled = true;

    try {
      const u = typeof authState !== 'undefined' && authState.user;
      if (u) {
        u.history = u.history || [];
        u.history.unshift({ caseTitle: 'غرفة الطوارئ التنفسية · ' + (T.conditions[tName] || tName), mode: 'غرفة الطوارئ التنفسية · ' + (S.exam ? 'امتحان' : 'تدريب'), date: new Date().toISOString().slice(0, 10),
          workupCount: S.tests.length, questions: asked, score: `${score}% (${passed ? 'مجتاز' : 'غير مجتاز'})`, caseId: 'resp_' + tName, num: score, passed, ts: Date.now() });
        u.stats = u.stats || {};
        u.stats.completed = u.history.length;
        if (typeof saveAccountToStorage === 'function') saveAccountToStorage(u);
      }
    } catch (e) { console.error(e); }
  }

  function begin(forced) {
    startPatient(forced);
    const pt = S.pt;
    $('rs-feed').innerHTML = '';
    ['rs-input', 'rs-send', 'rs-dx-btn'].forEach(id => { $(id).disabled = false; });
    $('rs-submit').hidden = true;
    $('rs-qsearch').value = '';
    const f = fem();
    const who = pt.age < 1 ? (f ? 'رضيعة' : 'رضيع') : pt.age < 12 ? (f ? 'طفلة' : 'طفل') : f ? 'امرأة' : 'رجل';
    $('rs-pt').innerHTML = `<div class="rs-av" aria-hidden="true">${esc(S.name.charAt(0))}</div><div><b>${esc(S.name)}</b><small>${who} · ${ageAr(pt.age)}</small></div>`;
    say('sys', `${S.name}، ${who} ${f ? 'عمرها' : 'عمره'} ${ageAr(pt.age)}، ${f ? 'وصلت' : 'وصل'} إلى الطوارئ.${young() ? (f ? ' الأم تجيب عن طفلتها.' : ' الأم تجيب عن طفلها.') : ''} ${young() ? 'اسأل' : f ? 'اسألها' : 'اسأله'} عن الأعراض، ثم سلّم تشخيصك.`);
    // The chief complaint is volunteered, not an answer, so it does not open with "نعم".
    say('pt', answer(M.encoder.ev_group[evIndex[pt.init]]).replace(/^(نعم|آه|اه|أيوه)،\s*/, ''));
    renderBars();
    renderAsked();
    bodyMap();
    renderQuestionList('');
    showVitals(null);
    // Close a normal-range tip left open for the previous patient (a click toggles it in motion.js).
    document.querySelector('#rs-mon-card .nb-mon-tile.is-picked')?.click();
    renderTests();
    $('rs-input').focus();
  }

  function mount() {
    const v = $('view-resp');
    if (!v || v.dataset.ready) return;
    v.dataset.ready = '1';
    const box = $('rs-submit');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'rs-submit-h');
    $('rs-form').addEventListener('submit', e => { e.preventDefault(); onAsk($('rs-input').value); });
    $('rs-feed').addEventListener('click', e => {
      const b = e.target.closest('.rs-chip');
      if (b && !S.done) { b.parentElement.remove(); askGroup(b.dataset.g); }
      if (e.target.id === 'rs-retry') open();
    });
    $('rs-qlist').addEventListener('click', e => {
      const b = e.target.closest('.rs-q');
      if (!b || S.done) return;
      const g = b.dataset.g;
      say('me', b.textContent);
      askGroup(g);
      $('rs-qlist').querySelector(`[data-g="${g}"]`)?.focus();
    });
    $('rs-qsearch').addEventListener('input', e => renderQuestionList(e.target.value));
    $('rs-measure').addEventListener('click', measure);
    $('rs-tests').addEventListener('click', e => { const b = e.target.closest('.rs-t'); if (b) orderTest(b.dataset.t); });
    v.querySelector('.rs-jump').addEventListener('click', e => {
      const b = e.target.closest('[data-jump]');
      if (!b) return;
      const card = $(b.dataset.jump);
      const d = card.querySelector('details');
      if (d) d.open = true;
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('rs-dx-btn').addEventListener('click', openSubmit);
    $('rs-new').addEventListener('click', () => (M ? begin() : open()));
    // Switching mode mid-case would let a student peek at the bars, so it starts a new patient.
    $('rs-mode').addEventListener('change', e => { S.exam = e.target.value === 'exam'; if (S.pt && !S.done) begin(); else if (M) renderBars(); });
  }

  async function open() {
    if (typeof navigateTo === 'function' && navigateTo('resp') === false) return;
    mount();
    const v = $('view-resp');
    v.classList.add('is-loading');
    try {
      await load();
      if (!cues) buildCues();
      v.classList.remove('is-loading');
      // Coming back to the room keeps the patient the student was working on.
      if (!S.pt || S.done) begin();
      else $('rs-input').focus();
    } catch (e) {
      console.error(e);
      v.classList.remove('is-loading');
      ['rs-input', 'rs-send', 'rs-dx-btn'].forEach(id => { $(id).disabled = true; });
      $('rs-feed').innerHTML = '<div class="rs-msg sys"><p>تعذّر تحميل النموذج. تحقق من الاتصال ثم أعد المحاولة.</p><button type="button" class="rs-ghost" id="rs-retry">أعد المحاولة</button></div>';
    }
  }

  window.nbOpenResp = open;
  // Test hook: lets the checks drive a known patient and compare with the Python model.
  window.__nbResp = {
    load: async () => { await load(); if (!cues) buildCues(); },
    predict: (pt, groups) => { const keep = S.pt; S.pt = pt; const p = predict(new Set(groups)); S.pt = keep; return p; },
    start: i => begin(i), ask: g => askGroup(g), state: S, matchLocal: t => matchLocal(t),
    measure: () => measure(), order: id => orderTest(id), result: id => resultFor(id), matchTests: t => matchTests(t),
    get CL() { return CL; },
    get M() { return M; }, get pool() { return POOL; }
  };
})();
