  // The supervisor is in the room and speaks when the moment calls for it.
  function coach(why) {
    if (E.over || NM()) return; // nurse mode: the instructor has her own fixed lines
    const missing = keyMissing().map(k => k.label).join('، ');
    // (chat fix 2026-11-08) He has just spoken: he does not announce himself again.
    if (why === 'called') { if (E.turns - (E.dTurn ?? -9) <= 2) return; person('d', 'أنا هون. شو عندك؟ بجملتين: situation وأهم رقم.'); return; }
    if (why === 'harm') { E.coachAt = E.sim; voice('d', 'supervisor', 'Something the trainee ordered just harmed the patient. Say it calmly, ask what changed and what they do now.', 'وقف. شو تغيّر بعد آخر دوا؟ شو بتعمل هسا؟', true); return; }
    if (why === 'urgent' && !missing) return;
    // One supervisor line per event: what just harmed the patient is said, not a second teaching question on top of it.
    if (E.sim - (E.coachAt ?? -9) < 0.5) return;
    E.coachAt = E.sim;
    E.hint = Math.min(E.hint + 1, E.c.teach.length - 1);
    E.hints++;
    // The teaching line that is still news: never one already said (here or by teachLine), never about a step done.
    const fallback = pickTeach() || E.c.teach[E.hint];
    voice('d', 'supervisor', why === 'critical'
      ? `The patient is about to arrest.${E.vtNow ? ' Unstable VT is on the monitor and only a shock will end it: say so.' : ''} Key steps not done: ${missing || 'none'}. Tell the trainee directly and briefly what matters now, without naming the disease.`
      : `The patient is getting worse. Key steps not done: ${missing || 'none'}. Ask one sharp question that points at the priority.`, fallback, why === 'critical');
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

