  // Latin words glued to Arabic prefixes ("والGTN") are read as the Latin word.
  // (chat fix 2026-11-08) «إيش» and «وش» are «شو» to the reader.
  // (chat fix 2026-11-08) The drug as the trainee named it («مورفين», «سيفترياكسون»), for the nurse's read-back only;
  // never the agent, which the allergy check reads.
  // (chat fix 2 2026-11-08) A Latin name typed («ticagrelor 180») is said back too, when no Arabic one was.
  const sayNameOf = (id, text) => { if (!E || NM()) return ''; const t = nz(text || ''); const kws = ((E.c.care[id] || {}).limits || (actOf(id) || {}).limits || []).flatMap(l => l.kw || []); return kws.find(k => /[ء-ي]/.test(k) && hasAny(t, [k])) || kws.find(k => /^[a-z][a-z -]{4,}$/i.test(k) && hasAny(t, [k])) || ''; };
  // The agent her proposal names at the dose typed: «تيكاغريلور 180 ملغ (أو كلوبيدوغريل 600 ملغ)» and «600» is the clopidogrel.
  const agentOfSug = (sg, dose) => {
    const d = doseOf(dose || '');
    if (!sg || !sg.text || !d) return '';
    // («(أو 40 ملغ)» with no name is the same agent at another dose.)
    let lastName = '';
    for (const part of String(sg.text).split(/\s*\(أو\s*|\)\s*|،\s*/)) {
      const m = part.match(/^\s*([^\d(]+?)\s+([\d.]+)/), bare = part.match(/^\s*([\d.]+)/);
      if (m && /[ء-ي]{3,}|[a-z]{3,}/i.test(m[1]) && m[1].split(' ').length <= 3) { lastName = m[1].trim(); if (+m[2] === d.lo) return lastName; }
      else if (bare && lastName && +bare[1] === d.lo) return lastName;
    }
    return '';
  };
  // (chat fix 2 2026-11-08) Oxygen as trainees spell it («اكسجيين»، «اوكسيجين»، «اكسجينللمريض») is «اكسجين».
  const nz = s => norm(s).replace(/(^| )(?:وال|بال|لل|ال|و|ب)(?=[a-z])/g, '$1').replace(/([a-z0-9])([ء-ي])/g, '$1 $2').replace(/([ء-ي])([a-z])/g, '$1 $2').replace(/(^| )(?:ايش|وش)(?= |$)/g, '$1شو')
    .replace(/(^| )([وبلف]?(?:ال)?)او?كسي?جي+ن/g, '$1$2اكسجين').replace(/اكسجين(?=لل|ل(?:ه|ها|لمريض))/g, 'اكسجين ');
  function localRead(text) {
    const t = nz(text), c = E.c;
    // Nurse mode: first-person acts (بقيس، ركّبت) are acts too, and the nurse's own words for a vitals check count.
    const ORD = NM() ? ORDER_N : ORDER, ACTS = NM() ? E.nurse.acts : D.actions;
    // Every question mark ends a question of its own, and each is read alone.
    const clauseFacts = cl => {
      let fx = c.facts.filter(f => hasAny(cl, f.kw)).map(f => f.id).filter(id => id !== 'allergy' || /حساس|تحسس|allerg/.test(cl));
      // "عنده حساسية من دوا؟" is the allergy question, not the medicines one.
      if (/حساس|تحسس|allerg/.test(cl) && fx.includes('allergy')) fx = ['allergy'];
      return fx;
    };
    const asked = text.split(/[؟?]/).map(x => nz(x).trim()).filter(Boolean);
    let facts = [...new Set((asked.length > 1 ? asked : [t]).flatMap(clauseFacts))].slice(0, 3);
    // (chat fix 2026-11-08) The doctor's «خليني اسمع الصدر» and plural «افحصوا» are examinations too.
    // (chat fix 2 2026-11-08) «افحصولي بطنه»، «سمعتو الصدر؟»، «شوفيله صدره» too.
    let exam = c.exam.filter(f => hasAny(t, f.kw) || (NM() ? hasAny(firstP(t), f.kw) : hasAny(firstP(t.replace(/(^| )(افحص|اسمع|سمع|شوف)(?:و|وا|ولي|وله|ولها|يلي|يله|يلها|تو|توا|تي|ي)(?= |$)/g, '$1$2').replace(/(^| )سمع(?= )/g, '$1اسمع')), f.kw))).map(f => f.id);
    const verb = ORD.test(t);
    // A message can hold a question and an order: every sentence is judged on its own, so a «؟» in one never cancels the other.
    const orderish = p => { const pt = nz(p); return ORD.test(pt) || URGENT.test(pt) || !!doseIn(p); };
    const parts = (text.match(/[^؟?]+[؟?]?/g) || [text]).map(p => p.trim()).filter(Boolean).flatMap(p => {
      if (!p.includes('،') || !/[؟?]\s*$/.test(p)) return [p];
      const cl = p.split('،').map(x => x.trim()).filter(Boolean);
      return cl.length > 1 && cl.slice(0, -1).some(orderish) ? cl : [p];
    });
    const IMPV = /^(?:[اتن]?عط|حط|ركب|علق|ابدا|بلش|جيب|جهز|شغل|قيس|نادي|give|start)/;
    // "ممكن أعطيها X؟" or "بدي أحط X؟" is a plan said as a question: still an order, but never after "اذا" or "لو".
    const FPQ = /(?:^| )(?:بدي|بدنا|ب(?:حط|ركب|عطي|زيد|سحب|شغل|علق)|ممكن (?:انا )?ا?(?:ركب|عطي|حط|سحب))\S*/;
    const asksPart = p => {
      const pt = nz(p);
      const past3 = ASKS_PAST3.test(pt) && (/[؟?]/.test(p) || PAST_WORD.test(pt));
      if (/[؟?]/.test(p)) return (!IMPV.test(pt) && !(FPQ.test(pt) && !/(?:^| )(?:اذا|لو)(?: |$)/.test(pt))) || ASKS_ABOUT.test(pt) || past3;
      return (HISTORY.test(pt) && !ORD.test(pt)) || ASKS_ABOUT.test(pt) || past3;
    };
    const ordParts = parts.filter(p => !asksPart(p));
    const asking = !ordParts.length;
    // What the order-reading below looks at: the sentences that are not questions.
    const tO = ordParts.length === parts.length ? t : nz(ordParts.join(' '));
    const named = list => { const ids = collisions(tO, new Set(list.filter(a => hasAny(tO, a.kw)).map(a => a.id)), ORD); const keep = FORCED; const out = list.filter(a => ids.has(a.id)); FORCED = keep; return out; };
    const stated = named(ACTS);
    const forbids = !asking && stated.some(a => { const at = mentionsOf(tO, a.kw); return at.length && !at.some(i => freeAt(tO, i)); });
    const condBefore = i => /(?:^| )(?:لو(?! سمحت)|اذا)(?: |$)/.test((' ' + tO + ' ').slice(0, i));
    // (chat fix 2 2026-11-08) Doctor room: «بعد الاسبرين»، «قبل المورفين» name a moment, not an order.
    const timeRef = i => !NM() && /(?:^| )(?:بعد|قبل) (?:ما )?$/.test((' ' + tO + ' ').slice(0, i));
    // (chat fix 2 2026-11-08) Doctor room: a «الغي» in one sentence does not cancel the next («الغي alteplase. بدي enoxaparin»).
    const CL = !NM() && /[.،؛!\n]/.test(ordParts.join(' ') || text) ? (ordParts.join(' ') || text).split(/[.،؛!\n]+/).map(s => nz(s)).filter(Boolean) : null;
    const clauseFree = a => CL.some(cl => mentionsOf(cl, a.kw).some(j => freeAt(cl, j)));
    const said = list => (asking ? [] : named(list).filter(a => FORCED.has(a.id) || mentionsOf(tO, a.kw).some(i => (CL ? clauseFree(a) : freeAt(tO, i)) && !condBefore(i) && !timeRef(i))));
    const short = tO.split(' ').length <= 3;
    const ordText = ordParts.join(' ');
    const found = said(ACTS).map(a => { const dose = clauseDose(ordText || text, a.kw, said(ACTS).length > 1); return { a, dose }; });
    // A long sentence with no verb is talk about the drug: the nurse checks instead of acting.
    // (chat fix 2 2026-11-08) Doctor room: a procedure in a short list of orders («NPO. وfoley + UO كل ساعة») is ordered too.
    const drugs = found.filter(x => ORD.test(tO) || URGENT.test(tO) || x.dose || short || (tO.split(' ').length <= 5 && !actOf(x.a.id).dose) || (!NM() && !actOf(x.a.id).dose && !['shock', 'cpr'].includes(x.a.id) && tO.split(' ').length <= 8 && !/[؟?]/.test(text) && /[+،,.]|(?:^| )و\S/.test(text)));
    const unclear = found.find(x => !drugs.includes(x));
    const strict = a => mentionsOf(tO, a.kw).some(i => ORD.test((' ' + tO + ' ').slice(0, i).trim().split(' ').slice(-3).join(' ')));
    // A cannula or a vitals check has no dose: "12-lead" beside it is not one.
    // (chat fix 2026-11-08) sayName: the drug as the trainee named it («مورفين»), for the nurse's read-back only.
    const actions = drugs.map(({ a, dose: d0 }) => { const dose = actOf(a.id).dose ? d0 : ''; return { id: a.id, agent: '', dose, bare: !dose && !strict(a), sayName: sayNameOf(a.id, ordText || text) }; });
    /* (chat fix 2026-11-08) Doctor room: history is read only from the parts of a message that ask. An order names drugs,
       tests and symptoms («اعطوها فنتولين»، «قيسوا الحرارة»، «اعطوا دوا»); it asks nothing, so nobody recites a history. */
    let factsFixed = false, patQ = '';
    if (!NM()) {
      const QW = /^(?:و)?(?:من )?(?:امتي|ايمتي|متي|شو|كم|قديش|وين|ليش|هل|كيف|مين)(?: |$)/;
      // («بلش فجأة؟» asks; an order said with «؟» still names the drug or test it wants.)
      const ordP = p => ordParts.includes(p) && orderish(p) && !QW.test(nz(p)) && (!/[؟?]/.test(p) || [...D.actions, ...D.tests].some(a => hasAny(nz(p), a.kw)));
      if (parts.some(ordP)) {
        const q = parts.filter(p => !ordP(p)).map(p => nz(p)).join(' ');
        facts = q ? facts.filter(id => { const f = c.facts.find(x => x.id === id); return f && hasAny(q, f.kw); }) : [];
        if (!q) factsFixed = true;
      }
      // «من امتى…؟», «قديش صارلك…؟»: the onset is what is asked, whatever else the sentence names.
      if (c.facts.some(f => f.id === 'onset') && /^(?:و)?(?:من (?:امتي|ايمتي|متي|قديش|وقتيش|كم)|(?:قديش|كم) صار\S*|since|how long)(?: |$)/.test(t)) facts = ['onset'];
      // A family history question is not the patient's own illnesses; «منع حمل» is the pill, not a pregnancy.
      if (facts.some(id => /^(?:family|clot_family|family_c)$/.test(id)) && /(?:^| )(?:بال|ب|في ال)?(?:عيله|العيله|اهلك|اهله|اهلها)(?: |$)/.test(t) && !/(?:^| )(?:عندك|عنده|عندها|انت|انتي)(?: |$)/.test(t)) facts = facts.filter(id => id !== 'known');
      if (/(?:منع|مانع) (?:ال)?حمل/.test(t)) facts = facts.filter(id => id !== 'pregnant');
      // «شو صار معه؟»، «شو فيها؟»، «شو قصته؟»: what happened, asked of the relative, who saw it.
      const TP = /(?:^| )شو (?:(?:اللي )?(?:صار|صاير) (?:معه|معها|فيه|فيها|له|لها)|ماله|مالها|فيه|فيها|بيه|بيها|قصته|قصتها)(?: |$)|(?:^| )كيف صار (?:معه|معها)(?: |$)/;
      // (chat fix 2 2026-11-08) «شو صار مع ابوك؟»، «بنتك شو شافت؟»، «شو شفتي؟»: the same story, asked of the relative.
      const KIN = '(?:ابوك|امك|ابنك|بنتك|جوزك|زوجك|مرتك|زوجتك|اخوك|اختك|المريض|المريضه)';
      const TP2 = new RegExp('(?:^| )شو (?:اللي )?(?:صار|صاير) (?:مع|ل|عند) ' + KIN + '(?: |$)|(?:^| )' + KIN + ' شو (?:صار|صاير|شاف\\S*|فيه|فيها|ماله|مالها)(?: |$)|(?:^| )(?:شو|كيف) (?:شفت|شفتي|شافت|شاف|لقيته|لقيتها|لقيتو)(?: |$)|(?:^| )كيف (?:صار|بلش) (?:مع )?' + KIN + '(?: |$)');
      if ((TP.test(t) || TP2.test(t)) && wordsIn(t) <= 7 && !VITALS_Q.test(t) && !D.tests.some(x => hasAny(t, x.kw)) && !D.actions.some(a => hasAny(t, a.kw))) {
        const note = c.facts.find(f => /_note$/.test(f.id));
        if (note) { facts = [note.id]; factsFixed = true; }
      }
      // «شو صار؟» alone is the opening question.
      if (/^شو (?:اللي )?(?:صار|صاير)$|^شو القصه$|^شو بتشكي(?: .*)?$|^شو صارلك$/.test(t)) { facts = []; factsFixed = true; }
      /* (chat fix 2 2026-11-08) What every patient can answer, whatever the case file lists: how he feels now (from
         what the room did), his name, his age, where he is. A fact the case wrote for it still comes first. */
      const NOWW = /(?:^| )(?:هسا|هسه|اسا|هلا|هلق|الحين|now|بعد|صار|صرت|لسا|احسن|اتحسن\S*|تحسن\S*|خف|خفت|خفيف)(?: |$)/;
      const FEELQ = /(?:^| )(?:كيف|شو) (?:حاسس|حاسه|بتحس|بتحسي|حالك|صرت|وضعك|نفسك|تنفسك|صدرك|الوجع|وجعك|الالم|الدوخه|راسك)(?: |$)|(?:^| )كيفك (?:هسا|هلا|هلق|الحين|اسا)(?: |$)|(?:^| )(?:الوجع|وجعك) (?:صار )?(?:كم|قديش)(?: |$)|(?:كم|قديش) من (?:10|عشره)/;
      // («احسن ... ولا ...» between two drugs is a question for the supervisor, not how he feels.)
      const FEELB = /^(?:و)?(?:احسن|اتحسنت|اتحسنتي|تحسنت|تحسنتي|خف|خفت)(?: شوي)?$|(?:صار|صرت|حاسس|حاسه) احسن|(?:^| )(?:احسن|اتحسن\S*) (?:شوي |شي |اشي )?(?:ولا|او)(?: |$)|(?:^| )اتحسن (?:شي|اشي)(?: |$)/;
      if (!actions.length && !exam.length && (FEELQ.test(t) || (FEELB.test(t) && !D.actions.some(a => hasAny(t, a.kw)) && !/[a-z]{3,}/.test(t))) && (NOWW.test(t) || !facts.length) && !D.tests.some(x => hasAny(t, x.kw)) && !/(?:^| )(?:من امتي|امتي|متي|ايمتي|قبل)(?: |$)/.test(t)) { facts = []; factsFixed = true; patQ = 'feel'; }
      // «شو اللي بيوجعك؟»، «شو بتحس؟»: the complaint, in his words.
      else if (!facts.length && !actions.length && /(?:^| )شو (?:اللي )?(?:بيوجعك|بوجعك|بتوجعك|بتحس|بتحسي|حاسس|حاسه|مضايقك|مزعجك|بيضايقك)(?: |$)/.test(t)) { const f = c.facts.find(x => x.id === 'pain' && x.who !== 'companion') || c.facts.find(x => x.id === 'breath' && x.who !== 'companion'); if (f) { facts = [f.id]; factsFixed = true; } }
      else if (!facts.length && !actions.length && /(?:^| )(?:شو|ما) (?:اسمك|اسمه|اسمها)(?: |$)|(?:^| )اسمك(?: شو)?(?: |$)/.test(t)) { factsFixed = true; patQ = 'name'; }
      else if (!facts.length && !actions.length && /(?:قديش|كم) (?:عمرك|عمره|عمرها)|(?:عمرك|عمره|عمرها) (?:قديش|كم)/.test(t)) { factsFixed = true; patQ = 'age'; }
      else if (!facts.length && !actions.length && /(?:^| )(?:وين (?:انت|انتي|احنا|موجود\S*)|بتعرف وين|بتعرفي وين)(?: |$)/.test(t)) { factsFixed = true; patQ = 'where'; }
      if (patQ === 'name' && /(?:^| )(?:وين (?:انت|انتي|احنا)|بتعرف وين)(?: |$)/.test(t)) patQ = 'name_where';
    }
    // Keywords missed it: the trained reader looks for a finding this patient's record answers.
    const questionLike = /[؟?]/.test(text) || HISTORY.test(t) || / (?:شو|وين|قديش|كم|متي|امتي|ليش|هل|كيف) /.test(' ' + t + ' ') || /^(?:افحص|اسمع|شوف|بدي اسمع|خليني افحص|بدي افحص)/.test(t);
    if (questionLike && !facts.length && !exam.length && !actions.length && !factsFixed) {
      const hit = (c.findMap || {})[readFinding(text)];
      if (hit && c.facts.some(f => f.id === hit)) facts = [hit];
      else if (hit && c.exam.some(f => f.id === hit)) exam = [hit];
    }
    const why = text.match(/(عشان|لان|لأن|بسبب|لاستبعاد|لنفي|rule out|r\/o).*/i);
    const tests = said(D.tests).map(x => ({ id: x.id, reason: why ? why[0] : '', reason_ok: why ? 'ungraded' : 'none' }));
    // "Why is his breathing fast?" is clinical reasoning, a question for the supervisor, not for the patient.
    const reasoning = !facts.length && !exam.length && !actions.length && !tests.length && /^(?:ليش|لماذا|شو (?:سبب|يعني|معني))/.test(t) && /(?:نفسه|نبضه|ضغطه|حالته|وعيه|لونه|نفسها|نبضها|ضغطها|حالتها|وعيها|وجهه|وجهها|لونها|عرقان|عرقانه|اطرافه|اطرافها|شفايفه|شفايفها|بطنه|بطنها|سكره|سكرها)/.test(t) && !/(?:عندك|بتحس|نفسك|وجعك|حالك|معك)/.test(t);
    const SUPV = /(يا مشرف|يا استاذ|يا دكتور|شو (?:ب)?رايك|ساعدني|مش عارف|محتار|شو اعمل|ممكن (?:انا )?(?:ابدا|اسال)|(?:^| )(?:ننقل|نحول|نحجز|ندخل)\S*)|(?<=^| )(?<!انا |معك |اسمي )(?:دكتور|دكتوره|مشرف|استاذ)(?: |$)/; const NRSV = new RegExp('(?<=^| )(?<!انا )(?:سستر|ستر|ممرضه|نيرس|sister|nurse|' + norm(c.nurse.name) + ')(?: |$)'); const iS = t.search(SUPV), iN = t.search(NRSV); const toSup0 = iS >= 0 && !(iN >= 0 && iN < iS); const nurseVoc = iN >= 0 && !(iS >= 0 && iS < iN); const toSup = toSup0 || (reasoning && !nurseVoc); if (nurseVoc || (toSup0 && /(?:^|(?<!انا |معك |اسمي ))(?:يا )?(?:دكتور|دكتوره|مشرف|استاذ)(?: |$)/.test(t))) { facts = []; exam = []; }
    // "The numbers?" is asked of the nurse, who reads the monitor, never of the patient.
    // (chat fix 2026-11-08) Doctor room: «حطي» inside «انحطيتي» is not an order to the nurse.
    const toNurse = nurseVoc || new RegExp(NM() ? '(يا ممرض|يا سستر|يا ' + norm(c.nurse.name) + '|اعطي|ركبي|حطي|قيسي|جهزي|الارقام|ارقامه|ارقامها|علامات حيويه|vitals)' : '(يا ممرض|يا سستر|يا ' + norm(c.nurse.name) + '|(?:^| )[وف]?(?:اعطي|ركبي|حطي|قيسي|جهزي)|الارقام|ارقامه|ارقامها|علامات حيويه|vitals)').test(t);
    const tP = (' ' + t + ' ').replace(new RegExp(' ' + norm(c.companion.name) + ' ', 'g'), ' ');
    const toPat = (c.patient.addr || []).some(w => new RegExp('(?:^| )(?:يا )?' + norm(w) + '(?: |$)').test(tP)) && !t.includes(norm(c.companion.name));
    const toComp0 = /(يا حجه|يا حجي|يا خالتي|يا خاله|يا ست |يا عمي|اطمني|اطمن|هدي حال|ولا يهمك|لازم اشتغل|بعد اذنك|بنتك|ابوك|جوزك|زوجك|مرتك|زوجتك|معك حق|فهمت عليك|ما تخاف|ما تخافي|لا تخاف|لا تخافي|لا تقلق|يا عمو|عمو)/.test(t) || t.includes('يا ' + norm(c.companion.name)) || t.includes(norm(c.companion.name) + ' ');
    const toComp = toComp0 && !toPat;
    // Keywords go first: the model only speaks for a message nothing else could read.
    const act = !facts.length && !exam.length && !actions.length && !tests.length ? readAct(text) : null;
    const social = ['greeting', 'wish', 'thanks'].includes(act);
    const explaining = toComp && /(?:^| )و?(?:رح|راح|بدنا|هسا|ح) ن\S+/.test(t);
    const talkOnly = toComp && (!verb || explaining);
    // (chat fix 2026-11-08) Doctor room: a history question about the patient in the third person («هو بيدخن؟»،
    // «عنده حساسية؟»، «شو صار معه؟») is asked of the relative; whoever holds the fact answers it.
    const third = !NM() && !toPat && !toNurse && !toSup && !actions.length && !tests.length && facts.length > 0
      && /(?:^| )(?:هو|هي|عنده|عندها|معه|معها|فيه|فيها|ماله|مالها|قصته|قصتها|ابوك|امك|ابنك|بنتك|جوزك|زوجك|مرتك|زوجتك|بي\S{2,}|لقيته|لقيتها|اخد|اخذ|اجاه|اجاها)(?: |$)/.test(t)
      // («الوجع بيروح عالإيد؟» is the pain going somewhere, asked of the patient.)
      && !/(?:^| )(?:ال)?(?:وجع|الم|ضيق|دوخه|نفس|حراره|سخونه)\S* بي\S{2,}/.test(t);
    let to = talkOnly || (toComp && !actions.length) || third ? 'companion' : toSup && !social ? 'supervisor' : toNurse || actions.length || tests.length ? 'nurse' : 'patient';
    // (chat fix 2026-11-08) Telling the relative what happens next («رح نعطيه دوا للقلب») asks them nothing.
    if (!NM() && to === 'companion' && !third && !/[؟?]/.test(text) && /(?:^| )[وف]?(?:رح|راح|عم ن\S*|بنعطي\S*|بنعمل\S*|بدنا|اطمني|اطمن|ما تخاف\S*|لا تخاف\S*)(?: |$)/.test(t)) facts = [];
    // (chat fix 2 2026-11-08) Asking the relative's consent («بتوافقي؟») asks for a yes, not a history.
    if (!NM() && to === 'companion' && /(?:بتوافق\S*|موافق\S*|موافقتك|بتسمح\S*|بتسمحي|نوقع\S*|توقيع|توقعي|توقع)/.test(t)) { facts = []; }
    // "Take the adrenaline off" names a drug without ordering it.
    const stopped = E.pending && E.pending.type === 'unsafe' && STOP.test(t) && !/بدل|badal|instead/.test(t) && !toPat
      && (t.split(' ').length <= 5 || mentionsOf(t, (actOf(E.pending.a.id) || {}).kw || []).length > 0 || shortStop(text));
    // A reason or a reading that mentions a drug is not an order for it.
    // Naming a drug with a dose over a reading question is an order, not a reading.
    const answering = E.pending && ['reason', 'interpret'].includes(E.pending.type) && !toNurse && !verb && !drugs.some(x => x.dose);
    const opens = /شو (اللي )?(جابك|صار معك|صاير|مالك|بك|فيك)|احكيلي شو/.test(t) || (!NM() && /شو صارلك|شو بتشكي|^شو (?:اللي )?صار$|^شو القصه$/.test(t));
    const asks = / (شو|وين|قديش|كم|امتي|متي|ليش|هل|ايه|shu)( |$)/.test(' ' + t) && !/شو اخبار/.test(t);
    const small = !asks && (social || (act === null && /^(مرحب|اهلا|هلا|السلام|صباح|مساء)/.test(t)));
    let acts = talkOnly || stopped || answering ? [] : actions, tsts = talkOnly ? [] : tests, vague = '', vagueSub = '', unclearAr = unclear ? actOf(unclear.a.id).ar : '', unclearId = unclear ? unclear.a.id : '', readingOf = '';
    let dxAsk = false, dispoHome = false, allergenRef = '', resultAsk = null, statusOf = '', statusAll = false, titr = '', unknownDrug = '', planLater = null, roomQ = false, vitalsAsk = false, statusAsk = false, helpTeam = false, resultsAll = false, howIs = false, monitorAsk = false;
    /* (chat fix 2026-11-08) Doctor room. */
    if (!NM()) {
      // «اعطوه سوائل لتر»، «نص لتر»: a litre said in words is the dose the trainee gave.
      for (const a of acts) if (a.id === 'fluids' && !a.dose) { if (/(?:^| )(?:نص|نصف) (?:لتر|ليتر)(?: |$)/.test(tO)) a.dose = '500 مل'; else if (/(?:^| )(?:لتر|ليتر)(?: |$)/.test(tO) && !/\d/.test(tO)) a.dose = '1 لتر'; }
      /* (chat fix 2 2026-11-08) Doctor room: what a message is really about, before anything is ordered from it. */
      // An order said with no question mark asks no history («سوو له قسطرة بول» is not the urine history).
      if (acts.length && !/[؟?]/.test(text)) facts = [];
      // «10 وحدات تحت الجلد» right after «اعطوه انسولين» (held for its test): the dose is for that drug.
      if (!acts.length && !tsts.length && !facts.length && E.lastOrdered && E.turns - E.lastOrdered.turn <= 1 && !(E.pending && E.pending.type === 'dose') && actOf(E.lastOrdered.id) && !E.done.has(E.lastOrdered.id) && !E.harmed.has(E.lastOrdered.id) && !/[؟?]/.test(text)) {
        const dz = doseIn(ordText || text);
        if (dz && (doseOf(dz) || {}).kind !== 'vol' && !D.actions.some(a => a.id !== E.lastOrdered.id && hasAny(t, a.kw))) { acts = [{ id: E.lastOrdered.id, agent: '', dose: dz + (/(?:تسريب|بالساعه|infusion|drip)/.test(t) && !/\/h|ساع/.test(dz) && /\/kg/.test(dz) ? '/h' : ''), sayName: '' }]; to = 'nurse'; }
      }
      // «كمان 500 مل»، «نص لتر كمان»: a volume with no drug named is more fluid.
      if (!acts.length && !tsts.length && !facts.length && D.actions.some(a => a.id === 'fluids') && !/اكسجين|(?:^| )o2(?: |$)|nasal|ماسك|قناع/.test(t) && !(E.pending && E.pending.type === 'dose')) {
        const d = doseOf(ordText || text), wd = wordDose(tO);
        if (((d && d.kind === 'vol' && (d.by === 1 || E.done.has('fluids'))) || (wd && E.done.has('fluids'))) && (ORD.test(tO) || /(?:^| )(?:كمان|تاني|ثاني|بولس|bolus)(?: |$)/.test(tO) || wordsIn(tO) <= 3)) { acts = [{ id: 'fluids', agent: '', dose: d && d.kind === 'vol' ? doseIn(ordText || text) : wd, sayName: '' }]; to = 'nurse'; }
      }
      // Consent asked of the relative («بدنا نعمله قسطرة، بتوافقي؟») is the relative's to give; nothing is ordered by asking it.
      if (toComp0 && !toPat && /(?:بتوافق\S*|موافقتك|بتسمح\S*|بتسمحي|نوقع\S*|توقيع|توقعي)/.test(t)) { to = 'companion'; acts = []; tsts = []; facts = []; }
      // «شو في؟ ليش ساكتين؟»، «شو الوضع؟»: the nurse answers for the room, with the numbers.
      if (!facts.length && !acts.length && !tsts.length && /(?:^| )(?:ليش ساكتين|ليش ما حدا|ما حدا عم يرد|ليش ما بتردو|ليش ما بتردوا|وينكم|يا جماعه|حدا يرد|شو الوضع|شو الاخبار|كيف الوضع|كيفه|كيفو|كيفها|كيف حالته|كيف حالتها|كيف وضعه|كيف وضعها|وين الممرضه|وين السستر|وين الناس)(?: |$)/.test(t) && !toComp0) { roomQ = true; to = 'nurse'; exam = []; }
      // (chat check 2026-11-08) «طمنيني عنه»، «شو وضعه؟»، «كيف المريض؟»: the nurse gives the numbers and how he is going.
      if (!roomQ && !facts.length && !acts.length && !tsts.length && !toComp0 && /(?:^| )(?:طمنيني|طمنوني|طمنينا|طمنونا|طمني)(?: (?:عنه|عليه|عنها|عليها))?(?: |$)|(?:^| )(?:شو|كيف) (?:وضعه|وضعها|حالته|حالتها|وضع المريض|وضع المريضه|حاله المريض|المريض|المريضه)(?: |$)/.test(t)) { howIs = true; to = 'nurse'; exam = []; }
      // «شو صار بالفحوصات؟»، «طلعت النتايج؟»: the nurse says what is back and what is still out.
      if (!acts.length && !tsts.length && to !== 'companion' && to !== 'supervisor' && /(?:^| )[بوف]?(?:ال)?(?:فحوصات|فحوص|تحاليل|نتايج|نتائج|نتيجه|labs?)(?: |$)/.test(t) && /(?:^| )(?:شو|وين|كيف|طلع\S*|صار|اجت|اجو|وصل\S*|خلص\S*)(?: |$)/.test(t)) { resultsAll = true; to = 'nurse'; facts = []; exam = []; }
      // «ركبوله مونيتر»: he has been on the monitor since the door.
      if (!acts.length && !tsts.length && /(?:مونيتر|مونيتور|monitor)/.test(t) && !/[؟?]/.test(text)) { monitorAsk = true; to = 'nurse'; facts = []; exam = []; }
      // «ساعدوه»، «عالجوه»، «شوفوه»: help asked of the team: the nurse says what is usually started, and asks which.
      if (!facts.length && !acts.length && !tsts.length && /^(?:يلا )?(?:ساعدو|ساعدوه|ساعدوها|عالجوه|عالجوها|شوفوه|شوفوها|الحقوه|الحقوها|اعملوله اشي|اعملولها اشي|سوولو اشي)(?: \S+)?$/.test(t)) { helpTeam = true; to = 'nurse'; exam = []; }
      // «اعطني التشخيص»: the diagnosis is asked of the supervisor, who never names it.
      if (/(?:^| )(?:ال)?تشخيص|diagnos/.test(t) && !acts.length && !tsts.length && !facts.length) { dxAsk = true; to = 'supervisor'; }
      // Sending him home: the supervisor answers, with the numbers; nothing else in the sentence is ordered.
      if (/(?:طلع|روح)\S*(?: \S+)? (?:عال|ع ال|على ال|علي ال|لل)(?:دار|بيت)(?: |$)|(?:^| )(?:discharge|ديسشارج)/.test(t) && !/(?:^| )(?:كان|كنت|كانت|رجعت|رجع|وصلت|وصل)(?: |$)/.test(t)) { dispoHome = true; to = 'supervisor'; acts = []; tsts = []; facts = []; }
      // «لو الضغط نزل… شو الخطوة؟ ICU؟»: a plan for what might happen asks the supervisor; it orders nothing now.
      if (/[؟?]/.test(text) && /(?:^| )(?:لو|اذا)(?: |$)/.test(t) && /(?:شو (?:ال)?(?:خطوه|خطه|بنعمل|منعمل|بتعمل|بنسوي)|(?:^| )icu(?: |$)|عنايه|intubat|تنبيب|dialysis|غسيل|thrombolys|lysis)/.test(t) && !dispoHome) { to = 'supervisor'; acts = []; tsts = []; facts = []; }
      // «UFH احسن من LMWH؟ ولا enoxaparin 68 عادي»: comparing treatments asks the supervisor; it orders nothing.
      if (/[؟?]/.test(text) && /(?:^| )(?:احسن|افضل|vs|versus)(?: |$)/.test(t) && (D.actions.some(a => hasAny(t, a.kw)) || /[a-z]{3,}/.test(t)) && !dispoHome) { to = 'supervisor'; acts = []; tsts = []; facts = []; }
      // «اعطيه نفس الدوا اللي بيعمله حساسية»: the allergen, said without its name.
      if (/حساسي|تحسس|allerg/.test(t) && ORD.test(t) && /(?:نفس|ذات) (?:ال)?(?:دوا|دواء|اشي|شي)|(?:ال)?(?:دوا|دواء|اشي|شي) (?:اللي|يلي|الي)|(?:اللي|يلي) (?:بيعمل\S*|بتعمل\S*|عنده|عندها|بيتحسس\S*|بتتحسس\S*)/.test(t)) {
        const aid = Object.keys(E.c.care).find(k => (E.c.care[k] || {}).allergyKw && actOf(k));
        if (!aid) { allergenRef = 'none'; acts = []; }
        else if (!E.facts.has('allergy')) { allergenRef = 'unknown'; acts = []; }
        else { allergenRef = aid; acts = [{ id: aid, agent: norm(E.c.care[aid].allergyKw[0]), dose: '', sayName: '' }]; }
        to = 'nurse'; facts = []; tsts = [];
      }
      // Turning up (or down) what is already running: «زيدلها الاكسجين»، «ارفعوا النيترو ل 20»، «ارفعوه ل 20 ميكرو».
      const UPW = /(?:^| )[وف]?(?:ارفع\S*|زيد\S*|زود\S*|رفع(?:و|وا|ي|وه|وها|يه|يها|ولها|وله))(?: |$)/, DOWNW = /(?:^| )[وف]?(?:نزل(?:و|وا|ي|وه|وها|يه|يها|ه|ها|ولها|وله)|خفف\S*|قلل\S*)(?: |$)/;
      const titV = UPW.test(tO) ? 'up' : DOWNW.test(tO) ? 'down' : '';
      if (titV && !/راس|سرير|(?:^| )(?:رجل|اجر)\S*/.test(t)) {
        const run = id => E.done.has(id) && ((actOf(id) || {}).repeat || {}).up;
        let hit = acts.find(a => run(a.id));
        if (!hit && !acts.length && !tsts.length) { const last = [...E.done.keys()].filter(run).sort((x, y) => E.done.get(y).last - E.done.get(x).last)[0]; if (last) hit = { id: last, agent: '', dose: '', sayName: '' }; }
        if (hit) { hit._titr = titV; if (!hit.dose) hit.dose = doseIn(ordText || text) || ''; acts = [hit]; titr = titV; to = 'nurse'; facts = []; }
      }
      // «اعطيتيه الأسبرين؟»، «شو صار بالمضاد؟»، «كم الأكسجين؟»، «K كم؟»، «شو طلع بالتخطيط؟»: what was done and what came
      // back. The nurse answers from the room; nothing is ordered by asking.
      const PAST2 = /(?:^| )[وف]?(?:ا?عطيت(?:ي|و|يه|يها|وه|وها|يله|يلها|وله|ولها)|حطيت(?:ي|و|يله|يلها|وله|ولها)|ركبت(?:ي|و|يله|يلها|وله|ولها)|علقت(?:ي|و|يله|يلها|وله|ولها)|بلشت(?:ي|و|يه|وه)|سحبت(?:ي|و)|عملت(?:ي|و|يله|يلها|وله|ولها)|قست(?:ي|و|يله|وله))(?: |$)/;
      const asksNow = asking || (parts.some(p => /[؟?]/.test(p) && asksPart(p)) && !acts.length && !tsts.length) || (/[؟?]/.test(text) && PAST2.test(t)) || /(?:^| )(?:كم|قديش) (?:هو|هي|طلع\S*|صار|صارت)(?: |$)|(?:^| )(?:طلع|طلعت|صار|صارت) (?:كم|قديش)(?: |$)/.test(t);
      // «كم السكر؟»، «شو الضغط هسا؟»، «شو الحرارة؟»: a value asked now is the nurse's, whatever history its word also names.
      const HISTW = /(?:^| )(?:عندك|عنده|عندها|بالبيت|عاده|عادتا|كان|كانت|بتاخد\S*|بياخد\S*|من امتي|امتي|مرض|مريض|سكري|بتقيس\S*|بيقيس\S*|معك|زمان)(?: |$)/;
      const VAL = /(?:^| )(?:كم|قديش|شو)(?: |$)/.test(t) && wordsIn(t) <= 4 && !HISTW.test(t) && !toPat && !patQ;
      if (asksNow && VAL && to !== 'companion' && to !== 'supervisor') {
        const ra = resultAskOf(t);
        if (ra && ra.row && (ra.back || ra.sent || !VITALS_Q.test(t))) { resultAsk = ra; to = 'nurse'; facts = []; exam = []; acts = []; tsts = []; }
        else if (VITALS_Q.test(t)) { to = 'nurse'; facts = []; exam = []; vitalsAsk = true; }
      }
      // «شو صار بالإنسولين؟»: what happened to a treatment is asked of the nurse, never the patient's home history.
      if (asksNow && /(?:^| )شو (?:صار|صاير|عملتو|عملتي|سويتو) (?:ب|مع|في)/.test(t) && D.actions.some(a => hasAny(t, a.kw))) { facts = []; statusAsk = true; }
      // «سكر كمان ساعة صح؟»: a test to repeat later is a plan the nurse writes down, not a question to the patient.
      const PL = t.match(/(?:^| )((?:كل|كمان|بعد) (?:ساعه|ساعتين|نص ساعه|ربع ساعه|\d+ (?:دقيقه|دقايق|ساعه|ساعات)))(?: |$)/);
      const plT = PL && D.tests.find(x => (x.kw || []).some(k => (norm(k).length >= 3 || /[a-z]/.test(k)) && wordHas(t, k)));
      if (plT && !acts.length && to !== 'companion' && to !== 'supervisor') { planLater = { id: plT.id, when: PL[1].replace(/ساعه/g, 'ساعة').replace(/دقيقه/g, 'دقيقة') }; to = 'nurse'; facts = []; tsts = []; }
      if (asksNow && !planLater && !facts.length && !exam.length && to !== 'companion' && to !== 'supervisor' && !dxAsk && !dispoHome && !patQ) {
        const ra = resultAskOf(t);
        if (ra) { resultAsk = ra; to = 'nurse'; tsts = []; acts = []; }
        else { const st = statusOfQ(t) || (statusAsk ? { id: (D.actions.find(a => hasAny(t, a.kw)) || {}).id } : null); if (st && (st.id || st.all)) { statusOf = st.id || ''; statusAll = !!st.all; to = 'nurse'; acts = []; tsts = []; } }
      }
      // «حقنة كارديوفيكسان 5 مل وريدي»: a dose beside a name no drug here has.
      if (!acts.length && !tsts.length && !facts.length && !exam.length && !patQ && !toPat && to !== 'companion' && to !== 'supervisor' && !resultAsk && !statusOf && !statusAll && doseIn(ordText || text)) { const u = unknownName(tO); if (u) { unknownDrug = u; to = 'nurse'; } }
      // Words to the relative («بنحكيك بعد الـCT») never order again a test already sent.
      if (to === 'companion') tsts = tsts.filter(x => !E.tests[x.id]);
      // A question to the supervisor about a treatment («بعطيها مذيب ولا لأ؟») orders nothing.
      // (A plan with its dose said to the senior, «بحط نيترو 0.4 ملغ، ممكن دكتور؟», is still the order.)
      if (to === 'supervisor' && /[؟?]/.test(text) && (!doseIn(text) || /ولا (?:لا|لأ|لاء|شو)|شو (?:ب)?رايك|بنفع|بصير/.test(t))) { acts = []; tsts = []; }
      // While the supervisor waits for a reading, the test named with what it shows is the reading, never a new order.
      if (E.pending && E.pending.type === 'interpret' && !verb && tsts.length) tsts = tsts.filter(x => x.id !== E.pending.id && !(E.tests[x.id] && E.tests[x.id].back));
      // An order that names no drug («اعطوا دوا»، «اعطوه إبرة»، «اعطوه مسكن»، «اسحبوا دم»): the nurse asks which, and gives
      // nothing. A bare «مسكن» is no NSAID order; a named NSAID still is.
      if (to !== 'companion' && to !== 'supervisor' && !toComp0 && !asking && !allergenRef && !resultAsk && !statusOf && !statusAll && !titr && !unknownDrug &&!/(?:^| )[وف]?(?:اعطني|اعطيني|عطيني)(?: |$)/.test(tO) && !/(?:^| )(?:رح|راح|ح|بدنا|عم) ن\S+/.test(t) && !/(?:^| )[وف]?(?:لا|ما|بلاش|بدون|مش)(?: |$)/.test(tO)) {
        const NSAID = /ايبوبروفين|ibuprofen|diclofenac|ديكلوفيناك|nsaid|بروفين|بروفن|فولتارين|voltaren|ketorolac|كيتورولاك/;
        if (acts.some(a => a.id === 'analgesia') && !NSAID.test(tO)) { acts = acts.filter(a => a.id !== 'analgesia'); if (!acts.length && !tsts.length) vague = 'analgesic'; }
        if (!vague && !acts.length && !tsts.length && ORD.test(tO)) {
          if (/(?:^| )[وب]?(?:ال)?(?:دوا|دواء|ادويه|علاج|ابره|ابر|حقنه|اشي|شي|مسكن|مسكنات)(?: |$)|للوجع|للالم/.test(tO)) {
            vague = /مسكن|للوجع|للالم/.test(tO) ? 'analgesic' : 'drug';
            vagueSub = /(?:^| )[وب]?(?:ال)?(?:ابره|ابر|حقنه)(?: |$)/.test(tO) ? 'needle' : /للضغط/.test(tO) ? 'bp' : /للحراره|للسخونه/.test(tO) ? 'fever' : '';
          } else if (/(?:^| )(?:اسحب|ابعت|اطلب|اعمل)\S*(?: \S+)? (?:ال)?(?:دم|فحوصات|فحوص|تحاليل|تحليل|مختبر|لاب|labs?)(?: |$)/.test(tO)) vague = 'labs';
        }
        // «وحقنة زيرامايسينول كمان»: a needle and a name nobody knows is still "which drug?".
        if (!vague && !acts.length && !tsts.length && wordsIn(tO) <= 6 && /^[و]?(?:ال)?(?:حقنه|ابره)(?: |$)/.test(tO)) { vague = 'drug'; vagueSub = 'needle'; }
        if (vague) { facts = []; to = 'nurse'; }
      }
      // A question about a result or a number, with no history in it, is for the nurse who has them («K كم؟»).
      if (asking && !facts.length && !exam.length && to === 'patient' && !toPat && !patQ && !/(?:^| )(?:حبيبتي|حبيبي|يا حجه|يا حجي|يا عمي|يا خالتي|عمو|يا عمو)(?: |$)/.test(t) && (D.tests.some(x => hasAny(t, x.kw) && E.tests[x.id]) || (VITALS_Q.test(t) && /(?:^| )(?:كم|قديش|شو)(?: |$)/.test(t)))) to = 'nurse';
      // A result read out without being asked («في ST elevation بالـinferior»، «التروبونين مرتفع»): the supervisor hears it;
      // a test already back is never ordered again by naming it.
      const RES_W = /(?:^| )(?:في|فيه|فيها|بيحكي|بيبين|عالي|عاليه|مرتفع|مرتفعه|واطي|واطيه|منخفض|طبيعي|طبيعيه|ارتفاع|انخفاض|elevation|depression|normal|high|low|raised)(?: |$)/;
      if (!verb && !acts.length && !facts.length && !exam.length && to !== 'companion' && !/[؟?]/.test(text) && RES_W.test(t)) {
        const T = Object.values(E.tests).filter(x => x.back && (E.c.results[x.id] || {}).key).find(x => tsts.some(y => y.id === x.id) || hasAny(t, testOf(x.id).kw) || (x.id === 'ecg' && /(?:^| )(?:st|lead|leads|ليد|inferior|anterior|lateral|posterior)(?: |$)/.test(t)));
        if (T && tsts.every(y => E.tests[y.id] && E.tests[y.id].back)) { tsts = []; if (!(E.pending && E.pending.type === 'interpret')) { to = 'supervisor'; readingOf = T.id; } }
      }
      // (chat fix 2 2026-11-08) A history question only the relative can answer is the relative's; «اسكت» is said to them.
      if (to === 'patient' && !toPat && facts.length && facts.every(id => (c.facts.find(f => f.id === id) || {}).who === 'companion')) to = 'companion';
      if (to === 'patient' && !toPat && /(?:^| )(?:اسكت|اسكتي|اخرس|اخرسي)(?: |$)/.test(t)) to = 'companion';
      // A drug's name alone, asked («إبراتروبيوم؟»): the nurse checks whether it is wanted.
      if (asking && !facts.length && !exam.length && wordsIn(t) <= 3 && !unclearAr && !resultAsk && !statusOf && !statusAll && !patQ) { const one = D.actions.find(a => (a.dose || a.id === 'bicarbonate') && hasAny(t, a.kw)); if (one) { unclearAr = actOf(one.id).ar; unclearId = one.id; to = 'nurse'; } }
      // (chat fix 2 2026-11-08) A drug named with no order is the nurse's question «X؟ بدك إياه؟», whoever the reader guessed.
      if (unclearAr && to === 'patient' && !toPat && !facts.length) to = 'nurse';
    }
    const out = {
      act, text, forbids, unclear: unclearAr, unclearId, readingOf, noHelp: !!readingOf || undefined, toPat, named: D.actions.filter(a => hasAny(t, a.kw)).map(a => a.id), typedOrder: (verb || !!doseIn(text)) && !asking,
      to, facts, exam, actions: acts, tests: tsts, kind: toSup && !social ? 'help' : acts.length ? 'order' : opens ? 'open' : small ? 'smalltalk' : facts.length ? 'question' : 'other',
      vague, vagueSub, patQ, dxAsk, dispoHome, allergenRef, resultAsk, statusOf, statusAll, titr, unknownDrug, planLater, roomQ, helpTeam, resultsAll, howIs, monitorAsk,
      pending_ok: NM() ? offlineAnswer(text, t, { actions, tests, why, toSup, toComp, toNurse, toPat }) : vague || resultAsk || statusOf || statusAll || patQ || dxAsk || dispoHome || allergenRef || unknownDrug || planLater || roomQ || helpTeam || resultsAll || howIs || monitorAsk ? 'na' : offlineAnswer(text, t, { actions: acts, tests: tsts, why, toSup, toComp, toNurse, toPat }),
      tone: {
        introduced: /(انا الدكتور|انا دكتور|انا طالب|اسمي|معك الدكتور)/.test(t), empathy: act === 'wish' || /(بفهم|معك حق|حقك|سلامتها|سلامته|لا تخاف)/.test(t),
        rude: /(اسكت|اخرس|اطلع برا|مش شغلك|مالك دخل|غصب)/.test(t) && !/(لو سمحت|لحظه|شوي|بنشتغل|تفضل)/.test(t), jargon: false,
        explained: toComp && (NM() ? /(?:^| )[وف]?(?:رح|راح|عم ن\S*|بنعطي|بنعمل|الوضع|حالتها|حالته)(?: |$)/ : /(?:^| )[وف]?(?:رح|راح|عم ن\S*|بنعطي\S*|بنعمل\S*|بنركب\S*|بنحط\S*|بنشوف\S*|بدنا|الوضع|حالتها|حالته)(?: |$)/).test(t), consent: /(بعد اذنك|ممكن اسمع|ممكن افحص|بتسمح)/.test(t),
      }
    };
    // Nurse mode: who is meant is decided again (the doctor is on the phone, the instructor stands behind).
    return NM() ? nurseShape(out, t, text, false) : out;
  }
  const VITALS_Q = /(ضغط|نبض|اكسجين|ارقام|الرقم|حراره|تنفس|ساتورشن|ساتوريشن|spo2|sat|bp|hr)/;

