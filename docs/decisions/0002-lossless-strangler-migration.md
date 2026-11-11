# 0002 — Migrate as a lossless strangler: keep the legacy client, cut it into fragments, grow the server under it

Status: accepted · 2026-11-11

## Context

The brief asks for zero regression and a frozen user interface. The legacy client is about 13,600 lines of
JavaScript whose behaviour is known only from itself: the ER room alone holds roughly 3,300 lines of Arabic
dialect reading and conversation rules, tuned against paid live checks. Rewriting that on the server in one step
could not be shown to preserve behaviour, and a room whose engine runs in the browser needs its case data there.

## Decision

1. The browser-side client keeps running, unchanged in behaviour.
2. Each legacy script is cut at statement boundaries into cohesive source files ("fragments") under
   `src/Nabd.Web/ClientScripts/<bundle>/`. The cut was proposed by the legacy audit and is recorded in
   `tools/migration/split-plan.json`. A fragment's code is the legacy code; nothing is rewritten.
3. `ClientBundleProvider` joins the fragments of a bundle, in the order of `bundles.json`, by plain concatenation.
   For a script that lives inside one wrapper function, `_open.txt` and `_close.txt` hold the wrapper's first and
   last lines.
4. Every intentional difference from the legacy site is registered in `tests/Nabd.Tests/LegacyBaseline/seams.json`
   with its reason. `LegacySiteBaselineTests` undoes the registered differences on what the application serves
   and requires the result to equal the frozen legacy file exactly.
5. Server-side capability is built next to the client (domain model, use cases, session API) and proved equal to
   the client by golden masters before any room is switched over to it.

## Consequences

- A regression in what the browser receives cannot pass the test run: one changed character fails a test that
  names the file and the line.
- The 183 fragments are small enough to read, review and move one at a time; each carries the layer its
  responsibility belongs to (see the `README.md` of each bundle folder).
- The client's known weaknesses are preserved along with its behaviour. They are listed in `docs/legacy-audit.md`;
  fixing one is a registered, reviewed change, not a side effect of the migration.
- The rule against exposing clinical evaluation data to the browser is not met for the legacy rooms until their
  engines move to the server (`docs/architecture.md`, "What is honest to say about data exposure").
- Editing a fragment changes what the browser receives, so the baseline test fails until the change is registered
  as a seam. That friction is intended while the client is frozen.
