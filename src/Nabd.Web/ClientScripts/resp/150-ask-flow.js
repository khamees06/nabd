  const howAreYou = () => young() ? (fem() ? 'بنتي تعبانة شوي، عشان هيك جينا.' : 'ابني تعبان شوي، عشان هيك جينا.')
    : fem() ? 'الحمد لله، بس تعبانة شوي، عشان هيك إجيت.' : 'الحمد لله، بس تعبان شوي، عشان هيك إجيت.';

  async function onAsk(text) {
    text = (text || '').trim();
    if (!text || S.done) return;
    say('me', text);
    const input = $('rs-input');
    input.value = '';
    input.disabled = true;
    const caseNo = S.caseNo;
    try {
      const tests = matchTests(text);
      if (tests.length) { tests.forEach(orderTest); return; }
      if (VITAL_CUE.test(norm(text))) { measure(); return; }
      let groups = null;
      const dots = typing();
      const r = await chatApi(text);
      dots.remove();
      // The student may have submitted or moved to a new patient while the question was out.
      if (S.done || S.caseNo !== caseNo) return;
      if (r) {
        say('pt', r.reply);
        record([...new Set(r.ids.map(id => M.encoder.ev_group[evIndex[id]]))]);
        return;
      }
      {
        const found = matchLocal(text);
        if (found.length && (found.length === 1 || found[1].score < found[0].score * 0.85)) groups = [found[0].g];
        else if (found.length) {
          const chips = found.slice(0, 3).map(f => `<button type="button" class="rs-chip" data-g="${f.g}">${esc(qText(heads[f.g]))}</button>`).join('');
          say('sys', 'هل تقصد أحد هذه الأسئلة؟', `<div class="rs-chips">${chips}</div>`);
        } else if (GREET.test(norm(text))) {
          say('pt', /كيف|شلون/.test(text) ? howAreYou() : 'أهلين.');
        } else {
          say('sys', 'لم أفهم السؤال. جرّب صياغة أخرى، أو اختر من «قائمة الأسئلة».');
        }
      }
      if (groups) groups.forEach(askGroup);
    } finally {
      if (S.caseNo === caseNo && !S.done) { input.disabled = false; input.focus(); }
    }
  }

  function askGroup(g) {
    g = Number(g);
    if (S.done) return;
    if (S.asked.has(g)) {
      say('pt', answer(g), '<small class="rs-again">سبق أن سألت هذا السؤال.</small>');
      return;
    }
    say('pt', answer(g));
    record([g]);
  }

  function renderQuestionList(filter) {
    const f = norm(filter || '');
    const rows = [];
    heads.forEach((n, g) => {
      const t = T.evidences[n];
      if (!t) return;
      const q = qText(n);
      if (f && !norm(q + ' ' + t.q + ' ' + (t.alt || []).join(' ')).includes(f)) return;
      rows.push(`<button type="button" class="rs-q${S.asked.has(g) ? ' is-asked' : ''}" data-g="${g}">${esc(q)}</button>`);
    });
    $('rs-qlist').innerHTML = rows.join('') || '<p class="rs-muted">لا أسئلة بهذه الكلمة.</p>';
  }

