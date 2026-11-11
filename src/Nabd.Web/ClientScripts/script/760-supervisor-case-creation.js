    function createAndSaveSupervisorCase(titleId, deptId, pNameId, allergyId, complaintId) {
      if (!authState.user || (authState.user.role !== 'professor' && authState.user.role !== 'doctor')) {
        showToast('إضافة الحالات متاحة لحساب الأستاذ الجامعي فقط.');
        return;
      }
      const title = document.getElementById(titleId)?.value.trim() || 'حالة سريرية مضافة';
      const dept = document.getElementById(deptId)?.value || 'cardio';
      const pName = document.getElementById(pNameId)?.value.trim() || 'مريض افتراضي';
      const allergy = document.getElementById(allergyId)?.value.trim() || 'لا توجد حساسية مسجلة';
      const complaint = document.getElementById(complaintId)?.value.trim() || 'شكوى سريرية للتقييم';

      const newId = 'case_prof_' + Date.now();
      const newCaseObj = {
        id: newId,
        deptId: dept,
        deptName: DEPARTMENTS.find(d => d.id === dept)?.name || 'الباطنية',
        image: CASE_IMAGES.img0,
        title: title,
        comorbidities: allergy,
        cardSummary: 'حالة سريرية مضافة من الأستاذ الجامعي لتقييم الاستجواب والملاحظات وتسليم SBAR.',
        levelLabel: 'متوسط',
        durationMin: 12,
        patient: {
          name: pName,
          age: 54,
          gender: 'male',
          bio: `${pName} · حالة مضافة من الأستاذ الجامعي`,
          initialGreeting: complaint
        },
        vitalsInitial: { hr: 98, bp: '158/94', spo2: 96, temp: 37.1 },
        questions: [
          {
            id: 'q_custom_1',
            label: 'تحليل الشكوى والأعراض المرافقة',
            prompt: 'سلامتك، متى بدأت هذه الأعراض معك وهل تتناول أدويتك بانتظام؟',
            reply: complaint,
            emotion: 'open',
            delta: 12,
            reason: 'استجواب مباشر للشكوى والالتزام الدوائي.'
          },
          {
            id: 'q_allergy',
            label: 'التحقق من الحساسية الدوائية والموانع',
            prompt: 'هل تعاني من أي حساسية دوائية أو موانع علاجية؟',
            reply: `نعم، لدي: ${allergy}`,
            emotion: 'relaxed',
            delta: 15,
            reason: 'كشف الحساسية أو المعلومة الحرجة المحددة في الحالة.'
          }
        ],
        expectedWorkupIds: ['w_ecg', 'w_cbc_chem'],
        workupOverrides: {},
        idealSummary: `المريض ${pName}، حضر بشكوى: ${complaint}. المعلومة الحرجة المكتشفة: ${allergy}.`,
        idealHandover: `تم قياس العلامات الحيوية وتوثيق المعلومة الحرجة (${allergy})، يرجى مراجعة الطبيب المناوب لاستكمال الخطة.`
      };

      CASES_DB[newId] = newCaseObj;
      saveCustomCaseToStorage(newCaseObj);
      selectedDeptFilter = 'all';
      renderDepartmentFilterBar();
      renderClinicalCaseCards();
      navigateTo('home', { scrollToCases: true });
      showToast('تم حفظ الجلسة السريرية الجديدة وإضافتها لبطاقات الحالات بنجاح.');
    }

