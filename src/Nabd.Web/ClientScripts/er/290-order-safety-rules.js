  // "levofloxacin instead of penicillin" names the allergen without ordering it; only the word
  // right before each mention decides, so "tazocin without delay" is still tazocin.
  const allergicTo = (a, def, text) => {
    if (!def.allergyKw) return false;
    const written = norm(a.agent ? a.agent + ' ' + (a.dose || '') : text);
    const at = [];
    def.allergyKw.forEach(k => {
      const word = norm(k);
      for (let i = written.indexOf(word); i >= 0; i = written.indexOf(word, i + 1)) at.push([i, word.length]);
    });
    // Spellings and typos nobody listed: amoxycillin, co-amoxyclav, اوغمانتين.
    if (def.allergyStem) for (const m of written.matchAll(new RegExp(def.allergyStem, 'g'))) at.push([m.index, m[0].length]);
    return at.some(([i, n]) => {
      const start = written.lastIndexOf(' ', i) + 1;
      const before = written.slice(0, start).trim().split(' ').slice(-3).join(' ');
      return freeAt(written, start + 1) && !/(حساسيه|حساسيته|allerg\w*)( من| to)?( ?ب?ال)?$/.test(before) && !/^allerg/.test(written.slice(i + n).trim());
    });
  };

  // An order the case file never planned for: the nurse asks why, as she would.
  const offCase = meta => ({
    harm: true, off: true, risk: meta.risky ? 8 : 0, label: meta.ar + ' دون استطباب',
    why: meta.risky ? 'لا استطباب له في هذه الحالة، وقد يضر المريض.' : 'لا استطباب له في هذه الحالة، ولم يغيّر شيئاً.',
    challenge: `دكتور، ${meta.ar}؟ شو الاستطباب هون؟ متأكد؟`, effect: 'ساءت حالة المريض.',
  });
  // Safe only once the patient is sick enough: by the reading on the monitor when the case gives one.
  // A pressor holding the number up does not mean the pressure is holding.
  const untreatedSbp = () => Math.min(vitalsAt(E.risk).sbp, Number(E.bp[0]) || 999);
  const tooEarly = def => {
    const h = def.stableHarm;
    if (!h) return false;
    if (E.anaph && !E.anaph.treated) return false;
    if (h.unlessDone && E.done.has(h.unlessDone)) return false;
    if (h.sbp) return untreatedSbp() >= h.sbp;
    if (h.hrAbove) return E.vtNow || live().hr > h.hrAbove;
    return E.stage < (h.stage || 3);
  };
  // Beside adrenaline these are fair during anaphylaxis, whatever the case file planned.
  const ADJUNCT = ['neb_salbutamol', 'steroid'];
  // IV push with a pulse is the classic fatal error in anaphylaxis.
  const ivPush = t => /(?:^| )(?:iv|وريد\S*|push|بوش|bolus)(?: |$)/.test(t) && !/(?:^| )(?:im|عضل\S*|بالعضل|فخذ\S*|infusion|تسريب|مضخه|بطيء)(?: |$)/.test(t);
  // The numbers and the reader can each object; neither can overrule the other's objection.
  const SUBCUT = /(?:^| )(?:تحت الجلد|subcut\S*|sc|s c|sq)(?: |$)/;
  const doseBad = (a, def, text, reader) => doseCheck(a, def, text) === 'wrong' || reader === 'wrong' || (a.id === 'adrenaline' && E.anaph && !E.anaph.treated && ivPush(norm((a.dose || '') + ' ' + text))) || (def.ivOnly && SUBCUT.test(norm((a.dose || '') + ' ' + text)));

  function again(a, meta, def, prev) {
    const r = meta.repeat;
    if (!r || def.once) { nurse(`${meta.ar}؟ ${!NM() && fem(meta.ar) ? 'عملناها' : 'عملناه'} من شوي.`, 'سبق أن نفّذت هذا قبل قليل.'); return false; }
    if (prev.n >= r.max) { nurse(`${meta.ar} أخدنا كفاية منه، شو الخطوة الجاية؟`, 'بلغ هذا الحد الأقصى المقرر، فلم يُنفَّذ.'); return false; }
    if (E.sim - prev.last < r.gap) {
      // (chat fix 2 2026-11-08) Doctor room: more fluid asked while the first bolus runs is hung as soon as it is in.
      if (!NM() && a.id === 'fluids' && !a._later && !E.fluidLater) {
        const wait = r.gap - (E.sim - prev.last), dose = a.dose || prev.dose || '';
        E.fluidLater = true;
        later(wait + 0.02, () => { E.fluidLater = false; if (!E || E.over) return; order({ ...a, dose, _asked: true, _ok: 'good', _later: true }, a.said || ''); });
        nurse(`السوايل الأولى لسا نازلة. ${dose ? 'بعلّق ' + dose : 'بعلّق التانية'} أول ما تخلص، ${wait <= 0.4 ? 'بعد شوي' : wait <= 1.2 ? 'بعد دقيقة تقريباً' : 'بعد دقيقتين تقريباً'}.`);
        return false;
      }
      if (!NM() && a.id === 'fluids' && E.fluidLater) { nurse('التانية مستنية تخلص الأولى، وبعلّقها.'); return false; }
      nurse(`${meta.ar}؟ لسا معطيينه، خلينا نشوف تأثيره.`, 'انتظر أثر ما أعطيته أولاً.');
      return false;
    }
    return true;
  }

  function overTotal(a, meta, def) {
    const cap = def.total || meta.total, prev = E.done.get(a.id);
    if (!cap || !prev) return false;
    if ((prev.amt || 0) + amountOf(a, def, a.said || '') <= cap.hi * SCALE[cap.unit][1]) return false;
    badDose({ ...a, dose: a.dose + ' (فوق المجموع)' }, meta, def);
    nurse(`دكتور، مجموع ${meta.ar} صار فوق الحد. ما بقدر أزيد.`, 'تجاوز ذلك الكمية المقررة، فلم يُنفَّذ.');
    return true;
  }

