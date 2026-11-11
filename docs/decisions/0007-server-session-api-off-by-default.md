# 0007 — The server-side session API exists, is tested, and is off by default

Status: accepted · 2026-11-11

## Context

The brief names the use cases a simulation needs (start a session, process a message, request a test, execute an
intervention, complete, report). The domain model can now run a session on the server, but the browser-side room
still runs its own engine and does not call the server for it.

## Decision

- The use cases are implemented in `Nabd.Application` and exposed by `SimulationSessionsController` under
  `/api/simulation/sessions`.
- The API answers 404 unless `Simulation:ServerSessionsApi:Enabled` is true. It is true in `Development` and in
  tests, false otherwise: an endpoint nothing uses should not be reachable in production.
- Sessions are kept in memory (`InMemorySimulationSessionStore`), at most 500 at once, dropped after 120 idle
  minutes. There is no database in this phase.
- A response carries only what a trainee may see: the monitor, the cuff, the stage, what was done. The risk, the
  indication of a test and the scoring rules stay on the server until the report. A test asserts the absence of
  those fields.
- Two inputs are transitional, because the rules behind them are still in the legacy client:
  `harmful-orders` takes the harm as the client judged it, and `completion` takes a handover that was already
  graded. When the order-safety rules and the handover grading move to the server, these inputs go away.

## Consequences

- The server-side path is proved end to end: `A_neglected_patient_arrests_at_the_minute_the_legacy_room_recorded`
  drives the use cases with the same clock steps as the legacy trace and ends at exactly the same simulated minute,
  for all six cases.
- Sessions do not survive a restart and are not shared between instances. Both are acceptable while nothing
  depends on the API and must be solved (a real store) before a room is switched over to it.
- With no authentication, a session id is the only thing that protects a session. The id is a random GUID; that is
  enough for a development API and not enough for records that matter.
