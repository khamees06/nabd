  // A short Arabic word also stands with a one-letter prefix (وسكر, بسكر), a short Latin one only whole.
  const hasAny = (t, kw) => kw.some(k => {
    const n = norm(k);
    if (!n) return false;
    const p = ' ' + t + ' ';
    if (n.length >= 4) return p.includes(n);
    return (/^[ء-ي]/.test(n) ? [n, 'و' + n, 'ف' + n, 'ب' + n, 'ل' + n] : [n]).some(f => p.includes(' ' + f + ' '));
  });
  // A free-standing number, so the 2 in O2 is not a dose, nor the 85 in "ضغطه 85/50".
  const digits = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g, '.').replace(/(\d)[,،](\d{1,2})(?!\d)/g, '$1.$2').replace(/(\d),(?=\d{3}(?!\d))/g, '$1').replace(/\d+\s*:\s*\d+/g, ' ').replace(/(^|[^\d.])1\s*\/\s*10+(?!\d)/g, '$1 ');
  const DOSE = /(^|[^A-Za-z\d./])(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?(?:\s*(mmol|meq|مليمول|ملي مول|ملي مكافئ|mcg|ug|µg|micrograms?|ميكرو[^\s/]*|mgs?|milligrams?|ملغم?|مغ|مج|ملجم|مليغرام|ملي ?غرام|ملي ?جرام|grams?|gm?|gr|غرام|جرام|غم|جم|غ|ml|cc|مل|ملي|سي سي|lpm|lit(?:er|re)s?|l|لتر|ليتر|لترات|iu|units?|u|وحد[هة]|وحدات|miu|mu|million|مليون|mmol|meq|مليمول|ملي مول|ملي مكافئ)(?![A-Za-z\u0621-\u064A]))?/gi;
  const UNITS = [[/^(mcg|ug|µg|microgram|ميكرو)/i, 'mass', 0.001], [/^(mgs?$|milligram|ملغ|مغ|مج|ملجم|مليغرام|ملي ?غرام|ملي ?جرام)/i, 'mass', 1], [/^(gram|gm?$|gr$|غرام|جرام|غم|جم|غ$)/i, 'mass', 1000],
    [/^(ml|cc|مل$|ملي$|سي سي)/i, 'vol', 1], [/^(lpm|lit|l$|لتر|ليتر)/i, 'vol', 1000], [/^(miu$|mu$|million|مليون)/i, 'unit', 1000000], [/^(iu|unit|u$|وحد)/i, 'unit', 1], [/^(mmol|meq|مليمول|ملي مول|ملي مكافئ)/i, 'mmol', 1]];
  const SCALE = { mcg: ['mass', 0.001], mg: ['mass', 1], g: ['mass', 1000], mL: ['vol', 1], L: ['vol', 1000], u: ['unit', 1], mmol: ['mmol', 1], rate: ['rate', 1], 'u/h': ['urate', 1], 'mcg/min': ['mrate', 1], 'mmol/h': ['krate', 1] };
  // (chat fix 2 2026-11-08) «لسا 91؟», «صار 88؟»: a number asked about is a reading.
  const NOT_DOSE_AFTER = /^\s*(?:%|[؟?]|\/\s*\d|دقيق|دقايق|ساع|سنه|سنة|سنين|يوم|ايام|lead|ليد|mins?(?![a-z])|hours?|hrs?(?![a-z])|years?|kg(?![a-z])|كيلو|كغ|مره|مرة|مرات|times?)/i;
  const NOT_DOSE_BEFORE = /(?:عمر\S*|ضغط\S*|لسا|لسه|صار|صارت|نزل|نزلت|(?:كم|قديش) من|نبض\S*|حرار\S*|سكر\S*|spo2|o2|sats?|hr|bp|rr|كل|every|q|target|هدف|الهدف|gcs|سرير|fio2)\s*(?:هو|هي|صار|كان|تقريبا)?\s*$/i;
  const COUNT = /^\s*(?:tabs?|tablets?|حب[هةا]\S*|amps?|امبول\S*|vials?|فيال\S*|puffs?|بخ\S*|ابر\S*|كيس|اكياس|bags?|[x×]\s*\d)/i;
  const PER_KG = /^\s*(?:\/\s*(?:kg|ك|كيلو)|لكل\s*(?:كيلو|كغ)|للكيلو|لكل\s*كجم|بالكيلو|per\s*kg|على\s*الكيلو|ع\s*الكيلو)/i;
  const PER_TIME = /(?:\/\s*(?:(?:kg|كغ|كيلو)\s*\/\s*)?(?:min|h|hr|hour|دقيق|ساع)|per\s*(?:kg\s*per\s*)?(?:min|hour|h(?![a-z]))|بالدقيق|لكل\s*دقيق|(?:في|ب)\s*ال?دقيق|بالساع|(?:في|ب)\s*ال?ساع|لكل\s*ساع)/i;
  const PER_HOUR = /(?:\/\s*(?:(?:kg|كغ|كيلو)\s*\/\s*)?(?:h|hr|hour|ساع)|per\s*(?:kg\s*per\s*)?(?:hour|h(?![a-z]))|بالساع|(?:في|ب)\s*ال?ساع|لكل\s*ساع)/i;
  // { raw, lo, hi, kind, by, perKg, perTime, unsure }. unsure = a dose the numbers cannot judge, such as "2 tabs".
  function doseOf(text) {
    const t = digits(text);
    let best = null;
    for (const m of t.matchAll(DOSE)) {
      const at = m.index + m[1].length, after = t.slice(m.index + m[0].length), before = t.slice(0, at);
      if (!m[4] && (NOT_DOSE_AFTER.test(after) || NOT_DOSE_BEFORE.test(before))) continue;
      if (m[4] && /^\s*\/\s*\d/.test(after)) continue;
      if (/^\s*%/.test(after)) continue;
      const u = m[4] ? UNITS.find(([re]) => re.test(m[4])) : null;
      const unsure = COUNT.test(after) || (u && u[1] === 'mass' && /^\s*(?:in|على|ع|ب|في)\s*\d+\s*(?:ml|cc|مل|سي)/i.test(after));
      const one = { raw: (m[0].slice(m[1].length).trim() + (unsure ? ' ' + after.trim().split(/\s+/).slice(0, 3).join(' ') : '')).trim(), lo: +m[2], hi: +(m[3] || m[2]), kind: u ? u[1] : null, by: u ? u[2] : 1, perKg: PER_KG.test(after), perTime: (!u || u[1] !== 'vol') && PER_TIME.test(after.slice(0, 30)), hour: PER_HOUR.test(after.slice(0, 30)), unsure };
      if (unsure) return one;
      if (u) return one;
      best = best || one;
    }
    return best;
  }
  const doseIn = text => { const d = doseOf(text); return d ? d.raw + (d.perKg ? '/kg' : '') + (d.perTime ? (d.hour ? '/h' : '/min') : '') : ''; };
  // 'ok', 'wrong', or null when the numbers alone cannot tell: then only the reader can object.
  function doseCheck(a, def, text) {
    const limits = def.limits || (actOf(a.id) || {}).limits;
    const d = limits && doseOf(a.dose || text);
    if (!d || d.unsure) return null;
    const name = norm([a.agent, a.said, a.dose, text].filter(Boolean).join(' '));
    const named = limits.filter(l => l.kw && hasAny(name, l.kw));
    const open = limits.filter(l => !l.kw);
    // A drug no limit knows is the reader's to judge.
    if (!named.length && !open.length && a.agent) return null;
    const pool = named.length ? named : open.length ? open : limits;
    const kg = E.c.kg;
    if (d.perTime) {
      // Insulin runs in units an hour; nitrates in micrograms a minute; pressors per kilo per minute.
      if (d.kind === 'unit') {
        const L = pool.filter(l => l.unit === 'u/h');
        if (!L.length || (d.perKg && !kg)) return null;
        const f = (d.hour ? 1 : 60) * (d.perKg ? kg : 1);
        return L.some(l => d.lo * f >= l.lo && d.hi * f <= l.hi) ? 'ok' : 'wrong';
      }
      if (d.kind === 'mmol') {
        const L = pool.filter(l => l.unit === 'mmol/h');
        if (!L.length) return null;
        const f = d.hour ? 1 : 60;
        return L.some(l => d.lo * f >= l.lo && d.hi * f <= l.hi) ? 'ok' : 'wrong';
      }
      if (d.kind === 'mass' && !d.perKg) {
        const L = pool.filter(l => l.unit === 'mcg/min');
        if (!L.length) return null;
        const f = (d.by / 0.001) / (d.hour ? 60 : 1);
        return L.some(l => d.lo * f >= l.lo && d.hi * f <= l.hi) ? 'ok' : 'wrong';
      }
      const rate = pool.filter(l => l.unit === 'rate');
      if (!rate.length || !d.perKg) return null;
      const f = (d.by / 0.001) / (d.hour ? 60 : 1);
      return rate.some(l => d.lo * f >= l.lo && d.hi * f <= l.hi) ? 'ok' : 'wrong';
    }
    if (d.perKg && !kg) return null;
    const fits = l => {
      const [kind, by] = SCALE[l.unit];
      if (kind === 'urate' || kind === 'mrate' || kind === 'krate') return false;
      if (kind === 'rate') return !d.kind && d.lo >= l.lo && d.hi <= l.hi;
      const k = d.perKg ? kg : 1;
      const tries = d.kind ? [d.by] : kind === 'unit' ? [by] : [by, 1, 1000];
      return tries.some(sc => {
        let lo = d.lo * sc * k, hi = d.hi * sc * k;
        // "0.01 mg/kg" is the textbook form of a dose with a ceiling, whatever the weight gives.
        if (l.cap && d.perKg && d.hi * sc <= l.cap * by) { lo = Math.min(lo, l.hi * by); hi = Math.min(hi, l.hi * by); }
        return lo >= l.lo * by && hi <= l.hi * by;
      });
    };
    const same = d.kind ? pool.filter(l => SCALE[l.unit][0] === d.kind) : pool;
    if (!same.length) return a.id === 'oxygen' ? 'wrong' : null;
    return same.some(fits) ? 'ok' : 'wrong';
  }
  // Base units of one dose, for the running total.
  function amountOf(a, def, text) {
    const limits = def.limits || (actOf(a.id) || {}).limits;
    const d = limits && doseOf(a.dose || text);
    if (!d || d.unsure || d.perTime) return 0;
    const k = d.perKg ? E.c.kg || 0 : 1;
    return d.hi * (d.kind ? d.by : SCALE[limits[0].unit][1]) * k;
  }

  /* (chat fix 2 2026-11-08) Doctor room: a bare number answering her proposal takes the proposal's unit when that makes it
     a dose in range («GTN تسريب 10» is 10 mcg/min); otherwise it stays as typed and the usual check judges it. */
  const sugUnit = q => { const m = String((q && q.sug) || '').match(/^\s*[\d.]+(?:\s*[-–]\s*[\d.]+)?\s*(.*)$/); return m ? m[1].trim() : ''; };
  function doseFor(q, text) {
    const d = doseOf(text);
    if (!d) return '';
    const raw = doseIn(text);
    if (NM() || d.kind || d.unsure || !q || !q.sug || !q.a) return raw;
    const u = sugUnit(q);
    if (!u) return raw;
    const dz = (d.lo === d.hi ? d.lo : d.lo + '-' + d.hi) + ' ' + u;
    return doseCheck({ id: q.a.id, dose: dz, said: text }, E.c.care[q.a.id] || {}, dz) === 'ok' ? dz : raw;
  }
  const doseFits = (q, text) => { if (!q || !q.a) return false; const dz = doseFor(q, text); return !!dz && doseCheck({ id: q.a.id, dose: dz, said: text }, E.c.care[q.a.id] || {}, dz) === 'ok'; };

