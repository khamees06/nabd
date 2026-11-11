    /* mistakes + notes */
    function nbRoomForText(t) {
      if (nbTrackOf(authState && authState.user) === 'nursing') {
        const nm = [[/بوتاسيوم/, 'nc_iv'], [/إنسولين|الإنسولين/, 'nc_sugar'], [/بالفم|غير واعٍ|نقص السكر|الوعي/, 'nc_hypo'], [/إنتان|تصعيد|NEWS/, 'nc_sepsis'], [/وارفارين|تسييل|نزيف|الشاش|عاصبة|الكزاز/, 'nc_bleed'], [/اليود|جرح|تعقيم|قرحة/, 'nc_wound'], [/بنسلين|مضاد حيوي|أموكسيسيلين/, 'nc_fever'], [/أسبرين|مورفين|تخطيط|ألم صدري/, 'nc_chest'], [/ضغط/, 'nc_bp'], [/حساسية/, 'nc_chest']];
        for (const [re, id] of nm) if (re.test(t)) return id;
      }
      const m = [[/حساسية|بنسلين|دوائ/, 'case_gi_allergy'], [/حمل|دورة|نسائ/, 'case_obgyn_anemia'], [/كرياتينين|كلى|كلوي|صبغة/, 'case_resp_renal'], [/صدر|قلب|ألم/, 'case_cardio_dm'], [/طفل|أطفال|جفاف/, 'case_peds_dehydration'], [/كسر|أشعة|عظام/, 'case_ortho_htn']];
      for (const [re, id] of m) if (re.test(t)) return id;
      return null;
    }
    function nbRenderMistakes(u) {
      const el = document.getElementById('path-mistakes'); if (!el) return;
      const cnt = {};
      (u.history || []).forEach(h => (h.mistakes || []).forEach(x => { cnt[x] = (cnt[x] || 0) + 1; }));
      let items = Object.keys(cnt).map(t => ({ t, n: cnt[t] })).sort((a, b) => b.n - a.n).slice(0, 3);
      if (!items.length) items = (u.weaknesses || []).slice(0, 3).map(t => ({ t, n: 1 }));
      if (!items.length) { el.innerHTML = '<p style="font-size:.8rem;color:#4F6A77;margin:0">لا أخطاء مسجلة بعد. أكمل جلسة لتظهر هنا.</p>'; return; }
      el.innerHTML = items.map((x, k) => `<div class="nb-item"><span>${x.t.replace(/[<>]/g, '')}${x.n > 1 ? ` <b>(${x.n}×)</b>` : ''}</span>${nbRoomForText(x.t) ? `<button type="button" data-fix="${k}">غرفة تعالجها</button>` : ''}</div>`).join('');
      el.querySelectorAll('[data-fix]').forEach(b => b.addEventListener('click', () => nbOpenRoom(nbRoomForText(items[b.dataset.fix].t))));
    }
    function nbRenderNotes(u) {
      const el = document.getElementById('path-notes'); if (!el) return;
      const all = safeStorageGet(NB_COMMENTS_KEY, {});
      const list = all[u.name] || [];
      el.innerHTML = list.length
        ? list.slice(0, 3).map(n => `<div class="nb-item"><span>${n.text.replace(/[<>]/g, '')}<br><small style="color:#4F6A77">${new Date(n.ts).toLocaleDateString('ar-JO')}</small></span></div>`).join('')
        : '<p style="font-size:.8rem;color:#4F6A77;margin:0">لا ملاحظات من الأستاذ الجامعي حالياً.</p>';
      // phase8 2026-11-07: the academic advisor's guidance note comes first when there is one
      try { const adv = nb8AdvisorNoteHtml(u); if (adv) el.innerHTML = adv + (list.length ? el.innerHTML : ''); } catch (e) {}
    }
    function nbLoadComment(stu) {
      const all = safeStorageGet(NB_COMMENTS_KEY, {});
      const last = (all[stu.name] || [])[0];
      const el = document.getElementById('stu-comment-last');
      if (el) el.textContent = last ? 'آخر ملاحظة: ' + last.text : '';
      const st = document.getElementById('stu-comment-status'); if (st) st.textContent = '';
      const inp = document.getElementById('stu-comment-input'); if (inp) inp.value = '';
    }

