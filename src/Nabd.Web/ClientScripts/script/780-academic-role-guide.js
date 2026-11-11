    /* ---------- role guidance on the student home ---------- */
    function nb8Icon(name) {
      const p = {
        chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        exam: '<path d="M5 3v6a5 5 0 0 0 10 0V3"/><path d="M10 14v1a5 5 0 0 0 10 0v-3"/><circle cx="20" cy="10" r="2"/>',
        pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
        pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
        sbar: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/>',
        abcde: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
        monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M6 10h3l2-3 2 6 2-3h3"/>',
        shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
        again: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'
      }[name] || '';
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
    }
    function nb8RenderGuide(u) {
      const box = document.getElementById('nb8-guide');
      if (!box) return;
      const track = nbTrackOf(u);
      if (!u || !track || nb8IsProf(u)) { box.classList.add('hidden'); return; }
      const med = track === 'medicine';
      const steps = med ? [
        ['chat', 'المقابلة', 'اسأل المريض والمرافق عن القصة والأعراض والأدوية والحساسية.'],
        ['exam', 'الفحص وطلب الفحوصات', 'افحص المريض، واطلب الفحوصات التي تحتاجها مع سبب سريري واضح.'],
        ['pill', 'العلاج', 'اطلب العلاج من الممرضة، واستشر المشرف حين تحتاج إلى ذلك.'],
        ['pulse', 'متابعة الاستجابة', 'راقب المونيتور وحال المريض بعد كل إجراء، وعدّل خطتك.'],
        ['sbar', 'التسليم والتقييم', 'سلّم الحالة بصيغة SBAR، ثم اقرأ تقييم أدائك.']
      ] : [
        // nurse mode 2026-11-07: the nursing track plays the ER nurse responsible for the bed.
        ['abcde', 'التقييم المنهجي ABCDE', 'المجرى الهوائي، فالتنفس، فالدوران، فالوعي، ثم الفحص الكامل بالترتيب.'],
        ['monitor', 'قراءة المونيتور والتعرف على التدهور', 'تابع العلامات الحيوية وأعد قياسها، وانتبه لأي تدهور.'],
        ['sbar', 'التصعيد بصيغة SBAR', 'اتصل بالطبيب وقدّم له الوضع والخلفية والتقييم بالأرقام وتوصيتك.'],
        ['shield', 'سلامة الدواء', 'تحقق من الحساسية قبل كل دواء، ونفّذ أوامر الطبيب بالجرعة المكتوبة.'],
        ['again', 'إعادة التقييم والتسليم', 'أعد التقييم بعد كل تدخل، ثم سلّم الحالة بصيغة SBAR.']
      ];
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('nb8-guide-track', med ? 'مسار الطب' : 'مسار التمريض');
      set('nb8-guide-intro', med
        ? 'أنت طبيب مقيم في غرفة طوارئ. ستستقبل مريضاً لا تعرف تشخيصه، ومعك ممرضة تنفّذ طلباتك ومشرف تستشيره ومرافق يعرف قصة المريض. مهمتك: المقابلة، الفحص وطلب الفحوصات، العلاج، متابعة الاستجابة، ثم تسليم الحالة بصيغة SBAR والحصول على تقييم.'
        : 'ستستقبل مريضاً في غرفة الطوارئ بصفتك ممرض/ة الطوارئ المسؤول/ة عن السرير. معك مرافق يعرف قصة المريض، وطبيب مقيم تتصل به حين تحتاجه، ومشرفة تمريضية تعلّمك الأولويات. يمكنك تغيير دورك إلى طبيب من نافذة التعليمات قبل بدء الجلسة. ركّز في عملك على ما يلي:');
      const ol = document.getElementById('nb8-guide-steps');
      if (ol) ol.innerHTML = steps.map((s, i) => `<li><span class="nb8-step-ic">${nb8Icon(s[0])}</span><span class="nb8-step-n font-num">${i + 1}</span><div><strong>${nb8Esc(s[1])}</strong><small>${nb8Esc(s[2])}</small></div></li>`).join('');
      box.classList.toggle('nb8-guide-med', med);
      box.classList.remove('hidden');
    }
    function nb8RoleHint(u) {
      if (!u) return '';
      if (nb8IsProf(u)) return 'بوابتك الأكاديمية جاهزة: المساقات، إسناد الحالات، تقارير الطلبة، والإرشاد.';
      const t = nbTrackOf(u);
      if (t === 'medicine') return 'دورك: طبيب مقيم في غرفة الطوارئ. ابدأ من بطاقة «ماذا ستفعل الآن؟».';
      if (t === 'nursing') return 'دورك: ممرض/ة الطوارئ المسؤول/ة عن السرير. ابدأ من بطاقة «ماذا ستفعل الآن؟».';
      return '';
    }

