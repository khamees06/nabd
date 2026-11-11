  const AR = '\\u0621-\\u064A\\u0671-\\u06D3';
  const byLength = TERMS.slice().sort((a, b) => b[0].length - a[0].length);
  const lookup = new Map(byLength);
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Whole words only: no Arabic letter right before or after the term.
  const RE = new RegExp('(^|[^' + AR + '])(' + byLength.map(t => escape(t[0])).join('|') + ')(?![' + AR + '])', 'g');
  const HAS_AR = /[ء-ي]/;

  // Patient speech and the student's own words are never rewritten.
  const SKIP = [
    '#sim-chat-messages > .flex-col', '.nb-b.patient', '.nb-b.nurse', '.coach-message.is-student',
    // respiratory room: the patient's replies, the student's questions and the question list
    '.rs-msg.pt', '.rs-msg.me', '.rs-chips', '#rs-qlist', '.rs-missed',
    // emergency room: the chat converts its own lines (er.js); the trainee's box is never rewritten; the monitor
    // (.er-mon, its labels and its range notes) stays exactly as it was: the owner's rule is that it does not change
    '.er-msg', '#er-input', '.er-mon',
    'script', 'style', 'textarea', 'noscript', '[data-no-terms]'
  ].join(',');

  const ROOM_KEEP = new Set(['القسطرة', 'قسطرة']);
  const done = new WeakMap(); // text node -> { orig, out }

  function translate(node) {
    const text = node.data;
    if (!text || !HAS_AR.test(text)) return;
    const rec = done.get(node);
    if (rec && rec.out === text) return;
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP)) return;
    const glosses = [];
    // 2026-11-08: inside the ER room (its briefing, sheets and report; the chat does this itself) the ward's English
    // terms come first, from the same list the chat uses (er.js chatEn), then this list.
    const room = parent.closest('#view-er') && window.__nbER && window.__nbER.chatEn;
    const src = room ? window.__nbER.chatEn(text) : text;
    RE.lastIndex = 0;
    const out = src.replace(RE, (m, pre, term, at, whole) => {
      // «القسطرة» in the room is a Foley or the cath lab; the room's own list decides, so it is not «Catheter» here.
      if (room && ROOM_KEEP.has(term)) return m;
      // An assignment's «التسليم» is its submission date («موعد التسليم»، «التسليم: 12/11»), not a handover.
      if (term === 'التسليم' && (/(?:موعد|تاريخ|وقت)\s*$/.test(whole.slice(0, at + pre.length)) || /^\s*:/.test(whole.slice(at + m.length)))) return m;
      const en = lookup.get(term);
      glosses.push(en.replace(/^الـ /, '') + ' — ' + term);
      // In the room the article joins the English word, as the chat writes it («الـHandover»).
      return pre + (room ? en.replace(/^الـ /, 'الـ') : en);
    });
    if (out === text) return;
    done.set(node, { orig: text, out });
    node.data = out;
    if (!('termsTitle' in parent.dataset)) parent.dataset.termsTitle = parent.getAttribute('title') || '';
    parent.title = [...new Set(glosses)].join('\n');
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { translate(root); return; }
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = it.nextNode(); n; n = it.nextNode()) nodes.push(n);
    nodes.forEach(translate);
  }

