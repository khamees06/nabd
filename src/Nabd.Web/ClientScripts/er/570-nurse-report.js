  function concludeNurse(end) {
    const c = E.c, N = E.nurse, X = N.esc, s = scoreNurse(end);
    const fails = s.fails, passed = s.total >= 70 && !fails.length;
    const head = E.outcome === 'arrest' ? 'توقف قلب المريض قبل أن تستقر حالته' : E.outcome === 'stable' ? 'سلّمت المريض مستقراً' : 'سلّمت المريض وهو غير مستقر';
    // Review fix 2026-11-07: «أحسنت» and «ما يجب أن يتغير» are grouped under the seven sections.
    const good = SEC_N.map(() => []), gaps = SEC_N.map(() => []);
    let sec = 0;
    const G = x => good[sec].push(x), P = x => gaps[sec].push(x);
    // 1. ABCDE
    sec = 0;
    if (s.abcdeAt !== null) G(`أكملت التقييم الأولي ABCDE عند الدقيقة ${mm(s.abcdeAt)}.`);
    else {
      const PART = { a: 'المجرى الهوائي', b: 'التنفس', c: 'الدوران', d: 'الوعي وسكر الدم', e: 'الحرارة والفحص الكامل' };
      const miss = Object.entries(s.parts).filter(([, [p]]) => p < 2).map(([k]) => PART[k]);
      if (miss.length) P(`<b>التقييم الأولي</b>: لم تقيّم ${miss.join('، ')} في الدقائق الأولى.`);
    }
    s.reds.filter(f => !s.got.includes(f)).forEach(f => P(`<b>لم تصل إليك هذه المعلومة</b>: «${quoteOf(f, forNurse(f.say))}»`));
    // 2. escalation
    sec = 1;
    const ecg = E.tests.ecg;
    if (s.timing === 10) G(`أبلغت الطبيب عند الدقيقة ${mm(X.calledAt)}، قبل أن تتدهور الحالة.`);
    else if (s.timing === 5) P(`<b>التصعيد</b>: تأخر إبلاغ الطبيب إلى الدقيقة ${mm(X.calledAt)}، ${typeof N.nm.escBy === 'number' ? 'وكانت العلامات الحيوية عند وصول المريض تستدعي إبلاغاً فورياً.' : 'وكان تخطيط القلب يستدعي إبلاغاً فورياً.'}`);
    else if (X.by === 'alarm') P(`<b>التصعيد</b>: لم تبلّغ ${docT()}، و${N.sex === 'F' ? 'حضرت' : 'حضر'} بسبب إنذار المونيتور عند الدقيقة ${mm(N.alarmAt)}.`);
    else P('<b>التصعيد</b>: لم تبلّغ الطبيب.');
    if (X.sbar && X.sbar.none) P('<b>رسالة التصعيد</b>: لم تقدّم للطبيب رسالة SBAR حين سألك عن الوضع.');
    else if (X.sbar) {
      const miss = [['s', 'الوضع'], ['b', 'الخلفية'], ['a', 'التقييم بالأرقام'], ['r', 'التوصية']].filter(([k]) => !X.sbar[k]).map(([, v]) => v);
      if (miss.length) P(`<b>رسالة التصعيد</b>: ناقصها ${miss.join('، ')}.`);
      if (X.sbar.aWrong) P('<b>رسالة التصعيد</b>: ذكرت أرقاماً لا تطابق المونيتور.');
      if (X.sbar.goodSuggest) G('اقترحت على الطبيب ما تحتاجه الحالة.');
    }
    if (typeof N.nm.escBy !== 'number' && ecg && X.calledAt !== null && X.calledAt >= ecg.at) G(`سجّلت تخطيط القلب عند الدقيقة ${mm(ecg.at)} وأبلغت الطبيب بعده بـ${fix(X.calledAt - ecg.at, 1)} دقيقة.`);
    if (s.rose && s.follow === 0) P('<b>بعد التدهور</b>: لم تُحدّث الطبيب حين ساءت الأرقام.');
    const code = N.helpAt.find(h => h.stage >= 2 || h.vt);
    if (code) G(`ناديت فريق الإنعاش عند الدقيقة ${mm(code.at)} والحالة حرجة.`);
    // 3. interventions within nursing scope
    sec = 2;
    s.own.forEach(k => { if (k.state === 'ontime') G(`${k.d.label}: عند الدقيقة ${mm(k.at)}.`); else P(`<b>${esc(k.d.label)}</b>: ${k.state === 'late' ? 'تأخر إلى الدقيقة ' + mm(k.at) : 'لم يحدث'}. ${esc(k.d.why || '')}`); });
    s.bed.forEach(k => { const ar = testOf(k.id).ar; if (k.state === 'ontime') G(`${ar}: عند الدقيقة ${mm(k.at)}.`); else P(`<b>${esc(ar)}</b>: ${k.state === 'late' ? 'تأخر إلى الدقيقة ' + mm(k.at) : 'لم يحدث'}. ${esc(k.why || '')}`); });
    s.ords.forEach(({ o, lag }) => { if (lag === null) P(`<b>أمر الطبيب</b>: ${esc(o.ar)} لم يُنفّذ.`); else G(`نفّذت أمر ${o.ar} بعد ${fix(lag, 1)} دقيقة من صدوره.`); });
    if (s.gapIds.length) {
      const ars = s.gapIds.map(id => (actOf(id) || testOf(id) || {}).ar || id);
      const whys = s.gapIds.map(id => c.care[id]).filter(d => d && d.harm && d.why).map(d => d.why);
      P(`<b>خارج نطاق التمريض المستقل</b>: حاولت ${esc(ars.join('، '))} دون أمر طبيب، فلم يُنفَّذ. الأدوية والسوائل والفحوصات المخبرية والتصوير تحتاج أمراً من الطبيب في بروتوكولات الطوارئ المعتادة.${whys.length ? ' ومن ملف الحالة: ' + esc(whys.join(' ')) : ''}`);
    }
    N.scope.filter(x => x.why === 'wrong-agent').forEach(x => P(`<b>دواء غير الذي طُلب</b>: ${esc((actOf(x.id) || {}).ar || x.id)}، فلم يُعطَ.`));
    if (N.notIndicated.length) P('<b>الأكسجين</b>: طلبته والإشباع ضمن الهدف.');
    const ivx = E.done.get('iv_access');
    if (N.drawn !== null && ivx && Math.abs(N.drawn - ivx.at) <= 1) G('سحبت عينات الدم مبكراً مع الكانيولا.');
    if (N.bls.length) G(`فتحت المجرى الهوائي أو هوّيت بالأمبو عند الدقيقة ${mm(N.bls[0])} (إنعاش أساسي ضمن صلاحيتك).`);
    E.harms.forEach(h => P(`<b>${esc(h.label)}</b>: ${esc(h.why)}`));
    // 4. medication safety
    sec = 3;
    if (s.first) {
      if (s.first.allergyAsked) G('سألت عن الحساسية قبل أول دواء.');
      else P(`<b>الحساسية</b>: أعطيت ${esc((actOf(s.first.id) || {}).ar || '')} قبل أن تسأل عن الحساسية.`);
    }
    if (N.bandNoted && E.facts.has('allergy')) G('سجّلت الحساسية على الملف ووضعت سوار الحساسية.');
    // Told to the doctor is the doctor's side only; the gap shows only once there was a doctor to tell.
    if (s.toldPts) G('ذكرت حالة الحساسية للطبيب.');
    else if (N.allergyGuess !== null) P('<b>الحساسية</b>: أخبرت الطبيب أن لا حساسية قبل أن تسأل المريض أو أهله.');
    else if (X.calledAt !== null) P('<b>الحساسية</b>: لم تذكر للطبيب حالة الحساسية.');
    E.wrongDoses.forEach(w => P(`<b>جرعة مختلفة عن الأمر</b>: ${esc(w.ar)} ${esc(w.dose)}. الأمر: ${esc(w.ref || '')}.`));
    // Cultures drawn after the first antibiotic dose (the case file's own reason).
    E.lateTests.forEach(x => P(`<b>${esc(x.ar)} بعد المضاد</b>: ${esc(x.why)}`));
    if (N.ordersAt !== null) { if (s.rbPts) G('أعدت قراءة أوامر الطبيب الشفهية للتأكد منها.'); else P('<b>إعادة قراءة الأمر</b>: لم تُعِد قراءة أوامر الطبيب الشفهية للتأكد منها.'); }
    // 5. reassessment
    sec = 4;
    if (s.iv.length) G(`أعدت قياس العلامات الحيوية بعد ${s.covered.length} من ${s.iv.length} تدخلات.`);
    s.iv.filter(x => !s.covered.includes(x)).forEach(x => P(`<b>إعادة التقييم</b>: بعد ${esc(x.ar)} عند الدقيقة ${mm(x.at)} لم تُعِد قياس العلامات الحيوية خلال 5 دقائق.`));
    if (N.vchecks.length && s.gapMax > 5) P(`<b>المراقبة</b>: مرّت ${fix(s.gapMax, 1)} دقائق دون قياس للعلامات الحيوية.`);
    if (!N.vchecks.length) P('<b>المراقبة</b>: لم تُعِد قياس العلامات الحيوية خلال الحالة.');
    // 6. communication (as in the doctor room)
    sec = 5;
    if (E.comm.introduced) G('عرّفت بنفسك.');
    if (E.comm.explained) G('شرحت ما يجري بكلام مفهوم.');
    else P(`<b>التواصل</b>: لم تشرح لـ${esc(c.companion.name)} ما يجري، وتدخلت ${E.comp.count} مرة.`);
    if (E.comm.rude) P('<b>التواصل</b>: خرج منك كلام جارح تحت الضغط.');
    // 7. handover
    sec = 6;
    if (end) {
      const miss = [['s', 'الوضع'], ['b', 'الخلفية'], ['a', 'التقييم بالأرقام'], ['r', 'التوصية']].filter(([k]) => !end.grade[k]).map(([, v]) => v);
      if (miss.length) P(`<b>التسليم</b>: ناقصه ${miss.join('، ')}.`);
      if (end.grade.invented) P('<b>التسليم</b>: ذكرت ما لم يحدث. التسليم الخاطئ يضلل من يستلم المريض.');
      if (end.grade.allergy) G('ذكرت حالة الحساسية في التسليم.');
    }
    const secs = SEC_N.map((h, i) => (good[i].length || gaps[i].length ? `<section class="er-sec"><h5>${h}</h5>`
      + (good[i].length ? `<p class="er-sec-k">أحسنت</p><ul class="er-good">${good[i].map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '')
      + (gaps[i].length ? `<p class="er-sec-k">ما يجب أن يتغير</p><ul class="er-gaps">${gaps[i].map(x => `<li>${x}</li>`).join('')}</ul>` : '') + '</section>' : '')).join('');
    const riskTop = Math.round(Math.max(...E.riskLog.map(p => p[1]))), riskEnd = Math.round(E.risk), anxTop = Math.round(E.anxTop);
    const reasoned = Object.values(E.tests).some(t => t.reason);
    const src = t => (orderedTest(t.id) ? 'أمر الطبيب' : NURSE_TESTS.has(t.id) ? 'ضمن صلاحيتك' : 'أمر الطبيب');
    const tried = [...new Map(N.scope.filter(x => x.kind === 'test' && !E.tests[x.id]).map(x => [x.id, x])).values()];
    const blocked = tried.map(x => `<tr class="is-blocked"><td><span dir="ltr">${esc(testOf(x.id).en)}</span></td><td class="font-num" dir="ltr">${clk(x.at)}</td><td>—</td><td>محاولة دون أمر</td>${reasoned ? '<td>—</td>' : ''}<td>—</td><td>لم يُنفَّذ: يحتاج أمراً من الطبيب.</td></tr>`).join('');
    const tests = testRows(reasoned, src) + blocked;
    const box = $('er-debrief');
    box.hidden = false;
    box.innerHTML = `<div class="er-report-page er-report-n">
      <div class="er-score" tabindex="-1"><b class="font-num">${s.total}</b><div><strong>${head}</strong><span>${passed ? 'مجتاز' : fails.length ? 'غير مجتاز: ' + esc(fails.join('، ')) : 'غير مجتاز'} · مدة الحالة ${mm(E.sim)}</span></div></div>
      <p><b>دورك:</b> ممرض/ة الطوارئ المسؤول/ة عن السرير</p>
      <ul class="er-parts">
        <li>التقييم الأولي (ABCDE) <b class="font-num">${Math.round(s.assess)} / 15</b></li><li>التعرف على التدهور والتصعيد <b class="font-num">${Math.round(s.escPts)} / 20</b></li>
        <li>التدخلات ضمن نطاق التمريض <b class="font-num">${Math.round(s.interv)} / 20</b></li><li>سلامة الدواء <b class="font-num">${Math.round(s.med)} / 15</b></li>
        <li>المتابعة وإعادة التقييم <b class="font-num">${Math.round(s.reass)} / 10</b></li><li>التواصل <b class="font-num">${Math.round(s.comm)} / 10</b></li>
        <li>التسليم (SBAR) <b class="font-num">${Math.round(s.hand)} / 10</b></li>
      </ul>
      <h4>الخطر خلال الحالة</h4>${chart()}<p class="er-small">أعلى خطر <b class="font-num">${riskTop}%</b> · عند النهاية <b class="font-num">${riskEnd}%</b> · أعلى ضغط من الأهل <b class="font-num">${anxTop}%</b></p>
      ${secs ? `<h4>الملاحظات حسب الأقسام</h4>${secs}` : ''}
      <h4>سجل الفحوصات المطلوبة وتوقيت طلبها في الجلسة</h4>${tests ? `<div class="er-scroll"><table class="er-tests"><thead><tr><th>الفحص</th><th>وقت الطلب</th><th>الاستطباب</th><th>المصدر</th>${reasoned ? '<th>تبريرك عند الطلب</th>' : ''}<th>التبرير عند التسليم</th><th>لماذا</th></tr></thead><tbody>${tests}</tbody></table></div>` : '<p>لم تُجرِ أي فحص.</p>'}
      ${end && end.grade.note ? `<h4>تسليمك</h4><p>${esc(end.grade.note)}</p>` : ''}
      <p><b>تشخيص الطبيب (للاطلاع، لا يُقيَّم)</b>: ${esc(fell() && c.collapse.dx ? c.collapse.dx : c.dx.ar)}</p>
      <h4>لماذا كانت الحالة خطرة؟</h4><p>${esc(c.brief)}</p>
      <p class="er-small">طلبت مساعدة المشرفة ${E.helps} مرة، وبادرت هي ${E.hints} مرة. حُدّد نطاق التمريض هنا وفق بروتوكولات الطوارئ المعتادة، وقد يختلف من مستشفى لآخر. الحالات والدرجات وعبارات الطبيب والمشرفة تدريبية ولم يراجعها طبيب بعد.</p>
      <div class="er-pane-f"><button type="button" class="s" id="er-home">الرئيسية</button><button type="button" class="s" id="er-again">أعد الحالة نفسها</button><button type="button" class="p" id="er-next">الحالة التالية</button></div>
    </div>`;
    $('er-again').onclick = () => begin(c.id, { role: 'nurse' });
    $('er-next').onclick = () => begin(undefined, { role: 'nurse' });
    $('er-home').onclick = () => { if (typeof navigateTo === 'function') navigateTo('home'); };
    lastReport = E;
    box.querySelector('.er-score').focus({ preventScroll: true });
    box.scrollTop = 0;
    save(s, passed, end);
  }

