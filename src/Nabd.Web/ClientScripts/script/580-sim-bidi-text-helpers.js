    // Isolate Latin parentheticals and readings so they keep their order inside Arabic text.
    function nbBidi(s) { return String(s == null ? '' : s).replace(/((?:[A-Za-z0-9][\w.\-\/&+]*\s+)*\([^()\u0600-\u06FF]*[A-Za-z][^()\u0600-\u06FF]*\)|\d+(?:\.\d+)?\s?°C|\d+(?:[.\/]\d+)*\s?(?:mm\/mV|mm\/s|mmHg|mmol\/L|mg\/dL|ng\/mL|g\/dL|bpm|ms|MHz|mm)\b|[A-Za-z][A-Za-z0-9 .:\/%+\-]*[A-Za-z0-9%])/g, m => '\u2066' + nbGlue(m) + '\u2069'); }
    // keep an English term or a reading on one line: no break after an inner hyphen,
    // short runs never split, and in long runs a number stays with its unit and label
    function nbGlue(m) {
      const short = m.length <= 24;
      m = m.replace(/([A-Za-z0-9])-(?=[A-Za-z0-9])/g, '$1-\u2060');
      if (short) return m.replace(/ /g, '\u00A0').replace(/([-\u2010-\u2015])\u00A0/g, '$1\u2060\u00A0');
      return m.replace(/(\d) (?=[A-Za-z%°])/g, '$1\u00A0').replace(/: (?=\d)/g, ':\u00A0').replace(/ ([-\u2010-\u2015]) /g, '\u00A0$1\u2060\u00A0');
    }
    // copied text drops the invisible marks nbBidi adds, so 'X-Ray' pastes as typed
    document.addEventListener('copy', e => {
      const s = String(window.getSelection() || '');
      if (!e.clipboardData || !/[\u2060\u2066-\u2069\u00A0]/.test(s)) return;
      e.clipboardData.setData('text/plain', s.replace(/[\u2060\u2066-\u2069]/g, '').replace(/\u00A0/g, ' '));
      e.preventDefault();
    });
