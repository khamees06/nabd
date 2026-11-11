    const DEPARTMENTS = [
      { id: 'all', name: 'جميع التخصصات' },
      { id: 'cardio', name: 'القلب والأوعية الدموية' },
      { id: 'resp', name: 'الأمراض الصدرية والتنفسية' },
      { id: 'ortho', name: 'العظام والكسور' },
      { id: 'gi', name: 'الباطنية والجهاز الهضمي' },
      { id: 'obgyn', name: 'النسائية والتوليد' },
      { id: 'peds', name: 'الأطفال' },
      { id: 'neuro', name: 'الأعصاب (قيد الإضافة)' }
    ];

    /* General + Specialized Workup Catalog:
       Presented to the student as a structured clinical menu without spoiling which
       tests are "expected" for the active case. Each case defines specific results
       for relevant tests, while non-essential tests return realistic normal/baseline findings. */
    const GENERAL_WORKUP_CATALOG = [
      {
        id: 'w_ecg',
        category: 'imaging',
        isImaging: true,
        imageKey: 'ecg_normal',
        title: 'تخطيط القلب الكهربائي (12-Lead ECG)',
        subtitle: 'يرسل ورقة التخطيط (12 مسرى) إلى الشات لفحصها وتكبيرها وتحليلها',
        defaultResultTitle: 'مرفق قسم القلبية: تخطيط القلب الكهربائي (12-Lead ECG)',
        defaultResultText: 'بيانات الجهاز: السرعة 25 mm/s | المعايرة 10 mm/mV | معدل البطين المسجل آلياً: 78 bpm | PR: 156 ms | QRS: 88 ms. (افحص الصورة المرفقة واستنتج قراءتك التخطيطية بنفسك).',
        defaultLabRows: [
          { param: 'Ventricular Rate', val: '78', unit: 'bpm', ref: '60 - 100' },
          { param: 'PR Interval', val: '156', unit: 'ms', ref: '120 - 200' },
          { param: 'QRS Duration', val: '88', unit: 'ms', ref: '70 - 110' }
        ]
      },
      {
        id: 'w_glucometer',
        category: 'bedside',
        title: 'فحص سكر الدم الشعري بجانب السرير (Glucometer)',
        subtitle: 'قياس رقمي فوري لغلوكوز الدم الشعري يُرسل للشات',
        defaultResultTitle: 'ورقة قياس بجانب السرير: سكر الدم الشعري (Capillary Blood Glucose)',
        defaultResultText: 'عينة دم شعري طرفي — اقرأ القيمة المسجلة وقارنها بالمجال المرجعي لاستنتاج دلالتها.',
        defaultLabRows: [
          { param: 'Capillary Glucose (Random)', val: '104', unit: 'mg/dL', ref: '70 - 140 (Random)' }
        ]
      },
      {
        id: 'w_urinalysis',
        category: 'lab',
        title: 'فحص البول العام والراسب المجهري (Routine Urinalysis - UA)',
        subtitle: 'تحليل كيميائي ومجهري كامل لعينة البول (الكثافة، السكر، الكيتون، الكريات)',
        defaultResultTitle: 'مختبر المستشفى المركزي: نتيجة فحص البول العام (Urinalysis)',
        defaultResultText: 'عينة بول وسطية — حلل القيم الكيميائية والمجهرية المدونة في الجدول أدناه بنفسك.',
        defaultLabRows: [
          { param: 'Color / Appearance', val: 'Yellow / Clear', unit: '-', ref: 'Pale Yellow / Clear' },
          { param: 'Specific Gravity (الكثافة النوعية)', val: '1.015', unit: '-', ref: '1.005 - 1.025' },
          { param: 'pH', val: '6.0', unit: '-', ref: '4.5 - 8.0' },
          { param: 'Urine Glucose (سكر البول)', val: 'Negative (سلبي)', unit: 'mg/dL', ref: 'Negative' },
          { param: 'Urine Ketones (الكيتونات)', val: 'Negative (سلبي)', unit: '-', ref: 'Negative' },
          { param: 'Leukocyte Esterase / Nitrite', val: 'Negative / Negative', unit: '-', ref: 'Negative' },
          { param: 'WBC (كريات بيضاء بالمجهر)', val: '1 - 2', unit: '/HPF', ref: '0 - 5 /HPF' },
          { param: 'RBC (كريات حمراء بالمجهر)', val: '0 - 1', unit: '/HPF', ref: '0 - 2 /HPF' }
        ]
      },
      {
        id: 'w_auscultation',
        category: 'bedside',
        title: 'إصغاء أصوات الصدر والقلب وفحص الأطراف سريرياً',
        subtitle: 'معطيات السماعة الطبية والتأمل والجس المباشر دون إعطاء تشخيص جاهز',
        defaultResultTitle: 'بطاقة موجودات الفحص السريري المباشر (Physical Exam Findings)',
        defaultResultText: 'الصدر: حركات تنفسية متناظرة، أصوات حويصلية مسموعة بالجهتين | القلب: S1 + S2 مسموعان بوضوح | الأطراف السفلية: دافئة، متناظرة القطر، لا يوجد انطباع وذمي.',
        defaultLabRows: [
          { param: 'Lung Auscultation (إصغاء الرئتين)', val: 'Vesicular bilateral', unit: '-', ref: 'Clear vesicular' },
          { param: 'Heart Sounds (أصوات القلب)', val: 'S1 + S2 regular', unit: '-', ref: 'S1 + S2, no murmur' },
          { param: 'Lower Limbs Inspection/Palpation', val: 'Symmetrical, non-tender', unit: '-', ref: 'No edema / tenderness' }
        ]
      },
      {
        id: 'w_pulses_crt',
        category: 'bedside',
        title: 'فحص النبض المحيطي وامتلاء الشعيرات والحس العصبي',
        subtitle: 'قراءات التروية المحيطية والأغشية المخاطية والحس العصبي',
        defaultResultTitle: 'بطاقة الفحص الوعائي العصبي المحيطي والأغشية (Neurovascular & Perfusion)',
        defaultResultText: 'افحص القيم السريرية المسجلة أدناه واستنتج حالة التروية أو الإماهة بنفسك.',
        defaultLabRows: [
          { param: 'Distal Pulses (Dorsalis Pedis / Radial)', val: '+2 / +2 (ممتلئ ومنتظم)', unit: 'Grade', ref: '+2 Normal' },
          { param: 'Capillary Refill Time (CRT)', val: '1.5', unit: 'sec', ref: '< 2.0 sec' },
          { param: 'Mucous Membranes & Skin Turgor', val: 'Moist / Instant recoil', unit: '-', ref: 'Moist / < 1 sec' },
          { param: 'Distal Sensation & Toe Motion', val: 'Intact (سليم)', unit: '-', ref: 'Intact' }
        ]
      },
      {
        id: 'w_cbc_chem',
        category: 'lab',
        title: 'تعداد الدم الكامل والأملاح ووظائف الكلى (CBC, Electrolytes, Creatinine)',
        subtitle: 'ورقة تحاليل الدم والكيمياء السريرية القياسية (قارن الأرقام بالمجال المرجعي)',
        defaultResultTitle: 'مختبر المستشفى المركزي: تعداد الدم والكيمياء (CBC & Chemistry Panel)',
        defaultResultText: 'عينة دم وريدي — قارن كل رقم بالمجال المرجعي للمستشفى وحدد القيم غير الطبيعية في تحليلك.',
        defaultLabRows: [
          { param: 'Hemoglobin (Hb - خضاب الدم)', val: '13.6', unit: 'g/dL', ref: '12.0 - 16.0' },
          { param: 'MCV (متوسط حجم الكرية)', val: '86', unit: 'fL', ref: '80 - 96' },
          { param: 'WBC (كريات الدم البيضاء)', val: '7.4', unit: '×10³/µL', ref: '4.5 - 11.0' },
          { param: 'Platelets (الصفيحات الدموية)', val: '245', unit: '×10³/µL', ref: '150 - 400' },
          { param: 'Serum Creatinine (الكرياتينين)', val: '0.88', unit: 'mg/dL', ref: '0.60 - 1.20' },
          { param: 'BUN (نيتروجين يوريا الدم)', val: '14', unit: 'mg/dL', ref: '7 - 20' },
          { param: 'Sodium (Na+) / Potassium (K+)', val: '139 / 4.1', unit: 'mEq/L', ref: 'Na: 135-145 | K: 3.5-5.1' }
        ]
      },
      {
        id: 'w_troponin',
        category: 'lab',
        title: 'خمائر القلب النوعية (High-Sensitivity Troponin I)',
        subtitle: 'نتيجة رقمية مخبرية لتركيز التروبونين القلبي في المصل',
        defaultResultTitle: 'مختبر الكيمياء الحيوية: خمائر القلب (hs-Troponin I)',
        defaultResultText: 'عينة مصل دموي — قارن القيمة الرقمية بالحد الأعلى المرجعي للمستشفى.',
        defaultLabRows: [
          { param: 'High-Sensitivity Troponin I', val: '0.012', unit: 'ng/mL', ref: '0.000 - 0.040' },
          { param: 'CK-MB Mass', val: '2.1', unit: 'ng/mL', ref: '0.0 - 4.9' }
        ]
      },
      {
        id: 'w_abg',
        category: 'lab',
        title: 'غازات الدم الشرياني (Arterial Blood Gases - ABG)',
        subtitle: 'ورقة قراءات غازات الدم الشرياني (pH, PaO2, PaCO2, HCO3, Lactate)',
        defaultResultTitle: 'وحدة العناية والتنفسية: غازات الدم الشرياني (ABG Slip)',
        defaultResultText: 'عينة شريانية (على هواء الغرفة FiO2 21%) — حلل التوازن الحمضي القاعدي والأكسجة بنفسك.',
        defaultLabRows: [
          { param: 'pH', val: '7.40', unit: '-', ref: '7.35 - 7.45' },
          { param: 'PaCO2', val: '39', unit: 'mmHg', ref: '35 - 45' },
          { param: 'PaO2', val: '92', unit: 'mmHg', ref: '80 - 100' },
          { param: 'HCO3- (البيكربونات)', val: '24.2', unit: 'mEq/L', ref: '22.0 - 26.0' },
          { param: 'Arterial O2 Saturation (SaO2)', val: '97', unit: '%', ref: '95 - 100%' },
          { param: 'Lactate (اللاكتات)', val: '1.1', unit: 'mmol/L', ref: '0.5 - 2.0' }
        ]
      },
      {
        id: 'w_bhcg_iron',
        category: 'lab',
        title: 'فحص هرمون الحمل الرقمي ومخزون الحديد (Serum B-hCG & Ferritin)',
        subtitle: 'ورقة مختبر الهرمونات ومخزون الحديد (قراءة رقمية دون تفسير جاهز)',
        defaultResultTitle: 'مختبر الهرمونات والدمويات: B-hCG & Serum Ferritin',
        defaultResultText: 'قارن القيم المسجلة بالمجالات المرجعية المعتمدة في المستشفى.',
        defaultLabRows: [
          { param: 'Quantitative Serum Beta-hCG', val: 'أقل من 2.0', unit: 'mIU/mL', ref: '< 5.0 (Non-pregnant)' },
          { param: 'Serum Ferritin (مخزون الحديد)', val: '52', unit: 'ng/mL', ref: '30 - 200' },
          { param: 'Serum Iron (حديد المصل)', val: '88', unit: 'µg/dL', ref: '60 - 170' }
        ]
      },
      {
        id: 'w_ultrasound_doppler',
        category: 'imaging',
        isImaging: true,
        imageKey: 'ultrasound',
        title: 'التصوير بالأمواج فوق الصوتية / الدوبلر بجانب السرير (Ultrasound / Doppler)',
        subtitle: 'يرسل صورة السونار / الدوبلر مع القياسات الخام إلى الشات لفحصها',
        defaultResultTitle: 'مرفق التصوير بالأمواج فوق الصوتية والدوبلر (Ultrasound / Doppler)',
        defaultResultText: 'مسبار 7.5 MHz — افحص صورة السونار المرفقة والقياسات المسجلة أدناه واستنتج الموجودات.',
        defaultLabRows: [
          { param: 'B-Mode Acoustic Window', val: 'Adequate visualization', unit: '-', ref: 'Normal echotexture' },
          { param: 'Free Fluid / Collection', val: 'None detected (0 mm)', unit: 'mm', ref: 'None' },
          { param: 'Color Doppler Flow Signal', val: 'Present / Phasic', unit: '-', ref: 'Patent flow' }
        ]
      },
      {
        id: 'w_xray_limb_chest',
        category: 'imaging',
        isImaging: true,
        imageKey: 'xray_chest',
        title: 'صورة أشعة سينية رقمية (Plain Digital X-Ray)',
        subtitle: 'يرسل صورة الأشعة السينية إلى الشات لتكبيرها (Zoom) وفحص العظام أو الرئتين',
        defaultResultTitle: 'قسم الأشعة التشخيصية: صورة أشعة سينية رقمية (Digital X-Ray)',
        defaultResultText: 'تم إرفاق صورة الأشعة الرقمية — اضغط على الصورة لتكبيرها (Zoom) وتفحص البنى التشريحية بنفسك.',
        defaultLabRows: [
          { param: 'Modality / Projection', val: 'Digital Radiography (DR)', unit: '-', ref: 'Standard Exposure' },
          { param: 'Image Quality & Alignment', val: 'Diagnostic / Centered', unit: '-', ref: 'Adequate penetration' }
        ]
      },
      {
        id: 'w_ct_contrast',
        category: 'imaging',
        isImaging: true,
        imageKey: 'ct_chest',
        title: 'تصوير طبقي محوري مع صبغة وريدية (Contrast-Enhanced CT)',
        subtitle: 'يرسل مقطع الطبقي المحوري للشات (تحقق من الكلى والحساسية والحمل أولاً)',
        defaultResultTitle: 'قسم التصوير الطبقي المحوري: مقطع محوري (Contrast CT Scan)',
        defaultResultText: 'تم إرفاق مقطع التصوير الطبقي المحوري — كبّر الصورة وافحص الأوعية والأنسجة بنفسك.',
        defaultLabRows: [
          { param: 'Protocol', val: 'Helical Axial CT (2.5 mm)', unit: 'mm', ref: 'Contrast-enhanced' },
          { param: 'IV Contrast Media', val: 'Iodinated Non-ionic', unit: 'mL', ref: 'Requires normal Cr & no allergy' }
        ]
      },
      {
        id: 'w_admin_med',
        category: 'bedside',
        title: 'إعطاء دواء / مضاد حيوي أو مسكن وريدي (بنسلين / سلفا / NSAIDs)',
        subtitle: 'يتطلب التحقق المسبق من الحساسية الدوائية وموانع الاستعمال قبل الإعطاء',
        defaultResultTitle: 'سجل إعطاء الأدوية بجانب السرير (Medication Administration)',
        defaultResultText: 'تم التحقق من سجل الحساسية الدوائية قبل إعطاء الدواء.',
        defaultLabRows: [
          { param: 'Allergy Safety Verification', val: 'Verified Safe', unit: '-', ref: 'Mandatory pre-check' }
        ]
      }
    ];

