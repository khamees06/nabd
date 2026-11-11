  /* ---------- nurse mode: the side panel ---------- */
  function nurseChips() {
    if (!NM() || typeof document.querySelector !== 'function') return;
    const n = document.querySelector('.er-p[data-who="n"] b'), d = document.querySelector('.er-p[data-who="d"] b'), np = document.querySelector('.er-p[data-who="n"]');
    if (n) n.textContent = 'د. ' + E.nurse.doc + (E.nurse.present ? '' : ' (خارج الغرفة)');
    if (np && np.dataset) { if (E.nurse.present) delete np.dataset.out; else np.dataset.out = '1'; }
    if (d) d.textContent = 'المشرفة';
  }
  const ordTime = t => `<bdi dir="ltr" class="font-num">${clk(t)}</bdi>`;
  function buildOrders() {
    if (!E || !NM()) return;
    const N = E.nurse, box = $('er-ord'), list = $('er-ord-list');
    const open = N.orders.filter(o => openOrd(o) && !o.reminder).length;
    const tb = $('er-test'), lt = $('er-tab-labs');
    if (tb && tb.dataset) tb.dataset.badge = open ? String(open) : '';
    // 2026-11-08: on a wide screen the same count sits on the «Labs» button, so new orders are seen from the monitor too.
    if (lt && lt.dataset) lt.dataset.badge = open ? String(open) : '';
    if (!box || !list) return;
    box.hidden = !N.orders.length;
    const was = REAL && document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.ord : '';
    const rows = [...N.orders].sort((a, b) => (openOrd(b) ? 1 : 0) - (openOrd(a) ? 1 : 0) || a.at - b.at);
    list.innerHTML = rows.map(o => {
      const drug = o.kind === 'act' && !!(actOf(o.id) || {}).dose;
      const state = o.cancelled ? '<span class="er-ord-chip is-x">أُلغي</span>' : o.doneAt != null ? `<span class="er-ord-chip is-done">نُفِّذ عند ${ordTime(o.doneAt)}</span>` : '<span class="er-ord-chip is-wait">بانتظار التنفيذ</span>';
      const tags = (o.reminder ? '<span class="er-ord-chip is-rem">تذكير</span>' : '') + (o.doctorDoes ? '<span class="er-ord-chip is-doc">يجريه الطبيب</span>' : '');
      const btn = openOrd(o) ? `<button type="button" data-ord="${o.kind}:${esc(o.id)}">${o.kind === 'test' ? 'اطلب' : drug ? 'أعطِ' : 'نفّذ'}</button>` : '';
      return `<li class="er-ord-row${openOrd(o) ? ' is-open' : ''}"><p><b>${esc(o.ar)}</b>${o.show ? ` <bdi>${esc(o.show)}</bdi>` : ''}${o.pick ? `، الجرعة: <bdi dir="ltr">${esc(o.pick)}</bdi>` : ''}</p><p class="er-ord-meta"><small>صدر عند ${ordTime(o.at)}</small>${tags}${state}</p>${btn}</li>`;
    }).join('');
    if (was) { const b = list.querySelector('[data-ord="' + was + '"]'); if (b && b.focus) b.focus({ preventScroll: true }); }
  }
  // A click on an order in the panel: the trainee's line, then the same path as typing it.
  function execOrder(kind, id) {
    if (!E || E.over || !NM()) return false;
    E.started = true;
    const o = E.nurse.orders.find(x => x.kind === kind && x.id === id && openOrd(x));
    if (!o) return false;
    const meta = kind === 'test' ? testOf(id) : actOf(id);
    person('me', (kind === 'test' ? 'طلبت ' : isDrug(id) || id === 'oxygen' ? 'أعطيت ' : 'نفّذت ') + meta.ar);
    E.rbBuf = []; E.collect = [];
    if (kind === 'test') nurseTest(id, '', '');
    else nurseAct({ id, dose: '', agent: '' }, '');
    flushBack();
    const col = (E.collect || []).filter(x => E.pending === x.p || E.queue.some(([q]) => q === x.p));
    E.collect = null;
    if (col.length && (!E.pending || E.pending.type === 'dose')) openDoses(col[0].line);
    buildOrders();
    return true;
  }
  const nurseTag = id => {
    if (!NM()) return '';
    const ord = E.nurse.orders.some(o => o.kind === 'test' && o.id === id && !o.cancelled);
    return NURSE_TESTS.has(id) ? '<em class="er-tag er-tag-own">سريري: ضمن صلاحيتك</em>' : ord ? '<em class="er-tag er-tag-ord">أمر الطبيب</em>' : '<em class="er-tag er-tag-need">يحتاج أمر طبيب</em>';
  };
  // The role, chosen before a case starts only.
  const canSwitch = () => !!E && !E.over && !E.started && E.turns === 0 && E.sim < 0.05;
  function setRole(v) {
    const role = v === 'nurse' ? 'nurse' : v === 'doctor' ? 'doctor' : null;
    if (!role || !canSwitch()) return false;
    if (role === E.role) return true;
    roleWanted = role;
    begin(E.c.id, { role });
    return true;
  }

