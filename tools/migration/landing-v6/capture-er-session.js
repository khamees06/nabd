// Drives one real session of the ER training room, for the V6.3 landing's product images. It is run inside the
// page by tools/legacy/browser-probe.mjs, with Math.random seeded to 19 (the asthma case) and the understanding
// services off (Development settings), so the room answers in its offline mode, exactly as a user would see it.
// Nothing is staged: the questions and orders are typed into the room's own input, and the replies, results and
// report are what the room produced. Set window.__STOP to stop at one moment and leave the page there:
//   'briefing' the case briefing   'talk' two questions answered   'chat' first treatments
//   'workup'   blood gas result     'report' (default) the report after the handover
//
// node tools/legacy/browser-probe.mjs --url http://127.0.0.1:5199/ --js-file tools/migration/landing-v6/capture-er-session.js
//   --init-js "<seeded Math.random (seed 19)> window.__STOP='talk';" --reduced-motion --scale 2 --width 390 --height 844 --shot out.png
// The seeded Math.random is the one in tools/legacy/compare-hosts.mjs (INIT) with 19 in place of its seed.
const STOP = window.__STOP || 'report';
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (const t0 = Date.now(); Date.now() - t0 < 20000 && (document.readyState !== 'complete' || typeof nbDemoLogin !== 'function');) await sleep(100);
nbDemoLogin('med_student'); await sleep(1200);
await nbOpenER(); await sleep(2000);
// The sign-in toast ("دخول تجريبي…") is a passing notice; it is closed so that it does not cover the room.
const hideToast = () => document.querySelectorAll('#calm-toast').forEach(t => t.classList.add('hidden'));
hideToast();
if (STOP === 'briefing') { await sleep(500); return 'briefing'; }
document.getElementById('er-brief-go').click(); await sleep(1500);
const feed = document.getElementById('er-feed'); let seen = feed.innerText.length; const out = [];
// About 18 seconds between messages, a trainee's pace: the case clock runs in real time, so the report then shows
// a few minutes, not seconds. window.__PACE (ms) overrides it.
const PACE = window.__PACE || 18000;
const say = async t => {
  const i = document.getElementById('er-input'); i.value = t; i.dispatchEvent(new Event('input', { bubbles: true }));
  document.getElementById('er-send').click(); await sleep(PACE);
  out.push('>> ' + t + ' :: ' + feed.innerText.slice(seen).trim().replace(/\n+/g, ' | ')); seen = feed.innerText.length;
};
// Scroll the conversation to its end, then back to the start of the message cut by the top edge, so that no
// message is shown half.
const alignFeed = () => {
  feed.scrollTop = feed.scrollHeight;
  const top = feed.getBoundingClientRect().top;
  const cut = [...feed.children].find(m => { const r = m.getBoundingClientRect(); return r.bottom > top + 1 && r.top < top - 1; });
  if (cut) feed.scrollTop -= top - cut.getBoundingClientRect().top + 10;
};
const STEPS = ['من متى بلش ضيق النفس؟', 'عندك حساسية من أي دوا؟', 'قيسوا حرارتها', 'ركّبوا أكسجين non-rebreather على 15 لتر', 'أعطوها سالبيوتامول 5 ملغ نيبولايزر'];
const MORE = ['ضيفوا أتروفنت 0.5 ملغ مع البخار', 'هيدروكورتيزون 100 ملغ وريدي', 'نادوا الأخصائي هلأ', 'اعملولها غازات دم'];
for (const q of STEPS.slice(0, 2)) await say(q);
if (STOP === 'talk') { hideToast(); feed.scrollTop = feed.scrollHeight; await sleep(800); return out; }
for (const q of STEPS.slice(2)) await say(q);
if (STOP === 'chat') { hideToast(); alignFeed(); await sleep(800); return out; }
for (const q of MORE) await say(q);
if (STOP === 'workup') { hideToast(); await sleep(800); return out; }
await sleep(6000);
document.getElementById('er-end').click(); await sleep(1200);
const typeIn = (id, v) => { const e = document.getElementById(id); e.focus(); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
typeIn('er-dx', 'نوبة ربو حادة مهددة للحياة');
const sel = document.getElementById('er-dispo'); sel.value = [...sel.options].find(o => /ICU/.test(o.textContent)).value; sel.dispatchEvent(new Event('change', { bubbles: true }));
typeIn('er-sbar', 'S: لين، 23 سنة، نوبة ربو حادة مهددة للحياة. B: ربو معروف، ما استفادت من البخاخ بالبيت، حساسية من الأسبرين. A: SpO2 91% وRR 31 وHR 122، والغازات PaO2 62 وPaCO2 42 طبيعي رغم التعب. أعطيت O2 وسالبيوتامول وإبراتروبيوم وهيدروكورتيزون. R: الـICU، وإعادة البخار ومراقبة الـPaCO2 والتفكير بالمغنيسيوم إذا ما تحسنت.');
document.getElementById('er-end-go').click(); await sleep(3500); hideToast();
return out;
