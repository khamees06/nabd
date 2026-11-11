# er.js — source fragments

The browser receives these files joined in the order below as `/js/er.js`, between `_open.txt` (the file header and the opening of the wrapper function) and `_close.txt` (its closing line).
The code is the legacy `er.js`, cut at statement boundaries and otherwise unchanged; `ClientBundleBaselineTests` fails if the joined text differs from the legacy file by anything not listed in `tests/Nabd.Tests/LegacyBaseline/seams.json`.

The "layer" column says where each responsibility belongs in the layered design; it is the map for moving code out of the browser, one fragment at a time.

| file | legacy lines | layer | responsibility |
|---|---|---|---|
| 010-config-state.js | 12–33 | infrastructure + application state | First fragment (lines 1-11 are the bundle prefix). Endpoint and tuning constants, module state (D, E, api*, tickId, seen, roleWanted), role helpers NM and forNurse |
| 020-helpers.js | 34–60 | domain + presentation helpers | Shared helpers: $, esc, norm, clamp, pickOf, testOf, actOf, REAL, offInd, OFF_BADGE, clk, wordsIn, justGood |
| 030-vitals-model.js | 61–90 | domain | vitalsAt, modsNow, live: vitals from risk plus treatment modifiers |
| 040-monitor-paint.js | 91–123 | presentation | fix, wobble, paint (tiles and cuff cycle), vitalsLine, spokenVitals, window.nbErVitals limits |
| 050-risk-tick.js | 124–171 | domain + application | netRate and the per-frame tick orchestration |
| 060-stages-scheduler.js | 172–233 | domain + application | STAGES, stageCheck, nurseStage, worst, job scheduler later/soon |
| 070-alarm-tones.js | 234–255 | browser | Web Audio alarm tones (tone, alarm) |
| 080-chat-english-terms.js | 256–593 | presentation | chatEn rule list with both CHAT-EN markers, EN_WHO, shown |
| 090-feed-stream.js | 594–653 | presentation | Chat feed: bubbles, speaker wrappers, transcript and log append, typing dots |
| 100-server-client.js | 654–706 | infrastructure | Request state, timeouts, online/offline switching, call, ping, voice |
| 110-offline-models.js | 707–762 | infrastructure | Act and finding models: features, scoring, loading; fixed social replies |
| 120-dose-reading.js | 763–881 | domain | Keyword match, dose parsing, unit tables, dose-limit check, totals |
| 130-offline-answer.js | 882–974 | application | Verdict on the room's open question without the server |
| 140-order-lexicon.js | 975–1067 | domain | Order/negation/history vocabularies, mention positions, drug/test collision rules |
| 150-local-read.js | 1068–1369 | application | Reader normalisation helpers and localRead (full offline read of a message) |
| 160-nurse-read-patterns.js | 1370–1397 | domain | Nurse-mode phrase patterns, keyword and alias tables, firstP |
| 170-nurse-read-shape.js | 1398–1523 | application | nurseVocs, mentionedIds, openOrd, nurseShape: who a nurse message is for |
| 180-offline-supervisor-lines.js | 1524–1592 | application | Teaching-line rotation and offline supervisor reply |
| 190-offline-nurse-lines.js | 1593–1642 | application | Offline bedside-nurse reply, unplaced orders, risky-drug challenge, unknown drug name |
| 200-offline-result-status-lines.js | 1643–1715 | application | Result and status questions: analyte table, detection, spoken results |
| 210-offline-patient-lines.js | 1716–1781 | application | Plain-no topics, status/monitor/trend lines, patient feeling and identity lines |
| 220-offline-local-reply.js | 1782–1896 | application | localReply: offline reply selection for one reading |
| 230-message-intake.js | 1897–1973 | application | Message queue, send, handle: obtain the read and choose the reply source |
| 240-question-remind.js | 1974–2005 | domain | remind: policy for an unanswered open question |
| 250-question-wording-parking.js | 2006–2060 | domain + presentation | Proposal wording helpers, vague-order lines, drug families, hold/park/tail of older questions |
| 260-apply-read.js | 2061–2242 | application | apply (one read into state and output) and examine |
| 270-order-questions.js | 2243–2316 | domain | Acceptance words, openDoses, nextQuestion, dropNamed |
| 280-order-ask.js | 2317–2384 | domain | ask: open or queue one question with precedence rules |
| 290-order-safety-rules.js | 2385–2458 | domain | Allergy, off-case, too-early, route, repeat and cumulative-total rules |
| 300-nurse-scope-state-sbar.js | 2459–2536 | domain + application | Nurse mode: scope sets, thresholds, state factory, doctor wording, escalation deadline, SBAR grader |
| 310-nurse-message.js | 2537–2635 | application | One nurse-mode message: routing (handleNurse, escTurn) and apply's pre/post hooks (nursePre, helpCall, allergyAnswer, nursePost) |
| 320-nurse-escalation.js | 2636–2711 | domain | Escalation state machine: call, re-call, SBAR collection, finish, give-up, doctor's arrival |
| 330-nurse-clock-hooks.js | 2712–2745 | domain | Stage-rise and per-tick nurse rules (nurseStageRise, nurseTick) |
| 340-nurse-orders-release.js | 2746–2840 | domain | Doctor's orders: due/cancel rules, release with spoken line, the doctor's own steps |
| 350-nurse-scope-actions.js | 2841–2895 | domain | Judging a trainee action against nurse scope (nurseAct, basicAirway, ownOxygen) |
| 360-nurse-order-execution.js | 2896–2933 | domain | Executing an order as written: agentClash, sameDose, nurseExec |
| 370-nurse-given-tests-scope-gap.js | 2934–2992 | domain | Recording outcomes: nurseGave, nurseTest, scopeGap |
| 380-nurse-fixed-lines.js | 2993–3036 | presentation | Fixed doctor and instructor lines (DX_Q, docLine, instructorLine) |
| 390-nurse-orders-panel.js | 3037–3100 | presentation + application | Nurse mode chips, orders list rendering, click-to-execute, test tags, role switch |
| 400-order-intake.js | 3101–3219 | domain + application | order: checks on a treatment order before it is given; badDose; settle |
| 410-treatment-feedback.js | 3220–3282 | presentation | Delayed treatment response line, SPOKEN names, read-back and done-line batching |
| 420-give-treatment.js | 3283–3348 | domain | give: apply a treatment to the simulation state |
| 430-unsafe-and-harm.js | 3349–3397 | domain | Challenge of an unsafe order and the harm path |
| 440-resolve-pending.js | 3398–3486 | application | resolve: handle the answer to the open question |
| 450-tests.js | 3487–3557 | domain + application + presentation | Test ordering, indication, result card, read question |
| 460-companion-lines.js | 3558–3619 | application | Companion line gating and saying a line (lineOf, compPool, fresh, busyNow, compSay, compOn) |
| 470-director.js | 3620–3690 | application | Who speaks next: director and breakIn |
| 480-supervisor-and-arrest.js | 3691–3722 | application | Supervisor coach, key-step helpers (doneAs, keyMissing), arrest |
| 490-handover-sheet.js | 3723–3773 | presentation | Doctor handover sheet openEnd |
| 500-scoring.js | 3774–3827 | domain | Local grading, score, disposition rules and labels |
| 510-report-parts.js | 3828–3852 | presentation | Report building blocks: test rows, risk chart, time format, labels |
| 520-conclude-report.js | 3853–3954 | application | conclude: end of run, fail rules, debrief report |
| 530-nurse-handover-constants.js | 3955–3963 | presentation | SBAR box definitions, report section titles, orderedTest predicate |
| 540-nurse-handover-form.js | 3964–4012 | presentation | Handover dialog: render, validate, draft, submit and grade merge |
| 550-nurse-handover-grade.js | 4013–4030 | domain | Offline handover grade, false-claim check, key-step and key-order selectors |
| 560-nurse-score.js | 4031–4106 | domain | Seven-section nurse score and hard fails |
| 570-nurse-report.js | 4107–4230 | presentation | Nurse debrief report rendering and its buttons |
| 580-run-save.js | 4231–4254 | application | Save finished run (both roles) to user history and stats |
| 590-records-list.js | 4255–4303 | presentation | Investigations column: groups, filter/search state, card rendering, counter, go-to-result |
| 600-records-panel.js | 4304–4341 | presentation + application | Screen-width helpers, side panel switch, records sheet toggle, card click to order |
| 610-case-begin.js | 4342–4421 | application | begin: case choice, role, E creation, room reset, opening lines, clock loop |
| 620-brief-content.js | 4422–4513 | presentation | Briefing content: track lookup, role switch HTML, nurse and doctor briefing HTML |
| 630-brief-dialog.js | 4514–4562 | presentation + browser | Briefing dialog behaviour: keyboard, show (pause), close (resume), open test |
| 640-mount.js | 4563–4625 | presentation | One-time listener wiring and injected DOM parts |
| 650-back-button.js | 4626–4658 | browser | History entry, back-button handling, leave-page warning |
| 660-open.js | 4659–4694 | infrastructure + application | Loading cases and act model; open use case |
| 670-public-api.js | 4695–4705 | infrastructure | window.nbOpenER, window.nbErReport, window.__nbER; ends at 4705, line 4706 is the bundle suffix closing the wrapper |
