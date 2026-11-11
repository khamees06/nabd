    function evaluateScientificJustification(justText) {
      const t = (justText || '').trim();
      if (t.length < 10) return false;
      if (/^(هيك|بس هيك|للتجربة|تجربة|احتياط|فقط|ما بعرف|لا أعلم|عشوائي)$/.test(t)) return false;
      const scientificKeywords = /(تفريقي|تشخيص|استبعاد|تأكيد|تمييز|أعراض|مضاعفات|إقفار|احتشاء|خثرة|انصمام|التهاب|عدوى|إنتان|كلى|كرياتينين|جفاف|شوارد|أملاح|حموضة|حماض|أكسجة|تهوية|نزيف|فقر دم|حمل|تروية|عصبي|وعائي|قلب|رئة|سوائل|ضغط|سكري|كيتون)/;
      return scientificKeywords.test(t) || t.split(/\s+/).length >= 5;
    }

    function matchTypedQuestion(text) {
      const c = simState.caseData;
      if (!c) return null;
      const t = text.toLowerCase();
      for (const q of c.questions) {
        if (q.id.includes('allergy') && /(حساسي|بنسلين|صبغ|دواء يضرك|موانع|تتحسس|بتحسس)/.test(t)) return q;
        if (q.id.includes('preg') && /(حامل|حمل|دورة|شهرية|طمث|متزوجة)/.test(t)) return q;
        if ((q.id.includes('dm') || q.id.includes('htn') || q.id.includes('renal') || q.id.includes('iron')) && /(سكري|ضغط|كلى|قرحة|حديد|مزمن|أدوية|تتناول)/.test(t)) return q;
        if ((q.id.includes('pain') || q.id.includes('onset') || q.id.includes('neuro') || q.id.includes('urine') || q.id.includes('fetal') || q.id.includes('custom')) && /(ألم|وجع|مغص|متى|ضيق|تنميل|بول|دموع|حركة|شكو|أعراض)/.test(t)) return q;
      }
      return null;
    }

    function processChatTurn(nurseText, matchedQ) {
      const c = simState.caseData;
      const ts = getSessionTimestamp();
      hideInlinePatientBannerOnContinue();
      appendSimBubble('nurse', 'أنت', nurseText);

      // 1) Check if student is ordering/administering a medication or allergen in chat without asking about allergy first
      const medOrderRegex = /(إعطاء|اعطاء|أعطي|اعطي|نبدأ|حقن|وريدي|أصرف|اصرف).*(دواء|مضاد|بنسلين|سلفا|مسكن|أسبرين|اسبرين|بروفين|فولتارين|صبغة|أدوية)/;
      const directAllergenGive = /(إعطاء بنسلين|اعطاء بنسلين|إعطاء سلفا|اعطاء سلفا|إعطاء مسكن|اعطاء مسكن|إعطاء مضاد|اعطاء مضاد|إعطاء دواء|اعطاء دواء)/;
      if (!matchedQ && (medOrderRegex.test(nurseText) || directAllergenGive.test(nurseText))) {
        const hasAllergyQ = c.questions.some(q => q.id.includes('allergy'));
        const askedAllergy = Array.from(simState.askedIds).some(id => id.includes('allergy'));
        if (hasAllergyQ && !askedAllergy) {
          const vMsg = `خطأ سلامة دوائية وحساسية: طلبت إعطاء دواء/مادة (${nurseText}) للمريض (${c.patient.name}) دون سؤاله مسبقاً عن الحساسية الدوائية — تُحتسب هذه النقطة ضدك في التقييم ونقاط الضعف (-15 نقطة).`;
          if (!simState.safetyMistakes.includes(vMsg)) simState.safetyMistakes.push(vMsg);
          setTimeout(() => {
            appendSimBubble('system', '', `تنبيه سلامة دوائية (نقطة محتسبة ضدك): طلبت إعطاء دواء قبل أن تسأل المريض عن الحساسية الدوائية. سُجّلت ضمن نقاط الضعف.`);
            appendSimBubble('patient', c.patient.name, 'لحظة من فضلك! أنا عندي حساسية شديدة وأنت لم تسألني عن الحساسية قبل إعطائي الدواء!');
          }, 150);
          return;
        } else {
          const vMsg = `خطأ سلامة دوائية: طلبت إعطاء دواء يتعارض مع حساسية المريض أو موانع الاستعمال المسجلة — تُحتسب هذه النقطة ضدك (-15 نقطة).`;
          if (!simState.safetyMistakes.includes(vMsg)) simState.safetyMistakes.push(vMsg);
          setTimeout(() => {
            appendSimBubble('system', '', `تنبيه سلامة دوائية (نقطة محتسبة ضدك): هذا الدواء يتعارض مع الحساسية أو موانع الاستعمال المسجلة في ملف المريض. احتُسبت النقطة ضدك.`);
          }, 150);
          return;
        }
      }

      // 2) Check if student is replying in chat to justify the most recent unrelated/distant workup
      const pendingExtra = simState.requestedWorkups.find(r => !r.isExpected && !r.isViolation && !r.justificationEvaluated);
      if (!matchedQ && pendingExtra && ! nurseText.includes('؟')) {
        pendingExtra.studentJustification = nurseText;
        pendingExtra.justificationEvaluated = true;
        const isScientific = evaluateScientificJustification(nurseText);
        pendingExtra.isScientificallyJustified = isScientific;
        setTimeout(() => {
          if (isScientific) {
            appendSimBubble('system', '', `تقييم التبرير السريري لطلب (${pendingExtra.title}): قرارك مبرر علمياً ومستند إلى أسس تشخيصية تفريقية سليمة من وجهة نظرك السريرية — تم قبول تبريرك واحتساب العلامة لصالحك (+5 نقاط تميز سريري).`);
          } else {
            appendSimBubble('system', '', `تقييم التبرير السريري لطلب (${pendingExtra.title}): التبرير المقدم غير مدقق علمياً ولا يستند إلى استطباب سريري مرتبط بالحالة — تم احتساب هذه النقطة ضدك ضمن نقاط الضعف كطلب فحص خارج التشخيص (-5 نقاط).`);
          }
        }, 150);
        return;
      }

      let reply = 'أشعر بالتعب وأرجو استكمال تقييم حالتي الطبية.';
      let nextEmo = simState.emotion;

      if (matchedQ) {
        reply = matchedQ.reply;
        nextEmo = matchedQ.emotion;
        if (!simState.askedIds.has(matchedQ.id)) {
          simState.askedIds.add(matchedQ.id);
          simState.askedQuestionsLog.push({
            id: matchedQ.id,
            label: matchedQ.label,
            prompt: nurseText,
            timestamp: ts,
            reason: matchedQ.reason
          });
        }
      }

      simState.emotion = nextEmo;
      renderSimAvatar();
      updateSimEvidenceCounter();
      updateBeginnerStepsBar();
      renderSuggestedQuestions();

      setTimeout(() => {
        appendSimBubble('patient', c.patient.name, reply);
        const ttsEl = document.getElementById('sim-tts-toggle');
        if (ttsEl && ttsEl.checked && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(reply);
            u.lang = 'ar-JO';
            window.speechSynthesis.speak(u);
          } catch (e) {}
        }
      }, 150);
    }

