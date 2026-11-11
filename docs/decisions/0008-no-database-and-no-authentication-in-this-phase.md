# 0008 — No database and no authentication in this phase

Status: accepted · 2026-11-11

## Context

The legacy site has no server. Accounts, roles, progress, professor notes and published grades live in the
visitor's browser (`localStorage`, mirrored into `window.name`); five demo accounts are built into the script (the
sign-in page offers three), and anyone can sign in as the professor. The audit lists this among its high-severity
problems (H1 to H3 in `docs/legacy-audit.md`).
The brief for this phase is an architectural refactoring with a frozen interface and zero regression.

## Decision

- This phase adds no database and no server-side identity. The sign-in page, the demo accounts and the browser
  storage behave exactly as before.
- No server-side code may rely on a role, a user id or any other claim from the browser. Nothing in this phase
  does: the understanding-service relay and the session API are the same for every caller, limited per address.
- The session API is off by default (decision 0007).

## Why not now

Real accounts change what the user sees and does (registration, password rules, recovery, what happens to progress
stored in the browser) and need decisions the brief does not give: who may register, which university data is
real, where personal data is stored and for how long. Adding them silently would break both the frozen interface
and the zero-regression objective, and would put personal data on a server without those decisions.

## Consequences

- The page still shows a "sign-in" that is not a security boundary. This must stay clear to anyone presenting the
  system: grades and reports shown in the professor portal are demo data in one browser.
- The next phase that needs identity (saving results on the server, a real professor portal) starts with an
  identity decision: ASP.NET Core Identity or an external provider, and a store.
- Until then, anything the application stores server-side is anonymous and short-lived by design.
