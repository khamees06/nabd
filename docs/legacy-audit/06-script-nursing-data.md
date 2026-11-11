# Nursing question bank and nursing cases data — script.js:2892–3439

## Purpose

This range holds the content of the nursing simulation rooms: two tiny factory helpers (`NQ`, `NA`), a list of actions every nursing case inherits (`NB_COMMON_ACTS`), one unused string constant, and `NB_NURSE_CASES`, an object literal with 13 nursing cases (1 guided, 9 ward/ED cases, 3 operating-room cases). Each case bundles the patient, vitals, history questions, selectable actions, a scripted doctor conversation (beats with orders and handoff-style report questions) and an SBAR handoff quiz. All text is Arabic. There is no logic of its own except four `rf` and a few `calc`/`chk`/`seq` payloads that the nurse-room engine (script.js:3560–3890) interprets. Verified: the data is still read today by the level/rooms picker, but the nurse room itself cannot be opened (see Features).

## Features and user journeys implemented here

Counts verified by evaluating the range in Node with stubs (`nbNews2`, `nbSb`, `nbLab`): 13 cases, 66 history questions, 13 case-level act sets, all `do`/`requires` ids resolve, no duplicate act ids, 13 distinct patient names.

| Feature | Reachability | Evidence |
|---|---|---|
| Nurse case catalogue (13 cases: id, title, cardSummary, levelLabel, deptName, durationMin, hint, patient, doctor, intro) | dormant | Card renderers read it at script.js:4027 (`nurse-cards`) and 4049 (`or-cards`) but sit after an unconditional `return;` at script.js:4024 inside `renderTrackHome`; `#home-nurse` (index.html:462) is hidden by scope.css:31. |
| Starting a nurse room from data (`nurseStart`) | dormant | script.js:3888 `navigateTo('home'); return;` is the first statement, so lines 3890+ never run. Callers: script.js:4006 (guided button in the learn path), and card clicks in the dead renderers. |
| Pool selection by level/weak topic for the nursing track | live | `nbPickRooms` reads `NB_NURSE_CASES` at 2264 and 2270 (called at 2050 for demo accounts and 2354 after the level quiz); `nbPoolFor` reads it at 2281. Only `levelLabel` (via `nbTier`, 2476), `guided` and the ids are used. The resulting ids are passed to `nbOpenRoom` (2339), which ignores the id and clicks `#launch-er-random-btn`. |
| Case lookup for shared code (`nbCaseObj`) | live | script.js:3456 returns `CASES_DB[id] \|\| NB_NURSE_CASES[id]`. Callers not traced further (outside range). |
| Guided case `nc_vitals_basic` (id/allergy/pain, vitals, paracetamol order, SBAR) | dormant | Only entry is `nurseStart` (3888). |
| Cases 2–10: BP, bleeding, diabetic foot dressing, fever + penicillin allergy, glucose/insulin, IV fluids, chest pain/ECG, sepsis, hypoglycemia without doctor | dormant | Same guard. |
| Operating-room trio (`periop` 1–3: pre-op, time-out/count, recovery) with `chk` checklists (3360, 3366) | dormant | Rendered only in `or-cards` loop (script.js:4049), after the `return` at 4024. |
| Shared safety acts (`u_abx`, `u_opioid`: unordered drug = recorded safety violation) | dormant | `NB_COMMON_ACTS` is merged by `nrActs` (3560), only reached from `nurseStart`. |
| Dose calculations (`drip` 3143, `fluids` 3230) | dormant | Interpreted by the nurse engine (`a.calc`), only reachable from `nurseStart`. |
| `nbHandoffNote` | unreferenced | Searches: `grep -n "nbHandoffNote" *.js index.html` returns only the definition at 2900. |
| `NQ` / `NA` helpers | live (load time) | Used only inside this range (grep `\bNQ\(\|\bNA\(` over *.js, index.html outside 2892–3439: no hits). |

Not exercised in the running page: the guards above were read from code; no probe was run.

## Declarations

| name | lines | kind | responsibility | layer | shared state read / written | called from |
|---|---|---|---|---|---|---|
| `NQ` | 2892 | const arrow fn | Builds a history-question record `{id,label,q,a,...opts}` (`key`, `crit` flags in opts) | domain (content factory) | none | NB_NURSE_CASES `ask` arrays (66 calls) |
| `NA` | 2893 | const arrow fn | Builds an action record `{id,g,label,r,...opts}`; `g` is measure/proc/med | domain (content factory) | none | NB_COMMON_ACTS and every case `acts` array |
| `NB_COMMON_ACTS` | 2894–2899 | const array (4 actions) | Actions every case inherits: `vitals`, `news2` (has `rf` closure calling `nbNews2(ns.v)`), `u_abx`, `u_opioid` (unsafe acts) | domain | reads `ns.v` inside `rf` (global `ns`, defined elsewhere) | `nrActs` (3560) |
| `nbHandoffNote` | 2900 | const string | Generic sentence about handoff safety | domain | none | no reference found |
| `NB_NURSE_CASES` | 2902–3438 | const object literal, 13 keys | Case data: `nc_vitals_basic` 2904, `nc_bp` 2933, `nc_bleed` 2970, `nc_wound` 3013, `nc_fever` 3049, `nc_sugar` 3089, `nc_iv` 3127, `nc_chest` 3167, `nc_sepsis` 3209, `nc_hypo` 3254, `nc_or_preop` 3297, `nc_or_timeout` 3336, `nc_or_pacu` 3394 | domain (data) | calls `nbSb` (2668), `nbLab` (3446) at load; `rf` closures read/write `ns.v`, `ns.done` | 2264, 2270, 2281, 3456, 3889, 4006, 4027, 4049 |

Case record shape (all 13): `id, kind:'nurse', [guided], [periop:1..3], levelLabel, deptName, durationMin, title, cardSummary, hint, patient{name,age,sex,bio}, [scene], doctor{name,dept}, intro, vitals{hr,bp,rr,spo2,temp,avpu,[bg]}, ask[], acts[], beats[], handoff{to,items[4]}`.
Beat keys: `doc` (doctor line), `sys` (system narration), `do` (act ids to perform), `ord{a,why,reply?,crit?,bad?}` (order check), `rep[]` (report quiz, built with `nbSb`), `post{labs|img}` (result shown after the beat), `hint`.
Act option keys: `min` (minutes added to the in-case clock), `reveal`, `patch`, `requires`, `rf`, `unsafe`+`bad`, `seq`, `calc`, `chk`, `alt`.

## Shared state, globals and contracts

Defines for others (globals, classic script): `NQ`, `NA`, `NB_COMMON_ACTS`, `nbHandoffNote` (unused), `NB_NURSE_CASES`.

Expects from others:
- Functions: `nbSb` (script.js:2668), `nbLab` (3446), `nbNews2` (2654). `nbSb`/`nbLab` are called while the literal is evaluated, so they must exist before line 2902 runs; they are function declarations in the same script (hoisted). If the script is cut into files that are concatenated in order, this still holds.
- Global `ns` (nurse-room state): `rf` closures use `ns.v` (vitals) and `ns.done` (Set). The `bp` act (2951) mutates `ns.v.bp` and calls `ns.done.delete('bp')`.
- `NB_IMG` (3440) keys: `scene` values used are bp, bp2, bandage, hands, thermo, gluco, iv, ecg (all present as keys); `post.img.key` `ecg` (3194) present. The three periop cases have no `scene` field.
- `NB_CASE_IMG` (3445) maps each case id to an image key; it is outside the range.

Data contracts the engine depends on (verified in script.js:3657–3830):
- `ord.a === 0` means the order is safe; any other value (1 or 2) means unsafe. `a:2` occurs in `nc_iv`, `nc_sepsis`, `nc_or_pacu`; the engine does not distinguish 1 from 2 (3799–3811).
- `nbSb(...)` always puts the correct option at index 0 (`a:0`, 2668); the correct answer is shuffled at render time with `nbShuffle` (3558, used at 3843, `Math.random`).
- `rep[].o[0]` is the best report; coach text uses `r.o[0]` (3823).
- `levelLabel` must be exactly «سهل», «متوسط» or «متقدم» (`nbTier` 2476 falls back to 2 for anything else).
- `key:1` on a question marks it as a required history item; `crit` text is pushed to `ns.safety` if the question was never asked (3958).

## Data, storage and network

| Kind | Detail |
|---|---|
| fetch / XHR | none in the range |
| localStorage / sessionStorage | none in the range |
| Timers, audio, history API | none in the range |
| Images | `post.img.key` and `scene` strings resolve into `NB_IMG` (data defined at 3440, outside the range) |
| JSON fields | none; all data is inline JavaScript, no `data/*.json` file is involved |

## Calculations and rules worth pinning with a golden-master test

| Name | Lines | Inputs | Outputs | Randomness / time |
|---|---|---|---|---|
| `drip` calc | 3143 | 1000 mL, 20 gtt/mL, 8 h; user answer | accepted answer 42 gtt/min, tolerance 2 (exact 41.7); explanation text | none |
| `fluids` calc | 3230 | 30 mL/kg, 70 kg; user answer | accepted answer 2100 mL, tolerance 50 | none |
| `news2` act result | 2896 (uses `nbNews2` 2654) | `ns.v` vitals | text «NEWS2 = n.» plus band message: >=7 emergency, >=5 urgent review, >=1 increase monitoring and inform doctor, else routine monitoring | none |
| `bp` act with prerequisites | 2951 | `ns.done` has `rest` and `cuff` | BP shown 162/98 when both done, otherwise 174/106 and `bp` removed from `done` | none |
| Order safety rule | 3798–3811 with data `ord.a` | choice 0/1/2 vs `ord.a` | safe order: only choice 0 correct; unsafe order: any choice except 0 correct (clarify=1 gets extra praise) | clock +1 min |
| Checklists `chk` (time-out, count) | 3360, 3366 | item marks | missing-defect items push `unsafe` text to safety list | none |
| Sequence `seq` (dressing) | 3031 | user order of steps, `extra` distractors with `unsafe` | correct/incorrect; safety text for wrong steps | shuffle order uses `Math.random` |
| Case data snapshot | 2902–3438 | none | per-case counts (see Features) and ids; a snapshot of the object (functions as markers) detects accidental data edits | none at definition |

## Problems

| severity | kind | evidence |
|---|---|---|
| high | dead-code | The only entry points to the nurse room are disabled: `nurseStart` returns at script.js:3888 (`navigateTo('home'); return;`), card renderers return at 4024, `#home-nurse` hidden at scope.css:31. About 540 lines of content (114 KB) plus the engine (3560–3890) are not usable by a student. The new ASP.NET site must decide whether to keep them. |
| medium | architecture | `nbOpenRoom` (2339) ignores the room id and always launches a random ER room, so `nbPickRooms` results for the nursing track (2264, 2270, 2050, 2354) point to rooms that cannot be opened. |
| medium | architecture | Content records hold executable closures: the four `rf` lambdas are at script.js:2896, 2951, 3271 and 3413 and read/write global `ns`. The data cannot be serialised to JSON or loaded from a server as is. |
| medium | maintainability | Hidden positional conventions: `nbSb` correct option always index 0, `ord.a===0` means safe, `levelLabel` Arabic text is the tier key (2476). Nothing validates them. |
| low | duplication | The same identity question `NQ('id'...)` appears 13 times and the allergy question 13 times (grep counts), with per-case wording; paracetamol act, SBAR skeleton (4 items, S/B/A/R) and `kind:'nurse'`, `deptName` repeat in every case. `NB_COMMON_ACTS` `vitals` is redefined in `nc_or_pacu` (3413). |
| low | dead-code | `nbHandoffNote` (2900) has no reference. |
| low | data-exposure | Answer keys (`ord.a`, `why`, `rep.o[0]`, `unsafe`, `calc.ans`) are shipped in the page source in plain text, so any learner can read them; acceptable only if the exam is not graded for certification. |
| low | maintainability | Three periop cases have no `scene`, and the image mapping lives in a separate table (`NB_CASE_IMG`, 3445), so a case id and its image can drift. |
| low | architecture | Load-time dependency on `nbSb`/`nbLab` in other ranges (2668, 3446): works only because function declarations are hoisted within one script. |

## Proposed source fragments

Cut points taken from `.work/script-cuts.txt` (2893, 2894, 2900, 2902 are valid starts; 2892 is the range start). Validated with `check-fragment.mjs`.

| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| 1 | nursing-content-helpers-and-common-acts.js | 2892–2901 | `NQ`, `NA` factories, `NB_COMMON_ACTS`, `nbHandoffNote` | domain |
| 2 | nursing-cases-data.js | 2902–3439 | `NB_NURSE_CASES` literal (13 cases) | domain (data) |

The data literal cannot be split further at a valid cut: no start line exists inside 2902–3439 (only 2902 is in the cut list). If the refactoring wants one file per case, the cut list needs to be extended with case boundaries (2904, 2933, 2970, 3013, 3049, 3089, 3127, 3167, 3209, 3254, 3297, 3336, 3394 are the key lines, but they are inside an object literal, so it would need a different method than concatenation).

## Open questions

1. Is the nursing room supposed to stay disabled in the new site? The guards at 3888 and 4024 and scope.css:31 suggest a deliberate removal on 2026-10-30, but no comment states the intent for the data.
2. Where does `nbOpenRoom` get used for nursing-track rooms, and is a random ER room the intended result for a nursing student (2339)?
3. The NEWS2 score itself is computed by `nbNews2` (2654, outside this range); its thresholds were not audited here.
4. Whether the `rf` at 3271 (recheck) and 3413 (pacu vitals) have side effects beyond text; not read in detail.
5. `NB_IMG` has keys or_preop, or_check, or_pacu (verified), so the OR image mapping resolves; the 3 periop cases simply have no `scene` field.
6. Are the clinical contents (doses, thresholds) reviewed by a clinician? Not determined from the code.
