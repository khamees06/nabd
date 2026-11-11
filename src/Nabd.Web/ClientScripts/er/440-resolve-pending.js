  function resolve(grade, text) {
    const p = E.pending;
    E.pending = null;
    E.resolved = true;
    if (p.type === 'offer') {
      if (grade === 'good') { if (p.id) { nurse(NM() || !testOf(p.id) ? 'حاضر.' : `حاضر، ${testOf(p.id).ar}.`); orderTest(p.id, '', 'none'); } else if (p.a) order({ id: p.a.id, agent: '', dose: NM() || !(actOf(p.a.id) || {}).dose ? '' : doseIn(text), sayName: NM() ? '' : sayNameOf(p.a.id, text) }, text); }
      else nurse('تمام.');
      nextQuestion();
      return;
    }
    if (grade === 'withdraw') {
      // (chat fix 2 2026-11-08) Doctor room: she says what she cancelled; a «لا» to «ماشي عالاتنين؟» cancels both.
      if (!NM() && p.type === 'dose') {
        const also = E.lastQ && E.lastQ.turn === E.turns - 1 ? E.lastQ.items.filter(q => q !== p && E.queue.some(([x]) => x === q)) : [];
        E.queue = E.queue.filter(([q]) => !also.includes(q));
        nurse(`تمام، لغيت ${[p, ...also].map(spk).join(' و')}.`);
      } else nurse(!NM() && p.a && actOf(p.a.id) ? `تمام، لغيت ${spk(p)}.` : 'تمام، لغيته.');
    } else if (p.type === 'dose' && !NM() && !doseFor(p, text) && !wordDose(norm(text)) && !ACCEPT.test(norm(text)) && allergicTo({ agent: '' }, E.c.care[p.a.id] || {}, text)) {
      // (chat fix 2 2026-11-08) Doctor room: «اوجمنتين» alone answers "which?": she asks the dose; the name stays with
      // the order, so the allergy check sees it when the dose comes.
      const nm = text.trim().split(/\s+/).slice(0, 2).join(' ');
      E.pending = { ...p, a: { ...p.a, sayName: nm, said: (p.a.said || '') + ' ' + text }, name: nm, tip: '', sug: undefined, since: E.sim };
      nurse(`${nm}، حاضر. قديش الجرعة؟`);
      return;
    } else if (p.type === 'dose' && allergicTo({ agent: '' }, E.c.care[p.a.id] || {}, (NM() ? '' : (p.a.said || '') + ' ') + text)) {
      // "Give an antibiotic." "Which?" "Augmentin." is the same order as naming it outright.
      unsafe({ ...p.a, dose: (NM() ? text : ((p.a.sayName || '') + ' ' + text).trim()).slice(0, 40), _asked: true }, actOf(p.a.id), E.c.care[p.a.id], true);
    } else if (p.type === 'dose') {
      const meta = actOf(p.a.id), def = E.c.care[p.a.id] || {};
      const typed = NM() ? doseIn(text) : doseFor(p, text) || wordDose(norm(text));
      // (chat fix 2 2026-11-08) «زيدلها الأكسجين» to her proposal is a yes to it.
      const accepted = ACCEPT.test(norm(text)) || (!NM() && grade === 'good' && !!p.sug && !typed);
      const a = { ...p.a, dose: typed || (accepted && p.sug) || '', _asked: true, _ok: grade, said: (p.a.said || '') + ' ' + text };
      if (!NM() && !a.sayName) a.sayName = sayNameOf(p.a.id, text);
      if (accepted && p.sug && !typed) a.sayDose = p.tip.split(' (أو')[0].split('، ')[0];
      // "Yes" to "which one?" names nothing.
      if (accepted && !p.sug) {
        E.pending = p; E.resolved = false;
        // (chat fix 2 2026-11-08) Doctor room: it takes the proposals she made beside it, and asks again for this one.
        const list = NM() ? [] : E.queue.filter(([q]) => q.type === 'dose' && q.sug).map(([q]) => q);
        if (list.length) { E.queue = E.queue.filter(([q]) => !list.includes(q)); list.forEach(q => order({ ...q.a, dose: q.sug, sayDose: shortTip(q), _asked: true, _ok: 'good' }, text)); nurse('و' + spk(p) + ': أي نوع وقديش؟'); return; }
        nurse('أي نوع بالزبط، وقديش؟', { d: 'أي وسيلة، وعلى كم بالزبط؟' }); return;
      }
      // (chat fix 2 2026-11-08) Doctor room: a name with no dose («ليفوفلوكساسين») answers "which?", not "how much?".
      if (!NM() && !typed && !accepted) {
        const nm = sayNameOf(p.a.id, text);
        if (nm && (!a.dose)) { E.pending = { ...p, a: { ...p.a, sayName: nm, said: a.said }, name: nm, tip: '', sug: undefined, since: E.sim }; nurse(`${nm}، حاضر. قديش الجرعة؟`); return; }
      }
      // Her own proposal, taken as said, is never "a wrong dose".
      if (!(!NM() && accepted && !typed) && doseBad(NM() ? { ...a, dose: '' } : a, def, NM() ? text : a.dose || text, grade)) {
        badDose({ ...a, dose: a.dose || text.slice(0, 24) }, meta, def);
        if (!p.retried) {
          E.pending = { ...p, retried: true };
          nurse('دكتور، هاي الجرعة مش مزبوطة، راجعها.', 'الكمية غير مناسبة، فلم يُنفَّذ. راجعها.');
          return;
        }
        nurse('هاي الجرعة ما بقدر أعطيها. اطلبه من جديد بجرعة صحيحة، أو اسأل المشرف.', 'لم يُنفَّذ: الكمية غير مناسبة.');
      } else if (!(a.dose && overTotal(a, meta, def))) {
        give(a, meta, def);
        // One "yes" takes every other proposal she made in the same breath.
        if (accepted) for (const item of E.queue.filter(([q]) => q.type === 'dose' && q.sug)) { E.queue.splice(E.queue.indexOf(item), 1); order({ ...item[0].a, dose: item[0].sug, sayDose: item[0].tip.split(' (أو')[0].split('، ')[0], _asked: true }, text); }
      }
    } else if (p.type === 'reason') {
      if (grade === 'wrong' && !p.retried) {
        E.pending = { ...p, retried: true };
        nurse('هاد السبب مش راكب مع الحالة. شو بدك تشوف فيه؟');
        return;
      }
      submitTest(p.id, text.slice(0, 120), grade === 'good' ? 'good' : grade === 'ungraded' ? 'ungraded' : 'weak');
    } else if (p.type === 'unsafe') {
      const care = E.c.care[p.a.id];
      if (grade === 'wrong' && p.def.early && care && !tooEarly(care)) { nurse('هسا صار وقته، ببلش فيه.'); order({ ...p.a }, text); }
      else if (grade === 'wrong') harm(p.a, actOf(p.a.id), p.def, p.allergic, true);
      else nurse(!NM() && E.lastRead && (E.lastRead.actions || []).some(a => a.id !== p.a.id) ? 'تمام، بلاش ' + actOf(p.a.id).ar + '.' : 'تمام، ما بعطيه.');
    } else if (p.type === 'interpret' && grade === 'noted') {
      person('d', 'طيب، كمّل.');
    } else if (p.type === 'interpret') {
      E.tests[p.id].read = grade;
      log('read', `قراءة ${testOf(p.id).en}: ${grade === 'good' ? 'صحيحة' : grade === 'partial' ? 'ناقصة' : 'خاطئة'}`);
      // The instruction goes first and the findings are cut to fit; the diagnosis never reaches the supervisor's words.
      const en = testOf(p.id).en, found = resultText(p.id);
      const brief = head => head + found.slice(0, Math.max(0, 295 - head.length));
      if (grade === 'good') person('d', pickOf(['تمام، هيك القراءة.', 'صح، كمّل.', 'مزبوط، طيب شو الخطوة الجاية؟']));
      else if (grade === 'partial') voice('d', 'supervisor', brief(`The trainee read the ${en} partly right. Say it is right so far, then point to the one finding they left out, by its lead, value or place, and ask what it means. Never name the diagnosis, the artery or the procedure. Findings: `), `صح لحد هون، بس في إشي ناقص بالـ${en}. شو كمان شايف؟`);
      else voice('d', 'supervisor', brief(`The trainee misread the ${en}. Point to one lead or value that does not fit their reading and ask them to look again. Never name the diagnosis, the artery or the procedure. Findings: `), `ارجع للـ${en} مرة ثانية، في إشي مش راكب مع قراءتك.`);
    }
    nextQuestion();
  }

