  window.nbOpenER = open;
  // The last report can be read again until the next case starts.
  window.nbErReport = () => {
    if (!lastReport || lastReport !== E || !E.over || typeof navigateTo !== 'function') return false;
    navigateTo('er');
    $('er-debrief').hidden = false;
    return true;
  };
  // Test hook for the browser checks.
  window.__nbER = { begin: id => begin(id), beginAs: (id, o) => begin(id, o), set role(v) { roleWanted = v === 'nurse' ? 'nurse' : v === 'doctor' ? 'doctor' : null; }, get role() { return E && E.role; }, get nurse() { return E && E.nurse; }, setRole, execOrder, gradeSbar, nurseAct, nurseTest, strip: forNurse, releaseOrders, buildOrders, escBy, send, orderTest, panelTest, buildRecords, modsNow, live, allergicTo, readAct, get E() { return E; }, get D() { return D; }, set api(v) { api = v; apiRetryAt = v === 'off' ? Infinity : 0; if (v === 'off') loadFind(); }, get api() { return api; }, readFinding, doseCheck, doseOf, doseIn, doseBad, jump(min) { if (E) E.sim += min; }, localRead, end: conclude, score, setRisk(r) { E.risk = r; },
    /* phase8 2026-11-07 */ justGood, offInd, showBrief, closeBrief, buildLog, setSide, chatEn, get real() { return REAL; } };
