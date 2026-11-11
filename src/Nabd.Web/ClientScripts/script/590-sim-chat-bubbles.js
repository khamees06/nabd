    function appendSimBubble(role, sender, text) {
      const chatBox = document.getElementById('sim-chat-messages');
      if (!chatBox) return;
      const wrap = document.createElement('div');
      const ts = getSessionTimestamp();

      if (role === 'system') {
        wrap.className = 'text-center my-1.5';
        const badge = document.createElement('span');
        badge.className = 'inline-block bg-teal-50 border border-teal-200/80 text-teal-900 text-xs px-3.5 py-1.5 rounded-xl font-medium';
        badge.textContent = nbBidi(text);
        wrap.appendChild(badge);
      } else {
        const isNurse = role === 'nurse';
        wrap.className = `flex flex-col ${isNurse ? 'items-start' : 'items-end'}`;

        const meta = document.createElement('span');
        meta.className = 'text-xs text-slate-400 mb-1 px-1 font-num';
        meta.textContent = `${sender} · ${ts}`;

        const bubble = document.createElement('div');
        bubble.className = `max-w-[85%] sm:max-w-[78%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
          isNurse
            ? 'bg-teal-700 text-white rounded-tr-none shadow-2xs'
            : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-2xs'
        }`;
        bubble.textContent = nbBidi(text);

        wrap.appendChild(meta);
        wrap.appendChild(bubble);
      }

      chatBox.appendChild(wrap);
      chatBox.scrollTop = chatBox.scrollHeight;
    }

