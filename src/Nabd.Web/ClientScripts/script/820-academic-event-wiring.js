
    function nb8Init() {
      let saved = null; try { saved = sessionStorage.getItem(nb8Keys().tab); } catch (e) {}
      nb8SetProfTab(saved || 'courses');
      const tablist = document.querySelector('#uni-doctor-content .nb8-tabs');
      tablist?.addEventListener('click', (e) => { const b = e.target.closest('[data-nb8-tab]'); if (b) nb8SetProfTab(b.dataset.nb8Tab, true); });
      tablist?.addEventListener('keydown', (e) => {
        const tabs = nb8ProfTabs(), cur = tabs.indexOf((e.target.closest('[data-nb8-tab]') || {}).dataset?.nb8Tab);
        if (cur < 0) return;
        const rtl = document.documentElement.dir !== 'ltr';
        let next = null;
        if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = (cur + 1) % tabs.length;
        else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = (cur - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        nb8SetProfTab(tabs[next], true);
      });

      // Assignment form
      document.getElementById('nb8-as-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = authState.user, status = document.getElementById('nb8-as-status');
        const say = (t, bad) => { if (status) { status.textContent = t; status.classList.toggle('is-bad', !!bad); } };
        if (!nb8IsProf(u)) { say('الإسناد متاح لحساب المشرف فقط.', true); return; }
        const caseId = document.getElementById('nb8-as-case')?.value || '';
        const section = document.getElementById('nb8-as-section')?.value || '';
        const due = document.getElementById('nb8-as-due')?.value || '';
        const noteEl = document.getElementById('nb8-as-note');
        const note = (noteEl?.value || '').trim().slice(0, 300);
        if (!caseId || !(nb8CasesCache || []).some(c => c.id === caseId)) { say('اختر حالة أولاً.', true); document.getElementById('nb8-as-case')?.focus(); return; }
        if (!NB_COHORTS[section]) { say('اختر شعبة.', true); return; }
        if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) { say('تاريخ التسليم غير صالح.', true); return; }
        const list = nb8GetAssignments();
        const old = list.find(a => a.caseId === caseId && a.section === section);
        if (old) { old.due = due; old.note = note; old.ts = Date.now(); old.by = u.name; }
        else list.push({ id: 'as_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), caseId, section, due, note, by: u.name, ts: Date.now() });
        nb8SaveAssignments(list);
        if (noteEl) noteEl.value = '';
        say(old ? 'حُدّث الواجب ✓ يراه طلبة الشعبة على هذا الجهاز.' : 'تم الإسناد ✓ يراه طلبة الشعبة على هذا الجهاز في صفحتهم الرئيسية.');
        nb8RenderAssignList(nb8CasesCache);
        nb8RenderCourses();
        showToast(old ? 'حُدّث الواجب المسند للشعبة.' : `أُسندت الحالة لشعبة ${section}.`);
      });

      // One delegated handler for the buttons the renders create.
      document.addEventListener('click', (e) => {
        const t = e.target.closest('[data-nb8-open-case],[data-nb8-locked],[data-nb8-go],[data-nb8-copy],[data-nb8-assign-to],[data-nb8-unassign],[data-nb8-open-stu],[data-nb8-adv-save]');
        if (!t) return;
        if (t.hasAttribute('data-nb8-open-case')) { nb8OpenAssignedCase(t.getAttribute('data-nb8-open-case')); return; }
        if (t.hasAttribute('data-nb8-locked')) { showToast('هذه النتيجة غير منشورة بعد ولا يمكن للطالب فتحها قبل اعتمادها من الأستاذ الجامعي.'); return; }
        if (t.hasAttribute('data-nb8-go')) { if (navigateTo('university')) nb8SetProfTab(t.getAttribute('data-nb8-go'), true); return; }
        if (t.hasAttribute('data-nb8-copy')) {
          const code = t.getAttribute('data-nb8-copy');
          try { navigator.clipboard.writeText(code).then(() => showToast('تم نسخ رمز الشعبة: ' + code), () => showToast(code)); } catch (err) { showToast(code); }
          return;
        }
        if (t.hasAttribute('data-nb8-assign-to')) {
          nb8SetProfTab('assign', true);
          const s = document.getElementById('nb8-as-section'); if (s) s.value = t.getAttribute('data-nb8-assign-to');
          document.getElementById('nb8-as-case')?.focus();
          return;
        }
        if (t.hasAttribute('data-nb8-unassign')) {
          if (!nb8IsProf(authState.user)) return;
          if (!window.confirm('إلغاء إسناد هذه الحالة؟ لن تظهر بعد ذلك لطلبة الشعبة.')) return;
          const id = t.getAttribute('data-nb8-unassign');
          nb8SaveAssignments(nb8GetAssignments().filter(a => a.id !== id));
          nb8RenderAssignList(nb8CasesCache); nb8RenderCourses();
          showToast('أُلغي إسناد الحالة.');
          return;
        }
        if (t.hasAttribute('data-nb8-open-stu')) { openStudentAttemptDetailModal(t.getAttribute('data-nb8-open-stu')); return; }
        if (t.hasAttribute('data-nb8-adv-save')) {
          if (!nb8IsProf(authState.user)) return;
          const card = t.closest('[data-nb8-adv]'), stu = getProfCohortList().find(s => s.id === t.getAttribute('data-nb8-adv-save'));
          if (!card || !stu) return;
          const all = nb8GetAdvisor();
          all[stu.name] = { status: card.querySelector('[data-nb8-adv-status]')?.value || '', note: (card.querySelector('[data-nb8-adv-note]')?.value || '').trim().slice(0, 500), ts: Date.now(), by: authState.user.name };
          safeStorageSet(nb8Keys().advisor, all);
          nb8AdvStatuses().forEach(([k]) => { if (k) card.classList.toggle('is-' + k, all[stu.name].status === k); });
          const msg = card.querySelector('[data-nb8-adv-msg]');
          if (msg) msg.textContent = all[stu.name].note ? 'حُفظ ✓ تظهر الملاحظة للطالب في ملفه.' : 'حُفظت حالة المتابعة ✓';
          nb8RenderAdvisorSum();
        }
      });

      // Students join a section later with its code.
      document.addEventListener('submit', (e) => {
        const f = e.target.closest && e.target.closest('[data-nb8-join]');
        if (!f) return;
        e.preventDefault();
        const u = authState.user, msg = f.querySelector('[data-nb8-join-msg]');
        if (!u || nb8IsProf(u)) return;
        const coh = nbCohortFor(f.querySelector('[data-nb8-join-input]')?.value);
        if (!coh) { if (msg) msg.textContent = 'الرمز غير معروف. تأكد منه مع المشرف.'; return; }
        u.cohort = coh.code; u.cohortName = coh.name;
        saveAccountToStorage(u);
        nb8RenderAcademic(u);
        showToast(`انضممت إلى ${coh.name} (${coh.code}).`);
      });

      // Publishing a grade changes the KPIs and the progress view.
      document.getElementById('stu-modal-toggle-pub-btn')?.addEventListener('click', () => setTimeout(() => { if (nb8IsProf(authState.user)) nb8RenderProf(authState.user); }, 0));
    }

