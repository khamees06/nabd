# Requirements

This document lists what the system must do and what it must keep. The requirements are recovered from two places:
the behaviour of the legacy site as the audit found it, and the refactoring brief as the project documents record it.
No product wish is added here.

Where a fact could not be determined from the sources, the text says "not determined".

## Purpose and users

Nabd («نَبْض الأردن») is an Arabic clinical-simulation trainer. A trainee manages an emergency patient in a
chat-driven room. The trainee talks to the patient and the relative, gives orders to a nurse, reads a monitor, orders
tests, hands the patient over and receives a scored report ([README.md](../README.md)).

| User | What the user does | Source |
|---|---|---|
| Medical student | Runs ER cases as the doctor, reads the report, sees progress in the profile, opens cases assigned by a professor | [34-feature-reachability](legacy-audit/34-feature-reachability.md) |
| Nursing student | Runs ER cases as the bedside nurse (the role follows the account's track), hands over to the doctor in SBAR form | [34-feature-reachability](legacy-audit/34-feature-reachability.md), [17](legacy-audit/17-er-nurse-message-escalation-orders.md) |
| Professor (supervisor) | Assigns ER cases to course sections, reads a demo cohort table, publishes grades, exports CSV | [03](legacy-audit/03-script-cohort-defaults.md), [11](legacy-audit/11-script-academic-a.md) |
| Maintainer | Builds, tests and extends the .NET solution | [setup.md](setup.md) |

Training-only statement, which every presentation of the system must keep:

- The clinical content of the cases was written for training and has **not been reviewed by a physician**. The data
  file says so itself (`reviewed: false`) and a test pins it (`The_clinical_content_is_reported_as_not_reviewed_by_a_physician`).
- The system does not diagnose or treat real patients and must not be presented as doing so.
- The sign-in is not a security boundary. Accounts, grades and reports in the professor portal are demo data held in
  one browser ([decision 0008](decisions/0008-no-database-and-no-authentication-in-this-phase.md)).

## Sources of these requirements

| Source | What it gives | Where |
|---|---|---|
| Legacy behaviour as audited | The functional requirements and the clinical rules. 34 audit parts cover scripts, markup, styles, data, the two external services, the existing tests and feature reachability. A feature is "live", "dormant" or "unreferenced" according to what was verified in the running legacy page | `docs/legacy-audit/NN-*.md`, `.work/docs/audit-structured.json` |
| Frozen legacy baseline | The definition of "unchanged": the page, six scripts and nine stylesheets from commit `5f431d5` of `main`, plus a manifest of all 85 files | `tests/Nabd.Tests/LegacyBaseline/` ([testing-strategy.md](testing-strategy.md)) |
| Refactoring brief, as recorded | Exactly five projects on ASP.NET Core MVC with Clean Architecture; frozen user interface; zero regression; data and models not rebuilt; external services behind application contracts; architecture prepared for a multi-agent system without implementing it | [decision 0001](decisions/0001-clean-architecture-in-five-projects.md), [0002](decisions/0002-lossless-strangler-migration.md), [0005](decisions/0005-legacy-data-behind-repositories.md), [0006](decisions/0006-understanding-services-through-a-gateway.md), [0009](decisions/0009-multi-agent-contracts-only.md) |
| Architecture and testing documents | What is done, what runs where, what is not covered | [architecture.md](architecture.md), [testing-strategy.md](testing-strategy.md) |

The brief itself is not in the repository. Its content here is only what the documents above state.

## Functional requirements

Status values:

- **Preserved**: the legacy client runs unchanged in the browser. The server serves it byte for byte, except for the
  registered differences.
- **Preserved and also implemented server-side**: as above, and the rule also exists in `Nabd.Domain` or
  `Nabd.Application`, tested. The room in the browser does not call the server implementation yet.
- **Dormant**: the code is in the delivered files, but the legacy UI makes it unreachable (a view in `REMOVED_VIEWS`,
  a CSS rule that hides it, or an early return). The code is preserved so that it can be re-enabled.

Audit references such as "34" mean `docs/legacy-audit/34-feature-reachability.md`.

### Landing, sign-in, home

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-1 | A visitor sees a landing page. Any protected view requested while signed out opens the sign-in page with a notice | Preserved | Audit 34 (matrix, "Visitor landing"); `The_page_is_the_legacy_page` |
| FR-2 | A visitor can register an account on the device: name, e-mail, password of 8 or more characters, a role card (nursing, medicine, supervisor), then year, section code, university. The account is kept in `localStorage` | Preserved | Audit 34 ("Sign-in and registration"), audit 12 |
| FR-3 | A visitor can sign in with a stored account. A wrong password shows an error and stays on the sign-in page | Preserved | Audit 34 |
| FR-4 | Three demo accounts sign in with one click: a nursing student (`rana`), a medical student (`med_student`), a professor (`doctor`). The landing button "try an ER case" signs in `med_student` and opens the ER briefing | Preserved | Audit 02 (table rows 1-3), audit 34 |
| FR-5 | A demo learner gets a stored placement so that no level quiz interrupts. A demo session is not restored after a reload | Preserved | Audit 02 (rows 3 and 5; row 5 from code reading) |
| FR-6 | Two further demo accounts (`ahmed_y1`, `practitioner`) exist in the script. No control signs in with them | Dormant | Audit 02 (row 13, "unreferenced") |
| FR-7 | The home page differs by role. A student sees the welcome card, the ER entry card, the training-path card, the guide "what to do now" and the university assignments. A professor sees the professor dashboard | Preserved | Audit 25, audit 34 (matrix rows "Home") |
| FR-8 | The home page shows seven further specialty cards as locked placeholders with no code behind them | Dormant | Audit 34 (matrix) |
| FR-9 | Sign-out returns to the landing page | Preserved | Audit 04 (`logoutUser`) |

### ER room, doctor role

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-10 | The trainee enters the ER room from the home page, the landing page, the footer, an assignment card or the `?case=` parameter. A case is chosen by id or at random without repeats | Preserved | Audit 21 (`open`, `begin`), audit 34 |
| FR-11 | A briefing dialog opens first, in a doctor version and a nurse version. The clock is paused while it is open. The help button reopens it | Preserved | Audit 21 (briefing rows) |
| FR-12 | The role (doctor or nurse) can be switched in the briefing only, before the first turn | Preserved | Audit 18 (`canSwitch`), audit 34 |
| FR-13 | The room offers six cases: asthma, sepsis, pulmonary embolism, STEMI, DKA, hypertensive emergency | Preserved and also implemented server-side | `The_file_gives_six_cases_and_the_shared_catalog`; audit 30 |
| FR-14 | The trainee types free text to the patient, the relative, the nurse and the supervisor. Replies appear as chat bubbles with a speaker label. Messages are handled in a queue, one at a time, with typing dots while waiting | Preserved | Audit 14, audit 16 |
| FR-15 | The patient and the relative answer history questions. The room counts the red-flag facts obtained. Physical-examination findings are shown and logged | Preserved | Audit 16 (`apply`, `examine`) |
| FR-16 | The relative's anxiety and the trainee's communication (introduction, explanation, empathy, rude or jargon remarks) change with each message and are scored | Preserved and also implemented server-side (the score part) | Audit 16; `CommunicationRecord` in `SessionScorer.Score` |
| FR-17 | A monitor shows heart rate, oxygen saturation, respiratory rate, blood pressure and temperature. The blood-pressure cuff measures on a cycle and shows the age of the reading. Tiles show warning limits. Optional alarm tones | Preserved and also implemented server-side (values and cuff) | Audit 13; `The_stage_follows_the_risk_up_and_the_cuff_measures_when_the_patient_gets_sick` |
| FR-18 | The trainee gives treatment orders in free text. The room checks prerequisites, allergy, timing ("too early"), repeats, gaps and maximum doses, and asks "which drug and how much?" when an order lacks a dose | Preserved | Audit 16, audit 18 (`order`) |
| FR-19 | Dose questions and safety challenges: bundled dose proposals with "yes to all" or dropping one named drug; challenges for allergy, off-case drugs, too-early orders, repeat or maximum dose, cumulative total, and IV-push adrenaline. A second fluid bolus can be deferred | Preserved | Audit 16 (rows "Bundled dose proposals", "Safety challenges", "Deferred second fluid bolus") |
| FR-20 | An unsafe order the trainee insists on is carried out as a harm and raises the risk a moment later. An allergic drug can cause anaphylaxis | Preserved and also implemented server-side (the effect of a harm; the decision that an order is unsafe stays in the browser) | Audit 18 (`unsafe`, `harm`); `A_harm_raises_the_risk_a_moment_after_the_order_and_is_not_a_step_done`, `Anaphylaxis_stops_short_of_arrest_and_adrenaline_treats_it` |
| FR-21 | The trainee orders tests from a list of 22 cards (bedside, lab, imaging) with filter and search. Results return after a delay as a result card. An out-of-indication test needs a written justification of at least three words. The supervisor may ask for a reading, at most three times | Preserved and also implemented server-side (ordering and indication; the result values are not mapped on the server) | Audit 21 (investigations rows), audit 18 (`orderTest`), audit 19; `A_test_that_is_safe_at_first_becomes_harmful_once_the_pressure_has_fallen` |
| FR-22 | The patient deteriorates in four stages (calm, watch, urgent, critical) as the risk rises. Each stage change produces an alarm line and lines from the nurse, patient, relative and companion. An improvement event produces a reading with the better numbers | Preserved and also implemented server-side (stages) | Audit 13; `The_stage_follows_the_risk_up_and_the_cuff_measures_when_the_patient_gets_sick` |
| FR-23 | A reasonable treatment slows the risk after its onset time. Some cases have a "hold" (sepsis, DKA) in which supportive care holds the patient but only the specific treatment turns the case round | Preserved and also implemented server-side | Audit 13; `A_treatment_slows_the_risk_only_after_its_onset`, `Supportive_care_holds_a_septic_patient_but_only_the_antibiotic_turns_him_round` |
| FR-24 | The STEMI case can show ventricular tachycardia in the critical stage; the planned collapse of a case needs its rescue treatment | Preserved and also implemented server-side | Audit 13; the three rescue traces in `ErClinicalTraceTests` |
| FR-25 | At a risk of 100 the patient arrests, the clock stops and the room goes to the report | Preserved and also implemented server-side | Audit 19; `At_a_risk_of_100_the_patient_arrests_and_the_session_ends` |
| FR-26 | A companion (a classmate-type voice) breaks in on alarms, worsening, improvement and lulls, and comments on orders and tests. A supervisor speaks when called, after a harm and at the urgent or critical stage. Once, the supervisor nudges the trainee towards handover | Preserved | Audit 19, audit 13 |
| FR-27 | Handover: the trainee ends the case with a sheet holding the diagnosis, the destination and an SBAR text. The draft is kept if the sheet is closed. The grade of the diagnosis and SBAR comes from the understanding service, with a local keyword grade as fallback | Preserved and also implemented server-side (destination verdict; the grade is an input) | Audit 19 (handover rows), audit 31 (grade mode); `A_dangerous_destination_fails_the_session_whatever_the_score` |
| FR-28 | The report shows the total out of 100, pass or fail with reasons, six score parts, a risk chart, what went well, what must change, a tests table and buttons for home, the same case again and the next case. The run is saved to the account's history. The report can be reopened until the next case starts | Preserved and also implemented server-side (score, parts, verdict, report view) | Audit 19 (`conclude`), audit 34; `A_well_managed_case_is_handed_over_stable_and_passes`, `A_report_is_refused_until_the_session_is_completed` |

### ER room, nurse role

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-29 | A nursing student enters the ER as the bedside nurse. The briefing names the nursing supervisor. The nurse acts on the doctor's orders held in the case data, shown in an orders panel with state chips. A click on an order row carries it out | Preserved | Audit 17, audit 18 (`buildOrders`, `execOrder`), audit 34 |
| FR-30 | The nurse reports to the doctor by phone in SBAR form. The doctor asks one clarifying question, nags and then comes without an SBAR if none is given, and may hold drug orders with an allergy question. The doctor arrives at the bedside on request or on a monitor alarm | Preserved | Audit 17 (escalation rows) |
| FR-31 | Actions outside the nurse's scope are refused. The instructor gives once-only nudges | Preserved | Audit 17 (`scopeGap`, instructor rows) |
| FR-32 | The nurse hands over in a four-box SBAR dialog (every box at least three words). The score is out of 100 in seven sections with seven hard-fail reasons; pass at 70 or more and no fail | Preserved (not ported to the server) | Audit 20; [testing-strategy.md](testing-strategy.md), "What is not covered" |
| FR-33 | The clinical dynamics of the nurse role (risk, stages, treatments) are the same as in the doctor role | Preserved and also implemented server-side | The `nurse` family of six traces in `ErClinicalTraceTests` |

### Offline mode, services, other features

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-34 | When the understanding service cannot be reached, the ER room keeps working: it reads the trainee's text with local rules and a small model, answers with fixed lines, and grades the handover by keywords. The room goes offline at once on status 403, 404, 405, 429 or 503, retries after 60 seconds, and shows a note on recovery | Preserved | Audit 14 (offline switch), audit 15, audit 31 (client state machine); the conversation golden master (12 rooms, offline and with a stub service) |
| FR-35 | With the service reachable, the room sends the message, the room state and the last 14 chat lines to `POST /api/er-chat`. The service reads the message and voices the people in the room. A free `GET ?ping=1` checks it at room entry | Preserved; the call now goes through the application | Audit 14, audit 31; [decision 0006](decisions/0006-understanding-services-through-a-gateway.md); `A_room_request_is_relayed_unchanged_and_the_answer_comes_back_unchanged` |
| FR-36 | The text the trainee writes is read for the act and the findings (dose parsing, dose limits, history questions, orders, result questions), in Arabic dialect | Preserved (not ported) | Audit 14, audit 15 |
| FR-37 | The respiratory room: history taking with synthetic patients, an in-browser network of 49 classes, an offline answer table, vitals, test ordering, a diagnosis dialog and scoring. The legacy UI does not reach it | Dormant | Audit 22, audit 34 (`resp` is in `REMOVED_VIEWS`) |
| FR-38 | The respiratory chat endpoint (`/api/resp-chat`) is relayed by the application. In the legacy function source, a switch `LOCKED = true` answers 410 to every request; the deployed state is not determined | Dormant | Audit 32; `The_respiratory_room_is_relayed_to_its_own_service` |
| FR-39 | The coach: a keyword-based clinical coach with drills, a mastery store and an optional external-API bridge | Dormant | Audit 10 (coach rows), audit 34 (`coach` in `REMOVED_VIEWS`) |
| FR-40 | The profile shows the account, the dashboard (students), strengths, history, a printable certificate and settings. The level quiz can be reopened from the student dashboard | Preserved | Audit 10, audit 34 (profile rows) |
| FR-41 | The academic portal for the professor has five tabs: courses and sections, assign cases, student reports, student progress, academic advisor. The professor assigns one of the six ER cases to a section, publishes a grade, adds a comment, and exports a CSV of the cohort. The cohort is seven demo students | Preserved | Audit 03, audit 11, audit 34 |
| FR-42 | The academic portal for a student lists the section and the assignments. An assignment card opens the ER on that case. Completion is read from the history. A published result is found by name | Preserved | Audit 11, audit 34 ("Student assignments"), audit 03 |
| FR-43 | The professor can fill a custom-case form in the assign tab. The result feeds hidden cards. Whether it works end to end was not verified | Dormant result of a live control | Audit 34 (matrix), audit 10 ("not determined") |
| FR-44 | Specialty case simulation (seven doctor-track cases, department filters, a workup menu, a safety gate), nursing cases, "observe an expert" and the learning path | Dormant | Audit 01, 07, 08, 34 |
| FR-45 | Landing sections for roles, specialties, universities and the level quiz, the OSCE timer, the text-to-speech setting and the coach API box are hidden by CSS | Dormant | Audit 34, audit 29 (`scope.css`) |
| FR-46 | The motion layer (hero reveal, scroll reveals, count-up, monitor traces, pulse tone) and the term translation to English clinical terms | Preserved | Audit 23 |
| FR-47 | The server health check `GET /healthz` answers `ok` without calling a model | New (not in the legacy site) | [setup.md](setup.md); `Program.cs` (`MapGet("/healthz")`). No test requests `/healthz`; `The_health_check_answers_without_calling_a_model` covers the room's `GET /api/er-chat?ping=1` |
| FR-48 | A server-side session API lets a client start a session, advance it, give an intervention, report a harmful order, order a test, complete it and read the report. It is off by default | New; implemented, tested, not called by any room | [decision 0007](decisions/0007-server-session-api-off-by-default.md); `A_session_runs_from_start_to_report_over_http` |

## Clinical simulation rules that must not change

These rules are pinned by the golden masters. A change to any of them fails the test run on purpose
([decision 0004](decisions/0004-clinical-core-pinned-by-golden-masters.md)). The golden-master test is
`ErClinicalTraceTests.Domain_model_reproduces_the_legacy_trace`, run for 45 recorded scenarios of the legacy `er.js`. It
requires exact equality of every number after every step. The unit tests in `Domain/SimulationSessionTests.cs` state
each rule on its own.

The pinning proves equality with the legacy code. It does not prove that a rule is clinically correct.

| Rule | Domain member | Test |
|---|---|---|
| Untreated, the risk rises at the rate of the case (sepsis: starts at 46, gains 3 per simulated minute) | `SimulationSession.NetRiskRate`, `Tick` | `Untreated_risk_rises_at_the_rate_of_the_case` |
| One call advances at most two seconds of simulated time | `SimulationSession.Tick` | `One_call_never_advances_more_than_two_seconds` |
| The stage follows the risk across the case's thresholds; a stage change raises a `StageChanged` event | `ClinicalCase.StageAt`, `SimulationSession.Stage` | `The_stage_follows_the_risk_up_and_the_cuff_measures_when_the_patient_gets_sick` |
| The cuff measures every 2 simulated minutes, every minute once the patient is sick | `SimulationSession.TakeCuffReading`, `Cuff` | same test |
| A treatment slows the risk only after its onset | `SimulationSession.ApplyIntervention` | `A_treatment_slows_the_risk_only_after_its_onset` |
| Oxygen raises the saturation gradually and never above 99 | `SimulationSession.CurrentVitals` | `Oxygen_raises_the_saturation_gradually_and_never_above_99` |
| The same oxygen flow again adds nothing; a higher flow adds a share | `SimulationSession.ApplyIntervention` | `The_same_oxygen_flow_again_adds_nothing_and_a_higher_flow_adds_a_share` |
| Supportive care holds a septic patient; only the antibiotic turns the case round | `ApplyIntervention`, `NetRiskRate` | `Supportive_care_holds_a_septic_patient_but_only_the_antibiotic_turns_him_round` |
| The risk never falls below the floor of 20 | `SimulationSession.RiskFloor` | `Risk_never_falls_below_the_floor_of_the_resuscitation_room` |
| A harm raises the risk a moment after the order and is not counted as a step done | `SimulationSession.ApplyHarm`, `HarmfulOrders` | `A_harm_raises_the_risk_a_moment_after_the_order_and_is_not_a_step_done` |
| Anaphylaxis stops short of arrest, does not settle by itself, and adrenaline treats it | `ApplyHarm`, `Anaphylaxis` | `Anaphylaxis_stops_short_of_arrest_and_adrenaline_treats_it` |
| A test that is safe at first becomes harmful once the untreated systolic pressure is below 90, and adds 6 to the risk | `SimulationSession.OrderTest`, `UntreatedSystolicPressure` | `A_test_that_is_safe_at_first_becomes_harmful_once_the_pressure_has_fallen` |
| Ordering the same test twice keeps the first order | `SimulationSession.OrderTest` | `Ordering_the_same_test_twice_keeps_the_first_order` |
| At a risk of 100 the patient arrests, the session ends and time stops | `Tick`, `Outcome`, `PatientArrested` | `At_a_risk_of_100_the_patient_arrests_and_the_session_ends` |
| A handover is stable only below the first threshold with every key step done | `SimulationSession.HandOver` | `A_handover_is_stable_only_below_the_first_threshold_with_every_key_step_done` |
| A dangerous destination fails the session whatever the score | `SessionScorer.JudgeDestination`, `Judge` | `A_dangerous_destination_fails_the_session_whatever_the_score` |
| An order for something the catalog does not have is a domain error | `DomainException` | `An_order_for_something_the_catalog_does_not_have_is_a_domain_error` |
| Ventricular tachycardia and shock, the planned collapse, and supportive care held until the cause is treated | `SimulationSession` (VT, collapse, hold) | The three rescue traces in `ErClinicalTraceTests` |
| The score is out of 100 in six parts: safety 40, diagnosis 15, tests 15, history 10, communication 10, handover 10 (read from `SessionScorer.Score`) | `SessionScorer.Score` | The final score and the six parts in every trace. A changed scoring weight failed 12 of 45 traces in the mutation check |
| The pass mark is 70, and these fail a session whatever its score: cardiac arrest, dangerous destination, a harm of risk 8 or more, a missed key step, untreated VT, untreated collapse, untreated anaphylaxis, no test ordered, a wrong diagnosis graded by the service | `SessionScorer.PassMark`, `Judge`, `FailureReason` | The verdicts in every trace; `A_well_managed_case_is_handed_over_stable_and_passes` |
| The same case with the same inputs gives the same numbers (the arithmetic order of the legacy code is kept) | `Numbers.Round`, `Numbers.Clamp` | All 45 traces |

A mutation check was run when the tests were written: one changed model constant failed 33 of 45 traces
([decision 0004](decisions/0004-clinical-core-pinned-by-golden-masters.md)).

Rules that are not pinned by a golden master (they are preserved only because the browser code is unchanged): the
nurse role's score, order safety (dose checks, allergy, "too early"), reading of the trainee's text, the
conversation, the respiratory room, the coach, the professor portal.

## Non-functional requirements

| ID | Requirement | How it is met | Evidence |
|---|---|---|---|
| NFR-1 | Zero regression of what the browser receives: the page, scripts, styles, data and images equal the legacy site | Client scripts are the legacy scripts cut into 183 fragments and joined by plain concatenation. Views are the legacy page cut into 43 partial views. The 18 intentional differences are registered with their reasons | `The_page_is_the_legacy_page`, `Each_script_bundle_is_the_legacy_script`, `Each_stylesheet_is_the_legacy_stylesheet`, `Each_data_document_is_the_legacy_file_byte_for_byte`, `Every_legacy_image_is_served_unchanged`, `Every_registered_difference_fits_the_legacy_file_exactly`; [decisions 0002](decisions/0002-lossless-strangler-migration.md), [0003](decisions/0003-razor-views-reproduce-the-legacy-page.md) |
| NFR-2 | The user interface is frozen | Any change to `ClientScripts/`, `Views/` or `wwwroot/css` fails the baseline tests until it is registered in `seams.json` with its reason | [testing-strategy.md](testing-strategy.md), "Rules for changing things"; the manual browser comparison (22 of 22 DOM comparisons identical; 20 of 22 screenshots identical, the two others differ as often between the legacy site and itself) |
| NFR-3 | Arabic, right to left | The page is the legacy page, which carries the direction and language; Latin runs inside Arabic text stay left-to-right in the chat (`bidi`). Not checked separately in this phase | Audit 14 (`bidi`), audit 24; `The_page_is_the_legacy_page`. A separate right-to-left test: not determined |
| NFR-4 | Clean Architecture dependency rule: Domain depends on nothing; Application on Domain only; Infrastructure never on Web; controllers take no infrastructure type | Five projects, references checked on the compiled assemblies | `LayeringTests`: `The_solution_has_exactly_the_five_projects`, `The_domain_depends_on_nothing_but_the_base_class_library`, `The_application_depends_on_the_domain_only`, `Infrastructure_depends_on_application_and_domain_and_not_on_the_web`, `No_inner_layer_knows_the_web`, `Controllers_reach_infrastructure_only_through_application_contracts`; [decision 0001](decisions/0001-clean-architecture-in-five-projects.md) |
| NFR-5 | Use cases are single-purpose and sealed; domain types carry no framework attributes | One sealed class with one `HandleAsync` each; no mediator library | `Every_use_case_is_a_sealed_class_with_one_handle_method`, `Domain_types_carry_no_serialization_or_framework_attributes` |
| NFR-6 | No secret in the repository or in the client | The application holds no model key; the key stays in the environment of the external function. Settings hold endpoints, not keys | [architecture.md](architecture.md), "Security posture"; [setup.md](setup.md). A scan of the repository for secrets: not determined |
| NFR-7 | The paid understanding services are never called by accident | Both are switched off in `Development`; the rooms then run offline. Switching one on is explicit | [setup.md](setup.md), "The understanding services cost money"; `A_service_that_is_switched_off_is_never_called` |
| NFR-8 | Internal clinical evaluation data is not sent by the new server API | A session response carries the monitor, the cuff, the stage and what was done. The risk, the indication of a test and the scoring rules stay on the server until the report | `A_session_runs_from_start_to_report_over_http`; [decision 0007](decisions/0007-server-session-api-off-by-default.md) |
| NFR-9 | Data files are reachable only by name | `LegacyDataFiles` opens only known names; `ClientDataController` serves only named documents; source fragments cannot be requested | `Only_the_shipped_data_files_can_be_read`, `Data_that_the_application_does_not_name_cannot_be_asked_for`, `Each_data_document_is_the_legacy_file_byte_for_byte` |
| NFR-10 | Stated gap: for the legacy rooms the browser still downloads the case file with diagnoses, expected steps and scoring hints. The rule above is **not met** for them | Closing the gap needs each room's engine on the server. Progress is measured by the documents that leave `IClientDataDocumentSource` | [architecture.md](architecture.md), "What is honest to say about data exposure"; [decision 0005](decisions/0005-legacy-data-behind-repositories.md) |
| NFR-11 | Validation and limits on the understanding endpoints: JSON object only, body at most 64 KB, a known case id for the ER room, same-origin requests only, a per-caller rate limit (40 per minute by default) | `ProcessPatientMessage`, the same-origin filter and rate-limit policies | `A_request_the_application_would_not_send_is_refused_before_it_reaches_the_service`, `A_body_larger_than_the_limit_is_refused`, `A_request_sent_by_a_browser_from_another_site_is_refused`, `A_caller_over_its_limit_is_slowed_down` |
| NFR-12 | Validation and limits on the session API: a known case, known order ids, no orders after the session ends, no report before completion, at most 500 sessions, dropped after 120 idle minutes, 240 requests per minute per caller | Use cases return a `Result<T>` with an error kind; the store is bounded | `A_session_cannot_start_without_a_known_case`, `Orders_are_refused_for_unknown_ids_and_after_the_session_has_ended`, `A_report_is_refused_until_the_session_is_completed`, `The_store_refuses_new_sessions_when_it_is_full_and_forgets_idle_ones` |
| NFR-13 | The service's answer reaches the room unchanged, status included, because the room decides by the status whether to work offline. A service that cannot be reached reads as 503; an oversized answer is not passed on | `HttpUnderstandingServiceGateway` | `The_status_of_the_service_reaches_the_room_because_the_room_decides_by_it`, `A_service_that_cannot_be_reached_or_is_too_slow_reads_as_unavailable`, `An_answer_far_larger_than_any_real_one_is_not_passed_on` |
| NFR-14 | Errors reach the caller as problem documents without stack traces; details go to the log | Controllers map error kinds to status codes; unexpected errors are handled centrally | `Wrong_requests_get_a_problem_document_and_never_a_stack_trace` |
| NFR-15 | Protective response headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`. There is no Content-Security-Policy, because the legacy page uses inline handlers and scripts | Middleware in the web project | `Every_response_carries_the_protective_headers`; [architecture.md](architecture.md) |
| NFR-16 | The build treats warnings as errors; public members of every project except the tests are documented | `Directory.Build.props`: `TreatWarningsAsErrors` and `GenerateDocumentationFile` are true; the test project turns the documentation file off | `dotnet build Nabd.sln`: 0 warnings, 0 errors ([testing-strategy.md](testing-strategy.md), "Results of this phase") |
| NFR-17 | Determinism of the golden masters: recording twice gives identical files; the replay needs no Node.js, browser or network | A seeded random source and a fake clock in the recorder; the traces are committed | `node tests/legacy-baseline/record-er-clinical.js --check`: 45 of 45 identical; the conversation golden master: 12 of 12 rooms identical |
| NFR-18 | Test run: `dotnet test` takes about ten seconds and needs no Node.js, browser or network | All tests run in memory | 164 passed, 0 failed, 0 skipped ([testing-strategy.md](testing-strategy.md)) |
| NFR-19 | The clinical-content flag `reviewed: false` stays visible to every layer | Exposed by the repository and pinned by a test | `The_clinical_content_is_reported_as_not_reviewed_by_a_physician` |
| NFR-20 | The architecture is prepared for a multi-agent system without implementing it | Contracts in `Nabd.Application/Abstractions/Agents/`; one exit point for room messages (`ProcessPatientMessage`); session events | `The_multi_agent_contracts_exist_and_nothing_implements_them_yet`; [decision 0009](decisions/0009-multi-agent-contracts-only.md) |

## Constraints of this phase

| Constraint | State | Source |
|---|---|---|
| No redesign: the user interface and the page structure do not change | Held; 18 registered differences, none visual | [decision 0003](decisions/0003-razor-views-reproduce-the-legacy-page.md), `seams.json` |
| No dataset rebuild: the eight JSON files are moved byte for byte | Held | [decision 0005](decisions/0005-legacy-data-behind-repositories.md) |
| No model retraining: the three small models (`er-act.json`, `er-find.json`, `resp-model.json`) are served as they were and are not run on the server | Held | [decision 0005](decisions/0005-legacy-data-behind-repositories.md) |
| No multi-agent implementation: contracts only | Held; a test fails if anything implements them | [decision 0009](decisions/0009-multi-agent-contracts-only.md) |
| No push and no history rewrite | Held as far as the documents state. The git history of the branch was not inspected for this document, so this is not determined | The task brief for this document |
| Exactly five projects | Held and tested | `The_solution_has_exactly_the_five_projects` |
| No database | Held; sessions are in memory only | [decision 0008](decisions/0008-no-database-and-no-authentication-in-this-phase.md), [0007](decisions/0007-server-session-api-off-by-default.md) |
| No authentication | Held; accounts remain demo data in the browser | [decision 0008](decisions/0008-no-database-and-no-authentication-in-this-phase.md) |
| The external functions are not changed | Held; this causes the stop-gap in decision 0006 | [decision 0006](decisions/0006-understanding-services-through-a-gateway.md) |
| The legacy site on `main` is not touched | Held | [README.md](../README.md), [setup.md](setup.md) |

## Out of scope and known gaps

| Item | State | Source |
|---|---|---|
| The room in the browser runs the legacy engine. It does not call the server model or the use cases | Next phase | [architecture.md](architecture.md), "Where the logic runs today" |
| Real understanding services were never called, by tests or by hand; the relay is tested against fakes only | Gap | [decision 0006](decisions/0006-understanding-services-through-a-gateway.md), [testing-strategy.md](testing-strategy.md) |
| Reading the trainee's text, dose parsing and order safety are not ported | Gap | [decision 0004](decisions/0004-clinical-core-pinned-by-golden-masters.md) |
| The nurse role's handover grade and score are not ported | Gap | [decision 0004](decisions/0004-clinical-core-pinned-by-golden-masters.md) |
| The respiratory room, specialty simulation, nursing rooms, professor portal and coach have no behavioural golden master | Gap | [testing-strategy.md](testing-strategy.md) |
| The ER room after the briefing, in a real browser, is covered by the Node harness with a fake DOM, not by the browser comparison | Gap | [testing-strategy.md](testing-strategy.md) |
| Browsers other than Chrome, real phones and screen readers were not tested | Gap | [testing-strategy.md](testing-strategy.md) |
| Load, concurrency and long uptime were not tested | Gap | [testing-strategy.md](testing-strategy.md) |
| `dotnet publish` and running behind a reverse proxy were not exercised | Gap | [testing-strategy.md](testing-strategy.md), [setup.md](setup.md) |
| Accounts, roles, progress, professor notes and grades live in the browser; anyone can sign in as the professor. The audit rates this the most serious weakness of the legacy site | Carried over | [decision 0008](decisions/0008-no-database-and-no-authentication-in-this-phase.md) |
| Other weaknesses carried over: unescaped rendering of stored text, client-side roles, page start depending on a third-party font host, no Content-Security-Policy | Carried over; severities are in the audit parts | [architecture.md](architecture.md), "Security posture" |
| The server session API takes two transitional inputs (`harmful-orders` and `completion`) because the rules behind them are in the browser | Transitional | [decision 0007](decisions/0007-server-session-api-off-by-default.md) |
| Sessions do not survive a restart and are not shared between instances; the session id is the only protection of a session | Acceptable now, to be solved before a room uses the API | [decision 0007](decisions/0007-server-session-api-off-by-default.md) |
| Data integrity notes from the audit (for example, results listed for tests the catalog does not have) are kept, not repaired, because repairing data is a clinical-content change | Kept | [decision 0005](decisions/0005-legacy-data-behind-repositories.md) |
| The multi-agent contracts are a proposal with no implementation to test them against | Expected to change | [decision 0009](decisions/0009-multi-agent-contracts-only.md) |
| The legacy tests that exist outside the solution were partly not run (some depend on session temp paths or hard-coded Desktop paths); 54 differences against a stored doctor golden file are noted in the audit | Not determined beyond the audit | [33-existing-tests](legacy-audit/33-existing-tests.md) |

## Open decisions for the owner

Only decisions that the documents and the audit raise.

| # | Decision | Why it is open | Source |
|---|---|---|---|
| 1 | Identity: ASP.NET Core Identity or an external provider, and a store. Also who may register, which university data is real, where personal data lives and for how long | Saving results on the server and a real professor portal need it. Nothing server-side may rely on a role until it exists | [decision 0008](decisions/0008-no-database-and-no-authentication-in-this-phase.md) |
| 2 | The stop-gap of decision 0006: have the external functions recognise the application by a shared secret instead of an origin header, and move the per-address limit to the application or forward the caller address from an authenticated application | The functions see every user as one caller address, so their per-address limit (150 requests per minute, counted per warm instance; audit 31) would apply to all users together. The functions were outside this phase | [decision 0006](decisions/0006-understanding-services-through-a-gateway.md) |
| 3 | The dormant features: whether to re-enable the respiratory room, the coach, the specialty and nursing cases, "observe an expert" and the learning path, or to remove them. The audit records how each would be re-enabled | They are preserved but unreachable. The comments in the code disagree on the coach's state | Audit 34 ("Dormant features and how they would be re-enabled"), audit 10 |
| 4 | Physician review of the clinical content of the six cases, and what to do with any correction (a correction changes the golden masters) | The content is unreviewed. The golden masters pin the legacy behaviour, including anything a physician might change | [decision 0004](decisions/0004-clinical-core-pinned-by-golden-masters.md), [decision 0005](decisions/0005-legacy-data-behind-repositories.md) |
| 5 | Hosting: a host that runs .NET. Static hosting such as GitHub Pages cannot run the application, and merging this branch into `main` would stop the Pages copy from working | The static `index.html` is no longer at the repository root | [setup.md](setup.md), "Deployment notes" |
| 6 | Which room moves to the server first, and whether the transitional inputs of the session API go away with it | Closes the data-exposure gap (NFR-10) and removes the dependence on the browser for order safety | [architecture.md](architecture.md), [decision 0007](decisions/0007-server-session-api-off-by-default.md) |
| 7 | Whether the legacy rooms' known weaknesses (unescaped rendering of stored text, client-side roles) are fixed as registered, reviewed changes | A fix changes what the browser receives, so it must be registered as a difference | [decision 0002](decisions/0002-lossless-strangler-migration.md) |
