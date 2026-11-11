  // The reply to an open question, offline. Keyword rules cannot truly read free text, so they only ever err towards
  // sparing the patient: a dangerous drug is given on a short, plain yes and nothing else. The model never triggers harm.
  const STOP = /(?:^| )[وف]?(?:لا|ما|مش|مو|ماني|لست|لن|لسا|بلاش|بدون|بدل|غير\S*|ابد|ابدا|ممنوع|مستحيل|لحظه|استن\S*|خلص|رجعي\S*|شكيت|شاكك|شيل\S*|انسي\S*|غلط\S*|وقف\S*|نوقف\S*|الغي\S*|نلغي\S*|la|bala|bla|balash|msh|mish|mesh|wa2f\S*|wa2ef\S*|badal|no|not|don|dont|never|stop|hold|skip|forget|wait|cancel|instead|switch)(?: |$)|معك حق|خليني ات?اكد/;
  // "اه صح 98. خلص. كيتونات": one sentence of up to three words that is a stop.
  const shortStop = text => String(text || '').split(/[.!؟?،,\n]+/).map(x => norm(x).trim()).some(x => x && x.split(' ').length <= 3 && STOP.test(x));
  function offlineAnswer(text, t, { actions, tests, why, toSup, toComp, toNurse, toPat }) {
    const p = E.pending;
    if (!p) return 'na';
    if (p.type === 'which') return 'na';
    // (chat fix 2026-11-08) «أطلب KFT؟»، «أسبرين؟ بدك إياه؟»: a yes takes it, a no drops it, anything else is not a reply.
    // (chat fix 2 2026-11-08) Doctor room: «اعطوا سوائل» over «أطلب KFT؟» orders the fluids; it is no yes to the test.
    if (p.type === 'offer' && !NM() && (actions.some(a => !p.a || a.id !== p.a.id) || tests.some(x => x.id !== p.id))) return 'na';
    // (chat fix 2 2026-11-08) «الدوا اللي بيوسع الصدر» said again over «بخار؟ بدك إياه؟» is a yes to it.
    if (p.type === 'offer' && !NM() && p.a && !/[؟?]/.test(text) && !STOP.test(t) && mentionsOf(t, (actOf(p.a.id) || {}).kw || []).some(i => freeAt(t, i))) return 'good';
    if (p.type === 'offer') return ACCEPT.test(t) || /^(?:اه |ايوه |نعم )?(?:اطلب\S*|ابعت\S*|اسحب\S*|اعطي\S*|اعطو\S*|بدي اياه|بدي)(?: |$)/.test(t) ? 'good' : /^(?:لا|لاء|لأ|خلص|بلاش|لا خلص)(?: |$)/.test(t) ? 'withdraw' : 'na';
    if (!NM() && p.type === 'interpret' && ((ORDER.test(t) && t.split(' ').length <= 5) || actions.length || ACCEPT.test(t) || /^(?:لا|لاء|لأ|لا خلص|خلص)$/.test(t))) return 'na';
    // (chat fix 2 2026-11-08) Doctor room: an order, a question, a request to look or a word to the family is not a reading;
    // a reading names what the test shows.
    if (!NM() && p.type === 'interpret') {
      const READING = /\d|(?:^| )(?:في|فيه|فيها|شايف\S*|بيحكي|بيبين|بتبين|بيدل|يدل|معناه|يعني|st|elevation|depression|lead|leads|inferior|anterior|lateral|posterior|septal|sinus|tachy\S*|brady\S*|normal|طبيعي\S*|عالي\S*|واطي\S*|مرتفع\S*|منخفض\S*|ارتفاع|انخفاض|acidosis|alkalosis|حماض|حموض\S*|قلوي\S*|metabolic|respiratory|hypox\S*|نقص|زياده|positive|negative|ايجابي|سلبي|stemi|nstemi|lvh|af|rbbb|lbbb|block|qrs|موجه|نظم|منتظم|سريع|بطيء|كيتو\S*|dka|بلوك|ischemi\S*|اقفار|احتشاء|strain|خثره|جلطه|تعبان\S*|ضعيف\S*|منيح\S*|سيء|خربان\S*|فشل|قصور|failure|aki|injury|مش طبيعي\S*|غلط)(?: |$)/;
      if (ORDER.test(t) && !READING.test(t)) return 'na';
      if (/^(?:و)?(?:ليش|ليه|كيف|وين|متي|امتي|هل|ممكن|بنفع|مين|قديش|كم)(?: |$)/.test(t) || /(?:^| )(?:شوف|شوفي|شوفو|شوفوا|شوفيلي|شوفولي|اسمع\S*|افحص\S*|قيس\S*)(?: |$)/.test(t) || toComp || toPat || tests.length) return 'na';
      if (!READING.test(t)) return 'na';
    }
    const word = readAct(text);
    const asks = /[؟?]/.test(text);
    if (p.type === 'unsafe') {
      // "Not sure, but give it": the last clause decides.
      const clause = t.split(/ (?:بس|لكن) /).pop();
      if (/(?:^| )ليش لا(?: |$)/.test(clause)) return 'wrong';
      if (toSup || toComp || toPat || asks) return 'na';
      if (/ما بدي (?:اوقف|اغير|الغي)|علي مسووليتي/.test(clause)) return 'wrong';
      const aboutIt = clause.split(' ').length <= 5 || mentionsOf(clause, (actOf(p.a.id) || {}).kw || []).length > 0 || shortStop(text);
      if ((STOP.test(clause) && aboutIt) || actions.some(a => NM() ? (a.id !== p.a.id || (p.allergic && !allergicTo(a, E.c.care[a.id] || {}, text))) : p.allergic ? (!allergicTo(a, E.c.care[a.id] || {}, text) && (a.id === p.a.id || sameFam(a.id, p.a.id))) : sameFam(a.id, p.a.id))) return 'good';
      if (tests.length) return 'na';
      const plain = clause.split(' ').length <= 4 && /^(?:[اتنب]?عطي\S*|كمل\S*|متاكد|اكيد|نعم|ايوا|ايوه|اه|طبعا|yes|sure)(?: |$)/.test(clause);
      return plain ? 'wrong' : word === 'no' || word === 'refuse' ? 'good' : 'na';
    }
    const social = ['greeting', 'wish', 'thanks'].includes(word) || (word === null && /^(?:مرحب|اهل|هلا|السلام|صباح|مساء|شكر|يعطيك|طيب|لا$|ما بعرف|مش عارف)/.test(t));
    if (p.type === 'dose') {
      if (p.sug && ACCEPT.test(t)) return 'good';
      if (toSup || toComp || social || (word === 'unsure' && !doseIn(text)) || /^(?:ما بعرف|مش عارف|مش متذكر|ما بتذكر|مش متاكد)/.test(t)) return 'na';
      // "لا تعطيه" withdraws; "ما تتعبي حالك" said to the patient does not.
      if (/(?:^| )(?:(?:لا|ما) ت?(?:عط|حط|ركب|شغل|بلش|علق|كمل)\S*|بلاش|don t|hold|skip)(?: |$)/.test(t)) return 'withdraw';
      // Milligrams do not answer a question about litres of oxygen.
      if (p.a.id === 'oxygen' && /(?:ملغ|مغ|غرام|mg|mcg)/.test(t)) {
        // ...they answer the next proposal in her list: that one becomes the open question, oxygen waits its turn.
        const i = E.queue.findIndex(([q]) => q.type === 'dose' && q.a.id !== 'oxygen');
        if (i < 0) return 'na';
        const [next] = E.queue.splice(i, 1);
        E.queue.unshift([p, `دكتور، ${p.name}: ${p.tip || 'أي نوع وكم؟'}، ماشي؟`, 'n']);
        E.pending = next[0];
        E.pending.since = E.sim;
        return offlineAnswer(text, t, { actions, tests, why, toSup, toComp, toNurse, toPat });
      }
      if (!NM()) {
        // (chat fix 2 2026-11-08) «لسا 91؟»: a number past any oxygen flow is a reading; «زيدلها الأكسجين» takes her proposal.
        const d0 = doseOf(text);
        if (p.a.id === 'oxygen' && d0 && !d0.kind && d0.hi > 15) return 'na';
        if (p.sug && !d0 && /(?:^| )(?:زيد\S*|ارفع\S*|زود\S*|اكتر|عالاخر|علي الاخر)(?: |$)/.test(t) && !/راس|سرير/.test(t) && !actions.some(a => a.id !== p.a.id) && mentionsOf(t, (actOf(p.a.id) || {}).kw || []).length) return 'good';
        // A dose that fits another open proposal, and not this one, answers that one («40 ملغ» is the furosemide, not the GTN).
        if (d0 && !tests.length && !actions.some(a => a.id !== p.a.id) && !doseFits(p, text)) {
          const i = E.queue.findIndex(([q]) => q.type === 'dose' && doseFits(q, text));
          if (i >= 0) {
            const [next] = E.queue.splice(i, 1);
            E.queue.unshift([p, `دكتور، ${p.name}: ${p.tip || 'أي نوع وكم؟'}، ماشي؟`, 'n']);
            E.pending = next[0];
            E.pending.since = E.sim;
            return offlineAnswer(text, t, { actions, tests, why, toSup, toComp, toNurse, toPat });
          }
        }
      }
      // (chat fix 2 2026-11-08) Doctor room: the small act model calls «ماشي» a number; a number needs a digit.
      const num = word === 'number' && (NM() || /[\d٠-٩]/.test(text));
      if ((num || doseIn(text)) && !tests.length && !actions.some(a => a.id !== p.a.id)) return 'partial';
      if (asks || tests.length || actions.some(a => a.id !== p.a.id)) return 'na';
      if (num || doseIn(text) || /(?:لتر|ملغ|مغ|غرام|جرع|حبه|حبتين|نص )/.test(t)) return 'partial';
      if (STOP.test(t)) return 'withdraw';
      // "Which one?" is answered by a name; "how much?" is not.
      return !toNurse && actions.length && ((actOf(p.a.id).limits || []).some(l => l.kw)) ? 'partial' : 'na';
    }
    if (p.type === 'reason') {
      // A reason cannot be judged without the server, so it costs nothing either way.
      if (why) return 'ungraded';
      if (/^(?:بلاش|الغي|خلص)/.test(t)) return 'withdraw';
      if ((actions.length && toNurse) || tests.some(x => x.id !== p.id) || toSup || social || asks || t.length < 2 || /اطمني|يا حجه|يا عمي|يا خالتي/.test(t) || ['yes', 'no', 'refuse'].includes(word)) return 'na';
      return word === 'unsure' && t.split(' ').length < 3 ? 'na' : 'ungraded';
    }
    if ((actions.length && toNurse) || tests.some(x => x.id !== p.id) || toComp || /ساعد|شو اعمل|مش عارف|محتار|ما بعرف/.test(t)) return 'na';
    // A reading cannot be judged without the server, so it is taken as said.
    return social || asks || word === 'unsure' || t.length < 2 ? 'na' : 'noted';
  }

