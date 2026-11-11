    function initNabdApp() {
      if (window.__nabdInitialized) return;
      window.__nabdInitialized = true;

      loadPersistedCustomCases();

      const savedUserId = safeStorageGet(STORAGE_KEYS.ACTIVE_USER_ID, null);
      const storedUserObj = savedUserId ? getAccountFromStorageOrDefault(savedUserId) : null;
      const savedUserObj = storedUserObj && !storedUserObj.isDemo ? storedUserObj : null;
      if (storedUserObj?.isDemo) safeStorageRemove(STORAGE_KEYS.ACTIVE_USER_ID);

      renderDepartmentFilterBar();
      renderClinicalCaseCards();
      renderProfessorCohortTables();

      if (savedUserObj) {
        authState.isAuthenticated = true;
        authState.user = savedUserObj;
        syncAuthShellUI();
        const activeSimMeta = safeStorageGet(STORAGE_KEYS.ACTIVE_SIM, null);
        if (activeSimMeta && activeSimMeta.caseId && CASES_DB[activeSimMeta.caseId]) {
          startSimulationSession(activeSimMeta.caseId, Boolean(activeSimMeta.isEmergencyMode), false, true);
        }
        navigateTo('home');
      } else {
        authState.isAuthenticated = false;
        authState.user = null;
        syncAuthShellUI();
        navigateTo('index');
      }

      // Global Escape key handler
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeSidebar();
          closeAccountDropdown();
          closeAuthModal();
          closeHandoverModal();
          closeMedicalLightbox();
          closeStudentAttemptDetailModal();
          document.getElementById('sim-tools-backdrop')?.classList.add('hidden');
        }
      });

      // Close account dropdown when clicking outside
      document.addEventListener('click', (e) => {
        const menu = document.getElementById('account-dropdown-menu');
        const btn = document.getElementById('user-menu-btn');
        if (menu && btn && !menu.classList.contains('hidden')) {
          if (!menu.contains(e.target) && !btn.contains(e.target)) {
            closeAccountDropdown();
          }
        }
      });

      // Persist Scratchpad on input
      const scratchpadEl = document.getElementById('nurse-scratchpad');
      if (scratchpadEl) {
        scratchpadEl.addEventListener('input', () => {
          saveScratchpadText(scratchpadEl.value);
        });
      }

      // Public Header & Index CTAs (Login & Register Buttons)
      document.getElementById('public-brand-btn')?.addEventListener('click', () => navigateTo('index'));
      document.getElementById('public-login-btn')?.addEventListener('click', () => openAuthModal('login'));
      document.getElementById('public-register-btn')?.addEventListener('click', () => openAuthModal('register'));
      document.getElementById('public-open-sidebar-btn')?.addEventListener('click', openSidebar);

      document.getElementById('index-login-cta')?.addEventListener('click', () => openAuthModal('login'));
      document.getElementById('index-register-cta')?.addEventListener('click', () => openAuthModal('register'));
      document.getElementById('index-uni-demo-btn')?.addEventListener('click', () => openAuthModal('login'));
      document.getElementById('index-demo-cta')?.addEventListener('click', () => { nbDemoLogin('med_student'); setTimeout(() => nbOpenER(), 400); });
      document.querySelectorAll('[data-demo-login]').forEach(btn => {
        btn.addEventListener('click', () => nbDemoLogin(btn.dataset.demoLogin));
      });

      // App Header Navigation (Signed-In)
      document.getElementById('app-brand-btn')?.addEventListener('click', () => navigateTo('home'));
      document.getElementById('app-nav-home')?.addEventListener('click', () => navigateTo('home'));
      document.getElementById('app-nav-cases')?.addEventListener('click', () => navigateTo('home', { scrollToCases: true }));
      document.getElementById('app-nav-uni')?.addEventListener('click', () => navigateTo('university'));
      document.getElementById('app-nav-coach')?.addEventListener('click', () => navigateTo('coach'));
      document.getElementById('app-open-sidebar-btn')?.addEventListener('click', openSidebar);
      document.getElementById('user-menu-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAccountDropdown();
      });

      // Emergency Room Launchers
      const launchRandomER = () => {
        if (!authState.isAuthenticated || !authState.user) {
          openAuthModal('login', 'يرجى تسجيل الدخول أولاً لدخول غرفة الطوارئ.');
          return;
        }
        window.nbOpenER();
      };
      document.getElementById('app-nav-er')?.addEventListener('click', launchRandomER);
      document.getElementById('side-er-btn')?.addEventListener('click', launchRandomER);
      document.getElementById('launch-er-random-btn')?.addEventListener('click', launchRandomER);
      document.getElementById('foot-er-btn')?.addEventListener('click', launchRandomER);
      document.getElementById('empty-debrief-go-er')?.addEventListener('click', launchRandomER);

      // Account Dropdown Menu Items
      document.querySelectorAll('.dropdown-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetView = btn.getAttribute('data-drop-view');
          const ptab = btn.getAttribute('data-profile-tab');
          closeAccountDropdown();
          navigateTo(targetView);
          if (targetView === 'profile' && ptab) {
            switchProfileSubTab(ptab);
          }
        });
      });
      document.getElementById('dropdown-switch-demo-btn')?.addEventListener('click', () => {
        closeAccountDropdown();
        openAuthModal('login');
      });
      document.getElementById('dropdown-logout-btn')?.addEventListener('click', logoutUser);

      // Sidebar Controls & Links
      document.getElementById('close-sidebar-btn')?.addEventListener('click', closeSidebar);
      document.getElementById('sidebar-backdrop')?.addEventListener('click', closeSidebar);
      document.querySelectorAll('.guest-side-link').forEach(link => {
        link.addEventListener('click', () => closeSidebar());
      });
      document.getElementById('side-guest-login-btn')?.addEventListener('click', () => openAuthModal('login'));
      document.getElementById('side-guest-register-btn')?.addEventListener('click', () => openAuthModal('register'));

      document.querySelectorAll('.side-app-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-side-app');
          navigateTo(target);
        });
      });
      document.getElementById('side-uni-portal-btn')?.addEventListener('click', () => navigateTo('university'));
      document.getElementById('side-switch-demo-btn')?.addEventListener('click', () => openAuthModal('login'));
      document.getElementById('side-logout-btn')?.addEventListener('click', logoutUser);

      // Home Quick Buttons & Professor/Student Home Sections
      document.getElementById('home-quick-profile-btn')?.addEventListener('click', () => navigateTo('profile'));
      document.getElementById('home-quick-er-btn')?.addEventListener('click', launchRandomER); // mobile audit 2026-11-07
      document.getElementById('home-quick-uni-btn')?.addEventListener('click', () => navigateTo('university'));
      document.getElementById('home-student-open-uni-btn')?.addEventListener('click', () => navigateTo('university'));
      document.getElementById('home-prof-open-full-uni-btn')?.addEventListener('click', () => navigateTo('university'));

      document.getElementById('home-prof-tab-reports-btn')?.addEventListener('click', () => {
        document.getElementById('home-prof-reports-pane')?.classList.remove('hidden');
        document.getElementById('home-prof-create-pane')?.classList.add('hidden');
        document.getElementById('home-prof-tab-reports-btn').className = 'px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold transition-colors focus-ring';
        document.getElementById('home-prof-tab-create-btn').className = 'px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors focus-ring';
      });
      document.getElementById('home-prof-tab-create-btn')?.addEventListener('click', () => {
        document.getElementById('home-prof-reports-pane')?.classList.add('hidden');
        document.getElementById('home-prof-create-pane')?.classList.remove('hidden');
        document.getElementById('home-prof-tab-create-btn').className = 'px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold transition-colors focus-ring';
        document.getElementById('home-prof-tab-reports-btn').className = 'px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors focus-ring';
      });
      document.getElementById('home-doc-save-case-btn')?.addEventListener('click', () => {
        createAndSaveSupervisorCase('home-doc-case-title', 'home-doc-case-dept', 'home-doc-patient-name', 'home-doc-patient-allergy', 'home-doc-patient-complaint');
      });

      document.getElementById('reset-dept-filter-btn')?.addEventListener('click', () => {
        selectedDeptFilter = 'all';
        renderDepartmentFilterBar();
        renderClinicalCaseCards();
      });
      document.getElementById('open-coach-view-btn')?.addEventListener('click', () => navigateTo('coach'));

      // Simulation Workspace Controls
      document.getElementById('toggle-sim-tools-btn')?.addEventListener('click', () => {
        const panel = document.getElementById('sim-tools-panel');
        const backdrop = document.getElementById('sim-tools-backdrop');
        if (!panel) return;
        if (window.innerWidth < 1024) {
          const isHidden = panel.classList.contains('hidden');
          panel.classList.toggle('hidden', !isHidden);
          backdrop?.classList.toggle('hidden', !isHidden);
        } else {
          simToolsOpenOnDesktop = !simToolsOpenOnDesktop;
          panel.classList.toggle('lg:hidden', !simToolsOpenOnDesktop);
          panel.classList.toggle('lg:flex', simToolsOpenOnDesktop);
          document.getElementById('toggle-sim-tools-btn')?.setAttribute('aria-expanded', String(simToolsOpenOnDesktop));
        }
      });
      document.getElementById('close-sim-tools-mobile')?.addEventListener('click', () => {
        document.getElementById('sim-tools-panel')?.classList.add('hidden');
        document.getElementById('sim-tools-backdrop')?.classList.add('hidden');
      });
      document.getElementById('sim-tools-backdrop')?.addEventListener('click', () => {
        document.getElementById('sim-tools-panel')?.classList.add('hidden');
        document.getElementById('sim-tools-backdrop')?.classList.add('hidden');
      });

      document.querySelectorAll('.sim-side-tab').forEach(btn => {
        btn.addEventListener('click', () => switchSimSideTab(btn.getAttribute('data-stab')));
      });

      document.querySelectorAll('.wcat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedWorkupCategory = btn.getAttribute('data-wcat');
          document.querySelectorAll('.wcat-btn').forEach(b => {
            const active = b.getAttribute('data-wcat') === selectedWorkupCategory;
            b.className = active
              ? 'wcat-btn px-2 py-1 rounded-lg text-xs font-semibold bg-teal-700 text-white'
              : 'wcat-btn px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200';
          });
          renderWorkupCatalog();
        });
      });

      // Vitals Measurement
      document.getElementById('sim-measure-vitals-btn')?.addEventListener('click', () => {
        const v = simState.caseData.vitalsInitial;
        const ts = getSessionTimestamp();
        document.getElementById('sim-v-hr').textContent = String(v.hr);
        document.getElementById('sim-v-bp').textContent = v.bp;
        document.getElementById('sim-v-spo2').textContent = `${v.spo2}%`;
        document.getElementById('sim-v-temp').textContent = String(v.temp);
        document.getElementById('sim-vitals-note').textContent = `قِيست العلامات عند ${ts}.`;
        if (!simState.vitalsMeasured) {
          simState.vitalsMeasured = true;
          simState.vitalsTimestamp = ts;
          updateSimEvidenceCounter();
          updateBeginnerStepsBar();
          appendSimBubble('system', '', `تم قياس العلامات الحيوية (${ts}): النبض ${v.hr} | الضغط ${v.bp} | الأكسجين ${v.spo2}% | الحرارة ${v.temp}°C`);
        }
      });

      // Chat Send
      document.getElementById('sim-send-btn')?.addEventListener('click', () => {
        const inp = document.getElementById('sim-chat-input');
        const txt = inp.value.trim();
        if (!txt) return;
        inp.value = '';
        processChatTurn(txt, matchTypedQuestion(txt));
      });
      document.getElementById('sim-chat-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.getElementById('sim-send-btn')?.click();
        }
      });

      document.getElementById('sim-voice-btn')?.addEventListener('click', () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
          showToast('الإدخال الصوتي يتطلب متصفحاً يدعم Web Speech API. يمكنك استخدام الكتابة المباشرة.');
          return;
        }
        const rec = new SR();
        rec.lang = 'ar-JO';
        rec.onresult = (e) => {
          document.getElementById('sim-chat-input').value = e.results[0][0].transcript;
          document.getElementById('sim-send-btn')?.click();
        };
        rec.start();
        showToast('تحدث الآن...');
      });

      // Lightbox Controls
      document.getElementById('zoom-in-btn')?.addEventListener('click', () => applyLightboxZoom(activeLightboxZoom + 40));
      document.getElementById('zoom-out-btn')?.addEventListener('click', () => applyLightboxZoom(activeLightboxZoom - 40));
      document.getElementById('zoom-200-btn')?.addEventListener('click', () => applyLightboxZoom(200));
      document.getElementById('zoom-300-btn')?.addEventListener('click', () => applyLightboxZoom(300));
      document.getElementById('zoom-reset-btn')?.addEventListener('click', () => applyLightboxZoom(100));
      document.getElementById('close-lightbox-btn')?.addEventListener('click', closeMedicalLightbox);
      document.getElementById('lightbox-save-note-btn')?.addEventListener('click', () => {
        const val = document.getElementById('lightbox-quick-note')?.value.trim();
        if (val) {
          if (activeLightboxWorkupRef) activeLightboxWorkupRef.studentAnalysis = val;
          const pad = document.getElementById('nurse-scratchpad');
          if (pad) {
            pad.value = (pad.value ? pad.value + '\n' : '') + `- قراءة الصورة التشخيصية: ${val}`;
            saveScratchpadText(pad.value);
          }
          showToast('تم حفظ استنتاجك من الصورة في المفكرة السريرية.');
        }
        closeMedicalLightbox();
      });

      // SBAR Handover Modal Controls
      document.getElementById('open-handover-modal-btn')?.addEventListener('click', openHandoverModal);
      document.getElementById('close-handover-modal-btn')?.addEventListener('click', closeHandoverModal);
      document.getElementById('cancel-handover-btn')?.addEventListener('click', closeHandoverModal);
      document.getElementById('copy-scratchpad-to-sbar-btn')?.addEventListener('click', () => {
        const padVal = document.getElementById('nurse-scratchpad')?.value.trim();
        if (!padVal) {
          showToast('مفكرتك السريرية فارغة حالياً — دوّن ملاحظاتك من الحوار والفحوصات أولاً.');
          return;
        }
        document.getElementById('handover-summary-input').value = padVal;
        showToast('تم استيراد ملاحظات مفكرتك الشخصية إلى حقل (S & B).');
      });
      document.getElementById('confirm-handover-submit-btn')?.addEventListener('click', finalizeSessionAndBuildReport);

      // Debrief Navigation
      document.getElementById('empty-debrief-go-home')?.addEventListener('click', () => navigateTo('home'));
      document.getElementById('rep-back-home-btn')?.addEventListener('click', () => navigateTo('home'));
      document.getElementById('rep-go-profile-btn')?.addEventListener('click', () => {
        navigateTo('profile');
        switchProfileSubTab('history');
      });

      // Interactive Coach Controls & Collapsible Left Weakness Sidebar
      document.getElementById('coach-back-home-btn')?.addEventListener('click', () => navigateTo('home'));
      document.getElementById('toggle-coach-weakness-btn')?.addEventListener('click', () => toggleCoachWeaknessSidebar());
      document.getElementById('close-coach-weakness-btn')?.addEventListener('click', () => toggleCoachWeaknessSidebar(false));
      document.getElementById('coach-weakness-backdrop')?.addEventListener('click', () => toggleCoachWeaknessSidebar(false));
      document.getElementById('coach-header-next-btn')?.addEventListener('click', () => {
        const nextIdx = (coachRuntime.activeIdx + 1) % COACH_MODULES_DEFAULT.length;
        startCoachDrillAtIndex(nextIdx, true);
        renderInteractiveCoachView();
      });
      document.getElementById('coach-send-btn')?.addEventListener('click', handleCoachStudentSubmission);
      document.getElementById('coach-chat-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCoachStudentSubmission();
        }
      });
      document.getElementById('coach-give-hint-btn')?.addEventListener('click', () => {
        const mod = COACH_MODULES_DEFAULT[coachRuntime.activeIdx] || COACH_MODULES_DEFAULT[0];
        appendCoachMessage('coach', 'المدرب السريري · تلميح سريري ', `
          <div class="text-xs text-teal-900"><strong>تلميح:</strong> اذكر في إجابتك الكلمات المفتاحية التالية: (${mod.keywords.slice(0, 6).join('، ')}) — أو اضغط «إجابة نموذجية».</div>
        `);
      });
      document.getElementById('coach-next-drill-btn')?.addEventListener('click', () => {
        const nextIdx = (coachRuntime.activeIdx + 1) % COACH_MODULES_DEFAULT.length;
        startCoachDrillAtIndex(nextIdx, true);
        renderInteractiveCoachView();
      });
      document.getElementById('coach-reset-drills-btn')?.addEventListener('click', () => {
        coachRuntime.masteredIds = new Set();
        saveCoachMasteredSet(coachRuntime.masteredIds);
        coachRuntime.activeIdx = 0;
        renderInteractiveCoachView();
        startCoachDrillAtIndex(0, true);
        showToast('تمت إعادة ضبط تمارين المدرب السريري.');
      });

      // Profile Sub-tabs, Certificate Print & Settings
      document.querySelectorAll('.profile-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchProfileSubTab(btn.getAttribute('data-ptab')));
      });
      document.getElementById('profile-quick-open-cert-btn')?.addEventListener('click', () => {
        switchProfileSubTab('certificate');
      });
      document.getElementById('side-cert-btn')?.addEventListener('click', () => {
        navigateTo('profile');
        switchProfileSubTab('certificate');
      });
      document.getElementById('print-certificate-btn')?.addEventListener('click', () => {
        showToast('جارٍ فتح نافذة طباعة ملخص جلساتك التدريبية...');
        setTimeout(() => {
          try { window.print(); } catch (e) {}
        }, 150);
      });
      document.getElementById('settings-switch-demo-btn')?.addEventListener('click', () => openAuthModal('login'));

      // University Portal & Student Detail Modal Controls
      document.getElementById('uni-back-home-btn')?.addEventListener('click', () => navigateTo('home'));
      document.getElementById('uni-Explicit-role-switch-btn')?.addEventListener('click', () => openAuthModal('login'));
      document.querySelectorAll('.uni-start-case-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          startSimulationSession(btn.getAttribute('data-uni-start'), false, true);
        });
      });
      document.getElementById('try-open-unpublished-btn')?.addEventListener('click', () => {
        showToast('هذه النتيجة غير منشورة بعد ولا يمكن للطالب فتحها قبل اعتمادها من الأستاذ الجامعي.');
      });
      document.getElementById('prof-cohort-filter')?.addEventListener('change', renderProfessorCohortTables);
      document.getElementById('close-stu-modal-btn')?.addEventListener('click', closeStudentAttemptDetailModal);
      document.getElementById('stu-modal-close-bottom-btn')?.addEventListener('click', closeStudentAttemptDetailModal);
      document.getElementById('stu-modal-toggle-pub-btn')?.addEventListener('click', () => {
        const cohort = getProfCohortList();
        const stu = cohort.find(s => s.id === activeInspectedStudentId);
        if (stu) {
          stu.isPublished = true;
          stu.profNote = document.getElementById('stu-modal-prof-note')?.value.trim() || stu.profNote;
          saveProfCohortList(cohort);
          renderProfessorCohortTables();
          openStudentAttemptDetailModal(stu.id);
          showToast(`تم اعتماد ونشر الدرجة والملاحظة للطالب: ${stu.name}`);
        }
      });

      document.getElementById('doc-save-case-btn')?.addEventListener('click', () => {
        createAndSaveSupervisorCase('doc-case-title', 'doc-case-dept', 'doc-patient-name', 'doc-patient-allergy', 'doc-patient-complaint');
      });

      document.getElementById('doc-export-csv-btn')?.addEventListener('click', () => {
        const cohort = getProfCohortList();
        const rows = ['اسم الطالب,الرقم الجامعي,التخصص,الحالة,الدرجة,حالة النشر'];
        cohort.forEach(s => {
          rows.push(`"${s.name}","${s.uniId}","${s.specialty}","${s.caseTitle}","${s.score}","${s.isPublished ? 'منشورة' : 'قيد الاعتماد'}"`);
        });
        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nabd_cohort_grades.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('تم تصدير جدول درجات وتقارير الشعبة (CSV).');
      });

      // Auth form and account registration
      initLandingShowcase();
      nbRenderQuiz();
      initAuthRoles();
      initPhase1c();
      try { nb8Init(); } catch (e) { console.error(e); } // phase8 2026-11-07: academic portal
      initObserve();
      (function(){ const el = document.getElementById('nb-credits'); if (el) el.innerHTML = 'Wikimedia Commons: ' + Object.values(NB_IMG).map(i => `<a href="${i.page}" target="_blank" rel="noopener noreferrer">${i.alt}</a>${i.lic && !/public domain|cc0/i.test(i.lic) ? ` (${i.by}، ${i.lic})` : ''}`).join(' · '); })();
      initNurse();
      nbCoachApiInit();
      document.getElementById('close-auth-modal-btn')?.addEventListener('click', closeAuthModal);
      // A tap on the dimmed area outside the box closes it too (only when the press also started there,
      // so selecting text in a field and releasing outside does not close the form).
      (() => {
        const modal = document.getElementById('auth-modal');
        if (!modal) return;
        let downOnBackdrop = false, upOnBackdrop = false;
        modal.addEventListener('pointerdown', e => { downOnBackdrop = e.target === modal; });
        modal.addEventListener('pointerup', e => { upOnBackdrop = e.target === modal; });
        modal.addEventListener('click', e => { if (e.target === modal && downOnBackdrop && upOnBackdrop) closeAuthModal(); downOnBackdrop = upOnBackdrop = false; });
      })();
      document.getElementById('auth-tab-login')?.addEventListener('click', () => switchAuthModalTab('login'));
      document.getElementById('auth-tab-register')?.addEventListener('click', () => switchAuthModalTab('register'));

      document.getElementById('reg-next-btn')?.addEventListener('click', () => {
        const nm = document.getElementById('reg-name').value.trim();
        const em = document.getElementById('reg-email').value.trim();
        const pw = document.getElementById('reg-pass').value;
        const er = document.getElementById('reg-error-msg');
        if (!nm || !em || !/^\S+@\S+\.\S+$/.test(em)) {
          er.textContent = 'يرجى إدخال الاسم الكامل وبريد إلكتروني صحيح للمتابعة.';
          er.classList.remove('hidden');
          return;
        }
        if (pw.length < 8) {
          er.textContent = 'اكتب كلمة مرور من ٨ أحرف على الأقل.';
          er.classList.remove('hidden');
          document.getElementById('reg-pass')?.focus();
          return;
        }
        setRegStep(2);
      });
      document.getElementById('reg-back-btn')?.addEventListener('click', () => setRegStep(1));

      document.getElementById('reg-role')?.addEventListener('change', (e) => {
        const isStu = e.target.value === 'student';
        document.getElementById('reg-year-wrap')?.classList.toggle('hidden', !isStu);
        document.getElementById('reg-code-wrap')?.classList.toggle('hidden', !isStu); // phase8 2026-11-07
      });

      // Login accepts only accounts saved through registration on this device.
      document.getElementById('auth-pane-login')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const pass = document.getElementById('login-pass').value;
        const errBox = document.getElementById('login-error-msg');
        errBox.classList.add('hidden');

        if (!email || !pass) {
          errBox.textContent = 'أدخل البريد الإلكتروني وكلمة المرور.';
          errBox.classList.remove('hidden');
          return;
        }
        const savedMap = safeStorageGet(STORAGE_KEYS.ACCOUNTS_MAP, {});
        const foundLocal = Object.values(savedMap).find(a => !a.isDemo && (a.email || '').toLowerCase() === email);
        if (!foundLocal) {
          errBox.textContent = 'هذا البريد غير مسجل. أنشئ حساباً جديداً للمتابعة.';
          errBox.classList.remove('hidden');
          return;
        }
        try {
          if (!foundLocal.passwordSalt || !foundLocal.passwordHash) {
            foundLocal.passwordSalt = nbPasswordSalt();
            foundLocal.passwordHash = await nbPasswordDigest(pass, foundLocal.passwordSalt);
            saveAccountToStorage(foundLocal);
            loginWithAccount(foundLocal, 'تم إعداد كلمة المرور لحسابك المحفوظ.');
            return;
          }
          const digest = await nbPasswordDigest(pass, foundLocal.passwordSalt);
          if (digest !== foundLocal.passwordHash) {
            errBox.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
            errBox.classList.remove('hidden');
            return;
          }
          loginWithAccount(foundLocal, `مرحباً بعودتك، ${foundLocal.name}.`);
        } catch (error) {
          errBox.textContent = error?.message || 'تعذر التحقق من كلمة المرور. حاول مرة أخرى.';
          errBox.classList.remove('hidden');
        }
      });

      // Local account registration
      document.getElementById('submit-register-btn')?.addEventListener('click', async () => {
        const name = document.getElementById('reg-name').value.trim();
        const role = document.getElementById('reg-role').value;
        const specialty = document.getElementById('reg-specialty') ? document.getElementById('reg-specialty').value : 'التمريض';
        const yearVal = document.getElementById('reg-year') ? Number(document.getElementById('reg-year').value) : 4;
        const nbCoh = nbCohortFor(document.getElementById('reg-code')?.value);
        const uni = (nbCoh && nbCoh.uni) || document.getElementById('reg-uni').value.trim() || 'الجامعة الأردنية';
        const email = document.getElementById('reg-email').value.trim().toLowerCase();
        const password = document.getElementById('reg-pass').value;
        const regErr = document.getElementById('reg-submit-error');
        regErr.classList.add('hidden');

        if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
          regErr.textContent = 'راجع الاسم والبريد وكلمة المرور (٨ أحرف على الأقل).';
          regErr.classList.remove('hidden');
          return;
        }

        const accountMap = safeStorageGet(STORAGE_KEYS.ACCOUNTS_MAP, {});
        const existing = Object.values(accountMap).find(a => !a.isDemo && (a.email || '').toLowerCase() === email);
        if (existing?.passwordHash) {
          regErr.textContent = 'هذا البريد مسجل بالفعل. اختر «تسجيل الدخول».';
          regErr.classList.remove('hidden');
          return;
        }

        let passwordSalt;
        let passwordHash;
        try {
          passwordSalt = nbPasswordSalt();
          passwordHash = await nbPasswordDigest(password, passwordSalt);
        } catch (error) {
          regErr.textContent = error?.message || 'تعذر إنشاء الحساب بهذا المتصفح. حاول مرة أخرى.';
          regErr.classList.remove('hidden');
          return;
        }

        if (existing) {
          existing.passwordSalt = passwordSalt;
          existing.passwordHash = passwordHash;
          saveAccountToStorage(existing);
          loginWithAccount(existing, 'تم تحديث كلمة المرور لحسابك المحفوظ.');
          return;
        }

        const parts = name.split(' ').filter(Boolean);
        const initials = parts.length >= 2 ? `${parts[0][0]} ${parts[1][0]}` : name.slice(0, 2);
        const roleNameAr = getRoleArabicName(role);

        const customAccount = {
          id: 'local_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          name: name,
          initials: initials,
          email: email,
          passwordSalt: passwordSalt,
          passwordHash: passwordHash,
          uni: uni,
          role: role,
          year: role === 'student' ? yearVal : null,
          roleNameAr: roleNameAr,
          specialty: specialty,
          roleLabel: `${roleNameAr}${role === 'student' ? ' · السنة ' + yearVal : ''} · التخصص: ${specialty} — ${uni}`,
          isDemo: false,
          track: role === 'professor' ? null : (role === 'practitioner' ? 'nursing' : (/^الطب/.test(specialty) ? 'medicine' : 'nursing')),
          cohort: nbCoh ? nbCoh.code : null,
          cohortName: nbCoh ? nbCoh.name : null,
          stats: { completed: 0, avgSpec: 'لا توجد بعد', avgEr: 'لا توجد بعد' },
          strengths: ['حساب جديد — ستظهر نقاط القوة هنا بعد إتمامك لأولى جلسات المحاكاة السريرية وتسليم SBAR.'],
          weaknesses: ['لا توجد ملاحظات مسجلة بعد قبل إجراء الجلسات.'],
          recommendations: ['ابدأ بغرفة الطوارئ العشوائية أو غرفة الطوارئ التنفسية، ثم تدرّب على نقاط ضعفك مع المدرب السريري.'],
          history: []
        };

        loginWithAccount(customAccount, `تم إنشاء حسابك بنجاح — أهلاً بك ${name} (${roleNameAr})!`);
      });

      // Footer App Links
      document.querySelectorAll('.foot-app-link').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.getAttribute('data-foot-app')));
      });

      // Toast Close
      document.getElementById('calm-toast-close')?.addEventListener('click', () => {
        document.getElementById('calm-toast')?.classList.add('hidden');
      });
    }

