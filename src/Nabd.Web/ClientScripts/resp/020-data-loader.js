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

