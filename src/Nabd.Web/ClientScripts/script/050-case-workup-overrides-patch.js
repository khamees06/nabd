    /* =========================================================================
       2. ILLUSTRATIVE COACH TOPICS & DEMO ACCOUNTS
       ========================================================================= */

    // Patch CASES_DB workupOverrides with authentic raw hospital lab slips & diagnostic images (NO diagnostic spoilers!)
    CASES_DB.case_cardio_dm.expectedWorkupIds = ['w_ecg', 'w_glucometer', 'w_troponin', 'w_urinalysis'];
    CASES_DB.case_cardio_dm.workupOverrides = {
      w_ecg: {
        isImaging: true,
        imageKey: 'ecg_stemi',
        resultTitle: 'قسم القلبية: تخطيط القلب الكهربائي (12-Lead ECG)',
        resultText: 'معطيات جهاز التخطيط الخام: السرعة 25 mm/s | المعايرة 10 mm/mV | افحص المساري V1-V4 والمساري السفلية في الصورة المرفقة واستنتج التشخيص بنفسك.',
        labRows: [
          { param: 'Ventricular Rate (معدل النبض)', val: '104', unit: 'bpm', ref: '60 - 100' },
          { param: 'PR Interval', val: '164', unit: 'ms', ref: '120 - 200' },
          { param: 'QRS Duration', val: '94', unit: 'ms', ref: '70 - 110' },
          { param: 'ST-Segment Level (V1 - V4)', val: '+3.5 to +4.5', unit: 'mm (mV×10)', ref: 'Isoelectric (0.0 - 1.0 mm)' },
          { param: 'ST-Segment Level (II, III, aVF)', val: '-1.0', unit: 'mm', ref: 'Isoelectric' }
        ]
      },
      w_glucometer: {
        resultTitle: 'ورقة فحص بجانب السرير: سكر الدم الشعري (Glucometer)',
        resultText: 'عينة دم شعري — قارن القراءة المسجلة بالمجال المرجعي وحلل علاقتها بأعراض المريض.',
        labRows: [
          { param: 'Capillary Blood Glucose (Random)', val: '218', unit: 'mg/dL', ref: '70 - 140 (Random)' }
        ]
      },
      w_troponin: {
        resultTitle: 'مختبر الكيمياء الحيوية: خمائر القلب (hs-Troponin I)',
        resultText: 'عينة مصل دموي — قارن القيمة الرقمية بالمجال المرجعي للمستشفى.',
        labRows: [
          { param: 'High-Sensitivity Troponin I', val: '1.85', unit: 'ng/mL', ref: '0.00 - 0.04' },
          { param: 'CK-MB Mass', val: '19.4', unit: 'ng/mL', ref: '0.0 - 4.9' }
        ]
      },
      w_urinalysis: {
        resultTitle: 'مختبر المستشفى المركزي: فحص البول العام (Routine Urinalysis)',
        resultText: 'عينة بول وسطية — حلل القراءات الكيميائية والمجهرية أدناه بنفسك.',
        labRows: [
          { param: 'Color / Appearance', val: 'Yellow / Clear', unit: '-', ref: 'Pale Yellow / Clear' },
          { param: 'Specific Gravity (الكثافة النوعية)', val: '1.022', unit: '-', ref: '1.005 - 1.025' },
          { param: 'Urine Glucose (سكر البول)', val: '+2 (250 mg/dL)', unit: 'mg/dL', ref: 'Negative' },
          { param: 'Urine Ketones (الكيتونات)', val: 'Negative (سلبي)', unit: '-', ref: 'Negative' },
          { param: 'Protein / Nitrite', val: 'Trace / Negative', unit: '-', ref: 'Negative' },
          { param: 'WBC / RBC (بالمجهر)', val: '1-2 / 0-1', unit: '/HPF', ref: '0-5 / 0-2' }
        ]
      }
    };

    CASES_DB.case_resp_renal.workupOverrides = {
      w_auscultation: {
        resultTitle: 'بطاقة موجودات الفحص السريري للصدر والأطراف (Physical Exam)',
        resultText: 'اقرأ الموجودات السريرية المسجلة أدناه واستنتج دلالتها المرضية بنفسك.',
        labRows: [
          { param: 'Respiratory Rate (معدل التنفس)', val: '28', unit: 'breath/min', ref: '12 - 20' },
          { param: 'Lung Auscultation', val: 'Vesicular bilateral, mild right pleuritic rub', unit: '-', ref: 'Clear vesicular' },
          { param: 'Right Calf Circumference vs Left', val: '41.5 cm (Right) vs 36.5 cm (Left)', unit: 'cm', ref: 'Difference < 1.5 cm' },
          { param: 'Right Calf Palpation', val: 'Warmth, pitting edema +2, deep tenderness', unit: '-', ref: 'Non-tender, no edema' }
        ]
      },
      w_abg: {
        resultTitle: 'مختبر العناية: غازات الدم الشرياني (ABG Slip - Room Air)',
        resultText: 'عينة شريانية على هواء الغرفة — حلل قيم pH و PaO2 و PaCO2 بنفسك.',
        labRows: [
          { param: 'pH', val: '7.47', unit: '-', ref: '7.35 - 7.45' },
          { param: 'PaCO2', val: '29', unit: 'mmHg', ref: '35 - 45' },
          { param: 'PaO2', val: '62', unit: 'mmHg', ref: '80 - 100' },
          { param: 'HCO3-', val: '22.8', unit: 'mEq/L', ref: '22.0 - 26.0' },
          { param: 'SaO2', val: '89', unit: '%', ref: '95 - 100%' }
        ]
      },
      w_cbc_chem: {
        resultTitle: 'مختبر المستشفى المركزي: تعداد الدم ووظائف الكلى (CBC & Renal Panel)',
        resultText: 'قارن أرقام الكرياتينين واليوريا وتعداد الدم بالمجالات المرجعية للمستشفى.',
        labRows: [
          { param: 'Hemoglobin (Hb)', val: '12.9', unit: 'g/dL', ref: '13.0 - 17.0' },
          { param: 'WBC', val: '10.8', unit: '×10³/µL', ref: '4.5 - 11.0' },
          { param: 'Serum Creatinine (الكرياتينين)', val: '2.40', unit: 'mg/dL', ref: '0.60 - 1.20' },
          { param: 'BUN (اليوريا)', val: '48', unit: 'mg/dL', ref: '7 - 20' },
          { param: 'eGFR (معدل الترشيح الكبيبي)', val: '27', unit: 'mL/min/1.73m²', ref: '> 60' },
          { param: 'D-Dimer (Quantitative)', val: '3,420', unit: 'ng/mL FEU', ref: '< 500' }
        ]
      },
      w_ultrasound_doppler: {
        isImaging: true,
        imageKey: 'ultrasound',
        resultTitle: 'قسم الأشعة السريرية: دوبلر أوردة الطرف السفلي الأيمن (Venous Duplex)',
        resultText: 'مسبار خطي 7.5 MHz — كبّر الصورة المرفقة واقرأ القياسات الخام أدناه لاستنتاج النتيجة.',
        labRows: [
          { param: 'Right Popliteal Vein Compressibility', val: 'Non-compressible (غير قابل للانضغاط)', unit: '-', ref: 'Fully compressible' },
          { param: 'Intraluminal Echogenic Material', val: 'Present (مادة صدوية داخل لمعة الوريد)', unit: '-', ref: 'Anechoic lumen' },
          { param: 'Color Doppler Venous Flow', val: 'Absent flow in right popliteal segment', unit: '-', ref: 'Spontaneous phasic flow' }
        ]
      },
      w_ct_contrast: {
        requiresQuestion: 'q_allergy',
        isContraindicated: true,
        isImaging: true,
        imageKey: 'ct_chest',
        violationMsg: 'تنبيه سلامة: طلبت تصويراً طبقياً بالصبغة الوريدية لمريض لديه حساسية صبغة اليود وارتفاع كرياتينين (2.4) قبل التحقق من موانع الاستعمال.',
        resultTitle: 'إشعار قسم الأشعة: التصوير الطبقي بالصبغة الوريدية (Contrast CT)',
        resultText: 'ملاحظة نظام السلامة: سجل المريض يُظهر Creatinine 2.4 mg/dL وسابقة تفاعل تحسسي لليود الوريدي.',
        labRows: [
          { param: 'Contrast Safety Screening', val: 'Creatinine 2.4 mg/dL + Iodine Allergy', unit: '-', ref: 'Cr < 1.5 & No Allergy' }
        ]
      }
    };

    CASES_DB.case_ortho_htn.workupOverrides = {
      w_pulses_crt: {
        resultTitle: 'بطاقة الفحص الوعائي العصبي للطرف السفلي الأيمن (Neurovascular Check)',
        resultText: 'معطيات الفحص المباشر للقدم والكاحل الأيمن — حلل سلامة التروية والعصب بنفسك.',
        labRows: [
          { param: 'Dorsalis Pedis & Posterior Tibial Pulse', val: '+2 / +2 (محسوس ومنتظم)', unit: 'Grade', ref: '+2 Normal' },
          { param: 'Capillary Refill Time (أصابع القدم اليمنى)', val: '1.8', unit: 'sec', ref: '< 2.0 sec' },
          { param: 'Lateral Malleolus Palpation', val: 'Point tenderness + swelling (3 cm above tip)', unit: '-', ref: 'Non-tender' },
          { param: 'Plantar / Dorsal Sensation', val: 'Intact (سليم مع ألم عند الحركة)', unit: '-', ref: 'Intact' }
        ]
      },
      w_xray_limb_chest: {
        isImaging: true,
        imageKey: 'xray_ankle',
        resultTitle: 'قسم الأشعة الرقمية: صورة الكاحل الأيمن (Right Ankle X-Ray AP & Mortise)',
        resultText: 'تم إرسال صورة الأشعة الرقمية للكاحل الأيمن — اضغط على الصورة لتكبيرها (Zoom) وفحص النهاية السفلية للشظية والظنبوب واستنتاج موقع ونوع الكسر بنفسك.',
        labRows: [
          { param: 'Projection Views', val: 'AP & Mortise Views (Right Ankle)', unit: '-', ref: 'Standard Trauma Series' },
          { param: 'Soft Tissue Shadow', val: 'Lateral perimalleolar swelling', unit: '-', ref: 'No soft tissue swelling' },
          { param: 'Bony Cortex Inspection', val: 'انظر الصورة المرفقة وكبّر منطقة الكعب الوحشي', unit: '-', ref: 'Continuous cortex' }
        ]
      }
    };

    CASES_DB.case_gi_allergy.expectedWorkupIds = ['w_ultrasound_doppler', 'w_cbc_chem', 'w_bhcg_iron', 'w_urinalysis'];
    CASES_DB.case_gi_allergy.workupOverrides = {
      w_ultrasound_doppler: {
        isImaging: true,
        imageKey: 'ultrasound',
        resultTitle: 'قسم السونار السريري: إيكو البطن والحوض (Abdominal & Pelvic Ultrasound)',
        resultText: 'تم إرفاق صورة السونار والقياسات الخام — حلل قطر البنية الأنبوبية بالربع السفلي الأيمن وموجودات الرحم بنفسك.',
        labRows: [
          { param: 'RLQ Blind-Ending Tubular Structure Diameter', val: '9.8', unit: 'mm', ref: '< 6.0 mm (Compressible)' },
          { param: 'RLQ Probe Compressibility & Peri-echogenicity', val: 'Non-compressible + echogenic fat', unit: '-', ref: 'Compressible' },
          { param: 'Intrauterine Cavity Scan', val: 'Gestational sac 11 mm + yolk sac', unit: 'mm', ref: 'Correlate with Beta-hCG' }
        ]
      },
      w_cbc_chem: {
        resultTitle: 'مختبر المستشفى المركزي: تعداد الدم والكيمياء (CBC & Chemistry)',
        resultText: 'قارن تعداد الكريات البيض والصيغة التفريقية بالمجال المرجعي للمستشفى.',
        labRows: [
          { param: 'WBC (كريات الدم البيضاء)', val: '14.8', unit: '×10³/µL', ref: '4.5 - 11.0' },
          { param: 'Neutrophils (العدلات %)', val: '84', unit: '%', ref: '40 - 70%' },
          { param: 'Hemoglobin (Hb)', val: '12.4', unit: 'g/dL', ref: '12.0 - 16.0' },
          { param: 'CRP (البروتين التفاعلي C)', val: '64', unit: 'mg/L', ref: '< 5.0' },
          { param: 'Serum Creatinine', val: '0.72', unit: 'mg/dL', ref: '0.60 - 1.10' }
        ]
      },
      w_bhcg_iron: {
        resultTitle: 'مختبر الهرمونات: فحص هرمون الحمل الرقمي بالدم (Quantitative Serum B-hCG)',
        resultText: 'اقرأ التركيز الرقمي لهرمون Beta-hCG وقارنه بالمجال المرجعي.',
        labRows: [
          { param: 'Quantitative Serum Beta-hCG', val: '1,840', unit: 'mIU/mL', ref: '< 5.0 (Non-pregnant)' }
        ]
      },
      w_urinalysis: {
        resultTitle: 'مختبر المستشفى المركزي: فحص البول العام (Routine Urinalysis)',
        resultText: 'عينة بول وسطية — حلل القيم المسجلة أدناه لاستبعاد أو تأكيد الأسباب البولية.',
        labRows: [
          { param: 'Specific Gravity (الكثافة النوعية)', val: '1.024', unit: '-', ref: '1.005 - 1.025' },
          { param: 'Urine Ketones (الكيتونات)', val: '+1', unit: '-', ref: 'Negative' },
          { param: 'Leukocyte Esterase / Nitrite', val: 'Negative / Negative', unit: '-', ref: 'Negative' },
          { param: 'WBC / RBC (بالمجهر)', val: '2-3 / 0-1', unit: '/HPF', ref: '0-5 / 0-2' }
        ]
      },
      w_ct_contrast: {
        requiresQuestion: 'q_preg',
        isContraindicated: true,
        isImaging: true,
        imageKey: 'ct_chest',
        violationMsg: 'تنبيه سلامة إشعاعية: طلبت تصويراً طبقياً إشعاعياً لمريضة في سن الإنجاب لديها حمل مبكر دون التحقق من تاريخ الدورة والحمل أولاً.',
        resultTitle: 'تنبيه قسم الأشعة: الحماية الإشعاعية أثناء الحمل المبكر',
        resultText: 'المريضة لديها ارتفاع في هرمون Beta-hCG (1,840 mIU/mL) — يُمنع التعريض للأشعة المؤينة للبطن والحوض.',
        labRows: [
          { param: 'Radiation Safety Gate', val: 'Contraindicated (Beta-hCG 1,840 mIU/mL)', unit: '-', ref: 'Negative pregnancy required' }
        ]
      },
      w_xray_limb_chest: {
        requiresQuestion: 'q_preg',
        isContraindicated: true,
        isImaging: true,
        imageKey: 'xray_chest',
        violationMsg: 'تنبيه سلامة إشعاعية: طلبت أشعة سينية لمريضة حامل دون التحقق المسبق من احتمالية الحمل.',
        resultTitle: 'تنبيه قسم الأشعة: الحماية الإشعاعية',
        resultText: 'تذكّر التحقق من احتمالية الحمل لدى السيدات في سن الإنجاب قبل طلب التصوير الشعاعي.',
        labRows: [
          { param: 'Radiation Safety Gate', val: 'Requires Pregnancy Exclusion', unit: '-', ref: 'Negative B-hCG' }
        ]
      }
    };

    CASES_DB.case_obgyn_anemia.workupOverrides = {
      w_cbc_chem: {
        resultTitle: 'مختبر الدمويات: تعداد الدم الكامل ومؤشرات الكريات (CBC Panel)',
        resultText: 'قارن قيم Hb و MCV و MCH بالمجالات المرجعية واستنتج نوع فقر الدم بنفسك.',
        labRows: [
          { param: 'Hemoglobin (Hb - خضاب الدم)', val: '8.4', unit: 'g/dL', ref: '11.0 - 15.0 (2nd Trimester)' },
          { param: 'Hematocrit (Hct)', val: '26.2', unit: '%', ref: '33.0 - 44.0%' },
          { param: 'MCV (متوسط حجم الكرية)', val: '71', unit: 'fL', ref: '80 - 96' },
          { param: 'MCH', val: '22.8', unit: 'pg', ref: '27.0 - 33.0' },
          { param: 'WBC / Platelets', val: '8.9 / 290', unit: '×10³/µL', ref: '4.5-11.0 / 150-400' }
        ]
      },
      w_bhcg_iron: {
        resultTitle: 'مختبر الكيمياء: دراسة الحديد ومخزون الفيريتين (Iron Studies)',
        resultText: 'اقرأ أرقام الفيريتين وحديد المصل والسعة الرابطة (TIBC) وحللها بنفسك.',
        labRows: [
          { param: 'Serum Ferritin (مخزون الحديد)', val: '7.0', unit: 'ng/mL', ref: '30.0 - 150.0' },
          { param: 'Serum Iron (حديد المصل)', val: '28', unit: 'µg/dL', ref: '60 - 170' },
          { param: 'TIBC (السعة الرابطة الكلية للحديد)', val: '435', unit: 'µg/dL', ref: '250 - 370' },
          { param: 'Transferrin Saturation', val: '6.4', unit: '%', ref: '20 - 50%' }
        ]
      },
      w_ultrasound_doppler: {
        isImaging: true,
        imageKey: 'ultrasound',
        resultTitle: 'وحدة الأمومة والجنين: سونار ودوبلر نبض الجنين (Obstetric Ultrasound & Doppler)',
        resultText: 'افحص صورة السونار المرفقة والقياسات الحيوية للجنين أدناه.',
        labRows: [
          { param: 'Fetal Heart Rate (نبض الجنين FHR)', val: '146', unit: 'bpm', ref: '110 - 160 bpm' },
          { param: 'Amniotic Fluid Index (AFI)', val: '13.2', unit: 'cm', ref: '8.0 - 18.0 cm' },
          { param: 'Placental Location', val: 'Posterior, no retroplacental hematoma', unit: '-', ref: 'Normal attachment' }
        ]
      }
    };

    CASES_DB.case_peds_dehydration.expectedWorkupIds = ['w_pulses_crt', 'w_glucometer', 'w_cbc_chem', 'w_urinalysis'];
    CASES_DB.case_peds_dehydration.workupOverrides = {
      w_pulses_crt: {
        resultTitle: 'بطاقة الفحص السريري للطفل (الأغشية المخاطية، الجلد، وامتلاء الشعيرات)',
        resultText: 'اقرأ الموجودات السريرية الخام أدناه وحدد درجة الجفاف بنفسك.',
        labRows: [
          { param: 'Oral Mucous Membranes (الأغشية المخاطية)', val: 'Dry (جافة)', unit: '-', ref: 'Moist' },
          { param: 'Skin Pinch / Turgor Recoil (ثنية الجلد)', val: 'Slow recoil (~2 sec)', unit: 'sec', ref: 'Instant recoil (< 1 sec)' },
          { param: 'Capillary Refill Time (CRT)', val: '2.6', unit: 'sec', ref: '< 2.0 sec' },
          { param: 'Radial Pulse Quality', val: 'Rapid (132 bpm), regular', unit: 'bpm', ref: '80 - 115 bpm (Age 4y)' }
        ]
      },
      w_glucometer: {
        resultTitle: 'ورقة قياس بجانب السرير: سكر الدم الشعري للطفل (Glucometer)',
        resultText: 'قارن القراءة الرقمية بالمجال المرجعي للأطفال.',
        labRows: [
          { param: 'Capillary Blood Glucose', val: '74', unit: 'mg/dL', ref: '70 - 130 mg/dL' }
        ]
      },
      w_cbc_chem: {
        resultTitle: 'مختبر الأطفال: الأملاح ووظائف الكلى وتعداد الدم (Pediatric Chem & CBC)',
        resultText: 'حلل أرقام الصوديوم والبوتاسيوم والبيكربونات واليوريا/الكرياتينين بنفسك.',
        labRows: [
          { param: 'Sodium (Na+)', val: '137', unit: 'mEq/L', ref: '135 - 145' },
          { param: 'Potassium (K+)', val: '3.4', unit: 'mEq/L', ref: '3.5 - 5.1' },
          { param: 'Bicarbonate (HCO3-)', val: '17.5', unit: 'mEq/L', ref: '20.0 - 26.0' },
          { param: 'BUN (نيتروجين اليوريا)', val: '29', unit: 'mg/dL', ref: '5 - 18' },
          { param: 'Serum Creatinine', val: '0.58', unit: 'mg/dL', ref: '0.30 - 0.50 (Pediatric)' }
        ]
      },
      w_urinalysis: {
        resultTitle: 'مختبر المستشفى: فحص البول العام للطفل (Pediatric Urinalysis)',
        resultText: 'اقرأ الكثافة النوعية للبول والكيتونات واستنتج دلالتها السريرية.',
        labRows: [
          { param: 'Color / Appearance', val: 'Dark Amber / Clear', unit: '-', ref: 'Pale Yellow' },
          { param: 'Specific Gravity (الكثافة النوعية)', val: '1.031', unit: '-', ref: '1.005 - 1.022' },
          { param: 'Urine Ketones (الكيتونات)', val: '+2 (Moderate)', unit: '-', ref: 'Negative' },
          { param: 'Urine Glucose / Protein', val: 'Negative / Trace', unit: '-', ref: 'Negative' },
          { param: 'WBC / Nitrite', val: '1-2 / Negative', unit: '/HPF', ref: '0-5 / Negative' }
        ]
      }
    };

