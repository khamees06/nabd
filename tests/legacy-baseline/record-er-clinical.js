// Records golden masters of the ER room's clinical core from the legacy JavaScript.
//
// Each scenario runs the real er.js (with recording hooks, see instrument-er.js) in the Node harness and writes
// one trace file: the inputs the clinical core received, in order, and the state it was in after them. The C#
// domain model replays the inputs and must reach the same state (tests/Nabd.Tests/GoldenMasters).
//
// usage: node tests/legacy-baseline/record-er-clinical.js [outFolder] [--check]
//   outFolder   default tests/Nabd.Tests/GoldenMasters/ErClinical
//   --check     do not write; compare with the files on disk and exit 1 on any difference
//
// Trace format (one JSON file per scenario):
//   { scenario, case, role, seed, steps: [...], final: {...} }
//   step { t: 'ticks', dt, n, s }                n clock ticks of dt seconds with nothing else happening
//   step { t: 'tick', dt, pre, post, s }         one tick; pre = inputs handled while its due jobs ran (before
//                                                the stage check), post = inputs handled after the stage check
//   step { t: 'in', evs, s }                     inputs handled between two ticks (a message, a click)
//   s = state after the step: [sim, risk, stage, topStage, vt, bpSys, bpDia, hr, sbp, dbp, rr, spo2, netRate]
//   A step that carries inputs also has x = { done, harmed, harms, unneeded, lateTests, wrongDoses, tests,
//   effects, mods, anaph, temp, over, outcome }.
const fs = require('fs'), path = require('path'), vm = require('vm');
const { Room, REPO } = require('./harness-er.js');
const { instrument } = require('./instrument-er.js');

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const OUT = path.resolve(argv.find(a => !a.startsWith('--')) || path.join(REPO, 'tests/Nabd.Tests/GoldenMasters/ErClinical'));
const CASES = ['asthma', 'sepsis', 'pe', 'stemi', 'dka', 'htn'];
const RUN_MAX = 20; // plain ticks per step: a state is recorded at least every 2 simulated seconds

/* ---------- one recorded room ---------- */
function newRoom(seed) {
  const rec = { steps: [], cur: null, phase: null, room: null };
  const snap = () => {
    const N = rec.room.N, E = N.E, v = N.live();
    return [E.sim, E.risk, E.stage, E.topStage, E.vtNow ? 1 : 0, E.bp[0], E.bp[1], v.hr, v.sbp, v.dbp, v.rr, v.spo2, N.__core.netRate()];
  };
  const extra = () => {
    const E = rec.room.N.E;
    return {
      done: [...E.done.entries()].map(([id, d]) => [id, d.at, d.last, d.n, d.ok, d.amt || 0, d.top || 0]),
      harmed: [...E.harmed], harms: E.harms.map(h => [h.at, h.risk]), unneeded: E.unneeded.length, lateTests: E.lateTests.length,
      wrongDoses: E.wrongDoses.length, tests: Object.values(E.tests).map(t => [t.id, t.at, t.ind]),
      effects: E.effects.map(e => [e.id, e.from, e.slow]), mods: E.mods.length,
      anaph: !E.anaph ? 0 : E.anaph.treated ? 2 : 1, temp: !!E.tempKnown, over: !!E.over, outcome: E.outcome,
    };
  };
  const pushPlain = dt => {
    const last = rec.steps[rec.steps.length - 1];
    if (last && last.t === 'ticks' && last.dt === dt && last.n < RUN_MAX) { last.n++; last.s = snap(); }
    else rec.steps.push({ t: 'ticks', dt, n: 1, s: snap() });
  };
  const closeTick = () => {
    const c = rec.cur; rec.cur = null; rec.phase = null;
    if (!c) return;
    if (!c.pre.length && !c.post.length) pushPlain(c.dt);
    else rec.steps.push({ t: 'tick', dt: c.dt, pre: c.pre, post: c.post, s: snap(), x: extra() });
  };
  const T = ev => {
    if (ev.t === 'begin') { rec.begin = ev; return; }
    // A tick that ended in an arrest never reaches its own end marker: the conclusion closes it.
    if (ev.t === 'tick') { closeTick(); rec.cur = { dt: ev.dt, pre: [], post: [] }; rec.phase = 'pre'; return; }
    if (ev.t === 'stage') { rec.phase = 'post'; return; }
    if (ev.t === 'tickEnd') { rec.phase = 'end'; return; }
    if (rec.cur) rec.cur[rec.phase === 'pre' ? 'pre' : 'post'].push(ev);
    else rec.pendingIn.push(ev);
  };
  rec.pendingIn = [];
  // Inputs handled between ticks are written once the call that caused them has returned.
  rec.flush = () => {
    closeTick();
    if (rec.pendingIn.length) rec.steps.push({ t: 'in', evs: rec.pendingIn.splice(0), s: snap(), x: extra() });
  };
  const room = new Room({ seed, transform: instrument, globals: { __T: T } });
  rec.room = room;
  // A fixed calendar clock: nothing in a trace depends on the day it was recorded.
  room.win.__fn = () => 1.7e12 + room.now;
  vm.runInContext('Date.now = () => __fn();', room.ctx);
  // Every frame is followed by a flush, so a tick is closed before the next input is looked at.
  const frame = room.frame.bind(room);
  room.frame = ms => { frame(ms); rec.flush(); };
  return rec;
}

const run = async (rec, sec) => { await rec.room.real(sec); rec.flush(); };
const until = async (rec, min) => { await rec.room.simTo(min); rec.flush(); };
const act = async (rec, fn) => { fn(rec.room.N, rec.room.N.E, rec.room.N.__core); await rec.room.tickle(); rec.flush(); };
const giveNow = (rec, id, dose, more = {}) => act(rec, (N, E, core) => core.give({ id, dose: dose || '', said: '', ...more }, core.actOf(id), E.c.care[id] || {}));
const suggested = (N, E, id) => ((E.c.care[id] || {}).suggest || (N.__core.actOf(id) || {}).suggest || {}).dose || '';
// (A case may list a result for a test the catalog does not have; the room cannot order it either.)
const testNow = (rec, id, reason = '', ok = 'ungraded') => act(rec, (N, E, core) => { if (!E.tests[id] && core.testOf(id)) core.submitTest(id, reason, ok); });
const harmNow = (rec, id, allergic = false) => act(rec, (N, E, core) => {
  const care = E.c.care[id] || {};
  const def = care.stableHarm && !care.harm ? { ...care, ...care.stableHarm, harm: true, early: true } : care;
  core.harm({ id, dose: '', said: '' }, core.actOf(id), def, allergic);
});

async function finish(rec, end) {
  const r = rec.room;
  if (!r.E.over && end) { await r.handover(end); rec.flush(); }
  const E = r.E, N = r.N;
  const final = { over: !!E.over, outcome: E.outcome, role: E.role, sim: E.sim, risk: E.risk, topStage: E.topStage, riskLog: E.riskLog.length, errors: r.errors };
  if (E.over && E.role !== 'nurse') {
    const end2 = r.win.__lastEnd || null;
    const s = N.score(end2);
    final.input = {
      end: end2 ? { dispo: end2.dispo, grade: { dx: end2.grade.dx, s: !!end2.grade.s, b: !!end2.grade.b, a: !!end2.grade.a, r: !!end2.grade.r, invented: !!end2.grade.invented, graded: !!end2.grade.graded } } : null,
      comm: { ...E.comm }, facts: [...E.facts], exam: [...E.exam],
      tests: Object.values(E.tests).map(t => ({ id: t.id, reasonOk: t.reasonOk, read: t.read || null, justOk: t.justOk === true })),
    };
    final.score = { total: s.total, safe: s.safe, dxPts: s.dxPts, testPts: s.testPts, hist: s.hist, comm: s.comm, hand: s.hand, place: s.place, missedTests: s.missedTests, safety: s.safety.map(k => [k.id, k.state, k.at]) };
    final.fell = N.__core.fell();
    final.verdict = r.win.__verdict || null;
    final.state = { vtNow: !!E.vtNow, vtAt: E.vtAt, anaph: !E.anaph ? 0 : E.anaph.treated ? 2 : 1, harms: E.harms.map(h => h.risk) };
  }
  return final;
}

/* ---------- scenarios ---------- */
const SCRIPT = [
  'مرحبا انا الدكتور، شو صار معك؟', 'عندك حساسية من اي دوا؟', 'بتاخد ادوية؟', 'اعطيها اكسجين 6 لتر', 'ركبي كانيولا',
  'كم الضغط؟', 'افحص الصدر', 'بدي ECG', 'اطلبي CBC و kft', 'سكر الدم',
  'يا مشرف شو اعمل؟', 'فنتولين 5 ملغ', 'هيدروكورتيزون 100 ملغ وريدي', 'نعم', 'اعطيه اسبرين 300 ملغ',
  'سوائل 500 مل', 'يا حجة اطمني، رح نعطيه علاج', 'ليفوفلوكساسين 750 ملغ', 'اعطيه نترات', 'اه',
  'عيدي الضغط', 'قيسي الحرارة', 'شغلي القسطرة', 'اينوكسابارين 70 ملغ', 'انسولين 0.1 وحدة لكل كيلو بالساعة',
  'بوتاسيوم 20 مليمول', 'اتصل بالاخصائي', 'بدي صورة صدر عشان اشوف التهاب', 'في ST elevation', 'غازات الدم',
  'لا', 'بلاش', 'مورفين 3 ملغ', 'شكرا', 'فوروسيمايد 40 ملغ وريدي',
  'cpap', 'صدمة كهربائية هسا', 'الارقام؟', 'ارفعي راس السرير', 'تمام كمل',
];
const SBAR = 'الوضع مريض عنده ضيق نفس وعنده ربو، الضغط 120 والنبض 100، بدي عناية';
const j = o => ({ ok: true, status: 200, json: async () => o });
function stubOnline(r) {
  let k = 0;
  r.responder = body => {
    k++;
    if (body.mode === 'grade') return j({ dx: 'close', s: true, b: true, a: true, r: false, invented: false, note: 'ملاحظة' });
    if (body.mode === 'line') return j({ reply: k % 3 ? 'سطر' : null });
    const rd = JSON.parse(JSON.stringify(r.N.localRead(body.text || '')));
    delete rd.text;
    return j({ to: rd.to === 'room' ? 'patient' : rd.to, reply: k % 2 ? 'رد ' + k : null, held: k % 17 === 0, voiceFailed: k % 13 === 0, read: rd });
  };
}

const SCENARIOS = [];
const add = (name, id, seed, play, role) => SCENARIOS.push({ name, id, seed, play, role });

CASES.forEach((id, i) => {
  // The fixed 40-message conversation, without and with a (stub) understanding service.
  for (const online of [false, true]) {
    add(`script-${online ? 'on' : 'off'}-${id}`, id, 101 + i, async rec => {
      const r = rec.room;
      if (!online) r.N.api = 'off';
      await run(rec, 0.5);
      for (const t of SCRIPT) { if (r.E.over) break; await r.say(t); rec.flush(); await run(rec, 12); }
      return finish(rec, { dx: 'x', dispo: 'icu', sbar: SBAR });
    }, null, online);
  }
  // Nothing is done: the patient deteriorates through every stage to arrest.
  add(`neglect-${id}`, id, 201 + i, async rec => { await until(rec, 60); return finish(rec, null); });
  // Every key step on time with the case's own suggested dose, every indicated test, the right diagnosis and destination.
  add(`ideal-${id}`, id, 301 + i, async rec => {
    const r = rec.room, c = r.E.c;
    await run(rec, 6);
    await act(rec, (N, E) => { [...c.facts, ...c.exam].filter(f => f.red).forEach(f => (c.exam.includes(f) ? E.exam : E.facts).add(f.id)); Object.assign(E.comm, { introduced: true, explained: true, empathy: true }); });
    const keys = Object.entries(c.care).filter(([, d]) => d.key).sort((a, b) => a[1].by - b[1].by);
    const tests = Object.entries(c.results).filter(([, x]) => x.ind === 'indicated').map(([k]) => k);
    for (const k of tests.slice(0, 3)) { await testNow(rec, k, 'لتأكيد التشخيص التفريقي', 'good'); await run(rec, 3); }
    for (const [k] of keys) { if (r.E.over) break; await giveNow(rec, k, suggested(r.N, r.E, k)); await run(rec, 14); }
    for (const k of tests.slice(3)) { await testNow(rec, k); await run(rec, 2); }
    await until(rec, Math.max(r.E.sim + 2, 6));
    return finish(rec, { dx: c.dx.accept[0], dispo: c.dispo, sbar: 'الوضع: مريض عنده ضيق نفس. الخلفية: عنده تاريخ مرضي. التقييم: الضغط 110 والنبض 100. التوصية: بدي تحويل ومتابعة.' });
  });
  // Key steps late and repeated, tests late and out of order, a wrong diagnosis and a dangerous destination.
  add(`late-${id}`, id, 401 + i, async rec => {
    const r = rec.room, c = r.E.c;
    const keys = Object.entries(c.care).filter(([, d]) => d.key).sort((a, b) => a[1].by - b[1].by);
    const last = keys.length ? keys[keys.length - 1][1].by : 5;
    await until(rec, Math.min(last + 0.5, 9));
    for (const [k] of keys) { if (r.E.over) break; await giveNow(rec, k, suggested(r.N, r.E, k)); await run(rec, 9); }
    for (const k of ['oxygen', 'fluids', 'neb_salbutamol', 'nitrate']) {
      if (r.E.over || !r.E.done.has(k)) continue;
      await giveNow(rec, k, suggested(r.N, r.E, k)); await run(rec, 4);
      await giveNow(rec, k, k === 'oxygen' ? '15 L/min' : suggested(r.N, r.E, k), { _titr: 'up' }); await run(rec, 20);
    }
    await giveNow(rec, 'temp'); await run(rec, 2); await giveNow(rec, 'bp_repeat'); await run(rec, 2);
    for (const k of Object.keys(c.results)) { if (r.E.over) break; await testNow(rec, k, 'هيك', 'weak'); await run(rec, 1.5); }
    await act(rec, (N, E) => { Object.assign(E.comm, { introduced: true, rude: 1, jargon: 2 }); E.wrongDoses.push({ ar: 'x', dose: 'y', ref: 'z' }); });
    await run(rec, 30);
    return finish(rec, { dx: 'زكام', dispo: 'home', sbar: 'تمام' });
  });
  // Harmful orders reach the patient: the plain ones, the ones that are only wrong too early, and the allergic one.
  add(`harm-${id}`, id, 501 + i, async rec => {
    const r = rec.room, c = r.E.c;
    await run(rec, 20);
    const plain = Object.entries(c.care).filter(([, d]) => d.harm).map(([k]) => k);
    const early = Object.entries(c.care).filter(([, d]) => d.stableHarm && !d.harm).map(([k]) => k);
    const allergy = Object.entries(c.care).filter(([, d]) => d.allergyKw).map(([k]) => k);
    for (const k of early) { if (r.E.over) break; await harmNow(rec, k); await run(rec, 25); }
    for (const k of allergy.slice(0, 1)) {
      if (r.E.over) break;
      await harmNow(rec, k, true); await run(rec, 40);
      if (r.E.anaph) { await giveNow(rec, 'adrenaline', '0.5 mg IM'); await run(rec, 30); }
    }
    for (const k of plain.slice(0, 2)) { if (r.E.over) break; await harmNow(rec, k); await run(rec, 25); }
    for (const [k] of Object.entries(c.care).filter(([, d]) => d.key)) { if (r.E.over) break; if (!r.E.done.has(k)) await giveNow(rec, k, suggested(r.N, r.E, k)); await run(rec, 6); }
    await run(rec, 30);
    return finish(rec, { dx: (c.dx.close || c.dx.accept)[0], dispo: (c.dispoAlso || [c.dispo])[0], sbar: 'الوضع مريض تعبان عنده تاريخ، اعطيت اسبرين، بدي متابعة 120' });
  });
  // The nurse's room: the same clinical core under the other role (its own handover and score are not ported).
  add(`nurse-${id}`, id, 601 + i, async rec => {
    const r = rec.room;
    r.N.api = 'off';
    await run(rec, 0.5);
    for (const t of SCRIPT.slice(0, 26)) { if (r.E.over) break; await r.say(t); rec.flush(); await run(rec, 10); }
    for (const o of r.N.nurse ? r.N.nurse.orders.slice() : []) { if (r.E.over) break; try { r.N.execOrder(o.kind, o.id); } catch (e) { /* an order that cannot run now */ } await r.tickle(); rec.flush(); await run(rec, 8); }
    await run(rec, 60);
    return finish(rec, null);
  }, 'nurse');
});
// The collapse the case files plan for: the patient is left until the critical stage, then rescued.
add('rescue-stemi-vt', 'stemi', 701, async rec => {
  const r = rec.room;
  await harmNow(rec, 'shock'); // a shock with a pulse, before any VT
  await run(rec, 30);
  let g = 0;
  while (!r.E.vtNow && !r.E.over && g++ < 4000) await run(rec, 1);
  await run(rec, 5);
  await testNow(rec, 'ecg', '', 'ungraded');
  await giveNow(rec, 'shock'); await run(rec, 20);
  for (const [k] of Object.entries(r.E.c.care).filter(([, d]) => d.key)) { if (r.E.over) break; await giveNow(rec, k, suggested(r.N, r.E, k)); await run(rec, 8); }
  await run(rec, 40);
  return finish(rec, { dx: r.E.c.dx.accept[0], dispo: r.E.c.dispo, sbar: SBAR });
});
add('rescue-pe-collapse', 'pe', 702, async rec => {
  const r = rec.room, c = r.E.c;
  let g = 0;
  while (r.E.stage < 3 && !r.E.over && g++ < 4000) await run(rec, 1);
  await testNow(rec, 'ctpa'); await testNow(rec, 'ct_head'); // both are dangerous once the pressure has fallen
  await run(rec, 5);
  await giveNow(rec, 'thrombolysis', suggested(r.N, r.E, 'thrombolysis')); await run(rec, 30);
  for (const [k] of Object.entries(c.care).filter(([, d]) => d.key)) { if (r.E.over) break; if (!r.E.done.has(k)) await giveNow(rec, k, suggested(r.N, r.E, k)); await run(rec, 8); }
  await run(rec, 60);
  return finish(rec, { dx: c.collapse.dx, dispo: c.collapse.dispo, sbar: SBAR });
});
add('rescue-sepsis-hold', 'sepsis', 703, async rec => {
  // Supportive care only: the risk is held at the case's limit until the cause (the antibiotic) is treated.
  const r = rec.room;
  await run(rec, 10);
  await giveNow(rec, 'oxygen', '15 L/min'); await run(rec, 5);
  await giveNow(rec, 'fluids', '500 mL'); await run(rec, 150);
  await giveNow(rec, 'fluids', '500 mL'); await run(rec, 400);
  await testNow(rec, 'blood_culture'); await run(rec, 3);
  await giveNow(rec, 'antibiotics', suggested(r.N, r.E, 'antibiotics')); await run(rec, 400);
  return finish(rec, { dx: r.E.c.dx.accept[0], dispo: 'ward', sbar: SBAR });
});

/* ---------- run ---------- */
(async () => {
  if (!CHECK) fs.mkdirSync(OUT, { recursive: true });
  let bad = 0;
  for (const sc of SCENARIOS) {
    const rec = newRoom(sc.seed);
    if (sc.name.startsWith('script-on-')) stubOnline(rec.room);
    await rec.room.open(sc.id, sc.role ? { role: sc.role } : {});
    rec.flush();
    const start = { s: null };
    { const N = rec.room.N, E = N.E, v = N.live(); start.s = [E.sim, E.risk, E.stage, E.topStage, E.vtNow ? 1 : 0, E.bp[0], E.bp[1], v.hr, v.sbp, v.dbp, v.rr, v.spo2, N.__core.netRate()]; }
    const final = await sc.play(rec);
    rec.flush();
    const trace = { scenario: sc.name, case: sc.id, role: rec.room.E.role, seed: sc.seed, start: start.s, steps: rec.steps, final };
    const text = JSON.stringify(trace) + '\n';
    const file = path.join(OUT, sc.name + '.json');
    const ticks = rec.steps.reduce((n, s) => n + (s.t === 'ticks' ? s.n : s.t === 'tick' ? 1 : 0), 0);
    const inputs = rec.steps.reduce((n, s) => n + (s.t === 'in' ? s.evs.length : s.t === 'tick' ? s.pre.length + s.post.length : 0), 0);
    let status = 'written';
    if (CHECK) { const same = fs.existsSync(file) && fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') === text; status = same ? 'same' : 'DIFFERENT'; if (!same) bad++; }
    else fs.writeFileSync(file, text);
    console.log(`${sc.name.padEnd(22)} ticks=${String(ticks).padStart(6)} inputs=${String(inputs).padStart(4)} sim=${final.sim.toFixed(2).padStart(6)} risk=${final.risk.toFixed(1).padStart(5)} ${String(final.outcome).padEnd(8)} score=${final.score ? final.score.total : '-'} errors=${final.errors.length} ${(text.length / 1024).toFixed(0)}KB ${status}`);
    if (final.errors.length) { bad++; console.log('   first error: ' + final.errors[0].slice(0, 300)); }
  }
  console.log(bad ? `${bad} problem(s)` : `${SCENARIOS.length} scenarios ${CHECK ? 'identical to the files on disk' : 'recorded'}`);
  process.exit(bad ? 1 : 0);
})();
