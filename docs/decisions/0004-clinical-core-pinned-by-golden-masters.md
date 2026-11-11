# 0004 — The clinical core is ported rule for rule and pinned by golden masters

Status: accepted · 2026-11-11

## Context

The clinical rules of the ER room (how risk moves, what the monitor shows, what a treatment or a harm does, how a
session is scored) existed only inside `er.js`, interleaved with rendering and conversation. They are the part of
the system whose silent change would matter most, and nobody can review them by eye for equivalence.

## Decision

- The clinical core is ported to `Nabd.Domain` as `SimulationSession` and `SessionScorer`, keeping the legacy order
  of arithmetic operations so that results are the same IEEE-754 doubles.
- The legacy code is the oracle. `tests/legacy-baseline/record-er-clinical.js` runs the real `er.js` in a Node
  sandbox with a seeded random source and a fake clock, with recording hooks placed by exact text
  (`instrument-er.js`; a hook that no longer fits the script aborts the recording). It writes 45 traces: every input
  the clinical core received, in the order the legacy code handled it, and the state after each step.
- `ErClinicalTraceTests` replays each trace through the domain model and requires **exact equality** of every
  number after every step (simulated time, risk, stage, cuff reading, five vital signs, net risk rate), of the
  records (interventions, harms, tests, slowings), and of the final score, its six parts and the verdict.
- The scenarios cover all six cases in seven families (a fixed 40-message conversation offline and with a stub
  service, neglect to arrest, ideal care, late and repeated care, harmful orders including the allergic one, the
  nurse's room) plus three rescues (ventricular tachycardia and shock, the planned collapse, supportive care held
  until the cause is treated).

## Scope: what is and is not ported

| Ported and pinned | Not ported in this phase (still in the browser) |
|---|---|
| `vitalsAt`, `modsNow`, `live`, `netRate`, `tick`, `stageCheck`, the cuff cycle | Reading the trainee's text; dose parsing and dose checks |
| `give`, `harm`, `submitTest`, the delayed effects (adrenaline in anaphylaxis, shock in VT, harm) | Deciding that an order is unsafe (`unsafe`, `tooEarly`, `allergicTo`, `offCase`) |
| `score`, `dispoCheck`, `fell`, the failure list of `conclude` (doctor role) | The nurse role's handover grade and score |
| | The conversation: who speaks next, what they say |

## Consequences

- A change to a clinical number fails the test run and names the step and the field. Changing a rule on purpose
  means re-recording the golden masters from a legacy script that has the same change, or accepting a reviewed
  difference in the test.
- A mutation check was run by hand when the tests were written: changing one constant of the model failed 33 of
  the 45 traces; changing one scoring weight failed 12. The constant was the delay before a treatment
  starts to move the vital signs (0.03 simulated minutes, changed to 0.04); the weight was the cost of an unneeded
  order (2 points, changed to 3). Both were restored; the check is not automated.
- The recorder needs Node.js; the tests themselves do not (the traces are committed).
- The traces pin the model to the legacy behaviour, including anything in it that a physician might later correct.
  They say nothing about clinical correctness.
