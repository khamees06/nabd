# 0006 — The understanding services are reached through the application, not from the browser

Status: accepted · 2026-11-11 · contains a stop-gap that must be closed before real users

## Context

Two serverless functions (not part of this repository) read what a trainee wrote, voice the people in the room and
grade the handover. They hold the model key and the prompts. The legacy client called them straight from the
browser, with the production URL written in the script. The brief forbids replacing the models and asks that the
integration sit behind application contracts.

## Decision

- The rooms call the application at the paths they always used (`/api/er-chat`, `/api/resp-chat`). The two script
  lines that chose the production URL are the only code changes in the client (registered in `seams.json`).
- `UnderstandingController` passes the request to the use case `ProcessPatientMessage`, which checks it (a JSON
  object, at most 64 KB, and for the ER room a case the application knows) and relays it through the port
  `IUnderstandingServiceGateway`.
- `HttpUnderstandingServiceGateway` posts the body unchanged and returns the status and body unchanged, because
  the rooms decide by the status whether to work offline. Any failure to reach the service reads as 503.
- The endpoints refuse a browser request from another site and limit requests per caller address.
- The application holds no key and no prompt. In `Development` both services are switched off, so that running
  the application locally never spends model budget; the rooms then run in their offline mode.

## The stop-gap

The functions were written for browsers. They accept a request only when its `Origin` header is their own host or
on their allow-list, and they limit requests per caller address. A server-side caller has no origin, so the
gateway sends a configured one (`UnderstandingServices:<room>:Origin`), by default the function's own host.

Two things follow, and both need a change **in the functions**, which this phase was not allowed to touch:

1. The functions should recognise the application by a shared secret (kept in the application's secret store and
   the function's environment) instead of by an origin header.
2. The functions see every user of the application as one caller address. Their per-address limit (150 requests
   per warm instance) would then apply to all users together. Either the limit moves to the application (it
   already limits per caller) or the function trusts a caller address forwarded by the authenticated application.

Until both are done, the application should not be put in front of real users with the services switched on.

## Verification

Tested with a fake transport and a recording gateway only. **No request of the test suite or of this phase's
manual checks reached the real functions**, so the relay has not been exercised against them end to end.

## Consequences

- The browser no longer knows where the service is hosted; moving or replacing it is a configuration change.
- `ProcessPatientMessage` is the single place a room's message leaves the application: the seam for the
  multi-agent system (decision 0009).
- The reading rules, routing rules and prompts remain in the external functions and remain undocumented here
  beyond the contract in `docs/legacy-audit/31-api-er-chat.md` and `32-api-resp-chat.md`.
