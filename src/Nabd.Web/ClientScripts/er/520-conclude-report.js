  function conclude(end) {
    if (E.over) return;
    E.over = true;
    E.riskLog.push([E.sim, E.risk]);
    cancelAnimationFrame(tickId);
    $('er-sheet').hidden = true;
    if ($('er-records')) $('er-records').classList.remove('is-open');
    const sound = document.querySelector('.er-mon .nb-mon-sound');
    if (sound && sound.getAttribute('aria-pressed') === 'true') { sound.click(); soundBack = true; }
    $('view-er').dataset.stage = 'calm';
    $('view-er').dataset.rhythm = '';
    $('er-input').disabled = true;
    ['er-send', 'er-test', 'er-end'].forEach(id => { $(id).disabled = true; });
    if (NM()) { concludeNurse(end); return; }
    const c = E.c, s = score(end);
    // A score cannot buy back a harmed patient: these fail the case whatever the number says.
    const fails = [];
    if (E.outcome === 'arrest') fails.push('توقف القلب');
    if (s.place === 'bad') fails.push(`وجهة خطرة: ${DISPO[end.dispo]}`);
    if (E.harms.some(h => h.risk >= 8)) fails.push('أذى وصل إلى المريض');
    if (s.safety.some(k => k.state === 'missed')) fails.push('خطوة أساسية لم تحدث');
    if (end && E.vtNow) fails.push('VT لم يُعالج');
    if (end && fell() && !E.done.has(c.collapse.need)) fails.push('الهبوط لم يُعالج');
    if (end && E.anaph && !E.anaph.treated) fails.push('التأق لم يُعالج');
    if (end && !Object.keys(E.tests).length) fails.push('لم تطلب أي فحص');
    // Without the server the diagnosis is matched by word, which is too blunt to fail anyone on.
    if (end && end.grade.dx === 'wrong' && end.grade.graded) fails.push('التشخيص خاطئ');
    const passed = s.total >= 70 && !fails.length;
    const head = E.outcome === 'arrest' ? 'توقف قلب المريض قبل أن تستقر حالته' : E.outcome === 'stable' ? 'سلّمت المريض مستقراً' : 'سلّمت المريض وهو غير مستقر';
    const good = [], gaps = [];
    s.safety.forEach(k => {
      if (k.state === 'ontime') good.push(`${k.d.label}: عند الدقيقة ${mm(k.at)}`);
      else gaps.push(`<b>${esc(k.d.label)}</b>: ${k.state === 'late' ? 'تأخر إلى الدقيقة ' + mm(k.at) : 'لم يحدث'}. ${esc(k.d.why)}`);
    });
    E.harms.forEach(h => gaps.push(`<b>${esc(h.label)}</b>: ${esc(h.why)}`));
    if (E.anaph) {
      if (E.anaph.treated) good.push(`عالجت التأق بالأدرينالين عند الدقيقة ${mm(E.anaph.treated)}.`);
      else gaps.push('<b>التأق</b>: لم تعطِ adrenaline IM، وهو العلاج الأول للتأق قبل أي شيء آخر.');
    }
    if (E.vtAt !== null) {
      if (E.vtNow) gaps.push('<b>VT غير مستقر</b>: انتهت الحالة والـVT مستمر. الـVT بهبوط ضغط لا يتوقف وحده ويحتاج صدمة فورية.');
      else if (E.done.has('shock')) good.push(`عالجت الـVT بصدمة عند الدقيقة ${mm(E.done.get('shock').at)}.`);
    }
    if (fell() && !E.done.has(E.c.collapse.need)) gaps.push(`<b>الهبوط</b>: ${esc(E.c.collapse.needWhy)}`);
    E.wrongDoses.forEach(w => gaps.push(`<b>جرعة غير صحيحة</b>: ${esc(w.ar)} ${esc(w.dose)}.${w.ref ? ' المرجع: ' + esc(w.ref) : ''}`));
    E.unneeded.forEach(u => gaps.push(`<b>${esc(u.label)}</b>: ${esc(u.why)}`));
    E.caught.filter(x => !E.harmed.has(x.id)).forEach(x => gaps.push(`<b>أوقفتك الممرضة في ${esc(x.ar)}</b>: ${esc(x.why || '')} في الواقع قد لا يوقفك أحد.`));
    E.lateTests.forEach(x => gaps.push(`<b>${esc(x.ar)} بعد المضاد</b>: ${esc(x.why)}`));
    // (chat fix 2026-11-08) Orders the nurse held, waiting for a word that never came.
    [...new Map((E.parked || []).filter(q => q.a && actOf(q.a.id) && !E.done.has(q.a.id) && !E.harmed.has(q.a.id)).map(q => [q.a.id, q])).values()].forEach(q => gaps.push(`<b>طلب معلّق: ${esc(actOf(q.a.id).ar)}</b>: ${q.sug ? 'اقترحت الممرضة ' + esc(shortTip(q)) + ' وانتظرت موافقتك' : 'انتظرت الممرضة الجرعة منك'}، ولم يُعطَ.`));
    Object.values(E.tests).filter(t => t.read === 'wrong' || t.read === 'partial').forEach(t => gaps.push(`<b>قراءة ${esc(testOf(t.id).en)}</b>: ${t.read === 'wrong' ? 'خاطئة' : 'ناقصة'}. القراءة الصحيحة: ${esc(c.results[t.id].key)}`));
    if (end) {
      const place = `اخترت ${DISPO[end.dispo]}`, whyPlace = fell() ? c.collapse.why : c.dispoWhy;
      if (s.place === 'right') good.push(`الوجهة صحيحة: ${DISPO[end.dispo]}.`);
      else gaps.push(`<b>الوجهة</b>: ${place}، والصحيح ${DISPO[dispoRight()]}. ${esc(whyPlace)}`);
      const miss = [['s', 'الوضع'], ['b', 'الخلفية'], ['a', 'التقييم بالأرقام'], ['r', 'التوصية']].filter(([k]) => !end.grade[k]).map(([, v]) => v);
      if (miss.length) gaps.push(`<b>التسليم</b>: ناقصه ${miss.join('، ')}.`);
      if (end.grade.invented) gaps.push('<b>التسليم</b>: ذكرت ما لم يحدث. التسليم الخاطئ يضلل من يستلم المريض.');
    }
    s.reds.filter(f => !s.got.includes(f)).forEach(f => gaps.push(`<b>لم تصل إليك هذه المعلومة</b>: «${quoteOf(f, f.say)}»`));
    s.missedTests.forEach(id => gaps.push(`<b>فحص لازم لم تطلبه</b>: ${esc(testOf(id).ar)}. ${esc(c.results[id].why)}`));
    /* phase8 2026-11-07: the written justifications of out-of-indication tests. A dangerous test stays a gap even when argued well. */
    Object.values(E.tests).filter(t => offInd(t) && t.justOk === false).forEach(t => gaps.push(`<b>فحص خارج الاستطباب</b>: ${esc(testOf(t.id).ar)}. تبريرك لم يكن مقنعاً. ${esc(t.why || '')}`));
    Object.values(E.tests).filter(t => t.ind === 'no' && t.justOk === true).forEach(t => good.push(`برّرت طلب ${testOf(t.id).ar} تبريراً مقبولاً.`));
    Object.values(E.tests).filter(t => t.ind === 'harm' && t.justOk === true).forEach(t => gaps.push(`<b>فحص خارج الاستطباب</b>: ${esc(testOf(t.id).ar)}. تبريرك مقبول، لكن هذا الفحص يعرّض المريض للخطر في وضعه الحالي. ${esc(t.why || '')}`));
    if (E.comm.introduced) good.push('عرّفت بنفسك.');
    if (E.comm.explained) good.push('شرحت ما يجري بكلام مفهوم.');
    else gaps.push(`<b>التواصل</b>: لم تشرح لـ${esc(c.companion.name)} ما يجري، وتدخلت ${E.comp.count} مرة.`);
    if (E.comm.rude) gaps.push('<b>التواصل</b>: خرج منك كلام جارح تحت الضغط.');
    const riskTop = Math.round(Math.max(...E.riskLog.map(p => p[1]))), riskEnd = Math.round(E.risk), anxTop = Math.round(E.anxTop);
    const reasoned = Object.values(E.tests).some(t => t.reason);
    /* phase8 2026-11-07: in order of time, with the time ordered, the justification column and the amber rows. */
    const tests = testRows(reasoned);
    const box = $('er-debrief');
    box.hidden = false;
    box.innerHTML = `<div class="er-report-page">
      <div class="er-score" tabindex="-1"><b class="font-num">${s.total}</b><div><strong>${head}</strong><span>${passed ? 'مجتاز' : fails.length ? 'غير مجتاز: ' + esc(fails.join('، ')) : 'غير مجتاز'} · مدة الحالة ${mm(E.sim)}</span></div></div>
      <p><b>التشخيص الصحيح:</b> ${esc(fell() && c.collapse.dx ? c.collapse.dx : c.dx.ar)}${end ? ` · <b>كتبت:</b> <span data-no-terms>${esc(end.dx)}</span>` : ''}</p>
      <ul class="er-parts">
        <li>سلامة المريض <b class="font-num">${Math.round(s.safe)} / 40</b></li><li>التشخيص <b class="font-num">${s.dxPts} / 15</b></li>
        <li>الفحوصات <b class="font-num">${Math.round(s.testPts)} / 15</b></li><li>القصة وعلامات الخطر <b class="font-num">${Math.round(s.hist)} / 10</b></li>
        <li>التواصل <b class="font-num">${Math.round(s.comm)} / 10</b></li><li>التسليم والوجهة <b class="font-num">${s.hand} / 10</b></li>
      </ul>
      <h4>الخطر خلال الحالة</h4>${chart()}<p class="er-small">أعلى خطر <b class="font-num">${riskTop}%</b> · عند النهاية <b class="font-num">${riskEnd}%</b> · أعلى ضغط من الأهل <b class="font-num">${anxTop}%</b></p>
      ${good.length ? `<h4>أحسنت</h4><ul class="er-good">${good.map(g => `<li>${esc(g)}</li>`).join('')}</ul>` : ''}
      ${gaps.length ? `<h4>ما يجب أن يتغير</h4><ul class="er-gaps">${gaps.map(g => `<li>${g}</li>`).join('')}</ul>` : ''}
      <h4>سجل الفحوصات المطلوبة وتوقيت طلبها في الجلسة</h4>${tests ? `<div class="er-scroll"><table class="er-tests"><thead><tr><th>الفحص</th><th>وقت الطلب</th><th>الاستطباب</th>${reasoned ? '<th>تبريرك عند الطلب</th>' : ''}<th>التبرير عند التسليم</th><th>لماذا</th></tr></thead><tbody>${tests}</tbody></table></div>` : '<p>لم تطلب أي فحص.</p>'}
      ${end && end.grade.note ? `<h4>تسليمك</h4><p>${esc(end.grade.note)}</p>` : ''}
      <h4>الخلاصة</h4><p>${esc(c.brief)}</p>
      <p class="er-small">طلبت مساعدة المشرف ${E.helps} مرة، وبادر هو ${E.hints} مرة. الحالات والدرجات تدريبية ولم يراجعها طبيب بعد.</p>
      <div class="er-pane-f"><button type="button" class="s" id="er-home">الرئيسية</button><button type="button" class="s" id="er-again">أعد الحالة نفسها</button><button type="button" class="p" id="er-next">الحالة التالية</button></div>
    </div>`;
    const keepRole = E.role;
    $('er-again').onclick = () => begin(c.id, { role: keepRole });
    $('er-next').onclick = () => begin(undefined, { role: keepRole });
    $('er-home').onclick = () => { if (typeof navigateTo === 'function') navigateTo('home'); };
    lastReport = E;
    box.querySelector('.er-score').focus({ preventScroll: true });
    box.scrollTop = 0;
    save(s, passed, end);
  }

