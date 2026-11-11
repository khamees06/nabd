  const API = '/api/er-chat';
  // Simulated seconds per real second. One to one: the patient has time to answer what the trainee does,
  // and a case lasts as long as the trainee needs, not ten minutes.
  const PACE = 1;
  // The cuff cycles faster once the patient is sick, so the tile is never long behind the nurse.
  const BP_EVERY = 2, BP_SICK = 1;
  // Even a well-treated patient is still a patient in resus.
  const RISK_FLOOR = 20;
  const OFFLINE_NOTE = 'الاتصال بخدمة الفهم غير متاح الآن. الغرفة تعمل بوضع مبسّط، وقد لا تفهم كل جملة.';

  let D = null, loading = null, api = location.protocol === 'file:' ? 'off' : 'try', apiFails = 0, apiRetryAt = 0, apiNoted = false;
  let E = null, tickId = null, last = 0;
  const seen = new Set();
  /* nurse mode 2026-11-07: the trainee can be the ER nurse responsible for the bed instead of the resident.
     Every nurse-only path sits behind NM(); the doctor room is unchanged. roleWanted is the role asked for
     before a case starts (briefing switch or test harness); null means "from the user's track". */
  let roleWanted = null;
  const NM = () => !!E && E.role === 'nurse';
  // Patient, relative and instructor lines were written for a doctor: "يا دكتور" is dropped for the nurse.
  // Third-person «الدكتور» stays.
  const forNurse = s => String(s == null ? '' : s).replace(/(^|[\s،,!؟?.…])يا دكتور(?:ه|ة)?[،,]?\s*/g, '$1').replace(/^(?:دكتور[!،,]?\s*)+/, '').replace(/\s+([.،,!؟?])/g, '$1').trim();

