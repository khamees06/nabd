  // (chat check 2026-11-08) A history question the case has no line for. Asked about the complaint he came with, he says
  // it again; asked about another symptom or habit, he gives a standardized patient's plain «no», the same rule the online
  // patient voice follows (api/er-chat.js planPatient). A positive finding is never made up.
  const NO_TOPICS = [
    [/كحول|مشروب|(?:^| )خمر|(?:^| )بيره(?: |$)|نبيذ|alcohol/, 'لا... ما بشرب.', 'لا، ما بيشرب.', 'لا، ما بتشرب.'],
    [/عمليه|عمليات|جراحه|operation|surgery/, 'لا... ما عملت عمليات.', 'لا، ما عمل عمليات.', 'لا، ما عملت عمليات.'],
    [/استفراغ|(?:^| )بتستفرغ\S*|استفرغت\S*|ترجيع|غثيان|(?:^| )لايع(?:ه)?(?: |$)|vomit/, 'لا... ما استفرغت.', 'لا، ما استفرغ.', 'لا، ما استفرغت.'],
    [/حراره|سخونه|(?:^| )(?:سخن\S*|مسخن\S*|مولع\S*)|(?:^| )حمي(?: |$)|fever/, 'لا... ما حسيت بسخونة.', 'لا، ما حسيته سخن.', 'لا، ما حسيتها سخنة.'],
    [/كحه|(?:^| )بتكح\S*|(?:^| )بتسعل\S*|سعله|سعال|بلغم|cough/, 'لا... ما في كحة.', 'لا، ما بيكح.', 'لا، ما بتكح.'],
    [/هيك قبل|قبل هيك|(?:صار|صاير) (?:معك|معه|معها) هيك|صارلك هيك|صارله هيك|صارلها هيك|اجاك هيك|اول مره/, 'لا... أول مرة بيصير معي هيك.', 'لا، أول مرة بيصير معه هيك.', 'لا، أول مرة بيصير معها هيك.'],
    [/بالعيله|العيله|عيلتك|حدا من اهل|اهلك عندهم|وراثي|family/, 'لا... ما بعرف حدا بالعيلة عنده هيك.', 'لا، ما في حدا بالعيلة عنده هيك.', 'لا، ما في حدا بالعيلة عنده هيك.'],
  ];
  function plainNo(read, t) {
    if (NM() || read.typedOrder || read.actions.length || read.tests.length || read.exam.length) return null;
    if (!/[؟?]/.test(read.text || '') && wordsIn(t) > 5) return null;
    const c = E.c, op = norm(c.patient.opening);
    if (read.to !== 'companion' && /نفس/.test(op) && /(?:^| )(?:نفسك|نفسها|نفسه|بتتنفس\S*|تتنفس\S*|مخنوق\S*|بتلهث\S*)(?: |$)|ضيق (?:ب)?(?:ال)?نفس|ضيقه نفس/.test(t)) { read.to = 'patient'; return 'آه... ' + c.patient.opening; }
    const hit = NO_TOPICS.find(([re]) => re.test(t));
    if (!hit) return null;
    // A patient who cannot give his own history (the confused man in sepsis) is spoken for by his relative.
    const byComp = read.to === 'companion' || c.facts.filter(f => f.who === 'companion').length * 2 > c.facts.length;
    read.to = byComp ? 'companion' : 'patient';
    return byComp ? (c.patient.sex === 'F' ? hit[3] : hit[2]) : hit[1];
  }
  function statusLine(read) {
    const sp = id => SPOKEN[id] || (actOf(id) || {}).ar || '', v = E.show || live();
    if (read.statusAll) {
      const given = [...E.done.keys()].filter(id => (actOf(id) || {}).dose);
      const open = [E.pending, ...E.queue.map(q => q[0]), ...(E.parked || [])].filter(q => q && q.type === 'dose').map(spk);
      const rest = open.length ? ' ' + [...new Set(open)].join(' و') + ' لسا بستنى كلمتك فيهم.' : '';
      return given.length ? `أعطيت${hisHer()} ${given.map(id => sp(id) + (E.done.get(id).dose ? ' ' + E.done.get(id).dose : '')).join('، و')}.${rest}` : `لسا ما أعطيت${hisHer()} أي دوا.${rest || ' احكيلي شو بدك.'}`;
    }
    const id = read.statusOf, d = E.done.get(id), q = openFor(id);
    if (id === 'oxygen' && d) return `علي${hisHer()} أكسجين ${d.dose || ''}، والـSpO2 ${Math.round(v.spo2)}%.`.replace(/ ،/, '،');
    if (d) return `${sp(id)} ${id === 'fluids' ? 'علّقتها' : 'أعطيته'}${d.dose ? ' (' + d.dose + ')' : ''} ${agoSaid(d.at)}.`;
    if (E.harmed.has(id)) return `${sp(id)} أعطيته زي ما طلبت.`;
    if (q) { read.reopen = q; read.clarify = true; return `${sp(id)} لسا ما ${id === 'oxygen' ? 'ركّبته' : 'أعطيته'}${id === 'oxygen' ? '، والـSpO2 ' + Math.round(v.spo2) + '%' : ''}. ${q.sug ? 'بقترح ' + shortTip(q) + '، ماشي؟' : 'قديش بدك؟'}`; }
    read.offerAct = id;
    return id === 'oxygen' ? `ما علي${hisHer()} أكسجين، والـSpO2 ${Math.round(v.spo2)}%. أحطل${hisHer()}؟` : `${sp(id)} ما بلّشناه لسا. بدك ${fem(sp(id)) ? 'إياها' : 'إياه'} هسا؟`;
  }
  // (chat check 2026-11-08) The same judgement for the nurse's «طمنيني عنه», so she never contradicts the patient.
  const monitorLine = () => `المونيتر مركّب من أول ما ${E.c.patient.sex === 'F' ? 'وصلت' : 'وصل'}: ${spokenVitals()}.`;
  // «طمنيني عنه» / «شو وضعه؟»: the numbers on the monitor and which way he is going.
  const howLine = () => { const came = E.c.patient.sex === 'F' ? 'وصلت' : 'وصل', tr = trendNow(); return `${spokenVitals()}. ${tr === 'better' ? 'أحسن شوي من لما ' + came : tr === 'worse' ? 'أسوأ من لما ' + came + '، لازم نتحرك' : 'لسا زي ما ' + came + ' تقريباً'}.`; };
  const trendNow = () => { const c = E.c; if (E.stage >= 2) return 'worse'; if (E.betterTurn != null || E.saidBy.size > 0 || E.improved > 0 || E.risk <= c.risk.start - 8) return 'better'; return E.stage === 1 || E.risk >= c.risk.start + 6 ? 'worse' : 'same'; };
  // How the patient feels now, from what the room has done: worse, better, or the same.
  function feelNow() {
    const c = E.c;
    if (E.stage >= 2) return pickOf(((c.stageLines[STAGES[E.stage]] || {}).patient) || ['...']);
    const better = E.betterTurn != null || E.saidBy.size > 0 || E.improved > 0 || E.risk <= c.risk.start - 8;
    if (better) { const by = c.improveBy || {}, own = [...E.saidBy].map(id => by[id]).filter(Boolean); const pool = own.length ? own : (c.improve || []); return pickOf(pool.length ? pool : ['أحسن شوي...']); }
    if (E.stage === 1 || E.risk >= c.risk.start + 6) return pickOf(((c.stageLines.watch || {}).patient) || ['أسوأ شوي يا دكتور...']);
    return 'لسا زي ما أنا يا دكتور... ما حسيت بفرق.';
  }
  function patLine(k) {
    const p = E.c.patient, nm = String(p.name);
    if (k === 'feel') return feelNow();
    // A confused patient answers as the case wrote him.
    const orient = E.c.facts.find(f => f.id === 'orient');
    if (orient && k !== 'age') { E.facts.add('orient'); return orient.say; }
    const name = /^(?:الحاج|الحاجه|الحاجة|ابو|أبو|ام|أم) /.test(nm) ? `أنا ${nm.replace(/^الحاج[ةه]? /, '')}...` : `${nm.split(' ')[0]}... ${nm}.`;
    if (k === 'name') return name;
    if (k === 'name_where') return name + ' وهون بالمستشفى... بالطوارئ.';
    if (k === 'age') return `${p.age} سنة...`;
    return 'بالمستشفى... بالطوارئ.';
  }
