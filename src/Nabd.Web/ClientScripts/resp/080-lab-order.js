  function labCard(id, open) {
    const c = catOf(id), res = resultFor(id);
    const table = res.rows.length ? `<table class="rs-lab" dir="ltr"><thead><tr><th>Test</th><th>Result</th><th>Reference</th></tr></thead><tbody>${res.rows.map(x =>
      `<tr${x.flag ? ` class="is-${x.flag}"` : ''}><td>${esc(x.param)}</td><td><b>${esc(x.shown)}</b>${x.unit ? ` <small>${esc(x.unit)}</small>` : ''}${x.flag ? ` <i>${x.flag === 'hi' ? 'H' : 'L'}</i>` : ''}</td><td>${esc(x.ref)}</td></tr>`).join('')}</tbody></table>` : '';
    const report = res.report ? `<p class="rs-report" dir="ltr">${esc(res.report)}</p>` : '';
    // In exam mode the meaning waits for the result screen.
    const mean = res.summary && (open || !S.exam) ? `<details class="rs-mean"${open ? ' open' : ''}><summary>ماذا تعني النتيجة؟</summary><p>${esc(res.summary)}</p></details>` : '';
    return `<div class="rs-labcard"><div class="rs-lab-h"><b>${esc(c.ar)}</b><bdi dir="ltr">${esc(c.en)}</bdi></div>${table}${report}${mean}</div>`;
  }

  function orderTest(id) {
    if (!S.pt || S.done || !catOf(id)) return;
    if (S.tests.includes(id)) { say('sys', 'سبق أن طلبت هذا الفحص، ونتيجته في المحادثة أعلاه.'); return; }
    S.tests.push(id);
    say('lab', '', labCard(id));
    renderTests();
    // On a phone the panel sits below the chat: bring the result into view.
    if (window.innerWidth < 1024) document.querySelector('#view-resp .rs-chat').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

