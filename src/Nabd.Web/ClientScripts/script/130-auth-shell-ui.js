    /* Update Headers, Sidebar, Footer, Home Role Sections & Profile UI */
    function syncAuthShellUI() {
      const isAuth = Boolean(authState.isAuthenticated && authState.user);
      const pubHeader = document.getElementById('public-header');
      const appHeader = document.getElementById('app-header');
      const sideGuestNav = document.getElementById('sidebar-guest-nav');
      const sideAppNav = document.getElementById('sidebar-app-nav');
      const sideGuestFoot = document.getElementById('sidebar-guest-footer');
      const sideAppFoot = document.getElementById('sidebar-app-footer');
      const footGuest = document.getElementById('footer-guest-links');
      const footApp = document.getElementById('footer-app-links');
      const sideSub = document.getElementById('sidebar-subtitle');

      pubHeader?.classList.toggle('hidden', isAuth);
      appHeader?.classList.toggle('hidden', !isAuth);
      sideGuestNav?.classList.toggle('hidden', isAuth);
      sideAppNav?.classList.toggle('hidden', !isAuth);
      sideGuestFoot?.classList.toggle('hidden', isAuth);
      sideAppFoot?.classList.toggle('hidden', !isAuth);
      footGuest?.classList.toggle('hidden', isAuth);
      footApp?.classList.toggle('hidden', !isAuth);

      if (!isAuth) {
        if (sideSub) sideSub.textContent = 'تصفح التعريف بالمنصة';
        closeAccountDropdown();
        return;
      }

      const u = authState.user;
      const roleAr = u.roleNameAr || getRoleArabicName(u.role);
      const specAr = u.specialty || 'التمريض';
      const isProf = (u.role === 'professor' || u.role === 'doctor');
      const isStudent = (u.role === 'student');

      if (sideSub) sideSub.textContent = `${roleAr} · ${specAr}`;

      // Update App Header Avatar & Account Dropdown
      const avatarFallback = document.getElementById('user-avatar-fallback');
      if (avatarFallback) avatarFallback.textContent = u.initials || u.name.slice(0, 2);
      const shortNameEl = document.getElementById('header-user-short-name');
      if (shortNameEl) shortNameEl.textContent = u.name;
      const dropName = document.getElementById('dropdown-user-name');
      if (dropName) dropName.textContent = u.name;
      const dropRole = document.getElementById('dropdown-user-role');
      if (dropRole) dropRole.textContent = `${roleAr} (${specAr})`;
      const dropDemo = document.getElementById('dropdown-demo-badge');
      if (dropDemo) {
        dropDemo.textContent = 'وضع العرض التجريبي';
        dropDemo.classList.toggle('hidden', !u.isDemo);
      }

      // Update Sidebar Academic Role Badge
      const uniRolePill = document.getElementById('side-uni-role-pill');
      const uniDesc = document.getElementById('side-uni-desc');
      if (uniRolePill && uniDesc) {
        if (isProf) {
          uniRolePill.textContent = 'صلاحية أستاذ جامعي';
          uniDesc.textContent = 'إدارة نتائج طلبة الشعبة وإضافة حالات سريرية جديدة.';
        } else {
          uniRolePill.textContent = `صلاحية ${roleAr}`;
          uniDesc.textContent = 'استعراض الواجبات السريرية المسندة لك في المساقات الجامعية.';
        }
      }

      // Update Home Welcome Card
      const hwRole = document.getElementById('home-welcome-role');
      if (hwRole) hwRole.textContent = u.roleLabel || `${roleAr} · ${specAr}`;
      const hwDemo = document.getElementById('home-demo-indicator');
      if (hwDemo) {
        hwDemo.textContent = `حساب تجريبي`;
        hwDemo.classList.toggle('hidden', !u.isDemo);
      }
      const hwName = document.getElementById('home-welcome-name');
      if (hwName) hwName.textContent = `أهلاً بك، ${u.name}`;
      const hwSub = document.getElementById('home-welcome-sub');
      if (hwSub) {
        hwSub.textContent = isProf
          ? 'تابع تقارير طلبة شعبك، وأسند حالة من غرفة الطوارئ، واكتب ملاحظاتك بصفتك مرشداً أكاديمياً.' // phase8 2026-11-07
          : 'غرفة الطوارئ مفتوحة، وباقي الغرف تُفتح لاحقاً.';
      }

      // Toggle Role-Specific Home Sections (Professor Dashboard vs Student University Sessions)
      // phase8 2026-11-07: shown by role instead of always hidden.
      const profHomeSec = document.getElementById('home-professor-section');
      if (profHomeSec) profHomeSec.classList.toggle('hidden', !isProf);

      const stuHomeUniSec = document.getElementById('home-student-uni-section');
      if (stuHomeUniSec) stuHomeUniSec.classList.toggle('hidden', !isStudent);

      renderProfileView();
      renderUniversityPortalByRole();
      renderProfessorCohortTables();
      renderHomePath(u);
      try { nb8RenderAcademic(u); } catch (e) { console.error(e); } // phase8 2026-11-07
    }

