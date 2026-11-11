    /* =========================================================================
       7. PROFILE, PROFESSOR COHORT DASHBOARD & INTERACTIVE CLINICAL COACH
       ========================================================================= */
    function renderProfileView() {
      if (!authState.isAuthenticated || !authState.user) return;
      const u = authState.user;
      const roleAr = u.roleNameAr || getRoleArabicName(u.role);
      const specAr = u.specialty || 'التمريض';

      document.getElementById('profile-avatar-box').textContent = u.initials || u.name.slice(0, 2);
      document.getElementById('profile-name-heading').textContent = u.name;
      document.getElementById('profile-role-pill').textContent = `${roleAr} · ${specAr}`;
      const demoPill = document.getElementById('profile-demo-pill');
      if (demoPill) {
        demoPill.textContent = 'حساب استعراض تجريبي';
        demoPill.classList.toggle('hidden', !u.isDemo);
      }
      document.getElementById('profile-email-uni').textContent = `${u.email} · ${u.uni}`;

      document.getElementById('profile-stat-sessions').textContent = String(u.stats.completed);
      document.getElementById('profile-stat-spec').textContent = u.stats.avgSpec;
      document.getElementById('profile-stat-er').textContent = u.stats.avgEr;
      // nurse mode 2026-11-07: doctor and nurse ER averages are kept apart; say which one is shown, or both.
      const erLbl = document.getElementById('profile-stat-er').nextElementSibling;
      if (erLbl) {
        const dAvg = u.stats.avgErDoctor, nAvg = u.stats.avgErNurse;
        erLbl.textContent = dAvg && nAvg ? `معدل الطوارئ · طبيب ${dAvg} · تمريض ${nAvg}` : nAvg ? 'معدل الطوارئ (دور التمريض)' : 'معدل الطوارئ';
      }

      const fillList = (elId, arr) => {
        const ul = document.getElementById(elId);
        if (!ul) return;
        ul.innerHTML = '';
        (arr || []).forEach(item => {
          const li = document.createElement('li');
          li.textContent = item;
          ul.appendChild(li);
        });
      };

      fillList('profile-strengths-list', u.strengths);
      fillList('profile-weaknesses-list', u.weaknesses);
      fillList('profile-recommendations-list', u.recommendations);

      try { renderProfileDash(u); } catch (e) { console.error(e); }
      const histTbody = document.getElementById('profile-history-tbody');
      if (histTbody) {
        if (!u.history || u.history.length === 0) {
          histTbody.innerHTML = `
            <tr>
              <td colspan="5" class="px-5 py-8 text-center text-slate-500">
                لا توجد جلسات مكتملة في سجل هذا الحساب حتى الآن. ابدأ جلسة تدريبية وسلّم SBAR لتسجيل تقدمك.
              </td>
            </tr>
          `;
        } else {
          histTbody.innerHTML = '';
          u.history.forEach(h => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td class="px-5 py-3.5 font-bold text-slate-900">${h.caseTitle}</td>
              <td class="px-5 py-3.5 text-slate-600">${h.mode}</td>
              <td class="px-5 py-3.5 font-num text-slate-500">${nbDateOf(h)}</td>
              <td class="px-5 py-3.5 font-num text-slate-700">${h.questions != null ? h.questions + ' أسئلة · ' : ''}${h.workupCount} فحوصات</td>
              <td class="px-5 py-3.5 font-num font-bold text-teal-700">${h.score}</td>
            `;
            histTbody.appendChild(tr);
          });
        }
      }

      // Populate Printable Training Achievement Certificate
      const certName = document.getElementById('cert-trainee-name');
      if (certName) certName.textContent = u.name;
      const certMeta = document.getElementById('cert-trainee-meta');
      if (certMeta) certMeta.textContent = `${roleAr} · التخصص: ${specAr} — ${u.uni}`;
      const certSerial = document.getElementById('cert-serial-num');
      if (certSerial) certSerial.textContent = `NABD-2026-${(u.id || 'USR').toUpperCase().slice(0, 6)}-${100 + (u.stats.completed || 0)}`;
      const certSess = document.getElementById('cert-stat-sessions');
      if (certSess) certSess.textContent = `${u.stats.completed} جلسات`;
      const certSpec = document.getElementById('cert-stat-spec');
      if (certSpec) certSpec.textContent = u.stats.avgSpec;
      const certEr = document.getElementById('cert-stat-er');
      if (certEr) certEr.textContent = u.stats.avgEr;
      const certStatus = document.getElementById('cert-stat-status');
      if (certStatus) {
        const erRuns = (u.history || []).filter(h => /^er_/.test(h.caseId || ''));
        certStatus.textContent = erRuns.length ? `${erRuns.filter(h => h.passed).length} من ${erRuns.length}` : 'لا توجد حالات بعد';
      }
      const certDate = document.getElementById('cert-issue-date');
      if (certDate) certDate.textContent = 'تاريخ الطباعة: ' + new Date().toISOString().slice(0, 10);
      const certEmail = document.getElementById('cert-email-footer');
      if (certEmail) certEmail.textContent = `${u.email} · ${u.uni}`;
      const certTbody = document.getElementById('cert-cases-tbody');
      if (certTbody) {
        if (!u.history || u.history.length === 0) {
          certTbody.innerHTML = `
            <tr>
              <td colspan="5" class="px-4 py-4 text-center text-slate-500">
                لم تُسجَّل جلسات مكتملة بعد. أتمم حالة لتظهر في هذا السجل.
              </td>
            </tr>
          `;
        } else {
          certTbody.innerHTML = u.history.slice(0, 6).map(h => `
            <tr>
              <td class="px-4 py-2 font-bold text-slate-900">${h.caseTitle}</td>
              <td class="px-4 py-2 text-slate-700">${h.mode}</td>
              <td class="px-4 py-2 font-num text-slate-600">${nbDateOf(h)}</td>
              <td class="px-4 py-2 font-num text-slate-700">${h.questions != null ? h.questions + ' أسئلة · ' : ''}${h.workupCount} فحوصات</td>
              <td class="px-4 py-2 font-num font-bold text-teal-800">${h.score}</td>
            </tr>
          `).join('');
        }
      }
    }


