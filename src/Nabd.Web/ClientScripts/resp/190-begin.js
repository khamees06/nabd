  function begin(forced) {
    startPatient(forced);
    const pt = S.pt;
    $('rs-feed').innerHTML = '';
    ['rs-input', 'rs-send', 'rs-dx-btn'].forEach(id => { $(id).disabled = false; });
    $('rs-submit').hidden = true;
    $('rs-qsearch').value = '';
    const f = fem();
    const who = pt.age < 1 ? (f ? 'رضيعة' : 'رضيع') : pt.age < 12 ? (f ? 'طفلة' : 'طفل') : f ? 'امرأة' : 'رجل';
    $('rs-pt').innerHTML = `<div class="rs-av" aria-hidden="true">${esc(S.name.charAt(0))}</div><div><b>${esc(S.name)}</b><small>${who} · ${ageAr(pt.age)}</small></div>`;
    say('sys', `${S.name}، ${who} ${f ? 'عمرها' : 'عمره'} ${ageAr(pt.age)}، ${f ? 'وصلت' : 'وصل'} إلى الطوارئ.${young() ? (f ? ' الأم تجيب عن طفلتها.' : ' الأم تجيب عن طفلها.') : ''} ${young() ? 'اسأل' : f ? 'اسألها' : 'اسأله'} عن الأعراض، ثم سلّم تشخيصك.`);
    // The chief complaint is volunteered, not an answer, so it does not open with "نعم".
    say('pt', answer(M.encoder.ev_group[evIndex[pt.init]]).replace(/^(نعم|آه|اه|أيوه)،\s*/, ''));
    renderBars();
    renderAsked();
    bodyMap();
    renderQuestionList('');
    showVitals(null);
    // Close a normal-range tip left open for the previous patient (a click toggles it in motion.js).
    document.querySelector('#rs-mon-card .nb-mon-tile.is-picked')?.click();
    renderTests();
    $('rs-input').focus();
  }

