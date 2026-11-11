  /* ---------- screen ---------- */
  function say(who, text, extra) {
    const feed = $('rs-feed');
    const d = document.createElement('div');
    d.className = 'rs-msg ' + who;
    const label = who === 'pt' ? (young() ? (fem() ? 'الأم عن طفلتها' : 'الأم عن طفلها') : S.name) : who === 'me' ? 'أنت' : '';
    d.innerHTML = (label ? `<span class="rs-who">${esc(label)}</span>` : '') + (text ? `<p>${esc(text)}</p>` : '') + (extra || '');
    feed.appendChild(d);
    feed.scrollTop = feed.scrollHeight;
    // The conversation so far goes with each question, so the patient keeps the thread.
    if (text && (who === 'pt' || who === 'me')) S.chat.push({ r: who === 'pt' ? 'p' : 's', t: text });
    return d;
  }

  function typing() {
    const d = document.createElement('div');
    d.className = 'rs-msg pt rs-typing';
    d.setAttribute('aria-label', 'المريض يكتب');
    d.innerHTML = '<span></span><span></span><span></span>';
    $('rs-feed').appendChild(d);
    $('rs-feed').scrollTop = $('rs-feed').scrollHeight;
    return d;
  }

  // Count the questions a reply answered: each new one is a step for the model and the score.
  function record(groups) {
    let added = false;
    groups.forEach(g => {
      if (S.asked.has(g)) return;
      S.asked.add(g);
      if (isDerived(g)) S.derived.add(g);
      S.steps.push({ label: qText(heads[g]), g, p: predict(net(S.asked)) });
      added = true;
    });
    if (!added) return;
    renderBars();
    renderAsked();
    bodyMap();
    renderQuestionList($('rs-qsearch').value);
  }

  function renderBars() {
    const box = $('rs-bars');
    const last = S.steps[S.steps.length - 1].p;
    if (S.exam && !S.done) {
      box.innerHTML = '<p class="rs-muted">وضع الامتحان: تظهر احتمالات النموذج بعد أن تسلّم تشخيصك.</p>';
      return;
    }
    const top = last.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 5);
    // Name and number on one line, the bar on its own line below, so nothing crosses the text.
    box.innerHTML = top.map(([p, i]) => `<div class="rs-bar"><span>${esc(T.conditions[M.classes[i]] || M.classes[i])}</span><b class="font-num">${pct(p)}</b><s class="rs-track" aria-hidden="true"><i style="width:${Math.max(2, p * 100).toFixed(1)}%"></i></s></div>`).join('');
  }

  function renderAsked() {
    $('rs-count').textContent = String(S.steps.length - 1);
  }

