  /* ---------- the stream ---------- */
  const LABEL = () => (NM() ? { p: E.c.patient.name, c: E.c.companion.name, n: 'د. ' + E.nurse.doc, d: 'المشرفة ' + E.c.nurse.name, me: 'أنت' } : { p: E.c.patient.name, c: E.c.companion.name, n: 'الممرضة ' + E.c.nurse.name, d: 'المشرف', me: 'أنت' });
  // Latin runs keep their own order inside Arabic: "12-lead ECG", "5 mg".
  const bidi = s => String(s == null ? '' : s).split(/([A-Za-z0-9](?:[A-Za-z0-9 .,\-/%+]|\([A-Za-z0-9 .,\-/%+]*\))*(?<![ .,\-/+])|[A-Za-z0-9])/).map((x, i) => (i % 2 ? `<bdi dir="ltr">${esc(x)}</bdi>` : esc(x))).join('');
  function say(who, text, extra) {
    const feed = $('er-feed');
    // A result being read stays put; a new line only follows if the reader was already at the end.
    const atEnd = who === 'me' || who === 'lab' || feed.scrollHeight - feed.scrollTop - feed.clientHeight < 90;
    const d = document.createElement('div');
    d.className = 'er-msg k-' + who;
    const label = LABEL()[who];
    d.innerHTML = (label ? `<span class="er-who">${esc(label)}</span>` : '') + (text ? `<p>${bidi(shown(who, text))}</p>` : '') + (extra || '');
    feed.appendChild(d);
    if (atEnd) feed.scrollTop = who === 'lab' && d.offsetTop ? d.offsetTop - 8 : feed.scrollHeight;
    document.querySelectorAll('.er-p').forEach(p => p.classList.toggle('is-on', p.dataset.who === who));
    return d;
  }
  function person(who, text) {
    if (!E || E.over || !text) return;
    // Nurse mode: nobody in the room calls the nurse «دكتور». A line that was only the address is skipped.
    if (NM() && (who === 'p' || who === 'c' || who === 'd')) { const s = forNurse(text); if (s !== String(text).trim() && !/[\p{L}\p{N}]/u.test(s)) return; text = s; }
    // (chat fix 2026-11-08) Doctor room: what the nurse says in one breath of a turn is one bubble.
    if (!NM() && who === 'n' && E.merging && E.lastN && E.lastN.turn === E.turns) {
      const f = $('er-feed'), kids = f && f.children, lastEl = kids && kids[kids.length - 1];
      if (lastEl && lastEl === E.lastN.el) {
        // One «حاضر» per bubble.
        if (/^حاضر/.test(E.lastN.text) && /^حاضر[،.]?\s*/.test(text)) text = text.replace(/^حاضر[،.]?\s*/, '');
        if (!text) return;
        E.lastN.text += ' ' + text;
        lastEl.innerHTML = `<span class="er-who">${esc(LABEL().n)}</span><p>${bidi(shown('n', E.lastN.text))}</p>`;
        const lastChat = E.chat[E.chat.length - 1];
        if (lastChat && lastChat.r === 'n') lastChat.t = E.lastN.text;
        return;
      }
    }
    const el = say(who, text);
    if (!NM() && who === 'n') E.lastN = { el, text: String(text), turn: E.turns };
    if (who === 'd') { E.dTurn = E.turns; E.dAt = E.sim; }
    E.chat.push({ r: who === 'me' ? 's' : who === 'p' ? 'p' : who === 'c' ? 'c' : who === 'n' ? 'n' : 'd', t: text });
    E.utt++;
  }
  // The ER nurse's line in the doctor room. In nurse mode the trainee is the nurse, so her line is either
  // dropped (alt undefined), said as a plain room note (alt string), or said by the instructor (alt {d}).
  function nurse(text, alt) { if (NM()) return nurseAlt(alt); person('n', text); }
  function nurseAlt(alt) { if (alt === undefined || alt === null) return; if (typeof alt === 'string') sys(alt); else if (alt.d) person('d', alt.d); }
  // Nurse mode: the only way the doctor (n) speaks. Fixed lines only, never model-written.
  const docSay = t => person('n', t);
  const sys = text => say('sys', text);
  function alert(text) { say('alarm', text); }
  const log = (type, text) => E.log.push({ at: E.sim, type, text });

  function typing(who) {
    const d = document.createElement('div');
    d.className = 'er-msg k-' + (who || 'p') + ' er-dots';
    d.innerHTML = '<span></span><span></span><span></span>';
    $('er-feed').appendChild(d);
    $('er-feed').scrollTop = $('er-feed').scrollHeight;
    return d;
  }

