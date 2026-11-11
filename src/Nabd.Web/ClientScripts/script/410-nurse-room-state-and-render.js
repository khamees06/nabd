    /* ---------------------------- NURSE ROOM ENGINE (chat simulation) ---------------------------- */
    let ns = null;
    const NR_TABS = [['ask', 'اسأل المريض'], ['measure', 'قياسات'], ['proc', 'إجراءات'], ['med', 'أدوية ومحاليل']];
    const NR_VN = { hr: 'النبض', bp: 'الضغط', rr: 'التنفس', spo2: 'الأكسجة', temp: 'الحرارة', avpu: 'الوعي', bg: 'السكر' };
    const NR_AV = { A: 'واعٍ', C: 'مرتبك', V: 'يستجيب للصوت', P: 'يستجيب للألم', U: 'لا يستجيب' };
    function nbShuffle(n) { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function nrEsc(s) { return String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
    function nrActs(c) { const own = c.acts || []; return [...own, ...NB_COMMON_ACTS.filter(a => !own.some(x => x.id === a.id))]; }
    function nrTime() { const m = ns.clock % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
    function nrHas(id) { return ns.done.has(id) || ns.acts.some(a => a.alt === id && ns.done.has(a.id)); }
    function nrAct(id) { return ns.acts.find(a => a.id === id); }

    function nrSay(kind, text, o) {
      const feed = document.getElementById('nr-feed'); if (!feed || !ns) return null;
      const d = document.createElement('div');
      d.className = 'nb-b ' + (kind === 'coach' ? 'coach' : kind === 'alarm' ? 'alarm' : kind);
      const lab = { nurse: 'أنت', patient: ns.c.patient.name, doctor: ns.c.doctor.name, action: (o && o.title) ? 'إجراء' : 'إجراء', coach: 'ملاحظة الأستاذ الجامعي', alarm: 'تنبيه' }[kind] || '';
      d.innerHTML = (lab ? '<small></small>' : '') + '<p></p>';
      if (lab) d.querySelector('small').textContent = lab + ' · ' + nrTime();
      d.querySelector('p').textContent = text;
      feed.appendChild(d); feed.scrollTop = feed.scrollHeight;
      return d;
    }
    function nrSayHtml(html, cls) {
      const feed = document.getElementById('nr-feed'); if (!feed) return;
      const d = document.createElement('div'); d.className = 'nb-b ' + (cls || 'action') + ' nr-rich'; d.innerHTML = html;
      feed.appendChild(d); feed.scrollTop = feed.scrollHeight;
    }
    function nrBad(text) {
      if (!text) return;
      const map = [[/^(الأستاذ الجامعي|المشرف):\s*/, 'coach'], [/^(المريضة|المريض):\s*/, 'patient'], [/^(الطبيبة|الطبيب):\s*/, 'doctor'], [/^الشاشة:\s*/, 'alarm']];
      for (const [re, k] of map) { if (re.test(text)) { if (k === 'coach' && ns.osce) return; nrSay(k, text.replace(re, '')); return; } }
      nrSay('alarm', text);
    }
    function nrCoach(text) { if (text && !ns.osce) nrSay('coach', text); }
    function nrWarn(k, v) {
      if (k === 'hr') return (v > 110 || v < 50) ? 'warn' : '';
      if (k === 'bp') { const s = parseInt(String(v).split('/')[0], 10); return (s < 100 || s >= 160) ? 'warn' : ''; }
      if (k === 'rr') return (v >= 22 || v <= 11) ? 'warn' : '';
      if (k === 'spo2') return v <= 94 ? 'warn' : '';
      if (k === 'temp') return (v >= 38 || v <= 36) ? 'warn' : '';
      if (k === 'avpu') return v !== 'A' ? 'warn' : '';
      if (k === 'bg') return (v < 70 || v > 250) ? 'warn' : '';
      return '';
    }
    function nrMonitor() {
      const box = document.getElementById('nr-mon'); if (!box || !ns) return;
      const cell = (k, label, unit, col, val) => { const on = ns.shown.has(k); const w = on && nrWarn(k, ns.v[k]) ? 'warn' : ''; return `<div class="nr2-cell ${w}"><div class="nr2-l"><span>${label}</span><span>${unit}</span></div><div class="nr2-v ${col}">${on ? val : '--'}</div></div>`; };
      const v = ns.v;
      box.innerHTML = cell('hr', 'النبض HR', 'bpm', 'g', v.hr) + cell('bp', 'الضغط BP', 'mmHg', 's', v.bp) + cell('spo2', 'الأكسجين SpO2', '%', 't', v.spo2 + '%') + cell('temp', 'الحرارة Temp', '<bdi dir="ltr">°C</bdi>', 'a', v.temp) + cell('rr', 'التنفس RR', '/د', 'g', v.rr) + cell('avpu', 'الوعي AVPU', '', 's', NR_AV[v.avpu] || v.avpu)
        + (ns.c.vitals.bg !== undefined ? cell('bg', 'السكر BG', 'mg/dL', 'a', v.bg) : '')
        + (ns.news2 != null ? `<div class="nr2-cell ${ns.news2 >= 5 ? 'warn' : ''}"><div class="nr2-l"><span>NEWS2</span><span></span></div><div class="nr2-v t">${ns.news2}</div></div>` : '');
      const ck = document.getElementById('nr-clock'); if (ck) ck.textContent = nrTime();
      const nt = document.getElementById('nr-vnote'); if (nt) nt.textContent = ns.shown.size ? 'آخر قياس: ' + nrTime() + ' · الأحمر خارج المعدل.' : 'اضغط «قِس الآن» لعرض القراءات.';
    }
    function nrSideOrders() {
      const ul = document.getElementById('nr-ordl'); if (!ul || !ns) return;
      const items = [];
      ns.c.beats.forEach((b, i) => { if (i > ns.bi || !b.doc) return; items.push(`<li class="${ns.bdone.has(i) ? 'done' : i === ns.bi ? 'now' : ''}"><i>${ns.bdone.has(i) ? '✓' : '•'}</i><span>${nrEsc(b.doc.length > 78 ? b.doc.slice(0, 76) + '…' : b.doc)}</span></li>`); });
      ul.innerHTML = items.length ? items.join('') : '<li class="mute">لم تصل أوامر بعد.</li>';
    }

