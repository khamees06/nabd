  /* ---------- understanding the question ---------- */
  const norm = s => String(s).replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[؟?!.,،:؛()"'«»\-_/]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const STOP = new Set(['هل', 'لديك', 'عندك', 'تشعر', 'تعاني', 'من', 'في', 'او', 'ما', 'هو', 'هي', 'كان', 'اي', 'عن', 'علي', 'الي', 'مع', 'بعد', 'قبل', 'لك', 'انت', 'حاليا', 'مؤخرا', 'شي', 'شيء', 'اذا', 'يوجد', 'لا', 'نعم', 'اخر', 'الاخيره', 'الماضي', 'ايام', 'بشكل', 'عندكم', 'شو', 'ايش', 'في', 'كيف',
    // Jordanian fillers and pronouns ("عليك حرارة؟", "فيك وجع؟")
    'عليك', 'فيك', 'معك', 'الك', 'بتحس', 'حاسس', 'هلق', 'هسا', 'هسه', 'بدي', 'شوي', 'يعني', 'طيب', 'اخوي', 'عمي', 'خالتي', 'حجي', 'حجه']);
  // Arabic words change shape with clitics and patterns (تدخن، بتدخن، تدخين، دخان), so each word is
  // compared through a few stripped forms and a skeleton without its inner long vowels.
  const PRE = ['وال', 'بال', 'فال', 'لل', 'ال', 'بت', 'بي', 'بن', 'و', 'ف', 'ب', 'ل', 'ت', 'ي', 'ن', 'ا'];
  const SUF = ['تها', 'تين', 'تك', 'تي', 'ته', 'ات', 'ين', 'ون', 'ها', 'كم', 'نا', 'ك', 'ه', 'ي', 'ا'];
  function forms(w) {
    const out = new Set([w]);
    if (STOP.has(w)) return out; // small words compare whole: "لديك" must not shrink to "ديك"
    const add = s => { if (s.length >= 3) out.add(s); };
    PRE.forEach(p => { if (w.startsWith(p)) add(w.slice(p.length)); });
    [...out].forEach(s => SUF.forEach(x => { if (s.endsWith(x)) add(s.slice(0, -x.length)); }));
    [...out].forEach(s => add(s[0] + s.slice(1).replace(/[اوي]/g, '')));
    return out;
  }
  let cues = null;
  function buildCues() {
    const toks = (s, stop) => norm(s).split(' ').filter(w => w.length > 1 && !(stop && STOP.has(w))).map(w => ({ w, f: forms(w) }));
    cues = Object.entries(T.evidences).map(([id, t]) => ({
      id, g: M.encoder.ev_group[evIndex[id]],
      // A cue keeps its small words when it has several ("عندك حساسية"), so it beats a bare "حساسية".
      // alt: the table's own cues; kw: the Jordanian words collected for each question.
      alt: [...new Set([...(t.alt || []), ...(t.kw || [])])].map(a => { const all = toks(a, false); return { len: norm(a).length, toks: all.length > 1 ? all : toks(a, true) }; }).filter(a => a.toks.length),
      words: toks(t.q, true).filter(x => x.w.length > 2)
    }));
  }
  function matchLocal(text) {
    const words = norm(text).split(' ').filter(w => w.length > 1).map(w => ({ w, f: forms(w) }));
    // 1 when the student's word is the cue word or reduces to it; 0.6 when the two only share a
    // three-letter stem, which is weak: "لحميات" (polyps) shrinks to "حمي" (fever).
    const hit = tok => {
      let q = 0;
      for (const x of words) {
        if (x.w === tok.w || x.f.has(tok.w)) return 1;
        // Small words only match whole ("الديكي" shrinks to "لديك").
        if (tok.w.length > 2 && x.w.length > 2 && !STOP.has(x.w)) for (const f of tok.f) if (x.f.has(f)) q = Math.max(q, f.length > 3 ? 1 : 0.6);
      }
      return q;
    };
    const best = new Map();
    for (const c of cues) {
      // The most specific matching cue counts in full; more cues and question words only add a little,
      // so a generic word repeated across many cues ("وجع") cannot outweigh a precise phrase.
      let top = 0, more = 0, qw = 0;
      for (const a of c.alt) {
        let qa = 1;
        for (const t of a.toks) { qa = Math.min(qa, hit(t)); if (!qa) break; }
        if (!qa) continue;
        const w = (2 * a.toks.length + Math.max(a.len, 4) / 6) * qa;
        if (w > top) { if (top) more += 0.4; top = w; } else more += 0.4;
      }
      for (const w of c.words) qw += 0.6 * hit(w);
      const score = top + Math.min(more, 1.2) + Math.min(qw, 1.8);
      if (score > (best.get(c.g)?.score || 0)) best.set(c.g, { g: c.g, id: c.id, score });
    }
    return [...best.values()].filter(b => b.score >= 2.6).sort((a, b) => b.score - a.score);
  }
  const GREET = /^(مرحب|اهلا|هلا|السلام|سلام|صباح|مساء|هاي|كيفك|كيف حالك|كيف الحال|شلونك)/;

