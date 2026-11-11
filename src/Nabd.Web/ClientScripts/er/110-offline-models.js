  /* ---------- reading the student without the server ---------- */
  /* ---------- the act model: short replies when the server cannot be reached ---------- */
  let ACT = null, actRetried = false;
  // nabd-model/lang/train_act.py trains this; the same text steps run here, or the weights mean nothing.
  const actText = s => norm(s).replace(/(.)\1{2,}/g, '$1$1').replace(/\s+/g, ' ').trim();
  const actGrams = (raw, N = ACT) => {
    const text = actText(raw), words = text.split(' ').filter(Boolean);
    const out = ['#w' + Math.min(words.length, 6)];
    if (/[؟?]/.test(raw)) out.push('#q');
    if (/[0-9٠-٩]/.test(raw)) out.push('#d');
    if (/[a-zA-Z]/.test(raw)) out.push('#l');
    for (const w of words) {
      out.push('~' + w);
      const p = ' ' + w + ' ';
      for (let n = N.n[0]; n <= N.n[1]; n++) for (let i = 0; i <= Math.max(p.length - n, 0); i++) out.push(p.slice(i, i + n));
    }
    return out;
  };
  function readAct(raw) {
    if (!ACT) return null;
    if (/^[\d٠-٩][\d٠-٩./\s%\-]*$/.test(raw.trim())) return 'number';
    const count = new Map();
    for (const g of actGrams(raw)) { const i = ACT.index.get(g); if (i !== undefined) count.set(i, (count.get(i) || 0) + 1); }
    const vec = [...count].map(([i, n]) => [i, (1 + Math.log(n)) * ACT.idf[i]]);
    const z = Math.sqrt(vec.reduce((s, [, v]) => s + v * v, 0)) || 1;
    const score = ACT.bias.slice();
    for (const [i, v] of vec) ACT.w[i].forEach((x, k) => { score[k] += x * v / z; });
    return ACT.acts[score.indexOf(Math.max(...score))];
  }
  // The second small model: a history question read into a finding of the Nabd dictionary, for when the server is out of reach.
  let FIND = null, findWanted = false;
  function loadFind() {
    if (FIND || findWanted) return;
    findWanted = true;
    fetch('data/er-find.json', { signal: timeout(8000) }).then(r => r.json()).then(m => { FIND = { ...m, index: new Map(m.grams.map((g, i) => [g, i])) }; }).catch(e => { findWanted = false; console.warn('er-find', e); });
  }
  function readFinding(raw) {
    if (!FIND) return null;
    const count = new Map();
    for (const g of actGrams(raw, FIND)) { const i = FIND.index.get(g); if (i !== undefined) count.set(i, (count.get(i) || 0) + 1); }
    const vec = [...count].map(([i, n]) => [i, (1 + Math.log(n)) * FIND.idf[i]]);
    const z = Math.sqrt(vec.reduce((s, [, v]) => s + v * v, 0)) || 1;
    const score = FIND.bias.slice();
    for (const [i, v] of vec) { const w = FIND.w[i]; for (let k = 0; k < w.length; k += 2) score[w[k]] += (w[k + 1] / FIND.scale) * v / z; }
    const top = Math.max(...score), sum = score.reduce((s, x) => s + Math.exp(x - top), 0), best = score.indexOf(top);
    const id = FIND.classes[best];
    return 1 / sum >= FIND.tau && id !== 'none' ? id : null;
  }

  function socialReply(act, text) {
    const t = norm(text);
    if (act === 'wish') return 'الله يسلمك...';
    if (act === 'thanks') return t.includes('يعطيك') ? 'الله يعافيك...' : 'عفوا...';
    return t.includes('سلام') ? 'وعليكم السلام...' : t.includes('صباح') ? 'صباح النور...' : 'أهلين...';
  }

