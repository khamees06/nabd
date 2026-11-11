# resp.js — source fragments

The browser receives these files joined in the order below as `/js/resp.js`, between `_open.txt` (the file header and the opening of the wrapper function) and `_close.txt` (its closing line).
The code is the legacy `resp.js`, cut at statement boundaries and otherwise unchanged; `ClientBundleBaselineTests` fails if the joined text differs from the legacy file by anything not listed in `tests/Nabd.Tests/LegacyBaseline/seams.json`.

The "layer" column says where each responsibility belongs in the layered design; it is the map for moving code out of the browser, one fragment at a time.

| file | legacy lines | layer | responsibility |
|---|---|---|---|
| 010-config-state.js | 11–33 | application | Constants, cache variables, session state, small helpers |
| 020-data-loader.js | 34–65 | infrastructure | Fetch and decode data files, build indexes, pool filter |
| 030-network.js | 66–106 | infrastructure | Feature encoding and forward pass |
| 040-patient.js | 107–210 | domain | Patient selection, facts list, offline answers |
| 050-vitals.js | 211–270 | domain | Seeded PRNG, vitals generation, normal ranges, nbRespVitals |
| 060-vitals-tests-panel.js | 271–297 | presentation | Monitor tiles, measure action, test buttons |
| 070-lab-results.js | 298–344 | domain | Reference parsing and lab result generation |
| 080-lab-order.js | 345–364 | presentation | Result card and ordering a test |
| 090-order-cues.js | 365–385 | domain | Typed test and vitals order detection |
| 100-question-matcher.js | 386–448 | domain | Arabic normalisation and local question matching |
| 110-chat-api.js | 449–477 | infrastructure | Chat endpoint call and circuit state |
| 120-body-map-data.js | 478–514 | presentation | Body location table, mark kinds, figure outline |
| 130-body-map.js | 515–539 | presentation | Body map rendering |
| 140-chat-screen.js | 540–596 | presentation | Chat feed, typing dots, step recording, bars, counter |
| 150-ask-flow.js | 597–664 | application | Routing of a typed or picked question, question list |
| 160-submit-dialog.js | 665–706 | presentation | Diagnosis submit dialog |
| 170-scoring.js | 707–737 | domain | Missed questions, sparkline, triage rule, question points |
| 180-finish.js | 738–801 | application | Result card and history write |
| 190-begin.js | 802–825 | application | Start or restart a case |
| 200-mount.js | 826–864 | presentation | One-time event wiring |
| 210-open-exports.js | 865–894 | application | Entry point, error view, global exports and test hook |
