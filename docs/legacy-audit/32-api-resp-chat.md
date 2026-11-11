# External service: api/resp-chat.js

Audited files:

- Server: `C:/Users/ss/OneDrive/Desktop/nabd/api/resp-chat.js` (284 lines, 26,994 bytes; not in the repository). Cited as `S:<line>`.
- Client: `C:/Users/ss/nabd-refactor/resp.js` (895 lines). Cited as `C:<line>`. The Desktop copy of `resp.js` is identical to the repository copy apart from line endings (diff after `tr -d '\r'` is empty).
- Shared data: `data/resp-ar.json`. The Desktop copy the function imports is byte-identical to the repository copy (`cmp`).
- Deployment config: no `vercel.json` in `Desktop/nabd`. `package.json` has `"type": "module"` and pins `@anthropic-ai/sdk` to `1.3.0`.

The deployed endpoint was not called. Whether the deployed function matches this source is not determined.

## What it does

One Vercel serverless function (default export `handler`, S:171) that gives the respiratory room's simulated patient a voice. Per student message it runs three steps (S:1-9):

1. Read: a model classifies the student's Arabic message (kind, broad topics, "is it normal?" form, evidence ids). It never answers (S:211).
2. Decide: plain code looks each asked evidence id up in the `facts` list the browser sent. Present = yes (with its text), absent = no (S:216-270). No model is involved.
3. Speak: a second model turns the decided lines ("WHAT TO SAY") into one or two sentences of Jordanian Arabic. It never sees the rest of the record (S:272-275).

**Current state in the source: the function is switched off.** `const LOCKED = true;` (S:169) and the first statement of the handler is `if (LOCKED) return res.status(410).json({ error: 'room closed' });` (S:172). Everything below S:172 is unreachable until that constant is changed.

**Current state in the page: the room is not reachable.** `'resp'` is in `REMOVED_VIEWS` (script.js:1678) and `navigateTo` rewrites it to `home` (script.js:1949). No caller of `nbOpenResp` exists outside its definition (searched `nbOpenResp`, `openResp`, `__nbResp` in script.js, er.js, ui.js, motion.js, index.html: only C:885 and C:887). Probe on the running page: after `nbDemoLogin('med_student')`, `await nbOpenResp()` loads the four `data/resp-*.json` files but the visible view stays `view-home`; `#view-resp` keeps `display: none`. The client call path (`chatApi`) is therefore dormant, guarded by script.js:1678/1949.

## Request contract

`POST <API>` with `Content-Type: application/json` (C:457-463). No credentials, no auth header, no cookies set by the client.

`API` (C:12): `/api/resp-chat` when `location.hostname` ends in `.vercel.app`; otherwise the absolute URL of the same path on the production Vercel host (cross-origin).

| Field | Sent by client (C:459-462) | Server handling | Line |
|---|---|---|---|
| `text` | student's message, trimmed (C:597) | string, trimmed, cut to 300 chars; empty gives 400 | S:189-190 |
| `history` | `S.chat.slice(0, -1).slice(-12)`: last 12 turns before the new message, items `{ r: 'p' or 's', t }` (C:550) | last 10 kept; `r` forced to `'p'` or `'s'`; `t` cut to 400; empty turns dropped | S:200-201 |
| `facts` | `S.facts` from `factsFor()` (C:143-155): one item per positive record evidence, `{ id, a, j }` (`a` formal wording, `j` Jordanian wording) | first 80 items; only ids present in `resp-ar.json` evidences; value = `j` cut to 400, else `a` cut to 400; stored in a `Map` | S:197-198 |
| `chief` | `S.pt.init` (the record's initial evidence id) | accepted only if it is a known evidence id, else `null` | S:199 |
| `patient.age` | `S.pt.age` | number, rounded, clamped 0..120 | S:192 |
| `patient.sex` | `S.pt.sex` (`'M'`/`'F'`) | `female = (sex === 'F')` | S:193 |
| `patient.name` | `S.name`, random pick from a fixed 12-name list per sex (C:18-21, C:126) | cut to 20 chars; default name by sex if empty | S:195 |
| `patient.speaker` | `'mother'` when age < 6 (`CHILD`, C:31, C:164), else `'self'` | `mother = (speaker === 'mother')` | S:194 |
| `probe` | never sent by the client (searched `probe` in resp.js, er.js, script.js: no hit) | when `=== true`, returns the read step's classification and stops before step 2 | S:213 |

The request carries no user id, session id, case id or patient index. The server is stateless: the whole patient record (positive facts only) travels in every request.

## Response contract

Success, HTTP 200:

| Shape | When | Line |
|---|---|---|
| `{ ids: string[], reply: string }` | normal path. `ids` = evidence ids the answer conveyed (asked ids plus sibling/topic ids used), at most 8; `reply` at most 500 chars | S:249, S:276-278 |
| `{ ids: [], reply }` | kinds `detail`, `what_illness`, `unclear`: fixed Arabic line picked with `Math.random()`, no second model call | S:148-154, S:254-257 |
| `{ kind, topics, normal_form, ids }` | only when the request has `probe: true` | S:213 |

Errors (JSON `{ error: string }`):

| Status | `error` | Cause | Line |
|---|---|---|---|
| 410 | `room closed` | `LOCKED` is true (every request today, including `OPTIONS`) | S:172 |
| 204 | (no body) | `OPTIONS` preflight (only reachable when unlocked) | S:178-183 |
| 405 | `POST only` | other methods | S:184 |
| 503 | `not configured` | `ANTHROPIC_API_KEY` absent at cold start | S:76, S:185 |
| 403 | `origin` | origin check failed | S:186 |
| 400 | `empty` | no `text` | S:190 |
| 502 | `empty reply` | speak step returned an empty string | S:277 |
| 502 | `upstream <status>` | provider SDK `APIError` | S:281 |
| 500 | `failed` | anything else (JSON parse failure, refusal, `max_tokens`, timeout not typed as APIError) | S:97, S:282 |

Client use of the response (C:468-471, C:631-634): requires a non-empty string `reply`; keeps only `ids` that exist in its own evidence index; shows `reply` as the patient's line; maps `ids` to evidence groups and calls `record(...)`, which marks those questions as asked and feeds the diagnosis model. `ids` is therefore not cosmetic: it drives the student's recorded history-taking.

## Modes and flows

Order of checks when unlocked: lock (S:172) > CORS header (S:173-177) > OPTIONS (S:178) > method (S:184) > key present (S:185) > origin (S:186) > body parsing (S:188-204) > read call (S:211) > branch on `kind` > speak call (S:275).

| Mode (`kind` from the read step) | Decision logic (step 2) | Provider calls | Lines |
|---|---|---|---|
| `question` with ids and/or topics | per id: fact present = YES with text plus linked detail facts (`DETAILS`); else sibling present (`NEAR`: `yes` = sibling answers, `also` = no, then the related true fact); else NOT TRUE with a pre-written "no" line from `resp-ar.json` in the speaker's voice (`nj`, `nj_f`, `cnj_m`, `cnj_f`, fallback `no`). Special case: "used to smoke" when the record says "smokes". Per topic: list every present fact in the area, or one area-level "no" (`TOPIC_NO`). `normal_form` adds a start-with-yes/no hint. Read ids capped at 4, returned ids at 8 | read + speak | S:214, S:219-250 |
| `open` | chief complaint if present, then up to two more facts whose category is `symptom` or `breathing` and whose template has no `{v}` placeholder; none = "feel unwell" | read + speak | S:156-166, S:251-253 |
| `detail`, `what_illness`, `unclear` | fixed reply by speaker voice (male, female, mother, mother of a girl) | read only | S:147-154, S:254-257 |
| `statement` | short patient reaction, no symptom, no diagnosis confirmed | read + speak | S:258-260 |
| `smalltalk` | brief polite reply; mother variant | read + speak | S:261-265 |
| `other`, or `question` with no ids/topics | generic "record does not cover this" instruction | read + speak | S:266-269 |
| `probe: true` | returns classification only | read only | S:213 |
| Mother speaking for a child | changes the read context line, the "no" line variant, fixed replies and the speaker line | - | S:194, S:203, S:208-210, S:256, S:272-274 |

Client flow around the call (`onAsk`, C:596-635): test-order phrases and vital-sign phrases are handled locally and never reach the API (C:605-607); otherwise `chatApi(text)` is awaited with a typing indicator; a stale answer (case changed or submitted) is dropped (C:613); on `null` the local matcher runs (C:619-630).

## Models and provider calls (names of environment variables only)

| Item | Value | Line |
|---|---|---|
| Provider SDK | `@anthropic-ai/sdk` 1.3.0 (`package.json`), `client.messages.create` | S:10, S:87 |
| Environment variable | `ANTHROPIC_API_KEY` (presence checked at S:76; the SDK reads the value itself). No other variable is read | S:76 |
| Read model constant `READER` | `claude-sonnet-5-5` | S:15 |
| Speak model constant `SPEAKER` | `claude-haiku-5-5` | S:16 |
| Output | structured JSON via `output_config.format` with a JSON schema; `effort: 'low'` | S:62-73, S:95 |
| `max_tokens` | 2000 for both calls | S:90 |
| Thinking | read call only: `thinking: { type: 'between_tools' }` (comment says this turns thinking off) | S:92 |
| Prompt caching | system prompt sent with `cache_control: { type: 'ephemeral' }` | S:93 |
| Timeouts | client default 5000 ms, overridden per call: 7000 ms read, 6000 ms speak; `maxRetries: 0` | S:76, S:96 |
| Read system prompt | English instructions plus one line per evidence id built at module load from `resp-ar.json` (`q`, `en`, `kw`) | S:20-39 |
| Speak system prompt | English role/style rules with Arabic examples | S:41-60 |

Whether the model ids and the `thinking` value are accepted by the provider was not verified (no call made): not determined.

## What data leaves the system

| Data | Sent to | Source | Line |
|---|---|---|---|
| Student's free-text message (max 300 chars) | read model and speak model | browser input | S:211, S:275 |
| Last 10 chat turns (student and patient lines, max 400 chars each) | both models, as a plain transcript | browser | S:103, S:204 |
| Patient age and sex (synthetic DDXPlus record) | both models | browser | S:208-210, S:272-274 |
| Patient first name (random from a fixed list) | speak model | browser | S:273-274 |
| Decided fact lines (text of the positive facts relevant to the question, Arabic) | speak model only | browser `facts`, selected by server | S:222-253 |
| Evidence table (question wording, English label, Jordanian keywords for every evidence id) | read model, in the system prompt | `data/resp-ar.json` bundled with the function | S:39 |
| Error status and message | Vercel function log (`console.error`) | server | S:280 |

Not sent: account id, e-mail, university, scores, cookies, localStorage content. The browser sends the full positive-fact list to the function on every message; the function forwards only the selected lines to the provider. No message text is logged by this code.

## Access control (CORS, origin checks, limits: quote the lines)

Lock (S:169, S:172):

```js
const LOCKED = true;
if (LOCKED) return res.status(410).json({ error: 'room closed' });
```

Allow-list and origin test (S:79-83):

```js
const ALLOWED = new Set(['https://khamees06.github.io', 'http://localhost:4181']);
const allowedOrigin = (origin, host) => {
  if (!origin) return false;
  try { return new URL(origin).host === host || ALLOWED.has(origin); } catch { return false; }
};
```

CORS headers (S:173-183):

```js
const origin = req.headers.origin;
if (origin && ALLOWED.has(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
}
if (req.method === 'OPTIONS') {
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  return res.status(204).end();
}
```

Gate (S:184-186):

```js
if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
if (!client) return res.status(503).json({ error: 'not configured' });
if (!allowedOrigin(origin, req.headers.host)) return res.status(403).json({ error: 'origin' });
```

| Control | Present? | Evidence |
|---|---|---|
| Authentication / user identity | No | no token, cookie or session read anywhere in the handler |
| Origin check | Yes, header-based: same host as the function, or the two allow-listed origins; a request with no `Origin` header is refused | S:79-83, S:186 |
| CORS response headers | Only for the two allow-listed origins | S:174-177 |
| Rate limit / quota / per-IP or per-user budget | No | none in the file |
| Input size limits | `text` 300, history 10 x 400, facts 80 x 400, name 20, age 0..120, read ids 4, returned ids 8, reply 500 | S:189-201, S:214, S:249, S:276 |
| Output token cap | 2000 per call | S:90 |
| Kill switch | `LOCKED` constant (needs a redeploy to change) | S:169 |
| Platform limits (body size, function duration, spend limit on the provider account) | not determined (no `vercel.json`; provider console not inspected) | - |

The repository's local server origin `http://127.0.0.1:5180` is not in `ALLOWED`; only `http://localhost:4181` is.

## Failure behaviour and the page's fallback

Client state machine (C:452-476): `api` is `'off'` on `file:` pages, else `'try'`; `apiFails` counts consecutive failures.

| Event | Client reaction | Line |
|---|---|---|
| `api === 'off'` | no request; `chatApi` returns `null` | C:455 |
| HTTP 403, 404, 405, 503 | `api = 'off'` at once | C:465 |
| Any other non-2xx (400, 410, 500, 502) | `apiFails++`; `'off'` at the second consecutive failure | C:465 |
| Network error, CORS failure, 15 s `AbortSignal.timeout` | same counter, `'off'` at 2 | C:458, C:472-475 |
| 200 without a non-empty string `reply` | returns `null`; counter unchanged, `api` unchanged | C:469 |
| 200 with reply | `api = 'on'`, counter reset | C:470 |

`'off'` is never reset during the page's lifetime (the only assignments to `api` are C:452, C:465, C:470, C:473).

Fallback when `chatApi` returns `null` (C:619-630): `matchLocal(text)` scores the message against cue words from `resp-ar.json`; a single clear match asks that evidence group through `askGroup` (table answer); several close matches show up to three "did you mean" chips; a greeting gets a fixed line; otherwise a system line says the question was not understood.

Server-side failure handling: a thrown read or speak call ends in 502/500 (S:279-283); there is no retry (`maxRetries: 0`) and no server-side fallback answer. Worst-case server time is 7 s + 6 s = 13 s, under the client's 15 s abort.

Consequence of the lock as written, if the room were opened without unlocking the function: same-origin (Vercel) pages get 410 twice (two student messages each wait for a round trip, then fall back locally), then the API is off. Cross-origin pages (GitHub Pages) fail at the preflight, because the 410 at S:172 precedes the CORS and OPTIONS handling; the result is the same two-failure cut-off.

## Security and architecture weaknesses (table)

| # | Severity | Weakness | Evidence |
|---|---|---|---|
| 1 | high | No authentication and no rate limit on an endpoint that spends money on a paid model (two calls per message). The only gate is the `Origin` header, which any non-browser client can set to the function's own host | S:79-83, S:186; no limiter in file |
| 2 | high | The server trusts the client for the patient record. `facts[].j` / `facts[].a` (up to 80 x 400 chars of arbitrary text) are placed in the speak prompt as authoritative "YES" lines; `patient.name` and `history` are also inserted. A caller can make the model say arbitrary content or use the endpoint as a general text generator | S:197-198, S:222-224, S:273-275 |
| 3 | medium | Prompt-injection surface: the student's `text` and `history` are concatenated into both user messages. Mitigations are one instruction line in the speak prompt and JSON-schema output; the read prompt has none | S:60, S:211, S:275 |
| 4 | medium | Kill switch is a source constant placed before the CORS/OPTIONS handling: changing it needs a redeploy, and while locked cross-origin callers see an opaque CORS failure instead of the 410 | S:169-172 |
| 5 | medium | Client endpoint is hard-coded to one production host; no configuration, no second host | C:12 |
| 6 | medium | Domain rules live in the network function: `TOPICS`, `NEAR`, `DETAILS`, `TOPIC_NO`, `FIXED`, `openAnswer` and the smoking special case are clinical/dialogue rules keyed by hard-coded evidence ids, duplicated nowhere on the client. Offline mode therefore behaves differently from online mode (the client has only `matchLocal`) | S:106-166, S:226-234 vs C:416-446 |
| 7 | medium | Hidden build-time coupling: the function imports `../data/resp-ar.json`, the same file the browser loads. The two must be deployed from the same version; evidence ids in `TOPICS`/`NEAR` are not validated against the table | S:11, S:17, S:107-142 |
| 8 | low | Error mapping is coarse: refusal, `max_tokens`, JSON parse errors and (possibly) timeouts all become 500 `failed`; the client cannot tell a transient error from a permanent one, and two transient errors disable the API for the rest of the page | S:97-99, S:282; C:465, C:473 |
| 9 | low | `probe: true` exposes the classifier output to any caller that passes the origin check; it is not used by the page | S:213 |
| 10 | low | Non-deterministic fixed replies (`Math.random`) make the three fixed modes untestable by exact match | S:154, S:256 |
| 11 | low | Client sends up to 12 history turns, server keeps 10; client sends an unbounded `facts` array, server keeps 80. The limits are not shared | C:460; S:197, S:200 |
| 12 | low | Client-side timeout comment mismatch: `new Anthropic({ timeout: 5000 })` is overridden by the per-call 7000/6000 values, so the constructor value has no effect | S:76, S:96 |
| 13 | low | Allow-list contains a developer origin (`http://localhost:4181`) in production code | S:79 |

## What a server-side gateway in front of this service must preserve

| # | Contract element | Detail |
|---|---|---|
| 1 | Request shape | `{ text, history[{r,t}], facts[{id,a,j}], chief, patient{age,sex,name,speaker} }` with the truncation rules at S:189-201 (or stricter, never looser) |
| 2 | Response shape | 200 `{ ids: string[], reply: string }`; `ids` must be evidence ids from `resp-ar.json`; the client records them as asked questions (C:632) |
| 3 | Three-step separation | read model classifies only; code decides yes/no from facts; speak model sees only the decided lines, never the full record (S:1-7) |
| 4 | Decision rules | `NEAR`, `DETAILS`, `TOPICS`, `TOPIC_NO`, `FIXED`, `openAnswer`, smoking special case, `normal_form` hint, mother/female voice selection (S:106-166, S:203, S:219-270) |
| 5 | Caps | read ids 4, returned ids 8, reply 500 chars, history 10 turns |
| 6 | Status codes the client keys on | 403/404/405/503 = switch off at once; any other failure = switch off after two in a row; 200 with empty reply = soft miss (C:465-473) |
| 7 | Time budget | answer or fail within 15 s (client abort, C:458); provider calls 7 s + 6 s, no retries |
| 8 | Fixed-reply modes | `detail`, `what_illness`, `unclear` cost one provider call, not two |
| 9 | Kill switch | the room's API must stay closed until deliberately reopened (`LOCKED`, S:169); the gateway should make this configuration, not code |
| 10 | Secret handling | provider key only on the server, read from `ANTHROPIC_API_KEY`; never returned or logged |
| 11 | Logging | status and error message only; no message text (S:280) |
| 12 | Offline fallback | the page must keep working when the service answers nothing (local matcher path, C:619-630) |

Recommended changes at the gateway (not present today): authenticate the caller, rate-limit per user, and load the patient facts on the server from the patient id instead of accepting `facts`, `chief` and `patient` from the browser.

## Open questions

1. Is the deployed function the same as this source, in particular is `LOCKED` true in production? Not determined (endpoint not called by rule).
2. Is the respiratory room in scope for the re-hosted application? It is unreachable in the page (script.js:1678, 1949) and locked on the server (S:169), yet both code paths are kept.
3. Are the model ids at S:15-16 and the `thinking` value at S:92 accepted by the provider with SDK 1.3.0? Not determined.
4. Is there a spend limit on the provider account, and what are the Vercel function duration and body-size limits for this project? Not determined (no `vercel.json`).
5. Who uses `probe: true` (S:213)? No caller in the repository; presumably an evaluation script outside it: not determined.
6. Should offline and online modes give the same answers? Today the sibling/topic rules exist only on the server (weakness 6).
