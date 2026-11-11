  /* ---------- tests ---------- */
  /* phase8 2026-11-07: a test outside the indication is no longer questioned on the spot; the question
     moves to the handover sheet (a written justification). The 'harm' response below is unchanged. */
  const ASK_NO_NOW = false;
  // A test is a click or a sentence away and its result lands in the chat at once.
  function orderTest(id, reason, ok, quiet) {
    const meta = testOf(id);
    if (!meta) return;
    const have = E.tests[id];
    if (have) {
      if (have.el && have.el.scrollIntoView) have.el.scrollIntoView({ block: 'center' });
      if (!quiet) nurse(have.back ? `طلع من شوي، ${resultBrief(id)}` : `نتيجة ${meta.ar} لسا ما طلعت.`, have.back ? 'النتيجة صدرت من قبل.' : 'النتيجة لم تصدر بعد.');
      return;
    }
    submitTest(id, reason || '', reason ? (ok === 'good' || ok === 'ungraded' ? ok : 'weak') : 'ungraded');
  }

  function submitTest(id, reason, reasonOk) {
    settle(q => q.type === 'reason' && q.id === id);
    const meta = testOf(id), res = E.c.results[id] || {};
    // Some tests are fine until the patient crashes.
    const shocked = res.whenShock && untreatedSbp() < 90;
    const ind = shocked ? res.whenShock : res.ind || 'no', why = shocked ? res.shockWhy : res.why;
    if (res.before && E.done.has(res.before)) E.lateTests.push({ ar: meta.ar, why: res.beforeWhy });
    E.tests[id] = { id, at: E.sim, reason, reasonOk, ind, why, back: false, read: null };
    log('test', `طلب ${meta.en}${reason ? ' (' + reason + ')' : ''}`);
    // Blood is drawn through the cannula: ordered in the same breath, the results come after it is in.
    const iv = E.done.get('iv_access');
    // 2026-11-08: the card shows «بانتظار النتيجة» and the «Labs» count grows at once, before a delayed result.
    if (iv && E.sim - iv.at < 0.05) { buildRecords(); later(0.12, () => { resultBack(id); buildRecords(); }); }
    else { resultBack(id); buildRecords(); }
    if (ind === 'harm') {
      E.risk = clamp(E.risk + 6, 0, 100);
      voice('d', 'supervisor', `The trainee ordered ${meta.en}, which is dangerous right now: ${why} Stop them firmly and ask what it would change.`, `استنى، ليش ${meta.en} هسا؟ شو رح يغيّر بالـmanagement والمريض مش stable؟`, true);
    } else if (ASK_NO_NOW && ind === 'no' && E.askedNo < 2) {
      E.askedNo++;
      voice('d', 'supervisor', `The trainee ordered ${meta.en}, not needed here: ${res.why} Ask one short question about what it would change, without giving the answer.`, `${meta.en}؟ شو رح يغيّر بالخطة هسا؟`);
    }
    // A test is work being done, from the chat or from the records panel.
    E.busyTurn = E.turns;
    if (!compOn('onTest', id, 0.3)) director('turn');
  }

  const resultText = id => {
    const r = E.c.results[id] || {};
    return (r.rows || []).map(x => x[0] + ' ' + x[1] + (x[2] ? ' ' + x[2] : '')).join(', ') + (r.report || '');
  };
  function labCard(id) {
    const meta = testOf(id), r = E.c.results[id] || {};
    const table = (r.rows || []).length ? `<table class="er-lab" dir="ltr"><thead><tr><th>Test</th><th>Result</th><th>Reference</th></tr></thead><tbody>${r.rows.map(x =>
      `<tr${x[4] ? ' class="is-flag"' : ''}><td>${esc(x[0])}</td><td><b>${esc(x[1])}</b>${x[2] ? ` <small>${esc(x[2])}</small>` : ''}${x[4] ? ` <i>${esc(x[4])}</i>` : ''}</td><td>${esc(x[3])}</td></tr>`).join('')}</tbody></table>` : '';
    /* phase8 2026-11-07: an out-of-indication result is shown in full, marked amber with its badge.
       2026-11-08 (owner): on the page the card is titled with the test's English name only. */
    const off = offInd(E.tests[id]);
    return `<div class="er-card${off ? ' is-off' : ''}">${off ? `<span class="er-off-badge">${OFF_BADGE}</span>` : ''}<div class="er-card-h">${REAL ? `<b dir="ltr">${esc(meta.en)}</b>` : `<b>${esc(meta.ar)}</b><bdi dir="ltr">${esc(meta.en)}</bdi>`}</div>${table}${r.report ? `<p class="er-report" dir="ltr">${esc(r.report)}</p>` : ''}</div>`;
  }
  function resultBack(id) {
    const t = E.tests[id], res = E.c.results[id] || {};
    t.back = true;
    // A culture drawn is not a result yet: nothing to read for hours.
    const waiting = /incubat/i.test(res.report || '');
    t.el = say('lab', '', labCard(id));
    if (NM()) later(0.02, () => releaseOrders());
    if (offInd(t) && t.el && t.el.classList) t.el.classList.add('is-off'); // phase8 2026-11-07
    if (waiting) nurse('سحبت الزراعة من مكانين، والنتيجة بعد يوم أو يومين.', 'سُحبت الزراعة، ونتيجتها بعد يوم أو يومين.');
    if (!waiting && res.key && (res.ind === 'indicated' || res.ind === 'acceptable') && E.readAsks < 3) {
      E.readAsks++;
      ask({ type: 'interpret', id, ask: `The supervisor asked the trainee to read the ${testOf(id).en}. Reference reading: ${res.key}. good = matches, partial = incomplete, wrong = contradicts, na = not a reply.` }, pickOf([`شو بتقرأ بالـ${testOf(id).en}؟`, `طيب، الـ${testOf(id).en} شو بيحكيلك؟`]), 'd');
    }
  }

