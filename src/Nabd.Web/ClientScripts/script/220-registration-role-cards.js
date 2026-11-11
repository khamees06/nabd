    function nbSetRegRole(r) {
      const role = document.getElementById('reg-role'); const sp = document.getElementById('reg-specialty');
      if (!role) return;
      role.value = r === 'supervisor' ? 'professor' : 'student';
      if (sp && r !== 'supervisor') sp.value = r === 'medicine' ? 'الطب' : 'التمريض';
      role.dispatchEvent(new Event('change'));
      document.querySelectorAll('#reg-rolecards [data-rc]').forEach(b => b.classList.toggle('is-on', b.dataset.rc === r));
      const chip = document.getElementById('reg-track-chip');
      if (chip) chip.innerHTML = r === 'medicine' ? '<b>مسار الطب</b>' : r === 'supervisor' ? '<b>أستاذ جامعي</b>' : '<b>مسار التمريض</b>';
      // phase8 2026-11-07: card subtitles under the track chip; the section code is for students only
      if (chip) chip.innerHTML = r === 'medicine' ? '<b>مسار الطب</b><span>طبيب مقيم في غرفة الطوارئ: المقابلة والتشخيص التفريقي والقرار.</span>'
        : r === 'supervisor' ? '<b>مشرف / أستاذ</b><span>البوابة الأكاديمية: المساقات، إسناد الحالات، تقارير الطلبة، والإرشاد.</span>'
        : '<b>مسار التمريض</b><span>المسؤول عن الحالة: تقييم منهجي، مراقبة، وسلامة الدواء.</span>';
      document.querySelectorAll('#reg-rolecards [data-rc]').forEach(b => b.setAttribute('aria-pressed', b.dataset.rc === r ? 'true' : 'false'));
      document.getElementById('reg-code-wrap')?.classList.toggle('hidden', r === 'supervisor');
    }

    function initAuthRoles() {
      document.querySelectorAll('#reg-rolecards [data-rc]').forEach(b => b.addEventListener('click', () => nbSetRegRole(b.dataset.rc)));
    }

