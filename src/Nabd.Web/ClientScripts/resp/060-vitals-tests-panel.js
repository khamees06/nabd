  const TILES = { hr: 'rs-v-hr', bp: 'rs-v-bp', spo2: 'rs-v-spo2', temp: 'rs-v-temp', rr: 'rs-v-rr' };
  function showVitals(v) {
    $(TILES.hr).textContent = v ? v.hr : '--';
    $(TILES.bp).textContent = v ? v.sbp + '/' + v.dbp : '--/--';
    $(TILES.spo2).textContent = v ? v.spo2 : '--';
    $(TILES.temp).textContent = v ? v.temp.toFixed(1) : '--.-';
    $(TILES.rr).textContent = v ? v.rr : '--';
    $('rs-v-note').textContent = v ? 'اضغط على أي قراءة لتعرف معدلها الطبيعي.' : 'اضغط «قِس الآن» لعرض القراءات.';
  }
  const vitalsLine = v => `النبض ${v.hr}، الضغط ${v.sbp}/${v.dbp}، الأكسجين ${v.spo2}%، الحرارة ${v.temp.toFixed(1)}، التنفس ${v.rr}`;
  function measure() {
    if (!S.pt || S.done) return;
    showVitals(S.vit);
    if (!S.measured) say('sys', 'قِست العلامات الحيوية: ' + vitalsLine(S.vit) + '.');
    S.measured = true;
  }

  const catOf = id => CL.catalog.find(c => c.id === id);
  function renderTests() {
    const groups = [['img', 'الأشعة'], ['lab', 'المختبر'], ['bed', 'بجانب السرير']];
    $('rs-tests').innerHTML = groups.map(([g, label]) => `<h4>${label}</h4><div class="rs-tlist">${CL.catalog.filter(c => c.group === g).map(c => {
      const on = S.tests.includes(c.id);
      return `<button type="button" class="rs-t${on ? ' is-on' : ''}" data-t="${c.id}" aria-pressed="${on}"><b>${esc(c.ar)}</b><small dir="ltr">${esc(c.en)}</small></button>`;
    }).join('')}</div>`).join('');
    $('rs-tcount').textContent = String(S.tests.length);
  }

