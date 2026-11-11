# Small scripts: ui.js, motion.js, terms.js

Scope: `ui.js` (54 lines), `motion.js` (651), `terms.js` (127). All three are classic scripts wrapped in one IIFE each. Script order in `index.html` (2311-2316, all `defer`): script.js, motion.js, terms.js, ui.js, resp.js, er.js. Evidence: files read in full; `grep` over `script.js er.js resp.js index.html ui.js`; one load-time probe of the running page at `http://127.0.0.1:5180/` (offline mode). The monitor rooms (sim, ER, respiratory, nursing) were not opened in the running page, so monitor behaviour below is from code only.

## Purpose of each

| File | Purpose |
|---|---|
| ui.js | Keeps the drawer's user card (`#side-user-av`, `#side-user-name`) in step with the header, and marks the drawer button of the open view with `is-current`. Reads DOM written by script.js. |
| motion.js | Presentation layer: hero headline word reveal, scroll reveals, count-up of dashboard figures, scroll progress bar and view-change sweep, nursing chat height on phones, hero parallax, and the live vitals monitor (canvas ECG and pleth trace, beat tone, HR tile rewrite, alarm class, tap-for-normal-range) attached to four monitor markups. Also owns the single shared `AudioContext`. |
| terms.js | Walks all text nodes in `document.body` and replaces Arabic clinical terms with English ward terms (list of about 150 pairs), with a skip list and a `title` tooltip showing the Arabic original. No switch: English is always on (header comment 2-8, boot 111-123). |

## Features (reachability with evidence)

| # | Feature | Reachability | Evidence |
|---|---|---|---|
| 1 | Drawer user card sync | live | ui.js 31-47; ids exist at index.html 196-197, 130, 139; `#app-header` index.html 87. Listeners on `#app-open-sidebar-btn` (176), `#public-open-sidebar-btn` (74). |
| 2 | Drawer current-view mark | live | ui.js 24-29; `data-v7-view` on buttons index.html 215, 226, 227, 232. Runs only on open-button click and at boot, not on view change while the drawer is closed (ui.js 31, 43-45). |
| 3 | Hero word reveal | live (skipped when reduced motion) | motion.js 13-39; probe: `#view-index .nb-hero h1` class `is-split`. h1 at index.html 278 has two spans, kept as lines (motion.js 21). |
| 4 | Scroll reveals | live, but three of the selectors match nothing | REVEAL 45-51. `.nb-track-card`, `.v7-steps > li`, `.v7-specs > li` appear only in style.css/theme.css and motion.js; searched `*.js`, `*.css`, `index.html`: no markup produces them. `.nb-room` is produced by script.js 2317, 2335. Other selectors (`#view-home > .bg-white` etc.) not checked against markup: not determined. |
| 5 | Stuck-reveal safety net `releaseStuck` | live | 80-85; called from onScroll 145, onViewChange 164, observer 631. |
| 6 | Count-up of six figures | live | COUNT 88; all six ids exist in index.html (grep count 1 each). Skips values with a decimal point (93) and non-ASCII digits (regex `\d`, 92). |
| 7 | Scroll progress bar and view sweep | live | 131-166; elements appended at boot 613-614. |
| 8 | Nursing chat height fit (phones) | live (below 1024 px) | 171-177; selector `#view-nurse:not(.hidden) .nr2-chat`; called at 622, 630. |
| 9 | Hero parallax | live on fine pointers only | 180-192; guard line 182. |
| 10 | Vitals monitor, sim room | live | adapter 552-562; `#side-pane-vitals > div` index.html 871-872; `.animate-pulse` appears once in index.html (the dot). |
| 11 | Vitals monitor, ER room | live | adapter 564-579; `.er-mon` index.html 1855; ids `er-v-*` set by er.js (for example er.js 95). |
| 12 | Vitals monitor, respiratory room | live | adapter 581-594; `.rs-mon` index.html 1795; `window.nbRespVitals` resp.js 249. |
| 13 | Vitals monitor, nursing room | live | adapter 596-608; `.nr2-mon` and `#nr-mon` are built by script.js 3913-3916 (not in index.html). |
| 14 | Pulse tone (beep) | live, off until the trainee or er.js turns sound on | 264-278; button 300-318; er.js 4675-4678 clicks the button on room start. |
| 15 | Audio wake-up on touch / visibility | live | 254-263. |
| 16 | VT trace (sine) | live, driven by `#view-er` `data-rhythm='vt'` (er.js 178) | motion.js 457-458, 574. |
| 17 | Reduced-motion static trace and tone | live when OS setting is on | 472-485, 497-503. |
| 18 | Terminology translation | live | probe: `document.documentElement.dataset.terms === 'en'`. terms.js 111-123. |
| 19 | Room-aware translation (`#view-er` uses `chatEn`) | live | terms.js 83-84; `chatEn` exported at er.js 4705, defined er.js 264. |
| 20 | Removal of key `nabd_terms_lang` | live (legacy cleanup) | terms.js 113. No other file references the key (grep over js and index.html). |
| 21 | `termsTitle` data attribute and `done[].orig` | unreferenced | `termsTitle` (terms.js 96) and `orig` (terms.js 94) are written and never read. Searches: `termsTitle`, `nabd_terms_lang` over script.js er.js resp.js index.html ui.js: 0 hits. |

## Declarations

### ui.js

| Name | Lines | Responsibility | Layer | Called from |
|---|---|---|---|---|
| signedIn | 9-12 | true when `#app-header` is not `.hidden` | presentation | syncUser |
| syncUser | 14-27 | copy full name and initials into drawer card; guest fallback text | presentation | onOpen; two MutationObservers (44-47) |
| markCurrent | 29-35 | toggle `is-current` on `#app-sidebar [data-v7-view]` by the visible `#main-container > section` id | presentation | onOpen |
| onOpen | 37 | syncUser + markCurrent | presentation | click handlers, boot |
| boot | 39-52 | wire click and observers | presentation | DOMContentLoaded or immediately |

### motion.js

| Name | Lines | Responsibility | Layer | Called from |
|---|---|---|---|---|
| reduceMotion, finePointer | 9-10 | media queries read once at load | browser | everywhere in file |
| splitHeroWords | 13-39 | split h1 into masked word spans, `aria-label` kept | presentation | boot 616 |
| REVEAL, revealIO, reveal | 45-59 | reveal selector list, observer, class `is-in` with delay `--d` | presentation | observeReveals, releaseStuck |
| observeReveals | 61-77 | mark off-screen blocks `nb-io` and observe | presentation | onViewChange, observer |
| releaseStuck | 80-85 | force-reveal anything on screen | presentation | onScroll, onViewChange, observer |
| COUNT, countUp | 88-110 | animate first integer in element text over 1100 ms (cubic ease-out) | presentation | observeCounts |
| observeCounts | 112-128 | observe figure elements | presentation | onViewChange, observer |
| progress, sweep | 131-137 | two decorative elements | presentation | boot |
| onScroll | 139-148 | rAF-throttled progress scaleX + releaseStuck | browser | scroll, resize, boot |
| visibleView, onViewChange | 151-166 | find visible section; sweep on change | presentation | boot, observer |
| fitNurseChat | 171-177 | set chat height = viewport - top - 12 (min 380) below 1024 px | presentation | resize, observer |
| heroParallax | 180-192 | write `--px`, `--py` on pointer move | presentation | boot |
| RANGES | 195-203 | seven normal-range sentences (HR, BP, SpO2, Temp, RR, BG, NEWS2) | domain (reference text) | rangeOf 338 |
| keyOfLabel | 204-205 | map nursing cell label to key by regex | presentation | nursing adapter |
| firstNum | 206-209 | first number in element text | presentation | monitor |
| bump, R_AT, ecgBeat | 214-221 | synthetic lead-II waveform (see golden master) | domain (waveform model) | monitor |
| plethBeat | 223-227 | pleth waveform | domain | monitor |
| gauss | 228-232 | Box-Muller normal noise with Math.random | domain | nextRR |
| audio, nbAudio, soundLabel, syncSoundLabels | 234-252 | shared AudioContext, sound button label | browser | monitor, er.js 4673 |
| wakeAudio and its listeners | 254-263 | resume suspended context | browser | document listeners |
| beep | 264-278 | oscillator 520-800 Hz by SpO2, 90 ms envelope | browser | onBeat, reduced-motion loop |
| makeMonitor | 280-549 | per-root monitor: canvas, bar, sound button, tile help, vitals read, HR rewrite, draw loop | application + presentation | enhanceMonitors |
| enhanceMonitors | 551-609 | four adapters (sim, ER, resp, nursing) | application | onViewChange, observer |
| boot | 612-645 | append elements, listeners, main MutationObserver (625-644) | presentation | DOMContentLoaded 650 |

Inside makeMonitor: soundBtn handler 300-318; prepTiles 327-336; rangeOf/warnOf 338-339; pick 340-348; size 373-384; readBase 388-409; readVitals 411-431; nextRR 433-439; showRate 441-451; ecgColor/yE/yP 453-456; onBeat 461-470; drawStatic 472-485; frame 487-544; start 546-548.

### terms.js

| Name | Lines | Responsibility | Layer | Called from |
|---|---|---|---|---|
| TERMS | 13-48 | Arabic to English pairs; `الـ ` prefix means keep Arabic article | domain (vocabulary) | byLength |
| AR, byLength, lookup, escape, RE | 50-55 | longest-first alternation; whole-word guard: no Arabic letter before or after | domain | translate |
| HAS_AR | 56 | quick test, range ء-ي | presentation | translate |
| SKIP | 59-67 | CSS selector list of areas never rewritten | presentation | translate 77 |
| ROOM_KEEP | 69 | القسطرة kept inside `#view-er` | domain | translate 85 |
| done (WeakMap) | 70 | node to {orig, out}; only `out` is read (75) | presentation | translate |
| translate | 72-100 | per text node: skip rules, optional `chatEn` pre-pass in ER, regex replace, التسليم date exception (87), write `node.data`, set parent `title` | presentation | walk, observer |
| walk | 102-109 | TreeWalker over text nodes | presentation | boot, observer |
| boot | 111-123 | drop old key, set `data-terms="en"`, first walk, body MutationObserver | browser | 125-126 |

## Contracts with the other scripts and with index.html

Globals exposed by these files

| Global | Defined | Used by |
|---|---|---|
| `window.nbAudio()` returns the shared AudioContext or null | motion.js 243 | er.js 4673 (falls back to its own `new Ctx()` if absent) |
| `localStorage.nbSound` ('1'/'0'), written only on a trusted tap | motion.js 316 | er.js 4677 (reads; only the value '0' blocks auto-on) |
| `.nb-mon-sound` button, `aria-pressed` | motion.js 292 | er.js 3860, 4347, 4675 (`.click()`) |
| `data-sound` on monitor root | motion.js 313 | motion.js 468, 498 |
| `data-terms="en"` on `<html>`, `title` and `data-terms-title` on parents | terms.js 114, 95-97 | CSS use not checked: not determined |

Globals read by these files

| Global | Provided by | Read at | Note |
|---|---|---|---|
| `window.nrWarn(key, raw)` | script.js 3588 (top-level function, global; probe: `typeof nrWarn === 'function'`) | motion.js 339 | default alarm rule for the sim and nursing monitors; returns the string 'warn' or '' |
| `window.nbErVitals.warn(key, raw)` | er.js 113 | motion.js 570 | returns boolean; thresholds differ from nrWarn (RR above 24, SpO2 at or below 92, SBP 180) |
| `window.nbRespVitals.warn/range` | resp.js 249 | motion.js 589-590 | age-banded |
| `window.__nbER.chatEn` | er.js 4705 | terms.js 83-84 | ER wording list |
| `#view-er[data-rhythm]` ('vt' or '') | er.js 178, 3863, 4394 | motion.js 574 | |
| `.er-mon[data-run]` counter | er.js 4396 (only when REAL) | motion.js 369-370, 412 | new case resets heart rate |
| `#er-brief` and its `hidden` | er.js 4439 | motion.js 575 | silences tone during briefing |
| `[data-no-terms]` spans | script.js 6161, 6193; er.js 3830, 3836, 3930, 4466 | terms.js 66 | opt-out marker |

DOM ids and classes consumed

- motion.js: `#view-index .nb-hero h1`, `#main-container > section`, `#view-nurse .nr2-chat`, `#side-pane-vitals > div`, `#sim-v-hr/-bp/-spo2/-temp`, `.er-mon`, `#er-v-hr/-spo2/-rr/-temp/-bp`, `.er-mon-dot`, `.rs-mon`, `#rs-v-*`, `.rs-mon-dot`, `.nr2-mon`, `#nr-mon .nr2-cell`, `.nr2-l`, `.nr2-v`, `.nr2-mh .dot`, the six COUNT ids.
- motion.js adds: `.nb-wm .nb-w .is-split .nb-io .is-in .nb-progress .nb-sweep .is-on .nb-mon .nb-mon-host .nb-mon-canvas .nb-mon-bar .nb-mon-sound .nb-mon-info .nb-mon-tile .is-picked .nb-alarm .is-live .nb-beat .nb-dot-beat`, attributes `data-mon data-tile data-rv data-cu data-split data-sound`.
- ui.js: `#app-header`, `#dropdown-user-name`, `#user-avatar-fallback`, `#side-user-av`, `#side-user-name`, `#app-sidebar [data-v7-view]`, the two open buttons.
- terms.js skip list (59-67): `#sim-chat-messages > .flex-col`, `.nb-b.patient`, `.nb-b.nurse`, `.coach-message.is-student`, `.rs-msg.pt`, `.rs-msg.me`, `.rs-chips`, `#rs-qlist`, `.rs-missed`, `.er-msg`, `#er-input`, `.er-mon`, script, style, textarea, noscript, `[data-no-terms]`.

MutationObservers

| Where | Target | Options | Purpose |
|---|---|---|---|
| ui.js 44 | `#dropdown-user-name` | childList, characterData, subtree | resync card |
| ui.js 47 | `#app-header` | attributes class | guest/signed-in swap |
| motion.js 625 | `#main-container` | subtree, childList, attributes class | rAF-coalesced re-scan; ignores records whose target is inside `.nb-mon` (626-629) |
| motion.js 371 | each monitor's HR element | childList, characterData, subtree | sets `appWrote`; its own writes dropped with `takeRecords` (449) |
| terms.js 117 | `document.body` | subtree, childList, characterData | translate new nodes |
| motion.js | IntersectionObserver x2 (reveal, count), ResizeObserver per monitor canvas (385) | | |

Ordering couplings
- motion.js and terms.js both run at DOMContentLoaded after script.js (`defer`), so the readyState check never takes the immediate path in a normal load.
- terms.js rewrites label text that motion.js `keyOfLabel` (204) reads; both the Arabic and English forms contain HR/BP/SpO2/Temp/RR, so the regex still matches. Not exercised live.
- The HR element is written by three parties: the app (script.js 6746, er.js 95 with `wobble`), motion.js `showRate` (446-450), and terms.js is not involved (digits only).

## Data, storage, timers, audio

| Item | Detail |
|---|---|
| localStorage | `nbSound` set at motion.js 316 (try/catch); `nabd_terms_lang` removed at terms.js 113 (try/catch). ui.js: none. |
| Network | none in all three files. |
| Timers | `requestAnimationFrame` loop per monitor (frame 487-544, ends when `root.isConnected` is false); `performance.now()`; vitals re-read every 400 ms inside the frame loop (498). No setTimeout/setInterval in these files. |
| Audio | one `AudioContext` (234, 243-252); oscillator beep 264-278: frequency 520 + clamp(SpO2-80, 0..20)*14 Hz, gain ramp to 0.16 in 10 ms and back in 80 ms, stop at 100 ms. Resume on pointerdown, touchend, click, keydown (capture), visibilitychange, pageshow, only if context not running and a pressed sound button exists (254-260). |
| Randomness | `Math.random` only in `gauss` (228-232). |
| Canvas | 2D context, DPR capped at 2 (374), 4 seconds across the width (`W/4` px per second, 507). |

## Calculations worth a golden master

Deterministic (pure functions of their inputs; extract and test with fixed numbers):
- `ecgBeat(t, rr)` 216-221: five Gaussian terms (P at 0.06, Q at 0.172, R at R_AT 0.19, S at 0.21, T at 0.07+QT); `qt = 0.4*sqrt(rr)` (Bazett, QTc 0.40); returns 0 outside -0.05..1.6 s.
- `plethBeat(t)` 223-227: two Gaussians at R_AT+0.22 and R_AT+0.42; 0 outside -0.1..1.2 s after R_AT.
- `bump` 214.
- `ecgAt` (458): VT gives `0.8*sin(2*pi*t/cur)`; otherwise sum of current and previous beat tails.
- Mapping `yE`, `yP` (454-456): ECG baseline H*0.40, amplitude H*0.33; pleth baseline H*0.94, amplitude H*0.26 scaled by clamp((spo2-78)/20, 0.35, 1).
- `beep` frequency formula; `ecgColor` rules (#FF7873 alarm, #4CC283 normal, grey when no HR); alarm decision per tile: `warnOf(key, raw)` with raw = case HR (not the drifting value) for HR (419-423).
- Normal-range texts RANGES (195-203); `firstNum`; `keyOfLabel`; count-up text substitution (first integer only, skipped when a decimal exists).
- Static trace `drawStatic` (472-485): period 60/base, sampled across 4 s; fully deterministic.
- terms.js `translate`: pure given a string and the room flag; the TERMS table, longest-first matching, whole-word guard, التسليم exception, `ROOM_KEEP`. Golden master: feed a list of Arabic strings, compare output.
- Reveal delay: k*70 ms per intersecting batch (68).

Not deterministic:
- `nextRR` (433-439): drift (AR(1), 0.96 decay, noise sd 0.35 clamped to +-2.5 bpm) and beat noise sd 1% from `gauss` using `Math.random`; also depends on the `clock` that accumulates real frame time (dt capped at 0.05 s) and on the respiratory rate for sinus-arrhythmia term. The shown HR (average of the last four beat intervals, 441-451) therefore varies around the case value. A golden master needs a seeded random source and a fixed dt sequence injected.
- `hrNow` easing: first-order with time constant 2.5 s (503), depends on frame timing.
- Beat timing, canvas pixels, audio start times (`audio.currentTime`).
- Whether an element is revealed (depends on viewport and geometry).

## Problems

| Sev | Kind | Detail |
|---|---|---|
| high | Display value written by a presentation script | motion.js 441-451 overwrites the HR tile text with a rate derived from random beat intervals, although the header (2-3) says it never changes clinical values. The app's own writers (script.js 6746, er.js 95) then see their value replaced; motion.js re-reads the app value whenever a write is observed (388-409). In a server-side design the displayed HR must come from the case state, with the jitter as a separate display-only value. |
| high | Implicit cross-file contract | alarm thresholds for the sim and nursing monitors come from global `nrWarn` (script.js 3588) via `typeof window.nrWarn` (339); ER and respiratory supply their own, with different limits (nrWarn RR at or above 22, SpO2 at or below 94; ER RR above 24, SpO2 at or below 92). Three threshold sets for the same quantity; the same patient can be flagged on one monitor and not another. |
| medium | Non-determinism | `Math.random` in `gauss` (230-231) with no seed; tests cannot reproduce the trace or the shown HR. |
| medium | Dead selectors | REVEAL entries `.nb-track-card`, `.v7-steps > li`, `.v7-specs > li` (46-47) match no markup in index.html or any js file (CSS rules exist in style.css and theme.css for them). |
| medium | Unused stored data | terms.js stores `done.orig` and `dataset.termsTitle` and never reads them (94, 96). There is no way to restore Arabic text. |
| medium | Global DOM text rewrite | terms.js changes `node.data` of the whole body, including text that other code may read back later (for example labels read by motion.js `keyOfLabel`). Whether any script.js code reads translated text back is not determined. |
| medium | Page-wide listeners never removed | wakeAudio listeners (261-263) and the `ResizeObserver` per monitor (385) are never disconnected; a new monitor root creates a new observer and a new `frame` loop each time a room is rebuilt (old loops stop when the root disconnects, 488). |
| low | Media queries read once | `reduceMotion` and `finePointer` (9-10) do not follow changes of the OS setting during a session. |
| low | Count-up and digits | `countUp` only handles ASCII digits and the first integer (92-93); Arabic-Indic digits would be left as is. |
| low | Sidebar mark only on open | ui.js `markCurrent` runs on drawer open and boot only; view switches while the drawer is closed are caught on the next open (acceptable, but it relies on the click handler). |
| low | Inline style/ID coupling | motion.js hides the original `<svg>` (`svg.style.display='none'`, 275-ish in makeMonitor) and inserts a canvas; the SVG remains in the DOM. |

## Proposed source fragments

Rule: complete coverage of the code inside each wrapper, contiguous, validated with `check-fragment.mjs ... --iife` (all ranges below returned `ok`).

| Fragment name | File | Lines | Responsibility | Layer |
|---|---|---|---|---|
| ui/drawer-sync.js | ui.js | 7-53 | whole file, one fragment | presentation |
| motion/prefs-reveal-count.js | motion.js | 7-128 | media queries, hero split, scroll reveals, count-up | presentation |
| motion/view-chrome.js | motion.js | 129-193 | progress bar, sweep, view change, nursing chat fit, parallax | presentation / browser |
| motion/ecg-model.js | motion.js | 194-233 | RANGES, label/number helpers, `ecgBeat`, `plethBeat`, `gauss` | domain |
| motion/audio.js | motion.js | 234-279 | shared AudioContext, wake-up, beep | browser |
| motion/monitor.js | motion.js | 280-550 | `makeMonitor` (needs ecg-model and audio in scope; keep same wrapper order) | application / presentation |
| motion/monitor-adapters.js | motion.js | 551-610 | `enhanceMonitors` four adapters | application |
| motion/boot.js | motion.js | 611-650 | boot, main MutationObserver, load hook | presentation |
| terms/vocabulary.js | terms.js | 10-49 | TERMS table | domain |
| terms/translate.js | terms.js | 50-110 | regex, skip list, `translate`, `walk` | presentation |
| terms/boot.js | terms.js | 111-126 | boot and observer | browser |

Note: fragments share one function scope in the original (const/let/function names are used across them), so the bundle must concatenate them in this order inside one wrapper per original file.

## Open questions

1. Does any script read text back after terms.js translated it (for example labels, button text compared to Arabic strings)? Not determined; a grep for text comparisons across script.js, er.js and resp.js was not part of this area.
2. Should the target design keep the HR tile as a jittered value shown by the client, or show the case value exactly? The code today shows a derived value that differs from the case value.
3. Which of the three alarm threshold sets (nrWarn, nbErVitals, nbRespVitals) is authoritative for the server-side domain?
4. CSS dependence on `data-terms`, `data-terms-title`, `.nb-io`, `.is-in`: not checked in the nine CSS files.
5. Monitor behaviour in the four rooms was not exercised in the running page (only load-time state probed); nursing `#nr-mon` cells are created at script.js 3600 on demand.
6. REVEAL selectors `#view-home > .bg-white`, `#view-university > div > .bg-white`, `footer li` etc.: match against actual markup not verified.
