    /* ===== Experimental coach API bridge (optional, off by default) ===== */
    const NB_COACH_API_KEY = 'nabd_coach_api_v1';
    function nbCoachApiCfg() { return safeStorageGet(NB_COACH_API_KEY, { url: '', on: false }); }
    function nbCoachApiSecret() { try { return sessionStorage.getItem('nabd_coach_key') || ''; } catch (e) { return ''; } }
    function nbCoachApiInit() {
      const c = nbCoachApiCfg(); const $ = id => document.getElementById(id); if (!$('coach-api-url')) return;
      $('coach-api-url').value = c.url || ''; $('coach-api-on').checked = !!c.on; $('coach-api-key').value = nbCoachApiSecret();
      const st = () => { const x = nbCoachApiCfg(); $('coach-api-state').textContent = x.on && x.url ? 'مفعّل' : 'متوقف'; $('coach-api-state').className = x.on && x.url ? 'on' : ''; };
      st();
      $('coach-api-save').addEventListener('click', () => {
        const url = $('coach-api-url').value.trim();
        if (url && !/^https:\/\//i.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)/i.test(url)) { showToast('العنوان يجب أن يبدأ بـ https://'); return; }
        safeStorageSet(NB_COACH_API_KEY, { url, on: $('coach-api-on').checked });
        try { sessionStorage.setItem('nabd_coach_key', $('coach-api-key').value.trim()); } catch (e) {}
        st(); showToast('تم حفظ إعدادات الربط التجريبي.');
      });
    }
    async function nbCoachAsk(txt, mod) {
      const c = nbCoachApiCfg(); if (!c.on || !c.url) return null;
      const u = authState.user || {}; const track = nbTrackOf(u) || 'nursing';
      const system = 'أنت مدرب سريري لطلبة ' + (track === 'nursing' ? 'التمريض: الممرض لا يشخّص، يجمع البيانات ويبلّغ وينفّذ أوامر الطبيب بأمان' : 'الطب: التشخيص التفريقي وتبرير الفحوصات') + '. صحّح إجابة الطالب بإيجاز بالعربية مع مصطلحات إنجليزية بين قوسين. استند فقط لمعايير معروفة (NEWS2, SBAR, ISBAR…) واذكرها. إن لم تكن متأكداً فقل ذلك ولا تخترع. لا تعطِ جرعات دوائية.';
      const body = { system, track, module: mod.title, answer: txt, weaknesses: (u.weaknesses || []).slice(0, 3) };
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 15000);
      try {
        const h = { 'Content-Type': 'application/json' }; const k = nbCoachApiSecret(); if (k) h['Authorization'] = 'Bearer ' + k;
        const r = await fetch(c.url, { method: 'POST', headers: h, body: JSON.stringify(body), signal: ctl.signal });
        if (!r.ok) throw new Error('http ' + r.status);
        const j = await r.json();
        const out = j.reply || j.text || (j.content && j.content[0] && j.content[0].text) || '';
        return String(out).slice(0, 2000) || null;
      } catch (e) { return null; } finally { clearTimeout(to); }
    }

