    function appendWorkupChatCard(req) {
      const chatBox = document.getElementById('sim-chat-messages');
      if (!chatBox) return;
      hideInlinePatientBannerOnContinue();

      const card = document.createElement('div');
      card.className = `my-2 p-3.5 rounded-2xl border shadow-2xs space-y-2.5 max-w-[92%] mr-auto ${
        req.isViolation
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : 'bg-white border-teal-200/90 text-slate-800'
      }`;

      const header = document.createElement('div');
      header.className = 'flex items-center justify-between gap-2 border-b border-slate-100 pb-2 flex-wrap';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'text-xs sm:text-sm font-bold text-teal-900';
      titleSpan.textContent = nbBidi(req.resultTitle);
      const timeSpan = document.createElement('span');
      timeSpan.className = 'text-xs text-slate-400 font-num';
      timeSpan.textContent = `توقيت الطلب: ${req.timestamp}`;
      header.appendChild(titleSpan);
      header.appendChild(timeSpan);
      card.appendChild(header);

      const desc = document.createElement('p');
      desc.className = 'text-xs text-slate-600 leading-relaxed';
      desc.textContent = nbBidi(req.resultText);
      card.appendChild(desc);

      if (req.isImaging && req.imageKey && DIAG_IMAGES[req.imageKey]) {
        const imgData = DIAG_IMAGES[req.imageKey];
        const imgWrap = document.createElement('div');
        imgWrap.className = 'rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-2 text-center space-y-1.5';
        const imgEl = document.createElement('img');
        imgEl.src = imgData.url || imgData.fallback;
        imgEl.alt = req.resultTitle;
        imgEl.className = 'w-full max-h-[180px] object-contain rounded-xl cursor-zoom-in mx-auto block bg-slate-900';
        imgEl.addEventListener('click', () => openMedicalLightbox(imgEl.src, req.resultTitle, req));
        const cap = document.createElement('div');
        cap.className = 'text-xs text-teal-200 flex items-center justify-between px-2';
        cap.innerHTML = `<span>${nbBidi(imgData.caption || 'اضغط لتكبير الصورة وفحصها')}</span><button type="button" class="px-2.5 py-0.5 rounded bg-teal-700 text-white font-bold whitespace-nowrap shrink-0">تكبير الفحص</button>`;
        cap.querySelector('button').addEventListener('click', () => openMedicalLightbox(imgEl.src, req.resultTitle, req));
        imgWrap.appendChild(imgEl);
        imgWrap.appendChild(cap);
        card.appendChild(imgWrap);
      }

      if (req.labRows && req.labRows.length > 0) {
        const tblWrap = document.createElement('div');
        tblWrap.className = 'overflow-x-auto border border-slate-200 rounded-xl';
        const tbl = document.createElement('table');
        tbl.className = 'w-full text-right text-xs font-num';
        tbl.innerHTML = `
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
            <tr>
              <th class="px-3 py-1.5">المؤشر (Parameter)</th>
              <th class="px-3 py-1.5">النتيجة (Value)</th>
              <th class="px-3 py-1.5">الوحدة</th>
              <th class="px-3 py-1.5">المجال المرجعي</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${req.labRows.map(r => `
              <tr>
                <td class="px-3 py-1.5 font-semibold text-slate-800">${r.param}</td>
                <td dir="ltr" style="text-align:right" class="px-3 py-1.5 font-bold text-teal-800">${r.val}</td>
                <td dir="ltr" style="text-align:right" class="px-3 py-1.5 text-slate-500">${r.unit}</td>
                <td dir="ltr" style="text-align:right" class="px-3 py-1.5 text-slate-500">${r.ref}</td>
              </tr>
            `).join('')}
          </tbody>
        `;
        tblWrap.appendChild(tbl);
        card.appendChild(tblWrap);
      }

      // Interactive student interpretation input inside the chat card
      const interpDiv = document.createElement('div');
      interpDiv.className = 'pt-1 flex items-center gap-1.5';
      const interpInp = document.createElement('input');
      interpInp.type = 'text';
      interpInp.placeholder = 'دوّن قراءتك واستنتاجك من هذا الفحص/الصورة ليُضاف لمفكرتك وتقريرك...';
      interpInp.value = req.studentAnalysis || '';
      interpInp.className = 'flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:bg-white focus:border-teal-600';
      const interpBtn = document.createElement('button');
      interpBtn.type = 'button';
      interpBtn.className = 'px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shrink-0';
      interpBtn.textContent = 'حفظ قراءتي ✓';
      interpBtn.addEventListener('click', () => {
        const val = interpInp.value.trim();
        if (!val) return;
        req.studentAnalysis = val;
        const pad = document.getElementById('nurse-scratchpad');
        if (pad) {
          pad.value = (pad.value ? pad.value + '\n' : '') + `- تحليل (${req.title}): ${val}`;
          saveScratchpadText(pad.value);
        }
        showToast('تم حفظ استنتاجك وإضافته إلى المفكرة السريرية.');
      });
      interpDiv.appendChild(interpInp);
      interpDiv.appendChild(interpBtn);
      card.appendChild(interpDiv);

      chatBox.appendChild(card);

      // If this test is distant / unrelated to the primary case (!req.isExpected && !req.isViolation), immediately show the chat prompt asking the student to justify their decision scientifically!
      if (!req.isExpected && !req.isViolation) {
        const justPromptCard = document.createElement('div');
        justPromptCard.className = 'my-2 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2.5 max-w-[92%] mr-auto shadow-2xs';
        justPromptCard.innerHTML = `
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="text-xs sm:text-sm font-bold text-amber-900">برّر طلب: ${nbBidi(req.title).replace(/\u2066([^\u2069]*)\u2069/g, '<bdi dir="ltr" class="whitespace-nowrap">$1</bdi>')}</span>
            <span class="text-xs px-2 py-0.5 rounded-md bg-white border border-amber-200 font-semibold text-amber-800 whitespace-nowrap">خارج الاستطباب</span>
          </div>
          <p class="text-xs leading-relaxed text-amber-900">
            هذا الفحص بعيد عن الشكوى الأساسية. التبرير المقنع يمنحك 5 نقاط، وغير المقنع يخصم 5 ويُسجَّل في نقاط ضعفك.
          </p>
          <div class="flex items-center gap-1.5 pt-1">
            <input type="text" class="chat-just-input flex-1 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs text-slate-900 focus:outline-none focus:border-teal-600" placeholder="اكتب تبريرك العلمي هنا (كيف يساعدك هذا الفحص في التشخيص التفريقي أو استبعاد حالة مرافقة؟)..." />
            <button type="button" class="chat-just-submit-btn px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shrink-0">إرسال التبرير ✓</button>
          </div>
          <div class="chat-just-feedback hidden text-xs font-bold pt-1"></div>
        `;
        const jInp = justPromptCard.querySelector('.chat-just-input');
        const jBtn = justPromptCard.querySelector('.chat-just-submit-btn');
        const jFb = justPromptCard.querySelector('.chat-just-feedback');
        const handleJustify = () => {
          const val = jInp.value.trim();
          if (!val) {
            showToast('يرجى كتابة تبريرك السريري لطلب هذا الفحص أولاً.');
            return;
          }
          req.studentJustification = val;
          req.justificationEvaluated = true;
          const isSci = evaluateScientificJustification(val);
          req.isScientificallyJustified = isSci;
          jFb.classList.remove('hidden');
          if (isSci) {
            jFb.className = 'chat-just-feedback text-xs font-bold pt-1 text-emerald-800';
            jFb.textContent = 'قرارك مبرر ومستند إلى أسس علمية وتشخيص تفريقي سليم — تم قبول التبرير واحتساب العلامة لصالحك (+5 نقاط).';
            showToast('تم قبول تبريرك العلمي واحتساب النقطة لصالحك!');
          } else {
            jFb.className = 'chat-just-feedback text-xs font-bold pt-1 text-rose-700';
            jFb.textContent = 'التبرير غير مدقق علمياً — تم احتساب هذه النقطة ضدك ضمن نقاط الضعف (طلب فحص بعيد عن التشخيص دون مبرر علمي).';
            showToast('التبرير غير كافٍ علمياً — احتُسبت النقطة ضمن نقاط الضعف.');
          }
        };
        jBtn.addEventListener('click', handleJustify);
        jInp.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            handleJustify();
          }
        });
        chatBox.appendChild(justPromptCard);
      }

      chatBox.scrollTop = chatBox.scrollHeight;
    }

