# 0005 — Legacy data stays as it is, behind repositories

Status: accepted · 2026-11-11

## Context

Eight JSON files carry the cases, the language resources and the weights of three small models. The brief forbids
rebuilding the datasets or retraining the models. On the static site the files were public: any visitor could
download them, including diagnoses, expected steps and scoring hints.

## Decision

- The files move, byte for byte, to `src/Nabd.Infrastructure/LegacyData/Files/`. Git is told not to convert their
  line endings, and a test compares each served document with the SHA-256 of the legacy file.
- `LegacyDataFiles` is the only code that opens them, and only by a known name: a caller cannot name a path.
- The application reads cases through `IClinicalCaseRepository`. `ErCaseFileMapper` maps the fields the clinical core
  uses to typed domain objects and keeps the order of entries, which the scoring rules depend on.
- The browser-side rooms still load their documents, so `IClientDataDocumentSource` serves them through
  `ClientDataController` at the paths the client already uses (`/data/<name>.json`). They are no longer static
  files.
- The models are not executed on the server in this phase. Their weights are served to the client as before.

## Consequences

- Nothing outside the infrastructure layer knows there are JSON files.
- **Exposure is unchanged for the legacy rooms**: a trainee who looks can still download a case file. What each
  file reveals is listed in `docs/data-catalog.md`. A document leaves `IClientDataDocumentSource` when its room
  moves to the server; that is the measure of progress on this rule.
- The file's own flag `reviewed: false` (the clinical content was not reviewed by a physician) is exposed by the
  repository and pinned by a test, so no layer can claim otherwise by accident.
- Integrity notes found by the audit (for example, results listed for tests the catalog does not have) are kept as
  they are and documented, not repaired: repairing data is a clinical-content change.
