    function renderUniversityPortalByRole() {
      if (!authState.isAuthenticated || !authState.user) return;
      const isProf = (authState.user.role === 'professor' || authState.user.role === 'doctor');
      const roleAr = authState.user.roleNameAr || getRoleArabicName(authState.user.role);

      document.getElementById('uni-portal-badge').textContent = isProf
        ? 'بوابة الأستاذ الجامعي'
        : `بوابة ${roleAr} (${authState.user.specialty || 'التمريض'})`;
      document.getElementById('uni-portal-title').textContent = isProf
        ? 'الشعب السريرية والحالات'
        : 'واجباتك الجامعية';

      document.getElementById('uni-student-content')?.classList.toggle('hidden', isProf);
      document.getElementById('uni-doctor-content')?.classList.toggle('hidden', !isProf);
      // phase8 2026-11-07: wording from the reference build
      const badge = document.getElementById('uni-portal-badge'), title = document.getElementById('uni-portal-title'), desc = document.getElementById('uni-portal-desc');
      if (badge) badge.textContent = isProf ? 'قسم المشرف الأكاديمي المباشر' : 'بوابة المساقات الجامعية';
      if (title) title.textContent = isProf ? 'المساقات والشعب ومتابعة الطلبة' : 'واجباتك ونتائجك المنشورة';
      if (desc) desc.textContent = isProf
        ? 'أسند حالات غرفة الطوارئ لشعبك، وراجع تقارير الطلبة وتقدّمهم، واعمل مرشداً أكاديمياً.'
        : 'الحالات التي أسندها المشرف لشعبتك، ونتائجك بعد اعتمادها، وملاحظات المشرف والمرشد.';
    }

