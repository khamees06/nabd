# Phase 1D: two tracks (nursing / medicine), first part — script.js:2649–2891

Scope note: the unit that starts at line 2891 (banner comment of the nursing-room section, attached to `NQ` at 2892) is a pre-computed start line and belongs to the next area. The code of this area is lines 2649–2890; every line was read. Runtime facts below were taken from the page served at `http://127.0.0.1:5180/` with `tools/legacy/browser-probe.mjs` (demo sign-ins `rana`, `med_student`, `doctor`).

## Purpose

The range opens "Phase 1D" (learning path "observe → guided → direct" for two tracks, nursing and medicine; banner at 2649–2651). It declares four globals: the id of the guided medicine case (`NB_MED_GUIDED_ID`), a NEWS2 early-warning score function (`nbNews2`), a one-line factory for ISBAR handoff choice items (`nbSb`), and `NB_DEMOS`, a data literal of 11 scripted "watch an expert" demonstrations (6 nursing, 5 medicine; 106 steps; 22 check questions). The range contains no DOM access, no storage, no network, no timers. All consumers are elsewhere in `script.js` (2281, 2536, 2896, 2926–3436, 3470–3542, 3682, 3993–4003). Every user-visible path that consumes these declarations is closed in today's UI (by `scope.css` and by early-return guards), although part of the code still executes on each home render.

## Features and user journeys implemented here

The range holds data and pure functions only; the journeys are completed by code in other ranges. Reachability is that of the whole journey.

| # | Feature (what the user would see) | Part held in this range | Reachability | Evidence |
|---|---|---|---|---|
| 1 | "شاهد خبيراً" expert demo library: step 1 of the learning path. A card grid of demos for the user's track; a demo plays as a stream of scene / nurse / patient / doctor / action / thinking bubbles, images, vitals panels and lab tables, each with a "why" note, then two multiple-choice questions; completion is recorded in `user.learn.obs`. | `NB_DEMOS` (2671–2889) | dormant | (a) `scope.css:31` hides `#home-learn` with `display:none !important`. Runtime: for `rana` and `med_student` the box has no `hidden` class but computed `display` is `none`; 6 and 5 demo buttons are rendered into the hidden DOM by `renderLearnPath` (3989–4003). (b) `obsStart` (3475) begins with `navigateTo('home'); return;` (3476), so line 3477 (`NB_DEMOS[id]`) is never executed. (c) `'observe'` is in `REMOVED_VIEWS` (1678) and `navigateTo` redirects it to home (1949). Runtime: clicking a hidden demo button, calling `obsStart('demo_n_bp')` and calling `navigateTo('observe')` all leave `currentView === 'home'`, `obs` unchanged, `#view-observe` hidden. |
| 2 | Track filter of the demo library (nursing users see nursing demos, medicine users see medicine demos, professor sees none). | `track` field of each demo | dormant (executes, output hidden) | `nbDemosFor` (3471) is called by `renderLearnPath` (3993) on every home render. Runtime: `rana` → 6 ids, `med_student` → 5 ids, `doctor` → 0. Output goes to hidden `#home-learn`. |
| 3 | Guided medicine case: step 2 of the learning path ("جرّب حالة موجّهة") opens case `case_ortho_htn` with hints. | `NB_MED_GUIDED_ID` (2652) | dormant | Button rendered at 4001 inside hidden `#home-learn`; its handler calls `startSimulationSession(id, false, true)` (4006), which returns home at 4266 (`goToSim && !isEmergencyMode`). Runtime: `startSimulationSession(NB_MED_GUIDED_ID, false, true)` leaves view `home`, `#view-sim` hidden. |
| 4 | Guided case excluded from the recommended-cases list on the home page. | `NB_MED_GUIDED_ID` | dormant (executes, output hidden) | `nbPoolFor` (2281) ← `nbRecommend` (2288) ← `renderHomePath` (2435). Runtime: pool for `med_student` has 6 cases and does not contain `case_ortho_htn`; target `#path-rooms` is not visible (ancestor `.nb-path-card` has `display:none`, `scope.css:33`). |
| 5 | Guided case completion recorded when its report scores 50 or more. | `NB_MED_GUIDED_ID` | dormant | `nbAfterReport` (2536) is called only from the old simulator report (5165). `'sim'` is in `REMOVED_VIEWS` (1678); start guard at 4266. Whether the session-restore call at 6551 (`goToSim = false`, bypasses 4266) can still lead to a report: not determined. |
| 6 | NEWS2 score in the nursing room: action "حساب مؤشر الإنذار المبكر NEWS2" answers with the score and an urgency band, and the monitor shows a NEWS2 cell. | `nbNews2` (2654–2665) | dormant | Callers: 2896 (`NB_COMMON_ACTS` item `news2`, field `rf`) and 3682 (`nrApply`). The nursing room cannot be entered: `nurseStart` (3887) begins with `navigateTo('home'); return;` (3888); `'nurse'` is in `REMOVED_VIEWS`. Runtime: `nurseStart('nc_fever')` leaves view `home` and `ns === null`. The function itself remains callable (`typeof window.nbNews2 === 'function'`). |
| 7 | ISBAR handoff quiz in the nursing room (S / B / A / R choice items). | `nbSb` (2668) | dormant (factory runs at load, UI closed) | 52 calls inside `NB_NURSE_CASES` `handoff.items` (2926–3436, 13 cases × 4) run when the script loads. The items are consumed by the handoff stage (3829–3862), reachable only through `nurseStart` (guard at 3888). |

Searches run for each name: `grep -n "<name>" *.js index.html` in the checkout root (script.js, er.js, resp.js, ui.js, motion.js, terms.js, index.html). None of the four names appears outside `script.js`; none appears in an inline handler in `index.html`.

## Declarations

| name | lines | kind | responsibility | layer | shared state read / written | called from |
|---|---|---|---|---|---|---|
| `NB_MED_GUIDED_ID` | 2652 | `const` string (`'case_ortho_htn'`) | Names the one `CASES_DB` case used as the guided step of the medicine track | domain (learning-path rule, configuration) | reads none; writes none | `nbPoolFor` 2281; `nbAfterReport` 2536; `nbGuidedId` 3470 |
| `nbNews2(v)` | 2654–2665 | function declaration, pure | Sum of six NEWS2 sub-scores (respiratory rate, SpO2, systolic BP, pulse, consciousness, temperature) from a vitals object | domain (clinical calculation) | reads only its argument (`v.bp`, `v.rr`, `v.spo2`, `v.hr`, `v.temp`, `v.avpu`); writes none | `NB_COMMON_ACTS` item `news2` 2896; `nrApply` 3682 (with `ns.v`) |
| `nbSb(label, opts, why)` | 2668 (comment 2667) | function declaration, pure factory | Returns `{ q: label, o: opts, a: 0, why: why \|\| '' }`: one ISBAR choice item whose correct option is always index 0 | domain (content construction) | none (keeps `opts` by reference) | 52 calls in `NB_NURSE_CASES` 2926–3436 |
| `NB_DEMOS` | 2671–2889 (comment 2670) | `const` object literal, 11 entries | Scripted expert demonstrations keyed by id | domain content data (static teaching content; to be supplied by infrastructure in a layered design) | initialiser calls `nbLab` (3446) 29 times at script load; writes none; not frozen | `nbDemosFor` 3471; `obsStart` 3477 (unreachable line) |

Entries of `NB_DEMOS` (key = `id`, verified equal for all):

| id | lines | track | icon key | steps | check questions |
|---|---|---|---|---|---|
| `demo_n_bp` | 2672–2692 | nursing | `bp` | 11 | 2 |
| `demo_n_sugar` | 2693–2712 | nursing | `gluco` | 10 | 2 |
| `demo_n_fever` | 2713–2734 | nursing | `thermo` | 12 | 2 |
| `demo_n_bleed` | 2735–2755 | nursing | `nc_bleed` | 11 | 2 |
| `demo_n_labs` | 2756–2773 | nursing | `nc_iv` | 8 | 2 |
| `demo_n2` | 2775–2797 | nursing | `nc_wound` | 13 | 2 |
| `demo_m_fever` | 2798–2817 | medicine | `cxr_pneu` | 10 | 2 |
| `demo_m_htn` | 2818–2836 | medicine | `bp` | 9 | 2 |
| `demo_m_dm` | 2837–2854 | medicine | `gluco` | 8 | 2 |
| `demo_m_bleed` | 2855–2871 | medicine | `nc_bleed` | 7 | 2 |
| `demo_m_cxr` | 2872–2888 | medicine | `cxr_normal` | 7 | 2 |

## Shared state, globals and contracts

Defined for others:

| Global | Binding | Visible as `window.*` | Used by |
|---|---|---|---|
| `NB_MED_GUIDED_ID` | global lexical (`const`) | no (verified `undefined`) | script.js 2281, 2536, 3470 |
| `nbNews2` | function declaration | yes | script.js 2896, 3682 |
| `nbSb` | function declaration | yes | script.js 2926–3436 |
| `NB_DEMOS` | global lexical (`const`) | no (verified `undefined`) | script.js 3471, 3477 |

Shape of a demo (all 11 have exactly these fields, in this order): `id`, `track` (`'nursing'` or `'medicine'`), `icon` (key of `NB_IMG`), `title`, `who`, `sub`, `steps[]`, `check[]`.

Step shapes (field `w` selects the renderer in `obsNext`, 3494–3520):

| `w` | count | fields | consumer |
|---|---|---|---|
| `sys`, `nurse`, `action`, `think` | 13, 15, 13, 5 | `t`, `why` | text bubble, label by `w` (3508–3513) |
| `doctor` | 28 | `t`, `why` (2 steps have no `why`) | text bubble |
| `patient` | 6 | `t` (never `why`) | text bubble; "why" panel falls back to a default string (3517) |
| `image` | 11 | `key` (key of `NB_IMG`), `cap`, `why` | `nbImg` (3441) |
| `vitals` | 7 | `v` `{hr, bp, rr, spo2, temp[, bg]}`, `why`, optional `t` (1 step) | vitals grid with `NR_VN` labels and `nrWarn` (3502–3506) |
| `labs` | 8 | `labs` `{title, rows[]}`, `why`; row = `{n, v, u, ref, flag}` built by `nbLab`; `flag` is `'H'`, `'L'` or `''` (29 rows) | `nbLabsTable` (3447) |

Check question shape: `{ q, o[4], a }` (`a` = index of the correct option; all 22 have 4 options).

Expected from others:

| Dependency | Where defined | Note |
|---|---|---|
| `nbLab(n, v, u, ref, flag)` | script.js 3446 | Called while the `NB_DEMOS` initialiser runs (2727, 2748, 2761, 2766, 2808, 2827, 2845, 2862). Defined 775 lines later; works through function hoisting inside the same classic script. |
| `NB_IMG` keys `bp`, `gluco`, `thermo`, `cxr_pneu`, `bandage`, `steth`, `ecg`, `cxr_normal`, `nc_bleed`, `nc_iv`, `nc_wound` | script.js 3440 | All 11 keys exist (verified at runtime). |
| `CASES_DB['case_ortho_htn']` | script.js 367 | Exists (verified at runtime). |
| `nbNews2` input contract | callers | `bp` as string `'systolic/diastolic'`; `rr`, `spo2`, `hr`, `temp` numeric; `avpu` one of `A`, `C`, `V`, `P`, `U`. Initial vitals of all 13 nursing cases carry all six keys (verified). Demo `vitals` steps have no `avpu`. |
| Consumers shuffle `nbSb` items | script.js 3843 (`nbShuffle`) | `nbSb` fixes `a: 0`; display order must be randomised by the consumer. |

Persistence contract created by the ids: demo ids are stored in `user.learn.obs` (3537) and the guided case id in `user.learn.guided` (2536; nursing equivalent at 3969). `user.learn` is saved with the account object through `saveAccountToStorage` (1787–1791) under localStorage key `nabd_v2_accounts_map`. Renaming a demo id or changing `NB_MED_GUIDED_ID` therefore affects stored progress.

DOM ids: none are read or written in this range.

## Data, storage and network

| Kind | In this range |
|---|---|
| fetch / XHR | none |
| localStorage / sessionStorage | none (indirect: ids persisted by consumers, see above) |
| JSON files | none read |
| Timers | none |
| Audio, history API, focus, animation | none |
| Randomness, clock | none |
| Images | Indirect: `icon` and `image.key` resolve through `NB_IMG` to `img/nb/*.jpg`. No `img/nb/` request was recorded while the learning path is hidden (resource timing entries after three demo sign-ins). |

`NB_DEMOS` size: 41,207 bytes of source (2670–2890); `JSON.stringify(NB_DEMOS)` is 25,085 characters (39,149 UTF-8 bytes). The literal contains no `<`, `>`, `&` or backtick characters. Content is Arabic teaching text about invented patients; no secrets, keys, URLs or real personal data were found.

## Calculations and rules worth pinning with a golden-master test

No randomness and no time enter any item below.

**1. `nbNews2(v)` (2654–2665).** Input: vitals object. Output: integer 0–18 (verified maximum 18). Sub-scores as coded and as observed in the running page:

| Parameter | Source | Bands (value → points), boundaries verified |
|---|---|---|
| Respiratory rate | `v.rr` | ≤8 → 3; 9–11 → 1; 12–20 → 0; 21–24 → 2; ≥25 → 3 |
| SpO2 | `v.spo2` | ≤91 → 3; 92–93 → 2; 94–95 → 1; ≥96 → 0 |
| Systolic BP | `parseInt(String(v.bp).split('/')[0], 10)` | ≤90 → 3; 91–100 → 2; 101–110 → 1; 111–219 → 0; ≥220 → 3 |
| Pulse | `v.hr` | ≤40 → 3; 41–50 → 1; 51–90 → 0; 91–110 → 1; 111–130 → 2; ≥131 → 3 |
| Consciousness | `v.avpu` | truthy and not `'A'` → 3; `'A'`, `''`, `undefined` → 0 |
| Temperature | `v.temp` | ≤35.0 → 3; 35.1–36.0 → 1; 36.1–38.0 → 0; 38.1–39.0 → 1; ≥39.1 → 2 |

Edge behaviour to pin (observed): `nbNews2({})` = 11; missing `rr` → +3; missing `bp` → +3 (NaN falls to the last branch); missing `hr` → +3; missing `temp` → +2; missing `spo2` → 0; missing `avpu` → 0; numeric strings behave as numbers (`{hr:'112', bp:'104/68', rr:'20', spo2:'98', temp:'36.7'}` → 3); `bp` given as the number 85 → sub-score 3; extra keys (for example an oxygen flag) are ignored.

Fixture vectors available in the code base:

| Fixture | Expected |
|---|---|
| Seven `vitals` steps of `NB_DEMOS`, in order (`demo_n_bp`, `demo_n_sugar`, `demo_n_fever`, `demo_n_bleed`, `demo_m_fever`, `demo_m_htn`, `demo_m_dm`) | 0, 1, 6, 3, 6, 0, 1 |
| Initial `vitals` of the 13 `NB_NURSE_CASES`, in declaration order (`nc_vitals_basic` … `nc_or_pacu`) | 0, 0, 3, 2, 6, 1, 3, 4, 15, 2, 0, 0, 8 |

The demo text at 2720 states the breakdown "2 + 1 + 1 + 2 = 6" for the vitals at 2719; the function returns 6 for them.

**2. `nbSb(label, opts, why)` (2668).** Output `{q, o, a: 0, why}`; `why` defaults to `''`; `o` is the same array object as `opts` (verified).

**3. `NB_DEMOS` structural snapshot.** Key order: `demo_n_bp, demo_n_sugar, demo_n_fever, demo_n_bleed, demo_n_labs, demo_n2, demo_m_fever, demo_m_htn, demo_m_dm, demo_m_bleed, demo_m_cxr`. Steps per demo: 11, 10, 12, 11, 8, 13, 10, 9, 8, 7, 7 (total 106). Correct-answer indices per demo: `11 11 11 11 11 11 11 10 01 11 11`. SHA-256 of `JSON.stringify(NB_DEMOS)` as UTF-8 in the running page: `1d36d51eb8d63fe64f45d8fe8ced9293459abdc1650e9eb1e5286d7a48c4aa92`.

**4. `NB_MED_GUIDED_ID`.** Value `'case_ortho_htn'`; must be a key of `CASES_DB`; `nbPoolFor` for a medicine user must not contain it (6 cases observed).

## Problems

| severity | kind | evidence with line numbers |
|---|---|---|
| medium | bug | `nbNews2` (2654–2665) scores six parameters. The published NEWS2 chart has a seventh, "air or oxygen" (+2 on supplemental oxygen), and a second SpO2 scale; neither exists here. `ns.v` never carries an oxygen field: case vitals keys are `hr, bp, rr, spo2, temp, avpu[, bg]` and the only patches in 2891–3440 change `bg`, `bp`, `hr`, `rr`, `spo2`, `avpu`. Case text at 3082 reports "NEWS2 = 6" for a patient on oxygen 2 L/min. Not visible today (nursing room closed, 3888). |
| medium | bug | `nbNews2` does not validate input: a missing or non-numeric value falls into the last branch of each ternary chain (2658, 2660, 2661, 2663) and scores as the most abnormal band, except SpO2 and AVPU which score 0. `nbNews2({})` returns 11. Current callers pass complete vitals, so there is no visible effect now. |
| medium | dead-code | `NB_DEMOS` (2671–2889, 41 KB of source) is built on every page load, with 29 `nbLab` calls, for a feature that cannot be opened: `obsStart` returns at 3476 before reading it and `#home-learn` is hidden by `scope.css:31`. `renderLearnPath` still renders 5 or 6 demo buttons into the hidden DOM on each home render (4000). |
| medium | architecture | Load-order coupling by hoisting: the `NB_DEMOS` initialiser calls `nbLab`, declared at 3446. This works only while both live in one classic script. If the fragment holding `NB_DEMOS` were ever loaded as a separate script or module ahead of the fragment holding `nbLab`, loading would stop with a ReferenceError. |
| low | architecture | Teaching content (25,085 characters of JSON) is embedded in code as a mutable global (`Object.isFrozen(NB_DEMOS)` is false) and its ids double as persisted progress keys (`user.learn.obs`, 3537). |
| low | duplication | The same scenario facts are written two or three times. Inside `NB_DEMOS`: identical vitals objects at 2719 / 2803 and 2700 / 2843; identical lab row sets at 2727 / 2808 and 2748 / 2862. The same patients are described again in `NB_NURSE_CASES` (for example 2963–2965, 3006–3008, 3082–3084, 3120–3122). A correction in one copy does not reach the others. |
| low | duplication | Systolic parsing `parseInt(String(…).split('/')[0], 10)` exists at 2655 and again in `nrWarn` (3590). NEWS2 urgency bands are stated in three places: reply text at 2896 (≥7, ≥5, ≥1), glossary at `motion.js:202` (0–4, 5–6, ≥7) and demo text at 2720, which says "above 7" for the emergency band while the code uses ≥7. |
| low | maintainability | Check questions are positionally predictable: 20 of 22 have `a: 1` and `obsShowCheck` (3524) renders options in stored order without shuffling. |
| low | maintainability | `nbSb`: the comment at 2667 ("each arg: [correct, wrong1, wrong2, wrong3]") does not match the signature `(label, opts, why)`; correctness depends on the convention that option 0 is right and on the consumer shuffling (3843); the item aliases the caller's array. |
| low | maintainability | Content inconsistencies in the demo text: scene narration at 2822 switches to first person; `demo_m_fever` relies on a penicillin allergy at 2810 and in the question at 2815 although no step states it (2805 only says the doctor asks); `demo_n_bleed` names a male nurse at 2736 while 2746, 2747 and 2753 use feminine forms. |

No security or data-exposure problem was found in this range: all strings are static literals and none contains HTML metacharacters.

## Proposed source fragments

All four ranges were validated with `node tools/legacy/check-fragment.mjs script.js 2649-2653 2654-2666 2667-2669 2670-2890` (all `ok`). Start lines 2649, 2654, 2667 and 2670 are in `.work/script-cuts.txt`; the next start line is 2891 (next area).

| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| 1 | `tracks-guided-case-id.js` | 2649–2653 | Phase 1D banner comment and the id of the guided medicine case | domain |
| 2 | `news2-score.js` | 2654–2666 | NEWS2 aggregate score from a vitals object | domain |
| 3 | `isbar-item-builder.js` | 2667–2669 | Factory for one ISBAR handoff choice item | domain |
| 4 | `expert-demos-data.js` | 2670–2890 | `NB_DEMOS` data literal (11 expert demonstrations) | domain content data |

Three fragments are far below the 40-line target because the only permitted start lines inside the range are 2654, 2667 and 2670 and the three small declarations are unrelated. If fewer files are preferred, 2649–2669 also compiles as one unit (validated `ok`, 21 lines); it would mix a configuration constant, a clinical calculation and a content factory.

Constraint for the bundle: fragment 4 must stay in the same concatenated script as the fragment that declares `nbLab` (line 3446).

## Open questions

1. Is the learning path (expert demos, guided case) to be carried into the new host as dormant code, moved to a content file, or removed? `NB_DEMOS` and `NB_MED_GUIDED_ID` have no visible effect today.
2. When `nbNews2` is ported to the domain layer, must it keep today's behaviour exactly (six parameters, no input validation), or should the oxygen parameter and validation be added as a separate, reviewed change after the golden master is in place?
3. The assigned range ends at 2891, but 2891 is the first line of the next unit (comment attached to `NQ`, 2892). This report assigns it to the next area; confirm that the neighbouring report starts at 2891.
4. The clinical accuracy of the 11 demos (doses, thresholds, reference ranges) was not reviewed; it needs a clinician.
5. Whether any existing browser profile holds `user.learn.obs` or `user.learn.guided` entries (which would make the demo ids and the guided id a compatibility constraint): not determined.
6. Whether the session-restore call at 6551 can still lead to `nbAfterReport` (2536) in today's UI: not determined.
