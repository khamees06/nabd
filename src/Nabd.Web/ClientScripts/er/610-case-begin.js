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
    recFilter = 'all'; recQuery = '';
    setSide('mon');
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
    if ($('er-tab-labs') && $('er-tab-labs').dataset) $('er-tab-labs').dataset.badge = '';
    $('er-v-bp').textContent = '--/--';
    $('view-er').dataset.rhythm = '';
    // mobile audit 2026-11-07: motion.js restarts the pulse at the new case's rate when this number changes.
    if (REAL) { const mon = document.querySelector('.er-mon'); if (mon) mon.dataset.run = String((+mon.dataset.run || 0) + 1); }
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
    if (!showBrief()) autoFocus($('er-input'));
  }

