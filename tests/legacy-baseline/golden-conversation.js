// Golden master of what the trainee sees in the ER room (doctor role).
// Plays a fixed 40-message script in each of the 6 cases twice (without the understanding service, and with a
// stub of it), hands over, and keeps everything on screen plus every request body the room would have sent.
// The same script must give the same output before and after the migration: run it against the frozen legacy
// er.js to record, and against the er.js the ASP.NET Core host serves to compare.
//
// usage: node tests/legacy-baseline/golden-conversation.js record            (writes golden/conversation.json)
//        node tests/legacy-baseline/golden-conversation.js compare           (exit 1 on any difference)
//   NB_ER_JS / NB_DATA pick the script and the data folder, as in harness-er.js.
const { Room } = require('./harness-er.js');
const vm = require('vm'), fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, 'golden', 'conversation.json');
const CASES = ['asthma', 'sepsis', 'pe', 'stemi', 'dka', 'htn'];
const SCRIPT = [
  'مرحبا انا الدكتور، شو صار معك؟', 'عندك حساسية من اي دوا؟', 'بتاخد ادوية؟', 'اعطيها اكسجين 6 لتر', 'ركبي كانيولا',
  'كم الضغط؟', 'افحص الصدر', 'بدي ECG', 'اطلبي CBC و kft', 'سكر الدم',
  'يا مشرف شو اعمل؟', 'فنتولين 5 ملغ', 'هيدروكورتيزون 100 ملغ وريدي', 'نعم', 'اعطيه اسبرين 300 ملغ',
  'سوائل 500 مل', 'يا حجة اطمني، رح نعطيه علاج', 'ليفوفلوكساسين 750 ملغ', 'اعطيه نترات', 'اه',
  'عيدي الضغط', 'قيسي الحرارة', 'شغلي القسطرة', 'اينوكسابارين 70 ملغ', 'انسولين 0.1 وحدة لكل كيلو بالساعة',
  'بوتاسيوم 20 مليمول', 'اتصل بالاخصائي', 'بدي صورة صدر عشان اشوف التهاب', 'في ST elevation', 'غازات الدم',
  'لا', 'بلاش', 'مورفين 3 ملغ', 'شكرا', 'فوروسيمايد 40 ملغ وريدي',
  'cpap', 'صدمة كهربائية هسا', 'الارقام؟', 'ارفعي راس السرير', 'تمام كمل',
];
const GRADE = { dx: 'close', s: true, b: true, a: true, r: false, invented: false, note: 'ملاحظة' };
const j = o => ({ ok: true, status: 200, json: async () => o });
function stub(r) {
  let k = 0;
  r.responder = body => {
    k++;
    if (body.mode === 'grade') return j(GRADE);
    if (body.mode === 'line') return j({ reply: k % 3 ? 'سطر' : null });
    const rd = JSON.parse(JSON.stringify(r.N.localRead(body.text || '')));
    delete rd.text;
    const to = rd.to === 'room' ? 'patient' : rd.to;
    return j({ to, reply: k % 2 ? 'رد ' + k : null, held: k % 17 === 0, voiceFailed: k % 13 === 0, read: rd });
  };
}
async function play(id, online) {
  const r = new Room({ seed: 101 + CASES.indexOf(id) });
  r.win.__fn = () => 1.7e12 + r.now; vm.runInContext('Date.now = () => __fn();', r.ctx);
  if (online) stub(r);
  await r.open(id);
  if (!online) r.N.api = 'off';
  await r.real(0.5);
  for (const t of SCRIPT) { if (r.E.over) break; await r.say(t); await r.real(12); }
  if (!r.E.over) await r.handover({ dx: 'x', dispo: 'icu', sbar: 'الوضع مريض عنده ضيق نفس وعنده ربو، الضغط 120 والنبض 100، بدي عناية' });
  const E = r.E;
  return { feed: r.feed(), chat: E.chat, debrief: r.debrief(), html: r.get('er-debrief').innerHTML, posts: r.posts.map(p => p.body), done: [...E.done.keys()], outcome: E.outcome, errors: r.errors };
}
(async () => {
  const mode = process.argv[2];
  if (mode !== 'record' && mode !== 'compare') { console.error('usage: golden-conversation.js record|compare'); process.exit(2); }
  const out = {};
  for (const id of CASES) for (const online of [false, true]) out[id + (online ? ':on' : ':off')] = await play(id, online);
  console.log(Object.entries(out).map(([k, v]) => `${k.padEnd(11)} lines on screen=${v.feed.length} requests=${v.posts.length} errors=${v.errors.length} ${v.outcome}`).join('\n'));
  if (mode === 'record') {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(out) + '\n');
    console.log('recorded ' + FILE);
    process.exit(0);
  }
  const want = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  let bad = 0;
  for (const k of Object.keys(want)) for (const f of Object.keys(want[k])) {
    const a = JSON.stringify(want[k][f]), b = JSON.stringify((out[k] || {})[f]);
    if (a !== b) { bad++; let i = 0; while (a[i] === b[i]) i++; console.log('DIFFERENT', k, f, 'at character', i, '\n  recorded:', a.slice(Math.max(0, i - 80), i + 120), '\n  now:     ', String(b).slice(Math.max(0, i - 80), i + 120)); }
  }
  console.log(bad ? `conversation golden master: ${bad} differences` : `conversation golden master: identical (${Object.keys(want).length} rooms)`);
  process.exit(bad ? 1 : 0);
})();
