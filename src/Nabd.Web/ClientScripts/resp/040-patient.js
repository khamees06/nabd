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
  // DDXPlus asks a few things twice in other words; either one is answered from whichever the record has.
  const TWINS = { E_144: 'E_175', E_175: 'E_144', E_161: 'E_32', E_32: 'E_161', E_76: 'E_82', E_82: 'E_76', E_155: 'E_164', E_164: 'E_155',
    E_16: 'E_81', E_81: 'E_16', E_162: 'E_174', E_174: 'E_162' };

  // A question and its follow-ups are answered together, as a patient describes a symptom.
  function answer(g, formal) {
    const head = heads[g];
    if (TWINS[head] && !S.tok.has(head) && S.tok.has(TWINS[head])) return line(TWINS[head], 'yes', formal);
    const meta = M.meta.evidences;
    if (isDerived(g)) return line(head, 'yes', formal);
    // "Do you smoke?" to a former smoker: no, but he used to (DDXPlus keeps the two apart).
    if (head === 'E_79' && !S.tok.has('E_79') && S.tok.has('E_191')) return line('E_79', 'no', formal) + ' ' + line('E_191', 'yes', formal).replace(/^(آه|نعم)،\s*/, '');
    if (head === 'E_191' && S.tok.has('E_79')) return line('E_79', 'yes', formal);
    if (!S.tok.has(head) && meta[head].type === 'B') return line(head, 'no', formal);
    const parts = members[g].filter(n => S.tok.has(n) && T.evidences[n]).map(n => (meta[n].type === 'B' ? line(n, 'yes', formal) : fillValues(n, line(n, 'yes', formal))));
    return parts.length ? parts.join(' ') : line(head, 'no', formal);
  }

