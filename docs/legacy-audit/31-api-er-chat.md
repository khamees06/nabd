# External service: api/er-chat.js

Audited: `C:/Users/ss/OneDrive/Desktop/nabd/api/er-chat.js` (410 lines, 44,095 bytes, ES module, not in the repository) and the client side of its contract in `er.js` (repository checkout, commit 5f431d5). Line references: `fn:N` = er-chat.js, `er:N` = er.js.

Not run: no request was sent to the deployed endpoint and no browser probe was used (see Open questions 1 for why opening the ER room locally was avoided). Everything below is from code reading.

## What it does

A single Vercel-style Node handler (`export default async function handler(req, res)`, fn:269) that gives the ER room two language services and one grading service. It holds no clinical state: `er.js` owns the clock, risk, vitals, results and who may speak (fn:1-7, er:1-8).

| Service | What the function does | What it does not do |
|---|---|---|
| Read the trainee's message | One model call returns a structured reading (addressee, kind, fact ids, exam ids, actions with dose, tests with reason, tone flags, verdict on an open question) | Does not apply orders, change risk, or produce results |
| Voice a reply | Server code chooses the addressee and builds a "what to say" plan from the case file's own lines; a second model call words it in Jordanian Arabic | Never voices the ER doctor in nurse role (fn:317, fn:372) |
| Unprompted line | Words one line for a speaker the room already chose | Does not decide when someone speaks |
| Grade | Judges the final diagnosis text and SBAR handover against the record the page sends | Does not compute the score |

Static imports at cold start: `@anthropic-ai/sdk` (package.json pins `1.3.0`), `../data/er-cases.json`, `../data/er-lang.json` (fn:16-18). Both JSON files are byte-identical (ignoring CR) to `data/er-cases.json` and `data/er-lang.json` in the checkout (verified with diff). Case data: 6 cases, all with `nurseMode`; 42 actions; 22 tests.

## Request contract

Transport: `POST` to `API` with `Content-Type: application/json`, JSON body (er:677-680). `API` is `/api/er-chat` when the page host ends in `.vercel.app`, otherwise the absolute URL of the production deployment (er:12). A separate `GET ?ping=1&_=<ms>` is sent before a case starts (er:695, er:4681).

### Envelope: sent on every POST by `call()` (er:670-693)

| Field | Type | Set in er.js | Server handling (fn) |
|---|---|---|---|
| `case` | string, case id | `E.c.id` (er:679) | Looked up in `CASES`; unknown -> 400 `case` (fn:294-295) |
| `risk` | number | `E.risk` (er:679) | Clamped 0..100, non-number -> 0 (fn:302) |
| `anx` | number | `E.anx` (er:679) | Clamped 0..100 (fn:303) |
| `state.minute` | number | `E.sim` (er:656) | Rounded (fn:305) |
| `state.vitals` | string | `vitalsLine()` (er:656) | Cut to 120 chars (fn:305) |
| `state.done` | string[] | English names of done and harmed actions (er:656) | First 20, 40 chars each (fn:306) |
| `state.results` | string[] | `"<test en>: <result text>"` for tests that are back (er:657) | First 12, 500 chars each (fn:307) |
| `state.ordered` | string[] or absent | Doctor role: tests sent and not back; nurse role: `undefined`, so dropped by JSON (er:660) | First 20, 60 chars; absent -> `null` keeps older wording (fn:308-309) |
| `history` | `{r,t}[]` | `E.chat.slice(-14)` (er:679); entries pushed by `person()` (er:632) and the exam line (er:2238) | Last 14; `r` must be one of `s p c n d`, else `s`; `t` cut to 400; empty dropped (fn:299-300) |
| `role` | `'nurse'` or absent | Added when `NM()` (er:679); also passed explicitly in nurse grade (er:4002) | `'nurse'` only if the case has `nurseMode`, else `'doctor'` (fn:297) |
| `orders` | string[] or absent | Nurse role only: `"<order ar>: cancelled|done|pending"`, first 12 (er:679) | Nurse role only; first 12, 80 chars each (fn:298) |

`history` already contains the trainee's new message, because `person('me', text)` runs before `handle(text)` (er:1906, er:1911).

### Mode fields

| Mode | Field | Type | Set in er.js | Server handling |
|---|---|---|---|---|
| turn (no `mode`) | `text` | string | Doctor turn er:1937; nurse turn er:2549 | Cut to 400; empty -> 400 `empty` (fn:345-346) |
| turn | `pending` | `{ask: string}` or absent | Doctor: `E.pending.ask`, withheld when a `which` question is 2+ turns old (er:1936-1937); nurse: `E.pending.ask` (er:2549) | `ask` cut to 800 (fn:347) |
| line | `mode: 'line'` | literal | `voice()` er:700 | fn:313 |
| line | `speaker` | `'patient' | 'companion' | 'nurse' | 'supervisor'` | `voice()` callers: supervisor er:3481, 3482, 3520, 3523, 3697, 3706; companion er:3676 | Not validated against a list; any other value falls to the patient prompt with a STATE block (fn:318-321). Nurse role + `nurse` -> 400 `speaker` (fn:317) |
| line | `why` | string, English instruction written by er.js | Same call sites | Cut to 300, placed in the user message (fn:315, fn:324) |
| grade | `mode: 'grade'` | literal | er:3764 (doctor), er:4002 (nurse) | fn:332 |
| grade | `dxText` | string | Doctor only: `#er-dx` value (er:3761, 3764) | Cut to 200 (fn:341) |
| grade | `sbar` | string | Doctor: `#er-sbar` (er:3764); nurse: `"S: ..\nB: ..\nA: ..\nR: .."` (er:3999, 4002) | Cut to 900 (doctor, fn:341) or 1300 (nurse, fn:336) |
| grade | `harms` | string[] | `E.harms.map(h => h.label)` | First 8, 80 chars each (fn:336, fn:341) |
| ping | query `ping=1`, `_=<timestamp>` | GET, no body | er:695 | fn:284 |

Client timeouts: turn 15,000 ms (default, er:670), line 9,000 ms (er:700), grade 12,000 ms (er:3764, 4002), ping 4,500 ms (er:695). While `api === 'off'` a retry attempt is capped at 4,000 ms (er:674).

## Response contract

All responses carry `Cache-Control: no-store` and `Vary: Origin` (fn:271-272).

### Turn (HTTP 200, fn:397)

| Field | Type | Meaning | Use in er.js |
|---|---|---|---|
| `read` | object per `readSchema` (fn:137-152): `to`, `kind`, `facts[]`, `exam[]`, `actions[{id,dose,agent,dose_ok}]`, `tests[{id,reason,reason_ok}]`, `tone{introduced,empathy,rude,jargon,explained,consent}`, `pending_ok`, and `vague` (doctor role only) | The model's reading, with two server edits: `pending_ok` forced to `na` for plain speech to patient or companion (fn:350); a `bp_repeat` action added when the nurse is asked for "the numbers" (fn:362) | Doctor: becomes the turn's reading in place of `localRead` (er:1941); `vague` normalised and may short-circuit to a local line (er:1948-1956). Nurse: reshaped by `nurseShape` (er:2554). Then `apply()` |
| `to` | `'patient' | 'companion' | 'nurse' | 'supervisor' | 'room'` | Addressee after server re-routing (fn:356-359, 372, 379) | Doctor: speaker passed to `apply` when voiced (er:1972); copied to `read.to` when the voice failed (er:1945). Nurse: reply used only if `r.to === read.to` (er:2557) |
| `reply` | string (max 400, dialect-fixed) or `null` | Voiced line; `null` when the room must speak itself | Doctor: used when `!voiceFailed` and not `held` (er:1963). Nurse: used only for patient, companion, supervisor (er:2557) |
| `held` | boolean | `true` when a supervisor or instructor line was withheld by the diagnosis-leak check (fn:379, 393) | Doctor: `teachLine()` replaces it (er:1963). Nurse: `instructorLine()` (er:2558) |
| `voiceFailed` | boolean | The voice call threw; the reading is still valid (fn:395-396) | `spoken = r && !r.voiceFailed`; local line from `localReply(read)` (er:1944, 1963, 2557-2558) |
| `unplaced` | `true`, present only when set | Doctor role: an order to the nurse with nothing the reader could place (fn:370) | Room says `unplacedOrder(t)` as the nurse (er:1960) |

### Line (fn:313-330)

| Status | Body | Use in er.js |
|---|---|---|
| 200 | `{ reply: string }` (max 300, dialect-fixed; `forNurse` applied in nurse role) | `person(who, r.reply || fallback)` (er:704) |
| 200 | `{ reply: null }` when a supervisor line names the diagnosis (fn:328) | Fallback line; the API stays "on" |
| 502 | `{ error: 'empty' }` | `call()` returns null -> fallback |
| 400 | `{ error: 'speaker' }` (nurse role, speaker `nurse`) | No call site sends this combination (the nurse-mode guard at er:3693 returns before the supervisor voice; companion is the only other caller) |

A line that returns after the trainee's next message is dropped in doctor role unless `keep` is set (er:703).

### Grade (fn:332-343)

| Field | Type | Use in er.js |
|---|---|---|
| `dx` | `'right' | 'close' | 'wrong'` (nurse role: always forced to `'wrong'`, fn:337) | Doctor: `g && g.dx` decides whether the server grade is used; then `end.grade.dx` (er:3767, 4239). Nurse: only tested for presence (er:4006) |
| `s`, `b`, `a`, `r` | boolean | SBAR parts present. Doctor: spread into `end.grade`. Nurse: overlaid on the local grade (er:4006) |
| `invented` | boolean | Handover states something the record contradicts. Nurse: OR-ed with the local check (er:4006) |
| `note` | string, cut to 240 | One Arabic sentence shown with the result |

The page adds `graded: true` when the server grade is used (er:3767, 4006).

### Ping

`GET ?ping=...` -> 200 `{ok:true}` when the API key is configured, 503 `{ok:false}` otherwise (fn:284). The page reads only `r.ok` and cancels the body (er:695).

### Error bodies

`{ error: <string> }` with: 405 `POST only`, 503 `not configured`, 403 `origin`, 429 `slow down`, 400 `case` / `empty` / `speaker`, 502 `empty` / `upstream <status>`, 500 `failed` (fn:285-291, 295, 317, 326, 346, 400-401). The page never reads the error text; it reads only the status (er:681-684).

## Modes and flows

### Turn: read, then maybe reply (fn:345-397)

1. Reader call (`READER`, structured output, limit 1,000 tokens, 8,000 ms). User message = transcript of history + `Monitor now` + optional `PENDING` + the new message (fn:348).
2. Server routing rules (domain logic living in the function):

| Rule | Line |
|---|---|
| A fact question riding on an order or said to the room goes to the patient | fn:356 |
| If every asked fact belongs to the companion, the companion answers | fn:354, 357 |
| `kind === 'help'` goes to the supervisor unless addressed to the companion | fn:358 |
| "Numbers / vitals" said to the nurse with nothing else adds action `bp_repeat` | fn:362 |
| Patient cannot answer when `risk >= c.risk.critical` | fn:364 |
| `silent` (no voice call): unconscious patient; nurse with work to do; room with work or `other`; pure order; reply to an open question not for the supervisor; nurse role when `to === 'nurse'` | fn:365-367 |
| `unplaced` (no voice call, doctor role): order to the nurse with no action, test or fact and not an answer to a pending question | fn:370 |

3. Voice call, one of:

| Addressee | Model | Plan source | Limit / timeout | Line |
|---|---|---|---|---|
| patient / room | `SPEAKER` | `planPatient` from case `facts[].say` and `patient.opening` (fn:206-218) | 300 tok / 6,000 ms | fn:376, 383 |
| companion | `SPEAKER`, or no call: fixed "I don't know" line drawn at random by `unsure()` when the companion holds none of the asked facts and the trainee was not rude (fn:222-227, 386-387) | `planCompanion` (fn:232-240) | 300 / 6,000 | fn:380, 388 |
| nurse (doctor role only) | `SPEAKER` | `STATE` + her open question | 300 / 6,000 | fn:390 |
| supervisor (doctor role) | `READER` | `STATE` | 500 / 7,000 | fn:392 |
| instructor (nurse role) | `READER` | `STATE` + doctor orders | 500 / 7,000 | fn:378 |

4. Response assembled; a voice exception sets `voiceFailed` and still returns 200 with the reading (fn:394-397).

### Line (fn:313-330)

One call. Supervisor uses `READER` (500 tok), everyone else `SPEAKER` (300 tok), 6,000 ms. Patient and companion get a fixed restriction block (fear and what they see only). Leak check for the supervisor.

### Grade (fn:332-343)

One `READER` call, 500 tok, 9,000 ms, schema `{dx,s,b,a,r,invented,note}`. Separate system text for nurse role (no diagnosis graded).

### Ping (fn:284)

No model call, no origin check, no rate limit.

### OPTIONS preflight (fn:278-283)

204 with `Allow-Methods: POST`, `Allow-Headers: Content-Type`, `Max-Age: 86400`.

No other mode was found. Any `mode` value other than `line` or `grade` is treated as a turn.

## Models and provider calls

| Item | Value | Line |
|---|---|---|
| Provider SDK | `@anthropic-ai/sdk` 1.3.0, `client.messages.create` | fn:16, 52; package.json |
| Reader / grader / supervisor / instructor model id | constant `READER` = `claude-sonnet-5-5` | fn:20 |
| Voice model id | constant `SPEAKER` = `claude-haiku-5-5` | fn:21 |
| Environment variables | `ANTHROPIC_API_KEY` only (read implicitly by the SDK; presence tested at fn:26) | fn:7, 26 |
| Client defaults | `timeout: 7000`, `maxRetries: 0` | fn:26 |
| Per-call timeouts | reader 8,000; voices 6,000; supervisor/instructor in a turn 7,000; grade 9,000 | fn:348, 376-392, 336, 341, 324 |
| `max_tokens` | default 300; reader 1,000; supervisor/instructor/grade 500 | fn:51, 348, 324, 336 |
| Extra request options | `thinking: {type: 'between_tools'}` for `READER` only; `output_config: {effort: 'low', format: {type: 'json_schema', schema}}` on every call | fn:55, 58 |
| Prompt caching | System prompt sent as one text block with `cache_control: {type: 'ephemeral'}` | fn:56 |
| Stop handling | `refusal` or `max_tokens` throws; first text block is `JSON.parse`d | fn:60-62 |
| Calls per request | turn: 1 or 2 (reader, then 0 or 1 voice); line: 1; grade: 1; ping: 0 | |
| Worst-case server time for a turn | 8,000 + 7,000 = 15,000 ms, equal to the page's 15,000 ms abort | fn:348, 392; er:670 |

System prompts (role and approximate size of the template source, before case data is filled in):

| Prompt | Role | Size |
|---|---|---|
| `readSystem` (doctor) | Reading instructions + per-case FACTS, EXAM, ACTIONS (42), TESTS (22) lists + `lang.read` (1,752 chars) + `ROOM_RULES` | about 3,500 chars template + 3,200 chars rules + case lists |
| `readSystemNurse` | Same for the nursing trainee; no `ROOM_RULES`, no `vague` | about 3,600 chars + case lists |
| `DIALECT` | Shared dialect block, includes `lang.speak` (950 chars) | about 360 chars + 950 |
| `patientSystem`, `companionSystem`, `nurseSystem` | Persona and limits per speaker; persona text from the case file | about 600, 1,500, 1,500 chars |
| `supervisorSystem`, `instructorSystem` | Teaching voice; contains the true diagnosis (`c.dx.en`) with an instruction not to reveal it | about 1,100 and 900 chars |
| Grade prompts (2) | Grading rubric; the doctor one contains the true diagnosis | about 800 chars each |

Whether cache reads actually occur (prompt length against the provider's minimum) was not determined.

## What data leaves the system

Sent to the AI provider on each call:

| Data | Origin | Limit |
|---|---|---|
| Trainee's typed message | page | 400 chars |
| Last 14 chat lines of the room (trainee and simulated people) | page | 400 chars each |
| Open question text (`pending.ask`) | page | 800 chars |
| Diagnosis text and SBAR handover written by the trainee | page | 200 / 900 or 1,300 chars |
| Simulated state: minute, vitals line, done actions, results, ordered tests, doctor orders, harm labels | page | per-field cuts above |
| `why` instruction for unprompted lines | er.js code | 300 chars |
| Case file content: fictional patient, companion, nurse names, personas, fact lists, true diagnosis | server copy of `er-cases.json` | whole lists |
| Dialect guidance | server copy of `er-lang.json` | `read`, `speak` |

Not sent by `call()`: user name, email, account id, university, role label, score (the body is exactly the fields at er:679 plus the mode fields). Free text typed by a trainee is forwarded unfiltered, so anything a trainee types reaches the provider. The function writes no storage; it logs only `status` and `message` of errors (fn:395, 399). The client IP (first `x-forwarded-for` value) is held in an in-memory map for one minute (fn:40-42).

## Access control

CORS allow-list and origin check (fn:27-32, 273-276, 290):

```js
const ALLOWED = new Set(['https://khamees06.github.io', 'http://localhost:4181']);
const allowedOrigin = (origin, host) => {
  if (!origin) return false;
  try { return new URL(origin).host === host || ALLOWED.has(origin); } catch { return false; }
};
...
if (origin && ALLOWED.has(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); ... }
...
if (!allowedOrigin(origin, req.headers.host)) return res.status(403).json({ error: 'origin' });
```

Rate limit (fn:33-45, 291):

```js
// Speed bumps, per warm instance only. The real ceiling is the spend limit in the Anthropic console.
const PER_IP = 150, PER_INSTANCE = 400;
...
const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
...
return mine > PER_IP || ++total > PER_INSTANCE;
...
if (tooMany(req)) return res.status(429).json({ error: 'slow down' });
```

| Control | Present | Detail |
|---|---|---|
| Authentication / user identity | No | No token, cookie or session is read |
| Origin check | Yes, POST only | Same host, or the two listed origins; requests without `Origin` refused |
| Rate limit | Yes, in memory | 150 per IP per minute, 400 per instance per minute; counters reset each minute and per warm instance |
| Spend limit | Not in code | The comment at fn:33 refers to a limit in the provider console; not verifiable here |
| Body size limit | No explicit limit in the function | Each field is cut individually (`str`, `slice`); platform body-parser limit: not determined (no `vercel.json` found beside the source) |
| Method limit | Yes | OPTIONS, GET with `ping`, POST; others 405 |
| Order of checks | method -> configured -> origin -> rate -> case | fn:284-295 |

## Failure behaviour

Function side:

| Condition | Result |
|---|---|
| API key missing | Ping 503; POST 503 `not configured` |
| Origin not allowed or absent | 403 `origin` |
| Over the rate limit | 429 `slow down` |
| Unknown case / empty text | 400 |
| Reader call fails (timeout, API error, refusal, token limit, invalid JSON) | `Anthropic.APIError` -> 502 `upstream <status>`; anything else -> 500 `failed` (fn:398-402) |
| Voice call fails after a good reading | 200 with `voiceFailed: true`, `reply: null`, full `read` (fn:394-397) |
| Supervisor / instructor line names the diagnosis | Turn: `reply: null, held: true`; line: `reply: null` |
| Line mode returns empty text | 502 `empty` |

Page side (`er.js`):

| Condition | Behaviour | Line |
|---|---|---|
| Page opened from `file:` | `api = 'off'` permanently; no calls | er:22, 672 |
| Ping fails or is not ok | `api = 'off'`, retry allowed after 15 s, `loadFind()` | er:695 |
| POST status 403, 404, 405, 429 or 503 | `goOff()` at once | er:682 |
| Other non-ok status, network error or abort | `apiFails++`; `goOff()` at 3 consecutive failures | er:682, 690 |
| `goOff()` | `api = 'off'`, retry after 60 s, load the offline finding model, show `OFFLINE_NOTE` once | er:664-669 |
| While off | `call()` returns null without a request until the retry time; then one attempt capped at 4 s | er:671-675 |
| Success after off | `api = 'on'`, counter reset, system line "connection is back" | er:686-687 |
| Turn got null | `localRead(text)` + `localReply(read)`; first failure also loads the act model `data/er-act.json` | er:1938, 1941, 1963, 2550, 2555 |
| Line got null | Fixed fallback line; the companion's unprompted line is skipped entirely when the API is off (fallback is empty) | er:704, 3676 |
| Grade got null or no `dx` | `localGrade(end)` (doctor) or `gradeHandoverNurse(end)` (nurse) | er:3767, 4005-4006 |
| Case ended or replaced while waiting | Response discarded | er:701, 1940, 2552, 3766, 4003 |

## Post-processing

| Step | Where | What |
|---|---|---|
| Dialect fix list | fn:48-49, applied at fn:325, 397 | `er-lang.json` `fix` holds 124 entries `[word, replacement, optional lookahead]` (1 entry has the third element). Each becomes a Unicode regex that matches the word as a whole word, optionally after a one-letter Arabic prefix, and replaces it with the Jordanian form. Applied to every model reply before it is returned. The page does not load `er-lang.json` (no reference in any `*.js` or `index.html`) |
| Length cut | fn:325, 397, 337, 342 | Reply 300 (line) or 400 (turn); grade note 240 |
| `forNurse` | fn:68, 325, 376-380 | Nurse role: strips the address "doctor" from patient and companion lines. Mirrors `forNurse` in er.js (er:613) |
| `untag` / `TAIL` | fn:229-230, 380, 388 | Removes a trailing "what else do you want to know?" question from companion lines |
| Diagnosis leak check | fn:257-267, 328, 379, 393 | `leaks()` folds Arabic text and tests the reply for any accepted diagnosis term (`c.dx.accept`) that nobody but the supervisor has said earlier; a hit withholds the line |
| Reading edits | fn:350, 362 | `pending_ok` forced to `na`; `bp_repeat` added |
| Client-side follow-up | er:1948-1970, 2554 | The page applies further rules to the server reading (`vague`, bare yes/no, `nurseShape`); see audit parts 14-17 |

## Security and architecture weaknesses

| # | Severity | Weakness | Evidence |
|---|---|---|---|
| 1 | high | No authentication. The only gate is the `Origin` header, which any non-browser client can set to the deployment's own host. The paid model is reachable by anyone | fn:28-32, 290 |
| 2 | high | Spend protection is per warm instance and in memory; a cold start or a second instance resets it, and the IP comes from a client-influenced header. The real ceiling is outside the code | fn:33-45 |
| 3 | high | Line mode takes a free-text instruction (`why`) from the request and places it in the model prompt as the reason to speak; `speaker` is not validated. A caller can steer the model's output within 300-500 tokens | fn:314-324 |
| 4 | medium | Grading trusts the request: the record (`state`, `harms`, `orders`) and the handover both come from the page, and the result is returned to the page, which computes the score. A server-side score cannot rest on this as is | fn:304-310, 332-343; er:3764-3767 |
| 5 | medium | Clinical routing rules (who answers, when the patient is unconscious, unplaced orders, `bp_repeat`) are split between the function and er.js; the offline path re-implements them in `localRead`/`localReply` | fn:350-370; er:1941-1972 |
| 6 | medium | The non-Vercel page calls a hard-coded production URL; the GitHub Pages copy depends on one host, and any other host (including the local audit server) gets CORS failures and goes offline | er:12; fn:27 |
| 7 | medium | A 429 from the shared per-instance counter puts the whole room offline for 60 s for that user, with degraded understanding | er:682; fn:44 |
| 8 | medium | Worst-case server time for a turn (15 s) equals the page abort (15 s); a slow reader plus a slow supervisor voice is paid for and then discarded by the page | fn:348, 392; er:670 |
| 9 | low | The trainee's new message is sent twice to the reader and voices: once as the last `history` line and once as "Trainee's new message" | er:1906, 679; fn:348 |
| 10 | low | The function carries its own copy of `er-cases.json` and `er-lang.json`; the page loads `er-cases.json` separately. Nothing enforces that the two deployments hold the same version | fn:17-18; er:4661 |
| 11 | low | `unsure()` uses `Math.random`, so a turn is not reproducible in tests | fn:226 |
| 12 | low | Ping is unauthenticated and unlimited, and reveals whether the key is configured | fn:284 |
| 13 | low | Model ids, limits and timeouts are constants in code; no configuration surface | fn:20-21, 26 |
| 14 | low | Nurse-role online paths are marked in the source as not verified with a live call | fn:8-11, 296 |

## What a server-side gateway in front of this service must preserve

| # | Item |
|---|---|
| 1 | Request field names, types and cuts in the envelope and mode tables above, including the absence of `ordered` and presence of `role`/`orders` in nurse role |
| 2 | Turn response shape `{to, reply, held, voiceFailed, read, unplaced?}` with HTTP 200 when only the voice failed; `reply: null` is a normal value |
| 3 | `read` schema, enum values and required keys (fn:137-152); `vague` only in doctor role |
| 4 | Line response `{reply}` with `reply: null` at 200 for a withheld supervisor line |
| 5 | Grade response keys `dx, s, b, a, r, invented, note`; `dx` must be present for the page to accept the grade; nurse role returns `dx: 'wrong'` |
| 6 | Status codes the page treats as "go offline now": 403, 404, 405, 429, 503; every other failure counts toward three strikes. A gateway that returns one of these for its own reasons (for example an auth failure as 403) switches the room to offline mode |
| 7 | Ping: `GET ?ping=1` answering 2xx when the service is usable, quickly (page abort 4.5 s), with no model call |
| 8 | Time budget: page aborts at 15 s (turn), 9 s (line), 12 s (grade); 4 s when retrying from offline |
| 9 | `Cache-Control: no-store`; CORS preflight for `POST` with `Content-Type` if the page and gateway are on different origins |
| 10 | Post-processing order: model reply -> `untag` (companion) -> `forNurse` (nurse role) -> dialect fix list -> length cut |
| 11 | The diagnosis leak check and the rule that the ER doctor is never model-voiced in nurse role |
| 12 | The fixed companion "I don't know" lines (no model call) and the `silent` / `unplaced` conditions that avoid a second call |
| 13 | The case file and dialect file read by the server must be the same version the page uses |
| 14 | Stateless behaviour: every request carries the full state; the function keeps nothing between requests except rate counters |

## Open questions

1. The local audit server at `127.0.0.1:5180` is not a `.vercel.app` host, so `er.js` would address the production URL (er:12) for ping and POST. The origin is not in the allow-list, so a browser would block the responses and no model call should occur, but this was not exercised, to comply with the rule against calling the deployed endpoint. Behaviour of the ER room on the local server therefore rests on code reading only.
2. Is the source on the Desktop the version actually deployed? No deployment metadata was checked.
3. Platform limits (function maximum duration, request body size) are not in the source; no `vercel.json` was found beside it.
4. Whether a spend limit is set in the provider console (fn:33 relies on it): not determined.
5. Whether the model ids and the request options `thinking: {type: 'between_tools'}` and `output_config` are accepted by the provider as written: not determined (no call made).
6. Whether prompt caching produces cache reads for these prompt sizes: not determined.
