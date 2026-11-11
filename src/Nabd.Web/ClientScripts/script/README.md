# script.js — source fragments

The browser receives these files joined in the order below as `/js/script.js`.
The code is the legacy `script.js`, cut at statement boundaries and otherwise unchanged; `ClientBundleBaselineTests` fails if the joined text differs from the legacy file by anything not listed in `tests/Nabd.Tests/LegacyBaseline/seams.json`.

The "layer" column says where each responsibility belongs in the layered design; it is the map for moving code out of the browser, one fragment at a time.

| file | legacy lines | layer | responsibility |
|---|---|---|---|
| 010-case-card-images.js | 1–10 | infrastructure | CASE_IMAGES embedded JPEG data |
| 020-diagnostic-images.js | 11–12 | infrastructure | DIAG_IMAGES catalog (4 inline SVG, 2 file paths) |
| 030-department-and-workup-catalog.js | 13–213 | domain | DEPARTMENTS and GENERAL_WORKUP_CATALOG reference data |
| 040-clinical-cases-catalog.js | 214–687 | domain | CASES_DB seven cases |
| 050-case-workup-overrides-patch.js | 688–964 | domain | Load-time replacement of expectedWorkupIds and workupOverrides for six CASES_DB cases |
| 060-coach-modules-default.js | 965–1031 | domain | COACH_MODULES_DEFAULT data literal (teaching content) |
| 070-demo-accounts.js | 1032–1206 | infrastructure | DEMO_ACCOUNTS seed data literal |
| 080-professor-cohort-default-data.js | 1207–1673 | infrastructure | Seed literal PROFESSOR_COHORT_DEFAULT: seven demo student attempt records used as the default professor cohort (single array literal; no cut point exists between 1207 and 1674; check-fragment prints ok) |
| 090-session-state.js | 1674–1719 | domain + application | view sets, storage keys, authState, simState |
| 100-local-storage-store.js | 1720–1793 | infrastructure | localStorage + window.name store, case/account persistence |
| 110-password-hashing.js | 1794–1808 | browser | salt and PBKDF2 digest |
| 120-session-utilities.js | 1809–1850 | application | scratchpad, timestamp, toast, role label |
| 130-auth-shell-ui.js | 1851–1946 | presentation | apply auth state to shell UI |
| 140-view-navigation.js | 1947–2019 | application | navigateTo guard and section switching |
| 150-auth-session-modal.js | 2020–2122 | application | login, demo login, logout, auth modal |
| 160-level-quiz-data.js | 2123–2192 | domain | hints, levels, tips, question banks, placement keys |
| 170-landing-showcase.js | 2193–2222 | browser | landing carousel |
| 180-level-quiz-view.js | 2223–2261 | presentation | quiz render and start |
| 190-room-recommendation.js | 2262–2314 | domain | room picking and recommendations |
| 200-room-lists-and-filters.js | 2315–2343 | presentation | reco/room HTML, filters, open room |
| 210-level-quiz-result.js | 2344–2379 | domain + presentation | scoring, placement storage, result render |
| 220-registration-role-cards.js | 2380–2400 | presentation | registration role cards |
| 230-home-training-path.js | 2401–2460 | presentation | derived level, home path panel, sim hint |
| 240-tiers-and-cohorts.js | 2461–2496 | domain | cohorts, quiz host state, tier and lock rules |
| 250-osce-timer.js | 2497–2528 | browser | OSCE countdown |
| 260-report-history-hook.js | 2529–2555 | application | post-report history, compare, retry |
| 270-level-modal.js | 2556–2576 | presentation | level modal open/close |
| 280-mistakes-and-notes.js | 2577–2615 | presentation | mistake and note panels |
| 290-phase1c-bindings.js | 2616–2648 | presentation | event bindings for modal, OSCE, comments, invite |
| 300-tracks-guided-case-id.js | 2649–2653 | domain | Phase 1D banner comment and the id of the guided medicine case |
| 310-news2-score.js | 2654–2666 | domain | NEWS2 aggregate score from a vitals object |
| 320-isbar-item-builder.js | 2667–2669 | domain | Factory for one ISBAR handoff choice item |
| 330-expert-demos-data.js | 2670–2891 | domain | NB_DEMOS data literal (11 expert demonstrations) |
| 340-nursing-content-helpers-and-common-acts.js | 2892–2901 | domain | NQ, NA factories, NB_COMMON_ACTS, nbHandoffNote |
| 350-nursing-cases-data.js | 2902–3439 | domain | NB_NURSE_CASES literal with 13 cases |
| 360-nursing-image-catalogue.js | 3440–3440 | infrastructure | NB_IMG data literal |
| 370-nursing-image-helpers.js | 3441–3445 | presentation | nbImg, nbImgFail, case photo maps |
| 380-nursing-lab-doctor-views.js | 3446–3455 | presentation | lab factory, lab table, doctor card HTML |
| 390-track-and-learning-rules.js | 3456–3472 | domain | case lookup, track rule, learning rules |
| 400-observe-expert-view.js | 3473–3552 | presentation | observe session and rendering |
| 410-nurse-room-state-and-render.js | 3553–3614 | application | ns state, clock, bubbles, warn, monitor |
| 420-nurse-room-dock-and-actions.js | 3615–3687 | application | dock, ask matching, action dispatch/apply |
| 430-nurse-room-overlays.js | 3688–3764 | presentation | seq/calc/checklist overlays |
| 440-nurse-room-beat-flow.js | 3765–3885 | application | beats, orders, SBAR, handoff, prompts, hints |
| 450-nurse-room-start.js | 3886–3943 | application | nurseStart session and DOM |
| 460-nurse-room-finish.js | 3944–3987 | domain | nrFinish scoring/report, initNurse |
| 470-home-learning-and-track.js | 3988–4043 | presentation | learning path card, track home |
| 480-operating-room-cards.js | 4044–4062 | presentation | periop card list |
| 490-onboarding-level-prompt.js | 4063–4072 | application | nbMaybeOnboard |
| 500-auth-modal-steps.js | 4073–4091 | presentation | registration step, auth tab switch |
| 510-sidebar-and-account-menu.js | 4092–4130 | browser | sidebar and account dropdown |
| 520-home-dept-filter-bar.js | 4131–4160 | presentation | department tab bar rendering |
| 530-home-case-cards.js | 4161–4226 | presentation | count label and case card grid rendering with lock handling |
| 540-sim-progress-indicators.js | 4227–4264 | presentation | evidence counter, beginner steps bar, banner hide |
| 550-sim-session-start.js | 4265–4380 | application | start/restore simulation session and initial state |
| 560-sim-avatar-and-suggested-questions.js | 4381–4424 | presentation | avatar and suggested question chips |
| 570-sim-chat-turn-rules.js | 4425–4530 | domain | justification rule, question matching, chat turn with medication check |
| 580-sim-bidi-text-helpers.js | 4531–4547 | browser | Latin isolate/glue helpers and copy clean-up |
| 590-sim-chat-bubbles.js | 4548–4583 | presentation | chat bubble rendering |
| 600-sim-workup-catalog-ui.js | 4584–4640 | presentation | side tabs and workup catalog buttons |
| 610-sim-workup-result-card.js | 4641–4800 | presentation | workup result card with lab table, image, interpretation and justification forms |
| 620-sim-workup-request-rules.js | 4801–4968 | domain | workup request safety rules and requested-workup log |
| 630-medical-image-lightbox.js | 4969–5004 | presentation | Lightbox state (zoom, workup reference), zoom clamp, open and close |
| 640-sbar-handover-modal.js | 5005–5046 | presentation | Open the SBAR modal with the extra-workup justification inputs, close it |
| 650-session-finalize-and-report.js | 5047–5305 | application | Submit the session: read the form, classify, score, update and persist the account, render the report |
| 660-profile-view-render.js | 5306–5423 | presentation | renderProfileView |
| 670-profile-dashboard.js | 5424–5467 | presentation | nbDateOf, renderProfileDash, switchProfileSubTab |
| 680-university-portal-header.js | 5468–5490 | presentation | renderUniversityPortalByRole |
| 690-professor-cohort-store-and-tables.js | 5491–5592 | infrastructure + presentation | cohort storage and table rendering |
| 700-student-attempt-modal.js | 5593–5681 | presentation | attempt modal open/close and inspected id |
| 710-coach-mastery-store.js | 5682–5702 | infrastructure | coachRuntime and mastered-set storage |
| 720-coach-view-render.js | 5703–5780 | presentation | sidebar toggle and coach view render |
| 730-coach-chat-and-drill.js | 5781–5863 | presentation | chat bubbles and drill start |
| 740-coach-api-bridge.js | 5864–5896 | infrastructure | optional external API config and request |
| 750-coach-answer-evaluation.js | 5897–5944 | application + domain | submit handler and local keyword scoring |
| 760-supervisor-case-creation.js | 5945–6009 | application | create and persist custom case |
| 770-academic-foundation.js | 6010–6101 | domain | banner, storage access, section/course rules, ER case loader, case label |
| 780-academic-role-guide.js | 6102–6155 | presentation | open assigned case, role guide and hint |
| 790-academic-student-view.js | 6156–6227 | presentation | student assignments, results, notes, join form |
| 800-academic-professor-dashboard.js | 6228–6357 | presentation | stats, KPIs, courses, assignment list, progress |
| 810-academic-advisor-and-tabs.js | 6358–6422 | presentation | recommendations, advisor, render dispatch, tabs |
| 820-academic-event-wiring.js | 6423–6529 | presentation | nb8Init event wiring |
| 830-app-init-and-listeners.js | 6530–7118 | application | initNabdApp: session restore, section inits, all listeners including auth submit handlers |
| 840-app-bootstrap.js | 7119–7124 | browser | Run initNabdApp on DOMContentLoaded or immediately |
