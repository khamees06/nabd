  function finish(choice, urgent) {
    S.done = true;
    $('rs-submit').hidden = true;
    const truth = S.pt.path;
    const tName = M.classes[truth];
    const right = choice === truth;
    const tri = triage(M.meta.severity[tName], urgent);
    const asked = S.steps.length - 1;
    const qp = qPoints(asked);
    const score = (right ? 60 : 0) + (tri.ok ? 25 : 0) + qp;
    // A pass needs a history: a right guess from the opening line alone is not one.
    const passed = score >= 70 && asked >= 3;
    const last = S.steps[S.steps.length - 1].p;
    const top = last.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
    const ar = c => esc(T.conditions[M.classes[c]] || M.classes[c]);
    const missed = bestMissed(truth);
    renderBars();
    $('rs-feed').querySelectorAll('.rs-chips').forEach(c => c.remove());

    const html = `<div class="rs-result">
      <div class="rs-score" tabindex="-1"><b class="font-num">${score}%</b><span>${right ? 'تشخيص صحيح' : 'التشخيص غير صحيح'} · ${passed ? 'مجتاز' : 'غير مجتاز'}</span></div>
      ${asked < 3 ? '<p class="rs-warnline">لا تُحسب الحالة ناجحة قبل أن تسأل 3 أسئلة على الأقل: أخذ القصة المرضية جزء من المهارة.</p>' : ''}
      <p><b>التشخيص الصحيح:</b> ${ar(truth)}${right ? '' : ` · <b>اخترت:</b> ${ar(choice)}`}</p>
      ${tri.html}
      <ul class="rs-break">
        <li>التشخيص <b class="font-num">${right ? 60 : 0} / 60</b></li>
        <li>تقدير الخطورة <b class="font-num">${tri.ok ? 25 : 0} / 25</b></li>
        <li>${asked < 3 ? `الأسئلة (${asked}، والحد الأدنى 3)` : `عدد الأسئلة (${asked})`} <b class="font-num">${qp} / 15</b></li>
      </ul>
      <h4>رأي النموذج بعد أسئلتك</h4>
      <ol class="rs-top">${top.map(([p, i]) => `<li>${ar(i)} <b class="font-num">${pct(p)}</b></li>`).join('')}</ol>
      <h4>كيف تغيّر احتمال التشخيص الصحيح مع كل سؤال</h4>${spark(truth)}
      ${missed.length ? `<h4>أسئلة كانت ستقرّبك أكثر</h4><ul class="rs-missed">${missed.map(m => `<li><b>${esc(qText(heads[m.g]))}</b><span>الجواب: ${esc(answer(m.g))}</span></li>`).join('')}</ul>` : ''}
      <h4>العلامات الحيوية</h4>
      <p>${S.measured ? '' : '<b>لم تقسها.</b> في الطوارئ تُقاس أولاً. '}${esc(vitalsLine(S.vit))}.</p>
      <h4>الفحوصات التي طلبتها (${S.tests.length})</h4>
      ${S.tests.length ? `<ul class="rs-missed">${S.tests.map(id => `<li><b>${esc(catOf(id).ar)}</b><span>${esc(resultFor(id).summary)}</span></li>`).join('')}</ul>` : '<p>لم تطلب أي فحص.</p>'}
      <p class="rs-note">النموذج تدرّب على مرضى افتراضيين، ودوره هنا تعليمي فقط.</p>
      <div class="rs-actions"><button type="button" class="p" id="rs-next">مريض جديد</button><button type="button" class="s" id="rs-home">العودة للرئيسية</button></div>
    </div>`;
    const card = say('sys', '', html);
    // Start the reader at the score, not at the buttons below it.
    const feed = $('rs-feed');
    feed.scrollTop += card.getBoundingClientRect().top - feed.getBoundingClientRect().top - 8;
    card.querySelector('.rs-score').focus({ preventScroll: true });
    $('rs-next').onclick = () => begin();
    $('rs-home').onclick = () => { if (typeof navigateTo === 'function') navigateTo('home'); };
    $('rs-input').disabled = true;
    $('rs-send').disabled = true;
    $('rs-dx-btn').disabled = true;

    try {
      const u = typeof authState !== 'undefined' && authState.user;
      if (u) {
        u.history = u.history || [];
        u.history.unshift({ caseTitle: 'غرفة الطوارئ التنفسية · ' + (T.conditions[tName] || tName), mode: 'غرفة الطوارئ التنفسية · ' + (S.exam ? 'امتحان' : 'تدريب'), date: new Date().toISOString().slice(0, 10),
          workupCount: S.tests.length, questions: asked, score: `${score}% (${passed ? 'مجتاز' : 'غير مجتاز'})`, caseId: 'resp_' + tName, num: score, passed, ts: Date.now() });
        u.stats = u.stats || {};
        u.stats.completed = u.history.length;
        if (typeof saveAccountToStorage === 'function') saveAccountToStorage(u);
      }
    } catch (e) { console.error(e); }
  }

