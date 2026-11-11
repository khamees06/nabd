    function nbLab(n, v, u, ref, flag) { return { n, v, u, ref, flag }; }
    function nbLabsTable(l) {
      const tag = { H: ['مرتفع', 'h'], L: ['منخفض', 'l'], C: ['حرج', 'c'] };
      return `<div class="nb-labs"><div class="nb-labs-h">${l.title}</div><table><thead><tr><th>الفحص</th><th>النتيجة</th><th>المرجع</th><th>الحالة</th></tr></thead><tbody>${l.rows.map(r => { const t = tag[r.flag]; return `<tr class="${t ? 'f-' + t[1] : ''}"><td>${r.n}</td><td dir="ltr" style="text-align:right"><b>${r.v}</b> <small>${r.u}</small></td><td dir="ltr" style="text-align:right">${r.ref}</td><td>${t ? `<span class="nb-flag ${t[1]}">${t[0]}</span>` : '<span class="nb-flag n">طبيعي</span>'}</td></tr>`; }).join('')}</tbody></table><small class="nb-labs-n">المرجع تقريبي ويختلف بحسب المختبر والعمر والجنس.</small></div>`;
    }
    function nbDoctorCard(c) {
      if (!c.doctor) return '';
      return `<div class="nb-doc"><div class="nb-doc-h"><span class="nb-doc-av">‍</span><div><b>${c.doctor.name}</b><small>${c.doctor.dept}</small></div><span class="nb-doc-tag">تسليم الطبيب</span></div><p>${c.doctor.note}</p><small>أنت لا تشخّص: تنفّذ الأوامر وتراقب وتبلّغ.</small></div>`;
    }

