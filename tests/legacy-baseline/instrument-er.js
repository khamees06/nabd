// Adds recording hooks to the legacy er.js so that every input the clinical core receives is written to a
// trace, in the order the legacy code handled it. The hooks only call window.__T(event); they change no value
// and draw no random number, so the instrumented script behaves exactly like the original.
//
// Each hook is placed by an exact piece of the original text. If the legacy script changes and a piece is no
// longer found exactly as often as expected, instrument() throws: a trace is never recorded from a script the
// hooks do not fit.
const HOOKS = [
  {
    name: 'tick: the time step',
    find: "    const dt = Math.max(0, Math.min(2, (now - last) / 1000));\n    last = now;\n",
    add: "    __T({ t: 'tick', dt });\n",
  },
  {
    name: 'tick: due jobs have run, the stage is about to be checked',
    find: "    for (const j of E.jobs.filter(x => E.sim >= x.at)) { E.jobs.splice(E.jobs.indexOf(j), 1); j.fn(); }\n",
    add: "    __T({ t: 'stage' });\n",
  },
  {
    name: 'tick: end (arrest check)',
    find: "    alarm(now);\n",
    add: "    __T({ t: 'tickEnd' });\n",
  },
  {
    name: 'give: an intervention is carried out',
    find: "    const amt = amountOf(a, def, a.said || '');\n",
    add: "    __T({ t: 'give', id: a.id, dose: a.dose || '', ok: a._ok || 'good', amt, titr: a._titr || null, def: { slow: def.slow || 0, onset: def.onset || 0, fx: def.fx || null, spo2: def.spo2 || 0 } });\n",
  },
  {
    name: 'harm: a harmful order reaches the patient',
    find: "  function harm(a, meta, def, allergic, insisted) {\n",
    add: "    __T({ t: 'harm', id: a.id, dose: a.dose || '', allergic: !!allergic, ar: meta.ar, def: { counts: !!def.counts, slow: def.slow || 0, onset: def.onset || 0, off: !!def.off, risk: def.risk || 0, label: def.label || null, allergyRisk: def.allergyRisk || 0, anaphylaxis: !!def.anaphylaxis } });\n",
  },
  {
    name: 'submitTest: a test is ordered',
    find: "  function submitTest(id, reason, reasonOk) {\n",
    add: "    __T({ t: 'test', id, reasonOk });\n",
  },
  {
    name: 'help asked from the supervisor counts as calling the senior (two places)',
    find: "E.done.set('call_senior', { at: E.sim, last: E.sim, n: 1, dose: '', ok: 'good', amt: 0 })",
    count: 2, inline: true,
    add: "(__T({ t: 'mark', id: 'call_senior' }), ",
    close: ")",
  },
  {
    name: 'nurse mode: the intensive care unit is called',
    find: "E.done.set('call_icu', { at: E.sim, last: E.sim, n: 1, dose: '', ok: 'good', amt: 0 })",
    inline: true,
    add: "(__T({ t: 'mark', id: 'call_icu' }), ",
    close: ")",
  },
  {
    name: 'nurse mode: a bedside check (temperature or the monitor)',
    find: "      E.done.set(id, prev ? { ...prev, n: prev.n + 1, last: E.sim } : { at: E.sim, last: E.sim, n: 1, dose: '', ok: 'good', amt: 0, top: 0 });\n",
    before: true,
    add: "      __T({ t: 'check', id });\n",
  },
  {
    name: 'the temperature becomes known after a give',
    find: "      if (a.id === 'temp') { E.tempKnown = true; paint(); }\n",
    before: true,
    add: "      if (a.id === 'temp') __T({ t: 'temp' });\n",
  },
  {
    name: 'the nurse reads the numbers after a treatment (forced cuff reading)',
    find: "    if (!E || E.over) return;\n    E.bpAt = 0;\n    paint();\n    const v = live(), n = k => Math.round(v[k]), b = k => Math.round(before[k]);\n",
    before: true, skip: "    if (!E || E.over) return;\n",
    add: "    __T({ t: 'cuff' });\n",
  },
  {
    name: 'begin: a case starts',
    find: "    if (role === 'nurse') { E.readAsks = 3; E.nurse = newNurseState(c); }\n",
    add: "    __T({ t: 'begin', case: c.id, role });\n" +
      "    Object.defineProperty(E.wrongDoses, 'push', { value: function (x) { __T({ t: 'wrongDose' }); return Array.prototype.push.call(this, x); } });\n" +
      "    { const add = E.facts.add.bind(E.facts); E.facts.add = x => { if (!E.facts.has(x)) __T({ t: 'fact', id: x }); return add(x); }; }\n" +
      "    { const add = E.exam.add.bind(E.exam); E.exam.add = x => { if (!E.exam.has(x)) __T({ t: 'exam', id: x }); return add(x); }; }\n",
  },
  {
    name: 'conclude: the case ends',
    find: "    if (E.over) return;\n    E.over = true;\n    E.riskLog.push([E.sim, E.risk]);\n",
    before: true, skip: "    if (E.over) return;\n",
    add: "    __T({ t: 'conclude', end: end ? { dispo: end.dispo, grade: end.grade } : null }); window.__lastEnd = end;\n",
  },
  {
    name: 'conclude: the verdict (passed or failed, and why)',
    find: "    const passed = s.total >= 70 && !fails.length;\n",
    add: "    window.__verdict = { passed, fails: fails.slice() };\n",
  },
  {
    name: 'test hook: the core functions the recorder calls directly',
    find: "get real() { return REAL; } };\n",
    add: "  window.__nbER.__core = { give, harm, submitTest, netRate, dispoCheck, fell, actOf, testOf, keyMissing, vitalsAt, localGrade, tooEarly };\n",
  },
];

function instrument(source) {
  let out = source;
  for (const h of HOOKS) {
    const want = h.count || 1;
    const found = out.split(h.find).length - 1;
    if (found !== want) throw new Error(`instrument-er: hook "${h.name}" expected ${want} match(es) in er.js, found ${found}`);
    if (h.inline) out = out.split(h.find).join(h.add + h.find + h.close);
    else if (h.before && h.skip) out = out.split(h.find).join(h.skip + h.add + h.find.slice(h.skip.length));
    else if (h.before) out = out.split(h.find).join(h.add + h.find);
    else out = out.split(h.find).join(h.find + h.add);
  }
  return out;
}

module.exports = { instrument, HOOKS };
